import * as THREE from "three";
// Import these at the top of your EnvironmentFront.tsx file
import { Object3D, Vector3, Quaternion, Euler } from 'three';
import type { SpawnPoint, EnvironmentFrontProps } from '../types/types';
import { Portal } from './core/front/Portal';
import { ThreeSky } from "./core/front/ThreeSky";
import { ThreeVideo } from "./core/front/ThreeVideo";
import { ThreeAudio } from "./core/front/ThreeAudio";
import { ThreeLight } from "./core/front/ThreeLight";
import { TextObject } from "./core/front/TextObject";
import { ModelObject } from "./core/front/ModelObject";
import { ThreeImage } from "./core/front/ThreeImage";
import { NPCObject } from "./core/front/NPCObject.js";
import { debounce } from 'lodash';
import { Loader2 } from 'lucide-react';
import ChatBox from './chatbox.js';
//@ts-ignore
import { LookingGlassWebXRPolyfill, LookingGlassConfig } from "@lookingglass/webxr"

import React, { Suspense, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useLoader, useThree, Canvas } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
// import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { Physics, RigidBody } from "@react-three/rapier";
import ScrollableFeed from 'react-scrollable-feed'
import { Environment } from "@react-three/drei";
// import { FrontPluginProvider, FrontPluginContext } from './FrontPluginProvider';  // Import the PluginProvider
import { FrontPluginProvider } from './FrontPluginProvider';  // Import the PluginProvider
import {
	useAnimations,
	AdaptiveDpr,
	AdaptiveEvents,
	PerformanceMonitor,
} from "@react-three/drei";
import { EcctrlJoystick } from 'ecctrl'

// import { A11y } from "@react-three/a11y";
import { GLTFAudioEmitterExtension } from "three-omi";
import { XR, Controllers, Hands } from '@react-three/xr'
// import { Perf } from "r3f-perf";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import TeleportTravel from "./TeleportTravel.js";
import Player from "./Player.jsx";
import defaultEnvironment from "../defaults/assets/default_grid.glb";
import defaultLoadingZoomGraphic from "../defaults/assets/room_entry_background.svg";
import defaultFont from "../defaults/fonts/roboto.woff";
import { Participants } from "./core/front/Participants.js";
import { useKeyboardControls } from "./Controls.js";
import { ContextBridgeComponent } from "./ContextBridgeComponent.js";
// import { Reflector } from 'three/examples/jsm/objects/Reflector';

import { defaultAvatarVRM } from "@/assets/index.js";

// import type {
// 	SavedObjectProps,
// 	// ThreeObjectFrontProps,
// 	// OrbitControlsRef,
// 	// FloorProps
// } from '../types/three-object-types';

// Add these interfaces to help with typing
// interface ChatMessage {
// 	tone?: string;
// 	message: string;
// }
// interface SavedObjectProps {
// 	url: string;
// 	positionY: number;
// 	positionX?: number;
// 	positionZ?: number;
// 	rotationY: number;
// 	scale: number;
// 	setSpawnPoints: (points: any[]) => void;
// 	label?: string;
// 	playerData?: any;
// 	color?: string;
// 	hasZoom?: string;
// 	hasTip?: string;
// 	animations?: string;
// 	deviceTarget?: string;
//   }



interface ColliderItem extends Array<Object3D | any> {
	0: Object3D;
	1: {
		type: string;
	};
}

// Type definitions for state variables
// interface EnvironmentState {
// 	loadedAudios: any[];
// 	allAudiosLoaded: boolean;
// 	showUI: boolean;
// 	displayName: string;
// 	playerAvatar: string;
// 	messages: string[];
// 	messageHistory?: string[];
// 	loaded: boolean;
// 	spawnPoints: SpawnPoint[];
// 	messageObject: ChatMessage;
// 	objectsInRoom: string[];
// 	url: string;
// 	loadingWorld: boolean;
// 	dpr: number;
// }

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
}

// Type for the collider callback
type ColliderCallback = (item: ColliderItem, index: number) => JSX.Element | null;

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

function hasAttributeSafe(element: unknown, attr: string): boolean {
	if (isCustomElement(element)) {
		return element.hasAttribute(attr);
	}
	return false;
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

const Loading = ({ previewImage }: { previewImage: string }) => {
	return (
		<div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-slate-900 to-slate-800">
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

				{/* Loading Text */}
				<div className="text-white/90 text-lg font-medium">
					Loading Experience...
				</div>

				{/* Controls Info Card */}
				<div className="mt-8 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white/90 text-sm">
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
	useEffect(() => {
		// Once the component is ready, dispatch an event to notify the parent
		const event = new Event('mainComponentReady');
		document.dispatchEvent(event);
	}, []);


	useThree(({ camera, scene }) => {
		window.scene = scene;
		window.camera = camera;
	});

	const [url, set] = useState(props.url);
	useEffect(() => {
		setTimeout(() => set(props.url), 2000)
		// const config = LookingGlassConfig
		// config.targetY = 0
		// config.targetZ = 0
		// config.targetDiam = 3
		// config.fovy = (40 * Math.PI) / 180
		// new LookingGlassWebXRPolyfill()
	}, []);
	// const [listener] = useState(() => new THREE.AudioListener());
	const [colliders, setColliders] = useState<ColliderItem[]>([]);
	const [meshes, setMeshes] = useState<Object3D | undefined>();
	const [portals, setPortals] = useState<Object3D[]>([]);

	// useThree(({ camera }) => {
	// 	camera.add(listener);
	// });


	const gltf = useLoader(GLTFLoader, url, (loader) => {
		// const dracoLoader = new DRACOLoader();
		// dracoLoader.setDecoderPath(threeObjectPluginRoot + "/inc/utils/draco/");
		// dracoLoader.setDecoderConfig({ type: 'js' });
		// loader.setDRACOLoader(dracoLoader);

		// loader.register(
		// 	(parser) => new GLTFAudioEmitterExtension(parser, listener)
		// );

		loader.register((parser) => {
			return new VRMLoaderPlugin(parser);
		});
	});
	const meshesScene = new THREE.Object3D();

	// {colliders &&
	// 	colliders.map((item, index) => {
	// 		const pos = new THREE.Vector3();
	// 		const quat = new THREE.Quaternion();
	// 		const rotation = new THREE.Euler();
	// 		const quaternion = item[0].getWorldQuaternion(quat);
	// 		const finalRotation =
	// 		rotation.setFromQuaternion(quaternion);
	// 		const worldPosition = item[0].getWorldPosition(pos);
	// 		if (item[1].type === "mesh") {
	// 			return (
	// 				<RigidBody type="fixed" colliders="trimesh">
	// 					<primitive
	// 						rotation={finalRotation}
	// 						position={worldPosition}
	// 						object={item[0]}
	// 					/>
	// 				</RigidBody>
	// 			);
	// 		}
	// 		if (item[1].type === "box") {
	// 			return (
	// 				<RigidBody type="fixed" colliders="cuboid">
	// 					<primitive
	// 						rotation={finalRotation}
	// 						position={worldPosition}
	// 						object={item[0]}
	// 					/>
	// 				</RigidBody>
	// 			);
	// 		}
	// 		if (item[1].type === "capsule") {
	// 			return (
	// 				<RigidBody type="fixed" colliders="hull">
	// 					<primitive
	// 						rotation={finalRotation}
	// 						position={worldPosition}
	// 						object={item[0]}
	// 					/>
	// 				</RigidBody>
	// 			);
	// 		}
	// 		if (item[1].type === "sphere") {
	// 			return (
	// 				<RigidBody type="fixed" colliders="ball">
	// 					<primitive
	// 						rotation={finalRotation}
	// 						position={worldPosition}
	// 						object={item[0]}
	// 					/>
	// 				</RigidBody>
	// 			);
	// 		}
	// 	})}


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



	useEffect(() => {
		//OMI_collider logic.
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
		if (gltf.userData.gltfExtensions?.OMI_collider) {
			omiColliders = gltf.userData.gltfExtensions.OMI_collider.colliders;
		}

		gltf.scene.traverse((child) => {
			// @todo figure out shadows
			// if (child.isMesh) {
			// 	child.castShadow = true;
			// 	child.receiveShadow = true;
			// }
			if ((child as THREE.Mesh).isMesh) {
				if (child.userData.gltfExtensions?.MX_lightmap) {
					// @ts-ignore
					const extension = child.userData.gltfExtensions?.MX_lightmap;
					// @todo implement MX_lightmap
				}
				// add the mesh to the scene
				// meshesScene.add(child);
			}
			if (child.userData.gltfExtensions?.OMI_collider) {
				childrenToParse.push(child);
				// child.parent.remove(child.name);
			}
			if (child.userData.gltfExtensions?.OMI_link) {
				portalsToAdd.push(child);
			} else if (child.userData.gltfExtensions?.OMI_spawn_point) {
				spawnPointsToAdd.push(child);
			} else {
				meshesToAdd.push(child);
			}
			// emit event to notify that the scene is loaded
			// after 2 seconds fire the event
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
			// gltf.scene.remove(child.name);
		});
		setColliders(collidersToAdd);
		setMeshes(meshesScene);
		setPortals(portalsToAdd);
		props.setSpawnPoints(spawnPointsToAdd.map(point => [point.position.x, point.position.y, point.position.z]));
		// @ts-ignore
		props.setPhysicsEnabled(true);
		// End OMI_collider logic.
	}, []);

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
					// rotation={finalRotation}
					castShadow
					receiveShadow
					// position={item.getWorldPosition(pos)}
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
							threeObjectPluginRoot={threeObjectPluginRoot}
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

export default function EnvironmentFront(props: EnvironmentFrontProps) {
	const [avatarUrl, setAvatarUrl] = useState<string>(props.userData.playerVRM || defaultAvatarVRM);
	const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({});
	const [activeChatNPC, setActiveChatNPC] = useState<string | null>(null);
	const [roomId, setRoomId] = useState<string | undefined>();
	const [initializing, setInitializing] = useState(true);
	const [ physicsEnabled, setPhysicsEnabled ] = useState(false);
	console.log("all the props", props);
	const initializeChatSession = async (npcName: string, personality: string) => {
		try {
			const response = await fetch('https://xr-publisher.sxpdigital.workers.dev/api/character/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					author: 'antpb', // or however you want to identify NPC authors
					name: npcName,
					personality
				})
			});

			const data = await response.json();
			if (data.error) throw new Error(data.error);

			setChatSessions(prev => ({
				...prev,
				[npcName]: {
					id: data.roomId,
					npcName,
					messages: []
				}
			}));

			return data.roomId;
		} catch (error) {
			console.error('Failed to initialize chat session:', error);
			return null;
		}
	};

	// Memoized handlers for avatar URL updates
	const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newUrl = e.target.value;
		setAvatarUrl(newUrl);

		// Optional: Validate URL format
		const isValidUrl = /^(http|https):\/\/[^ "]+$/.test(newUrl) || newUrl === '';
		if (isValidUrl) {
			props.userData.playerVRM = newUrl || defaultAvatarVRM;
		}
	}, []);

	const handleAvatarDrop = useCallback((e: React.DragEvent<HTMLInputElement>) => {
		e.preventDefault();
		const url = e.dataTransfer.getData('text');
		setAvatarUrl(url);
		props.userData.playerVRM = url;
	}, []);

	const [loadedAudios, setLoadedAudios] = useState<any[]>([]);
	const [allAudiosLoaded, setAllAudiosLoaded] = useState(false);


	const [showUI] = useState(true);
	const [displayName, setDisplayNameImmediate] = useState(props.userData.inWorldName);
	const [playerAvatar, setPlayerAvatarImmediate] = useState(props.userData.playerVRM || window.defaultAvatar);

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
	const movement = useKeyboardControls();


	// const [messageHistory, setMessageHistory] = useState();
	const [loaded, setLoaded] = useState(false);
	//@ts-ignore
	const [spawnPoints, setSpawnPoints] = useState<SpawnPoint[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [objectsInRoom, setObjectsInRoom] = useState<string[]>([]);
	const [url] = useState(props.threeUrl ? props.threeUrl : (defaultEnvironment));
	const [loadingWorld, setLoadingWorld] = useState(true);

	const canvasRef = useRef<HTMLDivElement>(null);
	const r3fCanvasRef = useRef<HTMLCanvasElement>(null);
	const avatarHeightOffset = useRef<number>(0);

	// const mirror = new Reflector(
	// 	new THREE.PlaneGeometry(Number(100), Number(100)),
	// 	{
	// 		color: new THREE.Color(0x7f7f7f),
	// 		textureWidth: 1440,
	// 		textureHeight: 1440
	// 	}
	// );

	// useEffect(() => {
	// 	async function initSession() {
	// 		if (props.npcsToAdd.length === 0) return;

	// 		const npc = props.npcsToAdd[0];
	// 		const name = getAttributeSafe(npc, 'name');
	// 		const personality = getAttributeSafe(npc, 'personality');

	// 		try {
	// 			const response = await fetch('https://xr-publisher.sxpdigital.workers.dev/api/character/session', {
	// 				method: 'POST',
	// 				headers: { 'Content-Type': 'application/json' },
	// 				body: JSON.stringify({
	// 					author: 'antpb',
	// 					name,
	// 					personality
	// 				})
	// 			});

	// 			const data = await response.json();
	// 			if ('error' in data) throw new Error(data.error);

	// 			setRoomId(data.roomId);
	// 		} catch (error) {
	// 			console.error('Failed to initialize chat:', error);
	// 		} finally {
	// 			setInitializing(false);
	// 		}
	// 	}

	// 	initSession();
	// }, [props.npcsToAdd]); // Dependency on npcs being added

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

	if (loaded === true) {
		// emit javascript event "loaded"
		const loadedEvent = new Event("loaded");
		window.dispatchEvent(loadedEvent);
		// const elements = document.body.getElementsByTagName('*');
		// const webXRNotAvail = Array.from(elements).find((el) => el.textContent === 'WEBXR NOT AVAILABLE');
		// if (webXRNotAvail) {
		// 	webXRNotAvail.style.display = "none";
		// }
		props.userData.inWorldName = displayName;
		window.userData = props.userData;
		props.userData.playerVRM = playerAvatar;

		if (props.deviceTarget === "vr") {
			return (
				<>
					{loadingWorld && <Loading previewImage={props.previewImage} />}
					<Canvas
						ref={r3fCanvasRef}
						tabIndex={0}
						shadows
						resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
						camera={{
							fov: 70,
							zoom: 1,
							far: 2000,
							position: [0, 0, 20]
						}}
						onPointerDown={(e) => {
							(e.target as HTMLCanvasElement).requestPointerLock();
						}}
						className="xr-publisher-main-canvas"
						dpr={dpr}

						style={{
							backgroundColor: props.backgroundColor,
							margin: "0",
							height: "100vh",
							width: "100%",
							padding: "0",
							position: "relative",
							zIndex: 1
						}}
					>
						<AdaptiveDpr pixelated />
						<AdaptiveEvents />
						<PerformanceMonitor onFallback={() => setDpr(1)} factor={1} onChange={({ factor }) => setDpr(Math.floor(0.5 + 1.5 * factor))} />
						<XR>
							<FrontPluginProvider>
								{/* <Perf className="stats" /> */}
								<Hands />
								<Controllers />
								<Suspense>
									{props.hdr &&
										<Environment
											blur={0.05}
											files={props.hdr}
											background
										/>
									}
									<ContextBridgeComponent />
									<Physics
										paused={!physicsEnabled}
										// timestep = {1/30}
										// gravity={[0, -9.8, 0]}
										// interpolate={false}


										// allowCcd={true}
										// updateLoop="independent"
										debug={false}
										timeStep={"vary"}
										updateLoop={"follow"}
										updatePriority={-100}
										// paused={!physicsEnabled}
										// debug={true}
										// timeStep={1/60}
										// updateLoop="independent"
										// gravity={[0, -9.81, 0]}
										// interpolate={true}
									
									>
										<Player
											spawnPoint={props.spawnPoint}
											p2pcf={window.p2pcf}
											defaultAvatarVRM={defaultAvatarVRM}
											defaultPlayerAvatar={defaultAvatarVRM}
											movement={movement}
											camCollisions={String(props.camCollisions)}
											avatarHeightOffset={avatarHeightOffset}
											threeObjectPluginRoot={props.threeObjectPluginRoot}
										/>
										{/* <Perf className="stats" /> */}
										{/* Debug physics */}
										{url && loaded && (
											<>
												<TeleportTravel
													spawnPoint={props.spawnPoint}
													avatarHeightOffset={avatarHeightOffset}
													useNormal={false}
													userData={{ ...props.userData, vrm: playerAvatar }}
												>
													{(props.networkingBlock.length > 0) && (
														<Participants
														// participants={window.participants}
														/>
													)}
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
													{Object.values(props.sky).map(
														(item, index) => {
															return (
																<>
																	<ThreeSky
																		src={props.sky}
																	/>
																</>
															);
														}
													)}
													{Object.values(
														props.imagesToAdd
													).map((item, index) => {
														if (!isCustomElement(item)) return null;

														const attributes = {
															positionX: getAttributeSafe(item, 'positionX'),
															positionY: getAttributeSafe(item, 'positionY'),
															positionZ: getAttributeSafe(item, 'positionZ'),
															scaleX: getAttributeSafe(item, 'scaleX'),
															scaleY: getAttributeSafe(item, 'scaleY'),
															scaleZ: getAttributeSafe(item, 'scaleZ'),
															rotationX: getAttributeSafe(item, 'rotationX'),
															rotationY: getAttributeSafe(item, 'rotationY'),
															rotationZ: getAttributeSafe(item, 'rotationZ'),
															imageUrl: getAttributeSafe(item, 'imageUrl'),
															aspectHeight: getAttributeSafe(item, 'aspectHeight'),
															aspectWidth: getAttributeSafe(item, 'aspectWidth'),
															transparent: getAttributeSafe(item, 'transparent') === 'true',
														};

														return (
															<ThreeImage
																key={index}
																url={attributes.imageUrl}
																positionX={Number(attributes.positionX)}
																positionY={Number(attributes.positionY)}
																positionZ={Number(attributes.positionZ)}
																scaleX={Number(attributes.scaleX)}
																scaleY={Number(attributes.scaleY)}
																scaleZ={Number(attributes.scaleZ)}
																rotationX={Number(attributes.rotationX)}
																rotationY={Number(attributes.rotationY)}
																rotationZ={Number(attributes.rotationZ)}
																aspectHeight={Number(attributes.aspectHeight)}
																aspectWidth={Number(attributes.aspectWidth)}
																transparent={String(attributes.transparent)}
															/>
														);
													})}
													{Object.values(props.videosToAdd).map((item, index) => {
														if (!isCustomElement(item)) return null;

														const attributes = {
															positionX: getAttributeSafe(item, 'positionX'),
															positionY: getAttributeSafe(item, 'positionY'),
															positionZ: getAttributeSafe(item, 'positionZ'),
															scaleX: getAttributeSafe(item, 'scaleX'),
															scaleY: getAttributeSafe(item, 'scaleY'),
															scaleZ: getAttributeSafe(item, 'scaleZ'),
															rotationX: getAttributeSafe(item, 'rotationX'),
															rotationY: getAttributeSafe(item, 'rotationY'),
															rotationZ: getAttributeSafe(item, 'rotationZ'),
															videoUrl: getAttributeSafe(item, 'videoUrl'),
															aspectHeight: getAttributeSafe(item, 'aspectHeight'),
															aspectWidth: getAttributeSafe(item, 'aspectWidth'),
															autoPlay: hasAttributeSafe(item, 'autoplay') ? "1" : "0",
															customModel: getAttributeSafe(item, 'customModel'),
															videoModelUrl: getAttributeSafe(item, 'modelUrl'),
															videoControlsEnabled: getAttributeSafe(item, 'videoControlsEnabled') === "1" ? true : false,
														};

														return (
															<ThreeVideo
																key={index}
																url={attributes.videoUrl}
																positionX={Number(attributes.positionX)}
																positionY={Number(attributes.positionY)}
																positionZ={Number(attributes.positionZ)}
																scaleX={Number(attributes.scaleX)}
																scaleY={Number(attributes.scaleY)}
																scaleZ={Number(attributes.scaleZ)}
																rotationX={Number(attributes.rotationX)}
																rotationY={Number(attributes.rotationY)}
																rotationZ={Number(attributes.rotationZ)}
																aspectHeight={Number(attributes.aspectHeight)}
																aspectWidth={Number(attributes.aspectWidth)}
																autoPlay={attributes.autoPlay}
																customModel={attributes.customModel}
																threeObjectPluginRoot={threeObjectPluginRoot}
																modelUrl={attributes.videoModelUrl}
																videoControlsEnabled={attributes.videoControlsEnabled}
															/>
														);
													})}
													{Object.values(props.audiosToAdd).map((item, index) => {
														if (!isCustomElement(item)) return null;

														const attributes = {
															audioUrl: getAttributeSafe(item, 'audioUrl'),
															positionX: Number(getAttributeSafe(item, 'positionX')),
															positionY: Number(getAttributeSafe(item, 'positionY')),
															positionZ: Number(getAttributeSafe(item, 'positionZ')),
															rotationX: Number(getAttributeSafe(item, 'rotationX')),
															rotationY: Number(getAttributeSafe(item, 'rotationY')),
															rotationZ: Number(getAttributeSafe(item, 'rotationZ')),
															autoPlay: hasAttributeSafe(item, 'autoplay') ? "1" : "0",
															loop: hasAttributeSafe(item, 'loop') ? "1" : "0",
															volume: Number(getAttributeSafe(item, 'volume')),
															positional: hasAttributeSafe(item, 'positional') ? "1" : "0",
															coneInnerAngle: Number(getAttributeSafe(item, 'coneInnerAngle')),
															coneOuterAngle: Number(getAttributeSafe(item, 'coneOuterAngle')),
															coneOuterGain: Number(getAttributeSafe(item, 'coneOuterGain')),
															distanceModel: getAttributeSafe(item, 'distanceModel'),
															maxDistance: Number(getAttributeSafe(item, 'maxDistance')),
															refDistance: Number(getAttributeSafe(item, 'refDistance')),
															rolloffFactor: Number(getAttributeSafe(item, 'rolloffFactor')),
														};

														return (
															<ThreeAudio
																key={index}
																threeAudio={attributes}
																onLoad={(loadedAudio) => {
																	setLoadedAudios(prev => [...prev, loadedAudio]);
																}}
															/>
														);
													})}
													{props.lightsToAdd.length < 1 && (
														<>
															<ambientLight intensity={0.8} />
															<directionalLight
																intensity={0.7}
																position={[0, 2, 2]}
															// shadow-mapSize-width={512}
															// shadow-mapSize-height={512}
															// shadow-camera-far={5000}
															// shadow-camera-fov={15}
															// shadow-camera-near={0.5}
															// shadow-camera-left={-50}
															// shadow-camera-bottom={-50}
															// shadow-camera-right={50}
															// shadow-camera-top={50}
															// shadow-radius={1}
															// shadow-bias={-0.001}
															// castShadow
															/>
														</>
													)}
													{Object.values(props.lightsToAdd).map((item, index) => {
														if (!isCustomElement(item)) return null;

														const attributes = {
															positionX: getAttributeSafe(item, 'positionX'),
															positionY: getAttributeSafe(item, 'positionY'),
															positionZ: getAttributeSafe(item, 'positionZ'),
															rotationX: getAttributeSafe(item, 'rotationX'),
															rotationY: getAttributeSafe(item, 'rotationY'),
															rotationZ: getAttributeSafe(item, 'rotationZ'),
															type: getAttributeSafe(item, 'type') || 'ambient',
															color: getAttributeSafe(item, 'color'),
															intensity: getAttributeSafe(item, 'intensity'),
															distance: getAttributeSafe(item, 'distance'),
															decay: getAttributeSafe(item, 'decay'),
															angle: getAttributeSafe(item, 'angle'),
															penumbra: getAttributeSafe(item, 'penumbra'),
														};

														return (
															<ThreeLight
																key={index}
																positionX={Number(attributes.positionX)}
																positionY={Number(attributes.positionY)}
																positionZ={Number(attributes.positionZ)}
																rotationX={Number(attributes.rotationX)}
																rotationY={Number(attributes.rotationY)}
																rotationZ={Number(attributes.rotationZ)}
																type={attributes.type as 'ambient' | 'directional' | 'point' | 'spot'}
																color={attributes.color}
																intensity={Number(attributes.intensity)}
																distance={Number(attributes.distance)}
																decay={Number(attributes.decay)}
																angle={Number(attributes.angle)}
																penumbra={Number(attributes.penumbra)}
															/>
														);
													})}

													{Object.values(
														props.npcsToAdd
													).map((npc, index) => {
														if (!isCustomElement(npc)) return null;

														const attributes = {
															url: getAttributeSafe(npc, 'threeObjectUrl'),
															modelPosX: getAttributeSafe(npc, 'positionX'),
															modelPosY: getAttributeSafe(npc, 'positionY'),
															modelPosZ: getAttributeSafe(npc, 'positionZ'),
															modelRotationX: getAttributeSafe(npc, 'rotationX'),
															modelRotationY: getAttributeSafe(npc, 'rotationY'),
															modelRotationZ: getAttributeSafe(npc, 'rotationZ'),
															name: getAttributeSafe(npc, 'name'),
															defaultMessage: getAttributeSafe(npc, 'defaultMessage'),
															personality: getAttributeSafe(npc, 'personality'),
															objectAwareness: getAttributeSafe(npc, 'objectAwareness'),
														};

														return (
															<NPCObject
																key={index}
																url={attributes.url}
																positionX={Number(attributes.modelPosX)}
																positionY={Number(attributes.modelPosY)}
																positionZ={Number(attributes.modelPosZ)}
																// messages={messages}
																rotationX={Number(attributes.modelRotationX)}
																rotationY={Number(attributes.modelRotationY)}
																rotationZ={Number(attributes.modelRotationZ)}
																objectAwareness={attributes.objectAwareness}
																name={attributes.name}
																messages={messages.map(message => message.text)}
																// message={messages}
																threeObjectPluginRoot={props.threeObjectPluginRoot}
																defaultFont={defaultFont}
																defaultMessage={attributes.defaultMessage}
																personality={attributes.personality}
																scaleX={1}
																scaleY={1}
																scaleZ={1}
															/>
														);
													})}
													{Object.values(
														props.modelsToAdd
													).map((model, index) => {
														if (!isCustomElement(model)) return null;

														const attributes = {
															positionX: getAttributeSafe(model, 'positionX'),
															positionY: getAttributeSafe(model, 'positionY'),
															positionZ: getAttributeSafe(model, 'positionZ'),
															scaleX: getAttributeSafe(model, 'scaleX'),
															scaleY: getAttributeSafe(model, 'scaleY'),
															scaleZ: getAttributeSafe(model, 'scaleZ'),
															rotationX: getAttributeSafe(model, 'rotationX'),
															rotationY: getAttributeSafe(model, 'rotationY'),
															rotationZ: getAttributeSafe(model, 'rotationZ'),
															url: getAttributeSafe(model, 'threeObjectUrl'),
															animations: getAttributeSafe(model, 'animations'),
															alt: getAttributeSafe(model, 'alt'),
															collidable: getAttributeSafe(model, 'collidable'),
														};
														console.log("atts", attributes);
														if (!objectsInRoom.includes(attributes.alt)) {
															setObjectsInRoom([...objectsInRoom, attributes.alt]);
														}

														return (
															<ModelObject
																key={index}
																url={attributes.url}
																positionX={Number(attributes.positionX)}
																positionY={Number(attributes.positionY)}
																positionZ={Number(attributes.positionZ)}
																scaleX={Number(attributes.scaleX)}
																scaleY={Number(attributes.scaleY)}
																scaleZ={Number(attributes.scaleZ)}
																rotationX={Number(attributes.rotationX)}
																rotationY={Number(attributes.rotationY)}
																rotationZ={Number(attributes.rotationZ)}
																alt={attributes.alt}
																animations={attributes.animations}
																collidable={attributes.collidable}
																threeObjectPluginRoot={''}
																defaultFont={defaultFont}
															/>
														);
													})}
													{Object.values(props.textToAdd).map((model, index) => {
														if (!isCustomElement(model)) return null;

														const attributes = {
															textContent: getAttributeSafe(model, 'textContent'),
															rotationX: getAttributeSafe(model, 'rotationX'),
															rotationY: getAttributeSafe(model, 'rotationY'),
															rotationZ: getAttributeSafe(model, 'rotationZ'),
															positionX: getAttributeSafe(model, 'positionX'),
															positionY: getAttributeSafe(model, 'positionY'),
															positionZ: getAttributeSafe(model, 'positionZ'),
															scaleX: getAttributeSafe(model, 'scaleX'),
															scaleY: getAttributeSafe(model, 'scaleY'),
															scaleZ: getAttributeSafe(model, 'scaleZ'),
															textColor: getAttributeSafe(model, 'textColor'),
														};

														return (
															<TextObject
																key={index}
																textContent={attributes.textContent}
																positionX={Number(attributes.positionX)}
																positionY={Number(attributes.positionY)}
																positionZ={Number(attributes.positionZ)}
																scaleX={Number(attributes.scaleX)}
																scaleY={Number(attributes.scaleY)}
																scaleZ={Number(attributes.scaleZ)}
																defaultFont={defaultFont}
																threeObjectPlugin={threeObjectPluginRoot}
																textColor={attributes.textColor}
																rotationX={Number(attributes.rotationX)}
																rotationY={Number(attributes.rotationY)}
																rotationZ={Number(attributes.rotationZ)}
															/>
														);
													})}
													{Object.values(
														props.portalsToAdd
													).map((model, index) => {
														if (!isCustomElement(model)) return null;

														const attributes = {
															positionX: getAttributeSafe(model, 'positionX'),
															positionY: getAttributeSafe(model, 'positionY'),
															positionZ: getAttributeSafe(model, 'positionZ'),
															scaleX: getAttributeSafe(model, 'scaleX'),
															scaleY: getAttributeSafe(model, 'scaleY'),
															scaleZ: getAttributeSafe(model, 'scaleZ'),
															rotationX: getAttributeSafe(model, 'rotationX'),
															rotationY: getAttributeSafe(model, 'rotationY'),
															rotationZ: getAttributeSafe(model, 'rotationZ'),
															url: getAttributeSafe(model, 'threeObjectUrl'),
															destinationUrl: getAttributeSafe(model, 'destinationUrl'),
															animations: getAttributeSafe(model, 'animations'),
															label: getAttributeSafe(model, 'label'),
															labelOffsetX: getAttributeSafe(model, 'labelOffsetX'),
															labelOffsetY: getAttributeSafe(model, 'labelOffsetY'),
															labelOffsetZ: getAttributeSafe(model, 'labelOffsetZ'),
															labelTextColor: getAttributeSafe(model, 'labelTextColor'),
														};

														return (
															<Portal
																key={index}
																url={attributes.url}
																destinationUrl={attributes.destinationUrl}
																defaultFont={defaultFont}
																threeObjectPluginRoot={threeObjectPluginRoot}
																positionX={Number(attributes.positionX)}
																positionY={Number(attributes.positionY)}
																positionZ={Number(attributes.positionZ)}
																scaleX={Number(attributes.scaleX)}
																scaleY={Number(attributes.scaleY)}
																scaleZ={Number(attributes.scaleZ)}
																rotationX={Number(attributes.rotationX)}
																rotationY={Number(attributes.rotationY)}
																rotationZ={Number(attributes.rotationZ)}
																animations={attributes.animations}
																label={attributes.label}
																labelOffsetX={Number(attributes.labelOffsetX)}
																labelOffsetY={Number(attributes.labelOffsetY)}
																labelOffsetZ={Number(attributes.labelOffsetZ)}
																labelTextColor={attributes.labelTextColor}
															/>
														);
													})}
												</TeleportTravel>
											</>
										)}
									</Physics>
								</Suspense>
								{/* <OrbitControls
								enableZoom={ true }
							/> */}
							</FrontPluginProvider>
						</XR>
					</Canvas>
					{Object.values(
						props.npcsToAdd
					).map((npc, index) => {
						if (!isCustomElement(npc)) return null;

						const attributes = {
							url: getAttributeSafe(npc, 'threeObjectUrl'),
							modelPosX: getAttributeSafe(npc, 'positionX'),
							modelPosY: getAttributeSafe(npc, 'positionY'),
							modelPosZ: getAttributeSafe(npc, 'positionZ'),
							modelRotationX: getAttributeSafe(npc, 'rotationX'),
							modelRotationY: getAttributeSafe(npc, 'rotationY'),
							modelRotationZ: getAttributeSafe(npc, 'rotationZ'),
							name: getAttributeSafe(npc, 'name'),
							defaultMessage: getAttributeSafe(npc, 'defaultMessage'),
							personality: getAttributeSafe(npc, 'personality'),
							objectAwareness: getAttributeSafe(npc, 'objectAwareness'),
						};

						return (
							<ChatBox
								setMessages={setMessages}
								objectsInRoom={objectsInRoom}
								personality={attributes.personality}
								objectAwareness={attributes.objectAwareness}
								name={attributes.name}
								defaultMessage={attributes.defaultMessage}
								messages={messages}
								showUI={showUI}
								roomId={roomId}
								initializing={initializing}
							/>
						);
					})}
					<>
						{isMobile() && (
							<EcctrlJoystick
								buttonNumber={1}
							/>
						)}
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
						boxSizing: "border-box"
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
											style={{ color: "#000 !important" }}
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
