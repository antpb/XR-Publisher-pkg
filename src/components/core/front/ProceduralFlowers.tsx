/**
 * ProceduralFlowers — chunk-level flower renderer.
 *
 * Construction runs in the terrain worker (`terrainWorker.ts` →
 * `decorations/flowerBuilder.ts`). This component:
 *
 *  1. Reads `precomputedSpawns` (from the parent `ProceduralTerrain`).
 *  2. Asks the worker to build three merged `BakedMesh`es —
 *     `groups.stems`, `groups.centers`, `groups.petals`.
 *  3. Mounts three `<mesh>`es with shared materials. The per-palette
 *     RGB (old code had 7 keyed materials) is now baked into each
 *     merged mesh's per-vertex `color` attribute — so **one** petal
 *     material + **one** center material cover the whole world.
 */
import React, { useRef, useEffect } from 'react';
import {
  Vector3, Group, Mesh, DoubleSide,
  BufferGeometry, BufferAttribute,
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
  positionLocal, positionWorld, normalWorld,
  time, mx_noise_vec3, vec3, float, mix,
  attribute, cameraPosition,
} from 'three/tsl';
import { createDarknessNode } from './terrainDarkness';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';
import type { BakedMesh } from '../../../terrain/TerrainWorkerClient';
import { buildFlowerDecoration } from '../../../workers/decorations/flowerBuilder';
import { useChunkBundle } from './chunkBundle';
import { useChunkProximityVisible } from './useChunkProximityVisible';

interface ProceduralFlowersProps {
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
  flowerDensity?: number;
  positionY?: number;
  precomputedSpawns?: Float32Array;
}

/* ── Shared materials ─────────────────────────────────────────────
 *
 * Stems use a green TSL colour — unchanged from pre-worker.
 * Centers + Petals now read `attribute('color')` so their per-palette
 * tint comes from the merged mesh's vertex-colour buffer. The old
 * `_centerMaterialCache` / `_petalMaterialCache` Maps are gone.
 */

let _sharedStemMaterial: MeshStandardNodeMaterial | null = null;
let _sharedCenterMaterial: MeshStandardNodeMaterial | null = null;
let _sharedPetalMaterial: MeshStandardNodeMaterial | null = null;

function getSharedStemMaterial(): MeshStandardNodeMaterial {
  if (_sharedStemMaterial) return _sharedStemMaterial;
  const mat = new MeshStandardNodeMaterial();

  const localPos = positionLocal;
  const windInput = vec3(
    localPos.x.mul(5.0).add(time.mul(0.6)),
    localPos.z.mul(5.0).add(time.mul(0.45)),
    float(0)
  );
  const windNoise = mx_noise_vec3(windInput).x;
  const sway = windNoise.mul(2.0).sub(1.0).mul(0.006);
  mat.positionNode = localPos.add(vec3(sway, float(0), sway.mul(0.5)));

  mat.colorNode = vec3(0.20, 0.40, 0.12).mul(createDarknessNode());
  mat.roughnessNode = float(0.85);
  mat.metalnessNode = float(0.02);

  _sharedStemMaterial = mat;
  return mat;
}

function getSharedCenterMaterial(): MeshStandardNodeMaterial {
  if (_sharedCenterMaterial) return _sharedCenterMaterial;
  const mat = new MeshStandardNodeMaterial();
  // Per-palette RGB baked into per-vertex colours by the builder.
  mat.colorNode = attribute('color').mul(createDarknessNode());
  mat.roughnessNode = float(0.7);
  mat.metalnessNode = float(0.0);
  _sharedCenterMaterial = mat;
  return mat;
}

function getSharedPetalMaterial(): MeshStandardNodeMaterial {
  if (_sharedPetalMaterial) return _sharedPetalMaterial;
  const mat = new MeshStandardNodeMaterial();
  mat.side = DoubleSide;

  const worldPos = positionWorld;
  const localPos = positionLocal;

  // Wind sway — same shape as before.
  const windInput = vec3(
    localPos.x.mul(5.0).add(time.mul(0.8)),
    localPos.z.mul(5.0).add(time.mul(0.6)),
    float(0)
  );
  const windNoise = mx_noise_vec3(windInput).x;
  const sway = windNoise.mul(2.0).sub(1.0).mul(0.008);
  mat.positionNode = localPos.add(vec3(sway, float(0), sway.mul(0.5)));

  // Per-palette base RGB from vertex colour. Multiply by a lift to get
  // a brighter variant, then mix by world-noise so each flower cluster
  // has subtle hue micro-variation — matches the pre-worker look.
  const baseTint = attribute('color');
  const brighter = baseTint.mul(1.3).min(vec3(1.0, 1.0, 1.0));

  const colorNoise = mx_noise_vec3(vec3(
    worldPos.x.mul(0.5),
    worldPos.y.mul(0.5),
    worldPos.z.mul(0.5)
  )).x.mul(0.5).add(0.5);

  const petalColor = mix(baseTint, brighter, colorNoise);

  const viewDir = cameraPosition.sub(worldPos).normalize();
  const ndv = normalWorld.dot(viewDir).clamp(0, 1);
  const fresnel = float(1.0).sub(ndv).pow(float(2.0)).mul(0.2);

  mat.colorNode = petalColor.add(fresnel).mul(createDarknessNode());
  mat.roughnessNode = float(0.6);
  mat.metalnessNode = float(0.0);

  _sharedPetalMaterial = mat;
  return mat;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function bakedToGeometry(mesh: BakedMesh): BufferGeometry | null {
  if (!mesh || mesh.positions.length === 0 || mesh.indices.length === 0) return null;
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(mesh.positions, 3));
  geom.setAttribute('normal', new BufferAttribute(mesh.normals, 3));
  if (mesh.colors) geom.setAttribute('color', new BufferAttribute(mesh.colors, 3));
  geom.setIndex(new BufferAttribute(mesh.indices, 1));
  geom.computeBoundingSphere();
  return geom;
}

/* ── Component ────────────────────────────────────────────────────── */

export function ProceduralFlowers({
  chunkX, chunkZ, width, height,
  playerPosition,
  precomputedSpawns,
  seed: _seed,
  heightScale: _heightScale,
  segments: _segments,
  heightData: _heightData,
  colorData: _colorData,
  flowerDensity: _flowerDensity,
  positionY: _positionY,
}: ProceduralFlowersProps) {
  const groupRef = useRef<Group>(null);
  // Opaque static flower meshes render through the chunk's WebGPU bundle.
  const chunkBundle = useChunkBundle();

  // Per-frame proximity gate (see useChunkProximityVisible) — a useMemo here
  // only re-evaluated on re-render, freezing visibility between chunk streams.
  const shouldRender = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height, 1.0, 1.4,
  );

  useEffect(() => {
    if (!shouldRender) return;
    if (!precomputedSpawns || precomputedSpawns.length === 0) return;

    const aborted = { value: false };
    // Cancel the queued build on scroll-away (see ProceduralTrees).
    const abort = new AbortController();
    const mounted: Mesh[] = [];

    const mountGroups = (
      groups: { stems: BakedMesh; centers: BakedMesh; petals: BakedMesh } | null | undefined,
    ) => {
      if (aborted.value) return;
      if (!groups || !groupRef.current) return;

      const addGroup = (bm: BakedMesh, mat: MeshStandardNodeMaterial, castShadow: boolean) => {
        const geom = bakedToGeometry(bm);
        if (!geom) return;
        const mesh = new Mesh(geom, mat);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = false;
        mesh.userData = { camExcludeCollision: true };
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = false;
        (mesh as any).raycast = (): null => null;
        (chunkBundle ? chunkBundle.group : groupRef.current!).add(mesh);
        chunkBundle?.invalidate();
        mounted.push(mesh);
      };

      addGroup(groups.stems, getSharedStemMaterial(), false);
      addGroup(groups.centers, getSharedCenterMaterial(), false);
      addGroup(groups.petals, getSharedPetalMaterial(), true);
    };

    terrainWorker
      .buildDecorationGeometry(
        'flowers',
        precomputedSpawns,
        0, 0,
        false,
        '',
        undefined,
        { signal: abort.signal, centerX: chunkX * width, centerZ: chunkZ * height },
      )
      .then((result) => {
        if (result) {
          mountGroups(result.groups as { stems: BakedMesh; centers: BakedMesh; petals: BakedMesh });
        } else {
          mountGroups(
            buildFlowerDecoration({ spawns: new Float32Array(precomputedSpawns) }),
          );
        }
      })
      .catch((err) => {
        console.warn('[ProceduralFlowers] worker build failed, trying main-thread fallback', err);
        try {
          mountGroups(
            buildFlowerDecoration({ spawns: new Float32Array(precomputedSpawns) }),
          );
        } catch (e) {
          console.error('[ProceduralFlowers] main-thread fallback also failed', e);
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
