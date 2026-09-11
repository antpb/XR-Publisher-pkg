# Example: Rocky Clearings

An abandoned quarry worked into the plains: a packed-gravel clearing framed by a dirt apron, scattered with weathered lichen-spotted boulders, a boulder split in half where the wedges cracked it, a stack of cut stone blocks with feather-and-wedge drill marks, loose timber poles — and a communal cairn near the centre that **every visitor can add a stone to**, persisted across sessions via world state.

Source: `examples/plugins/rocky-clearings-xr-publisher-plugin.umd.js`

[SCREENSHOT: quarry site — gravel clearing with split boulder, block stack, and cairn]

## What it demonstrates

- **[Custom terrain surfaces](29-terrain-regions-and-surfaces.md)** — a `registerTerrainSurface('gravel')` built from two octaves of MaterialX noise (the "continuous-noise surface" teaching example, alongside town-center's cellular flagstone and farm-plots' stripes)
- **[Terrain regions](29-terrain-regions-and-surfaces.md)** — `addTerrainRegion` paints the gravel circle under each site, centred on `spawn.renderPosition` (render-frame, no correction needed)
- **[Ground patches](25-decoration-ground-patches.md)** — the spec-level `groundPatch` clears grass and paints the dirt apron, budgeted so one site costs one patch slot + one region slot
- **[World state](41-world-state.md)** — the communal cairn: `setWorldState` / `getWorldState` / `fetchWorldState` / `subscribeWorldState`, with TTL, mount-gated fetches, and graceful degradation
- **[Interactables](33-interactables.md)** — `interactable: true` with a **function** `interactionPrompt` that shows the live stone count
- **[Spawn context](21-decoration-spawn-context.md)** — `spawn.groundHeightAt(dx, dz)` seats every prop on the real terrain; `spawn.rng` / `spawn.seed` drive fully deterministic generation
- **[Explicit collision](26-decoration-collision.md)** — `userData.xrColliders` hand-authored cuboids on merged geometry
- One merged `BufferGeometry` + one module-level vertex-colored material per site — a single draw call for ~40 props

## How it works

### A continuous-noise terrain surface

The gravel surface is registered once at plugin init. It's a TSL node factory: a mottled dirt base with light/dark pebbles thresholded in from a second, higher-frequency noise. Note that coordinates come from `localXZ` — never `uv()` (see [Terrain regions & surfaces](29-terrain-regions-and-surfaces.md)):

```js
XRPublisher.registerTerrainSurface({
  id: SURFACE_ID,
  fallbackColor: [0.33, 0.27, 0.20],   // packed dirt (WebGL flat fallback)
  tsl: ({ localXZ, params, tint }) => Fn(() => {
    const scale = params.y.max(float(0.001));
    const p = localXZ.mul(scale);
    const n1 = mx_noise_float(vec3(p.x, p.y, 0.0)).mul(0.5).add(0.5);
    const n2 = mx_noise_float(vec3(p.x.mul(4.0), p.y.mul(4.0), 7.0)).mul(0.5).add(0.5);
    const base = vec3(0.30, 0.24, 0.17).mul(n1.mul(0.3).add(0.8));   // mottled dirt
    const pebble = mix(vec3(0.22, 0.20, 0.18), vec3(0.54, 0.51, 0.46), n1);
    const stoneMask = smoothstep(float(0.60), float(0.78), n2);      // pebbles where n2 high
    const col = mix(base, pebble, stoneMask).mul(tint);
    const rough = mix(float(0.98), float(0.72), stoneMask);
    return vec4(col, rough);
  })(),
});
```

On WebGPU this composites into the one shared terrain material; on WebGL (`?renderer=webgl`) the region falls back to the flat `fallbackColor`.

### Painting the region

Terrain regions (and world-state positions) use the **render frame**, and `spawn.renderPosition` is render-frame world XZ for every anchor type — so the region centre is used directly, with no correction:

```js
create(spawn) {
  const wx = spawn.renderPosition[0];
  const wz = spawn.renderPosition[2];
  const regionId = `${PLUGIN_ID}-${spawn.seed}`;
  XRPublisher.addTerrainRegion({
    id: regionId,
    center: [wx, wz],
    radius: FLOOR_RADIUS,
    surface: SURFACE_ID,
    scale: SURFACE_SCALE,
    mortar: 0.0,
    clearGrass: false,      // the spec groundPatch already cleared the apron
  });
```

(The legacy `spawn.worldPosition` was worker-frame — half a chunk off on both axes — and needed a hand-applied −½-chunk shift; treat it as deprecated. See [Spawn context](21-decoration-spawn-context.md).) The `clearGrass: false` matters too: the spec-level `groundPatch` already spent a patch slot on the dirt apron, and the engine keeps only the 24 nearest patches / 8 nearest regions — don't spend two slots on the same clearing.

### The communal cairn — world state end to end

The cairn's stone count is one tiny record `{ n, t }` keyed by the site's deterministic `spawn.seed`, with a 7-day TTL (an untended pile settles back to its three founder stones). The prompt is a **function**, re-resolved at the engine's ~10Hz proximity cadence, so the count updates live:

```js
spec.interactionPrompt = (spawn) => {
  const n = deriveCount(spawn.seed);
  return n >= CAIRN_CAP
    ? `The cairn stands tall (${CAIRN_CAP} stones)`
    : `Add a stone to the cairn (${n} ${n === 1 ? 'stone' : 'stones'})`;
};
spec.onInteract = (ctx) => {
  const seed = ctx.spawn.seed;
  const n = deriveCount(seed);
  if (n >= CAIRN_CAP) return;   // full — the prompt already says so
  const value = { n: n + 1, t: Date.now() };
  if (HAS_STATE) {
    // Positions are RENDER-frame world XZ — renderPosition directly, same
    // frame as the terrain region; a wrong frame here and the server
    // rejects the write as too far from the player.
    const wx = ctx.spawn.renderPosition[0], wz = ctx.spawn.renderPosition[2];
    XRPublisher.setWorldState(PLUGIN_ID, seed, value, {
      pos: [wx, wz],
      ttlSeconds: STATE_TTL_S,
    });
  } else {
    sessionCounts.set(seed, value);   // no API → session-only counter
  }
};
```

State checks are **mount-gated by design**: `fetchWorldState` runs only inside `create()` (a chunk that actually contains a quarry), with a chunk prefix and `maxAgeMs`, so N sites in one chunk share one HTTP request and roaming quarry-free terrain costs nothing:

```js
XRPublisher.fetchWorldState(PLUGIN_ID, {
  prefix: spawn.chunkPrefix,        // the engine-provided per-chunk prefix
  maxAgeMs: STATE_FRESH_MS,
}).catch(() => {});
```

The plugin file predates `spawn.chunkPrefix` and derives the same string itself (`chunkPrefixOf`, stripping the **two** trailing grid coords). New plugins should just read [`spawn.chunkPrefix`](21-decoration-spawn-context.md) — hand-slicing `spawn.seed` is easy to get wrong, and a prefix that's one coordinate too long silently defeats the per-chunk coalescing.

There are no tickers anywhere — a stone count only changes on interaction events, so the whole site is static geometry between interactions.

### Deterministic rebuilds from a namespaced RNG stream

`spawn.rng` is a one-shot stream consumed by `create()` in a fixed draw order — a rebuild can't re-draw it. The cairn therefore rebuilds from its own dedicated stream, restarted on every rebuild:

```js
function buildCairnMesh(THREE, XR, seed, count, gy, cx, cz) {
  const rng = XR.utils.alea(`${seed}-cairn`);
  const noise = XR.utils.createNoise3D(XR.utils.alea(`${seed}-cairn-shape`));
  ...
```

Restarting `alea(seed + '-cairn')` guarantees two things at once: the base quarry layout is never perturbed, and stones `0..k` come out identical no matter how many stones follow — adding a stone visibly *continues* the pile instead of reshuffling it, and every peer sees the same pile for the same count.

Live growth comes from `subscribeWorldState`: when a peer adds a stone (or a prefix fetch lands), the mounted cairn rebuilds. The swap uses the engine's own hide-now-dispose-next-frame pattern and re-freezes the fresh mesh's matrices:

```js
const rebuildCairn = (entry, n) => {
  const old = entry.group.getObjectByName('cairn');
  if (old) {
    old.visible = false;
    entry.group.remove(old);
    requestAnimationFrame(() => { if (old.geometry) old.geometry.dispose(); });
  }
  const fresh = buildCairnMesh(THREE, XRPublisher, entry.seed, n, entry.gy,
    entry.cairnPos[0], entry.cairnPos[1]);
  entry.group.add(fresh);
  fresh.updateMatrix();
  fresh.matrixAutoUpdate = false;   // static decorations are matrix-frozen after create();
  fresh.updateMatrixWorld(true);    // a subtree added later must freeze itself
  entry.count = n;
};
```

## Key techniques

- **One mesh, one material, per site.** A tiny matrix-baking merger appends every prop (boulders, split halves, blocks, drill marks, poles) into a single `BufferGeometry`; all visual variety (weathering, lichen, fresh-cut faces, wood grain) is baked as vertex colors into one module-level `MeshStandardMaterial({ vertexColors: true })`. The default geometry-only dispose contract is then exactly right.
- **Explicit colliders over auto-cuboid.** Because the visuals are merged, the engine's auto-cuboid would wrap the entire quarry in one impassable box. The plugin authors one cheap cuboid per big boulder / split pair / block stack / cairn base via `userData.xrColliders` — and only boulders large enough to block a player (`r >= 1.05`) get one at all.
- **`spawn.groundHeightAt(dx, dz)` everywhere.** Every boulder, block, and pole samples the real terrain at its own offset, so the quarry follows a gentle hillside instead of floating on the spawn-centre plane.
- **The split boulder trick**: both halves displace the *same* icosphere with the same noise offset (so they read as one boulder pulled apart), then vertices past the split plane collapse to x=0 and get a hand-stamped flat normal — the machine-cut inner face.
- **Never free a GPU buffer mid-frame.** The rebuild hides the old mesh immediately but defers `geometry.dispose()` to the next animation frame.
- **Conflict tolerance is a design choice.** Concurrent stone adds merge by newest-`updatedAt`-wins — two simultaneous stones may collapse into one, which is acceptable for an honor-system pile. Don't build lockstep counters on world state.
- The static cairn base collider is sized for the founder stack only; visitor stones grow past it visually (colliders mount once at `create()` and can't follow a rebuild — fine for a decorative pile).

## Try it

Deploy like any plugin: copy the file into your api `plugins/` dir and run `npm run upload-build <build-file>` — see `examples/plugins/README.md`. The surface-system family (flagstone / tilled soil / gravel) can be browsed locally at `examples/decorations/biome-surfaces/` with `npm run dev`.

Suggested modifications:

1. **Change what the cairn remembers.** Store `{ n, t, lastBuilder }` and show "last stone added by …" in the prompt — you only need to extend the record value and the prompt function.
2. **Add a second interactable.** Make the block stack lootable ("Take a cut stone") that *decrements* a shared count — you'll re-use the same namespaced-stream rebuild pattern in reverse.

## Next steps

- [Campfires](60-example-campfires.md) — the minimal world-state sibling (lit/unlit shared flag)
- [Farm plots](61-example-farm-plots.md) — the flagship world-state demo (timed growth stages, TTL-driven decay)
- [Town center](62-example-town-center.md) — the cellular-surface sibling with `addTerrainRegion` + `addPath`
- [Ancient ruins](63-example-ancient-ruins.md) — the Worley-noise surface sibling
- [World state API](41-world-state.md) · [Terrain regions & surfaces](29-terrain-regions-and-surfaces.md) · [Interactables](33-interactables.md)
