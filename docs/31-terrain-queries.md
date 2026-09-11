# Terrain Queries

Read-only queries against the procedural world: ground height, water, biome, seed, and player state. These are the sensing half of programmatic world building — use them to pick sites, seat objects, route around lakes, and gate effects.

All of these are static methods on `XRPublisher` (and available on `window.XRPublisher` for script-tag plugins).

---

## Quick reference

| Method | Returns | Availability |
|---|---|---|
| `getGroundHeight(x, z)` | `number \| null` | `null` until a terrain **collider** is loaded near the point — poll/retry |
| `sampleTerrain(x, z)` | `TerrainSample \| null` | `null` before a procedural terrain mounts; works at any distance |
| `isWaterAt(x, z)` | `boolean \| null` | same as `sampleTerrain` |
| `getWorldSeed()` | `string \| null` | `null` before a procedural terrain mounts |
| `getBiomeAt(x, z, seed?)` | `BiomeType \| null` | `null` before a seed exists (unless you pass one) |
| `getBiomeWeights(x, z, seed?)` | `Record<BiomeId, number> \| null` | same |
| `getOceanFade(x, z, seed?)` | `number \| null` (0..1) | same |
| `getPlayerState()` | `{ x, y, z, isSwimming, isFlying, sheltered } \| null` | `null` before the player mounts |
| `teleportPlayer(x, y?, z)` | `void` | any time after the player mounts |

---

## `getGroundHeight(x, z) → number | null`

The **exact** ground contact: a physics raycast onto the terrain colliders (the same path teleport and spawn use). Returns the world-space surface Y — the value to put straight into an `addModel`/`addSolid` `position[1]`.

Returns `null` when the world isn't ready or **no terrain collider is loaded near that point** — colliders stream in with chunks and are culled entirely while the player flies high above the terrain. Always poll/retry:

```js
const y = XRPublisher.getGroundHeight(320, -320);
if (y != null) {
  XRPublisher.addModel({ url, position: [320, y, -320], collidable: true });
} else {
  // not loaded yet — retry in a bit
}
```

## `sampleTerrain(x, z) → TerrainSample | null`

The **approximate** height/water query that works *anywhere* — no raycast, no player proximity, no loaded chunk required. It replicates the terrain heightfield pipeline (noise → biome multiplier → ocean-basin subtraction → the 0.48 waterline) in plain JS.

```ts
interface TerrainSample {
  worldY: number;            // world Y of the terrain surface
  normalizedHeight: number;  // 0..1; < 0.48 is underwater
  isWater: boolean;          // surface sits below the waterline
}
```

It deliberately skips mountain base influence (a local raise right at a mountain's foot), so it's a close approximation — exact enough to route paths around water and pick dry build sites, **not** for collision or precise seating. For exact contact near the player, use `getGroundHeight`.

```js
if (XRPublisher.sampleTerrain(x, z)?.isWater) {
  // route around it
}
```

## `isWaterAt(x, z) → boolean | null`

Convenience wrapper: `sampleTerrain(x, z)?.isWater` — is the point below the 0.48 waterline? Same approximation and availability as `sampleTerrain`.

## `getWorldSeed() → string | null`

The active world seed (the `seed` attribute on the `<three-terrain-block>`), or `null` before a procedural terrain mounts. Every deterministic world field (height, biome, decorations, clouds) derives from it — seed your own `XRPublisher.utils.alea` / noise from it so plugin-generated content matches the world on every visit:

```js
const rng = XRPublisher.utils.alea(`${XRPublisher.getWorldSeed()}-my-plugin`);
```

## `getBiomeAt(x, z, seed?) → BiomeType | null`

The biome at a point — the *same* sampler the engine uses (no hand-copied noise constants to drift). Pass an explicit `seed` to query a specific world; otherwise the active seed is used (`null` before one exists).

```ts
interface BiomeType {
  id: 'plains' | 'mountains' | 'wetlands' | 'buildable' | 'default';
  heightMultiplier: number;
  grassDensity: number;
  boulderDensity: number;
  treeDensity: number;
  shrubDensity: number;
  flowerDensity: number;
}
```

`'buildable'` is the deliberately flat town-land biome — the one world roads place towns in.

```js
if (XRPublisher.getBiomeAt(x, z)?.id === 'wetlands') { /* frogs here */ }
```

## `getBiomeWeights(x, z, seed?) → Record<BiomeId, number> | null`

Smooth per-biome membership weights at a point, summing to 1 — the soft version of `getBiomeAt`, for blending decisions across biome borders (e.g. fade a plugin effect in where `weights.plains` is high).

## `getOceanFade(x, z, seed?) → number | null`

The ocean-basin fade 0..1: `0` is normal land; values above 0 mean the point sits inside one of the rare macro-scale water basins (the fade is what gets subtracted from terrain height there). Use it to keep plugin sites out of deep-water regions before you've even sampled height.

## `getPlayerState() → { x, y, z, yaw, isSwimming, isFlying, sheltered } | null`

Live local-player state, updated every frame — the standard gate for ambient plugin effects:

- `x, y, z` — world position (render frame).
- `yaw` — the avatar **body** heading in radians (`0` = −Z). Note the body turns toward *movement*, so this is not the player's view direction; for aim use `getCursorState()` ([44](44-aim-input-and-hands.md#aim-the-world-cursor)).
- `isSwimming` / `isFlying` — locomotion state.
- `sheltered` — `true` when something solid (a roof, a cavern ceiling) is within ~14m straight up.

```js
const ps = XRPublisher.getPlayerState();
if (ps && !ps.sheltered && !ps.isSwimming && !ps.isFlying) {
  // safe to rain on the player
}
```

For *remote* players' positions, see `getPeers()` in [Networking plugins](39-networking-plugins.md).

## `teleportPlayer(x, y?, z)`

Teleport the local player. **Y is optional** — leave it `undefined` and the engine snaps the player to the terrain surface on arrival, which is almost always what you want:

```js
XRPublisher.teleportPlayer(town.renderX, undefined, town.renderZ);   // jump to the town
```

This goes through the engine's own teleport handler (the same path portals use), which also snaps the camera — important, because terrain streaming follows the camera, and a long jump without the snap would sweep it across the whole world loading every cell in between. Prefer this over moving the player object yourself.

---

## Coordinate frames

Two frames appear across the world-building APIs. All of the query methods on this page — and `addModel`/`addSolid`/`addTerrainRegion`/`addPath`/`teleportPlayer` — operate in the **render frame**: the world coordinates the player actually moves through (`getPlayerState()`'s frame).

The **worker/heightfield frame** sits half a terrain chunk higher on both X and Z. It still surfaces in two places, and in both the API hands you the render-frame value alongside it — you should never have to convert by hand:

- **`getWorldTowns()`** returns `{ x, z, renderX, renderZ }` per town: `x`/`z` are the road planner's worker-frame coordinates (stable identity — use them for keys and per-town seeds), `renderX`/`renderZ` are the same centre in the render frame (use them for placement and distances). See [Paths and roads](30-paths-and-roads.md#coordinate-frame).
- **Decoration spawns**: the legacy `spawn.worldPosition` is worker-frame for terrain/tree anchors; prefer **`spawn.renderPosition`**, which is render-frame for every anchor type (see [Spawn context](21-decoration-spawn-context.md)).

When something you place lands ~50–70 units away from where you expected, diagonally — this offset is almost always why.

---

## Next steps

- [Injected models and solids](28-injected-models-and-solids.md) — seat objects with `getGroundHeight`
- [Paths and roads](30-paths-and-roads.md) — route with `sampleTerrain`/`isWaterAt`
- [Clouds and weather](32-clouds-and-weather.md) — `getWeatherAt` pairs with `getPlayerState` for precipitation effects
- [Decoration spawn context](21-decoration-spawn-context.md) — the per-spawn versions of these signals
