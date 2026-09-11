# Proximity Voice

Peer voice in XR Publisher is **distance-attenuated and directional by default** — VRChat-style. A nearby player is at full volume; walk apart and their voice fades smoothly, going silent at the hearing radius. Beyond that radius the engine also stops **sending** your microphone to that peer entirely, so voice bandwidth scales with *nearby* players, not room size.

Plugins don't touch mic streams — the engine owns them. The plugin surface steers ranges and per-peer overrides, and reads voice levels for UI (speaking indicators, audio-reactive avatars).

[SCREENSHOT: two avatars at different distances, with a HUD readout showing the resolved fade/silence ranges]

---

## How the default behaves

**Receive side** — each peer's voice routes through the world's shared audio context with directional stereo (you hear *where* a voice is) and a gain curve the engine owns: full volume inside `fadeStart`, a smooth curve to silence at `maxDistance`.

**Send side** — beyond `maxDistance × 1.15` the engine stops *encoding* your mic for that peer (no renegotiation); it restores automatically when they come back under `maxDistance`. The hysteresis gap prevents flapping at the boundary. Data traffic — [`broadcast`](39-networking-plugins.md), [world state](41-world-state.md), positions — is untouched; world-wide events keep working from any distance.

**Auto-derived ranges** — when you don't configure ranges, they derive from the world's terrain cell size, so voice range naturally matches world scale: hearing radius = half the terrain chunk width, fade begins at 25% of that radius (min 8u). Worlds without procedural terrain fall back to a 48u radius. Read the resolved values back with `getProximityVoiceConfig()`.

**Peers without a position yet** (just joined) are audible at full volume and keep receiving your voice — audible beats silent.

---

## API reference

All on `XRPublisher` (static, and `window.XRPublisher` for script-tag plugins).

| Method | Type | Description |
|---|---|---|
| `configureProximityVoice(opts)` | `(Partial<ProximityVoiceConfig>) => void` | Tune or disable proximity voice. Partial — only the fields you pass change. |
| `getProximityVoiceConfig()` | `() => ProximityVoiceConfig & { resolvedFadeStart, resolvedMaxDistance }` | The current config plus the **resolved** auto ranges in world units. |
| `setPeerVoiceOverride(clientId, override)` | `(string, { global?, gain? } \| null) => void` | Per-peer override for the **local listener only**. Pass `null` to clear. |
| `setLocalVoiceGlobal(on)` | `(boolean) => void` | Send your own mic to **all** peers regardless of distance (disables sender-side gating for your voice). |
| `getVoicePeers()` | `() => [{ id, distance, gain, sendGated }]` | Live per-peer voice status. `distance` is `null` when the peer has no known position; `sendGated` is `true` when your mic isn't being sent to them. |
| `getPeerAudioLevel(clientId)` | `(string) => number` | 0..1 RMS voice level for a peer, **pre-falloff** — a whisper across the map still registers. `0` when the peer isn't voice-connected or is silent. Cheap; safe to call per frame. |

### `ProximityVoiceConfig`

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Master switch. `false` = legacy behavior: every peer at full volume, no send gating. |
| `spatialize` | `boolean` | `true` | Directional stereo panning. `false` = distance falloff only. |
| `fadeStart` | `number \| null` | `null` | Distance where fade begins. `null` = auto (25% of the terrain-cell radius, min 8u; always clamped to ≤ 90% of `maxDistance`). |
| `maxDistance` | `number \| null` | `null` | Distance where voice is silent and sends gate off. `null` = auto (the terrain-cell radius). |
| `exponent` | `number` | `1.6` | Falloff curve shape — higher = steeper near the edge. |

### `PeerVoiceOverride`

| Field | Type | Description |
|---|---|---|
| `global` | `boolean` | Hear this peer at full volume everywhere (performer, announcer). |
| `gain` | `number` | Volume multiplier 0..2 applied *after* distance falloff. `0` = local mute. |

```js
XRPublisher.configureProximityVoice({ maxDistance: 30 });  // tighter voice bubble
XRPublisher.configureProximityVoice({ enabled: false });   // legacy global voice
XRPublisher.setPeerVoiceOverride(noisyPeerId, { gain: 0 }); // local mute
XRPublisher.setPeerVoiceOverride(noisyPeerId, null);        // clear it
```

---

## The megaphone pattern (both sides required)

`setPeerVoiceOverride` only affects the **local listener**, and `setLocalVoiceGlobal` only affects the **local sender**. A world-wide megaphone therefore needs both halves, coordinated over [`broadcast`](39-networking-plugins.md):

1. The **speaker** calls `setLocalVoiceGlobal(true)` — otherwise the engine stops encoding their mic for out-of-range peers and no override on the listener side can recover it.
2. The speaker **broadcasts** a message telling every listener to apply `setPeerVoiceOverride(speakerId, { global: true })`.
3. The speaker **re-asserts** the broadcast every few seconds while active, so **late joiners** hear the announcer too — the same keyframe-style self-heal used for transport sync.

From the `multiplayer-demo` plugin ([full example](66-example-multiplayer-demo.md)):

```js
const CH = 'mpdemo-megaphone';

// Listener side — every client applies/clears the override for the announcer:
XRP.onMessage(CH, (peerId, data) => {
  if (data && data.on) XRP.setPeerVoiceOverride(peerId, { global: true });
  else XRP.setPeerVoiceOverride(peerId, null);
});

// Speaker side — un-gate own sends, announce, re-assert for late joiners:
let reassert = null;
function setMegaphone(on) {
  XRP.setLocalVoiceGlobal(on);
  XRP.broadcast(CH, { on });
  clearInterval(reassert);
  if (on) reassert = setInterval(() => XRP.broadcast(CH, { on: true }), 4000);
}
```

The engine clears voice state for peers that disconnect, so a leaving announcer needs no override cleanup.

---

## Speaking indicators

`getPeerAudioLevel(id)` is measured **before** distance falloff, so it works even for peers you can barely hear — right for name-tag glows and speaking rings. Smooth the raw reading so indicators ease instead of flickering with speech gaps:

```js
// per frame, per peer
const raw = XRP.getPeerAudioLevel(p.id);
r.level += (raw - r.level) * 0.25;      // ease toward the reading
r.mesh.visible = r.level > 0.05;
```

Show the world's resolved voice range in a HUD (the derived cell size can arrive shortly after load — refresh occasionally):

```js
const cfg = XRP.getProximityVoiceConfig();
line.textContent = cfg.enabled
  ? `voice fades ${Math.round(cfg.resolvedFadeStart)}u → silent ${Math.round(cfg.resolvedMaxDistance)}u`
  : 'proximity voice off (global)';
```

---

## Next steps

- [Networking for plugins](39-networking-plugins.md) — broadcast channels, peers, join/leave
- [HUD overlays](34-hud-overlays.md) — where a voice-range readout or toast stack lives
- [Player, scene and audio access](42-player-scene-audio.md) — the master audio analyser for world audio (not voice)
- [Example: multiplayer demo](66-example-multiplayer-demo.md) — megaphone, speaking rings, range HUD
