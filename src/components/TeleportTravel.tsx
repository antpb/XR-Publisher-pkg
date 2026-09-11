import React from "react";
import { Vector3, DoubleSide, Raycaster, Object3D, Mesh, RingGeometry, Quaternion } from "three";
import { useXR } from "@react-three/xr";
import { useThree, useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState, useEffect } from "react";
import { getNetworkBridge } from "../networking/NetworkBridge";

const MAX_TELEPORT_DISTANCE = 60;
const MENU_HOLD_DURATION = 2.0;
const MENU_HINT_THRESHOLD = 0.5;

interface TeleportTravelProps {
	spawnPoint: [number, number, number];
	avatarHeightOffset: React.MutableRefObject<number>;
	userData: {
		profileImage: string;
		vrm: string;
		inWorldName: string;
	};
	waterLevel?: number;
	children?: React.ReactNode;
}

function isExcludedFromTeleport(obj: Object3D): boolean {
	const name = obj.name.toLowerCase();
	if (
		name.includes('particle') ||
		name.includes('effect') ||
		name.includes('smoke') ||
		name.includes('spark') ||
		name.includes('ui') ||
		name.includes('cursor') ||
		name.includes('avatar') ||
		name.includes('player') ||
		name.includes('playerone') ||
		name.includes('hand') ||
		name.includes('water') ||
		name.includes('ocean') ||
		name.includes('sky') ||
		name.includes('cloud') ||
		name.includes('teleport-indicator') ||
		name.includes('hold-ring') ||
		name.includes('landing') ||
		name.includes('tree') ||
		name.includes('boulder') ||
		name.includes('mountain') ||
		name.includes('grass') ||
		name.includes('wind') ||
		name.includes('npc') ||
		name.includes('light') ||
		name.includes('camera')
	) {
		return true;
	}
	if (obj.userData?.teleportable === false || obj.userData?.isParticle || obj.userData?.isEffect) {
		return true;
	}
	if (obj.userData?.camExcludeCollision) {
		return true;
	}
	
	let parent = obj.parent;
	while (parent) {
		if (parent.userData?.camExcludeCollision) {
			return true;
		}
		if (parent.name && parent.name.toLowerCase().includes('playerone')) {
			return true;
		}
		parent = parent.parent;
	}
	
	return false;
}

export default function TeleportTravel(props: TeleportTravelProps) {
	const { scene, gl } = useThree();
	const { userData } = props;

	const [spawnPos] = useState(props.spawnPoint);
	const { session, origin } = useXR();
	const isPresenting = session !== undefined;
	const hasInitializedSpawnRef = useRef(false);
	const movementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const raycasterRef = useRef(new Raycaster());
	const rayOriginRef = useRef(new Vector3());
	const rayDirRef = useRef(new Vector3());

	const terrainChunksRef = useRef<Mesh[]>([]);
	const terrainCacheCounterRef = useRef(0);

	const hoverPointRef = useRef(new Vector3());
	const isHoveringRef = useRef(false);

	const landingDotRef = useRef<any>(null);
	const holdRingGroupRef = useRef<any>(null);
	const holdRingMeshRef = useRef<any>(null);

	const selectStartTimeRef = useRef(0);
	const isSelectingRef = useRef(false);
	const holdProgressRef = useRef(0);
	const menuOpenedRef = useRef(false);

	const tempCamVec = useRef(new Vector3());
	const isInWaterRef = useRef(false);
	const isWaterTargetRef = useRef(false);
	const isGrabbingRef = useRef(false);

	const tmpQuatA = useRef(new Quaternion());
	const handRayFoundRef = useRef(false);
	const menuFwdRef = useRef(new Vector3());

	useEffect(() => {
		const onGrabStart = () => { isGrabbingRef.current = true; };
		const onGrabEnd = () => { isGrabbingRef.current = false; };
		window.addEventListener('xrGrabStart', onGrabStart);
		window.addEventListener('xrGrabEnd', onGrabEnd);
		return () => {
			window.removeEventListener('xrGrabStart', onGrabStart);
			window.removeEventListener('xrGrabEnd', onGrabEnd);
		};
	}, []);

	useEffect(() => {
		if (!isPresenting || !origin || hasInitializedSpawnRef.current) return;
		hasInitializedSpawnRef.current = true;
		
		const x = spawnPos?.[0] ?? 0;
		const y = (spawnPos?.[1] ?? 0) + 0.1;
		const z = spawnPos?.[2] ?? 0;

		const participantObject = scene.getObjectByName("playerOne");
		if (participantObject?.parent?.parent?.position) {
			origin.position.x = participantObject.parent.parent.position.x;
			origin.position.y = participantObject.parent.parent.position.y;
			origin.position.z = participantObject.parent.parent.position.z;
		} else {
			origin.position.set(x, y, z);
		}
	}, [isPresenting, origin, scene, spawnPos]);

	useEffect(() => {
		raycasterRef.current.far = MAX_TELEPORT_DISTANCE;
		raycasterRef.current.near = 0.1;
	}, []);

	const collectTerrainChunks = useCallback(() => {
		const chunks: Mesh[] = [];
		scene.traverse((obj: Object3D) => {
			if ((obj as Mesh).isMesh && obj.name.startsWith('terrain-chunk-')) {
				chunks.push(obj as Mesh);
			}
		});
		terrainChunksRef.current = chunks;
	}, [scene]);

	const findTerrainHit = useCallback((rayOrig: Vector3, rayDir: Vector3): Vector3 | null => {
		const chunks = terrainChunksRef.current;
		if (chunks.length === 0) return null;

		const savedRaycasts = chunks.map(c => c.raycast);
		chunks.forEach(c => { c.raycast = Mesh.prototype.raycast; });

		raycasterRef.current.set(rayOrig, rayDir);
		const hits = raycasterRef.current.intersectObjects(chunks, false);

		chunks.forEach((c, i) => { c.raycast = savedRaycasts[i]; });

		for (const hit of hits) {
			if (hit.distance > MAX_TELEPORT_DISTANCE) continue;
			if (hit.face) {
				const worldNormal = hit.face.normal.clone();
				worldNormal.transformDirection(hit.object.matrixWorld);
				if (worldNormal.y < 0.3) continue;
			}
			return hit.point.clone();
		}
		return null;
	}, []);

	const findGenericHit = useCallback((rayOrig: Vector3, rayDir: Vector3): Vector3 | null => {
		raycasterRef.current.set(rayOrig, rayDir);
		const hits = raycasterRef.current.intersectObjects(scene.children, true);

		for (const hit of hits) {
			if (hit.distance > MAX_TELEPORT_DISTANCE) break;
			if (isExcludedFromTeleport(hit.object)) continue;
			if (!(hit.object as Mesh).isMesh) continue;
			const mat = (hit.object as any).material;
			if (mat?.type === 'PointsMaterial' || mat?.type === 'SpriteMaterial') continue;
			if (mat?.transparent && mat?.opacity < 0.1) continue;
			if (hit.face) {
				const worldNormal = hit.face.normal.clone();
				worldNormal.transformDirection(hit.object.matrixWorld);
				if (worldNormal.y < 0.3) continue;
			}
			return hit.point.clone();
		}
		return null;
	}, [scene]);

	const findWaterHit = useCallback((rayOrig: Vector3, rayDir: Vector3): Vector3 | null => {
		const waterLevel = props.waterLevel ?? -12;
		const denom = rayDir.y;
		if (Math.abs(denom) < 0.001) return null;

		const t = (waterLevel - rayOrig.y) / denom;
		if (t <= 0 || t > MAX_TELEPORT_DISTANCE) return null;

		const waterHitPoint = new Vector3(
			rayOrig.x + rayDir.x * t,
			waterLevel,
			rayOrig.z + rayDir.z * t
		);

		const upwardOrigin = waterHitPoint.clone();
		upwardOrigin.y = waterLevel - 0.1;
		const upwardDir = new Vector3(0, 1, 0);
		const terrainAbove = findTerrainHit(upwardOrigin, upwardDir);
		if (terrainAbove && terrainAbove.y > waterLevel + 0.5) {
			return null;
		}

		return waterHitPoint;
	}, [props.waterLevel, findTerrainHit]);

	const executeTeleport = useCallback((targetPoint: Vector3, isWaterTarget: boolean = false) => {
		if (!origin) return;
		
		const avatarHeight = props.avatarHeightOffset?.current ?? 1.6;
		const waterLevel = props.waterLevel ?? -12;

		const xrCam = gl.xr.getCamera();
		xrCam.getWorldPosition(tempCamVec.current);
		const trackingHeadOffset = tempCamVec.current.y - origin.position.y;

		let desiredCameraY: number;
		if (isWaterTarget || targetPoint.y <= waterLevel + 0.1) {
			const shoulderDepth = avatarHeight * 0.15;
			desiredCameraY = waterLevel + shoulderDepth + (avatarHeight - avatarHeight * 0.85);
		} else {
			desiredCameraY = targetPoint.y + avatarHeight;
		}
		const originY = desiredCameraY - trackingHeadOffset;

		origin.position.set(targetPoint.x, originY, targetPoint.z);

		const p2pcf = (window as any).p2pcf;
		if (p2pcf) {
			const bridge = getNetworkBridge();
			// Use quaternion from origin for rotation
			const originQuat = new Quaternion().setFromEuler(origin.rotation);
			bridge.sendState({
				position: [targetPoint.x, targetPoint.y, targetPoint.z],
				rotation: [originQuat.x, originQuat.y, originQuat.z, originQuat.w],
				action: 'walking',
				hangtime: 0,
			}, userData);

			if (movementTimeoutRef.current) {
				clearTimeout(movementTimeoutRef.current);
			}
			movementTimeoutRef.current = setTimeout(() => {
				bridge.sendState({
					position: [targetPoint.x, targetPoint.y, targetPoint.z],
					rotation: [originQuat.x, originQuat.y, originQuat.z, originQuat.w],
					action: 'idle',
					hangtime: 0,
				}, userData);
			}, 100);
		}
	}, [origin, gl, userData, props.avatarHeightOffset]);

	/**
	 * Compute hand/controller ray using the input source's targetRaySpace.
	 * This matches the visual ray pointer rendered by @react-three/xr.
	 * Returns true if a valid ray was found.
	 */
	const computeHandRay = useCallback((xrFrame: any, refSpace: any): boolean => {
		if (!xrFrame || !refSpace) return false;

		const xrSession = gl.xr.getSession();
		if (!xrSession) return false;

		let rightSource: any = null;
		let leftSource: any = null;

		for (const inputSource of xrSession.inputSources as Iterable<any>) {
			if (inputSource.targetRayMode === 'transient-pointer') continue;
			if (!inputSource.targetRaySpace) continue;

			if (inputSource.handedness === 'right' && !rightSource) {
				rightSource = inputSource;
			} else if (inputSource.handedness === 'left' && !leftSource) {
				leftSource = inputSource;
			}
		}

		const chosenSource = rightSource || leftSource;
		if (!chosenSource) return false;

		const pose = xrFrame.getPose(chosenSource.targetRaySpace, refSpace);
		if (!pose) return false;

		const p = pose.transform.position;
		const o = pose.transform.orientation;

		rayOriginRef.current.set(p.x, p.y, p.z);
		tmpQuatA.current.set(o.x, o.y, o.z, o.w);
		rayDirRef.current.set(0, 0, -1).applyQuaternion(tmpQuatA.current);

		if (origin) {
			origin.updateWorldMatrix(true, false);
			rayOriginRef.current.applyMatrix4(origin.matrixWorld);
			const originQ = new Quaternion().setFromRotationMatrix(origin.matrixWorld);
			rayDirRef.current.applyQuaternion(originQ);
		}

		return true;
	}, [gl, origin]);

	useFrame((_state, _delta, xrFrame) => {
		if (!isPresenting || !origin) {
			if (landingDotRef.current) landingDotRef.current.visible = false;
			if (holdRingGroupRef.current) holdRingGroupRef.current.visible = false;
			return;
		}

		terrainCacheCounterRef.current++;
		if (terrainCacheCounterRef.current % 60 === 0) {
			collectTerrainChunks();
		}

		// Compute hand ray from hand joints or controller
		const refSpace = gl.xr.getReferenceSpace();
		handRayFoundRef.current = computeHandRay(xrFrame, refSpace);

		if (!handRayFoundRef.current) {
			// Fallback: no hand ray found, hide indicators
			if (landingDotRef.current) landingDotRef.current.visible = false;
			if (holdRingGroupRef.current) holdRingGroupRef.current.visible = false;
			return;
		}

		// Get actual camera world Y for water detection
		const xrCam = gl.xr.getCamera();
		if (xrCam) {
			xrCam.getWorldPosition(tempCamVec.current);
						}

		const waterLevel = props.waterLevel ?? -12;
		const swimThreshold = waterLevel + 0.8;
		isInWaterRef.current = tempCamVec.current.y <= swimThreshold;

		if (isGrabbingRef.current) {
			isHoveringRef.current = false;
			if (landingDotRef.current) landingDotRef.current.visible = false;
			if (holdRingGroupRef.current) holdRingGroupRef.current.visible = false;
			return;
		}

		// Raycast for terrain hit using hand ray
		let hit = findTerrainHit(rayOriginRef.current, rayDirRef.current);
		if (!hit) {
			hit = findGenericHit(rayOriginRef.current, rayDirRef.current);
		}

		// If no land hit found, try water plane (for entering water from land)
		let isWaterEntry = false;
		if (!hit) {
			hit = findWaterHit(rayOriginRef.current, rayDirRef.current);
			if (hit) isWaterEntry = true;
		}

		if (hit) {
			hoverPointRef.current.copy(hit);
			isHoveringRef.current = true;
			isWaterTargetRef.current = isWaterEntry;
			if (landingDotRef.current) {
				landingDotRef.current.position.set(hit.x, hit.y + 0.05, hit.z);
				landingDotRef.current.visible = true;
			}
		} else {
			isHoveringRef.current = false;
			if (landingDotRef.current) landingDotRef.current.visible = false;
		}

		// Hold-to-open menu logic
		if (isSelectingRef.current && !menuOpenedRef.current) {
			const elapsed = (performance.now() - selectStartTimeRef.current) / 1000;
			holdProgressRef.current = Math.min(elapsed / MENU_HOLD_DURATION, 1);

			if (elapsed >= MENU_HINT_THRESHOLD && isHoveringRef.current) {
				if (holdRingGroupRef.current) {
					holdRingGroupRef.current.position.set(
						hoverPointRef.current.x,
						hoverPointRef.current.y + 0.06,
						hoverPointRef.current.z
					);
					holdRingGroupRef.current.visible = true;
				}
				if (holdRingMeshRef.current) {
					const thetaLength = holdProgressRef.current * Math.PI * 2;
					const oldGeom = holdRingMeshRef.current.geometry;
					holdRingMeshRef.current.geometry = new RingGeometry(0.4, 0.5, 32, 1, -Math.PI / 2, thetaLength);
					if (oldGeom) oldGeom.dispose();
				}
			}

			if (elapsed >= MENU_HOLD_DURATION) {
				menuOpenedRef.current = true;
				isSelectingRef.current = false;
				holdProgressRef.current = 0;
				if (holdRingGroupRef.current) holdRingGroupRef.current.visible = false;

				const xrCam = gl.xr.getCamera();
				xrCam.getWorldPosition(tempCamVec.current);

				let menuWorldPos: number[];
				if (isHoveringRef.current) {
					const hp = hoverPointRef.current;
					const dx = hp.x - tempCamVec.current.x;
					const dy = hp.y - tempCamVec.current.y;
					const dz = hp.z - tempCamVec.current.z;
					const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
					const MAX_MENU_DIST = 3.5;
					if (dist > MAX_MENU_DIST) {
						const scale = MAX_MENU_DIST / dist;
						menuWorldPos = [
							tempCamVec.current.x + dx * scale,
							tempCamVec.current.y + dy * scale,
							tempCamVec.current.z + dz * scale
						];
					} else {
						menuWorldPos = [hp.x, hp.y + 0.5, hp.z];
					}
				} else {
					const camFwd = menuFwdRef.current.set(0, 0, -1).applyQuaternion(xrCam.quaternion);
					if (origin) {
						const originQ = new Quaternion().setFromRotationMatrix(origin.matrixWorld);
						camFwd.applyQuaternion(originQ);
					}
					camFwd.y = 0;
					camFwd.normalize();
					menuWorldPos = [
						tempCamVec.current.x + camFwd.x * 1.8,
						tempCamVec.current.y - 0.2,
						tempCamVec.current.z + camFwd.z * 1.8
					];
				}

				window.dispatchEvent(new CustomEvent('xrMenuOpen', {
					detail: {
						position: menuWorldPos,
						cameraPosition: [tempCamVec.current.x, tempCamVec.current.y, tempCamVec.current.z]
					}
				}));
			}
		} else {
			if (holdRingGroupRef.current) holdRingGroupRef.current.visible = false;
		}
	});

	useEffect(() => {
		if (!isPresenting) return;
		const xrSession = gl.xr.getSession();
		if (!xrSession) return;

		const handleSelectStart = () => {
			if (isGrabbingRef.current) return;

			selectStartTimeRef.current = performance.now();
			isSelectingRef.current = true;
			menuOpenedRef.current = false;
			holdProgressRef.current = 0;
		};

		const handleSelectEnd = () => {
			const elapsed = (performance.now() - selectStartTimeRef.current) / 1000;
			isSelectingRef.current = false;
			holdProgressRef.current = 0;

			if (holdRingGroupRef.current) holdRingGroupRef.current.visible = false;

			if (menuOpenedRef.current) {
				menuOpenedRef.current = false;
				return;
			}

			if (elapsed < MENU_HINT_THRESHOLD && isHoveringRef.current) {
				executeTeleport(hoverPointRef.current.clone(), isWaterTargetRef.current);
			}
		};

		xrSession.addEventListener('selectstart', handleSelectStart);
		xrSession.addEventListener('selectend', handleSelectEnd);
		return () => {
			xrSession.removeEventListener('selectstart', handleSelectStart);
			xrSession.removeEventListener('selectend', handleSelectEnd);
		};
	}, [isPresenting, executeTeleport, gl.xr]);

	return (
		<>
			<group ref={landingDotRef} visible={false} name="teleport-indicator">
				<mesh rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[0.25, 0.35, 32]} />
					<meshBasicMaterial
						color="#4285f4"
						transparent
						opacity={0.8}
						side={DoubleSide}
						depthWrite={false}
					/>
				</mesh>
				<mesh rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.12, 16]} />
					<meshBasicMaterial
						color="#ffffff"
						transparent
						opacity={0.9}
						side={DoubleSide}
						depthWrite={false}
					/>
				</mesh>
				</group>

			<group ref={holdRingGroupRef} visible={false} name="hold-ring">
				<mesh ref={holdRingMeshRef} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[0.4, 0.5, 32, 1, -Math.PI / 2, 0]} />
					<meshBasicMaterial
						color="#22c55e"
						transparent
						opacity={0.9}
						side={DoubleSide}
						depthWrite={false}
					/>
				</mesh>
			</group>
		</>
	);
}
