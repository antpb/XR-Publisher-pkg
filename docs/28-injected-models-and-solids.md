# Injected Models and Solids

Two APIs let a plugin place objects into the live world **from code**, at exact world coordinates, without authoring blocks in the editor or registering terrain-scattered decorations:

- **`XRPublisher.addModel(spec)`** — inject a glTF/GLB by URL, rendered through the engine's own model pipeline (instancing, collision, WebGPU material conversion included).
- **`XRPublisher.addSolid(spec)`** — mount a `THREE.Object3D` you built yourself as a **collidable** fixture the player can stand on.

Both mount at **scene scale** (absolute world coordinates) and **persist across terrain chunk streaming** — unlike decoration spawns, which live and die with their chunk. Both are safe to call before or after world init; late additions appear live, and nothing is lost if the renderer branch swaps.

Use these for "drop a known thing at a known place": a town monument, a quest marker, a stage platform, a ring of pillars.

---

## `addModel(spec) → id` / `removeModel(id)`

The programmatic equivalent of authoring a `<three-model-block>`. Each spec is rendered by the same `ModelObject` component the editor's model blocks use, so you inherit grid **instancing** (`instances[]` → one `InstancedMesh` with per-instance frustum culling), **trimesh collision**, animation playback, and WebGPU material handling for free.

```js
// single model, walkable
const id = XRPublisher.addModel({
  url: 'https://example.com/monument.glb',
  position: [320, 12.4, -320],
  collidable: true,
});

// a perimeter ring — ONE InstancedMesh, near-zero per-instance cost
XRPublisher.addModel({
  url: pillarUrl,
  instances: ring.map((p) => ({ position: p, scale: 1.5 })),
});

// later
XRPublisher.removeModel(id);
```

### Spec

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Stable id. Re-adding the same id **replaces the model in place** (it keeps its render order). The id is returned by `addModel` — returns `''` on an invalid spec. |
| `url` | `string` | *(required)* | glTF/GLB URL. |
| `position` | `[x, y, z]` | `[0, 0, 0]` | World position of the single model. **Ignored when `instances` is provided.** |
| `rotation` | `[x, y, z]` | `[0, 0, 0]` | Euler rotation in **degrees**. |
| `scale` | `number \| [x, y, z]` | `1` | Uniform or per-axis scale. |
| `collidable` | `boolean` | `false` | Give the single model a trimesh collider. |
| `animations` | `string` | none | Comma-separated animation clip names to autoplay. |
| `instances` | `WorldModelInstance[]` | none | Render every entry as **one `InstancedMesh`**. When present, the spec's own `position`/`rotation`/`scale` are ignored — each instance carries its own transform. |

### `WorldModelInstance`

| Field | Type | Default | Description |
|---|---|---|---|
| `position` | `[x, y, z]` | *(required)* | World position of this instance. |
| `rotation` | `[x, y, z]` | `[0, 0, 0]` | Euler rotation in **degrees**. |
| `scale` | `number \| [x, y, z]` | `1` | Per-instance scale. |
| `collidable` | `boolean` | `false` | Give this instance its own trimesh collider. |

Note: the model pipeline has a built-in ~2 second delay before URL loading starts, so injected models appear shortly after the call — this is normal.

[SCREENSHOT: a ring of instanced pillars around a central monument injected at a town centre]

---

## `addSolid(spec) → id` / `removeSolid(id)`

`addModel` only takes a URL, and decorations are per-chunk scatter — neither covers "I built one procedural mesh with `window.THREE` and I want the player to stand on it, right here". `addSolid` is that primitive: the engine mounts your object inside the physics world in a **fixed RigidBody with auto colliders**.

```js
const id = XRPublisher.addSolid({
  object: platformMesh,               // a THREE.Object3D you built
  position: [x, groundY, z],
  colliders: 'hull',
});

// later — you own the object; dispose its geometry yourself
XRPublisher.removeSolid(id);
platformMesh.geometry.dispose();
```

### Spec

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Stable id; re-adding the same id replaces it. Returned by `addSolid` (`''` on invalid spec). |
| `object` | `THREE.Object3D` | *(required)* | Your pre-built object. **You own it** — dispose its geometry after `removeSolid`. |
| `position` | `[x, y, z]` | `[0, 0, 0]` | World position. |
| `rotation` | `[x, y, z]` | `[0, 0, 0]` | Euler rotation in **degrees**. |
| `scale` | `number \| [x, y, z]` | `1` | Uniform or per-axis scale. |
| `colliders` | `'cuboid' \| 'hull' \| 'trimesh' \| 'ball'` | `'hull'` | Auto-collider shape. A convex hull is right for most platforms; use `'trimesh'` sparingly (it cooks synchronously on the main thread at mount). |

**Authoring tip:** build the mesh with its origin at the ground-contact point and extend a small "skirt" below y=0, so the solid never hovers when placed on gently rolling terrain. The resonance-stage plugin (`examples/plugins/resonance-stage-xr-publisher-plugin.umd.js`) is the reference — see [Example: Resonance Stage](67-example-resonance-stage.md).

---

## Seating things on the ground (the frame gotcha)

Injected models and solids are **scene-scale**: they mount outside the terrain's internal offset group. Decoration spawns get the terrain's vertical offset applied automatically by their chunk group — injected objects do **not**. Guessing Y from a heightfield sample plus the terrain block's `positiony` attribute is fragile (the attribute is often absent).

Instead, seat objects with **`getGroundHeight(x, z)`** — a physics raycast that returns the true world-space surface Y, in exactly the frame `position` expects:

```js
function placeWhenReady(x, z) {
  const y = XRPublisher.getGroundHeight(x, z);
  if (y == null) {                    // no terrain collider loaded there yet
    setTimeout(() => placeWhenReady(x, z), 500);   // poll/retry
    return;
  }
  XRPublisher.addModel({ url, position: [x, y, z], collidable: true });
}
```

`getGroundHeight` returns `null` until a terrain collider is loaded near that point (colliders stream with chunks and are culled while flying high) — always poll/retry. See [Terrain queries](31-terrain-queries.md) for the full query surface, including the approximate `sampleTerrain` for points far from the player.

---

## When to use what

| Need | Use |
|---|---|
| Seed-stable scatter across the whole world | [`registerDecoration`](19-decorations-overview.md) |
| Person-placed, editable, saved into the world | [`registerBlockType`](27-custom-blocks.md) |
| A known glTF at a known place (or a grid of one model) | `addModel` |
| One procedural mesh the player can stand on | `addSolid` |
| Repaint the ground itself | [`addTerrainRegion`](29-terrain-regions-and-surfaces.md) |

---

## Next steps

- [Terrain queries](31-terrain-queries.md) — `getGroundHeight`, `sampleTerrain`, `teleportPlayer`
- [Persistent decorations](46-persistent-decorations.md) — scatter-placed structures that survive chunk streaming (and pair with `addSolid` for collision)
- [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md) — cobblestone plazas under your monuments
- [Paths and roads](30-paths-and-roads.md) — connect your placements
- [Example: Town Center](62-example-town-center.md) — models, solids, regions, and paths working together
