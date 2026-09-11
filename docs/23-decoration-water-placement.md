# Decoration Water Placement

Decorations can live *in* the water — fish in the column, lily pads on the surface, wrecks on the lakebed. Two spec fields work together:

- **`surface: 'water'`** lets spawns land below the waterline in the first place (it drops the default above-waterline height floor — see [Placement filters](20-decoration-placement-filters.md)).
- **`waterPlacement`** tells the engine *where in the water column* to seat the object's origin, so you never hand-compute depth.

```js
XRPublisher.registerDecoration({
  name: 'lake-fish',
  density: 3,
  surface: 'water',
  waterPlacement: 'submerged',
  create(spawn) { /* ... */ },
});
```

---

## waterPlacement modes

| Value | Object origin seated | Use for |
|---|---|---|
| `'floor'` *(default)* | On the lakebed/seabed (the terrain surface under the water) | Wrecks, plants, rocks, anything grounded |
| `'submerged'` | In the water column — midway between the bed and the surface, clearly under | Fish, jellyfish, drifting particles |
| `'surface'` | Exactly at the waterline | Lily pads, buoys, floating lanterns |

`waterPlacement` only applies to spawns that actually land below the waterline; it is ignored elsewhere. That makes it safe to combine with specs that can hit both wet and dry ground — dry spawns sit on the terrain as usual.

[SCREENSHOT: lily pads on the surface, fish visible in the column below]

---

## The wrapper contract: update() animates in local space

The engine carries each object's placement on a **wrapper group, not on the object itself**. Your object's `position` starts at `(0, 0, 0)` *relative to the placed point*, which means a per-frame `update()` can write `object.position` freely — it animates in **local space around the placement** and can never lose or clobber the seat the engine computed.

So a submerged fish bobbing is just:

```js
update(fish, _delta, elapsed) {
  // ±0.15u around the engine's mid-column seat — the placement survives
  fish.position.y = Math.sin(elapsed * 1.5 + fish.userData.phase) * 0.15;
}
```

There's no need to remember, re-read, or re-apply the water depth in `update()` — local `(0,0,0)` is always the placed point.

---

## Full example: floating and submerged

Adapted from the shipped `in-water-creatures` example (also the [lake-fish example](53-example-lake-fish.md)):

```js
const { XRPublisher, THREE } = window;

// AT THE SURFACE — floating lily pads.
const padMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.8 });
XRPublisher.registerDecoration({
  name: 'lily-pad',
  density: 2,
  surface: 'water',
  waterPlacement: 'surface',
  minSpacing: 2,
  create(spawn) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.4 + spawn.rng() * 0.3, 12), padMat);
    pad.rotation.x = -Math.PI / 2;              // lie flat on the surface
    pad.rotation.z = spawn.rng() * Math.PI * 2;
    return pad;
  },
});

// SUBMERGED — an animated glTF fish, loaded once and cloned per spawn.
(async () => {
  const fishModel = await XRPublisher.loadModel(FISH_URL);   // cached per URL
  const size = new THREE.Box3().setFromObject(fishModel).getSize(new THREE.Vector3());
  fishModel.scale.setScalar(0.8 / (Math.max(size.x, size.y, size.z) || 1));

  XRPublisher.registerDecoration({
    name: 'lake-fish',
    density: 3,
    surface: 'water',
    waterPlacement: 'submerged',
    minSpacing: 3,
    create(spawn) {
      const fish = fishModel.clone(true);        // clones share geometry/materials
      fish.userData.phase = spawn.rng() * Math.PI * 2;
      fish.userData.heading = spawn.rng() * Math.PI * 2;
      fish.rotation.y = fish.userData.heading;
      return fish;
    },
    update(fish, _delta, elapsed) {
      const p = fish.userData.phase;
      fish.position.y = Math.sin(elapsed * 1.5 + p) * 0.15;
      fish.rotation.y = fish.userData.heading + Math.sin(elapsed * 0.4 + p) * 0.5;
    },
    // Clones share the cached model's resources — never let the default
    // cleanup dispose them.
    dispose() {},
  });
})();
```

---

## Manual control: spawn.waterLevel

For placements the three modes don't cover — a periscope breaking the surface, a creature that patrols a specific depth — the spawn context exposes the raw numbers:

- `spawn.position[1]` — the bed height (the object's seat under the default `'floor'` mode).
- `spawn.waterLevel` — the local Y of the water surface, **in the same frame as `position[1]`**.

The water column depth at the spawn is `spawn.waterLevel - spawn.position[1]` (positive for underwater spawns). Offset your object within `create()`:

```js
create(spawn) {
  const kelp = buildKelp(spawn.rng);
  const depth = spawn.waterLevel - spawn.position[1];
  kelp.scale.y = Math.min(1, depth / 3);   // grow toward, but not past, the surface
  return kelp;
}
```

If you offset manually, prefer leaving `waterPlacement` at its `'floor'` default so the engine's seat and your offset don't compound.

---

## Notes

- **Waves are cosmetic.** The visible water surface animates, but the logical waterline (`spawn.waterLevel`) is flat — a `'surface'`-placed object sits at the mean line, not on the moving crest.
- **Depth knowledge is per-spawn.** `waterLevel` is sampled where the spawn is; a long object spanning deep and shallow water should sample the terrain itself (see `groundHeightAt` in [Spawn context](21-decoration-spawn-context.md), noting it's the *bed* height for water spawns).
- **Collision + water movers don't mix.** As everywhere, don't pair `collision` with an `update()` that swims the object away — the collider stays where it was mounted. See [Collision](26-decoration-collision.md).

---

## Next steps

- [Placement filters](20-decoration-placement-filters.md) — `surface: 'water'` and `maxWaterDistance`
- [Spawn context](21-decoration-spawn-context.md) — `waterLevel` and friends
- [Example: lake fish](53-example-lake-fish.md) — the full in-water creatures demo
