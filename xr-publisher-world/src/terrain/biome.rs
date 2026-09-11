/// Biome system — determines terrain height multipliers and colors.
/// Port of biomeHelpers.ts.
///
/// TODO: Full port of biome weight calculation, terrain colors,
/// and height multipliers. For now, provides stub implementations
/// that will be filled in when wiring WASM into the worker.

use crate::terrain::noise::SimplexNoise2D;
use crate::util::math::smoothstep;
use std::cell::RefCell;
use std::rc::Rc;

const ELEV_FREQ: f64 = 0.0008;
const MOIST_FREQ: f64 = 0.001;

/// Per-seed biome noise set, cached. `SimplexNoise2D::new` builds an Alea
/// PRNG + permutation table — constructing it PER CALL made the per-vertex
/// biome path dominate `generate_terrain` (~278ms/chunk measured; 5.7ms with
/// the biome path skipped — the 300ms+ worker stalls while flying). The JS
/// twin has cached these since day one (`noiseCache` in biomeHelpers.ts).
///
/// Construction is a pure function of the seed string, so cached instances
/// return bit-identical values — WASM/JS parity is unaffected. WASM is
/// single-threaded; `thread_local` is effectively a global. Single entry:
/// a session generates against ONE world seed (tests that switch seeds just
/// pay a rebuild).
struct BiomeNoises {
    elev: SimplexNoise2D,
    moist: SimplexNoise2D,
    ocean: SimplexNoise2D,
}

thread_local! {
    static BIOME_NOISE_CACHE: RefCell<Option<(String, Rc<BiomeNoises>)>> = const { RefCell::new(None) };
}

fn biome_noises(seed: &str) -> Rc<BiomeNoises> {
    BIOME_NOISE_CACHE.with(|c| {
        let mut slot = c.borrow_mut();
        if let Some((cached_seed, noises)) = slot.as_ref() {
            if cached_seed == seed {
                return Rc::clone(noises);
            }
        }
        let noises = Rc::new(BiomeNoises {
            elev: SimplexNoise2D::new(&format!("{}-biome-elev", seed)),
            moist: SimplexNoise2D::new(&format!("{}-biome-moist", seed)),
            ocean: SimplexNoise2D::new(&format!("{}-ocean", seed)),
        });
        *slot = Some((seed.to_string(), Rc::clone(&noises)));
        noises
    })
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum BiomeId {
    Plains,
    Mountains,
    Wetlands,
    Buildable,
    Default,
}

pub struct BiomeParams {
    pub height_multiplier: f64,
    pub grass_density: f64,
    pub boulder_density: f64,
    pub tree_density: f64,
    pub shrub_density: f64,
    pub flower_density: f64,
}

impl BiomeId {
    pub fn params(&self) -> BiomeParams {
        match self {
            BiomeId::Mountains => BiomeParams {
                height_multiplier: 1.6,
                grass_density: 0.3,
                boulder_density: 1.5,
                tree_density: 0.0,
                shrub_density: 0.0,
                flower_density: 0.0,
            },
            BiomeId::Wetlands => BiomeParams {
                height_multiplier: 0.4,
                grass_density: 0.6,
                boulder_density: 0.2,
                tree_density: 0.3,
                shrub_density: 0.5,
                flower_density: 0.8,
            },
            BiomeId::Buildable => BiomeParams {
                height_multiplier: 0.12,
                grass_density: 0.8,
                boulder_density: 0.05,
                tree_density: 0.1,
                shrub_density: 0.15,
                flower_density: 0.3,
            },
            BiomeId::Plains => BiomeParams {
                height_multiplier: 0.6,
                grass_density: 1.0,
                boulder_density: 0.3,
                tree_density: 0.7,
                shrub_density: 0.6,
                flower_density: 1.0,
            },
            BiomeId::Default => BiomeParams {
                height_multiplier: 1.0,
                grass_density: 0.8,
                boulder_density: 0.5,
                tree_density: 0.5,
                shrub_density: 0.4,
                flower_density: 0.5,
            },
        }
    }
}

/// Sample biome noise at a world position.
///
/// Seed strings and the `+1000` Y offset on moisture MUST match the JS
/// implementation in `biomeHelpers.ts` exactly. These two clients run the
/// same simplex-noise algorithm, so identical seeds + identical sample
/// coordinates produce identical values — which is what keeps WebGPU
/// (WASM) and WebGL (main-thread fallback) biome maps matching.
pub fn sample_biome_noise(x: f64, z: f64, seed: &str) -> (f64, f64) {
    let noises = biome_noises(seed);

    let elevation = noises.elev.noise2d(x * ELEV_FREQ, z * ELEV_FREQ);
    // JS adds the +1000 offset to BOTH axes (biomeHelpers.ts) — an earlier
    // port missed it on X, silently desyncing WASM moisture from the
    // main-thread JS biome map.
    let moisture = noises.moist.noise2d(x * MOIST_FREQ + 1000.0, z * MOIST_FREQ + 1000.0);

    (elevation, moisture)
}

/// Get the biome at a world position (discrete selection).
pub fn get_biome_at(x: f64, z: f64, seed: &str) -> BiomeId {
    let (elevation, moisture) = sample_biome_noise(x, z, seed);

    if elevation > 0.35 {
        BiomeId::Mountains
    } else if elevation < -0.25 && moisture > 0.3 {
        BiomeId::Wetlands
    } else if elevation.abs() < 0.15 && moisture < -0.3 {
        BiomeId::Buildable
    } else if elevation < -0.2 {
        BiomeId::Plains
    } else {
        BiomeId::Default
    }
}

/// Get smooth biome weights at a world position.
/// Returns weights for [mountains, wetlands, buildable, plains, default].
pub fn get_biome_weights(x: f64, z: f64, seed: &str) -> [f64; 5] {
    let (elevation, moisture) = sample_biome_noise(x, z, seed);

    let mountain_w = smoothstep(0.25, 0.45, elevation);
    let wetland_w = smoothstep(-0.15, -0.35, elevation) * smoothstep(0.2, 0.4, moisture);
    let buildable_w = (1.0 - smoothstep(0.05, 0.25, elevation.abs()))
        * smoothstep(-0.2, -0.4, moisture);
    let plains_w = smoothstep(-0.1, -0.3, elevation) * (1.0 - wetland_w) * (1.0 - buildable_w);
    let default_w = (1.0 - mountain_w) * (1.0 - wetland_w) * (1.0 - buildable_w) * (1.0 - plains_w);

    // Normalize
    let sum = mountain_w + wetland_w + buildable_w + plains_w + default_w;
    if sum > 0.0 {
        [
            mountain_w / sum,
            wetland_w / sum,
            buildable_w / sum,
            plains_w / sum,
            default_w / sum,
        ]
    } else {
        [0.0, 0.0, 0.0, 0.0, 1.0]
    }
}

/// ─── Ocean basins ───
/// Rare, very large water bodies (semi-ocean scale). Two gates multiply:
/// the deepest cells of the biome-elevation field (core) and a dedicated
/// very-low-frequency `{seed}-ocean` noise thresholded high (macro gate),
/// plus a spawn-safety falloff so no basin sits within 150u of the origin.
/// The fade (0..1) is subtracted from terrain height × heightScale × 0.5.
///
/// PARITY: bit-for-bit mirror of `getOceanFade` in biomeHelpers.ts — the
/// noise constructors match alea+simplex-noise JS numerics exactly, and
/// the math below must stay identical on both sides.
const OCEAN_GATE_FREQ: f64 = 0.00025;

pub fn get_ocean_fade(x: f64, z: f64, seed: &str) -> f64 {
    let spawn_dist = (x * x + z * z).sqrt();
    let spawn_safe = smoothstep(150.0, 400.0, spawn_dist);
    if spawn_safe <= 0.0 {
        return 0.0;
    }
    let noises = biome_noises(seed);
    let elevation = noises.elev.noise2d(x * ELEV_FREQ, z * ELEV_FREQ);
    let core = smoothstep(-0.42, -0.6, elevation);
    if core <= 0.0 {
        return 0.0;
    }
    let gate = smoothstep(
        0.45,
        0.6,
        noises.ocean.noise2d(x * OCEAN_GATE_FREQ, z * OCEAN_GATE_FREQ),
    );
    core * gate * spawn_safe
}

/// Get the height multiplier at a world position (smooth blend).
pub fn get_biome_height_multiplier(x: f64, z: f64, seed: &str) -> f64 {
    let weights = get_biome_weights(x, z, seed);
    let biomes = [
        BiomeId::Mountains,
        BiomeId::Wetlands,
        BiomeId::Buildable,
        BiomeId::Plains,
        BiomeId::Default,
    ];

    let mut multiplier = 0.0;
    for (i, biome) in biomes.iter().enumerate() {
        multiplier += weights[i] * biome.params().height_multiplier;
    }
    multiplier
}

#[cfg(test)]
mod ocean_tests {
    use super::*;

    /// Reference values generated from the JS implementation
    /// (biomeHelpers.ts getOceanFade, seed "demo") — guards WASM/JS parity.
    #[test]
    fn ocean_fade_matches_js_reference() {
        let cases: [(f64, f64, f64); 8] = [
            (0.0, 0.0, 0.0),                       // spawn safety zone
            (500.0, 500.0, 0.0),
            (-1200.0, 800.0, 0.0),
            (2000.0, -1500.0, 0.0),
            (-2500.0, -2500.0, 0.0),
            (-2589.0, -3000.0, 0.841649928207580),
            (-2589.0, -2789.0, 1.0),
            (562.0, -257.0, 0.310081123986761),
        ];
        for (x, z, expected) in cases {
            let got = get_ocean_fade(x, z, "demo");
            assert!(
                (got - expected).abs() < 1e-9,
                "ocean fade mismatch at ({}, {}): got {}, expected {}",
                x, z, got, expected
            );
        }
    }

    #[test]
    fn ocean_fade_deterministic_and_in_range() {
        for &(x, z) in &[(100.0, 100.0), (-500.0, 1234.0), (3000.0, -3000.0)] {
            let a = get_ocean_fade(x, z, "range-test");
            let b = get_ocean_fade(x, z, "range-test");
            assert_eq!(a, b);
            assert!((0.0..=1.0).contains(&a));
        }
    }
}

/// Convert hex color to (r, g, b) floats in [0, 1].
#[inline]
pub fn hex_to_rgb(hex: u32) -> (f32, f32, f32) {
    (
        ((hex >> 16) & 0xFF) as f32 / 255.0,
        ((hex >> 8) & 0xFF) as f32 / 255.0,
        (hex & 0xFF) as f32 / 255.0,
    )
}

/// Get terrain color for a biome at a given normalized height and water distance.
/// Returns (r, g, b) or None for 'default' biome.
pub fn get_biome_terrain_color(
    biome: BiomeId,
    normalized_height: f64,
    water_dist: f32,
) -> Option<(f32, f32, f32)> {
    match biome {
        BiomeId::Default => None,
        BiomeId::Mountains => {
            // Rocky highlands: earthy scrub → rock tiers. Snow-white only ≥0.88
            // — the mountains-biome heightfield tops out ~0.76 (×1.6 multiplier),
            // so snow appears only where real-mountain base influence lifts the
            // ground at actual peaks. (The old ramp went pale grey at 0.56 and
            // read as snow caps on every mountain-biome hill.) Tiers stay
            // non-green-dominant so is_green spawn checks are unaffected.
            if normalized_height < 0.48 {
                Some(hex_to_rgb(0x2d5f6f))
            } else if normalized_height < 0.52 {
                Some(hex_to_rgb(0x6b675c))
            } else if normalized_height < 0.58 {
                Some(hex_to_rgb(0x7d786b))
            } else if normalized_height < 0.66 {
                Some(hex_to_rgb(0x8a857a))
            } else if normalized_height < 0.78 {
                Some(hex_to_rgb(0x969288))
            } else if normalized_height < 0.88 {
                Some(hex_to_rgb(0xa8a8a8))
            } else {
                Some(hex_to_rgb(0xdfe6ec)) // snow — extreme peaks only
            }
        }
        BiomeId::Wetlands => {
            if normalized_height < 0.48 {
                Some(hex_to_rgb(0x2d5f6f))
            } else if normalized_height < 0.52 {
                Some(hex_to_rgb(0x3a6b3a))
            } else {
                Some(hex_to_rgb(0x4a7c4a))
            }
        }
        BiomeId::Buildable => {
            if normalized_height < 0.48 {
                Some(hex_to_rgb(0x2d5f6f))
            } else if normalized_height >= 0.48
                && normalized_height < 0.56
                && water_dist > 0.0
                && water_dist <= 6.0
            {
                let rocky = hex_to_rgb(0xa89d8a);
                let green = hex_to_rgb(0x5a9a40);
                let blend = ((water_dist - 1.0) / 5.0).clamp(0.0, 1.0);
                Some((
                    rocky.0 + (green.0 - rocky.0) * blend,
                    rocky.1 + (green.1 - rocky.1) * blend,
                    rocky.2 + (green.2 - rocky.2) * blend,
                ))
            } else {
                Some(hex_to_rgb(0x5a9a40))
            }
        }
        BiomeId::Plains => {
            if normalized_height < 0.48 {
                Some(hex_to_rgb(0x2d5f6f))
            } else if normalized_height >= 0.48
                && normalized_height < 0.56
                && water_dist > 0.0
                && water_dist <= 6.0
            {
                let rocky = hex_to_rgb(0xa89d8a);
                let green = hex_to_rgb(0x3d8c30);
                let blend = ((water_dist - 1.0) / 5.0).clamp(0.0, 1.0);
                Some((
                    rocky.0 + (green.0 - rocky.0) * blend,
                    rocky.1 + (green.1 - rocky.1) * blend,
                    rocky.2 + (green.2 - rocky.2) * blend,
                ))
            } else if normalized_height < 0.53 {
                Some(hex_to_rgb(0x3d8c30))
            } else {
                Some(hex_to_rgb(0x4a9040))
            }
        }
    }
}

