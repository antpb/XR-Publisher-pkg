import { Box3,
	Mesh,
	Raycaster,
	PerspectiveCamera,
	ArrowHelper,
	Euler, MathUtils, NearestFilter, LoopOnce, DoubleSide, MeshBasicMaterial, RingGeometry, BoxGeometry, AudioListener, Color, Group, Quaternion, Matrix4, VectorKeyframeTrack, QuaternionKeyframeTrack, LoopPingPong, AnimationClip, NumberKeyframeTrack, AnimationMixer, Vector3, Vector2, BufferGeometry, CircleGeometry, sRGBEncoding } from "three";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { useFrame, useLoader, useThree, Interactive } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls, SpriteAnimator, KeyboardControls } from '@react-three/drei';
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useRef, useState, useEffect } from "react";
import { useXR, useController } from '@react-three/xr';
import { RigidBody, CapsuleCollider, useRapier, vec3, interactionGroups, CuboidCollider } from "@react-three/rapier";
import defaultVRM from "../defaults/avatars/xr_publisher_default_avatar.vrm";
import blankVRM from "../defaults/avatars/blank_avatar.vrm";
import { VRMUtils, VRMHumanBones, VRMSchema, VRMLoaderPlugin, VRMSpringBoneManager, VRMExpressionPresetName, VRMHumanBoneName, VRM } from "@pixiv/three-vrm";

import idle from "../defaults/avatars/friendly.fbx";
import walk from "../defaults/avatars/walking.fbx";
import run from "../defaults/avatars/running.fbx";
import jump from "../defaults/avatars/Jump.fbx";
import fall from "../defaults/avatars/falling.fbx";
import { getMixamoRig } from "../utils/rigMap";
import ShapePointsMesh from "../utils/ShapePointsMesh";
import DynLineMesh from "../utils/DynLineMesh";
import Ecctrl, { EcctrlAnimation, useGame, useFollowCam, useJoystickControls } from "ecctrl";
// import avatar from ./avatar/index.js
import { ExokitAvatar } from "./avatar";

import { 
	Armature,
	Pose,
	BipedRig,
	IKChain,
	HipSolver,
	SpineSolver,
	LimbSolver,
	FootSolver,
	SwingTwistSolver,
	SwingTwistEndsSolver,
	ZSolver
} from 'ossos';

const DamperTimeS = 0.15;

const __rot = new Quaternion();
const __shoulderWPos = new Vector3();
const __originWPos = new Vector3();
const __originWDir = new Vector3();
const __offset = new Vector3();

const mixamoVRMRigMap = getMixamoRig();

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
	console.log( url, vrm );
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
	VRMUtils.rotateVRM0(vrm);
	VRMUtils.removeUnnecessaryVertices( vrm.scene );
	VRMUtils.removeUnnecessaryJoints( vrm.scene );
	const vrmHipsY = vrm.humanoid?.getNormalizedBoneNode('hips').getWorldPosition(_vec3).y;
	const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
	const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
	const hipsPositionScale = vrmHipsHeight / mainHip;

	clip.tracks.forEach((track) => {
	let trackSplitted = track.name.split('.');
	let mixamoRigName = trackSplitted[0];
	let vrmBoneName = mixamoVRMRigMap[mixamoRigName];
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
			track.values.map((v, i) => (vrm.meta?.metaVersion === '0' && i % 2 === 0 ? -v : v)),
			),
		);
		} else if (track instanceof VectorKeyframeTrack) {
		let value = track.values.map((v, i) => (vrm.meta?.metaVersion === '0' && i % 3 !== 1 ? -v : v) * hipsPositionScale);
		tracks.push(new VectorKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, value));
		}
	}
	});

	return new AnimationClip('vrmAnimation', clip.duration, tracks);
});
}

function addResetButton(props) {
const button = document.createElement('button');
button.innerHTML = 'Respawn';
button.onclick = () => {
	props.movement.current.respawn = true;
	setTimeout(() => {
	props.movement.current.respawn = false;
	}, 100);
};

button.style.position = 'fixed';
button.style.bottom = '190px';
button.style.left = '10px';
button.style.zIndex = '1000';
button.style.padding = '10px';
button.style.border = 'none';
button.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
button.style.color = 'white';
button.style.cursor = 'pointer';
button.style.borderRadius = '5px';
button.style.fontFamily = 'Arial';
button.style.fontSize = '16px';
button.style.fontWeight = 'bold';
document.body.appendChild(button);
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
const { isPresenting } = useXR();
const [presentingState, setPresentingState] = useState(false);
const prevPositionRef = useRef(null);
const { controllers } = useXR();
const rightController = useController('right');
const leftController = useController('left');
const head = useRef(new XrHead(useThree()));
const pointerOriginDamper = useRef(new Vector3Damper(DamperTimeS));
const pointerDirectionDamper = useRef(new Vector3Damper(DamperTimeS));

const characterRef = useRef(null);

const [frameName, setFrameName] = useState();

const canMoveRef = useRef(true);
const spriteRef = useRef();
const animationsRef = useRef();
const playerModelRef = useRef();

const orbitRef = useRef();
const rigidRef = useRef();
const castRef = useRef();
const [loaderIsGone, setLoaderIsGone] = useState(false);
const [avatarIsSprite, setAvatarIsSprite] = useState(false);

const curAnimation = useGame((state) => state.curAnimation);
const initializeAnimationSet = useGame(
	(state) => state.initializeAnimationSet
);
const idleAnimation = useGame((state) => state.idle);
const walkAnimation = useGame((state) => state.walk);
const runAnimation = useGame((state) => state.run);
const action1Animation = useGame((state) => state.action1);
const action2Animation = useGame((state) => state.action2);
const action3Animation = useGame((state) => state.action3);
const action4Animation = useGame((state) => state.action4);
const resetAnimation = useGame((state) => state.reset);
const [open, setOpen] = useState(false);
const HEAD_LAYER = 1;


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
	setLoaderIsGone(true);
	removeEventListener('loaderIsGone', handleReady);
	};
	window.addEventListener('loaderIsGone', handleReady);
	addResetButton(props);
}, []);

// Default base path if threeObjectPluginRoot is not provided
let assetBasePath = props.threeObjectPluginRoot || '/assets';

// if the base path starts with file:// use localhost



const idleFile = `${assetBasePath}avatars/friendly.fbx`;
const walkingFile = `${assetBasePath}avatars/walking.fbx`;
const runningFile = `${assetBasePath}avatars/Running.fbx`; 
const jumpFile = `${assetBasePath}avatars/Jump.fbx`;
const fallingFile = `${assetBasePath}avatars/falling.fbx`;
const spawnPoint = props.spawnPoint ? props.spawnPoint.map(Number) : [0, 0, 0];
const { scene, clock } = useThree();
const { world, rapier } = useRapier();
const participantObject = scene.getObjectByName("playerOne");
let debug   = {};

let animationFiles = [idleFile, walkingFile, runningFile, jumpFile];
// Participant VRM.
const fallbackURL = defaultVRM;
const defaultAvatarURL = props.defaultPlayerAvatar || defaultVRM;
let playerURL;
if(defaultAvatarURL){
	playerURL = defaultAvatarURL;
}

playerURL = userData.playerVRM[0] === '' ? fallbackURL : userData.playerVRM;

if( playerURL.endsWith( '.png' ) ){
	playerURL = blankVRM;
}

// if the playerURL ends in .png
useEffect(() => {
	if( userData.playerVRM[0] !== '' && userData.playerVRM.endsWith( '.png' ) ){
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

	// loader.register( parser => new VRMLoaderPlugin( parser, { helperRoot } ) );
	loader.register( parser => new VRMLoaderPlugin( parser ) );

	loader.load(playerURL, (gltf) => {
		currentPlayerAvatarRef.current = gltf;
		playerControllerRef.current = gltf.userData.vrm;
	
		// Calculate the avatar's height offset
		const headBone = gltf.userData.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
		headBone.layers.set(HEAD_LAYER);
		// headBone.visible = false;
		// // traverse the head bone to hide the mesh
		// headBone.traverse((child) => {
		// 	if(child.isMesh){
		// 		child.visible = false;
		// 	}
		// });
		const headWorldPosition = new Vector3();
		headBone.getWorldPosition(headWorldPosition);
	
		const avatarWorldPosition = new Vector3();
		gltf.scene.getWorldPosition(avatarWorldPosition);
	
		props.avatarHeightOffset.current = headWorldPosition.y - avatarWorldPosition.y;
	
		setIsModelLoaded(true);
	}, undefined, error => {
		console.error('An error happened during the loading of the model:', error);
	});
	}
}, [playerURL, gl]);

useEffect(() => {
	if (isModelLoaded && playerControllerRef.current) {

		// const avatarOptions = {
		// 	fingers: true,
		// 	hair: true,
		// 	decapitate: false,
		// 	visemes: true,
		// 	microphoneMediaStream: null,
		// 	muted: true,
		// 	debug: false,
		//   };
	  
		const playerController = playerControllerRef.current;
		// playerControllerRef.current.avatar = new ExokitAvatar(playerControllerRef.current, avatarOptions);
		const animationsMixer = new AnimationMixer(playerController.scene);
		playerMixerRef.current = animationsMixer;
		let animationsPromises = animationFiles.map(file => loadMixamoAnimation(file, playerController));
		playerController.scene.visible = false;

		Promise.all(animationsPromises)
			.then(animations => {
				const idleAction = animationsMixer.clipAction(animations[0]);
				const walkingAction = animationsMixer.clipAction(animations[1]);
				const runningAction = animationsMixer.clipAction(animations[2]);
				const jumpingAction = animationsMixer.clipAction(animations[3]);
				idleAction.timeScale = 1;
				walkingAction.timeScale = 0;
				runningAction.timeScale = 0;
				jumpingAction.timeScale = 0;
				animationsRef.current = { idle: idleAction, walking: walkingAction, running: runningAction, jump: jumpingAction };
				idleAction.play();
				playerController.scene.visible = true;
			});
	}
}, [isModelLoaded]);

useEffect(() => {
	addHandRotationControls();
  }, []);  

useEffect(() => {
	if( isPresenting ){
		console.log( 'Presenting' );
		// kill all animations
		// if (playerMixerRef.current) {
		// 	playerMixerRef.current.stopAllAction();
		// } 
		// stop idle

		if (animationsRef.current) {
			const { idle, walking, running, jump, falling } = animationsRef.current;
			if(idle){
				idle.stop();
			}
			if(walking){
				walking.stop();
			}
			if(running){
				running.stop();
			}
			if(jump){
				jump.stop();
			}
		}
	}
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
const updateRate = 1000 / 5;
const lastNetworkUpdateTimeRef = useRef(0);
let countHangtime = 0;
let isMoving;
let lastKeyPressTime = 0;
let wasJumping = false;

useEffect(() => {
	isMoving = false;
}, []);
let isJumping = false;
const getJoystickValues = useJoystickControls(
	(state) => state.getJoystickValues
);
const playerForward = new Vector3(0, 0, 1);

	useFrame((state, delta) => {
	const joystickValues = getJoystickValues();
	let forward = props.movement.current.forward;
	let backward = props.movement.current.backward;
	let left = props.movement.current.left;
	let right = props.movement.current.right;
	let shift = props.movement.current.shift;
	let space = props.movement.current.space;

	if (joystickValues) {
		if (joystickValues.joystickAng > 0) {
			if (joystickValues.joystickDis > 60) {
			shift = true;
			}
			forward = true;
		}
		if (joystickValues.button1Pressed === true) {
			space = true;
		}
	}

	if (playerControllerRef.current) {
		playerControllerRef.current.update(delta);
	}

	if (playerMixerRef.current) {
		playerMixerRef.current.update(delta);
	}

	const now = state.clock.elapsedTime * 1000;

	if (backward || forward || left || right) {
	if (characterRef.current.userData.canJump) {
		isMoving = true;

		if (now - lastKeyPressTime > 100) {
		if (window.p2pcf) {
			const participantObject = scene.getObjectByName("playerOne");

			var target = new Vector3();
			var worldPosition = participantObject.getWorldPosition(target);
			const position = [
			worldPosition.x,
			worldPosition.y,
			worldPosition.z
			];

			const rotation = [
			participantObject.parent.parent.rotation.x,
			participantObject.parent.parent.rotation.y,
			participantObject.parent.parent.rotation.z
			];

			const currentAction = !characterRef.current.userData.canJump ? "jumping" : "walking";
			const messageObject = {
			[window.p2pcf.clientId]: {
				position: position,
				rotation: rotation,
				profileImage: userData.profileImage,
				playerVRM: userData.playerVRM,
				vrm: userData.vrm,
				inWorldName: window.userData.inWorldName ? window.userData.inWorldName : userData.inWorldName,
				isMoving: {
				action: currentAction,
				instance: 'update',
				hangtime: countHangtime
				}
			}
			};

			if (shift && characterRef.current.userData.canJump) {
			messageObject[window.p2pcf.clientId].isMoving.action = "running";
			}

			const message = JSON.stringify(messageObject);
			window.p2pcf.broadcast(new TextEncoder().encode(message)), window.p2pcf;
			lastKeyPressTime = now;
			lastNetworkUpdateTimeRef.current = now;
		}
		}

		if (now - lastNetworkUpdateTimeRef.current > updateRate) {
		if (window.p2pcf) {
			const participantObject = scene.getObjectByName("playerOne");

			var target = new Vector3();
			var worldPosition = participantObject.getWorldPosition(target);
			const position = [
			worldPosition.x,
			worldPosition.y,
			worldPosition.z
			];

			const rotation = [
			participantObject.parent.parent.rotation.x,
			participantObject.parent.parent.rotation.y,
			participantObject.parent.parent.rotation.z
			];

			const currentAction = !characterRef.current.userData.canJump ? "jumping" : "walking";

			const messageObject = {
			[window.p2pcf.clientId]: {
				position: position,
				rotation: rotation,
				profileImage: userData.profileImage,
				playerVRM: userData.playerVRM,
				vrm: userData.vrm,
				inWorldName: window.userData.inWorldName ? window.userData.inWorldName : userData.inWorldName,
				isMoving: {
				action: currentAction,
				instance: 'update',
				hangtime: countHangtime
				}
			}
			};

			if (shift && characterRef.current.userData.canJump) {
			messageObject[window.p2pcf.clientId].isMoving.action = "running";
			}

			const message = JSON.stringify(messageObject);
			window.p2pcf.broadcast(new TextEncoder().encode(message)), window.p2pcf;
			lastNetworkUpdateTimeRef.current = now;
		}
		}

		clearTimeout(movementTimeoutRef.current);
		movementTimeoutRef.current = setTimeout(() => {
		isMoving = false;
		}, 500);
	}
	} else {
	if (isMoving) {
		isMoving = false;
		clearTimeout(movementTimeoutRef.current);
		if (window.p2pcf?.clientId) {
		const participantObject = scene.getObjectByName("playerOne");
		var target = new Vector3();
		var worldPosition = participantObject.getWorldPosition(target);
		const position = [
			worldPosition.x,
			worldPosition.y,
			worldPosition.z
		];

		const messageStopObject = {
			[window.p2pcf.clientId]: {
			isMoving: false,
			position: position
			}
		};
		const messageStop = JSON.stringify(messageStopObject);
		window.p2pcf.broadcast(new TextEncoder().encode(messageStop));
		lastNetworkUpdateTimeRef.current = now;
		}
	}
	}

	if (isPresenting && !presentingState) {
		const newCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		const participantObject = scene.getObjectByName("playerOne");
		// set the rotation to 0
		participantObject.parent.parent.rotation.set(0, 0, 0);
		participantObject.parent.rotation.set(0, 0, 0);
		participantObject.rotation.set(0, 0, 0);
		const xrCamera = gl.xr.getCamera(newCamera);
		gl.xr.enabled = true;
		state.camera = xrCamera;
		setPresentingState(true);
	} else if (!isPresenting && presentingState) {
		setPresentingState(false);
	}

	handleBlinking(delta);

	if (animationsRef.current) {
	if (playerControllerRef.current && participantObject) {
		const cameraWorldQuaternion = new Quaternion();
		camera.getWorldQuaternion(cameraWorldQuaternion);
		const cameraForward = new Vector3(0, 0, -1).applyQuaternion(cameraWorldQuaternion);

		const characterWorldQuaternion = new Quaternion();
		participantObject.parent.getWorldQuaternion(characterWorldQuaternion);
		const characterForward = new Vector3(0, 0, 1).applyQuaternion(characterWorldQuaternion);
		const neutralRotation = new Euler(0, 0, 0);

		const characterToCamera = new Vector3().subVectors(camera.position, participantObject.getWorldPosition(new Vector3())).normalize();

		const dotProduct = characterForward.dot(cameraForward);
		const azimuthalAngle = Math.acos(Math.min(Math.max(dotProduct, -1), 1));

		const angleThreshold = Math.PI / 2;
		if (azimuthalAngle < angleThreshold) {
		if (avatarIsSprite) {
			if (isMoving && frameName !== 'WalkForward') {
			setFrameName('WalkForward');
			}
			if (isMoving === false) {
			if (frameName !== 'ForwardIdle') {
				setFrameName('ForwardIdle');
			}
			}
		}
		} else {
		if (avatarIsSprite && isMoving && frameName !== 'WalkBackward') {
			setFrameName('WalkBackward');
		}
		if (avatarIsSprite && isMoving === false && frameName !== 'BackwardIdle') {
			setFrameName('BackwardIdle');
		}
		}
	}

	const { idle, walking, running, jump, falling } = animationsRef.current;

	if (props.movement.current.respawn) {
		characterRef.current.setBodyType(rapier.RigidBodyType.Fixed, 1);
		characterRef.current.setTranslation(new Vector3(Number(spawnPoint[0]), Number(spawnPoint[1]), Number(spawnPoint[2])), true);
	} else if (!props.movement.current.respawn && characterRef.current.bodyType() === 1) {
		characterRef.current.setBodyType(rapier.RigidBodyType.Dynamic, 0);
	}

	if (isMoving && characterRef.current.userData.canJump) {
		jump.clampWhenFinished = false;
		jump.reset();
		jump.setEffectiveTimeScale(0);
		jump.setEffectiveWeight(0);
	} else if (!isMoving && characterRef.current.userData.canJump) {
		jump.clampWhenFinished = false;
		jump.reset();
		jump.setEffectiveTimeScale(0);
		jump.setEffectiveWeight(0);
		idle.setEffectiveTimeScale(1);
		idle.setEffectiveWeight(1);
	}

	if (!characterRef.current.userData.canJump) {
		if (window.p2pcf) {
			const participantObject = scene.getObjectByName("playerOne");

			var target = new Vector3();
			var worldPosition = participantObject.getWorldPosition(target);
			const position = [
			worldPosition.x,
			worldPosition.y,
			worldPosition.z
			];

			const rotation = [
			participantObject.parent.parent.rotation.x,
			participantObject.parent.parent.rotation.y,
			participantObject.parent.parent.rotation.z
			];
			if (!prevPositionRef.current || Math.abs(position[1] - prevPositionRef.current[1]) > 0.01) {
			const messageObject = {
				[window.p2pcf.clientId]: {
				position: position,
				rotation: rotation,
				profileImage: userData.profileImage,
				playerVRM: userData.playerVRM,
				vrm: userData.vrm,
				inWorldName: window.userData.inWorldName ? window.userData.inWorldName : userData.inWorldName,
				isMoving: {
					action: "jumping",
					instance: 'first',
					hangtime: countHangtime
				}
				}
			};
			const message = JSON.stringify(messageObject);
			if ((now - lastNetworkUpdateTimeRef.current > updateRate) && (lastNetworkUpdateTimeRef.current !== 0)) {
				window.p2pcf.broadcast(new TextEncoder().encode(message)), window.p2pcf;
				lastNetworkUpdateTimeRef.current = now;
			}
			}
			prevPositionRef.current = position;
		}

		countHangtime++;

		if (jump.getEffectiveTimeScale() === 0) {
			if (countHangtime > 3) {
			jump.setEffectiveTimeScale(1);
			jump.setEffectiveWeight(1);
			jump.clampWhenFinished = true;
			jump.time = jump._clip.duration;
			jump.play();
			running.setEffectiveTimeScale(0);
			running.setEffectiveWeight(0);
			walking.setEffectiveTimeScale(0);
			walking.setEffectiveWeight(0);
			}
		}

		wasJumping = true;
		} else {
		if (wasJumping) {
			if (window.p2pcf) {
			const participantObject = scene.getObjectByName("playerOne");
			setTimeout(() => {
				var target = new Vector3();
				var worldPosition = participantObject.getWorldPosition(target);
				const position = [
				worldPosition.x,
				worldPosition.y,
				worldPosition.z
				];

				const rotation = [
				participantObject.parent.parent.rotation.x,
				participantObject.parent.parent.rotation.y,
				participantObject.parent.parent.rotation.z
				];

				if ((countHangtime > 0) && lastNetworkUpdateTimeRef.current !== 0) {
				const messageStopObject = {
					[window.p2pcf.clientId]: {
					isMoving: {
						action: "jumpStop",
						hangtime: countHangtime
					},
					position: position,
					rotation: rotation
					}
				};
				const messageStop = JSON.stringify(messageStopObject);
				window.p2pcf.broadcast(new TextEncoder().encode(messageStop));
				countHangtime = 0;
				lastNetworkUpdateTimeRef.current = now;
				}
			}, 100);
			}

			wasJumping = false;
		}
		}

		if (isMoving && characterRef.current.userData.canJump) {
		countHangtime = 0;

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
			idle.setEffectiveTimeScale(1);
			idle.setEffectiveWeight(0);
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
			idle.setEffectiveTimeScale(1);
			idle.setEffectiveWeight(0);
			walking.play();
		}
		} else {
		if (characterRef.current.userData.canJump) {
			isJumping = false;
			if (walking.isRunning()) {
			walking.crossFadeTo(idle, 1);
			walking.enabled = true;
			walking.setEffectiveTimeScale(1);
			walking.setEffectiveWeight(0);
			running.setEffectiveTimeScale(1);
			running.setEffectiveWeight(0);
			idle.enabled = true;
			idle.setEffectiveTimeScale(1);
			idle.setEffectiveWeight(1);
			idle.play();
			} else if (running.isRunning()) {
			running.crossFadeTo(idle, 1);
			running.enabled = true;
			running.setEffectiveTimeScale(1);
			running.setEffectiveWeight(0);
			walking.setEffectiveTimeScale(1);
			walking.setEffectiveWeight(0);
			idle.enabled = true;
			idle.setEffectiveTimeScale(1);
			idle.setEffectiveWeight(1);
			idle.play();
			}
		}
		}

		if (space) {
		if (characterRef.current.userData.canJump) {
			isJumping = true;
			countHangtime = 0;
			jump.setEffectiveTimeScale(1);
			jump.setEffectiveWeight(1);
			idle.setEffectiveTimeScale(0);
			walking.setEffectiveTimeScale(0);
			running.setEffectiveTimeScale(0);
			idle.setEffectiveWeight(0);
			walking.setEffectiveWeight(0);
			running.setEffectiveWeight(0);
			jump.setLoop(LoopOnce, 1);
			jump.reset();
			jump.clampWhenFinished = true;
			jump.play();
		}
		}
		}
	});

	// Add this function at the top of your component or in a utility file
	function debugVector3(name, vector) {
		console.log(`${name}: x: ${vector.x.toFixed(2)}, y: ${vector.y.toFixed(2)}, z: ${vector.z.toFixed(2)}`);
	}
  


	let frameCounter = 0;
	const logFrequency = 60; // Log every 60 frames, adjust this value as needed
	function conditionalLog(message, ...optionalParams) {
		frameCounter++;
		if (frameCounter % logFrequency === 0) {
		console.log(message, ...optionalParams);
		}
	}

	const HAND_VERTICAL_OFFSET = -1.0;
	const ARM_FORWARD = new Vector3(1, 0, 0);
	const UP = new Vector3(0, 1, 0);

	const armRef = useRef(null);
	const rigRef = useRef(null);
// Add these as component-level variables
const debugArrows = {
	leftForward: null,
	leftUp: null,
	rightForward: null,
	rightUp: null
  };

// VR IK
//   useFrame((state, delta) => {
// 	if (isPresenting && playerControllerRef.current && playerControllerRef.current.avatar) {
// 	  const avatar = playerControllerRef.current.avatar;
  
// 		// Update avatar inputs
// 		avatar.inputs.hmd.position.copy(camera.position);
// 		// avatar.inputs.hmd.quaternion.copy(camera.quaternion);
  
// 	  // Update left and right hand positions and rotations
// 	  if (leftController && leftController.controller) {
// 		avatar.setLeftHandPose(avatar.inputs.leftGamepad.position, avatar.inputs.leftGamepad.quaternion);
// 	  } else {
// 		// Reset left hand pose if controller is not available
// 		avatar.setLeftHandPose(new Vector3(), new Quaternion());
// 	  }
  
// 	  if (rightController && rightController.controller) {
// 		avatar.setRightHandPose(avatar.inputs.rightGamepad.position, avatar.inputs.rightGamepad.quaternion);
// 	  } else {
// 		// Reset right hand pose if controller is not available
// 		avatar.setRightHandPose(new Vector3(), new Quaternion());
// 	  }
  
// 	  avatar.setFloorHeight(0);
// 	  avatar.update(delta);
// 	}
//   });  
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
		{ name: "action4", keys: ["KeyF"] },
	];

	const canvas = document.querySelector('div.xr-publisher-main-canvas');

	return (
	<>
		<KeyboardControls
		map={keyboardMap}
		domElement={canvas}
		>
		<Ecctrl
			ref={characterRef}
			position={[
				Number(props.spawnPoint?.[0] || 0), 
				Number(props.spawnPoint?.[1] || 0), 
				Number(props.spawnPoint?.[2] || 0)
			]}
			turnSpeed={20}
			maxVelLimit={5}
			jumpVel={7}
			camInitDis={-3}
			camMaxDis={-6}
			camMinDis={-0.5}
			animated
			restitution={0.0}
			springK={0}
			camMoveSpeed={1.5}
			camZoomSpeed={1.5}
			autoBalance={true}
			airDragMultiplier={0.05}
			fallingGravityScale={3.5}
			wakeUpDelay={5000}
			camCollision={props.camCollisions === "1" ? true : false}
			disableFollowCam={isPresenting ? true : false}
			canSleep={true}
			ccd={true}
			additionalSolverIterations={1}
			>
			{isModelLoaded && playerControllerRef.current && (
			<>
				<primitive
				userData={{ camExcludeCollision: true }}
				visible={isPresenting ? false : true}
				name="playerOne"
				object={playerControllerRef.current.scene}
				position={[0, -0.65, 0]}
				rotation={[0, 0, 0]}
				/>
				{avatarIsSprite && (
				<SpriteAnimator
					name="playerOneSprite"
					userData={{ camExcludeCollision: true }}
					ref={spriteRef}
					position={[0, 0, 0]}
					frameName={frameName}
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
	</>
	);
}
