# Effect Particles & Render Ordering

Water jets, sparks, magic trails, dust — every plugin eventually wants a
particle effect, and the first attempt is usually an additive transparent
material that promptly **renders behind the terrain**. This page is the
contract for making effects draw correctly on both renderers.

## Why additive particles lose to terrain

Terrain chunks render through **WebGPU render bundles**, which replay cached
GPU commands and **ignore `renderOrder`**. For opaque geometry the depth
buffer arbitrates and everything sorts correctly — but a transparent additive
mesh with `depthWrite: false` doesn't stake a depth claim, and the bundle
replay can paint terrain straight over it regardless of any `renderOrder` you
set. The result: your spray/beam/glow flickers behind hills and ground.

## Rule 1 — default to OPAQUE EMISSIVE particles

The music-visualizer's answer, and the right default for physical effects
(water, sparks, debris, projectiles):

```js
const mat = new THREE.MeshStandardMaterial({
  color: 0x0a1420,            // dark base
  roughness: 0.25, metalness: 0,
  emissive: 0x9fd4ff,          // the glow
  emissiveIntensity: 2.2,
});
const pool = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 5, 4), mat, 64);
pool.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
pool.frustumCulled = false;    // instances move via direct matrix writes
```

- Opaque + default depth test/write ⇒ sorts against terrain AND is correctly
  occluded by walls (a water jet behind a house should not be visible).
- Glow comes from `emissive` (blooms automatically when the world enables
  post-processing) — never from additive blending.
- **Fade by scale envelope, never by opacity**: `scale = (1 - t) * k`. Alpha
  fades force transparency and reopen the whole problem.
- `PointsMaterial` does not render under WebGPU — always instanced meshes.

## Rule 2 — additive only for light, with the punch-through kit

Volumetric *light* (beams, lasers, glow fans) genuinely needs additive
blending. The resonance-stage recipe, when you must draw light over terrain:

```js
mat.transparent = true;
mat.depthWrite = false;
mat.depthTest = false;         // terrain's hardware depth can never clip it
mat.blending = THREE.AdditiveBlending;
mat.toneMapped = false;        // don't let the tone mapper dim the glow
mesh.renderOrder = 110;        // above the cloud deck (100–103) and rain (50)
mesh.frustumCulled = false;
```

Consequences you must handle:

- `depthTest: false` punches through **everything** — buildings and avatars
  too. Restore solid occlusion with the engine's selective mask:
  `opacity × XRPublisher.occlusionMaskNode()` (TSL, WebGPU) after
  `XRPublisher.setLightingOcclusion(true)`. **Desktop-only** — the mask pass
  corrupts rendering on touch devices; never enable it there. The WebGL twin
  keeps `depthTest: true` and lives with terrain clipping.
- The engine's transparent decks have a renderOrder ladder: rain sits at 50,
  procedural clouds at 100–103. Additive effects that must draw over the sky
  go to ≥110; surface-hugging haze stays low with `depthTest: true`.
- **Additive + `instanceColor` renders black** — use the material's `color`
  and per-instance scale envelopes instead.

Decision rule: *is the effect matter or light?* Matter (water, sparks, chips,
smoke puffs) → Rule 1. Light (beams, halos, lasers) → Rule 2.

## Localized surface effects (wash, paint, scorch, frost)

For effects that permanently mark a surface **where the player aims**, the
shipped pattern is a per-spawn `CanvasTexture` overlay:

1. Float a `PlaneGeometry` a few cm proud of the real surface
   (`transparent: true`, `depthWrite: false` — it hugs an opaque wall, so
   depth-testing still occludes it correctly). Float it far enough to clear
   window sills and trim (~0.09u), which then read as being coated too.
2. Paint the overlay once at create time from a **seeded** rng
   (`utils.alea(spawn.seed + '-dirt')`).
3. On each aim hit, get the UV from your raycast intersection and draw into
   the canvas — `destination-out` erases (washing), `source-over` adds
   (painting) — with a soft radial gradient.
4. **Batch GPU uploads**: set `texture.needsUpdate` at most ~10Hz for the
   canvases touched in the window, never per hit.
5. Track progress on a coarse **cell grid** (`Uint8Array`, ~0.3u cells) —
   analytic and allocation-free; never `getImageData` per frame.
6. Persist a tiny record (`{ p: percent, t }`) via
   [world state](41-world-state.md) and **re-apply deterministically** on
   reload: seeded-random blotches until the saved percent is reached looks
   like genuine partial work.

Full implementation: [71 — Power Washing](71-example-power-washing.md).

## Checklist

- Physical particles: opaque emissive instanced mesh, scale-envelope fades,
  `frustumCulled = false`, `DynamicDrawUsage`.
- Light: additive + `depthTest:false` + `renderOrder ≥ 110` + `toneMapped:false`,
  occlusion mask on desktop WebGPU, WebGL twin keeps depth test.
- Surface marks: canvas overlay + UV raycast + batched `needsUpdate` + cell grid.
- Never: `PointsMaterial`, alpha fades on particle pools, `instanceColor` on
  additive materials, per-hit texture uploads, scene lights for glow.
