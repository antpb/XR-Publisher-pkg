import { create } from 'zustand';
import { BufferGeometry } from 'three';

interface TerrainChunk {
  gridX: number;
  gridZ: number;
  key: string;
}

interface TerrainChunkStore {
  chunks: Map<string, TerrainChunk>;
  chunksArray: TerrainChunk[];
  decorationsEnabled: boolean;
  waterCenterX: number;
  waterCenterZ: number;
  geometries: Map<string, BufferGeometry>;
  terrainSeed: string;
  isWet: boolean;
  // When false, terrain chunks skip their (synchronously-cooked) trimesh
  // collider. Set false while the player is flying high above the terrain —
  // they can't touch ground there, so cooking a collider per streamed chunk
  // is wasted work that tears frames. Flipped back true as the player nears
  // the ground (or stops flying) so there's always something to land on.
  collidersActive: boolean;
  // Per-chunk decoration phase: 0=none, 1=grass+boulders, 2=all
  // Stored in Zustand so child DecorationGate components can subscribe
  // without causing parent terrain component re-renders
  decorationPhases: Record<string, number>;

  batchUpdate: (adds: TerrainChunk[], removes: string[]) => void;
  setDecorationsEnabled: (enabled: boolean) => void;
  setWaterCenter: (x: number, z: number) => void;
  registerGeometry: (key: string, geometry: BufferGeometry) => void;
  getGeometry: (key: string) => BufferGeometry | undefined;
  setTerrainSeed: (seed: string) => void;
  setIsWet: (wet: boolean) => void;
  setCollidersActive: (active: boolean) => void;
  setDecorationPhase: (key: string, phase: number) => void;
  removeDecorationPhase: (key: string) => void;
}

export const useTerrainChunkStore = create<TerrainChunkStore>((set, get) => ({
  chunks: new Map(),
  chunksArray: [],
  decorationsEnabled: false,
  waterCenterX: 0,
  waterCenterZ: 0,
  geometries: new Map(),
  terrainSeed: '',
  isWet: false,
  collidersActive: true,
  decorationPhases: {},
  
  batchUpdate: (adds, removes) => {
    set((state) => {
      // Skip update if nothing to do
      if (adds.length === 0 && removes.length === 0) {
        return state;
      }
      
      const newChunks = new Map(state.chunks);
      const newGeometries = new Map(state.geometries);
      
      // Process removes first.
      // NOTE the key shapes differ: chunk records use 'terrain-X-Z'
      // (InfiniteTerrain) while geometries register under the MESH name
      // 'terrain-chunk-X-Z' (ProceduralTerrain[WebGL] geoKey, used for
      // neighbor edge-blending). Deleting only `key` here never matched a
      // geometry entry, so the map retained every visited chunk's full
      // BufferGeometry (positions+colors+normals+index, ~MBs each) for
      // the life of the tab — the "roam for a while → GBs of heap" leak.
      removes.forEach(key => {
        newChunks.delete(key);
        newGeometries.delete(key);
        newGeometries.delete(key.replace(/^terrain-/, 'terrain-chunk-'));
      });
      
      // Then adds
      adds.forEach(chunk => {
        if (!newChunks.has(chunk.key)) {
          newChunks.set(chunk.key, chunk);
        }
      });
      
      // Update cached array
      return { 
        chunks: newChunks,
        chunksArray: Array.from(newChunks.values()),
        geometries: newGeometries
      };
    });
  },
  
  setDecorationsEnabled: (enabled) => set({ decorationsEnabled: enabled }),
  
  setWaterCenter: (x, z) => set({ waterCenterX: x, waterCenterZ: z }),
  
  registerGeometry: (key, geometry) => {
    set((state) => {
      const newGeometries = new Map(state.geometries);
      newGeometries.set(key, geometry);
      return { geometries: newGeometries };
    });
  },
  
  getGeometry: (key) => {
    return get().geometries.get(key);
  },

  setTerrainSeed: (seed) => set({ terrainSeed: seed }),
  setIsWet: (wet) => set({ isWet: wet }),
  setCollidersActive: (active) => set((state) => (state.collidersActive === active ? state : { collidersActive: active })),

  setDecorationPhase: (key, phase) => {
    set((state) => ({
      decorationPhases: { ...state.decorationPhases, [key]: phase }
    }));
  },

  removeDecorationPhase: (key) => {
    set((state) => {
      const { [key]: _, ...rest } = state.decorationPhases;
      return { decorationPhases: rest };
    });
  },
}));

