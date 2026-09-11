/**
 * Plugin HUD layer — a sanctioned way for plugins to draw 2D graphics over
 * the world (a collection counter, a minimap, a status readout).
 *
 * FrontPluginProvider only renders 3D (R3F) plugins; there was no DOM/HUD
 * extension point. This module owns a single fixed-position overlay container
 * (created lazily, layered above the canvas, below modal UI) with corner
 * anchor slots. A plugin builds its own DOM node, registers it under an id +
 * anchor, and updates it imperatively (e.g. `el.textContent = count`). No
 * React, no store, no re-render coupling — the plugin owns its node and its
 * updates; the engine just parents/unparents it.
 *
 *   const el = document.createElement('div');
 *   el.textContent = '0 apples';
 *   XRPublisher.registerHud('apple-counter', el, 'top-right');
 *   // later, in onInteract: el.textContent = `${++count} apples`;
 */
export type HudAnchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface HudRecord {
  el: HTMLElement;
  anchor: HudAnchor;
}

const records = new Map<string, HudRecord>();
const slots = new Map<HudAnchor, HTMLElement>();
let root: HTMLDivElement | null = null;

const SLOT_STYLE: Record<HudAnchor, Partial<CSSStyleDeclaration>> = {
  'top-left':      { top: '16px',    left: '16px',   alignItems: 'flex-start' },
  'top-center':    { top: '16px',    left: '50%', transform: 'translateX(-50%)', alignItems: 'center' },
  'top-right':     { top: '16px',    right: '16px',  alignItems: 'flex-end' },
  'bottom-left':   { bottom: '16px', left: '16px',   alignItems: 'flex-start' },
  'bottom-center': { bottom: '110px', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' },
  'bottom-right':  { bottom: '16px', right: '16px',  alignItems: 'flex-end' },
};

function ensureRoot(): HTMLDivElement {
  if (root) return root;
  const r = document.createElement('div');
  r.id = 'xrp-plugin-hud';
  // Cover the viewport but never intercept input — only the registered HUD
  // nodes opt back into pointer events if they need clicks.
  Object.assign(r.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '90', // above the canvas (1), below NetworkingControls (100) / modals
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(r);
  root = r;
  return r;
}

function ensureSlot(anchor: HudAnchor): HTMLElement {
  let slot = slots.get(anchor);
  if (slot) return slot;
  slot = document.createElement('div');
  Object.assign(slot.style, {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    pointerEvents: 'none',
    ...(SLOT_STYLE[anchor] as Partial<CSSStyleDeclaration>),
  });
  ensureRoot().appendChild(slot);
  slots.set(anchor, slot);
  return slot;
}

/**
 * Mount a plugin-built DOM node into the HUD overlay. Re-registering the same
 * id replaces the previous node. The node's pointer events default to the
 * plugin's own CSS — set `el.style.pointerEvents = 'auto'` if it needs clicks.
 */
export function registerHud(id: string, el: HTMLElement, anchor: HudAnchor = 'top-right'): void {
  unregisterHud(id);
  const slot = ensureSlot(anchor);
  slot.appendChild(el);
  records.set(id, { el, anchor });
}

export function unregisterHud(id: string): void {
  const rec = records.get(id);
  if (!rec) return;
  rec.el.parentNode?.removeChild(rec.el);
  records.delete(id);
}
