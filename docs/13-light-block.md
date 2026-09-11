# `<three-light-block>`

Adds a light source to the world. Four light types are supported: `ambient` (uniform fill), `directional` (sun-like parallel light), `point` (omnidirectional bulb), and `spot` (cone).

---

## Usage

```html
<!-- Soft fill -->
<three-light-block type="ambient" intensity="0.4" color="#ffffff">
</three-light-block>

<!-- Directional (sun-like) -->
<three-light-block
    type="directional"
    color="#ffffff"
    intensity="1.5"
    positionx="30" positiony="40" positionz="20">
</three-light-block>

<!-- Point light -->
<three-light-block
    type="point"
    color="#ff6600"
    intensity="2"
    distance="10"
    decay="2"
    positionx="0" positiony="3" positionz="0">
</three-light-block>

<!-- Spotlight aimed downward -->
<three-light-block
    type="spot"
    color="#ffffff"
    intensity="2"
    angle="0.5"
    penumbra="0.5"
    positionx="0" positiony="5" positionz="0"
    rotationx="-90">
</three-light-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `"ambient"` | `"ambient"`, `"directional"`, `"point"`, or `"spot"`. |
| `color` | string | `"#ffffff"` | Light color (hex). |
| `intensity` | number | `1` | Brightness. |
| `distance` | number | `0` | Range for `point`/`spot` (0 = infinite). |
| `decay` | number | `2` | Falloff rate for `point`/`spot`. |
| `angle` | number | `0.524` | Spotlight cone angle in **radians** (`spot` only). |
| `penumbra` | number | `0` | Spotlight edge softness 0–1 (`spot` only). |
| `positionx/y/z` | number | `0` | Light position (ignored by `ambient`). |
| `rotationx/y/z` | number | `0` | Light rotation in **degrees** (`directional`/`spot`). |

> **Rotation unit:** light block rotations are authored in **degrees** — the runtime converts them to radians internally. (`angle`, however, stays in radians.)

### Shadows

`castshadow="1"` makes a `directional`, `spot`, or `point` light cast shadows (`ambient` has no direction and ignores it). The `shadow*` attributes tune the shadow map; every one of them is optional, and anything you leave off takes the default below.

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `castshadow` | `"0"` \| `"1"` | `"0"` | Turn shadow casting on for this light. `"true"` is accepted as well as `"1"`. |
| `shadowmapsize` | number | `1024` | Shadow map resolution (used for both width and height). Higher = sharper and more expensive. |
| `shadowradius` | number | `4` | Shadow edge softness. |
| `shadowblursamples` | number | `8` | Blur sample count for the soft edge. |
| `shadowbias` | number | `-0.0005` | Depth bias — nudge it if you see shadow acne or peter-panning. |
| `shadownormalbias` | number | `0.02` | Normal-offset bias, the gentler fix for acne on curved surfaces. |
| `shadowcameranear` | number | `0.5` | Near plane of the shadow camera. |
| `shadowcamerafar` | number | `500` | Far plane of the shadow camera. |
| `shadowcameraleft/right/top/bottom` | number | `-50` / `50` / `50` / `-50` | Orthographic shadow-camera bounds (`directional` only). Tighten these around the area that actually needs shadows — a smaller box spends the same map resolution on less ground, so shadows get sharper for free. |

```html
<!-- An authored sun for a world with no terrain block -->
<three-light-block
    type="directional"
    intensity="1.4"
    positionx="30" positiony="40" positionz="20"
    castshadow="1"
    shadowmapsize="2048"
    shadowcameraleft="-30" shadowcameraright="30"
    shadowcameratop="30" shadowcamerabottom="-30"
    shadowbias="-0.0004">
</three-light-block>
```

> **Cost:** every shadow-casting light adds a **shadow-map pass every frame**. Worlds with a [terrain block](15-terrain-block.md) already have a sun that owns directional lighting and shadows — adding another shadow caster there pays a second pass for a scene that's already lit. Treat authored shadows as special-case lighting (an interior, a spotlit landmark, a world with no procedural terrain), not something to switch on for every light.

---

## Notable behaviors

- **Terrain worlds bring their own sun.** When a `<three-terrain-block>` is present, the procedural sky owns the directional "sun" light, the day/night cycle, and shadows. Authored light blocks still work, but adding a second strong directional light on top of the sun will overexpose the scene (and a second shadow caster doubles the shadow work) — prefer unshadowed accent `point`/`spot` lights in terrain worlds.
- **Keep the light count stable.** Adding or removing lights at runtime forces the renderer to recompile every material in the world. Declaring lights in markup (fixed for the world's lifetime) is the right pattern; dynamic lights from plugins should use pooling.
- Rotation only matters for `directional` and `spot` types; `point` and `ambient` ignore it.

---

## Next steps

- Sun, sky, and day/night in terrain worlds: [Terrain Block](15-terrain-block.md), [Time of Day](38-time-of-day.md)
- Skybox without terrain: [Sky Block](14-sky-block.md)
- Glow and bloom: [Post-Processing](37-post-processing.md)
