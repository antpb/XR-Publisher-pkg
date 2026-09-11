# Example: Summit Totems

The reward for climbing a mountain: a weathered stone shrine on every real summit, strung with wind-tattered prayer flags, crowned by an emissive crystal you can see from the valley floor — plus a seeded name and lore for every peak, and a persistent "summit log" that counts your first ascents.

**Plugin file:** `examples/plugins/summit-totems-xr-publisher-plugin.umd.js`

[SCREENSHOT: a stone shrine with prayer flags on a snowy summit, crystal glowing against a night sky; a second lit peak visible in the distance]

## What it demonstrates

- [`anchor: 'mountain'`](22-decoration-anchors.md) + `density: 1` — one spawn per peak, on the *real* marching-cubes summit surface (local y=0 is walkable stone, not the terrain heightfield far below)
- [`openDialog`](35-in-world-dialogs.md) with **chained dialogs** (`keepOpen: true` + opening a dialog from `onSelect`)
- A night beacon driven by [`XRPublisher.getTimeOfDay()`](38-time-of-day.md), polled at ~2Hz with a once-per-frame shared-material write
- A discovery [HUD](34-hud-overlays.md) with a clickable summit log, persisted in `localStorage`
- Seeded procedural stonework via `XRPublisher.utils` (`alea`, `createNoise3D`) — the engine's own PRNG/noise primitives
- An **explicit collider** (`userData.xrColliders`) so the shrine is solid without walling off the summit ([Collision](26-decoration-collision.md))

## How it works

### One shrine per peak

The engine ray-marches the mountain SDF, scatters candidates in the top 2% of the peak, and assigns each peak to exactly one owner chunk — so a shrine never duplicates. `density: 1` means every peak gets one:

```js
XRPublisher.registerDecoration({
  name: 'summit-totem',        // seeds placement — renaming relocates every shrine
  anchor: 'mountain',          // ← the headline: spawn on the REAL summit mesh
  density: 1,                  // one shrine per peak (a peak has one owner chunk)
  interactable: true,          // ← "E to interact", per-spawn mount
  collision: true,             // solid — but via the EXPLICIT xrColliders below,
                               // not auto-cuboids
  interactionRadius: INTERACTION_RADIUS,
  interactionPrompt: (spawn) =>
    (discovered.has(spawn.seed) ? peakName(spawn.seed) : 'read the shrine'),
  // ...
```

The prompt function is the discovery state made visible: an unvisited shrine says "read the shrine"; a discovered one greets you by the peak's own name. Cheap by contract — a `Set` + `Map` lookup, since the engine re-resolves prompt functions ~10Hz.

### Seeded names that never touch the geometry stream

Peak names come from a syllable-table generator seeded by a *dedicated sub-RNG*, never `spawn.rng` — drawing from the spawn stream in a prompt function would perturb the geometry draw order:

```js
const peakName = (seed) => {
  let name = NAME_CACHE.get(seed);
  if (name) return name;
  const rng = subRng(seed + '-name');
  const root = pick(rng, ROOTS) + (rng() < 0.55 ? pick(rng, MIDS) : '') + pick(rng, ENDS);
  const form = rng();
  name = form < 0.3 ? `Mount ${root}` : form < 0.65 ? root : `${root} Peak`;
  NAME_CACHE.set(seed, name);
  return name;
};
```

`subRng` uses `XRPublisher.utils.alea` when present (bit-stable across renderers) with a small hash-RNG fallback for old runtimes. The same trick — `alea(spawn.seed + '-stone')` feeding `createNoise3D` — gives each shrine its own weathering noise field, so the same rock wear greets you on every visit. Mountain-anchor seeds carry no chunk coordinates, so they're stable keys for persistence.

### The night beacon: shared material, one write per frame

The crystal is a shared emissive material (no scene lights — light count must stay constant after load). `update()` runs per shrine per frame, so all the shared work is guarded to run once per frame *total*:

```js
update(group, _delta, elapsed) {
  const crystal = group.userData.crystal;
  if (crystal) crystal.rotation.y = elapsed * 0.35 + group.userData.phase;
  if (pulseStamp === elapsed) return;   // another shrine already drove the pulse
  pulseStamp = elapsed;
  if (elapsed - lastTodCheck > 0.5) {
    lastTodCheck = elapsed;
    nightAmount = 0;
    if (HAS_TOD) {
      try { nightAmount = nightAmountAt(XRPublisher.getTimeOfDay().time); } catch (e) {}
    }
  }
  // Shared material — every crystal in the world breathes together.
  crystalMat.emissiveIntensity = BASE_GLOW
    + nightAmount * NIGHT_PULSE * (0.5 + 0.5 * Math.sin(elapsed * PULSE_SPEED));
},
```

The per-object cost is one rotation write. The `nightAmountAt` ramp matches the engine's sun timeline (up 6.5→20.5), easing the pulse in over the hour past each edge so the crystal wakes with the dusk instead of snapping on.

### The discovery beat: chained dialogs

`onInteract` names the peak, logs a first ascent, and opens a dialog — with a second dialog chained from a button:

```js
XRPublisher.openDialog({
  title: name,
  content: loreFor(spawn.seed)
    + (first ? ' ⚑ First ascent — recorded in your summit log.' : ''),
  buttons: [
    {
      label: 'Survey the horizon',
      keepOpen: true,   // chain into a second dialog instead of closing
      onSelect: () => XRPublisher.openDialog({
        title: `The view from ${name}`,
        content: `${surveyFor(spawn.seed)} ...`,
        buttons: [{ label: 'Climb down', variant: 'primary' }],
      }),
    },
    { label: 'Leave', variant: 'primary' },
  ],
});
```

`keepOpen: true` stops the button from closing the dialog after `onSelect`; opening a new dialog from inside `onSelect` replaces the current one — that's the [chaining idiom](35-in-world-dialogs.md) for multi-step and branching conversations. Discovery is recorded even when the dialog API is absent, so the HUD counter works on any runtime.

### The explicit collider

`collision: true` alone would auto-box every mesh — including the flag-cord mesh, walling off half the summit. Authoring one cuboid around just the stone column fixes it:

```js
// Explicit collider: ONE cuboid around the stone column. Auto-cuboids
// would also box the flag-cord mesh and wall off half the summit.
group.userData.xrColliders = [
  { half: [r0 * 1.15, capTop / 2 + 0.15, r0 * 1.15], position: [0, capTop / 2, 0] },
];
```

Pairing `collision` with `update()` is safe here because the update only spins a *child* crystal — the collided root never moves. See [Collision](26-decoration-collision.md).

## Key techniques

- **Draw the silhouette plan up front.** Drum count, heights, taper, lean are all drawn before any cosmetic geometry work, so later draws can't shift the structure.
- **All stone merges into one `BufferGeometry`** — one draw call per shrine, `castShadow` only on the stone mass that matters. Flags and cords merge into a second mesh (they need a `DoubleSide` material).
- **Static meshes freeze their matrices** (`updateMatrix(); matrixAutoUpdate = false`); only the crystal keeps auto-update.
- **`spawn.anchorScale` scales grandeur** — grand peaks get slightly grander shrines.
- **First ascents are player state, not world state.** The log lives in `localStorage`, namespaced by `getWorldStateKey()` — deliberately not [`setWorldState`](41-world-state.md), because which peaks *you* climbed is bragging rights, not shared world record.
- **The "wind" in the flags is baked** — per-flag tilt and torn-edge jitter at build time, so the shrine's `update()` stays trivial.

## Try it

- **Local:** `npm run dev`, then open `/decorations/on-mountains/` — the inline `anchor:'mountain'` demo (roam until you find a peak; the crystal beacon is your guide at night).
- **Deploy:** copy the plugin file into your api `plugins/` directory and run `npm run upload-build <build-file>`.

Suggested modifications:

1. Swap `FLAG_PALETTE` for the ember set already commented in the file's config block for volcanic worlds.
2. Make discoveries shared: broadcast first-ascents via [`setWorldState`](41-world-state.md) keyed by `spawn.seed`, and render "first climbed by …" in the dialog.

## Next steps

- [55 — Apple Trees](55-example-apple-trees.md) — the interactable/HUD/dialog trio in its simplest collectible form
- [54 — Canopy Lanterns](54-example-canopy-lanterns.md) — the other anchor showcase
- [22 — Anchors](22-decoration-anchors.md) · [35 — In-World Dialogs](35-in-world-dialogs.md) · [38 — Time of Day](38-time-of-day.md) · [26 — Collision](26-decoration-collision.md)
