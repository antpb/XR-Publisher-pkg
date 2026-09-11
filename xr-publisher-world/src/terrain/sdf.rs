//! Mountain SDF — bit-exact port of the live signed-distance functions in
//! `src/components/core/front/worldHelpers.ts`:
//!   getMountainProfile, mountainSDF, mountainSDFNoNoise, roomSDF,
//!   interiorTerrainSDF, combinedSDF, plus the colorFn/depthFn closures
//!   from createMountainGeometry.
//!
//! `tunnelSDF` / `sampleCurve` are intentionally NOT ported — they are dead
//! code in the mountain-mesh path (no call site reaches them from
//! createMountainGeometry; tunnels are never carved into the mountain SDF).
//!
//! Cavern-network generation and the interior-fill PRNG draw stay in JS
//! (`buildMountainMeshParams`); this module receives fully-prepared params
//! and is a pure function of its input, which makes bit-exactness testable.

use crate::terrain::mountain::MountainShape;
use crate::terrain::noise::SimplexNoise3D;
use serde::Deserialize;

const BOTTOM_Y: f64 = -5.0;

// ── Deserialized params (JS `buildMountainMeshParams` output) ──

#[derive(Debug, Clone, Deserialize)]
pub struct NeighborParams {
    #[serde(rename = "peakHeight")]
    pub peak_height: f64,
    #[serde(rename = "baseRadius")]
    pub base_radius: f64,
    pub shape: String,
    #[serde(rename = "offsetX")]
    pub offset_x: f64,
    #[serde(rename = "offsetZ")]
    pub offset_z: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RoomDef {
    pub cx: f64,
    pub cy: f64,
    pub cz: f64,
    pub radius: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct InteriorFill {
    pub cx: f64,
    pub cy: f64,
    pub cz: f64,
    pub radius: f64,
    #[serde(rename = "floorY")]
    pub floor_y: f64,
    #[serde(rename = "ceilingY")]
    pub ceiling_y: f64,
    pub seed: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DeletionSphere {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    #[serde(rename = "rSq")]
    pub r_sq: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MountainMeshParams {
    pub seed: String,
    #[serde(rename = "mountainId")]
    pub mountain_id: String,
    #[serde(rename = "baseRadius")]
    pub base_radius: f64,
    #[serde(rename = "peakHeight")]
    pub peak_height: f64,
    pub shape: String,
    #[serde(default)]
    pub neighbors: Vec<NeighborParams>,
    #[serde(rename = "roomDefs", default)]
    pub room_defs: Vec<RoomDef>,
    #[serde(rename = "interiorFills", default)]
    pub interior_fills: Vec<InteriorFill>,
    #[serde(rename = "deletionSpheres", default)]
    pub deletion_spheres: Vec<DeletionSphere>,
    /// Explicit marching-cubes bounds (primary-local). Set by JS so a cluster
    /// primary's mesh spans the whole overlap cluster. Falls back to the
    /// single-mountain box when absent.
    #[serde(rename = "boundsMin", default)]
    pub bounds_min: Option<[f64; 3]>,
    #[serde(rename = "boundsMax", default)]
    pub bounds_max: Option<[f64; 3]>,
}

// ── SDF functions ──

/// Port of `getMountainProfile` (worldHelpers.ts:80-97).
#[inline]
pub fn get_mountain_profile(t: f64, angle: f64, shape: MountainShape) -> f64 {
    match shape {
        MountainShape::Conical => (1.0 - t).powf(0.45),
        MountainShape::Ridged => (1.0 - t).powf(0.45) * (1.0 + 0.15 * (angle * 3.0).sin()),
        MountainShape::Mesa => {
            if t < 0.7 {
                1.0 - t * 0.2
            } else {
                (1.0 - 0.7 * 0.2) * (0f64.max(1.0 - (t - 0.7) / 0.3)).powf(0.5)
            }
        }
        MountainShape::Volcanic => {
            if t > 0.88 {
                (1.0 - t).powf(0.45) + 0.15
            } else {
                (1.0 - t).powf(0.45)
            }
        }
    }
}

/// Port of `mountainSDF` (worldHelpers.ts:205-234) — surface with 3-octave
/// noise displacement. Uses the main mountain's shape/radius/peak.
pub fn mountain_sdf(
    x: f64,
    y: f64,
    z: f64,
    base_radius: f64,
    peak_height: f64,
    shape: MountainShape,
    noise: &SimplexNoise3D,
) -> f64 {
    let r = (x * x + z * z).sqrt();
    let angle = z.atan2(x);

    if y > peak_height * 1.05 {
        return (r * r + (y - peak_height) * (y - peak_height)).sqrt();
    }

    let t = (y / peak_height).clamp(0.0, 1.0);
    let mut expected_r = get_mountain_profile(t, angle, shape) * base_radius;

    let mut noise_disp = 0.0;
    let mut amp = base_radius * 0.1;
    let mut freq = 0.03;
    for _ in 0..3 {
        noise_disp += noise.noise3d(x * freq, y * freq, z * freq) * amp;
        amp *= 0.5;
        freq *= 2.0;
    }
    expected_r += noise_disp;

    let side_sdf = r - expected_r;
    let bottom_sdf = BOTTOM_Y - y;
    side_sdf.max(bottom_sdf)
}

/// Port of `mountainSDFNoNoise` (worldHelpers.ts:401-416) — neighbor union.
pub fn mountain_sdf_no_noise(
    lx: f64,
    ly: f64,
    lz: f64,
    base_radius: f64,
    peak_height: f64,
    shape: MountainShape,
) -> f64 {
    let r = (lx * lx + lz * lz).sqrt();
    let angle = lz.atan2(lx);
    if ly > peak_height * 1.05 {
        return (r * r + (ly - peak_height) * (ly - peak_height)).sqrt();
    }
    let t = (ly / peak_height).clamp(0.0, 1.0);
    let expected_r = get_mountain_profile(t, angle, shape) * base_radius;
    let side_sdf = r - expected_r;
    let bottom_sdf = BOTTOM_Y - ly;
    side_sdf.max(bottom_sdf)
}

/// Port of `roomSDF` (worldHelpers.ts:274-282).
#[inline]
pub fn room_sdf(x: f64, y: f64, z: f64, room: &RoomDef) -> f64 {
    let dx = x - room.cx;
    let dy = y - room.cy;
    let dz = z - room.cz;
    (dx * dx + dy * dy + dz * dz).sqrt() - room.radius
}

/// Port of `interiorTerrainSDF` (worldHelpers.ts:284-381) — 6-octave +
/// 4-octave ridge noise terrain filling cavern rooms.
pub fn interior_terrain_sdf(
    x: f64,
    y: f64,
    z: f64,
    fill: &InteriorFill,
    noise: &SimplexNoise3D,
) -> f64 {
    let dx = x - fill.cx;
    let dz = z - fill.cz;
    let dist_from_center = (dx * dx + dz * dz).sqrt();

    let max_r = fill.radius * 0.88;
    if dist_from_center > max_r {
        return -1.0;
    }

    let world_floor = fill.floor_y;
    let room_ceiling = fill.ceiling_y;
    let total_height = room_ceiling - world_floor;

    if y < world_floor - 2.0 {
        return -(world_floor - y);
    }
    if y > room_ceiling + 2.0 {
        return -(y - room_ceiling);
    }

    let t = ((y - world_floor) / total_height).clamp(0.0, 1.0);

    let sx = fill.seed * 73.1;
    let sz = fill.seed * 31.7;
    let sy = fill.seed * 17.3;

    let warp_freq = 0.012;
    let warp_x = noise.noise3d((x + sx) * warp_freq, (y + sy) * warp_freq, (z + sz + 100.0) * warp_freq) * 18.0;
    let warp_z = noise.noise3d((x + sx + 200.0) * warp_freq, (y + sy) * warp_freq, (z + sz) * warp_freq) * 18.0;
    let warp_y = noise.noise3d((x + sx + 300.0) * warp_freq, (y + sy) * warp_freq, (z + sz + 400.0) * warp_freq) * 10.0;

    let wx = x + sx + warp_x;
    let wy = y + sy + warp_y;
    let wz = z + sz + warp_z;

    let mut noise_value = 0.0;
    let mut amplitude = 1.0;
    let mut frequency = 0.03;
    let mut max_amplitude = 0.0;
    for _ in 0..6 {
        noise_value += noise.noise3d(wx * frequency, wy * frequency * 0.55, wz * frequency) * amplitude;
        max_amplitude += amplitude;
        amplitude *= 0.52;
        frequency *= 2.1;
    }
    noise_value /= max_amplitude;

    let mut ridge_noise = 0.0;
    amplitude = 1.0;
    frequency = 0.02;
    max_amplitude = 0.0;
    for _ in 0..4 {
        ridge_noise += (1.0 - (noise.noise3d(wx * frequency * 1.3, wy * frequency * 0.4, wz * frequency * 1.3) * 2.0).abs()) * amplitude;
        max_amplitude += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    ridge_noise = ridge_noise / max_amplitude - 0.5;

    let combined_noise = noise_value * 0.6 + ridge_noise * 0.4;

    let height_bias;
    if t < 0.3 {
        let ft = t / 0.3;
        height_bias = -0.55 + ft * ft * 0.95;
    } else if t < 0.65 {
        let mt = (t - 0.3) / 0.35;
        height_bias = 0.4 + mt * 0.2;
    } else {
        let ct = (t - 0.65) / 0.35;
        height_bias = 0.6 - ct * ct * 1.0;
    }

    let mut sdf = combined_noise * 0.7 + height_bias;

    let edge_dist = max_r - dist_from_center;
    let edge_blend_width = fill.radius * 0.25;
    if edge_dist < edge_blend_width {
        let edge_fade = edge_dist / edge_blend_width;
        let smooth_fade = edge_fade * edge_fade * (3.0 - 2.0 * edge_fade);
        sdf = sdf * smooth_fade - 0.6 * (1.0 - smooth_fade);
    }

    let floor_dist = y - world_floor;
    if floor_dist < 3.0 {
        let floor_fade = (floor_dist / 3.0).max(0.0);
        sdf = sdf * floor_fade - (1.0 - floor_fade);
    }

    let ceiling_dist = room_ceiling - y;
    if ceiling_dist < 3.0 {
        let ceil_fade = (ceiling_dist / 3.0).max(0.0);
        sdf = sdf * ceil_fade - (1.0 - ceil_fade);
    }

    sdf
}

/// Port of `combinedSDF` (worldHelpers.ts:429-487).
pub fn combined_sdf(
    x: f64,
    y: f64,
    z: f64,
    params: &MountainMeshParams,
    main_shape: MountainShape,
    noise: &SimplexNoise3D,
) -> f64 {
    let mut mountain_dist = mountain_sdf(x, y, z, params.base_radius, params.peak_height, main_shape, noise);
    for nb in &params.neighbors {
        let lx = x - nb.offset_x;
        let lz = z - nb.offset_z;
        let nb_sdf = mountain_sdf_no_noise(
            lx, y, lz, nb.base_radius, nb.peak_height, MountainShape::from_js(&nb.shape),
        );
        mountain_dist = mountain_dist.min(nb_sdf);
    }

    if params.interior_fills.is_empty() {
        return mountain_dist;
    }

    let shell_hard = 8.0;
    let shell_blend = 6.0;

    if mountain_dist > -shell_hard {
        return mountain_dist;
    }

    let mut carved = mountain_dist;
    for room in &params.room_defs {
        let r_sdf = room_sdf(x, y, z, room);
        carved = carved.max(-r_sdf);
    }

    let mut interior_value = carved;
    let mut in_fill_region = false;

    for fill in &params.interior_fills {
        let fdx = x - fill.cx;
        let fdz = z - fill.cz;
        let dist_from_center = (fdx * fdx + fdz * fdz).sqrt();
        if dist_from_center < fill.radius * 0.88 {
            in_fill_region = true;
            interior_value = interior_terrain_sdf(x, y, z, fill, noise);
            break;
        }
    }

    if mountain_dist > -(shell_hard + shell_blend) {
        let blend_t = (-mountain_dist - shell_hard) / shell_blend;
        let smooth_t = blend_t * blend_t * (3.0 - 2.0 * blend_t);
        return mountain_dist * (1.0 - smooth_t) + interior_value * smooth_t;
    }

    if in_fill_region {
        return interior_value;
    }

    carved
}

/// Port of the `colorFn` closure (worldHelpers.ts:573-604). Returns f64 RGB
/// so the marching-cubes weld can average in f64 (matching JS) before the
/// single f32 truncation at output.
pub fn color_fn(
    vx: f64,
    vy: f64,
    vz: f64,
    params: &MountainMeshParams,
    main_shape: MountainShape,
    noise: &SimplexNoise3D,
    cell_size: f64,
) -> [f64; 3] {
    let m_only = mountain_sdf(vx, vy, vz, params.base_radius, params.peak_height, main_shape, noise);
    let nc = noise.noise3d(vx * 0.08, vy * 0.08, vz * 0.08) * 0.04;
    let fine_noise = noise.noise3d(vx * 0.25, vy * 0.25, vz * 0.25) * 0.02;

    let interior_threshold = -cell_size * 0.5;
    let is_interior = m_only < interior_threshold;

    if is_interior {
        let depth = (m_only.abs() / 20.0).min(1.0);
        let rock_noise = (vx * 1.3 + vy * 2.1).sin() * (vz * 0.7 + vx * 1.8).sin() * 0.5 + 0.5;
        let darkness_factor = 0.15 + (1.0 - depth) * 0.25;
        let base_r = 0.18 + rock_noise * 0.08;
        let base_g = base_r * 0.75;
        let base_b = base_r * 0.55;
        return [
            base_r * darkness_factor + nc + fine_noise,
            base_g * darkness_factor + nc * 0.8 + fine_noise,
            base_b * darkness_factor + nc * 0.6 + fine_noise,
        ];
    }

    let t = (vy / params.peak_height).max(0.0);
    if t < 0.2 {
        return [0.38 + nc, 0.32 + nc, 0.22 + nc];
    }
    if t < 0.5 {
        let b = (t - 0.2) / 0.3;
        return [0.38 + b * 0.12 + nc, 0.32 + b * 0.13 + nc, 0.22 + b * 0.18 + nc];
    }
    if t < 0.8 {
        let b = (t - 0.5) / 0.3;
        return [0.50 + b * 0.15 + nc, 0.45 + b * 0.15 + nc, 0.40 + b * 0.18 + nc];
    }
    let b = (t - 0.8) / 0.2;
    [0.65 + b * 0.25 + nc, 0.60 + b * 0.28 + nc, 0.58 + b * 0.30 + nc]
}

/// Port of the `depthFn` closure (worldHelpers.ts:606-610).
pub fn depth_fn(
    vx: f64,
    vy: f64,
    vz: f64,
    params: &MountainMeshParams,
    main_shape: MountainShape,
    noise: &SimplexNoise3D,
    cell_size: f64,
) -> f64 {
    let m_only = mountain_sdf(vx, vy, vz, params.base_radius, params.peak_height, main_shape, noise);
    if m_only >= -cell_size * 0.5 {
        return 0.0;
    }
    (m_only.abs() / 25.0).min(1.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn shape_for(idx: usize) -> MountainShape {
        match idx {
            0 => MountainShape::Conical,
            1 => MountainShape::Ridged,
            2 => MountainShape::Mesa,
            _ => MountainShape::Volcanic,
        }
    }

    /// Bit-exactness gate for `mountain_sdf` vs the JS replication
    /// (createNoise3D(alea("mtn-test-seed-noise")), baseRadius 80, peak 50).
    #[test]
    fn mountain_sdf_matches_js() {
        let noise = SimplexNoise3D::new("mtn-test-seed-noise");
        let cases: [(f64, f64, f64, usize, f64); 12] = [
            (0_f64, 47_f64, 36.37189707302727_f64, 0, 12.76092077382312_f64),
            (41.666592418098745_f64, 29.972448572179896_f64, 0.6632264973316198_f64, 0, -6.896867926050874_f64),
            (-6.221644081073249_f64, 12.22409426118892_f64, -36.86303089654353_f64, 0, -17.22409426118892_f64),
            (-31.0325872931093_f64, 42.683246390767756_f64, -36.29069768895603_f64, 1, 16.717592807488774_f64),
            (27.764534045544327_f64, 42.35412873503662_f64, 0.6619681940197459_f64, 1, -11.76010320215197_f64),
            (41.939484504939614_f64, 11.485810974385087_f64, 32.519999070989556_f64, 1, -16.48581097438509_f64),
            (-15.994987503741694_f64, 30.56117941741856_f64, 23.375883914964483_f64, 2, -35.56117941741856_f64),
            (-10.725484489481332_f64, 46.99363863725368_f64, -17.870425056437767_f64, 2, -14.853739219623005_f64),
            (50.36647259425983_f64, 29.375809153951455_f64, -47.23744920265966_f64, 2, -0.9294258726918372_f64),
            (33.86962292522455_f64, 12.9594869181106_f64, -33.72548448948133_f64, 3, -17.9594869181106_f64),
            (-18.455899675182273_f64, 43.00086178481046_f64, 6.8066814730656375_f64, 3, -11.384812241127754_f64),
            (16.040038967432046_f64, 42.01360186814124_f64, 28.972375549916713_f64, 3, -7.173290742165769_f64),
        ];
        for (x, y, z, sidx, expected) in cases {
            let got = mountain_sdf(x, y, z, 80.0, 50.0, shape_for(sidx), &noise);
            assert!(
                (got - expected).abs() < 1e-10,
                "mountain_sdf({},{},{}) shape {} = {}, expected {}",
                x, y, z, sidx, got, expected
            );
        }
    }

    /// Bit-exactness gate for `interior_terrain_sdf` vs the JS replication.
    #[test]
    fn interior_terrain_sdf_matches_js() {
        let noise = SimplexNoise3D::new("mtn-test-seed-noise");
        let fill = InteriorFill {
            cx: 5.0,
            cy: 20.0,
            cz: -3.0,
            radius: 25.0,
            floor_y: -5.0,
            ceiling_y: 20.0 + 25.0 * 1.1,
            seed: 0.4213 * 1000.0,
        };
        let cases: [(f64, f64, f64, f64); 10] = [
            (5_f64, -3_f64, 6_f64, -0.7772617340621815_f64),
            (12.173560908995228_f64, 1_f64, 4.428020534187105_f64, -0.39877819887417704_f64),
            (14.99573603041505_f64, 5_f64, 0.26121979029006237_f64, 0.02955630472089582_f64),
            (11.754631805511506_f64, 9_f64, -5.044818852237782_f64, 0.15310534440909276_f64),
            (4.416258565724199_f64, 13_f64, -9.63654343987121_f64, 0.7000588258932945_f64),
            (-2.5680249530792825_f64, 17_f64, -11.909932469404009_f64, 0.413385329512095_f64),
            (-4.961646088358405_f64, 21_f64, -11.070825747007325_f64, 0.5288490735912508_f64),
            (-1.3126663787232085_f64, 25_f64, -7.412347392066295_f64, 0.44031128021532606_f64),
            (6.1654920485049365_f64, 29_f64, -2.2125091490449824_f64, 0.7303429850562289_f64),
            (12.936678638491532_f64, 33_f64, 2.7122358834837055_f64, 0.6291935958233564_f64),
        ];
        for (x, y, z, expected) in cases {
            let got = interior_terrain_sdf(x, y, z, &fill, &noise);
            assert!(
                (got - expected).abs() < 1e-10,
                "interior_terrain_sdf({},{},{}) = {}, expected {}",
                x, y, z, got, expected
            );
        }
    }
}
