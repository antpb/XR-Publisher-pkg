/**
 * VRInteractPrompt — the in-world VR replacement for InteractableBanner.
 *
 * The desktop "Press E" banner is a DOM overlay, invisible inside a headset.
 * While an XR session is presenting, this renders a small billboarded panel
 * floating above the ACTIVE interactable's object (the same active entry the
 * banner shows) with the prompt text and the VR binding hint ("grip").
 *
 * Mounted inside the <XR> subtree next to InteractableSystem. Renders nothing
 * when not presenting, when no interactable is active, or while a dialog is
 * open (InteractableSystem already clears the active entry then).
 */
import React, { useRef, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { Group, Vector3 } from 'three';
import {
	subscribeActiveInteractable,
	getActiveInteractable,
	getInteractables,
} from '../decorations/interactionRegistry';
import { CanvasTextMesh } from './core/front/CanvasTextMesh';

const _target = new Vector3();
const _cam = new Vector3();

export function VRInteractPrompt(): React.JSX.Element | null {
	const { session } = useXR();
	const active = useSyncExternalStore(subscribeActiveInteractable, getActiveInteractable);
	const groupRef = useRef<Group>(null);

	useFrame(({ camera }) => {
		const g = groupRef.current;
		if (!g) return;
		const entry = active ? getInteractables().get(active.id) : null;
		if (!entry) { g.visible = false; return; }
		entry.object.getWorldPosition(_target);
		g.position.set(_target.x, _target.y + 2.3, _target.z);
		camera.getWorldPosition(_cam);
		// Yaw-only billboard (matches the dialog's placement behavior).
		g.rotation.set(0, Math.atan2(_cam.x - _target.x, _cam.z - _target.z), 0);
		g.visible = true;
	});

	if (!session || !active) return null;

	return (
		<group ref={groupRef}>
			<mesh renderOrder={19}>
				<planeGeometry args={[Math.min(2.4, 0.3 + active.prompt.length * 0.075), 0.42]} />
				<meshBasicMaterial color="#0f0f14" transparent opacity={0.82} depthWrite={false} />
			</mesh>
			<CanvasTextMesh
				text={`${active.prompt} — grip`}
				worldWidth={2.3}
				worldFontSize={0.13}
				color="#f5f5f7"
				fontWeight="600"
				align="center"
				anchorX="center"
				anchorY="middle"
				position={[0, 0, 0.01]}
				renderOrder={20}
			/>
		</group>
	);
}
