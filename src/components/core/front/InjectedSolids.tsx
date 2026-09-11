/**
 * Host for plugin-injected COLLIDABLE objects (`XRPublisher.addSolid`). Mounted
 * once inside `<Physics>` in EACH EnvironmentFront branch (WebGPU + WebGL-XR),
 * beside `InjectedModels`. Each registered Object3D is wrapped in a FIXED
 * RigidBody with auto colliders so the player can stand on / collide with it.
 * Always-on (not altitude-gated like terrain) — a placed stage/ramp should
 * always be solid; keep the object counts low (these cook synchronously).
 */
import React, { useSyncExternalStore } from 'react';
import { RigidBody } from '@react-three/rapier';
import { subscribeSolids, getSolids } from './solidObjectRegistry';

const deg = (d: number): number => (d * Math.PI) / 180;

function triple(v: number | [number, number, number] | undefined, d: number): [number, number, number] {
  if (Array.isArray(v)) return [v[0] ?? d, v[1] ?? d, v[2] ?? d];
  if (typeof v === 'number') return [v, v, v];
  return [d, d, d];
}

export function InjectedSolids(): React.ReactElement {
  const solids = useSyncExternalStore(subscribeSolids, getSolids, getSolids);
  return (
    <>
      {solids.map((s) => {
        const p = triple(s.position, 0);
        const r = triple(s.rotation, 0);
        const sc = triple(s.scale, 1);
        return (
          <RigidBody
            key={s.id}
            type="fixed"
            colliders={s.colliders ?? 'hull'}
            position={[p[0], p[1], p[2]]}
            rotation={[deg(r[0]), deg(r[1]), deg(r[2])]}
          >
            <group scale={[sc[0], sc[1], sc[2]]}>
              <primitive object={s.object} />
            </group>
          </RigidBody>
        );
      })}
    </>
  );
}
