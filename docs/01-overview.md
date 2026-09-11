# Overview

XR Publisher is a JavaScript rendering engine for immersive 3D worlds on the web. It reads declarative custom HTML elements out of the page (`<three-environment-block>`, `<three-model-block>`, `<three-terrain-block>`, …) and renders them as a live, physics-enabled, optionally multiplayer 3D world — in the browser, on mobile, and in VR headsets via WebXR.

You author a world two ways, and they compose:

1. **HTML blocks** — declarative markup for the world itself: the environment, models, lights, terrain, NPCs, portals, media, networking. See the [Blocks Overview](03-blocks-overview.md).
2. **Plugins** — a single JavaScript file that uses the `XRPublisher` API to add living content on top: deterministic terrain decorations, custom editor-placeable blocks, interactables, dialogs, HUDs, custom shaders, post-processing, multiplayer logic, and persisted state. See the [Plugin Development Overview](18-plugin-development-overview.md).

---

## Feature highlights

- **VR / WebXR** — enter VR from the in-world menu on supported headsets; controller input, hand tracking flags, and VR-aware UI are built in.
- **Multiplayer** — peer-to-peer networking with VRM avatars, animation sync, and proximity-attenuated spatial voice chat. Enabled by dropping a single [networking block](16-networking-block.md) into the world.
- **AI-powered NPCs** — VRM characters with personalities and conversational chat, placed with one [NPC block](10-npc-block.md).
- **Procedural terrain** — an infinite, seeded terrain system with biomes, mountains, caverns, water bodies, grass, trees, and weather. Deterministic: the same seed produces the same world for every visitor, on every device.
- **Physics** — Rapier-based physics for player movement, collisions, and vehicles ([rideable block](11-rideable-block.md)).
- **Modern rendering** — WebGPU by default with TSL node materials; automatic WebGL fallback (`?renderer=webgl`) for XR sessions and older browsers.
- **Plugin system** — one script file can register decorations, blocks, UI, and effects. All registries accept late registration, so plugins load in any order, any time.

---

## How a published world works

A published world is a self-contained HTML page:

```html
<script src="xr-publisher.umd.js"></script>

<three-environment-block devicetarget="vr" positiony="0">
    <three-networking-block participantlimit="8"></three-networking-block>
    <three-spawn-point-block positionx="0" positiony="1" positionz="5"></three-spawn-point-block>
    <three-terrain-block seed="my-world" heightscale="50"></three-terrain-block>
    <three-npc-block threeobjecturl="guide.vrm" name="Guide"
        defaultmessage="Welcome!"></three-npc-block>
</three-environment-block>

<!-- Optional: plugins layer living content on top -->
<script src="campfires-xr-publisher-plugin.umd.js"></script>
```

On `window.load`, the library scans the DOM for environment blocks, reads every child `three-*-block`, and renders the world with React Three Fiber. No build step is required for authoring — the markup *is* the world.

[SCREENSHOT: A published world running in the browser — procedural terrain, avatar, HUD controls in the top-left]

---

## The two renderers

XR Publisher ships both a WebGPU path (default) and a WebGL path (`?renderer=webgl`, also used for VR/XR sessions):

| | WebGPU (default) | WebGL |
|---|---|---|
| Materials | TSL node materials | Classic shader materials |
| Custom terrain surfaces | Full procedural TSL | Flat fallback color (built-in cobblestone still procedural) |
| Post-processing / bloom | Yes ([details](37-post-processing.md)) | No (emissive meshes still render bright) |
| Plugin TSL authoring | `XRPublisher.tsl` / `XRPublisher.webgpu` | Gate on `!XRPublisher.webgpu`, fall back to `window.THREE` stock materials |

Plugins that stick to standard Three.js materials work identically on both. Plugins that author custom node materials should check `XRPublisher.isWebGPU()` and provide a stock-material fallback — see [Player, Scene & Audio Access](42-player-scene-audio.md).

---

## Determinism

A core design value: **the same world looks the same for everyone**. Terrain, biomes, decoration placement, and plugin scatter all derive from the world seed through seeded PRNGs and noise. Plugin code participates by using the seeded primitives the engine hands it (`spawn.rng`, `ctx.rng`, `XRPublisher.utils.alea`) instead of `Math.random()`. This is what makes multiplayer coherent — every peer generates the identical world locally, and only dynamic state travels over the network.

---

## Next steps

- [Installation & Setup](02-installation-and-setup.md) — get the library on a page.
- [Blocks Overview](03-blocks-overview.md) — author your first world in HTML.
- [Plugin Development Overview](18-plugin-development-overview.md) — extend worlds with JavaScript.
- [Example: Minimal Mushrooms](50-example-minimal-mushrooms.md) — the smallest complete plugin, heavily commented.
