/**
 * worldState — persisted per-world plugin state.
 *
 * Deterministic decorations always spawn in the same place (spawn.seed is
 * stable), so the world can meaningfully persist STATE for them: a farm plot
 * that was harvested, a switch that was flipped — surviving reloads and shared
 * across visitors. This module is the runtime client for that store:
 *
 *  - An in-memory SNAPSHOT (plugin → key → record) that plugins read
 *    SYNCHRONOUSLY (decoration create() is sync-only — build from the
 *    snapshot, mutate live objects when fresh state arrives).
 *  - `fetchWorldState(plugin, {prefix|keys})` pulls records over HTTP as the
 *    player roams — spawn.seed strings embed chunk coords, so a per-chunk
 *    PREFIX fetch covers everything the chunk will mount. (Terrain-anchored
 *    spawns only: tree/mountain anchor seeds carry no chunk coords.)
 *  - `setWorldState` applies optimistically, broadcasts to room peers on the
 *    reserved channel, and POSTs to the API. The server enforces a distance
 *    rule (the writer's reported position must be within ~32u of the record)
 *    plus rate limits — honor-system hardening against cross-map griefing.
 *  - Merge rule EVERYWHERE (fetch / broadcast / optimistic): newer
 *    `updatedAt` wins — ordering-safe and idempotent across all three paths.
 *
 * POSITIONS ARE RENDER-FRAME world XZ (what getPlayerState() returns). Store
 * `spawn.renderPosition` — it is render-frame for every anchor type. (The
 * legacy `spawn.worldPosition` is the worker frame, ½ chunk higher on both
 * axes, and needed a −chunkSize/2 correction; treat it as deprecated.)
 *
 * Degrades gracefully: no API base ⇒ fetch resolves {} and sets return false
 * after the optimistic apply (session-only state); no networking ⇒
 * broadcastCustom no-ops; a failing fetch warns once and backs off 60s FOR
 * THAT QUERY (other plugins/chunks keep fetching).
 *
 * Plain singleton — no React/three imports; NetworkBridge is accessed lazily
 * so node harnesses can import this module directly.
 */
import { getNetworkBridge } from '../networking/NetworkBridge';
import { getApiBase as getConfiguredApiBase } from '../config/apiConfig';

/** Reserved channel — plugins must not use it (see broadcast() docs). */
export const WORLD_STATE_CHANNEL = '__xrp:worldState';

const FETCH_BACKOFF_MS = 60_000;

export interface WorldStateRecord {
  value: unknown;
  updatedAt: number;
  pos?: [number, number] | null;
}

interface WireSet {
  t: 'set';
  plugin: string;
  key: string;
  value: unknown;
  updatedAt: number;
  pos?: [number, number];
}

let apiBase: string | null | undefined;   // undefined = derive; null = disabled
let configuredWorldKey: string | null = null;
let defaultTtlSeconds = 24 * 3600;
let postSlug = '';
let syncStarted = false;
let warnedFetchFailure = false;

// Backoff is PER QUERY, not global: one plugin's failing prefix used to
// suppress every other plugin's fetches for a full minute (a 404-ing query
// silently froze unrelated world state). Bounded FIFO like queryFetchedAt.
const queryFailedAt = new Map<string, number>();

// Per-query freshness + in-flight coalescing (see fetchWorldState maxAgeMs).
const queryFetchedAt = new Map<string, number>();
const queryInFlight = new Map<string, Promise<Record<string, WorldStateRecord>>>();

const snapshot = new Map<string, Map<string, WorldStateRecord>>();
const listeners = new Set<(plugin: string, key: string, rec: WorldStateRecord) => void>();

const bridge = () => getNetworkBridge();

function bucket(plugin: string): Map<string, WorldStateRecord> {
  let b = snapshot.get(plugin);
  if (!b) { b = new Map(); snapshot.set(plugin, b); }
  return b;
}

/** Merge one record; returns true when it was newer and applied. */
function applyRecord(plugin: string, key: string, rec: WorldStateRecord): boolean {
  const b = bucket(plugin);
  const existing = b.get(key);
  if (existing && existing.updatedAt > rec.updatedAt) return false;
  b.set(key, rec);
  listeners.forEach((l) => {
    try { l(plugin, key, rec); } catch (err) {
      console.warn('[XRPublisher] worldState listener threw', err);
    }
  });
  return true;
}

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/** index.tsx passes the runtime's postSlug during init (hash-fallback input). */
export function setWorldStatePostSlug(slug: string): void {
  postSlug = slug || '';
}

export function configureWorldState(opts: {
  /** API origin (e.g. 'https://your-worker.example.workers.dev').
   *  '' = same origin. null disables HTTP entirely. Default: same origin. */
  apiBase?: string | null;
  /** Override the derived world key (e.g. 'author/slug'). */
  worldKey?: string;
  /** Default TTL for setWorldState records (server clamps 60s..30d). */
  defaultTtlSeconds?: number;
}): void {
  if (opts.apiBase !== undefined) apiBase = opts.apiBase;
  if (opts.worldKey !== undefined) configuredWorldKey = opts.worldKey || null;
  if (opts.defaultTtlSeconds !== undefined && opts.defaultTtlSeconds > 0) {
    defaultTtlSeconds = opts.defaultTtlSeconds;
  }
  // A reconfigure lifts any fetch backoff + freshness cache (target changed).
  queryFailedAt.clear();
  warnedFetchFailure = false;
  queryFetchedAt.clear();
}

/**
 * The key this world's state is stored under:
 *  1. configureWorldState({worldKey}) override;
 *  2. published-world URL path `/{author}/{slug}/…` → 'author/slug';
 *  3. fallback hash of (hostname | postSlug | terrain seed) — stable for
 *     self-hosted worlds without a registry identity.
 */
export function getWorldStateKey(): string {
  if (configuredWorldKey) return configuredWorldKey;
  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    // '/{author}/{slug}/{slug}.html' or '/directory/{author}/{slug}'
    if (parts.length >= 2) {
      if (parts[0] === 'directory' && parts.length >= 3) return `${parts[1]}/${parts[2]}`;
      if (parts.length >= 3 && parts[2].endsWith('.html')) return `${parts[0]}/${parts[1]}`;
    }
    const seed = (window as unknown as { __xrWorldSeed?: string }).__xrWorldSeed ?? '';
    return `h:${fnv1a(`${window.location.hostname}|${postSlug}|${seed}`)}`;
  }
  return `h:${fnv1a(postSlug)}`;
}

function resolveApiBase(): string | null {
  if (apiBase === null) return null;
  if (typeof apiBase === 'string') return apiBase.replace(/\/$/, '');
  // Default: the shared config chain (XRPublisherOptions.apiBase /
  // setApiBase → window.XRP_API_BASE → localStorage → same origin —
  // published worlds are served by the API worker, so same origin is the
  // no-config case).
  const base = getConfiguredApiBase();
  return base || null;
}

/** Idempotent: subscribe the reserved peer-sync channel (apply, never rebroadcast). */
export function initWorldStateSync(): void {
  if (syncStarted) return;
  syncStarted = true;
  try {
    bridge().onCustomMessage(WORLD_STATE_CHANNEL, (_peerId: string, data: unknown) => {
      const msg = data as WireSet;
      if (!msg || msg.t !== 'set' || typeof msg.plugin !== 'string' || typeof msg.key !== 'string') return;
      applyRecord(msg.plugin, msg.key, {
        value: msg.value,
        updatedAt: typeof msg.updatedAt === 'number' ? msg.updatedAt : Date.now(),
        pos: msg.pos,
      });
    });
  } catch (err) {
    // No bridge (harness / non-networked build) — HTTP-only mode.
    syncStarted = false;
  }
}

/** Synchronous snapshot read — safe inside decoration create(). */
export function getWorldStateSync(plugin: string, key: string): WorldStateRecord | undefined {
  return snapshot.get(plugin)?.get(key);
}

/** All cached records for a plugin (read-only view of the live map). */
export function getAllWorldStateSync(plugin: string): ReadonlyMap<string, WorldStateRecord> {
  return bucket(plugin);
}

/** Snapshot records matching a fetch query (what a cache-hit resolves with). */
function snapshotMatching(
  plugin: string,
  query: { prefix?: string; keys?: string[] },
): Record<string, WorldStateRecord> {
  const out: Record<string, WorldStateRecord> = {};
  const b = snapshot.get(plugin);
  if (!b) return out;
  if (query.prefix) {
    for (const [k, rec] of b) if (k.startsWith(query.prefix)) out[k] = rec;
  } else if (query.keys) {
    for (const k of query.keys) { const rec = b.get(k); if (rec) out[k] = rec; }
  }
  return out;
}

/**
 * Fetch records into the snapshot. `prefix` is the efficient roam-time form
 * (per-chunk seed prefix); `keys` for point lookups. Resolves the records the
 * query covers (already-newer local records are not overwritten).
 *
 * CALL THIS ONLY WHEN STATEFUL OBJECTS ARE ACTUALLY PRESENT — the natural
 * place is decoration create() (it only runs for chunks that contain your
 * spawns), so a player roaming empty terrain generates zero state traffic.
 *
 * `maxAgeMs` makes repeat calls FREE: if the same query succeeded within the
 * window, this resolves synchronously from the snapshot with no HTTP —
 * remount-safe dedupe without plugin-side bookkeeping (several spawns in one
 * chunk can all call fetch; only the first hits the network). Concurrent
 * identical queries share one in-flight request regardless of maxAgeMs.
 */
export async function fetchWorldState(
  plugin: string,
  query: { prefix?: string; keys?: string[]; maxAgeMs?: number },
): Promise<Record<string, WorldStateRecord>> {
  initWorldStateSync();
  const base = resolveApiBase();
  if (!base || typeof fetch !== 'function') return {};

  const params = new URLSearchParams({ world: getWorldStateKey(), plugin });
  if (query.prefix) params.set('prefix', query.prefix);
  else if (query.keys && query.keys.length > 0) params.set('keys', query.keys.join(','));
  else return {};

  const qk = `${plugin}|${query.prefix ?? ''}|${query.keys ? query.keys.join(',') : ''}`;
  // Back off THIS query only — a failure here says nothing about the other
  // plugins' (or chunks') queries, which used to be suppressed with it.
  const failedAt = queryFailedAt.get(qk);
  if (failedAt && Date.now() - failedAt < FETCH_BACKOFF_MS) return snapshotMatching(plugin, query);
  if (query.maxAgeMs && query.maxAgeMs > 0) {
    const at = queryFetchedAt.get(qk);
    if (at && Date.now() - at < query.maxAgeMs) return snapshotMatching(plugin, query);
  }
  const inFlight = queryInFlight.get(qk);
  if (inFlight) return inFlight;

  const run = (async () => {
    const out: Record<string, WorldStateRecord> = {};
    try {
      const res = await fetch(`${base}/api/world-state?${params.toString()}`);
      if (!res.ok) throw new Error(`world-state fetch ${res.status}`);
      const data = await res.json() as { records?: Array<{ key: string; value: unknown; pos: [number, number] | null; updatedAt: number }> };
      queryFailedAt.delete(qk);
      warnedFetchFailure = false;
      queryFetchedAt.set(qk, Date.now());
      // Bounded: one entry per distinct query (≈ per chunk roamed) — trim FIFO.
      if (queryFetchedAt.size > 512) {
        const oldest = queryFetchedAt.keys().next().value;
        if (oldest !== undefined) queryFetchedAt.delete(oldest);
      }
      for (const r of data.records ?? []) {
        const rec: WorldStateRecord = { value: r.value, updatedAt: r.updatedAt, pos: r.pos };
        applyRecord(plugin, r.key, rec);
        out[r.key] = rec;
      }
    } catch (err) {
      queryFailedAt.set(qk, Date.now());
      if (queryFailedAt.size > 512) {
        const oldestFail = queryFailedAt.keys().next().value;
        if (oldestFail !== undefined) queryFailedAt.delete(oldestFail);
      }
      if (!warnedFetchFailure) {
        warnedFetchFailure = true;
        console.warn('[XRPublisher] worldState fetch failed — state is session-only until the API is reachable', err);
      }
    } finally {
      queryInFlight.delete(qk);
    }
    return out;
  })();
  queryInFlight.set(qk, run);
  return run;
}

/** Server-enforced TTL bounds. Clamping CLIENT-side (with a one-time warn per
 *  plugin) beats silent server truncation: a plugin asking for a 90-day TTL
 *  used to look like it worked and then lose everything at 30 days. */
const TTL_MIN_S = 60;
const TTL_MAX_S = 30 * 24 * 3600;
const _warnedTtl = new Set<string>();

function clampTtl(ttl: number, plugin: string): number {
  if (!Number.isFinite(ttl)) return defaultTtlSeconds;
  const clamped = Math.min(TTL_MAX_S, Math.max(TTL_MIN_S, ttl));
  if (clamped !== ttl && !_warnedTtl.has(plugin)) {
    _warnedTtl.add(plugin);
    console.warn(
      `[XRPublisher] worldState "${plugin}": ttlSeconds ${ttl} is outside the supported range ` +
      `(${TTL_MIN_S}s..${TTL_MAX_S}s / 30 days) — clamped to ${clamped}s. Records cannot be stored longer than 30 days.`,
    );
  }
  return clamped;
}

/**
 * Write one record: optimistic local apply + peer broadcast + HTTP POST.
 * `pos` (render-frame world XZ of the record) is REQUIRED — the server's
 * distance rule anchors new records to it. `playerPos` is injected by the
 * XRPublisher static wrapper from getPlayerState(); harnesses may pass it.
 * Resolves false when the HTTP write failed (state stays for this session).
 */
export async function setWorldState(
  plugin: string,
  key: string,
  value: unknown,
  opts: { pos: [number, number]; ttlSeconds?: number; playerPos?: [number, number] },
): Promise<boolean> {
  initWorldStateSync();
  const updatedAt = Date.now();
  applyRecord(plugin, key, { value, updatedAt, pos: opts.pos });

  try {
    bridge().broadcastCustom(WORLD_STATE_CHANNEL, {
      t: 'set', plugin, key, value, updatedAt, pos: opts.pos,
    } satisfies WireSet);
  } catch (err) { /* no bridge — solo/harness */ }

  const base = resolveApiBase();
  if (!base || typeof fetch !== 'function') return false;
  try {
    const res = await fetch(`${base}/api/world-state/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `keepalive` lets the write survive page unload. Stateful plugins
      // flush on `beforeunload` (the last placed block, the final score) and
      // browsers cancel ordinary in-flight fetches during unload, so that
      // flush silently did nothing.
      keepalive: true,
      body: JSON.stringify({
        world: getWorldStateKey(),
        plugin,
        key,
        value,
        pos: opts.pos,
        // Omitted when the caller has no player position to attest (headless
        // / pre-spawn writes) — never substitute the record's own position.
        ...(opts.playerPos ? { playerPos: opts.playerPos } : {}),
        ttlSeconds: clampTtl(opts.ttlSeconds ?? defaultTtlSeconds, plugin),
      }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      console.warn(`[XRPublisher] worldState write rejected (${res.status})`, detail);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[XRPublisher] worldState write failed — kept locally for this session', err);
    return false;
  }
}

/** Notified on EVERY applied change: fetches, peer broadcasts, local sets. */
export function subscribeWorldState(
  cb: (plugin: string, key: string, rec: WorldStateRecord) => void,
): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
