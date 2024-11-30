import { useRef, useEffect } from 'react';
import { Vector3, AnimationMixer, AnimationAction, Mesh, Scene } from 'three';
import { Pathfinding } from 'three-pathfinding';
const ZONE_ID = 'level1';  // Consistent zone ID

export function useNPCPathfinding(
    scene: Scene,
    navMesh: Mesh | null,
    initialPosition: Vector3,
    walkSpeed: number = 1.1,
    turnSpeed: number = 5
) {
    const pathfindingState = useRef({
        pathfinder: null as Pathfinding | null,
        currentPath: [] as Vector3[],
        currentTargetIndex: 0,
        isMoving: false,
        currentRotation: 0,
        isChangingDirection: false,
        initialized: false,
        groupId: null as number | null
    });

    // Initialize pathfinding when navMesh is ready
	useEffect(() => {
		if (!navMesh || pathfindingState.current.initialized) {
			console.log("Pathfinder state:", {
				hasNavMesh: !!navMesh,
				isInitialized: pathfindingState.current.initialized
			});
			return;
		}
	
		try {
			console.log("Creating pathfinder");
			const pathfinder = new Pathfinding();
			
			// Force all Y coordinates to 0 for pathfinding
			const clonedGeometry = navMesh.geometry.clone();
			const positions = clonedGeometry.attributes.position.array;
			for (let i = 1; i < positions.length; i += 3) {
				positions[i] = 0;
			}
			
			const zone = Pathfinding.createZone(clonedGeometry);
			console.log("Zone created:", {
				vertices: zone.vertices.length,
				groups: zone.groups.length
			});
			
			pathfinder.setZoneData(ZONE_ID, zone);
			
			// Get initial position at ground level
			const groundPosition = new Vector3(
				initialPosition.x,
				-1,
				initialPosition.z
			);
			
			const groupId = pathfinder.getGroup(ZONE_ID, groundPosition);
			console.log("Found group:", { groupId, position: groundPosition.toArray() });
			
			if (typeof groupId === 'number') {
				pathfindingState.current.pathfinder = pathfinder;
				pathfindingState.current.groupId = groupId;
				pathfindingState.current.initialized = true;
				
				console.log("Pathfinder initialized, generating path");
				generateRandomPath();
			} else {
				console.error("Failed to get valid group ID");
			}
		} catch (error) {
			console.error("Pathfinding initialization error:", error);
		}
	}, [navMesh]);	

	const generateRandomPath = () => {
		const { pathfinder, groupId } = pathfindingState.current;
		if (!pathfinder || groupId === null || !navMesh) {
			console.log("Cannot generate path:", {
				hasPathfinder: !!pathfinder,
				groupId,
				hasNavMesh: !!navMesh
			});
			return;
		}
	
		try {
			// Create a simple direct path
			const startPoint = new Vector3(initialPosition.x, 0, initialPosition.z);
			const angle = Math.random() * Math.PI * 2;
			const radius = 5;
			const endPoint = new Vector3(
				startPoint.x + Math.cos(angle) * radius,
				0,
				startPoint.z + Math.sin(angle) * radius
			);
	
			// Create and set the path directly
			const path = [startPoint, endPoint];
			
			console.log("Setting new path:", {
				start: startPoint.toArray(),
				end: endPoint.toArray(),
				pathLength: path.length
			});
	
			pathfindingState.current = {
				...pathfindingState.current,
				currentPath: path,
				currentTargetIndex: 0,
				isMoving: true // Important: This needs to be true
			};
	
		} catch (error) {
			console.error("Error generating path:", error);
		}
	};

	const updateMovement = (
		delta: number,
		vrmScene: Scene,
		mixer: AnimationMixer,
		animations: {
			idle: AnimationAction | null;
			walking: AnimationAction | null;
		}
	) => {
		const state = pathfindingState.current;
	
		// More detailed movement debug
		console.log("Movement update:", {
			isMoving: state.isMoving,
			hasPath: state.currentPath.length > 0,
			pathLength: state.currentPath.length,
			currentIndex: state.currentTargetIndex,
			currentTarget: state.currentPath[state.currentTargetIndex]?.toArray(),
			currentPosition: vrmScene.position.toArray()
		});
	
		if (!state.isMoving || state.currentPath.length === 0) {
			handleAnimation(false, delta, animations);
			console.log("No movement: generating new path");
			generateRandomPath();
			return;
		}
	
		const currentTarget = state.currentPath[state.currentTargetIndex];
		const currentPosition = new Vector3().copy(vrmScene.position);
		const distanceToTarget = currentPosition.distanceTo(currentTarget);
	
		console.log("Movement step:", {
			distanceToTarget,
			targetPos: currentTarget.toArray(),
			currentPos: currentPosition.toArray()
		});
	
		// Move to next point if close enough
		if (distanceToTarget < 0.1) {
			state.currentTargetIndex++;
			if (state.currentTargetIndex >= state.currentPath.length) {
				generateRandomPath();
				return;
			}
		}

		// Calculate movement
		const direction = new Vector3()
			.subVectors(currentTarget, currentPosition)
			.normalize();

		// Handle rotation
		const targetAngle = Math.atan2(direction.x, direction.z) + Math.PI;
		let angleDiff = targetAngle - state.currentRotation;

		// Normalize angles
		while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
		while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

		state.isChangingDirection = Math.abs(angleDiff) > 0.5;

		// Update rotation
		state.currentRotation += angleDiff * turnSpeed * delta;
		state.currentRotation %= Math.PI * 2;
		vrmScene.rotation.y = state.currentRotation;

		// Update position
		let currentSpeed = walkSpeed;
		if (state.isChangingDirection) {
			currentSpeed *= Math.max(0.4, 1 - (Math.abs(angleDiff) / Math.PI));
		}

		vrmScene.position.add(direction.multiplyScalar(currentSpeed * delta));
		handleAnimation(true, delta, animations);
	};

	const handleAnimation = (
		isWalking: boolean,
		delta: number,
		animations: {
			idle: AnimationAction | null;
			walking: AnimationAction | null;
		}
	) => {
		if (!animations.idle || !animations.walking) return;

		const { idle, walking } = animations;
		const state = pathfindingState.current;

		if (isWalking) {
			if (walking.getEffectiveWeight() < 1) {
				walking.setEffectiveTimeScale(state.isChangingDirection ? 0.7 : 0.95);
				walking.setEffectiveWeight(walking.getEffectiveWeight() + delta * 2);
				idle.setEffectiveWeight(1 - walking.getEffectiveWeight());
			}
		} else {
			if (idle.getEffectiveWeight() < 1) {
				idle.setEffectiveTimeScale(1);
				idle.setEffectiveWeight(idle.getEffectiveWeight() + delta * 2);
				walking.setEffectiveWeight(1 - idle.getEffectiveWeight());
			}
		}
	};

	return {
		updateMovement,
		generateRandomPath,
		pathfindingState
	};
}
