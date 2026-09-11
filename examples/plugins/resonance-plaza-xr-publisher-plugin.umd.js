/**
 * resonance-plaza — XR Publisher plugin (NETWORK-SYNCED SPATIAL AUDIO)
 *
 * A collaborative music garden in the town square. Eight looping audio LAYERS
 * (stems) are each emitted by a glowing "resonance stone" placed around the
 * plaza per a position SCHEMA — so walking among them re-mixes the track in 3D
 * (the engine's camera-mounted AudioListener pans every layer spatially). Press
 * E on a stone to toggle its layer; the whole town hears the same arrangement,
 * phase-locked, in sync. A central conductor stone opens an in-world dialog for
 * global controls.
 *
 * WHAT IT EXERCISES IN THE CORE (these were the gaps; now added to the engine):
 *   • XRPublisher.getAudioListener()  → the world's single camera AudioListener,
 *     so a plugin can attach THREE.PositionalAudio that pans correctly without
 *     spawning a second listener/AudioContext. (Engine also resumes the context
 *     on first user gesture, so plugin audio isn't blocked by autoplay policy.)
 *   • XRPublisher.broadcast(channel, data) / onMessage(channel, cb) / getClientId()
 *     → a small JSON peer side-channel. Audio BYTES never cross the wire — every
 *     client loads the same stems from their own URLs and we sync only tiny state
 *     (which layers are on + a transport loop-phase). That's what makes "perfect
 *     sync for all players" cheap.
 *
 * HOW SYNC WORKS (efficient + tight):
 *   - All layers are the SAME loop length and PLAY CONTINUOUSLY, started together
 *     in one AudioContext tick → they're sample-locked to each OTHER for free.
 *     Toggling a layer just sets its volume (never stops it), so it stays in phase.
 *   - Across clients: a deterministic LEADER (lowest clientId) broadcasts the loop
 *     PHASE periodically. Followers estimate their clock offset to the leader with
 *     a tiny ping/pong, compute the leader's current phase, and re-seek ONLY when
 *     drift exceeds ~60ms (so no constant glitching). WebAudio clocks are stable,
 *     so one alignment holds. Layer on/off is broadcast on change + re-asserted in
 *     every transport packet (keyframe-style self-heal for late joiners).
 *   - Solo (not networked) just plays locally — getClientId() is null, you're the
 *     leader of one.
 *
 * ASSETS: set `LAYER_URLS` to your eight WAV stems (same loop length / tempo) and
 * tweak the position SCHEMA. With no URLs it SYNTHESIZES eight musical loops so the
 * spatial + sync demo runs out of the box — drop your stems in to replace them.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'resonance-plaza';

  // ── Song / transport ───────────────────────────────────────────────────────
  const BPM = 96, BEATS = 16;                 // synth-fallback tempo (one 16-beat loop)
  let LOOP = (BEATS / BPM) * 60;              // seconds — REPLACED by the real stem length when URLs are given
  let BEAT = LOOP / BEATS;
  const RING = 9;                             // plaza radius the stones sit on
  const ACTIVE_RADIUS = 160;                  // build/play only when this near a town
  const DRIFT_RESEEK = 0.06;                  // re-align if >60ms off the leader

  // Replace these eight with your WAV stems (same length/tempo). null ⇒ synthesize.
  const LAYER_URLS = ["https://testassets.xpp.world/users/antpb/media/1782596875136_setcho_120bpm_track_2.wav", "https://testassets.xpp.world/users/antpb/media/1782596857678_setcho_120bpm_track_1.wav", "https://testassets.xpp.world/users/antpb/media/1782596946731_setcho_120bpm_track_3.wav", null, null, null, null, null];

  // Position SCHEMA — one entry per layer (8 layers): where the stone sits around
  // the plaza centre, its colour, audible radius, default-on, and the synth recipe
  // used when no URL is provided.
  const note = (semi) => 65.41 * Math.pow(2, semi / 12);   // semitones above C2
  const onBeats = (...b) => b;
  const SCHEMA = {
    loopBeats: BEATS, bpm: BPM,
    layers: [
      { name: 'sub bass',  angle: 0,            color: 0x5a4cff, refDistance: 14, on: true,  role: 'tone',  gain: 0.55, decay: 2.2, beats: onBeats(0, 6, 8, 14), scale: [0, 0, 3, 5] },
      { name: 'pulse',     angle: Math.PI/4,    color: 0xff5a3c, refDistance: 10, on: true,  role: 'noise', gain: 0.5,  beats: onBeats(0,2,4,6,8,10,12,14) },
      { name: 'chords',    angle: Math.PI/2,    color: 0x39d98a, refDistance: 16, on: true,  role: 'chord', gain: 0.32, decay: 0.7, beats: onBeats(0, 8), scale: [0, 4, 12] },
      { name: 'arp',       angle: 3*Math.PI/4,  color: 0xffd23c, refDistance: 12, on: false, role: 'tone',  gain: 0.3,  decay: 6,   beats: onBeats(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15), scale: [12, 15, 19, 22, 24] },
      { name: 'hat',       angle: Math.PI,      color: 0xc0c0d0, refDistance: 8,  on: false, role: 'noise', gain: 0.22, beats: onBeats(1,3,5,7,9,11,13,15) },
      { name: 'lead',      angle: 5*Math.PI/4,  color: 0xff7ad9, refDistance: 14, on: false, role: 'tone',  gain: 0.28, decay: 1.2, beats: onBeats(2, 7, 10, 13), scale: [24, 22, 19, 15] },
      { name: 'pad high',  angle: 3*Math.PI/2,  color: 0x7fd4ff, refDistance: 20, on: true,  role: 'chord', gain: 0.22, decay: 0.5, beats: onBeats(0), scale: [12, 19, 24] },
      { name: 'shimmer',   angle: 7*Math.PI/4,  color: 0xffffff, refDistance: 18, on: false, role: 'tone',  gain: 0.18, decay: 5,   beats: onBeats(4, 12), scale: [31, 36] },
    ],
  };

  const waitForRuntime = () => new Promise((resolve) => {
    const ok = () => window.XRPublisher && window.THREE && typeof window.XRPublisher.getAudioListener === 'function';
    if (ok()) { resolve(); return; }
    let n = 0; const iv = setInterval(() => { if (ok() || n++ > 200) { clearInterval(iv); resolve(); } }, 50);
  });

  // ── synth fallback: render a seamless looping AudioBuffer for a layer ─────────
  function synthBuffer(ctx, layer) {
    const sr = ctx.sampleRate, len = Math.floor(LOOP * sr), d = new Float32Array(len);
    const buf = ctx.createBuffer(1, len, sr);
    const tone = (tStart, freq, amp, decay) => {
      const s0 = Math.floor(tStart * sr), n = Math.floor(Math.min(LOOP, 1.5) * sr);
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const env = Math.min(1, t / 0.008) * Math.exp(-t * decay);
        const v = amp * env * (Math.sin(2 * Math.PI * freq * t) + 0.28 * Math.sin(4 * Math.PI * freq * t) + 0.12 * Math.sin(6 * Math.PI * freq * t));
        d[(s0 + i) % len] += v;
      }
    };
    const noise = (tStart, amp) => {
      const s0 = Math.floor(tStart * sr), n = Math.floor(0.18 * sr);
      for (let i = 0; i < n; i++) { const t = i / sr; d[(s0 + i) % len] += amp * Math.exp(-t * 34) * (Math.random() * 2 - 1); }
    };
    layer.beats.forEach((b, i) => {
      const t = b * BEAT;
      if (layer.role === 'noise') noise(t, layer.gain);
      else if (layer.role === 'chord') layer.scale.forEach((s) => tone(t, note(s), layer.gain, layer.decay));
      else tone(t, note(layer.scale[i % layer.scale.length]), layer.gain, layer.decay);
    });
    buf.getChannelData(0).set(d);
    return buf;
  }

  function loadWav(ctx, url) {
    return fetch(url).then((r) => r.arrayBuffer()).then((a) => ctx.decodeAudioData(a));
  }

  const init = async () => {
    await waitForRuntime();
    const { XRPublisher, THREE } = window;

    // wait for the shared camera AudioListener (engine creates it once the player mounts)
    let listener = null;
    for (let i = 0; i < 200 && !listener; i++) { listener = XRPublisher.getAudioListener(); if (!listener) await new Promise((r) => setTimeout(r, 50)); }
    if (!listener) { console.error(`[${PLUGIN_ID}] no AudioListener (player camera not ready)`); return; }
    const ctx = listener.context;

    // ── resolve the ACTIVE layers ────────────────────────────────────────────
    // Use only the schema entries that have a real stem URL; spread them evenly
    // around the ring no matter how many (3, 5, 8…). If NO urls are given at all,
    // fall back to the full 8-layer synth demo so it still runs out of the box.
    const provided = SCHEMA.layers.map((l, i) => ({ ...l, url: LAYER_URLS[i] || null })).filter((l) => l.url);
    const useReal = provided.length > 0;
    const src = useReal ? provided : SCHEMA.layers.map((l) => ({ ...l, url: null }));
    const LAYERS = src.map((l, i) => ({ ...l, angle: (i / src.length) * Math.PI * 2, on: useReal ? true : l.on }));
    const N = LAYERS.length;

    // ── build the plaza group (stones + positional audio), parented to the scene ──
    const group = new THREE.Group();
    group.name = '__resonance-plaza';
    const sounds = [], stones = [];
    const layerOn = LAYERS.map((l) => l.on);

    const stoneGeo = new THREE.CylinderGeometry(0.5, 0.7, 2.4, 7);
    const orbGeo = new THREE.IcosahedronGeometry(0.45, 1);
    LAYERS.forEach((layer, i) => {
      const s = new THREE.Group();
      s.position.set(Math.cos(layer.angle) * RING, 0, Math.sin(layer.angle) * RING);
      const mat = new THREE.MeshStandardMaterial({ color: layer.color, emissive: layer.color, emissiveIntensity: 0.2, roughness: 0.5 });
      const pillar = new THREE.Mesh(stoneGeo, mat); pillar.position.y = 1.2; pillar.castShadow = true; s.add(pillar);
      const orb = new THREE.Mesh(orbGeo, mat.clone()); orb.position.y = 2.9; s.add(orb);
      s.userData = { mat, orbMat: orb.material, orb };
      group.add(s); stones.push(s);
    });

    // audio-reactive 3D SPECTRUM ring at the centre — bars bounce to the master mix
    // (fed by the engine's master AnalyserNode, XRPublisher.getAudioAnalyser).
    const BARS = 28, BAR_R = 3.4;
    const bars = [];
    const barGeo = new THREE.BoxGeometry(0.5, 1, 0.5);
    for (let i = 0; i < BARS; i++) {
      const a = (i / BARS) * Math.PI * 2;
      const hue = i / BARS;
      const col = new THREE.Color().setHSL(0.55 + hue * 0.35, 0.8, 0.55);
      const m = new THREE.Mesh(barGeo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.3, roughness: 0.4 }));
      m.position.set(Math.cos(a) * BAR_R, 0.5, Math.sin(a) * BAR_R);
      m.scale.y = 0.2; m.castShadow = true;
      group.add(m); bars.push(m);
    }

    // central conductor stone
    const conductor = new THREE.Group();
    const condMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffcf6a, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.2 });
    const condMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), condMat); condMesh.position.y = 1.6; conductor.add(condMesh);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x6b6358, roughness: 1 }));
    base.position.y = 0.3; conductor.add(base);
    group.add(conductor);

    // load real stems in parallel; derive the transport LOOP from their actual
    // length (so phase-sync + looping line up with whatever tempo the WAVs are),
    // then synth-fill any that are missing/failed AT that same length.
    const buffers = new Array(N);
    await Promise.all(LAYERS.map(async (layer, i) => {
      if (!layer.url) return;
      try { buffers[i] = await loadWav(ctx, layer.url); }
      catch (e) { console.warn(`[${PLUGIN_ID}] layer ${layer.name} url failed → synth`, e); buffers[i] = null; }
    }));
    if (useReal) { const first = buffers.find(Boolean); if (first) { LOOP = first.duration; BEAT = LOOP / BEATS; } }
    for (let i = 0; i < N; i++) if (!buffers[i]) buffers[i] = synthBuffer(ctx, LAYERS[i]);

    // wire positional audio onto each stone
    let buffersReady = 0;
    LAYERS.forEach((layer, i) => {
      const snd = new THREE.PositionalAudio(listener);
      snd.setBuffer(buffers[i]); snd.setLoop(true); snd.setRefDistance(layer.refDistance); snd.setRolloffFactor(1.4);
      snd.setVolume(0);                       // volume = on/off; everything always plays in sync
      stones[i].add(snd); sounds[i] = snd; buffersReady++;
    });

    // per-layer analyser → each stone reacts to its OWN layer's real signal (post
    // volume, so a muted/off layer reads ~0 and its stone goes dark — true reactivity,
    // not a computed beat grid). Master analyser drives the spectrum ring + conductor.
    const layerAna = sounds.map((s) => new THREE.AudioAnalyser(s, 32));
    let master = null, freq = null;

    // ── transport: one phase model, all layers seek together ─────────────────────
    let started = false, startCtxTime = 0;
    const nowPhase = () => started ? ((ctx.currentTime - startCtxTime) % LOOP + LOOP) % LOOP : 0;
    function seekTo(phase) {
      phase = ((phase % LOOP) + LOOP) % LOOP;
      startCtxTime = ctx.currentTime - phase;
      for (const s of sounds) { if (s.isPlaying) s.stop(); s.offset = phase; s.play(); }
      started = true;
    }
    function applyVolumes() {
      LAYERS.forEach((l, i) => sounds[i] && sounds[i].setVolume(layerOn[i] ? l.gain : 0));
    }

    // ── networking: leader election + clock offset + transport sync ──────────────
    const myId = () => XRPublisher.getClientId() || '~self';
    const peers = new Map();                  // id -> lastSeen ms
    let leaderOffset = 0, offsetSamples = [];
    const isLeader = () => {
      const me = myId(); let min = me;
      const t = performance.now();
      for (const [id, seen] of peers) if (t - seen < 8000 && id < min) min = id;
      return min === me;
    };
    const leaderId = () => {
      const me = myId(); let min = me; const t = performance.now();
      for (const [id, seen] of peers) if (t - seen < 8000 && id < min) min = id;
      return min;
    };

    XRPublisher.onMessage('resonance', (peerId, m) => {
      if (!m || peerId === myId()) return;
      if (peerId) peers.set(peerId, performance.now());
      if (m.t === 'hb') return;               // presence only
      if (m.t === 'toggle') { if (m.i >= 0 && m.i < layerOn.length) { layerOn[m.i] = !!m.on; applyVolumes(); } return; }
      if (m.t === 'ping') {                    // a follower probing us; answer if we're its leader target
        if (m.to === myId()) XRPublisher.broadcast('resonance', { t: 'pong', to: peerId, t0: m.t0, t1: performance.now() });
        return;
      }
      if (m.t === 'pong' && m.to === myId()) {
        const t2 = performance.now(), rtt = t2 - m.t0;
        const off = (m.t1 + rtt / 2) - t2;     // leaderPerf - localPerf
        offsetSamples.push(off); if (offsetSamples.length > 7) offsetSamples.shift();
        const sorted = offsetSamples.slice().sort((a, b) => a - b);
        leaderOffset = sorted[sorted.length >> 1];   // median
        return;
      }
      if (m.t === 'transport') {                // leader's authoritative state + phase
        if (Array.isArray(m.on)) { for (let i = 0; i < layerOn.length; i++) layerOn[i] = !!m.on[i]; applyVolumes(); }
        if (!started) return;
        // leader sampled phase m.phase at leader-perf m.atPerf → convert to local
        const localPerfWhen = m.atPerf - leaderOffset;
        const target = m.phase + (performance.now() - localPerfWhen) / 1000;
        const cur = nowPhase();
        let drift = ((target - cur) % LOOP + LOOP) % LOOP; if (drift > LOOP / 2) drift -= LOOP;
        if (Math.abs(drift) > DRIFT_RESEEK) seekTo(target);
      }
    });

    function toggleLayer(i) {
      layerOn[i] = !layerOn[i]; applyVolumes();
      XRPublisher.broadcast('resonance', { t: 'toggle', i, on: layerOn[i] });
    }

    // periodic network tasks
    setInterval(() => {
      XRPublisher.broadcast('resonance', { t: 'hb', id: myId() });   // presence
      if (isLeader()) {
        XRPublisher.broadcast('resonance', { t: 'transport', phase: nowPhase(), atPerf: performance.now(), on: layerOn });
      } else {
        XRPublisher.broadcast('resonance', { t: 'ping', to: leaderId(), t0: performance.now() });   // clock probe
      }
      // prune stale peers
      const t = performance.now(); for (const [id, seen] of peers) if (t - seen > 10000) peers.delete(id);
    }, 2500);

    // ── interactables: E on a stone toggles its layer; conductor opens a dialog ───
    stones.forEach((s, i) => XRPublisher.registerInteractable({
      id: `${PLUGIN_ID}-${i}`, object: s, radius: 4.5,
      prompt: `toggle ${LAYERS[i].name}`,
      onInteract: () => toggleLayer(i),
    }));
    XRPublisher.registerInteractable({
      id: `${PLUGIN_ID}-conductor`, object: conductor, radius: 5, prompt: 'conduct',
      onInteract: () => XRPublisher.openDialog({
        title: 'Resonance Plaza',
        content: `${N} layer${N === 1 ? '' : 's'}, one loop, shared by everyone here. Toggle the whole arrangement, or walk the ring to mix it in space.`,
        buttons: [
          { label: 'All layers on', variant: 'primary', onSelect: () => { layerOn.fill(true); applyVolumes(); LAYERS.forEach((_, i) => XRPublisher.broadcast('resonance', { t: 'toggle', i, on: true })); } },
          { label: 'Solo the first layer', onSelect: () => { layerOn.forEach((_, i) => { layerOn[i] = i === 0; }); applyVolumes(); LAYERS.forEach((_, i) => XRPublisher.broadcast('resonance', { t: 'toggle', i, on: layerOn[i] })); } },
          { label: 'Restart the loop', onSelect: () => { seekTo(0); } },
          { label: 'Close' },
        ],
      }),
    });

    // ── placement: sit the plaza on the nearest town (frame-corrected like the
    // cobblestone), and only mount/play while the player is near it ──────────────
    const tEl = document.querySelector('three-terrain-block');
    const HALF_W = ((tEl && parseFloat(tEl.getAttribute('width'))) || 100) / 2;
    const HALF_H = ((tEl && parseFloat(tEl.getAttribute('height'))) || 100) / 2;
    let mounted = false, placedKey = null;
    // The scene ROOT, resolved fresh every use — it SWAPS on a WebGPU⟷WebGL
    // remount, so never cache it. getScene() is the public API every other
    // plugin uses; window.currentScene is the legacy fallback for runtimes
    // that predate it.
    const sceneRoot = () =>
      (typeof XRPublisher.getScene === 'function' && XRPublisher.getScene()) || window.currentScene || null;
    const playerXZ = () => {
      const root = sceneRoot();
      const po = root && root.getObjectByName('playerOne');
      if (!po) return null; const p = po.getWorldPosition(new THREE.Vector3()); return [p.x, p.y, p.z];
    };
    async function placeTick() {
      const p = playerXZ(); if (!p || typeof XRPublisher.getWorldTowns !== 'function') return;
      let towns = []; try { towns = await XRPublisher.getWorldTowns({ minX: p[0] - 2000, minZ: p[2] - 2000, maxX: p[0] + 2000, maxZ: p[2] + 2000 }); } catch (e) { return; }
      let best = null, bestD = Infinity;
      for (const t of towns) { const cx = t.x - HALF_W, cz = t.z - HALF_H; const d = (cx - p[0]) ** 2 + (cz - p[2]) ** 2; if (d < bestD) { bestD = d; best = [cx, cz]; } }
      if (!best || bestD > ACTIVE_RADIUS * ACTIVE_RADIUS) {
        const root = sceneRoot();
        if (mounted && root) { root.remove(group); mounted = false; }
        return;
      }
      const key = `${Math.round(best[0])}_${Math.round(best[1])}`;
      let gy = (typeof XRPublisher.getGroundHeight === 'function') ? XRPublisher.getGroundHeight(best[0], best[1]) : null;
      if (gy == null) gy = p[1] - 0.8;
      group.position.set(best[0], gy, best[1]);
      if (key !== placedKey) { placedKey = key; }
      const root = sceneRoot();
      if (!mounted && root) { root.add(group); mounted = true; }
    }
    placeTick(); setInterval(placeTick, 3000);

    // ── render loop: unlock + first start, drift handled in net tick, visual pulse ─
    function frame() {
      requestAnimationFrame(frame);
      if (!mounted) return;
      if (!started && ctx.state === 'running' && buffersReady === N) { seekTo(0); applyVolumes(); }
      // re-add if the scene root swapped (WebGPU⟷WebGL remount)
      const root = sceneRoot();
      if (mounted && root && group.parent !== root) root.add(group);

      // grab the engine master analyser once audio is up (drives the spectrum ring)
      if (!master) { master = XRPublisher.getAudioAnalyser(256); if (master) freq = new Uint8Array(master.frequencyBinCount); }

      const ph = nowPhase();
      // each stone reacts to its OWN layer's live level (0..1)
      for (let i = 0; i < stones.length; i++) {
        const lv = layerAna[i] ? layerAna[i].getAverageFrequency() / 160 : 0;   // ~0..1+
        const u = stones[i].userData, glow = layerOn[i] ? 0.25 + lv * 2.2 : 0.04;
        u.mat.emissiveIntensity = glow; u.orbMat.emissiveIntensity = glow;
        const s = 1 + (layerOn[i] ? lv * 0.5 : 0); u.orb.scale.setScalar(s);
        u.orb.position.y = 2.9 + (layerOn[i] ? lv * 0.5 : 0);
        u.orb.rotation.y += 0.02 + lv * 0.08;
      }
      // spectrum ring → real FFT bins of the whole mix
      if (master && freq) {
        master.getByteFrequencyData(freq);
        const span = Math.floor(freq.length * 0.7);   // skip the empty top bins
        for (let i = 0; i < bars.length; i++) {
          const v = freq[Math.floor((i / bars.length) * span)] / 255;
          const b = bars[i];
          b.scale.y = 0.2 + v * v * 9;
          b.position.y = b.scale.y / 2;
          b.material.emissiveIntensity = 0.2 + v * 1.8;
        }
      }
      // conductor pulses to overall energy
      const L = XRPublisher.getAudioLevels();
      condMat.emissiveIntensity = 0.3 + L.level * 2.0;
      condMesh.rotation.y += 0.008 + L.treble * 0.05;
      condMesh.scale.setScalar(1 + L.bass * 0.35);
    }
    requestAnimationFrame(frame);

    // "Go to Resonance Plaza" in the ☰ menu
    if (typeof XRPublisher.registerMenuItem === 'function') {
      XRPublisher.registerMenuItem({
        id: 'goto-resonance', label: 'Go to Resonance Plaza', icon: '🎵', order: 60,
        onSelect: () => { if (placedKey) { const [x, z] = placedKey.split('_').map(Number); XRPublisher.teleportPlayer(x, undefined, z); } },
      });
    }

    console.log(`[${PLUGIN_ID}] ready — 8 synced spatial layers (${LAYER_URLS.some(Boolean) ? 'WAV stems' : 'synth fallback'}), loop ${LOOP.toFixed(1)}s`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init, 400);
  else window.addEventListener('DOMContentLoaded', () => setTimeout(init, 400));
})();
}
