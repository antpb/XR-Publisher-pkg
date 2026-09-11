import { float, uniform } from 'three/tsl';
import useProceduralSkyStore from '../../../stores/proceduralSkyStore';

const _timeOfDayUniform = uniform(12.0);
// Plain {value} uniform for WebGL ShaderMaterials (same darkness value,
// auto-updated by the store subscription below). Share the OBJECT across
// materials — three uniform containers are just {value} holders.
const _darknessValueUniform = { value: 1.0 };
let _subscribed = false;

function ensureSubscription() {
  if (_subscribed) return;
  _subscribed = true;
  const t0 = useProceduralSkyStore.getState().currentTime;
  _timeOfDayUniform.value = t0;
  _darknessValueUniform.value = darknessAtTime(t0);
  useProceduralSkyStore.subscribe((state) => {
    _timeOfDayUniform.value = state.currentTime;
    _darknessValueUniform.value = darknessAtTime(state.currentTime);
  });
}

/**
 * Auto-updating `{ value }` darkness uniform for WebGL twins: put it
 * directly in a ShaderMaterial's `uniforms` (e.g. `uDarkness: getDarknessValueUniform()`)
 * and multiply the fragment color by it — no per-component subscriptions.
 */
export function getDarknessValueUniform(): { value: number } {
  ensureSubscription();
  return _darknessValueUniform;
}

export function getTimeOfDayUniform() {
  ensureSubscription();
  return _timeOfDayUniform;
}

/**
 * Plain-JS mirror of createDarknessNode's curve, for WebGL twins that
 * drive a uniform manually instead of using TSL. Keep the breakpoints in
 * lockstep with the node below.
 */
export function darknessAtTime(t: number): number {
  const nightBrt = 0.35;
  if (t < 5.5) return nightBrt;
  if (t < 7.0) return nightBrt + (1.0 - nightBrt) * ((t - 5.5) / 1.5);
  if (t < 18.5) return 1.0;
  if (t < 20.5) return 1.0 - (1.0 - nightBrt) * ((t - 18.5) / 2.0);
  return nightBrt;
}

/**
 * Day/night brightness multiplier for unlit + vertex-colored materials
 * (terrain, grass, canopy, water).
 *
 * Breakpoints are tied to the ProceduralSky timeline — sun up 6.5 → 20.5,
 * dusk phase 19 → 21:
 *   night  < 5.5         → 0.35
 *   dawn   [5.5, 7.0)    → ramp up (sky lightens through dawn/sunrise)
 *   day    [7.0, 18.5)   → 1.0
 *   dusk   [18.5, 20.5)  → ramp down (sun drops + dusk colors)
 *   night  ≥ 20.5        → 0.35
 * If you change the sun window in ProceduralSky[WebGL], change these too.
 */
export function createDarknessNode() {
  ensureSubscription();
  const t = _timeOfDayUniform;
  const nightBrt = float(0.35);
  const dayBrt = float(1.0);

  const isEarlyNight = t.lessThan(float(5.5));
  const isDawn = t.greaterThanEqual(float(5.5)).and(t.lessThan(float(7.0)));
  const dawnProgress = t.sub(float(5.5)).div(float(1.5));
  const dawnB = nightBrt.add(dayBrt.sub(nightBrt).mul(dawnProgress));
  const isDay = t.greaterThanEqual(float(7.0)).and(t.lessThan(float(18.5)));
  const isDusk = t.greaterThanEqual(float(18.5)).and(t.lessThan(float(20.5)));
  const duskProgress = t.sub(float(18.5)).div(float(2.0));
  const duskB = dayBrt.sub(dayBrt.sub(nightBrt).mul(duskProgress));

  return isEarlyNight.select(nightBrt,
    isDawn.select(dawnB,
      isDay.select(dayBrt,
        isDusk.select(duskB, nightBrt)
      )
    )
  );
}
