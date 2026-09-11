/**
 * WaypointRail — the graphical rail-path editor for train/coaster vehicles.
 * Renders one ghost sphere per waypoint (selectable, movable with the
 * translate gizmo — same pattern as the light/audio EditProxy spheres) and a
 * translucent tube along the SAME open centripetal CatmullRom curve the
 * vehicle actually follows (buildWaypointCurve in vehicleLocomotion.ts), so
 * what you see is exactly the track the ride will take.
 *
 * FRAME: waypoints are WORLD coordinates (the vehicle is a rapier kinematic
 * body; curve points feed setNextKinematicTranslation, which is true world
 * space — NOT the environment-frame coords block position attrs use). This
 * component is therefore rendered through EditModeSystem's portal AT THE
 * SCENE ROOT, where each ghost group's local position IS the waypoint value.
 *
 * LIVE TRACK DURING DRAGS: gizmo drags mutate a ghost group without any
 * React render (commit happens on mouse-up). The tube watches the ghost
 * groups per-frame and rebuilds its geometry only when a position actually
 * moved, so the track bends WITH the drag at zero steady-state cost.
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group, type Mesh } from 'three';
import { getSubGroup, linkSubGroup } from './editSession';

const START_COLOR = '#5cf28e';
const POINT_COLOR = '#5cc8f2';
const SELECTED_COLOR = '#ffb84d';
const TRACK_COLOR = '#7c6cff';

// X-RAY RENDERING (the resonance-stage beam recipe): editor helpers must
// show through terrain/hills or a rail dipping behind a ridge disappears.
// Two halves, BOTH required on WebGPU:
//  1. Material: transparent + depthTest:false + depthWrite:false + a high
//     renderOrder (sort after world transparents like grass fade / water).
//  2. Terrain must be UN-BUNDLED while these helpers show: the WebGPU render
//     bundles' cached replay breaks pass order even for depth-disabled
//     transparents — with bundles on, the helpers paint BEHIND the terrain
//     regardless of flags (occluderDepth.ts documents the mechanism).
//     EditModeSystem flips `isBundleGroup=false` per frame while the rail is
//     visible and restores it when hidden.
// WebGL has no bundles — half 1 alone suffices there.
const XRAY_ORDER_TRACK = 500;
const XRAY_ORDER_GHOST = 501;

function WaypointGhost({
	entryKey,
	index,
	pos,
	isSelected,
}: {
	entryKey: string;
	index: number;
	pos: number[];
	isSelected: boolean;
}): React.JSX.Element {
	const groupRef = useRef<Group>(null);

	useEffect(() => {
		linkSubGroup({ entryKey, kind: 'waypoint', index }, groupRef.current);
		return () => linkSubGroup({ entryKey, kind: 'waypoint', index }, null);
	}, [entryKey, index]);

	// Reset from the committed attr on every render (session notify) — during
	// a drag no render happens, so the gizmo's live position is untouched;
	// after commit/undo this snaps the ghost to the stored value.
	useLayoutEffect(() => {
		groupRef.current?.position.set(pos[0], pos[1], pos[2]);
	});

	const color = isSelected ? SELECTED_COLOR : index === 0 ? START_COLOR : POINT_COLOR;
	const scale = isSelected ? 1.25 : 1;
	return (
		<group ref={groupRef}>
			<mesh renderOrder={XRAY_ORDER_GHOST} scale={scale}>
				<sphereGeometry args={[0.35, 16, 12]} />
				{/* Stock material: works on both renderer paths via extend.ts. */}
				<meshBasicMaterial color={color} transparent opacity={0.45} depthTest={false} depthWrite={false} />
			</mesh>
			<mesh renderOrder={XRAY_ORDER_GHOST} scale={scale}>
				<sphereGeometry args={[0.36, 12, 8]} />
				<meshBasicMaterial color={color} wireframe transparent opacity={0.9} depthTest={false} depthWrite={false} />
			</mesh>
		</group>
	);
}

function RailTrack({ entryKey, count }: { entryKey: string; count: number }): React.JSX.Element {
	const meshRef = useRef<Mesh>(null);
	const lastFlat = useRef<number[]>([]);

	useFrame(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const pts: Vector3[] = [];
		for (let i = 0; i < count; i++) {
			const g = getSubGroup({ entryKey, kind: 'waypoint', index: i });
			if (g) pts.push(g.position);
		}
		if (pts.length < 2) {
			mesh.visible = false;
			return;
		}
		const flat: number[] = [];
		for (const p of pts) flat.push(p.x, p.y, p.z);
		const last = lastFlat.current;
		let changed = flat.length !== last.length;
		if (!changed) {
			for (let i = 0; i < flat.length; i++) {
				if (Math.abs(flat[i] - last[i]) > 1e-4) { changed = true; break; }
			}
		}
		if (!changed) return;
		lastFlat.current = flat;
		// Same curve params as buildWaypointCurve — the preview IS the ride.
		const curve = new CatmullRomCurve3(pts.map((p) => p.clone()), false, 'catmullrom', 0.5);
		const geo = new TubeGeometry(curve, Math.max(count * 12, 48), 0.1, 6, false);
		mesh.geometry.dispose();
		mesh.geometry = geo;
		mesh.visible = true;
	});

	useEffect(() => {
		const mesh = meshRef.current;
		return () => { mesh?.geometry.dispose(); };
	}, []);

	return (
		<mesh ref={meshRef} visible={false} frustumCulled={false} renderOrder={XRAY_ORDER_TRACK}>
			{/* Degenerate placeholder WITH normal/uv attributes — a bare empty
			    BufferGeometry trips "TSL: Vertex attribute 'normal' not found"
			    when the material pipeline compiles. Replaced by the first real
			    TubeGeometry build (which also has both attributes). */}
			<boxGeometry args={[0.0001, 0.0001, 0.0001]} />
			<meshBasicMaterial color={TRACK_COLOR} transparent opacity={0.5} depthTest={false} depthWrite={false} />
		</mesh>
	);
}

/** Mounted (via EditModeSystem's scene-root portal) whenever the selected
 *  block is a rideable with waypoints. Keyed per entry by the caller.
 *
 *  Everything renders under ONE container group, and unmount explicitly
 *  rips that container out of the scene graph: deselecting the vehicle (or
 *  selecting anything else) must NEVER leave stray spheres/track behind —
 *  a single detach point can't half-fail the way per-sibling reconciliation
 *  inside a portal fragment could. */
export function WaypointRail({
	entryKey,
	waypoints,
	selectedIndex,
}: {
	entryKey: string;
	waypoints: number[][];
	selectedIndex: number | null;
}): React.JSX.Element {
	const rootRef = useRef<Group>(null);

	useEffect(() => {
		const root = rootRef.current;
		return () => { root?.removeFromParent(); };
	}, []);

	return (
		<group ref={rootRef}>
			{waypoints.map((p, i) => (
				<WaypointGhost
					key={i}
					entryKey={entryKey}
					index={i}
					pos={p}
					isSelected={selectedIndex === i}
				/>
			))}
			<RailTrack entryKey={entryKey} count={waypoints.length} />
		</group>
	);
}
