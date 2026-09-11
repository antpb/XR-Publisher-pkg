// ─────────────────────────────────────────────────────────────────────────
// Plugin identity — the ONE place you set your plugin's name.
// ─────────────────────────────────────────────────────────────────────────
//
// PLUGIN_SLUG is load-bearing:
//   • the build writes  dist/<PLUGIN_SLUG>-xr-publisher-plugin.umd.js
//     (the exact filename the API's upload-build scanner looks for —
//      `*-xr-publisher-plugin.umd.js`, flat in the plugins/ dir).
//   • it is injected into the bundle as `PLUGIN_SLUG` (see build.mjs `define`),
//     so your source can log/namespace with it without repeating the string.
//   • for CUSTOM BLOCK plugins (XRPublisher.registerBlockType) the block
//     `plugin:` field MUST equal this slug — the server strips saved blocks
//     whose plugin is not in the active set. Keep them identical.
//
// Rules: lowercase, digits, single dashes — /^[a-z0-9]+(-[a-z0-9]+)*$/.
export const PLUGIN_SLUG = 'my-plugin';

// Shown as a header comment at the top of the built file. Optional.
export const BANNER = `/*! ${PLUGIN_SLUG} — an XR Publisher plugin. Built from plugin-scaffold. */`;
