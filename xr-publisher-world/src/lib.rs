//! xr-publisher-world — WASM terrain generation for XR Publisher.
//!
//! Provides off-main-thread terrain mesh computation:
//! noise generation, flood fill, biome blending, and vertex normals.
//!
//! Structured for future ECS expansion (multiplayer, physics, spatial indexing).

pub mod ecs;
pub mod net;
pub mod terrain;
pub mod util;
pub mod world;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use std::cell::RefCell;

// Global state (safe because WASM is single-threaded within a worker)
thread_local! {
    static INTERP_STATE: RefCell<net::interpolation::InterpolationState> =
        RefCell::new(net::interpolation::InterpolationState::new());
    static STATE_DIFFER: RefCell<net::state::StateDiffer> =
        RefCell::new(net::state::StateDiffer::new());
}

#[derive(Deserialize)]
struct TerrainParams {
    width: usize,
    height: usize,
    segments: usize,
    scale: f64,
    #[serde(rename = "heightScale")]
    height_scale: f64,
    seed: String,
    #[serde(rename = "noiseOctaves")]
    noise_octaves: usize,
    #[serde(rename = "noisePersistence")]
    noise_persistence: f64,
    #[serde(rename = "noiseLacunarity")]
    noise_lacunarity: f64,
    #[serde(rename = "positionX")]
    position_x: f64,
    #[serde(rename = "positionZ")]
    position_z: f64,
    // Decoration params (optional — omit to skip decoration computation)
    #[serde(rename = "gridX", default)]
    grid_x: i32,
    #[serde(rename = "gridZ", default)]
    grid_z: i32,
    #[serde(rename = "positionY", default)]
    position_y: f64,
    #[serde(rename = "grassDensity", default = "default_density")]
    grass_density: f64,
    #[serde(rename = "boulderDensity", default = "default_density")]
    boulder_density: f64,
    #[serde(rename = "treeDensity", default)]
    tree_density: f64,
    #[serde(rename = "shrubDensity", default)]
    shrub_density: f64,
    #[serde(rename = "flowerDensity", default)]
    flower_density: f64,
    #[serde(rename = "isMobile", default)]
    is_mobile: bool,
    #[serde(rename = "skipMountains", default)]
    skip_mountains: bool,
    /// Mountains pre-generated on the JS side, passed in so that the
    /// Rust terrain matches the JS `MountainMesh` render list exactly.
    /// When present, Rust skips its internal mountain generator (whose
    /// distribution and cavern shape diverge from JS). When None, Rust
    /// falls back to its internal generator — useful for tests / non-JS
    /// callers but not the current runtime path.
    #[serde(default)]
    mountains: Option<Vec<terrain::mountain::JsMountainFeature>>,
}

fn default_density() -> f64 { 1.0 }

#[derive(Serialize)]
struct HighestPoint {
    x: f32,
    y: f32,
    z: f32,
}

/// Terrain result handed back to JS as a wasm-bindgen object rather than a
/// JSON string — same rationale (and same `take*` pattern) as
/// `MountainMeshResult` below: at segments=100 the result is ~61k floats of
/// positions+colors plus normals and five spawn arrays; serializing that to
/// a JSON String inside WASM linear memory set a permanent high-water mark
/// on the worker's WASM heap AND cost a serialize + JS-side `JSON.parse` +
/// typed-array copy per chunk on the single worker thread. The `take*`
/// methods move each Vec straight into a JS typed array (one copy, no JSON
/// string, no parse). `highestPoints` stays JSON — it's a few dozen entries.
#[wasm_bindgen]
pub struct TerrainGenResult {
    positions: Vec<f32>,
    colors: Vec<f32>,
    normals: Vec<f32>,
    grass_spawns: Vec<f32>,
    boulder_spawns: Vec<f32>,
    tree_spawns: Vec<f32>,
    shrub_spawns: Vec<f32>,
    flower_spawns: Vec<f32>,
    highest_points_json: String,
}

#[wasm_bindgen]
impl TerrainGenResult {
    #[wasm_bindgen(js_name = takePositions)]
    pub fn take_positions(&mut self) -> Vec<f32> { std::mem::take(&mut self.positions) }
    #[wasm_bindgen(js_name = takeColors)]
    pub fn take_colors(&mut self) -> Vec<f32> { std::mem::take(&mut self.colors) }
    #[wasm_bindgen(js_name = takeNormals)]
    pub fn take_normals(&mut self) -> Vec<f32> { std::mem::take(&mut self.normals) }
    #[wasm_bindgen(js_name = takeGrassSpawns)]
    pub fn take_grass_spawns(&mut self) -> Vec<f32> { std::mem::take(&mut self.grass_spawns) }
    #[wasm_bindgen(js_name = takeBoulderSpawns)]
    pub fn take_boulder_spawns(&mut self) -> Vec<f32> { std::mem::take(&mut self.boulder_spawns) }
    #[wasm_bindgen(js_name = takeTreeSpawns)]
    pub fn take_tree_spawns(&mut self) -> Vec<f32> { std::mem::take(&mut self.tree_spawns) }
    #[wasm_bindgen(js_name = takeShrubSpawns)]
    pub fn take_shrub_spawns(&mut self) -> Vec<f32> { std::mem::take(&mut self.shrub_spawns) }
    #[wasm_bindgen(js_name = takeFlowerSpawns)]
    pub fn take_flower_spawns(&mut self) -> Vec<f32> { std::mem::take(&mut self.flower_spawns) }
    #[wasm_bindgen(js_name = highestPointsJson)]
    pub fn highest_points_json(&mut self) -> String { std::mem::take(&mut self.highest_points_json) }
}

// ── Network protocol exports ──

/// Check if a byte buffer uses the binary network protocol (vs legacy JSON).
#[wasm_bindgen]
pub fn is_binary_protocol(first_byte: u8) -> bool {
    net::protocol::is_binary_protocol(first_byte)
}

/// Encode a player state update into compact binary format.
///
/// Arguments are flat arrays to avoid JS object overhead:
/// - position: Float32Array[3] (x, y, z)
/// - rotation: Float32Array[4] (quaternion x, y, z, w)
/// - action: u8 (0=idle, 1=walking, 2=running, 3=jumping, 4=jumpStop, 5=swimming, 6=flying)
/// - hangtime: u8
/// - client_id: string (hashed to u16 for the header)
///
/// Returns a Uint8Array ready for p2pcf.broadcast().
#[wasm_bindgen]
pub fn encode_player_state(
    position: &[f32],
    rotation: &[f32],
    action: u8,
    hangtime: u8,
    client_id: &str,
    body_flags: u8,
    swim_blend: u8,
    fly_pose_time: u8,
    vr_flags: Option<u8>,
) -> Vec<u8> {
    let pos = if position.len() >= 3 {
        Some([position[0], position[1], position[2]])
    } else {
        None
    };
    let rot = if rotation.len() >= 4 {
        Some([rotation[0], rotation[1], rotation[2], rotation[3]])
    } else {
        None
    };

    let client_id_hash = net::protocol::hash_client_id(client_id);

    let body_state = Some(net::protocol::BodyState {
        flags: body_flags,
        swim_blend,
        fly_pose_time,
    });

    net::protocol::encode_state_update(
        client_id_hash,
        pos,
        rot,
        Some((action, hangtime)),
        None, None, None,
        body_state,
        vr_flags,
    )
}

/// Encode a player state update with VR hand data.
///
/// - head_quat: Float32Array[4] (quaternion x,y,z,w)
/// - left_wrist_quat: Float32Array[4]
/// - left_fingers: Float32Array[60] (15 joints x 4 components)
/// - right_wrist_quat: Float32Array[4]
/// - right_fingers: Float32Array[60] (15 joints x 4 components)
#[wasm_bindgen]
pub fn encode_player_state_vr(
    position: &[f32],
    rotation: &[f32],
    action: u8,
    hangtime: u8,
    client_id: &str,
    head_quat: &[f32],
    left_wrist_quat: &[f32],
    left_fingers: &[f32],
    right_wrist_quat: &[f32],
    right_fingers: &[f32],
    body_flags: u8,
    swim_blend: u8,
    fly_pose_time: u8,
    vr_flags: Option<u8>,
) -> Vec<u8> {
    let pos = if position.len() >= 3 {
        Some([position[0], position[1], position[2]])
    } else {
        None
    };
    let rot = if rotation.len() >= 4 {
        Some([rotation[0], rotation[1], rotation[2], rotation[3]])
    } else {
        None
    };
    let hq = if head_quat.len() >= 4 {
        Some([head_quat[0], head_quat[1], head_quat[2], head_quat[3]])
    } else {
        None
    };

    let left_hand = parse_hand_pose(left_wrist_quat, left_fingers);
    let right_hand = parse_hand_pose(right_wrist_quat, right_fingers);

    let client_id_hash = net::protocol::hash_client_id(client_id);

    let body_state = Some(net::protocol::BodyState {
        flags: body_flags,
        swim_blend,
        fly_pose_time,
    });

    net::protocol::encode_state_update(
        client_id_hash,
        pos,
        rot,
        Some((action, hangtime)),
        hq,
        left_hand,
        right_hand,
        body_state,
        vr_flags,
    )
}

fn parse_hand_pose(wrist_quat: &[f32], fingers: &[f32]) -> Option<net::protocol::HandPose> {
    if wrist_quat.len() < 4 || fingers.len() < 60 {
        return None;
    }
    let mut finger_joints = [[0.0f32; 4]; 15];
    for i in 0..15 {
        let base = i * 4;
        finger_joints[i] = [fingers[base], fingers[base+1], fingers[base+2], fingers[base+3]];
    }
    Some(net::protocol::HandPose {
        wrist_quat: [wrist_quat[0], wrist_quat[1], wrist_quat[2], wrist_quat[3]],
        finger_joints,
    })
}

/// Decode a binary state update message.
/// Returns a JSON string with the decoded fields, or null if invalid/JSON message.
#[wasm_bindgen]
pub fn decode_player_state(data: &[u8]) -> JsValue {
    if data.is_empty() || !net::protocol::is_binary_protocol(data[0]) {
        return JsValue::NULL;
    }

    match net::protocol::decode_state_update(data) {
        Some(state) => {
            // Build a JSON object for the JS side
            let mut result = String::from("{");
            result.push_str(&format!("\"clientIdHash\":{}", state.client_id_hash));

            if let Some(pos) = state.position {
                result.push_str(&format!(",\"position\":[{},{},{}]", pos[0], pos[1], pos[2]));
            }
            if let Some(rot) = state.rotation {
                result.push_str(&format!(",\"rotation\":[{},{},{},{}]", rot[0], rot[1], rot[2], rot[3]));
            }
            if let Some(action) = state.action {
                result.push_str(&format!(",\"action\":{}", action));
            }
            if let Some(hangtime) = state.hangtime {
                result.push_str(&format!(",\"hangtime\":{}", hangtime));
            }
            if let Some(hq) = state.head_quat {
                result.push_str(&format!(",\"headQuat\":[{},{},{},{}]", hq[0], hq[1], hq[2], hq[3]));
            }
            if let Some(ref lh) = state.left_hand {
                result.push_str(",\"leftHand\":");
                encode_hand_json(&mut result, lh);
            }
            if let Some(ref rh) = state.right_hand {
                result.push_str(",\"rightHand\":");
                encode_hand_json(&mut result, rh);
            }
            if let Some(bf) = state.body_flags {
                result.push_str(&format!(",\"bodyFlags\":{}", bf));
            }
            if let Some(sb) = state.swim_blend {
                result.push_str(&format!(",\"swimBlend\":{}", sb));
            }
            if let Some(fpt) = state.fly_pose_time {
                result.push_str(&format!(",\"flyPoseTime\":{}", fpt));
            }
            if let Some(vf) = state.vr_flags {
                result.push_str(&format!(",\"vrFlags\":{}", vf));
            }

            result.push('}');
            JsValue::from_str(&result)
        }
        None => JsValue::NULL,
    }
}

fn encode_hand_json(result: &mut String, hand: &net::protocol::DecodedHandPose) {
    result.push_str(&format!(
        "{{\"wristQuat\":[{},{},{},{}],\"fingerJoints\":[",
        hand.wrist_quat[0], hand.wrist_quat[1], hand.wrist_quat[2], hand.wrist_quat[3]
    ));
    for (i, joint) in hand.finger_joints.iter().enumerate() {
        if i > 0 { result.push(','); }
        result.push_str(&format!("[{},{},{},{}]", joint[0], joint[1], joint[2], joint[3]));
    }
    result.push_str("]}");
}

// ── Profile announce exports ──

/// Encode a profile announce message for broadcasting once on connect.
#[wasm_bindgen]
pub fn encode_profile_announce(
    client_id: &str,
    name: &str,
    vrm_url: &str,
    profile_image_url: &str,
) -> Vec<u8> {
    let client_id_hash = net::protocol::hash_client_id(client_id);
    net::protocol::encode_profile_announce(client_id_hash, name, vrm_url, profile_image_url)
}

/// Decode a profile announce message. Returns JSON string or null.
#[wasm_bindgen]
pub fn decode_profile_announce(data: &[u8]) -> JsValue {
    match net::protocol::decode_profile_announce(data) {
        Some(profile) => {
            let json = format!(
                "{{\"clientIdHash\":{},\"name\":\"{}\",\"vrmUrl\":\"{}\",\"profileImage\":\"{}\"}}",
                profile.client_id_hash,
                profile.name.replace('\\', "\\\\").replace('"', "\\\""),
                profile.vrm_url.replace('\\', "\\\\").replace('"', "\\\""),
                profile.profile_image_url.replace('\\', "\\\\").replace('"', "\\\""),
            );
            JsValue::from_str(&json)
        }
        None => JsValue::NULL,
    }
}

/// Get the message type from a binary protocol buffer.
/// Returns 0 for non-binary messages, 1 for state_update, 2 for profile_announce,
/// 3 for vehicle_state.
#[wasm_bindgen]
pub fn get_message_type(data: &[u8]) -> u8 {
    net::protocol::get_message_type(data)
}

// ── Vehicle state exports ──

/// Encode a vehicle state message for broadcast. `client_id` is the driver
/// (owner). `vehicle_id` is the FNV-1a hash of the block's stable id string.
#[wasm_bindgen]
pub fn encode_vehicle_state(
    client_id: &str,
    vehicle_id: u32,
    vehicle_type: u8,
    flags: u8,
    position: &[f32],
    rotation: &[f32],
    steer: f32,
) -> Vec<u8> {
    let client_id_hash = net::protocol::hash_client_id(client_id);
    let pos = [
        position.first().copied().unwrap_or(0.0),
        position.get(1).copied().unwrap_or(0.0),
        position.get(2).copied().unwrap_or(0.0),
    ];
    let rot = [
        rotation.first().copied().unwrap_or(0.0),
        rotation.get(1).copied().unwrap_or(0.0),
        rotation.get(2).copied().unwrap_or(0.0),
        rotation.get(3).copied().unwrap_or(1.0),
    ];
    net::protocol::encode_vehicle_state(client_id_hash, vehicle_id, vehicle_type, flags, pos, rot, steer)
}

/// Decode a vehicle state message. Returns a JSON string or null.
#[wasm_bindgen]
pub fn decode_vehicle_state(data: &[u8]) -> JsValue {
    match net::protocol::decode_vehicle_state(data) {
        Some(v) => {
            let json = format!(
                "{{\"clientIdHash\":{},\"vehicleId\":{},\"vehicleType\":{},\"flags\":{},\"position\":[{},{},{}],\"rotation\":[{},{},{},{}],\"steer\":{}}}",
                v.client_id_hash,
                v.vehicle_id,
                v.vehicle_type,
                v.flags,
                v.position[0], v.position[1], v.position[2],
                v.rotation[0], v.rotation[1], v.rotation[2], v.rotation[3],
                v.steer,
            );
            JsValue::from_str(&json)
        }
        None => JsValue::NULL,
    }
}

// ── Delta-aware encoding ──

/// Encode a player state with delta compression.
/// Only sends fields that changed since the last call.
/// Returns an empty Vec if nothing changed and heartbeat interval hasn't elapsed.
#[wasm_bindgen]
pub fn encode_player_state_delta(
    position: &[f32],
    rotation: &[f32],
    action: u8,
    hangtime: u8,
    client_id: &str,
    current_time_ms: f64,
    body_flags: u8,
    swim_blend: u8,
    fly_pose_time: u8,
    vr_flags: Option<u8>,
) -> Vec<u8> {
    let state = net::state::PlayerState {
        position: if position.len() >= 3 {
            [position[0], position[1], position[2]]
        } else {
            [0.0; 3]
        },
        rotation: if rotation.len() >= 4 {
            [rotation[0], rotation[1], rotation[2], rotation[3]]
        } else {
            [0.0, 0.0, 0.0, 1.0]
        },
        action,
        hangtime,
        head_quat: None,
        left_hand: None,
        right_hand: None,
        body_flags,
        swim_blend,
        fly_pose_time,
        vr_flags,
    };

    let client_id_hash = net::protocol::hash_client_id(client_id);

    STATE_DIFFER.with(|differ| {
        differ.borrow_mut().encode_diff(&state, client_id_hash, current_time_ms)
            .unwrap_or_default()
    })
}

/// Reset the delta compressor state (e.g., on reconnect).
#[wasm_bindgen]
pub fn reset_state_differ() {
    STATE_DIFFER.with(|differ| {
        differ.borrow_mut().reset();
    });
}

// ── Interpolation exports ──

/// Push a peer state snapshot into the interpolation buffer.
#[wasm_bindgen]
pub fn interp_push_snapshot(
    peer_id_hash: u16,
    time_ms: f64,
    position: &[f32],   // length 3
    rotation: &[f32],   // length 4 (quaternion)
    action: u8,
    hangtime: u8,
) {
    if position.len() < 3 || rotation.len() < 4 {
        return;
    }
    INTERP_STATE.with(|state| {
        state.borrow_mut().push_snapshot(
            peer_id_hash,
            time_ms,
            [position[0], position[1], position[2]],
            [rotation[0], rotation[1], rotation[2], rotation[3]],
            action,
            hangtime,
        );
    });
}

/// Remove a peer from the interpolation state.
#[wasm_bindgen]
pub fn interp_remove_peer(peer_id_hash: u16) {
    INTERP_STATE.with(|state| {
        state.borrow_mut().remove_peer(peer_id_hash);
    });
}

/// Interpolate all active peers and write results into the output buffer.
///
/// `output` is a Float32Array with MAX_PEERS * 32 floats.
/// Returns the number of active peers with valid interpolated state.
///
/// Per-peer layout (32 floats):
///   [0..2]  position xyz
///   [3..6]  quaternion xyzw
///   [7]     action
///   [8]     hangtime
///   [9]     lastUpdateTimestamp
///   [10]    peerIdHash
///   [11..31] reserved
#[wasm_bindgen]
pub fn interp_update(current_time_ms: f64, output: &mut [f32]) -> u32 {
    INTERP_STATE.with(|state| {
        state.borrow().interpolate_all(current_time_ms, output)
    })
}

/// Reset all interpolation state.
#[wasm_bindgen]
pub fn interp_reset() {
    INTERP_STATE.with(|state| {
        *state.borrow_mut() = net::interpolation::InterpolationState::new();
    });
}

/// Configure the interpolation jitter buffer (milliseconds).
#[wasm_bindgen]
pub fn interp_set_render_delay(ms: f64) {
    INTERP_STATE.with(|state| {
        state.borrow_mut().set_render_delay(ms);
    });
}

/// FNV-1a 16-bit hash of a client id — the same hash the wire protocol uses.
/// Exposed so JS can map peer id strings to interpolation-slot hashes (e.g.
/// for legacy-JSON peers pushed into the interp buffer from the main thread).
#[wasm_bindgen(js_name = hash_client_id)]
pub fn hash_client_id_js(client_id: &str) -> u16 {
    net::protocol::hash_client_id(client_id)
}

// ── Combined decode + interpolation ingest ──

/// Event-payload field mask bits for `decode_and_ingest` (header slot [1]).
pub const INGEST_ACTION: u32 = 1 << 0;
pub const INGEST_BODY: u32 = 1 << 1;
pub const INGEST_VR_FLAGS: u32 = 1 << 2;
pub const INGEST_HEAD_QUAT: u32 = 1 << 3;
pub const INGEST_LEFT_HAND: u32 = 1 << 4;
pub const INGEST_RIGHT_HAND: u32 = 1 << 5;
pub const INGEST_HAD_TRANSFORM: u32 = 1 << 6;

fn append_hand(out: &mut Vec<f32>, hand: &net::protocol::DecodedHandPose) {
    out.extend_from_slice(&hand.wrist_quat);
    for joint in &hand.finger_joints {
        out.extend_from_slice(joint);
    }
}

/// Decode a binary state update AND push its transform into the interpolation
/// buffer in one call — transform data never crosses back to JS per packet
/// (the per-frame `interp_update` buffer carries it instead).
///
/// Returns a compact f32 event payload:
///   [0] clientIdHash
///   [1] fieldMask (INGEST_* bits)
///   [2] action        (valid if INGEST_ACTION)
///   [3] hangtime      (valid if INGEST_ACTION)
///   [4] bodyFlags     (valid if INGEST_BODY)
///   [5] swimBlend     (valid if INGEST_BODY)
///   [6] flyPoseTime   (valid if INGEST_BODY)
///   [7] vrFlags       (valid if INGEST_VR_FLAGS)
///   then appended in order when their mask bits are set:
///   headQuat f32x4, leftHand f32x64 (wrist quat + 15 joint quats),
///   rightHand f32x64.
///
/// Returns an empty Vec for invalid / non-state-update messages. Callers can
/// skip posting an event message when `fieldMask & 0b111111 == 0`.
#[wasm_bindgen]
pub fn decode_and_ingest(data: &[u8], recv_time_ms: f64) -> Vec<f32> {
    if data.is_empty() || !net::protocol::is_binary_protocol(data[0]) {
        return Vec::new();
    }
    let state = match net::protocol::decode_state_update(data) {
        Some(s) => s,
        None => return Vec::new(),
    };

    let mut mask: u32 = 0;
    let mut out = vec![0.0f32; 8];
    out[0] = state.client_id_hash as f32;

    if let Some(action) = state.action {
        mask |= INGEST_ACTION;
        out[2] = action as f32;
        out[3] = state.hangtime.unwrap_or(0) as f32;
    }
    if state.body_flags.is_some() || state.swim_blend.is_some() || state.fly_pose_time.is_some() {
        mask |= INGEST_BODY;
        out[4] = state.body_flags.unwrap_or(0) as f32;
        out[5] = state.swim_blend.unwrap_or(0) as f32;
        out[6] = state.fly_pose_time.unwrap_or(0) as f32;
    }
    if let Some(vf) = state.vr_flags {
        mask |= INGEST_VR_FLAGS;
        out[7] = vf as f32;
    }
    if let Some(hq) = state.head_quat {
        mask |= INGEST_HEAD_QUAT;
        out.extend_from_slice(&hq);
    }
    if let Some(ref lh) = state.left_hand {
        mask |= INGEST_LEFT_HAND;
        append_hand(&mut out, lh);
    }
    if let Some(ref rh) = state.right_hand {
        mask |= INGEST_RIGHT_HAND;
        append_hand(&mut out, rh);
    }

    // Push the transform into the interpolation buffer, filling the missing
    // half of partial (delta) packets from the newest stored snapshot.
    if state.position.is_some() || state.rotation.is_some() {
        mask |= INGEST_HAD_TRANSFORM;
        INTERP_STATE.with(|interp| {
            let mut interp = interp.borrow_mut();
            let prev = interp.newest_snapshot(state.client_id_hash);
            let position = state.position.or(prev.map(|p| p.0));
            let rotation = state
                .rotation
                .or(prev.map(|p| p.1))
                .unwrap_or([0.0, 0.0, 0.0, 1.0]);
            if let Some(position) = position {
                let action = state.action.or(prev.map(|p| p.2)).unwrap_or(0);
                let hangtime = state.hangtime.or(prev.map(|p| p.3)).unwrap_or(0);
                interp.push_snapshot(
                    state.client_id_hash,
                    recv_time_ms,
                    position,
                    rotation,
                    action,
                    hangtime,
                );
            }
        });
    }

    out[1] = mask as f32;
    out
}

// ── Spatial awareness exports ──

/// Compute per-peer send rate tiers based on distance from local player.
///
/// `local_position`: Float32Array[3] (x, y, z)
/// `peer_positions`: Float32Array[N*3] (x0,y0,z0, x1,y1,z1, ...)
/// `peer_count`: number of peers
///
/// Returns Uint8Array of per-peer tiers:
///   0 = full rate (0-10m), 1 = half (10-30m), 2 = quarter (30-100m), 3 = heartbeat (100m+)
#[wasm_bindgen]
pub fn compute_send_rates(
    local_position: &[f32],
    peer_positions: &[f32],
    peer_count: u32,
) -> Vec<u8> {
    let local = if local_position.len() >= 3 {
        [local_position[0], local_position[1], local_position[2]]
    } else {
        [0.0; 3]
    };
    ecs::spatial::compute_send_rates(local, peer_positions, peer_count)
}

/// Check if a frame should be sent for a given tier and frame counter.
#[wasm_bindgen]
pub fn should_send_frame(tier: u8, frame: u32) -> bool {
    ecs::spatial::should_send_frame(tier, frame)
}

/// Check if hand data should be included for a given tier.
#[wasm_bindgen]
pub fn should_send_hands(tier: u8) -> bool {
    ecs::spatial::should_send_hands(tier)
}

// ── Terrain generation ──

/// Generate a complete terrain chunk.
/// Takes JSON params, returns a `TerrainGenResult` handle whose `take*`
/// getters move each buffer straight into a JS typed array (zero-JSON
/// output — see the struct's note on the WASM-heap high-water mark).
#[wasm_bindgen]
pub fn generate_terrain(params_json: &str) -> Result<TerrainGenResult, JsError> {
    let params: TerrainParams =
        serde_json::from_str(params_json).map_err(|e| JsError::new(&e.to_string()))?;

    let width = params.width;
    let height = params.height;
    let segments = params.segments;
    let vertices_per_side = segments + 1;
    let total_verts = vertices_per_side * vertices_per_side;

    // 1. Generate heightfield
    let height_map = terrain::heightfield::generate_height_field(
        width,
        height,
        params.scale,
        &params.seed,
        params.noise_octaves,
        params.noise_persistence,
        params.noise_lacunarity,
        params.position_x,
        params.position_z,
    );

    // 2. Resolve mountains.
    //
    // Preferred path: JS has already built the mountain list (with
    // cavern networks + per-entrance `outwardDir`) via
    // `getMountainsNearChunk` and passed it in. Use it directly so
    // WASM terrain agrees with the JS `MountainMesh` render list AND
    // with the JS-fallback terrain path. This is the only way the
    // circular-crater regression stays out of the world: the JS-matching
    // directional ramp (`get_mountain_base_influence_js`) needs real
    // entrance outward directions, which Rust's internal stub generator
    // does not produce.
    //
    // Legacy path: if the caller didn't pass mountains (e.g. non-JS
    // tests, or `skip_mountains`), fall back to the internal Rust
    // generator with its radial-ramp base influence.
    let js_mountains_opt = if params.skip_mountains { None } else { params.mountains.as_ref() };
    let fallback_mountains = if params.skip_mountains || js_mountains_opt.is_some() {
        Vec::new()
    } else {
        let chunk_grid_x = (params.position_x / width as f64).round() as i32;
        let chunk_grid_z = (params.position_z / height as f64).round() as i32;
        terrain::mountain::get_mountains_near_chunk(
            chunk_grid_x,
            chunk_grid_z,
            width as f64,
            height as f64,
            &params.seed,
            width as f64 * 2.0,
        )
    };

    // 3. Build positions array (post-rotation: x=grid_x, y=height, z=grid_z)
    let mut positions = vec![0.0f32; total_verts * 3];
    let section_size = (segments / 10).max(1);
    let mut highest_points_map: std::collections::HashMap<String, HighestPoint> =
        std::collections::HashMap::new();
    let mut section_heights: std::collections::HashMap<String, f64> =
        std::collections::HashMap::new();

    for j in 0..=segments {
        for i in 0..=segments {
            let idx = j * vertices_per_side + i;
            let vertex_idx = idx * 3;

            let pixel_x = ((i as f64 / segments as f64) * (width as f64 - 1.0)).floor() as usize;
            let pixel_z =
                ((j as f64 / segments as f64) * (height as f64 - 1.0)).floor() as usize;
            let pixel_index = pixel_z * width + pixel_x;

            let world_x = params.position_x + (i as f64 / segments as f64 - 0.5) * width as f64;
            let world_z = params.position_z + (j as f64 / segments as f64 - 0.5) * height as f64;

            let mut terrain_height = util::math::map_range(
                height_map[pixel_index] as f64,
                0.0,
                1.0,
                -params.height_scale,
                params.height_scale,
            );
            if !params.skip_mountains {
                let biome_multiplier =
                    terrain::biome::get_biome_height_multiplier(world_x, world_z, &params.seed);
                terrain_height *= biome_multiplier;
                // Rare ocean basins: large smooth depressions below the
                // water level. MUST mirror createTerrainMesh in
                // terrainHelpers.ts exactly (WASM/JS parity).
                terrain_height -= terrain::biome::get_ocean_fade(world_x, world_z, &params.seed)
                    * params.height_scale
                    * 0.5;
                terrain_height += if let Some(js_mtns) = js_mountains_opt {
                    terrain::mountain::get_mountain_base_influence_js(world_x, world_z, js_mtns)
                } else {
                    terrain::mountain::get_mountain_base_influence(
                        world_x,
                        world_z,
                        &fallback_mountains,
                    )
                };
            }

            // Post-rotation coordinates: x=grid_x, y=height, z=grid_z
            positions[vertex_idx] =
                (i as f64 / segments as f64 - 0.5) as f32 * width as f32;
            positions[vertex_idx + 1] = terrain_height as f32;
            positions[vertex_idx + 2] =
                (j as f64 / segments as f64 - 0.5) as f32 * height as f32;

            // Track highest points per section
            let section_x = i / section_size;
            let section_z = j / section_size;
            let section_key = format!("{},{}", section_x, section_z);

            let current_max = section_heights.get(&section_key).copied().unwrap_or(f64::NEG_INFINITY);
            if terrain_height > current_max {
                section_heights.insert(section_key.clone(), terrain_height);
                highest_points_map.insert(
                    section_key,
                    HighestPoint {
                        x: i as f32,
                        y: terrain_height as f32,
                        z: j as f32,
                    },
                );
            }
        }
    }

    // 4. Flood fill water distance
    let water_distance =
        terrain::flood_fill::compute_water_distance(&positions, segments, params.height_scale);

    // 5. Assign colors
    let mut colors = vec![0.0f32; total_verts * 3];
    for j in 0..=segments {
        for i in 0..=segments {
            let idx = j * vertices_per_side + i;
            let vertex_idx = idx * 3;
            let terrain_height = positions[vertex_idx + 1] as f64;
            let normalized_height = util::math::map_range(
                terrain_height,
                -params.height_scale,
                params.height_scale,
                0.0,
                1.0,
            );
            let water_dist = water_distance[idx];

            // Base terrain color
            let (mut r, mut g, mut b) =
                if normalized_height >= 0.48 && normalized_height < 0.56 && water_dist > 0.0 && water_dist <= 6.0
                {
                    let rocky = terrain::biome::hex_to_rgb(0xa89d8a);
                    let dark_green = terrain::biome::hex_to_rgb(0x228800);
                    let blend = ((water_dist - 1.0) / 5.0).clamp(0.0, 1.0);
                    (
                        rocky.0 + (dark_green.0 - rocky.0) * blend,
                        rocky.1 + (dark_green.1 - rocky.1) * blend,
                        rocky.2 + (dark_green.2 - rocky.2) * blend,
                    )
                } else if normalized_height < 0.48 {
                    terrain::biome::hex_to_rgb(0x2d5f6f)
                } else if normalized_height < 0.50 {
                    terrain::biome::hex_to_rgb(0x228800)
                } else if normalized_height < 0.53 {
                    terrain::biome::hex_to_rgb(0x4a7c59)
                } else if normalized_height < 0.56 {
                    terrain::biome::hex_to_rgb(0x6b9b6e)
                } else if normalized_height < 0.58 {
                    terrain::biome::hex_to_rgb(0x8db68d)
                // Above the meadow band: dry vegetation → earth → rock. Snow-white
                // is reserved for ≥0.90 — unreachable on the plain heightfield
                // (default biome tops out ~0.665), only mountain-base-lifted
                // terrain right at real peaks gets it. The old ramp went flat
                // grey at 0.58, which put "snow" caps on ordinary warm hills.
                // NOTE: keep every tier ≥0.58 non-green-dominant (g <= r*1.1) —
                // decoration spawns cap at 0.58 by height, but blended border
                // colors feed the is_green spawn checks.
                } else if normalized_height < 0.62 {
                    terrain::biome::hex_to_rgb(0x9aa06f) // dry sage grass
                } else if normalized_height < 0.68 {
                    terrain::biome::hex_to_rgb(0x9a8f72) // sun-dried earth
                } else if normalized_height < 0.78 {
                    terrain::biome::hex_to_rgb(0x8d867c) // rocky grey-brown
                } else if normalized_height < 0.90 {
                    terrain::biome::hex_to_rgb(0x9a9a9a) // bare rock
                } else {
                    terrain::biome::hex_to_rgb(0xe8edf2) // snow — extreme peaks only
                };

            // Biome blending (skip in editor/skipMountains mode for consistent chunk edges)
            if !params.skip_mountains {
            let biome_world_x =
                params.position_x + (i as f64 / segments as f64 - 0.5) * width as f64;
            let biome_world_z =
                params.position_z + (j as f64 / segments as f64 - 0.5) * height as f64;
            let weights =
                terrain::biome::get_biome_weights(biome_world_x, biome_world_z, &params.seed);

            let non_default_weight = 1.0 - weights[4];
            if non_default_weight > 0.01 {
                let biomes = [
                    terrain::biome::BiomeId::Mountains,
                    terrain::biome::BiomeId::Wetlands,
                    terrain::biome::BiomeId::Buildable,
                    terrain::biome::BiomeId::Plains,
                    terrain::biome::BiomeId::Default,
                ];
                let mut br = 0.0f32;
                let mut bg = 0.0f32;
                let mut bb = 0.0f32;
                for (bi, biome_id) in biomes.iter().enumerate() {
                    let w = weights[bi] as f32;
                    if w < 0.01 {
                        continue;
                    }
                    if let Some(bc) = terrain::biome::get_biome_terrain_color(
                        *biome_id,
                        normalized_height,
                        water_dist,
                    ) {
                        br += bc.0 * w;
                        bg += bc.1 * w;
                        bb += bc.2 * w;
                    } else {
                        br += r * w;
                        bg += g * w;
                        bb += b * w;
                    }
                }
                r = br;
                g = bg;
                b = bb;
            }
            } // end if !skip_mountains (biome blending)

            colors[vertex_idx] = r;
            colors[vertex_idx + 1] = g;
            colors[vertex_idx + 2] = b;
        }
    }

    // 6. Compute normals
    let normals = terrain::normals::compute_vertex_normals(&positions, segments);

    // 7. Collect highest points
    let highest_points: Vec<HighestPoint> = highest_points_map
        .into_values()
        .filter(|p| p.x.is_finite() && p.y.is_finite() && p.z.is_finite())
        .collect();

    // 8. Compute decoration spawn positions
    let grass_spawns = terrain::decorations::compute_grass_spawns(
        &positions, &colors, segments, params.height_scale,
        &params.seed, params.grid_x, params.grid_z,
        params.grass_density, params.is_mobile,
    );
    let boulder_spawns = terrain::decorations::compute_boulder_spawns(
        &positions, segments, params.height_scale,
        &params.seed, params.grid_x, params.grid_z,
        params.boulder_density, params.is_mobile,
    );
    let tree_spawns = terrain::decorations::compute_tree_spawns(
        &positions, &colors, segments, params.height_scale,
        &params.seed, params.grid_x, params.grid_z,
        params.tree_density, width as f64, height as f64,
        params.position_y, params.is_mobile,
    );
    let shrub_spawns = terrain::decorations::compute_shrub_spawns(
        &positions, &colors, segments, params.height_scale,
        &params.seed, params.grid_x, params.grid_z,
        params.shrub_density, params.is_mobile,
    );
    let flower_spawns = terrain::decorations::compute_flower_spawns(
        &positions, &colors, segments, params.height_scale,
        &params.seed, params.grid_x, params.grid_z,
        params.flower_density, params.is_mobile,
    );

    let highest_points_json = serde_json::to_string(&highest_points)
        .map_err(|e| JsError::new(&e.to_string()))?;

    Ok(TerrainGenResult {
        positions,
        colors,
        normals,
        grass_spawns,
        boulder_spawns,
        tree_spawns,
        shrub_spawns,
        flower_spawns,
        highest_points_json,
    })
}

// ── Mountain mesh generation (SDF + marching cubes) ──

/// Mountain mesh result handed back to JS as a wasm-bindgen object rather
/// than a JSON string. The mesh can be ~300k numbers; serializing it to a
/// JSON String inside WASM linear memory set a permanent high-water mark on
/// the worker's WASM heap (WebAssembly memory only ever grows), which —
/// inside a large mountain — ate the headroom the avatar needed and tripped
/// iOS Safari's memory watchdog. The `take*` methods move each Vec out
/// directly into a JS typed array (one copy, no JSON string, no JS-side
/// parse), so the WASM heap peak is just the mesh buffers themselves.
#[wasm_bindgen]
pub struct MountainMeshResult {
    positions: Vec<f32>,
    colors: Vec<f32>,
    normals: Vec<f32>,
    indices: Vec<u32>,
    interior_depths: Vec<f32>,
}

#[wasm_bindgen]
impl MountainMeshResult {
    #[wasm_bindgen(js_name = takePositions)]
    pub fn take_positions(&mut self) -> Vec<f32> { std::mem::take(&mut self.positions) }
    #[wasm_bindgen(js_name = takeColors)]
    pub fn take_colors(&mut self) -> Vec<f32> { std::mem::take(&mut self.colors) }
    #[wasm_bindgen(js_name = takeNormals)]
    pub fn take_normals(&mut self) -> Vec<f32> { std::mem::take(&mut self.normals) }
    #[wasm_bindgen(js_name = takeIndices)]
    pub fn take_indices(&mut self) -> Vec<u32> { std::mem::take(&mut self.indices) }
    #[wasm_bindgen(js_name = takeInteriorDepths)]
    pub fn take_interior_depths(&mut self) -> Vec<f32> { std::mem::take(&mut self.interior_depths) }
}

/// Generate a mountain mesh in WASM. Replaces the JS `createMountainGeometry`
/// path. Params are pre-flattened by `worldHelpers.ts::buildMountainMeshParams`
/// (cavern network + interior-fill PRNG stay in JS for cursor parity), so this
/// is a pure function of its input and bit-comparable against the JS path.
///
/// Returns a `MountainMeshResult` handle (same zero-JSON `take*` marshaling
/// pattern as `generate_terrain`'s `TerrainGenResult`).
#[wasm_bindgen]
pub fn generate_mountain_mesh(params_json: &str) -> Result<MountainMeshResult, JsError> {
    use crate::terrain::mountain::MountainShape;
    use crate::terrain::noise::SimplexNoise3D;
    use crate::terrain::{marching_cubes, normals, sdf};

    let params: sdf::MountainMeshParams =
        serde_json::from_str(params_json).map_err(|e| JsError::new(&e.to_string()))?;

    let noise = SimplexNoise3D::new(&format!("{}-{}-noise", params.seed, params.mountain_id));
    let main_shape = MountainShape::from_js(&params.shape);

    let cell_size = 2.5f64;
    let pad = params.base_radius * 0.15;
    // Use the explicit cluster-spanning bounds from JS when provided; fall
    // back to the single-mountain box otherwise.
    let bounds_min = params.bounds_min.unwrap_or([
        -(params.base_radius + pad),
        -6.0,
        -(params.base_radius + pad),
    ]);
    let bounds_max = params.bounds_max.unwrap_or([
        params.base_radius + pad,
        params.peak_height * 1.05,
        params.base_radius + pad,
    ]);

    let mesh = marching_cubes::generate_mesh_from_sdf(
        bounds_min,
        bounds_max,
        cell_size,
        |x, y, z| sdf::combined_sdf(x, y, z, &params, main_shape, &noise),
        |x, y, z| sdf::color_fn(x, y, z, &params, main_shape, &noise, cell_size),
        |x, y, z| sdf::depth_fn(x, y, z, &params, main_shape, &noise, cell_size),
    );

    let result = match mesh {
        Some(m) => {
            // Normals on the full welded mesh — JS computes them inside
            // generateMeshFromSDF, before deletion-sphere culling.
            let normals_vec = normals::compute_indexed_vertex_normals(&m.positions, &m.indices);
            let indices = cull_deletion_spheres(&m.positions, &m.indices, &params.deletion_spheres);
            MountainMeshResult {
                positions: m.positions,
                colors: m.colors,
                normals: normals_vec,
                indices,
                interior_depths: m.depths,
            }
        }
        None => {
            // Degenerate fallback (matches the JS gray triangle) but WITH
            // normals so the consumer's normal.array read never throws.
            let positions = vec![0.0f32, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0];
            let colors = vec![0.5f32; 9];
            let indices = vec![0u32, 1, 2];
            let normals_vec = normals::compute_indexed_vertex_normals(&positions, &indices);
            MountainMeshResult {
                positions,
                colors,
                normals: normals_vec,
                indices,
                interior_depths: vec![0.0f32; 3],
            }
        }
    };

    Ok(result)
}

/// Deletion-sphere triangle culling — drops triangles whose centroid falls
/// inside any cavern-entrance sphere (worldHelpers.ts:622-650). Centroids are
/// summed in f64 (each f32 coord promoted first) to match JS arithmetic.
fn cull_deletion_spheres(
    positions: &[f32],
    indices: &[u32],
    spheres: &[crate::terrain::sdf::DeletionSphere],
) -> Vec<u32> {
    if spheres.is_empty() {
        return indices.to_vec();
    }
    let mut out = Vec::with_capacity(indices.len());
    let mut t = 0;
    while t + 2 < indices.len() {
        let i0 = indices[t] as usize;
        let i1 = indices[t + 1] as usize;
        let i2 = indices[t + 2] as usize;
        let cx = (positions[i0 * 3] as f64 + positions[i1 * 3] as f64 + positions[i2 * 3] as f64) / 3.0;
        let cy = (positions[i0 * 3 + 1] as f64 + positions[i1 * 3 + 1] as f64 + positions[i2 * 3 + 1] as f64) / 3.0;
        let cz = (positions[i0 * 3 + 2] as f64 + positions[i1 * 3 + 2] as f64 + positions[i2 * 3 + 2] as f64) / 3.0;
        let mut kill = false;
        for s in spheres {
            let dx = cx - s.x;
            let dy = cy - s.y;
            let dz = cz - s.z;
            if dx * dx + dy * dy + dz * dz < s.r_sq {
                kill = true;
                break;
            }
        }
        if !kill {
            out.push(indices[t]);
            out.push(indices[t + 1]);
            out.push(indices[t + 2]);
        }
        t += 3;
    }
    out
}

#[cfg(test)]
mod ingest_tests {
    use super::*;

    #[test]
    fn decode_and_ingest_roundtrip() {
        interp_reset();
        interp_set_render_delay(0.0);

        let hash = net::protocol::hash_client_id("peer-a");
        let packet = net::protocol::encode_state_update(
            hash,
            Some([1.0, 2.0, 3.0]),
            Some([0.0, 0.0, 0.0, 1.0]),
            Some((2, 0)), // running
            None, None, None,
            Some(net::protocol::BodyState { flags: 0x02, swim_blend: 0, fly_pose_time: 128 }),
            Some(0x01),
        );

        let events = decode_and_ingest(&packet, 1000.0);
        assert_eq!(events[0] as u16, hash);
        let mask = events[1] as u32;
        assert!(mask & INGEST_ACTION != 0);
        assert!(mask & INGEST_BODY != 0);
        assert!(mask & INGEST_VR_FLAGS != 0);
        assert!(mask & INGEST_HAD_TRANSFORM != 0);
        assert_eq!(events[2], 2.0); // action
        assert_eq!(events[4], 2.0); // bodyFlags
        assert_eq!(events[7], 1.0); // vrFlags

        // Second snapshot so interpolation has a pair to work with.
        let packet2 = net::protocol::encode_state_update(
            hash,
            Some([3.0, 2.0, 3.0]),
            Some([0.0, 0.0, 0.0, 1.0]),
            Some((2, 0)),
            None, None, None, None, None,
        );
        decode_and_ingest(&packet2, 1100.0);

        let mut out = vec![0.0f32; 32 * 32];
        let count = interp_update(1050.0, &mut out);
        assert_eq!(count, 1);
        assert!((out[0] - 2.0).abs() < 0.01, "interpolated x, got {}", out[0]);
        assert_eq!(out[10] as u16, hash);
    }

    #[test]
    fn partial_delta_fills_from_history() {
        interp_reset();
        let hash = net::protocol::hash_client_id("peer-b");
        // Keyframe with full transform.
        let full = net::protocol::encode_state_update(
            hash,
            Some([5.0, 0.0, 0.0]),
            Some([0.0, 0.7071, 0.0, 0.7071]),
            Some((1, 0)),
            None, None, None, None, None,
        );
        decode_and_ingest(&full, 0.0);
        // Position-only delta: rotation must carry over from the keyframe.
        let partial = net::protocol::encode_state_update(
            hash,
            Some([6.0, 0.0, 0.0]),
            None, None, None, None, None, None, None,
        );
        let events = decode_and_ingest(&partial, 50.0);
        assert_eq!(events[1] as u32 & 0b111111, 0, "transform-only packet must carry no event bits");

        let mut out = vec![0.0f32; 32 * 32];
        interp_set_render_delay(0.0);
        assert_eq!(interp_update(50.0, &mut out), 1);
        assert!((out[4] - 0.7071).abs() < 0.01, "rotation carried from keyframe, got {}", out[4]);
    }
}
