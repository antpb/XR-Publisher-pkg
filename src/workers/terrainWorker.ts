/**
 * Terrain Generation Web Worker
 *
 * Primary path: Rust/WASM terrain generation (fast, no Three.js dependency).
 * Fallback path: JS createTerrainMesh (uses Three.js, slower but always works).
 *
 * The WASM binary is loaded from a base64-encoded string to avoid
 * external file dependencies (works in UMD, Electron file://, etc.).
 */
import { createTerrainMesh } from '../components/core/front/terrainHelpers';
import { createMountainGeometry, buildMountainMeshParams } from '../components/core/front/worldHelpers';
import type { WorkerRequest, WorkerResponse, BakedMesh } from './terrainWorker.protocol';
import { buildTreeDecoration } from './decorations/treeBuilder';
import { buildBoulderDecoration } from './decorations/boulderBuilder';
import { buildShrubDecoration } from './decorations/shrubBuilder';
import { buildFlowerDecoration } from './decorations/flowerBuilder';
import { buildGrassDecoration } from './decorations/grassBuilder';
import { bakedMeshTransferables } from './decorations/mergeBuffers';
import { cacheWaterMask, buildWaterField } from './waterField';
import {
  computeRoadNetwork, getChunkRoadSegments, bakeRoadStrength, filterSpawnsOnRoad,
  getTownsInRegion, DEFAULT_ROAD_CONFIG,
} from './roadNetwork';
import type { RoadConfig, RoadTerrainParams } from './roadNetwork';

/** Decoration spawn strides (floats/record) — must match the WASM/JS spawn
 *  arrays and the protocol comments on GenerateTerrainResponse. */
const SPAWN_STRIDES = { grass: 3, boulder: 7, tree: 7, shrub: 6, flower: 7 } as const;

/** Build RoadTerrainParams from the generate_terrain params (field-name remap). */
function roadTerrainOf(p: any): RoadTerrainParams {
  return {
    width: p.width, height: p.height, scale: p.scale, heightScale: p.heightScale,
    octaves: p.noiseOctaves, persistence: p.noisePersistence, lacunarity: p.noiseLacunarity,
    positionY: p.positionY,
  };
}

// Import the WASM bindings and base64 binary statically
// so Vite can bundle everything into the worker without code-splitting.
import { initSync, generate_terrain, generate_mountain_mesh } from './wasm/xr_publisher_world.js';
// @ts-ignore - raw import of base64 WASM binary
import wasmBase64 from './wasm/xr_publisher_world_bg.wasm.b64?raw';

let wasmReady = false;

/**
 * Initialize the WASM module from the inlined base64 binary.
 */
function initWasm(): boolean {
  try {
    // Decode base64 → Uint8Array
    const binaryString = atob(wasmBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Synchronous instantiation from raw bytes
    initSync({ module: bytes });
    wasmReady = true;
    return true;
  } catch (err) {
    console.warn('[terrainWorker] WASM init failed, using JS fallback:', err);
    return false;
  }
}

/**
 * Generate terrain using the WASM module.
 */
interface TerrainGenResult {
  positions: Float32Array;
  colors: Float32Array;
  /** WASM path only — the JS fallback leaves this undefined and the main
   *  thread computes normals itself (buildTerrainGeometry). */
  normals?: Float32Array;
  highestPoints: any[];
  grassSpawns: Float32Array;
  boulderSpawns: Float32Array;
  treeSpawns: Float32Array;
  shrubSpawns: Float32Array;
  flowerSpawns: Float32Array;
}

function generateTerrainWasm(params: any): TerrainGenResult | null {
  if (!wasmReady) return null;

  try {
    // Returns a wasm-bindgen TerrainGenResult handle (same zero-JSON
    // marshaling as generate_mountain_mesh): each take* getter moves a Vec
    // straight into a JS typed array — no JSON string in WASM memory, no
    // JS-side parse, no extra copy. free() releases the handle; it runs in
    // a finally so a throw mid-extraction still frees it.
    const result = generate_terrain(JSON.stringify(params)) as any;
    try {
      return {
        positions: result.takePositions() as Float32Array,
        colors: result.takeColors() as Float32Array,
        normals: result.takeNormals() as Float32Array,
        highestPoints: JSON.parse(result.highestPointsJson() || '[]') || [],
        grassSpawns: result.takeGrassSpawns() as Float32Array,
        boulderSpawns: result.takeBoulderSpawns() as Float32Array,
        treeSpawns: result.takeTreeSpawns() as Float32Array,
        shrubSpawns: result.takeShrubSpawns() as Float32Array,
        flowerSpawns: result.takeFlowerSpawns() as Float32Array,
      };
    } finally {
      result.free();
    }
  } catch (err) {
    console.warn('[terrainWorker] WASM generate_terrain failed:', err);
    return null;
  }
}

/**
 * Generate terrain using the JS fallback (Three.js createTerrainMesh).
 */
function generateTerrainJS(params: any): TerrainGenResult | null {
  const result = createTerrainMesh(params);
  if (!result) return null;

  const positions = (result.geometry.attributes.position.array as Float32Array).slice();
  const colors = (result.geometry.attributes.color.array as Float32Array).slice();
  const highestPoints = result.highestPoints;
  const empty = new Float32Array(0);

  result.geometry.dispose();
  return {
    positions, colors, highestPoints,
    grassSpawns: empty, boulderSpawns: empty, treeSpawns: empty,
    shrubSpawns: empty, flowerSpawns: empty,
  };
}

// Initialize WASM synchronously at worker startup
initWasm();

// Handle messages
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'generate_terrain': {
      try {
        // Try WASM first, fall back to JS
        let result = generateTerrainWasm(msg.params);
        if (!result) {
          result = generateTerrainJS(msg.params);
        }

        if (!result) {
          const errResp: WorkerResponse = {
            type: 'error',
            id: msg.id,
            message: 'Both WASM and JS terrain generation failed',
          };
          self.postMessage(errResp);
          return;
        }

        // Cache this chunk's water mask for the wave shore-distance field
        // BEFORE the positions buffer is transferred away. Derived from
        // the generated heights, so the WASM and JS-fallback paths produce
        // identical masks automatically.
        cacheWaterMask(
          {
            gridX: msg.params.gridX,
            gridZ: msg.params.gridZ,
            segments: msg.params.segments,
            heightScale: msg.params.heightScale,
            width: msg.params.width,
            height: msg.params.height,
          },
          result.positions,
        );

        // ── World roads: bake per-vertex roadStrength + drop spawns on the road.
        // Deterministic, computed in the worker from the cached super-tile road
        // network — KNOWN the moment this chunk is generated, never recomputed as
        // the player moves. Disabled ⇒ an all-zero attribute so the material's
        // attribute('roadStrength') always resolves.
        const roadCfg: RoadConfig | undefined = msg.params.roadConfig;
        let roadStrength: Float32Array = new Float32Array(result.positions.length / 3);
        if (roadCfg && roadCfg.enabled) {
          const terrain = roadTerrainOf(msg.params);
          const seed = msg.params.seed;
          const gx = msg.params.gridX, gz = msg.params.gridZ;
          const w = msg.params.width, h = msg.params.height;
          const segs = getChunkRoadSegments(seed, terrain, roadCfg, {
            gridX: gx, gridZ: gz, width: w, height: h,
          });
          if (segs.length > 0) {
            roadStrength = bakeRoadStrength(result.positions, gx * w, gz * h, segs, roadCfg.roadWidth);
            // Clear decorations off the road surface (+ a small shoulder).
            const reach = roadCfg.roadWidth * 0.5 + 1.5;
            const ox = gx * w, oz = gz * h;
            result.grassSpawns = filterSpawnsOnRoad(result.grassSpawns, SPAWN_STRIDES.grass, ox, oz, segs, reach);
            result.treeSpawns = filterSpawnsOnRoad(result.treeSpawns, SPAWN_STRIDES.tree, ox, oz, segs, reach + 2);
            result.boulderSpawns = filterSpawnsOnRoad(result.boulderSpawns, SPAWN_STRIDES.boulder, ox, oz, segs, reach);
            result.shrubSpawns = filterSpawnsOnRoad(result.shrubSpawns, SPAWN_STRIDES.shrub, ox, oz, segs, reach);
            result.flowerSpawns = filterSpawnsOnRoad(result.flowerSpawns, SPAWN_STRIDES.flower, ox, oz, segs, reach);
          }
        }

        const resp: WorkerResponse = {
          type: 'terrain_ready',
          id: msg.id,
          positions: result.positions,
          colors: result.colors,
          normals: result.normals,
          roadStrength,
          highestPoints: result.highestPoints,
          grassSpawns: result.grassSpawns,
          boulderSpawns: result.boulderSpawns,
          treeSpawns: result.treeSpawns,
          shrubSpawns: result.shrubSpawns,
          flowerSpawns: result.flowerSpawns,
        };

        // Transfer all array buffers (zero-copy)
        const transfers = [
          result.positions.buffer,
          result.colors.buffer,
          ...(result.normals ? [result.normals.buffer] : []),
          roadStrength.buffer,
          result.grassSpawns.buffer,
          result.boulderSpawns.buffer,
          result.treeSpawns.buffer,
          result.shrubSpawns.buffer,
          result.flowerSpawns.buffer,
        ].filter(b => b.byteLength > 0);
        self.postMessage(resp, transfers as any);
      } catch (err) {
        const errResp: WorkerResponse = {
          type: 'error',
          id: msg.id,
          message: err instanceof Error ? err.message : String(err),
        };
        self.postMessage(errResp);
      }
      break;
    }

    case 'build_decoration_geometry': {
      try {
        let groups: Record<string, BakedMesh>;
        let treeColliders: Float32Array | undefined;

        switch (msg.kind) {
          case 'trees': {
            const treeResult = buildTreeDecoration({
              spawns: msg.spawns,
              chunkOriginX: msg.chunkOriginX,
              chunkOriginZ: msg.chunkOriginZ,
              isMobile: msg.isMobile,
              rngSeedSalt: msg.rngSeedSalt,
              biomeId: msg.biomeId,
            });
            groups = treeResult.groups;
            treeColliders = treeResult.treeColliders;
            break;
          }
          case 'boulders':
            groups = buildBoulderDecoration({
              spawns: msg.spawns,
              isMobile: msg.isMobile,
              rngSeedSalt: msg.rngSeedSalt,
            });
            break;
          case 'shrubs':
            groups = buildShrubDecoration({ spawns: msg.spawns });
            break;
          case 'flowers':
            groups = buildFlowerDecoration({ spawns: msg.spawns });
            break;
          case 'grass':
            groups = buildGrassDecoration({
              spawns: msg.spawns,
              isMobile: msg.isMobile,
              rngSeedSalt: msg.rngSeedSalt,
            });
            break;
          default: {
            const errResp: WorkerResponse = {
              type: 'error',
              id: msg.id,
              message: `build_decoration_geometry: unknown kind '${(msg as any).kind}'`,
            };
            self.postMessage(errResp);
            return;
          }
        }

        const resp: WorkerResponse = {
          type: 'decoration_geometry_ready',
          id: msg.id,
          kind: msg.kind,
          groups,
          treeColliders,
        };

        const transfers: ArrayBuffer[] = [];
        for (const key of Object.keys(groups)) {
          for (const buf of bakedMeshTransferables(groups[key])) {
            if (buf.byteLength > 0) transfers.push(buf);
          }
        }
        if (treeColliders && treeColliders.byteLength > 0) {
          transfers.push(treeColliders.buffer as ArrayBuffer);
        }
        self.postMessage(resp, transfers as any);
      } catch (err) {
        const errResp: WorkerResponse = {
          type: 'error',
          id: msg.id,
          message: err instanceof Error ? err.message : String(err),
        };
        self.postMessage(errResp);
      }
      break;
    }

    case 'build_water_field': {
      try {
        const data = buildWaterField(
          msg.centerX,
          msg.centerZ,
          msg.extent,
          msg.texSize,
          msg.chunkWidth,
          msg.chunkHeight,
        );
        const resp: WorkerResponse = {
          type: 'water_field_ready',
          id: msg.id,
          data,
          texSize: msg.texSize,
          originX: msg.centerX - msg.extent / 2,
          originZ: msg.centerZ - msg.extent / 2,
          extent: msg.extent,
        };
        self.postMessage(resp, [data.buffer] as any);
      } catch (err) {
        const errResp: WorkerResponse = {
          type: 'error',
          id: msg.id,
          message: err instanceof Error ? err.message : String(err),
        };
        self.postMessage(errResp);
      }
      break;
    }

    case 'build_road_network': {
      try {
        const result = computeRoadNetwork(msg.params);
        const resp: WorkerResponse = {
          type: 'road_network_ready',
          id: msg.id,
          roads: result.roads,
        };
        self.postMessage(resp);
      } catch (err) {
        const errResp: WorkerResponse = {
          type: 'error',
          id: msg.id,
          message: err instanceof Error ? err.message : String(err),
        };
        self.postMessage(errResp);
      }
      break;
    }

    case 'get_towns': {
      try {
        const cfg = msg.roadConfig ?? { ...DEFAULT_ROAD_CONFIG, enabled: true };
        const towns = getTownsInRegion(msg.seed, msg.terrain, cfg, msg.bounds);
        const resp: WorkerResponse = {
          type: 'towns_ready',
          id: msg.id,
          towns: towns.map((t) => ({ x: t.x, z: t.z })),
        };
        self.postMessage(resp);
      } catch (err) {
        const errResp: WorkerResponse = {
          type: 'error',
          id: msg.id,
          message: err instanceof Error ? err.message : String(err),
        };
        self.postMessage(errResp);
      }
      break;
    }

    case 'generate_mountain': {
      try {
        // `mountain` / `allMountains` arrive via structured clone so the
        // `Map<string, CavernNode>` at `mountain.cavern.nodes` is intact.
        // (JSON.stringify/parse would turn it into `{}` and break
        // `nodes.values()` inside buildMountainMeshParams / createMountainGeometry.)
        const mountain = msg.mountain;
        const allMountains = msg.allMountains;

        let positions: Float32Array | undefined;
        let colors: Float32Array | undefined;
        let normals: Float32Array | undefined;
        let indices: Uint32Array | undefined;
        let interiorDepths: Float32Array | undefined;

        // WASM-first: SDF + marching cubes in Rust. The cavern network +
        // interior-fill PRNG draws stay in JS (buildMountainMeshParams) so
        // the result is bit-comparable to the JS fallback below.
        if (wasmReady) {
          try {
            const params = buildMountainMeshParams(mountain, msg.seed, allMountains);
            // Returns a wasm-bindgen MountainMeshResult handle. The take* getters
            // move each Vec straight into a JS typed array (one copy, no JSON
            // string in WASM memory, no JS-side parse) — see the Rust struct's
            // note on the WASM-heap high-water mark. free() releases the handle.
            const result = generate_mountain_mesh(JSON.stringify(params)) as any;
            positions = result.takePositions() as Float32Array;
            colors = result.takeColors() as Float32Array;
            normals = result.takeNormals() as Float32Array;
            indices = result.takeIndices() as Uint32Array;
            const depths = result.takeInteriorDepths() as Float32Array;
            interiorDepths = depths.length > 0 ? depths : undefined;
            result.free();
          } catch (wasmErr) {
            console.warn('[terrainWorker] WASM mountain gen failed, JS fallback:', wasmErr);
            positions = undefined;
          }
        }

        // JS fallback (createMountainGeometry) — used when WASM is
        // unavailable or threw. Produces a visually identical mesh.
        if (!positions) {
          const geometry = createMountainGeometry(mountain, msg.seed, allMountains);
          if (!geometry) {
            self.postMessage({ type: 'error', id: msg.id, message: 'Mountain geometry generation returned null' } as any);
            return;
          }
          positions = (geometry.attributes.position.array as Float32Array).slice();
          colors = (geometry.attributes.color.array as Float32Array).slice();
          normals = (geometry.attributes.normal.array as Float32Array).slice();
          indices = geometry.index
            ? new Uint32Array(geometry.index.array)
            : new Uint32Array(0);
          interiorDepths = geometry.attributes.interiorDepth
            ? (geometry.attributes.interiorDepth.array as Float32Array).slice()
            : undefined;
          geometry.dispose();
        }

        const resp: any = {
          type: 'mountain_ready',
          id: msg.id,
          positions,
          colors,
          normals,
          indices,
          interiorDepths,
        };

        const transfers = [positions.buffer, colors.buffer, normals.buffer, indices.buffer];
        if (interiorDepths) transfers.push(interiorDepths.buffer);
        self.postMessage(resp, transfers as any);
      } catch (err) {
        self.postMessage({
          type: 'error',
          id: msg.id,
          message: err instanceof Error ? err.message : String(err),
        } as any);
      }
      break;
    }
  }
};

// Signal ready
const readyResp: WorkerResponse = { type: 'ready' };
self.postMessage(readyResp);
