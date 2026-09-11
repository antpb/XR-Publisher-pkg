# Example: Resonance Plaza

A collaborative music garden in the town square: eight looping audio stems, each emitted by a glowing "resonance stone" placed around a ring — so **walking among them re-mixes the track in 3D**. Press E on a stone to toggle its layer for the whole room, phase-locked and in sync; a central conductor stone opens an in-world dialog with global controls.

Source: `examples/plugins/resonance-plaza-xr-publisher-plugin.umd.js`

[SCREENSHOT: the stone ring at a town centre, spectrum bars bouncing, one stone glowing bright]

## What it demonstrates

- **[Spatial audio](42-player-scene-audio.md)** — `XRPublisher.getAudioListener()`: the world's single camera `AudioListener`, so plugin `THREE.PositionalAudio` pans correctly without spawning a second AudioContext (the engine also resumes the context on first user gesture, so plugin audio isn't blocked by autoplay policy)
- **[Networked state sync](39-networking-plugins.md)** — `broadcast`/`onMessage`/`getClientId` carrying only *tiny JSON* (layer on/off + a transport loop-phase); audio bytes never cross the wire
- **Leader election + clock-offset estimation** — deterministic leader (lowest client id), ping/pong median offset, drift-gated re-seek
- **[Interactables](33-interactables.md)** — `registerInteractable` per stone; **[in-world dialogs](35-in-world-dialogs.md)** — `openDialog` on the conductor
- **[Audio-reactive visuals](42-player-scene-audio.md)** — per-layer `THREE.AudioAnalyser` (each stone reacts to its *own* stem) + the master `getAudioAnalyser` FFT driving a 28-bar spectrum ring, plus `getAudioLevels()` on the conductor
- **Placement** — `getWorldTowns` + `getGroundHeight` to seat the plaza on the nearest town, mounted/unmounted by player proximity; **[menu item](36-menu-items.md)** + `teleportPlayer` to jump there
- A synth fallback: with no stem URLs it *synthesizes* eight musical loops, so the spatial + sync demo runs out of the box

## How it works

### Sample-locked layers, volume-as-mute

All layers are the same loop length and play **continuously**, started together in one AudioContext tick — so they're sample-locked to each other for free. Toggling a layer only sets its volume, never stops it, so it stays in phase:

```js
// ── transport: one phase model, all layers seek together ─────────────────────
let started = false, startCtxTime = 0;
const nowPhase = () => started ? ((ctx.currentTime - startCtxTime) % LOOP + LOOP) % LOOP : 0;
function seekTo(phase) {
  phase = ((phase % LOOP) + LOOP) % LOOP;
  startCtxTime = ctx.currentTime - phase;
  for (const s of sounds) { if (s.isPlaying) s.stop(); s.offset = phase; s.play(); }
  started = true;
}
function applyVolumes() {
  LAYERS.forEach((l, i) => sounds[i] && sounds[i].setVolume(layerOn[i] ? l.gain : 0));
}
```

### Leader election and clock offset

Across clients, a deterministic leader (lowest live client id) broadcasts the loop phase every 2.5s. Followers estimate their clock offset with a tiny ping/pong and keep the **median** of recent samples:

```js
if (m.t === 'pong' && m.to === myId()) {
  const t2 = performance.now(), rtt = t2 - m.t0;
  const off = (m.t1 + rtt / 2) - t2;     // leaderPerf - localPerf
  offsetSamples.push(off); if (offsetSamples.length > 7) offsetSamples.shift();
  const sorted = offsetSamples.slice().sort((a, b) => a - b);
  leaderOffset = sorted[sorted.length >> 1];   // median
  return;
}
```

The transport handler converts the leader's sampled phase into local time and only re-seeks when drift exceeds ~60ms — so there's no constant glitching (WebAudio clocks are stable; one alignment holds):

```js
if (m.t === 'transport') {                // leader's authoritative state + phase
  if (Array.isArray(m.on)) { for (let i = 0; i < layerOn.length; i++) layerOn[i] = !!m.on[i]; applyVolumes(); }
  if (!started) return;
  // leader sampled phase m.phase at leader-perf m.atPerf → convert to local
  const localPerfWhen = m.atPerf - leaderOffset;
  const target = m.phase + (performance.now() - localPerfWhen) / 1000;
  const cur = nowPhase();
  let drift = ((target - cur) % LOOP + LOOP) % LOOP; if (drift > LOOP / 2) drift -= LOOP;
  if (Math.abs(drift) > DRIFT_RESEEK) seekTo(target);
}
```

Layer on/off is broadcast on change **and** re-asserted in every transport packet — the keyframe-style self-heal for late joiners. Solo play just works: `getClientId()` is null, so you're the leader of one.

### True per-layer reactivity

Each stone reacts to its own stem's *real* signal — an `AudioAnalyser` per `PositionalAudio`, tapped post-volume, so a muted layer reads ~0 and its stone goes dark. That's genuine reactivity, not a computed beat grid:

```js
// per-layer analyser → each stone reacts to its OWN layer's real signal (post
// volume, so a muted/off layer reads ~0 and its stone goes dark)
const layerAna = sounds.map((s) => new THREE.AudioAnalyser(s, 32));
...
for (let i = 0; i < stones.length; i++) {
  const lv = layerAna[i] ? layerAna[i].getAverageFrequency() / 160 : 0;   // ~0..1+
  const u = stones[i].userData, glow = layerOn[i] ? 0.25 + lv * 2.2 : 0.04;
  u.mat.emissiveIntensity = glow; u.orbMat.emissiveIntensity = glow;
  ...
```

### Interactables + dialog

Every stone is an E-target with a per-layer prompt; the conductor opens a dialog whose buttons drive room-wide changes (each button re-broadcasts, so peers follow):

```js
stones.forEach((s, i) => XRPublisher.registerInteractable({
  id: `${PLUGIN_ID}-${i}`, object: s, interactionRadius: 4.5,
  interactionPrompt: `toggle ${LAYERS[i].name}`,
  onInteract: () => toggleLayer(i),
}));
XRPublisher.registerInteractable({
  id: `${PLUGIN_ID}-conductor`, object: conductor, interactionRadius: 5, interactionPrompt: 'conduct',
  onInteract: () => XRPublisher.openDialog({
    title: 'Resonance Plaza',
    content: `${N} layer${N === 1 ? '' : 's'}, one loop, shared by everyone here. ...`,
    buttons: [
      { label: 'All layers on', variant: 'primary', onSelect: () => { ... } },
      { label: 'Solo the first layer', onSelect: () => { ... } },
      { label: 'Restart the loop', onSelect: () => { seekTo(0); } },
      { label: 'Close' },
    ],
  }),
});
```

## Key techniques

- **Sync state, not samples.** Every client loads the same stems from its own URLs; the wire carries only which layers are on plus one loop-phase number. That's what makes "perfect sync for all players" cheap.
- **Volume is the mute switch.** Stopping a single stem would derail it from the group; setting volume 0 keeps it sample-locked so unmute is instant and in phase.
- **Median over mean for clock offsets** — a single delayed pong doesn't skew the estimate.
- **Derive the loop length from the real stems.** When URLs are given, `LOOP` is replaced by the first decoded buffer's `duration`, and any missing/failed stems are synth-filled *at that same length*, so transport math and looping always line up.
- **The position schema adapts.** Only schema entries with a real URL become stones, re-spaced evenly around the ring however many there are (3, 5, 8…); with zero URLs the full 8-layer synth demo runs.
- **Proximity mount + scene-swap resilience.** A 3s `placeTick` mounts the plaza only within `ACTIVE_RADIUS` of the nearest town (frame-corrected by half a chunk, like the engine's cobblestone — new code should just read `getWorldTowns`' `renderX`/`renderZ`, see [Paths and roads](30-paths-and-roads.md#coordinate-frame)), and the render loop re-adds the group if the scene root swapped (a WebGPU⟷WebGL remount).
- First playback waits for `ctx.state === 'running'` **and** all buffers ready before `seekTo(0)` — the engine's gesture-resume handles autoplay policy.

## Try it

Copy into the api `plugins/` dir and `npm run upload-build <build-file>` (see `examples/plugins/README.md`). Set `LAYER_URLS` to your own WAV stems (same loop length/tempo) — or leave them null to hear the built-in synth loops. Use "Go to Resonance Plaza" in the ☰ menu to find it.

Suggested modifications:

1. **Author your own arrangement.** Edit the `SCHEMA` — each layer's `angle`, `color`, `refDistance`, default-on state, and (for synth layers) the beat pattern + scale are all data.
2. **Add a "conductor lock".** Gate `toggleLayer` behind `isLeader()` (or the engine's `isTimeAuthority()`) and surface the restriction in the dialog — a one-condition change that demonstrates permissioned interactables.

## Next steps

- [Resonance Stage](67-example-resonance-stage.md) — the flagship sibling: epoch-based transport, bloom, night show, full show production
- [Multiplayer demo](66-example-multiplayer-demo.md) — the networking primitives on their own
- [Floating orbs](58-example-floating-orbs.md) — more `openDialog` patterns (branching conversations)
- [Player, scene & audio](42-player-scene-audio.md) · [Interactables](33-interactables.md) · [In-world dialogs](35-in-world-dialogs.md)
