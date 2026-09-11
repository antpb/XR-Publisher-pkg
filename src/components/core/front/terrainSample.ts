/**
 * Per-point terrain sampler — an APPROXIMATE height/water query at any world
 * (x, z), without the player being there and without a rapier raycast.
 *
 * It replicates the heightfield pipeline `createTerrainMesh` runs per vertex
 * (terrainHelpers.ts): multi-octave noise → biome height multiplier → ocean-basin
 * subtraction → the same 0.48 waterline. It deliberately SKIPS mountain base
 * influence (a local raise that only matters right at a mountain foot) and uses
 * the float world coordinate instead of the integer grid sample, so it is a
 * close approximation — exact enough to route paths around water and pick dry
 * build sites, not for collision. For exact ground contact near the player use
 * the rapier path (getGroundHeight / window.__xrGetGroundHeight).
 *
 * Terrain params are published by InfiniteTerrain as window.__xrTerrainParams.
 */
import { createNoise2D } from 'simplex-noise';
import { alea } from 'seedrandom';
import { getBiomeHeightMultiplier, getOceanFade } from './biomeHelpers';
import { mapRange } from './terrainHelpers';

export interface TerrainParams {
  width: number;
  height: number;
  scale: number;
  heightScale: number;
  seed: string;
  octaves: number;
  persistence: number;
  lacunarity: number;
  positionY: number;
}

export interface TerrainSample {
  /** World Y of the terrain surface (≈ the mesh height + the block's positionY). */
  worldY: number;
  /** 0..1 normalized height; < 0.48 is underwater. */
  normalizedHeight: number;
  /** True where the surface sits below the waterline. */
  isWater: boolean;
}

const _noiseBySeed = new Map<string, ReturnType<typeof createNoise2D>>();
function noiseFor(seed: string): ReturnType<typeof createNoise2D> {
  let n = _noiseBySeed.get(seed);
  if (!n) { n = createNoise2D(alea(seed)); _noiseBySeed.set(seed, n); }
  return n;
}

// The mesh samples the heightfield at INTEGER chunk-pixel coordinates, not the
// vertex's own world position: a vertex at world W in the chunk owning it reads
// pixel `floor(((W-pos)/dim + 0.5)·(dim-1))` whose noise coordinate is
// `pixel + pos` (terrainHelpers.ts: generateHeightField offset scheme +
// createTerrainMesh's pixelX lookup). Sampling the noise at the raw world coord
// instead is off by ~half a chunk, which shifts every water boundary — fatal for
// routing. Reproduce the exact pixel coordinate here.
function pixelNoiseCoord(world: number, dim: number): number {
  const grid = Math.round(world / dim);
  const pos = grid * dim;
  let io = (world - pos) / dim + 0.5;        // 0..1 within the owning chunk
  io = Math.max(0, Math.min(1, io));
  const pixel = Math.floor(io * (dim - 1));
  return pixel + pos;
}

/** Single-point version of generateHeightField (terrainHelpers.ts) → 0..1. */
function heightField01(worldX: number, worldZ: number, p: TerrainParams): number {
  const noise2D = noiseFor(p.seed);
  const hx = pixelNoiseCoord(worldX, p.width);
  const hz = pixelNoiseCoord(worldZ, p.height);
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;
  for (let o = 0; o < p.octaves; o++) {
    const nx = (hx / p.width) * p.scale * frequency;
    const ny = (hz / p.height) * p.scale * frequency;
    value += noise2D(nx, ny) * amplitude;
    max += amplitude;
    amplitude *= p.persistence;
    frequency *= p.lacunarity;
  }
  value = mapRange(value / max, -1, 1, 0, 1);
  value = 0.5 + (value - 0.5) * 0.15;
  let t = value;
  t = t * t * (3 - 2 * t);
  return t * t * (3 - 2 * t);
}

export function sampleTerrain(worldX: number, worldZ: number, p: TerrainParams): TerrainSample {
  // Heightfield uses pixel-mapped coords; biome/ocean use the true world coord
  // (matches createTerrainMesh, which calls getBiome…/getOceanFade with worldX/Z).
  const h01 = heightField01(worldX, worldZ, p);
  let terrainHeight = mapRange(h01, 0, 1, -p.heightScale, p.heightScale);
  terrainHeight *= getBiomeHeightMultiplier(worldX, worldZ, p.seed);
  terrainHeight -= getOceanFade(worldX, worldZ, p.seed) * p.heightScale * 0.5;
  // (Mountain base influence intentionally skipped — see file header.)
  const normalizedHeight = mapRange(terrainHeight, -p.heightScale, p.heightScale, 0, 1);
  return {
    worldY: terrainHeight + p.positionY,
    normalizedHeight,
    isWater: normalizedHeight < 0.48,
  };
}

/** Read the active terrain params published by InfiniteTerrain. */
export function activeTerrainParams(): TerrainParams | null {
  const p = (typeof window !== 'undefined') ? (window as any).__xrTerrainParams : null;
  return (p && typeof p.seed === 'string') ? p as TerrainParams : null;
}
