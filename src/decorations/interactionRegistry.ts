/**
 * Interactable registry — the "E to interact" channel for plugin objects.
 *
 * A decoration (or any plugin-mounted Object3D) registers an interactable
 * entry: a world object, a proximity radius, a prompt string, and an
 * onInteract callback. `InteractableSystem` (in-canvas) finds the nearest
 * registered entry within range of the player each frame and publishes it
 * as the "active" interactable; `InteractableBanner` (DOM overlay) shows the
 * prompt and fires the callback on the E key.
 *
 * Lifecycle is owned by whoever registers (PluginDecorations register/
 * unregister per mounted object, tied to chunk load/unload). The registry is
 * a plain module — no React — so the per-frame proximity loop reads it cheaply.
 */
import type { Object3D } from 'three';

export interface InteractableEntry {
  /** Unique id (PluginDecorations uses the per-object entry key). */
  id: string;
  /** The world object to measure proximity to (world position is sampled). */
  object: Object3D;
  /** Interact radius in world units. Defaults to 4 (the decoration-spec
   *  default) when omitted. */
  radius?: number;
  /** Prompt shown in the banner (e.g. "collect apple"). A FUNCTION prompt is
   *  re-resolved at the proximity loop's ~10Hz cadence, so stateful
   *  interactables can show contextual actions ("Water crops" → "Harvest")
   *  without re-registering — keep it cheap (a map lookup, not work). */
  prompt?: string | (() => string);
  /** Alias for `radius` — the decoration spec spells it this way, and plugin
   *  authors reasonably reuse that spelling here. */
  interactionRadius?: number;
  /** Alias for `prompt` (see `interactionRadius`). */
  interactionPrompt?: string | (() => string);
  /** Fired when the player presses E while this entry is the active one. */
  onInteract: () => void;
}

/** Normalized entry the proximity loop reads — always has radius + prompt. */
export interface ResolvedInteractable {
  id: string;
  object: Object3D;
  radius: number;
  prompt: string | (() => string);
  onInteract: () => void;
}

/** Matches the decoration spec's `interactionRadius` default. */
const DEFAULT_INTERACT_RADIUS = 4;

const entries = new Map<string, ResolvedInteractable>();

export function registerInteractable(entry: InteractableEntry): void {
  if (!entry || !entry.id || !entry.object) {
    console.warn('[XRPublisher] registerInteractable: need { id, object, onInteract }');
    return;
  }
  // Accept BOTH spellings. The decoration spec uses interactionRadius/
  // interactionPrompt while this low-level entry used radius/prompt — a spec
  // written with the decoration names silently produced `radius: undefined`,
  // which fails every `d <= radius` test, so the object was never
  // interactable and nothing said why.
  const radius = [entry.radius, entry.interactionRadius]
    .find((v) => typeof v === 'number' && Number.isFinite(v) && v > 0) ?? DEFAULT_INTERACT_RADIUS;
  const prompt = entry.prompt ?? entry.interactionPrompt ?? entry.id;
  entries.set(entry.id, { id: entry.id, object: entry.object, radius, prompt, onInteract: entry.onInteract });
}

export function unregisterInteractable(id: string): void {
  entries.delete(id);
  if (activeId === id) setActiveInteractable(null, '');
}

export function getInteractables(): Map<string, ResolvedInteractable> {
  return entries;
}

// ── Active-interactable external store (banner subscribes via
//    useSyncExternalStore) ──────────────────────────────────────────────
let activeId: string | null = null;
let activePrompt = '';
// Snapshot is an immutable object so useSyncExternalStore's identity check
// detects changes; null when nothing is in range.
let activeSnapshot: { id: string; prompt: string } | null = null;
const listeners = new Set<() => void>();

export function subscribeActiveInteractable(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getActiveInteractable(): { id: string; prompt: string } | null {
  return activeSnapshot;
}

/** Called by InteractableSystem each detection tick with the nearest in-range
 *  entry (or null). No-op when unchanged so the banner doesn't churn. */
export function setActiveInteractable(id: string | null, prompt: string): void {
  if (id === activeId && prompt === activePrompt) return;
  activeId = id;
  activePrompt = prompt;
  activeSnapshot = id ? { id, prompt } : null;
  for (const cb of listeners) cb();
}

/** Fire the active entry's callback (called by the banner on E). Contained so
 *  one throwing plugin can't break the key handler. */
export function triggerActiveInteractable(): void {
  if (!activeId) return;
  const entry = entries.get(activeId);
  if (!entry) return;
  try {
    entry.onInteract();
  } catch (err) {
    console.warn(`[XRPublisher] interactable "${entry.id}" onInteract threw`, err);
  }
}
