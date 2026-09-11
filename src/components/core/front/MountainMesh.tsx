import React, { useMemo, useState, useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import { DoubleSide, BufferGeometry, BufferAttribute, Float32BufferAttribute } from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
  vertexColor, positionWorld, mx_noise_vec3, vec3, float, attribute, mix,
  smoothstep
} from 'three/tsl';
import { type MountainFeature, getDeletionSpheresDebug, isMountainClusterPrimary } from './worldHelpers';
import { createDarknessNode } from './terrainDarkness';
import { terrainWorker, type MountainArrays } from '../../../terrain/TerrainWorkerClient';

/**
 * Shared mountain materials, keyed by `hasInteriorDepth`. TSL node graphs
 * differ between "mountain has cavern interior" and "mountain doesn't", so
 * we cache one material per variant. Every mountain of the same variant
 * reuses the identical compiled shader — no recompile on new mountain mount,
 * which was the source of the frame drops when flying over new regions.
 */
const _mountainMaterialCache = new Map<boolean, MeshStandardNodeMaterial>();

export function getMountainMaterial(hasInteriorDepth: boolean): MeshStandardNodeMaterial {
  const cached = _mountainMaterialCache.get(hasInteriorDepth);
  if (cached) return cached;

  const baseColor = vertexColor();
  const worldPos = positionWorld;
  const interiorDepth = hasInteriorDepth ? attribute('interiorDepth', 'float') : float(0);

  const largeNoise = mx_noise_vec3(vec3(worldPos.x.mul(0.015), worldPos.z.mul(0.015), worldPos.y.mul(0.008))).x;
  const mediumNoise = mx_noise_vec3(vec3(worldPos.x.mul(0.06), worldPos.z.mul(0.06), worldPos.y.mul(0.03))).x;
  const fineNoise = mx_noise_vec3(vec3(worldPos.x.mul(0.2), worldPos.z.mul(0.2), worldPos.y.mul(0.15))).x;

  const exteriorVariation = largeNoise.mul(0.15).add(mediumNoise.mul(0.10)).add(fineNoise.mul(0.06)).add(0.92);
  const exteriorColor = baseColor.mul(exteriorVariation);

  const rockBase = float(0.38).add(largeNoise.mul(0.08)).add(mediumNoise.mul(0.06));
  const interiorR = rockBase.mul(1.06).add(fineNoise.mul(0.04));
  const interiorG = rockBase.mul(0.95).add(fineNoise.mul(0.03));
  const interiorB = rockBase.mul(0.82).add(fineNoise.mul(0.02));
  const interiorColor = vec3(interiorR, interiorG, interiorB);

  const depthDarken = mix(float(1.0), float(0.6), smoothstep(0.0, 0.8, interiorDepth));
  const darkenedInterior = interiorColor.mul(depthDarken);

  const blendFactor = smoothstep(0.0, 0.12, interiorDepth);
  const litColor = mix(exteriorColor, darkenedInterior, blendFactor);
  const colorNode = litColor.mul(createDarknessNode());

  let emissiveNode: any;
  if (hasInteriorDepth) {
    const emissiveNoise = mx_noise_vec3(vec3(worldPos.x.mul(0.08), worldPos.y.mul(0.08), worldPos.z.mul(0.08))).x.mul(0.5).add(0.5);
    const warmAmbient = vec3(0.12, 0.08, 0.05);
    const coolAmbient = vec3(0.05, 0.06, 0.09);
    const ambientLight = mix(coolAmbient, warmAmbient, emissiveNoise);
    const emissiveStrength = smoothstep(0.0, 0.3, interiorDepth).mul(0.35);
    emissiveNode = ambientLight.mul(emissiveStrength);
  } else {
    emissiveNode = vec3(0, 0, 0);
  }

  const roughnessNoise = mx_noise_vec3(vec3(worldPos.x.mul(0.15), worldPos.z.mul(0.15), worldPos.y.mul(0.15))).x;
  const roughnessNode = float(0.85).add(roughnessNoise.mul(0.1));

  const mat = new MeshStandardNodeMaterial();
  mat.colorNode = colorNode;
  mat.emissiveNode = emissiveNode;
  mat.roughnessNode = roughnessNode;
  mat.metalnessNode = float(0.03);
  mat.side = DoubleSide;

  _mountainMaterialCache.set(hasInteriorDepth, mat);
  return mat;
}

interface MountainMeshProps {
  mountain: MountainFeature;
  seed: string;
  allMountains: MountainFeature[];
}

/**
 * Build a BufferGeometry from the arrays returned by the worker.
 */
function buildMountainGeometry(arrays: MountainArrays): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(arrays.positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(arrays.colors, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(arrays.normals, 3));
  if (arrays.indices.length > 0) {
    geometry.setIndex(new BufferAttribute(arrays.indices, 1));
  }
  if (arrays.interiorDepths && arrays.interiorDepths.length > 0) {
    geometry.setAttribute('interiorDepth', new Float32BufferAttribute(arrays.interiorDepths, 1));
  }
  return geometry;
}

export function MountainMesh({ mountain, seed, allMountains }: MountainMeshProps) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);

  // Only the cluster primary renders the merged mesh (it unions every member);
  // overlapping mountains thus form ONE solid — no double-draw z-fighting and
  // no misaligned shells trapping the player. Non-primaries render nothing.
  const isPrimary = useMemo(
    () => isMountainClusterPrimary(mountain, allMountains),
    [mountain.id, allMountains]
  );

  useEffect(() => {
    if (!isPrimary) return;
    let cancelled = false;
    // Cancel the queued mountain build if it unmounts before the worker
    // reaches it (distance-ordered against terrain/decoration jobs).
    const abort = new AbortController();
    terrainWorker
      .generateMountain(mountain, seed, allMountains, {
        signal: abort.signal,
        centerX: mountain.worldX,
        centerZ: mountain.worldZ,
      })
      .then((arrays) => {
        if (cancelled) return;
        setGeometry(buildMountainGeometry(arrays));
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Mountain generation failed:', mountain.id, err);
        }
      });
    return () => { cancelled = true; abort.abort(); };
  }, [mountain.id, seed, isPrimary]);

  // Dispose the mountain's GPU buffers when it leaves view (unmount) or when
  // a regenerated geometry replaces the old one. Three.js does NOT free GPU
  // memory on GC — without this, every mountain you fly past leaks its
  // marching-cubes mesh, and frame health degrades the further you travel.
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
    };
  }, [geometry]);

  const debugSpheres = useMemo(
    () => getDeletionSpheresDebug(mountain, allMountains),
    [mountain.id]
  );

  const hasInteriorDepth = geometry?.attributes.interiorDepth !== undefined;

  // Shared material lookup replaces the three per-mountain useMemo blocks
  // that used to rebuild colorNode/emissiveNode/roughnessNode and then hand
  // them to a declarative <meshStandardNodeMaterial> — which forced TSL to
  // recompile the shader for every mountain. The full material is now
  // built once per `hasInteriorDepth` variant in getMountainMaterial above.
  const mountainMaterial = getMountainMaterial(hasInteriorDepth);

  if (!isPrimary || !geometry || !geometry.index || geometry.index.count < 3) {
    return null;
  }

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh
          geometry={geometry}
          castShadow
          receiveShadow
          matrixAutoUpdate={false}
          userData={{ camExcludeCollision: true }}
          raycast={() => null}
        >
          <primitive object={mountainMaterial} attach="material" dispose={null} />
        </mesh>
      </RigidBody>

      {debugSpheres.map((sphere, i) => (
        <mesh
          key={i}
          position={[sphere.x, sphere.y, sphere.z]}
          visible={false}
        >
          <sphereGeometry args={[Math.sqrt(sphere.rSq), 16, 16]} />
        </mesh>
      ))}
    </>
  );
}
