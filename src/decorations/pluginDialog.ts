/**
 * Plugin dialog — an in-WORLD modal (title + content + action buttons) that
 * plugins open from anywhere. Rendered as a 3D panel (PluginDialog.tsx), NOT a
 * DOM overlay, so it works for VR users: the panel floats in front of the
 * player and buttons are clicked with the mouse (2D) or the controller ray
 * (VR). One dialog at a time; opening a new one replaces the current.
 *
 *   XRPublisher.openDialog({
 *     title: 'A glowing orb',
 *     content: 'It hums with a soft light. Touch it?',
 *     buttons: [
 *       { label: 'Touch',  onSelect: () => score++ },
 *       { label: 'Leave' },                      // no onSelect → just closes
 *     ],
 *   });
 *
 * Powerful enough for narrative beats, quizzes (mark `keepOpen` on a wrong
 * answer to let the player retry), shops, confirmations.
 */
export interface DialogButton {
  label: string;
  /** Fired when the button is clicked. */
  onSelect?: () => void;
  /** Keep the dialog open after this button (default false → closes). Use for
   *  quiz "wrong, try again" or multi-step flows. */
  keepOpen?: boolean;
  /** Visual emphasis ('primary' = accent fill). */
  variant?: 'primary' | 'default';
}

/** Why a dialog closed — lets a quiz tell "answered" from "walked away". */
export type DialogCloseReason = 'button' | 'escape' | 'dismissed' | 'replaced' | 'manual';

/** Fired on `window` whenever a dialog leaves the world (any reason). Listen
 *  with `window.addEventListener('xrpublisher:dialogremoved', e => …)` and read
 *  `e.detail.reason` ('dismissed' = the player walked away). Use it to reset
 *  state — e.g. restart a quiz that wasn't completed. */
export const DIALOG_REMOVED_EVENT = 'xrpublisher:dialogremoved';

export interface DialogSpec {
  title?: string;
  content?: string;
  buttons?: DialogButton[];
  /** Panel width in world metres (default 1.9). Height grows with content. */
  width?: number;
  /** Auto-close once the player is this far (world metres) from where the
   *  dialog opened (default 7). The dialog is world-anchored, so walking off
   *  removes it — `onClose`/the removed-event fire with reason 'dismissed'. */
  dismissDistance?: number;
  /** Called whenever the dialog closes, with WHY. A button without keepOpen →
   *  'button'; Escape → 'escape'; walked away → 'dismissed'; replaced by a new
   *  openDialog → 'replaced'; closeDialog() → 'manual'. Reset quiz/narrative
   *  state on 'dismissed'/'escape'. */
  onClose?: (reason: DialogCloseReason) => void;
}

let current: DialogSpec | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) cb();
}

function fireClosed(spec: DialogSpec, reason: DialogCloseReason): void {
  try { spec.onClose?.(reason); } catch (err) { console.warn('[XRPublisher] dialog onClose threw', err); }
  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new CustomEvent(DIALOG_REMOVED_EVENT, { detail: { reason } })); } catch { /* noop */ }
  }
}

/** Open a dialog (replaces any current one — its onClose fires with 'replaced'). */
export function openDialog(spec: DialogSpec): void {
  if (current && current !== spec) {
    const prev = current;
    current = null;
    fireClosed(prev, 'replaced');
  }
  current = spec;
  notify();
}

/** Close the current dialog. No-op if none open. `reason` defaults to 'manual'
 *  (the public XRPublisher.closeDialog() path); internal callers pass the real
 *  cause. */
export function closeDialog(reason: DialogCloseReason = 'manual'): void {
  if (!current) return;
  const c = current;
  current = null;
  notify();
  fireClosed(c, reason);
}

/** useSyncExternalStore snapshot — stable identity until open/close. */
export function getDialog(): DialogSpec | null {
  return current;
}

export function subscribeDialog(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ── Dialog button registry (for world-cursor / reticle selection) ──────────
// PluginDialog registers each button's mesh + action. WorldCursor raycasts the
// camera-centre ray (= where the reticle aims) against these meshes on a click
// and fires the match — so mobile (look + tap) and desktop (aim + click) select
// buttons without a precise on-mesh pointer. VR controllers still hit the mesh
// through R3F onClick; both paths funnel through activateDialogButtonMesh, which
// dedupes (one physical click can resolve through both at once).
import type { Object3D } from 'three';

const _buttonActivators = new Map<Object3D, () => void>();
let _lastActivate = 0;

export function registerDialogButton(mesh: Object3D, activate: () => void): () => void {
  _buttonActivators.set(mesh, activate);
  return () => { _buttonActivators.delete(mesh); };
}

export function getDialogButtonMeshes(): Object3D[] {
  return Array.from(_buttonActivators.keys());
}

/** Fire a registered button's action, deduped within 250ms (the reticle-click
 *  and R3F onClick paths can both resolve the same button for one click).
 *  Returns true if `mesh` matched a registered button. */
export function activateDialogButtonMesh(mesh: Object3D): boolean {
  const fn = _buttonActivators.get(mesh);
  if (!fn) return false;
  const now = Date.now();
  if (now - _lastActivate < 250) return true;
  _lastActivate = now;
  fn();
  return true;
}
