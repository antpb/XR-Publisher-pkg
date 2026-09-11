/**
 * mergeBuffers — merge per-instance vertex streams into a single BakedMesh.
 *
 * Used by every per-decoration builder in this directory (treeBuilder,
 * boulderBuilder, shrubBuilder, flowerBuilder). Concatenates the
 * per-instance arrays, applies an optional Matrix4 transform per instance
 * (for baking world-space position/rotation/scale into vertex coords so
 * the consuming Mesh can sit at chunk origin), and offsets indices by the
 * running vertex count.
 *
 * Worker-safe — uses only `three`'s pure-math classes (Matrix3, Matrix4),
 * no GL state.
 */
import { Matrix3, Matrix4 } from 'three';
import type { BakedMesh } from '../terrainWorker.protocol';

export interface MergeEntry {
  /** Vertex positions, xyz triplets. */
  positions: Float32Array;
  /** Vertex normals, xyz triplets. Same length as positions. */
  normals: Float32Array;
  /** Triangle indices into this entry's vertex array. */
  indices: Uint32Array;
  /**
   * Optional UV coordinates, xy pairs. If any entry supplies UVs, every
   * other entry must too — the merged BakedMesh either has UVs or doesn't.
   */
  uvs?: Float32Array;
  /**
   * Optional Matrix4 baked into vertex coords. Position is multiplied by
   * the full matrix; the normal is multiplied by `normalMatrix(matrix)`
   * (which is the inverse-transpose of the upper-left 3×3) and
   * re-normalised. Pass identity (or undefined) to leave verts in entry-
   * local space.
   */
  transform?: Matrix4;
  /**
   * Optional single RGB tint that fills every vertex of this entry's
   * `colors` slot in the merged output. If any entry passes `color`,
   * every other entry must too — colors are all-or-nothing per merge.
   */
  color?: [number, number, number];
  /**
   * Optional per-vertex RGB colors (3 floats/vertex, same vertex count as
   * `positions`). Takes precedence over `color`. Used by the canopy
   * builder to bake the top-lit shading gradient into the geometry so an
   * unlit vertex-color material renders it identically on the WebGPU and
   * WebGL paths.
   */
  vertexColors?: Float32Array;
}

const _tmpNormalMat = new Matrix3();

export function mergeBuffers(entries: MergeEntry[]): BakedMesh {
  if (entries.length === 0) {
    return {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      indices: new Uint32Array(0),
    };
  }

  // Pre-compute total sizes so we allocate output buffers once.
  let totalVerts = 0;
  let totalIndices = 0;
  let hasUvs = false;
  let hasColors = false;
  for (const e of entries) {
    totalVerts += e.positions.length / 3;
    totalIndices += e.indices.length;
    if (e.uvs) hasUvs = true;
    if (e.color || e.vertexColors) hasColors = true;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);
  const uvs = hasUvs ? new Float32Array(totalVerts * 2) : undefined;
  const colors = hasColors ? new Float32Array(totalVerts * 3) : undefined;

  let posOffset = 0;
  let uvOffset = 0;
  let idxOffset = 0;
  let vertCount = 0;

  for (const e of entries) {
    const eVerts = e.positions.length / 3;

    if (e.transform) {
      // Apply the matrix to each position; the corresponding normal gets
      // the matrix's normal-matrix (inverse-transpose of upper-left 3×3)
      // and is re-normalised. Doing this inline avoids per-vertex Vector3
      // allocations that would dominate cost in a worker tight loop.
      const m = e.transform.elements;
      _tmpNormalMat.getNormalMatrix(e.transform);
      const n = _tmpNormalMat.elements;

      for (let i = 0; i < eVerts; i++) {
        const px = e.positions[i * 3];
        const py = e.positions[i * 3 + 1];
        const pz = e.positions[i * 3 + 2];
        positions[posOffset + i * 3]     = m[0] * px + m[4] * py + m[8]  * pz + m[12];
        positions[posOffset + i * 3 + 1] = m[1] * px + m[5] * py + m[9]  * pz + m[13];
        positions[posOffset + i * 3 + 2] = m[2] * px + m[6] * py + m[10] * pz + m[14];

        const nx = e.normals[i * 3];
        const ny = e.normals[i * 3 + 1];
        const nz = e.normals[i * 3 + 2];
        const tnx = n[0] * nx + n[3] * ny + n[6] * nz;
        const tny = n[1] * nx + n[4] * ny + n[7] * nz;
        const tnz = n[2] * nx + n[5] * ny + n[8] * nz;
        const len = Math.hypot(tnx, tny, tnz) || 1;
        normals[posOffset + i * 3]     = tnx / len;
        normals[posOffset + i * 3 + 1] = tny / len;
        normals[posOffset + i * 3 + 2] = tnz / len;
      }
    } else {
      positions.set(e.positions, posOffset);
      normals.set(e.normals, posOffset);
    }

    if (uvs) {
      if (e.uvs) {
        uvs.set(e.uvs, uvOffset);
      }
      // entries without uvs leave zeros — expected when caller asked for
      // a UV slot but a particular entry has none, which shouldn't
      // happen in our pipeline (we either set uvs everywhere or never).
      uvOffset += eVerts * 2;
    }

    if (colors && e.vertexColors) {
      colors.set(e.vertexColors, posOffset);
    } else if (colors && e.color) {
      const [r, g, b] = e.color;
      for (let i = 0; i < eVerts; i++) {
        colors[posOffset + i * 3]     = r;
        colors[posOffset + i * 3 + 1] = g;
        colors[posOffset + i * 3 + 2] = b;
      }
    }

    // Indices need to be offset by the count of verts emitted so far.
    for (let i = 0; i < e.indices.length; i++) {
      indices[idxOffset + i] = e.indices[i] + vertCount;
    }

    posOffset += eVerts * 3;
    idxOffset += e.indices.length;
    vertCount += eVerts;
  }

  const out: BakedMesh = { positions, normals, indices };
  if (uvs) out.uvs = uvs;
  if (colors) out.colors = colors;
  return out;
}

/**
 * Convenience: list every transferable ArrayBuffer inside a BakedMesh.
 * Caller hands this to `postMessage(msg, transferList)` to avoid copies.
 */
export function bakedMeshTransferables(mesh: BakedMesh): ArrayBuffer[] {
  // TS ≥5.7 types TypedArray.buffer as ArrayBufferLike (it could be a
  // SharedArrayBuffer in general); every BakedMesh array here is allocated
  // with `new Float32Array(n)`/`new Uint32Array(n)`, so the backing store is
  // always a plain, transferable ArrayBuffer.
  const list: ArrayBuffer[] = [
    mesh.positions.buffer as ArrayBuffer,
    mesh.normals.buffer as ArrayBuffer,
    mesh.indices.buffer as ArrayBuffer,
  ];
  if (mesh.colors) list.push(mesh.colors.buffer as ArrayBuffer);
  if (mesh.uvs) list.push(mesh.uvs.buffer as ArrayBuffer);
  if (mesh.bladeHeight) list.push(mesh.bladeHeight.buffer as ArrayBuffer);
  if (mesh.bladeWidth) list.push(mesh.bladeWidth.buffer as ArrayBuffer);
  return list;
}
