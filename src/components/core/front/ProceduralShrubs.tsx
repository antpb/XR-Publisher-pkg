/**
 * ProceduralShrubs — chunk-level shrub renderer.
 *
 * Construction runs in the terrain worker (`terrainWorker.ts` →
 * `decorations/shrubBuilder.ts`). This component:
 *
 *  1. Reads `precomputedSpawns` (from the parent `ProceduralTerrain`).
 *  2. Asks the worker to build two merged `BakedMesh`es —
 *     `groups.stems` (cylinders) and `groups.foliage` (squashed spheres).
 *  3. Mounts one `<mesh>` per group with the shared stem / foliage
 *     materials; adds them imperatively to a single `<group>`.
 *
 * Per-shrub position / rotation / scale is baked into vertex coords,
 * so no per-shrub Object3Ds and no React reconciliation during load.
 */
import React, { useRef, useEffect } from 'react';
import {
  Vector3, Group, Mesh, DoubleSide,
  BufferGeometry, BufferAttribute, Sphere,
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
  positionLocal, positionWorld, normalLocal,
  time, mx_noise_vec3, vec3, float, mix, smoothstep,
} from 'three/tsl';
import { createDarknessNode } from './terrainDarkness';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';
import type { BakedMesh } from '../../../terrain/TerrainWorkerClient';
import { buildShrubDecoration } from '../../../workers/decorations/shrubBuilder';
import { useChunkBundle } from './chunkBundle';
import { useChunkProximityVisible } from './useChunkProximityVisible';

interface ProceduralShrubsProps {
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
  shrubDensity?: number;
  positionY?: number;
  precomputedSpawns?: Float32Array;
}

/* ── Shared materials (unchanged visually from pre-worker) ──────── */

let _sharedShrubMaterial: MeshStandardNodeMaterial | null = null;
let _sharedStemMaterial: MeshStandardNodeMaterial | null = null;

function getSharedStemMaterial(): MeshStandardNodeMaterial {
  if (!_sharedStemMaterial) {
    _sharedStemMaterial = new MeshStandardNodeMaterial();
    _sharedStemMaterial.colorNode = vec3(0.35, 0.22, 0.12).mul(createDarknessNode());
    _sharedStemMaterial.roughnessNode = float(0.9);
    _sharedStemMaterial.metalnessNode = float(0.05);
  }
  return _sharedStemMaterial;
}

function getSharedShrubMaterial(): MeshStandardNodeMaterial {
  if (!_sharedShrubMaterial) {
    // LIT-BUT-FLAT, exactly like the tree canopy material (standard,
    // roughness 1, metalness 0): a top-lit vertex-normal gradient (same
    // `smoothstep((nY+0.6)/1.5)` ramp treeBuilder bakes into canopy vertex
    // colors) × per-shrub patch noise × day/night darkness, used as ALBEDO
    // so the foliage responds to the actual sun. The two foliage families
    // must always use the same lighting model — when one was lit and the
    // other unlit they shaded differently under one sky and the seams
    // broke the stylized look.
    const mat = new MeshStandardNodeMaterial();
    mat.side = DoubleSide;
    mat.roughnessNode = float(1.0);
    mat.metalnessNode = float(0.0);

    const localPos = positionLocal;
    const worldPos = positionWorld;

    const windInput = vec3(
      localPos.x.mul(3.0).add(time.mul(0.5)),
      localPos.z.mul(3.0).add(time.mul(0.35)),
      localPos.y.mul(1.2)
    );
    const windNoise = mx_noise_vec3(windInput).x;
    const sway = windNoise.mul(2.0).sub(1.0).mul(0.015);
    mat.positionNode = localPos.add(vec3(sway, float(0), sway.mul(0.5)));

    const colorNoise = mx_noise_vec3(vec3(
      worldPos.x.mul(0.18),
      worldPos.y.mul(0.4),
      worldPos.z.mul(0.18)
    )).x.mul(0.5).add(0.5);

    // Same gradient ramp as the baked canopy colors, with tints pulled
    // from the oak palette (species.ts) so shrubs read as the trees'
    // little siblings — keep these in lockstep with SPECIES_OAK's
    // terrain-anchored canopy tints.
    const topTint = vec3(0.26, 0.45, 0.18);
    const bottomTint = vec3(0.09, 0.20, 0.08);
    const grad = smoothstep(float(0), float(1), normalLocal.y.add(0.6).div(1.5));
    const gradColor = mix(bottomTint, topTint, grad);
    // Patch variation stands in for the trees' per-blob tint jitter.
    const jitter = colorNoise.mul(0.24).add(0.88);

    mat.colorNode = gradColor.mul(jitter).mul(createDarknessNode());

    _sharedShrubMaterial = mat;
  }
  return _sharedShrubMaterial;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function bakedToGeometry(mesh: BakedMesh, boundsRadius: number): BufferGeometry | null {
  if (!mesh || mesh.positions.length === 0 || mesh.indices.length === 0) return null;
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(mesh.positions, 3));
  geom.setAttribute('normal', new BufferAttribute(mesh.normals, 3));
  geom.setIndex(new BufferAttribute(mesh.indices, 1));
  // Manual chunk-extent sphere — skip the O(N) computeBoundingSphere scan and
  // the lazy shadow-pass recompute (shrub foliage casts shadows). See the
  // matching note in ProceduralTrees.
  geom.boundingSphere = new Sphere(new Vector3(0, 0, 0), boundsRadius);
  return geom;
}

/* ── Component ────────────────────────────────────────────────────── */

export function ProceduralShrubs({
  chunkX, chunkZ, width, height,
  playerPosition,
  precomputedSpawns,
  // Parent still passes these but the worker path doesn't need them.
  seed: _seed,
  heightScale: _heightScale,
  segments: _segments,
  heightData: _heightData,
  colorData: _colorData,
  shrubDensity: _shrubDensity,
  positionY: _positionY,
}: ProceduralShrubsProps) {
  const groupRef = useRef<Group>(null);
  // Opaque static shrub meshes render through the chunk's WebGPU bundle.
  const chunkBundle = useChunkBundle();

  // Per-frame proximity gate (see useChunkProximityVisible) — a useMemo here
  // only re-evaluated on re-render, freezing visibility between chunk streams.
  const shouldRender = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height, 1.2, 1.6,
  );

  useEffect(() => {
    if (!shouldRender) return;
    if (!precomputedSpawns || precomputedSpawns.length === 0) return;

    const aborted = { value: false };
    // Cancel the queued build on scroll-away (see ProceduralTrees).
    const abort = new AbortController();
    const mounted: Mesh[] = [];
    // Conservative chunk-local cull radius for the manual bounding sphere.
    const boundsRadius = Math.hypot(width, height) + 40;

    const mountGroups = (groups: { stems: BakedMesh; foliage: BakedMesh } | null | undefined) => {
      if (aborted.value) return;
      if (!groups || !groupRef.current) return;

      const stemGeom = bakedToGeometry(groups.stems, boundsRadius);
      if (stemGeom) {
        const m = new Mesh(stemGeom, getSharedStemMaterial());
        m.castShadow = false;
        m.receiveShadow = true;
        m.userData = { camExcludeCollision: true };
        m.frustumCulled = false;
        m.matrixAutoUpdate = false;
        (m as any).raycast = (): null => null;
        (chunkBundle ? chunkBundle.group : groupRef.current).add(m);
        chunkBundle?.invalidate();
        mounted.push(m);
      }

      const foliageGeom = bakedToGeometry(groups.foliage, boundsRadius);
      if (foliageGeom) {
        const m = new Mesh(foliageGeom, getSharedShrubMaterial());
        m.castShadow = true;
        m.receiveShadow = false;
        m.userData = { camExcludeCollision: true };
        m.frustumCulled = false;
        m.matrixAutoUpdate = false;
        (m as any).raycast = (): null => null;
        (chunkBundle ? chunkBundle.group : groupRef.current).add(m);
        chunkBundle?.invalidate();
        mounted.push(m);
      }
    };

    terrainWorker
      .buildDecorationGeometry(
        'shrubs',
        precomputedSpawns,
        0, 0, // chunk-local spawns
        false, // isMobile is unused by the shrub builder, kept for API shape
        '', // rngSeedSalt unused by shrub builder (seed is per-shrub in the spawn)
        undefined,
        { signal: abort.signal, centerX: chunkX * width, centerZ: chunkZ * height },
      )
      .then((result) => {
        if (result) {
          mountGroups(result.groups as { stems: BakedMesh; foliage: BakedMesh });
        } else {
          mountGroups(
            buildShrubDecoration({ spawns: new Float32Array(precomputedSpawns) }),
          );
        }
      })
      .catch((err) => {
        console.warn('[ProceduralShrubs] worker build failed, trying main-thread fallback', err);
        try {
          mountGroups(
            buildShrubDecoration({ spawns: new Float32Array(precomputedSpawns) }),
          );
        } catch (e) {
          console.error('[ProceduralShrubs] main-thread fallback also failed', e);
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
    };
  }, [shouldRender, precomputedSpawns, chunkX, chunkZ]);

  if (!shouldRender) return null;
  if (!precomputedSpawns || precomputedSpawns.length === 0) return null;

  return <group ref={groupRef as any} />;
}
