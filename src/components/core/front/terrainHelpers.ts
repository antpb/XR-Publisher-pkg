import { createNoise2D } from 'simplex-noise';
import { alea } from 'seedrandom';
import { PlaneGeometry, Color, BufferAttribute } from 'three';
import { getBiomeWeights, getBiomeHeightMultiplier, getBiomeTerrainColor, getOceanFade, type BiomeId } from './biomeHelpers';
import { getMountainsNearChunk, getMountainBaseInfluence } from './worldHelpers';

// Utility function to map values from one range to another
export const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export function generateHeightField(
  width: number,
  height: number,
  scale: number,
  seed: string,
  octaves: number,
  persistence: number,
  lacunarity: number,
  offsetX: number = 0,
  offsetZ: number = 0
): Float32Array {
  const noise2D = createNoise2D(alea(seed));
  const heightMap = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      let value = 0;
      let amplitude = 1;
      let frequency = 1;
      let max = 0;

      for (let octave = 0; octave < octaves; octave++) {
        // Key fix: Sample noise at integer grid points for edge alignment
        // Pixel x=99 of chunk at offset 0 should sample same as pixel x=0 of chunk at offset 100
        const worldX = (x + offsetX);  // Integer world coordinate
        const worldZ = (y + offsetZ);
        const nx = (worldX / width) * scale * frequency;
        const ny = (worldZ / height) * scale * frequency;
        value += noise2D(nx, ny) * amplitude;

        max += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }

      value = mapRange(value / max, -1, 1, 0, 1);

      value = 0.5 + (value - 0.5) * 0.15;

      let t = value;
      t = t * t * (3 - 2 * t);
      value = t * t * (3 - 2 * t);

      heightMap[index] = value;
    }
  }

  return heightMap;
}

// Complete terrain geometry generation - moved out of React component to avoid bundler variable collisions
export function createTerrainMesh(params: {
  width: number;
  height: number;
  segments: number;
  scale: number;
  heightScale: number;
  seed: string;
  noiseOctaves: number;
  noisePersistence: number;
  noiseLacunarity: number;
  positionX: number;
  positionZ: number;
}): { geometry: PlaneGeometry; highestPoints: Array<{ x: number; y: number; z: number }> } | null {
  const { width, height, segments, scale, heightScale, seed, noiseOctaves, noisePersistence, noiseLacunarity, positionX, positionZ } = params;
  
  const heightMap = generateHeightField(
    width,
    height,
    scale,
    seed,
    noiseOctaves,
    noisePersistence,
    noiseLacunarity,
    positionX,
    positionZ
  );

  const chunkGridX = Math.round(positionX / width);
  const chunkGridZ = Math.round(positionZ / height);
  const nearbyMountains = getMountainsNearChunk(chunkGridX, chunkGridZ, width, height, seed, width * 2);

  const geometry = new PlaneGeometry(width, height, segments, segments);
  const vertices = geometry.attributes.position.array;
  const colors = new Float32Array(vertices.length);

  const sectionSize = Math.floor(segments / 10);
  const highestPoints: { [key: string]: { x: number; y: number; z: number } } = {};
  const sectionHeights: { [key: string]: number } = {};

  const verticesPerSide = segments + 1;
  
  // First pass: set all heights
  for (let j = 0; j <= segments; j++) {
    for (let i = 0; i <= segments; i++) {
      const vertexIndex = (j * verticesPerSide + i) * 3;
      
      const pixelX = Math.floor((i / segments) * (width - 1));
      const pixelZ = Math.floor((j / segments) * (height - 1));
      const pixelIndex = pixelZ * width + pixelX;

      const worldX = positionX + (i / segments - 0.5) * width;
      const worldZ = positionZ + (j / segments - 0.5) * height;
      const biomeMultiplier = getBiomeHeightMultiplier(worldX, worldZ, seed);
      let terrainHeight = mapRange(heightMap[pixelIndex], 0, 1, -heightScale, heightScale);
      terrainHeight *= biomeMultiplier;
      // Rare ocean basins: large smooth depressions below the water level.
      // MUST mirror lib.rs generate_terrain exactly (WASM/JS parity).
      terrainHeight -= getOceanFade(worldX, worldZ, seed) * heightScale * 0.5;
      terrainHeight += getMountainBaseInfluence(worldX, worldZ, nearbyMountains);
      vertices[vertexIndex + 2] = terrainHeight;

      const sectionX = Math.floor(i / sectionSize);
      const sectionZ = Math.floor(j / sectionSize);
      const sectionKey = `${sectionX},${sectionZ}`;
      
      if (!sectionHeights[sectionKey] || terrainHeight > sectionHeights[sectionKey]) {
        sectionHeights[sectionKey] = terrainHeight;
        highestPoints[sectionKey] = { x: i, y: terrainHeight, z: j };
      }
    }
  }

  // Second pass: calculate distance from water for each land vertex
  const distanceFromWater = new Float32Array((segments + 1) * (segments + 1));
  distanceFromWater.fill(999);
  
  // Find all underwater vertices
  for (let j = 0; j <= segments; j++) {
    for (let i = 0; i <= segments; i++) {
      const vertexIndex = (j * verticesPerSide + i) * 3;
      const terrainHeight = vertices[vertexIndex + 2];
      const normalizedHeight = mapRange(terrainHeight, -heightScale, heightScale, 0, 1);
      
      if (normalizedHeight < 0.48) {
        distanceFromWater[j * verticesPerSide + i] = 0;
      }
    }
  }
  
  // Calculate distance from water for land vertices (simple flood fill approach)
  for (let pass = 0; pass < 10; pass++) {
    const newDistances = new Float32Array(distanceFromWater);
    for (let j = 0; j <= segments; j++) {
      for (let i = 0; i <= segments; i++) {
        const idx = j * verticesPerSide + i;
        if (distanceFromWater[idx] > 0) {
          let minNeighborDist = distanceFromWater[idx];
          const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (const [di, dj] of neighbors) {
            const ni = i + di;
            const nj = j + dj;
            if (ni >= 0 && ni <= segments && nj >= 0 && nj <= segments) {
              minNeighborDist = Math.min(minNeighborDist, distanceFromWater[nj * verticesPerSide + ni] + 1);
            }
          }
          newDistances[idx] = minNeighborDist;
        }
      }
    }
    distanceFromWater.set(newDistances);
  }
  
  // Third pass: assign colors with gradient from rocky to green
  for (let j = 0; j <= segments; j++) {
    for (let i = 0; i <= segments; i++) {
      const vertexIndex = (j * verticesPerSide + i) * 3;
      const terrainHeight = vertices[vertexIndex + 2];
      const normalizedHeight = mapRange(terrainHeight, -heightScale, heightScale, 0, 1);
      const terrainColor = new Color();
      const waterDist = distanceFromWater[j * verticesPerSide + i];
      
      // Rocky shores: 0-6 cells from water with gradient (much wider)
      if (normalizedHeight >= 0.48 && normalizedHeight < 0.56 && waterDist > 0 && waterDist <= 6) {
        const rockyTan = new Color(0xa89d8a); // Lighter, desaturated tan/brown
        const darkGreen = new Color(0x228800);
        const blend = (waterDist - 1) / 5; // 0 at edge, 1 at distance 6
        terrainColor.lerpColors(rockyTan, darkGreen, blend);
      } else if (normalizedHeight < 0.48) {
        terrainColor.setHex(0x2d5f6f); // Blue-tinted underwater terrain
      } else if (normalizedHeight < 0.50) {
        terrainColor.setHex(0x228800); // Dark green
      } else if (normalizedHeight < 0.53) {
        terrainColor.setHex(0x4a7c59); // Medium green
      } else if (normalizedHeight < 0.56) {
        terrainColor.setHex(0x6b9b6e); // Light green
      } else if (normalizedHeight < 0.58) {
        terrainColor.setHex(0x8db68d); // Pale green
      // Dry vegetation → earth → rock tiers; snow-white reserved for ≥0.90.
      // MUST mirror lib.rs generate_terrain exactly (WASM/JS parity).
      } else if (normalizedHeight < 0.62) {
        terrainColor.setHex(0x9aa06f); // Dry sage grass
      } else if (normalizedHeight < 0.68) {
        terrainColor.setHex(0x9a8f72); // Sun-dried earth
      } else if (normalizedHeight < 0.78) {
        terrainColor.setHex(0x8d867c); // Rocky grey-brown
      } else if (normalizedHeight < 0.90) {
        terrainColor.setHex(0x9a9a9a); // Bare rock
      } else {
        terrainColor.setHex(0xe8edf2); // Snow — extreme peaks only
      }

      // ── Smooth biome blending at boundaries ──
      // Instead of snapping to one biome's color, blend all biome colors
      // weighted by their smooth membership function.  This creates natural
      // material fading at biome edges.
      const biomeWorldX = positionX + (i / segments - 0.5) * width;
      const biomeWorldZ = positionZ + (j / segments - 0.5) * height;
      const weights = getBiomeWeights(biomeWorldX, biomeWorldZ, seed);

      // Check if any non-default biome has influence
      const nonDefaultWeight = 1 - weights.default;
      if (nonDefaultWeight > 0.01) {
        const blended = new Color(0, 0, 0);
        const biomeIds: BiomeId[] = ['mountains', 'wetlands', 'buildable', 'plains', 'default'];
        for (const biomeId of biomeIds) {
          const w = weights[biomeId];
          if (w < 0.01) continue;
          const biomeColor = getBiomeTerrainColor(biomeId, normalizedHeight, waterDist);
          if (biomeColor) {
            blended.r += biomeColor.r * w;
            blended.g += biomeColor.g * w;
            blended.b += biomeColor.b * w;
          } else {
            // 'default' biome uses the base terrain color computed above
            blended.r += terrainColor.r * w;
            blended.g += terrainColor.g * w;
            blended.b += terrainColor.b * w;
          }
        }
        terrainColor.copy(blended);
      }

      colors[vertexIndex] = terrainColor.r;
      colors[vertexIndex + 1] = terrainColor.g;
      colors[vertexIndex + 2] = terrainColor.b;
    }
  }

  const positionAttribute = new BufferAttribute(vertices, 3);
  positionAttribute.needsUpdate = true;
  geometry.setAttribute('position', positionAttribute);
  
  const colorAttribute = new BufferAttribute(colors, 3);
  colorAttribute.needsUpdate = true;
  geometry.setAttribute('color', colorAttribute);
  
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);

  const filteredHighestPoints = Object.values(highestPoints).filter(point => 
    !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
    isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
  );

  return { 
    geometry, 
    highestPoints: filteredHighestPoints
  };
}

