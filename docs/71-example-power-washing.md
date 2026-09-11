# Example: Power Washing (aim-driven game mechanic)

A complete PowerWash-style game: grimy timber-framed cottages scatter on flat
ground, each with a pressure washer parked by the door. Press **E** to equip
it, then **hold mouse/F** and aim — a water jet streams from the avatar's
hand to the world cursor, and the grime erases exactly where it lands, streak
by streak, until the house is spotless. Progress shows in a HUD meter and
persists per house for everyone.

This is the flagship example for **aim-driven mechanics** — the "equip a tool
and act on the world where the player points" pattern that generalizes to
spray-painting, watering, repairing, scorching, harvesting-with-a-tool.

## What it demonstrates

- **Third-person aim via the world cursor** — `getCursorState().position` as
  the target, a hand→cursor raycast for the surface hit. See
  [44 — Aim, Input & Avatar Attachment](44-aim-input-and-hands.md).
- **Equip-mode lifecycle** — spec-level interactable with a contextual
  function prompt ("Equip pressure washer" → "Put away pressure washer" →
  "Sparkling clean ✨"), one plugin-owned rAF alive only while equipped,
  60Hz-capped, with a 1Hz leash that auto-unequips when the player walks off.
- **Held tool on the avatar** — the wand chases the VRM right-hand bone's
  world position each frame and `lookAt`s the cursor point, so it aims
  correctly even when the idle body faces elsewhere.
- **Localized surface painting** — per-face grime `CanvasTexture` overlays,
  `destination-out` soft-circle erases at the hit UV, uploads batched to
  ~10Hz, progress on a coarse cell grid (never `getImageData`). See
  [45 — Effect Particles & Render Ordering](45-effects-and-render-order.md).
- **Opaque emissive water particles** — instanced spheres, scale-envelope
  fades; correctly occluded by the house, never painted over by terrain.
- **Per-object persistence** — one tiny `{ p, t }` record per house keyed by
  `spawn.seed` with `pos` from `spawn.renderPosition`, chunk-prefix fetch in
  `create()`, one `subscribeWorldState` convergence path, and **deterministic
  pre-erase** so a half-washed house reloads half-washed. See
  [41 — World State](41-world-state.md).
- **A building worth the effort** — the settler-huts material-slot writer
  (one merged mesh per material), canvas-painted plaster/timber/shingle,
  gable roof, stone plinth, hand-authored yaw-baked cuboid colliders + the
  roof shelter collider.

## The core loop, distilled

```js
const frame = (now) => {
  rafId = requestAnimationFrame(frame);
  if (now - last < 14) return;                    // ~60Hz cap
  if (document.hidden || !equipped) return;

  readCursor(TARGET);                             // getCursorState() → aim point
  handWorldPos(TIP);                              // right-hand bone world pos
  DIR.copy(TARGET).sub(TIP); const d = DIR.length(); DIR.multiplyScalar(1 / d);

  wand.position.copy(TIP); wand.lookAt(TARGET);   // tool points where you aim

  raycaster.set(TIP, DIR); raycaster.far = d + 0.75;  // just past the cursor
  const hits = raycaster.intersectObjects(dirtMeshes, false);
  if (spraying && hits.length && hits[0].uv) {
    erase(faceOf(hits[0].object), hits[0].uv.x, hits[0].uv.y, RADIUS);
    // droplet InstancedMesh streams TIP → hit point; splash pool at impact
  }
  // ≤10Hz: flush touched canvases (tex.needsUpdate); ≤4Hz: HUD; 1Hz: leash
};
```

The erase itself is a soft radial gradient with `destination-out`, mirrored
into a `Uint8Array` cell grid whose cleared/total ratio is the progress —
analytic, allocation-free, and cheap enough to run per hit.

## Design notes

- **Why hand→cursor and not a camera ray**: the default view is third person.
  The cursor already encodes "what the player means"; casting from the hand
  to that point makes the water physically travel the visible path, and the
  `far` cap means you can't wash surfaces the stream never reaches.
- **Why opaque emissive spray**: terrain render bundles ignore `renderOrder`,
  so additive transparent particles paint behind the world. Opaque emissive
  instanced spheres depth-sort correctly *and* hide behind walls — which the
  `depthTest:false` beam recipe would break.
- **Why one record per house**: the server enforces a ~32u writer-distance
  rule against each record's `pos`. Per-house records written while standing
  at that house always pass; one shared array under a single key can't. It
  also removes read-modify-write races between players entirely.
- **Why percent-only persistence**: the full erase mask would be kilobytes;
  a percent plus a seeded blotch pre-apply is bytes, and reloads read as
  believable partial work.
- **Grime overlays float 0.09u proud** of the wall — above the window sills
  and timber trim (≤0.08u), so the trim reads as coated too and one overlay
  covers the whole facade.

## Extending it

1. Different tools: nozzle widths (radius/pressure tradeoff), soap that
   multiplies erase radius for a few seconds.
2. Jobs & rewards: a menu item listing dirty houses with distances; pay per
   percent via a persisted wallet record.
3. Multiplayer co-op: peers' erases already converge through world state —
   add a `broadcast` channel to show *their* water jets live.
4. Re-soiling: derive a grime-regrowth factor from `Date.now() - rec.value.t`
   at create time (the TTL already resets abandoned houses).
5. VR support: when a controller-trigger input API lands, map hold-trigger to
   `spraying` — everything else already works.
