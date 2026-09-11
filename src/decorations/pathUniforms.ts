/**
 * Path uniforms — "draw a road/trail along a world-space polyline".
 *
 * A path is the LINEAR cousin of a terrain region (regionMaterialUniforms.ts):
 * a chain of world-space SEGMENTS with a width and a tint. Both terrain
 * materials loop the segment array per fragment, compute distance to the
 * nearest segment, and paint the strip with the WORLD-ROAD recipe (packed
 * dirt + pebble noise, × the path's tint) LAYERED OVER any region beneath —
 * a sandy trail reads across a cobblestone plaza and across bare terrain
 * alike, with the same water-aware fade as regions.
 *
 * NOTE: `surface`/`scale`/`p2` are carried in the uniforms for API
 * compatibility but the painters currently ignore them — every path renders
 * as road-style packed dirt; `tint` is the look control. Grass does NOT read
 * these segments (in-town paths rely on the town groundPatch clearing grass);
 * `isNearPath` is available for JS-side filters.
 *
 * Two parallel representations so both renderers read the same backing arrays:
 *   - TSL `uniformArray`/`uniform`  → WebGPU terrain material.
 *   - plain `{ value }` IUniform     → WebGL ShaderMaterial twin.
 */
import { uniformArray, uniform } from 'three/tsl';
import { Vector4, Vector3 } from 'three';
import { surfaceIndexOf } from '../components/core/front/terrainSurfaceRegistry';

/** Max simultaneous path SEGMENTS the shaders loop over (nearest-to-player). A
 *  long road is many segments; only the nearest cap render at once. */
export const MAX_PATH_SEGMENTS = 48;

// vec4 (x1, z1, x2, z2) world-space segment endpoints. Parked far when inactive.
const _seg: Vector4[] = [];
// vec4 (halfWidth, surfaceIndex, scale, p2). halfWidth 0 ⇒ inactive slot.
const _meta: Vector4[] = [];
// vec3 tint (RGB multiplier; also the WebGL flat fallback for custom surfaces).
const _tint: Vector3[] = [];
for (let i = 0; i < MAX_PATH_SEGMENTS; i++) {
  _seg.push(new Vector4(99999, 99999, 99999, 99999));
  _meta.push(new Vector4(0, 0, 0.4, 0.08));
  _tint.push(new Vector3(1, 1, 1));
}

// ── WebGPU (TSL) ──
export const pathSeg = uniformArray(_seg, 'vec4');
export const pathMeta = uniformArray(_meta, 'vec4');
export const pathTint = uniformArray(_tint, 'vec3');
export const pathCount = uniform(0);

// ── WebGL (plain ShaderMaterial uniforms, sharing the same backing arrays) ──
export const pathSegUniform = { value: _seg };
export const pathMetaUniform = { value: _meta };
export const pathTintUniform = { value: _tint };
export const pathCountUniform = { value: 0 };

interface Segment {
  x1: number; z1: number; x2: number; z2: number;
  halfWidth: number; surface: string; scale: number; p2: number;
  tint: [number, number, number];
  mx: number; mz: number;   // midpoint (for player-distance culling)
}
interface PathData {
  segments: Segment[];
}
const _byId = new Map<string, PathData>();
let _allSegments: Segment[] = [];
let _playerX = 0;
let _playerZ = 0;
let _lastRepackX = Infinity;
let _lastRepackZ = Infinity;
const _listeners = new Set<() => void>();

// Set-change version — bumps ONLY when paths are added/removed (not on the
// player-move repacks that fire `_listeners`). Tree chunks watch this to rebuild
// when a road is added near them AFTER their geometry was already baked.
let _setVersion = 0;
const _setListeners = new Set<() => void>();
function bumpSet(): void {
  _setVersion++;
  _setListeners.forEach((l) => l());
}
export function getPathSetVersion(): number { return _setVersion; }
export function subscribePathSet(listener: () => void): () => void {
  _setListeners.add(listener);
  return () => { _setListeners.delete(listener); };
}

/** Count ACTIVE (packed) path segments whose surface area comes within `radius`
 *  of (x, z). A tree chunk compares this across path-set changes — when it moves,
 *  a road now crosses the chunk and the trees must re-filter. */
export function countSegmentsNear(x: number, z: number, radius: number): number {
  const n = _allSegments.length;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const s = _allSegments[i];
    const dx = s.x2 - s.x1; const dz = s.z2 - s.z1;
    const len2 = dx * dx + dz * dz;
    let t = len2 > 1e-4 ? ((x - s.x1) * dx + (z - s.z1) * dz) / len2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    const cx = s.x1 + dx * t; const cz = s.z1 + dz * t;
    if (Math.hypot(x - cx, z - cz) <= s.halfWidth + radius) count++;
  }
  return count;
}

function rebuildAll(): void {
  _allSegments = [];
  for (const p of _byId.values()) _allSegments.push(...p.segments);
}

function repack(): void {
  let segs = _allSegments;
  if (segs.length > MAX_PATH_SEGMENTS) {
    segs = segs
      .map((s) => ({ s, d: (s.mx - _playerX) ** 2 + (s.mz - _playerZ) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_PATH_SEGMENTS)
      .map((e) => e.s);
  }
  const n = Math.min(segs.length, MAX_PATH_SEGMENTS);
  for (let i = 0; i < n; i++) {
    const s = segs[i];
    _seg[i].set(s.x1, s.z1, s.x2, s.z2);
    // Resolve the surface id → index at repack time (surfaces may register late).
    _meta[i].set(s.halfWidth, surfaceIndexOf(s.surface), s.scale, s.p2);
    _tint[i].set(s.tint[0], s.tint[1], s.tint[2]);
  }
  for (let i = n; i < MAX_PATH_SEGMENTS; i++) {
    _seg[i].set(99999, 99999, 99999, 99999);
    _meta[i].set(0, 0, 0.4, 0.08);
  }
  pathCount.value = n;
  pathCountUniform.value = n;
  _lastRepackX = _playerX;
  _lastRepackZ = _playerZ;
  _listeners.forEach((l) => l());
}

export interface PathEntry {
  /** Stable id (used to remove). */
  id: string;
  /** Ordered world-space waypoints [[x, z], …] — the path runs through them. */
  points: Array<[number, number]>;
  /** Path width in world units (default 4). */
  width?: number;
  /** Registered surface id (terrainSurfaceRegistry). Accepted for API
   *  compatibility but IGNORED by both painters — paths always render as
   *  road-style packed dirt; use `tint` to change the look. */
  surface?: string;
  /** Accepted for API compatibility; ignored by the painters (see `surface`). */
  scale?: number;
  /** Accepted for API compatibility; ignored by the painters (see `surface`). */
  p2?: number;
  /** RGB tint multiplier — the actual look control for a path. */
  tint?: [number, number, number];
  /** Accepted for API compatibility and IGNORED: no grass material reads the
   *  path segments, so a path never clears grass. Use a `groundPatch`
   *  decoration or `addTerrainRegion` where you need bare ground. */
  clearGrass?: boolean;
}

export function addPath(spec: PathEntry): string {
  if (!spec || !spec.id || !Array.isArray(spec.points) || spec.points.length < 2) {
    console.warn('[XRPublisher] addPath: need { id, points:[[x,z],…] } with ≥2 points');
    return '';
  }
  const width = spec.width && spec.width > 0 ? spec.width : 4;
  const halfWidth = width * 0.5;
  const surface = spec.surface ?? 'cobblestone';
  const scale = spec.scale ?? 0.4;
  const p2 = spec.p2 ?? 0.08;
  const tint = spec.tint ?? [1, 1, 1];

  const segments: Segment[] = [];
  for (let i = 0; i + 1 < spec.points.length; i++) {
    const [x1, z1] = spec.points[i];
    const [x2, z2] = spec.points[i + 1];
    if (![x1, z1, x2, z2].every(Number.isFinite)) continue;
    segments.push({
      x1, z1, x2, z2, halfWidth, surface, scale, p2, tint,
      mx: (x1 + x2) * 0.5, mz: (z1 + z2) * 0.5,
    });
  }
  if (segments.length === 0) return '';

  _byId.set(spec.id, { segments });
  rebuildAll();
  repack();
  bumpSet();          // notify tree chunks to re-filter (roads added after build)
  return spec.id;
}

export function removePath(id: string): void {
  if (_byId.delete(id)) {
    rebuildAll();
    repack();
    bumpSet();
  }
}

/** True if (worldX, worldZ) is within `margin` of the road surface (halfWidth +
 *  margin) of ANY registered path segment. Checks every segment (not just the
 *  GPU-packed nearest-48) so the JS tree filter clears trees off every road. */
export function isNearPath(worldX: number, worldZ: number, margin = 0): boolean {
  const n = _allSegments.length;
  for (let i = 0; i < n; i++) {
    const s = _allSegments[i];
    const dx = s.x2 - s.x1; const dz = s.z2 - s.z1;
    const len2 = dx * dx + dz * dz;
    let t = len2 > 1e-4 ? ((worldX - s.x1) * dx + (worldZ - s.z1) * dz) / len2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    const cx = s.x1 + dx * t; const cz = s.z1 + dz * t;
    if (Math.hypot(worldX - cx, worldZ - cz) <= s.halfWidth + margin) return true;
  }
  return false;
}

export function setPathPlayer(x: number, z: number): void {
  _playerX = x;
  _playerZ = z;
  if (_allSegments.length <= MAX_PATH_SEGMENTS) return;
  const dx = x - _lastRepackX;
  const dz = z - _lastRepackZ;
  if (dx * dx + dz * dz > 100) repack();
}

export function subscribePaths(listener: () => void): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}
