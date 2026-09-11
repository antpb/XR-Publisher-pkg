# Example: Canopy Lanterns

Warm glowing lanterns hanging from the canopies of the engine's procedural trees — the shortest of the anchor examples, and the clearest statement of the `anchor:'tree'` hanging contract.

**Plugin file:** `examples/plugins/canopy-lanterns-xr-publisher-plugin.umd.js`

[SCREENSHOT: amber lanterns dangling from tree canopies along a forest path at dusk]

## What it demonstrates

- [`anchor: 'tree'`](22-decoration-anchors.md) — spawns attach to the underside of *real* canopy blob surfaces; `density` is the per-tree chance
- **Hanging with negative local Y** — local y=0 *is* the leaf surface, so the object builds downward from it
- The spawn context fields tree anchors carry: `spawn.anchorScale` / `spawn.anchorRadius` describe the crown ([Spawn Context](21-decoration-spawn-context.md))
- Emissive glow with no scene light

## How it works

The whole plugin is one spec. The engine picks the anchor point on the lower-hemisphere surface of an actual canopy blob (from the tree's collider data), so local `(0, 0, 0)` is a genuine leaf-surface attachment point. The lantern builds *down* from it:

```js
XRPublisher.registerDecoration({
  name: 'canopy-lantern',
  anchor: 'tree',            // ← anchor on the canopy UNDERSIDE
  density: 0.4,              // ~40% of trees get one
  // The anchor sits on a REAL canopy blob's underside (local y=0 = the
  // leaf surface). Attach the lantern THERE — its top touches the leaf,
  // globe just below on a short cord. No long fake drop: the placement is
  // accurate, so the lantern genuinely hangs off the foliage.
  create(spawn) {
    const g = new THREE.Group();
    const cord = 0.12;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, cord, 4), ringMat);
    string.position.y = -cord / 2;              // top at y=0, on the leaf surface
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 8), ringMat);
    cap.position.y = -cord + 0.02;
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), lanternMat);
    globe.position.y = -cord - 0.26;
    g.add(string, cap, globe);
    return g;
  },
});
```

Every position is negative Y: the cord's top sits exactly at the anchor (the leaf surface), the cap and globe hang below it. This is the contract for tree-anchored decorations — build the object *touching* y=0 with a short hang below, not a long fake string papering over a placement gap. The engine's anchor is accurate; trust it.

The glow is a shared emissive material, defined once at module level:

```js
const lanternMat = new THREE.MeshStandardMaterial({
  color: 0xffcc66, emissive: 0xaa6600, emissiveIntensity: 0.7, roughness: 0.5,
});
```

## Key techniques

- **Negative local Y is the hanging idiom.** For `anchor: 'tree'`, y=0 is the underside of the foliage; anything at positive Y would be buried inside the canopy.
- **Emissive material, never a point light.** Dozens of lanterns as scene lights would be catastrophic — scene light count must stay constant after load, and every added light forces a whole-world material recompile. `emissiveIntensity: 0.7` reads warm without post-processing and picks up [bloom](37-post-processing.md) where a world enables it.
- **`density` on anchored specs is a per-tree chance,** not a per-area count — `0.4` means roughly 40% of trees carry a lantern.
- **Default cleanup fits here.** The spec builds fresh small geometries per spawn and shares only materials, so it needs no `dispose` override — the engine disposes returned geometry, never materials. (For a denser decoration you'd hoist the cylinder/cone/sphere geometries to module singletons and add a no-op `dispose() {}` — see [Minimal Mushrooms](50-example-minimal-mushrooms.md).)
- **Tree anchors arrive asynchronously.** The engine places against real canopy collider data when it lands, falling back to a single-sphere crown approximation before that — your plugin doesn't need to care, but don't be surprised if lanterns refine position moments after a chunk loads.

## Try it

- **Local:** `npm run dev`, then open `/decorations/on-trees/` — the self-contained inline `anchor:'tree'` demo.
- **Deploy:** copy the plugin file into your api `plugins/` directory and run `npm run upload-build <build-file>`.

Suggested modifications:

1. Vary the lantern per tree with `spawn.rng` — cord length, globe size, or a seeded pick between two shared emissive materials (paper-white vs amber). Keep every draw in a fixed order.
2. Scale the lantern by `spawn.anchorScale` so grand old trees carry grander lanterns.

## Next steps

- [55 — Apple Trees](55-example-apple-trees.md) — the same anchor made interactable: press E to pick
- [50 — Minimal Mushrooms](50-example-minimal-mushrooms.md) — the sibling `anchor:'tree-base'`, at the trunk's foot
- [56 — Summit Totems](56-example-summit-totems.md) — `anchor:'mountain'`, one spawn per peak
- [22 — Anchors](22-decoration-anchors.md) · [21 — The Spawn Context](21-decoration-spawn-context.md)
