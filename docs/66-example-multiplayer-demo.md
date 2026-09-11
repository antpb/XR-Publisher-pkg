# Example: Multiplayer Demo

**The multiplayer API tour** — a small, readable reference plugin that exercises every multiplayer hook the engine exposes: join/leave toasts, speaking-indicator rings floating over whoever is talking, a "ping my location" beacon flare every peer sees, and a world-wide voice megaphone.

Source: `examples/plugins/multiplayer-demo-xr-publisher-plugin.umd.js`

[SCREENSHOT: two avatars — one with a green speaking ring overhead, a yellow ping flare in the distance]

## What it demonstrates

- **[Peer lifecycle events](39-networking-plugins.md)** — `XRPublisher.onPeerJoin(cb)` / `onPeerLeave(cb)`: engine-fired join/leave, no more hand-rolled "last heard from" liveness windows
- **[Peer positions + voice levels](40-proximity-voice.md)** — `getPeers()` + `getPeerAudioLevel(id)`: pre-falloff voice RMS (0..1), so speaking indicators work even for peers you can barely hear
- **[Custom message channels](39-networking-plugins.md)** — `broadcast(channel, data)` / `onMessage(channel, cb)` / `getClientId()`: the ping flare sends *no coordinates* — receivers correlate the sender's `peerId` with `getPeers()` positions
- **[The megaphone](40-proximity-voice.md)** — `setLocalVoiceGlobal(on)` + `setPeerVoiceOverride(id, {global})`, re-asserted on an interval so late joiners hear the announcer
- **[Proximity-voice introspection](40-proximity-voice.md)** — `getProximityVoiceConfig()` shows the resolved fade/silence ranges the engine derived from the terrain cell size
- **[HUD overlays](34-hud-overlays.md)** — `registerHud` for the range readout + toast stack; **[menu items](36-menu-items.md)** for the Megaphone and Ping actions

Voice data never crosses the plugin — the engine owns mic streams; plugins only steer ranges/overrides and read levels. Custom channels use plain names (`mpdemo-*`); the `__xrp:*` prefix is reserved for the engine.

## How it works

### Join/leave toasts

The engine tells you when peers arrive and go; ids match `getPeers()` and `onMessage` peerIds:

```js
// Engine-fired join/leave — ids match getPeers()/onMessage peerIds.
XRP.onPeerJoin((id) => toast(`👋 ${id.slice(0, 6)} joined`));
XRP.onPeerLeave((id) => {
  toast(`💨 ${id.slice(0, 6)} left`);
  megaphones.delete(id); // a leaving announcer needs no override cleanup — engine clears it
});
```

### Speaking rings

One small unlit torus per peer, pooled in a Map keyed by peer id (stock `MeshBasicMaterial` renders on both the WebGPU and WebGL paths). The per-frame tick smooths the analyser reading so rings ease in/out instead of flickering with speech gaps:

```js
const tick = () => {
  const peers = XRP.getPeers();
  for (const p of peers) {
    const r = ringFor(p.id);
    const raw = XRP.getPeerAudioLevel(p.id);
    r.level += (raw - r.level) * 0.25;
    const speaking = r.level > 0.05;
    r.mesh.visible = speaking;
    if (speaking) {
      r.mesh.position.set(p.x, p.y + 2.25, p.z);
      const s = 1 + Math.min(1, r.level * 2) * 0.5;
      r.mesh.scale.setScalar(s);
      r.mesh.material.opacity = 0.35 + Math.min(0.55, r.level * 1.6);
    }
  }
  ...
```

### Ping flares — derive positions, don't send them

Broadcast messages carry only tiny JSON. The receiver looks the sender up in `getPeers()` to place the beacon:

```js
XRP.onMessage(CH_PING, (peerId) => {
  const peer = XRP.getPeers().find((p) => p.id === peerId);
  if (peer) spawnFlare(peer.x, peer.y, peer.z, 0xffd23c);
  toast(`📍 ${peerId.slice(0, 6)} pinged`);
});
```

Note the sender's own menu handler spawns a local echo, because `broadcast` excludes self:

```js
onSelect: () => {
  XRP.broadcast(CH_PING, {});
  const me = XRP.getPlayerState();
  if (me) spawnFlare(me.x, me.y, me.z, 0x7fd4ff); // local echo — broadcast excludes self
},
```

### The megaphone — both sides, plus a keyframe

Voice is proximity-faded by default (the engine even stops *sending* your mic to out-of-range peers), so a megaphone must do **two** things: un-gate its own sends, and tell every listener to boost the speaker. State is re-asserted every few seconds so late joiners converge — the same keyframe-style self-heal pattern the resonance plugins use for transport sync:

```js
const setMegaphone = (on) => {
  megaphoneOn = on;
  XRP.setLocalVoiceGlobal(on);
  XRP.broadcast(CH_MEGAPHONE, { on });
  clearInterval(reassertTimer);
  if (on) reassertTimer = setInterval(() => XRP.broadcast(CH_MEGAPHONE, { on: true }), MEGAPHONE_REASSERT_MS);
  toast(on ? '📣 Megaphone ON — everyone hears you' : '📣 Megaphone off');
};
```

And the listener side, driven by the broadcast:

```js
XRP.onMessage(CH_MEGAPHONE, (peerId, data) => {
  const on = !!(data && data.on);
  if (on && !megaphones.has(peerId)) {
    megaphones.add(peerId);
    XRP.setPeerVoiceOverride(peerId, { global: true });
    toast(`📣 ${peerId.slice(0, 6)} is on the megaphone`);
  } else if (!on && megaphones.has(peerId)) {
    megaphones.delete(peerId);
    XRP.setPeerVoiceOverride(peerId, null);
  }
});
```

An explicit `{on: false}` clears the override immediately; a silently-vanishing announcer is handled by `onPeerLeave` (the engine clears its own per-peer state on disconnect).

## Key techniques

- **Re-assert, don't fire-and-forget.** Any broadcast state a late joiner needs (megaphone on, transport playing, …) must be repeated on an interval. One-shot messages only reach peers present at send time.
- **Never send what receivers can derive.** The ping message is an empty object — position comes from `getPeers()` at receive time, which also means the flare lands where the engine *currently* believes the sender is.
- **Smooth analyser reads.** `getPeerAudioLevel` is a raw RMS; lerping toward it (`r.level += (raw - r.level) * 0.25`) is what makes the ring feel attached to speech.
- **Pool per-peer meshes in a Map keyed by client id** and clean them up in `onPeerLeave` — `dropRing` removes the mesh and disposes its material.
- **One rAF for everything.** Rings, flare lifetimes, and fades all run in a single loop — don't stack per-feature `requestAnimationFrame`s.
- The HUD range line (`getProximityVoiceConfig()`) is refreshed on a 5s interval because the terrain cell size — which the engine derives the default voice ranges from — can arrive after load.

## Try it

**Local:** this plugin is loaded by `examples/networking.html` — run `npm run dev`, open it in 2–3 browser windows (they share room `xrp-dev-test`), join voice in each, walk apart until voices fade, then hit 📣 Megaphone in the ☰ More menu.

**Deploy:** copy into the api `plugins/` dir and `npm run upload-build <build-file>` (see `examples/plugins/README.md`).

Suggested modifications:

1. **Directional ping.** Instead of a flare at the sender, draw an arrow at *your* feet pointing toward them — same message, all receiver-side.
2. **Push-to-talk megaphone.** Bind the megaphone to key-down/key-up instead of a toggle; you'll notice why the re-assert interval should be cancelled on key-up.

## Next steps

- [Resonance Plaza](68-example-resonance-plaza.md) — broadcast/onMessage graduated to leader-elected transport sync
- [Resonance Stage](67-example-resonance-stage.md) — the full concert built on the same networking surface
- [Networking plugins API](39-networking-plugins.md) · [Proximity voice](40-proximity-voice.md) · [HUD overlays](34-hud-overlays.md) · [Menu items](36-menu-items.md)
