/// ECS scaffolding — establishes patterns for future systems.
///
/// `spatial` is actively used for distance-based send rate tiers.
/// `component` and `entity` are scaffolding for future expansion —
/// feature-gated out of the shipped WASM (nothing references them, and
/// every KB of binary costs ×1.33 in the base64-inlined worker bundle).
/// Enable with `--features ecs-scaffolding` when the ECS work resumes.
#[cfg(feature = "ecs-scaffolding")]
pub mod component;
#[cfg(feature = "ecs-scaffolding")]
pub mod entity;
pub mod spatial;
