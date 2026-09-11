import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Vector3, Group, Mesh, DoubleSide, FrontSide,
  SphereGeometry, CylinderGeometry, ShaderMaterial
} from 'three';
import { alea } from 'seedrandom';
import { getDarknessValueUniform } from './terrainDarkness';
import { useChunkProximityVisible } from './useChunkProximityVisible';


interface ProceduralShrubsProps {
  chunkX: number;
  chunkZ: number;
  seed: string;
  width: number;
  height: number;
  heightScale: number;
  segments: number;
  heightData: Float32Array;
  colorData?: Float32Array;
  playerPosition?: Vector3;
  shrubDensity?: number;
  positionY?: number;
}

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

let _sharedStemMaterial: ShaderMaterial | null = null;
let _sharedShrubMaterial: ShaderMaterial | null = null;

function getSharedStemMaterial(): ShaderMaterial {
  if (!_sharedStemMaterial) {
    _sharedStemMaterial = new ShaderMaterial({
      uniforms: {
        uDarkness: getDarknessValueUniform(),
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uDarkness;
        varying vec3 vNormal;
        void main() {
          vec3 baseColor = vec3(0.35, 0.22, 0.12);
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
          float diffuse = max(dot(vNormal, lightDir), 0.3);
          gl_FragColor = vec4(baseColor * (0.6 + 0.4 * diffuse) * uDarkness, 1.0);
        }
      `,
      side: FrontSide
    });
  }
  return _sharedStemMaterial;
}

function getSharedShrubMaterial(): ShaderMaterial {
  if (!_sharedShrubMaterial) {
    _sharedShrubMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDarkness: getDarknessValueUniform(),
      },
      vertexShader: `
        uniform float uTime;
        varying float vNormalY;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        void main() {
          // Raw object-space normal Y — drives the same top-lit gradient
          // ramp the WebGPU shrub material / baked tree canopies use.
          vNormalY = normal.y;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          float windX = sin(worldPos.x * 3.0 + uTime * 0.5) * 0.015 * position.y;
          float windZ = sin(worldPos.z * 3.0 + uTime * 0.35) * 0.0075 * position.y;
          vec3 displaced = position + vec3(windX, 0.0, windZ);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uDarkness;
        varying float vNormalY;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          // Matches the WebGPU shrub material: top-lit normal-Y gradient
          // (the same (nY+0.6)/1.5 ramp baked into tree canopies),
          // oak-palette tints, patch-noise jitter, × day/night darkness —
          // plus a static-direction wrap-lambert term (same pattern as
          // the WebGL grass twin) so foliage visibly responds to light.
          // The WebGPU twin is genuinely lit (standard, roughness 1);
          // this is its cheap approximation for the mobile-default path.
          float colorNoise = snoise(vec3(
            vWorldPosition.x * 0.18,
            vWorldPosition.y * 0.4,
            vWorldPosition.z * 0.18
          )) * 0.5 + 0.5;

          vec3 topTint = vec3(0.26, 0.45, 0.18);   // lockstep with SPECIES_OAK
          vec3 bottomTint = vec3(0.09, 0.20, 0.08);
          float grad = smoothstep(0.0, 1.0, (vNormalY + 0.6) / 1.5);
          vec3 gradColor = mix(bottomTint, topTint, grad);
          float jitter = colorNoise * 0.24 + 0.88;

          vec3 n = normalize(vWorldNormal);
          vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
          float dotNL = clamp((dot(n, lightDir) + 0.5) / 1.5, 0.0, 1.0);
          float lighting = 0.6 + 0.5 * dotNL;

          gl_FragColor = vec4(gradColor * jitter * lighting * uDarkness, 1.0);
        }
      `,
      side: DoubleSide
    });
  }
  return _sharedShrubMaterial;
}

function generateShrubPositions(
  chunkX: number,
  chunkZ: number,
  seed: string,
  _width: number,
  _height: number,
  heightScale: number,
  segments: number,
  heightData: Float32Array,
  colorData: Float32Array | undefined,
  shrubDensity: number
): Array<{ x: number; y: number; z: number; scale: number; rotation: number; seed: number }> {
  if (shrubDensity <= 0) return [];

  const random = alea(`${seed}-shrubs-${chunkX}-${chunkZ}`);
  const verticesPerSide = segments + 1;

  const shrubs: Array<{ x: number; y: number; z: number; scale: number; rotation: number; seed: number }> = [];

  const step = 10;
  for (let gz = 0; gz <= segments; gz += step) {
    for (let gx = 0; gx <= segments; gx += step) {
      const idx = gz * verticesPerSide + gx;

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

      if (!isGreen) continue;
      if (normalizedHeight < 0.50 || normalizedHeight > 0.58) continue;

      // See ProceduralShrubs.tsx — spawn cannot branch on UA.
      const spawnChance = 0.03 * shrubDensity;
      if (random() < spawnChance) {
        shrubs.push({
          x: vx,
          y: vy,
          z: vz,
          scale: 0.8 + random() * 1.2,
          rotation: random() * Math.PI * 2,
          seed: random() * 1000,
        });
      }
    }
  }

  return shrubs;
}

function createShrubGroup(shrubScale: number, shrubSeed: number): Group {
  const group = new Group();
  const rng = alea(`shrub-${shrubSeed}`);

  const stemMat = getSharedStemMaterial();
  const foliageMat = getSharedShrubMaterial();

  const stemCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < stemCount; i++) {
    const stemHeight = (0.3 + rng() * 0.4) * shrubScale;
    const stemRadius = 0.025 * shrubScale;
    const stemAngle = rng() * Math.PI * 2;
    const stemLean = (rng() - 0.5) * 0.4;
    const stemOffset = rng() * 0.15 * shrubScale;

    const stemGeom = new CylinderGeometry(stemRadius * 0.6, stemRadius, stemHeight, 4);
    const stem = new Mesh(stemGeom, stemMat);
    stem.position.set(
      Math.cos(stemAngle) * stemOffset,
      stemHeight * 0.5,
      Math.sin(stemAngle) * stemOffset
    );
    stem.rotation.z = stemLean;
    group.add(stem);
  }

  const clumpCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < clumpCount; i++) {
    const clumpRadius = (0.4 + rng() * 0.5) * shrubScale;
    const clumpHeight = (0.35 + rng() * 0.45) * shrubScale;
    const clumpAngle = rng() * Math.PI * 2;
    const clumpOffset = rng() * 0.2 * shrubScale;

    const clumpGeom = new SphereGeometry(clumpRadius, 6, 5);
    const positions = clumpGeom.attributes.position.array as Float32Array;
    for (let j = 0; j < positions.length; j += 3) {
      positions[j + 1] *= (clumpHeight / clumpRadius);
      const noiseOffset = Math.sin(positions[j] * 5 + shrubSeed) * 0.15 * clumpRadius;
      positions[j] += noiseOffset;
      positions[j + 2] += Math.cos(positions[j + 2] * 5 + shrubSeed) * 0.1 * clumpRadius;
    }
    clumpGeom.computeVertexNormals();

    const clump = new Mesh(clumpGeom, foliageMat);
    clump.position.set(
      Math.cos(clumpAngle) * clumpOffset,
      clumpHeight * 0.6,
      Math.sin(clumpAngle) * clumpOffset
    );
    clump.castShadow = true;
    group.add(clump);
  }

  return group;
}

export function ProceduralShrubsWebGL({
  chunkX,
  chunkZ,
  seed,
  width,
  height,
  heightScale,
  segments,
  heightData,
  colorData,
  playerPosition,
  shrubDensity = 0.8,
  positionY = 0,
}: ProceduralShrubsProps) {
  const groupRef = useRef<Group>(null);

  // Drive the shared material's wind clock (it was never updated before —
  // WebGL shrubs sat frozen while the WebGPU ones swayed). All chunks
  // share one material; redundant same-value writes are harmless.
  useFrame((state) => {
    if (_sharedShrubMaterial) {
      _sharedShrubMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Per-frame proximity gate (see useChunkProximityVisible) — a useMemo here
  // only re-evaluated on re-render, freezing visibility between chunk streams.
  const shouldRender = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height, 1.2, 1.6,
  );

  const shrubPositions = useMemo(() => {
    if (!heightData || heightData.length === 0) return [];
    return generateShrubPositions(
      chunkX, chunkZ, seed, width, height, heightScale,
      segments, heightData, colorData, shrubDensity
    );
  }, [chunkX, chunkZ, seed, width, height, heightScale, segments, heightData, colorData, shrubDensity]);

  const shrubGroups = useMemo(() => {
    return shrubPositions.map((pos) => {
      const group = createShrubGroup(pos.scale, pos.seed);
      group.position.set(pos.x, pos.y + positionY, pos.z);
      group.rotation.y = pos.rotation;
      return group;
    });
  }, [shrubPositions, positionY]);

  useEffect(() => {
    return () => {
      for (const group of shrubGroups) {
        group.traverse((child) => {
          if (child instanceof Mesh) {
            child.geometry?.dispose();
          }
        });
      }
    };
  }, [shrubGroups]);

  if (!shouldRender || shrubPositions.length === 0) return null;

  return (
    <group ref={groupRef}>
      {shrubGroups.map((group, i) => (
        <primitive key={`shrub-${chunkX}-${chunkZ}-${i}`} object={group} />
      ))}
    </group>
  );
}
