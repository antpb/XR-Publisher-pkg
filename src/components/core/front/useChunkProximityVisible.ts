import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Vector3 } from 'three';

/**
 * Per-frame chunk-center proximity gate for decorations (load on approach,
 * unload on departure, with hysteresis to avoid thrash at the boundary).
 *
 * WHY A HOOK INSTEAD OF useMemo: `playerPosition` is a single Vector3 instance
 * that InfiniteTerrain MUTATES IN PLACE every frame (`playerPositionRef.current
 * .set(...)`). Mutating it does NOT re-render React, so a `useMemo` keyed on
 * `playerPosition.x/z` only recomputes when something ELSE re-renders the
 * component — which, for a decoration, only happens when a chunk add/remove
 * changes the chunk list. While the player walks through already-loaded
 * terrain with the stream queue drained, no re-render fires and the gate is
 * frozen at whatever it was when the chunk mounted (far away → invisible).
 * That's the "decorations don't populate until I reach the cell centre" bug:
 * the chunk only flips visible when an unrelated re-render happens to fire.
 *
 * This hook reads the live (mutated) position every frame and flips React
 * state ONLY on a load/unload transition — so a chunk's decorations appear the
 * instant the player crosses its load radius, and the re-render is localised to
 * that one chunk (not the whole terrain tree). The per-frame cost is one
 * distance check per chunk per decoration kind — trivial arithmetic.
 *
 * @param loadMul    show when distance < loadMul * width
 * @param unloadMul  hide when distance > unloadMul * width (unloadMul >= loadMul)
 * @param defaultWhenNoPlayer value before a player position exists (grass wants
 *                            true; ground scatter wants false)
 */
export function useChunkProximityVisible(
  playerPosition: Vector3 | undefined,
  chunkX: number,
  chunkZ: number,
  width: number,
  height: number,
  loadMul: number,
  unloadMul: number,
  defaultWhenNoPlayer = false,
): boolean {
  // Mirrors the old `lastVisibilityRef = useRef(true)`: a freshly-mounted chunk
  // is treated as "was visible", so its first evaluation uses the larger unload
  // radius (decorations bias toward showing rather than popping out).
  const visibleRef = useRef(true);

  const compute = (): boolean => {
    if (!playerPosition) return defaultWhenNoPlayer;
    const cx = chunkX * width + width / 2;
    const cz = chunkZ * height + height / 2;
    const dx = playerPosition.x - cx;
    const dz = playerPosition.z - cz;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const threshold = (visibleRef.current ? unloadMul : loadMul) * width;
    return distance < threshold;
  };

  const [visible, setVisible] = useState<boolean>(() => {
    const v = compute();
    visibleRef.current = v;
    return v;
  });

  useFrame(() => {
    const v = compute();
    if (v !== visibleRef.current) {
      visibleRef.current = v;
      setVisible(v);
    }
  });

  return visible;
}
