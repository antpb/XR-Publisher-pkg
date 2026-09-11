import { Box3,
	Mesh,
	Raycaster,
	PerspectiveCamera,
	ArrowHelper,
	Euler, MathUtils, NearestFilter, LoopOnce, LoopRepeat, DoubleSide, MeshBasicMaterial, RingGeometry, BoxGeometry, AudioListener, Color, Group, Quaternion, Matrix4, VectorKeyframeTrack, QuaternionKeyframeTrack, LoopPingPong, AnimationClip, NumberKeyframeTrack, AnimationMixer, Vector3, Vector2, BufferGeometry, CircleGeometry, PlaneGeometry } from "three";
// import { TextureLoader } from "three/src/loaders/TextureLoader";
import { useFrame, useLoader, useThree, Interactive } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { SpriteAnimator, KeyboardControls, OrbitControls } from '@react-three/drei';
// import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useRef, useState, useEffect, useCallback } from "react";
// XR imports are only used when useWebGLForXR is true
// useXR hook is called conditionally via XRPlayerState component
import { RigidBody, CapsuleCollider, useRapier, vec3, interactionGroups, CuboidCollider } from "@react-three/rapier";
import defaultVRM from "../defaults/avatars/xr_publisher_default_avatar.vrm";
import blankVRM from "../defaults/avatars/blank_avatar.vrm";
import { VRMUtils, VRMLoaderPlugin, VRMSpringBoneManager, VRMExpressionPresetName, VRMHumanBoneName, VRM } from "@pixiv/three-vrm";
import { MToonMaterialLoaderPlugin } from "@pixiv/three-vrm-materials-mtoon";
import { MToonNodeMaterial } from "@pixiv/three-vrm-materials-mtoon/nodes";

// import idle from "../defaults/avatars/friendly.fbx";
// import walk from "../defaults/avatars/walking.fbx";
// import run from "../defaults/avatars/running.fbx";
// import jump from "../defaults/avatars/Jump.fbx";
// import fall from "../defaults/avatars/falling.fbx";
// import swimIdleAnim from "../defaults/avatars/swim_idle.fbx";
// import swimAnim from "../defaults/avatars/swim.fbx";
import { getMixamoRig } from "../utils/rigMap";
import useWorldStore from "../stores/worldStore";
import { markLoaded } from "../state/loadProgress";
import ShapePointsMesh from "../utils/ShapePointsMesh";
import DynLineMesh from "../utils/DynLineMesh";
import Ecctrl, { EcctrlAnimation, useGame, useFollowCam, useJoystickControls } from "ecctrl";
// OrbitControls import removed - not needed for this component
// import avatar from ./avatar/index.js
// import { ExokitAvatar } from "./avatar";
import WorldCursor from "./WorldCursor";
import InteractionMenuSystem from "./InteractionMenuSystem";
import { FlyingParticles } from "./FlyingParticles";
import { FlyingParticlesWebGL } from "./FlyingParticlesWebGL";
import { FootprintSystem } from "./FootprintSystem";
import { FootprintSystemWebGL } from "./FootprintSystemWebGL";
import useInteractionStore from "../stores/interactionStore";
import useRideStore from "../stores/rideStore";
import { useTerrainChunkStore } from "./core/front/terrainChunkStore";
import { triggerWaterSplash } from "./core/front/waterSplash";
import { rideSeat } from "../networking/rideSeat";
import { rideInput, setRideInput } from "../networking/rideInput";
import { getNetworkBridge } from "../networking/NetworkBridge";
import { LocalActionState } from "../networking/localActionState";
import { registerMenuItem, unregisterMenuItem } from "../decorations/pluginMenu";
import { getActiveInteractable, triggerActiveInteractable } from "../decorations/interactionRegistry";
import { captureFingerQuaternions, LEFT_FINGER_BONES, RIGHT_FINGER_BONES, applyFistPose } from "../utils/vrmHandPose";
import { applyAimPose } from "../utils/vrmAimPose";
// Importing this module patches the ecctrl joystick store so touch input
// turns the view instead of strafing (see joystickTankControls.ts).
import { joystickTurn } from "./joystickTankControls";

// import { 
// 	Armature,
// 	Pose,
// 	BipedRig,
// 	IKChain,
// 	HipSolver,
// 	SpineSolver,
// 	LimbSolver,
// 	FootSolver,
// 	SwingTwistSolver,
// 	SwingTwistEndsSolver,
// 	ZSolver
// } from 'ossos';

const DamperTimeS = 0.15;

// Mobile/iOS detection for performance optimizations
const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

const FLY_POSE_TIME = 0.5;
const FLY_BOOST_POSE_TIME = 1.2;
const FLY_SPEED = 10;
// Camera yaw rate (rad/s) at full lateral joystick deflection.
const JOYSTICK_TURN_SPEED = 2.4;
// How far ABOVE the terrain the capsule CENTER spawns. The capsule is ~1.7 tall
// (half-height ~0.85), so the body bottom ends up ~(this − 0.85) above ground.
// Generous on purpose: the player drops the short distance and settles onto the
// surface, never starting embedded with just the head poking out.
const SPAWN_GROUND_CLEARANCE = 4.0;
// Delay (s) between the synthetic takeoff jump and engaging fly mode when
// the fly button is pressed while grounded.
const FLY_BUTTON_JUMP_DELAY = 0.28;
const FLY_SWIM_WEIGHT = 0.72;
const FLY_AMBIENT_WEIGHT = 0.28;

const __rot = new Quaternion();
const __shoulderWPos = new Vector3();
const __originWPos = new Vector3();
const __originWDir = new Vector3();
const __offset = new Vector3();
const __camOccPivot = new Vector3();
const __camOccDir = new Vector3();

// Camera occlusion clamp tuning (see the useFrame block near the Ecctrl JSX).
// Pivot lift mirrors ecctrl's camera target: capsuleHalfHeight (0.35) +
// capsuleRadius/2 (0.15) above the body centre — both ecctrl defaults, we
// don't override them.
const CAM_OCCLUSION_PIVOT_LIFT = 0.5;
const CAM_OCCLUSION_MARGIN = 0.22;  // sit this far in front of the hit
const CAM_OCCLUSION_MIN = 0.18;     // never closer than this to the pivot

const CURSOR_SHOULDER_OFFSET = { forward: 2.5, right: 1.2, up: 0.2 };
const CURSOR_VISUAL_CONFIG = {
	color: 0x4285f4,
	size: { inner: 0.1, outer: 0.15, glow: 0.2 },
	opacity: { ring: 0.8, dot: 0.9, glow: 0.3 },
	animation: { pulseSpeed: 6, breathSpeed: 2, rotationSpeed: 0.5 }
};

const mixamoVRMRigMap = getMixamoRig();

/** Summed absolute delta across two equal-length Float32Arrays. Used by the
 * VR broadcast delta gate to decide whether finger pose changed meaningfully. */
function _sumAbsDelta(a, b) {
	const n = Math.min(a.length, b.length);
	let s = 0;
	for (let i = 0; i < n; i++) {
		const d = a[i] - b[i];
		s += d < 0 ? -d : d;
	}
	return s;
}

/** Dot product between a packed [x,y,z,w] array and a THREE.Quaternion-ish
 * object. Quaternions are unit-length so the dot product is cos(half-angle);
 * values close to 1 mean "no rotation change". */
function _quatDot(a, q) {
	return a[0] * q.x + a[1] * q.y + a[2] * q.z + a[3] * q.w;
}

function addHandRotationControls() {
	const container = document.createElement('div');
	container.style.position = 'fixed';
	container.style.top = '10px';
	container.style.right = '10px';
	container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
	container.style.padding = '10px';
	container.style.borderRadius = '5px';
	container.style.color = 'white';
	container.style.fontFamily = 'Arial, sans-serif';
	container.style.zIndex = '10000';
	container.style.maxHeight = '80vh';
	container.style.overflowY = 'auto';
  
	const createSlider = (name, min, max, step, defaultValue) => {
	  const label = document.createElement('label');
	  label.textContent = `${name}: `;
	  label.style.display = 'block';
	  label.style.marginBottom = '5px';
  
	  const slider = document.createElement('input');
	  slider.type = 'range';
	  slider.min = min;
	  slider.max = max;
	  slider.step = step;
	  slider.value = defaultValue;
	  slider.style.width = '100%';
  
	  const valueDisplay = document.createElement('span');
	  valueDisplay.textContent = defaultValue;
	  valueDisplay.style.marginLeft = '5px';
  
	  slider.addEventListener('input', () => {
		valueDisplay.textContent = slider.value;
		window.handRotationControls[name] = parseFloat(slider.value);
	  });
  
	  label.appendChild(slider);
	  label.appendChild(valueDisplay);
	  return label;
	};
  
	const createCheckbox = (name) => {
	  const label = document.createElement('label');
	  label.style.display = 'block';
	  label.style.marginBottom = '5px';
  
	  const checkbox = document.createElement('input');
	  checkbox.type = 'checkbox';
	  checkbox.style.marginRight = '5px';
  
	  checkbox.addEventListener('change', () => {
		window.handRotationControls[name] = checkbox.checked;
	  });
  
	  label.appendChild(checkbox);
	  label.appendChild(document.createTextNode(name));
	  return label;
	};
  
	window.handRotationControls = {
		rightHandRotationOffsetX: 0,
		rightHandRotationOffsetY: 0,
		rightHandRotationOffsetZ: -90,
		leftHandRotationOffsetX: 0,
		leftHandRotationOffsetY: 0,
		leftHandRotationOffsetZ: 90,
		flipRightHandX: false,
		flipRightHandY: false,
		flipRightHandZ: false,
		flipLeftHandX: false,
		flipLeftHandY: false,
		flipLeftHandZ: false,
		  rightArmPoleX: 0,
	  rightArmPoleY: 0,
	  rightArmPoleZ: -1,
	  leftArmPoleX: 0,
	  leftArmPoleY: 0,
	  leftArmPoleZ: -1
	};
  
	container.appendChild(createSlider('rightHandRotationOffsetX', -180, 180, 1, 0));
	container.appendChild(createSlider('rightHandRotationOffsetY', -180, 180, 1, 0));
	container.appendChild(createSlider('rightHandRotationOffsetZ', -180, 180, 1, 0));
	container.appendChild(createSlider('leftHandRotationOffsetX', -180, 180, 1, 0));
	container.appendChild(createSlider('leftHandRotationOffsetY', -180, 180, 1, 0));
	container.appendChild(createSlider('leftHandRotationOffsetZ', -180, 180, 1, 0));
	container.appendChild(createCheckbox('flipRightHandX'));
	container.appendChild(createCheckbox('flipRightHandY'));
	container.appendChild(createCheckbox('flipRightHandZ'));
	container.appendChild(createCheckbox('flipLeftHandX'));
	container.appendChild(createCheckbox('flipLeftHandY'));
	container.appendChild(createCheckbox('flipLeftHandZ'));
  
	// Add arm pole target sliders
	container.appendChild(document.createElement('hr'));
	container.appendChild(document.createTextNode('Arm Pole Targets:'));
	container.appendChild(createSlider('rightArmPoleX', -1, 1, 0.1, 0));
	container.appendChild(createSlider('rightArmPoleY', -1, 1, 0.1, 0));
	container.appendChild(createSlider('rightArmPoleZ', -1, 1, 0.1, -1));
	container.appendChild(createSlider('leftArmPoleX', -1, 1, 0.1, 0));
	container.appendChild(createSlider('leftArmPoleY', -1, 1, 0.1, 0));
	container.appendChild(createSlider('leftArmPoleZ', -1, 1, 0.1, -1));
  
	// document.body.appendChild(container);
  }
  
function loadMixamoAnimation(url, vrm) {
if (!url || typeof url !== 'string') return Promise.reject('Invalid URL');
let loader;
if (url.endsWith('.fbx')) {
	loader = new FBXLoader();
} else {
	loader = new GLTFLoader();
}
return loader.loadAsync(url).then((resource) => {
	const clip = resource.animations[0];

	if (url.endsWith('.glb')) {
	resource = resource.scene;
	}

	let tracks = [];

	let restRotationInverse = new Quaternion();
	let parentRestWorldRotation = new Quaternion();
	let _quatA = new Quaternion();
	let _vec3 = new Vector3();

	let mixamoHips = resource.getObjectByName('mixamorigHips');
	let regularHips = resource.getObjectByName('hips');
	let mainHip;
	if (mixamoHips) {
	mainHip = mixamoHips.position.y;
	} else if (regularHips) {
	mainHip = regularHips.position.y;
	}
	// NOTE: VRMUtils.rotateVRM0 / removeUnnecessaryVertices / removeUnnecessaryJoints
	// used to run here — i.e. once PER animation (6×) on the same VRM. They are
	// idempotent setup that belongs at VRM-load time; running the joint cleanup
	// repeatedly churned skeleton memory and was a load-time spike on mobile.
	// Now done exactly once in the VRM load callback (see `loader.load`).
	const vrmHipsY = vrm.humanoid?.getNormalizedBoneNode('hips').getWorldPosition(_vec3).y;
	const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
	const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
	const hipsPositionScale = vrmHipsHeight / mainHip;

	// Authoring space → handedness flip. Mixamo FBX clips use mixamorig* track
	// names and face +Z; the `metaVersion==='0'` flip (conjugate by Y180 → negate
	// x,z) reorients them to VRM0's −Z forward. Some GLB clips (e.g.
	// drivingpose.glb) target VRM humanoid bone names directly and are ALREADY
	// authored in VRM0 space — applying that same flip reverses them (spine bends
	// backward). So invert the flip condition for non-Mixamo (VRM-space) sources.
	const isMixamoSource = clip.tracks.some((t) => mixamoVRMRigMap[t.name.split('.')[0]] != null);
	const applyFlip = isMixamoSource
		? (vrm.meta?.metaVersion === '0')
		: (vrm.meta?.metaVersion !== '0');

	clip.tracks.forEach((track) => {
	let trackSplitted = track.name.split('.');
	let mixamoRigName = trackSplitted[0];
	let vrmBoneName = mixamoVRMRigMap[mixamoRigName];
	// Some authored clips (e.g. drivingpose.glb) target VRM humanoid bone names
	// directly (hips, spine, leftUpperArm, …) rather than mixamorig* names. When
	// the Mixamo map misses, fall back to the track's own node name if it's a
	// valid VRM humanoid bone — the rest-pose correction below uses the source
	// node's own rest rotation, so this handles either authoring style.
	if (vrmBoneName == null && vrm.humanoid?.getNormalizedBoneNode(mixamoRigName)) {
		vrmBoneName = mixamoRigName;
	}
	let vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
	let mixamoRigNode = resource.getObjectByName(mixamoRigName);

	if (vrmNodeName != null) {
		let propertyName = trackSplitted[1];

		mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
		mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

		if (track instanceof QuaternionKeyframeTrack) {
		for (let i = 0; i < track.values.length; i += 4) {
			let flatQuaternion = track.values.slice(i, i + 4);

			_quatA.fromArray(flatQuaternion);

			_quatA
			.premultiply(parentRestWorldRotation)
			.multiply(restRotationInverse);

			_quatA.toArray(flatQuaternion);

			flatQuaternion.forEach((v, index) => {
			track.values[index + i] = v;
			});
		}

		tracks.push(
			new QuaternionKeyframeTrack(
			`${vrmNodeName}.${propertyName}`,
			track.times,
			track.values.map((v, i) => (applyFlip && i % 2 === 0 ? -v : v)),
			),
		);
		} else if (track instanceof VectorKeyframeTrack) {
		let value = track.values.map((v, i) => (applyFlip && i % 3 !== 1 ? -v : v) * hipsPositionScale);
		tracks.push(new VectorKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, value));
		}
	}
	});

	// Free the parsed source scene. These Mixamo FBX/GLB files carry skinned
	// meshes + skeletons we never render — only the retargeted `tracks` are
	// kept. Disposing here (rather than waiting for GC) keeps peak memory to
	// roughly one source file at a time during the staggered load, which is
	// what was tripping the iOS memory watchdog mid-avatar-load.
	resource.traverse((obj) => {
		if (obj.geometry && typeof obj.geometry.dispose === 'function') obj.geometry.dispose();
		const mat = obj.material;
		if (mat) {
			(Array.isArray(mat) ? mat : [mat]).forEach((m) => { if (m && typeof m.dispose === 'function') m.dispose(); });
		}
	});

	return new AnimationClip('vrmAnimation', clip.duration, tracks);
});
}

// ── Session-persistent player position (MODULE state, survives remounts) ──
// A Player REMOUNT re-creates the rapier body at Ecctrl's `position` prop and
// resets every per-instance ref guard — without this, any parent state flip
// that unmounted/remounted Player silently reborn the body at the authored
// spawnPoint ("player respawns at origin when a far cell loads", worst on
// mobile where memory/perf pressure makes such flips likelier). The per-frame
// player-state block keeps this fresh; on mount, a valid session position
// wins over the authored spawn and the one-shot placement guards start
// pre-satisfied (the player is already placed — nothing may move them).
const sessionPlayerPos = { valid: false, x: 0, y: 5, z: 0 };

// Respawn lives in the HUD "More" menu (the top-left hamburger) rather than a
// bare always-visible button — it's destructive enough that an accidental
// click is annoying, so it sits behind a deliberate toggle. Returns an
// unregister cleanup for the caller's effect.
function registerRespawnMenuItem(props) {
const trigger = () => {
	props.movement.current.respawn = true;
	setTimeout(() => {
	props.movement.current.respawn = false;
	}, 100);
};
registerMenuItem({
	id: 'respawn',
	label: 'Respawn',
	icon: '↺',
	order: 50,
	onSelect: trigger,
});
return () => unregisterMenuItem('respawn');
}

class XrHead {
constructor(context) {
	this.context = context;
	this.position = new Vector3();
	this.quaternion = new Quaternion();
	this.worldUp = new Vector3();
	this.forward = new Vector3();
	this.up = new Vector3();
	this.right = new Vector3();
}

update() {
	this.context.camera.getWorldPosition(this.position);
	this.context.camera.getWorldQuaternion(this.quaternion);
	this.worldUp.set(0, 1, 0);
	this.up.set(0, 1, 0).applyQuaternion(this.quaternion);
	this.forward.set(0, 0, -1).applyQuaternion(this.quaternion);
	this.right.set(1, 0, 0).applyQuaternion(this.quaternion);
}
}

class Vector3Damper {
constructor(period) {
	this.period = period || 0.15;
	this._samples = [];
	this._total = new Vector3();
	this._average = new Vector3();
}

add(time, sample) {
	const removeSamplesBefore = time - this.period;
	while (this._samples.length && this._samples[0].time < removeSamplesBefore) {
	const s = this._samples.shift();
	this._total.x -= s.x;
	this._total.y -= s.y;
	this._total.z -= s.z;
	}
	this._total.x += sample.x;
	this._total.y += sample.y;
	this._total.z += sample.z;
	this._samples.push({ time: time, x: sample.x, y: sample.y, z: sample.z });
	const count = this._samples.length;
	this._average.set(this._total.x / count, this._total.y / count, this._total.z / count);
	return this._average;
}

get average() {
	return this._average;
}

clear() {
	this._samples = [];
	this._total.setScalar(0);
	this._average.setScalar(0);
}
}  

export default function Player(props) {
const [isModelLoaded, setIsModelLoaded] = useState(false);
const currentPlayerAvatarRef = useRef(null);
const playerControllerRef = useRef(null);
const playerMixerRef = useRef(null);
const { camera, gl } = useThree();

const isPresenting = props.isXRPresenting || false;
const xrOrigin = props.xrOrigin || undefined;
const xrOriginRef = props.xrOriginRef || undefined;

const [menuActive, setMenuActive] = useState(false);
const menuCursorPositionRef = useRef([0, 0, 0]);
const chatMessagesRef = useRef([]);
const prevPositionRef = useRef(null);
	const head = useRef(new XrHead(useThree()));
	const pointerOriginDamper = useRef(new Vector3Damper(DamperTimeS));
	const pointerDirectionDamper = useRef(new Vector3Damper(DamperTimeS));
	

const characterRef = useRef(null);
const rigidBodyRef = useRef(null);
const ecctrlRefInitialized = useRef(false);
const xrAvatarGroupRef = useRef(null);
const xrHeadToHipsOffset = useRef(0.45);
const xrLowerBodyIdleEnabled = useRef(true);
if (typeof window !== 'undefined') {
	window.__xrLowerBodyIdle = xrLowerBodyIdleEnabled;
}

// Stable ref callback to prevent repeated initializations
const handleEcctrlRef = useCallback((ref) => {
	characterRef.current = ref;
	if (ref && !ecctrlRefInitialized.current) {
		ecctrlRefInitialized.current = true;
		if (typeof ref.setTranslation === 'function') {
			rigidBodyRef.current = ref;
		} else if (ref.rapier && typeof ref.rapier.setTranslation === 'function') {
			rigidBodyRef.current = ref.rapier;
		} else if (ref.current && typeof ref.current.setTranslation === 'function') {
			rigidBodyRef.current = ref.current;
		} else if (ref.userData && ref.userData.rapierBody) {
			rigidBodyRef.current = ref.userData.rapierBody;
		}

		// STALE-SYNC GUARD: @react-three/rapier's useUpdateRigidBodyOptions snaps
		// the body back to matrixWorld on any watched prop change (wakeUp=FALSE).
		// Every legitimate teleport passes wakeUp=TRUE, so a large no-wake snap
		// is unambiguously that stale re-sync — block it.
		const body = rigidBodyRef.current;
		if (body && typeof body.setTranslation === 'function' && !body.__xrTeleportWrapped) {
			body.__xrTeleportWrapped = true;
			const origSetTranslation = body.setTranslation.bind(body);
			body.setTranslation = (v, wake) => {
				try {
					const cur = body.translation();
					const dx = ((v && v.x) || 0) - cur.x;
					const dz = ((v && v.z) || 0) - cur.z;
					if (dx * dx + dz * dz > 1600 && wake === false) {
						return undefined;
					}
				} catch (e) { /* body mid-teardown */ }
				return origSetTranslation(v, wake);
			};
		}
	}
}, []);

const frameNameRef = useRef(undefined);

const handleMenuStateChange = useCallback((active, position) => {
	setMenuActive(active);
	if (position) menuCursorPositionRef.current = position;
}, []);

const handleWorldCursorInteract = useCallback((data) => {
	window.dispatchEvent(new CustomEvent('worldCursorInteract', {
		detail: data
	}));
}, []);

const canMoveRef = useRef(true);
const spriteRef = useRef();
const animationsRef = useRef();
const playerModelRef = useRef();

const orbitRef = useRef();
const rigidRef = useRef();
const castRef = useRef();
const loaderIsGoneRef = useRef(false);
const [avatarIsSprite, setAvatarIsSprite] = useState(false);
const [avatarYOffset, setAvatarYOffset] = useState(-0.65); // Dynamic offset based on VRM dimensions

const isSwimmingRef = useRef(false);
const wasSwimmingRef = useRef(false);
const lastSplashTimeRef = useRef(0);
const swimTransitionRef = useRef(0);
const swimMoveBlendRef = useRef(0);

// Plugin-facing player state (rain drips, weather FX, cover gating). One
// persistent object mutated each frame (no per-frame GC); published as
// window.__xrPlayerState / XRPublisher.getPlayerState().
const shelteredRef = useRef(false);
const shelterCheckAccumRef = useRef(0);
const playerStateRef = useRef({ x: 0, y: 0, z: 0, yaw: 0, isSwimming: false, isFlying: false, sheltered: false });

const isFlyingRef = useRef(false);
// Riding a vehicle: when mounted, the player body is snapped to the seat the
// rideable publishes via the `rideSeat` module and normal locomotion is
// suppressed. `isRiding` (state) drives Ecctrl's `disableControl`; the ref is
// read each frame inside useFrame.
const isRidingRef = useRef(false);
const [isRiding, setIsRiding] = useState(false);
// Smooth 0→1 weight for the static seated driving pose (fades in on mount).
const drivingBlendRef = useRef(0);
// Smoothed steering signal while riding (−1 full left … +1 full right). Drives a
// very light shoulder tilt so the body reads as turning the wheel.
const rideSteerRef = useRef(0);
// Seconds of SUSTAINED forward driving. The chase-cam only swings behind the
// vehicle after this passes a commit delay, so the view stays cinematic (e.g.
// side-on) until the player clearly commits to driving forward (GTA-ish).
const rideForwardHoldRef = useRef(0);
// The rideable publishes the rider's FEET target; the capsule center sits this
// far above it (Ecctrl default capsule half-height — feet align to the bottom).
const RIDE_SEAT_CAPSULE_OFFSET = 0.85;
// Forward torso lean (rad) applied to the seated rider so they settle into the
// seat reaching toward the wheel. With this avatar/pose convention a NEGATIVE X
// rotation tilts the torso forward. Tune here; flip the sign to lean back.
const RIDE_SEAT_PITCH = -0.16;
const flyTransitionRef = useRef(0);
const wasFlyingRef = useRef(false);
const flyPoseTimeRef = useRef(FLY_POSE_TIME);
const isBoostingRef = useRef(false);
const autoLandFramesRef = useRef(0);
const flyBankAngleRef = useRef(0);
const flyBankTargetRef = useRef(0);

// ── Reusable temp objects to avoid per-frame GC allocations (critical for VR perf) ──
const _tmpVec3A = useRef(new Vector3());
const _tmpVec3B = useRef(new Vector3());
const _tmpVec3C = useRef(new Vector3());
const _tmpQuatA = useRef(new Quaternion());
const _tmpQuatB = useRef(new Quaternion());
const _tmpFlyVel = useRef(new Vector3());

// Jump state machine: 'grounded' | 'ascending' | 'falling' | 'landing'
const jumpStateRef = useRef('grounded');
const jumpHoldTimeRef = useRef(0); // Time spent at peak/falling
const hasDoubleJumpedRef = useRef(false);
const spaceWasPressedRef = useRef(false);
const interactWasPressedRef = useRef(false);
const flyButtonWasPressedRef = useRef(false);
// Edge-detect the mobile joystick interact button (button 3).
const interactButtonWasPressedRef = useRef(false);
// elapsedTime at which a grounded fly-button press engages fly (0 = none).
const pendingFlyEngageRef = useRef(0);
// Ecctrl's camera pivot (anonymous Object3D at the scene root) — found
// lazily, cached here. Used to turn the view from joystick lateral input.
const ecctrlPivotRef = useRef(null);

// Ride mount/dismount: drive Ecctrl disable + gravity from the rideStore.
// Mounting hands body control to the vehicle (snapped each frame in useFrame);
// dismounting restores gravity and steps the player off beside the seat.
useEffect(() => {
	const applyRide = (mounted) => {
		isRidingRef.current = mounted;
		setIsRiding(mounted);
		const cr = characterRef.current;
		if (!cr) return;
		try {
			if (mounted) {
				if (typeof cr.setGravityScale === 'function') cr.setGravityScale(0, true);
			} else {
				if (typeof cr.setGravityScale === 'function') cr.setGravityScale(1, true);
				// Teleport to the known-good exit the vehicle published (beside the
				// craft, on the terrain surface). rideSeat still holds it — the
				// vehicle clears the seat next frame. Fall back to the seat side
				// if no exit was set (e.g. a remote-driven edge case).
				let ex = rideSeat.ex, ey = rideSeat.ey, ez = rideSeat.ez;
				if (!ex && !ez) {
					const side = rideSeat.headingY + Math.PI / 2;
					ex = rideSeat.px + Math.sin(side) * 1.5;
					ez = rideSeat.pz + Math.cos(side) * 1.5;
					ey = rideSeat.py;
				}
				if (typeof cr.setTranslation === 'function') {
					cr.setTranslation({ x: ex, y: ey + RIDE_SEAT_CAPSULE_OFFSET + 0.3, z: ez }, true);
				}
				if (typeof cr.setLinvel === 'function') cr.setLinvel({ x: 0, y: 0, z: 0 }, true);
			}
		} catch (e) { /* physics not ready */ }
	};
	applyRide(useRideStore.getState().isMounted);
	const unsub = useRideStore.subscribe((s, prev) => {
		if (s.isMounted !== prev.isMounted) applyRide(s.isMounted);
	});
	return unsub;
}, []);

// Cursor system moved to separate WorldCursor component

const initializeAnimationSet = useGame(
	(state) => state.initializeAnimationSet
);
const animationSet = {
	idle: "idle",
	walk: "walking",
	run: "running",
	jump: "jump",
};

useEffect(() => {
	initializeAnimationSet(animationSet);
}, []);

useEffect(() => {
	const handleReady = () => {
	loaderIsGoneRef.current = true;
	removeEventListener('loaderIsGone', handleReady);
	};
	window.addEventListener('loaderIsGone', handleReady);
	const unregisterRespawn = registerRespawnMenuItem(props);
	return () => {
	window.removeEventListener('loaderIsGone', handleReady);
	unregisterRespawn();
	};
}, []);

// Base path for the seeded animation clips. Callers pass their asset root
// via threeObjectPluginRoot (must end with '/'); the fallback is the
// seeded-asset location the defaults-import mechanism serves from.
let assetBasePath = props.threeObjectPluginRoot || '/assets/defaults/';
if (!assetBasePath.endsWith('/')) assetBasePath += '/';

const idleFile = `${assetBasePath}avatars/friendly.fbx`;
const walkingFile = `${assetBasePath}avatars/walking.fbx`;
const runningFile = `${assetBasePath}avatars/Running.fbx`; 
const jumpFile = `${assetBasePath}avatars/Jump.fbx`;
const fallingFile = `${assetBasePath}avatars/falling.fbx`;
const swimIdleFile = `${assetBasePath}avatars/swim_idle.fbx`;
const swimFile = `${assetBasePath}avatars/swim.fbx`;
const drivingPoseFile = `${assetBasePath}avatars/drivingpose.glb`;
const spawnPoint = props.spawnPoint ? props.spawnPoint.map(Number) : [0, 5, 0];
const { scene, clock, camera: playerCamera } = useThree();
const { world, rapier } = useRapier();

// Ground snap and safe spawn computation. A REMOUNT restores the session
// position (see sessionPlayerPos) — the authored spawn only applies on the
// first mount of a page load.
const computedSpawnRef = useRef(sessionPlayerPos.valid
	? [sessionPlayerPos.x, sessionPlayerPos.y, sessionPlayerPos.z]
	: [spawnPoint[0], spawnPoint[1], spawnPoint[2]]);

// Ecctrl's rapier body position, FROZEN at mount (see the Ecctrl JSX note —
// post-mount value changes re-trigger rapier's options-sync snap-back).
const initialBodyPositionRef = useRef([
	Number(computedSpawnRef.current?.[0] ?? spawnPoint[0] ?? 0.1),
	Number(computedSpawnRef.current?.[1] ?? spawnPoint[1] ?? 0.1),
	Number(computedSpawnRef.current?.[2] ?? spawnPoint[2] ?? 0.1),
]);

// Terrain waiting is now handled by WaitForTerrain wrapper component
// Terrain checking now handled by WaitForTerrain wrapper

// ── Camera occlusion (rapier ray, replaces ecctrl camCollision) ─────────
// ecctrl's camCollision used a three.js Raycaster against a mesh list built
// by traversing scene.children ONCE at mount — it missed everything streamed
// in later (terrain chunks, plugin buildings) and paid per-triangle mesh
// scans. This is one BVH-accelerated rapier ray per frame (~µs) from the
// avatar pivot toward the camera, against FIXED non-sensor colliders only:
// terrain, mountains, building xrColliders, trunk capsules. Dynamic and
// kinematic bodies (the player capsule, NPCs, vehicles) never pull the
// camera in.
//
// Mechanism: CLAMP-ONLY. ecctrl re-lerps camera.position toward its ideal
// (unoccluded) followCam point every frame, so we never need to know or
// restore the ideal distance — we only pull the camera in front of the
// nearest hit after ecctrl's update. When the occluder clears, ecctrl's own
// camLerpMult easing glides the camera back out. The clamp moves the camera
// along the pivot→camera axis, which passes through ecctrl's lookAt target,
// so orientation stays valid without a second lookAt.
//
// Priority 0.5: after ecctrl's default-priority camera write, before
// FrameRateCap's render at priority 1 (contract: never call gl.render here).
const camOcclusionRayRef = useRef(null);
useFrame((state) => {
	if (state.gl?.xr?.isPresenting) return;
	const body = rigidBodyRef.current;
	if (!body || !world || !rapier || typeof body.translation !== 'function') return;
	const t = body.translation();
	__camOccPivot.set(t.x, t.y + CAM_OCCLUSION_PIVOT_LIFT, t.z);
	__camOccDir.copy(state.camera.position).sub(__camOccPivot);
	const camDist = __camOccDir.length();
	// Camera at/inside the pivot (menu mode pins it at -0.01) — nothing to do.
	if (camDist < CAM_OCCLUSION_MIN + 0.01) return;
	__camOccDir.multiplyScalar(1 / camDist);
	let ray = camOcclusionRayRef.current;
	if (!ray) {
		ray = camOcclusionRayRef.current = new rapier.Ray(
			{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }
		);
	}
	ray.origin.x = __camOccPivot.x; ray.origin.y = __camOccPivot.y; ray.origin.z = __camOccPivot.z;
	ray.dir.x = __camOccDir.x; ray.dir.y = __camOccDir.y; ray.dir.z = __camOccDir.z;
	const hit = world.castRay(
		ray,
		camDist,
		true,
		rapier.QueryFilterFlags.EXCLUDE_DYNAMIC
			| rapier.QueryFilterFlags.EXCLUDE_KINEMATIC
			| rapier.QueryFilterFlags.EXCLUDE_SENSORS,
	);
	if (hit && hit.timeOfImpact < camDist - 0.01) {
		const clamped = Math.max(hit.timeOfImpact - CAM_OCCLUSION_MARGIN, CAM_OCCLUSION_MIN);
		state.camera.position.copy(__camOccPivot).addScaledVector(__camOccDir, clamped);
	}
}, 0.5);

const getTerrainHeightAt = useCallback((x, z, fallbackY = 0) => {
	// Prefer the rapier collider — it's the exact surface the player physically
	// rests on (the proven path the vehicles use), so it avoids visual-vs-collider
	// mismatch and stale/missing chunk meshes that made the THREE raycast miss and
	// fall back to the authored Y (which buried the body). Exclude the player.
	try {
		if (world && rapier) {
			const ray = new rapier.Ray({ x, y: 2000, z }, { x: 0, y: -1, z: 0 });
			const excludeBody = (rigidBodyRef.current && typeof rigidBodyRef.current.handle !== 'undefined') ? rigidBodyRef.current : undefined;
				const hit = world.castRay(ray, 4000, true, undefined, undefined, undefined, excludeBody);
			if (hit) return 2000 - hit.timeOfImpact;
		}
	} catch (e) {}
	try {
		// Fallback: raycast the visual terrain meshes. The spawn (x,z) can be in
		// any chunk, so gather them all (raycasting only the first missed).
		const meshes = [];
		const legacy = scene && scene.getObjectByName && scene.getObjectByName('terrain');
		if (legacy) meshes.push(legacy);
		
		if (scene) {
			scene.traverse((child) => {
				if (child.isMesh && child.name && child.name.startsWith('terrain-chunk-')) {
					meshes.push(child);
				}
			});
		}
		
		if (meshes.length === 0) return fallbackY;
		const rc = new Raycaster();
		rc.set(new Vector3(x, 10000, z), new Vector3(0, -1, 0));
		const hits = rc.intersectObjects(meshes, true);
		if (hits && hits.length > 0) return hits[0].point.y;
	} catch (e) {}
	return fallbackY;
}, [scene, world, rapier]);

// Terrain detection now handled by WaitForTerrain wrapper

const computeSafeSpawn = useCallback(() => {
	const x = Number(spawnPoint[0]) || 0;
	const z = Number(spawnPoint[2]) || 0;
	const authoredY = Number(spawnPoint[1]) || 0;
	const groundY = getTerrainHeightAt(x, z, authoredY);
	// Never spawn below the terrain: sit a healthy margin above it, but keep an
	// intentionally-higher authored Y (e.g. a platform/rooftop).
	const y = Math.max(authoredY, groundY + SPAWN_GROUND_CLEARANCE);
	computedSpawnRef.current = [x, y, z];
}, [spawnPoint, getTerrainHeightAt]);

// Navmesh-based spawn relocation is STRICTLY ONE-SHOT. The NPC navmesh
// regenerates whenever the scene hash changes (streamed chunks, plugin
// decorations finishing their mounts, …) and NPCPathfinding fires
// 'navmeshReady' on EVERY rebuild — without these guards each rebuild yanked
// the player back to a random point in the navmesh bounds near the spawn
// area ("respawns at origin while flying far away, no error").
// Starts PRE-SATISFIED after a remount: the restored session position is the
// player's real place — no relocation may touch it.
const navmeshSpawnUsedRef = useRef(sessionPlayerPos.valid);
useEffect(() => {
	computeSafeSpawn();

	// Also wait for navmesh if available to pick a safer initial location
	const onNavmeshReady = () => {
		if (navmeshSpawnUsedRef.current) return;   // first navmesh only
		try {
			// Never relocate a player who has already LEFT the spawn area —
			// this event may only refine the INITIAL placement.
			const cr = characterRef.current;
			if (cr && typeof cr.translation === 'function') {
				const t = cr.translation();
				const [sx, , sz] = computedSpawnRef.current;
				if (Math.hypot(t.x - sx, t.z - sz) > 12) {
					navmeshSpawnUsedRef.current = true;
					return;
				}
			}
			// If an NPC navmesh exists, grab its bounds and pick a random point
			const navmeshObj = scene.getObjectByName('npcNavMesh');
			if (navmeshObj) {
				const bbox = new Box3().setFromObject(navmeshObj);
				const rx = bbox.min.x + Math.random() * (bbox.max.x - bbox.min.x);
				const rz = bbox.min.z + Math.random() * (bbox.max.z - bbox.min.z);
				const ry = getTerrainHeightAt(rx, rz, bbox.max.y);
				const ny = ry + SPAWN_GROUND_CLEARANCE;
				computedSpawnRef.current = [rx, ny, rz];
				navmeshSpawnUsedRef.current = true;
				// This IS the initial placement now — stop the hold-then-place
				// pin loop below, or its next tick would yank the player back
				// off the navmesh point.
				safeSpawnAppliedRef.current = true;
				if (characterRef.current) {
					characterRef.current.setTranslation(new Vector3(rx, ny, rz), true);
					// Reset Y position tracking after navmesh teleport
					lastYPositionInitializedRef.current = false;
					lastYPositionRef.current = null;
					hasInitializedPositionTracking.current = false;
					if (typeof characterRef.current.setBodyType === 'function') characterRef.current.setBodyType(rapier.RigidBodyType.Dynamic, 0);
					if (typeof characterRef.current.wakeUp === 'function') characterRef.current.wakeUp();
				}
			}
		} catch (e) {}
	}
	window.addEventListener('navmeshReady', onNavmeshReady);

	return () => {
		window.removeEventListener('navmeshReady', onNavmeshReady);
	}
}, [computeSafeSpawn, getTerrainHeightAt, scene]);

// Actually MOVE the body onto the terrain once both the terrain and the rapier
// body exist — the ONE initial-placement loop, and it covers BOTH spawn paths:
//
//   • authored spawn (fresh load): target = the world's spawn point;
//   • restored session (mid-session reload / remount): target = the player's
//     last heartbeat position. This path used to be PRE-SATISFIED ("the
//     restored position IS the placement") — which buried the player: the
//     WaitForTerrain gate only waits for the FIRST trimesh anywhere, so a
//     restored body far from origin mounted seconds before ITS chunk cooked,
//     fell under the world, and the terrain then streamed in above it.
//
// Until the ground under the TARGET is sampleable, the body is PINNED there
// every tick (position re-set + velocity zeroed) so gravity cannot carry it
// away while chunks stream in — the pin also keeps InfiniteTerrain queueing
// chunks around the target. Once ground exists, one final placement lifts the
// capsule safely above it (authored spawns get the full clearance; restored
// positions keep their real Y — max'd with a small clearance so a heartbeat
// taken mid-slope can't restore into the hillside).
const safeSpawnAppliedRef = useRef(false);
useEffect(() => {
	if (safeSpawnAppliedRef.current) return;
	let cancelled = false;
	const startedAt = Date.now();
	const restored = sessionPlayerPos.valid;
	const tx = restored ? sessionPlayerPos.x : (Number(spawnPoint[0]) || 0);
	const tz = restored ? sessionPlayerPos.z : (Number(spawnPoint[2]) || 0);
	const ty = restored ? sessionPlayerPos.y : (Number(spawnPoint[1]) || 0);
	const clearance = restored ? 1.0 : SPAWN_GROUND_CLEARANCE;
	const bodyFor = () => {
		const cr = characterRef.current;
		if (cr && typeof cr.setTranslation === 'function') return cr;
		const rb = rigidBodyRef.current;
		if (rb && typeof rb.setTranslation === 'function') return rb;
		return null;
	};
	const place = () => {
		if (cancelled || safeSpawnAppliedRef.current) return;
		const body = bodyFor();
		const groundY = getTerrainHeightAt(tx, tz, NaN); // NaN ⇒ no terrain yet
		if (isFinite(groundY) && body) {
			const y = Math.max(ty, groundY + clearance);
			computedSpawnRef.current = [tx, y, tz];
			try {
				body.setTranslation(new Vector3(tx, y, tz), true);
				if (typeof body.setLinvel === 'function') body.setLinvel({ x: 0, y: 0, z: 0 }, true);
				if (typeof body.wakeUp === 'function') body.wakeUp();
			} catch (e) { /* body not ready */ }
			safeSpawnAppliedRef.current = true;
			return;
		}
		// No ground under the target yet: hold the body AT the target so it
		// can't sink while terrain streams in. Bounded — a world that truly
		// never grows a collider here (pure-void plugin world) stops pinning
		// after 20s and behaves as before.
		if (body && Date.now() - startedAt < 20000) {
			try {
				body.setTranslation(new Vector3(tx, ty, tz), true);
				if (typeof body.setLinvel === 'function') body.setLinvel({ x: 0, y: 0, z: 0 }, true);
			} catch (e) { /* body not ready */ }
		}
		setTimeout(place, 150); // retry until terrain + body are ready
	};
	place();
	return () => { cancelled = true; };
}, [spawnPoint, getTerrainHeightAt]);

// Listen for portal teleport events
useEffect(() => {
	const handlePortalTeleport = (event) => {
		if (!event.detail) {
			console.warn('Portal teleport event missing detail');
			return;
		}
		// Wait a bit to ensure characterRef is ready
		let retryCount = 0;
		const maxRetries = 20;
		
		const attemptTeleport = () => {
			if (!characterRef.current) {
				if (retryCount < maxRetries) {
					retryCount++;
					setTimeout(attemptTeleport, 50);
				} else {
					console.error('characterRef.current is not available after max retries');
				}
				return;
			}
			
			const { x, y, z } = event.detail;
			// With an explicit Y (e.g. a known plaza ground height) skip the
			// terrain raycast — it can re-enter rapier's BVH at far/ungenerated
			// locations. Without one, the ground height is sampled in commit()
			// AFTER the preload has loaded the destination terrain (sampling here,
			// before preload, would read the not-yet-loaded ground and miss).
			const explicitY = event.detail.explicitY === true && Number.isFinite(y);
			
			// Try multiple ways to access the RigidBody
			let rigidBody = null;
			
			// Method 0: Use stored rigidBodyRef if available
			if (rigidBodyRef.current && typeof rigidBodyRef.current.setTranslation === 'function') {
				rigidBody = rigidBodyRef.current;
			}
			// Method 1: Direct access (Ecctrl should forward the ref)
			else if (typeof characterRef.current.setTranslation === 'function') {
				rigidBody = characterRef.current;
			}
			// Method 2: Access through rapier property
			else if (characterRef.current.rapier && typeof characterRef.current.rapier.setTranslation === 'function') {
				rigidBody = characterRef.current.rapier;
			}
			// Method 3: Access through rapier.current
			else if (characterRef.current.rapier?.current && typeof characterRef.current.rapier.current.setTranslation === 'function') {
				rigidBody = characterRef.current.rapier.current;
			}
			// Method 4: Access through current property (common pattern in react-three-rapier)
			else if (characterRef.current.current && typeof characterRef.current.current.setTranslation === 'function') {
				rigidBody = characterRef.current.current;
			}
			// Method 5: Find RigidBody through Rapier world by traversing scene
			else if (world && characterRef.current) {
				try {
					// Ecctrl wraps the RigidBody, try to find it in the scene
					const threeObject = characterRef.current;
					if (threeObject) {
						// Check if it's a Three.js object with a rapier body
						if (threeObject.userData && threeObject.userData.rapierBody) {
							rigidBody = threeObject.userData.rapierBody;
						}
						// Try to find RigidBody by traversing children
						else if (threeObject.children && threeObject.children.length > 0) {
							for (const child of threeObject.children) {
								if (child.userData && child.userData.rapierBody) {
									rigidBody = child.userData.rapierBody;
									break;
								}
							}
						}
					}
				} catch (e) {
					console.warn('Could not find RigidBody through scene traversal:', e);
				}
			}
			
			if (!rigidBody) {
				const refKeys = Object.keys(characterRef.current || {});
				console.error('Could not find RigidBody with setTranslation method', {
					characterRef: characterRef.current,
					hasSetTranslation: 'setTranslation' in (characterRef.current || {}),
					keys: refKeys,
					keyValues: refKeys.reduce((acc, key) => {
						acc[key] = typeof characterRef.current[key];
						return acc;
					}, {}),
					type: typeof characterRef.current,
					constructor: characterRef.current?.constructor?.name,
					hasRapier: 'rapier' in (characterRef.current || {}),
					rapierKeys: characterRef.current?.rapier ? Object.keys(characterRef.current.rapier).slice(0, 10) : null
				});
				
				// Last resort: Try to find RigidBody through Rapier world
				if (world && characterRef.current) {
					try {
						// Method: Get all RigidBodies and find the one that matches our character
						// Ecctrl creates a RigidBody, we need to find it
						const obj = characterRef.current;
						
						// Check if the ref itself has userData with rapier info
						if (obj.userData) {
							if (obj.userData.rapierBody) {
								rigidBody = obj.userData.rapierBody;
							} else if (obj.userData.rapierHandle !== undefined) {
								const body = world.getRigidBody(obj.userData.rapierHandle);
								if (body && typeof body.setTranslation === 'function') {
									rigidBody = body;
								}
							}
						}
						
						// If still not found, try to traverse the scene to find the RigidBody
						if (!rigidBody && scene) {
							// Ecctrl might store the RigidBody in the scene graph
							scene.traverse((child) => {
								if (child.userData && child.userData.rapierBody && typeof child.userData.rapierBody.setTranslation === 'function') {
									// Check if this is the character's RigidBody by checking if it's a child of our ref
									if (obj && (child === obj || obj.children.includes(child) || child.parent === obj)) {
										rigidBody = child.userData.rapierBody;
										return;
									}
								}
							});
						}
						
						// Final attempt: Use Rapier world to get all bodies and find the character's body
						// This is a bit of a hack but might work if Ecctrl doesn't expose the handle
						if (!rigidBody && world) {
							try {
								// Get the number of bodies and try to find the character's body
								// The character body should be dynamic and at a reasonable height
								const bodyCount = world.bodies.len();
								
								// Try to find by checking bodies near the current position
								// This is a fallback - ideally Ecctrl would expose the handle
								for (let i = 0; i < bodyCount; i++) {
									try {
										const body = world.getRigidBody(i);
										if (body && typeof body.setTranslation === 'function') {
											// Check if this might be the character (dynamic body)
											const bodyType = body.bodyType();
											if (bodyType === rapier.RigidBodyType.Dynamic) {
												// This could be our character - store it as a candidate
												// We'll use the first dynamic body we find as a last resort
												if (!rigidBody) {
													rigidBody = body;
												}
											}
										}
									} catch (e) {
										// Skip invalid handles
										continue;
									}
								}
							} catch (e) {
								console.warn('Error searching world bodies:', e);
							}
						}
					} catch (e) {
						console.warn('Error in last resort RigidBody search:', e);
					}
				}
				
				if (!rigidBody) {
					console.error('All methods failed to find RigidBody');
					return;
				}
			}
			
			// TWO-PHASE TELEPORT: load the destination terrain BEFORE moving the
			// player, so they never drop through un-generated terrain into the
			// water. Phase 1 (preload): the player stays put at the origin (still
			// grounded) while InfiniteTerrain streams the destination chunks
			// (camera-independent — the bottleneck was that streaming is driven by
			// camera.position, so we explicitly drive it at the destination). Phase
			// 2 (commit): once a real collider exists at the destination, move the
			// body + snap the camera there in one shot, onto real ground.
			//
			// "Can I stand at the destination yet?" — ask the PHYSICS world, not the
			// geometry map. The geometries Map retains stale entries after a chunk
			// unmounts (keyed differently from chunk records — see CLAUDE.md), so on
			// a repeat teleport it reports the destination "loaded" while no collider
			// is actually mounted → instant commit → fall into the water. A downward
			// rapier raycast at (x,z) returns finite ONLY when a real collider exists
			// there, which is exactly the condition for not falling.
			const groundReady = () => Number.isFinite(getTerrainHeightAt(x, z, NaN));

			try { window.dispatchEvent(new CustomEvent('xrTerrainPreload', { detail: { x, z } })); } catch (e) {}

			const startWait = performance.now();
			const commit = () => {
				try {
					// Resolve ground Y now that the destination terrain is loaded:
					// explicit Y as given, otherwise raycast the (now-present) terrain.
					const teleportY = explicitY ? y : (getTerrainHeightAt(x, z, y) + 1.0);
					rigidBody.setTranslation(new Vector3(x, teleportY, z), true);
					if (typeof rigidBody.setLinvel === 'function') rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
					// Snap the camera + ecctrl pivot to the destination (no lerp sweep).
					try {
						camera.position.set(x, teleportY + 6, z);
						if (ecctrlPivotRef.current && ecctrlPivotRef.current.position) {
							ecctrlPivotRef.current.position.set(x, teleportY, z);
						}
					} catch (e) {}
					lastYPositionInitializedRef.current = false;
					lastYPositionRef.current = null;
					hasInitializedPositionTracking.current = false;
					if (typeof rigidBody.setBodyType === 'function') rigidBody.setBodyType(rapier.RigidBodyType.Dynamic, 0);
					if (typeof rigidBody.wakeUp === 'function') rigidBody.wakeUp();
					// End preload: camera is now at the destination; resume the normal
					// camera-driven streamer (which evicts the origin chunks, paced).
					try { window.dispatchEvent(new CustomEvent('xrTerrainCommit', { detail: { x, z } })); } catch (e) {}
				} catch (error) {
					console.error('Error during teleport commit:', error);
				}
			};
			const waitForTerrain = () => {
				// Commit once a real collider exists at the destination (so the
				// player lands on solid ground), or after a 12s hard cap.
				const elapsed = performance.now() - startWait;
				if (groundReady() || elapsed > 12000) {
					commit();
				} else {
					setTimeout(waitForTerrain, 120);
				}
			};
			setTimeout(waitForTerrain, 120);
		};

		attemptTeleport();
	};
	
	window.addEventListener('portalTeleport', handlePortalTeleport);
	return () => {
		window.removeEventListener('portalTeleport', handlePortalTeleport);
	};
}, [getTerrainHeightAt, rapier, camera]);

// Ensure controller is awake and not sleeping on start
useEffect(() => {
    const t = setTimeout(() => {
        try {
            if (characterRef.current && rapier) {
                // Force dynamic body and wake it up
                if (typeof characterRef.current.setBodyType === 'function') {
                    characterRef.current.setBodyType(rapier.RigidBodyType.Dynamic, 0);
                }
                if (typeof characterRef.current.wakeUp === 'function') {
                    characterRef.current.wakeUp();
                }
                // Apply tiny upward nudge to avoid initial interpenetration
                if (typeof characterRef.current.applyImpulse === 'function') {
                    characterRef.current.applyImpulse({ x: 0, y: 0.01, z: 0 }, true);
                }
            }
        } catch (e) {}
    }, 50);
    return () => clearTimeout(t);
}, [rapier]);

// Set global scene reference for primitive generator
useEffect(() => {
    window.currentScene = scene;

    return () => {
        delete window.currentScene;
    };
}, [scene]);

// Shared AudioListener on the camera + one-time gesture unlock. Created ONCE for
// the whole world (THREE expects a single listener) so plugins can attach
// PositionalAudio that pans correctly — see XRPublisher.getAudioListener().
// Audio blocks reuse this too instead of each spawning their own listener.
useEffect(() => {
    if (!playerCamera) return;
    let listener = window.__xrAudioListener;
    if (!listener) {
        listener = new AudioListener();
        window.__xrAudioListener = listener;
    }
    if (listener.parent !== playerCamera) playerCamera.add(listener);
    const ctx = listener.context;
    const resume = () => { if (ctx && ctx.state === 'suspended') ctx.resume(); };
    // Browsers gate WebAudio until a user gesture — resume on the first one.
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    window.addEventListener('touchstart', resume);
    return () => {
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('keydown', resume);
        window.removeEventListener('touchstart', resume);
    };
}, [playerCamera]);

// Expose the active scene so plugins can mount world-space effects that follow
// the player (e.g. rain). The camera is NOT in the scene graph, so objects
// parented to the camera/listener don't render — plugins need the scene root.
// See XRPublisher.getScene().
useEffect(() => {
    if (!scene) return;
    window.__xrScene = scene;
    return () => { if (window.__xrScene === scene) delete window.__xrScene; };
}, [scene]);

// Expose the ground-height sampler (rapier raycast → terrain surface, the same
// path teleport uses) so plugins/the injected-model host can seat objects on the
// terrain instead of floating. Returns the world Y, or `fallbackY` if no hit yet
// (terrain colliders not loaded near that point).
useEffect(() => {
    window.__xrGetGroundHeight = (x, z, fallbackY = NaN) => getTerrainHeightAt(x, z, fallbackY);
    return () => { delete window.__xrGetGroundHeight; };
}, [getTerrainHeightAt]);

	// Set up global editor and character references for primitive generator integration
	useEffect(() => {
		// Set up global references that the primitive generator can use
		window.setupPrimitiveGeneratorContext = (editor, character) => {
			window.currentEditor = editor;
			window.currentCharacter = character;
		};
		
		// Cleanup function
		window.clearPrimitiveGeneratorContext = () => {
			delete window.currentEditor;
			delete window.currentCharacter;
		};
		
		
		return () => {
			delete window.setupPrimitiveGeneratorContext;
			delete window.clearPrimitiveGeneratorContext;
		};
	}, []);
const participantObject = scene.getObjectByName("playerOne");
const networkBridge = getNetworkBridge();
let debug   = {};

/**
 * Broadcast player state to peers via NetworkBridge.
 * Consolidates the repeated p2pcf broadcast pattern.
 * Uses binary encoding when WASM is available, falls back to legacy JSON.
 */
function broadcastPlayerState(action, hangtime = 0) {
	if (!window.p2pcf) return;
	const po = scene.getObjectByName("playerOne");
	if (!po) return;

	const worldPos = po.getWorldPosition(_tmpVec3A.current);
	// Build quaternion from body yaw + fly pitch/bank.
	// Add π to compensate for the remote participant's primitive rotation={[0, π, 0]}.
	const yaw = smoothedRotationRef.current + Math.PI;
	const pitch = isFlyingRef.current ? (po.rotation.x || 0) : 0;
	const bank = isFlyingRef.current ? flyBankAngleRef.current : 0;
	_tmpBroadcastEuler.current.set(pitch, yaw, bank, 'YXZ');
	_tmpQuatA.current.setFromEuler(_tmpBroadcastEuler.current);

	networkBridge.sendState({
		position: [worldPos.x, worldPos.y, worldPos.z],
		rotation: [_tmpQuatA.current.x, _tmpQuatA.current.y, _tmpQuatA.current.z, _tmpQuatA.current.w],
		action: action,
		hangtime: hangtime,
		isSwimming: isSwimmingRef.current,
		isFlying: isFlyingRef.current,
		isBoosting: isBoostingRef.current,
		swimBlend: swimMoveBlendRef.current,
		flyPoseTime: flyPoseTimeRef.current,
		// Desktop broadcasts declare inVR=0 — receivers clear any stale VR
		// hand/head pose left from a previous VR session.
		vrFlags: 0,
	}, userData);
}

/**
 * Broadcast a stop (idle) state to peers.
 */
function broadcastPlayerStop() {
	if (!window.p2pcf?.clientId) return;
	const po = scene.getObjectByName("playerOne");
	if (!po) return;

	const worldPos = po.getWorldPosition(_tmpVec3A.current);
	const stopYaw = smoothedRotationRef.current + Math.PI;
	const stopPitch = isFlyingRef.current ? (po.rotation.x || 0) : 0;
	const stopBank = isFlyingRef.current ? flyBankAngleRef.current : 0;
	_tmpBroadcastEuler.current.set(stopPitch, stopYaw, stopBank, 'YXZ');
	_tmpQuatA.current.setFromEuler(_tmpBroadcastEuler.current);

	networkBridge.sendState({
		position: [worldPos.x, worldPos.y, worldPos.z],
		rotation: [_tmpQuatA.current.x, _tmpQuatA.current.y, _tmpQuatA.current.z, _tmpQuatA.current.w],
		action: 'idle',
		hangtime: 0,
		isSwimming: isSwimmingRef.current,
		isFlying: isFlyingRef.current,
		isBoosting: isBoostingRef.current,
		swimBlend: swimMoveBlendRef.current,
		flyPoseTime: flyPoseTimeRef.current,
		// Desktop broadcasts declare inVR=0 — receivers clear any stale VR
		// hand/head pose left from a previous VR session.
		vrFlags: 0,
	}, userData);
}

let animationFiles = [idleFile, walkingFile, runningFile, jumpFile, swimIdleFile, swimFile];
// Participant VRM.
const fallbackURL = defaultVRM;
const defaultAvatarURL = props.defaultPlayerAvatar || defaultVRM;
let playerURL;
if(defaultAvatarURL){
	playerURL = defaultAvatarURL;
}

// Handle playerVRM - could be array or string
const playerVRMValue = Array.isArray(userData.playerVRM) ? userData.playerVRM[0] : userData.playerVRM;
playerURL = (!playerVRMValue || playerVRMValue === '') ? fallbackURL : (typeof userData.playerVRM === 'string' ? userData.playerVRM : playerVRMValue);

if( playerURL && typeof playerURL === 'string' && playerURL.endsWith( '.png' ) ){
	playerURL = blankVRM;
}

// if the playerURL ends in .png
useEffect(() => {
	const vrmValue = Array.isArray(userData.playerVRM) ? userData.playerVRM[0] : userData.playerVRM;
	if( vrmValue && vrmValue !== '' && typeof vrmValue === 'string' && vrmValue.endsWith( '.png' ) ){
		setAvatarIsSprite(true);
	}
}, []);

useEffect(() => {
	if (!currentPlayerAvatarRef.current) {
	const loader = new GLTFLoader();
	// const ktx2Loader = new KTX2Loader();
	// ktx2Loader.setTranscoderPath(props.threeObjectPluginRoot + "/inc/utils/basis/");
	// ktx2Loader.detectSupport(gl);
	// loader.setKTX2Loader(ktx2Loader);
	// const helperRoot = new Group();
	// helperRoot.renderOrder = 10000;
	// scene.add(helperRoot);
	// debug.pnt = new ShapePointsMesh();
	// debug.ln  = new DynLineMesh();
	// scene.add(debug.pnt);
	// scene.add(debug.ln);


	// Register VRM loader with appropriate material plugin based on renderer
	if (!props.useWebGLForXR) {
		loader.register((parser) => {
			const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser, {
			  materialType: MToonNodeMaterial,
			});
			return new VRMLoaderPlugin(parser, { mtoonMaterialPlugin });
		});
	} else {
		loader.register( parser => new VRMLoaderPlugin( parser ) );
	}

	loader.load(playerURL, (gltf) => {
		currentPlayerAvatarRef.current = gltf;
		playerControllerRef.current = gltf.userData.vrm;
	
		// Calculate the avatar's height offset
		const headBone = gltf.userData.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
		const headWorldPosition = new Vector3();
		headBone.getWorldPosition(headWorldPosition);
	
		const avatarWorldPosition = new Vector3();
		gltf.scene.getWorldPosition(avatarWorldPosition);
	
		props.avatarHeightOffset.current = headWorldPosition.y - avatarWorldPosition.y;
		
		// Calculate proper Y offset so the avatar's feet rest just above ground.
		// Ecctrl's floating spring rests the ground at -0.95 below the body
		// center (rayOriginOffest -0.35 + floatingDis 0.6, all defaults), so we
		// place the avatar's lowest point there (+buffer).
		//
		// IMPORTANT: use the lowest VISIBLE point (mesh bounding-box bottom), NOT
		// the foot BONE. The ankle/foot bone sits well above the sole, and that
		// gap varies per VRM rig — a bone-based offset subtracted that gap and
		// dropped some avatars' soles/toes to (or below) the ground, so they
		// clipped in. The bounding-box bottom is the true sole/toe height and is
		// rig-independent. This is purely the avatar's render offset — it does
		// NOT touch any collider/world physics.
		gltf.scene.updateMatrixWorld(true);
		let lowestFootY = 0;
		try {
			const bbox = new Box3().setFromObject(gltf.scene);
			if (isFinite(bbox.min.y)) lowestFootY = bbox.min.y;
		} catch (e) {
			// Fallback to foot bones if the bounding box can't be computed.
			const leftFoot = gltf.userData.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftFoot);
			const rightFoot = gltf.userData.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightFoot);
			if (leftFoot && rightFoot) {
				const leftFootPos = new Vector3();
				const rightFootPos = new Vector3();
				leftFoot.getWorldPosition(leftFootPos);
				rightFoot.getWorldPosition(rightFootPos);
				lowestFootY = Math.min(leftFootPos.y, rightFootPos.y);
			}
		}

		// offset = -0.95 - lowestVisibleY + buffer → net clearance on flat ground
		// is exactly footBuffer. The terrain collider is a full-res heightfield
		// matching the visual mesh, so only a small buffer is needed for sub-cell
		// interpolation differences and slopes. (This used to reference -0.85 —
		// a constant ~0.15 hover on top of the old decimated-collider error.)
		const capsuleBottomToGround = 0.95; // ecctrl resting ground below body center: rayOrigin(-0.35) + floatingDis(0.6)
		const footBuffer = 0.05; // clearance so feet stay above ground on uneven terrain
		const calculatedOffset = -capsuleBottomToGround - lowestFootY + footBuffer;

		setAvatarYOffset(calculatedOffset);

		const hipBone = gltf.userData.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Hips);
		if (hipBone && headBone) {
			const hipPos = new Vector3();
			hipBone.getWorldPosition(hipPos);
			xrHeadToHipsOffset.current = headWorldPosition.y - hipPos.y;
		}
		
		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				// Disable frustum culling so IK-driven hands/limbs aren't
				// clipped when they move outside the rest-pose bounding box.
				child.frustumCulled = false;
			}
		});

		// One-time VRM setup — moved here from loadMixamoAnimation, which used
		// to run these once PER animation (6×). rotateVRM0 orients VRM0 models;
		// removeUnnecessary* trims unused verts/joints. Must run once before any
		// animation retargeting (which happens after setIsModelLoaded triggers
		// the animation-loading effect). Doing it once removes a heavy,
		// repeated skeleton-rebuild that spiked memory during avatar load.
		VRMUtils.rotateVRM0(gltf.userData.vrm);
		VRMUtils.removeUnnecessaryVertices(gltf.userData.vrm.scene);
		VRMUtils.removeUnnecessaryJoints(gltf.userData.vrm.scene);

		setIsModelLoaded(true);
		markLoaded('avatar');
	}, undefined, error => {
		console.error('An error happened during the loading of the model:', error);
		// Still release the load overlay's avatar gate — a broken avatar URL
		// must not hold the world behind the loader.
		markLoaded('avatar');
	});
	}
}, [playerURL, gl]);

useEffect(() => {
	if (isModelLoaded && playerControllerRef.current) {
		const playerController = playerControllerRef.current;
		const animationsMixer = new AnimationMixer(playerController.scene);
		playerMixerRef.current = animationsMixer;
		playerController.scene.visible = false;

		const loadAnimationsStaggered = async () => {
			try {
				const idleAnim = await loadMixamoAnimation(idleFile, playerController);
				const idleAction = animationsMixer.clipAction(idleAnim);
				idleAction.timeScale = 1;
				idleAction.play();
				
				animationsRef.current = {
					idle: idleAction,
					walking: null,
					running: null,
					jump: null,
					swimIdle: null,
					swim: null,
					driving: null
				};
				
				playerController.scene.visible = true;
				
				await new Promise(r => setTimeout(r, isMobile ? 300 : 50));
				
				const walkAnim = await loadMixamoAnimation(walkingFile, playerController);
				const walkingAction = animationsMixer.clipAction(walkAnim);
				walkingAction.timeScale = 0;
				animationsRef.current.walking = walkingAction;
				
				await new Promise(r => setTimeout(r, isMobile ? 200 : 50));
				
				const runAnim = await loadMixamoAnimation(runningFile, playerController);
				const runningAction = animationsMixer.clipAction(runAnim);
				runningAction.timeScale = 0;
				animationsRef.current.running = runningAction;
				
				await new Promise(r => setTimeout(r, isMobile ? 200 : 50));
				
				const jumpAnim = await loadMixamoAnimation(jumpFile, playerController);
				const jumpingAction = animationsMixer.clipAction(jumpAnim);
				jumpingAction.timeScale = 0;
				animationsRef.current.jump = jumpingAction;
				
				if (!isMobile) {
					setupNaturalIdleSystem(idleAnim, idleAction, animationsMixer);
				}
				
				await new Promise(r => setTimeout(r, isMobile ? 300 : 100));
				
				const swimIdleAnim = await loadMixamoAnimation(swimIdleFile, playerController);
				const swimIdleAction = animationsMixer.clipAction(swimIdleAnim);
				swimIdleAction.setLoop(LoopRepeat);
				swimIdleAction.timeScale = 1;
				swimIdleAction.setEffectiveWeight(0);
				swimIdleAction.clampWhenFinished = false;
				swimIdleAction.play();
				animationsRef.current.swimIdle = swimIdleAction;
				
				await new Promise(r => setTimeout(r, isMobile ? 200 : 50));
				
				const swimAnim = await loadMixamoAnimation(swimFile, playerController);
				const swimAction = animationsMixer.clipAction(swimAnim);
				swimAction.setLoop(LoopRepeat);
				swimAction.timeScale = 1;
				swimAction.setEffectiveWeight(0);
				swimAction.clampWhenFinished = false;
				swimAction.play();
				animationsRef.current.swim = swimAction;

				await new Promise(r => setTimeout(r, isMobile ? 200 : 50));

				// Driving pose: a single static frame held while seated in a vehicle.
				// timeScale 0 freezes it at frame 0; weight is driven to full only
				// while riding (see the riding overlay in the mixer block).
				const drivingAnim = await loadMixamoAnimation(drivingPoseFile, playerController);
				const drivingAction = animationsMixer.clipAction(drivingAnim);
				drivingAction.setLoop(LoopRepeat);
				drivingAction.timeScale = 0;
				drivingAction.time = 0;
				drivingAction.setEffectiveWeight(0);
				drivingAction.clampWhenFinished = true;
				drivingAction.play();
				animationsRef.current.driving = drivingAction;

			} catch (error) {
				console.error('Error loading animations:', error);
			}
		};
		
		setTimeout(loadAnimationsStaggered, isMobile ? 100 : 0);
	}
}, [isModelLoaded]);

useEffect(() => {
	addHandRotationControls();
}, []);

// Shader prewarm once the local VRM is loaded. MToon materials from
// @pixiv/three-vrm-materials-mtoon compile lazily on first draw under
// WebGPU and the compile is heavy enough to drop a frame. Forcing the
// compile here — after the local avatar is in the scene graph — pushes
// that work out of the user's flight path. Also covers the case where
// the VRM takes longer to download than the top-level <ShaderPrewarm>'s
// fixed delay schedule. `compileAsync` is non-blocking and idempotent.
useEffect(() => {
	if (!isModelLoaded) return;
	const renderer = gl;
	if (!renderer || typeof renderer.compileAsync !== 'function') return;
	const t = setTimeout(() => {
		try {
			renderer.compileAsync(scene, camera).catch(() => {});
		} catch {
			// Scene might be tearing down — non-fatal.
		}
	}, 300);
	return () => clearTimeout(t);
}, [isModelLoaded, gl, scene, camera]);

// Cursor system moved to separate WorldCursor component

useEffect(() => {
	if (isPresenting) {
		// Stop non-idle/non-swim animations. Keep idle + breathing + swim running
		// so legs/feet have ambient movement (IK overrides upper body anyway).
		// Swim animations are kept alive at zero weight so they can be blended in
		// when the player enters water.
		if (animationsRef.current) {
			Object.entries(animationsRef.current).forEach(([name, action]) => {
				if (action && typeof action.stop === 'function' 
					&& name !== 'idle' && name !== 'swimIdle' && name !== 'swim') {
					action.stop();
				}
			});
		}
		if (animationsRef.current?.idle) {
			animationsRef.current.idle.setEffectiveWeight(xrLowerBodyIdleEnabled.current ? 0.4 : 0);
			animationsRef.current.idle.timeScale = 0.5;
			animationsRef.current.idle.play();
		}
		// Ensure swim animations are ready (weight=0 until water detected)
		if (animationsRef.current?.swimIdle) {
			animationsRef.current.swimIdle.setEffectiveWeight(0);
			animationsRef.current.swimIdle.play();
		}
		if (animationsRef.current?.swim) {
			animationsRef.current.swim.setEffectiveWeight(0);
			animationsRef.current.swim.play();
		}
		if (naturalIdleState.breathingAction) {
			naturalIdleState.breathingAction.setEffectiveWeight(xrLowerBodyIdleEnabled.current ? 0.15 : 0);
		}

		// Hide head bone so it doesn't block the first-person camera.
		// MUST use getRawBoneNode — the raw bone is what the mesh is skinned to.
		// getNormalizedBoneNode returns a separate invisible rig node that doesn't affect the visible mesh.
		if (playerControllerRef.current) {
			const rawHeadBone = playerControllerRef.current.humanoid?.getRawBoneNode(VRMHumanBoneName.Head);
			if (rawHeadBone) {
				rawHeadBone.scale.set(0.001, 0.001, 0.001);
			}
			if (playerControllerRef.current.lookAt) {
				playerControllerRef.current.lookAt.autoUpdate = false;
			}
			// Capture the VRM scene's current Y rotation (set by rotateVRM0 for VRM0 models = PI,
			// or 0 for VRM1). This is needed to compute the correct group rotation.
			_ikVrmBaseYaw.current = playerControllerRef.current.scene.rotation.y;
			// Reset scene rotation to identity — the parent group will handle facing direction,
			// and bones will handle head-look. This prevents double-rotation issues.
			playerControllerRef.current.scene.rotation.set(0, 0, 0);
		}
		_ikLeftArmBlend.current = 1;
		_ikRightArmBlend.current = 1;
		_ikSpineRestCaptured.current = false;
		_ikNeckRestCaptured.current = false;
		_ikHeadRestCaptured.current = false;
		_ikBodyYawInitialized.current = false;
		// Reset finger calibration so it recaptures on next XR session
		_fingerCalibrated.current = false;
		_fingerCalibrationLeft.current = null;
		_fingerCalibrationRight.current = null;
		_leftHandWasPresent.current = false;
		_rightHandWasPresent.current = false;
	}

	return () => {
		if (playerControllerRef.current) {
			const rawHeadBone = playerControllerRef.current.humanoid?.getRawBoneNode(VRMHumanBoneName.Head);
			if (rawHeadBone) {
				rawHeadBone.scale.set(1, 1, 1);
			}
			if (playerControllerRef.current.lookAt) {
				playerControllerRef.current.lookAt.autoUpdate = true;
			}
			// Restore VRM scene rotation for non-XR mode
			playerControllerRef.current.scene.rotation.y = _ikVrmBaseYaw.current;
		}
	};
}, [isPresenting]);

let lastUpdateTime = 0;
let blinkTimer = 0;
let blinkInterval = getRandomBlinkInterval();

function getRandomBlinkInterval() {
	return 5 + Math.random() * 10;
}

function handleBlinking(delta) {
	blinkTimer += delta;
	if (blinkTimer > blinkInterval && playerControllerRef.current) {
	performBlink(playerControllerRef.current);
	blinkTimer = 0;
	blinkInterval = getRandomBlinkInterval();
	}
}

function performBlink(vrm) {
	const blinkDuration = 0.05 + Math.random() * 0.1;
	const steps = Math.round(blinkDuration / 0.01);

	for (let i = 0; i <= steps; i++) {
	const s = i / steps;
	setTimeout(() => {
		vrm.expressionManager.setValue('blinkLeft', s);
		vrm.expressionManager.setValue('blinkRight', s);
	}, s * blinkDuration * 1000);
	}

	setTimeout(() => {
	for (let i = 0; i <= steps; i++) {
		const s = 1 - i / steps;
		setTimeout(() => {
		vrm.expressionManager.setValue('blinkLeft', s);
		vrm.expressionManager.setValue('blinkRight', s);
		}, (1 - s) * blinkDuration * 1000);
	}
	}, blinkDuration * 1000 + 200);
}

const movementTimeoutRef = useRef(null);
const lastNetworkUpdateTimeRef = useRef(0);
const isMovingRef = useRef(false);
// Single source of truth for the broadcast action + hangtime + cadence.
// (The previous `let countHangtime/wasJumping/lastKeyPressTime` bindings
// lived in the component body and silently reset on every re-render.)
const localActionStateRef = useRef(new LocalActionState());
let wasFalling = false;
const lastYPositionRef = useRef(null);
const lastYPositionInitializedRef = useRef(false);
const hasInitializedPositionTracking = useRef(false); // Track if we've done initial position setup
const avatarRotationOffsetRef = useRef(0);
const smoothedRotationRef = useRef(0);
// GTA-style aim overlay (XRPublisher.setAimTarget): eased blend + the last
// target held through the release fade-out.
const aimBlendRef = useRef(0);
const aimLastTargetRef = useRef(null);
const prevCameraYawRef = useRef(0);
const cameraYawVelocityRef = useRef(0);

// Track last pressed key for conflict resolution (A+D, W+S)
const lastHorizontalKeyRef = useRef(null); // 'left' or 'right'
const lastVerticalKeyRef = useRef(null); // 'forward' or 'backward'
const prevKeysRef = useRef({ forward: false, backward: false, left: false, right: false });

// Natural idle animation state for human-like behavior
const naturalIdleState = {
	targetTime: 0,
	currentTime: 0,
	transitionSpeed: 1.2,
	nextTransitionIn: 1.5 + Math.random() * 2,
	transitionTimer: 0,
	isTransitioning: false,
	animationDuration: 0,
	// Natural movement constraints
	preferredRange: { min: 0, max: 0 },
	// Dynamic movement properties
	baseSpeed: 1.2,
	currentSpeed: 1.2,
	speedVariation: 0,
	microAdjustmentTimer: 0,
	nextMicroAdjustment: 0.5 + Math.random() * 1.5,
	// Smooth blending system
	previousTime: 0,
	blendFactor: 0,
	transitionDuration: 0,
	transitionElapsed: 0,
	// Jitter prevention
	shortMovementSkips: 0,
	closenessThreshold: 0.08,
	// Animation layers
	breathingAction: null,
	poseAction: null,
	breathingWeight: 0.15,
	poseWeight: 0.85,
	// Idle system enabled flag
	enabled: false
};

// Set up natural idle animation system
function setupNaturalIdleSystem(animationClip, idleAction, mixer) {
	if (!animationClip || !idleAction || !mixer) return;
	
	
	// Create two separate actions from the same clip
	// 1. Breathing layer - continuously playing at low weight
	const breathingAction = mixer.clipAction(animationClip.clone());
	breathingAction.setLoop(LoopRepeat);
	breathingAction.weight = naturalIdleState.breathingWeight;
	breathingAction.play();
	naturalIdleState.breathingAction = breathingAction;
	
	// 2. Pose layer - frozen poses at high weight (use existing idle action)
	idleAction.setLoop(LoopRepeat);
	idleAction.weight = naturalIdleState.poseWeight;
	idleAction.timeScale = 0; // Freeze this action - we'll control time manually
	naturalIdleState.poseAction = idleAction;
	
	// Store animation duration for random sampling
	naturalIdleState.animationDuration = animationClip.duration;
	
	// Set preferred range to middle 60% of animation (more natural poses)
	const middleStart = animationClip.duration * 0.2;
	const middleEnd = animationClip.duration * 0.8;
	naturalIdleState.preferredRange = { min: middleStart, max: middleEnd };
	
	// Start with a random pose in preferred range
	const initialTime = middleStart + Math.random() * (middleEnd - middleStart);
	naturalIdleState.targetTime = initialTime;
	naturalIdleState.currentTime = initialTime;
	
	// Set initial pose time
	idleAction.time = initialTime;
	
	// Enable the system
	naturalIdleState.enabled = true;
	
}

// Update natural idle animation for human-like behavior
function updateNaturalIdleAnimation(delta) {
	if (!naturalIdleState.enabled || !naturalIdleState.poseAction) return;
	
	const state = naturalIdleState;
	
	// Update timers
	state.microAdjustmentTimer += delta;
	state.transitionElapsed += delta;
	
	// Dynamic speed variations for organic feel
	if (state.microAdjustmentTimer >= state.nextMicroAdjustment) {
		// Add subtle speed variations (0.8x to 1.8x base speed)
		state.speedVariation = 0.8 + Math.random() * 1.0;
		state.currentSpeed = state.baseSpeed * state.speedVariation;
		
		// Reset micro-adjustment timer with random interval
		state.microAdjustmentTimer = 0;
		state.nextMicroAdjustment = 0.3 + Math.random() * 2.0;
	}
	
	// Start new transition if not currently transitioning
	if (!state.isTransitioning) {
		// Pick target in preferred range with center bias for more natural movement
		const { min, max } = state.preferredRange;
		const rangeSize = max - min;
		
		// Store current position as previous for smooth blending
		state.previousTime = state.currentTime;
		
		// Use center bias approach for more random, less predictable movement
		let newTarget;
		const centerBias = 0.3; // 30% bias toward center of range
		if (Math.random() < centerBias) {
			// Bias toward center third of animation (most natural poses)
			const centerStart = min + rangeSize * 0.35;
			const centerEnd = min + rangeSize * 0.65;
			newTarget = centerStart + Math.random() * (centerEnd - centerStart);
		} else {
			// Random position anywhere in preferred range
			newTarget = min + Math.random() * rangeSize;
		}
		
		// Clamp to preferred range
		newTarget = Math.max(min, Math.min(max, newTarget));
		
		// Check if this movement is too close (jitter prevention)
		const distance = Math.abs(newTarget - state.currentTime);
		const normalizedDistance = distance / rangeSize;
		
		// Skip this movement if it's too close AND we haven't skipped two yet
		if (normalizedDistance < state.closenessThreshold && state.shortMovementSkips < 2) {
			// Increment skip counter
			state.shortMovementSkips++;
			
			// Reset transition timer to try again soon
			state.transitionElapsed = -(0.1 + Math.random() * 0.3);
			return;
		}
		
		// If we get here, either the movement is long enough OR we've already skipped two
		// Reset the skip counter if this is a longer movement
		if (normalizedDistance >= state.closenessThreshold) {
			state.shortMovementSkips = 0;
		}
		
		// Calculate transition duration based on distance and current speed
		state.transitionDuration = (distance / state.currentSpeed) + 1.0;
		state.transitionDuration = Math.max(0.8, Math.min(state.transitionDuration, 4.0));
		
		// Start transition
		state.targetTime = newTarget;
		state.blendFactor = 0;
		state.transitionElapsed = 0;
		state.isTransitioning = true;
	}
	
	// Smooth sine wave blending between poses
	if (state.isTransitioning) {
		// Calculate blend progress (0 to 1)
		const progress = Math.min(state.transitionElapsed / state.transitionDuration, 1);
		
		// Calculate distance for adaptive easing
		const totalDistance = Math.abs(state.targetTime - state.previousTime);
		const rangeSize = state.preferredRange.max - state.preferredRange.min;
		const normalizedDistance = totalDistance / rangeSize;
		
		// Apply distance-adaptive easing for natural flow
		let easedProgress;
		if (normalizedDistance < 0.1) {
			// Very short movements: Use extra gentle easing
			const gentleProgress = progress * progress * (3 - 2 * progress);
			easedProgress = gentleProgress;
		} else if (normalizedDistance < 0.3) {
			// Medium movements: Blend between gentle and sine wave
			const gentleProgress = progress * progress * (3 - 2 * progress);
			const sineProgress = (Math.sin((progress - 0.5) * Math.PI) + 1) / 2;
			const blendFactor = (normalizedDistance - 0.1) / 0.2;
			easedProgress = gentleProgress * (1 - blendFactor) + sineProgress * blendFactor;
		} else {
			// Long movements: Use full sine wave for natural flow
			easedProgress = (Math.sin((progress - 0.5) * Math.PI) + 1) / 2;
		}
		
		// Add subtle organic variation to the easing
		const organicVariation = Math.sin(state.transitionElapsed * 3) * 0.01;
		const finalProgress = Math.max(0, Math.min(1, easedProgress + organicVariation));
		
		// Blend between previous and target poses
		state.blendFactor = finalProgress;
		state.currentTime = state.previousTime + (state.targetTime - state.previousTime) * state.blendFactor;
		
		// Adaptive completion threshold based on distance
		const completionThreshold = Math.max(0.92, 1 - normalizedDistance * 0.05);
		
		// Check if transition is complete
		if (progress >= completionThreshold) {
			state.currentTime = state.targetTime;
			state.blendFactor = 1;
			state.isTransitioning = false;
			
			// Add brief pause at target for natural rhythm
			const pauseDuration = Math.max(0.1, normalizedDistance * 0.8);
			state.transitionElapsed = -(0.2 + Math.random() * pauseDuration);
		}
		
		// Clamp within preferred range
		const { min, max } = state.preferredRange;
		state.currentTime = Math.max(min, Math.min(max, state.currentTime));
	}
	
	// Update the frozen pose layer to our calculated position
	if (state.poseAction) {
		state.poseAction.time = state.currentTime;
	}
}

useEffect(() => {
	isMovingRef.current = false;
}, []);
// isJumping now handled by jumpStateRef
const getJoystickValues = useJoystickControls(
	(state) => state.getJoystickValues
);
const playerForward = new Vector3(0, 0, 1);

	useFrame((state, delta) => {
		// Expose the player's rapier body so rideables can exclude it from their
		// downward ground-ray (otherwise a seated rider's capsule is what the
		// ray hits, and the vehicle chases the player upward forever).
		if (characterRef.current && typeof window !== 'undefined') {
			window.__playerRigidBody = characterRef.current;
		}
		if (isPresenting) {
			handleBlinking(delta);
			// Always update the animation mixer in XR mode so that lower-body
			// animations (idle legs, swim kick) continue playing. IK overrides upper body.
			if (playerMixerRef.current) {
				playerMixerRef.current.update(delta);
			}
			return;
		}
		
		const joystickValues = getJoystickValues();
		let forward = props.movement.current.forward;
		let backward = props.movement.current.backward;
		let left = props.movement.current.left;
		let right = props.movement.current.right;
		let shift = props.movement.current.shift;
		let space = props.movement.current.space;
		let interact = props.movement.current.interact;
		let fly = props.movement.current.fly;
		isFlyingRef.current = fly;
		if (typeof window !== 'undefined') window.__playerFlying = fly;

		// ── Riding a vehicle ──
		// Snap the body to the seat the rideable publishes, suppress flight,
		// and zero locomotion inputs so the rest of useFrame idles (animation,
		// springs, and the network broadcast still run, reporting the seat
		// position so peers see us seated). Ecctrl is also disabled via the
		// `isRiding` prop, so nothing fights the per-frame setTranslation.
		if (isRidingRef.current && rideSeat.active && characterRef.current) {
			const cr = characterRef.current;
			try {
				if (typeof cr.setTranslation === 'function') {
					// rideSeat px/py/pz is the BODY-CENTER target (the capsule
					// center), so the avatar sits centered inside the vehicle volume
					// rather than standing on top of it. No capsule offset here.
					cr.setTranslation({ x: rideSeat.px, y: rideSeat.py, z: rideSeat.pz }, true);
				}
				if (typeof cr.setLinvel === 'function') {
					cr.setLinvel({ x: 0, y: 0, z: 0 }, true);
				}
				if (typeof cr.setGravityScale === 'function') {
					cr.setGravityScale(0, true);
				}
			} catch (e) { /* physics not ready */ }
			smoothedRotationRef.current = rideSeat.headingY;
			if (playerControllerRef.current?.scene) {
				const av = playerControllerRef.current.scene;
				av.rotation.order = 'YXZ';
				// roll (Z) leans the rider with the vehicle — non-zero only on
				// motorcycles; 0 keeps cars/boats/etc. upright.
				// LEAN — leave this exactly as-is (attachment that tracks the bike).
				av.rotation.set(RIDE_SEAT_PITCH, rideSeat.headingY, rideSeat.roll || 0);
				{
					const ry = avatarYOffset;
					const rr = rideSeat.roll || 0;
					const sr = Math.sin(rr);
					const hY = rideSeat.headingY;
					av.position.set(-ry * sr * Math.cos(hY), ry * Math.cos(rr), ry * sr * Math.sin(hY));
				}
			}
			// NOTE: input is captured into `rideInput` and zeroed AFTER the
			// joystick block below — the joystick resolves forward/back/turn
			// there, and the vehicle needs that on mobile.
		}

		// Riding a non-flying vehicle (car/bike/animal/boat/hover/rails): the
		// camera should chase BEHIND the vehicle's heading so "forward" always
		// matches what you're looking at. Flying is excluded — it steers BY the
		// camera, so the manual look stays. While ground-riding, the joystick
		// lateral steers the wheels instead of panning the camera.
		// Only the DRIVER gets the chase-cam + joystick-steer diversion. Passengers
		// ride along with a free look camera.
		const rideGroundCam = isRidingRef.current
			&& useRideStore.getState().role === 'driver'
			&& useRideStore.getState().vehicleType
			&& useRideStore.getState().vehicleType !== 'flying';

	if (joystickValues) {
		// joystickTankControls.ts reshapes touch input before it reaches the
		// store: the angle is snapped to PI/2 (up) or 3PI/2 (down) and the
		// lateral component is diverted into joystickTurn — the stick can no
		// longer produce strafe input, only forward/backward + view turn.
		const joyAng = joystickValues.joystickAng;
		const joyDis = joystickValues.joystickDis;

		// Only process if joystick is moved beyond dead zone
		if (joyDis > 10) {
			// Sprint on a hard push. runState covers diagonal pushes whose
			// longitudinal component alone stays under the 60px threshold.
			if (joyDis > 60 || joystickValues.runState) {
				shift = true;
			}
			if (Math.sin(joyAng) > 0) {
				forward = true;
			} else {
				backward = true;
			}
		}

		// Lateral deflection turns the view: rotate Ecctrl's camera pivot.
		// The pivot is an anonymous Object3D ecctrl adds at the scene root
		// with the followCam as its only child; the camera lerps to the
		// followCam's world position every frame, which is the fingerprint
		// used to find it (then cached).
		const turn = joystickTurn.value;
		if (turn !== 0 && !rideGroundCam) {
			let pivot = ecctrlPivotRef.current;
			if (!pivot || pivot.parent !== state.scene) {
				pivot = null;
				for (const child of state.scene.children) {
					if (child.type !== 'Object3D' || child.children.length !== 1) continue;
					const followCam = child.children[0];
					if (followCam.type !== 'Object3D') continue;
					followCam.getWorldPosition(_tmpVec3A.current);
					if (_tmpVec3A.current.distanceToSquared(state.camera.position) < 9) {
						pivot = child;
						break;
					}
				}
				ecctrlPivotRef.current = pivot;
			}
			if (pivot) {
				pivot.rotation.y -= turn * JOYSTICK_TURN_SPEED * delta;
			}
		}

		if (joystickValues.button1Pressed === true) {
			space = true;
		}
		// Fly button (button2). Toggling fly while grounded is a no-op — the
		// auto-land check cancels it within 3 frames while the capsule still
		// touches the ground — so a grounded press triggers a real jump first
		// (through Ecctrl's button1 path, which also plays the jump animation)
		// and fly engages once airborne.
		if (joystickValues.button2Pressed === true && !flyButtonWasPressedRef.current) {
			if (props.movement.current.fly) {
				props.movement.current.fly = false;
				pendingFlyEngageRef.current = 0;
			} else if (pendingFlyEngageRef.current > 0) {
				// Second tap during the takeoff hop — cancel the pending fly.
				useJoystickControls.getState().releaseAllButtons();
				pendingFlyEngageRef.current = 0;
			} else if (characterRef.current?.userData?.canJump) {
				useJoystickControls.getState().pressButton1();
				pendingFlyEngageRef.current = state.clock.elapsedTime + FLY_BUTTON_JUMP_DELAY;
			} else {
				props.movement.current.fly = true;
			}
		}
		flyButtonWasPressedRef.current = joystickValues.button2Pressed === true;

		if (pendingFlyEngageRef.current > 0 && state.clock.elapsedTime >= pendingFlyEngageRef.current) {
			pendingFlyEngageRef.current = 0;
			useJoystickControls.getState().releaseAllButtons();
			props.movement.current.fly = true;
		}

		// Button 3 = interact: the mobile equivalent of E. It NEVER triggers the
		// generic cursor interact (that opens the unfinished world-action menu):
		// it only acts when something is actually interactable.
		//
		// A plugin interactable is fired DIRECTLY, not by synthesising a KeyE.
		// The synthetic-keyboard route worked for NPCs and vehicles, which own
		// their own KeyE handlers, but for plugin interactables it made the
		// press depend on a chain of things a plugin author cannot see or
		// influence: InteractableSystem mirroring the active entry onto
		// `worldCursorAPI.hoveredInteractable`, that mirror surviving whatever
		// else writes to the cursor API, a synthetic KeyboardEvent reaching a
		// DOM listener, and no other KeyE handler getting there first. Any link
		// failing produced the same silent symptom: the prompt and the button
		// both appear, and pressing does nothing.
		//
		// The registry is the source of truth for what is in range, so ask it
		// and call the callback. Fewer moving parts than the thing it replaces,
		// and it cannot drift out of sync with the prompt the player is reading
		// because both now come from the same place.
		if (joystickValues.button3Pressed === true && !interactButtonWasPressedRef.current) {
			const api = typeof window !== 'undefined' ? window.worldCursorAPI : null;
			if (useRideStore.getState().isMounted) {
				useRideStore.getState().dismount();
			} else if (getActiveInteractable()) {
				triggerActiveInteractable();
			} else if (api?.hoveredRideable || api?.hoveredNPC) {
				// NPCs and vehicles keep the synthetic key: their handlers are
				// keyboard-driven and live in their own components.
				window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' }));
				window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e' }));
			}
			// else: do nothing — never open the world menu.
		}
		interactButtonWasPressedRef.current = joystickValues.button3Pressed === true;
	}

	// While riding, hand the resolved control intent (keyboard AND joystick) to
	// the vehicle via rideInput, then idle the player's own locomotion. Steering
	// on mobile comes from the joystick's lateral turn (tank-controls diverts it
	// to joystickTurn, so `left`/`right` locals are keyboard-only).
	if (isRidingRef.current) {
		// Only the DRIVER feeds the vehicle's controls; a passenger's keys/joystick
		// must not steer. Both roles still suppress walk/fly below (they're seated).
		if (useRideStore.getState().role === 'driver') {
			const STEER_DEAD = 0.05;
			// Proportional, clamped steering. Keyboard is ±1 (full lock, on/off); the
			// mobile joystick contributes its analog lateral deflection (already
			// deadzoned + clamped to ±1 by tank-controls) so a small lean = a small
			// turn instead of snapping to full lock. Clamp so the combined value can
			// never exceed the desktop maximum.
			const kbSteer = (right ? 1 : 0) - (left ? 1 : 0);
			const joySteer = Math.abs(joystickTurn.value) > STEER_DEAD ? joystickTurn.value : 0;
			let steerAxis = kbSteer + joySteer;
			steerAxis = steerAxis < -1 ? -1 : steerAxis > 1 ? 1 : steerAxis;
			const steerLeft = steerAxis < -STEER_DEAD;
			const steerRight = steerAxis > STEER_DEAD;
			setRideInput({
				forward,
				backward,
				left: steerLeft,
				right: steerRight,
				up: space,
				down: shift,
				steerAxis,
			});
			// Smooth the analog steer signal for the proportional shoulder tilt.
			rideSteerRef.current += (steerAxis - rideSteerRef.current) * Math.min(1, delta * 4);
		}
		forward = backward = left = right = false;
		space = false; shift = false; fly = false;
		isFlyingRef.current = false;
		if (props.movement.current) props.movement.current.fly = false;
		if (typeof window !== 'undefined') window.__playerFlying = false;
	}

	isBoostingRef.current = shift;

	const interactJustPressed = interact && !interactWasPressedRef.current;
	interactWasPressedRef.current = interact;
	
	if (interactJustPressed) {
		window.dispatchEvent(new CustomEvent('mobileInteract'));
	}

	// Update camera head tracking for proper forward direction calculation
	if (head.current) {
		head.current.update();
	}

	// Track how long forward has been held continuously (the camera-commit timer).
	// Any release/stop resets it, so the swing-behind only triggers on a clear,
	// sustained commit to driving forward — not on a tap.
	const FORWARD_COMMIT_DELAY = 3.0; // s of sustained forward before the camera centers
	if (rideGroundCam && rideInput.forward) {
		rideForwardHoldRef.current = Math.min(FORWARD_COMMIT_DELAY + 1, rideForwardHoldRef.current + delta);
	} else {
		rideForwardHoldRef.current = 0;
	}

	// Chase-cam for ground vehicles: rotate the orbit pivot so the camera looks
	// along the vehicle's forward heading. It only engages AFTER the commit delay
	// (cinematic side views stay put until then), then smoothly swings behind and
	// holds there while forward is sustained. Stopped/reversing leaves the manual
	// view alone.
	if (rideGroundCam && head.current) {
		let pivot = ecctrlPivotRef.current;
		if (!pivot || pivot.parent !== state.scene) {
			pivot = null;
			for (const child of state.scene.children) {
				if (child.type !== 'Object3D' || child.children.length !== 1) continue;
				const followCam = child.children[0];
				if (followCam.type !== 'Object3D') continue;
				followCam.getWorldPosition(_tmpVec3A.current);
				if (_tmpVec3A.current.distanceToSquared(state.camera.position) < 9) {
					pivot = child;
					break;
				}
			}
			ecctrlPivotRef.current = pivot;
		}
		if (pivot) {
			// Car forward yaw (rideSeat.headingY is vs.yaw + π).
			const carYaw = rideSeat.headingY - Math.PI;
			const camFwd = head.current.forward;
			const camYaw = Math.atan2(camFwd.x, camFwd.z);
			let err = carYaw - camYaw;
			err = Math.atan2(Math.sin(err), Math.cos(err)); // wrap to [-π,π]
			// Increasing pivot.y turns the view toward +yaw here; with `+=` the
			// stable point is the car's heading (the `-=` form settled at the
			// polar-opposite heading — backwards). Gated by the commit timer so the
			// view holds (side-on, etc.) until forward is sustained past the delay.
			const committed = rideForwardHoldRef.current >= FORWARD_COMMIT_DELAY;
			const strength = committed ? Math.min(1, delta * 3) : 0;
			pivot.rotation.y += err * strength;
		}
	}

	if (playerControllerRef.current) {
		playerControllerRef.current.update(delta);
	}

	// Update MToon materials if present (for WebGL mode with MToonMaterialLoaderPlugin)
	if (currentPlayerAvatarRef.current && currentPlayerAvatarRef.current.userData.vrmMToonMaterials) {
		const mtoonMaterials = currentPlayerAvatarRef.current.userData.vrmMToonMaterials;
		for (const material of mtoonMaterials) {
			material.update(delta);
		}
	}
	
	// Swimming detection: check if player is at or below water level
	const waterLevel = props.waterLevel !== undefined ? props.waterLevel : -12;
	const swimThreshold = waterLevel + 0.8;
	let playerY = 0;
	
	if (characterRef.current && characterRef.current.translation) {
		try {
			const translation = characterRef.current.translation();
			playerY = translation.y;
		} catch (e) {
			playerY = 0;
		}
	}
	
	// Swim detection: now works everywhere including caverns (no more suppression)
	const shouldSwim = !fly && playerY <= swimThreshold && playerY > waterLevel - 20;
	isSwimmingRef.current = shouldSwim;

	// Publish player state for plugins (rain drips, weather FX). The avatar is in
	// the scene as "playerOne", but the camera/listener are NOT, so plugins rely
	// on this to follow the player and gate effects (cover/swim/fly) — the same
	// kind of simple state gate swimming uses.
	{
		let _px = 0, _pz = 0;
		if (characterRef.current && characterRef.current.translation) {
			try { const t = characterRef.current.translation(); _px = t.x; _pz = t.z; } catch (e) {}
		}
		// "Sheltered" = something solid within ~14m straight up (roof, cavern
		// ceiling). A rapier ray every frame is wasteful — throttle to ~4Hz.
		shelterCheckAccumRef.current += delta;
		if (shelterCheckAccumRef.current >= 0.25) {
			shelterCheckAccumRef.current = 0;
			let sheltered = false;
			try {
				if (world && rapier) {
					const ray = new rapier.Ray({ x: _px, y: playerY + 1.5, z: _pz }, { x: 0, y: 1, z: 0 });
					const excludeBody = (rigidBodyRef.current && typeof rigidBodyRef.current.handle !== 'undefined') ? rigidBodyRef.current : undefined;
					const hit = world.castRay(ray, 14, true, undefined, undefined, undefined, excludeBody);
					sheltered = !!hit;
				}
			} catch (e) {}
			shelteredRef.current = sheltered;
		}
		const st = playerStateRef.current;
		st.x = _px; st.y = playerY; st.z = _pz;
		st.isSwimming = shouldSwim;
		st.isFlying = isFlyingRef.current;
		st.sheltered = shelteredRef.current;
		// AVATAR HEADING (radians, same convention as the avatar's rotation.y:
		// 0 = -Z). Published because plugins that need "which way am I facing"
		// were calling XRPublisher.getPlayer() — a full scene traversal — every
		// frame and deriving yaw from the world quaternion. Note this is the
		// BODY yaw (ecctrl turns the avatar toward movement), not the camera:
		// for "where am I aiming", use getCursorState().
		if (playerControllerRef.current && playerControllerRef.current.scene) {
			st.yaw = playerControllerRef.current.scene.rotation.y;
		}
		if (typeof window !== 'undefined') window.__xrPlayerState = st;
		if (characterRef.current && characterRef.current.translation) {
			sessionPlayerPos.x = _px;
			sessionPlayerPos.y = playerY;
			sessionPlayerPos.z = _pz;
			sessionPlayerPos.valid = true;
		}
	}
	
	// Splash in the water shader on entry — foam ring burst at the contact
	// point, sized by impact speed (a fall reads big, wading in reads small).
	// Runs BEFORE the swim damping below so linvel still holds entry velocity.
	// Cooldown guards the shouldSwim flicker of bobbing at the threshold.
	if (shouldSwim && !wasSwimmingRef.current) {
		const now = performance.now();
		if (now - lastSplashTimeRef.current > 700) {
			lastSplashTimeRef.current = now;
			let impact = 0;
			try {
				if (characterRef.current && characterRef.current.linvel) {
					impact = Math.max(0, -characterRef.current.linvel().y);
				}
			} catch (e) {}
			const st = playerStateRef.current;
			triggerWaterSplash(st.x, st.z, Math.min(1, 0.3 + impact * 0.07));
		}
	}
	wasSwimmingRef.current = shouldSwim;

	// Smooth transition between land and water
	if (shouldSwim && swimTransitionRef.current < 1) {
		swimTransitionRef.current = Math.min(1, swimTransitionRef.current + delta * 3);
	} else if (!shouldSwim && swimTransitionRef.current > 0) {
		swimTransitionRef.current = Math.max(0, swimTransitionRef.current - delta * 3);
	}
	
	// When swimming, gently guide player to swim height but allow physics to work
	if (shouldSwim && characterRef.current) {
		// Adjust height based on movement: lower when idle (treading), higher when swimming forward
		const swimY = isMovingRef.current ? waterLevel + 0.25 : waterLevel - 0.05;
		try {
			const currentTranslation = characterRef.current.translation();
			const vel = characterRef.current.linvel ? characterRef.current.linvel() : { x: 0, y: 0, z: 0 };
			
			// Only adjust Y if player is below swim level (let them rise naturally)
			if (currentTranslation.y < swimY - 0.1) {
				const currentY = currentTranslation.y;
				const newY = currentY + (swimY - currentY) * Math.min(1, delta * 4);
				
				_tmpVec3A.current.set(currentTranslation.x, newY, currentTranslation.z);
				characterRef.current.setTranslation(_tmpVec3A.current, true);
			}
			
			// Only dampen downward velocity, allow upward movement for exiting
			if (typeof characterRef.current.setLinvel === 'function') {
				const newVelY = vel.y < 0 ? vel.y * 0.5 : vel.y;
				const lateralDamp = shift ? 0.97 : 0.92;
				characterRef.current.setLinvel({ x: vel.x * lateralDamp, y: newVelY, z: vel.z * lateralDamp }, true);
			}
		} catch (e) {}
	}

	if (fly && flyTransitionRef.current < 1) {
		flyTransitionRef.current = Math.min(1, flyTransitionRef.current + delta * 3);
	} else if (!fly && flyTransitionRef.current > 0) {
		flyTransitionRef.current = Math.max(0, flyTransitionRef.current - delta * 3);
	}

	if (fly && characterRef.current) {
		if (typeof characterRef.current.setGravityScale === 'function') {
			characterRef.current.setGravityScale(0, true);
		}
	}
	if (wasFlyingRef.current && !fly && characterRef.current) {
		if (typeof characterRef.current.setGravityScale === 'function') {
			characterRef.current.setGravityScale(1, true);
		}
		
		const canJump = characterRef.current.userData?.canJump;
		
		if (canJump) {
			// Landed - reset to grounded
			jumpStateRef.current = 'grounded';
			if (animationsRef.current) {
				const { jump: jumpAnim, idle: idleAnim } = animationsRef.current;
				if (jumpAnim) {
					jumpAnim.paused = false;
					jumpAnim.setEffectiveWeight(0);
					jumpAnim.clampWhenFinished = false;
				}
				if (idleAnim) {
					idleAnim.enabled = true;
					idleAnim.setEffectiveTimeScale(1);
					idleAnim.setEffectiveWeight(1);
					idleAnim.play();
				}
			}
		} else {
			// Still airborne - enter falling state with clamped jump animation
			jumpStateRef.current = 'falling';
			jumpHoldTimeRef.current = 0;
			if (animationsRef.current) {
				const { jump: jumpAnim, idle: idleAnim, walking, running } = animationsRef.current;
				if (jumpAnim) {
					// Set up falling animation - clamp at end of jump
					jumpAnim.paused = false;
					jumpAnim.clampWhenFinished = true;
					jumpAnim.setEffectiveTimeScale(1);
					jumpAnim.setEffectiveWeight(1);
					// Fast-forward to near end of jump animation for falling pose
					if (jumpAnim._clip && jumpAnim._clip.duration) {
						jumpAnim.time = Math.max(0, jumpAnim._clip.duration - 0.1);
					}
					jumpAnim.play();
				}
				// Zero out other animations
				if (idleAnim) idleAnim.setEffectiveWeight(0);
				if (walking) walking.setEffectiveWeight(0);
				if (running) running.setEffectiveWeight(0);
				if (naturalIdleState.breathingAction) {
					naturalIdleState.breathingAction.setEffectiveWeight(0);
				}
			}
		}
	}
	wasFlyingRef.current = fly;

	if (playerMixerRef.current) {
		if (animationsRef.current) {
			const { idle, walking, running, jump, swimIdle, swim } = animationsRef.current;
			const swimTransition = swimTransitionRef.current;
			
			const blendSpeed = 4;
			if (isSwimmingRef.current && isMovingRef.current) {
				swimMoveBlendRef.current = Math.min(1, swimMoveBlendRef.current + delta * blendSpeed);
			} else {
				swimMoveBlendRef.current = Math.max(0, swimMoveBlendRef.current - delta * blendSpeed);
			}
			const swimMoveBlend = swimMoveBlendRef.current;
			
			const landWeight = 1 - swimTransition;
			const isInJump = jumpStateRef.current !== 'grounded';
			
			if (isInJump) {
				if (idle) idle.setEffectiveWeight(0);
				if (walking) walking.setEffectiveWeight(0);
				if (running) running.setEffectiveWeight(0);
				if (jump) jump.setEffectiveWeight(landWeight);
				if (naturalIdleState.breathingAction) {
					naturalIdleState.breathingAction.setEffectiveWeight(0);
				}
			} else {
				if (idle) idle.setEffectiveWeight(landWeight * (isMovingRef.current ? 0 : 1));
				if (walking) walking.setEffectiveWeight(landWeight * (isMovingRef.current && !shift ? 1 : 0));
				if (running) running.setEffectiveWeight(landWeight * (isMovingRef.current && shift ? 1 : 0));
				if (jump) jump.setEffectiveWeight(0);
				if (naturalIdleState.breathingAction) {
					naturalIdleState.breathingAction.setEffectiveWeight(landWeight * naturalIdleState.breathingWeight);
				}
			}
			
			if (swimIdle && swim) {
				swimIdle.setEffectiveWeight(swimTransition * (1 - swimMoveBlend));
				swim.setEffectiveWeight(swimTransition * swimMoveBlend);
				const swimSpeed = shift ? 2.2 : 1.0;
				swim.setEffectiveTimeScale(swimSpeed);
			}
		}

		if (flyTransitionRef.current > 0 && animationsRef.current) {
			const ft = flyTransitionRef.current;
			const { idle, walking, running, jump, swimIdle, swim } = animationsRef.current;
			
			const targetPoseTime = shift ? FLY_BOOST_POSE_TIME : FLY_POSE_TIME;
			flyPoseTimeRef.current += (targetPoseTime - flyPoseTimeRef.current) * Math.min(1, delta * 4);
			
			if (walking) walking.setEffectiveWeight(walking.getEffectiveWeight() * (1 - ft));
			if (running) running.setEffectiveWeight(running.getEffectiveWeight() * (1 - ft));
			if (jump) jump.setEffectiveWeight(jump.getEffectiveWeight() * (1 - ft));
			if (swimIdle) swimIdle.setEffectiveWeight(swimIdle.getEffectiveWeight() * (1 - ft));
			if (swim) {
				swim.time = flyPoseTimeRef.current;
				swim.setEffectiveTimeScale(0);
				swim.setEffectiveWeight(ft * FLY_SWIM_WEIGHT);
				swim.play();
			}
			if (idle) {
				const baseIdleWeight = idle.getEffectiveWeight();
				idle.setEffectiveWeight(baseIdleWeight * (1 - ft) + ft * FLY_AMBIENT_WEIGHT);
				idle.setEffectiveTimeScale(ft > 0.5 ? 0.4 : (idle.getEffectiveTimeScale() || 1));
				idle.play();
			}
			if (naturalIdleState.breathingAction) {
				naturalIdleState.breathingAction.setEffectiveWeight(
					naturalIdleState.breathingAction.getEffectiveWeight() * (1 - ft) + ft * 0.08
				);
			}
		}

			// Riding overlay: hold the static seated driving pose. Same pattern as
			// the fly overlay — fade every locomotion/idle/swim weight out and the
			// one-frame pose in, so the avatar sits in the vehicle instead of
			// running/idling on the spot. drivingBlend ramps both directions, so
			// boarding/dismounting cross-fades cleanly.
			const driving = animationsRef.current && animationsRef.current.driving;
			if (driving) {
				const target = isRidingRef.current ? 1 : 0;
				drivingBlendRef.current += (target - drivingBlendRef.current) * Math.min(1, delta * 6);
				const db = drivingBlendRef.current;
				if (db > 0.001) {
					const { idle, walking, running, jump, swimIdle, swim } = animationsRef.current;
					if (idle) idle.setEffectiveWeight(idle.getEffectiveWeight() * (1 - db));
					if (walking) walking.setEffectiveWeight(walking.getEffectiveWeight() * (1 - db));
					if (running) running.setEffectiveWeight(running.getEffectiveWeight() * (1 - db));
					if (jump) jump.setEffectiveWeight(jump.getEffectiveWeight() * (1 - db));
					if (swimIdle) swimIdle.setEffectiveWeight(swimIdle.getEffectiveWeight() * (1 - db));
					if (swim) swim.setEffectiveWeight(swim.getEffectiveWeight() * (1 - db));
					if (naturalIdleState.breathingAction) {
						naturalIdleState.breathingAction.setEffectiveWeight(
							naturalIdleState.breathingAction.getEffectiveWeight() * (1 - db)
						);
					}
					driving.setEffectiveWeight(db);
					driving.play();
				} else {
					driving.setEffectiveWeight(0);
				}
			}

		playerMixerRef.current.update(delta);
		
		// Riding hand/upper-body overlay (post-mixer, like the head pitches): the
		// driving clip animates arms but not fingers, so synthesize an almost-closed
		// fist on both hands (same finger-bone approach as VR), and add a VERY light
		// steer-driven shoulder tilt — turning right drops the right shoulder and
		// lifts the left (a uniform +Z on both shoulders does exactly that given the
		// mirrored rest directions); left turn is the opposite. Both scale by the
		// driving blend so they fade with the pose.
		if (isRidingRef.current && playerControllerRef.current?.humanoid) {
			const h = playerControllerRef.current.humanoid;
			const amt = drivingBlendRef.current;
			if (amt > 0.001) {
				applyFistPose(h, LEFT_FINGER_BONES, true, amt);
				applyFistPose(h, RIGHT_FINGER_BONES, false, amt);
				const SHOULDER_TILT = 0.26; // rad at full lock — also the hard clamp
				// Negative: turning right must drop the RIGHT shoulder / lift the left
				// (it was reversed — arms turned the wheel left on a right turn).
				// ABSOLUTE set, NOT `+=`: the driving clip doesn't animate the shoulder
				// bones, so the mixer never resets them — accumulating each frame wound
				// the arms up into endless full-circle spins while turning. Clamp to
				// ±SHOULDER_TILT so it can never fly away regardless of input scale.
				const tilt = Math.max(-SHOULDER_TILT, Math.min(SHOULDER_TILT,
					-rideSteerRef.current * SHOULDER_TILT * amt));
				const leftSh = h.getNormalizedBoneNode(VRMHumanBoneName.LeftShoulder);
				const rightSh = h.getNormalizedBoneNode(VRMHumanBoneName.RightShoulder);
				if (leftSh) leftSh.rotation.z = tilt;
				if (rightSh) rightSh.rotation.z = tilt;
			}
		}
		
		if (isSwimmingRef.current && isMovingRef.current && playerControllerRef.current && playerControllerRef.current.humanoid) {
			const headBone = playerControllerRef.current.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
			if (headBone) {
				const headPitch = 0.9;
				headBone.rotation.x += headPitch;
				const headYaw = 0.25;
				headBone.rotation.y += headYaw;
			}
		}

		if (isFlyingRef.current && playerControllerRef.current && playerControllerRef.current.humanoid) {
			const headBone = playerControllerRef.current.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
			if (headBone) {
				const moveFactor = isMovingRef.current ? 1.0 : 0.7;
				const ft = flyTransitionRef.current;
				headBone.rotation.x += 0.9 * moveFactor * ft;
				headBone.rotation.y += 0.25 * moveFactor * ft;
			}
		}

		if (!isMobile && !isMovingRef.current && jumpStateRef.current === 'grounded' && !isSwimmingRef.current) {
			updateNaturalIdleAnimation(delta);
		}

		// GTA-style aim overlay (plugins: XRPublisher.setAimTarget) — post-mixer
		// and post-idle so it wins the frame. The target must be refreshed every
		// frame (≤0.5s age) or it releases; the blend eases in/out so the arms
		// raise and drop smoothly. Suppressed while riding/flying/swimming.
		{
			const aim = (typeof window !== 'undefined') ? window.__xrAimTarget : null;
			const aimActive = !!(aim && aim.p && (performance.now() - aim.t) < 500)
				&& !isRidingRef.current && !isFlyingRef.current && !isSwimmingRef.current;
			if (aimActive) aimLastTargetRef.current = aim.p;
			const goal = aimActive ? 1 : 0;
			aimBlendRef.current += (goal - aimBlendRef.current) * Math.min(1, delta * 6);
			if (aimBlendRef.current < 0.001) { aimBlendRef.current = 0; aimLastTargetRef.current = null; }
			if (aimBlendRef.current > 0 && aimLastTargetRef.current && playerControllerRef.current?.humanoid) {
				applyAimPose(playerControllerRef.current.humanoid, aimLastTargetRef.current,
					smoothedRotationRef.current, aimBlendRef.current);
			}
		}
	}
	
	// Cursor system handled by separate WorldCursor component

	const now = state.clock.elapsedTime * 1000;


	// Local movement flag for animations (network broadcasting is handled by
	// the single localActionState decision after the jump state machine —
	// the three broadcast sites that used to live here could disagree
	// within one frame and flicker remote animations).
	const isLocomotionHeld = backward || forward || left || right || (isFlyingRef.current && (space || shift));
	if (isLocomotionHeld) {
		// Always allow animations if we have the animation references loaded
		if (animationsRef.current && animationsRef.current.idle && animationsRef.current.walking) {
			isMovingRef.current = true;
		}

		// No timer here: the else-branch clears the flag on the first frame
		// with no keys held. The old clearTimeout+setTimeout(500) pair ran at
		// rAF rate while ANY movement key was held (~230 timer API calls/sec
		// on a 120Hz display) and profiled at ~2% of the main thread.
		movementTimeoutRef.current = now;
	} else if (isMovingRef.current) {
		isMovingRef.current = false;
	}

	handleBlinking(delta);

	if (animationsRef.current) {
	if (playerControllerRef.current && participantObject && participantObject.parent) {
		camera.getWorldQuaternion(_tmpQuatA.current);
		const cameraForward = _tmpVec3A.current.set(0, 0, -1).applyQuaternion(_tmpQuatA.current);

		participantObject.parent.getWorldQuaternion(_tmpQuatB.current);
		const characterForward = _tmpVec3B.current.set(0, 0, 1).applyQuaternion(_tmpQuatB.current);

		participantObject.getWorldPosition(_tmpVec3C.current);
		const characterToCamera = _tmpVec3C.current.subVectors(camera.position, _tmpVec3C.current).normalize();

		const dotProduct = characterForward.dot(cameraForward);
		const azimuthalAngle = Math.acos(Math.min(Math.max(dotProduct, -1), 1));

		const angleThreshold = Math.PI / 2;
		if (azimuthalAngle < angleThreshold) {
		if (avatarIsSprite) {
			if (isMovingRef.current && frameNameRef.current !== 'WalkForward') {
			frameNameRef.current = 'WalkForward';
			if (spriteRef.current) spriteRef.current.frameName = 'WalkForward';
			}
			if (isMovingRef.current === false) {
			if (frameNameRef.current !== 'ForwardIdle') {
				frameNameRef.current = 'ForwardIdle';
				if (spriteRef.current) spriteRef.current.frameName = 'ForwardIdle';
			}
			}
		}
		} else {
		if (avatarIsSprite && isMovingRef.current && frameNameRef.current !== 'WalkBackward') {
			frameNameRef.current = 'WalkBackward';
			if (spriteRef.current) spriteRef.current.frameName = 'WalkBackward';
		}
		if (avatarIsSprite && isMovingRef.current === false && frameNameRef.current !== 'BackwardIdle') {
			frameNameRef.current = 'BackwardIdle';
			if (spriteRef.current) spriteRef.current.frameName = 'BackwardIdle';
		}
		}
	}

	const { idle, walking, running, jump, falling, swimIdle, swim } = animationsRef.current;

	if (props.movement.current.respawn) {
		// Consume the flag immediately so this fires ONCE (edge), not every frame
		// it's held. Route respawn through the same graceful teleport path:
		// preload the spawn's terrain, snap camera + sky, sample the real ground
		// on arrival — so respawning from far away doesn't drop the player through
		// un-generated terrain into the water (the bug the teleport path already
		// fixed). No explicit Y → ground is raycast post-preload.
		props.movement.current.respawn = false;
		const rsx = Number(spawnPoint[0]) || 0;
		const rsz = Number(spawnPoint[2]) || 0;
		try {
			window.dispatchEvent(new CustomEvent('portalTeleport', {
				detail: { x: rsx, y: Number(spawnPoint[1]) || 0, z: rsz },
			}));
		} catch (e) {}
	}
	// Removed old auto-Dynamic code - now handled by kinematic enforcement at top of useFrame

	if (!isSwimmingRef.current && !isFlyingRef.current && jump && idle && jumpStateRef.current === 'grounded') {
	if (isMovingRef.current && characterRef.current && characterRef.current.userData && characterRef.current.userData.canJump) {
		jump.clampWhenFinished = false;
		jump.reset();
		jump.setEffectiveTimeScale(0);
		jump.setEffectiveWeight(0);
	} else if (!isMovingRef.current && characterRef.current && characterRef.current.userData && characterRef.current.userData.canJump) {
		jump.clampWhenFinished = false;
		jump.reset();
		jump.setEffectiveTimeScale(0);
		jump.setEffectiveWeight(0);
		
		if (naturalIdleState.enabled && !isMobile) {
			idle.setEffectiveTimeScale(0);
			idle.setEffectiveWeight(naturalIdleState.poseWeight);
			if (naturalIdleState.breathingAction) {
				naturalIdleState.breathingAction.setEffectiveWeight(naturalIdleState.breathingWeight);
			}
		} else {
			idle.setEffectiveTimeScale(1);
			idle.setEffectiveWeight(1);
		}
	}
	}

	// Jump network sync moved after jump state machine (below) so it can
	// react on the same frame the state transitions.

		if (!isSwimmingRef.current && !isFlyingRef.current && isMovingRef.current && idle && walking && running && jumpStateRef.current === 'grounded') {

		if (shift) {
			if (walking.isRunning()) {
			walking.crossFadeTo(running, 1.1);
			} else {
			idle.crossFadeTo(running, 1.1);
			}
			running.enabled = true;
			running.setEffectiveTimeScale(1);
			running.setEffectiveWeight(1);
			
			idle.enabled = true;
			idle.setEffectiveTimeScale(0);
			idle.setEffectiveWeight(0);
			if (naturalIdleState.breathingAction) {
				naturalIdleState.breathingAction.setEffectiveWeight(0);
			}
			
			walking.enabled = true;
			walking.setEffectiveTimeScale(1);
			walking.setEffectiveWeight(0);
			running.play();
		} else {
			if (running.isRunning()) {
			running.crossFadeTo(walking, 1);
			} else {
			idle.crossFadeTo(walking, 1);
			}
			walking.enabled = true;
			walking.setEffectiveTimeScale(1);
			walking.setEffectiveWeight(1);
			running.enabled = true;
			running.setEffectiveTimeScale(1);
			running.setEffectiveWeight(0);
			
			idle.enabled = true;
			idle.setEffectiveTimeScale(0);
			idle.setEffectiveWeight(0);
			if (naturalIdleState.breathingAction) {
				naturalIdleState.breathingAction.setEffectiveWeight(0);
			}
			
			walking.play();
		}
		} else if (!isSwimmingRef.current && !isFlyingRef.current && idle && walking && running && jumpStateRef.current === 'grounded') {
			if (walking.isRunning()) {
			walking.enabled = true;
			walking.setEffectiveTimeScale(0);
			walking.setEffectiveWeight(0);
			running.setEffectiveTimeScale(0);
			running.setEffectiveWeight(0);
			
			if (naturalIdleState.enabled && !isMobile) {
				idle.enabled = true;
				idle.setEffectiveWeight(naturalIdleState.poseWeight);
				idle.setEffectiveTimeScale(0);
				if (naturalIdleState.breathingAction) {
					naturalIdleState.breathingAction.setEffectiveWeight(naturalIdleState.breathingWeight);
				}
			} else {
				idle.enabled = true;
				idle.setEffectiveTimeScale(1);
				idle.setEffectiveWeight(1);
				idle.play();
			}
			} else if (running.isRunning()) {
			running.enabled = true;
			running.setEffectiveTimeScale(0);
			running.setEffectiveWeight(0);
			walking.setEffectiveTimeScale(0);
			walking.setEffectiveWeight(0);
			
			if (naturalIdleState.enabled && !isMobile) {
				idle.enabled = true;
				idle.setEffectiveWeight(naturalIdleState.poseWeight);
				idle.setEffectiveTimeScale(0);
				if (naturalIdleState.breathingAction) {
					naturalIdleState.breathingAction.setEffectiveWeight(naturalIdleState.breathingWeight);
				}
			} else {
				idle.enabled = true;
				idle.setEffectiveTimeScale(1);
				idle.setEffectiveWeight(1);
				idle.play();
			}
			}
		}

	if (!isSwimmingRef.current && !isFlyingRef.current && characterRef.current && jump && idle && walking && running) {
		const canJump = characterRef.current.userData?.canJump;
		const currentState = jumpStateRef.current;
		
		const currentYPosition = participantObject ? participantObject.getWorldPosition(_tmpVec3A.current).y : 0;
		
		// Initialize Y position tracking early (before any jump logic) to prevent spawn teleport on first jump
		if (!hasInitializedPositionTracking.current && canJump) {
			lastYPositionRef.current = currentYPosition;
			lastYPositionInitializedRef.current = true;
			hasInitializedPositionTracking.current = true;
		}
		
		// Ensure Y position is always initialized when we can jump
		if (!lastYPositionInitializedRef.current && canJump) {
			lastYPositionRef.current = currentYPosition;
			lastYPositionInitializedRef.current = true;
		}
		
		const lastYPosition = lastYPositionRef.current ?? currentYPosition;
		const verticalVelocity = currentYPosition - lastYPosition;
		lastYPositionRef.current = currentYPosition;
		
		const spaceJustPressed = space && !spaceWasPressedRef.current;
		spaceWasPressedRef.current = space;
		
		if (currentState === 'grounded') {
			hasDoubleJumpedRef.current = false;
			
			if (space && canJump) {
				jumpStateRef.current = 'ascending';
				jumpHoldTimeRef.current = 0;
				
				// Clear walk/run animations to prevent blending artifacts
				idle.setEffectiveWeight(0);
				walking.setEffectiveWeight(0);
				walking.setEffectiveTimeScale(0);
				running.setEffectiveWeight(0);
				running.setEffectiveTimeScale(0);
				if (naturalIdleState.breathingAction) {
					naturalIdleState.breathingAction.setEffectiveWeight(0);
				}
				
				jump.setLoop(LoopOnce, 1);
				jump.reset();
				jump.clampWhenFinished = true;
				jump.setEffectiveTimeScale(1);
				jump.setEffectiveWeight(1);
				jump.play();
			}
		} else if (currentState === 'ascending') {
			if (spaceJustPressed && !hasDoubleJumpedRef.current && typeof characterRef.current.applyImpulse === 'function') {
				hasDoubleJumpedRef.current = true;
				characterRef.current.applyImpulse({ x: 0, y: 1.5, z: 0 }, true);

				jump.reset();
				jump.play();
			}

			jumpHoldTimeRef.current += delta;

			// Only transition to falling after a minimum ascent time so the
			// physics impulse has time to lift the character off the ground.
			if (verticalVelocity < 0.01 && jumpHoldTimeRef.current > 0.1) {
				jumpStateRef.current = 'falling';
				jumpHoldTimeRef.current = 0;
			}
		} else if (currentState === 'falling') {
			if (spaceJustPressed && !hasDoubleJumpedRef.current && typeof characterRef.current.applyImpulse === 'function') {
				hasDoubleJumpedRef.current = true;
				characterRef.current.applyImpulse({ x: 0, y: 1.5, z: 0 }, true);

				jumpStateRef.current = 'ascending';
				jumpHoldTimeRef.current = 0;
				jump.paused = false;
				jump.reset();
				jump.play();
			}

			jumpHoldTimeRef.current += delta;

			if (jump.time >= jump._clip.duration - 0.05) {
				jump.paused = true;
			}

			// Land if on ground — require minimum fall time (0.15s) to prevent
			// immediate re-grounding when the character hasn't fully left the ground yet.
			if (canJump && jumpHoldTimeRef.current > 0.15 && (Math.abs(verticalVelocity) < 0.15 || jumpHoldTimeRef.current > 0.5)) {
				jumpStateRef.current = 'grounded';
				jump.paused = false;
				jump.setEffectiveWeight(0);
				jump.clampWhenFinished = false;
			}
		}
		
		if (jumpStateRef.current !== 'grounded') {
			jump.setEffectiveWeight(1);
			idle.setEffectiveWeight(0);
			walking.setEffectiveWeight(0);
			running.setEffectiveWeight(0);
			if (naturalIdleState.breathingAction) {
				naturalIdleState.breathingAction.setEffectiveWeight(0);
			}
		}
	}

	// Single per-frame network action decision — placed AFTER the jump state
	// machine so it reacts on the same frame the state transitions. The
	// LocalActionState machine emits jump → jumpStop → walk/idle sequences
	// deterministically; transitions broadcast immediately, steady state at
	// a fixed cadence (NetworkBridge further drops byte-identical sends).
	{
		const isAirborne = jumpStateRef.current !== 'grounded';
		const decision = localActionStateRef.current.compute({
			moving: isMovingRef.current,
			shift,
			airborne: isAirborne,
			swimming: isSwimmingRef.current,
		});
		if (localActionStateRef.current.shouldSend(decision, now, isAirborne)) {
			broadcastPlayerState(decision.action, decision.hangtime);
			lastNetworkUpdateTimeRef.current = now;
		}
	}

	// Track last-pressed key for conflict resolution
	const prevKeys = prevKeysRef.current;
	
	// Detect newly pressed keys and update last-pressed refs
	if (forward && !prevKeys.forward) lastVerticalKeyRef.current = 'forward';
	if (backward && !prevKeys.backward) lastVerticalKeyRef.current = 'backward';
	if (left && !prevKeys.left) lastHorizontalKeyRef.current = 'left';
	if (right && !prevKeys.right) lastHorizontalKeyRef.current = 'right';
	
	// Clear last-pressed ref when neither key in pair is held
	if (!forward && !backward) lastVerticalKeyRef.current = null;
	if (!left && !right) lastHorizontalKeyRef.current = null;
			
	// Store current keys for next frame
	prevKeysRef.current = { forward, backward, left, right };
	
	// Resolve conflicts - last pressed key wins
	let effectiveForward = forward;
	let effectiveBackward = backward;
	let effectiveLeft = left;
	let effectiveRight = right;
	
	// If both W and S held, use last pressed
	if (forward && backward) {
		if (lastVerticalKeyRef.current === 'forward') {
			effectiveBackward = false;
				} else {
			effectiveForward = false;
			}
		}
		
	// If both A and D held, use last pressed
	if (left && right) {
		if (lastHorizontalKeyRef.current === 'left') {
			effectiveRight = false;
		} else {
			effectiveLeft = false;
		}
	}

	// Joystick view-turn with no movement input: rotate the character in
	// place to track the new view direction (treated as facing forward).
	// NOT while riding — there the stick's lateral axis is the vehicle STEER;
		// tripping the on-foot rotation block would overwrite the avatar's seat
		// pose with camera-tracking (body swinging off the seat + rubber-banding,
		// seen only on mobile; desktop has no joystick so it never fired).
		if (joystickTurn.value !== 0 && !effectiveForward && !effectiveBackward && !effectiveLeft && !effectiveRight && !isRidingRef.current) {
		effectiveForward = true;
	}

	// Only update avatar rotation when actively moving
	if (playerControllerRef.current && (effectiveForward || effectiveBackward || effectiveLeft || effectiveRight) && head.current) {
		const avatarScene = playerControllerRef.current.scene;
		
		if (isFlyingRef.current && effectiveForward) {
			const fwd = head.current.forward;
			const targetYaw = Math.atan2(-fwd.x, -fwd.z);
			const targetPitch = -Math.asin(Math.max(-1, Math.min(1, -fwd.y)));
			
			let currentYaw = smoothedRotationRef.current;
			let yawDiff = targetYaw - currentYaw;
			while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
			while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
			currentYaw += yawDiff * Math.min(1, delta * 8);
			smoothedRotationRef.current = currentYaw;
			
			avatarScene.rotation.order = 'YXZ';
			avatarScene.rotation.y = currentYaw;
			avatarScene.rotation.x = targetPitch;
			avatarScene.rotation.z = flyBankAngleRef.current;
		} else if (!isFlyingRef.current) {
			// AIM-STRAFE: while a plugin aim target is active (setAimTarget
			// refreshed every frame), the body stays locked on the target and
			// movement input reads as strafes/backpedal — the character
			// controller already translates camera-relative, so all that's
			// needed is NOT rotating the body to face the movement direction.
			const aimStrafe = (typeof window !== 'undefined') ? window.__xrAimTarget : null;
			const aimSt = (typeof window !== 'undefined') ? window.__xrPlayerState : null;
			if (aimStrafe && aimStrafe.p && aimSt && (performance.now() - aimStrafe.t) < 500 && !isRidingRef.current) {
				const desired = Math.atan2(aimStrafe.p[0] - aimSt.x, aimStrafe.p[2] - aimSt.z) + Math.PI;
				let aimDiff = desired - smoothedRotationRef.current;
				while (aimDiff > Math.PI) aimDiff -= Math.PI * 2;
				while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;
				smoothedRotationRef.current += aimDiff * Math.min(1, delta * 10);
				avatarScene.rotation.order = 'YXZ';
				avatarScene.rotation.y = smoothedRotationRef.current;
				avatarScene.rotation.x = 0;
				avatarScene.rotation.z = 0;
			} else {
			const cameraYaw = Math.atan2(head.current.forward.x, head.current.forward.z);
			let rotationOffset = 0;
			
			if (effectiveForward && effectiveRight && !effectiveBackward && !effectiveLeft) {
				rotationOffset = Math.PI - Math.PI / 4;
			} else if (effectiveForward && effectiveLeft && !effectiveBackward && !effectiveRight) {
				rotationOffset = Math.PI + Math.PI / 4;
			} else if (effectiveBackward && effectiveRight && !effectiveForward && !effectiveLeft) {
				rotationOffset = Math.PI / 4;
			} else if (effectiveBackward && effectiveLeft && !effectiveForward && !effectiveRight) {
				rotationOffset = -Math.PI / 4;
			} else if (effectiveForward && !effectiveBackward && !effectiveLeft && !effectiveRight) {
				rotationOffset = Math.PI;
			} else if (effectiveBackward && !effectiveForward && !effectiveLeft && !effectiveRight) {
				rotationOffset = 0;
			} else if (effectiveLeft && !effectiveRight && !effectiveForward && !effectiveBackward) {
				rotationOffset = -Math.PI / 2;
			} else if (effectiveRight && !effectiveLeft && !effectiveForward && !effectiveBackward) {
				rotationOffset = Math.PI / 2;
			}
			
			const targetRotation = cameraYaw + rotationOffset;
			let currentRotation = smoothedRotationRef.current;
			let angleDiff = targetRotation - currentRotation;
			while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
			while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
			currentRotation += angleDiff * Math.min(1, delta * 10);
			smoothedRotationRef.current = currentRotation;

			avatarScene.rotation.order = 'YXZ';
			avatarScene.rotation.y = currentRotation;
			avatarScene.rotation.x = 0;
			avatarScene.rotation.z = 0;
			}
		}
	} else if (playerControllerRef.current && !isFlyingRef.current) {
		const avatarScene = playerControllerRef.current.scene;
		// While aiming (setAimTarget refreshed every frame), turn the IDLE body
		// toward the target — the engine otherwise only turns the body while
		// moving. The arm cone clamp in applyAimPose covers the residual offset
		// during the turn.
		{
			const aim = (typeof window !== 'undefined') ? window.__xrAimTarget : null;
			const st = (typeof window !== 'undefined') ? window.__xrPlayerState : null;
			if (aim && aim.p && st && (performance.now() - aim.t) < 500 && !isRidingRef.current) {
				const desired = Math.atan2(aim.p[0] - st.x, aim.p[2] - st.z) + Math.PI;
				let diff = desired - smoothedRotationRef.current;
				while (diff > Math.PI) diff -= Math.PI * 2;
				while (diff < -Math.PI) diff += Math.PI * 2;
				smoothedRotationRef.current += diff * Math.min(1, delta * 8);
				avatarScene.rotation.y = smoothedRotationRef.current;
			}
		}
		if (Math.abs(avatarScene.rotation.x) > 0.001 || Math.abs(avatarScene.rotation.z) > 0.001) {
			avatarScene.rotation.x += (0 - avatarScene.rotation.x) * Math.min(1, delta * 10);
			avatarScene.rotation.z += (0 - avatarScene.rotation.z) * Math.min(1, delta * 10);
			if (Math.abs(avatarScene.rotation.x) < 0.001) avatarScene.rotation.x = 0;
			if (Math.abs(avatarScene.rotation.z) < 0.001) avatarScene.rotation.z = 0;
		}
	} else if (playerControllerRef.current && isFlyingRef.current) {
		const avatarScene = playerControllerRef.current.scene;
		flyBankTargetRef.current = 0;
		const bankDiff = flyBankTargetRef.current - flyBankAngleRef.current;
		flyBankAngleRef.current += bankDiff * Math.min(1, delta * 6);
		avatarScene.rotation.z = flyBankAngleRef.current;
	}
	}

	if (isFlyingRef.current && characterRef.current && head.current) {
		const hasDirectionalInput = forward || backward || left || right || space;
		_tmpVec3A.current.copy(head.current.forward);
		_tmpVec3B.current.copy(head.current.right);
		_tmpVec3C.current.copy(head.current.up);

		_tmpFlyVel.current.set(0, 0, 0);
		
		if (forward) _tmpFlyVel.current.add(_tmpVec3A.current);
		if (backward) _tmpFlyVel.current.sub(_tmpVec3A.current);
		if (right) _tmpFlyVel.current.add(_tmpVec3B.current);
		if (left) _tmpFlyVel.current.sub(_tmpVec3B.current);
		if (space) _tmpFlyVel.current.add(_tmpVec3C.current);

		if (_tmpFlyVel.current.lengthSq() > 0) {
			const speed = shift ? FLY_SPEED * 2 : FLY_SPEED;
			_tmpFlyVel.current.normalize().multiplyScalar(speed);
		}

		const currentCameraYaw = Math.atan2(head.current.forward.x, head.current.forward.z);
		let yawDelta = currentCameraYaw - prevCameraYawRef.current;
		while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
		while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
		
		if (hasDirectionalInput) {
			const yawVelocityTarget = yawDelta / Math.max(delta, 0.001);
			cameraYawVelocityRef.current += (yawVelocityTarget - cameraYawVelocityRef.current) * Math.min(1, delta * 8);
		} else {
			// When there is no directional input, decay any existing bank and
			// yaw velocity so camera-only rotation does not tilt the avatar.
			cameraYawVelocityRef.current += (0 - cameraYawVelocityRef.current) * Math.min(1, delta * 6);
		}
		prevCameraYawRef.current = currentCameraYaw;
		
		const MAX_BANK_ANGLE = Math.PI / 5;
		const bankSensitivity = 0.35;
		flyBankTargetRef.current = hasDirectionalInput
			? MathUtils.clamp(cameraYawVelocityRef.current * bankSensitivity, -MAX_BANK_ANGLE, MAX_BANK_ANGLE)
			: 0;
		
		const bankSpeed = 6;
		const bankDiff = flyBankTargetRef.current - flyBankAngleRef.current;
		flyBankAngleRef.current += bankDiff * Math.min(1, delta * bankSpeed);

		try {
			characterRef.current.setLinvel({ x: _tmpFlyVel.current.x, y: _tmpFlyVel.current.y, z: _tmpFlyVel.current.z }, true);
		} catch (e) {}
	}

	// Auto-land: if flying and touching walkable terrain, disable fly mode
	// Require 3 consecutive frames to avoid single-frame grazes, but fast enough to feel instant
	if (isFlyingRef.current && characterRef.current?.userData?.canJump) {
		autoLandFramesRef.current++;
		const vel = characterRef.current.linvel ? characterRef.current.linvel() : { y: 0 };
		// Land if grounded for 3 frames AND not actively ascending (space or upward velocity)
		if (autoLandFramesRef.current >= 3 && !space && vel.y < 1) {
			props.movement.current.fly = false;
			autoLandFramesRef.current = 0;
			// Restore gravity, zero velocity for clean landing
			if (typeof characterRef.current.setGravityScale === 'function') {
				characterRef.current.setGravityScale(1, true);
			}
			try {
				characterRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
			} catch (_) {}
			jumpStateRef.current = 'grounded';
			window.dispatchEvent(new CustomEvent('playerLanded', {
				detail: { fromFlying: true }
			}));
		}
	} else {
		autoLandFramesRef.current = 0;
	}

	});

	// ──────────── VRM IK for WebXR ────────────
	const _ikBoneWorld = useRef(new Vector3());
	const _ikToTarget = useRef(new Vector3());
	const _ikToChild = useRef(new Vector3());
	const _ikQuat = useRef(new Quaternion());
	const _ikHipsPos = useRef(new Vector3());
	const _ikMat4 = useRef(new Matrix4());
	const _ikCamPos = useRef(new Vector3());
	const _ikCamQuat = useRef(new Quaternion());
	const _ikCtrlPosL = useRef(new Vector3());
	const _ikCtrlQuatL = useRef(new Quaternion());
	const _ikCtrlPosR = useRef(new Vector3());
	const _ikCtrlQuatR = useRef(new Quaternion());
	const _ikParentQuatInv = useRef(new Quaternion());
	const _ikTempQuat = useRef(new Quaternion());
	const _ikTempQuat2 = useRef(new Quaternion());
	const _ikTempVec = useRef(new Vector3());
	const _ikEndEffector = useRef(new Vector3());
	const _ikTempEuler = useRef(new Euler());
	// Manually-tracked chain world transforms for the fast CCD solver —
	// replaces per-iteration scene-graph updateWorldMatrix cascades.
	const _ikChainQw = useRef([new Quaternion(), new Quaternion(), new Quaternion()]);
	const _ikChainPw = useRef([new Vector3(), new Vector3(), new Vector3()]);
	const _ikChainParentQw = useRef(new Quaternion());
	const _ikChainParentPw = useRef(new Vector3());
	const _ikChainScale = useRef(new Vector3());
	// Escape hatch: ?ikclassic=1 restores the original scene-graph CCD solver
	// for on-device A/B comparison.
	const _ikUseClassicSolver = useRef(
		typeof window !== 'undefined'
		&& new URLSearchParams(window.location.search).has('ikclassic')
	);

	const _ikBodyYaw = useRef(0);
	const _ikBodyYawInitialized = useRef(false);
	const _ikVrmBaseYaw = useRef(0);

	const _ikSwimBlend = useRef(0);
	const _ikSwimSpinePitch = useRef(0);

	const _ikLeanActive = useRef(false);
	const _ikLeanBlend = useRef(0);
	const _ikLeanSpinePitch = useRef(0);
	const LEAN_PITCH_THRESHOLD = -0.26;
	const LEAN_FORWARD_THRESHOLD = 0.15;
	const LEAN_SNAP_PITCH = 0.30;

	// Forearm twist: wrist rotation partially transferred to forearm for realistic elbow
	const FOREARM_TWIST_FACTOR = 0.35; // 35% of wrist twist propagated to forearm
	const _ikForearmTwistQuat = useRef(new Quaternion());
	const _ikForearmTwistAxis = useRef(new Vector3());

	const _ikSpineRestQuat = useRef(new Quaternion());
	const _ikChestRestQuat = useRef(new Quaternion());
	const _ikSpineRestCaptured = useRef(false);
	const _ikNeckRestQuat = useRef(new Quaternion());
	const _ikNeckRestCaptured = useRef(false);
	const _ikHeadRestQuat = useRef(new Quaternion());
	const _ikHeadRestCaptured = useRef(false);

	const _ikLeftArmBlend = useRef(1);
	const _ikRightArmBlend = useRef(1);

	// Natural relaxed arm poses (arms at sides, slightly bent)
	const _REST_LEFT_UPPER_ARM = useRef(new Quaternion().setFromEuler(new Euler(0.15, 0, 1.2)));
	const _REST_LEFT_LOWER_ARM = useRef(new Quaternion().setFromEuler(new Euler(0, -0.3, 0.1)));
	const _REST_LEFT_HAND = useRef(new Quaternion());
	const _REST_RIGHT_UPPER_ARM = useRef(new Quaternion().setFromEuler(new Euler(0.15, 0, -1.2)));
	const _REST_RIGHT_LOWER_ARM = useRef(new Quaternion().setFromEuler(new Euler(0, 0.3, -0.1)));
	const _REST_RIGHT_HAND = useRef(new Quaternion());

	// Rotation corrections to map from input device coordinate system to VRM hand bone orientation.
	// Controller gripSpace: -Z along rod toward thumb, +X toward back of hand, +Y toward arm.
	// Hand gripSpace: synthesized from hand pose, emulates holding a virtual rod.
	// VRM hand bone at identity: fingers extend along arm chain (+X for right, -X for left),
	// palm faces down (-Y), back of hand faces up (+Y).
	// The correction rotates the grip orientation so the VRM hand mesh aligns visually.
	const _GRIP_TO_VRM_LEFT_CTRL = useRef(new Quaternion().setFromEuler(new Euler(0, 0, Math.PI / 2)));
	const _GRIP_TO_VRM_RIGHT_CTRL = useRef(new Quaternion().setFromEuler(new Euler(0, 0, -Math.PI / 2)));
	const _GRIP_TO_VRM_LEFT_HAND = useRef(new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0)));
	const _GRIP_TO_VRM_RIGHT_HAND = useRef(new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0)));

	const XR_TO_VRM_FINGER_MAP_LEFT = [
		['thumb-metacarpal', VRMHumanBoneName.LeftThumbMetacarpal],
		['thumb-phalanx-proximal', VRMHumanBoneName.LeftThumbProximal],
		['thumb-phalanx-distal', VRMHumanBoneName.LeftThumbDistal],
		['index-finger-phalanx-proximal', VRMHumanBoneName.LeftIndexProximal],
		['index-finger-phalanx-intermediate', VRMHumanBoneName.LeftIndexIntermediate],
		['index-finger-phalanx-distal', VRMHumanBoneName.LeftIndexDistal],
		['middle-finger-phalanx-proximal', VRMHumanBoneName.LeftMiddleProximal],
		['middle-finger-phalanx-intermediate', VRMHumanBoneName.LeftMiddleIntermediate],
		['middle-finger-phalanx-distal', VRMHumanBoneName.LeftMiddleDistal],
		['ring-finger-phalanx-proximal', VRMHumanBoneName.LeftRingProximal],
		['ring-finger-phalanx-intermediate', VRMHumanBoneName.LeftRingIntermediate],
		['ring-finger-phalanx-distal', VRMHumanBoneName.LeftRingDistal],
		['pinky-finger-phalanx-proximal', VRMHumanBoneName.LeftLittleProximal],
		['pinky-finger-phalanx-intermediate', VRMHumanBoneName.LeftLittleIntermediate],
		['pinky-finger-phalanx-distal', VRMHumanBoneName.LeftLittleDistal],
	];

	const XR_TO_VRM_FINGER_MAP_RIGHT = [
		['thumb-metacarpal', VRMHumanBoneName.RightThumbMetacarpal],
		['thumb-phalanx-proximal', VRMHumanBoneName.RightThumbProximal],
		['thumb-phalanx-distal', VRMHumanBoneName.RightThumbDistal],
		['index-finger-phalanx-proximal', VRMHumanBoneName.RightIndexProximal],
		['index-finger-phalanx-intermediate', VRMHumanBoneName.RightIndexIntermediate],
		['index-finger-phalanx-distal', VRMHumanBoneName.RightIndexDistal],
		['middle-finger-phalanx-proximal', VRMHumanBoneName.RightMiddleProximal],
		['middle-finger-phalanx-intermediate', VRMHumanBoneName.RightMiddleIntermediate],
		['middle-finger-phalanx-distal', VRMHumanBoneName.RightMiddleDistal],
		['ring-finger-phalanx-proximal', VRMHumanBoneName.RightRingProximal],
		['ring-finger-phalanx-intermediate', VRMHumanBoneName.RightRingIntermediate],
		['ring-finger-phalanx-distal', VRMHumanBoneName.RightRingDistal],
		['pinky-finger-phalanx-proximal', VRMHumanBoneName.RightLittleProximal],
		['pinky-finger-phalanx-intermediate', VRMHumanBoneName.RightLittleIntermediate],
		['pinky-finger-phalanx-distal', VRMHumanBoneName.RightLittleDistal],
	];

	const _fingerCalibrationLeft = useRef(null);
	const _fingerCalibrationRight = useRef(null);
	const _fingerCalibrated = useRef(false);
	const _fingerTempQuat = useRef(new Quaternion());
	const _fingerParentInv = useRef(new Quaternion());
	const _fingerWorldQuat = useRef(new Quaternion());
	const _fingerOriginQuat = useRef(new Quaternion());
	// Track whether each hand was present last frame (for recalibration when hand reappears)
	const _leftHandWasPresent = useRef(false);
	const _rightHandWasPresent = useRef(false);

	// Pre-allocated buffers for VR hand data network broadcast (avoids per-frame GC)
	const _netLeftFingers = useRef(new Float32Array(60));   // 15 joints x 4 components
	const _netRightFingers = useRef(new Float32Array(60));
	const _netLastVRBroadcast = useRef(0);

	// Delta-gate snapshots for VR hand broadcast. When the current wrist/finger
	// pose is ~identical to the last one we sent, we skip the hand payload and
	// send a body-only state update instead (still at ~30 Hz so position/head
	// continue to flow, but without the 53-byte-per-hand fingers cost).
	const _netLastLeftFingers = useRef(new Float32Array(60));
	const _netLastRightFingers = useRef(new Float32Array(60));
	const _netLastLeftWrist = useRef(new Float32Array([0, 0, 0, 1]));
	const _netLastRightWrist = useRef(new Float32Array([0, 0, 0, 1]));
	const _netLastVRSentHands = useRef(false);
	// VR locomotion action derivation — track the avatar's horizontal speed
	// (VR users move via locomotion/teleport, not WASD, so the desktop
	// action machine never sees their movement).
	const _netLastVRPos = useRef(new Vector3());
	const _netLastVRPosTime = useRef(0);
	const _netVRPosInit = useRef(false);

	// Reusable Euler for broadcast-path quaternion conversion (avoids `new Euler`
	// allocations on every state send).
	const _tmpBroadcastEuler = useRef(new Euler());

	function isHandOpen(hand, xrFrame, refSpace) {
		const wristJoint = hand.get('wrist');
		const indexTip = hand.get('index-finger-tip');
		const middleTip = hand.get('middle-finger-tip');
		if (!wristJoint || !indexTip || !middleTip) return false;

		const wristPose = xrFrame.getJointPose(wristJoint, refSpace);
		const indexPose = xrFrame.getJointPose(indexTip, refSpace);
		const middlePose = xrFrame.getJointPose(middleTip, refSpace);
		if (!wristPose || !indexPose || !middlePose) return false;

		const wp = wristPose.transform.position;
		const ip = indexPose.transform.position;
		const mp = middlePose.transform.position;

		const indexDist = Math.sqrt(
			(ip.x - wp.x) ** 2 + (ip.y - wp.y) ** 2 + (ip.z - wp.z) ** 2
		);
		const middleDist = Math.sqrt(
			(mp.x - wp.x) ** 2 + (mp.y - wp.y) ** 2 + (mp.z - wp.z) ** 2
		);

		return indexDist > 0.10 && middleDist > 0.10;
	}

	function calibrateFingerCorrections(humanoid, hand, fingerMap, xrFrame, refSpace, originQuat) {
		const corrections = {};
		for (const [xrJointName, vrmBoneName] of fingerMap) {
			const jointSpace = hand.get(xrJointName);
			if (!jointSpace) continue;
			const vrmBone = humanoid.getNormalizedBoneNode(vrmBoneName);
			if (!vrmBone) continue;

			const jointPose = xrFrame.getJointPose(jointSpace, refSpace);
			if (!jointPose) continue;

			const o = jointPose.transform.orientation;
			_fingerWorldQuat.current.set(o.x, o.y, o.z, o.w);
			_fingerWorldQuat.current.premultiply(originQuat);

			vrmBone.updateWorldMatrix(true, false);
			const vrmRestWorld = new Quaternion();
			vrmBone.getWorldQuaternion(vrmRestWorld);

			const correction = new Quaternion().copy(_fingerWorldQuat.current).invert().multiply(vrmRestWorld);
			corrections[xrJointName] = correction;
		}
		return corrections;
	}

	function applyFingerTracking(humanoid, hand, fingerMap, corrections, xrFrame, refSpace, originQuat) {
		if (!corrections) return;
		for (const [xrJointName, vrmBoneName] of fingerMap) {
			const jointSpace = hand.get(xrJointName);
			if (!jointSpace) continue;
			const vrmBone = humanoid.getNormalizedBoneNode(vrmBoneName);
			if (!vrmBone) continue;
			const correction = corrections[xrJointName];
			if (!correction) continue;

			const jointPose = xrFrame.getJointPose(jointSpace, refSpace);
			if (!jointPose) continue;

			const o = jointPose.transform.orientation;
			_fingerWorldQuat.current.set(o.x, o.y, o.z, o.w);
			_fingerWorldQuat.current.premultiply(originQuat);

			_fingerTempQuat.current.copy(_fingerWorldQuat.current).multiply(correction);

			if (vrmBone.parent) {
				vrmBone.parent.updateWorldMatrix(true, false);
				vrmBone.parent.getWorldQuaternion(_fingerParentInv.current);
				_fingerParentInv.current.invert();
				vrmBone.quaternion.copy(_fingerParentInv.current).multiply(_fingerTempQuat.current);
			} else {
				vrmBone.quaternion.copy(_fingerTempQuat.current);
			}

			vrmBone.updateMatrix();
		}
	}

	/**
	 * CCD IK solver that properly converts world-space corrections to local bone space.
	 * Without the parent-space conversion, rotations compound incorrectly on deep bone chains.
	 */
	function solveArmIK(chain, targetWorldPos, iterations) {
		if (!chain || chain.length < 2) return;
		const endBone = chain[chain.length - 1];

		for (let iter = 0; iter < iterations; iter++) {
			for (let j = chain.length - 2; j >= 0; j--) {
				const bone = chain[j];

				// Ensure world matrices are current
				bone.updateWorldMatrix(true, true);
				bone.getWorldPosition(_ikBoneWorld.current);

				endBone.updateWorldMatrix(true, false);
				endBone.getWorldPosition(_ikEndEffector.current);

				_ikToChild.current.subVectors(_ikEndEffector.current, _ikBoneWorld.current);
				_ikToTarget.current.subVectors(targetWorldPos, _ikBoneWorld.current);

				const childLen = _ikToChild.current.length();
				const targetLen = _ikToTarget.current.length();
				if (childLen < 0.001 || targetLen < 0.001) continue;

				_ikToChild.current.divideScalar(childLen);
				_ikToTarget.current.divideScalar(targetLen);

				// World-space correction rotation
				_ikQuat.current.setFromUnitVectors(_ikToChild.current, _ikToTarget.current);

				// Weight: shoulder moves less, elbow moves more
				const weight = j === 0 ? 0.35 : 0.65;
				_ikTempQuat.current.identity().slerp(_ikQuat.current, weight);

				// CRITICAL: Convert world-space rotation to bone's local space
				// worldCorrection in local space = parentWorldQuat^-1 * worldCorrection * parentWorldQuat
				if (bone.parent) {
					bone.parent.getWorldQuaternion(_ikTempQuat2.current);
					const parentInv = _ikParentQuatInv.current.copy(_ikTempQuat2.current).invert();
					// localCorrection = parentInv * worldCorrection * parentWorld
					_ikTempQuat.current.premultiply(parentInv);
					_ikTempQuat.current.multiply(_ikTempQuat2.current);
				}

				bone.quaternion.premultiply(_ikTempQuat.current);
				bone.updateMatrix();
				bone.updateMatrixWorld(true);
			}
		}
	}

	/**
	 * Same CCD solve as solveArmIK — identical correction math, weights, and
	 * iteration order — but the chain's world transforms are tracked manually
	 * in local math instead of round-tripping through the scene graph. The
	 * original called bone.updateWorldMatrix(true, true) per joint per
	 * iteration, cascading matrix updates over the entire arm subtree
	 * (lower arm + hand + 15 finger bones) ~60 times per arm per frame; here
	 * each step refreshes at most 3 quaternion multiplies + 2 vector
	 * transforms. Callers batch one real updateMatrixWorld after the solve.
	 *
	 * Assumes ancestor world matrices are current when called and that the
	 * avatar rig carries uniform scale (true for VRM normalized bone nodes).
	 */
	function solveArmIKFast(chain, targetWorldPos, iterations) {
		if (!chain || chain.length < 2) return;
		const parent = chain[0].parent;
		if (!parent) return;
		const n = chain.length;
		const Qw = _ikChainQw.current;
		const Pw = _ikChainPw.current;

		parent.getWorldQuaternion(_ikChainParentQw.current);
		parent.getWorldPosition(_ikChainParentPw.current);
		parent.getWorldScale(_ikChainScale.current);
		const scale = _ikChainScale.current.x;

		const composeFrom = (start) => {
			for (let i = start; i < n; i++) {
				const prevQ = i === 0 ? _ikChainParentQw.current : Qw[i - 1];
				const prevP = i === 0 ? _ikChainParentPw.current : Pw[i - 1];
				Pw[i].copy(chain[i].position)
					.multiplyScalar(scale)
					.applyQuaternion(prevQ)
					.add(prevP);
				Qw[i].copy(prevQ).multiply(chain[i].quaternion);
			}
		};
		composeFrom(0);

		for (let iter = 0; iter < iterations; iter++) {
			for (let j = n - 2; j >= 0; j--) {
				_ikToChild.current.subVectors(Pw[n - 1], Pw[j]);
				_ikToTarget.current.subVectors(targetWorldPos, Pw[j]);

				const childLen = _ikToChild.current.length();
				const targetLen = _ikToTarget.current.length();
				if (childLen < 0.001 || targetLen < 0.001) continue;

				_ikToChild.current.divideScalar(childLen);
				_ikToTarget.current.divideScalar(targetLen);

				// World-space correction rotation
				_ikQuat.current.setFromUnitVectors(_ikToChild.current, _ikToTarget.current);

				// Weight: shoulder moves less, elbow moves more
				const weight = j === 0 ? 0.35 : 0.65;
				_ikTempQuat.current.identity().slerp(_ikQuat.current, weight);

				// Convert world-space rotation to bone-local space:
				// localCorrection = parentWorldQuat^-1 * worldCorrection * parentWorldQuat
				const pQ = j === 0 ? _ikChainParentQw.current : Qw[j - 1];
				_ikParentQuatInv.current.copy(pQ).invert();
				_ikTempQuat.current.premultiply(_ikParentQuatInv.current).multiply(pQ);

				chain[j].quaternion.premultiply(_ikTempQuat.current);
				composeFrom(j);
			}
		}

		// Local matrices only — the caller runs one updateMatrixWorld cascade
		// for the whole arm after hand orientation / forearm twist land.
		for (let i = 0; i < n - 1; i++) chain[i].updateMatrix();
	}

	const leftControllerState = props.leftControllerState;
	const rightControllerState = props.rightControllerState;

	/**
	 * Gets the world-space grip position/rotation from an XR controller or hand state.
	 * Tries state.object first (from XRControllerModel), falls back to raw WebXR gripSpace.
	 */
	const applyRefSpacePose = (pose, outPos, outQuat) => {
		const p = pose.transform.position;
		const o = pose.transform.orientation;
		outPos.set(p.x, p.y, p.z);
		if (xrOriginRef?.current) {
			xrOriginRef.current.updateWorldMatrix(true, false);
			outPos.applyMatrix4(xrOriginRef.current.matrixWorld);
		}
		if (outQuat) {
			outQuat.set(o.x, o.y, o.z, o.w);
			if (xrOriginRef?.current) {
				_ikTempQuat.current.setFromRotationMatrix(xrOriginRef.current.matrixWorld);
				outQuat.premultiply(_ikTempQuat.current);
			}
		}
	};

	const getGripWorldPosition = (controllerState, outPos, outQuat, xrFrame) => {
		if (!controllerState) return false;

		// Path 1: use the Object3D that @react-three/xr positions via XRSpace.
		// Available when hand/controller model is loaded (model: { colorWrite: false }).
		// NOT available when model: false (used for hands to avoid rendering default mesh).
		if (controllerState.object && typeof controllerState.object.getWorldPosition === 'function') {
			controllerState.object.updateWorldMatrix(true, false);
			controllerState.object.getWorldPosition(outPos);
			if (outQuat) controllerState.object.getWorldQuaternion(outQuat);
			return true;
		}

		const refSpace = xrFrame ? gl.xr.getReferenceSpace() : null;

		// Path 2: read gripSpace pose directly from XRFrame.
		// Works for controllers and hands (hands have a synthesized grip from the hand pose).
		const gripSpace = controllerState.inputSource?.gripSpace;
		if (gripSpace && xrFrame && refSpace) {
			const pose = xrFrame.getPose(gripSpace, refSpace);
			if (pose) {
				applyRefSpacePose(pose, outPos, outQuat);
				return true;
			}
		}

		// Path 3: for hand tracking, read the wrist joint directly.
		// This is the most reliable fallback for hand-tracked devices (Vision Pro, Quest hand mode)
		// where gripSpace may not be available or state.object is null (model: false).
		const hand = controllerState.inputSource?.hand;
		if (hand && xrFrame && refSpace) {
			const wristSpace = hand.get('wrist');
			if (wristSpace) {
				const pose = xrFrame.getPose(wristSpace, refSpace);
				if (pose) {
					applyRefSpacePose(pose, outPos, outQuat);
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Shortest-path angle difference, clamped to [-PI, PI]
	 */
	function angleDiff(a, b) {
		let d = a - b;
		while (d > Math.PI) d -= Math.PI * 2;
		while (d < -Math.PI) d += Math.PI * 2;
		return d;
	}

	useFrame((state, delta, xrFrame) => {
		if (!isPresenting || !playerControllerRef.current) return;

		const vrm = playerControllerRef.current;
		const humanoid = vrm.humanoid;
		if (!humanoid) return;

		const vrmScene = vrm.scene;
		if (!vrmScene) return;

		vrmScene.rotation.x = 0;
		vrmScene.rotation.z = 0;

		if (_ikSwimBlend.current > 0.01 && animationsRef.current) {
			const { swimIdle, swim, idle } = animationsRef.current;
			if (swimIdle) {
				swimIdle.setEffectiveWeight(_ikSwimBlend.current * 0.6);
				swimIdle.play();
			}
			if (swim) {
				swim.setEffectiveWeight(_ikSwimBlend.current * 0.4);
				swim.play();
			}
			if (idle) {
				idle.setEffectiveWeight(Math.max(0, (1 - _ikSwimBlend.current) * 0.4));
			}
		}

		// ─── 1. Get XR camera world position/rotation ───
		// updateWorldMatrix(true, false) ensures parent chain (XROrigin) is current
		const xrCam = gl.xr.getCamera();
		xrCam.updateWorldMatrix(true, false);
		xrCam.getWorldPosition(_ikCamPos.current);
		xrCam.getWorldQuaternion(_ikCamQuat.current);

		// Head forward direction (horizontal component only for yaw)
		const camFwd = _tmpVec3A.current.set(0, 0, -1).applyQuaternion(_ikCamQuat.current);
		const headYaw = Math.atan2(camFwd.x, camFwd.z);

		// ─── 2. Body yaw: smoothly follows head, NOT locked to it ───
		// The body should face roughly where you're looking, but with inertia.
		// Only rotates when head turns significantly away from body.
		if (!_ikBodyYawInitialized.current) {
			_ikBodyYaw.current = headYaw;
			_ikBodyYawInitialized.current = true;
		}

		const yawDiff = angleDiff(headYaw, _ikBodyYaw.current);
		// Dead zone: body doesn't rotate if head is within ±30° of body forward
		const BODY_YAW_DEAD_ZONE = 0.52; // ~30 degrees
		const BODY_YAW_MAX = 1.22; // ~70 degrees — beyond this, force body to catch up
		const BODY_YAW_SPEED = 2.5; // radians/sec base turn speed

		if (Math.abs(yawDiff) > BODY_YAW_MAX) {
			// Head turned too far — body MUST catch up
			const excess = Math.abs(yawDiff) - BODY_YAW_DEAD_ZONE;
			const catchUpSpeed = BODY_YAW_SPEED + excess * 3.0;
			_ikBodyYaw.current += Math.sign(yawDiff) * Math.min(catchUpSpeed * delta, Math.abs(yawDiff) - BODY_YAW_DEAD_ZONE);
		} else if (Math.abs(yawDiff) > BODY_YAW_DEAD_ZONE) {
			// Gentle follow
			const excess = Math.abs(yawDiff) - BODY_YAW_DEAD_ZONE;
			_ikBodyYaw.current += Math.sign(yawDiff) * Math.min(BODY_YAW_SPEED * delta, excess);
		}
		// else: within dead zone, body stays put

		// ─── 3. Position avatar group at camera XZ, floor Y, body yaw ───
		const waterLevel = props.waterLevel !== undefined ? props.waterLevel : -12;
		const xrSwimThreshold = waterLevel + 0.8;
		const xrIsInWater = _ikCamPos.current.y <= xrSwimThreshold && _ikCamPos.current.y > waterLevel - 20;

		if (xrIsInWater && _ikSwimBlend.current < 1) {
			_ikSwimBlend.current = Math.min(1, _ikSwimBlend.current + delta * 3);
		} else if (!xrIsInWater && _ikSwimBlend.current > 0) {
			_ikSwimBlend.current = Math.max(0, _ikSwimBlend.current - delta * 3);
		}

		const targetSwimSpinePitch = xrIsInWater ? 0.35 : 0;
		_ikSwimSpinePitch.current += (targetSwimSpinePitch - _ikSwimSpinePitch.current) * Math.min(1, delta * 4);

		const bodyFwdX = Math.sin(_ikBodyYaw.current);
		const bodyFwdZ = Math.cos(_ikBodyYaw.current);
		let headForwardOffset = 0;
		if (xrOriginRef?.current) {
			const dx = _ikCamPos.current.x - xrOriginRef.current.position.x;
			const dz = _ikCamPos.current.z - xrOriginRef.current.position.z;
			headForwardOffset = dx * bodyFwdX + dz * bodyFwdZ;
		}

		const camFwdForPitch = _tmpVec3B.current.set(0, 0, -1).applyQuaternion(_ikCamQuat.current);
		const currentPitch = Math.asin(Math.max(-1, Math.min(1, -camFwdForPitch.y)));
		const leanConditionMet = headForwardOffset > LEAN_FORWARD_THRESHOLD && currentPitch < LEAN_PITCH_THRESHOLD;
		_ikLeanActive.current = leanConditionMet;
		const leanTarget = _ikLeanActive.current ? 1 : 0;
		_ikLeanBlend.current += (leanTarget - _ikLeanBlend.current) * Math.min(1, delta * 6);
		_ikLeanSpinePitch.current = LEAN_SNAP_PITCH * _ikLeanBlend.current;

		if (xrAvatarGroupRef.current) {
			let floorY = _ikCamPos.current.y - (props.avatarHeightOffset?.current || 1.5);

			if (_ikSwimBlend.current > 0.01) {
				const shoulderSurfaceY = waterLevel - 0.3;
				floorY = floorY * (1 - _ikSwimBlend.current) + shoulderSurfaceY * _ikSwimBlend.current;
			}

			const leanOffsetX = _ikLeanBlend.current * bodyFwdX * -0.15;
			const leanOffsetZ = _ikLeanBlend.current * bodyFwdZ * -0.15;
			xrAvatarGroupRef.current.position.set(
				_ikCamPos.current.x + leanOffsetX,
				floorY,
				_ikCamPos.current.z + leanOffsetZ
			);
			const groupYaw = _ikBodyYaw.current - Math.PI + _ikVrmBaseYaw.current;
			xrAvatarGroupRef.current.rotation.set(0, groupYaw, 0);
			xrAvatarGroupRef.current.updateMatrix();
			// Ancestors + self only. The full-avatar cascade that used to run
			// here is deferred: torso bones below write local quaternions
			// first, then ONE updateMatrixWorld covers the whole rig before
			// the arm solves (which are the only mid-frame world readers).
			xrAvatarGroupRef.current.updateWorldMatrix(true, false);
		}

		// ─── 4. Hips positioning ───
		const hipsBone = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Hips);
		const spineBone = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Spine);
		const chestBone = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Chest);
		const neckBone = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck);
		const headBone = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);

		// Capture rest poses on first frame
		if (!_ikSpineRestCaptured.current && spineBone) {
			_ikSpineRestQuat.current.copy(spineBone.quaternion);
			if (chestBone) _ikChestRestQuat.current.copy(chestBone.quaternion);
			_ikSpineRestCaptured.current = true;
		}
		if (!_ikNeckRestCaptured.current && neckBone) {
			_ikNeckRestQuat.current.copy(neckBone.quaternion);
			_ikNeckRestCaptured.current = true;
		}

		if (hipsBone) {
			// Place hips in local VRM space below the camera. The group above
			// no longer cascades to children, so refresh vrmScene's own world
			// matrix (ancestor walk only) before inverting it.
			vrmScene.updateWorldMatrix(true, false);
			_ikMat4.current.copy(vrmScene.matrixWorld).invert();
			_ikHipsPos.current.copy(_ikCamPos.current).applyMatrix4(_ikMat4.current);
			hipsBone.position.x = 0;
			hipsBone.position.z = 0;
			hipsBone.position.y = _ikHipsPos.current.y - xrHeadToHipsOffset.current;
			hipsBone.quaternion.identity();
			hipsBone.updateMatrix();
		}

		// ─── 5. Spine/Neck/Head: distribute head-look rotation ───
		// Head look relative to body = headYaw - bodyYaw (the part NOT handled by body rotation)
		const localHeadYaw = angleDiff(headYaw, _ikBodyYaw.current);
		const camPitch = Math.asin(Math.max(-1, Math.min(1, -camFwd.y)));

		// Capture head rest quaternion once
		if (!_ikHeadRestCaptured.current && headBone) {
			_ikHeadRestQuat.current.copy(headBone.quaternion);
			_ikHeadRestCaptured.current = true;
		}

		if (spineBone && neckBone) {
			const spinePitch = camPitch * 0.10 + _ikSwimSpinePitch.current + _ikLeanSpinePitch.current;
			const spineYaw = localHeadYaw * 0.10;
			const neckPitch = camPitch * 0.30;
			const neckYaw = localHeadYaw * 0.35;

			_ikTempEuler.current.set(spinePitch, spineYaw, 0, 'YXZ');
			_ikTempQuat.current.setFromEuler(_ikTempEuler.current);
			spineBone.quaternion.copy(_ikSpineRestQuat.current).multiply(_ikTempQuat.current);
			spineBone.updateMatrix();

			// Chest (if exists): keep at rest — no contribution
			if (chestBone) {
				chestBone.quaternion.copy(_ikChestRestQuat.current);
				chestBone.updateMatrix();
			}

			// Neck: moderate pitch + yaw
			_ikTempEuler.current.set(neckPitch, neckYaw, 0, 'YXZ');
			_ikTempQuat.current.setFromEuler(_ikTempEuler.current);
			neckBone.quaternion.copy(_ikNeckRestQuat.current).multiply(_ikTempQuat.current);
			neckBone.updateMatrix();
		} else if (neckBone) {
			// No spine — neck handles more
			_ikTempEuler.current.set(camPitch * 0.4, localHeadYaw * 0.45, 0, 'YXZ');
			_ikTempQuat.current.setFromEuler(_ikTempEuler.current);
			neckBone.quaternion.copy(_ikNeckRestQuat.current).multiply(_ikTempQuat.current);
			neckBone.updateMatrix();
		}

		// Head: the remaining pitch + yaw, applied on top of head rest quaternion
		if (headBone) {
			const headPitch = camPitch * 0.60;
			const headYawLocal = localHeadYaw * 0.55;
			_ikTempEuler.current.set(headPitch, headYawLocal, 0, 'YXZ');
			_ikTempQuat.current.setFromEuler(_ikTempEuler.current);
			headBone.quaternion.copy(_ikHeadRestQuat.current).multiply(_ikTempQuat.current);
			headBone.updateMatrix();
		}

		// ONE world-matrix cascade for the whole rig now that every torso
		// bone's local transform is final. This replaces the six separate
		// full-subtree cascades (group + hips + spine + chest + neck + head)
		// that each re-walked the entire remaining skeleton per frame. The
		// arm solves below are the only mid-frame consumers of these world
		// matrices; the renderer refreshes everything again at draw time.
		vrmScene.updateMatrixWorld(true);

		// ─── 6. Left Arm IK ───
		const leftUpperArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm);
		const leftLowerArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm);
		const leftHand = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftHand);
		const hasLeftGrip = getGripWorldPosition(leftControllerState, _ikCtrlPosL.current, _ikCtrlQuatL.current, xrFrame);

		if (leftUpperArm && leftLowerArm && leftHand) {
			if (hasLeftGrip) {
				// Controller tracked — solve IK
				_ikLeftArmBlend.current = Math.max(0, _ikLeftArmBlend.current - delta * 6);

				// Start from rest pose and blend toward IK solution
				if (_ikLeftArmBlend.current > 0.01) {
					leftUpperArm.quaternion.slerp(_REST_LEFT_UPPER_ARM.current, _ikLeftArmBlend.current);
					leftLowerArm.quaternion.slerp(_REST_LEFT_LOWER_ARM.current, _ikLeftArmBlend.current);
					leftHand.quaternion.slerp(_REST_LEFT_HAND.current, _ikLeftArmBlend.current);
				}

				if (_ikUseClassicSolver.current) {
					leftUpperArm.updateMatrix();
					leftUpperArm.updateMatrixWorld(true);
					solveArmIK([leftUpperArm, leftLowerArm, leftHand], _ikCtrlPosL.current, 10);
				} else {
					solveArmIKFast([leftUpperArm, leftLowerArm, leftHand], _ikCtrlPosL.current, 10);
				}

				// Orient the hand bone to match input device rotation with coordinate system correction.
				// The gripSpace axes don't align with VRM hand bone axes — we need a correction
				// that differs between physical controllers and tracked hands.
				if (leftHand.parent) {
					leftHand.parent.updateWorldMatrix(true, false);
					leftHand.parent.getWorldQuaternion(_ikParentQuatInv.current);
					_ikParentQuatInv.current.invert();
					leftHand.quaternion.copy(_ikParentQuatInv.current).multiply(_ikCtrlQuatL.current);
					const isHandInput = !!(leftControllerState?.type === 'hand' || leftControllerState?.inputSource?.hand);
					const correction = isHandInput ? _GRIP_TO_VRM_LEFT_HAND.current : _GRIP_TO_VRM_LEFT_CTRL.current;
					leftHand.quaternion.multiply(correction);

					// Forearm twist: extract twist component of the hand rotation around
					// the forearm axis and apply a fraction to the lower arm bone.
					// VRM left forearm axis is roughly along local -X (toward hand).
					_ikForearmTwistAxis.current.set(-1, 0, 0); // left forearm bone axis
					const handLocalQ = leftHand.quaternion;
					// Swing-twist decomposition: project rotation onto twist axis
					const dot = _ikForearmTwistAxis.current.x * handLocalQ.x +
					            _ikForearmTwistAxis.current.y * handLocalQ.y +
					            _ikForearmTwistAxis.current.z * handLocalQ.z;
					_ikForearmTwistQuat.current.set(
						_ikForearmTwistAxis.current.x * dot,
						_ikForearmTwistAxis.current.y * dot,
						_ikForearmTwistAxis.current.z * dot,
						handLocalQ.w
					).normalize();
					// Apply a fraction of this twist to the forearm
					_ikForearmTwistQuat.current.slerp(_ikTempQuat2.current.identity(), 1.0 - FOREARM_TWIST_FACTOR);
					leftLowerArm.quaternion.multiply(_ikForearmTwistQuat.current);
					leftLowerArm.updateMatrix();
				}
			} else {
				// No controller — blend to rest pose
				_ikLeftArmBlend.current = Math.min(1, _ikLeftArmBlend.current + delta * 3);
				const b = _ikLeftArmBlend.current;
				leftUpperArm.quaternion.slerp(_REST_LEFT_UPPER_ARM.current, b);
				leftLowerArm.quaternion.slerp(_REST_LEFT_LOWER_ARM.current, b);
				leftHand.quaternion.slerp(_REST_LEFT_HAND.current, b);
			}
			leftUpperArm.updateMatrix();
			leftUpperArm.updateMatrixWorld(true);
		}

		// ─── 7. Right Arm IK ───
		const rightUpperArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
		const rightLowerArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm);
		const rightHand = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightHand);
		const hasRightGrip = getGripWorldPosition(rightControllerState, _ikCtrlPosR.current, _ikCtrlQuatR.current, xrFrame);

		if (rightUpperArm && rightLowerArm && rightHand) {
			if (hasRightGrip) {
				_ikRightArmBlend.current = Math.max(0, _ikRightArmBlend.current - delta * 6);

				if (_ikRightArmBlend.current > 0.01) {
					rightUpperArm.quaternion.slerp(_REST_RIGHT_UPPER_ARM.current, _ikRightArmBlend.current);
					rightLowerArm.quaternion.slerp(_REST_RIGHT_LOWER_ARM.current, _ikRightArmBlend.current);
					rightHand.quaternion.slerp(_REST_RIGHT_HAND.current, _ikRightArmBlend.current);
				}

				if (_ikUseClassicSolver.current) {
					rightUpperArm.updateMatrix();
					rightUpperArm.updateMatrixWorld(true);
					solveArmIK([rightUpperArm, rightLowerArm, rightHand], _ikCtrlPosR.current, 10);
				} else {
					solveArmIKFast([rightUpperArm, rightLowerArm, rightHand], _ikCtrlPosR.current, 10);
				}

				if (rightHand.parent) {
					rightHand.parent.updateWorldMatrix(true, false);
					rightHand.parent.getWorldQuaternion(_ikParentQuatInv.current);
					_ikParentQuatInv.current.invert();
					rightHand.quaternion.copy(_ikParentQuatInv.current).multiply(_ikCtrlQuatR.current);
					const isHandInput = !!(rightControllerState?.type === 'hand' || rightControllerState?.inputSource?.hand);
					const correction = isHandInput ? _GRIP_TO_VRM_RIGHT_HAND.current : _GRIP_TO_VRM_RIGHT_CTRL.current;
					rightHand.quaternion.multiply(correction);

					// Forearm twist for right arm (axis is +X for right)
					_ikForearmTwistAxis.current.set(1, 0, 0);
					const rHandLocalQ = rightHand.quaternion;
					const rDot = _ikForearmTwistAxis.current.x * rHandLocalQ.x +
					             _ikForearmTwistAxis.current.y * rHandLocalQ.y +
					             _ikForearmTwistAxis.current.z * rHandLocalQ.z;
					_ikForearmTwistQuat.current.set(
						_ikForearmTwistAxis.current.x * rDot,
						_ikForearmTwistAxis.current.y * rDot,
						_ikForearmTwistAxis.current.z * rDot,
						rHandLocalQ.w
					).normalize();
					_ikForearmTwistQuat.current.slerp(_ikTempQuat2.current.identity(), 1.0 - FOREARM_TWIST_FACTOR);
					rightLowerArm.quaternion.multiply(_ikForearmTwistQuat.current);
					rightLowerArm.updateMatrix();
				}
			} else {
				_ikRightArmBlend.current = Math.min(1, _ikRightArmBlend.current + delta * 3);
				const b = _ikRightArmBlend.current;
				rightUpperArm.quaternion.slerp(_REST_RIGHT_UPPER_ARM.current, b);
				rightLowerArm.quaternion.slerp(_REST_RIGHT_LOWER_ARM.current, b);
				rightHand.quaternion.slerp(_REST_RIGHT_HAND.current, b);
			}
			rightUpperArm.updateMatrix();
			rightUpperArm.updateMatrixWorld(true);
		}

		// ─── 8. Finger tracking ───
		if (xrFrame) {
			const refSpace = gl.xr.getReferenceSpace();
			if (refSpace) {
				_fingerOriginQuat.current.identity();
				if (xrOriginRef?.current) {
					_fingerOriginQuat.current.setFromRotationMatrix(xrOriginRef.current.matrixWorld);
				}

				const leftHand = leftControllerState?.inputSource?.hand;
				const rightHand = rightControllerState?.inputSource?.hand;
				
				const leftHandPresent = !!(leftHand && leftHand.size > 0);
				const rightHandPresent = !!(rightHand && rightHand.size > 0);

				// Recalibrate left hand if it just appeared or hasn't been calibrated yet.
				// Only calibrate when the hand is open to avoid fist-as-rest-pose errors.
				if (leftHandPresent && (!_leftHandWasPresent.current || !_fingerCalibrationLeft.current)) {
					if (isHandOpen(leftHand, xrFrame, refSpace)) {
						_fingerCalibrationLeft.current = calibrateFingerCorrections(
							humanoid, leftHand, XR_TO_VRM_FINGER_MAP_LEFT, xrFrame, refSpace, _fingerOriginQuat.current
						);
					}
				}

				if (rightHandPresent && (!_rightHandWasPresent.current || !_fingerCalibrationRight.current)) {
					if (isHandOpen(rightHand, xrFrame, refSpace)) {
						_fingerCalibrationRight.current = calibrateFingerCorrections(
							humanoid, rightHand, XR_TO_VRM_FINGER_MAP_RIGHT, xrFrame, refSpace, _fingerOriginQuat.current
						);
					}
				}

				_leftHandWasPresent.current = leftHandPresent;
				_rightHandWasPresent.current = rightHandPresent;
				
				// Mark calibrated if we have at least one hand calibration
				if (_fingerCalibrationLeft.current || _fingerCalibrationRight.current) {
					_fingerCalibrated.current = true;
				}

				// Apply finger tracking for each hand that's present and calibrated
				if (leftHandPresent && _fingerCalibrationLeft.current) {
					applyFingerTracking(
						humanoid, leftHand, XR_TO_VRM_FINGER_MAP_LEFT,
						_fingerCalibrationLeft.current, xrFrame, refSpace, _fingerOriginQuat.current
					);
				}
				if (rightHandPresent && _fingerCalibrationRight.current) {
					applyFingerTracking(
						humanoid, rightHand, XR_TO_VRM_FINGER_MAP_RIGHT,
						_fingerCalibrationRight.current, xrFrame, refSpace, _fingerOriginQuat.current
					);
				}
			}
		}

		// ─── 8b. Capture and broadcast VR state + hand data ───
		const vrNow = state.clock.elapsedTime * 1000;
		if (vrNow - _netLastVRBroadcast.current > 33) { // ~30Hz
			_netLastVRBroadcast.current = vrNow;

			const po = scene.getObjectByName("playerOne");
			if (po) {
				const worldPos = po.getWorldPosition(_tmpVec3A.current);
				// Use IK body yaw for VR rotation (smoothedRotationRef is only
				// updated by WASD input which VR users don't use)
				const vrYaw = _ikBodyYaw.current + Math.PI;
				_tmpBroadcastEuler.current.set(0, vrYaw, 0, 'YXZ');
				_tmpQuatA.current.setFromEuler(_tmpBroadcastEuler.current);

				const hasLeftFingers = captureFingerQuaternions(humanoid, LEFT_FINGER_BONES, _netLeftFingers.current);
				const hasRightFingers = captureFingerQuaternions(humanoid, RIGHT_FINGER_BONES, _netRightFingers.current);

				const leftHandBone = humanoid.getNormalizedBoneNode('leftHand');
				const rightHandBone = humanoid.getNormalizedBoneNode('rightHand');

				// Capture arm bone quaternions from the IK solution
				const leftUpperArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm);
				const leftLowerArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm);
				const rightUpperArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
				const rightLowerArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm);

				// Determine swim state from actual VRM world position, not physics body.
				// In VR, the physics body may not track teleportation, so isSwimmingRef
				// can be stale. Use the VRM's actual Y position instead.
				const vrSwimThreshold = (props.waterLevel ?? -12) + 0.8;
				const vrIsSwimming = !isFlyingRef.current && worldPos.y <= vrSwimThreshold;

				// Locomotion action from horizontal speed — VR senders used to
				// hardcode 'idle', so moving VR peers never walk/run on remote
				// clients. Thresholds: walk ≥0.5 m/s, run ≥3 m/s. Teleport-style
				// jumps (huge instantaneous speed) clamp back to idle.
				let vrAction = 'idle';
				if (_netVRPosInit.current) {
					const dtSec = Math.max(0.001, (vrNow - _netLastVRPosTime.current) / 1000);
					const dx = worldPos.x - _netLastVRPos.current.x;
					const dz = worldPos.z - _netLastVRPos.current.z;
					const speed = Math.hypot(dx, dz) / dtSec;
					if (speed >= 20) vrAction = 'idle';        // teleport snap
					else if (speed >= 3) vrAction = 'running';
					else if (speed >= 0.5) vrAction = 'walking';
				}
				_netLastVRPos.current.copy(worldPos);
				_netLastVRPosTime.current = vrNow;
				_netVRPosInit.current = true;

				// Explicit VR presence bits (protocol mask bit 7) so receivers
				// can clear stale hand poses the moment tracking drops.
				const hasLeftFingersEarly = !!_fingerCalibrationLeft.current;
				const hasRightFingersEarly = !!_fingerCalibrationRight.current;
				const vrFlags = 0x01
					| (hasLeftFingersEarly ? 0x02 : 0)
					| (hasRightFingersEarly ? 0x04 : 0);

				// Delta gate: only include hand/finger/arm payload when pose
				// changed meaningfully vs last send. Saves ~110 bytes/peer/frame
				// of finger+wrist data when the sender is idle. Position is
				// always broadcast via the no-hand branch when skipping.
				const FINGER_DELTA_THRESHOLD = 0.015;   // summed |Δquat| across 60 floats
				const WRIST_DOT_THRESHOLD = 0.9998;      // ≈ 1.1° rotation change
				const leftFingerDelta = _sumAbsDelta(_netLeftFingers.current, _netLastLeftFingers.current);
				const rightFingerDelta = _sumAbsDelta(_netRightFingers.current, _netLastRightFingers.current);
				const leftWristChanged = leftHandBone
					? _quatDot(_netLastLeftWrist.current, leftHandBone.quaternion) < WRIST_DOT_THRESHOLD
					: false;
				const rightWristChanged = rightHandBone
					? _quatDot(_netLastRightWrist.current, rightHandBone.quaternion) < WRIST_DOT_THRESHOLD
					: false;
				const handPoseChanged = leftFingerDelta > FINGER_DELTA_THRESHOLD
					|| rightFingerDelta > FINGER_DELTA_THRESHOLD
					|| leftWristChanged || rightWristChanged
					|| !_netLastVRSentHands.current;

				// Always broadcast position/rotation/head — include hands if
				// captured AND pose has changed.
				if ((hasLeftFingers || hasRightFingers) && handPoseChanged) {
					_netLastVRSentHands.current = true;
					_netLastLeftFingers.current.set(_netLeftFingers.current);
					_netLastRightFingers.current.set(_netRightFingers.current);
					if (leftHandBone) {
						_netLastLeftWrist.current[0] = leftHandBone.quaternion.x;
						_netLastLeftWrist.current[1] = leftHandBone.quaternion.y;
						_netLastLeftWrist.current[2] = leftHandBone.quaternion.z;
						_netLastLeftWrist.current[3] = leftHandBone.quaternion.w;
					}
					if (rightHandBone) {
						_netLastRightWrist.current[0] = rightHandBone.quaternion.x;
						_netLastRightWrist.current[1] = rightHandBone.quaternion.y;
						_netLastRightWrist.current[2] = rightHandBone.quaternion.z;
						_netLastRightWrist.current[3] = rightHandBone.quaternion.w;
					}

					networkBridge.sendStateVR({
						position: [worldPos.x, worldPos.y, worldPos.z],
						rotation: [_tmpQuatA.current.x, _tmpQuatA.current.y, _tmpQuatA.current.z, _tmpQuatA.current.w],
						action: vrAction,
						hangtime: 0,
						vrFlags,
						isSwimming: vrIsSwimming,
						isFlying: isFlyingRef.current,
						isBoosting: isBoostingRef.current,
						swimBlend: swimMoveBlendRef.current,
						flyPoseTime: flyPoseTimeRef.current,
						headQuat: [_ikCamQuat.current.x, _ikCamQuat.current.y, _ikCamQuat.current.z, _ikCamQuat.current.w],
						leftWristQuat: leftHandBone
							? [leftHandBone.quaternion.x, leftHandBone.quaternion.y, leftHandBone.quaternion.z, leftHandBone.quaternion.w]
							: [0, 0, 0, 1],
						leftFingers: _netLeftFingers.current,
						rightWristQuat: rightHandBone
							? [rightHandBone.quaternion.x, rightHandBone.quaternion.y, rightHandBone.quaternion.z, rightHandBone.quaternion.w]
							: [0, 0, 0, 1],
						rightFingers: _netRightFingers.current,
						// Arm IK bone data (passed through legacy JSON as extra fields)
						leftUpperArmQuat: leftUpperArm
							? [leftUpperArm.quaternion.x, leftUpperArm.quaternion.y, leftUpperArm.quaternion.z, leftUpperArm.quaternion.w]
							: undefined,
						leftLowerArmQuat: leftLowerArm
							? [leftLowerArm.quaternion.x, leftLowerArm.quaternion.y, leftLowerArm.quaternion.z, leftLowerArm.quaternion.w]
							: undefined,
						rightUpperArmQuat: rightUpperArm
							? [rightUpperArm.quaternion.x, rightUpperArm.quaternion.y, rightUpperArm.quaternion.z, rightUpperArm.quaternion.w]
							: undefined,
						rightLowerArmQuat: rightLowerArm
							? [rightLowerArm.quaternion.x, rightLowerArm.quaternion.y, rightLowerArm.quaternion.z, rightLowerArm.quaternion.w]
							: undefined,
					}, userData);
				} else {
					// No hand tracking — still broadcast position, rotation, head at 30Hz
					networkBridge.sendState({
						position: [worldPos.x, worldPos.y, worldPos.z],
						rotation: [_tmpQuatA.current.x, _tmpQuatA.current.y, _tmpQuatA.current.z, _tmpQuatA.current.w],
						action: vrAction,
						hangtime: 0,
						vrFlags,
						isSwimming: vrIsSwimming,
						isFlying: isFlyingRef.current,
						isBoosting: isBoostingRef.current,
						swimBlend: swimMoveBlendRef.current,
						flyPoseTime: flyPoseTimeRef.current,
					}, userData);
				}
			}
		}

		// ─── 9. Finalize VRM ───
		humanoid.update();
		if (vrm.nodeConstraintManager) {
			vrm.nodeConstraintManager.update();
		}
		if (vrm.springBoneManager) {
			vrm.springBoneManager.update(delta);
		}
		if (vrm.expressionManager) {
			vrm.expressionManager.update();
		}
	});  
	  const keyboardMap = [
		{ name: "forward", keys: ["ArrowUp", "KeyW"] },
		{ name: "backward", keys: ["ArrowDown", "KeyS"] },
		{ name: "leftward", keys: ["ArrowLeft", "KeyA"] },
		{ name: "rightward", keys: ["ArrowRight", "KeyD"] },
		{ name: "jump", keys: ["Space"] },
		{ name: "run", keys: ["Shift"] },
		// Optional animation key map
		{ name: "action1", keys: ["1"] },
		{ name: "action2", keys: ["2"] },
		{ name: "action3", keys: ["3"] },
		{ name: "action4", keys: ["Digit4"] },
		{ name: "interact", keys: ["KeyE"] },
	];

	// Canvas element ref — not rendered, no need for state
	const canvasElementRef = useRef(null);

	useEffect(() => {
		const findCanvas = () => {
			let canvas = document.querySelector('canvas.xr-publisher-main-canvas');
			if (!canvas) {
				canvas = document.querySelector('canvas');
			}			
			canvasElementRef.current = canvas;
			return canvas;
		};

		const canvas = findCanvas();
		if (!canvas) {
			const interval = setInterval(() => {
				const foundCanvas = findCanvas();
				if (foundCanvas) {
					clearInterval(interval);
				}
			}, 100);
			return () => clearInterval(interval);
		}
	}, []);
	
	
	// Primitive generator input ref — not rendered, no need for state.
	// The polling was also disabled (hardcoded to false), so simplified.
	const isInputActiveRef = useRef(false);
	
	useEffect(() => {
		window.primitiveGeneratorInputActive = false;
	}, []);
	
	// Legacy cursor compatibility moved to WorldCursor component

	// Handle Escape key to stop interaction. Reads the store imperatively —
	// a React selector subscription here re-rendered the ENTIRE Player
	// (3k+ lines, ecctrl, avatar) on every E-press/chat-close frame hitch.
	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.code === 'Escape' && useInteractionStore.getState().isInteracting) {
				useInteractionStore.getState().stopInteraction();
				chatMessagesRef.current = []; // Clear chat messages
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	if (isPresenting) {
		return (
			<>
				{isModelLoaded && playerControllerRef.current && (
					<group ref={xrAvatarGroupRef}>
					<primitive
						userData={{ camExcludeCollision: true }}
						visible={true}
						name="playerOne"
						object={playerControllerRef.current.scene}
						position={[0, 0, 0]}
						castShadow
						receiveShadow
					/>
					</group>
				)}
			<InteractionMenuSystem
				characterControllerRef={characterRef}
				onMenuStateChange={handleMenuStateChange}
			/>
			</>
		);
	}

	return (
	<>
		<KeyboardControls
		map={keyboardMap}
		>
		<Ecctrl
			ref={handleEcctrlRef}
			/* FROZEN at mount: the initial body position only matters once. A
			   value that changes later (computedSpawnRef is mutated by the
			   navmesh relocation) re-triggers @react-three/rapier's
			   options-sync effect, which snaps the body back to the object's
			   stale transform — the "yanked back a cell on chunk load" bug. */
			position={initialBodyPositionRef.current}
			disableKeyboard={false}
			maxVelLimit={5}
			jumpVel={7}
			animated
			friction={0.5}
			restitution={0.0}
			springK={1.2}
			dampingC={0.08}
			camMoveSpeed={1.5}
			camZoomSpeed={1.5}
			autoBalance={true}
			autoBalanceSpringK={0.3}
			autoBalanceDampingC={0.03}
			airDragMultiplier={0.2}
			dragDampingC={0.15}
			fallingGravityScale={2.5}
			slopeUpExtraForce={0.5}
			/* Ecctrl's own camera occlusion stays OFF: its three.js Raycaster
			   walks a mesh list built once at mount (misses streamed chunks/
			   buildings) and pays per-triangle scans. Camera-vs-world occlusion
			   is provided by the rapier clamp useFrame above (priority 0.5,
			   fixed-body castRay after ecctrl's camera write) — keep this
			   false or the two systems will fight over camera.position. */
			camCollision={false}
			disableFollowCam={false}
			disableControl={isFlyingRef.current || isRiding}
			camInitDis={menuActive ? -0.01 : -5}
			camMinDis={menuActive ? -0.01 : -0.7}
			camMaxDis={menuActive ? -0.01 : -7}
			camFollowMult={menuActive ? 1000 : 11}
			camLerpMult={menuActive ? 1000 : 25}
			turnVelMultiplier={menuActive ? 1 : 0.2}
			turnSpeed={menuActive ? 100 : 15}
			camListenerTarget={"document"}
			canSleep={false}
			ccd={true}
			lockRotations={true}
			additionalSolverIterations={4}
			>
			{isModelLoaded && playerControllerRef.current && (
			<>
				<primitive
				userData={{ camExcludeCollision: true }}
				visible={true}
				name="playerOne"
				object={playerControllerRef.current.scene}
				position={[0, avatarYOffset, 0]}
				rotation={[0, 0, 0]}
				castShadow
				receiveShadow
				/>
				{avatarIsSprite && (
				<SpriteAnimator
					name="playerOneSprite"
					userData={{ camExcludeCollision: true }}
					ref={spriteRef}
					position={[0, 0, 0]}
					frameName={frameNameRef.current}
					startFrame={0}
					scale={[2, 2, 2]}
					fps={10}
					animationNames={['WalkForward', 'WalkBackward', 'ForwardIdle', 'BackwardIdle', 'WalkLeft', 'WalkRight']}
					autoPlay={true}
					asSprite={false}
					loop={true}
					alphaTest={0.1}
					textureImageURL={userData.playerVRM}
					textureDataURL={(props.threeObjectPluginRoot + '/inc/utils/sprite.json')}
				/>
				)}
			</>
			)}
		</Ecctrl>
		</KeyboardControls>

	{isModelLoaded && !props.useWebGLForXR && (
		<>
			<FlyingParticles
				playerControllerRef={playerControllerRef}
				characterRef={characterRef}
				isFlyingRef={isFlyingRef}
				isSwimmingRef={isSwimmingRef}
				isMovingRef={isMovingRef}
				isBoostingRef={isBoostingRef}
			/>
			<FootprintSystem
				playerControllerRef={playerControllerRef}
				characterRef={characterRef}
				isMovingRef={isMovingRef}
				isFlyingRef={isFlyingRef}
				isSwimmingRef={isSwimmingRef}
			/>
		</>
	)}

	{isModelLoaded && props.useWebGLForXR && (
		<>
			<FlyingParticlesWebGL
				playerControllerRef={playerControllerRef}
				characterRef={characterRef}
				isFlyingRef={isFlyingRef}
				isSwimmingRef={isSwimmingRef}
				isMovingRef={isMovingRef}
				isBoostingRef={isBoostingRef}
			/>
			<FootprintSystemWebGL
				playerControllerRef={playerControllerRef}
				characterRef={characterRef}
				isMovingRef={isMovingRef}
				isFlyingRef={isFlyingRef}
				isSwimmingRef={isSwimmingRef}
			/>
		</>
	)}

		<WorldCursor 
			characterControllerRef={characterRef}
			isMovingRef={isMovingRef}
			enabled={true}
			maxDistance={15}
			defaultDistance={8}
			thirdPerson={true}
			showDebug={true}
			shoulderOffset={CURSOR_SHOULDER_OFFSET}
			onInteract={handleWorldCursorInteract}
			visual={CURSOR_VISUAL_CONFIG}
			onMenuStateChange={handleMenuStateChange}
		/>
	</>
	);
}