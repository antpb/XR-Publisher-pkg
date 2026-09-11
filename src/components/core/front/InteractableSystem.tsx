/**
 * InteractableSystem — per-frame proximity detection for plugin interactables.
 *
 * Mounted once inside the world (both renderer branches). Each detection tick
 * it finds the registered interactable nearest the player within its radius
 * and publishes it as the active one (interactionRegistry → InteractableBanner
 * shows the prompt, the E key fires onInteract).
 *
 * NPC and vehicle interactions take priority — if WorldCursor reports a hovered
 * NPC or rideable, no interactable is activated (E is theirs). The active
 * interactable is also mirrored to `window.worldCursorAPI.hoveredInteractable`
 * so InteractionMenuSystem's E gate doesn't also open the world-action menu.
 */
import { useRef, type ReactElement } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { getInteractables, setActiveInteractable } from '../../../decorations/interactionRegistry';
import { getDialog } from '../../../decorations/pluginDialog';

const _player = new Vector3();
const _wp = new Vector3();

export function InteractableSystem(): ReactElement | null {
  const { scene, camera } = useThree();
  const tickRef = useRef(0);

  useFrame(() => {
    // ~10Hz — proximity prompts don't need per-frame precision and this walks
    // the registry + samples world positions.
    tickRef.current = (tickRef.current + 1) % 6;
    if (tickRef.current !== 0) return;

    const reg = getInteractables();
    // A dialog is open — suppress the prompt so E doesn't re-fire the object
    // (and the player's attention is on the modal).
    if (reg.size === 0 || getDialog()) {
      setActiveInteractable(null, '');
      return;
    }

    // NPC / vehicle win the E key — don't compete.
    const wc = typeof window !== 'undefined' ? (window as any).worldCursorAPI : undefined;
    if (wc?.hoveredNPC || wc?.hoveredRideable) {
      setActiveInteractable(null, '');
      if (wc) wc.hoveredInteractable = null;
      return;
    }

    // Player position: the avatar body ('playerOne'), falling back to camera.
    const avatar = scene.getObjectByName('playerOne');
    if (avatar) avatar.getWorldPosition(_player);
    else camera.getWorldPosition(_player);

    let bestId: string | null = null;
    let bestPrompt = '';
    let bestDist = Infinity;
    for (const entry of reg.values()) {
      entry.object.getWorldPosition(_wp);
      const d = _wp.distanceTo(_player);
      if (d <= entry.radius && d < bestDist) {
        bestDist = d;
        bestId = entry.id;
        // Function prompts re-resolve at this ~10Hz cadence — a STATEFUL
        // interactable ("Water crops" → "Harvest") republishes automatically
        // (setActiveInteractable no-ops on unchanged id+prompt). Keep prompt
        // functions cheap; a throw falls back to the entry id.
        if (typeof entry.prompt === 'function') {
          try { bestPrompt = entry.prompt(); } catch { bestPrompt = entry.id; }
        } else {
          bestPrompt = entry.prompt;
        }
      }
    }

    setActiveInteractable(bestId, bestPrompt);
    if (wc) wc.hoveredInteractable = bestId ? { id: bestId } : null;
  });

  return null;
}
