/**
 * XRInputBridge — VR input for plugins + the VR "interact" link.
 *
 * Mounted inside the <XR> subtree (WebGL/XR branch only — WebXR doesn't exist
 * on the WebGPU path). Publishes to window globals per frame, matching the
 * established __xrPlayerState / __xrAudioListener pattern:
 *
 *   window.__xrPresenting  — boolean, true while an XR session is live.
 *   window.__xrControllers — { left, right } | null; each side is null or
 *     { position:[x,y,z], quaternion:[x,y,z,w], direction:[x,y,z],
 *       trigger:0..1, squeeze:0..1, hand:boolean }
 *     position/quaternion are WORLD-space (the @react-three/xr state object
 *     lives under XROrigin, so its world matrix already includes locomotion).
 *     `direction` is the -Z aim of the controller. `hand` marks hand-tracking
 *     sources (Vision Pro / Quest hand mode) — their `trigger` is the pinch
 *     (driven by session select events; hands have no gamepad).
 *
 * Read via the public accessors (XRPublisher.isPresenting() /
 * getControllerState(hand)) rather than the raw globals.
 *
 * VR interact: SQUEEZE (grip) fires the active proximity interactable —
 * deliberately NOT select/trigger, which belongs to tools (hold-to-spray) and
 * dialog ray-clicks; a trigger-based interact would toggle equipment every
 * time a tool fires near its own interactable. Suppressed while a dialog is
 * open (same rule as the desktop E key).
 */
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR, useXRInputSourceState } from '@react-three/xr';
import { Vector3, Quaternion } from 'three';
import type * as THREE from 'three';
import { getActiveInteractable, triggerActiveInteractable } from '../decorations/interactionRegistry';
import { getDialog } from '../decorations/pluginDialog';

const _pos = new Vector3();
const _quat = new Quaternion();
const _dir = new Vector3();

interface ControllerRec {
	position: [number, number, number];
	quaternion: [number, number, number, number];
	direction: [number, number, number];
	trigger: number;
	squeeze: number;
	hand: boolean;
}
const makeRec = (): ControllerRec => ({
	position: [0, 0, 0],
	quaternion: [0, 0, 0, 1],
	direction: [0, 0, -1],
	trigger: 0,
	squeeze: 0,
	hand: false,
});

export function XRInputBridge(): null {
	const { session } = useXR();
	const leftController = useXRInputSourceState('controller', 'left');
	const rightController = useXRInputSourceState('controller', 'right');
	const leftHand = useXRInputSourceState('hand', 'left');
	const rightHand = useXRInputSourceState('hand', 'right');
	// Stable published records (mutated in place — no per-frame allocation)
	// and pinch state for hand-tracking sources.
	const recsRef = useRef({ left: makeRec(), right: makeRec() });
	const pinchRef = useRef({ left: 0, right: 0 });

	// Presenting flag + teardown.
	useEffect(() => {
		if (typeof window === 'undefined') return;
		(window as any).__xrPresenting = !!session;
		if (!session) (window as any).__xrControllers = null;
		return () => {
			(window as any).__xrPresenting = false;
			(window as any).__xrControllers = null;
		};
	}, [session]);

	// VR interact (squeeze) + hand-pinch tracking (select on hand sources).
	useEffect(() => {
		if (!session) return;
		const onSqueeze = () => {
			if (getDialog()) return; // dialog owns attention, same as desktop E
			if (getActiveInteractable()) triggerActiveInteractable();
		};
		const setPinch = (ev: XRInputSourceEvent, v: number) => {
			const handedness = ev.inputSource?.handedness;
			if (handedness === 'left' || handedness === 'right') pinchRef.current[handedness] = v;
		};
		const onSelectStart = (ev: XRInputSourceEvent) => setPinch(ev, 1);
		const onSelectEnd = (ev: XRInputSourceEvent) => setPinch(ev, 0);
		session.addEventListener('squeezestart', onSqueeze);
		session.addEventListener('selectstart', onSelectStart);
		session.addEventListener('selectend', onSelectEnd);
		return () => {
			session.removeEventListener('squeezestart', onSqueeze);
			session.removeEventListener('selectstart', onSelectStart);
			session.removeEventListener('selectend', onSelectEnd);
		};
	}, [session]);

	useFrame(() => {
		if (!session || typeof window === 'undefined') return;
		const sides = [
			['left', leftController ?? leftHand],
			['right', rightController ?? rightHand],
		] as const;
		let leftOut: ControllerRec | null = null;
		let rightOut: ControllerRec | null = null;
		for (const [side, cs] of sides) {
			const obj = (cs as { object?: THREE.Object3D } | undefined)?.object;
			if (!cs || !obj) continue;
			obj.getWorldPosition(_pos);
			obj.getWorldQuaternion(_quat);
			_dir.set(0, 0, -1).applyQuaternion(_quat);
			const rec = recsRef.current[side];
			rec.position[0] = _pos.x; rec.position[1] = _pos.y; rec.position[2] = _pos.z;
			rec.quaternion[0] = _quat.x; rec.quaternion[1] = _quat.y;
			rec.quaternion[2] = _quat.z; rec.quaternion[3] = _quat.w;
			rec.direction[0] = _dir.x; rec.direction[1] = _dir.y; rec.direction[2] = _dir.z;
			const isHand = (cs as { type?: string }).type === 'hand'
				|| !!(cs as { inputSource?: XRInputSource }).inputSource?.hand;
			const gp = (cs as { inputSource?: XRInputSource }).inputSource?.gamepad;
			rec.trigger = Math.max(gp?.buttons?.[0]?.value ?? 0, pinchRef.current[side]);
			rec.squeeze = gp?.buttons?.[1]?.value ?? 0;
			rec.hand = isHand;
			if (side === 'left') leftOut = rec; else rightOut = rec;
		}
		(window as any).__xrControllers = { left: leftOut, right: rightOut };
	});

	return null;
}
