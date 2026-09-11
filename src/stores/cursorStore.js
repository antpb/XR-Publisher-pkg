import { create } from 'zustand';
import { Vector3 } from 'three';

const _storePosition = new Vector3();
const _storeNormal = new Vector3(0, 1, 0);

export const useCursorStore = create((set, get) => ({
  position: _storePosition,
  normal: _storeNormal,
  visible: false,
  focusedContext: null,
  hoveredNPC: null,

  setPosition: (x, y, z) => {
    if (_storePosition.x !== x || _storePosition.y !== y || _storePosition.z !== z) {
      _storePosition.set(x, y, z);
    }
  },

  setNormal: (x, y, z) => {
    if (_storeNormal.x !== x || _storeNormal.y !== y || _storeNormal.z !== z) {
      _storeNormal.set(x, y, z);
    }
  },

  setVisible: (visible) => {
    if (get().visible !== visible) {
      set({ visible });
    }
  },

  setFocusedContext: (context) => {
    set({ focusedContext: context });
  },

  setHoveredNPC: (npc) => {
    set({ hoveredNPC: npc });
  },

  batchUpdate: (position, normal, visible, context) => {
    const state = get();
    const updates = {};
    let hasChanges = false;

    if (position && (_storePosition.x !== position.x || _storePosition.y !== position.y || _storePosition.z !== position.z)) {
      _storePosition.copy(position);
    }

    if (normal && (_storeNormal.x !== normal.x || _storeNormal.y !== normal.y || _storeNormal.z !== normal.z)) {
      _storeNormal.copy(normal);
    }

    if (visible !== undefined && state.visible !== visible) {
      updates.visible = visible;
      hasChanges = true;
    }

    if (context !== undefined && state.focusedContext !== context) {
      updates.focusedContext = context;
      hasChanges = true;
    }

    if (hasChanges) {
      set(updates);
    }
  }
}));
