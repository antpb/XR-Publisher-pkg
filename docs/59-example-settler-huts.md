# Example: Settler Huts

Lone settler homesteads on flat dry clearings in the wilds — walk-in cottages, two-room homes, and barns with furnished interiors, yards, door trails, banked hearths, lootable stores, and a rare abandoned variant left to the weeds.

Plugin source: `examples/plugins/settler-huts-xr-publisher-plugin.umd.js` (~1500 lines, fully commented). It shares its plan→compile building architecture with [Town Center](62-example-town-center.md) — read that page for the mesh writer and collider-baking deep dive; this page focuses on what settler-huts adds.

[SCREENSHOT: a timber-framed cottage at dusk, hearth-lit windows, a dirt footpath leading from the door]

## What it demonstrates

- **Walk-in structures via `collision: true` + `userData.xrColliders`** — merged visual geometry with hand-authored cuboids for plinth, wall runs split at doorways, ramp, furniture, and yard props. See [Decoration collision](26-decoration-collision.md).
- **`registerInteractable` on a sub-object** — a lootable barrel/chest targeted independently of the hut it belongs to. See [Interactables](33-interactables.md).
- **`addPath` door trails** — a short seeded footpath from every lived-in door. See [Paths and roads](30-paths-and-roads.md).
- **Seeded variants** — the ~1-in-6 abandoned homestead: collapsed roof, dead glass, missing door, weeds.
- **Dedicated rng streams** (`-yard`, `-loot`) and strict fixed-draw-order determinism. See [Decorations overview](19-decorations-overview.md).
- **`getWorldTowns` exclusion** — wilderness huts stay out of engine towns. See [Terrain queries](31-terrain-queries.md).
- **`openDialog` loot flavour text**. See [In-world dialogs](35-in-world-dialogs.md).

## How it works

### 1. Three specs, one compiler

`init()` registers three decoration types (`settler-cottage`, `settler-home`, `settler-barn`) through one `registerType` helper. Each `create()` gates placement, draws its variant knobs *first and in fixed order*, then compiles a plan:

```js
create(spawn) {
  if (spawn.treeDistance < 6) return null;     // don't bury a trunk in a wall
  // Stay OUT of engine towns — the town-center plugin packs its own
  // buildings there and a wilderness hut would overlap them.
  if (isNearTown(spawn.renderPosition[0], spawn.renderPosition[2])) return null;
  const rng = spawn.rng;
  // Variant knobs FIRST, in fixed order — the rng draw sequence per
  // seed must never depend on runtime conditions (determinism).
  const abandoned = rng() < ABANDONED_CHANCE;
  const faceAngle = (rng() * 4 | 0) * (Math.PI / 2) + (rng() - 0.5) * 0.3;
  const plan = normalizePlan(makeHutPlan(rng, type));
  plan.abandoned = abandoned;
  plan.hearth = !!plan.chimney && !abandoned;
  plan.glassSlot = abandoned ? 'glassDark' : (plan.hearth ? 'glowHearth' : 'glow');
  plan.doorMode = abandoned ? (rng() < 0.5 ? 'missing' : 'ajar') : 'normal';
  ...
```

One subtle determinism rule from the loot container:

```js
// The container ALWAYS builds when the hut is lived-in (seeded state
// only — a runtime condition here would shift the rng draws that
// follow it and desync layouts across runtime versions). Whether it
// becomes interactive is decided below by feature detection.
plan.loot = abandoned ? null : (type === 'home' ? 'chest' : 'barrel');
```

Seeded state may gate an rng-consuming branch; **runtime feature detection may not** — otherwise the same seed produces different layouts on runtimes with different APIs available.

### 2. Variant knobs thread through the compiler

The abandoned variant isn't a separate builder — it's a handful of plan flags the shared compiler honours: `glassSlot` swaps the window pane material (candle `glow` / stronger `glowHearth` / dead `glassDark`), `doorMode` controls the door leaf:

```js
// Door leaf — the leaf state is a seeded variant knob (cfg.doorMode):
//   'normal'  — swung WIDE to the outward side (~115-140°, nearly flat
//               against the wall) so the doorway stays walkable
//   'ajar'    — barely open (abandoned huts left half-shut in a hurry)
//   'missing' — no leaf at all (scavenged long ago); jambs/header remain
if (cfg.doorMode !== 'missing') {
  const swing = cfg.doorMode === 'ajar' ? (0.3 + rng() * 0.35) : (2.0 + rng() * 0.45);
  ...
```

…and the gable-roof emitter takes a `skipSign` to collapse one slope into three sagging skeletal rafters, with fallen roofing planks scattered across the floor inside. A collapsed roof also deliberately gets **no shelter collider** — rain falling through the caved-in gable is correct (the engine's `sheltered` flag is a rapier ray cast straight up that sees colliders, not visuals; every intact roof adds a thin cuboid at ceiling height for exactly this reason).

### 3. Door trails: `addPath` from the compiler's door handshake

The building compiler returns the door/ramp-foot position in local coordinates plus the final yaw (`__doorLocal` / `__yaw`). `create()` rotates that into world space and lays a short wandering footpath:

```js
if (hasPaths && !abandoned && g.userData.__doorLocal) {
  const [dlx, dlz] = g.userData.__doorLocal;
  const yaw2 = g.userData.__yaw;
  const cy = Math.cos(yaw2), sy = Math.sin(yaw2);
  const doorWX = spawn.renderPosition[0] + dlx * cy + dlz * sy;
  const doorWZ = spawn.renderPosition[2] - dlx * sy + dlz * cy;
  const ox = sy, oz = cy;                     // outward door normal (local +Z, yawed)
  const len = 8 + rng() * 6;
  const bend = (rng() - 0.5) * 0.8;           // trails wander; roads don't
  ...
  const id = XRPublisher.addPath({
    id: `settler-trail-${spawn.seed}`, width: TRAIL_W, tint: TRAIL_TINT,
    points: [[doorWX, doorWZ], [mx, mz], [mx + bx * len * 0.55, mz + bz * len * 0.55]],
  });
  if (id) g.userData.__pathId = id;
}
```

Path points come straight from `spawn.renderPosition` — the render frame `addPath` draws in, no correction needed (the legacy `spawn.worldPosition` required a −½-chunk shift; treat it as deprecated) — and `removePath` runs in `dispose()`. Abandoned huts get no trail — it grew over years ago.

### 4. Lootable stores: `registerInteractable` on a sub-object

The rain barrel / chest is deliberately built as its **own `Object3D`**, not merged into the writer, so the interactable targets just that piece — a spec-level `interactable: true` would make the *whole hut* one interactable:

```js
if (g.userData.__loot && hasLoot) {
  const seed = spawn.seed;
  const lootId = `settler-loot-${seed}`;
  XRPublisher.registerInteractable({
    id: lootId,
    object: g.userData.__loot,
    radius: 2.5,
    // prompt is a FUNCTION — re-resolved ~10Hz, so it flips to
    // "Empty …" the moment the loot is taken. Keep it a Set lookup.
    prompt: () => lootedSeeds.has(seed)
      ? (chest ? 'Empty chest' : 'Empty barrel')
      : (chest ? 'Open chest' : 'Search barrel'),
    onInteract: () => { /* one-time loot + openDialog flavour text */ },
  });
  g.userData.__lootId = lootId;
}
```

Loot is one-time **per session** (a `Set` keyed by `spawn.seed`, so chunk streaming can't be farmed by walking away and back), with seeded flavour text from a dedicated `alea(seed + '-loot')` stream. `unregisterInteractable` runs in `dispose()`. Want loot that stays taken across visits and visitors? That's a [world state](41-world-state.md) record — see [Campfires](60-example-campfires.md).

### 5. Yards on a dedicated rng stream

2–4 seeded props (firewood lean-to, vegetable patch, clothesline/drying rack, an unfinished fence run) are emitted into the *same* writer and collider stream as the building, so the merged draw-call count barely moves. They draw from `utils.alea(seed + '-yard')` so yard tuning never perturbs the building's own rng draws (rooms, furniture, roof, chimney). All yard coordinates are building-local (pre-yaw): the yard rotates with the hut, and every solid piece goes through the same `bakeColliders` pass.

## Key techniques and gotchas

- **Hearths, not lights**: chimney huts bank a fire — hearthstone, log pair, emissive ember blobs, and the stronger `glowHearth` window material. Emissive only, never a scene light (adding/removing lights recompiles every material in the world); embers pick up [post-processing](37-post-processing.md) bloom for free.
- **Lantern budget**: only ~15% of door lanterns burn (seeded) — a fully-lit countryside reads like a fair and spends the emissive/bloom budget.
- **Furniture placement guard**: rooms are furnished through a claim system — no overlaps, a clear disc around the front door and *every* interior doorway, and the hearth zone claimed before beds are placed. (The recorded failure mode: beds parked in doorways in 3 of 4 houses.)
- **Known API gap, worked around honestly**: `groundPatch` is spec-level, so an abandoned hut can't flip `clearGrass: false` per spawn — the overgrowth is emitted as weed-blob geometry instead.
- **Town exclusion is polled**: `getWorldTowns` results accumulate in a cache refreshed every 5s around the player; `create()` rejects spawns within 105u of a town centre.
- **Feature-detect everything optional**: no `addPath` → no trails; no `registerInteractable`/`openDialog` pair → the container is just decorative.

## Try it

Deploy: copy into the api `plugins/` directory, `npm run upload-build <build-file>`. For local browsing, `examples/decorations/solid-buildings/index.html` is the matching demo page (its inline `settler-hut` spec is the earlier, simpler walk-in-structure teaching version; `examples/decorations/biome-surfaces/index.html` loads this full plugin file).

Suggested modifications:

1. **Add a fourth homestead type** (e.g. a watchtower) — write a `makeHutPlan` branch and a `registerType` call. Everything downstream (walls, colliders, ramp, yard, trail) comes free from the compiler.
2. **Persist looted containers across sessions** — swap the `lootedSeeds` Set for [world state](41-world-state.md) records with a TTL, so barrels restock after a day.

## Next steps

- [Town Center](62-example-town-center.md) — the shared building compiler at town scale, plus the mesh writer and `bakeColliders` reference walkthrough.
- [Decoration collision](26-decoration-collision.md) — explicit colliders and the walk-in-structure pattern.
- [Paths and roads](30-paths-and-roads.md) — `addPath`/`removePath` and path budgets.
- [Campfires](60-example-campfires.md) — shared persisted state for a "lived-in" world.
