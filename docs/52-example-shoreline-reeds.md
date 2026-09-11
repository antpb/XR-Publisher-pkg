# Example: Shoreline Reeds

Shoreline life in three layers: static reed clumps with cattails, dragonflies darting in seeded orbits, and fireflies that only appear after dusk — all confined to the grassy band hugging every water edge in the world.

**Plugin file:** `examples/plugins/shoreline-reeds-xr-publisher-plugin.umd.js`

[SCREENSHOT: reeds and cattails at a lake edge at golden hour, a dragonfly hovering with shimmering wings]

## What it demonstrates

- The headline filter pair: [`surface: 'grass'` + `maxWaterDistance`](20-decoration-placement-filters.md) — every spec in this file uses it; the rest is what you can *build* inside that band
- **The reference distance-LOD `update()` pattern** for dynamic decorations: zero allocation, shared low-cadence world reads, closed-form motion in `elapsed`
- Merged vertex-colored geometry for static clumps (one draw call per clump on one shared material)
- Night gating via [`XRPublisher.getTimeOfDay()`](38-time-of-day.md), feature-detected and checked at low cadence
- The mixed `dispose` story: reeds omit `dispose` (unique geometry — default cleanup is right), dragonflies and fireflies override with a no-op (shared geometry)

## How it works

### The band: `surface` + `maxWaterDistance`

```js
XR.registerDecoration({
  name: 'shoreline-reeds',       // NOTE: name seeds placement — renaming relocates every clump
  density: REED_DENSITY,
  surface: 'grass',              // grassy ground only…
  maxWaterDistance: REED_BAND,   // …and within REED_BAND u of a water edge
  minSpacing: 2,
  create(spawn) {
    const mesh = new THREE.Mesh(buildReedClumpGeometry(spawn.rng), reedMat);
    mesh.castShadow = true;      // the meaningful silhouette — worth a shadow
    return mesh;
  },
  // No dispose(): the geometry is unique per clump, so the engine's
  // default cleanup (disposes returned geometry, never materials) is
  // exactly what we want.
});
```

Each clump is one merged `BufferGeometry` — tapered blades with a baked vertex-color gradient (dark waterlogged base to sun-bleached tip) so a single shared `vertexColors` material paints every clump. A seeded fraction carries brown cattail heads. Every blade count, lean, and hue jitter comes from `spawn.rng` in a fixed draw order.

### Shared low-cadence world reads (the anti-N-per-frame pattern)

`update()` runs once per spawn per frame. Anything that is the *same* for all spawns — player position, time of day — must be read once and cached, not N times. The first `update()` of a stale window refreshes for everyone:

```js
let sharedStamp = -1;            // `elapsed` of the last shared refresh
let playerX = 0, playerZ = 0;
let isNight = false;             // fireflies default hidden until we know

const refreshShared = (elapsed) => {
  if (elapsed - sharedStamp < 0.12) return;       // ~8Hz is plenty for range checks
  sharedStamp = elapsed;
  const ps = XR.getPlayerState && XR.getPlayerState();
  if (ps) { playerX = ps.x; playerZ = ps.z; }
  // Time of day only matters to the minute — 2s cadence, feature-detected.
  if (elapsed - todStamp >= 2) {
    todStamp = elapsed;
    if (HAS_TOD) {
      const t = XR.getTimeOfDay();
      const hour = t ? t.time : 12;
      isNight = hour >= NIGHT_START || hour < NIGHT_END;
    } else {
      isNight = true;             // no clock API → graceful: sparks always on
    }
  }
};
```

### The distance-LOD `update()` — the pattern this file exists to teach

The dragonfly spec follows three rules: (1) zero allocation — module-level scratch plus a lazily cached per-object world anchor; (2) shared reads at ~8Hz via `refreshShared`; (3) distance-LOD cadence — full rate near the player, 20Hz mid-range, frozen beyond 60u:

```js
update(df, delta, elapsed) {
  refreshShared(elapsed);                          // shared reads, ~8Hz, once for ALL spawns
  const u = df.userData;
  if (!u.home) cacheHome(df, u);                   // one-time world anchor (one Vector3 per spawn)

  // Range check at ~2Hz, staggered per spawn — not every frame.
  u.rangeAccum += delta;
  if (u.rangeAccum >= 0.5) {
    u.rangeAccum = 0;
    u.dist = Math.hypot(playerX - u.home.x, playerZ - u.home.z);
  }
  // DISTANCE LOD: beyond LOD_FREEZE the dragonfly freezes mid-pose and
  // this update costs two compares. Mid-range runs at 20Hz. Because the
  // motion below is a closed-form function of `elapsed`, skipping frames
  // just samples the same path less often — no drift, no dt integration.
  if (u.dist > LOD_FREEZE) return;
  u.accum += delta;
  const step = u.dist < LOD_NEAR ? 0 : (1 / 20);
  if (u.accum < step) return;
  u.accum = 0;
  // ... closed-form hover + dart, heading from the previous sample ...
}
```

The closed-form motion is the load-bearing choice: because position is a pure function of absolute time, a dragonfly that was frozen for a minute snaps to exactly the right point on its path when you walk back in range — frame-rate independence for free, with no integration drift.

### Fireflies: the cheap night touch

Fireflies are 3–5 emissive quads per spawn, hidden by default and toggled on a ~1Hz staggered check against the shared `isNight` flag. Blink is done by **scale**, not opacity — the material is shared, so per-spark opacity would need per-spark materials; scale gives the same pulse for free. The glow is emissive-only: `emissiveIntensity: 2.5` punches the default bloom threshold if a world enables [post-processing](37-post-processing.md), and still reads as a bright point without it. Never a scene light.

## Key techniques

- **Keep dynamic densities very low.** `update()` runs per spawn per frame, and these specs decorate *every* shoreline in the world. `DRAGONFLY_DENSITY = 0.5` is a deliberate budget, not an oversight.
- **Stagger periodic checks across spawns** (`rangeAccum: rng() * 0.5`) so range checks don't all land on the same frame.
- **Cache the static world anchor once.** The engine's placement wrapper doesn't move, so `getWorldPosition` runs once per spawn — after that, distance checks are pure math.
- **The 40 rad/s wing flap deliberately aliases** at 60fps into exactly the shimmer real dragonfly wings have — cheaper than motion blur.
- **Wings are depth-tested transparency, never `depthTest: false`** — the terrain renders through WebGPU render bundles that would paint over depth-ignoring materials.
- **Feature-detect optional APIs** (`getTimeOfDay`) and degrade gracefully; older runtimes just show fireflies always.

## Try it

- **Local:** `npm run dev`, then open `/decorations/grass-near-water/` — the self-contained inline demo of the same filter pair.
- **Deploy:** copy the plugin file into your api `plugins/` directory and run `npm run upload-build <build-file>`.

Suggested modifications:

1. Widen `REED_BAND` from 8 to 20 and watch the band climb away from the shore — then remember the water scan caps at 24u within-chunk, so bands wider than that lose their meaning.
2. Give the fireflies a slow vertical drift that depends on `delta` instead of `elapsed`, freeze-test it by walking away and back, and watch it drift out of its box — then you'll never write a dt-integrated ambient decoration again.

## Next steps

- [53 — Lake Fish](53-example-lake-fish.md) — the same LOD discipline applied to loaded glTF models, in the water itself
- [51 — Surface Targeting](51-example-surface-targeting.md) — all six surface bands, and instancing for dense statics
- [20 — Placement Filters](20-decoration-placement-filters.md) · [38 — Time of Day](38-time-of-day.md) · [21 — The Spawn Context](21-decoration-spawn-context.md)
