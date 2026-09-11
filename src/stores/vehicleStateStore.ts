import { create } from 'zustand';
import { getNetworkBridge, type DecodedVehicleState } from '../networking/NetworkBridge';

/**
 * vehicleStateStore — networked vehicle transforms received from peers.
 *
 * Each `<three-rideable-block>` exists on every client (it's a world block),
 * so the block instance is its own remote renderer: when a peer drives a
 * vehicle, their broadcast lands here keyed by the vehicle's stable hash, and
 * the matching `RideableObject` on every other client lerps its mesh to it.
 *
 * Authority: the driver (lowest owner hash on a tie) is the writer. Entries
 * are timestamped so a vehicle goes "idle/unowned" once packets stop arriving
 * (e.g. the driver dismounted and stopped broadcasting).
 */

export interface NetworkedVehicle {
	position: [number, number, number];
	rotation: [number, number, number, number];
	vehicleType: number;
	ownerHash: number;
	occupied: boolean;
	/** Front-wheel steer angle (radians) — for remote wheel rendering. */
	steer: number;
	/** performance.now() of the last received packet. */
	ts: number;
}

interface VehicleStateStore {
	vehicles: Record<number, NetworkedVehicle>;
	setVehicle: (id: number, v: NetworkedVehicle) => void;
}

const useVehicleStateStore = create<VehicleStateStore>((set) => ({
	vehicles: {},
	setVehicle: (id, v) =>
		set((s) => ({ vehicles: { ...s.vehicles, [id]: v } })),
}));

export default useVehicleStateStore;

/** A networked vehicle is considered "live" if seen within this window. */
export const VEHICLE_STALE_MS = 2000;

/**
 * FNV-1a 32-bit hash of a stable vehicle id string. Matches the JS hash used
 * when broadcasting (the same number is the wire `vehicle_id`), so both the
 * sender and every receiver agree on the key for a given block.
 */
export function hashVehicleId(id: string): number {
	let hash = 2166136261 >>> 0;
	for (let i = 0; i < id.length; i++) {
		hash ^= id.charCodeAt(i);
		hash = Math.imul(hash, 16777619) >>> 0;
	}
	return hash >>> 0;
}

/**
 * 16-bit FNV-1a hash of a client id — matches Rust `hash_client_id` (which
 * truncates the 32-bit FNV to its low 16 bits). Used to compare the local
 * driver against a received vehicle's `ownerHash`.
 */
export function hashClientId16(id: string): number {
	let hash = 2166136261 >>> 0;
	for (let i = 0; i < id.length; i++) {
		hash ^= id.charCodeAt(i);
		hash = Math.imul(hash, 16777619) >>> 0;
	}
	return hash & 0xffff;
}

/** Read the current networked entry for a string vehicle id (or undefined). */
export function getNetworkedVehicle(id: string): NetworkedVehicle | undefined {
	return useVehicleStateStore.getState().vehicles[hashVehicleId(id)];
}

/**
 * True when a DIFFERENT client currently owns this vehicle (fresh packet from
 * an owner hash other than `localHash`). Used at mount time to refuse boarding
 * a vehicle someone else is already driving.
 */
export function isVehicleOwnedByOther(id: string, localHash: number): boolean {
	const v = getNetworkedVehicle(id);
	if (!v) return false;
	if (performance.now() - v.ts > VEHICLE_STALE_MS) return false;
	return v.occupied && v.ownerHash !== localHash;
}

let _listenerInstalled = false;

/**
 * Install the single NetworkBridge → store bridge. Idempotent; call from any
 * RideableObject on mount (registering the listener is harmless before p2pcf
 * exists — it only fires when vehicle packets decode).
 */
export function ensureVehicleNetListener(): void {
	if (_listenerInstalled) return;
	_listenerInstalled = true;
	const bridge = getNetworkBridge();
	bridge.onVehicleState((state: DecodedVehicleState) => {
		useVehicleStateStore.getState().setVehicle(state.vehicleId, {
			position: state.position,
			rotation: state.rotation,
			vehicleType: state.vehicleType,
			ownerHash: state.clientIdHash,
			occupied: state.occupied,
			steer: state.steer,
			ts: performance.now(),
		});
	});
}
