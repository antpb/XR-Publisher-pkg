/**
 * physicsBike — REAL Rapier raycast-vehicle physics for a TWO-wheeled vehicle
 * (motorcycle): the 2-wheel sibling of physicsVehicle.ts. A dynamic chassis on
 * two suspension-raycast wheels (front steers, both drive), with the same
 * mass-derived forces, low centre of mass, sensor chassis, and safety caps as
 * the car — PLUS an active balance loop.
 *
 * Why the balance loop: a two-wheeler is an inverted pendulum. With both wheels
 * on the centreline there is NOTHING holding it upright — left to physics it
 * tips over instantly. So each step we drive the chassis ROLL (lean about its
 * own forward axis) toward a target: zero when going straight, leaned into the
 * turn when steering. We do it as a VELOCITY controller (set the roll-axis
 * angular velocity), not a torque PD — that can't oscillate or fall, so it's
 * stable without delicate gain tuning. Everything else — drive, steer,
 * suspension, ground contact, collision, yaw, pitch — is real physics, exactly
 * like the car. The resulting chassis transform broadcasts to peers unchanged.
 *
 * Tunables are grouped at the top; the lean SIGN may need flipping in-world
 * (a bike must lean INTO the turn — see BIKE_LEAN_SIGN).
 */

const STEER_RAMP_TIME = 0.5;   // s to reach full lock while held
const STEER_RETURN_TIME = 0.25;

// Upright controller. A two-wheeler is an inverted pendulum: with both wheels on
// the centreline NOTHING resists roll, and a pure velocity nudge loses to the
// per-step gravity/force torque (it tips and the sensor chassis sinks through the
// ground). So instead of nudging the roll velocity we OWN the orientation: each
// step we force the chassis to (heading-yaw, commanded-lean, zero-pitch) and keep
// only the yaw angular velocity. Physics still drives + steers + suspends + moves
// it; it just can't fall over or nose-dive under the terrain.
const MAX_LEAN = 0.6;          // rad (~34°) hard cap on lean either way
const LEAN_EASE = 8;           // 1/s — how fast the visible lean eases to its target
// Direction knobs — the two things most likely to need flipping in-world:
const STEER_SIGN = -1;         // front-wheel steer direction — MATCHES the car (Rapier steering is opposite our input). Lean is keyed off raw input separately, so this only affects the wheel.
const DRIVE_SIGN = 1;          // rear-wheel drive direction — MATCHES the car (positive engine force = forward). DO NOT flip this for a "wheel spins backward" report — that's the VISUAL wheel roll (BIKE_WHEEL_SPIN_SIGN in RideableObject), not the drive force.
const BIKE_LEAN_SIGN = 1;      // lean direction (flip if it leans AWAY from the turn)
// Target lean from steer × speed: full lean needs both a full steer and speed.
const LEAN_PER_STEER = MAX_LEAN;
const LEAN_FULL_SPEED = 6;     // m/s at which a full steer yields full lean
// Anti-spin-out. The powerful rear can yaw the bike faster than it can recover,
// and the balance loop preserves yaw velocity with little damping, so a hard
// lean runs away into a 180. Cap the yaw RATE (speed-sensitive: tight turns at
// low speed, limited at speed) and bleed rear POWER as steering increases.
const YAW_RATE_LOW = 3.2;      // rad/s — max turn rate below YAW_LOW_SPEED (tight, controllable)
const YAW_RATE_HIGH = 1.3;     // rad/s — floor on the high-speed yaw cap
const YAW_RATE_K = 4.5;        // yaw cap at speed = max(YAW_RATE_HIGH, K / speed)
const YAW_LOW_SPEED = 1.4;     // m/s below which the low-speed cap applies
const CORNER_POWER_CUT = 0.45; // fraction of rear drive removed at full steer lock

export interface PhysicsBikeOptions {
	position: [number, number, number];
	quaternion: [number, number, number, number];
	halfExtents: [number, number, number];
	centerOffset: [number, number, number];
	wheelRadius: number;
	/** Chassis-local wheel connection points [FRONT, REAR] from xrp_wheel_01/02.
	 *  When omitted (or not length 2) they're derived from the bbox on the
	 *  centreline. */
	wheelConnections?: [number, number, number][];
	groundY?: number;
	density?: number;
	engineAccel?: number;
	maxSpeed?: number;
	maxSteer?: number;
}

export class PhysicsBike {
	private world: any;
	chassis: any;
	controller: any;
	private steer = 0;        // current front-wheel angle (Rapier convention)
	private steerInput = 0;   // last raw input intent, −1..1 (drives lean direction)
	private lean = 0;         // current eased lean angle (rad), owned by the controller
	readonly maxSteer: number;
	readonly maxSpeed: number;
	private engineForceTotal: number;
	private brakeForce: number;
	readonly restLength: number;
	readonly restCenterAboveGround: number;
	private wheelFilterFlags = 0;
	// Forward obstacle probe (same as the car): a horizontal ray in the travel
	// direction that stops the bike against near-vertical faces (tree trunks,
	// walls, cliffs) so it can't drive UP collidable surfaces, while still letting
	// drivable slopes through.
	private probeRay: any = null;
	private probeHalfLen = 0.5;
	private probeHalfWidth = 0.5;
	// Bike wheels: 0 = front (steers), 1 = rear.
	static readonly FRONT = [0];

	constructor(world: any, rapier: any, o: PhysicsBikeOptions) {
		this.world = world;
		this.maxSteer = o.maxSteer ?? 0.6;
		this.maxSpeed = o.maxSpeed ?? 14;
		const density = o.density ?? 24;
		const engineAccel = o.engineAccel ?? 7;

		const [px, py, pz] = o.position;
		const [qx, qy, qz, qw] = o.quaternion;
		const [hx, hy, hz] = o.halfExtents;
		const [cx, cy, cz] = o.centerOffset;

		const restLen = Math.max(0.2, hy * 0.4);
		const r = o.wheelRadius;
		this.restLength = restLen;

		// Two wheels on the CENTRELINE (x = cx): front toward +Z, rear toward −Z.
		// As with the car, lift the connection point up by restLen so the modeled
		// wheel centre lands back at its position at suspension rest.
		let conns: { x: number; y: number; z: number }[];
		if (o.wheelConnections && o.wheelConnections.length === 2) {
			conns = o.wheelConnections.map(([x, y, z]) => ({ x, y: y + restLen, z }));
		} else {
			const END_PAD = 0.05;
			const wy = cy - hy * 0.4;
			conns = [
				{ x: cx, y: wy, z: cz + hz * (1 - 2 * END_PAD) }, // FRONT
				{ x: cx, y: wy, z: cz - hz * (1 - 2 * END_PAD) }, // REAR
			];
		}
		const wConnLocalY = (conns[0].y + conns[1].y) / 2;
		this.restCenterAboveGround = restLen + r - wConnLocalY;

		let spawnY = py;
		if (o.groundY != null && isFinite(o.groundY)) {
			spawnY = o.groundY + restLen + r - wConnLocalY + 0.8;
		}

		const body = rapier.RigidBodyDesc.dynamic()
			.setTranslation(px, spawnY, pz)
			.setRotation({ x: qx, y: qy, z: qz, w: qw })
			.setCanSleep(false)
			.setCcdEnabled(true)
			.setLinearDamping(0.25)
			// Lighter angular damping than the car (5.0): the bike must yaw/roll
			// responsively, and the balance loop owns roll directly anyway.
			.setAngularDamping(1.2);
		this.chassis = world.createRigidBody(body);

		// CoM low and CENTRED. This is REAR-wheel drive: traction = grip × weight ON
		// THE REAR WHEEL, so weight must NOT shift forward off the driven wheel (a
		// forward CoM unloaded the rear and it couldn't move at all — grip with no
		// normal force is zero force). Centred keeps ~half the weight on the rear for
		// drive AND half on the front for steering grip. No forward bias is needed for
		// wheelie protection — the orientation lock already makes a nose-up rotation
		// impossible; the front tyre stays loaded because the body is held level.
		const col = rapier.ColliderDesc.cuboid(Math.max(0.2, hx), Math.max(0.2, hy), Math.max(0.25, hz))
			.setTranslation(cx, cy - hy * 0.4, cz)
			.setDensity(density)
			.setSensor(true);
		world.createCollider(col, this.chassis);

		let mass = 50;
		try { mass = this.chassis.mass() || 50; } catch (e) { /* default */ }
		this.engineForceTotal = mass * engineAccel;
		this.brakeForce = mass * 0.04;

		try {
			const QF = rapier.QueryFilterFlags;
			this.wheelFilterFlags = (QF.EXCLUDE_DYNAMIC | QF.EXCLUDE_KINEMATIC | QF.EXCLUDE_SENSORS) >>> 0;
		} catch (e) { this.wheelFilterFlags = 0; }

		// Forward obstacle probe geometry: reach along forward (Z) from the body
		// half-length, lateral rays at the body half-width.
		this.probeHalfLen = Math.max(0.4, hz);
		this.probeHalfWidth = Math.max(0.3, hx);
		try { this.probeRay = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }); } catch (e) { this.probeRay = null; }

		this.controller = world.createVehicleController(this.chassis);
		try { this.controller.indexUpAxis = 1; } catch (e) { /* default Y */ }

		const down = { x: 0, y: -1, z: 0 };
		const axle = { x: -1, y: 0, z: 0 };
		for (const c of conns) this.controller.addWheel(c, down, axle, restLen, r);
		for (let i = 0; i < 2; i++) {
			// Stiffer + more heavily damped + less travel than the car so the FRAME
			// rides tight to the wheels instead of bobbing on soft springs (the bike
			// felt "detached / bouncy"). Damping (compression/relaxation) is what kills
			// the oscillation; stiffness + reduced travel cut the vertical play.
			this.set(i, 'setWheelSuspensionStiffness', 32);
			this.set(i, 'setWheelMaxSuspensionTravel', 0.18);
			this.set(i, 'setWheelSuspensionCompression', 2.2);
			this.set(i, 'setWheelSuspensionRelaxation', 2.2);
			// REAR (1) is the ONLY driven wheel — all drive force goes through its
			// single contact patch, so it needs much more grip than a car wheel or it
			// just slips and the bike crawls. Front (0) only rolls/steers.
			this.set(i, 'setWheelFrictionSlip', i === 1 ? 6.0 : 2.8);
			this.set(i, 'setWheelSideFrictionStiffness', 1.5);
			this.set(i, 'setWheelMaxSuspensionForce', mass * 18);
		}
	}

	private set(i: number, fn: string, v: number) {
		try { this.controller[fn](i, v); } catch (e) { /* api drift */ }
	}

	/** throttle ∈ [-1,1], steerInput ∈ [-1,1] (left negative / right positive). */
	setControls(throttle: number, steerInput: number, dt: number) {
		this.steerInput = steerInput;
		const target = STEER_SIGN * steerInput * this.maxSteer;
		const rampStep = (this.maxSteer / STEER_RAMP_TIME) * dt;
		const returnStep = (this.maxSteer / STEER_RETURN_TIME) * dt;
		if (steerInput !== 0) {
			const reversing = this.steer !== 0 && Math.sign(this.steer) !== Math.sign(target);
			const step = reversing ? returnStep : rampStep;
			this.steer = this.steer < target
				? Math.min(target, this.steer + step)
				: Math.max(target, this.steer - step);
		} else {
			this.steer = this.steer > 0 ? Math.max(0, this.steer - returnStep) : Math.min(0, this.steer + returnStep);
		}
		this.controller.setWheelSteering(0, this.steer); // FRONT steers only
		// REAR-WHEEL DRIVE — a real motorbike. The front wheel must NEVER get engine
		// force: a powered, steered front wheel makes a lateral thrust that, past a
		// little speed, overpowers the rear and spins the bike in place / snaps a 180.
		// Front only steers; rear (1) gets the full drive force. Reverse weaker.
		const dir = throttle >= 0 ? 1 : 0.5;
		// Bleed rear power as the steer angle grows: a hard corner under full power
		// breaks the rear loose and spins it out. Less power mid-corner keeps it.
		const steerFrac = this.maxSteer ? Math.abs(this.steer) / this.maxSteer : 0;
		const corneringCut = 1 - CORNER_POWER_CUT * steerFrac;
		const driveForce = DRIVE_SIGN * throttle * dir * this.engineForceTotal * corneringCut;
		this.controller.setWheelEngineForce(0, 0);          // front: NO drive
		this.controller.setWheelEngineForce(1, driveForce); // rear: pushes
		const brake = throttle === 0 ? this.brakeForce : 0;
		this.controller.setWheelBrake(0, brake);
		this.controller.setWheelBrake(1, brake);
	}

	private applyQuat(v: { x: number; y: number; z: number }, q: any) {
		// v' = q * v * q⁻¹
		const ix = q.w * v.x + q.y * v.z - q.z * v.y;
		const iy = q.w * v.y + q.z * v.x - q.x * v.z;
		const iz = q.w * v.z + q.x * v.y - q.y * v.x;
		const iw = -q.x * v.x - q.y * v.y - q.z * v.z;
		return {
			x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
			y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
			z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
		};
	}

	/** Force the chassis upright: heading-yaw (from physics — steering owns it),
	 *  commanded lean about the forward axis, ZERO pitch. We set the orientation
	 *  directly and keep only the yaw angular velocity, so the bike physically
	 *  cannot tip over or nose-dive under the terrain. Position, drive, steer and
	 *  suspension are all still real physics. */
	private balance(targetLean: number, dt: number) {
		try {
			const q = this.chassis.rotation();
			// Heading from the current forward vector (the controller yaws the body
			// when steering; we read that back and preserve it).
			const fwd = this.applyQuat({ x: 0, y: 0, z: 1 }, q);
			const yaw = Math.atan2(fwd.x, fwd.z);
			// Ease the visible lean toward target so it banks smoothly.
			const tgt = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, targetLean));
			const k = Math.min(1, LEAN_EASE * dt);
			this.lean += (tgt - this.lean) * k;
			// Build q = Ry(yaw) · Rz(lean): upright, leaned about the heading forward
			// axis, no pitch. (a = yaw/2, b = lean/2.)
			const a = yaw * 0.5, b = this.lean * 0.5;
			const sa = Math.sin(a), ca = Math.cos(a);
			const sb = Math.sin(b), cb = Math.cos(b);
			this.chassis.setRotation({ x: sa * sb, y: sa * cb, z: ca * sb, w: ca * cb }, true);
			// Keep yaw rate (so steering keeps turning the body next step); kill the
			// roll/pitch tumble the wheel forces and gravity produced this step. CAP the
			// yaw rate so a hard lean/steer can't run away into a 180 spin-out — tight
			// at low speed, tighter limit at speed.
			const w = this.chassis.angvel();
			const sp = Math.abs(this.speed);
			const maxYaw = sp < YAW_LOW_SPEED ? YAW_RATE_LOW : Math.max(YAW_RATE_HIGH, YAW_RATE_K / sp);
			let wy = w.y;
			if (wy > maxYaw) wy = maxYaw; else if (wy < -maxYaw) wy = -maxYaw;
			this.chassis.setAngvel({ x: 0, y: wy, z: 0 }, true);
		} catch (e) { /* physics not ready */ }
	}

	/** Lean target (rad) from steer intent + speed: a bike leans INTO the turn
	 *  proportional to how fast it goes. Keyed off the raw input direction (not the
	 *  Rapier wheel sign) so it always banks the way the rider is turning. */
	leanTarget(): number {
		const speedFac = Math.min(1, Math.abs(this.speed) / LEAN_FULL_SPEED);
		return BIKE_LEAN_SIGN * this.steerInput * LEAN_PER_STEER * speedFac;
	}

	/** Refuse to drive UP near-vertical collidable surfaces (tree trunks, walls,
	 *  cliffs). A horizontal ray at chassis-centre height, cast in the travel
	 *  direction across the body width; it inspects the HIT NORMAL — only a
	 *  near-vertical face blocks (normal.y small), a sloped hill (large normal.y)
	 *  passes so the bike can still climb grades it has the torque for. When
	 *  blocked, horizontal velocity is zeroed (vertical kept for gravity/suspension).
	 *  Same fixed-only filter as the wheels (never the rider / chassis sensor). */
	private blockObstacles() {
		if (!this.probeRay) return;
		try {
			const v = this.chassis.linvel();
			const hs = Math.hypot(v.x, v.z);
			if (hs < 0.3) return; // standing still — let steering re-aim freely
			const dirX = v.x / hs, dirZ = v.z / hs;
			const t = this.chassis.translation();
			const reach = this.probeHalfLen + 0.7;
			const perpX = dirZ, perpZ = -dirX; // horizontal right vector
			const lat = this.probeHalfWidth * 0.85;
			this.probeRay.dir.x = dirX; this.probeRay.dir.y = 0; this.probeRay.dir.z = dirZ;
			// normal.y = cos(slope); WALL_MAX_NY 0.45 ≈ faces steeper than ~63° are walls.
			const WALL_MAX_NY = 0.45;
			let blocked = false;
			for (const off of [0, lat, -lat]) {
				this.probeRay.origin.x = t.x + perpX * off;
				this.probeRay.origin.y = t.y;
				this.probeRay.origin.z = t.z + perpZ * off;
				const hit = this.world.castRayAndGetNormal(this.probeRay, reach, true, this.wheelFilterFlags || undefined);
				if (hit && hit.timeOfImpact < reach && hit.normal && Math.abs(hit.normal.y) < WALL_MAX_NY) {
					blocked = true;
					break;
				}
			}
			if (blocked) this.chassis.setLinvel({ x: 0, y: v.y, z: 0 }, true);
		} catch (e) { /* ignore */ }
	}

	update(dt: number, filterPredicate?: (collider: any) => boolean) {
		this.controller.updateVehicle(dt, this.wheelFilterFlags || undefined, undefined, filterPredicate);
		// Safety caps (linear + vertical + angular), same intent as the car.
		try {
			const v = this.chassis.linvel();
			const hs = Math.hypot(v.x, v.z);
			let vx = v.x, vy = v.y, vz = v.z;
			if (hs > this.maxSpeed) { const k = this.maxSpeed / hs; vx = v.x * k; vz = v.z * k; }
			const VMAX_Y = 8;
			if (vy > VMAX_Y) vy = VMAX_Y; else if (vy < -VMAX_Y) vy = -VMAX_Y;
			if (vx !== v.x || vy !== v.y || vz !== v.z) this.chassis.setLinvel({ x: vx, y: vy, z: vz }, true);
		} catch (e) { /* ignore */ }
		// Force upright AFTER the controller (it must override the roll/pitch the
		// wheel forces and gravity produced this step, or the bike tips and sinks).
		this.balance(this.leanTarget(), dt);
		// Refuse to climb trees / walls / cliffs ahead.
		this.blockObstacles();
	}

	get speed(): number {
		try { return this.controller.currentVehicleSpeed(); } catch (e) { return 0; }
	}

	get transform() {
		const t = this.chassis.translation();
		const r = this.chassis.rotation();
		return {
			position: [t.x, t.y, t.z] as [number, number, number],
			quaternion: [r.x, r.y, r.z, r.w] as [number, number, number, number],
		};
	}

	wheel(i: number) {
		return {
			steering: this.controller.wheelSteering(i) ?? 0,
			rotation: this.controller.wheelRotation(i) ?? 0,
			suspension: this.controller.wheelSuspensionLength(i) ?? 0,
			connection: this.controller.wheelChassisConnectionPointCs(i),
			radius: this.controller.wheelRadius(i) ?? 0.3,
			inContact: this.controller.wheelIsInContact(i),
		};
	}

	dispose() {
		try { this.world.removeVehicleController(this.controller); } catch (e) { /* ignore */ }
		try { this.world.removeRigidBody(this.chassis); } catch (e) { /* ignore */ }
		this.controller = null;
		this.chassis = null;
	}
}
