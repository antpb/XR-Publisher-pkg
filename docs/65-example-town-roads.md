# Example: Town Roads

The smallest useful world-infrastructure plugin: it flips on the engine's deterministic **town + road network**, and the terrain worker does everything else — discovering town sites, planning roads that route around water, rock and mountains, and baking a dirt road straight into each terrain chunk as it generates.

Source: `examples/plugins/town-roads-xr-publisher-plugin.umd.js`

[SCREENSHOT: a dirt road winding between two settlements, curving around a lake]

## What it demonstrates

- **[World roads](30-paths-and-roads.md)** — `XRPublisher.configureWorldRoads(config)`: one call enables the whole network
- **Engine-baked vs. plugin-drawn roads** — roads here are known up front and baked into terrain chunks at generation time (grass and trees cleared off automatically), in contrast to `addPath`, which paints polylines onto already-live terrain (see [Paths & roads](30-paths-and-roads.md))
- **Separation of concerns** — this plugin lays *infrastructure only*; town visuals (cobblestone, buildings, monuments) belong to whatever town-decoration plugin you run beside it, which can read the same deterministic town centres via `XRPublisher.getWorldTowns(bounds)` (see [Terrain queries](31-terrain-queries.md))
- The standard plugin boot pattern: wait for the runtime, feature-detect the API, configure once

## How it works

The entire plugin is a configuration object and one call. Every knob is documented inline:

```js
// ── Configure me ──────────────────────────────────────────────────────────
const ROAD = {
  enabled: true,
  townCell: 760,        // one town CANDIDATE per this-size cell (rare)
  minClearance: 95,     // a town needs a big buildable clearing
  roadWidth: 7,         // dirt road width
  superTile: 6000,      // road network planned per fixed 6km tile (cached once)
  maxEdge: 1700,        // longest road between two town centres
  cellSize: 16,         // road-planner cost-grid resolution
};
```

After the usual wait-for-runtime poll, init is a feature check plus the one call:

```js
const init = async () => {
  if (done) return;
  await waitForRuntime();
  const { XRPublisher } = window;
  if (!XRPublisher || typeof XRPublisher.configureWorldRoads !== 'function') {
    console.error(`[${PLUGIN_ID}] runtime too old (needs configureWorldRoads)`);
    return;
  }
  // Turn world roads ON. That's it — the engine bakes them into the terrain.
  XRPublisher.configureWorldRoads(ROAD);
  done = true;
};
```

Because the network is planned per fixed 6 km super-tile from the world seed, it is **deterministic**: every visitor, every session, every renderer sees the same towns connected by the same roads. Roads are never recomputed as the player moves — a chunk generates with its road segment already carved in.

## Key techniques

- **Bake, don't paint, when you know up front.** Roads baked at chunk-generation time cost nothing at runtime and automatically clear grass/trees along their course. Reach for `addPath` only for routes that depend on runtime information (e.g. connecting to a plugin-placed structure).
- **Infrastructure and visuals are separate plugins.** The header comment is explicit: this plugin places no structures and lays no plazas. A companion plugin (like [Town Center](62-example-town-center.md)) reads `XRPublisher.getWorldTowns(bounds)` to decorate the same deterministic centres — the two plugins never need to talk to each other.
- **Feature-detect, don't assume.** The runtime-too-old check means the plugin degrades to a console error instead of throwing on an older engine build.
- Note that [Resonance Stage](67-example-resonance-stage.md) uses the same API in reverse: if it finds no towns to host its venue, it calls `XRPublisher.configureWorldRoads(true)` itself as a fallback.

## Try it

Copy the file into your api `plugins/` dir and run `npm run upload-build <build-file>` (see `examples/plugins/README.md`). Roads appear as soon as chunks generate — teleport a few hundred units out to find a town.

Suggested modifications:

1. **Make towns common.** Drop `townCell` to ~400 and `minClearance` to ~60, and watch the network densify (roads stay within `maxEdge` of each other).
2. **Build the companion plugin.** Write a decoration plugin that calls `getWorldTowns` around the player and drops a signpost at each town centre — the minimal version of what town-center does.

## Next steps

- [Town Center](62-example-town-center.md) — the visuals that sit on these town centres (plaza, well, buildings, `addPath` sidewalks)
- [Settler huts](59-example-settler-huts.md) — uses `addPath` for door trails, the runtime-painted counterpart
- [Paths & roads API](30-paths-and-roads.md) · [Terrain queries](31-terrain-queries.md)
