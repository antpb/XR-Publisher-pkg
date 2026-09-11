# Persistent Decorations (large structures)

A normal [decoration](19-decorations-overview.md) is parented to the terrain chunk that spawned it, and it is disposed the moment that chunk streams out. That's exactly right for a mushroom or a campfire — and exactly wrong for anything *bigger than a chunk*. A race course, a golf hole, a fort, a bridge: the player walks two chunks from the origin, the origin chunk unloads, and the structure they are standing in the middle of vanishes.

`persist: true` fixes that. The engine mounts the created object at **scene scale** instead of inside the chunk group, and keeps it alive until the player moves beyond a **keep-alive radius** — regardless of which chunks are loaded.

```js
XRPublisher.registerDecoration({
  name: 'golf-hole',
  density: 0.08,               // rare — one every dozen-ish chunks
  biomes: ['buildable'],
  maxSlope: 0.08,
  persist: true,
  keepAliveRadius: 400,        // the hole is ~300u tee-to-green
  create(spawn) {
    return buildHole(spawn);   // tee, fairway markers, flag — all one Object3D
  },
  dispose(object) {
    object.traverse((o) => o.geometry && o.geometry.dispose());
  },
});
```

[SCREENSHOT: a long course structure still fully present while the player stands at the far end of it]

---

## Spec fields

| Field | Type | Default | Description |
|---|---|---|---|
| `persist` | `boolean` | `false` | Mount at scene scale and survive chunk streaming. Ignored when combined with `instanced`. |
| `keepAliveRadius` | `number` | bounding radius × 1.35, clamped to `[140, 2000]` | World-unit radius around the spawn point within which the object stays mounted. |

Everything else about the spec is unchanged: placement filters, anchors, `interactable`, `groundPatch`, `update` and `dispose` all behave as documented — with the lifecycle differences below.

### Choosing a keep-alive radius

The default is derived from the object's own bounding sphere, so a structure that is honest about its size usually needs no configuration. Set it explicitly when the object's **meaningful extent is larger than its geometry** — a course whose gameplay spans 300u even though the built meshes are small props, or a structure whose parts are added asynchronously after `create()` returns (the bounding sphere is measured once, right after `create()`).

Rule of thumb: **set it to the farthest point a player can stand and still be "inside" the thing**, plus a margin. Too small and the structure evicts under the player's feet; too large and it pins memory long after they've left. The clamp (`140` minimum) guarantees even a tiny persistent object survives a chunk or two of travel.

---

## Lifecycle differences

| | Normal decoration | `persist: true` |
|---|---|---|
| Parent | the terrain chunk group | the scene root |
| Position | chunk-local (`spawn.position`) | world (`spawn.renderPosition`, with the terrain block's vertical offset applied for you) |
| `create()` | once per chunk load | once per **eviction cycle** — deduped by spawn seed, not re-run while the object is alive |
| `dispose()` | on chunk unload | on **eviction** (player left the keep-alive radius) |
| Colliders | auto from `collision` | **none** — see below |

**`create()` is deduped by seed.** While a persistent object is alive, chunks streaming in and out around it do not call `create()` again for that spawn. Re-entering the area after an eviction re-runs `create()` from the same seed, so build deterministically (as always) and the structure comes back identical.

**Eviction is checked ~4Hz** against the player's XZ position, and the actual `dispose()` runs one animation frame later (freeing GPU buffers mid-frame throws under WebGPU). See [the dispose-ordering note](19-decorations-overview.md#dispose-ordering-guard-per-seed-maps-by-identity) if you keep a seed → object map.

**Chunk-scoped side effects still follow chunk residency.** A [ground patch](25-decoration-ground-patches.md) registered by a persistent spec, and the [interactable](33-interactables.md) registration for its spawns, are re-registered per chunk load and released on chunk unload — only the *object* is persistent. Interactables on a persistent structure therefore stop responding once the origin chunk unloads; put interactables on their own non-persistent spec (or accept that they're only live near the origin).

---

## Persistent decorations get no colliders

Persistent objects are mounted **without a RigidBody**. The physics wrapper is part of the chunk mount, and these deliberately live outside it — so a `persist` spec's `collision` setting produces no colliders at all (it still widens the spawn's NPC-avoidance radius, but nothing physical: the player walks straight through).

For a persistent structure the player must walk on, build the visuals as a persistent decoration and add the collidable part with [`XRPublisher.addSolid`](28-injected-models-and-solids.md#addsolidspec--id--removesolidid):

```js
let platformId = null;

create(spawn) {
  const rp = spawn.renderPosition;
  const s = XRPublisher.sampleTerrain(rp[0], rp[2]);      // renderPosition[1] is NOT world Y
  const build = buildFort(spawn);
  platformId = XRPublisher.addSolid({
    object: buildFortFloor(spawn),
    position: [rp[0], s ? s.worldY : 0, rp[2]],
    colliders: 'hull',
  });
  return build;
},
dispose(object) {
  if (platformId) { XRPublisher.removeSolid(platformId); platformId = null; }
  object.traverse((o) => o.geometry && o.geometry.dispose());
},
```

You own anything added with `addSolid` — remove it in `dispose()`, or it outlives the structure. (Track ids per seed if the spec can have more than one live spawn.)

> ⚠️ `renderPosition[1]` is the raw terrain sample, not world Y — see [the Y caveat](21-decoration-spawn-context.md#renderposition1-is-not-world-y).

---

## When *not* to use it

- **Small props** — a persistent object is more expensive to reason about and pins memory past its chunk. If it fits inside a chunk, let it live and die with one.
- **Dense scatter** — `persist` is ignored on `instanced` specs, and hundreds of persistent objects defeat the point of streaming.
- **A known fixed location** — if the structure belongs at explicit coordinates rather than wherever the terrain offers a spot, use [`addModel`/`addSolid`](28-injected-models-and-solids.md) instead; they persist unconditionally and don't involve scatter at all.

`update` still works on a persistent spec (ticked every frame while the object is alive, throws disarm it like any decoration update), but the same advice applies as everywhere else: for cheap animation, a plugin-owned ticker is often better. A persistent spec is never merged, but a spec with no `update` is still **matrix-frozen** after `create()` — so add `animated: true` (or flag the moving child with `userData.xrAnimated = true`) or your ticker's writes never reach the screen. See [Animating a static decoration](19-decorations-overview.md#animating-a-static-decoration).

---

## Next steps

- [Decorations overview](19-decorations-overview.md) — the spec, lifecycle, and determinism rules
- [Injected models and solids](28-injected-models-and-solids.md) — `addSolid` for persistent collidables
- [Spawn context](21-decoration-spawn-context.md) — `renderPosition` and its Y caveat
- [Persisted world state](41-world-state.md) — giving a big structure state that survives reloads
