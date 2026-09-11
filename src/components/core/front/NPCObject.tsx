import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

import { useNavcatPathfinding } from "./useNavcatPathfinding";
import NPCInteractionBanner from "../../NPCInteractionBanner";
import useInteractionStore from "../../../stores/interactionStore";
import useNpcMessageStore from "../../../stores/npcMessageStore";


// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import {
	Color,
	Quaternion,
	VectorKeyframeTrack,
	QuaternionKeyframeTrack,
	KeyframeTrack,
	AnimationClip,
	AnimationMixer,
	Vector3,
	LoopRepeat,
	Group,
	Object3D
} from "three";
import { useAnimations } from "@react-three/drei";
import { CanvasTextMesh } from "./CanvasTextMesh";
// import { GLTFGoogleTiltBrushMaterialExtension } from "three-icosa";
import {
	VRMUtils,
	VRMHumanBoneName,
	VRM,
} from "@pixiv/three-vrm";
import { createVRMLoaderPlugin } from "../../../utils/vrmLoader";
// Seeded animation clips — resolve to '/assets/defaults/avatars/*.fbx' URL
// strings at build time (same mechanism as Participants.tsx).
import blankVRM from "../../../defaults/avatars/blank_avatar.vrm";
import idleFbx from "../../../defaults/avatars/friendly.fbx";
import walkingFbx from "../../../defaults/avatars/walking.fbx";
import runningFbx from "../../../defaults/avatars/Running.fbx";
import jumpFbx from "../../../defaults/avatars/Jump.fbx";
import fallingFbx from "../../../defaults/avatars/falling.fbx";
import { getMixamoRig } from "../../../utils/rigMap";
import type { NPCProps } from "./NPCObject.d";
  
/**
 * A map from Mixamo rig name to VRM Humanoid bone name
 */
const mixamoVRMRigMap: { [key: string]: string } = getMixamoRig();

/* global THREE, mixamoVRMRigMap */

/**
 * Load Mixamo animation, convert for three-vrm use, and return it.
 *
 * @param {string} url A url of mixamo animation data
 * @param {VRM} vrm A target VRM
 * @returns {Promise<AnimationClip>} The converted AnimationClip
 */
function loadMixamoAnimation(url: string | string[], vrm: VRM) {
	if (!url) return Promise.reject('Invalid URL');
	let loader;
	if (Array.isArray(url)) {
		url.forEach((item) => {
			if (typeof item === "string" && item.endsWith(".fbx")) {
				loader = new FBXLoader();
			} else {
				loader = new GLTFLoader();
			}
		});
	} else if (typeof url === 'string') {
		if (url.endsWith(".fbx")) {
			loader = new FBXLoader();
		} else {
			loader = new GLTFLoader();
		}
	}
	// Loaders take a single URL string. For the array form, load the entry
	// whose extension chose the loader above (the loop leaves the LAST
	// item's loader in place) — passing the whole array to loadAsync was a
	// latent runtime error, not just a type one.
	const resolvedUrl = Array.isArray(url) ? url[url.length - 1] : url;
	return loader.loadAsync(resolvedUrl).then((asset) => {
		const clip = asset.animations[0];

		// if asset is glb extract the scene
		if (typeof url === 'string' && url.endsWith(".glb")) {
			if ("scene" in asset) {
				asset = asset.scene;
			}
		}

		const tracks: KeyframeTrack[] = [];

		const restRotationInverse = new Quaternion();
		const parentRestWorldRotation = new Quaternion();
		const _quatA = new Quaternion();
		const _vec3 = new Vector3();

		// Adjust with reference to hips height.
		const mixamoHips = (asset as Group).getObjectByName("mixamorigHips");
		const regularHips = (asset as Group).getObjectByName("hips");
		let mainHip;
		if (mixamoHips) {
			mainHip = mixamoHips.position.y;
		} else if (regularHips) {
			mainHip = regularHips.position.y;
		}
		const vrmHipsY = vrm.humanoid
			?.getNormalizedBoneNode("hips")
			.getWorldPosition(_vec3).y;
		const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
		const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
		const hipsPositionScale = vrmHipsHeight / mainHip;

		clip.tracks.forEach((track) => {
			// Convert each tracks for VRM use, and push to `tracks`
			const trackSplitted = track.name.split(".");
			const mixamoRigName = trackSplitted[0];
			const vrmBoneName =
				mixamoVRMRigMap[mixamoRigName as keyof typeof mixamoVRMRigMap];
			const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(
				vrmBoneName as VRMHumanBoneName
			)?.name;
			const mixamoRigNode = (asset as Group).getObjectByName(
				mixamoRigName
			);

			if (vrmNodeName != null) {
				const propertyName = trackSplitted[1];

				// Store rotations of rest-pose.
				mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
				mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

				if (track instanceof QuaternionKeyframeTrack) {
					// Retarget rotation of mixamoRig to NormalizedBone.
					for (let i = 0; i < track.values.length; i += 4) {
						const flatQuaternion = track.values.slice(i, i + 4);

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
							track.values.map((v, i) =>
								vrm.meta?.metaVersion === "0" && i % 2 === 0 ? -v : v
							)
						)
					);
				} else if (track instanceof VectorKeyframeTrack) {
					const value = track.values.map(
						(v, i) =>
							(vrm.meta?.metaVersion === "0" && i % 3 !== 1 ? -v : v) *
							hipsPositionScale
					);
					tracks.push(
						new VectorKeyframeTrack(
							`${vrmNodeName}.${propertyName}`,
							track.times,
							value
						)
					);
				}
			}
		});

		return new AnimationClip("vrmAnimation", clip.duration, tracks);
	});
}

/**
 * Represents a model object in a virtual reality scene.
 *
 * @param {Object} model - The props for the model object.
 *
 * @return {JSX.Element} The model object.
 */
export function NPCObject(model: NPCProps): React.JSX.Element {
	const { scene, camera } = useThree();
	const groupRef = useRef<Group>(null);
	const npcId = (model as any).id || 'npc-1';
	// scalex/y/z were parsed off the block but never applied — the block
	// parser used to hardcode 1 and this group never read the props at all.
	// A missing/0 scale must fall back to 1 (an absent attribute parses as
	// NaN upstream, and a 0 scale would collapse the avatar to nothing).
	const npcScale = useMemo<[number, number, number]>(() => {
		const axis = (v: number | undefined) =>
			(typeof v === 'number' && Number.isFinite(v) && v !== 0) ? v : 1;
		return [axis(model.scaleX), axis(model.scaleY), axis(model.scaleZ)];
	}, [model.scaleX, model.scaleY, model.scaleZ]);
	// Narrow boolean selector — this NPC re-renders only when ITS interaction
	// state flips. The old whole-store destructure re-rendered every NPC on
	// every store write, and an NPC render used to be expensive (see the
	// mixer/VRM-setup memos below).
	const isCurrentlyInteracting = useInteractionStore(
		(s: any) => s.isInteracting && s.interactingWith?.id === npcId
	);
	// Pathfinding state is now managed by useNavcatPathfinding hook


	// Pathfinding constants
	const turnSpeed = 5; // Adjust this value to change rotation speed (lower = smoother)
	
	// Body turn toward player when head yaw exceeds threshold
	const BODY_TURN_THRESHOLD_RAD = Math.PI * 0.35; // ~63deg
	const BODY_TURN_SMOOTH = 6.0; // larger = snappier

	const [walkSpeed] = useState(1.1);
	const [animationFiles] = useState({
		idle: idleFbx,
		walking: walkingFbx,
		running: runningFbx,
		jump: jumpFbx,
		falling: fallingFbx,
	});

	const animationsRef = useRef({
		idle: null,
		walking: null,
		running: null,
		jump: null,
		falling: null,
	});
	// Last chat line, straight from the message store. Previously the full
	// transcript was threaded through EnvironmentFront state as a prop —
	// every chat message re-rendered the whole world tree to update one label.
	const activeMessage = useNpcMessageStore((s) =>
		s.messages.length > 0 ? s.messages[s.messages.length - 1].text : ''
	);
	const headPositionY = useRef<number>(0);
	// An empty avatar URL must NEVER reach useLoader: GLTFLoader('') fetches
	// the page's own URL, gets HTML back, and throws "Unexpected token '<'"
	// through suspense — blacking out the whole canvas (hit when the in-world
	// editor added an npc block before a model was picked). Fall back to the
	// seeded blank avatar instead.
	const resolveUrl = (u: string | undefined | null) =>
		(typeof u === 'string' && u.trim() !== '') ? u : blankVRM;
	const [url, set] = useState(() => resolveUrl(model.url));
	useEffect(() => {
		setTimeout(() => set(resolveUrl(model.url)), 2000);
	}, []);

	// useEffect(() => {
	// 	if (activeMessage?.tone){
	// 		if ( activeMessage.tone === "neutral" || activeMessage.tone === "idle" ){
	// 			currentVrm.expressionManager.setValue( VRMExpressionPresetName.Happy, 0 );
	// 			currentVrm.update(clock.getDelta());
	// 		}
	// 		else if ( activeMessage.tone === "confused" ){
	// 			currentVrm.expressionManager.setValue( VRMExpressionPresetName.Surprised, 1 );
	// 			currentVrm.update(clock.getDelta());

	// 		} else if ( activeMessage.tone === "friendly" ){
	// 			currentVrm.expressionManager.setValue( VRMExpressionPresetName.Happy, 1 );
	// 			currentVrm.update(clock.getDelta());
	// 		} else if ( activeMessage.tone === "angry" ){
	// 			currentVrm.expressionManager.setValue( VRMExpressionPresetName.Angry, 1 );
	// 			currentVrm.update(clock.getDelta());

	// 		}
	// 	}
	// 	// create variable that converts activeMessage to json
	// }, [activeMessage]);

		// Start at origin - will be repositioned by spawn event
		const initialPosition = new Vector3(0, 0, 0);
	const gltf = useLoader(GLTFLoader, url, (loader) => {
		loader.register((parser) => createVRMLoaderPlugin(parser));
	});
	const { updateMovement, pathfindingState, isInitialized, setInteractionState } = useNavcatPathfinding(
		scene,
		initialPosition,
		groupRef,
		{
			walkSpeed,
			turnSpeed,
			// 0.4/0.25 (was 0.15/0.15) — heightfield column count scales
			// inversely with cellSize², and an ambient wandering NPC doesn't
			// need fine precision. Together with the 140u navmesh radius this
			// keeps each worker rebuild to ~half a million columns instead of
			// multiple millions (memory spikes + fan noise while roaming).
			cellSize: 0.4,
			cellHeight: 0.25,
			walkableSlopeAngle: 45,
			walkableHeight: 1.0,
			walkableRadius: 0.2,
			walkableClimb: 0.5,
			maxSimplificationError: 1.3,
			maxEdgeLength: 12,
			maxVerticesPerPoly: 5
		}
	);

	// Handle interaction state changes
	useEffect(() => {
		if (isCurrentlyInteracting) {
			// Stop pathfinding when interacting
			pathfindingState.isMoving = false;
			pathfindingState.currentPath = [];
			setInteractionState(true);
		} else {
			// Resume pathfinding when not interacting
			setInteractionState(false);
			// Reset rotation to face forward when resuming pathfinding
			if (groupRef.current) {
				groupRef.current.rotation.y = 0; // Reset to forward-facing
			}
			// Also reset the pathfinding hook's rotation state
			pathfindingState.currentRotation = 0;
		}
	}, [isCurrentlyInteracting]);

	// Handle interaction start
	const handleInteractionStart = () => {

		// Stop pathfinding and make NPC face the player
		pathfindingState.isMoving = false;
		pathfindingState.currentPath = [];
		setInteractionState(true);
		
		// Make NPC face the player
		if (groupRef.current && camera) {
			const npcPosition = groupRef.current.position;
			const playerPosition = camera.position;
			
			// Calculate direction from NPC to player
			const direction = new Vector3()
				.subVectors(playerPosition, npcPosition)
				.normalize();
			
			// Calculate rotation to face player (only Y rotation)
			const yRotation = Math.atan2(direction.x, direction.z);
			
			// Apply rotation to make NPC face player
			groupRef.current.rotation.y = yRotation;
		}
	};


	// vrm helpers
	// const helperRoot = new Group();
	// helperRoot.renderOrder = 10000;
	// scene.add(helperRoot);
	// Navmesh initialization is now handled by useNavcatPathfinding hook

	// const audioObject = gltf.scene.getObjectByProperty('type', 'Audio');

	const { actions } = useAnimations(gltf.animations, gltf.scene);
	// const animationClips = gltf.animations;
	const animationList = model.animations ? model.animations.split(",") : "";

	useEffect(() => {
		if (animationList) {
			animationList.forEach((name: string) => {
				if (Object.keys(actions).includes(name)) {
					actions[name].play();
				}
			});
		}
	}, []);

	// const generator = gltf.asset.generator;

	if (gltf?.userData?.gltfExtensions?.VRM) {
		const vrm = gltf.userData.vrm;
		// One-time VRM setup + mixer creation, memoized on the loaded VRM.
		// These ran on EVERY render before — and a fresh AnimationMixer per
		// render re-triggered the animation-loading effect below (re-fetch +
		// retarget of the Mixamo FBX clips, VRM hidden while loading). That
		// was the visible glitch whenever interaction/chat state changed.
		const currentVrm = useMemo(() => {
			VRMUtils.rotateVRM0(vrm);
			// Disable frustum culling
			vrm.scene.traverse((obj: Object3D) => {
				obj.frustumCulled = false;
			});
			vrm.scene.name = "assistant";
			return vrm;
		}, [vrm]);
		const currentMixer = useMemo(
			() => new AnimationMixer(currentVrm.scene),
			[currentVrm]
		);

		// Head look-at target (player object preferred, fallback to camera)
		const playerTargetRef = useRef<Object3D | null>(null);
		
		useEffect(() => {
			const playerObj = scene.getObjectByName('playerOne');
			playerTargetRef.current = (playerObj as Object3D) || camera;
			
			// Only enable look-at when interacting
			if (isCurrentlyInteracting) {
				currentVrm.lookAt.target = playerTargetRef.current as any;
				currentVrm.lookAt.autoUpdate = true;
			} else {
				currentVrm.lookAt.autoUpdate = false;
				currentVrm.lookAt.target = null;
			}
		}, [scene, camera, currentVrm, isCurrentlyInteracting]);

		// Reposition NPC to a random navmesh point when available
		useEffect(() => {
			const onNpcSpawnSuggested = (e: any) => {
				try {
					const { x, y, z } = e.detail || {};
					if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
						// Update React group position to navmesh coordinates
						if (groupRef.current) {
							groupRef.current.position.set(x, y, z);
							
							// Update pathfinding state with the new position
							// Dispatch a custom event to update the pathfinding state
							window.dispatchEvent(new CustomEvent('npcPositionUpdated', { 
								detail: { x, y, z } 
							}));
						}
					}
				} catch (e) {
					console.error('Error in NPC spawn handler:', e);
				}
			};
			window.addEventListener('npcSpawnSuggested', onNpcSpawnSuggested);
			return () => {
				window.removeEventListener('npcSpawnSuggested', onNpcSpawnSuggested);
			};
		}, [currentVrm]);

		useEffect(() => {
			// if (currentVrm) {
			// 	setHeadPositionY(currentVrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head).position.y);
			// }
			if (currentVrm) {
				const head = currentVrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head);
				const worldPos = new Vector3();
				head.getWorldPosition(worldPos);
				// setHeadPositionY(worldPos.y);
				headPositionY.current = worldPos.y;
			}
		}, [currentVrm]);

		// Pathfinding state is now managed by useNavcatPathfinding hook

		let lastUpdateTime = 0;
		useEffect(() => {
			if (currentVrm && currentMixer && animationFiles) {
				const loadAnimations = async () => {
					try {
						currentVrm.scene.visible = false;

						// Load idle animation
						const idleClip = await loadMixamoAnimation(animationFiles.idle, currentVrm);
						const idleAction = currentMixer.clipAction(idleClip);
						animationsRef.current.idle = idleAction;

						// Load walking animation
						const walkingClip = await loadMixamoAnimation(animationFiles.walking, currentVrm);
						const walkingAction = currentMixer.clipAction(walkingClip);
						animationsRef.current.walking = walkingAction;

						// Configure animations
						idleAction.setLoop(LoopRepeat, Infinity);
						idleAction.clampWhenFinished = false;
						idleAction.timeScale = 1;

						walkingAction.setLoop(LoopRepeat, Infinity);
						walkingAction.clampWhenFinished = false;
						walkingAction.timeScale = 0.93; // Changed from 1.3 to 1

						// Initialize weights
						idleAction.setEffectiveWeight(1);
						walkingAction.setEffectiveWeight(0);

						// Start both animations
						idleAction.play();
						walkingAction.play();

						currentVrm.scene.visible = true;
					} catch (error) {
						console.error("Error loading animations:", error);
					}
				};

				loadAnimations();
			}
		}, [currentVrm, currentMixer, animationFiles]);


		// Animation handling is now managed by useNavcatPathfinding hook



		// Load animation
		useFrame((state, delta) => {
			const currentTime = state.clock.elapsedTime;
			const timeSinceLastUpdate = currentTime - lastUpdateTime;

			if (currentVrm && currentMixer) {
				if (timeSinceLastUpdate >= 1.0) {  // Log every second
					lastUpdateTime = currentTime;
				}

				// Update text position
				if (timeSinceLastUpdate >= 0.1) {
					lastUpdateTime = currentTime;
					// Search the NPC's own subtree, NOT the scene — both objects
					// are children of this group, and scene.getObjectByName is a
					// full traversal of thousands of objects with streamed terrain.
					const npcText = groupRef.current?.getObjectByName("npcText");
					const npcBackground = groupRef.current?.getObjectByName("npcBackground");
					if (npcText && npcBackground) {
						const head = currentVrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head);
						const worldPos = new Vector3();
						head.getWorldPosition(worldPos);
						npcText.position.y = worldPos.y - 0.4;
						npcBackground.position.y = worldPos.y - 0.4;
					}
				}

				// Head look-at via VRM.lookAt is handled by setting target; add whole-body yaw when needed
				// Only do body rotation when interacting
				if (isCurrentlyInteracting && groupRef.current && playerTargetRef.current) {
					const npcPos = groupRef.current.getWorldPosition(new Vector3());
					const targetPos = playerTargetRef.current.getWorldPosition(new Vector3());
					const toPlayer = new Vector3().subVectors(targetPos, npcPos);
					toPlayer.y = 0; // yaw only
					if (toPlayer.lengthSq() > 1e-4) {
						const desiredYaw = Math.atan2(toPlayer.x, toPlayer.z);
						const currentYaw = groupRef.current.rotation.y;
						let deltaYaw = desiredYaw - currentYaw;
						// wrap to [-pi, pi]
						deltaYaw = Math.atan2(Math.sin(deltaYaw), Math.cos(deltaYaw));
						if (Math.abs(deltaYaw) > BODY_TURN_THRESHOLD_RAD) {
							groupRef.current.rotation.y = currentYaw + deltaYaw * Math.min(1, BODY_TURN_SMOOTH * delta);
						}
					}
				}

				// Update movement and animations
				if (isInitialized) {
					updateMovement(
						delta,
						currentVrm.scene,
						{
							idle: animationsRef.current.idle,
							walking: animationsRef.current.walking
						}
					);
				}

				// Update VRM and mixer
				currentVrm.update(delta);
				currentMixer.update(delta);
			}
		});

		let testObject;
		let outputJSON;
		if (activeMessage && activeMessage?.length > 0) {
			testObject = activeMessage;
			const outputString = testObject;
			outputJSON = outputString;
			// outputJSON = outputString;

			// Extract the Output parameter
			// console.log("that obj", outputJSON);
		}
		const defaultColor = "0xffffff";
		const black = "0x000000";
		const blackValue = new Color(parseInt(black.replace("#", "0x"), 16));

		return (
			<>
				<group
					ref={groupRef}
					name={`NPC-${(model as any).id || 'npc-1'}`}
					userData={{ 
						camExcludeCollision: true,
						npcId: (model as any).id || 'npc-1',
						npcName: (model as any).name || 'NPC'
					}}
					rotation={[model.rotationX, model.rotationY, model.rotationZ]}
					scale={npcScale}
				>
					{/*
					  * NPC dialogue label — renderer-agnostic CanvasTextMesh so it
					  * renders on WebGL (mobile) as well as WebGPU. ~0.05 world
					  * units tall, 0.5 wrap width (matches the prior footprint).
					  */}
					<CanvasTextMesh
						text={outputJSON ? String(outputJSON) : ''}
						position={[0.6, 0.5, 0]}
						worldWidth={0.5}
						worldFontSize={0.05}
						color={defaultColor}
						anchorX="center"
						anchorY="middle"
						align="left"
					/>
					<mesh name="npcBackground" position={[0.6, 0.5, -0.01]}>
						<planeGeometry attach="geometry" args={[0.65, 1.5]} />
						<meshBasicMaterial
							attach="material"
							color={blackValue}
							opacity={0.5}
							transparent={true}
						/>
					</mesh>
				<primitive object={vrm.scene} />
			</group>
			
			{/* NPC Interaction Banner - outside group so it can rotate independently */}
			<NPCInteractionBanner
				npcId={(model as any).id || 'npc-1'}
				npcName={(model as any).name || 'NPC'}
				npcGroupRef={groupRef}
				visible={!isCurrentlyInteracting}
				onInteractionStart={handleInteractionStart}
			/>
			</>
		);
	}

	// gltf.scene.castShadow = true;
	// enable shadows @todo figure this out
	// gltf.scene.traverse(function (node) {
	// 	if (node.isMesh) {
	// 		node.castShadow = true;
	// 		node.receiveShadow = true;
	// 	}
	// });

	// @todo figure out how to clone gltf proper with extensions and animations
	// const copyGltf = useMemo(() => gltf.scene.clone(), [gltf.scene]);
	// const modelClone = SkeletonUtils.clone(gltf.scene);
	// modelClone.scene.castShadow = true;

	//audioObject
	// Add a triangle mesh on top of the video
	// const [triangle] = useState(() => {
	// 	const points = [];
	// 	points.push(
	// 		new Vector3(0, -3, 0),
	// 		new Vector3(0, 3, 0),
	// 		new Vector3(4, 0, 0)
	// 	);
	// 	const geometry = new BufferGeometry().setFromPoints(points);
	// 	const material = new MeshBasicMaterial({
	// 		color: 0x00000,
	// 		side: DoubleSide
	// 	});
	// 	const triangle = new Mesh(geometry, material);
	// 	return triangle;
	// });

	// const [circle] = useState(() => {
	// 	const geometryCircle = new CircleGeometry(5, 32);
	// 	const materialCircle = new MeshBasicMaterial({
	// 		color: 0xfffff,
	// 		side: DoubleSide
	// 	});
	// 	const circle = new Mesh(geometryCircle, materialCircle);
	// 	return circle;
	// });

	const blackHex = "0x000000";
	const blackValue = new Color(parseInt(blackHex.replace("#", "0x"), 16));

	const black = new Color(blackValue);

	return (
		<>
			<group
				ref={groupRef}
				name={`NPC-${(model as any).id || 'npc-1'}`}
				userData={{ 
					camExcludeCollision: true,
					npcId: (model as any).id || 'npc-1',
					npcName: (model as any).name || 'NPC'
				}}
				rotation={[model.rotationX, model.rotationY, model.rotationZ]}
				scale={npcScale}
			>
				{/* Temporarily disabled Text component to avoid worker issues */}
				{/* <Text
					font={model.defaultFont}
					position={[0.6, 0.9, 0]}
					scale={[0.5, 0.5, 0.5]}
					// rotation-y={-Math.PI / 2}

					maxWidth={1}
					color={color}
				>
					{outputJSON && String(outputJSON)}
					{/* {outputJSON && ("Tone: " + String(outputJSON.tone))} */}
				{/* </Text> */}
				<mesh position={[0.6, 0.9, -0.01]}>
					<planeGeometry attach="geometry" args={[0.65, 1.5]} />
					<meshBasicMaterial
						attach="material"
						color={black}
						opacity={0.5}
						transparent={true}
					/>
				</mesh>
			<primitive object={gltf.scene} />
		</group>
		
		{/* NPC Interaction Banner - outside group so it can rotate independently */}
		<NPCInteractionBanner
			npcId={(model as any).id || 'npc-1'}
			npcName={(model as any).name || 'NPC'}
			npcGroupRef={groupRef}
			visible={!isCurrentlyInteracting}
			onInteractionStart={handleInteractionStart}
		/>
		</>
	);
}

