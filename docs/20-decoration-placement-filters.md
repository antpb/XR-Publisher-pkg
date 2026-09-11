# Decoration Placement Filters

Placement filters control *where* a decoration's spawns are allowed to land. They cover the common cases declaratively — flat ground only, near the shore, on rock, inside a biome — so most specs never need to inspect the terrain themselves. For decisions the filters can't express, `create(spawn)` can still decline individual spawns using the [spawn context](21-decoration-spawn-context.md) and returning `null`.

All filters in this page apply to the default `'terrain'` anchor (the ground-grid scatter). Anchored specs (`'tree'`, `'tree-base'`, `'mountain'`) bypass the terrain grid, and these filters do **not** apply to them — see [Anchors](22-decoration-anchors.md).

---

## Filter reference

| Field | Type | Default | Description |
|---|---|---|---|
| `density` | `number` | `1` | Expected spawn count per chunk. Fractional values work — `0.25` ≈ one spawn every 4th chunk; `20` is a dense field. `0` or negative disables the spec. |
| `minHeight` | `number` | `0.485` (`0` for water specs) | Lower bound of the normalized terrain height band (0..1). The default sits just above the waterline (water is below ~0.48). |
| `maxHeight` | `number` | `0.62` (`1` for water specs) | Upper bound of the height band. The default stays below the rocky slopes. |
| `maxSlope` | `number` | none (unlimited) | Maximum terrain steepness as rise/run. `0` is flat; `~0.5` is a steep hillside. `~0.15` targets the deliberately-flat buildable spots. |
| `minWaterDistance` | `number` | `0` | Required dry distance from the nearest water, in world units. |
| `maxWaterDistance` | `number` | none (unlimited) | Maximum distance from water — for shoreline props. |
| `surface` | `SurfaceType \| SurfaceType[]` | none | Only spawn on these surface types (see below). |
| `biomes` | `string[]` | none | Only spawn in these biomes (see below). |
| `minSpacing` | `number` | `0` | Minimum distance in units between spawns of *this* decoration **within one chunk** — not across chunk borders (see [Spacing](#spacing-minspacing)). |
| `avoidRoads` | `boolean` | `true` | Drop spawns that land on a baked engine road. |

---

## Density

`density` is the expected number of spawns per terrain chunk. Internally each candidate grid cell gets an independent accept chance of `density / cellCount`, so the actual count varies chunk to chunk around the expectation.

```js
density: 4,     // ~4 per chunk — occasional
density: 20,    // dense field — pair with `instanced: true`
density: 0.25,  // rare — roughly one every 4th chunk
```

For non-terrain anchors, `density` means something slightly different: per-**tree** chance (0..1, values above 1 are capped) for `'tree'`/`'tree-base'`, and a rounded per-**peak** count for `'mountain'`.

---

## Height band: minHeight / maxHeight

Terrain height is normalized 0..1 across the world's full vertical range. Useful landmarks:

- Water surface sits at **~0.48** — anything below is underwater.
- The default band `[0.485, 0.62]` is the vegetated ground: above the waterline, below the dry/rocky tiers.
- `0.62+` reads as dry earth, `0.68+` as bare rock, `0.90+` as snow (on the default ramp).

Set an explicit band to move out of the defaults — e.g. `minHeight: 0.62` for high-ground-only props.

---

## Slope: maxSlope

Slope is measured from the heightfield gradient as rise/run. Flat meadows are near `0`; the flood-filled buildable flats stay under `~0.15`; steep hillsides run `~0.5+`. Buildings want `maxSlope: 0.12–0.2`; scatter rubble can omit it entirely.

---

## Water distance: minWaterDistance / maxWaterDistance

The engine ring-scans the chunk heightfield around each candidate for the nearest water vertex, out to a cap of **24 units** (within-chunk knowledge only). `spawn.waterDistance` carries the measured value.

- `minWaterDistance: 10` — dry footing for structures.
- `maxWaterDistance: 8` — shoreline props.

Because the scan caps at 24u, values above 24 for `minWaterDistance` cannot be satisfied more strictly than 24, and `maxWaterDistance` above 24 has no effect.

```js
// Reeds on grassy shoreline (from the shoreline-reeds example)
XRPublisher.registerDecoration({
  name: 'shoreline-reeds',
  density: 5,
  surface: 'grass',        // grassy ground only…
  maxWaterDistance: 8,     // …within 8u of a water edge
  minSpacing: 1.5,
  create(spawn) {
    const clump = new THREE.Group();
    const n = 4 + Math.floor(spawn.rng() * 4);
    for (let i = 0; i < n; i++) {
      const h = 0.9 + spawn.rng() * 1.1;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.04, h, 4), reedMat);
      blade.position.set((spawn.rng() - 0.5) * 0.7, h / 2, (spawn.rng() - 0.5) * 0.7);
      clump.add(blade);
    }
    return clump;
  },
});
```

[SCREENSHOT: reed clumps hugging a lake edge, none inland]

---

## Surface targeting

`surface` filters spawns to the coarse surface type they land on. The classification mirrors the color bands the terrain actually paints, so `'grass'` means ground the player *sees* as grass — and it's derived from the deterministic heightfield, so it's identical across renderers and devices.

| Surface | Where it appears |
|---|---|
| `'water'` | Below the waterline (normalized height < 0.48). |
| `'sand'` | The narrow beach blend band just above the waterline, within ~6u of shore. |
| `'grass'` | Vegetated mid-band ground (the default terrain most decorations want). |
| `'dirt'` | Dry-earth tier (0.62–0.68) and all of the `'buildable'` town-land biome. |
| `'rock'` | Bare-rock tier (0.68+), mountain-biome ground, and steep faces (slope > 0.5) in any biome. |
| `'snow'` | High peaks — 0.90+ on the default ramp, 0.88+ in the mountains biome. |

Accepts a single value or an array:

```js
surface: 'grass',            // flowers on grass
surface: ['rock', 'snow'],   // shrines on high ground
surface: 'water',            // creatures in lakes
```

**`surface: 'water'` is special**: it drops the default above-waterline height floor (`minHeight` defaults to `0` instead of `0.485`), so spawns can land on the lakebed. Combine with [`waterPlacement`](23-decoration-water-placement.md) to control depth.

---

## Biomes

`biomes` restricts spawning to specific biome ids:

| Biome | Character |
|---|---|
| `'plains'` | Open rolling ground. |
| `'mountains'` | High rocky terrain. |
| `'wetlands'` | Low, water-adjacent ground. |
| `'buildable'` | The deliberately-flat town-land biome — the natural target for structures. |
| `'default'` | Everything else. |

```js
biomes: ['buildable'],   // huts only on town-land
```

`spawn.biome` also carries the id into `create()` if you'd rather branch than filter.

---

## Spacing: minSpacing

`minSpacing` enforces a minimum distance between spawns *of the same decoration* **within one chunk** (later spawns that land too close to an accepted one are dropped). It does not space you against other decorations, and it does not look across chunk borders.

```js
minSpacing: 35,   // settlement-scale separation
minSpacing: 1.2,  // just avoid overlapping flowers
```

> **`minSpacing` is not a world-wide guarantee.** Spacing is only compared between spawns the engine placed in the *same* chunk, so two spawns in neighbouring chunks can still land a couple of units apart no matter how large the value is. Setting `minSpacing: 200` on a 100u chunk doesn't buy 200u of separation — it just thins each chunk to a single spawn while the cross-border case is unchanged. The engine logs a one-time console warning per decoration when `minSpacing` is at or above the chunk size.
>
> To make something genuinely rare across the world, **lower `density`** (`density: 0.25` ≈ one every fourth chunk) and use `minSpacing` only for intra-chunk crowding. If a build truly must not have a neighbour nearby, check it in `create()` — e.g. derive a position from a world-space noise field or `getWorldTowns()`, and return `null` when the spot doesn't qualify.

---

## Roads: avoidRoads

Worlds with engine-generated roads bake a per-vertex road mask into the terrain. By default, decoration spawns landing on a road are dropped, so scatter never grows through a roadway. Set `avoidRoads: false` for props that belong on or beside the road (lamp posts, signs, cobbles). It has no effect in worlds without roads. See [Paths and roads](30-paths-and-roads.md).

---

## How filters interact with determinism

Filters are applied **after** the deterministic accept/reject draw, and each spawn's jitter and PRNG are keyed to its grid cell rather than to spawn order. The consequence, and the guarantee you can rely on while tuning:

> **Changing a filter parameter only moves the spawns that filter touches.** Everything that already passed keeps its exact position and its exact `spawn.rng` sequence.

So tightening `maxSlope` from `0.3` to `0.2` removes the spawns on 0.2–0.3 slopes and changes nothing else. The two things that *do* reshuffle placement globally are changing the **world seed** and renaming the decoration (**`name` is part of the seed**).

Note that `minSpacing` is the one filter with an ordering dependency: it drops later spawns near earlier accepted ones, so removing an early spawn (via another filter change) can re-admit a neighbor it was suppressing.

---

## Next steps

- [Spawn context](21-decoration-spawn-context.md) — per-spawn data for decisions filters can't express
- [Anchors](22-decoration-anchors.md) — tree and mountain placement (filters don't apply there)
- [Water placement](23-decoration-water-placement.md) — seating objects in water
- [Example: surface targeting](51-example-surface-targeting.md) · [Example: shoreline reeds](52-example-shoreline-reeds.md)
