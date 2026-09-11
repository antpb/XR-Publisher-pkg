/**
 * InteractableBanner — DOM overlay "Press E" prompt for plugin interactables.
 *
 * Subscribes to the interaction registry's active-entry store (fed by
 * InteractableSystem's proximity loop) and shows a centred prompt when an
 * interactable is in range. The E key fires the active entry's callback,
 * unless an NPC chat is open (interactionStore). On mobile there's no keyboard
 * — the joystick's button 3 (labelled "E", see MobileControls) dispatches a
 * synthetic KeyE through Player.jsx, which this same handler receives.
 */
import React, { useEffect, useSyncExternalStore } from 'react';
import {
  subscribeActiveInteractable,
  getActiveInteractable,
  triggerActiveInteractable,
} from '../decorations/interactionRegistry';
import useInteractionStore from '../stores/interactionStore';

export function InteractableBanner() {
  const active = useSyncExternalStore(subscribeActiveInteractable, getActiveInteractable);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;
      // Don't collect while an NPC chat is open (E is the chat's).
      if (useInteractionStore.getState().isInteracting) return;
      // Only act when something is in range.
      if (!getActiveInteractable()) return;
      e.preventDefault();
      triggerActiveInteractable();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'fixed',
        // Above the avatar, not on it: the third-person avatar occupies the
        // middle of the screen, and a dead-center banner sat right on its
        // head — you could never see your character while a prompt was up.
        // ~30% keeps it in the natural eye path but clear of the avatar at
        // default camera distance.
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '10px 16px',
        background: 'rgba(15, 15, 20, 0.82)',
        color: '#f5f5f7',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 120,
        whiteSpace: 'nowrap',
      }}
    >
      <kbd
        style={{
          display: 'inline-block',
          minWidth: '18px',
          padding: '1px 6px',
          marginRight: '8px',
          background: 'rgba(255,255,255,0.14)',
          border: '1px solid rgba(255,255,255,0.28)',
          borderRadius: '5px',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        E
      </kbd>
      {active.prompt || 'interact'}
    </div>
  );
}
