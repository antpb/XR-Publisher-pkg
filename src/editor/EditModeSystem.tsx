/**
 * EditModeSystem — the 3D half of the in-world editor. Mounted once in each
 * of EnvironmentFront's two FrontPluginProvider branches; inert (no
 * listeners, no per-frame work) until an edit session activates.
 *
 *  - click a block → select (raycast over the registered wrapper groups)
 *  - TransformControls gizmo on the selection (translate/rotate/scale mode
 *    from the session store, driven by the EditorShell toolbar) — the gizmo
 *    manipulates the PIVOT-ANCHORED wrapper, and mouse-up commits the
 *    transform to shadow-document attributes through the history stack
 *    (fast path: no component remount)
 *  - BoxHelper highlight tracks the selection
 *
 * Pointer lock is suppressed while editing (EnvironmentFront checks
 * `window.__xrEditActive`), so the cursor is free.
 */

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { useThree, useFrame, createPortal } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { BoxHelper, Raycaster, Vector2, Vector3, type Object3D } from 'three';
import {
	subscribeEditSession,
	getEditVersion,
	isEditActive,
	getEntries,
	getSelectedEntry,
	getSelectedKey,
	findEntryForObject,
	commitWrapperTransform,
	getGizmoMode,
	select,
	setSpawnPoser,
	getSubSelection,
	selectSub,
	findSubForObject,
	getSubGroup,
	getWaypoints,
	commitSubTransform,
	subKeyFor,
} from './editSession';
import { WaypointRail } from './WaypointRail';

const _ndc = new Vector2();
const _fwd = new Vector3();

export function EditModeSystem(): React.JSX.Element | null {
	const { gl, camera, scene } = useThree();
	useSyncExternalStore(subscribeEditSession, getEditVersion);
	const active = isEditActive();
	const selected = getSelectedEntry();
	const selectedKey = getSelectedKey();
	const gizmoMode = getGizmoMode();

	const raycasterRef = useRef<Raycaster | null>(null);
	const helperRef = useRef<BoxHelper | null>(null);
	// drei's TransformControls ref exposes the three.js controls instance.
	const tcRef = useRef<{ axis: string | null; dragging: boolean } | null>(null);

	// Placement pose for newly added blocks: ~5m ahead, ground-snapped.
	useEffect(() => {
		setSpawnPoser(() => {
			_fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
			const x = camera.position.x + _fwd.x * 5;
			const z = camera.position.z + _fwd.z * 5;
			const ground = (window as unknown as {
				__xrGetGroundHeight?: (x: number, z: number) => number | null;
			}).__xrGetGroundHeight?.(x, z);
			const y = typeof ground === 'number' ? ground : Math.max(camera.position.y - 1.5, 0);
			return { position: [x, y, z] as [number, number, number] };
		});
		return () => setSpawnPoser(null);
	}, [camera]);

	// Click-to-select — attached only while editing. Picking happens on
	// POINTER-UP, and only when the pointer barely moved since pointer-down:
	// editors constantly drag the camera to reposition their view, and a drag
	// that starts on empty sky (or across an object) must NOT change the
	// selection. Only a genuine click picks or deselects.
	useEffect(() => {
		if (!active) return undefined;
		const canvas = gl.domElement as HTMLCanvasElement;
		if (!raycasterRef.current) raycasterRef.current = new Raycaster();
		const raycaster = raycasterRef.current;

		const CLICK_SLOP_PX = 5;
		let downAt: { x: number; y: number } | null = null;

		const onPointerDown = (e: PointerEvent): void => {
			if (e.button !== 0) return;
			// Pointer over a gizmo handle → TransformControls owns this drag.
			if (tcRef.current?.axis) return;
			downAt = { x: e.clientX, y: e.clientY };
		};

		const onPointerUp = (e: PointerEvent): void => {
			if (e.button !== 0 || !downAt) return;
			const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
			downAt = null;
			// Camera drag, not a click — leave the selection alone.
			if (moved > CLICK_SLOP_PX) return;
			// A gizmo drag that ended on this pointer-up isn't a pick either.
			if (tcRef.current?.axis || tcRef.current?.dragging) return;

			const rect = canvas.getBoundingClientRect();
			_ndc.set(
				((e.clientX - rect.left) / rect.width) * 2 - 1,
				-(((e.clientY - rect.top) / rect.height) * 2 - 1),
			);
			raycaster.setFromCamera(_ndc, camera);

			// Sub-object ghosts first (waypoint spheres of the selected rideable)
			// — they're small and often float inside/near the vehicle mesh, so
			// they'd lose a same-list raycast to the model's hull.
			const cur = getSelectedEntry();
			if (cur?.tag === 'three-rideable-block') {
				const ghostGroups: Object3D[] = [];
				const count = getWaypoints(cur.key).length;
				for (let i = 0; i < count; i++) {
					const g = getSubGroup({ entryKey: cur.key, kind: 'waypoint', index: i });
					if (g) ghostGroups.push(g);
				}
				if (ghostGroups.length > 0) {
					const ghostHits = raycaster.intersectObjects(ghostGroups, true);
					for (const hit of ghostHits) {
						const sub = findSubForObject(hit.object);
						if (sub) {
							selectSub(sub);
							return;
						}
					}
				}
			}

			const groups: Object3D[] = [];
			for (const entry of getEntries().values()) {
				if (entry.group && entry.group.visible) groups.push(entry.group);
			}
			if (groups.length === 0) return;
			const hits = raycaster.intersectObjects(groups, true);
			for (const hit of hits) {
				const entry = findEntryForObject(hit.object);
				if (entry) {
					// Re-clicking the selected block pops a sub-selection back to
					// the block itself (handled inside select()).
					select(entry.key);
					return;
				}
			}
			// Clicked empty world → deselect (matches native editor behavior).
			select(null);
		};

		canvas.addEventListener('pointerdown', onPointerDown);
		canvas.addEventListener('pointerup', onPointerUp);
		return () => {
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointerup', onPointerUp);
		};
	}, [active, gl, camera]);

	// FREEZE THE CAMERA DURING GIZMO DRAGS. Ecctrl (Player.jsx) rotates its
	// camera pivot on `mousemove` whenever the mouse button is down — it can't
	// know the gizmo owns this drag, so moving an object also swung the view.
	// The seam: TransformControls drags via POINTER events; ecctrl listens to
	// the MOUSE/TOUCH compat events the browser fires alongside them. A
	// capture-phase listener on window runs before ecctrl's canvas/document
	// listeners and stops propagation while the gizmo is mid-drag — ecctrl
	// never sees the move, the gizmo (pointermove) is untouched. `dragging`
	// flips synchronously in TC's pointerdown, which fires BEFORE the compat
	// mousedown, so even the first move of a drag is covered.
	useEffect(() => {
		if (!active) return undefined;
		const blockWhileGizmoDrags = (e: Event): void => {
			if ((tcRef.current as { dragging?: boolean } | null)?.dragging) {
				e.stopPropagation();
			}
		};
		window.addEventListener('mousemove', blockWhileGizmoDrags, true);
		window.addEventListener('touchmove', blockWhileGizmoDrags, true);
		return () => {
			window.removeEventListener('mousemove', blockWhileGizmoDrags, true);
			window.removeEventListener('touchmove', blockWhileGizmoDrags, true);
		};
	}, [active]);

	// Selection highlight.
	useEffect(() => {
		if (!active || !selected?.group) {
			if (helperRef.current) {
				scene.remove(helperRef.current);
				helperRef.current.dispose();
				helperRef.current = null;
			}
			return undefined;
		}
		const helper = new BoxHelper(selected.group, 0x7c6cff);
		helper.frustumCulled = false;
		scene.add(helper);
		helperRef.current = helper;
		return () => {
			scene.remove(helper);
			helper.dispose();
			if (helperRef.current === helper) helperRef.current = null;
		};
	}, [active, selectedKey, scene, selected?.group]);

	// X-RAY HELPERS vs TERRAIN RENDER BUNDLES: the rail tube/spheres are
	// depthTest:false transparents, but the terrain draws inside WebGPU render
	// bundles whose cached command replay breaks pass order EVEN for
	// depth-disabled transparents — the helpers get painted BEHIND terrain
	// (occluderDepth.ts documents this; the resonance-stage beams hit the
	// same wall). The proven fix is the concert's un-bundle half ONLY: while
	// the rail is visible, flip every `isBundleGroup` to false so terrain
	// renders as ordinary opaque geometry and the helpers layer over it.
	// Streaming chunks mount re-bundled, so the sweep runs per frame (same
	// pattern as renderOccluderDepth); everything re-bundles the moment the
	// rail hides. The expensive FloatType occluder pass is NOT used — that's
	// for "solids still occlude", which editor helpers don't want.
	const unbundledRef = useRef<Set<{ isBundleGroup?: boolean }>>(new Set());
	const railVisibleRef = useRef(false);

	useFrame(() => {
		if (helperRef.current) helperRef.current.update();
		const un = unbundledRef.current;
		if (railVisibleRef.current) {
			scene.traverse((o) => {
				const g = o as unknown as { isBundleGroup?: boolean };
				if (g.isBundleGroup === true) {
					g.isBundleGroup = false;
					un.add(g);
				}
			});
		} else if (un.size) {
			for (const g of un) g.isBundleGroup = true;
			un.clear();
		}
	});

	// Never leave terrain un-bundled if this system unmounts mid-session.
	useEffect(() => () => {
		for (const g of unbundledRef.current) g.isBundleGroup = true;
		unbundledRef.current.clear();
	}, []);

	// Waypoint editing: when the selected block is a rideable, its rail path
	// renders as ghost spheres + a track tube. A valid sub-selection steals
	// the gizmo from the block wrapper (translate only — a waypoint has no
	// rotation/scale to store).
	const isRideable = !!selected && selected.tag === 'three-rideable-block';
	const waypoints = isRideable && selectedKey ? getWaypoints(selectedKey) : [];
	railVisibleRef.current = active && !!selected?.group && isRideable && waypoints.length > 0;

	if (!active || !selected?.group) return null;
	const sub = getSubSelection();
	const validSub = sub && sub.entryKey === selectedKey && sub.index < waypoints.length
		? sub
		: null;
	const subGroup = validSub ? getSubGroup(validSub) : null;
	const gizmoTarget = subGroup ?? selected.group;

	// PORTAL TO SCENE ROOT: this system is mounted inside the environment's
	// transformed subtree. TransformControls positions its gizmo in WORLD
	// coordinates (from the attached object's matrixWorld) — rendered inline
	// it would ALSO inherit the ancestor transforms and draw the gizmo
	// double-offset from the object (the BoxHelper, added straight to the
	// scene, was correct — that asymmetry is the tell for this bug). The
	// waypoint ghosts need the same frame: waypoints are WORLD coords, so at
	// the scene root each ghost's local position IS its waypoint value.
	return createPortal(
		<>
			{isRideable && selectedKey && waypoints.length > 0 && (
				<WaypointRail
					key={selectedKey}
					entryKey={selectedKey}
					waypoints={waypoints}
					selectedIndex={validSub ? validSub.index : null}
				/>
			)}
			<TransformControls
				// Remount per target so the gizmo re-attaches cleanly.
				key={validSub ? subKeyFor(validSub) : selectedKey}
				ref={tcRef as never}
				object={gizmoTarget as never}
				mode={validSub ? 'translate' : gizmoMode}
				size={0.8}
				onMouseUp={() => {
					if (validSub) commitSubTransform(validSub);
					else if (selectedKey) commitWrapperTransform(selectedKey);
				}}
			/>
		</>,
		scene,
	);
}
