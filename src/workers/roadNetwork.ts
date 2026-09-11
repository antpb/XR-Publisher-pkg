/**
 * roadNetwork — large-area road planner (worker job).
 *
 * Given a region, a world seed + terrain params, and a set of settlement points,
 * this builds a road NETWORK the way a hand-authored map does (think the road
 * web on the Zelda overworld): it samples a terrain COST FIELD over the whole
 * region, connects the settlements with a minimum spanning tree plus a few loop
 * edges, and runs A* between connected pairs so each road follows walkable ground
 * — flat grass/plains/buildable — and routes AROUND water, the rocky/snow high
 * band, mountains, and steep slopes. The expensive part (sampling N×M cells +
 * A* over them) is exactly what the terrain worker is for.
 *
 * Self-contained on purpose: it re-implements the terrain heightfield + biome
 * sampling (a no-`three` copy of terrainSample.ts / biomeHelpers.ts) so it can
 * run inside the worker bundle without pulling Three in. The numbers match the
 * mesh, so "walkable" here means walkable in the actual world.
 *
 * Output is world-space polylines, ready for XRPublisher.addPath — which is also
 * what the terrain decoration filters read (isNearPath), so trees/grass/etc.
 * stay off the roads automatically.
 */
import { createNoise2D } from 'simplex-noise';
import { alea } from 'seedrandom';

export interface RoadTerrainParams {
  width: number; height: number; scale: number; heightScale: number;
  octaves: number; persistence: number; lacunarity: number; positionY: number;
}

export interface RoadNetworkParams {
  seed: string;
  terrain: RoadTerrainParams;
  /** World-space region to plan within. */
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
  /** Cost-grid resolution in world units (≈8–16; smaller = finer + slower). */
  cellSize: number;
  /** Settlement points (world XZ) to connect. */
  settlements: Array<[number, number]>;
  /** Don't connect settlements farther apart than this (world units). */
  maxEdgeLength: number;
  /** Legacy; ignored (the Gabriel graph supplies the loops). */
  loopFraction?: number;
  /** If set, only edges with BOTH endpoints inside this (smaller) box are
   *  returned. `settlements` should include a margin of ≥ maxEdgeLength beyond it
   *  so the Gabriel test sees every neighbour — making the network GLOBALLY
   *  consistent: overlapping regions compute the same edges and never draw
   *  duplicate parallel roads. */
  coreBounds?: { minX: number; minZ: number; maxX: number; maxZ: number };
}

export interface RoadEdge {
  a: number;            // settlement index
  b: number;
  points: Array<[number, number]>;   // world-space polyline
}

export interface RoadNetworkResult {
  roads: RoadEdge[];
}

// ── Math (no three) ─────────────────────────────────────────────────────────
const mapRange = (v: number, a: number, b: number, c: number, d: number) =>
  ((v - a) / (b - a)) * (d - c) + c;
function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// ── Terrain sampler (matches terrainSample.ts / biomeHelpers.ts) ─────────────
const ELEV_FREQ = 0.0008;
const MOIST_FREQ = 0.001;
const OCEAN_GATE_FREQ = 0.00025;

class TerrainSampler {
  private hf: ReturnType<typeof createNoise2D>;
  private elev: ReturnType<typeof createNoise2D>;
  private moist: ReturnType<typeof createNoise2D>;
  private ocean: ReturnType<typeof createNoise2D>;
  constructor(seed: string, private p: RoadTerrainParams) {
    this.hf = createNoise2D(alea(seed));
    this.elev = createNoise2D(alea(`${seed}-biome-elev`));
    this.moist = createNoise2D(alea(`${seed}-biome-moist`));
    this.ocean = createNoise2D(alea(`${seed}-ocean`));
  }

  private pixel(world: number, dim: number): number {
    const grid = Math.round(world / dim);
    const pos = grid * dim;
    let io = (world - pos) / dim + 0.5;
    io = Math.max(0, Math.min(1, io));
    return Math.floor(io * (dim - 1)) + pos;
  }

  private heightField01(wx: number, wz: number): number {
    const p = this.p;
    const hx = this.pixel(wx, p.width);
    const hz = this.pixel(wz, p.height);
    let value = 0; let amp = 1; let freq = 1; let max = 0;
    for (let o = 0; o < p.octaves; o++) {
      value += this.hf((hx / p.width) * p.scale * freq, (hz / p.height) * p.scale * freq) * amp;
      max += amp; amp *= p.persistence; freq *= p.lacunarity;
    }
    value = mapRange(value / max, -1, 1, 0, 1);
    value = 0.5 + (value - 0.5) * 0.15;
    let t = value; t = t * t * (3 - 2 * t);
    return t * t * (3 - 2 * t);
  }

  private biome(wx: number, wz: number): { elevation: number; moisture: number } {
    return {
      elevation: this.elev(wx * ELEV_FREQ, wz * ELEV_FREQ),
      moisture: this.moist(wx * MOIST_FREQ + 1000, wz * MOIST_FREQ + 1000),
    };
  }

  private biomeHeightMultiplier(elevation: number, moisture: number): number {
    const mountainFade = smoothstep(0.25, 0.45, elevation);
    const plainsFade = smoothstep(-0.1, -0.3, elevation);
    const wetlandsFade = smoothstep(0.2, 0.4, moisture) * smoothstep(-0.15, -0.35, elevation);
    const buildableFade = (1 - smoothstep(0.05, 0.25, Math.abs(elevation))) * smoothstep(-0.2, -0.4, moisture);
    let m = 1.0;
    m += (1.6 - 1) * mountainFade;
    m += (0.6 - 1) * plainsFade;
    m += (0.4 - 1) * wetlandsFade;
    m += (0.12 - 1) * buildableFade;
    return Math.max(0.1, m);
  }

  private oceanFade(wx: number, wz: number, elevation: number): number {
    const spawnSafe = smoothstep(150, 400, Math.hypot(wx, wz));
    if (spawnSafe <= 0) return 0;
    const core = smoothstep(-0.42, -0.6, elevation);
    if (core <= 0) return 0;
    const gate = smoothstep(0.45, 0.6, this.ocean(wx * OCEAN_GATE_FREQ, wz * OCEAN_GATE_FREQ));
    return core * gate * spawnSafe;
  }

  private isMountainBiome(elevation: number): boolean { return elevation > 0.35; }

  /** Normalized terrain height 0..1 at a world point (water below ~0.48). */
  normalizedHeight(wx: number, wz: number): number {
    const { elevation, moisture } = this.biome(wx, wz);
    const h01 = this.heightField01(wx, wz);
    let h = mapRange(h01, 0, 1, -this.p.heightScale, this.p.heightScale);
    h *= this.biomeHeightMultiplier(elevation, moisture);
    h -= this.oceanFade(wx, wz, elevation) * this.p.heightScale * 0.5;
    return mapRange(h, -this.p.heightScale, this.p.heightScale, 0, 1);
  }

  mountainAt(wx: number, wz: number): boolean {
    return this.isMountainBiome(this.biome(wx, wz).elevation);
  }

  /** True where biome === 'buildable' — the deliberately-flat town-land. Matches
   *  getBiomeAt (biomeHelpers.ts) and Rust get_biome_at exactly (same noise, same
   *  hard threshold), so worker-discovered towns land on the same flats the
   *  renderer paints. */
  buildableAt(wx: number, wz: number): boolean {
    const { elevation, moisture } = this.biome(wx, wz);
    return Math.abs(elevation) < 0.15 && moisture < -0.3;
  }
}

// ── Cost field ───────────────────────────────────────────────────────────────
const IMPASSABLE = Infinity;
// Walkability bands on normalized height (water < 0.48). Roads stay on the FLAT
// grass band (plains / buildable / low default); water+shore, the rocky/snow
// high band, and steep slopes are all hard no-go so roads visibly route around
// lakes, rock and mountains rather than clipping their edges.
// HARD no-go (fragmenting the map any more than this leaves towns unreachable):
// water + shoreline, snow peaks, and cliffs. Mountains are blocked by biome.
// Everything else is passable but the COST heavily favours flat grass, so roads
// PREFER the valleys and only climb rock/slope when that's the only way through —
// exactly how a real road skirts a hill rather than ignoring it.
// Road planning keeps a SHORELINE MARGIN above the waterline: the cost grid only
// samples cell centres (cellSize apart), and a road carries its own half-width,
// so a path centre sitting exactly at WATER_LIMIT would let the road EDGE + the
// sub-cell slivers between samples graze the water. Treating everything below
// ROAD_WATER_LIMIT as impassable pushes road centres back from the water edge so
// the whole road surface stays dry.
const ROAD_WATER_LIMIT = 0.498;
const ROCKY_LIMIT = 0.62;   // rock/snow band → impassable
const STEEP_LIMIT = 0.60;   // cliff / mountainside → impassable

/** True where a road would visibly cross an OBSTACLE (water, rock/snow, mountain,
 *  or cliff). A* may cross these at a heavy cost, but a road whose path is mostly
 *  obstacle is dropped (see computeRoadNetwork) — so towns link over land and the
 *  odd narrow ford, never across a whole lake or peak. */
function isObstacle(s: TerrainSampler, p: RoadTerrainParams, wx: number, wz: number, cellSize: number): boolean {
  const nh = s.normalizedHeight(wx, wz);
  if (nh < ROAD_WATER_LIMIT || nh > ROCKY_LIMIT || s.mountainAt(wx, wz)) return true;
  const e = cellSize; const hs = p.heightScale;
  const yE = mapRange(s.normalizedHeight(wx + e, wz), 0, 1, -hs, hs);
  const yW = mapRange(s.normalizedHeight(wx - e, wz), 0, 1, -hs, hs);
  const yN = mapRange(s.normalizedHeight(wx, wz + e), 0, 1, -hs, hs);
  const yS = mapRange(s.normalizedHeight(wx, wz - e), 0, 1, -hs, hs);
  return Math.hypot((yE - yW) / (2 * e), (yN - yS) / (2 * e)) > STEEP_LIMIT;
}

function cellCost(s: TerrainSampler, p: RoadTerrainParams, wx: number, wz: number, cellSize: number): number {
  const nh = s.normalizedHeight(wx, wz);
  // WATER is truly IMPASSABLE — A* can never step into a water cell, so a road
  // physically routes AROUND every lake/river rather than fording it. Two towns
  // with no dry land route between them simply don't get a road (correct: not
  // every town connects). Rock/snow and mountain stay CROSSABLE but enormously
  // expensive, so the network can still link over a rocky saddle when that's the
  // only dry way through — keeping roads from vanishing entirely while never
  // crossing water.
  if (nh < ROAD_WATER_LIMIT) return IMPASSABLE;     // water + shoreline margin — hard no-go
  if (s.mountainAt(wx, wz)) return 350;             // mountain biome
  if (nh > ROCKY_LIMIT) return 250;                 // rock / snow
  const hs = p.heightScale;
  const e = cellSize;
  const yE = mapRange(s.normalizedHeight(wx + e, wz), 0, 1, -hs, hs);
  const yW = mapRange(s.normalizedHeight(wx - e, wz), 0, 1, -hs, hs);
  const yN = mapRange(s.normalizedHeight(wx, wz + e), 0, 1, -hs, hs);
  const yS = mapRange(s.normalizedHeight(wx, wz - e), 0, 1, -hs, hs);
  const slope = Math.hypot((yE - yW) / (2 * e), (yN - yS) / (2 * e));
  if (slope > STEEP_LIMIT) return 250;              // cliff / mountainside
  // Strongly prefer flat low grass; A* hugs valleys and meadows.
  return 1 + slope * 30 + Math.max(0, nh - 0.54) * 120;
}

interface Grid {
  cols: number; rows: number; cellSize: number; minX: number; minZ: number;
  cost: Float64Array;       // per-cell cost (Infinity = impassable)
}

function buildCostGrid(params: RoadNetworkParams, s: TerrainSampler): Grid {
  const { bounds, cellSize } = params;
  const cols = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / cellSize));
  const rows = Math.max(1, Math.ceil((bounds.maxZ - bounds.minZ) / cellSize));
  const cost = new Float64Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = bounds.minX + (c + 0.5) * cellSize;
      const wz = bounds.minZ + (r + 0.5) * cellSize;
      cost[r * cols + c] = cellCost(s, params.terrain, wx, wz, cellSize);
    }
  }
  return { cols, rows, cellSize, minX: bounds.minX, minZ: bounds.minZ, cost };
}

const clampCell = (v: number, n: number) => (v < 0 ? 0 : v >= n ? n - 1 : v);
function worldToCell(g: Grid, x: number, z: number): [number, number] {
  return [
    clampCell(Math.floor((x - g.minX) / g.cellSize), g.cols),
    clampCell(Math.floor((z - g.minZ) / g.cellSize), g.rows),
  ];
}
function cellToWorld(g: Grid, c: number, r: number): [number, number] {
  return [g.minX + (c + 0.5) * g.cellSize, g.minZ + (r + 0.5) * g.cellSize];
}

// ── A* (8-connected, binary-heap frontier) ───────────────────────────────────
class MinHeap {
  private a: number[] = [];   // packed [priority, value] pairs flattened
  get size() { return this.a.length / 2; }
  push(priority: number, value: number) {
    const a = this.a; a.push(priority, value);
    let i = this.size - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent * 2] <= a[i * 2]) break;
      [a[parent * 2], a[i * 2]] = [a[i * 2], a[parent * 2]];
      [a[parent * 2 + 1], a[i * 2 + 1]] = [a[i * 2 + 1], a[parent * 2 + 1]];
      i = parent;
    }
  }
  pop(): number {
    const a = this.a; const n = this.size;
    const value = a[1];
    const lastP = a[(n - 1) * 2]; const lastV = a[(n - 1) * 2 + 1];
    a.pop(); a.pop();
    if (this.size > 0) {
      a[0] = lastP; a[1] = lastV;
      let i = 0; const m = this.size;
      for (;;) {
        const l = i * 2 + 1; const r = i * 2 + 2; let smallest = i;
        if (l < m && a[l * 2] < a[smallest * 2]) smallest = l;
        if (r < m && a[r * 2] < a[smallest * 2]) smallest = r;
        if (smallest === i) break;
        [a[smallest * 2], a[i * 2]] = [a[i * 2], a[smallest * 2]];
        [a[smallest * 2 + 1], a[i * 2 + 1]] = [a[i * 2 + 1], a[smallest * 2 + 1]];
        i = smallest;
      }
    }
    return value;
  }
}

function astar(g: Grid, sx: number, sz: number, tx: number, tz: number): Array<[number, number]> | null {
  const [sc, sr] = worldToCell(g, sx, sz);
  const [tc, tr] = worldToCell(g, tx, tz);
  const start = sr * g.cols + sc;
  const goal = tr * g.cols + tc;
  if (!isFinite(g.cost[start]) || !isFinite(g.cost[goal])) {
    // Endpoint sits on impassable ground — snap to the nearest walkable cell.
    const sStart = nearestWalkable(g, sc, sr); const sGoal = nearestWalkable(g, tc, tr);
    if (sStart < 0 || sGoal < 0) return null;
    return astarCells(g, sStart, sGoal);
  }
  return astarCells(g, start, goal);
}

function nearestWalkable(g: Grid, c: number, r: number): number {
  for (let radius = 0; radius < 12; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== radius) continue;
        const cc = c + dc; const rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= g.cols || rr >= g.rows) continue;
        if (isFinite(g.cost[rr * g.cols + cc])) return rr * g.cols + cc;
      }
    }
  }
  return -1;
}

function astarCells(g: Grid, start: number, goal: number): Array<[number, number]> | null {
  const n = g.cols * g.rows;
  const gScore = new Float64Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new MinHeap();
  const cs = g.cellSize;
  const gc = goal % g.cols; const gr = (goal / g.cols) | 0;
  const hcost = (i: number) => {
    const c = i % g.cols; const r = (i / g.cols) | 0;
    return Math.hypot(c - gc, r - gr) * cs;     // admissible (min step cost ≥ 1·dist)
  };
  gScore[start] = 0;
  heap.push(hcost(start), start);
  const NB = [[-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1], [-1, -1, 1.41421356], [1, -1, 1.41421356], [-1, 1, 1.41421356], [1, 1, 1.41421356]];
  while (heap.size > 0) {
    const cur = heap.pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cc = cur % g.cols; const cr = (cur / g.cols) | 0;
    for (let k = 0; k < 8; k++) {
      const nc = cc + NB[k][0]; const nr = cr + NB[k][1];
      if (nc < 0 || nr < 0 || nc >= g.cols || nr >= g.rows) continue;
      const ni = nr * g.cols + nc;
      const cost = g.cost[ni];
      if (!isFinite(cost) || closed[ni]) continue;
      // No corner-cutting: a diagonal step is only allowed if BOTH orthogonally
      // adjacent cells are walkable — otherwise a road could clip the corner of a
      // lake or cliff.
      if (k >= 4) {
        const oa = cr * g.cols + nc;    // horizontal neighbour
        const ob = nr * g.cols + cc;    // vertical neighbour
        if (!isFinite(g.cost[oa]) || !isFinite(g.cost[ob])) continue;
      }
      const tentative = gScore[cur] + cost * NB[k][2] * cs;
      if (tentative < gScore[ni]) {
        gScore[ni] = tentative;
        came[ni] = cur;
        heap.push(tentative + hcost(ni), ni);
      }
    }
  }
  if (came[goal] < 0 && goal !== start) return null;
  const cells: number[] = [];
  let cur = goal;
  while (cur >= 0) { cells.push(cur); if (cur === start) break; cur = came[cur]; }
  cells.reverse();
  return cells.map((i) => cellToWorld(g, i % g.cols, (i / g.cols) | 0));
}

// ── Polyline simplify (line-of-sight) + obstacle-aware Chaikin smoothing ──────
// A predicate that's true where a road may run (finite cell cost).
type Walkable = (x: number, z: number) => boolean;

/** True if the straight segment a→b stays on walkable ground (sampled). */
function segmentWalkable(ax: number, az: number, bx: number, bz: number, step: number, ok: Walkable): boolean {
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (!ok(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
  }
  return true;
}

/** Funnel/LOS simplification: keep the fewest points such that each kept hop is
 *  a clear straight run — removes grid zig-zag without ever cutting an obstacle. */
function losSimplify(pts: Array<[number, number]>, step: number, ok: Walkable): Array<[number, number]> {
  if (pts.length <= 2) return pts;
  const out: Array<[number, number]> = [pts[0]];
  let anchor = 0;
  for (let i = 2; i < pts.length; i++) {
    const [ax, az] = pts[anchor];
    if (!segmentWalkable(ax, az, pts[i][0], pts[i][1], step, ok)) {
      out.push(pts[i - 1]);   // last point still in line-of-sight
      anchor = i - 1;
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Chaikin corner-rounding, but a rounded point that would land off walkable
 *  ground falls back to the original corner — so curves stay on safe terrain. */
function chaikin(pts: Array<[number, number]>, iters: number, ok: Walkable): Array<[number, number]> {
  let cur = pts;
  for (let it = 0; it < iters; it++) {
    if (cur.length < 3) break;
    const next: Array<[number, number]> = [cur[0]];
    for (let i = 0; i < cur.length - 1; i++) {
      const [ax, az] = cur[i]; const [bx, bz] = cur[i + 1];
      const q: [number, number] = [ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25];
      const r: [number, number] = [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75];
      next.push(ok(q[0], q[1]) ? q : cur[i]);
      next.push(ok(r[0], r[1]) ? r : cur[i + 1]);
    }
    next.push(cur[cur.length - 1]);
    cur = next;
  }
  return cur;
}

// ── Connectivity: Gabriel graph ──────────────────────────────────────────────
// The Gabriel graph is the road-network model that gives JUNCTIONS, not a tree's
// dead-end leaves: an edge (a,b) exists iff no other settlement c lies inside the
// circle that has a–b as its diameter (i.e. angle a-c-b is never obtuse). It is
// PLANAR (roads never cross), more connected than the relative-neighborhood graph
// or a spanning tree (so far fewer dead ends), and depends only on settlement
// positions — so overlapping regions agree on the same edges and never draw
// duplicate parallel roads. O(n³); n per region is small.
interface Cand { a: number; b: number; w: number }
function planEdges(settlements: Array<[number, number]>, maxLen: number): Cand[] {
  const n = settlements.length;
  const d2 = (i: number, j: number) => {
    const dx = settlements[i][0] - settlements[j][0];
    const dz = settlements[i][1] - settlements[j][1];
    return dx * dx + dz * dz;
  };
  const maxLen2 = maxLen * maxLen;
  const chosen: Cand[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dij2 = d2(i, j);
      if (dij2 > maxLen2) continue;
      let blocked = false;
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        // c inside the diameter circle of (a,b) ⟺ d(a,c)²+d(b,c)² < d(a,b)².
        if (d2(i, k) + d2(j, k) < dij2) { blocked = true; break; }
      }
      if (!blocked) chosen.push({ a: i, b: j, w: Math.sqrt(dij2) });
    }
  }
  return chosen;
}

/** Debug/verification helper: normalized height + mountain flag at a world point
 *  (same sampler the cost field uses). */
export function debugSampleWalkable(
  seed: string, terrain: RoadTerrainParams, x: number, z: number,
): { normalizedHeight: number; mountain: boolean } {
  const s = new TerrainSampler(seed, terrain);
  return { normalizedHeight: s.normalizedHeight(x, z), mountain: s.mountainAt(x, z) };
}

export function computeRoadNetwork(params: RoadNetworkParams): RoadNetworkResult {
  const s = new TerrainSampler(params.seed, params.terrain);
  const grid = buildCostGrid(params, s);
  // "Good ground" = NOT an obstacle. The LOS-simplify + smoothing keep the
  // polyline off obstacles wherever the A* path itself is on good ground.
  const ok: Walkable = (x, z) => !isObstacle(s, params.terrain, x, z, params.cellSize);
  const step = params.cellSize * 0.5;
  // Fraction of a route's samples allowed to be obstacle before the road is
  // dropped — a few cells (a narrow ford / a hill shoulder) are fine; a road
  // that's mostly lake or mountain is not drawn at all.
  const MAX_OBSTACLE_FRACTION = 0.15;
  const routeObstacleFraction = (pts: Array<[number, number]>): number => {
    let bad = 0, total = 0;
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const n = Math.max(1, Math.ceil(len / step));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t;
        const z = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
        total++; if (!ok(x, z)) bad++;
      }
    }
    return total ? bad / total : 1;
  };
  const edges = planEdges(params.settlements, params.maxEdgeLength);
  const cb = params.coreBounds;
  const inCore = (i: number): boolean => {
    if (!cb) return true;
    const [x, z] = params.settlements[i];
    return x >= cb.minX && x <= cb.maxX && z >= cb.minZ && z <= cb.maxZ;
  };

  const roads: RoadEdge[] = [];
  const degree = new Map<number, number>();
  const linked = new Set<string>();
  const tryRoad = (a: number, b: number): boolean => {
    // Both endpoints must be in the core so every region that owns the edge sees
    // the same (margin-padded) neighbourhood → identical result → no parallels.
    if (!inCore(a) || !inCore(b)) return false;
    const pk = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (linked.has(pk)) return false;
    const [ax, az] = params.settlements[a];
    const [bx, bz] = params.settlements[b];
    const path = astar(grid, ax, az, bx, bz);
    if (!path || path.length < 2) return false;
    if (ok(ax, az)) path[0] = [ax, az];
    if (ok(bx, bz)) path[path.length - 1] = [bx, bz];
    // Reject a road whose A* path had to spend too much of itself on water/rock/
    // mountain (towns separated by a real barrier) — better no road than one that
    // plows across a lake.
    if (routeObstacleFraction(path) > MAX_OBSTACLE_FRACTION) { linked.add(pk); return false; }
    roads.push({ a, b, points: chaikin(losSimplify(path, step, ok), 2, ok) });
    linked.add(pk);
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
    return true;
  };

  // Pass 1 — Gabriel edges (planar, deterministic).
  for (const e of edges) tryRoad(e.a, e.b);

  // Pass 2 — rescue: connect leaf/island CORE towns to their nearest REACHABLE
  // core town. The flat-only cost field fragments the map, so without this most
  // towns would be isolated. Kept DETERMINISTIC + core-only (fixed iteration
  // order, global candidate order, A* over the shared cost field) so overlapping
  // regions reach the same answer → still no parallels. Never routes through
  // water/rock/mountain — if nothing walkable is reachable, the town stays a leaf.
  const coreIdx: number[] = [];
  for (let i = 0; i < params.settlements.length; i++) if (inCore(i)) coreIdx.push(i);
  // Deterministic order independent of input ordering.
  coreIdx.sort((p, q) => (params.settlements[p][0] - params.settlements[q][0])
    || (params.settlements[p][1] - params.settlements[q][1]));
  for (const i of coreIdx) {
    if ((degree.get(i) ?? 0) >= 2) continue;
    const cand = coreIdx
      .filter((j) => j !== i)
      .map((j) => ({
        j,
        d: Math.hypot(params.settlements[i][0] - params.settlements[j][0],
          params.settlements[i][1] - params.settlements[j][1]),
      }))
      .filter((c) => c.d <= params.maxEdgeLength * 1.6)
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);
    for (const { j } of cand) {
      if ((degree.get(i) ?? 0) >= 2) break;
      if ((degree.get(j) ?? 0) >= 3) continue;
      tryRoad(i, j);
    }
  }
  return { roads };
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD ROAD BRAIN — deterministic town discovery + super-tile road cache +
// per-chunk road bake. This is what makes roads "known at the moment a chunk is
// generated, never recalculated as the player moves":
//
//   • Town discovery + road planning run ENTIRELY in the worker (this file) as a
//     pure function of (seed, terrain, config) — no main-thread biome scan.
//   • The world is divided into fixed SUPER-TILES. Each tile's town+road network
//     is computed ONCE (lazily, on first need) and cached forever. Because the
//     tiling is a fixed grid and the planner is deterministic + dedup-consistent
//     (coreBounds + margin), the network never shifts as you explore.
//   • generate_terrain bakes a per-vertex roadStrength (0..1) for the chunk from
//     the cached segments, and filters decoration spawns off the road — all in
//     the worker, at generate time.
// ─────────────────────────────────────────────────────────────────────────────

export interface RoadConfig {
  /** Master switch — off ⇒ generate_terrain bakes an all-zero roadStrength. */
  enabled: boolean;
  /** One town CANDIDATE per this-size world cell (rare towns). */
  townCell: number;
  /** A town needs a buildable clearing at least this deep (world units). */
  minClearance: number;
  /** Road surface width (world units). */
  roadWidth: number;
  /** Fixed super-tile size (world units). Should be ≫ maxEdge so most town
   *  clusters fall inside ONE tile (roads connect towns within a tile). */
  superTile: number;
  /** Longest road between two town centres (world units). */
  maxEdge: number;
  /** Road-planner cost-grid resolution (world units). */
  cellSize: number;
  /** Clearance probe tunables (match the old plugin so towns land identically). */
  clrDirs: number;
  clrStep: number;
  clrMax: number;
  /** Coarse scan step inside a town cell when hunting the deepest buildable point. */
  cellStep: number;
}

export const DEFAULT_ROAD_CONFIG: RoadConfig = {
  enabled: false,
  townCell: 760,
  minClearance: 95,
  roadWidth: 7,
  superTile: 6000,
  maxEdge: 1700,
  cellSize: 16,
  clrDirs: 10,
  clrStep: 28,
  clrMax: 360,
  cellStep: 70,
};

export interface Town { x: number; z: number; key: string; clr: number; }
interface Seg4 { x1: number; z1: number; x2: number; z2: number; }
interface TilePlan { towns: Town[]; segments: Seg4[]; }

// Per-seed sampler + deterministic caches. Keyed by seed so a second world in the
// same tab can't read another seed's towns. Module-global on purpose — the worker
// is one-per-tab and these are pure functions of (seed, terrain, config).
const _samplers = new Map<string, TerrainSampler>();
const _cellBest = new Map<string, Town | null>();
const _tilePlans = new Map<string, TilePlan>();

function getSampler(seed: string, terrain: RoadTerrainParams): TerrainSampler {
  let s = _samplers.get(seed);
  if (!s) { s = new TerrainSampler(seed, terrain); _samplers.set(seed, s); }
  return s;
}

/** How deep inside a buildable clearing (x,z) is — min distance to its edge. */
function clearance(s: TerrainSampler, cfg: RoadConfig, x: number, z: number): number {
  if (!s.buildableAt(x, z)) return -1;
  let min = cfg.clrMax;
  for (let k = 0; k < cfg.clrDirs; k++) {
    const a = (k / cfg.clrDirs) * Math.PI * 2;
    const cx = Math.cos(a), cz = Math.sin(a);
    let d = cfg.clrStep;
    for (; d <= cfg.clrMax; d += cfg.clrStep) if (!s.buildableAt(x + cx * d, z + cz * d)) break;
    if (d < min) min = d;
  }
  return min;
}

/** Deepest buildable point in coarse cell (ci,cj) + its clearance, or null if no
 *  clearing reaches minClearance. Deterministic → cached per (seed, cell). */
function cellBest(s: TerrainSampler, cfg: RoadConfig, seed: string, ci: number, cj: number): Town | null {
  const key = `${seed}|${ci}|${cj}`;
  const hit = _cellBest.get(key);
  if (hit !== undefined) return hit;
  let best: Town | null = null;
  let bestClr = cfg.minClearance;
  const x0 = ci * cfg.townCell, z0 = cj * cfg.townCell;
  for (let sz = 0; sz < cfg.townCell; sz += cfg.cellStep) {
    for (let sx = 0; sx < cfg.townCell; sx += cfg.cellStep) {
      const x = x0 + sx, z = z0 + sz;
      if (!s.buildableAt(x, z)) continue;
      const clr = clearance(s, cfg, x, z);
      if (clr > bestClr) { bestClr = clr; best = { x, z, key: `${ci}_${cj}`, clr }; }
    }
  }
  _cellBest.set(key, best);
  return best;
}

/** A town exists at cell (ci,cj) only if its clearing is the deepest in the 3×3
 *  cell neighbourhood — one big buildable blob ⇒ exactly ONE town, at its centre. */
function townInCell(s: TerrainSampler, cfg: RoadConfig, seed: string, ci: number, cj: number): Town | null {
  const c = cellBest(s, cfg, seed, ci, cj);
  if (!c) return null;
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      if (di === 0 && dj === 0) continue;
      const n = cellBest(s, cfg, seed, ci + di, cj + dj);
      if (n && n.clr > c.clr) return null;
    }
  }
  return c;
}

function townsInBounds(
  s: TerrainSampler, cfg: RoadConfig, seed: string,
  b: { minX: number; minZ: number; maxX: number; maxZ: number },
): Town[] {
  const list: Town[] = [];
  const i0 = Math.floor(b.minX / cfg.townCell), i1 = Math.ceil(b.maxX / cfg.townCell);
  const j0 = Math.floor(b.minZ / cfg.townCell), j1 = Math.ceil(b.maxZ / cfg.townCell);
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const t = townInCell(s, cfg, seed, i, j);
      if (t) list.push(t);
    }
  }
  return list;
}

/** Plan (or fetch cached) one super-tile's town+road network. `towns` are the
 *  tile's OWN core towns (no duplicates across tiles); `segments` are the flat
 *  road polylines for distance tests. Computed once per (seed, tile). */
function planSuperTile(
  seed: string, terrain: RoadTerrainParams, cfg: RoadConfig, ti: number, tj: number,
): TilePlan {
  const key = `${seed}|${ti}|${tj}`;
  const cached = _tilePlans.get(key);
  if (cached) return cached;

  const s = getSampler(seed, terrain);
  const core = {
    minX: ti * cfg.superTile, minZ: tj * cfg.superTile,
    maxX: (ti + 1) * cfg.superTile, maxZ: (tj + 1) * cfg.superTile,
  };
  const m = cfg.maxEdge;
  const wide = { minX: core.minX - m, minZ: core.minZ - m, maxX: core.maxX + m, maxZ: core.maxZ + m };

  const coreTowns = townsInBounds(s, cfg, seed, core);
  const allTowns = townsInBounds(s, cfg, seed, wide);

  const segments: Seg4[] = [];
  if (allTowns.length >= 2) {
    // Connect ALL town pairs across the wide area (NO coreBounds) so towns that
    // straddle a tile seam still link — then each road is OWNED by the tile that
    // contains its MIDPOINT (deterministic, exactly one tile), which is the dedup
    // that keeps overlapping tiles from drawing the same road twice. (The old
    // both-endpoints-in-core rule left most tiles roadless because rare towns
    // rarely share a 6 km tile core.)
    const { roads } = computeRoadNetwork({
      seed, terrain, bounds: wide,
      cellSize: cfg.cellSize, maxEdgeLength: cfg.maxEdge,
      settlements: allTowns.map((t) => [t.x, t.z]),
    });
    for (const road of roads) {
      const A = allTowns[road.a], B = allTowns[road.b];
      const mx = (A.x + B.x) * 0.5, mz = (A.z + B.z) * 0.5;
      if (mx < core.minX || mx >= core.maxX || mz < core.minZ || mz >= core.maxZ) continue;
      const p = road.points;
      for (let i = 0; i + 1 < p.length; i++) {
        segments.push({ x1: p[i][0], z1: p[i][1], x2: p[i + 1][0], z2: p[i + 1][1] });
      }
    }
  }
  const plan: TilePlan = { towns: coreTowns, segments };
  _tilePlans.set(key, plan);
  return plan;
}

function distToSeg(px: number, pz: number, s: Seg4): number {
  const dx = s.x2 - s.x1, dz = s.z2 - s.z1;
  const len2 = dx * dx + dz * dz;
  let t = len2 > 1e-6 ? ((px - s.x1) * dx + (pz - s.z1) * dz) / len2 : 0;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const cx = s.x1 + dx * t, cz = s.z1 + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

/** Collect road segments (from all overlapping cached tiles) within a world box.
 *  Planning a tile is lazy + cached, so this is cheap after first touch. */
function gatherSegments(
  seed: string, terrain: RoadTerrainParams, cfg: RoadConfig,
  minX: number, minZ: number, maxX: number, maxZ: number,
): Seg4[] {
  const ti0 = Math.floor(minX / cfg.superTile), ti1 = Math.floor(maxX / cfg.superTile);
  const tj0 = Math.floor(minZ / cfg.superTile), tj1 = Math.floor(maxZ / cfg.superTile);
  const out: Seg4[] = [];
  for (let tj = tj0; tj <= tj1; tj++) {
    for (let ti = ti0; ti <= ti1; ti++) {
      const plan = planSuperTile(seed, terrain, cfg, ti, tj);
      for (const sg of plan.segments) {
        if (Math.max(sg.x1, sg.x2) < minX || Math.min(sg.x1, sg.x2) > maxX) continue;
        if (Math.max(sg.z1, sg.z2) < minZ || Math.min(sg.z1, sg.z2) > maxZ) continue;
        out.push(sg);
      }
    }
  }
  return out;
}

export interface ChunkRoadParams {
  gridX: number; gridZ: number; width: number; height: number;
}

/** Road segments relevant to one chunk (chunk box + a margin that captures a
 *  road bulging across a tile seam). Call once per chunk, reuse for bake +
 *  spawn filtering. */
export function getChunkRoadSegments(
  seed: string, terrain: RoadTerrainParams, cfg: RoadConfig, chunk: ChunkRoadParams,
): Array<{ x1: number; z1: number; x2: number; z2: number }> {
  const originX = chunk.gridX * chunk.width;
  const originZ = chunk.gridZ * chunk.height;
  // A road owned by a tile can run up to maxEdge/2 from its midpoint, so a road
  // passing through this chunk may be owned by a tile up to maxEdge/2 away —
  // gather that far so no road is missed at tile seams.
  const reach = cfg.roadWidth * 0.5 + cfg.maxEdge * 0.5;
  return gatherSegments(
    seed, terrain, cfg,
    originX - chunk.width * 0.5 - reach, originZ - chunk.height * 0.5 - reach,
    originX + chunk.width * 0.5 + reach, originZ + chunk.height * 0.5 + reach,
  );
}

/** Per-vertex roadStrength 0..1 (1 = road centre, 0 = off road). `positions` is
 *  the chunk-LOCAL [x,y,z,…] buffer; world XZ = origin + local. */
export function bakeRoadStrength(
  positions: Float32Array, originX: number, originZ: number,
  segs: Array<{ x1: number; z1: number; x2: number; z2: number }>, roadWidth: number,
): Float32Array {
  const vCount = positions.length / 3;
  const out = new Float32Array(vCount);
  if (segs.length === 0) return out;
  const halfW = roadWidth * 0.5;
  const inner = halfW * 0.6;
  for (let k = 0; k < vCount; k++) {
    const wx = originX + positions[k * 3];
    const wz = originZ + positions[k * 3 + 2];
    let best = Infinity;
    for (let i = 0; i < segs.length; i++) {
      const d = distToSeg(wx, wz, segs[i]);
      if (d < best) { best = d; if (best <= inner) break; }
    }
    // 1 inside `inner`, smooth to 0 at halfW (smoothstep handles e0>e1).
    out[k] = smoothstep(halfW, inner, best);
  }
  return out;
}

/** True if world (wx,wz) is within `reach` of any of `segs` — used to drop
 *  decoration spawns that would sit on a road. */
export function isPointOnRoad(
  wx: number, wz: number,
  segs: Array<{ x1: number; z1: number; x2: number; z2: number }>, reach: number,
): boolean {
  for (let i = 0; i < segs.length; i++) if (distToSeg(wx, wz, segs[i]) <= reach) return true;
  return false;
}

/** Drop spawns (stride-N float records, chunk-local x at [0], z at [2]) whose
 *  world XZ lands on a road. Returns a compacted Float32Array. */
export function filterSpawnsOnRoad(
  spawns: Float32Array, stride: number, originX: number, originZ: number,
  segs: Array<{ x1: number; z1: number; x2: number; z2: number }>, reach: number,
): Float32Array {
  if (spawns.length === 0 || segs.length === 0) return spawns;
  const kept: number[] = [];
  for (let i = 0; i + stride <= spawns.length; i += stride) {
    const wx = originX + spawns[i];
    const wz = originZ + spawns[i + 2];
    if (isPointOnRoad(wx, wz, segs, reach)) continue;
    for (let k = 0; k < stride; k++) kept.push(spawns[i + k]);
  }
  return new Float32Array(kept);
}

/** Town centres for a world region (the plugin places monuments + plazas here).
 *  Backed by the same cached tile plans, so this never re-discovers. */
export function getTownsInRegion(
  seed: string, terrain: RoadTerrainParams, cfg: RoadConfig,
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number },
): Town[] {
  const ti0 = Math.floor(bounds.minX / cfg.superTile), ti1 = Math.floor(bounds.maxX / cfg.superTile);
  const tj0 = Math.floor(bounds.minZ / cfg.superTile), tj1 = Math.floor(bounds.maxZ / cfg.superTile);
  const out: Town[] = [];
  for (let tj = tj0; tj <= tj1; tj++) {
    for (let ti = ti0; ti <= ti1; ti++) {
      for (const t of planSuperTile(seed, terrain, cfg, ti, tj).towns) {
        if (t.x >= bounds.minX && t.x <= bounds.maxX && t.z >= bounds.minZ && t.z <= bounds.maxZ) {
          out.push(t);
        }
      }
    }
  }
  return out;
}
