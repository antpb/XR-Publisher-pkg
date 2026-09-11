/// World — top-level simulation state.
///
/// Holds terrain generation state and will later hold
/// entity storage, physics state, and spatial indices
/// for multiplayer.

pub struct World {
    pub terrain: TerrainState,
    // Future:
    // pub entities: EntityStorage,
    // pub physics: PhysicsState,
    // pub spatial_index: SpatialGrid,
}

pub struct TerrainState {
    /// Cached noise generators per seed (to avoid re-seeding).
    seed: String,
}

impl World {
    pub fn new(seed: &str) -> Self {
        World {
            terrain: TerrainState {
                seed: seed.to_string(),
            },
        }
    }

    pub fn seed(&self) -> &str {
        &self.terrain.seed
    }
}
