/**
 * FakePeerDriver — dev-only synthetic peer load harness.
 *
 * `window.__xrpFakePeers(n)` spawns n synthetic participants that move,
 * change animation actions, jump and swim on scripted cycles, feeding
 * DecodedPeerState through the same NetworkBridge listener path real
 * packets use. This exercises the full receive side — VRM loads, mixers,
 * interpolation, lifecycle — without n real machines. It deliberately
 * bypasses p2pcf (wire-level behavior is covered by multi-window tests
 * against real signaling).
 *
 * `window.__xrpFakePeers(0)` removes all synthetic peers (dispose-path
 * exercise). Returns the active count.
 *
 * Installed from NetworkBridge.init() in dev builds only.
 */
import { getNetworkBridge } from './NetworkBridge';
import type { DecodedPeerState } from './NetworkBridge';

interface FakePeer {
  id: string;
  baseX: number;
  baseZ: number;
  phase: number;
  speed: number;
}

const _peers: FakePeer[] = [];
let _timer: ReturnType<typeof setInterval> | null = null;
let _tick = 0;

function fnv16(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h & 0xffff;
}

function stepPeers() {
  const bridge = getNetworkBridge() as any;
  _tick++;
  const t = _tick / 10; // 10Hz driver

  for (const peer of _peers) {
    // Scripted cycle: 6s walk circle → 2s run → 1s jump → 3s idle.
    const cycle = (t + peer.phase) % 12;
    let action: string;
    if (cycle < 6) action = 'walking';
    else if (cycle < 8) action = 'running';
    else if (cycle < 9) action = 'jumping';
    else action = 'idle';

    const moving = action === 'walking' || action === 'running';
    const radius = 6;
    const angle = (t * peer.speed + peer.phase) % (Math.PI * 2);
    const x = peer.baseX + (moving ? Math.cos(angle) * radius : Math.cos(peer.phase) * radius);
    const z = peer.baseZ + (moving ? Math.sin(angle) * radius : Math.sin(peer.phase) * radius);
    const y = action === 'jumping' ? Math.sin(((cycle - 8) * Math.PI)) * 1.2 : 0;

    const yaw = angle + Math.PI / 2;
    const state: DecodedPeerState = {
      clientIdHash: fnv16(peer.id),
      peerId: peer.id,
      position: [x, y, z],
      rotation: [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)],
      action,
      hangtime: 0,
    };
    bridge._notifyListeners(state);
  }
}

export function installFakePeerDriver(): void {
  if (typeof window === 'undefined' || (window as any).__xrpFakePeers) return;

  (window as any).__xrpFakePeers = (n: number): number => {
    const store = (window as any).useParticipantsStore
      // Lazy import to avoid a hard module cycle — the store registers
      // itself on window in dev, fall back to dynamic import.
      ?? null;

    const apply = (participantsStore: any) => {
      const { addParticipant, removeParticipant } = participantsStore.getState();

      // Remove extras.
      while (_peers.length > n) {
        const peer = _peers.pop()!;
        removeParticipant(peer.id);
      }
      // Add new ones.
      while (_peers.length < n) {
        const i = _peers.length;
        const id = `fake-peer-${i}`;
        _peers.push({
          id,
          baseX: Math.cos((i / Math.max(1, n)) * Math.PI * 2) * (10 + (i % 5) * 8),
          baseZ: Math.sin((i / Math.max(1, n)) * Math.PI * 2) * (10 + (i % 5) * 8) - 5,
          phase: i * 1.7,
          speed: 0.6 + (i % 4) * 0.2,
        });
        // [clientId, playerVRM(''=default avatar), inWorldName, profileImage]
        addParticipant([id, '', `Fake ${i}`, '']);
      }

      if (_peers.length > 0 && !_timer) {
        _timer = setInterval(stepPeers, 100); // 10Hz like a mid-tier real peer
      } else if (_peers.length === 0 && _timer) {
        clearInterval(_timer);
        _timer = null;
      }
      console.log(`[FakePeerDriver] ${_peers.length} synthetic peers active`);
      return _peers.length;
    };

    if (store) return apply(store);
    // Dynamic import keeps the store out of this module's static graph.
    import('../components/core/front/utils/participantsStore')
      .then((mod: any) => apply(mod.useParticipantsStore ?? mod.default))
      .catch((e) => console.warn('[FakePeerDriver] store unavailable', e));
    return _peers.length;
  };
}
