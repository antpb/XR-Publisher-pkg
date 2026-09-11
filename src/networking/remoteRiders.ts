/**
 * remoteRiders — plain mutable module mirroring `rideSeat.ts`, but MULTI-keyed
 * by the DRIVING peer's 16-bit client hash (the vehicle packet's `ownerHash`).
 *
 * For a vehicle a PEER is driving, the locally-rendered `RideableObject` (the
 * world block exists on every client) writes the live seat world transform here
 * every frame, derived from the SAME smoothly-interpolated vehicle group it is
 * already lerping. The matching `Participant` — the remote avatar of that driver
 * — reads it in its own useFrame and SNAPS its avatar to the seat instead of
 * lerping the driver's separate, lagging position stream. That separate stream
 * was the "avatar constantly playing catch-up with the vehicle" bug: the car
 * rode the vehicle-state interpolation while the avatar rode the player-state
 * interpolation, so the two never agreed frame-to-frame. Sharing one source
 * removes the drift entirely.
 *
 * Plain object (not a Zustand store) to avoid a 60fps store write re-rendering
 * subscribers every frame — same rationale as `rideSeat`/`npcObstacles`.
 */
export interface RemoteRiderSeat {
	/** Seat world position = the rider's BODY CENTER (capsule center), matching
	 *  `rideSeat.px/py/pz`. The Participant drops to the avatar root (feet) by
	 *  subtracting the capsule→feet offset. */
	px: number;
	py: number;
	pz: number;
	/** Vehicle travel heading (`vehicleSeatHeading` semantics: vehicle yaw + π).
	 *  The avatar faces this direction, mirroring the seated local driver. */
	headingY: number;
	/** Lean roll (radians) the avatar adopts — non-zero only for leaning types
	 *  (motorcycles); 0 keeps the avatar upright. */
	roll: number;
	/** performance.now() of the last write — used for staleness. */
	ts: number;
}

const riders = new Map<number, RemoteRiderSeat>();

/**
 * An entry older than this is treated as detached. `RideableObject` writes
 * EVERY frame while a remote vehicle is occupied (even when the underlying
 * vehicle packets arrive at a low tiered rate, because the group is lerped
 * every frame), so a fresh entry reliably means "actively driven by a peer".
 * Once the driver dismounts (occupied=false) or the vehicle goes stale, writes
 * stop and the avatar returns to normal locomotion within this window.
 */
export const REMOTE_RIDER_STALE_MS = 500;

export function setRemoteRider(
	ownerHash: number,
	px: number,
	py: number,
	pz: number,
	headingY: number,
	ts: number,
	roll = 0,
): void {
	let r = riders.get(ownerHash);
	if (!r) {
		r = { px, py, pz, headingY, roll, ts };
		riders.set(ownerHash, r);
		return;
	}
	r.px = px;
	r.py = py;
	r.pz = pz;
	r.headingY = headingY;
	r.roll = roll;
	r.ts = ts;
}

/** Stop publishing a seat for this driver (dismount / vacancy). */
export function clearRemoteRider(ownerHash: number): void {
	riders.delete(ownerHash);
}

/** Read the current seat for a driver's client hash (or undefined). */
export function getRemoteRider(ownerHash: number): RemoteRiderSeat | undefined {
	return riders.get(ownerHash);
}
