import type { StoreApi, UseBoundStore } from 'zustand';

export interface InteractionTarget {
  type: 'npc' | 'object';
  id: string;
  name?: string;
  position?: [number, number, number];
}

export interface InteractionState {
  isInteracting: boolean;
  interactingWith: InteractionTarget | null;
  startInteraction: (target: InteractionTarget) => void;
  stopInteraction: () => void;
  isInteractingWith: (type: string) => boolean;
  isInteractingWithId: (id: string) => boolean;
}

declare const useInteractionStore: UseBoundStore<StoreApi<InteractionState>>;
export default useInteractionStore;
