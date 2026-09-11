# Decoration Collision

By default, decorations are visual only — the player walks straight through them. The **`collision`** field makes spawns solid, mounting each one inside a fixed physics body. For walk-in structures with doorways and interiors, the **`userData.xrColliders`** escape hatch lets you author precise box colliders by hand while keeping the visual geometry merged and cheap.

```js
XRPublisher.registerDecoration({
  name: 'settler-hut',
  density: 0.6,
  minSpacing: 35,
  maxSlope: 0.12,
  minWaterDistance: 10,
  collision: true,           // solid — auto cuboid colliders
  create(spawn) {
    if (spawn.treeDistance < 5) return null;
    return buildHut(spawn.rng);
  },
});
```

---

## Collision modes

| Value | Collider shape | Cost | Use for |
|---|---|---|---|
| `true` | Same as `'cuboid'` | — | Shorthand. |
| `'cuboid'` | One box per mesh in the object (physics auto-colliders) | Cheap | Buildings, crates, boulders — anything box-ish. The right default. |
| `'hull'` | Convex hull per mesh | Moderate | Rounded solid shapes the box would misrepresent. |
| `'trimesh'` | Exact triangle mesh per mesh | **Expensive — cooks synchronously on the main thread at chunk mount** | Only when the exact surface matters. A few per chunk at most; a dense trimesh spec will hitch chunk streaming. |

Auto-colliders are generated **per mesh** in the returned object tree. That's why a merged single-mesh building gets one giant box (see the explicit-colliders section below), and why a multi-part object gets a reasonable compound of boxes for free.

The `'hull'` and `'trimesh'` modes are **per-object specs only**. For an **instanced** spec, `collision` (any truthy value) always produces one bounding-box cuboid per instance — sized from the template box and carrying that instance's `transform` scale, `rotationY` and `tilt`. See [Instancing](24-decoration-instancing.md).

---

## The collidersActive gate

All decoration colliders share the engine-wide gate that also controls terrain and tree colliders: while the player is flying high above the terrain, colliders are unmounted entirely (nothing up there to collide with), and they re-mount as the player descends toward the ground. This is automatic — but be aware that a solid decoration is only *conditionally* solid, so don't build gameplay that depends on colliding with a decoration mid-flight.

---

## Rule: solid objects must not move

Colliders are **fixed** — mounted once at the spawn's placement. Do not pair `collision` with an `update()` that moves the object: the visual will move and the collider will stay behind. Animate *within* the footprint (a flickering flame, a spinning sign face) or drop the collider.

---

## Explicit colliders: userData.xrColliders

Auto-cuboid has a failure mode for walk-in structures: if you merge a building's visual geometry into one mesh (the right call for draw-call cost), the auto-collider wraps the whole merged mesh in **one giant impassable box** — no doorway, no interior. And un-merged (a mesh per wall) is expensive to render.

The efficient path: **merge the visuals, author the colliders by hand.** If the object returned by `create()` carries a `userData.xrColliders` array, those cuboids are mounted **instead of** any auto-colliders:

```js
create(spawn) {
  const hut = buildMergedHut(spawn.rng);   // few meshes, one per material

  hut.userData.xrColliders = [
    // Four walls with a doorway gap in the south wall:
    { half: [2.0, 1.4, 0.15], position: [ 0,   1.4, -2.0] },              // north
    { half: [0.15, 1.4, 2.0], position: [-2.0, 1.4,  0  ] },              // west
    { half: [0.15, 1.4, 2.0], position: [ 2.0, 1.4,  0  ] },              // east
    { half: [0.7, 1.4, 0.15], position: [-1.3, 1.4,  2.0] },              // south, left of door
    { half: [0.7, 1.4, 0.15], position: [ 1.3, 1.4,  2.0] },              // south, right of door
    // A rotated interior bench:
    { half: [0.8, 0.25, 0.2], position: [0.6, 0.25, -1.2], rotation: [0, Math.PI / 5, 0] },
  ];
  return hut;
}
```

### Entry format

Each entry is a box in the **object-local frame** (the frame your meshes are built in, before the engine places the object):

| Field | Type | Required | Description |
|---|---|---|---|
| `half` | `[hx, hy, hz]` | yes | Half-extents in units (a `half` of `[1, 1.4, 0.15]` is a 2 × 2.8 × 0.3 wall). Floored at 0.01. |
| `position` | `[x, y, z]` | yes | Box center, object-local. |
| `rotation` | `[rx, ry, rz]` | no | Euler angles in radians, THREE `'XYZ'` order. |

Malformed entries are skipped; if none are valid, the spec falls back to its auto-collider mode.

### Bake your root rotation

The colliders mount *beside* the object inside the physics body, **not inside your object's transform**. If `create()` rotates the returned root (`hut.rotation.y = spawn.rng() * Math.PI * 2`), the visuals rotate but the collider list does not — you must bake that yaw into the collider positions/rotations yourself:

```js
function bakeColliders(colliders, yaw) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  return colliders.map((c) => ({
    half: c.half,
    position: [
      c.position[0] * cos + c.position[2] * sin,
      c.position[1],
      -c.position[0] * sin + c.position[2] * cos,
    ],
    rotation: [c.rotation?.[0] ?? 0, (c.rotation?.[1] ?? 0) + yaw, c.rotation?.[2] ?? 0],
  }));
}

create(spawn) {
  const yaw = spawn.rng() * Math.PI * 2;
  const hut = buildMergedHut(spawn.rng);
  hut.rotation.y = yaw;
  hut.userData.xrColliders = bakeColliders(HUT_COLLIDERS, yaw);
  return hut;
}
```

The shipped `town-center` and `farm-plots` plugins are the reference implementations of this pattern (material-slot mesh writer + `bakeColliders`).

[SCREENSHOT: player standing inside a hut — merged visual mesh, hand-authored wall colliders with a doorway]

---

## Choosing an approach

| Situation | Use |
|---|---|
| Simple solid prop (crate, boulder, statue) | `collision: true` |
| Rounded solid the box misrepresents | `collision: 'hull'` |
| Exact surface needed, rare object | `collision: 'trimesh'` (sparingly) |
| Dense instanced props | `instanced: true` + `collision: true` (per-instance bbox) |
| Walk-in structure, merged visuals | `collision: true` + `userData.xrColliders` |
| Moving/animated object | No collision |

---

## Next steps

- [Instancing](24-decoration-instancing.md) — per-instance colliders
- [Persistent decorations](46-persistent-decorations.md) — why a `persist` spec gets no colliders, and what to use instead
- [Ground patches](25-decoration-ground-patches.md) — clearings around solid landmarks
- [Example: settler huts](59-example-settler-huts.md) · [Example: town center](62-example-town-center.md) — the walk-in-structure reference
