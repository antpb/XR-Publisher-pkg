/**
 * WaterShader (WebGL twin) — shore-aware animated water.
 *
 * Same design as the WebGPU WaterShader.tsx: a worker-built RG shore-
 * distance field (R = distance into water from shore, G = water-body max
 * distance) drives vertex displacement so waves march toward shores, big
 * open bodies get bigger waves, body centers stay calm, and skinny
 * channels stay flat. Field sampling happens in the VERTEX shader
 * (texture2D vertex fetch — core WebGL2); the texture is half-float RG
 * (filterable everywhere).
 *
 * Also fixes a pre-existing inefficiency: the material was rebuilt on
 * every sky-time change (`useMemo([currentTime])`); it's now built once.
 */
import React, { useMemo, useRef, useEffect } from 'react';
import {
  Mesh, DoubleSide, ShaderMaterial, DataTexture, RGFormat, HalfFloatType,
  LinearFilter, ClampToEdgeWrapping, DataUtils,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { useTerrainChunkStore } from './terrainChunkStore';
import { getDarknessValueUniform } from './terrainDarkness';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const FIELD_TEX_SIZE = 256;
const PLANE_SEGMENTS = isMobile ? 96 : 160;
/** Must stay below the 0.8 swim-detection margin (see Player.jsx). */
const BASE_AMP = 0.45;
// Bodies under MIN_BODY_WIDTH openness stay flat — puddles and skinny
// branches must not pulse (mirrors WaterShader.tsx).
const MIN_BODY_WIDTH = 14.0;
const FULL_BODY_WIDTH = 40.0;

interface WaterShaderProps {
  width: number;
  height: number;
  waterLevel?: number;
  positionY: number;
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
  const materialRef = useRef<ShaderMaterial>(null);
  const initialCenter = useTerrainChunkStore.getState();

  // Persistent half-float field texture, mutated in place on rebuilds.
  const fieldState = useMemo(() => {
    const data = new Uint16Array(FIELD_TEX_SIZE * FIELD_TEX_SIZE * 2);
    const tex = new DataTexture(data, FIELD_TEX_SIZE, FIELD_TEX_SIZE, RGFormat, HalfFloatType);
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return { tex, data, requestId: 0 };
  }, []);

  const material = useMemo(() => {
    const vertexShader = `
      uniform sampler2D uField;
      uniform float uTime;
      uniform vec2 uFieldOrigin;
      uniform float uFieldExtentInv;
      uniform vec2 uWaterCenter;
      uniform float uFieldReady;
      varying vec2 vUv;
      varying float vCrest;
      varying float vShoreD;
      varying float vOpenness;
      varying float vPhase1;
      varying vec2 vWorldPos;
      varying float vBlotch;

      // Simplex noise (same impl as the fragment stage) — drives the
      // blotchy patch mask that breaks uniform wave bands.
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vUv = uv;

        // Plane rotated -PI/2 about X: local +x -> world +x, local +y ->
        // world -z. World position of this vertex on the water plane:
        float worldX = position.x + uWaterCenter.x;
        float worldZ = uWaterCenter.y - position.y;
        vec2 fieldUV = (vec2(worldX, worldZ) - uFieldOrigin) * uFieldExtentInv;

        vec2 field = texture2D(uField, fieldUV).rg;
        float d = field.r;
        float D = field.g;

        // Skinny channels flat; waves live in an ABSOLUTE shore band
        // (peak ~6u from shore, gone by ~28u) so body middles stay calm
        // regardless of size. See WaterShader.tsx for rationale.
        float openness = smoothstep(${MIN_BODY_WIDTH.toFixed(1)}, ${FULL_BODY_WIDTH.toFixed(1)}, D);
        // Bigger bodies → bigger, longer waves (mirrors WaterShader.tsx).
        float sizeFactor = openness * 0.55 + smoothstep(40.0, 90.0, D) * 0.45;
        float shoreBand = smoothstep(0.0, 1.5, d) * (1.0 - smoothstep(8.0, 28.0, d));

        // Blotchy patch mask + phase jitter — irregular wave patches
        // instead of parallel contour bands. NOTE: named wavePatch, not
        // "patch" — \`patch\` is a RESERVED KEYWORD in GLSL ES 3.00 (which
        // three targets on WebGL2); using it fails compilation and the
        // whole water plane silently disappears.
        float blotch = snoise(vec2(worldX, worldZ) * 0.045 + uTime * 0.07) * 0.5 + 0.5;
        float wavePatch = blotch * 0.8 + 0.2;

        // Slow large-scale swell: some shore stretches randomly run
        // bigger waves (0.5x-1.5x; max amp stays under the swim margin).
        float swell = snoise(vec2(worldX, worldZ) * 0.012 + uTime * 0.02) * 0.5 + 0.5;
        float swellMul = swell + 0.5;

        float amp = ${BASE_AMP.toFixed(2)} * sizeFactor * shoreBand * wavePatch * swellMul * uFieldReady;

        float waveLen1 = 9.0 + sizeFactor * 8.0;
        float waveLen2 = 5.0 + sizeFactor * 5.0;
        float phase1 = d * ${(Math.PI * 2).toFixed(5)} / waveLen1 - uTime * 1.6 + blotch * 2.5;
        float phase2 = d * ${(Math.PI * 2).toFixed(5)} / waveLen2 - uTime * 2.3 + worldX * 0.05;
        float waveY = (sin(phase1) * 0.7 + sin(phase2) * 0.3) * amp;

        vCrest = (sin(phase1) * 0.5 + 0.5) * (amp / ${BASE_AMP.toFixed(2)}) * 0.045;
        vShoreD = d;
        vOpenness = openness * uFieldReady;
        vPhase1 = phase1;
        vWorldPos = vec2(worldX, worldZ);
        vBlotch = blotch;

        // local +z = world +y on the rotated plane.
        vec3 displaced = position + vec3(0.0, 0.0, waveY);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform float uDarkness;
      varying vec2 vUv;
      varying float vCrest;
      varying float vShoreD;
      varying float vOpenness;
      varying float vPhase1;
      varying vec2 vWorldPos;
      varying float vBlotch;

      // Simplex noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        // Deepened to match WaterShader.tsx (#23505f / #2a7fd0) — the
        // brighter originals washed midday water toward white.
        vec3 deepBlue = vec3(0.137, 0.314, 0.373);
        vec3 lightBlue = vec3(0.165, 0.498, 0.816);

        vec2 p = (vUv - 0.5) * 12.0 + 0.5;
        float noiseValue = snoise(vec2(p.x, p.y) + uTime * 0.3);
        float adjustedNoise = 0.5 + 0.5 * noiseValue;

        vec3 baseColor = mix(deepBlue, lightBlue, adjustedNoise) + vec3(vCrest);

        // ── Shore foam: ragged white band at the shoreline, surging with
        // the incoming crest train, speckled with drifting bubbles.
        // (Mirrors WaterShader.tsx — see it for the model. Band widths are
        // field-resolution-bound: texels are ~2.7u and the first visible
        // water fragment interpolates to d ≈ 1.5–2.7, so the band must
        // span ≥ 2 texels or no visible water ever gets foam.)
        float foamLine = 1.0 - smoothstep(0.0, 7.0, vShoreD);
        float foamNoise = snoise(vWorldPos * 0.9 + vec2(uTime * 0.15, -uTime * 0.11));
        float foamEdge = smoothstep(0.4, 0.72, foamLine + foamNoise * 0.35);
        float surge = sin(vPhase1) * 0.35 + 0.65;
        float speckle = snoise(vWorldPos * 2.8 + vec2(0.0, uTime * 0.35));
        float bubbles = smoothstep(0.35, 0.8, speckle)
          * (1.0 - smoothstep(1.0, 9.0, vShoreD)) * 0.55;
        // Drifting patch gate — decides which shore stretches carry foam
        // (mirrors WaterShader.tsx + the terrain wash). Derived from the
        // same blotch noise the waves already use — no extra sample.
        float foamPatch = smoothstep(0.32, 0.62, vBlotch);
        float foamAmount = clamp(foamEdge * surge + bubbles, 0.0, 1.0) * foamPatch * vOpenness;

        vec3 foamColor = vec3(0.92, 0.97, 1.0);
        // uDarkness mirrors the WebGPU path's darknessNode (day/night).
        vec3 finalColor = mix(baseColor, foamColor, foamAmount) * uDarkness;

        // Base 0.84 (was 0.7) — the bright bottom bled through and washed
        // the daytime water toward white.
        gl_FragColor = vec4(finalColor, 0.84 + foamAmount * 0.16);
      }
    `;

    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDarkness: getDarknessValueUniform(),
        uField: { value: fieldState.tex },
        uFieldOrigin: { value: { x: 0, y: 0 } },
        uFieldExtentInv: { value: 1 / Math.max(1, width) },
        uWaterCenter: { value: { x: initialCenter.waterCenterX, y: initialCenter.waterCenterZ } },
        uFieldReady: { value: 0 },
      },
      transparent: true,
      side: DoubleSide,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          material.uniforms.uFieldOrigin.value.x = field.originX;
          material.uniforms.uFieldOrigin.value.y = field.originZ;
          material.uniforms.uFieldExtentInv.value = 1 / field.extent;
          material.uniforms.uFieldReady.value = 1;
        })
        .catch(() => { /* worker unavailable — water stays flat */ });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, chunkWidth, chunkHeight, material]);

  useEffect(() => {
    rebuildField(initialCenter.waterCenterX, initialCenter.waterCenterZ);

    const unsub = useTerrainChunkStore.subscribe((state) => {
      if (meshRef.current) {
        meshRef.current.position.x = state.waterCenterX;
        meshRef.current.position.z = state.waterCenterZ;
      }
      const center = material.uniforms.uWaterCenter.value;
      if (state.waterCenterX !== center.x || state.waterCenterZ !== center.y) {
        center.x = state.waterCenterX;
        center.y = state.waterCenterZ;
        rebuildField(state.waterCenterX, state.waterCenterZ);
      }
    });

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const onChunkLoaded = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        const center = material.uniforms.uWaterCenter.value;
        rebuildField(center.x, center.y);
      }, 600);
    };
    window.addEventListener('terrainChunkLoaded', onChunkLoaded);

    return () => {
      unsub();
      window.removeEventListener('terrainChunkLoaded', onChunkLoaded);
      if (debounce) clearTimeout(debounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebuildField, material]);

  useEffect(() => () => { fieldState.tex.dispose(); }, [fieldState]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh
      ref={meshRef}
      name="waterSurface"
      position={[initialCenter.waterCenterX, positionY, initialCenter.waterCenterZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      userData={{ camExcludeCollision: true }}
      raycast={() => null}
      frustumCulled={false}
    >
      <planeGeometry args={[width, height, PLANE_SEGMENTS, PLANE_SEGMENTS]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
}
