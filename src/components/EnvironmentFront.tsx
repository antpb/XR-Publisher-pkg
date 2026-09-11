import * as THREE from "three";
// Import these at the top of your EnvironmentFront.tsx file
import { Object3D, Vector3, Quaternion, Euler } from 'three';
import type { SpawnPoint, EnvironmentFrontProps } from '../types/types';
import { Portal } from './core/front/Portal';
import { ThreeSky } from "./core/front/ThreeSky";
import { InjectedModels } from "./core/front/InjectedModels";
import { InjectedSolids } from "./core/front/InjectedSolids";
import { InjectedPersistentDecorations } from "./core/front/InjectedPersistentDecorations";
import useRideStore from "../stores/rideStore";
import { debounce } from 'lodash';
import { Loader2 } from 'lucide-react';
import { NPCChatGate } from './chatbox.js';
import { FrameRateCap } from './FrameRateCap';
//@ts-ignore
import { LookingGlassWebXRPolyfill, LookingGlassConfig } from "@lookingglass/webxr"

import React, { Suspense, useRef, useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { subscribeActiveInteractable, getActiveInteractable } from "../decorations/interactionRegistry";
import { subscribeLoadProgress, getLoadProgressSnapshot, loadFraction, loadLabel } from "../state/loadProgress";
import { useLoader, useThree, Canvas } from "@react-three/fiber";
import { WebGPURenderer } from 'three/webgpu';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
// import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { Physics, RigidBody } from "@react-three/rapier";
// import ScrollableFeed from 'react-scrollable-feed'
import { Environment } from "@react-three/drei";
// import { FrontPluginProvider, FrontPluginContext } from './FrontPluginProvider';  // Import the PluginProvider
import { FrontPluginProvider } from './FrontPluginProvider';  // Import the PluginProvider
import { InteractableSystem } from './core/front/InteractableSystem';
import { EditableBlockHost, EditAdditionsHost, EditGhostsHost } from '../editor/EditableBlockHost';
import { EditModeSystem } from '../editor/EditModeSystem';
import type { BlockRenderCtx } from '../editor/blockParsers';
import { InteractableBanner } from './InteractableBanner';
import { XRInputBridge } from './XRInputBridge';
import { VRInteractPrompt } from './VRInteractPrompt';
import { ControlsHint, isTouch } from './ControlsHint';
import { PluginDialog } from './core/front/PluginDialog';
import { registerMenuItem, unregisterMenuItem, VR_MENU_ITEM_ID } from '../decorations/pluginMenu';
import {
	useAnimations,
	AdaptiveDpr,
	AdaptiveEvents,
	PerformanceMonitor,
} from "@react-three/drei";
import { EcctrlJoystick } from 'ecctrl'

// import { A11y } from "@react-three/a11y";
import { createXRStore, XR, XROrigin, useXR, useXRInputSourceState, useXRControllerLocomotion } from '@react-three/xr'
// import { Perf } from "r3f-perf";
import { createVRMLoaderPlugin } from "../utils/vrmLoader";
import TeleportTravel from "./TeleportTravel.js";
import Player from "./Player.jsx";
import { WaitForTerrain } from "./WaitForTerrain";
import defaultFont from "../defaults/fonts/roboto.woff";
import { Participants } from "./core/front/Participants.js";
import { useKeyboardControls } from "./Controls.js";
import { ContextBridgeComponent } from "./ContextBridgeComponent.js";
import { ShaderPrewarm } from "./ShaderPrewarm";

import { defaultAvatarVRM } from "@/assets/index.js";
import { InfiniteTerrain } from "./core/front/InfiniteTerrain";

interface ColliderItem extends Array<Object3D | any> {
	0: Object3D;
	1: {
		type: string;
	};
}

// Props interface for the SavedObject component
interface SavedObjectInternalProps {
	positionY: number;
	positionX?: number;
	positionZ?: number;
	rotationY: number;
	url: string;
	color?: string;
	hasZoom?: string;
	scale: number;
	hasTip?: string;
	animations?: string;
	playerData?: any;
	label?: string;
	setSpawnPoints: (points: SpawnPoint[]) => void;
	setPhysicsEnabled: (enabled: boolean) => void;
}

// Type for the collider callback
type ColliderCallback = (item: ColliderItem, index: number) => React.JSX.Element | null;

// Common Element Types
export interface CustomElement extends HTMLElement {
	tagName: string;
	getAttribute(name: string): string | null;
	hasAttribute(name: string): boolean;
}

interface ChatSession {
	id: string;
	npcName: string;
	messages: Message[];
}

interface Message {
	sender: string;
	text: string;
	timestamp: string;
	error?: boolean;
}



function isCustomElement(element: unknown): element is CustomElement {
	return element !== null &&
		typeof element === 'object' &&
		'tagName' in element &&
		'getAttribute' in element &&
		'hasAttribute' in element;
}

// Use these functions to handle attribute getting safely
function getAttributeSafe(element: unknown, attr: string): string {
	if (isCustomElement(element)) {
		return element.getAttribute(attr) || '';
	}
	return '';
}




function isMobile() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function goToPrivateRoom() {
	const url = window.location.href;
	const newUrl = url.split("#")[0];
	const randomString = Math.random().toString(36).substring(7);
	window.location
		.assign(newUrl + "#" + randomString);
}

const entryInputStyle: React.CSSProperties = {
	width: '100%',
	boxSizing: 'border-box',
	padding: '8px 10px',
	borderRadius: 6,
	background: '#fff',
	color: '#111',
	border: '1px solid rgba(0, 0, 0, 0.2)',
	font: 'inherit',
	fontSize: 14,
};

/**
 * Mobile joystick + buttons. The interact button (button 3) is added ONLY when
 * there's something to interact with (a hovered NPC/vehicle, or while mounted),
 * so the player can never trigger the unfinished world-action menu. Toggling
 * buttonNumber only re-renders the button cluster — the joystick stick is
 * untouched, so movement is never interrupted. Hover signal is polled from
 * window.worldCursorAPI (WorldCursor publishes it imperatively at 4Hz).
 */
// "E" label texture for the interact button (button 3). Drawn once: a blue
// disc + ring + a white "E", mapped onto the existing button-top mesh via
// EcctrlJoystick's `buttonTop3Props` (which spreads onto that mesh and
// overrides its material). This labels the joystick's own action button rather
// than adding a separate one.
function makeInteractButtonMaterial(): THREE.Material {
	const c = document.createElement('canvas');
	c.width = c.height = 256;
	const ctx = c.getContext('2d')!;
	ctx.clearRect(0, 0, 256, 256);
	ctx.beginPath();
	ctx.arc(128, 128, 118, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(47,109,240,0.95)';
	ctx.fill();
	ctx.lineWidth = 10;
	ctx.strokeStyle = 'rgba(255,255,255,0.7)';
	ctx.stroke();
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 150px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('E', 128, 140);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.center.set(0.5, 0.5);
	// The button-top is a cylinder whose group is rotated -90° about X, so the
	// cap maps the texture 90° counter-clockwise; rotate it back 90° CW. (If it
	// ever reads off again, tex.rotation is the one knob — ±Math.PI/2.)
	tex.flipY = false;
	tex.rotation = -Math.PI / 2;
	return new THREE.MeshBasicMaterial({ map: tex, transparent: true });
}

const MobileControls = () => {
	const [showInteract, setShowInteract] = useState(false);
	const interactButtonMat = useMemo(() => makeInteractButtonMaterial(), []);
	// Plugin interactables come straight from the registry, which is the same
	// source the on-screen prompt and the button's own press handler read. It
	// used to come from `worldCursorAPI.hoveredInteractable`, a mirror written
	// by InteractableSystem purely so this poll and Player's E gate could see
	// it, which meant three copies of one fact and three chances for the button
	// to disagree with the prompt beside it.
	const activeInteractable = useSyncExternalStore(
		subscribeActiveInteractable,
		getActiveInteractable,
		// Server snapshot: nothing is in range before the world runs.
		(): ReturnType<typeof getActiveInteractable> => null,
	);
	useEffect(() => {
		const id = window.setInterval(() => {
			const api = (window as any).worldCursorAPI;
			const present = useRideStore.getState().isMounted
				|| !!api?.hoveredRideable
				|| !!api?.hoveredNPC;
			setShowInteract((prev) => (prev === present ? prev : present));
		}, 200);
		return () => window.clearInterval(id);
	}, []);
	const interactVisible = showInteract || !!activeInteractable;

	return (
		<EcctrlJoystick
			buttonNumber={interactVisible ? 3 : 2}
			buttonGroup2Position={[-1, 1, 0]}
			buttonGroup3Position={[0.5, -1.3, 0]}
			buttonTop3Props={{ material: interactButtonMat }}
		/>
	);
};


const Loading = ({ previewImage }: { previewImage: string }) => {
	const loaded = useSyncExternalStore(subscribeLoadProgress, getLoadProgressSnapshot);
	return (
		<div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-slate-900 to-slate-800" style={{
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			zIndex: 9999
		}}>
			{/* Preview Image Background with Overlay */}
			{previewImage && (
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage: `url(${previewImage})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						filter: 'blur(8px)'
					}}
				/>
			)}

			{/* Content Container */}
			<div className="relative z-10 flex flex-col items-center space-y-6">
				{/* Loading Animation */}
				<div className="flex items-center justify-center">
					<Loader2 className="w-12 h-12 text-white animate-spin" />
				</div>

				{/* Staged load status — flags flip as terrain colliders and the
				    avatar VRM actually arrive, so the bar reflects real work. */}
				<div className="text-white/90 text-lg font-medium">
					{loadLabel(loaded)}
				</div>
				<div className="w-64 h-1.5 rounded-full bg-white/15 overflow-hidden">
					<div
						className="h-full rounded-full bg-white/80"
						style={{ width: `${Math.round(loadFraction(loaded) * 100)}%`, transition: 'width 400ms ease' }}
					/>
				</div>

				{/* Controls Info Card — keyboard keys mean nothing on touch devices */}
				<div className="mt-8 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white/90 text-sm">
					{isTouch() ? (
						<>
							<div className="flex items-center justify-center space-x-3 text-lg">
								<span>🕹️</span>
								<span className="text-sm">Left stick</span>
							</div>
							<div className="mt-2 text-center text-white/70 text-xs">
								Use to move · drag to look
							</div>
						</>
					) : (
						<>
							<div className="flex items-center justify-center space-x-4">
								{['W', 'A', 'S', 'D'].map((key) => (
									<div key={key} className="flex flex-col items-center">
										<div className="w-8 h-8 flex items-center justify-center border border-white/40 rounded bg-white/5">
											{key}
										</div>
									</div>
								))}
							</div>
							<div className="mt-2 text-center text-white/70 text-xs">
								Use to move
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

/**
 * Represents a saved object in a virtual reality world.
 *
 * @param {Object} props - The props for the saved object.
 *
 * @return {JSX.Element} The saved object.
 */
const SavedObject: React.FC<SavedObjectInternalProps> = (props) => {
	const { scene } = useThree();
	useEffect(() => {
		// Once the component is ready, dispatch an event to notify the parent
		const event = new Event('mainComponentReady');
		document.dispatchEvent(event);
	}, []);

	const [url, set] = useState(props.url);
	useEffect(() => {
		setTimeout(() => set(props.url), 2000)
	}, []);
	const [colliders, setColliders] = useState<ColliderItem[]>([]);
	const [meshes, setMeshes] = useState<Object3D | undefined>();
	const [portals, setPortals] = useState<Object3D[]>([]);

	const gltf = useLoader(GLTFLoader, url, (loader) => {
		loader.register((parser) => createVRMLoaderPlugin(parser));
	});
	const meshesScene = new THREE.Object3D();

	useEffect(() => {
		const childrenToParse: Object3D[] = [];
		const collidersToAdd: ColliderItem[] = [];
		const meshesToAdd: Object3D[] = [];
		const portalsToAdd: Object3D[] = [];
		const spawnPointsToAdd: Object3D[] = [];

		let omiColliders: any;

		gltf.scene.scale.set(props.scale, props.scale, props.scale);
		gltf.scene.position.set(
			props?.positionX ? props.positionX : gltf.scene.position.x,
			props.positionY,
			props?.positionZ ? props.positionZ : gltf.scene.position.z
		);
		gltf.scene.rotation.set(
			gltf.scene.rotation.x,
			props.rotationY,
			gltf.scene.rotation.z
		);

		// Dispatch event after transforms are set
		window.dispatchEvent(new Event('objectTransformed'));

		// Ensure the environment mesh is added to the main scene for navmesh traversal
		if (scene && !scene.children.includes(gltf.scene)) {
			scene.add(gltf.scene);
		}

		if (gltf.userData.gltfExtensions?.OMI_collider) {
			omiColliders = gltf.userData.gltfExtensions.OMI_collider.colliders;
		}

		gltf.scene.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				if (child.userData.gltfExtensions?.MX_lightmap) {
					// @ts-ignore
					const extension = child.userData.gltfExtensions?.MX_lightmap;
					// @todo implement MX_lightmap
				}
			}
			if (child.userData.gltfExtensions?.OMI_collider) {
				childrenToParse.push(child);
			}
			if (child.userData.gltfExtensions?.OMI_link) {
				portalsToAdd.push(child);
			} else if (child.userData.gltfExtensions?.OMI_spawn_point) {
				spawnPointsToAdd.push(child);
			} else {
				meshesToAdd.push(child);
			}
			setTimeout(() => {
				const event = new Event("mainSceneLoaded");
				window.dispatchEvent(event);
			}, 2000);
		});

		meshesToAdd.forEach((mesh) => {
			meshesScene.attach(mesh);
		});

		childrenToParse.forEach((child) => {
			const index = child.userData.gltfExtensions.OMI_collider.collider;
			collidersToAdd.push([child, omiColliders[index]]);
		});
		setColliders(collidersToAdd);
		setMeshes(meshesScene);
		setPortals(portalsToAdd);
		props.setSpawnPoints(spawnPointsToAdd.map(point => [point.position.x, point.position.y, point.position.z]));
		props.setPhysicsEnabled(true);
	}, [gltf, scene, props.scale, props.positionX, props.positionY, props.positionZ, props.rotationY]);

	const { actions } = useAnimations(gltf.animations, gltf.scene);

	const animationList = props.animations ? props.animations.split(",") : "";
	useEffect(() => {
		if (animationList) {
			animationList.forEach((name) => {
				if (Object.keys(actions).includes(name)) {
					actions[name].play();
				}
			});
		}
	}, []);

	return (
		<>
			{meshes && colliders.length > 0 && (
				<primitive
					castShadow
					receiveShadow
					object={meshes}
				/>
			)}
			{meshes && colliders.length === 0 && (
				<RigidBody type="fixed" colliders="trimesh">
					<primitive object={meshes} />
				</RigidBody>
			)}
			{portals &&
				portals.map((item, index) => {
					const pos = new THREE.Vector3();
					const quat = new THREE.Quaternion();
					const rotation = new THREE.Euler();
					const position = item.getWorldPosition(pos);
					const quaternion = item.getWorldQuaternion(quat);
					const finalRotation =
						rotation.setFromQuaternion(quaternion);
					return (
						<Portal
							key={index}
							positionX={position.x}
							positionY={position.y}
							positionZ={position.z}
							rotationX={finalRotation.x}
							rotationY={finalRotation.y}
							rotationZ={finalRotation.z}
							object={item.parent}
							label={props.label}
							defaultFont={defaultFont}
							destinationUrl={item.userData.gltfExtensions.OMI_link.uri}
							scaleX={1}
							scaleY={1}
							scaleZ={1}
						/>
					);
				})}
			{meshes && colliders.map(handleCollider)}
		</>
	);
}

// Move handleCollider definition above its usage
const handleCollider: ColliderCallback = (item, index) => {
	const pos = new Vector3();
	const quat = new Quaternion();
	const rotation = new Euler();
	const quaternion = item[0].getWorldQuaternion(quat);
	const finalRotation = rotation.setFromQuaternion(quaternion);
	const worldPosition = item[0].getWorldPosition(pos);

	switch (item[1].type) {
		case 'mesh':
			return (
				<RigidBody key={index} type="fixed" colliders="trimesh">
					<primitive
						rotation={finalRotation}
						position={worldPosition}
						object={item[0]}
					/>
				</RigidBody>
			);
		case 'box':
			return (
				<RigidBody key={index} type="fixed" colliders="cuboid">
					<primitive
						rotation={finalRotation}
						position={worldPosition}
						object={item[0]}
					/>
				</RigidBody>
			);
		case 'capsule':
			return (
				<RigidBody key={index} type="fixed" colliders="hull">
					<primitive
						rotation={finalRotation}
						position={worldPosition}
						object={item[0]}
					/>
				</RigidBody>
			);
		case 'sphere':
			return (
				<RigidBody key={index} type="fixed" colliders="ball">
					<primitive
						rotation={finalRotation}
						position={worldPosition}
						object={item[0]}
					/>
				</RigidBody>
			);
		default:
			return null;
	}
};

// Hand tracking enabled so Vision Pro (which has NO physical controllers) can provide
// hand-type input sources with gripSpace for IK. model: false = don't render default
// hand mesh (the VRM avatar IS the hand visualization). On Quest, controllers take
// priority; hands are a fallback for controller-free mode.
const xrStore = createXRStore({
	offerSession: false,
	emulate: false,
	handTracking: true,
	hand: {
		model: false,
		rayPointer: true,
		teleportPointer: true,
		grabPointer: true,
	},
	controller: {
		model: { colorWrite: false },
		teleportPointer: true,
		rayPointer: true,
		grabPointer: true,
	},
});

interface XRPlayerWrapperProps {
	spawnPoint: any;
	p2pcf: any;
	defaultAvatarVRM: string;
	defaultPlayerAvatar: string;
	movement: any;
	camCollisions: string;
	avatarHeightOffset: React.MutableRefObject<number>;
	threeObjectPluginRoot: string;
	useWebGLForXR: boolean;
	waterLevel: number;
}

function XRLocomotion({ originRef }: { originRef: React.RefObject<THREE.Group | null> }): null {
	useXRControllerLocomotion(
		originRef,
		{ speed: 3 },
		{ type: 'snap', degrees: 45, deadZone: 0.5 },
		'left'
	);
	return null;
}

function XRPlayerWrapper(props: XRPlayerWrapperProps & { xrOriginRef: React.RefObject<THREE.Group | null> }) {
	const { session } = useXR();
	const isXRPresenting = session !== undefined;
	// Controllers first (Quest etc), fall back to hands (Vision Pro, Quest hand mode).
	// On Vision Pro there are no controllers — only hand-type input sources.
	const leftControllerState = useXRInputSourceState('controller', 'left');
	const rightControllerState = useXRInputSourceState('controller', 'right');
	const leftHandState = useXRInputSourceState('hand', 'left');
	const rightHandState = useXRInputSourceState('hand', 'right');
	
	const playerProps = {
		...props,
		isXRPresenting: isXRPresenting,
		xrOriginRef: props.xrOriginRef,
		leftControllerState: leftControllerState || leftHandState,
		rightControllerState: rightControllerState || rightHandState,
	};
	return <Player {...playerProps} />;
}

export default function EnvironmentFront(props: EnvironmentFrontProps) {
	const [, setAvatarUrl] = useState<string>(props.userData.playerVRM || defaultAvatarVRM);
	useState<Record<string, ChatSession>>({});
	useState<string | null>(null);
	const [initializing] = useState(true);
	const [ physicsEnabled, setPhysicsEnabled ] = useState(false);

	// Memoized handlers for avatar URL updates
	useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newUrl = e.target.value;
		setAvatarUrl(newUrl);

		// Optional: Validate URL format
		const isValidUrl = /^(http|https):\/\/[^ "]+$/.test(newUrl) || newUrl === '';
		if (isValidUrl) {
			props.userData.playerVRM = newUrl || defaultAvatarVRM;
		}
	}, []);

	useCallback((e: React.DragEvent<HTMLInputElement>) => {
		e.preventDefault();
		const url = e.dataTransfer.getData('text');
		setAvatarUrl(url);
		props.userData.playerVRM = url;
	}, []);

	const [loadedAudios, setLoadedAudios] = useState<any[]>([]);
	const [allAudiosLoaded, setAllAudiosLoaded] = useState(false);


	const [showUI] = useState(true);
	const [displayName, setDisplayNameImmediate] = useState(props.userData.inWorldName);
	const [playerAvatar, setPlayerAvatarImmediate] = useState(props.userData.playerVRM || defaultAvatarVRM);

	// Debounced setters
	const setDisplayName = useMemo(
		() => debounce((value: string) => {
			setDisplayNameImmediate(value);
		}, 150),
		[]
	);

	const setPlayerAvatar = useMemo(
		() => debounce((value: string) => {
			setPlayerAvatarImmediate(value);
		}, 150),
		[]
	);

	// const [mobileControls, setMobileControls] = useState(null);
	// const [mobileRotControls, setMobileRotControls] = useState(null);
	const { movement } = useKeyboardControls();

	// Memoized Canvas config objects to prevent unnecessary re-renders
	const canvasResizeConfig = useMemo(() => ({ scroll: false, debounce: { scroll: 50, resize: 0 } }), []);
	const canvasCameraConfig = useMemo(() => ({ fov: 70, zoom: 1, near: 0.01, far: 5000, position: [0, 0, 20] as [number, number, number] }), []);
	const canvasStyle = useMemo(() => ({
		margin: "0" as const,
		height: props.containedMode ? "100%" : "100vh",
		width: "100%",
		padding: "0",
		position: "relative" as const,
		zIndex: 1
	}), [props.containedMode]);

	// Stable pointer lock handler. Mobile Safari / Android browsers do not
	// implement requestPointerLock — calling it throws a TypeError and the
	// uncaught handler error cascades through React's error reporter,
	// forcing surrounding subtrees to remount. That remount was visible in
	// production logs as EnvironmentFront re-initializing on every tap and
	// the terrain pipeline restarting sync main-thread generation each time.
	const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if ((window as any).primitiveGeneratorInputActive) return;
		// In-world edit mode needs a FREE cursor for click/drag — don't grab.
		if ((window as any).__xrEditActive) return;
		const target = e.target as HTMLElement;
		// Only the 3D canvas itself may grab the pointer. requestPointerLock
		// exists on Element.prototype, so without this check a pointerdown on
		// any overlay UI (chat input, buttons) would pointer-lock that element.
		if (target.tagName !== 'CANVAS') return;
		if (typeof (target as any).requestPointerLock !== 'function') return;
		try {
			(target as HTMLCanvasElement).requestPointerLock();
		} catch (_err) {
			// Some browsers throw even when the method exists (e.g., no user gesture).
			// Silently swallow — nothing to do from here.
		}
	}, []);

	// const [messageHistory, setMessageHistory] = useState();
	const [loaded, setLoaded] = useState(false);
	//@ts-ignore
	const [spawnPoints, setSpawnPoints] = useState<SpawnPoint[]>([]);
	// NPC chat messages live in npcMessageStore, and the interaction-store
	// subscription lives inside NPCChatGate — NOT here. This component renders
	// the entire Canvas/world tree; subscribing it to chat/interaction state
	// re-rendered the whole world on every E-press and chat message.
	const [objectsInRoom, setObjectsInRoom] = useState<string[]>([]);
	// Shared context for the extracted block parsers (editor/blockParsers.tsx).
	// noteAlt defers the setState — parsers run inside EditableBlockHost's
	// render, and setting parent state synchronously there is a React error.
	const blockCtx = useMemo<BlockRenderCtx>(() => ({
		threeObjectPluginRootProp: props.threeObjectPluginRoot,
		noteAlt: (alt: string) => {
			if (!alt) return;
			queueMicrotask(() => setObjectsInRoom((prev) => (prev.includes(alt) ? prev : [...prev, alt])));
		},
		onAudioLoad: (loadedAudio: any) => {
			setLoadedAudios((prev) => [...prev, loadedAudio]);
		},
		movement,
	}), [props.threeObjectPluginRoot, movement]);
	const [url] = useState<string | undefined>(props.threeUrl);
	const [loadingWorld, setLoadingWorld] = useState(true);

	// Worlds WITHOUT an environment URL (procedural-terrain worlds) used to
	// skip the loading overlay entirely (instant hide — there was nothing to
	// wait on). Now the overlay tracks the real load signals instead: hold it
	// until terrain colliders + the avatar VRM have landed (loadProgress
	// flags), with a short grace so the reveal isn't mid-pop-in and a hard
	// safety timeout so a failed signal can never trap the world behind the
	// loader. Physics still enables immediately. URL worlds keep the
	// mainComponentReady path below.
	useEffect(() => {
		if (url) return;
		setPhysicsEnabled(true);

		let hidden = false;
		let grace: ReturnType<typeof setTimeout> | undefined;
		const hide = () => {
			if (hidden) return;
			hidden = true;
			window.dispatchEvent(new Event("loaderIsGone"));
			setLoadingWorld(false);
		};
		const maybeHide = () => {
			const signals = getLoadProgressSnapshot();
			if (signals.has('terrain') && signals.has('avatar') && grace === undefined) {
				grace = setTimeout(hide, 800);
			}
		};
		const unsubscribe = subscribeLoadProgress(maybeHide);
		maybeHide();
		const safety = setTimeout(hide, 20000);
		return () => {
			unsubscribe();
			clearTimeout(grace);
			clearTimeout(safety);
		};
	}, [url]);

	const canvasRef = useRef<HTMLDivElement>(null);
	const r3fCanvasRef = useRef<HTMLCanvasElement>(null);
	const avatarHeightOffset = useRef<number>(0);

	const computedWaterLevel = useMemo(() => {
		if (props.terrainToAdd && props.terrainToAdd.length > 0) {
			const terrain = props.terrainToAdd[0];
			if (isCustomElement(terrain)) {
				const getNumAttr = (name: string, defaultValue: number): number => {
					const val = getAttributeSafe(terrain, name);
					return val !== null && val !== '' ? Number(val) : defaultValue;
				};
				
				const heightScale = getNumAttr('heightscale', 50);
				const positionY = getNumAttr('positiony', -10);
				const waterLevel = ((0.48 - 0) * (heightScale - (-heightScale))) / (1 - 0) + (-heightScale);
				const absoluteWaterLevel = positionY + waterLevel;

				return absoluteWaterLevel;
			}
		}
		return -12;
	}, [props.terrainToAdd]);

	useEffect(() => {
		if (loadedAudios.length === props.audiosToAdd.length && !allAudiosLoaded) {
			setAllAudiosLoaded(true);
			loadedAudios.forEach(audio => {
				if (audio.userData.autoPlay === "1") {
					audio.play();
				}
			});
		}
	}, [loadedAudios, props.audiosToAdd, allAudiosLoaded]);

	useEffect(() => {
		const handleReady = () => {
			setTimeout(() => {
				const event = new Event("loaderIsGone");
				window.dispatchEvent(event);
				setLoadingWorld(false);
			}, 3000);
		};
		// Listen for the ready event
		document.addEventListener('mainComponentReady', handleReady);

		return () => {
			document.removeEventListener('mainComponentReady', handleReady);
		};
	}, []);
	const [dpr, setDpr] = useState(2);
	const xrOriginRef = React.useRef<THREE.Group>(null);

	// Render-rate cap (default 60). On 120Hz ProMotion displays rAF runs at
	// 120 and doubles all CPU/GPU work for no visible gain. `?fps=native`
	// (or 0) uncaps; `?fps=30` etc. for explicit targets. XR sessions
	// always run at headset-native rate (see FrameRateCap).
	const frameCapFps = useMemo(() => {
		const p = new URLSearchParams(window.location.search).get('fps');
		if (p === 'native') return 0;
		const n = p ? parseInt(p, 10) : NaN;
		if (Number.isFinite(n)) return Math.max(0, n);
		return 60;
	}, []);

	// Idle render rate — when the camera is still, render this slow instead of
	// `frameCapFps`. Halves GPU/CPU heat while standing around. `?idlefps=N`.
	const idleCapFps = useMemo(() => {
		const p = new URLSearchParams(window.location.search).get('idlefps');
		const n = p ? parseInt(p, 10) : NaN;
		if (Number.isFinite(n)) return Math.max(0, n);
		return 30;
	}, []);

	// Check if we should use WebGL renderer for XR
	const useWebGLForXR = useMemo(() => {
		const params = new URLSearchParams(window.location.search);
		const param = params.get('renderer');
		// Explicit override wins either way.
		if (param === 'webgl') return true;
		if (param === 'webgpu') return false;
		// Default mobile (esp. iOS Safari) to WebGL: its WebGPU implementation
		// is new and memory-hungry, and the procedural-world rework's WebGPU
		// default was tripping the iOS memory watchdog on load. WebGL is the
		// mature, far-lighter path on mobile and renders the identical world
		// via the *WebGL component twins. Desktop stays on WebGPU.
		return isMobile();
	}, []);

	// VR entry lives in the HUD "More" menu (NetworkingControls' hamburger),
	// not a bare top-right button — keeps users from accidentally launching a
	// session and gives VR users one overlay to target. We register it into
	// the shared pluginMenu registry (the bridge to that separate React root);
	// NetworkingControls' MoreMenu renders it with the VR glasses icon.
	// WebGPU can't present XR sessions yet, so the non-WebGL branch reloads
	// into the WebGL renderer first.
	useEffect(() => {
		if (props.deviceTarget !== 'vr') return;
		registerMenuItem({
			id: VR_MENU_ITEM_ID,
			label: 'Enter',
			order: 100,
			onSelect: () => {
				if (useWebGLForXR) {
					xrStore.enterVR();
				} else {
					const url = new URL(window.location.href);
					url.searchParams.set('renderer', 'webgl');
					window.location.href = url.toString();
				}
			},
		});
		return () => unregisterMenuItem(VR_MENU_ITEM_ID);
	}, [props.deviceTarget, useWebGLForXR]);

	// Host pages render the XR Publisher logo inside a top header bar; pin it
	// to the bottom-left corner instead so the top edge belongs to the
	// control UI (NetworkingControls cluster + Enter VR). Original inline
	// style is restored on unmount. No-op when no host logo exists
	// (published standalone HTML, editor preview).
	useEffect(() => {
		const logoImg = document.querySelector('img[alt="Logo"]');
		const target = (logoImg?.closest('a') ?? logoImg) as HTMLElement | null;
		if (!target) return;
		const prevCssText = target.style.cssText;
		target.style.position = 'fixed';
		target.style.top = 'auto';
		target.style.right = 'auto';
		target.style.bottom = '16px';
		target.style.left = '16px';
		target.style.margin = '0';
		target.style.zIndex = '100';
		target.style.pointerEvents = 'auto';
		return () => {
			target.style.cssText = prevCssText;
		};
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Bypass the default behavior of the spacebar and other keys if needed.
			if ((event.key === ' ' || event.key === 'Spacebar') && document.pointerLockElement === r3fCanvasRef.current) {
				event.preventDefault(); // Prevent scrolling when spacebar is pressed
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	// Handle loaded state side effects in useEffect (not in render)
	useEffect(() => {
		if (loaded) {
		const loadedEvent = new Event("loaded");
		window.dispatchEvent(loadedEvent);
		props.userData.inWorldName = displayName;
		window.userData = props.userData;
		props.userData.playerVRM = playerAvatar;
		}
	}, [loaded, displayName, playerAvatar, props.userData]);

	if (loaded === true) {
		if (props.deviceTarget === "vr") {
			return (
				<>
					{loadingWorld && <Loading previewImage={props.previewImage} />}
					<div style={{ position: 'relative', width: '100%', height: props.containedMode ? '100%' : '100vh' }}>
						<Canvas
							ref={r3fCanvasRef}
							tabIndex={0}
							shadows={useWebGLForXR ? true : "soft"}
							resize={canvasResizeConfig}
							camera={canvasCameraConfig}
							onPointerDown={handleCanvasPointerDown}
							className="xr-publisher-main-canvas"
							dpr={dpr}
							gl={async (glProps) => {
								if (useWebGLForXR) {
									const renderer = new THREE.WebGLRenderer({
										...glProps,
										antialias: true,
										alpha: false,
										powerPreference: 'high-performance',
										preserveDrawingBuffer: true,
									});
									// Tell plugins the REAL renderer (the engine defaults mobile to
									// WebGL). Without this a plugin can't distinguish WebGL from
									// WebGPU and may build node materials that crash on WebGL.
									(window as any).__xrWebGPU = false;
									renderer.xr.enabled = true;
									renderer.shadowMap.enabled = true;
									renderer.shadowMap.type = THREE.PCFSoftShadowMap;
									renderer.outputColorSpace = THREE.SRGBColorSpace;
									renderer.toneMapping = THREE.ACESFilmicToneMapping;
									renderer.toneMappingExposure = 1.0;
									return renderer;
								} else {
									// MSAA off on mobile: a 4× multisampled HDR framebuffer at
									// retina dpr is tens of MB of GPU memory allocated up front —
									// a fixed baseline that left no headroom for the avatar and
									// tripped iOS Safari's memory watchdog. High-DPI screens hide
									// most aliasing, so full resolution (dpr) is kept; only the
									// multisample buffer is dropped. Desktop keeps MSAA.
									const renderer = new WebGPURenderer({
										canvas: glProps.canvas as HTMLCanvasElement,
										antialias: !isMobile()
									});
									await renderer.init();
									(window as any).__xrWebGPU = true; // real renderer is WebGPU (see WebGL branch)
									renderer.localClippingEnabled = true;
									// Match the WebGL branch. WebGPURenderer defaults to
									// NoToneMapping, so any lit surface where sun + ambient
									// pushed the color past 1.0 CLIPPED to white — the whole
									// midday world read as blown out. ACES rolls it off.
									renderer.toneMapping = THREE.ACESFilmicToneMapping;
									renderer.toneMappingExposure = 1.0;
									renderer.shadowMap.enabled = true;
									// PCFSoft is the DEFAULT (2026-07 perf pass): VSM renders
									// every receiveShadow object into the shadow pass
									// (castShadow || (receiveShadow && VSM)) — that's every
									// terrain chunk, ~25 extra full-chunk draws per shadow
									// update while flying (20/s). PCF processes casters only,
									// and it's what the WebGL branch has always used.
									// `?shadows=vsm` opts back into the softer VSM look.
									const shadowParam = typeof window !== 'undefined'
										? new URLSearchParams(window.location.search).get('shadows')
										: null;
									renderer.shadowMap.type = shadowParam === 'vsm'
										? THREE.VSMShadowMap
										: THREE.PCFSoftShadowMap;
									return renderer;
								}
							}}
							style={canvasStyle}
						>
						<FrameRateCap fps={frameCapFps} idleFps={idleCapFps} />
						<AdaptiveDpr pixelated />
						<AdaptiveEvents />
						<PerformanceMonitor onFallback={() => setDpr(1)} factor={1} onChange={({ factor }) => setDpr(Math.floor(0.5 + 1.5 * factor))} />
						{useWebGLForXR ? (
						<XR store={xrStore}>
							<FrontPluginProvider>
								<InteractableSystem />
								<EditModeSystem />
								<PluginDialog />
								<XROrigin ref={xrOriginRef} />
								<XRLocomotion originRef={xrOriginRef} />
								<XRInputBridge />
								<VRInteractPrompt />
								<Suspense>
									{props.hdr &&
										<Environment
											blur={0.05}
											files={props.hdr}
											background
										/>
									}
									<ContextBridgeComponent />
									<ShaderPrewarm />

									<Physics
										paused={!physicsEnabled}
										timeStep={1/60}
										updateLoop={"follow"}
										updatePriority={-100}
									>
										{physicsEnabled && (
											<WaitForTerrain>
											<XRPlayerWrapper
												spawnPoint={props.spawnPoint}
												p2pcf={window.p2pcf}
												defaultAvatarVRM={defaultAvatarVRM}
												defaultPlayerAvatar={defaultAvatarVRM}
												movement={movement}
												camCollisions={String(props.camCollisions)}
												avatarHeightOffset={avatarHeightOffset}
												threeObjectPluginRoot={props.threeObjectPluginRoot}
												useWebGLForXR={useWebGLForXR}
												waterLevel={computedWaterLevel}
												xrOriginRef={xrOriginRef}
											/>
											</WaitForTerrain>
										)}
									{loaded && (
										<>
											{useWebGLForXR ? (
											<TeleportTravel
												spawnPoint={props.spawnPoint}
												avatarHeightOffset={avatarHeightOffset}
												userData={{ ...props.userData, vrm: playerAvatar }}
												waterLevel={computedWaterLevel}
											/>
											) : null}
											
											{/* Invisible fallback ground when no environment URL */}
											{!url && (
												<RigidBody type="fixed" colliders="cuboid" position={[0, -2, 0]}>
													<mesh visible={false}>
														<boxGeometry args={[1000, 1, 1000]} />
														<meshStandardMaterial />
													</mesh>
												</RigidBody>
											)}
											
											{(props.networkingBlock.length > 0) && (
												<Participants
												// participants={window.participants}
												/>
											)}
										{url && (
											<SavedObject
												positionY={props.positionY}
												positionX={props.positionX}
												positionZ={props.positionZ}
												rotationY={props.rotationY}
												url={url}
												color={props.backgroundColor}
												hasZoom={props.hasZoom}
												scale={props.scale}
												hasTip={props.hasTip}
												animations={props.animations}
												playerData={props.userData}
												setSpawnPoints={setSpawnPoints}
												//@ts-ignore
												setPhysicsEnabled={setPhysicsEnabled}
											/>
										)}
													{Object.values(props.sky).map(
														(item, index) => {
															return (
																<ThreeSky
																	key={index}
																	src={[item]}
																/>
															);
														}
													)}
													{Object.values(props.imagesToAdd).map((item, index) => (
															isCustomElement(item) ? (
																<EditableBlockHost key={index} kind="image" el={item} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.videosToAdd).map((item, index) => (
															isCustomElement(item) ? (
																<EditableBlockHost key={index} kind="video" el={item} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.audiosToAdd).map((item, index) => (
															isCustomElement(item) ? (
																<EditableBlockHost key={index} kind="audio" el={item} index={index} ctx={blockCtx} />
															) : null
														))}
													{props.lightsToAdd.length < 1 && (
														/* With a procedural terrain, the ProceduralSky sun owns
														   directional light + shadows — stacking this static
														   1.5 directional on top of it overexposed the entire
														   day (and burned a second 1024² shadow pass per
														   frame). Keep only a soft ambient fill. The full
														   default rig remains for skyless/object-viewer
														   worlds, which have no other light source. */
														props.terrainToAdd && props.terrainToAdd.length > 0 ? (
															<ambientLight intensity={0.5} />
														) : (
														<>
															<ambientLight intensity={0.6} />
															<directionalLight
																intensity={1.5}
																position={[30, 40, 20]}
																castShadow
																shadow-mapSize-width={1024}
																shadow-mapSize-height={1024}
																shadow-camera-far={80}
																shadow-camera-near={0.5}
																shadow-camera-left={-25}
																shadow-camera-bottom={-25}
																shadow-camera-right={25}
																shadow-camera-top={25}
																shadow-radius={3}
																shadow-bias={-0.0005}
																shadow-normalBias={0.02}
															/>
														</>
														)
													)}
													{Object.values(props.lightsToAdd).map((item, index) => (
															isCustomElement(item) ? (
																<EditableBlockHost key={index} kind="light" el={item} index={index} ctx={blockCtx} />
															) : null
														))}

													{Object.values(props.npcsToAdd).map((npc, index) => (
															isCustomElement(npc) ? (
																<EditableBlockHost key={index} kind="npc" el={npc} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.rideablesToAdd).map((rideable, index) => (
															isCustomElement(rideable) ? (
																<EditableBlockHost key={index} kind="rideable" el={rideable} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.modelsToAdd).map((model, index) => (
															isCustomElement(model) ? (
																<EditableBlockHost key={index} kind="model" el={model} index={index} ctx={blockCtx} />
															) : null
														))}
													{(props.customBlocksToAdd ?? []).map((c) => (
															isCustomElement(c.el) ? (
																<EditableBlockHost key={`${c.tag}#${c.index}`} kind="custom" tag={c.tag} el={c.el} index={c.index} ctx={blockCtx} />
															) : null
														))}
													<InjectedModels defaultFont={defaultFont} />
													<EditAdditionsHost ctx={blockCtx} />
													<EditGhostsHost />
													<InjectedSolids />
													<InjectedPersistentDecorations />
														{Object.values(props.textToAdd).map((model, index) => (
															isCustomElement(model) ? (
																<EditableBlockHost key={index} kind="text" el={model} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.portalsToAdd).map((model, index) => (
															isCustomElement(model) ? (
																<EditableBlockHost key={index} kind="portal" el={model} index={index} ctx={blockCtx} />
															) : null
														))}
													{props.terrainToAdd && props.terrainToAdd.length > 0 && (() => {
														// Use first terrain's settings for the infinite terrain system
														const terrain = props.terrainToAdd[0];
														if (!isCustomElement(terrain)) return null;

														const getNumAttr = (name: string, defaultValue: number): number => {
															const val = getAttributeSafe(terrain, name);
															return val !== null && val !== '' ? Number(val) : defaultValue;
														};

														const width = getNumAttr('width', 100);
														const height = getNumAttr('height', 100);
														const segments = getNumAttr('segments', 100);
														const scale = getNumAttr('scale', 0.5);
														const heightScale = getNumAttr('heightscale', 50);
														const positionY = getNumAttr('positiony', -10);
														const rotationX = getNumAttr('rotationx', 0);
														const rotationY = getNumAttr('rotationy', 0);
														const rotationZ = getNumAttr('rotationz', 0);
														const color = getAttributeSafe(terrain, 'color') || '#4a7c59';
														const roughness = getNumAttr('roughness', 0.8);
														const metalness = getNumAttr('metalness', 0.2);
														const seed = getAttributeSafe(terrain, 'seed') || Math.random().toString();
														const noiseOctaves = getNumAttr('noiseoctaves', 6);
														const noisePersistence = getNumAttr('noisepersistence', 0.5);
														const noiseLacunarity = getNumAttr('noiselacunarity', 2);
														const skyColor = getAttributeSafe(terrain, 'skycolor') || '#87CEEB';
														const horizonColor = getAttributeSafe(terrain, 'horizoncolor') || '#E0F7FF';
														const cloudColor = getAttributeSafe(terrain, 'cloudcolor') || '#ffffff';
														const cloudDensity = getNumAttr('clouddensity', 0.5);
														const cloudScale = getNumAttr('cloudscale', 1);
														const cloudSpeed = getNumAttr('cloudspeed', 0.1);
														const cloudHeight = getNumAttr('cloudheight', 100);
														const cloudLayers = getNumAttr('cloudlayers', 3);
														const timeOfDay = getNumAttr('timeofday', 12);
														const timeCycleDuration = getNumAttr('timecycleduration', 0);
														// Chunk radius around the player. Parsed by the scanner
														// but never forwarded here, so the attribute was inert.
														const renderDistance = getNumAttr('renderdistance', 2);

														return (
															<InfiniteTerrain
																width={width}
																height={height}
																segments={segments}
																scale={scale}
																heightScale={heightScale}
																positionY={positionY}
																rotationX={rotationX}
																rotationY={rotationY}
																rotationZ={rotationZ}
																color={color}
																roughness={roughness}
																metalness={metalness}
																seed={seed}
																noiseOctaves={noiseOctaves}
																noisePersistence={noisePersistence}
																noiseLacunarity={noiseLacunarity}
																skyColor={skyColor}
																horizonColor={horizonColor}
																cloudColor={cloudColor}
																cloudDensity={cloudDensity}
																cloudScale={cloudScale}
															cloudSpeed={cloudSpeed}
															cloudHeight={cloudHeight}
															cloudLayers={cloudLayers}
															timeOfDay={timeOfDay}
																timeCycleDuration={timeCycleDuration}
																renderDistance={renderDistance}
																useWebGLForXR={useWebGLForXR}
													/>
												);
										})()}
										</>
									)}
									</Physics>
								</Suspense>
								{/* <OrbitControls
								enableZoom={ true }
							/> */}
							</FrontPluginProvider>
						</XR>
						) : (
							<FrontPluginProvider>
								<InteractableSystem />
								<EditModeSystem />
								<PluginDialog />
								{/* <Perf className="stats" /> */}
								<Suspense>
									{props.hdr &&
										<Environment
											blur={0.05}
											files={props.hdr}
											background
										/>
									}
									<ContextBridgeComponent />
									<ShaderPrewarm />
									<Physics
										paused={!physicsEnabled}
										timeStep={1/60}
										updateLoop={"follow"}
										updatePriority={-100}
									>
										{physicsEnabled && (
											<WaitForTerrain>
											<Player
												spawnPoint={props.spawnPoint}
												p2pcf={window.p2pcf}
												defaultAvatarVRM={defaultAvatarVRM}
												defaultPlayerAvatar={defaultAvatarVRM}
												movement={movement}
												camCollisions={String(props.camCollisions)}
												avatarHeightOffset={avatarHeightOffset}
												threeObjectPluginRoot={props.threeObjectPluginRoot}
												useWebGLForXR={useWebGLForXR}
												waterLevel={computedWaterLevel}
											/>
											</WaitForTerrain>
										)}
										{loaded && (
											<>
												{/* No TeleportTravel in non-XR mode */}
												{!url && (
													<RigidBody type="fixed" colliders="cuboid" position={[0, -2, 0]}>
														<mesh visible={false}>
															<boxGeometry args={[1000, 1, 1000]} />
															<meshStandardMaterial />
														</mesh>
													</RigidBody>
												)}
													{(props.networkingBlock.length > 0) && (
														<Participants />
													)}
										{url && (
											<SavedObject
												positionY={props.positionY}
												positionX={props.positionX}
												positionZ={props.positionZ}
												rotationY={props.rotationY}
												url={url}
												color={props.backgroundColor}
												hasZoom={props.hasZoom}
												scale={props.scale}
												hasTip={props.hasTip}
												animations={props.animations}
												playerData={props.userData}
												setSpawnPoints={setSpawnPoints}
												//@ts-ignore
												setPhysicsEnabled={setPhysicsEnabled}
											/>
										)}
													{Object.values(props.sky).map(
														(item, index) => {
															return (
																<ThreeSky
																	key={index}
																	src={[item]}
																/>
															);
														}
													)}
													{Object.values(props.imagesToAdd).map((item, index) => (
															isCustomElement(item) ? (
																<EditableBlockHost key={index} kind="image" el={item} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.videosToAdd).map((item, index) => (
															isCustomElement(item) ? (
																<EditableBlockHost key={index} kind="video" el={item} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.audiosToAdd).map((item, index) => (
															isCustomElement(item) ? (
																<EditableBlockHost key={index} kind="audio" el={item} index={index} ctx={blockCtx} />
															) : null
														))}
													{props.lightsToAdd.length < 1 && (
														/* With a procedural terrain, the ProceduralSky sun owns
														   directional light + shadows — stacking this static
														   1.5 directional on top of it overexposed the entire
														   day (and burned a second 1024² shadow pass per
														   frame). Keep only a soft ambient fill. The full
														   default rig remains for skyless/object-viewer
														   worlds, which have no other light source. */
														props.terrainToAdd && props.terrainToAdd.length > 0 ? (
															<ambientLight intensity={0.5} />
														) : (
														<>
															<ambientLight intensity={0.6} />
															<directionalLight
																intensity={1.5}
																position={[30, 40, 20]}
																castShadow
																shadow-mapSize-width={1024}
																shadow-mapSize-height={1024}
																shadow-camera-far={80}
																shadow-camera-near={0.5}
																shadow-camera-left={-25}
																shadow-camera-bottom={-25}
																shadow-camera-right={25}
																shadow-camera-top={25}
																shadow-radius={3}
																shadow-bias={-0.0005}
																shadow-normalBias={0.02}
															/>
														</>
														)
													)}
													{Object.values(props.lightsToAdd).map((item, index) => (
															isCustomElement(item) ? (
																<EditableBlockHost key={index} kind="light" el={item} index={index} ctx={blockCtx} />
															) : null
														))}

													{Object.values(props.npcsToAdd).map((npc, index) => (
															isCustomElement(npc) ? (
																<EditableBlockHost key={index} kind="npc" el={npc} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.rideablesToAdd).map((rideable, index) => (
															isCustomElement(rideable) ? (
																<EditableBlockHost key={index} kind="rideable" el={rideable} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.modelsToAdd).map((model, index) => (
															isCustomElement(model) ? (
																<EditableBlockHost key={index} kind="model" el={model} index={index} ctx={blockCtx} />
															) : null
														))}
													{(props.customBlocksToAdd ?? []).map((c) => (
															isCustomElement(c.el) ? (
																<EditableBlockHost key={`${c.tag}#${c.index}`} kind="custom" tag={c.tag} el={c.el} index={c.index} ctx={blockCtx} />
															) : null
														))}
													<InjectedModels defaultFont={defaultFont} />
													<EditAdditionsHost ctx={blockCtx} />
													<EditGhostsHost />
													<InjectedSolids />
													<InjectedPersistentDecorations />
														{Object.values(props.textToAdd).map((model, index) => (
															isCustomElement(model) ? (
																<EditableBlockHost key={index} kind="text" el={model} index={index} ctx={blockCtx} />
															) : null
														))}
													{Object.values(props.portalsToAdd).map((model, index) => (
															isCustomElement(model) ? (
																<EditableBlockHost key={index} kind="portal" el={model} index={index} ctx={blockCtx} />
															) : null
														))}
													{props.terrainToAdd && props.terrainToAdd.length > 0 && (() => {
														const terrain = props.terrainToAdd[0];
														if (!isCustomElement(terrain)) return null;

														const getNumAttr = (name: string, defaultValue: number): number => {
															const val = getAttributeSafe(terrain, name);
															return val !== null && val !== '' ? Number(val) : defaultValue;
														};

														const width = getNumAttr('width', 100);
														const height = getNumAttr('height', 100);
														const segments = getNumAttr('segments', 100);
														const scale = getNumAttr('scale', 0.5);
														const heightScale = getNumAttr('heightscale', 50);
														const positionY = getNumAttr('positiony', -10);
														const rotationX = getNumAttr('rotationx', 0);
														const rotationY = getNumAttr('rotationy', 0);
														const rotationZ = getNumAttr('rotationz', 0);
														const color = getAttributeSafe(terrain, 'color') || '#4a7c59';
														const roughness = getNumAttr('roughness', 0.8);
														const metalness = getNumAttr('metalness', 0.2);
														const seed = getAttributeSafe(terrain, 'seed') || Math.random().toString();
														const noiseOctaves = getNumAttr('noiseoctaves', 6);
														const noisePersistence = getNumAttr('noisepersistence', 0.5);
														const noiseLacunarity = getNumAttr('noiselacunarity', 2);
														const skyColor = getAttributeSafe(terrain, 'skycolor') || '#87CEEB';
														const horizonColor = getAttributeSafe(terrain, 'horizoncolor') || '#E0F7FF';
														const cloudColor = getAttributeSafe(terrain, 'cloudcolor') || '#ffffff';
														const cloudDensity = getNumAttr('clouddensity', 0.5);
														const cloudScale = getNumAttr('cloudscale', 1);
														const cloudSpeed = getNumAttr('cloudspeed', 0.1);
														const cloudHeight = getNumAttr('cloudheight', 100);
														const cloudLayers = getNumAttr('cloudlayers', 3);
														const timeOfDay = getNumAttr('timeofday', 12);
														const timeCycleDuration = getNumAttr('timecycleduration', 0);
														// Chunk radius around the player. Parsed by the scanner
														// but never forwarded here, so the attribute was inert.
														const renderDistance = getNumAttr('renderdistance', 2);

														return (
															<InfiniteTerrain
																width={width}
																height={height}
																segments={segments}
																scale={scale}
																heightScale={heightScale}
																positionY={positionY}
																rotationX={rotationX}
																rotationY={rotationY}
																rotationZ={rotationZ}
																color={color}
																roughness={roughness}
																metalness={metalness}
																seed={seed}
																noiseOctaves={noiseOctaves}
																noisePersistence={noisePersistence}
																noiseLacunarity={noiseLacunarity}
																skyColor={skyColor}
																horizonColor={horizonColor}
																cloudColor={cloudColor}
																cloudDensity={cloudDensity}
																cloudScale={cloudScale}
															cloudSpeed={cloudSpeed}
															cloudHeight={cloudHeight}
															cloudLayers={cloudLayers}
															timeOfDay={timeOfDay}
																timeCycleDuration={timeCycleDuration}
																renderDistance={renderDistance}
																useWebGLForXR={useWebGLForXR}
															/>
														);
												})()}
											</>
										)}
									</Physics>
								</Suspense>
							</FrontPluginProvider>
						)}
					</Canvas>
					{/* VR entry moved to the HUD "More" menu — see the
					    registerMenuItem effect above. */}
					</div>
					<NPCChatGate
						objectsInRoom={objectsInRoom}
						showUI={showUI}
						initializing={initializing}
					/>
					<InteractableBanner />
					<ControlsHint />
					<>
						{isMobile() && <MobileControls />}
					</>
				</>
			);
		}
	} else {
		return (
			<div
				ref={canvasRef}
				style={{
					backgroundColor: props.backgroundColor,
					backgroundImage: `url(${props.previewImage})`,
					backgroundPosition: "center",
					backgroundSize: "cover",
					margin: "0",
					height: "100vh",
					width: "100%",
					padding: "0",
					alignItems: "center",
					justifyContent: "center",
					display: "flex",
				}}
			>
				<div
					className={"xr-publisher-entry-flow"}
					style={{
						width: "250px",
						position: "relative",
						padding: "20px",
						boxSizing: "border-box",
						color: "#fff",
					}}
				>
					<div>
						<div className="xr-publisher-entry-pfp" style={{ backgroundImage: `url(${props.userData.profileImage})` }}></div>
						{/* <span>Display Name</span> */}
						{(props.networkingBlock.length > 0) ? (
							<>
							<input
									type="text"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									style={entryInputStyle}
								/>
								{(props.networkingBlock[0]?.customAvatars?.value === "1") && (
									<div>
										<span>VRM or Sprite URL</span>
										<input
											type="text"
											value={playerAvatar} // Use value instead of defaultValue for controlled component
											onChange={(e) => setPlayerAvatar(e.target.value)}
											onDrop={(e) => {
												e.preventDefault();
												setPlayerAvatar(e.dataTransfer.getData('text'));
											}}
											style={entryInputStyle}
										/>
									</div>
								)}
								<button
									className="xr-publisher-load-world-button-secondary"
									onClick={() => {
										goToPrivateRoom();
										canvasRef.current?.scrollIntoView({ behavior: 'smooth' });
										setLoaded(true);
									}}
									style={{ padding: "10px" }}
								>
									Join Private
								</button>
							</>
						) : (
							<div>
								<span>VRM or Sprite URL</span>
								<input
									type="text"
									value={playerAvatar}  // Use value instead of defaultValue
									onChange={(e) => setPlayerAvatar(e.target.value)}
									style={entryInputStyle}
								/>
							</div>
						)}

					</div>
					<button
						className="xr-publisher-load-world-button"
						onClick={() => {
							canvasRef.current?.scrollIntoView({ behavior: 'smooth' });
							setLoaded(true);
						}}
						style={{
							padding: "10px",
							color: "white"
						}}
					>
						{props.networkingBlock.length > 0 ? "Join Public" : "Load World"}
					</button>
					{(props.networkingBlock.length > 0) && (
						<div className="xr-publisher-entry-flow-instruction">
							<p>After entering, use the "Join Voice" button to select your microphone.</p>
						</div>
					)}
				</div>
			</div>
		);
	}
}
