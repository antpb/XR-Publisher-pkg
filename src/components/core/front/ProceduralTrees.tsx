/**
 * ProceduralTrees — chunk-level tree renderer.
 *
 * Construction lives in the terrain worker (`terrainWorker.ts` →
 * `decorations/treeBuilder.ts`). This component:
 *
 *  1. Reads `precomputedSpawns` (from the parent `ProceduralTerrain`).
 *  2. Asks the worker to build merged geometry — two `BakedMesh`
 *     groups, `trunks` and `foliage`.
 *  3. Wraps each group in one `BufferGeometry` + `Mesh`, attaches the
 *     module-shared materials, and adds them imperatively to a single
 *     `<group>`.
 *
 * No per-tree Object3Ds, no `requestIdleCallback` stagger, no React
 * state churn during generation — the only React commit is the
 * initial empty `<group ref>` mount. Per-tree position / rotation /
 * scale is baked into the worker output's vertex coordinates.
 *
 * Worker-fallback path (UMD `data:` URL, no Worker available): the
 * component renders nothing this round. Spawn data is preserved on the
 * parent's ref so a future migration of `ProceduralTreesWebGL.tsx`
 * could pick it up.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Vector3, Group, Mesh,
  BufferGeometry, BufferAttribute, FrontSide, Sphere,
  TextureLoader, RepeatWrapping, SRGBColorSpace, type Texture,
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
  float, attribute, texture as tslTexture, positionLocal, normalLocal,
  time, vec3,
} from 'three/tsl';
import leafTextureUrl from '../../../defaults/assets/seamlessleaves.jpg';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { createDarknessNode } from './terrainDarkness';
import { getBiomeAt } from './biomeHelpers';
import { useChunkBundle } from './chunkBundle';
import { useChunkProximityVisible } from './useChunkProximityVisible';
import { useTerrainChunkStore } from './terrainChunkStore';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';
import type { BakedMesh } from '../../../terrain/TerrainWorkerClient';
// Same builder imported by terrainWorker.ts. Pure JS (no `self` /
// `postMessage` refs), safe to call from the main thread as a fallback
// when the worker is unavailable (UMD `data:` URL path).
import { buildTreeDecoration, TREE_COLLIDER_STRIDE } from '../../../workers/decorations/treeBuilder';
import { setChunkTreeColliders, clearChunkTreeColliders } from './treeColliderStore';
import { filterSpawnsByPatches } from '../../../decorations/groundPatchUniforms';
import { getPrefetch, treePrefetchKey } from './decorationPrefetch';

// Tree/boulder/shrub spawn arrays are 7 floats per record (x,y,z,scale,rot…).
const DECO_SPAWN_STRIDE = 7;

interface ProceduralTreesProps {
  chunkX: number;
  chunkZ: number;
  seed: string;
  width: number;
  height: number;
  heightScale: number;
  segments: number;
  heightData: Float32Array;
  colorData?: Float32Array;
  playerPosition?: Vector3;
  treeDensity?: number;
  positionY?: number;
  precomputedSpawns?: Float32Array;
}

const isMobile = typeof navigator !== 'undefined'
  && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/* ── Shared materials ─────────────────────────────────────────────────
 *
 * Trunk material reads `attribute('color')` for species bark tinting
 * (oak tan-brown, pine reddish, birch white-grey — values baked into
 * the worker output).
 *
 * Canopy material is LIT-BUT-FLAT (standard, roughness 1, metalness 0):
 * the BotW-style top-lit gradient and per-blob tint jitter are baked
 * into vertex colors by the worker (treeBuilder) and used as ALBEDO, so
 * the canopy still reads stylized-flat but picks up real sun response —
 * sun-side/shade-side variation, the dawn/dusk intensity ramp, and the
 * cool moonlight at night. (It was unlit for a while; unlit foliage
 * ignored the sun entirely and stuck out bright against the lit
 * terrain.) Opaque, FrontSide — no alphaTest, no transparency. The
 * WebGL twin matches with a stock MeshLambertMaterial({ vertexColors }).
 * A very low-frequency wind node wobbles each whole blob as a mass.
 *
 * If you change the canopy lighting model, change the shrub foliage
 * material (ProceduralShrubs[WebGL]) the same way — the two foliage
 * families shading differently under one sun breaks the look. */

let _sharedTrunkMaterial: MeshStandardNodeMaterial | null = null;
let _sharedCanopyMaterial: MeshStandardNodeMaterial | null = null;
let _leafTexture: Texture | null = null;

/** Triplanar tile frequency: leaf texture repeats every 1/this world units
 *  (≈ every 2.5u). Higher = denser/smaller leaves. Must match the WebGL
 *  twin's CANOPY_TEX_TILE. */
const CANOPY_TEX_TILE = 0.4;

/** Shared seamless leaf texture (one GPU upload for the whole world). */
function getLeafTexture(): Texture {
  if (_leafTexture) return _leafTexture;
  const tex = new TextureLoader().load(leafTextureUrl);
  // Tiled across the blob shell (UVs are a top-down planar projection
  // scaled by the species' leafTextureScale — see treeBuilder.emitBlob).
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  // Trilinear mipmaps (default) + max anisotropy — keeps the texture sharp
  // at the grazing silhouette rim of the blob instead of smearing.
  tex.anisotropy = 16;
  _leafTexture = tex;
  return tex;
}

function getSharedTrunkMaterial(): MeshStandardNodeMaterial {
  if (_sharedTrunkMaterial) return _sharedTrunkMaterial;
  const mat = new MeshStandardNodeMaterial();
  mat.side = FrontSide;
  mat.colorNode = attribute('color').mul(createDarknessNode());
  mat.roughnessNode = float(0.9);
  mat.metalnessNode = float(0.05);
  _sharedTrunkMaterial = mat;
  return mat;
}

function getSharedCanopyMaterial(): MeshStandardNodeMaterial {
  if (_sharedCanopyMaterial) return _sharedCanopyMaterial;
  // Solid canopy SHELL (treeBuilder.emitBlob), lit-but-flat. The opaque leaf
  // texture is TRIPLANAR-mapped in OBJECT space — three planar projections
  // (zy/xz/xy) blended by the normal — so texel density stays even on every
  // face, including the vertical sides where a single top-down UV smears the
  // texture down the silhouette. Object space = locked to this static baked
  // mesh, so it can't swim. × a gentle baked vertex-color tint (form +
  // faint species hue) × day/night darkness. roughness 1 / metalness 0: the
  // real sun supplies the shading (foliage contract — keep in lockstep with
  // the shrub foliage material). OPAQUE, FrontSide — a solid surface is
  // never a flat plane viewed edge-on, so no scanline compression.
  const mat = new MeshStandardNodeMaterial();
  mat.side = FrontSide;
  const darkness = createDarknessNode();
  const tex = getLeafTexture();
  const p = positionLocal.mul(float(CANOPY_TEX_TILE));
  const an = normalLocal.abs();
  const wsum = an.x.add(an.y).add(an.z).add(float(0.0001));
  const triTex = tslTexture(tex, p.zy).rgb.mul(an.x.div(wsum))
    .add(tslTexture(tex, p.xz).rgb.mul(an.y.div(wsum)))
    .add(tslTexture(tex, p.xy).rgb.mul(an.z.div(wsum)));
  mat.colorNode = triTex.mul(attribute('color')).mul(darkness);
  mat.roughnessNode = float(1);
  mat.metalnessNode = float(0);
  mat.transparent = false;

  // Gentle whole-canopy wind sway. Phase varies by chunk-local X/Z so
  // neighbouring trees sway out of step. Only the FINAL vertex position
  // moves — the triplanar colorNode samples the ORIGINAL positionLocal, so
  // the leaf texture doesn't crawl across the surface as it sways. (TSL
  // `time` keeps ticking inside the WebGPU render bundle.)
  const phase = positionLocal.x.mul(0.18).add(positionLocal.z.mul(0.18)).add(time.mul(0.42));
  const swayX = phase.sin().mul(0.07);
  const swayZ = phase.add(float(1.7)).sin().mul(0.05);
  mat.positionNode = positionLocal.add(vec3(swayX, 0, swayZ));

  _sharedCanopyMaterial = mat;
  return mat;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

/**
 * Build a Three.js BufferGeometry from a worker-emitted `BakedMesh`.
 * Empty groups (zero verts) return null so callers can skip the mount.
 */
function bakedToGeometry(mesh: BakedMesh, boundsRadius: number): BufferGeometry | null {
  if (!mesh || mesh.positions.length === 0 || mesh.indices.length === 0) {
    return null;
  }
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(mesh.positions, 3));
  geom.setAttribute('normal', new BufferAttribute(mesh.normals, 3));
  if (mesh.colors) geom.setAttribute('color', new BufferAttribute(mesh.colors, 3));
  if (mesh.uvs) geom.setAttribute('uv', new BufferAttribute(mesh.uvs, 2));
  geom.setIndex(new BufferAttribute(mesh.indices, 1));
  // Manual chunk-extent bounding sphere instead of computeBoundingSphere().
  // The merged trunk/foliage geometry can be hundreds of thousands of verts;
  // an O(N) scan per chunk-mount is a frame-cross stutter. The mesh is
  // frustumCulled=false for the main camera, but shadow-casters need a
  // non-null sphere or THREE recomputes it (O(N)) during the shadow pass.
  // A conservative chunk-local sphere satisfies shadow culling cheaply.
  geom.boundingSphere = new Sphere(new Vector3(0, 0, 0), boundsRadius);
  return geom;
}

/* ── Component ────────────────────────────────────────────────────── */

export function ProceduralTrees({
  chunkX,
  chunkZ,
  seed,
  width,
  height,
  segments: _segments,
  heightScale: _heightScale,
  heightData: _heightData,
  colorData: _colorData,
  playerPosition,
  treeDensity = 0.4,
  positionY = 0,
  precomputedSpawns,
}: ProceduralTreesProps) {
  const groupRef = useRef<Group>(null);
  // Chunk render bundle (WebGPU) — both trunks and the (now opaque)
  // canopy blobs mount into it.
  const chunkBundle = useChunkBundle();

  // Per-tree collider metadata from the worker (22 floats/tree). Mounted
  // as primitive shapes (capsule trunk + ball canopy) — no trimesh
  // cooking. Gated by the same altitude/flying flag as terrain colliders.
  const [treeColliders, setTreeColliders] = useState<Float32Array | null>(null);
  const collidersActive = useTerrainChunkStore((s) => s.collidersActive);

  // Publish the canopy blob spheres so PluginDecorations can hang
  // `anchor:'tree'` items off the real leaf surfaces (not a guessed crown).
  useEffect(() => {
    if (treeColliders && treeColliders.length > 0) {
      setChunkTreeColliders(chunkX, chunkZ, treeColliders);
    }
    return () => clearChunkTreeColliders(chunkX, chunkZ);
  }, [treeColliders, chunkX, chunkZ]);

  // Distance-based visibility gate (load on approach, unload on departure with
  // hysteresis). Evaluated per-frame from the live position — see
  // useChunkProximityVisible (a useMemo here only updates on re-render, which
  // froze decorations until an unrelated chunk add/remove fired).
  //
  // DESKTOP: wide on purpose — trees are the cheapest big decoration
  // (~18 trees × ~220 verts merged into 2 meshes per chunk, inside the
  // render bundle), and a narrow gate made mid/far chunks show BARE
  // terrain until the player approached — the "trees pop in late" first
  // impression. 3.6×width covers every chunk at BASE_RENDER_DISTANCE=2
  // (farthest chunk centre ≈ 3.54×width), so trees appear WITH the
  // terrain; defaultWhenNoPlayer=true so builds start during initial load.
  //
  // MOBILE: keep the ORIGINAL tight gate (1.2/1.6, default-false). Widening
  // it (2.0/2.4 was tried) ran the phone measurably hot — ~2× the rendered
  // tree vertices (canopy wind sway + triplanar fragments) on a thermally
  // throttled GPU. Mobile latency is instead covered by the proximity-gated
  // prefetch in ProceduralTerrain (nearby chunks' builds start at
  // terrain-resolve, so the gate opening mounts an already-built mesh).
  const shouldRender = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height,
    isMobile ? 1.2 : 3.6, isMobile ? 1.6 : 4.2, !isMobile,
  );

  // Resolve biome at the chunk centre — drives species selection in the
  // worker (mountain biomes prefer pine, default biomes prefer oak/birch).
  const biomeId = useMemo(() => {
    const cx = chunkX * width + width / 2;
    const cz = chunkZ * height + height / 2;
    return getBiomeAt(cx, cz, seed)?.id;
  }, [chunkX, chunkZ, width, height, seed]);

  /* Worker-driven mesh build.
   *
   * Same pattern as the previous staggered builder: imperative `.add()`
   * onto a ref'd group so React doesn't reconcile per-tree. Difference
   * is the construction now happens off-thread. The effect's cleanup
   * removes both meshes and disposes their merged geometries. */
  useEffect(() => {
    if (!shouldRender) return;
    if (!precomputedSpawns || precomputedSpawns.length === 0) return;

    const aborted = { value: false };
    // Cancel the queued build if this chunk unmounts before the worker
    // reaches it — trees stop trailing behind the terrain when moving fast.
    const abort = new AbortController();
    const mounted: Mesh[] = [];

    // Drop trees that fall on a dirt apron / campfire clearing (any registered
    // ground patch). Trees on ROADS are already removed in the worker (it filters
    // the spawn arrays against the baked road network before they ever arrive).
    const spawns = filterSpawnsByPatches(
      precomputedSpawns, DECO_SPAWN_STRIDE, chunkX, chunkZ, width, height,
    );
    if (!spawns || spawns.length === 0) return;

    // Tree spawns from the WASM terrain path are already chunk-local
    // (the spawn X/Z come straight out of the chunk-local positions
    // array Rust builds). Passing 0 origins means treeBuilder's
    // worldX/Z − origin subtraction is a no-op, and the vertex coords
    // stay chunk-local. The parent `ProceduralTerrain` chunk group's
    // own `position=[positionX, positionY, positionZ]` then moves the
    // whole decoration set to its correct world position — matching
    // the boulder / shrub / flower components, whose spawn coords also
    // live in chunk-local space.
    const chunkOriginX = 0;
    const chunkOriginZ = 0;

    // Conservative chunk-local cull radius (covers the chunk footprint +
    // terrain height swing + tallest tree). Used for the manual bounding
    // sphere so we skip the per-mount O(N) computeBoundingSphere scan.
    const boundsRadius = Math.hypot(width, height) + 80;

    const mountGroups = (groups: Record<string, BakedMesh> | null | undefined) => {
      if (aborted.value) return;
      if (!groups || !groupRef.current) return;

      // NOTE: do NOT set mesh.position.y — this component is a child of
      // the `ProceduralTerrain` chunk group, whose own `position` already
      // applies (positionX, positionY, positionZ) to every descendant.
      // Setting position.y here double-counted the offset and sent trees
      // into the sky. The WASM spawn array's Y is world-space already;
      // the tree builder bakes that into vertex coords; the chunk group's
      // Y offset places them correctly on the terrain.
      const trunkGeom = bakedToGeometry(groups.trunks, boundsRadius);
      if (trunkGeom) {
        const trunkMesh = new Mesh(trunkGeom, getSharedTrunkMaterial());
        trunkMesh.castShadow = true;
        trunkMesh.receiveShadow = true;
        trunkMesh.userData = { camExcludeCollision: true };
        trunkMesh.frustumCulled = false;
        // Static identity transform — skip the per-frame matrix recompose.
        trunkMesh.matrixAutoUpdate = false;
        (trunkMesh as any).raycast = (): null => null;
        (chunkBundle ? chunkBundle.group : groupRef.current).add(trunkMesh);
        chunkBundle?.invalidate();
        mounted.push(trunkMesh);
      }

      const foliageGeom = bakedToGeometry(groups.foliage, boundsRadius);
      if (foliageGeom) {
        const canopyMesh = new Mesh(foliageGeom, getSharedCanopyMaterial());
        // Solid opaque shell now → cast shadows to ground the trees (desktop;
        // off on mobile for the iOS memory/shadow-pass budget). The shadow
        // depth pass uses the un-swayed geometry while the visible mesh wind-
        // sways by ~0.14u — negligible for stylized foliage.
        canopyMesh.castShadow = !isMobile;
        canopyMesh.receiveShadow = false;
        canopyMesh.userData = { camExcludeCollision: true };
        canopyMesh.frustumCulled = false;
        canopyMesh.matrixAutoUpdate = false;
        (canopyMesh as any).raycast = (): null => null;
        (chunkBundle ? chunkBundle.group : groupRef.current).add(canopyMesh);
        chunkBundle?.invalidate();
        mounted.push(canopyMesh);
      }
    };

    // Prefer the geometry ProceduralTerrain PREFETCHED at terrain-resolve
    // time (decorationPrefetch.ts) — by the time the phase-2 gate opens the
    // worker job is usually done or well ahead in the queue. Divergence
    // guard: a ground patch may have registered between terrain resolve and
    // this mount; if the patch-filtered spawn count changed, the prefetched
    // build no longer matches — issue a fresh request instead.
    const prefetched = getPrefetch(treePrefetchKey(seed, chunkX, chunkZ));
    const buildPromise = (prefetched && prefetched.spawnCount === spawns.length)
      ? prefetched.promise
      // Cache miss: try the worker directly. If it returns null (UMD `data:`
      // URL path, worker init failure), fall back to running the same
      // builder on the main thread. Builder is pure JS and works either side.
      : terrainWorker.buildDecorationGeometry(
        'trees',
        spawns,
        chunkOriginX,
        chunkOriginZ,
        isMobile,
        `${seed}-${chunkX}-${chunkZ}`,
        biomeId,
        { signal: abort.signal, centerX: chunkX * width, centerZ: chunkZ * height },
      );
    buildPromise
      .then((result) => {
        if (result) {
          mountGroups(result.groups);
          if (!aborted.value && result.treeColliders && result.treeColliders.length > 0) {
            setTreeColliders(result.treeColliders);
          }
        } else {
          // Main-thread fallback. Slice the spawn array so we don't
          // hand a mutable reference into a synchronous call that may
          // mutate it (it doesn't today, but the typed-array contract
          // is sharper if we hand over an owned copy).
          const local = buildTreeDecoration({
            spawns: new Float32Array(spawns),
            chunkOriginX,
            chunkOriginZ,
            isMobile,
            rngSeedSalt: `${seed}-${chunkX}-${chunkZ}`,
            biomeId,
          });
          mountGroups(local.groups);
          if (!aborted.value && local.treeColliders.length > 0) {
            setTreeColliders(local.treeColliders);
          }
        }
      })
      .catch((err) => {
        console.warn('[ProceduralTrees] worker build failed, trying main-thread fallback', err);
        try {
          const local = buildTreeDecoration({
            spawns: new Float32Array(spawns),
            chunkOriginX,
            chunkOriginZ,
            isMobile,
            rngSeedSalt: `${seed}-${chunkX}-${chunkZ}`,
            biomeId,
          });
          mountGroups(local.groups);
          if (!aborted.value && local.treeColliders.length > 0) {
            setTreeColliders(local.treeColliders);
          }
        } catch (e) {
          console.error('[ProceduralTrees] main-thread fallback also failed', e);
        }
      });

    return () => {
      aborted.value = true;
      abort.abort();
      for (const m of mounted) {
        m.parent?.remove(m);
        m.geometry?.dispose();
      }
      chunkBundle?.invalidate();
      setTreeColliders(null);
    };
  }, [shouldRender, precomputedSpawns, chunkX, chunkZ, width, height, positionY, biomeId, seed]);

  // Quietly absorb props we no longer use (parent still passes them) so
  // TypeScript doesn't flag unused locals. treeDensity is consumed by
  // the worker indirectly (via spawn count from the WASM terrain pass).
  void treeDensity;

  if (!shouldRender) return null;
  if (!precomputedSpawns || precomputedSpawns.length === 0) return null;

  // Solid trunks: one fixed body per chunk holding a capsule per trunk
  // (primitive shapes — created O(1), no trimesh cooking). Canopies are
  // intentionally NOT solid — only the trunk is climbable; the player
  // (and camera) pass through leaves. The collider array still carries
  // blob spheres (stable format); we just don't mount them.
  // Proximity gate: the player can only ever touch a trunk within a couple
  // of metres, so we mount trunk colliders ONLY for the player's current
  // terrain cell + immediate neighbours (3×3). This decouples physics cost
  // from forest density — a dense grove three chunks away mounts zero
  // colliders until you walk into it. Chunk origin is chunkX*width (the
  // chunk spans [chunkX*width, chunkX*width+width]); player cell is the
  // matching floor-divide. Combined with the existing flying/altitude gate.
  let collidersNear = false;
  if (playerPosition) {
    const pcx = Math.floor(playerPosition.x / width);
    const pcz = Math.floor(playerPosition.z / height);
    collidersNear = Math.abs(pcx - chunkX) <= 1 && Math.abs(pcz - chunkZ) <= 1;
  }

  let colliderShapes: React.ReactNode = null;
  if (collidersActive && collidersNear && treeColliders && treeColliders.length > 0) {
    const shapes: React.ReactNode[] = [];
    const count = Math.floor(treeColliders.length / TREE_COLLIDER_STRIDE);
    for (let i = 0; i < count; i++) {
      const o = i * TREE_COLLIDER_STRIDE;
      const bx = treeColliders[o];
      const by = treeColliders[o + 1];
      const bz = treeColliders[o + 2];
      const halfH = treeColliders[o + 3];
      const trunkR = Math.max(0.06, treeColliders[o + 4]);
      shapes.push(
        <CapsuleCollider
          key={`trunk-${i}`}
          args={[halfH, trunkR]}
          position={[bx, by + halfH + trunkR, bz]}
        />,
      );
    }
    colliderShapes = (
      <RigidBody type="fixed" colliders={false}>
        {shapes}
      </RigidBody>
    );
  }

  return (
    <group ref={groupRef as any}>
      {colliderShapes}
    </group>
  );
}
