/**
 * physicsVehicle — a thin wrapper around Rapier's raycast vehicle controller
 * (`DynamicRayCastVehicleController`, rapier 0.19+). Real wheel physics: a
 * dynamic chassis rigid body whose 4 wheels are suspension raycasts, with engine
 * force on the rear wheels and steering on the front.
 *
 * Tuned for the app's world scale: default gravity (−9.81), human-scale meters,
 * player capped at ~5 m/s. Forces are derived from the chassis MASS (so they
 * scale to any model size) and both linear + angular speed are hard-capped so it
 * can never run away, spin out, or tunnel through the terrain.
 *
 * Design: ONLY the local driver runs this; remotes/idle keep the kinematic
 * transform + lerp path (we just broadcast the chassis transform). The chassis
 * collider is a SENSOR — raycast wheels hold the vehicle up, so it drives
 * correctly while never fighting the force-snapped rider capsule.
 */

export interface PhysicsVehicleOptions {
	position: [number, number, number];
	quaternion: [number, number, number, number];
	/** Collider half-extents (world units, post-scale). */
	halfExtents: [number, number, number];
	/** bbox center relative to the model origin (chassis local). */
	centerOffset: [number, number, number];
	wheelRadius: number;
	/** Explicit wheel connection points (chassis-local), in controller order
	 *  [FL, FR, RL, RR] — from the GLB's xrp_wheel_01..04 objects. When provided
	 *  (exactly 4), these REPLACE the bbox-derived placement so the physics wheels
	 *  sit exactly where the modeled wheels are. */
	wheelConnections?: [number, number, number][];
	/** Terrain height under the spawn (x,z). When given, the chassis is placed at
	 *  the suspension's natural REST height so the wheels just touch the ground —
	 *  without this the wheels can spawn buried and the suspension launches it. */
	groundY?: number;
	/** Mass density of the chassis cuboid (kg/m³-ish). Gives mass + inertia. */
	density?: number;
	/** Target forward acceleration (m/s²) at full throttle. */
	engineAccel?: number;
	/** Hard top speed (m/s). Player walks at ~5; a car ~10-14 feels right. */
	maxSpeed?: number;
	/** Max steering angle (radians). */
	maxSteer?: number;
}

const MAX_ANGVEL = 2.6; // rad/s — clamp to prevent spin-out / barrel rolls
// Steering ramp: hold the key ~this long to reach full lock; a tap only nudges.
const STEER_RAMP_TIME = 1.0;   // s, 0 → full lock while held
const STEER_RETURN_TIME = 0.3; // s, back to centre when released (snappier)

export class PhysicsVehicle {
	private world: any;
	chassis: any;
	controller: any;
	private steer = 0;
	readonly maxSteer: number;
	readonly maxSpeed: number;
	private engineForceTotal: number;
	private brakeForce: number;
	/** Suspension rest length (for the visual wheel suspension offset). */
	readonly restLength: number;
	/** Chassis-center height above the ground at suspension rest. Used by the
	 *  caller to clamp the body within a band of the ground (anti-launch /
	 *  anti-fall-through) WITHOUT burying the wheels. */
	readonly restCenterAboveGround: number;
	/** Wheel raycasts hit ONLY fixed terrain — never the rider capsule or other
	 *  dynamic/kinematic bodies (those overlap the chassis and would read as
	 *  zero-distance ground → instant suspension launch). */
	private wheelFilterFlags = 0;
	/** Forward obstacle probe — a pooled horizontal ray + body dims. Lets the car
	 *  stop against trees / boulders / mountain walls / cliffs without solid
	 *  colliders fighting the rider or the terrain ground. */
	private probeRay: any = null;
	private probeHalfLen = 0.5;
	private probeHalfWidth = 0.5;
	static readonly FRONT = [0, 1];
	static readonly REAR = [2, 3];

	constructor(world: any, rapier: any, o: PhysicsVehicleOptions) {
		this.world = world;
		this.maxSteer = o.maxSteer ?? 0.5;
		this.maxSpeed = o.maxSpeed ?? 12;
		const density = o.density ?? 24;
		const engineAccel = o.engineAccel ?? 5;

		const [px, py, pz] = o.position;
		const [qx, qy, qz, qw] = o.quaternion;
		const [hx, hy, hz] = o.halfExtents;
		const [cx, cy, cz] = o.centerOffset;

		// Wheel geometry.
		const restLen = Math.max(0.2, hy * 0.4);
		const r = o.wheelRadius;
		this.restLength = restLen;

		// Wheel connection points (chassis-local), controller order [FL,FR,RL,RR].
		// Prefer the GLB's named wheels; otherwise derive from the bounding box
		// (5% end padding, inset ~one tire-width from each side, at the bottom).
		// NOTE: the named-wheel positions are the wheel CENTERS, but Rapier's
		// connection point is the TOP of the suspension — restLen ABOVE the wheel.
		// Passing the center directly starts the suspension fully collapsed and
		// the wheels thrash. So lift each connection up by restLen; at rest the
		// wheel center lands back at the modeled position.
		let conns: { x: number; y: number; z: number }[];
		if (o.wheelConnections && o.wheelConnections.length === 4) {
			conns = o.wheelConnections.map(([x, y, z]) => ({ x, y: y + restLen, z }));
		} else {
			const tireWidth = Math.min(r * 0.5, hx * 0.5);
			const wx = Math.max(0.05, hx - tireWidth);
			const END_PAD = 0.05;
			const wzF = cz + hz * (1 - 2 * END_PAD);
			const wzR = cz - hz * (1 - 2 * END_PAD);
			const wy = cy - hy * 0.4;
			conns = [
				{ x: cx - wx, y: wy, z: wzF }, // FL
				{ x: cx + wx, y: wy, z: wzF }, // FR
				{ x: cx - wx, y: wy, z: wzR }, // RL
				{ x: cx + wx, y: wy, z: wzR }, // RR
			];
		}
		const wConnLocalY = (conns[0].y + conns[1].y + conns[2].y + conns[3].y) / 4;
		// At rest: connectionWorldY = groundY + restLen + r, so the chassis CENTER
		// sits this far above the ground.
		this.restCenterAboveGround = restLen + r - wConnLocalY;

		// Place the body at the suspension REST height so wheels just kiss the
		// ground (a small margin makes it settle DOWN rather than launch up).
		let spawnY = py;
		if (o.groundY != null && isFinite(o.groundY)) {
			// Spawn well above the rest height so the suspension starts EXTENDED
			// (springs only push when compressed → an extended start can't launch);
			// it drops the short distance and settles.
			spawnY = o.groundY + restLen + r - wConnLocalY + 0.8;
		}

		const body = rapier.RigidBodyDesc.dynamic()
			.setTranslation(px, spawnY, pz)
			.setRotation({ x: qx, y: qy, z: qz, w: qw })
			.setCanSleep(false)
			.setCcdEnabled(true)          // continuous collision → never tunnel the map
			.setLinearDamping(0.25)       // light: lets it coast/ease to a stop, not brick-wall
			.setAngularDamping(5.0);      // heavily damp pitch/roll so a hard stop can't flip it
		this.chassis = world.createRigidBody(body);
		// Density-based mass gives a proper inertia tensor (resists spinning),
		// unlike a bare additional point-mass. Sensor: no solid contacts.
		// The collider center is dropped well below the bbox center so the CENTER
		// OF MASS sits low (near the wheels). A low CoM is THE setting that stops
		// the car doing a wheelie under power and flipping/slamming on stops — the
		// engine force is applied at the ground, so a high CoM levers the nose up.
		const col = rapier.ColliderDesc.cuboid(Math.max(0.25, hx), Math.max(0.2, hy), Math.max(0.25, hz))
			.setTranslation(cx, cy - hy * 0.35, cz)
			.setDensity(density)
			.setSensor(true);
		world.createCollider(col, this.chassis);

		// Engine force scales with mass so any model size feels the same.
		let mass = 50;
		try { mass = this.chassis.mass() || 50; } catch (e) { /* default */ }
		this.engineForceTotal = mass * engineAccel;
		// Barely-there coast brake. Strong braking pitches the nose and stops
		// abruptly — the light linear damping eases it down instead.
		this.brakeForce = mass * 0.04;

		// Wheel rays hit only FIXED bodies (terrain/mountains) — exclude dynamic
		// AND kinematic so the rider capsule can never register as ground.
		try {
			const QF = rapier.QueryFilterFlags;
			this.wheelFilterFlags = (QF.EXCLUDE_DYNAMIC | QF.EXCLUDE_KINEMATIC | QF.EXCLUDE_SENSORS) >>> 0;
		} catch (e) { this.wheelFilterFlags = 0; }

		// Forward obstacle probe geometry. Body half-length (along forward Z) sets
		// the reach; half-width (X) sets how far out the corner rays sit so a tree
		// the centreline misses still blocks a fender.
		this.probeHalfLen = Math.max(0.4, hz);
		this.probeHalfWidth = Math.max(0.3, hx);
		try { this.probeRay = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }); } catch (e) { this.probeRay = null; }

		this.controller = world.createVehicleController(this.chassis);
		try { this.controller.indexUpAxis = 1; } catch (e) { /* default Y */ }

		const down = { x: 0, y: -1, z: 0 };
		const axle = { x: -1, y: 0, z: 0 };
		for (const c of conns) this.controller.addWheel(c, down, axle, restLen, r);
		for (let i = 0; i < 4; i++) {
			this.set(i, 'setWheelSuspensionStiffness', 22);
			this.set(i, 'setWheelMaxSuspensionTravel', 0.25);
			this.set(i, 'setWheelSuspensionCompression', 0.85);
			this.set(i, 'setWheelSuspensionRelaxation', 0.9);
			// Grip. Side-friction stiffness is what makes it actually TURN instead
			// of understeering straight on — bumped up so the front wheels bite.
			this.set(i, 'setWheelFrictionSlip', 2.7);
			this.set(i, 'setWheelSideFrictionStiffness', 1.4);
			// CRITICAL: cap the suspension force. Uncapped, a spawn-frame
			// compression flings the chassis to orbit. ~6× the static load per
			// wheel (mass·g/4 ≈ mass·2.45) is plenty to absorb bumps, not launch.
			this.set(i, 'setWheelMaxSuspensionForce', mass * 15);
		}
	}

	private set(i: number, fn: string, v: number) {
		try { this.controller[fn](i, v); } catch (e) { /* api drift */ }
	}

	/** throttle ∈ [-1,1], steerInput ∈ [-1,1] (left negative / right positive). */
	setControls(throttle: number, steerInput: number, dt: number) {
		// Two-stage steering: while a turn key is held, the angle RAMPS toward
		// full lock over ~STEER_RAMP_TIME, so a quick tap only nudges it a little
		// (no instant full-jerk) while holding leans it fully. Released, it returns
		// to centre faster. Negative because Rapier's steering is opposite our
		// right-positive input.
		const target = -steerInput * this.maxSteer;
		const rampStep = (this.maxSteer / STEER_RAMP_TIME) * dt;     // slow: extend toward lock
		const returnStep = (this.maxSteer / STEER_RETURN_TIME) * dt; // fast: snap back to centre
		if (steerInput !== 0) {
			// If the wheel is currently turned the OPPOSITE way from where we now
			// want it (reversing left→right), get back through centre at the fast
			// return rate first, then ramp out to the new lock at the slow rate.
			// Otherwise a left→right flip crawled the whole sweep at the ramp rate.
			const reversing = this.steer !== 0 && Math.sign(this.steer) !== Math.sign(target);
			const step = reversing ? returnStep : rampStep;
			this.steer = this.steer < target
				? Math.min(target, this.steer + step)
				: Math.max(target, this.steer - step);
		} else {
			this.steer = this.steer > 0 ? Math.max(0, this.steer - returnStep) : Math.min(0, this.steer + returnStep);
		}
		for (const i of PhysicsVehicle.FRONT) this.controller.setWheelSteering(i, this.steer);
		// All-wheel drive: spread engine force across ALL four wheels (not just the
		// rear) so the torque doesn't squat the back / lift the nose. Reverse weaker.
		const dir = throttle >= 0 ? 1 : 0.5;
		const perWheel = (throttle * dir * this.engineForceTotal) / 4;
		for (let i = 0; i < 4; i++) this.controller.setWheelEngineForce(i, perWheel);
		// Brake when coasting so it settles instead of rolling forever.
		const brake = throttle === 0 ? this.brakeForce : 0;
		for (let i = 0; i < 4; i++) this.controller.setWheelBrake(i, brake);
	}

	/** Stop the chassis when a tree / boulder / mountain wall / steep cliff sits
	 *  just ahead — but NOT a drivable hill. A horizontal ray at chassis-centre
	 *  height, cast in the travel direction, three rays spanning the body width.
	 *  Crucially it inspects the HIT SURFACE NORMAL: only a near-vertical face
	 *  (wall, tree trunk, cliff) blocks; a sloped hillside (large normal.y) is
	 *  drivable and passes through, so the car can still climb steep grades it has
	 *  the torque for. Same fixed-only filter as the wheels (never the rider /
	 *  chassis sensor). When blocked, horizontal velocity is zeroed (vertical kept
	 *  for gravity / suspension) so the car noses up and holds. */
	private blockObstacles() {
		if (!this.probeRay) return;
		try {
			const v = this.chassis.linvel();
			const hs = Math.hypot(v.x, v.z);
			if (hs < 0.3) return; // standing still — let steering re-aim freely
			const dirX = v.x / hs, dirZ = v.z / hs;
			const t = this.chassis.translation();
			const reach = this.probeHalfLen + 0.7;
			const perpX = dirZ, perpZ = -dirX; // right vector (horizontal)
			const lat = this.probeHalfWidth * 0.85;
			this.probeRay.dir.x = dirX; this.probeRay.dir.y = 0; this.probeRay.dir.z = dirZ;
			// A surface is a "wall" (block it) when its normal is nearly horizontal.
			// normal.y = cos(slope); WALL_MAX_NY 0.45 ≈ slopes steeper than ~63°.
			// Anything shallower is a hill the wheels can climb — let it through.
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
		// Hard caps so it can never run away, launch, or spin out — regardless of
		// any tuning value. These are the ultimate safety net.
		try {
			const v = this.chassis.linvel();
			const hs = Math.hypot(v.x, v.z);
			let vx = v.x, vy = v.y, vz = v.z;
			if (hs > this.maxSpeed) {
				const k = this.maxSpeed / hs;
				vx = v.x * k; vz = v.z * k;
			}
			// Clamp VERTICAL speed too — a suspension spike is vertical, and an
			// unclamped vy is exactly what shot the car into the sky.
			const VMAX_Y = 8;
			if (vy > VMAX_Y) vy = VMAX_Y;
			else if (vy < -VMAX_Y) vy = -VMAX_Y;
			if (vx !== v.x || vy !== v.y || vz !== v.z) {
				this.chassis.setLinvel({ x: vx, y: vy, z: vz }, true);
			}
			const w = this.chassis.angvel();
			const ws = Math.hypot(w.x, w.y, w.z);
			if (ws > MAX_ANGVEL) {
				const k = MAX_ANGVEL / ws;
				this.chassis.setAngvel({ x: w.x * k, y: w.y * k, z: w.z * k }, true);
			}
		} catch (e) { /* ignore */ }
		// After the safety caps: refuse to climb trees / walls / cliffs ahead.
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
