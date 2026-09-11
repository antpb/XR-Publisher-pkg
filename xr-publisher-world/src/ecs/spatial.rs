//! Grid-based spatial index for proximity queries.
//!
//! Used to determine which peers are nearby and should receive
//! full-rate updates vs reduced-rate updates.

/// Send rate tiers based on distance.
/// Each tier halves the send frequency.
pub const TIER_FULL: u8 = 0;      // 0-10m: every changed frame
pub const TIER_HALF: u8 = 1;      // 10-30m: skip every other frame
pub const TIER_QUARTER: u8 = 2;   // 30-100m: quarter rate, no hand data
pub const TIER_HEARTBEAT: u8 = 3; // 100m+: 2Hz heartbeat only

const TIER_FULL_DIST_SQ: f32 = 100.0;       // 10m squared
const TIER_HALF_DIST_SQ: f32 = 900.0;       // 30m squared
const TIER_QUARTER_DIST_SQ: f32 = 10000.0;  // 100m squared

/// Compute the send rate tier for a given distance squared.
#[inline]
pub fn distance_to_tier(dist_sq: f32) -> u8 {
    if dist_sq <= TIER_FULL_DIST_SQ {
        TIER_FULL
    } else if dist_sq <= TIER_HALF_DIST_SQ {
        TIER_HALF
    } else if dist_sq <= TIER_QUARTER_DIST_SQ {
        TIER_QUARTER
    } else {
        TIER_HEARTBEAT
    }
}

/// Compute send rate tiers for all peers relative to the local player.
///
/// `local_pos`: [x, y, z] of local player
/// `peer_positions`: flat array [x0,y0,z0, x1,y1,z1, ...] of peer positions
/// `peer_count`: number of peers
///
/// Returns a Vec<u8> of per-peer tiers.
pub fn compute_send_rates(
    local_pos: [f32; 3],
    peer_positions: &[f32],
    peer_count: u32,
) -> Vec<u8> {
    let mut tiers = Vec::with_capacity(peer_count as usize);
    for i in 0..peer_count as usize {
        let base = i * 3;
        if base + 2 >= peer_positions.len() {
            tiers.push(TIER_HEARTBEAT);
            continue;
        }
        let dx = peer_positions[base] - local_pos[0];
        let dy = peer_positions[base + 1] - local_pos[1];
        let dz = peer_positions[base + 2] - local_pos[2];
        let dist_sq = dx * dx + dy * dy + dz * dz;
        tiers.push(distance_to_tier(dist_sq));
    }
    tiers
}

/// Check if a frame should be sent for a given tier and frame counter.
///
/// `tier`: the send rate tier (0-3)
/// `frame`: monotonically increasing frame counter
///
/// Returns true if this frame should send an update.
#[inline]
pub fn should_send_frame(tier: u8, frame: u32) -> bool {
    match tier {
        TIER_FULL => true,
        TIER_HALF => frame % 2 == 0,
        TIER_QUARTER => frame % 4 == 0,
        TIER_HEARTBEAT => frame % 30 == 0, // ~2Hz at 60fps
        _ => false,
    }
}

/// Check if hand data should be included for a given tier.
#[inline]
pub fn should_send_hands(tier: u8) -> bool {
    tier <= TIER_HALF // Only full and half tiers get hand data
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tier_boundaries() {
        assert_eq!(distance_to_tier(0.0), TIER_FULL);
        assert_eq!(distance_to_tier(99.0), TIER_FULL);   // just under 10m
        assert_eq!(distance_to_tier(101.0), TIER_HALF);   // just over 10m
        assert_eq!(distance_to_tier(899.0), TIER_HALF);   // just under 30m
        assert_eq!(distance_to_tier(901.0), TIER_QUARTER); // just over 30m
        assert_eq!(distance_to_tier(10001.0), TIER_HEARTBEAT);
    }

    #[test]
    fn compute_rates_basic() {
        let local = [0.0, 0.0, 0.0];
        let peers = [
            5.0, 0.0, 0.0,    // 5m → full
            20.0, 0.0, 0.0,   // 20m → half
            50.0, 0.0, 0.0,   // 50m → quarter
            200.0, 0.0, 0.0,  // 200m → heartbeat
        ];
        let tiers = compute_send_rates(local, &peers, 4);
        assert_eq!(tiers, vec![TIER_FULL, TIER_HALF, TIER_QUARTER, TIER_HEARTBEAT]);
    }

    #[test]
    fn frame_gating() {
        assert!(should_send_frame(TIER_FULL, 0));
        assert!(should_send_frame(TIER_FULL, 1));

        assert!(should_send_frame(TIER_HALF, 0));
        assert!(!should_send_frame(TIER_HALF, 1));
        assert!(should_send_frame(TIER_HALF, 2));

        assert!(should_send_frame(TIER_QUARTER, 0));
        assert!(!should_send_frame(TIER_QUARTER, 1));
        assert!(!should_send_frame(TIER_QUARTER, 2));
        assert!(!should_send_frame(TIER_QUARTER, 3));
        assert!(should_send_frame(TIER_QUARTER, 4));
    }

    #[test]
    fn hand_data_gating() {
        assert!(should_send_hands(TIER_FULL));
        assert!(should_send_hands(TIER_HALF));
        assert!(!should_send_hands(TIER_QUARTER));
        assert!(!should_send_hands(TIER_HEARTBEAT));
    }
}
