import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box3, Vector3, DoubleSide } from 'three';
import useInteractionStore from '../stores/interactionStore';
import { CanvasTextMesh } from './core/front/CanvasTextMesh';

/**
 * NPC "Press E to Interact" banner — hand-rolled R3F version.
 *
 * Migrated off @react-three/uikit because uikit's <Text> patches MSDF
 * sampling code into a GLSL `parameters.fragmentShader` string at runtime,
 * the same pattern Troika uses. Under WebGPU/TSL those string patches are
 * never compiled, so the text renders as a blank panel-coloured rectangle.
 *
 * Replacement is a minimal group containing:
 *   - a semi-transparent black plane for the banner background
 *   - a white outline plane just behind it (border effect)
 *   - two MSDFTextMesh elements for the title + NPC name, stacked
 *
 * Using world units throughout. The prior Root had sizeX=0.75 sizeY=0.2
 * with pixelSize=0.003, so the visible banner was 0.75 × 0.2 world units.
 * We match that footprint.
 */

// Shared geometry for the banner background + border (every banner is the
// same size — no reason to allocate fresh BufferGeometry per instance).
const BANNER_WIDTH = 0.75;
const BANNER_HEIGHT = 0.2;
const BORDER_THICKNESS = 0.006; // ~2px at the old pixelSize=0.003

// One pipeline prewarm per page is enough — the first mounted banner owns it.
let bannerPrewarmClaimed = false;

/**
 * Draws the banner's exact material/pipeline variants once at world load.
 *
 * The banner mounts on FIRST HOVER and WebGPU compiles render pipelines
 * synchronously on first draw. This group is parked far below the world at
 * near-zero scale (frustumCulled=false so it IS drawn) to warm those
 * pipelines early. The text is a CanvasTextMesh (textured transparent basic)
 * now — a cheap pipeline, not the old MSDF/TSL compile that froze ~590ms.
 */
function BannerPipelinePrewarm() {
  return (
    <group position={[0, -9999, 0]} scale={0.0001}>
      {/* Matches the border plane: opaque basic, DoubleSide. */}
      <mesh frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" side={DoubleSide} />
      </mesh>
      {/* Matches the background plane: transparent basic, DoubleSide. */}
      <mesh frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#000000" opacity={0.95} transparent side={DoubleSide} />
      </mesh>
      {/* Matches the text pipeline (textured transparent basic). */}
      <CanvasTextMesh text="." worldWidth={0.1} worldFontSize={0.02} color="#ffffff" />
    </group>
  );
}

export default function NPCInteractionBanner({
  npcId,
  npcName = "NPC",
  npcGroupRef = null,
  visible = true,
  onInteractionStart = () => {}
}) {
  const bannerRef = useRef();
  const rootGroupRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  // First banner on the page mounts the pipeline prewarm (see above).
  const [ownsPrewarm] = useState(() => {
    if (bannerPrewarmClaimed) return false;
    bannerPrewarmClaimed = true;
    return true;
  });
  const { camera } = useThree();
  // Narrow selector — whole-store destructure re-rendered every banner on
  // every interaction-store write.
  const interactingWithThis = useInteractionStore(
    (s) => s.isInteracting && s.interactingWith?.id === npcId
  );

  // Handle E key press for interaction
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'KeyE' && typeof window !== 'undefined' && window.worldCursorAPI?.hoveredNPC?.id === npcId) {
        if (useInteractionStore.getState().isInteractingWithId(npcId)) return;

        event.preventDefault();
        event.stopPropagation();

        let npcPosition = [0, 0, 0];
        if (npcGroupRef?.current) {
          const worldPos = new Vector3();
          npcGroupRef.current.getWorldPosition(worldPos);
          npcPosition = [worldPos.x, worldPos.y, worldPos.z];
        }

        useInteractionStore.getState().startInteraction({
          type: 'npc',
          id: npcId,
          name: npcName,
          position: npcPosition
        });

        // Release the pointer so the chat UI is immediately clickable.
        if (document.pointerLockElement && document.exitPointerLock) {
          document.exitPointerLock();
        }

        onInteractionStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [npcId, npcName, onInteractionStart, npcGroupRef]);

  // Cached banner height — Box3.setFromObject traverses the whole skinned
  // VRM subtree, far too heavy per frame. Refresh at most every 0.5s and
  // only while the banner is actually visible.
  const topYRef = useRef(null);
  const lastBboxTimeRef = useRef(-1);

  // Update hover state and position/rotation every frame
  useFrame((state) => {
    // Check hover state every frame
    const hoveredNPCId = window.worldCursorAPI?.hoveredNPC?.id;
    const nowHovered = hoveredNPCId === npcId;
    if (nowHovered !== isHovered) {
      setIsHovered(nowHovered);
    }

    // Only update position if the banner is rendered
    if (!rootGroupRef?.current || !npcGroupRef?.current) return;

    const now = state.clock.elapsedTime;
    if (topYRef.current === null || now - lastBboxTimeRef.current > 0.5) {
      lastBboxTimeRef.current = now;
      const bbox = new Box3().setFromObject(npcGroupRef.current);
      topYRef.current = bbox.max.y;
    }

    // Get NPC world position
    const npcWorldPos = new Vector3();
    npcGroupRef.current.getWorldPosition(npcWorldPos);

    // Add offset above the head
    const heightOffset = 0.3;

    // Update position directly on the group
    rootGroupRef.current.position.set(npcWorldPos.x, topYRef.current + heightOffset, npcWorldPos.z);
    
    // Get camera world position
    const cameraWorldPos = new Vector3();
    camera.getWorldPosition(cameraWorldPos);
    
    // Calculate direction from banner to camera (only on XZ plane for Y rotation)
    const dx = cameraWorldPos.x - rootGroupRef.current.position.x;
    const dz = cameraWorldPos.z - rootGroupRef.current.position.z;
    
    // Calculate the angle to face the camera
    const angleToCamera = Math.atan2(dx, dz);
    
    // Set rotation directly
    rootGroupRef.current.rotation.y = angleToCamera;
  });
  
  // Check if we should show banner
  const shouldShow = visible && !interactingWithThis && isHovered;

  // The prewarm renders regardless of hover; the banner only when needed.
  if (!shouldShow) {
    return ownsPrewarm ? <BannerPipelinePrewarm /> : null;
  }

  return (
    <>
    {ownsPrewarm && <BannerPipelinePrewarm />}
    <group ref={rootGroupRef}>
      {/* White border plane (rendered behind, sticks out by BORDER_THICKNESS on each side). */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[BANNER_WIDTH + BORDER_THICKNESS * 2, BANNER_HEIGHT + BORDER_THICKNESS * 2]} />
        <meshBasicMaterial color="#ffffff" side={DoubleSide} />
      </mesh>
      {/* Banner background. */}
      <mesh ref={bannerRef}>
        <planeGeometry args={[BANNER_WIDTH, BANNER_HEIGHT]} />
        <meshBasicMaterial color="#000000" opacity={0.95} transparent side={DoubleSide} />
      </mesh>
      <CanvasTextMesh
        text="Press E to Interact"
        worldWidth={BANNER_WIDTH * 0.9}
        worldFontSize={0.06}
        color="#ffffff"
        align="center"
        position={[0, 0.03, 0.001]}
      />
      <CanvasTextMesh
        text={npcName}
        worldWidth={BANNER_WIDTH * 0.95}
        worldFontSize={0.045}
        color="#dddddd"
        align="center"
        position={[0, -0.05, 0.001]}
      />
    </group>
    </>
  );
}
