/**
 * rideInput — plain mutable module (like rideSeat). The DRIVER's resolved
 * control intent, written by Player.jsx every frame while mounted and read by
 * the locally-driven RideableObject.
 *
 * Why route through Player: mobile joystick input is handled entirely inside
 * Player (ecctrl's joystick store + the tank-controls lateral→turn diversion),
 * NOT in the keyboard `movement` ref. Centralizing here means the vehicle gets
 * one unified input on both desktop (keyboard) and mobile (joystick).
 */
export interface RideInput {
	forward: boolean;
	backward: boolean;
	left: boolean;
	right: boolean;
	/** Ascend (flying): jump / button1. */
	up: boolean;
	/** Descend (flying): sprint / run. */
	down: boolean;
	/** Proportional steering axis, −1 (full left) … +1 (full right). The analog
	 *  source of truth — keyboard sets ±1, the mobile joystick sets its (already
	 *  deadzoned/clamped) lateral deflection. left/right above are just its sign
	 *  for any boolean consumers. Always clamped to [-1, 1]. */
	steerAxis: number;
}

export const rideInput: RideInput = {
	forward: false,
	backward: false,
	left: false,
	right: false,
	up: false,
	down: false,
	steerAxis: 0,
};

export function setRideInput(i: Partial<RideInput>): void {
	rideInput.forward = !!i.forward;
	rideInput.backward = !!i.backward;
	rideInput.left = !!i.left;
	rideInput.right = !!i.right;
	rideInput.up = !!i.up;
	rideInput.down = !!i.down;
	const a = i.steerAxis ?? 0;
	rideInput.steerAxis = a < -1 ? -1 : a > 1 ? 1 : a;
}

export function clearRideInput(): void {
	rideInput.forward = rideInput.backward = false;
	rideInput.left = rideInput.right = false;
	rideInput.up = rideInput.down = false;
	rideInput.steerAxis = 0;
}
