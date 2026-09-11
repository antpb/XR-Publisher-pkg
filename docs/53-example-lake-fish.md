# Example: Lake Fish

One lake, three depths: kelp rooted on the lakebed, glTF fish cruising the water column, and lily pads (some blooming) exactly at the waterline. This single file exercises all three `waterPlacement` modes plus `XRPublisher.loadModel`.

**Plugin file:** `examples/plugins/lake-fish-xr-publisher-plugin.umd.js`

[SCREENSHOT: looking down into clear water — lily pads with a pink lotus on the surface, a fish circling below, kelp strands reaching up from the bed]

## What it demonstrates

- All three [`waterPlacement`](23-decoration-water-placement.md) modes — `'floor'` (kelp), `'submerged'` (fish), `'surface'` (lily pads)
- [`XRPublisher.loadModel(url)`](19-decorations-overview.md) — load a GLB once (cached per URL), `.clone(true)` per spawn
- Sizing geometry from the water column: `spawn.waterLevel - spawn.position[1]` is the true depth, no frame conversion needed
- **Three dispose strategies in one file** — the other teaching axis here
- A distance-LOD [`update()`](52-example-shoreline-reeds.md) that goes fully idle beyond ~70u

## How it works

### `'floor'` — kelp sized to the water column

With `waterPlacement: 'floor'` the spawn sits on the bed, so `spawn.position[1]` is the bed's local Y and `spawn.waterLevel` is the water surface Y *in that same local frame* — their difference is the true column depth:

```js
create(spawn) {
  const depth = (spawn.waterLevel ?? spawn.position[1]) - spawn.position[1];
  if (depth < KELP_MIN_DEPTH) return null;  // shallows: null skips this spawn
  const rng = spawn.rng;
  const strands = 3 + Math.floor(rng() * 4);
  const buf = { pos: [], col: [], idx: [] };
  for (let s = 0; s < strands; s++) emitStrand(buf, rng, depth, 0.9);
  // ... build one merged BufferGeometry ...
  return new THREE.Mesh(geo, KELP_MAT);
},
```

Strands are sized from that depth so kelp reaches toward — never through — the surface (`KELP_SURFACE_GAP` keeps tips clear even of a wave trough; the engine's waves are cosmetic vertex displacement of about ±0.5u). Note the determinism detail inside `emitStrand`: all of a strand's randomness is drawn *up front, in fixed order*, so a strand skipped by the height guard still consumes the same draws — later strands land identically whether or not this one built.

### `'submerged'` — glTF fish via `loadModel`

The GLB is loaded once before registering (cached per URL), normalized, then cloned per spawn:

```js
let fishModel;
try {
  fishModel = await XRPublisher.loadModel(FISH_URL);
} catch (err) {
  console.error(`[${PLUGIN_ID}] failed to load fish model`, err);
  console.log(`[${PLUGIN_ID}] kelp + lily pads registered (no fish)`);
  return;
}
```

Awaiting before `registerDecoration` lets `create()` clone synchronously; late registration re-scatters chunks that are already loaded. Inside `create()`:

```js
create(spawn) {
  // clone(true) shares geometry + materials by reference (one GPU upload,
  // many fish). Scale is FREE on clones — each clone owns its transform —
  // but material tint is NOT: clones share material objects, so tinting
  // one fish would tint the whole school. Vary size, not color.
  const fish = fishModel.clone(true);
  // ... all orbit parameters from spawn.rng, fixed order ...
```

The `update()` swims a lazy seeded orbit in **local space** — the engine wrapper owns the water-column placement (`'submerged'` seats it mid-column), and the plugin's motion is relative to that point. This is the documented contract for dynamic water decorations: the engine deliberately carries placement on a wrapper, so your `update()` can set `object.position` freely without clobbering it. Motion is closed-form in `elapsed`, so a fish skipped by the 70u LOD ring snaps to the exact right point on its orbit when you swim back into range.

### `'surface'` — lily pads, deliberately static

Pads sit exactly at the waterline (`waterPlacement: 'surface'` seats local y=0 there). They have no `update()` on purpose — the file's comment is worth quoting in full:

> A bobbing pad was considered and rejected: the engine's waves are GPU vertex displacement the CPU can't read, so a CPU-bobbed pad drifts THROUGH the swell out of phase — it reads worse than a still pad, and charges per-frame work for it.

A spec without `update()` gets its matrices frozen by the engine and costs literally zero per frame — and this is the densest of the three specs.

### Three dispose strategies

| Spec | Geometry ownership | Strategy |
|------|-------------------|----------|
| Kelp | Unique per spawn | **No `dispose` override** — the default cleanup (disposes returned geometry, never materials) is exactly right |
| Fish | Everything shared with the cached model | **No-op `dispose() {}`** — default cleanup would break every other fish |
| Pads | Mixed: shared pad disc + unique merged flower | **Custom `dispose`** that frees only what the spawn owns |

```js
// MIXED ownership: the pad's geometry is the SHARED unit disc (must
// survive), the flower's merged geometry is unique to this spawn (must
// be freed). The default cleanup can't tell them apart, so we do.
dispose(object) {
  object.traverse((o) => {
    if (o.isMesh && o.geometry && o.geometry !== PAD_GEO) o.geometry.dispose();
  });
},
```

## Key techniques

- **`surface: 'water'` drops the above-waterline height floor** so spawns can sit in the water column — that's what makes all three specs possible. See [Water Placement](23-decoration-water-placement.md).
- **Returning `null` from `create()` skips a spawn** cleanly (kelp in water shallower than 1.4u).
- **Variety on shared materials = choosing *which* shared material**, never tinting a clone's material (clones share material objects by reference; tinting one pad would tint every pad in the world).
- **Normalize loaded models once, on the shared template** — clones inherit the scale.
- **Shared player-position cache at ~8Hz** with module-level scratch (`_wp.setFromMatrixPosition(...)`) — the fish `update()` allocates nothing.
- **Densities are restrained by design:** "lakes are accents, not aquariums, and every dynamic fish costs an update() call."

## Try it

- **Local:** `npm run dev`, then open `/decorations/in-water-creatures/` — the self-contained inline demo of `loadModel` + `waterPlacement`.
- **Deploy:** copy the plugin file into your api `plugins/` directory and run `npm run upload-build <build-file>`. Note the fish GLB loads from a hosted URL (`FISH_URL`) — swap in your own model URL if you host assets elsewhere.

Suggested modifications:

1. Swap `FISH_URL` for your own GLB and use `FISH_FORWARD` to fix its heading if the model noses sideways.
2. Add a fourth spec: bubbles with `waterPlacement: 'floor'` and a slow upward drift in `update()` — remember the wrapper owns placement, so animate local Y and reset when you pass `spawn.waterLevel - spawn.position[1]`.

## Next steps

- [52 — Shoreline Reeds](52-example-shoreline-reeds.md) — the same band, on land, and the reference LOD `update()` pattern
- [51 — Surface Targeting](51-example-surface-targeting.md) — the other five surface bands
- [23 — Water Placement](23-decoration-water-placement.md) · [21 — The Spawn Context](21-decoration-spawn-context.md) · [19 — Decorations Overview](19-decorations-overview.md)
