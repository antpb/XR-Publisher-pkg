/**
 * peerEvents — tiny join/leave emitter for plugin authors.
 *
 * Before this existed every multiplayer plugin hand-rolled peer liveness
 * (resonance-plaza/-stage each keep an 8s "last heard from" window) because
 * the engine never surfaced p2pcf's peerconnect/peerclose. Networking.tsx
 * calls emitPeerJoin/emitPeerLeave from those handlers; plugins subscribe
 * via XRPublisher.onPeerJoin/onPeerLeave.
 *
 * Ids are CLIENT ids — the same ids `getPeers()` and `onMessage` use.
 */

type PeerListener = (peerId: string) => void;

const joinListeners = new Set<PeerListener>();
const leaveListeners = new Set<PeerListener>();

export function emitPeerJoin(peerId: string): void {
	for (const cb of joinListeners) {
		try {
			cb(peerId);
		} catch (err) {
			console.error('[XRPublisher] onPeerJoin listener threw:', err);
		}
	}
}

export function emitPeerLeave(peerId: string): void {
	for (const cb of leaveListeners) {
		try {
			cb(peerId);
		} catch (err) {
			console.error('[XRPublisher] onPeerLeave listener threw:', err);
		}
	}
}

export function onPeerJoin(cb: PeerListener): () => void {
	joinListeners.add(cb);
	return () => joinListeners.delete(cb);
}

export function onPeerLeave(cb: PeerListener): () => void {
	leaveListeners.add(cb);
	return () => leaveListeners.delete(cb);
}
