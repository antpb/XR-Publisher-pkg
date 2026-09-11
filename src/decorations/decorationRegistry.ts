/**
 * Plugin decoration registry.
 *
 * Plugins register "decorations" — generative, static, or dynamic
 * objects that the procedural terrain scatters across chunks. Placement
 * is fully deterministic: it derives from the world seed + chunk
 * coordinates + the decoration's name, so a registered decoration
 * always appears in the same spots every time a user returns to a
 * space (and on every renderer/device — spawns are computed from the
 * chunk heightfield + spawn arrays, which come out of the terrain
 * worker bit-identical across the WASM/JS paths).
 *
 * Public API (also exposed as `XRPublisher.registerDecoration` and on
 * `window.XRPublisher` for script-tag plugins):
 *
 * ```js
 * XRPublisher.registerDecoration({
 *   name: 'village-hut',
 *   density: 0.5,                  // expected spawns per 100×100u chunk
 *   biomes: ['buildable'],         // the flat town-land biome
 *   maxSlope: 0.15,                // rise/run — target flat ground
 *   minWaterDistance: 8,           // units of dry ground required
 *   minSpacing: 25,
 *   collision: true,               // solid — auto cuboid colliders
 *   create(spawn) {
 *     // spawn.rng is a per-spawn seeded PRNG — use it (never
 *     // Math.random) for generative variation that must be stable.
 *     // spawn also carries context: slope, waterDistance, biome,
 *     // treeDistance, boulderDistance.
 *     return buildHut(spawn.rng);  // position applied by the engine
 *   },
 * });
 * ```
 *
 * Contracts for plugin authors (documented, not enforced):
 *  - `create` runs on the main thread once per spawn when a chunk loads
 *    near the player; keep it cheap and reuse geometries/materials
 *    across spawns (module-level singletons) like the built-ins do.
 *    For seed-stable generative meshes use `spawn.rng` and the noise
 *    primitives on `XRPublisher.utils` (alea / createNoise2D /
 *    createNoise3D — the same ones the engine's terrain and mountains
 *    are built from).
 *  - `update` runs every frame for every live spawned object — budget
 *    accordingly. Don't move an object that has `collision` set: the
 *    collider is fixed and will not follow.
 *  - Default cleanup disposes GEOMETRIES of the returned object tree but
 *    not materials (you may share them across spawns); provide `dispose`
 *    to override.
 *  - `collision: true` ⇒ one cuboid per mesh (cheap, right for
 *    houses/buildings). `'hull'` and `'trimesh'` are accepted for
 *    precise shapes — trimesh cooks synchronously on the main thread at
 *    chunk mount, so use it sparingly. Colliders obey the same
 *    altitude/flying gate as terrain and tree colliders.
 */
import type { Object3D } from 'three';
import { alea } from 'seedrandom';
import { getBiomeAt } from '../components/core/front/biomeHelpers';
import { getMountainsNearChunk, getMountainSurfaceLocalY } from '../components/core/front/worldHelpers';
import { classifySurface, toSurfaceSet, type SurfaceType } from './surfaceClassify';

export type { SurfaceType } from './surfaceClassify';

export type DecorationCollision = boolean | 'cuboid' | 'hull' | 'trimesh';

/** Where a decoration's spawns are anchored:
 *  - 'terrain'   (default) — scattered over the chunk heightfield grid.
 *  - 'tree'      — hung on the canopy underside of engine trees.
 *  - 'tree-base' — at the trunk base, where the tree meets the terrain
 *                  (one anchor per tree; scatter a cluster within
 *                  `spawn.anchorRadius` using `spawn.rng`). Mushrooms,
 *                  roots, ground litter ringing the trunk.
 *  - 'mountain'  — placed on the summit of mountains peaking in the chunk. */
export type DecorationAnchor = 'terrain' | 'tree' | 'tree-base' | 'mountain';

/** Per-instance transform variance for instanced decorations. */
export interface DecorationInstanceTransform {
  /** Yaw in radians (default 0). */
  rotationY?: number;
  /** Uniform scale multiplier (default 1). */
  scale?: number;
  /** Random lean off vertical in radians (default 0). */
  tilt?: number;
}

/** Passed to a spec's `onInteract` when the player interacts with one spawn. */
export interface DecorationInteractionContext {
  /** The interacted spawn's Object3D (as returned by `create`). */
  object: Object3D;
  /** That spawn's data (position, seed, rng, …). */
  spawn: DecorationSpawn;
  /** Despawn this object (hide + unregister its interactable). For
   *  collectibles. NOTE: spawns are deterministic, so a removed object
   *  reappears when the chunk reloads unless the plugin tracks collected
   *  `spawn.seed`s and returns null from `create` for them. */
  remove: () => void;
}

/** "Dirt-surrounded" ground patch painted around a decoration. */
export interface DecorationGroundPatch {
  /** Patch radius in world units. */
  radius: number;
  /** Dirt colour [r,g,b] 0..1 (defaults to a neutral brown). */
  color?: [number, number, number];
  /** Clear engine grass out of the circle (default true). */
  clearGrass?: boolean;
}

export interface DecorationSpawn {
  /** Chunk-local position [x, y, z] — already applied to the object. */
  position: [number, number, number];
  /** World-space X/Z of the spawn; Y is the raw terrain-height sample
   *  (the terrain block's own vertical offset is not included).
   *  ⚠ FRAME GOTCHA: for terrain/tree anchors this is the WORKER frame —
   *  ½ chunk higher on both axes than the render frame the rest of the
   *  runtime uses (getPlayerState, addTerrainRegion, addPath, worldState
   *  positions). Mountain anchors were always render-frame. Kept as-is for
   *  back-compat; new code should use `renderPosition` instead. */
  worldPosition: [number, number, number];
  /** World-space position in the RENDER frame — the same frame as
   *  `getPlayerState()`/`getPeers()`, `addTerrainRegion`/`addPath` centers,
   *  and `setWorldState`'s `pos`. Use THIS (not `worldPosition`) whenever a
   *  spawn coordinate leaves the decoration system; it removes the hand-
   *  applied `[wx - chunkW/2, wz - chunkH/2]` shift every stateful plugin
   *  used to need. Y carries the same terrain-sample semantics as
   *  `worldPosition[1]`. Identical across anchor types. */
  renderPosition: [number, number, number];
  /** Normalized terrain height 0..1 at the spawn (water below ~0.48). */
  normalizedHeight: number;
  /** Terrain steepness at the spawn as rise/run (0 = flat, ~0.5 = a
   *  steep hillside). Computed from the heightfield gradient. */
  slope: number;
  /** Distance in units to the nearest water surface, capped at
   *  WATER_SCAN_RADIUS (within-chunk knowledge only). */
  waterDistance: number;
  /** Unit XZ vector pointing from the spawn toward that nearest water — i.e.
   *  WHICH WAY the shore faces. null when no water was found inside the scan
   *  (or on anchored spawns). Pair with `waterDistance` to place something
   *  ON the water from a dry spawn: `[x + dir[0] * (waterDistance + k), …,
   *  z + dir[1] * (waterDistance + k)]` in the spawn's local frame. */
  waterDirection: [number, number] | null;
  /** Biome id at the spawn: 'plains' | 'mountains' | 'wetlands' |
   *  'buildable' | 'default'. 'buildable' is the deliberately-flat
   *  town-land biome — the natural target for structures. */
  biome: string;
  /** Distance to the nearest engine tree spawn in this chunk
   *  (Infinity if none). */
  treeDistance: number;
  /** Distance to the nearest engine boulder spawn in this chunk
   *  (Infinity if none). */
  boulderDistance: number;
  /** Coarse surface type at the spawn: 'water' | 'sand' | 'grass' |
   *  'dirt' | 'rock' | 'snow'. Matches the colour bands the terrain
   *  actually paints — for TERRAIN-grid spawns.
   *
   *  ANCHORED spawns ('tree' / 'tree-base' / 'mountain') do NOT sample the
   *  heightfield: `surface`, `biome`, `slope`, `waterDistance` and
   *  `normalizedHeight` are FIXED PLACEHOLDERS on those paths ('grass' /
   *  'default' / 0 / max-scan / 0.55 for tree anchors; 'rock' / 'mountains'
   *  for mountain anchors). Don't branch on them for anchored specs, and
   *  don't set surface/biome/slope/water filters on an anchored spec —
   *  they'd filter against the placeholder, not the ground. */
  surface: SurfaceType;
  /** Local Y (same frame as position[1]) of the water surface. Lets a
   *  water creature place itself between the lakebed (position[1], which
   *  the engine adds) and the surface: offset its object up by some
   *  fraction of `(waterLevel - position[1])`. */
  waterLevel: number;
  /** For 'tree'/'mountain' anchors: the anchor's own radius — the canopy
   *  blob / summit-ring radius, i.e. the same value as `anchorRadius`, NOT
   *  the tree's scale factor (undefined for terrain anchors). */
  anchorScale?: number;
  /** For 'tree'/'mountain' anchors: a usable scatter radius around the
   *  anchor point (canopy radius / summit radius). */
  anchorRadius?: number;
  /** Local ground height at an offset (dx, dz) from the spawn point,
   *  RELATIVE to the created object's origin plane (its local y=0).
   *  Bilinear over the chunk heightfield; clamps at chunk borders. Use it
   *  to seat every part of a multi-point structure (fence posts, crop
   *  rows, gate) on the real ground instead of the spawn-centre plane —
   *  on sloped terrain a flat build floats on one side and buries on the
   *  other. Terrain-grid spawns only (absent on tree/mountain anchors). */
  groundHeightAt?: (dx: number, dz: number) => number;
  /** Per-spawn deterministic PRNG (alea) — same sequence every visit. */
  rng: () => number;
  /** The per-spawn seed string feeding `rng`, for plugin-side use
   *  (e.g. seeding XRPublisher.utils.createNoise3D). Also the natural KEY for
   *  persisted world state. Shape is
   *  `{worldSeed}-decoration-{name}-{chunkX}-{chunkZ}-{gx}-{gz}` — note TWO
   *  trailing grid coords, and that negative chunk coords produce double
   *  dashes (`…-decoration-foo--3--2-16-8`). Don't slice it by hand; use
   *  `chunkPrefix`. */
  seed: string;
  /** The `fetchWorldState({ prefix })` prefix that matches EVERY spawn of this
   *  decoration in this chunk — i.e. `seed` minus the two grid coords. This is
   *  what makes the per-chunk fetch coalescing work: all spawns in a chunk
   *  issue the SAME query, so they share one HTTP request. Absent on
   *  tree/mountain anchors, whose seeds carry no chunk coords. */
  chunkPrefix?: string;
  /** Spawn index within this chunk for this decoration. */
  index: number;
  chunkX: number;
  chunkZ: number;
}

export interface DecorationSpec {
  /** Unique name — also part of the placement seed. Renaming a
   *  decoration relocates every instance of it. */
  name: string;
  /** Expected spawn count per chunk (default 1). Fractional values are
   *  fine — 0.25 ≈ one spawn every 4th chunk. */
  density?: number;
  /** Normalized terrain band, default [0.485, 0.62] (above waterline,
   *  below the rocky slopes). */
  minHeight?: number;
  maxHeight?: number;
  /** Maximum terrain steepness (rise/run) to accept. ~0.15 targets the
   *  flat buildable spots; omit for no constraint. */
  maxSlope?: number;
  /** Required dry distance from water in units (capped by the
   *  within-chunk scan radius of 24u). */
  minWaterDistance?: number;
  /** Maximum distance from water in units — e.g. {surface:'grass',
   *  maxWaterDistance:8} for "grass near the water". */
  maxWaterDistance?: number;
  /** Restrict spawning to these surface types (e.g. 'grass', ['dirt'],
   *  ['rock','snow']). 'water' lets a spec place below the waterline
   *  (the default height floor is dropped for water specs). */
  surface?: SurfaceType | SurfaceType[];
  /** Where spawns anchor: 'terrain' (default, ground grid), 'tree' (canopy
   *  underside), 'tree-base' (trunk/terrain contact), or 'mountain' (summit).
   *  - 'tree': the anchor sits on the canopy UNDERSIDE (lower-hemisphere
   *    surface); the spawn's local origin (y=0) is the leaf attachment point —
   *    build the object HANGING DOWNWARD (negative local Y) so it dangles.
   *  - 'tree-base': one anchor per tree at the trunk's ground contact (local
   *    y=0 is the terrain). `spawn.anchorRadius` is a ring just outside the
   *    trunk — scatter a cluster (mushrooms, roots) into it with `spawn.rng`. */
  anchor?: DecorationAnchor;
  /** For water spawns, where the engine seats the object's origin:
   *   - 'floor'     (default) — on the lakebed/seabed.
   *   - 'submerged' — in the water column (clearly under the surface).
   *   - 'surface'   — exactly at the water surface (floating items).
   *  Only applies to spawns below the waterline; ignored elsewhere. Use
   *  this instead of hand-computing depth from `spawn.waterLevel` — the
   *  engine places the object so it survives a per-frame `update()`. */
  waterPlacement?: 'floor' | 'submerged' | 'surface';
  /** Restrict spawning to these biome ids (e.g. ['buildable']). */
  biomes?: string[];
  /** Minimum distance in units between spawns of this decoration within
   *  a chunk (default 0 = no constraint).
   *
   *  NOTE this is the one filter that is ORDER-DEPENDENT: spacing is tested
   *  against the spawns already accepted in this chunk, so removing an early
   *  spawn (by tightening another filter) can re-admit a later neighbour that
   *  it used to crowd out. The usual "a filter only moves the spawns it
   *  filters" rule doesn't hold across a `minSpacing` change. */
  minSpacing?: number;
  /** Avoid engine ROADS — spawns landing on a baked road are dropped (default
   *  true). Set false for road-side props you WANT on the road (lamp posts,
   *  signs, cobbles). No effect when world roads are off. */
  avoidRoads?: boolean;
  /** Render every spawn as ONE shared geometry via THREE.InstancedMesh
   *  (cheap for dense models). Only valid for STATIC specs (no `update`);
   *  `create()` is called once for the template and per-instance variance
   *  comes from `transform(spawn)`. Ignored (with a console warn) if combined
   *  with `update` or `interactable` — both need per-object mounts.
   *
   *  Collision on an instanced spec is always a per-instance CUBOID sized
   *  from the template's bounding box (the `'hull'`/`'trimesh'` modes apply
   *  to per-object specs only). */
  instanced?: boolean;
  /** Per-instance transform for instanced specs (rotationY/scale/tilt).
   *  Use spawn.rng for seed-stable variation. */
  transform?: (spawn: DecorationSpawn) => DecorationInstanceTransform;
  /** Paint a dirt clearing on the terrain around each spawn (campfire,
   *  shrine, …) and clear grass out of it. For per-object specs (solid /
   *  dynamic / custom-dispose) the patch registers ONLY for spawns whose
   *  `create()` returned an object — a gated create() (return null away
   *  from a town, etc.) leaves no orphan dirt circles. Instanced/merged
   *  specs register a patch per spawn. */
  groundPatch?: DecorationGroundPatch;
  /** Make spawns solid. `true` = 'cuboid' (one box collider per mesh —
   *  cheap, right for buildings). 'hull'/'trimesh' for precise shapes
   *  (trimesh cooks synchronously at mount — use sparingly).
   *
   *  EXPLICIT COLLIDERS: if the object returned by `create()` carries
   *  `userData.xrColliders = [{ half:[hx,hy,hz], position:[x,y,z],
   *  rotation?:[rx,ry,rz] }]` (object-local frame, THREE 'XYZ' euler),
   *  those cuboids are mounted INSTEAD of auto-colliders. This is the
   *  efficient path for walk-in structures: merge all visual geometry
   *  into a few meshes (one per material) and author the wall/floor
   *  colliders by hand — auto-cuboid would wrap the merged mesh in one
   *  giant impassable box. NOTE: if you rotate the returned root object,
   *  bake that rotation into the collider positions/rotations yourself
   *  (colliders mount beside the object, not inside it). */
  collision?: DecorationCollision;
  /** Make each spawn "E to interact"-able. When the player is within
   *  `interactionRadius` the engine shows a "Press E" prompt; pressing E
   *  fires `onInteract` for that specific spawn. Interactable specs always
   *  mount per-object (each spawn is individually targetable/removable), so
   *  they're incompatible with `instanced`. */
  interactable?: boolean;
  /** Prompt shown in the interact banner (e.g. "collect apple"). A FUNCTION
   *  receives the spawn and is re-resolved ~10Hz while the player is near —
   *  stateful decorations show contextual actions ("Water crops" → "Harvest")
   *  without re-registering. Keep it cheap. */
  interactionPrompt?: string | ((spawn: DecorationSpawn) => string);
  /** Interact radius in world units (default 4). */
  interactionRadius?: number;
  /** Fired when the player interacts with a spawn of this spec. `ctx.object`
   *  is that spawn's Object3D, `ctx.spawn` its spawn data, and `ctx.remove()`
   *  despawns it (for collectibles). Throws are contained. */
  onInteract?: (ctx: DecorationInteractionContext) => void;
  /** Build the object for one spawn. Return null to skip the spawn.
   *  The engine positions the object; do not set position yourself
   *  unless you want an offset from the terrain point. */
  create: (spawn: DecorationSpawn) => Object3D | null;
  /** Optional per-frame hook — providing it makes the object dynamic
   *  (its matrix is kept auto-updating). */
  update?: (object: Object3D, delta: number, elapsed: number) => void;
  /** Optional custom cleanup when the chunk unloads. */
  dispose?: (object: Object3D) => void;
  /** "I animate this object MYSELF" — from a plugin-owned interval/rAF rather
   *  than `update`, which is often the better shape (self-starting,
   *  self-clearing, zero engine cost when nothing is near).
   *
   *  Set it, or the engine will quietly defeat you twice: a spec with no
   *  `update` gets its matrices FROZEN (`matrixAutoUpdate = false`, so your
   *  writes to `position`/`rotation` never reach the screen), and a static,
   *  non-solid, non-interactable spec is MERGED — which clones the geometry
   *  and disposes the object `create()` returned, leaving your ticker
   *  animating a discarded Object3D. `animated: true` forces the per-object
   *  mount path and skips the freeze.
   *
   *  For a mostly-static object with one moving part, leave this off and mark
   *  just that child with `userData.xrAnimated = true` (the freeze walk skips
   *  it and its subtree) — but only on a spec that isn't merged. */
  animated?: boolean;
  /** LARGE / CROSS-CELL structures (race courses, golf holes, big builds).
   *  Normally a decoration is parented to the terrain chunk that spawned it
   *  and is DISPOSED the moment that chunk streams out — which tears a course
   *  down mid-run once the player walks a couple of chunks from its origin.
   *  With `persist: true` the engine instead mounts the `create()` object at
   *  SCENE scale (world position = `spawn.renderPosition`) and keeps it alive
   *  until the player moves beyond `keepAliveRadius` of the spawn — NOT when
   *  the origin chunk unloads. Re-entry re-runs `create()` from the same seed.
   *  The object is deduped by seed (create() is not called again while it's
   *  still alive). `dispose()` fires on eviction (player left the radius), not
   *  on chunk unload. Interactables still (re)register per chunk load.
   *  Incompatible with `instanced`; colliders are not auto-added to persistent
   *  objects (use `XRPublisher.addSolid` for a persistent collidable). */
  persist?: boolean;
  /** World-unit radius around the spawn within which a `persist` decoration
   *  stays mounted. Default: the created object's bounding radius × 1.35,
   *  clamped to [140, 2000]. Set this to your structure's extent (e.g. a race
   *  course's length) so it never vanishes while the player is still inside. */
  keepAliveRadius?: number;
}

const _specs = new Map<string, DecorationSpec>();
/** Specs already warned about an over-large minSpacing (once per name, not
 *  once per chunk — this runs for every chunk the player streams). */
const _warnedSpacing = new Set<string>();
const _listeners = new Set<() => void>();
let _version = 0;

export function registerDecoration(spec: DecorationSpec): void {
  if (!spec || typeof spec.name !== 'string' || spec.name.length === 0
    || typeof spec.create !== 'function') {
    console.warn('[XRPublisher] registerDecoration: spec must have at least { name, create }');
    return;
  }
  _specs.set(spec.name, spec);
  _version++;
  _listeners.forEach((l) => l());
}

export function unregisterDecoration(name: string): void {
  if (_specs.delete(name)) {
    _version++;
    _listeners.forEach((l) => l());
  }
}

export function getDecorationSpecs(): DecorationSpec[] {
  return Array.from(_specs.values());
}

/** Monotonic counter — bumps on every register/unregister. Used by
 *  chunk components (useSyncExternalStore) to re-scatter live chunks
 *  when a plugin registers after the world has loaded. */
export function getDecorationVersion(): number {
  return _version;
}

export function subscribeDecorations(listener: () => void): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

/** Engine spawn arrays handed in by the terrain chunk so plugin spawns
 *  can know what's around them. Both are 7 floats per entry
 *  [x, y, z, scale, rot…] in chunk-local space. */
export interface ChunkNeighborData {
  treeSpawns?: Float32Array | null;
  boulderSpawns?: Float32Array | null;
  /** Per-tree collider metadata (TREE_COLLIDER_STRIDE floats/tree: trunk
   *  capsule + up to 4 canopy blob spheres, chunk-local). Lets 'tree'
   *  anchors attach to real leaf-blob surfaces. */
  treeColliders?: Float32Array | null;
}

// treeColliders layout (chunk-local), per tree:
//  [0..2] trunk base xyz, [3] half-height, [4] radius, [5] blob count n,
//  [6..21] n × (centerX, centerY, centerZ, radius).
const TREE_COLLIDER_STRIDE = 22;
const TREE_COLLIDER_BLOB_BASE = 6;

/** Within-chunk water scan cap, units. */
export const WATER_SCAN_RADIUS = 24;

const SPAWN_STRIDE = 7;

function nearestSpawnDistance(
  spawns: Float32Array | null | undefined,
  x: number,
  z: number,
): number {
  if (!spawns || spawns.length < SPAWN_STRIDE) return Infinity;
  let best = Infinity;
  for (let o = 0; o + 2 < spawns.length; o += SPAWN_STRIDE) {
    const dx = spawns[o] - x;
    const dz = spawns[o + 2] - z;
    const d2 = dx * dx + dz * dz;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}

/**
 * Compute the deterministic spawn list for one decoration on one chunk.
 *
 * Walks a coarse grid over the chunk's heightfield. Determinism rules:
 *  - The accept/reject draw for each candidate cell comes from ONE
 *    chunk-level stream that is advanced exactly once per cell, so the
 *    accept pattern depends only on (world seed, decoration name, chunk
 *    coords) — never on how filters interact with draw order.
 *  - Jitter and the per-spawn PRNG are seeded per CELL (not by stream
 *    position or spawn index), so changing a filter param moves only
 *    the spawns it filters — everything else stays put.
 */
export function computeDecorationSpawns(
  spec: DecorationSpec,
  seed: string,
  chunkX: number,
  chunkZ: number,
  width: number,
  height: number,
  heightScale: number,
  segments: number,
  heightData: Float32Array,
  neighbors?: ChunkNeighborData,
  /** Per-vertex baked road strength (0..1) for this chunk. Spawns landing on a
   *  road are dropped unless the spec sets `avoidRoads: false`. */
  roadStrength?: Float32Array,
): DecorationSpawn[] {
  if (!heightData || heightData.length === 0) return [];

  const density = spec.density ?? 1;
  if (density <= 0) return [];

  const surfaceSet = toSurfaceSet(spec.surface);
  const wantsWater = surfaceSet?.has('water') ?? false;
  // Local water-surface Y in the same frame as a spawn's position[1]
  // (matches InfiniteTerrain's `mapRange(0.48,0,1,-heightScale,heightScale)`).
  const waterLevel = (0.48 * 2 - 1) * heightScale;

  // Anchored placement modes don't walk the terrain grid.
  if (spec.anchor === 'tree') {
    return computeTreeAnchorSpawns(spec, seed, chunkX, chunkZ, width, height, neighbors, waterLevel, 'canopy');
  }
  if (spec.anchor === 'tree-base') {
    return computeTreeAnchorSpawns(spec, seed, chunkX, chunkZ, width, height, neighbors, waterLevel, 'base');
  }
  if (spec.anchor === 'mountain') {
    return computeMountainAnchorSpawns(spec, seed, chunkX, chunkZ, width, height, waterLevel);
  }

  // Water specs may sit below the normal above-waterline floor.
  const minHeight = spec.minHeight ?? (wantsWater ? 0 : 0.485);
  const maxHeight = spec.maxHeight ?? (wantsWater ? 1 : 0.62);
  const minSpacing = spec.minSpacing ?? 0;
  const minSpacingSq = minSpacing * minSpacing;
  // Spacing is enforced WITHIN a chunk only, so a value at/over the chunk size
  // reads as a world-wide guarantee it can't make: two spawns in adjacent
  // chunks may still land metres apart. Warned once per spec — authors keep
  // setting 200+ on 100u chunks and then building logic on the assumption.
  if (minSpacing >= Math.min(width, height) && !_warnedSpacing.has(spec.name)) {
    _warnedSpacing.add(spec.name);
    console.warn(
      `[XRPublisher] decoration "${spec.name}": minSpacing ${minSpacing} is >= the terrain chunk size ` +
      `(${width}×${height}). Spacing is only enforced between spawns in the SAME chunk, so this does ` +
      `not prevent two spawns in neighbouring chunks landing close together — lower the density instead.`,
    );
  }
  const maxSlope = spec.maxSlope ?? Infinity;
  const minWaterDistance = spec.minWaterDistance ?? 0;
  const maxWaterDistance = spec.maxWaterDistance ?? Infinity;

  const baseSeed = `${seed}-decoration-${spec.name}-${chunkX}-${chunkZ}`;
  const acceptRng = alea(baseSeed);

  // Avoid engine roads (baked per-vertex roadStrength) unless the spec opts out.
  // roadStrength is 1 at the road centre, fading to 0 at the road edge; > 0.1
  // ≈ within the full road width.
  const avoidRoads = spec.avoidRoads !== false && !!roadStrength && roadStrength.length > 0;

  const verticesPerSide = segments + 1;
  const step = 4;
  const cellsPerSide = Math.floor(segments / step) + 1;
  const chance = density / (cellsPerSide * cellsPerSide);
  const unitsPerVertex = width / segments;
  const cellSize = unitsPerVertex * step;

  const normHeightAt = (gx: number, gz: number): number => {
    const cgx = Math.max(0, Math.min(segments, gx));
    const cgz = Math.max(0, Math.min(segments, gz));
    const vy = heightData[(cgz * verticesPerSide + cgx) * 3 + 1];
    return (vy + heightScale) / (heightScale * 2);
  };

  // Bilinear ground-height sample at an arbitrary chunk-local (x, z) —
  // powers spawn.groundHeightAt so plugins can seat multi-point structures
  // on real ground. Clamps at the chunk border.
  const unitsPerVertexZ = height / segments;
  const sampleGroundY = (lx: number, lz: number): number => {
    const fx = (lx + width / 2) / unitsPerVertex;
    const fz = (lz + height / 2) / unitsPerVertexZ;
    const gx0 = Math.max(0, Math.min(segments - 1, Math.floor(fx)));
    const gz0 = Math.max(0, Math.min(segments - 1, Math.floor(fz)));
    const tx = Math.max(0, Math.min(1, fx - gx0));
    const tz = Math.max(0, Math.min(1, fz - gz0));
    const yAt = (gx: number, gz: number) => heightData[(gz * verticesPerSide + gx) * 3 + 1];
    const y00 = yAt(gx0, gz0);
    const y10 = yAt(gx0 + 1, gz0);
    const y01 = yAt(gx0, gz0 + 1);
    const y11 = yAt(gx0 + 1, gz0 + 1);
    return (y00 * (1 - tx) + y10 * tx) * (1 - tz) + (y01 * (1 - tx) + y11 * tx) * tz;
  };

  const spawns: DecorationSpawn[] = [];

  for (let gz = 0; gz <= segments; gz += step) {
    for (let gx = 0; gx <= segments; gx += step) {
      // Unconditional draw — see determinism rules above.
      const draw = acceptRng();
      if (draw >= chance) continue;

      const idx = gz * verticesPerSide + gx;
      const vx = heightData[idx * 3];
      const vy = heightData[idx * 3 + 1];
      const vz = heightData[idx * 3 + 2];

      // Drop spawns that land on a road (engine roads are baked into the same
      // vertex grid this loop walks, so the road value at `idx` is exactly this
      // spawn's mount point). After the accept draw → determinism preserved.
      if (avoidRoads && roadStrength![idx] > 0.1) continue;

      const normalizedHeight = (vy + heightScale) / (heightScale * 2);
      if (normalizedHeight < minHeight || normalizedHeight > maxHeight) continue;

      // Slope from central differences over ±2 grid verts.
      const span = 2;
      const dyDx = (normHeightAt(gx + span, gz) - normHeightAt(gx - span, gz))
        * (heightScale * 2) / (2 * span * unitsPerVertex);
      const dyDz = (normHeightAt(gx, gz + span) - normHeightAt(gx, gz - span))
        * (heightScale * 2) / (2 * span * unitsPerVertex);
      const slope = Math.sqrt(dyDx * dyDx + dyDz * dyDz);
      if (slope > maxSlope) continue;

      // Ring-scan for the nearest water vertex (normalizedHeight < 0.48),
      // out to WATER_SCAN_RADIUS. Within-chunk knowledge only — samples
      // clamp at the chunk border.
      let waterDistance = WATER_SCAN_RADIUS;
      // The BEARING to that water, as a unit XZ vector — free here (the scan
      // already knows the angle it hit on) and otherwise unrecoverable by a
      // plugin. Without it, "put the bobber in the water" is a guess: the
      // first shoreline plugin hardcoded "water is +X" and landed most of its
      // spawns on dry land. null when no water was found within the scan.
      let waterDirection: [number, number] | null = null;
      const maxRingVerts = Math.ceil(WATER_SCAN_RADIUS / unitsPerVertex);
      ringScan:
      for (let r = 1; r <= maxRingVerts; r++) {
        const samples = Math.max(8, r * 4);
        for (let s = 0; s < samples; s++) {
          const a = (s / samples) * Math.PI * 2;
          const sgx = Math.round(gx + Math.cos(a) * r);
          const sgz = Math.round(gz + Math.sin(a) * r);
          if (normHeightAt(sgx, sgz) < 0.48) {
            waterDistance = r * unitsPerVertex;
            waterDirection = [Math.cos(a), Math.sin(a)];
            break ringScan;
          }
        }
      }
      if (waterDistance < minWaterDistance) continue;
      if (waterDistance > maxWaterDistance) continue;

      const worldX = chunkX * width + width / 2 + vx;
      const worldZ = chunkZ * height + height / 2 + vz;
      const biome = getBiomeAt(worldX, worldZ, seed)?.id ?? 'default';
      if (spec.biomes && spec.biomes.length > 0 && !spec.biomes.includes(biome)) continue;

      // Surface targeting — applied after the accept draw so it only
      // moves the spawns it filters (determinism contract).
      const surface = classifySurface(normalizedHeight, waterDistance, slope, biome);
      if (surfaceSet && !surfaceSet.has(surface)) continue;

      // Cell-keyed per-spawn stream: jitter + the plugin's rng. Keyed by
      // grid coords so a spawn's randomness never depends on how many
      // earlier cells were accepted.
      const cellSeed = `${baseSeed}-${gx}-${gz}`;
      const spawnRng = alea(cellSeed);
      const jx = (spawnRng() - 0.5) * cellSize * 0.8;
      const jz = (spawnRng() - 0.5) * cellSize * 0.8;
      const x = vx + jx;
      const z = vz + jz;

      // Engine-controlled water seating: 'submerged' drops into the water
      // column, 'surface' sits at the waterline. Only over water (vy below
      // the surface), so depth is always positive.
      let placedY = vy;
      if (vy < waterLevel && (spec.waterPlacement === 'surface' || spec.waterPlacement === 'submerged')) {
        placedY = spec.waterPlacement === 'surface'
          ? waterLevel
          : vy + (waterLevel - vy) * 0.5; // midway up the column — clearly under
      }

      if (minSpacingSq > 0) {
        let tooClose = false;
        for (const s of spawns) {
          const dx = s.position[0] - x;
          const dz = s.position[2] - z;
          if (dx * dx + dz * dz < minSpacingSq) { tooClose = true; break; }
        }
        if (tooClose) continue;
      }

      spawns.push({
        position: [x, placedY, z],
        worldPosition: [worldX + jx, placedY, worldZ + jz],
        // Render frame = chunk origin (chunkX*width) + chunk-local — the
        // worker-frame worldPosition minus the ½-chunk centre offset.
        renderPosition: [worldX + jx - width / 2, placedY, worldZ + jz - height / 2],
        normalizedHeight,
        slope,
        waterDistance,
        waterDirection,
        biome,
        treeDistance: nearestSpawnDistance(neighbors?.treeSpawns, x, z),
        boulderDistance: nearestSpawnDistance(neighbors?.boulderSpawns, x, z),
        surface,
        waterLevel,
        groundHeightAt: (dx: number, dz: number) => sampleGroundY(x + dx, z + dz) - placedY,
        rng: spawnRng,
        seed: cellSeed,
        // Everything before the two grid coords. Handed over ready-made
        // because every plugin that tried to derive it with
        // `slice(0, lastIndexOf('-') + 1)` got it wrong (that strips only gz),
        // which silently defeated the per-chunk fetch coalescing.
        chunkPrefix: `${baseSeed}-`,
        index: spawns.length,
        chunkX,
        chunkZ,
      });
    }
  }

  return spawns;
}

// ── Tree-canopy anchor placement ──────────────────────────────────────
// Items attach to the REAL canopy blob spheres from `treeColliders` (so they
// touch actual leaf surfaces). These constants only feed the FALLBACK crown
// approximation used before the async collider data lands. Tree height ≈
// scale × species height (8–9.5); canopy mass centres ~0.6 up, ~3×scale wide.
const TREE_CANOPY_Y = 5.5;   // × scale, above the trunk base (fallback only)
const TREE_CANOPY_R = 3.0;   // × scale, crown radius (fallback only)
// Scatter radius handed to the plugin for trunk-base clusters: a ring just
// outside the trunk. Real trunk radius (collider [o+4]) when available, else
// scaled from the tree spawn scale; floored so even a thin sapling gives room.
const TREE_BASE_RING = 2.5;  // × trunk radius — outer edge of the base cluster
const TREE_BASE_MIN_R = 1.2; // units — minimum usable cluster radius

function computeTreeAnchorSpawns(
  spec: DecorationSpec,
  seed: string,
  chunkX: number,
  chunkZ: number,
  width: number,
  height: number,
  neighbors: ChunkNeighborData | undefined,
  waterLevel: number,
  placement: 'canopy' | 'base',
): DecorationSpawn[] {
  const treeSpawns = neighbors?.treeSpawns;
  if (!treeSpawns || treeSpawns.length < SPAWN_STRIDE) return [];

  const colliders = neighbors?.treeColliders;
  const useColliders = !!colliders && colliders.length >= TREE_COLLIDER_STRIDE;

  const density = spec.density ?? 1;
  const chance = Math.min(1, density);
  const baseSeed = `${seed}-decoration-${spec.name}-${chunkX}-${chunkZ}`;
  const spawns: DecorationSpawn[] = [];
  const offX = chunkX * width + width / 2;
  const offZ = chunkZ * height + height / 2;

  const pushAnchor = (
    x: number, y: number, z: number, anchorRadius: number, rng: () => number, cellSeed: string,
  ) => {
    spawns.push({
      position: [x, y, z],
      worldPosition: [offX + x, y, offZ + z],
      renderPosition: [offX + x - width / 2, y, offZ + z - height / 2],
      normalizedHeight: 0.55,
      slope: 0,
      waterDistance: WATER_SCAN_RADIUS,
      waterDirection: null,   // anchored spawns don't ring-scan (placeholder, like waterDistance)
      biome: 'default',
      treeDistance: 0,
      boulderDistance: Infinity,
      surface: 'grass',
      waterLevel,
      anchorScale: anchorRadius,
      anchorRadius,
      rng,
      seed: cellSeed,
      index: spawns.length,
      chunkX,
      chunkZ,
    });
  };

  // Place on the LOWER-hemisphere surface of a sphere (centre cx,cy,cz,
  // radius r) — where something can hang from. Returns [x, y, z].
  // yFrac runs 0 (equator) → 1 (bottom pole). We BIAS toward the bottom so
  // hangers attach to the true UNDERSIDE of the canopy rather than its flank:
  // `0.5 + 0.5*sqrt(u)` confines points to the lower half and concentrates
  // them near the pole (density rises toward 1), while keeping enough spread
  // that several hangers on one blob don't stack. Still ONE rng() draw, so the
  // accept/reject cursor is unchanged — only the point within each spawn moves.
  const lowerSurfacePoint = (cx: number, cy: number, cz: number, r: number, rng: () => number) => {
    const ang = rng() * Math.PI * 2;
    const yFrac = 0.5 + 0.5 * Math.sqrt(rng());           // 0.5 (mid-low) → 1 (bottom)
    const horizR = r * Math.sqrt(Math.max(0, 1 - yFrac * yFrac));
    return [cx + Math.cos(ang) * horizR, cy - yFrac * r, cz + Math.sin(ang) * horizR];
  };

  if (useColliders) {
    // PRECISE: read the REAL trunk/canopy geometry from treeColliders (same
    // chunk-local frame PluginDecorations mounts objects in).
    const treeCount = Math.floor(colliders!.length / TREE_COLLIDER_STRIDE);
    for (let i = 0; i < treeCount; i++) {
      const o = i * TREE_COLLIDER_STRIDE;
      const cellSeed = `${baseSeed}-tree-${i}`;
      const rng = alea(cellSeed);
      if (rng() >= chance) continue;

      if (placement === 'base') {
        // The trunk base [o..2] is the ground-contact point (where the trunk
        // meets the terrain). Hand the plugin that exact point plus a ring
        // radius just outside the trunk to scatter a cluster into. Every tree
        // has a trunk, so no blob-count gate here.
        const bx = colliders![o], by = colliders![o + 1], bz = colliders![o + 2];
        const trunkR = colliders![o + 4];
        const ringR = Math.max(TREE_BASE_MIN_R, trunkR * TREE_BASE_RING);
        pushAnchor(bx, by, bz, ringR, rng, cellSeed);
        continue;
      }

      // CANOPY: attach to a REAL canopy blob's underside so items touch the
      // actual leaf surface (no floating, no faked hang).
      const blobCount = colliders![o + 5] | 0;
      if (blobCount <= 0) continue;                       // no canopy → nothing to hang from
      const b = Math.min(blobCount - 1, Math.floor(rng() * blobCount));
      const bo = o + TREE_COLLIDER_BLOB_BASE + b * 4;
      const cx = colliders![bo], cy = colliders![bo + 1], cz = colliders![bo + 2], r = colliders![bo + 3];
      const [x, y, z] = lowerSurfacePoint(cx, cy, cz, r, rng);
      pushAnchor(x, y, z, r, rng, cellSeed);
    }
    return spawns;
  }

  // FALLBACK (no collider data yet — e.g. before the async build lands):
  // use the tree spawn position + scale.
  const treeCount = Math.floor(treeSpawns.length / SPAWN_STRIDE);
  for (let i = 0; i < treeCount; i++) {
    const o = i * SPAWN_STRIDE;
    const tx = treeSpawns[o], ty = treeSpawns[o + 1], tz = treeSpawns[o + 2];
    const scale = treeSpawns[o + 3] || 1;
    const cellSeed = `${baseSeed}-tree-${i}`;
    const rng = alea(cellSeed);
    if (rng() >= chance) continue;

    if (placement === 'base') {
      // The tree spawn xyz is the trunk's ground contact. Ring radius scales
      // with the tree (trunk radius ≈ 0.3×scale) — floored so it's usable.
      const ringR = Math.max(TREE_BASE_MIN_R, scale * 0.3 * TREE_BASE_RING);
      pushAnchor(tx, ty, tz, ringR, rng, cellSeed);
      continue;
    }

    // CANOPY fallback — approximate the crown as one sphere from the scale.
    const canopyR = scale * TREE_CANOPY_R;
    const [x, y, z] = lowerSurfacePoint(tx, ty + scale * TREE_CANOPY_Y, tz, canopyR, rng);
    pushAnchor(x, y, z, canopyR, rng, cellSeed);
  }
  return spawns;
}

// ── Mountain-summit anchor placement ──────────────────────────────────
// Items sit on the REAL mountain mesh surface (queried via the SDF), in the
// TOP 2% of the structure's height. Frames: the mountain mesh group is at
// world (worldX, positionY − 3, worldZ) while chunks are at (gridX*width,
// positionY, gridZ*height) — both scene-level (InfiniteTerrain). So a
// chunk-local spawn on the mountain surface is:
//   x = worldX + lx − chunkX*width,  y = surfaceLocalY − 3,  z = …
// (The old code used the chunk CENTRE for x/z and `heightfield + peakHeight`
// for y — both wrong frames, which floated items far off the walkable top.)
const MOUNTAIN_Y_OFFSET = -3; // mountain group Y vs chunk group Y (InfiniteTerrain)
const MOUNTAIN_SINK = 1.0;    // seat slightly into the surface (covers mesh noise)

function computeMountainAnchorSpawns(
  spec: DecorationSpec,
  seed: string,
  chunkX: number,
  chunkZ: number,
  width: number,
  height: number,
  waterLevel: number,
): DecorationSpawn[] {
  let mountains;
  try {
    mountains = getMountainsNearChunk(chunkX, chunkZ, width, height, seed);
  } catch {
    return [];
  }
  if (!mountains || mountains.length === 0) return [];

  const density = spec.density ?? 1;
  const baseSeed = `${seed}-decoration-${spec.name}`;
  const spawns: DecorationSpawn[] = [];

  for (const m of mountains) {
    // Each peak owned by exactly one chunk → no cross-chunk duplicates.
    if (Math.floor(m.worldX / width) !== chunkX || Math.floor(m.worldZ / height) !== chunkZ) continue;

    // Apex height (query just off-centre to dodge the r=0 SDF degeneracy),
    // and the top-2%-of-structure band below it.
    const apexLy = getMountainSurfaceLocalY(m, m.baseRadius * 0.02, 0);
    if (!isFinite(apexLy)) continue;
    const band = 0.02 * m.peakHeight;
    const summitR = m.baseRadius * 0.22;       // scatter disc near the apex

    const cellSeed = `${baseSeed}-mtn-${m.id}`;
    const rng = alea(cellSeed);                // per-mountain scatter stream
    const count = Math.max(0, Math.round(density));

    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 16 + 8) {
      attempts++;
      const ang = rng() * Math.PI * 2;
      const rad = Math.sqrt(rng()) * summitR;
      const lx = Math.cos(ang) * rad;
      const lz = Math.sin(ang) * rad;
      const ly = getMountainSurfaceLocalY(m, lx, lz);
      // Only the top 2% of the structure (and on an actual surface).
      if (!isFinite(ly) || ly < apexLy - band) continue;

      const sx = m.worldX + lx - chunkX * width;
      const sy = ly + MOUNTAIN_Y_OFFSET - MOUNTAIN_SINK;
      const sz = m.worldZ + lz - chunkZ * height;
      const spawnSeed = `${cellSeed}-${placed}`;
      spawns.push({
        position: [sx, sy, sz],
        // Mountain anchors were ALWAYS render-frame (m.worldX is the mount
        // position of the mountain group), so both fields agree here —
        // renderPosition exists so plugins can use ONE rule everywhere.
        worldPosition: [m.worldX + lx, sy, m.worldZ + lz],
        renderPosition: [m.worldX + lx, sy, m.worldZ + lz],
        normalizedHeight: 1,
        slope: 0,
        waterDistance: WATER_SCAN_RADIUS,
      waterDirection: null,   // anchored spawns don't ring-scan (placeholder, like waterDistance)
        biome: 'mountains',
        treeDistance: Infinity,
        boulderDistance: Infinity,
        surface: 'rock',
        waterLevel,
        anchorScale: m.baseRadius,
        anchorRadius: summitR,
        rng: alea(spawnSeed),
        seed: spawnSeed,
        index: spawns.length,
        chunkX,
        chunkZ,
      });
      placed++;
    }
  }

  return spawns;
}
