# Clouds and Weather

Weather in XR Publisher is a queryable field, not a global switch. Plugins paint world-space **cloud regions** — circles that override the sky's cloud look inside them (a dark storm deck here, a bright clearing there) — and read the blended result anywhere with **`getWeatherAt(x, z)`**.

Two design points to internalize:

- **Clouds are world-anchored and seeded.** Formations are fixed in world space (they don't follow the camera) and derived from the world seed, so the same world shows the same sky every visit, on both renderers. Place your zones deterministically too (seed a PRNG from `getWorldSeed()`) and every player sees the same storms in the same places.
- **The engine renders clouds, not rain.** A region's `rain` value is *data*, surfaced through `getWeatherAt` — your plugin renders its own precipitation, audio, and gameplay off the query. (The engine's ambient particles do automatically thin out as rain rises at the player.)

[SCREENSHOT: a dark storm deck over one valley with clear sky beyond, seen from a hill]

---

## `addCloudRegion(spec) → id` / `removeCloudRegion(id)`

```js
XRPublisher.addCloudRegion({
  center: [600, -200],
  radius: 380,
  density: 0.95,
  coverage: 0.85,
  color: [0.34, 0.36, 0.40],   // dark grey storm deck
  rain: 0.8,
});
```

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Stable id (used by `removeCloudRegion`). Returned by `addCloudRegion` (`''` on invalid spec). |
| `center` | `[x, z]` | *(required)* | World-space centre. |
| `radius` | `number` | *(required)* | Radius in world units. |
| `falloff` | `number` | `0.6` | Inner-solid fraction 0..1: inside `radius × falloff` the region fully applies; from there to `radius` it fades to the base look. |
| `density` | `number` | base | Cloud amount/alpha 0..1. |
| `coverage` | `number` | base | Overcast factor 0..1 — higher fills the deck fuller. |
| `scale` | `number` | base | Formation scale multiplier. |
| `speed` | `number` | `0.1` | Drift speed — blended and readable back through `getWeatherAt`, so a plugin can match its own particles to the local wind. |
| `rain` | `number` | `0` | Rain intensity 0..1, clamped — surfaced via `getWeatherAt`, not rendered by the engine. |
| `color` | `[r, g, b]` | base | Cloud colour 0..1 — white for fair weather, grey for storm. |

Unset look fields inherit the current **base** (fair-weather) values, so a region can override just `rain`, or just `color`.

Like [terrain regions](29-terrain-regions-and-surfaces.md), cloud regions use a fixed shader array: **up to 8 regions render at once**, kept packed with the nearest-to-player set (re-evaluated after ~10 units of player movement). You can register more; distant ones are culled until approached. Where regions overlap, the strongest influence at a point wins.

### Deterministic placement

The weather-zones reference plugin places its zones at seed-stable polar offsets from the origin:

```js
await waitFor(() => !!XRPublisher.getWorldSeed());
const rng = XRPublisher.utils.alea(`${XRPublisher.getWorldSeed()}-weather`);

const polarZone = (minDist, maxDist, cfg) => {
  const a = rng() * Math.PI * 2;
  const d = minDist + rng() * (maxDist - minDist);
  return { center: [Math.cos(a) * d, Math.sin(a) * d], ...cfg };
};

XRPublisher.addCloudRegion(polarZone(450, 850, {
  id: 'wz-storm', radius: 420, falloff: 0.55,
  density: 0.98, coverage: 0.92, scale: 1.35,
  color: [0.34, 0.36, 0.40], rain: 0.85,
}));
```

Regions can also come and go at runtime — the same plugin adds a dusk-only storm when `getWeatherAt(...).phase` crosses into evening and removes it at dawn.

---

## `setCloudDefaults(cfg)`

Set the global fair-weather cloud look — the base every region blends over (and the base regions inherit unset fields from). Overrides the `<three-terrain-block>` cloud attributes.

| Field | Type | Description |
|---|---|---|
| `density` | `number` | Base cloud amount 0..1. |
| `coverage` | `number` | Base overcast factor 0..1. |
| `scale` | `number` | Base formation scale. |
| `color` | `[r, g, b]` | Base cloud colour 0..1. |

All fields optional — only what you pass changes.

---

## `getWeatherAt(x, z)`

The weather at any world point — the same blended field the cloud shaders render, plus the time of day:

```ts
{
  density: number;              // blended cloud amount 0..1
  coverage: number;             // blended overcast 0..1
  color: [number, number, number];
  rain: number;                 // 0..1 (0 in fair weather)
  speed: number;                // blended cloud drift speed (0.1 in fair weather)
  isStorm: boolean;             // convenience: rain > 0.4
  time: number;                 // day/night clock, 0..24
  phase: string;                // 'night' | 'dawn' | 'sunrise' | 'morning' | 'midday'
                                //   | 'afternoon' | 'evening' | 'dusk'
}
```

Blending is strongest-region-wins, faded over the region's `falloff` — matching what the sky shows. Outside every region the sample is the fair-weather base: `rain: 0` and `speed: 0.1`. `time`/`phase` come from the [day/night cycle](38-time-of-day.md) so one call can branch on both location and time:

```js
// per second or so, at the player:
const ps = XRPublisher.getPlayerState();
const w = XRPublisher.getWeatherAt(ps.x, ps.z);
rainEmitter.intensity = w.rain;
if (w.isStorm && w.phase === 'night') scheduleLightning();
```

The weather-zones plugin drives an `InstancedMesh` of rain streaks this way — mounted in the scene, re-centred on the player each frame, intensity from `getWeatherAt`, with drips gated by `getPlayerState().sheltered` so it never rains indoors. See [Example: Weather Zones](69-example-weather-zones.md).

---

## `suppressAmbientParticles(key, on)`

The engine keeps a subtle ambient particle layer running (biome dust, pollen, midges). If your plugin renders its own atmosphere — heavy snow, ash, a cutscene fog — tell the ambience to stand down:

```js
XRPublisher.suppressAmbientParticles('my-plugin', true);   // on
// ...later
XRPublisher.suppressAmbientParticles('my-plugin', false);  // off
```

Suppression is **keyed per caller** so plugins compose — ambience feathers back in only when no keys remain suppressed.

**Not needed for cloud-region rain**: the engine already polls its own weather at the player and thins/parks the ambient pool automatically as `rain` rises. Reach for this only when you render precipitation the core can't see.

---

## Next steps

- [Time of day](38-time-of-day.md) — the room-synced clock behind `time`/`phase`
- [Terrain queries](31-terrain-queries.md) — `getPlayerState().sheltered` and friends
- [Post-processing](37-post-processing.md) — storm mood via bloom/aberration
- [Example: Weather Zones](69-example-weather-zones.md) — the full reference plugin (zones, rain rendering, dusk storms)
