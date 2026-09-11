/// Heightfield generation — multi-octave simplex noise.
/// Port of `generateHeightField()` from terrainHelpers.ts.

use crate::terrain::noise::SimplexNoise2D;
use crate::util::math::map_range;

/// Generate a heightfield as a flat f32 array (one value per pixel, range [0,1]).
/// Matches the JS `generateHeightField()` output exactly.
pub fn generate_height_field(
    width: usize,
    height: usize,
    scale: f64,
    seed: &str,
    octaves: usize,
    persistence: f64,
    lacunarity: f64,
    offset_x: f64,
    offset_z: f64,
) -> Vec<f32> {
    let noise = SimplexNoise2D::new(seed);
    let mut height_map = vec![0.0f32; width * height];

    for y in 0..height {
        for x in 0..width {
            let index = y * width + x;

            let mut value: f64 = 0.0;
            let mut amplitude: f64 = 1.0;
            let mut frequency: f64 = 1.0;
            let mut max: f64 = 0.0;

            for _ in 0..octaves {
                let world_x = x as f64 + offset_x;
                let world_z = y as f64 + offset_z;
                let nx = (world_x / width as f64) * scale * frequency;
                let ny = (world_z / height as f64) * scale * frequency;
                value += noise.noise2d(nx, ny) * amplitude;

                max += amplitude;
                amplitude *= persistence;
                frequency *= lacunarity;
            }

            value = map_range(value / max, -1.0, 1.0, 0.0, 1.0);

            // Flatten toward center
            value = 0.5 + (value - 0.5) * 0.15;

            // Double smoothstep
            let mut t = value;
            t = t * t * (3.0 - 2.0 * t);
            value = t * t * (3.0 - 2.0 * t);

            height_map[index] = value as f32;
        }
    }

    height_map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heightfield_determinism() {
        let a = generate_height_field(10, 10, 0.5, "test", 6, 0.5, 2.0, 0.0, 0.0);
        let b = generate_height_field(10, 10, 0.5, "test", 6, 0.5, 2.0, 0.0, 0.0);
        assert_eq!(a, b);
    }

    #[test]
    fn test_heightfield_range() {
        let hm = generate_height_field(50, 50, 0.5, "range", 6, 0.5, 2.0, 0.0, 0.0);
        for v in &hm {
            assert!(*v >= 0.0 && *v <= 1.0, "value {} out of range", v);
        }
    }
}
