import React, { useState, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import {
	AudioListener,
	Quaternion,
	VectorKeyframeTrack,
	QuaternionKeyframeTrack,
	AnimationClip,
	AnimationMixer,
	Vector3,
	BufferGeometry,
	MeshBasicMaterial,
	DoubleSide,
	Mesh,
	CircleGeometry,
	BoxGeometry,
	Euler
} from "three";
import { RigidBody, useRapier } from "@react-three/rapier";
import {
	useAnimations
} from "@react-three/drei";
import { GLTFAudioEmitterExtension } from "three-omi";
// import { GLTFGoogleTiltBrushMaterialExtension } from "three-icosa";
import { VRMUtils, VRMLoaderPlugin } from "@pixiv/three-vrm";
import idle from "../../../defaults/avatars/friendly.fbx";
import { getMixamoRig } from "../../../utils/rigMap";
import { ModelProps } from "./ModelObject.d";
/**
 * A map from Mixamo rig name to VRM Humanoid bone name
 */
const mixamoVRMRigMap = getMixamoRig();

/* global THREE, mixamoVRMRigMap */

/**
 * Load Mixamo animation, convert for three-vrm use, and return it.
 *
 * @param {string} url A url of mixamo animation data
 * @param {VRM} vrm A target VRM
 * @returns {Promise<AnimationClip>} The converted AnimationClip
 */
interface LoadMixamoAnimationParams {
	url: string;
	vrm: any;
	positionY: number;
	positionX: number;
	positionZ: number;
	scaleX: number;
	scaleY: number;
	scaleZ: number;
	rotationX: number;
	rotationY: number;
	rotationZ: number;
	rotationW: number;
}

function loadMixamoAnimation({
	url,
	vrm,
	positionY,
	positionX,
	positionZ,
	scaleX,
	scaleY,
	scaleZ,
	rotationX,
	rotationY,
	rotationZ,
	rotationW
}: LoadMixamoAnimationParams): Promise<AnimationClip> {
	console.log("is this a model block?");
	const loader = new FBXLoader();
	return loader.loadAsync(url).then((asset: any) => {
		const clip = AnimationClip.findByName(asset.animations, 'mixamo.com');
		const tracks: (QuaternionKeyframeTrack | VectorKeyframeTrack)[] = [];

		const restRotationInverse = new Quaternion();
		const parentRestWorldRotation = new Quaternion();
		const _quatA = new Quaternion();
		const _vec3 = new Vector3();

		// Adjust with reference to hips height.
		const motionHipsHeight = asset.getObjectByName('mixamorigHips').position.y;
		const vrmHipsY = vrm.humanoid?.getNormalizedBoneNode('hips').getWorldPosition(_vec3).y;
		const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
		const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
		const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

		clip.tracks.forEach((track: any) => {
			// Convert each tracks for VRM use, and push to `tracks`
			const trackSplitted = track.name.split('.');
			const mixamoRigName = trackSplitted[0];
			const vrmBoneName = mixamoVRMRigMap[mixamoRigName as keyof typeof mixamoVRMRigMap];
			const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
			const mixamoRigNode = asset.getObjectByName(mixamoRigName);

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
							track.values.map((v: number, i: number) => (vrm.meta?.metaVersion === '0' && i % 2 === 0 ? - v : v)),
						),
					);

				} else if (track instanceof VectorKeyframeTrack) {
					const value = track.values.map((v: number, i: number) => (vrm.meta?.metaVersion === '0' && i % 3 !== 1 ? - v : v) * hipsPositionScale);
					tracks.push(new VectorKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, value));
				}

			}

		});

		return new AnimationClip('vrmAnimation', clip.duration, tracks);

	});
}

/**
 * Represents a model object in a virtual reality scene.
 *
 * @param {Object} model - The props for the model object.
 *
 * @return {JSX.Element} The model object.
 */
export function ModelObject(model: ModelProps): JSX.Element {
	const idleFile = useState(idle);
	// const [clicked, setClickEvent] = useState(false);
	const [url, set] = useState(model.url);
	useEffect(() => {
		setTimeout(() => set(model.url), 2000);
	}, []);

	// const [listener] = useState(() => new AudioListener());
	const { clock } = useThree();
	// useThree(({ camera }) => {
	// 	camera.add(listener);
	// });

	const validatePosition = (pos: number): number => {
		return isFinite(pos) ? pos : 0;
	};
	// Sanitize position values
	const position = {
		x: validatePosition(model.positionX),
		y: validatePosition(model.positionY),
		z: validatePosition(model.positionZ)
	};

	// Sanitize rotation values 
	const rotation = {
		x: validatePosition(model.rotationX),
		y: validatePosition(model.rotationY),
		z: validatePosition(model.rotationZ)
	};

	// Sanitize scale values
	const scale = {
		x: validatePosition(model.scaleX),
		y: validatePosition(model.scaleY),
		z: validatePosition(model.scaleZ)
	};

	let gltf;

	try {
		gltf = useLoader(GLTFLoader, url, (loader) => {
			// const dracoLoader = new DRACOLoader();
			// dracoLoader.setDecoderPath( model.threeObjectPluginRoot + "/inc/utils/draco/");
			// dracoLoader.setDecoderConfig({type: 'js'});
			// loader.setDRACOLoader(dracoLoader);

			// loader.register(
			// 	(parser) => new GLTFAudioEmitterExtension(parser, listener)
			// );
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
	} catch (error) {
		// console.error("Failed to load GLTF file: ", error);
		// Set gltf to a fallback Three.js object
		const geometry = new BoxGeometry();
		const material = new MeshBasicMaterial({ color: 0x00ff00 });
		gltf = new Mesh(geometry, material);
	}


	// const audioObject = gltf?.scene?.getObjectByProperty('type', 'Audio');

	const { actions } = useAnimations(gltf.animations, gltf.scene);
	// const animationClips = gltf.animations;
	const animationList = model.animations ? model.animations.split(",") : "";

	useEffect(() => {
		if (animationList) {
			animationList.forEach((name) => {
				if (Object.keys(actions).includes(name)) {
					actions[name].play();
				}
			});
		}
	}, []);

	const generator = gltf?.asset?.generator;

	// return tilt brush if tilt brush
	if (String(generator).includes("Tilt Brush")) {
		return (
			<primitive
				position={[position.x, position.y, position.z]}
				rotation={[rotation.x, rotation.y, rotation.z]}
				scale={[scale.x, scale.y, scale.z]}
				object={gltf.scene}
			/>
		);
	}

	if (gltf?.userData?.gltfExtensions?.VRM) {
		const vrm = gltf.userData.vrm;
		VRMUtils.rotateVRM0(vrm);
		// Disable frustum culling
		vrm.scene.traverse((obj: THREE.Object3D) => {
			obj.frustumCulled = false;
		});

		// scene.add(vrm.scene);

		const currentVrm = vrm;
		const currentMixer = new AnimationMixer(currentVrm.scene);
		// Load animation
		//@ts-ignore
		useFrame((state, delta) => {
			if (currentVrm) {
				currentVrm.update(delta);
			}
			if (currentMixer) {
				currentMixer.update(delta as number);
			}
		});

		// retarget the animations from mixamo to the current vrm
		useEffect(() => {
			if (currentVrm) {
				console.log("should not be loading here but we'll see");
				loadMixamoAnimation({
					url: idleFile[0],
					vrm: currentVrm,
					positionX: model.positionX,
					positionY: model.positionY,
					positionZ: model.positionZ,
					scaleX: model.scaleX,
					scaleY: model.scaleY,
					scaleZ: model.scaleZ,
					rotationX: model.rotationX,
					rotationY: model.rotationY,
					rotationZ: model.rotationZ,
					rotationW: 1 // Assuming a default value for rotationW
				}).then((clip) => {
					currentMixer.clipAction(clip).play();
					currentMixer.update(clock.getDelta());
				});
			}
		}, []);
		return (
			<group
				position={[position.x, position.y, position.z]}
				rotation={[rotation.x, rotation.y, rotation.z]}
			>
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
	const [triangle] = useState(() => {
		const points = [];
		points.push(
			new Vector3(0, -3, 0),
			new Vector3(0, 3, 0),
			new Vector3(4, 0, 0)
		);
		const geometry = new BufferGeometry().setFromPoints(points);
		const material = new MeshBasicMaterial({
			color: 0x00000,
			side: DoubleSide
		});
		const triangle = new Mesh(geometry, material);
		return triangle;
	});

	const [circle] = useState(() => {
		const geometryCircle = new CircleGeometry(5, 32);
		const materialCircle = new MeshBasicMaterial({
			color: 0xfffff,
			side: DoubleSide
		});
		const circle = new Mesh(geometryCircle, materialCircle);
		return circle;
	});

	const { rapier } = useRapier();

	if (gltf.scene) {
		if (model.collidable === "1") {
			return (
				<RigidBody
					type="fixed"
					//@ts-ignore
					activeCollisionTypes={rapier.ActiveCollisionTypes.FIXED_FIXED}
					colliders={"trimesh"}
					// lockRotations={true}
					// lockTranslations={true}
					// friction={0.8}

				>
					<primitive
						position={[position.x, position.y, position.z]}
						rotation={[rotation.x, rotation.y, rotation.z]}
						scale={[scale.x, scale.y, scale.z]}
						object={gltf.scene}
					/>
				</RigidBody>
			);
		}
		return (
			<>
				<primitive
					object={gltf.scene}
					// castShadow
					// receiveShadow
					position={[position.x, position.y, position.z]}
					rotation={[rotation.x, rotation.y, rotation.z]}
					scale={[model.scaleX, model.scaleY, model.scaleZ]}
				/>
			</>
		);
	}
}