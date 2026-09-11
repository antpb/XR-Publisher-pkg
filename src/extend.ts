import { extend } from '@react-three/fiber';
import { MeshBasicNodeMaterial, MeshLambertNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import {
  MeshBasicMaterial as MeshBasicFallback,
  MeshLambertMaterial as MeshLambertFallback,
  MeshStandardMaterial as MeshStandardFallback,
} from 'three';

// ─── Upstream warning filter ───────────────────────────────────────
//
// `@pixiv/three-vrm-materials-mtoon` (the VRM MToon material for WebGPU)
// still imports the deprecated `transformedNormalView` TSL node instead of
// `normalView`. Every time Three.js's WebGPU renderer compiles a shader
// variant for an MToon material — forward pass, shadow depth pass, any
// per-light-cascade variant — that deprecated Fn runs and fires:
//
//   "THREE.TSL: transformedNormalView is deprecated. Use normalView instead."
//
// The warning is purely cosmetic (it returns `normalView` internally).
// The variants themselves are still built correctly. But under WebGPU, new
// variants get built on demand whenever scene state changes around a VRM
// (e.g., a new terrain chunk enters the shadow cascade, or lights are
// culled differently), so in a multi-peer, streaming-terrain world the log
// fills up quickly and drowns out real errors.
//
// Filtering the exact message string lets real warnings through. Remove
// this block as soon as three-vrm ships a version that calls `normalView`
// directly (as of 3.5.2 it still uses `transformedNormalView`).
if (typeof console !== 'undefined' && typeof console.warn === 'function') {
  const SUPPRESS_SUBSTRING = 'transformedNormalView" is deprecated';
  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes(SUPPRESS_SUBSTRING)) {
      return;
    }
    originalWarn(...args);
  };
}

const _isWebGL =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('renderer') === 'webgl';

if (_isWebGL) {
  extend({
    MeshBasicNodeMaterial: MeshBasicFallback,
    MeshLambertNodeMaterial: MeshLambertFallback,
    MeshStandardNodeMaterial: MeshStandardFallback,
  });
} else {
  extend({
    MeshBasicNodeMaterial,
    MeshLambertNodeMaterial,
    MeshStandardNodeMaterial,
  });
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshBasicNodeMaterial: any;
    meshLambertNodeMaterial: any;
    meshStandardNodeMaterial: any;
  }
}
