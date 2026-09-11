import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box3, Vector3, DoubleSide } from 'three';
import useRideStore from '../stores/rideStore';
import { hashClientId16, isVehicleOwnedByOther } from '../stores/vehicleStateStore';
import { nextFreeSeat } from '../networking/vehicleOccupancy';
import { CanvasTextMesh } from './core/front/CanvasTextMesh';

/**
 * "Press E to Ride" banner — the rideable-vehicle twin of
 * NPCInteractionBanner. Same hand-rolled R3F layout (MSDF text is WebGPU-safe
 * where troika/uikit string-patched GLSL is not), but it keys off
 * `worldCursorAPI.hoveredRideable` and fires `onInteractionStart` to mount the
 * vehicle. Pipeline prewarm is owned by NPCInteractionBanner — no need to
 * duplicate it here (same materials/pipelines).
 */

const BANNER_WIDTH = 0.75;
const BANNER_HEIGHT = 0.2;
const BORDER_THICKNESS = 0.006;

// Module-level scratch temps — reused across every banner instance every frame
// so we never allocate a Box3/Vector3 in useFrame (the audit flagged this as
// N-allocations/frame for every mounted banner).
const _bbox = new Box3();
const _worldPos = new Vector3();
const _camPos = new Vector3();

export default function RideableInteractionBanner({
  rideableId,
  rideableName = 'Vehicle',
  groupRef = null,
  capacity = 1,
  visible = true,
  onInteractionStart = () => {},
}) {
  const rootGroupRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  // Boarding mode for THIS vehicle while hovered: 'drive' (empty → take the
  // wheel), 'ride' (driven, a passenger seat is free), or 'full' (driven, no
  // free seat → no prompt). Recomputed from live occupancy in useFrame.
  const [mode, setMode] = useState('drive');
  const { camera } = useThree();

  const isMountedHere = useRideStore(
    (s) => s.isMounted && s.vehicleId === rideableId
  );

  // E key → start riding (only when hovering THIS vehicle and not already
  // mounted in anything). Does NOT exit pointer lock — riding is in-world.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code !== 'KeyE') return;
      if (typeof window === 'undefined') return;
      if (window.worldCursorAPI?.hoveredRideable?.id !== rideableId) return;
      if (useRideStore.getState().isMounted) return; // already riding something

      event.preventDefault();
      event.stopPropagation();
      onInteractionStart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rideableId, onInteractionStart]);

  const topYRef = useRef(null);
  const lastBboxTimeRef = useRef(-1);

  useFrame((state) => {
    const hoveredId = window.worldCursorAPI?.hoveredRideable?.id;
    const nowHovered = hoveredId === rideableId;
    if (nowHovered !== isHovered) setIsHovered(nowHovered);

    if (nowHovered) {
      // Decide what boarding this vehicle would do, right now.
      const clientId = window.p2pcf?.clientId || '';
      const localHash = clientId ? hashClientId16(clientId) : -1;
      let nextMode;
      if (clientId && isVehicleOwnedByOther(rideableId, localHash)) {
        nextMode = capacity > 1 && nextFreeSeat(rideableId, capacity) >= 0 ? 'ride' : 'full';
      } else {
        nextMode = 'drive';
      }
      if (nextMode !== mode) setMode(nextMode);
    }

    if (!rootGroupRef?.current || !groupRef?.current) return;

    const now = state.clock.elapsedTime;
    if (topYRef.current === null || now - lastBboxTimeRef.current > 0.5) {
      lastBboxTimeRef.current = now;
      _bbox.setFromObject(groupRef.current);
      topYRef.current = isFinite(_bbox.max.y) ? _bbox.max.y : groupRef.current.position.y + 1;
    }

    groupRef.current.getWorldPosition(_worldPos);
    rootGroupRef.current.position.set(_worldPos.x, topYRef.current + 0.3, _worldPos.z);

    camera.getWorldPosition(_camPos);
    const dx = _camPos.x - rootGroupRef.current.position.x;
    const dz = _camPos.z - rootGroupRef.current.position.z;
    rootGroupRef.current.rotation.y = Math.atan2(dx, dz);
  });

  // 'full' shows no prompt (nothing to board).
  const shouldShow = visible && !isMountedHere && isHovered && mode !== 'full';
  if (!shouldShow) return null;

  const promptText = mode === 'ride' ? 'Press E to Ride Along' : 'Press E to Drive';

  return (
    <group ref={rootGroupRef}>
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[BANNER_WIDTH + BORDER_THICKNESS * 2, BANNER_HEIGHT + BORDER_THICKNESS * 2]} />
        <meshBasicMaterial color="#ffffff" side={DoubleSide} />
      </mesh>
      <mesh>
        <planeGeometry args={[BANNER_WIDTH, BANNER_HEIGHT]} />
        <meshBasicMaterial color="#000000" opacity={0.95} transparent side={DoubleSide} />
      </mesh>
      <CanvasTextMesh
        text={promptText}
        worldWidth={BANNER_WIDTH * 0.9}
        worldFontSize={0.06}
        color="#ffffff"
        align="center"
        position={[0, 0.03, 0.001]}
      />
      <CanvasTextMesh
        text={rideableName}
        worldWidth={BANNER_WIDTH * 0.95}
        worldFontSize={0.045}
        color="#dddddd"
        align="center"
        position={[0, -0.05, 0.001]}
      />
    </group>
  );
}
