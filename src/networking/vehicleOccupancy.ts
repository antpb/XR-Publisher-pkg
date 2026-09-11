/**
 * vehicleOccupancy — who sits in which seat of each vehicle.
 *
 * A vehicle seats ONE driver (seat 0, the host who owns + moves it) plus
 * passengers (seats 1..N). The DRIVER is authoritative for its own vehicle's
 * occupancy and broadcasts it (`NetworkBridge.sendVehicleMembership`, kind
 * 'occupancy') on change + a ~1Hz keyframe; players ask to board/leave with
 * kind 'join'/'leave'. This module is the per-client replica of that map.
 *
 * Seat WORLD transforms are NOT networked — every client already has the
 * (synced) vehicle transform and the authored `seats` offsets, so each
 * `RideableObject` computes every occupant's seat locally and publishes it to
 * `rideSeat` (if it's the local player) or `remoteRiders` (peers). Only the
 * cheap occupancy MAP travels the wire, and only on board/leave events.
 *
 * Plain module (not a store) — consumed inside `RideableObject`'s useFrame each
 * frame, so no React subscription is needed.
 */
import useRideStore from '../stores/rideStore';
import { getNetworkBridge, type VehicleMembershipMessage } from './NetworkBridge';

export interface VehicleOccupancy {
	/** Driver client id (seat 0 owner). */
	driver: string;
	/** seat index → occupant client id (null/absent = empty). Index 0 = driver. */
	seats: (string | null)[];
	/** performance.now() of the last update — used to detect a vanished driver. */
	ts: number;
}

const occupancy = new Map<string, VehicleOccupancy>();

/**
 * Occupancy with no driver keyframe within this window is treated as gone —
 * used to eject a passenger whose driver disconnected without a clean dismount
 * (no final occupancy broadcast arrives in that case).
 */
export const OCCUPANCY_STALE_MS = 2500;

export function getOccupancy(vehicleId: string): VehicleOccupancy | undefined {
	return occupancy.get(vehicleId);
}

/** Lowest free passenger seat (index ≥ 1, < capacity), or -1 if full. */
export function nextFreeSeat(vehicleId: string, capacity: number): number {
	const occ = occupancy.get(vehicleId);
	for (let i = 1; i < capacity; i++) {
		if (!occ || !occ.seats[i]) return i;
	}
	return -1;
}

export function localClientId(): string {
	return (typeof window !== 'undefined' && (window as any).p2pcf?.clientId) || '';
}

/**
 * Write occupancy from the LOCAL driver (which never receives its own
 * broadcast). Keep this in lockstep with the `sendVehicleMembership` the driver
 * emits, so the driver's own client seats passengers identically to peers.
 */
export function setLocalOccupancy(vehicleId: string, driver: string, seats: (string | null)[]): void {
	occupancy.set(vehicleId, { driver, seats: seats.slice(), ts: performance.now() });
}

/** Apply an authoritative occupancy update (from a peer driver) + reconcile the
 *  local player's rideStore if they're a passenger of this vehicle. */
function applyOccupancy(msg: VehicleMembershipMessage): void {
	if (msg.kind !== 'occupancy' || !msg.seats) return;
	occupancy.set(msg.vehicleId, { driver: msg.clientId, seats: msg.seats.slice(), ts: performance.now() });

	const me = localClientId();
	if (!me) return;
	const rs = useRideStore.getState();
	if (!rs.isMounted || rs.vehicleId !== msg.vehicleId || rs.role !== 'passenger') return;
	const myIdx = msg.seats.indexOf(me);
	if (myIdx === -1) {
		// No longer in this vehicle — the driver rejected us (full), ejected us,
		// or left (empty seats). Get out.
		rs.dismount();
	} else if (myIdx !== rs.seatIndex) {
		// Reconcile our optimistic guess to the driver's authoritative seat.
		rs.setSeatIndex(myIdx);
	}
}

let _installed = false;
/** Install the single membership→occupancy bridge (idempotent). */
export function ensureOccupancyListener(): void {
	if (_installed) return;
	_installed = true;
	getNetworkBridge().onVehicleMembership(applyOccupancy);
}
