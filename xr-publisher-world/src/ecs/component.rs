/// Component storage — SoA (Structure of Arrays) pattern.
/// Each component type gets its own dense Vec, indexed by EntityId.
///
/// This is the foundation for data-oriented ECS. When we add
/// multiplayer entity sync, components like Position, Velocity,
/// and NetworkState will use this storage.

use super::entity::EntityId;

/// Dense component storage. Maps EntityId → Component value.
/// Uses a sparse-to-dense indirection for cache-friendly iteration.
pub struct ComponentStorage<T> {
    /// Dense array of component values.
    pub data: Vec<T>,
    /// Maps EntityId → index into `data`. None if entity doesn't have this component.
    sparse: Vec<Option<usize>>,
    /// Maps dense index → EntityId (for reverse lookup).
    entities: Vec<EntityId>,
}

impl<T> ComponentStorage<T> {
    pub fn new() -> Self {
        ComponentStorage {
            data: Vec::new(),
            sparse: Vec::new(),
            entities: Vec::new(),
        }
    }

    pub fn insert(&mut self, entity: EntityId, value: T) {
        let eid = entity as usize;
        if eid >= self.sparse.len() {
            self.sparse.resize(eid + 1, None);
        }

        if let Some(idx) = self.sparse[eid] {
            self.data[idx] = value;
        } else {
            let idx = self.data.len();
            self.data.push(value);
            self.entities.push(entity);
            self.sparse[eid] = Some(idx);
        }
    }

    pub fn get(&self, entity: EntityId) -> Option<&T> {
        let eid = entity as usize;
        self.sparse
            .get(eid)
            .and_then(|opt| opt.map(|idx| &self.data[idx]))
    }

    pub fn get_mut(&mut self, entity: EntityId) -> Option<&mut T> {
        let eid = entity as usize;
        self.sparse
            .get(eid)
            .and_then(|opt| opt.map(|idx| &mut self.data[idx]))
    }
}

impl<T> Default for ComponentStorage<T> {
    fn default() -> Self {
        Self::new()
    }
}
