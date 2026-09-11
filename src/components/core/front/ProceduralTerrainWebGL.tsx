import React, { useRef, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { RigidBody, HeightfieldCollider } from '@react-three/rapier';
import { Group, Vector3, ShaderMaterial, DoubleSide } from 'three';
import { buildHeightfieldCollider } from './terrainColliderHelpers';
import { GrassShaderWebGL as GrassShader } from './GrassShaderWebGL';
import { ProceduralBouldersWebGL as ProceduralBoulders } from './ProceduralBouldersWebGL';
import { ProceduralTreesWebGL } from './ProceduralTreesWebGL';
import { ProceduralShrubsWebGL } from './ProceduralShrubsWebGL';
import { ProceduralFlowersWebGL } from './ProceduralFlowersWebGL';
import { PluginDecorations } from './PluginDecorations';
import { useTerrainChunkStore } from './terrainChunkStore';
import useProceduralSkyStore from '../../../stores/proceduralSkyStore';
import { getBiomeAt } from './biomeHelpers';
import { terrainWorker, type TerrainArrays } from '../../../terrain/TerrainWorkerClient';
import { buildTerrainGeometry } from '../../../terrain/TerrainChunkBuilder';
import { getMountainsNearChunk } from './worldHelpers';
import { packSpawnObstacles, registerNpcObstacles, unregisterNpcObstacles } from './npcObstacles';
import {
  MAX_GROUND_PATCHES,
  groundPatchXZRUniform, groundPatchColorUniform, groundPatchCountUniform,
} from '../../../decorations/groundPatchUniforms';
import {
  MAX_REGION_MATERIALS,
  regionXZRUniform, regionParamUniform, regionTintUniform, regionCountUniform,
  regionWaterYUniform,
} from '../../../decorations/regionMaterialUniforms';
import {
  MAX_PATH_SEGMENTS,
  pathSegUniform, pathMetaUniform, pathTintUniform, pathCountUniform,
} from '../../../decorations/pathUniforms';
import {
  getWorldRoadConfig, getWorldRoadConfigVersion, subscribeWorldRoadConfig,
} from '../../../decorations/roadConfigStore';
import { getAudioBassUniform } from './terrainAudio';
import {
  COBBLESTONE_GLSL, getTerrainSurfacesVersion, subscribeTerrainSurfaces,
} from './terrainSurfaceRegistry';

// Custom TSL surfaces can't compile to GLSL, so this twin paints them as the
// region's flat tint — which carries the surface's registered fallbackColor
// when the author didn't set one (see addRegionMaterial). Same flat colour as
// the WebGPU path's non-cobblestone fallback, by construction.

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/**
 * Subscribes to the Zustand decoration phase for a specific chunk.
 * Only re-renders THIS wrapper when the phase threshold is crossed —
 * the parent ProceduralTerrain component is never re-rendered.
 */
function DecorationGate({ chunkKey, minPhase, children }: {
  chunkKey: string; minPhase: number; children: React.ReactNode;
}) {
  const isReady = useTerrainChunkStore(
    (s) => (s.decorationPhases[chunkKey] ?? 0) >= minPhase
  );
  if (!isReady) return null;
  return <>{children}</>;
}

interface ProceduralTerrainProps {
  width?: number;
  height?: number;
  segments?: number;
  scale?: number;
  heightScale?: number;
  seed?: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  color?: string;
  roughness?: number;
  metalness?: number;
  skyColor?: string;
  horizonColor?: string;
  cloudColor?: string;
  cloudDensity?: number;
  cloudScale?: number;
  cloudSpeed?: number;
  cloudHeight?: number;
  cloudLayers?: number;
  timeOfDay?: number;
  timeCycleDuration?: number;
  noiseOctaves?: number;
  noisePersistence?: number;
  noiseLacunarity?: number;
  gridX?: number;
  gridZ?: number;
  isCenterChunk?: boolean;
  playerPosition?: Vector3;
  enableDecorations?: boolean;
}

export function ProceduralTerrain({
  width = 100,
  height = 100,
  segments = 100,
  scale = 0.5,
  heightScale = 50,
  seed = Math.random().toString(),
  positionX = 0,
  positionY = 0,
  positionZ = 0,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  noiseOctaves = 6,
  noisePersistence = 0.5,
  noiseLacunarity = 2,
  gridX = 0,
  gridZ = 0,
  playerPosition,
  enableDecorations = true
}: ProceduralTerrainProps) {
  const highestPointsRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const groupRef = useRef<Group>(new Group());
  const heightDataRef = useRef<Float32Array>(new Float32Array());
  const colorDataRef = useRef<Float32Array>(new Float32Array());
  const roadStrengthRef = useRef<Float32Array>(new Float32Array());
  const grassSpawnsRef = useRef<Float32Array>(new Float32Array());
  const boulderSpawnsRef = useRef<Float32Array>(new Float32Array());
  const treeSpawnsRef = useRef<Float32Array>(new Float32Array());
  const shrubSpawnsRef = useRef<Float32Array>(new Float32Array());
  const flowerSpawnsRef = useRef<Float32Array>(new Float32Array());
  const materialRef = useRef<ShaderMaterial | null>(null);
  const registerGeometry = useTerrainChunkStore((state) => state.registerGeometry);
  const getGeometry = useTerrainChunkStore((state) => state.getGeometry);
  // Whether terrain chunks should carry a (cooked) trimesh collider — false
  // while flying high above the ground (driven by InfiniteTerrain). Mirrors
  // the WebGPU path.
  const collidersActive = useTerrainChunkStore((state) => state.collidersActive);
  
  const chunkBiome = useMemo(() => {
    return getBiomeAt(positionX, positionZ, seed);
  }, [positionX, positionZ, seed]);

  // Decoration phases stored in Zustand so DecorationGate children subscribe
  // independently — this parent component never re-renders for phase changes.
  const chunkKey = `${gridX},${gridZ}`;
  const setDecorationPhase = useTerrainChunkStore((s) => s.setDecorationPhase);
  const removeDecorationPhase = useTerrainChunkStore((s) => s.removeDecorationPhase);

  // Re-skin the material when a plugin registers a custom terrain surface (the
  // registry index packed into uRegionParam.x can shift). Registering at plugin
  // init costs nothing — the first build already has it.
  const surfaceVersion = useSyncExternalStore(
    subscribeTerrainSurfaces, getTerrainSurfacesVersion, getTerrainSurfacesVersion,
  );

  // Re-generate chunks when world roads are enabled/reconfigured after first
  // stream (so spawn-area chunks get roads without a revisit). Cheap — re-runs
  // the normal worker generate (cached super-tile plan), not a material rebuild.
  const roadConfigVersion = useSyncExternalStore(
    subscribeWorldRoadConfig, getWorldRoadConfigVersion, getWorldRoadConfigVersion,
  );

  // WebGL-compatible material with vertex colors and time-of-day lighting
  const terrainMaterial = useMemo(() => {
    const vertexShader = `
      attribute vec3 color;
      attribute float roadStrength;
      varying vec3 vColor;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vRoadStrength;

      void main() {
        vColor = color;
        vRoadStrength = roadStrength;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform float uTimeOfDay;
      uniform float uAudioBass;
      uniform int uPatchCount;
      uniform vec3 uPatchXZR[${MAX_GROUND_PATCHES}];
      uniform vec3 uPatchColor[${MAX_GROUND_PATCHES}];
      uniform int uRegionCount;
      uniform vec3 uRegionXZR[${MAX_REGION_MATERIALS}];
      uniform vec3 uRegionParam[${MAX_REGION_MATERIALS}];
      uniform vec3 uRegionTint[${MAX_REGION_MATERIALS}];
      uniform int uPathCount;
      uniform vec4 uPathSeg[${MAX_PATH_SEGMENTS}];
      uniform vec4 uPathMeta[${MAX_PATH_SEGMENTS}];
      uniform vec3 uPathTint[${MAX_PATH_SEGMENTS}];
      uniform float uRegionWaterY;
      varying vec3 vColor;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vRoadStrength;

      // Built-in 'cobblestone' surface (index 0). Custom TSL surfaces can't
      // compile to GLSL, so on WebGL they fall back to their flat region tint.
      ${COBBLESTONE_GLSL}

      // Simplex noise for texture variation
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i); 
        vec4 p = permute( permute( permute( 
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                 
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }
      
      void main() {
        vec3 baseColor = vColor;
        
        // Multi-scale noise for texture variation
        float largeNoise = snoise(vWorldPosition * 0.012) * 0.32;
        float mediumNoise = snoise(vWorldPosition * 0.045) * 0.20;
        float fineNoise = snoise(vWorldPosition * 0.12) * 0.12;
        float extraFineNoise = snoise(vWorldPosition * 0.35) * 0.10;
        
        // Detect terrain types based on vertex color
        bool isGreen = baseColor.g > baseColor.r * 1.1 && baseColor.g > baseColor.b * 1.1;
        bool isWhite = baseColor.r > 0.85 && baseColor.g > 0.85 && baseColor.b > 0.85;
        bool isTan = baseColor.r > baseColor.g * 1.05 && baseColor.g > baseColor.b * 1.1;
        
        float variation;
        if (isTan) {
          variation = largeNoise + mediumNoise + fineNoise + extraFineNoise + 0.78;
        } else if (isGreen) {
          variation = largeNoise + mediumNoise + fineNoise + 0.80;
        } else if (isWhite) {
          variation = largeNoise + mediumNoise + fineNoise + 0.82;
        } else {
          variation = 1.0;
        }
        
        vec3 variedColor = baseColor * variation;

        // Meadow patchwork — mirrors the WebGPU terrain material: ONE warped
        // meadow-scale field (warp reuses the large/medium samples above)
        // mixes lush-cool vs sun-dried-warm grass tints, plus blade-scale
        // grain that fades out by ~120u so it never shimmers at distance.
        if (isGreen) {
          float meadow = snoise(vec3(
            vWorldPosition.x * 0.022 + largeNoise * 2.8,
            vWorldPosition.z * 0.022 - mediumNoise * 3.0,
            7.3)) * 0.5 + 0.5;
          float meadowMix = smoothstep(0.35, 0.72, meadow);
          vec3 grassTint = mix(vec3(0.86, 1.04, 0.90), vec3(1.16, 1.06, 0.74), meadowMix);
          float micro = snoise(vec3(vWorldPosition.x * 0.75, vWorldPosition.z * 0.75, 3.1));
          float microFade = smoothstep(120.0, 35.0, distance(cameraPosition, vWorldPosition));
          variedColor *= grassTint * (1.0 + micro * 0.07 * microFade);
        }

        // Ground patches ("dirt-surrounded" decorations) — same uniform
        // circle array the WebGPU terrain reads. radius 0 ⇒ inactive slot.
        vec3 dirtCol = vec3(0.34, 0.26, 0.16);
        float patchMask = 0.0;
        for (int i = 0; i < ${MAX_GROUND_PATCHES}; i++) {
          if (i >= uPatchCount) break;
          vec3 xzr = uPatchXZR[i];
          float d = distance(vWorldPosition.xz, xzr.xy);
          // radius is signed (sign carries clearGrass) — abs() for the mask.
          float dn = d / max(abs(xzr.z), 0.001);
          // Clean soft-edged circle — no per-fragment snoise (it was an
          // expensive simplex per fragment per patch across the terrain).
          float m = smoothstep(1.0, 0.72, dn);
          if (m > patchMask) { dirtCol = uPatchColor[i]; }
          patchMask = max(patchMask, m);
        }
        // Dirt (incl. road shoulders) fades out at the water line — never over water.
        float patchAboveWater = smoothstep(uRegionWaterY + 0.2, uRegionWaterY + 2.0, vWorldPosition.y);
        variedColor = mix(variedColor, dirtCol, patchMask * patchAboveWater);

        // Surface-material regions — replace the ground inside a circle with a
        // procedural surface. Built-in cobblestone (index 0) is procedural;
        // custom surfaces fall back to the region's flat tint. Strongest wins.
        for (int i = 0; i < ${MAX_REGION_MATERIALS}; i++) {
          if (i >= uRegionCount) break;
          vec3 rxzr = uRegionXZR[i];
          float rd = distance(vWorldPosition.xz, rxzr.xy);
          float rdn = rd / max(abs(rxzr.z), 0.001);
          float rm = smoothstep(1.0, 0.82, rdn);
          if (rm <= 0.0) continue;
          vec3 rParam = uRegionParam[i];   // (surfaceIndex, scale, mortar)
          vec3 rcol;
          if (rParam.x < 0.5) {
            // Region-LOCAL coords (small) so the Worley hash stays precise far
            // from the origin.
            rcol = xrpCobblestone(vWorldPosition.xz - rxzr.xy, rParam.y, rParam.z, uRegionTint[i]);
          } else {
            // Custom TSL surface → flat region tint on WebGL (WebGPU runs the
            // real procedural shader). The tint already CARRIES the surface's
            // fallbackColor when the author didn't set one (see
            // addRegionMaterial) — multiplying by the fallback again here made
            // WebGL paint fallback² where WebGPU painted a plain tint, so the
            // same region read as two different colours per renderer.
            rcol = uRegionTint[i];
          }
          // Water awareness — fade the surface out near/below the water line so
          // it never paints over water (matches the WebGPU path).
          float aboveWater = smoothstep(uRegionWaterY + 0.2, uRegionWaterY + 2.0, vWorldPosition.y);
          variedColor = mix(variedColor, rcol, rm * aboveWater);
        }

        // Plugin PATHS (addPath) — accumulate the strongest segment mask +
        // tint, then paint with the world-ROAD recipe (packed dirt + pebbles)
        // OVER regions, so a sandy trail crosses a cobblestone plaza visibly
        // (matches the WebGPU Stage-1b/2b path).
        float pathMask = 0.0;
        vec3 pathTintC = vec3(1.0);
        for (int i = 0; i < ${MAX_PATH_SEGMENTS}; i++) {
          if (i >= uPathCount) break;
          vec4 ps = uPathSeg[i];
          float phw = max(uPathMeta[i].x, 0.02);
          vec2 pe = ps.zw - ps.xy;
          float plen2 = max(dot(pe, pe), 0.0001);
          float pt = clamp(dot(vWorldPosition.xz - ps.xy, pe) / plen2, 0.0, 1.0);
          float pd = distance(vWorldPosition.xz, ps.xy + pe * pt);
          float pmask = smoothstep(phw, phw * 0.8, pd);
          if (pmask > pathMask) { pathTintC = uPathTint[i]; }
          pathMask = max(pathMask, pmask);
        }
        if (pathMask > 0.001) {
          float pn1 = snoise(vWorldPosition * 0.6 + 3.0) * 0.5 + 0.5;
          float pn2 = snoise(vWorldPosition * 3.0 + 11.0) * 0.5 + 0.5;
          vec3 pDirt = vec3(0.44, 0.36, 0.26) * (0.85 + pn1 * 0.30);
          vec3 pPebble = mix(vec3(0.34, 0.30, 0.25), vec3(0.58, 0.53, 0.45), pn2);
          vec3 pathCol = mix(pDirt, pPebble, smoothstep(0.62, 0.82, pn2) * 0.6) * pathTintC;
          float pAboveWater = smoothstep(uRegionWaterY + 0.2, uRegionWaterY + 2.0, vWorldPosition.y);
          variedColor = mix(variedColor, pathCol, pathMask * pAboveWater);
        }

        // World roads — a per-vertex roadStrength (0..1) baked in the worker from
        // the deterministic road network (known at chunk-generate time, never
        // recomputed as the player moves). Believable packed dirt, gated by the
        // water line so a road never paints over a water sliver.
        if (vRoadStrength > 0.001) {
          float rn1 = snoise(vWorldPosition * 0.6) * 0.5 + 0.5;
          float rn2 = snoise(vWorldPosition * 3.0 + 7.0) * 0.5 + 0.5;
          vec3 dirt = vec3(0.44, 0.36, 0.26) * (0.85 + rn1 * 0.30);
          vec3 pebble = mix(vec3(0.34, 0.30, 0.25), vec3(0.58, 0.53, 0.45), rn2);
          vec3 roadCol = mix(dirt, pebble, smoothstep(0.62, 0.82, rn2) * 0.6);
          variedColor = mix(variedColor, roadCol, vRoadStrength);
        }

        // Simplified lighting that responds to scene lights
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        float diffuse = max(dot(vNormal, lightDir), 0.3);
        vec3 finalColor = variedColor * (0.6 + 0.4 * diffuse);

        // Day/night darkness — same timeline as terrainDarkness.ts
        // (uTimeOfDay was plumbed in but never used; WebGL terrain stayed
        // daylight-bright all night while everything else dimmed).
        float darkness;
        if (uTimeOfDay < 5.5) {
          darkness = 0.35;
        } else if (uTimeOfDay < 7.0) {
          darkness = 0.35 + 0.65 * ((uTimeOfDay - 5.5) / 1.5);
        } else if (uTimeOfDay < 18.5) {
          darkness = 1.0;
        } else if (uTimeOfDay < 20.5) {
          darkness = 1.0 - 0.65 * ((uTimeOfDay - 18.5) / 2.0);
        } else {
          darkness = 0.35;
        }
        finalColor *= darkness;
        finalColor *= (1.0 + uAudioBass * 0.35);   // ground pulses with the music

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTimeOfDay: { value: useProceduralSkyStore.getState().currentTime },
        uAudioBass: getAudioBassUniform(),
        // Shared by reference with the WebGPU path's groundPatch uniforms;
        // mutated in place by PluginDecorations → uploaded each frame.
        uPatchCount: groundPatchCountUniform,
        uPatchXZR: groundPatchXZRUniform,
        uPatchColor: groundPatchColorUniform,
        uRegionCount: regionCountUniform,
        uRegionXZR: regionXZRUniform,
        uRegionParam: regionParamUniform,
        uRegionTint: regionTintUniform,
        uRegionWaterY: regionWaterYUniform,
        uPathCount: pathCountUniform,
        uPathSeg: pathSegUniform,
        uPathMeta: pathMetaUniform,
        uPathTint: pathTintUniform,
      },
      side: DoubleSide
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridX, gridZ, surfaceVersion]);
  
  // Subscribe directly to the store for uniform updates — no React re-renders.
  // This replaces a selector subscription that was causing the entire terrain
  // component (+ all children) to re-render on every time-of-day change.
  useEffect(() => {
    const unsub = useProceduralSkyStore.subscribe((state) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uTimeOfDay.value = state.currentTime;
      }
    });
    return unsub;
  }, []);

  // Async terrain generation via Web Worker (off main thread).
  const [terrainData, setTerrainData] = useState<{
    geometry: import('three').BufferGeometry;
    highestPoints: Array<{ x: number; y: number; z: number }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Cancel the queued terrain job on scroll-away (see the WebGPU twin).
    const abort = new AbortController();

    const isMobileDevice = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Pass JS mountain list into the worker (see the WebGPU twin's
    // comment on this call for the full rationale).
    const chunkMountains = getMountainsNearChunk(
      gridX, gridZ, width, height, seed, width * 2
    );

    terrainWorker
      .generateTerrain({
        width, height, segments, scale, heightScale, seed,
        noiseOctaves, noisePersistence, noiseLacunarity,
        positionX, positionZ,
        gridX, gridZ, positionY,
        grassDensity: chunkBiome.grassDensity,
        boulderDensity: chunkBiome.boulderDensity,
        treeDensity: chunkBiome.treeDensity,
        shrubDensity: chunkBiome.shrubDensity,
        flowerDensity: chunkBiome.flowerDensity,
        isMobile: isMobileDevice,
        mountains: chunkMountains,
        roadConfig: getWorldRoadConfig(),
      }, { signal: abort.signal })
      .then((arrays: TerrainArrays) => {
        if (cancelled) return;

        const geometry = buildTerrainGeometry(
          arrays.positions, arrays.colors, arrays.roadStrength,
          width, height, segments, arrays.normals
        );

        highestPointsRef.current = arrays.highestPoints;
        heightDataRef.current = arrays.positions;
        colorDataRef.current = arrays.colors;
        roadStrengthRef.current = arrays.roadStrength;
        grassSpawnsRef.current = arrays.grassSpawns;
        boulderSpawnsRef.current = arrays.boulderSpawns;
        treeSpawnsRef.current = arrays.treeSpawns;
        shrubSpawnsRef.current = arrays.shrubSpawns;
        flowerSpawnsRef.current = arrays.flowerSpawns;

        // Publish this chunk's decoration footprint so NPC spawn/wander
        // points never land inside a tree trunk, boulder, or shrub.
        {
          const packed: number[] = [];
          packSpawnObstacles(packed, arrays.treeSpawns, positionX, positionZ, 0.6, 0.4);
          packSpawnObstacles(packed, arrays.boulderSpawns, positionX, positionZ, 0.5, 1.0);
          packSpawnObstacles(packed, arrays.shrubSpawns, positionX, positionZ, 0.4, 0.6);
          registerNpcObstacles(`chunk-${gridX}-${gridZ}`, new Float32Array(packed));
        }

        const geoKey = `terrain-chunk-${gridX}-${gridZ}`;
        registerGeometry(geoKey, geometry);

        // Edge-blend with existing neighbor chunks.
        const positions3 = geometry.attributes.position;
        const colors3 = geometry.attributes.color;
        const verticesPerSide = segments + 1;
        let hasNeighborBlend = false;

        const leftKey = `terrain-chunk-${gridX - 1}-${gridZ}`;
        const leftGeom = getGeometry(leftKey);
        if (leftGeom) {
          const leftPos = leftGeom.attributes.position;
          const leftColor = leftGeom.attributes.color;
          for (let j = 0; j <= segments; j++) {
            const thisIdx = j * verticesPerSide;
            const leftIdx = j * verticesPerSide + segments;
            positions3.setY(thisIdx, leftPos.getY(leftIdx));
            colors3.setXYZ(thisIdx, leftColor.getX(leftIdx), leftColor.getY(leftIdx), leftColor.getZ(leftIdx));
          }
          positions3.needsUpdate = true;
          colors3.needsUpdate = true;
          hasNeighborBlend = true;
        }

        const rightKey = `terrain-chunk-${gridX + 1}-${gridZ}`;
        const rightGeom = getGeometry(rightKey);
        if (rightGeom) {
          const rightPos = rightGeom.attributes.position;
          const rightColor = rightGeom.attributes.color;
          for (let j = 0; j <= segments; j++) {
            const thisIdx = j * verticesPerSide + segments;
            const rightIdx = j * verticesPerSide;
            positions3.setY(thisIdx, rightPos.getY(rightIdx));
            colors3.setXYZ(thisIdx, rightColor.getX(rightIdx), rightColor.getY(rightIdx), rightColor.getZ(rightIdx));
          }
          positions3.needsUpdate = true;
          colors3.needsUpdate = true;
          hasNeighborBlend = true;
        }

        const topKey = `terrain-chunk-${gridX}-${gridZ - 1}`;
        const topGeom = getGeometry(topKey);
        if (topGeom) {
          const topPos = topGeom.attributes.position;
          const topColor = topGeom.attributes.color;
          for (let i = 0; i <= segments; i++) {
            const thisIdx = i;
            const topIdx = segments * verticesPerSide + i;
            positions3.setY(thisIdx, topPos.getY(topIdx));
            colors3.setXYZ(thisIdx, topColor.getX(topIdx), topColor.getY(topIdx), topColor.getZ(topIdx));
          }
          positions3.needsUpdate = true;
          colors3.needsUpdate = true;
          hasNeighborBlend = true;
        }

        const bottomKey = `terrain-chunk-${gridX}-${gridZ + 1}`;
        const bottomGeom = getGeometry(bottomKey);
        if (bottomGeom) {
          const bottomPos = bottomGeom.attributes.position;
          const bottomColor = bottomGeom.attributes.color;
          for (let i = 0; i <= segments; i++) {
            const thisIdx = segments * verticesPerSide + i;
            const bottomIdx = i;
            positions3.setY(thisIdx, bottomPos.getY(bottomIdx));
            colors3.setXYZ(thisIdx, bottomColor.getX(bottomIdx), bottomColor.getY(bottomIdx), bottomColor.getZ(bottomIdx));
          }
          positions3.needsUpdate = true;
          colors3.needsUpdate = true;
          hasNeighborBlend = true;
        }

        if (hasNeighborBlend) {
          geometry.computeVertexNormals();
        }

        setTerrainData({ geometry, highestPoints: arrays.highestPoints });
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Terrain generation failed for chunk', gridX, gridZ, err);
        }
      });

    return () => {
      cancelled = true;
      abort.abort();
      unregisterNpcObstacles(`chunk-${gridX}-${gridZ}`);
    };
  }, [width, height, segments, scale, heightScale, seed, noiseOctaves, noisePersistence, noiseLacunarity, positionX, positionZ, gridX, gridZ, registerGeometry, getGeometry, roadConfigVersion]);

  useEffect(() => {
    if (!terrainData) return;

    const timer = setTimeout(() => {
      const meshName = `terrain-chunk-${gridX}-${gridZ}`;
      window.dispatchEvent(new CustomEvent('terrainChunkLoaded', {
        detail: { 
          gridX, 
          gridZ, 
          key: meshName,
          meshName
        }
      }));
    }, 100);

    return () => clearTimeout(timer);
  }, [terrainData, gridX, gridZ]);
  
  useEffect(() => {
    if (!terrainData) return;

    if (!isMobile) {
      // Desktop: immediately ready
      setDecorationPhase(chunkKey, 2);
    } else {
      // Mobile: stagger loading
      const phase1Timer = setTimeout(() => setDecorationPhase(chunkKey, 1), 300);
      const phase2Timer = setTimeout(() => setDecorationPhase(chunkKey, 2), 900);
      return () => {
        clearTimeout(phase1Timer);
        clearTimeout(phase2Timer);
        removeDecorationPhase(chunkKey);
      };
    }

    return () => {
      removeDecorationPhase(chunkKey);
    };
  }, [terrainData, chunkKey, setDecorationPhase, removeDecorationPhase]);

  // Full-resolution heightfield collider — mirrors the WebGPU path (see
  // terrainColliderHelpers.ts for why this replaced the decimated trimesh).
  const colliderData = useMemo(
    () => (terrainData ? buildHeightfieldCollider(terrainData.geometry, segments, width, height) : null),
    [terrainData, segments, width, height]
  );

  // Dispose this chunk's geometry on unmount — three.js doesn't free GPU
  // buffers on GC, so traversing the world leaks one trimesh geometry per
  // chunk crossed. Mirrors the WebGPU path.
  useEffect(() => {
    return () => {
      if (terrainData?.geometry) terrainData.geometry.dispose();
    };
  }, [terrainData]);

  if (!terrainData) return null;

  return (
    <>
      <group
        ref={groupRef as any}
        position={[positionX, positionY, positionZ]}
        rotation={[rotationX, rotationY, rotationZ]}
      >
        <RigidBody
          type="fixed"
          colliders={false}
        >
          <mesh
            name={`terrain-chunk-${gridX}-${gridZ}`}
            receiveShadow
            raycast={() => null}
            frustumCulled={false}
          >
            <primitive object={terrainData.geometry} attach="geometry" />
            <primitive ref={materialRef} object={terrainMaterial} attach="material" />
          </mesh>
          {collidersActive && colliderData && (
            <HeightfieldCollider args={colliderData as any} />
          )}
        </RigidBody>
        
        {enableDecorations && (
          <DecorationGate chunkKey={chunkKey} minPhase={1}>
            <GrassShader
              chunkX={gridX}
              chunkZ={gridZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              scale={scale}
              noiseOctaves={noiseOctaves}
              noisePersistence={noisePersistence}
              noiseLacunarity={noiseLacunarity}
              segments={segments}
              heightData={heightDataRef.current}
              colorData={colorDataRef.current}
              roadStrength={roadStrengthRef.current}
              playerPosition={playerPosition}
              biomeDensity={chunkBiome.grassDensity}
            />
          </DecorationGate>
        )}
        
        {enableDecorations && (
          <DecorationGate chunkKey={chunkKey} minPhase={1}>
            <ProceduralBoulders
              width={width}
              height={height}
              positionX={0}
              positionY={0}
              positionZ={0}
              seed={seed}
              gridX={gridX}
              gridZ={gridZ}
              heightData={heightDataRef.current}
              heightScale={heightScale}
              biomeDensity={chunkBiome.boulderDensity}
              precomputedSpawns={boulderSpawnsRef.current}
            />
          </DecorationGate>
        )}

        {enableDecorations && chunkBiome.treeDensity > 0 && (
          <DecorationGate chunkKey={chunkKey} minPhase={2}>
            <ProceduralTreesWebGL
              chunkX={gridX}
              chunkZ={gridZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              segments={segments}
              heightData={heightDataRef.current}
              colorData={colorDataRef.current}
              playerPosition={playerPosition}
              treeDensity={chunkBiome.treeDensity}
              positionY={positionY}
              precomputedSpawns={treeSpawnsRef.current}
            />
          </DecorationGate>
        )}

        {enableDecorations && chunkBiome.shrubDensity > 0 && (
          <DecorationGate chunkKey={chunkKey} minPhase={2}>
            <ProceduralShrubsWebGL
              chunkX={gridX}
              chunkZ={gridZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              segments={segments}
              heightData={heightDataRef.current}
              colorData={colorDataRef.current}
              playerPosition={playerPosition}
              shrubDensity={chunkBiome.shrubDensity}
              positionY={positionY}
            />
          </DecorationGate>
        )}

        {enableDecorations && chunkBiome.flowerDensity > 0 && (
          <DecorationGate chunkKey={chunkKey} minPhase={2}>
            <ProceduralFlowersWebGL
              chunkX={gridX}
              chunkZ={gridZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              segments={segments}
              heightData={heightDataRef.current}
              colorData={colorDataRef.current}
              playerPosition={playerPosition}
              flowerDensity={chunkBiome.flowerDensity}
              positionY={positionY}
            />
          </DecorationGate>
        )}

        {enableDecorations && (
          <DecorationGate chunkKey={chunkKey} minPhase={2}>
            <PluginDecorations
              chunkX={gridX}
              chunkZ={gridZ}
              originX={positionX}
              originZ={positionZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              segments={segments}
              heightData={heightDataRef.current}
              roadStrength={roadStrengthRef.current}
              playerPosition={playerPosition}
              treeSpawns={treeSpawnsRef.current}
              boulderSpawns={boulderSpawnsRef.current}
            />
          </DecorationGate>
        )}

      </group>
    </>
  );
}
