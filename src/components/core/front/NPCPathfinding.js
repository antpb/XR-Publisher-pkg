import { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, AnimationMixer } from 'three';
import { RigidBody } from '@react-three/rapier';
import EasyStar from 'easystarjs';

export function NPCPathfinding({
  npc,
  scene,
  gridSize = 20,
  cellSize = 1,
  walkSpeed = 2,
  animations,
  vrm,
  position,
  rotation,
}) {
  const { clock } = useThree();
  const easystar = useRef(new EasyStar.js());
  const currentPath = useRef(null);
  const currentPathIndex = useRef(0);
  const targetPosition = useRef(new Vector3());
  const rigidBodyRef = useRef(null);
  const mixerRef = useRef(null);
  const isMoving = useRef(false);

  // Initialize grid for pathfinding
  useEffect(() => {
    // Create a grid based on the world size
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    
    // Set the grid and acceptable tiles
    easystar.current.setGrid(grid);
    easystar.current.setAcceptableTiles([0]);
    easystar.current.enableDiagonals();
    
    // Set iterations to prevent blocking
    easystar.current.setIterationsPerCalculation(1000);

    // Create animation mixer for VRM model
    if (vrm) {
      mixerRef.current = new AnimationMixer(vrm.scene);
      
      // Set up animations
      if (animations) {
        Object.entries(animations).forEach(([name, clip]) => {
          const action = mixerRef.current.clipAction(clip);
          if (name === 'idle') {
            action.play();
          }
        });
      }
    }

    // Start with a random path
    generateRandomPath();
  }, []);

  const generateRandomPath = () => {
    const startX = Math.floor(position[0] / cellSize + gridSize / 2);
    const startY = Math.floor(position[2] / cellSize + gridSize / 2);
    
    // Generate random end position
    const endX = Math.floor(Math.random() * gridSize);
    const endY = Math.floor(Math.random() * gridSize);

    easystar.current.findPath(startX, startY, endX, endY, (path) => {
      if (path) {
        currentPath.current = path.map(point => new Vector3(
          (point.x - gridSize / 2) * cellSize,
          position[1],
          (point.y - gridSize / 2) * cellSize
        ));
        currentPathIndex.current = 0;
        if (currentPath.current.length > 0) {
          targetPosition.current.copy(currentPath.current[0]);
        }
      }
    });
    
    easystar.current.calculate();
  };

  const updateAnimation = (isWalking) => {
    if (!mixerRef.current || !animations) return;

    const currentAction = isWalking ? 'walking' : 'idle';
    const fadeTime = 0.5;

    Object.entries(animations).forEach(([name, clip]) => {
      const action = mixerRef.current.clipAction(clip);
      if (name === currentAction) {
        action.reset().fadeIn(fadeTime).play();
      } else {
        action.fadeOut(fadeTime);
      }
    });
  };

  useFrame((state, delta) => {
    if (!currentPath.current || !rigidBodyRef.current) return;

    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Update VRM
    if (vrm) {
      vrm.update(delta);
    }

    const currentPos = rigidBodyRef.current.translation();
    const distanceToTarget = new Vector3(
      targetPosition.current.x - currentPos.x,
      0,
      targetPosition.current.z - currentPos.z
    ).length();

    if (distanceToTarget < 0.1) {
      // Move to next point in path
      currentPathIndex.current++;
      
      if (currentPathIndex.current >= currentPath.current.length) {
        // Generate new random path when current path is completed
        generateRandomPath();
        return;
      }

      targetPosition.current.copy(currentPath.current[currentPathIndex.current]);
    }

    // Calculate movement direction
    const direction = new Vector3(
      targetPosition.current.x - currentPos.x,
      0,
      targetPosition.current.z - currentPos.z
    ).normalize();

    // Apply movement
    const movement = direction.multiplyScalar(walkSpeed * delta);
    rigidBodyRef.current.setLinvel({ x: movement.x, y: currentPos.y, z: movement.z }, true);

    // Update rotation to face movement direction
    const angle = Math.atan2(movement.x, movement.z);
    rigidBodyRef.current.setRotation(new Quaternion().setFromEuler(new Euler(0, angle, 0)), true);

    // Update animation state
    const isWalking = distanceToTarget > 0.1;
    if (isWalking !== isMoving.current) {
      isMoving.current = isWalking;
      updateAnimation(isWalking);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      type="dynamic"
      colliders="ball"
      mass={1}
    >
      {vrm && <primitive object={vrm.scene} />}
    </RigidBody>
  );
}