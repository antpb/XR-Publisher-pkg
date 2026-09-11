import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { SpriteAnimator } from "@react-three/drei";
import { CanvasTextMesh } from "./CanvasTextMesh";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { createVRMLoaderPlugin } from "../../../utils/vrmLoader";
import { VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";

import type {
	ParticipantsProps,
	ParticipantProps
  } from '../../../types/three-components';
  
  
import defaultVRM from "../../../defaults/avatars/xr_publisher_default_avatar.vrm";
import blankVRM from "../../../defaults/avatars/blank_avatar.vrm";
// defaultFont (roboto.woff) was used by the old drei <Text>/troika pipeline
// for nameplates. That path is gone — MSDFTextMesh loads its own MSDF atlas
// from testassets.xpp.world. If nothing else imports this file, it can be
// deleted in a follow-up cleanup.
import idle from "../../../defaults/avatars/friendly.fbx";
import walk from "../../../defaults/avatars/walking.fbx";
import run from "../../../defaults/avatars/running.fbx";
import jump from "../../../defaults/avatars/Jump.fbx";
import swimIdle from "../../../defaults/avatars/swim_idle.fbx";
import swim from "../../../defaults/avatars/swim.fbx";
// import the mixamo rig utility
import { getRetargetedClip } from "../../../networking/mixamoClipCache";
import { hashClientId16 } from "../../../stores/vehicleStateStore";
import { getRemoteRider, REMOTE_RIDER_STALE_MS } from "../../../networking/remoteRiders";
import { createNaturalIdleState, setupNaturalIdleSystem, updateNaturalIdleAnimation, followBreathingWeight, type NaturalIdleState } from "../../../utils/naturalIdle";
import useParticipantsStore from './utils/participantsStore';
import { getNetworkBridge } from "../../../networking/NetworkBridge";
import {
  applyRemoteFingerPose,
  applyRemoteWristPose,
  applyRemoteArmBones,
  LEFT_FINGER_BONES,
  RIGHT_FINGER_BONES,
} from "../../../utils/vrmHandPose";


/** Session-wide .vrm byte cache + serialized parse queue (see VRM-load
 *  effect in Participant). */
const _vrmBytesCache = new Map<string, Promise<ArrayBuffer>>();
let _vrmParseChain: Promise<void> = Promise.resolve();

/**
 * Shared PFP plane geometry. Every participant's profile picture card is the
 * same 0.1 × 0.1 plane; the old `<planeGeometry args={...}/>` in JSX allocated
 * a fresh BufferGeometry on every render.
 */
const _pfpPlaneGeometry = new THREE.PlaneGeometry(0.1, 0.1);

/**
 * Vertical drop from the seat BODY-CENTER (what `remoteRiders` publishes, same
 * as `rideSeat.py`) to the avatar ROOT (feet) where a Participant is positioned.
 * Matches `Player.jsx` RIDE_SEAT_CAPSULE_OFFSET so a remote driver sits at the
 * exact height the local driver broadcasts for themselves.
 */
const RIDE_SEAT_FEET_DROP = 0.85;

/** Ry(π) — multiplied into the seated-rider orientation to cancel the avatar
 *  primitive's fixed `rotation={[0, π, 0]}`, so heading/roll come out exact. */
const _RIDE_PI_Y = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

// NOTE: A previous attempt shared a single `MeshBasicMaterial` across every
// Participant's `<Text>` nameplate via `material={_textBaseMaterial}`. That
// pattern is incompatible with troika-three-text: Troika wraps the base
// material into a derived SDF material, and sharing the base across multiple
// Text instances caused the per-instance derived materials to end up with
// shared/polluted state. Under WebGPU this surfaced as
//   "Failed to execute 'drawIndexed' ... Value is infinite"
// during the _renderTransparents pass as soon as a second peer joined and
// instantiated a second Text. Letting Troika build its own default material
// per instance fixes it and costs one extra material per Participant —
// negligible next to the VRM + mixer cost of adding a peer.

// (Per-peer Mixamo retargeting moved to networking/mixamoClipCache.ts —
// fetched once per session, retargeted once per (animation, avatar) pair.)


/**
 * Represents a participant in a virtual reality scene.
 *
 * @param {Object} participant - The props for the participant.
 *
 * @return {JSX.Element} The participant.
 */
function Participant(participant: ParticipantProps): React.JSX.Element {
	const fallbackURL = defaultVRM;
	let playerURL = participant.playerVRM ? participant.playerVRM : fallbackURL;
	const animationMixerRef = useRef<Record<string, THREE.AnimationMixer>>({});
	const animationsRef = useRef<Record<string, THREE.AnimationClip[]>>({});
	const vrmsRef = participant.vrmsRef;
	const mixers = participant.mixers;
	const [someVRM, setSomeVRM] = useState(null);
	const [frameName] = useState('BackwardIdle');
	const theScene = useThree();
	const { gl } = theScene;
	// Display name is driven by React state (not a ref) so that updates from
	// the network layer (onPeerState) trigger a re-render of the MSDFTextMesh.
	// The previous drei <Text> API exposed .text mutation via ref — MSDFText's
	// SDF atlas layout is rebuilt on prop change, so state is the correct
	// model here.
	const [displayName, setDisplayName] = useState<string>(() =>
		participant.inWorldName ? participant.inWorldName : participant.playerName
	);
	// Sync prop → state when the participant's profile arrives via the
	// participants store (profile announce path, not peer-state path).
	useEffect(() => {
		const next = participant.inWorldName || participant.playerName;
		setDisplayName((prev) => (prev === next ? prev : next));
	}, [participant.inWorldName, participant.playerName]);
	const participantDataRef = useRef<any>(null);
	const participantObject = useRef(null);
	// Natural idle (pose scrubbing + breathing layer) — one state per peer.
	const naturalIdleRef = useRef<Record<string, NaturalIdleState>>({});
	const interpolationDuration = 300;
	const [profileImage, setProfileImage] = useState(null);
	const lastJumpTimes = useRef<Record<string, number>>({});
	const cachedHeight = useRef(1.8);
	const currentActionRef = useRef<string>('idle');
	// Queue of actions received between frames — priority actions (jump) won't be lost
	const pendingActionsRef = useRef<string[]>([]);
	// Swim/fly blend state (0 = land, 1 = fully swim/fly)
	const swimTransitionRef = useRef(0);
	const flyTransitionRef = useRef(0);
	const remoteIsSwimming = useRef(false);
	const remoteIsFlying = useRef(false);
	const remoteIsBoosting = useRef(false);
	const remoteSwimBlend = useRef(0);
	const remoteFlyPoseTime = useRef(0.5);
	// Local interpolation of swim blend to avoid stale values from infrequent broadcasts
	const swimMoveBlendLocal = useRef(0);
	// Riding (seated-in-vehicle) blend: 0 = normal locomotion, 1 = fully seated
	// driving pose. The peer's 16-bit client hash links them to the vehicle they
	// drive (the vehicle packet's ownerHash) so we can read their live seat.
	const ridingBlendLocal = useRef(0);
	const driverHash = useMemo(() => hashClientId16(participant.playerName), [participant.playerName]);
	useRef(new THREE.Vector3());
	useRef(new THREE.Euler());
	useRef(new THREE.Quaternion());
	useRef(1.8);

	// Pre-allocated temporaries to avoid GC pressure in useFrame
	const _tmpTargetPos = useRef(new THREE.Vector3());
	const _tmpTargetQuat = useRef(new THREE.Quaternion());
	const _tmpEuler = useRef(new THREE.Euler());

	// VR hand/arm pose data received from network (set by NetworkBridge listener)
	const handPoseRef = useRef<{
		leftHand?: { wristQuat: [number,number,number,number]; fingerJoints: [number,number,number,number][] };
		rightHand?: { wristQuat: [number,number,number,number]; fingerJoints: [number,number,number,number][] };
		headQuat?: [number,number,number,number];
		leftUpperArmQuat?: [number,number,number,number];
		leftLowerArmQuat?: [number,number,number,number];
		rightUpperArmQuat?: [number,number,number,number];
		rightLowerArmQuat?: [number,number,number,number];
	} | null>(null);
	// Avatar LOD: frame counter (offset per instance so peers' update ticks
	// spread across frames instead of aligning) + accumulated delta for the
	// skipped frames.
	const lodFrameRef = useRef(Math.floor(Math.random() * 16));
	const lodAccumDeltaRef = useRef(0);
	const hasRemoteHandPose = useRef(false);
	// Timestamp of the last packet that actually carried hand/head fields.
	// Belt-and-braces stale-pose clear for senders that predate the explicit
	// vrFlags presence bit (they just stop sending hands when leaving VR).
	const lastHandPoseTimeRef = useRef(0);

	useEffect(() => {
		// Depend on the profile-image URL (it often arrives AFTER mount via a
		// late binary profile announce — `[]` deps meant the pfp never loaded
		// for late joiners), and dispose the GPU texture on change/unmount
		// (it used to leak per peer cycle).
		if (!participant.profileImage) return;
		let loaded: THREE.Texture | null = null;
		let cancelled = false;
		const textureLoader = new THREE.TextureLoader();
		textureLoader.crossOrigin = '';
		textureLoader.load(participant.profileImage, (texture) => {
			if (cancelled) { texture.dispose(); return; }
			loaded = texture;
			setProfileImage(texture);
		});
		return () => {
			cancelled = true;
			if (loaded) loaded.dispose();
		};
	}, [participant.profileImage]);

	// Load the VRM model.
	//
	// Each Participant creates its OWN GLTFLoader and parses the VRM fresh,
	// which yields an independent scene graph + skeleton + humanoid + spring
	// bones per instance. Bone writes on one Participant therefore cannot
	// leak into another.
	//
	// Invariants to preserve:
	// - Do NOT hoist `gltf` / `gltf.userData.vrm` into a module-level ref.
	// - Do NOT enable `THREE.Cache.enabled = true` alongside a shared
	//   GLTFLoader — FileLoader would then cache parsed objects in addition
	//   to the raw ArrayBuffer on some forks of three.
	// - Do NOT replace `loader.load(url, cb)` with a shared cached GLTF
	//   without first running it through a proper VRM clone (three-vrm
	//   3.x has no deepCloneVRM helper — a naive SkeletonUtils.clone of
	//   the scene does not rebuild the VRM controller bindings).
	useEffect(() => {
		let aborted = false;
		const loader = new GLTFLoader();
		const ktx2Loader = new KTX2Loader();
		ktx2Loader.setTranscoderPath(threeObjectPluginRoot + "/inc/utils/basis/");
		ktx2Loader.detectSupport(gl);
		loader.setKTX2Loader(ktx2Loader);
		const isWebGL = gl && (gl as any).isWebGLRenderer === true;
		loader.register(parser => createVRMLoaderPlugin(parser, isWebGL));
		// if player url is an array with an empty string, set the playerURL to the default avatar
		if (Array.isArray(playerURL) && playerURL[0] === "") {
			playerURL = fallbackURL;
		}
		// Ensure playerURL is a string before checking endsWith
		if (typeof playerURL === 'string' && playerURL.endsWith('.png')) {
			playerURL = blankVRM;
		}

		// The .vrm BYTES are fetched once per URL (peers sharing an avatar
		// share the download), but each Participant still gets its own
		// `loader.parse` — three-vrm 3.x has no safe deep clone for
		// spring-boned VRMs (see invariants above). Parses are serialized
		// through a global chain so a burst of simultaneous joins doesn't
		// stack N GLTF parses in one frame.
		const url = playerURL as string;
		let bytesPromise = _vrmBytesCache.get(url);
		if (!bytesPromise) {
			bytesPromise = fetch(url).then((r) => {
				if (!r.ok) throw new Error(`VRM fetch ${url} → ${r.status}`);
				return r.arrayBuffer();
			});
			bytesPromise.catch(() => _vrmBytesCache.delete(url));
			_vrmBytesCache.set(url, bytesPromise);
		}
		_vrmParseChain = _vrmParseChain.then(() =>
			bytesPromise!.then(
				(bytes) => new Promise<void>((done) => {
					if (aborted) { done(); return; }
					loader.parse(
						bytes.slice(0), '',
						(gltf: any) => { if (!aborted) setSomeVRM(gltf); done(); },
						(err: any) => {
							console.warn('[Participant] VRM parse failed', err);
							done();
						},
					);
				}),
				() => { /* fetch failed — logged via cache eviction */ },
			),
		);

		return () => { aborted = true; };
	}, [playerURL, gl]);

	useEffect(() => {
		if (someVRM?.userData?.vrm) {
			const playerController = someVRM.userData.vrm;
			vrmsRef.current[participant.playerName] = playerController;
			playerController.scene.scale.set(1, 1, 1);

			// Disable frustum culling on every mesh in the VRM scene.
			//
			// Why: when a remote Participant's VRM is added to a WebGPU scene
			// that is already actively rendering (desktop joined first, mobile
			// peer joins later), three.js lazily computes the SkinnedMesh
			// bounding sphere on the first frame this mesh is rendered. If the
			// humanoid + springbone state hasn't been ticked yet, the skinned
			// vertex positions can compute to NaN/Infinity, the bounding
			// sphere becomes infinite, and WebGPU receives `Infinity` as the
			// drawIndexed count. The renderer throws:
			//   "Failed to execute 'drawIndexed' ... Value is infinite"
			// and the whole WebGPU session is poisoned.
			//
			// Mobile-first / desktop-second worked because the first WebGPU
			// frame already contained both VRMs, so bounds were computed in a
			// stable order.
			//
			// Skinned-mesh static bounds are unreliable anyway (deformed
			// vertices routinely exceed the T-pose AABB). Disabling frustum
			// culling on the VRM is the standard VRM+WebGPU fix and costs
			// almost nothing — a few extra per-frame draw submissions for
			// avatars that are off-screen.
			playerController.scene.traverse((node: THREE.Object3D) => {
				(node as any).frustumCulled = false;
			});

			// Animation files: [0]=idle, [1]=walk, [2]=run, [3]=jump, [4]=swimIdle, [5]=swim
			// Cached: each file is fetched once per session and retargeted once
			// per (animation, avatar URL) pair — peers sharing an avatar share
			// the clip objects (mixers bind per-root by track name). The old
			// per-peer loadMixamoAnimation path fetched + parsed 6 FBX scenes
			// per join and leaked them.
			const animationFiles = [idle, walk, run, jump, swimIdle, swim];
			const vrmCacheKey = typeof playerURL === 'string' && playerURL ? playerURL : 'default';
			const animationsPromises = animationFiles.map(file =>
				getRetargetedClip(file, playerController, vrmCacheKey));

			// Each Participant loads its own GLTF, so the scene is already unique — no clone needed
			// Create mixer directly on playerController.scene
			const newMixer = new THREE.AnimationMixer(playerController.scene);
			animationMixerRef.current[participant.playerName] = newMixer;
			mixers.current[participant.playerName] = animationMixerRef.current[participant.playerName];
			participant.profileUserData.current[participant.playerName] = { inWorldName: participant.playerName, pfp: participant.pfp };

			Promise.all(animationsPromises).then(animations => {
				animationsRef.current[participant.playerName] = animations;
				const mixer = animationMixerRef.current[participant.playerName];

				const idleAction = mixer.clipAction(animations[0]);
				const walkAction = mixer.clipAction(animations[1]);
				const runAction = mixer.clipAction(animations[2]);
				const jumpAction = mixer.clipAction(animations[3]);
				const swimIdleAction = animations[4] ? mixer.clipAction(animations[4]) : null;
				const swimAction = animations[5] ? mixer.clipAction(animations[5]) : null;

				walkAction.setEffectiveWeight(0);
				runAction.setEffectiveWeight(0);
				jumpAction.setEffectiveWeight(0);
				idleAction.setEffectiveWeight(1);
				idleAction.play();

				// Natural idle (same system as the local Player): the idle
				// action becomes the FROZEN pose layer (timeScale 0, time
				// scrubbed in useFrame) and a low-weight breathing layer loops
				// beside it. The state machine keeps driving idleAction's
				// weight exactly as before; the breathing layer follows it.
				const ni = createNaturalIdleState();
				setupNaturalIdleSystem(ni, animations[0], idleAction, mixer);
				naturalIdleRef.current[participant.playerName] = ni;

				if (swimIdleAction) { swimIdleAction.setEffectiveWeight(0); swimIdleAction.play(); }
				if (swimAction) { swimAction.setEffectiveWeight(0); swimAction.play(); }

				// Seated driving pose (animations[6]) — loaded AFTER the 6 core
				// clips so its retarget failure can't reject the core batch (a
				// missing/404 drivingpose.glb then only loses the seated pose, never
				// locomotion) and `animationsRef` is guaranteed populated here.
				// VRM-space GLB held as a static frame (timeScale 0); weight is
				// driven by the riding blend in useFrame, same as Player.jsx's local
				// seated overlay. `threeObjectPluginRoot` is the runtime asset root
				// (mirrors Player's assetBasePath fallback), read here (not at module
				// load) so it's resolved after init.
				const drivingPoseUrl = `${threeObjectPluginRoot || '/assets'}avatars/drivingpose.glb`;
				getRetargetedClip(drivingPoseUrl, playerController, vrmCacheKey)
					.then((clip) => {
						const m = animationMixerRef.current[participant.playerName];
						const anims = animationsRef.current[participant.playerName];
						if (!m || !anims) return; // torn down before the pose arrived
						anims[6] = clip;
						const drivingAction = m.clipAction(clip);
						drivingAction.setLoop(THREE.LoopRepeat, Infinity);
						drivingAction.timeScale = 0;
						drivingAction.time = 0;
						drivingAction.clampWhenFinished = true;
						drivingAction.setEffectiveWeight(0);
						drivingAction.play();
					})
					.catch((err) => {
						console.warn('[Participant] driving pose load failed', err);
					});
			});
		}

		// Full per-peer teardown — GPU memory (VRM geometry/materials/
		// textures) is never freed by GC alone, and stale refs in the shared
		// maps caused the next peer with the same key to inherit them.
		return () => {
			const name = participant.playerName;
			const vrm = vrmsRef.current[name];
			const mixer = animationMixerRef.current[name];
			if (mixer) {
				mixer.stopAllAction();
				if (vrm?.scene) mixer.uncacheRoot(vrm.scene);
			}
			delete animationMixerRef.current[name];
			delete mixers.current[name];
			delete animationsRef.current[name];
			delete participant.profileUserData.current[name];
			pendingActionsRef.current.length = 0;
			if (vrm) {
				try { VRMUtils.deepDispose(vrm.scene); } catch { /* best effort */ }
				delete vrmsRef.current[name];
				delete naturalIdleRef.current[name];
			}
		};
	}, [someVRM, theScene, participant.p2pcf, participant.playerName, participant.pfp, vrmsRef, animationMixerRef, mixers, animationsRef]);

	// Shader prewarm — after a remote VRM is attached to the scene graph,
	// ask the renderer to compile every program variant it now needs. On
	// WebGPU this pushes the MToon node-material TSL compile (which routes
	// through the deprecated `transformedNormalView` path in
	// @pixiv/three-vrm-materials-mtoon) out of the flight path. Without this
	// warmup, the compile happens the first time the renderer draws this
	// VRM under new scene conditions (a new light comes into range, a new
	// shadow cascade includes it, etc.), producing the mid-flight frame
	// drops that coincided with the `transformedNormalView deprecated` log.
	//
	// `compileAsync` is non-blocking on WebGPU and Three.js internally
	// skips programs it's already compiled, so running this per-Participant
	// is cheap — duplicate calls are a no-op after the first.
	useEffect(() => {
		if (!someVRM?.userData?.vrm) return;
		const renderer = gl as any;
		if (typeof renderer.compileAsync !== 'function') return;
		// Wait a frame for the VRM's primitive to actually attach into the
		// scene graph; compileAsync compiles only what's currently mounted.
		const timer = setTimeout(() => {
			try {
				renderer.compileAsync(theScene.scene, theScene.camera);
			} catch {
				// Non-fatal — scene might be tearing down.
			}
		}, 250);
		return () => clearTimeout(timer);
	}, [someVRM, gl, theScene.scene, theScene.camera]);

	// Single receiver for inbound peer state. NetworkBridge installs ONE
	// p2pcf "msg" listener that decodes binary + JSON and fans out here via
	// onPeerState. We filter strictly by peerId so this Participant only ever
	// reacts to its own peer — previous per-Participant listeners had no
	// identity filter on the legacy JSON path, which caused every avatar to
	// mirror the most recent broadcaster.
	useEffect(() => {
		const bridge = getNetworkBridge();
		const unsub = bridge.onPeerState((state) => {
			// peerId is required — drop decodes missing it rather than leaking
			// into every Participant.
			if (!state.peerId || state.peerId !== participant.playerName) return;

			// Position / rotation / action.
			if (state.position || state.rotation || state.action !== undefined) {
				const action = state.action;
				const prev = participantDataRef.current?.[participant.playerName];

				// Only recompute the locomotion state when an action actually
				// arrived — position-only delta packets must not clobber
				// isMoving back to false mid-walk.
				const isMovingObj = action !== undefined
					? (action && action !== 'idle' && action !== 'jumpStop'
						? { action, hangtime: state.hangtime || 0 }
						: (action === 'jumpStop' ? { action: 'jumpStop', hangtime: state.hangtime || 0 } : false))
					: (prev ? prev.isMoving : false);

				participantDataRef.current = {
					...participantDataRef.current,
					[participant.playerName]: {
						// NO [0,0,0] fallback: an action-only packet arriving
						// before any position (join-in-progress, remount) must
						// not lerp the avatar to the world origin. The 1s
						// sender keyframe guarantees a position lands soon.
						position: state.position || prev?.position,
						rotation: state.rotation || prev?.rotation,
						timestamp: Date.now(),
						isMoving: isMovingObj,
					},
				};

				if (action) {
					pendingActionsRef.current.push(action);
				}
			}

			// Swim / fly / boost blend.
			if (state.isSwimming !== undefined) remoteIsSwimming.current = state.isSwimming;
			if (state.isFlying !== undefined) remoteIsFlying.current = state.isFlying;
			if (state.isBoosting !== undefined) remoteIsBoosting.current = state.isBoosting;
			if (state.swimBlend !== undefined) remoteSwimBlend.current = state.swimBlend;
			if (state.flyPoseTime !== undefined) remoteFlyPoseTime.current = state.flyPoseTime;

			// VR hand / head / arm IK pose. Only overwrite when at least one of
			// the VR-only fields arrived so non-VR broadcasters don't clear VR
			// state mid-session.
			if (state.leftHand || state.rightHand || state.headQuat
				|| state.leftUpperArmQuat || state.rightUpperArmQuat) {
				handPoseRef.current = {
					leftHand: state.leftHand,
					rightHand: state.rightHand,
					headQuat: state.headQuat,
					leftUpperArmQuat: state.leftUpperArmQuat,
					leftLowerArmQuat: state.leftLowerArmQuat,
					rightUpperArmQuat: state.rightUpperArmQuat,
					rightLowerArmQuat: state.rightLowerArmQuat,
				};
				hasRemoteHandPose.current = true;
				lastHandPoseTimeRef.current = Date.now();
			}

			// Explicit VR presence (protocol mask bit 7): when the peer
			// reports it left VR, clear the head/hand pose immediately —
			// previously the last pose stuck forever because hands simply
			// stopped arriving.
			if (state.vrFlags !== undefined && (state.vrFlags & 0x01) === 0) {
				handPoseRef.current = null;
				hasRemoteHandPose.current = false;
			}

			// Display name + global participants map. Equality-guarded: legacy
			// JSON senders include inWorldName on EVERY packet — an unguarded
			// setState here re-rendered this Participant at the peer's full
			// packet rate.
			if (state.inWorldName) {
				setDisplayName((prev) => (prev === state.inWorldName ? prev : state.inWorldName!));
				if (window.participants && window.participants[state.peerId] !== state.inWorldName) {
					window.participants[state.peerId] = state.inWorldName;
				}
			}
		});
		return unsub;
	}, [participant.playerName]);

	useFrame((state, delta) => {
		// ── Riding a vehicle ──
		// If this peer is driving, ride the vehicle's OWN smoothly-interpolated
		// transform (published per driver hash by RideableObject) instead of
		// lerping the driver's separate, lagging position stream — that mismatch
		// is what made the avatar "play catch-up" with the car. Snap, don't lerp:
		// the vehicle group is already interpolated, so a second lerp here would
		// just re-introduce the drift we're removing.
		const rider = getRemoteRider(driverHash);
		const riding = !!rider && performance.now() - rider.ts <= REMOTE_RIDER_STALE_MS;

		if (riding && rider && participantObject.current && (participantObject.current as any).parent) {
			const parent = (participantObject.current as any).parent as THREE.Object3D;
			// LEAN/attachment — leave exactly as-is (tracks the bike + lean).
			_tmpEuler.current.set(0, rider.headingY, rider.roll || 0, 'YXZ');
			parent.quaternion.setFromEuler(_tmpEuler.current).multiply(_RIDE_PI_Y);
			_tmpTargetPos.current.set(0, RIDE_SEAT_FEET_DROP, 0).applyQuaternion(parent.quaternion);
			parent.position.set(
				rider.px - _tmpTargetPos.current.x,
				rider.py - _tmpTargetPos.current.y,
				rider.pz - _tmpTargetPos.current.z,
			);
		} else if (participantObject.current && (participantObject.current as any).parent
			&& getNetworkBridge().getPeerInterp(participant.playerName)) {
			// ── Worker-interpolated path ──
			// The network worker decodes packets AND runs the jitter-buffered
			// hermite interpolation in Rust; this slot already IS the smoothed
			// transform for this frame, so apply it directly — a second lerp
			// here would only add lag on top of the jitter buffer.
			const slot = getNetworkBridge().getPeerInterp(participant.playerName)!;
			const parent = (participantObject.current as any).parent as THREE.Object3D;
			parent.position.set(slot[0], slot[1], slot[2]);
			parent.quaternion.set(slot[3], slot[4], slot[5], slot[6]);
		} else if (participantObject.current && participantDataRef.current && participantDataRef.current[participant.playerName]
			&& participantDataRef.current[participant.playerName].position) {
			// ── Main-thread fallback path ──
			// Legacy euler-rotation peers and WASM-unavailable sessions: lerp
			// toward the most recent packet on the main thread (pre-worker
			// behavior).
			const { position, rotation, timestamp, isMoving } = participantDataRef.current[participant.playerName];
			const now = Date.now();
			const isJumping = isMoving?.action === "jumping";
			const isJumpStop = isMoving?.action === "jumpStop";
			const interpolationFactor = isJumping
				? Math.min((now - timestamp) / 800, 1)
				: Math.min((now - timestamp) / interpolationDuration, 1);

			// Set target position using pre-allocated Vector3 (no GC allocation)
			_tmpTargetPos.current.set(position[0], position[1], position[2]);

			if (isJumpStop) {
				// Jump stop: fast snap to position, then clear the jumpStop state
				participantObject.current.parent.position.lerp(
					_tmpTargetPos.current,
					Math.min((now - timestamp) / 100, 1)
				);
				// Clear jumpStop after one frame of lerp
				if ((now - timestamp) > 100 && participantDataRef.current?.[participant.playerName]) {
					participantDataRef.current = {
						...participantDataRef.current,
						[participant.playerName]: {
							...participantDataRef.current[participant.playerName],
							isMoving: false,
							position: position,
						},
					};
				}
			} else {
				participantObject.current.parent.position.lerp(_tmpTargetPos.current, interpolationFactor);
			}

			// Handle rotation: quaternion (4 elements) or euler (3 elements, legacy)
			if (rotation) {
				if (rotation.length === 4) {
					// Binary protocol: quaternion [x, y, z, w]
					_tmpTargetQuat.current.set(rotation[0], rotation[1], rotation[2], rotation[3]);
				} else {
					// Legacy JSON: euler [x, y, z]
					_tmpEuler.current.set(rotation[0], rotation[1], rotation[2]);
					_tmpTargetQuat.current.setFromEuler(_tmpEuler.current);
				}
				participantObject.current.parent.quaternion.slerp(_tmpTargetQuat.current, interpolationFactor);
			}
		}

		// VR hand pose applied after mixer.update() below — see "Apply VR hand/head poses"

		// ── Avatar LOD ──
		// Position/rotation interpolation above stays per-frame (cheap, and
		// motion smoothness matters most at any distance). Everything below —
		// action transitions, blend math, mixer.update, spring bones
		// (vrm.update), hand poses — runs at reduced rate by camera distance:
		// <25m every frame, 25-40m every 2nd, beyond every 6th. The skipped
		// frames' delta accumulates so animation time stays correct. This is
		// what makes 32 simultaneous skinned VRMs survivable.
		lodFrameRef.current++;
		lodAccumDeltaRef.current += delta;
		let lodInterval = 1;
		if (participantObject.current?.parent) {
			const distSq = state.camera.position.distanceToSquared(
				(participantObject.current as any).parent.position,
			);
			lodInterval = distSq < 625 ? 1 : distSq < 1600 ? 2 : 6;
		}
		if (lodFrameRef.current % lodInterval !== 0) return;
		const lodDelta = lodAccumDeltaRef.current;
		lodAccumDeltaRef.current = 0;

		// Apply animation based on received movement state
		// Drain the pending actions queue — prioritize one-shot actions (jumping, jumpStop)
		if (animationsRef.current[participant.playerName] && animationMixerRef.current[participant.playerName]) {
			const pending = pendingActionsRef.current;
			let targetAction: string | null = null;

			// Drain the queue in ARRIVAL order, one transition per frame —
			// preserves jump → land → walk sequences that the previous
			// "collapse to jump-priority/latest" logic skipped over (the
			// landing animation never played). Repeats of the current action
			// are consumed without spending a frame.
			while (pending.length > 0) {
				const next = pending.shift()!;
				if (next !== currentActionRef.current) {
					targetAction = next;
					break;
				}
			}

			if (targetAction && targetAction !== currentActionRef.current) {
				currentActionRef.current = targetAction;
				const idleAction = animationMixerRef.current[participant.playerName].clipAction(animationsRef.current[participant.playerName][0]);
				const walkAction = animationMixerRef.current[participant.playerName].clipAction(animationsRef.current[participant.playerName][1]);
				const runAction = animationMixerRef.current[participant.playerName].clipAction(animationsRef.current[participant.playerName][2]);
				const jumpAction = animationMixerRef.current[participant.playerName].clipAction(animationsRef.current[participant.playerName][3]);

				if (targetAction === 'jumping') {
					const now = Date.now();
					const lastJump = lastJumpTimes.current[participant.playerName] || 0;
					if (now - lastJump >= 1000) {
						lastJumpTimes.current[participant.playerName] = now;
						walkAction.stop(); runAction.stop(); idleAction.stop();
						jumpAction.setEffectiveWeight(1); idleAction.setEffectiveWeight(0);
						runAction.setEffectiveWeight(0); walkAction.setEffectiveWeight(0);
						jumpAction.reset();
						jumpAction.setEffectiveTimeScale(1);
						jumpAction.setLoop(THREE.LoopOnce, 1);
						jumpAction.clampWhenFinished = true;
						jumpAction.play();
					}
				} else if (targetAction === 'walking') {
					jumpAction.stop(); runAction.stop(); idleAction.stop();
					walkAction.setEffectiveWeight(1); jumpAction.setEffectiveWeight(0);
					idleAction.setEffectiveWeight(0); runAction.setEffectiveWeight(0);
					walkAction.play();
				} else if (targetAction === 'running') {
					jumpAction.stop(); walkAction.stop(); idleAction.stop();
					runAction.setEffectiveWeight(1); jumpAction.setEffectiveWeight(0);
					idleAction.setEffectiveWeight(0); walkAction.setEffectiveWeight(0);
					runAction.play();
				} else {
					// idle, jumpStop, or unknown — go to idle
					jumpAction.stop(); walkAction.stop(); runAction.stop();
					idleAction.setEffectiveWeight(1); jumpAction.setEffectiveWeight(0);
					runAction.setEffectiveWeight(0); walkAction.setEffectiveWeight(0);
					idleAction.play();
				}
			}
		}

		// Blend swim/fly transitions (matching Player.jsx animation parity).
		// NOTE: Reverted to per-frame mixer.clipAction lookups + in-place
		// read-modify-write setEffectiveWeight cascades. The cached-actions
		// + batched-writes optimisation is disabled because it correlated with
		// a WebGPU `drawIndexed ... Value is infinite` crash on desktop the
		// moment a remote peer joined. Pre-optimisation behaviour matches the
		// original code path used in Player.jsx.
		if (animationsRef.current[participant.playerName] && animationMixerRef.current[participant.playerName]) {
			const blendSpeed = 4;
			const anims = animationsRef.current[participant.playerName];
			const mixer = animationMixerRef.current[participant.playerName];

			// Swim transition (smooth 0→1 / 1→0)
			if (remoteIsSwimming.current) {
				swimTransitionRef.current = Math.min(1, swimTransitionRef.current + lodDelta * blendSpeed);
			} else {
				swimTransitionRef.current = Math.max(0, swimTransitionRef.current - lodDelta * blendSpeed);
			}

			// Fly transition (smooth 0→1 / 1→0)
			if (remoteIsFlying.current) {
				flyTransitionRef.current = Math.min(1, flyTransitionRef.current + lodDelta * blendSpeed);
			} else {
				flyTransitionRef.current = Math.max(0, flyTransitionRef.current - lodDelta * blendSpeed);
			}

			const st = swimTransitionRef.current;
			const ft = flyTransitionRef.current;

			// Swim blend on top of land animations.
			if (st > 0 && anims[4] && anims[5]) {
				const swimIdleAction = mixer.clipAction(anims[4]);
				const swimAction = mixer.clipAction(anims[5]);
				const isMoving = currentActionRef.current === 'walking' || currentActionRef.current === 'running'
					|| (remoteIsSwimming.current && currentActionRef.current === 'jumping');
				const swimBlendTarget = isMoving ? (remoteSwimBlend.current || 1) : 0;
				swimMoveBlendLocal.current += (swimBlendTarget - swimMoveBlendLocal.current) * Math.min(1, lodDelta * blendSpeed);
				const swimMoveBlend = swimMoveBlendLocal.current;
				swimIdleAction.setEffectiveWeight(st * (1 - swimMoveBlend));
				swimAction.setEffectiveWeight(st * swimMoveBlend);
				swimAction.setEffectiveTimeScale(remoteIsBoosting.current ? 2.2 : 1.0);

				const landScale = 1 - st;
				const idleAction = mixer.clipAction(anims[0]);
				const walkAction = mixer.clipAction(anims[1]);
				const runAction = mixer.clipAction(anims[2]);
				idleAction.setEffectiveWeight(idleAction.getEffectiveWeight() * landScale);
				walkAction.setEffectiveWeight(walkAction.getEffectiveWeight() * landScale);
				runAction.setEffectiveWeight(runAction.getEffectiveWeight() * landScale);
			}

			// Fly blend (frozen swim pose + ambient idle).
			if (ft > 0 && anims[5]) {
				const FLY_SWIM_WEIGHT = 0.72;
				const FLY_AMBIENT_WEIGHT = 0.28;

				const swimAction = mixer.clipAction(anims[5]);
				swimAction.time = remoteFlyPoseTime.current;
				swimAction.setEffectiveTimeScale(0);
				swimAction.setEffectiveWeight(ft * FLY_SWIM_WEIGHT);
				swimAction.play();

				const idleAction = mixer.clipAction(anims[0]);
				const baseIdleWeight = idleAction.getEffectiveWeight();
				idleAction.setEffectiveWeight(baseIdleWeight * (1 - ft) + ft * FLY_AMBIENT_WEIGHT);
				// The idle action is the natural-idle FROZEN pose layer — its
				// timeScale must stay 0. The slowed ambient motion during
				// flight comes from the breathing layer instead.
				const niFly = naturalIdleRef.current[participant.playerName];
				if (niFly?.breathingAction) {
					niFly.breathingAction.setEffectiveTimeScale(ft > 0.5 ? 0.4 : 1);
				} else {
					idleAction.setEffectiveTimeScale(ft > 0.5 ? 0.4 : 1);
				}
				idleAction.play();

				// Scale down other weights.
				const landScale = 1 - ft;
				const walkAction = mixer.clipAction(anims[1]);
				const runAction = mixer.clipAction(anims[2]);
				walkAction.setEffectiveWeight(walkAction.getEffectiveWeight() * landScale);
				runAction.setEffectiveWeight(runAction.getEffectiveWeight() * landScale);

				// Also scale down swim idle during flight.
				if (anims[4]) {
					const swimIdleAction = mixer.clipAction(anims[4]);
					swimIdleAction.setEffectiveWeight(swimIdleAction.getEffectiveWeight() * (1 - ft));
				}
			}
		}

		// Riding overlay — hold the seated driving pose, fading every locomotion/
		// idle/swim/fly weight out and the driving pose in. Same pattern + ordering
		// (last, just before mixer.update) as Player.jsx's local seated overlay, so
		// a peer in a vehicle SITS instead of idling on the spot. Blends both
		// directions, so boarding/dismount cross-fade cleanly.
		if (animationsRef.current[participant.playerName] && animationMixerRef.current[participant.playerName]) {
			const anims = animationsRef.current[participant.playerName];
			const mixer = animationMixerRef.current[participant.playerName];
			const drivingClip = anims[6];
			if (drivingClip) {
				const target = riding ? 1 : 0;
				ridingBlendLocal.current += (target - ridingBlendLocal.current) * Math.min(1, lodDelta * 6);
				const db = ridingBlendLocal.current;
				const drivingAction = mixer.clipAction(drivingClip);
				if (db > 0.001) {
					for (let i = 0; i < 6; i++) {
						if (anims[i]) {
							const a = mixer.clipAction(anims[i]);
							a.setEffectiveWeight(a.getEffectiveWeight() * (1 - db));
						}
					}
					drivingAction.setEffectiveWeight(db);
					drivingAction.play();
				} else {
					drivingAction.setEffectiveWeight(0);
				}
			}
		}

		// Natural idle: scrub the frozen pose layer between random poses and
		// keep the breathing layer's weight tracking the pose layer (so idle
		// fades with the existing state-machine weights as one unit). Skipped
		// while idle contributes nothing.
		const ni = naturalIdleRef.current[participant.playerName];
		if (ni?.enabled) {
			followBreathingWeight(ni);
			if ((ni.poseAction?.getEffectiveWeight() ?? 0) > 0.01) {
				updateNaturalIdleAnimation(ni, lodDelta);
			}
		}

		// Update animation mixer (single call, using delta from useFrame)
		if (mixers.current[participant.playerName]) {
			mixers.current[participant.playerName].update(lodDelta);
		}

		// Apply head bone tilts AFTER mixer.update() so they aren't overwritten
		// by the animation pose. NOTE: Reverted to per-frame
		// `humanoid.getNormalizedBoneNode(...)` lookups. Caching these bone
		// refs at VRM load correlated with the WebGPU drawIndexed-Infinity
		// crash when a remote peer joined a desktop session that was already
		// rendering. Per-frame lookups are the pre-optimisation behaviour.
		if ((swimTransitionRef.current > 0 || flyTransitionRef.current > 0) && someVRM?.userData?.vrm?.humanoid) {
			const humanoid = someVRM.userData.vrm.humanoid;
			const headBone = humanoid.getNormalizedBoneNode?.('head') || humanoid.getRawBoneNode?.('head');
			if (headBone) {
				const isMoving = currentActionRef.current === 'walking' || currentActionRef.current === 'running'
					|| (remoteIsSwimming.current && currentActionRef.current === 'jumping');
				const st = swimTransitionRef.current;
				const ft = flyTransitionRef.current;
				if (st > 0 && isMoving) {
					headBone.rotation.x += 0.9 * st;
					headBone.rotation.y += 0.25 * st;
				}
				if (ft > 0) {
					const moveFactor = isMoving ? 1.0 : 0.7;
					headBone.rotation.x += 0.9 * moveFactor * ft;
					headBone.rotation.y += 0.25 * moveFactor * ft;
				}
			}
		}

		// Stale-pose timeout: senders without the vrFlags presence bit just
		// stop sending hand fields when they leave VR — clear after 2s of
		// silence so the avatar returns to normal locomotion animation.
		if (hasRemoteHandPose.current && Date.now() - lastHandPoseTimeRef.current > 2000) {
			hasRemoteHandPose.current = false;
			handPoseRef.current = null;
		}

		// Apply VR hand/head poses AFTER mixer.update() so animations don't
		// overwrite them. Per-frame humanoid lookups (reverted from cached).
		if (hasRemoteHandPose.current && handPoseRef.current && someVRM?.userData?.vrm) {
			const humanoid = someVRM.userData.vrm.humanoid;
			if (humanoid) {
				const hp = handPoseRef.current;

				if (hp.headQuat) {
					const headBone = humanoid.getNormalizedBoneNode?.('head');
					if (headBone) {
						headBone.quaternion.set(hp.headQuat[0], hp.headQuat[1], hp.headQuat[2], hp.headQuat[3]);
						headBone.updateMatrix();
					}
				}

				if (hp.leftUpperArmQuat && hp.leftLowerArmQuat) {
					applyRemoteArmBones(humanoid, true, hp.leftUpperArmQuat, hp.leftLowerArmQuat);
				}
				if (hp.rightUpperArmQuat && hp.rightLowerArmQuat) {
					applyRemoteArmBones(humanoid, false, hp.rightUpperArmQuat, hp.rightLowerArmQuat);
				}

				if (hp.leftHand) {
					applyRemoteWristPose(humanoid, true, hp.leftHand.wristQuat);
					applyRemoteFingerPose(humanoid, LEFT_FINGER_BONES, hp.leftHand.fingerJoints);
				}
				if (hp.rightHand) {
					applyRemoteWristPose(humanoid, false, hp.rightHand.wristQuat);
					applyRemoteFingerPose(humanoid, RIGHT_FINGER_BONES, hp.rightHand.fingerJoints);
				}
			}
		}

		// Update VRM spring bones etc (single call)
		if (someVRM?.userData?.vrm) {
			someVRM.userData.vrm.update(lodDelta);
		}
	});

	if (!someVRM || !someVRM.userData?.vrm) {
		return null;
	}

	const playerController = someVRM.userData.vrm;

	let planeWidth = 0.25;
	let fontSize = 0.04;
	let xPos = 0.045;
	if (displayName.length > 8) {
		planeWidth = 0.35;
		xPos = -0.005;
	}
	if (displayName.length >= 16) {
		planeWidth = 0.35;
		fontSize = 0.032;
		xPos = -0.005;
	}

	const isPng = Array.isArray(participant.playerVRM) && participant.playerVRM[0] === "" ? false : (typeof participant.playerVRM === 'string' && participant.playerVRM.endsWith('.png'));
	const color = "#000000";
	const colorValue = new THREE.Color(parseInt(color.replace("#", "0x"), 16));

	return (
		<group userData={{ camExcludeCollision: true }}>
			<group userData={{ camExcludeCollision: true }} rotation={[0, Math.PI, 0]}>
				<mesh
					visible={true}
					position={[0.22, cachedHeight.current, 0.005]}
					rotation-y={-Math.PI}
					name="displayNamePfp"
					geometry={_pfpPlaneGeometry}
				>
					<meshBasicMaterial side={THREE.DoubleSide} map={profileImage} />
				</mesh>
				<mesh
					visible={true}
					position={[xPos, cachedHeight.current, 0.005]}
					rotation-y={-Math.PI}
					name="displayNameBackground"
				>
					<planeGeometry args={[planeWidth, 0.07]} />
					<meshBasicMaterial side={THREE.DoubleSide} color={colorValue} />
				</mesh>
				{/*
				  * Nameplate text — renderer-agnostic CanvasTextMesh (2D canvas
				  * → texture → plane) so it renders on BOTH WebGPU (desktop) and
				  * WebGL (mobile). The previous MSDFTextMesh path is WebGPU-only
				  * (three-msdf-text-webgpu TSL materials) and drew nothing on the
				  * WebGL fallback most mobile devices use. `fontSize` here is the
				  * world-unit text height (0.04, or 0.032 for long names); the
				  * 0.5 wrap width matches the old layout's maxWidth.
				  */}
				<CanvasTextMesh
					text={displayName}
					worldWidth={0.5}
					worldFontSize={fontSize}
					anchorX="left"
					anchorY="middle"
					align="left"
					color="#ffffff"
					position={[0.15, cachedHeight.current - 0.005, 0]}
					rotation={[0, -Math.PI, 0]}
				/>
			</group>
			<primitive userData={{ camExcludeCollision: true }} ref={participantObject} name={participant.playerName} object={playerController.scene} rotation={[0, Math.PI, 0]} />
			{isPng && (
				<SpriteAnimator
					position={[0, 1, 0]}
					frameName={frameName}
					userData={{ camExcludeCollision: true }}
					scale={[2, 2, 2]}
					fps={10}
					animationNames={['WalkForward', 'WalkBackward', 'ForwardIdle', 'BackwardIdle', 'WalkLeft', 'WalkRight']}
					autoPlay={true}
					asSprite={false}
					alphaTest={0.1}
					loop={true}
					textureImageURL={participant.playerVRM}
					textureDataURL={threeObjectPluginRoot + "/inc/utils/sprite.json"}
				/>
			)}
		</group>
	);
}

export function Participants(_props: ParticipantsProps): React.JSX.Element {
	// const theScene = useThree();
	const profileUserData = useRef<Record<string, any>>({});
	const animationMixerRef = useRef<Record<string, THREE.AnimationMixer>>({});
	const animationsRef = useRef<Record<string, THREE.AnimationClip[]>>({});
	const mixers = useRef<Record<string, THREE.AnimationMixer>>({});
	const vrmsRef = useRef<Record<string, any>>({});
	const participants = useParticipantsStore((state) => state.participants);
	const addParticipant = useParticipantsStore((state) => state.addParticipant);
	const removeParticipant = useParticipantsStore((state) => state.removeParticipant);
	const updateParticipantProfile = useParticipantsStore((state) => state.updateParticipantProfile);

	// Track p2pcf readiness via React state so useEffects re-run when it becomes available
	const [p2pcfReady, setP2pcfReady] = useState(() => !!window.p2pcf);
	useEffect(() => {
		if (window.p2pcf) { setP2pcfReady(true); return; }
		const onReady = () => setP2pcfReady(true);
		window.addEventListener('p2pcf-ready', onReady);
		return () => window.removeEventListener('p2pcf-ready', onReady);
	}, []);
	// const lastJumpTimes = useRef({});

	// useEffect(() => {
	// 	if (window.p2pcf) {
	// 	  window.p2pcf.on("msg", (peer, data) => {
	// 		if (!(peer.id in window.participants)) {
	// 		  return;
	// 		}

	// 		const finalData = new TextDecoder("utf-8").decode(data);
	// 		const participantData = JSON.parse(finalData);

	// 		if (animationsRef.current[peer.client_id]) {
	// 		  const walkAction = animationMixerRef.current[peer.client_id].clipAction(animationsRef.current[peer.client_id][1]);
	// 		  const idleAction = animationMixerRef.current[peer.client_id].clipAction(animationsRef.current[peer.client_id][0]);
	// 		  const runAction = animationMixerRef.current[peer.client_id].clipAction(animationsRef.current[peer.client_id][2]);
	// 		  const jumpAction = animationMixerRef.current[peer.client_id].clipAction(animationsRef.current[peer.client_id][3]);

	// 		  if (participantData[peer.client_id].isMoving && participantData[peer.client_id].isMoving.action === "jumping") {
	// 			walkAction.stop();
	// 			runAction.stop();
	// 			idleAction.stop();

	// 			if (!jumpAction.isRunning()) {
	// 			  const currentTime = Date.now();
	// 			  const lastJumpTime = lastJumpTimes.current[peer.client_id] || 0;
	// 			  const jumpCooldown = 1000; // Adjust this value to set a cooldown between jumps

	// 			  if (currentTime - lastJumpTime >= jumpCooldown) {
	// 				console.log("Jumping. this should only happen once.");
	// 				lastJumpTimes.current[peer.client_id] = currentTime;
	// 				jumpAction.reset();
	// 				jumpAction.setEffectiveTimeScale(1);
	// 				jumpAction.setEffectiveWeight(1);
	// 				jumpAction.setLoop(THREE.LoopOnce, 1);
	// 				jumpAction.clampWhenFinished = true;
	// 				jumpAction.play();
	// 			  }
	// 			}
	// 		  } else if (participantData[peer.client_id].isMoving && participantData[peer.client_id].isMoving.action === "walking") {
	// 			jumpAction.stop();
	// 			walkAction.play();
	// 			runAction.stop();
	// 			idleAction.stop();
	// 		  } else if (participantData[peer.client_id].isMoving && participantData[peer.client_id].isMoving.action === "running") {
	// 			walkAction.stop();
	// 			runAction.play();
	// 			idleAction.stop();
	// 			jumpAction.stop();
	// 		  } else {
	// 			idleAction.play();
	// 			walkAction.stop();
	// 			runAction.stop();
	// 			jumpAction.stop();
	// 		  }
	// 		}

	// 		if (participantData[peer.client_id]?.inWorldName) {
	// 		  window.participants[peer.id] = participantData[peer.client_id].inWorldName;
	// 		}
	// 	  });
	// 	}
	//   }, [window.p2pcf, animationMixerRef, animationsRef]);

	useEffect(() => {
		const p2pcf = window.p2pcf;
		if (!p2pcf) return;

		const handlePeerClose = (peer: any) => {
			delete window.participants[peer.id];
			delete animationMixerRef.current[peer.client_id];
			delete animationsRef.current[peer.client_id];
			delete mixers.current[peer.client_id];
			delete vrmsRef.current[peer.client_id];
			// Drop the binary clientIdHash → clientId mapping so a ghost
			// hash can't route packets to a future peer.
			for (const hash of Object.keys(peerHashMap.current)) {
				if (peerHashMap.current[hash as unknown as number] === peer.client_id) {
					delete peerHashMap.current[hash as unknown as number];
				}
			}
			removeParticipant(peer.client_id);
			getNetworkBridge().removePeer(peer.client_id);
		};

		p2pcf.on("peerclose", handlePeerClose);
		return () => { p2pcf.removeListener("peerclose", handlePeerClose); };
	}, [removeParticipant, p2pcfReady]);

	// Track known peer hashes to map binary protocol clientIdHash -> clientId string
	const peerHashMap = useRef<Record<number, string>>({});

	useEffect(() => {
		const p2pcf = window.p2pcf;
		if (!p2pcf) return;

		// Register for binary profile announces via NetworkBridge
		const bridge = getNetworkBridge();
		const unsubProfile = bridge.onPeerProfile((profile) => {
			// Map the clientIdHash to a known peer client_id
			const clientId = peerHashMap.current[profile.clientIdHash];
			if (clientId) {
				// Update the participant's profile data in the store
				updateParticipantProfile(clientId, profile.vrmUrl, profile.name, profile.profileImage);
				// Update the window.participants display name
				for (const [peerId, name] of Object.entries(window.participants)) {
					if (name === '' || name === clientId) {
						window.participants[peerId] = profile.name;
						break;
					}
				}
			}
		});

		// Legacy JSON path: add participants from first message
		const handleMsg = (peer: any, data: any) => {
			if (!(peer.id in window.participants)) {
				window.participants[peer.id] = "";

				// Check if this is binary protocol (first byte 0x01) or legacy JSON
				const firstByte = data instanceof Uint8Array ? data[0] : 0;
				if (firstByte === 0x01) {
					// Binary protocol: extract clientIdHash from header bytes [2..3]
					const clientIdHash = data[2] | (data[3] << 8); // u16 LE
					peerHashMap.current[clientIdHash] = peer.client_id;
					// Add participant with placeholder data; profile announce will fill in details
					const newParticipant: [string, string, string, string] = [peer.client_id, '', '', ''];
					addParticipant(newParticipant);
				} else {
					// Legacy JSON: extract profile from first message
					try {
						const finalData = new TextDecoder("utf-8").decode(data);
						const parsedData = JSON.parse(finalData);
						const newParticipant: [string, string, string, string] = [
							peer.client_id,
							parsedData.playerVRM || '',
							parsedData.inWorldName || '',
							parsedData.profileImage || '',
						];
						addParticipant(newParticipant);
					} catch (e) {
						// Fallback: add with empty profile
						addParticipant([peer.client_id, '', '', '']);
					}
				}
			}
		};

		p2pcf.on("msg", handleMsg);

		return () => {
			unsubProfile();
			p2pcf.removeListener("msg", handleMsg);
		};
	}, [p2pcfReady]);

	return (
		<>
			{participants && participants.map((item) => {
				const profileImage = item[3] || '';
				return (
					<Participant
						// Keyed by clientId — index keys re-bound component
						// instances to DIFFERENT peers when someone left,
						// resetting interpolation/action refs mid-session.
						key={item[0]}
						playerName={item[0]}
						p2pcf={window.p2pcf}
						animationMixerRef={animationMixerRef}
						vrmsRef={vrmsRef}
						animationsRef={animationsRef}
						mixers={mixers}
						profileUserData={profileUserData}
						playerVRM={item[1]}
						inWorldName={item[2]}
						profileImage={profileImage}
					/>
				);
			})}
		</>
	);
}	