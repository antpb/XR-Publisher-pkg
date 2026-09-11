import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Vector3, Mesh, ShaderMaterial, InstancedBufferGeometry,
  InstancedBufferAttribute, Sphere, FrontSide, Color
} from 'three';
import { alea } from 'seedrandom';
import { getDarknessValueUniform } from './terrainDarkness';
import { getAudioBassUniform } from './terrainAudio';
import { useChunkProximityVisible } from './useChunkProximityVisible';
import {
  MAX_GROUND_PATCHES, groundPatchXZRUniform, groundPatchCountUniform,
} from '../../../decorations/groundPatchUniforms';
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
  /** Per-vertex road strength 0..1 (worker-baked). Blades on a road are skipped.
   *  WebGL grass self-generates from the height grid, so it reads this array
   *  directly (the WebGPU twin gets road-free spawns from the worker instead). */
  roadStrength?: Float32Array;
  playerPosition?: Vector3;
  biomeDensity?: number;
}

const GRASS_SEGMENTS = 3;
const GRASS_WIDTH = 0.05;
const GRASS_HEIGHT = 0.55;
const LEAN_FACTOR = 0.4;
const BLADES_PER_POINT = isMobile ? 12 : 28;
const CLUSTER_RADIUS = isMobile ? 0.7 : 1.0;
const GROUND_OFFSET = 0.15;

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

const grassVertexShader = /* glsl */ `
uniform float uTime;
uniform float uGrassSegments;
uniform float uGrassWidth;
uniform float uGrassHeight;
uniform float uLeanFactor;
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTopColor;
uniform float uWindScale;
uniform float uWindStrength;
uniform float uWindSpeed;
uniform float uWindDirection;
uniform int uPatchCount;
uniform vec3 uPatchXZR[${MAX_GROUND_PATCHES}];

attribute vec3 aInstancePosition;

varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vWorldPosition;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float saturateValue(float x) {
  return clamp(x, 0.0, 1.0);
}

float easeOut(float x, float t) {
  return 1.0 - pow(1.0 - x, t);
}

vec3 hash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

vec3 bezier(vec3 P0, vec3 P1, vec3 P2, vec3 P3, float t) {
  return (1.0 - t) * (1.0 - t) * (1.0 - t) * P0 +
    3.0 * (1.0 - t) * (1.0 - t) * t * P1 +
    3.0 * (1.0 - t) * t * t * P2 +
    t * t * t * P3;
}

vec3 bezierGrad(vec3 P0, vec3 P1, vec3 P2, vec3 P3, float t) {
  return 3.0 * (1.0 - t) * (1.0 - t) * (P1 - P0) +
    6.0 * (1.0 - t) * t * (P2 - P1) +
    3.0 * t * t * (P3 - P2);
}

mat3 rotateY(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(vec3(c, 0, s), vec3(0, 1, 0), vec3(-s, 0, c));
}

mat3 rotateAxis(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat3(
    oc * axis.x * axis.x + c,
    oc * axis.x * axis.y - axis.z * s,
    oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,
    oc * axis.y * axis.y + c,
    oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,
    oc * axis.y * axis.z + axis.x * s,
    oc * axis.z * axis.z + c
  );
}

float rand(float n) {
  return fract(sin(n) * 43758.5453123);
}

float windNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  int GRASS_SEGMENTS_INT = int(uGrassSegments);
  int GRASS_VERTICES = (GRASS_SEGMENTS_INT + 1) * 2;

  vec3 grassOffset = aInstancePosition;
  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash(grassBladeWorldPos);

  int vertFB_ID = gl_VertexID % (GRASS_VERTICES * 2);
  int vertID = vertFB_ID % GRASS_VERTICES;

  int xTest = vertID & 0x1;
  int zTest = vertFB_ID >= GRASS_VERTICES ? 1 : -1;
  float xSide = float(xTest);
  float zSide = float(zTest);
  float heightPercent = float(vertID - xTest) / (float(GRASS_SEGMENTS_INT) * 2.0);

  float randomHeight = (rand(float(gl_InstanceID)) * 2.0 - 1.0) * 0.15;
  float width = uGrassWidth * easeOut(1.08 - heightPercent, 2.0);
  float height = uGrassHeight + randomHeight;

  // Clear grass out of "dirt-surrounded" decoration patches — collapse
  // the blade to its root inside a clearing. Only clears where the patch
  // radius is positive (sign carries the clearGrass flag).
  float patchClear = 1.0;
  for (int i = 0; i < ${MAX_GROUND_PATCHES}; i++) {
    if (i >= uPatchCount) break;
    vec3 xzr = uPatchXZR[i];
    if (xzr.z <= 0.0) continue;
    float d = distance(grassBladeWorldPos.xz, xzr.xy);
    float dn = d / max(abs(xzr.z), 0.001);
    patchClear = min(patchClear, smoothstep(0.78, 0.95, dn));
  }
  // (Grass on ROADS is removed in the worker — the grass spawn array is filtered
  // against the baked road network before this geometry is built — so there's no
  // per-fragment path loop here anymore.)
  width *= patchClear;
  height *= patchClear;

  float x = (xSide - 0.5) * width;
  float y = heightPercent * height;
  float z = 0.0;

  vec2 windUV = (grassBladeWorldPos.xz * uWindScale * 0.1) + vec2(uTime * uWindSpeed * 0.1);
  float wStr = windNoise(windUV) * 2.0 - 1.0;

  vec3 windAxis = vec3(cos(uWindDirection), 0.0, sin(uWindDirection));
  float windLeanAngle = wStr * uWindStrength * heightPercent;

  vec2 windUV2 = (grassBladeWorldPos.xz * 0.5) + vec2(uTime * uWindSpeed * 0.02);
  float randomLeanAnimation = (windNoise(windUV2) * 2.0 - 1.0) * (wStr * 0.5 + 0.125);

  float leanFactor = remap(hashVal.y, -1.0, 1.0, -uLeanFactor, uLeanFactor) + randomLeanAnimation;

  vec3 p1 = vec3(0.0);
  vec3 p2 = vec3(0.0, 0.33, 0.0);
  vec3 p3 = vec3(0.0, 0.66, 0.0);
  vec3 p4 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  vec3 curve = bezier(p1, p2, p3, p4, heightPercent);

  y = curve.y * height;
  z = curve.z * height;

  const float PI = 3.14159;
  float angle = remap(hashVal.x, -1.0, 1.0, -PI / 4.0, PI / 4.0);
  mat3 grassMat = rotateAxis(windAxis, windLeanAngle) * rotateY(angle);

  vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassOffset;

  vec3 curveGrad = bezierGrad(p1, p2, p3, p4, heightPercent);
  mat2 curveRot90 = mat2(0.0, 1.0, -1.0, 0.0) * -zSide;
  vec3 grassLocalNormal = grassMat * vec3(0.0, curveRot90 * curveGrad.yz);
  float distanceBlend = smoothstep(0.0, 10.0, distance(cameraPosition, grassBladeWorldPos));
  grassLocalNormal = mix(grassLocalNormal, vec3(0.0, 1.0, 0.0), distanceBlend * 0.5);
  grassLocalNormal = normalize(grassLocalNormal);

  vec4 mvPosition = modelViewMatrix * vec4(grassLocalPosition, 1.0);

  vec3 viewDir = normalize(cameraPosition - grassBladeWorldPos);
  vec3 grassFaceNormal = grassMat * vec3(0.0, 0.0, -zSide);
  float viewDotNormal = saturateValue(dot(grassFaceNormal, viewDir));
  float viewSpaceThickenFactor = easeOut(1.0 - viewDotNormal, 4.0) * smoothstep(0.0, 0.2, viewDotNormal);
  mvPosition.x += viewSpaceThickenFactor * (xSide - 0.5) * width * 0.5 * -zSide;

  gl_Position = projectionMatrix * mvPosition;

  vColor = mix(uGrassBaseColor, uGrassTopColor, heightPercent);
  vNormal = normalize((modelMatrix * vec4(grassLocalNormal, 0.0)).xyz);
  vWorldPosition = (modelMatrix * vec4(grassLocalPosition, 1.0)).xyz;
}
`;

const grassFragmentShader = /* glsl */ `
uniform float uDarkness;
uniform float uAudioBass;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vWorldPosition;

float saturateValue(float x) {
  return clamp(x, 0.0, 1.0);
}

vec3 lambertLight(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 lightColour) {
  float wrap = 0.5;
  float dotNL = saturateValue((dot(normal, lightDir) + wrap) / (1.0 + wrap));
  vec3 lighting = vec3(dotNL);

  float backlight = saturateValue((dot(viewDir, -lightDir) + wrap) / (1.0 + wrap));
  vec3 scatter = vec3(pow(backlight, 2.0));

  lighting += scatter;
  return lighting * lightColour;
}

vec3 hemiLight(vec3 normal, vec3 groundColour, vec3 skyColour) {
  return mix(groundColour, skyColour, 0.5 * normal.y + 0.5);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  vec3 ambientLighting = hemiLight(normal, vec3(0.05, 0.05, 0.25), vec3(1.0, 1.0, 0.75));

  vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
  vec3 diffuseLighting = lambertLight(normal, viewDir, lightDir, vec3(1.0));

  vec3 lighting = diffuseLighting * 0.2 + ambientLighting * 0.8;
  // uDarkness mirrors the WebGPU path's createDarknessNode (day/night).
  vec3 color = vColor * lighting * uDarkness * (1.0 + uAudioBass * 0.4);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function buildGrassIndices(segmentsCount: number): number[] {
  const vertexNumber = (segmentsCount + 1) * 2;
  const indices: number[] = [];

  for (let i = 0; i < segmentsCount; ++i) {
    const vi = i * 2;
    indices[i * 12] = vi;
    indices[i * 12 + 1] = vi + 1;
    indices[i * 12 + 2] = vi + 2;

    indices[i * 12 + 3] = vi + 2;
    indices[i * 12 + 4] = vi + 1;
    indices[i * 12 + 5] = vi + 3;

    const fi = vertexNumber + vi;
    indices[i * 12 + 6] = fi + 2;
    indices[i * 12 + 7] = fi + 1;
    indices[i * 12 + 8] = fi;

    indices[i * 12 + 9] = fi + 3;
    indices[i * 12 + 10] = fi + 1;
    indices[i * 12 + 11] = fi + 2;
  }

  return indices;
}

export const GrassShaderWebGL = ({
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
}: GrassShaderProps) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const fadeStartTimeRef = useRef<number | null>(null);
  const currentOpacityRef = useRef(0);
  const progressiveLoadStartRef = useRef<number | null>(null);
  const hasEverBeenVisibleRef = useRef(new Set<string>());
  const initialDelayRef = useRef<number | null>(null);

  const chunkKey = `${chunkX}-${chunkZ}`;
  // Per-frame proximity gate (see useChunkProximityVisible) — a useMemo here
  // only re-evaluated on re-render, freezing visibility between chunk streams.
  // Grass defaults visible before a player position exists.
  const shouldRenderGrass = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height, 1.4, 1.8, true,
  );

  // Use ref for generation readiness + version counter to trigger useMemo
  // Avoids a separate boolean state that causes an extra render cycle
  const generationReadyRef = useRef(false);
  const [generationTick, setGenerationTick] = useState(0);

  useEffect(() => {
    const random = alea(`${seed}-gendelay-${chunkX}-${chunkZ}`);
    const isFlying = typeof window !== 'undefined' && (window as any).__playerFlying;
    const baseDelay = isMobile ? (150 + random() * 400) : (20 + random() * 80);
    const delay = isFlying ? (4000 + baseDelay) : baseDelay;
    const timer = setTimeout(() => {
      generationReadyRef.current = true;
      setGenerationTick(1);
    }, delay);
    return () => clearTimeout(timer);
  }, [seed, chunkX, chunkZ]);

  const geometry = useMemo(() => {
    if (!generationReadyRef.current || !heightData || heightData.length === 0) {
      return null;
    }

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

    const verticesPerSide = segments + 1;

    const getHeightAt = (x: number, z: number): number => {
      if (x < 0 || x > segments || z < 0 || z > segments) return 0;
      const idx = z * verticesPerSide + x;
      return heightData[idx * 3 + 1];
    };

    const instancePositions: number[] = [];

    for (let gz = 0; gz <= segments; gz++) {
      for (let gx = 0; gx <= segments; gx++) {
        const idx = gz * verticesPerSide + gx;

        const vx = heightData[idx * 3];
        const vy = heightData[idx * 3 + 1];
        const vz = heightData[idx * 3 + 2];

        // Skip blades on a road — read the worker-baked per-vertex roadStrength
        // at this grid index. Deterministic, so mobile/desktop skip the same
        // vertices → no PRNG-stream divergence.
        if (roadStrength && roadStrength[idx] > 0.4) continue;

        const normalizedHeight = mapRange(vy, -heightScale, heightScale, 0, 1);

        let isGreen = true;
        if (colorData && colorData.length > 0) {
          const cr = colorData[idx * 3];
          const cg = colorData[idx * 3 + 1];
          const cb = colorData[idx * 3 + 2];
          isGreen = cg > cr * 1.1 && cg > cb * 1.1;
        }

        if (isGreen && normalizedHeight > 0.50 && normalizedHeight < 0.58) {
          const heightLeft = getHeightAt(gx - 1, gz);
          const heightRight = getHeightAt(gx + 1, gz);
          const heightUp = getHeightAt(gx, gz - 1);
          const heightDown = getHeightAt(gx, gz + 1);

          const slopeX = Math.abs(heightRight - heightLeft);
          const slopeZ = Math.abs(heightDown - heightUp);
          const slopeMagnitude = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);

          if (slopeMagnitude < 6.0) {
            const noiseValue = noise2D(vx, vz, 0.15);
            const noiseDensity = (noiseValue + 1) * 0.5;
            // Density multiplier drives `random() < ...` spawn decisions per
            // vertex; branching on UA would desynchronise the PRNG cursor and
            // put grass blades in different coords on mobile vs desktop. Keep
            // a single density — BLADES_PER_POINT and CLUSTER_RADIUS above
            // remain mobile-branched since those are pure render-side knobs.
            const densityMultiplier = 0.35 * biomeDensity;

            if (random() < noiseDensity * densityMultiplier) {
              for (let b = 0; b < BLADES_PER_POINT; b++) {
                const bladeAngle = random() * Math.PI * 2;
                const bladeRadius = Math.sqrt(random()) * CLUSTER_RADIUS;
                const bx = vx + Math.cos(bladeAngle) * bladeRadius;
                const by = vy - GROUND_OFFSET;
                const bz = vz + Math.sin(bladeAngle) * bladeRadius;
                instancePositions.push(bx, by, bz);
              }
            }
          }
        }
      }
    }

    if (instancePositions.length === 0) return null;

    const instanceCount = instancePositions.length / 3;

    const indices = buildGrassIndices(GRASS_SEGMENTS);
    const grassGeometry = new InstancedBufferGeometry();
    grassGeometry.instanceCount = instanceCount;
    grassGeometry.setIndex(indices);
    grassGeometry.setAttribute(
      'aInstancePosition',
      new InstancedBufferAttribute(new Float32Array(instancePositions), 3)
    );

    const halfWidth = width / 2 + CLUSTER_RADIUS;
    const halfHeight = height / 2 + CLUSTER_RADIUS;
    grassGeometry.boundingSphere = new Sphere(
      new Vector3(0, 0, 0),
      Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight + heightScale * heightScale)
    );

    return grassGeometry;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationTick, chunkX, chunkZ, seed, segments, heightScale, heightData, colorData, roadStrength, biomeDensity, width, height]);

  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDarkness: getDarknessValueUniform(),
        uAudioBass: getAudioBassUniform(),
        uGrassSegments: { value: GRASS_SEGMENTS },
        uGrassWidth: { value: GRASS_WIDTH },
        uGrassHeight: { value: GRASS_HEIGHT },
        uLeanFactor: { value: LEAN_FACTOR },
        uGrassBaseColor: { value: new Color('#2d5a25') },
        uGrassTopColor: { value: new Color('#4a7c3f') },
        uWindScale: { value: 1.5 },
        uWindStrength: { value: 0.35 },
        uWindSpeed: { value: 1.2 },
        uWindDirection: { value: 0.5 },
        uFadeProgress: { value: 0 },
        // Shared by reference with the groundPatch uniforms (mutated in
        // place by PluginDecorations) — collapses grass inside clearings.
        uPatchCount: groundPatchCountUniform,
        uPatchXZR: groundPatchXZRUniform,
      },
      side: FrontSide,
    });
    materialRef.current = mat;
    return mat;
  }, []);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    if (geometry) {
      return () => {
        geometry.dispose();
      };
    }
  }, [geometry]);

  const calculateDelay = useCallback((cx: number, cz: number) => {
    const random = alea(`${seed}-delay-${cx}-${cz}`);
    return random() * 800;
  }, [seed]);

  useEffect(() => {
    if (shouldRenderGrass && !hasEverBeenVisibleRef.current.has(chunkKey)) {
      hasEverBeenVisibleRef.current.add(chunkKey);
      if (initialDelayRef.current === null) {
        initialDelayRef.current = calculateDelay(chunkX, chunkZ);
      }
      currentOpacityRef.current = 0;
      fadeStartTimeRef.current = 0;
      progressiveLoadStartRef.current = null;
    } else if (shouldRenderGrass && hasEverBeenVisibleRef.current.has(chunkKey)) {
      currentOpacityRef.current = 1;
      fadeStartTimeRef.current = null;
      progressiveLoadStartRef.current = null;
    } else {
      currentOpacityRef.current = 0;
      fadeStartTimeRef.current = null;
      progressiveLoadStartRef.current = null;
    }
  }, [shouldRenderGrass, chunkKey, chunkX, chunkZ, calculateDelay]);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    if (fadeStartTimeRef.current === null) return;

    if (fadeStartTimeRef.current === 0) {
      fadeStartTimeRef.current = state.clock.elapsedTime;
    }

    const timeSinceStart = (state.clock.elapsedTime - fadeStartTimeRef.current) * 1000;
    const chunkDelay = initialDelayRef.current || 0;

    if (timeSinceStart < chunkDelay) {
      currentOpacityRef.current = 0;
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    if (!meshRef.current.visible) meshRef.current.visible = true;

    if (progressiveLoadStartRef.current === null) {
      progressiveLoadStartRef.current = state.clock.elapsedTime;
    }

    const fadeElapsed = (state.clock.elapsedTime - progressiveLoadStartRef.current) * 1000;
    const fadeDuration = 400;
    const newOpacity = Math.min(fadeElapsed / fadeDuration, 1);

    currentOpacityRef.current = newOpacity;
    materialRef.current.uniforms.uFadeProgress.value = newOpacity;

    if (newOpacity >= 1) {
      fadeStartTimeRef.current = null;
      progressiveLoadStartRef.current = null;
    }
  });

  if (!geometry || !shouldRenderGrass) return null;

  return (
    <mesh
      ref={meshRef as any}
      geometry={geometry}
      material={material}
      userData={{ camExcludeCollision: true }}
      raycast={() => null}
    />
  );
};
