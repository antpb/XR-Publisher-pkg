import * as THREE from 'three';
import { createFile as mp4boxCreateFile } from 'mp4box';

export interface SpatialMetaEntry {
  trackIndex: number;
  spatialPosition: string;
  volume?: number;
}

export interface TrackInfo {
  id: number;
  codec: string;
  sampleRate: number | undefined;
  channels: number | undefined;
  isEnabled: boolean;
  duration: number;
  isAPAC: boolean;
  isAmbisonics: boolean;
  ambOrder: number;
}

export interface ParsedSpatialFile {
  trackInfo: TrackInfo[];
  spatialMeta: SpatialMetaEntry[] | null;
  audioBuffer: AudioBuffer;
}

export const NAMED_POSITIONS: Record<string, THREE.Vector3> = {
  'center':      new THREE.Vector3( 0.0,  0.0, -1.0),
  'front-left':  new THREE.Vector3(-0.7,  0.0, -0.7),
  'front-right': new THREE.Vector3( 0.7,  0.0, -0.7),
  'side-left':   new THREE.Vector3(-1.0,  0.0,  0.0),
  'side-right':  new THREE.Vector3( 1.0,  0.0,  0.0),
  'rear-left':   new THREE.Vector3(-0.7,  0.0,  0.7),
  'rear-right':  new THREE.Vector3( 0.7,  0.0,  0.7),
  'above':       new THREE.Vector3( 0.0,  1.0, -0.3),
};

/**
 * A THREE.Group subclass that wraps multiple PositionalAudio and Audio sources
 * from a spatial mp4. Delegates play/stop/pause/setVolume to all children so
 * the caller can treat it like a single Audio object.
 */
export class SpatialAudioGroup extends THREE.Group {
  private _sources: Array<THREE.PositionalAudio | THREE.Audio>;

  constructor(sources: Array<THREE.PositionalAudio | THREE.Audio>) {
    super();
    this._sources = sources;
    for (const src of sources) {
      this.add(src);
    }
  }

  get isPlaying(): boolean {
    return this._sources.some(s => s.isPlaying);
  }

  play(): this {
    const ctx = this._sources[0]?.context;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    for (const src of this._sources) {
      if (!src.isPlaying) src.play();
    }
    return this;
  }

  pause(): this {
    for (const src of this._sources) {
      if (src.isPlaying) src.pause();
    }
    return this;
  }

  stop(): this {
    for (const src of this._sources) {
      if (src.isPlaying) src.stop();
    }
    return this;
  }

  setVolume(vol: number): this {
    for (const src of this._sources) {
      src.setVolume(vol);
    }
    return this;
  }

  setLoop(loop: boolean): this {
    for (const src of this._sources) {
      src.setLoop(loop);
    }
    return this;
  }
}

function inferAmbisonicsFromChannelCount(channelCount: number | undefined): { isAmbisonics: boolean; order: number } {
  if (!channelCount) return { isAmbisonics: false, order: 0 };
  const sqrt = Math.sqrt(channelCount);
  const isSquare = Number.isInteger(sqrt) && sqrt >= 2;
  return { isAmbisonics: isSquare, order: isSquare ? sqrt - 1 : 0 };
}

async function inspectMP4Tracks(buffer: ArrayBuffer): Promise<TrackInfo[]> {
  return new Promise((resolve, reject) => {
    const mp4 = mp4boxCreateFile();
    const tracks: TrackInfo[] = [];

    mp4.onReady = (info: any) => {
      for (const t of info.tracks) {
        if (t.type !== 'audio') continue;
        const layout = inferAmbisonicsFromChannelCount(t.audio?.channel_count);
        tracks.push({
          id:           t.id,
          codec:        t.codec,
          sampleRate:   t.audio?.sample_rate,
          channels:     t.audio?.channel_count,
          isEnabled:    t.enabled,
          duration:     t.duration / t.timescale,
          isAPAC:       (t.codec as string).toLowerCase().startsWith('apac'),
          isAmbisonics: layout.isAmbisonics,
          ambOrder:     layout.order,
        });
      }
      resolve(tracks);
    };

    mp4.onError = reject;
    const buf1 = buffer as any;
    buf1.fileStart = 0;
    mp4.appendBuffer(buf1);
    mp4.flush();
  });
}

async function readEmbeddedSpatialMeta(buffer: ArrayBuffer): Promise<SpatialMetaEntry[] | null> {
  return new Promise((resolve) => {
    const mp4 = mp4boxCreateFile();
    let settled = false;
    const settle = (v: SpatialMetaEntry[] | null) => {
      if (!settled) { settled = true; resolve(v); }
    };

    mp4.onReady = (info: any) => {
      // Path 1: info.metadata — works when AVFoundation writes standard ilst items
      for (const m of (info.metadata ?? [])) {
        const key = String(m.name ?? m.key ?? m.full_name ?? '');
        if (key.includes('spatialPosition')) {
          try {
            const parsed = JSON.parse(String(m.value ?? m.data ?? ''));
            if (Array.isArray(parsed)) { settle(parsed); return; }
          } catch {}
        }
      }

      // Path 2: walk the raw box tree — catches free-form ---- atoms,
      // moov.meta items, track-level udta, QuickTime ©xxx atoms, etc.
      try {
        const found = bfsBoxTree(mp4.moov, (box: any) => {
          for (const prop of ['value', 'data', 'content', 'text']) {
            const v = box[prop];
            if (typeof v === 'string' && v.includes('spatialPosition')) {
              try {
                const parsed = JSON.parse(v);
                if (Array.isArray(parsed) && parsed[0]?.spatialPosition != null) return parsed;
              } catch {}
            }
          }
          return null;
        });
        if (found) { settle(found); return; }
      } catch {}

      settle(null);
    };

    mp4.onError = () => settle(null);
    const buf2 = buffer as any;
    buf2.fileStart = 0;
    mp4.appendBuffer(buf2);
    mp4.flush();
  });
}

function bfsBoxTree<T>(root: any, visit: (box: any) => T | null): T | null {
  if (!root) return null;
  const queue: any[] = [root];
  while (queue.length > 0) {
    const box = queue.shift();
    const result = visit(box);
    if (result != null) return result;
    const children: any[] = box?.boxes ?? box?.subBoxes ?? [];
    if (Array.isArray(children)) queue.push(...children);
  }
  return null;
}

async function loadSidecarMeta(mp4Url: string): Promise<SpatialMetaEntry[] | null> {
  const sidecarUrl = mp4Url.replace(/\.mp4$/i, '.spatial.json');
  try {
    const res = await fetch(sidecarUrl);
    if (res.ok) return res.json();
  } catch {
    // sidecar absent
  }
  return null;
}

/**
 * ADTS sample-rate index table.
 * Maps the literal sample rate in Hz to its 4-bit ADTS index value.
 */
const ADTS_SAMPLE_RATE_INDEX: Readonly<Record<number, number>> = {
  96000: 0, 88200: 1, 64000: 2, 48000: 3,
  44100: 4, 32000: 5, 24000: 6, 22050: 7,
  16000: 8, 12000: 9, 11025: 10, 8000: 11, 7350: 12,
};

/**
 * Build a 7-byte ADTS header for one raw AAC frame.
 *
 * ADTS is a simple framing format where each raw AAC frame is prefixed with a
 * fixed header that identifies codec parameters. Browsers can decode a
 * concatenated stream of these frames directly via decodeAudioData.
 *
 * profile:         1 = AAC-LC  (MPEG-4 Audio Object Type - 1)
 * sampleRateIndex: index into the ADTS frequency table
 * channelCount:    1–7
 * rawFrameLength:  byte length of the raw AAC frame (without this header)
 */
function buildADTSHeader(
  profile: number,
  sampleRateIndex: number,
  channelCount: number,
  rawFrameLength: number,
): Uint8Array {
  const frameLen = rawFrameLength + 7;
  const h = new Uint8Array(7);

  h[0] = 0xFF;
  h[1] = 0xF1; // MPEG-4, no CRC

  // profile(2) | sfi(4) | private(1) | ch_hi(1)
  h[2] = ((profile & 0x3) << 6) | ((sampleRateIndex & 0xF) << 2) | ((channelCount >> 2) & 0x1);

  // ch_lo(2) | original(1) | home(1) | copyright_id(1) | copyright_start(1) | frameLen_hi(2)
  h[3] = ((channelCount & 0x3) << 6) | ((frameLen >> 11) & 0x3);

  h[4] = (frameLen >> 3) & 0xFF;

  // frameLen_lo(3) | buffer_fullness_hi(5 of 11 = 0x1F)
  h[5] = ((frameLen & 0x7) << 5) | 0x1F;

  // buffer_fullness_lo(6 of 11 = 0x3F) | num_raw_blocks(2 = 00) → 0xFC
  h[6] = 0xFC;

  return h;
}

/**
 * Use mp4box to extract the raw AAC frames from the stereo fallback track,
 * wrap each frame in an ADTS header, and decode the resulting stream.
 *
 * This is needed because browsers cannot decode APAC mp4 containers directly
 * via AudioContext.decodeAudioData (EncodingError). The APAC container holds
 * two tracks: the 4-channel APAC primary (codec "apac", enabled=false) and a
 * stereo AAC fallback (codec "mp4a.40.2", enabled=true). We target only the
 * AAC track.
 */
function extractAACViaADTS(
  buffer: ArrayBuffer,
  audioContext: AudioContext,
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const mp4 = mp4boxCreateFile();

    let aacTrackId: number | null = null;
    let adtsProfile = 1;       // AAC-LC default
    let adtsSFI = 3;           // 48 kHz default
    let adtsChannels = 2;
    let resolved = false;

    const collectedSamples: any[] = [];

    mp4.onReady = (info: any) => {
      const aacTrack =
        info.tracks.find((t: any) =>
          (t.codec as string)?.toLowerCase().startsWith('mp4a') &&
          (t.audio?.channel_count ?? 0) <= 2
        ) ??
        info.tracks.find((t: any) =>
          (t.codec as string)?.toLowerCase().startsWith('mp4a')
        );

      if (!aacTrack) {
        reject(new Error('[SpatialAudioParser] No AAC track found in container'));
        return;
      }

      aacTrackId = aacTrack.id as number;

      const codecStr: string = (aacTrack.codec as string) ?? 'mp4a.40.2';
      const aot = parseInt(codecStr.split('.')[2] ?? '2', 10);
      adtsProfile = Math.max(0, aot - 1);

      const sr: number = aacTrack.audio?.sample_rate ?? 48000;
      adtsSFI = ADTS_SAMPLE_RATE_INDEX[sr] ?? 3;
      adtsChannels = aacTrack.audio?.channel_count ?? 2;

      mp4.setExtractionOptions(aacTrackId!, null, { nbSamples: Infinity });
      mp4.start();
    };

    mp4.onSamples = async (_id: number, _user: any, samples: any[]) => {
      if (resolved) return;
      collectedSamples.push(...samples);
    };

    mp4.onError = reject;

    const buf = buffer as any;
    buf.fileStart = 0;
    mp4.appendBuffer(buf);
    mp4.flush();

    // mp4box delivers samples synchronously inside flush(); schedule processing
    // after the current microtask queue so all onSamples calls have completed.
    Promise.resolve().then(async () => {
      if (resolved) return;

      if (collectedSamples.length === 0) {
        reject(new Error('[SpatialAudioParser] No AAC samples extracted from container'));
        return;
      }

      let totalBytes = 0;
      for (const s of collectedSamples) totalBytes += 7 + (s.data as ArrayBuffer).byteLength;

      const adts = new Uint8Array(totalBytes);
      let offset = 0;

      for (const s of collectedSamples) {
        const raw = new Uint8Array(s.data as ArrayBuffer);
        const header = buildADTSHeader(adtsProfile, adtsSFI, adtsChannels, raw.byteLength);
        adts.set(header, offset);
        offset += 7;
        adts.set(raw, offset);
        offset += raw.byteLength;
      }

      try {
        resolved = true;
        const audioBuffer = await audioContext.decodeAudioData(adts.buffer);
        resolve(audioBuffer);
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Decode audio from an APAC mp4 buffer.
 *
 * Tries the native AudioContext path first (works for ordinary mp4/AAC).
 * When the browser throws EncodingError (APAC container not supported),
 * falls back to the ADTS extraction path via mp4box.
 */
async function decodeAudioFromMP4(
  buffer: ArrayBuffer,
  audioContext: AudioContext,
): Promise<AudioBuffer> {
  try {
    return await audioContext.decodeAudioData(buffer.slice(0));
  } catch {
    console.info('[SpatialAudioParser] Native decode failed (APAC container). Extracting AAC track via mp4box ADTS path.');
    return extractAACViaADTS(buffer.slice(0), audioContext);
  }
}

// ─── Stereo analysis ──────────────────────────────────────────────────────────
//
// The Swift exporter builds the stereo AAC fallback using the exact formula:
//
//   panL = max(0, 0.5 - Y * 0.5)     panR = max(0, 0.5 + Y * 0.5)
//
// where Y is the FOA Y-channel gain: Y = sin(az) * cos(el)
//
// This is algebraically invertible from the L/R RMS amplitudes:
//
//   ratio = rRMS / lRMS = (1 + Y) / (1 - Y)   →   Y = (ratio - 1) / (ratio + 1)
//
// Per-named-position Y values (exact, computed from kSpatialPositions):
//   side-left   → −1.000   front-left / rear-left  → −0.7071
//   center / above / global → 0.000
//   front-right / rear-right → +0.7071   side-right → +1.000
//
// front-left and rear-left share the same Y; we default to "front" variants.
// above and center share Y = 0; we default to "center".
// Multi-source recordings are detected by high time-domain variance of Y.

/**
 * Exact Y gains for each named position (sin(az)*cos(el) from kSpatialPositions).
 * Ordered from most-left to most-right for closest-match search.
 * Pairs that share a Y value (e.g. front-left / rear-left) prefer the front variant.
 */
const NAMED_POSITION_Y: ReadonlyArray<readonly [string, number]> = [
  ['side-left',   -1.0000],
  ['front-left',  -0.7071],
  ['center',       0.0000],
  ['front-right',  0.7071],
  ['side-right',   1.0000],
];

function recoverYFromRMS(lRMS: number, rRMS: number): number {
  const total = lRMS + rRMS;
  if (total < 1e-8) return 0;
  const ratio = rRMS / Math.max(1e-8, lRMS);
  return (ratio - 1) / (ratio + 1);
}

function closestPositionByY(y: number): string {
  let best = 'center', bestDist = Infinity;
  for (const [name, yRef] of NAMED_POSITION_Y) {
    const dist = Math.abs(y - yRef);
    if (dist < bestDist) { bestDist = dist; best = name; }
  }
  return best;
}

interface StereoAnalysis {
  yGain: number;       // recovered Y FOA gain  [−1 … +1]
  yVariance: number;   // time-domain variance of Y  (high → multi-source)
  stereoWidth: number; // side/(mid+side) energy  [0 = mono, 1 = fully decorrelated]
  hasContent: boolean;
}

/**
 * Recover the FOA Y gain and spatial statistics from the stereo AAC downmix.
 *
 * Divides the buffer into 32 time chunks so that variance of Y across chunks
 * reveals time-varying spatial behaviour (= multiple sources at different positions).
 */
function analyzeStereoPanning(audioBuffer: AudioBuffer): StereoAnalysis {
  if (audioBuffer.numberOfChannels < 2) {
    const mono = audioBuffer.getChannelData(0);
    return {
      yGain: 0, yVariance: 0, stereoWidth: 0,
      hasContent: mono.some(s => Math.abs(s) > 1e-4),
    };
  }

  const left  = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(1);
  const n     = left.length;
  if (n === 0) return { yGain: 0, yVariance: 0, stereoWidth: 0, hasContent: false };

  const NUM_CHUNKS = 32;
  const chunkSize  = Math.max(1, Math.floor(n / NUM_CHUNKS));
  const chunkY: number[] = [];

  let totalLE = 0, totalRE = 0, totalME = 0, totalSE = 0;

  for (let c = 0; c < NUM_CHUNKS; c++) {
    const start = c * chunkSize;
    const end   = Math.min(start + chunkSize, n);
    let lE = 0, rE = 0;

    for (let i = start; i < end; i++) {
      const l = left[i], r = right[i];
      const m = (l + r) * 0.5, s = (l - r) * 0.5;
      lE += l * l; rE += r * r;
      totalME += m * m; totalSE += s * s;
    }

    totalLE += lE; totalRE += rE;

    const frames  = end - start;
    const lRMS_c  = Math.sqrt(lE / frames);
    const rRMS_c  = Math.sqrt(rE / frames);
    if (lRMS_c + rRMS_c > 1e-6) chunkY.push(recoverYFromRMS(lRMS_c, rRMS_c));
  }

  const hasContent = totalLE + totalRE > 1e-8;
  if (!hasContent) return { yGain: 0, yVariance: 0, stereoWidth: 0, hasContent: false };

  const lRMS_all  = Math.sqrt(totalLE / n);
  const rRMS_all  = Math.sqrt(totalRE / n);
  const yGain     = recoverYFromRMS(lRMS_all, rRMS_all);

  const yMean     = chunkY.reduce((a, b) => a + b, 0) / Math.max(1, chunkY.length);
  const yVariance = chunkY.reduce((acc, y) => acc + (y - yMean) ** 2, 0) / Math.max(1, chunkY.length);

  const stereoWidth = totalSE / Math.max(1e-10, totalME + totalSE);

  return { yGain, yVariance, stereoWidth, hasContent };
}

/**
 * Derive spatial metadata from the APAC track info and stereo analysis.
 *
 * Decision tree:
 *  high yVariance  → multiple sources at varying positions → front-left + front-right
 *  wide stereo (width > 0.35) + near-centre Y → two flanking sources
 *  otherwise       → single source at the closest named position by Y gain
 */
function deriveSmartMeta(
  trackInfo: TrackInfo[],
  analysis: StereoAnalysis,
): SpatialMetaEntry[] {
  if (!analysis.hasContent) {
    return [{ trackIndex: 0, spatialPosition: 'center' }];
  }

  const hasAPAC = trackInfo.some(t => t.isAPAC && t.channels === 4);

  const isMultiSource = analysis.yVariance > 0.05;
  const isWideStereo  = analysis.stereoWidth > 0.35 && Math.abs(analysis.yGain) < 0.3;

  if (isMultiSource || (hasAPAC && isWideStereo)) {
    return [
      { trackIndex: 0, spatialPosition: 'front-left'  },
      { trackIndex: 1, spatialPosition: 'front-right' },
    ];
  }

  return [{ trackIndex: 0, spatialPosition: closestPositionByY(analysis.yGain) }];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch and parse an APAC spatial mp4.
 *
 * Priority for spatial metadata:
 *   1. Metadata embedded in the mp4 udta/ilst box tree
 *   2. Sidecar .spatial.json fetched alongside the mp4
 *   3. Derived from APAC track info + stereo mid-side analysis of the AAC downmix
 *
 * Audio decoding falls back to ADTS extraction when the browser cannot decode
 * the APAC container natively (which is the case in all browsers as of March 2026).
 */
export async function parseSpatialFile(
  url: string,
  audioContext: AudioContext,
  explicitSidecarUrl?: string,
): Promise<ParsedSpatialFile> {
  const mp4Buffer = await fetch(url).then(r => r.arrayBuffer());

  const [trackInfo, embeddedMeta, sidecarMeta] = await Promise.all([
    inspectMP4Tracks(mp4Buffer.slice(0)),
    readEmbeddedSpatialMeta(mp4Buffer.slice(0)),
    loadSidecarMeta(explicitSidecarUrl ?? url),
  ]);

  const audioBuffer = await decodeAudioFromMP4(mp4Buffer, audioContext);

  let spatialMeta: SpatialMetaEntry[] | null = embeddedMeta ?? sidecarMeta;

  if (!spatialMeta) {
    const analysis = analyzeStereoPanning(audioBuffer);
    spatialMeta = deriveSmartMeta(trackInfo, analysis);
    console.info(
      '[SpatialAudioParser] No explicit metadata — derived from stereo FOA inversion:',
      spatialMeta.map(e => e.spatialPosition).join(' + '),
      `| Y=${analysis.yGain.toFixed(3)} yVar=${analysis.yVariance.toFixed(3)} width=${analysis.stereoWidth.toFixed(2)}`,
    );
  }

  return { trackInfo, spatialMeta, audioBuffer };
}

function configurePanner(audio: THREE.PositionalAudio): void {
  const p = audio.panner;
  p.panningModel   = 'HRTF';
  p.distanceModel  = 'inverse';
  p.refDistance    = 1.5;
  p.maxDistance    = 100;
  p.rolloffFactor  = 1.0;
  p.coneInnerAngle = 360;
  p.coneOuterAngle = 0;
  p.coneOuterGain  = 0;
}

/**
 * Build Three.js positional audio sources from parsed spatial file data.
 *
 * Each named spatial position in `spatialMeta` becomes a separate
 * PositionalAudio node (or a flat Audio for 'global') so the Web Audio
 * HRTF panner places each source directionally. All sources share the
 * same stereo AudioBuffer (the AAC fallback decode).
 *
 * Returns a SpatialAudioGroup that delegates play/stop/pause to all children.
 */
export function buildSpatialSources(
  listener: THREE.AudioListener,
  audioBuffer: AudioBuffer,
  spatialMeta: SpatialMetaEntry[] | null,
  options: {
    loop?: boolean;
    volume?: number;
    autoPlay?: boolean;
    positionX?: number;
    positionY?: number;
    positionZ?: number;
  } = {},
): SpatialAudioGroup {
  const entries: SpatialMetaEntry[] = spatialMeta ?? [
    { trackIndex: 0, spatialPosition: 'center' },
  ];

  const sources: Array<THREE.PositionalAudio | THREE.Audio> = [];

  for (const entry of entries) {
    const isGlobal = entry.spatialPosition === 'global';

    if (isGlobal) {
      const audio = new THREE.Audio(listener);
      audio.setBuffer(audioBuffer);
      audio.setLoop(options.loop ?? false);
      audio.setVolume((entry.volume ?? options.volume) ?? 1.0);
      sources.push(audio);
    } else {
      const namedPos = NAMED_POSITIONS[entry.spatialPosition] ?? NAMED_POSITIONS['center'];

      const audio = new THREE.PositionalAudio(listener);
      audio.setBuffer(audioBuffer);
      audio.setLoop(options.loop ?? false);
      audio.setVolume((entry.volume ?? options.volume) ?? 1.0);
      audio.position.copy(namedPos);
      configurePanner(audio);

      sources.push(audio);
    }
  }

  const group = new SpatialAudioGroup(sources);
  group.position.set(
    options.positionX ?? 0,
    options.positionY ?? 0,
    options.positionZ ?? 0,
  );
  group.userData.autoPlay = options.autoPlay ? '1' : '0';

  return group;
}
