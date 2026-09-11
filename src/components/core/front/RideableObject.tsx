import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Group, Quaternion, Euler, MathUtils, Box3, Vector3 } from 'three';
import { useRapier, useBeforePhysicsStep } from '@react-three/rapier';

import { prepareGltfScene } from './materialConvert';
import { PhysicsVehicle } from './physicsVehicle';
import { PhysicsBike } from './physicsBike';
import RideableInteractionBanner from '../../RideableInteractionBanner';
import useRideStore from '../../../stores/rideStore';
import {
	hashVehicleId,
	hashClientId16,
	getNetworkedVehicle,
	isVehicleOwnedByOther,
	ensureVehicleNetListener,
	VEHICLE_STALE_MS,
} from '../../../stores/vehicleStateStore';
import { setRideSeat, clearRideSeat } from '../../../networking/rideSeat';
import { setRemoteRider, clearRemoteRider } from '../../../networking/remoteRiders';
import {
	getOccupancy,
	nextFreeSeat,
	setLocalOccupancy,
	localClientId,
	ensureOccupancyListener,
	OCCUPANCY_STALE_MS,
} from '../../../networking/vehicleOccupancy';
import { rideInput } from '../../../networking/rideInput';
import { getNetworkBridge } from '../../../networking/NetworkBridge';
import {
	stepVehicle,
	vehicleSeatHeading,
	vehicleTypeToInt,
	buildWaypointCurve,
	isGroundOrHoverType,
	isWaterType,
	isGroundDriveType,
	vehicleRideHeight,
	type VehicleType,
	type VehicleState,
} from './vehicleLocomotion';
import { getNpcWaterLevel } from './npcObstacles';
import type { RideableProps } from './RideableObject.d';

const RAY_HEIGHT = 300; // ray cast start height for ground sampling (above all terrain)
const BROADCAST_INTERVAL_MS = 50; // 20Hz driver broadcast (tiered per peer downstream)

// ── Motorcycle (bike) handling ──
// Two-wheelers lean into turns (the whole bike + rider rolls) and steer the
// FRONT wheel only a little — most direction change comes from the lean. Lean
// + steer scale with speed (no lean parked). All three numbers are visual feel;
// tune to taste. The lean rolls the model AND the rider; both network for free
// (lean rides the broadcast rotation, steer rides the steer byte). Capacity is
// capped so a bike seats at most a driver + 1 passenger.
const BIKE_MAX_LEAN = 0.55;        // rad (~31°) at full lock + speed
const BIKE_FRONT_STEER = 0.28;     // rad front-wheel turn at full lock, low speed
const BIKE_LEAN_FULL_SPEED = 6;    // m/s at which lean/steer reach full scale
const BIKE_MAX_PASSENGERS = 1;     // → capacity 2 (driver + 1)

// ── Propellers ──
// Any model node named xrp_propeller_NN (any count) spins around the vehicle's
// FORWARD axis (the drive-shaft / nose) while the vehicle is occupied — boats,
// planes, etc. Spin rate = idle tick-over + a term scaling with speed (it just
// blurs faster the quicker you go). Derived from speed, so it networks for free.
const PROP_IDLE = 6;            // rad/s engine idle (≈1 rev/s) while occupied
const PROP_SPIN_PER_SPEED = 9;  // rad/s of extra spin per m/s of speed

const _q = new Quaternion();
const _e = new Euler();
const _box = new Box3();
const _center = new Vector3();
const _camDir = new Vector3();
// Terrain-tilt temps.
const _tiltQuat = new Quaternion();
const _tiltOnly = new Quaternion();
const _qYaw = new Quaternion();
const _fwd3 = new Vector3();
const _right3 = new Vector3();
const _normal = new Vector3();
const _seatLocal = new Vector3();
const _UP = new Vector3(0, 1, 0);
const _parentQ = new Quaternion();
const _parentInv = new Quaternion();
const _chassisQ = new Quaternion();
const _localUp = new Vector3();
const _localAxle = new Vector3();
const _wheelCenter = new Vector3();
const _leanQuat = new Quaternion();
const _wc1 = new Vector3();
const _wc2 = new Vector3();

/**
 * Rideable vehicle block. One component serves WebGPU + WebGL (materials run
 * through the shared converter). Per frame it is in exactly one mode:
 *   - DRIVER  : local player mounted THIS vehicle → integrate motion from the
 *               `movement` ref, write the seat transform for Player.jsx, and
 *               broadcast the vehicle transform to peers.
 *   - REMOTE  : a peer is driving → lerp the mesh to the networked transform.
 *   - IDLE    : nobody driving → rest at the authored spawn.
 */
export function RideableObject(model: RideableProps): React.JSX.Element | null {
	const groupRef = useRef<Group>(null);
	const { gl, camera } = useThree();
	const { world, rapier } = useRapier();

	const rideableId = model.rideableId;
	const vehicleType = (model.vehicleType || 'car') as VehicleType;
	const typeInt = vehicleTypeToInt(vehicleType);
	const speedScale = model.speed && isFinite(model.speed) && model.speed > 0 ? model.speed : 1;
	// seatOffset is a NUDGE applied on top of the auto-derived seat (the model's
	// bounding-box center). Authors tweak it; an explicit value overrides the
	// default. DEFAULT_SEAT_LIFT raises the rider a bit off the bbox center so
	// they sit IN the seat rather than sunk into it (the center sits low for a
	// driver). A per-model seat anchor will replace this later.
	const DEFAULT_SEAT_LIFT = 0.22;
	const seatOffset: [number, number, number] = [
		model.seatOffsetX ?? 0,
		(model.seatOffsetY ?? 0) + DEFAULT_SEAT_LIFT,
		model.seatOffsetZ ?? 0,
	];
	// Auto seat: local-space offset of the model's bbox center from the group
	// origin (computed once after load). The rider's FEET target = this center;
	// Player adds the capsule half-height when snapping the body.
	const autoSeatRef = useRef<[number, number, number] | null>(null);
	// Local Y of the model's lowest point relative to the group origin — used
	// to seat the model's BOTTOM on terrain/water instead of burying the origin.
	const modelBottomRef = useRef<number>(0);
	// Model bbox half-extents (post-scale) — for the physics chassis collider.
	const modelHalfRef = useRef<[number, number, number] | null>(null);

	const url = model.url;
	const gltf = useLoader(GLTFLoader, url);

	// CLONE the loaded scene per vehicle. useLoader caches by URL, so multiple
	// rideables sharing a model URL would otherwise reference one Object3D —
	// and an Object3D can only have a single parent, so only the last-mounted
	// vehicle would render. Cloning gives each its own scene (materials are
	// shared by clone(), which is fine). Material conversion runs on the clone.
	const vehicleScene = useMemo(() => {
		if (!gltf?.scene) return null;
		const cloned = gltf.scene.clone(true);
		prepareGltfScene(cloned, gl);
		return cloned;
	}, [gltf?.scene, gl]);

	// On-rails curve (train/coaster).
	const { curve, length: curveLength } = useMemo(
		() => buildWaypointCurve(model.waypoints),
		[model.waypoints]
	);

	// Authored seat layout. `seats` is a JSON array of [x,y,z] LOCAL offsets
	// (relative to the auto bbox-center, same frame as seatOffset). Index 0 is
	// the driver, 1..N passengers; boarding order fills them. Absent/empty →
	// single-seat (driver only) using the auto-center + seatOffset nudge.
	const seatsArray: number[][] | null =
		model.seats && Array.isArray(model.seats) && model.seats.length ? model.seats : null;
	// Two-wheelers seat a driver + at most BIKE_MAX_PASSENGERS, even if more seats
	// are authored (authors still define the seat positions the same way).
	const seatCap = vehicleType === 'bike' ? 1 + BIKE_MAX_PASSENGERS : Infinity;
	const capacity = seatsArray ? Math.min(seatCap, Math.max(1, seatsArray.length)) : 1;

	// Install the network → store bridges once (idempotent).
	useEffect(() => {
		ensureVehicleNetListener();
		ensureOccupancyListener();
	}, []);

	// Local player's place in THIS vehicle (or null if not aboard here).
	const localRole = useRideStore(
		(s) => (s.isMounted && s.vehicleId === rideableId ? s.role : null)
	);
	const localSeatIndex = useRideStore(
		(s) => (s.isMounted && s.vehicleId === rideableId ? s.seatIndex : -1)
	);
	const isLocalDriver = localRole === 'driver';
	const isLocalPassenger = localRole === 'passenger';
	// Driver-authoritative occupant list (seat index → client id) while WE drive.
	const occupantsRef = useRef<(string | null)[]>([]);

	// Persistent locomotion state, seeded from the authored spawn.
	const vstateRef = useRef<VehicleState>({
		x: model.positionX || 0,
		y: model.positionY || 0,
		z: model.positionZ || 0,
		yaw: (model.rotationY || 0) * MathUtils.DEG2RAD,
		speed: 0,
		t: 0,
		bob: 0,
	});
	const wasDriverRef = useRef(false);
	const lastBroadcastRef = useRef(0);
	// Real-physics chassis (created while THIS client drives a wheeled vehicle).
	const physicsRef = useRef<PhysicsVehicle | PhysicsBike | null>(null);
	const isLocalDriverRef = useRef(false);
	isLocalDriverRef.current = isLocalDriver;
	// Real rapier physics for ground-drive types. Cars/animals use the 4-wheel
	// PhysicsVehicle; bikes use the 2-wheel PhysicsBike (raycast wheels + an
	// active self-balance/lean loop). Both broadcast the resulting chassis
	// transform, so remotes/idle keep the kinematic lerp path.
	const usePhysics = isGroundDriveType(vehicleType);
	const useBikePhysics = vehicleType === 'bike';
	// Smoothed lean angle (radians) for the bike, rolled into the model + rider.
	const leanAngleRef = useRef(0);

	// Named wheels (Blender export convention): objects xrp_wheel_01..04 map to
	// controller wheels FL, FR, RL, RR (left/right/left/right; 01/02 front). When
	// present, their positions place the PHYSICS wheels exactly, and the meshes
	// spin/steer with the simulation. Models without them fall back to bbox-derived
	// wheels and just don't have visibly rotating wheels.
	type WheelNode = { index: number; obj: any; baseQuat: Quaternion; basePos: Vector3; front: boolean; spinAngle: number; center: Vector3; centerComputed: boolean };
	const wheelNodes = useMemo<WheelNode[]>(() => {
		if (!vehicleScene) return [];
		const found: WheelNode[] = [];
		for (let i = 0; i < 4; i++) {
			const target = `xrp_wheel_0${i + 1}`;
			let node: any = null;
			vehicleScene.traverse((o: any) => {
				if (!node && (o.name || '').toLowerCase() === target) node = o;
			});
			if (node) {
				found.push({ index: i, obj: node, baseQuat: node.quaternion.clone(), basePos: node.position.clone(), front: i < 2, spinAngle: 0, center: new Vector3(), centerComputed: false });
			}
		}
		// Steered front wheels: a 4-wheeler steers indices 0-1; a 2-wheel bike
		// steers ONLY the front (index 0) so the rear stays fixed.
		const nFront = found.length <= 2 ? 1 : 2;
		for (const w of found) w.front = w.index < nFront;
		return found;
	}, [vehicleScene]);

	// Propellers (boats, planes): every node named xrp_propeller_NN (any count,
	// any numbering) spins around the vehicle's forward axis while occupied. We
	// gather ALL of them and respect the count — model the prop with its shaft
	// along the vehicle's length (blades perpendicular), like a boat screw.
	type PropNode = { obj: any; baseQuat: Quaternion; spinAngle: number };
	const propellerNodes = useMemo<PropNode[]>(() => {
		if (!vehicleScene) return [];
		const found: PropNode[] = [];
		vehicleScene.traverse((o: any) => {
			if (/^xrp_propeller_\d+$/.test((o.name || '').toLowerCase())) {
				found.push({ obj: o, baseQuat: o.quaternion.clone(), spinAngle: 0 });
			}
		});
		return found;
	}, [vehicleScene]);
	// Wheel connection points (chassis-local) + radius, computed from the named
	// wheels' world positions once the model has matrices.
	const wheelConnsRef = useRef<[number, number, number][] | null>(null);
	const wheelRadiusRef = useRef<number>(0);
	// Remote wheel animation: only the driver runs the physics, so remotes
	// (passengers + bystanders) derive wheel motion from the synced chassis —
	// spin from how far it moves, front-wheel steer from how fast it yaws.
	const remotePrevPosRef = useRef(new Vector3());
	const remoteSpeedRef = useRef(0);
	const remoteSteerRef = useRef(0);
	const remoteWheelReadyRef = useRef(false);
	// Ground/hover vehicles drop onto the terrain once it's available, so they
	// rest in the world instead of floating at the authored Y.
	const groundedRef = useRef(false);

	// Ground height sampler (rapier ray straight down). Hits ONLY fixed bodies
	// (terrain/mountains) — excluding dynamic + kinematic means it can never hit
	// the seated rider's capsule. The handle-based exclusion didn't work and the
	// ray hit the rider, creating a feedback loop that drove the vehicle into the
	// sky (gy tracked the climbing rider → floor clamp pushed the chassis up → …).
	const groundHeight = useMemo(() => {
		let flags = 0;
		try {
			const QF = (rapier as any).QueryFilterFlags;
			flags = (QF.EXCLUDE_DYNAMIC | QF.EXCLUDE_KINEMATIC | QF.EXCLUDE_SENSORS) >>> 0;
		} catch (e) { flags = 0; }
		// Pool ONE Ray + origin object — groundHeight is called many times per
		// frame while driving (tilt samples, exit, floor clamp, dry-spot search).
		// Allocating a Ray each call was the biggest per-frame GC churn.
		const rayOrigin = { x: 0, y: RAY_HEIGHT, z: 0 };
		let ray: any = null;
		try { ray = new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 }); } catch (e) { ray = null; }
		return (x: number, z: number): number | null => {
			if (!ray) return null;
			try {
				rayOrigin.x = x; rayOrigin.y = RAY_HEIGHT; rayOrigin.z = z;
				const hit = world.castRay(ray, RAY_HEIGHT * 2, true, flags || undefined);
				if (hit) return RAY_HEIGHT - hit.timeOfImpact;
			} catch {
				/* physics not ready */
			}
			return null;
		};
	}, [world, rapier]);

	// Find a dry grounded spot at/near (x,z): a point whose terrain rises above
	// the water line. Searches the authored spot first, then rings outward, so
	// a vehicle authored over water relocates onto the nearest shore. Returns
	// null while no grounded sample is available yet (retry as terrain streams).
	const findDryGround = useMemo(() => {
		return (x: number, z: number, water: number): { x: number; y: number; z: number } | null => {
			const ride = vehicleRideHeight(vehicleType);
			const margin = 0.5;
			const dryAt = (px: number, pz: number) => {
				const gh = groundHeight(px, pz);
				if (gh == null) return null;
				// Seat the model bottom on the terrain (subtract its local bottom).
				if (!isFinite(water) || gh >= water + margin) return { x: px, y: gh + ride - modelBottomRef.current, z: pz };
				return undefined; // grounded but submerged
			};
			const center = dryAt(x, z);
			if (center) return center;
			const radii = [3, 6, 9, 12, 16, 20, 26];
			for (const r of radii) {
				for (let a = 0; a < 8; a++) {
					const ang = (a / 8) * Math.PI * 2;
					const hit = dryAt(x + Math.cos(ang) * r, z + Math.sin(ang) * r);
					if (hit) return hit;
				}
			}
			return null;
		};
	}, [groundHeight, vehicleType]);

	// Orient a ground vehicle to the terrain slope by sampling the terrain
	// normal from four cheap rays (front/back/left/right of the heading) — no
	// rigid-body physics needed, and the result is deterministic so it networks
	// cleanly. Fills `out` with yaw × tilt; falls back to yaw-only off-terrain.
	const computeTiltQuat = useMemo(() => {
		const L = 1.6;      // sample reach (m) around the vehicle
		const SOFT = 0.25;  // blend the normal toward up to tame steep cliffs
		return (x: number, z: number, yaw: number, out: Quaternion): void => {
			const fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw);
			const rX = Math.cos(yaw), rZ = -Math.sin(yaw);
			_qYaw.setFromAxisAngle(_UP, yaw);
			const hF = groundHeight(x + fwdX * L, z + fwdZ * L);
			const hB = groundHeight(x - fwdX * L, z - fwdZ * L);
			const hR = groundHeight(x + rX * L, z + rZ * L);
			const hL = groundHeight(x - rX * L, z - rZ * L);
			if (hF == null || hB == null || hR == null || hL == null) {
				out.copy(_qYaw);
				return;
			}
			_fwd3.set(fwdX, (hF - hB) / (2 * L), fwdZ).normalize();
			_right3.set(rX, (hR - hL) / (2 * L), rZ).normalize();
			_normal.crossVectors(_fwd3, _right3).normalize();
			if (_normal.y < 0) _normal.negate();
			_normal.lerp(_UP, SOFT).normalize();
			_tiltOnly.setFromUnitVectors(_UP, _normal);
			out.copy(_tiltOnly).multiply(_qYaw);
		};
	}, [groundHeight]);

	// Drive the dismount key (E) while this vehicle is the one we ride — as
	// driver OR passenger.
	useEffect(() => {
		if (!localRole) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.code !== 'KeyE') return;
			if (!useRideStore.getState().isRiding(rideableId)) return;
			e.preventDefault();
			e.stopPropagation();
			useRideStore.getState().dismount();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [localRole, rideableId]);

	// Local-space seat offset for seat `i`, in the auto-center frame (same as the
	// seatOffset nudge). Explicit `seats` win; otherwise seat 0 is the legacy
	// auto-center + seatOffset. DEFAULT_SEAT_LIFT raises authored seats off the
	// bbox center so a [0,0,0] seat sits like the default driver seat.
	const seatLocalOffset = (i: number): [number, number, number] => {
		const a = autoSeatRef.current || [0, 0, 0];
		if (seatsArray && seatsArray[i]) {
			const s = seatsArray[i];
			return [a[0] + (s[0] || 0), a[1] + (s[1] || 0) + DEFAULT_SEAT_LIFT, a[2] + (s[2] || 0)];
		}
		return [a[0] + seatOffset[0], a[1] + seatOffset[1], a[2] + seatOffset[2]];
	};

	// ── Driver = occupancy authority ──
	// While WE drive this vehicle we own its seat map: seat 0 is us, passengers
	// fill 1..N in arrival order. We answer board/leave requests, drop peers that
	// disconnect, and broadcast the authoritative occupancy (on change + a 1Hz
	// keyframe for late joiners). On dismount we broadcast an EMPTY occupancy,
	// which ejects every passenger (their reconcile sees no seat → they get out).
	useEffect(() => {
		if (!isLocalDriver) return;
		const bridge = getNetworkBridge();
		const me = localClientId();
		if (!me) return;
		const seats: (string | null)[] = new Array(capacity).fill(null);
		seats[0] = me;
		occupantsRef.current = seats;
		const broadcast = () => {
			setLocalOccupancy(rideableId, me, occupantsRef.current);
			bridge.sendVehicleMembership({
				kind: 'occupancy',
				vehicleId: rideableId,
				seats: occupantsRef.current.slice(),
			});
		};
		broadcast();
		const unsub = bridge.onVehicleMembership((msg) => {
			if (msg.vehicleId !== rideableId) return;
			const cur = occupantsRef.current;
			if (msg.kind === 'join') {
				if (cur.indexOf(msg.clientId) >= 0) { broadcast(); return; } // already aboard → re-confirm
				let idx = -1;
				for (let i = 1; i < capacity; i++) { if (!cur[i]) { idx = i; break; } }
				if (idx >= 0) cur[idx] = msg.clientId;
				broadcast(); // assigned, or full (requester sees no free seat and bails)
			} else if (msg.kind === 'leave') {
				const i = cur.indexOf(msg.clientId);
				if (i >= 1) { cur[i] = null; broadcast(); }
			}
		});
		const keyframe = setInterval(broadcast, 1000);
		const p2 = (typeof window !== 'undefined') ? (window as any).p2pcf : null;
		const onPeerClose = (peer: any) => {
			const i = occupantsRef.current.indexOf(peer?.client_id);
			if (i >= 1) { occupantsRef.current[i] = null; broadcast(); }
		};
		if (p2?.on) p2.on('peerclose', onPeerClose);
		return () => {
			unsub();
			clearInterval(keyframe);
			if (p2?.removeListener) p2.removeListener('peerclose', onPeerClose);
			// Driver leaving → eject everyone (empty occupancy keyframe) — but ONLY
			// if no one else has taken the wheel. On a tiebreak loss / handoff the
			// new driver is authority; wiping occupancy here would fight their
			// broadcast and could kick their passengers.
			if (!isVehicleOwnedByOther(rideableId, hashClientId16(me))) {
				setLocalOccupancy(rideableId, me, []);
				bridge.sendVehicleMembership({ kind: 'occupancy', vehicleId: rideableId, seats: [] });
			}
		};
	}, [isLocalDriver, rideableId, capacity]);

	// Passenger leaving (E, eject, or driver gone) → tell the driver to free our
	// seat. Fires on any transition OUT of passenger here; a redundant leave
	// (e.g. the driver already removed us) is a harmless no-op.
	const wasPassengerRef = useRef(false);
	useEffect(() => {
		if (wasPassengerRef.current && !isLocalPassenger) {
			getNetworkBridge().sendVehicleMembership({ kind: 'leave', vehicleId: rideableId });
			clearRideSeat(rideableId); // free the local seat we were snapped to
		}
		wasPassengerRef.current = isLocalPassenger;
	}, [isLocalPassenger, rideableId]);

	// Always dispose the physics chassis on unmount.
	useEffect(() => () => {
		if (physicsRef.current) { physicsRef.current.dispose(); physicsRef.current = null; }
	}, []);

	// Real wheel physics, stepped in lockstep with the rapier world. Runs ONLY
	// while THIS client drives a wheeled vehicle: a dynamic chassis with 4
	// raycast wheels (rear engine force + front steering). The visual sync,
	// seat, and broadcast happen in useFrame from the chassis transform.
	useBeforePhysicsStep(() => {
		// Tear down when we stop driving (or for non-wheeled types).
		if (!isLocalDriverRef.current || !usePhysics) {
			if (physicsRef.current) { physicsRef.current.dispose(); physicsRef.current = null; }
			return;
		}
		// Create lazily once the bbox is measured.
		if (!physicsRef.current) {
			const half = modelHalfRef.current;
			const auto = autoSeatRef.current;
			if (!half || !auto || !world || !rapier) return;
			const vs = vstateRef.current;
			_e.set(0, vs.yaw, 0, 'YXZ');
			_q.setFromEuler(_e);
			try {
				const spawnGroundY = groundHeight(vs.x, vs.z);
				const wheelR = wheelConnsRef.current ? wheelRadiusRef.current : Math.max(0.25, half[1] * 0.5);
				if (useBikePhysics) {
					// Two-wheel motorcycle: PhysicsBike adds the self-balance loop.
					// Named wheels xrp_wheel_01 (front) / xrp_wheel_02 (rear) place the
					// wheels exactly; otherwise it derives them on the centreline.
					physicsRef.current = new PhysicsBike(world, rapier, {
						position: [vs.x, vs.y, vs.z],
						quaternion: [_q.x, _q.y, _q.z, _q.w],
						halfExtents: half,
						centerOffset: auto,
						wheelConnections: wheelConnsRef.current || undefined,
						wheelRadius: wheelR,
						groundY: spawnGroundY != null ? spawnGroundY : undefined,
						// Rear-wheel drive pushes through ONE contact patch, so it needs
						// more engine force than the 4-wheel car to feel strong AND to
						// climb medium hills (the level-locked frame thrusts horizontally,
						// so hills cost extra force).
						engineAccel: 24 * speedScale,
						maxSpeed: 10 * speedScale,
						maxSteer: 0.6,
					});
				} else {
					physicsRef.current = new PhysicsVehicle(world, rapier, {
						position: [vs.x, vs.y, vs.z],
						quaternion: [_q.x, _q.y, _q.z, _q.w],
						halfExtents: half,
						centerOffset: auto,
						// Named wheels (xrp_wheel_01..04) place the physics wheels exactly;
						// otherwise fall back to bbox-derived placement.
						wheelConnections: wheelConnsRef.current || undefined,
						wheelRadius: wheelR,
						groundY: spawnGroundY != null ? spawnGroundY : undefined,
						// Mass-relative + capped; `speed` attr scales accel and top speed.
						// More engine force = more torque to hold speed up grades (top
						// speed is still clamped to maxSpeed, so it climbs stronger without
						// driving faster on the flat). Sharper steer + side-grip make it turn.
						engineAccel: 6.5 * speedScale,
						maxSpeed: 8 * speedScale,
						maxSteer: 0.6,
					});
				}
			} catch (e) {
				physicsRef.current = null; // fall back to kinematic
				return;
			}
		}
		const pv = physicsRef.current;
		if (!pv) return;
		const dt = 1 / 60;
		const throttle = (rideInput.forward ? 1 : 0) - (rideInput.backward ? 1 : 0);
		// Proportional analog steer (keyboard = ±1, joystick = partial). Already
		// clamped to [-1,1] in setRideInput, so the mobile stick can't drive the
		// wheel past the desktop maximum.
		const steerInput = rideInput.steerAxis;
		pv.setControls(throttle, steerInput, dt);
		// Wheel raycasts must ignore the rider's own capsule.
		const playerBody = (typeof window !== 'undefined' && (window as any).__playerRigidBody) || null;
		const excludeHandle = playerBody && typeof playerBody.handle === 'number' ? playerBody.handle : null;
		pv.update(dt, (collider: any) => {
			try {
				if (excludeHandle != null && collider?.parent && collider.parent()?.handle === excludeHandle) return false;
			} catch (e) { /* ignore */ }
			return true; // include everything else (terrain)
		});

		// Hard safety floor: the chassis collider is a sensor, so a sharp nose-dip
		// (hard stop / hard corner) has nothing solid to stop it. Clamp the body so
		// the model's bottom never passes below the terrain, and kill any remaining
		// downward velocity. The vehicle can NEVER fall through.
		try {
			const ch = pv.chassis;
			const t = ch.translation();
			const gy = groundHeight(t.x, t.z);
			if (gy != null) {
				const restY = gy + pv.restCenterAboveGround;
				// Bike floor is a NARROW band just inside the suspension travel (0.25):
				//  - It must sit BELOW restY so the suspension COMPRESSES and loads the
				//    wheels — wheel load is what creates traction. Clamping at exactly
				//    restY gives zero load and the driven wheel can't push (it drifts).
				//  - But it must NOT drop more than the suspension can reach. The bike's
				//    wheel ray is short (restLen + r); past ~one travel below rest the
				//    wheel can't touch the ground, contact is lost, and the 2-wheel bike
				//    punches through and free-falls to the clamp BELOW the terrain. (The
				//    4-wheel car survives the loose -1.0 band; the bike does not.)
				// restY - 0.2 (travel is 0.25) keeps the wheels loaded AND grounded.
				const ceil = restY + (useBikePhysics ? 0.25 : 0.6);  // tight: worst case is a small hop
				const floor = useBikePhysics ? restY - 0.15 : restY - 1.0;
				const v = ch.linvel();
				if (t.y > ceil) {
					ch.setTranslation({ x: t.x, y: ceil, z: t.z }, true);
					if (v.y > 0) ch.setLinvel({ x: v.x, y: 0, z: v.z }, true);
				} else if (t.y < floor) {
					ch.setTranslation({ x: t.x, y: floor, z: t.z }, true);
					if (v.y < 0) ch.setLinvel({ x: v.x, y: 0, z: v.z }, true);
				}
			}
		} catch (e) { /* ignore */ }
	});

	useFrame((_state, delta) => {
		const g = groupRef.current;
		if (!g) return;
		const dt = Math.min(delta, 0.05); // clamp huge frames (tab refocus)
		const vs = vstateRef.current;

		// Best-guess seat: the model's bounding-box center, expressed in the
		// group's local frame (so it's invariant to the vehicle's position/yaw).
		// Computed once the mesh has real bounds. worldToLocal divides out the
		// group transform; the primitive's scale is already baked into the box.
		if (!autoSeatRef.current) {
			g.updateWorldMatrix(true, true);
			_box.setFromObject(g);
			if (isFinite(_box.min.y) && _box.max.y > _box.min.y) {
				// Local Y of the model's lowest point (group has no scale; yaw
				// doesn't affect Y, so this is just world-min minus origin-Y).
				modelBottomRef.current = _box.min.y - g.position.y;
				modelHalfRef.current = [
					(_box.max.x - _box.min.x) / 2,
					(_box.max.y - _box.min.y) / 2,
					(_box.max.z - _box.min.z) / 2,
				];
				_box.getCenter(_center);
				g.worldToLocal(_center);
				autoSeatRef.current = [_center.x, _center.y, _center.z];
			}
		}

		// Wheel radius (any wheel count — bikes have 2) + the 4-wheel connection
		// points for the physics car, computed once.
		if (wheelNodes.length && wheelRadiusRef.current === 0 && autoSeatRef.current) {
			g.updateWorldMatrix(true, true);
			_box.setFromObject(wheelNodes[0].obj);
			wheelRadiusRef.current = Math.max(0.15, (_box.max.y - _box.min.y) / 2);
			// Connection points in wheelNodes order — 4 (car: FL,FR,RL,RR) or 2
			// (bike: front, rear). PhysicsVehicle/PhysicsBike each accept their count.
			if (!wheelConnsRef.current && (wheelNodes.length === 2 || wheelNodes.length === 4)) {
				wheelConnsRef.current = wheelNodes.map((w) => {
					w.obj.getWorldPosition(_center);
					g.worldToLocal(_center);
					return [_center.x, _center.y, _center.z] as [number, number, number];
				});
			}
		}
		const auto = autoSeatRef.current || [0, 0, 0];

		// Seat every occupant from the CURRENT vehicle transform `g`: the local
		// player's seat → rideSeat (Player snaps the body in); every peer's seat →
		// remoteRiders (their Participant attaches). Driver + passengers share this
		// one path, so passengers ride the same interpolated transform the driver
		// broadcasts — no separate lagging stream. Returns whether occupancy was
		// known (so the legacy single-seat publishes can fill the gap before the
		// first occupancy keyframe arrives).
		const publishOccupants = (): { hadOccupancy: boolean; localSeated: boolean } => {
			const occ = getOccupancy(rideableId);
			const seats = occ?.seats;
			if (!seats || seats.length === 0) return { hadOccupancy: false, localSeated: false };
			const me = localClientId();
			_camDir.set(0, 0, 1).applyQuaternion(g.quaternion); // vehicle forward
			const yaw = Math.atan2(_camDir.x, _camDir.z);
			const headingY = yaw + Math.PI; // vehicleSeatHeading semantics
			// Rider lean (motorcycles only): recover the chassis roll about its
			// forward axis from its UP vector — works on the driver and on remotes
			// (lean rides the networked rotation).
			let riderRoll = 0;
			if (vehicleType === 'bike') {
				_localUp.set(0, 1, 0).applyQuaternion(g.quaternion); // bike up, world
				const rX = Math.cos(yaw), rZ = -Math.sin(yaw);       // world right of heading
				riderRoll = Math.atan2(_localUp.x * rX + _localUp.z * rZ, _localUp.y);
			}
			let localSeated = false;
			for (let i = 0; i < seats.length; i++) {
				const occId = seats[i];
				if (!occId) continue;
				const sl = seatLocalOffset(i);
				_seatLocal.set(sl[0], sl[1], sl[2]).applyQuaternion(g.quaternion);
				const sx = g.position.x + _seatLocal.x;
				const sy = g.position.y + _seatLocal.y;
				const sz = g.position.z + _seatLocal.z;
				if (occId === me) {
					const sideAng = yaw + Math.PI / 2;
					const exX = g.position.x + Math.sin(sideAng) * 2.0;
					const exZ = g.position.z + Math.cos(sideAng) * 2.0;
					const exG = groundHeight(exX, exZ);
					const exY = (exG != null ? exG : g.position.y) + 0.1;
					setRideSeat(rideableId, sx, sy, sz, headingY, exX, exY, exZ, riderRoll);
					localSeated = true;
				} else {
					setRemoteRider(hashClientId16(occId), sx, sy, sz, headingY, performance.now(), riderRoll);
				}
			}
			return { hadOccupancy: true, localSeated };
		};

		// Spin (+ steer the fronts) the visible wheels IN PLACE. Each wheel is
		// rotated purely in its OWN local space (start from its rest orientation,
		// steer about local Y, roll about local X = the steered axle) — so its
		// position is never touched and the result is independent of the model
		// hierarchy (child of the frame, sibling at the root, whatever). The
		// physics car path does its own suspension-aware placement; kinematic +
		// remote use this. Requires the usual authoring: wheel origin at the wheel
		// centre, transforms applied.
		const spinSteerWheels = (speed: number, steerAngle: number): void => {
			if (!wheelNodes.length) return;
			g.updateWorldMatrix(true, true);
			g.getWorldQuaternion(_chassisQ);
			const wradius = Math.max(0.1, wheelRadiusRef.current || 0.3);
			const rollDelta = (speed * dt) / wradius;
			for (const w of wheelNodes) {
				// Geometric centre of the wheel in its OWN local frame (offset of the
				// volume from the node origin), measured once. If the pivot is already
				// centred this is ~0; if not, we rotate about the real centre so the
				// wheel never orbits/translates.
				if (!w.centerComputed) {
					_box.setFromObject(w.obj);
					if (isFinite(_box.min.x) && _box.max.x >= _box.min.x) {
						_box.getCenter(_wc1);
						w.obj.worldToLocal(_wc1); // → node-local centre
						w.center.copy(_wc1);
						w.centerComputed = true;
					}
				}
				const parent = w.obj.parent;
				if (parent) { parent.getWorldQuaternion(_parentQ); _parentInv.copy(_parentQ).invert(); }
				else _parentInv.identity();
				w.spinAngle += rollDelta;
				// Roll around the FRAME's axle axis (chassis X) and steer the fronts
				// around the frame's up axis (chassis Y) — same axes as the car path,
				// expressed in the wheel's parent frame so any baseline node rotation in
				// the GLB doesn't tilt the spin.
				_localAxle.set(1, 0, 0).applyQuaternion(_chassisQ).applyQuaternion(_parentInv).normalize();
				_tiltOnly.setFromAxisAngle(_localAxle, w.spinAngle);
				_q.copy(_tiltOnly).multiply(w.baseQuat);
				if (w.front && steerAngle) {
					_localUp.set(0, 1, 0).applyQuaternion(_chassisQ).applyQuaternion(_parentInv).normalize();
					_qYaw.setFromAxisAngle(_localUp, steerAngle);
					_q.premultiply(_qYaw);
				}
				w.obj.quaternion.copy(_q);
				// Offset position so the rotation pivots about the geometric centre,
				// not the (possibly off-centre) node origin — keeps the wheel exactly
				// where the GLB placed it.
				_wc1.copy(w.center).applyQuaternion(w.baseQuat); // centre offset at rest
				_wc2.copy(w.center).applyQuaternion(_q);         // centre offset after spin
				w.obj.position.copy(w.basePos).add(_wc1).sub(_wc2);
			}
		};

		// Spin every propeller around the vehicle's forward (Z) axis — the drive
		// shaft — at idle + a speed-scaled rate. Only called while occupied (the
		// engine is "on"); parked vehicles leave props still. Hierarchy-proof: the
		// forward axis is converted into each prop's parent frame, like the wheels.
		const spinPropellers = (speed: number): void => {
			if (!propellerNodes.length) return;
			g.updateWorldMatrix(true, true);
			g.getWorldQuaternion(_chassisQ);
			const spinDelta = (PROP_IDLE + Math.abs(speed) * PROP_SPIN_PER_SPEED) * dt;
			for (const p of propellerNodes) {
				const parent = p.obj.parent;
				if (parent) { parent.getWorldQuaternion(_parentQ); _parentInv.copy(_parentQ).invert(); }
				else _parentInv.identity();
				_localAxle.set(0, 0, 1).applyQuaternion(_chassisQ).applyQuaternion(_parentInv).normalize();
				p.spinAngle += spinDelta;
				_tiltOnly.setFromAxisAngle(_localAxle, p.spinAngle);
				p.obj.quaternion.copy(_tiltOnly).multiply(p.baseQuat);
			}
		};

		// Passenger whose driver vanished (a disconnect sends no clean dismount /
		// eject broadcast): once neither the vehicle transform nor the occupancy
		// is fresh, get out. At board time the vehicle was provably fresh-owned, so
		// this never fires prematurely on a healthy join.
		if (isLocalPassenger) {
			const occ = getOccupancy(rideableId);
			const netV = getNetworkedVehicle(rideableId);
			const now = performance.now();
			const netFresh = !!netV && now - netV.ts <= VEHICLE_STALE_MS;
			const occFresh = !!occ && now - occ.ts <= OCCUPANCY_STALE_MS;
			if (!netFresh && !occFresh) {
				useRideStore.getState().dismount();
			}
		}

		if (isLocalDriver) {
			// Simultaneous-claim tiebreak (no server to arbitrate): if a peer is
			// ALSO broadcasting as driver of this vehicle — both grabbed it in the
			// same instant, before either's packets propagated — the LOWER client
			// hash keeps the wheel and the higher one yields. Deterministic: both
			// sides compute the same winner. (A rival is only "fresh" here when
			// someone is actively driving right now; a vacated vehicle's packets
			// have already gone stale, which is the only reason we could claim it.)
			const myHash16 = hashClientId16(localClientId());
			const rival = getNetworkedVehicle(rideableId);
			if (rival && rival.occupied
				&& performance.now() - rival.ts <= VEHICLE_STALE_MS
				&& rival.ownerHash !== myHash16
				&& myHash16 > rival.ownerHash) {
				// We lost the tie — yield. Ride along if a passenger seat exists,
				// otherwise step off. The driver-authority effect's cleanup sees the
				// new owner and won't wipe their occupancy.
				const idx = capacity > 1 ? nextFreeSeat(rideableId, capacity) : -1;
				if (idx >= 1) {
					useRideStore.getState().mount({
						vehicleId: rideableId, vehicleType, role: 'passenger', seatIndex: idx, seatOffset,
					});
					getNetworkBridge().sendVehicleMembership({ kind: 'join', vehicleId: rideableId });
				} else {
					useRideStore.getState().dismount();
				}
				return;
			}
			// While WE drive, the remote-wheel deriver is dormant; mark it un-seeded
			// so it re-initialises cleanly if we later hand off and watch as a peer.
			remoteWheelReadyRef.current = false;

			// ── Real wheel physics path ──
			// The chassis is simulated in useBeforePhysicsStep; here we just read
			// its transform to drive the visual model, seat, wheels and broadcast.
			const pv = physicsRef.current;
			if (usePhysics && pv && pv.chassis) {
				wasDriverRef.current = true;
				const tf = pv.transform;
				g.position.set(tf.position[0], tf.position[1], tf.position[2]);
				g.quaternion.set(tf.quaternion[0], tf.quaternion[1], tf.quaternion[2], tf.quaternion[3]);
				vs.x = tf.position[0]; vs.y = tf.position[1]; vs.z = tf.position[2];
				_camDir.set(0, 0, 1).applyQuaternion(g.quaternion); // chassis forward
				vs.yaw = Math.atan2(_camDir.x, _camDir.z);

				// Seat all occupants (driver seat 0 + passengers) from the chassis
				// transform. Until the first occupancy keyframe lands, fall back to
				// the legacy single driver seat so the driver is never un-seated.
				if (!publishOccupants().localSeated) {
					_seatLocal.set(auto[0] + seatOffset[0], auto[1] + seatOffset[1], auto[2] + seatOffset[2]);
					_seatLocal.applyQuaternion(g.quaternion);
					const psx = vs.x + _seatLocal.x, psy = vs.y + _seatLocal.y, psz = vs.z + _seatLocal.z;
					const pSide = vs.yaw + Math.PI / 2;
					const pex = vs.x + Math.sin(pSide) * 2.0;
					const pez = vs.z + Math.cos(pSide) * 2.0;
					const peg = groundHeight(pex, pez);
					const pey = (peg != null ? peg : vs.y) + 0.1;
					setRideSeat(rideableId, psx, psy, psz, vehicleSeatHeading(vs), pex, pey, pez);
				}

				// Wheel visuals. POSITION each wheel at the real physics wheel center
				// (connection − suspensionLength), so it rides the suspension and
				// never sinks into the ground. ROLL is integrated from vehicle speed
				// (always rolls when moving); steer the fronts. Axle/up come from the
				// CHASSIS axes converted into each wheel's parent frame — hierarchy-
				// proof. We refresh the chassis matrices first so the conversions use
				// this frame's transform, not last frame's.
				if (wheelNodes.length) {
					g.updateWorldMatrix(true, true);
					g.getWorldQuaternion(_chassisQ);
					const wradius = Math.max(0.1, wheelRadiusRef.current || 0.3);
					// Visual wheel roll. The body drives forward (DRIVE_SIGN matches the
					// car); this is ONLY the cosmetic spin. The bike example's wheel mesh
					// is modeled so a forward roll reads backward, so negate it for bikes.
					// This does NOT affect movement — flip BIKE_WHEEL_SPIN_SIGN, not the
					// drive sign, if the wheel ever appears to spin the wrong way.
					const BIKE_WHEEL_SPIN_SIGN = -1;
					const rollDelta = (pv.speed * dt) / wradius * (useBikePhysics ? BIKE_WHEEL_SPIN_SIGN : 1);
					for (const w of wheelNodes) {
						const wd = pv.wheel(w.index);
						const parent = w.obj.parent;
						// Position: physics wheel center (chassis-local) → world → parent-local.
						if (wd.connection && parent) {
							_wheelCenter.set(wd.connection.x, wd.connection.y - (wd.suspension || pv.restLength), wd.connection.z);
							g.localToWorld(_wheelCenter);
							parent.worldToLocal(_wheelCenter);
							w.obj.position.copy(_wheelCenter);
						}
						// Rotation: spin around chassis axle + steer fronts around chassis up.
						w.spinAngle += rollDelta;
						if (parent) { parent.getWorldQuaternion(_parentQ); _parentInv.copy(_parentQ).invert(); }
						else _parentInv.identity();
						_localAxle.set(1, 0, 0).applyQuaternion(_chassisQ).applyQuaternion(_parentInv).normalize();
						_tiltOnly.setFromAxisAngle(_localAxle, w.spinAngle);
						_q.copy(_tiltOnly).multiply(w.baseQuat);
						if (w.front && wd.steering) {
							_localUp.set(0, 1, 0).applyQuaternion(_chassisQ).applyQuaternion(_parentInv).normalize();
							_qYaw.setFromAxisAngle(_localUp, wd.steering);
							_q.premultiply(_qYaw);
						}
						w.obj.quaternion.copy(_q);
					}
				}

				spinPropellers(pv.speed);

				const pnow = performance.now();
				if (pnow - lastBroadcastRef.current >= BROADCAST_INTERVAL_MS) {
					lastBroadcastRef.current = pnow;
					// Front-wheel steer angle (radians) so remotes render the wheels
					// turned exactly as the driver sees them.
					const frontWheel = wheelNodes.length ? pv.wheel(0) : null;
					getNetworkBridge().sendVehicleState({
						vehicleId: hashVehicleId(rideableId),
						vehicleType: typeInt,
						occupied: true,
						position: [vs.x, vs.y, vs.z],
						rotation: [g.quaternion.x, g.quaternion.y, g.quaternion.z, g.quaternion.w],
						steer: frontWheel && typeof frontWheel.steering === 'number' ? frontWheel.steering : 0,
					});
				}
				return;
			}

			// ── Kinematic fallback (non-wheeled types, or physics not ready) ──
			// Becoming the driver this frame → seed state from the mesh so it
			// doesn't snap.
			if (!wasDriverRef.current) {
				vs.x = g.position.x;
				vs.y = g.position.y;
				vs.z = g.position.z;
				vs.yaw = g.rotation.y;
				vs.speed = 0;
				wasDriverRef.current = true;
			}

			// Input comes from rideInput (Player merges keyboard + mobile joystick).
			// Flying steers along the third-person camera look direction.
			let lookDir: [number, number, number] | undefined;
			if (vehicleType === 'flying') {
				camera.getWorldDirection(_camDir);
				lookDir = [_camDir.x, _camDir.y, _camDir.z];
			}
			stepVehicle(
				vs,
				{
					forward: rideInput.forward,
					backward: rideInput.backward,
					left: rideInput.left,
					right: rideInput.right,
					up: rideInput.up,
					down: rideInput.down,
					steer: rideInput.steerAxis, // analog → proportional turn (matches the car)
				},
				dt,
				{
					type: vehicleType, groundHeight, curve, curveLength, speedScale,
					lookDir, waterLevel: getNpcWaterLevel(), bottomOffset: modelBottomRef.current,
				}
			);

			g.position.set(vs.x, vs.y, vs.z);

			// Bike feel: a speed-scaled lean (rolled into the model + rider) and a
			// slight FRONT-wheel steer. Both scale with speed, so a parked bike sits
			// upright with straight wheels. (Signs are visual feel — flip if the bike
			// leans/steers the wrong way; the rider auto-follows the bike's lean.)
			let bikeFrontSteer = 0;
			if (vehicleType === 'bike') {
				const speedFac = Math.min(1, Math.abs(vs.speed) / BIKE_LEAN_FULL_SPEED);
				const steerAxis = rideInput.steerAxis; // −1 left .. +1 right
				const leanTarget = steerAxis * BIKE_MAX_LEAN * speedFac; // lean INTO the turn
				leanAngleRef.current += (leanTarget - leanAngleRef.current) * Math.min(1, dt * 5);
				// Front wheel turns into the visible turn (more at low speed). Opposite
				// sign to the lean here — matches what reads right on the handlebar.
				bikeFrontSteer = -steerAxis * BIKE_FRONT_STEER * (1 - speedFac * 0.6);
			} else {
				leanAngleRef.current = 0;
			}

			// Ground vehicles tilt to the terrain slope (smoothed); a bike adds its
			// lean rolled about the heading. Everything else stays level and just yaws.
			if (isGroundDriveType(vehicleType)) {
				computeTiltQuat(vs.x, vs.z, vs.yaw, _tiltQuat);
				if (vehicleType === 'bike' && Math.abs(leanAngleRef.current) > 1e-4) {
					_fwd3.set(Math.sin(vs.yaw), 0, Math.cos(vs.yaw)); // heading forward axis
					_leanQuat.setFromAxisAngle(_fwd3, leanAngleRef.current);
					_tiltQuat.premultiply(_leanQuat); // lean in world space, on top of tilt+yaw
				}
				g.quaternion.slerp(_tiltQuat, Math.min(1, dt * 8));
			} else {
				_e.set(0, vs.yaw, 0, 'YXZ');
				g.quaternion.setFromEuler(_e);
			}

			// Bikes animate their two wheels here (cars use the physics path).
			if (vehicleType === 'bike') {
				spinSteerWheels(vs.speed, bikeFrontSteer);
			}
			// Propellers (boats/planes) spin with speed while occupied.
			spinPropellers(vs.speed);

			// Seat all occupants (driver seat 0 + passengers) from the vehicle's
			// full orientation, so each avatar sits centered in its seat and tracks
			// the tilted deck. (Avatars stay upright; Player applies the seat as the
			// capsule center directly.) Legacy single-seat fallback before the first
			// occupancy keyframe lands.
			if (!publishOccupants().localSeated) {
				_seatLocal.set(auto[0] + seatOffset[0], auto[1] + seatOffset[1], auto[2] + seatOffset[2]);
				_seatLocal.applyQuaternion(g.quaternion);
				const seatX = vs.x + _seatLocal.x;
				const seatY = vs.y + _seatLocal.y;
				const seatZ = vs.z + _seatLocal.z;
				const sideAng = vs.yaw + Math.PI / 2;
				const exX = vs.x + Math.sin(sideAng) * 2.0;
				const exZ = vs.z + Math.cos(sideAng) * 2.0;
				const exG = groundHeight(exX, exZ);
				const exY = (exG != null ? exG : vs.y) + 0.1;
				setRideSeat(rideableId, seatX, seatY, seatZ, vehicleSeatHeading(vs), exX, exY, exZ);
			}

			// Broadcast at ~20Hz; tiered per peer downstream.
			const now = performance.now();
			if (now - lastBroadcastRef.current >= BROADCAST_INTERVAL_MS) {
				lastBroadcastRef.current = now;
				// Broadcast the FULL orientation (incl. terrain tilt) so peers see
				// the same lean. Remote instances slerp to it.
				getNetworkBridge().sendVehicleState({
					vehicleId: hashVehicleId(rideableId),
					vehicleType: typeInt,
					occupied: true,
					position: [vs.x, vs.y, vs.z],
					rotation: [g.quaternion.x, g.quaternion.y, g.quaternion.z, g.quaternion.w],
					// Bikes send their front-wheel steer; other kinematic types (flying/
					// boat/rails) have no steered wheels. Lean rides the rotation above.
					steer: bikeFrontSteer,
				});
			}
			return;
		}

		// Was driver last frame, now released → announce vacancy once + free seat.
		if (wasDriverRef.current) {
			wasDriverRef.current = false;
			clearRideSeat(rideableId);
			_e.set(0, vs.yaw, 0, 'YXZ');
			_q.setFromEuler(_e);
			getNetworkBridge().sendVehicleState({
				vehicleId: hashVehicleId(rideableId),
				vehicleType: typeInt,
				occupied: false,
				position: [vs.x, vs.y, vs.z],
				rotation: [_q.x, _q.y, _q.z, _q.w],
				steer: 0,
			});
		}

		// REMOTE: a peer is driving → lerp toward the networked transform.
		const net = getNetworkedVehicle(rideableId);
		if (net && performance.now() - net.ts <= VEHICLE_STALE_MS) {
			const k = Math.min(1, dt * 10);
			g.position.x += (net.position[0] - g.position.x) * k;
			g.position.y += (net.position[1] - g.position.y) * k;
			g.position.z += (net.position[2] - g.position.z) * k;
			_q.set(net.rotation[0], net.rotation[1], net.rotation[2], net.rotation[3]);
			g.quaternion.slerp(_q, k);
			// Keep local state aligned so a later local mount starts smoothly.
			vs.x = g.position.x; vs.y = g.position.y; vs.z = g.position.z;

			// Animate wheels + propellers for everyone watching this driven vehicle.
			// The driver runs the physics; remotes reconstruct it from the synced
			// chassis: roll/spin follow the actual motion (exact), front-wheel steer
			// comes straight off the wire (the driver sends its exact angle).
			if (wheelNodes.length || propellerNodes.length) {
				if (!remoteWheelReadyRef.current) {
					// First frame in REMOTE: seed history so we don't spin from a stale
					// (or origin) previous position.
					remotePrevPosRef.current.copy(g.position);
					remoteWheelReadyRef.current = true;
				} else {
					_camDir.set(0, 0, 1).applyQuaternion(g.quaternion); // chassis forward
					const fdx = g.position.x - remotePrevPosRef.current.x;
					const fdz = g.position.z - remotePrevPosRef.current.z;
					remotePrevPosRef.current.copy(g.position);
					const along = fdx * _camDir.x + fdz * _camDir.z; // signed forward dist
					let instSpeed = dt > 0 ? along / dt : 0;
					instSpeed = instSpeed < -30 ? -30 : instSpeed > 30 ? 30 : instSpeed;
					remoteSpeedRef.current += (instSpeed - remoteSpeedRef.current) * Math.min(1, dt * 8);

					if (wheelNodes.length) {
						// Exact networked steer — smooth toward it so packet steps don't
						// snap the wheels. Spin (derived) + steer (wire) via the shared
						// helper, same wheels the driver path animates.
						remoteSteerRef.current += ((net.steer || 0) - remoteSteerRef.current) * Math.min(1, dt * 10);
						spinSteerWheels(remoteSpeedRef.current, remoteSteerRef.current);
					}
					if (propellerNodes.length) {
						spinPropellers(remoteSpeedRef.current);
					}
				}
			}

			// Seat every occupant from this interpolated transform: our own seat (if
			// we're a passenger here) snaps the local body in via rideSeat; peers
			// attach via remoteRiders. Both ride the SAME smoothed vehicle, so no
			// occupant lags behind it. Before the first occupancy keyframe arrives,
			// fall back to seating just the driver by the vehicle packet's owner
			// hash (covers the ~1s sync gap, and single-seat vehicles mid-handoff).
			const { hadOccupancy, localSeated } = publishOccupants();
			if (!hadOccupancy) {
				if (net.occupied && autoSeatRef.current) {
					const sl = seatLocalOffset(0);
					_seatLocal.set(sl[0], sl[1], sl[2]).applyQuaternion(g.quaternion);
					_camDir.set(0, 0, 1).applyQuaternion(g.quaternion); // vehicle forward
					const yaw = Math.atan2(_camDir.x, _camDir.z);
					setRemoteRider(
						net.ownerHash,
						g.position.x + _seatLocal.x,
						g.position.y + _seatLocal.y,
						g.position.z + _seatLocal.z,
						yaw + Math.PI, // vehicleSeatHeading semantics
						performance.now(),
					);
				} else if (!net.occupied) {
					clearRemoteRider(net.ownerHash);
				}
			}
			// Boarding as a passenger: until the driver's authoritative occupancy
			// confirms our seat, seat ourselves at the optimistic guess so boarding
			// feels instant (reconciles to the real seat when occupancy lands).
			if (isLocalPassenger && !localSeated && autoSeatRef.current) {
				const sl = seatLocalOffset(localSeatIndex >= 1 ? localSeatIndex : 1);
				_seatLocal.set(sl[0], sl[1], sl[2]).applyQuaternion(g.quaternion);
				_camDir.set(0, 0, 1).applyQuaternion(g.quaternion);
				const yaw = Math.atan2(_camDir.x, _camDir.z);
				const sideAng = yaw + Math.PI / 2;
				const exX = g.position.x + Math.sin(sideAng) * 2.0;
				const exZ = g.position.z + Math.cos(sideAng) * 2.0;
				const exG = groundHeight(exX, exZ);
				const exY = (exG != null ? exG : g.position.y) + 0.1;
				setRideSeat(
					rideableId,
					g.position.x + _seatLocal.x,
					g.position.y + _seatLocal.y,
					g.position.z + _seatLocal.z,
					yaw + Math.PI,
					exX, exY, exZ,
				);
			}
			return;
		}

		// IDLE: settle the vehicle into the world once the terrain collider has
		// streamed in near the spawn (instead of hanging at the authored Y).
		if (!groundedRef.current && autoSeatRef.current) {
			const water = getNpcWaterLevel();
			const bottom = modelBottomRef.current;
			const gh = groundHeight(vs.x, vs.z);
			// The lowest the model's bottom may sit above the terrain — used as a
			// hard floor so NO vehicle ever spawns buried below the ground.
			const terrainFloorY = gh != null ? gh + 0.3 - bottom : null;

			if (isWaterType(vehicleType)) {
				// Boats rest on the water surface; if the spawn is over land that
				// rises above the water, sit on the terrain (beached) instead.
				if (isFinite(water)) {
					const y = (gh != null && gh > water)
						? gh + 0.05 - bottom
						: water + vehicleRideHeight(vehicleType) - bottom;
					g.position.y = y; vs.y = y;
					groundedRef.current = true;
				} else if (gh != null) {
					g.position.y = gh + 0.05 - bottom; vs.y = g.position.y;
					groundedRef.current = true;
				}
			} else if (isGroundOrHoverType(vehicleType)) {
				// Ground vehicles settle on terrain, AND must not sit in water —
				// if the spawn is submerged, search outward for a dry spot.
				const spot = findDryGround(vs.x, vs.z, water);
				if (spot) {
					g.position.x = spot.x; g.position.z = spot.z; g.position.y = spot.y;
					vs.x = spot.x; vs.z = spot.z; vs.y = spot.y;
					// Parked ground vehicles also rest tilted to the slope.
					if (isGroundDriveType(vehicleType)) {
						computeTiltQuat(spot.x, spot.z, vs.yaw, _tiltQuat);
						g.quaternion.copy(_tiltQuat);
					}
					groundedRef.current = true;
				} else if (terrainFloorY != null) {
					// No dry spot nearby — at least never sit below the terrain.
					if (vs.y < terrainFloorY) { g.position.y = terrainFloorY; vs.y = terrainFloorY; }
					groundedRef.current = true;
				}
			} else if (terrainFloorY != null) {
				// Flying / rails: keep the authored height, but never below terrain.
				if (vs.y < terrainFloorY) { g.position.y = terrainFloorY; vs.y = terrainFloorY; }
				groundedRef.current = true;
			}
		}
	// renderPriority -1: integrate the vehicle + publish its seat BEFORE Player's
	// default-priority useFrame reads it. Otherwise Player snaps the rider to LAST
	// frame's seat, so an accelerating vehicle pulls ahead and the rider trails it.
	}, -1);

	if (!vehicleScene) return null;

	const handleInteractionStart = () => {
		const clientId = localClientId();
		const localHash = clientId ? hashClientId16(clientId) : -1;
		if (clientId && isVehicleOwnedByOther(rideableId, localHash)) {
			// Someone else is driving → ride along as a passenger in the next free
			// seat. Optimistically sit at our best guess; the driver's authoritative
			// occupancy reconciles us to the real seat (or ejects us if full).
			if (capacity <= 1) return; // no passenger seats authored
			const idx = nextFreeSeat(rideableId, capacity);
			if (idx < 0) return; // full
			useRideStore.getState().mount({
				vehicleId: rideableId, vehicleType, role: 'passenger', seatIndex: idx, seatOffset,
			});
			getNetworkBridge().sendVehicleMembership({ kind: 'join', vehicleId: rideableId });
		} else {
			// Empty → become the driver (host, seat 0).
			useRideStore.getState().mount({
				vehicleId: rideableId, vehicleType, role: 'driver', seatIndex: 0, seatOffset,
			});
		}
	};

	return (
		<>
			<group
				ref={groupRef}
				name={`rideable-${rideableId}`}
				position={[model.positionX || 0, model.positionY || 0, model.positionZ || 0]}
				rotation={[0, (model.rotationY || 0) * MathUtils.DEG2RAD, 0]}
				userData={{
					// NOTE: deliberately NOT `interactable` — that flag drives the
					// world-cursor context menu. Rideables are detected by
					// `rideableId` instead, and E is reserved for mount/dismount.
					camExcludeCollision: true,
					rideableId,
					rideableName: model.name || 'Vehicle',
				}}
			>
				<primitive
					object={vehicleScene}
					scale={[model.scaleX || 1, model.scaleY || 1, model.scaleZ || 1]}
				/>
			</group>
			<RideableInteractionBanner
				rideableId={rideableId}
				rideableName={model.name || 'Vehicle'}
				groupRef={groupRef}
				capacity={capacity}
				visible={!localRole}
				onInteractionStart={handleInteractionStart}
			/>
		</>
	);
}
