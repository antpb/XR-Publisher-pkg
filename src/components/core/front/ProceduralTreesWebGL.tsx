/**
 * ProceduralTreesWebGL — WebGL twin of ProceduralTrees.
 *
 * Now a thin copy of the WebGPU component: the same worker-built
 * blob-tree geometry (treeBuilder.ts) with the BotW shading baked into
 * vertex colors, rendered with STOCK materials — no ShaderMaterial
 * needed, identical placement and look across render paths, and the
 * same primitive tree colliders (without these, WebGL users would see
 * remote players standing on invisible canopies).
 *
 * Differences from the WebGPU twin: no chunk render bundle (WebGPU-only
 * concept), no wind wobble (static canopy — acceptable for the lighter
 * path), stock `MeshLambertMaterial({ vertexColors })` canopy (cheapest
 * lit material — the WebGPU twin uses standard with roughness 1).
 *
 * The old twin generated its own tree placement on the main thread
 * (tree/Branch.ts walker) which silently diverged from the WASM spawn
 * positions the WebGPU path uses — multiplayer peers on different
 * renderers saw different forests. It now consumes the same
 * `precomputedSpawns` array.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Vector3, Group, Mesh, FrontSide, Sphere,
  BufferGeometry, BufferAttribute,
  MeshStandardMaterial, MeshLambertMaterial,
  TextureLoader, RepeatWrapping, SRGBColorSpace, type Texture,
} from 'three';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { getBiomeAt } from './biomeHelpers';
import { useTerrainChunkStore } from './terrainChunkStore';
import { getDarknessValueUniform } from './terrainDarkness';
import useProceduralSkyStore from '../../../stores/proceduralSkyStore';
import { terrainWorker } from '../../../terrain/TerrainWorkerClient';
import type { BakedMesh } from '../../../terrain/TerrainWorkerClient';
import { buildTreeDecoration, TREE_COLLIDER_STRIDE } from '../../../workers/decorations/treeBuilder';
import { setChunkTreeColliders, clearChunkTreeColliders } from './treeColliderStore';
import { filterSpawnsByPatches } from '../../../decorations/groundPatchUniforms';
import { useChunkProximityVisible } from './useChunkProximityVisible';
import leafTextureUrl from '../../../defaults/assets/seamlessleaves.jpg';

const DECO_SPAWN_STRIDE = 7;

/** Must match ProceduralTrees.tsx CANOPY_TEX_TILE (triplanar tile freq). */
const CANOPY_TEX_TILE = 0.4;

const isMobile = typeof navigator !== 'undefined'
  && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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

/* ── Shared stock materials ───────────────────────────────────────── */

let _trunkMaterial: MeshStandardMaterial | null = null;
let _canopyMaterial: MeshLambertMaterial | null = null;
let _leafTexture: Texture | null = null;

// Shared time uniform for the canopy wind sway. The canopy material is a
// module singleton mounted imperatively (no React ref / useFrame), so one
// lightweight module-level rAF ticks it for the whole app — three reads
// .value every render. The WebGPU twin uses the TSL `time` node instead.
const _canopyTime = { value: 0 };
let _canopyTimeStarted = false;
function ensureCanopyTime() {
  if (_canopyTimeStarted || typeof requestAnimationFrame === 'undefined') return;
  _canopyTimeStarted = true;
  const tick = () => {
    _canopyTime.value = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}


/**
 * Shared seamless leaf texture (the PNG with a real, feathered alpha
 * channel). Tiled across the solid blob shell — UVs are a top-down planar
 * projection scaled by the species' leafTextureScale (treeBuilder.emitBlob)
 * → RepeatWrapping. Trilinear mipmaps + max anisotropy keep it sharp at the
 * silhouette rim.
 */
function getLeafTexture(): Texture {
  if (_leafTexture) return _leafTexture;
  const tex = new TextureLoader().load(leafTextureUrl);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 16;
  _leafTexture = tex;
  return tex;
}

// Day/night darkness for the TRUNK (stock material): `material.color`
// multiplies vertex colors in three, so scaling it by the shared darkness
// value matches the WebGPU twin's `× createDarknessNode()`. The canopy
// drives darkness through a shader uniform instead (see getCanopyMaterial)
// because it alpha-BLENDS the leaf texture over vertex colors and the blend
// result — not just the base — must be darkened.
let _treeDarknessSubscribed = false;
function ensureTreeDarkness() {
  if (_treeDarknessSubscribed) return;
  _treeDarknessSubscribed = true;
  const apply = () => {
    const d = getDarknessValueUniform().value;
    _trunkMaterial?.color.setScalar(d);
  };
  apply();
  useProceduralSkyStore.subscribe(apply);
}

function getTrunkMaterial(): MeshStandardMaterial {
  if (!_trunkMaterial) {
    _trunkMaterial = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
      side: FrontSide,
    });
    ensureTreeDarkness();
  }
  return _trunkMaterial;
}

function getCanopyMaterial(): MeshLambertMaterial {
  if (!_canopyMaterial) {
    // Solid canopy SHELL twin of the WebGPU material. Cheapest lit material
    // (Lambert) with vertexColors (the gentle baked tint) + the leaf texture
    // as `map`. An onBeforeCompile patch replaces the default map sample with
    // OBJECT-SPACE TRIPLANAR (three planar projections blended by the object
    // normal) so texel density stays even on the vertical sides instead of
    // smearing — then × uDarkness for day/night. Object-space coords come
    // from varyings set in the vertex shader; the static baked mesh means it
    // can't swim. Opaque, FrontSide: a solid surface is never a flat plane
    // edge-on, so the texture never compresses into scanlines.
    const mat = new MeshLambertMaterial({
      vertexColors: true,
      map: getLeafTexture(),
      side: FrontSide,
      transparent: false,
    });
    mat.onBeforeCompile = (shader) => {
      // Shared auto-updating darkness {value} (terrainDarkness.ts) — three
      // reads .value every render; one store subscription drives it.
      shader.uniforms.uDarkness = getDarknessValueUniform();
      shader.uniforms.uTile = { value: CANOPY_TEX_TILE };
      shader.uniforms.uTime = _canopyTime;
      // Pass object-space position + normal to the fragment stage.
      shader.vertexShader = 'uniform float uTime;\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;\n'
        + shader.vertexShader;
      // vObjPos is the ORIGINAL position (triplanar reads it → no crawl);
      // the wind sway is added to `transformed` AFTER capturing it, so only
      // the final vertex position moves. Phase varies by X/Z so neighbouring
      // trees sway out of step.
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        [
          '#include <begin_vertex>',
          '  vObjPos = transformed;',
          '  float _wphase = transformed.x * 0.18 + transformed.z * 0.18 + uTime * 0.42;',
          '  transformed.x += sin(_wphase) * 0.07;',
          '  transformed.z += sin(_wphase + 1.7) * 0.05;',
        ].join('\n'),
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\n  vObjNormal = objectNormal;',
      );
      shader.fragmentShader = 'uniform float uDarkness;\nuniform float uTile;\n'
        + 'varying vec3 vObjPos;\nvarying vec3 vObjNormal;\n'
        + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        [
          '#ifdef USE_MAP',
          '  vec3 _bw = abs(normalize(vObjNormal));',
          '  _bw /= (_bw.x + _bw.y + _bw.z + 0.0001);',
          '  vec3 _p = vObjPos * uTile;',
          '  vec3 _tri = texture2D(map, _p.zy).rgb * _bw.x',
          '            + texture2D(map, _p.xz).rgb * _bw.y',
          '            + texture2D(map, _p.xy).rgb * _bw.z;',
          '  diffuseColor.rgb *= _tri;',
          '#endif',
          'diffuseColor.rgb *= uDarkness;',
        ].join('\n'),
      );
    };
    _canopyMaterial = mat;
    ensureTreeDarkness();
    ensureCanopyTime();
  }
  return _canopyMaterial;
}

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
  // Manual conservative bounding sphere — same contract as the WebGPU twin.
  geom.boundingSphere = new Sphere(new Vector3(0, 0, 0), boundsRadius);
  return geom;
}

export function ProceduralTreesWebGL({
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

  const [treeColliders, setTreeColliders] = useState<Float32Array | null>(null);
  const collidersActive = useTerrainChunkStore((s) => s.collidersActive);

  // Publish canopy blob spheres for PluginDecorations' tree-anchor hanging.
  useEffect(() => {
    if (treeColliders && treeColliders.length > 0) {
      setChunkTreeColliders(chunkX, chunkZ, treeColliders);
    }
    return () => clearChunkTreeColliders(chunkX, chunkZ);
  }, [treeColliders, chunkX, chunkZ]);

  // Per-frame proximity gate (see useChunkProximityVisible) — a useMemo here
  // only re-evaluated on re-render, freezing visibility between chunk streams.
  // Desktop wide / mobile ORIGINAL-tight (matches the WebGPU twin — the wide
  // mobile gate ran phones hot; see ProceduralTrees.tsx for the rationale).
  const shouldRender = useChunkProximityVisible(
    playerPosition, chunkX, chunkZ, width, height,
    isMobile ? 1.2 : 3.6, isMobile ? 1.6 : 4.2, !isMobile,
  );

  const biomeId = useMemo(() => {
    const cx = chunkX * width + width / 2;
    const cz = chunkZ * height + height / 2;
    return getBiomeAt(cx, cz, seed)?.id;
  }, [chunkX, chunkZ, width, height, seed]);

  useEffect(() => {
    if (!shouldRender) return;
    if (!precomputedSpawns || precomputedSpawns.length === 0) return;

    const aborted = { value: false };
    // Cancel the queued build on scroll-away (see ProceduralTrees).
    const abort = new AbortController();
    const mounted: Mesh[] = [];
    const boundsRadius = Math.hypot(width, height) + 80;

    // Drop trees on a dirt apron / clearing (ground patch). Road trees are
    // already removed in the worker (it filters spawns against the road network).
    const spawns = filterSpawnsByPatches(
      precomputedSpawns, DECO_SPAWN_STRIDE, chunkX, chunkZ, width, height,
    );
    if (!spawns || spawns.length === 0) return;

    const mountGroups = (groups: Record<string, BakedMesh> | null | undefined) => {
      if (aborted.value) return;
      if (!groups || !groupRef.current) return;

      const trunkGeom = bakedToGeometry(groups.trunks, boundsRadius);
      if (trunkGeom) {
        const trunkMesh = new Mesh(trunkGeom, getTrunkMaterial());
        trunkMesh.castShadow = true;
        trunkMesh.receiveShadow = true;
        trunkMesh.userData = { camExcludeCollision: true };
        trunkMesh.frustumCulled = false;
        trunkMesh.matrixAutoUpdate = false;
        (trunkMesh as any).raycast = (): null => null;
        groupRef.current.add(trunkMesh);
        mounted.push(trunkMesh);
      }

      const canopyGeom = bakedToGeometry(groups.foliage, boundsRadius);
      if (canopyGeom) {
        const canopyMesh = new Mesh(canopyGeom, getCanopyMaterial());
        canopyMesh.castShadow = !isMobile; // opaque solid shell
        canopyMesh.receiveShadow = !isMobile;
        canopyMesh.userData = { camExcludeCollision: true };
        canopyMesh.frustumCulled = false;
        canopyMesh.matrixAutoUpdate = false;
        (canopyMesh as any).raycast = (): null => null;
        groupRef.current.add(canopyMesh);
        mounted.push(canopyMesh);
      }
    };

    const applyResult = (
      groups: Record<string, BakedMesh>,
      colliders: Float32Array | undefined,
    ) => {
      mountGroups(groups);
      if (!aborted.value && colliders && colliders.length > 0) {
        setTreeColliders(colliders);
      }
    };

    const fallback = () => {
      const local = buildTreeDecoration({
        spawns: new Float32Array(spawns),
        chunkOriginX: 0,
        chunkOriginZ: 0,
        isMobile,
        rngSeedSalt: `${seed}-${chunkX}-${chunkZ}`,
        biomeId,
      });
      applyResult(local.groups, local.treeColliders);
    };

    terrainWorker
      .buildDecorationGeometry(
        'trees',
        spawns,
        0,
        0,
        isMobile,
        `${seed}-${chunkX}-${chunkZ}`,
        biomeId,
        { signal: abort.signal, centerX: chunkX * width, centerZ: chunkZ * height },
      )
      .then((result) => {
        if (result) {
          applyResult(result.groups, result.treeColliders);
        } else {
          fallback();
        }
      })
      .catch((err) => {
        console.warn('[ProceduralTreesWebGL] worker build failed, trying main-thread fallback', err);
        try {
          fallback();
        } catch (e) {
          console.error('[ProceduralTreesWebGL] main-thread fallback also failed', e);
        }
      });

    return () => {
      aborted.value = true;
      abort.abort();
      for (const m of mounted) {
        m.parent?.remove(m);
        m.geometry?.dispose();
      }
      setTreeColliders(null);
    };
  }, [shouldRender, precomputedSpawns, chunkX, chunkZ, width, height, positionY, biomeId, seed]);

  void treeDensity;

  if (!shouldRender) return null;
  if (!precomputedSpawns || precomputedSpawns.length === 0) return null;

  // Solid trunks only (capsule per trunk, same gating as terrain
  // colliders). Canopies are intentionally NOT solid — matches the
  // WebGPU twin: only the trunk is climbable.
  //
  // Proximity gate (mirrors ProceduralTrees): mount trunk colliders ONLY
  // for the player's cell + neighbours (3×3), so physics cost is constant
  // regardless of how dense distant forests are.
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
