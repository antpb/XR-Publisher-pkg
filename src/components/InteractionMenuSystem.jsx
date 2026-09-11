import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Vector3, Box3 } from 'three';
import RadialMenu from './RadialMenu';
import AssetBrowser3D from './AssetBrowser3D';
import { getRegisteredActions, onActionRegistryChange } from './RadialMenuActionRegistry';
import { executeContextAction, initializeDefaultContexts } from './ContextualActionSystem';
import PrimitiveGeneratorAction from './PrimitiveGeneratorAction';
import { Root } from '@react-three/uikit';
import { CanvasTextMesh } from './core/front/CanvasTextMesh';
import { useCursorStore } from '../stores/cursorStore';
import useRideStore from '../stores/rideStore';

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Master switch for the in-world world-action radial menu (the one that drops
// in on the E key / cursor-interact). Disabled because it half-works and
// hijacks the E interaction key that players use for objects/vehicles.
// All open triggers (E key, worldCursorInteract, XR open events) funnel through
// openMenu(), so gating it here turns the whole thing off without removing any
// of the menu/button code. Flip back to true to restore.
const WORLD_ACTION_MENU_ENABLED = false;

// Utility function to calculate dialogue camera positioning for framing both player and object
const calculateDialogueCameraPosition = (playerPos, objectPos, objectSize) => {
    // Calculate the midpoint between player and object
    const midpoint = [
        (playerPos[0] + objectPos[0]) / 2,
        (playerPos[1] + objectPos[1]) / 2 + 1, // Slight upward offset
        (playerPos[2] + objectPos[2]) / 2
    ];

    // Calculate distance between player and object
    const distance = Math.sqrt(
        Math.pow(objectPos[0] - playerPos[0], 2) +
        Math.pow(objectPos[1] - playerPos[1], 2) +
        Math.pow(objectPos[2] - playerPos[2], 2)
    );

    // Calculate camera distance to frame both subjects
    // Base distance on the distance between subjects plus object size
    const maxObjectDimension = Math.max(objectSize.x || 1, objectSize.y || 1, objectSize.z || 1);
    const cameraDistance = Math.max(distance * 1.2, maxObjectDimension * 2, 5); // Minimum 5 units away

    // Calculate direction vector from midpoint to camera (perpendicular to player-object line)
    const playerToObject = [
        objectPos[0] - playerPos[0],
        0, // Keep Y planar for now
        objectPos[2] - playerPos[2]
    ];

    // Create perpendicular vector for side angle (rotate 90 degrees)
    const perpendicular = [
        -playerToObject[2],
        0,
        playerToObject[0]
    ];

    // Normalize perpendicular vector
    const perpLength = Math.sqrt(perpendicular[0] * perpendicular[0] + perpendicular[2] * perpendicular[2]);
    if (perpLength > 0) {
        perpendicular[0] /= perpLength;
        perpendicular[2] /= perpLength;
    }

    // Calculate camera position - slightly to the side and elevated
    const cameraPosition = [
        midpoint[0] + perpendicular[0] * cameraDistance * 0.7, // 70% to the side
        midpoint[1] + cameraDistance * 0.4, // Elevated view
        midpoint[2] + perpendicular[2] * cameraDistance * 0.7 + cameraDistance * 0.3 // Pulled back
    ];

    // Camera should look at a point slightly above the midpoint
    const lookAtTarget = [
        midpoint[0],
        midpoint[1] + 0.5,
        midpoint[2]
    ];

    return {
        position: cameraPosition,
        target: lookAtTarget,
        distance: cameraDistance,
        midpoint: midpoint
    };
};

// Utility function to calculate smart menu positioning and dialogue camera framing
const calculateSmartMenuPosition = (basePosition, focusedObject, camera, playerPosition = null) => {
    if (!focusedObject || !focusedObject.object) {
        // No object focused, return base position with slight offset
        const menuPosition = [basePosition[0] - 1.5, basePosition[1] + 0.2, basePosition[2]];
        return { menuPosition, dialogueCamera: null };
    }

    // Calculate bounding box of the focused object
    const boundingBox = new Box3();
    const object = focusedObject.object;
    
    // Expand bounding box to include the entire object hierarchy
    const expandBox = (obj) => {
        if (obj.geometry) {
            const tempBox = new Box3().setFromObject(obj);
            boundingBox.union(tempBox);
        }
        obj.children.forEach(child => expandBox(child));
    };
    
    try {
        expandBox(object);
    } catch (error) {
        const menuPosition = [basePosition[0] - 1.5, basePosition[1] + 0.2, basePosition[2]];
        return { menuPosition, dialogueCamera: null };
    }

    // Get bounding box center and size
    const center = new Vector3();
    const size = new Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    // Calculate camera direction relative to object center
    const cameraPosition = new Vector3().copy(camera.position);
    const toCameraDirection = new Vector3().subVectors(cameraPosition, center).normalize();

    // Determine menu offset distance based on object size
    const maxDimension = Math.max(size.x, size.z);
    const offsetDistance = Math.max(2.0, maxDimension * 0.8 + 1.5); // Minimum 2 units, scaled by object size

    // Choose left or right based on camera angle
    // We'll offset perpendicular to the camera-to-object direction
    const rightVector = new Vector3()
        .crossVectors(toCameraDirection, new Vector3(0, 1, 0))
        .normalize();

    // Prefer right side, but if camera is very far to the right, use left
    const cameraAngle = Math.atan2(toCameraDirection.x, toCameraDirection.z);
    const useLeftSide = Math.abs(cameraAngle) > Math.PI / 3; // Use left if camera is > 60 degrees to the right

    const lateralOffset = rightVector.multiplyScalar(useLeftSide ? -offsetDistance : offsetDistance);
    
    // Final menu position: at the hit point + lateral offset + slight upward offset
    const menuPosition = [
        basePosition[0] + lateralOffset.x,
        basePosition[1] + 0.3, // Always slightly above the hit point, never below
        basePosition[2] + lateralOffset.z
    ];

    // Calculate dialogue camera position if player position is provided
    let dialogueCameraInfo = null;
    if (playerPosition) {
        dialogueCameraInfo = calculateDialogueCameraPosition(
            [playerPosition.x, playerPosition.y, playerPosition.z],
            basePosition,
            size
        );
    }

    return { 
        menuPosition, 
        dialogueCamera: dialogueCameraInfo 
    };
};

export default function InteractionMenuSystem({
    characterControllerRef,
    onMenuStateChange = () => {}
}) {
    const { scene, camera, gl } = useThree();
    const cursorVisible = useCursorStore((state) => state.visible);
    const focusedContext = useCursorStore((state) => state.focusedContext);
    const [menuVisible, setMenuVisible] = useState(false);
    const [currentSubmenu, setCurrentSubmenu] = useState(null);
    const [menuPosition, setMenuPosition] = useState([0, 0, 0]);
    const [registeredActions, setRegisteredActions] = useState([]);
    
    // Use refs for frequently-changing values that don't need re-renders
    const hoveredActionRef = useRef(null);
    const menuActionsRef = useRef([]);
    const [hoveredActionDisplay, setHoveredActionDisplay] = useState(null);
    
    // Refs for camera control
    const orbitControlsRef = useRef();
    const cameraControlsDisabled = useRef(false);
    
    // Throttled hover update - only update display state every 50ms on mobile
    const lastHoverUpdateRef = useRef(0);
    const handleHoverChange = useCallback((actionId) => {
        hoveredActionRef.current = actionId;
        
        const now = Date.now();
        const throttleMs = isMobile ? 100 : 16;
        if (now - lastHoverUpdateRef.current >= throttleMs) {
            lastHoverUpdateRef.current = now;
            setHoveredActionDisplay(actionId);
        }
    }, []);
    
    const handleActionsReady = useCallback((actions) => {
        menuActionsRef.current = actions;
    }, []);

    // Handle menu open/close
    const openMenu = useCallback((position) => {
        // Disabled: the world-action radial menu no longer opens. Every trigger
        // (E key, worldCursorInteract, XR events) routes through here, so this
        // single guard short-circuits all of them while leaving the code intact.
        if (!WORLD_ACTION_MENU_ENABLED) {
            return;
        }
        setMenuPosition(position);
        setMenuVisible(true);
        setCurrentSubmenu(null);
        
        if (characterControllerRef.current) {
            cameraControlsDisabled.current = true;
        }
        
        const isXR = typeof gl !== 'undefined' && gl?.xr?.isPresenting;
        if (!isXR) {
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            const canvas = document.querySelector('canvas');
            if (canvas && !document.pointerLockElement) {
                try { canvas.requestPointerLock(); } catch (_e) {}
            }
        }
        
        onMenuStateChange(true, position);
    }, [characterControllerRef, onMenuStateChange]);

    const closeMenu = useCallback(() => {
        setMenuVisible(false);
        setCurrentSubmenu(null);
        
        // Clear menu target position and XR camera cache
        window.menuTargetPosition = null;
        window._xrMenuCameraPos = null;
        
        // Re-enable character controller camera controls
        if (characterControllerRef.current) {
            // Re-enabling character controller camera
            cameraControlsDisabled.current = false;
        }
        
        // Exit pointer lock when closing menu
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        onMenuStateChange(false, null);
    }, [characterControllerRef, onMenuStateChange]);

    // Initialize context system and listen for action registry changes
    useEffect(() => {
        // Initialize default contextual action types
        initializeDefaultContexts();
        
        const updateActions = () => {
            setRegisteredActions(getRegisteredActions());
        };

        // Initial load
        updateActions();

        // Listen for changes
        const unsubscribe = onActionRegistryChange(updateActions);
        
        const handleWorldCursorInteract = (event) => {
            if (typeof window !== 'undefined' && window.worldCursorAPI?.hoveredNPC) {
                return;
            }
            const { position: cursorPosition } = event.detail;
            
            let menuPosition;
            if (cursorPosition && typeof cursorPosition.x === 'number') {
                menuPosition = [cursorPosition.x, cursorPosition.y, cursorPosition.z];
            } else if (Array.isArray(cursorPosition)) {
                menuPosition = [...cursorPosition];
            } else {
                menuPosition = [0, 1.6, 2];
            }
            
            menuPosition[1] += 1.8;
            
            window.menuTargetPosition = menuPosition;
            openMenu(menuPosition);
        };

        const handleXRMenuOpen = (event) => {
            const { position, cameraPosition } = event.detail;
            if (!position) return;
            const menuPos = Array.isArray(position) ? [...position] : [0, 1.6, 2];
            // Don't add Y offset here — the render template already adds +1.2
            window.menuTargetPosition = menuPos;
            // Store XR camera position for menu rotation
            if (cameraPosition) {
                window._xrMenuCameraPos = cameraPosition;
            }
            openMenu(menuPos);
        };

        const handleXRMenuClose = () => {
            closeMenu();
        };

        const handleXRContextAction = (event) => {
            const { context, position } = event.detail;
            if (!context || context.type === 'world') return;
            const menuPos = Array.isArray(position) ? [...position] : [0, 1.6, 2];
            menuPos[1] += 1.8;
            window.menuTargetPosition = menuPos;
            openMenu(menuPos);
        };
        
        window.addEventListener('worldCursorInteract', handleWorldCursorInteract);
        window.addEventListener('xrMenuOpen', handleXRMenuOpen);
        window.addEventListener('xrMenuClose', handleXRMenuClose);
        window.addEventListener('xrContextAction', handleXRContextAction);
        
        return () => {
            unsubscribe();
            window.removeEventListener('worldCursorInteract', handleWorldCursorInteract);
            window.removeEventListener('xrMenuOpen', handleXRMenuOpen);
            window.removeEventListener('xrMenuClose', handleXRMenuClose);
            window.removeEventListener('xrContextAction', handleXRContextAction);
        };
    }, [openMenu, focusedContext, camera]);

    // Handle radial menu actions
    const handleRadialAction = useCallback((actionId, position) => {
        if (focusedContext && focusedContext.type !== 'world') {
            const contextAction = focusedContext.actions.find(a => a.id === actionId);
            if (contextAction) {
                try {
                    executeContextAction(actionId, focusedContext);
                    closeMenu();
                    return;
                } catch (error) {
                    closeMenu();
                    return;
                }
            }
        }
        
        // Handle core system actions
        if (actionId === 'assets') {
            setCurrentSubmenu('assets');
            return;
        }
        
        // Find and execute registered action
        const action = registeredActions.find(a => a.id === actionId);
        if (action && action.onExecute) {
            try {
                action.onExecute(position);
                // Some actions might want to stay in menu, others might want to close
                if (action.closeMenuAfter !== false) {
                    closeMenu();
                }
            } catch (error) {
                console.error('Error executing action:', actionId, error);
                closeMenu();
            }
        } else {
            closeMenu();
        }
    }, [focusedContext, registeredActions, closeMenu]);

    // Handle asset selection and placement
    const handleAssetSelect = useCallback(async (asset, position) => {
        try {
            const loader = new GLTFLoader();
            
            loader.load(
                asset.file_url,
                (gltf) => {
                    const model = gltf.scene;
                    model.position.set(position[0], position[1], position[2]);
                    const scale = 1.0;
                    model.scale.setScalar(scale);
                    scene.add(model);
                    
                    window.dispatchEvent(new CustomEvent('assetPlaced', {
                        detail: {
                            asset,
                            model,
                            position: new Vector3(...position)
                        }
                    }));
                },
                undefined,
                (error) => {}
            );
        } catch (error) {}
        
        closeMenu();
    }, [scene, closeMenu]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.code === 'KeyE' && cursorVisible && !menuVisible) {
                // Menu disabled: don't even preventDefault, so E stays fully
                // available for object/vehicle interactions.
                if (!WORLD_ACTION_MENU_ENABLED) {
                    return;
                }
                // Don't open the world-action menu when E is being used for an
                // NPC chat or a vehicle mount/dismount.
                if (typeof window !== 'undefined' && window.worldCursorAPI?.hoveredNPC) {
                    return;
                }
                if (typeof window !== 'undefined' && window.worldCursorAPI?.hoveredRideable) {
                    return;
                }
                // A plugin interactable is in range — E collects it, don't open
                // the world-action menu (InteractableBanner handles the press).
                if (typeof window !== 'undefined' && window.worldCursorAPI?.hoveredInteractable) {
                    return;
                }
                if (useRideStore.getState().isMounted) {
                    return;
                }
                event.preventDefault();
                
                const pos = useCursorStore.getState().position;
                const menuPos = [pos.x, pos.y + 1.8, pos.z];
                
                openMenu(menuPos);
            } else if (event.code === 'Escape' && menuVisible) {
                event.preventDefault();
                closeMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [cursorVisible, menuVisible, openMenu, closeMenu]);

    // Note: Character movement and camera control is now handled via Ecctrl props

    return (
        <>
            {/* Demo action registration - remove in production */}
            {/* <RadialMenuDemo /> */}
            
            {/* Radial Menu positioned at cursor location */}
            {menuVisible && !currentSubmenu && (() => {
                const isXR = gl?.xr?.isPresenting;
                let camPos;
                if (isXR && window._xrMenuCameraPos) {
                    camPos = { x: window._xrMenuCameraPos[0], y: window._xrMenuCameraPos[1], z: window._xrMenuCameraPos[2] };
                } else {
                    camPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
                }
                const yOffset = isXR ? 0 : 0.5;
                const menuScale = isXR ? 1.0 : 0.5;
                return (
                <group 
                    position={[menuPosition[0], menuPosition[1] + yOffset, menuPosition[2]]}
                    rotation={[0, Math.atan2(
                        camPos.x - menuPosition[0],
                        camPos.z - menuPosition[2]
                    ), 0]}
                    scale={menuScale}
                >
                    {/* Black circle background behind the UI */}
                    <mesh position={[0, 0, -0.01]}>
                        <circleGeometry args={[2.2, 64]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0.85} />
                    </mesh>
                    {/* White border ring */}
                    <mesh position={[0, 0, -0.005]}>
                        <ringGeometry args={[2.15, 2.25, 64]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
                    </mesh>
                    
                    {/* Renderer-agnostic text (CanvasTextMesh) — works on WebGL + WebGPU. */}
                    <CanvasTextMesh
                        text={hoveredActionDisplay
                            ? menuActionsRef.current.find(a => a.id === hoveredActionDisplay)?.label || ''
                            : (focusedContext?.type && focusedContext.type !== 'world'
                                ? focusedContext.type.charAt(0).toUpperCase() + focusedContext.type.slice(1)
                                : 'Actions'
                            )
                        }
                        worldWidth={2.4}
                        worldFontSize={0.28}
                        fontWeight="700"
                        color="#ffffff"
                        align="center"
                        position={[0, 0.2, 0.05]}
                    />
                    {hoveredActionDisplay && (
                        <CanvasTextMesh
                            text={menuActionsRef.current.find(a => a.id === hoveredActionDisplay)?.description || ''}
                            worldWidth={1.6}
                            worldFontSize={0.11}
                            color="#cccccc"
                            align="center"
                            position={[0, -0.2, 0.02]}
                        />
                    )}
                    
                    <Root 
                        sizeX={4.4}
                        sizeY={4.4}
                        pixelSize={0.01}
                        anchorX="center" 
                        anchorY="center"
                    >
                            <RadialMenu
                                visible={true}
                                position={menuPosition}
                                onClose={closeMenu}
                                onAction={handleRadialAction}
                                characterControllerRef={characterControllerRef}
                                registeredActions={focusedContext && focusedContext.type !== 'world' ? [] : registeredActions}
                                contextualActions={focusedContext && focusedContext.type !== 'world' ? focusedContext.actions : []}
                                contextType={focusedContext?.type}
                                onHoverChange={handleHoverChange}
                                onActionsReady={handleActionsReady}
                            />
                    </Root>
                </group>
                );
            })()}
            
            {/* Asset Browser - shown when assets submenu is active */}
            {menuVisible && currentSubmenu === 'assets' && (
                <group 
                    position={[menuPosition[0], menuPosition[1] + 0.5, menuPosition[2]]}
                    rotation={[0, Math.atan2(
                        camera.position.x - menuPosition[0],
                        camera.position.z - menuPosition[2]
                    ), 0]}
                    scale={0.5}
                >
                    {/* Rounded rectangle background */}
                    <mesh position={[0, 0, -0.01]}>
                        <planeGeometry args={[3.5, 4]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0.9} />
                    </mesh>
                    {/* Border */}
                    <mesh position={[0, 0, -0.005]}>
                        <planeGeometry args={[3.6, 4.1]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
                    </mesh>
                    <Root 
                        sizeX={3.5} 
                        sizeY={4} 
                        pixelSize={0.01} 
                        anchorX="center" 
                        anchorY="center"
                    >
                            <AssetBrowser3D
                                visible={true}
                                position={[0, 0, 0]}
                                onClose={closeMenu}
                                onAssetSelect={handleAssetSelect}
                            />
                    </Root>
                </group>
            )}

            {/* Primitive Generator Action Registration - handles its own positioning */}
            <PrimitiveGeneratorAction />

            {/* Future submenus can be added here */}
            {currentSubmenu === 'generate' && (
                null
            )}

            {currentSubmenu === 'settings' && (
                null
            )}
        </>
    );
}
