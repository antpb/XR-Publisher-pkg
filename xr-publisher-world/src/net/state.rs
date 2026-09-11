//! Player state tracking and delta compression.
//!
//! `StateDiffer` caches the last-sent state and only encodes fields
//! that changed beyond configurable thresholds.

use super::protocol::{self, BodyState, HandPose};

/// Thresholds for delta compression.
const POSITION_THRESHOLD: f32 = 0.001;    // ~1mm
const ROTATION_THRESHOLD: f32 = 0.0001;   // quaternion component difference
const IDLE_HEARTBEAT_MS: f64 = 500.0;     // 2Hz heartbeat when idle
/// Force a full-state keyframe at least this often even while moving.
/// Without it, a receiver that missed a transition packet (join-in-
/// progress, remount, drop) stayed stuck in the wrong animation/position
/// forever — the differ would never resend an unchanged action.
const KEYFRAME_INTERVAL_MS: f64 = 1000.0;

/// Current player state to be sent over the network.
#[derive(Clone, Default)]
pub struct PlayerState {
    pub position: [f32; 3],
    pub rotation: [f32; 4],         // quaternion [x,y,z,w]
    pub action: u8,
    pub hangtime: u8,
    pub head_quat: Option<[f32; 4]>,
    pub left_hand: Option<HandData>,
    pub right_hand: Option<HandData>,
    pub body_flags: u8,             // bit 0: swimming, bit 1: flying, bit 2: boosting
    pub swim_blend: u8,             // quantized 0-255 from 0.0-1.0
    pub fly_pose_time: u8,          // quantized 0-255 from 0.0-2.0s
    /// VR presence bits (protocol::VR_FLAG_*). None = caller not VR-aware.
    pub vr_flags: Option<u8>,
}

#[derive(Clone)]
pub struct HandData {
    pub wrist_quat: [f32; 4],
    pub finger_joints: [[f32; 4]; 15],
}

/// Tracks the last-sent state and determines what needs to be sent.
pub struct StateDiffer {
    last_sent: Option<PlayerState>,
    last_send_time: f64,
    last_keyframe_time: f64,
}

impl StateDiffer {
    pub fn new() -> Self {
        Self {
            last_sent: None,
            last_send_time: 0.0,
            last_keyframe_time: 0.0,
        }
    }

    /// Compare the new state against the last-sent state and encode only changed fields.
    ///
    /// Returns None if nothing changed and we haven't hit the heartbeat interval.
    pub fn encode_diff(
        &mut self,
        state: &PlayerState,
        client_id_hash: u16,
        current_time_ms: f64,
    ) -> Option<Vec<u8>> {
        let since_last = current_time_ms - self.last_send_time;

        // Periodic keyframe: full presence mask regardless of what changed.
        // No wire-format change — the mask already supports full packets.
        // Every receiver-side stuck state self-heals within one interval.
        let keyframe_due = current_time_ms - self.last_keyframe_time >= KEYFRAME_INTERVAL_MS;
        if keyframe_due {
            self.last_keyframe_time = current_time_ms;
        }

        let (send_pos, send_rot, send_action, send_body, send_vr) = if keyframe_due {
            (true, true, true, true, true)
        } else if let Some(ref last) = self.last_sent {
            let pos_changed = position_changed(&last.position, &state.position);
            let rot_changed = rotation_changed(&last.rotation, &state.rotation);
            let action_changed = last.action != state.action || last.hangtime != state.hangtime;
            let body_changed = last.body_flags != state.body_flags
                || last.swim_blend != state.swim_blend
                || last.fly_pose_time != state.fly_pose_time;
            let vr_changed = last.vr_flags != state.vr_flags;

            if !pos_changed && !rot_changed && !action_changed && !body_changed && !vr_changed {
                // Nothing changed - only send heartbeat at reduced rate
                if since_last < IDLE_HEARTBEAT_MS {
                    return None;
                }
                // Send action-only heartbeat
                (false, false, true, false, false)
            } else {
                // always include action+body when sending
                (pos_changed, rot_changed, true, true, vr_changed)
            }
        } else {
            // First send - include everything
            (true, true, true, true, true)
        };

        // Determine hand data to send
        let left_hand = state.left_hand.as_ref().map(|h| HandPose {
            wrist_quat: h.wrist_quat,
            finger_joints: h.finger_joints,
        });
        let right_hand = state.right_hand.as_ref().map(|h| HandPose {
            wrist_quat: h.wrist_quat,
            finger_joints: h.finger_joints,
        });

        let body_state = if send_body {
            Some(BodyState {
                flags: state.body_flags,
                swim_blend: state.swim_blend,
                fly_pose_time: state.fly_pose_time,
            })
        } else {
            None
        };

        let encoded = protocol::encode_state_update(
            client_id_hash,
            if send_pos { Some(state.position) } else { None },
            if send_rot { Some(state.rotation) } else { None },
            if send_action { Some((state.action, state.hangtime)) } else { None },
            state.head_quat,
            left_hand,
            right_hand,
            body_state,
            if send_vr { state.vr_flags } else { None },
        );

        self.last_sent = Some(state.clone());
        self.last_send_time = current_time_ms;
        Some(encoded)
    }

    /// Reset the differ state (e.g., on reconnect).
    pub fn reset(&mut self) {
        self.last_sent = None;
        self.last_send_time = 0.0;
        self.last_keyframe_time = 0.0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn state_at(x: f32, action: u8) -> PlayerState {
        PlayerState {
            position: [x, 0.0, 0.0],
            rotation: [0.0, 0.0, 0.0, 1.0],
            action,
            ..Default::default()
        }
    }

    /// While only position changes, a keyframe (full mask incl. position,
    /// rotation, action, body) must still go out every KEYFRAME_INTERVAL_MS.
    #[test]
    fn keyframe_cadence_while_moving() {
        let mut differ = StateDiffer::new();
        // t=0 first send = keyframe
        let first = differ.encode_diff(&state_at(0.0, 1), 42, 0.0).unwrap();
        let first_mask = first[4];
        assert_eq!(first_mask & 0b0000_0111, 0b0000_0111); // pos|rot|action

        // t=500: position-only movement → delta without rotation
        let mid = differ.encode_diff(&state_at(1.0, 1), 42, 500.0).unwrap();
        assert_eq!(mid[4] & 0b0000_0010, 0); // rotation absent in delta

        // t=1000: keyframe due → full mask again despite rotation unchanged
        let kf = differ.encode_diff(&state_at(2.0, 1), 42, 1000.0).unwrap();
        assert_eq!(kf[4] & 0b0000_0111, 0b0000_0111);
    }

    /// A completely idle player still emits keyframes (not just the
    /// action-only heartbeat).
    #[test]
    fn keyframe_when_idle() {
        let mut differ = StateDiffer::new();
        differ.encode_diff(&state_at(0.0, 0), 42, 0.0).unwrap();
        // idle at t=400 → suppressed entirely
        assert!(differ.encode_diff(&state_at(0.0, 0), 42, 400.0).is_none());
        // idle at t=1100 → keyframe (full mask), not an action-only heartbeat
        let kf = differ.encode_diff(&state_at(0.0, 0), 42, 1100.0).unwrap();
        assert_eq!(kf[4] & 0b0000_0111, 0b0000_0111);
    }
}

fn position_changed(a: &[f32; 3], b: &[f32; 3]) -> bool {
    (a[0] - b[0]).abs() > POSITION_THRESHOLD
        || (a[1] - b[1]).abs() > POSITION_THRESHOLD
        || (a[2] - b[2]).abs() > POSITION_THRESHOLD
}

fn rotation_changed(a: &[f32; 4], b: &[f32; 4]) -> bool {
    // Quaternion comparison accounting for double-cover (q == -q)
    let dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    (1.0 - dot.abs()) > ROTATION_THRESHOLD
}
