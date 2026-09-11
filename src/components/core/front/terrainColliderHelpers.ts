import type { BufferGeometry } from 'three';
import { HeightFieldFlags } from '@dimforge/rapier3d-compat';

/**
 * Shared terrain-collider helpers used by both the WebGPU (`ProceduralTerrain`)
 * and WebGL (`ProceduralTerrainWebGL`) chunk renderers.
 *
 * The terrain collider is a Rapier HEIGHTFIELD at FULL visual resolution, not
 * a trimesh. History: the chunk collider used to be an auto `colliders="trimesh"`
 * on the full-res visual mesh — Rapier cooks trimesh BVHs synchronously on the
 * main thread, which spiked frames on every chunk-cross, and trimesh internal
 * edges launched the player on ridge lines. That was replaced by a decimated
 * (every-2nd-vertex) trimesh, which fixed both but made the collider a flat
 * chord across 2-cell spans — over local dips the chord sits ABOVE the visual
 * mesh, so the player visibly hovered.
 *
 * A heightfield fixes all three at once:
 * - Creation is an O(n) heights copy — no BVH cook, so full resolution is
 *   cheaper to (re)mount than the decimated trimesh was (matters when
 *   `collidersActive` re-mounts colliders after flying).
 * - Full resolution means the collider matches the visual mesh at every
 *   vertex — no hover. (Rapier may split cells along the other diagonal than
 *   PlaneGeometry; the sub-cell difference is cm-scale.)
 * - `HeightFieldFlags.FIX_INTERNAL_EDGES` is Rapier's purpose-built fix for
 *   the internal-edge contact bumps that motivated the decimation.
 *
 * Chunk-edge vertices are included verbatim (post edge-blend), so neighbouring
 * chunk heightfields meet seamlessly — no fall-through at seams.
 *
 * Kept renderer-agnostic (no `three/webgpu` imports) so the WebGL bundle can
 * import it without dragging in WebGPU node materials.
 */

/** Ready-to-pass `<HeightfieldCollider args={...}>` tuple:
 *  [nrows, ncols, heights (column-major), scale, flags]. The 5th element is
 *  spread by @react-three/rapier into `ColliderDesc.heightfield(...)`, whose
 *  optional flags param its `HeightfieldArgs` type doesn't know about. */
export type TerrainHeightfieldArgs = [
  nrows: number,
  ncols: number,
  heights: Float32Array,
  scale: { x: number; y: number; z: number },
  flags: HeightFieldFlags,
];

export function buildHeightfieldCollider(
  geometry: BufferGeometry,
  segments: number,
  width: number,
  height: number,
): TerrainHeightfieldArgs {
  const pos = geometry.attributes.position.array as ArrayLike<number>;
  const vps = segments + 1;

  // Geometry vertices are laid out row-major with z as the row (idx = gz*vps+gx,
  // x from -width/2 along gx, z from -height/2 along gz — see lib.rs
  // generate_terrain / PlaneGeometry). Rapier heightfields want a column-major
  // (nrows+1)×(ncols+1) matrix with rows spanning local z and columns spanning
  // local x, centered on the origin — i.e. the same grid, transposed:
  // heights[gx*vps + gz] = y(gx, gz).
  const heights = new Float32Array(vps * vps);
  for (let gz = 0; gz < vps; gz++) {
    const rowBase = gz * vps;
    for (let gx = 0; gx < vps; gx++) {
      heights[gx * vps + gz] = pos[(rowBase + gx) * 3 + 1];
    }
  }

  // Fresh scale object per build — @react-three/rapier's scaleColliderArgs
  // mutates it in place (identity at world scale 1, but never share a constant).
  return [
    segments,
    segments,
    heights,
    { x: width, y: 1, z: height },
    HeightFieldFlags.FIX_INTERNAL_EDGES,
  ];
}
