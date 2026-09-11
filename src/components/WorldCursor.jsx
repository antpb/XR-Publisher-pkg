import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
    Vector3, 
    Raycaster, 
    Group, 
    CircleGeometry, 
    MeshBasicMaterial, 
    Mesh, 
    Color, 
    DoubleSide,
    Box3,
    Sphere
} from 'three';
import InteractionMenuSystem from './InteractionMenuSystem';
import { detectObjectContext } from './ContextualActionSystem';
import { useCursorStore } from '../stores/cursorStore';
import useRideStore from '../stores/rideStore';
import { getDialog, getDialogButtonMeshes, activateDialogButtonMesh } from '../decorations/pluginDialog';

const _selOrigin = new Vector3();
const _selDir = new Vector3();

const _cameraPosition = new Vector3();
const _cameraDirection = new Vector3();
const _cameraUp = new Vector3();
const _cameraRight = new Vector3();
const _shoulderOffsetVec = new Vector3();
const _raycastOrigin = new Vector3();
const _playerPosition = new Vector3();
const _npcBox = new Box3();
const _npcCenter = new Vector3();
const _npcSize = new Vector3();
const _toNPC = new Vector3();
const _closestPoint = new Vector3();
const _visualPos = new Vector3();
const _lookTarget = new Vector3();
const _defaultPos = new Vector3();
const _targetSphere = new Sphere();
const _rayCandidates = [];

export default function WorldCursor({
    characterControllerRef,
    isMovingRef = null,
    enabled = true,
    maxDistance = 10,
    defaultDistance = 5,
    thirdPerson = true,
    showDebug = false,
    onInteract = null,
    shoulderOffset = { forward: 1.5, right: 0.3, up: 0.1 },
    visual = {
        color: 0x4285f4,
        size: { inner: 0.08, outer: 0.12, glow: 0.18 },
        opacity: { ring: 0.8, dot: 0.9, glow: 0.3 },
        animation: {
            pulseSpeed: 6,
            breathSpeed: 2,
            rotationSpeed: 0.5
        }
    },
    onMenuStateChange = () => {}
}) {
    const { scene, camera, gl } = useThree();
    const worldCursorRef = useRef(null);
    const cursorRaycaster = useRef(new Raycaster());

    const cursorPositionRef = useRef(new Vector3());
    const cursorNormalRef = useRef(new Vector3(0, 1, 0));
    const cursorVisibleRef = useRef(false);
    const focusedContextRef = useRef(null);
    const lastStoreUpdateRef = useRef(0);

    // Cached scene-scan results. A full scene.traverse with per-NPC
    // Box3.setFromObject (itself a subtree scan) plus a whole-scene
    // intersectObjects every frame was one of the largest main-thread
    // costs in the idle-fly trace. The scan now runs at ~4Hz and the
    // per-frame work raycasts only the pre-filtered target list.
    const sceneScanRef = useRef({ lastScan: -1, npcs: [], targets: [], rideables: [] });
    const lastDetectRef = useRef(-1);
    const SCENE_SCAN_INTERVAL = 0.25;
    const DETECT_INTERVAL = 1 / 30;
    
    const batchUpdate = useCursorStore((state) => state.batchUpdate);
    const setHoveredNPC = useCursorStore((state) => state.setHoveredNPC);
    
    const createWorldCursor = () => {
        const group = new Group();
        
        const dotGeometry = new CircleGeometry(visual.size.inner * 0.5, 8);
        dotGeometry.rotateX(-Math.PI / 2);
        const dotMaterial = new MeshBasicMaterial({
            color: new Color(visual.color),
            opacity: visual.opacity.dot,
            side: DoubleSide,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -2
        });
        const dot = new Mesh(dotGeometry, dotMaterial);
        
        group.add(dot);
        group.visible = false;
        group.userData = { dot };
        
        return group;
    };
    
    useEffect(() => {
        if (enabled && !worldCursorRef.current) {
            worldCursorRef.current = createWorldCursor();
            scene.add(worldCursorRef.current);
            
            if (typeof window !== 'undefined') {
                window.worldCursorAPI = {
                    getState: () => ({
                        position: cursorPositionRef.current.clone(),
                        normal: cursorNormalRef.current.clone(),
                        visible: cursorVisibleRef.current,
                        enabled: enabled,
                        hoveredNPC: null,
                        hoveredRideable: null
                    }),
                    setEnabled: (newEnabled) => {
                        if (worldCursorRef.current) {
                            worldCursorRef.current.visible = newEnabled && cursorVisibleRef.current;
                        }
                    }
                };
            }
        }
        
        return () => {
            if (worldCursorRef.current) {
                scene.remove(worldCursorRef.current);
                worldCursorRef.current = null;
            }
            if (typeof window !== 'undefined') {
                delete window.worldCursorAPI;
            }
        };
    }, [enabled, scene]);
    
    useFrame((state, delta) => {
        if (!enabled || !worldCursorRef.current || !characterControllerRef?.current) {
            return;
        }

        // Detection at 30Hz — the cursor is a soft UI affordance, and the
        // raycast + NPC math was per-frame main-thread cost. Time-based, not
        // frame-parity: every-other-frame on a 120Hz ProMotion display was
        // still 60 raycasts/sec, double the intended rate.
        // (-2ms tolerance so 60Hz displays land on every 2nd frame instead of
        // occasionally slipping to every 3rd on float jitter.)
        const elapsed = state.clock.elapsedTime;
        if (elapsed - lastDetectRef.current < DETECT_INTERVAL - 0.002) return;
        lastDetectRef.current = elapsed;

        camera.getWorldPosition(_cameraPosition);
        camera.getWorldDirection(_cameraDirection);
        
        _cameraUp.set(0, 1, 0);
        _cameraRight.crossVectors(_cameraDirection, _cameraUp).normalize();
        
        _shoulderOffsetVec.set(0, 0, 0);
        _shoulderOffsetVec.addScaledVector(_cameraDirection, shoulderOffset.forward);
        _shoulderOffsetVec.addScaledVector(_cameraRight, shoulderOffset.right);
        _shoulderOffsetVec.addScaledVector(_cameraUp, shoulderOffset.up);
        
        _raycastOrigin.copy(_cameraPosition).add(_shoulderOffsetVec);
        
        try {
            if (characterControllerRef.current.translation) {
                const translation = characterControllerRef.current.translation();
                _playerPosition.set(translation.x, translation.y, translation.z);
            } else if (characterControllerRef.current.position) {
                _playerPosition.copy(characterControllerRef.current.position);
            } else {
                const participantObject = scene.getObjectByName("playerOne");
                if (participantObject) {
                    participantObject.getWorldPosition(_playerPosition);
                } else {
                    cursorVisibleRef.current = false;
                    worldCursorRef.current.visible = false;
                    return;
                }
            }
        } catch (error) {
            cursorVisibleRef.current = false;
            worldCursorRef.current.visible = false;
            return;
        }
        
        cursorRaycaster.current.set(_raycastOrigin, _cameraDirection);
        cursorRaycaster.current.near = 0.1;
        cursorRaycaster.current.far = maxDistance;

        // Refresh the cached NPC boxes + raycast target list at ~4Hz.
        // NPC detection uses a ≥8-unit radius, so quarter-second-stale
        // bounding boxes are well within tolerance.
        const scan = sceneScanRef.current;
        if (elapsed - scan.lastScan >= SCENE_SCAN_INTERVAL || scan.lastScan < 0) {
            scan.lastScan = elapsed;
            scan.npcs.length = 0;
            scan.targets.length = 0;
            scan.rideables.length = 0;
            scene.traverse((obj) => {
                const excluded = obj.userData?.camExcludeCollision || obj.parent?.userData?.camExcludeCollision;

                // Rideable vehicles — group nodes carry rideableId userData.
                if (obj.userData?.rideableId) {
                    _npcBox.setFromObject(obj);
                    _npcBox.getCenter(_npcCenter);
                    _npcBox.getSize(_npcSize);
                    scan.rideables.push({
                        object: obj,
                        centerX: _npcCenter.x, centerY: _npcCenter.y, centerZ: _npcCenter.z,
                        sizeX: _npcSize.x, sizeY: _npcSize.y, sizeZ: _npcSize.z,
                        rideableId: obj.userData.rideableId,
                        rideableName: obj.userData?.rideableName || 'Vehicle',
                    });
                    return;
                }
                const isNPC = obj.userData?.camExcludeCollision && (
                    obj.userData?.npcId ||
                    obj.parent?.userData?.npcId ||
                    obj.name.includes('NPC') ||
                    obj.name.includes('npc') ||
                    obj.parent?.name?.includes('NPC') ||
                    obj.parent?.name?.includes('npc')
                );

                if (isNPC) {
                    _npcBox.setFromObject(obj);
                    _npcBox.getCenter(_npcCenter);
                    _npcBox.getSize(_npcSize);
                    scan.npcs.push({
                        object: obj,
                        centerX: _npcCenter.x, centerY: _npcCenter.y, centerZ: _npcCenter.z,
                        sizeX: _npcSize.x, sizeY: _npcSize.y, sizeZ: _npcSize.z,
                        npcId: obj.userData?.npcId || obj.parent?.userData?.npcId || obj.name || obj.parent?.name || 'npc-1',
                        npcName: obj.userData?.npcName || obj.parent?.userData?.npcName || 'NPC',
                    });
                    return;
                }

                // Curated raycast targets: visible plain meshes that pass
                // the filters the old code applied per-intersection.
                if (!obj.isMesh || obj.isSkinnedMesh || excluded || obj === worldCursorRef.current) return;
                const name = obj.name || '';
                const parentName = obj.parent?.name || '';
                if (name.includes('NPC') || name.includes('npc') ||
                    name.includes('Avatar') || name.includes('Player') ||
                    name.includes('Character') || name.includes('VRM') ||
                    name === 'playerOne' || name === 'playerOneSprite' ||
                    parentName.includes('NPC') || parentName.includes('npc') ||
                    parentName.includes('Avatar') || parentName.includes('Player') ||
                    parentName.includes('Character') || parentName.includes('VRM')) return;
                scan.targets.push(obj);
            });
        }

        let npcInPath = null;
        let npcDistance = Infinity;

        for (let i = 0; i < scan.npcs.length; i++) {
            const npc = scan.npcs[i];
            _npcCenter.set(npc.centerX, npc.centerY, npc.centerZ);
            _toNPC.subVectors(_npcCenter, _raycastOrigin);
            const projectionLength = _toNPC.dot(_cameraDirection);

            if (projectionLength <= 0 || projectionLength >= maxDistance) continue;

            _closestPoint.copy(_raycastOrigin).addScaledVector(_cameraDirection, projectionLength);
            const distanceToNPC = _closestPoint.distanceTo(_npcCenter);

            const npcRadius = Math.max(npc.sizeX, npc.sizeZ) / 2;
            const detectionRadius = Math.max(npcRadius + 10, 8);

            if (distanceToNPC < detectionRadius && projectionLength < npcDistance) {
                npcInPath = {
                    object: npc.object,
                    centerX: npc.centerX,
                    centerY: npc.centerY,
                    centerZ: npc.centerZ,
                    sizeY: npc.sizeY,
                    distance: projectionLength,
                    hitPointX: _closestPoint.x,
                    hitPointY: _closestPoint.y,
                    hitPointZ: _closestPoint.z,
                    npcId: npc.npcId,
                    npcName: npc.npcName
                };
                npcDistance = projectionLength;
            }
        }

        // Rideable hover is PROXIMITY-based, not aim-based: you board a vehicle
        // by walking up to it (works the same on desktop and mobile, where
        // precise aiming is hard). Pick the nearest vehicle within boarding
        // range of the player. Published on its own `hoveredRideable` channel.
        let rideableInPath = null;
        let rideableDistance = Infinity;
        for (let i = 0; i < scan.rideables.length; i++) {
            const r = scan.rideables[i];
            _npcCenter.set(r.centerX, r.centerY, r.centerZ);
            const distToPlayer = _npcCenter.distanceTo(_playerPosition);
            const radius = Math.max(r.sizeX, r.sizeZ) / 2;
            const boardRadius = radius + 6;
            if (distToPlayer < boardRadius && distToPlayer < rideableDistance) {
                rideableInPath = r;
                rideableDistance = distToPlayer;
            }
        }
        if (typeof window !== 'undefined' && window.worldCursorAPI) {
            window.worldCursorAPI.hoveredRideable = rideableInPath
                ? { id: rideableInPath.rideableId, name: rideableInPath.rideableName, distance: rideableDistance }
                : null;
        }

        // Range prefilter: three's Mesh.raycast tests the bounding sphere
        // against the INFINITE ray (ignoring raycaster.far), so every terrain
        // chunk / mountain mesh along the view direction passed the sphere
        // test and got a full per-triangle scan (merged chunk meshes are
        // 10-80k tris). Only keep targets whose world bounding sphere is
        // within maxDistance of the ray origin. InstancedMesh is kept as-is —
        // its geometry sphere doesn't cover instance placements.
        _rayCandidates.length = 0;
        for (let i = 0; i < scan.targets.length; i++) {
            const obj = scan.targets[i];
            const geom = obj.geometry;
            if (geom && !obj.isInstancedMesh) {
                if (geom.boundingSphere === null) geom.computeBoundingSphere();
                if (geom.boundingSphere !== null) {
                    _targetSphere.copy(geom.boundingSphere).applyMatrix4(obj.matrixWorld);
                    if (_targetSphere.distanceToPoint(_raycastOrigin) > maxDistance) continue;
                }
            }
            _rayCandidates.push(obj);
        }
        const intersects = cursorRaycaster.current.intersectObjects(_rayCandidates, false);
        _rayCandidates.length = 0;

        let firstValidHit = null;
        for (let i = 0; i < intersects.length; i++) {
            const intersect = intersects[i];
            const obj = intersect.object;

            const name = obj.name || '';
            const isEnvironmentObject = (
                name.includes('terrain') ||
                name.includes('ground') ||
                name.includes('floor') ||
                name.includes('environment') ||
                obj.material?.name?.includes('ground') ||
                obj.material?.name?.includes('floor') ||
                obj.userData?.interactable ||
                obj.type === 'Mesh'
            );

            if (!isEnvironmentObject) continue;

            const distToPlayer = intersect.point.distanceTo(_playerPosition);
            if (distToPlayer <= maxDistance) {
                firstValidHit = intersect;
                break;
            }
        }
        
        if (npcInPath) {
            _npcCenter.set(npcInPath.centerX, npcInPath.centerY, npcInPath.centerZ);
            const distanceToPlayer = _npcCenter.distanceTo(_playerPosition);
            if (distanceToPlayer <= maxDistance) {
                _closestPoint.set(npcInPath.hitPointX, npcInPath.hitPointY, npcInPath.hitPointZ);
                const context = detectObjectContext(npcInPath.object, _closestPoint);
                focusedContextRef.current = context;
                
                _visualPos.set(npcInPath.centerX, npcInPath.centerY + npcInPath.sizeY / 2 + 0.5, npcInPath.centerZ);
                
                cursorPositionRef.current.copy(_closestPoint);
                cursorNormalRef.current.set(0, 1, 0);
                cursorVisibleRef.current = true;
                
                worldCursorRef.current.position.copy(_visualPos);
                _lookTarget.copy(_visualPos);
                _lookTarget.y += 1;
                worldCursorRef.current.lookAt(_lookTarget);
                worldCursorRef.current.visible = true;
                
                if (typeof window !== 'undefined' && window.worldCursorAPI) {
                    window.worldCursorAPI.hoveredNPC = {
                        id: npcInPath.npcId,
                        name: npcInPath.npcName,
                        position: [npcInPath.centerX, npcInPath.centerY, npcInPath.centerZ],
                        distance: npcInPath.distance
                    };
                }
            }
        } else if (firstValidHit) {
            if (typeof window !== 'undefined' && window.worldCursorAPI) {
                window.worldCursorAPI.hoveredNPC = null;
            }
            
            const context = detectObjectContext(firstValidHit.object, firstValidHit.point);
            focusedContextRef.current = context;
            
            cursorPositionRef.current.copy(firstValidHit.point);
            if (firstValidHit.face) {
                cursorNormalRef.current.copy(firstValidHit.face.normal);
            } else {
                cursorNormalRef.current.set(0, 1, 0);
            }
            cursorVisibleRef.current = true;
            
            worldCursorRef.current.position.copy(firstValidHit.point);
            if (firstValidHit.face && firstValidHit.face.normal) {
                _lookTarget.copy(firstValidHit.point).add(firstValidHit.face.normal);
                worldCursorRef.current.lookAt(_lookTarget);
            }
            worldCursorRef.current.visible = true;
            
        } else if (thirdPerson) {
            if (typeof window !== 'undefined' && window.worldCursorAPI) {
                window.worldCursorAPI.hoveredNPC = null;
            }
            
            _defaultPos.copy(_raycastOrigin).addScaledVector(_cameraDirection, defaultDistance);
            
            const distanceToPlayer = _defaultPos.distanceTo(_playerPosition);
            
            if (distanceToPlayer <= maxDistance) {
                cursorPositionRef.current.copy(_defaultPos);
                cursorNormalRef.current.set(0, 1, 0);
                cursorVisibleRef.current = true;
                
                worldCursorRef.current.position.copy(_defaultPos);
                _lookTarget.copy(_defaultPos);
                _lookTarget.y += 1;
                worldCursorRef.current.lookAt(_lookTarget);
                worldCursorRef.current.visible = true;
            } else {
                cursorVisibleRef.current = false;
                worldCursorRef.current.visible = false;
            }
        } else {
            focusedContextRef.current = null;
            cursorVisibleRef.current = false;
            worldCursorRef.current.visible = false;
            
            if (typeof window !== 'undefined' && window.worldCursorAPI) {
                window.worldCursorAPI.hoveredNPC = null;
            }
        }
        
        // Hide cursor visual while moving (but keep tracking position)
        if (isMovingRef?.current && worldCursorRef.current) {
            worldCursorRef.current.visible = false;
        }
        
        const now = state.clock.elapsedTime;
        if (now - lastStoreUpdateRef.current > 0.1) {
            lastStoreUpdateRef.current = now;
            batchUpdate(
                cursorPositionRef.current,
                cursorNormalRef.current,
                cursorVisibleRef.current,
                focusedContextRef.current
            );
        }
    });
    
    useEffect(() => {
        const triggerInteraction = () => {
            // E is reserved for vehicle mount/dismount when riding or hovering a
            // rideable — don't also open the world-cursor interaction menu.
            if (useRideStore.getState().isMounted) return;
            if (typeof window !== 'undefined' && window.worldCursorAPI?.hoveredRideable) return;
            if (cursorVisibleRef.current && enabled) {
                window.primitiveGeneratorTarget = {
                    position: cursorPositionRef.current.clone(),
                    normal: cursorNormalRef.current.clone(),
                    timestamp: Date.now()
                };
                
                if (onInteract) {
                    onInteract({
                        position: cursorPositionRef.current.clone(),
                        normal: cursorNormalRef.current.clone(),
                        timestamp: Date.now()
                    });
                }
            }
        };

        // Select an in-world dialog button from a click/tap, while a dialog is
        // open. Ray source:
        //  - pointer LOCKED (desktop gameplay) → camera-centre = the reticle, so
        //    aim with mouse-look and click.
        //  - UNLOCKED (mobile touch tap, or free desktop cursor) → the actual
        //    tap/cursor position, so a touch that lands ON a button fires THAT
        //    button (doesn't depend on R3F's touch pipeline firing onClick).
        // VR uses the controller ray via the button's own R3F onClick. Every
        // path funnels through activateDialogButtonMesh, which dedupes.
        const activateDialogFromEvent = (event) => {
            if (!getDialog()) return false;
            const meshes = getDialogButtonMeshes();
            if (!meshes || meshes.length === 0) return false;
            const ray = cursorRaycaster.current;
            const locked = typeof document !== 'undefined' && !!document.pointerLockElement;
            if (!locked && event && typeof event.clientX === 'number' && gl?.domElement) {
                const rect = gl.domElement.getBoundingClientRect();
                const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                const ny = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                ray.setFromCamera({ x: nx, y: ny }, camera);
            } else {
                camera.getWorldPosition(_selOrigin);
                camera.getWorldDirection(_selDir);
                ray.set(_selOrigin, _selDir);
            }
            ray.near = 0.01;
            ray.far = 50;
            const hits = ray.intersectObjects(meshes, false);
            if (hits.length > 0) return activateDialogButtonMesh(hits[0].object);
            return false;
        };

        const handleKeyDown = (event) => {
            if (event.code === 'KeyE') {
                triggerInteraction();
            }
        };

        const handleMobileInteract = () => {
            if (activateDialogFromEvent(null)) return;
            triggerInteraction();
        };

        // Literal mouse/trackpad click AND touch tap (a tap fires 'click' with
        // the tap coordinates) → select the dialog button it lands on / aims at.
        const handleClick = (event) => {
            activateDialogFromEvent(event);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('click', handleClick);
        window.addEventListener('mobileInteract', handleMobileInteract);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('mobileInteract', handleMobileInteract);
        };
    }, [enabled, onInteract]);
    
    return (
        <InteractionMenuSystem
            characterControllerRef={characterControllerRef}
            onMenuStateChange={onMenuStateChange}
        />
    );
}
