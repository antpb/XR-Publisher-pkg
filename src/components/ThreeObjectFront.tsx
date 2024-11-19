import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader';
import { GLTFGoogleTiltBrushMaterialExtension } from "three-icosa";
import { useAnimations } from '@react-three/drei';
import { Physics, RigidBody } from "@react-three/rapier";
import { Hands } from '@react-three/xr';
import { VRMUtils, VRMLoaderPlugin, VRMHumanBoneName } from "@pixiv/three-vrm";
import type { VRM, VRMHumanoid } from '@pixiv/three-vrm';
import { Object3D, AnimationClip, AnimationMixer, Vector3, Quaternion, QuaternionKeyframeTrack, VectorKeyframeTrack, AudioListener } from 'three';


import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import type {
	SavedObjectProps,
	ThreeObjectFrontProps,
	OrbitControlsRef,
	FloorProps
} from '../types/three-object-types';

// @ts-ignore
import TeleportTravel from './ThreeObjectTeleport';
// @ts-ignore
import idle from "../defaults/avatars/friendly.fbx";

declare const openbrushEnabled: boolean;
declare const openbrushDirectory: string;
declare const threeObjectPluginRoot: string;
declare const GLTFAudioEmitterExtension: any;

/**`
 * A map from Mixamo rig name to VRM Humanoid bone name
 */
const mixamoVRMRigMap: Record<string, string> = {
	mixamorigHips: 'hips',
	mixamorigSpine: 'spine',
	mixamorigSpine1: 'chest',
	mixamorigSpine2: 'upperChest',
	mixamorigNeck: 'neck',
	mixamorigHead: 'head',
	mixamorigLeftShoulder: 'leftShoulder',
	mixamorigLeftArm: 'leftUpperArm',
	mixamorigLeftForeArm: 'leftLowerArm',
	mixamorigLeftHand: 'leftHand',
	mixamorigLeftHandThumb1: 'leftThumbMetacarpal',
	mixamorigLeftHandThumb2: 'leftThumbProximal',
	mixamorigLeftHandThumb3: 'leftThumbDistal',
	mixamorigLeftHandIndex1: 'leftIndexProximal',
	mixamorigLeftHandIndex2: 'leftIndexIntermediate',
	mixamorigLeftHandIndex3: 'leftIndexDistal',
	mixamorigLeftHandMiddle1: 'leftMiddleProximal',
	mixamorigLeftHandMiddle2: 'leftMiddleIntermediate',
	mixamorigLeftHandMiddle3: 'leftMiddleDistal',
	mixamorigLeftHandRing1: 'leftRingProximal',
	mixamorigLeftHandRing2: 'leftRingIntermediate',
	mixamorigLeftHandRing3: 'leftRingDistal',
	mixamorigLeftHandPinky1: 'leftLittleProximal',
	mixamorigLeftHandPinky2: 'leftLittleIntermediate',
	mixamorigLeftHandPinky3: 'leftLittleDistal',
	mixamorigRightShoulder: 'rightShoulder',
	mixamorigRightArm: 'rightUpperArm',
	mixamorigRightForeArm: 'rightLowerArm',
	mixamorigRightHand: 'rightHand',
	mixamorigRightHandPinky1: 'rightLittleProximal',
	mixamorigRightHandPinky2: 'rightLittleIntermediate',
	mixamorigRightHandPinky3: 'rightLittleDistal',
	mixamorigRightHandRing1: 'rightRingProximal',
	mixamorigRightHandRing2: 'rightRingIntermediate',
	mixamorigRightHandRing3: 'rightRingDistal',
	mixamorigRightHandMiddle1: 'rightMiddleProximal',
	mixamorigRightHandMiddle2: 'rightMiddleIntermediate',
	mixamorigRightHandMiddle3: 'rightMiddleDistal',
	mixamorigRightHandIndex1: 'rightIndexProximal',
	mixamorigRightHandIndex2: 'rightIndexIntermediate',
	mixamorigRightHandIndex3: 'rightIndexDistal',
	mixamorigRightHandThumb1: 'rightThumbMetacarpal',
	mixamorigRightHandThumb2: 'rightThumbProximal',
	mixamorigRightHandThumb3: 'rightThumbDistal',
	mixamorigLeftUpLeg: 'leftUpperLeg',
	mixamorigLeftLeg: 'leftLowerLeg',
	mixamorigLeftFoot: 'leftFoot',
	mixamorigLeftToeBase: 'leftToes',
	mixamorigRightUpLeg: 'rightUpperLeg',
	mixamorigRightLeg: 'rightLowerLeg',
	mixamorigRightFoot: 'rightFoot',
	mixamorigRightToeBase: 'rightToes',
};


/**
 * Load Mixamo animation, convert for three-vrm use, and return it.
 *
 * @param {string} url A url of mixamo animation data
 * @param {VRM} vrm A target VRM
 * @returns {Promise<AnimationClip>} The converted AnimationClip
 */
async function loadMixamoAnimation(
	url: string,
	vrm: VRM,
	positionY: number,
	positionX: number,
	positionZ: number,
	scaleX: number,
	scaleY: number,
	scaleZ: number,
	rotationX: number = 0,
	rotationY: number = 0,
	rotationZ: number = 0,
	rotationW: number = 1
): Promise<AnimationClip> {
	const loader = new FBXLoader();
	return loader.loadAsync(url).then((asset) => {
		const clip = AnimationClip.findByName(asset.animations, 'mixamo.com');
		const tracks: Array<QuaternionKeyframeTrack | VectorKeyframeTrack> = [];

		const restRotationInverse = new Quaternion();
		const parentRestWorldRotation = new Quaternion();
		const _quatA = new Quaternion();
		const _vec3 = new Vector3();

		const hipsNode = asset.getObjectByName('mixamorigHips');
		if (!hipsNode) {
			throw new Error('Could not find hips node');
		}

		const motionHipsHeight = hipsNode.position.y;
		const humanoid = vrm.humanoid as VRMHumanoid;
		const vrmHipsNode = humanoid?.getNormalizedBoneNode('hips');

		if (!vrmHipsNode) {
			throw new Error('Could not find VRM hips node');
		}

		const vrmHipsY = vrmHipsNode.getWorldPosition(_vec3).y;
		const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
		const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
		const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

		clip.tracks.forEach((track) => {
			const [mixamoRigName, propertyName] = track.name.split('.');
			const vrmBoneName = mixamoVRMRigMap[mixamoRigName as keyof typeof mixamoVRMRigMap];
			const vrmNodeName = humanoid?.getNormalizedBoneNode(vrmBoneName as VRMHumanBoneName)?.name;

			const mixamoRigNode = asset.getObjectByName(mixamoRigName);

			if (vrmNodeName && mixamoRigNode && mixamoRigNode.parent) {
				mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
				mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

				if (track instanceof QuaternionKeyframeTrack) {
					// Process quaternion track
					const newValues = [...track.values];
					for (let i = 0; i < track.values.length; i += 4) {
						const flatQuaternion = track.values.slice(i, i + 4);
						_quatA.fromArray(flatQuaternion);
						_quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
						_quatA.toArray(newValues, i);
					}

					tracks.push(
						new QuaternionKeyframeTrack(
							`${vrmNodeName}.${propertyName}`,
							track.times,
							newValues.map((v, i) => (vrm.meta?.metaVersion === '0' && i % 2 === 0 ? -v : v))
						)
					);
				} else if (track instanceof VectorKeyframeTrack) {
					tracks.push(
						new VectorKeyframeTrack(
							`${vrmNodeName}.${propertyName}`,
							track.times,
							track.values.map((v, i) =>
								(vrm.meta?.metaVersion === '0' && i % 3 !== 1 ? -v : v) * hipsPositionScale
							)
						)
					);
				}
			}
		});

		return new AnimationClip('vrmAnimation', clip.duration, tracks);
	});
}

function SavedObject({ orbitRef, ...props }: SavedObjectProps) {
	const idleFile = useState(idle);
	const { clock } = useThree();
	const [url, setUrl] = useState(props.url);
	console.log('props.url', props.url);
	console.log("idleFile", idleFile);

	useEffect(() => {
		const timer = setTimeout(() => setUrl(props.url), 2000);
		return () => clearTimeout(timer);
	}, [props.url]);

	// USDZ loader handling
	if (url.split(/[#?]/)[0].split('.').pop()?.trim() === "usdz") {
		const usdz = useLoader(USDZLoader, url);
		return (
			<primitive
				scale={[props.scale, props.scale, props.scale]}
				position={[props.positionX ?? 0, props.positionY, props.positionZ ?? 0]}
				rotation={[0, props.rotationY, 0]}
				object={usdz}
			/>
		);
	}

	const gltf = useLoader(
		GLTFLoader,
		url,
		(loader) => {
			if (openbrushEnabled) {
				loader.register(
					(parser) =>
						new GLTFGoogleTiltBrushMaterialExtension(parser, openbrushDirectory)
				);
			}

			// const ktx2Loader = new KTX2Loader();
			// ktx2Loader.setTranscoderPath(`${threeObjectPluginRoot}/inc/utils/basis/`);
			// ktx2Loader.detectSupport(gl);
			// loader.setKTX2Loader(ktx2Loader);

			// const dracoLoader = new DRACOLoader();
			// dracoLoader.setDecoderPath(`${threeObjectPluginRoot}/inc/utils/draco/`);
			// dracoLoader.setDecoderConfig({ type: 'js' });
			// loader.setDRACOLoader(dracoLoader);

			const listener = new AudioListener();
			loader.register(
				(parser) => new GLTFAudioEmitterExtension(parser, listener)
			);
			loader.register(parser => new VRMLoaderPlugin(parser));
		}
	);

	if (!gltf.scene) return null;

	const { actions } = useAnimations(gltf.animations, gltf.scene);
	const animationList = props.animations?.split(',') ?? [];

	useEffect(() => {
		animationList.forEach((name) => {
			if (actions && name in actions) {
				actions[name]?.play();
			}
		});
	}, [actions, animationList]);

	if (gltf.userData?.gltfExtensions?.VRM) {
		const vrm = gltf.userData.vrm;
		if (!vrm) return null;

		VRMUtils.rotateVRM0(vrm);

		vrm.scene.traverse((obj: Object3D) => {
			obj.frustumCulled = false;
		});

		const currentMixer = new AnimationMixer(vrm.scene);

		useFrame((_, delta) => {
			vrm.update(delta);
			currentMixer.update(delta);
		});

		const loadAnimation = async (animationUrl: string) => {
			try {
				const clip = await loadMixamoAnimation(
					animationUrl,
					vrm,
					0,
					props.positionY,
					props.positionZ ?? 0,
					props.scale,
					props.scale,
					props.scale
				);
				currentMixer.clipAction(clip).play();
				currentMixer.update(clock.getDelta());

				if (vrm.humanoid) {
					const head = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
					if (head && orbitRef?.current) {
						const headPos = new Vector3();
						head.getWorldPosition(headPos);
						const offsetPositionY = headPos.y - props.positionY;
						const newTarget = new Vector3(headPos.x, offsetPositionY, headPos.z);
						orbitRef.current.target = newTarget;
						orbitRef.current.maxPolarAngle = Math.PI / 2;
						orbitRef.current.maxPolarAngle = Math.PI / 2;
					}
				}
			} catch (error) {
				console.error('Error loading animation:', error);
			}
		};

		useEffect(() => {

			if (props.defaultAvatarAnimation) {
				// split the animation string by commas
				let animationsFinal = props.defaultAvatarAnimation.split(',');
				if( animationsFinal[0] !== "" ) {
					loadAnimation(props.defaultAvatarAnimation[0]);
				}
			} else {
				loadAnimation(idleFile[0]);
			}
		}, [props.defaultAvatarAnimation, idleFile]);

		return (
			<group
				position={[props.positionX ?? 0, props.positionY, props.positionZ ?? 0]}
				rotation={[0, props.rotationY, 0]}
			>
				<primitive object={vrm.scene} />
			</group>
		);
	}

	// Regular GLTF model handling
	gltf.scene.position.set(
		props.positionX ?? 0,
		props.positionY,
		props.positionZ ?? 0
	);
	gltf.scene.rotation.set(0, props.rotationY, 0);
	gltf.scene.scale.set(props.scale, props.scale, props.scale);

	return <primitive object={gltf.scene} />;
}



function Floor(props: FloorProps) {
	const { rotation, position, ...meshProps } = props;
	return (
	  <mesh 
		position={position ?? [0, -2, 0]} 
		rotation={rotation ?? [-Math.PI / 2, 0, 0]} 
		{...meshProps}
	  >
		<planeGeometry args={[1000, 1000]} />
		<meshBasicMaterial opacity={0} transparent attach="material" />
	  </mesh>
	);
  }
  
export default function ThreeObjectFront(props: ThreeObjectFrontProps) {
	const orbitRef = useRef<OrbitControlsRef>(null);

	if (props.deviceTarget === 'vr') {
		return (
			<>
				<Canvas
					camera={{ fov: 40, zoom: props.zoom, position: [0, 0, 20] }}
					// shadowMap
					style={{
						backgroundColor: props.backgroundColor,
						margin: '0 Auto',
						height: '500px',
						width: '90%',
					}}
				>
					<Hands />
					<ambientLight intensity={0.9} />
					<directionalLight
						intensity={0.4}
						position={[0, 2, 2]}
						shadow-mapSize-width={2048}
						shadow-mapSize-height={2048}
						castShadow
					/>
					<Suspense fallback={null}>
						<Physics>
							{props.threeUrl && (
								<>
									<TeleportTravel useNormal={false}>
										<RigidBody type="kinematicPosition">
											<SavedObject
												{...props}
												positionY={props.positionY}
												positionX={props?.positionX ? props.positionX : 0}
												positionZ={props?.positionZ ? props.positionZ : 0}
												rotationY={props.rotationY}
												url={props.threeUrl}
												color={props.backgroundColor}
												hasZoom={props.hasZoom}
												scale={props.scale}
												hasTip={props.hasTip}
												animations={props.animations}
												threeObjectPlugin={props.threeObjectPlugin}
												defaultAvatarAnimation={props.defaultAvatarAnimation}
											/>
										</RigidBody>
									</TeleportTravel>
									<RigidBody>
										<Floor rotation={[-Math.PI / 2, 0, 0]} />
									</RigidBody>
								</>
							)}
						</Physics>
					</Suspense>
					<OrbitControls
						ref={orbitRef as any}
						enableZoom={props.hasZoom === '1' ? true : false}
						minDistance={1.3}
						maxDistance={2}
						maxZoom={2.2}
						minZoom={2.2}
						enableDamping={true}
						// maxPolarAngle={Math.PI / 1.2}
						// minPolarAngle={Math.PI / 1.8}
						makeDefault
					/>
				</Canvas>
				{props.hasTip === '1' ? (
					<p className="three-object-block-tip">Click and drag ^</p>
				) : (
					<p></p>
				)}
			</>
		);
	}
	if (props.deviceTarget === 'ar') {
		return (
			<>
				<Canvas
					camera={{ fov: 40, zoom: props.zoom, position: [0, 0, 20] }}
					// shadowMap
					style={{
						backgroundColor: props.backgroundColor,
						margin: '0 Auto',
						height: '500px',
						width: '90%',
					}}
				>
					<ambientLight intensity={0.9} />
					<directionalLight
						intensity={0.4}
						position={[0, 2, 2]}
						shadow-mapSize-width={2048}
						shadow-mapSize-height={2048}
						castShadow
					/>
					<Suspense fallback={null}>
						{props.threeUrl && (
							<SavedObject
								positionY={props.positionY}
								positionX={props?.positionX ? props.positionX : 0}
								positionZ={props?.positionZ ? props.positionZ : 0}
								rotationY={props.rotationY}
								url={props.threeUrl}
								color={props.backgroundColor}
								hasZoom={props.hasZoom}
								scale={props.scale}
								hasTip={props.hasTip}
								threeObjectPlugin={props.threeObjectPlugin}
								animations={props.animations}
								defaultAvatarAnimation={props.defaultAvatarAnimation}
								deviceTarget={props.deviceTarget}
								backgroundColor={props.backgroundColor}
								zoom={props.zoom}
							/>
						)}
					</Suspense>
					<OrbitControls
						ref={orbitRef as any}
						enableZoom={props.hasZoom === '1' ? true : false}
						minDistance={1.3}
						maxDistance={2}
						maxZoom={2.2}
						minZoom={2.2}
						enableDamping={true}
						// maxPolarAngle={Math.PI / 1.2}
						// minPolarAngle={Math.PI / 1.8}
						makeDefault
					/>
				</Canvas>
				{props.hasTip === '1' ? (
					<p className="three-object-block-tip">Click and drag ^</p>
				) : (
					<p></p>
				)}
			</>
		);
	}
	if (props.deviceTarget === '2d') {
		return (
		  <Canvas
			camera={{ fov: 40, position: [0, 0, 30], zoom: props.zoom }}
			resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
			style={{
			  backgroundColor: props.backgroundColor,
			  margin: '0 Auto',
			  height: '500px',
			  width: '90%',
			}}
		  >
			<SavedObject
			  deviceTarget={props.deviceTarget}
			  backgroundColor={props.backgroundColor}
			  zoom={props.zoom}
			  positionY={props.positionY}
			  rotationY={props.rotationY}
			  scale={props.scale}
			  hasZoom={props.hasZoom}
			  hasTip={props.hasTip}
			  url={props.threeUrl}
			  orbitRef={orbitRef}
			  color={props.backgroundColor}
			/>
			<OrbitControls
			  ref={orbitRef as any}
			  enableZoom={props.hasZoom === '1'}
			  minDistance={1.3}
			  maxDistance={2}
			  maxZoom={2.2}
			  minZoom={2.2}
			  enableDamping={true}
			  makeDefault
			/>
		  </Canvas>
		);
	  }
}
