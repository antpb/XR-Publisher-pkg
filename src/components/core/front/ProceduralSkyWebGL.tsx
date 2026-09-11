import React, { useMemo, useRef, useEffect } from 'react';
import { 
  Group, DirectionalLight, SphereGeometry, Mesh, Color, Vector3,
  MeshBasicMaterial, PlaneGeometry, BackSide, DoubleSide, ShaderMaterial, WebGLRenderer
} from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import useProceduralSkyStore, {
  getTimePhase,
  PHASE_COLORS,
  type TimePhase
} from '../../../stores/proceduralSkyStore';
import { getDarknessValueUniform } from './terrainDarkness';
import {
  MAX_CLOUD_REGIONS,
  cloudXZRUniform, cloudParamAUniform, cloudParamBUniform, cloudColorArrUniform,
  cloudRegionCountUniform, cloudBaseDensityUniform, cloudBaseCoverageUniform,
  cloudBaseScaleUniform, cloudBaseColorUniform, cloudSeedOffsetUniform,
  setCloudDefaults, setCloudSeed, setCloudRegionPlayer,
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
  const { camera, gl } = useThree();
  const xrCamPosRef = useRef(new Vector3());
  
  const animationStartTime = useRef(Date.now());
  const currentTimeRef = useRef(timeOfDay);
  const lastStoreTimeSyncRef = useRef(timeOfDay);
  const lastPhaseRef = useRef<TimePhase>(getTimePhase(timeOfDay));
  const initialPhase = getTimePhase(timeOfDay);
  const initialColors = PHASE_COLORS[initialPhase];
  
  const topColorRef = useRef(initialColors.sky.clone());
  const midColorRef = useRef(initialColors.mid.clone());
  const bottomColorRef = useRef(initialColors.horizon.clone());
  
  const colorTransitionRef = useRef({
    isTransitioning: false,
    progress: 0,
    duration: 2.0,
    startColors: {
      top: initialColors.sky.clone(),
      mid: initialColors.mid.clone(),
      bottom: initialColors.horizon.clone()
    },
    targetColors: {
      top: initialColors.sky.clone(),
      mid: initialColors.mid.clone(),
      bottom: initialColors.horizon.clone()
    }
  });
  
  const setCurrentTime = useProceduralSkyStore((state) => state.setCurrentTime);
  const setSkyColors = useProceduralSkyStore((state) => state.setSkyColors);
  
  useEffect(() => {
    const phase = getTimePhase(timeOfDay);
    const colors = PHASE_COLORS[phase];
    currentTimeRef.current = timeOfDay;
    lastPhaseRef.current = phase;
    setCurrentTime(timeOfDay);
    animationStartTime.current = Date.now();
    
    topColorRef.current.copy(colors.sky);
    midColorRef.current.copy(colors.mid);
    bottomColorRef.current.copy(colors.horizon);
    
    colorTransitionRef.current.startColors.top.copy(colors.sky);
    colorTransitionRef.current.startColors.mid.copy(colors.mid);
    colorTransitionRef.current.startColors.bottom.copy(colors.horizon);
    colorTransitionRef.current.targetColors.top.copy(colors.sky);
    colorTransitionRef.current.targetColors.mid.copy(colors.mid);
    colorTransitionRef.current.targetColors.bottom.copy(colors.horizon);
  }, [timeOfDay, setCurrentTime]);

  const skyMaterialRef = useRef<ShaderMaterial | null>(null);
  
  const sky = useMemo(() => {
    const geometry = new SphereGeometry(2000, 64, 64);
    
    const skyMaterial = new ShaderMaterial({
      vertexShader: `
        varying vec3 vLocalPosition;
        
        void main() {
          vLocalPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        varying vec3 vLocalPosition;
        
        void main() {
          vec3 direction = normalize(vLocalPosition);
          float h = direction.y;
          
          vec3 color;
          if (h < -0.1) {
            color = bottomColor;
          } else if (h < 0.3) {
            float t = smoothstep(-0.1, 0.3, h);
            color = mix(bottomColor, midColor, t);
          } else {
            float t = smoothstep(0.3, 1.0, h);
            color = mix(midColor, topColor, t);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      uniforms: {
        topColor: { value: topColorRef.current.clone() },
        midColor: { value: midColorRef.current.clone() },
        bottomColor: { value: bottomColorRef.current.clone() }
      },
      side: BackSide,
      depthWrite: false,
      depthTest: false
    });

    skyMaterialRef.current = skyMaterial;
    const mesh = new Mesh(geometry, skyMaterial);
    mesh.renderOrder = -1000;
    mesh.frustumCulled = false;
    return mesh;
  }, [seed]);
  
  useEffect(() => {
    if (skyMaterialRef.current) {
      skyMaterialRef.current.uniforms.topColor.value.copy(topColorRef.current);
      skyMaterialRef.current.uniforms.midColor.value.copy(midColorRef.current);
      skyMaterialRef.current.uniforms.bottomColor.value.copy(bottomColorRef.current);
      skyMaterialRef.current.needsUpdate = true;
    }
  }, []);

  const sun = useMemo(() => {
    const sunGroup = new Group();
    const sunGeometry = new SphereGeometry(30, 16, 16);
    const sunMaterial = new MeshBasicMaterial({
      color: new Color(sunColor),
      fog: false
    });
    const sunMesh = new Mesh(sunGeometry, sunMaterial);
    sunMesh.frustumCulled = false;
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
      light.shadow.autoUpdate = true;
      light.shadow.needsUpdate = true;
    }
    
    return light;
  }, [castShadow, shadowMapSize, shadowRadius, shadowBlurSamples]);

  const clouds = useMemo(() => {
    const group = new Group();
    const effectiveLayers = Math.max(cloudLayers, 4);
    // World units → noise space (matches the WebGPU twin's BASE_FREQ).
    const BASE_FREQ = 0.00012;

    for (let i = 0; i < effectiveLayers; i++) {
      const geometry = new PlaneGeometry(7000, 7000, 1, 1);
      const layerScale = 0.7 * (1 + i * 0.15);
      const layerOffset = i * 0.25;

      const cloudMaterial = new ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          varying vec2 vWorldXZ;

          void main() {
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldXZ = wp.xz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          #define MAX_CLOUD_REGIONS ${MAX_CLOUD_REGIONS}
          uniform float uTime;
          uniform float uDarkness;
          uniform float uBaseDensity;
          uniform float uBaseCoverage;
          uniform float uBaseScale;
          uniform vec3 uBaseColor;
          uniform vec2 uSeedOffset;
          uniform float uLayerScale;
          uniform float uLayerOffset;
          uniform float uFreq;
          uniform int uRegionCount;
          uniform vec3 uCloudXZR[MAX_CLOUD_REGIONS];
          uniform vec3 uCloudParamA[MAX_CLOUD_REGIONS];
          uniform vec3 uCloudParamB[MAX_CLOUD_REGIONS];
          uniform vec3 uCloudColor[MAX_CLOUD_REGIONS];
          varying vec2 vUv;
          varying vec2 vWorldXZ;

          // Simplex noise
          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }

          void main() {
            // ── Region winner selection (world-space weather circles) ──
            float winMask = 0.0;
            float winDensity = 0.0;
            float winCoverage = 0.0;
            float winScale = 0.0;
            vec3 winColor = vec3(0.0);
            for (int r = 0; r < MAX_CLOUD_REGIONS; r++) {
              if (r >= uRegionCount) break;
              vec3 xzr = uCloudXZR[r];
              vec3 pa = uCloudParamA[r];   // density, coverage, scale
              vec3 pb = uCloudParamB[r];   // rain, falloff, speed
              float d = distance(vWorldXZ, xzr.xy);
              float dn = d / max(0.001, xzr.z);
              float m = smoothstep(1.0, pb.y, dn);
              if (m > winMask) {
                winMask = m;
                winDensity = pa.x;
                winCoverage = pa.y;
                winScale = pa.z;
                winColor = uCloudColor[r];
              }
            }
            float density = mix(uBaseDensity, winDensity, winMask);
            float coverage = mix(uBaseCoverage, winCoverage, winMask);
            float scaleR = max(0.01, mix(uBaseScale, winScale, winMask));
            vec3 colorR = mix(uBaseColor, winColor, winMask);

            // ── World-anchored + seeded noise ──
            // Offset in WORLD units BEFORE the frequency scale (see WebGPU twin):
            // adding it in noise space pushed coords to ±10k → precision flicker.
            vec2 scaledPos = (vWorldXZ + uSeedOffset) * (scaleR * uLayerScale * uFreq);
            vec2 offsetUV = scaledPos + vec2(uTime * 0.01 + uLayerOffset, uTime * 0.003);

            float noise1 = snoise(offsetUV);
            float noise2 = snoise(offsetUV * 2.0 + vec2(uTime * 0.005, 0.0));
            float noise3 = snoise(offsetUV * 4.0 + vec2(0.0, uTime * 0.002));

            float cloudValue = noise1 + noise2 * 0.5 + noise3 * 0.25;
            cloudValue = cloudValue * 0.5 + 0.5;

            // coverage 0..1 → lower threshold (more overcast).
            float lowT = mix(0.55, 0.05, coverage);
            float highT = lowT + 0.45;
            float puffyClouds = smoothstep(lowT, highT, cloudValue);
            float detail = snoise(offsetUV * 6.0) * 0.25;
            float detailedClouds = smoothstep(0.15, 0.6, puffyClouds + detail);
            float definedClouds = pow(detailedClouds, 1.2);
            float cloudAlpha = definedClouds * density;

            float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x) *
                             smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);

            float finalAlpha = cloudAlpha * edgeFade;
            // Day/night tint in lockstep with the rest of the world.
            gl_FragColor = vec4(colorR * uDarkness, finalAlpha);
          }
        `,
        uniforms: {
          uTime: { value: 0 },
          uDarkness: getDarknessValueUniform(),
          uBaseDensity: cloudBaseDensityUniform,
          uBaseCoverage: cloudBaseCoverageUniform,
          uBaseScale: cloudBaseScaleUniform,
          uBaseColor: cloudBaseColorUniform,
          uSeedOffset: cloudSeedOffsetUniform,
          uLayerScale: { value: layerScale },
          uLayerOffset: { value: layerOffset },
          uFreq: { value: BASE_FREQ },
          uRegionCount: cloudRegionCountUniform,
          uCloudXZR: cloudXZRUniform,
          uCloudParamA: cloudParamAUniform,
          uCloudParamB: cloudParamBUniform,
          uCloudColor: cloudColorArrUniform,
        },
        transparent: true,
        side: DoubleSide,
        depthWrite: false
      });

      const cloudMesh = new Mesh(geometry, cloudMaterial);
      cloudMesh.rotation.x = -Math.PI / 2;
      cloudMesh.position.y = cloudHeight + i * 70;
      cloudMesh.renderOrder = 100 + i;
      cloudMesh.frustumCulled = false;
      group.add(cloudMesh);
    }

    return group;
  }, [cloudHeight, cloudLayers]);

  // Push the terrain block's cloud attributes into the shared base defaults +
  // seed the world-anchored noise (mirrors the WebGPU twin).
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

  // Linear time jump (setTimeOfDay(h, false) / networked time sync): re-anchor
  // the running clock so the new hour sticks while the cycle keeps advancing
  // (mirrors the WebGPU ProceduralSky listener).
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

  useFrame((state, delta) => {
    const elapsedTime = state.clock.elapsedTime;
    const now = Date.now();

    // A forced time-of-day (setTimeOfDay → store.timeOverride) wins over the
    // day cycle — the WebGPU twin has honored this since the night-show API
    // landed; without it, WebGL clients in a synced room kept a daytime sun
    // under a "night" clock.
    const override = useProceduralSkyStore.getState().timeOverride;
    if (override != null) {
      currentTimeRef.current = ((override % 24) + 24) % 24;
    } else if (timeCycleDuration > 0) {
      const elapsed = (now - animationStartTime.current) / 1000;
      const cycleProgress = (elapsed % timeCycleDuration) / timeCycleDuration;
      currentTimeRef.current = cycleProgress * 24;
    }
    
    const time = currentTimeRef.current;
    const currentPhase = getTimePhase(time);

    // Keep the store clock in sync at coarse granularity so darkness
    // uniforms / WebGL twins track time between phase flips (matches the
    // WebGPU ProceduralSky).
    if (Math.abs(time - lastStoreTimeSyncRef.current) >= 0.1) {
      lastStoreTimeSyncRef.current = time;
      setCurrentTime(time);
    }

    if (currentPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = currentPhase;
      
      const newColors = PHASE_COLORS[currentPhase];
      
      colorTransitionRef.current.startColors.top.copy(topColorRef.current);
      colorTransitionRef.current.startColors.mid.copy(midColorRef.current);
      colorTransitionRef.current.startColors.bottom.copy(bottomColorRef.current);
      
      colorTransitionRef.current.targetColors.top.copy(newColors.sky);
      colorTransitionRef.current.targetColors.mid.copy(newColors.mid);
      colorTransitionRef.current.targetColors.bottom.copy(newColors.horizon);
      
      colorTransitionRef.current.isTransitioning = true;
      colorTransitionRef.current.progress = 0;
      
      setCurrentTime(time);
    }
    
    if (colorTransitionRef.current.isTransitioning) {
      colorTransitionRef.current.progress += delta / colorTransitionRef.current.duration;
      
      if (colorTransitionRef.current.progress >= 1) {
        colorTransitionRef.current.isTransitioning = false;
        colorTransitionRef.current.progress = 1;
      }
      
      const t = Math.min(colorTransitionRef.current.progress, 1);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      topColorRef.current.lerpColors(
        colorTransitionRef.current.startColors.top,
        colorTransitionRef.current.targetColors.top,
        easeT
      );
      midColorRef.current.lerpColors(
        colorTransitionRef.current.startColors.mid,
        colorTransitionRef.current.targetColors.mid,
        easeT
      );
      bottomColorRef.current.lerpColors(
        colorTransitionRef.current.startColors.bottom,
        colorTransitionRef.current.targetColors.bottom,
        easeT
      );
      
      setSkyColors({
        sky: topColorRef.current.clone(),
        horizon: bottomColorRef.current.clone(),
        mid: midColorRef.current.clone()
      });
    }
    
    if (skyMaterialRef.current && skyMaterialRef.current.uniforms) {
      skyMaterialRef.current.uniforms.topColor.value.copy(topColorRef.current);
      skyMaterialRef.current.uniforms.midColor.value.copy(midColorRef.current);
      skyMaterialRef.current.uniforms.bottomColor.value.copy(bottomColorRef.current);
    }
    
    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((child) => {
        if (child instanceof Mesh && child.material && (child.material as ShaderMaterial).uniforms) {
          const uniforms = (child.material as ShaderMaterial).uniforms;
          uniforms.uTime.value = elapsedTime * cloudSpeed;
        }
      });
    }

    // Keep the nearest-N weather regions packed around the player.
    setCloudRegionPlayer(camera.position.x, camera.position.z);
    
    const currentTime = currentTimeRef.current;
    const hour = currentTime % 24;
    const sunDistance = 800;

    // Same day window as the WebGPU sky: sun up 6.5 → 20.5 so darkness
    // arrives with the dusk→night phase colors.
    const sunIsUp = hour >= 6.5 && hour < 20.5;
    const dayAngle = ((hour - 6.5) / 14) * Math.PI;
    const sunX = sunIsUp ? Math.cos(dayAngle) * sunDistance : sunDistance * 0.7;
    const sunY = sunIsUp ? Math.sin(dayAngle) * sunDistance : -300;
    const sunZ = 0;

    if (sunRef.current) {
      sunRef.current.position.set(sunX, sunY, sunZ);
      sunRef.current.visible = sunIsUp;
    }

    if (sunLightRef.current) {
      sunLightRef.current.position.set(sunX, Math.max(sunY, 50), sunZ);
      // Point the light toward the player (important for shadow camera in XR)
      let lookTarget = camera.position;
      if ((gl as WebGLRenderer).xr?.isPresenting) {
        const xrCam = (gl as WebGLRenderer).xr.getCamera();
        if (xrCam) {
          xrCam.getWorldPosition(xrCamPosRef.current);
          lookTarget = xrCamPosRef.current;
        }
      }
      sunLightRef.current.target.position.copy(lookTarget);
      sunLightRef.current.target.updateMatrixWorld();

      let lightIntensity = 0.3;
      if (sunIsUp) {
        const s = Math.sin(dayAngle);
        // Peak ~1.3 at noon, sin³ falloff toward the horizon — matches
        // the WebGPU sky curve (originally a flat 2.5 all day).
        lightIntensity = 0.3 + 1.0 * s * s * s;
        const lowness = Math.max(0, 1 - s / 0.45);
        sunLightRef.current.color.setRGB(1.0, 1.0 - 0.22 * lowness, 1.0 - 0.45 * lowness);
      }
      sunLightRef.current.intensity = lightIntensity;
    }
    
    // Follow the camera EVERY frame so the player can never exit the dome.
    // The old `SKY_POSITION_UPDATE_INTERVAL` was 120 *seconds*, leaving the
    // sky (and the sun/clouds parented under it) effectively frozen near the
    // origin — fly away and you'd pop out of the sphere and see the sun/clouds
    // positioned relative to origin instead of you (looking dark/misplaced).
    // Follow X/Z only (not Y) so the horizon + cloud layer keep their world
    // altitude. Matches the WebGPU ProceduralSky. cloudsRef rides skyGroup as
    // a child, so it must NOT also offset by camPos (that double-counted).
    const isXR = (gl as WebGLRenderer).xr?.isPresenting;
    let camPos = camera.position;
    if (isXR) {
      const xrCam = (gl as WebGLRenderer).xr.getCamera();
      if (xrCam) {
        xrCam.getWorldPosition(xrCamPosRef.current);
        camPos = xrCamPosRef.current;
      }
    }
    if (skyGroupRef.current) {
      skyGroupRef.current.position.x = camPos.x;
      skyGroupRef.current.position.z = camPos.z;
      skyGroupRef.current.rotation.set(0, 0, 0);
    }
    // Enclose the camera VERTICALLY: the dome mesh alone follows Y (the group
    // tracks X/Z so sun/light world offsets stay correct) so it always
    // surrounds the player. Without this, flying up lifts the camera off the
    // y=0-centred sphere and you see past its top pole — the "hole straight up"
    // that reads as cutting through beyond the render distance. Gradient is
    // already object-space (vLocalPosition), so it stays correct at altitude.
    if (sky) {
      sky.position.y = camPos.y;
    }
    if (cloudsRef.current) {
      // Ride the parent (skyGroup) — keep local offset at zero.
      cloudsRef.current.position.x = 0;
      cloudsRef.current.position.z = 0;
    }
  });

  return (
    <group ref={skyGroupRef} name="proceduralSky" position={[0, 0, 0]}>
      <primitive object={sky} />
      <group ref={sunRef}>
        <primitive object={sun} />
      </group>
      <primitive ref={sunLightRef} object={sunLight} />
      <group ref={cloudsRef}>
        <primitive object={clouds} />
      </group>
    </group>
  );
}
