/**
 * rideSeat — plain mutable module (NOT a store), mirroring the npcObstacles
 * pattern. The locally-driven rideable writes the live seat world transform
 * here every frame; `Player.jsx` reads it in its own useFrame to snap the
 * player body into the seat. Using a plain object avoids a 60fps Zustand
 * write (which would re-render subscribers every frame).
 */
export interface RideSeat {
	/** True while a local vehicle owns the player (the driver is seated). */
	active: boolean;
	/** Which vehicle id wrote this seat — guards against a stale writer. */
	vehicleId: string | null;
	/**
	 * Seat world position = the rider's BODY CENTER (the capsule center), so the
	 * avatar sits centered inside the vehicle volume. Player applies it directly
	 * (no capsule offset) — unlike `ex/ey/ez` below which are a FEET target.
	 */
	px: number;
	py: number;
	pz: number;
	/**
	 * Yaw to assign DIRECTLY to the player's `smoothedRotationRef` so the
	 * seated avatar faces the vehicle's travel direction. The vehicle bakes
	 * any model-facing offset into this value (see vehicleLocomotion.ts).
	 */
	headingY: number;
	/**
	 * Lean roll (radians) the rider adopts to match the vehicle — non-zero only
	 * for leaning types (motorcycles). 0 keeps the rider upright.
	 */
	roll: number;
	/**
	 * Known-good dismount spot (rider FEET target) the vehicle keeps updated —
	 * beside the craft, at the terrain surface — so dismounting never drops the
	 * player into the ground or the vehicle. Player adds the capsule offset.
	 */
	ex: number;
	ey: number;
	ez: number;
}

export const rideSeat: RideSeat = {
	active: false,
	vehicleId: null,
	px: 0,
	py: 0,
	pz: 0,
	headingY: 0,
	roll: 0,
	ex: 0,
	ey: 0,
	ez: 0,
};

export function setRideSeat(
	vehicleId: string,
	px: number,
	py: number,
	pz: number,
	headingY: number,
	ex: number,
	ey: number,
	ez: number,
	roll = 0,
): void {
	rideSeat.active = true;
	rideSeat.vehicleId = vehicleId;
	rideSeat.px = px;
	rideSeat.py = py;
	rideSeat.pz = pz;
	rideSeat.headingY = headingY;
	rideSeat.roll = roll;
	rideSeat.ex = ex;
	rideSeat.ey = ey;
	rideSeat.ez = ez;
}

/** Clear the seat (only if `vehicleId` is the current writer, or forced). */
export function clearRideSeat(vehicleId?: string): void {
	if (vehicleId && rideSeat.vehicleId !== vehicleId) return;
	rideSeat.active = false;
	rideSeat.vehicleId = null;
}
