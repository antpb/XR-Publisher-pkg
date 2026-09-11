# Installation & Setup

XR Publisher can be installed from npm for bundled apps, or dropped onto a page as a single UMD script for published worlds and plugins.

---

## Install from npm

```bash
npm install @antpb/xr-publisher
# or
pnpm add @antpb/xr-publisher
```

`react`, `react-dom` (>= 18), and `three` (>= 0.170) are peer dependencies.

```js
import { XRPublisher } from '@antpb/xr-publisher';

const publisher = new XRPublisher({
    threeObjectPlugin: '/assets/defaults/',   // base URL for runtime assets (must end with '/')
    defaultAvatar: '/assets/defaults/avatars/default.vrm',
    userData: {},                             // per-visitor data passed through to components
    // optional:
    // apiBase: 'https://your-worker.example.com', // publishing-API origin
    // postSlug: 'my-world',                  // world identifier for networking rooms
    // containedMode: false,                  // render inside a container instead of fullscreen
});

publisher.init();
```

## Script tag (UMD)

The UMD build exposes the same API as `window.XRPublisher` and **auto-initializes on `window.load`** — it scans the DOM for `<three-environment-block>` elements and renders each one. For most published worlds you need no JavaScript of your own:

```html
<script src="https://unpkg.com/@antpb/xr-publisher/dist/xr-publisher.umd.js"></script>

<three-environment-block devicetarget="vr">
    <!-- blocks -->
</three-environment-block>
```

---

## Default assets

The package is self-contained: the default avatar (VRM), animation clips (FBX), default grid environment (GLB), UI font, and textures ship in `dist/assets/defaults/`. At runtime the engine references them at the fixed path **`/assets/defaults/…`**, so serve that folder at your web root:

```bash
cp -R node_modules/@antpb/xr-publisher/dist/assets/defaults public/assets/defaults
```

To host runtime assets elsewhere, set `threeObjectPlugin` to your asset root (it must end with `/`). Individual defaults are also directly overridable (`defaultAvatar`, `userData.playerVRM`, `hmdIcon`). No external CDN is referenced by default.

---

## Configuring the API endpoint

Server-backed features — NPC chat, the in-world editor and its tokens, the asset library, [persisted world state](41-world-state.md) — talk to a publishing-API worker. The package ships with **no baked-in host**; the origin resolves in this order:

1. `apiBase` constructor option, or `XRPublisher.setApiBase(url)` at any time
2. `window.XRP_API_BASE` — set in a `<script>` before the bundle loads (the natural spot for serve templates and script-tag embeds)
3. localStorage `xr_publisher_edge_api_url`
4. **Same origin** — a published world is usually served *by* the API worker, so this zero-config case covers normal deployments

```html
<script>window.XRP_API_BASE = 'https://api.example.com';</script>
<script src="xr-publisher.umd.js"></script>
```

Purely client-side features (rendering, terrain, physics, portals, media blocks) never touch the network API. P2P multiplayer signaling is configured separately via the `signalingUrl` attribute on the [networking block](16-networking-block.md).

---

## Useful URL parameters

Append these to a world's URL when testing:

| Parameter | Effect |
|---|---|
| `?renderer=webgl` | Force the WebGL render path (default is WebGPU) |
| `?fps=N` | Override the 60fps render cap; `?fps=native` uncaps |
| `?shadows=vsm` | Softer VSM shadows (default is PCFSoft) |
| `?netdebug` | Log per-second network packet counters |

---

## Browser support

- **WebGPU**: modern Chromium browsers (Chrome/Edge 113+)
- **WebGL**: automatic fallback, and the path used for VR/XR sessions
- **WebXR**: VR headsets (Quest, Vive, etc.) — enter VR from the in-world "More" menu
- **Mobile**: touch controls with a virtual joystick

---

## Next steps

- [Blocks Overview](03-blocks-overview.md) — build your first world.
- [Plugin Development Overview](18-plugin-development-overview.md) — write and deploy a plugin.
