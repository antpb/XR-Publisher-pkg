/**
 * ProceduralBouldersWebGL — WebGL twin of ProceduralBoulders.
 *
 * Thin copy of the WebGPU component: the same worker-built merged
 * boulder geometry (boulderBuilder.ts) from the same WASM
 * `boulderSpawns` array, rendered with one shared stock
 * `MeshStandardMaterial` — lit by the real sun/moonlight and scaled by
 * the shared day/night darkness value, so rocks dim and shade exactly
 * like the terrain around them.
 *
 * The old twin generated its own placement on the main thread from
 * `heightData` (divergent from the WASM spawn positions — multiplayer
 * peers on different renderers saw different rocks) and rendered each
 * boulder as its own mesh with a CLONED ShaderMaterial that used a
 * hardcoded light direction: rocks ignored the actual sun and the day
 * cycle entirely and glowed at night. Don't bring that back.
 *
 * Look difference vs WebGPU (accepted, perf-minded): the TSL twin
 * computes a 3-octave noise gray per fragment; this twin uses a flat
 * warm gray — the noise-displaced geometry + real lighting carry the
 * rocky read on the lighter path.
 */
import React, { useEffect, useRef } from 'react';
import {
  Group, Mesh, BufferGeometry, BufferAttribute, FrontSide,
  MeshStandardMaterial,
} from 'three';
import { getDarknessValueUniform } from './terrainDarkness';
import useProceduralSkyStore from '../../../stores/proceduralSkyStore';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';
import type { BakedMesh } from '../../../terrain/TerrainWorkerClient';
import { buildBoulderDecoration } from '../../../workers/decorations/boulderBuilder';

const isMobile = typeof navigator !== 'undefined'
  && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/* ── Shared stock material ────────────────────────────────────────── */

let _sharedBoulderMaterial: MeshStandardMaterial | null = null;

// Mid value of the WebGPU twin's noise gray (baseGray 0.42 × the
// 1.05/0.98/0.92 warm tint). Darkness scales it via the one store
// subscription below — same pattern as ProceduralTreesWebGL.
const BOULDER_BASE_COLOR = { r: 0.36, g: 0.34, b: 0.32 };

let _boulderDarknessSubscribed = false;
function ensureBoulderDarkness() {
  if (_boulderDarknessSubscribed) return;
  _boulderDarknessSubscribed = true;
  const apply = () => {
    const d = getDarknessValueUniform().value;
    _sharedBoulderMaterial?.color.setRGB(
      BOULDER_BASE_COLOR.r * d,
      BOULDER_BASE_COLOR.g * d,
      BOULDER_BASE_COLOR.b * d,
    );
  };
  apply();
  useProceduralSkyStore.subscribe(apply);
}

function getSharedBoulderMaterial(): MeshStandardMaterial {
  if (!_sharedBoulderMaterial) {
    _sharedBoulderMaterial = new MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.05,
      side: FrontSide,
    });
    ensureBoulderDarkness();
  }
  return _sharedBoulderMaterial;
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
  /** Legacy props — parents still pass them; the worker path ignores them. */
  positionX: number;
  positionY: number;
  positionZ: number;
  seed: string;
  gridX: number;
  gridZ: number;
  heightData: Float32Array;
  heightScale: number;
  biomeDensity?: number;
  precomputedSpawns?: Float32Array;
}

export function ProceduralBouldersWebGL({
  seed,
  gridX,
  gridZ,
  precomputedSpawns,
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
      groupRef.current.add(mesh);
      mounted.push(mesh);
    };

    const rngSalt = `${seed}-boulders-${gridX}-${gridZ}`;
    const fallback = () => {
      const local = buildBoulderDecoration({
        spawns: new Float32Array(precomputedSpawns),
        isMobile,
        rngSeedSalt: rngSalt,
      });
      mountGroups(local);
    };

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
          fallback();
        }
      })
      .catch((err) => {
        console.warn('[ProceduralBouldersWebGL] worker build failed, trying main-thread fallback', err);
        try {
          fallback();
        } catch (e) {
          console.error('[ProceduralBouldersWebGL] main-thread fallback also failed', e);
        }
      });

    return () => {
      aborted.value = true;
      abort.abort();
      for (const m of mounted) {
        m.parent?.remove(m);
        m.geometry?.dispose();
      }
    };
  }, [precomputedSpawns, seed, gridX, gridZ]);

  return <group ref={groupRef as any} />;
}
