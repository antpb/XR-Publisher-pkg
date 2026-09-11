# Example: Apple Trees

A collectible orchard: apples hang from the engine's tree canopies; walk up, press E, and the apple goes into your basket — permanently for the session. Roughly one in twelve is a golden apple worth five. This is the interactable + HUD + dialog showcase.

**Plugin file:** `examples/plugins/apple-trees-xr-publisher-plugin.umd.js`

[SCREENSHOT: a red apple dangling below a canopy with the "Press E — collect apple" prompt visible, basket HUD in the top-right corner]

## What it demonstrates

- [`interactable: true` + `onInteract`](33-interactables.md) — a per-spawn "Press E" prompt; `ctx.remove()` despawns instantly
- **A stateful `interactionPrompt` function** — re-resolved ~10Hz by the engine, so the prompt can say "collect GOLDEN apple" without re-registering
- **Session-permanent collection** — deterministic spawns reappear on chunk reload, so collected `spawn.seed`s live in a `Set` and `create()` returns `null` for them
- [`registerHud`](34-hud-overlays.md) — a basket panel with counts and total worth, persisted in `localStorage` namespaced per world via `getWorldStateKey()`
- [`openDialog`](35-in-world-dialogs.md) — a one-time first-collect hint as an in-world 3D panel (readable in VR, unlike the DOM HUD)
- [`anchor: 'tree'`](22-decoration-anchors.md) hanging, as in [Canopy Lanterns](54-example-canopy-lanterns.md)

## How it works

### The spec: interactable, with a function prompt

```js
XRPublisher.registerDecoration({
  name: 'tree-apple',              // part of the placement seed — renaming relocates every apple
  anchor: 'tree',                  // hang on the canopy underside (local y=0 = leaf surface)
  density: DENSITY,
  interactable: true,              // ← "E to interact" (forces per-object mount)
  // Prompt is a FUNCTION: the engine re-resolves it ~10Hz while you stand
  // near, so stateful/contextual text is free — but keep it a cheap lookup.
  interactionPrompt: (spawn) =>
    (goldenBySeed.get(spawn.seed) ? 'collect GOLDEN apple' : 'collect apple'),
  interactionRadius: INTERACT_RADIUS,
  // ...
```

Two contracts hide in that prompt function. It must be **cheap** — a `Map` lookup, because the engine re-resolves it at ~10Hz proximity cadence. And it must **never draw from `spawn.rng`** — a draw would advance the stream on every resolve and desync the deterministic geometry. Golden-ness is decided once in `create()` (the *first* `spawn.rng` draw) and cached in `goldenBySeed`; `dispose()` clears the entry on chunk unload and a reload re-derives the identical value.

Note also that `interactable: true` forces the per-object mount path — each apple must be individually targetable and removable, which is why interactables are incompatible with [`instanced`](24-decoration-instancing.md).

### The collect loop

```js
create(spawn) {
  if (harvested.has(spawn.seed)) return null;   // picked this session — stays gone

  // FIXED-ORDER spawn.rng draws (golden → size → hue → leaf twist).
  const isGolden = spawn.rng() < GOLDEN_ODDS;
  const size = 0.85 + spawn.rng() * 0.3;
  const fruitMat = isGolden ? goldMat : (spawn.rng() < 0.6 ? redMat : greenMat);
  // ... assemble stem + apple + leaf from shared geometry ...
},

onInteract({ spawn, remove }) {
  harvested.add(spawn.seed);     // create() now returns null on chunk reload
  if (goldenBySeed.get(spawn.seed)) basket.golden += 1;
  else basket.red += 1;
  saveBasket();
  renderHud();
  maybeShowHint();               // one-time orchard explainer (first pick ever)
  remove();                      // instant despawn — see PERF NOTE
},
```

This is the whole persistence trick: spawns are deterministic, so a `remove()`d apple would reappear when its chunk reloads. Recording the `spawn.seed` and returning `null` from `create()` makes the pick stick no matter how far you roam. It's session-only by design — the header points at [`setWorldState`](41-world-state.md) (keyed by `spawn.seed`, checked in `create()`) for cross-session and shared permanence, with farm-plots as the reference implementation.

### The HUD: plugin-owned DOM, updated imperatively

```js
const hud = document.createElement('div');
// ... styles ...
renderHud = () => {
  const worth = basket.red + basket.golden * GOLDEN_WORTH;
  hud.innerHTML = /* basket counts + worth */;
};
renderHud();
XRPublisher.registerHud(`${PLUGIN_ID}-basket`, hud, 'top-right');
```

The plugin owns the node and mutates it directly — no React, no store. That's the [`registerHud` contract](34-hud-overlays.md). The basket persists in `localStorage` under a key namespaced by `XRPublisher.getWorldStateKey()` (feature-detected, falling back to `location.hostname`), so two worlds on one host don't share a basket. The DOM HUD is flatscreen-only; the VR-facing surface is the dialog:

```js
XRPublisher.openDialog({
  title: 'The Orchard',
  content: 'Apples grow in the tree canopies here. Walk up to one and '
    + 'press E to pick it. ...',
  buttons: [{ label: 'Got it', variant: 'primary' }],
});
```

Shown once ever (a `hinted` flag rides in the persisted basket record), wrapped in `try/catch` — the dialog is a nicety and must never break collection.

## Key techniques

- **Deliberately no `update()` on this spec.** Apples are dense and static; an `update()` would flip *every* apple onto the per-frame dynamic path. That's also why collecting is an instant `remove()` with no falling animation — the feedback tradeoff buys back an entire orchard's worth of per-frame work. If you want pick feedback, do it outside the spec (e.g. a single pooled particle burst), never by animating the spawned objects.
- **Fixed `spawn.rng` draw order** (golden → size → hue → leaf twist). Inserting a draw above another shifts every value after it and re-rolls the whole orchard's look.
- **Custom `dispose` that disposes nothing** — geometry is module-shared, so it only clears the golden cache entry for the unloading chunk (via `userData.appleSeed`).
- **Golden glow is emissive, never a `PointLight`** — scene light count must stay constant after load.
- **Feature-detect optional APIs** (`registerHud`, `openDialog`, `getWorldStateKey`) so the plugin still works on older runtimes — collection functions even if the HUD and hint never appear.

## Try it

- **Local:** `npm run dev`, then open `/decorations/collectible-apples/` — the self-contained inline interactable + HUD demo.
- **Deploy:** copy the plugin file into your api `plugins/` directory and run `npm run upload-build <build-file>`.

Suggested modifications:

1. Make picks permanent across sessions: on collect, `setWorldState(...)` keyed by `spawn.seed`, and in `create()` check `getWorldState` before building (see [Persisted World State](41-world-state.md) and [Farm Plots](61-example-farm-plots.md)).
2. Add a third rarity tier. Keep the roll as one draw (e.g. bucket a single `spawn.rng()` value) so existing apples don't re-roll.

## Next steps

- [56 — Summit Totems](56-example-summit-totems.md) — interactable + dialog + HUD at mountain scale, with chained dialogs
- [61 — Farm Plots](61-example-farm-plots.md) — the world-state flagship: shared, cross-session persistence
- [33 — Interactables](33-interactables.md) · [34 — HUD Overlays](34-hud-overlays.md) · [35 — In-World Dialogs](35-in-world-dialogs.md) · [41 — Persisted World State](41-world-state.md)
