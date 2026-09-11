/**
 * Persistent-decoration registry — the scene-level home for `persist: true`
 * decorations (see DecorationSpec.persist). A normal decoration is parented to
 * the terrain chunk that spawned it and disposed when that chunk streams out;
 * a persistent one is registered HERE instead, mounted at world scale by
 * `InjectedPersistentDecorations` (a referentially-stable snapshot consumed via
 * useSyncExternalStore, mirroring solidObjectRegistry), and kept alive until
 * the player moves beyond its keep-alive radius — regardless of chunk
 * residency. That's what lets a race course / golf hole / large build survive
 * the player walking to the far end of it.
 *
 * Dedup is by key (`${specName}::${seed}`): while a record is alive,
 * PluginDecorations skips re-running create() for that spawn. Eviction (player
 * left the radius) runs the spec's dispose() on a deferred rAF — same
 * mid-frame-buffer-free hazard PluginDecorations guards against.
 */
import type { Object3D } from 'three';
import type { DecorationSpec } from '../../../decorations/decorationRegistry';

export interface PersistentDecorationRecord {
  key: string;
  object: Object3D;
  spec: DecorationSpec;
  /** World position (spawn.renderPosition) the object is mounted at. */
  position: [number, number, number];
  /** World-unit radius; evicted once the player is farther than this. */
  keepAliveRadius: number;
}

const records = new Map<string, PersistentDecorationRecord>();
const listeners = new Set<() => void>();
let snapshot: PersistentDecorationRecord[] = [];

const emit = () => {
  snapshot = [...records.values()];
  for (const l of listeners) l();
};

export function hasPersistentDecoration(key: string): boolean {
  return records.has(key);
}

export function getPersistentDecorationObject(key: string): Object3D | null {
  return records.get(key)?.object ?? null;
}

export function addPersistentDecoration(rec: PersistentDecorationRecord): void {
  if (records.has(rec.key)) return; // deduped by seed — never double-mount
  records.set(rec.key, rec);
  emit();
}

function defaultDispose(object: Object3D): void {
  object.traverse((child) => {
    const g = (child as { geometry?: { dispose?: () => void } }).geometry;
    if (g && typeof g.dispose === 'function') g.dispose();
  });
}

export function removePersistentDecoration(key: string): void {
  const rec = records.get(key);
  if (!rec) return;
  records.delete(key);
  emit();
  // Hide now, dispose after React detaches the <primitive> (see the same
  // rationale in PluginDecorations' cleanup — freeing a live GPU buffer
  // mid-render-pass trips "not a GPUBuffer").
  rec.object.visible = false;
  const run = () => {
    try {
      (rec.spec.dispose ?? defaultDispose)(rec.object);
    } catch (err) {
      console.warn(`[XRPublisher] persistent decoration "${rec.spec.name}" dispose() threw`, err);
    }
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else run();
}

export function subscribePersistentDecorations(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function getPersistentDecorations(): PersistentDecorationRecord[] {
  return snapshot;
}

/** Evict any persistent decoration whose spawn is farther than its keep-alive
 *  radius from the player (XZ). Called by the host each throttled frame. */
export function evictFarPersistentDecorations(px: number, pz: number): void {
  let dirty = false;
  for (const rec of records.values()) {
    const dx = px - rec.position[0];
    const dz = pz - rec.position[2];
    if (dx * dx + dz * dz > rec.keepAliveRadius * rec.keepAliveRadius) {
      records.delete(rec.key);
      rec.object.visible = false;
      const spec = rec.spec, object = rec.object, name = rec.spec.name;
      const run = () => {
        try { (spec.dispose ?? defaultDispose)(object); }
        catch (err) { console.warn(`[XRPublisher] persistent decoration "${name}" dispose() threw`, err); }
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
      else run();
      dirty = true;
    }
  }
  if (dirty) emit();
}
