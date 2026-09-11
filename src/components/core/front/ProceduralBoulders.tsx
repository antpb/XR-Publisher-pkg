/**
 * ProceduralBoulders — chunk-level boulder renderer.
 *
 * Construction runs in the terrain worker (`terrainWorker.ts` →
 * `decorations/boulderBuilder.ts`). This component:
 *
 *  1. Reads `precomputedSpawns` (from the parent `ProceduralTerrain`).
 *  2. Asks the worker to build merged geometry — one `BakedMesh`
 *     under `groups.main`.
 *  3. Wraps it in a single `BufferGeometry` + `Mesh` sharing the
 *     one-compile boulder material (`getSharedBoulderMaterial`).
 *  4. Adds the mesh imperatively to its `<group>` so no React
 *     reconciliation fires per boulder.
 *
 * No per-boulder Object3Ds, no state churn during generation, no
 * worker-fallback silently producing nothing — if the worker returns
 * null we fall back to running `buildBoulderDecoration` on the main
 * thread (same pure-JS builder the worker uses), so every path
 * produces identical pixels.
 */
import React, { useEffect, useRef } from 'react';
import {
  Group, Mesh, BufferGeometry, BufferAttribute, FrontSide,
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { positionLocal, mx_noise_vec3, vec3, float } from 'three/tsl';
import { createDarknessNode } from './terrainDarkness';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';
import type { BakedMesh } from '../../../terrain/TerrainWorkerClient';
import { buildBoulderDecoration } from '../../../workers/decorations/boulderBuilder';
import { useChunkBundle } from './chunkBundle';

const isMobile = typeof navigator !== 'undefined'
  && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/* ── Shared boulder material (unchanged from pre-worker) ─────────── */

let _sharedBoulderMaterial: MeshStandardNodeMaterial | null = null;

function getSharedBoulderMaterial(): MeshStandardNodeMaterial {
  if (_sharedBoulderMaterial) return _sharedBoulderMaterial;

  const pos = positionLocal;
  const largeNoise = mx_noise_vec3(vec3(pos.x.mul(0.8), pos.y.mul(0.8), pos.z.mul(0.8))).x;
  const mediumNoise = mx_noise_vec3(vec3(pos.x.mul(2.5), pos.y.mul(2.5), pos.z.mul(2.5))).x;
  const fineNoise = mx_noise_vec3(vec3(pos.x.mul(6.0), pos.y.mul(6.0), pos.z.mul(6.0))).x;

  // Albedo for a LIT material — sits in the terrain's mountain-rock band
  // (#6b6b6b ≈ 0.42 is the BRIGHTEST nearby rock tone; staying under it
  // keeps sunlit boulders from reading paler than the ground).
  const baseGray = float(0.34);
  const colorVariation = largeNoise.mul(0.25).add(mediumNoise.mul(0.15)).add(fineNoise.mul(0.08));
  const finalGray = baseGray.add(colorVariation);

  const mat = new MeshStandardNodeMaterial();
  // × darkness like every other lit world material (terrain, mountains,
  // trunks). Boulders were the one decoration without it — at night the
  // moonlight + ambient fill lit them at full albedo while everything
  // around them dimmed to 0.35, so rocks glowed against the dark terrain.
  mat.colorNode = vec3(finalGray.mul(1.05), finalGray.mul(0.98), finalGray.mul(0.92))
    .mul(createDarknessNode());
  mat.roughnessNode = float(0.9);
  mat.metalnessNode = float(0.05);
  mat.side = FrontSide;

  _sharedBoulderMaterial = mat;
  return mat;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function bakedToGeometry(mesh: BakedMesh): BufferGeometry | null {
  if (!mesh || mesh.positions.length === 0 || mesh.indices.length === 0) return null;
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(mesh.positions, 3));
  geom.setAttribute('normal', new BufferAttribute(mesh.normals, 3));
  geom.setIndex(new BufferAttribute(mesh.indices, 1));
  geom.computeBoundingSphere();
  return geom;
}

/* ── Props / Component ───────────────────────────────────────────── */

interface ProceduralBouldersProps {
  width: number;
  height: number;
  /**
   * Present for API compatibility — parents still pass these. The new
   * merged-mesh path ignores them (vertex coords are chunk-local and
   * the parent chunk group supplies the world offset).
   */
  positionX: number;
  positionY: number;
  positionZ: number;
  seed: string;
  gridX: number;
  gridZ: number;
  /** Kept for fallback/legacy callers — not used on the worker path. */
  heightData: Float32Array;
  heightScale: number;
  biomeDensity?: number;
  precomputedSpawns?: Float32Array;
}

export function ProceduralBoulders({
  seed,
  gridX,
  gridZ,
  precomputedSpawns,
  // Unused on the worker path; silence TS noUnusedParameters via void.
  width: _width,
  height: _height,
  positionX: _positionX,
  positionY: _positionY,
  positionZ: _positionZ,
  heightData: _heightData,
  heightScale: _heightScale,
  biomeDensity: _biomeDensity,
}: ProceduralBouldersProps) {
  const groupRef = useRef<Group>(null);
  // Opaque static boulders render through the chunk's WebGPU bundle.
  const chunkBundle = useChunkBundle();

  useEffect(() => {
    if (!precomputedSpawns || precomputedSpawns.length === 0) return;

    const aborted = { value: false };
    // Cancel the queued build on scroll-away (see ProceduralTrees).
    const abort = new AbortController();
    const mounted: Mesh[] = [];

    const mountGroups = (groups: { main: BakedMesh } | null | undefined) => {
      if (aborted.value) return;
      if (!groups || !groupRef.current) return;

      const geom = bakedToGeometry(groups.main);
      if (!geom) return;

      const mesh = new Mesh(geom, getSharedBoulderMaterial());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { camExcludeCollision: true };
      mesh.frustumCulled = false;
      mesh.matrixAutoUpdate = false;
      (mesh as any).raycast = (): null => null;
      (chunkBundle ? chunkBundle.group : groupRef.current).add(mesh);
      chunkBundle?.invalidate();
      mounted.push(mesh);
    };

    const rngSalt = `${seed}-boulders-${gridX}-${gridZ}`;
    terrainWorker
      .buildDecorationGeometry(
        'boulders',
        precomputedSpawns,
        0, 0, // chunk-local spawns, see ProceduralTrees.tsx rationale
        isMobile,
        rngSalt,
        undefined,
        { signal: abort.signal, centerX: gridX * _width, centerZ: gridZ * _height },
      )
      .then((result) => {
        if (result) {
          mountGroups(result.groups as { main: BakedMesh });
        } else {
          const local = buildBoulderDecoration({
            spawns: new Float32Array(precomputedSpawns),
            isMobile,
            rngSeedSalt: rngSalt,
          });
          mountGroups(local);
        }
      })
      .catch((err) => {
        console.warn('[ProceduralBoulders] worker build failed, trying main-thread fallback', err);
        try {
          const local = buildBoulderDecoration({
            spawns: new Float32Array(precomputedSpawns),
            isMobile,
            rngSeedSalt: rngSalt,
          });
          mountGroups(local);
        } catch (e) {
          console.error('[ProceduralBoulders] main-thread fallback also failed', e);
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
  }, [precomputedSpawns, seed, gridX, gridZ]);

  return <group ref={groupRef as any} />;
}
