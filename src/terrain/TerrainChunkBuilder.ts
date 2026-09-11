/**
 * TerrainChunkBuilder
 *
 * Creates a Three.js BufferGeometry from raw Float32Array data
 * returned by the terrain worker. Uses PlaneGeometry only for
 * its index buffer (triangle connectivity for a grid), then
 * replaces position/color attributes with the worker's arrays.
 */
import { PlaneGeometry, BufferAttribute, type BufferGeometry } from 'three';

export function buildTerrainGeometry(
  positions: Float32Array,
  colors: Float32Array,
  roadStrength: Float32Array,
  width: number,
  height: number,
  segments: number,
  /** WASM-computed vertex normals (grid-matching, see normals.rs). When
   *  provided, the main-thread computeVertexNormals() pass is skipped —
   *  the caller's edge-blend recompute (when neighbors exist) still runs. */
  normals?: Float32Array,
): BufferGeometry {
  // PlaneGeometry gives us the correct triangle index buffer for a grid.
  const geometry = new PlaneGeometry(width, height, segments, segments);

  // Replace default attributes with worker-computed data.
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));

  // Per-vertex road strength 0..1 (worker-baked from the deterministic road
  // network). The terrain material reads it via attribute('roadStrength')
  // (WebGPU) / a GLSL varying (WebGL). Always present (zeros when roads off) so
  // the shared material's attribute reference always resolves. The buffer is
  // continuous across chunk borders (it's a pure function of world XZ), so the
  // caller's edge-blend needs no special handling.
  const vCount = positions.length / 3;
  const road = (roadStrength && roadStrength.length === vCount)
    ? roadStrength : new Float32Array(vCount);
  geometry.setAttribute('roadStrength', new BufferAttribute(road, 1));

  // Normals: prefer the WASM-computed array (skips an O(verts) main-thread
  // pass per chunk); otherwise compute from the positions. Either way the
  // caller re-runs computeVertexNormals() after edge-blending neighbors.
  if (normals && normals.length === positions.length) {
    geometry.setAttribute('normal', new BufferAttribute(normals, 3));
  } else {
    geometry.computeVertexNormals();
  }

  return geometry;
}
