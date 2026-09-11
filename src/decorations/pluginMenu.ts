/**
 * Plugin "More" menu — a sanctioned way for plugins (and the engine itself)
 * to add actions to the HUD's hamburger menu, so the left control cluster
 * doesn't grow an unbounded row of buttons and accident-prone controls
 * (like Enter VR) live behind a deliberate toggle.
 *
 * It's a tiny module-global registry with a `useSyncExternalStore`-friendly
 * subscribe/snapshot pair — the same bridge shape as `pluginHud.ts`, but for
 * React-rendered menu rows instead of imperative DOM nodes. Living at module
 * scope lets it bridge the two independent React roots: `EnvironmentFront`
 * (which owns the XR store) registers the VR item here, and `MoreMenu`
 * (hosted inside `NetworkingControls`, a separate root) renders it.
 *
 *   XRPublisher.registerMenuItem({
 *     id: 'reset-world',
 *     label: 'Reset',
 *     icon: '↻',                       // emoji/text, or an http(s) image URL
 *     onSelect: () => location.reload(),
 *   });
 *   // later: XRPublisher.unregisterMenuItem('reset-world');
 */

/** Reserved id for the engine's built-in "Enter VR" item. `MoreMenu`
 *  special-cases it to render the VR (Glasses) icon. */
export const VR_MENU_ITEM_ID = 'enter-vr';

export interface MenuItemSpec {
  /** Stable unique id. Re-registering the same id replaces the item. */
  id: string;
  /** Row label. */
  label: string;
  /** Optional icon: a short emoji/text glyph, or an http(s) image URL. */
  icon?: string;
  /** Lower sorts first (default 0); ties break by registration order. */
  order?: number;
  /** Invoked when the row is clicked (the menu closes first). */
  onSelect: () => void;
}

interface MenuRecord extends MenuItemSpec {
  seq: number;
}

const records = new Map<string, MenuRecord>();
const listeners = new Set<() => void>();
let seqCounter = 0;
// Cached, referentially-stable snapshot for useSyncExternalStore — only
// reassigned when the set actually changes, so unchanged renders bail out.
let snapshot: MenuItemSpec[] = [];

function rebuild(): void {
  snapshot = Array.from(records.values())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.seq - b.seq)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ seq, ...item }) => item);
  listeners.forEach((l) => l());
}

/**
 * Add (or replace, by id) an item in the HUD "More" menu. Safe to call
 * before or after world init — the menu re-renders live.
 */
export function registerMenuItem(item: MenuItemSpec): void {
  if (!item || !item.id || typeof item.onSelect !== 'function') {
    console.warn('[XRPublisher] registerMenuItem requires { id, label, onSelect }');
    return;
  }
  records.set(item.id, { ...item, seq: seqCounter++ });
  rebuild();
}

export function unregisterMenuItem(id: string): void {
  if (records.delete(id)) rebuild();
}

/** Subscribe to menu changes (for useSyncExternalStore). */
export function subscribeMenu(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Current items, sorted. Referentially stable until the set changes. */
export function getMenuItems(): MenuItemSpec[] {
  return snapshot;
}
