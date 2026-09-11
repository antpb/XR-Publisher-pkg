# Example: Farm Plots

Procedural farmsteads carved into the plains — tilled soil, fenced fields, crops planted on the furrow lines — with a fully persisted crop lifecycle: harvest ripe crops, water the sprouts, clear the dead ones, and everyone in the world sees (and shares) the consequences.

Plugin source: `examples/plugins/farm-plots-xr-publisher-plugin.umd.js` (~990 lines, fully commented). This is the **flagship world-state demo**; [Campfires](60-example-campfires.md) is the minimal one.

[SCREENSHOT: a fenced wheat plot with scarecrow and hay bale, "E · Harvest crops" prompt showing]

## What it demonstrates

- **The five-stage crop state machine** — ripe → picked → stubble → sprout → (watered → growing → ripe | unwatered → dead), derived from one timestamp. See [World state](41-world-state.md).
- **`registerTerrainSurface('tilled-soil')` + `addTerrainRegion`** — a custom procedural ground the crops visually agree with, re-registered per stage for soil tinting. See [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md).
- **`spawn.groundHeightAt` multi-point seating** — fences, gates, and every plant sit on the real terrain. See [Decoration spawn context](21-decoration-spawn-context.md).
- **The material-slot mesh writer** — hundreds of parts compiled into ~8 draw calls. (The same writer pattern as [Town Center](62-example-town-center.md) and [Settler Huts](59-example-settler-huts.md).)
- **Explicit colliders** (`userData.xrColliders`) — walk through the gate, jump the rails. See [Decoration collision](26-decoration-collision.md).
- **HUD inventory** — a 🧺 button with a per-crop breakdown, persisted in `localStorage`. See [HUD overlays](34-hud-overlays.md).
- **The `ensureTicker` self-clearing timer pattern** — time-based transitions without per-frame cost.

## How it works

### 1. Plan first, then compile

Every seeded decision is drawn up front, in a fixed order, before any geometry exists:

```js
function makePlan(rng) {
  const R = 7 + rng() * 3;                       // tilled circle radius
  const FX = R + 2 + rng() * 1.5;                // fence half-extent X
  const FZ = R + 2 + rng() * 1.5;                // fence half-extent Z
  const gateSide = ['n', 's', 'e', 'w'][rng() * 4 | 0];
  const focus = rng();                           // crop pick
  const crop = focus < 0.32 ? 'wheat' : focus < 0.56 ? 'pumpkin' : focus < 0.8 ? 'cabbage' : 'carrot';
  return {
    R, FX, FZ, gateSide, crop,
    bales: crop === 'wheat' ? 1 + (rng() * 2 | 0) : (rng() < 0.45 ? 1 : 0),
    scarecrow: rng() < 0.65,
    barrel: rng() < 0.55,
    crates: rng() < 0.45 ? 1 + (rng() * 3 | 0) : 0,
  };
}
```

The plan then compiles through a tiny material-slot writer (`quad` / `box` / `cyl` / `blob` primitives appending into one buffer per material name) — one merged `BufferGeometry` per slot, ≈8 draw calls per plot instead of hundreds of meshes. Geometry and shader also *agree about where things grow*: crop rows are planted on the furrow crest lines of the tilled surface, `crest z = (k + 0.25) / SURFACE_SCALE` in region-local coordinates.

### 2. `groundHeightAt` seats every part on the real terrain

The fence is the reference user of multi-point seating. Posts root at their *own* ground height, rails slope between post tops, gate pickets hang down to their own ground point:

```js
const post = (x, z, tall) => {
  const base = gy(x, z);
  const h = (tall ? 1.28 : 1.08) + rng() * 0.08;
  ...
  // Buried 1.0 below its OWN ground height — a dip between height
  // samples can never open a gap under a post.
  W.box('wood', [0.14, h + 1.0, 0.14], [x, base + (h - 1.0) / 2, z],
    [leanDir, lean, 0], 1.1);
  ...
};
```

```js
// Two rails per bay, sloping between each post pair's ground heights.
for (let i = 0; i + 1 < run.length; i++) {
  const u0 = run[i], u1 = run[i + 1];
  const y0 = groundAt(u0), y1 = groundAt(u1);
  const roll = rollSign * Math.atan2(y1 - y0, u1 - u0);
  ...
}
```

Without this, a multi-point structure floats on the spawn-centre plane the moment the ground rolls half a unit.

### 3. The pure stage machine

The persisted record is tiny — `{ st, t }` per plot, keyed by `spawn.seed` — and the current stage is **derived from the timestamp at read time**, so no server clock or scheduled job is needed:

```js
function plotStage(v, now) {
  if (!v || typeof v !== 'object' || !v.st || typeof v.t !== 'number') return 'ripe';
  const age = now - v.t;
  if (v.st === 'picked') {
    if (age < REGROW_MS) return 'stubble';
    if (age < REGROW_MS + WITHER_MS) return 'sprout';
    return 'dead';
  }
  if (v.st === 'cleared') return age < WITHER_MS ? 'sprout' : 'dead';
  if (v.st === 'watered') return age < GROW_MS ? 'growing' : 'ripe';
  return 'ripe';
}
```

The one interaction is contextual by stage (`PROMPTS` + `NEXT_ON_INTERACT` tables): harvest ripe → water sprouts → clear dead; growing/stubble show a status and do nothing. Records expire server-side after 24h, so untended farms reset to the deterministic default (ripe).

Crops live in their **own subgroup with a dedicated `alea(seed + '-crops')` rng**, so a stage rebuild is deterministic and never perturbs the fence/prop layout. The rebuild hides the old subgroup immediately and disposes its geometry one frame later (never free a GPU buffer that might still be in this frame's render pass), then re-freezes the new subtree's matrices.

### 4. The soil tells the story too

Per-stage soil tinting reuses `addTerrainRegion` under the same id — the registry is keyed by id, so re-adding updates the tint in place with no remove/add churn:

```js
const SOIL_TINT = {
  growing: [0.55, 0.54, 0.60],   // wet-dark while watered crops grow
  dead: [1.16, 1.08, 0.92],      // ashen when they die
  sprout: [1.06, 1.02, 0.96],
};

const applySoilTint = (entry, stage) => {
  ...
  XRPublisher.addTerrainRegion(Object.assign({}, r, { tint }));
};
```

### 5. The `ensureTicker` pattern

Time-derived transitions (growing→ripe, stubble→sprout, sprout→dead) tick once a second — **not** via `spec.update`, which would make every farm a per-frame dynamic object for something that changes once a minute. The ticker exists only while plots are mounted:

```js
let tickerId = null;
const ensureTicker = () => {
  if (tickerId !== null || livePlots.size === 0) return;
  tickerId = setInterval(() => {
    if (livePlots.size === 0) { clearInterval(tickerId); tickerId = null; return; }
    for (const [seed, entry] of livePlots) {
      const st = deriveStage(seed);
      if (st !== entry.stage) rebuildCrops(entry, st);
    }
  }, 1000);
};
```

It starts with the first live plot and dissolves itself when the player leaves farm country — zero idle work far from any farm. Any recurring plugin timer should follow this shape.

## Key techniques and gotchas

- **State checks are mount-gated**: `fetchWorldState({ prefix, maxAgeMs })` runs only in `create()` — a chunk that actually contains a plot. The core coalesces concurrent identical fetches, so N plots per chunk cost one HTTP request and remounts inside the window cost none. The plugin predates `spawn.chunkPrefix` and derives the prefix itself (`chunkPrefixOf`, stripping the **two** trailing grid coords); new plugins should read [`spawn.chunkPrefix`](21-decoration-spawn-context.md) instead of slicing the seed.
- **Coordinates come from `spawn.renderPosition`**: render-frame world XZ for every anchor type — the frame terrain regions and `setWorldState` positions live in — so region centers and state `pos` use it directly, no correction. (The legacy `spawn.worldPosition` was worker-frame and needed a −½-chunk shift; treat it as deprecated.)
- **`interactionRadius: 24`** reaches the plot from the fence line while staying comfortably inside the server's ~32u writer-distance rule.
- **Shared truth vs. personal loot**: the plot's shared record only says it was *picked* — what *you* carried away lives in your localStorage inventory. Harvest adds `entry.plan.crop` to the 🧺 HUD (icon + label per crop slug).
- **Optimistic apply**: `setWorldState` applies locally first and fires `subscribeWorldState`, so the plot rebuilds this frame; peers and the API converge behind it. Your own write and a peer's write take the identical path.
- **Graceful degradation**: no world-state API → the farm registers the old static spec (always-ripe crops); no HUD API → harvesting still works, silently.
- **`spec.__test`** exports the pure stage machine (`plotStage`, `PROMPTS`, `NEXT_ON_INTERACT`, `chunkPrefixOf`) so a harness can drive the lifecycle table without a world.

## Try it

Deploy: copy into the api `plugins/` directory, `npm run upload-build <build-file>`. For local browsing, `examples/decorations/biome-surfaces/index.html` loads this plugin file directly (plots spawn in the `plains` biome — roam flat open ground).

Suggested modifications:

1. **Add a fifth crop** — extend `CROP_META`, the crop pick in `makePlan`, spacing/geometry branches in `buildCrops`. Note which existing farms change crop (the pick draw's *range* changed) — and why the fence layout still doesn't move.
2. **Shorten the lifecycle for testing** — drop `REGROW_MS`/`WITHER_MS`/`GROW_MS` to a few seconds and walk one plot through the whole table; watch the soil tint follow.

## Next steps

- [World state](41-world-state.md) — TTLs, writer-distance, freshness windows, merge rules.
- [Campfires](60-example-campfires.md) — the same machinery at minimal scale (one boolean).
- [Town Center](62-example-town-center.md) — the material-slot writer and collider baking at full architectural scale.
- [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md) — authoring TSL surfaces and the WebGL fallback story.
