# Example: Surface Targeting

A "field guide" to terrain surfaces: one small, cheap, seeded decoration per surface band — wildflowers on grass, lichened scree on rock, seashells and starfish on sand, ice shards on snow, forest-floor litter on dirt — so you can walk a world and see exactly where each band lives.

**Plugin file:** `examples/plugins/surface-targeting-xr-publisher-plugin.umd.js`

[SCREENSHOT: a beach transitioning to meadow — instanced seashells near the tide line, a lone starfish, wildflower clumps starting where the grass band begins]

## What it demonstrates

- The [`surface:` placement filter](20-decoration-placement-filters.md) — `'water' | 'sand' | 'grass' | 'dirt' | 'rock' | 'snow'` (value or array), one spec per surface
- The **height-band gotcha**: rock and snow live above the default spawn band, so those specs must raise `maxHeight` or silently match nothing
- [`maxWaterDistance`](20-decoration-placement-filters.md) composed with `surface:` ("sand near the tide line")
- [`instanced: true` + `transform(spawn)`](24-decoration-instancing.md) for the two dense static specs, and when *not* to instance
- A merged-geometry writer: compiling each per-object spawn into one vertex-colored `BufferGeometry` on one shared material — a flower clump is one draw call, not twenty

## How it works

### One spec per surface

Each surface band gets its own `registerDecoration` call. The filter is applied *after* the deterministic accept/reject draw, so it only moves the spawns it filters — adding or changing a filter never re-rolls the rest of the world. Surface classification derives from the WASM/JS-identical heightfield, so every renderer agrees where the sand is.

```js
XRPublisher.registerDecoration({
  name: 'surface-flower',    // keep the name — it seeds placement; a
                             // rename would relocate every clump
  density: FLOWER_DENSITY,
  surface: 'grass',
  maxSlope: 0.3,             // meadows, not scarps
  minSpacing: 1.5,
  create(spawn) { return buildFlowerClump(spawn); },
});
```

### The height-band gotcha

The default spawn band is normalized height `[0.485, 0.62]` — barely above the waterline up into the low meadows. Rock and snow live far above it, so those specs must raise `maxHeight` explicitly:

```js
XRPublisher.registerDecoration({
  name: 'surface-rubble',    // keep the name — it seeds placement
  density: SCREE_DENSITY,
  surface: 'rock',
  minHeight: 0.5,
  maxHeight: 0.9,            // REQUIRED: reach up into the rock band
  maxSlope: 0.6,             // scree tolerates slope; near-cliffs clip
  minSpacing: 3,
  create(spawn) { return buildScree(spawn); },
});
```

Without `maxHeight: 0.9`, `surface: 'rock'` would silently match nothing — the filter and the band would never overlap. The ice-shard spec does the same with `maxHeight: 0.97` for snow caps. See [Placement Filters](20-decoration-placement-filters.md).

### Composing `surface:` with `maxWaterDistance`

"Sand near the tide line" is two filters composed. The water scan is within-chunk and capped at 24 units — cells with no water in their own chunk report the cap, so keep thresholds lenient:

```js
XRPublisher.registerDecoration({
  name: 'surface-shells',
  density: SHELL_DENSITY,
  surface: 'sand',
  minHeight: 0.48,           // down to the waterline (default floor is 0.485)
  maxWaterDistance: 18,      // beach finds concentrate toward the water
  maxSlope: 0.3,
  minSpacing: 1.2,
  instanced: true,           // dense + static + identical template
  create(spawn) { return buildShellTemplate(spawn); },
  transform(spawn) {
    // The ONLY per-spawn variety an instanced spec gets. All draws from
    // spawn.rng — stable per visit.
    return {
      rotationY: spawn.rng() * TWO_PI,
      scale: 0.6 + spawn.rng() * 0.8,
      tilt: (spawn.rng() - 0.5) * 0.16,            // settled into the sand
    };
  },
});
```

The rare starfish spec sits right beside it with `maxWaterDistance: 8` — stricter, hugging the tide line.

### Instanced vs per-object — the trade, stated plainly

The seashells and ice shards are [instanced](24-decoration-instancing.md): many spawns, one identical template, nothing moves. The engine mounts **one** `THREE.InstancedMesh` per template mesh per chunk instead of a scene object per shell. The cost: `create()` runs once per chunk as the template (seeded by that chunk's *first* spawn), so per-spawn variety is only what `transform()` returns — `rotationY` / `scale` / `tilt` — and instancing is incompatible with `update()` and `interactable`.

The flowers, scree, starfish, and litter stay per-object because their whole point is per-spawn uniqueness (seeded palettes, head counts, cairns). The file's own comment on the starfish captures the design rule: *"Rare enough (0.6/chunk) that a unique mesh per find is the right trade — finding one should feel like finding one."*

### The merged-geometry writer

Per-object decorations mount outside the engine's per-chunk render bundles, so every extra `Mesh` is a real per-frame draw call. The file's `makeWriter()` accumulates transformed primitive parts — with a flat color or a per-vertex color function sampled in the part's local pre-transform frame — into one indexed, vertex-colored `BufferGeometry` per spawn:

```js
push(geo, matrix, color) {
  // ... bake color per vertex (flat or fn(x,y,z) on pre-transform coords) ...
  geo.applyMatrix4(matrix);   // moves positions AND fixes normals
  // ... append positions/normals/colors/indices into the growing arrays ...
  geo.dispose();              // source primitive; merged copy lives on
},
```

Everything rides one of exactly three shared `vertexColors` materials — per-part color is baked into vertices instead of material variants.

## Key techniques

- **Restraint is the point for whole-world specs.** These densities cover *every* chunk that has the surface. Set dressing, not carpet.
- **Decoration names seed placement.** Renaming `'surface-flower'` relocates every clump in the world.
- **"Translucent-looking" ice without transparency:** pale vertex-color gradient, low roughness for specular glint, and a *subtle* emissive (`emissiveIntensity: 0.15`) that stays under bloom thresholds while lifting the crystal at dusk.
- **Local-frame color functions.** The shell's ridge stripes are computed from pre-transform coordinates, so the pattern doesn't depend on placement.
- **Per-mesh shadow decisions.** Tiny flowers and shells skip `castShadow`; chunky scree and tall ice shards cast.
- **Sink props slightly** (`w.build(0.05)` translates down) so bases embed on slopes instead of floating on the spawn-centre plane.

## Try it

- **Local:** `npm run dev`, then open `/decorations/surface-targeting/` — a self-contained inline demo of the same filter.
- **Deploy:** copy the plugin file into your api `plugins/` directory and run `npm run upload-build <build-file>`.

Suggested modifications:

1. Add a `surface: ['rock', 'snow']` spec (arrays work) for something that spans both high bands — remember to set `maxHeight` to reach it.
2. Convert the litter spec to `instanced: true` and observe what you lose: every dirt patch gets the same pebble arrangement, varying only by yaw/scale/tilt. Then decide which side of the trade your own decoration belongs on.

## Next steps

- [52 — Shoreline Reeds](52-example-shoreline-reeds.md) — the `surface` + `maxWaterDistance` pair as the headline, plus the reference dynamic `update()` pattern
- [53 — Lake Fish](53-example-lake-fish.md) — `surface: 'water'` and the three `waterPlacement` modes
- [20 — Placement Filters](20-decoration-placement-filters.md) · [24 — Instanced Decorations](24-decoration-instancing.md) · [21 — The Spawn Context](21-decoration-spawn-context.md)
