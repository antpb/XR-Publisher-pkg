# Example: Ancient Ruins

Discoverable story sites: a worn flagstone floor laid into the meadow, a ring of broken moss-footed columns, a fallen arch, a drum trail walking off into the grass — and a central plinth whose worn inscription opens a seeded two-page lore dialog. About 1 site in 8 is an intact "sanctum" with its architrave still standing.

Plugin source: `examples/plugins/ancient-ruins-xr-publisher-plugin.umd.js` (~660 lines, fully commented).

[SCREENSHOT: broken column ring on a flagstone circle at dusk, the plinth's glyph band faintly glowing]

## What it demonstrates

- **A custom Worley-cell terrain surface** — `registerTerrainSurface('flagstone')` with mossy grout, authored in TSL. See [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md).
- **`addTerrainRegion` + `groundPatch` together** — flagstone floor inside a wider dirt apron that blends the site into the meadow. See [Ground patches](25-decoration-ground-patches.md).
- **Merged, vertex-coloured architecture** — every stone part baked through a tiny writer into one `BufferGeometry`, one draw call per ruin.
- **Seeded lore + `openDialog`** — stable per-seed names and stories, a stateful prompt, a two-page `keepOpen` dialog chain. See [Interactables](33-interactables.md), [In-world dialogs](35-in-world-dialogs.md).
- **A rare seeded variant** — the ~1-in-8 intact sanctum.
- **Night reading light without lights** — an emissive glyph band, scene light count untouched.

## How it works

### 1. The flagstone surface: Worley cells in TSL

The floor material is a cellular (Worley F1/F2) pattern — per-slab tone variation, mossy grout in the seams, roughness varying between slab and grout:

```js
XRPublisher.registerTerrainSurface({
  id: SURFACE_ID,
  fallbackColor: [0.47, 0.44, 0.39],   // weathered stone (WebGL flat fallback)
  tsl: ({ localXZ, params, tint }) => Fn(() => {
    const scale = params.y.max(float(0.001));
    const grout = params.z.max(float(0.001));
    const uv = localXZ.mul(scale);          // region-local coords — NEVER uv()
    ...
    const stoneMask = smoothstep(float(0), grout, f2.sub(f1));
    const col = mix(groutCol, stone, stoneMask);
    const rough = mix(float(0.95), float(0.7), stoneMask);
    return vec4(col, rough);
  })(),
});
```

`params.y`/`params.z` are the `scale`/`mortar` values the region passes at `addTerrainRegion` time, so one registered surface serves any slab size. WebGPU composites this into the shared terrain material; WebGL renders the flat `fallbackColor`.

### 2. Floor + apron: region and patch play different roles

`create()` paints the flagstone circle as a terrain region — centred straight on `spawn.renderPosition`, which is render-frame world XZ for every anchor type (no correction needed; the legacy worker-frame `spawn.worldPosition` is deprecated) — while the spec-level `groundPatch` frames it with a wider dirt ring:

```js
// Dirt apron — bare-earth ring framing the flagstone so the site blends
// into the meadow (engine paints it around the spawn + clears grass).
// ONE patch per ruin: patches are a world budget of 24 — reserve them
// for real sites like this, never per-column.
groundPatch: { radius: DIRT_RADIUS, color: [0.34, 0.27, 0.18], clearGrass: true },
```

```js
XRPublisher.addTerrainRegion({
  id: regionId,
  center: [wx, wz],   // wx/wz from spawn.renderPosition — already render-frame
  radius: FLOOR_RADIUS,
  surface: SURFACE_ID,
  scale: SURFACE_SCALE,
  mortar: SURFACE_GROUT,
  clearGrass: true,
});
```

Note that `groundPatch` takes no world coordinates at all — the engine places it around the spawn for you; region/path/world-state coordinates you compute yourself come from `spawn.renderPosition`, which needs no correction. The region is removed in `dispose()` via a `__regionId` stashed in `userData`.

### 3. The stone writer: merged geometry with baked moss

Every stone part (plinth tiers, column bases and shafts, capitals, architrave beams, the fallen lintel, drums, fragments) goes through a small writer that transforms a temp THREE geometry in place, bakes tone + moss creep into the `color` attribute, appends, and disposes the temp — one vertex-coloured `BufferGeometry`, one shared white `MeshStandardMaterial` for every ruin ever spawned:

```js
// Moss creep: darken + green the band within ~MOSS_HEIGHT of the part's
// ground contact (mossFrom). Because it's evaluated AFTER the transform,
// a drum lying on its side gets moss on whichever side touches the
// ground — no special casing.
const mossFrom = opts.mossFrom == null ? 0 : opts.mossFrom;
const mossH = opts.moss == null ? MOSS_HEIGHT : opts.moss;
for (let i = 0; i < P.count; i++) {
  const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
  ...
  let m = 0;
  if (mossH > 0) {
    const edge = mossH * (0.6 + 0.8 * hash01(x, z));   // ragged creep line
    m = Math.min(1, Math.max(0, 1 - (y - mossFrom) / edge)) * 0.85;
  }
  ...
```

The moss edge is jittered by a cheap positional hash rather than `spawn.rng` — vertex counts must never influence the layout draw order.

Layout draws follow a strict fixed order (variant → plinth → ring plan → ring emit → arch → drum trail). The sanctum draw comes *first*, and the ring is **planned before it's emitted** so the architrave can force its 2–3 bridged columns to full height on a shared footing — the beams sit level even on rolling ground (every other part seats on its own `spawn.groundHeightAt` sample).

### 4. Seeded lore on its own rng stream

Names and stories come from string tables drawn with a dedicated `alea(seed + '-lore')` stream — the text tables can grow or shrink without ever moving a column:

```js
function buildLore(seed, isSanctum) {
  const cached = LORE.get(seed);
  if (cached) return cached;       // chunk remounts re-run create() — same lore
  const r = seededRng(seed + '-lore');
  const pick = (arr) => arr[(r() * arr.length) | 0];
  const name = pick(ROOTS) + pick(SUFFIXES);
  const title = isSanctum ? `The Sanctum of ${name}` : `${pick(RUIN_STYLES)} ${name}`;
  ...
```

The interaction is a stateful prompt plus a two-page chain — `keepOpen` holds page 1 open while its `onSelect` replaces it with page 2:

```js
spec.interactionPrompt = (spawn) => {
  const lore = LORE.get(spawn.seed);
  if (lore && readInscriptions.has(spawn.seed)) return `“${lore.title}”`;
  return 'Read the worn inscription';
};
```

```js
XRPublisher.openDialog({
  title: lore.title,
  content: lore.page1,
  buttons: [
    {
      label: 'Look closer',
      keepOpen: true,
      onSelect: () => XRPublisher.openDialog({
        title: 'Weathered lines, half-legible',
        content: lore.page2,
        buttons: [{ label: 'Step back', variant: 'primary' }],
      }),
    },
    { label: 'Step away', variant: 'primary' },
  ],
});
```

### 5. Night glow without lights

The plinth carries a glyph band — a dark stone cylinder strap whose canvas-painted `emissiveMap` strokes read faintly after dusk (and bloom if the world enables [post-processing](37-post-processing.md)). It's near-invisible in daylight *by design* — discovery is a night reward — and the scene light count stays constant, which is a hard engine contract.

## Key techniques and gotchas

- **Why there is no `update()` loop**: a ruin is a dense *static* site — with no `update` in the spec the engine freezes every matrix after placement and the ruin costs nothing per frame. A per-frame callback would be unjustified cost multiplied across every spawned ruin.
- **Explicit colliders, not auto-cuboid**: the visuals are one merged mesh, so auto-cuboid would wrap the whole site in one impassable box. The plugin authors one cuboid per standing column plus the plinth; drums and fragments stay walk-over. See [Decoration collision](26-decoration-collision.md).
- **Per-spawn geometry, shared materials**: the merged stone and glyph-band geometry are unique per ruin (baked vertex colours) and disposed in `dispose()`; the two materials and glyph texture are module singletons that live for the session.
- **Regions are water-safe for free**: a site brushing a pond keeps natural shore there instead of paving over it (the core's region water fade).
- **Rare variants are one early seeded draw**: `const isSanctum = rng() < SANCTUM_CHANCE;` as the *first* draw — everything downstream branches on a stable flag, so common and rare sites share one deterministic pipeline.
- **Session memory vs. seeded identity**: which plinths you've *read* is a session `Set` (flips the prompt); *what* they say is seed-derived and eternal.

## Try it

Deploy: copy into the api `plugins/` directory, `npm run upload-build <build-file>`. For local browsing, `examples/decorations/biome-surfaces/index.html` loads this plugin file directly — ruins spawn sparsely in ordinary grassland (`density: 0.5`, `minSpacing: 44`), so roam a bit.

Suggested modifications:

1. **Add a lore category** — a new string table (say, `RUMORS`) woven into `page2`. Because lore draws from its own `-lore` stream, verify a known ruin keeps its columns but changes its text.
2. **Raise `SANCTUM_CHANCE` to 1** temporarily to inspect the architrave logic, then study how the bridged columns share a footing (`footRef`) so the beams sit level.

## Next steps

- [Farm Plots](61-example-farm-plots.md) — the same surface + region machinery driven by live shared state.
- [Summit Totems](56-example-summit-totems.md) — seeded landmark structures on mountain anchors.
- [In-world dialogs](35-in-world-dialogs.md) — dialog sizing, close reasons, and VR behaviour.
- [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md) — the full surface-authoring contract, including the WebGL fallback.
