/**
 * Network Encoding/Decoding Web Worker
 *
 * Primary path: Rust/WASM binary protocol encoding/decoding (fast, compact).
 * Fallback path: Pass-through for legacy JSON messages.
 *
 * The WASM binary is loaded from a base64-encoded string (same pattern as terrainWorker).
 */
import {
  EVT_FORWARD_MASK,
  INTERP_FLOATS_PER_PEER,
  type NetworkWorkerRequest,
  type NetworkWorkerResponse,
} from './networkWorker.protocol';

// Import the WASM bindings and base64 binary statically
import {
  initSync,
  encode_player_state,
  encode_player_state_vr,
  encode_player_state_delta,
  encode_profile_announce,
  encode_vehicle_state,
  decode_player_state,
  decode_profile_announce,
  decode_vehicle_state,
  decode_and_ingest,
  get_message_type,
  hash_client_id,
  interp_push_snapshot,
  interp_remove_peer,
  interp_reset,
  interp_set_render_delay,
  interp_update,
  is_binary_protocol,
  reset_state_differ,
} from './wasm/xr_publisher_world.js';
// @ts-ignore - raw import of base64 WASM binary
import wasmBase64 from './wasm/xr_publisher_world_bg.wasm.b64?raw';

let wasmReady = false;

/**
 * Initialize the WASM module from the inlined base64 binary.
 */
function initWasm(): boolean {
  try {
    const binaryString = atob(wasmBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    initSync({ module: bytes });
    wasmReady = true;
    return true;
  } catch (err) {
    console.warn('[networkWorker] WASM init failed:', err);
    return false;
  }
}

// Initialize WASM on worker start
const loaded = initWasm();

// Signal readiness to main thread
const readyMsg: NetworkWorkerResponse = { type: 'ready', wasmLoaded: loaded };
(self as unknown as Worker).postMessage(readyMsg);

// Interp slot hashes → peer id strings, learned from ingest/push_snapshot.
// The interp buffer identifies peers only by their u16 protocol hash; the
// main thread needs peer id strings back for per-Participant routing.
const hashToPeerId = new Map<number, string>();

/**
 * Handle messages from main thread.
 */
self.onmessage = (event: MessageEvent<NetworkWorkerRequest>) => {
  const msg = event.data;

  try {
    switch (msg.type) {
      case 'encode_state': {
        if (!wasmReady) {
          postError(msg.id, 'WASM not loaded');
          return;
        }
        const encoded = encode_player_state(
          msg.position,
          msg.rotation,
          msg.action,
          msg.hangtime,
          msg.clientId,
          msg.bodyFlags || 0,
          msg.swimBlend || 0,
          msg.flyPoseTime || 0,
          msg.vrFlags,
        );
        const response: NetworkWorkerResponse = {
          type: 'encoded',
          id: msg.id,
          data: new Uint8Array(encoded),
        };
        (self as unknown as Worker).postMessage(response, [response.data.buffer]);
        break;
      }

      case 'encode_state_vr': {
        if (!wasmReady) {
          postError(msg.id, 'WASM not loaded');
          return;
        }
        const encoded = encode_player_state_vr(
          msg.position,
          msg.rotation,
          msg.action,
          msg.hangtime,
          msg.clientId,
          msg.headQuat,
          msg.leftWristQuat,
          msg.leftFingers,
          msg.rightWristQuat,
          msg.rightFingers,
          msg.bodyFlags || 0,
          msg.swimBlend || 0,
          msg.flyPoseTime || 0,
          msg.vrFlags,
        );
        const response: NetworkWorkerResponse = {
          type: 'encoded',
          id: msg.id,
          data: new Uint8Array(encoded),
        };
        (self as unknown as Worker).postMessage(response, [response.data.buffer]);
        break;
      }

      case 'encode_state_delta': {
        if (!wasmReady) {
          postError(msg.id, 'WASM not loaded');
          return;
        }
        const encoded = encode_player_state_delta(
          msg.position,
          msg.rotation,
          msg.action,
          msg.hangtime,
          msg.clientId,
          msg.currentTimeMs,
          msg.bodyFlags || 0,
          msg.swimBlend || 0,
          msg.flyPoseTime || 0,
          msg.vrFlags,
        );
        // Delta encoding may return empty vec if nothing changed
        if (encoded.length === 0) {
          // Nothing to send — skip silently
          break;
        }
        const deltaResponse: NetworkWorkerResponse = {
          type: 'encoded',
          id: msg.id,
          data: new Uint8Array(encoded),
        };
        (self as unknown as Worker).postMessage(deltaResponse, [deltaResponse.data.buffer]);
        break;
      }

      case 'reset_differ': {
        if (wasmReady) reset_state_differ();
        break;
      }

      case 'encode_profile': {
        if (!wasmReady) {
          postError(msg.id, 'WASM not loaded');
          return;
        }
        const profileEncoded = encode_profile_announce(
          msg.clientId,
          msg.name,
          msg.vrmUrl,
          msg.profileImageUrl,
        );
        const profileResponse: NetworkWorkerResponse = {
          type: 'encoded',
          id: msg.id,
          data: new Uint8Array(profileEncoded),
        };
        (self as unknown as Worker).postMessage(profileResponse, [profileResponse.data.buffer]);
        break;
      }

      case 'encode_vehicle_state': {
        if (!wasmReady) {
          postError(msg.id, 'WASM not loaded');
          return;
        }
        const vehicleEncoded = encode_vehicle_state(
          msg.clientId,
          msg.vehicleId,
          msg.vehicleType,
          msg.flags,
          msg.position,
          msg.rotation,
          msg.steer,
        );
        const vehicleResponse: NetworkWorkerResponse = {
          type: 'encoded',
          id: msg.id,
          data: new Uint8Array(vehicleEncoded),
        };
        (self as unknown as Worker).postMessage(vehicleResponse, [vehicleResponse.data.buffer]);
        break;
      }

      case 'decode_state': {
        const data = msg.data;
        if (data.length === 0) {
          postError(msg.id, 'Empty data');
          return;
        }

        // Check if this is a binary protocol message or legacy JSON
        const firstByte = data[0];
        if (wasmReady && is_binary_protocol(firstByte)) {
          const msgType = get_message_type(data);

          if (msgType === 2) {
            // Profile announce
            const profile = decode_profile_announce(data);
            const response: NetworkWorkerResponse = {
              type: 'decoded_profile',
              id: msg.id,
              profile: typeof profile === 'string' ? profile : '',
            };
            (self as unknown as Worker).postMessage(response);
          } else if (msgType === 3) {
            // Vehicle state — reuse the 'decoded' channel, tagged messageType 3
            const vehicle = decode_vehicle_state(data);
            const response: NetworkWorkerResponse = {
              type: 'decoded',
              id: msg.id,
              state: typeof vehicle === 'string' ? vehicle : null,
              isLegacyJson: false,
              messageType: 3,
            };
            (self as unknown as Worker).postMessage(response);
          } else {
            // State update
            const decoded = decode_player_state(data);
            const response: NetworkWorkerResponse = {
              type: 'decoded',
              id: msg.id,
              state: typeof decoded === 'string' ? decoded : null,
              isLegacyJson: false,
              messageType: msgType,
            };
            (self as unknown as Worker).postMessage(response);
          }
        } else {
          // Legacy JSON message — pass it back for the main thread to decode
          const response: NetworkWorkerResponse = {
            type: 'decoded',
            id: msg.id,
            state: null,
            isLegacyJson: true,
            rawData: data,
          };
          (self as unknown as Worker).postMessage(response, [data.buffer]);
        }
        break;
      }

      case 'ingest': {
        // Binary packet: decode INSIDE the worker. State updates push their
        // transform straight into the Rust interp buffer; only non-transform
        // events go back to main. Profile/vehicle messages reuse the decoded
        // response shapes (id 0 — handled statically by NetworkBridge).
        if (!wasmReady) break;
        const data = msg.data;
        if (data.length === 0 || !is_binary_protocol(data[0])) break;

        const msgType = get_message_type(data);
        if (msgType === 2) {
          const profile = decode_profile_announce(data);
          const response: NetworkWorkerResponse = {
            type: 'decoded_profile',
            id: 0,
            profile: typeof profile === 'string' ? profile : '',
          };
          (self as unknown as Worker).postMessage(response);
          break;
        }
        if (msgType === 3) {
          const vehicle = decode_vehicle_state(data);
          const response: NetworkWorkerResponse = {
            type: 'decoded',
            id: 0,
            state: typeof vehicle === 'string' ? vehicle : null,
            isLegacyJson: false,
            messageType: 3,
          };
          (self as unknown as Worker).postMessage(response);
          break;
        }

        const events = decode_and_ingest(data, msg.timeMs);
        if (events.length >= 2) {
          const hash = events[0];
          if (msg.peerId) hashToPeerId.set(hash, msg.peerId);
          if ((events[1] & EVT_FORWARD_MASK) !== 0) {
            const eventsArr = events instanceof Float32Array ? events : new Float32Array(events);
            const response: NetworkWorkerResponse = {
              type: 'peer_events',
              peerId: msg.peerId || String(hash),
              events: eventsArr,
            };
            (self as unknown as Worker).postMessage(response, [eventsArr.buffer]);
          }
        }
        break;
      }

      case 'push_snapshot': {
        // Legacy-JSON peers: main thread decodes, but the transform still
        // lands in the same worker-side interp buffer as binary peers.
        if (!wasmReady) break;
        const hash = hash_client_id(msg.peerId);
        hashToPeerId.set(hash, msg.peerId);
        interp_push_snapshot(
          hash,
          msg.timeMs,
          new Float32Array(msg.position),
          new Float32Array(msg.rotation),
          msg.action,
          msg.hangtime,
        );
        break;
      }

      case 'interp_tick': {
        if (!wasmReady) break;
        const buffer = msg.buffer;
        const count = interp_update(msg.nowMs, buffer);
        const peerIds: (string | null)[] = new Array(count);
        for (let i = 0; i < count; i++) {
          const hash = buffer[i * INTERP_FLOATS_PER_PEER + 10];
          peerIds[i] = hashToPeerId.get(hash) ?? null;
        }
        const response: NetworkWorkerResponse = {
          type: 'interp_frame',
          buffer,
          count,
          peerIds,
        };
        (self as unknown as Worker).postMessage(response, [buffer.buffer]);
        break;
      }

      case 'remove_peer': {
        if (!wasmReady) break;
        const hash = hash_client_id(msg.peerId);
        hashToPeerId.delete(hash);
        interp_remove_peer(hash);
        break;
      }

      case 'set_render_delay': {
        if (wasmReady) interp_set_render_delay(msg.ms);
        break;
      }

      case 'reset_interp': {
        if (wasmReady) interp_reset();
        hashToPeerId.clear();
        break;
      }

      default:
        postError(0, `Unknown message type: ${(msg as any).type}`);
    }
  } catch (err) {
    postError((msg as any).id ?? 0, String(err));
  }
};

function postError(id: number, message: string) {
  const response: NetworkWorkerResponse = { type: 'error', id, message };
  (self as unknown as Worker).postMessage(response);
}
