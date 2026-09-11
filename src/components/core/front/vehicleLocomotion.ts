/**
 * vehicleLocomotion — pure, framework-free motion integrators for the seven
 * rideable vehicle types. `RideableObject` owns the THREE objects and physics
 * queries; this module owns only the math, so it stays testable and identical
 * across renderers.
 *
 * Convention: `yaw` is the heading angle where the vehicle's local +Z faces,
 * measured as `atan2(dirX, dirZ)`. `vehicleSeatHeading()` bakes the +π offset
 * the player avatar needs (its forward-facing pose matches `smoothedRotation`
 * + π — see Player.jsx broadcast yaw), so the seated rider faces travel.
 */
import { CatmullRomCurve3, Vector3 } from 'three';

export type VehicleType =
	| 'car'
	| 'bike'
	| 'flying'
	| 'hovering'
	| 'animal'
	| 'train'
	| 'coaster'
	| 'boat';

export const VEHICLE_TYPES: VehicleType[] = [
	'car',
	'bike',
	'flying',
	'hovering',
	'animal',
	'train',
	'coaster',
	'boat',
];

const TYPE_TO_INT: Record<VehicleType, number> = {
	car: 0,
	bike: 1,
	flying: 2,
	hovering: 3,
	animal: 4,
	train: 5,
	coaster: 6,
	boat: 7,
};

export function vehicleTypeToInt(t: string): number {
	return TYPE_TO_INT[(t as VehicleType)] ?? 0;
}

export function vehicleTypeFromInt(n: number): VehicleType {
	return VEHICLE_TYPES[n] ?? 'car';
}

/** True for types that follow an authored waypoint curve (no free steering). */
export function isOnRails(t: VehicleType): boolean {
	return t === 'train' || t === 'coaster';
}

/** True for types that rest on/above the terrain (so they spawn grounded). */
export function isGroundOrHoverType(t: VehicleType): boolean {
	return t === 'car' || t === 'bike' || t === 'animal' || t === 'hovering';
}

/** True for water vehicles that float on the water surface. */
export function isWaterType(t: VehicleType): boolean {
	return t === 'boat';
}

/** Wheeled/legged ground vehicles that tilt to the terrain slope. */
export function isGroundDriveType(t: VehicleType): boolean {
	return t === 'car' || t === 'bike' || t === 'animal';
}

export interface VehicleState {
	x: number;
	y: number;
	z: number;
	yaw: number;
	/** Current forward speed (signed) for free-driving types. */
	speed: number;
	/** Normalized curve parameter [0,1] for on-rails types. */
	t: number;
	/** Cosmetic hover bob phase. */
	bob: number;
}

export interface VehicleInput {
	forward: boolean;
	backward: boolean;
	left: boolean;
	right: boolean;
	/** Ascend (flying/hover): mapped from jump/space. */
	up: boolean;
	/** Descend (flying/hover): mapped from sprint/shift. */
	down: boolean;
	/** Analog steer −1..1 (joystick deflection; keyboard ±1). When supplied,
	 *  steering is PROPORTIONAL (like the physics car) instead of full-lock from
	 *  the left/right booleans — a slight stick angle yields a slight turn. */
	steer?: number;
}

export interface VehicleContext {
	type: VehicleType;
	/** Sample world ground height at (x,z); null when unknown (free fall-back). */
	groundHeight: (x: number, z: number) => number | null;
	/** Authored rail curve for on-rails types. */
	curve: CatmullRomCurve3 | null;
	curveLength: number;
	/** Designer speed multiplier (block `speed` attribute, default 1). */
	speedScale: number;
	/** Third-person camera look direction (world, unit-ish) — flying steers
	 *  along this so "fly forward" goes where you look (incl. up/down). */
	lookDir?: [number, number, number];
	/** World water surface Y (from getNpcWaterLevel). Boats float on it;
	 *  -Infinity / undefined means the world has no water. */
	waterLevel?: number;
	/** Local Y of the model's LOWEST point relative to the group origin
	 *  (bbox.min.y − origin.y). Resting targets subtract this so the model's
	 *  bottom sits on the surface, not the origin (prevents clipping). */
	bottomOffset?: number;
}

// Per-type tuning. accel/maxSpeed in m/s; turn in rad/s.
// `ride` = clearance of the model's BOTTOM above its support surface (terrain,
// or water for boats). Combined with ctx.bottomOffset this seats the model on
// the surface instead of burying it.
// `coast` = deceleration (m/s²) when no throttle is held. Ground vehicles brake
// hard (≈accel·0.9); a boat has almost no drag, so it keeps gliding (momentum).
const TUNING: Record<VehicleType, { maxSpeed: number; accel: number; turn: number; ride: number; coast: number }> = {
	car:      { maxSpeed: 13, accel: 14, turn: 1.8, ride: 0.05, coast: 12.6 },
	bike:     { maxSpeed: 15, accel: 16, turn: 2.6, ride: 0.05, coast: 14.4 },
	animal:   { maxSpeed: 8,  accel: 10, turn: 1.7, ride: 0.1,  coast: 9 },
	flying:   { maxSpeed: 18, accel: 14, turn: 1.6, ride: 0,    coast: 12.6 },
	hovering: { maxSpeed: 12, accel: 12, turn: 1.9, ride: 1.2,  coast: 10.8 },
	train:    { maxSpeed: 14, accel: 8,  turn: 0,   ride: 0,    coast: 7.2 },
	coaster:  { maxSpeed: 16, accel: 0,  turn: 0,   ride: 0,    coast: 0 },
	// Boat floats with a slight draft: bottom sits just below the waterline.
	// Slower top speed, but low coast drag → it glides on after you let off the
	// throttle like a real boat (so the lower speed never feels sluggish).
	boat:     { maxSpeed: 7,  accel: 8,  turn: 1.3, ride: -0.15, coast: 1.6 },
};

/** Resting height a type sits above the ground (matches its driving offset). */
export function vehicleRideHeight(t: VehicleType): number {
	return TUNING[t].ride;
}

const _p = new Vector3();
const _tan = new Vector3();

/**
 * Shoreline rule for a candidate (x,z):
 *  - ground vehicles (car/bike/animal) may NOT enter water,
 *  - boats may NOT climb onto land.
 * Hovering/flying and water-less worlds are unconstrained. Unknown terrain
 * (ray miss — chunk not streamed) is allowed so vehicles don't freeze.
 */
function horizontalAllowed(ctx: VehicleContext, x: number, z: number): boolean {
	const water = ctx.waterLevel != null && isFinite(ctx.waterLevel) ? ctx.waterLevel : null;
	if (water == null) return true;
	const gh = ctx.groundHeight(x, z);
	if (gh == null) return true;
	if (ctx.type === 'boat') return gh <= water + 0.05; // block dry land
	if (ctx.type === 'car' || ctx.type === 'bike' || ctx.type === 'animal') {
		return gh > water + 0.3; // block water (keep a margin off the shoreline)
	}
	return true;
}

/**
 * Advance `state` in place by `dt` seconds given `input` and `ctx`.
 * Returns nothing — caller reads the mutated state.
 */
export function stepVehicle(
	state: VehicleState,
	input: VehicleInput,
	dt: number,
	ctx: VehicleContext,
): void {
	const tuning = TUNING[ctx.type];
	const maxSpeed = tuning.maxSpeed * ctx.speedScale;

	if (isOnRails(ctx.type) && ctx.curve && ctx.curveLength > 0) {
		stepOnRails(state, input, dt, ctx, maxSpeed);
		return;
	}

	if (ctx.type === 'flying') {
		stepFlying(state, input, dt, ctx, maxSpeed);
		return;
	}

	// ── Free-driving on the ground (car / bike / animal / hovering) ──
	const turn = tuning.turn;
	// Steering authority scales with motion so a parked vehicle barely turns.
	// ('flying' already returned via stepFlying above, so no special case.)
	const steerGain = Math.min(1, Math.abs(state.speed) / (maxSpeed * 0.35) + 0.15);
	// Proportional steer: a partial joystick deflection makes a partial turn
	// (the physics car already does this). Keyboard supplies ±1 = full lock, so
	// it's unchanged. Sign matches the old booleans (right/+ steers the same way).
	const steerAmt = typeof input.steer === 'number'
		? input.steer
		: (input.right ? 1 : 0) - (input.left ? 1 : 0);
	state.yaw -= turn * steerGain * steerAmt * dt;

	// Throttle.
	let throttle = 0;
	if (input.forward) throttle += 1;
	if (input.backward) throttle -= 1;
	if (throttle !== 0) {
		state.speed += throttle * tuning.accel * dt;
	} else {
		// Coast: decay toward zero at the type's drag rate (boats barely decay →
		// they glide on; ground vehicles brake hard).
		const decay = tuning.coast * dt;
		if (state.speed > decay) state.speed -= decay;
		else if (state.speed < -decay) state.speed += decay;
		else state.speed = 0;
	}
	const revCap = maxSpeed * 0.45;
	state.speed = Math.max(-revCap, Math.min(maxSpeed, state.speed));

	// Integrate horizontal motion along heading — but respect the shoreline:
	// ground vehicles can't drive into water, boats can't drive onto land.
	const fwdX = Math.sin(state.yaw);
	const fwdZ = Math.cos(state.yaw);
	const nx = state.x + fwdX * state.speed * dt;
	const nz = state.z + fwdZ * state.speed * dt;
	if (horizontalAllowed(ctx, nx, nz)) {
		state.x = nx;
		state.z = nz;
	} else {
		state.speed = 0; // stop at the water/shore edge
	}

	// Vertical handling per family. `bottom` lifts the origin so the model's
	// lowest point lands on the surface rather than the origin.
	const bottom = ctx.bottomOffset ?? 0;
	if (ctx.type === 'hovering') {
		state.bob += dt;
		const g = ctx.groundHeight(state.x, state.z);
		const target = (g != null ? g : state.y) + tuning.ride - bottom + Math.sin(state.bob * 2) * 0.25;
		state.y += (target - state.y) * Math.min(1, dt * 4);
	} else if (ctx.type === 'boat') {
		// Float on the water surface, with a gentle bob. If terrain rises above
		// the water (beached), ride the terrain instead.
		state.bob += dt;
		const water = ctx.waterLevel != null && isFinite(ctx.waterLevel) ? ctx.waterLevel : null;
		const g = ctx.groundHeight(state.x, state.z);
		let target: number;
		if (water != null) {
			target = water + tuning.ride - bottom + Math.sin(state.bob * 1.5) * 0.12;
			if (g != null && g > water) target = g + 0.05 - bottom; // beached on land
		} else {
			target = (g != null ? g : state.y) + 0.05 - bottom;
		}
		state.y += (target - state.y) * Math.min(1, dt * 5);
	} else {
		// Ground vehicles ride the heightfield.
		const g = ctx.groundHeight(state.x, state.z);
		if (g != null) {
			const target = g + tuning.ride - bottom;
			state.y += (target - state.y) * Math.min(1, dt * 12);
		}
	}
}

/**
 * Flying: throttle along the third-person camera look direction (full 3D, so
 * looking up/down climbs/dives), with Space/Shift as extra fine vertical.
 * No forced ground-follow — only a soft floor so you can't fly underground.
 */
function stepFlying(
	state: VehicleState,
	input: VehicleInput,
	dt: number,
	ctx: VehicleContext,
	maxSpeed: number,
): void {
	const tuning = TUNING.flying;

	let throttle = 0;
	if (input.forward) throttle += 1;
	if (input.backward) throttle -= 1;
	if (throttle !== 0) {
		state.speed += throttle * tuning.accel * dt;
	} else {
		const decay = tuning.coast * dt;
		if (Math.abs(state.speed) <= decay) state.speed = 0;
		else state.speed -= Math.sign(state.speed) * decay;
	}
	state.speed = Math.max(-maxSpeed * 0.5, Math.min(maxSpeed, state.speed));

	// Direction = camera look (preferred) or current heading.
	let dx: number, dy: number, dz: number;
	if (ctx.lookDir) {
		dx = ctx.lookDir[0]; dy = ctx.lookDir[1]; dz = ctx.lookDir[2];
		const len = Math.hypot(dx, dy, dz) || 1;
		dx /= len; dy /= len; dz /= len;
	} else {
		dx = Math.sin(state.yaw); dy = 0; dz = Math.cos(state.yaw);
	}

	state.x += dx * state.speed * dt;
	state.y += dy * state.speed * dt;
	state.z += dz * state.speed * dt;

	// Extra manual vertical (Space up / Shift down).
	const vClimb = maxSpeed * 0.5;
	if (input.up) state.y += vClimb * dt;
	if (input.down) state.y -= vClimb * dt;

	// Face travel (yaw from the horizontal component of the look dir).
	if (Math.abs(dx) + Math.abs(dz) > 1e-4) state.yaw = Math.atan2(dx, dz);

	// Soft floor only — never auto-climb (the rider is excluded from the ray
	// by the caller, so this samples real terrain, not the player). Keep the
	// model's bottom from dipping below the ground.
	const bottom = ctx.bottomOffset ?? 0;
	const g = ctx.groundHeight(state.x, state.z);
	if (g != null && state.y + bottom < g + 0.5) state.y = g + 0.5 - bottom;
}

function stepOnRails(
	state: VehicleState,
	input: VehicleInput,
	dt: number,
	ctx: VehicleContext,
	maxSpeed: number,
): void {
	const curve = ctx.curve!;
	let dir = 1;
	if (ctx.type === 'train') {
		// Driver advances/reverses along the track.
		dir = input.forward ? 1 : input.backward ? -1 : 0;
	}
	const advance = (maxSpeed * dt * dir) / ctx.curveLength;
	state.t += advance;
	// Loop the curve for a continuous ride.
	if (state.t > 1) state.t -= 1;
	if (state.t < 0) state.t += 1;

	curve.getPointAt(state.t, _p);
	curve.getTangentAt(state.t, _tan);
	state.x = _p.x;
	state.y = _p.y;
	state.z = _p.z;
	if (dir !== 0 || ctx.type === 'coaster') {
		state.yaw = Math.atan2(_tan.x * dir || _tan.x, _tan.z * dir || _tan.z);
	}
}

/** Yaw to assign to the seated rider's `smoothedRotationRef`. */
export function vehicleSeatHeading(state: VehicleState): number {
	return state.yaw + Math.PI;
}

/**
 * Build a smooth closed-ish CatmullRom curve from `[[x,y,z],...]` waypoints.
 * Returns null for fewer than 2 points.
 */
export function buildWaypointCurve(points: number[][] | null | undefined): {
	curve: CatmullRomCurve3 | null;
	length: number;
} {
	if (!points || points.length < 2) return { curve: null, length: 0 };
	const pts = points
		.filter((p) => Array.isArray(p) && p.length >= 3 && p.every((n) => isFinite(n)))
		.map((p) => new Vector3(p[0], p[1], p[2]));
	if (pts.length < 2) return { curve: null, length: 0 };
	const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
	return { curve, length: curve.getLength() };
}
