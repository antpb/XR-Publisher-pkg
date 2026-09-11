# `<three-image-block>`

Places a 2D image on a plane in the 3D world — for posters, paintings, signage, and photos.

---

## Usage

```html
<three-image-block
    imageurl="path/to/image.png"
    aspectwidth="16" aspectheight="9"
    positionx="0" positiony="2" positionz="-3"
    rotationx="0" rotationy="0" rotationz="0"
    scalex="2" scaley="2" scalez="1">
</three-image-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `imageurl` | string | **required** | Image URL (PNG, JPG, WebP). |
| `aspectwidth` | number | `1` | Plane width component (see sizing below). |
| `aspectheight` | number | `1` | Plane height component. |
| `transparent` | `"true"` \| `"false"` | `"false"` | Intended to enable alpha transparency for PNGs (see note). |
| `positionx/y/z` | number | `0` | World position. |
| `rotationx/y/z` | number | `0` | Rotation (radians). |
| `scalex/y/z` | number | `1` | Scale per axis. |

---

## Sizing

The plane's base geometry is `aspectwidth / 12` × `aspectheight / 12` world units, then multiplied by `scalex`/`scaley`. So `aspectwidth="16" aspectheight="9"` with scale 1 yields a plane roughly 1.33 × 0.75 units. Think of `aspectwidth`/`aspectheight` as the aspect ratio and use `scalex`/`scaley` for final size — e.g. a 16:9 image at `scalex="3" scaley="3"` is 4 × 2.25 units.

---

## Notable behaviors

- **Double-sided**: the image is visible from both sides of the plane.
- **Camera-friendly**: the plane is excluded from camera collision.
- **Transparency caveat**: in the current runtime the transparent material path is not reachable from the attribute (the parser and the component disagree on the flag's encoding), so PNGs with alpha render on an opaque standard material. If a transparent decal matters today, build it via a plugin material instead.
- Non-transparent images use a lit standard material, so scene lighting affects their brightness.

---

## Next steps

- Moving pictures: [Video Block](09-video-block.md)
- Screen-space imagery for UI: [HUD Overlays](34-hud-overlays.md)
- Full worlds from blocks: [Blocks Overview](03-blocks-overview.md)
