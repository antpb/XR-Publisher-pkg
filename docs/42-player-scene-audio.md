# Player, Scene and Audio Access

Beyond the structured plugin systems (decorations, blocks, HUD), plugins often need direct handles into the running world: the scene graph, the player, the audio pipeline, and the engine's own generation primitives. This page covers those runtime access utilities.

All of them live on `XRPublisher` (static, and `window.XRPublisher` for script-tag plugins).

---

## Scene and player

| Method | Type | Description |
|---|---|---|
| `getScene()` | `() => THREE.Scene \| null` | The active scene root, or `null` before the world mounts. |
| `getPlayer()` | `() => THREE.Object3D \| null` | The local player avatar (the object named `playerOne`), or `null` before it mounts. Cached — the lookup no longer traverses the scene on every call. |
| `getPlayerState()` | `() => { x, y, z, yaw, isSwimming, isFlying, sheltered } \| null` | Live local-player state, updated each frame. `null` before the player mounts. |
| `isWebGPU()` | `() => boolean` | `true` when the **active renderer** is WebGPU, `false` on WebGL. Defaults to `false` until the renderer is created. |

**`getScene()` gotchas** worth knowing:

- The **camera is not in the scene graph** — objects parented to the camera (or the audio listener) will not render. For effects that follow the player, add them to the scene and move them each frame.
- For custom particles prefer `MeshBasicMaterial` + `InstancedMesh` — `PointsMaterial` does not render under WebGPU.

**`getPlayer()` vs `getScene()`**: attach child effects to the player object to follow it exactly (it tracks body position and yaw); use the scene for world-space effects. `getPlayer()` caches the resolved avatar and re-resolves only if it leaves the scene (avatar swap, renderer branch change), so it's safe in a per-frame loop — but if all you need is position/heading, `getPlayerState()` is still the cheaper read (a plain object lookup, no scene access at all).

**`getPlayerState()`** is the cheap read for effect gating. `sheltered` is `true` when something solid (a roof, a cavern ceiling) is within ~14m straight up — so the standard "outdoor weather" gate is:

```js
const ps = XRPublisher.getPlayerState();
if (ps && !ps.sheltered && !ps.isSwimming && !ps.isFlying) {
  // rain drips, footstep dust, wind audio…
}
```

`getPlayerState()` positions are in the **render frame** — the same frame as `getPeers()`, `addTerrainRegion`/`addPath` centers, and [world-state](41-world-state.md) positions.

**`yaw`** is the avatar **body** heading in radians (`0` = −Z, matching the avatar's `rotation.y`) — there so you don't have to walk the scene graph for a heading. Orient effects that should follow the character with it: a trail behind the player, a held-tool offset, a facing-aware zone check.

```js
const ps = XRPublisher.getPlayerState();
dust.position.set(ps.x - Math.sin(ps.yaw) * 0.4, ps.y, ps.z - Math.cos(ps.yaw) * 0.4);
```

⚠️ **`yaw` is not "where the player is looking".** The body turns toward *movement* — an idle player can be facing one way while the camera (and the player's attention) points somewhere else entirely. For anything aim-driven — throwing, spraying, placing, shooting — use [`getCursorState()`](44-aim-input-and-hands.md#aim-the-world-cursor), which is the engine's actual aim point.

---

## Audio

| Method | Type | Description |
|---|---|---|
| `getAudioListener()` | `() => THREE.AudioListener \| null` | The world's shared camera-mounted `AudioListener`. `null` only before the player camera exists (poll/retry). |
| `getAudioAnalyser(fftSize?)` | `(number?) => AnalyserNode \| null` | A master `AnalyserNode` tapping the **full spatial mix** — every `PositionalAudio`/`Audio` summed at the listener. Created once, lazily; `fftSize` defaults to 1024. `null` before the listener exists. |
| `getAudioLevels()` | `() => { bass, mid, treble, level }` | Normalized 0..1 energy bands of the whole soundscape this frame. Returns zeros before audio exists. Cheap; call per frame. |

**Attach positional audio to the shared listener** — never create a second `AudioListener`/`AudioContext`. The engine also resumes the context on the first user gesture, so plugin audio isn't blocked by autoplay policy:

```js
const listener = XRPublisher.getAudioListener();
const sound = new THREE.PositionalAudio(listener);
sound.setBuffer(buffer); sound.setRefDistance(8); sound.setLoop(true);
stone.add(sound); sound.play();
```

**Audio-reactive visuals** — `getAudioLevels()` is the no-FFT-knowledge path (bands: bass ≈ the bottom 8% of bins, mid 8–35%, treble the rest):

```js
// per frame
const { bass, level } = XRPublisher.getAudioLevels();
ring.scale.setScalar(1 + bass * 0.5);
glowMaterial.opacity = 0.3 + level * 0.7;
```

For full control read raw bins from the analyser, as the `resonance-stage` concert plugin does for its 360° equalizer ring and spectral-flux beat detection ([full example](67-example-resonance-stage.md)):

```js
const a = XRPublisher.getAudioAnalyser(512);
const bins = new Uint8Array(a.frequencyBinCount);
// per frame: read once, drive many visuals from the one read
a.getByteFrequencyData(bins);
```

Note the analyser is a **singleton**: the first call creates it with the given `fftSize`, and later calls return that same node (the `fftSize` argument is ignored once one exists). Voice levels are separate — use [`getPeerAudioLevel`](40-proximity-voice.md) for per-peer speech.

---

## Loading models: `loadModel(url)`

| Method | Type | Description |
|---|---|---|
| `loadModel(url)` | `(string) => Promise<THREE.Object3D>` | Load a glTF/GLB and resolve its scene. **Cached per URL** — one fetch + parse no matter how many spawns or plugins use it. Missing vertex normals are generated automatically. |

The resolved `Object3D` is **shared**. Never mount it directly — clone per use with `.clone(true)` (clones share geometry and materials, so it's one GPU upload for many instances; for rigged/skinned models use THREE's `SkeletonUtils`). Await it *before* `registerDecoration` so `create()` can clone synchronously — late registration re-scatters live chunks. From the `lake-fish` plugin ([full example](53-example-lake-fish.md)):

```js
const fishModel = await XRPublisher.loadModel(FISH_URL);
// Normalize the shared template once; clones inherit it.
fishModel.scale.setScalar(0.8 / measuredLength);

XRPublisher.registerDecoration({
  name: 'lake-fish',
  surface: 'water',
  waterPlacement: 'submerged',
  create: () => fishModel.clone(true),
  update(obj, dt, t) { /* cruise the water column */ },
  // REQUIRED for cloned models: the engine's default cleanup disposes
  // geometry, which would break every other clone of the shared model.
  dispose() {},
});
```

---

## Deterministic generation: `XRPublisher.utils`

| Property | Type | Description |
|---|---|---|
| `utils.alea` | `(seed?) => () => number` | The seeded PRNG the engine's own terrain/mountain/decoration builders use. |
| `utils.createNoise2D` | `(rng?) => noise2D` | Simplex noise (simplex-noise v4), 2D. |
| `utils.createNoise3D` | `(rng?) => noise3D` | Simplex noise, 3D. |

These are the **same primitives the engine uses**, exposed so plugin-generated content is seed-stable: the same world seed produces the same result on every visit and every device. **Never use `Math.random()` for placement or generative variation that should persist** — it breaks determinism (and, for stateful decorations, breaks the stable identity that [world state](41-world-state.md) keys on).

```js
// Per-spawn: spawn.rng is already seeded for you. For your own fields:
const noise = XRPublisher.utils.createNoise3D(XRPublisher.utils.alea(spawn.seed));
const bump = noise(x * 0.4, y * 0.4, z * 0.4);

// World-scale: seed from the world itself.
const rng = XRPublisher.utils.alea(XRPublisher.getWorldSeed());
```

`Math.random()` is fine for genuinely ephemeral things (a one-shot particle burst's jitter) — just never for anything whose layout should match across visits or clients.

---

## Custom materials: `XRPublisher.tsl`, `XRPublisher.webgpu`, `window.THREE`

| Property | Type | Description |
|---|---|---|
| `XRPublisher.tsl` | namespace | The bundled `three/tsl` node namespace — `Fn`, `color`, `uniform`, `positionLocal`, `mix`, … |
| `XRPublisher.webgpu` | namespace | The bundled `three/webgpu` namespace — the node-material classes (`MeshStandardNodeMaterial`, `MeshBasicNodeMaterial`, `PointsNodeMaterial`, `SpriteNodeMaterial`, …). |
| `window.THREE` | namespace | The bundled core three namespace, for building Object3Ds/stock materials without shipping a second copy of three. |

Always author against these — **never bundle your own three**. A second three copy breaks `instanceof` checks and TSL node identity, and doubles the payload.

`XRPublisher.webgpu` is always *present* — it is not a renderer check. Gate node-material code on **`XRPublisher.isWebGPU()`** and fall back to `window.THREE` stock materials on WebGL (the engine defaults some devices to WebGL, and users can force it with `?renderer=webgl`):

```js
let mat;
if (XRPublisher.isWebGPU()) {
  const { color } = XRPublisher.tsl;
  mat = new XRPublisher.webgpu.MeshStandardNodeMaterial();
  const beat = XRPublisher.tsl.uniform(0);          // update beat.value per frame
  mat.colorNode = color(0x000000);
  mat.emissiveNode = color('#19e0ff').mul(beat.mul(2).add(0.3));
} else {
  mat = new window.THREE.MeshStandardMaterial({
    color: 0x000000, emissive: 0x19e0ff, emissiveIntensity: 0.3,
  });
}
```

An emissive node material (or an emissive-bearing standard material) is picked up automatically by [`setPostProcessing`](37-post-processing.md) selective bloom.

[SCREENSHOT: an audio-reactive emissive ring pulsing with music, blooming under post-processing]

---

## Next steps

- [Post-processing](37-post-processing.md) — bloom for your emissive materials, `audioReactive` mode
- [Terrain queries](31-terrain-queries.md) — `getGroundHeight`, `sampleTerrain`, biome sampling
- [Persisted world state](41-world-state.md) — why determinism (and `utils`) matter
- [Example: resonance stage](67-example-resonance-stage.md) — the full audio-reactive concert
- [Example: lake fish](53-example-lake-fish.md) — `loadModel` + clone + no-op dispose
