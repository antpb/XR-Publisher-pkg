# Example: Floating Orbs

Wisp-orbs drift over the meadows — each one with a seeded name, a personality, and a branching in-world conversation: befriend them, solve a riddle, or absorb their light and watch them fade to a grey husk.

Plugin source: `examples/plugins/floating-orbs-xr-publisher-plugin.umd.js` (~530 lines, fully commented).

[SCREENSHOT: a glowing ember-orb hovering over grass with the "E · speak with Ly'mira" prompt visible]

## What it demonstrates

- **`update()` dynamics** — allocation-free per-frame bob/spin/pulse motion. See [Decorations overview](19-decorations-overview.md).
- **`interactable` + `interactionPrompt` as a function** — a stateful prompt re-resolved at ~10Hz. See [Interactables](33-interactables.md).
- **Chained `openDialog()` calls** — branching conversations and a retry-loop riddle built from `keepOpen` buttons. See [In-world dialogs](35-in-world-dialogs.md).
- **`registerHud` + `localStorage`** — a persistent "✦ light gathered" counter, namespaced per world. See [HUD overlays](34-hud-overlays.md) and [World state](41-world-state.md) (for `getWorldStateKey`).
- **`getTimeOfDay()`** — greetings pick up a day/night flavour line. See [Time of day](38-time-of-day.md).
- **Emissive-only glow, no scene lights** — a hard engine contract (scene light count must stay constant after load).

## How it works

### 1. Seeded identity, memoized for the 10Hz prompt

Every wisp's name and personality derive from `spawn.seed` through a *dedicated* alea stream — never `Math.random()`, and never `spawn.rng` itself, because identity is also needed outside `create()`'s fixed draw order:

```js
// interactionPrompt re-resolves ~10Hz — memoize identities so the prompt
// function is a Map lookup, not a fresh PRNG + string build every tick.
const identityCache = new Map();
const identityFor = (seed) => {
  let id = identityCache.get(seed);
  if (id) return id;
  const r = makeRng(seed + '-identity');
  let name = SYL_A[(r() * SYL_A.length) | 0] + SYL_B[(r() * SYL_B.length) | 0];
  if (r() < 0.45) name += SYL_C[(r() * SYL_C.length) | 0];
  const themeKey = THEME_KEYS[(r() * THEME_KEYS.length) | 0];
  id = { name, themeKey };
  identityCache.set(seed, id);
  return id;
};
```

The prompt itself is a function — the engine re-resolves it every ~100ms, so it flips with state without re-registering anything:

```js
interactionPrompt: (spawn) => {
  const id = identityFor(spawn.seed);
  if (absorbedSeeds.has(spawn.seed)) return `${id.name} (faded)`;
  if (befriendedSeeds.has(spawn.seed)) return `greet ${id.name}`;
  return `speak with ${id.name}`;
},
```

### 2. The dialog-chaining contract

A dialog button closes its dialog *after* `onSelect` runs — unless it sets `keepOpen`. So every button whose `onSelect` opens the *next* dialog must set `keepOpen: true`, or the deferred close tears down the panel it just opened. The plugin bakes that into one helper:

```js
// CHAINING CONTRACT: a button closes its dialog AFTER onSelect unless
// keepOpen — so every button whose onSelect opens the NEXT dialog sets
// keepOpen:true, or the deferred close would tear down the panel the
// onSelect just opened. `chain()` bakes that in.
const chain = (label, open, variant) => ({ label, keepOpen: true, variant, onSelect: open });
```

The tide-wisp's riddle shows the *other* use of `keepOpen` — a genuine multi-step exchange where wrong answers keep the same panel open so the player just picks again:

```js
XRPublisher.openDialog({
  title: `${io.name} swells`,
  content: '"I rise without wings. I fall without weight. I carry the moon in my arms and lay her at your feet. What am I?"',
  buttons: [
    { label: '"A dream"', keepOpen: true },
    chain('"The tide"', () => {
      solvedRiddles.add(io.seed);
      concludeWithLight(/* … reward dialog … */);
    }),
    { label: '"The rain"', keepOpen: true },
    { label: 'Give up' },   // no onSelect, no keepOpen → plain close
  ],
});
```

### 3. Shared materials, and why the pulse is scale-based

All visual resources are allocated once at module scope: four themes × (core + halo ring) materials, one shared "faded" pair, and two shared geometries. `create()` allocates nothing but a `Group` and two `Mesh` wrappers. State changes are a **material swap between shared singletons**, never a per-orb clone or an in-place mutation:

```js
const setOrbLit = (orb, theme, lit) => {
  const u = orb.userData;
  u.dimmed = !lit;
  u.core.material = lit ? theme.mats.core : dimMats.core;
  u.ring.material = lit ? theme.mats.ring : dimMats.ring;
  // Husks drift: slower spin, shallower bob (per-orb userData — safe).
  u.spin = lit ? u.spinLit : u.spinLit * 0.25;
  u.bobAmp = lit ? u.bobAmpLit : u.bobAmpLit * 0.35;
};
```

The per-frame `update()` is allocation-free, and the "pulse" is deliberately scale breathing:

```js
update(orb, _delta, elapsed) {
  const u = orb.userData;
  orb.rotation.y = elapsed * u.spin + u.phase;
  orb.position.y = u.baseY + Math.sin(elapsed * u.bobHz + u.phase) * u.bobAmp;
  // "Pulse" = SCALE breathing, deliberately NOT emissiveIntensity: the
  // theme materials are SHARED by every wisp of that colour, so
  // mutating one would pulse the whole world in lockstep (and per-orb
  // material clones would defeat the sharing). Husks don't pulse.
  const pulse = u.dimmed ? 0 : Math.sin(elapsed * u.pulseHz + u.phase) * 0.06 * u.pulseAmp;
  orb.scale.setScalar(u.baseScale * (1 + pulse));
},
```

### 4. Two persistence scopes, deliberately different

- **Absorbed/befriended wisps are session-scoped** — `Set`s of `spawn.seed` consulted in `create()`, so a husk survives chunk streaming but the world re-kindles on reload. The wisps come back; that's the design.
- **The ✦ counter persists** in `localStorage`, namespaced by `XRPublisher.getWorldStateKey()` so two worlds on one host don't share a lantern. Hitting `LIGHT_GOAL` fires a one-time special dialog whose flag is persisted alongside the counter.

## Key techniques and gotchas

- **No scene lights, ever.** Glow is shared emissive materials with intensity above 1.0 — they punch the bloom threshold when a world enables [post-processing](37-post-processing.md) and simply read bright when it doesn't. Adding/removing a light would recompile every material in the world.
- **No `castShadow` on the orbs** — they read as light *sources*; a wisp throwing a crisp shadow reads wrong, and skipping it keeps them off the shadow-caster list.
- **Explicit no-op `dispose() {}`.** Geometry and materials are shared module singletons — the default cleanup would dispose this orb's (shared) geometry on chunk unload and break every other wisp. Any spec that shares GPU resources across spawns needs this.
- **Fixed draw order in `create()`** — every `rng()` draw happens unconditionally before any state-dependent branch, so absorbed/befriended state can't shift sibling variation.
- **Feature-detect optional APIs** (`HAS_DIALOG`, `HAS_HUD`) and degrade: without dialogs the orbs are ambient scenery; without HUD the count is silent.
- **Choices that matter through asymmetry**: befriended wisps can't be absorbed — that one rule is what makes befriending a real choice instead of a flavour button.

## Try it

Deploy: copy into the api `plugins/` directory, `npm run upload-build <build-file>`. For local browsing, `examples/decorations/dynamic-animated/` is the matching demo page (it contains a trimmed inline version of this `floating-orb` spec — the shipped plugin file is the full narrative build).

Suggested modifications:

1. **Add a fifth personality** — new entry in `THEMES` (materials via `wispMats`, a voice, a `branch()`); the theme pick in `identityFor` widens automatically. Existing wisps will re-shuffle themes (the theme index draw changes range) — a good concrete lesson in what is and isn't protected by seeding.
2. **Make absorption shared across visitors** — replace the session `absorbedSeeds` Set with [world state](41-world-state.md) records keyed by `spawn.seed`, the way [Campfires](60-example-campfires.md) shares its lit flag.

## Next steps

- [In-world dialogs](35-in-world-dialogs.md) — the full `openDialog` API, sizing, and close reasons.
- [Interactables](33-interactables.md) — prompts, radii, and the E-key flow.
- [Campfires](60-example-campfires.md) — the same stateful-prompt pattern with *shared, persisted* state.
- [Ancient Ruins](63-example-ancient-ruins.md) — seeded lore text and a two-page dialog chain on a static decoration.
