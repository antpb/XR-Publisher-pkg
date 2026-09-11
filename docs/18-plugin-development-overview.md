# Plugin Development Overview

A plugin is a **single self-contained JavaScript file** loaded into a world with a `<script>` tag. It talks to the engine through the global `XRPublisher` API (every method is available as a static on the class, on the instance, and on `window.XRPublisher`) and builds objects with the engine's bundled Three.js (`window.THREE`).

One plugin file can register any mix of:

| Capability | API | Docs |
|---|---|---|
| Terrain-scattered objects (deterministic) | `registerDecoration` | [19 — Decorations](19-decorations-overview.md) |
| Editor-placeable block types | `registerBlockType` | [27 — Custom Blocks](27-custom-blocks.md) |
| One-off injected models / solids | `addModel`, `addSolid` | [28 — Injected Models](28-injected-models-and-solids.md) |
| Terrain surface replacement (plazas, roads) | `addTerrainRegion`, `registerTerrainSurface`, `addPath` | [29](29-terrain-regions-and-surfaces.md), [30](30-paths-and-roads.md) |
| "Press E" interactions | `interactable` spec / `registerInteractable` | [33 — Interactables](33-interactables.md) |
| 2D HUD, 3D dialogs, menu rows | `registerHud`, `openDialog`, `registerMenuItem` | [34](34-hud-overlays.md), [35](35-in-world-dialogs.md), [36](36-menu-items.md) |
| Bloom & post-processing | `setPostProcessing` | [37 — Post-Processing](37-post-processing.md) |
| Shared world time | `setTimeOfDay` | [38 — Time of Day](38-time-of-day.md) |
| Multiplayer messaging & voice | `broadcast`, `onMessage`, voice APIs | [39](39-networking-plugins.md), [40](40-proximity-voice.md) |
| Server-persisted state | `setWorldState` et al. | [41 — World State](41-world-state.md) |
| Third-person aim / hold-to-act mechanics | `getCursorState`, DOM input, hand-bone chase | [44 — Aim, Input & Hands](44-aim-input-and-hands.md) |
| Effect particles that render correctly | opaque-emissive / additive recipes | [45 — Effects & Render Order](45-effects-and-render-order.md) |

---

## The bootstrap pattern

A plugin's `<script>` tag can execute before or after the runtime finishes loading, so every shipped plugin waits for the runtime and registers late. **All registries are designed for late registration** — decorations re-scatter live chunks, custom blocks pop in on saved worlds, menu items appear immediately.

```js
/**
 * my-plugin — XR Publisher plugin
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'my-plugin';
  let registered = false;

  // The runtime exposes window.XRPublisher + window.THREE on load. A plugin
  // script may evaluate before the runtime finishes, so poll briefly.
  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || !THREE) {
      console.error(`[${PLUGIN_ID}] runtime not available`);
      return;
    }
    registered = true;

    // ── register everything here ──
    XRPublisher.registerDecoration({ /* … */ });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 300);
})();
}
```

---

## Rules every plugin should follow

- **Use `window.THREE`**, never bundle your own copy of Three.js — a second copy breaks `instanceof` checks and doubles the payload.
- **Never `Math.random()` for placement or generation.** Use the seeded PRNG the engine hands you (`spawn.rng` in decorations, `ctx.rng` in custom blocks, or `XRPublisher.utils.alea(seed)`) so the world is identical for every visitor. See [Utilities](42-player-scene-audio.md).
- **Share materials and geometries** at module level. `create()` runs once per spawn — per-spawn materials compile and upload per object and are never freed. Shared resources also need a custom (often no-op) `dispose()` so the engine's default deep-dispose doesn't free them out from under other instances.
- **Never add or remove scene lights at runtime.** Light count changes force a whole-scene shader recompile (a visible freeze). Use emissive materials for glow — they also pick up [bloom](37-post-processing.md) for free.
- **Gate WebGPU-only work** on `XRPublisher.webgpu` / `isWebGPU()` and fall back to stock materials on WebGL.
- **Contain your costs.** `update()` ticks run every frame — use distance-LOD cadences for far-away objects (see [Shoreline Reeds](52-example-shoreline-reeds.md) for the reference pattern).

---

## Naming & file convention

Plugin files are named `{slug}-xr-publisher-plugin.umd.js`. The slug matters:

- For [custom blocks](27-custom-blocks.md), the spec's `plugin` field **must equal the filename slug** — the server allowlists saved blocks by active plugin slugs.
- For [decorations](19-decorations-overview.md), the decoration `name` is part of the placement seed — renaming a decoration relocates every instance of it in existing worlds.

---

## Deploying a plugin

Plugins deploy alongside the engine build on the publishing API:

```bash
# from your api/ project — copy plugin files FLAT into plugins/ (no subfolders):
cp my-plugin-xr-publisher-plugin.umd.js plugins/

# upload a build — plugins ride along automatically:
npm run upload-build dist/xr-publisher.umd.js
# → uploads the build, then every plugins/*-xr-publisher-plugin.umd.js,
#   then marks the list active.
```

To remove a plugin, delete its file from `plugins/` and re-run the upload. Each plugin is independent — deploy any subset.

For local development, run the package's dev server (`npm run dev`) and browse the example pages under `examples/decorations/` — each demonstrates one feature with a matching plugin.

---

## Learning path

1. **[Minimal Mushrooms](50-example-minimal-mushrooms.md)** — the smallest complete plugin. Read this first.
2. **[Decorations Overview](19-decorations-overview.md)** — the spec reference.
3. Pick the walkthrough nearest to what you're building — every example page lists what it demonstrates. The full list is in the [index](00-index.md).
4. **[Farm Plots](61-example-farm-plots.md)** and **[Resonance Stage](67-example-resonance-stage.md)** — the two flagship "everything together" plugins.

---

## Next steps

- [Decorations Overview](19-decorations-overview.md)
- [Custom Blocks](27-custom-blocks.md)
- [Example: Minimal Mushrooms](50-example-minimal-mushrooms.md)
