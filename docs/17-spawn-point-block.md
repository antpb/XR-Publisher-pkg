# `<three-spawn-point-block>`

Defines where players enter the world. Without one, players spawn at the world origin (dropped from a few units up so they settle onto the ground).

---

## Usage

```html
<three-spawn-point-block positionx="0" positiony="1" positionz="5">
</three-spawn-point-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `positionx` | number | `0` | Spawn X coordinate. |
| `positiony` | number | `0` | Spawn Y coordinate — treated as a **minimum** (see below). |
| `positionz` | number | `0` | Spawn Z coordinate. |

---

## Notable behaviors

- **Y is a floor, not an absolute.** On worlds with terrain, the engine samples the ground height at the spawn X/Z and places the player at whichever is higher: your authored Y, or the terrain surface plus a safe clearance. A too-low `positiony` never spawns the player underground — but an intentionally high Y (a rooftop or platform) is respected.
- **One spawn point per page.** The runtime uses the first `<three-spawn-point-block>` it finds in the document. Multiple spawn points are not randomized.
- **No block, safe default.** Without a spawn point the player enters at `[0, 5, 0]` and settles onto whatever ground is there (the [default terrain](03-blocks-overview.md#the-default-terrain-never-fall-forever) if nothing else is collidable).
- **Portals can move players later** — see [Portal Block](12-portal-block.md) for in-world teleports, or `XRPublisher.teleportPlayer()` from plugin code.

---

## Next steps

- Ground to spawn onto: [Terrain Block](15-terrain-block.md)
- Moving players around: [Portal Block](12-portal-block.md)
- The world container: [Environment Block](04-environment-block.md)
