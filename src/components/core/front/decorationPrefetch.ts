/**
 * Decoration geometry prefetch cache.
 *
 * `ProceduralTerrain` kicks off the tree `buildDecorationGeometry` worker
 * job the moment `generateTerrain` resolves (the spawn arrays are in hand),
 * instead of waiting for the phase-2 decoration timer + the proximity gate
 * to mount `ProceduralTrees` first. The component then CONSUMES the cached
 * promise when its gates open — splitting "request" (as early as possible)
 * from "mount" (still phase/proximity gated to spread main-thread cost).
 *
 * Lifetime: entries are keyed per chunk and OWNED by the chunk — the same
 * `ProceduralTerrain` generate-effect whose cleanup aborts the terrain job
 * also calls `dropPrefetch`, so cache lifetime exactly matches the chunk
 * record (no new leak class). Entries are deliberately NOT deleted on read:
 * the proximity gate can unmount/remount `ProceduralTrees` while the chunk
 * stays alive, and re-wrapping the same resolved `BakedMesh` arrays after a
 * `geometry.dispose()` is safe (dispose only frees GPU buffers).
 *
 * Abort semantics: the prefetch job carries the chunk effect's own
 * AbortSignal. If the chunk unmounts while the job is still queued, the
 * promise is left permanently unsettled (TerrainWorkerClient contract) —
 * safe, because the only consumer unmounts with the same chunk and
 * `dropPrefetch` releases the map reference.
 */
import type { DecorationGeometryResult } from '../../../terrain/TerrainWorkerClient';

export interface PrefetchEntry {
  promise: Promise<DecorationGeometryResult | null>;
  /** Float count of the (patch-filtered) spawn array the job was built
   *  from. Consumers re-run the filter at mount time and skip the cache
   *  when the count differs (a ground patch registered in between). */
  spawnCount: number;
}

const prefetches = new Map<string, PrefetchEntry>();

export function treePrefetchKey(seed: string, gridX: number, gridZ: number): string {
  return `${seed}:${gridX}:${gridZ}:trees`;
}

export function putPrefetch(key: string, entry: PrefetchEntry): void {
  prefetches.set(key, entry);
}

export function getPrefetch(key: string): PrefetchEntry | undefined {
  return prefetches.get(key);
}

export function dropPrefetch(key: string): void {
  prefetches.delete(key);
}
