/**
 * AmbientParticles (WebGPU/TSL) — biome-dependent ambient motes around the
 * player. Very subtle by design: a small always-mounted pool (one draw call)
 * whose particles respawn near the player and pick their look from the biome
 * at the spawn point (biomeHelpers.getBiomeAt — cached noise, ~2 samples):
 *
 *   dust   — buildable (dusty town land) + mountains: warm tan, low, drifting
 *   motes  — plains/default (grassy): pale floating seeds/pollen, slow sink
 *   midges — wetlands: tiny dark specks bobbing in loose clumps
 *
 * Biome transitions blend for free: types are assigned per-respawn, and
 * lifetimes are staggered, so crossing a border re-mixes the pool over
 * several seconds — softening the seams instead of drawing new ones.
 *
 * RENDERING: an InstancedMesh of tiny icospheres, NOT THREE.Points — WebGPU
 * caps point size at ~1px, so PointsNodeMaterial size does nothing (the
 * resonance-stage plugin hit the identical wall and uses instanced
 * icosahedra for its ember field). Per-instance life/type/seed ride
 * InstancedBufferAttributes read via TSL instancedBufferAttribute(), so the
 * feathered opacity fade stays per-particle in one draw. Normal depth test
 * (no depthTest:false — that renders BEHIND the terrain's render bundles),
 * normal blending (no additive night glow), color × createDarknessNode().
 *
 * Performance: 160 instances × 20 tris (60 on mobile), one transparent draw
 * outside the chunk render bundles; CPU update is O(POOL) with a couple of
 * sins — same cost class as FlyingParticles' 450-particle pool.
 *
 * WebGPU-only (mounted behind !useWebGLForXR in InfiniteTerrain), matching
 * the convention that the WebGL twins stay on the lighter path.
 */
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  InstancedMesh, IcosahedronGeometry, InstancedBufferAttribute, Object3D,
  DynamicDrawUsage,
} from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { instancedBufferAttribute, float, smoothstep, vec3, select } from 'three/tsl';
import { getBiomeAt } from './biomeHelpers';
import { createDarknessNode } from './terrainDarkness';
import { getNpcWaterLevel } from './npcObstacles';
import { isAmbienceSuppressed } from './ambienceControl';
import { sampleWeatherAt } from '../../../decorations/cloudRegionUniforms';

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const POOL_SIZE = isMobile ? 60 : 160;
/** Spawn annulus around the player (min keeps motes off the camera). */
const SPAWN_MIN_R = 3;
const SPAWN_MAX_R = 16;
/** Respawn when the player outruns a particle by this much. */
const MAX_DIST = 20;

// Particle types (iType attribute): 3 = parked/invisible.
const T_DUST = 0;
const T_MOTE = 1;
const T_MIDGE = 2;
const T_PARKED = 3;

// Per-type spawn density (miss ⇒ park) — dust is the "very very subtle" one.
const DENSITY = [0.45, 0.85, 0.7];

// Per-type world size range in meters (scale = min + seed × range).
const SIZE_MIN = [0.028, 0.016, 0.011];
const SIZE_RANGE = [0.024, 0.014, 0.008];

// Gentle constant world wind, scaled per type (dust hugs, motes ride).
const WIND_X = 0.22;
const WIND_Z = 0.1;
const WIND_MUL = [0.5, 1.0, 0.15];

const _dummy = new Object3D();

/** Rain fades ambience out: full pool below this, none above RAIN_FULL. */
const RAIN_START = 0.12;
const RAIN_FULL = 0.45;
/** Weather poll cadence (sampleWeatherAt is a ≤8-region JS loop, but there's
 *  no reason to run it 60×/s for a value that moves at walking speed). */
const WEATHER_POLL_S = 0.5;

function jsSmoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

interface AmbientParticlesProps {
  seed: string;
}

export function AmbientParticles({ seed }: AmbientParticlesProps) {
  const data = useRef({
    ages: new Float32Array(POOL_SIZE),
    maxAges: new Float32Array(POOL_SIZE).fill(0.001),
    px: new Float32Array(POOL_SIZE),
    py: new Float32Array(POOL_SIZE).fill(-9999),
    pz: new Float32Array(POOL_SIZE),
    vx: new Float32Array(POOL_SIZE),
    vy: new Float32Array(POOL_SIZE),
    vz: new Float32Array(POOL_SIZE),
    phase: new Float32Array(POOL_SIZE),
    sizes: new Float32Array(POOL_SIZE).fill(0.02),
    types: new Float32Array(POOL_SIZE).fill(T_PARKED),
  });

  // Per-instance attributes read by the material via instancedBufferAttribute.
  const instanceAttrs = useMemo(() => {
    const life = new InstancedBufferAttribute(new Float32Array(POOL_SIZE).fill(1), 1);
    const type = new InstancedBufferAttribute(new Float32Array(POOL_SIZE).fill(T_PARKED), 1);
    const seedA = new InstancedBufferAttribute(new Float32Array(POOL_SIZE), 1);
    life.setUsage(DynamicDrawUsage);
    type.setUsage(DynamicDrawUsage);
    for (let i = 0; i < POOL_SIZE; i++) {
      (seedA.array as Float32Array)[i] = Math.random();
      // Stagger initial park expiries so the pool doesn't wake in one frame.
      data.current.maxAges[i] = Math.random() * 4;
    }
    return { life, type, seedA };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mesh = useMemo(() => {
    // Tiny 3D blob — reads as a soft speck from any angle, no billboarding.
    const geo = new IcosahedronGeometry(1, 0);

    const mat = new MeshBasicNodeMaterial();
    const life = instancedBufferAttribute(instanceAttrs.life);
    const pType = instancedBufferAttribute(instanceAttrs.type);
    const pSeed = instancedBufferAttribute(instanceAttrs.seedA);

    const isParked = pType.greaterThan(2.5);
    const isMidge = pType.greaterThan(1.5);
    const isMote = pType.greaterThan(0.5);

    const dustCol = vec3(0.72, 0.66, 0.52);
    const moteCol = vec3(0.93, 0.92, 0.78);
    const midgeCol = vec3(0.22, 0.21, 0.18);
    mat.colorNode = select(isMidge, midgeCol, select(isMote, moteCol, dustCol))
      .mul(createDarknessNode());

    // Feathered in/out over the particle's life — nothing pops.
    const fade = smoothstep(float(0.0), float(0.18), life)
      .mul(float(1).sub(smoothstep(float(0.65), float(1.0), life)));
    const typeAlpha = select(isMidge, float(0.3), select(isMote, float(0.18), float(0.1)));
    mat.opacityNode = select(
      isParked,
      float(0),
      fade.mul(typeAlpha).mul(pSeed.mul(0.4).add(0.6)),
    );

    mat.transparent = true;
    mat.depthWrite = false;

    const m = new InstancedMesh(geo, mat, POOL_SIZE);
    m.frustumCulled = false;
    m.instanceMatrix.setUsage(DynamicDrawUsage);
    m.raycast = () => null;
    // Park every instance at zero scale until the pool wakes.
    _dummy.position.set(0, -9999, 0);
    _dummy.scale.setScalar(0.0001);
    _dummy.updateMatrix();
    for (let i = 0; i < POOL_SIZE; i++) m.setMatrixAt(i, _dummy.matrix);
    m.instanceMatrix.needsUpdate = true;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceAttrs]);

  useEffect(() => () => {
    mesh.geometry.dispose();
    (mesh.material as MeshBasicNodeMaterial).dispose();
  }, [mesh]);

  // Rain suppression scale (1 = fair weather, 0 = full rain), polled at
  // WEATHER_POLL_S. Persisted across frames so every frame reads the latest.
  const weatherRef = useRef({ accum: WEATHER_POLL_S, scale: 1 });

  useFrame((_state, delta) => {
    const d = data.current;
    const lifeArr = instanceAttrs.life.array as Float32Array;
    const typeArr = instanceAttrs.type.array as Float32Array;

    const st = (window as any).__xrPlayerState;

    // Weather + plugin gate: engine cloud-region rain thins the pool
    // automatically (dust/pollen in a downpour reads wrong); plugins doing
    // custom precipitation call XRPublisher.suppressAmbientParticles().
    const wr = weatherRef.current;
    wr.accum += delta;
    if (wr.accum >= WEATHER_POLL_S) {
      wr.accum = 0;
      if (isAmbienceSuppressed()) {
        wr.scale = 0;
      } else if (st) {
        const rain = sampleWeatherAt(st.x, st.z).rain;
        wr.scale = 1 - jsSmoothstep(RAIN_START, RAIN_FULL, rain);
      } else {
        wr.scale = 1;
      }
    }
    const weatherScale = wr.scale;
    const fullSuppress = weatherScale <= 0.02;

    // While flying/swimming/suppressed (or pre-player) the pool drains into
    // parked state instead of trailing the fast-moving avatar.
    const canSpawn = !!st && !st.isFlying && !st.isSwimming && !fullSuppress;
    const waterY = getNpcWaterLevel();
    let typesDirty = false;

    const park = (i: number) => {
      d.types[i] = T_PARKED;
      typeArr[i] = T_PARKED;
      d.ages[i] = 0;
      d.maxAges[i] = 0.8 + Math.random() * 1.6;
      d.py[i] = -9999;
      lifeArr[i] = 1;
      typesDirty = true;
      _dummy.position.set(0, -9999, 0);
      _dummy.scale.setScalar(0.0001);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    };

    const respawn = (i: number) => {
      if (!canSpawn) { park(i); return; }
      const ang = Math.random() * Math.PI * 2;
      const r = SPAWN_MIN_R + Math.pow(Math.random(), 0.7) * (SPAWN_MAX_R - SPAWN_MIN_R);
      const x = st.x + Math.cos(ang) * r;
      const z = st.z + Math.sin(ang) * r;

      const biome = getBiomeAt(x, z, seed);
      let type: number;
      if (biome.id === 'wetlands') type = T_MIDGE;
      else if (biome.id === 'plains' || biome.id === 'default') type = T_MOTE;
      else type = T_DUST;

      // Rain thins ambience progressively (weatherScale 1 → 0 into a storm).
      if (Math.random() > DENSITY[type] * weatherScale) { park(i); return; }

      let y: number;
      if (type === T_DUST) y = st.y + 0.2 + Math.random() * 1.8;
      else if (type === T_MOTE) y = st.y + 0.3 + Math.random() * 3.5;
      else y = st.y + 0.4 + Math.random() * 2.0;
      // Don't hang motes inside/over the water column.
      if (y < waterY + 0.4) { park(i); return; }

      d.px[i] = x;
      d.py[i] = y;
      d.pz[i] = z;
      d.ages[i] = 0;
      d.phase[i] = Math.random() * Math.PI * 2;
      d.sizes[i] = SIZE_MIN[type] + Math.random() * SIZE_RANGE[type];
      d.types[i] = type;
      typeArr[i] = type;
      typesDirty = true;
      lifeArr[i] = 0;

      if (type === T_DUST) {
        d.vx[i] = (Math.random() - 0.5) * 0.12;
        d.vy[i] = Math.random() * 0.05;
        d.vz[i] = (Math.random() - 0.5) * 0.12;
        d.maxAges[i] = 5 + Math.random() * 5;
      } else if (type === T_MOTE) {
        d.vx[i] = (Math.random() - 0.5) * 0.2;
        d.vy[i] = -0.06 - Math.random() * 0.08;
        d.vz[i] = (Math.random() - 0.5) * 0.2;
        d.maxAges[i] = 6 + Math.random() * 6;
      } else {
        d.vx[i] = (Math.random() - 0.5) * 0.35;
        d.vy[i] = 0;
        d.vz[i] = (Math.random() - 0.5) * 0.35;
        d.maxAges[i] = 3 + Math.random() * 3;
      }
    };

    for (let i = 0; i < POOL_SIZE; i++) {
      d.ages[i] += delta;
      const type = d.types[i];

      if (type === T_PARKED) {
        if (d.ages[i] > d.maxAges[i]) respawn(i);
        continue;
      }

      // Under full suppression, hurry live particles into their fade-out
      // window (life 0.65→1) — feathered exit, no pop, gone in ~1-3s.
      if (fullSuppress && d.ages[i] < 0.65 * d.maxAges[i]) {
        d.ages[i] = 0.65 * d.maxAges[i];
      }

      let expired = d.ages[i] > d.maxAges[i];
      if (!expired && st) {
        const dx = d.px[i] - st.x;
        const dz = d.pz[i] - st.z;
        expired = dx * dx + dz * dz > MAX_DIST * MAX_DIST;
      }
      if (expired) { respawn(i); continue; }

      const w = WIND_MUL[type];
      d.px[i] += (d.vx[i] + WIND_X * w) * delta;
      d.pz[i] += (d.vz[i] + WIND_Z * w) * delta;
      let bob = 0;
      if (type === T_MIDGE) bob = Math.sin(d.ages[i] * 6 + d.phase[i]) * 1.1;
      else if (type === T_MOTE) bob = Math.sin(d.ages[i] * 1.7 + d.phase[i]) * 0.15;
      d.py[i] += (d.vy[i] + bob) * delta;
      lifeArr[i] = Math.min(d.ages[i] / d.maxAges[i], 1);

      _dummy.position.set(d.px[i], d.py[i], d.pz[i]);
      _dummy.scale.setScalar(d.sizes[i]);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    instanceAttrs.life.needsUpdate = true;
    if (typesDirty) instanceAttrs.type.needsUpdate = true;
  });

  return <primitive object={mesh} />;
}
