/**
 * Host for `persist: true` decorations (see persistentDecorationRegistry).
 * Mounted once inside the scene in EACH EnvironmentFront branch (WebGPU +
 * WebGL-XR), beside InjectedSolids. Each record is mounted at its world
 * position and survives terrain streaming; a throttled useFrame evicts records
 * once the player leaves their keep-alive radius (reading the same
 * `window.__xrPlayerState` the rest of the engine publishes), and ticks any
 * persistent spec that has an `update` hook.
 *
 * No RigidBody wrapper — persistent decorations are visual/logic structures
 * (course gates, flags, large builds); a persistent COLLIDABLE should be an
 * `XRPublisher.addSolid`.
 */
import React, { useRef, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  subscribePersistentDecorations,
  getPersistentDecorations,
  evictFarPersistentDecorations,
} from './persistentDecorationRegistry';

export function InjectedPersistentDecorations(): React.ReactElement {
  const recs = useSyncExternalStore(
    subscribePersistentDecorations, getPersistentDecorations, getPersistentDecorations,
  );
  const lastCheck = useRef(0);

  useFrame((state, delta) => {
    // Tick any dynamic persistent specs every frame.
    const elapsed = state.clock.elapsedTime;
    for (const r of recs) {
      if (!r.spec.update) continue;
      try { r.spec.update(r.object, delta, elapsed); }
      catch (err) {
        console.warn(`[XRPublisher] persistent decoration "${r.spec.name}" update() threw — disabling`, err);
        (r.spec as { update?: unknown }).update = undefined;
      }
    }
    // Keep-alive eviction, ~4Hz (distance is coarse; per-frame is wasteful).
    if (elapsed - lastCheck.current < 0.25) return;
    lastCheck.current = elapsed;
    const ps = (typeof window !== 'undefined')
      ? (window as unknown as { __xrPlayerState?: { x: number; z: number } }).__xrPlayerState
      : null;
    if (ps) evictFarPersistentDecorations(ps.x, ps.z);
  });

  return (
    <>
      {recs.map((r) => (
        <group key={r.key} position={r.position}>
          <primitive object={r.object} dispose={null} />
        </group>
      ))}
    </>
  );
}
