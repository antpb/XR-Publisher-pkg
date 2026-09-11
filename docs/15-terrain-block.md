# `<three-terrain-block>`

Generates an infinite, streaming procedural world: heightfield terrain with biomes, water, mountains with caverns, grove-clustered trees, grass, boulders, shrubs and flowers — plus a full procedural sky with clouds, a sun, and an optional day/night cycle. Everything derives deterministically from the `seed`, so the same seed produces the same world on every device and for every player.

Chunks generate in a background worker (WASM-accelerated) and stream in around the player as they roam.

[SCREENSHOT: Rolling procedural terrain with a water basin, tree groves, a mountain on the horizon, and layered clouds]

---

## Usage

```html
<three-terrain-block
    seed="my-world-seed"
    width="100" height="100" segments="100"
    scale="0.5" heightscale="50"
    positiony="-10"
    color="#4a7c59"
    roughness="0.8" metalness="0.2"
    skycolor="#87CEEB" horizoncolor="#E0F7FF"
    cloudcolor="#ffffff" clouddensity="0.5" cloudscale="1"
    cloudspeed="0.1" cloudheight="100" cloudlayers="3"
    timeofday="12" timecycleduration="0"
    renderdistance="2">
</three-terrain-block>
```

Only the first terrain block in an environment is used.

---

## Attributes

### Terrain shape

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `seed` | string | random | The world seed. **Set it explicitly** — without one, a new random seed is drawn every page load and the world changes each visit (and differs between players in a multiplayer room). |
| `width` | number | `100` | Width of each terrain chunk (world units). |
| `height` | number | `100` | Depth of each terrain chunk. |
| `segments` | number | `100` | Geometry resolution per chunk. |
| `scale` | number | `0.5` | Noise scale — larger values mean busier, smaller features. |
| `heightscale` | number | `50` | Vertical height multiplier. Also sets the water level (see below). |
| `positiony` | number | `-10` | Base Y of the terrain system. |
| `rotationx/y/z` | number | `0` | Terrain rotation (radians). |
| `noiseoctaves` | number | `6` | Noise octave count (detail layers). |
| `noisepersistence` | number | `0.5` | Amplitude falloff per octave. |
| `noiselacunarity` | number | `2` | Frequency multiplier per octave. |

### Surface material

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `color` | string | `"#4a7c59"` | Base terrain color (hex). Biome coloring (sand, grass, rock, snow bands) layers on top. |
| `roughness` | number | `0.8` | Material roughness 0–1. |
| `metalness` | number | `0.2` | Material metalness 0–1. |

### Sky and clouds

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `skycolor` | string | `"#87CEEB"` | Sky color at the zenith. |
| `horizoncolor` | string | `"#E0F7FF"` | Sky color at the horizon. |
| `cloudcolor` | string | `"#ffffff"` | Cloud color. |
| `clouddensity` | number | `0.5` | Cloud coverage 0–1. |
| `cloudscale` | number | `1` | Cloud pattern size. |
| `cloudspeed` | number | `0.1` | Cloud drift speed. |
| `cloudheight` | number | `100` | Cloud layer altitude. |
| `cloudlayers` | number | `3` | Number of stacked cloud layers. |

### Time

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeofday` | number | `12` | Starting time in 24-hour format (0–24). Affects sun position, lighting, and sky colors — the sun is up roughly 6.5–20.5. |
| `timecycleduration` | number | `0` | Length of a full day/night cycle in seconds. `0` freezes time at `timeofday`. |

### Streaming

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `renderdistance` | number | `2` | Chunk **radius** around the player: `2` keeps a 5×5 grid loaded, `3` a 7×7. Clamped to **1–5**. |

`renderdistance` is the main view-distance / cost dial for a world. Because it's a radius, cost grows **quadratically** — going from `2` to `4` takes a world from 25 loaded chunks to 81, and every chunk carries terrain geometry, colliders, and decoration meshes. Raise it for open vistas on desktop worlds; leave it at the default (or `1`) for dense, mobile-friendly ones.

Two things adjust it automatically, on top of whatever you author:

- **Flying high above the terrain adds one extra ring**, so the ground doesn't end at the horizon when the player is looking down at it from altitude.
- **First load ramps up**: the world starts at a smaller radius and lifts to the authored one once the one-time load work (avatar, animations, shader compiles) has cleared. Same final state everywhere — it just keeps the initial memory peak down.

---

## Notable behaviors

- **Seed determinism** is the core contract: heightfield, biomes, water bodies, mountain placement, tree groves, and decoration scatter all derive from `seed`. Two players with the same seed see the identical world — which is what makes decoration-based gameplay and multiplayer coherence work.
- **Water**: the water level sits just below the terrain midline (derived from `heightscale` and `positiony`). Lakes, rivers and occasional large basins form wherever terrain dips below it, with shore-aware waves and beach wash. Players can swim; boats float on it.
- **Mountains** spawn in some regions, generated as walkable sculpted meshes with cavern systems; peaks and cavern floors are climbable/enterable.
- **Decorations** (grass, trees, boulders, shrubs, flowers) scatter automatically by biome and stream with the chunks. Plugins add their own scatter types — see [Decorations Overview](19-decorations-overview.md).
- **Day/night**: with `timecycleduration > 0`, the sun sweeps the sky and every world surface darkens in lockstep at night. World time is room-synced in multiplayer and controllable from plugins — see [Time of Day](38-time-of-day.md).
- **Colliders stream too**: terrain collision follows the player and is skipped while flying high above the ground, re-enabling on approach so there is always ground to land on.
- **The terrain brings the sun**: directional lighting and shadows come from the terrain's procedural sky; see the note on [Light Block](13-light-block.md).
- **NPCs and spawn points** interact with terrain: NPC navmeshes exclude water, and the [spawn point](17-spawn-point-block.md) Y is treated as a minimum above the ground.

---

## Next steps

- Scatter your own objects on the terrain: [Decorations Overview](19-decorations-overview.md)
- Sample ground height / teleport from code: [Terrain Queries](31-terrain-queries.md)
- Replace the surface in regions (plazas, paths): [Terrain Regions and Surfaces](29-terrain-regions-and-surfaces.md), [Paths and Roads](30-paths-and-roads.md)
- Control the clock: [Time of Day](38-time-of-day.md)
