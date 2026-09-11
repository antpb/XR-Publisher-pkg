import { create } from 'zustand';

const useInteractionStore = create((set, get) => ({
  // Current interaction state
  isInteracting: false,
  interactingWith: null, // { type: 'npc' | 'object', id: string, name: string, position: [x, y, z] }
  
  // Actions
  startInteraction: (target) => {
    set({
      isInteracting: true,
      interactingWith: target
    });
  },
  
  stopInteraction: () => {
    set({
      isInteracting: false,
      interactingWith: null
    });
  },
  
  // Helper to check if interacting with specific type
  isInteractingWith: (type) => {
    const { isInteracting, interactingWith } = get();
    return isInteracting && interactingWith?.type === type;
  },
  
  // Helper to check if interacting with specific ID
  isInteractingWithId: (id) => {
    const { isInteracting, interactingWith } = get();
    return isInteracting && interactingWith?.id === id;
  }
}));

export default useInteractionStore;
