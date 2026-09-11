import React, { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Fog, WebGLRenderer, BufferGeometry, Float32BufferAttribute } from 'three';
import { ProceduralTerrain, setShoreWaterLevel } from './ProceduralTerrain';
import { setRegionWaterLevel } from '../../../decorations/regionMaterialUniforms';
import { setNpcWaterLevel, setNpcTerrainCellSize } from './npcObstacles';
import { updateTerrainAudio } from './terrainAudio';
import { ProceduralTerrain as ProceduralTerrainWebGL } from './ProceduralTerrainWebGL';
import { ProceduralSky } from './ProceduralSky';
import { ProceduralSky as ProceduralSkyWebGL } from './ProceduralSkyWebGL';
import { WaterShader } from './WaterShader';
import { WaterShader as WaterShaderWebGL } from './WaterShaderWebGL';
import { AmbientParticles } from './AmbientParticles';
import { mapRange } from './terrainHelpers';
import { useTerrainChunkStore } from './terrainChunkStore';
import { MountainMesh, getMountainMaterial } from './MountainMesh';
import { MountainMeshWebGL } from './MountainMeshWebGL';
import { CavernSystem, CavernLightPool, getCavernMaterial, getWaterPoolMaterial } from './CavernSystem';
import useWorldStore from '../../../stores/worldStore';
import useProceduralSkyStore from '../../../stores/proceduralSkyStore';

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

interface TerrainChunk {
  gridX: number;
  gridZ: number;
  key: string;
}

interface InfiniteTerrainProps {
  width?: number;
  height?: number;
  segments?: number;
  scale?: number;
  heightScale?: number;
  seed?: string;
  positionY?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  color?: string;
  roughness?: number;
  metalness?: number;
  noiseOctaves?: number;
  noisePersistence?: number;
  noiseLacunarity?: number;
  skyColor?: string;
  horizonColor?: string;
  cloudColor?: string;
  cloudDensity?: number;
  cloudScale?: number;
  cloudSpeed?: number;
  cloudHeight?: number;
  cloudLayers?: number;
  timeOfDay?: number;
  timeCycleDuration?: number;
  renderDistance?: number;
  useWebGLForXR?: boolean;
}

const BASE_RENDER_DISTANCE = 2;
const HIGH_ALT_RENDER_DISTANCE = 3;
const HIGH_ALT_THRESHOLD = 60;
// Progressive first-load radius. The world starts at this render distance
// (3×3 chunks) so the initial terrain + decoration + collider generation
// doesn't pile its memory onto the one-time load spikes (VRM + 6 FBX anims +
// shader compiles + WASM init) — which together trip iOS Safari's memory
// watchdog. The cap lifts to the normal radius once those one-time costs have
// cleared, streaming the outer ring in afterward. Same final state on every
// device — this is progressive loading, not a mobile feature cap.
const INITIAL_LOAD_RENDER_DISTANCE = 1;

// Degenerate (all-zero) triangle with the attribute layout the mountain/
// cavern materials expect — drawn once per frame (rasterizes nothing) so
// their WebGPU pipelines compile at world load, not mid-flight.
function makeMountainPrewarmGeometry(withInteriorDepth: boolean): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(new Float32Array(9), 3));
  g.setAttribute('color', new Float32BufferAttribute(new Float32Array(9), 3));
  g.setAttribute('normal', new Float32BufferAttribute(new Float32Array(9), 3));
  if (withInteriorDepth) {
    g.setAttribute('interiorDepth', new Float32BufferAttribute(new Float32Array(3), 1));
  }
  return g;
}

const _prewarmGeoPlain = makeMountainPrewarmGeometry(false);
const _prewarmGeoDepth = makeMountainPrewarmGeometry(true);

function MountainPipelinePrewarm() {
  return (
    <group position={[0, -9999, 0]}>
      <mesh geometry={_prewarmGeoPlain} material={getMountainMaterial(false)} frustumCulled={false} />
      <mesh geometry={_prewarmGeoDepth} material={getMountainMaterial(true)} frustumCulled={false} />
      <mesh geometry={_prewarmGeoPlain} material={getCavernMaterial()} frustumCulled={false} />
      <mesh material={getWaterPoolMaterial()} frustumCulled={false}>
        <circleGeometry args={[0.001, 3]} />
      </mesh>
    </group>
  );
}
// Hold the small load radius until well past the avatar (VRM + 6 FBX anims +
// MToon shader compile) and the first async mountain meshes have settled —
// those land 2–4s in, and expanding the radius on top of them is what pushes
// iOS Safari over its memory ceiling. 9s clears that window before the outer
// ring streams in. Movement also lifts the cap (see useFrame) so an exploring
// player isn't held back.
const LOAD_RAMP_DELAY_MS = 9000;

export function InfiniteTerrain({
  width = 100,
  height = 100,
  segments = 100,
  scale = 0.5,
  heightScale = 50,
  seed = Math.random().toString(),
  positionY = -10,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  color = '#4a7c59',
  roughness = 0.8,
  metalness = 0.2,
  noiseOctaves = 6,
  noisePersistence = 0.5,
  noiseLacunarity = 2,
  skyColor = '#87CEEB',
  horizonColor = '#E0F7FF',
  cloudColor = '#ffffff',
  cloudDensity = 0.5,
  cloudScale = 1,
  cloudSpeed = 0.1,
  cloudHeight = 100,
  cloudLayers = 3,
  timeOfDay = 12,
  timeCycleDuration = 0,
  renderDistance,
  useWebGLForXR = false
}: InfiniteTerrainProps) {
  const { camera, scene, gl } = useThree();

  // `renderdistance` on the terrain block — chunk radius around the player
  // (2 ⇒ a 5×5 grid). It was parsed by the scanner but never reached this
  // component, so the attribute did nothing. Clamped: below 1 the player
  // outruns the ground, above 5 the chunk/decoration/collider cost explodes.
  // High-altitude flight always adds one ring beyond the authored radius.
  // Read through a ref so the effects/useFrame below can't close over a
  // stale value without re-subscribing.
  const renderDistRef = useRef({ base: BASE_RENDER_DISTANCE, high: HIGH_ALT_RENDER_DISTANCE });
  {
    const authored = Number.isFinite(renderDistance as number)
      ? Math.round(renderDistance as number)
      : BASE_RENDER_DISTANCE;
    const base = Math.min(5, Math.max(1, authored));
    renderDistRef.current.base = base;
    renderDistRef.current.high = base + 1;
  }

  const chunksArray = useTerrainChunkStore((state) => state.chunksArray);
  const batchUpdate = useTerrainChunkStore((state) => state.batchUpdate);
  const decorationsEnabled = useTerrainChunkStore((state) => state.decorationsEnabled);
  const setDecorationsEnabled = useTerrainChunkStore((state) => state.setDecorationsEnabled);
  const setTerrainSeed = useTerrainChunkStore((state) => state.setTerrainSeed);
  const setWaterCenter = useTerrainChunkStore((state) => state.setWaterCenter);
  const setCollidersActive = useTerrainChunkStore((state) => state.setCollidersActive);
  
  const activeMountainsArray = useWorldStore((state) => state.activeMountainsArray);
  const skyVisible = useWorldStore((state) => state.skyVisible);
  const globalWaterVisible = useWorldStore((state) => state.globalWaterVisible);
  const terrainVisible = useWorldStore((state) => state.terrainVisible);
  const updateMountainsForView = useWorldStore((state) => state.updateMountainsForView);
  const updatePlayerEnvironment = useWorldStore((state) => state.updatePlayerEnvironment);
  const skyColorsRef = useRef({ horizon: null as any, mid: null as any, sky: null as any });
  useEffect(() => {
    const unsub = useProceduralSkyStore.subscribe((state) => {
      skyColorsRef.current.horizon = state.skyColors.horizon;
      skyColorsRef.current.mid = state.skyColors.mid;
      skyColorsRef.current.sky = state.skyColors.sky;
    });
    const initial = useProceduralSkyStore.getState();
    skyColorsRef.current.horizon = initial.skyColors.horizon;
    skyColorsRef.current.mid = initial.skyColors.mid;
    skyColorsRef.current.sky = initial.skyColors.sky;
    return unsub;
  }, []);

  const playerPositionRef = useRef<Vector3>(new Vector3());
  const currentGridPosRef = useRef({ x: 0, z: 0 });
  // While a teleport PRELOAD is in flight, the camera is still at the origin but
  // we're streaming the DESTINATION. Pause the camera-driven grid check so it
  // doesn't evict the preloaded destination chunks (camera out of their range).
  const preloadingRef = useRef(false);
  const loadedChunksRef = useRef<Set<string>>(new Set());
  const effectiveRenderDistRef = useRef(INITIAL_LOAD_RENDER_DISTANCE);
  // Upper bound on render distance during the first-load ramp. Starts small,
  // lifts to the full radius after LOAD_RAMP_DELAY_MS so the outer chunk ring
  // streams in only after the heavy one-time load work has finished.
  const loadRampCapRef = useRef(INITIAL_LOAD_RENDER_DISTANCE);
  
  const waterGridPosRef = useRef({ x: 0, z: 0 });
  
  const chunkOperationQueueRef = useRef<Array<{ type: 'add' | 'remove', chunk: TerrainChunk | string, distance?: number }>>([]);
  const lastGridCheckRef = useRef<number>(0);
  const lastProcessTimeRef = useRef<number>(0);
  const collidersActiveRef = useRef<boolean>(true);
  const lastVisibilityCheckRef = useRef<number>(0);
  const envPosRef = useRef<Vector3>(new Vector3());
  const fogRef = useRef<Fog | null>(null);

  useEffect(() => {
    const fog = new Fog(0x87CEEB, width * 1.35, width * 3.2);
    scene.fog = fog;
    fogRef.current = fog;
    return () => {
      scene.fog = null;
      fogRef.current = null;
    };
  }, [scene, width]);

  useEffect(() => {
    setTerrainSeed(seed);
    // Publish the active world seed so plugins can call the engine's own biome
    // sampler (XRPublisher.getBiomeAt/getBiomeWeights/getOceanFade) instead of
    // hand-reconstructing the biome noise field from copied constants.
    (window as any).__xrWorldSeed = seed;
    return () => {
      if ((window as any).__xrWorldSeed === seed) delete (window as any).__xrWorldSeed;
    };
  }, [seed, setTerrainSeed]);

  // Feed the water-surface world Y into the shared terrain material's
  // shoreline-wash uniform (foam overlap on the land side of the shore),
  // and into the NPC placement registry (NPCs exclude underwater terrain
  // from their navmesh and reject spawn/wander points below this Y).
  useEffect(() => {
    const waterY = positionY + mapRange(0.48, 0, 1, -heightScale, heightScale);
    setShoreWaterLevel(waterY);
    setRegionWaterLevel(waterY);
    setNpcWaterLevel(waterY);
  }, [positionY, heightScale]);

  // Publish the terrain's vertical offset so plugins can seat scene-scale
  // injected objects on the ground WITHOUT a physics raycast. World ground Y at
  // a chunk vertex = positionY + heightSample; a plugin holding a height sample
  // (e.g. a decoration spawn's worldPosition[1]) adds this offset. Avoids
  // hammering rapier `castRay` (which can re-enter/overflow at far-from-origin
  // or mid-generation locations).
  useEffect(() => {
    (window as any).__xrTerrainOffsetY = positionY;
    // Chunk cell size so the teleport handler can compute the destination chunk
    // key and wait for it to load before releasing the player (no fall into water).
    (window as any).__xrTerrainWidth = width;
    (window as any).__xrTerrainHeight = height;
    // Full terrain params so the per-point sampler (terrainSample.ts) can
    // approximate height/water anywhere for path routing + dry-site picking.
    (window as any).__xrTerrainParams = {
      width, height, scale, heightScale, seed,
      octaves: noiseOctaves, persistence: noisePersistence, lacunarity: noiseLacunarity,
      positionY,
    };
    return () => {
      delete (window as any).__xrTerrainOffsetY;
      delete (window as any).__xrTerrainWidth;
      delete (window as any).__xrTerrainHeight;
      delete (window as any).__xrTerrainParams;
    };
  }, [positionY, width, height, scale, heightScale, seed, noiseOctaves, noisePersistence, noiseLacunarity]);

  // Publish the chunk cell size for NPC wander-freezing (NPCs pause when
  // the player leaves their cell). Reset on unmount so non-chunked worlds
  // after a world switch never freeze NPCs.
  useEffect(() => {
    setNpcTerrainCellSize(width, height);
    return () => setNpcTerrainCellSize(0, 0);
  }, [width, height]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDecorationsEnabled(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [setDecorationsEnabled]);

  const getGridPosition = useCallback((x: number, z: number) => {
    return {
      x: Math.floor(x / width),
      z: Math.floor(z / height)
    };
  }, [width, height]);

  const queueChunkOperations = useCallback((playerGridX: number, playerGridZ: number, rd: number, addOnly = false) => {
    const currentChunks = loadedChunksRef.current;
    const operations: Array<{ type: 'add' | 'remove', chunk: TerrainChunk | string, distance?: number }> = [];
    
    const shouldExist = new Set<string>();
    for (let dx = -rd; dx <= rd; dx++) {
      for (let dz = -rd; dz <= rd; dz++) {
        const gridX = playerGridX + dx;
        const gridZ = playerGridZ + dz;
        const key = `terrain-${gridX}-${gridZ}`;
        shouldExist.add(key);
        
        if (!currentChunks.has(key)) {
          const distance = Math.sqrt(dx * dx + dz * dz);
          operations.push({
            type: 'add',
            chunk: { gridX, gridZ, key },
            distance
          });
        }
      }
    }
    
    const addOps = operations.filter(op => op.type === 'add').sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // addOnly: used by teleport PRELOAD — stream the destination chunks while
    // the player is still at the origin, WITHOUT evicting the chunks they're
    // currently standing on (those are out of the destination's range, so a
    // normal pass would queue them for removal and drop the player).
    if (addOnly) {
      chunkOperationQueueRef.current.push(...addOps);
      return;
    }

    const removeOps: Array<{ type: 'add' | 'remove', chunk: TerrainChunk | string }> = [];
    currentChunks.forEach(key => {
      if (!shouldExist.has(key)) {
        removeOps.push({
          type: 'remove',
          chunk: key
        });
      }
    });

    chunkOperationQueueRef.current.push(...addOps, ...removeOps);
  }, []);
  
  const processChunkQueue = useCallback(() => {
    if (chunkOperationQueueRef.current.length === 0) return;

    // Feed a couple of chunks per frame on desktop, one on mobile. The
    // expensive main-thread work (geometry build + decimated-collider cook)
    // runs in the worker's async .then, so it's paced by WORKER completions,
    // not by how many we mount here — raising this just fills the worker's
    // input queue faster so it never sits idle waiting for the next React tick.
    // During a teleport preload nothing is rendering the destination yet and it's
    // add-only (no removes), so push chunks in much faster to get the full scene
    // ready before the player is dropped in.
    const maxAddsPerFrame = preloadingRef.current ? (isMobile ? 4 : 8) : (isMobile ? 1 : 2);
    // Pace REMOVES too. Adds were already throttled, but removes weren't — so a
    // teleport (every origin chunk falls out of range at once) dumped 25+
    // removeRigidBody/free calls into a single commit, which races
    // @react-three/rapier's per-frame body sync (forEachRigidBody) and throws
    // "take ownership while borrowed" / "recursive use … unsafe aliasing".
    // Spreading removes across frames keeps the per-commit body churn bounded,
    // the same regime normal walking stays in.
    const maxRemovesPerFrame = isMobile ? 2 : 4;

    // Re-prioritise pending adds by the player's CURRENT cell each tick. Ops
    // are appended as the player moves (queueChunkOperations), so without this
    // the chunk directly ahead can sit behind chunks that were nearest two
    // cells ago and are now behind the player — the "trees pop in once I'm
    // already standing in the cell" symptom. Removes carry no distance; keep
    // their relative order at the end.
    const pgx = currentGridPosRef.current.x;
    const pgz = currentGridPosRef.current.z;
    chunkOperationQueueRef.current.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'add' ? -1 : 1;
      if (a.type === 'remove') return 0;
      const ca = a.chunk as TerrainChunk;
      const cb = b.chunk as TerrainChunk;
      const da = (ca.gridX - pgx) ** 2 + (ca.gridZ - pgz) ** 2;
      const db = (cb.gridX - pgx) ** 2 + (cb.gridZ - pgz) ** 2;
      return da - db;
    });

    const adds: TerrainChunk[] = [];
    const removes: string[] = [];
    let addCount = 0;
    let removeCount = 0;

    const remainingOps: typeof chunkOperationQueueRef.current = [];

    for (const op of chunkOperationQueueRef.current) {
      if (op.type === 'add') {
        const chunk = op.chunk as TerrainChunk;
        if (!loadedChunksRef.current.has(chunk.key)) {
          if (addCount < maxAddsPerFrame) {
            adds.push(chunk);
            loadedChunksRef.current.add(chunk.key);
            addCount++;
          } else {
            remainingOps.push(op);
          }
        }
      } else {
        const key = op.chunk as string;
        if (loadedChunksRef.current.has(key)) {
          if (removeCount < maxRemovesPerFrame) {
            removes.push(key);
            loadedChunksRef.current.delete(key);
            removeCount++;
          } else {
            remainingOps.push(op);
          }
        }
      }
    }
    
    chunkOperationQueueRef.current = remainingOps;
    
    if (adds.length > 0 || removes.length > 0) {
      batchUpdate(adds, removes);
    }
  }, [batchUpdate, isMobile]);

  useEffect(() => {
    queueChunkOperations(0, 0, effectiveRenderDistRef.current);
    processChunkQueue();
    updateMountainsForView(0, 0, width, height, seed);
  }, [queueChunkOperations, processChunkQueue, updateMountainsForView, width, height, seed]);

  // Two-phase teleport so the destination is fully streamed BEFORE the player
  // is moved there (no falling through un-generated terrain into the water):
  //
  //  • 'xrTerrainPreload' {x,z}  — begin preload. Pause the camera-driven check
  //    and stream the destination chunks ADD-ONLY (origin chunks the player is
  //    standing on stay put). The teleport waits for the destination chunk's
  //    geometry to register, then moves the player + camera there.
  //  • 'xrTerrainCommit' {x,z}   — player has been moved + camera snapped; end
  //    the preload, set the grid focus to the destination, and let the normal
  //    camera-driven check resume (which now evicts the origin chunks, paced).
  useEffect(() => {
    const onPreload = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d) return;
      preloadingRef.current = true;
      loadRampCapRef.current = renderDistRef.current.high;
      effectiveRenderDistRef.current = Math.min(renderDistRef.current.base, loadRampCapRef.current);
      const gp = getGridPosition(d.x, d.z);
      // Point the queue's nearest-first sort at the destination so the chunk
      // directly under the target loads FIRST (the teleport waits on it).
      currentGridPosRef.current = gp;
      queueChunkOperations(gp.x, gp.z, effectiveRenderDistRef.current, true /* addOnly */);
      processChunkQueue();
      updateMountainsForView(gp.x, gp.z, width, height, seed);
    };
    const onCommit = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d) return;
      const gp = getGridPosition(d.x, d.z);
      currentGridPosRef.current = gp;       // camera is now here; no false "move"
      preloadingRef.current = false;        // resume the camera-driven check
      lastGridCheckRef.current = 0;          // force it to run next frame (evict origin)
    };
    window.addEventListener('xrTerrainPreload', onPreload);
    window.addEventListener('xrTerrainCommit', onCommit);
    return () => {
      window.removeEventListener('xrTerrainPreload', onPreload);
      window.removeEventListener('xrTerrainCommit', onCommit);
    };
  }, [getGridPosition, queueChunkOperations, processChunkQueue, updateMountainsForView, width, height, seed]);

  // Lift the first-load render-distance cap after the heavy one-time load work
  // (VRM + animations + shader compiles + WASM) has had time to finish. The
  // useFrame grid check picks up the larger radius and streams the outer ring
  // in (throttled, 1 chunk per process tick) rather than at load.
  useEffect(() => {
    const t = setTimeout(() => {
      loadRampCapRef.current = renderDistRef.current.high;
    }, LOAD_RAMP_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useFrame((state) => {
    const currentTime = state.clock.elapsedTime;
    updateTerrainAudio();   // drive the shared audio-reactive uniform (terrain/grass pulse)

    // In XR mode, use the actual XR camera world position (includes XROrigin offset).
    // The base `camera.position` does NOT update when the user teleports in XR.
    // Stream off the AVATAR BODY ('playerOne'), not the camera. The third-person
    // camera LERPS (ecctrl follow-cam), so after a teleport it sweeps from origin
    // to destination — driving the grid check to load every cell in between (and
    // never the destination under the body, dropping the player into water). The
    // avatar tracks the rigid body rigidly, so it jumps instantly to the
    // destination and the right cells stream immediately. XR uses the XR camera
    // (there the camera IS the player); otherwise fall back to camera if the
    // avatar isn't in the scene yet.
    let playerPos = camera.position;
    if ((gl as WebGLRenderer).xr?.isPresenting) {
      const xrCam = (gl as WebGLRenderer).xr.getCamera();
      if (xrCam) {
        xrCam.getWorldPosition(playerPositionRef.current);
        playerPos = playerPositionRef.current;
      }
    } else {
      const avatar = scene.getObjectByName('playerOne');
      if (avatar) {
        avatar.getWorldPosition(playerPositionRef.current);
        playerPos = playerPositionRef.current;
      }
    }

    if (playerPos !== playerPositionRef.current) {
      playerPositionRef.current.set(playerPos.x, playerPos.y, playerPos.z);
    }

    const playerAltitude = playerPos.y - positionY;
    const isHighAlt = playerAltitude > HIGH_ALT_THRESHOLD;
    // Cap by the first-load ramp so the outer ring isn't requested until the
    // ramp has lifted (loadRampCapRef === HIGH_ALT_RENDER_DISTANCE after the
    // delay, so it stops limiting once load has settled).
    const altRD = isHighAlt ? renderDistRef.current.high : renderDistRef.current.base;
    const targetRD = Math.min(altRD, loadRampCapRef.current);
    const rdChanged = targetRD !== effectiveRenderDistRef.current;
    if (rdChanged) {
      effectiveRenderDistRef.current = targetRD;
    }

    // Terrain collider gating. While flying well above the terrain the player
    // can't touch the ground, so skip the per-chunk trimesh cook (the
    // synchronous main-thread spike that tears frames while streaming chunks
    // under a held W). Re-enable as the player descends within reach of the
    // ground (heightScale + margin above the terrain base) or stops flying,
    // so there's always something to land on. Mountains keep their own
    // colliders regardless, so peaks remain solid.
    const flying = typeof window !== 'undefined' && (window as any).__playerFlying;
    const collidersShouldBeActive = !flying || playerAltitude < heightScale + 25;
    if (collidersShouldBeActive !== collidersActiveRef.current) {
      collidersActiveRef.current = collidersShouldBeActive;
      setCollidersActive(collidersShouldBeActive);
    }

    if (fogRef.current) {
      // Fog far should reach to the edge of the loaded terrain chunks
      // BASE_RENDER_DISTANCE=2 means chunks from -2 to +2, so ~2*width from player.
      // Tuning history — both endpoints were rejected: near=1.0*width put
      // virtually the whole view inside the fog ramp and washed the daytime
      // world toward pastel white; near=1.9/far=4.0 read as "no fog at all"
      // and the world lost its sense of scale. Current values keep the
      // playable foreground clean while distant chunks still recede.
      const baseFar = width * 3.2;
      const baseNear = width * 1.35;
      // When flying high, push fog out further for the extra render distance
      const highFar = width * 5.2;
      const highNear = width * 2.3;
      const altFactor = Math.min(1, Math.max(0, (playerAltitude - HIGH_ALT_THRESHOLD) / 80));
      const targetFar = baseFar + (highFar - baseFar) * altFactor;
      const targetNear = baseNear + (highNear - baseNear) * altFactor;
      fogRef.current.far += (targetFar - fogRef.current.far) * 0.05;
      fogRef.current.near += (targetNear - fogRef.current.near) * 0.05;
      const { horizon, mid, sky } = skyColorsRef.current;
      if (horizon && mid) {
        // Fog hue: MID sky band pulled toward the deeper SKY blue, with a
        // small horizon-warmth touch. Mid alone (#85C1E9 at midday) is
        // still a pastel — blending toward the top-sky color keeps the
        // distance readable instead of milky.
        const targetFogColor = sky
          ? mid.clone().lerp(sky, 0.6).lerp(horizon, 0.08)
          : mid.clone().lerp(horizon, 0.25);
        fogRef.current.color.lerp(targetFogColor, 0.03);
      }
    }
    
    const gridCheckInterval = 0.2;
    // Skip the camera-driven grid check during a teleport preload — the camera
    // is at the origin but we're deliberately streaming the destination, and a
    // camera-based pass here would evict it (and the player's origin chunks).
    if (!preloadingRef.current && currentTime - lastGridCheckRef.current >= gridCheckInterval) {
      lastGridCheckRef.current = currentTime;

      const newGridPos = getGridPosition(playerPos.x, playerPos.z);
      const rd = effectiveRenderDistRef.current;

      const moved = newGridPos.x !== currentGridPosRef.current.x || newGridPos.z !== currentGridPosRef.current.z;
      // Once the player starts exploring, the heavy one-time load is done —
      // lift the first-load radius cap immediately instead of waiting out the
      // timer. (Picked up by next frame's targetRD computation.)
      if (moved && loadRampCapRef.current < renderDistRef.current.high) {
        loadRampCapRef.current = renderDistRef.current.high;
      }

      if (moved || rdChanged) {
        currentGridPosRef.current = newGridPos;
        queueChunkOperations(newGridPos.x, newGridPos.z, rd);
        updateMountainsForView(newGridPos.x, newGridPos.z, width, height, seed);
        
        const waterGridX = waterGridPosRef.current.x;
        const waterGridZ = waterGridPosRef.current.z;
        const distFromWaterCenter = Math.max(
          Math.abs(newGridPos.x - waterGridX),
          Math.abs(newGridPos.z - waterGridZ)
        );
        
        if (distFromWaterCenter >= 2) {
          waterGridPosRef.current = { x: newGridPos.x, z: newGridPos.z };
          const newCenterX = newGridPos.x * width + width / 2;
          const newCenterZ = newGridPos.z * height + height / 2;
          setWaterCenter(newCenterX, newCenterZ);
        }
      }
    }
    
    // Drain the chunk queue every frame on desktop (it early-returns when
    // empty, so it's free when idle). The old 0.2s/0.5s gate left the worker
    // idling ~180ms between chunks — terrain + decorations then only started
    // generating once the player had already entered the cell. maxAddsPerFrame
    // is the real throttle now; mobile keeps a light interval to cap mount
    // bursts on weaker devices.
    const processInterval = isMobile ? 0.1 : 0;
    if (currentTime - lastProcessTimeRef.current >= processInterval) {
      lastProcessTimeRef.current = currentTime;
      processChunkQueue();
    }

    if (currentTime - lastVisibilityCheckRef.current >= 0.5) {
      lastVisibilityCheckRef.current = currentTime;
      // Cavern/surface detection (which hides sky+water+terrain when you're
      // inside a mountain) must use the AVATAR's body position, NOT the camera.
      // In third-person the camera orbits the avatar, so a camera that swings
      // into a mountain would wrongly flip you to "inside" and hide the sky/
      // water while you're actually out in the open. "playerOne" is the avatar
      // (same object the networking code reads). Fall back to the camera
      // position when it's absent (e.g. before the avatar loads).
      const avatar = scene.getObjectByName('playerOne');
      let ex = playerPos.x, ey = playerPos.y, ez = playerPos.z;
      if (avatar) {
        avatar.getWorldPosition(envPosRef.current);
        ex = envPosRef.current.x; ey = envPosRef.current.y; ez = envPosRef.current.z;
      }
      updatePlayerEnvironment(ex, ey, ez, positionY);
    }
  });
  
  const waterLevel = mapRange(0.48, 0, 1, -heightScale, heightScale);
  const totalSize = (renderDistRef.current.high * 2 + 1) * width;
  
  const SkyComponent = useWebGLForXR ? ProceduralSkyWebGL : ProceduralSky;
  const WaterComponent = useWebGLForXR ? WaterShaderWebGL : WaterShader;
  const TerrainComponent = useWebGLForXR ? ProceduralTerrainWebGL : ProceduralTerrain;
  const MountainComponent = useWebGLForXR ? MountainMeshWebGL : MountainMesh;

  return (
    <>
      {/* Constant-count cavern light pool — mounts BEFORE any mountain so
          the scene's light state never changes when caverns stream in
          (light-count changes invalidate every compiled pipeline). */}
      <CavernLightPool />
      {/* Compile mountain/cavern pipelines at load instead of on the first
          mountain encounter (WebGPU compiles synchronously on first draw —
          traced as >1s freezes flying near mountains). WebGL twins use
          stock/Shader materials with their own cheap compiles. */}
      {!useWebGLForXR && <MountainPipelinePrewarm />}
      {/* Biome-dependent ambient motes (dust/pollen/midges) around the
          player — one small Points pool, WebGPU path only. */}
      {!useWebGLForXR && <AmbientParticles seed={seed} />}
      {skyVisible && (
        <SkyComponent
          seed={seed}
          sunPosition={[0, 1, -1]}
          sunColor="#ffff00"
          sunSize={0.1}
          skyColor={skyColor}
          horizonColor={horizonColor}
          cloudColor={cloudColor}
          cloudDensity={cloudDensity}
          cloudScale={cloudScale}
          cloudSpeed={cloudSpeed}
          cloudHeight={cloudHeight}
          cloudLayers={cloudLayers}
          timeOfDay={timeOfDay}
          timeCycleDuration={timeCycleDuration}
        />
      )}
      
      {globalWaterVisible && (
        <WaterComponent
          width={totalSize}
          height={totalSize}
          waterLevel={waterLevel}
          positionY={positionY + waterLevel}
          chunkWidth={width}
          chunkHeight={height}
        />
      )}

      {activeMountainsArray.map((mountain) => (
        <group key={mountain.id} position={[mountain.worldX, positionY - 3, mountain.worldZ]}>
          <MountainComponent mountain={mountain} seed={seed} allMountains={activeMountainsArray} />
          {mountain.cavern && (
            <CavernSystem cavern={mountain.cavern} seed={seed} useWebGL={useWebGLForXR} />
          )}
        </group>
      ))}
      
      {terrainVisible && chunksArray.map((chunk) => {
        const chunkPosX = chunk.gridX * width;
        const chunkPosZ = chunk.gridZ * height;
        const isCenterChunk = chunk.gridX === 0 && chunk.gridZ === 0;
        
        return (
          <TerrainComponent
            key={chunk.key}
            width={width}
            height={height}
            segments={segments}
            scale={scale}
            heightScale={heightScale}
            positionX={chunkPosX}
            positionY={positionY}
            positionZ={chunkPosZ}
            rotationX={rotationX}
            rotationY={rotationY}
            rotationZ={rotationZ}
            color={color}
            roughness={roughness}
            metalness={metalness}
            seed={seed}
            noiseOctaves={noiseOctaves}
            noisePersistence={noisePersistence}
            noiseLacunarity={noiseLacunarity}
            skyColor={skyColor}
            horizonColor={horizonColor}
            cloudColor={cloudColor}
            cloudDensity={cloudDensity}
            cloudScale={cloudScale}
            cloudSpeed={cloudSpeed}
            cloudHeight={cloudHeight}
            cloudLayers={cloudLayers}
            timeOfDay={timeOfDay}
            timeCycleDuration={timeCycleDuration}
            gridX={chunk.gridX}
            gridZ={chunk.gridZ}
            isCenterChunk={isCenterChunk}
            playerPosition={playerPositionRef.current}
            enableDecorations={decorationsEnabled}
          />
        );
      })}
    </>
  );
}
