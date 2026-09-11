/**
 * NetworkBridge — Main-thread singleton for WASM-accelerated network encoding/decoding.
 *
 * Manages the networkWorker lifecycle and provides a simple API for:
 * - Encoding player state to compact binary (via WASM in worker)
 * - Decoding incoming peer messages (binary or legacy JSON)
 * - Broadcasting encoded messages via p2pcf
 *
 * Falls back to direct JSON encoding when the worker/WASM is unavailable.
 */
import {
  ACTION_MAP,
  ACTION_NAMES,
  type NetworkWorkerRequest,
  type NetworkWorkerResponse,
  type EncodeStateRequest,
  type EncodeStateVRRequest,
  type EncodeStateDeltaRequest,
  type EncodeProfileRequest,
  type EncodeVehicleStateRequest,
  type PeerEventsResponse,
  type InterpFrameResponse,
  ACTION_IDLE,
  EVT_ACTION,
  EVT_BODY,
  EVT_VR_FLAGS,
  EVT_HEAD_QUAT,
  EVT_LEFT_HAND,
  EVT_RIGHT_HAND,
  INTERP_FLOATS_PER_PEER,
  INTERP_MAX_PEERS,
} from '../workers/networkWorker.protocol';
// `?worker&inline` tells Vite to bundle the worker as a base64-inlined
// blob URL constructor. This means a single UMD upload contains its own
// worker — no sibling `assets/networkWorker-*.js` file to ship, no
// `data:`-URL bailout at runtime. The import default is a constructor.
import NetworkWorkerCtor from '../workers/networkWorker.ts?worker&inline';
import { installFakePeerDriver } from './FakePeerDriver';

export interface PlayerStateInput {
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion x,y,z,w
  action: string;   // 'idle' | 'walking' | 'running' | 'jumping' | 'jumpStop'
  hangtime: number;
  isSwimming?: boolean;
  isFlying?: boolean;
  isBoosting?: boolean;
  swimBlend?: number;    // 0-1, gradual swim movement blend
  flyPoseTime?: number;  // 0.5 normal, up to 1.2 with boost
  /** VR presence bits: bit0 inVR, bit1 leftHandTracked, bit2 rightHandTracked.
   *  Send 0 explicitly when LEAVING VR so receivers clear stale hand poses. */
  vrFlags?: number;
}

export interface PlayerStateVRInput extends PlayerStateInput {
  headQuat: [number, number, number, number];
  leftWristQuat: [number, number, number, number];
  leftFingers: Float32Array;    // 60 floats (15 joints x 4 components)
  rightWristQuat: [number, number, number, number];
  rightFingers: Float32Array;   // 60 floats
}

export interface DecodedPeerState {
  clientIdHash: number;
  position?: [number, number, number];
  rotation?: [number, number, number, number]; // quaternion
  action?: string;
  hangtime?: number;
  headQuat?: [number, number, number, number];
  leftHand?: {
    wristQuat: [number, number, number, number];
    fingerJoints: [number, number, number, number][];
  };
  rightHand?: {
    wristQuat: [number, number, number, number];
    fingerJoints: [number, number, number, number][];
  };
  /** Upper/lower arm quaternions from VR IK (legacy JSON path only for now). */
  leftUpperArmQuat?: [number, number, number, number];
  leftLowerArmQuat?: [number, number, number, number];
  rightUpperArmQuat?: [number, number, number, number];
  rightLowerArmQuat?: [number, number, number, number];
  isSwimming?: boolean;
  isFlying?: boolean;
  isBoosting?: boolean;
  swimBlend?: number;
  flyPoseTime?: number;
  /** VR presence bits (bit0 inVR, bit1 left tracked, bit2 right tracked).
   *  undefined = sender predates the VR-state mask. */
  vrFlags?: number;
  // Legacy fields (populated when falling back to JSON decode)
  profileImage?: string;
  playerVRM?: string;
  vrm?: string;
  inWorldName?: string;
  isMoving?: any;
  /** The peer client ID string. Required for per-Participant routing. */
  peerId?: string;
}

/** Input for broadcasting a locally-driven vehicle's transform. */
export interface VehicleStateInput {
  /** FNV-1a hash of the block's stable id string (u32). */
  vehicleId: number;
  vehicleType: number;
  occupied: boolean;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion x,y,z,w
  /** Front-wheel steer angle (radians); 0 for non-steered types. */
  steer: number;
}

/** Decoded vehicle state received from a peer. */
export interface DecodedVehicleState {
  /** Driver/owner client-id hash. */
  clientIdHash: number;
  vehicleId: number;
  vehicleType: number;
  occupied: boolean;
  position: [number, number, number];
  rotation: [number, number, number, number];
  /** Front-wheel steer angle (radians); 0 from senders predating the steer byte. */
  steer: number;
}

export interface DecodedPeerProfile {
  clientIdHash: number;
  name: string;
  vrmUrl: string;
  profileImage: string;
  /** The peer client ID string (only available for legacy JSON messages) */
  peerId?: string;
}

/**
 * Vehicle membership message — who is in which seat of a vehicle. Low-frequency
 * (board/leave events + a ~1Hz driver keyframe), so it rides a plain JSON
 * broadcast rather than the binary per-frame protocol. Discriminated by
 * `__xrpType:'vehicleMembership'` so the legacy-JSON player-state path ignores
 * it. The DRIVER (`kind:'occupancy'`) is authoritative; players send
 * `kind:'join'`/`kind:'leave'` requests to the vehicle's driver.
 */
export interface VehicleMembershipMessage {
  __xrpType: 'vehicleMembership';
  kind: 'join' | 'leave' | 'occupancy';
  /** Stable vehicle id string (the rideableId / block name). */
  vehicleId: string;
  /** Sender client id (the requester for join/leave; the driver for occupancy). */
  clientId: string;
  /** occupancy only: seat index → occupant client id (null = empty). Index 0 is
   *  the driver. */
  seats?: (string | null)[];
}

type PeerStateCallback = (state: DecodedPeerState) => void;
type PeerProfileCallback = (profile: DecodedPeerProfile) => void;
type VehicleStateCallback = (state: DecodedVehicleState) => void;
type VehicleMembershipCallback = (msg: VehicleMembershipMessage) => void;

// Distance tier constants (match Rust ecs/spatial.rs)
const TIER_FULL = 0;      // 0-10m
const TIER_HALF = 1;      // 10-30m
const TIER_QUARTER = 2;   // 30-100m
const TIER_HEARTBEAT = 3; // 100m+

const TIER_FULL_DIST_SQ = 100;      // 10m^2
const TIER_HALF_DIST_SQ = 900;      // 30m^2
const TIER_QUARTER_DIST_SQ = 10000;  // 100m^2

function distanceToTier(distSq: number): number {
  if (distSq <= TIER_FULL_DIST_SQ) return TIER_FULL;
  if (distSq <= TIER_HALF_DIST_SQ) return TIER_HALF;
  if (distSq <= TIER_QUARTER_DIST_SQ) return TIER_QUARTER;
  return TIER_HEARTBEAT;
}

/** Read a 64-float hand pose (wrist quat + 15 finger-joint quats) from an
 *  ingest event payload. */
function readHandPose(e: Float32Array, off: number): {
  wristQuat: [number, number, number, number];
  fingerJoints: [number, number, number, number][];
} {
  const wristQuat: [number, number, number, number] =
    [e[off], e[off + 1], e[off + 2], e[off + 3]];
  const fingerJoints: [number, number, number, number][] = new Array(15);
  for (let i = 0; i < 15; i++) {
    const j = off + 4 + i * 4;
    fingerJoints[i] = [e[j], e[j + 1], e[j + 2], e[j + 3]];
  }
  return { wristQuat, fingerJoints };
}

export class NetworkBridge {
  private worker: Worker | null = null;
  private wasmReady = false;
  private requestId = 0;
  private pendingCallbacks = new Map<number, (response: NetworkWorkerResponse) => void>();
  private peerStateListeners: PeerStateCallback[] = [];
  private peerProfileListeners: PeerProfileCallback[] = [];
  private vehicleStateListeners: VehicleStateCallback[] = [];
  private vehicleMembershipListeners: VehicleMembershipCallback[] = [];
  private p2pcf: any = null;
  private profileSent = false;
  private useDelta = true;
  /** Single top-level p2pcf "msg" listener — installed in setP2PCF, removed in destroy / re-setP2PCF. */
  private _msgListener: ((peer: any, data: any) => void) | null = null;
  /** "peerconnect" listener for profile re-announce to late joiners. */
  private _peerConnectListener: ((peer: any) => void) | null = null;
  /** Last profile passed to sendProfile — re-announced on each peerconnect. */
  private _lastProfile: { inWorldName?: string; playerVRM?: string; profileImage?: string } | null = null;
  /** Peers that already received our profile announce this session. p2pcf
   *  fires 'peerconnect' on datachannel RE-negotiations too (e.g. proximity
   *  voice attaching when a peer walks near) — re-announcing to a peer that
   *  already has the profile just churns every receiver's participant store. */
  private _announcedPeers = new Set<string>();

  // Plugin custom-message channels (small JSON broadcasts; e.g. synced audio).
  private customListeners = new Map<string, Set<(peerId: string, data: any) => void>>();

  // Spatial awareness: per-peer send rate tiers
  private _peerPositions = new Map<string, [number, number, number]>(); // peer clientId -> last known position
  private _localPosition: [number, number, number] = [0, 0, 0];
  private _frameCounter = 0;

  // Reusable typed arrays to avoid per-frame allocations
  private _positionBuf = new Float32Array(3);
  private _rotationBuf = new Float32Array(4);

  // ── Worker-owned interpolation (per-frame ping-pong buffers) ──
  // Two 4KB Float32Arrays cycle main→worker→main via transfer (zero-copy).
  // `_interpFront` is the newest filled frame; `_interpPool` holds buffers
  // available to send on the next tick.
  private _interpPool: Float32Array[] = [
    new Float32Array(INTERP_MAX_PEERS * INTERP_FLOATS_PER_PEER),
    new Float32Array(INTERP_MAX_PEERS * INTERP_FLOATS_PER_PEER),
  ];
  private _interpFront: Float32Array | null = null;
  /** peerId → subarray view into `_interpFront` for that peer's slot. */
  private _interpSlots = new Map<string, Float32Array>();
  private _interpRafId: number | null = null;
  /** Set by any ingest/push; ticks stop ~5s after the last packet. */
  private _lastIngestMs = 0;

  // ?netdebug counters
  private _netDebugTimer: ReturnType<typeof setInterval> | null = null;
  private _statsOut = 0;
  private _statsIn = 0;
  private _statsGated = 0;

  /**
   * Initialize the network worker.
   * Call this once when networking is set up.
   */
  init() {
    if (this.worker) return;

    // Dev/test affordances: `window.__xrpFakePeers(n)` synthetic peer
    // load harness, and `?netdebug` periodic packet counters.
    installFakePeerDriver();
    if (typeof window !== 'undefined'
      && new URLSearchParams(window.location.search).has('netdebug')
      && !this._netDebugTimer) {
      this._netDebugTimer = setInterval(() => {
        console.log(
          `[netdebug] out=${this._statsOut}/s in=${this._statsIn}/s ` +
          `gated=${this._statsGated}/s peers=${this._peerPositions.size}`,
        );
        this._statsOut = 0;
        this._statsIn = 0;
        this._statsGated = 0;
      }, 1000);
    }

    try {
      // `?worker&inline` import is a constructor — instantiate directly.
      // No URL resolution, no data:/blob distinction at this layer: Vite
      // already emitted a blob-URL shim inside the bundle. If construction
      // ever throws, we fall back to the legacy JSON path below.
      this.worker = new NetworkWorkerCtor();

      this.worker.onmessage = (event: MessageEvent<NetworkWorkerResponse>) => {
        const msg = event.data;

        if (msg.type === 'ready') {
          this.wasmReady = msg.wasmLoaded;
          // Default jitter buffer: 60ms is responsive enough for avatars
          // while still absorbing typical WebRTC datachannel jitter.
          // Override via setInterpRenderDelay().
          if (this.wasmReady && this.worker) {
            this.worker.postMessage({ type: 'set_render_delay', ms: 60 });
          }
          return;
        }

        // Interpolated transforms for this frame — swap the front buffer and
        // recycle the previous one into the send pool.
        if (msg.type === 'interp_frame') {
          this._onInterpFrame(msg);
          return;
        }

        // Non-transform events decoded from an ingested packet.
        if (msg.type === 'peer_events') {
          this._onPeerEvents(msg);
          return;
        }

        // Every 'encoded' response is broadcast — handle it statically
        // instead of registering a per-send closure in pendingCallbacks.
        // (The old per-send closures also leaked: unchanged delta encodes
        // return no response, so their Map entries were never deleted.)
        if (msg.type === 'encoded') {
          if (this.p2pcf && msg.data && msg.data.length > 0) {
            // State updates (0x01) and vehicle updates (0x03) go out tiered
            // per peer (both are spatial); everything else (profile announces)
            // must reach every peer.
            if (msg.data[0] === 0x01 && (msg.data[1] === 0x01 || msg.data[1] === 0x03)) {
              this._broadcastTiered(msg.data);
            } else {
              this.p2pcf.broadcast(msg.data);
            }
            this._statsOut++;
          }
          return;
        }

        // Profile / vehicle decodes from the ingest path arrive with id 0 —
        // no pending callback, handled statically.
        if (msg.type === 'decoded_profile' && msg.id === 0) {
          if (msg.profile) this._handleDecodedProfile(msg.profile);
          return;
        }
        if (msg.type === 'decoded' && msg.id === 0) {
          if (msg.messageType === 3 && msg.state) this._handleDecodedVehicle(msg.state);
          return;
        }

        // Handle pending request callbacks (decode paths)
        if ('id' in msg) {
          const cb = this.pendingCallbacks.get(msg.id);
          if (cb) {
            this.pendingCallbacks.delete(msg.id);
            cb(msg);
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('[NetworkBridge] Worker error:', err);
      };
    } catch (err) {
      console.warn('[NetworkBridge] Failed to create worker, using fallback:', err);
      this.worker = null;
    }
  }

  /**
   * Set the p2pcf instance for broadcasting and install the single message
   * listener that routes inbound binary + JSON messages through
   * `handleIncomingMessage` and then to `onPeerState` subscribers.
   *
   * Historically the per-Participant component installed its own
   * `p2pcf.on("msg", ...)` handler, which caused O(N) decodes per message and
   * — because the JSON handler wrote to participant-local refs without
   * filtering by peer identity — every Participant instance mirrored the
   * most recent broadcaster. Centralising the listener is the fix.
   */
  setP2PCF(p2pcf: any) {
    if (this._msgListener && this.p2pcf && typeof this.p2pcf.removeListener === 'function') {
      this.p2pcf.removeListener('msg', this._msgListener);
    }
    this._msgListener = null;
    if (this._peerConnectListener && this.p2pcf && typeof this.p2pcf.removeListener === 'function') {
      this.p2pcf.removeListener('peerconnect', this._peerConnectListener);
    }
    this._peerConnectListener = null;

    this.p2pcf = p2pcf;
    this.profileSent = false;
    this._lastSent = null;
    this._announcedPeers.clear();

    // Fresh session → reset the WASM delta compressor so the first
    // packet is a full keyframe (a reconnect previously inherited the
    // old differ state and could withhold fields new peers needed).
    // Interp buffers likewise start clean — stale peers from the previous
    // session must not ghost into the new one.
    if (this.worker && this.wasmReady) {
      this.worker.postMessage({ type: 'reset_differ', id: this.requestId++ });
      this.worker.postMessage({ type: 'reset_interp' } as NetworkWorkerRequest);
    }
    this._interpSlots.clear();

    if (p2pcf && typeof p2pcf.on === 'function') {
      const listener = (peer: any, data: any) => {
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        this.handleIncomingMessage(peer, bytes);
      };
      this._msgListener = listener;
      p2pcf.on('msg', listener);

      // Re-announce our profile whenever a NEW peer connects — the
      // announce used to go out exactly once per session, so late
      // joiners rendered existing peers with the default avatar/name.
      // Deduped per peer: renegotiation-triggered 'peerconnect' events
      // must not re-broadcast.
      const connectListener = (peer: any) => {
        const pid = peer?.client_id;
        if (pid) {
          if (this._announcedPeers.has(pid)) return;
          this._announcedPeers.add(pid);
        }
        if (this._lastProfile) this.sendProfile(this._lastProfile);
      };
      this._peerConnectListener = connectListener;
      p2pcf.on('peerconnect', connectListener);
    }
  }

  /**
   * Register a listener for decoded peer state updates.
   */
  onPeerState(callback: PeerStateCallback) {
    this.peerStateListeners.push(callback);
    return () => {
      const idx = this.peerStateListeners.indexOf(callback);
      if (idx >= 0) this.peerStateListeners.splice(idx, 1);
    };
  }

  /**
   * Register a listener for decoded peer profile announcements.
   */
  onPeerProfile(callback: PeerProfileCallback) {
    this.peerProfileListeners.push(callback);
    return () => {
      const idx = this.peerProfileListeners.indexOf(callback);
      if (idx >= 0) this.peerProfileListeners.splice(idx, 1);
    };
  }

  /**
   * Register a listener for decoded peer vehicle-state updates.
   */
  onVehicleState(callback: VehicleStateCallback) {
    this.vehicleStateListeners.push(callback);
    return () => {
      const idx = this.vehicleStateListeners.indexOf(callback);
      if (idx >= 0) this.vehicleStateListeners.splice(idx, 1);
    };
  }

  /**
   * Encode and broadcast a locally-driven vehicle's transform. Goes out
   * tiered per peer (handled by the static 'encoded' onmessage path) so a
   * driven vehicle costs the same interest-managed bandwidth as an avatar.
   */
  sendVehicleState(state: VehicleStateInput) {
    const clientId = this.p2pcf?.clientId;
    if (!clientId || !this.p2pcf || !this.worker || !this.wasmReady) return;
    const id = this.requestId++;
    const request: EncodeVehicleStateRequest = {
      type: 'encode_vehicle_state',
      id,
      clientId,
      vehicleId: state.vehicleId,
      vehicleType: state.vehicleType,
      flags: state.occupied ? 0x01 : 0,
      position: new Float32Array(state.position),
      rotation: new Float32Array(state.rotation),
      steer: state.steer,
    };
    this.worker.postMessage(request);
  }

  /**
   * Register a listener for vehicle membership (seat occupancy) messages.
   */
  onVehicleMembership(callback: VehicleMembershipCallback) {
    this.vehicleMembershipListeners.push(callback);
    return () => {
      const idx = this.vehicleMembershipListeners.indexOf(callback);
      if (idx >= 0) this.vehicleMembershipListeners.splice(idx, 1);
    };
  }

  /**
   * Broadcast a vehicle membership message (JSON, to ALL peers). Used for the
   * rare board/leave requests and the driver's authoritative occupancy
   * keyframe — not a per-frame path, so a plain broadcast is fine.
   */
  sendVehicleMembership(msg: Omit<VehicleMembershipMessage, '__xrpType' | 'clientId'>) {
    const clientId = this.p2pcf?.clientId;
    if (!clientId || !this.p2pcf || typeof this.p2pcf.broadcast !== 'function') return;
    const full: VehicleMembershipMessage = { __xrpType: 'vehicleMembership', clientId, ...msg };
    try {
      this.p2pcf.broadcast(new TextEncoder().encode(JSON.stringify(full)));
    } catch { /* p2pcf not ready */ }
  }

  /**
   * Plugin-facing: broadcast a small JSON message on a named channel to all peers.
   * For low-rate state/coordination (synced audio transport, game state, etc.) —
   * NOT a per-frame or bulk-data path. Audio/asset BYTES must never go through here;
   * peers load assets from their own URLs and only sync small state.
   */
  broadcastCustom(channel: string, data: any) {
    const clientId = this.p2pcf?.clientId;
    if (!clientId || !this.p2pcf || typeof this.p2pcf.broadcast !== 'function') return;
    try {
      this.p2pcf.broadcast(new TextEncoder().encode(JSON.stringify({ __xrpType: 'custom', channel, clientId, data })));
    } catch { /* p2pcf not ready */ }
  }

  /** Plugin-facing: subscribe to a custom channel. Returns an unsubscribe fn. */
  onCustomMessage(channel: string, cb: (peerId: string, data: any) => void): () => void {
    let set = this.customListeners.get(channel);
    if (!set) { set = new Set(); this.customListeners.set(channel, set); }
    set.add(cb);
    return () => { const s = this.customListeners.get(channel); if (s) s.delete(cb); };
  }

  /** Our own p2pcf client id (stable per session), or null before connect. */
  get localClientId(): string | null {
    return this.p2pcf?.clientId ?? null;
  }

  /**
   * Plugin-facing snapshot of every remote peer's last-known world position
   * (from the same spatial-awareness map the send tiers use). Peers are
   * removed on peerclose, so entries are live participants only.
   */
  getPeerPositions(): { id: string; x: number; y: number; z: number }[] {
    const out: { id: string; x: number; y: number; z: number }[] = [];
    for (const [id, pos] of this._peerPositions) {
      out.push({ id, x: pos[0], y: pos[1], z: pos[2] });
    }
    return out;
  }

  /**
   * Broadcast a profile announcement.
   * Should be called once on connect and when profile data changes.
   */
  sendProfile(userData: { inWorldName?: string; playerVRM?: string; profileImage?: string }) {
    const clientId = this.p2pcf?.clientId;
    if (!clientId || !this.p2pcf) return;
    this._lastProfile = userData;

    if (this.worker && this.wasmReady) {
      const id = this.requestId++;
      // 'encoded' responses are broadcast by the static onmessage handler.
      const request: EncodeProfileRequest = {
        type: 'encode_profile',
        id,
        clientId,
        name: userData.inWorldName || '',
        vrmUrl: userData.playerVRM || '',
        profileImageUrl: userData.profileImage || '',
      };
      this.worker.postMessage(request);
    }
    // No legacy JSON equivalent needed — legacy peers include profile in every state message
    this.profileSent = true;
  }

  /**
   * Encode and broadcast a player state update.
   *
   * If the worker/WASM is available, uses delta encoding (only sends changed fields).
   * Otherwise falls back to the legacy JSON format.
   */
  sendState(state: PlayerStateInput, userData?: any) {
    const clientId = this.p2pcf?.clientId;
    if (!clientId || !this.p2pcf) return;

    // Send profile on first state update if not sent yet
    if (!this.profileSent && this.worker && this.wasmReady && userData) {
      this.sendProfile(userData);
    }

    // Track local position for spatial awareness
    this._localPosition = state.position;
    this._frameCounter++;

    // Change gate: skip the worker postMessage round trip entirely when
    // nothing observable changed and a heartbeat went out recently. The
    // Rust delta encoder already dedupes *bytes*, but only after a
    // main-thread → worker → main-thread hop per call — measurable in the
    // idle trace at 30Hz. Idle players drop to ~1 msg/s here.
    if (this._isUnchangedWithinHeartbeat(state)) {
      this._statsGated++;
      return;
    }

    if (this.worker && this.wasmReady) {
      if (this.useDelta) {
        this._sendBinaryDelta(state, clientId);
      } else {
        this._sendBinary(state, clientId);
      }
    } else {
      this._sendLegacyJson(state, clientId, userData);
    }
  }

  private _lastSent: {
    p0: number; p1: number; p2: number;
    r0: number; r1: number; r2: number; r3: number;
    action: string; hangtime: number; bodyKey: number; time: number;
  } | null = null;

  private _isUnchangedWithinHeartbeat(state: PlayerStateInput): boolean {
    const body = this._packBodyState(state);
    const bodyKey = body.bodyFlags | (body.swimBlend << 3) | (body.flyPoseTime << 11)
      | ((state.vrFlags ?? 0) << 19);
    const now = performance.now();
    const last = this._lastSent;
    const EPS = 1e-3;

    if (
      last &&
      now - last.time < 1000 &&
      state.action === last.action &&
      state.hangtime === last.hangtime &&
      bodyKey === last.bodyKey &&
      Math.abs(state.position[0] - last.p0) < EPS &&
      Math.abs(state.position[1] - last.p1) < EPS &&
      Math.abs(state.position[2] - last.p2) < EPS &&
      Math.abs(state.rotation[0] - last.r0) < EPS &&
      Math.abs(state.rotation[1] - last.r1) < EPS &&
      Math.abs(state.rotation[2] - last.r2) < EPS &&
      Math.abs(state.rotation[3] - last.r3) < EPS
    ) {
      return true;
    }

    this._lastSent = {
      p0: state.position[0], p1: state.position[1], p2: state.position[2],
      r0: state.rotation[0], r1: state.rotation[1], r2: state.rotation[2], r3: state.rotation[3],
      action: state.action, hangtime: state.hangtime, bodyKey, time: now,
    };
    return false;
  }

  /**
   * Encode and broadcast a VR player state update with hand tracking data.
   * Applies spatial awareness: only sends hand data to nearby peers.
   */
  sendStateVR(state: PlayerStateVRInput, userData?: any) {
    const clientId = this.p2pcf?.clientId;
    if (!clientId || !this.p2pcf) return;

    this._localPosition = state.position;
    this._frameCounter++;

    if (this.worker && this.wasmReady) {
      // Spatial check: determine the closest peer's tier.
      // p2pcf broadcasts to ALL peers (no per-peer sending), so we use
      // the closest peer's tier for gating. Hand data is included only
      // if at least one peer is within TIER_HALF range (30m).
      const closestTier = this._getClosestPeerTier();
      const includeHands = closestTier <= TIER_HALF;

      if (includeHands) {
        this._sendBinaryVR(state, clientId);
      } else {
        // Distant peers only — send basic state without hand data
        this._sendBinaryDelta(state, clientId);
      }
    } else {
      this._sendLegacyJson(state, clientId, userData);
    }
  }

  /**
   * Handle an incoming p2pcf message.
   * Decodes binary or legacy JSON and notifies listeners.
   */
  handleIncomingMessage(peer: any, data: Uint8Array) {
    if (data.length === 0) return;
    this._statsIn++;

    const firstByte = data[0];

    // Fast path: binary protocol (0x01). The worker decodes AND interpolates:
    // transforms go straight into the worker-side interp buffer (read back
    // once per frame via _tickInterp), and only non-transform events come
    // back per packet — no per-packet JSON build/clone/parse anywhere.
    if (firstByte === 0x01 && this.worker && this.wasmReady) {
      this._lastIngestMs = Date.now();
      this.worker.postMessage(
        {
          type: 'ingest',
          data,
          peerId: peer?.client_id ?? '',
          timeMs: Date.now(),
        } as NetworkWorkerRequest,
        [data.buffer]
      );
      this._ensureInterpTicking();
    } else {
      // Legacy JSON path
      try {
        const text = new TextDecoder('utf-8').decode(data);
        const parsed = JSON.parse(text);
        // Vehicle membership (seat occupancy) — discriminated so it isn't
        // mistaken for a legacy player-state map below.
        if (parsed && parsed.__xrpType === 'vehicleMembership') {
          for (const listener of this.vehicleMembershipListeners) {
            try { listener(parsed as VehicleMembershipMessage); } catch { /* ignore */ }
          }
          return;
        }
        // Plugin custom channel messages (synced audio, game state, …).
        if (parsed && parsed.__xrpType === 'custom') {
          const set = this.customListeners.get(parsed.channel);
          if (set) {
            const pid = peer?.client_id ?? parsed.clientId ?? '';
            for (const cb of set) { try { cb(pid, parsed.data); } catch { /* ignore */ } }
          }
          return;
        }
        // Legacy format: { [clientId]: { position, rotation, isMoving, ... } }
        for (const [peerId, peerData] of Object.entries(parsed)) {
          const pd = peerData as any;
          // Track peer position for spatial awareness
          if (pd.position) {
            this._peerPositions.set(peerId, pd.position);
          }
          // Route legacy transforms into the worker-side interp buffer too —
          // one smoothing path for all peers. Euler-rotation senders (3
          // elements) are excluded: interp is quaternion-only, and pushing
          // position with an identity rotation would zero their heading.
          // They fall back to the main-thread lerp path in Participants.
          if (this.worker && this.wasmReady && pd.position
            && (!pd.rotation || pd.rotation.length === 4)) {
            const action = typeof pd.isMoving === 'object'
              ? (ACTION_MAP[pd.isMoving?.action] ?? ACTION_IDLE)
              : ACTION_IDLE;
            this._lastIngestMs = Date.now();
            this.worker.postMessage({
              type: 'push_snapshot',
              peerId,
              timeMs: Date.now(),
              position: pd.position,
              rotation: pd.rotation ?? [0, 0, 0, 1],
              action,
              hangtime: typeof pd.isMoving === 'object' ? (pd.isMoving?.hangtime ?? 0) : 0,
            } as NetworkWorkerRequest);
            this._ensureInterpTicking();
          }
          const decoded: DecodedPeerState = {
            clientIdHash: 0,
            peerId,
            position: pd.position,
            // Convert euler rotation to quaternion if needed
            rotation: pd.rotation?.length === 4 ? pd.rotation : undefined,
            action: typeof pd.isMoving === 'object' ? pd.isMoving?.action : (pd.isMoving === false ? 'idle' : undefined),
            hangtime: typeof pd.isMoving === 'object' ? pd.isMoving?.hangtime : 0,
            isSwimming: !!pd.isSwimming,
            isFlying: !!pd.isFlying,
            isBoosting: !!pd.isBoosting,
            swimBlend: pd.swimBlend,
            flyPoseTime: pd.flyPoseTime,
            headQuat: pd.headQuat,
            leftHand: pd.leftHand,
            rightHand: pd.rightHand,
            leftUpperArmQuat: pd.leftUpperArmQuat,
            leftLowerArmQuat: pd.leftLowerArmQuat,
            rightUpperArmQuat: pd.rightUpperArmQuat,
            rightLowerArmQuat: pd.rightLowerArmQuat,
            profileImage: pd.profileImage,
            playerVRM: pd.playerVRM,
            vrm: pd.vrm,
            inWorldName: pd.inWorldName,
            isMoving: pd.isMoving,
          };
          this._notifyListeners(decoded);
        }
      } catch (err) {
        // Silently ignore malformed messages
      }
    }
  }

  /**
   * Destroy the worker and clean up.
   */
  /**
   * Remove a peer from spatial tracking (call on peerclose).
   */
  /**
   * Interest management: send state updates per peer at distance-tiered
   * rates instead of broadcasting every packet to everyone. At 32 peers a
   * 20-30Hz uniform broadcast is ~1000 packets/s of upstream; far peers
   * only need a few Hz — the 1s keyframe guarantees they stay correct, and
   * a ≤500ms animation-transition delay is invisible at 100m+.
   * Peers with no known position yet get every packet (fresh joins need
   * state fast).
   */
  private _peerLastSend = new Map<string, number>();

  private _broadcastTiered(data: Uint8Array) {
    const p2pcf = this.p2pcf;
    const peers: Map<string, any> | undefined = p2pcf?.peers;
    if (!peers || typeof p2pcf.send !== 'function' || peers.size === 0) {
      p2pcf?.broadcast(data);
      return;
    }

    const now = performance.now();
    const lp = this._localPosition;
    for (const peer of peers.values()) {
      if (!peer.connected) continue;
      const cid = peer.client_id ?? peer.id;
      const pos = cid ? this._peerPositions.get(cid) : undefined;
      let minInterval = 0;
      if (pos) {
        const dx = pos[0] - lp[0];
        const dy = pos[1] - lp[1];
        const dz = pos[2] - lp[2];
        const tier = distanceToTier(dx * dx + dy * dy + dz * dz);
        minInterval = tier === TIER_FULL ? 0
          : tier === TIER_HALF ? 66       // ~15Hz — avatars are clearly visible at 10-30m
          : tier === TIER_QUARTER ? 150   // ~7Hz
          : 400;                          // 2.5Hz at 100m+
      }
      if (minInterval > 0 && cid) {
        const last = this._peerLastSend.get(cid) ?? 0;
        if (now - last < minInterval) continue;
        this._peerLastSend.set(cid, now);
      }
      try {
        p2pcf.send(peer, data);
      } catch { /* peer churn mid-loop — drop silently */ }
    }
  }

  removePeer(peerId: string) {
    this._peerPositions.delete(peerId);
    this._peerLastSend.delete(peerId);
    this._interpSlots.delete(peerId);
    // A truly re-joining peer (fresh session) should get a fresh announce.
    this._announcedPeers.delete(peerId);
    if (this.worker && this.wasmReady) {
      this.worker.postMessage({ type: 'remove_peer', peerId } as NetworkWorkerRequest);
    }
  }

  // ── Worker-owned interpolation ──

  /**
   * Latest interpolated transform slot for a peer, or null when the peer
   * isn't in the worker interp buffer (legacy euler sender, WASM unavailable,
   * or no packet yet). Slot layout (Float32Array, 32 floats):
   * [0..2] position, [3..6] quaternion xyzw, [7] action, [8] hangtime,
   * [9] last packet time, [10] peerIdHash. The view is valid for the current
   * frame only — read, don't retain.
   */
  getPeerInterp(peerId: string): Float32Array | null {
    return this._interpSlots.get(peerId) ?? null;
  }

  /** Configure the interpolation jitter buffer (default 60ms). */
  setInterpRenderDelay(ms: number) {
    if (this.worker && this.wasmReady) {
      this.worker.postMessage({ type: 'set_render_delay', ms } as NetworkWorkerRequest);
    }
  }

  private _onInterpFrame(msg: InterpFrameResponse) {
    // Recycle the previous front buffer into the send pool, then rebuild the
    // per-peer slot views over the new front. Slot views never reference a
    // pooled buffer, so a later transfer can't detach a view in use.
    if (this._interpFront) this._interpPool.push(this._interpFront);
    this._interpFront = msg.buffer;
    this._interpSlots.clear();
    for (let i = 0; i < msg.count; i++) {
      const peerId = msg.peerIds[i];
      if (!peerId) continue;
      const base = i * INTERP_FLOATS_PER_PEER;
      const slot = msg.buffer.subarray(base, base + INTERP_FLOATS_PER_PEER);
      this._interpSlots.set(peerId, slot);
      // Spatial tiering reads _peerPositions; the interp buffer is the
      // freshest source once packets stop carrying transforms to main.
      const pos = this._peerPositions.get(peerId);
      if (pos) {
        pos[0] = slot[0]; pos[1] = slot[1]; pos[2] = slot[2];
      } else {
        this._peerPositions.set(peerId, [slot[0], slot[1], slot[2]]);
      }
    }
  }

  private _onPeerEvents(msg: PeerEventsResponse) {
    const e = msg.events;
    if (e.length < 8) return;
    const mask = e[1];
    const decoded: DecodedPeerState = {
      clientIdHash: e[0],
      peerId: msg.peerId || undefined,
    };
    if (mask & EVT_ACTION) {
      decoded.action = ACTION_NAMES[e[2]];
      decoded.hangtime = e[3];
    }
    if (mask & EVT_BODY) {
      const bodyFlags = e[4];
      decoded.isSwimming = !!(bodyFlags & 0x01);
      decoded.isFlying = !!(bodyFlags & 0x02);
      decoded.isBoosting = !!(bodyFlags & 0x04);
      decoded.swimBlend = e[5] / 255;
      decoded.flyPoseTime = (e[6] / 255) * 2.0;
    }
    if (mask & EVT_VR_FLAGS) {
      decoded.vrFlags = e[7];
    }
    let off = 8;
    if (mask & EVT_HEAD_QUAT) {
      decoded.headQuat = [e[off], e[off + 1], e[off + 2], e[off + 3]];
      off += 4;
    }
    if (mask & EVT_LEFT_HAND) {
      decoded.leftHand = readHandPose(e, off);
      off += 64;
    }
    if (mask & EVT_RIGHT_HAND) {
      decoded.rightHand = readHandPose(e, off);
      off += 64;
    }
    this._notifyListeners(decoded);
  }

  private _handleDecodedProfile(profileJson: string) {
    try {
      const parsed = JSON.parse(profileJson);
      this._notifyProfileListeners({
        clientIdHash: parsed.clientIdHash,
        name: parsed.name,
        vrmUrl: parsed.vrmUrl,
        profileImage: parsed.profileImage,
      });
    } catch (e) { /* ignore malformed */ }
  }

  private _handleDecodedVehicle(stateJson: string) {
    try {
      const v = JSON.parse(stateJson);
      this._notifyVehicleListeners({
        clientIdHash: v.clientIdHash,
        vehicleId: v.vehicleId,
        vehicleType: v.vehicleType,
        occupied: !!(v.flags & 0x01),
        position: v.position,
        rotation: v.rotation,
        steer: typeof v.steer === 'number' ? v.steer : 0,
      });
    } catch (e) { /* ignore malformed */ }
  }

  /** Start the per-frame interp tick loop; self-stops ~5s after the last
   *  inbound packet so idle sessions cost nothing. */
  private _ensureInterpTicking() {
    if (this._interpRafId !== null) return;
    if (typeof requestAnimationFrame !== 'function') return;
    const loop = () => {
      if (Date.now() - this._lastIngestMs > 5000) {
        this._interpRafId = null;
        this._interpSlots.clear();
        return;
      }
      this._tickInterp();
      this._interpRafId = requestAnimationFrame(loop);
    };
    this._interpRafId = requestAnimationFrame(loop);
  }

  private _tickInterp() {
    if (!this.worker || !this.wasmReady) return;
    const buffer = this._interpPool.pop();
    if (!buffer) return; // both buffers in flight — worker is behind, skip
    this.worker.postMessage(
      { type: 'interp_tick', nowMs: Date.now(), buffer } as NetworkWorkerRequest,
      [buffer.buffer]
    );
  }

  destroy() {
    if (this._msgListener && this.p2pcf && typeof this.p2pcf.removeListener === 'function') {
      this.p2pcf.removeListener('msg', this._msgListener);
    }
    this._msgListener = null;

    if (this._interpRafId !== null) {
      cancelAnimationFrame(this._interpRafId);
      this._interpRafId = null;
    }
    this._interpSlots.clear();
    this._interpFront = null;

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingCallbacks.clear();
    this.peerStateListeners = [];
    this.peerProfileListeners = [];
    this.vehicleStateListeners = [];
    this.vehicleMembershipListeners = [];
    this._peerPositions.clear();
    this.p2pcf = null;
    this.profileSent = false;
    this._frameCounter = 0;
  }

  // ── Private methods ──

  private _sendBinary(state: PlayerStateInput, clientId: string) {
    this._positionBuf[0] = state.position[0];
    this._positionBuf[1] = state.position[1];
    this._positionBuf[2] = state.position[2];

    this._rotationBuf[0] = state.rotation[0];
    this._rotationBuf[1] = state.rotation[1];
    this._rotationBuf[2] = state.rotation[2];
    this._rotationBuf[3] = state.rotation[3];

    const id = this.requestId++;

    const request: EncodeStateRequest = {
      type: 'encode_state',
      id,
      clientId,
      position: this._positionBuf,
      rotation: this._rotationBuf,
      action: ACTION_MAP[state.action] ?? ACTION_IDLE,
      hangtime: state.hangtime,
      ...this._packBodyState(state),
      vrFlags: state.vrFlags,
    };
    this.worker!.postMessage(request);
  }

  private _sendBinaryDelta(state: PlayerStateInput, clientId: string) {
    this._positionBuf[0] = state.position[0];
    this._positionBuf[1] = state.position[1];
    this._positionBuf[2] = state.position[2];

    this._rotationBuf[0] = state.rotation[0];
    this._rotationBuf[1] = state.rotation[1];
    this._rotationBuf[2] = state.rotation[2];
    this._rotationBuf[3] = state.rotation[3];

    const id = this.requestId++;

    const request: EncodeStateDeltaRequest = {
      type: 'encode_state_delta',
      id,
      clientId,
      position: this._positionBuf,
      rotation: this._rotationBuf,
      action: ACTION_MAP[state.action] ?? ACTION_IDLE,
      hangtime: state.hangtime,
      currentTimeMs: performance.now(),
      ...this._packBodyState(state),
      vrFlags: state.vrFlags,
    };
    this.worker!.postMessage(request);
  }

  private _sendBinaryVR(state: PlayerStateVRInput, clientId: string) {
    this._positionBuf[0] = state.position[0];
    this._positionBuf[1] = state.position[1];
    this._positionBuf[2] = state.position[2];

    this._rotationBuf[0] = state.rotation[0];
    this._rotationBuf[1] = state.rotation[1];
    this._rotationBuf[2] = state.rotation[2];
    this._rotationBuf[3] = state.rotation[3];

    const id = this.requestId++;

    const request: EncodeStateVRRequest = {
      type: 'encode_state_vr',
      id,
      clientId,
      position: this._positionBuf,
      rotation: this._rotationBuf,
      action: ACTION_MAP[state.action] ?? ACTION_IDLE,
      hangtime: state.hangtime,
      headQuat: new Float32Array(state.headQuat),
      leftWristQuat: new Float32Array(state.leftWristQuat),
      leftFingers: state.leftFingers,
      rightWristQuat: new Float32Array(state.rightWristQuat),
      rightFingers: state.rightFingers,
      ...this._packBodyState(state),
      vrFlags: state.vrFlags,
    };
    this.worker!.postMessage(request);
  }

  /** Pack isSwimming/isFlying/isBoosting into a bitfield + quantize blend values to u8 */
  private _packBodyState(state: PlayerStateInput): { bodyFlags: number; swimBlend: number; flyPoseTime: number } {
    let flags = 0;
    if (state.isSwimming) flags |= 0x01;
    if (state.isFlying) flags |= 0x02;
    if (state.isBoosting) flags |= 0x04;
    return {
      bodyFlags: flags,
      swimBlend: Math.round(Math.min(1, Math.max(0, state.swimBlend ?? 0)) * 255),
      flyPoseTime: Math.round(Math.min(2, Math.max(0, state.flyPoseTime ?? 0.5)) / 2.0 * 255),
    };
  }

  private _sendLegacyJson(state: PlayerStateInput, clientId: string, userData?: any) {
    const peerData: any = {
      position: state.position,
      rotation: [state.rotation[0], state.rotation[1], state.rotation[2], state.rotation[3]],
      profileImage: userData?.profileImage,
      playerVRM: userData?.playerVRM,
      vrm: userData?.vrm,
      inWorldName: (window as any).userData?.inWorldName || userData?.inWorldName,
      isMoving: state.action === 'idle' || state.action === 'jumpStop'
        ? (state.action === 'jumpStop' ? { action: 'jumpStop', hangtime: state.hangtime } : false)
        : { action: state.action, instance: 'update', hangtime: state.hangtime },
      isSwimming: !!state.isSwimming,
      isFlying: !!state.isFlying,
      isBoosting: !!state.isBoosting,
      swimBlend: state.swimBlend ?? 0,
      flyPoseTime: state.flyPoseTime ?? 0.5,
    };

    // Include VR hand/head data when available (PlayerStateVRInput extends PlayerStateInput)
    const vrState = state as any;
    if (vrState.headQuat) {
      peerData.headQuat = vrState.headQuat;
    }
    if (vrState.leftWristQuat) {
      peerData.leftHand = {
        wristQuat: vrState.leftWristQuat,
        fingerJoints: this._packFingerJoints(vrState.leftFingers),
      };
    }
    if (vrState.rightWristQuat) {
      peerData.rightHand = {
        wristQuat: vrState.rightWristQuat,
        fingerJoints: this._packFingerJoints(vrState.rightFingers),
      };
    }
    // Arm IK bone data from VR
    if (vrState.leftUpperArmQuat) peerData.leftUpperArmQuat = vrState.leftUpperArmQuat;
    if (vrState.leftLowerArmQuat) peerData.leftLowerArmQuat = vrState.leftLowerArmQuat;
    if (vrState.rightUpperArmQuat) peerData.rightUpperArmQuat = vrState.rightUpperArmQuat;
    if (vrState.rightLowerArmQuat) peerData.rightLowerArmQuat = vrState.rightLowerArmQuat;

    const messageObject: any = { [clientId]: peerData };
    const encoded = new TextEncoder().encode(JSON.stringify(messageObject));
    this.p2pcf.broadcast(encoded);
  }

  /** Convert Float32Array of 60 floats (15 joints × 4 components) to array of [x,y,z,w] tuples */
  private _packFingerJoints(fingers: Float32Array | undefined): [number,number,number,number][] {
    if (!fingers || fingers.length < 60) return [];
    const joints: [number,number,number,number][] = [];
    for (let i = 0; i < 15; i++) {
      const b = i * 4;
      joints.push([fingers[b], fingers[b+1], fingers[b+2], fingers[b+3]]);
    }
    return joints;
  }

  private _notifyListeners(state: DecodedPeerState) {
    for (const listener of this.peerStateListeners) {
      listener(state);
    }
  }

  /**
   * Get the tier of the closest peer for spatial gating decisions.
   * Since p2pcf broadcasts to ALL peers, we use the closest peer's tier
   * to determine what data to include (e.g., hand data).
   */
  private _getClosestPeerTier(): number {
    if (this._peerPositions.size === 0) return TIER_FULL; // No peers, send full
    let closestDistSq = Infinity;
    const [lx, ly, lz] = this._localPosition;
    for (const pos of this._peerPositions.values()) {
      const dx = pos[0] - lx;
      const dy = pos[1] - ly;
      const dz = pos[2] - lz;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < closestDistSq) closestDistSq = distSq;
    }
    return distanceToTier(closestDistSq);
  }

  private _notifyProfileListeners(profile: DecodedPeerProfile) {
    for (const listener of this.peerProfileListeners) {
      listener(profile);
    }
  }

  private _notifyVehicleListeners(state: DecodedVehicleState) {
    for (const listener of this.vehicleStateListeners) {
      listener(state);
    }
  }
}

/** Singleton instance */
let _instance: NetworkBridge | null = null;

export function getNetworkBridge(): NetworkBridge {
  if (!_instance) {
    _instance = new NetworkBridge();
    // The synthetic-peer harness deliberately bypasses p2pcf (it feeds
    // DecodedPeerState straight through the listener path), so it must not
    // require a live signaling connection to exist — install it with the
    // bridge, not inside init(). Window-guarded + idempotent.
    installFakePeerDriver();
  }
  return _instance;
}
