# Plugin Decoration Examples

Each folder here is a **self-contained, single-feature** reference for the
plugin decoration API (`XRPublisher.registerDecoration`). Open any one with
the package dev server:

```bash
npm run dev
# then visit e.g. /decorations/surface-targeting/
```

Add `?renderer=webgl` to any URL to verify the WebGL twin (placement and
dirt patches match the WebGPU default).

Every example loads the runtime from `/index_files/xr-publisher.umd.js`
(the dev server roots at `examples/`, so the absolute path works from any
subfolder) and exposes `window.XRPublisher` + `window.THREE`.

| Folder | Demonstrates |
|--------|--------------|
| [`minimal/`](minimal/) | The smallest possible decoration — one mesh, one shared material. |
| [`surface-targeting/`](surface-targeting/) | `surface:` — place only on grass / dirt / rock / sand / snow. |
| [`grass-near-water/`](grass-near-water/) | `surface` + `maxWaterDistance` — a band hugging the shoreline. |
| [`in-water-creatures/`](in-water-creatures/) | glTF fish (`XRPublisher.loadModel`) submerged + lily pads at the surface (`waterPlacement`). |
| [`on-trees/`](on-trees/) | `anchor:'tree'` — hang in engine tree canopies. |
| [`at-tree-base/`](at-tree-base/) | `anchor:'tree-base'` — cluster at the trunk/terrain contact (mushrooms). |
| [`on-mountains/`](on-mountains/) | `anchor:'mountain'` — place on mountain summits (roam to find a peak). |
| [`instanced-models/`](instanced-models/) | `instanced:true` + `transform()` — thousands of objects, near-zero cost. |
| [`dynamic-animated/`](dynamic-animated/) | `update()` + `interactable` + `openDialog()` — bobbing orbs you examine via an in-world modal. |
| [`solid-buildings/`](solid-buildings/) | `collision` + slope/biome filters — solid, walkable structures. |
| [`dirt-clearing/`](dirt-clearing/) | `groundPatch` — paint a dirt circle and clear grass (campfire). |
| [`collectible-apples/`](collectible-apples/) | `interactable` + `onInteract` + `registerHud` — walk up, press E to collect, counter ticks up. |
| [`custom-menu-item/`](custom-menu-item/) | `registerMenuItem` — add rows to the HUD "More" (☰) menu, next to the engine's VR entry. |
| [`town-center/`](town-center/) | `addTerrainRegion` (cobblestone plaza surface) + `addModel` (monument + instanced pillars) — build a town from code at a flat region's centre. |

## The two rules that matter

1. **Determinism**: placement derives from the world seed + decoration name
   + chunk coords, so the same world looks identical on every visit and
   every renderer/device. Always use `spawn.rng` (never `Math.random`) for
   any per-spawn variation that should be stable.
2. **Share geometry & materials**: `create()` runs on the main thread once
   per spawn — keep it cheap. Hoist materials (and, for `instanced`,
   geometry) to module-level singletons; the engine's default cleanup
   disposes per-spawn geometry only and leaves shared resources alone.

See `examples/custom-decorations.html` for a single page combining many of
these, and `src/decorations/decorationRegistry.ts` for the full spec
reference with inline docs.
