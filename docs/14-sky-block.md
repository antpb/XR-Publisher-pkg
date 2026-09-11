# `<three-sky-block>`

Configures the sky for worlds that don't use procedural terrain — either an atmospheric-scattering sky dome with a positioned sun, or a simple textured sky sphere from an equirectangular image (`skyurl`).

> **Terrain worlds don't need this block.** A `<three-terrain-block>` brings its own procedural sky — sun, clouds, horizon colors, and the day/night cycle are configured with the terrain block's `skycolor`/`horizoncolor`/`cloud*`/`timeofday` attributes, and that sky takes precedence. Use the sky block for interior/model-based worlds. (An HDR on the [environment block](04-environment-block.md) is a third option and also supplies lighting.)

---

## Usage

```html
<!-- Atmospheric sky with a low sun -->
<three-sky-block
    distance="170000"
    rayleigh="1"
    sunpositionx="0" sunpositiony="1" sunpositionz="-10000">
</three-sky-block>

<!-- Textured sky sphere -->
<three-sky-block skyurl="path/to/sky-panorama.jpg">
</three-sky-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `skyurl` | string | — | Equirectangular sky texture. When set, a textured sphere is rendered instead of the atmospheric sky and the other attributes are ignored. |
| `distance` | number | — | Distance of the sky dome. Set explicitly (e.g. `170000`); the runtime does not fill in a default. |
| `rayleigh` | number | — | Rayleigh scattering amount (atmospheric haze near the horizon). |
| `sunpositionx` | number | — | X component of the sun direction vector. |
| `sunpositiony` | number | — | Y component (height) of the sun direction. |
| `sunpositionz` | number | — | Z component of the sun direction. |

> The schema also lists `turbidity`, `miecoefficient`, and `miedirectionalg`; the current runtime does not read them — the attributes that take effect are the ones in the table above. Set `distance` and the sun position explicitly, since unset attributes are treated as `0` (a sun at `[0,0,0]` renders an odd sky).

---

## Notable behaviors

- **Sun position is a direction, not a location** — `[0, 1, -10000]` means "toward the horizon in −Z, slightly up". Lowering `sunpositiony` toward 0 gives sunset colors.
- **The textured mode is a simple sphere** (radius 300 units) with the image mapped inside — good for stylized/painted skies. It doesn't emit light; pair it with [light blocks](13-light-block.md).
- The sky block does not create a sun *light* — add a directional [light block](13-light-block.md) that matches your sun position for consistent shading.

---

## Next steps

- Procedural sky with clouds and a day cycle: [Terrain Block](15-terrain-block.md)
- Driving world time from code: [Time of Day](38-time-of-day.md)
- Clouds from plugin code: [Clouds and Weather](32-clouds-and-weather.md)
