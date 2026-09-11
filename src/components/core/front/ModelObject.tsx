import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import {
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
	InstancedMesh,
	Object3D,
	Material,
	MeshStandardMaterial,
	MeshPhysicalMaterial,
	ShaderMaterial,
	RawShaderMaterial,
	Box3,
	Plane,
	Group,
	Float32BufferAttribute,
} from "three";
import { MeshStandardNodeMaterial, MeshBasicNodeMaterial } from 'three/webgpu';
import { RigidBody, useRapier, CuboidCollider } from "@react-three/rapier";
import {
	useAnimations
} from "@react-three/drei";
// import { GLTFGoogleTiltBrushMaterialExtension } from "three-icosa";
import { VRMUtils } from "@pixiv/three-vrm";
import { createVRMLoaderPlugin } from "../../../utils/vrmLoader";
import idle from "../../../defaults/avatars/friendly.fbx";
import { getMixamoRig } from "../../../utils/rigMap";
import { ModelProps } from "./ModelObject.d";
/**
 * A map from Mixamo rig name to VRM Humanoid bone name
 */
const mixamoVRMRigMap = getMixamoRig();

/* global THREE, mixamoVRMRigMap */

/**
 * Returns true when the current renderer is a WebGL (non-WebGPU) renderer.
 * Used to skip Node-material conversion that crashes under WebGL.
 */
function isWebGLRenderer(gl: any): boolean {
	// WebGPURenderer does NOT have the `programs` map that WebGLRenderer has
	return gl && typeof gl.isWebGLRenderer !== 'undefined' && gl.isWebGLRenderer === true;
}

/**
 * Convert incompatible materials to WebGPU-compatible NodeMaterial.
 * MUST NOT be called when running under a WebGL renderer — the resulting
 * NodeMaterials have no vertexShader/fragmentShader strings and will crash
 * inside acquireProgram with "Cannot read properties of undefined ('replace')".
 */
function convertToWebGPUMaterial(material: Material): Material {
	if (material instanceof ShaderMaterial || material instanceof RawShaderMaterial) {
		const replacement = new MeshStandardNodeMaterial();
		replacement.color.copy((material as any).color || new THREE.Color(0xffffff));
		replacement.transparent = material.transparent;
		replacement.opacity = material.opacity;
		replacement.side = material.side;
		return replacement;
	}
	
	if (material instanceof MeshStandardMaterial) {
		const nodeMat = new MeshStandardNodeMaterial();
		nodeMat.color.copy(material.color);
		nodeMat.map = material.map;
		nodeMat.normalMap = material.normalMap;
		nodeMat.roughness = material.roughness;
		nodeMat.metalness = material.metalness;
		nodeMat.emissive.copy(material.emissive);
		nodeMat.emissiveMap = material.emissiveMap;
		nodeMat.transparent = material.transparent;
		nodeMat.opacity = material.opacity;
		nodeMat.side = material.side;
		return nodeMat;
	}
	
	if (material instanceof MeshBasicMaterial) {
		const nodeMat = new MeshBasicNodeMaterial();
		nodeMat.color.copy(material.color);
		nodeMat.map = material.map;
		nodeMat.transparent = material.transparent;
		nodeMat.opacity = material.opacity;
		nodeMat.side = material.side;
		return nodeMat;
	}
	
	if (material instanceof MeshPhysicalMaterial) {
		const nodeMat = new MeshStandardNodeMaterial();
		nodeMat.color.copy(material.color);
		nodeMat.map = material.map;
		nodeMat.normalMap = material.normalMap;
		nodeMat.roughness = material.roughness;
		nodeMat.metalness = material.metalness;
		nodeMat.emissive.copy(material.emissive);
		nodeMat.emissiveMap = material.emissiveMap;
		nodeMat.transparent = material.transparent;
		nodeMat.opacity = material.opacity;
		nodeMat.side = material.side;
		return nodeMat;
	}
	
	return material;
}

const MAX_GRABBABLE_SIZE = 2.0;

function GrabbableGroup({
	children,
	scene,
	collidable
}: {
	children: React.ReactNode;
	scene: any;
	collidable: boolean;
}) {
	const groupRef = useRef<Group>(null);
	const { camera } = useThree();
	const [isGrabbable, setIsGrabbable] = useState(false);
	const isDragging = useRef(false);
	const dragStartPoint = useRef(new Vector3());
	const dragPlaneNormal = useRef(new Vector3());
	const dragPlane = useRef(new Plane());
	const tempIntersect = useRef(new Vector3());

	useEffect(() => {
		if (collidable || !scene) { setIsGrabbable(false); return; }
		try {
			const bbox = new Box3().setFromObject(scene);
			const size = bbox.getSize(new Vector3());
			const maxDim = Math.max(size.x, size.y, size.z);
			setIsGrabbable(maxDim > 0 && maxDim <= MAX_GRABBABLE_SIZE);
		} catch {
			setIsGrabbable(false);
		}
	}, [scene, collidable]);

	const handlePointerDown = useCallback((e: any) => {
		if (!isGrabbable) return;
		e.stopPropagation();
		isDragging.current = true;
		dragStartPoint.current.copy(e.point);
		camera.getWorldDirection(dragPlaneNormal.current).negate();
		dragPlane.current.setFromNormalAndCoplanarPoint(
			dragPlaneNormal.current,
			dragStartPoint.current
		);
		window.dispatchEvent(new CustomEvent('xrGrabStart'));
	}, [isGrabbable, camera]);

	const handlePointerMove = useCallback((e: any) => {
		if (!isDragging.current || !groupRef.current || !e.ray) return;
		const hit = e.ray.intersectPlane(dragPlane.current, tempIntersect.current);
		if (hit) {
			groupRef.current.position.subVectors(hit, dragStartPoint.current);
		}
	}, []);

	const handlePointerUp = useCallback(() => {
		if (!isDragging.current) return;
		isDragging.current = false;
		window.dispatchEvent(new CustomEvent('xrGrabEnd'));
	}, []);

	if (!isGrabbable) return <>{children}</>;

	return (
		<group
			ref={groupRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			{children}
		</group>
	);
}

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
	vrm
}: LoadMixamoAnimationParams): Promise<AnimationClip> {
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
 * ModelObject component for proximity-based loading (doesn't use useLoader)
 */
function ModelObjectProximity(model: ModelProps): React.JSX.Element {
	const [url, set] = useState(model.url);
	const [gltf, setGltf] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [hasTriggered, setHasTriggered] = useState(false);
	const modelPosition = useRef(new Vector3(
		model.positionX || 0,
		model.positionY || 0,
		model.positionZ || 0
	));
	const mixerRef = useRef<AnimationMixer | null>(null);
	const vrmRef = useRef<any>(null);
	const instancedMeshesRef = useRef<InstancedMesh[]>([]);
	useState(() => {
		const points = [];
		points.push(
			new Vector3(0, -3, 0),
			new Vector3(0, 3, 0),
			new Vector3(4, 0, 0)
		);
		const geometry = new BufferGeometry().setFromPoints(points);
		// Position-only geometry trips "TSL: Vertex attribute 'normal' not
		// found" when the WebGPU pipeline compiles (same pitfall documented
		// in WaypointRail) — give it normals + uvs.
		geometry.computeVertexNormals();
		geometry.setAttribute('uv', new Float32BufferAttribute([0, 0, 0, 1, 1, 0.5], 2));
		const material = new MeshBasicMaterial({
			color: 0x00000,
			side: DoubleSide
		});
		return new Mesh(geometry, material);
	});
	useState(() => {
		const geometryCircle = new CircleGeometry(5, 32);
		const materialCircle = new MeshBasicMaterial({
			color: 0xfffff,
			side: DoubleSide
		});
		return new Mesh(geometryCircle, materialCircle);
	});
	
	const { clock, gl } = useThree();
	const { rapier } = useRapier();
	
	// For proximity load, we only use manual loading - NO useLoader, NO useAnimations until model is loaded
	const activeGltf = gltf;
	
	// Only call useAnimations when model is actually loaded
	const { actions } = useAnimations(
		activeGltf?.animations || [], 
		activeGltf?.scene || null
	);
	
	const animationList = model.animations ? model.animations.split(",") : [];
	
	useEffect(() => {
		setTimeout(() => set(model.url), 2000);
	}, []);
	
	// Only set up animations when model is loaded
	useEffect(() => {
		if (activeGltf?.scene && actions) {
			if (!activeGltf.scene.userData) {
				activeGltf.scene.userData = {};
			}
			activeGltf.scene.userData.animationActions = actions;
			activeGltf.scene.userData.animationMixer = activeGltf.scene.userData.mixer;

			if (animationList && animationList.length > 0) {
				animationList.forEach((name) => {
					const trimmedName = name.trim();
					if (Object.keys(actions).includes(trimmedName)) {
						actions[trimmedName].play();
					}
				});
			}
		}
	}, [actions, animationList, activeGltf?.scene]);
	
	// VRM useEffect - only when model is loaded
	useEffect(() => {
		if (activeGltf?.userData?.gltfExtensions?.VRM && vrmRef.current) {
			const currentVrm = vrmRef.current;
			const currentMixer = mixerRef.current;
			if (currentVrm && currentMixer) {
				loadMixamoAnimation({
					url: idle,
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
					rotationW: 1
				}).then((clip) => {
					currentMixer.clipAction(clip).play();
					currentMixer.update(clock.getDelta());
				});
			}
		}
	}, [activeGltf?.userData?.gltfExtensions?.VRM]);
	
	// Initialize instanced meshes when model loads and is instanced - MUST BE BEFORE ANY EARLY RETURNS
	useEffect(() => {
		if (model.instanced && model.instances && model.instances.length > 0 && activeGltf?.scene) {
			const meshes: InstancedMesh[] = [];
			
			let hasValidGeometry = false;
			activeGltf.scene.traverse((child: any) => {
				if (child instanceof Mesh && child.geometry) {
					hasValidGeometry = true;
				}
			});
			
			if (!hasValidGeometry) {
				instancedMeshesRef.current = [];
				return;
			}
			
			activeGltf.scene.traverse((child: any) => {
				if (child instanceof Mesh && child.geometry) {
					try {
						const convertedMaterial = isWebGLRenderer(gl) ? child.material : convertToWebGPUMaterial(child.material);
						const instancedMesh = new InstancedMesh(
							child.geometry,
							convertedMaterial,
							model.instances!.length
						);
						
						child.geometry.computeBoundingSphere();
						const boundingRadius = child.geometry.boundingSphere?.radius || 1;
						
						instancedMesh.userData.instances = model.instances;
						instancedMesh.userData.boundingRadius = boundingRadius;
						
						model.instances!.forEach((instance: any, index: number) => {
							const tempObject = new Object3D();
							const seed = index * 0.001;
							const scaleFactor = Math.min(
								Math.abs(instance.scaleX || 1),
								Math.abs(instance.scaleY || 1), 
								Math.abs(instance.scaleZ || 1)
							);
							const baseOffset = 0.0001;
							const scaleAwareOffset = baseOffset * (1 / Math.max(scaleFactor, 0.01));
							
							const offsetX = (Math.sin(seed) * scaleAwareOffset);
							const offsetY = (Math.cos(seed * 1.1) * scaleAwareOffset);
							const offsetZ = (Math.sin(seed * 1.3) * scaleAwareOffset);
							
							if (!instance._offsetX) {
								instance._offsetX = offsetX;
								instance._offsetY = offsetY;
								instance._offsetZ = offsetZ;
							}
							
							tempObject.position.set(
								(instance.positionX || 0) + instance._offsetX,
								(instance.positionY || 0) + instance._offsetY,
								(instance.positionZ || 0) + instance._offsetZ
							);
							
							tempObject.rotation.set(
								(instance.rotationX || 0) * Math.PI / 180,
								(instance.rotationY || 0) * Math.PI / 180,
								(instance.rotationZ || 0) * Math.PI / 180
							);
							
							tempObject.scale.set(
								instance.scaleX || 1,
								instance.scaleY || 1,
								instance.scaleZ || 1
							);
							
							tempObject.updateMatrix();
							instancedMesh.setMatrixAt(index, tempObject.matrix);
						});
						
						instancedMesh.instanceMatrix.needsUpdate = true;
						instancedMesh.castShadow = true;
						instancedMesh.receiveShadow = true;
						instancedMesh.count = model.instances!.length;
						
						meshes.push(instancedMesh);
					} catch (error) {
						console.error('ModelObject: Failed to create instanced mesh:', error);
					}
				}
			});
			
			instancedMeshesRef.current = meshes;
		} else {
			instancedMeshesRef.current = [];
		}
	}, [model.instanced, model.instances, activeGltf?.scene]);
	
	// Always call useFrame hook unconditionally - combine VRM and instanced meshes
	useFrame(({ camera }, delta) => {
		// Update VRM
		if (vrmRef.current) {
			vrmRef.current.update(delta);
		}
		if (mixerRef.current) {
			mixerRef.current.update(delta);
		}
		
		// Update instanced meshes frustum culling
		if (instancedMeshesRef.current.length > 0) {
			camera.updateMatrixWorld();
			camera.updateProjectionMatrix();
			
			const isOrbitCamera = camera.userData && camera.userData.orbitControls;
			const frustum = new THREE.Frustum();
			const cameraMatrix = new THREE.Matrix4();
			cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
			frustum.setFromProjectionMatrix(cameraMatrix);
			
			instancedMeshesRef.current.forEach((instancedMesh: InstancedMesh) => {
				const instances = instancedMesh.userData.instances;
				if (!instances) return;
				
				const matrix = new THREE.Matrix4();
				const position = new THREE.Vector3();
				const tempMatrix = new THREE.Matrix4();
				const visibleIndices: number[] = [];
				const hiddenIndices: number[] = [];
				
				instances.forEach((instance: any, index: number) => {
					const rawPosition = new THREE.Vector3(
						(instance.positionX || 0) + (instance._offsetX || 0),
						(instance.positionY || 0) + (instance._offsetY || 0),
						(instance.positionZ || 0) + (instance._offsetZ || 0)
					);
					
					const tempObject = new THREE.Object3D();
					tempObject.position.copy(rawPosition);
					tempObject.rotation.set(
						(instance.rotationX || 0) * THREE.MathUtils.DEG2RAD,
						(instance.rotationY || 0) * THREE.MathUtils.DEG2RAD,
						(instance.rotationZ || 0) * THREE.MathUtils.DEG2RAD
					);
					tempObject.scale.set(
						instance.scaleX || 1,
						instance.scaleY || 1,
						instance.scaleZ || 1
					);
					tempObject.updateMatrix();
					position.setFromMatrixPosition(tempObject.matrix);
					
					const distance = camera.position.distanceTo(position);
					const maxRenderDistance = 200;
					let isVisible = distance < maxRenderDistance;
					
					const wasVisible = instancedMesh.userData.visibleInstances && instancedMesh.userData.visibleInstances.has(index);
					if (wasVisible && distance < maxRenderDistance + 20) {
						isVisible = true;
					}
					
					const cameraDirection = new THREE.Vector3();
					camera.getWorldDirection(cameraDirection);
					const toInstance = new THREE.Vector3().subVectors(position, camera.position).normalize();
					const dotProduct = cameraDirection.dot(toInstance);
					
					const backFaceThreshold = isOrbitCamera ? -0.95 : -0.9;
					if (dotProduct < backFaceThreshold) {
						isVisible = false;
					}
					
					const closeDistance = isOrbitCamera ? 80 : 50;
					if (distance < closeDistance) {
						isVisible = true;
					}
					
					const shadowDistance = isOrbitCamera ? 100 : 60;
					const shadowDotThreshold = isOrbitCamera ? -0.5 : -0.7;
					if (distance < shadowDistance && dotProduct > shadowDotThreshold) {
						isVisible = true;
					}
					
					const forwardDistance = isOrbitCamera ? 120 : 80;
					const forwardDotMin = isOrbitCamera ? -0.5 : -0.7;
					const forwardDotMax = isOrbitCamera ? 0.5 : 0.7;
					if (distance < forwardDistance && dotProduct > forwardDotMin && dotProduct < forwardDotMax) {
						isVisible = true;
					}
					
					if (isVisible) {
						visibleIndices.push(index);
					} else {
						hiddenIndices.push(index);
					}
				});
				
				let visibleCount = 0;
				visibleIndices.forEach((originalIndex) => {
					if (visibleCount !== originalIndex) {
						instancedMesh.getMatrixAt(originalIndex, matrix);
						instancedMesh.getMatrixAt(visibleCount, tempMatrix);
						instancedMesh.setMatrixAt(visibleCount, matrix);
						instancedMesh.setMatrixAt(originalIndex, tempMatrix);
					}
					visibleCount++;
				});
				
				instancedMesh.count = visibleCount;
				instancedMesh.instanceMatrix.needsUpdate = true;
				instancedMesh.userData.visibleInstances = new Set(visibleIndices);
			});
		}
	});
	
	const triggerLocationX = model.triggerLocationX || 0;
	const triggerLocationY = model.triggerLocationY || 0;
	const triggerLocationZ = model.triggerLocationZ || 0;
	const triggerLocationPosX = model.triggerLocationPosX || 0;
	const triggerLocationPosY = model.triggerLocationPosY || 0;
	const triggerLocationPosZ = model.triggerLocationPosZ || 0;
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

	// Sanitize rotation values and convert from degrees to radians
	const rotation = {
		x: validatePosition(model.rotationX) * THREE.MathUtils.DEG2RAD,
		y: validatePosition(model.rotationY) * THREE.MathUtils.DEG2RAD,
		z: validatePosition(model.rotationZ) * THREE.MathUtils.DEG2RAD
	};

	// Sanitize scale values
	const scale = {
		x: validatePosition(model.scaleX),
		y: validatePosition(model.scaleY),
		z: validatePosition(model.scaleZ)
	};

	// Validate URL before attempting to load
	if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
		console.warn('ModelObject: Invalid or empty URL provided:', url);
		return null;
	}

	// Function to load model manually (used only for proximity load)
	// THIS FUNCTION SHOULD ONLY BE CALLED FROM THE TRIGGER HANDLER - NEVER AUTOMATICALLY
	const loadModel = async () => {
		if (isLoading || gltf || !url) {
			return;
		}

		setIsLoading(true);
		const loader = new GLTFLoader();
		
		loader.register((parser) => createVRMLoaderPlugin(parser));
		
		try {
			const loadedGltf = await loader.loadAsync(url);
			loadedGltf.scene.traverse((node: THREE.Object3D) => {
				if ((node as THREE.Mesh).isMesh) {
					const mesh = node as THREE.Mesh;
					node.castShadow = true;
					node.receiveShadow = true;
					if (mesh.material && !isWebGLRenderer(gl)) {
						if (Array.isArray(mesh.material)) {
							mesh.material = mesh.material.map(mat => convertToWebGPUMaterial(mat));
						} else {
							mesh.material = convertToWebGPUMaterial(mesh.material);
						}
					}
				}
			});
			setGltf(loadedGltf);
		} catch (error) {
			console.error('ModelObject: Error loading model:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle collision events for proximity load trigger
	const handleCollisionEnter = async (other: any) => {
		if (other.rigidBodyObject?.name === 'character-capsule-collider' || other?.name === 'character-capsule-collider' || other.colliderObject?.name === 'character-capsule-collider') {
			if (!gltf && !isLoading) {
				await loadModel();
			}
			
			if (!hasTriggered) {
				setHasTriggered(true);
			}
		}
	};


	// Always render the trigger zone - it's a TRIGGER that calls a function
	const triggerZone = (
		<RigidBody
			type="fixed"
			position={[
				modelPosition.current.x + triggerLocationPosX,
				modelPosition.current.y + triggerLocationPosY,
				modelPosition.current.z + triggerLocationPosZ
			]}
			userData={{ isModelTrigger: true }}
		>
			<CuboidCollider 
				args={[triggerLocationX/2, triggerLocationY/2, triggerLocationZ/2]} 
				sensor
				onIntersectionEnter={handleCollisionEnter}
			/>
		</RigidBody>
	);

	// If model not loaded yet, just render the trigger
	if (!activeGltf || !activeGltf.scene) {
		return triggerZone;
	}

	const generator = activeGltf?.asset?.generator;

	// return tilt brush if tilt brush
	if (String(generator).includes("Tilt Brush")) {
		return (
			<>
				<primitive
					position={[position.x, position.y, position.z]}
					rotation={[rotation.x, rotation.y, rotation.z]}
					scale={[scale.x, scale.y, scale.z]}
					object={activeGltf.scene}
				/>
				{triggerZone}
			</>
		);
	}

	if (activeGltf?.userData?.gltfExtensions?.VRM) {
		const vrm = activeGltf.userData.vrm;
		vrmRef.current = vrm;
		VRMUtils.rotateVRM0(vrm);
		// Disable frustum culling
		vrm.scene.traverse((obj: THREE.Object3D) => {
			obj.frustumCulled = false;
		});

		const currentVrm = vrm;
		const currentMixer = new AnimationMixer(currentVrm.scene);
		mixerRef.current = currentMixer;
		
		return (
			<>
				<group
					position={[position.x, position.y, position.z]}
					rotation={[rotation.x, rotation.y, rotation.z]}
				>
					<primitive object={vrm.scene} />
				</group>
				{triggerZone}
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

	// Handle instanced models with frustum culling
	if (model.instanced && model.instances && model.instances.length > 0 && activeGltf?.scene && instancedMeshesRef.current.length > 0) {
		// Render the instanced meshes with collidable support
		if (model.collidable === "1") {
			// For collidable instanced meshes, we need to create individual RigidBodies
			// for each visible instance to maintain proper collision detection
			return (
				<>
					{instancedMeshesRef.current.map((mesh: InstancedMesh, meshIndex: number) => {
						// Get the visible instances for this mesh
						const visibleInstances: Set<number> = mesh.userData.visibleInstances || new Set();
						const instances = mesh.userData.instances || [];
						
						// Create individual RigidBodies for each visible instance
						return Array.from(visibleInstances).map((instanceIndex) => {
							const instance = instances[instanceIndex];
							if (!instance) return null;
							
							// Check if this specific instance is collidable
							// Handle both "1"/"0" and true/false formats
							const isInstanceCollidable = instance.collidable === "1" || instance.collidable === true;
							if (!isInstanceCollidable) return null;
							
							// Calculate the world transform for this specific instance
							const tempObject = new THREE.Object3D();
							
							// Apply pre-calculated anti-z-fighting offset
							tempObject.position.set(
								(instance.positionX || 0) + (instance._offsetX || 0),
								(instance.positionY || 0) + (instance._offsetY || 0),
								(instance.positionZ || 0) + (instance._offsetZ || 0)
							);
							
							tempObject.rotation.set(
								(instance.rotationX || 0) * THREE.MathUtils.DEG2RAD,
								(instance.rotationY || 0) * THREE.MathUtils.DEG2RAD,
								(instance.rotationZ || 0) * THREE.MathUtils.DEG2RAD
							);
							
							tempObject.scale.set(
								instance.scaleX || 1,
								instance.scaleY || 1,
								instance.scaleZ || 1
							);
							
							return (
								<RigidBody
									key={`collidable-instance-${meshIndex}-${instanceIndex}`}
									type="fixed"
									position={[tempObject.position.x, tempObject.position.y, tempObject.position.z]}
									rotation={[tempObject.rotation.x, tempObject.rotation.y, tempObject.rotation.z]}
									scale={[tempObject.scale.x, tempObject.scale.y, tempObject.scale.z]}
									//@ts-ignore
									activeCollisionTypes={rapier.ActiveCollisionTypes.FIXED_FIXED}
									colliders={"trimesh"}
								>
									{/* Use the original mesh geometry for collision - Rapier will handle the instancing */}
									<primitive 
										object={mesh} 
										visible={false} // Hide the collision mesh
									/>
								</RigidBody>
							);
						}).filter(Boolean);
					}).flat()}
					
					{/* Render the visual instanced meshes */}
					{instancedMeshesRef.current.map((mesh, index) => (
						<primitive key={`instanced-visual-${index}`} object={mesh} />
					))}
				</>
			);
		}
		
		// Non-collidable instanced meshes
		return (
			<>
				{instancedMeshesRef.current.map((mesh, index) => (
					<primitive key={`instanced-${index}`} object={mesh} />
				))}
				{triggerZone}
			</>
		);
	}

	// Handle regular single models
	if (activeGltf.scene) {
		if (model.collidable === "1") {
			return (
				<>
					<RigidBody
						type="fixed"
						//@ts-ignore
						activeCollisionTypes={rapier.ActiveCollisionTypes.FIXED_FIXED}
						colliders={"trimesh"}
					>
						<primitive
							position={[position.x, position.y, position.z]}
							rotation={[rotation.x, rotation.y, rotation.z]}
							scale={[scale.x, scale.y, scale.z]}
							object={activeGltf.scene}
						/>
					</RigidBody>
					{triggerZone}
				</>
			);
		}
		return (
			<>
				<GrabbableGroup scene={activeGltf.scene} collidable={false}>
					<primitive
						object={activeGltf.scene}
						position={[position.x, position.y, position.z]}
						rotation={[rotation.x, rotation.y, rotation.z]}
						scale={[model.scaleX, model.scaleY, model.scaleZ]}
					/>
				</GrabbableGroup>
				{triggerZone}
			</>
		);
	}
	
	return null;
}

/**
 * ModelObject component for normal loading (uses useLoader)
 */
function ModelObjectNormal(model: ModelProps): React.JSX.Element {
	const [idleFile] = useState(idle);
	const [url, set] = useState(model.url);
	useEffect(() => {
		setTimeout(() => set(model.url), 2000);
	}, []);

	const { clock, gl: glNormal } = useThree();

	useRef(new Vector3(
		model.positionX || 0,
		model.positionY || 0,
		model.positionZ || 0
	));

	const validatePosition = (pos: number): number => {
		return isFinite(pos) ? pos : 0;
	};
	// Sanitize position values
	const position = {
		x: validatePosition(model.positionX),
		y: validatePosition(model.positionY),
		z: validatePosition(model.positionZ)
	};

	// Sanitize rotation values and convert from degrees to radians
	const rotation = {
		x: validatePosition(model.rotationX) * THREE.MathUtils.DEG2RAD,
		y: validatePosition(model.rotationY) * THREE.MathUtils.DEG2RAD,
		z: validatePosition(model.rotationZ) * THREE.MathUtils.DEG2RAD
	};

	// Sanitize scale values
	const scale = {
		x: validatePosition(model.scaleX),
		y: validatePosition(model.scaleY),
		z: validatePosition(model.scaleZ)
	};

	// Validate URL before attempting to load
	if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
		console.warn('ModelObject: Invalid or empty URL provided:', url);
		return null;
	}

	// useLoader has no error-callback parameter — the handler previously
	// passed as a 5th argument was silently ignored. Load failures throw to
	// the nearest suspense/error boundary instead.
	const gltf = useLoader(GLTFLoader, url, (loader) => {
		loader.register((parser) => createVRMLoaderPlugin(parser));
	});

	// Check if gltf loaded successfully
	if (!gltf || !gltf.scene) {
		console.warn('ModelObjectNormal: No valid GLTF loaded, skipping rendering. URL:', url);
		return null;
	}

	const { actions } = useAnimations(gltf.animations, gltf.scene);
	const animationList = model.animations ? model.animations.split(",") : [];

	useEffect(() => {
		if (gltf?.scene) {
			if (!gltf.scene.userData) {
				gltf.scene.userData = {};
			}
			gltf.scene.userData.animationActions = actions;
			gltf.scene.userData.animationMixer = gltf.scene.userData.mixer;
			
			gltf.scene.traverse((node: THREE.Object3D) => {
				if ((node as THREE.Mesh).isMesh) {
					const mesh = node as THREE.Mesh;
					node.castShadow = true;
					node.receiveShadow = true;
					// Lit node materials read the `normal` attribute; a glTF exported
					// WITHOUT normals (common) makes the TSL build warn "Vertex
					// attribute normal not found" and lights it flat. Generate them.
					if (mesh.geometry && !mesh.geometry.attributes.normal && mesh.geometry.attributes.position) {
						mesh.geometry.computeVertexNormals();
					}
					if (mesh.material && !isWebGLRenderer(glNormal)) {
						if (Array.isArray(mesh.material)) {
							mesh.material = mesh.material.map(mat => convertToWebGPUMaterial(mat));
						} else {
							mesh.material = convertToWebGPUMaterial(mesh.material);
						}
					}
				}
			});
		}

		if (animationList && animationList.length > 0) {
			animationList.forEach((name) => {
				const trimmedName = name.trim();
				if (actions && Object.keys(actions).includes(trimmedName)) {
					actions[trimmedName].play();
				}
			});
		}
	}, [actions, animationList, gltf?.scene]);

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

		const currentVrm = vrm;
		const currentMixer = new AnimationMixer(currentVrm.scene);
		//@ts-ignore
		useFrame((state, delta) => {
			if (currentVrm) {
				currentVrm.update(delta);
			}
			if (currentMixer) {
				currentMixer.update(delta as number);
			}
		});

		useEffect(() => {
			if (currentVrm) {
				loadMixamoAnimation({
					url: idleFile,
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
					rotationW: 1
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

	const { rapier } = useRapier();

	// Handle instanced models
	if (model.instanced && model.instances && model.instances.length > 0 && gltf.scene) {
		const [instancedMeshes] = useState<InstancedMesh[]>(() => {
			const meshes: InstancedMesh[] = [];
			let hasValidGeometry = false;
			gltf.scene.traverse((child) => {
				if (child instanceof Mesh && child.geometry) {
					hasValidGeometry = true;
				}
			});
			if (!hasValidGeometry) {
				return meshes;
			}
			gltf.scene.traverse((child) => {
				if (child instanceof Mesh && child.geometry) {
					try {
						const convertedMaterial = isWebGLRenderer(glNormal) ? child.material : convertToWebGPUMaterial(child.material);
						const instancedMesh = new InstancedMesh(
							child.geometry,
							convertedMaterial,
							model.instances!.length
						);
						child.geometry.computeBoundingSphere();
						const boundingRadius = child.geometry.boundingSphere?.radius || 1;
						instancedMesh.userData.instances = model.instances;
						instancedMesh.userData.boundingRadius = boundingRadius;
						model.instances!.forEach((instance, index) => {
							const tempObject = new Object3D();
							const seed = index * 0.001;
							const scaleFactor = Math.min(
								Math.abs(instance.scaleX || 1),
								Math.abs(instance.scaleY || 1), 
								Math.abs(instance.scaleZ || 1)
							);
							const baseOffset = 0.0001;
							const scaleAwareOffset = baseOffset * (1 / Math.max(scaleFactor, 0.01));
							const offsetX = (Math.sin(seed) * scaleAwareOffset);
							const offsetY = (Math.cos(seed * 1.1) * scaleAwareOffset);
							const offsetZ = (Math.sin(seed * 1.3) * scaleAwareOffset);
							if (!instance._offsetX) {
								instance._offsetX = offsetX;
								instance._offsetY = offsetY;
								instance._offsetZ = offsetZ;
							}
							tempObject.position.set(
								(instance.positionX || 0) + instance._offsetX,
								(instance.positionY || 0) + instance._offsetY,
								(instance.positionZ || 0) + instance._offsetZ
							);
							tempObject.rotation.set(
								(instance.rotationX || 0) * Math.PI / 180,
								(instance.rotationY || 0) * Math.PI / 180,
								(instance.rotationZ || 0) * Math.PI / 180
							);
							tempObject.scale.set(
								instance.scaleX || 1,
								instance.scaleY || 1,
								instance.scaleZ || 1
							);
							tempObject.updateMatrix();
							instancedMesh.setMatrixAt(index, tempObject.matrix);
						});
						instancedMesh.instanceMatrix.needsUpdate = true;
						instancedMesh.castShadow = true;
						instancedMesh.receiveShadow = true;
						instancedMesh.count = model.instances!.length;
						meshes.push(instancedMesh);
					} catch (error) {
						console.error('ModelObjectNormal: Failed to create instanced mesh:', error);
					}
				}
			});
			return meshes;
		});
		
		useFrame(({ camera }) => {
			if (instancedMeshes.length === 0) return;
			camera.updateMatrixWorld();
			const frustum = new THREE.Frustum();
			const cameraMatrix = new THREE.Matrix4();
			cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
			frustum.setFromProjectionMatrix(cameraMatrix);
			instancedMeshes.forEach((instancedMesh) => {
				const instances = instancedMesh.userData.instances;
				const matrix = new THREE.Matrix4();
				const position = new THREE.Vector3();
				const tempMatrix = new THREE.Matrix4();
				const visibleIndices: number[] = [];
				const hiddenIndices: number[] = [];
				instances.forEach((instance: any, index: number) => {
					const rawPosition = new THREE.Vector3(
						(instance.positionX || 0) + (instance._offsetX || 0),
						(instance.positionY || 0) + (instance._offsetY || 0),
						(instance.positionZ || 0) + (instance._offsetZ || 0)
					);
					const tempObject = new THREE.Object3D();
					tempObject.position.copy(rawPosition);
					tempObject.rotation.set(
						(instance.rotationX || 0) * THREE.MathUtils.DEG2RAD,
						(instance.rotationY || 0) * THREE.MathUtils.DEG2RAD,
						(instance.rotationZ || 0) * THREE.MathUtils.DEG2RAD
					);
					tempObject.scale.set(
						instance.scaleX || 1,
						instance.scaleY || 1,
						instance.scaleZ || 1
					);
					tempObject.updateMatrix();
					position.setFromMatrixPosition(tempObject.matrix);
					const distance = camera.position.distanceTo(position);
					const maxRenderDistance = 200;
					let isVisible = distance < maxRenderDistance;
					const wasVisible = instancedMesh.userData.visibleInstances && instancedMesh.userData.visibleInstances.has(index);
					if (wasVisible && distance < maxRenderDistance + 20) {
						isVisible = true;
					}
					const cameraDirection = new THREE.Vector3();
					camera.getWorldDirection(cameraDirection);
					const toInstance = new THREE.Vector3().subVectors(position, camera.position).normalize();
					const dotProduct = cameraDirection.dot(toInstance);
					const isOrbitCamera = camera.userData && camera.userData.orbitControls;
					const backFaceThreshold = isOrbitCamera ? -0.95 : -0.9;
					if (dotProduct < backFaceThreshold) {
						isVisible = false;
					}
					const closeDistance = isOrbitCamera ? 80 : 50;
					if (distance < closeDistance) {
						isVisible = true;
					}
					const shadowDistance = isOrbitCamera ? 100 : 60;
					const shadowDotThreshold = isOrbitCamera ? -0.5 : -0.7;
					if (distance < shadowDistance && dotProduct > shadowDotThreshold) {
						isVisible = true;
					}
					const forwardDistance = isOrbitCamera ? 120 : 80;
					const forwardDotMin = isOrbitCamera ? -0.5 : -0.7;
					const forwardDotMax = isOrbitCamera ? 0.5 : 0.7;
					if (distance < forwardDistance && dotProduct > forwardDotMin && dotProduct < forwardDotMax) {
						isVisible = true;
					}
					if (isVisible) {
						visibleIndices.push(index);
					} else {
						hiddenIndices.push(index);
					}
				});
				let visibleCount = 0;
				visibleIndices.forEach((originalIndex) => {
					if (visibleCount !== originalIndex) {
						instancedMesh.getMatrixAt(originalIndex, matrix);
						instancedMesh.getMatrixAt(visibleCount, tempMatrix);
						instancedMesh.setMatrixAt(visibleCount, matrix);
						instancedMesh.setMatrixAt(originalIndex, tempMatrix);
					}
					visibleCount++;
				});
				instancedMesh.count = visibleCount;
				instancedMesh.instanceMatrix.needsUpdate = true;
				instancedMesh.userData.visibleInstances = new Set(visibleIndices);
			});
		});
		
		if (model.collidable === "1") {
			return (
				<>
					{instancedMeshes.map((mesh, meshIndex) => {
						const visibleInstances: Set<number> = mesh.userData.visibleInstances || new Set();
						const instances = mesh.userData.instances || [];
						return Array.from(visibleInstances).map((instanceIndex) => {
							const instance = instances[instanceIndex];
							if (!instance) return null;
							const isInstanceCollidable = instance.collidable === "1" || instance.collidable === true;
							if (!isInstanceCollidable) return null;
							const tempObject = new THREE.Object3D();
							tempObject.position.set(
								(instance.positionX || 0) + (instance._offsetX || 0),
								(instance.positionY || 0) + (instance._offsetY || 0),
								(instance.positionZ || 0) + (instance._offsetZ || 0)
							);
							tempObject.rotation.set(
								(instance.rotationX || 0) * THREE.MathUtils.DEG2RAD,
								(instance.rotationY || 0) * THREE.MathUtils.DEG2RAD,
								(instance.rotationZ || 0) * THREE.MathUtils.DEG2RAD
							);
							tempObject.scale.set(
								instance.scaleX || 1,
								instance.scaleY || 1,
								instance.scaleZ || 1
							);
							return (
								<RigidBody
									key={`collidable-instance-${meshIndex}-${instanceIndex}`}
									type="fixed"
									position={[tempObject.position.x, tempObject.position.y, tempObject.position.z]}
									rotation={[tempObject.rotation.x, tempObject.rotation.y, tempObject.rotation.z]}
									scale={[tempObject.scale.x, tempObject.scale.y, tempObject.scale.z]}
									//@ts-ignore
									activeCollisionTypes={rapier.ActiveCollisionTypes.FIXED_FIXED}
									colliders={"trimesh"}
								>
									<primitive 
										object={mesh} 
										visible={false}
									/>
								</RigidBody>
							);
						}).filter(Boolean);
					}).flat()}
					{instancedMeshes.map((mesh, index) => (
						<primitive key={`instanced-visual-${index}`} object={mesh} />
					))}
				</>
			);
		}
		
		return (
			<>
				{instancedMeshes.map((mesh, index) => (
					<primitive key={`instanced-${index}`} object={mesh} />
				))}
			</>
		);
	}

	// Handle regular single models
	if (gltf.scene) {
		if (model.collidable === "1") {
			return (
				<RigidBody
					type="fixed"
					//@ts-ignore
					activeCollisionTypes={rapier.ActiveCollisionTypes.FIXED_FIXED}
					colliders={"trimesh"}
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
			<GrabbableGroup scene={gltf.scene} collidable={false}>
				<primitive
					object={gltf.scene}
					position={[position.x, position.y, position.z]}
					rotation={[rotation.x, rotation.y, rotation.z]}
					scale={[model.scaleX, model.scaleY, model.scaleZ]}
				/>
			</GrabbableGroup>
		);
	}
	
	return null;
}

/**
 * Wrapper component that conditionally renders proximity or normal model
 */
export function ModelObject(model: ModelProps): React.JSX.Element {
	const triggerLocationX = model.triggerLocationX || 0;
	const triggerLocationY = model.triggerLocationY || 0;
	const triggerLocationZ = model.triggerLocationZ || 0;
	const isProximityLoad = model.proximityLoad && triggerLocationX > 0 && triggerLocationY > 0 && triggerLocationZ > 0;
	
	if (isProximityLoad) {
		return <ModelObjectProximity {...model} />;
	}
	return <ModelObjectNormal {...model} />;
}