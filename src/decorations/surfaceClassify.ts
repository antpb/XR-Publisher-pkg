/**
 * Surface classification for plugin decoration placement.
 *
 * Buckets a terrain sample into a coarse "surface type" so plugin
 * decorations can target where they spawn (flowers on grass, rocks on
 * dirt paths, creatures in water, shrines on rock/snow, …) without
 * having to reason about raw height/slope/biome numbers.
 *
 * The thresholds mirror the colour bands the engine already paints in
 * `getBiomeTerrainColor` (biomeHelpers.ts) / `get_biome_terrain_color`
 * (biome.rs) — so the classified surface matches what the player
 * actually sees. This is a PURE function of values already present in
 * the decoration spawn context (normalizedHeight, waterDistance, slope,
 * biome), which are themselves derived from the WASM/JS-bit-identical
 * heightfield — so classification is deterministic across renderers.
 */

export type SurfaceType = 'water' | 'sand' | 'grass' | 'dirt' | 'rock' | 'snow';

/**
 * Classify a terrain sample into a coarse surface type.
 *
 * @param normalizedHeight 0..1 terrain height (water below ~0.48).
 * @param waterDistance    units to nearest water (capped 24u).
 * @param slope            rise/run terrain steepness.
 * @param biome            'plains'|'mountains'|'wetlands'|'buildable'|'default'.
 */
export function classifySurface(
  normalizedHeight: number,
  waterDistance: number,
  slope: number,
  biome: string,
): SurfaceType {
  // Below the waterline is water regardless of biome (matches the shared
  // 0x2d5f6f water colour every biome paints under 0.48).
  if (normalizedHeight < 0.48) return 'water';
  // The rocky→green beach blend band the colour code paints just above
  // the waterline when close to shore.
  if (normalizedHeight < 0.5 && waterDistance <= 6) return 'sand';
  // The deliberately-flat town-land biome reads as bare dirt/path.
  if (biome === 'buildable') return 'dirt';
  if (biome === 'mountains') {
    // Snow paint starts at 0.88 in the mountains ramp — real peaks only.
    if (normalizedHeight >= 0.88) return 'snow';
    return 'rock';
  }
  // Default-ramp high tiers: snow-white ≥0.90, bare rock/rocky-brown from
  // 0.68, dry earth from 0.62 (mirrors lib.rs / terrainHelpers.ts).
  if (normalizedHeight >= 0.90) return 'snow';
  if (normalizedHeight >= 0.68) return 'rock';
  if (normalizedHeight >= 0.62) return 'dirt';
  // Steep faces in any biome are exposed rock, not vegetated ground.
  if (slope > 0.5) return 'rock';
  return 'grass';
}

/** Normalize a spec's `surface` field to a Set for membership tests. */
export function toSurfaceSet(
  surface: SurfaceType | SurfaceType[] | undefined,
): Set<SurfaceType> | null {
  if (!surface) return null;
  const arr = Array.isArray(surface) ? surface : [surface];
  if (arr.length === 0) return null;
  return new Set(arr);
}
