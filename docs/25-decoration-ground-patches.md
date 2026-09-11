# Decoration Ground Patches

A decoration dropped into waving grass looks like exactly that — dropped. The **`groundPatch`** field makes a spawn read as a *deliberate place*: the engine paints a soft circle of dirt on the terrain around it and clears the engine grass out of the circle. A campfire gets a trampled clearing; a shrine gets a bare-earth apron.

```js
XRPublisher.registerDecoration({
  name: 'campfire',
  density: 0.8,
  surface: 'grass',
  maxSlope: 0.2,
  minSpacing: 30,
  collision: true,
  groundPatch: {
    radius: 5,
    color: [0.30, 0.21, 0.13],
    clearGrass: true,
  },
  create(spawn) { /* stones, logs, embers — see the campfires example */ },
});
```

[SCREENSHOT: a campfire in a circular dirt clearing, grass ending cleanly at the edge]

---

## groundPatch reference

| Field | Type | Default | Description |
|---|---|---|---|
| `radius` | `number` | *(required)* | Patch radius in world units. |
| `color` | `[r, g, b]` | neutral brown `[0.34, 0.26, 0.16]` | Dirt color, RGB 0..1. |
| `clearGrass` | `boolean` | `true` | Remove engine grass inside the circle. Set `false` to paint dirt but keep the grass. |

The patch is a soft-edged circular blend composited into the terrain's own material — it follows the terrain surface exactly (no decal mesh, no z-fighting) and works on **both renderers**, WebGPU and the `?renderer=webgl` fallback.

---

## Patches follow actual placements

For per-object specs (solid, dynamic, or custom-`dispose` — the specs whose `create()` can meaningfully decline individual spawns), the engine runs `create()` *first* and registers a patch **only for spawns that actually produced an object**. A gated `create()` — say, town buildings that return `null` away from a town center — leaves **no orphan dirt circles** scattered across the countryside.

Instanced and merged specs register a patch per spawn unconditionally: their single template `create()` says nothing about individual spawns, so every spawn is assumed placed.

```js
create(spawn) {
  if (spawn.biome !== 'buildable') return null;  // no hut here — and no dirt circle either
  return buildHut(spawn.rng);
}
```

---

## Patches clear other decorations

Ground patches are registered in a first pass, before anything else mounts. In the second pass, **every other decoration's spawns whose centers land inside any patch are dropped**. So a campfire's clearing stays clear — no plugin mushrooms or reeds growing through the fire pit — regardless of registration order within the chunk.

The patch-owning spec's own object is of course not cleared by its own patch. Note the test is on spawn *centers*: a wide neighboring object whose center is just outside the circle can still overhang the edge.

---

## Capacity: the nearest-24 rule

Patch circles are passed to the terrain and grass shaders as a small fixed-capacity uniform array of **24 slots** (`MAX_GROUND_PATCHES`). This is a rendering budget, not a world limit:

- If more than 24 patches are live at once (across all loaded chunks and plugins), the **24 nearest to the player** are rendered; farther ones temporarily lose their dirt circle until the player approaches.
- The nearest-N set refreshes as the player moves.
- The *decoration-clearing* behavior (dropping other spawns inside patches) considers **all** registered patches, not just the rendered 24.

Design accordingly: patches are meant for sparse, landmark-scale decorations (campfires, shrines, camps). A `density: 20` scatter with a `groundPatch` will blow the visible budget immediately — use sparse densities and generous `minSpacing`.

---

## Interaction with engine scatter

The same patch circles also suppress the *engine's* own decorations: grass blades collapse inside clearing patches, and engine trees/boulders/shrubs are filtered out of them. The whole clearing — dirt, no grass, no scatter — comes from the single `groundPatch` declaration.

---

## Full example: campfire clearing

Adapted from the shipped `dirt-clearing` example (see also the [campfires example](60-example-campfires.md)):

```js
const { XRPublisher, THREE } = window;

const logMat   = new THREE.MeshStandardMaterial({ color: 0x4a3526, roughness: 0.9 });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6f6a63, roughness: 1 });
const emberMat = new THREE.MeshStandardMaterial({
  color: 0xff5a1f, emissive: 0xff3300, emissiveIntensity: 1.4 });

XRPublisher.registerDecoration({
  name: 'campfire',
  density: 0.8,
  surface: 'grass',
  maxSlope: 0.2,
  minSpacing: 30,
  collision: true,
  groundPatch: { radius: 5, color: [0.30, 0.21, 0.13], clearGrass: true },
  create(spawn) {
    const fire = new THREE.Group();

    // Ring of fieldstones.
    const stones = 8 + Math.floor(spawn.rng() * 3);
    for (let i = 0; i < stones; i++) {
      const s = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18 + spawn.rng() * 0.12), stoneMat);
      const a = (i / stones) * Math.PI * 2 + spawn.rng() * 0.2;
      s.position.set(Math.cos(a) * 0.85, 0.06, Math.sin(a) * 0.85);
      s.rotation.set(spawn.rng() * 3, spawn.rng() * 3, spawn.rng() * 3);
      fire.add(s);
    }

    // Teepee of logs.
    const logs = 4 + Math.floor(spawn.rng() * 2);
    for (let i = 0; i < logs; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.1, 6), logMat);
      const a = (i / logs) * Math.PI * 2 + spawn.rng() * 0.3;
      log.position.set(Math.cos(a) * 0.28, 0.45, Math.sin(a) * 0.28);
      log.rotation.set(0, -a, 0.45);
      fire.add(log);
    }

    // Glowing ember mound.
    const embers = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), emberMat);
    embers.position.y = 0.18;
    fire.add(embers);

    fire.rotation.y = spawn.rng() * Math.PI * 2;
    return fire;
  },
});
```

---

## Next steps

- [Collision](26-decoration-collision.md) — the campfire above is also solid
- [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md) — larger-scale surface replacement (plazas, floors) with the same clearing behavior
- [Example: campfires](60-example-campfires.md) · [Example: rocky clearings](64-example-rocky-clearings.md)
