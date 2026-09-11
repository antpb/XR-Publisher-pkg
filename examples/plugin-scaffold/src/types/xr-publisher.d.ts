// ─────────────────────────────────────────────────────────────────────────
// Ambient types for the XR Publisher runtime, as seen by a plugin.
// ─────────────────────────────────────────────────────────────────────────
//
// This is a CURATED, hand-written surface — enough of the public API to get
// autocomplete and type-checking on the common calls, plus a permissive index
// signature so you can call any documented method the runtime exposes without
// a type error. The authoritative, exhaustive reference lives in the package
// source (see the pointers on each section below), which your published world
// bundles — these types just describe it for your editor.

import type * as THREE from 'three';

/** Injected by the build (esbuild `define`) — your plugin's slug string,
 *  matching the output filename. Use it to namespace logs / block `plugin:`. */
declare const PLUGIN_SLUG: string;

// ── Decorations ───────────────────────────────────────────────────────────
// Full spec + every field's docs: packages/xr-publisher/src/decorations/decorationRegistry.ts

export type SurfaceType = 'water' | 'sand' | 'grass' | 'dirt' | 'rock' | 'snow';

/** World-road generation config (all optional when reconfiguring). */
export interface RoadConfig {
  enabled: boolean;
  /** One town CANDIDATE per this-size world cell (rare towns). */
  townCell: number;
  /** A town needs a buildable clearing at least this deep (world units). */
  minClearance: number;
  roadWidth: number;
  /** Fixed super-tile size; should be well above maxEdge. */
  superTile: number;
  /** Longest road between two town centres. */
  maxEdge: number;
  /** Planner cost-grid resolution (world units). */
  cellSize: number;
  clrDirs: number;
  clrStep: number;
  clrMax: number;
  cellStep: number;
}

/** One planned road: the two settlement indices it joins + its polyline. */
export interface RoadEdge {
  a: number;
  b: number;
  points: Array<[number, number]>;
}

export interface ProximityVoiceConfig {
  /** false = legacy behaviour: every peer at full volume, no send gating. */
  enabled: boolean;
  /** Directional stereo via PannerNode (false = distance falloff only). */
  spatialize: boolean;
  /** Distance where fade begins. null = auto (25% of the terrain cell radius). */
  fadeStart: number | null;
  /** Distance where voice is silent AND mic sends gate off. null = auto. */
  maxDistance: number | null;
  exponent: number;
}
export type BiomeId = 'plains' | 'mountains' | 'wetlands' | 'buildable' | 'default';
/** A biome descriptor — what getBiomeAt returns (an object, not a name). */
export interface BiomeType {
  id: BiomeId;
  heightMultiplier: number;
  grassDensity: number;
  boulderDensity: number;
  treeDensity: number;
  shrubDensity: number;
  flowerDensity: number;
}
export type DecorationAnchor = 'terrain' | 'tree' | 'tree-base' | 'mountain';
export type DecorationCollision = boolean | 'cuboid' | 'hull' | 'trimesh';

export interface DecorationSpawn {
  /** Chunk-local [x,y,z] — already applied to the object you return. */
  position: [number, number, number];
  /** World-space position in the RENDER frame (same frame as getPlayerState,
   *  addTerrainRegion, setWorldState positions). Prefer this over worldPosition.
   *  ⚠ X and Z are true world coords, but Y is the raw terrain-height SAMPLE:
   *  the terrain block's own vertical offset is NOT included (a chunk-parented
   *  decoration gets that from its chunk group). Comparing this Y against
   *  `getPlayerState().y`, or using it as a scene-space Y, is off by that
   *  offset — commonly 10 units. For a true world Y at any point, use
   *  `sampleTerrain(x, z).worldY`. */
  renderPosition: [number, number, number];
  /** World-space position in the WORKER frame (legacy; ½-chunk-shifted for
   *  terrain/tree anchors). Use renderPosition for anything leaving the plugin. */
  worldPosition: [number, number, number];
  /** Per-spawn deterministic PRNG (alea). Use this — never Math.random — for
   *  variation that must be identical on every visit and every device. */
  rng: () => number;
  /** Seed string feeding rng, for seeding your own noise (XRPublisher.utils),
   *  and the natural KEY for persisted world state. Shape is
   *  `{worldSeed}-decoration-{name}-{chunkX}-{chunkZ}-{gx}-{gz}` — TWO trailing
   *  grid coords, and negative chunk coords produce double dashes. Never slice
   *  it by hand; use `chunkPrefix`. */
  seed: string;
  /** The `fetchWorldState({ prefix })` value matching EVERY spawn of this
   *  decoration in this chunk. Using it is what makes the per-chunk fetch
   *  coalescing work (all spawns in a chunk share ONE request). Absent on
   *  tree/mountain anchors, whose seeds carry no chunk coords. */
  chunkPrefix?: string;
  normalizedHeight: number;
  /** Terrain steepness rise/run (0 flat). */
  slope: number;
  /** Distance to nearest water (capped ~24u, within-chunk). */
  waterDistance: number;
  /** Unit XZ vector toward that water — which way the shore faces. null when
   *  no water is within the scan (or on anchored spawns). Use it to place
   *  something ON the water from a dry spawn instead of guessing a direction. */
  waterDirection: [number, number] | null;
  /** 'plains' | 'mountains' | 'wetlands' | 'buildable' | 'default'.
   *  ⚠ On ANCHORED spawns (tree / tree-base / mountain) this — along with
   *  `surface`, `slope`, `waterDistance` and `normalizedHeight` — is a FIXED
   *  PLACEHOLDER, not a sample of the ground. Don't branch on them, and don't
   *  put surface/water/biome filters on an anchored spec. */
  biome: string;
  surface: SurfaceType;
  /** Local Y of the water surface (same frame as position[1]). */
  waterLevel: number;
  treeDistance: number;
  boulderDistance: number;
  /** tree/mountain anchors: the anchor's own radius (canopy blob / summit
   *  ring) — NOT the tree's scale factor, despite the name. */
  anchorScale?: number;
  /** tree/mountain anchors: usable scatter radius around the anchor. */
  anchorRadius?: number;
  /** Bilinear ground height at an offset from the spawn (terrain anchors). */
  groundHeightAt?: (dx: number, dz: number) => number;
  index: number;
  chunkX: number;
  chunkZ: number;
}

export interface DecorationInteractionContext {
  object: THREE.Object3D;
  spawn: DecorationSpawn;
  /** Despawn this object (collectibles). Reappears on chunk reload unless you
   *  track collected spawn.seed and return null from create() for them. */
  remove: () => void;
}

export interface DecorationSpec {
  /** Unique name — ALSO part of the placement seed (renaming relocates spawns). */
  name: string;
  /** Expected spawns per 100×100u chunk (default 1; fractions allowed). */
  density?: number;
  minHeight?: number;
  maxHeight?: number;
  /** Max steepness rise/run to accept (~0.15 targets flat ground). */
  maxSlope?: number;
  minWaterDistance?: number;
  maxWaterDistance?: number;
  surface?: SurfaceType | SurfaceType[];
  anchor?: DecorationAnchor;
  waterPlacement?: 'floor' | 'submerged' | 'surface';
  biomes?: string[];
  minSpacing?: number;
  avoidRoads?: boolean;
  /** Render all spawns as one InstancedMesh (STATIC specs only). */
  instanced?: boolean;
  transform?: (spawn: DecorationSpawn) => { rotationY?: number; scale?: number; tilt?: number };
  groundPatch?: { radius: number; color?: [number, number, number]; clearGrass?: boolean };
  /** true = cheap cuboid; 'hull'/'trimesh' = precise (trimesh cooks sync). */
  collision?: DecorationCollision;
  interactable?: boolean;
  interactionPrompt?: string | ((spawn: DecorationSpawn) => string);
  interactionRadius?: number;
  onInteract?: (ctx: DecorationInteractionContext) => void;
  /** Build one spawn's object (return null to skip). Engine applies position. */
  create: (spawn: DecorationSpawn) => THREE.Object3D | null;
  /** Providing this makes the object dynamic (per-frame). */
  update?: (object: THREE.Object3D, delta: number, elapsed: number) => void;
  /** Custom cleanup. Default disposes geometries only — override when you
   *  share module-level geometry/materials (return an empty fn to keep them). */
  dispose?: (object: THREE.Object3D) => void;
  /** LARGE / CROSS-CELL structures (race courses, golf holes, big builds).
   *  A normal decoration is parented to the terrain chunk that spawned it and
   *  DISPOSED the moment that chunk streams out — which tears a course down
   *  mid-run once the player is a couple of chunks from its origin. With
   *  `persist: true` the engine mounts the create() object at SCENE scale
   *  (world position = spawn.renderPosition) and keeps it alive until the
   *  player moves beyond `keepAliveRadius` of the spawn, NOT when the chunk
   *  unloads. Re-entry re-runs create() from the same seed (deduped by seed
   *  while alive); dispose() fires on eviction. Interactables still (re)register
   *  per chunk load. Incompatible with `instanced`; persistent objects get no
   *  auto colliders (use XRPublisher.addSolid for a persistent collidable). */
  /** "I animate this object MYSELF" (from a plugin-owned interval/rAF instead
   *  of `update`). REQUIRED for that pattern: without it the engine freezes a
   *  no-`update` spec's matrices, and a static non-solid spec is merged — which
   *  clones the geometry and disposes what create() returned, so your ticker
   *  animates a discarded object. Forces the per-object mount path.
   *  (For one moving part on an otherwise static object, mark just that child
   *  `userData.xrAnimated = true`.) */
  animated?: boolean;
  persist?: boolean;
  /** World-unit radius a `persist` decoration stays mounted within. Default:
   *  the object's bounding radius × 1.35, clamped to [140, 2000]. Set it to
   *  your structure's extent (e.g. a race course's length). */
  keepAliveRadius?: number;
}

// ── Custom editor-placeable blocks ────────────────────────────────────────
// Full spec: packages/xr-publisher/src/blocks/customBlockRegistry.ts

export interface CustomBlockField {
  key: string;
  type: 'number' | 'string' | 'longtext' | 'url' | 'select' | 'color' | 'boolean';
  label?: string;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
}

export interface CustomBlockContext {
  props: Record<string, string | number | boolean>;
  /** The block's DOM element (read attributes; don't assume HTMLElement). */
  el: Element;
  THREE: typeof THREE;
  isWebGPU: boolean;
  rng: () => number;
  seed: string;
}

export interface CustomBlockSpec {
  /** MUST equal PLUGIN_SLUG (the build filename slug). */
  plugin: string;
  name: string;
  label?: string;
  category?: string;
  fields?: CustomBlockField[];
  create: (ctx: CustomBlockContext) => THREE.Object3D | null;
  update?: (obj: THREE.Object3D, props: Record<string, unknown>, prev: Record<string, unknown>, ctx: CustomBlockContext) => boolean | void;
  tick?: (obj: THREE.Object3D, dt: number, elapsed: number) => void;
  dispose?: (obj: THREE.Object3D) => void;
}

// ── Interactables / HUD / dialog / menu (mounted-outside-decoration path) ──

export interface InteractableEntry {
  id: string;
  object: THREE.Object3D;
  /** Interact radius in world units (default 4). `interactionRadius` is
   *  accepted as an alias — the DECORATION SPEC spells it that way — but
   *  `radius` is the canonical field here. */
  radius?: number;
  /** Prompt text, or a function re-resolved at the ~10Hz proximity cadence for
   *  stateful prompts ("Water crops" → "Harvest"). Defaults to the entry id.
   *  `interactionPrompt` is accepted as an alias. */
  prompt?: string | (() => string);
  /** @deprecated alias for `radius` (decoration-spec spelling). */
  interactionRadius?: number;
  /** @deprecated alias for `prompt` (decoration-spec spelling). */
  interactionPrompt?: string | (() => string);
  /** Fired when the player presses E while this entry is the active one.
   *  Called with NO arguments — capture what you need in the closure. (A
   *  decoration spec's `onInteract` DOES receive a context object; this
   *  low-level entry does not.) */
  onInteract: () => void;
}

export interface DialogButton {
  label: string;
  onSelect?: () => void;
  keepOpen?: boolean;
}

export interface DialogConfig {
  title?: string;
  content?: string;
  buttons?: DialogButton[];
  width?: number;
  dismissDistance?: number;
  onClose?: (reason: 'button' | 'escape' | 'dismissed' | 'replaced' | 'manual') => void;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  order?: number;
  onSelect: () => void;
}

export interface PlayerState {
  /** TRUE world position (unlike a spawn's renderPosition, whose Y excludes
   *  the terrain block's vertical offset). */
  x: number;
  y: number;
  z: number;
  /** Avatar BODY heading in radians (0 = −Z). The body turns toward MOVEMENT,
   *  so this is not "where the player is looking" — use getCursorState() for
   *  aim. */
  yaw: number;
  isSwimming: boolean;
  isFlying: boolean;
  /** Something solid within ~14m straight up (roof, cavern ceiling). */
  sheltered: boolean;
  [key: string]: unknown;
}

// ── Programmatic world-building specs ─────────────────────────────────────
// Full docs: src/components/core/front/worldObjectRegistry.ts,
// src/index.tsx (TerrainRegionSpec), terrainSurfaceRegistry.ts

export interface WorldModelInstance {
  /** World position of this instance [x, y, z]. */
  position: [number, number, number];
  /** Euler rotation in DEGREES [x, y, z] (default 0). */
  rotation?: [number, number, number];
  /** Uniform scale, or [x, y, z] (default 1). */
  scale?: number | [number, number, number];
  /** Give this instance a trimesh collider (default false). */
  collidable?: boolean;
}

export interface WorldModelSpec {
  /** Stable id. Re-adding the same id REPLACES it in place; omit and one is
   *  generated and returned by addModel(). */
  id?: string;
  /** glTF/GLB URL. */
  url: string;
  /** Position [x, y, z] (default 0). Ignored when `instances` is provided. */
  position?: [number, number, number];
  /** Euler rotation in DEGREES (default 0). */
  rotation?: [number, number, number];
  /** Uniform scale, or [x, y, z] (default 1). */
  scale?: number | [number, number, number];
  /** Trimesh collider for the single model (default false). */
  collidable?: boolean;
  /** Comma-separated animation clip names to autoplay. */
  animations?: string;
  /** Render every entry as ONE InstancedMesh (each carries its transform). */
  instances?: WorldModelInstance[];
}

export interface TerrainRegionSpec {
  /** Stable id (omit to auto-generate; returned by addTerrainRegion). */
  id?: string;
  /** World-space centre [x, z] (render frame — spawn.renderPosition). */
  center: [number, number];
  /** Radius in world units. */
  radius: number;
  /** Registered surface id (default 'cobblestone'). */
  surface?: string;
  /** Feature scale — cells per world unit (default 0.35). */
  scale?: number;
  /** Surface second param — mortar width for cobblestone (default 0.08). */
  mortar?: number;
  /** RGB tint multiplier; also the WebGL flat fallback for custom surfaces. */
  tint?: [number, number, number];
  /** Clear engine grass inside the circle (default true). */
  clearGrass?: boolean;
}

export interface TerrainSurfaceDef {
  /** Unique id; regions reference it by name. Built-in: 'cobblestone'. */
  id: string;
  /** TSL factory → `vec4(color.rgb, roughness)`. */
  tsl: (ctx: unknown) => unknown;
  /** Flat RGB for the WebGL twin / safety fallback (default mid grey). */
  fallbackColor?: [number, number, number];
}

// ── Persisted world state ─────────────────────────────────────────────────
// Full docs: packages/xr-publisher/src/state/worldState.ts

/** One persisted record. Your data is in `.value` — reads return the RECORD,
 *  never the raw value you stored. */
export interface WorldStateRecord {
  value: unknown;
  updatedAt: number;
  pos?: [number, number] | null;
}

// ── The runtime object ────────────────────────────────────────────────────

export interface XRPublisherAPI {
  // Decorations
  registerDecoration(spec: DecorationSpec): void;
  unregisterDecoration(name: string): void;

  // Custom blocks
  registerBlockType(spec: CustomBlockSpec): void;
  unregisterBlockType(tagOrName: string): void;

  // Interactables / HUD / dialog / menu
  registerInteractable(entry: InteractableEntry): void;
  unregisterInteractable(id: string): void;
  registerHud(id: string, el: HTMLElement, anchor?: string): void;
  unregisterHud(id: string): void;
  openDialog(config: DialogConfig): void;
  closeDialog(): void;
  registerMenuItem(item: MenuItem): void;
  unregisterMenuItem(id: string): void;

  // Assets & programmatic world-building
  loadModel(url: string): Promise<THREE.Object3D>;
  addModel(spec: WorldModelSpec): string;
  removeModel(id: string): void;
  addTerrainRegion(spec: TerrainRegionSpec): string;
  removeTerrainRegion(id: string): void;
  registerTerrainSurface(spec: TerrainSurfaceDef): void;

  // Space queries & player
  /** The procedural world's seed (null when the world has no terrain). Seed
   *  world-stable generative choices from this via utils.alea. */
  getWorldSeed(): string | null;
  /** Ground height from a rapier raycast — NULL until a terrain collider is
   *  loaded near that point (colliders are altitude/flying-gated, and distant
   *  chunks have none). For anything that must work at range, prefer
   *  `sampleTerrain`. */
  getGroundHeight(x: number, z: number): number | null;
  /** Sample the terrain ANALYTICALLY at any world XZ — no collider, no
   *  raycast, works for chunks that have never streamed in. `worldY` is TRUE
   *  world Y (the terrain block's vertical offset already applied), unlike a
   *  spawn's `renderPosition[1]`. This is the right tool for placing distant
   *  objects, routing around water, or integrating a projectile. */
  sampleTerrain(x: number, z: number): { worldY: number; normalizedHeight: number; isWater: boolean } | null;
  /** Is this world XZ under the waterline? Null before terrain mounts. */
  isWaterAt(x: number, z: number): boolean | null;
  /** The dominant biome at a world XZ — the whole biome DESCRIPTOR, not just
   *  a name: `{ id, heightMultiplier, grassDensity, boulderDensity,
   *  treeDensity, shrubDensity, flowerDensity }`. Null before terrain mounts. */
  getBiomeAt(x: number, z: number, seed?: string): BiomeType | null;
  /** The raw blend weights behind that choice, keyed by biome id. */
  getBiomeWeights(x: number, z: number, seed?: string): Record<BiomeId, number> | null;
  /** Inject a PERSISTENT collidable object at scene scale (survives chunk
   *  streaming). This is how a plugin makes something walk-on-able after
   *  mount — a decoration's `collision` is evaluated once, at mount. */
  addSolid(spec: {
    id?: string;
    object: THREE.Object3D;
    position?: [number, number, number];
    /** Euler rotation in DEGREES (default 0). */
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
    /** Default 'hull' (convex hull — right for a platform). */
    colliders?: 'cuboid' | 'hull' | 'trimesh' | 'ball';
  }): string;
  removeSolid(id: string): void;
  /** Paint a road/trail along a world-space polyline. Renders as packed dirt ×
   *  `tint` on both renderers (`surface`/`scale` are accepted but ignored),
   *  and does NOT clear grass — use a groundPatch decoration for that. */
  addPath(spec: { id: string; points: Array<[number, number]>; width?: number; tint?: [number, number, number] }): string;
  removePath(id: string): void;
  /** Deterministic town centres in a region. `x`/`z` are the planner's WORKER
   *  frame (stable identity — key off them); `renderX`/`renderZ` are the
   *  render frame everything else uses (place with these). */
  getWorldTowns(bounds: { minX: number; minZ: number; maxX: number; maxZ: number }): Promise<Array<{ x: number; z: number; renderX: number; renderZ: number }>>;
  /** Localized weather inside a world-space circle (storm cells, fog banks).
   *  Core does NOT render rain — poll `getWeatherAt` and drive your own. */
  addCloudRegion(spec: {
    id?: string;
    center: [number, number];
    radius: number;
    /** Inner-solid fraction 0..1 (default 0.6). */
    falloff?: number;
    density?: number;
    coverage?: number;
    scale?: number;
    speed?: number;
    rain?: number;
    color?: [number, number, number];
  }): string;
  removeCloudRegion(id: string): void;
  getWeatherAt(x: number, z: number): { density: number; coverage: number; color: [number, number, number]; rain: number; speed: number; isStorm: boolean; time: number; phase: string };
  /** Ready-made frequency bands off the master mix (audio-reactive visuals). */
  getAudioLevels(): { bass: number; mid: number; treble: number; level: number };
  teleportPlayer(x: number, y: number | undefined, z: number): void;
  getPlayerState(): PlayerState | null;
  /** The world cursor's live aim state (engine third-person reticle, ~30Hz).
   *  `position` = current aim point (surface hit, or free point at default
   *  distance); `visible` is false while moving but position keeps updating —
   *  aim-driven mechanics should use position regardless. Null before mount. */
  getCursorState(): { position: [number, number, number]; normal: [number, number, number]; visible: boolean } | null;
  /** True while a WebXR session is presenting (VR runs on the WebGL path). */
  isPresenting(): boolean;
  /** Live VR controller state (world-space pose + buttons), or null when not
   *  presenting / not tracked. `direction` is the -Z aim ray. `trigger`
   *  (0..1) is the tool action and covers hand-tracking pinch; SQUEEZE is
   *  reserved by the engine to fire the active interactable (the VR "E") —
   *  don't double-bind it. */
  getControllerState(hand: 'left' | 'right'): {
    position: [number, number, number];
    quaternion: [number, number, number, number];
    direction: [number, number, number];
    trigger: number;
    squeeze: number;
    hand: boolean;
  } | null;
  /** GTA-style avatar aiming: refresh a world-space target EVERY FRAME while
   *  a tool is in use (it ages out after 0.5s) and the engine poses the local
   *  avatar — body yaw locks onto the target (A/D become strafes, S a
   *  backpedal), arms raise toward it, clamped so they can't bend backward.
   *  Pass null to release. Pair with getCursorState() for the target. */
  setAimTarget(target: [number, number, number] | null): void;
  getPeers(): Array<{ id: string; x: number; y: number; z: number }>;
  getScene(): THREE.Scene | null;
  /** The local player avatar Object3D (tracks body position/yaw), or null
   *  before it mounts. NOT the camera. */
  getPlayer(): THREE.Object3D | null;
  /** The camera-mounted AudioListener. Its world matrix tracks the camera, so
   *  `getWorldPosition`/`getWorldDirection` (negated — +Z faces backward) give
   *  a usable aim ray. Objects parented to it will NOT render (the camera is
   *  outside the scene graph) — add effects to the scene and follow manually. */
  getAudioListener(): THREE.AudioListener | null;
  getAudioAnalyser(): unknown;

  // Networking (reserved __xrp:* channels are refused)
  broadcast(channel: string, data: unknown): void;
  /** Subscribe to a channel. NOTE THE ARGUMENT ORDER: the callback receives
   *  `(peerId, data)` — peer FIRST. (This was documented backwards here for a
   *  while; plugins written against the old order type-checked cleanly and then
   *  dropped every inbound message, because `data` held the peer-id string.) */
  onMessage(channel: string, cb: (peerId: string, data: unknown) => void): () => void;
  /** The NETWORKING session id — random per page load, null with no networking
   *  block. Fine for "who sent this message"; WRONG for persisted ownership
   *  (see getPlayerId). */
  getClientId(): string | null;
  /** True once networking has connected and issued a client id. Gate
   *  multiplayer features on THIS — `typeof XRPublisher.broadcast === 'function'`
   *  is always true, even in a world with no networking block. */
  isConnected(): boolean;
  /** A STABLE per-visitor id persisted in localStorage — key player-owned
   *  records (claimed plots, personal bests) off this, NOT getClientId(),
   *  which changes on every reload. Not an account, not authorization:
   *  forgeable, same honor-system trust level as the rest of world state. */
  getPlayerId(): string;
  /** Fired when a peer joins / leaves the room. Returns an unsubscribe fn. */
  onPeerJoin(cb: (peerId: string) => void): () => void;
  onPeerLeave(cb: (peerId: string) => void): () => void;

  // Time (room-synced)
  setTimeOfDay(hour: number, pauseCycle?: boolean): void;
  /** Current in-world time — NOT a bare number. `time` is the 0–24 hour. */
  getTimeOfDay(): { time: number; phase: string };
  setDayCyclePaused(paused: boolean): void;
  isTimeAuthority(): boolean;

  // Post-processing (WebGPU only; cost-gated)
  setPostProcessing(config: {
    bloom?: boolean | { strength: number; radius: number; threshold: number };
    anamorphic?: boolean | { threshold: number; scale: number };
    chromaticAberration?: boolean | number;
    audioReactive?: boolean;
  }): void;
  clearPostProcessing(): void;

  // Persisted world state (server-backed; degrades to session-only optimistic
  // state without an API). One record per object, keyed by spawn.seed, is the
  // intended shape — the server enforces a ~32u writer-distance rule against
  // the record's `pos`, so giant shared arrays under one key will be rejected
  // for any player not standing at that one spot.
  configureWorldState(config: { apiBase?: string | null; worldKey?: string; defaultTtlSeconds?: number }): void;
  /** Populate the snapshot (call from decoration create(); pass maxAgeMs to
   *  make repeat calls free). */
  fetchWorldState(plugin: string, query: { prefix?: string; keys?: string[]; maxAgeMs?: number }): Promise<Record<string, WorldStateRecord>>;
  /** Synchronous snapshot read. Returns the RECORD (your data is `.value`),
   *  or undefined if absent. */
  getWorldState(plugin: string, key: string): WorldStateRecord | undefined;
  /** All cached records for a plugin (read-only live map). */
  getAllWorldState(plugin: string): ReadonlyMap<string, WorldStateRecord>;
  /** Write one record. `opts.pos` is REQUIRED: the record's render-frame world
   *  [x, z] (from spawn.renderPosition — [rp[0], rp[2]]). Resolves false if the
   *  HTTP write failed (state kept locally for this session). */
  setWorldState(plugin: string, key: string, value: unknown, opts: { pos: [number, number]; ttlSeconds?: number }): Promise<boolean>;
  /** Notified on every applied change: fetches, peer broadcasts, local sets. */
  subscribeWorldState(cb: (plugin: string, key: string, rec: WorldStateRecord) => void): () => void;
  /** The key this world's state is stored under. */
  getWorldStateKey(): string;

  // Seed-stable primitives the engine itself uses
  utils: {
    alea: (seed: string) => () => number;
    createNoise2D: (rng?: () => number) => (x: number, y: number) => number;
    createNoise3D: (rng?: () => number) => (x: number, y: number, z: number) => number;
  };

  // Renderer capability
  /** True on the WebGPU path. Gate TSL/node-material work on this and fall
   *  back to stock window.THREE materials — VR always runs the WebGL path. */
  isWebGPU(): boolean;

  // World roads & towns
  /** Turn on the deterministic world-wide road + town network (pass a partial
   *  config to tune it, `false`/`null` to disable). Returns the resolved
   *  config. Towns from it are readable with getWorldTowns. */
  configureWorldRoads(cfg?: Partial<RoadConfig> | boolean | null): RoadConfig | null;
  /** Plan roads over a region yourself: A* over a terrain cost field that
   *  follows walkable ground and routes around water/mountains, connecting the
   *  given settlements. Feed the polylines to addPath. Resolves `{roads: []}`
   *  before terrain mounts. */
  buildRoadNetwork(spec: {
    bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
    settlements: Array<[number, number]>;
    cellSize?: number;
    maxEdgeLength?: number;
    coreBounds?: { minX: number; minZ: number; maxX: number; maxZ: number };
  }): Promise<{ roads: RoadEdge[] }>;

  // Global weather look
  /** The fair-weather baseline every cloud region blends over. */
  setCloudDefaults(cfg: { density?: number; coverage?: number; scale?: number; color?: [number, number, number] }): void;
  /** Suppress the engine's ambient motes (dust/pollen) while your own effect
   *  owns the air. Keyed so several callers can hold it independently. */
  suppressAmbientParticles(key: string, on: boolean): void;
  /** Ocean-basin fade 0..1 at a world XZ (0 = no basin). Null before terrain. */
  getOceanFade(x: number, z: number, seed?: string): number | null;

  // Proximity voice (see docs 40)
  configureProximityVoice(opts: Partial<ProximityVoiceConfig>): void;
  getProximityVoiceConfig(): ProximityVoiceConfig & { resolvedFadeStart: number; resolvedMaxDistance: number };
  /** Local-listener-only override for one peer: `global` ignores distance
   *  (megaphone/performer), `gain` scales after falloff (0 = local mute). */
  setPeerVoiceOverride(clientId: string, override: { global?: boolean; gain?: number } | null): void;
  /** Un-gate your OWN mic so it reaches the whole room regardless of distance.
   *  A world-wide megaphone needs BOTH sides: this, plus listeners setting a
   *  `{global:true}` override for you. */
  setLocalVoiceGlobal(on: boolean): void;
  getVoicePeers(): Array<{ id: string; distance: number | null; gain: number; sendGated: boolean }>;
  /** Pre-falloff RMS 0..1 for a peer — speaking indicators. */
  getPeerAudioLevel(clientId: string): number;

  // Lighting occlusion (WebGPU; disabled on touch devices)
  setLightingOcclusion(enabled: boolean): void;
  excludeFromOcclusion(obj: THREE.Object3D): void;
  unexcludeFromOcclusion(obj: THREE.Object3D): void;
  occlusionMaskNode(): unknown;

  // API endpoint (normally auto-resolved; set before any server-backed call)
  setApiBase(url: string | null): void;
  getApiBase(): string;

  // Cutting-edge rendering primitives (WebGPU). Loosely typed on purpose.
  tsl: unknown;
  webgpu: unknown;

  /** Anything else the runtime exposes that isn't typed above. */
  [key: string]: unknown;
}

declare global {
  interface Window {
    /** The runtime's bundled three — use THIS, never a second copy. */
    THREE: typeof THREE;
    XRPublisher: XRPublisherAPI;
  }
}

export {};
