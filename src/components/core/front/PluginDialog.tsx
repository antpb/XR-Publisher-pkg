/**
 * PluginDialog — the in-WORLD modal opened via XRPublisher.openDialog().
 *
 * A rounded panel (title + content + action buttons) built from meshes +
 * MSDFTextMesh, clickable by mouse (2D) and controller ray (VR).
 *
 * Rendering contract (learned the hard way):
 * - NORMAL DEPTH, NOT depthTest:false. The terrain renders through WebGPU
 *   render bundles whose cached draw commands ignore renderOrder, so a
 *   depth-disabled panel got painted *behind* the world (only showing through
 *   transparent grass). Instead the panel is a normal opaque depth-tested
 *   object floated at HEAD HEIGHT, well above the short grass and in front of
 *   the terrain — ordinary depth then layers it correctly with zero tricks.
 * - OPAQUE + DOUBLE-SIDED: a transparent panel vanished into the world; a
 *   single-sided one back-face-culled when the billboard faced away.
 * - AVATAR-ANCHORED, AVATAR-FACING, SET ONCE. Placed in front of the avatar
 *   ('playerOne') facing the avatar (not the camera — a 3rd-person camera is
 *   offset and threw the panel into the view corner). The transform is captured
 *   ONCE at open and held — no per-frame billboard (that was wasted work). Only
 *   a throttled distance check runs, to auto-dismiss when the player walks off.
 * - CONTENT-AWARE HEIGHT: grows with an estimated line count (capped); the text
 *   wrap width is fit to the panel so long content doesn't spill.
 *
 * Mounted once inside the world (both renderer branches). One dialog at a time.
 */
import React, { useEffect, useMemo, useRef, useSyncExternalStore, useState, type ReactElement } from 'react';
import { useThree, useFrame, type ThreeEvent } from '@react-three/fiber';
import { DoubleSide, Group, Mesh, Shape, ShapeGeometry, Vector3 } from 'three';
import { CanvasTextMesh } from './CanvasTextMesh';
import {
  subscribeDialog, getDialog, closeDialog, registerDialogButton, activateDialogButtonMesh,
  type DialogButton, type DialogSpec,
} from '../../../decorations/pluginDialog';

const PANEL_BG = '#14141b';
const PANEL_BORDER = '#4a4a57';
const BTN_BG = '#2a2a36';
const BTN_BG_HOVER = '#3b3b4d';
const BTN_PRIMARY = '#2f6df0';
const BTN_PRIMARY_HOVER = '#4a82ff';

// Layout — all in WORLD metres (CanvasTextMesh sizes glyphs directly in world
// units, no px↔world scale to juggle).
const PAD_X = 0.15, PAD_TOP = 0.16, PAD_BOT = 0.16;
const GAP_TITLE_CONTENT = 0.06, GAP_CONTENT_BUTTONS = 0.14;
const TITLE_WFS = 0.11;       // title glyph world size
const BODY_WFS = 0.062;       // content / button-label glyph world size
const LINE_MUL = 1.3;
const BTN_ROW_H = 0.22;
const BTN_LABEL_WFS = 0.058;
const MIN_H = 0.62, MAX_H = 2.6;
const PLACE_DISTANCE = 2.0;   // metres in front of the avatar
const PLACE_HEIGHT = 1.4;     // metres above the avatar origin (≈ head height)

function buildRoundedRect(w: number, h: number, r: number): ShapeGeometry {
  const s = new Shape();
  const x = -w / 2, y = -h / 2;
  const rad = Math.min(r, w / 2, h / 2);
  s.moveTo(x + rad, y);
  s.lineTo(x + w - rad, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rad);
  s.lineTo(x + w, y + h - rad);
  s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  s.lineTo(x + rad, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rad);
  s.lineTo(x, y + rad);
  s.quadraticCurveTo(x, y, x + rad, y);
  return new ShapeGeometry(s);
}

// SHARED, cached by rounded dimensions. Panel/button sizes quantise to a few
// values, so this map stays tiny — and because the geometries are shared and
// NEVER disposed, a dialog open/close can't free a buffer mid-frame (disposing
// a geometry still in the WebGPU render pass throws "setIndexBuffer ... not a
// GPUBuffer"). The handful of cached geometries is a negligible, bounded cost.
const _geoCache = new Map<string, ShapeGeometry>();
function getRoundedRect(w: number, h: number, r: number): ShapeGeometry {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${r.toFixed(3)}`;
  let g = _geoCache.get(key);
  if (!g) { g = buildRoundedRect(w, h, r); _geoCache.set(key, g); }
  return g;
}

// Crude wrapped-line estimate for panel sizing (CanvasTextMesh does the real
// wrapping). Average glyph advance ≈ 0.55em in world units.
function estimateLines(text: string, worldWidth: number, wfs: number): number {
  const perLine = Math.max(1, Math.floor(worldWidth / (wfs * 0.55)));
  let lines = 0;
  for (const para of text.split('\n')) lines += Math.max(1, Math.ceil(para.length / perLine));
  return lines;
}

interface DialogLayout {
  W: number; H: number; innerW: number;
  titleY: number | null; bodyY: number | null; buttonsY: number;
}

function computeLayout(dialog: DialogSpec): DialogLayout {
  const W = dialog.width ?? 1.9;
  const innerW = W - 2 * PAD_X;

  const titleLines = dialog.title ? estimateLines(dialog.title, innerW, TITLE_WFS) : 0;
  const bodyLines = dialog.content ? estimateLines(dialog.content, innerW, BODY_WFS) : 0;
  const titleH = titleLines * TITLE_WFS * LINE_MUL;
  const bodyH = bodyLines * BODY_WFS * LINE_MUL;
  const btnH = (dialog.buttons?.length ?? 0) > 0 ? BTN_ROW_H : 0;

  const gaps =
    (titleH > 0 && bodyH > 0 ? GAP_TITLE_CONTENT : 0) +
    ((titleH > 0 || bodyH > 0) && btnH > 0 ? GAP_CONTENT_BUTTONS : 0);
  const H = Math.max(MIN_H, Math.min(MAX_H, PAD_TOP + titleH + bodyH + btnH + gaps + PAD_BOT));

  let cursor = H / 2 - PAD_TOP;
  let titleY: number | null = null;
  if (titleH > 0) { titleY = cursor - titleH / 2; cursor -= titleH + (bodyH > 0 ? GAP_TITLE_CONTENT : 0); }
  let bodyY: number | null = null;
  if (bodyH > 0) { bodyY = cursor - bodyH / 2; }
  const buttonsY = -H / 2 + PAD_BOT + btnH / 2;

  return { W, H, innerW, titleY, bodyY, buttonsY };
}

const _cam = new Vector3();
const _avatar = new Vector3();
const _dir = new Vector3();
const _fwd = new Vector3();

interface DialogButtonMeshProps {
  button: DialogButton;
  x: number;
  width: number;
  height: number;
}

function DialogButtonMesh({ button, x, width, height }: DialogButtonMeshProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<Mesh>(null);
  const geo = useMemo(() => getRoundedRect(width, height, 0.04), [width, height]);
  const primary = button.variant === 'primary';
  const color = primary
    ? (hovered ? BTN_PRIMARY_HOVER : BTN_PRIMARY)
    : (hovered ? BTN_BG_HOVER : BTN_BG);

  // Register this button's mesh + action so the world-cursor reticle (camera-
  // centre raycast in WorldCursor) can fire it on a click/tap.
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    m.userData.camExcludeCollision = true; // keep it out of the reticle's terrain scan
    const activate = () => {
      try { button.onSelect?.(); } catch (err) { console.warn('[XRPublisher] dialog button threw', err); }
      if (!button.keepOpen) closeDialog('button');
    };
    return registerDialogButton(m, activate);
  }, [button]);

  // R3F onClick (free mouse / VR controller ray) → same deduped activator.
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (meshRef.current) activateDialogButtonMesh(meshRef.current);
  };

  return (
    <group position={[x, 0, 0.01]}>
      <mesh
        ref={meshRef}
        geometry={geo}
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <meshBasicMaterial color={color} side={DoubleSide} />
      </mesh>
      <CanvasTextMesh
        text={button.label}
        worldWidth={width * 0.92}
        worldFontSize={BTN_LABEL_WFS}
        fontWeight="600"
        color="#ffffff"
        align="center"
        position={[0, 0, 0.01]}
      />
    </group>
  );
}

export function PluginDialog(): ReactElement | null {
  const dialog = useSyncExternalStore(subscribeDialog, getDialog);
  const { camera, scene } = useThree();
  const groupRef = useRef<Group>(null);
  const placedRef = useRef<{ spec: DialogSpec | null; pos: Vector3 }>({ spec: null, pos: new Vector3() });
  const tickRef = useRef(0);

  // NOTE: pointer lock is deliberately LEFT ENGAGED while a dialog is open — the
  // world-cursor reticle (centre of view) aims the camera-centre ray that
  // WorldCursor uses to select buttons on a click. Releasing it froze the
  // reticle and broke aiming.

  // Escape closes.
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { e.preventDefault(); closeDialog('escape'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g || !dialog) return;

    // Place + orient ONCE per dialog, then HOLD (no per-frame billboard).
    if (placedRef.current.spec !== dialog) {
      const avatarObj = scene.getObjectByName('playerOne');
      if (avatarObj) avatarObj.getWorldPosition(_avatar);
      else { camera.getWorldPosition(_cam); _avatar.copy(_cam); }
      camera.getWorldDirection(_dir);
      _fwd.set(_dir.x, 0, _dir.z);
      if (_fwd.lengthSq() < 1e-4) _fwd.set(0, 0, -1);
      _fwd.normalize();
      const px = _avatar.x + _fwd.x * PLACE_DISTANCE;
      const pz = _avatar.z + _fwd.z * PLACE_DISTANCE;
      g.position.set(px, _avatar.y + PLACE_HEIGHT, pz);
      // +Z faces the avatar (yaw only, upright).
      g.rotation.set(0, Math.atan2(_avatar.x - px, _avatar.z - pz), 0);
      placedRef.current.spec = dialog;
      placedRef.current.pos.set(px, _avatar.y + PLACE_HEIGHT, pz);
      tickRef.current = 0;
      return;
    }

    // Throttled (~6Hz) walk-away check — the only per-frame work, and it does
    // no transform writes.
    tickRef.current = (tickRef.current + 1) % 10;
    if (tickRef.current !== 0) return;
    const avatarObj = scene.getObjectByName('playerOne');
    if (avatarObj) avatarObj.getWorldPosition(_avatar);
    else { camera.getWorldPosition(_cam); _avatar.copy(_cam); }
    const a = placedRef.current.pos;
    const dx = _avatar.x - a.x, dz = _avatar.z - a.z;
    const dismiss = dialog.dismissDistance ?? 7;
    if (dx * dx + dz * dz > dismiss * dismiss) closeDialog('dismissed');
  });

  const layout = useMemo(() => (dialog ? computeLayout(dialog) : null), [dialog]);
  const panelGeo = useMemo(() => (layout ? getRoundedRect(layout.W, layout.H, 0.07) : null), [layout]);
  const borderGeo = useMemo(
    () => (layout ? getRoundedRect(layout.W + 0.04, layout.H + 0.04, 0.08) : null),
    [layout],
  );

  if (!dialog || !layout || !panelGeo || !borderGeo) return null;

  const buttons = dialog.buttons ?? [];
  const btnW = buttons.length
    ? Math.min(0.56, (layout.W - 0.2 - 0.1 * Math.max(0, buttons.length - 1)) / buttons.length)
    : 0;
  const btnGap = 0.1;
  const rowW = buttons.length * btnW + (buttons.length - 1) * btnGap;

  return (
    <group ref={groupRef} userData={{ camExcludeCollision: true }}>
      {/* Opaque, double-sided, normal depth — a solid object floating at head
          height that depth-tests cleanly against the world. */}
      <mesh geometry={borderGeo} position={[0, 0, -0.004]}>
        <meshBasicMaterial color={PANEL_BORDER} side={DoubleSide} />
      </mesh>
      <mesh geometry={panelGeo} position={[0, 0, 0]}>
        <meshBasicMaterial color={PANEL_BG} side={DoubleSide} />
      </mesh>

      {dialog.title && layout.titleY !== null && (
        <CanvasTextMesh
          text={dialog.title}
          worldWidth={layout.innerW}
          worldFontSize={TITLE_WFS}
          fontWeight="700"
          color="#ffffff"
          align="center"
          position={[0, layout.titleY, 0.01]}
        />
      )}

      {dialog.content && layout.bodyY !== null && (
        <CanvasTextMesh
          text={dialog.content}
          worldWidth={layout.innerW}
          worldFontSize={BODY_WFS}
          color="#d8d8e0"
          align="center"
          position={[0, layout.bodyY, 0.01]}
        />
      )}

      <group position={[0, layout.buttonsY, 0]}>
        {buttons.map((b, i) => (
          <DialogButtonMesh
            key={`${i}-${b.label}`}
            button={b}
            x={-rowW / 2 + btnW / 2 + i * (btnW + btnGap)}
            width={btnW}
            height={BTN_ROW_H}
          />
        ))}
      </group>
    </group>
  );
}
