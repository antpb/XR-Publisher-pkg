/// Mountain system — procedural mountain placement and terrain influence.
/// Port of the mountain-related functions from worldHelpers.ts.
///
/// Two paths coexist here:
///
/// 1. **Internal Rust generator** (`generate_mountains_for_region` +
///    `get_mountains_near_chunk` + `get_mountain_base_influence`). A
///    stubbed / simplified port of the JS mountain system. Its cavern
///    representation is a single radial ramp per mountain — does NOT
///    match JS, which has per-entrance directional ramps. This path is
///    used only when the caller passes no mountain list.
///
/// 2. **JS-mirror path** (`JsMountainFeature` + `JsCavernNetwork` +
///    `get_mountain_base_influence_js`). Consumes the exact mountain
///    list JS builds in `worldHelpers.ts:getMountainsNearChunk`,
///    including per-entrance `outwardDir`. The base-influence formula
///    here is a bit-identical transcription of the JS
///    `getMountainBaseInfluence` so WebGPU (WASM) and WebGL
///    (main-thread JS) clients produce the same terrain — which is the
///    point of this module's existence.
///
/// The runtime always passes the JS mountain list through, so path 2
/// is the live path. Path 1 is kept for non-JS callers (e.g. future
/// Rust-only tests) and `skip_mountains = true` (editor mode).

use crate::terrain::biome;
use crate::util::rng::Alea;
use serde::Deserialize;
use std::collections::HashMap;

const REGION_SIZE: f64 = 500.0;

#[derive(Debug, Clone)]
pub struct MountainFeature {
    pub id: String,
    pub world_x: f64,
    pub world_z: f64,
    pub base_radius: f64,
    pub peak_height: f64,
    pub shape: MountainShape,
    pub has_cavern: bool,
    // Cavern ramp data (simplified)
    pub ramp_x: f64,
    pub ramp_z: f64,
    pub ramp_angle: f64,
}

#[derive(Debug, Clone, Copy)]
pub enum MountainShape {
    Conical,
    Ridged,
    Mesa,
    Volcanic,
}

impl MountainShape {
    /// Parse the JS `MountainShape` string ('conical' | 'ridged' | 'mesa' |
    /// 'volcanic'). Matches the `selectShape` output in worldHelpers.ts.
    /// Defaults to Conical for unknown strings (JS `getMountainProfile`
    /// likewise falls through to the conical profile).
    pub fn from_js(s: &str) -> MountainShape {
        match s {
            "ridged" => MountainShape::Ridged,
            "mesa" => MountainShape::Mesa,
            "volcanic" => MountainShape::Volcanic,
            _ => MountainShape::Conical,
        }
    }
}

use std::cell::RefCell;

thread_local! {
    static REGION_CACHE: RefCell<HashMap<String, Vec<MountainFeature>>> = RefCell::new(HashMap::new());
}

/// Generate mountains for a region (cached).
pub fn generate_mountains_for_region(
    region_x: i32,
    region_z: i32,
    seed: &str,
) -> Vec<MountainFeature> {
    let key = format!("{},{},{}", region_x, region_z, seed);

    // Check cache
    let cached = REGION_CACHE.with(|c| c.borrow().get(&key).cloned());
    if let Some(cached) = cached {
        return cached;
    }

    let mut rng = Alea::new(&format!("{}-mountains-{}-{}", seed, region_x, region_z));
    let mut mountains = Vec::new();

    let region_world_x = region_x as f64 * REGION_SIZE;
    let region_world_z = region_z as f64 * REGION_SIZE;

    // Try to place 2-4 mountains per region
    let num_candidates = 2 + (rng.next() * 3.0) as usize;

    for c in 0..num_candidates {
        let x = region_world_x + rng.next() * REGION_SIZE;
        let z = region_world_z + rng.next() * REGION_SIZE;

        // Only place in mountain/default biomes
        let biome_id = biome::get_biome_at(x, z, seed);
        match biome_id {
            biome::BiomeId::Mountains | biome::BiomeId::Default => {}
            _ => continue,
        }

        let base_radius = 50.0 + rng.next() * 70.0; // 50-120
        let peak_height = 35.0 + rng.next() * 55.0; // 35-90

        let shape_roll = rng.next();
        let shape = if shape_roll < 0.4 {
            MountainShape::Conical
        } else if shape_roll < 0.65 {
            MountainShape::Ridged
        } else if shape_roll < 0.85 {
            MountainShape::Mesa
        } else {
            MountainShape::Volcanic
        };

        let has_cavern = rng.next() < 0.3;
        let ramp_angle = rng.next() * std::f64::consts::TAU;

        mountains.push(MountainFeature {
            id: format!("mt-{}-{}-{}", region_x, region_z, c),
            world_x: x,
            world_z: z,
            base_radius,
            peak_height,
            shape,
            has_cavern,
            ramp_x: x + ramp_angle.cos() * base_radius * 0.8,
            ramp_z: z + ramp_angle.sin() * base_radius * 0.8,
            ramp_angle,
        });
    }

    REGION_CACHE.with(|c| c.borrow_mut().insert(key, mountains.clone()));
    mountains
}

/// Find all mountains near a chunk within search_radius.
pub fn get_mountains_near_chunk(
    grid_x: i32,
    grid_z: i32,
    chunk_width: f64,
    chunk_height: f64,
    seed: &str,
    search_radius: f64,
) -> Vec<MountainFeature> {
    let center_x = grid_x as f64 * chunk_width + chunk_width / 2.0;
    let center_z = grid_z as f64 * chunk_height + chunk_height / 2.0;

    let min_region_x = ((center_x - search_radius) / REGION_SIZE).floor() as i32;
    let max_region_x = ((center_x + search_radius) / REGION_SIZE).ceil() as i32;
    let min_region_z = ((center_z - search_radius) / REGION_SIZE).floor() as i32;
    let max_region_z = ((center_z + search_radius) / REGION_SIZE).ceil() as i32;

    let mut nearby = Vec::new();
    let mut seen = std::collections::HashSet::new();

    for rx in min_region_x..=max_region_x {
        for rz in min_region_z..=max_region_z {
            let region_mountains = generate_mountains_for_region(rx, rz, seed);
            for mt in region_mountains {
                if seen.contains(&mt.id) {
                    continue;
                }
                let dx = mt.world_x - center_x;
                let dz = mt.world_z - center_z;
                if (dx * dx + dz * dz).sqrt() < search_radius + mt.base_radius {
                    seen.insert(mt.id.clone());
                    nearby.push(mt);
                }
            }
        }
    }

    nearby
}

/// Calculate the mountain base influence on terrain height at (world_x, world_z).
/// Returns a height offset to add to the terrain.
pub fn get_mountain_base_influence(
    world_x: f64,
    world_z: f64,
    mountains: &[MountainFeature],
) -> f64 {
    let mut total_influence = 0.0;

    for mt in mountains {
        let dx = world_x - mt.world_x;
        let dz = world_z - mt.world_z;
        let dist = (dx * dx + dz * dz).sqrt();

        // Inner suppression: push terrain down near mountain center
        let inner_radius = mt.base_radius * 0.9;
        if dist < inner_radius {
            let t = 1.0 - dist / inner_radius;
            let suppression = t * t * (-mt.peak_height * 0.3);
            total_influence += suppression;
        }

        // Outer influence: smooth terrain rise leading to mountain
        let outer_radius = mt.base_radius * 1.8;
        if dist < outer_radius && dist >= inner_radius {
            let t = 1.0 - (dist - inner_radius) / (outer_radius - inner_radius);
            let rise = t * t * (mt.peak_height * 0.15);
            total_influence += rise;
        }

        // Cavern entrance ramp
        if mt.has_cavern {
            let ramp_dx = world_x - mt.ramp_x;
            let ramp_dz = world_z - mt.ramp_z;
            let ramp_dist = (ramp_dx * ramp_dx + ramp_dz * ramp_dz).sqrt();
            let ramp_radius = mt.base_radius * 0.3;
            if ramp_dist < ramp_radius {
                let t = 1.0 - ramp_dist / ramp_radius;
                total_influence += t * t * (-8.0);
            }
        }
    }

    total_influence
}

// ─────────────────────────────────────────────────────────────────────
// JS-mirror path
// Structs below deserialize the `MountainFeature` / `CavernNetwork` /
// `CavernNode` shapes produced by `worldHelpers.ts` after structured
// clone to the worker. Field names match JS camelCase via serde rename.
// Vector3 instances cross the clone boundary as plain `{x,y,z}` objects;
// `Vec3Plain` mirrors that shape.
// ─────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct Vec3Plain {
    pub x: f64,
    #[serde(default)]
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JsCavernNode {
    #[serde(rename = "position")]
    pub position: Vec3Plain,
    pub radius: f64,
    #[serde(rename = "surfacePosition", default)]
    pub surface_position: Option<Vec3Plain>,
    #[serde(rename = "outwardDir", default)]
    pub outward_dir: Option<Vec3Plain>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JsCavernNetwork {
    pub entrances: Vec<JsCavernNode>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JsMountainFeature {
    #[serde(rename = "worldX")]
    pub world_x: f64,
    #[serde(rename = "worldZ")]
    pub world_z: f64,
    #[serde(rename = "baseRadius")]
    pub base_radius: f64,
    #[serde(rename = "peakHeight")]
    pub peak_height: f64,
    #[serde(default)]
    pub cavern: Option<JsCavernNetwork>,
}

/// Match of `worldHelpers.ts:getMountainBaseInfluence` (lines 793–839).
///
/// Three additive contributions per mountain:
///   1. Inner suppression within `baseRadius × 0.85`
///      (pulls the surface down to form the mountain's cradle).
///   2. Outer rise within `baseRadius × 1.8` (smooth foothills).
///   3. Per-entrance directional ramp: projects the sample onto the
///      entrance's `outwardDir` and deflates a soft channel along that
///      direction — this is the shape that produces walkable ramps
///      into caverns instead of the circular craters the old Rust
///      radial version produced.
pub fn get_mountain_base_influence_js(
    world_x: f64,
    world_z: f64,
    mountains: &[JsMountainFeature],
) -> f64 {
    let mut influence = 0.0;

    for m in mountains {
        let dx = world_x - m.world_x;
        let dz = world_z - m.world_z;
        let dist = (dx * dx + dz * dz).sqrt();

        // 1. Inner suppression — radius × 0.85, (1 - t)² weight scaled by
        //    peakHeight × 1.5. Sign is negative (pushes terrain down).
        let inner_r = m.base_radius * 0.85;
        if dist < inner_r {
            let t = dist / inner_r;
            let suppress = (1.0 - t) * (1.0 - t);
            influence -= suppress * m.peak_height * 1.5;
        }

        // 2. Outer rise — radius × 1.8, (1 - t)³ weight scaled by
        //    peakHeight × 0.25. Adds the gentle foothill ring.
        let max_dist = m.base_radius * 1.8;
        if dist < max_dist {
            let t = dist / max_dist;
            let falloff = (1.0 - t) * (1.0 - t) * (1.0 - t);
            influence += falloff * m.peak_height * 0.25;
        }

        // 3. Cavern entrance ramp — one per entrance, independent blends.
        //    Uses surfacePosition (falls back to position) and outwardDir.
        if let Some(cavern) = &m.cavern {
            for entrance in &cavern.entrances {
                let od = match &entrance.outward_dir {
                    Some(v) => v,
                    None => continue,
                };
                let sp = entrance.surface_position.as_ref().unwrap_or(&entrance.position);

                // Entrance surface position in world space.
                let ewx = m.world_x + sp.x;
                let ewz = m.world_z + sp.z;
                let to_x = world_x - ewx;
                let to_z = world_z - ewz;

                // Project onto outwardDir (unit vector) to get along/perp.
                let along = to_x * od.x + to_z * od.z;
                let perp_x = to_x - along * od.x;
                let perp_z = to_z - along * od.z;
                let perp_dist = (perp_x * perp_x + perp_z * perp_z).sqrt();

                let ramp_length = entrance.radius * 4.0;
                let ramp_width = entrance.radius * 1.5;

                // JS admits the ramp starting at `-radius` along the
                // inward direction (so the ramp begins slightly inside
                // the mountain). Same tolerance here.
                if along > -entrance.radius && along < ramp_length && perp_dist < ramp_width {
                    let along01 = along.max(0.0) / ramp_length;
                    let perp01 = perp_dist / ramp_width;
                    let ramp_blend = (1.0 - along01) * (1.0 - perp01 * perp01);
                    influence -= ramp_blend * m.peak_height * 0.15;
                }
            }
        }
    }

    influence
}
