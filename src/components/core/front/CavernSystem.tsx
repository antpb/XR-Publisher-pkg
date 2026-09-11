import React, { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { RigidBody } from '@react-three/rapier';
import { DoubleSide, MeshStandardMaterial, Color, PointLight, Vector3 } from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, float } from 'three/tsl';
import { type CavernNetwork, createCavernGeometries } from './worldHelpers';
import { useTerrainChunkStore } from './terrainChunkStore';

interface CavernSystemProps {
  cavern: CavernNetwork;
  seed: string;
  useWebGL?: boolean;
}

const _webglCavernMaterial = new MeshStandardMaterial({
  vertexColors: true,
  side: DoubleSide,
  roughness: 1,
  metalness: 0,
});

const _webglWaterPoolMaterial = new MeshStandardMaterial({
  color: new Color('#1a3a4a'),
  transparent: true,
  opacity: 0.6,
  roughness: 0.2,
  metalness: 0.1,
});

// TSL materials are module singletons, NOT declarative
// <meshStandardNodeMaterial> JSX — declarative creates a NEW material per
// cavern mount, forcing a fresh TSL build + synchronous WebGPU pipeline
// compile on the main thread every time a mountain streams in (traced as
// multi-hundred-ms NodeBuilder + (program) stalls near mountains). Same
// lesson as getMountainMaterial in MountainMesh.tsx.
let _cavernMaterial: MeshStandardNodeMaterial | null = null;
export function getCavernMaterial(): MeshStandardNodeMaterial {
  if (!_cavernMaterial) {
    _cavernMaterial = new MeshStandardNodeMaterial();
    _cavernMaterial.vertexColors = true;
    _cavernMaterial.side = DoubleSide;
    _cavernMaterial.roughnessNode = float(1);
    _cavernMaterial.metalnessNode = float(0);
  }
  return _cavernMaterial;
}

let _waterPoolMaterial: MeshStandardNodeMaterial | null = null;
export function getWaterPoolMaterial(): MeshStandardNodeMaterial {
  if (!_waterPoolMaterial) {
    _waterPoolMaterial = new MeshStandardNodeMaterial();
    _waterPoolMaterial.colorNode = color('#1a3a4a');
    _waterPoolMaterial.transparent = true;
    _waterPoolMaterial.opacity = 0.6;
    _waterPoolMaterial.roughnessNode = float(0.2);
    _waterPoolMaterial.metalnessNode = float(0.1);
  }
  return _waterPoolMaterial;
}

// ---------------------------------------------------------------------------
// Cavern light pool.
//
// Caverns used to mount up to 7 <pointLight>s each as mountains streamed
// in/out. The scene's LIGHT COUNT is part of every material's pipeline
// cache key in three (WebGPU and WebGL alike), so each mount/unmount
// invalidated the compiled pipelines of EVERY material in the world and
// triggered a mass synchronous recompile — the >1s freezes while flying
// near mountains. The pool keeps a CONSTANT number of point lights mounted
// from world load (idle ones at intensity 0, which contributes nothing but
// keeps the light state stable); caverns register their desired lights and
// the pool assigns them imperatively. Pipeline keys never change.
// ---------------------------------------------------------------------------
export const CAVERN_LIGHT_POOL_SIZE = 6;

interface CavernLightSpec {
  position: [number, number, number];
  intensity: number;
  distance: number;
}

const _lightRegistry = new Map<string, CavernLightSpec[]>();
let _lightVersion = 0;
const _lightListeners = new Set<() => void>();

function registerCavernLights(id: string, lights: CavernLightSpec[]): void {
  _lightRegistry.set(id, lights);
  _lightVersion++;
  _lightListeners.forEach((l) => l());
}

function unregisterCavernLights(id: string): void {
  if (_lightRegistry.delete(id)) {
    _lightVersion++;
    _lightListeners.forEach((l) => l());
  }
}

const subscribeCavernLights = (cb: () => void): (() => void) => {
  _lightListeners.add(cb);
  return () => _lightListeners.delete(cb);
};
const getCavernLightVersion = (): number => _lightVersion;

/**
 * Mounted ONCE (InfiniteTerrain) and never unmounted. Renders the fixed
 * pool; assignment happens imperatively so React never adds/removes lights.
 */
export function CavernLightPool(): React.ReactElement {
  const lightsRef = useRef<(PointLight | null)[]>([]);
  const version = useSyncExternalStore(subscribeCavernLights, getCavernLightVersion);

  useEffect(() => {
    const specs: CavernLightSpec[] = [];
    for (const arr of _lightRegistry.values()) {
      for (const s of arr) {
        specs.push(s);
        if (specs.length >= CAVERN_LIGHT_POOL_SIZE) break;
      }
      if (specs.length >= CAVERN_LIGHT_POOL_SIZE) break;
    }
    lightsRef.current.forEach((light, i) => {
      if (!light) return;
      const s = specs[i];
      if (s) {
        light.position.set(s.position[0], s.position[1], s.position[2]);
        light.intensity = s.intensity;
        light.distance = s.distance;
      } else {
        // Keep the light MOUNTED (stable pipeline key) but contributing
        // nothing. Don't toggle `visible` — that changes the light state.
        light.intensity = 0;
        light.distance = 0.001;
      }
    });
  }, [version]);

  return (
    <>
      {Array.from({ length: CAVERN_LIGHT_POOL_SIZE }, (_, i) => (
        <pointLight
          key={`cavern-pool-${i}`}
          ref={(l: PointLight | null) => { lightsRef.current[i] = l; }}
          intensity={0}
          distance={0.001}
          decay={2}
          color="#ccaa77"
        />
      ))}
    </>
  );
}

export function CavernSystem({ cavern, useWebGL = false }: CavernSystemProps) {
  const { tunnelFloorGeometries } =
    useMemo(() => createCavernGeometries(cavern), [cavern.id]);

  // Same altitude/flying gate as terrain + tree colliders — trimesh cooking
  // is synchronous on the main thread, and flying past a mountain is
  // exactly when these used to cook uselessly.
  const collidersActive = useTerrainChunkStore((s) => s.collidersActive);

  const lights = useMemo(() => {
    const result: CavernLightSpec[] = [];
    for (const node of cavern.nodes.values()) {
      if (node.type === 'entrance') {
        const sp = node.surfacePosition || node.position;
        result.push({ position: [sp.x, sp.y + 1, sp.z], intensity: 4, distance: node.radius * 6 });
      }
      if (node.type === 'room' && result.length < 6) {
        result.push({
          position: [node.position.x, node.position.y + node.radius * 0.3, node.position.z],
          intensity: 2 + node.radius * 0.2,
          distance: node.radius * 3,
        });
      }
    }
    return result;
  }, [cavern.id]);

  // The pool lights live at scene root, while these positions are relative
  // to the cavern group (InfiniteTerrain wraps CavernSystem in a group at
  // [worldX, positionY-3, worldZ]) — resolve to world space at registration.
  const groupRef = useRef<any>(null);
  useEffect(() => {
    let worldLights = lights;
    if (groupRef.current) {
      groupRef.current.updateWorldMatrix(true, false);
      worldLights = lights.map((l) => {
        const v = groupRef.current.localToWorld(new Vector3(l.position[0], l.position[1], l.position[2]));
        return { ...l, position: [v.x, v.y, v.z] as [number, number, number] };
      });
    }
    registerCavernLights(cavern.id, worldLights);
    return () => unregisterCavernLights(cavern.id);
  }, [cavern.id, lights]);

  const waterPools = useMemo(() => {
    const pools: { position: [number, number, number]; radius: number }[] = [];
    for (const node of cavern.nodes.values()) {
      if (node.hasWater) {
        pools.push({
          position: [node.position.x, node.position.y - node.radius * 0.5, node.position.z],
          radius: node.radius * 0.6,
        });
      }
    }
    return pools;
  }, [cavern.id]);

  return (
    <group ref={groupRef}>
      {tunnelFloorGeometries.map((geo, i) => {
        const mesh = (
          <mesh geometry={geo} receiveShadow matrixAutoUpdate={false} userData={{ camExcludeCollision: true }} raycast={() => null} material={useWebGL ? _webglCavernMaterial : getCavernMaterial()} />
        );
        return collidersActive ? (
          <RigidBody key={`tf-${i}`} type="fixed" colliders="trimesh">
            {mesh}
          </RigidBody>
        ) : (
          <React.Fragment key={`tf-${i}`}>{mesh}</React.Fragment>
        );
      })}

      {waterPools.map((pool, i) => (
        <mesh key={`wp-${i}`} position={pool.position} rotation={[-Math.PI / 2, 0, 0]} matrixAutoUpdate={false} onUpdate={(self) => self.updateMatrix()} userData={{ camExcludeCollision: true }} raycast={() => null} material={useWebGL ? _webglWaterPoolMaterial : getWaterPoolMaterial()}>
          <circleGeometry args={[pool.radius, 16]} />
        </mesh>
      ))}
    </group>
  );
}
