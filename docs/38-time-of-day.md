# Time of Day

Worlds with a procedural sky run a day/night cycle — sun position, sky colors, fog, and a darkness term every world-surface material carries. Plugins can read and drive it:

```js
XRPublisher.getTimeOfDay();          // → { time: 13.2, phase: 'midday' }
XRPublisher.setTimeOfDay(21.5, false);  // jump the room to night, clock keeps running
XRPublisher.setDayCyclePaused(true);    // freeze the cycle at the current hour
XRPublisher.isTimeAuthority();          // am I the room's time authority?
```

The one rule that shapes everything here: **world time is a single shared timeline per room**, not a per-client value.

[SCREENSHOT: the same world at midday and at 21.5, showing the sun-down darkness and emissive materials glowing]

---

## API

### `setTimeOfDay(hour, pauseCycle?)`

Sets the world clock to `hour` (0–24, wraps). When networking is connected, the change **broadcasts to every participant** — the whole room moves together. Works identically solo (the broadcast no-ops).

| Parameter | Type | Default | Description |
|---|---|---|---|
| `hour` | `number` | *(required)* | Time of day, 0–24. Fractional hours are fine (`21.5` = 9:30 pm). |
| `pauseCycle` | `boolean` | `true` | `true` **freezes** the clock at `hour` (a held night show). `false` **jumps** the running clock to `hour` and lets the cycle continue linearly from there. |

### `setDayCyclePaused(paused)`

Pause or resume the cycle at the current hour — `setTimeOfDay(currentTime, paused)` in one call. Room-synced the same way.

### `getTimeOfDay()`

Returns `{ time, phase }`: `time` is the current hour (0–24) and `phase` is the named day phase (table below). `XRPublisher.getWeatherAt(x, z)` includes the same two fields, so weather-and-time logic can branch from one call.

### `isTimeAuthority()`

`true` when this client is the room's **time authority** — the first participant in the room (ties broken by client id), or always `true` when not networked. Use it to gate admin-only UI (e.g. only the admin sees a "Make it night" menu row). Note that authority gates *whose clock the room converges to*, not who may change it: any client's `setTimeOfDay` applies room-wide.

All four are available as static and instance methods, and on `window.XRPublisher` for script-tag plugins.

---

## How room sync works

- Any client's `setTimeOfDay` applies locally and broadcasts on a reserved engine channel — every participant's sky changes together.
- The **authority** (first participant) heartbeats the full time state every few seconds, so late joiners, missed packets, and drift all converge within one heartbeat. Small drift (under ~3 game-minutes) is left alone so the sky doesn't visibly re-snap.
- If the authority leaves, the next-longest-present participant takes over automatically.

### Never gate time on proximity

Don't set time locally when the player walks into an area and restore it when they leave. Time is shared: a proximity toggle gives each client a private "time bubble" — dark ground for one player, noon for the peer standing next to them, and neither sees what the other sees. Make time changes **explicit, room-wide actions** instead — a menu row, a scheduled show, a quest beat:

```js
// Adapted from the resonance-stage plugin's "Night show" menu item.
XRPublisher.registerMenuItem({
  id: 'night-show',
  label: 'Night show (whole room)',
  icon: '🌙',
  onSelect: () => {
    const { time } = XRPublisher.getTimeOfDay();
    const isNight = time >= 20 || time < 5.5;
    XRPublisher.setTimeOfDay(isNight ? 12 : 21.5, false);  // jump, keep running
  },
});
```

Location-*flavoured* atmosphere that should differ per place belongs to [weather regions](32-clouds-and-weather.md), which are world-anchored and identical for everyone.

---

## Day phases and what they mean for your visuals

`phase` values, by hour:

| Phase | Hours |
|---|---|
| `night` | 0 – 5 |
| `dawn` | 5 – 6.5 |
| `sunrise` | 6.5 – 8 |
| `morning` | 8 – 11 |
| `midday` | 11 – 14 |
| `afternoon` | 14 – 17 |
| `evening` | 17 – 19 |
| `dusk` | 19 – 21 |
| `night` | 21 – 24 |

Things plugin visuals should know:

- **The sun is up 6.5 → 20.5.** Outside that window the directional light becomes a cool, dim "moonlight" and every world-surface material darkens through the engine's shared darkness ramp (dawn ramps in ~5.5–7, dusk ramps out ~18.5–20.5).
- **Emissive materials ignore the darkness term** — they read as faint accents at noon and become the dominant light source at night. If your plugin's centrepiece is a glow (a stage, lanterns, orbs), it will look best after `setTimeOfDay(21.5, …)`, and [bloom](37-post-processing.md) amplifies exactly those materials.
- **Lit stock materials darken automatically** — you don't need to do anything for your placed objects to participate in the cycle.
- The cycle's speed comes from the world's terrain block (`timecycleduration` attribute; `0` = a static authored hour). `setTimeOfDay(h, false)` jumps that running clock; `setTimeOfDay(h, true)` overrides and holds regardless of the authored cycle.

---

## Next steps

- [Post-processing](37-post-processing.md) — bloom for the emissive materials that own the night.
- [Menu items](36-menu-items.md) — the right trigger surface for a room-wide time change.
- [Clouds and weather](32-clouds-and-weather.md) — per-location atmosphere that stays consistent for every client.
- Worked example: [resonance stage](67-example-resonance-stage.md) — a synced night show driven from the More menu.
