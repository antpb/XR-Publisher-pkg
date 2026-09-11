import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CircleGeometry, InstancedMesh, InstancedBufferAttribute,
  Matrix4, Vector3, Quaternion, DoubleSide, ShaderMaterial
} from 'three';
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

interface FootprintSystemWebGLProps {
  playerControllerRef: React.MutableRefObject<any>;
  characterRef: React.MutableRefObject<any>;
  isMovingRef: React.MutableRefObject<boolean>;
  isFlyingRef: React.MutableRefObject<boolean>;
  isSwimmingRef: React.MutableRefObject<boolean>;
}

export function FootprintSystemWebGL({
  playerControllerRef,
  characterRef,
  isMovingRef,
  isFlyingRef,
  isSwimmingRef,
}: FootprintSystemWebGLProps) {
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
    return new ShaderMaterial({
      vertexShader: `
        attribute float footprintAge;
        attribute float footprintType;
        varying float vAge;
        varying float vType;
        
        void main() {
          vAge = footprintAge;
          vType = footprintType;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAge;
        varying float vType;
        uniform float uTime;
        
        // Simple hash for per-instance variation
        float hash(float n) {
          return fract(sin(n) * 43758.5453123);
        }
        
        void main() {
          bool isWet = vType > 1.5;
          bool isGrass = vType > 0.5;
          
          float instanceId = float(gl_FragCoord.x + gl_FragCoord.y);
          float colorJitter = hash(instanceId) * 0.06 - 0.03;
          
          vec3 col;
          if (isWet) {
            col = vec3(0.15, 0.22, 0.32) + colorJitter;
          } else if (isGrass) {
            col = vec3(0.12, 0.22, 0.06) + colorJitter;
          } else {
            col = vec3(0.22, 0.18, 0.12) + colorJitter;
          }
          
          float fadeAlpha = smoothstep(1.0, 0.0, vAge) * 0.35;
          
          if (fadeAlpha < 0.01) discard;
          
          gl_FragColor = vec4(col, fadeAlpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
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
    
    // Update time uniform
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value += delta;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_FOOTPRINTS]}
      receiveShadow
      frustumCulled={false}
      raycast={() => null}
    />
  );
}
