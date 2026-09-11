import React, { useSyncExternalStore } from 'react';
import { ModelObject } from './ModelObject';
import type { InstanceData } from './ModelObject.d';
import {
	subscribeWorldModels,
	getWorldModels,
	type WorldModelInstance,
} from './worldObjectRegistry';

/** Normalize a scale (number | [x,y,z] | undefined) / rotation triple. */
function triple(
	v: number | [number, number, number] | undefined,
	d: number,
): [number, number, number] {
	if (Array.isArray(v)) return [v[0] ?? d, v[1] ?? d, v[2] ?? d];
	if (typeof v === 'number') return [v, v, v];
	return [d, d, d];
}

/** Map the friendly instance specs to ModelObject's InstanceData (+ collidable,
 *  which ModelObject reads at runtime even though the typed shape omits it). */
function mapInstances(instances?: WorldModelInstance[]): InstanceData[] | undefined {
	if (!instances || instances.length === 0) return undefined;
	return instances.map((it) => {
		const p = it.position ?? [0, 0, 0];
		const r = triple(it.rotation, 0);
		const s = triple(it.scale, 1);
		return {
			positionX: p[0], positionY: p[1], positionZ: p[2],
			rotationX: r[0], rotationY: r[1], rotationZ: r[2],
			scaleX: s[0], scaleY: s[1], scaleZ: s[2],
			collidable: !!it.collidable,
		} as InstanceData;
	});
}

/**
 * Host for programmatically-injected world models (`XRPublisher.addModel`).
 * Renders one <ModelObject> per registered spec — reusing all of ModelObject's
 * loading, grid instancing, frustum culling, collision, and WebGPU material
 * handling. Mounted once inside <Physics> in EACH EnvironmentFront render branch
 * (WebGPU + WebGL-XR); useSyncExternalStore keeps it live as plugins add/remove
 * models and across the branch swap.
 */
export function InjectedModels({ defaultFont }: { defaultFont: string }) {
	const models = useSyncExternalStore(subscribeWorldModels, getWorldModels, getWorldModels);
	return (
		<>
			{models.map((m) => {
				const pos = triple(m.position, 0);
				const rot = triple(m.rotation, 0);
				const scl = triple(m.scale, 1);
				const instances = mapInstances(m.instances);
				return (
					<ModelObject
						key={m.id}
						url={m.url}
						positionX={pos[0]} positionY={pos[1]} positionZ={pos[2]}
						rotationX={rot[0]} rotationY={rot[1]} rotationZ={rot[2]}
						scaleX={scl[0]} scaleY={scl[1]} scaleZ={scl[2]}
						alt={m.id}
						animations={m.animations}
						collidable={m.collidable ? '1' : undefined}
						threeObjectPluginRoot={''}
						defaultFont={defaultFont}
						instanced={!!instances}
						instances={instances}
					/>
				);
			})}
		</>
	);
}
