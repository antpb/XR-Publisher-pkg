/**
 * Ambience suppression registry — lets plugins tell the engine's ambient
 * particle layer (AmbientParticles: biome dust/pollen/midges) to stand down
 * while they run their own atmosphere (heavy custom precipitation, a cutscene
 * fog, etc.). Plain module, keyed like the other plugin registries so two
 * plugins can't fight over one boolean.
 *
 * NOTE: rain from the engine's own weather system needs NO explicit call —
 * AmbientParticles polls sampleWeatherAt() at the player and thins/parks
 * itself as cloud-region rain rises. This registry is the override for
 * precipitation the core can't see.
 */

const suppressors = new Set<string>();

export function suppressAmbientParticles(key: string, on: boolean): void {
  if (on) suppressors.add(key);
  else suppressors.delete(key);
}

export function isAmbienceSuppressed(): boolean {
  return suppressors.size > 0;
}
