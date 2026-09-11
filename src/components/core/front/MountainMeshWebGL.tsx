import React, { useMemo, useRef, useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import { DoubleSide, ShaderMaterial } from 'three';
import { type MountainFeature, createMountainGeometry, getDeletionSpheresDebug, isMountainClusterPrimary } from './worldHelpers';
import useProceduralSkyStore from '../../../stores/proceduralSkyStore';

interface MountainMeshProps {
  mountain: MountainFeature;
  seed: string;
  allMountains: MountainFeature[];
}

export function MountainMeshWebGL({ mountain, seed, allMountains }: MountainMeshProps) {
  // Only the cluster primary renders the merged mesh (see MountainMesh).
  const isPrimary = useMemo(
    () => isMountainClusterPrimary(mountain, allMountains),
    [mountain.id, allMountains]
  );

  const geometry = useMemo(
    () => (isPrimary ? createMountainGeometry(mountain, seed, allMountains) : null),
    [mountain.id, seed, isPrimary]
  );

  // Dispose the mountain's GPU buffers when it leaves view (unmount) or when a
  // regenerated geometry replaces the old one. Three.js doesn't free GPU
  // memory on GC — without this, every mountain you pass leaks its
  // marching-cubes mesh. Mirrors the WebGPU MountainMesh.
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
    };
  }, [geometry]);

  const debugSpheres = useMemo(
    () => getDeletionSpheresDebug(mountain, allMountains),
    [mountain.id]
  );

  const hasInteriorDepth = geometry ? geometry.attributes.interiorDepth !== undefined : false;
  
  const materialRef = useRef<ShaderMaterial | null>(null);
  const currentTime = useProceduralSkyStore((state) => state.currentTime);

  const material = useMemo(() => {
    const vertexShader = `
      attribute vec3 color;
      ${hasInteriorDepth ? 'attribute float interiorDepth;' : ''}
      
      varying vec3 vColor;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      ${hasInteriorDepth ? 'varying float vInteriorDepth;' : ''}
      
      void main() {
        vColor = color;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        ${hasInteriorDepth ? 'vInteriorDepth = interiorDepth;' : ''}
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform float uTimeOfDay;
      uniform float uDarkness;
      
      varying vec3 vColor;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      ${hasInteriorDepth ? 'varying float vInteriorDepth;' : ''}
      
      // Simplex noise for texture variation
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i); 
        vec4 p = permute( permute( permute( 
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                 
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }
      
      void main() {
        vec3 baseColor = vColor;
        
        // Calculate darkness based on time of day (matches the shared
        // createDarknessNode timeline: sun up 6.5-20.5, dusk ramp 18.5-20.5)
        float darkness;
        if (uTimeOfDay < 5.5) {
          darkness = 0.35;
        } else if (uTimeOfDay < 7.0) {
          float dawnProgress = (uTimeOfDay - 5.5) / 1.5;
          darkness = 0.35 + (1.0 - 0.35) * dawnProgress;
        } else if (uTimeOfDay < 18.5) {
          darkness = 1.0;
        } else if (uTimeOfDay < 20.5) {
          float duskProgress = (uTimeOfDay - 18.5) / 2.0;
          darkness = 1.0 - (1.0 - 0.35) * duskProgress;
        } else {
          darkness = 0.35;
        }
        
        // Multi-scale noise for exterior texture variation
        float largeNoise = snoise(vec3(
          vWorldPosition.x * 0.015,
          vWorldPosition.z * 0.015,
          vWorldPosition.y * 0.008
        )) * 0.15;
        
        float mediumNoise = snoise(vec3(
          vWorldPosition.x * 0.06,
          vWorldPosition.z * 0.06,
          vWorldPosition.y * 0.03
        )) * 0.10;
        
        float fineNoise = snoise(vec3(
          vWorldPosition.x * 0.2,
          vWorldPosition.z * 0.2,
          vWorldPosition.y * 0.15
        )) * 0.06;
        
        // Exterior color with noise variation
        float exteriorVariation = largeNoise + mediumNoise + fineNoise + 0.92;
        vec3 exteriorColor = baseColor * exteriorVariation;
        
        ${hasInteriorDepth ? `
          // Interior rocky cave color
          float rockBase = 0.38 + largeNoise * 0.08 + mediumNoise * 0.06;
          float interiorR = rockBase * 1.06 + fineNoise * 0.04;
          float interiorG = rockBase * 0.95 + fineNoise * 0.03;
          float interiorB = rockBase * 0.82 + fineNoise * 0.02;
          vec3 interiorColor = vec3(interiorR, interiorG, interiorB);
          
          // Darken based on depth
          float depthDarken = mix(1.0, 0.6, smoothstep(0.0, 0.8, vInteriorDepth));
          vec3 darkenedInterior = interiorColor * depthDarken;
          
          // Blend between exterior and interior based on depth
          float blendFactor = smoothstep(0.0, 0.12, vInteriorDepth);
          vec3 litColor = mix(exteriorColor, darkenedInterior, blendFactor);
        ` : `
          vec3 litColor = exteriorColor;
        `}
        
        // Apply darkness
        litColor *= darkness;
        
        // Add simple directional lighting
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        float diffuse = max(dot(vNormal, lightDir), 0.0);
        litColor = litColor * (0.5 + 0.5 * diffuse);
        
        gl_FragColor = vec4(litColor, 1.0);
      }
    `;
    
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        // Initial value only — the effect below keeps it current. Keeping
        // currentTime OUT of this memo's deps matters: it used to be a dep,
        // which recompiled the whole ShaderMaterial on every store tick.
        uTimeOfDay: { value: useProceduralSkyStore.getState().currentTime }
      },
      side: DoubleSide
    });

    materialRef.current = mat;
    return mat;
  }, [hasInteriorDepth]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTimeOfDay.value = currentTime;
    }
  }, [currentTime]);

  useMemo(() => {
    if (!hasInteriorDepth) return null;
    
    const vertexShader = `
      attribute float interiorDepth;
      varying float vInteriorDepth;
      varying vec3 vWorldPosition;
      
      void main() {
        vInteriorDepth = interiorDepth;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      varying float vInteriorDepth;
      varying vec3 vWorldPosition;
      
      // Simplex noise (same as above)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i); 
        vec4 p = permute( permute( permute( 
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }
      
      void main() {
        float emissiveNoise = snoise(vec3(
          vWorldPosition.x * 0.08,
          vWorldPosition.y * 0.08,
          vWorldPosition.z * 0.08
        )) * 0.5 + 0.5;
        
        vec3 warmAmbient = vec3(0.12, 0.08, 0.05);
        vec3 coolAmbient = vec3(0.05, 0.06, 0.09);
        vec3 ambientLight = mix(coolAmbient, warmAmbient, emissiveNoise);
        
        float emissiveStrength = smoothstep(0.0, 0.3, vInteriorDepth) * 0.35;
        
        gl_FragColor = vec4(ambientLight * emissiveStrength, 1.0);
      }
    `;
    
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {},
      transparent: true,
      blending: 2
    });
  }, [hasInteriorDepth]);

  if (!geometry || !geometry.index || geometry.index.count < 3) {
    return null;
  }

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
          userData={{ camExcludeCollision: true }}
          raycast={() => null}
        />
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
