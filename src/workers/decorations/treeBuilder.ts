/**
 * Tree decoration builder — runs in the terrain worker.
 *
 * Breath-of-the-Wild-style blob trees: one curved tapered trunk with a
 * root flare, a few short limbs, and 2–4 large noise-displaced squashed
 * icosphere canopy blobs. ~220 verts per tree versus the previous
 * Weber-Penn recursion's hundreds of thousands (oak's per-parent branch
 * counts were combinatorial: 45×28×20 terminal branches).
 *
 * Shading is baked into canopy vertex colors here (top-lit gradient ×
 * per-blob jitter) so an UNLIT vertex-color material renders the same
 * look on the WebGPU and WebGL paths — no alpha test, no transparency,
 * no per-fragment lighting.
 *
 * Also emits per-tree collider metadata (trunk capsule + canopy blob
 * spheres, chunk-local, COLLIDER_STRIDE floats per tree) so the
 * component can mount cheap primitive physics colliders. NOTE: the
 * components mount ONLY the trunk capsule — canopies are intentionally
 * non-solid (you climb/stand on trunks, walk through leaves). Blob
 * spheres stay in the array so the format is stable.
 *
 * Per-tree transform (chunk-relative position + Y rotation; scale is
 * baked into lengths) is baked into the merged vertex stream so the
 * consuming Mesh sits at the chunk origin — no per-tree Object3Ds.
 *
 * Worker-safe — uses only `three`'s pure-math classes (Vector3, Matrix4)
 * plus deterministic RNG.
 */
import { Matrix4, Vector3 } from 'three';
import type { BakedMesh } from '../terrainWorker.protocol';
import { mergeBuffers, type MergeEntry } from './mergeBuffers';
import { pickSpecies, SPECIES, type BlobTreeParams, type SpeciesId } from './species';

/**
 * RNG shape. Inlined here rather than imported from `tree/RNG.ts`
 * (which lives in the React tree under `components/`) so the worker
 * has a self-contained dependency graph and Vite doesn't pull a
 * component file into the worker bundle.
 */
class RNG {
  private mw: number;
  private mz: number;
  constructor(seed: number) {
    const mask = 0xffffffff;
    this.mw = (123456789 + seed) & mask;
    this.mz = (987654321 - seed) & mask;
  }
  /** Uniform random in [min, max). */
  random(min = 0, max = 1): number {
    const mask = 0xffffffff;
    this.mz = (36969 * (this.mz & 65535) + (this.mz >> 16)) & mask;
    this.mw = (18000 * (this.mw & 65535) + (this.mw >> 16)) & mask;
    let r = ((this.mz << 16) + (this.mw & 65535)) >>> 0;
    r /= 4294967296;
    return min + (max - min) * r;
  }
  /** Symmetric variance: random in [-v, +v]. */
  v(v: number): number {
    return this.random(-v, v);
  }
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.random() * (max - min + 1));
  }
}

const DEG = Math.PI / 180;

/* ── Tube mesh emitter (unchanged from the Sapling-era builder) ─────── */

const RING_SEGMENTS = 6;

interface Frame {
  pos: Vector3;
  dir: Vector3;
  side: Vector3;
  up: Vector3;
  radius: number;
}

interface MeshOut {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

function buildFrames(
  startPos: Vector3,
  startDir: Vector3,
  length: number,
  startRadius: number,
  taper: number,
  curveRes: number,
  curveDeg: number,
  curveVDeg: number,
  rng: RNG,
): Frame[] {
  const frames: Frame[] = [];
  const segmentLen = length / curveRes;
  const segCurve = (curveDeg * DEG) / curveRes;

  const tmpSide = new Vector3();
  if (Math.abs(startDir.x) < 0.9) {
    tmpSide.set(1, 0, 0);
  } else {
    tmpSide.set(0, 0, 1);
  }
  const side = tmpSide.clone().sub(startDir.clone().multiplyScalar(tmpSide.dot(startDir))).normalize();
  const dir = startDir.clone();
  const up = new Vector3().crossVectors(dir, side).normalize();
  const pos = startPos.clone();

  for (let i = 0; i <= curveRes; i++) {
    const t = i / curveRes;
    const radius = startRadius * (1 - taper * t);

    frames.push({
      pos: pos.clone(),
      dir: dir.clone(),
      side: side.clone(),
      up: up.clone(),
      radius: Math.max(0.01, radius),
    });

    if (i === curveRes) break;

    pos.addScaledVector(dir, segmentLen);

    const jitter = rng.v(curveVDeg * DEG / Math.max(1, curveRes));
    const totalRot = segCurve + jitter;
    rotateAroundAxis(dir, side, totalRot);
    rotateAroundAxis(up, side, totalRot);
  }

  return frames;
}

/** Rotate `v` in place around a unit-length `axis` by `angle` radians. */
function rotateAroundAxis(v: Vector3, axis: Vector3, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = v.x * axis.x + v.y * axis.y + v.z * axis.z;
  const cx = axis.y * v.z - axis.z * v.y;
  const cy = axis.z * v.x - axis.x * v.z;
  const cz = axis.x * v.y - axis.y * v.x;
  v.x = v.x * cos + cx * sin + axis.x * dot * (1 - cos);
  v.y = v.y * cos + cy * sin + axis.y * dot * (1 - cos);
  v.z = v.z * cos + cz * sin + axis.z * dot * (1 - cos);
}

/**
 * Emit ring vertices + stitching quads for a branch tube.
 * UV: u wraps the ring, v runs base→tip (kept for future bark texturing).
 */
function emitBranchMesh(frames: Frame[], out: MeshOut): void {
  const baseIndex = out.positions.length / 3;

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    for (let s = 0; s < RING_SEGMENTS; s++) {
      const angle = (s / RING_SEGMENTS) * Math.PI * 2;
      const c = Math.cos(angle);
      const sn = Math.sin(angle);
      const vx = f.pos.x + (f.side.x * c + f.up.x * sn) * f.radius;
      const vy = f.pos.y + (f.side.y * c + f.up.y * sn) * f.radius;
      const vz = f.pos.z + (f.side.z * c + f.up.z * sn) * f.radius;
      out.positions.push(vx, vy, vz);
      const nx = f.side.x * c + f.up.x * sn;
      const ny = f.side.y * c + f.up.y * sn;
      const nz = f.side.z * c + f.up.z * sn;
      out.normals.push(nx, ny, nz);
      out.uvs.push(s / RING_SEGMENTS, i / (frames.length - 1 || 1));
    }
  }

  for (let i = 0; i < frames.length - 1; i++) {
    const r0 = baseIndex + i * RING_SEGMENTS;
    const r1 = baseIndex + (i + 1) * RING_SEGMENTS;
    for (let s = 0; s < RING_SEGMENTS; s++) {
      const sNext = (s + 1) % RING_SEGMENTS;
      const a = r0 + s;
      const b = r0 + sNext;
      const c = r1 + s;
      const d = r1 + sNext;
      // Wind OUTWARD-facing (CCW seen from outside): the previous
      // (a,c,b)/(b,c,d) order produced inward front-face normals, so with
      // FrontSide the trunk rendered inside-out (you saw its inner wall).
      out.indices.push(a, b, c, b, d, c);
    }
  }
}

/* ── Solid canopy blob emitter (textured shell — NOT cards) ─────────── */

interface CanopyOut {
  positions: number[];
  normals: number[];
  colors: number[];
  uvs: number[];
  indices: number[];
}

interface UnitMesh {
  positions: number[];
  indices: number[];
}

/**
 * Unit icosphere generator (recursive midpoint subdivision). Built once at
 * module load and reused for every canopy blob.
 *
 * WHY A SOLID SHELL (and not leaf cards): a flat textured card has no fix
 * for edge-on compression — viewed off its face, its texels collapse into
 * a stretched line ("scanlines"). Cross-cards make it worse (you always
 * see some quads edge-on). A solid closed surface has no thin plane to
 * compress, so the leaf texture reads flat from EVERY angle. This is how
 * BotW/TotK actually build canopies: a lumpy painted shell, not sprites.
 */
function buildIcosphere(subdiv: number): UnitMesh {
  const t = (1 + Math.sqrt(5)) / 2;
  const norm = (v: [number, number, number]): [number, number, number] => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const verts: Array<[number, number, number]> = ([
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ] as Array<[number, number, number]>).map(norm);
  let faces: Array<[number, number, number]> = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let s = 0; s < subdiv; s++) {
    const mid = new Map<number, number>();
    const getMid = (a: number, b: number): number => {
      const key = a < b ? a * 100000 + b : b * 100000 + a;
      const cached = mid.get(key);
      if (cached !== undefined) return cached;
      const va = verts[a];
      const vb = verts[b];
      const m = norm([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]);
      const idx = verts.length;
      verts.push(m);
      mid.set(key, idx);
      return idx;
    };
    const next: Array<[number, number, number]> = [];
    for (const [a, b, c] of faces) {
      const ab = getMid(a, b);
      const bc = getMid(b, c);
      const ca = getMid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }
  const positions: number[] = [];
  for (const v of verts) positions.push(v[0], v[1], v[2]);
  const indices: number[] = [];
  for (const f of faces) {
    // Normalize winding so front faces (and the face-accumulated normals in
    // emitBlob) point OUTWARD. The sphere is centered at the origin, so the
    // outward direction at a face is its centroid; flip the winding if the
    // (b-a)×(c-a) normal opposes it. Without this the canopy renders
    // inside-out (FrontSide culls the outer surface) and lights negated.
    const va = verts[f[0]], vb = verts[f[1]], vc = verts[f[2]];
    const e1x = vb[0] - va[0], e1y = vb[1] - va[1], e1z = vb[2] - va[2];
    const e2x = vc[0] - va[0], e2y = vc[1] - va[1], e2z = vc[2] - va[2];
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const cx = va[0] + vb[0] + vc[0];
    const cy = va[1] + vb[1] + vc[1];
    const cz = va[2] + vb[2] + vc[2];
    if (nx * cx + ny * cy + nz * cz < 0) {
      indices.push(f[0], f[2], f[1]); // reverse winding
    } else {
      indices.push(f[0], f[1], f[2]);
    }
  }
  return { positions, indices };
}

/** Subdivision 1 → 42 verts / 80 faces per blob (≈ 130-170 verts/tree). */
const UNIT_ICOSPHERE = buildIcosphere(1);

/**
 * Emit one solid canopy blob: a squashed, noise-displaced icosphere shell.
 *
 * The opaque leaf texture (`.jpg`) is mapped onto the shell with TRIPLANAR
 * projection in the material (object space) — that's what keeps texel
 * density even on ALL faces, including the vertical sides, where a single
 * top-down planar UV would smear the texture down the silhouette. Object
 * space (not world/screen) means the projection is locked to this static
 * baked mesh, so it cannot "swim". The texture is sampled from position +
 * normal in the shader; the UVs emitted here are vestigial (kept only so
 * `map` enables on the stock WebGL material).
 *
 * Vertex colors are a GENTLE multiplier over the texture — a top-lit
 * brightness ramp plus a faint per-species hue (full palette-as-albedo
 * would crush the texture when multiplied). Per-vertex normals are
 * accumulated from the blob's own faces so the lit material shades it as a
 * smooth volume.
 */
function emitBlob(
  out: CanopyOut,
  center: Vector3,
  radius: number,
  params: BlobTreeParams,
  rng: RNG,
): void {
  const [tr, tg, tb] = params.canopyTopTint;
  const hueMax = Math.max(tr, tg, tb) || 1; // normalized species hue
  const HUE = 0.4;                          // 0 = pure texture, 1 = full hue
  const jitterMul = 1 + rng.v(params.tintJitter);
  const ph0 = rng.random(0, Math.PI * 2);
  const ph1 = rng.random(0, Math.PI * 2);
  const ph2 = rng.random(0, Math.PI * 2);
  const squash = params.blobSquashY;

  const baseVertex = out.positions.length / 3;
  const src = UNIT_ICOSPHERE.positions;
  const vertCount = src.length / 3;

  for (let i = 0; i < vertCount; i++) {
    const dx = src[i * 3];
    const dy = src[i * 3 + 1];
    const dz = src[i * 3 + 2];
    // Smooth multi-frequency radial displacement → organic lumps.
    const disp = params.blobNoiseAmp * (
      0.6 * Math.sin(dx * 3.1 + ph0) * Math.sin(dy * 2.7 + ph1)
      + 0.4 * Math.sin(dz * 4.3 + ph2) * Math.cos(dx * 3.7 + ph0)
    );
    const r = radius * (1 + disp);
    const lx = dx * r;
    const ly = dy * r * squash;
    const lz = dz * r;
    out.positions.push(center.x + lx, center.y + ly, center.z + lz);
    out.normals.push(0, 0, 0); // accumulated from faces below
    out.uvs.push(0, 0);        // vestigial — triplanar samples from position
    // Gentle top-lit brightness × faint species hue, as a MULTIPLIER over
    // the texture (texture color dominates; this only adds form + tint).
    const g = clamp01(dy * 0.5 + 0.6);
    const shade = 0.72 + 0.33 * g; // 0.72 underside → 1.05 top
    out.colors.push(
      clamp01(shade * (1 - HUE + HUE * (tr / hueMax)) * jitterMul),
      clamp01(shade * (1 - HUE + HUE * (tg / hueMax)) * jitterMul),
      clamp01(shade * (1 - HUE + HUE * (tb / hueMax)) * jitterMul),
    );
  }

  const idx = UNIT_ICOSPHERE.indices;
  for (let i = 0; i < idx.length; i++) {
    out.indices.push(baseVertex + idx[i]);
  }

  // Accumulate face normals into this blob's vertex range, then normalize.
  const pos = out.positions;
  const nrm = out.normals;
  for (let i = 0; i < idx.length; i += 3) {
    const ia = baseVertex + idx[i];
    const ib = baseVertex + idx[i + 1];
    const ic = baseVertex + idx[i + 2];
    const ax = pos[ia * 3], ay = pos[ia * 3 + 1], az = pos[ia * 3 + 2];
    const bx = pos[ib * 3], by = pos[ib * 3 + 1], bz = pos[ib * 3 + 2];
    const cx = pos[ic * 3], cy = pos[ic * 3 + 1], cz = pos[ic * 3 + 2];
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    const fnx = e1y * e2z - e1z * e2y;
    const fny = e1z * e2x - e1x * e2z;
    const fnz = e1x * e2y - e1y * e2x;
    nrm[ia * 3] += fnx; nrm[ia * 3 + 1] += fny; nrm[ia * 3 + 2] += fnz;
    nrm[ib * 3] += fnx; nrm[ib * 3 + 1] += fny; nrm[ib * 3 + 2] += fnz;
    nrm[ic * 3] += fnx; nrm[ic * 3 + 1] += fny; nrm[ic * 3 + 2] += fnz;
  }
  for (let v = baseVertex; v < baseVertex + vertCount; v++) {
    const nx = nrm[v * 3], ny = nrm[v * 3 + 1], nz = nrm[v * 3 + 2];
    const l = Math.hypot(nx, ny, nz) || 1;
    nrm[v * 3] = nx / l;
    nrm[v * 3 + 1] = ny / l;
    nrm[v * 3 + 2] = nz / l;
  }
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}


/* ── Per-tree builder ───────────────────────────────────────────────── */

/** Floats per tree in the collider metadata array. */
export const TREE_COLLIDER_STRIDE = 22;

/** Depth (world units) the trunk base is sunk below its sampled terrain
 *  height, so the (now thick, flared) base buries into a slope instead of
 *  floating on the downhill side. Applied to both visual geometry and
 *  colliders so they stay aligned. */
const TREE_SINK = 0.6;
/** Max canopy blob spheres encoded per tree. */
export const TREE_COLLIDER_MAX_BLOBS = 4;

interface TreeColliderScratch {
  trunkHalfHeight: number;
  trunkRadius: number;
  /** Blob centers (tree-local) + radii. */
  blobs: Array<{ x: number; y: number; z: number; r: number }>;
}

/**
 * Build one blob tree: trunk + limbs into `trunkOut`, canopy blobs into
 * `canopyOut`, and collider shapes (tree-local) into the returned scratch.
 */
function buildOneTree(
  params: BlobTreeParams,
  treeSeed: number,
  scale: number,
  trunkOut: MeshOut,
  canopyOut: CanopyOut,
): TreeColliderScratch {
  const rng = new RNG(treeSeed);

  const height = scale * (params.height + rng.v(params.heightV));
  const trunkLen = height * params.trunkFrac;
  const trunkRadius = height * params.trunkRadiusFrac;

  // Trunk — slight random lean direction via curve jitter.
  const trunkFrames = buildFrames(
    new Vector3(0, 0, 0),
    new Vector3(0, 1, 0),
    trunkLen,
    trunkRadius,
    params.trunkTaper,
    params.trunkRings,
    params.trunkCurveDeg,
    params.trunkCurveVDeg,
    rng,
  );
  // Root flare on the base ring.
  trunkFrames[0].radius *= params.rootFlare;
  emitBranchMesh(trunkFrames, trunkOut);

  const trunkTip = trunkFrames[trunkFrames.length - 1];
  const tipRadius = trunkTip.radius;

  const collider: TreeColliderScratch = {
    trunkHalfHeight: trunkLen / 2,
    trunkRadius,
    blobs: [],
  };

  const blobCount = rng.int(params.blobCount[0], params.blobCount[1]);
  const baseBlobRadius = height * params.blobRadiusFrac;

  // Crown layout (the only layout — the old 'stacked' conifer variant was
  // cut): one blob on the trunk top + one at each limb tip.
  const crownBlobR = baseBlobRadius * (1 + rng.v(params.blobRadiusV));
  const crownCenter = new Vector3(
    trunkTip.pos.x,
    trunkTip.pos.y + crownBlobR * params.blobSquashY * 0.55,
    trunkTip.pos.z,
  );
  emitBlob(canopyOut, crownCenter, crownBlobR, params, rng);
  collider.blobs.push({
    x: crownCenter.x, y: crownCenter.y, z: crownCenter.z,
    r: crownBlobR * params.blobSquashY,
  });

  const limbCount = Math.min(
    rng.int(params.limbCount[0], params.limbCount[1]),
    blobCount - 1,
  );
  let rot = rng.random(0, Math.PI * 2);
  for (let k = 0; k < limbCount; k++) {
    // Limb starts in the upper trunk, angles out from vertical.
    const t = 0.7 + 0.25 * rng.random();
    const frameIdx = Math.min(
      trunkFrames.length - 1,
      Math.floor(t * (trunkFrames.length - 1)),
    );
    const f = trunkFrames[frameIdx];

    const spread = (params.limbSpreadDeg + rng.v(10)) * DEG;
    const limbDir = f.dir.clone();
    rotateAroundAxis(limbDir, f.side, spread);
    rotateAroundAxis(limbDir, f.dir, rot);
    limbDir.normalize();
    rot += (120 + rng.v(30)) * DEG;

    const limbLen = height * params.limbLengthFrac * (1 + rng.v(0.2));
    const limbFrames = buildFrames(
      f.pos, limbDir, limbLen, tipRadius * 0.75, 0.6, 2, 12, 10, rng,
    );
    emitBranchMesh(limbFrames, trunkOut);

    const limbTip = limbFrames[limbFrames.length - 1];
    const r = baseBlobRadius * 0.8 * (1 + rng.v(params.blobRadiusV));
    const center = new Vector3(
      limbTip.pos.x,
      limbTip.pos.y + r * params.blobSquashY * 0.4,
      limbTip.pos.z,
    );
    emitBlob(canopyOut, center, r, params, rng);
    if (collider.blobs.length < TREE_COLLIDER_MAX_BLOBS) {
      collider.blobs.push({ x: center.x, y: center.y, z: center.z, r: r * params.blobSquashY });
    }
  }

  return collider;
}

/* ── Top-level worker entry point ───────────────────────────────────── */

export interface BuildTreeDecorationInput {
  /** Tree spawn array: 7 floats per tree
   *  [worldX, worldY, worldZ, scale, rotation, isComplex(unused), treeSeed]. */
  spawns: Float32Array;
  chunkOriginX: number;
  chunkOriginZ: number;
  isMobile: boolean;
  rngSeedSalt: string;
  biomeId?: string;
}

export interface TreeDecorationResult {
  /** `trunks` (lit bark) + `foliage` (solid canopy blob shells: the opaque
   *  leaf texture is triplanar-mapped in the material × a gentle baked
   *  vertex-color tint — same look on WebGPU and WebGL). */
  groups: Record<string, BakedMesh>;
  /**
   * Per-tree collider metadata, TREE_COLLIDER_STRIDE floats per tree,
   * chunk-local coordinates:
   *  [0..2]  trunk base (x, y, z)
   *  [3]     trunk capsule half-height
   *  [4]     trunk capsule radius
   *  [5]     blob count n (≤ TREE_COLLIDER_MAX_BLOBS)
   *  [6..21] n × (centerX, centerY, centerZ, radius)
   */
  treeColliders: Float32Array;
}

/**
 * Build one chunk's worth of blob trees. Geometry identical across
 * devices (no mobile foliage drop — the canopy is cheap now), which also
 * keeps collider placement consistent for multiplayer.
 */
export function buildTreeDecoration(
  input: BuildTreeDecorationInput,
): TreeDecorationResult {
  const { spawns, chunkOriginX, chunkOriginZ, biomeId } = input;
  const STRIDE = 7;
  const treeCount = Math.floor(spawns.length / STRIDE);

  const trunkEntries: MergeEntry[] = [];
  const canopyEntries: MergeEntry[] = [];
  const treeColliders = new Float32Array(treeCount * TREE_COLLIDER_STRIDE);

  for (let i = 0; i < treeCount; i++) {
    const off = i * STRIDE;
    const worldX = spawns[off];
    const worldY = spawns[off + 1];
    const worldZ = spawns[off + 2];
    const scale = spawns[off + 3];
    const rotation = spawns[off + 4];
    // off + 5 = legacy isComplex flag, ignored
    const treeSeed = spawns[off + 6];

    const speciesId: SpeciesId = pickSpecies(biomeId, treeSeed);
    const params = SPECIES[speciesId];

    const trunkOut: MeshOut = { positions: [], normals: [], uvs: [], indices: [] };
    const canopyOut: CanopyOut = { positions: [], normals: [], colors: [], uvs: [], indices: [] };

    const colliderScratch = buildOneTree(params, treeSeed, scale, trunkOut, canopyOut);

    // Per-tree transform: chunk-relative translation + Y rotation. (Scale
    // is already baked into lengths inside buildOneTree.)
    const localX = worldX - chunkOriginX;
    const localZ = worldZ - chunkOriginZ;
    const baseY = worldY - TREE_SINK; // sink the trunk base into the terrain
    const transform = new Matrix4().makeRotationY(rotation);
    transform.setPosition(localX, baseY, localZ);

    trunkEntries.push({
      positions: new Float32Array(trunkOut.positions),
      normals: new Float32Array(trunkOut.normals),
      indices: new Uint32Array(trunkOut.indices),
      uvs: new Float32Array(trunkOut.uvs),
      transform,
      color: params.trunkTint,
    });

    canopyEntries.push({
      positions: new Float32Array(canopyOut.positions),
      normals: new Float32Array(canopyOut.normals),
      indices: new Uint32Array(canopyOut.indices),
      uvs: new Float32Array(canopyOut.uvs),
      transform,
      vertexColors: new Float32Array(canopyOut.colors),
    });

    // Collider metadata — apply the same transform (Y rotation +
    // translation) to the shape centers. Radii are rotation-invariant.
    const cOff = i * TREE_COLLIDER_STRIDE;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    treeColliders[cOff] = localX;
    treeColliders[cOff + 1] = baseY;
    treeColliders[cOff + 2] = localZ;
    treeColliders[cOff + 3] = colliderScratch.trunkHalfHeight;
    treeColliders[cOff + 4] = colliderScratch.trunkRadius;
    treeColliders[cOff + 5] = colliderScratch.blobs.length;
    for (let b = 0; b < colliderScratch.blobs.length && b < TREE_COLLIDER_MAX_BLOBS; b++) {
      const blob = colliderScratch.blobs[b];
      const rx = blob.x * cosR + blob.z * sinR;
      const rz = -blob.x * sinR + blob.z * cosR;
      treeColliders[cOff + 6 + b * 4] = localX + rx;
      treeColliders[cOff + 6 + b * 4 + 1] = baseY + blob.y;
      treeColliders[cOff + 6 + b * 4 + 2] = localZ + rz;
      treeColliders[cOff + 6 + b * 4 + 3] = blob.r;
    }
  }

  return {
    groups: {
      trunks: mergeBuffers(trunkEntries),
      foliage: mergeBuffers(canopyEntries),
    },
    treeColliders,
  };
}
