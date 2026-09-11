/**
 * CanvasTextMesh — renderer-agnostic UI text (works on BOTH WebGPU and WebGL).
 *
 * The engine's MSDFTextMesh is built on `three-msdf-text-webgpu` (TSL node
 * materials) and renders NOTHING on the WebGL path — so on devices without
 * WebGPU (much of mobile) dialog text was blank. This draws the text to a 2D
 * canvas and maps it onto a plane with a plain `meshBasicMaterial`, which both
 * renderers handle the same. Good enough for fixed-distance UI panels; not a
 * replacement for MSDF where you need crisp text at extreme scale/angle.
 *
 * The plane is `worldWidth` wide (the wrap box) and centred on its origin, so
 * `position` places the text block's centre. The texture + geometry are
 * disposed on change/unmount via requestAnimationFrame (deferred so a GPU
 * buffer is never freed mid-frame — that throws on WebGPU).
 */
import React, { useEffect, useMemo } from 'react';
import { CanvasTexture, DoubleSide, LinearFilter, PlaneGeometry, SRGBColorSpace } from 'three';

const PX_PER_WORLD = 256; // texture resolution per world metre
const LINE_MUL = 1.3;
const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export interface CanvasTextMeshProps {
  text: string;
  /** Wrap-box width in world metres. */
  worldWidth: number;
  /** Glyph size in world metres (≈ cap+ascender height). */
  worldFontSize: number;
  color?: string;
  fontWeight?: string;
  /** Text alignment WITHIN the box. */
  align?: 'left' | 'center' | 'right';
  /** Which point of the text block sits at `position` (like MSDFTextMesh). */
  anchorX?: 'left' | 'center' | 'right';
  anchorY?: 'top' | 'middle' | 'bottom';
  position?: [number, number, number];
  rotation?: [number, number, number];
  renderOrder?: number;
}

interface TextResources { texture: CanvasTexture; geometry: PlaneGeometry; worldWidth: number; worldHeight: number; key: number; }

let _resourceIdCounter = 0;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (line && ctx.measureText(test).width > maxWidth) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

function buildText(p: CanvasTextMeshProps): TextResources {
  const fontPx = Math.max(8, Math.round(p.worldFontSize * PX_PER_WORLD));
  const canvasW = Math.max(8, Math.round(p.worldWidth * PX_PER_WORLD));
  const pad = Math.round(fontPx * 0.3);
  const font = `${p.fontWeight ?? '400'} ${fontPx}px ${FONT_STACK}`;
  const align = p.align ?? 'center';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  const lines = wrapLines(ctx, p.text, canvasW - pad * 2);
  const lineH = fontPx * LINE_MUL;
  const canvasH = Math.max(8, Math.round(lines.length * lineH + pad * 2));

  canvas.width = canvasW;
  canvas.height = canvasH;
  // Resizing the canvas resets the 2D context — re-apply state.
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  ctx.fillStyle = p.color ?? '#ffffff';
  const cx = align === 'center' ? canvasW / 2 : align === 'right' ? canvasW - pad : pad;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx, pad + lineH * (i + 0.5));
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.anisotropy = 4;
  const worldHeight = canvasH / PX_PER_WORLD;
  const geometry = new PlaneGeometry(p.worldWidth, worldHeight);
  return { texture, geometry, worldWidth: p.worldWidth, worldHeight, key: ++_resourceIdCounter };
}

export function CanvasTextMesh(props: CanvasTextMeshProps) {
  const {
    position = [0, 0, 0], rotation = [0, 0, 0], renderOrder = 0,
    anchorX = 'center', anchorY = 'middle',
  } = props;
  const res = useMemo(
    () => buildText(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.text, props.worldWidth, props.worldFontSize, props.color, props.fontWeight, props.align],
  );

  useEffect(() => {
    const r = res;
    return () => {
      // Defer disposal — freeing a texture/geometry still in the render pass
      // throws "setIndexBuffer ... not a GPUBuffer" on WebGPU.
      requestAnimationFrame(() => { r.geometry.dispose(); r.texture.dispose(); });
    };
  }, [res]);

  // Offset the (centred) plane so the requested anchor point lands at the
  // group origin — same anchoring model as MSDFTextMesh. Applied inside a
  // group so it composes correctly with rotation.
  const offX = anchorX === 'left' ? res.worldWidth / 2 : anchorX === 'right' ? -res.worldWidth / 2 : 0;
  const offY = anchorY === 'top' ? -res.worldHeight / 2 : anchorY === 'bottom' ? res.worldHeight / 2 : 0;

  return (
    <group position={position} rotation={rotation}>
      {/* Keyed so a text/style change remounts a fresh Mesh+Material rather than
          mutating material.map on a persisted instance — on WebGPU, swapping a
          texture in place on an already-built material leaves the compiled
          pipeline's bind group pointing at the old (soon-disposed) texture,
          which throws "Invalid value used as weak map key" and then spams
          "No bind group set" every frame after. */}
      <mesh key={res.key} geometry={res.geometry} position={[offX, offY, 0]} renderOrder={renderOrder}>
        <meshBasicMaterial map={res.texture} transparent side={DoubleSide} />
      </mesh>
    </group>
  );
}
