# `<three-text-block>`

Places a text element in 3D space — for signs, labels, and welcome messages.

[SCREENSHOT: a floating "Welcome!" sign standing in a world, readable from both sides]

---

## Usage

```html
<three-text-block
    textcontent="Welcome!"
    textcolor="#ffffff"
    positionx="0" positiony="2" positionz="-5"
    rotationx="0" rotationy="0" rotationz="0"
    scalex="1" scaley="1" scalez="1">
</three-text-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `textcontent` | string | **required** | The text string to display. Empty (or missing) renders nothing. |
| `textcolor` | string | `"#ffffff"` | Text color (hex). |
| `positionx/y/z` | number | `0` | World position — the **center** of the text block sits here. |
| `rotationx/y/z` | number | `0` | Rotation (radians). |
| `scalex/y/z` | number | `1` | Scale per axis — `scalex="2" scaley="2"` doubles the text size. |

---

## Layout and sizing

The text lays out in a **2-world-unit-wide wrap box** with roughly **0.35-unit glyphs** at scale 1, and is centered on the block's origin both horizontally and vertically. Lines wrap on word boundaries inside that box, and literal newlines in `textcontent` start a new line, so a long string grows *downward* around the block position rather than running off sideways.

Scale is the size control: the whole laid-out block is multiplied by `scalex/y/z`, so `scale="3"` gives ~1-unit glyphs in a 6-unit-wide box. Use it uniformly — non-uniform scale stretches the glyphs.

```html
<!-- A big banner over a doorway -->
<three-text-block
    textcontent="Market Square"
    textcolor="#ffe9b0"
    positionx="0" positiony="4" positionz="-12"
    scalex="3" scaley="3" scalez="3">
</three-text-block>
```

---

## Notable behaviors

- **Renders on both renderers.** Text is drawn to a canvas texture on a plane, which the WebGPU and WebGL/XR paths handle identically — so it stays visible on devices without WebGPU. The trade-off is that it is a texture, not vector glyphs: it stays crisp at normal viewing distance, but very large scale viewed up close will soften.
- **Double-sided.** The text plane renders from both front and back, so a sign is never invisible from one side.
- **Excluded from camera collision**, so it never pushes the third-person camera around.
- **Static text.** The block renders whatever `textcontent` holds; changing it rebuilds the text. For per-frame or interactive text (counters, prompts), use the plugin APIs below.

---

## Next steps

- Clickable in-world panels for plugins: [In-World Dialogs](35-in-world-dialogs.md)
- 2D screen-space text: [HUD Overlays](34-hud-overlays.md)
- Labels above portals: [Portal Block](12-portal-block.md) (`label` attribute)
