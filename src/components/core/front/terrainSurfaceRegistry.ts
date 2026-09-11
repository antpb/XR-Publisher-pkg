/**
 * Terrain surface registry — pluggable procedural materials for terrain
 * REGIONS (see regionMaterialUniforms.ts for the "area outward from a centre"
 * placement). A surface is a TSL node factory that, given a world position +
 * per-region params + tint, returns `vec4(color.rgb, roughness)`. The shared
 * terrain material composites every REGISTERED surface into its ONE compiled
 * node graph (a switch on the region's surface index), so plugins can ship
 * their own procedural ground (cobblestone, brick, mosaic…) and have it blended
 * into a circle of terrain.
 *
 * Compile-once contract: the shared terrain material is built once and reused by
 * every chunk. Surfaces registered BEFORE the material first builds cost
 * nothing. A surface registered AFTER (late plugin init) bumps `version`, which
 * ProceduralTerrain watches (useSyncExternalStore) to dispose + rebuild the
 * shared material once. Register surfaces at plugin init to avoid the rebuild.
 *
 * WebGL twin asymmetry: TSL can't be compiled to GLSL for arbitrary user code,
 * so the WebGL terrain twin renders the BUILT-IN 'cobblestone' surface
 * procedurally (shared GLSL below) and falls back to each surface's flat
 * `fallbackColor` (the region tint) for custom TSL surfaces. WebGPU is the
 * full-fidelity path.
 */
import {
  Fn, vec2, vec3, vec4, float, floor, fract, sin, dot, length, min, mix, select, smoothstep, Loop,
} from 'three/tsl';

/** Context a surface TSL factory receives. All are TSL nodes. */
export interface TerrainSurfaceContext {
  /** World position node (positionWorld). Use `.x`/`.z` for the ground plane.
   *  WARNING: at large world coordinates (towns can be 10k+ units out) f32
   *  precision destroys `fract(sin(dot(worldPos,…)))`-style hashes — the pattern
   *  degrades to flat noise. Prefer `localXZ` for any noise/cell pattern. */
  worldPos: any;
  /** Region-LOCAL ground position (vec2): worldPos.xz − region centre. Stays
   *  small (≈ ±radius) regardless of how far the region is from the origin, so
   *  procedural hashes stay precise. Use THIS for cobblestone/Worley/etc. */
  localXZ: any;
  /** Per-region params node: vec3(surfaceIndex, scale, p2). `.y` = feature
   *  scale (cells per unit), `.z` = a second tunable (mortar width, etc.). */
  params: any;
  /** Per-region tint node: vec3 RGB multiplier (default white). */
  tint: any;
}

export interface TerrainSurfaceDef {
  /** Unique id; regions reference it by name. Built-in: 'cobblestone'. */
  id: string;
  /** TSL factory → `vec4(color.rgb, roughness)`. */
  tsl: (ctx: TerrainSurfaceContext) => any;
  /** Flat RGB used by the WebGL twin (which can't run custom TSL) and as a
   *  safety fallback. Defaults to a mid grey. */
  fallbackColor?: [number, number, number];
}

const _surfaces: TerrainSurfaceDef[] = [];
const _indexById = new Map<string, number>();
const _listeners = new Set<() => void>();
let _version = 0;

export function registerTerrainSurface(def: TerrainSurfaceDef): void {
  if (!def || typeof def.id !== 'string' || typeof def.tsl !== 'function') {
    console.warn('[XRPublisher] registerTerrainSurface: need { id, tsl }');
    return;
  }
  const existing = _indexById.get(def.id);
  if (existing !== undefined) {
    _surfaces[existing] = def;          // replace in place (keeps its index)
  } else {
    _indexById.set(def.id, _surfaces.length);
    _surfaces.push(def);
  }
  _version++;
  _listeners.forEach((l) => l());
}

/** Stable integer index for a surface id (regions store this in a uniform).
 *  Unknown id → 0 (the built-in cobblestone). */
export function surfaceIndexOf(id: string | undefined): number {
  if (!id) return 0;
  return _indexById.get(id) ?? 0;
}

export function getTerrainSurfaces(): TerrainSurfaceDef[] {
  return _surfaces;
}

/** A registered surface's flat `fallbackColor`, or null when the id is
 *  unknown / has none. Used to give a region using a custom surface the same
 *  flat colour on BOTH renderers (see addRegionMaterial). */
export function surfaceFallbackColor(id: string | undefined): [number, number, number] | null {
  if (!id) return null;
  const idx = _indexById.get(id);
  if (idx === undefined) return null;
  const fc = _surfaces[idx]?.fallbackColor;
  return fc ? [fc[0], fc[1], fc[2]] : null;
}

export function getTerrainSurfacesVersion(): number {
  return _version;
}

export function subscribeTerrainSurfaces(cb: () => void): () => void {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

// ── Built-in: cobblestone (Worley / cellular) ───────────────────────────────
// Worley F1/F2: stones are cells, the dark mortar is the seam where two cells
// meet (F2 − F1 → 0). Per-cell hash drives stone-to-stone colour variation.
const hash2: any = Fn(([p]: any) => fract(
  sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))).mul(43758.5453),
));
const hash1: any = Fn(([p]: any) => fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453)));

function cobblestoneTSL(ctx: TerrainSurfaceContext): any {
  const { localXZ, params, tint } = ctx;
  return Fn(() => {
    const scale = params.y.max(float(0.001));
    const mortar = params.z.max(float(0.001));
    // Region-LOCAL coords (small) so the Worley hash stays precise even when the
    // town is 10k+ units from the origin.
    const uv = localXZ.mul(scale);
    const i = floor(uv).toVar();
    const f = fract(uv).toVar();

    const f1 = float(9).toVar();   // nearest feature distance
    const f2 = float(9).toVar();   // second-nearest
    const cellId = vec2(0).toVar();

    Loop({ start: -1, end: 2, type: 'int' }, ({ i: x }: any) => {
      Loop({ start: -1, end: 2, type: 'int' }, ({ i: y }: any) => {
        const g = vec2(float(x), float(y));
        const o = hash2(i.add(g));
        const r = g.add(o).sub(f);
        const d = length(r);
        // BRANCHLESS F1/F2 — the TSL idiom (assign(select/min)); an If/ElseIf
        // chain here did NOT update f2, leaving f2==f1 → mortar everywhere (black).
        const dLtF1 = d.lessThan(f1);
        f2.assign(select(dLtF1, f1, min(f2, d)));   // displaced nearest, or new 2nd
        cellId.assign(select(dLtF1, i.add(g), cellId));
        f1.assign(min(f1, d));
      });
    });

    const cellRand = hash1(cellId);
    const stone = vec3(0.52, 0.49, 0.45).mul(float(0.78).add(cellRand.mul(0.42))).mul(tint);
    const mortarCol = vec3(0.12, 0.11, 0.10);
    const stoneMask = smoothstep(float(0), mortar, f2.sub(f1));   // 0 seam → 1 stone
    const col = mix(mortarCol, stone, stoneMask);
    const rough = mix(float(0.95), float(0.55), stoneMask);       // mortar rough, stone smoother
    return vec4(col, rough);
  })();
}

registerTerrainSurface({ id: 'cobblestone', tsl: cobblestoneTSL, fallbackColor: [0.42, 0.40, 0.37] });

/** GLSL twin of the built-in cobblestone (surface index 0) for the WebGL
 *  terrain. Defines `xrpCobblestone(vec2 wp, float scale, float mortar, vec3
 *  tint) → vec3`. Custom (non-built-in) surfaces render as flat tint on WebGL. */
export const COBBLESTONE_GLSL = /* glsl */`
  vec2 xrpHash2(vec2 p){ return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453); }
  float xrpHash1(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  vec3 xrpCobblestone(vec2 wp, float scale, float mortar, vec3 tint){
    vec2 uv = wp * max(scale, 0.001);
    vec2 i = floor(uv); vec2 f = fract(uv);
    float f1 = 9.0, f2 = 9.0; vec2 cell = vec2(0.0);
    for (int x=-1;x<=1;x++) for (int y=-1;y<=1;y++){
      vec2 g = vec2(float(x), float(y));
      vec2 o = xrpHash2(i+g);
      vec2 r = g + o - f; float d = length(r);
      if (d < f1){ f2 = f1; f1 = d; cell = i+g; } else if (d < f2){ f2 = d; }
    }
    float cr = xrpHash1(cell);
    vec3 stone = vec3(0.52,0.49,0.45) * (0.78 + cr*0.42) * tint;
    vec3 mortarCol = vec3(0.11,0.10,0.09);
    float sm = smoothstep(0.0, max(mortar,0.001), f2 - f1);
    return mix(mortarCol, stone, sm);
  }
`;
