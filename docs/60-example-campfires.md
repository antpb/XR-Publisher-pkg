# Example: Campfires

Tended campsites scattered through the grass — stone ring, log teepee, seating, a live animated fire — that any visitor can light or extinguish, with the fire's state shared live across the room and persisted for later visitors.

Plugin source: `examples/plugins/campfires-xr-publisher-plugin.umd.js` (~650 lines, fully commented). This is the **minimal world-state example**: one boolean record per fire is all it takes to make a world feel inhabited. [Farm Plots](61-example-farm-plots.md) is its maximal sibling.

[SCREENSHOT: a lit campfire on a dirt clearing at dusk, flames and smoke visible, "E · Extinguish campfire" prompt]

## What it demonstrates

- **`groundPatch`** — a dirt clearing painted on the terrain with grass cleared out of it, on both renderers. See [Ground patches](25-decoration-ground-patches.md).
- **World state, minimal form** — `setWorldState` / `getWorldState` / `subscribeWorldState` / `fetchWorldState` with one tiny `{ lit, t }` record per fire. See [World state](41-world-state.md).
- **`interactable` + stateful prompt function** — "Light campfire" ⇄ "Extinguish campfire". See [Interactables](33-interactables.md).
- **Explicit colliders via `userData.xrColliders`**. See [Decoration collision](26-decoration-collision.md).
- **`update()` budget discipline** — distance-LOD cadence, allocation-free animation, a live fire with zero scene lights.
- **`getTimeOfDay()`** — firelight carries further after sundown. See [Time of day](38-time-of-day.md).

## How it works

### 1. The spec: groundPatch + stateful interaction

```js
XRPublisher.registerDecoration({
  // Name unchanged from v1 on purpose: the name seeds placement, so a
  // rename would relocate every existing campfire in every world.
  name: 'campfire',
  density: DENSITY,
  surface: 'grass',          // build them ON grass…
  maxSlope: 0.2,
  minSpacing: MIN_SPACING,
  collision: true,           // …with EXPLICIT colliders (userData.xrColliders)
  groundPatch: {
    radius: PATCH_RADIUS,
    color: [0.30, 0.21, 0.13],
    clearGrass: true,
  },
  interactable: true,
  interactionRadius: 5,
  interactionPrompt: (spawn) => (isLit(spawn.seed) ? 'Extinguish campfire' : 'Light campfire'),
  ...
```

The `groundPatch` paints a dirt circle and clears engine grass out of it, so the camp reads as a deliberate, lived-in spot rather than an object dropped in grass — and other decorations are skipped inside the patch.

### 2. The whole state model: one record, one derivation, one convergence path

State is one record per fire, keyed by the deterministic `spawn.seed`:

```js
// ── State model: { lit: boolean, t: epoch ms } keyed by spawn.seed ──────
const isLit = (seed) => {
  if (HAS_STATE) {
    const rec = XRPublisher.getWorldState(PLUGIN_ID, seed);
    return rec && rec.value && typeof rec.value.lit === 'boolean' ? rec.value.lit : DEFAULT_LIT;
  }
  return sessionLit.has(seed) ? sessionLit.get(seed) : DEFAULT_LIT;
};
```

Note the shape of this: `getWorldState` is a **synchronous snapshot read** (safe inside `create()` and the 10Hz prompt), the default (`DEFAULT_LIT = true`) is the deterministic state a record-less fire has, and the record carries a TTL (`ttlSeconds: STATE_TTL_S`) so untended camps relax back to that default after a few hours.

All state arrivals — chunk fetches, peers' toggles, and your own optimistic write — converge through one subscription:

```js
XRPublisher.subscribeWorldState((plugin, key) => {
  if (plugin !== PLUGIN_ID) return;
  const g = liveFires.get(key);
  if (g) applyState(g, isLit(key));
});
```

### 3. Writing state on interact

```js
onInteract(ctx) {
  const seed = ctx.spawn.seed;
  const lit = !isLit(seed);
  if (HAS_STATE) {
    // renderPosition is RENDER-frame world XZ — no correction needed.
    // The server enforces a ~32u writer-distance rule around this point;
    // interactionRadius 5 keeps us comfortably inside it.
    const wx = ctx.spawn.renderPosition[0], wz = ctx.spawn.renderPosition[2];
    XRPublisher.setWorldState(PLUGIN_ID, seed, { lit, t: Date.now() }, {
      pos: [wx, wz],
      ttlSeconds: STATE_TTL_S,
    });
  } else {
    sessionLit.set(seed, lit);
  }
  applyState(ctx.object, lit);   // belt-and-braces immediate flip
},
```

The position comes straight from `spawn.renderPosition` — render-frame world XZ for every anchor type, the same frame `setWorldState` positions (and the player) live in, so **no correction is needed**. (The legacy `spawn.worldPosition` was worker-frame and needed a −½-chunk shift; treat it as deprecated — see [Decoration spawn context](21-decoration-spawn-context.md).)

Fetching is **mount-gated**: `create()` kicks one `fetchWorldState({ prefix, maxAgeMs })` per chunk. N fires in a chunk coalesce to one HTTP request, remounts inside the freshness window cost none, and roaming campless terrain costs nothing. The plugin file derives that prefix itself (it predates the field); write new plugins against [`spawn.chunkPrefix`](21-decoration-spawn-context.md), which is exactly this string — slicing `spawn.seed` by hand is the classic way to break the coalescing, since the seed ends with **two** grid coords.

### 4. `update()` discipline — a live fire on a budget

The fire animates flames (crossed emissive quads), three recycled smoke puffs, spark motes, and an additive ground-glow disc — all with strict cost rules:

```js
update(fire, delta, elapsed) {
  const u = fire.userData;
  if (!u.lit) return;                              // cold camp = fully static
  if (document.hidden) return;                     // backgrounded tab = free

  // ~8Hz housekeeping: distance LOD, billboard yaw, day-night glow.
  u.hk += delta;
  if (u.hk >= 0.12) {
    u.hk = 0;
    const ps = XRPublisher.getPlayerState && XRPublisher.getPlayerState();
    if (ps) {
      fire.getWorldPosition(V);                    // scratch — no alloc
      const dx = ps.x - V.x, dz = ps.z - V.z;
      const d2 = dx * dx + dz * dz;
      u.far = d2 > SKIP_DIST * SKIP_DIST;
      u.mid = d2 > FULL_RATE_DIST * FULL_RATE_DIST;
      u.yaw = Math.atan2(dx, dz);
    }
    ...
  }
  if (u.far) return;                               // >90u: skip everything

  // Distance-LOD cadence: 40-90u fires animate at 20Hz.
  u.acc += delta;
  if (u.mid && u.acc < 1 / 20) return;
  ...
```

And the one shared-material write is guarded to run once per frame no matter how many fires are live:

```js
// Ember pulse — SHARED material, so write it exactly once per frame
// no matter how many fires are live (elapsed is frame-identical).
if (emberTick !== elapsed) {
  emberTick = elapsed;
  MAT.emberLit.emissiveIntensity = 1.45 + Math.sin(elapsed * 6.7) * 0.3 + Math.sin(elapsed * 11.9) * 0.15;
}
```

## Key techniques and gotchas

- **Zero scene lights.** A `PointLight` per campfire would recompile every material in the world as chunks stream (light count is part of the pipeline cache key). Flames use the "stockEmissive" trick — black albedo + `emissiveMap` — which blooms under [post-processing](37-post-processing.md) and reads bright without it. The "firelight" on the ground is an additive glow disc scaled by the flicker.
- **All fire quads are depth-tested** — never `depthTest: false`. Terrain renders through WebGPU render bundles that ignore `renderOrder`; depth-disabled quads paint *behind* the world.
- **One low collider box over the fire ring** + one per seat/prop, instead of a cuboid per stone — and `update()` animates only non-collidable children (flames/smoke/sparks), never the root, because colliders don't follow moved objects.
- **Static dressing is matrix-frozen** (`matrixAutoUpdate = false` after one `updateMatrix()`); only the animated children keep auto-update.
- **The one justified per-spawn material**: each smoke puff clones the smoke material (per-puff opacity fade needs it; the shared texture survives `material.dispose()`), tracked in `userData.__ownedMats` and freed in `dispose()`. Because every *geometry* is shared, `dispose()` deliberately does **not** run the usual traverse-and-dispose.
- **Multi-point ground seating**: seats and props 2–3u out use `spawn.groundHeightAt(dx, dz)` so a hillside camp doesn't float — same technique as [Farm Plots](61-example-farm-plots.md)' fences.
- **Seeded everything** — stones, teepee, seats, prop variant, even the flame flicker phases draw from `spawn.rng` in a fixed order, so a camp's fire dances the same way each time you return.

## Try it

Deploy: copy into the api `plugins/` directory, `npm run upload-build <build-file>`. For local browsing, `examples/decorations/dirt-clearing/` is the matching demo page (its inline `campfire` spec is the original groundPatch-focused version; the shipped plugin file adds the live fire and shared state).

Suggested modifications:

1. **Add a third state** — e.g. `smouldering` between lit and cold. Extend the record to `{ st, t }` and derive the stage from the timestamp at read time, the way [Farm Plots](61-example-farm-plots.md)' `plotStage()` does.
2. **Tune the LOD boundaries** — drop `FULL_RATE_DIST` / `SKIP_DIST` and watch when you can actually notice the 20Hz band while walking. It's a good calibration exercise for your own `update()` budgets.

## Next steps

- [World state](41-world-state.md) — the full API: TTLs, writer-distance rules, freshness caching, merge semantics.
- [Farm Plots](61-example-farm-plots.md) — the flagship world-state demo: a five-stage lifecycle on the same foundations.
- [Ground patches](25-decoration-ground-patches.md) — patch budget, `clearGrass`, and how patches gate other decorations.
- [Settler Huts](59-example-settler-huts.md) — the same "lived-in world" goal via architecture instead of state.
