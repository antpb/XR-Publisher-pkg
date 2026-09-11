import React, { useMemo, useRef, useEffect } from 'react';
import {
  Vector3, Group, Mesh, DoubleSide, FrontSide,
  SphereGeometry, CylinderGeometry, ShaderMaterial, Color
} from 'three';
import { alea } from 'seedrandom';
import { getDarknessValueUniform } from './terrainDarkness';
import { useChunkProximityVisible } from './useChunkProximityVisible';


interface ProceduralFlowersProps {
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
  flowerDensity?: number;
  positionY?: number;
}

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

const FLOWER_PALETTES = [
  { petal: 0xff4466, center: 0xffdd33 },
  { petal: 0xffaa22, center: 0x663300 },
  { petal: 0xaa44ff, center: 0xffee55 },
  { petal: 0xff88cc, center: 0xffff88 },
  { petal: 0x4488ff, center: 0xffee44 },
  { petal: 0xffffff, center: 0xffdd00 },
  { petal: 0xff6633, center: 0x442200 },
];

let _sharedStemMaterial: ShaderMaterial | null = null;

function getSharedStemMaterial(): ShaderMaterial {
  if (!_sharedStemMaterial) {
    _sharedStemMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDarkness: getDarknessValueUniform()
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          float windX = sin(worldPos.x * 5.0 + uTime * 0.6) * 0.006;
          float windZ = sin(worldPos.z * 5.0 + uTime * 0.45) * 0.003;
          vec3 displaced = position + vec3(windX, 0.0, windZ);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uDarkness;
        varying vec3 vNormal;
        void main() {
          vec3 baseColor = vec3(0.20, 0.40, 0.12);
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

const _petalMaterialCache = new Map<number, ShaderMaterial>();

function getPetalMaterial(colorHex: number): ShaderMaterial {
  if (_petalMaterialCache.has(colorHex)) {
    return _petalMaterialCache.get(colorHex)!;
  }

  const c = new Color(colorHex);
  const mat = new ShaderMaterial({
    uniforms: {
      uColor: { value: [c.r, c.g, c.b] },
      uTime: { value: 0 },
      uDarkness: getDarknessValueUniform()
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        float windX = sin(worldPos.x * 5.0 + uTime * 0.8) * 0.008;
        float windZ = sin(worldPos.z * 5.0 + uTime * 0.6) * 0.004;
        vec3 displaced = position + vec3(windX, 0.0, windZ);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uDarkness;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float ndv = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
        float fresnel = pow(1.0 - ndv, 2.0) * 0.2;
        vec3 litColor = uColor + fresnel;
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        float diffuse = max(dot(normalize(vNormal), lightDir), 0.35);
        vec3 finalColor = litColor * (0.55 + 0.45 * diffuse) * uDarkness;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: DoubleSide
  });

  _petalMaterialCache.set(colorHex, mat);
  return mat;
}

const _centerMaterialCache = new Map<number, ShaderMaterial>();

function getCenterMaterial(colorHex: number): ShaderMaterial {
  if (_centerMaterialCache.has(colorHex)) {
    return _centerMaterialCache.get(colorHex)!;
  }

  const c = new Color(colorHex);
  const mat = new ShaderMaterial({
    uniforms: {
      uDarkness: getDarknessValueUniform()
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
      void main() {
        vec3 baseColor = vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)});
        gl_FragColor = vec4(baseColor * uDarkness, 1.0);
      }
    `,
    side: FrontSide
  });

  _centerMaterialCache.set(colorHex, mat);
  return mat;
}

function generateFlowerPositions(
  chunkX: number,
  chunkZ: number,
  seed: string,
  _width: number,
  _height: number,
  heightScale: number,
  segments: number,
  heightData: Float32Array,
  colorData: Float32Array | undefined,
  flowerDensity: number
): Array<{ x: number; y: number; z: number; scale: number; rotation: number; paletteIndex: number; seed: number }> {
  if (flowerDensity <= 0) return [];

  const random = alea(`${seed}-flowers-${chunkX}-${chunkZ}`);
  const verticesPerSide = segments + 1;

  const flowers: Array<{ x: number; y: number; z: number; scale: number; rotation: number; paletteIndex: number; seed: number }> = [];

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
      if (normalizedHeight < 0.50 || normalizedHeight > 0.56) continue;

      // See note in ProceduralFlowers.tsx — spawnChance cannot branch on UA.
      const spawnChance = 0.05 * flowerDensity;
      if (random() < spawnChance) {
        const clusterCount = 2 + Math.floor(random() * 4);
        const paletteIndex = Math.floor(random() * FLOWER_PALETTES.length);

        for (let c = 0; c < clusterCount; c++) {
          const offsetX = (random() - 0.5) * 2.0;
          const offsetZ = (random() - 0.5) * 2.0;
          flowers.push({
            x: vx + offsetX,
            y: vy,
            z: vz + offsetZ,
            scale: 0.15 + random() * 0.25,
            rotation: random() * Math.PI * 2,
            paletteIndex,
            seed: random() * 1000,
          });
        }
      }
    }
  }

  return flowers;
}

function createFlowerGroup(flowerScale: number, flowerSeed: number, paletteIndex: number): Group {
  const group = new Group();
  const rng = alea(`flower-${flowerSeed}`);
  const palette = FLOWER_PALETTES[paletteIndex % FLOWER_PALETTES.length];

  const stemHeight = (0.15 + rng() * 0.2) * flowerScale * 4;
  const stemRadius = 0.012 * flowerScale * 4;

  const stemGeom = new CylinderGeometry(stemRadius * 0.5, stemRadius, stemHeight, 4);
  const stem = new Mesh(stemGeom, getSharedStemMaterial());
  stem.position.y = stemHeight * 0.5;
  group.add(stem);

  const centerRadius = 0.04 * flowerScale * 4;
  const centerGeom = new SphereGeometry(centerRadius, 5, 4);
  const center = new Mesh(centerGeom, getCenterMaterial(palette.center));
  center.position.y = stemHeight;
  group.add(center);

  const petalMat = getPetalMaterial(palette.petal);
  const petalCount = 4 + Math.floor(rng() * 4);
  const petalRadius = (0.03 + rng() * 0.03) * flowerScale * 4;

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 + rng() * 0.3;
    const petalGeom = new SphereGeometry(petalRadius, 4, 3);
    const positions = petalGeom.attributes.position.array as Float32Array;
    for (let j = 0; j < positions.length; j += 3) {
      positions[j + 1] *= 0.3;
      positions[j] *= 1.4;
    }
    petalGeom.computeVertexNormals();

    const petal = new Mesh(petalGeom, petalMat);
    const dist = centerRadius + petalRadius * 0.8;
    petal.position.set(
      Math.cos(angle) * dist,
      stemHeight,
      Math.sin(angle) * dist
    );
    petal.rotation.y = -angle;
    petal.rotation.z = (rng() - 0.5) * 0.4;
    group.add(petal);
  }

  return group;
}

export function ProceduralFlowersWebGL({
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
  flowerDensity = 0.8,
  positionY = 0,
}: ProceduralFlowersProps) {
  const groupRef = useRef<Group>(null);

  // Per-frame proximity gate (see useChunkProximityVisible) — a useMemo here
  // only re-evaluated on re-render, freezing visibility between chunk streams.
  const shouldRender = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height, 1.0, 1.4,
  );

  const flowerPositions = useMemo(() => {
    if (!heightData || heightData.length === 0) return [];
    return generateFlowerPositions(
      chunkX, chunkZ, seed, width, height, heightScale,
      segments, heightData, colorData, flowerDensity
    );
  }, [chunkX, chunkZ, seed, width, height, heightScale, segments, heightData, colorData, flowerDensity]);

  const flowerGroups = useMemo(() => {
    return flowerPositions.map((pos) => {
      const group = createFlowerGroup(pos.scale, pos.seed, pos.paletteIndex);
      group.position.set(pos.x, pos.y + positionY, pos.z);
      group.rotation.y = pos.rotation;
      return group;
    });
  }, [flowerPositions, positionY]);

  useEffect(() => {
    return () => {
      for (const group of flowerGroups) {
        group.traverse((child) => {
          if (child instanceof Mesh) {
            child.geometry?.dispose();
          }
        });
      }
    };
  }, [flowerGroups]);

  if (!shouldRender || flowerPositions.length === 0) return null;

  return (
    <group ref={groupRef}>
      {flowerGroups.map((group, i) => (
        <primitive key={`flower-${chunkX}-${chunkZ}-${i}`} object={group} />
      ))}
    </group>
  );
}
