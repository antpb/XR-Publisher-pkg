/**
 * Programmatic world-model injection registry.
 *
 * Lets a plugin add a glTF/GLB MODEL to the live world from code —
 * `XRPublisher.addModel(spec)` / `XRPublisher.removeModel(id)` — instead of
 * authoring a `<three-model-block>` in HTML. Each injected spec is rendered by
 * the SAME `ModelObject` component the editor's model blocks use, so it inherits
 * grid instancing (`instances[]` → one InstancedMesh + per-instance frustum
 * culling), trimesh collision, and WebGPU material conversion for free — this
 * is the "utilise ModelObject when creating instances of things" path.
 *
 * Injected models mount at SCENE scale (absolute world coords), NOT inside a
 * terrain chunk — so they persist regardless of chunk streaming (unlike
 * decoration spawns). This is the composability primitive for "drop a known
 * thing at a known place": a town centre, a quest marker, a building grid.
 *
 * Mirrors the pluginMenu.ts store pattern — a module-global Map + a
 * referentially-stable snapshot consumed by `InjectedModels` via
 * useSyncExternalStore — so late additions appear live and host remounts (the
 * WebGPU⟷WebGL branch swap in EnvironmentFront) never lose anything. Calling
 * before world init is fine; the host picks up the current snapshot on mount.
 */

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
   *  generated and returned by addWorldModel(). */
  id?: string;
  /** glTF/GLB URL. */
  url: string;
  /** Position of the single model [x, y, z] (default 0). Ignored when
   *  `instances` is provided (each instance carries its own position). */
  position?: [number, number, number];
  /** Euler rotation in DEGREES (default 0). */
  rotation?: [number, number, number];
  /** Uniform scale, or [x, y, z] (default 1). */
  scale?: number | [number, number, number];
  /** Trimesh collider for the single model (default false). */
  collidable?: boolean;
  /** Comma-separated animation clip names to autoplay. */
  animations?: string;
  /** Render every entry as ONE InstancedMesh (a grid / scatter). When present,
   *  the spec's own position/rotation/scale are ignored — each instance carries
   *  its own transform. This is the path that reuses ModelObject's instancing. */
  instances?: WorldModelInstance[];
}

export interface WorldModelRecord extends WorldModelSpec {
  id: string;
  seq: number;
}

const records = new Map<string, WorldModelRecord>();
const listeners = new Set<() => void>();
let snapshot: WorldModelRecord[] = [];
let seq = 0;
let autoId = 0;

function rebuild(): void {
  snapshot = Array.from(records.values()).sort((a, b) => a.seq - b.seq);
  listeners.forEach((l) => l());
}

/** Add (or replace, by id) a world model. Returns its id ('' if invalid). */
export function addWorldModel(spec: WorldModelSpec): string {
  if (!spec || typeof spec.url !== 'string' || spec.url.length === 0) {
    console.warn('[XRPublisher] addModel: spec must have at least { url }');
    return '';
  }
  const existing = spec.id ? records.get(spec.id) : undefined;
  const id = spec.id ?? `world-model-${autoId++}`;
  // Re-adding an id keeps its original seq so it doesn't jump render order.
  records.set(id, { ...spec, id, seq: existing ? existing.seq : seq++ });
  rebuild();
  return id;
}

export function removeWorldModel(id: string): void {
  if (records.delete(id)) rebuild();
}

export function subscribeWorldModels(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function getWorldModels(): WorldModelRecord[] {
  return snapshot;
}
