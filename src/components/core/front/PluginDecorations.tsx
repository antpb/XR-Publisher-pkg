/**
 * PluginDecorations — chunk-level renderer for plugin-registered
 * decorations (see `src/decorations/decorationRegistry.ts`).
 *
 * One instance mounts per terrain chunk (both renderer paths). For each
 * registered DecorationSpec it computes the deterministic spawn list
 * (terrain grid, tree canopies, or mountain summits depending on
 * `anchor`), calls the plugin's `create()` on the main thread, and
 * renders the result inside the chunk group (so the chunk transform
 * places them in the world, same as the built-in decorations).
 *
 * Render modes per spec:
 * - Static objects (no `update`) get frozen matrices.
 * - `instanced` static specs share one geometry across all spawns via
 *   THREE.InstancedMesh (cheap for dense models) — `create()` is called
 *   once for the template, per-instance variance from `transform(spawn)`.
 * - Dynamic objects (spec has `update`) are ticked from one useFrame and
 *   stay per-Object3D (instancing is incompatible with per-frame moves).
 * - `collision` specs are wrapped in fixed RigidBodies, gated by the same
 *   `collidersActive` altitude/flying flag as terrain + tree colliders.
 * - `groundPatch` specs paint a dirt clearing on the terrain around each
 *   spawn (campfire), via the shared groundPatch uniforms, and other
 *   decorations are cleared out of those circles.
 * - Re-scatters live chunks when a plugin registers late.
 * - A plugin throwing in create/update is contained per-spec.
 *
 * Deliberately OUTSIDE the WebGPU chunk render bundle.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Vector3, Object3D, Mesh, InstancedMesh, Matrix4, Quaternion, Euler, Box3, Sphere,
  type Material, type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useTerrainChunkStore } from './terrainChunkStore';
import {
  getDecorationSpecs,
  getDecorationVersion,
  subscribeDecorations,
  computeDecorationSpawns,
  type DecorationSpec,
  type DecorationSpawn,
} from '../../../decorations/decorationRegistry';
import { registerNpcObstacles, unregisterNpcObstacles } from './npcObstacles';
import { getChunkTreeColliders, subscribeTreeColliders } from './treeColliderStore';
import { useChunkProximityVisible } from './useChunkProximityVisible';
import { registerInteractable, unregisterInteractable } from '../../../decorations/interactionRegistry';
import {
  registerGroundPatches,
  unregisterGroundPatches,
  setGroundPatchPlayer,
  isInsideGroundPatch,
  type GroundPatchEntry,
} from '../../../decorations/groundPatchUniforms';
import {
  setRegionMaterialPlayer,
} from '../../../decorations/regionMaterialUniforms';
import { setPathPlayer } from '../../../decorations/pathUniforms';
import {
  addPersistentDecoration,
  getPersistentDecorationObject,
} from './persistentDecorationRegistry';

interface PluginDecorationsProps {
  chunkX: number;
  chunkZ: number;
  /** The chunk group's TRUE world origin (its `position`), so plugin world
   *  coords match the terrain's `positionWorld` exactly. A spawn renders at
   *  `origin + spawn.position` (the object is mounted inside this group). */
  originX: number;
  originZ: number;
  seed: string;
  width: number;
  height: number;
  heightScale: number;
  segments: number;
  heightData: Float32Array;
  /** Per-vertex baked road strength for this chunk — plugin spawns avoid roads
   *  (unless their spec sets `avoidRoads: false`). */
  roadStrength?: Float32Array;
  playerPosition?: Vector3;
  /** Engine spawn arrays (7 floats/entry, chunk-local) for proximity
   *  context — spawn.treeDistance / spawn.boulderDistance — and for the
   *  'tree' anchor (canopy placement). */
  treeSpawns?: Float32Array | null;
  boulderSpawns?: Float32Array | null;
}

interface InstancedCollider {
  position: [number, number, number];
  rotation: [number, number, number];
  half: [number, number, number];
}

/** Plugin-authored explicit cuboid collider (object-local frame), read from
 *  `object.userData.xrColliders` on solid per-object specs. Lets a plugin
 *  MERGE its visual geometry (few draw calls) while keeping precise
 *  walk-through colliders — the auto-cuboid path would wrap the merged mesh
 *  in one giant box. rotation is a THREE 'XYZ' euler. */
interface ExplicitCollider {
  position: [number, number, number];
  rotation?: [number, number, number];
  half: [number, number, number];
}

/** Validate + normalize a plugin's userData.xrColliders array (untrusted). */
function readExplicitColliders(object: Object3D): ExplicitCollider[] | null {
  const raw = (object.userData as { xrColliders?: unknown }).xrColliders;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: ExplicitCollider[] = [];
  for (const c of raw as Array<{ half?: unknown; position?: unknown; rotation?: unknown }>) {
    const half = c?.half; const pos = c?.position; const rot = c?.rotation;
    if (!Array.isArray(half) || half.length !== 3 || !Array.isArray(pos) || pos.length !== 3) continue;
    out.push({
      half: [Math.max(0.01, +half[0] || 0), Math.max(0.01, +half[1] || 0), Math.max(0.01, +half[2] || 0)],
      position: [+pos[0] || 0, +pos[1] || 0, +pos[2] || 0],
      rotation: Array.isArray(rot) && rot.length === 3 ? [+rot[0] || 0, +rot[1] || 0, +rot[2] || 0] : undefined,
    });
  }
  return out.length > 0 ? out : null;
}

interface LiveEntry {
  spec: DecorationSpec;
  /** The object(s) to render — a single Object3D, or a Group of
   *  InstancedMeshes for instanced specs. */
  object: Object3D;
  /** World-local placement of the object's origin, applied by a wrapper so
   *  it survives a per-frame `update()` (which sets `position` directly).
   *  [0,0,0] for merged/instanced entries — their transforms are baked. */
  placement: [number, number, number];
  /** Normalized collider mode for NON-instanced solid specs. */
  collision: 'cuboid' | 'hull' | 'trimesh' | null;
  /** Explicit per-instance cuboid colliders for INSTANCED solid specs. */
  instancedColliders: InstancedCollider[] | null;
  /** Plugin-authored colliders (userData.xrColliders) — override the
   *  auto-collider mode for this object when present. */
  explicitColliders: ExplicitCollider[] | null;
  key: string;
}

function defaultDispose(object: Object3D): void {
  // Geometries are per-spawn by default; materials may be shared across
  // spawns (the pattern we push plugin authors toward), so the default
  // cleanup leaves them alone. Plugins with per-spawn materials supply
  // their own `dispose`.
  object.traverse((child) => {
    if (child instanceof InstancedMesh) {
      // The template geometry is SHARED across chunks for instanced specs
      // (the whole point), so don't free it — just drop the per-instance
      // buffers this chunk allocated.
      child.dispose();
    } else if (child instanceof Mesh) {
      child.geometry?.dispose();
    }
  });
}

// Scratch objects reused across instance-matrix composition.
const _m = new Matrix4();
const _mLocal = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _pos = new Vector3();
const _scl = new Vector3();
const _box = new Box3();
const _size = new Vector3();
const _center = new Vector3();
const _persistBox = new Box3();
const _persistSphere = new Sphere();

/**
 * Build the InstancedMesh group + collider list for an instanced spec.
 * Returns null if the template has no renderable meshes.
 */
function buildInstanced(
  spec: DecorationSpec,
  spawns: DecorationSpawn[],
): { object: Object3D; colliders: InstancedCollider[] | null } | null {
  let template: Object3D | null = null;
  try {
    template = spec.create(spawns[0]);
  } catch (err) {
    console.warn(`[XRPublisher] decoration "${spec.name}" create() threw (instanced template)`, err);
    return null;
  }
  if (!template) return null;
  // The template is the geometry/material source only — strip any root
  // translation; per-instance position comes from the spawn.
  template.position.set(0, 0, 0);
  template.updateMatrixWorld(true);

  const meshes: Mesh[] = [];
  template.traverse((c) => { if (c instanceof Mesh) meshes.push(c); });
  if (meshes.length === 0) return null;

  const wantColliders = !!spec.collision;
  if (wantColliders) {
    _box.setFromObject(template);
    _box.getSize(_size);
    _box.getCenter(_center);
  }

  const group = new Object3D();
  const count = spawns.length;

  // Resolve each spawn's transform ONCE — transform() may draw from the
  // stateful spawn.rng, so calling it per-mesh (or again for colliders)
  // would advance the PRNG and desync the instance across meshes.
  const variances: { rotY: number; scale: number; tilt: number }[] = new Array(count);
  for (let j = 0; j < count; j++) {
    let rotY = 0;
    let scale = 1;
    let tilt = 0;
    if (spec.transform) {
      try {
        const t = spec.transform(spawns[j]);
        rotY = t.rotationY ?? 0;
        scale = t.scale ?? 1;
        tilt = t.tilt ?? 0;
      } catch (err) {
        console.warn(`[XRPublisher] decoration "${spec.name}" transform() threw`, err);
      }
    }
    variances[j] = { rotY, scale, tilt };
  }

  for (const mesh of meshes) {
    const inst = new InstancedMesh(mesh.geometry, mesh.material, count);
    inst.castShadow = mesh.castShadow;
    inst.receiveShadow = mesh.receiveShadow;
    inst.frustumCulled = true;
    inst.raycast = () => null;
    const meshLocal = mesh.matrixWorld; // relative to template root (at identity)

    for (let j = 0; j < count; j++) {
      const spawn = spawns[j];
      const { rotY, scale, tilt } = variances[j];
      _e.set(tilt, rotY, 0);
      _q.setFromEuler(_e);
      _pos.set(spawn.position[0], spawn.position[1], spawn.position[2]);
      _scl.set(scale, scale, scale);
      _m.compose(_pos, _q, _scl);
      _mLocal.multiplyMatrices(_m, meshLocal);
      inst.setMatrixAt(j, _mLocal);
    }
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  }

  let colliders: InstancedCollider[] | null = null;
  if (wantColliders) {
    colliders = [];
    for (let j = 0; j < count; j++) {
      const spawn = spawns[j];
      const { rotY, scale, tilt } = variances[j];
      colliders.push({
        position: [
          spawn.position[0] + _center.x * scale,
          spawn.position[1] + _center.y * scale,
          spawn.position[2] + _center.z * scale,
        ],
        // Same euler as the instance matrix above (XYZ: tilt, yaw, 0) — the
        // collider used to drop `tilt`, so a leaning instance had an upright
        // box that didn't match what the player could see.
        rotation: [tilt, rotY, 0],
        half: [
          Math.max(0.02, (_size.x / 2) * scale),
          Math.max(0.02, (_size.y / 2) * scale),
          Math.max(0.02, (_size.z / 2) * scale),
        ],
      });
    }
  }

  // The template itself is discarded — dispose its geometries are now
  // owned by the InstancedMeshes (shared by reference), so don't dispose
  // here. Just drop the wrapper.
  return { object: group, colliders };
}

/**
 * Merge all spawns of a STATIC, non-collision spec into one mesh per shared
 * material — the same draw-call-collapsing trick the built-in decorations
 * use. A chunk of 8 flowers × 7 meshes (56 separate scene objects, each
 * paying per-object WebGPU pipeline/cache-key cost every frame) becomes ~3
 * merged meshes. `create()` still runs per spawn (for seed-stable variation);
 * we bake each returned mesh's world matrix into a cloned geometry and
 * concatenate by material.
 *
 * Returns null if anything is unmergeable (multi-material mesh, mismatched
 * attributes) — the caller falls back to per-object mounting, so the worst
 * case is the old behaviour, never a crash or a vanished decoration.
 */
function buildMerged(
  spec: DecorationSpec,
  spawns: DecorationSpawn[],
  radius: number,
): Object3D | null {
  const byMaterial = new Map<Material, { geos: BufferGeometry[]; cast: boolean; receive: boolean }>();
  const order: Material[] = [];
  let bail = false;

  const disposeClones = () => {
    for (const m of order) for (const g of byMaterial.get(m)!.geos) g.dispose();
  };

  for (const spawn of spawns) {
    let obj: Object3D | null = null;
    try {
      obj = spec.create(spawn);
    } catch (err) {
      console.warn(`[XRPublisher] decoration "${spec.name}" create() threw (merge)`, err);
      bail = true;
      break;
    }
    if (!obj) continue;
    obj.position.set(spawn.position[0], spawn.position[1], spawn.position[2]);
    obj.updateMatrixWorld(true);

    obj.traverse((c) => {
      if (bail) return;
      if (c instanceof Mesh && c.geometry) {
        if (Array.isArray(c.material)) { bail = true; return; } // multi-material → fall back
        const mat = c.material as Material;
        const g = c.geometry.clone();
        g.applyMatrix4(c.matrixWorld); // bake chunk-local world transform
        let bucket = byMaterial.get(mat);
        if (!bucket) { bucket = { geos: [], cast: false, receive: false }; byMaterial.set(mat, bucket); order.push(mat); }
        bucket.geos.push(g);
        bucket.cast = bucket.cast || c.castShadow;
        bucket.receive = bucket.receive || c.receiveShadow;
      }
    });
    // We cloned what we need — free the originals create() allocated.
    obj.traverse((c) => { if (c instanceof Mesh) c.geometry?.dispose(); });
    if (bail) { disposeClones(); return null; }
  }

  if (order.length === 0) return null;

  const group = new Object3D();
  const sphere = new Sphere(new Vector3(0, 0, 0), radius);
  for (const mat of order) {
    const bucket = byMaterial.get(mat)!;
    let merged: BufferGeometry | null = null;
    try {
      merged = mergeGeometries(bucket.geos, false);
    } catch {
      merged = null;
    }
    for (const g of bucket.geos) g.dispose(); // clones consumed
    if (!merged) {
      // Mismatched attributes in this material group → abort, let the caller
      // fall back. Dispose anything already built.
      group.traverse((c) => { if (c instanceof Mesh) c.geometry?.dispose(); });
      return null;
    }
    // Lit materials read normals; a normal-less merged geometry makes the TSL
    // build fail "normal not found" and retry every frame (CPU-melting rebuild
    // storm). Generate them if the source geometry had none.
    if (!merged.attributes.normal && merged.attributes.position) {
      merged.computeVertexNormals();
    }
    merged.boundingSphere = sphere.clone();
    const mesh = new Mesh(merged, mat);
    mesh.castShadow = bucket.cast;
    mesh.receiveShadow = bucket.receive;
    mesh.frustumCulled = false;       // bounded per-chunk; manual sphere for the shadow pass
    mesh.matrixAutoUpdate = false;
    mesh.raycast = () => null;
    group.add(mesh);
  }
  group.userData.camExcludeCollision = true;
  group.matrixAutoUpdate = false;
  group.updateMatrixWorld(true);
  return group;
}

/**
 * STATIC MOUNT PREP for a plugin-created object.
 *
 * The matrix handling here is EXACTLY what it has always been — one traverse
 * that composes each node's local matrix and turns off `matrixAutoUpdate`, and
 * nothing else. A performance pass once added `matrixWorldAutoUpdate = false`
 * on top, to skip static subtrees in the renderer's per-frame traversal. That
 * broke placement outright: R3F applies the wrapper's props (consuming its
 * dirty flag) BEFORE attaching this object, so an object that opts out of the
 * traversal never receives the one `force` pass that computes its matrixWorld
 * and renders at identity — i.e. every decoration in the world stacked at the
 * origin. Nothing about the local-matrix freeze has that failure mode, because
 * the traversal still visits the node and recomputes its world matrix from its
 * parent. DO NOT reintroduce traversal-skipping here.
 *
 * The one addition that is NOT matrix-related: `camExcludeCollision` is flagged
 * on the WHOLE TREE rather than just the root, because `WorldCursor` checks an
 * object and ONE parent — a mesh nested two levels down (the normal shape) was
 * never excluded and joined the cursor's 4Hz scan + 30Hz raycast list.
 */
function prepareStaticObject(object: Object3D, freezeMatrices: boolean): void {
  // Cursor exclusion: whole tree, no matrix side effects.
  object.traverse((child) => { child.userData.camExcludeCollision = true; });
  if (!freezeMatrices) return;
  // Matrix freeze: verbatim the long-standing behaviour.
  object.traverse((child) => { child.updateMatrix(); child.matrixAutoUpdate = false; });
  object.matrixAutoUpdate = false;
}

export function PluginDecorations({
  chunkX,
  chunkZ,
  originX,
  originZ,
  seed,
  width,
  height,
  heightScale,
  segments,
  heightData,
  roadStrength,
  playerPosition,
  treeSpawns,
  boulderSpawns,
}: PluginDecorationsProps) {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const entriesRef = useRef<LiveEntry[]>([]);

  const registryVersion = useSyncExternalStore(subscribeDecorations, getDecorationVersion);
  const collidersActive = useTerrainChunkStore((s) => s.collidersActive);
  // Canopy blob data arrives async (after the tree decoration build). Snapshot
  // THIS CHUNK's colliders only — a global version counter would make EVERY
  // chunk re-scatter whenever any tree chunk streams in/out (a dispose/rebuild
  // storm that crashed WebGPU and pegged the CPU). getChunkTreeColliders
  // returns a stable ref until the chunk's data actually changes, so
  // useSyncExternalStore re-renders only the affected chunk.
  const getMyColliders = useCallback(
    () => getChunkTreeColliders(chunkX, chunkZ),
    [chunkX, chunkZ],
  );
  const myTreeColliders = useSyncExternalStore(subscribeTreeColliders, getMyColliders);
  const hasTreeAnchor = useMemo(
    () => getDecorationSpecs().some((s) => s.anchor === 'tree' || s.anchor === 'tree-base'),
    [registryVersion],
  );
  // Only worlds with a tree-anchored spec need to re-scatter when colliders land.
  const treeColliderDep = hasTreeAnchor ? myTreeColliders : null;

  // Per-frame proximity gate (see useChunkProximityVisible) — a useMemo here
  // only re-evaluated on re-render, freezing visibility between chunk streams.
  const shouldRender = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height, 1.2, 1.6,
  );

  useEffect(() => {
    if (!shouldRender || registryVersion === 0) {
      setEntries([]);
      entriesRef.current = [];
      return;
    }

    const patchKey = `plugin-${chunkX}-${chunkZ}`;
    const live: LiveEntry[] = [];
    // [worldX, worldZ, radius] triples — NPCs avoid plugin decorations too.
    const npcPacked: number[] = [];
    // Dirt clearings this chunk contributes.
    const patchEntries: GroundPatchEntry[] = [];
    // Interactable ids registered this mount — unregistered on unmount.
    const interactableIds: string[] = [];

    const computeFor = (spec: DecorationSpec): DecorationSpawn[] => {
      try {
        return computeDecorationSpawns(
          spec, seed, chunkX, chunkZ, width, height, heightScale, segments, heightData,
          { treeSpawns, boulderSpawns, treeColliders: myTreeColliders },
          roadStrength,
        );
      } catch (err) {
        console.warn(`[XRPublisher] decoration "${spec.name}" spawn computation failed`, err);
        return [];
      }
    };

    const colliderModeOf = (spec: DecorationSpec): 'cuboid' | 'hull' | 'trimesh' | null =>
      spec.collision === true ? 'cuboid'
        : spec.collision === 'cuboid' || spec.collision === 'hull' || spec.collision === 'trimesh'
          ? spec.collision
          : null;

    // Conservative per-chunk bounding radius for merged/static meshes.
    const chunkRadius = Math.max(width, height);

    // Would this spec take the per-object mount path? (Mirrors the routing
    // in addSpec — instanced and merged specs call create() differently.)
    const isPerObject = (spec: DecorationSpec): boolean => {
      const interactable = !!spec.interactable && typeof spec.onInteract === 'function';
      // FIRST: `animated` wins over every batching path, exactly as the mount
      // routing below decides it. These two must agree — this helper drives
      // the ground-patch prepass, and a disagreement means create() runs on a
      // path the mount never consumes (that's the shape of the persist +
      // groundPatch bug).
      if (spec.animated) return true;                                          // never merged/instanced
      if (spec.instanced && !spec.update && !interactable) return false;      // instanced
      if (!spec.update && !colliderModeOf(spec) && !spec.dispose && !interactable) return false; // merged
      return true;
    };

    // Mount one spec's spawns, choosing the cheapest valid render path:
    //  - instanced (static)        → ONE InstancedMesh per template mesh
    //  - dynamic OR solid          → per-object (needs per-frame moves / a
    //                                per-object collider)
    //  - static, non-solid         → MERGED (a few draw calls per chunk)
    // `prebuilt` carries objects already created during the ground-patch pass
    // (index-aligned with spawns; null = create() declined that spawn).
    const addSpec = (spec: DecorationSpec, spawns: DecorationSpawn[], prebuilt?: (Object3D | null)[]) => {
      if (spawns.length === 0) return;
      const collision = colliderModeOf(spec);

      // NPCs avoid every spawn regardless of render path (positions only).
      for (let i = 0; i < spawns.length; i++) {
        if (prebuilt && !prebuilt[i]) continue;   // create() declined — nothing to avoid
        const s = spawns[i];
        npcPacked.push(s.worldPosition[0], s.worldPosition[2], collision ? 4 : 2.5);
      }

      // Interactable specs mount per-object (each spawn must be individually
      // targetable + removable), so they can't instance or merge.
      const interactable = !!spec.interactable && typeof spec.onInteract === 'function';
      if (spec.instanced && spec.interactable) {
        console.warn(`[XRPublisher] decoration "${spec.name}": instanced + interactable is unsupported; using per-object.`);
      }
      // Documented as a warn in decorationRegistry + CLAUDE.md, but the
      // downgrade was silent: an `update` callback can't drive instances, so
      // the spec quietly fell back to per-object and its per-frame cost.
      if (spec.instanced && typeof spec.update === 'function') {
        console.warn(`[XRPublisher] decoration "${spec.name}": instanced + update is unsupported (instances can't be moved per-frame); using per-object.`);
      }
      if (spec.instanced && spec.animated) {
        console.warn(`[XRPublisher] decoration "${spec.name}": instanced + animated is unsupported (an InstancedMesh has no per-spawn Object3D for your ticker to move); using per-object.`);
      }

      // PERSIST: large / cross-cell structures live at scene scale in the
      // persistent registry, NOT under this chunk group — so they survive the
      // origin chunk streaming out while the player is still inside them. The
      // object is deduped by seed (create() runs once, until the player leaves
      // its keepAliveRadius). Interactables still (re)register per chunk load,
      // pointing at the persistent object. Not added to `live`, so this
      // chunk's cleanup never disposes it.
      if (spec.persist && !spec.instanced) {
        for (let si = 0; si < spawns.length; si++) {
          const spawn = spawns[si];
          // A `groundPatch` spec on the per-object path has already had its
          // create() run in pass 1, and its object arrives here in `prebuilt`.
          // This used to `continue` on ANY prebuilt array, which skipped every
          // spawn: `persist` + `groundPatch` painted the dirt circle and then
          // mounted nothing at all — no object, no interactable, no dispose,
          // and the orphaned Group leaked per chunk mount.
          const pre = prebuilt ? prebuilt[si] : undefined;
          if (prebuilt && !pre) continue;   // create() declined this spawn
          const key = `${spec.name}::${spawn.seed}`;
          const existing = getPersistentDecorationObject(key);
          let object = existing;
          if (existing && pre && pre !== existing) {
            // This structure is already alive (persist survives chunk
            // unload), but pass 1 built a second copy to place the ground
            // patch. Drop it here or it leaks on every re-entry.
            try { (spec.dispose ?? defaultDispose)(pre); }
            catch (err) { console.warn(`[XRPublisher] decoration "${spec.name}" dispose() threw (persist duplicate)`, err); }
          }
          if (!object) {
            object = pre ?? null;
            if (!object) {
              try {
                object = spec.create(spawn);
              } catch (err) {
                console.warn(`[XRPublisher] decoration "${spec.name}" create() threw (persist)`, err);
                continue;
              }
            }
            if (!object) continue;
            prepareStaticObject(object, !spec.update && !spec.animated);
            object.updateMatrixWorld(true);
            // keepAliveRadius default: the object's bounding radius × 1.35,
            // clamped so a small structure still survives a chunk of travel
            // and a huge one can't pin memory forever.
            let radius = spec.keepAliveRadius ?? 0;
            if (!radius) {
              _persistBox.setFromObject(object);
              _persistBox.getBoundingSphere(_persistSphere);
              radius = Math.min(2000, Math.max(140, _persistSphere.radius * 1.35));
            }
            // Y FRAME: a persistent decoration mounts at SCENE root, but
            // `renderPosition[1]` is the raw terrain-height sample with the
            // terrain block's own vertical offset deliberately excluded (see
            // DecorationSpawn docs) — chunk-parented decorations get that
            // offset from the chunk group. Without adding it back, every
            // persistent object floated by |positionY| (10m on a default
            // world). `__xrTerrainOffsetY` is what InfiniteTerrain publishes
            // for exactly this correction.
            const terrainOffsetY = (typeof window !== 'undefined')
              ? ((window as unknown as { __xrTerrainOffsetY?: number }).__xrTerrainOffsetY ?? 0)
              : 0;
            addPersistentDecoration({
              key, object, spec,
              position: [
                spawn.renderPosition[0],
                spawn.renderPosition[1] + terrainOffsetY,
                spawn.renderPosition[2],
              ],
              keepAliveRadius: radius,
            });
          }
          if (interactable) {
            const capturedObject = object;
            const capturedSpawn = spawn;
            const promptSpec = spec.interactionPrompt;
            registerInteractable({
              id: key,
              object: capturedObject,
              radius: spec.interactionRadius ?? 4,
              prompt: typeof promptSpec === 'function'
                ? () => promptSpec(capturedSpawn)
                : (promptSpec ?? spec.name),
              onInteract: () => {
                spec.onInteract!({
                  object: capturedObject,
                  spawn: capturedSpawn,
                  remove: () => { capturedObject.visible = false; unregisterInteractable(key); },
                });
              },
            });
            interactableIds.push(key);
          }
        }
        return;
      }

      // Instanced static — one shared geometry across all spawns (spawn
      // positions baked into the instance matrices).
      if (spec.instanced && !spec.update && !interactable && !spec.animated) {
        const built = buildInstanced(spec, spawns);
        if (!built) return;
        built.object.userData.camExcludeCollision = true;
        built.object.matrixAutoUpdate = false;
        built.object.updateMatrixWorld(true);
        live.push({
          spec, object: built.object, placement: [0, 0, 0], collision: null,
          instancedColliders: collision ? built.colliders : null,
          explicitColliders: null,
          key: `${spec.name}-instanced`,
        });
        return;
      }

      // Static, non-solid, default cleanup → merge into a few draw calls
      // (spawn positions baked into the merged geometry). NOT for `animated`
      // specs: merging CLONES the geometry and disposes what create() returned,
      // so a plugin holding that reference to animate it would be moving a
      // discarded object.
      if (!spec.update && !collision && !spec.dispose && !interactable && !spec.animated) {
        const merged = buildMerged(spec, spawns, chunkRadius);
        if (merged) {
          live.push({ spec, object: merged, placement: [0, 0, 0], collision: null, instancedColliders: null, explicitColliders: null, key: `${spec.name}-merged` });
          return;
        }
        // Merge unsupported for this spec — fall through to per-object.
      }

      // Per-object path (dynamic, solid, or merge-fallback). The placement is
      // carried by a WRAPPER (group / RigidBody), NOT added to object.position
      // — so a dynamic `update()` that sets object.position animates in local
      // space around the placed point instead of clobbering the placement.
      for (let si = 0; si < spawns.length; si++) {
        const spawn = spawns[si];
        let object: Object3D | null = null;
        if (prebuilt) {
          object = prebuilt[si];
        } else {
          try {
            object = spec.create(spawn);
          } catch (err) {
            console.warn(`[XRPublisher] decoration "${spec.name}" create() threw`, err);
            break;
          }
        }
        if (!object) continue;
        prepareStaticObject(object, !spec.update && !spec.animated);
        const key = `${spec.name}-${spawn.seed}`;
        live.push({
          spec, object,
          placement: [spawn.position[0], spawn.position[1], spawn.position[2]],
          collision, instancedColliders: null,
          explicitColliders: collision ? readExplicitColliders(object) : null,
          key,
        });

        // "E to interact": register this specific spawn. The object is mounted
        // by a wrapper at `placement`, so its WORLD position is what the
        // proximity loop samples. remove() hides it + unregisters (collect).
        if (interactable) {
          const capturedObject = object;
          const capturedSpawn = spawn;
          const promptSpec = spec.interactionPrompt;
          registerInteractable({
            id: key,
            object: capturedObject,
            radius: spec.interactionRadius ?? 4,
            prompt: typeof promptSpec === 'function'
              ? () => promptSpec(capturedSpawn)
              : (promptSpec ?? spec.name),
            onInteract: () => {
              spec.onInteract!({
                object: capturedObject,
                spawn: capturedSpawn,
                remove: () => {
                  capturedObject.visible = false;
                  unregisterInteractable(key);
                },
              });
            },
          });
          interactableIds.push(key);
        }
      }
    };

    const allSpecs = getDecorationSpecs();
    const patchSpecs = allSpecs.filter((s) => s.groundPatch);
    const otherSpecs = allSpecs.filter((s) => !s.groundPatch);

    // ── Pass 1: register every ground-patch BEFORE building anything, so
    // other specs (and the grass shader) clear against them.
    //
    // Per-object patch specs (solid / dynamic / custom-dispose) have their
    // create() run NOW, and a patch registers ONLY for spawns that actually
    // produced an object. A gated create() (e.g. town buildings that return
    // null away from a town) must not leave orphan dirt circles across the
    // countryside. Instanced/merged patch specs keep patch-per-spawn (their
    // one template create() says nothing about individual spawns). ──
    const patchSpawns: Array<[DecorationSpec, DecorationSpawn[], (Object3D | null)[] | undefined]> = [];
    for (const spec of patchSpecs) {
      const spawns = computeFor(spec);
      let objects: (Object3D | null)[] | undefined;
      if (isPerObject(spec)) {
        objects = new Array<Object3D | null>(spawns.length).fill(null);
        for (let i = 0; i < spawns.length; i++) {
          try {
            objects[i] = spec.create(spawns[i]);
          } catch (err) {
            console.warn(`[XRPublisher] decoration "${spec.name}" create() threw`, err);
            break;
          }
        }
      }
      patchSpawns.push([spec, spawns, objects]);
      const gp = spec.groundPatch!;
      for (let i = 0; i < spawns.length; i++) {
        if (objects && !objects[i]) continue;   // create() declined — no patch
        const spawn = spawns[i];
        // TRUE world position = chunk group origin + the spawn's chunk-local
        // position (matches the terrain shader's positionWorld; spawn.world-
        // Position is a within-chunk estimate offset by width/2).
        patchEntries.push({
          worldX: originX + spawn.position[0],
          worldZ: originZ + spawn.position[2],
          radius: gp.radius,
          color: gp.color,
          clearGrass: gp.clearGrass !== false,
        });
      }
    }
    if (patchEntries.length > 0) {
      registerGroundPatches(patchKey, patchEntries);
    }

    // ── Pass 2: mount patch-spec objects (not cleared by their own patch),
    // then everything else (cleared out of any dirt circle). ──
    for (const [spec, spawns, objects] of patchSpawns) addSpec(spec, spawns, objects);
    for (const spec of otherSpecs) {
      const spawns = computeFor(spec).filter(
        (s) => !isInsideGroundPatch(originX + s.position[0], originZ + s.position[2]),
      );
      addSpec(spec, spawns);
    }

    setEntries(live);
    entriesRef.current = live;
    registerNpcObstacles(patchKey, new Float32Array(npcPacked));

    return () => {
      setEntries([]);
      entriesRef.current = [];
      unregisterNpcObstacles(patchKey);
      unregisterGroundPatches(patchKey);
      for (const id of interactableIds) unregisterInteractable(id);
      // DEFER disposal until AFTER React detaches these <primitive>s. Disposing
      // a geometry synchronously in this cleanup (which runs BEFORE React
      // unmounts the old meshes) frees the GPU index buffer while the mesh is
      // still in the WebGPU render pass — "setIndexBuffer ... not a GPUBuffer".
      // That bites on RE-SCATTER (e.g. when canopy colliders arrive and the
      // effect re-runs): the old merged geometry is freed mid-frame. One rAF
      // later the meshes are detached and safe to free.
      //
      // Belt-and-braces against the rAF racing reconciliation: hide the object
      // NOW (synchronously). An invisible Object3D is skipped in three's
      // projectObject pass, so even if it is still attached (or briefly
      // reattached) when the rAF disposes its geometry, it is never submitted
      // to a render pass and cannot trip setIndexBuffer.
      const toDispose = live;
      for (const { object } of toDispose) object.visible = false;
      requestAnimationFrame(() => {
        for (const { spec, object } of toDispose) {
          try {
            (spec.dispose ?? defaultDispose)(object);
          } catch (err) {
            console.warn(`[XRPublisher] decoration "${spec.name}" dispose() threw`, err);
          }
        }
      });
    };
  }, [
    shouldRender, registryVersion, treeColliderDep, seed, chunkX, chunkZ, originX, originZ,
    width, height, heightScale, segments, heightData, roadStrength, treeSpawns, boulderSpawns,
  ]);

  // One ticker for all dynamic decorations + the patch player position.
  useFrame((state, delta) => {
    if (playerPosition) {
      setGroundPatchPlayer(playerPosition.x, playerPosition.z);
      setRegionMaterialPlayer(playerPosition.x, playerPosition.z);
      setPathPlayer(playerPosition.x, playerPosition.z);
    }
    const live = entriesRef.current;
    if (live.length === 0) return;
    const elapsed = state.clock.elapsedTime;
    for (const { spec, object } of live) {
      if (!spec.update) continue;
      try {
        spec.update(object, delta, elapsed);
      } catch (err) {
        console.warn(`[XRPublisher] decoration "${spec.name}" update() threw — disabling`, err);
        (spec as { update?: unknown }).update = undefined;
      }
    }
  });

  if (!shouldRender || entries.length === 0) return null;

  return (
    <group>
      {entries.map((e) => {
        // Instanced/merged bake their transforms (placement [0,0,0]);
        // per-object entries carry placement on the wrapper so a dynamic
        // update() animates in local space without losing the placement.
        // `dispose={null}` is CRITICAL: when `collidersActive` flips, the
        // wrapper element type changes (<group> ⇄ <RigidBody>) under the same
        // key, so React unmounts the old <primitive> and mounts a new one,
        // reparenting the SAME e.object. Without dispose={null}, R3F frees the
        // object's geometry on that unmount — then the new <primitive>
        // reattaches a geometry whose GPU index buffer is gone, and the next
        // draw throws "setIndexBuffer ... not a GPUBuffer" the instant the
        // object enters the frustum. We own disposal (see the effect cleanup),
        // so R3F must never auto-dispose these.
        if (e.instancedColliders && collidersActive) {
          return (
            <RigidBody key={e.key} type="fixed" colliders={false} position={e.placement}>
              <primitive object={e.object} dispose={null} />
              {e.instancedColliders.map((c, i) => (
                <CuboidCollider key={i} args={c.half} position={c.position} rotation={c.rotation} />
              ))}
            </RigidBody>
          );
        }
        if (e.collision && collidersActive) {
          // Plugin-authored colliders win over auto-colliders: merged visual
          // geometry + hand-placed cuboids (walk-in buildings at a few draw
          // calls instead of one mesh per wall segment).
          if (e.explicitColliders) {
            return (
              <RigidBody key={e.key} type="fixed" colliders={false} position={e.placement}>
                <primitive object={e.object} dispose={null} />
                {e.explicitColliders.map((c, i) => (
                  <CuboidCollider key={i} args={c.half} position={c.position} rotation={c.rotation} />
                ))}
              </RigidBody>
            );
          }
          return (
            <RigidBody key={e.key} type="fixed" colliders={e.collision} position={e.placement}>
              <primitive object={e.object} dispose={null} />
            </RigidBody>
          );
        }
        // Plain wrapper, default matrix handling. Freezing it (matrixAutoUpdate
        // false + an onUpdate that composes once) was tried as a per-frame win
        // and is NOT worth it here: R3F applies props before the child is
        // attached, so the timing of that one compose relative to the child's
        // attach decides whether the decoration lands in the right place at
        // all. The safe version of this optimization lives at the CHUNK group,
        // which owns its own children.
        return (
          <group key={e.key} position={e.placement}>
            <primitive object={e.object} dispose={null} />
          </group>
        );
      })}
    </group>
  );
}
