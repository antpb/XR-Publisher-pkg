# Example: Town Center

A procedural seeded village on every engine-discovered town: a cobblestone plaza with a well at the exact centre, streets and sidewalks, market stalls, banner poles, a fountain, a readable notice board, named signposts — and timber-framed, fully walk-in buildings facing the square.

Plugin source: `examples/plugins/town-center-xr-publisher-plugin.umd.js` (~2000 lines, fully commented). This is the **reference implementation** for the material-slot mesh writer and `bakeColliders` — the same machinery [Settler Huts](59-example-settler-huts.md) and [Farm Plots](61-example-farm-plots.md) reuse.

[SCREENSHOT: town plaza from the well — cobblestone, market stalls, banner poles, timber-framed buildings ringing the square]

## What it demonstrates

- **`addTerrainRegion`** — the 92u cobblestone town disc. See [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md).
- **`registerTerrainSurface('stone-walk')`** — a custom running-bond slab surface authored in TSL.
- **`addPath`** — ring street, inner circle, spokes, perimeter promenade, and per-building door walks. See [Paths and roads](30-paths-and-roads.md).
- **`registerInteractable` + `openDialog`** — the notice board with seeded town notices. See [Interactables](33-interactables.md), [In-world dialogs](35-in-world-dialogs.md).
- **The material-slot mesh writer** — a plan→compile pipeline producing ≈9 draw calls per building.
- **`bakeColliders`** — rotating explicit collider lists to match a yawed object. See [Decoration collision](26-decoration-collision.md).
- **`getWorldTowns`, `teleportPlayer`, `registerMenuItem`** — towns cache, and a "Jump to nearest town" HUD menu entry. See [Terrain queries](31-terrain-queries.md), [Menu items](36-menu-items.md).

## How it works

### 1. The material-slot mesh writer

Everything — walls, roofs, furniture, the well, benches — compiles through one writer. Callers emit primitives into named *slots*; `build()` produces one merged `BufferGeometry` (and one mesh) per material:

```js
function createWriter() {
  const slots = new Map();
  const bucket = (name) => {
    let b = slots.get(name);
    if (!b) { b = { p: [], n: [], uv: [], ix: [] }; slots.set(name, b); }
    return b;
  };
  // planar quad a→b→c→d, CCW from outside; UVs from real edge distance / uvT
  const quad = (name, a, b, c, d, uvT) => { ... };
  const tri = (name, a, b, c, uvT) => { ... };
  const box = (name, size, t, rot, uvT) => { ... };   // 6 quads, rotated + translated
  const cyl = (name, r0, r1, len, seg, t, rot, caps, uvT) => { ... };
  const blob = (name, c, r, squashY, jitter, rnd) => { ... };  // jittered icosahedron

  const build = (THREE, mats) => {
    const g = new THREE.Group();
    for (const [name, b] of slots) {
      if (b.ix.length === 0 || !mats[name]) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      geo.setIndex(b.ix);
      const mesh = new THREE.Mesh(geo, mats[name]);
      ...
```

Two details worth stealing: **UVs come from real edge distance divided by a texel scale** (`uvT`), so texture density is consistent world-space rather than stretched per-quad; and all materials are **module singletons** (canvas-painted wood/stone/plaster/shingle/thatch textures), so a whole town shares one material set.

### 2. Plan → compile buildings, and `bakeColliders`

A building starts as a semantic plan (footprint, BSP rooms, the door in the widest gap between interior walls, window stations that dodge wall junctions, roof kind, material bands) drawn from `spawn.rng` in a fixed order. The compiler emits walls sliced around openings, dressing (jambs, glass, shutters, lanterns), interiors, roof, ramp — and, in parallel, **hand-authored collider cuboids**: solid wall runs split at doorways, so interiors stay walkable while visuals stay merged. Auto-cuboids would seal the merged mesh shut.

Because colliders mount *beside* the rotated object, not inside it, the final yaw has to be baked into the collider list:

```js
// Bake the building's yaw into its collider list (colliders mount beside
// the rotated object, not inside it).
function bakeColliders(THREE, cols, yaw) {
  const qY = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
  const q = new THREE.Quaternion(); const e = new THREE.Euler(); const v = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  return cols.map((c) => {
    const r = c.rotation || [0, 0, 0];
    q.setFromEuler(new THREE.Euler(r[0], r[1], r[2], 'XYZ')).premultiply(qY);
    e.setFromQuaternion(q, 'XYZ');
    v.set(c.position[0], c.position[1], c.position[2]).applyAxisAngle(UP, yaw);
    return { half: c.half, position: [v.x, v.y, v.z], rotation: [e.x, e.y, e.z] };
  });
}
```

```js
const yaw = faceAngle + (rng() - 0.5) * 0.15;
const g = W.build(THREE, ensureMats(THREE));
g.rotation.y = yaw;
g.userData.xrColliders = bakeColliders(THREE, cols, yaw);
// Door/ramp-foot in LOCAL coords + the final yaw — callers use this to
// start a walking path exactly where the ramp meets the ground.
g.userData.__doorLocal = [doorX, rampFootZ];
g.userData.__yaw = yaw;
return g;
```

One collider deserves special mention — the **shelter collider**: the engine's `sheltered` flag (what the weather plugin gates rain on) is a rapier ray cast straight up that sees colliders, not visuals, so every roof adds one thin cuboid at ceiling height. Without it, it rains inside every building.

### 3. Laying the town ground: region + path network

When `getWorldTowns` surfaces a new town, the plugin pins down its frame **once** at ingestion — a town arrives with both its planner coordinates (`x`/`z`) and their render-frame twins (`renderX`/`renderZ`, see [Terrain queries](31-terrain-queries.md#coordinate-frames)) — and then paints its ground:

```js
// Key from the RAW planner coords — it seeds town names, spoke angles and
// landmark claims, so it must never change with the frame.
const k = `${Math.round(t.x)}_${Math.round(t.z)}`;
// Store the centre in the RENDER frame so every later comparison —
// spawn.renderPosition, the player, regions, paths — shares one frame with
// no corrections. (The −½-chunk arithmetic is only a fallback for engines
// older than renderX/renderZ.)
const town = {
  ...t, key: k,
  x: Number.isFinite(t.renderX) ? t.renderX : t.x - CHUNK_W / 2,
  z: Number.isFinite(t.renderZ) ? t.renderZ : t.z - CHUNK_H / 2,
};
...
const rx = town.x, rz = town.z;   // render-frame town centre
// The FULL town cobble disc — unchanged, this is the town's ground.
XRPublisher.addTerrainRegion({
  id: `town-plaza-${k}`, center: [rx, rz], radius: TOWN_RADIUS,
  surface: 'cobblestone', scale: 0.5, mortar: 0.08, clearGrass: true,
});
```

Buildings and props then measure everything — distance to the plaza, band selection, spoke clearance — with `spawn.renderPosition`, which is already render-frame for every anchor type (the legacy `spawn.worldPosition` is deprecated).

Then the street network: a 14-point ring street, a small inner circle *around* the well (so spokes connect to each other instead of dead-ending at it), five spokes at per-town hashed angles, a 24-point perimeter promenade, and later a door walk per building. Streets use a warm sandy `PATH_TINT`; sidewalks use a cool pale-stone `WALK_TINT` — with `addPath` rendering every path as packed dirt × tint today, **tint is the whole look control** (each walk also declares `surface: 'stone-walk'` so it upgrades the day the engine honors the param).

### 4. Filling the annulus: footprint-aware packing

Each building is its own decoration spawn (so it streams with its chunk), but the engine's `minSpacing` alone starved towns — it thins *candidates* before the plugin gates. The real spacing is a footprint-aware check among *accepted* buildings:

```js
// padded half-diagonal: walls + ramp/porch/overhang clearance
const myR = wallR + FOOT_EXTRA;
for (const a of accepted) {
  const dd = Math.hypot(a.x - wx, a.z - wz);
  if (dd < myR + a.r + STREET_GAP) return null;
}
accepted.push({ x: wx, z: wz, r: myR });
const faceAngle = Math.atan2(tx - wx, tz - wz);     // front (+Z) toward the plaza
```

Plus: a chunk-border margin guarantees cross-chunk pairs can never interpenetrate; type bands by distance from the centre (shops/tavern at the plaza edge → cottages/manors → barns/shacks at the outskirts); and buildings keep their walls off the ring street, spokes, and promenade so houses *line* the streets instead of straddling them.

### 5. Claimed landmarks and the notice board

One-per-town landmarks (well, fountain, notice board, per-junction signposts) use a claim-and-snap pattern: the first prop candidate near the town-hashed target claims it and snaps to the exact spot, carrying its colliders along; claims release in `dispose()` on chunk unload. The notice board wires interaction through `registerInteractable` — not spec-level `interactable`, because the props spec mounts *mixed* prop types and would make every bench interactable too:

```js
requestAnimationFrame(() => {
  if (nb.userData.__disposed) return;
  XRPublisher.registerInteractable({
    id: iid, object: nb, radius: 4.5,
    prompt: 'Read the notice board',
    onInteract: () => openNoticeDialog(townKey),
  });
});
```

The notices themselves are seeded from the town key (market day, a lost cat, road news), as is the town's name ("Thornmere") painted onto signpost boards — the sign board is a plain `BoxGeometry` child with standard 0..1 UVs so the canvas-painted name maps exactly once (the writer's edge-distance UVs would tile it), and its per-spawn material is tracked in `userData.__ownedMats` for disposal.

## Key techniques and gotchas

- **`localXZ`, never `uv()`**, in terrain-surface TSL — `uv()` throws in this engine's node-material path; region-local coordinates also keep hash patterns stable far from the origin.
- **groundPatch as a placement key**: the cobblestone's `clearGrass` registers a town-wide ground patch, and the engine skips non-patch decorations inside patches — so both town specs carry a small `groundPatch` of their own purely to be *allowed* onto the plaza (the cobble region paints over it; it's invisible).
- **Path budget is finite**: the engine keeps the 48 nearest path segments — the 24-segment promenade is deliberate spend; at the plaza the far side may yield to closer trails, distance-gracefully.
- **Emissive budget**: only ~15% of door lanterns burn (`LANTERN_LIT`); the fountain's water reuses the same still, non-emissive `MATS.water` as the well.
- **Register surfaces at plugin init**, before the shared terrain material first compiles — late registration costs a one-time material rebuild. WebGL renders the flat `fallbackColor` for custom surfaces.
- **Every mutable side effect is undone in `dispose()`**: door-walk paths removed, claims released, interactables unregistered, per-spawn sign materials + textures freed, geometry disposed.

## Try it

Deploy: copy into the api `plugins/` directory, `npm run upload-build <build-file>`. For local browsing, `examples/decorations/town-center/index.html` is the matching demo page (an earlier inline plaza + `addModel` teaching version), and `examples/decorations/biome-surfaces/index.html` loads this full plugin file. Once in-world, use the ☰ menu's "Jump to nearest town".

Suggested modifications:

1. **Add a new building type** — a bakery, say: one `makePlan` branch (footprint, roof, bands, `shop: true`) drops it into the ring-band rotation with interiors, colliders, and a door walk for free.
2. **Add a fifth landmark** — e.g. a market cross: follow the fountain's claim-and-snap pattern (`snapTo`, a claim `Set`, a between-spokes target angle, release in `dispose`).

## Next steps

- [Settler Huts](59-example-settler-huts.md) — the same compiler out in the wilds, plus loot, trails, and the abandoned variant.
- [Town Roads](65-example-town-roads.md) — the road network these towns hang off.
- [Terrain regions and surfaces](29-terrain-regions-and-surfaces.md) — `addTerrainRegion`, `registerTerrainSurface`, and the compile-once contract.
- [Rocky Clearings](64-example-rocky-clearings.md) — biome-targeted region painting at smaller scale.
