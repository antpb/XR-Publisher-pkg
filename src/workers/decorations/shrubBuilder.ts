/**
 * Worker-side shrub geometry builder.
 *
 * Consumes the WASM-produced shrub spawn array (6 floats per shrub:
 * `[x, y, z, scale, rotation, shrubSeed]`) and returns two merged
 * `BakedMesh`es: `stems` (cylinders) and `foliage` (squashed spheres).
 *
 * Per-shrub transform is baked into vertex coordinates so the React
 * component mounts exactly two meshes per chunk (one per material)
 * instead of one Group-of-meshes per shrub.
 *
 * Geometry + seeded PRNG logic is transcribed from the
 * `createShrubGroup` body in `ProceduralShrubs.tsx` so the shapes
 * match the prior main-thread output.
 */
import {
  Matrix4, Euler, Quaternion, Vector3,
  CylinderGeometry, SphereGeometry,
} from 'three';
import { alea } from 'seedrandom';
import type { BakedMesh } from '../terrainWorker.protocol';
import { mergeBuffers, type MergeEntry } from './mergeBuffers';

export interface BuildShrubsInput {
  /** 6 floats per shrub: x, y, z, scale, rotation, shrubSeed. */
  spawns: Float32Array;
}

/**
 * Emit merged {stems, foliage} meshes for a chunk. Spawn coords are
 * chunk-local (same pattern as boulders / trees); the parent component's
 * chunk group applies the world transform.
 */
export function buildShrubDecoration(input: BuildShrubsInput): {
  stems: BakedMesh;
  foliage: BakedMesh;
} {
  const { spawns } = input;
  const STRIDE = 6;
  const shrubCount = Math.floor(spawns.length / STRIDE);
  const empty: BakedMesh = {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    indices: new Uint32Array(0),
  };
  if (shrubCount === 0) return { stems: empty, foliage: empty };

  const stemEntries: MergeEntry[] = [];
  const foliageEntries: MergeEntry[] = [];

  const euler = new Euler();
  const quat = new Quaternion();
  const posVec = new Vector3();
  const scaleVec = new Vector3(1, 1, 1);

  for (let i = 0; i < shrubCount; i++) {
    const off = i * STRIDE;
    const spawnX = spawns[off];
    const spawnY = spawns[off + 1];
    const spawnZ = spawns[off + 2];
    const scale = spawns[off + 3];
    const rotation = spawns[off + 4];
    const shrubSeed = spawns[off + 5];

    // Seeded per-shrub RNG — matches the old `alea('shrub-${shrubSeed}')`
    // key so visual shape is reproducible vs. the pre-worker build.
    const rng = alea(`shrub-${shrubSeed}`);

    // The whole shrub (stems + foliage) gets one outer transform:
    // translation to spawn position + Y rotation. Scale is baked into
    // individual sub-geometries, not this outer matrix.
    euler.set(0, rotation, 0, 'XYZ');
    quat.setFromEuler(euler);
    posVec.set(spawnX, spawnY, spawnZ);
    const outerTransform = new Matrix4().compose(posVec, quat, scaleVec);

    // ─── Stems ─────────────────────────────────────────────────────
    // 3–5 slightly-leaning cylinders in a small scatter around the
    // spawn point.
    const stemCount = 3 + Math.floor(rng() * 3);
    for (let s = 0; s < stemCount; s++) {
      const stemHeight = (0.3 + rng() * 0.4) * scale;
      const stemRadius = 0.025 * scale;
      const stemAngle = rng() * Math.PI * 2;
      const stemLean = (rng() - 0.5) * 0.4;
      const stemOffset = rng() * 0.15 * scale;

      const stemGeom = new CylinderGeometry(stemRadius * 0.6, stemRadius, stemHeight, 4);
      // Inner transform: within the shrub's local frame, position +
      // lean the stem. Compose outerTransform × innerTransform so the
      // stem's final vertex coords are chunk-local.
      const innerPos = new Vector3(
        Math.cos(stemAngle) * stemOffset,
        stemHeight * 0.5,
        Math.sin(stemAngle) * stemOffset,
      );
      const innerQuat = new Quaternion().setFromEuler(new Euler(0, 0, stemLean, 'XYZ'));
      const innerTransform = new Matrix4().compose(innerPos, innerQuat, new Vector3(1, 1, 1));
      const combined = new Matrix4().multiplyMatrices(outerTransform, innerTransform);

      stemEntries.push(bakedEntryFromGeom(stemGeom, combined));
      stemGeom.dispose();
    }

    // ─── Foliage clumps ────────────────────────────────────────────
    // 3–5 spheres squashed/jittered to break the round-silhouette look.
    const clumpCount = 3 + Math.floor(rng() * 3);
    for (let c = 0; c < clumpCount; c++) {
      const clumpRadius = (0.4 + rng() * 0.5) * scale;
      const clumpHeight = (0.35 + rng() * 0.45) * scale;
      const clumpAngle = rng() * Math.PI * 2;
      const clumpOffset = rng() * 0.2 * scale;

      const clumpGeom = new SphereGeometry(clumpRadius, 6, 5);
      const positions = clumpGeom.attributes.position.array as Float32Array;
      for (let j = 0; j < positions.length; j += 3) {
        positions[j + 1] *= clumpHeight / clumpRadius;
        const nX = Math.sin(positions[j] * 5 + shrubSeed) * 0.15 * clumpRadius;
        positions[j] += nX;
        positions[j + 2] += Math.cos(positions[j + 2] * 5 + shrubSeed) * 0.1 * clumpRadius;
      }
      clumpGeom.computeVertexNormals();

      const innerPos = new Vector3(
        Math.cos(clumpAngle) * clumpOffset,
        clumpHeight * 0.6,
        Math.sin(clumpAngle) * clumpOffset,
      );
      const innerTransform = new Matrix4().compose(innerPos, new Quaternion(), new Vector3(1, 1, 1));
      const combined = new Matrix4().multiplyMatrices(outerTransform, innerTransform);

      foliageEntries.push(bakedEntryFromGeom(clumpGeom, combined));
      clumpGeom.dispose();
    }
  }

  return {
    stems: mergeBuffers(stemEntries),
    foliage: mergeBuffers(foliageEntries),
  };
}

/**
 * Snapshot a Three primitive's buffers into a MergeEntry with the given
 * transform pre-attached. Three primitives are non-indexed by default;
 * we synthesize an identity index so mergeBuffers can stitch correctly.
 */
function bakedEntryFromGeom(geom: any, transform: Matrix4): MergeEntry {
  const positions = (geom.attributes.position.array as Float32Array).slice();
  const normals = (geom.attributes.normal.array as Float32Array).slice();
  let indices: Uint32Array;
  if (geom.index) {
    indices = new Uint32Array(geom.index.array);
  } else {
    const vertexCount = positions.length / 3;
    indices = new Uint32Array(vertexCount);
    for (let k = 0; k < vertexCount; k++) indices[k] = k;
  }
  return { positions, normals, indices, transform };
}
