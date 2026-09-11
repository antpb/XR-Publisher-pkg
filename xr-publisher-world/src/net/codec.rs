//! Quantization and packing utilities for compact network serialization.
//!
//! - Quaternions: f32x4 <-> i16x4 (0.002 degree precision)
//! - Finger joints: quaternion -> axis-angle packed as i8x3 (~1.4 degree precision)

/// Quantize a unit quaternion [x,y,z,w] to i16x4.
/// Each component is clamped to [-1,1] and mapped to [-32767, 32767].
#[inline]
pub fn quantize_quaternion(q: [f32; 4]) -> [i16; 4] {
    [
        (q[0].clamp(-1.0, 1.0) * 32767.0) as i16,
        (q[1].clamp(-1.0, 1.0) * 32767.0) as i16,
        (q[2].clamp(-1.0, 1.0) * 32767.0) as i16,
        (q[3].clamp(-1.0, 1.0) * 32767.0) as i16,
    ]
}

/// Dequantize i16x4 back to f32x4 unit quaternion.
#[inline]
pub fn dequantize_quaternion(q: [i16; 4]) -> [f32; 4] {
    [
        q[0] as f32 / 32767.0,
        q[1] as f32 / 32767.0,
        q[2] as f32 / 32767.0,
        q[3] as f32 / 32767.0,
    ]
}

/// Pack a quaternion into 3 bytes via axis-angle representation.
/// The axis is normalized and scaled by the angle, then each component
/// is mapped to i8 range [-127, 127] representing [-PI, PI].
///
/// This gives ~1.4 degree resolution, sufficient for finger joints.
#[inline]
pub fn pack_axis_angle(q: [f32; 4]) -> [i8; 3] {
    let [x, y, z, w] = q;

    // Ensure w is positive (quaternion double-cover)
    let (x, y, z, w) = if w < 0.0 { (-x, -y, -z, -w) } else { (x, y, z, w) };

    let half_angle = w.clamp(-1.0, 1.0).acos();
    let sin_half = half_angle.sin();

    if sin_half < 1e-6 {
        // Identity rotation
        return [0, 0, 0];
    }

    // axis * angle, scaled to fit in i8 range
    // Full range: [-PI, PI] maps to [-127, 127]
    let scale = half_angle * 2.0 / sin_half * (127.0 / std::f32::consts::PI);
    [
        (x * scale).clamp(-127.0, 127.0) as i8,
        (y * scale).clamp(-127.0, 127.0) as i8,
        (z * scale).clamp(-127.0, 127.0) as i8,
    ]
}

/// Unpack 3-byte axis-angle back to quaternion [x, y, z, w].
#[inline]
pub fn unpack_axis_angle(packed: [i8; 3]) -> [f32; 4] {
    let ax = packed[0] as f32 * std::f32::consts::PI / 127.0;
    let ay = packed[1] as f32 * std::f32::consts::PI / 127.0;
    let az = packed[2] as f32 * std::f32::consts::PI / 127.0;

    let angle = (ax * ax + ay * ay + az * az).sqrt();
    if angle < 1e-6 {
        return [0.0, 0.0, 0.0, 1.0]; // identity
    }

    let half_angle = angle * 0.5;
    let s = half_angle.sin() / angle;
    [ax * s, ay * s, az * s, half_angle.cos()]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_quaternion() {
        let q = [0.1, 0.2, 0.3, 0.9273f32]; // roughly normalized
        let len = (q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]).sqrt();
        let q = [q[0]/len, q[1]/len, q[2]/len, q[3]/len];

        let packed = quantize_quaternion(q);
        let unpacked = dequantize_quaternion(packed);

        for i in 0..4 {
            assert!((q[i] - unpacked[i]).abs() < 0.001, "component {} diverged: {} vs {}", i, q[i], unpacked[i]);
        }
    }

    #[test]
    fn roundtrip_axis_angle() {
        let q = [0.1, 0.2, 0.3, 0.9273f32];
        let len = (q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]).sqrt();
        let q = [q[0]/len, q[1]/len, q[2]/len, q[3]/len];

        let packed = pack_axis_angle(q);
        let unpacked = unpack_axis_angle(packed);

        // axis-angle packing is lower precision (~1.4 degrees)
        for i in 0..4 {
            assert!((q[i] - unpacked[i]).abs() < 0.05, "component {} diverged: {} vs {}", i, q[i], unpacked[i]);
        }
    }

    #[test]
    fn identity_quaternion() {
        let q = [0.0, 0.0, 0.0, 1.0];
        let packed = pack_axis_angle(q);
        assert_eq!(packed, [0, 0, 0]);
        let unpacked = unpack_axis_angle(packed);
        assert!((unpacked[3] - 1.0).abs() < 0.01);
    }
}
