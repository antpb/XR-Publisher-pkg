/**
 * proximityVoice — VRChat-style distance-attenuated peer voice.
 *
 * Before this module, every remote peer's mic stream was attached to a bare
 * `<audio>` element at full volume — a flat, world-wide voice mesh that got
 * noisy fast and couldn't scale. This module owns remote voice playback:
 *
 *  RECEIVE SIDE — each peer's stream is routed through the engine's shared
 *  AudioContext (`window.__xrAudioListener`, the camera-mounted THREE
 *  AudioListener that already gets gesture-unlock + per-frame listener
 *  orientation updates) as `MediaStreamSource → PannerNode → GainNode →
 *  destination`. The panner gives directional stereo (you hear WHERE a
 *  voice is); the gain applies our own distance falloff — full volume
 *  inside `fadeStart`, smooth curve to silence at `maxDistance`.
 *
 *  Defaults derive from the TERRAIN CELL so voice range naturally matches
 *  world scale: hearing radius = half the chunk width (`window.__xrTerrainWidth`),
 *  fade begins at 25% of that radius. This is the "graceful cell
 *  segmentation": peers sharing your cell are audible, peers a cell away
 *  fade to nothing — with no hard boundary pop when someone crosses a line.
 *
 *  SEND SIDE — voice cost is what limits room size, so beyond hearing range
 *  we stop ENCODING for that peer entirely: `RTCRtpSender.replaceTrack(null)`
 *  per connection (no renegotiation), restored when they come back in range.
 *  Hysteresis (gate out at 1.15×, back in at 1.0×) prevents flapping at the
 *  boundary. Mic upload therefore scales with NEARBY peers, not room size.
 *  Data traffic (positions, world state, plugin broadcasts) is untouched —
 *  world-wide events keep working from any distance.
 *
 *  A muted `<audio>` element is kept per peer as a Chrome keep-alive (a
 *  remote MediaStream routed only through WebAudio goes silent in some
 *  Chrome versions unless an audio element also holds the stream). If the
 *  shared AudioContext doesn't exist yet (peer connected before the player
 *  camera mounted), the element plays UNMUTED as a fallback and the graph
 *  is wired up on a later tick.
 *
 * Plugin surface (exposed via XRPublisher statics):
 *   configureProximityVoice / setPeerVoiceOverride / setLocalVoiceGlobal /
 *   getVoicePeers / getPeerAudioLevel — see index.tsx for docs.
 */

import { getNetworkBridge } from './NetworkBridge';

export interface ProximityVoiceConfig {
	/** Master switch. false = legacy behavior: every peer at full volume, no send gating. */
	enabled: boolean;
	/** Directional stereo via PannerNode. false = distance falloff only. */
	spatialize: boolean;
	/** Distance where fade begins. null = auto (25% of terrain cell radius). */
	fadeStart: number | null;
	/** Distance where voice is silent (and sends gate off). null = auto (cell radius). */
	maxDistance: number | null;
	/** Falloff curve shape — higher = steeper near the edge. */
	exponent: number;
}

export interface PeerVoiceOverride {
	/** Hear this peer at full volume everywhere (megaphone / performer). */
	global?: boolean;
	/** Volume multiplier 0..2 applied after distance falloff (0 = local mute). */
	gain?: number;
}

export interface VoicePeerInfo {
	id: string;
	distance: number | null;
	gain: number;
	/** true when we've stopped sending our mic to this peer (out of range). */
	sendGated: boolean;
}

interface VoiceEntry {
	clientId: string;
	stream: MediaStream;
	el: HTMLAudioElement;
	ctx: AudioContext | null;
	src: MediaStreamAudioSourceNode | null;
	panner: PannerNode | null;
	gain: GainNode | null;
	analyser: AnalyserNode | null;
	analyserData: Uint8Array | null;
	/** Cached RMS + when it was computed (see getPeerAudioLevel). */
	lastLevel: number;
	lastLevelAt: number;
	spatialWired: boolean;
	lastGain: number;
	lastDistance: number | null;
}

interface SenderGate {
	sender: RTCRtpSender;
	gated: boolean;
}

const TICK_MS = 100; // 10Hz — matches the WorldCursor/interactable proximity cadence
const GATE_OUT_FACTOR = 1.15; // stop sending beyond maxDistance × this…
const GAIN_SMOOTH_TC = 0.12; // seconds — setTargetAtTime constant (no zipper noise)
const POS_SMOOTH_TC = 0.05;
const FALLBACK_CELL_RADIUS = 48; // worlds without procedural terrain

const config: ProximityVoiceConfig = {
	enabled: true,
	spatialize: true,
	fadeStart: null,
	maxDistance: null,
	exponent: 1.6,
};

const entries = new Map<string, VoiceEntry>();
const overrides = new Map<string, PeerVoiceOverride>();
const senderGates = new Map<string, SenderGate>();
let localVoiceGlobal = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;

/* ── Range resolution ──────────────────────────────────────────────────── */

function cellRadius(): number {
	const w = (window as any).__xrTerrainWidth;
	return typeof w === 'number' && w > 0 ? w / 2 : FALLBACK_CELL_RADIUS;
}

function resolveRange(): { fadeStart: number; maxDistance: number } {
	const radius = cellRadius();
	const maxDistance = config.maxDistance ?? radius;
	const fadeStart = Math.min(
		config.fadeStart ?? Math.max(8, radius * 0.25),
		maxDistance * 0.9,
	);
	return { fadeStart, maxDistance };
}

function distanceGain(d: number, fadeStart: number, maxDistance: number): number {
	if (d <= fadeStart) return 1;
	if (d >= maxDistance) return 0;
	const t = 1 - (d - fadeStart) / (maxDistance - fadeStart);
	return Math.pow(t, config.exponent);
}

/* ── WebAudio wiring ───────────────────────────────────────────────────── */

function sharedContext(): AudioContext | null {
	const listener = (window as any).__xrAudioListener;
	return listener?.context ?? null;
}

function setPannerPosition(panner: PannerNode, x: number, y: number, z: number, ctx: AudioContext): void {
	if (panner.positionX) {
		const t = ctx.currentTime;
		panner.positionX.setTargetAtTime(x, t, POS_SMOOTH_TC);
		panner.positionY.setTargetAtTime(y, t, POS_SMOOTH_TC);
		panner.positionZ.setTargetAtTime(z, t, POS_SMOOTH_TC);
	} else {
		// Older Safari — no AudioParams on PannerNode.
		(panner as any).setPosition(x, y, z);
	}
}

/** Route src → [panner →] gain per the spatialize flag. Idempotent. */
function wireGraphTopology(entry: VoiceEntry): void {
	if (!entry.src || !entry.gain || !entry.panner) return;
	const wantSpatial = config.spatialize;
	if (entry.spatialWired === wantSpatial) return;
	try {
		entry.src.disconnect();
		entry.panner.disconnect();
		if (wantSpatial) {
			entry.src.connect(entry.panner);
			entry.panner.connect(entry.gain);
		} else {
			entry.src.connect(entry.gain);
		}
		if (entry.analyser) entry.src.connect(entry.analyser);
		entry.spatialWired = wantSpatial;
	} catch (err) {
		console.warn('[XRPublisher] voice graph rewire failed:', err);
	}
}

/** Attach the WebAudio graph once the shared AudioContext exists. */
function tryWireWebAudio(entry: VoiceEntry): void {
	if (entry.ctx) return;
	const ctx = sharedContext();
	if (!ctx) return; // player camera not mounted yet — element plays unmuted
	try {
		const src = ctx.createMediaStreamSource(entry.stream);
		const panner = ctx.createPanner();
		panner.panningModel = 'equalpower'; // HRTF is too costly for N voices
		// No built-in distance attenuation — our GainNode owns the falloff.
		panner.distanceModel = 'inverse';
		panner.refDistance = 1;
		panner.rolloffFactor = 0;
		const gain = ctx.createGain();
		gain.gain.value = entry.lastGain;
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 512;
		analyser.smoothingTimeConstant = 0.6;

		gain.connect(ctx.destination);
		entry.ctx = ctx;
		entry.src = src;
		entry.panner = panner;
		entry.gain = gain;
		entry.analyser = analyser;
		entry.analyserData = new Uint8Array(analyser.fftSize);
		entry.spatialWired = !config.spatialize; // force wireGraphTopology to connect
		wireGraphTopology(entry);
		// Element becomes a muted keep-alive; WebAudio owns the output now.
		entry.el.muted = true;
	} catch (err) {
		console.warn('[XRPublisher] voice WebAudio attach failed (falling back to plain audio):', err);
	}
}

/* ── Attach / detach ───────────────────────────────────────────────────── */

interface VoicePeerLike {
	id: string;
	client_id?: string;
	_pc?: RTCPeerConnection;
}

export function peerClientId(peer: VoicePeerLike): string {
	return peer.client_id || peer.id;
}

/**
 * Called from Networking.tsx's peer `track` handler. Owns element creation
 * (the old code appended a bare full-volume `<audio>` to `#videos`).
 */
export function attachPeerVoice(peer: VoicePeerLike, stream: MediaStream): void {
	const clientId = peerClientId(peer);
	const existing = entries.get(clientId);
	if (existing) {
		if (existing.stream === stream) return; // second track of the same stream
		detachPeerVoice(clientId); // device switch on their side → rebuild
	}

	const el = document.createElement('audio');
	el.id = `voice-${clientId}`;
	el.srcObject = stream;
	el.setAttribute('playsinline', 'true');
	el.style.display = 'none';
	(document.getElementById('videos') ?? document.body).appendChild(el);
	void el.play().catch((err) => console.warn('[XRPublisher] voice audio play blocked:', err));

	const entry: VoiceEntry = {
		clientId,
		stream,
		el,
		ctx: null,
		src: null,
		panner: null,
		gain: null,
		analyser: null,
		analyserData: null,
		spatialWired: false,
		lastGain: 1,
		lastDistance: null,
		lastLevel: 0,
		lastLevelAt: 0,
	};
	entries.set(clientId, entry);
	tryWireWebAudio(entry);
	ensureTicker();
}

export function detachPeerVoice(clientId: string): void {
	const entry = entries.get(clientId);
	if (entry) {
		try {
			entry.src?.disconnect();
			entry.panner?.disconnect();
			entry.gain?.disconnect();
			entry.analyser?.disconnect();
		} catch {
			/* nodes may already be disconnected */
		}
		entry.el.srcObject = null;
		entry.el.remove();
		entries.delete(clientId);
	}
	senderGates.delete(clientId);
	overrides.delete(clientId);
	if (entries.size === 0 && tickTimer) {
		clearInterval(tickTimer);
		tickTimer = null;
	}
}

export function detachAllPeerVoice(): void {
	for (const clientId of [...entries.keys()]) detachPeerVoice(clientId);
}

/* ── The 10Hz tick ─────────────────────────────────────────────────────── */

function ensureTicker(): void {
	if (tickTimer) return;
	tickTimer = setInterval(tick, TICK_MS);
}

function localPosition(): { x: number; y: number; z: number } | null {
	const st = (window as any).__xrPlayerState;
	return st && typeof st.x === 'number' ? st : null;
}

function peerPositionMap(): Map<string, { x: number; y: number; z: number }> {
	const map = new Map<string, { x: number; y: number; z: number }>();
	try {
		for (const p of getNetworkBridge().getPeerPositions()) map.set(p.id, p);
	} catch {
		/* bridge not initialized yet */
	}
	return map;
}

function tick(): void {
	const positions = peerPositionMap();
	const local = localPosition();
	const { fadeStart, maxDistance } = resolveRange();

	for (const entry of entries.values()) {
		if (!entry.ctx) tryWireWebAudio(entry);
		wireGraphTopology(entry);

		const pos = positions.get(entry.clientId);
		const dist =
			pos && local
				? Math.hypot(pos.x - local.x, pos.y - local.y, pos.z - local.z)
				: null;
		entry.lastDistance = dist;

		const override = overrides.get(entry.clientId);
		let g: number;
		if (!config.enabled || override?.global) {
			g = 1;
		} else if (dist === null) {
			g = 1; // no position yet (just joined) — audible beats silent
		} else {
			g = distanceGain(dist, fadeStart, maxDistance);
		}
		if (override?.gain !== undefined) g *= Math.max(0, Math.min(2, override.gain));
		entry.lastGain = g;

		if (entry.gain && entry.ctx) {
			entry.gain.gain.setTargetAtTime(g, entry.ctx.currentTime, GAIN_SMOOTH_TC);
			if (entry.panner && pos && config.spatialize) {
				setPannerPosition(entry.panner, pos.x, pos.y, pos.z, entry.ctx);
			}
		} else {
			// WebAudio unavailable — coarse fallback on the element itself.
			entry.el.volume = Math.max(0, Math.min(1, g));
		}
	}

	updateSenderGates(positions, local, maxDistance);
}

/* ── Sender-side gating ────────────────────────────────────────────────── */

function ungateAll(): void {
	const localStream = (window as any).localStream as MediaStream | null;
	const track = localStream?.getAudioTracks()[0] ?? null;
	for (const [clientId, gate] of senderGates) {
		if (gate.gated && track) {
			gate.sender.replaceTrack(track).catch(() => senderGates.delete(clientId));
		}
		gate.gated = false;
	}
}

function updateSenderGates(
	positions: Map<string, { x: number; y: number; z: number }>,
	local: { x: number; y: number; z: number } | null,
	maxDistance: number,
): void {
	const localStream = (window as any).localStream as MediaStream | null;
	const track = localStream?.getAudioTracks()[0];
	if (!track || !config.enabled || localVoiceGlobal) {
		if (localVoiceGlobal || !config.enabled) ungateAll();
		return;
	}
	const p2pcf = (window as any).p2pcf;
	if (!p2pcf?.peers || !local) return;

	for (const peer of p2pcf.peers.values() as Iterable<VoicePeerLike>) {
		const clientId = peerClientId(peer);
		const pos = positions.get(clientId);
		if (!pos) continue; // unknown position — keep sending
		const dist = Math.hypot(pos.x - local.x, pos.y - local.y, pos.z - local.z);
		const gate = senderGates.get(clientId);

		if (!gate?.gated && dist > maxDistance * GATE_OUT_FACTOR) {
			// A peer whose remote side muted THEIR mic still has our sender.
			const sender = peer._pc
				?.getSenders?.()
				.find((s) => s.track && s.track.kind === 'audio');
			if (sender) {
				sender.replaceTrack(null).catch(() => {});
				senderGates.set(clientId, { sender, gated: true });
			}
		} else if (gate?.gated && dist < maxDistance) {
			// Re-read the CURRENT track — the user may have switched mics
			// while this peer was gated.
			const current = localStream.getAudioTracks()[0];
			gate.sender
				.replaceTrack(current ?? null)
				.then(() => {
					gate.gated = false;
				})
				.catch(() => senderGates.delete(clientId)); // stale sender (device switch re-added a new one)
		}
	}
}

/* ── Plugin-facing API (wrapped by XRPublisher statics) ────────────────── */

export function configureProximityVoice(opts: Partial<ProximityVoiceConfig>): void {
	Object.assign(config, opts);
	if (!config.enabled) ungateAll();
}

export function getProximityVoiceConfig(): ProximityVoiceConfig & {
	resolvedFadeStart: number;
	resolvedMaxDistance: number;
} {
	const { fadeStart, maxDistance } = resolveRange();
	return { ...config, resolvedFadeStart: fadeStart, resolvedMaxDistance: maxDistance };
}

export function setPeerVoiceOverride(clientId: string, override: PeerVoiceOverride | null): void {
	if (override) overrides.set(clientId, override);
	else overrides.delete(clientId);
}

export function setLocalVoiceGlobal(on: boolean): void {
	localVoiceGlobal = on;
	if (on) ungateAll();
}

export function getVoicePeers(): VoicePeerInfo[] {
	const out: VoicePeerInfo[] = [];
	for (const entry of entries.values()) {
		out.push({
			id: entry.clientId,
			distance: entry.lastDistance,
			gain: entry.lastGain,
			sendGated: senderGates.get(entry.clientId)?.gated ?? false,
		});
	}
	return out;
}

/**
 * 0..1 RMS voice level for a peer (pre-falloff, so a whisper across the map
 * still registers). 0 when the peer isn't voice-connected or is silent.
 */
/** Minimum ms between real analyser reads per peer. A speaking indicator does
 *  not need per-frame resolution (the analyser already smooths at 0.6, and
 *  callers ease toward the value), but the natural way to call this IS from a
 *  per-frame loop — the multiplayer demo does, and in a profile that loop was
 *  8.5% of the entire main thread. Each uncached call is a native analyser
 *  read plus a 512-iteration RMS, per peer, per frame. */
const AUDIO_LEVEL_CACHE_MS = 50;   // 20Hz

export function getPeerAudioLevel(clientId: string): number {
	const entry = entries.get(clientId);
	if (!entry?.analyser || !entry.analyserData) return 0;
	// Cached per peer: N callers in one frame (and successive frames inside
	// the window) share one read instead of each paying for their own.
	const now = performance.now();
	if (now - entry.lastLevelAt < AUDIO_LEVEL_CACHE_MS) return entry.lastLevel;
	entry.lastLevelAt = now;
	entry.analyser.getByteTimeDomainData(entry.analyserData as any);
	let sum = 0;
	const data = entry.analyserData;
	for (let i = 0; i < data.length; i++) {
		const v = (data[i] - 128) / 128;
		sum += v * v;
	}
	entry.lastLevel = Math.min(1, Math.sqrt(sum / data.length) * 3);
	return entry.lastLevel;
}
