/**
 * roadConfigStore — the main-thread switch for WORLD ROADS.
 *
 * `XRPublisher.configureWorldRoads(cfg)` writes here; `ProceduralTerrain`
 * (+ WebGL twin) reads it and forwards it on every `generateTerrain` call, so
 * the terrain worker bakes a per-vertex `roadStrength` and filters decoration
 * spawns off the road — deterministically, at chunk-generate time.
 *
 * Roads are computed ONCE per super-tile in the worker and cached, so this is a
 * plain config holder — no per-frame state, nothing player-relative. Call it at
 * plugin init (before terrain streams) so the first chunks already include roads.
 */
import { DEFAULT_ROAD_CONFIG } from '../workers/roadNetwork';
import type { RoadConfig } from '../workers/roadNetwork';

let _config: RoadConfig | null = null;

// Version bumps when the config changes. ProceduralTerrain (+ WebGL twin) read
// it via useSyncExternalStore and include it in the chunk GENERATE effect's deps,
// so already-mounted chunks re-generate WITH roads if the plugin enables roads
// after the first chunks streamed. This is the safe reactive path — it re-runs
// the normal worker generate (which re-bakes roadStrength), NOT a shared-material
// dispose/rebuild (that churn caused a rapier re-entrancy crash; don't do it).
let _version = 0;
const _listeners = new Set<() => void>();

/** Enable/replace world roads. Pass a partial — defaults fill the rest. Pass
 *  null to disable. */
export function setWorldRoadConfig(cfg: Partial<RoadConfig> | null): RoadConfig | null {
  _config = cfg ? { ...DEFAULT_ROAD_CONFIG, enabled: true, ...cfg } : null;
  _version++;
  _listeners.forEach((l) => l());
  return _config;
}

/** The active road config (or undefined when roads are off) — attached to each
 *  generateTerrain call. */
export function getWorldRoadConfig(): RoadConfig | undefined {
  return _config ?? undefined;
}

export function getWorldRoadConfigVersion(): number { return _version; }
export function subscribeWorldRoadConfig(listener: () => void): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

export { DEFAULT_ROAD_CONFIG };
export type { RoadConfig };
