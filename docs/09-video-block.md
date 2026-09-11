# `<three-video-block>`

Plays a video in the world — on a flat plane by default, or projected onto a custom model as a video texture (curved screens, jumbotrons, TV props).

---

## Usage

```html
<three-video-block
    videourl="path/to/video.mp4"
    aspectwidth="16" aspectheight="9"
    autoplay="0"
    videocontrolsenabled="1"
    positionx="0" positiony="2" positionz="-5"
    scalex="3" scaley="3" scalez="1">
</three-video-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `videourl` | string | **required** | Video file URL (MP4, WebM). |
| `aspectwidth` | number | `16` | Plane width component (see sizing below). |
| `aspectheight` | number | `9` | Plane height component. |
| `autoplay` | `"0"` \| `"1"` | `"0"` | Start playing on load. |
| `custommodel` | string | — | URL of a model to apply the video texture to, instead of a plane. |
| `modelurl` | string | — | Alternative model URL for the video screen. |
| `videocontrolsenabled` | `"0"` \| `"1"` | `"0"` | `"1"` lets the player click the video to toggle play/pause. |
| `positionx/y/z` | number | `0` | World position. |
| `rotationx/y/z` | number | `0` | Rotation (radians). |
| `scalex/y/z` | number | `1` | Scale per axis. |

---

## Sizing

Like the [image block](07-image-block.md), the plane's base geometry is `aspectwidth / 12` × `aspectheight / 12` world units, multiplied by `scalex`/`scaley`. The defaults (`16`/`9`) give a small 16:9 plane (~1.33 × 0.75 units) — use `scalex`/`scaley` to size the screen.

---

## Notable behaviors

- **Click to play/pause**: with `videocontrolsenabled="1"`, clicking the video surface toggles playback (video and its audio together). With it disabled, playback is controlled only by `autoplay`.
- **Autoplay policies**: browsers may refuse un-muted autoplay before the first user interaction; if the video appears frozen, a click (or enabling controls) usually resolves it.
- **Custom model screens**: provide `custommodel` (or `modelurl`) to load a mesh and apply the playing video as its texture instead of using the flat plane.

---

## Next steps

- Still images: [Image Block](07-image-block.md)
- Standalone audio: [Audio Block](08-audio-block.md)
- Live effects and shaders around media: [Post-Processing](37-post-processing.md)
