# `<three-portal-block>`

A teleportation point. Portals work in two modes: **URL navigation** (walking into the portal navigates the browser to another page/world) or **in-world teleport** (the player is instantly moved to coordinates inside the same world). An optional label floats above the portal.

[SCREENSHOT: A glowing portal model with a floating label, player avatar approaching]

---

## Usage

```html
<!-- Navigate to another world (URL) -->
<three-portal-block
    threeobjecturl="path/to/portal.glb"
    destinationurl="https://example.com/gallery"
    label="Visit Gallery"
    labeltextcolor="#00ff88"
    positionx="5" positiony="0" positionz="0"
    scalex="1" scaley="2" scalez="1">
</three-portal-block>

<!-- In-world teleport to coordinates -->
<three-portal-block
    threeobjecturl="path/to/portal.glb"
    label="Go to Rooftop"
    useteleportdestination="true"
    teleportdestinationx="0"
    teleportdestinationy="20"
    teleportdestinationz="0"
    positionx="-5" positiony="0" positionz="0">
</three-portal-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | — | Portal model URL (GLB/GLTF). |
| `destinationurl` | string | **required*** | URL to navigate to on activation. Relative URLs resolve against the current page. |
| `label` | string | — | Text shown above the portal. |
| `labeloffsetx/y/z` | number | `0` | Label position offset. |
| `labeltextcolor` | string | `"#ffffff"` | Label color (hex). |
| `useteleportdestination` | `"true"` \| `"false"` | `"false"` | `"true"` switches to in-world teleport mode. |
| `teleportdestinationx/y/z` | number | — | Target coordinates for in-world teleport. All three must be set. |
| `animations` | string | — | Comma-separated animation names to play on the portal model. |
| `positionx/y/z` | number | `0` | World position. |
| `rotationx/y/z` | number | `0` | Rotation (radians). |
| `scalex/y/z` | number | `1` | Scale per axis. |

*Required for URL mode; in teleport mode (`useteleportdestination="true"` + all three coordinates) it is unused.

---

## In-world teleport vs. URL navigation

- **In-world teleport** fires when `useteleportdestination="true"` **and** all of `teleportdestinationx/y/z` are present. The player snaps to those coordinates (and settles onto the ground there) with no page load — instant, and multiplayer session/room state is preserved.
- **URL navigation** is the fallback: walking into the portal sets `window.location.href` to `destinationurl`. This is a full page navigation — use it to link between published worlds or out to any web page.
- `matrix:` URIs are recognized and rewritten to their Third Room world URL.

---

## Notable behaviors

- **Activation is collision-based**: the portal's model gets a fixed collider, and touching it activates the portal — there is no confirm prompt. Place portals where walking in is an intentional act (avoid putting them across a narrow required path).
- **The label billboards** toward the camera and floats near the portal position.
- Plugins can trigger the same teleport behavior from code with `XRPublisher.teleportPlayer(x, y?, z)` — see [Terrain Queries](31-terrain-queries.md).

---

## Next steps

- Set where players arrive: [Spawn Point Block](17-spawn-point-block.md)
- Teleporting from plugin code: [Terrain Queries](31-terrain-queries.md)
- Linking multiplayer worlds: [Networking Block](16-networking-block.md)
