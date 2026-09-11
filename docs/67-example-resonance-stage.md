# Example: Resonance Stage

The flagship concert plugin — a complete audio-reactive show built entirely from the public API: a stage-in-the-round at the nearest town centre with an FFT equalizer ring, sweeping beam fans, a holographic wall, a morphing 2,400-particle sculpture, pyro, fog machines, a networked transport console, and a rising sparkle aura around every avatar on the stage.

Source: `examples/plugins/resonance-stage-xr-publisher-plugin.umd.js` (~2,000 heavily-commented lines)

[SCREENSHOT: night show — beam fans crossing over the stage, EQ ring lit, sculpture mid-morph]

## What it demonstrates

- **[Custom TSL materials with a WebGL twin](18-plugin-development-overview.md)** — `XRPublisher.tsl` + `XRPublisher.webgpu` node materials driven by audio uniforms, each mirrored 1:1 by a GLSL `ShaderMaterial` fallback
- **[Post-processing](37-post-processing.md)** — `setPostProcessing({ bloom, audioReactive })` / `clearPostProcessing()`: the one thing a plugin can't do itself, because the engine owns the render call
- **[Room-synced time of day](38-time-of-day.md)** — the "Night show" menu action calls `setTimeOfDay(21.5, false)`: one shared linear timeline, never a per-client proximity flip
- **[Audio analysis](42-player-scene-audio.md)** — `getAudioAnalyser()` + per-stem analyser taps, spectral-flux beat detection, a slow energy envelope for song-section dynamics
- **[Networking](39-networking-plugins.md)** — leader-elected shared-epoch transport over `broadcast`/`onMessage`/`getClientId`; console pads are engine **[interactables](33-interactables.md)**
- **[Clouds](32-clouds-and-weather.md)** — `addCloudRegion` haze (currently disabled — see the gotcha below)
- **Placement & physics** — `getWorldTowns`, `getGroundHeight`, `addSolid` (collidable platform), `teleportPlayer`, **[menu items](36-menu-items.md)**
- **Performance contracts** — direct `instanceMatrix.array` writes, one-FFT-read-per-tick, distance-LOD update cadence, touch-device pool scaling

## How it works

### Transport sync: one epoch, leader-elected

The song initialises **paused at 0:00**; the console's START pad sets a transport whose `epoch` is the leader-frame wall-clock ms of the 0:00 downbeat. Everyone derives their play position from that one number:

```js
const startShow = () => {
  if (!canControl() || transport.playing) return;
  transport.playing = true;
  // 0:00 downbeat = leader-frame NOW + the 50ms source lead-in, so the
  // initiator's actual audio start IS the epoch (not 50ms behind it).
  transport.epoch = syncedNow() + 50;
  broadcastTransport();
  startLayersAt(0);                            // the initiator starts truly on the zero
};

const positionMs = (dur) => {
  if (!transport.playing || transport.epoch == null || dur <= 0) return null;
  let p = (Date.now() + offset - transport.epoch) % dur; if (p < 0) p += dur; return p;
};
```

`offset` (local clock → leader clock) comes from a ping/pong probe that keeps the sample with the **lowest RTT** — the most trustworthy estimate. Leadership is simply the lowest live client id; the leader heartbeats the full transport + mute mask every 2.5s so late joiners and races converge within one beat ("last-write-wins; the leader adopts and re-heartbeats").

The stems themselves stay locked by Web Audio, not by the network: all layers start in **one call block with a shared 50ms lead-in** and `loop = true`, so the audio graph keeps them sample-locked through every loop. `alignAudio` (700ms interval) only heals the rare cross-*client* wall-clock drift, re-seeking a stem when it's >350ms off the shared position. Muting never stops a stem — it sets volume 0, so unmute is instant and still in phase.

### Beat detection: spectral flux + a gate

`readAudio()` reads **every analyser exactly once per tick** (master + the three per-stem taps) — an earlier version re-read stems in the visuals pass and paid double FFT work. Beats are positive spectral flux on the low bins of track 1, thresholded against a running mean with a 300ms refractory:

```js
let flux = 0; for (let i = 0; i < bbi; i++) { const v = bFreq[i] / 255; const d = v - prevFreq[i]; if (d > 0) flux += d; prevFreq[i] = v; }
flux /= bbi; fluxHist.push(flux); fluxSum += flux; if (fluxHist.length > 43) fluxSum -= fluxHist.shift();
const mean = fluxSum / fluxHist.length, now = performance.now(); let beat = false;
...
if (flux > 0.006 && flux > mean * 1.7 && now - lastBeat > 300) { beat = true; lastBeat = now; }
```

Two envelopes shape the show on top of raw beats: `beatEnv` (a half-life-decayed flash whose brightness comes from the beat's *strength*, not random) and `energy` (a very slow loudness follower that rises into drops and eases back in breakdowns — this is what gives the show build/release instead of constant flashing). A strobe **gate** only opens short ON windows separated by long OFF windows, and only when energy is present, so the strobe punctuates sections instead of running all song.

### The TSL ↔ WebGL floor pair — the part to copy

The floor is the teaching material: the *same* visual (domain-warped flow + pulse rings + edge fade, driven by the same audio signals) written twice. WebGPU gets a TSL node graph:

```js
const p = positionLocal.xy;              // unit disc scaled to STAGE_RADIUS → [-1,1]; no uv attribute needed
const r = p.length();
const edge = r.oneMinus().clamp(0, 1).pow(0.7);
// DOMAIN WARP: a noise field sampled through coordinates distorted by another noise
const warp = mx_noise_vec3(vec3(p.x.mul(sc), p.y.mul(sc), time.mul(0.25))).xy.mul(0.9);
const tex = mx_noise_vec3(vec3(p.x.mul(sc).add(warp.x), p.y.mul(sc).add(warp.y), time.mul(0.18))).x.mul(0.5).add(0.5);
...
const drive = uEnergy.mul(0.8).add(uBass.mul(0.7)).add(uBeat.mul(0.4)).add(0.35);
m.emissiveNode = base.mul(pattern).mul(edge).mul(drive).mul(float(INTENSITY));
```

WebGL gets a `ShaderMaterial` whose GLSL mirrors the graph 1:1, fed from a plain `uniforms` object set from the **same values** each tick. That's the whole fallback pattern: one signal source, two shader dialects. (GLSL gotcha the file calls out: three compiles `ShaderMaterial` as GLSL ES 3.00, so identifiers like `patch`/`sample`/`filter` are reserved — using one silently kills the mesh.)

Bloom then rides on emissive: `setPostProcessing({ bloom: { strength: 0.5, threshold: 0.8 }, audioReactive: true })` blooms only emissive-bearing materials, so the stage glows while terrain and buildings are untouched.

### Perf: hand-written instance matrices + distance LOD

The hot loops position thousands of instances per tick (embers, fog, fire, screen particles, the 2,400-piece sculpture, auras). Composing each through `Object3D` + `updateMatrix()` was the single hottest block in the profile, so the pools write the 16 floats directly:

```js
const writeScaleMatrix = (arr, i, x, y, z, s) => {
  const o = i * 16;
  arr[o] = s; arr[o + 1] = 0; arr[o + 2] = 0; arr[o + 3] = 0;
  arr[o + 4] = 0; arr[o + 5] = s; arr[o + 6] = 0; arr[o + 7] = 0;
  arr[o + 8] = 0; arr[o + 9] = 0; arr[o + 10] = s; arr[o + 11] = 0;
  arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1;
};
```

And the whole visual update runs on a distance-LOD cadence with accumulated `dt`, so motion speed never changes with the tier:

```js
const idle = (typeof window !== 'undefined') && window.__xrIdle;
const lodDt = stageDist < 70 ? (1 / 60) : stageDist < 150 ? (1 / 30) : (1 / 20);
const targetDt = Math.max(idle ? (1 / 30) : (1 / 60), lodDt);
visAccum += dt;
if (visAccum >= targetDt - 0.001) {
  updateVisuals(Math.min(0.05, visAccum), readAudio()); // accumulated dt → motion stays correct
  visAccum = 0;
}
```

The activate/deactivate range check runs at ~8Hz, all pools are sized down on touch devices (`IS_TOUCH`), and a hidden tab does zero work.

### Avatar auras: local + remote, with drag

Every avatar on the stage disc gets a sparkle formation (helix / golden-angle seed spiral / 5-petal rose ring, slowly cycling). Slots are keyed by avatar id in a Map, so a peer joining or leaving never makes another avatar's trail jump. The local player comes from `getPlayerState()`, remote players from `getPeers()` — feature-detected so the plugin still runs on engines that predate the hook. Sparkles are not welded to the avatar: each keeps a persistent position and *chases* its formation anchor with a per-sparkle lag, so walking pulls a comet trail and pattern changes morph instead of snapping.

## Key techniques / gotchas the file calls out

- **Never flip time on proximity.** The old version set night when a player approached — that made a per-client "night bubble": dark ground near the venue, noon everywhere else, every peer different. Night is now an explicit, room-synced menu action; `deactivate()` deliberately does *not* restore time.
- **Additive transparents vs. the cloud deck.** Beams, wall, and fire all use `depthWrite:false`, and so do the engine's cloud planes (renderOrder 100–103) — only `renderOrder` can order them. Everything that must glow over clouds sits at `BEAM_RENDER_ORDER = 110`. The pyro was originally at renderOrder 4 and clouds painted over the flames.
- **Solid occlusion without depth.** WebGPU beams use `depthTest:false` plus the engine's selective occlusion mask (`XR.occlusionMaskNode()`), so buildings and avatars still occlude them while terrain/weather don't. Both the occlusion pass and bloom are **desktop-only** — on touch devices they corrupt the render, so `activate()` skips them there.
- **No `instanceColor` on additive materials that don't apply it** — the fire was invisible ("renders black") until it was rebuilt exactly like the fog: solid material colour, fade via a **scale envelope** (grow in, shrink out) instead of per-instance alpha.
- **Instanced icospheres, not GL points.** WebGPU caps point size at ~1px, so the sculpture uses tiny instanced icosahedra with real world-unit scale.
- **Detect the actual renderer, not the API surface.** `XR.webgpu` (the node-material classes) is always present; the WebGPU renderer mounts *async*. The plugin waits for `window.__xrWebGPU` / `XR.isWebGPU()` before choosing the material path — detecting at init raced ahead and mis-flagged WebGPU as WebGL.
- **Placement is patient.** `resolvePlacement` polls `getWorldTowns` around the player; if no town network exists after a few tries it enables `configureWorldRoads(true)` itself. The collidable platform (`addSolid`, hull colliders) is only placed once `getGroundHeight` returns a real number — terrain colliders load lazily, so it polls until then.
- **Permission scaffold.** `canControl()` checks `isTimeAuthority()` (the room's first participant) and currently falls back to *allow everyone* — a marked `TODO(authority)` to tighten when world-admin auth lands.
- One evolving palette (a slow hue drift around `THEME.driftCenter`) feeds every material — cohesion over rainbow churn. The whole show retints from the single `THEME` block at the top (five ready-made variants are included, commented out).

## Try it

Copy into the api `plugins/` dir and `npm run upload-build <build-file>` (see `examples/plugins/README.md`). The show activates within 260u of the nearest town centre — use the ♪ menu item to teleport there, press E on the green console pad to start, and try "Night show (whole room)" with a friend connected to see the shared timeline jump for both of you. Bloom shows on WebGPU; on `?renderer=webgl` the same emissive meshes are still bright, without the glow.

Suggested modifications:

1. **Retheme it.** Swap the active `THEME` block for one of the four commented variants (or your own) — every beam, halo, and particle follows.
2. **Add a fourth stem.** Drop a WAV URL into slot 3 of `LAYER_URLS`: the console grows a pad, the emitter ring re-spaces, and the mix mask syncs — no other changes needed.

## Next steps

- [Resonance Plaza](68-example-resonance-plaza.md) — the interactive sibling: per-stone stem toggles, walk-the-ring spatial mixing
- [Multiplayer demo](66-example-multiplayer-demo.md) — the networking primitives in isolation
- [Post-processing](37-post-processing.md) · [Time of day](38-time-of-day.md) · [Networking plugins](39-networking-plugins.md) · [Player, scene & audio](42-player-scene-audio.md)
