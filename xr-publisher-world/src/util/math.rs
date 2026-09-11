/// Maps a value from one range to another.
#[inline]
pub fn map_range(value: f64, in_min: f64, in_max: f64, out_min: f64, out_max: f64) -> f64 {
    ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
}

/// Hermite smoothstep interpolation.
#[inline]
pub fn smoothstep(edge0: f64, edge1: f64, x: f64) -> f64 {
    let t = ((x - edge0) / (edge1 - edge0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

/// Linear interpolation.
#[inline]
pub fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_map_range() {
        assert!((map_range(0.5, 0.0, 1.0, -50.0, 50.0) - 0.0).abs() < 1e-10);
        assert!((map_range(0.0, 0.0, 1.0, -50.0, 50.0) - (-50.0)).abs() < 1e-10);
        assert!((map_range(1.0, 0.0, 1.0, -50.0, 50.0) - 50.0).abs() < 1e-10);
    }

    #[test]
    fn test_smoothstep() {
        assert!((smoothstep(0.0, 1.0, 0.0) - 0.0).abs() < 1e-10);
        assert!((smoothstep(0.0, 1.0, 1.0) - 1.0).abs() < 1e-10);
        assert!((smoothstep(0.0, 1.0, 0.5) - 0.5).abs() < 1e-10);
    }
}
