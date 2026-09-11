# Decorations Overview

Decorations are plugin-registered scatter objects that the procedural terrain places for you — mushrooms, campfires, huts, fish, lanterns hanging from trees. You describe *what* to build and *where it's allowed to go*; the engine decides the exact spots deterministically from the world seed, so a registered decoration appears in the **same places every visit, on every device and renderer**.

```js
XRPublisher.registerDecoration({
  name: 'minimal-mushroom',
  density: 4,          // ~4 spawns per terrain chunk
  minSpacing: 3,
  create(spawn) {
    const m = new THREE.Group();
    const h = 0.4 + spawn.rng() * 0.5;     // seed-stable variety
    // ...build the mushroom...
    return m;          // the engine positions it on the terrain
  },
});
```

Registration is available as `XRPublisher.registerDecoration(spec)` (static and instance method, and on `window.XRPublisher` for script-tag plugins). Remove a registration with `XRPublisher.unregisterDecoration(name)`.

Decorations are the right tool for *ambient world dressing* tied to the terrain. For one-off structures placed at explicit coordinates, see [Injected models and solids](28-injected-models-and-solids.md); for editor-placeable objects, see [Custom blocks](27-custom-blocks.md).

[SCREENSHOT: a grassy chunk scattered with plugin mushrooms, same layout in two side-by-side sessions]

---

## How placement works

Every terrain chunk walks a coarse grid over its heightfield and makes a deterministic accept/reject draw per cell, seeded by `(world seed, decoration name, chunk coordinates)`. Accepted cells become spawns, filtered by your spec's placement rules (height band, slope, surface type, water distance, biome, spacing — see [Placement filters](20-decoration-placement-filters.md)).

When a chunk loads near the player, the engine calls your `create(spawn)` once per spawn on the main thread and mounts the results inside the chunk group. When the chunk unloads, everything is cleaned up. Chunks re-scatter automatically if a plugin registers *after* the world has loaded — late registration is the normal path for script-tag plugins, and freshly registered decorations pop into already-loaded chunks immediately.

---

## Spec reference

Only `name` and `create` are required.

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | *(required)* | Unique name. Also part of the placement seed — **renaming a decoration relocates every instance of it**. |
| `create` | `(spawn) => Object3D \| null` | *(required)* | Build the object for one spawn. Return `null` to skip that spawn. The engine positions the object — don't set its position yourself unless you want an offset from the terrain point. See [Spawn context](21-decoration-spawn-context.md). |
| `density` | `number` | `1` | Expected spawns per chunk. Fractional values are fine — `0.25` ≈ one spawn every 4th chunk. For `tree`/`tree-base` anchors it's the per-tree chance (capped at 1); for `mountain` anchors it rounds to a per-peak count. |
| `minHeight` / `maxHeight` | `number` | `0.485` / `0.62` | Normalized terrain height band (0..1). Defaults sit above the waterline and below the rocky slopes. A spec with `surface: 'water'` defaults to `0` / `1` instead. |
| `maxSlope` | `number` | none | Maximum terrain steepness (rise/run) to accept. `~0.15` targets flat buildable spots. |
| `minWaterDistance` | `number` | `0` | Required dry distance from water, in units (capped by the 24u within-chunk scan). |
| `maxWaterDistance` | `number` | none | Maximum distance from water — e.g. shoreline props. |
| `surface` | `SurfaceType \| SurfaceType[]` | none | Restrict to terrain surface types: `'water' \| 'sand' \| 'grass' \| 'dirt' \| 'rock' \| 'snow'`. `'water'` drops the default height floor so spawns can sit below the waterline. |
| `biomes` | `string[]` | none | Restrict to biome ids: `'plains' \| 'mountains' \| 'wetlands' \| 'buildable' \| 'default'`. `'buildable'` is the deliberately-flat town-land biome. |
| `minSpacing` | `number` | `0` | Minimum distance between spawns of this decoration **within one chunk** — never across chunk borders. See [Placement filters](20-decoration-placement-filters.md#spacing-minspacing). |
| `avoidRoads` | `boolean` | `true` | Spawns landing on a baked engine road are dropped. Set `false` for road-side props you *want* on the road. |
| `anchor` | `'terrain' \| 'tree' \| 'tree-base' \| 'mountain'` | `'terrain'` | What spawns attach to: the ground grid, tree canopy undersides, trunk bases, or mountain summits. See [Anchors](22-decoration-anchors.md). |
| `waterPlacement` | `'floor' \| 'submerged' \| 'surface'` | `'floor'` | For spawns below the waterline: seat the object on the bed, in the water column, or at the surface. See [Water placement](23-decoration-water-placement.md). |
| `instanced` | `boolean` | `false` | Render every spawn through one `THREE.InstancedMesh` per template mesh — cheap for dense repeated models. Static specs only. See [Instancing](24-decoration-instancing.md). |
| `transform` | `(spawn) => { rotationY?, scale?, tilt? }` | none | Per-instance transform variance for instanced specs. |
| `groundPatch` | `{ radius, color?, clearGrass? }` | none | Paint a dirt clearing on the terrain around each spawn and clear engine grass out of it. See [Ground patches](25-decoration-ground-patches.md). |
| `collision` | `boolean \| 'cuboid' \| 'hull' \| 'trimesh'` | none | Make spawns solid. `true` = `'cuboid'`. See [Collision](26-decoration-collision.md). |
| `interactable` | `boolean` | `false` | Make each spawn "Press E"-able (requires `onInteract`). Forces per-object mounting; incompatible with `instanced`. See [Interactables](33-interactables.md). |
| `interactionPrompt` | `string \| (spawn) => string` | spec name | Prompt shown in the interact banner. A function is re-resolved ~10Hz while the player is near — keep it cheap. |
| `interactionRadius` | `number` | `4` | Interact radius in world units. |
| `onInteract` | `(ctx) => void` | none | Fired on interact: `ctx.object` (that spawn's Object3D), `ctx.spawn`, `ctx.remove()` (despawn — for collectibles). |
| `persist` | `boolean` | `false` | Mount at scene scale and survive chunk streaming — for structures larger than a chunk. See [Persistent decorations](46-persistent-decorations.md). |
| `keepAliveRadius` | `number` | bounding radius × 1.35, clamped `[140, 2000]` | For `persist` specs: how far the player can travel before the object is evicted. |
| `update` | `(object, delta, elapsed) => void` | none | Optional per-frame hook. Present ⇒ the decoration is *dynamic*; absent ⇒ *static* (matrices frozen). |
| `animated` | `boolean` | `false` | "I animate these objects myself" — from a plugin-owned interval/rAF instead of `update`. Forces the per-object mount path (never merged, never instanced) and skips the matrix freeze. See [Animating a static decoration](#animating-a-static-decoration). |
| `dispose` | `(object) => void` | geometry-only cleanup | Custom cleanup when the chunk unloads. Replaces the default (which disposes geometries but not materials). |

---

## Lifecycle

**`create(spawn)`** runs on the main thread, once per spawn, when a chunk loads near the player. Keep it cheap — build small object trees and reuse geometries/materials across spawns (module-level singletons). Return `null` to decline a spawn (e.g. `if (spawn.treeDistance < 5) return null;`).

**`update(object, delta, elapsed)`** — if present, runs every frame for every live spawned object of this spec, all driven from one internal ticker. Budget accordingly, and don't move an object that has `collision` set: the collider is fixed and will not follow.

**`dispose(object)`** — runs when the chunk unloads (or the decoration is unregistered / re-scattered). The default cleanup disposes the **geometries** of the returned object tree but **not materials**, because sharing materials across spawns is the recommended pattern. Provide your own `dispose` if:

- your object clones a shared/cached model (e.g. from `XRPublisher.loadModel`) — supply a no-op `dispose() {}` so the default doesn't free geometry other clones still use;
- you allocate per-spawn materials or other resources the default won't free.

### Dispose ordering: guard per-seed maps by identity

`dispose()` is deliberately **deferred by one animation frame** — freeing a GPU buffer in the same frame the mesh is still being drawn throws under WebGPU. React, meanwhile, runs an effect's cleanup *before* the next effect body. On a chunk **re-scatter** (a late plugin registration, tree colliders arriving, any dependency change) the observed order for one spawn is therefore:

```
create(new object)  →  dispose(old object)     // same spawn.seed
```

So a plugin that keeps a `Map` from `spawn.seed` to the live object, and deletes by seed in `dispose()`, deletes the object it just created — the new object is live in the world but no longer in the map, so state updates and tickers silently skip it. **Delete by object identity:**

```js
dispose(object) {
  const seed = object.userData.seed;                  // stashed in create()
  if (live.get(seed) === object) live.delete(seed);   // only if it's still mine
  object.traverse((o) => o.geometry && o.geometry.dispose());
}
```

The same guard applies to any per-seed bookkeeping — timers, HUD rows, world-state subscriptions. See [World state](41-world-state.md#guard-the-seed--live-object-map-by-identity).

---

## Static vs dynamic

A spec **without** `update` is *static*: after mounting, the engine freezes every matrix in the object tree (`matrixAutoUpdate = false`) so the objects cost nothing per frame. Static specs that are also non-solid, non-interactable, and use the default cleanup are additionally *merged* — all of a chunk's spawns collapse into a few draw calls (one mesh per shared material), which is why sharing materials matters. If you intend to animate a static spec from your own ticker, set [`animated: true`](#animating-a-static-decoration) so neither optimization applies.

A spec **with** `update` is *dynamic*: matrices stay live and your hook ticks every frame. The object's terrain placement is carried by a wrapper group, so an `update` that writes `object.position` animates in **local space around the placed point** — you can't accidentally clobber the placement.

```js
// Dynamic: a bobbing fish (from the lake-fish example)
XRPublisher.registerDecoration({
  name: 'lake-fish',
  density: 3,
  surface: 'water',
  waterPlacement: 'submerged',
  create(spawn) {
    const fish = fishModel.clone(true);              // shared, cached model
    fish.userData.phase = spawn.rng() * Math.PI * 2;
    return fish;
  },
  update(fish, _delta, elapsed) {
    fish.position.y = Math.sin(elapsed * 1.5 + fish.userData.phase) * 0.15;
  },
  dispose() {},   // clones share the cached model's geometry — never free it
});
```

### Animating a *static* decoration

Two engine optimizations make static decorations free, and both defeat a plugin that animates its own objects:

1. **Merging.** A static spec that is also non-solid, non-interactable and uses the default cleanup is *merged*: the engine bakes each spawn's meshes into shared per-material geometry and **discards the object your `create()` returned** (its geometries are disposed). A reference you kept to it is dead — nothing you do to it can ever show up.
2. **The matrix freeze.** On the per-object path the engine walks the whole tree and sets `matrixAutoUpdate = false` on every node. Mutating `position`/`rotation`/`scale` afterwards — from a `setInterval`, your own `requestAnimationFrame`, an async callback — changes nothing on screen, because the matrix is never recomputed.

**Set `animated: true` and both are off.** That's the supported way to say "I animate these objects myself": the spec takes the per-object mount path (never merged, never instanced) and its objects keep live matrices — the same treatment an `update` spec gets, without the per-frame engine hook.

```js
XRPublisher.registerDecoration({
  name: 'windmill',
  density: 0.4,
  animated: true,                         // per-object mount + live matrices
  create(spawn) {
    const mill = new THREE.Group();
    mill.add(buildTower(spawn));

    const blades = buildBlades(spawn);
    mill.add(blades);

    mill.userData.blades = blades;        // so dispose() can find it again
    spinners.add(blades);                 // your own ticker turns it
    ensureTicker();                       // see "Your own ticker" below
    return mill;
  },
  // dispose() is here for the ticker bookkeeping, not to escape merging —
  // `animated: true` is what keeps this spec off the merge path.
  dispose(object) {
    spinners.delete(object.userData.blades);
    object.traverse((o) => o.geometry && o.geometry.dispose());
  },
});
```

Two narrower tools, for when `animated: true` is more than you need:

- **`userData.xrAnimated = true` on a child.** The freeze walk stops descending at any object flagged this way, so that object *and its subtree* keep live matrices while the rest of the build stays frozen. Use it for one moving part inside an otherwise-static object, **on a spec that already takes the per-object path for another reason** — `collision`, `interactable`, `persist`, or a custom `dispose()`. It is not a merge opt-out: on a merged spec the flag rides along on the object that gets thrown away. (It's also redundant under `animated: true`, which leaves the whole tree unfrozen.)
- **Call `obj.updateMatrix()` yourself** after mutating a frozen object. Fine for something you nudge occasionally (a lid opening once on interact); for anything recurring, use `animated: true`.

### Your own ticker vs `update`

`update` is the built-in path: one engine ticker drives every live spawn of the spec, every frame. That's the right choice when the animation must be per-object and frame-accurate.

A **plugin-owned ticker** is often the better trade for ambient motion, and is a fully supported pattern — declare it with `animated: true`:

```js
const spinners = new Set();
let timer = null;

const ensureTicker = () => {                 // self-starting
  if (timer || spinners.size === 0) return;
  timer = setInterval(() => {
    if (spinners.size === 0) { clearInterval(timer); timer = null; return; }  // self-clearing
    for (const o of spinners) o.rotation.z += 0.05;   // animated ⇒ matrix stays live
  }, 100);                                   // 10Hz is plenty for a windmill
};
```

Why it can beat `update`: it runs at **your** cadence rather than the frame rate, it costs literally nothing when no spawn of the spec is loaded (the timer clears itself), and one shared timer can drive many decorations. Remember to remove objects from your set in `dispose()` — and to guard that removal [by identity](#dispose-ordering-guard-per-seed-maps-by-identity), since dispose lands one frame late.

Note that a spec with `update` is already per-object with live matrices, so `animated` is only meaningful on specs that have no `update`.

---

## Determinism rules

Decorations exist to make *procedurally repeatable* worlds, so the engine guarantees:

- **The accept pattern depends only on (world seed, decoration name, chunk coordinates).** The accept/reject draw advances exactly once per candidate cell, before any filtering.
- **Per-spawn randomness is keyed to the cell**, not to spawn order — changing a filter parameter moves only the spawns that filter touches; everything else stays put.
- **Renaming a decoration relocates all of its instances** — the name is part of the seed. Treat names as stable identifiers.

Your side of the contract:

- **Always use `spawn.rng()` for variation, never `Math.random()`.** `spawn.rng` is a per-spawn seeded PRNG that yields the same sequence every visit. For seeded noise, use `spawn.seed` with `XRPublisher.utils` (`alea`, `createNoise2D`, `createNoise3D` — the same primitives the engine's terrain is built from).
- `create()` must be a pure-ish function of its spawn: same spawn in ⇒ same object out.

---

## Shared resources — the singleton pattern

`create()` runs once per spawn, so **never allocate a material (or template geometry) inside it**. Create them once at module level and reuse:

```js
// Once, at plugin load:
const capMat  = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 });
const stemMat = new THREE.MeshStandardMaterial({ color: 0xeee4d0, roughness: 0.9 });

XRPublisher.registerDecoration({
  name: 'minimal-mushroom',
  density: 4,
  create(spawn) {
    const m = new THREE.Group();
    const h = 0.4 + spawn.rng() * 0.5;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, h, 6), stemMat);
    stem.position.y = h / 2;
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.position.y = h;
    cap.scale.y = 0.6;
    m.add(stem, cap);
    return m;
  },
});
```

This is also what makes the static merge path effective: spawns that share a material merge into one draw call per chunk. Per-spawn geometry is fine (the default cleanup frees it); shared *materials* are yours for the session.

---

## Error containment

A misbehaving plugin can't take the world down:

- A **throwing `create()`** logs a warning and skips the rest of that spec's spawns in the chunk. Other specs are unaffected.
- A **throwing `update()`** logs a warning and **disarms** that spec's update — it is not retried every frame.
- A **throwing `dispose()`** or `transform()` is caught and logged.
- An invalid registration (missing `name` or `create`) is rejected with a console warning.

---

## Late registration

Plugins typically load from `<script>` tags after the runtime has already scanned the DOM and possibly loaded terrain. That's fine: the decoration registry versions every register/unregister, and live chunks watch it — registering a decoration mid-session re-scatters loaded chunks immediately. The standard plugin bootstrap:

```js
(function waitForXRP(cb) {
  if (window.XRPublisher && typeof window.XRPublisher.registerDecoration === 'function') return cb();
  setTimeout(() => waitForXRP(cb), 100);
})(function init() {
  // register decorations here
});
```

`unregisterDecoration(name)` likewise removes live instances from loaded chunks.

---

## Next steps

- [Placement filters](20-decoration-placement-filters.md) — control *where* spawns land
- [Spawn context](21-decoration-spawn-context.md) — everything `create(spawn)` receives
- [Anchors](22-decoration-anchors.md) — attach to trees and mountain summits
- [Water placement](23-decoration-water-placement.md) — floating and submerged objects
- [Instancing](24-decoration-instancing.md) — dense scatter at low cost
- [Ground patches](25-decoration-ground-patches.md) — dirt clearings
- [Collision](26-decoration-collision.md) — solid decorations and walk-in structures
- [Persistent decorations](46-persistent-decorations.md) — structures too large to live in one chunk
- [Example: minimal mushrooms](50-example-minimal-mushrooms.md) — the smallest complete decoration
