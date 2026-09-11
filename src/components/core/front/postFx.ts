/**
 * Post-processing — the ONE rendering capability a plugin can't build itself,
 * because the engine owns the renderer's draw call (`FrameRateCap.tsx` calls
 * `gl.render` manually at a 60/30 idle cadence). So core exposes a minimal,
 * plugin-driven API:
 *
 *   XRPublisher.setPostProcessing({ bloom: true });  // on  (near your effect)
 *   XRPublisher.clearPostProcessing();               // off (when player leaves)
 *
 * Implementation is the canonical WebGPU node bloom: a scene `pass()` whose
 * colour texture is fed through `bloom(strength, radius, THRESHOLD)`. The
 * THRESHOLD is what makes it selective — only pixels brighter than it bloom, so
 * a plugin's emissive meshes (high `emissiveIntensity`) glow while the ordinary
 * world doesn't (especially under a forced-night `setTimeOfDay`, where the only
 * bright things are the effect). Optional `anamorphic`/`chromaticAberration`.
 *
 * COST-GATED + WebGPU-only: nothing is built until a plugin enables it (disposed
 * on clear); `renderPostFx` (called from `FrameRateCap`) returns false on the
 * classic WebGLRenderer and when inactive, so normal worlds and `?renderer=webgl`
 * keep plain `gl.render`. `PostProcessing.outputColorTransform` stays true (ACES
 * applied once at the end; the pass renders linear — no double tone-map).
 */
import type { Scene, Camera } from 'three';
import { PostProcessing } from 'three/webgpu';
import { pass, uniform, float } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { anamorphic } from 'three/addons/tsl/display/AnamorphicNode.js';
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';

export interface PostProcessingConfig {
  /** Bloom on bright (emissive) pixels. `true` = defaults, or tune strength/radius/threshold. */
  bloom?: boolean | { strength?: number; radius?: number; threshold?: number };
  /** Horizontal anamorphic streaks off bright pixels. */
  anamorphic?: boolean | { threshold?: number; scale?: number };
  /** Chromatic aberration (screen-UV channel split). `true` = mild default, or a number. */
  chromaticAberration?: boolean | number;
  /** Modulate bloom strength + CA from the master mix (the frame "breathes"). */
  audioReactive?: boolean;
}

interface Resolved {
  bloom: { strength: number; radius: number; threshold: number } | null;
  anamorphic: { threshold: number; scale: number } | null;
  chromatic: number | null;
  audioReactive: boolean;
}

const ANAMORPHIC_SAMPLES = 16;

// Bloom adds an extra full-scene pass + bloom render targets. On mobile GPUs that
// can corrupt the draw path so only the cached terrain bundle survives (buildings/
// avatar/stage vanish). Hard-disable on touch devices — iPadOS spoofs a desktop
// UA, so check maxTouchPoints too. The scene then renders with plain gl.render.
const _isMobile = typeof navigator !== 'undefined' && (
  /Mobi|Android|iPhone|iPad|iPod|Tablet|Silk/i.test(navigator.userAgent || '')
  || (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
);

function resolve(cfg: PostProcessingConfig): Resolved {
  const b = cfg.bloom ?? true; // bloom on by default
  const a = cfg.anamorphic;
  const c = cfg.chromaticAberration;
  return {
    bloom: b === false ? null : {
      strength: (typeof b === 'object' && b.strength != null) ? b.strength : 0.9,
      radius: (typeof b === 'object' && b.radius != null) ? b.radius : 0.85,
      // Default threshold keeps the ordinary lit world out of the bloom; emissive
      // effect meshes exceed it easily.
      threshold: (typeof b === 'object' && b.threshold != null) ? b.threshold : 0.7,
    },
    anamorphic: !a ? null : {
      threshold: (typeof a === 'object' && a.threshold != null) ? a.threshold : 0.7,
      scale: (typeof a === 'object' && a.scale != null) ? a.scale : 2.6,
    },
    chromatic: !c ? null : (typeof c === 'number' ? c : 0.0014),
    audioReactive: !!cfg.audioReactive,
  };
}

let _cfg: Resolved | null = null;
let _active = false;
let _pp: PostProcessing | null = null;
let _builtFor: { renderer: unknown; scene: Scene; camera: Camera } | null = null;
let _bloomPass: { strength: { value: number } } | null = null;
const _caStrengthU = uniform(0);
let _freq: Uint8Array | null = null;

export function setPostProcessing(cfg: PostProcessingConfig = {}): void {
  _cfg = resolve(cfg);
  _active = true;
  disposePipeline(); // rebuild next active frame with the new node-baked params
}

export function clearPostProcessing(): void {
  _active = false;
  disposePipeline();
}

function disposePipeline(): void {
  if (_pp) { try { _pp.dispose(); } catch { /* renderer gone */ } }
  _pp = null;
  _builtFor = null;
  _bloomPass = null;
}

function masterLevel(): { level: number; bass: number } {
  const a = (typeof window !== 'undefined') ? (window as any).__xrAudioAnalyser as AnalyserNode | undefined : undefined;
  if (!a) return { level: 0, bass: 0 };
  if (!_freq || _freq.length !== a.frequencyBinCount) _freq = new Uint8Array(a.frequencyBinCount);
  a.getByteFrequencyData(_freq as any);
  const n = _freq.length;
  const bi = Math.max(1, Math.floor(n * 0.08));
  let bass = 0; for (let i = 0; i < bi; i++) bass += _freq[i]; bass /= bi * 255;
  let all = 0; for (let i = 0; i < n; i++) all += _freq[i]; all /= n * 255;
  return { level: all, bass };
}

function build(renderer: unknown, scene: Scene, camera: Camera): void {
  const cfg = _cfg as Resolved;
  const scenePass = pass(scene, camera);
  const color = scenePass.getTextureNode(); // default 'output' colour texture

  let base: any = color;
  if (cfg.chromatic != null) {
    _caStrengthU.value = cfg.chromatic;
    base = chromaticAberration(color, _caStrengthU);
  }

  let out: any = base;
  if (cfg.bloom) {
    const bp = bloom(color, cfg.bloom.strength, cfg.bloom.radius, cfg.bloom.threshold);
    _bloomPass = bp as unknown as { strength: { value: number } };
    out = out.add(bp);
  }
  if (cfg.anamorphic) {
    out = out.add(anamorphic(color, float(cfg.anamorphic.threshold), float(cfg.anamorphic.scale), ANAMORPHIC_SAMPLES));
  }

  const pp = new PostProcessing(renderer as ConstructorParameters<typeof PostProcessing>[0]);
  pp.outputNode = out;
  pp.needsUpdate = true;
  _pp = pp;
  _builtFor = { renderer, scene, camera };
}

function ensure(renderer: unknown, scene: Scene, camera: Camera): boolean {
  if (!(renderer as { isWebGPURenderer?: boolean })?.isWebGPURenderer) return false;
  if (_pp && _builtFor && _builtFor.renderer === renderer && _builtFor.scene === scene && _builtFor.camera === camera) return true;
  disposePipeline();
  try {
    build(renderer, scene, camera);
  } catch (e) {
    // Never let a post-FX build crash the render loop — fall back to gl.render.
    console.error('[XRPublisher] post-processing build failed; disabling', e);
    disposePipeline();
    _active = false;
    return false;
  }
  return true;
}

/** Render through the pipeline. Returns true if it rendered (FrameRateCap then
 *  skips its own gl.render), false if inactive / not WebGPU / build failed. */
export function renderPostFx(renderer: unknown, scene: Scene, camera: Camera): boolean {
  if (_isMobile) return false;          // never run the bloom pass on mobile
  if (!_active || !_cfg) return false;
  if (!ensure(renderer, scene, camera) || !_pp) return false;

  if (_cfg.audioReactive) {
    const { level, bass } = masterLevel();
    // Gentle breathing — keep well under a strobe (bloom compounds emissive).
    if (_bloomPass && _cfg.bloom) _bloomPass.strength.value = _cfg.bloom.strength + level * 0.5;
    if (_cfg.chromatic != null) _caStrengthU.value = _cfg.chromatic + bass * 0.002;
  }

  try {
    _pp.render();
  } catch (e) {
    console.error('[XRPublisher] post-processing render failed; disabling', e);
    disposePipeline();
    _active = false;
    return false;
  }
  return true;
}

export function getActivePostProcessing(): PostProcessing | null {
  return _active ? _pp : null;
}
