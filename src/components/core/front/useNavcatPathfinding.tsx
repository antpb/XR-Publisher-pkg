import { useRef, useEffect, useCallback } from 'react';
import { Vector3, AnimationAction, Mesh, Scene, Object3D, LineSegments, Group } from 'three';
import * as Nav from 'navcat';
// `?worker&inline` tells Vite to bundle the worker as a base64-inlined
// blob-URL constructor — works in the ES AND UMD builds with no sibling
// worker file at runtime (same pattern as terrainWorker/networkWorker).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite worker import
import NavmeshWorkerCtor from './navmeshWorker.ts?worker&inline';
import type { NavSimRequest, NavSimResponse, NavChunkGeometry } from './navmeshWorker';
import { getNpcWaterLevel, isNpcPointClear, isSameTerrainCell, setNpcObstacleSink } from './npcObstacles';

type Vec3 = [number, number, number];
type Box3 = [Vec3, Vec3];

// Scratch for the per-frame player world position (same-cell freeze check).
const _playerWorldPos = new Vector3();

interface NavcatPathfindingState {
  navMesh: Nav.NavMesh | null;
  initialized: boolean;
  currentPath: Vector3[];
  currentTargetIndex: number;
  isMoving: boolean;
  currentRotation: number;
  isChangingDirection: boolean;
  pathGenerationCooldown: boolean;
  lastSceneHash: string;
  sceneLoaded: boolean;
  currentPosition: Vec3;
  positionInitialized: boolean;
  isInteracting: boolean;
  agentState: {
    position: Vec3;
    target: Vec3 | null;
    isMoving: boolean;
  };
}

interface NavcatPathfindingOptions {
  walkSpeed?: number;
  turnSpeed?: number;
  cellSize?: number;
  cellHeight?: number;
  walkableSlopeAngle?: number;
  walkableHeight?: number;
  walkableRadius?: number;
  walkableClimb?: number;
  maxSimplificationError?: number;
  maxEdgeLength?: number;
  maxVerticesPerPoly?: number;
  sampleDist?: number;
  sampleMaxError?: number;
  minRegionArea?: number;
  mergeRegionArea?: number;
}

// Extract world-space positions + indices from meshes into typed arrays.
// SYNC-FALLBACK ONLY: in the normal worker path the per-vertex world
// transform happens inside the sim worker (extractChunkGeometries below just
// copies raw attribute arrays + matrices).
function getPositionsAndIndices(meshes: Mesh[]): [Float32Array, Uint32Array] {
  let totalVerts = 0;
  let totalIndices = 0;
  for (const mesh of meshes) {
    const posAttr = mesh.geometry?.attributes.position;
    if (!posAttr) continue;
    totalVerts += posAttr.count;
    totalIndices += mesh.geometry.index ? mesh.geometry.index.count : posAttr.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);
  const scratch = new Vector3();
  let vertexOffset = 0;
  let posWrite = 0;
  let idxWrite = 0;

  for (const mesh of meshes) {
    const geometry = mesh.geometry;
    const positionAttr = geometry?.attributes.position;
    if (!positionAttr) continue;

    mesh.updateMatrixWorld(true);
    const worldMatrix = mesh.matrixWorld;

    for (let i = 0; i < positionAttr.count; i++) {
      scratch.fromBufferAttribute(positionAttr, i);
      scratch.applyMatrix4(worldMatrix);
      positions[posWrite++] = scratch.x;
      positions[posWrite++] = scratch.y;
      positions[posWrite++] = scratch.z;
    }

    const indexAttr = geometry.index;
    if (indexAttr) {
      const indexArray = indexAttr.array;
      for (let i = 0; i < indexArray.length; i++) {
        indices[idxWrite++] = indexArray[i] + vertexOffset;
      }
    } else {
      for (let i = 0; i < positionAttr.count; i++) {
        indices[idxWrite++] = vertexOffset + i;
      }
    }

    vertexOffset += positionAttr.count;
  }

  return [positions, indices];
}

// Copy raw chunk geometry (local-space positions + indices + matrixWorld)
// for the sim worker. Copies, never transfers the live attribute arrays —
// the buffers handed to postMessage are these fresh copies, so transferring
// THEM is safe and the scene geometry is untouched.
function extractChunkGeometries(meshes: Mesh[]): { chunks: NavChunkGeometry[]; transfer: ArrayBuffer[] } {
  const chunks: NavChunkGeometry[] = [];
  const transfer: ArrayBuffer[] = [];
  for (const mesh of meshes) {
    const posAttr = mesh.geometry?.attributes.position;
    if (!posAttr) continue;
    mesh.updateMatrixWorld(true);
    const positions = new Float32Array(posAttr.array as ArrayLike<number>);
    const indexAttr = mesh.geometry.index;
    const indices = indexAttr ? new Uint32Array(indexAttr.array as ArrayLike<number>) : new Uint32Array(0);
    const matrix = new Float64Array(mesh.matrixWorld.elements);
    chunks.push({ positions, indices, matrix });
    transfer.push(positions.buffer as ArrayBuffer, matrix.buffer as ArrayBuffer);
    if (indices.length > 0) transfer.push(indices.buffer as ArrayBuffer);
  }
  return { chunks, transfer };
}

// ---------------------------------------------------------------------------
// Shared NPC sim worker (module singleton — all NPCs share one). The worker
// owns the navmesh, the obstacle mirror, and the per-NPC agents; the navmesh
// itself never crosses the thread boundary (the old design structured-cloned
// the whole navMesh object to the main thread on every rebuild, and then ran
// findNearestPoly + moveAlongSurface on the MAIN thread every frame per NPC).
// Falls back to a synchronous triangle-direct build + main-thread queries
// when workers are unavailable.
// ---------------------------------------------------------------------------
let _navWorker: Worker | null = null;
let _navWorkerFailed = false;
let _navRequestId = 0;
const _navBuildPending = new Map<number, (ok: boolean) => void>();
const _navSpawnPending = new Map<number, (p: { ok: boolean; x?: number; y?: number; z?: number }) => void>();
interface NpcHandlers {
  onPathReady: (ok: boolean) => void;
  onAgentState: (s: Extract<NavSimResponse, { type: 'agent_state' }>) => void;
}
const _npcHandlers = new Map<string, NpcHandlers>();
let _npcIdCounter = 0;

function getNavSimWorker(): Worker | null {
  if (_navWorker) return _navWorker;
  if (_navWorkerFailed) return null;
  try {
    const worker: Worker = new NavmeshWorkerCtor();
    worker.onmessage = (e: MessageEvent<NavSimResponse>) => {
      const msg = e.data;
      switch (msg.type) {
        case 'build_done': {
          const resolve = _navBuildPending.get(msg.id);
          if (resolve) {
            _navBuildPending.delete(msg.id);
            resolve(msg.ok);
          }
          break;
        }
        case 'spawn_point': {
          const resolve = _navSpawnPending.get(msg.id);
          if (resolve) {
            _navSpawnPending.delete(msg.id);
            resolve(msg);
          }
          break;
        }
        case 'path_ready':
          _npcHandlers.get(msg.npcId)?.onPathReady(msg.ok);
          break;
        case 'agent_state':
          _npcHandlers.get(msg.npcId)?.onAgentState(msg);
          break;
      }
    };
    worker.onerror = () => {
      _navWorkerFailed = true;
      _navBuildPending.forEach((resolve) => resolve(false));
      _navBuildPending.clear();
      _navSpawnPending.forEach((resolve) => resolve({ ok: false }));
      _navSpawnPending.clear();
      setNpcObstacleSink(null);
      try { worker.terminate(); } catch { /* noop */ }
      _navWorker = null;
    };
    _navWorker = worker;
    // Mirror the decoration-obstacle registry + water level into the worker
    // so spawn/wander point rejection runs worker-side (replays current
    // state on attach).
    setNpcObstacleSink({
      setObstacles: (chunkKey, packed) =>
        worker.postMessage({ type: 'obstacles', chunkKey, packed: new Float32Array(packed) } as NavSimRequest),
      removeObstacles: (chunkKey) =>
        worker.postMessage({ type: 'obstacles_remove', chunkKey } as NavSimRequest),
      setWaterLevel: (y) => worker.postMessage({ type: 'water', y } as NavSimRequest),
    });
    return worker;
  } catch {
    _navWorkerFailed = true;
    return null;
  }
}

function postNavSim(msg: NavSimRequest, transfer?: ArrayBuffer[]) {
  const worker = getNavSimWorker();
  if (!worker) return false;
  if (transfer) worker.postMessage(msg, transfer);
  else worker.postMessage(msg);
  return true;
}

// Generate tiled navmesh (simplified version from examples).
// Synchronous main-thread FALLBACK — only used when the worker is
// unavailable. Triangle-direct (no voxelization), so it's much cheaper
// than the worker pipeline but doesn't filter steep slopes.
function generateTiledNavMesh(positions: Float32Array | number[], indices: Uint32Array | number[], options: NavcatPathfindingOptions): Nav.NavMesh {
  const {
    cellSize = 0.15,
    cellHeight = 0.15,
    walkableRadius = 0.2,
    walkableClimb = 0.5,
    walkableHeight = 1.0
  } = options;

  // Create bounds from positions
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxX = Math.max(maxX, positions[i]);
    maxY = Math.max(maxY, positions[i + 1]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }

  const bounds: Box3 = [[minX, minY, minZ], [maxX, maxY, maxZ]];

  // Create polygons from triangles
  const polys: any[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    polys.push({
      vertices: [indices[i], indices[i + 1], indices[i + 2]],
      area: 0,
      flags: 1
    });
  }

  // Convert to navmesh tile
  // navcat types want number[] but only index/iterate — Float32Array works.
  const tilePolys = Nav.polygonsToNavMeshTilePolys(polys as any, positions as unknown as number[], 0, bounds);
  const tileDetail = Nav.polysToTileDetailMesh(tilePolys.polys);

  // Create navmesh
  const navMesh = Nav.createNavMesh();
  navMesh.tileWidth = bounds[1][0] - bounds[0][0];
  navMesh.tileHeight = bounds[1][2] - bounds[0][2];
  navMesh.origin[0] = bounds[0][0];
  navMesh.origin[1] = bounds[0][1];
  navMesh.origin[2] = bounds[0][2];

  const tileParams: Nav.NavMeshTileParams = {
    bounds,
    vertices: tilePolys.vertices,
    polys: tilePolys.polys,
    detailMeshes: tileDetail.detailMeshes,
    detailVertices: tileDetail.detailVertices,
    detailTriangles: tileDetail.detailTriangles,
    tileX: 0,
    tileY: 0,
    tileLayer: 0,
    cellSize,
    cellHeight,
    walkableHeight,
    walkableRadius,
    walkableClimb,
  };

  const tile = Nav.buildTile(tileParams);
  Nav.addTile(navMesh, tile);

  return navMesh;
}

export function useNavcatPathfinding(
  scene: Scene,
  _initialPosition: Vector3,
  groupRef: React.RefObject<Group>,
  options: NavcatPathfindingOptions = {}
) {
  const {
    walkSpeed = 4.0,
    turnSpeed = 5,
    cellSize = 0.15,
    cellHeight = 0.15,
    walkableHeight = 1.0,
    walkableRadius = 0.2,
    walkableClimb = 0.5,
    walkableSlopeAngle = 45,
    maxSimplificationError = 1.3,
    maxEdgeLength = 12,
    maxVerticesPerPoly = 5
  } = options;

  const pathfindingState = useRef<NavcatPathfindingState>({
    navMesh: null,
    initialized: false,
    currentPath: [],
    currentTargetIndex: 0,
    isMoving: false,
    currentRotation: 0,
    isChangingDirection: false,
    pathGenerationCooldown: false,
    lastSceneHash: '',
    sceneLoaded: false,
    currentPosition: [0, 0, 0],
    positionInitialized: false,
    isInteracting: false,
    agentState: {
      position: [0, 0, 0],
      target: null,
      isMoving: false
    }
  });

  const sceneRef = useRef<Scene | null>(null);
  const navmeshWireframeRef = useRef<LineSegments | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const initializationTimeout = useRef<NodeJS.Timeout | null>(null);
  // Cached player object for the same-cell wander freeze (re-looked-up at
  // most once a second while missing/detached).
  const playerObjectRef = useRef<Object3D | null>(null);
  const playerLookupCooldownRef = useRef(0);

  // ── Worker-sim state ──
  // Stable per-hook agent id; the worker keys its agent map by this.
  const npcIdRef = useRef<string>('');
  if (!npcIdRef.current) npcIdRef.current = `npc-agent-${++_npcIdCounter}`;
  // True once the worker holds a built navmesh (worker mode's counterpart of
  // state.navMesh, which stays null in worker mode — the mesh never leaves
  // the worker).
  const workerNavReadyRef = useRef(false);
  const spawnSuggestedRef = useRef(false);
  // Latest agent state from the worker (applied every frame; ~1 frame stale).
  const lastAgentStateRef = useRef<Extract<NavSimResponse, { type: 'agent_state' }> | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const navReady = () =>
    pathfindingState.current.navMesh !== null || workerNavReadyRef.current;

  // Navmesh debug wireframe — intentionally a no-op (see git history).
  const createNavmeshWireframe = useCallback((_navMesh: Nav.NavMesh, _scene: Scene) => {
    // no-op
  }, []);

  // Calculate scene hash for change detection
  const calculateSceneHash = useCallback((scene: Scene): string => {
    const objects: string[] = [];
    scene.traverse((object) => {
      if (object instanceof Mesh && object.visible) {
        const geometry = object.geometry;
        if (geometry.attributes.position) {
          objects.push(`${object.uuid}:${object.name}:${geometry.attributes.position.count}:${object.position.y}`);
        }
      }
    });
    return objects.sort().join('|');
  }, []);

  // The NPC only ever wanders within generateRandomPath's radius (55), so
  // the navmesh never needs terrain beyond that + margin. Any chunk that
  // contains terrain within ~60u of the NPC has its center within
  // 60 + half-diagonal (~71 for 100u chunks) ≈ 131 — so 140 guarantees
  // coverage. Keep this tight: build memory/CPU scale with the SQUARE of
  // the covered radius (the worker voxelizes the whole area — at 175 the
  // heightfield was ~1.4M columns per rebuild, a fan-spinning, multi-
  // hundred-MB transient in a persistent worker). Scoping to nearby
  // chunks also keeps rebuilds rare: far-away chunk streaming doesn't
  // change the nearby set and is skipped without doing any work.
  const NAVMESH_CHUNK_RADIUS = 140;
  const lastChunkSetKeyRef = useRef('');

  // Find walkable terrain meshes near the NPC. Name-match + distance check
  // only — no vertex work happens on this traverse.
  const collectWalkableMeshes = useCallback((scene: Scene): Mesh[] => {
    const npc = pathfindingState.current.currentPosition;
    const npcX = npc[0];
    const npcZ = npc[2];
    const walkableMeshes: Mesh[] = [];
    const scratch = new Vector3();
    scene.traverse((object) => {
      if (!(object instanceof Mesh) || !object.visible) return;
      // Match both single 'terrain' and terrain chunks 'terrain-chunk-X-Z'
      if (object.name !== 'terrain' && !object.name.startsWith('terrain-chunk-')) return;
      object.getWorldPosition(scratch);
      const dx = scratch.x - npcX;
      const dz = scratch.z - npcZ;
      if (Math.sqrt(dx * dx + dz * dz) > NAVMESH_CHUNK_RADIUS) return;
      walkableMeshes.push(object);
    });
    return walkableMeshes;
  }, []);

  // Build (or skip) the navmesh for the current nearby chunk set.
  // Worker mode: raw chunk buffers + matrices are copied and TRANSFERRED to
  // the sim worker, which does the world transform, water filter, and voxel
  // pipeline, then keeps the navmesh. Returns true when a navmesh (worker- or
  // main-side) is available. Sync fallback builds on the main thread as
  // before.
  const generateNavMesh = useCallback(async (scene: Scene): Promise<boolean> => {
    try {
      const walkableMeshes = collectWalkableMeshes(scene);
      if (walkableMeshes.length === 0) return false;

      // Skip the whole rebuild when the nearby chunk set is unchanged —
      // the usual case when chunks stream in far from the NPC.
      const chunkSetKey = walkableMeshes.map((m) => m.name).sort().join('|');
      if (chunkSetKey === lastChunkSetKeyRef.current && navReady()) {
        return true;
      }

      const worker = getNavSimWorker();
      if (worker) {
        const { chunks, transfer } = extractChunkGeometries(walkableMeshes);
        if (chunks.length === 0) return false;
        const id = ++_navRequestId;
        const ok = await new Promise<boolean>((resolve) => {
          _navBuildPending.set(id, resolve);
          postNavSim({
            type: 'build',
            id,
            chunks,
            options: {
              cellSize,
              cellHeight,
              walkableHeight,
              walkableRadius,
              walkableClimb,
              walkableSlopeAngle,
              maxSimplificationError,
              maxEdgeLength,
              maxVerticesPerPoly,
              // Detail/region params the hook doesn't expose — recast-style
              // defaults scaled to the cell size.
              minRegionArea: 8,
              mergeRegionArea: 20,
              sampleDist: cellSize * 6,
              sampleMaxError: cellHeight,
            },
            waterY: getNpcWaterLevel(),
          }, transfer);
        });
        if (!ok) return false;
        workerNavReadyRef.current = true;
        // Worker rebuilds clear agent paths; reflect that in the mirror so
        // the idle re-path logic kicks in.
        pathfindingState.current.isMoving = false;
        lastChunkSetKeyRef.current = chunkSetKey;
        return true;
      }

      // ── Sync fallback (no worker) ──
      const [positions, rawIndices] = getPositionsAndIndices(walkableMeshes);
      if (positions.length === 0 || rawIndices.length === 0) return false;

      // Drop triangles that touch water (same rule the worker applies).
      let indices = rawIndices;
      const waterY = getNpcWaterLevel();
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
        indices = kept.subarray(0, k);
        if (indices.length === 0) return false;
      }

      const navMesh = generateTiledNavMesh(positions, indices, {
        cellSize, cellHeight, walkableHeight, walkableRadius, walkableClimb,
      });
      pathfindingState.current.navMesh = navMesh;
      lastChunkSetKeyRef.current = chunkSetKey;
      createNavmeshWireframe(navMesh, scene);
      return true;
    } catch (error) {
      console.error('❌ Navmesh generation failed:', error);
      return false;
    }
  }, [collectWalkableMeshes, cellSize, cellHeight, walkableHeight, walkableRadius, walkableClimb, walkableSlopeAngle, maxSimplificationError, maxEdgeLength, maxVerticesPerPoly, createNavmeshWireframe]);

  // Ask for a spawn point and announce it (worker validates against the
  // mirrored obstacle registry; sync fallback samples + validates on main).
  const suggestSpawnPoint = useCallback(() => {
    if (spawnSuggestedRef.current) return;
    spawnSuggestedRef.current = true;

    const announce = (x: number, y: number, z: number) => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('npcSpawnSuggested', { detail: { x, y, z } }));
      }, 100);
    };

    if (getNavSimWorker()) {
      const id = ++_navRequestId;
      _navSpawnPending.set(id, (p) => {
        if (p.ok && p.x !== undefined) announce(p.x, p.y!, p.z!);
        else console.error('❌ Could not find valid spawn point on navmesh!');
      });
      postNavSim({ type: 'spawn_request', id });
      return;
    }

    const navMesh = pathfindingState.current.navMesh;
    if (!navMesh) return;
    try {
      let chosen: Vec3 | null = null;
      let fallback: Vec3 | null = null;
      for (let attempt = 0; attempt < 24; attempt++) {
        const result = Nav.findRandomPoint(navMesh, Nav.DEFAULT_QUERY_FILTER, Math.random);
        if (!result.success) continue;
        const p: Vec3 = [result.position[0], result.position[1], result.position[2]];
        if (!fallback) fallback = p;
        if (isNpcPointClear(p[0], p[1], p[2])) {
          chosen = p;
          break;
        }
      }
      const spawn = chosen ?? fallback;
      if (spawn) announce(spawn[0], spawn[1], spawn[2]);
      else console.error('❌ Could not find valid spawn point on navmesh!');
    } catch (e) {
      console.warn('❌ Failed to choose random NPC spawn from navmesh', e);
    }
  }, []);

  // Generate random path. Worker mode: one path_request message — start-poly
  // lookup, obstacle-clear end sampling, and findSmoothPath all run in the
  // worker; the path itself stays there (agents steer worker-side).
  const generateRandomPath = useCallback(() => {
    const state = pathfindingState.current;
    if (!navReady() || state.pathGenerationCooldown || !state.positionInitialized) {
      return;
    }
    state.pathGenerationCooldown = true;

    if (getNavSimWorker()) {
      const pos = state.currentPosition;
      postNavSim({ type: 'path_request', npcId: npcIdRef.current, x: pos[0], y: pos[1], z: pos[2], radius: 55 });
      // path_ready handler (registered in the mount effect) flips isMoving.
      setTimeout(() => {
        state.pathGenerationCooldown = false;
      }, 2000);
      return;
    }

    // ── Sync fallback: main-thread queries against the main-side navmesh ──
    const navMesh = state.navMesh;
    if (!navMesh) {
      state.pathGenerationCooldown = false;
      return;
    }
    try {
      const npcPosition = state.currentPosition || [0, -20, 0];
      const center: Vec3 = [npcPosition[0], npcPosition[1], npcPosition[2]];
      const startPoint = Nav.findNearestPoly(Nav.createFindNearestPolyResult(), navMesh, center, [3, 3, 3], Nav.DEFAULT_QUERY_FILTER);
      if (!startPoint.success) {
        console.error('Could not find start point near NPC position');
        state.pathGenerationCooldown = false;
        return;
      }

      const radius = 55;
      let endPoint: { success: boolean; position: Vec3 } | null = null;
      let endFallback: { success: boolean; position: Vec3 } | null = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = attempt < 8
          ? Nav.findRandomPointAroundCircle(navMesh, startPoint.ref, startPoint.point, radius, Nav.DEFAULT_QUERY_FILTER, Math.random)
          : Nav.findRandomPoint(navMesh, Nav.DEFAULT_QUERY_FILTER, Math.random);
        if (!candidate.success) continue;
        if (!endFallback) endFallback = candidate;
        if (isNpcPointClear(candidate.position[0], candidate.position[1], candidate.position[2])) {
          endPoint = candidate;
          break;
        }
      }
      if (!endPoint) endPoint = endFallback;
      if (!endPoint || !endPoint.success) {
        console.error('Could not find valid end point on navmesh');
        state.pathGenerationCooldown = false;
        return;
      }

      const pathResult = Nav.findSmoothPath(navMesh, startPoint.point, endPoint.position, [1, 1, 1], Nav.DEFAULT_QUERY_FILTER, 1, 0.01, 1024);
      if (pathResult.success && pathResult.path) {
        state.currentPath = pathResult.path.map((p: any) => new Vector3(p.position[0], p.position[1], p.position[2]));
        state.currentTargetIndex = 0;
        state.isMoving = true;
      } else {
        console.error('Smooth path generation failed');
      }
      setTimeout(() => {
        state.pathGenerationCooldown = false;
      }, 2000);
    } catch (error) {
      console.error('Error generating random path:', error);
      state.pathGenerationCooldown = false;
    }
  }, []);

  // Register this NPC's worker handlers (path_ready / agent_state routing).
  useEffect(() => {
    const npcId = npcIdRef.current;
    _npcHandlers.set(npcId, {
      onPathReady: (ok) => {
        if (ok) {
          pathfindingState.current.isMoving = true;
        }
      },
      onAgentState: (s) => {
        lastAgentStateRef.current = s;
      },
    });
    return () => {
      _npcHandlers.delete(npcId);
      if (_navWorker) {
        postNavSim({ type: 'remove_agent', npcId });
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Handle animation blending
  const handleAnimation = useCallback((
    isWalking: boolean,
    delta: number,
    animations: {
      idle: AnimationAction | null;
      walking: AnimationAction | null;
    }
  ) => {
    if (!animations.idle || !animations.walking) return;

    const { idle, walking } = animations;
    const state = pathfindingState.current;

    if (isWalking) {
      if (walking.getEffectiveWeight() < 1) {
        const speedRatio = state.isChangingDirection ? 1.2 : 1.5;
        walking.setEffectiveTimeScale(speedRatio);
        walking.setEffectiveWeight(walking.getEffectiveWeight() + delta * 2);
        idle.setEffectiveWeight(1 - walking.getEffectiveWeight());
      }
    } else {
      if (idle.getEffectiveWeight() < 1) {
        idle.setEffectiveTimeScale(1);
        idle.setEffectiveWeight(idle.getEffectiveWeight() + delta * 2);
        walking.setEffectiveWeight(1 - idle.getEffectiveWeight());
        walking.setEffectiveTimeScale(1);
      }
    }
  }, []);

  // Shared gating for both modes. Returns true when movement must halt this
  // frame (interaction, or the player is on a different terrain cell).
  const movementGated = useCallback((delta: number): boolean => {
    const state = pathfindingState.current;
    if (state.isInteracting) return true;

    // Freeze wandering while the player is on a different terrain cell than
    // this NPC. Cheap per frame: one cached lookup + two floor-divisions.
    playerLookupCooldownRef.current -= delta;
    if ((!playerObjectRef.current || !playerObjectRef.current.parent) && playerLookupCooldownRef.current <= 0) {
      playerLookupCooldownRef.current = 1;
      playerObjectRef.current = scene?.getObjectByName('playerOne') ?? null;
    }
    const playerObj = playerObjectRef.current;
    if (playerObj && groupRef.current) {
      playerObj.getWorldPosition(_playerWorldPos);
      const npcPos = groupRef.current.position;
      if (!isSameTerrainCell(npcPos.x, npcPos.z, _playerWorldPos.x, _playerWorldPos.z)) {
        return true;
      }
    }
    return false;
  }, [scene, groupRef]);

  // Per-frame movement update.
  // Worker mode: apply the latest worker agent state (position + target
  // heading, ~1 frame stale), smooth the rotation on main (presentation
  // concern), and send the next tick. The navcat queries the old version ran
  // here every frame (findNearestPoly + moveAlongSurface) now run in the
  // worker.
  const updateMovement = useCallback((
    delta: number,
    vrmScene: Object3D,
    animations: {
      idle: AnimationAction | null;
      walking: AnimationAction | null;
    }
  ) => {
    const state = pathfindingState.current;

    if (!navReady() || !state.initialized) {
      handleAnimation(false, delta, animations);
      return;
    }

    if (getNavSimWorker()) {
      if (movementGated(delta)) {
        if (state.isMoving) {
          state.isMoving = false;
          postNavSim({ type: 'stop_agent', npcId: npcIdRef.current });
        }
        handleAnimation(false, delta, animations);
        return;
      }

      const agent = lastAgentStateRef.current;
      if (agent) {
        // Apply worker position + track it for path/scoping decisions.
        if (groupRef.current) {
          groupRef.current.position.set(agent.x, agent.y, agent.z);
        }
        state.currentPosition[0] = agent.x;
        state.currentPosition[1] = agent.y;
        state.currentPosition[2] = agent.z;

        // Smooth rotation toward the worker's target heading.
        if (agent.moving) {
          let angleDiff = agent.targetAngle - state.currentRotation;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          state.isChangingDirection = Math.abs(angleDiff) > 0.5;
          state.currentRotation += angleDiff * turnSpeed * delta;
          state.currentRotation %= Math.PI * 2;
          vrmScene.rotation.y = state.currentRotation;
        }

        if (agent.reachedEnd && state.isMoving) {
          // Reached end of path — idle for a while, then wander again.
          state.isMoving = false;
          const idleTime = 2000 + Math.random() * 3000;
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(() => {
            idleTimerRef.current = null;
            generateRandomPath();
          }, idleTime);
        }
      }

      if (state.isMoving) {
        postNavSim({ type: 'tick', npcId: npcIdRef.current, dt: delta, speed: walkSpeed });
        const speedRatio = walkSpeed / 3.0;
        if (animations.walking && animations.walking.getEffectiveWeight() > 0.5) {
          animations.walking.setEffectiveTimeScale(speedRatio);
        }
        handleAnimation(true, delta, animations);
      } else {
        handleAnimation(false, delta, animations);
        // Re-path when idle — but never while the reached-end idle timer is
        // pending (that timer IS the wander pause).
        if (!state.pathGenerationCooldown && state.positionInitialized && !idleTimerRef.current) {
          generateRandomPath();
        }
      }
      return;
    }

    // ── Sync fallback: original main-thread steering ──
    if (movementGated(delta)) {
      if (state.isMoving) {
        state.isMoving = false;
        state.currentPath = [];
        state.currentTargetIndex = 0;
      }
      handleAnimation(false, delta, animations);
      return;
    }

    if (!state.isMoving || state.currentPath.length === 0) {
      handleAnimation(false, delta, animations);
      if (state.navMesh && !state.pathGenerationCooldown && state.positionInitialized) {
        generateRandomPath();
      }
      return;
    }

    const currentTarget = state.currentPath[state.currentTargetIndex];
    if (!currentTarget) {
      state.isMoving = false;
      return;
    }

    const worldPosition = new Vector3();
    if (groupRef.current) {
      worldPosition.copy(groupRef.current.position);
    } else {
      worldPosition.copy(vrmScene.position);
    }

    state.currentPosition[0] = worldPosition.x;
    state.currentPosition[1] = worldPosition.y;
    state.currentPosition[2] = worldPosition.z;

    const direction = new Vector3()
      .subVectors(currentTarget, worldPosition)
      .normalize();

    const distanceToTarget = worldPosition.distanceTo(currentTarget);
    if (distanceToTarget < 0.5) {
      state.currentTargetIndex++;
      if (state.currentTargetIndex >= state.currentPath.length) {
        state.isMoving = false;
        state.currentPath = [];
        state.currentTargetIndex = 0;
        const idleTime = 2000 + Math.random() * 3000;
        setTimeout(() => {
          generateRandomPath();
        }, idleTime);
        return;
      }
      return;
    }

    const targetAngle = Math.atan2(direction.x, direction.z) + Math.PI;
    let angleDiff = targetAngle - state.currentRotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    state.isChangingDirection = Math.abs(angleDiff) > 0.5;
    state.currentRotation += angleDiff * turnSpeed * delta;
    state.currentRotation %= Math.PI * 2;
    vrmScene.rotation.y = state.currentRotation;

    try {
      const nearestPoly = Nav.findNearestPoly(
        Nav.createFindNearestPolyResult(),
        state.navMesh!,
        [worldPosition.x, worldPosition.y, worldPosition.z],
        [5, 5, 5],
        Nav.DEFAULT_QUERY_FILTER
      );

      if (nearestPoly.success) {
        const moveRequest: Vec3 = [direction.x * walkSpeed * delta, 0, direction.z * walkSpeed * delta];
        const moveRequestTarget: Vec3 = [
          nearestPoly.point[0] + moveRequest[0],
          nearestPoly.point[1] + moveRequest[1],
          nearestPoly.point[2] + moveRequest[2]
        ];
        const moveResult = Nav.moveAlongSurface(
          state.navMesh!,
          nearestPoly.ref,
          nearestPoly.point,
          moveRequestTarget,
          Nav.DEFAULT_QUERY_FILTER
        );

        if (moveResult.success) {
          const newPosition = new Vector3(
            moveResult.resultPosition[0],
            moveResult.resultPosition[1],
            moveResult.resultPosition[2]
          );
          if (groupRef.current) {
            groupRef.current.position.set(newPosition.x, newPosition.y, newPosition.z);
          }
          state.currentPosition[0] = newPosition.x;
          state.currentPosition[1] = newPosition.y;
          state.currentPosition[2] = newPosition.z;
        } else {
          console.warn('moveAlongSurface failed');
        }
      } else {
        console.warn('Could not find nearest poly for movement');
      }
    } catch (e) {
      console.warn('Error in navmesh movement:', e);
    }

    const speedRatio = walkSpeed / 3.0;
    if (animations.walking && animations.walking.getEffectiveWeight() > 0.5) {
      animations.walking.setEffectiveTimeScale(speedRatio);
    }
    handleAnimation(true, delta, animations);
  }, [walkSpeed, turnSpeed, generateRandomPath, movementGated, handleAnimation, groupRef]);

  // Initialize navmesh when scene changes
  const initializeNavMesh = useCallback(async () => {
    if (!scene || pathfindingState.current.initialized || navReady() || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    const currentHash = calculateSceneHash(scene);

    if (currentHash !== pathfindingState.current.lastSceneHash) {
      const ok = await generateNavMesh(scene);

      if (ok) {
        pathfindingState.current.initialized = true;
        pathfindingState.current.lastSceneHash = currentHash;
        pathfindingState.current.sceneLoaded = true;

        suggestSpawnPoint();

        // Generate initial path
        setTimeout(() => {
          generateRandomPath();
        }, 1000);
      }
    }

    isProcessingRef.current = false;
  }, [scene, calculateSceneHash, generateNavMesh, suggestSpawnPoint, generateRandomPath]);

  // Wait for terrain to be ready before generating navmesh
  const waitForTerrain = useCallback((scene: Scene, maxAttempts = 30, delay = 500): Promise<Object3D | null> => {
    return new Promise((resolve) => {
      let attempts = 0;

      const checkForTerrain = () => {
        attempts++;

        let terrain: Object3D | null = null;
        scene.traverse((object) => {
          // Match the single-mesh terrain AND streamed chunks — with only
          // the exact-name check, chunked procedural terrain never
          // resolved here, so initializeNavMesh (and the NPC spawn-point
          // event) never ran on infinite-terrain worlds.
          if (object instanceof Mesh && object.visible
            && (object.name === 'terrain' || object.name.startsWith('terrain-chunk-'))) {
            if (object.geometry && object.geometry.attributes.position && object.geometry.attributes.position.count > 0) {
              terrain = object;
            }
          }
        });

        if (terrain) {
          window.dispatchEvent(new CustomEvent('terrainReady', { detail: { terrain } }));
          resolve(terrain);
        } else if (attempts >= maxAttempts) {
          resolve(null);
        } else {
          setTimeout(checkForTerrain, delay);
        }
      };

      checkForTerrain();
    });
  }, []);

  // Initialize when scene is ready
  useEffect(() => {
    if (!scene) {
      return;
    }

    sceneRef.current = scene;

    if (isProcessingRef.current) {
      return;
    }

    const currentHash = calculateSceneHash(scene);
    if (pathfindingState.current.initialized && pathfindingState.current.lastSceneHash === currentHash) {
      return;
    }

    isProcessingRef.current = true;

    if (initializationTimeout.current) {
      clearTimeout(initializationTimeout.current);
    }

    initializationTimeout.current = setTimeout(async () => {
      try {
        const terrain = await waitForTerrain(scene, 30, 500);

        if (terrain) {
          isProcessingRef.current = false;
          await initializeNavMesh();
        } else {
          isProcessingRef.current = false;
        }
      } catch (error) {
        isProcessingRef.current = false;
      }
    }, 1000);

    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, [scene, initializeNavMesh, waitForTerrain, calculateSceneHash]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (pathfindingState.current.navMesh) {
        pathfindingState.current.navMesh = null;
        pathfindingState.current.initialized = false;
      }

      if (navmeshWireframeRef.current && sceneRef.current) {
        sceneRef.current.remove(navmeshWireframeRef.current);
        navmeshWireframeRef.current = null;
      }
    };
  }, []);

  // Listen for terrain chunk loading and regenerate navmesh.
  // This fires constantly while terrain streams, so the handler must be
  // near-free in the common case: generateNavMesh scopes to chunks near
  // the NPC and skips entirely when that set is unchanged. The actual
  // build (transform + water filter + voxel pipeline) runs in the worker.
  useEffect(() => {
    let regenerationTimeout: NodeJS.Timeout | null = null;
    let building = false;
    let dirtyWhileBuilding = false;

    const regenerate = async () => {
      if (!sceneRef.current) return;
      if (building) {
        dirtyWhileBuilding = true;
        return;
      }
      building = true;
      try {
        const ok = await generateNavMesh(sceneRef.current);
        if (ok) {
          pathfindingState.current.initialized = true;
        }
      } finally {
        building = false;
        if (dirtyWhileBuilding) {
          dirtyWhileBuilding = false;
          regenerate();
        }
      }
    };

    const onTerrainChunkLoaded = () => {
      // Coalesce chunk bursts — wait 1s after the last chunk loaded.
      if (regenerationTimeout) {
        clearTimeout(regenerationTimeout);
      }
      regenerationTimeout = setTimeout(regenerate, 1000);
    };

    window.addEventListener('terrainChunkLoaded', onTerrainChunkLoaded);

    return () => {
      window.removeEventListener('terrainChunkLoaded', onTerrainChunkLoaded);
      if (regenerationTimeout) {
        clearTimeout(regenerationTimeout);
      }
    };
  }, [generateNavMesh]);

  // Listen for NPC position updates
  useEffect(() => {
    const onNpcPositionUpdated = (e: any) => {
      try {
        const { x, y, z } = e.detail || {};
        if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
          pathfindingState.current.currentPosition[0] = x;
          pathfindingState.current.currentPosition[1] = y;
          pathfindingState.current.currentPosition[2] = z;
          pathfindingState.current.positionInitialized = true;
        } else {
          console.warn('Invalid position data in npcPositionUpdated event:', { x, y, z });
        }
      } catch (e) {
        console.error('Error updating NPC position in pathfinding state:', e);
      }
    };

    window.addEventListener('npcPositionUpdated', onNpcPositionUpdated);
    return () => {
      window.removeEventListener('npcPositionUpdated', onNpcPositionUpdated);
    };
  }, []);

  // Function to update interaction state
  const setInteractionState = useCallback((isInteracting: boolean) => {
    pathfindingState.current.isInteracting = isInteracting;
    // Worker agents keep steering unless told otherwise — stop them the
    // moment an interaction starts (NPCObject also zeroes the state mirror).
    if (isInteracting && _navWorker) {
      postNavSim({ type: 'stop_agent', npcId: npcIdRef.current });
    }
  }, []);

  return {
    updateMovement,
    generateRandomPath,
    setInteractionState,
    pathfindingState: pathfindingState.current,
    isInitialized: pathfindingState.current.initialized
  };
}
