# Example: Rock Field

Walkable rock formations — outcrops, boulders, and rare standing stones — that emerge from the terrain, each one a unique seeded mesh you can climb onto.

Plugin source: `examples/plugins/rock-field-xr-publisher-plugin.umd.js` (~330 lines, fully commented).

[SCREENSHOT: a low, wide rock outcrop with smaller rocks shouldering its base, player standing on top]

## What it demonstrates

- **Per-spawn generative geometry** — every spawn builds its own `BufferGeometry` from `spawn.rng` + `spawn.seed`, not one model instanced everywhere. See [Decorations overview](19-decorations-overview.md).
- **`collision: 'hull'`** — a convex hull collider makes each formation solid and walkable. See [Decoration collision](26-decoration-collision.md).
- **Placement filters** (`minHeight`, `maxHeight`, `maxSlope`, `minSpacing`, `density`) tuned for "landmarks, not litter". See [Placement filters](20-decoration-placement-filters.md).
- **`XRPublisher.utils`** (`alea`, `createNoise3D`) — the engine's own PRNG/noise primitives, so shapes are stable per visit and identical on every renderer. See [Plugin development overview](18-plugin-development-overview.md).
- **Matching the engine's look** — the displacement field, base primitive, and grey palette are deliberately copied from the engine's own boulders so the plugin rocks sit *in* the world instead of clashing with it.

## How it works

### 1. One spec, one generative `create()`

The whole plugin is a single decoration spec whose `create()` builds a fresh mesh per spawn:

```js
XRPublisher.registerDecoration({
  name: 'rock-field',
  density: 0.85,             // ~1 per chunk — landmarks, not litter
  minSpacing: 12,            // lets the odd pair cluster, never overlap
  minHeight: 0.485,          // above the waterline
  maxHeight: 0.80,           // up into the rocky band, not snow-cap peaks
  maxSlope: 0.55,            // skip near-cliffs (they'd clip/float badly)
  collision: 'hull',         // ← solid convex hull: walk up onto them.
  create(spawn) {
    return buildFormation(spawn);
  },
});
```

`'hull'` is the right collider here: the shape is irregular but convex-ish, and a hull is far cheaper than a trimesh (which cooks synchronously on the main thread at chunk mount).

### 2. Silhouette from seeded draws, in a fixed order

`buildFormation` draws a formation type and size from `spawn.rng`, then lays out "lobes" — one main mass plus small rocks at its base only (never stacked on top):

```js
const rng = spawn.rng;
const noise3 = XRPublisher.utils.createNoise3D(XRPublisher.utils.alea(spawn.seed + '-rock'));

// Outcrops common; boulders next; standing stones the rare landmark.
const roll = rng();
const type = roll < 0.55 ? 'outcrop' : roll < 0.82 ? 'boulder' : 'monolith';
// Skewed small (pow²) — mostly knee/chest height, occasionally a big one.
const sizeMul = 0.9 + Math.pow(rng(), 2) * 2.0;   // ~0.9 .. 2.9
```

Silhouette variety comes from **non-uniform scale of a single mass** (wide outcrop / round boulder / tall standing stone), not from piling geometry — the file's header explains that stacked lobes read as "geometries piled on each other".

### 3. Surface details from a *dedicated* sub-rng

Lichen, quartz veins, and the rare split-rock variant roll from a separate PRNG stream so adding them never changed existing silhouettes:

```js
// ── Surface-detail rolls come from a DEDICATED sub-rng (fixed draw
// order, always drawn) so lichen/vein/split never shift the base layout
// draws above — the silhouette a seed produced before these features
// existed is the silhouette it produces now. ────────────────────────────
const drng = XRPublisher.utils.alea(spawn.seed + '-detail');
const hasLichen = drng() < 0.40;                   // ~40% of formations
const hasVein = drng() < (1 / 6);                  // rare quartz band
const isSplit = drng() < 0.14;                     // ~1 in 7: cracked pair
```

This `alea(seed + '-suffix')` sub-stream pattern shows up in almost every shipped plugin (farm-plots' `-crops`, settler-huts' `-yard`, ancient-ruins' `-lore`) — it is *the* way to add features to a deterministic decoration without relocating what players already saw.

### 4. The engine boulder displacement field

Displacement matches the engine's own boulders exactly — gentle, low-frequency, radial:

```js
const ns = 2.5;
const n1 = noise3(px * ns + so, py * ns, pz * ns) * 0.4;
const n2 = noise3(px * ns * 2, py * ns * 2 + so, pz * ns * 2) * 0.2;
const n3 = noise3(px * ns * 4, py * ns * 4, pz * ns * 4 + so) * 0.1;
let disp = (n1 + n2 + n3) * L.radius * 0.35;       // engine amplitude
```

Vertex colours stay in a near-uniform warm grey band (`baseGray 0.34`, channels `×[1.05, 0.98, 0.92]`) matching the engine boulder albedo — no moss/strata colours that would fight the terrain's rock band. Lichen deviates ≤ ~0.06 per channel and only on upward-ish faces; the quartz vein lightens colour only, **no emissive** (a glowing rock would punch bloom in worlds that enable post-processing).

## Key techniques and gotchas

- **One shared material, per-spawn geometry.** `rockMat` is a module singleton; the engine's default decoration cleanup disposes geometry, never shared materials — so the plugin needs no custom `dispose()`.
- **Sample noise at the already-scaled position.** Displacement is computed after the non-uniform scale so adjacent low-poly verts move together (no spikes) and coincident seam verts between lobes match.
- **Bury the base.** `geom.translate(0, -minY - sink, 0)` sinks the formation so it reads as emerging from the ground and doesn't float on slopes.
- **Split rocks keep one hull.** The mirrored halves share a single `'hull'` collider that bridges the crack — acceptable because the ~0.4u gap is too narrow to walk into.
- **Non-indexed geometry + `computeVertexNormals()`** gives flat faceted shading, like the engine's rocks.

## Try it

Deploy like any plugin: copy the file into the api worker's `plugins/` directory and run `npm run upload-build <build-file>`. There is no dedicated demo page under `examples/decorations/` for this one — load it into any procedural-terrain world (or add a `<script>` tag for it in a dev-harness page) and roam the mid-altitude band.

Suggested modifications:

1. **Add a fourth formation type** (e.g. a low `slab` shelf) — add a branch in `lobeParamsFor` and widen the `type` roll. Note how existing formations don't move: the type roll consumes the same single `rng()` draw.
2. **Make veins glow at night** — try giving the vein band a faint emissive via a second material and a vertex-colour mask… then read why the file deliberately doesn't (bloom budget), and compare with how [Ancient Ruins](63-example-ancient-ruins.md) does night glow with a dedicated emissive band instead.

## Next steps

- [Minimal mushrooms](50-example-minimal-mushrooms.md) — the smallest possible decoration plugin, if this one is too much at once.
- [Ancient Ruins](63-example-ancient-ruins.md) — per-spawn generative geometry scaled up to a multi-part merged structure.
- [Decoration collision](26-decoration-collision.md) — when to use `'cuboid'`, `'hull'`, `'trimesh'`, or explicit colliders.
- [Decoration spawn context](21-decoration-spawn-context.md) — everything `spawn` carries into `create()`.
