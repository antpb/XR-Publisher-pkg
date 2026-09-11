// ─────────────────────────────────────────────────────────────────────────
// Build script — bundles src/ into a single minified UMD/IIFE plugin file.
// ─────────────────────────────────────────────────────────────────────────
//
//   node build.mjs            → one-shot minified production build → dist/
//   node build.mjs --watch    → rebuild on change, UNminified (for dev.html)
//
// (You normally invoke these through `npm run build` / `npm run watch`.)
//
// Output: dist/<PLUGIN_SLUG>-xr-publisher-plugin.umd.js — a self-executing
// IIFE. Everything you `import` from npm is bundled in; `three` is the ONE
// exception — it resolves to the runtime's own `window.THREE` (never ship a
// second copy of three: it doubles payload and breaks `instanceof`).

import * as esbuild from 'esbuild';
import { PLUGIN_SLUG, BANNER } from './plugin.config.mjs';

const watch = process.argv.includes('--watch');
const outfile = `dist/${PLUGIN_SLUG}-xr-publisher-plugin.umd.js`;

// Resolve every `import ... from 'three'` to the runtime's window.THREE.
// Lazy Proxy: named imports (`import { Group } from 'three'`) resolve at USE
// time, so they're safe no matter when the plugin script evaluates relative
// to the runtime. The recommended pattern is still to read THREE off the
// runtime object (see src/runtime.ts) — this alias is a convenience for the
// `import`-style you may prefer, and keeps three OUT of your bundle.
const threeGlobalPlugin = {
  name: 'three-global',
  setup(build) {
    build.onResolve({ filter: /^three$/ }, () => ({ path: 'three', namespace: 'three-global' }));
    build.onLoad({ filter: /.*/, namespace: 'three-global' }, () => ({
      loader: 'js',
      contents: `
        const resolve = () => (typeof window !== 'undefined' && window.THREE) || {};
        module.exports = new Proxy({}, {
          get: (_t, p) => resolve()[p],
          has: (_t, p) => p in resolve(),
          ownKeys: () => Reflect.ownKeys(resolve()),
          getOwnPropertyDescriptor: (_t, p) => {
            const d = Object.getOwnPropertyDescriptor(resolve(), p);
            return d ? { ...d, configurable: true } : undefined;
          },
        });
      `,
    }));
  },
};

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',            // self-executing — runs on load, exports nothing
  target: 'es2020',
  platform: 'browser',
  minify: !watch,            // readable in dev, minified for the shipped file
  sourcemap: watch ? 'inline' : false,
  banner: { js: BANNER },
  legalComments: 'none',
  define: {
    // Injected string literal — src/ reads PLUGIN_SLUG without re-declaring it.
    PLUGIN_SLUG: JSON.stringify(PLUGIN_SLUG),
  },
  plugins: [threeGlobalPlugin],
  outfile,
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log(`[build] watching src/ → ${outfile} (unminified). Ctrl-C to stop.`);
} else {
  await esbuild.build(options);
  console.log(`[build] wrote ${outfile}`);
}
