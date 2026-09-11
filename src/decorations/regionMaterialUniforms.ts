/**
 * Region-material uniforms — "replace the terrain surface inside a circle".
 *
 * A registered region is a world-space circle (centre + radius) whose terrain
 * surface is overridden by a registered procedural surface (cobblestone by
 * default; see terrainSurfaceRegistry.ts). It's the same fixed-cap-uniform-array
 * mechanism as groundPatchUniforms.ts (the shaders loop the array per fragment),
 * with two parallel representations so both renderers read the same backing
 * arrays:
 *   - TSL `uniformArray`/`uniform`  → WebGPU terrain material.
 *   - plain `{ value }` IUniform     → WebGL ShaderMaterial twin.
 *
 * Grass clearing is DELEGATED to the groundPatch system: a region with
 * `clearGrass` registers a matching groundPatch (clearGrass + a dark stone-dirt
 * underlay) so blades collapse inside the plaza and the surface override draws
 * over the dirt — no changes to the grass shaders needed.
 */
import { uniformArray, uniform } from 'three/tsl';
import { Vector3 } from 'three';
import { surfaceIndexOf, surfaceFallbackColor } from '../components/core/front/terrainSurfaceRegistry';
import { registerGroundPatches, unregisterGroundPatches } from './groundPatchUniforms';

/** Max simultaneous surface regions the shaders loop over. Custom surfaces are
 *  heavier than dirt patches, so this is smaller than MAX_GROUND_PATCHES. */
export const MAX_REGION_MATERIALS = 8;

// vec3 (worldX, worldZ, radius). radius 0 ⇒ inactive slot (parked far away).
const _xzr: Vector3[] = [];
// vec3 (surfaceIndex, scale, p2) — p2 is the surface's second param (mortar…).
const _param: Vector3[] = [];
// vec3 tint (RGB multiplier; also the WebGL flat fallback for custom surfaces).
const _tint: Vector3[] = [];
for (let i = 0; i < MAX_REGION_MATERIALS; i++) {
  _xzr.push(new Vector3(99999, 99999, 0));
  _param.push(new Vector3(0, 1, 0.08));
  _tint.push(new Vector3(1, 1, 1));
}

// ── WebGPU (TSL) ──
export const regionXZR = uniformArray(_xzr, 'vec3');
export const regionParam = uniformArray(_param, 'vec3');
export const regionTint = uniformArray(_tint, 'vec3');
export const regionCount = uniform(0);
// World Y of the water surface. Both terrain materials fade the region surface
// out as fragments approach it, so a surface override NEVER paints over (or just
// under) water — the natural terrain + shoreline wash shows through there
// instead. Default sits far below any terrain (no gating until set).
export const regionWaterY = uniform(-99999);

// ── WebGL (plain ShaderMaterial uniforms, sharing the same backing arrays) ──
export const regionXZRUniform = { value: _xzr };
export const regionParamUniform = { value: _param };
export const regionTintUniform = { value: _tint };
export const regionCountUniform = { value: 0 };
export const regionWaterYUniform = { value: -99999 };

/** Set the water-surface world Y used to keep region surfaces off the water.
 *  Called by InfiniteTerrain alongside setShoreWaterLevel — keep them in step. */
export function setRegionWaterLevel(y: number): void {
  regionWaterY.value = y;
  regionWaterYUniform.value = y;
}

interface RegionData {
  x: number; z: number; radius: number;
  surface: string; scale: number; mortar: number;
  tint: [number, number, number];
}
const _byId = new Map<string, RegionData>();
let _all: RegionData[] = [];
let _playerX = 0;
let _playerZ = 0;
let _lastRepackX = Infinity;
let _lastRepackZ = Infinity;
const _listeners = new Set<() => void>();

function rebuildAll(): void {
  _all = Array.from(_byId.values());
}

function repack(): void {
  let regions = _all;
  if (regions.length > MAX_REGION_MATERIALS) {
    regions = regions
      .map((r) => ({ r, d: (r.x - _playerX) ** 2 + (r.z - _playerZ) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_REGION_MATERIALS)
      .map((e) => e.r);
  }
  const n = Math.min(regions.length, MAX_REGION_MATERIALS);
  for (let i = 0; i < n; i++) {
    const r = regions[i];
    _xzr[i].set(r.x, r.z, r.radius);
    // Resolve the surface id → uniform index at repack time (surfaces may
    // register after the region does).
    _param[i].set(surfaceIndexOf(r.surface), r.scale, r.mortar);
    _tint[i].set(r.tint[0], r.tint[1], r.tint[2]);
  }
  for (let i = n; i < MAX_REGION_MATERIALS; i++) {
    _xzr[i].set(99999, 99999, 0);
  }
  regionCount.value = n;
  regionCountUniform.value = n;
  _lastRepackX = _playerX;
  _lastRepackZ = _playerZ;
  _listeners.forEach((l) => l());
}

export interface RegionMaterialEntry {
  /** Stable id (used to remove + to key the delegated grass patch). */
  id: string;
  worldX: number;
  worldZ: number;
  radius: number;
  /** Registered surface id (terrainSurfaceRegistry). Default 'cobblestone'. */
  surface?: string;
  /** Feature scale (cells per world unit). Default 0.35. */
  scale?: number;
  /** Surface second param (mortar width for cobblestone). Default 0.08. */
  mortar?: number;
  /** RGB tint multiplier (and WebGL flat fallback). Default white. */
  tint?: [number, number, number];
  /** Clear engine grass out of the circle (default true). */
  clearGrass?: boolean;
}

/** Stone-dirt underlay drawn under the surface where grass is cleared (only
 *  visible at the soft region edge where the surface fades). */
const REGION_GRASS_KEY = (id: string) => `__region-${id}`;
const STONE_DIRT: [number, number, number] = [0.30, 0.28, 0.25];

export function addRegionMaterial(spec: RegionMaterialEntry): string {
  if (!spec || !Number.isFinite(spec.worldX) || !Number.isFinite(spec.worldZ) || !(spec.radius > 0)) {
    console.warn('[XRPublisher] addTerrainRegion: need { worldX, worldZ, radius>0 }');
    return '';
  }
  const id = spec.id;
  const surface = spec.surface ?? 'cobblestone';
  // With no explicit tint, a region using a CUSTOM surface takes that
  // surface's registered fallbackColor as its tint. Both renderers paint the
  // flat-fallback path straight from the tint, so this is what makes a custom
  // surface render the same colour on WebGPU and WebGL instead of a white
  // disc on one and fallbackColor on the other. (The built-in cobblestone has
  // its own stone colour, so it keeps a white tint.)
  const tint = spec.tint ?? surfaceFallbackColor(surface) ?? [1, 1, 1];
  _byId.set(id, {
    x: spec.worldX, z: spec.worldZ, radius: spec.radius,
    surface,
    scale: spec.scale ?? 0.35,
    mortar: spec.mortar ?? 0.08,
    tint,
  });
  rebuildAll();
  repack();
  // Delegate grass clearing (+ a dirt underlay) to the groundPatch system.
  if (spec.clearGrass !== false) {
    registerGroundPatches(REGION_GRASS_KEY(id), [{
      worldX: spec.worldX, worldZ: spec.worldZ, radius: spec.radius,
      color: STONE_DIRT, clearGrass: true,
    }]);
  } else {
    unregisterGroundPatches(REGION_GRASS_KEY(id));
  }
  return id;
}

export function removeRegionMaterial(id: string): void {
  if (_byId.delete(id)) {
    rebuildAll();
    repack();
  }
  unregisterGroundPatches(REGION_GRASS_KEY(id));
}

export function setRegionMaterialPlayer(x: number, z: number): void {
  _playerX = x;
  _playerZ = z;
  if (_all.length <= MAX_REGION_MATERIALS) return;
  const dx = x - _lastRepackX;
  const dz = z - _lastRepackZ;
  if (dx * dx + dz * dz > 100) repack();
}

export function subscribeRegionMaterials(listener: () => void): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}
