# `<three-environment-block>`

The root container for a 3D world. The runtime scans the page for environment blocks on load and renders each one into a full interactive scene — canvas, physics, player controller, and every child block. All other `three-*-block` elements must be nested inside an environment block to be picked up.

The environment block can optionally carry a **world model** (`threeobjecturl`) — a GLB/GLTF scene that becomes the collidable world geometry — plus scene-wide settings like an HDR environment map and background color. Worlds built entirely from procedural terrain and child blocks can omit the world model.

---

## Usage

```html
<three-environment-block
    devicetarget="2d"
    threeobjecturl="path/to/world.glb"
    scale="1"
    positiony="-1"
    rotationy="0"
    camcollisions="true"
    bg_color="#1a1a2e"
    threepreviewimage="path/to/preview.jpg"
    hdr="path/to/environment.hdr">

    <!-- Child blocks go here -->
    <three-spawn-point-block positionx="0" positiony="1" positionz="5"></three-spawn-point-block>
    <three-light-block type="ambient" intensity="0.6"></three-light-block>

</three-environment-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | — | URL of the main world model (GLB/GLTF). Loaded as collidable world geometry. Optional — omit it for procedural-terrain worlds. |
| `devicetarget` | `"2d"` \| `"vr"` \| `"ar"` | `"2D"` | Target device hint. Absent behaves as `"2D"`. |
| `scale` | number | `1` | Uniform scale applied to the world model. |
| `positiony` | number | `0` | Vertical offset of the world model. |
| `rotationy` | number | `0` | World model rotation around Y (radians). |
| `animations` | string | — | Comma-separated animation clip names to play on the world model. |
| `camcollisions` | string | `"true"` | Camera collisions are **on** unless the value is the literal string `"false"` or `"0"`. |
| `backgroundcolor` / `bg_color` | string | `"#ffffff00"` | Scene background color (hex, alpha supported). **Both spellings are read** — first non-empty wins. |
| `threepreviewimage` / `previewimage` | string | — | Image shown by the loading overlay while the world loads. **Both spellings are read** — first non-empty wins. |
| `hdr` | string | — | URL of an HDR environment map, used for image-based lighting and as the visible background. |
| `haszoom` | `"0"` \| `"1"` | `"0"` | Enable zoom controls. |
| `hastip` | `"0"` \| `"1"` | `"1"` | Show the interaction tip. On unless the value is `"0"`. |
| `zoom` | number | `90` | Camera FOV. Read here for parity with the single-object viewer, but the **world camera in an environment block is fixed** — this attribute doesn't change the view. |

> **Note:** `positionx`/`positionz` are accepted on the environment block (the schema lists them) but are **not read** — only `positiony`, `rotationy`, and `scale` are applied to the world model. Offset your content with the child blocks' own positions instead.

---

## Notable behaviors

- **Scanning is child-scoped.** Only `three-*-block` elements inside the environment block are rendered. Unknown `three-*-block` tags are captured as plugin [custom blocks](27-custom-blocks.md) and render once (and if) their plugin registers the type.
- **Default terrain synthesis.** If the environment has no `threeobjecturl`, no `<three-terrain-block>` child, and no collidable model block, the runtime creates a default gray terrain so the player doesn't fall through the world. See [Blocks Overview](03-blocks-overview.md#the-default-terrain-never-fall-forever).
- **Default lighting.** Worlds without a procedural terrain block get a built-in light rig (ambient + directional with shadows). Worlds **with** a terrain block hand directional lighting and shadows to the terrain's procedural sun, keeping only a soft ambient fill — so don't be surprised if adding a terrain block changes the lighting character.
- **Loading overlay.** While the world model, avatar, and terrain load, an overlay (showing `threepreviewimage` if set) covers the canvas and dismisses when the scene is ready.
- **Renderer selection.** The world renders with WebGPU by default and falls back to WebGL (or can be forced with the `?renderer=webgl` query parameter). This is page-level, not an attribute.

---

## Next steps

- Place the player: [Spawn Point Block](17-spawn-point-block.md)
- Add ground: [Terrain Block](15-terrain-block.md)
- Add content: [Model Block](05-model-block.md)
- Make it multiplayer: [Networking Block](16-networking-block.md)
