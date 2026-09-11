// Persistent NPC simulation worker.
//
// Owns the navmesh AND the per-NPC agents: the voxel navmesh build, spawn/
// wander point sampling (against a mirrored obstacle registry), smooth-path
// generation, and per-tick steering (findNearestPoly + moveAlongSurface) all
// run here. The navmesh never crosses the thread boundary — the old design
// structured-cloned the entire navMesh object back to the main thread on
// every rebuild solely so path queries could run there.
//
// Geometry arrives as raw per-chunk attribute arrays + world matrices; the
// per-vertex world transform and the underwater-triangle filter also happen
// here instead of on the main thread.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as Nav from 'navcat';

type Vec3 = [number, number, number];
type Box3 = [Vec3, Vec3];

export interface NavBuildOptions {
  walkableSlopeAngle: number;
  cellSize: number;
  cellHeight: number;
  walkableClimb: number;
  walkableHeight: number;
  walkableRadius: number;
  minRegionArea: number;
  mergeRegionArea: number;
  maxSimplificationError: number;
  maxEdgeLength: number;
  sampleDist: number;
  sampleMaxError: number;
  maxVerticesPerPoly: number;
}

export interface NavChunkGeometry {
  /** Chunk-local vertex positions (copied from the BufferAttribute). */
  positions: Float32Array;
  /** Triangle indices (empty array = non-indexed: sequential triples). */
  indices: Uint32Array;
  /** matrixWorld elements (column-major, 16 floats). */
  matrix: Float64Array;
}

export type NavSimRequest =
  | { type: 'build'; id: number; chunks: NavChunkGeometry[]; options: NavBuildOptions; waterY: number }
  | { type: 'obstacles'; chunkKey: string; packed: Float32Array }
  | { type: 'obstacles_remove'; chunkKey: string }
  | { type: 'water'; y: number }
  | { type: 'spawn_request'; id: number }
  | { type: 'path_request'; npcId: string; x: number; y: number; z: number; radius: number }
  | { type: 'tick'; npcId: string; dt: number; speed: number }
  | { type: 'stop_agent'; npcId: string }
  | { type: 'remove_agent'; npcId: string };

export type NavSimResponse =
  | { type: 'build_done'; id: number; ok: boolean; error?: string }
  | { type: 'spawn_point'; id: number; ok: boolean; x?: number; y?: number; z?: number }
  | { type: 'path_ready'; npcId: string; ok: boolean }
  | { type: 'agent_state'; npcId: string; x: number; y: number; z: number; targetAngle: number; moving: boolean; reachedEnd: boolean };

interface Agent {
  position: Vec3;
  path: Vec3[];
  targetIndex: number;
  moving: boolean;
  targetAngle: number;
}

let navMesh: Nav.NavMesh | null = null;
const agents = new Map<string, Agent>();
const obstacles = new Map<string, Float32Array>();
let waterLevelY = -Infinity;

const post = (msg: NavSimResponse) => (self as unknown as Worker).postMessage(msg);

/** Mirror of npcObstacles.isNpcPointClear on the main thread. */
function isPointClear(x: number, y: number, z: number): boolean {
  if (y < waterLevelY + 0.35) return false;
  for (const packed of obstacles.values()) {
    for (let i = 0; i + 2 < packed.length; i += 3) {
      const dx = x - packed[i];
      const dz = z - packed[i + 1];
      const r = packed[i + 2];
      if (dx * dx + dz * dz < r * r) return false;
    }
  }
  return true;
}

function getAgent(npcId: string): Agent {
  let agent = agents.get(npcId);
  if (!agent) {
    agent = { position: [0, 0, 0], path: [], targetIndex: 0, moving: false, targetAngle: 0 };
    agents.set(npcId, agent);
  }
  return agent;
}

/** Transform each chunk into world space, concatenate, and drop triangles
 *  that touch water. Returns null when nothing walkable remains. */
function assembleGeometry(
  chunks: NavChunkGeometry[],
  waterY: number,
): [Float32Array, Uint32Array] | null {
  let totalVerts = 0;
  let totalIndices = 0;
  for (const c of chunks) {
    const verts = c.positions.length / 3;
    totalVerts += verts;
    totalIndices += c.indices.length > 0 ? c.indices.length : verts;
  }
  if (totalVerts === 0) return null;

  const positions = new Float32Array(totalVerts * 3);
  const rawIndices = new Uint32Array(totalIndices);
  let posWrite = 0;
  let idxWrite = 0;
  let vertexOffset = 0;

  for (const c of chunks) {
    const m = c.matrix;
    const src = c.positions;
    for (let i = 0; i < src.length; i += 3) {
      const x = src[i], y = src[i + 1], z = src[i + 2];
      positions[posWrite++] = m[0] * x + m[4] * y + m[8] * z + m[12];
      positions[posWrite++] = m[1] * x + m[5] * y + m[9] * z + m[13];
      positions[posWrite++] = m[2] * x + m[6] * y + m[10] * z + m[14];
    }
    if (c.indices.length > 0) {
      for (let i = 0; i < c.indices.length; i++) {
        rawIndices[idxWrite++] = c.indices[i] + vertexOffset;
      }
    } else {
      const verts = src.length / 3;
      for (let i = 0; i < verts; i++) {
        rawIndices[idxWrite++] = vertexOffset + i;
      }
    }
    vertexOffset += src.length / 3;
  }

  // Drop triangles that touch water — excluding them from the build input
  // makes every downstream query (spawn, wander, path) water-free for free.
  let indices = rawIndices;
  if (waterY > -1e8) {
    const cutoff = waterY + 0.2;
    const kept = new Uint32Array(rawIndices.length);
    let k = 0;
    for (let t = 0; t + 2 < rawIndices.length; t += 3) {
      const y0 = positions[rawIndices[t] * 3 + 1];
      const y1 = positions[rawIndices[t + 1] * 3 + 1];
      const y2 = positions[rawIndices[t + 2] * 3 + 1];
      if (y0 < cutoff || y1 < cutoff || y2 < cutoff) continue;
      kept[k++] = rawIndices[t];
      kept[k++] = rawIndices[t + 1];
      kept[k++] = rawIndices[t + 2];
    }
    if (k === 0) return null;
    indices = kept.subarray(0, k);
  }

  return [positions, indices];
}

/** The recast-style voxel pipeline (unchanged from the previous build-only
 *  worker), producing a single-tile navmesh. */
function buildNavMesh(positions: Float32Array, indices: Uint32Array, options: NavBuildOptions): Nav.NavMesh {
  const ctx = Nav.BuildContext.create();

  const triAreaIds = new Uint8Array(indices.length / 3).fill(0);
  Nav.markWalkableTriangles(positions, indices, triAreaIds, options.walkableSlopeAngle);

  const bounds: Box3 = [[0, 0, 0], [0, 0, 0]];
  Nav.calculateMeshBounds(bounds, positions, indices);

  const [width, height] = Nav.calculateGridSize([0, 0], bounds, options.cellSize);
  const heightfield = Nav.createHeightfield(width, height, bounds, options.cellSize, options.cellHeight);

  const walkableClimbVoxels = Math.ceil(options.walkableClimb / options.cellHeight);
  const walkableHeightVoxels = Math.ceil(options.walkableHeight / options.cellHeight);
  const walkableRadiusVoxels = Math.ceil(options.walkableRadius / options.cellSize);

  Nav.rasterizeTriangles(ctx, heightfield, positions, indices, triAreaIds, walkableClimbVoxels);
  Nav.filterLowHangingWalkableObstacles(heightfield, walkableClimbVoxels);
  Nav.filterLedgeSpans(heightfield, walkableHeightVoxels, walkableClimbVoxels);
  Nav.filterWalkableLowHeightSpans(heightfield, walkableHeightVoxels);

  const compactHeightfield = Nav.buildCompactHeightfield(ctx, walkableHeightVoxels, walkableClimbVoxels, heightfield);
  Nav.erodeWalkableArea(walkableRadiusVoxels, compactHeightfield);

  Nav.buildDistanceField(compactHeightfield);
  Nav.buildRegionsMonotone(compactHeightfield, 0, options.minRegionArea, options.mergeRegionArea);

  const contourSet = Nav.buildContours(
    ctx,
    compactHeightfield,
    options.maxSimplificationError,
    options.maxEdgeLength,
    Nav.ContourBuildFlags.CONTOUR_TESS_WALL_EDGES
  );

  const polyMesh = Nav.buildPolyMesh(ctx, contourSet, options.maxVerticesPerPoly);

  for (let p = 0; p < polyMesh.nPolys; p++) {
    if (polyMesh.areas[p] === Nav.WALKABLE_AREA) polyMesh.areas[p] = 0;
    if (polyMesh.areas[p] === 0) polyMesh.flags[p] = 1;
  }

  const polyMeshDetail = Nav.buildPolyMeshDetail(ctx, polyMesh, compactHeightfield, options.sampleDist, options.sampleMaxError);

  const tilePolys = Nav.polyMeshToTilePolys(polyMesh);
  const tileDetailMesh = Nav.polyMeshDetailToTileDetailMesh(tilePolys.polys, polyMeshDetail);

  const mesh = Nav.createNavMesh();
  mesh.tileWidth = polyMesh.bounds[1][0] - polyMesh.bounds[0][0];
  mesh.tileHeight = polyMesh.bounds[1][2] - polyMesh.bounds[0][2];
  mesh.origin[0] = polyMesh.bounds[0][0];
  mesh.origin[1] = polyMesh.bounds[0][1];
  mesh.origin[2] = polyMesh.bounds[0][2];

  const tileParams: Nav.NavMeshTileParams = {
    bounds: polyMesh.bounds,
    vertices: tilePolys.vertices,
    polys: tilePolys.polys,
    detailMeshes: tileDetailMesh.detailMeshes,
    detailVertices: tileDetailMesh.detailVertices,
    detailTriangles: tileDetailMesh.detailTriangles,
    tileX: 0,
    tileY: 0,
    tileLayer: 0,
    cellSize: options.cellSize,
    cellHeight: options.cellHeight,
    walkableHeight: options.walkableHeight,
    walkableRadius: options.walkableRadius,
    walkableClimb: options.walkableClimb,
  };

  const tile = Nav.buildTile(tileParams);
  Nav.addTile(mesh, tile);
  return mesh;
}

function handleSpawnRequest(id: number) {
  if (!navMesh) {
    post({ type: 'spawn_point', id, ok: false });
    return;
  }
  // Reject candidates that overlap a decoration; keep the first navmesh hit
  // as a fallback — better an NPC brushing a shrub than no NPC at all.
  let chosen: Vec3 | null = null;
  let fallback: Vec3 | null = null;
  for (let attempt = 0; attempt < 24; attempt++) {
    const result = Nav.findRandomPoint(navMesh, Nav.DEFAULT_QUERY_FILTER, Math.random);
    if (!result.success) continue;
    const p: Vec3 = [result.position[0], result.position[1], result.position[2]];
    if (!fallback) fallback = p;
    if (isPointClear(p[0], p[1], p[2])) {
      chosen = p;
      break;
    }
  }
  const spawn = chosen ?? fallback;
  if (spawn) {
    post({ type: 'spawn_point', id, ok: true, x: spawn[0], y: spawn[1], z: spawn[2] });
  } else {
    post({ type: 'spawn_point', id, ok: false });
  }
}

function handlePathRequest(npcId: string, x: number, y: number, z: number, radius: number) {
  const agent = getAgent(npcId);
  agent.position = [x, y, z];
  if (!navMesh) {
    post({ type: 'path_ready', npcId, ok: false });
    return;
  }
  const startPoint = Nav.findNearestPoly(
    Nav.createFindNearestPolyResult(), navMesh, [x, y, z], [3, 3, 3], Nav.DEFAULT_QUERY_FILTER,
  );
  if (!startPoint.success) {
    post({ type: 'path_ready', npcId, ok: false });
    return;
  }

  // The NPC idles at the end point, so reject candidates that overlap a
  // decoration (water isn't on the navmesh at all); keep the first hit as a
  // fallback if nothing clear shows up.
  let endPoint: { success: boolean; position: Vec3 } | null = null;
  let endFallback: { success: boolean; position: Vec3 } | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt < 8
      ? Nav.findRandomPointAroundCircle(navMesh, startPoint.ref, startPoint.point, radius, Nav.DEFAULT_QUERY_FILTER, Math.random)
      : Nav.findRandomPoint(navMesh, Nav.DEFAULT_QUERY_FILTER, Math.random);
    if (!candidate.success) continue;
    if (!endFallback) endFallback = candidate;
    if (isPointClear(candidate.position[0], candidate.position[1], candidate.position[2])) {
      endPoint = candidate;
      break;
    }
  }
  if (!endPoint) endPoint = endFallback;
  if (!endPoint || !endPoint.success) {
    post({ type: 'path_ready', npcId, ok: false });
    return;
  }

  const pathResult = Nav.findSmoothPath(
    navMesh, startPoint.point, endPoint.position, [1, 1, 1], Nav.DEFAULT_QUERY_FILTER, 1, 0.01, 1024,
  );
  if (pathResult.success && pathResult.path && pathResult.path.length > 0) {
    agent.path = pathResult.path.map((p: { position: Vec3 }) => [p.position[0], p.position[1], p.position[2]] as Vec3);
    agent.targetIndex = 0;
    agent.moving = true;
    post({ type: 'path_ready', npcId, ok: true });
  } else {
    post({ type: 'path_ready', npcId, ok: false });
  }
}

// Steering constants — match the previous main-thread implementation.
const WAYPOINT_REACHED_DIST = 0.5;

function handleTick(npcId: string, dt: number, speed: number) {
  const agent = agents.get(npcId);
  if (!agent || !navMesh) return;

  const [px, py, pz] = agent.position;

  if (!agent.moving || agent.path.length === 0) {
    post({ type: 'agent_state', npcId, x: px, y: py, z: pz, targetAngle: agent.targetAngle, moving: false, reachedEnd: false });
    return;
  }

  const target = agent.path[agent.targetIndex];
  if (!target) {
    agent.moving = false;
    post({ type: 'agent_state', npcId, x: px, y: py, z: pz, targetAngle: agent.targetAngle, moving: false, reachedEnd: true });
    return;
  }

  const dx = target[0] - px;
  const dy = target[1] - py;
  const dz = target[2] - pz;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist < WAYPOINT_REACHED_DIST) {
    agent.targetIndex++;
    if (agent.targetIndex >= agent.path.length) {
      agent.moving = false;
      agent.path = [];
      agent.targetIndex = 0;
      post({ type: 'agent_state', npcId, x: px, y: py, z: pz, targetAngle: agent.targetAngle, moving: false, reachedEnd: true });
      return;
    }
    post({ type: 'agent_state', npcId, x: px, y: py, z: pz, targetAngle: agent.targetAngle, moving: true, reachedEnd: false });
    return;
  }

  const dirX = dx / dist;
  const dirZ = dz / dist;
  agent.targetAngle = Math.atan2(dirX, dirZ) + Math.PI;

  const nearestPoly = Nav.findNearestPoly(
    Nav.createFindNearestPolyResult(), navMesh, [px, py, pz], [5, 5, 5], Nav.DEFAULT_QUERY_FILTER,
  );
  if (nearestPoly.success) {
    const moveTarget: Vec3 = [
      nearestPoly.point[0] + dirX * speed * dt,
      nearestPoly.point[1],
      nearestPoly.point[2] + dirZ * speed * dt,
    ];
    const moveResult = Nav.moveAlongSurface(
      navMesh, nearestPoly.ref, nearestPoly.point, moveTarget, Nav.DEFAULT_QUERY_FILTER,
    );
    if (moveResult.success) {
      agent.position = [moveResult.resultPosition[0], moveResult.resultPosition[1], moveResult.resultPosition[2]];
    }
  }

  post({
    type: 'agent_state',
    npcId,
    x: agent.position[0],
    y: agent.position[1],
    z: agent.position[2],
    targetAngle: agent.targetAngle,
    moving: true,
    reachedEnd: false,
  });
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent<NavSimRequest>) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case 'build': {
        try {
          const assembled = assembleGeometry(msg.chunks, msg.waterY);
          if (!assembled) {
            post({ type: 'build_done', id: msg.id, ok: false, error: 'no walkable geometry' });
            break;
          }
          waterLevelY = msg.waterY;
          navMesh = buildNavMesh(assembled[0], assembled[1], msg.options);
          // Existing paths reference the old mesh's polys — clear them; the
          // main thread re-paths on the next idle cycle.
          for (const agent of agents.values()) {
            agent.path = [];
            agent.targetIndex = 0;
            agent.moving = false;
          }
          post({ type: 'build_done', id: msg.id, ok: true });
        } catch (err) {
          post({ type: 'build_done', id: msg.id, ok: false, error: String(err) });
        }
        break;
      }
      case 'obstacles':
        if (msg.packed.length > 0) obstacles.set(msg.chunkKey, msg.packed);
        else obstacles.delete(msg.chunkKey);
        break;
      case 'obstacles_remove':
        obstacles.delete(msg.chunkKey);
        break;
      case 'water':
        waterLevelY = msg.y;
        break;
      case 'spawn_request':
        handleSpawnRequest(msg.id);
        break;
      case 'path_request':
        handlePathRequest(msg.npcId, msg.x, msg.y, msg.z, msg.radius);
        break;
      case 'tick':
        handleTick(msg.npcId, msg.dt, msg.speed);
        break;
      case 'stop_agent': {
        // Player left this NPC's terrain cell (wander freeze) — drop the
        // path but keep the agent's position for the resume re-path.
        const agent = agents.get(msg.npcId);
        if (agent) {
          agent.path = [];
          agent.targetIndex = 0;
          agent.moving = false;
        }
        break;
      }
      case 'remove_agent':
        agents.delete(msg.npcId);
        break;
    }
  } catch (err) {
    // Per-message failures must not kill the worker; build errors are
    // reported through build_done above, everything else degrades silently.
    console.warn('[navSimWorker]', err);
  }
};
