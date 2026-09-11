/**
 * Per-chunk WebGPU render bundle.
 *
 * Three r167+ `BundleGroup` records the WebGPU draw encoding for its
 * descendants once and replays it while `version` is unchanged. On the
 * cached path the renderer skips `RenderObjects.get()` — material/render
 * cache keys, pipeline + binding lookup, and draw re-encode — per object
 * per frame; only `updateForRender` uniform writes still run, so TSL
 * `time`-driven animation keeps working inside a bundle.
 *
 * One BundleGroup per terrain chunk: invalidation maps 1:1 to chunk
 * lifecycle, and a streaming chunk only re-encodes itself.
 *
 * Contract: anything that adds/removes a mesh under the bundle, or swaps
 * a bundled mesh's material/geometry, MUST call `invalidate()` or the
 * change is invisible (stale bundle replays). Decoration components get
 * the bundle via `useChunkBundle()` and mount their *opaque static*
 * meshes into `api.group`; transparent / alpha-tested / material-swapping
 * meshes (grass fade, tree foliage, flower petals) stay outside the
 * bundle in their own groups — transparent draw order inside a bundle is
 * frozen at encode time.
 *
 * This module is WebGPU-path-only (the `*WebGL.tsx` component twins never
 * import it). With a WebGL backend a BundleGroup renders as a plain Group.
 */
import { createContext, useContext, useMemo } from 'react';
import { BundleGroup } from 'three/webgpu';

export interface ChunkBundleApi {
  /** Bundle group that opaque static chunk meshes are parented under. */
  group: BundleGroup;
  /** Re-encode the bundle — call after any mount/unmount/material change inside it. */
  invalidate: () => void;
}

const ChunkBundleContext = createContext<ChunkBundleApi | null>(null);

/** Decoration components read the chunk's bundle (null outside a chunk). */
export function useChunkBundle(): ChunkBundleApi | null {
  return useContext(ChunkBundleContext);
}

export const ChunkBundleProvider = ChunkBundleContext.Provider;

/** Create the per-chunk bundle API (stable for the component's lifetime). */
export function useCreateChunkBundle(): ChunkBundleApi {
  // The selective-occlusion pass hides ALL BundleGroups by traversal (a bundle
  // replays cached draws that ignore an override material), so no registration
  // is needed here.
  return useMemo(() => {
    const group = new BundleGroup();
    return {
      group,
      invalidate: () => {
        group.needsUpdate = true;
      },
    };
  }, []);
}
