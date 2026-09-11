import { float, uniform } from 'three/tsl';

/**
 * Shared AUDIO-REACTIVE uniforms for world-surface materials — the same one-uniform,
 * one-updater pattern as terrainDarkness.ts. A single AnalyserNode taps the master
 * mix (listener input), and `updateTerrainAudio()` (driven once per frame from
 * InfiniteTerrain) writes a smoothed bass + overall level into a TSL uniform (WebGPU)
 * and a plain `{ value }` mirror (WebGL ShaderMaterials) so terrain/grass can pulse
 * with the music with zero per-component wiring.
 *
 * Because the tap is POST distance-attenuation, the level naturally falls off with
 * distance from the emitters — so the ground only "breathes" where the audio is
 * actually audible. No spatial bookkeeping needed.
 */

// WebGPU (TSL) + WebGL ({value}) — shared by reference across all materials.
const _bassNode = uniform(0);
const _levelNode = uniform(0);
const _bassValue = { value: 0 };
const _levelValue = { value: 0 };

let _analyser: AnalyserNode | null = null;
let _freq: Uint8Array | null = null;
let _smBass = 0, _smLevel = 0;

function ensureAnalyser(): AnalyserNode | null {
  if (_analyser) return _analyser;
  if (typeof window === 'undefined') return null;
  const w = window as any;
  const listener = w.__xrAudioListener;
  if (!listener || typeof listener.getInput !== 'function') return null;
  // Reuse the master analyser if XRPublisher.getAudioAnalyser already made one.
  if (w.__xrAudioAnalyser) {
    _analyser = w.__xrAudioAnalyser;
  } else {
    const ctx = listener.context as AudioContext;
    const a = ctx.createAnalyser();
    a.fftSize = 256;
    a.smoothingTimeConstant = 0.8;
    listener.getInput().connect(a); // tap (fan-out) — analysis only
    w.__xrAudioAnalyser = a;
    _analyser = a;
  }
  _freq = new Uint8Array(_analyser!.frequencyBinCount);
  return _analyser;
}

/** Per-frame: read the master mix, update the shared uniforms (fast attack / slow release). */
export function updateTerrainAudio(): void {
  const a = ensureAnalyser();
  if (!a || !_freq) return;
  a.getByteFrequencyData(_freq as any);
  const n = _freq.length;
  const bi = Math.max(1, Math.floor(n * 0.08));
  let bass = 0; for (let i = 0; i < bi; i++) bass += _freq[i]; bass /= bi * 255;
  let all = 0; for (let i = 0; i < n; i++) all += _freq[i]; all /= n * 255;
  _smBass += (bass - _smBass) * (bass > _smBass ? 0.5 : 0.08);
  _smLevel += (all - _smLevel) * (all > _smLevel ? 0.4 : 0.06);
  _bassNode.value = _smBass; _levelNode.value = _smLevel;
  _bassValue.value = _smBass; _levelValue.value = _smLevel;
}

/** TSL brightness multiplier `1 + bass*amount` for terrain/grass (subtle ground breathing). */
export function createAudioPulseNode(amount = 0.35) {
  return float(1).add(_bassNode.mul(float(amount)));
}

export function getAudioBassNode() { return _bassNode; }
export function getAudioLevelNode() { return _levelNode; }
/** WebGL twins: `uAudioBass: getAudioBassUniform()` then `color *= 1.0 + uAudioBass*amount`. */
export function getAudioBassUniform(): { value: number } { return _bassValue; }
export function getAudioLevelUniform(): { value: number } { return _levelValue; }
