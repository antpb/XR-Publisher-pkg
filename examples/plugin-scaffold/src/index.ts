// ─────────────────────────────────────────────────────────────────────────
// Entry point — boots the plugin. You usually DON'T edit this file.
// ─────────────────────────────────────────────────────────────────────────
//
// It waits for the runtime, then hands your code a ready `PluginRuntime`.
// Put your actual world-building in src/plugin.ts (registerPlugin).

import { whenRuntimeReady } from './runtime';
import { registerPlugin } from './plugin';

// `PLUGIN_SLUG` is injected at build time (see build.mjs / plugin.config.mjs).
declare const PLUGIN_SLUG: string;

let booted = false;

async function boot() {
  if (booted) return;
  booted = true;
  try {
    const runtime = await whenRuntimeReady();
    registerPlugin(runtime);
    console.log(`[${PLUGIN_SLUG}] registered`);
  } catch (err) {
    console.error(`[${PLUGIN_SLUG}] failed to initialize:`, err);
  }
}

// Registration is idempotent-friendly, but only kick off once the DOM exists.
if (typeof document !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(boot, 100);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 100));
  }
}
