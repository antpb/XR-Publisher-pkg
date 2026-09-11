/**
 * Ground-patch uniforms — the "dirt-surrounded" decoration feature.
 *
 * A decoration spec with a `groundPatch` (e.g. a campfire) paints a soft
 * circle of dirt onto the terrain around itself and clears grass out of
 * that circle, so it reads as a deliberate clearing rather than an object
 * dropped into the grass.
 *
 * Patch centres are only known on the MAIN THREAD as plugin decorations
 * mount (the terrain worker can't see plugin spawns), so — unlike the
 * worker-built shore-water field — this uses the same mechanism as the
 * terrain footprint darkening (`footprintUniforms.ts`): a small fixed-cap
 * array of world-space circles passed as uniforms and looped in the
 * shader. Patches are sparse (campfires are rare) so the loop stays tiny.
 *
 * Two parallel representations of the SAME backing arrays so both
 * renderer paths can read them:
 *  - TSL `uniformArray`/`uniform` nodes  → WebGPU terrain + grass.
 *  - plain `{ value }` IUniform objects  → WebGL ShaderMaterial terrain +
 *    grass (three accepts a `Vector3[]` as the value of a `vec3 arr[N]`).
 * The `Vector3[]` backing arrays are shared by reference between the two,
 * so a single mutation updates both; only the scalar `count` is mirrored.
 */
import { uniformArray, uniform } from 'three/tsl';
import { Vector3 } from 'three';

/** Max simultaneous patches the shaders loop over. Generous — campfire-
 *  scale decorations are sparse, so this ceiling is effectively never
 *  reached; if it is, the nearest-to-player N are kept. */
export const MAX_GROUND_PATCHES = 24;

// vec3 packed as (worldX, worldZ, radius). radius 0 ⇒ inactive slot.
const _xzr: Vector3[] = [];
// vec3 dirt colour (linear-ish RGB 0..1).
const _rgb: Vector3[] = [];
for (let i = 0; i < MAX_GROUND_PATCHES; i++) {
  _xzr.push(new Vector3(99999, 99999, 0));
  _rgb.push(new Vector3(0.34, 0.26, 0.16));
}

// ── WebGPU (TSL) ──
export const groundPatchXZR = uniformArray(_xzr, 'vec3');
export const groundPatchColor = uniformArray(_rgb, 'vec3');
export const groundPatchCount = uniform(0);

// ── WebGL (plain ShaderMaterial uniforms, sharing the same backing arrays) ──
export const groundPatchXZRUniform = { value: _xzr };
export const groundPatchColorUniform = { value: _rgb };
export const groundPatchCountUniform = { value: 0 };

// ── Registry: every chunk registers its patches under a key. ──
// `radius` is stored SIGNED in the uniform: positive ⇒ clear grass out of
// the circle, negative ⇒ paint dirt but leave grass. Shaders take abs()
// for the dirt mask; the grass shader only clears where radius > 0.
interface PatchData {
  x: number; z: number; radius: number; clearGrass: boolean;
  cr: number; cg: number; cb: number;
}
const _byKey = new Map<string, PatchData[]>();
let _all: PatchData[] = [];
let _playerX = 0;
let _playerZ = 0;
let _lastRepackX = Infinity;
let _lastRepackZ = Infinity;
const _listeners = new Set<() => void>();

const DEFAULT_DIRT: [number, number, number] = [0.34, 0.26, 0.16];

function rebuildAll(): void {
  _all = [];
  for (const list of _byKey.values()) {
    for (const p of list) _all.push(p);
  }
}

function repack(): void {
  let patches = _all;
  if (patches.length > MAX_GROUND_PATCHES) {
    // Keep the N nearest to the player so the shader loop stays small.
    patches = patches
      .map((p) => ({ p, d: (p.x - _playerX) ** 2 + (p.z - _playerZ) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_GROUND_PATCHES)
      .map((e) => e.p);
  }
  const n = Math.min(patches.length, MAX_GROUND_PATCHES);
  for (let i = 0; i < n; i++) {
    const p = patches[i];
    _xzr[i].set(p.x, p.z, p.clearGrass ? p.radius : -p.radius);
    _rgb[i].set(p.cr, p.cg, p.cb);
  }
  for (let i = n; i < MAX_GROUND_PATCHES; i++) {
    _xzr[i].set(99999, 99999, 0);
  }
  groundPatchCount.value = n;
  groundPatchCountUniform.value = n;
  _lastRepackX = _playerX;
  _lastRepackZ = _playerZ;
  _listeners.forEach((l) => l());
}

/** A patch entry as registered by a chunk. */
export interface GroundPatchEntry {
  worldX: number;
  worldZ: number;
  radius: number;
  color?: [number, number, number];
  /** Clear engine grass out of the circle (default true). */
  clearGrass?: boolean;
}

/** Register (or replace) the patches a chunk contributes. */
export function registerGroundPatches(key: string, patches: GroundPatchEntry[]): void {
  if (!patches || patches.length === 0) {
    unregisterGroundPatches(key);
    return;
  }
  _byKey.set(key, patches.map((p) => {
    const c = p.color ?? DEFAULT_DIRT;
    return {
      x: p.worldX, z: p.worldZ, radius: p.radius,
      clearGrass: p.clearGrass !== false,
      cr: c[0], cg: c[1], cb: c[2],
    };
  }));
  rebuildAll();
  repack();
}

export function unregisterGroundPatches(key: string): void {
  if (_byKey.delete(key)) {
    rebuildAll();
    repack();
  }
}

/** Feed the current player position; triggers a nearest-N repack only
 *  when it matters (more patches than slots) and the player has moved a
 *  meaningful distance. Cheap to call every frame. */
export function setGroundPatchPlayer(x: number, z: number): void {
  _playerX = x;
  _playerZ = z;
  if (_all.length <= MAX_GROUND_PATCHES) return;
  const dx = x - _lastRepackX;
  const dz = z - _lastRepackZ;
  if (dx * dx + dz * dz > 100) repack(); // ~10u movement
}

/** True if a world-space point lies inside any active patch (for
 *  clearing other decorations out of a clearing). */
export function isInsideGroundPatch(worldX: number, worldZ: number): boolean {
  for (const p of _all) {
    const dx = worldX - p.x;
    const dz = worldZ - p.z;
    if (dx * dx + dz * dz < p.radius * p.radius) return true;
  }
  return false;
}

/**
 * Drop scatter spawns (trees/boulders/shrubs) that fall inside a ground patch —
 * roads, dirt aprons and campfire clearings clear grass via groundPatch, but the
 * bigger decorations would otherwise grow straight through a road or plaza. The
 * spawn array is `stride`-float records whose chunk-LOCAL X/Z are at [o], [o+2];
 * world position = chunk corner (chunkX*width, chunkZ*height) + local. Returns the
 * same array reference when nothing is filtered (no allocation in the common case).
 */
export function filterSpawnsByPatches(
  spawns: Float32Array,
  stride: number,
  chunkX: number,
  chunkZ: number,
  width: number,
  height: number,
  /** Extra per-point world-space reject test (e.g. near a road, with a margin).
   *  Kept out of this module to avoid a cycle with pathUniforms. */
  extraReject?: (worldX: number, worldZ: number) => boolean,
): Float32Array {
  if ((_all.length === 0 && !extraReject) || !spawns || spawns.length < stride) return spawns;
  // The chunk GROUP sits at the chunk CORNER (chunkX*width, chunkZ*height), so a
  // spawn's world position is corner + chunk-local — exactly what
  // packSpawnObstacles does with these same arrays. (An earlier `+ width/2` here
  // tested half a chunk off, so the road/patch never matched the real tree.)
  const offX = chunkX * width;
  const offZ = chunkZ * height;
  const kept: number[] = [];
  let dropped = false;
  for (let o = 0; o + stride <= spawns.length; o += stride) {
    const wx = offX + spawns[o];
    const wz = offZ + spawns[o + 2];
    if (isInsideGroundPatch(wx, wz) || (extraReject ? extraReject(wx, wz) : false)) {
      dropped = true; continue;
    }
    for (let k = 0; k < stride; k++) kept.push(spawns[o + k]);
  }
  return dropped ? new Float32Array(kept) : spawns;
}

/** Subscribe to patch-set changes (so WebGL materials can refresh their
 *  uniform value references if needed). Returns an unsubscribe fn. */
export function subscribeGroundPatches(listener: () => void): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}
