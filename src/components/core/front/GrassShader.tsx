import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh, BufferGeometry, BufferAttribute, DoubleSide, Sphere } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  vertexColor, positionWorld, mx_noise_vec3, vec3, vec2, time, uniform, float, hash,
  attribute, positionLocal, vertexIndex, cameraPosition, normalize, cross,
  add, sub, div, mul, Loop, distance, smoothstep, select,
} from 'three/tsl';
import { groundPatchXZR, groundPatchCount, filterSpawnsByPatches } from '../../../decorations/groundPatchUniforms';

// Grass spawns are [x,y,z] triplets.
const GRASS_SPAWN_STRIDE = 3;
import { alea } from 'seedrandom';
import { createDarknessNode } from './terrainDarkness';
import { createAudioPulseNode } from './terrainAudio';
import { useChunkProximityVisible } from './useChunkProximityVisible';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';
import type { BakedMesh } from '../../../terrain/TerrainWorkerClient';
import { buildGrassDecoration, GRASS_PARAMS } from '../../../workers/decorations/grassBuilder';

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

interface GrassShaderProps {
  chunkX: number;
  chunkZ: number;
  seed: string;
  width: number;
  height: number;
  heightScale: number;
  scale: number;
  noiseOctaves: number;
  noisePersistence: number;
  noiseLacunarity: number;
  segments: number;
  heightData: Float32Array;
  colorData?: Float32Array;
  /** Per-vertex baked road strength. Only used by the self-generate FALLBACK
   *  (no worker): the worker path already returns road-free precomputedSpawns. */
  roadStrength?: Float32Array;
  playerPosition?: Vector3;
  biomeDensity?: number;
  precomputedSpawns?: Float32Array;
}

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/* ── Shared grass wind material node ──────────────────────────────────
 *
 * Port of tslfx's `createPositionNode` (the TSL half of `grass()`). It
 * billboards each blade toward the camera and applies wind sway, reading
 * the per-vertex `bladeHeight` / `bladeWidth` attributes baked by the
 * worker builder. The node graph is stateless and per-chunk-independent,
 * so it's built once and shared by every chunk's material. (Wind params
 * come from GRASS_PARAMS so they can't drift from the builder.)
 */
let _grassPositionNode: any = null;
function getGrassPositionNode(): any {
  if (_grassPositionNode) return _grassPositionNode;

  const bladeHeight = attribute('bladeHeight');
  const bladeWidth = attribute('bladeWidth');
  // vertIdx = vertexIndex % 3 — picks left base (0), tip (1), right base (2).
  const vertIdx = vertexIndex.sub(vertexIndex.div(3).toInt().mul(3));
  const worldPos = positionWorld;
  const toCameraDir = normalize(sub(cameraPosition, worldPos));
  const up = vec3(0, 1, 0);
  const right = normalize(cross(up, toCameraDir));
  const billboardUp = normalize(cross(toCameraDir, right));
  const biasedUp = normalize(add(billboardUp, mul(vec3(0, 1, 0), GRASS_PARAMS.upBias)));
  const topCenter = mul(biasedUp, bladeHeight);
  const leftBase = mul(right, mul(bladeWidth, -0.5));
  const rightBase = mul(right, mul(bladeWidth, 0.5));
  const windNoise = mx_noise_vec3(
    add(div(worldPos, GRASS_PARAMS.windSize), mul(time, GRASS_PARAMS.windSpeed)),
  );
  const finalWindOffset = mul(
    windNoise,
    vec3(GRASS_PARAMS.windDisplacement, 0, GRASS_PARAMS.windDisplacement),
  );
  const localOffset = vertIdx.equal(0).select(
    leftBase,
    vertIdx.equal(1).select(add(topCenter, finalWindOffset), rightBase),
  );

  // Clear grass out of "dirt-surrounded" decoration patches (campfire
  // clearings). Collapse the blade's billboard offset toward zero inside
  // a patch so the triangle degenerates and disappears. Only clears where
  // the patch radius is POSITIVE (sign carries the clearGrass flag).
  const clearMask = float(0).toVar();
  Loop(groundPatchCount.toInt(), ({ i }: { i: any }) => {
    const xzr = groundPatchXZR.element(i);
    const d = distance(worldPos.xz, vec2(xzr.x, xzr.y));
    const dn = d.div(xzr.z.abs().max(float(0.001)));
    // Clear slightly inside the dirt rim so blades don't fringe the edge.
    const m = smoothstep(float(0.95), float(0.78), dn);
    const clears = select(xzr.z.greaterThan(float(0)), m, float(0));
    clearMask.assign(clearMask.max(clears));
  });
  // (Road grass-clearing is done by FILTERING the blade spawns at build time —
  // see the build effect's filterSpawnsByPatches — not a shader collapse, which
  // proved unreliable for paths. No per-fragment path loop here.)
  const clearFactor = float(1).sub(clearMask);

  _grassPositionNode = add(positionLocal, localOffset.mul(clearFactor));
  return _grassPositionNode;
}

/* ── Shared grass color node + materials ──────────────────────────────
 *
 * The color graph (vertex tint × patch noise × wind-shadow noise ×
 * day/night darkness) depends only on world position, `time`, and the
 * module-shared time-of-day uniform from terrainDarkness — nothing
 * per-chunk. One node graph + one steady-state material serve every
 * chunk; only the ~400ms fade-in needs a per-chunk uniform, so a chunk
 * carries a small private material during the fade and swaps to the
 * shared singleton when it completes. (Per-chunk node materials each
 * pay WebGPURenderer cache-key/observer cost every frame.)
 */
let _grassColorNode: any = null;
function getGrassColorNode(): any {
  if (_grassColorNode) return _grassColorNode;

  const baseColor = vertexColor();
  const worldPos = positionWorld;

  const patchNoiseScale = 0.03;
  const patchInput = vec3(worldPos.x.mul(patchNoiseScale), worldPos.z.mul(patchNoiseScale), 0);
  const patchVariation = mx_noise_vec3(patchInput).x.mul(0.15).add(0.92);

  const windTime = time.mul(0.25);
  const windShadowScale = 0.12;
  const shadowInput = vec3(
    worldPos.x.mul(windShadowScale).add(windTime.mul(2.0)),
    worldPos.z.mul(windShadowScale).add(windTime.mul(1.4)),
    0
  );
  const shadowEffect = mx_noise_vec3(shadowInput).x.mul(0.25).add(0.88);

  _grassColorNode = baseColor.mul(patchVariation).mul(shadowEffect).mul(createDarknessNode()).mul(createAudioPulseNode(0.4));
  return _grassColorNode;
}

let _sharedGrassMaterial: MeshBasicNodeMaterial | null = null;
function getSharedGrassMaterial(): MeshBasicNodeMaterial {
  if (_sharedGrassMaterial) return _sharedGrassMaterial;
  const mat = new MeshBasicNodeMaterial();
  mat.positionNode = getGrassPositionNode();
  mat.colorNode = getGrassColorNode();
  mat.side = DoubleSide;
  // Steady-state grass is fully opaque — keeping it out of the
  // transparent pass avoids per-frame depth sorting against water.
  mat.transparent = false;
  _sharedGrassMaterial = mat;
  return mat;
}

/** Per-chunk fade-in material: shared position/color nodes + a private
 *  fade uniform driving the cluster-staggered opacity. Disposed (and the
 *  mesh swapped to the shared singleton) when the fade completes. */
function createGrassFadeMaterial(fadeProgressUniform: any): MeshBasicNodeMaterial {
  const mat = new MeshBasicNodeMaterial();
  mat.positionNode = getGrassPositionNode();
  mat.colorNode = getGrassColorNode();

  const worldPos = positionWorld;
  const clusterPos = vec3(worldPos.x.mul(0.3), worldPos.z.mul(0.3), 0);
  const fadeDelay = hash(clusterPos);
  const spreadDuration = float(0.6);
  mat.opacityNode = fadeProgressUniform.sub(fadeDelay.mul(spreadDuration))
    .div(float(1.0).sub(spreadDuration))
    .clamp(0, 1);

  mat.side = DoubleSide;
  mat.transparent = true;
  return mat;
}

/** Wrap a worker-built BakedMesh into a BufferGeometry, attaching the two
 *  per-vertex blade scalar attributes the wind positionNode reads. */
function bladesToGeometry(bm: BakedMesh, boundsRadius: number): BufferGeometry | null {
  if (!bm || bm.positions.length === 0 || bm.indices.length === 0) return null;
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(bm.positions, 3));
  // Grass carries no normals (unlit billboard material) — skip the attribute.
  if (bm.normals.length) geom.setAttribute('normal', new BufferAttribute(bm.normals, 3));
  if (bm.colors) geom.setAttribute('color', new BufferAttribute(bm.colors, 3));
  if (bm.bladeHeight) geom.setAttribute('bladeHeight', new BufferAttribute(bm.bladeHeight, 1));
  if (bm.bladeWidth) geom.setAttribute('bladeWidth', new BufferAttribute(bm.bladeWidth, 1));
  geom.setIndex(new BufferAttribute(bm.indices, 1));
  // Manual conservative bounding sphere — computeBoundingSphere() is an
  // O(N) scan over the largest per-chunk decoration buffer (same contract
  // as trees/shrubs).
  geom.boundingSphere = new Sphere(new Vector3(0, 0, 0), boundsRadius);
  return geom;
}

export const GrassShader = ({
  chunkX,
  chunkZ,
  seed,
  width,
  height,
  heightScale,
  segments,
  heightData,
  colorData,
  roadStrength,
  playerPosition,
  biomeDensity = 1,
  precomputedSpawns,
}: GrassShaderProps) => {
  const meshRef = useRef<Mesh>(null);
  const fadeStartTimeRef = useRef<number | null>(null);
  const chunkKey = `${chunkX}-${chunkZ}`;
  const opacityRef = useRef(1);

  const progressiveLoadStartRef = useRef<number | null>(null);
  const currentOpacityRef = useRef(0);

  const fadeProgressUniformRef = useRef(uniform(0));
  // Per-chunk material that exists only while the fade-in runs; null once
  // the mesh has been swapped to the shared singleton.
  const fadeMaterialRef = useRef<MeshBasicNodeMaterial | null>(null);

  useEffect(() => {
    fadeProgressUniformRef.current.value = currentOpacityRef.current;
  }, []);

  // Per-frame proximity gate (see useChunkProximityVisible) — a useMemo here
  // only re-evaluated on re-render, freezing visibility between chunk streams.
  // Grass defaults visible before a player position exists.
  const shouldRenderGrass = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height, 1.4, 1.8, true,
  );

  // Use ref for generation readiness + version counter to trigger the build
  // effect. Avoids a separate boolean state that causes an extra render cycle.
  const generationReadyRef = useRef(false);
  const [generationTick, setGenerationTick] = useState(0);

  useEffect(() => {
    const random = alea(`${seed}-gendelay-${chunkX}-${chunkZ}`);
    const chunkDist = Math.sqrt(chunkX * chunkX + chunkZ * chunkZ);
    const distDelay = Math.min(chunkDist * 250, 2000);
    const baseDelay = isMobile ? (400 + random() * 800) : (200 + random() * 500);
    const delay = baseDelay + distDelay;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (typeof requestIdleCallback !== 'undefined') {
        (window as any).requestIdleCallback(
          () => {
            if (!cancelled) {
              generationReadyRef.current = true;
              setGenerationTick(1);
            }
          },
          { timeout: 3000 }
        );
      } else {
        generationReadyRef.current = true;
        setGenerationTick(1);
      }
    }, delay);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [seed, chunkX, chunkZ]);

  /**
   * Derive grass spawn positions ([x,y,z,...] triplets). Prefer the WASM
   * precomputed spawns; fall back to the main-thread per-vertex scan only
   * when they're absent (worker/WASM unavailable).
   */
  const deriveSpawnPositions = (): Float32Array | null => {
    if (precomputedSpawns && precomputedSpawns.length > 0) {
      return precomputedSpawns;
    }
    if (!heightData || heightData.length === 0) return null;

    const random = alea(`${seed}-grass-${chunkX}-${chunkZ}`);

    const noise2D = (x: number, z: number, frequency: number) => {
      const seedRandom = alea(seed);
      const offset1 = seedRandom() * 100;
      const offset2 = seedRandom() * 100;

      return (
        Math.sin(x * frequency + offset1) * Math.cos(z * frequency + offset2) +
        Math.sin(x * frequency * 2.3 + offset2) * Math.cos(z * frequency * 1.7 + offset1) +
        Math.sin(x * frequency * 0.5 + offset1 * 2) * Math.cos(z * frequency * 0.8 + offset2 * 2)
      ) / 3;
    };

    const validPositions: number[] = [];
    const verticesPerSide = segments + 1;

    const getHeightAt = (x: number, z: number): number => {
      if (x < 0 || x > segments || z < 0 || z > segments) return 0;
      const idx = z * verticesPerSide + x;
      return heightData[idx * 3 + 1];
    };

    for (let z = 0; z <= segments; z++) {
      for (let x = 0; x <= segments; x++) {
        const idx = z * verticesPerSide + x;
        if (roadStrength && roadStrength[idx] > 0.4) continue;   // no grass on roads
        const vx = heightData[idx * 3];
        const vy = heightData[idx * 3 + 1];
        const vz = heightData[idx * 3 + 2];
        const normalizedHeight = mapRange(vy, -heightScale, heightScale, 0, 1);

        let isGreen = true;
        if (colorData && colorData.length > 0) {
          const cr = colorData[idx * 3];
          const cg = colorData[idx * 3 + 1];
          const cb = colorData[idx * 3 + 2];
          isGreen = cg > cr * 1.1 && cg > cb * 1.1;
        }

        if (isGreen && normalizedHeight > 0.50 && normalizedHeight < 0.58) {
          const slopeX = Math.abs(getHeightAt(x + 1, z) - getHeightAt(x - 1, z));
          const slopeZ = Math.abs(getHeightAt(x, z + 1) - getHeightAt(x, z - 1));
          const slopeMagnitude = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);

          if (slopeMagnitude < 6.0) {
            const noiseValue = noise2D(vx, vz, 0.15);
            const noiseDensity = (noiseValue + 1) * 0.5;
            const densityMultiplier = (isMobile ? 0.15 : 0.35) * biomeDensity;
            if (random() < noiseDensity * densityMultiplier) {
              validPositions.push(vx, vy - 0.35, vz);
            }
          }
        }
      }
    }

    if (validPositions.length === 0) return null;
    return new Float32Array(validPositions);
  };

  // Blade geometry is built off the main thread by the worker
  // (`grassBuilder.ts`), then wrapped into a BufferGeometry here. This
  // replaced the synchronous tslfx `grass()` call that expanded ~400k
  // vertices on the main thread and dropped a frame on every chunk-cross.
  const [bladeGeometry, setBladeGeometry] = useState<BufferGeometry | null>(null);
  const geomRef = useRef<BufferGeometry | null>(null);

  useEffect(() => {
    if (!generationReadyRef.current) return;

    const raw = deriveSpawnPositions();
    if (!raw || raw.length === 0) return;
    // Drop grass blades on a dirt apron / clearing (ground patch). Blades on
    // ROADS are already removed in the worker (it filters the grass spawn array
    // against the baked road network before this chunk's geometry is built).
    const positions = filterSpawnsByPatches(
      raw, GRASS_SPAWN_STRIDE, chunkX, chunkZ, width, height,
    );
    if (!positions || positions.length === 0) { setBladeGeometry(null); return; }

    let aborted = false;
    // Cancel the queued build on scroll-away (see ProceduralTrees).
    const abort = new AbortController();
    const rngSeedSalt = `${seed}-${chunkX}-${chunkZ}`;

    const apply = (blades: BakedMesh | undefined | null) => {
      if (aborted || !blades) return;
      const geom = bladesToGeometry(blades, Math.hypot(width, height) + 80);
      if (!geom) return;
      if (geomRef.current) geomRef.current.dispose();
      geomRef.current = geom;
      setBladeGeometry(geom);
    };

    const fallback = () => {
      try {
        apply(buildGrassDecoration({
          spawns: new Float32Array(positions),
          isMobile,
          rngSeedSalt,
        }).blades);
      } catch (e) {
        console.error('[GrassShader] main-thread grass build failed', e);
      }
    };

    terrainWorker
      .buildDecorationGeometry('grass', positions, 0, 0, isMobile, rngSeedSalt, undefined,
        { signal: abort.signal, centerX: chunkX * width, centerZ: chunkZ * height })
      .then((result) => {
        if (aborted) return;
        if (result && result.groups.blades) {
          apply(result.groups.blades);
        } else {
          fallback();
        }
      })
      .catch((err) => {
        if (aborted) return;
        console.warn('[GrassShader] worker grass build failed, falling back', err);
        fallback();
      });

    return () => { aborted = true; abort.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationTick, precomputedSpawns, roadStrength, chunkX, chunkZ, seed, segments, heightScale]);

  // Dispose the geometry when the chunk unmounts.
  useEffect(() => () => {
    if (geomRef.current) { geomRef.current.dispose(); geomRef.current = null; }
  }, []);

  const hasEverBeenVisibleRef = useRef(new Set<string>());
  const initialDelayRef = useRef<number | null>(null);

  const calculateDelay = (chunkX: number, chunkZ: number) => {
    const random = alea(`${seed}-delay-${chunkX}-${chunkZ}`);
    return random() * 800;
  };

  useEffect(() => {
    if (shouldRenderGrass && !hasEverBeenVisibleRef.current.has(chunkKey)) {
      hasEverBeenVisibleRef.current.add(chunkKey);

      if (initialDelayRef.current === null) {
        initialDelayRef.current = calculateDelay(chunkX, chunkZ);
      }

      opacityRef.current = 0;
      currentOpacityRef.current = 0;
      fadeStartTimeRef.current = 0;
      progressiveLoadStartRef.current = null;
    } else if (shouldRenderGrass && hasEverBeenVisibleRef.current.has(chunkKey)) {
      opacityRef.current = 1;
      currentOpacityRef.current = 1;
      fadeStartTimeRef.current = null;
      progressiveLoadStartRef.current = null;
      // Re-entering visibility (possibly mid-fade): jump straight to the
      // shared steady-state material.
      fadeProgressUniformRef.current.value = 1;
      if (fadeMaterialRef.current) {
        if (meshRef.current) meshRef.current.material = getSharedGrassMaterial();
        fadeMaterialRef.current.dispose();
        fadeMaterialRef.current = null;
      }
    } else {
      opacityRef.current = 0;
      currentOpacityRef.current = 0;
      fadeStartTimeRef.current = null;
      progressiveLoadStartRef.current = null;
    }
  }, [shouldRenderGrass, chunkKey, chunkX, chunkZ, seed]);

  useFrame((state) => {
    if (!meshRef.current) return;

    if (fadeStartTimeRef.current === null) return;

    if (fadeStartTimeRef.current === 0) {
      fadeStartTimeRef.current = state.clock.elapsedTime;
    }

    const timeSinceStart = (state.clock.elapsedTime - fadeStartTimeRef.current) * 1000;
    const chunkDelay = initialDelayRef.current || 0;

    if (timeSinceStart < chunkDelay) {
      currentOpacityRef.current = 0;
      fadeProgressUniformRef.current.value = 0;
      return;
    }

    if (progressiveLoadStartRef.current === null) {
      progressiveLoadStartRef.current = state.clock.elapsedTime;
    }

    const fadeElapsed = (state.clock.elapsedTime - progressiveLoadStartRef.current) * 1000;
    const fadeDuration = 400;
    const newOpacity = Math.min(fadeElapsed / fadeDuration, 1);

    currentOpacityRef.current = newOpacity;
    opacityRef.current = newOpacity;

    fadeProgressUniformRef.current.value = newOpacity;

    if (newOpacity >= 1) {
      fadeStartTimeRef.current = null;
      progressiveLoadStartRef.current = null;
      // Fade done — swap to the shared singleton so this chunk stops
      // paying per-material renderer overhead, and drop the fade material.
      if (fadeMaterialRef.current) {
        meshRef.current.material = getSharedGrassMaterial();
        fadeMaterialRef.current.dispose();
        fadeMaterialRef.current = null;
      }
    }
  });

  // Dispose a still-pending fade material when the chunk unmounts.
  useEffect(() => () => {
    if (fadeMaterialRef.current) {
      fadeMaterialRef.current.dispose();
      fadeMaterialRef.current = null;
    }
  }, []);

  if (!bladeGeometry || !shouldRenderGrass) return null;

  // A fade is pending (first visibility) — create the chunk's private fade
  // material lazily on the render where the mesh first appears.
  if (fadeStartTimeRef.current !== null && !fadeMaterialRef.current) {
    fadeMaterialRef.current = createGrassFadeMaterial(fadeProgressUniformRef.current);
  }
  const material = fadeMaterialRef.current ?? getSharedGrassMaterial();

  return (
    <mesh
      ref={meshRef as any}
      geometry={bladeGeometry}
      material={material}
      matrixAutoUpdate={false}
      userData={{ camExcludeCollision: true }}
      raycast={() => null}
    />
  );
};
