# `<three-audio-block>`

Adds an audio source to the world — either **positional** (3D, attenuating with distance and direction) or **ambient** (plays at constant volume everywhere). Supports looping, autoplay, and a proximity trigger zone that starts playback when the player walks in.

---

## Usage

```html
<!-- Ambient background music -->
<three-audio-block
    audiourl="ambient.mp3"
    positional="0"
    loop="1"
    volume="0.3"
    autoplay="1">
</three-audio-block>

<!-- A positional fountain sound that starts when the player approaches -->
<three-audio-block
    audiourl="fountain.mp3"
    positional="1"
    loop="1"
    volume="0.8"
    autoplay="0"
    refdistance="1"
    maxdistance="50"
    rollofffactor="1"
    distancemodel="inverse"
    positionx="10" positiony="1" positionz="10"
    triggerlocationx="8" triggerlocationy="4" triggerlocationz="8"
    triggerlocationposy="1">
</three-audio-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `audiourl` | string | **required** | Audio file URL (WAV, MP3, OGG — or MP4 for spatial audio, see below). |
| `positional` | `"0"` \| `"1"` | `"0"` | `"1"` = 3D positional audio; anything else = ambient (non-spatial). |
| `loop` | `"0"` \| `"1"` | `"0"` | Loop playback. |
| `volume` | number | `1` | Volume 0.0–1.0. |
| `autoplay` | `"0"` \| `"1"` | `"0"` | Play automatically once loaded (see trigger semantics below). |
| `refdistance` | number | `1` | Distance at which volume starts to fall off (positional only). |
| `maxdistance` | number | `10000` | Maximum distance used by the falloff model (positional only). |
| `rollofffactor` | number | `1` | How quickly volume falls off (positional only). |
| `distancemodel` | string | `"inverse"` | `"linear"`, `"inverse"`, or `"exponential"` falloff curve. |
| `coneinnerangle` | number | `360` | Directional cone inner angle in degrees (positional only). |
| `coneouterangle` | number | `0` | Directional cone outer angle in degrees. |
| `coneoutergain` | number | `0` | Volume multiplier outside the cone. |
| `positionx/y/z` | number | `0` | Source position (positional only). |
| `rotationx/y/z` | number | `0` | Source orientation in radians (matters for cones). |
| `triggerlocationx/y/z` | number | `0` | Proximity trigger zone size. **All three must be > 0** to enable the trigger. |
| `triggerlocationposx/y/z` | number | `0` | Trigger zone offset from the source position. |
| `isspatial` | `"0"` \| `"1"` | `"0"` | Force the multi-channel spatial audio path regardless of file extension. |
| `spatialmetaurl` | string | — | Explicit URL of the `.spatial.json` sidecar for spatial files. |

> The schema documents `positional` as defaulting to `"1"`, but the runtime treats the attribute as positional only when it is explicitly `"1"` — omit it and you get ambient audio. Set it explicitly either way.

---

## Proximity trigger semantics

If `triggerlocationx`, `triggerlocationy`, and `triggerlocationz` are all greater than zero, the block places an invisible sensor box of that size (centered at the source position plus `triggerlocationposx/y/z`) and defers loading the audio until the player first enters it. Behavior on entry/exit:

- **`autoplay="1"`** — the audio plays on the **first** entry only. Re-entering does not restart it.
- **`autoplay="0"`** — the audio (re)starts on **every** entry: if it's already playing it restarts from the beginning; if it stopped, it plays again.
- **On exit** — looping is disabled, so the current pass plays to its natural end and stops (no abrupt cut).
- **On re-entry** — the original `loop` setting is restored.

Without a trigger zone, the audio loads immediately; sources with `autoplay="1"` start together once every audio block in the world has finished loading.

---

## Spatial (multi-channel) audio

If the URL ends in `.mp4`, or `isspatial="1"`, the block uses the spatial audio path: the file's per-track positional metadata (or a `.spatial.json` sidecar, override with `spatialmetaurl`) is parsed and one positional source is created per named channel position, grouped around the block's position. Loop/volume/autoplay and the trigger-zone semantics apply to the whole group.

---

## Notable behaviors

- Browsers block audio before the first user interaction — ambient `autoplay` audio may not be audible until the player clicks/moves. Trigger zones sidestep this naturally.
- Voice chat is separate from audio blocks — see [Proximity Voice](40-proximity-voice.md).
- Plugins can access the listener and an analyser for audio-reactive effects — see [Player, Scene, and Audio APIs](42-player-scene-audio.md).

---

## Next steps

- Voice between players: [Proximity Voice](40-proximity-voice.md)
- Audio-reactive visuals: [Post-Processing](37-post-processing.md)
- Video with sound: [Video Block](09-video-block.md)
