import { createNoise3D } from 'simplex-noise';
import { alea } from 'seedrandom';
import {
  BufferGeometry, Vector3,
  CatmullRomCurve3, Float32BufferAttribute,
} from 'three';
import { getBiomeAt } from './biomeHelpers';
import { generateMeshFromSDF } from './marchingCubes';

// `isMobile` has deliberately been removed from world-generation code — see
// `cellSize`, `numSamples`, and `maxCount` below. Using a per-device branch
// here shifted the Alea PRNG cursor differently on each client and caused
// the "inside vs outside the mountain" multiplayer divergence bug. Any new
// generative code in this file must not branch on UA.

export type MountainShape = 'conical' | 'ridged' | 'mesa' | 'volcanic';

export interface MountainFeature {
  id: string;
  worldX: number;
  worldZ: number;
  baseRadius: number;
  peakHeight: number;
  shape: MountainShape;
  cavern: CavernNetwork | null;
}

export interface CavernNode {
  id: string;
  position: Vector3;
  radius: number;
  type: 'entrance' | 'room' | 'junction' | 'dead_end';
  connections: string[];
  hasWater: boolean;
  surfacePosition?: Vector3;
  outwardDir?: Vector3;
}

export interface CavernTunnel {
  startNode: string;
  endNode: string;
  radius: number;
  path: Vector3[];
}

export interface CavernNetwork {
  id: string;
  entrances: CavernNode[];
  nodes: Map<string, CavernNode>;
  tunnels: CavernTunnel[];
}

export interface InteriorFill {
  cx: number;
  cy: number;
  cz: number;
  radius: number;
  floorY: number;
  ceilingY: number;
  seed: number;
}

export const REGION_SIZE = 500;
const regionCache = new Map<string, MountainFeature[]>();

// Cap the mountain region cache so exploring far from origin doesn't grow it
// without bound (each entry holds MountainFeatures + their CavernNetworks —
// Maps/Vector3s that otherwise accumulate in the JS heap for the whole
// session, raising GC pressure and worsening frame drops the further you
// travel). FIFO eviction approximates distance eviction since the player
// moves through regions roughly in travel order; an evicted region
// regenerates deterministically (Map preserves insertion order). 256 regions
// ≈ a 128k×128k-unit area cached at once — far beyond any active window.
const MAX_REGION_CACHE = 256;
function setRegionCache(key: string, mountains: MountainFeature[]): void {
  regionCache.set(key, mountains);
  if (regionCache.size > MAX_REGION_CACHE) {
    const oldest = regionCache.keys().next().value;
    if (oldest !== undefined) regionCache.delete(oldest);
  }
}

function selectShape(random: () => number): MountainShape {
  const r = random();
  if (r < 0.35) return 'conical';
  if (r < 0.6) return 'ridged';
  if (r < 0.8) return 'mesa';
  return 'volcanic';
}

function clusterOffset(random: () => number, radius: number): { dx: number; dz: number } {
  const angle = random() * Math.PI * 2;
  const dist = radius * 0.4 + random() * radius * 0.8;
  return { dx: Math.cos(angle) * dist, dz: Math.sin(angle) * dist };
}

function getMountainProfile(t: number, angle: number, shape: MountainShape): number {
  switch (shape) {
    case 'conical':
      return Math.pow(1 - t, 0.45);
    case 'ridged':
      return Math.pow(1 - t, 0.45) * (1 + 0.15 * Math.sin(angle * 3));
    case 'mesa':
      return t < 0.7
        ? 1 - t * 0.2
        : (1 - 0.7 * 0.2) * Math.pow(Math.max(0, 1 - (t - 0.7) / 0.3), 0.5);
    case 'volcanic':
      return t > 0.88
        ? Math.pow(1 - t, 0.45) + 0.15
        : Math.pow(1 - t, 0.45);
    default:
      return Math.pow(1 - t, 0.45);
  }
}

// ─── Cavern generation ───
function generateCavernNetwork(
  mountain: MountainFeature, seed: string
): CavernNetwork | null {
  const random = alea(`${seed}-cavern-${mountain.id}`);
  if (random() > 0.7) return null;

  const entranceCount = 1 + (random() < 0.3 ? 1 : 0);
  const entrances: CavernNode[] = [];
  const nodes = new Map<string, CavernNode>();
  const tunnels: CavernTunnel[] = [];

  for (let e = 0; e < entranceCount; e++) {
    const angle = random() * Math.PI * 2;
    const entranceRadius = 8 + random() * 4;
    const tunnelR = entranceRadius;
    const entranceHeightFrac = 0.06 + random() * 0.06;
    const profileR = getMountainProfile(entranceHeightFrac, angle, mountain.shape) * mountain.baseRadius;
    const surfaceR = profileR + mountain.baseRadius * 0.1;
    const surfaceX = Math.cos(angle) * surfaceR;
    const surfaceZ = Math.sin(angle) * surfaceR;
    const y = entranceHeightFrac * mountain.peakHeight;
    const outDir = new Vector3(Math.cos(angle), 0, Math.sin(angle));

    const entranceNode: CavernNode = {
      id: `entrance-${e}`,
      position: new Vector3(surfaceX, y, surfaceZ),
      radius: entranceRadius,
      type: 'entrance',
      connections: [],
      hasWater: false,
      surfacePosition: new Vector3(surfaceX, y, surfaceZ),
      outwardDir: outDir,
    };
    entrances.push(entranceNode);
    nodes.set(entranceNode.id, entranceNode);

    const roomDist = mountain.baseRadius * (0.2 + random() * 0.15);
    const roomAngle = angle + Math.PI + (random() - 0.5) * 0.6;
    const roomX = Math.cos(roomAngle) * roomDist;
    const roomZ = Math.sin(roomAngle) * roomDist;
    const roomY = Math.max(y - 8 - random() * 6, -mountain.peakHeight * 0.2);
    const roomRadius = 18 + random() * 14;

    const roomNode: CavernNode = {
      id: `room-${e}`,
      position: new Vector3(roomX, roomY, roomZ),
      radius: roomRadius,
      type: 'room',
      connections: [entranceNode.id],
      hasWater: random() < 0.25,
    };
    entranceNode.connections.push(roomNode.id);
    nodes.set(roomNode.id, roomNode);

    const pathLen = Math.sqrt(
      (roomX - surfaceX) ** 2 + (roomY - y) ** 2 + (roomZ - surfaceZ) ** 2
    );

    const mid = new Vector3(
      surfaceX + (roomX - surfaceX) * 0.5 + (random() - 0.5) * pathLen * 0.08,
      y + (roomY - y) * 0.5 - pathLen * 0.02,
      surfaceZ + (roomZ - surfaceZ) * 0.5 + (random() - 0.5) * pathLen * 0.08,
    );
    const midFlatDist = Math.sqrt(mid.x * mid.x + mid.z * mid.z);
    const midLimit = mountain.baseRadius * 0.5;
    if (midFlatDist > midLimit) {
      mid.x *= midLimit / midFlatDist;
      mid.z *= midLimit / midFlatDist;
    }

    tunnels.push({
      startNode: entranceNode.id,
      endNode: roomNode.id,
      radius: tunnelR,
      path: [entranceNode.position.clone(), mid, roomNode.position.clone()],
    });
  }

  return { id: `cavern-${mountain.id}`, entrances, nodes, tunnels };
}

// ─── SDF functions ───

interface RoomDef {
  cx: number; cy: number; cz: number;
  radius: number;
}

function mountainSDF(
  x: number, y: number, z: number,
  mountain: MountainFeature,
  noise3D: (x: number, y: number, z: number) => number
): number {
  const bottomY = -5;
  const r = Math.sqrt(x * x + z * z);
  const angle = Math.atan2(z, x);

  if (y > mountain.peakHeight * 1.05) {
    return Math.sqrt(r * r + (y - mountain.peakHeight) * (y - mountain.peakHeight));
  }

  const t = Math.max(0, Math.min(y / mountain.peakHeight, 1));
  let expectedR = getMountainProfile(t, angle, mountain.shape) * mountain.baseRadius;

  let noiseDisp = 0;
  let amp = mountain.baseRadius * 0.1;
  let freq = 0.03;
  for (let o = 0; o < 3; o++) {
    noiseDisp += noise3D(x * freq, y * freq, z * freq) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  expectedR += noiseDisp;

  const sideSDF = r - expectedR;
  const bottomSDF = bottomY - y;
  return Math.max(sideSDF, bottomSDF);
}


function roomSDF(
  x: number, y: number, z: number,
  room: RoomDef
): number {
  const dx = x - room.cx;
  const dy = y - room.cy;
  const dz = z - room.cz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - room.radius;
}

function interiorTerrainSDF(
  x: number, y: number, z: number,
  fill: InteriorFill,
  noise3D: (x: number, y: number, z: number) => number
): number {
  const dx = x - fill.cx;
  const dz = z - fill.cz;
  const distFromCenter = Math.sqrt(dx * dx + dz * dz);

  const maxR = fill.radius * 0.88;
  if (distFromCenter > maxR) return -1;

  const worldFloor = fill.floorY;
  const roomCeiling = fill.ceilingY;
  const totalHeight = roomCeiling - worldFloor;

  if (y < worldFloor - 2) return -(worldFloor - y);
  if (y > roomCeiling + 2) return -(y - roomCeiling);

  const t = Math.max(0, Math.min(1, (y - worldFloor) / totalHeight));

  const sx = fill.seed * 73.1;
  const sz = fill.seed * 31.7;
  const sy = fill.seed * 17.3;

  const warpFreq = 0.012;
  const warpX = noise3D((x + sx) * warpFreq, (y + sy) * warpFreq, (z + sz + 100) * warpFreq) * 18;
  const warpZ = noise3D((x + sx + 200) * warpFreq, (y + sy) * warpFreq, (z + sz) * warpFreq) * 18;
  const warpY = noise3D((x + sx + 300) * warpFreq, (y + sy) * warpFreq, (z + sz + 400) * warpFreq) * 10;

  const wx = x + sx + warpX;
  const wy = y + sy + warpY;
  const wz = z + sz + warpZ;

  let noiseValue = 0;
  let amplitude = 1.0;
  let frequency = 0.03;
  let maxAmplitude = 0;

  for (let o = 0; o < 6; o++) {
    noiseValue += noise3D(wx * frequency, wy * frequency * 0.55, wz * frequency) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= 0.52;
    frequency *= 2.1;
  }
  noiseValue /= maxAmplitude;

  let ridgeNoise = 0;
  amplitude = 1.0;
  frequency = 0.02;
  maxAmplitude = 0;
  for (let o = 0; o < 4; o++) {
    ridgeNoise += (1.0 - Math.abs(noise3D(wx * frequency * 1.3, wy * frequency * 0.4, wz * frequency * 1.3) * 2)) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  ridgeNoise = ridgeNoise / maxAmplitude - 0.5;

  const combinedNoise = noiseValue * 0.6 + ridgeNoise * 0.4;

  let heightBias: number;

  if (t < 0.3) {
    const ft = t / 0.3;
    heightBias = -0.55 + ft * ft * 0.95;
  } else if (t < 0.65) {
    const mt = (t - 0.3) / 0.35;
    heightBias = 0.4 + mt * 0.2;
  } else {
    const ct = (t - 0.65) / 0.35;
    heightBias = 0.6 - ct * ct * 1.0;
  }

  let sdf = combinedNoise * 0.7 + heightBias;

  const edgeDist = maxR - distFromCenter;
  const edgeBlendWidth = fill.radius * 0.25;
  if (edgeDist < edgeBlendWidth) {
    const edgeFade = edgeDist / edgeBlendWidth;
    const smoothFade = edgeFade * edgeFade * (3 - 2 * edgeFade);
    sdf = sdf * smoothFade - 0.6 * (1 - smoothFade);
  }

  const floorDist = y - worldFloor;
  if (floorDist < 3) {
    const floorFade = Math.max(0, floorDist / 3);
    sdf = sdf * floorFade - (1 - floorFade);
  }

  const ceilingDist = roomCeiling - y;
  if (ceilingDist < 3) {
    const ceilFade = Math.max(0, ceilingDist / 3);
    sdf = sdf * ceilFade - (1 - ceilFade);
  }

  return sdf;
}

function createInteriorFill(
  room: RoomDef,
  random: () => number
): InteriorFill {
  const worldFloorY = -5;

  return {
    cx: room.cx,
    cy: room.cy,
    cz: room.cz,
    radius: room.radius,
    floorY: worldFloorY,
    ceilingY: room.cy + room.radius * 1.1,
    seed: random() * 1000,
  };
}

// Cheap mountainSDF without noise — used for neighboring mountains in the union
function mountainSDFNoNoise(
  lx: number, ly: number, lz: number,
  m: MountainFeature
): number {
  const bottomY = -5;
  const r = Math.sqrt(lx * lx + lz * lz);
  const angle = Math.atan2(lz, lx);
  if (ly > m.peakHeight * 1.05) {
    return Math.sqrt(r * r + (ly - m.peakHeight) * (ly - m.peakHeight));
  }
  const t = Math.max(0, Math.min(ly / m.peakHeight, 1));
  const expectedR = getMountainProfile(t, angle, m.shape) * m.baseRadius;
  const sideSDF = r - expectedR;
  const bottomSDF = bottomY - ly;
  return Math.max(sideSDF, bottomSDF);
}

/**
 * Mountain-LOCAL surface height at a local (lx, lz) — ray-marches the
 * (no-noise) SDF straight down to find where the walkable surface is.
 * Returns the local Y of the surface, or -Infinity if the column never
 * enters the mountain. Used to seat `anchor:'mountain'` decorations on the
 * REAL summit instead of a guessed `peakHeight`. (No-noise, so it's within
 * the mesh's noise amplitude of the visible surface — a few units, vs the
 * tens of units the old heightfield estimate was off.)
 */
export function getMountainSurfaceLocalY(
  mountain: MountainFeature, lx: number, lz: number,
): number {
  const top = mountain.peakHeight * 1.1;
  const bottom = -6;
  const step = Math.max(0.2, mountain.peakHeight * 0.01);
  let prev = mountainSDFNoNoise(lx, top, lz, mountain);
  for (let y = top - step; y >= bottom; y -= step) {
    const d = mountainSDFNoNoise(lx, y, lz, mountain);
    if (d <= 0 && prev > 0) {
      const f = prev / (prev - d); // 0..1 from (y+step) down toward y
      return (y + step) - f * step;
    }
    prev = d;
  }
  return -Infinity;
}

interface NeighborMountain {
  mountain: MountainFeature;
  offsetX: number;
  offsetZ: number;
}

function combinedSDF(
  x: number, y: number, z: number,
  mountain: MountainFeature,
  noise3D: (x: number, y: number, z: number) => number,
  neighbors: NeighborMountain[],
  interiorFills: InteriorFill[],
  roomDefs: RoomDef[]
): number {
  let mountainDist = mountainSDF(x, y, z, mountain, noise3D);
  for (const nb of neighbors) {
    const lx = x - nb.offsetX;
    const lz = z - nb.offsetZ;
    const nbSDF = mountainSDFNoNoise(lx, y, lz, nb.mountain);
    mountainDist = Math.min(mountainDist, nbSDF);
  }

  if (interiorFills.length === 0) return mountainDist;

  const shellHard = 8.0;
  const shellBlend = 6.0;

  if (mountainDist > -shellHard) {
    return mountainDist;
  }

  let carved = mountainDist;
  for (const room of roomDefs) {
    const rSDF = roomSDF(x, y, z, room);
    carved = Math.max(carved, -rSDF);
  }

  let interiorValue = carved;
  let inFillRegion = false;

  for (let i = 0; i < interiorFills.length; i++) {
    const fill = interiorFills[i];
    const fdx = x - fill.cx;
    const fdz = z - fill.cz;
    const distFromCenter = Math.sqrt(fdx * fdx + fdz * fdz);

    if (distFromCenter < fill.radius * 0.88) {
      inFillRegion = true;
      interiorValue = interiorTerrainSDF(x, y, z, fill, noise3D);
      break;
    }
  }

  if (mountainDist > -(shellHard + shellBlend)) {
    const blendT = (-mountainDist - shellHard) / shellBlend;
    const smoothT = blendT * blendT * (3 - 2 * blendT);
    return mountainDist * (1 - smoothT) + interiorValue * smoothT;
  }

  if (inFillRegion) {
    return interiorValue;
  }

  return carved;
}

/**
 * All mountains in the same overlap cluster as `mountain` — the transitive
 * connected component where mountains are linked when their base discs overlap
 * (centre distance < rA + rB). Sorted by id (deterministic across clients).
 *
 * The first member is the cluster "primary": the ONLY mountain that renders a
 * mesh for the cluster. Its mesh unions every member and spans bounds covering
 * all of them, so an overlapping group becomes ONE merged solid. That removes
 * both the double-draw z-fighting (no two meshes share a surface) and the
 * "can't exit" trap (no second mesh's shell crosses a doorway on a misaligned
 * sample grid). Non-primary members render nothing (their caverns are carved
 * into the primary's merged mesh; their CavernSystem floors still render).
 */
export function getMountainClusterMembers(
  mountain: MountainFeature,
  allMountains: MountainFeature[]
): MountainFeature[] {
  const byId = new Map(allMountains.map((m) => [m.id, m]));
  const visited = new Set<string>([mountain.id]);
  const queue: string[] = [mountain.id];
  const members: MountainFeature[] = [];
  while (queue.length) {
    const cur = byId.get(queue.shift()!);
    if (!cur) continue;
    members.push(cur);
    for (const other of allMountains) {
      if (visited.has(other.id)) continue;
      const dx = other.worldX - cur.worldX;
      const dz = other.worldZ - cur.worldZ;
      if (Math.sqrt(dx * dx + dz * dz) < cur.baseRadius + other.baseRadius) {
        visited.add(other.id);
        queue.push(other.id);
      }
    }
  }
  members.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return members;
}

/** True if `mountain` is the primary (lowest-id member) of its overlap cluster
 *  — the one mountain that should render the cluster's merged mesh. */
export function isMountainClusterPrimary(
  mountain: MountainFeature,
  allMountains: MountainFeature[]
): boolean {
  const members = getMountainClusterMembers(mountain, allMountains);
  return members.length === 0 || members[0].id === mountain.id;
}

// ─── Mountain mesh via marching cubes ───
export function createMountainGeometry(
  mountain: MountainFeature,
  seed: string,
  allMountains: MountainFeature[]
): BufferGeometry {
  const noise3D = createNoise3D(alea(`${seed}-${mountain.id}-noise`));
  const fillRandom = alea(`${seed}-${mountain.id}-fills`);

  // Only the cluster's primary reaches mesh generation (MountainMesh skips
  // non-primaries). Build the merged mesh from the whole overlap cluster:
  // union every member's shape, carve every member's caverns/doorways.
  const clusterMembers = getMountainClusterMembers(mountain, allMountains);

  const roomDefs: RoomDef[] = [];
  const deletionSpheres: { x: number; y: number; z: number; rSq: number }[] = [];
  const neighbors: NeighborMountain[] = [];
  const interiorFills: InteriorFill[] = [];

  for (const m of clusterMembers) {
    const offsetX = m.worldX - mountain.worldX;
    const offsetZ = m.worldZ - mountain.worldZ;

    if (m.id !== mountain.id) {
      // Union this cluster member into the primary's mesh (one merged solid).
      neighbors.push({ mountain: m, offsetX, offsetZ });
    }

    if (!m.cavern) continue;

    const entrance = m.cavern.entrances[0];
    if (entrance) {
      const outwardOffset = 2;
      const verticalOffset = 2.5;
      
      const outDir = entrance.outwardDir;
      const ex = entrance.position.x + offsetX + (outDir ? outDir.x * outwardOffset : 0);
      const ey = entrance.position.y + verticalOffset;
      const ez = entrance.position.z + offsetZ + (outDir ? outDir.z * outwardOffset : 0);
      const delR = entrance.radius * 1.5;
      deletionSpheres.push({
        x: ex, y: ey, z: ez,
        rSq: delR * delR,
      });
    }

    for (const node of m.cavern.nodes.values()) {
      if (node.type === 'room' || node.type === 'junction') {
        const roomDef = {
          cx: node.position.x + offsetX,
          cy: node.position.y,
          cz: node.position.z + offsetZ,
          radius: node.radius,
        };
        roomDefs.push(roomDef);
        
        const fill = createInteriorFill(roomDef, fillRandom);
        interiorFills.push(fill);
      }
    }

  }

  // Mountain marching-cubes sampling grid. MUST be identical on every client
  // in the same world — a coarser grid on mobile produced a different mesh
  // shape (and subtly different internal cavern carving) that made avatars
  // appear "inside" or "outside" the mountain depending on device. Multiplayer
  // coherence requires a single cellSize regardless of UA.
  const cellSize = 2.5;
  const pad = mountain.baseRadius * 0.15;
  // Bounds must span the entire cluster (in primary-local coords) so the
  // merged marching-cubes grid covers every member, not just the primary.
  let bMinX = -(mountain.baseRadius + pad);
  let bMaxX = mountain.baseRadius + pad;
  let bMinZ = -(mountain.baseRadius + pad);
  let bMaxZ = mountain.baseRadius + pad;
  let bMaxY = mountain.peakHeight * 1.05;
  for (const m of clusterMembers) {
    if (m.id === mountain.id) continue;
    const ox = m.worldX - mountain.worldX;
    const oz = m.worldZ - mountain.worldZ;
    const mr = m.baseRadius * 1.15;
    bMinX = Math.min(bMinX, ox - mr);
    bMaxX = Math.max(bMaxX, ox + mr);
    bMinZ = Math.min(bMinZ, oz - mr);
    bMaxZ = Math.max(bMaxZ, oz + mr);
    bMaxY = Math.max(bMaxY, m.peakHeight * 1.05);
  }
  const boundsMin: [number, number, number] = [bMinX, -6, bMinZ];
  const boundsMax: [number, number, number] = [bMaxX, bMaxY, bMaxZ];

  const sdf = (x: number, y: number, z: number) =>
    combinedSDF(x, y, z, mountain, noise3D, neighbors, interiorFills, roomDefs);

  const mountainOnlySDF = (x: number, y: number, z: number) =>
    mountainSDF(x, y, z, mountain, noise3D);

  const colorFn = (vx: number, vy: number, vz: number): [number, number, number] => {
    const mOnly = mountainOnlySDF(vx, vy, vz);
    const nc = noise3D(vx * 0.08, vy * 0.08, vz * 0.08) * 0.04;
    const fineNoise = noise3D(vx * 0.25, vy * 0.25, vz * 0.25) * 0.02;

    const interiorThreshold = -cellSize * 0.5;
    const isInterior = mOnly < interiorThreshold;
    
    if (isInterior) {
      const depth = Math.min(1.0, Math.abs(mOnly) / 20.0);
      const rockNoise = Math.sin(vx * 1.3 + vy * 2.1) * Math.sin(vz * 0.7 + vx * 1.8) * 0.5 + 0.5;
      
      const darknessFactor = 0.15 + (1 - depth) * 0.25;
      
      const baseR = 0.18 + rockNoise * 0.08;
      const baseG = baseR * 0.75;
      const baseB = baseR * 0.55;
      
      return [
        baseR * darknessFactor + nc + fineNoise,
        baseG * darknessFactor + nc * 0.8 + fineNoise,
        baseB * darknessFactor + nc * 0.6 + fineNoise
      ];
    }

    const t = Math.max(0, vy / mountain.peakHeight);
    if (t < 0.2) return [0.38 + nc, 0.32 + nc, 0.22 + nc];
    if (t < 0.5) { const b = (t - 0.2) / 0.3; return [0.38 + b * 0.12 + nc, 0.32 + b * 0.13 + nc, 0.22 + b * 0.18 + nc]; }
    if (t < 0.8) { const b = (t - 0.5) / 0.3; return [0.50 + b * 0.15 + nc, 0.45 + b * 0.15 + nc, 0.40 + b * 0.18 + nc]; }
    const b = (t - 0.8) / 0.2;
    return [0.65 + b * 0.25 + nc, 0.60 + b * 0.28 + nc, 0.58 + b * 0.30 + nc];
  };

  const depthFn = (vx: number, vy: number, vz: number): number => {
    const mOnly = mountainOnlySDF(vx, vy, vz);
    if (mOnly >= -cellSize * 0.5) return 0.0;
    return Math.min(1.0, Math.abs(mOnly) / 25.0);
  };

  const geo = generateMeshFromSDF(boundsMin, boundsMax, cellSize, sdf, colorFn, depthFn);

  if (!geo) {
    const fallback = new BufferGeometry();
    fallback.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
    fallback.setAttribute('color', new Float32BufferAttribute([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 3));
    fallback.setIndex([0, 1, 2]);
    return fallback;
  }

  if (deletionSpheres.length > 0 && geo.index) {
    const pos = geo.attributes.position;
    const oldIdx = geo.index.array;
    const newIdx: number[] = [];

    for (let i = 0; i < oldIdx.length; i += 3) {
      const i0 = oldIdx[i], i1 = oldIdx[i + 1], i2 = oldIdx[i + 2];
      const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
      const cy = (pos.getY(i0) + pos.getY(i1) + pos.getY(i2)) / 3;
      const cz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;

      let kill = false;
      for (const s of deletionSpheres) {
        const dx = cx - s.x;
        const dy = cy - s.y;
        const dz = cz - s.z;
        if (dx * dx + dy * dy + dz * dz < s.rSq) {
          kill = true;
          break;
        }
      }

      if (!kill) {
        newIdx.push(i0, i1, i2);
      }
    }

    geo.setIndex(newIdx);
  }

  return geo;
}

/**
 * Flatten a mountain + its neighborhood into a plain, JSON-serializable
 * params object for the WASM `generate_mountain_mesh` export.
 *
 * This replicates the exact preprocessing `createMountainGeometry` does
 * (neighbors / room defs / interior fills / deletion spheres), INCLUDING the
 * `createInteriorFill` Alea draw — which must stay in JS so the
 * `${seed}-${id}-fills` PRNG cursor is consumed in the same order on every
 * client (the WASM path is a pure function of these params). The Rust side
 * generates the actual SDF + marching-cubes mesh.
 *
 * Keep this in lockstep with the preprocessing block of
 * `createMountainGeometry` above — if one changes, change both.
 */
export function buildMountainMeshParams(
  mountain: MountainFeature,
  seed: string,
  allMountains: MountainFeature[]
): {
  seed: string;
  mountainId: string;
  baseRadius: number;
  peakHeight: number;
  shape: MountainShape;
  neighbors: Array<{ peakHeight: number; baseRadius: number; shape: MountainShape; offsetX: number; offsetZ: number }>;
  roomDefs: Array<{ cx: number; cy: number; cz: number; radius: number }>;
  interiorFills: InteriorFill[];
  deletionSpheres: Array<{ x: number; y: number; z: number; rSq: number }>;
  boundsMin: [number, number, number];
  boundsMax: [number, number, number];
} {
  const fillRandom = alea(`${seed}-${mountain.id}-fills`);

  // Same cluster logic as createMountainGeometry — keep in lockstep.
  const clusterMembers = getMountainClusterMembers(mountain, allMountains);

  const neighbors: Array<{ peakHeight: number; baseRadius: number; shape: MountainShape; offsetX: number; offsetZ: number }> = [];
  const roomDefs: Array<{ cx: number; cy: number; cz: number; radius: number }> = [];
  const interiorFills: InteriorFill[] = [];
  const deletionSpheres: Array<{ x: number; y: number; z: number; rSq: number }> = [];

  for (const m of clusterMembers) {
    const offsetX = m.worldX - mountain.worldX;
    const offsetZ = m.worldZ - mountain.worldZ;

    if (m.id !== mountain.id) {
      neighbors.push({
        peakHeight: m.peakHeight,
        baseRadius: m.baseRadius,
        shape: m.shape,
        offsetX,
        offsetZ,
      });
    }

    if (!m.cavern) continue;

    const entrance = m.cavern.entrances[0];
    if (entrance) {
      const outwardOffset = 2;
      const verticalOffset = 2.5;
      const outDir = entrance.outwardDir;
      const ex = entrance.position.x + offsetX + (outDir ? outDir.x * outwardOffset : 0);
      const ey = entrance.position.y + verticalOffset;
      const ez = entrance.position.z + offsetZ + (outDir ? outDir.z * outwardOffset : 0);
      const delR = entrance.radius * 1.5;
      deletionSpheres.push({ x: ex, y: ey, z: ez, rSq: delR * delR });
    }

    for (const node of m.cavern.nodes.values()) {
      if (node.type === 'room' || node.type === 'junction') {
        const roomDef = {
          cx: node.position.x + offsetX,
          cy: node.position.y,
          cz: node.position.z + offsetZ,
          radius: node.radius,
        };
        roomDefs.push(roomDef);
        // Consumes one fillRandom() — order-sensitive, must match
        // createMountainGeometry exactly.
        interiorFills.push(createInteriorFill(roomDef, fillRandom));
      }
    }
  }

  // Cluster-spanning bounds (must match createMountainGeometry exactly).
  const pad = mountain.baseRadius * 0.15;
  let bMinX = -(mountain.baseRadius + pad);
  let bMaxX = mountain.baseRadius + pad;
  let bMinZ = -(mountain.baseRadius + pad);
  let bMaxZ = mountain.baseRadius + pad;
  let bMaxY = mountain.peakHeight * 1.05;
  for (const m of clusterMembers) {
    if (m.id === mountain.id) continue;
    const ox = m.worldX - mountain.worldX;
    const oz = m.worldZ - mountain.worldZ;
    const mr = m.baseRadius * 1.15;
    bMinX = Math.min(bMinX, ox - mr);
    bMaxX = Math.max(bMaxX, ox + mr);
    bMinZ = Math.min(bMinZ, oz - mr);
    bMaxZ = Math.max(bMaxZ, oz + mr);
    bMaxY = Math.max(bMaxY, m.peakHeight * 1.05);
  }

  return {
    seed,
    mountainId: mountain.id,
    baseRadius: mountain.baseRadius,
    peakHeight: mountain.peakHeight,
    shape: mountain.shape,
    neighbors,
    roomDefs,
    interiorFills,
    deletionSpheres,
    boundsMin: [bMinX, -6, bMinZ],
    boundsMax: [bMaxX, bMaxY, bMaxZ],
  };
}

// ─── Cavern interior geometry (floors only — walls come from marching cubes) ───

function createFloorStrip(path: Vector3[], tunnelRadius: number): BufferGeometry {
  if (path.length < 2) return new BufferGeometry();
  const curve = new CatmullRomCurve3(path);
  // Cavern path sampling count. Must match across devices — otherwise the
  // cavern carved through the mountain SDF shifts and the mountain surface
  // tilts in ways that diverge between clients.
  const numSamples = Math.max(10, path.length * 3);
  const floorWidth = tunnelRadius * 1.8;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    let rx = -tangent.z, rz = tangent.x;
    const rLen = Math.sqrt(rx * rx + rz * rz);
    if (rLen > 0.001) { rx /= rLen; rz /= rLen; } else { rx = 1; rz = 0; }
    const floorY = point.y - tunnelRadius * 0.82;
    positions.push(point.x - rx * floorWidth * 0.5, floorY, point.z - rz * floorWidth * 0.5);
    normals.push(0, 1, 0);
    positions.push(point.x + rx * floorWidth * 0.5, floorY, point.z + rz * floorWidth * 0.5);
    normals.push(0, 1, 0);
    const noise = Math.sin(point.x * 1.1 + point.z * 0.7) * 0.04;
    const base = 0.48 + noise;
    colors.push(base, base * 0.82, base * 0.58);
    colors.push(base + 0.02, base * 0.84, base * 0.6);
  }
  for (let i = 0; i < numSamples; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

export function createCavernGeometries(network: CavernNetwork): {
  tunnelFloorGeometries: BufferGeometry[];
  roomFloors: { position: [number, number, number]; radius: number }[];
} {
  const tunnelFloorGeometries: BufferGeometry[] = [];
  const roomFloors: { position: [number, number, number]; radius: number }[] = [];

  for (const tunnel of network.tunnels) {
    if (tunnel.path.length < 2) continue;
    tunnelFloorGeometries.push(createFloorStrip(tunnel.path, tunnel.radius));
  }

  for (const node of network.nodes.values()) {
    if (node.type === 'room' || node.type === 'junction') {
      roomFloors.push({
        position: [node.position.x, node.position.y - node.radius * 0.7, node.position.z],
        radius: node.radius * 0.9,
      });
    }
  }
  return { tunnelFloorGeometries, roomFloors };
}

// ─── Mountain placement ───

export function generateMountainsForRegion(
  regionX: number, regionZ: number, seed: string
): MountainFeature[] {
  const key = `${seed}-${regionX}-${regionZ}`;
  if (regionCache.has(key)) return regionCache.get(key)!;
  const random = alea(`${seed}-mountains-${regionX}-${regionZ}`);
  const mountains: MountainFeature[] = [];
  // Mountain count per region. Using different caps for mobile vs desktop
  // made the Alea PRNG consume different numbers of random() values, which
  // desynchronised every downstream draw (biome picks, tree positions, …).
  // Keep a single cap so all clients agree on where mountains are.
  const maxCount = 3;
  const count = 1 + Math.floor(random() * maxCount);
  const clusterCount = Math.max(1, Math.floor(count / 2));
  const clusterAnchors: { x: number; z: number }[] = [];
  for (let c = 0; c < clusterCount; c++) {
    const ax = regionX * REGION_SIZE + random() * REGION_SIZE;
    const az = regionZ * REGION_SIZE + random() * REGION_SIZE;
    const biome = getBiomeAt(ax, az, seed);
    if (biome.id !== 'mountains' && biome.id !== 'default') continue;
    clusterAnchors.push({ x: ax, z: az });
  }
  if (clusterAnchors.length === 0) { setRegionCache(key, mountains); return mountains; }
  for (let i = 0; i < count; i++) {
    const anchor = clusterAnchors[i % clusterAnchors.length];
    let wx: number, wz: number;
    if (i < clusterAnchors.length) { wx = anchor.x; wz = anchor.z; }
    else { const off = clusterOffset(random, 60 + random() * 40); wx = anchor.x + off.dx; wz = anchor.z + off.dz; }
    const biome = getBiomeAt(wx, wz, seed);
    if (biome.id !== 'mountains' && biome.id !== 'default') continue;
    if (random() > (biome.id === 'mountains' ? 0.8 : 0.25)) continue;
    const baseRadius = 50 + random() * 70;
    const peakHeight = 35 + random() * 55;
    const mountain: MountainFeature = {
      id: `mountain-${regionX}-${regionZ}-${i}`,
      worldX: wx, worldZ: wz, baseRadius, peakHeight,
      shape: selectShape(random), cavern: null,
    };
    mountain.cavern = generateCavernNetwork(mountain, seed);
    mountains.push(mountain);
  }
  setRegionCache(key, mountains);
  return mountains;
}

export function getMountainsNearChunk(
  gridX: number, gridZ: number,
  chunkWidth: number, chunkHeight: number,
  seed: string, searchRadius: number = 200
): MountainFeature[] {
  const cx = gridX * chunkWidth;
  const cz = gridZ * chunkHeight;
  const minRX = Math.floor((cx - searchRadius) / REGION_SIZE);
  const maxRX = Math.floor((cx + searchRadius) / REGION_SIZE);
  const minRZ = Math.floor((cz - searchRadius) / REGION_SIZE);
  const maxRZ = Math.floor((cz + searchRadius) / REGION_SIZE);
  const results: MountainFeature[] = [];
  const seen = new Set<string>();
  for (let rx = minRX; rx <= maxRX; rx++) {
    for (let rz = minRZ; rz <= maxRZ; rz++) {
      for (const m of generateMountainsForRegion(rx, rz, seed)) {
        if (seen.has(m.id)) continue;
        const dx = m.worldX - cx; const dz = m.worldZ - cz;
        if (Math.sqrt(dx * dx + dz * dz) < searchRadius + m.baseRadius) { results.push(m); seen.add(m.id); }
      }
    }
  }
  return results;
}

export function getMountainBaseInfluence(
  worldX: number, worldZ: number, mountains: MountainFeature[]
): number {
  let influence = 0;
  for (const m of mountains) {
    const dx = worldX - m.worldX;
    const dz = worldZ - m.worldZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < m.baseRadius * 0.85) {
      const t = dist / (m.baseRadius * 0.85);
      const suppress = (1 - t) * (1 - t);
      influence -= suppress * m.peakHeight * 1.5;
    }

    const maxDist = m.baseRadius * 1.8;
    if (dist < maxDist) {
      const t = dist / maxDist;
      influence += (1 - t) * (1 - t) * (1 - t) * m.peakHeight * 0.25;
    }

    if (m.cavern) {
      for (const entrance of m.cavern.entrances) {
        const sp = entrance.surfacePosition || entrance.position;
        const od = entrance.outwardDir;
        if (!od) continue;
        const ewx = m.worldX + sp.x;
        const ewz = m.worldZ + sp.z;
        const toPointX = worldX - ewx;
        const toPointZ = worldZ - ewz;
        const alongOut = toPointX * od.x + toPointZ * od.z;
        const perpX = toPointX - alongOut * od.x;
        const perpZ = toPointZ - alongOut * od.z;
        const perpDist = Math.sqrt(perpX * perpX + perpZ * perpZ);
        const rampLength = entrance.radius * 4;
        const rampWidth = entrance.radius * 1.5;
        if (alongOut > -entrance.radius && alongOut < rampLength && perpDist < rampWidth) {
          const along01 = Math.max(0, alongOut) / rampLength;
          const perp01 = perpDist / rampWidth;
          const rampBlend = (1 - along01) * (1 - perp01 * perp01);
          influence -= rampBlend * m.peakHeight * 0.15;
        }
      }
    }
  }
  return influence;
}

export function isInsideCavern(
  playerX: number, playerY: number, playerZ: number,
  mountains: MountainFeature[], terrainPosY: number
): { inside: boolean; mountainId: string | null; transition: boolean } {
  for (const m of mountains) {
    if (!m.cavern) continue;
    for (const node of m.cavern.nodes.values()) {
      const nx = m.worldX + node.position.x;
      const ny = terrainPosY - 3 + node.position.y;
      const nz = m.worldZ + node.position.z;
      const dx = playerX - nx;
      const dy = playerY - ny;
      const dz = playerZ - nz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (node.type === 'entrance' && dist < node.radius * 3) return { inside: false, mountainId: m.id, transition: true };
      if (dist < node.radius * 1.5) return { inside: true, mountainId: m.id, transition: false };
    }
  }
  return { inside: false, mountainId: null, transition: false };
}

export function clearWorldCache(): void { regionCache.clear(); }

export function getDeletionSpheresDebug(
  mountain: MountainFeature,
  allMountains: MountainFeature[]
): { x: number; y: number; z: number; rSq: number }[] {
  const result: { x: number; y: number; z: number; rSq: number }[] = [];

  for (const m of allMountains) {
    if (!m.cavern) continue;
    const offsetX = m.worldX - mountain.worldX;
    const offsetZ = m.worldZ - mountain.worldZ;

    const entrance = m.cavern.entrances[0];
    if (entrance) {
      const outwardOffset = 2.5;
      const verticalOffset = 2.5;
      
      const outDir = entrance.outwardDir;
      const delR = entrance.radius * 1.5;
      result.push({
        x: entrance.position.x + offsetX + (outDir ? outDir.x * outwardOffset : 0),
        y: entrance.position.y + verticalOffset,
        z: entrance.position.z + offsetZ + (outDir ? outDir.z * outwardOffset : 0),
        rSq: delR * delR,
      });
    }
  }

  return result;
}
