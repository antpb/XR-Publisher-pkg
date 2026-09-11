/**
 * TerrainWorkerClient
 *
 * Main-thread singleton that manages a terrain Web Worker.
 * Provides a Promise-based API for async terrain generation.
 * Falls back to synchronous main-thread generation if the
 * worker fails to load (e.g. restrictive CSP, UMD context).
 *
 * Handles cross-origin worker loading by wrapping the script
 * in a same-origin Blob URL when the direct URL is blocked.
 */
import { createTerrainMesh } from '../components/core/front/terrainHelpers';
import { createMountainGeometry } from '../components/core/front/worldHelpers';
import type {
  TerrainParams,
  HighestPoint,
  WorkerRequest,
  WorkerResponse,
  BakedMesh,
  DecorationKind,
} from '../workers/terrainWorker.protocol';
import {
  computeRoadNetwork, getTownsInRegion, getChunkRoadSegments, bakeRoadStrength,
} from '../workers/roadNetwork';
import type {
  RoadNetworkParams, RoadNetworkResult, RoadConfig, RoadTerrainParams,
} from '../workers/roadNetwork';
// `?worker&inline` tells Vite to bundle the worker as a base64-inlined
// blob URL constructor. Single UMD upload contains its own worker — no
// sibling `assets/terrainWorker-*.js` file to ship, no `data:`-URL
// bailout at runtime. The import default is a constructor.
import TerrainWorkerCtor from '../workers/terrainWorker.ts?worker&inline';

export type { BakedMesh, DecorationKind } from '../workers/terrainWorker.protocol';

export interface TerrainArrays {
  positions: Float32Array;
  colors: Float32Array;
  /** WASM-computed vertex normals — undefined on the JS/main-thread
   *  fallback paths (buildTerrainGeometry then computes them itself). */
  normals?: Float32Array;
  /** Per-vertex road strength 0..1 (all zeros when roads disabled). */
  roadStrength: Float32Array;
  highestPoints: HighestPoint[];
  // Decoration spawn arrays (pre-computed in WASM, empty from JS fallback)
  grassSpawns: Float32Array;
  boulderSpawns: Float32Array;
  treeSpawns: Float32Array;
  shrubSpawns: Float32Array;
  flowerSpawns: Float32Array;
}

export interface MountainArrays {
  positions: Float32Array;
  colors: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  interiorDepths?: Float32Array;
}

export interface DecorationGeometryResult {
  /** Material-grouped baked meshes (see protocol DecorationGeometryReady). */
  groups: Record<string, BakedMesh>;
  /** Trees only: per-tree collider metadata (22 floats/tree, chunk-local). */
  treeColliders?: Float32Array;
}

export interface WaterFieldData {
  /** Interleaved RG [shoreDistance, bodyMaxDistance] per texel, texSize². */
  data: Float32Array;
  texSize: number;
  originX: number;
  originZ: number;
  extent: number;
}

/** Extra scheduling hints accepted by the chunk/mountain-associated methods.
 *  All optional — omitting them preserves the old FIFO behaviour. */
export interface ScheduleOpts {
  /** Abort while still QUEUED drops the job before the worker touches it
   *  (the fast-movement win — a chunk you've flown past never gets built).
   *  A job already in flight completes normally; the caller's own
   *  aborted/cancelled guard ignores the late result, as it always has. */
  signal?: AbortSignal;
  /** World-space centre for distance ordering (tier-1 jobs). Nearer the
   *  player ⇒ scheduled sooner. */
  centerX?: number;
  centerZ?: number;
}

/** Scheduling tier. Lower runs first. Tier 0 = infrequent control jobs
 *  (roads, towns, water) kept FIFO and never starved; tier 1 = the streaming
 *  flood (terrain, mountains, decorations) ordered by distance to the player. */
type JobTier = 0 | 1;

/** Per-kind distance bias (world units) for decoration builds — soft
 *  priority inside tier 1 (see QueuedJob.bias). Trees pop the most and
 *  build fast; grass is the most expensive build (~400k verts) but masks
 *  its own latency behind a self-delay and a 400ms fade. At chunk width
 *  100: 60 ≈ 0.6 chunks, 150 ≈ 1.5 chunks. */
const DECORATION_BIAS: Record<DecorationKind, number> = {
  trees: 0,
  boulders: 60,
  shrubs: 60,
  flowers: 60,
  grass: 150,
};

interface QueuedJob {
  id: number;
  request: WorkerRequest;
  transfer: Transferable[];
  resolve: (result: any) => void;
  reject: (err: Error) => void;
  tier: JobTier;
  /** World XZ for distance ordering; NaN when non-positional. */
  x: number;
  z: number;
  /** Distance bias in WORLD UNITS added to this job's effective distance
   *  when competing inside tier 1 — a soft per-kind priority. A job with
   *  bias 150 sorts as if it were 150u farther from the player, so at
   *  equal distance a bias-0 job (terrain, trees) always beats it, while a
   *  genuinely much-nearer biased job still wins. Never starves anything. */
  bias: number;
  /** Insertion order — FIFO tie-break within a tier. */
  seq: number;
  signal?: AbortSignal;
  onAbort?: () => void;
  /** `?perfdebug` timestamps (performance.now()); 0 when not measuring. */
  tEnqueue: number;
  tDispatch: number;
}

/** How many jobs may sit in the worker's own message queue at once. The
 *  worker is single-threaded, so 1 active + 1 buffered keeps it from ever
 *  idling between jobs while surrendering only ONE job's worth of reorder
 *  latency (the backlog that matters when moving fast is dozens of chunks,
 *  so committing one ahead is negligible). Raising this trades reorder
 *  responsiveness for a bigger anti-idle cushion. */
const MAX_IN_FLIGHT = 2;

/** `?perfdebug` — per-job-kind queue-wait / in-worker timing, summarized to
 *  the console every 5s. `inWorker` includes up to one buffered job's run
 *  time (MAX_IN_FLIGHT=2 keeps one job queued inside the worker itself), so
 *  read it as an upper bound — good enough to rank kinds and spot regressions. */
const PERF_DEBUG = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('perfdebug');

interface PerfStat {
  count: number;
  totalWait: number;
  maxWait: number;
  totalRun: number;
  maxRun: number;
}

const perfStats = new Map<string, PerfStat>();
let perfLogTimer: ReturnType<typeof setInterval> | null = null;

function perfKeyOf(request: WorkerRequest): string {
  return request.type === 'build_decoration_geometry'
    ? `${request.type}:${request.kind}`
    : request.type;
}

function perfRecord(key: string, queueWait: number, inWorker: number) {
  let s = perfStats.get(key);
  if (!s) {
    s = { count: 0, totalWait: 0, maxWait: 0, totalRun: 0, maxRun: 0 };
    perfStats.set(key, s);
  }
  s.count++;
  s.totalWait += queueWait;
  s.maxWait = Math.max(s.maxWait, queueWait);
  s.totalRun += inWorker;
  s.maxRun = Math.max(s.maxRun, inWorker);

  if (!perfLogTimer) {
    perfLogTimer = setInterval(() => {
      if (perfStats.size === 0) return;
      const rows: Record<string, Record<string, number>> = {};
      for (const [k, st] of perfStats) {
        rows[k] = {
          count: st.count,
          avgWaitMs: Math.round(st.totalWait / st.count),
          maxWaitMs: Math.round(st.maxWait),
          avgRunMs: Math.round(st.totalRun / st.count),
          maxRunMs: Math.round(st.maxRun),
        };
      }
      console.log('[terrainWorker perf] queueWait = enqueue→dispatch, run ≤ dispatch→response (includes 1 buffered job)');
      console.table(rows);
    }, 5000);
  }
}

class TerrainWorkerClient {
  private worker: Worker | null = null;
  /** Jobs handed to the worker, awaiting a response (≤ MAX_IN_FLIGHT). */
  private inFlight = new Map<number, QueuedJob>();
  /** Jobs waiting for a free in-flight slot — reordered by pickNext(). */
  private queue: QueuedJob[] = [];
  private nextId = 0;
  private seq = 0;
  private ready: Promise<void>;
  private fallbackMode = false;

  constructor() {
    this.ready = this.init();
  }

  /**
   * Enqueue a worker job. Actual dispatch is metered by pump() so the client
   * — not the browser's FIFO message queue — controls ordering. Returns the
   * result promise; if `signal` aborts while the job is still queued the
   * promise is left UNSETTLED (the caller is unmounting and already ignores
   * late results via its own guard — settling would either surface an
   * unhandled rejection or trip the `.catch` main-thread fallback).
   */
  private enqueue<T>(
    request: WorkerRequest,
    transfer: Transferable[],
    tier: JobTier,
    x: number,
    z: number,
    signal?: AbortSignal,
    bias = 0,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (signal?.aborted) return; // never care about an already-dead request
      const job: QueuedJob = {
        id: request.id, request, transfer, resolve, reject,
        tier, x, z, bias, seq: this.seq++, signal,
        tEnqueue: PERF_DEBUG ? performance.now() : 0,
        tDispatch: 0,
      };
      if (signal) {
        job.onAbort = () => this.abortJob(job);
        signal.addEventListener('abort', job.onAbort, { once: true });
      }
      this.queue.push(job);
      this.pump();
    });
  }

  /** Detach a job's abort listener (on completion or cancellation). */
  private clearAbort(job: QueuedJob) {
    if (job.signal && job.onAbort) {
      job.signal.removeEventListener('abort', job.onAbort);
      job.onAbort = undefined;
    }
  }

  /** Cancel a queued job. In-flight jobs are left to finish (can't unsend a
   *  postMessage) — the caller's guard drops the result. */
  private abortJob(job: QueuedJob) {
    const i = this.queue.indexOf(job);
    if (i !== -1) this.queue.splice(i, 1);
    this.clearAbort(job);
    // Deliberately do NOT resolve/reject — see enqueue().
  }

  /** Fill free in-flight slots with the highest-priority queued jobs. */
  private pump() {
    if (!this.worker) return;
    while (this.inFlight.size < MAX_IN_FLIGHT && this.queue.length > 0) {
      const job = this.takeNext();
      if (!job) break;
      if (PERF_DEBUG) job.tDispatch = performance.now();
      this.inFlight.set(job.id, job);
      this.worker.postMessage(job.request, job.transfer as any);
    }
  }

  /** Remove and return the next job: lowest tier first, then nearest to the
   *  player (tier 1), then FIFO. O(n) scan — n is a handful to a few dozen. */
  private takeNext(): QueuedJob | null {
    if (this.queue.length === 0) return null;
    const ps = typeof window !== 'undefined' ? (window as any).__xrPlayerState : null;
    const px = ps?.x, pz = ps?.z;
    const havePlayer = typeof px === 'number' && typeof pz === 'number';

    let bestIdx = 0;
    let best = this.queue[0];
    for (let i = 1; i < this.queue.length; i++) {
      if (this.jobBefore(this.queue[i], best, havePlayer, px, pz)) {
        best = this.queue[i];
        bestIdx = i;
      }
    }
    this.queue.splice(bestIdx, 1);
    return best;
  }

  /** True when job `a` should run before job `b`. Tier-1 jobs compare by
   *  effective distance = real distance + per-kind bias (see QueuedJob.bias)
   *  so cheap-but-urgent kinds (terrain, trees) build before expensive
   *  deferrable ones (grass) at comparable distance. */
  private jobBefore(a: QueuedJob, b: QueuedJob, havePlayer: boolean, px: number, pz: number): boolean {
    if (a.tier !== b.tier) return a.tier < b.tier;
    if (a.tier === 1 && havePlayer && !Number.isNaN(a.x) && !Number.isNaN(b.x)) {
      const da = Math.hypot(a.x - px, a.z - pz) + a.bias;
      const db = Math.hypot(b.x - px, b.z - pz) + b.bias;
      if (da !== db) return da < db;
    }
    return a.seq < b.seq;
  }

  private async init(): Promise<void> {
    try {
      // `?worker&inline` import is a constructor. Vite has already emitted a
      // blob-URL shim inside the bundle, so this works in ES and UMD without
      // any sibling worker file at runtime.
      this.worker = new TerrainWorkerCtor();
    } catch (err) {
      console.warn('Failed to create terrain worker, using fallback:', err);
      this.fallbackMode = true;
      return;
    }

    try {
      this.worker.onmessage = this.handleMessage.bind(this);

      // Wait for the 'ready' message (worker loaded + WASM initialized).
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Terrain worker init timeout, switching to fallback');
          this.fallbackMode = true;
          resolve();
        }, 5000);

        // Catch worker-level errors (script load failures, uncaught exceptions).
        this.worker!.onerror = (e) => {
          console.warn('Terrain worker error during init:', e);
          clearTimeout(timeout);
          this.fallbackMode = true;
          resolve();
        };

        const handler = this.handleMessage.bind(this);
        this.worker!.onmessage = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.type === 'ready') {
            clearTimeout(timeout);
            // Switch to normal message handler
            this.worker!.onmessage = handler;
            this.worker!.onerror = (ev) => {
              console.warn('Terrain worker error:', ev);
              this.fallbackMode = true;
              // Worker is gone — fail everything so callers recover (their
              // `.catch` runs the main-thread fallback; unguarded terrain
              // callers just skip). Reject in-flight AND queued jobs.
              for (const [id, job] of this.inFlight) {
                this.clearAbort(job);
                job.reject(new Error('Worker error'));
                this.inFlight.delete(id);
              }
              for (const job of this.queue) {
                this.clearAbort(job);
                job.reject(new Error('Worker error'));
              }
              this.queue.length = 0;
            };
            resolve();
          }
        };
      });
    } catch (err) {
      console.warn('Failed to initialize terrain worker, using fallback:', err);
      this.fallbackMode = true;
    }
  }

  /** Pull a completed job out of the in-flight set and free its abort
   *  listener. Returns null if the id is unknown (already aborted/disposed). */
  private takeInFlight(id: number): QueuedJob | null {
    const job = this.inFlight.get(id);
    if (!job) return null;
    this.inFlight.delete(id);
    this.clearAbort(job);
    if (PERF_DEBUG && job.tDispatch > 0) {
      const now = performance.now();
      perfRecord(perfKeyOf(job.request), job.tDispatch - job.tEnqueue, now - job.tDispatch);
    }
    return job;
  }

  private handleMessage(e: MessageEvent<WorkerResponse>) {
    const msg = e.data;

    if (msg.type === 'mountain_ready') {
      const job = this.takeInFlight(msg.id);
      job?.resolve({
        positions: msg.positions,
        colors: msg.colors,
        normals: msg.normals,
        indices: msg.indices,
        interiorDepths: msg.interiorDepths,
      } as MountainArrays);
    } else if (msg.type === 'terrain_ready') {
      const job = this.takeInFlight(msg.id);
      job?.resolve({
        positions: msg.positions,
        colors: msg.colors,
        normals: msg.normals,
        roadStrength: msg.roadStrength || new Float32Array(msg.positions.length / 3),
        highestPoints: msg.highestPoints,
        grassSpawns: msg.grassSpawns || new Float32Array(0),
        boulderSpawns: msg.boulderSpawns || new Float32Array(0),
        treeSpawns: msg.treeSpawns || new Float32Array(0),
        shrubSpawns: msg.shrubSpawns || new Float32Array(0),
        flowerSpawns: msg.flowerSpawns || new Float32Array(0),
      });
    } else if (msg.type === 'decoration_geometry_ready') {
      const job = this.takeInFlight(msg.id);
      job?.resolve({ groups: msg.groups, treeColliders: msg.treeColliders });
    } else if (msg.type === 'water_field_ready') {
      const job = this.takeInFlight(msg.id);
      job?.resolve({
        data: msg.data,
        texSize: msg.texSize,
        originX: msg.originX,
        originZ: msg.originZ,
        extent: msg.extent,
      });
    } else if (msg.type === 'road_network_ready') {
      const job = this.takeInFlight(msg.id);
      job?.resolve({ roads: msg.roads });
    } else if (msg.type === 'towns_ready') {
      const job = this.takeInFlight(msg.id);
      job?.resolve(msg.towns);
    } else if (msg.type === 'error') {
      const job = this.takeInFlight(msg.id);
      job?.reject(new Error(msg.message));
    }

    // A slot just freed (or the id was unknown) — dispatch the next best job.
    this.pump();
  }

  /** Plan a road network (A* over a terrain cost field) off the main thread.
   *  Falls back to a synchronous main-thread compute when no worker is available
   *  (UMD data:-URL build) — a one-time ~100ms cost. */
  async buildRoadNetwork(params: RoadNetworkParams): Promise<RoadNetworkResult> {
    if (!this.fallbackMode) {
      await this.ready;
    }
    if (this.fallbackMode || !this.worker) {
      // No worker (UMD data:-URL build): plan on the main thread. One-time
      // ~100ms for a region — acceptable for a road build that happens rarely.
      return computeRoadNetwork(params);
    }
    // Tier 0: infrequent control job, kept ahead of the streaming flood.
    return this.enqueue<RoadNetworkResult>(
      { type: 'build_road_network', id: this.nextId++, params },
      [], 0, NaN, NaN,
    );
  }

  /** Town centres for a world region (deterministic super-tile cache). The
   *  plugin places monuments + cobblestone plazas here. Falls back to a
   *  synchronous main-thread discovery when no worker is available. */
  async getTowns(
    seed: string, terrain: RoadTerrainParams, roadConfig: RoadConfig,
    bounds: { minX: number; minZ: number; maxX: number; maxZ: number },
  ): Promise<Array<{ x: number; z: number }>> {
    if (!this.fallbackMode) await this.ready;
    if (this.fallbackMode || !this.worker) {
      return getTownsInRegion(seed, terrain, roadConfig, bounds).map((t) => ({ x: t.x, z: t.z }));
    }
    // Tier 0: infrequent control job.
    return this.enqueue(
      { type: 'get_towns', id: this.nextId++, seed, terrain, roadConfig, bounds },
      [], 0, NaN, NaN,
    );
  }

  async generateTerrain(params: TerrainParams, opts?: ScheduleOpts): Promise<TerrainArrays> {
    if (this.fallbackMode) {
      return this.generateFallback(params);
    }

    await this.ready;

    if (this.fallbackMode) {
      return this.generateFallback(params);
    }

    // Chunk world centre for distance ordering — the caller passes the chunk's
    // world position as params.positionX/Z (InfiniteTerrain: gridX*width).
    const cx = opts?.centerX ?? params.positionX ?? NaN;
    const cz = opts?.centerZ ?? params.positionZ ?? NaN;
    return this.enqueue<TerrainArrays>(
      { type: 'generate_terrain', id: this.nextId++, params },
      [], 1, cx, cz, opts?.signal,
    );
  }

  /**
   * Ask the worker to build merged decoration geometry for a chunk.
   *
   * Returns a record of material-grouped BakedMesh, e.g. trees →
   * `{ trunks, foliage }`. The component wraps each group in one
   * BufferGeometry + Mesh on the main thread, attaches its existing
   * shared material, and adds it to the chunk's group.
   *
   * Returns `null` when the worker is unavailable (UMD data:URL path,
   * spawn fetch failed, etc.) so the caller can fall back to its
   * existing per-instance main-thread builder with one null check
   * rather than throw-handling.
   */
  async buildDecorationGeometry(
    kind: DecorationKind,
    spawns: Float32Array,
    chunkOriginX: number,
    chunkOriginZ: number,
    isMobile: boolean,
    rngSeedSalt: string,
    biomeId?: string,
    opts?: ScheduleOpts,
  ): Promise<DecorationGeometryResult | null> {
    if (this.fallbackMode) return null;
    await this.ready;
    if (this.fallbackMode || !this.worker) return null;
    if (!spawns || spawns.length === 0) return null;

    // Copy the spawn array before sending — it's tiny (a few hundred
    // bytes per decoration kind per chunk) so structured-clone cost is
    // irrelevant, and copying lets the parent component keep its
    // spawn ref intact for other consumers (e.g. WebGL twins reading
    // the same array, or future re-uses).
    const spawnsCopy = new Float32Array(spawns);

    // Distance ordering uses the chunk world centre — callers pass it via
    // opts (some kinds, e.g. grass, send chunkOrigin 0,0 for chunk-local
    // vertex coords, so chunkOrigin alone can't locate them).
    const cx = opts?.centerX ?? chunkOriginX ?? NaN;
    const cz = opts?.centerZ ?? chunkOriginZ ?? NaN;
    // Soft per-kind priority (world-unit distance bias, see QueuedJob.bias):
    // trees pop visibly and are cheap to build → no bias; grass is the most
    // expensive build but hides its own latency (self-delay + 400ms fade) →
    // it yields to anything within ~1.5 chunks of its distance. Terrain and
    // mountains enqueue with bias 0 elsewhere.
    const bias = DECORATION_BIAS[kind] ?? 0;
    return this.enqueue<DecorationGeometryResult | null>(
      {
        type: 'build_decoration_geometry',
        id: this.nextId++,
        kind,
        spawns: spawnsCopy,
        chunkOriginX,
        chunkOriginZ,
        isMobile,
        rngSeedSalt,
        biomeId,
      },
      [spawnsCopy.buffer], 1, cx, cz, opts?.signal, bias,
    );
  }

  /**
   * Build the water shore-distance field from the worker's cached chunk
   * masks. Returns null when the worker is unavailable (UMD fallback) —
   * the water plane then stays flat, gracefully.
   */
  async buildWaterField(
    centerX: number,
    centerZ: number,
    extent: number,
    texSize: number,
    chunkWidth: number,
    chunkHeight: number,
  ): Promise<WaterFieldData | null> {
    if (this.fallbackMode) return null;
    await this.ready;
    if (this.fallbackMode || !this.worker) return null;

    // Tier 0: the water field is already player-centred and infrequent —
    // keep it ahead of the streaming flood so waves don't lag behind terrain.
    return this.enqueue<WaterFieldData | null>(
      {
        type: 'build_water_field',
        id: this.nextId++,
        centerX,
        centerZ,
        extent,
        texSize,
        chunkWidth,
        chunkHeight,
      },
      [], 0, NaN, NaN,
    );
  }

  /**
   * Mountain meshes are the single most expensive job this worker runs — an
   * SDF + marching-cubes build measured at 235-915ms EACH in a profile, where
   * three of them accounted for 83% of all worker time. The worker is
   * single-threaded and shared, so while one runs, every terrain chunk, tree
   * and grass build queues behind it.
   *
   * They are also perfectly deterministic (same id + seed ⇒ same mesh), and
   * `MountainMesh` unmounts them as you roam out of range — so without a cache
   * walking back and forth across one mountain re-paid ~1s of blocking worker
   * time on every re-entry. Cache the raw arrays and hand the same buffers to
   * the next `buildMountainGeometry` (BufferAttributes only read them, and
   * geometry.dispose() frees GPU buffers, not these).
   *
   * Bounded by BYTES, not entry count: mountain meshes vary hugely in size and
   * this has to stay safe on the mobile memory ceiling. In-flight requests are
   * shared so two mounts of the same mountain never queue two jobs.
   */
  private mountainCache = new Map<string, MountainArrays>();
  private mountainCacheBytes = 0;
  private mountainInFlight = new Map<string, Promise<MountainArrays>>();

  /** Held JS memory, so it's budgeted against the device: phones sit under a
   *  hard per-tab ceiling (iOS Safari's watchdog kills the tab, it doesn't
   *  swap), and a single mountain mesh can be several MB. */
  private static readonly MOUNTAIN_CACHE_MAX_BYTES =
    (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
      ? 12 * 1024 * 1024
      : 48 * 1024 * 1024;

  private static mountainBytes(a: MountainArrays): number {
    return (a.positions?.byteLength ?? 0) + (a.colors?.byteLength ?? 0)
      + (a.normals?.byteLength ?? 0) + (a.indices?.byteLength ?? 0)
      + (a.interiorDepths?.byteLength ?? 0);
  }

  private cacheMountain(key: string, arrays: MountainArrays): void {
    const bytes = TerrainWorkerClient.mountainBytes(arrays);
    // Never let one huge mesh evict the whole cache to still not fit.
    if (bytes > TerrainWorkerClient.MOUNTAIN_CACHE_MAX_BYTES) return;
    this.mountainCache.set(key, arrays);
    this.mountainCacheBytes += bytes;
    // FIFO eviction (insertion-ordered Map) — re-inserting on hit below makes
    // it an LRU without a second structure.
    while (this.mountainCacheBytes > TerrainWorkerClient.MOUNTAIN_CACHE_MAX_BYTES) {
      const oldest = this.mountainCache.keys().next().value;
      if (oldest === undefined) break;
      const victim = this.mountainCache.get(oldest)!;
      this.mountainCache.delete(oldest);
      this.mountainCacheBytes -= TerrainWorkerClient.mountainBytes(victim);
    }
  }

  async generateMountain(
    mountain: any, seed: string, allMountains: any[], opts?: ScheduleOpts,
  ): Promise<MountainArrays> {
    const key = `${seed}::${mountain?.id}`;
    const cached = mountain?.id !== undefined ? this.mountainCache.get(key) : undefined;
    if (cached) {
      // Refresh recency (Map keeps insertion order).
      this.mountainCache.delete(key);
      this.mountainCache.set(key, cached);
      return cached;
    }
    const pending = this.mountainInFlight.get(key);
    if (pending) return pending;

    if (this.fallbackMode) {
      return this.generateMountainFallback(mountain, seed, allMountains);
    }

    await this.ready;

    if (this.fallbackMode) {
      return this.generateMountainFallback(mountain, seed, allMountains);
    }

    const cx = opts?.centerX ?? mountain?.worldX ?? NaN;
    const cz = opts?.centerZ ?? mountain?.worldZ ?? NaN;
    const job = this.enqueue<MountainArrays>(
      { type: 'generate_mountain', id: this.nextId++, mountain, seed, allMountains },
      [], 1, cx, cz, opts?.signal,
    ).then((arrays) => {
      this.mountainInFlight.delete(key);
      if (mountain?.id !== undefined && arrays) this.cacheMountain(key, arrays);
      return arrays;
    }, (err) => {
      this.mountainInFlight.delete(key);
      throw err;
    });
    // NOTE: an aborted-while-queued job never settles (by design — see the
    // enqueue docs), so this entry is dropped rather than left forever.
    if (opts?.signal) {
      opts.signal.addEventListener('abort', () => this.mountainInFlight.delete(key), { once: true });
    }
    if (mountain?.id !== undefined) this.mountainInFlight.set(key, job);
    return job;
  }

  private generateMountainFallback(mountain: any, seed: string, allMountains: any[]): MountainArrays {
    const geometry = createMountainGeometry(mountain, seed, allMountains);
    if (!geometry) {
      throw new Error('createMountainGeometry returned null');
    }
    const positions = (geometry.attributes.position.array as Float32Array).slice();
    const colors = (geometry.attributes.color.array as Float32Array).slice();
    const normals = (geometry.attributes.normal.array as Float32Array).slice();
    const indices = geometry.index ? new Uint32Array(geometry.index.array) : new Uint32Array(0);
    const interiorDepths = geometry.attributes.interiorDepth
      ? (geometry.attributes.interiorDepth.array as Float32Array).slice()
      : undefined;
    geometry.dispose();
    return { positions, colors, normals, indices, interiorDepths };
  }

  private generateFallback(params: TerrainParams): TerrainArrays {
    const result = createTerrainMesh(params);
    if (!result) {
      throw new Error('createTerrainMesh returned null');
    }
    const positions = (result.geometry.attributes.position.array as Float32Array).slice();
    const colors = (result.geometry.attributes.color.array as Float32Array).slice();
    const highestPoints = result.highestPoints;
    result.geometry.dispose();

    // Roads in fallback (UMD/no-worker): bake the same per-vertex roadStrength so
    // the terrain material's attribute always resolves and roads still render.
    let roadStrength: Float32Array = new Float32Array(positions.length / 3);
    const roadCfg = params.roadConfig;
    if (roadCfg && roadCfg.enabled) {
      const terrain: RoadTerrainParams = {
        width: params.width, height: params.height, scale: params.scale,
        heightScale: params.heightScale, octaves: params.noiseOctaves,
        persistence: params.noisePersistence, lacunarity: params.noiseLacunarity,
        positionY: params.positionY,
      };
      const segs = getChunkRoadSegments(params.seed, terrain, roadCfg, {
        gridX: params.gridX, gridZ: params.gridZ, width: params.width, height: params.height,
      });
      if (segs.length > 0) {
        roadStrength = bakeRoadStrength(
          positions, params.gridX * params.width, params.gridZ * params.height, segs, roadCfg.roadWidth,
        );
      }
    }

    // Fallback doesn't compute decorations — components fall back to their own logic
    const empty = new Float32Array(0);
    return {
      positions, colors, roadStrength, highestPoints,
      grassSpawns: empty,
      boulderSpawns: empty,
      treeSpawns: empty,
      shrubSpawns: empty,
      flowerSpawns: empty,
    };
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    for (const [, job] of this.inFlight) {
      this.clearAbort(job);
      job.reject(new Error('Worker disposed'));
    }
    this.inFlight.clear();
    for (const job of this.queue) {
      this.clearAbort(job);
      job.reject(new Error('Worker disposed'));
    }
    this.queue.length = 0;
  }
}

// Singleton instance
export const terrainWorker = new TerrainWorkerClient();
