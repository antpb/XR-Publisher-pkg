# Decoration Instancing

For dense repeated props — rock fields, fence posts, crop rows — mounting one `Object3D` per spawn wastes draw calls on identical geometry. Setting **`instanced: true`** renders *all* of a chunk's spawns through **one `THREE.InstancedMesh` per mesh in your template**, with per-spawn variety baked into the instance matrices.

```js
const rockGeo = new THREE.DodecahedronGeometry(0.35);
const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8275, roughness: 0.95 });

XRPublisher.registerDecoration({
  name: 'rock-field',
  density: 20,               // dense — cheap thanks to instancing
  instanced: true,
  create() {
    // Called ONCE per chunk, as the TEMPLATE — geometry/material source only.
    return new THREE.Mesh(rockGeo, rockMat);
  },
  transform(spawn) {
    // Per-instance variance, baked into the instance matrix.
    return {
      rotationY: spawn.rng() * Math.PI * 2,
      tilt: (spawn.rng() - 0.5) * 0.6,
      scale: 0.4 + spawn.rng() * 1.3,
    };
  },
});
```

(Adapted from the shipped `instanced-models` example — see the [rock field example](57-example-rock-field.md).)

[SCREENSHOT: a dense boulder field rendered as a single instanced draw]

---

## How it works

| Aspect | Instanced behavior |
|---|---|
| `create()` | Called **once per chunk** (with the chunk's first spawn) to produce the **template**. Any root translation on the returned object is stripped — per-instance position comes from the spawns. |
| Rendering | One `InstancedMesh` per mesh found in the template. A template of 3 meshes and 40 spawns is 3 draw calls, not 120. |
| Variance | From `transform(spawn)` only. The template itself should be neutral. |
| Shadows | `castShadow` / `receiveShadow` are copied from each template mesh onto its `InstancedMesh`. |
| Static only | Instancing requires a static spec — see restrictions below. |

Because `create()` runs once, **the template can't vary per spawn**. All visible variety must be expressible as a rigid transform (`transform(spawn)`). If instances need *structural* variety (different mesh per spawn), use a plain static spec instead — the engine still merges static spawns into a few draw calls per chunk, which is nearly as cheap.

---

## transform(spawn)

`transform` receives the full [spawn context](21-decoration-spawn-context.md) and returns per-instance variance:

| Field | Type | Default | Description |
|---|---|---|---|
| `rotationY` | `number` | `0` | Yaw in radians. |
| `scale` | `number` | `1` | Uniform scale multiplier. |
| `tilt` | `number` | `0` | Lean off vertical in radians (applied as a rotation about X before yaw). |

Use `spawn.rng()` for the values so instances are seed-stable. The engine resolves `transform` **exactly once per spawn** and reuses the result for every template mesh and for colliders — so drawing from the stateful `spawn.rng` inside it is safe.

A throwing `transform()` is caught and logged; that instance falls back to the identity transform.

---

## Restrictions

- **Incompatible with `update`.** Instances are baked matrices; there is nothing to tick per frame. A spec with both `instanced: true` and `update` is **not** instanced — the engine logs a warning and falls back to the per-object dynamic path.
- **Incompatible with `interactable`.** Interactable spawns must be individually targetable and removable. Combining them logs a warning and falls back to per-object mounting.
- **Per-instance ground conformance is transform-only.** Instances sit on their spawn points; there's no `groundHeightAt` seating of sub-parts (the template is rigid).

---

## Collision for instanced specs

Adding `collision` (any truthy value) to an instanced spec gives **one cuboid collider per instance**, derived from the template's bounding box, scaled by that instance's `transform` scale and rotated by the same euler its instance matrix uses — so `tilt` and `rotationY` both carry through and a leaning instance gets a leaning collider. All of a chunk's instance colliders mount inside a single fixed rigid body.

```js
XRPublisher.registerDecoration({
  name: 'standing-stones',
  density: 6,
  instanced: true,
  collision: true,           // per-instance cuboid from the template bbox × scale
  create() { return new THREE.Mesh(stoneGeo, stoneMat); },
  transform(spawn) {
    return { rotationY: spawn.rng() * Math.PI, scale: 1 + spawn.rng() };
  },
});
```

Notes:

- The collider is always a **cuboid** regardless of which `collision` value you pass — a per-instance bounding box is the only shape the instanced path supports. `'hull'` and `'trimesh'` are **per-object-spec features only** (see [Collision](26-decoration-collision.md)); passing either to an instanced spec gets you the cuboid.
- The collider is the *template's* box: it can't follow per-spawn shape variation, only the rigid transform. A template much taller than it is wide (a standing stone) collides well; a sprawling irregular one over-claims space at its corners.
- Instance colliders obey the same altitude/flying `collidersActive` gate as terrain colliders.

---

## Cleanup

The engine owns instanced cleanup: on chunk unload it disposes each `InstancedMesh`'s per-instance buffers but **not the template geometry/material** — those are module-level singletons shared across chunks (that's the point). Keep template resources at module scope, as in the example above, and don't dispose them from a custom `dispose`.

---

## Next steps

- [Collision](26-decoration-collision.md) — collider modes in detail
- [Decorations overview](19-decorations-overview.md) — the static merge path (structural variety at low cost)
- [Example: rock field](57-example-rock-field.md) — the shipped instanced demo
