import React, { useMemo, useRef, useEffect } from 'react';
import { 
  Group, DirectionalLight, SphereGeometry, Mesh, Color, 
  PlaneGeometry, BackSide, DoubleSide 
} from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  vec3, vec2, float, uv, uniform,
  mix, smoothstep, pow, positionWorld, positionLocal,
  Fn, vec4, mx_noise_float, Loop, distance, select
} from 'three/tsl';
import useProceduralSkyStore, {
  getTimePhase,
  PHASE_COLORS,
  type TimePhase
} from '../../../stores/proceduralSkyStore';
import { createDarknessNode } from './terrainDarkness';
import {
  cloudXZR, cloudParamA, cloudParamB, cloudColorArr, cloudRegionCount,
  cloudBaseDensity, cloudBaseCoverage, cloudBaseScale, cloudBaseColor,
  cloudSeedOffset, setCloudDefaults, setCloudSeed, setCloudRegionPlayer,
} from '../../../decorations/cloudRegionUniforms';

interface ProceduralSkyProps {
  seed?: string;
  sunPosition?: [number, number, number];
  sunColor?: string;
  sunSize?: number;
  skyColor?: string;
  horizonColor?: string;
  cloudColor?: string;
  cloudDensity?: number;
  cloudScale?: number;
  cloudSpeed?: number;
  cloudHeight?: number;
  cloudLayers?: number;
  timeOfDay?: number;
  timeCycleDuration?: number;
  noiseOctaves?: number;
  noisePersistence?: number;
  noiseLacunarity?: number;
  castShadow?: boolean;
  shadowMapSize?: number;
  shadowRadius?: number;
  shadowBlurSamples?: number;
}

const SKY_POSITION_UPDATE_INTERVAL = 120;

export function ProceduralSky({
  seed = Math.random().toString(),
  sunColor = '#ffff00',
  cloudColor = '#ffffff',
  cloudDensity = 0.5,
  cloudScale = 1,
  cloudSpeed = 0.1,
  cloudHeight = 100,
  cloudLayers = 3,
  timeOfDay = 12,
  timeCycleDuration = 0,
  castShadow = true,
  shadowMapSize = 1024,
  shadowRadius = 3,
  shadowBlurSamples = 4
}: ProceduralSkyProps) {
  const cloudsRef = useRef<Group | null>(null);
  const skyGroupRef = useRef<Group | null>(null);
  const sunRef = useRef<Group | null>(null);
  const sunLightRef = useRef<DirectionalLight | null>(null);
  const { camera } = useThree();
  
  const lastPositionUpdateTime = useRef(0);
  const sunUpdateCounterRef = useRef(0);
  // Shadow re-render gating: the shadow map is a pass over every caster.
  // Sun-time changes flag it immediately; camera motion flags it at ~20Hz;
  // otherwise a ~7Hz heartbeat keeps the animating avatar's shadow from
  // freezing (it's the shadow the player is always looking at).
  const lastShadowTimeRef = useRef(-999);
  const lastShadowCamRef = useRef({ x: Infinity, y: Infinity, z: Infinity });
  const lastShadowFlagMsRef = useRef(0);
  const cloudAccumRef = useRef(0);
  const animationStartTime = useRef(Date.now());
  const currentTimeRef = useRef(timeOfDay);
  const lastStoreTimeSyncRef = useRef(timeOfDay);
  const lastPhaseRef = useRef<TimePhase>(getTimePhase(timeOfDay));
  
  const topColorUniform = useRef(uniform(PHASE_COLORS[lastPhaseRef.current].sky.clone()));
  const midColorUniform = useRef(uniform(PHASE_COLORS[lastPhaseRef.current].mid.clone()));
  const bottomColorUniform = useRef(uniform(PHASE_COLORS[lastPhaseRef.current].horizon.clone()));
  
  const colorTransitionRef = useRef({
    isTransitioning: false,
    progress: 0,
    duration: 2.0,
    startColors: {
      top: PHASE_COLORS[lastPhaseRef.current].sky.clone(),
      mid: PHASE_COLORS[lastPhaseRef.current].mid.clone(),
      bottom: PHASE_COLORS[lastPhaseRef.current].horizon.clone()
    },
    targetColors: {
      top: PHASE_COLORS[lastPhaseRef.current].sky.clone(),
      mid: PHASE_COLORS[lastPhaseRef.current].mid.clone(),
      bottom: PHASE_COLORS[lastPhaseRef.current].horizon.clone()
    }
  });
  
  const setCurrentTime = useProceduralSkyStore((state) => state.setCurrentTime);
  const setSkyColors = useProceduralSkyStore((state) => state.setSkyColors);
  
  useEffect(() => {
    const initialPhase = getTimePhase(timeOfDay);
    const initialColors = PHASE_COLORS[initialPhase];
    topColorUniform.current.value.copy(initialColors.sky);
    midColorUniform.current.value.copy(initialColors.mid);
    bottomColorUniform.current.value.copy(initialColors.horizon);
    currentTimeRef.current = timeOfDay;
    lastPhaseRef.current = initialPhase;
    setCurrentTime(timeOfDay);
    animationStartTime.current = Date.now();
    
    colorTransitionRef.current.startColors.top.copy(initialColors.sky);
    colorTransitionRef.current.startColors.mid.copy(initialColors.mid);
    colorTransitionRef.current.startColors.bottom.copy(initialColors.horizon);
    colorTransitionRef.current.targetColors.top.copy(initialColors.sky);
    colorTransitionRef.current.targetColors.mid.copy(initialColors.mid);
    colorTransitionRef.current.targetColors.bottom.copy(initialColors.horizon);
  }, [timeOfDay, setCurrentTime]);

  const sky = useMemo(() => {
    const geometry = new SphereGeometry(2000, 32, 32);
    
    const skyShader = Fn(() => {
      // Gradient direction from the dome CENTER (object space), not world space.
      // The dome is re-centered on the camera every frame (position tracks the
      // player in X/Z AND Y), so the horizon must sit at the camera's own
      // horizontal plane at any altitude — positionWorld would tilt/skew the
      // gradient the moment you leave the world origin or fly upward.
      const direction = positionLocal.normalize();
      const h = direction.y;
          
      const horizonToMid = mix(bottomColorUniform.current, midColorUniform.current, smoothstep(float(0.0), float(1.0), h.div(float(0.3))));
      const midToTop = mix(midColorUniform.current, topColorUniform.current, smoothstep(float(0.0), float(1.0), h.sub(float(0.3)).div(float(0.7))));
      
      const skyColorResult = h.lessThan(float(0.0)).select(
        bottomColorUniform.current,
        h.lessThan(float(0.3)).select(horizonToMid, midToTop)
      );
      
      return vec4(skyColorResult, float(1.0));
    })();
    
    const material = new MeshBasicNodeMaterial();
    material.colorNode = skyShader;
    material.side = BackSide;
    material.depthWrite = false;
    material.fog = false;

    const mesh = new Mesh(geometry, material as any);
    mesh.renderOrder = -1;
    return mesh;
  }, [seed]);

  const sun = useMemo(() => {
    const sunGroup = new Group();
    const sunGeometry = new SphereGeometry(30, 16, 16);
    const sunMaterial = new MeshBasicNodeMaterial();
    sunMaterial.colorNode = vec3(
      float(new Color(sunColor).r),
      float(new Color(sunColor).g),
      float(new Color(sunColor).b)
    );
    sunMaterial.fog = false;
    const sunMesh = new Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sunMesh);
    return sunGroup;
  }, [sunColor]);

  const sunLight = useMemo(() => {
    const light = new DirectionalLight(0xffffff, 1.5);
    light.castShadow = castShadow;
    
    if (castShadow) {
      light.shadow.mapSize.width = shadowMapSize;
      light.shadow.mapSize.height = shadowMapSize;
      light.shadow.camera.near = 1;
      light.shadow.camera.far = 150;
      light.shadow.camera.left = -35;
      light.shadow.camera.right = 35;
      light.shadow.camera.top = 35;
      light.shadow.camera.bottom = -35;
      light.shadow.bias = -0.0005;
      light.shadow.normalBias = 0.02;
      light.shadow.radius = shadowRadius;
      light.shadow.blurSamples = shadowBlurSamples;
      // Shadow map renders only when we flag it (in the every-3rd-frame
      // block that moves the sun light): ~20Hz while the camera moves,
      // ~7Hz heartbeat otherwise so the animating avatar's shadow never
      // freezes, immediate on sun-time changes. Cheaper than autoUpdate
      // (render-rate passes) while staying smooth on the avatar.
      light.shadow.autoUpdate = false;
      light.shadow.needsUpdate = true;
    }
    
    return light;
  }, [castShadow, shadowMapSize, shadowRadius, shadowBlurSamples]);

  const clouds = useMemo(() => {
    const group = new Group();

    // Use more layers for fuller clouds
    const effectiveLayers = Math.max(cloudLayers, 4);
    // World units → noise space. Reproduces the original look (uv 0..1 over a
    // 7000u plane × cloudScale*0.7 ≈ 0.0001/unit) but anchored in WORLD space.
    const BASE_FREQ = 0.00012;

    for (let i = 0; i < effectiveLayers; i++) {
      // Larger planes for wider cloud coverage
      const geometry = new PlaneGeometry(7000, 7000, 1, 1);

      const timeUniform = uniform(0);
      // Per-layer constants (parallax + slightly different formation scale).
      const layerScale = float(0.7 * (1 + i * 0.15));
      const layerOffset = float(i * 0.25);

      const cloudShader = Fn(() => {
        const wxz = positionWorld.xz;

        // ── Region winner selection (world-space weather circles) ──
        // Strongest covering region wins; carry only scalars/vecs out of the
        // loop, then blend over the base by its influence (matches the terrain
        // region pattern).
        const winMask = float(0).toVar();
        const winDensity = float(0).toVar();
        const winCoverage = float(0).toVar();
        const winScale = float(0).toVar();
        const winColor = vec3(0).toVar();
        Loop(cloudRegionCount.toInt(), ({ i: ri }: { i: any }) => {
          const xzr = cloudXZR.element(ri);
          const pa = cloudParamA.element(ri);   // (density, coverage, scale)
          const pb = cloudParamB.element(ri);   // (rain, falloff, speed)
          const col = cloudColorArr.element(ri);
          const d = distance(wxz, vec2(xzr.x, xzr.y));
          const dn = d.div(xzr.z.max(float(0.001)));
          const m = smoothstep(float(1.0), pb.y, dn);   // 1 inside falloff → 0 past radius
          const win = m.greaterThan(winMask);
          winDensity.assign(select(win, pa.x, winDensity));
          winCoverage.assign(select(win, pa.y, winCoverage));
          winScale.assign(select(win, pa.z, winScale));
          winColor.assign(select(win, col, winColor));
          winMask.assign(winMask.max(m));
        });
        const density = mix(cloudBaseDensity, winDensity, winMask);
        const coverage = mix(cloudBaseCoverage, winCoverage, winMask);
        const scaleR = mix(cloudBaseScale, winScale, winMask).max(float(0.01));
        const colorR = mix(cloudBaseColor, winColor, winMask);

        // ── World-anchored + seeded noise sampling ──
        // Offset in WORLD units BEFORE the frequency scale — applying it after
        // (in noise space) pushed coords to ±10k where f32 precision quantizes
        // and the clouds flicker/block up when flying.
        const freq = scaleR.mul(layerScale).mul(float(BASE_FREQ));
        const scaledPos = wxz.add(cloudSeedOffset).mul(freq);
        const offsetUV = vec2(
          scaledPos.x.add(timeUniform.mul(float(0.01))).add(layerOffset),
          scaledPos.y.add(timeUniform.mul(float(0.003)))
        );

        const noise1 = mx_noise_float(vec3(offsetUV, float(0)));
        const noise2 = mx_noise_float(vec3(offsetUV.mul(float(2.0)).add(vec2(timeUniform.mul(float(0.005)), float(0))), float(0)));
        // Add a third octave for more billowy volume
        const noise3 = mx_noise_float(vec3(offsetUV.mul(float(4.0)).add(vec2(float(0), timeUniform.mul(float(0.002)))), float(0)));

        const cloudValue = noise1.add(noise2.mul(float(0.5))).add(noise3.mul(float(0.25)));
        // coverage 0..1 → lower threshold (more overcast). At coverage 0 the
        // deck thins (high threshold); at 1 the sky fills in.
        const lowT = mix(float(0.55), float(0.0), coverage);
        const highT = lowT.add(float(0.45));
        const puffyClouds = smoothstep(lowT, highT, cloudValue);
        const detail = mx_noise_float(vec3(offsetUV.mul(float(6.0)), float(0))).mul(float(0.25));
        const detailedClouds = smoothstep(float(0.15), float(0.6), puffyClouds.add(detail));
        // Softer power for more visible, fluffier clouds
        const definedClouds = pow(detailedClouds, float(1.2));
        const cloudAlpha = definedClouds.mul(density);

        const uvCoord = uv();
        const edgeFade = smoothstep(float(0.0), float(0.15), uvCoord.x)
          .mul(smoothstep(float(1.0), float(0.85), uvCoord.x))
          .mul(smoothstep(float(0.0), float(0.15), uvCoord.y))
          .mul(smoothstep(float(1.0), float(0.85), uvCoord.y));

        const finalAlpha = cloudAlpha.mul(edgeFade);
        // Day/night tint in lockstep with the rest of the world.
        const litColor = colorR.mul(createDarknessNode());

        return vec4(litColor, finalAlpha);
      })();

      const material = new MeshBasicNodeMaterial();
      material.colorNode = cloudShader;
      material.transparent = true;
      material.depthWrite = false;
      material.side = DoubleSide;
      material.fog = false;

      (material as any).timeUniform = timeUniform;

      const mesh = new Mesh(geometry, material as any);
      // Tighter vertical spacing for denser cloud band
      mesh.position.y = cloudHeight + i * 70;
      mesh.rotation.x = -Math.PI / 2;
      // Explicit, stable compositing order. Without this the transparent layers
      // re-sort by distance as the camera moves and the draw order flips
      // (the "blobs fighting" flicker).
      mesh.renderOrder = 100 + i;
      group.add(mesh);
    }

    return group;
  }, [cloudLayers, cloudHeight]);

  // Push the terrain block's cloud attributes into the shared base defaults +
  // seed the world-anchored noise. Region overrides (addCloudRegion) blend over
  // these; with no plugin/region the look is unchanged.
  useEffect(() => {
    const c = new Color(cloudColor);
    setCloudDefaults({
      density: cloudDensity * 1.1,
      scale: cloudScale,
      color: [c.r, c.g, c.b],
    });
  }, [cloudColor, cloudDensity, cloudScale]);

  useEffect(() => {
    setCloudSeed(seed);
  }, [seed]);

  useEffect(() => {
    cloudsRef.current = clouds;
    sunRef.current = sun;
    sunLightRef.current = sunLight;
  }, [clouds, sun, sunLight]);

  // The sky dome follows the camera, but throttled — on a teleport that lag is a
  // black sky (the player lands 15k units outside the dome before it catches up).
  // Snap the dome to the destination immediately when a teleport commits.
  useEffect(() => {
    const onCommit = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d || !skyGroupRef.current) return;
      skyGroupRef.current.position.x = d.x;
      skyGroupRef.current.position.z = d.z;
    };
    window.addEventListener('xrTerrainCommit', onCommit);
    return () => window.removeEventListener('xrTerrainCommit', onCommit);
  }, []);

  // Linear time jump (setTimeOfDay(h, false) / networked time sync): re-anchor
  // the running day-cycle clock so the new hour STICKS while the cycle keeps
  // advancing. Without this, animationStartTime overwrites the store's new
  // currentTime on the very next frame and an unpaused set silently no-ops.
  useEffect(() => {
    const onSetTime = (e: Event) => {
      const hour = (e as CustomEvent).detail?.hour;
      if (typeof hour !== 'number') return;
      currentTimeRef.current = hour;
      if (timeCycleDuration > 0) {
        animationStartTime.current = Date.now() - (hour / 24) * timeCycleDuration * 1000;
      }
    };
    window.addEventListener('xrpublisher:set-time', onSetTime);
    return () => window.removeEventListener('xrpublisher:set-time', onSetTime);
  }, [timeCycleDuration]);

  useFrame((_state, delta) => {
    const now = Date.now();
    const timeSinceLastPositionUpdate = (now - lastPositionUpdateTime.current) / 1000;

    // A forced time-of-day (setTimeOfDay → store.timeOverride) wins over the day
    // cycle, so the SUN/SKY/MOONLIGHT follow the forced hour — not just the
    // darkness term. Without this, forcing night darkened surfaces but left the
    // sun in its animated position → no moonlight → black scene (esp. mobile).
    const override = useProceduralSkyStore.getState().timeOverride;
    if (override != null) {
      currentTimeRef.current = ((override % 24) + 24) % 24;
    } else if (timeCycleDuration > 0) {
      const elapsed = (now - animationStartTime.current) / 1000;
      const cycleProgress = (elapsed % timeCycleDuration) / timeCycleDuration;
      currentTimeRef.current = cycleProgress * 24;
    }

    const time = currentTimeRef.current;
    // Sky colors follow the store phases directly (dawn → … → dusk →
    // night). The old code clamped everything after 15.5 to 'night' while
    // the PHASE_COLORS table runs evening/dusk until 21 — so the visible
    // sky, the fog color, and the darkness uniform all disagreed about
    // what time it was.
    const currentPhase = getTimePhase(time);

    // Keep the store's currentTime tracking the animated clock (coarse
    // 0.1h granularity — a uniform write for darkness subscribers, NOT a
    // per-frame Zustand churn). Previously it was only written on phase
    // flips, so terrain/grass/water darkness jumped hours at a time.
    if (Math.abs(time - lastStoreTimeSyncRef.current) >= 0.1) {
      lastStoreTimeSyncRef.current = time;
      setCurrentTime(time);
    }

    if (currentPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = currentPhase;
      
      const newColors = PHASE_COLORS[currentPhase];
      
      colorTransitionRef.current.startColors.top.copy(topColorUniform.current.value);
      colorTransitionRef.current.startColors.mid.copy(midColorUniform.current.value);
      colorTransitionRef.current.startColors.bottom.copy(bottomColorUniform.current.value);
      
      colorTransitionRef.current.targetColors.top.copy(newColors.sky);
      colorTransitionRef.current.targetColors.mid.copy(newColors.mid);
      colorTransitionRef.current.targetColors.bottom.copy(newColors.horizon);
      
      colorTransitionRef.current.isTransitioning = true;
      colorTransitionRef.current.progress = 0;
      
      setCurrentTime(time);
    }
    
    if (colorTransitionRef.current.isTransitioning) {
      colorTransitionRef.current.progress += delta / colorTransitionRef.current.duration;
      
      if (colorTransitionRef.current.progress >= 1.0) {
        colorTransitionRef.current.progress = 1.0;
        colorTransitionRef.current.isTransitioning = false;
      }
      
      const t = colorTransitionRef.current.progress;
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      topColorUniform.current.value.lerpColors(
        colorTransitionRef.current.startColors.top,
        colorTransitionRef.current.targetColors.top,
        easeT
      );
      midColorUniform.current.value.lerpColors(
        colorTransitionRef.current.startColors.mid,
        colorTransitionRef.current.targetColors.mid,
        easeT
      );
      bottomColorUniform.current.value.lerpColors(
        colorTransitionRef.current.startColors.bottom,
        colorTransitionRef.current.targetColors.bottom,
        easeT
      );
      
      // Only update Zustand store at the end of the transition (not every frame).
      // This prevents cascading re-renders to fog/terrain subscribers mid-transition.
      if (!colorTransitionRef.current.isTransitioning) {
        setSkyColors({
          sky: topColorUniform.current.value.clone(),
          horizon: bottomColorUniform.current.value.clone(),
          mid: midColorUniform.current.value.clone()
        });
      }
    }

    // Sun position + light updates — throttled to every 3rd frame.
    // Sun moves very slowly; per-frame precision is not needed.
    sunUpdateCounterRef.current = (sunUpdateCounterRef.current || 0) + 1;
    if (sunRef.current && sunUpdateCounterRef.current % 3 === 0) {
      const sunDistance = 1800;
      const time = currentTimeRef.current;

      // Only re-render the shadow map if the sun or camera actually moved
      // meaningfully since the last shadow pass (see lastShadow*Ref above).
      const cp = camera.position;
      const lc = lastShadowCamRef.current;
      const timeDirty = Math.abs(time - lastShadowTimeRef.current) > 0.01;
      const camDirty =
        Math.abs(cp.x - lc.x) > 0.15 ||
        Math.abs(cp.y - lc.y) > 0.15 ||
        Math.abs(cp.z - lc.z) > 0.15;
      // The avatar is always animating (idle sway included) and its shadow
      // is the most-watched one in the frame, so the map refreshes on a
      // steady ~7Hz heartbeat even when sun and camera are still — a frozen
      // shadow under a moving avatar reads as broken. Camera motion lifts
      // that to ~20Hz (checks run every 3rd frame, so >45ms fires every
      // check at 60fps) so the walk/run shadow doesn't visibly step.
      // Sun-time changes stay immediate. PCF processes casters only, so
      // this is far cheaper than the old VSM-era full-scene pass.
      const nowMs = performance.now();
      const sinceLastShadowMs = nowMs - lastShadowFlagMsRef.current;
      const shadowDirty = timeDirty ||
        (camDirty && sinceLastShadowMs > 45) ||
        sinceLastShadowMs > 140;
      const flagShadow = (light: DirectionalLight) => {
        if (!shadowDirty) return;
        light.shadow.needsUpdate = true;
        lastShadowTimeRef.current = time;
        lastShadowFlagMsRef.current = nowMs;
        lc.x = cp.x; lc.y = cp.y; lc.z = cp.z;
      };

      // Sun is up 6.5 → 20.5 — rises at the sunrise phase, sets mid-dusk,
      // so darkness falls WITH the dusk→night colors instead of five hours
      // before them (the old 15.5 cutoff).
      if (time < 6.5 || time >= 20.5) {
        sunRef.current.visible = false;
        sunRef.current.position.set(sunDistance * 0.7, 0, -1200);

        if (sunLightRef.current) {
          // Moonlight: a cool dim directional from a fixed high angle.
          // (The default static fill light is gone when terrain exists —
          // this is what keeps lit surfaces readable at night.)
          sunLightRef.current.position.set(
            camera.position.x - 25,
            camera.position.y + 45,
            camera.position.z - 20
          );
          sunLightRef.current.target.position.set(
            camera.position.x, camera.position.y, camera.position.z
          );
          sunLightRef.current.target.updateMatrixWorld();
          // Moonlight strong enough to clearly light the avatar (VRM/MToon renders
          // near-black at the old 0.4) — still cool, but a readable night.
          sunLightRef.current.intensity = 1.1;
          sunLightRef.current.color.setRGB(0.85, 0.89, 1.0);
          flagShadow(sunLightRef.current);
        }
      } else {
        sunRef.current.visible = true;
        const dayProgress = (time - 6.5) / 14.0;
        const angle = dayProgress * Math.PI;
        const arcRadius = sunDistance * 0.7;
        const sinAngle = Math.sin(angle);
        const cosAngle = Math.cos(angle);
        sunRef.current.position.set(cosAngle * arcRadius, sinAngle * arcRadius, -1200);

        if (sunLightRef.current) {
          const lightDistance = 60;
          sunLightRef.current.position.set(
            camera.position.x + cosAngle * lightDistance,
            camera.position.y + sinAngle * lightDistance,
            camera.position.z - 20
          );
          sunLightRef.current.target.position.set(
            camera.position.x,
            camera.position.y,
            camera.position.z
          );
          sunLightRef.current.target.updateMatrixWorld();

          // Peak ~1.3 at noon. (History: 2.0 originally, and a static
          // 1.5 default directional used to stack on top of this —
          // both cuts are part of fixing the washed-out daytime.)
          const intensityCurve = sinAngle;
          sunLightRef.current.intensity = 0.05 + 1.25 * intensityCurve * intensityCurve * intensityCurve;

          // Warm the light as the sun drops — white at noon, amber at the
          // horizon. Sells sunrise/sunset without touching any material.
          const lowness = Math.max(0, 1 - sinAngle / 0.45);
          sunLightRef.current.color.setRGB(1.0, 1.0 - 0.22 * lowness, 1.0 - 0.45 * lowness);

          // Re-render the shadow map only when sun/camera moved (gated above;
          // shadow.autoUpdate is false — see the light setup).
          flagShadow(sunLightRef.current);
        }
      }
    }

    if (timeSinceLastPositionUpdate >= SKY_POSITION_UPDATE_INTERVAL || lastPositionUpdateTime.current === 0) {
      lastPositionUpdateTime.current = now;

      if (skyGroupRef.current) {
        skyGroupRef.current.position.x = camera.position.x;
        skyGroupRef.current.position.z = camera.position.z;
      }
      // Enclose the camera VERTICALLY too. The group tracks X/Z (so sun/light
      // world offsets stay correct), but the dome mesh alone follows Y so it
      // always surrounds the player. Without this, flying up lifts the camera
      // off the y=0-centred sphere and you see past its top pole.
      if (sky) {
        sky.position.y = camera.position.y;
      }
    }

    // Keep the nearest-N weather regions packed around the player (no-op until
    // more than MAX_CLOUD_REGIONS exist; cheap distance check otherwise).
    setCloudRegionPlayer(camera.position.x, camera.position.z);

    // Cloud drift advances every rAF tick (~112Hz on ProMotion) even though the
    // visible result only updates per render (≤60, or 30 when idle). Accumulate
    // delta and apply at ~30Hz so the cloud JS runs ~3× less without changing
    // drift speed (delta is preserved). Skipped entirely when idle/hidden — the
    // sky isn't rendering then anyway.
    cloudAccumRef.current += delta;
    const idle = typeof window !== 'undefined' && (window as any).__xrIdle;
    if (!idle && cloudAccumRef.current >= 0.033 && cloudsRef.current && cloudsRef.current.children.length > 0) {
      const dt = cloudAccumRef.current;
      cloudAccumRef.current = 0;
      cloudsRef.current.children.forEach((cloud) => {
        const mesh = cloud as Mesh;
        if (mesh.material && (mesh.material as any).timeUniform) {
          (mesh.material as any).timeUniform.value += dt * cloudSpeed;
        }
      });
    }
  });

  return (
    <group ref={skyGroupRef as any} name="proceduralSky">
      {sky && <primitive object={sky} />}
      {sun && <primitive object={sun} />}
      {clouds && <primitive object={clouds} />}
      {sunLight && (
        <>
          <primitive object={sunLight} />
          <primitive object={sunLight.target} />
        </>
      )}
    </group>
  );
}
