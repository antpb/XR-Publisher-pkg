# XR Publisher — Plugin Scaffold

A starting point for building an **XR Publisher world plugin** with a modern
toolchain. Write TypeScript (or JS), `npm install` any packages you need, and
run one command to produce the single minified `.umd.js` file you drop into
your instance's `plugins/` directory.

> **Use it:** copy this whole folder anywhere, rename it, and start editing
> `src/plugin.ts`. It has no dependency on the surrounding repo except the dev
> harness's runtime path (see [Test it locally](#test-it-locally)).

## What a plugin is

A plugin is a self-contained script your world loads at runtime. It reaches the
engine through two globals the runtime exposes — `window.XRPublisher` (the API)
and `window.THREE` (the engine's own three) — and registers **decorations**
(procedurally scattered objects), **custom blocks** (editor-placeable), HUD,
dialogs, menu items, and more. The build here bundles your source into the exact
`*-xr-publisher-plugin.umd.js` form the API's uploader expects.

**Never bundle your own copy of three** — it doubles payload and breaks
`instanceof`. This scaffold enforces that: `three` always resolves to the
runtime's `window.THREE` (see [Using three](#using-three)).

## Quick start

```bash
npm install          # one time
npm run build        # → dist/<slug>-xr-publisher-plugin.umd.js  (minified, ship this)
```

Then edit **`src/plugin.ts`** and rebuild. That's the only file you normally
touch. To rename the plugin, set `PLUGIN_SLUG` in **`plugin.config.mjs`** — the
output filename and the injected `PLUGIN_SLUG` constant follow it.

### Scripts

| Command | What it does |
|---|---|
| `npm run build` | One-shot **minified** production build → `dist/`. This is the file you deploy. |
| `npm run watch` | Rebuild on every save, **unminified** (for the dev harness / debugging). |
| `npm run typecheck` | `tsc --noEmit` — type-check without emitting. |
| `npm run clean` | Remove `dist/`. |

## Project layout

```
plugin-scaffold/
  plugin.config.mjs        ← set PLUGIN_SLUG here (drives the output filename)
  build.mjs                ← esbuild config (bundle → minified IIFE; three externalized)
  tsconfig.json
  dev.html                 ← local test world that loads your built plugin
  src/
    index.ts               ← entry: waits for the runtime, calls registerPlugin (rarely edited)
    plugin.ts              ← ★ YOUR CODE — the example decoration lives here
    runtime.ts             ← whenRuntimeReady() + the PluginRuntime type
    types/
      xr-publisher.d.ts     ← curated types for window.XRPublisher / window.THREE
```

## Writing your plugin

`src/plugin.ts` exports one function, called once after the runtime is ready:

```ts
import type { PluginRuntime } from './runtime';

export function registerPlugin({ XRPublisher, THREE }: PluginRuntime): void {
  XRPublisher.registerDecoration({
    name: 'my-thing',
    density: 0.4,
    create(spawn) {
      // spawn.rng is a seeded PRNG — use it (never Math.random) for anything
      // that must look the same on every visit and every device.
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1),
        new THREE.MeshStandardMaterial({ color: 0x88ccff }),
      );
      mesh.position.y = 1;
      return mesh; // the engine applies the world position
    },
  });
}
```

The shipped example in `src/plugin.ts` registers seed-stable crystal clusters
and is heavily commented. Delete it and build your own.

**Where the full API lives:** `src/types/xr-publisher.d.ts` is a curated
summary for autocomplete. The exhaustive, authoritative reference is the runtime
source your world bundles — `src/decorations/decorationRegistry.ts` (every
decoration field), `src/blocks/customBlockRegistry.ts` (custom blocks), and the
package `CLAUDE.md`. The `../plugins/` folder next to this scaffold has ~20
worked examples (interactables, HUD, dialogs, world-state, post-processing,
custom terrain surfaces, editor blocks) — copy patterns from the one nearest to
what you want.

## Using three

The recommended, always-safe pattern is to read `THREE` off the runtime object:

```ts
export function registerPlugin({ THREE }: PluginRuntime) { /* use THREE here */ }
```

You *may* also `import`:

```ts
import { Group, Mesh } from 'three';   // resolves to window.THREE at runtime, not bundled
```

The build aliases `three` to the runtime's copy, so imports don't ship a second
three and named imports resolve lazily (load-order-safe). `import * as THREE`
resolves at module-eval, so if your script can run *before* the runtime, prefer
the runtime object.

Other npm packages you install (noise libs, color utils, etc.) **are** bundled
into your plugin normally — that's the point of the modern toolchain.

## Test it locally

1. `npm run watch` (leave running — rebuilds `dist/` unminified on save).
2. Serve the **`examples/` folder** (this scaffold's parent) with any static
   server and open the harness:
   ```bash
   cd ..                # packages/xr-publisher/examples
   npx serve .
   # open http://localhost:3000/plugin-scaffold/dev.html
   ```
   `dev.html` renders a procedural-terrain world and loads your built plugin
   over it. Add `?renderer=webgl` to test the WebGL path.

`dev.html` loads the runtime from `../index_files/xr-publisher.umd.js`. If you
copied this scaffold out of the repo, edit that `<script src>` to point at your
instance's `xr-publisher.umd.js` (and update the plugin `<script src>` if you
changed `PLUGIN_SLUG`).

## Deploy

The build output is the deliverable. Drop it **flat** into your API project's
`plugins/` directory (no subfolders, no manifest — the uploader scans for
`*-xr-publisher-plugin.umd.js` files directly in `plugins/`):

```bash
cp dist/my-plugin-xr-publisher-plugin.umd.js /path/to/api/plugins/
# then, from the api project:
npm run upload-build dist/xr-publisher.umd.js   # plugins ride along automatically
```

See `../plugins/README.md` for the full deploy story (the flat-file rule, how
`set-active` works, removing a plugin).

### Custom block plugins

If you register editor-placeable blocks with `XRPublisher.registerBlockType`,
the block's `plugin:` field **must equal `PLUGIN_SLUG`** — the server strips
saved blocks whose plugin isn't active. Keep them identical.
