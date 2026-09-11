/**
 * Per-chunk tree collider registry.
 *
 * The terrain worker emits `treeColliders` (TREE_COLLIDER_STRIDE floats per
 * tree: trunk capsule + up to 4 canopy blob spheres, chunk-local) as part of
 * the decoration-geometry build. That data lives in ProceduralTrees /
 * ProceduralTreesWebGL, but `PluginDecorations` (a sibling) needs it so that
 * `anchor:'tree'` decorations can attach to the REAL canopy blob surfaces
 * instead of an approximated crown sphere. This tiny store bridges them: the
 * tree components publish per chunk, PluginDecorations reads + re-scatters
 * when the data arrives (it's async — it lands a moment after the chunk
 * mounts). Coords are in the chunk group's local frame, identical to the
 * frame PluginDecorations mounts objects in.
 */

const _byChunk = new Map<string, Float32Array>();
let _version = 0;
const _listeners = new Set<() => void>();

const keyOf = (gridX: number, gridZ: number) => `${gridX},${gridZ}`;

export function setChunkTreeColliders(gridX: number, gridZ: number, data: Float32Array): void {
  _byChunk.set(keyOf(gridX, gridZ), data);
  _version++;
  _listeners.forEach((l) => l());
}

export function clearChunkTreeColliders(gridX: number, gridZ: number): void {
  if (_byChunk.delete(keyOf(gridX, gridZ))) {
    _version++;
    _listeners.forEach((l) => l());
  }
}

export function getChunkTreeColliders(gridX: number, gridZ: number): Float32Array | undefined {
  return _byChunk.get(keyOf(gridX, gridZ));
}

/** Monotonic counter — bumps whenever any chunk's colliders change. */
export function getTreeColliderVersion(): number {
  return _version;
}

export function subscribeTreeColliders(listener: () => void): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}
