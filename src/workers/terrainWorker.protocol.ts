/**
 * Terrain Worker Protocol
 *
 * Discriminated union message types for communication between
 * the main thread and the terrain Web Worker. Extensible for
 * future ECS systems (physics, spatial queries, entity sync).
 */
import type { RoadConfig, RoadTerrainParams } from './roadNetwork';

export type { RoadConfig } from './roadNetwork';

// ── Shared types ──

export interface TerrainParams {
  width: number;
  height: number;
  segments: number;
  scale: number;
  heightScale: number;
  seed: string;
  noiseOctaves: number;
  noisePersistence: number;
  noiseLacunarity: number;
  positionX: number;
  positionZ: number;
  // Decoration params
  gridX: number;
  gridZ: number;
  positionY: number;
  grassDensity: number;
  boulderDensity: number;
  treeDensity: number;
  shrubDensity: number;
  flowerDensity: number;
  isMobile: boolean;
  skipMountains?: boolean;
  /**
   * JS-generated mountain list for this chunk. Passing it in lets the
   * WASM terrain generator use the exact same mountains the JS
   * `MountainMesh` renders, including each cavern entrance's
   * `outwardDir` — which drives the directional ramp in the WASM
   * base-influence formula and keeps WebGPU/WebGL terrain consistent
   * with the JS-fallback path. Optional: when omitted, WASM falls back
   * to its internal (radial-ramp, visually divergent) mountain stub.
   * Typed `any[]` because the MountainFeature shape lives in
   * `worldHelpers.ts` and has Three.Vector3 instances that become plain
   * `{x,y,z}` objects after structured clone — the worker only reads
   * scalar fields and the `cavern.entrances` list.
   */
  mountains?: any[];
  /**
   * World-road config. When `enabled`, generate_terrain bakes a per-vertex
   * `roadStrength` (0..1) into the response and filters decoration spawns off
   * the road — all in the worker, from the deterministic super-tile road cache
   * (see roadNetwork.ts). Omitted/disabled ⇒ roadStrength is all zeros.
   */
  roadConfig?: RoadConfig;
}

export interface HighestPoint {
  x: number;
  y: number;
  z: number;
}

// ── Requests (main thread → worker) ──

export interface GenerateTerrainRequest {
  type: 'generate_terrain';
  id: number;
  params: TerrainParams;
}

export interface GenerateMountainRequest {
  type: 'generate_mountain';
  id: number;
  // Mountain features are sent by structured-clone (raw objects),
  // **not** JSON strings. JSON.stringify destroys the `Map<string,
  // CavernNode>` at `mountain.cavern.nodes` (it becomes `{}` on parse),
  // which broke `m.cavern.nodes.values()` in the worker. Structured
  // clone preserves Maps; Vector3 instances degrade to `{x,y,z}` plain
  // objects but the worker only reads properties, never calls methods.
  mountain: any;
  seed: string;
  allMountains: any[];
}

/**
 * Build merged decoration geometry off the main thread.
 *
 * Takes a spawn array (the same one `generate_terrain` produced earlier)
 * and returns one or more merged BakedMesh groups per chunk — one group
 * per material (e.g. trees → { trunks, foliage }; flowers → { stems,
 * centers, petals }). Per-instance position / Y-rotation / scale is
 * baked into vertex coordinates in the worker so the main-thread mesh
 * sits at the chunk origin (no per-instance Object3Ds).
 */
export type DecorationKind = 'trees' | 'boulders' | 'shrubs' | 'flowers' | 'grass';

export interface BuildDecorationGeometryRequest {
  type: 'build_decoration_geometry';
  id: number;
  kind: DecorationKind;
  spawns: Float32Array;
  chunkOriginX: number;
  chunkOriginZ: number;
  isMobile: boolean;
  rngSeedSalt: string;
  /** Optional biome id — drives species selection for trees. */
  biomeId?: string;
}

/**
 * Build the shore-distance field for water waves. The worker assembles it
 * from the per-chunk water masks it cached during generate_terrain (see
 * waterField.ts). `extent` is the water plane's world size; the field is
 * centered on (centerX, centerZ).
 */
export interface BuildWaterFieldRequest {
  type: 'build_water_field';
  id: number;
  centerX: number;
  centerZ: number;
  extent: number;
  texSize: number;
  chunkWidth: number;
  chunkHeight: number;
}

/** Plan a road network over a region (A* over a terrain cost field). The heavy
 *  part — sampling the cost grid + pathfinding — runs in the worker. `params` is
 *  the RoadNetworkParams shape from roadNetwork.ts (structured-cloned). */
export interface BuildRoadNetworkRequest {
  type: 'build_road_network';
  id: number;
  params: any;   // RoadNetworkParams (avoid importing the worker module here)
}

/** Town centres for a world region — the plugin places monuments + cobblestone
 *  plazas at these. Backed by the SAME deterministic super-tile cache the road
 *  bake uses, so it never re-discovers. */
export interface GetTownsRequest {
  type: 'get_towns';
  id: number;
  seed: string;
  terrain: RoadTerrainParams;
  roadConfig: RoadConfig;
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
}

// Future message types:
// export interface PhysicsStepRequest { type: 'physics_step'; ... }
// export interface SpatialQueryRequest { type: 'spatial_query'; ... }
// export interface EntitySyncRequest { type: 'entity_sync'; ... }

export type WorkerRequest =
  | GenerateTerrainRequest
  | GenerateMountainRequest
  | BuildDecorationGeometryRequest
  | BuildWaterFieldRequest
  | BuildRoadNetworkRequest
  | GetTownsRequest;

// ── Responses (worker → main thread) ──

export interface GenerateTerrainResponse {
  type: 'terrain_ready';
  id: number;
  positions: Float32Array;
  colors: Float32Array;
  /** Vertex normals computed in WASM (zero-copy `take*` marshaling).
   *  ABSENT on the JS-fallback path — the main thread then computes them
   *  itself via `computeVertexNormals()` in buildTerrainGeometry. */
  normals?: Float32Array;
  /** Per-vertex road strength 0..1 (1 = road centre). Length = positions/3.
   *  All zeros when roadConfig is absent/disabled. Read by the terrain material
   *  via `attribute('roadStrength')` (WebGPU) / a GLSL varying (WebGL). */
  roadStrength: Float32Array;
  highestPoints: HighestPoint[];
  // Decoration spawn arrays
  grassSpawns: Float32Array;     // [x,y,z, ...] triplets
  boulderSpawns: Float32Array;   // [x,y,z, scale, rotX, rotY, rotZ, ...] x7 per boulder
  treeSpawns: Float32Array;      // [x,y,z, scale, rotation, isComplex, treeSeed, ...] x7 per tree
  shrubSpawns: Float32Array;     // [x,y,z, scale, rotation, shrubSeed, ...] x6 per shrub
  flowerSpawns: Float32Array;    // [x,y,z, scale, rotation, paletteIdx, flowerSeed, ...] x7 per flower
}

export interface GenerateMountainResponse {
  type: 'mountain_ready';
  id: number;
  positions: Float32Array;
  colors: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  interiorDepths?: Float32Array;
}

/**
 * Raw vertex/normal/index/color buffers for a single material group.
 * Indices are Uint32 because merged trees can exceed the 65k 16-bit cap.
 */
export interface BakedMesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  /** Optional per-vertex RGB. Used for species tinting (trees) and
   *  flower-palette baking. */
  colors?: Float32Array;
  /** Optional per-vertex UV. Used for the foliage cross-billboard cards
   *  whose TSL leaf-alpha is procedural in UV space. */
  uvs?: Float32Array;
  /** Optional per-vertex single-float blade height. Grass only — read by
   *  the grass billboard `positionNode` via `attribute('bladeHeight')`. */
  bladeHeight?: Float32Array;
  /** Optional per-vertex single-float blade width. Grass only — read by
   *  the grass billboard `positionNode` via `attribute('bladeWidth')`. */
  bladeWidth?: Float32Array;
}

export interface DecorationGeometryReady {
  type: 'decoration_geometry_ready';
  id: number;
  kind: DecorationKind;
  /**
   * Material-grouped baked meshes. Group keys are decoration-specific:
   *  - trees:    { trunks, foliage }
   *  - boulders: { main }
   *  - shrubs:   { stems, foliage }
   *  - flowers:  { stems, centers, petals }
   *  - grass:    { blades }
   */
  groups: Record<string, BakedMesh>;
  /**
   * Trees only: per-tree physics collider metadata,
   * TREE_COLLIDER_STRIDE (22) floats per tree, chunk-local —
   * [baseX, baseY, baseZ, trunkHalfHeight, trunkRadius, blobCount,
   *  4 × (blobX, blobY, blobZ, blobRadius)].
   * See treeBuilder.ts. Transferred zero-copy alongside the groups.
   */
  treeColliders?: Float32Array;
}

export interface WorkerErrorResponse {
  type: 'error';
  id: number;
  message: string;
}

export interface WorkerReadyResponse {
  type: 'ready';
}

export interface RoadNetworkReady {
  type: 'road_network_ready';
  id: number;
  /** RoadNetworkResult.roads — array of { a, b, points:[[x,z],…] }. */
  roads: Array<{ a: number; b: number; points: Array<[number, number]> }>;
}

export interface TownsReady {
  type: 'towns_ready';
  id: number;
  towns: Array<{ x: number; z: number }>;
}

export type WorkerResponse =
  | GenerateTerrainResponse
  | GenerateMountainResponse
  | DecorationGeometryReady
  | WaterFieldReady
  | RoadNetworkReady
  | TownsReady
  | WorkerErrorResponse
  | WorkerReadyResponse;

export interface WaterFieldReady {
  type: 'water_field_ready';
  id: number;
  /** Interleaved RG: [d, D] per texel, row-major texSize², world units.
   *  R = distance into water from nearest shore, G = water-body max d. */
  data: Float32Array;
  texSize: number;
  originX: number;
  originZ: number;
  extent: number;
}
