/**
 * Worker-side flower geometry builder.
 *
 * Consumes WASM flower spawn array (7 floats per flower:
 * `[x, y, z, scale, rotation, paletteIdx, flowerSeed]`) and returns
 * three merged `BakedMesh`es — `stems`, `centers`, `petals`.
 *
 * The old main-thread code kept a palette-keyed material cache per
 * colour (7 petal materials + 7 center materials). Post-merge, the
 * palette RGB is baked into the merged mesh's per-vertex `colors`
 * attribute so **one** petal material + **one** center material suffice
 * for the whole world. The consuming React component's shared material
 * reads `attribute('color')` instead of a closure-captured RGB.
 *
 * Stem colour is uniform green (no palette dependency), so `stems` has
 * no `colors` attribute — the material supplies the green directly.
 */
import {
  Matrix4, Euler, Quaternion, Vector3,
  CylinderGeometry, SphereGeometry, Color,
} from 'three';
import { alea } from 'seedrandom';
import type { BakedMesh } from '../terrainWorker.protocol';
import { mergeBuffers, type MergeEntry } from './mergeBuffers';

/**
 * Palette table matches `FLOWER_PALETTES` in `ProceduralFlowers.tsx`.
 * Order-sensitive — the WASM spawn's `paletteIdx` is an index into
 * this array. Keep in sync.
 */
const FLOWER_PALETTES: Array<{ petal: number; center: number }> = [
  { petal: 0xff4466, center: 0xffdd33 },
  { petal: 0xffaa22, center: 0x663300 },
  { petal: 0xaa44ff, center: 0xffee55 },
  { petal: 0xff88cc, center: 0xffff88 },
  { petal: 0x4488ff, center: 0xffee44 },
  { petal: 0xffffff, center: 0xffdd00 },
  { petal: 0xff6633, center: 0x442200 },
];

export interface BuildFlowersInput {
  /** 7 floats per flower: x, y, z, scale, rotation, paletteIdx, flowerSeed. */
  spawns: Float32Array;
}

export function buildFlowerDecoration(input: BuildFlowersInput): {
  stems: BakedMesh;
  centers: BakedMesh;
  petals: BakedMesh;
} {
  const { spawns } = input;
  const STRIDE = 7;
  const flowerCount = Math.floor(spawns.length / STRIDE);

  const empty: BakedMesh = {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    indices: new Uint32Array(0),
  };
  if (flowerCount === 0) return { stems: empty, centers: empty, petals: empty };

  const stemEntries: MergeEntry[] = [];
  const centerEntries: MergeEntry[] = [];
  const petalEntries: MergeEntry[] = [];

  const centerColor = new Color();
  const petalColor = new Color();
  const scaleVec = new Vector3(1, 1, 1);

  for (let i = 0; i < flowerCount; i++) {
    const off = i * STRIDE;
    const spawnX = spawns[off];
    const spawnY = spawns[off + 1];
    const spawnZ = spawns[off + 2];
    const scale = spawns[off + 3];
    const rotation = spawns[off + 4];
    const paletteIdx = Math.floor(spawns[off + 5]);
    const flowerSeed = spawns[off + 6];

    const palette = FLOWER_PALETTES[paletteIdx % FLOWER_PALETTES.length];
    centerColor.setHex(palette.center);
    petalColor.setHex(palette.petal);

    // Outer transform for the whole flower — spawn position + Y rotation.
    const outerQuat = new Quaternion().setFromEuler(new Euler(0, rotation, 0, 'XYZ'));
    const outerPos = new Vector3(spawnX, spawnY, spawnZ);
    const outerTransform = new Matrix4().compose(outerPos, outerQuat, scaleVec);

    // Seeded per-flower RNG (matches the old alea key) so petal counts
    // and angle jitter are deterministic vs. the pre-worker visual.
    const rng = alea(`flower-${flowerSeed}`);

    // ── Stem ─────────────────────────────────────────────────────
    const stemHeight = (0.15 + rng() * 0.2) * scale * 4;
    const stemRadius = 0.012 * scale * 4;
    const stemGeom = new CylinderGeometry(stemRadius * 0.5, stemRadius, stemHeight, 4);

    // Stem sits centred at y = stemHeight/2 above the spawn.
    const stemInnerPos = new Vector3(0, stemHeight * 0.5, 0);
    const stemInner = new Matrix4().compose(stemInnerPos, new Quaternion(), scaleVec);
    const stemCombined = new Matrix4().multiplyMatrices(outerTransform, stemInner);
    stemEntries.push(bakedEntryFromGeom(stemGeom, stemCombined));
    stemGeom.dispose();

    // ── Center ───────────────────────────────────────────────────
    // Tinted per palette via vertex colour so a single shared material
    // covers all flowers.
    const centerRadius = 0.04 * scale * 4;
    const centerGeom = new SphereGeometry(centerRadius, 5, 4);
    const centerInnerPos = new Vector3(0, stemHeight, 0);
    const centerInner = new Matrix4().compose(centerInnerPos, new Quaternion(), scaleVec);
    const centerCombined = new Matrix4().multiplyMatrices(outerTransform, centerInner);
    centerEntries.push(
      bakedEntryFromGeom(centerGeom, centerCombined, [centerColor.r, centerColor.g, centerColor.b]),
    );
    centerGeom.dispose();

    // ── Petals ──────────────────────────────────────────────────
    const petalCount = 4 + Math.floor(rng() * 4);
    const petalRadius = (0.03 + rng() * 0.03) * scale * 4;

    for (let p = 0; p < petalCount; p++) {
      const angle = (p / petalCount) * Math.PI * 2 + rng() * 0.3;
      const petalGeom = new SphereGeometry(petalRadius, 4, 3);
      // Squish into an oblate spheroid: flatten Y, stretch X. Matches
      // the old main-thread positions-array rewrite exactly.
      const positions = petalGeom.attributes.position.array as Float32Array;
      for (let j = 0; j < positions.length; j += 3) {
        positions[j + 1] *= 0.3;
        positions[j] *= 1.4;
      }
      petalGeom.computeVertexNormals();

      // Per-petal inner transform: offset the petal outward from the
      // flower center by `centerRadius + petalRadius*0.8`, face-outward
      // rotation, small z-tilt.
      const dist = centerRadius + petalRadius * 0.8;
      const innerPos = new Vector3(
        Math.cos(angle) * dist,
        stemHeight,
        Math.sin(angle) * dist,
      );
      const innerQuat = new Quaternion().setFromEuler(
        new Euler(0, -angle, (rng() - 0.5) * 0.4, 'YXZ'),
      );
      const innerTransform = new Matrix4().compose(innerPos, innerQuat, scaleVec);
      const combined = new Matrix4().multiplyMatrices(outerTransform, innerTransform);

      petalEntries.push(
        bakedEntryFromGeom(petalGeom, combined, [petalColor.r, petalColor.g, petalColor.b]),
      );
      petalGeom.dispose();
    }
  }

  return {
    stems: mergeBuffers(stemEntries),
    centers: mergeBuffers(centerEntries),
    petals: mergeBuffers(petalEntries),
  };
}

/**
 * Build a MergeEntry from a Three primitive geometry, baking in a
 * transform and optionally attaching a per-instance RGB tint (which
 * mergeBuffers promotes to a per-vertex `colors` attribute on the
 * merged output).
 */
function bakedEntryFromGeom(
  geom: any,
  transform: Matrix4,
  color?: [number, number, number],
): MergeEntry {
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
  const entry: MergeEntry = { positions, normals, indices, transform };
  if (color) entry.color = color;
  return entry;
}
