/**
 * Worker-side boulder geometry builder.
 *
 * Consumes the WASM-produced boulder spawn array (7 floats per boulder:
 * `[x, y, z, scale, rotX, rotY, rotZ]`) and returns a single merged
 * `BakedMesh` for the entire chunk. Per-boulder transform is baked
 * directly into vertex coordinates; the consuming React component
 * mounts one mesh at chunk origin instead of N per-boulder `<mesh>`
 * nodes.
 *
 * Geometry is a `DodecahedronGeometry` with simplex-noise displacement
 * along the per-vertex radial direction — identical to the old
 * main-thread code in `ProceduralBoulders.tsx`, just moved off-thread.
 * Three.js primitive geometries are pure BufferGeometry data (no WebGL
 * context required) and construct fine inside a Web Worker.
 *
 * Mobile uses detail=0 (12 verts); desktop uses detail=1 (42 verts)
 * for a smoother rocky silhouette at the cost of more vertices.
 */
import { DodecahedronGeometry, Matrix4, Euler, Quaternion, Vector3 } from 'three';
import { createNoise3D } from 'simplex-noise';
import { alea } from 'seedrandom';
import type { BakedMesh } from '../terrainWorker.protocol';
import { mergeBuffers, type MergeEntry } from './mergeBuffers';

export interface BuildBouldersInput {
  /** 7 floats per boulder: x, y, z, scale, rotX, rotY, rotZ. */
  spawns: Float32Array;
  isMobile: boolean;
  rngSeedSalt: string;
}

/**
 * Emit one merged boulder mesh for a chunk.
 *
 * Spawn X/Y/Z are chunk-local (see Rust `compute_boulder_spawns` which
 * reads straight from the chunk-local positions array). Vertex coords
 * in the returned BakedMesh are therefore also chunk-local, so the
 * consuming component's parent chunk group's own transform places the
 * boulders in world space. No per-chunk origin math required here.
 */
export function buildBoulderDecoration(
  input: BuildBouldersInput,
): { main: BakedMesh } {
  const { spawns, isMobile, rngSeedSalt } = input;
  const STRIDE = 7;
  const boulderCount = Math.floor(spawns.length / STRIDE);
  if (boulderCount === 0) {
    return {
      main: { positions: new Float32Array(0), normals: new Float32Array(0), indices: new Uint32Array(0) },
    };
  }

  // Surface displacement noise is shared across all boulders in the
  // chunk. The RNG salt matches what the JS main-thread code used
  // (chunk-keyed), so the pre-worker visual is reproduced vertex-exact.
  const noise3D = createNoise3D(alea(rngSeedSalt));

  // Pebble scatter draws from its OWN seeded stream — adding it to the
  // main RNG would shift every existing boulder's displacement and move
  // rocks under players' feet on already-visited seeds.
  const pebbleRng = alea(`${rngSeedSalt}-pebbles`);

  const detail = isMobile ? 0 : 1;
  const entries: MergeEntry[] = [];

  // Reusable scratch objects so we don't allocate per boulder.
  const euler = new Euler();
  const quat = new Quaternion();
  const posVec = new Vector3();
  const scaleVec = new Vector3();
  const transform = new Matrix4();

  for (let i = 0; i < boulderCount; i++) {
    const off = i * STRIDE;
    const x = spawns[off];
    const y = spawns[off + 1];
    const z = spawns[off + 2];
    const scale = spawns[off + 3];
    const rotX = spawns[off + 4];
    const rotY = spawns[off + 5];
    const rotZ = spawns[off + 6];

    // Per-boulder geometry. Three.js primitive — safe in a worker.
    const geom = new DodecahedronGeometry(scale, detail);
    const positions = geom.attributes.position.array as Float32Array;

    // Radial simplex displacement — identical to the old main-thread
    // path (`ProceduralBoulders.tsx:113-130` and `170-189`). Three
    // octaves give the rocky micro-relief without breaking the
    // silhouette.
    for (let j = 0; j < positions.length; j += 3) {
      const px = positions[j];
      const py = positions[j + 1];
      const pz = positions[j + 2];

      const nScale = 2.5;
      const n1 = noise3D(px * nScale, py * nScale, pz * nScale) * 0.4;
      const n2 = noise3D(px * nScale * 2, py * nScale * 2, pz * nScale * 2) * 0.2;
      const n3 = noise3D(px * nScale * 4, py * nScale * 4, pz * nScale * 4) * 0.1;
      const displacement = (n1 + n2 + n3) * scale * 0.35;

      const len = Math.sqrt(px * px + py * py + pz * pz);
      const invLen = len > 0 ? displacement / len : 0;
      positions[j]     = px + px * invLen;
      positions[j + 1] = py + py * invLen;
      positions[j + 2] = pz + pz * invLen;
    }

    geom.computeVertexNormals();

    // Per-boulder transform matches the old main-thread JSX:
    //   <mesh position={[x, y - scale*0.5, z]}
    //         rotation={[rotX, rotY, rotZ]}
    //         scale={1 — baked into DodecahedronGeometry(scale)} />
    // Scale is already in the geometry (DodecahedronGeometry takes
    // radius), so the transform here only applies rotation + position.
    euler.set(rotX, rotY, rotZ, 'XYZ');
    quat.setFromEuler(euler);
    posVec.set(x, y - scale * 0.5, z);
    scaleVec.set(1, 1, 1);
    transform.compose(posVec, quat, scaleVec);

    const normals = geom.attributes.normal.array as Float32Array;
    const indices = geom.index
      ? new Uint32Array(geom.index.array)
      : buildDefaultIndices(positions.length / 3);

    entries.push({
      positions: positions.slice(),
      normals: normals.slice(),
      indices,
      transform: transform.clone(),
    });

    geom.dispose();

    // Pebble scatter: 3-5 small rocks ringed around each boulder so it
    // reads as debris that belongs to the ground, not a prop dropped on
    // it. Deterministic (seeded stream above), detail 0 (12 verts each)
    // on every device — the whole ring costs less than one boulder.
    const pebbleCount = 3 + Math.floor(pebbleRng() * 3);
    for (let p = 0; p < pebbleCount; p++) {
      const pebbleR = (0.12 + pebbleRng() * 0.18) * scale;
      const ang = pebbleRng() * Math.PI * 2;
      // Stay close to the parent boulder — its spawn height is the only
      // terrain sample we have, and pebbles drifting far on a slope would
      // float. Sinking ~55% of the radius covers the residual error.
      const dist = scale * (0.9 + pebbleRng() * 0.7);
      const px = x + Math.cos(ang) * dist;
      const pz = z + Math.sin(ang) * dist;

      const pGeom = new DodecahedronGeometry(pebbleR, 0);
      const pPositions = pGeom.attributes.position.array as Float32Array;
      for (let j = 0; j < pPositions.length; j += 3) {
        const vx = pPositions[j];
        const vy = pPositions[j + 1];
        const vz = pPositions[j + 2];
        // Same displacement field as the parent boulder, so pebbles read
        // as chips of the same rock.
        const nScale = 2.5;
        const n1 = noise3D(vx * nScale, vy * nScale, vz * nScale) * 0.4;
        const n2 = noise3D(vx * nScale * 2, vy * nScale * 2, vz * nScale * 2) * 0.2;
        const displacement = (n1 + n2) * pebbleR * 0.45;
        const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
        const invLen = len > 0 ? displacement / len : 0;
        pPositions[j]     = vx + vx * invLen;
        pPositions[j + 1] = vy + vy * invLen;
        pPositions[j + 2] = vz + vz * invLen;
      }
      pGeom.computeVertexNormals();

      euler.set(
        pebbleRng() * Math.PI,
        pebbleRng() * Math.PI * 2,
        pebbleRng() * Math.PI,
        'XYZ',
      );
      quat.setFromEuler(euler);
      posVec.set(px, y - pebbleR * 0.55, pz);
      scaleVec.set(1, 1, 1);
      transform.compose(posVec, quat, scaleVec);

      const pNormals = pGeom.attributes.normal.array as Float32Array;
      const pIndices = pGeom.index
        ? new Uint32Array(pGeom.index.array)
        : buildDefaultIndices(pPositions.length / 3);

      entries.push({
        positions: pPositions.slice(),
        normals: pNormals.slice(),
        indices: pIndices,
        transform: transform.clone(),
      });

      pGeom.dispose();
    }
  }

  return { main: mergeBuffers(entries) };
}

/**
 * DodecahedronGeometry in Three is non-indexed by default. `mergeBuffers`
 * requires an index array to stitch meshes together correctly, so emit
 * a trivial identity index for the unindexed case.
 */
function buildDefaultIndices(vertexCount: number): Uint32Array {
  const arr = new Uint32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) arr[i] = i;
  return arr;
}
