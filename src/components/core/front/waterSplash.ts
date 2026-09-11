/**
 * Water splash trigger — module-level bridge (same pattern as
 * setShoreWaterLevel/terrainDarkness: plain module, no store).
 *
 * Callers (Player water entry, plugins) fire triggerWaterSplash(x, z,
 * strength) with world coordinates; the mounted WaterShader registers a
 * target that spawns a foam ring burst at that point. No-op when no water
 * surface is mounted (WebGL twin, worlds without procedural terrain).
 */

type SplashTarget = (x: number, z: number, strength: number) => void;

let target: SplashTarget | null = null;

export function setWaterSplashTarget(t: SplashTarget | null): void {
  target = t;
}

/** strength 0..1 — scales ring size and brightness (impact speed). */
export function triggerWaterSplash(x: number, z: number, strength = 1): void {
  if (target) target(x, z, Math.max(0, Math.min(1, strength)));
}
