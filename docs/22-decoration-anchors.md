# Decoration Anchors

By default, decoration spawns scatter over the terrain heightfield. The `anchor` field instead attaches spawns to **specific world features** — the engine's procedurally-placed trees and mountains — using their real geometry, so a lantern touches an actual leaf surface and a totem stands on the actual walkable summit.

| Anchor | Attaches to | Local origin (y = 0) |
|---|---|---|
| `'terrain'` *(default)* | The chunk heightfield grid | The ground point |
| `'tree'` | The **underside of a real canopy blob** on an engine tree | The leaf-surface attachment point — build *hanging downward* |
| `'tree-base'` | The trunk/terrain contact point of an engine tree | The ground at the trunk base |
| `'mountain'` | The real mountain mesh surface, in the **top ~2%** of the peak | The summit surface (seated slightly into it) |

Anchored placement bypasses the terrain grid entirely, which has two consequences:

- **Terrain placement filters don't apply**: `minHeight`/`maxHeight`, `maxSlope`, `minWaterDistance`/`maxWaterDistance`, `surface`, `biomes`, `minSpacing`, and `avoidRoads` are not evaluated for anchored specs — don't set them there, they describe ground the spawn never touched. The spawn's terrain-context fields (`surface`, `biome`, `slope`, `waterDistance`, `normalizedHeight`) are **fixed placeholders**, not measurements, so don't branch on them either — see [Spawn context](21-decoration-spawn-context.md#anchored-spawns-what-changes).
- **`density` changes meaning**: for `'tree'`/`'tree-base'` it's the per-tree chance (0..1, capped at 1 — `0.4` ≈ 40% of trees); for `'mountain'` it rounds to a per-peak item count.

Anchored spawns gain two extra context fields: `anchorScale` and `anchorRadius` (see each anchor below). Both are **radii of the anchor geometry** in world units — `anchorScale` is *not* the host tree's scale factor.

---

## anchor: 'tree' — hanging from the canopy

Engine trees are built from a trunk plus 2–4 canopy "blob" spheres. A `'tree'` anchor picks one real blob and places the spawn **on the lower-hemisphere surface of that sphere**, biased toward the underside — the spot something can genuinely hang from.

The spawn's local origin (y = 0) **is the leaf-surface attachment point**. Build your object hanging *downward* — into **negative local Y** — so the top of the object touches the leaves and the rest dangles below. Don't add a long cord to paper over a gap; the placement is accurate, so a short hang reads right.

`spawn.anchorScale` and `spawn.anchorRadius` both carry the attached blob's radius.

```js
// Lanterns hung from tree canopies (from the canopy-lanterns example)
XRPublisher.registerDecoration({
  name: 'canopy-lantern',
  anchor: 'tree',
  density: 0.4,              // ~40% of trees get one
  create(spawn) {
    const g = new THREE.Group();
    const cord = 0.12;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, cord, 4), ringMat);
    string.position.y = -cord / 2;                // top at y=0, on the leaf surface
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 8), ringMat);
    cap.position.y = -cord + 0.02;
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), lanternMat);
    globe.position.y = -cord - 0.26;
    g.add(string, cap, globe);
    return g;
  },
});
```

[SCREENSHOT: lanterns dangling from the underside of tree canopies at dusk]

---

## anchor: 'tree-base' — clusters at the trunk

`'tree-base'` gives **one anchor per tree** at the exact point where the trunk meets the terrain (local y = 0 is the ground). It's made for clusters: mushrooms, roots, ground litter ringing a trunk.

`spawn.anchorRadius` is a ring radius sized just outside the trunk (at least 1.2 units, scaling with trunk thickness). Scatter your cluster into it with `spawn.rng`:

```js
// Mushroom clumps at tree bases (from the at-tree-base example)
XRPublisher.registerDecoration({
  name: 'tree-base-mushrooms',
  anchor: 'tree-base',
  density: 0.7,              // ~70% of trees get a clump
  create(spawn) {
    const clump = new THREE.Group();
    const outer = Math.max(0.5, spawn.anchorRadius || 1.2);
    const inner = outer * 0.45;                    // keep clear of the trunk itself
    const count = 3 + Math.floor(spawn.rng() * 4); // 3–6 mushrooms
    for (let i = 0; i < count; i++) {
      const ang = spawn.rng() * Math.PI * 2;
      const rad = inner + spawn.rng() * (outer - inner);
      const mush = makeMushroom(spawn.rng);
      mush.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      mush.rotation.y = spawn.rng() * Math.PI * 2;
      clump.add(mush);
    }
    return clump;            // engine seats the group at the trunk base
  },
});
```

Every tree has a trunk, so — unlike `'tree'`, which needs canopy blobs — every accepted tree yields a spawn.

---

## anchor: 'mountain' — summit placement

`'mountain'` places spawns on the **real mountain mesh surface** (the sculpted marching-cubes surface the player actually walks on — *not* the terrain heightfield under it), scattered in a disc near the apex and accepted only within the **top ~2%** of the peak's height. Each peak is owned by exactly one chunk, so there are never cross-chunk duplicates.

- `density` rounds to the number of items per peak (`density: 1` → one totem per summit).
- `spawn.anchorScale` is the mountain's base radius; `spawn.anchorRadius` is the summit scatter-disc radius.
- The object is seated slightly *into* the surface to cover mesh noise — build from y = 0 upward.

```js
// One totem per peak (from the summit-totems example)
XRPublisher.registerDecoration({
  name: 'summit-totem',
  anchor: 'mountain',
  density: 1,
  create(spawn) {
    const totem = new THREE.Group();
    const stack = 3 + Math.floor(spawn.rng() * 2);
    for (let i = 0; i < stack; i++) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), totemMat);
      seg.position.y = 0.55 + i * 1.1;
      seg.rotation.y = spawn.rng() * 0.5;
      totem.add(seg);
    }
    return totem;
  },
});
```

[SCREENSHOT: glowing totem standing on a snow-capped summit]

---

## Async tree data and re-scatter

Precise tree anchoring depends on per-tree collider data (trunk capsule + canopy blob spheres) that arrives **asynchronously** — it's produced by the tree-geometry build in the terrain worker, slightly after the chunk's terrain appears.

The engine handles the race for you:

1. **Before the data lands**, tree anchors fall back to an approximation built from the tree's spawn position and scale: a single-sphere crown estimate for `'tree'`, and a scale-derived ring for `'tree-base'`.
2. **When the real collider data arrives**, any chunk with a tree-anchored spec **re-scatters automatically**: the fallback objects are disposed and `create()` runs again against the real canopy geometry.

Practical implications:

- `create()` must tolerate running more than once per chunk (it already should — chunks stream in and out as the player roams).
- Don't cache cross-spawn state keyed only by chunk inside your plugin assuming one scatter pass.
- Momentarily-approximate placement right as a chunk loads is expected and brief.

Worlds with no tree-anchored specs skip all of this — the re-scatter subscription only engages when a `'tree'` or `'tree-base'` spec is registered.

---

## Determinism notes

Anchored placement follows the same rules as terrain scatter: the per-tree accept draw and per-spawn PRNG are seeded from `(world seed, decoration name, chunk, tree index)`, and summit spawns from `(world seed, decoration name, mountain id)` — so the same trees carry the same lanterns and the same peaks the same totems every visit. Renaming the decoration relocates everything, as always.

---

## Next steps

- [Spawn context](21-decoration-spawn-context.md) — `anchorScale` / `anchorRadius` reference
- [Decorations overview](19-decorations-overview.md) — lifecycle and determinism rules
- [Example: canopy lanterns](54-example-canopy-lanterns.md) · [Example: apple trees](55-example-apple-trees.md) · [Example: summit totems](56-example-summit-totems.md)
