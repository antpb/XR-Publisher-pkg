# Paths and Roads

Three layers of road-building, from a single hand-drawn trail to a fully automatic world-wide network:

1. **`addPath(spec)`** — paint a trail along a world-space polyline into the terrain material (the linear cousin of [`addTerrainRegion`](29-terrain-regions-and-surfaces.md)).
2. **`buildRoadNetwork(spec)`** — plan a road web between *your* settlement points, routed around water and mountains, and feed the resulting polylines to `addPath`.
3. **`configureWorldRoads(cfg)`** — turn on the engine's fully deterministic town + road network, baked into terrain chunks as they generate. **`getWorldTowns(bounds)`** reads back the town centres it discovered.

[SCREENSHOT: a dirt road winding between two towns, skirting a lake, with trees cleared off the roadway]

---

## `addPath(spec) → id` / `removePath(id)`

A path is a chain of world-space segments with a width and a tint, painted into both terrain materials per fragment and layered **over** any terrain region beneath — a trail reads across a cobblestone plaza and across bare terrain alike.

```js
XRPublisher.addPath({
  id: 'trail-1',
  points: [[0, 0], [120, 40], [260, 40]],
  width: 5,
  tint: [0.9, 0.85, 0.75],
});
```

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | *(required)* | Stable id (used by `removePath`). Returned by `addPath` (`''` on invalid spec). |
| `points` | `[x, z][]` | *(required)* | Ordered world-space waypoints — at least 2. The path runs through them. |
| `width` | `number` | `4` | Path width in world units. |
| `surface` | `string` | `'cobblestone'` | Accepted for API compatibility, but **currently ignored by the painters** — every path renders with the packed-dirt-and-pebble "world road" look. `tint` is the look control. |
| `scale` / `p2` | `number` | `0.4` / `0.08` | Surface parameters — carried for API compatibility, currently unused by the painters. |
| `tint` | `[r, g, b]` | `[1, 1, 1]` | RGB multiplier over the path colour — **the effective look control** (sandy, dark, reddish trails). |
| `clearGrass` | `boolean` | — | Accepted for API compatibility. **Grass does not currently clear over paths** — see below. |

### What paths do (and don't) affect

- **Look:** packed dirt + pebble noise (the same recipe as engine roads, so paths and roads read as one material system), multiplied by `tint`, with high roughness. Layered over regions, so a trail crossing a plaza stays visible.
- **Water:** paths fade out at the waterline automatically — they never pave over water. Route around lakes yourself using [`sampleTerrain` / `isWaterAt`](31-terrain-queries.md) (or let `buildRoadNetwork` do it).
- **Trees:** adding or removing a path notifies nearby terrain chunks, and **trees re-filter off the path** — even chunks whose forests were already built.
- **Grass:** grass does **not** read path segments — blades still stand on a painted trail. If you need a clean walking surface, pair the path with grass clearing from another system: a [`addTerrainRegion`](29-terrain-regions-and-surfaces.md) or a decoration [`groundPatch`](25-decoration-ground-patches.md) along the route (this is what town plazas do), or use the engine's baked world roads (below), which do clear grass.
- **Cap:** the shaders loop a fixed array of **48 segments**, kept packed with the nearest-to-player set — long roads work; only the nearest 48 segments render at once. Registrations beyond the cap aren't lost, just culled until you approach.

---

## `buildRoadNetwork(spec) → Promise<{ roads }>`

Plan a road network over a region: the terrain worker samples a cost field over the bounds, connects your settlement points with a spanning tree plus a few loop edges, and runs A* between connected pairs — so every road follows walkable ground (flat grass/plains/buildable) and routes **around** water, the rocky/snow high band, mountains, and steep slopes. Resolves to `{ roads: [] }` before a procedural terrain mounts.

```js
const { roads } = await XRPublisher.buildRoadNetwork({ bounds, settlements });
roads.forEach((r, i) =>
  XRPublisher.addPath({ id: `road-${i}`, points: r.points, width: 6 })
);
```

| Field | Type | Default | Description |
|---|---|---|---|
| `bounds` | `{ minX, minZ, maxX, maxZ }` | *(required)* | World-space region the cost grid covers. Pad it by at least `maxEdgeLength` beyond `coreBounds` so boundary settlements see their neighbours and A* can route through the margin. |
| `settlements` | `[x, z][]` | *(required)* | Points to connect — place them on walkable ground (verify with `sampleTerrain`/`isWaterAt`). |
| `cellSize` | `number` | `12` | Cost-grid resolution in world units (smaller = finer + slower). |
| `maxEdgeLength` | `number` | `700` | Don't connect settlements farther apart than this. |
| `coreBounds` | `{ minX, minZ, maxX, maxZ }` | none | Only return edges with **both** endpoints inside this smaller box. Set it to the region you actually want roads in, with `bounds` padded around it — overlapping queries then compute identical edges and never draw duplicate parallel roads. |

Each returned `RoadEdge` is `{ a, b, points }` — the indices of the two settlements it connects and a world-space polyline ready for `addPath`.

---

## `configureWorldRoads(cfg)` — the automatic world network

The highest layer: a deterministic town + road network the terrain worker bakes **straight into each chunk** as it generates. Towns are discovered and roads planned in the worker, cached per fixed super-tile, so a road is known the moment its chunk is generated and never recomputed as the player moves. Baked roads render as a per-vertex dirt road **with grass and trees cleared off automatically** (unlike `addPath`).

```js
// the entire town-roads example plugin, essentially:
XRPublisher.configureWorldRoads({
  roadWidth: 7,
  superTile: 6000,
});
```

Pass a partial config (defaults fill the rest), `true` for all defaults, or `false`/`null` to disable. Returns the resolved config (or `null` when disabling).

| Field | Default | Description |
|---|---|---|
| `enabled` | — | Master switch (set for you by `configureWorldRoads`). |
| `townCell` | `760` | One town *candidate* per this-size world cell (rare towns). |
| `minClearance` | `95` | A town needs a buildable clearing at least this deep (world units). |
| `roadWidth` | `7` | Road surface width (world units). |
| `superTile` | `6000` | Fixed planning-tile size. Keep it much larger than `maxEdge` so town clusters fall inside one tile. |
| `maxEdge` | `1700` | Longest road between two town centres. |
| `cellSize` | `16` | Road-planner cost-grid resolution. |
| `clrDirs` / `clrStep` / `clrMax` | `10` / `28` / `360` | Clearance-probe tunables (change these and towns land in different places). |
| `cellStep` | `70` | Coarse scan step when hunting the deepest buildable point in a town cell. |

**Call it once at plugin init, before terrain streams**, so the first chunks already include roads. Enabling roads after chunks have mounted still works — affected chunks regenerate with roads baked in — but it costs a visible re-stream.

The reference plugin is `examples/plugins/town-roads-xr-publisher-plugin.umd.js` — it does nothing but call `configureWorldRoads` (see [Example: Town Roads](65-example-town-roads.md)). Town *visuals* (plazas, buildings) are deliberately someone else's job, built on `getWorldTowns`.

---

## `getWorldTowns(bounds) → Promise<[{ x, z, renderX, renderZ }]>`

The deterministic town centres `configureWorldRoads` places, within a world-space box — backed by the same cached super-tile network the road bake uses, so it never re-discovers or disagrees with the roads. Resolves to `[]` before terrain mounts **or when world roads aren't configured** — call `configureWorldRoads` first.

```js
const towns = await XRPublisher.getWorldTowns({
  minX: px - 2000, minZ: pz - 2000, maxX: px + 2000, maxZ: pz + 2000,
});
```

### Coordinate frame

Each town carries its centre in **both** frames:

| Field | Frame | Use it for |
|---|---|---|
| `x`, `z` | Road-planner / terrain-worker frame | **Stable identity** — map keys, per-town seeds, names. It never shifts, so anything derived from it stays put. |
| `renderX`, `renderZ` | Render frame | **Placement** — `addTerrainRegion` / `addPath` centres, `addModel` / `addSolid` positions, `teleportPlayer`, and distance checks against `getPlayerState()` or `spawn.renderPosition`. |

```js
for (const t of towns) {
  XRPublisher.addTerrainRegion({
    id: `plaza-${t.x}-${t.z}`,          // key off the stable worker coords
    center: [t.renderX, t.renderZ],     // …place with the render-frame pair
    radius: 42,
    clearGrass: true,
  });
}
```

There's no half-chunk arithmetic to do any more — if you have older plugin code doing `t.x - CHUNK_W / 2`, replace it with `t.renderX`. (See [Terrain queries](31-terrain-queries.md#coordinate-frames) for the frames overview.)

---

## Next steps

- [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md) — plazas at your road junctions
- [Terrain queries](31-terrain-queries.md) — `sampleTerrain` / `isWaterAt` for settlement siting
- [Example: Town Roads](65-example-town-roads.md) — the one-call network plugin
- [Example: Town Center](62-example-town-center.md) — ring streets and spokes drawn with `addPath` over a plaza
