/**
 * Solid-object injection registry — place a plugin-built, COLLIDABLE Object3D at
 * a world position.
 *
 * `addModel` only takes a glTF/GLB URL, and `registerDecoration` is per-chunk
 * scatter — neither lets a plugin drop ONE procedural mesh (a stage platform, a
 * ramp, a pedestal) at an exact spot AND have the player stand on it. This is
 * that primitive: hand it a `THREE.Object3D` you built with `window.THREE` and a
 * world position, and `InjectedSolids` mounts it inside `<Physics>` in a fixed
 * RigidBody with auto colliders, persisting across terrain streaming.
 *
 *   const id = XRPublisher.addSolid({ object: platformMesh,
 *     position: [x, groundY, z], colliders: 'hull' });
 *   // later: XRPublisher.removeSolid(id);  // (you own + dispose the object)
 *
 * Same module-global store shape as worldObjectRegistry.ts.
 */
import type { Object3D } from 'three';

export type SolidColliders = 'cuboid' | 'hull' | 'trimesh' | 'ball';

export interface SolidObjectSpec {
  /** Stable id. Re-adding the same id REPLACES it; omit and one is returned. */
  id?: string;
  /** The pre-built object (you own it — dispose its geometry on removeSolid). */
  object: Object3D;
  /** World position [x, y, z] (default 0). */
  position?: [number, number, number];
  /** Euler rotation in DEGREES (default 0). */
  rotation?: [number, number, number];
  /** Uniform scale or [x, y, z] (default 1). */
  scale?: number | [number, number, number];
  /** Auto-collider shape (default 'hull' — convex hull, right for a platform). */
  colliders?: SolidColliders;
}

export interface SolidObjectRecord extends SolidObjectSpec {
  id: string;
  seq: number;
}

const records = new Map<string, SolidObjectRecord>();
const listeners = new Set<() => void>();
let snapshot: SolidObjectRecord[] = [];
let seq = 0;
let autoId = 0;

function rebuild(): void {
  snapshot = Array.from(records.values()).sort((a, b) => a.seq - b.seq);
  listeners.forEach((l) => l());
}

export function addSolidObject(spec: SolidObjectSpec): string {
  if (!spec || !spec.object) {
    console.warn('[XRPublisher] addSolid: spec must have { object }');
    return '';
  }
  const existing = spec.id ? records.get(spec.id) : undefined;
  const id = spec.id ?? `solid-${autoId++}`;
  records.set(id, { ...spec, id, seq: existing ? existing.seq : seq++ });
  rebuild();
  return id;
}

export function removeSolidObject(id: string): void {
  if (records.delete(id)) rebuild();
}

export function subscribeSolids(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function getSolids(): SolidObjectRecord[] {
  return snapshot;
}
