/// Entity ID — a simple u32 index.
pub type EntityId = u32;

/// Allocates sequential entity IDs.
pub struct EntityAllocator {
    next: EntityId,
}

impl EntityAllocator {
    pub fn new() -> Self {
        EntityAllocator { next: 0 }
    }

    pub fn allocate(&mut self) -> EntityId {
        let id = self.next;
        self.next += 1;
        id
    }
}

impl Default for EntityAllocator {
    fn default() -> Self {
        Self::new()
    }
}
