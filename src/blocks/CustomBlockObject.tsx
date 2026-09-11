/**
 * CustomBlockObject — the imperative bridge between a plugin-registered
 * custom block type (customBlockRegistry) and R3F. Returned by the block
 * parsers' 'custom' arm, so it mounts inside EditableBlockHost's pivot
 * wrapper and inherits selection/gizmo/version lifecycle for free.
 *
 * Lifecycle mapping:
 *  - create(ctx)  → one symmetric effect keyed [type, gen] (StrictMode-safe:
 *                   dev double-invoke runs create→dispose→create cleanly).
 *  - update(...)  → effect keyed on the serialized props; `false`/absent/
 *                   throw bumps `gen`, forcing dispose+recreate.
 *  - tick(...)    → one useFrame subscription (no-op without a tick).
 *  - dispose(...) → effect cleanup; default is a deep geometry/material
 *                   dispose unless the spec provides its own.
 *
 * Transform is ENGINE-OWNED: the block's position/rotation/scale attrs are
 * applied by the <group> here (rotation attrs are radians at runtime, same
 * as built-in blocks); the plugin object lives at local origin.
 *
 * Late registration is the mainline path (plugins init after the world
 * scan), so this component subscribes to the registry version and renders
 * nothing until its tag's type exists.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Object3D } from 'three';
import { alea } from 'seedrandom';
import {
	getCustomBlockType,
	getCustomBlocksVersion,
	subscribeCustomBlocks,
	parseCustomProps,
	type CustomBlockCtx,
	type CustomBlockProps,
} from './customBlockRegistry';

function numAttr(el: Element, name: string, dflt: number): number {
	const v = Number(el.getAttribute(name));
	return Number.isFinite(v) ? v : dflt;
}

/** Default cleanup: dispose every geometry + material owned by the object.
 *  Specs sharing module-level resources override with their own dispose. */
function deepDispose(root: Object3D): void {
	root.traverse((node) => {
		const mesh = node as THREE.Mesh;
		if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
			mesh.geometry.dispose();
		}
		const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
		if (Array.isArray(mat)) mat.forEach((m) => m?.dispose?.());
		else mat?.dispose?.();
	});
}

export function CustomBlockObject({
	el,
	index,
}: {
	el: Element;
	index: number;
}): React.JSX.Element | null {
	// Re-render when any type registers/unregisters (late plugins pop in).
	useSyncExternalStore(subscribeCustomBlocks, getCustomBlocksVersion);
	const tag = el.tagName.toLowerCase();
	const type = getCustomBlockType(tag);

	// Parsed every render — the host re-renders exactly on entry version
	// bumps (inspector commits / undo), the same cadence built-ins re-parse.
	const props: CustomBlockProps = type ? parseCustomProps(type.spec, el) : {};
	const propsKey = JSON.stringify(props);

	const seed = `${tag}#${index}`;
	const [obj, setObj] = useState<Object3D | null>(null);
	const [gen, setGen] = useState(0);
	const propsRef = useRef(props);
	propsRef.current = props;
	const prevPropsRef = useRef<CustomBlockProps | null>(null);
	const elapsedRef = useRef(0);

	const makeCtx = (p: CustomBlockProps): CustomBlockCtx => ({
		props: p,
		el,
		THREE,
		isWebGPU: typeof window !== 'undefined'
			&& (window as { __xrWebGPU?: boolean }).__xrWebGPU === true,
		rng: alea(seed),
		seed,
	});

	// Create/dispose — symmetric and idempotent.
	useEffect(() => {
		if (!type) return;
		let created: Object3D | null = null;
		try {
			created = type.spec.create(makeCtx(propsRef.current));
		} catch (e) {
			console.error(`[XRPublisher] custom block ${tag} create() threw`, e);
		}
		if (!created) return;
		prevPropsRef.current = propsRef.current;
		setObj(created);
		return () => {
			try {
				if (type.spec.dispose) type.spec.dispose(created!);
				else deepDispose(created!);
			} catch (e) {
				console.error(`[XRPublisher] custom block ${tag} dispose threw`, e);
			}
			prevPropsRef.current = null;
			setObj(null);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type, gen]);

	// Prop changes → update in place, or recreate when the spec declines.
	useEffect(() => {
		if (!type || !obj) return;
		const prev = prevPropsRef.current;
		if (!prev || JSON.stringify(prev) === propsKey) return;
		let handled: boolean | void = false;
		try {
			handled = type.spec.update
				? type.spec.update(obj, propsRef.current, prev, makeCtx(propsRef.current))
				: false;
		} catch (e) {
			console.error(`[XRPublisher] custom block ${tag} update() threw — recreating`, e);
			handled = false;
		}
		prevPropsRef.current = propsRef.current;
		if (handled === false) setGen((g) => g + 1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [propsKey, type, obj]);

	useFrame((_state, delta) => {
		if (!type?.spec.tick || !obj) return;
		elapsedRef.current += delta;
		try {
			type.spec.tick(obj, delta, elapsedRef.current);
		} catch (e) {
			// Disarm a throwing tick (same containment rule as decorations) —
			// a per-frame throw would spam the console at 60Hz.
			console.error(`[XRPublisher] custom block ${tag} tick() threw — disarmed`, e);
			(type.spec as { tick?: unknown }).tick = undefined;
		}
	});

	if (!type || !obj) return null;
	// Transform read per render, exactly like the built-in parsers — the
	// host re-renders on version bumps, which is when attrs change (gizmo
	// drags move the host wrapper instead and commit without a bump).
	// Rotation attrs are radians at runtime.
	return (
		<group
			position={[numAttr(el, 'positionx', 0), numAttr(el, 'positiony', 0), numAttr(el, 'positionz', 0)]}
			rotation={[numAttr(el, 'rotationx', 0), numAttr(el, 'rotationy', 0), numAttr(el, 'rotationz', 0)]}
			scale={[numAttr(el, 'scalex', 1), numAttr(el, 'scaley', 1), numAttr(el, 'scalez', 1)]}
		>
			<primitive object={obj} />
		</group>
	);
}
