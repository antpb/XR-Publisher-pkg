/**
 * Cloud-region uniforms — "different weather inside a circle".
 *
 * A registered cloud region is a world-space circle (centre + radius) that
 * overrides the global cloud look inside it: density (how much sky is covered),
 * coverage (how overcast — lower threshold = fuller cloud deck), formation
 * scale, colour (white fair-weather → dark grey storm), plus a `rain` 0..1 and
 * `speed` value that are exposed to plugins via `getWeatherAt` (the engine does
 * NOT render rain — plugins drive their own precipitation/events off the query).
 *
 * Same fixed-cap-uniform-array mechanism as regionMaterialUniforms.ts /
 * groundPatchUniforms.ts: the cloud shaders loop the array per fragment, with
 * two parallel representations so both renderers read the same backing arrays:
 *   - TSL `uniformArray`/`uniform`  → WebGPU ProceduralSky cloud material.
 *   - plain `{ value }` IUniform     → WebGL ProceduralSkyWebGL ShaderMaterial.
 *
 * Clouds are world-anchored + seeded: the shaders sample `positionWorld.xz`
 * (WebGPU) / a `modelMatrix`-derived world XZ (WebGL) offset by `cloudSeedOffset`
 * (hashed from the world seed via alea), so formations stay fixed in the world
 * and are identical every visit and across both renderers.
 */
import { uniformArray, uniform } from 'three/tsl';
import { Vector2, Vector3 } from 'three';
import { alea } from 'seedrandom';

/** Max simultaneous weather regions the cloud shaders loop over. */
export const MAX_CLOUD_REGIONS = 8;

// vec3 (worldX, worldZ, radius). radius 0 ⇒ inactive slot (parked far away).
const _xzr: Vector3[] = [];
// vec3 (density, coverage, scale).
const _paramA: Vector3[] = [];
// vec3 (rain, falloff, speed). falloff = inner-solid fraction (0..1).
const _paramB: Vector3[] = [];
// vec3 cloud colour (RGB).
const _color: Vector3[] = [];
for (let i = 0; i < MAX_CLOUD_REGIONS; i++) {
  _xzr.push(new Vector3(99999, 99999, 0));
  _paramA.push(new Vector3(0.5, 0.3, 1));
  _paramB.push(new Vector3(0, 0.6, 0.1));
  _color.push(new Vector3(1, 1, 1));
}

// ── WebGPU (TSL) ──
export const cloudXZR = uniformArray(_xzr, 'vec3');
export const cloudParamA = uniformArray(_paramA, 'vec3');
export const cloudParamB = uniformArray(_paramB, 'vec3');
export const cloudColorArr = uniformArray(_color, 'vec3');
export const cloudRegionCount = uniform(0);
// Global fair-weather defaults (initialised from the terrain block's cloud
// attributes by ProceduralSky, overridable via setCloudDefaults).
export const cloudBaseDensity = uniform(0.5);
export const cloudBaseCoverage = uniform(0.3);
export const cloudBaseScale = uniform(1.0);
export const cloudBaseColor = uniform(new Vector3(1, 1, 1));
// World-seed-derived noise offset → world-anchored, deterministic formations.
export const cloudSeedOffset = uniform(new Vector2(0, 0));

/** Fair-weather drift speed outside every cloud region — the same default a
 *  region gets when its spec omits `speed`. Query-side only (the shaders take
 *  drift from their own time term), so it's a constant, not a uniform. */
export const BASE_CLOUD_SPEED = 0.1;

// ── WebGL (plain ShaderMaterial uniforms, sharing the same backing arrays) ──
export const cloudXZRUniform = { value: _xzr };
export const cloudParamAUniform = { value: _paramA };
export const cloudParamBUniform = { value: _paramB };
export const cloudColorArrUniform = { value: _color };
export const cloudRegionCountUniform = { value: 0 };
export const cloudBaseDensityUniform = { value: 0.5 };
export const cloudBaseCoverageUniform = { value: 0.3 };
export const cloudBaseScaleUniform = { value: 1.0 };
export const cloudBaseColorUniform = { value: new Vector3(1, 1, 1) };
export const cloudSeedOffsetUniform = { value: new Vector2(0, 0) };

export interface CloudDefaults {
  density?: number;
  coverage?: number;
  scale?: number;
  /** RGB 0..1. */
  color?: [number, number, number];
}

/** Set the global fair-weather cloud look (the base every region blends over).
 *  ProceduralSky calls this with the terrain block's cloud attributes so the
 *  no-plugin look is unchanged. */
export function setCloudDefaults(cfg: CloudDefaults): void {
  if (!cfg) return;
  if (Number.isFinite(cfg.density as number)) {
    cloudBaseDensity.value = cfg.density as number;
    cloudBaseDensityUniform.value = cfg.density as number;
  }
  if (Number.isFinite(cfg.coverage as number)) {
    cloudBaseCoverage.value = cfg.coverage as number;
    cloudBaseCoverageUniform.value = cfg.coverage as number;
  }
  if (Number.isFinite(cfg.scale as number)) {
    cloudBaseScale.value = cfg.scale as number;
    cloudBaseScaleUniform.value = cfg.scale as number;
  }
  if (cfg.color) {
    (cloudBaseColor.value as Vector3).set(cfg.color[0], cfg.color[1], cfg.color[2]);
    cloudBaseColorUniform.value.set(cfg.color[0], cfg.color[1], cfg.color[2]);
  }
}

let _seedKey = '';
/** Hash the world seed → a stable noise offset so clouds are world-anchored and
 *  identical every load / across renderers. Idempotent per seed. */
export function setCloudSeed(seed: string): void {
  if (!seed || seed === _seedKey) return;
  _seedKey = seed;
  const rng = alea(`${seed}-clouds`);
  const ox = (rng() - 0.5) * 20000;
  const oz = (rng() - 0.5) * 20000;
  (cloudSeedOffset.value as Vector2).set(ox, oz);
  cloudSeedOffsetUniform.value.set(ox, oz);
}

interface CloudRegionData {
  x: number; z: number; radius: number;
  density: number; coverage: number; scale: number;
  rain: number; falloff: number; speed: number;
  color: [number, number, number];
}
const _byId = new Map<string, CloudRegionData>();
let _all: CloudRegionData[] = [];
let _playerX = 0;
let _playerZ = 0;
let _lastRepackX = Infinity;
let _lastRepackZ = Infinity;

function rebuildAll(): void {
  _all = Array.from(_byId.values());
}

function repack(): void {
  let regions = _all;
  if (regions.length > MAX_CLOUD_REGIONS) {
    regions = regions
      .map((r) => ({ r, d: (r.x - _playerX) ** 2 + (r.z - _playerZ) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_CLOUD_REGIONS)
      .map((e) => e.r);
  }
  const n = Math.min(regions.length, MAX_CLOUD_REGIONS);
  for (let i = 0; i < n; i++) {
    const r = regions[i];
    _xzr[i].set(r.x, r.z, r.radius);
    _paramA[i].set(r.density, r.coverage, r.scale);
    _paramB[i].set(r.rain, r.falloff, r.speed);
    _color[i].set(r.color[0], r.color[1], r.color[2]);
  }
  for (let i = n; i < MAX_CLOUD_REGIONS; i++) {
    _xzr[i].set(99999, 99999, 0);
  }
  cloudRegionCount.value = n;
  cloudRegionCountUniform.value = n;
  _lastRepackX = _playerX;
  _lastRepackZ = _playerZ;
}

export interface CloudRegionSpec {
  /** Stable id (used to remove). Auto-generated if omitted. */
  id?: string;
  /** World-space [x, z] centre. */
  center: [number, number];
  /** Radius in world units. */
  radius: number;
  /** Inner-solid fraction 0..1 (default 0.6): inside radius*falloff is fully the
   *  region; between there and radius it fades to the base look. */
  falloff?: number;
  /** Cloud amount/alpha 0..1 (default base). */
  density?: number;
  /** Overcast factor 0..1 (default base): higher ⇒ fuller cloud deck. */
  coverage?: number;
  /** Formation scale multiplier (default base). */
  scale?: number;
  /** Drift speed (data/query only; default base). */
  speed?: number;
  /** Rain intensity 0..1 exposed via getWeatherAt (default 0). */
  rain?: number;
  /** Cloud colour RGB 0..1 (default base; grey for storm). */
  color?: [number, number, number];
}

let _autoId = 0;

export function addCloudRegion(spec: CloudRegionSpec): string {
  if (!spec || !spec.center || !Number.isFinite(spec.center[0]) || !Number.isFinite(spec.center[1]) || !(spec.radius > 0)) {
    console.warn('[XRPublisher] addCloudRegion: need { center:[x,z], radius>0 }');
    return '';
  }
  const id = spec.id ?? `cloud-region-${_autoId++}`;
  _byId.set(id, {
    x: spec.center[0], z: spec.center[1], radius: spec.radius,
    density: Number.isFinite(spec.density as number) ? (spec.density as number) : cloudBaseDensity.value,
    coverage: Number.isFinite(spec.coverage as number) ? (spec.coverage as number) : cloudBaseCoverage.value,
    scale: Number.isFinite(spec.scale as number) ? (spec.scale as number) : cloudBaseScale.value,
    rain: Number.isFinite(spec.rain as number) ? Math.max(0, Math.min(1, spec.rain as number)) : 0,
    falloff: Number.isFinite(spec.falloff as number) ? (spec.falloff as number) : 0.6,
    speed: Number.isFinite(spec.speed as number) ? (spec.speed as number) : BASE_CLOUD_SPEED,
    color: spec.color ?? [
      (cloudBaseColor.value as Vector3).x,
      (cloudBaseColor.value as Vector3).y,
      (cloudBaseColor.value as Vector3).z,
    ],
  });
  rebuildAll();
  repack();
  return id;
}

export function removeCloudRegion(id: string): void {
  if (_byId.delete(id)) {
    rebuildAll();
    repack();
  }
}

export function setCloudRegionPlayer(x: number, z: number): void {
  _playerX = x;
  _playerZ = z;
  if (_all.length <= MAX_CLOUD_REGIONS) return;
  const dx = x - _lastRepackX;
  const dz = z - _lastRepackZ;
  if (dx * dx + dz * dz > 100) repack();
}

export interface WeatherSample {
  /** Blended cloud density 0..1 at the point. */
  density: number;
  /** Blended overcast factor 0..1. */
  coverage: number;
  /** Blended cloud colour RGB 0..1. */
  color: [number, number, number];
  /** Rain intensity 0..1 (0 in fair weather). */
  rain: number;
  /** Blended cloud drift speed (the region's `speed`, or the global default
   *  outside every region). Documented as queryable since this module shipped
   *  but missing from the sample until now. */
  speed: number;
  /** Convenience: rain > 0.4. */
  isStorm: boolean;
}

const smoothstep = (e0: number, e1: number, x: number): number => {
  if (e0 === e1) return x < e0 ? 0 : 1;
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * Pure-JS read of the same region set the shaders use — strongest-region wins,
 * blended over the base by its influence (matches the shader's winner-takes-max
 * Loop). Drives `XRPublisher.getWeatherAt(x, z)` for plugins (rain, events).
 */
export function sampleWeatherAt(x: number, z: number): WeatherSample {
  const baseDensity = cloudBaseDensity.value;
  const baseCoverage = cloudBaseCoverage.value;
  const baseColor: [number, number, number] = [
    (cloudBaseColor.value as Vector3).x,
    (cloudBaseColor.value as Vector3).y,
    (cloudBaseColor.value as Vector3).z,
  ];
  let winMask = 0;
  let win: CloudRegionData | null = null;
  for (const r of _all) {
    const d = Math.hypot(x - r.x, z - r.z);
    const dn = d / Math.max(0.001, r.radius);
    // smoothstep(1.0, falloff, dn): 1 inside falloff, 0 beyond radius.
    const m = smoothstep(1.0, r.falloff, dn);
    if (m > winMask) { winMask = m; win = r; }
  }
  if (!win) {
    return {
      density: baseDensity, coverage: baseCoverage, color: baseColor,
      rain: 0, speed: BASE_CLOUD_SPEED, isStorm: false,
    };
  }
  const lerp = (a: number, b: number) => a + (b - a) * winMask;
  const density = lerp(baseDensity, win.density);
  const coverage = lerp(baseCoverage, win.coverage);
  const color: [number, number, number] = [
    lerp(baseColor[0], win.color[0]),
    lerp(baseColor[1], win.color[1]),
    lerp(baseColor[2], win.color[2]),
  ];
  const rain = win.rain * winMask;
  const speed = lerp(BASE_CLOUD_SPEED, win.speed);
  return { density, coverage, color, rain, speed, isStorm: rain > 0.4 };
}
