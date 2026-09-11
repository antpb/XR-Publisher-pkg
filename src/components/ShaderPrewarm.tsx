import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * ShaderPrewarm — calls `renderer.compileAsync(scene, camera)` once, shortly
 * after the canvas has had time to populate. This pushes shader compilation
 * for every currently-mounted material out of the user's flight path.
 *
 * Context: Three.js WebGPU compiles node-material pipelines lazily on first
 * draw. For complex materials (notably VRM MToon from `@pixiv/three-vrm-
 * materials-mtoon`, which still funnels through the deprecated
 * `transformedNormalView` path) that first-draw compile can stall the main
 * thread long enough to visibly drop a frame. The stall reproduced whenever
 * a new scene condition (new shadow cascade contents, new light touching a
 * mesh) forced the renderer to rebuild a program variant — typically while
 * flying over newly-streamed terrain chunks.
 *
 * Calling `compileAsync` up front on WebGPU is non-blocking (the work runs
 * on a worker thread) and Three.js internally skips programs that are
 * already compiled, so extra calls are cheap.
 *
 * Usage:
 *   <Canvas>
 *     <ShaderPrewarm />
 *     ...
 *   </Canvas>
 *
 * Place it AFTER components that populate the scene so it picks them up on
 * first run. `delay` gives terrain/decoration/VRM loads a chance to finish
 * before we ask the renderer to compile what it sees.
 */
interface ShaderPrewarmProps {
  /** Milliseconds to wait after mount before the initial prewarm. */
  delay?: number;
  /**
   * If provided, changing this value triggers another prewarm. Useful when
   * something important (e.g. a new remote VRM) has been added to the scene
   * later in the session.
   */
  trigger?: unknown;
}

/**
 * Default delay (ms) before the single prewarm pass fires. 2.5s is enough
 * for the terrain chunk pipeline, the local VRM, and (usually) the HDR /
 * environment textures to finish attaching. A later attempt — or running
 * multiple timed prewarms — caused WebGPU "No pipeline set" errors because
 * `compileAsync` races Three.js's pipeline cache while it's still
 * processing. For scene additions that happen later (remote peers, slow
 * CDN fetches), use the targeted per-mount prewarms in Player.jsx and
 * Participants.tsx — both are tied to concrete load events rather than a
 * wall-clock stagger, so they don't race the render loop.
 */
const DEFAULT_PREWARM_DELAY_MS = 2500;

export function ShaderPrewarm({ delay = DEFAULT_PREWARM_DELAY_MS, trigger }: ShaderPrewarmProps): null {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const renderer = gl as any;
    if (typeof renderer.compileAsync !== 'function') return;

    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      try {
        renderer.compileAsync(scene, camera).catch(() => {});
      } catch {
        // Non-fatal — scene might be tearing down.
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [gl, scene, camera, delay, trigger]);

  return null;
}

export default ShaderPrewarm;
