# Example: Weather Zones

The weather API tour: seed-deterministic weather zones painted onto the world — a dark storm near spawn, a drizzly overcast deck, a bright clearing, and a storm that only exists at dusk — plus plugin-rendered rain that follows the player and rare drips that shed off wet clothing after you step out of it.

Source: `examples/plugins/weather-zones-xr-publisher-plugin.umd.js`

[SCREENSHOT: dark storm cell over the terrain, rain streaks around the player]

## What it demonstrates

- **[Cloud regions](32-clouds-and-weather.md)** — `XRPublisher.addCloudRegion({...})` / `removeCloudRegion(id)`: world-space weather zones (density, coverage, color, rain), both permanent and dynamic
- **[Weather queries](32-clouds-and-weather.md)** — `getWeatherAt(x, z)`: the blended weather (+ time/phase) at any point. Core does **not** render rain — this plugin renders its own by polling the query around the player
- **[Day/night-branching weather](38-time-of-day.md)** — a dusk-only storm added/removed as the clock's phase crosses into evening
- **[Player & scene access](42-player-scene-audio.md)** — `getScene()` / `getPlayerState()` / `getAudioListener()`: mounting world-space FX and gating them on `{ sheltered, isSwimming, isFlying }`
- Seed-stable placement via `XRPublisher.utils.alea` and `getWorldSeed()` — the same world always has the same weather
- **[HUD](34-hud-overlays.md)** readout + a **[menu item](36-menu-items.md)** ("Summon storm here") that adds a cloud region dynamically

## How it works

### Seed-deterministic zones

Zones are placed at seed-stable polar offsets from the origin, so every visitor sees the same weather map:

```js
await waitFor(() => !!XRPublisher.getWorldSeed());
const seed = XRPublisher.getWorldSeed() || 'default';
const rng = XRPublisher.utils.alea(`${seed}-weather`);

// Helper: a zone at a seed-stable polar offset from the origin.
const polarZone = (minDist, maxDist, cfg) => {
  const a = rng() * Math.PI * 2;
  const d = minDist + rng() * (maxDist - minDist);
  return { center: [Math.cos(a) * d, Math.sin(a) * d], ...cfg };
};

// A heavy dark-grey storm reasonably near spawn so it's easy to find.
XRPublisher.addCloudRegion(polarZone(450, 850, {
  id: 'wz-storm', radius: 420, falloff: 0.55,
  density: 0.98, coverage: 0.92, scale: 1.35,
  color: [0.34, 0.36, 0.40], rain: 0.85,
}));
```

### The dusk-only storm

`getWeatherAt` returns the current time and phase alongside the blended weather, so a zone can exist only during part of the day cycle:

```js
let duskStormOn = false;
const isDuskish = (phase) => phase === 'evening' || phase === 'dusk' || phase === 'night';
...
const w = XRPublisher.getWeatherAt(camPos.x, camPos.z);
// Day/night-gated storm: present only in the evening/dusk/night.
const wantDusk = isDuskish(w.phase);
if (wantDusk && !duskStormOn) { XRPublisher.addCloudRegion(duskStorm); duskStormOn = true; }
else if (!wantDusk && duskStormOn) { XRPublisher.removeCloudRegion('wz-dusk-storm'); duskStormOn = false; }
```

### Plugin-rendered rain, gated by player state

Rain is an `InstancedMesh` of thin vertical quads inside a group that's moved to the player each frame — mounted **in the scene**, not parented to the camera (the camera and listener aren't in the scene graph, so children of them don't render; and `PointsMaterial` doesn't render under WebGPU — `MeshBasicMaterial` works on both paths). Everything is gated by `getPlayerState()`:

```js
// Player state gates EVERYTHING: no rain at all when sheltered (under a
// roof / indoors) — otherwise it visibly falls through the ceiling.
const st = XRPublisher.getPlayerState();
const sheltered = !!(st && st.sheltered);
const intensity = sheltered ? 0 : Math.max(0, Math.min(1, w.rain));

const targetOpacity = intensity * RAIN_OPACITY;
rainMat.opacity += (targetOpacity - rainMat.opacity) * Math.min(1, delta * 3);
const rate = (0.5 + intensity) * delta;   // heavier rain falls faster
```

### Wet-clothes drips

The nicest detail: a `wetness` value builds while standing out in the rain and slowly **decays** after, so the player keeps dripping for a few seconds under cover, then stops — real wet-clothes behaviour. Each of 10 drip slots is a tiny bead that forms at a random point on the body, accelerates off under gravity, then waits multiple seconds before that slot drips again:

```js
const outInRain = st && intensity > 0.25 && !st.isSwimming && !st.isFlying;
wetness = outInRain
  ? Math.min(1, wetness + delta * 0.6)
  : Math.max(0, wetness - delta * 0.12);
const dripping = !!st && wetness > 0.04 && !st.isSwimming;
```

## Key techniques

- **Core paints clouds and answers queries; precipitation FX are yours.** `getWeatherAt` gives you `rain`, `coverage`, `density`, `color`, `speed`, `isStorm`, `time`, `phase` — how it looks on the ground is plugin territory (`speed` is the local cloud drift, handy for blowing your own particles the same way the sky moves).
- **Simulation capped at ~60Hz.** On 120Hz ProMotion displays rAF fires at native rate and the 500-drop matrix loop ran twice as hot for no visible gain — skipped ticks fold into the next delta (`if (now - last < 14) return`).
- **Touch the DOM only when it changed.** The HUD updates at 2Hz and compares against the last HTML string first — `innerHTML` every rAF forced a full style/layout/paint pass per frame (~350ms of Layout+ParseHTML across a 12s trace).
- **Watch for shared dummies.** The rain and drip loops share one `Object3D` scratch dummy; the rain loop must reset `dummy.scale` because the drip loop sets it to zero to hide idle slots — a classic instanced-mesh footgun the file annotates.
- **Fade with scale or opacity, never allocation.** Both pools are fixed-size; recycling positions (`rainY[i] < RAIN_BOTTOM → respawn at top`) keeps the frame free of GC.
- **Dynamic regions are just add/remove with the same id.** The "Summon storm here" menu item removes the previous summoned region before adding the new one at the listener's position.

## Try it

Copy into the api `plugins/` dir and `npm run upload-build <build-file>` (see `examples/plugins/README.md`). Walk toward the HUD's rain percentage to find the storm cell; wait for evening to catch the dusk storm; duck under a roof and watch yourself keep dripping for a few seconds.

Suggested modifications:

1. **Add lightning.** On `w.isStorm`, occasionally flash a bright emissive plane in the sky and defer a thunder `THREE.Audio` by distance — you have `getAudioListener()` already.
2. **Puddle the ground.** Use `getWeatherAt` intensity to drive an `addTerrainRegion` wet-sheen surface under the player's chunk (see [Terrain regions & surfaces](29-terrain-regions-and-surfaces.md)) and fade it after rain ends, mirroring the wetness-decay pattern.

## Next steps

- [Resonance Stage](67-example-resonance-stage.md) — `addCloudRegion` used as show haze + room-synced time
- [Shoreline reeds](52-example-shoreline-reeds.md) — the reference distance-LOD `update()` pattern for ambient FX
- [Clouds & weather API](32-clouds-and-weather.md) · [Time of day](38-time-of-day.md) · [Player, scene & audio](42-player-scene-audio.md)
