/**
 * WaterShader (WebGPU/TSL) — shore-aware animated water.
 *
 * The plane is subdivided and displaced in the vertex stage by waves whose
 * amplitude/phase derive from a worker-built shore-distance field (see
 * src/workers/waterField.ts):
 *   R = d — distance into the water from the nearest shore (world units)
 *   G = D — that water body's max d ("openness")
 *
 * Wave model (user spec): each visible water body is calm at its CENTER,
 * waves grow toward and reach the SHORES, larger/open bodies get bigger
 * waves, and too-skinny channels (D below a threshold) stay flat.
 *   A = baseAmp · smoothstep(minW, fullW, D)      — openness gate
 *         · (1 − smoothstep(0.55, 1, d/D))        — calm center
 *         · smoothstep(0, 1.5, d)                 — clip fade at the shoreline
 *   θ = d·k − t·ω                                 — crests travel toward shore
 *                                                   (along −∇d) for free
 *
 * Per-frame cost is 100% GPU. The field rebuilds in the (otherwise idle)
 * terrain worker on water-center snaps and debounced chunk loads, into ONE
 * persistent half-float DataTexture (RG16F — filterable on both WebGPU and
 * WebGL2; float32 would need an optional WebGPU feature to filter).
 *
 * Physics note: swim detection is a flat Y threshold in Player.jsx with a
 * +0.8 margin — waves are cosmetic-only. BASE_AMP must stay < 0.8.
 */
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  color, float, mix, mx_noise_vec3, time, uv, vec2, vec3, uniform,
  positionLocal, texture, smoothstep, sin,
} from 'three/tsl';
import {
  Mesh, DoubleSide, DataTexture, RGFormat, HalfFloatType,
  LinearFilter, ClampToEdgeWrapping, DataUtils, Vector4,
} from 'three';
import { createDarknessNode } from './terrainDarkness';
import { useTerrainChunkStore } from './terrainChunkStore';
import { setShoreWaterField } from './ProceduralTerrain';
import { setWaterSplashTarget } from './waterSplash';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const FIELD_TEX_SIZE = 256;
const PLANE_SEGMENTS = isMobile ? 96 : 160;
/** Max wave height — MUST stay below the 0.8 swim-detection margin. */
const BASE_AMP = 0.45;
/** Water bodies narrower than this stay flat; full amplitude by fullW. */
// Body-size threshold on the field's G ("openness" — see waterField.ts:
// min(local open-water-within-25u, body area equivalent radius)). Bodies
// under MIN stay completely flat — puddles, ponds, and the skinny
// branches of larger bodies have no fetch for wind waves.
const MIN_BODY_WIDTH = 14.0;
const FULL_BODY_WIDTH = 40.0;

/**
 * Splash pool — fixed-cap uniform slots (same fixed-cap-uniform pattern as
 * groundPatchUniforms). Each slot is vec4(worldX, worldZ, age, strength);
 * a free slot has age > SPLASH_DURATION so its contribution is zero.
 *
 * The splash is FRAGMENT-ONLY foam: the plane's vertices are ~4.4u apart
 * (700u / 160 segments), so a 1-5u ring can't resolve as displacement —
 * and staying out of positionNode keeps the 0.8 swim-margin math untouched.
 */
const SPLASH_SLOTS = 4;
const SPLASH_DURATION = 0.9; // seconds
/** Splash foam never exceeds this mix toward white — keeps it a feathered
 *  water-toned wash (a full-white splash read as a flash, worst at night). */
const SPLASH_MAX_FOAM = 0.4;

interface WaterShaderProps {
  width: number;
  height: number;
  waterLevel?: number;
  positionY: number;
  /** Terrain chunk dimensions (for the worker's mask-cache lookup).
   *  Defaults to width/7 — the plane spans (2·RD+1)=7 chunks. */
  chunkWidth?: number;
  chunkHeight?: number;
}

export function WaterShader({
  width,
  height,
  positionY,
  chunkWidth = width / 7,
  chunkHeight = height / 7,
}: WaterShaderProps) {
  const meshRef = useRef<Mesh>(null);
  const initialCenter = useTerrainChunkStore.getState();

  // ── Persistent shore-distance texture (mutated in place, never swapped:
  // the material compiles once and keeps this exact texture binding). ──
  const fieldState = useMemo(() => {
    const data = new Uint16Array(FIELD_TEX_SIZE * FIELD_TEX_SIZE * 2); // zeros = flat water
    const tex = new DataTexture(data, FIELD_TEX_SIZE, FIELD_TEX_SIZE, RGFormat, HalfFloatType);
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return {
      tex,
      data,
      uOriginX: uniform(0),
      uOriginZ: uniform(0),
      uExtentInv: uniform(1 / Math.max(1, width)),
      uCenterX: uniform(initialCenter.waterCenterX),
      uCenterZ: uniform(initialCenter.waterCenterZ),
      uReady: uniform(0),
      requestId: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild the field from the worker's cached chunk masks. Stale
  // responses (an older request resolving after a newer one) are dropped.
  const rebuildField = useMemo(() => {
    return (centerX: number, centerZ: number) => {
      const myId = ++fieldState.requestId;
      terrainWorker
        .buildWaterField(centerX, centerZ, width, FIELD_TEX_SIZE, chunkWidth, chunkHeight)
        .then((field) => {
          if (!field || myId !== fieldState.requestId) return;
          const src = field.data;
          const dst = fieldState.data;
          const n = Math.min(src.length, dst.length);
          for (let i = 0; i < n; i++) {
            dst[i] = DataUtils.toHalfFloat(src[i]);
          }
          fieldState.tex.needsUpdate = true;
          fieldState.uOriginX.value = field.originX;
          fieldState.uOriginZ.value = field.originZ;
          fieldState.uExtentInv.value = 1 / field.extent;
          fieldState.uReady.value = 1;
          // Share the field with the terrain material — its shore wash
          // gates on the G channel (body size) so puddle rims don't foam.
          setShoreWaterField(fieldState.tex, field.originX, field.originZ, 1 / field.extent);
        })
        .catch(() => { /* worker unavailable — water stays flat */ });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, chunkWidth, chunkHeight]);

  useEffect(() => {
    // Initial build + follow the water-center snaps.
    rebuildField(initialCenter.waterCenterX, initialCenter.waterCenterZ);

    const unsub = useTerrainChunkStore.subscribe((state) => {
      if (meshRef.current) {
        meshRef.current.position.x = state.waterCenterX;
        meshRef.current.position.z = state.waterCenterZ;
      }
      if (
        state.waterCenterX !== fieldState.uCenterX.value ||
        state.waterCenterZ !== fieldState.uCenterZ.value
      ) {
        fieldState.uCenterX.value = state.waterCenterX;
        fieldState.uCenterZ.value = state.waterCenterZ;
        rebuildField(state.waterCenterX, state.waterCenterZ);
      }
    });

    // Debounced rebuild as chunks stream in (their masks reach the worker
    // cache during generate_terrain, before this event fires).
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const onChunkLoaded = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        rebuildField(fieldState.uCenterX.value, fieldState.uCenterZ.value);
      }, 600);
    };
    window.addEventListener('terrainChunkLoaded', onChunkLoaded);

    return () => {
      unsub();
      window.removeEventListener('terrainChunkLoaded', onChunkLoaded);
      if (debounce) clearTimeout(debounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebuildField]);

  // Dispose the texture on unmount (single instance, but keep the contract).
  useEffect(() => () => { fieldState.tex.dispose(); }, [fieldState]);

  // ── Splash pool: vec4(worldX, worldZ, age, strength) per slot. Free
  // slots park at age > SPLASH_DURATION (zero contribution). ──
  const splashState = useMemo(() => ({
    uniforms: Array.from(
      { length: SPLASH_SLOTS },
      () => uniform(new Vector4(0, 0, SPLASH_DURATION + 1, 0)),
    ),
    next: 0,
  }), []);

  useEffect(() => {
    setWaterSplashTarget((x, z, strength) => {
      // Round-robin — a 5th concurrent splash evicts the oldest.
      const u = splashState.uniforms[splashState.next % SPLASH_SLOTS];
      splashState.next++;
      (u.value as Vector4).set(x, z, 0, strength);
    });
    return () => setWaterSplashTarget(null);
  }, [splashState]);

  // Age the active slots (a handful of uniform writes — no render work).
  useFrame((_, delta) => {
    for (const u of splashState.uniforms) {
      const v = u.value as Vector4;
      if (v.z <= SPLASH_DURATION) v.z += delta;
    }
  });

  const material = useMemo(() => {
    try {
      // Deepened from #2d5f6f / #3399ff — with the brighter originals plus
      // crest/foam highlights the midday water read as white.
      const deepBlue = color('#23505f');
      const lightBlue = color('#2a7fd0');

      const p = uv().sub(0.5).mul(12).add(0.5);
      const rawNoise = mx_noise_vec3(vec3(p, time.mul(0.3))).xxx;
      const adjustedNoise = float(0.5).add(float(0.5).mul(rawNoise));
      const baseColor = mix(deepBlue, lightBlue, adjustedNoise);

      const darknessNode = createDarknessNode();

      const waterMaterial = new MeshBasicNodeMaterial();

      // ── Shore-aware wave displacement (vertex stage) ──
      // Plane is rotated -π/2 about X: local +x → world +x, local +y →
      // world -z, local +z → world +y. So:
      const localPos = positionLocal;
      const worldX = localPos.x.add(fieldState.uCenterX);
      const worldZ = fieldState.uCenterZ.sub(localPos.y);
      const fieldUV = vec2(
        worldX.sub(fieldState.uOriginX).mul(fieldState.uExtentInv),
        worldZ.sub(fieldState.uOriginZ).mul(fieldState.uExtentInv),
      );
      const field = texture(fieldState.tex, fieldUV);
      const d = field.r;
      const D = field.g;

      // Skinny channels stay flat.
      const openness = smoothstep(float(MIN_BODY_WIDTH), float(FULL_BODY_WIDTH), D);

      // Proportionality: bigger bodies run bigger, LONGER waves. The
      // presence gate (`openness`) saturates at FULL_BODY_WIDTH; this
      // keeps growing to ~90u so a 40u pond gets modest ripples while a
      // real lake earns full rolling surf. Drives amplitude + wavelength.
      const sizeFactor = openness.mul(0.55)
        .add(smoothstep(float(40.0), float(90.0), D).mul(0.45));

      // Waves live in an ABSOLUTE band near the shore: rise over the first
      // 1.5u (terrain-clip fade), peak by ~6u, gone by ~28u — middles of
      // any body are flat regardless of its size. (The previous relative
      // d/D "center calm" never engaged on wide channels: D was huge, so
      // d/D stayed near 0 everywhere visible and the whole surface waved.)
      const shoreBand = smoothstep(float(0.0), float(1.5), d)
        .mul(float(1).sub(smoothstep(float(8.0), float(28.0), d)));

      // Blotchy patch mask — low-frequency noise drifting slowly breaks
      // the parallel "tie-dye" contour bands into irregular wave patches.
      // One extra noise sample in the vertex stage; no texture.
      const blotch = mx_noise_vec3(vec3(
        worldX.mul(0.045),
        worldZ.mul(0.045),
        time.mul(0.07),
      )).x.mul(0.5).add(0.5);
      const patch = blotch.mul(0.8).add(0.2); // 0.2..1.0

      // Swell: very-low-frequency, slowly drifting amplitude field so some
      // stretches of shore randomly run bigger waves than others (0.5×-1.5×).
      // Max total amplitude = BASE_AMP × 1.5 = 0.675, still under the 0.8
      // swim-detection margin.
      const swell = mx_noise_vec3(vec3(
        worldX.mul(0.012),
        worldZ.mul(0.012),
        time.mul(0.02),
      )).x.mul(0.5).add(0.5);
      const swellMul = swell.add(0.5); // 0.5..1.5

      const amp = float(BASE_AMP).mul(sizeFactor).mul(shoreBand).mul(patch).mul(swellMul).mul(fieldState.uReady);

      // Two superimposed sine trains marching toward shore (−∇d). The
      // blotch noise also jitters the phase so wavefronts wobble instead
      // of staying parallel to the shoreline. Wavelengths stretch with
      // body size (9→17u / 5→10u): ponds ripple, lakes roll.
      const waveLen1 = sizeFactor.mul(8.0).add(9.0);
      const waveLen2 = sizeFactor.mul(5.0).add(5.0);
      const phase1 = d.div(waveLen1).mul(Math.PI * 2).sub(time.mul(1.6)).add(blotch.mul(2.5));
      const phase2 = d.div(waveLen2).mul(Math.PI * 2).sub(time.mul(2.3)).add(worldX.mul(0.05));
      const waveY = sin(phase1).mul(0.7).add(sin(phase2).mul(0.3)).mul(amp);

      // local +z = world +y on the rotated plane.
      waterMaterial.positionNode = localPos.add(vec3(0, 0, waveY));

      // Subtle crest brightening — kept faint and masked by the same patch
      // noise so it reads as scattered glints, not contour stripes.
      const crest = sin(phase1).mul(0.5).add(0.5)
        .mul(amp.mul(1 / BASE_AMP)).mul(0.045);

      // ── Shore foam (fragment stage — these nodes re-evaluate per pixel,
      // including the field sample, so the foam edge is crisp) ──
      // A ragged white band hugging the shoreline, surging in sync with
      // the incoming crest train and speckled with bubble noise that
      // drifts/pops. Pure shader — no texture, no CPU.
      //
      // BAND WIDTH IS FIELD-RESOLUTION-BOUND: the distance field's texels
      // are ~2.7u (700u extent / 256), and land texels hold d=0 — so the
      // first VISIBLE water fragment already interpolates to d ≈ 1.5–2.7.
      // The original 2.8u band ended before any visible water began (no
      // foam anywhere). The band must span ≥ 2 texels (~7u) to exist.
      const foamLine = float(1).sub(smoothstep(float(0.0), float(7.0), d));
      const foamNoise = mx_noise_vec3(vec3(
        worldX.mul(0.9).add(time.mul(0.15)),
        worldZ.mul(0.9).sub(time.mul(0.11)),
        time.mul(0.2),
      )).x;
      const foamEdge = smoothstep(float(0.4), float(0.72), foamLine.add(foamNoise.mul(0.35)));
      // Surge with the wave train arriving at shore (phase1 travels along −∇d).
      const surge = sin(phase1).mul(0.35).add(0.65);
      // Bubble speckle just behind the foam line.
      const speckle = mx_noise_vec3(vec3(
        worldX.mul(2.8),
        worldZ.mul(2.8),
        time.mul(0.35),
      )).x;
      const bubbles = smoothstep(float(0.35), float(0.8), speckle)
        .mul(float(1).sub(smoothstep(float(1.0), float(9.0), d)))
        .mul(0.55);

      // ── Entry splashes: expanding ragged foam ring + fading center
      // burst per pool slot. Fragment-only (see SPLASH_SLOTS comment) —
      // strength scales ring speed and brightness. Inactive slots (age
      // past duration, or the initial park value) contribute exactly 0,
      // so the idle cost is a few ALU ops on already-computed worldX/Z.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let splashFoam: any = float(0);
      for (const su of splashState.uniforms) {
        const age = su.z;
        const strength = su.w;
        const life = age.div(SPLASH_DURATION);
        // Fade starts immediately and is gone by ~80% of the (short) life.
        const fade = float(1).sub(smoothstep(float(0.0), float(0.8), life))
          .mul(strength.mul(0.5).add(0.3));
        const dx = worldX.sub(su.x);
        const dz = worldZ.sub(su.y);
        const r = dx.mul(dx).add(dz.mul(dz)).sqrt();
        // Tight spread: ~3u max radius at full strength (was ~8u — read
        // from way across the lake).
        const ringR = age.mul(strength.mul(1.6).add(1.4)).add(0.25);
        const ring = smoothstep(ringR.sub(0.45), ringR.sub(0.08), r)
          .mul(float(1).sub(smoothstep(ringR, ringR.add(0.3), r)));
        const burst = float(1).sub(smoothstep(float(0.0), float(1.0), r)).mul(0.4);
        splashFoam = splashFoam.add(ring.add(burst).mul(fade));
      }
      // Ragged edge (reuses the bubble speckle noise), then cap the whole
      // effect at a feathered partial mix — never solid white.
      splashFoam = splashFoam.mul(speckle.mul(0.3).add(0.85))
        .clamp(0, 1).mul(SPLASH_MAX_FOAM);
      // Spatial patch gate: decides WHICH stretches of shore carry foam
      // right now (~55% coverage, smooth zero zones elsewhere). Without it
      // the foam was a uniform stroke along the whole coastline, pulsing
      // in unison. Reuses the already-sampled `blotch` noise (one fewer
      // per-fragment noise on the biggest screen surface); the terrain
      // wash derives its patch from the same blotch field, so the water
      // foam and the beach wash appear on the same stretches.
      const foamPatch = smoothstep(float(0.32), float(0.62), blotch);
      // Splashes bypass the patch/openness/ready gates — falling into a
      // pond or a skinny channel still splashes.
      const foamAmount = foamEdge.mul(surge).add(bubbles).clamp(0, 1)
        .mul(foamPatch)
        .mul(openness)                      // skinny channels: no waves, no foam
        .mul(fieldState.uReady)
        .add(splashFoam)
        .clamp(0, 1);

      const foamColor = vec3(0.92, 0.97, 1.0);
      const litColor = mix(baseColor.add(vec3(crest, crest, crest)), foamColor, foamAmount);
      waterMaterial.colorNode = litColor.mul(darknessNode);

      waterMaterial.transparent = true;
      // Foam reads solid — lift opacity toward 1 inside the foam band.
      // Base opacity 0.84 (was 0.7): the brighter sandy bottom bled through
      // and washed the daytime water toward white ("snow").
      waterMaterial.opacityNode = float(0.84).add(foamAmount.mul(0.16));
      waterMaterial.side = DoubleSide;
      waterMaterial.needsUpdate = true;

      return waterMaterial;
    } catch (error) {
      console.error('WaterShader material creation error:', error);
      const fallback = new MeshBasicNodeMaterial();
      fallback.colorNode = color('#3399ff');
      fallback.transparent = true;
      fallback.opacity = 0.84;
      fallback.side = DoubleSide;
      return fallback;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <mesh
      ref={meshRef}
      name="waterSurface"
      position={[initialCenter.waterCenterX, positionY, initialCenter.waterCenterZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      userData={{ camExcludeCollision: true }}
      raycast={() => null}
    >
      <planeGeometry args={[width, height, PLANE_SEGMENTS, PLANE_SEGMENTS]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
