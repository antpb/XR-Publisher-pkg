//! Binary network protocol for XR Publisher multiplayer.
//!
//! Wire format:
//! ```text
//! Header (4 bytes):
//!   [0]    u8   version       (0x01 = binary v1; JSON starts with 0x7B '{')
//!   [1]    u8   message_type  (0x01=state_update, 0x02=profile_announce)
//!   [2..3] u16  client_id_hash (LE)
//!
//! State update (type=0x01):
//!   [4]    u8   presence_mask (bitfield for which sections follow)
//!   [5..]  variable payload per set bit
//! ```

use super::codec;

// Protocol constants
pub const PROTOCOL_VERSION: u8 = 0x01;
pub const MSG_STATE_UPDATE: u8 = 0x01;
pub const MSG_PROFILE_ANNOUNCE: u8 = 0x02;
pub const MSG_VEHICLE_STATE: u8 = 0x03;

/// Vehicle state flag bits (the `flags` byte of a vehicle packet).
pub const VEHICLE_FLAG_OCCUPIED: u8 = 0b0000_0001;

/// Front-wheel steer angle (radians) maps to a signed byte over ±this range.
/// A touch beyond the physics max steer (0.6) for quantization headroom.
pub const VEHICLE_STEER_RANGE: f32 = 0.8;

// Presence mask bits
pub const MASK_POSITION: u8     = 0b0000_0001; // bit 0: 12 bytes (3x f32)
pub const MASK_ROTATION: u8     = 0b0000_0010; // bit 1: 8 bytes (4x i16)
pub const MASK_ACTION: u8       = 0b0000_0100; // bit 2: 2 bytes (action enum + hangtime)
pub const MASK_LEFT_HAND: u8    = 0b0000_1000; // bit 3: 53 bytes
pub const MASK_RIGHT_HAND: u8   = 0b0001_0000; // bit 4: 53 bytes
pub const MASK_HEAD_QUAT: u8    = 0b0010_0000; // bit 5: 8 bytes (4x i16)
pub const MASK_BODY_STATE: u8   = 0b0100_0000; // bit 6: 4 bytes
/// bit 7: 1 byte VR presence — bit0 inVR, bit1 leftHandTracked,
/// bit2 rightHandTracked. Lets receivers EXPLICITLY clear stale VR
/// head/hand poses when a peer leaves VR or loses tracking (previously
/// hands just stopped arriving and the last pose stuck forever).
/// Backward compatible: old decoders never read bit 7 and their decode
/// loop ignores trailing bytes; old senders never set it.
pub const MASK_VR_STATE: u8     = 0b1000_0000;

// VR state byte bits
pub const VR_FLAG_IN_VR: u8         = 0b0000_0001;
pub const VR_FLAG_LEFT_TRACKED: u8  = 0b0000_0010;
pub const VR_FLAG_RIGHT_TRACKED: u8 = 0b0000_0100;

// Action enum values
pub const ACTION_IDLE: u8       = 0;
pub const ACTION_WALKING: u8    = 1;
pub const ACTION_RUNNING: u8    = 2;
pub const ACTION_JUMPING: u8    = 3;
pub const ACTION_JUMP_STOP: u8  = 4;
pub const ACTION_SWIMMING: u8   = 5;
pub const ACTION_FLYING: u8     = 6;

// Header size
pub const HEADER_SIZE: usize = 4;

/// FNV-1a hash of a string, returning the lower 16 bits.
pub fn hash_client_id(client_id: &str) -> u16 {
    let mut hash: u32 = 2166136261;
    for byte in client_id.as_bytes() {
        hash ^= *byte as u32;
        hash = hash.wrapping_mul(16777619);
    }
    hash as u16
}

/// Check if a byte buffer starts with the binary protocol version byte.
/// JSON messages always start with 0x7B ('{'), so this distinguishes them.
#[inline]
pub fn is_binary_protocol(first_byte: u8) -> bool {
    first_byte == PROTOCOL_VERSION
}

/// Body state: packed animation blend parameters.
/// 3 bytes: body_flags (u8), swim_blend (u8), fly_pose_time (u8).
pub struct BodyState {
    /// Bit 0: swimming, Bit 1: flying, Bit 2: boosting
    pub flags: u8,
    /// Swim movement blend, quantized 0-255 from 0.0-1.0
    pub swim_blend: u8,
    /// Fly pose time, quantized 0-255 from 0.0-2.0s
    pub fly_pose_time: u8,
}

/// Encode a state update message into a compact binary buffer.
///
/// Returns a Vec<u8> ready for broadcast via p2pcf.
pub fn encode_state_update(
    client_id_hash: u16,
    position: Option<[f32; 3]>,
    rotation: Option<[f32; 4]>,       // quaternion [x,y,z,w]
    action: Option<(u8, u8)>,          // (action_enum, hangtime)
    head_quat: Option<[f32; 4]>,
    left_hand: Option<HandPose>,
    right_hand: Option<HandPose>,
    body_state: Option<BodyState>,
    vr_state: Option<u8>,              // VR_FLAG_* bits
) -> Vec<u8> {
    let mut mask: u8 = 0;
    // Calculate size
    let mut payload_size = HEADER_SIZE + 1; // header + mask byte

    if position.is_some()   { mask |= MASK_POSITION;   payload_size += 12; }
    if rotation.is_some()   { mask |= MASK_ROTATION;    payload_size += 8; }
    if action.is_some()     { mask |= MASK_ACTION;      payload_size += 2; }
    if left_hand.is_some()  { mask |= MASK_LEFT_HAND;   payload_size += 53; }
    if right_hand.is_some() { mask |= MASK_RIGHT_HAND;  payload_size += 53; }
    if head_quat.is_some()  { mask |= MASK_HEAD_QUAT;   payload_size += 8; }
    if body_state.is_some() { mask |= MASK_BODY_STATE;  payload_size += 3; }
    if vr_state.is_some()   { mask |= MASK_VR_STATE;    payload_size += 1; }

    let mut buf = Vec::with_capacity(payload_size);

    // Header
    buf.push(PROTOCOL_VERSION);
    buf.push(MSG_STATE_UPDATE);
    buf.extend_from_slice(&client_id_hash.to_le_bytes());

    // Presence mask
    buf.push(mask);

    // Position (3x f32 LE)
    if let Some(pos) = position {
        for v in &pos {
            buf.extend_from_slice(&v.to_le_bytes());
        }
    }

    // Rotation (quaternion as 4x i16 LE)
    if let Some(rot) = rotation {
        let q = codec::quantize_quaternion(rot);
        for v in &q {
            buf.extend_from_slice(&v.to_le_bytes());
        }
    }

    // Action state
    if let Some((act, hangtime)) = action {
        buf.push(act);
        buf.push(hangtime);
    }

    // Left hand
    if let Some(ref hand) = left_hand {
        encode_hand_pose(&mut buf, hand);
    }

    // Right hand
    if let Some(ref hand) = right_hand {
        encode_hand_pose(&mut buf, hand);
    }

    // Head quaternion
    if let Some(hq) = head_quat {
        let q = codec::quantize_quaternion(hq);
        for v in &q {
            buf.extend_from_slice(&v.to_le_bytes());
        }
    }

    // Body state (3 bytes: flags, swim_blend, fly_pose_time)
    if let Some(ref bs) = body_state {
        buf.push(bs.flags);
        buf.push(bs.swim_blend);
        buf.push(bs.fly_pose_time);
    }

    // VR presence (1 byte)
    if let Some(vs) = vr_state {
        buf.push(vs);
    }

    buf
}

/// Hand pose: wrist quaternion + 15 finger joint quaternions.
pub struct HandPose {
    pub wrist_quat: [f32; 4],
    /// 15 finger joint quaternions in order:
    /// thumb (metacarpal, proximal, distal),
    /// index (proximal, intermediate, distal),
    /// middle, ring, pinky (same pattern)
    pub finger_joints: [[f32; 4]; 15],
}

/// Encode a hand pose: 8 bytes wrist (i16x4) + 45 bytes fingers (15 x i8x3)
fn encode_hand_pose(buf: &mut Vec<u8>, hand: &HandPose) {
    // Wrist quaternion (8 bytes)
    let wq = codec::quantize_quaternion(hand.wrist_quat);
    for v in &wq {
        buf.extend_from_slice(&v.to_le_bytes());
    }
    // Finger joints (45 bytes)
    for joint in &hand.finger_joints {
        let packed = codec::pack_axis_angle(*joint);
        buf.push(packed[0] as u8);
        buf.push(packed[1] as u8);
        buf.push(packed[2] as u8);
    }
}

/// Decoded state update from binary wire format.
#[derive(Default)]
pub struct DecodedState {
    pub client_id_hash: u16,
    pub position: Option<[f32; 3]>,
    pub rotation: Option<[f32; 4]>,
    pub action: Option<u8>,
    pub hangtime: Option<u8>,
    pub head_quat: Option<[f32; 4]>,
    pub left_hand: Option<DecodedHandPose>,
    pub right_hand: Option<DecodedHandPose>,
    pub body_flags: Option<u8>,
    pub swim_blend: Option<u8>,
    pub fly_pose_time: Option<u8>,
    /// VR_FLAG_* bits — None when the sender predates the VR-state mask.
    pub vr_flags: Option<u8>,
}

pub struct DecodedHandPose {
    pub wrist_quat: [f32; 4],
    pub finger_joints: [[f32; 4]; 15],
}

/// Decode a binary state update message.
///
/// Returns None if the buffer is too short or not a valid binary protocol message.
pub fn decode_state_update(data: &[u8]) -> Option<DecodedState> {
    if data.len() < HEADER_SIZE + 1 {
        return None;
    }
    if data[0] != PROTOCOL_VERSION || data[1] != MSG_STATE_UPDATE {
        return None;
    }

    let client_id_hash = u16::from_le_bytes([data[2], data[3]]);
    let mask = data[4];
    let mut offset = HEADER_SIZE + 1;
    let mut state = DecodedState {
        client_id_hash,
        ..Default::default()
    };

    // Position
    if mask & MASK_POSITION != 0 {
        if offset + 12 > data.len() { return None; }
        state.position = Some([
            f32::from_le_bytes([data[offset], data[offset+1], data[offset+2], data[offset+3]]),
            f32::from_le_bytes([data[offset+4], data[offset+5], data[offset+6], data[offset+7]]),
            f32::from_le_bytes([data[offset+8], data[offset+9], data[offset+10], data[offset+11]]),
        ]);
        offset += 12;
    }

    // Rotation
    if mask & MASK_ROTATION != 0 {
        if offset + 8 > data.len() { return None; }
        let q = [
            i16::from_le_bytes([data[offset], data[offset+1]]),
            i16::from_le_bytes([data[offset+2], data[offset+3]]),
            i16::from_le_bytes([data[offset+4], data[offset+5]]),
            i16::from_le_bytes([data[offset+6], data[offset+7]]),
        ];
        state.rotation = Some(codec::dequantize_quaternion(q));
        offset += 8;
    }

    // Action
    if mask & MASK_ACTION != 0 {
        if offset + 2 > data.len() { return None; }
        state.action = Some(data[offset]);
        state.hangtime = Some(data[offset + 1]);
        offset += 2;
    }

    // Left hand
    if mask & MASK_LEFT_HAND != 0 {
        if offset + 53 > data.len() { return None; }
        state.left_hand = Some(decode_hand_pose(data, &mut offset));
    }

    // Right hand
    if mask & MASK_RIGHT_HAND != 0 {
        if offset + 53 > data.len() { return None; }
        state.right_hand = Some(decode_hand_pose(data, &mut offset));
    }

    // Head quaternion
    if mask & MASK_HEAD_QUAT != 0 {
        if offset + 8 > data.len() { return None; }
        let q = [
            i16::from_le_bytes([data[offset], data[offset+1]]),
            i16::from_le_bytes([data[offset+2], data[offset+3]]),
            i16::from_le_bytes([data[offset+4], data[offset+5]]),
            i16::from_le_bytes([data[offset+6], data[offset+7]]),
        ];
        state.head_quat = Some(codec::dequantize_quaternion(q));
        offset += 8;
    }

    // Body state (3 bytes: flags, swim_blend, fly_pose_time)
    if mask & MASK_BODY_STATE != 0 {
        if offset + 3 > data.len() { return None; }
        state.body_flags = Some(data[offset]);
        state.swim_blend = Some(data[offset + 1]);
        state.fly_pose_time = Some(data[offset + 2]);
        offset += 3;
    }

    // VR presence (1 byte)
    if mask & MASK_VR_STATE != 0 {
        if offset + 1 > data.len() { return None; }
        state.vr_flags = Some(data[offset]);
        offset += 1;
    }

    let _ = offset; // suppress unused warning
    Some(state)
}

fn decode_hand_pose(data: &[u8], offset: &mut usize) -> DecodedHandPose {
    // Wrist quaternion (8 bytes)
    let wq = [
        i16::from_le_bytes([data[*offset], data[*offset+1]]),
        i16::from_le_bytes([data[*offset+2], data[*offset+3]]),
        i16::from_le_bytes([data[*offset+4], data[*offset+5]]),
        i16::from_le_bytes([data[*offset+6], data[*offset+7]]),
    ];
    *offset += 8;

    // Finger joints (45 bytes = 15 x 3)
    let mut finger_joints = [[0.0f32; 4]; 15];
    for joint in &mut finger_joints {
        let packed = [data[*offset] as i8, data[*offset+1] as i8, data[*offset+2] as i8];
        *joint = codec::unpack_axis_angle(packed);
        *offset += 3;
    }

    DecodedHandPose {
        wrist_quat: codec::dequantize_quaternion(wq),
        finger_joints,
    }
}

// ── Profile Announce ──

/// Encode a profile announce message.
///
/// Wire format (after 4-byte header):
///   [4..5]  u16  name_length (LE)
///   [6..]   utf8 inWorldName
///   [..]    u16  vrm_url_length (LE)
///   [..]    utf8 playerVRM url
///   [..]    u16  profile_image_length (LE)
///   [..]    utf8 profileImage url
pub fn encode_profile_announce(
    client_id_hash: u16,
    name: &str,
    vrm_url: &str,
    profile_image_url: &str,
) -> Vec<u8> {
    let payload_size = HEADER_SIZE
        + 2 + name.len()
        + 2 + vrm_url.len()
        + 2 + profile_image_url.len();

    let mut buf = Vec::with_capacity(payload_size);

    // Header
    buf.push(PROTOCOL_VERSION);
    buf.push(MSG_PROFILE_ANNOUNCE);
    buf.extend_from_slice(&client_id_hash.to_le_bytes());

    // Name
    let name_bytes = name.as_bytes();
    buf.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes());
    buf.extend_from_slice(name_bytes);

    // VRM URL
    let vrm_bytes = vrm_url.as_bytes();
    buf.extend_from_slice(&(vrm_bytes.len() as u16).to_le_bytes());
    buf.extend_from_slice(vrm_bytes);

    // Profile image URL
    let img_bytes = profile_image_url.as_bytes();
    buf.extend_from_slice(&(img_bytes.len() as u16).to_le_bytes());
    buf.extend_from_slice(img_bytes);

    buf
}

/// Decoded profile announce message.
pub struct DecodedProfile {
    pub client_id_hash: u16,
    pub name: String,
    pub vrm_url: String,
    pub profile_image_url: String,
}

/// Decode a binary profile announce message.
pub fn decode_profile_announce(data: &[u8]) -> Option<DecodedProfile> {
    if data.len() < HEADER_SIZE + 2 {
        return None;
    }
    if data[0] != PROTOCOL_VERSION || data[1] != MSG_PROFILE_ANNOUNCE {
        return None;
    }

    let client_id_hash = u16::from_le_bytes([data[2], data[3]]);
    let mut offset = HEADER_SIZE;

    let name = read_length_prefixed_string(data, &mut offset)?;
    let vrm_url = read_length_prefixed_string(data, &mut offset)?;
    let profile_image_url = read_length_prefixed_string(data, &mut offset)?;

    Some(DecodedProfile {
        client_id_hash,
        name,
        vrm_url,
        profile_image_url,
    })
}

/// Read a u16-length-prefixed UTF-8 string from the buffer.
fn read_length_prefixed_string(data: &[u8], offset: &mut usize) -> Option<String> {
    if *offset + 2 > data.len() {
        return None;
    }
    let len = u16::from_le_bytes([data[*offset], data[*offset + 1]]) as usize;
    *offset += 2;
    if *offset + len > data.len() {
        return None;
    }
    let s = std::str::from_utf8(&data[*offset..*offset + len]).ok()?.to_string();
    *offset += len;
    Some(s)
}

/// Detect message type from a binary protocol buffer.
/// Returns 0 for non-binary, otherwise the message_type byte.
pub fn get_message_type(data: &[u8]) -> u8 {
    if data.len() >= 2 && data[0] == PROTOCOL_VERSION {
        data[1]
    } else {
        0
    }
}

// ── Vehicle State ──

/// FNV-1a 32-bit hash of a stable vehicle id string. The JS side computes the
/// same value (`hashVehicleId` in vehicleStateStore.ts) so both peers key a
/// given world block identically.
pub fn hash_vehicle_id(id: &str) -> u32 {
    let mut hash: u32 = 2166136261;
    for byte in id.as_bytes() {
        hash ^= *byte as u32;
        hash = hash.wrapping_mul(16777619);
    }
    hash
}

/// Decoded vehicle state.
pub struct DecodedVehicle {
    pub client_id_hash: u16, // owner (driver) of the vehicle
    pub vehicle_id: u32,
    pub vehicle_type: u8,
    pub flags: u8,
    pub position: [f32; 3],
    pub rotation: [f32; 4],
    /// Front-wheel steer angle (radians). 0 for senders predating the steer
    /// byte (decoded from a 30-byte packet) and for non-steered vehicle types.
    pub steer: f32,
}

/// Encode a vehicle state message.
///
/// Wire format (after 4-byte header [ver, MSG_VEHICLE_STATE, client_id_hash]):
///   [4..7]   u32  vehicle_id (LE)
///   [8]      u8   vehicle_type
///   [9]      u8   flags (bit0 occupied)
///   [10..21] 3x f32  position (LE)
///   [22..29] 4x i16  rotation quaternion (quantized, LE)
///   [30]     i8   front-wheel steer (quantized over ±VEHICLE_STEER_RANGE)
/// Total: 31 bytes. Fixed layout (no presence mask) — vehicle packets always
/// carry the full transform; the tiered broadcaster rate-limits volume. The
/// steer byte is APPEND-ONLY: decoders treat a 30-byte packet (old sender) as
/// steer = 0, and an old decoder ignores the trailing byte.
pub fn encode_vehicle_state(
    client_id_hash: u16,
    vehicle_id: u32,
    vehicle_type: u8,
    flags: u8,
    position: [f32; 3],
    rotation: [f32; 4],
    steer: f32,
) -> Vec<u8> {
    let mut buf = Vec::with_capacity(HEADER_SIZE + 27);

    // Header
    buf.push(PROTOCOL_VERSION);
    buf.push(MSG_VEHICLE_STATE);
    buf.extend_from_slice(&client_id_hash.to_le_bytes());

    // Vehicle identity
    buf.extend_from_slice(&vehicle_id.to_le_bytes());
    buf.push(vehicle_type);
    buf.push(flags);

    // Position (3x f32)
    for v in &position {
        buf.extend_from_slice(&v.to_le_bytes());
    }

    // Rotation (quaternion as 4x i16)
    let q = codec::quantize_quaternion(rotation);
    for v in &q {
        buf.extend_from_slice(&v.to_le_bytes());
    }

    // Front-wheel steer (1 signed byte over ±VEHICLE_STEER_RANGE).
    let s = ((steer / VEHICLE_STEER_RANGE).clamp(-1.0, 1.0) * 127.0).round() as i8;
    buf.push(s as u8);

    buf
}

/// Decode a vehicle state message. Returns None if too short or wrong type.
pub fn decode_vehicle_state(data: &[u8]) -> Option<DecodedVehicle> {
    // header(4) + id(4) + type(1) + flags(1) + pos(12) + rot(8) = 30
    if data.len() < HEADER_SIZE + 26 {
        return None;
    }
    if data[0] != PROTOCOL_VERSION || data[1] != MSG_VEHICLE_STATE {
        return None;
    }

    let client_id_hash = u16::from_le_bytes([data[2], data[3]]);
    let mut offset = HEADER_SIZE;

    let vehicle_id = u32::from_le_bytes([
        data[offset], data[offset + 1], data[offset + 2], data[offset + 3],
    ]);
    offset += 4;
    let vehicle_type = data[offset];
    offset += 1;
    let flags = data[offset];
    offset += 1;

    let position = [
        f32::from_le_bytes([data[offset], data[offset + 1], data[offset + 2], data[offset + 3]]),
        f32::from_le_bytes([data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]]),
        f32::from_le_bytes([data[offset + 8], data[offset + 9], data[offset + 10], data[offset + 11]]),
    ];
    offset += 12;

    let q = [
        i16::from_le_bytes([data[offset], data[offset + 1]]),
        i16::from_le_bytes([data[offset + 2], data[offset + 3]]),
        i16::from_le_bytes([data[offset + 4], data[offset + 5]]),
        i16::from_le_bytes([data[offset + 6], data[offset + 7]]),
    ];
    let rotation = codec::dequantize_quaternion(q);

    // Steer byte is optional (append-only): absent in 30-byte packets → 0.
    let steer = if data.len() >= HEADER_SIZE + 27 {
        (data[offset + 8] as i8 as f32 / 127.0) * VEHICLE_STEER_RANGE
    } else {
        0.0
    };

    Some(DecodedVehicle {
        client_id_hash,
        vehicle_id,
        vehicle_type,
        flags,
        position,
        rotation,
        steer,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_state_update() {
        let pos = [1.5f32, 2.0, -3.5];
        let rot = [0.0f32, 0.707, 0.0, 0.707]; // 90 degree Y rotation
        let action = (ACTION_WALKING, 0u8);

        let encoded = encode_state_update(
            hash_client_id("test-peer"),
            Some(pos),
            Some(rot),
            Some(action),
            None, None, None, None, None,
        );

        // Should be: 4 header + 1 mask + 12 pos + 8 rot + 2 action = 27 bytes
        assert_eq!(encoded.len(), 27);
        assert_eq!(encoded[0], PROTOCOL_VERSION);
        assert_eq!(encoded[1], MSG_STATE_UPDATE);

        let decoded = decode_state_update(&encoded).unwrap();
        let dp = decoded.position.unwrap();
        for i in 0..3 {
            assert!((dp[i] - pos[i]).abs() < 0.001);
        }
        let dr = decoded.rotation.unwrap();
        for i in 0..4 {
            assert!((dr[i] - rot[i]).abs() < 0.001);
        }
        assert_eq!(decoded.action.unwrap(), ACTION_WALKING);
        assert_eq!(decoded.hangtime.unwrap(), 0);
    }

    #[test]
    fn json_detection() {
        assert!(!is_binary_protocol(b'{'));
        assert!(is_binary_protocol(PROTOCOL_VERSION));
    }

    #[test]
    fn position_only_update() {
        let encoded = encode_state_update(
            42, Some([10.0, 20.0, 30.0]), None, None, None, None, None, None, None,
        );
        // 4 header + 1 mask + 12 pos = 17 bytes
        assert_eq!(encoded.len(), 17);

        let decoded = decode_state_update(&encoded).unwrap();
        assert!(decoded.position.is_some());
        assert!(decoded.rotation.is_none());
        assert!(decoded.action.is_none());
    }

    #[test]
    fn roundtrip_vr_state() {
        let flags = VR_FLAG_IN_VR | VR_FLAG_LEFT_TRACKED;
        let encoded = encode_state_update(
            7, Some([1.0, 2.0, 3.0]), None, Some((ACTION_WALKING, 0)),
            None, None, None, None, Some(flags),
        );
        // 4 header + 1 mask + 12 pos + 2 action + 1 vr = 20 bytes
        assert_eq!(encoded.len(), 20);
        assert_ne!(encoded[4] & MASK_VR_STATE, 0);

        let decoded = decode_state_update(&encoded).unwrap();
        assert_eq!(decoded.vr_flags, Some(flags));

        // Sender without VR state → decoder reports None (not zero).
        let plain = encode_state_update(
            7, Some([1.0, 2.0, 3.0]), None, None, None, None, None, None, None,
        );
        assert_eq!(decode_state_update(&plain).unwrap().vr_flags, None);
    }

    #[test]
    fn roundtrip_profile_announce() {
        let hash = hash_client_id("test-peer");
        let encoded = encode_profile_announce(
            hash,
            "TestUser",
            "https://example.com/avatar.vrm",
            "https://example.com/pfp.png",
        );

        assert_eq!(encoded[0], PROTOCOL_VERSION);
        assert_eq!(encoded[1], MSG_PROFILE_ANNOUNCE);
        assert_eq!(get_message_type(&encoded), MSG_PROFILE_ANNOUNCE);

        let decoded = decode_profile_announce(&encoded).unwrap();
        assert_eq!(decoded.client_id_hash, hash);
        assert_eq!(decoded.name, "TestUser");
        assert_eq!(decoded.vrm_url, "https://example.com/avatar.vrm");
        assert_eq!(decoded.profile_image_url, "https://example.com/pfp.png");
    }

    #[test]
    fn roundtrip_vehicle_state() {
        let pos = [12.0f32, 3.5, -8.0];
        let rot = [0.0f32, 0.707, 0.0, 0.707];
        let vid = hash_vehicle_id("my-car");
        let encoded = encode_vehicle_state(
            hash_client_id("driver"),
            vid,
            5, // vehicle_type
            VEHICLE_FLAG_OCCUPIED,
            pos,
            rot,
            0.35, // steer (radians)
        );
        // 4 header + 4 id + 1 type + 1 flags + 12 pos + 8 rot + 1 steer = 31 bytes
        assert_eq!(encoded.len(), 31);
        assert_eq!(get_message_type(&encoded), MSG_VEHICLE_STATE);

        let decoded = decode_vehicle_state(&encoded).unwrap();
        assert_eq!(decoded.vehicle_id, vid);
        assert_eq!(decoded.vehicle_type, 5);
        assert_eq!(decoded.flags & VEHICLE_FLAG_OCCUPIED, VEHICLE_FLAG_OCCUPIED);
        for i in 0..3 {
            assert!((decoded.position[i] - pos[i]).abs() < 0.001);
        }
        for i in 0..4 {
            assert!((decoded.rotation[i] - rot[i]).abs() < 0.01);
        }
        // Steer round-trips within one quantization step (~0.006 rad).
        assert!((decoded.steer - 0.35).abs() < 0.01);

        // Back-compat: a 30-byte packet (no steer byte) decodes with steer = 0.
        let legacy = &encoded[..30];
        let dl = decode_vehicle_state(legacy).unwrap();
        assert_eq!(dl.steer, 0.0);
        assert_eq!(dl.vehicle_id, vid);
    }

    #[test]
    fn profile_announce_empty_strings() {
        let encoded = encode_profile_announce(1, "", "", "");
        let decoded = decode_profile_announce(&encoded).unwrap();
        assert_eq!(decoded.name, "");
        assert_eq!(decoded.vrm_url, "");
        assert_eq!(decoded.profile_image_url, "");
    }
}
