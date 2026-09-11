# Example: Minimal Mushrooms

Mushroom clumps ringing the base of the engine's procedural trees — deliberately the smallest complete decoration plugin. One spec, no HUD, no dialogs, no per-frame work. Read this one first; every other example builds on the idioms it establishes.

**Plugin file:** `examples/plugins/minimal-mushrooms-xr-publisher-plugin.umd.js`

[SCREENSHOT: a clump of red-speckled and amber mushrooms nestled against a tree trunk, with one rare teal glowing clump in the background at dusk]

## What it demonstrates

- [`registerDecoration`](19-decorations-overview.md) with [`anchor: 'tree-base'`](22-decoration-anchors.md) — clustering objects at the trunk/terrain contact point of engine trees
- [`spawn.rng` determinism](21-decoration-spawn-context.md) — every visual decision drawn from the per-spawn seeded PRNG, never `Math.random()`
- Shared module-level materials and geometry (the core [decoration performance contract](19-decorations-overview.md))
- The no-op `dispose() {}` override that shared geometry requires
- A rare emissive "species" (seeded 1-in-8 roll) that glows at night — and blooms if the world enables [post-processing](37-post-processing.md) — without ever adding a scene light

## How it works

### Bootstrap

The file uses the standard runtime-wait bootstrap (poll for `window.XRPublisher` + `window.THREE`, register once). That pattern is covered in the [Plugin Development Overview](18-plugin-development-overview.md); every example plugin opens the same way, so the walkthroughs won't repeat it.

### Shared singletons, built once

All materials and base geometries live at module level, created a single time when the plugin initializes. `create()` runs once per tree — per-spawn materials would compile and upload GPU resources per clump and never be freed:

```js
// ── Shared singletons — built ONCE, reused by every clump in the world ──
const stemMat = new THREE.MeshStandardMaterial({ color: 0xeee4d0, roughness: 0.95 });
const capMatRed = new THREE.MeshStandardMaterial({ map: speckleTex, roughness: 0.65 });
// Glow species: near-black albedo so the teal EMISSIVE carries the look —
// no scene light needed, and it blooms wherever a world enables postFX.
const glowMat = new THREE.MeshStandardMaterial({ color: 0x030a0c, emissive: 0x27e0cf, emissiveIntensity: 1.4, roughness: 0.55 });

const capGeo = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
```

The speckled amanita cap is a single 64px `CanvasTexture` painted once at load — authored detail with zero per-spawn cost. Even the stem's barrel bulge is a one-time vertex tweak baked into the shared geometry.

### The spec: anchor at the tree base, scatter into the ring

With `anchor: 'tree-base'`, the engine hands `create()` a spawn whose local origin `(0, 0, 0)` is the trunk's ground-contact point, plus `spawn.anchorRadius` — a ring just outside the trunk. The plugin scatters a small cluster into that ring:

```js
XRPublisher.registerDecoration({
  name: 'minimal-mushroom',
  anchor: 'tree-base',     // ← cluster at the foot of each tree
  density: 0.7,            // ~70% of trees get a clump
  create(spawn) {
    const clump = new THREE.Group();
    const glow = spawn.rng() < 1 / 8; // rare species — seeded per clump
    const outer = Math.max(0.5, spawn.anchorRadius || 1.2);
    const inner = outer * 0.45;
    const count = 3 + Math.floor(spawn.rng() * 4); // 3–6 mushrooms
    for (let i = 0; i < count; i++) {
      const ang = spawn.rng() * Math.PI * 2;
      const rad = inner + spawn.rng() * (outer - inner);
      const mush = makeMushroom(spawn.rng, glow);
      mush.position.set(Math.cos(ang) * rad, -0.03, Math.sin(ang) * rad);
      clump.add(mush);
      // ...
    }
    return clump;
  },
  // Every mesh uses SHARED module-level geometry; default cleanup would
  // dispose it on chunk unload and gut every other clump — opt out.
  dispose() {},
});
```

Every draw — count, angle, size, tilt, species roll, whether a mushroom grows a smaller "buddy" — comes from `spawn.rng`. The same trees grow the same clumps on every visit, on every renderer. See [The Spawn Context](21-decoration-spawn-context.md) for what else `spawn` carries.

### Why the no-op `dispose()`

The engine's default cleanup disposes each spawn's returned **geometry** on chunk unload (it never touches materials). That's exactly right when geometry is unique per spawn — but here every mushroom shares the module-level `capGeo`/`stemGeo`/`gillGeo`. Without the no-op override, unloading one chunk would dispose the geometry out from under every other clump in the world.

## Key techniques

- **Never `Math.random()` for placement or looks.** Anything that should be stable per visit must come from `spawn.rng` (or a seeded sub-RNG). `Math.random()` would give every player — and every reload — a different world.
- **Rare species via a seeded roll, not a config flag.** `spawn.rng() < 1/8` decides the glow variant deterministically per clump, so the same clumps glow for everyone.
- **Emissive materials, never scene lights.** The glow species is one shared emissive material. Scene light count must stay constant after load — adding or removing a light forces every material in the world to recompile.
- **Small organic touches read as authored.** Paired caps (~1 in 3 mushrooms grows a smaller partner), seeded lean, and per-mushroom yaw all cost nothing per frame but break up the "evenly scattered props" look.
- **`castShadow` is a choice, not a default.** Chunky caps cast shadows; the tiny glow caps skip the shadow pass (`cap.castShadow = !glow`).

## Try it

- **Local:** run `npm run dev` in the package and open `/decorations/at-tree-base/` — a self-contained inline variant of the same `anchor:'tree-base'` mushroom idea. (`/decorations/minimal/` is the barest possible single-mesh decoration if you want something even smaller.)
- **Deploy:** copy the plugin file into your api `plugins/` directory and run `npm run upload-build <build-file>`.

Suggested modifications:

1. Change the glow roll from `1/8` to `1/2` and reload — notice the *same* clumps flip species everywhere, because the roll is the first `spawn.rng` draw. Then insert a new `spawn.rng()` call above it and observe the entire forest re-roll: draw **order** is part of the determinism contract.
2. Add a second species (e.g. tall parasol mushrooms) as a *separate* `registerDecoration` spec with its own `name`. A new name gets its own placement seed, so it won't disturb the existing clumps.

## Next steps

- [51 — Surface Targeting](51-example-surface-targeting.md) — filter spawns by terrain surface type, plus instancing
- [54 — Canopy Lanterns](54-example-canopy-lanterns.md) — the sibling anchor, `anchor:'tree'`, hanging from canopies
- [19 — Decorations Overview](19-decorations-overview.md) · [22 — Anchors](22-decoration-anchors.md) · [21 — The Spawn Context](21-decoration-spawn-context.md)
- [18 — Plugin Development Overview](18-plugin-development-overview.md) — the bootstrap pattern and deployment pipeline
