//! Peer state interpolation for smooth networked avatar rendering.
//!
//! Uses a ring buffer of timestamped snapshots per peer with hermite
//! interpolation between surrounding samples. Includes a jitter buffer
//! to absorb network variance.

const MAX_PEERS: usize = 32;
const RING_SIZE: usize = 8;

/// Floats per peer in the output SharedArrayBuffer layout.
/// [0..2] position f32x3
/// [3..6] quaternion f32x4
/// [7]    action (as float)
/// [8]    hangtime
/// [9]    lastUpdateTimestamp
/// [10..31] reserved
pub const FLOATS_PER_PEER: usize = 32;

/// A timestamped snapshot of a peer's state.
#[derive(Clone, Copy, Default)]
struct Snapshot {
    time_ms: f64,
    position: [f32; 3],
    rotation: [f32; 4], // quaternion [x, y, z, w]
    action: u8,
    hangtime: u8,
    valid: bool,
}

/// Ring buffer of snapshots for a single peer.
struct PeerBuffer {
    snapshots: [Snapshot; RING_SIZE],
    write_idx: usize,
    count: usize,
    peer_id_hash: u16,
    active: bool,
}

impl PeerBuffer {
    fn new() -> Self {
        Self {
            snapshots: [Snapshot::default(); RING_SIZE],
            write_idx: 0,
            count: 0,
            peer_id_hash: 0,
            active: false,
        }
    }

    fn push(&mut self, snapshot: Snapshot) {
        self.snapshots[self.write_idx] = snapshot;
        self.write_idx = (self.write_idx + 1) % RING_SIZE;
        if self.count < RING_SIZE {
            self.count += 1;
        }
    }

    /// Get the two snapshots surrounding `time_ms` for interpolation.
    /// Returns (before, after, t) where t is 0..1 between them.
    fn get_interpolation_pair(&self, time_ms: f64) -> Option<(&Snapshot, &Snapshot, f32)> {
        if self.count < 2 {
            // Not enough data to interpolate — return the single snapshot if available
            return if self.count == 1 {
                let idx = if self.write_idx == 0 { RING_SIZE - 1 } else { self.write_idx - 1 };
                Some((&self.snapshots[idx], &self.snapshots[idx], 1.0))
            } else {
                None
            };
        }

        // Collect valid snapshots sorted by time (ring buffer may wrap)
        let mut sorted_indices: Vec<usize> = Vec::with_capacity(self.count);
        for i in 0..self.count {
            let idx = (self.write_idx + RING_SIZE - self.count + i) % RING_SIZE;
            if self.snapshots[idx].valid {
                sorted_indices.push(idx);
            }
        }

        if sorted_indices.is_empty() {
            return None;
        }

        // Find the pair that brackets `time_ms`
        // If time is beyond the newest, extrapolate from the last two
        let last_idx = sorted_indices[sorted_indices.len() - 1];
        if time_ms >= self.snapshots[last_idx].time_ms {
            if sorted_indices.len() >= 2 {
                let prev_idx = sorted_indices[sorted_indices.len() - 2];
                let a = &self.snapshots[prev_idx];
                let b = &self.snapshots[last_idx];
                let dt = (b.time_ms - a.time_ms) as f32;
                if dt < 1.0 {
                    return Some((b, b, 1.0));
                }
                let t = ((time_ms - a.time_ms) as f32 / dt).min(1.5); // cap extrapolation
                return Some((a, b, t));
            }
            return Some((&self.snapshots[last_idx], &self.snapshots[last_idx], 1.0));
        }

        // Find bracketing pair
        for i in 1..sorted_indices.len() {
            let a = &self.snapshots[sorted_indices[i - 1]];
            let b = &self.snapshots[sorted_indices[i]];
            if time_ms >= a.time_ms && time_ms <= b.time_ms {
                let dt = (b.time_ms - a.time_ms) as f32;
                let t = if dt < 1.0 { 1.0 } else { (time_ms - a.time_ms) as f32 / dt };
                return Some((a, b, t));
            }
        }

        // Fallback: return newest
        Some((&self.snapshots[last_idx], &self.snapshots[last_idx], 1.0))
    }
}

/// Interpolation state for all peers.
pub struct InterpolationState {
    peers: Vec<PeerBuffer>,
    /// Render delay (jitter buffer) in milliseconds.
    /// Interpolation targets `current_time - render_delay`.
    render_delay_ms: f64,
}

impl InterpolationState {
    pub fn new() -> Self {
        let mut peers = Vec::with_capacity(MAX_PEERS);
        for _ in 0..MAX_PEERS {
            peers.push(PeerBuffer::new());
        }
        Self {
            peers,
            render_delay_ms: 100.0, // 100ms jitter buffer (configurable)
        }
    }

    /// Set the jitter-buffer render delay. Lower = more responsive but more
    /// vulnerable to packet-timing variance; higher = smoother but laggier.
    pub fn set_render_delay(&mut self, ms: f64) {
        self.render_delay_ms = ms.clamp(0.0, 1000.0);
    }

    /// Newest stored snapshot for a peer — used to fill the missing half of
    /// partial (delta) packets that carry position OR rotation but not both.
    pub fn newest_snapshot(&self, peer_id_hash: u16) -> Option<([f32; 3], [f32; 4], u8, u8)> {
        for peer in &self.peers {
            if peer.active && peer.peer_id_hash == peer_id_hash && peer.count > 0 {
                let idx = if peer.write_idx == 0 { RING_SIZE - 1 } else { peer.write_idx - 1 };
                let s = &peer.snapshots[idx];
                if s.valid {
                    return Some((s.position, s.rotation, s.action, s.hangtime));
                }
            }
        }
        None
    }

    /// Find or allocate a slot index for a peer by hash.
    fn find_or_alloc_idx(&self, peer_id_hash: u16) -> Option<usize> {
        // First: find existing
        for (i, peer) in self.peers.iter().enumerate() {
            if peer.active && peer.peer_id_hash == peer_id_hash {
                return Some(i);
            }
        }
        // Second: find empty slot
        for (i, peer) in self.peers.iter().enumerate() {
            if !peer.active {
                return Some(i);
            }
        }
        None // All slots full
    }

    /// Push a new snapshot for a peer.
    pub fn push_snapshot(
        &mut self,
        peer_id_hash: u16,
        time_ms: f64,
        position: [f32; 3],
        rotation: [f32; 4],
        action: u8,
        hangtime: u8,
    ) {
        if let Some(idx) = self.find_or_alloc_idx(peer_id_hash) {
            let peer = &mut self.peers[idx];
            if !peer.active {
                peer.active = true;
                peer.peer_id_hash = peer_id_hash;
                peer.count = 0;
                peer.write_idx = 0;
            }
            peer.push(Snapshot {
                time_ms,
                position,
                rotation,
                action,
                hangtime,
                valid: true,
            });
        }
    }

    /// Remove a peer by hash.
    pub fn remove_peer(&mut self, peer_id_hash: u16) {
        for peer in &mut self.peers {
            if peer.active && peer.peer_id_hash == peer_id_hash {
                peer.active = false;
                return;
            }
        }
    }

    /// Interpolate all active peers and write results to the output buffer.
    ///
    /// `output` is a flat f32 slice with `MAX_PEERS * FLOATS_PER_PEER` elements.
    /// Returns the number of active peers written.
    pub fn interpolate_all(&self, current_time_ms: f64, output: &mut [f32]) -> u32 {
        let render_time = current_time_ms - self.render_delay_ms;
        let mut count = 0u32;

        for peer in &self.peers {
            if !peer.active {
                continue;
            }

            let base = count as usize * FLOATS_PER_PEER;
            if base + FLOATS_PER_PEER > output.len() {
                break;
            }

            if let Some((a, b, t)) = peer.get_interpolation_pair(render_time) {
                // Lerp position
                output[base]     = a.position[0] + (b.position[0] - a.position[0]) * t;
                output[base + 1] = a.position[1] + (b.position[1] - a.position[1]) * t;
                output[base + 2] = a.position[2] + (b.position[2] - a.position[2]) * t;

                // Slerp quaternion
                let q = slerp(a.rotation, b.rotation, t);
                output[base + 3] = q[0];
                output[base + 4] = q[1];
                output[base + 5] = q[2];
                output[base + 6] = q[3];

                // Action and hangtime (use the newer snapshot's values)
                output[base + 7] = b.action as f32;
                output[base + 8] = b.hangtime as f32;

                // Last update timestamp
                output[base + 9] = b.time_ms as f32;

                // Peer ID hash for identification
                output[base + 10] = peer.peer_id_hash as f32;
            }

            count += 1;
        }

        count
    }
}

/// Quaternion spherical linear interpolation.
fn slerp(a: [f32; 4], b: [f32; 4], t: f32) -> [f32; 4] {
    let mut dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];

    // Handle quaternion double-cover
    let mut b = b;
    if dot < 0.0 {
        b = [-b[0], -b[1], -b[2], -b[3]];
        dot = -dot;
    }

    if dot > 0.9995 {
        // Very close — use linear interpolation to avoid division by near-zero
        let mut result = [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t,
            a[3] + (b[3] - a[3]) * t,
        ];
        normalize_quat(&mut result);
        return result;
    }

    let theta = dot.clamp(-1.0, 1.0).acos();
    let sin_theta = theta.sin();
    if sin_theta.abs() < 1e-6 {
        return a;
    }

    let sa = ((1.0 - t) * theta).sin() / sin_theta;
    let sb = (t * theta).sin() / sin_theta;

    [
        a[0] * sa + b[0] * sb,
        a[1] * sa + b[1] * sb,
        a[2] * sa + b[2] * sb,
        a[3] * sa + b[3] * sb,
    ]
}

fn normalize_quat(q: &mut [f32; 4]) {
    let len = (q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]).sqrt();
    if len > 1e-6 {
        let inv = 1.0 / len;
        q[0] *= inv;
        q[1] *= inv;
        q[2] *= inv;
        q[3] *= inv;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slerp_identity() {
        let q = [0.0, 0.0, 0.0, 1.0];
        let result = slerp(q, q, 0.5);
        assert!((result[3] - 1.0).abs() < 0.001);
    }

    #[test]
    fn slerp_halfway() {
        let a = [0.0, 0.0, 0.0, 1.0];
        let b = [0.0, 0.707107, 0.0, 0.707107]; // 90 degree Y rotation
        let result = slerp(a, b, 0.5);
        // Should be ~45 degree rotation
        assert!((result[1] - 0.3827).abs() < 0.01);
        assert!((result[3] - 0.9239).abs() < 0.01);
    }

    #[test]
    fn interpolation_state_basic() {
        let mut state = InterpolationState::new();
        let peer_hash = 42u16;

        state.push_snapshot(peer_hash, 0.0, [0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 1.0], 0, 0);
        state.push_snapshot(peer_hash, 100.0, [10.0, 0.0, 0.0], [0.0, 0.0, 0.0, 1.0], 1, 0);

        let mut output = vec![0.0f32; MAX_PEERS * FLOATS_PER_PEER];
        // Render at t=150 (with 100ms delay -> render_time=50, halfway between 0 and 100)
        let count = state.interpolate_all(150.0, &mut output);
        assert_eq!(count, 1);
        // Position should be interpolated to ~5.0
        assert!((output[0] - 5.0).abs() < 0.5, "got {}", output[0]);
    }

    #[test]
    fn remove_peer() {
        let mut state = InterpolationState::new();
        state.push_snapshot(42, 0.0, [1.0, 2.0, 3.0], [0.0, 0.0, 0.0, 1.0], 0, 0);

        let mut output = vec![0.0f32; MAX_PEERS * FLOATS_PER_PEER];
        assert_eq!(state.interpolate_all(100.0, &mut output), 1);

        state.remove_peer(42);
        assert_eq!(state.interpolate_all(100.0, &mut output), 0);
    }
}
