# Decoration Spawn Context

Every call to your spec's `create(spawn)` (and `transform(spawn)`, `interactionPrompt(spawn)`, `onInteract`'s `ctx.spawn`) receives a **spawn object** describing one placement: where it is, what the terrain looks like there, and a deterministic random stream for building it. This page documents every field.

```js
create(spawn) {
  if (spawn.treeDistance < 5) return null;      // too close to a tree — skip
  const h = 0.4 + spawn.rng() * 0.5;            // seed-stable variation
  // ...build and return an Object3D...
}
```

---

## Field reference

| Field | Type | Description |
|---|---|---|
| `position` | `[x, y, z]` | Chunk-local position. **Already applied by the engine** — your object mounts at this point; build at your local origin. |
| `renderPosition` | `[x, y, z]` | World-space X/Z in the **render frame** — the frame shared by `getPlayerState()`, `getPeers()`, `addTerrainRegion`/`addPath` centers, and `setWorldState` positions. **Use this whenever a coordinate leaves the decoration system.** Consistent across all anchor types. ⚠️ **Y is not world Y** — see [the Y caveat](#renderposition1-is-not-world-y). |
| `worldPosition` | `[x, y, z]` | Legacy world-space position — see [renderPosition vs worldPosition](#renderposition-vs-worldposition) below. Prefer `renderPosition`. |
| `normalizedHeight` | `number` | Terrain height 0..1 at the spawn (water is below ~0.48). **Terrain anchors only** — a fixed placeholder on anchored spawns. |
| `slope` | `number` | Terrain steepness as rise/run (0 = flat, ~0.5 = steep hillside), from the heightfield gradient. **Terrain anchors only.** |
| `waterDistance` | `number` | Distance in units to the nearest water surface, capped at 24 (within-chunk scan only). **Terrain anchors only.** |
| `surface` | `'water' \| 'sand' \| 'grass' \| 'dirt' \| 'rock' \| 'snow'` | Coarse surface type at the spawn, matching the color bands the terrain paints. **Terrain anchors only.** |
| `biome` | `string` | Biome id: `'plains' \| 'mountains' \| 'wetlands' \| 'buildable' \| 'default'`. `'buildable'` is the flat town-land biome. **Terrain anchors only.** |
| `waterLevel` | `number` | Local Y of the water surface, **in the same frame as `position[1]`** — for manual in-water placement (see [Water placement](23-decoration-water-placement.md)). |
| `treeDistance` | `number` | Distance to the nearest engine tree spawn in this chunk (`Infinity` if none). |
| `boulderDistance` | `number` | Distance to the nearest engine boulder spawn in this chunk (`Infinity` if none). |
| `anchorScale` | `number?` | For `'tree'`/`'tree-base'`/`'mountain'` anchors only: the **anchor's own radius** — the canopy-blob radius, the base-ring radius, or the mountain's base radius. **Not** the tree's scale factor. `undefined` for terrain anchors. |
| `anchorRadius` | `number?` | For anchored spawns only: a usable scatter radius around the anchor point (canopy blob radius, trunk-base ring, or summit disc). |
| `groundHeightAt` | `(dx, dz) => number` | **Terrain-grid spawns only** (absent on tree/mountain anchors). Ground height at an offset from the spawn point, *relative to your object's origin plane* — see below. |
| `rng` | `() => number` | Per-spawn deterministic PRNG (alea). Same sequence every visit — use it instead of `Math.random()` for all variation. |
| `seed` | `string` | The seed string feeding `rng` — use it to seed your own noise (`XRPublisher.utils.createNoise3D(spawn.seed)`) or as a stable per-spawn identity key (e.g. for [world state](41-world-state.md) or tracking collected items). Shape: `{worldSeed}-decoration-{name}-{chunkX}-{chunkZ}-{gx}-{gz}` — **don't parse it by hand** (see `chunkPrefix`). |
| `chunkPrefix` | `string?` | The `fetchWorldState({ prefix })` string matching **every spawn of this decoration in this chunk** — `seed` minus the two trailing grid coords. Present on terrain-grid spawns only (`undefined` on tree/mountain anchors, whose seeds carry no chunk coords). |
| `index` | `number` | Spawn index within this chunk for this decoration. |
| `chunkX`, `chunkZ` | `number` | The owning chunk's grid coordinates. |

---

## Position and frames

Three position fields, three purposes:

- **`position`** — chunk-local, informational. The engine mounts your object here inside the chunk group; you never apply it yourself. Its Y is where your object's origin sits (already adjusted by [`waterPlacement`](23-decoration-water-placement.md) for water spawns).
- **`renderPosition`** — world-space in the render frame. This is the one to use for anything that talks to the rest of the runtime: painting a terrain region under a structure, storing a position in world state, measuring distance to the player.
- **`worldPosition`** — legacy, kept for back-compat.

### renderPosition vs worldPosition

`worldPosition` predates `renderPosition` and is **inconsistent across anchor types**: for terrain and tree anchors it's in the terrain *worker* frame — half a chunk higher on both X and Z than the render frame every other runtime API uses — while for mountain anchors it was always render-frame. Plugins used to hand-apply a `[wx - chunkWidth/2, wz - chunkHeight/2]` correction, and getting it wrong placed effects tens of units away from the object.

`renderPosition` ends that: it is the render-frame world XZ **for every anchor type**, no correction needed. Its Y carries the same terrain-sample semantics as `worldPosition[1]` (the raw terrain-height sample; the terrain block's own vertical offset is not included).

**Recommendation: always use `renderPosition`; treat `worldPosition` as deprecated.**

### `renderPosition[1]` is not world Y

The X and Z of `renderPosition` are true world coordinates. **Y is not.** It is the raw terrain-height sample at the spawn, *without* the terrain block's own vertical offset — the `positiony` on `<three-terrain-block>`, commonly `10`. Chunk-mounted decorations never notice, because the chunk group supplies that offset; a coordinate that leaves the decoration system does:

```js
// WRONG — off by the terrain block's positionY (10u on a default world)
const dy = XRPublisher.getPlayerState().y - spawn.renderPosition[1];
mob.position.y = spawn.renderPosition[1];        // spawns 10m in the air

// RIGHT — sample the true world surface at the same XZ
const s = XRPublisher.sampleTerrain(spawn.renderPosition[0], spawn.renderPosition[2]);
mob.position.y = s.worldY;
```

So: `renderPosition[0]` / `[2]` for anything world-space horizontal (world-state `pos`, region and path centers, distance to the player), and [`sampleTerrain(x, z).worldY`](31-terrain-queries.md#sampleterrainx-z--terrainsample--null) — or [`getGroundHeight(x, z)`](31-terrain-queries.md#getgroundheightx-z--number--null) for exact collider contact near the player — for a true world Y. This bites hardest with [injected models and solids](28-injected-models-and-solids.md), which mount at scene scale and get no chunk offset.

```js
create(spawn) {
  const hut = buildHut(spawn.rng);
  // Paint a floor under the hut — region centers are render-frame:
  XRPublisher.addTerrainRegion({
    center: [spawn.renderPosition[0], spawn.renderPosition[2]],
    radius: 6,
    surface: 'cobblestone',
  });
  return hut;
}
```

---

## The random stream: rng and seed

`spawn.rng` is an [alea](https://www.npmjs.com/package/seedrandom)-seeded PRNG unique to this spawn, and `spawn.seed` is the string that seeded it. Together they make generative builds repeatable:

```js
create(spawn) {
  const noise = XRPublisher.utils.createNoise3D(XRPublisher.utils.alea(spawn.seed));
  const stack = 3 + Math.floor(spawn.rng() * 2);   // deterministic segment count
  // ...
}
```

Two things to know:

- The stream is **stateful** — every `rng()` call advances it. Draw values in a consistent order so the same spawn always builds the same object.
- The seed is keyed to the spawn's grid cell (or tree/mountain), not to spawn order, so neighboring spawns changing (e.g. from a filter tweak) never alters *this* spawn's stream.

`spawn.seed` is also the natural persistent identity for a spawn — the [world-state](41-world-state.md) docs and the farm-plots example use it as the record key, and collectible decorations track collected `spawn.seed`s to return `null` from `create()` on reload.

Its shape is `{worldSeed}-decoration-{name}-{chunkX}-{chunkZ}-{gx}-{gz}` — **two** trailing grid coordinates, and negative chunk coords produce double dashes (`…-decoration-campfire--3--2-16-8`). Treat it as an opaque key: when you need the per-chunk query prefix for [world state](41-world-state.md#the-chunk-prefix-use-spawnchunkprefix-never-slice-the-seed), use **`spawn.chunkPrefix`** rather than slicing the string, which silently produces a per-grid-column prefix and defeats the engine's per-chunk fetch coalescing.

---

## Terrain context: making decisions in create()

The declarative [placement filters](20-decoration-placement-filters.md) run first; the context fields let `create()` go further — branch the *kind* of object, or decline the spawn entirely by returning `null`:

```js
create(spawn) {
  if (spawn.treeDistance < 5) return null;         // don't clip a trunk
  if (spawn.biome === 'wetlands') return buildStilted(spawn.rng);
  if (spawn.slope > 0.25) return buildTerraced(spawn.rng);
  return buildFlat(spawn.rng);
}
```

Declining spawns is cheap and deterministic-safe (the spawn simply doesn't exist this session; its neighbors are unaffected).

`treeDistance` / `boulderDistance` measure to the nearest *engine* tree/boulder spawn **within the same chunk** — a tree just across a chunk border won't register, so keep clearances modest.

---

## groundHeightAt — seating multi-point structures

A spawn is a single point, and your object mounts on that point's ground plane. On sloped terrain, a wide flat build floats on the downhill side and buries on the uphill side. `groundHeightAt(dx, dz)` solves this: it returns the bilinear-interpolated ground height at an offset `(dx, dz)` from the spawn, **relative to your object's origin plane** (its local y = 0). Sample it per part and set each part's local Y:

```js
// Fence line that follows the terrain (pattern from the farm-plots plugin)
create(spawn) {
  if (!spawn.groundHeightAt) return null;   // terrain-grid spawns only
  const fence = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const dx = i * 1.5 - 5.25;
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(dx, spawn.groundHeightAt(dx, 0) + 0.5, 0);
    fence.add(post);
  }
  return fence;
}
```

Samples clamp at the chunk border. The function is only present on terrain-grid spawns — tree and mountain anchors don't carry it.

[SCREENSHOT: a fence line on a hillside, every post footed on the ground]

---

## Anchored spawns: what changes

Spawns from `'tree'`, `'tree-base'`, and `'mountain'` anchors don't walk the terrain grid, so they never sample the heightfield. `surface`, `biome`, `slope`, `waterDistance` and `normalizedHeight` on those spawns are **fixed placeholders, not best-effort measurements**: tree anchors always report `surface: 'grass'`, `biome: 'default'`, `slope: 0`, `normalizedHeight: 0.55` and a maxed-out `waterDistance`; mountain anchors always report `surface: 'rock'`, `biome: 'mountains'`, `normalizedHeight: 1`.

Two rules follow:

- **Don't branch on them** in an anchored spec's `create()` — the value is a constant, identical for every spawn, and says nothing about the ground.
- **Don't put `surface` / `biomes` / `maxSlope` / water-distance [filters](20-decoration-placement-filters.md) on an anchored spec** — they'd filter against the placeholder, not the terrain, so they either pass everything or reject everything.

What anchored spawns gain instead is `anchorScale` and `anchorRadius`, which describe the real geometry they're attached to. See [Anchors](22-decoration-anchors.md) for how to use them.

---

## Next steps

- [Placement filters](20-decoration-placement-filters.md) — declarative placement rules
- [Anchors](22-decoration-anchors.md) — anchorScale/anchorRadius in practice
- [Water placement](23-decoration-water-placement.md) — using `waterLevel`
- [World state](41-world-state.md) — persisting per-spawn state keyed by `spawn.seed`
