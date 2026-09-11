# Post-Processing (bloom) and Lighting Occlusion

The engine owns the renderer's draw call, so full-screen effects are the one visual capability a plugin can't build itself. Core exposes two opt-in, cost-gated systems:

- **`setPostProcessing(config)` / `clearPostProcessing()`** — a selective bloom pipeline (plus anamorphic streaks and chromatic aberration) for concerts and glow effects.
- **`setLightingOcclusion(enabled)` + `occlusionMaskNode()`** — lets additive light effects (volumetric beams, glows) draw *over* the terrain and sky while still being hidden behind solid objects.

Both are **WebGPU-only** and cost **nothing until enabled** — normal worlds and the `?renderer=webgl` path keep the plain render. Both are also hard-disabled on mobile/touch devices, where the extra passes are not affordable; design your effect to degrade (emissive meshes are still bright without bloom, beams simply don't get occluded).

[SCREENSHOT: an emissive stage ring blooming at night while the surrounding terrain stays unaffected]

---

## `setPostProcessing(config)`

```js
XRPublisher.setPostProcessing({
  bloom: { strength: 0.5, threshold: 0.8 },
  audioReactive: true,
});
// later, when the player leaves the effect area:
XRPublisher.clearPostProcessing();
```

Calling it again replaces the configuration. `clearPostProcessing()` disposes the pipeline entirely.

### Config

| Field | Type | Default | Description |
|---|---|---|---|
| `bloom` | `boolean \| { strength?, radius?, threshold? }` | `true` (when `setPostProcessing` is called) | Bloom on bright pixels. Defaults: `strength 0.9`, `radius 0.85`, `threshold 0.7`. Set `false` to run only the other effects. |
| `anamorphic` | `boolean \| { threshold?, scale? }` | off | Horizontal anamorphic streaks off bright pixels. Defaults: `threshold 0.7`, `scale 2.6`. |
| `chromaticAberration` | `boolean \| number` | off | Screen-space RGB channel split. `true` = a mild default (`0.0014`), or pass a number for the strength. |
| `audioReactive` | `boolean` | `false` | Modulates bloom strength with the master-mix level and chromatic aberration with bass energy, so the frame "breathes" with the music. Uses the engine's shared audio analyser. |

### Making something bloom (and nothing else)

Selectivity comes from the **threshold**: only pixels brighter than it feed the bloom. The ordinary lit world stays below the default threshold, so terrain, grass, and buildings are untouched — the way to make *your* object glow is an **emissive material** whose output exceeds it:

```js
// Stock material — the engine converts it for WebGPU automatically:
const mat = new THREE.MeshStandardMaterial({
  color: 0x000000,
  emissive: new THREE.Color('#19e0ff'),
  emissiveIntensity: 2.0,           // comfortably over the bloom threshold
});

// Or a TSL node material driven per frame:
const beat = XRPublisher.tsl.uniform(0);           // update beat.value each tick
const nm = new XRPublisher.webgpu.MeshStandardNodeMaterial();
nm.colorNode = XRPublisher.tsl.color(0x000000);
nm.emissiveNode = XRPublisher.tsl.color('#19e0ff').mul(beat.mul(2).add(0.3));
```

Bloom reads best against a dark scene — pair a show with the room-synced [`setTimeOfDay`](38-time-of-day.md) night jump. On WebGL (`?renderer=webgl`) `setPostProcessing` is a no-op, but the same emissive meshes still render bright and lit, so the effect degrades to "glowing but not haloed".

Turn the pipeline **on near your effect and off when the player leaves** — the resonance-stage plugin gates it on stage proximity:

```js
if (playerNearStage) XRPublisher.setPostProcessing({ bloom: { strength: 0.5, threshold: 0.8 }, audioReactive: true });
else XRPublisher.clearPostProcessing();
```

---

## Lighting occlusion

An additive, `depthTest:false` light effect (a concert beam, a god ray) has a layering problem: depth-tested it clips into hills; depth-free it shines through buildings and avatars. Lighting occlusion resolves it properly:

- While enabled, the engine renders an extra per-frame **occluder-depth pass of solid objects only** — buildings, props, avatars. Terrain is deliberately not an occluder, and transparent / depth-write-disabled objects are skipped automatically.
- Your light material multiplies its opacity by **`occlusionMaskNode()`** — a TSL factor that is `1` where the fragment is in front of (or has no) solid occluder and `0` where a solid is closer. When occlusion is disabled it's a constant `1`, so it is safe to bake into the material unconditionally.

```js
// Adapted from the resonance-stage beam material.
const mat = new XRPublisher.webgpu.MeshBasicNodeMaterial();
mat.transparent = true;
mat.depthWrite = false;
mat.depthTest = false;
mat.blending = THREE.AdditiveBlending;

let opacity = edgeFade.mul(lengthFade).mul(drive);
opacity = opacity.mul(XRPublisher.occlusionMaskNode()); // solids occlude; terrain/sky don't
mat.opacityNode = opacity;

// Enable while the effect runs, disable on teardown:
XRPublisher.setLightingOcclusion(true);
XRPublisher.excludeFromOcclusion(beamGroup);   // your own FX are not solid occluders
// ...
XRPublisher.setLightingOcclusion(false);
```

### API

| Method | Description |
|---|---|
| `setLightingOcclusion(enabled)` | Turn the occluder-depth pass on/off. Off (the default) costs nothing. Enable only while your effect is visible. |
| `occlusionMaskNode()` | TSL opacity factor: `1` visible, `0` occluded by a solid. Constant `1` when disabled or on platforms where occlusion never runs — always safe to multiply in. |
| `excludeFromOcclusion(obj)` | Mark an object (your additive beams/glows) as **not** a solid occluder, so the effect can't self-occlude. Terrain is excluded automatically. |
| `unexcludeFromOcclusion(obj)` | Undo `excludeFromOcclusion` — call it when the object unmounts. |

Notes:

- WebGPU-only, and disabled on mobile/touch devices — there the mask is a constant `1` and beams simply aren't occluded.
- The pass has a real cost (an extra scene render, and the terrain temporarily leaves its fast render-bundle path while occlusion is active). Treat it like the bloom pipeline: scoped to the effect, not left on for the whole session.
- Occlusion is a single global toggle shared by all plugins — pair enables/disables with your effect's own lifecycle.

---

## Next steps

- [Time of day](38-time-of-day.md) — force a room-synced night so your bloom actually reads.
- [Player, scene and audio](42-player-scene-audio.md) — `getAudioAnalyser` and the audio plumbing behind `audioReactive`.
- [Networking plugins](39-networking-plugins.md) — sync a show's transport across the room.
- Worked example: [resonance stage](67-example-resonance-stage.md) — bloom, occluded beams, and a synced night show in one plugin.
