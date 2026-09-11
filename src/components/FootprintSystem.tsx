import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CircleGeometry, InstancedMesh, InstancedBufferAttribute,
  Matrix4, Vector3, Quaternion, DoubleSide
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
  attribute, float, smoothstep, vec3, select,
  time, oscSine, hash, instanceIndex
} from 'three/tsl';
import { VRMHumanBoneName } from '@pixiv/three-vrm';
import { getBiomeAt, BiomeType } from './core/front/biomeHelpers';
import { useTerrainChunkStore } from './core/front/terrainChunkStore';
import {
  rawFootprintPositions, rawFootprintAgeType, footprintCount,
  MAX_TERRAIN_FOOTPRINTS
} from './core/front/footprintUniforms';

const MAX_FOOTPRINTS = 128;
const FOOTPRINT_LIFETIME = 15;
const FOOTPRINT_RADIUS = 0.12;
const FOOTPRINT_Y_OFFSET = 0.003;
const STAMP_INTERVAL = 0.35;

const _footPos = new Vector3();
const _matrix = new Matrix4();
const _quat = new Quaternion();
const _scaleVec = new Vector3();
const _posVec = new Vector3();
const Y_AXIS = new Vector3(0, 1, 0);

const FOOT_BONES = [
  VRMHumanBoneName.LeftFoot,
  VRMHumanBoneName.RightFoot,
];

function getFootprintType(biome: BiomeType, isWet: boolean): number {
  if (isWet) return 2;
  switch (biome.id) {
    case 'wetlands': return 2;
    case 'plains': return 1;
    case 'mountains': return 0;
    case 'buildable': return 0;
    default: return biome.grassDensity > 0.5 ? 1 : 0;
  }
}

interface FootprintSystemProps {
  playerControllerRef: React.MutableRefObject<any>;
  characterRef: React.MutableRefObject<any>;
  isMovingRef: React.MutableRefObject<boolean>;
  isFlyingRef: React.MutableRefObject<boolean>;
  isSwimmingRef: React.MutableRefObject<boolean>;
}

export function FootprintSystem({
  playerControllerRef,
  characterRef,
  isMovingRef,
  isFlyingRef,
  isSwimmingRef,
}: FootprintSystemProps) {
  const terrainSeed = useTerrainChunkStore((s) => s.terrainSeed);
  const isWet = useTerrainChunkStore((s) => s.isWet);

  const meshRef = useRef<InstancedMesh>(null);
  const nextSlot = useRef(0);
  const stampAccum = useRef(0);
  const footToggle = useRef(0);
  const renderedCount = useRef(0);

  const rawAges = useRef(new Float32Array(MAX_FOOTPRINTS).fill(FOOTPRINT_LIFETIME + 1));

  const geometry = useMemo(() => {
    const geo = new CircleGeometry(FOOTPRINT_RADIUS, 8);
    geo.rotateX(-Math.PI / 2);

    const ages = new Float32Array(MAX_FOOTPRINTS).fill(1.0);
    const types = new Float32Array(MAX_FOOTPRINTS).fill(0);
    geo.setAttribute('footprintAge', new InstancedBufferAttribute(ages, 1));
    geo.setAttribute('footprintType', new InstancedBufferAttribute(types, 1));

    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new MeshStandardNodeMaterial();
    const age = attribute('footprintAge', 'float');
    const fpType = attribute('footprintType', 'float');

    const isWetType = fpType.greaterThan(1.5);
    const isGrassType = fpType.greaterThan(0.5);

    // Per-instance variation via hash(instanceIndex) for natural look
    const instanceRand = hash(instanceIndex);
    const colorJitter = instanceRand.mul(0.06).sub(0.03);

    const dustCol = vec3(0.22, 0.18, 0.12).add(colorJitter);
    const grassCol = vec3(0.12, 0.22, 0.06).add(colorJitter);
    const wetCol = vec3(0.15, 0.22, 0.32).add(colorJitter);

    mat.colorNode = select(isWetType, wetCol, select(isGrassType, grassCol, dustCol));

    // Opacity: fades over lifetime, discards fully faded
    const fadeAlpha = smoothstep(float(1.0), float(0.0), age).mul(0.35);
    mat.opacityNode = fadeAlpha;
    mat.alphaTestNode = float(0.01);
    mat.transparent = true;
    mat.depthWrite = false;
    mat.side = DoubleSide;

    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -4;
    mat.polygonOffsetUnits = -4;

    // Wet footprints shimmer with time-based sine oscillation
    const wetShimmer = oscSine(time.mul(2.0)).mul(0.08).add(0.92);

    mat.roughnessNode = select(
      isWetType, float(0.15).mul(wetShimmer),
      select(isGrassType, float(0.75), float(0.95))
    );

    mat.metalnessNode = select(isWetType, float(0.1), float(0.0));

    return mat;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    const zeroMatrix = new Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAX_FOOTPRINTS; i++) {
      meshRef.current.setMatrixAt(i, zeroMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.count = 0;
  }, []);

  useFrame((_state, delta) => {
    if (!meshRef.current || !terrainSeed) return;

    const humanoid = playerControllerRef.current?.humanoid;
    const isFlying = isFlyingRef.current;
    const isSwimming = isSwimmingRef.current;
    const isMoving = isMovingRef.current;
    const isGrounded = characterRef.current?.userData?.canJump === true;

    const ageAttr = geometry.attributes.footprintAge as InstancedBufferAttribute;
    const typeAttr = geometry.attributes.footprintType as InstancedBufferAttribute;
    const ageArr = ageAttr.array as Float32Array;
    const ages = rawAges.current;

    // Age all footprints
    for (let i = 0; i < MAX_FOOTPRINTS; i++) {
      if (ages[i] <= FOOTPRINT_LIFETIME) {
        ages[i] += delta;
        ageArr[i] = Math.min(ages[i] / FOOTPRINT_LIFETIME, 1.0);
      }
    }

    // Age terrain-shared footprint uniforms
    for (let i = 0; i < MAX_TERRAIN_FOOTPRINTS; i++) {
      const at = rawFootprintAgeType[i];
      if (at.x < 1.0) {
        at.x = Math.min(at.x + delta / FOOTPRINT_LIFETIME, 1.0);
      }
    }

    const shouldStamp = isGrounded && isMoving && !isFlying && !isSwimming && humanoid;

    if (shouldStamp) {
      stampAccum.current += delta;

      if (stampAccum.current >= STAMP_INTERVAL) {
        stampAccum.current -= STAMP_INTERVAL;

        const boneIdx = footToggle.current;
        footToggle.current = (footToggle.current + 1) % FOOT_BONES.length;
        const bone = humanoid.getNormalizedBoneNode(FOOT_BONES[boneIdx]);

        if (bone) {
          bone.getWorldPosition(_footPos);

          const biome = getBiomeAt(_footPos.x, _footPos.z, terrainSeed);
          const fpType = getFootprintType(biome, isWet);

          // Update instanced mesh slot
          const slot = nextSlot.current;
          ages[slot] = 0;
          ageArr[slot] = 0;
          (typeAttr.array as Float32Array)[slot] = fpType;

          const yRot = Math.random() * Math.PI * 2;
          const scl = 0.8 + Math.random() * 0.4;
          _quat.setFromAxisAngle(Y_AXIS, yRot);
          _scaleVec.set(scl, scl, scl);
          _posVec.set(_footPos.x, _footPos.y + FOOTPRINT_Y_OFFSET, _footPos.z);
          _matrix.compose(_posVec, _quat, _scaleVec);

          meshRef.current.setMatrixAt(slot, _matrix);

          // Also update shared terrain uniforms (ring buffer of MAX_TERRAIN_FOOTPRINTS)
          const terrainSlot = nextSlot.current % MAX_TERRAIN_FOOTPRINTS;
          rawFootprintPositions[terrainSlot].set(_footPos.x, _footPos.z);
          rawFootprintAgeType[terrainSlot].set(0, fpType);
          footprintCount.value = Math.min(renderedCount.current + 1, MAX_TERRAIN_FOOTPRINTS);

          nextSlot.current = (nextSlot.current + 1) % MAX_FOOTPRINTS;
          renderedCount.current = Math.min(renderedCount.current + 1, MAX_FOOTPRINTS);
          meshRef.current.count = renderedCount.current;

          typeAttr.needsUpdate = true;
          meshRef.current.instanceMatrix.needsUpdate = true;
        }
      }
    } else {
      stampAccum.current = 0;
    }

    ageAttr.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material as any, MAX_FOOTPRINTS]}
      receiveShadow
      frustumCulled={false}
      raycast={() => null}
    />
  );
}
