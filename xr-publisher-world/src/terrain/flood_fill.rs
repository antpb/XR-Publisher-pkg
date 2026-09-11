/// 10-pass flood fill for water distance calculation.
/// Port of the flood fill in `createTerrainMesh()`.

use crate::util::math::map_range;

/// Calculate distance from water for each vertex using flood fill.
/// Returns a Vec<f32> where 0 = underwater, higher = further from water.
pub fn compute_water_distance(
    positions: &[f32],
    segments: usize,
    height_scale: f64,
) -> Vec<f32> {
    let vertices_per_side = segments + 1;
    let total = vertices_per_side * vertices_per_side;
    let mut distance = vec![999.0f32; total];

    // Find underwater vertices (normalizedHeight < 0.48)
    for j in 0..=segments {
        for i in 0..=segments {
            let idx = j * vertices_per_side + i;
            let vertex_idx = idx * 3;
            let terrain_height = positions[vertex_idx + 1] as f64; // Y is height
            let normalized = map_range(terrain_height, -height_scale, height_scale, 0.0, 1.0);
            if normalized < 0.48 {
                distance[idx] = 0.0;
            }
        }
    }

    // 10-pass flood fill (4-connectivity), double-buffered: reads come from
    // the previous pass's buffer, writes go to the other, then the buffers
    // swap — one allocation for the whole fill instead of a full-grid clone
    // per pass. Read/write sets match the old clone-per-pass version exactly
    // (same operands, same order), so results are bit-identical.
    let neighbors: [(i32, i32); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];
    let mut next = vec![0.0f32; total];
    for _ in 0..10 {
        for j in 0..=segments {
            for i in 0..=segments {
                let idx = j * vertices_per_side + i;
                if distance[idx] > 0.0 {
                    let mut min_dist = distance[idx];
                    for &(di, dj) in &neighbors {
                        let ni = i as i32 + di;
                        let nj = j as i32 + dj;
                        if ni >= 0
                            && ni <= segments as i32
                            && nj >= 0
                            && nj <= segments as i32
                        {
                            let nidx = nj as usize * vertices_per_side + ni as usize;
                            min_dist = min_dist.min(distance[nidx] + 1.0);
                        }
                    }
                    next[idx] = min_dist;
                } else {
                    next[idx] = distance[idx];
                }
            }
        }
        std::mem::swap(&mut distance, &mut next);
    }

    distance
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::util::math::map_range;

    /// The original clone-per-pass implementation, kept as the equality
    /// reference for the double-buffered version above.
    fn compute_water_distance_reference(
        positions: &[f32],
        segments: usize,
        height_scale: f64,
    ) -> Vec<f32> {
        let vertices_per_side = segments + 1;
        let total = vertices_per_side * vertices_per_side;
        let mut distance = vec![999.0f32; total];
        for j in 0..=segments {
            for i in 0..=segments {
                let idx = j * vertices_per_side + i;
                let terrain_height = positions[idx * 3 + 1] as f64;
                let normalized = map_range(terrain_height, -height_scale, height_scale, 0.0, 1.0);
                if normalized < 0.48 {
                    distance[idx] = 0.0;
                }
            }
        }
        let neighbors: [(i32, i32); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];
        for _ in 0..10 {
            let prev = distance.clone();
            for j in 0..=segments {
                for i in 0..=segments {
                    let idx = j * vertices_per_side + i;
                    if prev[idx] > 0.0 {
                        let mut min_dist = prev[idx];
                        for &(di, dj) in &neighbors {
                            let ni = i as i32 + di;
                            let nj = j as i32 + dj;
                            if ni >= 0 && ni <= segments as i32 && nj >= 0 && nj <= segments as i32 {
                                let nidx = nj as usize * vertices_per_side + ni as usize;
                                min_dist = min_dist.min(prev[nidx] + 1.0);
                            }
                        }
                        distance[idx] = min_dist;
                    }
                }
            }
        }
        distance
    }

    #[test]
    fn double_buffer_matches_clone_per_pass() {
        // Synthetic heightfield with a water pocket, a shoreline gradient,
        // and dry highlands — enough structure to exercise every branch.
        let segments = 24usize;
        let vps = segments + 1;
        let height_scale = 10.0f64;
        let mut positions = vec![0.0f32; vps * vps * 3];
        for j in 0..vps {
            for i in 0..vps {
                let idx = (j * vps + i) * 3;
                let h = ((i as f32 * 0.7).sin() * (j as f32 * 0.5).cos()) * 9.0
                    + if i < 6 && j < 6 { -8.0 } else { 2.0 };
                positions[idx + 1] = h;
            }
        }
        let fast = compute_water_distance(&positions, segments, height_scale);
        let reference = compute_water_distance_reference(&positions, segments, height_scale);
        assert_eq!(fast.len(), reference.len());
        for (k, (a, b)) in fast.iter().zip(reference.iter()).enumerate() {
            assert!(a.to_bits() == b.to_bits(), "mismatch at {k}: {a} vs {b}");
        }
    }
}
