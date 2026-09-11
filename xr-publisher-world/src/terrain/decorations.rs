/// Decoration spawn computation — determines placement positions for
/// grass, boulders, trees, shrubs, and flowers based on terrain data.
///
/// All spawn filtering (height, slope, color, noise, density) happens here
/// in WASM, so the main thread only needs to build geometry from the results.

use crate::terrain::noise::SimplexNoise2D;
use crate::util::math::{lerp, map_range, smoothstep};
use crate::util::rng::Alea;

/// Grass spawn: [x, y, z, ...] triplets
pub fn compute_grass_spawns(
    positions: &[f32],
    colors: &[f32],
    segments: usize,
    height_scale: f64,
    seed: &str,
    chunk_x: i32,
    chunk_z: i32,
    biome_density: f64,
    // `is_mobile` is retained on the signature for binding compatibility, but
    // intentionally unused below. Branching on UA here desynchronises the
    // Alea PRNG across clients — mobile consumed fewer random() values and
    // every downstream spawn position drifted, producing the "mobile sees a
    // different world" multiplayer bug. Density stays at the desktop value.
    _is_mobile: bool,
) -> Vec<f32> {
    let mut rng = Alea::new(&format!("{}-grass-{}-{}", seed, chunk_x, chunk_z));
    let vertices_per_side = segments + 1;
    let density_multiplier = 0.35 * biome_density;

    // Simple noise for density variation
    let noise_seed = Alea::new(seed);
    let offset1 = noise_seed.clone_state().next() * 100.0;
    let offset2 = noise_seed.clone_state().next() * 100.0;

    let mut spawns = Vec::new();

    for z in 0..=segments {
        for x in 0..=segments {
            let idx = z * vertices_per_side + x;
            let vi = idx * 3;

            let vx = positions[vi];
            let vy = positions[vi + 1];
            let vz = positions[vi + 2];

            let normalized_height = map_range(vy as f64, -height_scale, height_scale, 0.0, 1.0);

            // Height check
            if normalized_height <= 0.50 || normalized_height >= 0.58 {
                continue;
            }

            // Color check: green channel dominant
            let cr = colors[vi];
            let cg = colors[vi + 1];
            let cb = colors[vi + 2];
            if !(cg > cr * 1.1 && cg > cb * 1.1) {
                continue;
            }

            // Slope check
            let get_height = |gx: i32, gz: i32| -> f32 {
                if gx < 0 || gx > segments as i32 || gz < 0 || gz > segments as i32 {
                    return 0.0;
                }
                positions[(gz as usize * vertices_per_side + gx as usize) * 3 + 1]
            };
            let slope_x = (get_height(x as i32 + 1, z as i32) - get_height(x as i32 - 1, z as i32)).abs();
            let slope_z = (get_height(x as i32, z as i32 + 1) - get_height(x as i32, z as i32 - 1)).abs();
            let slope_mag = ((slope_x * slope_x + slope_z * slope_z) as f64).sqrt();
            if slope_mag >= 6.0 {
                continue;
            }

            // Noise-based density
            let freq = 0.15;
            let noise_val = ((vx as f64 * freq + offset1).sin()
                * (vz as f64 * freq + offset2).cos()
                + (vx as f64 * freq * 2.3 + offset2).sin()
                    * (vz as f64 * freq * 1.7 + offset1).cos()
                + (vx as f64 * freq * 0.5 + offset1 * 2.0).sin()
                    * (vz as f64 * freq * 0.8 + offset2 * 2.0).cos())
                / 3.0;
            let noise_density = (noise_val + 1.0) * 0.5;

            if rng.next() < noise_density * density_multiplier {
                spawns.push(vx);
                spawns.push(vy - 0.35); // ground offset
                spawns.push(vz);
            }
        }
    }

    spawns
}

/// Boulder spawn: [x, y, z, scale, rotX, rotY, rotZ, ...] per boulder (7 floats each)
pub fn compute_boulder_spawns(
    positions: &[f32],
    segments: usize,
    height_scale: f64,
    seed: &str,
    chunk_x: i32,
    chunk_z: i32,
    biome_density: f64,
    // See grass; UA gating is dropped for multiplayer coherence.
    _is_mobile: bool,
) -> Vec<f32> {
    let mut rng = Alea::new(&format!("{}-boulders-{}-{}", seed, chunk_x, chunk_z));
    let vertices_per_side = segments + 1;
    let spawn_chance = 0.03 * biome_density;
    let step = 10usize;

    let mut spawns = Vec::new();

    let mut gz = 0;
    while gz <= segments {
        let mut gx = 0;
        while gx <= segments {
            let idx = gz * vertices_per_side + gx;
            let vi = idx * 3;
            let vx = positions[vi];
            let vy = positions[vi + 1];
            let vz = positions[vi + 2];

            let normalized = (vy as f64 + height_scale) / (height_scale * 2.0);

            if normalized > 0.48 && normalized < 0.58 && rng.next() < spawn_chance {
                let scale = 1.5 + rng.next() * 2.5;
                let rot_x = rng.next() * std::f64::consts::PI;
                let rot_y = rng.next() * std::f64::consts::TAU;
                let rot_z = rng.next() * std::f64::consts::PI;

                spawns.push(vx);
                spawns.push(vy - scale as f32 * 0.5);
                spawns.push(vz);
                spawns.push(scale as f32);
                spawns.push(rot_x as f32);
                spawns.push(rot_y as f32);
                spawns.push(rot_z as f32);
            } else {
                // Consume RNG values to stay deterministic
                let _ = rng.next();
                let _ = rng.next();
                let _ = rng.next();
                let _ = rng.next();
            }

            gx += step;
        }
        gz += step;
    }

    spawns
}

/// Tree spawn: [x, y, z, scale, rotation, isComplex(0/1), treeSeed, ...] per tree (7 floats each)
pub fn compute_tree_spawns(
    positions: &[f32],
    colors: &[f32],
    segments: usize,
    height_scale: f64,
    seed: &str,
    chunk_x: i32,
    chunk_z: i32,
    tree_density: f64,
    // Chunk world size — used to reconstruct world coordinates for the
    // world-continuous forest field (positions[] are chunk-LOCAL, centered
    // on the chunk, so sampling the field at local coords would repeat the
    // same grove pattern in every chunk).
    chunk_width: f64,
    chunk_height: f64,
    // position_y intentionally unused — see note in the spawn push below.
    // Kept on the signature for binding compatibility with the JS caller.
    _position_y: f64,
    // UA gating dropped for multiplayer coherence — see grass.
    _is_mobile: bool,
) -> Vec<f32> {
    let mut rng = Alea::new(&format!("{}-trees-{}-{}", seed, chunk_x, chunk_z));
    // Low-frequency world-space "forest" field: high values are grove cores
    // (tight, many trees), low values are clearings (no trees). Seeded off
    // the world seed and sampled in world space so groves span chunk borders
    // seamlessly instead of clipping to the chunk grid. Trees have no JS
    // fallback (the JS path returns empty spawns), so this WASM-only field
    // carries no parity burden.
    let forest_noise = SimplexNoise2D::new(&format!("{}-forest", seed));
    let vertices_per_side = segments + 1;
    // Finer candidate grid than the old segments/15 — grove cores need
    // placement granularity below the dense spacing (~5.5u) to actually pack.
    let step = (segments / 24).max(1);
    // Peak grove count (default tree_density 0.4 → 18). Clearings fall well
    // below this because the forest field rejects their candidates.
    let max_trees = (45.0 * tree_density).ceil() as usize;

    // Grove scale: ~180u between core and clearing at this frequency.
    const FOREST_FREQ: f64 = 0.0055;
    // Forest field → coverage ramp. Below CLEARING_EDGE: bare meadow.
    const CLEARING_EDGE: f64 = 0.42;
    const GROVE_CORE: f64 = 0.62;
    // Per-tree clearance: tight in grove cores, loose at grove edges.
    const SPACING_DENSE_SQ: f64 = 30.0; // ~5.5u
    const SPACING_SPARSE_SQ: f64 = 144.0; // ~12u

    // Collect candidates with scores
    struct Candidate {
        x: f32,
        y: f32,
        z: f32,
        score: f64,
        spacing_sq: f64,
    }
    let mut candidates = Vec::new();

    let mut gz = 1;
    while gz < segments {
        let mut gx = 1;
        while gx < segments {
            let idx = gz * vertices_per_side + gx;
            let vi = idx * 3;
            let vx = positions[vi];
            let vy = positions[vi + 1];
            let vz = positions[vi + 2];

            let normalized = map_range(vy as f64, -height_scale, height_scale, 0.0, 1.0);
            if normalized <= 0.51 || normalized >= 0.56 {
                gx += step;
                continue;
            }

            // Color check
            let cg = colors[vi + 1];
            let cr = colors[vi];
            let cb = colors[vi + 2];
            if !(cg > cr * 1.1 && cg > cb * 1.1) {
                gx += step;
                continue;
            }

            // Slope check
            let get_h = |x: i32, z: i32| -> f32 {
                if x < 0 || x > segments as i32 || z < 0 || z > segments as i32 {
                    return 0.0;
                }
                positions[(z as usize * vertices_per_side + x as usize) * 3 + 1]
            };
            let sx = (get_h(gx as i32 + 1, gz as i32) - get_h(gx as i32 - 1, gz as i32)).abs();
            let sz = (get_h(gx as i32, gz as i32 + 1) - get_h(gx as i32, gz as i32 - 1)).abs();
            let slope = ((sx * sx + sz * sz) as f64).sqrt();
            if slope > 4.0 {
                gx += step;
                continue;
            }

            // World-space forest coverage — clumps trees into groves with
            // open meadows between (the BotW look), continuous across chunks.
            let world_x = chunk_x as f64 * chunk_width + vx as f64;
            let world_z = chunk_z as f64 * chunk_height + vz as f64;
            let forest = (forest_noise.noise2d(world_x * FOREST_FREQ, world_z * FOREST_FREQ)
                + 1.0)
                * 0.5;
            let coverage = smoothstep(CLEARING_EDGE, GROVE_CORE, forest);
            if coverage <= 0.0 {
                // Clearing — leave it open. (No rng draw here: clearing cells
                // don't influence the placement stream.)
                gx += step;
                continue;
            }

            let spacing_sq = lerp(SPACING_SPARSE_SQ, SPACING_DENSE_SQ, coverage);
            // Favor grove cores, with a little jitter so edges feather.
            let score = coverage * 0.6 + rng.next() * 0.4;
            candidates.push(Candidate { x: vx, y: vy, z: vz, score, spacing_sq });

            gx += step;
        }
        gz += step;
    }

    // Sort by score descending
    candidates.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

    // Greedy placement with spacing
    let mut trees: Vec<(f64, f64)> = Vec::new(); // (x, z) of placed trees
    let mut spawns = Vec::new();

    for c in &candidates {
        if trees.len() >= max_trees {
            break;
        }
        let mut too_close = false;
        for &(tx, tz) in &trees {
            let dx = c.x as f64 - tx;
            let dz = c.z as f64 - tz;
            if dx * dx + dz * dz < c.spacing_sq {
                too_close = true;
                break;
            }
        }
        if too_close {
            continue;
        }

        let scale = 1.2 + rng.next() * 1.4;
        let rotation = rng.next() * std::f64::consts::TAU;
        let is_complex = if rng.next() > 0.6 { 1.0 } else { 0.0 };
        let tree_seed = rng.next() * 1000.0;

        // Chunk-local coordinates. The consuming React component
        // parents its <group> inside a chunk-positioned group that
        // applies (positionX, positionY, positionZ); adding position_y
        // here would double-count the Y offset and send trees floating
        // above the terrain surface. Boulders / shrubs / flowers already
        // emit chunk-local Y; trees now match.
        spawns.push(c.x);
        spawns.push(c.y);
        spawns.push(c.z);
        spawns.push(scale as f32);
        spawns.push(rotation as f32);
        spawns.push(is_complex as f32);
        spawns.push(tree_seed as f32);

        trees.push((c.x as f64, c.z as f64));
    }

    spawns
}

/// Shrub spawn: [x, y, z, scale, rotation, shrubSeed, ...] per shrub (6 floats each)
pub fn compute_shrub_spawns(
    positions: &[f32],
    colors: &[f32],
    segments: usize,
    height_scale: f64,
    seed: &str,
    chunk_x: i32,
    chunk_z: i32,
    shrub_density: f64,
    // UA gating dropped for multiplayer coherence — see grass.
    _is_mobile: bool,
) -> Vec<f32> {
    let mut rng = Alea::new(&format!("{}-shrubs-{}-{}", seed, chunk_x, chunk_z));
    let vertices_per_side = segments + 1;
    let spawn_chance = 0.03 * shrub_density;
    let step = 10usize;

    let mut spawns = Vec::new();

    let mut gz = 0;
    while gz <= segments {
        let mut gx = 0;
        while gx <= segments {
            let idx = gz * vertices_per_side + gx;
            let vi = idx * 3;
            let vx = positions[vi];
            let vy = positions[vi + 1];
            let vz = positions[vi + 2];

            let normalized = map_range(vy as f64, -height_scale, height_scale, 0.0, 1.0);

            // Height + color + density check
            let cg = colors[vi + 1];
            let cr = colors[vi];
            let cb = colors[vi + 2];
            let is_green = cg > cr * 1.1 && cg > cb * 1.1;

            if normalized > 0.50 && normalized < 0.58 && is_green && rng.next() < spawn_chance {
                let scale = 0.8 + rng.next() * 1.2;
                let rotation = rng.next() * std::f64::consts::TAU;
                let shrub_seed = rng.next() * 1000.0;

                spawns.push(vx);
                spawns.push(vy);
                spawns.push(vz);
                spawns.push(scale as f32);
                spawns.push(rotation as f32);
                spawns.push(shrub_seed as f32);
            } else {
                // Keep RNG in sync
                let _ = rng.next();
                let _ = rng.next();
                let _ = rng.next();
            }

            gx += step;
        }
        gz += step;
    }

    spawns
}

/// Flower spawn: [x, y, z, scale, rotation, paletteIdx, flowerSeed, ...] per flower (7 floats each)
pub fn compute_flower_spawns(
    positions: &[f32],
    colors: &[f32],
    segments: usize,
    height_scale: f64,
    seed: &str,
    chunk_x: i32,
    chunk_z: i32,
    flower_density: f64,
    // UA gating dropped for multiplayer coherence — see grass.
    _is_mobile: bool,
) -> Vec<f32> {
    let mut rng = Alea::new(&format!("{}-flowers-{}-{}", seed, chunk_x, chunk_z));
    let vertices_per_side = segments + 1;
    let spawn_chance = 0.05 * flower_density;
    let step = 10usize;
    let num_palettes = 7;

    let mut spawns = Vec::new();

    let mut gz = 0;
    while gz <= segments {
        let mut gx = 0;
        while gx <= segments {
            let idx = gz * vertices_per_side + gx;
            let vi = idx * 3;
            let vx = positions[vi];
            let vy = positions[vi + 1];
            let vz = positions[vi + 2];

            let normalized = map_range(vy as f64, -height_scale, height_scale, 0.0, 1.0);

            let cg = colors[vi + 1];
            let cr = colors[vi];
            let cb = colors[vi + 2];
            let is_green = cg > cr * 1.1 && cg > cb * 1.1;

            if normalized > 0.50 && normalized < 0.56 && is_green && rng.next() < spawn_chance {
                // Cluster: 2-6 flowers
                let cluster_count = 2 + (rng.next() * 4.0).floor() as usize;
                let palette_idx = (rng.next() * num_palettes as f64).floor() as u32;

                for _ in 0..cluster_count {
                    let offset_x = (rng.next() - 0.5) * 2.0;
                    let offset_z = (rng.next() - 0.5) * 2.0;
                    let scale = 0.15 + rng.next() * 0.25;
                    let rotation = rng.next() * std::f64::consts::TAU;
                    let flower_seed = rng.next() * 1000.0;

                    spawns.push(vx + offset_x as f32);
                    spawns.push(vy);
                    spawns.push(vz + offset_z as f32);
                    spawns.push(scale as f32);
                    spawns.push(rotation as f32);
                    spawns.push(palette_idx as f32);
                    spawns.push(flower_seed as f32);
                }
            } else {
                // Keep RNG in sync for determinism
                let _ = rng.next(); // cluster count
                let _ = rng.next(); // palette
            }

            gx += step;
        }
        gz += step;
    }

    spawns
}
