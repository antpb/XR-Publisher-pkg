/**
 * loadProgress — completion signals for the first-load overlay.
 *
 * The big load milestones (terrain colliders present, avatar VRM parsed)
 * complete in no guaranteed order (a non-procedural world may finish terrain
 * instantly; a cached VRM may beat the first chunk), so this is a FLAG SET,
 * not a stage sequence: emitters call `markLoaded(signal)` once, and the
 * Loading overlay derives a fraction + "what's still cooking" label from
 * whichever flags are still missing.
 *
 * Deliberately not a Zustand store: the emitters (WaitForTerrain, Player's
 * VRM callback) live inside the Canvas while the overlay lives outside it in
 * a plain DOM tree — a module-level external store subscribed via
 * useSyncExternalStore crosses that boundary with zero coupling.
 */

export type LoadSignal = 'terrain' | 'avatar';

const flags = new Set<LoadSignal>();
const listeners = new Set<() => void>();
// Stable snapshot object for useSyncExternalStore (must return the same
// reference between changes or React loops re-rendering).
let snapshot: ReadonlySet<LoadSignal> = new Set();

export function markLoaded(signal: LoadSignal): void {
	if (flags.has(signal)) return;
	flags.add(signal);
	snapshot = new Set(flags);
	listeners.forEach((l) => l());
}

export function subscribeLoadProgress(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getLoadProgressSnapshot(): ReadonlySet<LoadSignal> {
	return snapshot;
}

/** Fraction for the overlay bar: a base for "engine up" plus equal weight per signal. */
export function loadFraction(loaded: ReadonlySet<LoadSignal>): number {
	const BASE = 0.15;
	const PER_SIGNAL = (1 - BASE) / 2;
	return Math.min(1, BASE + loaded.size * PER_SIGNAL);
}

/** Label for the most interesting still-missing work. */
export function loadLabel(loaded: ReadonlySet<LoadSignal>): string {
	if (!loaded.has('terrain')) return 'Building the world…';
	if (!loaded.has('avatar')) return 'Waking your avatar…';
	return 'Almost there…';
}
