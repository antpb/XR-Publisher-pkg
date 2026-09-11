/**
 * Selective lighting occlusion — lets additive light effects (e.g. concert
 * beams) render OVER terrain and sky but still be occluded by SOLID objects
 * (buildings, avatar, props).
 *
 * Two things make this hard, both rooted in how terrain renders:
 *
 *  1. TERRAIN IS A WEBGPU RENDER BUNDLE. A bundle replays cached draw commands;
 *     it ignores `scene.overrideMaterial` AND it breaks the normal pass order for
 *     depth-disabled transparents — a `depthTest:false` beam ends up painted
 *     BEHIND the bundled terrain (documented in CLAUDE.md: "a depth-disabled
 *     panel got painted behind the world"). So while occlusion is active we
 *     UN-BUNDLE the terrain (`isBundleGroup = false`): it then renders as normal
 *     opaque geometry, the transparent beam correctly draws over it, and the
 *     occluder pass can hide it. Bundling is restored when occlusion turns off,
 *     so normal worlds keep the perf feature.
 *
 *  2. SHARED DEPTH BUFFER. Terrain, buildings and the avatar share one depth
 *     buffer, so a depth flag can't say "occlude by buildings, not terrain".
 *     Instead, an extra occluder-depth pass renders SOLIDS ONLY (terrain hidden,
 *     transparents/sky excluded) writing linear distance; the beam multiplies its
 *     opacity by `occlusionMaskNode()`, which hides it where a solid is closer.
 *
 * COST: gated. Disabled (default) → `renderOccluderDepth` early-outs (and restores
 * any bundling), `occlusionMaskNode()` is a constant 1.0. The extra pass + the
 * un-bundling only happen while a plugin opts in (WebGPU only).
 */
import { RenderTarget, FloatType, NearestFilter, RGBAFormat, Color } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { positionView, texture, screenUV, float, select } from 'three/tsl';

const FAR = 1e6;

// The occluder un-bundles terrain (draw-call explosion) and renders an extra
// full-scene pass into a FloatType target (often not renderable on mobile GPUs).
// That overwhelms / corrupts mobile — so it is HARD-DISABLED on any touch device.
// NOTE: iPadOS Safari reports a DESKTOP "Macintosh" user-agent, so a UA regex
// alone misses iPads; `maxTouchPoints > 1` catches them (and phones/tablets).
// Beams fall back to no occlusion there (the mask is a constant 1).
const _isMobile = typeof navigator !== 'undefined' && (
  /Mobi|Android|iPhone|iPad|iPod|Tablet|Silk/i.test(navigator.userAgent || '')
  || (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
);

let _enabled = false;
let _rt: RenderTarget | null = null;
let _override: MeshBasicNodeMaterial | null = null;
let _maskNode: any = null;
const _exclude = new Set<{ visible: boolean }>();
const _unbundled = new Set<any>();
const _clear = new Color(FAR, FAR, FAR);
const _prevClear = new Color();

export function setOcclusionEnabled(b: boolean): void {
  _enabled = !!b;
}
export function isOcclusionEnabled(): boolean {
  return _enabled;
}

/** Extra objects to HIDE during the occluder pass (a plugin's additive FX). */
export function addOcclusionExclude(obj: { visible: boolean } | null | undefined): void {
  if (obj) _exclude.add(obj);
}
export function removeOcclusionExclude(obj: { visible: boolean } | null | undefined): void {
  if (obj) _exclude.delete(obj as any);
}

function ensureTarget(): RenderTarget {
  if (!_rt) {
    _rt = new RenderTarget(1024, 1024, {
      type: FloatType, format: RGBAFormat,
      minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: true,
    });
  }
  return _rt;
}

function restoreBundles(): void {
  for (const g of _unbundled) g.isBundleGroup = true;
  _unbundled.clear();
}

/**
 * Per-frame: un-bundle terrain (so beams layer over it) and render the
 * occluder-depth of solids. Call BEFORE the main render. No-op / restores
 * bundling when disabled. WebGPU only. Fully guarded.
 */
export function renderOccluderDepth(renderer: any, scene: any, camera: any): void {
  if (!_enabled || _isMobile) {
    if (_unbundled.size) restoreBundles();
    return;
  }
  if (!renderer?.isWebGPURenderer) return;

  // Captured up-front so `finally` can ALWAYS restore the scene, even if the
  // occluder render throws. Leaving objects hidden = the whole world (towns,
  // avatar) vanishes — never let that escape this function.
  const hidden: { visible: boolean }[] = [];
  const prevOverride = scene.overrideMaterial;
  const prevTarget = renderer.getRenderTarget();
  const prevAlpha = renderer.getClearAlpha();
  renderer.getClearColor(_prevClear);

  try {
    // (1) Un-bundle terrain so the main render layers the beam over it correctly.
    scene.traverse((o: any) => {
      if (o.isBundleGroup === true) { o.isBundleGroup = false; _unbundled.add(o); }
    });

    // (2) Occluder-depth pass: solids only.
    const rt = ensureTarget();
    const w = renderer.domElement?.width || 1024;
    const h = renderer.domElement?.height || 1024;
    if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
    if (!_override) {
      _override = new MeshBasicNodeMaterial();
      _override.colorNode = positionView.z.negate(); // linear distance from camera
      (_override as any).toneMapped = false;
    }

    // Hide bundle groups (terrain + baked decos), uv/normal-less geometry (grass),
    // transparents and depth-write-disabled backgrounds — none are real occluders.
    for (const g of _unbundled) { if (g.visible) { g.visible = false; hidden.push(g); } }
    scene.traverse((o: any) => {
      if (!o.visible) return;
      const g = o.geometry;
      if (o.isMesh && g && g.attributes && (!g.attributes.uv || !g.attributes.normal)) {
        o.visible = false; hidden.push(o); return;
      }
      const m = o.material;
      if (!m) return;
      const skip = Array.isArray(m) ? m.some((x: any) => x && (x.transparent || x.depthWrite === false))
                                    : (m.transparent || m.depthWrite === false);
      if (skip) { o.visible = false; hidden.push(o); }
    });
    for (const o of _exclude) { if (o.visible) { o.visible = false; hidden.push(o); } }

    scene.overrideMaterial = _override;
    renderer.setRenderTarget(rt);
    renderer.setClearColor(_clear, 1);
    renderer.clear();
    renderer.render(scene, camera);
  } catch (e) {
    console.error('[XRPublisher] occluder-depth pass failed; disabling', e);
    _enabled = false;
  } finally {
    // ALWAYS restore — visibility first (this is what blanks the world if missed).
    for (const o of hidden) o.visible = true;
    scene.overrideMaterial = prevOverride;
    try {
      renderer.setRenderTarget(prevTarget);
      renderer.setClearColor(_prevClear, prevAlpha);
    } catch { /* renderer state restore best-effort */ }
    if (!_enabled) restoreBundles();
  }
}

/**
 * TSL opacity factor for a light material: 1 where in front of (or no) occluder,
 * 0 where a solid is closer. Constant 1 when disabled — safe to bake in always.
 */
export function occlusionMaskNode(): any {
  if (_isMobile) return float(1); // occluder never runs on mobile → no masking
  if (!_maskNode) {
    const rt = ensureTarget();
    const occ = texture(rt.texture, screenUV).r;   // nearest occluder distance (FAR where none)
    const beam = positionView.z.negate();          // this fragment's distance
    _maskNode = select(occ.lessThan(beam.sub(0.1)), float(0), float(1));
  }
  return _maskNode;
}
