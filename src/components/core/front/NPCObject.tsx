import React, { useState, useEffect, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import EasyStar from "easystarjs";
import { Mesh, PlaneGeometry, MeshBasicMaterial } from 'three';

import { useNPCPathfinding } from "./NPCPathfinding";


// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import {
	Color,
	AudioListener,
	Quaternion,
	VectorKeyframeTrack,
	QuaternionKeyframeTrack,
	KeyframeTrack,
	AnimationClip,
	AnimationMixer,
	Vector3,
	LoopRepeat,
	DoubleSide,
	Group,
	Object3D
} from "three";
import { useAnimations, Text } from "@react-three/drei";
import { GLTFAudioEmitterExtension } from "three-omi";
// import { GLTFGoogleTiltBrushMaterialExtension } from "three-icosa";
import {
	VRMUtils,
	VRMLoaderPlugin,
	VRMHumanBoneName,
	VRM,
} from "@pixiv/three-vrm";
// import idle from "../../../defaults/avatars/friendly.fbx";
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
function loadMixamoAnimation(url: string, vrm: VRM) {
	let loader;
	if (Array.isArray(url)) {
		url.forEach((item) => {
			if (typeof item === "string" && item.endsWith(".fbx")) {
				loader = new FBXLoader();
			} else {
				loader = new GLTFLoader();
			}
		});
	} else {
		if (url.endsWith(".fbx")) {
			loader = new FBXLoader();
		} else {
			loader = new GLTFLoader();
		}
	}
	return loader.loadAsync(url).then((asset) => {
		const clip = asset.animations[0];

		// if asset is glb extract the scene
		if (url.endsWith(".glb")) {
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
export function NPCObject(model: NPCProps): JSX.Element {
	const easystar = useRef(new EasyStar.js());
	const currentPath = useRef(null);
	const currentPathIndex = useRef(0);
	const targetPosition = useRef(new Vector3());
	const isMoving = useRef(false);
	const currentRotation = useRef(0);
	const isChangingDirection = useRef(false);
	const pathGenerationCooldown = useRef(false);
	const navMeshInitialized = useRef(false);


	// Add these constants
	const turnSpeed = 5; // Adjust this value to change rotation speed (lower = smoother)
	const directionChangeThreshold = 0.5; // Threshold angle in radians for considering a direction change

	const [gridSize] = useState(20);
	const [cellSize] = useState(1);
	const [walkSpeed] = useState(1.1);
	const [animationFiles] = useState({
		idle: "https://builds.sxp.digital/avatars/friendly.fbx",
		walking: "https://builds.sxp.digital/avatars/walking.fbx",
		running: "https://builds.sxp.digital/avatars/Running.fbx",
		jump: "https://builds.sxp.digital/avatars/Jump.fbx",
		falling: "https://builds.sxp.digital/avatars/falling.fbx",
	});

	const animationsRef = useRef({
		idle: null,
		walking: null,
		running: null,
		jump: null,
		falling: null,
	});
	const [activeMessage, setActiveMessage] = useState([]);
	const headPositionY = useRef<number>(0);
	const [url, set] = useState(model.url);
	useEffect(() => {
		setTimeout(() => set(model.url), 2000);
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

	const { scene, clock } = useThree();

	useEffect(() => {
		if (!scene || navMeshCreated.current) return;
	  
		const size = 40;
		const segments = 8;
		const geometry = new PlaneGeometry(size, size, segments, segments);
		
		// Ensure all vertices are at y=0
		const positions = geometry.attributes.position.array;
		for (let i = 1; i < positions.length; i += 3) {
			positions[i] = 0;
		}
		geometry.computeVertexNormals();
		
		const material = new MeshBasicMaterial({ 
			visible: true,
			wireframe: true,
			color: 0xff0000,
			side: DoubleSide
		});
		
		const plane = new Mesh(geometry, material);
		
		// Position navmesh at ground level
		const charPos = new Vector3(model.positionX, 0, model.positionZ);
		plane.position.copy(charPos);
		plane.rotateX(-Math.PI / 2);
		
		console.log("Creating NavMesh:", {
			vertexCount: geometry.attributes.position.count,
			center: charPos.toArray(),
			bounds: {
				xMin: charPos.x - size/2,
				xMax: charPos.x + size/2,
				zMin: charPos.z - size/2,
				zMax: charPos.z + size/2
			}
		});
		
		navMesh.current = plane;
		navMeshCreated.current = true;
		scene.add(plane);
	  
		return () => {
			scene.remove(plane);
			navMesh.current = null;
			navMeshCreated.current = false;
		};
	}, [scene, model.positionX, model.positionZ]);		  

	// create plane and assign as navmesh
	// Inside NPCObject component
	const navMesh = useRef<Mesh | null>(null);
	const navMeshCreated = useRef(false);
	const initialPosition = new Vector3(model.positionX, model.positionY, model.positionZ);
	const { updateMovement, pathfindingState, generateRandomPath } = useNPCPathfinding(
		scene,
		navMesh.current,
		initialPosition,
		walkSpeed,
		turnSpeed
	);


	// vrm helpers
	// const helperRoot = new Group();
	// helperRoot.renderOrder = 10000;
	// scene.add(helperRoot);
	useEffect(() => {
		if (navMesh.current && navMeshInitialized.current) {
			console.log("NavMesh ready, generating initial path");
			generateRandomPath();
		}
	}, [navMesh.current, navMeshInitialized.current]);

	const gltf = useLoader(GLTFLoader, url, (loader) => {
		// const dracoLoader = new DRACOLoader();
		// dracoLoader.setDecoderPath( model.threeObjectPluginRoot + "/inc/utils/draco/");
		// dracoLoader.setDecoderConfig({type: 'js'});
		// loader.setDRACOLoader(dracoLoader);

		// if (openbrushEnabled === true) {
		// 	loader.register(
		// 		(parser) =>
		// 			new GLTFGoogleTiltBrushMaterialExtension(
		// 				parser,
		// 				openbrushDirectory
		// 			)
		// 	);
		// }
		loader.register((parser) => {
			return new VRMLoaderPlugin(parser);
		});
	});

	// const audioObject = gltf.scene.getObjectByProperty('type', 'Audio');

	const { actions } = useAnimations(gltf.animations, gltf.scene);
	// const animationClips = gltf.animations;
	const animationList = model.animations ? model.animations.split(",") : "";

	useEffect(() => {
		// console.log("allmessages", model)

		setActiveMessage([model.messages[model.messages.length - 1]]);
		// console.log("activemessage", activeMessage)
	}, [model.messages]);

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
		VRMUtils.rotateVRM0(vrm);
		// Disable frustum culling
		vrm.scene.traverse((obj: Object3D) => {
			obj.frustumCulled = false;
		});
		vrm.scene.name = "assistant";

		// scene.add(vrm.scene);

		const currentVrm = vrm;
		const currentMixer = new AnimationMixer(currentVrm.scene);

		useEffect(() => {
			// if (currentVrm) {
			// 	setHeadPositionY(currentVrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head).position.y);
			// }
			if (currentVrm) {
				let head = currentVrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head);
				let worldPos = new Vector3();
				head.getWorldPosition(worldPos);
				// setHeadPositionY(worldPos.y);
				headPositionY.current = worldPos.y;
			}
		}, [currentVrm]);

		// First, add a state to track if we're turning
		const isChangingDirection = useRef(false);
		const pathGenerationCooldown = useRef(false);

		let lastUpdateTime = 0;
		useEffect(() => {
			if (currentVrm && currentMixer && animationFiles) {
				const loadAnimations = async () => {
					try {
						console.log("Loading animations...");
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
						console.log("Playing initial animations");
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


		// Update the handleAnimation function signature to accept delta
		const handleAnimation = (isWalking: boolean, delta: number) => {
			if (!animationsRef.current) return;

			const { idle, walking } = animationsRef.current;
			if (!idle || !walking) return;

			const crossFadeDuration = isChangingDirection.current ? 0.4 : 0.2;

			if (isWalking) {
				idle.enabled = true;
				walking.enabled = true;

				if (walking.getEffectiveWeight() < 1) {
					walking.setEffectiveTimeScale(isChangingDirection.current ? 0.7 : 0.95);
					walking.setEffectiveWeight(walking.getEffectiveWeight() + delta * 2);
					idle.setEffectiveWeight(1 - walking.getEffectiveWeight());
				}
			} else {
				idle.enabled = true;
				walking.enabled = true;

				if (idle.getEffectiveWeight() < 1) {
					idle.setEffectiveTimeScale(1);
					idle.setEffectiveWeight(idle.getEffectiveWeight() + delta * 2);
					walking.setEffectiveWeight(1 - idle.getEffectiveWeight());
				}
			}
		};



		// Load animation
		useFrame((state, delta) => {
			const currentTime = state.clock.elapsedTime;
			const timeSinceLastUpdate = currentTime - lastUpdateTime;

			if (currentVrm && currentMixer) {
				if (timeSinceLastUpdate >= 1.0) {  // Log every second
					lastUpdateTime = currentTime;
					console.log("Movement state:", {
						isMoving: pathfindingState.current.isMoving,
						currentPath: pathfindingState.current.currentPath,
						currentTargetIndex: pathfindingState.current.currentTargetIndex,
						position: currentVrm.scene.position,
					});
				}

				// Update text position
				if (timeSinceLastUpdate >= 0.1) {
					lastUpdateTime = currentTime;
					const npcText = scene.getObjectByName("npcText");
					const npcBackground = scene.getObjectByName("npcBackground");
					if (npcText && npcBackground) {
						let head = currentVrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head);
						let worldPos = new Vector3();
						head.getWorldPosition(worldPos);
						npcText.position.y = worldPos.y - 0.4;
						npcBackground.position.y = worldPos.y - 0.4;
					}
				}

				// Update movement and animations
				updateMovement(
					delta,
					currentVrm.scene,
					currentMixer,
					{
						idle: animationsRef.current.idle,
						walking: animationsRef.current.walking
					}
				);

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
		let defaultColor = "0xffffff";
		let black = "0x000000";
		var colorValue = new Color(parseInt(defaultColor.replace("#", "0x"), 16));
		var blackValue = new Color(parseInt(black.replace("#", "0x"), 16));

		return (
			<group
				userData={{ camExcludeCollision: true }}
				position={[model.positionX, model.positionY, model.positionZ]}
				rotation={[model.rotationX, model.rotationY, model.rotationZ]}
			>
				<Text
					position={[0.6, 0.5, 0]}
					fontSize={0.1}
					scale={[0.5, 0.5, 0.5]}
					// rotation-y={-Math.PI / 2}

					maxWidth={1}
					color={colorValue}
					name="npcText"
				>
					{outputJSON && String(outputJSON)}
				</Text>
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

	let outputJSON;
	let testObject;
	if (activeMessage && activeMessage?.length > 0) {
		testObject = activeMessage;
		const outputString = testObject;
		outputJSON = outputString;
		// outputJSON = outputString;

		// Extract the Output parameter
		// console.log("that obj", outputJSON);
	}
	let defaultColor = "0xffffff";
	let blackHex = "0x000000";
	var colorValue = new Color(parseInt(defaultColor.replace("#", "0x"), 16));
	var blackValue = new Color(parseInt(blackHex.replace("#", "0x"), 16));

	const color = new Color(colorValue);
	const black = new Color(blackValue);

	return (
		<>
			<group
				userData={{ camExcludeCollision: true }}
				position={[model.positionX, model.positionY, model.positionZ]}
				rotation={[model.rotationX, model.rotationY, model.rotationZ]}
			>
				<Text
					font={model.defaultFont}
					position={[0.6, 0.9, 0]}
					scale={[0.5, 0.5, 0.5]}
					// rotation-y={-Math.PI / 2}

					maxWidth={1}
					color={color}
				>
					{outputJSON && String(outputJSON)}
					{/* {outputJSON && ("Tone: " + String(outputJSON.tone))} */}
				</Text>
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
		</>
	);
}
