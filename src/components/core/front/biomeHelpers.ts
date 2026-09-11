import { createNoise2D } from 'simplex-noise';
import { alea } from 'seedrandom';
import { Color } from 'three';

export type BiomeId = 'plains' | 'mountains' | 'wetlands' | 'buildable' | 'default';

export interface BiomeType {
  id: BiomeId;
  heightMultiplier: number;
  grassDensity: number;
  boulderDensity: number;
  treeDensity: number;
  shrubDensity: number;
  flowerDensity: number;
}

export const BIOMES: Record<BiomeId, BiomeType> = {
  plains: {
    id: 'plains',
    heightMultiplier: 0.6,
    grassDensity: 1.2,
    boulderDensity: 0.3,
    treeDensity: 0.6,
    shrubDensity: 1.0,
    flowerDensity: 1.2,
  },
  mountains: {
    id: 'mountains',
    heightMultiplier: 1.6,
    grassDensity: 0.3,
    boulderDensity: 1.5,
    treeDensity: 0.0,
    shrubDensity: 0.0,
    flowerDensity: 0.0,
  },
  wetlands: {
    id: 'wetlands',
    heightMultiplier: 0.4,
    grassDensity: 0.6,
    boulderDensity: 0.1,
    treeDensity: 0.25,
    shrubDensity: 0.8,
    flowerDensity: 0.6,
  },
  buildable: {
    id: 'buildable',
    heightMultiplier: 0.12,
    grassDensity: 0.05,
    boulderDensity: 0.0,
    treeDensity: 0.0,
    shrubDensity: 0.0,
    flowerDensity: 0.0,
  },
  default: {
    id: 'default',
    heightMultiplier: 1.0,
    grassDensity: 1.0,
    boulderDensity: 1.0,
    treeDensity: 0.4,
    shrubDensity: 0.8,
    flowerDensity: 0.8,
  },
};

const noiseCache = new Map<string, ReturnType<typeof createNoise2D>>();

function getCachedNoise(key: string): ReturnType<typeof createNoise2D> {
  if (!noiseCache.has(key)) {
    noiseCache.set(key, createNoise2D(alea(key)));
  }
  return noiseCache.get(key)!;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ─── Noise frequencies ───
// Lower frequency = larger biome regions. At 0.0008, wavelength ≈ 1250 units
// which means each biome region covers 10-15 terrain chunks — ensuring
// "at least one repeated cell" and realistic-sized biome areas.
const ELEV_FREQ = 0.0008;
const MOIST_FREQ = 0.001;

// Cached noise sample (avoid recalculating for same worldX, worldZ)
function sampleBiomeNoise(worldX: number, worldZ: number, seed: string) {
  const elevNoise = getCachedNoise(`${seed}-biome-elev`);
  const moistNoise = getCachedNoise(`${seed}-biome-moist`);
  const elevation = elevNoise(worldX * ELEV_FREQ, worldZ * ELEV_FREQ);
  const moisture = moistNoise(worldX * MOIST_FREQ + 1000, worldZ * MOIST_FREQ + 1000);
  return { elevation, moisture };
}

export function getBiomeAt(worldX: number, worldZ: number, seed: string): BiomeType {
  const { elevation, moisture } = sampleBiomeNoise(worldX, worldZ, seed);

  if (elevation > 0.35) return BIOMES.mountains;
  if (elevation < -0.25 && moisture > 0.3) return BIOMES.wetlands;
  if (Math.abs(elevation) < 0.15 && moisture < -0.3) return BIOMES.buildable;
  if (elevation < -0.2) return BIOMES.plains;
  return BIOMES.default;
}

/**
 * Returns smooth blending weights for each biome at a world position.
 * Weights sum to 1.0. Used for smooth color transitions at biome boundaries.
 */
export function getBiomeWeights(
  worldX: number,
  worldZ: number,
  seed: string
): Record<BiomeId, number> {
  const { elevation, moisture } = sampleBiomeNoise(worldX, worldZ, seed);

  // Compute soft membership for each biome using overlapping smooth functions.
  // The smoothstep ranges overlap, creating gradual blending zones at borders.
  const mountainW = smoothstep(0.25, 0.45, elevation);
  const wetlandsW = smoothstep(0.15, 0.40, moisture) *
                    smoothstep(-0.10, -0.30, elevation) *
                    (1 - mountainW);
  const buildableW = (1 - smoothstep(0.05, 0.20, Math.abs(elevation))) *
                     smoothstep(-0.15, -0.35, moisture) *
                     (1 - mountainW) *
                     (1 - wetlandsW);
  const plainsW = smoothstep(-0.10, -0.25, elevation) *
                  (1 - mountainW) *
                  (1 - wetlandsW) *
                  (1 - buildableW);
  const defaultW = Math.max(0, 1 - mountainW - wetlandsW - buildableW - plainsW);

  const total = mountainW + wetlandsW + buildableW + plainsW + defaultW;
  if (total < 0.001) {
    return { mountains: 0, wetlands: 0, buildable: 0, plains: 0, default: 1 };
  }

  return {
    mountains: mountainW / total,
    wetlands: wetlandsW / total,
    buildable: buildableW / total,
    plains: plainsW / total,
    default: defaultW / total,
  };
}

// ─── Ocean basins ───
// Rare, very large water bodies (semi-ocean scale), built the same way the
// buildable biome makes flat town land: thresholds on low-frequency noise.
// Two gates multiply:
//  - core: the deepest cells of the existing biome-elevation field
//    (elevation < ~-0.42, full by -0.6) — natural lowland placement;
//  - gate: a dedicated VERY-low-frequency noise (`${seed}-ocean`,
//    wavelength ~4km) thresholded high, so only a small fraction of
//    macro-regions permit oceans at all.
// Empirically (sampled 36 km² across seeds): 5-11 basins per 36 km² ⇒
// ~1-3 within a typical 3 km roam, diameters ~200-760u. The fade value
// (0..1) is subtracted from terrain height (× heightScale × 0.5) in BOTH
// mesh builders — everything downstream (water mask, colors, decoration
// suppression, wave openness) derives from the final height for free.
// A spawn-safety falloff keeps any basin ≥150u away from the origin so a
// seed can never drop the player into deep water at load.
//
// PARITY: mirrored bit-for-bit by `get_ocean_fade` in crates/.../biome.rs.
const OCEAN_GATE_FREQ = 0.00025;

export function getOceanFade(worldX: number, worldZ: number, seed: string): number {
  const spawnDist = Math.sqrt(worldX * worldX + worldZ * worldZ);
  const spawnSafe = smoothstep(150, 400, spawnDist);
  if (spawnSafe <= 0) return 0;
  const { elevation } = sampleBiomeNoise(worldX, worldZ, seed);
  const core = smoothstep(-0.42, -0.6, elevation);
  if (core <= 0) return 0;
  const gateNoise = getCachedNoise(`${seed}-ocean`);
  const gate = smoothstep(0.45, 0.6, gateNoise(worldX * OCEAN_GATE_FREQ, worldZ * OCEAN_GATE_FREQ));
  return core * gate * spawnSafe;
}

export function getBiomeHeightMultiplier(worldX: number, worldZ: number, seed: string): number {
  const { elevation, moisture } = sampleBiomeNoise(worldX, worldZ, seed);

  const mountainFade = smoothstep(0.25, 0.45, elevation);
  const plainsFade = smoothstep(-0.1, -0.3, elevation);
  const wetlandsFade = smoothstep(0.2, 0.4, moisture) * smoothstep(-0.15, -0.35, elevation);
  const buildableFade = (1 - smoothstep(0.05, 0.25, Math.abs(elevation))) * smoothstep(-0.2, -0.4, moisture);

  let multiplier = 1.0;
  multiplier += (BIOMES.mountains.heightMultiplier - 1.0) * mountainFade;
  multiplier += (BIOMES.plains.heightMultiplier - 1.0) * plainsFade;
  multiplier += (BIOMES.wetlands.heightMultiplier - 1.0) * wetlandsFade;
  multiplier += (BIOMES.buildable.heightMultiplier - 1.0) * buildableFade;

  return Math.max(0.1, multiplier);
}

/**
 * Get the terrain color for a specific biome.
 * Returns null for 'default' biome (uses the standard terrain color).
 */
export function getBiomeTerrainColor(
  biomeId: BiomeId,
  normalizedHeight: number,
  waterDist: number
): Color | null {
  if (biomeId === 'default') return null;

  const c = new Color();

  if (biomeId === 'buildable') {
    if (normalizedHeight < 0.48) return c.setHex(0x2d5f6f);
    const t = Math.min(1, Math.max(0, waterDist / 4));
    return c.lerpColors(new Color(0x6b5335), new Color(0x8b7355), t);
  }

  if (biomeId === 'mountains') {
    // MUST mirror biome.rs get_biome_terrain_color (the WASM path is what
    // players actually see; this fallback had drifted to a near-white cap
    // at 0.7). Snow-white only ≥0.88 — real-peak territory.
    if (normalizedHeight < 0.48) return c.setHex(0x2d5f6f);
    if (normalizedHeight < 0.52) return c.setHex(0x6b675c);
    if (normalizedHeight < 0.58) return c.setHex(0x7d786b);
    if (normalizedHeight < 0.66) return c.setHex(0x8a857a);
    if (normalizedHeight < 0.78) return c.setHex(0x969288);
    if (normalizedHeight < 0.88) return c.setHex(0xa8a8a8);
    return c.setHex(0xdfe6ec);
  }

  if (biomeId === 'wetlands') {
    if (normalizedHeight < 0.48) return c.setHex(0x2d5f6f);
    if (normalizedHeight < 0.50) return c.setHex(0x2a5530);
    if (normalizedHeight < 0.53) return c.setHex(0x3a6b3a);
    return c.setHex(0x4a7c4a);
  }

  if (biomeId === 'plains') {
    if (normalizedHeight < 0.48) return c.setHex(0x2d5f6f);
    if (normalizedHeight >= 0.48 && normalizedHeight < 0.50 && waterDist > 0 && waterDist <= 6) {
      const blend = (waterDist - 1) / 5;
      return c.lerpColors(new Color(0xa89d8a), new Color(0x2a8800), blend);
    }
    if (normalizedHeight < 0.50) return c.setHex(0x2a8800);
    if (normalizedHeight < 0.53) return c.setHex(0x5a8f4a);
    if (normalizedHeight < 0.56) return c.setHex(0x7ab55a);
    return c.setHex(0x8dc88d);
  }

  return null;
}

export function clearBiomeCache(): void {
  noiseCache.clear();
}
