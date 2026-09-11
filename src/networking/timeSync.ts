/**
 * timeSync — room-synced, linear world clock.
 *
 * The world's time of day is ONE shared timeline per room, not a per-client
 * value. The FIRST participant in the room is the time authority ("instance
 * admin"): their clock is the reference everyone converges to, and they
 * answer late joiners. Any client that calls `XRPublisher.setTimeOfDay()`
 * broadcasts the change so the whole room moves together (the authority
 * adopts it too, so their heartbeat carries the new time from then on).
 *
 * Design constraints this satisfies:
 *  - Time is LINEAR by default — an unpaused set jumps the clock and lets the
 *    day cycle keep running (see the 'xrpublisher:set-time' re-anchor event
 *    consumed by ProceduralSky[WebGL]); a paused set freezes it (night show).
 *  - No local "time bubbles": a change applies globally, for everyone.
 *  - Authority = FIRST participant (join-time election, ties broken by client
 *    id), NOT lowest id — matching "the first person in the room is the admin".
 *  - Self-healing: the authority heartbeats the full time state every few
 *    seconds over the reserved custom channel, so late joiners, missed
 *    packets, and drift all converge within one heartbeat.
 *  - Zero cost when networking is off: broadcastCustom() no-ops with no
 *    p2pcf, and the interval is a tiny JSON message when it is on.
 *
 * This module deliberately has NO React/store imports beyond the sky store —
 * it is a plain singleton, consumable from the static XRPublisher API.
 */
import { getNetworkBridge } from './NetworkBridge';
import useProceduralSkyStore from '../stores/proceduralSkyStore';

/** Reserved channel — plugins must not use it (see broadcast() docs). */
export const TIME_SYNC_CHANNEL = '__xrp:time';

const HEARTBEAT_MS = 2500;
/** Peers silent longer than this drop out of the election. */
const PEER_TIMEOUT_MS = 8000;
/** Drift below this (hours) is left alone — re-snapping the sky every
 *  heartbeat would visibly stutter phase transitions. 0.05h = 3 game-minutes. */
const DRIFT_TOLERANCE_H = 0.05;

interface TimeState {
  hour: number;
  paused: boolean;
}

type WireMsg =
  | { t: 'hb'; joinedAt: number }                       // presence for election
  | { t: 'set'; hour: number; paused: boolean }          // explicit change (any client)
  | { t: 'sync'; hour: number; paused: boolean; joinedAt: number }; // authority heartbeat

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;
/** When WE joined the room (first moment we had a client id). */
let joinedAt: number | null = null;
/** peerId -> { joinedAt, lastSeen } for everyone heartbeating the channel. */
const peers = new Map<string, { joinedAt: number; lastSeen: number }>();

const bridge = () => getNetworkBridge();

/** Apply a time state locally WITHOUT re-broadcasting (receive path). */
function applyLocal({ hour, paused }: TimeState): void {
  const s = useProceduralSkyStore.getState();
  const h = ((hour % 24) + 24) % 24;
  s.setCurrentTime(h);
  if (paused) {
    s.stopAnimation();
    s.setTimeOverride(h);
  } else {
    s.setTimeOverride(null);
    s.startAnimation();
    // Re-anchor the running day-cycle clock in ProceduralSky[WebGL] — without
    // this, the per-component animationStartTime ref overwrites the new hour
    // on the very next frame and the set silently does nothing.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xrpublisher:set-time', { detail: { hour: h } }));
    }
  }
}

function currentState(): TimeState {
  const s = useProceduralSkyStore.getState();
  return { hour: s.currentTime, paused: s.timeOverride != null };
}

/** The authority is the longest-present participant (ties → smallest id).
 *  Solo / not connected → we are the authority. */
export function isTimeAuthority(): boolean {
  const myId = bridge().localClientId;
  if (!myId || joinedAt == null) return true; // not in a room yet
  let bestId = myId;
  let bestJoined = joinedAt;
  const cutoff = Date.now() - PEER_TIMEOUT_MS;
  for (const [id, p] of peers) {
    if (p.lastSeen < cutoff) { peers.delete(id); continue; }
    if (p.joinedAt < bestJoined || (p.joinedAt === bestJoined && id < bestId)) {
      bestId = id;
      bestJoined = p.joinedAt;
    }
  }
  return bestId === myId;
}

function authorityId(): string | null {
  const myId = bridge().localClientId;
  if (!myId || joinedAt == null) return myId;
  let bestId = myId;
  let bestJoined = joinedAt;
  for (const [id, p] of peers) {
    if (p.joinedAt < bestJoined || (p.joinedAt === bestJoined && id < bestId)) {
      bestId = id;
      bestJoined = p.joinedAt;
    }
  }
  return bestId;
}

function onMessage(peerId: string, data: WireMsg): void {
  if (!data || typeof data !== 'object') return;
  const myId = bridge().localClientId;
  if (peerId && peerId !== myId) {
    if (data.t === 'hb' || data.t === 'sync') {
      peers.set(peerId, { joinedAt: data.joinedAt ?? Date.now(), lastSeen: Date.now() });
    }
  }
  if (data.t === 'set') {
    // Explicit change from any participant — apply verbatim. The authority
    // applies it too, so its subsequent heartbeats carry the new timeline.
    if (typeof data.hour === 'number') applyLocal({ hour: data.hour, paused: !!data.paused });
  } else if (data.t === 'sync') {
    // Authority heartbeat — converge, but only if it IS the authority and
    // we're outside the drift tolerance (avoid re-snapping the sky per beat).
    if (peerId !== authorityId() || typeof data.hour !== 'number') return;
    const local = currentState();
    let drift = Math.abs(local.hour - data.hour);
    drift = Math.min(drift, 24 - drift);
    if (local.paused !== !!data.paused || drift > DRIFT_TOLERANCE_H) {
      applyLocal({ hour: data.hour, paused: !!data.paused });
    }
  }
}

/** Idempotent. Safe to call before networking exists — everything is lazy. */
export function initTimeSync(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  bridge().onCustomMessage(TIME_SYNC_CHANNEL, onMessage as (peerId: string, data: any) => void);
  timer = setInterval(() => {
    const id = bridge().localClientId;
    if (!id) { joinedAt = null; peers.clear(); return; } // not connected
    if (joinedAt == null) joinedAt = Date.now();          // the moment we joined
    if (isTimeAuthority()) {
      const s = currentState();
      bridge().broadcastCustom(TIME_SYNC_CHANNEL, { t: 'sync', hour: s.hour, paused: s.paused, joinedAt } satisfies WireMsg);
    } else {
      bridge().broadcastCustom(TIME_SYNC_CHANNEL, { t: 'hb', joinedAt } satisfies WireMsg);
    }
  }, HEARTBEAT_MS);
}

export function stopTimeSync(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
  joinedAt = null;
  peers.clear();
}

/**
 * The public entry — called by XRPublisher.setTimeOfDay/setDayCyclePaused.
 * Applies locally, then broadcasts so the whole room follows. Works
 * identically solo (broadcast no-ops).
 */
export function setSharedTimeOfDay(hour: number, paused: boolean): void {
  initTimeSync();
  applyLocal({ hour, paused });
  bridge().broadcastCustom(TIME_SYNC_CHANNEL, { t: 'set', hour: ((hour % 24) + 24) % 24, paused } satisfies WireMsg);
}
