# Blocks Overview

XR Publisher worlds are plain HTML. A world is described by custom HTML elements — "blocks" — that the runtime scans for on page load and renders into a live 3D scene. There is no build step and no required JavaScript of your own: put the script on the page, write block markup in the body, and the library does the rest.

```html
<script src="https://unpkg.com/@antpb/xr-publisher/dist/xr-publisher.umd.js"></script>

<three-environment-block devicetarget="2d">
    <three-spawn-point-block positionx="0" positiony="1" positionz="5"></three-spawn-point-block>
    <three-terrain-block seed="my-world" heightscale="50"></three-terrain-block>
    <three-model-block threeobjecturl="statue.glb" positionz="-8" collidable="1"></three-model-block>
</three-environment-block>
```

On `window.load` the runtime finds every `<three-environment-block>`, scans its children for the supported block types, and mounts a React Three Fiber scene in its place — complete with a player controller, physics, and (optionally) multiplayer.

[SCREENSHOT: A published world rendered from the HTML above — terrain, sky, and a model, with the player avatar standing at the spawn point]

---

## Block categories

| Category | Blocks | Purpose |
|----------|--------|---------|
| **Core** | [`three-environment-block`](04-environment-block.md) | The world container — every other block lives inside it |
| **Objects** | [`three-model-block`](05-model-block.md), [`three-text-block`](06-text-block.md) | 3D content |
| **Media** | [`three-audio-block`](08-audio-block.md), [`three-video-block`](09-video-block.md), [`three-image-block`](07-image-block.md) | Sound, video, and image planes |
| **Interactive** | [`three-npc-block`](10-npc-block.md), [`three-rideable-block`](11-rideable-block.md), [`three-portal-block`](12-portal-block.md) | Things the player talks to, rides, and travels through |
| **Environment** | [`three-light-block`](13-light-block.md), [`three-sky-block`](14-sky-block.md), [`three-terrain-block`](15-terrain-block.md) | Atmosphere and ground |
| **System** | [`three-networking-block`](16-networking-block.md), [`three-spawn-point-block`](17-spawn-point-block.md) | Multiplayer and player placement |

Plugins can also register their own editor-placeable block types (`<three-{plugin}-{name}-block>`) — see [Custom Blocks](27-custom-blocks.md).

---

## The environment block is the container

`<three-environment-block>` is the root. The runtime only scans for other blocks **inside** an environment block — a `<three-model-block>` sitting outside one is ignored. One environment block per world page is the normal setup.

The environment block itself can carry a world model (`threeobjecturl`), an HDR environment map, a background color, and camera settings. See [Environment Block](04-environment-block.md).

---

## Attribute conventions

All block configuration is HTML attributes. A few conventions apply everywhere:

- **Write attributes in lowercase.** HTML lowercases attribute names when parsing, so `positionX` and `positionx` are the same attribute — the docs and schemas use the lowercase form throughout. (The runtime reads both spellings wherever it matters, so camelCase markup still works; lowercase is the canonical form.)
- **Everything is a string.** Numbers are written as strings (`heightscale="50"`), and booleans are the strings `"0"` / `"1"` (e.g. `collidable="1"`, `voicechatenabled="1"`). A handful of older attributes use `"true"` / `"false"` instead — `instanced`, `transparent`, and `useteleportdestination` — and a few (like the light block's `castshadow`) accept either form. Each block page lists the exact form.
- **Rotation units vary by block.** Most blocks take rotation attributes in **radians** (environment, text, image, video, audio, NPC, portal, terrain). Three blocks take **degrees**: [`three-model-block`](05-model-block.md), [`three-light-block`](13-light-block.md), and [`three-rideable-block`](11-rideable-block.md) (`rotationy`). Each block page states its unit — check it before authoring rotations.
- **Structured data is JSON in an attribute.** Model `instances`, rideable `waypoints`, and rideable `seats` take JSON arrays. Use single quotes around the attribute so the JSON's double quotes survive: `waypoints='[[0,0,0],[10,0,5]]'`.
- **Transforms are `positionx/y/z`, `rotationx/y/z`, `scalex/y/z`.** Position is world-space units (meters, roughly), scale is a per-axis multiplier defaulting to `1`.

---

## The default terrain (never fall forever)

If an environment block contains **no** `<three-terrain-block>` and **nothing collidable** — no `threeobjecturl` on the environment, no model block with `collidable="1"` (or a collidable instance in its `instances` JSON) — the runtime synthesizes a default terrain block so the player has ground to stand on instead of falling through the world.

The synthesized terrain is a modest gray procedural ground:

| Attribute | Value |
|-----------|-------|
| `width` / `height` | `100` |
| `segments` | `32` |
| `scale` | `1` |
| `heightscale` | `10` |
| `positiony` | `0` |
| `color` | `#888888` |
| `roughness` / `metalness` | `1` / `0` |

To opt out of the default, make something collidable — add your own terrain block, give the environment a world model, or mark a model `collidable="1"`.

---

## Block pages

- [04 — Environment Block](04-environment-block.md)
- [05 — Model Block](05-model-block.md)
- [06 — Text Block](06-text-block.md)
- [07 — Image Block](07-image-block.md)
- [08 — Audio Block](08-audio-block.md)
- [09 — Video Block](09-video-block.md)
- [10 — NPC Block](10-npc-block.md)
- [11 — Rideable Block](11-rideable-block.md)
- [12 — Portal Block](12-portal-block.md)
- [13 — Light Block](13-light-block.md)
- [14 — Sky Block](14-sky-block.md)
- [15 — Terrain Block](15-terrain-block.md)
- [16 — Networking Block](16-networking-block.md)
- [17 — Spawn Point Block](17-spawn-point-block.md)

---

## Next steps

- Start with the container: [Environment Block](04-environment-block.md)
- Give the player somewhere to land: [Spawn Point Block](17-spawn-point-block.md) and [Terrain Block](15-terrain-block.md)
- Go beyond declarative HTML: [Plugin Development Overview](18-plugin-development-overview.md)
