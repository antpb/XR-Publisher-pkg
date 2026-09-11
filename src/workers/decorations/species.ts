/**
 * Blob-canopy tree species presets (Breath-of-the-Wild-style).
 *
 * The previous Sapling/Weber-Penn recursion produced combinatorial branch
 * counts (oak: 45×28×20 ≈ 25k terminal branches ≈ 845k verts per tree) and
 * hundreds of independently-shaded alpha-tested foliage cards — the main
 * CPU/memory cost of the world and a noisy, "fake" look. The new design is
 * a stylized silhouette: one curved tapered trunk with a root flare, a few
 * short limbs, and 2–4 large noise-displaced squashed icosphere canopy
 * blobs (~220 verts per tree, opaque, vertex-color shaded).
 *
 * Shading is baked into vertex colors in the worker (top-lit gradient,
 * per-blob tint jitter) so an unlit vertex-color material renders the same
 * look on both the WebGPU and WebGL paths.
 *
 * Species is picked deterministically per tree from `(biomeId, treeSeed)`
 * — `pickSpecies()` is hash-based and unchanged from the previous design,
 * so the species each tree gets is stable across this redesign.
 */

export interface BlobTreeParams {
  // ── Trunk ──────────────────────────────────────────────────────────
  /** Total tree height (world units) before the per-tree spawn scale. */
  height: number;
  /** ± variance on `height`. */
  heightV: number;
  /** Trunk length as a fraction of total height (canopy sits above). */
  trunkFrac: number;
  /** Trunk base radius as a fraction of total height. */
  trunkRadiusFrac: number;
  /** Radius taper across the trunk length (0..1, 1 = to a point). */
  trunkTaper: number;
  /** Overall trunk lean/curve (degrees). */
  trunkCurveDeg: number;
  /** Per-segment random curve jitter (degrees). */
  trunkCurveVDeg: number;
  /** Multiplier on the base ring radius — visible root flare. */
  rootFlare: number;
  /** Rings along the trunk (frames = rings + 1). */
  trunkRings: number;

  // ── Limbs ──────────────────────────────────────────────────────────
  /** Min/max limbs branching from the upper trunk. */
  limbCount: [number, number];
  /** Limb length as a fraction of total height. */
  limbLengthFrac: number;
  /** Limb angle from vertical (degrees) — bigger = wider crown. */
  limbSpreadDeg: number;

  // ── Canopy blobs ───────────────────────────────────────────────────
  /** Min/max canopy blobs (includes the trunk-top blob; the rest sit at
   *  limb tips). All species use the crown layout — the old 'stacked'
   *  conifer layout read as a traffic cone / antenna and was cut. */
  blobCount: [number, number];
  /** Blob radius as a fraction of total height. */
  blobRadiusFrac: number;
  /** ± fractional variance on blob radius. */
  blobRadiusV: number;
  /** Y squash of each blob (1 = sphere, lower = flatter). */
  blobSquashY: number;
  /** Radial noise displacement as a fraction of blob radius. */
  blobNoiseAmp: number;

  // ── Colors ─────────────────────────────────────────────────────────
  /** Flat trunk/bark vertex tint. */
  trunkTint: [number, number, number];
  /** Canopy gradient: lit top → shaded underside. */
  canopyTopTint: [number, number, number];
  canopyBottomTint: [number, number, number];
  /** ± fractional per-blob brightness jitter. */
  tintJitter: number;
  /** Tiles of the seamless leaf texture across one clump (UV scale). */
  leafTextureScale: number;
}

/** Oak — wide rounded crown of 3 big blobs on short spreading limbs. */
export const SPECIES_OAK: BlobTreeParams = {
  height: 8,
  heightV: 1.5,
  trunkFrac: 0.42,
  trunkRadiusFrac: 0.055,
  trunkTaper: 0.38,
  trunkCurveDeg: 10,
  trunkCurveVDeg: 14,
  rootFlare: 1.8,
  trunkRings: 5,
  limbCount: [2, 3],
  limbLengthFrac: 0.20,
  limbSpreadDeg: 48,
  blobCount: [3, 4],
  blobRadiusFrac: 0.30,
  blobRadiusV: 0.22,
  blobSquashY: 0.78,
  blobNoiseAmp: 0.16,
  trunkTint:        [0.32, 0.22, 0.16],
  // Canopy tints are ALBEDO for a lit material and are anchored to the
  // terrain palette greens (#3d8c30 / #4a9040 ≈ 0.24-0.29, 0.55-0.57,
  // 0.19-0.25) — slightly BELOW them, never above, so a sunlit canopy
  // tops out around terrain brightness. The original hotter tints were
  // tuned for an unlit material and read neon against the lit ground.
  canopyTopTint:    [0.26, 0.45, 0.18],
  canopyBottomTint: [0.09, 0.20, 0.08],
  tintJitter: 0.08,
  leafTextureScale: 2.0,
};

/** Broad — big spreading parasol crown: thick short trunk, long
 *  near-horizontal limbs, wide flattened blobs. The "old shade tree" of
 *  the set. (Replaces the stacked-tier pine, which read as a traffic
 *  cone / antenna no matter how the tiers were tuned.) */
export const SPECIES_BROAD: BlobTreeParams = {
  height: 9.5,
  heightV: 1.5,
  trunkFrac: 0.42,
  trunkRadiusFrac: 0.068,   // visibly thicker trunk carries the wide crown
  trunkTaper: 0.34,
  trunkCurveDeg: 12,
  trunkCurveVDeg: 16,
  rootFlare: 1.9,
  trunkRings: 5,
  limbCount: [3, 3],
  limbLengthFrac: 0.30,     // long limbs push blobs far from the trunk
  limbSpreadDeg: 68,        // near-horizontal — parasol silhouette
  blobCount: [4, 4],        // trunk-top blob + 3 limb blobs
  blobRadiusFrac: 0.33,
  blobRadiusV: 0.16,
  blobSquashY: 0.55,        // flat wide pillows
  blobNoiseAmp: 0.15,
  trunkTint:        [0.30, 0.21, 0.15],
  canopyTopTint:    [0.24, 0.42, 0.17],   // terrain-anchored, see oak note
  canopyBottomTint: [0.08, 0.18, 0.07],
  tintJitter: 0.09,
  leafTextureScale: 2.4,
};

/** Birch — slender pale trunk, smaller offset blobs, lighter foliage. */
export const SPECIES_BIRCH: BlobTreeParams = {
  height: 9,
  heightV: 1.2,
  trunkFrac: 0.52,
  trunkRadiusFrac: 0.032,
  trunkTaper: 0.48,
  trunkCurveDeg: 6,
  trunkCurveVDeg: 10,
  rootFlare: 1.55,
  trunkRings: 5,
  limbCount: [2, 3],
  limbLengthFrac: 0.16,
  limbSpreadDeg: 35,
  blobCount: [2, 3],
  blobRadiusFrac: 0.24,
  blobRadiusV: 0.20,
  blobSquashY: 0.82,
  blobNoiseAmp: 0.18,
  trunkTint:        [0.78, 0.78, 0.74],
  // Birch stays the lightest/yellowest of the three but inside the
  // terrain envelope — the old (0.62, 0.72, 0.32) was the worst neon
  // offender (≈3× the terrain red channel).
  canopyTopTint:    [0.33, 0.49, 0.20],
  canopyBottomTint: [0.13, 0.24, 0.10],
  tintJitter: 0.10,
  leafTextureScale: 2.0,
};

export const SPECIES = {
  oak: SPECIES_OAK,
  broad: SPECIES_BROAD,
  birch: SPECIES_BIRCH,
} as const;

export type SpeciesId = keyof typeof SPECIES;
export const SPECIES_IDS: readonly SpeciesId[] = ['oak', 'broad', 'birch'];

/**
 * Deterministic species pick from biome + per-tree seed.
 *
 * Bias rules — crown trees (oak/birch) dominate everywhere; the wide
 * parasol 'broad' is the accent variant:
 *  - mountain biome → 40% oak, 35% birch, 25% broad
 *  - everywhere else → 40% oak, 30% birch, 30% broad
 *
 * Hash includes biomeId so the same treeSeed in two different biomes
 * still picks consistently within each biome.
 */
export function pickSpecies(biomeId: string | undefined, treeSeed: number): SpeciesId {
  // 32-bit FNV-1a mix on the biome name, then the seed, finished with a
  // murmur3-style avalanche. The previous single multiply after the seed
  // XOR had almost no avalanche into the low 24 bits — r varied only ~2%
  // across all seeds, so EVERY tree in a biome rolled the same species
  // (entire biomes of identical trees).
  let h = 2166136261 >>> 0;
  const idStr = biomeId || 'default';
  for (let i = 0; i < idStr.length; i++) {
    h ^= idStr.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  const seedInt = Math.floor(treeSeed) | 0;
  h ^= seedInt;
  h = Math.imul(h, 16777619) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  const r = (h >>> 8) / 0x1000000; // [0, 1)

  const isMountain = idStr === 'mountains';
  if (isMountain) {
    if (r < 0.40) return 'oak';
    if (r < 0.75) return 'birch';
    return 'broad';
  }
  if (r < 0.40) return 'oak';
  if (r < 0.70) return 'birch';
  return 'broad';
}
