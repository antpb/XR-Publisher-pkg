# Terrain Regions and Surfaces

A **terrain region** replaces the terrain's surface material inside a world-space circle — a cobblestone town plaza, a stone courtyard, a scorched ritual ring. The override is composited into the engine's one shared terrain material, so regions are cheap: terrain fragments outside any region pay only a distance check.

A **terrain surface** is a registered procedural material that regions (and [paths](30-paths-and-roads.md)) reference by id. The engine ships `'cobblestone'` built in; plugins can register their own with TSL.

```js
XRPublisher.addTerrainRegion({
  center: [320, -320],
  radius: 40,
  surface: 'cobblestone',
  clearGrass: true,
});
```

[SCREENSHOT: a circular cobblestone plaza blended into grassy terrain, grass cleared inside the circle with a soft dirt edge]

---

## `addTerrainRegion(spec) → id` / `removeTerrainRegion(id)`

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Stable id, returned by `addTerrainRegion`. Re-adding the same id replaces the region — useful for live updates (e.g. re-tinting a farm plot's soil per growth stage). |
| `center` | `[x, z]` | *(required)* | World-space centre. |
| `radius` | `number` | *(required)* | Radius in world units. The surface fades out over the outer ~18% of the radius, so edges blend into the terrain. |
| `surface` | `string` | `'cobblestone'` | A registered surface id (see below). |
| `scale` | `number` | `0.35` | Feature scale — cells per world unit (bigger = smaller stones). |
| `mortar` | `number` | `0.08` | The surface's second parameter — mortar seam width for cobblestone. |
| `tint` | `[r, g, b]` | the surface's `fallbackColor`, else `[1, 1, 1]` | RGB multiplier over the surface colour. Also serves as the flat colour custom surfaces currently render with — which is why an untinted region defaults to its surface's `fallbackColor` (see limitations). |
| `clearGrass` | `boolean` | `true` | Collapse engine grass inside the circle and draw a stone-dirt underlay beneath the surface edge. |

### Region cap and culling

The terrain shaders loop a fixed uniform array of **`MAX_REGION_MATERIALS = 8`** regions. You can register more than 8 — the engine keeps the **nearest 8 to the player** packed into the uniforms and swaps the set as the player moves (re-evaluated after ~10 units of movement). Distant regions simply stop rendering until the player approaches; their registrations are never lost.

### Grass clearing

`clearGrass` is delegated to the [ground-patch system](25-decoration-ground-patches.md): the region registers a matching dirt patch (keyed to the region id), so grass blades collapse inside the circle and a dark stone-dirt underlay shows at the soft edge where the surface fades. Pass `clearGrass: false` to paint the surface and keep the grass.

### Water awareness

Region surfaces **fade out at the waterline** (`regionWaterY`, published by the terrain system): as fragments approach the water surface Y, the override blends back to natural terrain, so a plaza that overlaps a pond edge never paves over (or just under) the water — the shoreline wash shows through instead. This applies on both renderers, and to paths too.

---

## `registerTerrainSurface({ id, tsl, fallbackColor })`

Register a procedural surface that regions can reference by id.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | *(required)* | Unique id. Regions with an unknown `surface` id fall back to index 0 — the built-in `'cobblestone'`. Re-registering an id replaces it in place. |
| `tsl` | `(ctx) => vec4` | *(required)* | TSL node factory returning `vec4(color.rgb, roughness)`. Author with `XRPublisher.tsl` (the bundled `three/tsl` — a second three copy breaks node identity). |
| `fallbackColor` | `[r, g, b]` | mid grey | Flat colour used where the full TSL pattern can't run (see limitations below). |

The `tsl` factory receives a context of TSL nodes:

| `ctx` property | Description |
|---|---|
| `worldPos` | World position node (`positionWorld`). **Warning:** at large world coordinates (towns can be 10k+ units out), f32 precision destroys `fract(sin(dot(...)))`-style hashes. Prefer `localXZ` for any noise/cell pattern. |
| `localXZ` | Region-**local** ground position (`vec2`): `worldPos.xz − region centre`. Stays small (≈ ±radius) no matter how far the region is from the origin, keeping procedural hashes precise. Use this for Worley/cell/noise patterns. |
| `params` | Per-region params node `vec3(surfaceIndex, scale, p2)` — `.y` is the region's `scale`, `.z` its `mortar`/second param. |
| `tint` | Per-region tint node (`vec3` RGB multiplier). |

```js
const { Fn, vec2, vec3, vec4, float, fract, sin, dot, mix } = XRPublisher.tsl;

XRPublisher.registerTerrainSurface({
  id: 'brick',
  tsl: ({ localXZ, params, tint }) => Fn(() => {
    const uv = localXZ.mul(params.y);
    // ...brick pattern...
    return vec4(brickColor.mul(tint), float(0.8));
  })(),
  fallbackColor: [0.5, 0.2, 0.15],
});
```

### Compile-once contract — register at plugin init

The shared terrain material is built **once** and reused by every chunk. Surfaces registered *before* the material first builds cost nothing. A surface registered *after* (late plugin init) triggers a one-time dispose + rebuild of the shared material. Register your surfaces as early as your plugin runs — before terrain streams — to avoid the rebuild entirely.

### Current limitations (custom surfaces)

The built-in `'cobblestone'` renders at full procedural fidelity on **both** renderers (a native TSL path on WebGPU, a matching GLSL twin on WebGL).

**Custom TSL surfaces currently render as a flat colour rather than their full TSL pattern** — but the *same* flat colour on both renderers. A region that omits `tint` inherits its surface's registered `fallbackColor` as its tint, and both renderers paint the flat-fallback path straight from the tint, so one region is one colour everywhere. (Set `tint` explicitly and it wins on both, as a multiplier over the fallback look.) Pick a `fallbackColor` that reads as an intentional flat surface and you're done.

Full TSL compositing of registered surfaces on WebGPU exists behind the experimental `?surfacechain=1` query parameter while it's verified; the shipping default is unchanged so the established cobblestone look can't regress — treat the full pattern as a progressive enhancement. Note that under the experimental chain, surfaces registered *after* the material builds aren't included — one more reason to register at plugin init.

---

## Putting it together

The town-center plugin lays a plaza at every discovered town (see [Paths and roads](30-paths-and-roads.md) for `getWorldTowns` and its coordinate frames):

```js
const towns = await XRPublisher.getWorldTowns({ minX: -2000, minZ: -2000, maxX: 2000, maxZ: 2000 });
for (const t of towns) {
  XRPublisher.addTerrainRegion({
    // Key off the stable planner coords, paint at the render-frame centre.
    id: `town-plaza-${t.x}-${t.z}`,
    center: [t.renderX, t.renderZ], radius: 42,
    surface: 'cobblestone', scale: 0.5, mortar: 0.08, clearGrass: true,
  });
}
```

Live-updating a region by re-adding its id is the pattern the farm-plots plugin uses to tint soil per growth stage — see [Example: Farm Plots](61-example-farm-plots.md).

---

## Next steps

- [Paths and roads](30-paths-and-roads.md) — the linear cousin: trails, streets, and the world road network
- [Ground patches](25-decoration-ground-patches.md) — the dirt-circle system regions delegate grass clearing to
- [Terrain queries](31-terrain-queries.md) — find flat, dry sites for your regions
- [Example: Town Center](62-example-town-center.md) — plazas, ring streets, and monuments
- [Example: Farm Plots](61-example-farm-plots.md) — per-stage soil tinting via region re-add
