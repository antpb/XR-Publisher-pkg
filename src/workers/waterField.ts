/**
 * waterField — shore-distance field for water waves. Runs in the terrain
 * worker (pure math, no DOM/GL).
 *
 * Per-chunk water MASKS are derived from the generated terrain positions
 * (`normalizedHeight < WATER_LEVEL_NORMALIZED`) right after generation —
 * identical regardless of whether WASM or the JS fallback produced the
 * positions, so the two paths stay in parity for free. Masks live in a
 * FIFO-capped cache keyed by chunk grid coords.
 *
 * `buildWaterField` assembles a texSize² two-channel field covering the
 * water plane's extent:
 *   R = d  — distance from the nearest shore INTO the water (world units,
 *            seam-correct across chunks; 0 on land)
 *   G      — "openness": min(localized max-d, body equivalent-compact-
 *            radius from area). Localized = d max-propagated through
 *            water with λ-decay, so long skinny branches of an open body
 *            fade to flat away from the open pocket; the area term keeps
 *            big-but-threadbare bodies from waving. Dilated a few texels
 *            onto land so beach fragments can read it.
 *
 * The water shader derives wave amplitude/phase from (d, D): calm at each
 * body's center, crests travelling toward shore, no waves in skinny
 * channels, bigger waves in open water. Per-frame wave math is 100% GPU;
 * this CPU rebuild happens only on water-center snaps / chunk streams in
 * the otherwise-idle worker (~1-3 ms).
 */

const WATER_LEVEL_NORMALIZED = 0.48;
const MAX_MASK_CACHE = 128; // ~128 × (segments+1)² bytes ≈ 1-2 MB

interface CachedChunkMask {
  /** 1 = underwater vertex. Indexed j*(segments+1)+i (x↔i, z↔j). */
  mask: Uint8Array;
  segments: number;
  width: number;
  height: number;
}

const maskCache = new Map<string, CachedChunkMask>();

export interface MaskParams {
  gridX: number;
  gridZ: number;
  segments: number;
  heightScale: number;
  width: number;
  height: number;
}

/**
 * Derive and cache a chunk's water mask from its generated positions.
 * Called in the generate_terrain handler BEFORE the positions buffer is
 * transferred away.
 */
export function cacheWaterMask(params: MaskParams, positions: Float32Array): void {
  const { gridX, gridZ, segments, heightScale, width, height } = params;
  const vps = segments + 1;
  const vertCount = vps * vps;
  if (positions.length < vertCount * 3) return;

  const mask = new Uint8Array(vertCount);
  const span = 2 * heightScale;
  for (let k = 0; k < vertCount; k++) {
    const normalized = (positions[k * 3 + 1] + heightScale) / span;
    mask[k] = normalized < WATER_LEVEL_NORMALIZED ? 1 : 0;
  }

  const key = `${gridX},${gridZ}`;
  // FIFO cap (Map preserves insertion order). Delete-then-set refreshes
  // the entry's position so actively-regenerated chunks aren't evicted.
  maskCache.delete(key);
  if (maskCache.size >= MAX_MASK_CACHE) {
    const oldest = maskCache.keys().next().value;
    if (oldest !== undefined) maskCache.delete(oldest);
  }
  maskCache.set(key, { mask, segments, width, height });
}

/**
 * Assemble the RG shore-distance field over [center ± extent/2]².
 * Returns an interleaved Float32Array(texSize² × 2). Texels over
 * unstreamed chunks read as land (waves fade toward the unloaded edge,
 * which sits beyond fog anyway).
 */
export function buildWaterField(
  centerX: number,
  centerZ: number,
  extent: number,
  texSize: number,
  chunkWidth: number,
  chunkHeight: number,
): Float32Array {
  const texel = extent / texSize;
  const originX = centerX - extent / 2;
  const originZ = centerZ - extent / 2;
  const n = texSize * texSize;

  // 1. Sample the chunk masks into a texel-resolution water grid.
  const water = new Uint8Array(n);
  for (let tz = 0; tz < texSize; tz++) {
    const wz = originZ + (tz + 0.5) * texel;
    const gz = Math.round(wz / chunkHeight);
    const rowBase = tz * texSize;
    for (let tx = 0; tx < texSize; tx++) {
      const wx = originX + (tx + 0.5) * texel;
      const gx = Math.round(wx / chunkWidth);
      const c = maskCache.get(`${gx},${gz}`);
      if (!c) continue; // missing chunk ⇒ land
      const vps = c.segments + 1;
      // Chunk-local vertex coords span [-w/2, +w/2]; map to grid index.
      const i = clampInt(Math.round(((wx - gx * chunkWidth) / c.width + 0.5) * c.segments), 0, c.segments);
      const j = clampInt(Math.round(((wz - gz * chunkHeight) / c.height + 0.5) * c.segments), 0, c.segments);
      water[rowBase + tx] = c.mask[j * vps + i];
    }
  }

  // 2. Two-pass 3-4 chamfer distance transform: distance from land into
  //    water, in (texel/3) units. Seam-correct by construction — the
  //    transform runs over the assembled multi-chunk grid.
  const INF = 1e9;
  const dist = new Float32Array(n);
  for (let k = 0; k < n; k++) dist[k] = water[k] ? INF : 0;

  // forward pass
  for (let z = 0; z < texSize; z++) {
    const row = z * texSize;
    for (let x = 0; x < texSize; x++) {
      const k = row + x;
      let d = dist[k];
      if (d === 0) continue;
      if (x > 0) { const v = dist[k - 1] + 3; if (v < d) d = v; }
      if (z > 0) {
        const up = k - texSize;
        { const v = dist[up] + 3; if (v < d) d = v; }
        if (x > 0) { const v = dist[up - 1] + 4; if (v < d) d = v; }
        if (x < texSize - 1) { const v = dist[up + 1] + 4; if (v < d) d = v; }
      }
      dist[k] = d;
    }
  }
  // backward pass
  for (let z = texSize - 1; z >= 0; z--) {
    const row = z * texSize;
    for (let x = texSize - 1; x >= 0; x--) {
      const k = row + x;
      let d = dist[k];
      if (d === 0) continue;
      if (x < texSize - 1) { const v = dist[k + 1] + 3; if (v < d) d = v; }
      if (z < texSize - 1) {
        const down = k + texSize;
        { const v = dist[down] + 3; if (v < d) d = v; }
        if (x < texSize - 1) { const v = dist[down + 1] + 4; if (v < d) d = v; }
        if (x > 0) { const v = dist[down - 1] + 4; if (v < d) d = v; }
      }
      dist[k] = d;
    }
  }

  // 3. Connected-component labels (4-connectivity) + per-label texel count.
  const labels = new Int32Array(n).fill(-1);
  const labelCount: number[] = [];
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    if (!water[s] || labels[s] >= 0) continue;
    const label = labelCount.length;
    labelCount.push(0);
    labels[s] = label;
    stack.push(s);
    while (stack.length > 0) {
      const k = stack.pop()!;
      labelCount[label]++;
      const x = k % texSize;
      const z = (k - x) / texSize;
      if (x > 0 && water[k - 1] && labels[k - 1] < 0) { labels[k - 1] = label; stack.push(k - 1); }
      if (x < texSize - 1 && water[k + 1] && labels[k + 1] < 0) { labels[k + 1] = label; stack.push(k + 1); }
      if (z > 0 && water[k - texSize] && labels[k - texSize] < 0) { labels[k - texSize] = label; stack.push(k - texSize); }
      if (z < texSize - 1 && water[k + texSize] && labels[k + texSize] < 0) { labels[k + texSize] = label; stack.push(k + texSize); }
    }
  }

  // 4. LOCALIZED openness S: morphological max of d through water within
  //    a hard window (S(k) = max d among texels reachable through water
  //    within ~OPEN_WINDOW u). A body-wide max let one open pocket grant
  //    full waves to every long skinny branch of the same connected body;
  //    with the window, a texel only counts as "open" if genuinely wide
  //    water is nearby — waves roll a short way into a channel mouth and
  //    die past it. Constrained to WATER texels (an open pocket can't
  //    leak openness across a peninsula into a different inlet). One
  //    8-neighbour max pass extends reach by one texel, so iterations =
  //    window / texel.
  const OPEN_WINDOW = 25; // world units
  const S = new Float32Array(n);
  for (let k = 0; k < n; k++) S[k] = water[k] ? dist[k] : 0;
  const dilations = Math.min(40, Math.ceil(OPEN_WINDOW / texel));
  let cur = S;
  let next = new Float32Array(n);
  for (let iter = 0; iter < dilations; iter++) {
    for (let z = 0; z < texSize; z++) {
      const row = z * texSize;
      for (let x = 0; x < texSize; x++) {
        const k = row + x;
        if (!water[k]) { next[k] = 0; continue; }
        let s = cur[k];
        if (x > 0 && water[k - 1] && cur[k - 1] > s) s = cur[k - 1];
        if (x < texSize - 1 && water[k + 1] && cur[k + 1] > s) s = cur[k + 1];
        if (z > 0) {
          const up = k - texSize;
          if (water[up] && cur[up] > s) s = cur[up];
          if (x > 0 && water[up - 1] && cur[up - 1] > s) s = cur[up - 1];
          if (x < texSize - 1 && water[up + 1] && cur[up + 1] > s) s = cur[up + 1];
        }
        if (z < texSize - 1) {
          const down = k + texSize;
          if (water[down] && cur[down] > s) s = cur[down];
          if (x > 0 && water[down - 1] && cur[down - 1] > s) s = cur[down - 1];
          if (x < texSize - 1 && water[down + 1] && cur[down + 1] > s) s = cur[down + 1];
        }
        next[k] = s;
      }
    }
    const tmp = cur; cur = next; next = tmp;
  }
  if (cur !== S) S.set(cur);

  // 5. Interleave RG in world units. G = min(localized openness, the
  //    body's equivalent-compact-radius from its total AREA) — a body
  //    must both be locally wide AND carry enough total surface area for
  //    waves to make sense. Cap d for fully-flooded fields (no land
  //    anywhere → chamfer never relaxed from INF).
  const toWorld = texel / 3;
  const dCap = extent / 2;
  const texelArea = texel * texel;
  const eqRadius = labelCount.map((c) => Math.sqrt((c * texelArea) / Math.PI));
  const out = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    if (water[k]) {
      const d = Math.min(dist[k] * toWorld, dCap);
      const local = S[k] * toWorld;
      const areaR = labels[k] >= 0 ? eqRadius[labels[k]] : 0;
      out[k * 2] = d;
      out[k * 2 + 1] = Math.min(local, areaR, dCap);
    }
    // land texels stay (0, 0) — zero amplitude (d). G gets dilated below.
  }

  // 6. Dilate G onto land (3 passes ≈ 3 texels ≈ ~8u inland): the shared
  //    terrain material samples G at BEACH fragments — which sit on land
  //    texels — to gate the shore wash by water-body size (puddles must
  //    not get crashing foam). Without dilation, land texels read G=0 and
  //    every beach would be suppressed. R (d) stays 0 on land.
  const g = new Float32Array(n);
  for (let k = 0; k < n; k++) g[k] = out[k * 2 + 1];
  for (let pass = 0; pass < 3; pass++) {
    const src = g.slice();
    for (let z = 0; z < texSize; z++) {
      const row = z * texSize;
      for (let x = 0; x < texSize; x++) {
        const k = row + x;
        if (water[k]) continue;
        let m = src[k];
        if (x > 0 && src[k - 1] > m) m = src[k - 1];
        if (x < texSize - 1 && src[k + 1] > m) m = src[k + 1];
        if (z > 0 && src[k - texSize] > m) m = src[k - texSize];
        if (z < texSize - 1 && src[k + texSize] > m) m = src[k + texSize];
        g[k] = m;
      }
    }
  }
  for (let k = 0; k < n; k++) {
    if (!water[k]) out[k * 2 + 1] = g[k];
  }
  return out;
}

function clampInt(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
