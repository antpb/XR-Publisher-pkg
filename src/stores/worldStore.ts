import { create } from 'zustand';
import {
  type MountainFeature,
  getMountainsNearChunk,
  isInsideCavern,
} from '../components/core/front/worldHelpers';

interface WorldState {
  activeMountains: Map<string, MountainFeature>;
  activeMountainsArray: MountainFeature[];

  playerEnvironment: 'surface' | 'cavern' | 'transition';
  currentCavernMountainId: string | null;
  terrainVisible: boolean;
  skyVisible: boolean;
  globalWaterVisible: boolean;

  updateMountainsForView: (
    gridX: number,
    gridZ: number,
    chunkWidth: number,
    chunkHeight: number,
    seed: string
  ) => void;
  updatePlayerEnvironment: (
    px: number,
    py: number,
    pz: number,
    terrainPosY: number
  ) => void;
}

const useWorldStore = create<WorldState>((set, get) => ({
  activeMountains: new Map(),
  activeMountainsArray: [],

  playerEnvironment: 'surface',
  currentCavernMountainId: null,
  terrainVisible: true,
  skyVisible: true,
  globalWaterVisible: true,

  updateMountainsForView: (gridX, gridZ, chunkWidth, chunkHeight, seed) => {
    const nearby = getMountainsNearChunk(gridX, gridZ, chunkWidth, chunkHeight, seed, 400);
    const newMap = new Map<string, MountainFeature>();
    for (const m of nearby) {
      newMap.set(m.id, m);
    }

    const current = get().activeMountains;
    const needsUpdate =
      newMap.size !== current.size ||
      [...newMap.keys()].some((k) => !current.has(k));

    if (needsUpdate) {
      set({
        activeMountains: newMap,
        activeMountainsArray: Array.from(newMap.values()),
      });
    }
  },

  updatePlayerEnvironment: (px, py, pz, terrainPosY) => {
    const mountains = get().activeMountainsArray;
    const result = isInsideCavern(px, py, pz, mountains, terrainPosY);

    let newEnv: 'surface' | 'cavern' | 'transition';
    if (result.inside) newEnv = 'cavern';
    else if (result.transition) newEnv = 'transition';
    else newEnv = 'surface';

    const prevEnv = get().playerEnvironment;

    // A LEGITIMATE cavern entry always passes the entrance 'transition' zone
    // first (the entrance sphere is 3× the node radius and covers the mouth).
    // A direct surface→cavern jump means a mountain STREAMED IN AROUND the
    // player (its collider not yet cooked, so the flight path phases through
    // the shell) — honoring it would unmount the ENTIRE terrain/sky/water
    // ("world vanishes while flying past a mountain"). Ignore the flip; the
    // player exits the node sphere within a few frames and stays 'surface'.
    if (newEnv === 'cavern' && prevEnv === 'surface') {
      return;
    }

    if (newEnv !== prevEnv) {
      set({
        playerEnvironment: newEnv,
        currentCavernMountainId: result.mountainId,
        terrainVisible: newEnv === 'surface' || newEnv === 'transition',
        skyVisible: newEnv === 'surface' || newEnv === 'transition',
        globalWaterVisible: newEnv === 'surface' || newEnv === 'transition',
      });
    }
  },
}));

export default useWorldStore;
