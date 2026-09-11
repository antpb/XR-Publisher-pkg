/**
 * Network Worker Protocol
 *
 * Discriminated union message types for communication between
 * the main thread and the network Web Worker.
 *
 * The worker handles binary encoding/decoding of player state
 * via WASM, keeping serialization off the main thread.
 */

// ── Action enum (matches Rust protocol constants) ──

export const ACTION_IDLE = 0;
export const ACTION_WALKING = 1;
export const ACTION_RUNNING = 2;
export const ACTION_JUMPING = 3;
export const ACTION_JUMP_STOP = 4;
export const ACTION_SWIMMING = 5;
export const ACTION_FLYING = 6;

/** Map from string action names (used by existing code) to binary enum values */
export const ACTION_MAP: Record<string, number> = {
  idle: ACTION_IDLE,
  walking: ACTION_WALKING,
  running: ACTION_RUNNING,
  jumping: ACTION_JUMPING,
  jumpStop: ACTION_JUMP_STOP,
  swimming: ACTION_SWIMMING,
  flying: ACTION_FLYING,
};

/** Reverse map from binary enum to string action names */
export const ACTION_NAMES: Record<number, string> = {
  [ACTION_IDLE]: 'idle',
  [ACTION_WALKING]: 'walking',
  [ACTION_RUNNING]: 'running',
  [ACTION_JUMPING]: 'jumping',
  [ACTION_JUMP_STOP]: 'jumpStop',
  [ACTION_SWIMMING]: 'swimming',
  [ACTION_FLYING]: 'flying',
};

// ── Requests (main thread → worker) ──

export interface EncodeStateRequest {
  type: 'encode_state';
  id: number;
  clientId: string;
  position: Float32Array; // length 3
  rotation: Float32Array; // length 4 (quaternion x,y,z,w)
  action: number;         // ACTION_* enum value
  hangtime: number;
  bodyFlags: number;      // bit 0: swimming, bit 1: flying, bit 2: boosting
  swimBlend: number;      // 0-255 quantized from 0.0-1.0
  flyPoseTime: number;    // 0-255 quantized from 0.0-2.0s
  /** VR presence bits: bit0 inVR, bit1 leftHandTracked, bit2 rightHandTracked.
   *  Omit for non-VR-aware senders. */
  vrFlags?: number;
}

export interface EncodeStateVRRequest {
  type: 'encode_state_vr';
  id: number;
  clientId: string;
  position: Float32Array;
  rotation: Float32Array;
  action: number;
  hangtime: number;
  headQuat: Float32Array;       // length 4
  leftWristQuat: Float32Array;  // length 4
  leftFingers: Float32Array;    // length 60 (15 joints x 4 components)
  rightWristQuat: Float32Array; // length 4
  rightFingers: Float32Array;   // length 60
  bodyFlags: number;
  swimBlend: number;
  flyPoseTime: number;
  /** VR presence bits: bit0 inVR, bit1 leftHandTracked, bit2 rightHandTracked. */
  vrFlags?: number;
}

export interface EncodeStateDeltaRequest {
  type: 'encode_state_delta';
  id: number;
  clientId: string;
  position: Float32Array;
  rotation: Float32Array;
  action: number;
  hangtime: number;
  currentTimeMs: number;
  bodyFlags: number;
  swimBlend: number;
  flyPoseTime: number;
  /** VR presence bits: bit0 inVR, bit1 leftHandTracked, bit2 rightHandTracked.
   *  Omit for non-VR-aware senders. */
  vrFlags?: number;
}

export interface EncodeProfileRequest {
  type: 'encode_profile';
  id: number;
  clientId: string;
  name: string;
  vrmUrl: string;
  profileImageUrl: string;
}

export interface EncodeVehicleStateRequest {
  type: 'encode_vehicle_state';
  id: number;
  clientId: string;        // driver/owner client id
  vehicleId: number;       // FNV-1a hash of the block's stable id string (u32)
  vehicleType: number;     // 0=car,1=bike,2=flying,3=hovering,4=animal,5=train,6=coaster
  flags: number;           // bit0 occupied
  position: Float32Array;  // length 3
  rotation: Float32Array;  // length 4 (quaternion x,y,z,w)
  steer: number;           // front-wheel steer angle (radians), 0 for non-steered types
}

export interface DecodeStateRequest {
  type: 'decode_state';
  id: number;
  data: Uint8Array;
}

// ── Worker-owned interpolation (see crates .../net/interpolation.rs) ──
//
// Binary state packets are ingested INSIDE the worker: decode + push into the
// Rust interpolation buffer happen in one WASM call, and only non-transform
// events (action changes, body state, VR poses) are forwarded to the main
// thread. Transforms reach the main thread solely via the per-frame
// `interp_tick` → `interp_frame` ping-pong buffer.

/** Floats per peer slot in the interp buffer (matches Rust FLOATS_PER_PEER). */
export const INTERP_FLOATS_PER_PEER = 32;
/** Max peers in the interp buffer (matches Rust MAX_PEERS). */
export const INTERP_MAX_PEERS = 32;

/** Event mask bits in the ingest event payload (match Rust INGEST_*). */
export const EVT_ACTION = 1 << 0;
export const EVT_BODY = 1 << 1;
export const EVT_VR_FLAGS = 1 << 2;
export const EVT_HEAD_QUAT = 1 << 3;
export const EVT_LEFT_HAND = 1 << 4;
export const EVT_RIGHT_HAND = 1 << 5;
export const EVT_HAD_TRANSFORM = 1 << 6;
/** Any bit that requires forwarding an event message to the main thread. */
export const EVT_FORWARD_MASK =
  EVT_ACTION | EVT_BODY | EVT_VR_FLAGS | EVT_HEAD_QUAT | EVT_LEFT_HAND | EVT_RIGHT_HAND;

/** Ingest a binary packet: decode + interp push in the worker. */
export interface IngestRequest {
  type: 'ingest';
  data: Uint8Array;
  /** p2pcf client id of the sending peer (maps interp slots back to peers). */
  peerId: string;
  /** Receive time (Date.now() on main — same clock as interp_tick). */
  timeMs: number;
}

/** Push a transform snapshot for a legacy-JSON peer into the interp buffer. */
export interface PushSnapshotRequest {
  type: 'push_snapshot';
  peerId: string;
  timeMs: number;
  position: [number, number, number];
  rotation: [number, number, number, number];
  action: number;
  hangtime: number;
}

/** Per-frame interpolation tick. `buffer` is transferred, filled, returned. */
export interface InterpTickRequest {
  type: 'interp_tick';
  nowMs: number;
  buffer: Float32Array;
}

export interface RemoveInterpPeerRequest {
  type: 'remove_peer';
  peerId: string;
}

export interface SetRenderDelayRequest {
  type: 'set_render_delay';
  ms: number;
}

/** Clear all interpolation state (new session). */
export interface ResetInterpRequest {
  type: 'reset_interp';
}

/** Reset the WASM delta compressor (call on connect/reconnect so the
 *  first packet to a fresh session is a full keyframe). */
export interface ResetDifferRequest {
  type: 'reset_differ';
  id: number;
}

export type NetworkWorkerRequest =
  | EncodeStateRequest
  | EncodeStateVRRequest
  | EncodeStateDeltaRequest
  | EncodeProfileRequest
  | EncodeVehicleStateRequest
  | DecodeStateRequest
  | ResetDifferRequest
  | IngestRequest
  | PushSnapshotRequest
  | InterpTickRequest
  | RemoveInterpPeerRequest
  | SetRenderDelayRequest
  | ResetInterpRequest;

// ── Responses (worker → main thread) ──

export interface EncodeStateResponse {
  type: 'encoded';
  id: number;
  data: Uint8Array;
}

export interface DecodeStateResponse {
  type: 'decoded';
  id: number;
  /** JSON string from WASM decode, or null if legacy JSON message */
  state: string | null;
  /** True if the message was legacy JSON (starts with '{') */
  isLegacyJson: boolean;
  /** The original data, passed back for legacy JSON path */
  rawData?: Uint8Array;
  /** Message type: 1=state_update, 2=profile_announce, 3=vehicle_state */
  messageType?: number;
}

export interface DecodeProfileResponse {
  type: 'decoded_profile';
  id: number;
  profile: string; // JSON string with clientIdHash, name, vrmUrl, profileImage
}

export interface NetworkWorkerErrorResponse {
  type: 'error';
  id: number;
  message: string;
}

export interface NetworkWorkerReadyResponse {
  type: 'ready';
  wasmLoaded: boolean;
}

/** Non-transform events decoded from an ingested packet.
 *  `events` layout matches Rust decode_and_ingest:
 *  [0]=clientIdHash [1]=fieldMask [2]=action [3]=hangtime [4]=bodyFlags
 *  [5]=swimBlend [6]=flyPoseTime [7]=vrFlags, then mask-gated appends:
 *  headQuat f32x4, leftHand f32x64, rightHand f32x64. */
export interface PeerEventsResponse {
  type: 'peer_events';
  peerId: string;
  events: Float32Array;
}

/** Interpolated peer transforms for one frame. `buffer` holds `count` slots
 *  of INTERP_FLOATS_PER_PEER floats; `peerIds[i]` names slot i's peer. */
export interface InterpFrameResponse {
  type: 'interp_frame';
  buffer: Float32Array;
  count: number;
  peerIds: (string | null)[];
}

export type NetworkWorkerResponse =
  | EncodeStateResponse
  | DecodeStateResponse
  | DecodeProfileResponse
  | PeerEventsResponse
  | InterpFrameResponse
  | NetworkWorkerErrorResponse
  | NetworkWorkerReadyResponse;
