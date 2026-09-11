import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry, Float32BufferAttribute, Vector3,
  AdditiveBlending
} from 'three';
import { PointsNodeMaterial } from 'three/webgpu';
import { attribute, float, mix, smoothstep, vec3, select } from 'three/tsl';
import { VRMHumanBoneName } from '@pixiv/three-vrm';
import { getBiomeAt, BiomeType } from './core/front/biomeHelpers';
import { useTerrainChunkStore } from './core/front/terrainChunkStore';

const POOL_SIZE = 300;
const FOOT_POOL_SIZE = 150;

const _bonePos = new Vector3();

const SWIM_HAND_BONES = [
  VRMHumanBoneName.LeftHand,
  VRMHumanBoneName.RightHand,
];

const SWIM_FOOT_BONES = [
  VRMHumanBoneName.LeftFoot,
  VRMHumanBoneName.RightFoot,
];

const FLY_BONES = [
  VRMHumanBoneName.LeftUpperArm,
  VRMHumanBoneName.RightUpperArm,
  VRMHumanBoneName.LeftHand,
  VRMHumanBoneName.RightHand,
];

const FOOT_BONES = [
  VRMHumanBoneName.LeftFoot,
  VRMHumanBoneName.RightFoot,
];

function getFootParticleType(biome: BiomeType, isWet: boolean): number {
  if (isWet) return 2;
  switch (biome.id) {
    case 'wetlands': return 2;
    case 'plains': return 1;
    case 'mountains': return 0;
    case 'buildable': return 0;
    default: return biome.grassDensity > 0.5 ? 1 : 0;
  }
}

interface FlyingParticlesProps {
  playerControllerRef: React.MutableRefObject<any>;
  characterRef: React.MutableRefObject<any>;
  isFlyingRef: React.MutableRefObject<boolean>;
  isSwimmingRef: React.MutableRefObject<boolean>;
  isMovingRef: React.MutableRefObject<boolean>;
  isBoostingRef: React.MutableRefObject<boolean>;
}

export function FlyingParticles({
  playerControllerRef,
  characterRef,
  isFlyingRef,
  isSwimmingRef,
  isMovingRef,
  isBoostingRef,
}: FlyingParticlesProps) {
  const pointsRef = useRef<any>(null);
  const nextIdx = useRef(0);
  const spawnAccum = useRef(0);

  const terrainSeed = useTerrainChunkStore((s) => s.terrainSeed);
  const isWet = useTerrainChunkStore((s) => s.isWet);

  const particleData = useRef({
    ages: new Float32Array(POOL_SIZE).fill(99),
    maxAges: new Float32Array(POOL_SIZE).fill(1),
    vx: new Float32Array(POOL_SIZE),
    vy: new Float32Array(POOL_SIZE),
    vz: new Float32Array(POOL_SIZE),
  });

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(POOL_SIZE * 3);
    const life = new Float32Array(POOL_SIZE).fill(1);
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setAttribute('lifeFraction', new Float32BufferAttribute(life, 1));
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new PointsNodeMaterial();
    const life = attribute('lifeFraction', 'float');

    const alpha = smoothstep(float(1.0), float(0.0), life).mul(0.7);
    const col = mix(
      vec3(0.8, 0.92, 1.0),
      vec3(1.0, 1.0, 1.0),
      life
    );

    mat.colorNode = col;
    mat.opacityNode = alpha;
    mat.sizeNode = mix(float(18.0), float(3.0), life);
    mat.transparent = true;
    mat.depthWrite = false;
    mat.sizeAttenuation = true;
    (mat as any).blending = AdditiveBlending;
    mat.fog = false;

    return mat;
  }, []);

  const footPointsRef = useRef<any>(null);
  const footNextIdx = useRef(0);
  const footSpawnAccum = useRef(0);
  const footStepToggle = useRef(0);

  const footParticleData = useRef({
    ages: new Float32Array(FOOT_POOL_SIZE).fill(99),
    maxAges: new Float32Array(FOOT_POOL_SIZE).fill(1),
    vx: new Float32Array(FOOT_POOL_SIZE),
    vy: new Float32Array(FOOT_POOL_SIZE),
    vz: new Float32Array(FOOT_POOL_SIZE),
    types: new Float32Array(FOOT_POOL_SIZE),
  });

  const footGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(FOOT_POOL_SIZE * 3);
    const life = new Float32Array(FOOT_POOL_SIZE).fill(1);
    const pType = new Float32Array(FOOT_POOL_SIZE).fill(0);
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setAttribute('lifeFraction', new Float32BufferAttribute(life, 1));
    geo.setAttribute('particleType', new Float32BufferAttribute(pType, 1));
    return geo;
  }, []);

  const footMaterial = useMemo(() => {
    const mat = new PointsNodeMaterial();
    const life = attribute('lifeFraction', 'float');
    const pType = attribute('particleType', 'float');

    const isWetType = pType.greaterThan(1.5);
    const isGrassType = pType.greaterThan(0.5);

    const dustCol = mix(vec3(0.76, 0.70, 0.55), vec3(0.55, 0.48, 0.35), life);
    const grassCol = mix(vec3(0.25, 0.55, 0.12), vec3(0.45, 0.75, 0.25), life);
    const wetCol = mix(vec3(0.7, 0.85, 1.0), vec3(0.95, 0.97, 1.0), life);

    mat.colorNode = select(isWetType, wetCol, select(isGrassType, grassCol, dustCol));

    const baseAlpha = smoothstep(float(1.0), float(0.0), life);
    mat.opacityNode = select(
      isWetType, baseAlpha.mul(0.55),
      select(isGrassType, baseAlpha.mul(0.7), baseAlpha.mul(0.45))
    );

    mat.sizeNode = select(
      isWetType, mix(float(12), float(4), life),
      select(isGrassType, mix(float(4), float(1.5), life), mix(float(6), float(2), life))
    );

    mat.transparent = true;
    mat.depthWrite = false;
    mat.sizeAttenuation = true;
    mat.fog = false;

    return mat;
  }, []);

  useFrame((_state, delta) => {
    const isFlying = isFlyingRef.current;
    const isSwimming = isSwimmingRef.current;
    const isMoving = isMovingRef.current;
    const isBoosting = isBoostingRef.current;
    const humanoid = playerControllerRef.current?.humanoid;

    let bvx = 0, bvy = 0, bvz = 0;
    if (characterRef.current?.linvel) {
      try {
        const v = characterRef.current.linvel();
        bvx = v.x;
        bvy = v.y;
        bvz = v.z;
      } catch (_) {}
    }

    if (geometry) {
      const posArr = (geometry.attributes.position as Float32BufferAttribute).array as Float32Array;
      const lifeArr = (geometry.attributes.lifeFraction as Float32BufferAttribute).array as Float32Array;
      const spd = particleData.current;

      for (let i = 0; i < POOL_SIZE; i++) {
        if (spd.ages[i] < spd.maxAges[i]) {
          spd.ages[i] += delta;
          posArr[i * 3] += spd.vx[i] * delta;
          posArr[i * 3 + 1] += spd.vy[i] * delta;
          posArr[i * 3 + 2] += spd.vz[i] * delta;
          spd.vx[i] *= 0.99;
          spd.vy[i] *= 0.99;
          spd.vz[i] *= 0.99;
          lifeArr[i] = Math.min(spd.ages[i] / spd.maxAges[i], 1.0);
        } else {
          lifeArr[i] = 1.0;
        }
      }

      const active = isSwimming || (isFlying && isBoosting);

      if (active && humanoid) {
        spawnAccum.current += delta;
        const interval = isMoving ? 0.04 : 0.08;

        while (spawnAccum.current >= interval) {
          spawnAccum.current -= interval;

          let boneset: VRMHumanBoneName[];
          if (isSwimming) {
            const useFeet = isBoosting;
            boneset = useFeet
              ? [...SWIM_HAND_BONES, ...SWIM_FOOT_BONES]
              : SWIM_HAND_BONES;
          } else {
            boneset = FLY_BONES;
          }

          const boneIdx = Math.floor(Math.random() * boneset.length);
          const bone = humanoid.getNormalizedBoneNode(boneset[boneIdx]);
          if (!bone) continue;

          bone.getWorldPosition(_bonePos);

          const spread = isMoving ? 0.3 : 0.15;
          const idx = nextIdx.current;
          posArr[idx * 3] = _bonePos.x + (Math.random() - 0.5) * 0.2;
          posArr[idx * 3 + 1] = _bonePos.y + (Math.random() - 0.5) * 0.2;
          posArr[idx * 3 + 2] = _bonePos.z + (Math.random() - 0.5) * 0.2;
          spd.ages[idx] = 0;
          spd.maxAges[idx] = 0.3 + Math.random() * 0.4;

          if (isSwimming) {
            spd.vx[idx] = -bvx * 0.2 + (Math.random() - 0.5) * spread;
            spd.vy[idx] = 0.3 + Math.random() * 0.4;
            spd.vz[idx] = -bvz * 0.2 + (Math.random() - 0.5) * spread;
          } else {
            spd.vx[idx] = -bvx * 0.3 + (Math.random() - 0.5) * spread;
            spd.vy[idx] = -bvy * 0.3 + (Math.random() - 0.5) * spread + 0.1;
            spd.vz[idx] = -bvz * 0.3 + (Math.random() - 0.5) * spread;
          }

          lifeArr[idx] = 0;
          nextIdx.current = (nextIdx.current + 1) % POOL_SIZE;
        }
      } else {
        spawnAccum.current = 0;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.lifeFraction.needsUpdate = true;
    }

    if (footGeometry) {
      const posArr = (footGeometry.attributes.position as Float32BufferAttribute).array as Float32Array;
      const lifeArr = (footGeometry.attributes.lifeFraction as Float32BufferAttribute).array as Float32Array;
      const typeArr = (footGeometry.attributes.particleType as Float32BufferAttribute).array as Float32Array;
      const fpd = footParticleData.current;

      for (let i = 0; i < FOOT_POOL_SIZE; i++) {
        if (fpd.ages[i] < fpd.maxAges[i]) {
          fpd.ages[i] += delta;

          const pType = fpd.types[i];
          if (pType >= 1) {
            const gravity = pType >= 2 ? -4.0 : -3.0;
            fpd.vy[i] += gravity * delta;
          }

          posArr[i * 3] += fpd.vx[i] * delta;
          posArr[i * 3 + 1] += fpd.vy[i] * delta;
          posArr[i * 3 + 2] += fpd.vz[i] * delta;

          const damping = pType < 0.5 ? 0.95 : 0.98;
          fpd.vx[i] *= damping;
          fpd.vz[i] *= damping;

          lifeArr[i] = Math.min(fpd.ages[i] / fpd.maxAges[i], 1.0);
        } else {
          lifeArr[i] = 1.0;
        }
      }

      const isGrounded = characterRef.current?.userData?.canJump === true;
      const shouldSpawnFoot = isGrounded && isMoving && !isFlying && !isSwimming && humanoid && terrainSeed;

      if (shouldSpawnFoot) {
        footSpawnAccum.current += delta;
        const interval = 0.06;

        while (footSpawnAccum.current >= interval) {
          footSpawnAccum.current -= interval;

          const boneIdx = footStepToggle.current;
          footStepToggle.current = (footStepToggle.current + 1) % FOOT_BONES.length;
          const bone = humanoid.getNormalizedBoneNode(FOOT_BONES[boneIdx]);
          if (!bone) continue;

          bone.getWorldPosition(_bonePos);

          const biome = getBiomeAt(_bonePos.x, _bonePos.z, terrainSeed);
          const particleType = getFootParticleType(biome, isWet);

          const count = 2 + Math.floor(Math.random() * 2);
          for (let p = 0; p < count; p++) {
            const idx = footNextIdx.current;

            posArr[idx * 3] = _bonePos.x + (Math.random() - 0.5) * 0.15;
            posArr[idx * 3 + 1] = _bonePos.y;
            posArr[idx * 3 + 2] = _bonePos.z + (Math.random() - 0.5) * 0.15;

            fpd.ages[idx] = 0;
            fpd.types[idx] = particleType;
            typeArr[idx] = particleType;

            if (particleType === 0) {
              fpd.vx[idx] = (Math.random() - 0.5) * 0.3;
              fpd.vy[idx] = 0.15 + Math.random() * 0.3;
              fpd.vz[idx] = (Math.random() - 0.5) * 0.3;
              fpd.maxAges[idx] = 0.5 + Math.random() * 0.5;
            } else if (particleType === 1) {
              fpd.vx[idx] = (Math.random() - 0.5) * 0.4;
              fpd.vy[idx] = 0.8 + Math.random() * 0.8;
              fpd.vz[idx] = (Math.random() - 0.5) * 0.4;
              fpd.maxAges[idx] = 0.3 + Math.random() * 0.3;
            } else {
              fpd.vx[idx] = (Math.random() - 0.5) * 0.5;
              fpd.vy[idx] = 0.5 + Math.random() * 1.0;
              fpd.vz[idx] = (Math.random() - 0.5) * 0.5;
              fpd.maxAges[idx] = 0.25 + Math.random() * 0.35;
            }

            lifeArr[idx] = 0;
            footNextIdx.current = (footNextIdx.current + 1) % FOOT_POOL_SIZE;
          }
        }
      } else {
        footSpawnAccum.current = 0;
      }

      footGeometry.attributes.position.needsUpdate = true;
      footGeometry.attributes.lifeFraction.needsUpdate = true;
      footGeometry.attributes.particleType.needsUpdate = true;
    }
  });

  return (
    <>
      <points
        ref={pointsRef}
        geometry={geometry}
        material={material as any}
        frustumCulled={false}
        raycast={() => null}
      />
      <points
        ref={footPointsRef}
        geometry={footGeometry}
        material={footMaterial as any}
        frustumCulled={false}
        raycast={() => null}
      />
    </>
  );
}
