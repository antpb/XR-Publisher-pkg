/**
 * resonance-stage — XR Publisher plugin (AUDIO-REACTIVE CONCERT, network-synced)
 *
 * This is an EXAMPLE of the plugin framework: it builds an entire concert from
 * the public API — no engine changes. It shows plugin authors everything they
 * need to TEXTURE, MATERIAL and ANIMATE an experience:
 *
 *   • CUSTOM TSL MATERIALS  — `XRPublisher.tsl` (three/tsl nodes) + new
 *     `XRPublisher.webgpu` (node-material classes) let you author your own
 *     shaders with the engine's three instance. Here the floor + equalizer ring
 *     are MeshStandardNodeMaterials whose emissive is a TSL graph driven by
 *     audio UNIFORMS we update each frame. (WebGL can't run TSL → we fall back
 *     to stock emissive materials; gate on `?renderer=webgl` / `!XR.webgpu`.)
 *   • BLOOM  — `XRPublisher.setPostProcessing({ bloom })` / `clearPostProcessing()`
 *     is the one thing a plugin can't do itself (the engine owns the draw call).
 *     Any bright emissive material then glows. WebGPU only; no-op on WebGL.
 *   • SHARED TIME — world time is ONE linear timeline per room. The "Night show"
 *     menu action calls `XRPublisher.setTimeOfDay(hour, false)` — the engine
 *     broadcasts it so EVERYONE's sky jumps together and keeps running (the first
 *     participant in the room is the time authority that anchors the timeline;
 *     see `XRPublisher.isTimeAuthority()`). Never flip time locally on proximity:
 *     that made a per-client "night bubble" — black ground near the stage, noon
 *     everywhere else, and every peer seeing something different.
 *   • AVATAR AURA — every avatar standing ON the stage gets a sparkle formation
 *     (rising helix / golden-angle SEED SPIRAL mirroring the sculpture's
 *     seed-dome state / 5-petal ROSE RING from its rose-torus state) that
 *     slowly cycles per avatar. Sparkles have DRAG — they chase the formation
 *     with per-sparkle lag, so walking pulls a comet trail behind you and
 *     pattern changes morph. Local player via `getPlayerState()`, remote
 *     players via the new `XRPublisher.getPeers()`.
 *   • SPATIAL AUDIO — stems are placed as POSITIONED emitters around the stage
 *     (THREE.PositionalAudio), so walking re-mixes them in 3D.
 *   • SYNC + CONSOLE — the song initialises PAUSED at 0:00; a wide control desk
 *     at the stage centre carries a START pad, a STOP pad (rewinds to 0:00) and
 *     one mix toggle per AVAILABLE track (no URL → no pad; up to 8). Pads use
 *     the engine's "E to interact" channel (`XRPublisher.registerInteractable`,
 *     same as the apple-trees example — works with the mobile interact button).
 *     Transport + mute mask are room-synced over broadcast/onMessage with a
 *     leader-elected shared epoch; stems start on ONE AudioContext tick with
 *     loop=true, so they stay sample-locked through every loop ("true loop"),
 *     and alignAudio heals the rare cross-client wall-clock drift. PERMISSION
 *     SCAFFOLD: first participant = admin, then fall back to public control
 *     (see canControl()). HAZE via addCloudRegion. HUD + menu.
 *   • PERFORMANCE — every particle system writes its instance matrices directly
 *     into `instanceMatrix.array` (see writeScaleMatrix/writeYawScaleMatrix) —
 *     no per-particle Object3D.updateMatrix() — and the whole visual update runs
 *     through a distance-LOD cadence (60Hz on stage → 20Hz at the zone edge).
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'resonance-stage';

  // ── Configure me ────────────────────────────────────────────────────────
  const LAYER_URLS = [
    'https://testassets.xpp.world/users/antpb/media/1782596875136_setcho_120bpm_track_2.wav',
    'https://testassets.xpp.world/users/antpb/media/1782596857678_setcho_120bpm_track_1.wav',
    'https://testassets.xpp.world/users/antpb/media/1782596946731_setcho_120bpm_track_3.wav',
    null, null, null, null, null,
  ];
  const TITLE = 'Resonance Stage';
  const ARTIST = 'setcho';
  // ══ BRAND THEME ══ every colour in the show comes from here — retint the whole
  // experience by editing these. `primary/secondary/accent` drive the static
  // materials (beams, particles, ring, sculpture, halos); the named tones colour
  // specific props; `driftCenter/driftSpread` set the LIVE mood hue that slowly
  // evolves over minutes across the fans/screen/walls (0..1 hue, cyan≈0.5 blue≈0.62
  // violet≈0.74 pink≈0.87). Keep pure white OUT of primary/secondary/accent so the
  // strobe stays the only white. To make the live mood follow `primary`, set
  // `driftCenter: null` (it will anchor on the primary hue).

  // ── THEME VARIANT 1 — MAGENTA RAVE (default) ──────────────────────────────
  // Hot pink hero, cyan counterpoint, indigo backdrop. Classic festival rave.
  // const THEME = {
  //   primary:   '#ff2bd6',
  //   secondary: '#19e0ff',
  //   accent:    '#7af0ff',
  //   violet:    '#8a2be2',
  //   fire:      '#ff7a2e',
  //   fog:       '#c2ccdb',
  //   structure: '#0c0c14',
  //   hardware:  '#070709',
  //   driftCenter: 0.62,
  //   driftSpread: 0.12,
  // };

  // ── THEME VARIANT 2 — TOXIC GREEN ─────────────────────────────────────────
  // Acid green beams, electric yellow halos, dark-lime sculpture. Industrial rave.
  const THEME = {
    primary:   '#39ff14',
    secondary: '#d4ff00',
    accent:    '#a8ff3e',
    violet:    '#1a6b00',
    fire:      '#ff7a2e',
    fog:       '#b8ccb0',
    structure: '#090e06',
    hardware:  '#06080a',
    driftCenter: 0.33,
    driftSpread: 0.08,
  };

  // ── THEME VARIANT 3 — DEEP OCEAN ──────────────────────────────────────────
  // Bioluminescent teal hero, ice-blue halos, sapphire backdrop. Undersea rave.
  // const THEME = {
  //   primary:   '#00e5cc',
  //   secondary: '#007fff',
  //   accent:    '#80f5ff',
  //   violet:    '#0033aa',
  //   fire:      '#ff7a2e',
  //   fog:       '#b0c8d8',
  //   structure: '#040c12',
  //   hardware:  '#030608',
  //   driftCenter: 0.52,
  //   driftSpread: 0.10,
  // };

  // ── THEME VARIANT 4 — SUNSET SYNTHWAVE ────────────────────────────────────
  // Neon coral hero, amber halos, deep magenta backdrop. 80s retro warmth.
  // const THEME = {
  //   primary:   '#ff4d6a',
  //   secondary: '#ffb830',
  //   accent:    '#ffda80',
  //   violet:    '#7b1fa2',
  //   fire:      '#ff7a2e',
  //   fog:       '#d4c0b8',
  //   structure: '#120608',
  //   hardware:  '#0a0405',
  //   driftCenter: 0.87,
  //   driftSpread: 0.10,
  // };

  // ── THEME VARIANT 5 — ARCTIC AURORA ───────────────────────────────────────
  // Icy lavender hero, mint green accent, deep violet backdrop. Cold northern lights.
  // const THEME = {
  //   primary:   '#c87dff',
  //   secondary: '#4dffb0',
  //   accent:    '#b8fff0',
  //   violet:    '#2d0080',
  //   fire:      '#ff7a2e',
  //   fog:       '#ccd4e8',
  //   structure: '#08060f',
  //   hardware:  '#05040a',
  //   driftCenter: 0.74,
  //   driftSpread: 0.14,
  // };

  // const THEME = {
  //   primary:   '#ff2bd6',  // hero — beams, particles, ring lead, sculpture tint
  //   secondary: '#19e0ff',  // accent — screen shifts, beam halos
  //   accent:    '#7af0ff',  // soft glow — projector lenses, highlights
  //   violet:    '#8a2be2',  // backdrop 3rd tower tone
  //   fire:      '#ff7a2e',  // pyro flame tint
  //   fog:       '#c2ccdb',  // fog-machine haze tint (near-neutral)
  //   structure: '#0c0c14',  // stage riser / structural metal
  //   hardware:  '#070709',  // projector & mortar enclosure bodies
  //   driftCenter: 0.62,     // live-mood hue centre (null → follow `primary`)
  //   driftSpread: 0.12,     // how far the live hue wanders each way
  // };
  const PALETTE = [THEME.primary, THEME.secondary, THEME.accent]; // primary, secondary, soft-accent
  const PLACE = null;             // null → town centre (the music venue). Or {x,z}.
  const RADIUS = 260;             // activation radius (the whole experience zone)
  const STAGE_RADIUS = 12;        // stage circle radius (24m diameter)
  const STAGE_HEIGHT = 0.4;       // low riser you can step onto
  const STAGE_SINK = 4;           // buried skirt so the base never hovers over rolling terrain
  const VOLUME = 0.9;
  // The additive light beams/lasers must draw AFTER the procedural cloud deck so
  // they glow OVER the clouds. Clouds and beams both use depthWrite:false, so the
  // depth buffer can't order them — only renderOrder does. The engine's cloud
  // planes sit at renderOrder 100-103 (ProceduralSky[WebGL].tsx); anything below
  // that gets painted over by a far-away cloud even though the beam is right next
  // to the stage. Sit safely above them. (Buildings/avatar still occlude via the
  // opacity mask — occlusionMaskNode() — which is independent of renderOrder.)
  const BEAM_RENDER_ORDER = 110;
  // Night is a SHARED, EXPLICIT choice now (the "Night show" menu action), not a
  // proximity side-effect — see the SHARED TIME note in the header. The hour the
  // action jumps the room to (cycle keeps running → dawn arrives naturally):
  const NIGHT_SHOW_HOUR = 21.5;
  const DAY_RESTORE_HOUR = 10;   // the toggle's "bring back daylight" hour
  // HAZE stamped its OWN grey cloud region over the stage — a hard circular
  // patch in the deck that read as a "circle cut through the clouds" against the
  // (correct, global) night sky. Disabled: the concert relies on the engine's
  // global night for mood and no longer paints a local cloud circle. (activate()
  // guards on HAZE > 0, so 0 skips addCloudRegion entirely.)
  const HAZE = 0;
  const INTENSITY = 0.9;
  // ────────────────────────────────────────────────────────────────────────

  // Touch device? (iPadOS Safari spoofs a desktop UA, so check maxTouchPoints too.)
  // Drives mobile pool scaling + the occlusion/bloom gating below.
  const IS_TOUCH = typeof navigator !== 'undefined' && (
    (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
    || /Mobi|Android|iPhone|iPad|iPod|Tablet|Silk/i.test(navigator.userAgent || '')
  );
  // Instance/particle pools — scaled DOWN on mobile so each frame's instanced
  // buffer uploads are smaller (cooler thermals on weaker touch GPUs).
  const BAR_COUNT = IS_TOUCH ? 44 : 64;
  const FAN_BEAMS = IS_TOUCH ? 7 : 9; // beams per side fan
  const FAN_SPREAD = 0.55;            // fan spread (radians)
  const PARTICLE_POOL = IS_TOUCH ? 200 : 420; // a rich, always-present ember field
  // Fog machines: jets of haze fired from the FRONT lip (audience/−X side) inward
  // toward the back screen (+X), on an interval. The beams catch the haze.
  const FOG_POOL = IS_TOUCH ? 80 : 150; // soft puff pool (shared across machines)
  const FOG_MACHINES = 3;     // emitters along the front lip
  const FOG_INTERVAL = 9;     // seconds between bursts
  const FOG_BURST_SEC = 2.6;  // how long each burst jets
  const FOG_BRIGHT = 0.5;     // additive haze is subtle, not a spotlight
  // Pyro: a row of fire gerbs across the front (FIRE_EMITTERS below). They
  // RECHARGE on staggered intervals and
  // only fire when their assigned stem (track 1 / track 2) hits — so they're
  // sporadic and reactive, like real event pyro between cooldowns (not constant).
  const FIRE_POOL = IS_TOUCH ? 440 : 820; // fire-particle pool (shared) — sized for 8 emitters
  const FIRE_EMITTERS = 8;    // doubled — fills the stage front with more gerbs
  const FIRE_BRIGHT = 1.7;    // hot → blooms
  const FIRE_RECHARGE = [5.5, 7.5, 6.5, 8.5]; // base recharge per emitter (staggered, +random)
  const FIRE_THRESH = 0.16;   // stem level needed to trigger (per-stem avg levels run low)
  // Backdrop: tall neon towers wrapping behind/around the screen (taller than it).
  const BACKDROP_COUNT = IS_TOUCH ? 9 : 13;
  // EQ particles above the screen, 3 bands (track1 LOW, track2 HIGH, track3 HIGH).
  const SCREEN_PART_POOL = IS_TOUCH ? 110 : 180;
  // Floating particle SCULPTURE above the stage — morphing point-cloud forms whose
  // surface ripples to the spectrum (lighter on mobile — it's the heaviest piece).
  const SCULPT_COUNT = IS_TOUCH ? 1100 : 2400; // instanced icospheres (heavier than points → fewer, bigger)
  const SCULPT_RADIUS = 9;                      // sculpture extent (world units) — wide centerpiece
  const SCULPT_PSIZE = 0.02;                     // per-particle SCALE (world units) — real size, no GL-point cap
  const SCULPT_GENS = 5;                         // original forms it morphs between (see fillSculptShape)
  const SCULPT_MAXSCALE = 5.1;                    // hard cap on the breathing push (radial growth ≈ 1+this at most)
  const SCULPT_HALFLIFE = 1.25;                   // sec — CENTRE of the per-group recovery-half-life spread (see SCULPT_VAR_GROUPS)
  const SCULPT_RIPPLE = 8;                      // per-particle max radial push — the min→max TRAVEL range (rest 0 → peak this)
  const SCULPT_ATTACK = 0.13;                     // sec — CENTRE of the per-group attack spread (rendered values chase targets at group rates)
  // BREATHING VARIANCE: every particle belongs to one of N envelope groups, each
  // with its own attack + recovery half-life drawn around the centres above — so
  // the audio push staggers across the form (fast groups lead, slow groups
  // linger) instead of the whole sculpture snapping in/out as one rigid unit.
  const SCULPT_VAR_GROUPS = 24;
  const SCULPT_TRIG = 0.70;                       // EQ band threshold that FIRES a trigger (below this = no motion, no jitter)
  const SCULPT_KICK = 0.05;                        // how much each trigger ADDS to the target (stacks toward SCULPT_RIPPLE) smaller = slower chase
  // AVATAR AURA — a rising sparkle helix around every avatar ON the stage.
  // One InstancedMesh pool, AURA_SLOTS avatars × AURA_PER sparkles; slots are
  // assigned nearest-first each tick (local player always gets slot 0).
  const AURA_ZONE = STAGE_RADIUS + 2.0;  // "inside the area" = on the stage disc
  const AURA_PER = IS_TOUCH ? 20 : 34;   // sparkles per avatar
  const AURA_SLOTS = IS_TOUCH ? 5 : 9;   // max simultaneous avatars with an aura
  const AURA_HEIGHT = 2.3;               // formation rise (feet → above head)
  // Aura FORMATIONS — each avatar runs one, advancing every AURA_PATTERN_CYCLE s
  // (the drag below morphs between them smoothly, no snap):
  //   0 HELIX       — rising orbit spiral (the original)
  //   1 SEED SPIRAL — golden-angle phyllotaxis column: the SAME spiral the
  //                   sculpture's SEED-DOME state is built from (fillSculptShape)
  //   2 ROSE RING   — 5-petal rose orbit at chest height (the ROSE-TORUS state)
  const AURA_PATTERNS = 3;
  const AURA_PATTERN_CYCLE = 26;         // seconds before an avatar's pattern advances
  // DRAG: sparkles are NOT welded to the avatar — each keeps its own position
  // and CHASES its formation anchor with a per-sparkle lag. Tuned TIGHT: the
  // formation stays attached to the body at rest and only walking/running
  // speed opens it into a long trail (at ~0.15s worst-case lag a run smears
  // ~1.5u behind; the old 0.45s ceiling left sparkles visibly stranded for a
  // beat before catching up).
  const AURA_DRAG_MIN = 0.03, AURA_DRAG_MAX = 0.16; // chase lag spread (seconds)
  const SYNC_CHANNEL = 'resonance-stage-sync';

  let XR = null, THREE = null, TSL = null, WEBGPU = null, scene = null;
  let useWebGL = true;
  const stage = { x: 0, y: 0, z: 0, resolved: false };

  // Audio-reactive TSL uniforms (WebGPU node materials read these; we set .value
  // each frame). On WebGL we animate material properties instead.
  //   uLevel  — instantaneous loudness   uBass — low end   uBeat — beat envelope
  //   uEnergy — SLOW-smoothed energy (song sections: builds + drops)
  //   uHero/uAccent/uGlow — ONE shared, slowly-drifting palette (cohesion)
  let uLevel = null, uBass = null, uBeat = null, uEnergy = null;
  let uHero = null, uAccent = null, uGlow = null;
  // Per-STEM levels (each of the 3 tracks drives a different screen parameter).
  let uTrack0 = null, uTrack1 = null, uTrack2 = null;
  // CPU mirrors of the palette (drive WebGL materials), recomputed each frame.
  let heroCol = null, accentCol = null, glowCol = null;
  // Live-mood hue centre: explicit THEME.driftCenter, or the primary hue when null.
  // Resolved lazily (THREE isn't assigned until init) and cached.
  let _driftCenter = null;
  const getDriftCenter = () => {
    if (_driftCenter != null) return _driftCenter;
    if (THEME.driftCenter != null) { _driftCenter = THEME.driftCenter; return _driftCenter; }
    const _hsl = { h: 0, s: 0, l: 0 }; new THREE.Color(THEME.primary).getHSL(_hsl);
    _driftCenter = _hsl.h; return _driftCenter;
  };
  let energy = 0; // slow-smoothed loudness → the show's "section" dynamics

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  // ── multiplayer TRANSPORT (console-driven, shared epoch + leader election) ──
  // The song no longer auto-plays: it initialises PAUSED at 0:00, and the
  // centre console's START pad sets `transport = { playing:true, epoch }` where
  // epoch is the leader-frame wall-clock ms of the 0:00 downbeat. Everyone
  // derives their play position from that one number, the leader heartbeats the
  // full transport (+ the layer mute mask) every 2.5s for late joiners, and
  // STOP rewinds to 0:00 paused. `mixOn[i]` is the per-track mute mask
  // (console toggles), also room-synced.
  let clientId = null, offset = 0;
  const transport = { playing: false, epoch: null };
  let mixOn = [];                                 // true = audible; index matches loaded layers
  const peers = new Map();
  let offsetSamples = [], syncOff = null, syncTimer = null, epochAcc = 0, pingAcc = 0;
  const aliveIds = () => {
    const cutoff = Date.now() - 4000; const ids = [];
    for (const [id, t] of peers) { if (t >= cutoff) ids.push(id); else peers.delete(id); }
    if (clientId) ids.push(clientId);
    return ids;
  };
  const isLeader = () => { if (!clientId) return true; let m = clientId; for (const id of aliveIds()) if (id < m) m = id; return m === clientId; };
  const onSyncMsg = (_p, d) => {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'hb') { if (d.id && d.id !== clientId) peers.set(d.id, Date.now()); }
    else if (d.t === 'ping') { if (isLeader() && d.id !== clientId) XR.broadcast(SYNC_CHANNEL, { t: 'pong', id: clientId || 'host', to: d.id, t0: d.t0, t1: Date.now() }); }
    else if (d.t === 'pong') { if (d.to === clientId) { const t2 = Date.now(), rtt = t2 - d.t0, est = d.t1 + rtt / 2 - t2; offsetSamples.push({ rtt, est }); if (offsetSamples.length > 8) offsetSamples.shift(); let b = offsetSamples[0]; for (const s of offsetSamples) if (s.rtt < b.rtt) b = s; offset = b.est; } }
    else if (d.t === 'tp') {
      // Transport/mix state from a peer (console press, or the leader's
      // heartbeat). Last-write-wins; the leader adopts and re-heartbeats, so
      // the room converges within one heartbeat even after races.
      if (d.id && d.id === clientId) return;
      if (typeof d.playing === 'boolean') {
        transport.playing = d.playing;
        transport.epoch = (typeof d.epoch === 'number') ? d.epoch : null;
      }
      if (Array.isArray(d.mix)) mixOn = d.mix.map((v) => v !== false);
      applyMix(); applyTransport();
    }
  };
  const startSync = () => {
    clientId = (XR.getClientId && XR.getClientId()) || null;
    offset = 0; offsetSamples = []; peers.clear(); epochAcc = 0; pingAcc = 0;
    syncOff = XR.onMessage ? XR.onMessage(SYNC_CHANNEL, onSyncMsg) : null;
    syncTimer = setInterval(() => {
      const leader = isLeader();
      if (clientId) XR.broadcast(SYNC_CHANNEL, { t: 'hb', id: clientId });
      if (leader) { offset = 0; epochAcc += 1000; if (epochAcc >= 2500) { epochAcc = 0; broadcastTransport(); } }
      else { pingAcc += 1000; if (pingAcc >= 3000) { pingAcc = 0; XR.broadcast(SYNC_CHANNEL, { t: 'ping', id: clientId || 'host', t0: Date.now() }); } }
    }, 1000);
  };
  const stopSync = () => { if (syncTimer) clearInterval(syncTimer); syncTimer = null; if (syncOff) syncOff(); syncOff = null; peers.clear(); };
  const positionMs = (dur) => {
    if (!transport.playing || transport.epoch == null || dur <= 0) return null;
    let p = (Date.now() + offset - transport.epoch) % dur; if (p < 0) p += dur; return p;
  };

  // ── audio analysis (bands + beat) ─────────────────────────────────────────
  let analyser = null, freq = null, prevFreq = null, fluxHist = [], fluxSum = 0, beatEnv = 0, lastBeat = 0, beatDecayT = 0;
  const BEAT_HALFLIFE = 0.2;  // seconds — smooth fade; clears between beats, no constant-lit
  // STROBE GATE: the flash only fires during ON windows (short, variable) separated
  // by longer OFF windows — so it punctuates sections instead of strobing the whole
  // song. ON windows are skipped while the music is quiet (stays in line with energy).
  let strobeOn = false, strobeGateT = 0, mid2Env = 0;
  const readAudio = () => {
    if (!analyser) { analyser = XR.getAudioAnalyser ? XR.getAudioAnalyser(512) : null; if (analyser) freq = new Uint8Array(analyser.frequencyBinCount); }
    if (!analyser || !freq) { beatEnv *= 0.86; return { level: 0, bass: 0, beat: false, beatEnv, energy, mid2: 0, bins: null, tr: [0, 0, 0], bands: [0, 0, 0] }; }
    analyser.getByteFrequencyData(freq);
    const n = freq.length;
    const bi = Math.max(1, Math.floor(n * 0.08));
    let bass = 0; for (let i = 0; i < bi; i++) bass += freq[i]; bass /= bi * 255;
    let all = 0; for (let i = 0; i < n; i++) all += freq[i]; all /= n * 255;
    // PER-STEM: read every stem's analyser exactly ONCE per tick, here. (They
    // used to be read here for flux/mids AND re-read in updateVisuals for the
    // screen/EQ bands — double FFT work per frame.) Level + low/high bands are
    // smoothed on the layer object; the flux + mids blocks below reuse L.freq.
    for (let i = 0; i < layers.length && i < 3; i++) {
      const L = layers[i];
      if (!L.analyser) continue;
      L.analyser.getByteFrequencyData(L.freq);
      const m = L.freq.length;
      let s = 0; for (let k = 0; k < m; k++) s += L.freq[k]; s /= m * 255;
      L.lvl += (s - L.lvl) * (s > L.lvl ? 0.45 : 0.12);
      const loN = Math.max(1, Math.floor(m * 0.12)), hiStart = Math.floor(m * 0.5);
      let lo = 0; for (let k = 0; k < loN; k++) lo += L.freq[k]; lo /= loN * 255;
      let hi = 0; for (let k = hiStart; k < m; k++) hi += L.freq[k]; hi /= (m - hiStart) * 255;
      L.lo = (L.lo || 0) + (lo - (L.lo || 0)) * (lo > (L.lo || 0) ? 0.5 : 0.14);
      L.hi = (L.hi || 0) + (hi - (L.hi || 0)) * (hi > (L.hi || 0) ? 0.5 : 0.14);
    }
    // FLASH basis = TRACK 1's LOW END ONLY. The strobe follows track 1's kick, so it
    // goes quiet when track 1 does (was the master mix → flashed on any stem's kick).
    // Falls back to the master low end until track 1's analyser exists.
    const t1 = layers[0];
    let bFreq = freq, bN = n;
    if (t1 && t1.analyser && t1.freq) { bFreq = t1.freq; bN = t1.freq.length; }
    const bbi = Math.max(1, Math.floor(bN * (bFreq === freq ? 0.08 : 0.12)));
    if (!prevFreq || prevFreq.length !== bbi) prevFreq = new Float32Array(bbi); // resets when source changes
    let flux = 0; for (let i = 0; i < bbi; i++) { const v = bFreq[i] / 255; const d = v - prevFreq[i]; if (d > 0) flux += d; prevFreq[i] = v; }
    flux /= bbi; fluxHist.push(flux); fluxSum += flux; if (fluxHist.length > 43) fluxSum -= fluxHist.shift();
    const mean = fluxSum / fluxHist.length, now = performance.now(); let beat = false;
    // Advance the strobe gate. ON: ~2–5.5s (variable, short). OFF: ~8–18s (longer).
    // Only opens an ON window when there's energy → no strobing through quiet parts.
    if (now > strobeGateT) {
      if (strobeOn) { strobeOn = false; strobeGateT = now + (8000 + Math.random() * 10000); }
      else if (energy > 0.1) { strobeOn = true; strobeGateT = now + (2000 + Math.random() * 3500); }
      else { strobeGateT = now + 1500; } // quiet — recheck soon, stay off
    }
    // Higher threshold + longer refractory (300ms) → flashes far less often (≈ on
    // the kick, a few/sec at most), only on a real low-end transient.
    if (flux > 0.006 && flux > mean * 1.7 && now - lastBeat > 300) { beat = true; lastBeat = now; }
    if (beat && strobeOn) {
      // LIT (only during a gate ON window). Brightness from the BEAT'S STRENGTH (how
      // far flux exceeds its running mean), NOT random — soft hits glow gently, only
      // strong transients peak. Math.max LIFTS the still-decaying flash → smooth.
      const strength = Math.min(1, Math.max(0, (flux / (mean + 1e-6) - 1.7) / 2.5));
      beatEnv = Math.max(beatEnv, 0.4 + strength * 0.6);
    } else {
      // No flash this frame (no beat, or gate is OFF) → smooth time-based decay
      // (consistent at 60/30Hz) so the strobe always eases out, never freezes lit.
      const rdt = beatDecayT ? Math.min(0.1, (now - beatDecayT) / 1000) : 1 / 60;
      beatEnv *= Math.pow(0.5, rdt / BEAT_HALFLIFE);
    }
    beatDecayT = now;
    // SLOW energy envelope — rises over a few seconds into choruses/drops, eases
    // back in breakdowns. This is what gives the show dynamics (build/release)
    // instead of constant flashing.
    energy += (all - energy) * (all > energy ? 0.03 : 0.012);
    // TRACK 2 MIDS — a gentle mid-band level off stem 2, smoothed. Drives the
    // sculpture's spin speed (subtle) so the rotation breathes with the mids.
    // (Reuses the freq bytes read in the per-stem block above — no second FFT.)
    const t2 = layers[1];
    let mid2 = 0;
    if (t2 && t2.analyser && t2.freq) {
      const m = t2.freq.length, lo = Math.floor(m * 0.12), hi = Math.max(lo + 1, Math.floor(m * 0.45));
      let s = 0; for (let i = lo; i < hi; i++) s += t2.freq[i]; mid2 = s / ((hi - lo) * 255);
    }
    mid2Env += (mid2 - mid2Env) * 0.12; // smooth so spin doesn't jitter
    return {
      level: all, bass, beat, beatEnv, energy, mid2: mid2Env, bins: freq,
      // per-stem smoothed levels + EQ bands (track1 LOW, track2/3 HIGH) — the
      // screen/EQ-particle inputs, computed once above.
      tr: [layers[0] ? layers[0].lvl : 0, layers[1] ? layers[1].lvl : 0, layers[2] ? layers[2].lvl : 0],
      bands: [layers[0] ? (layers[0].lo || 0) : 0, layers[1] ? (layers[1].hi || 0) : 0, layers[2] ? (layers[2].hi || 0) : 0],
    };
  };

  // ── materials: TSL node materials (WebGPU) or stock emissive (WebGL) ───────
  const col = (hex) => new THREE.Color(hex);
  // Stock emissive material (both renderers; blooms via core post-FX threshold).
  const stockEmissive = (hex, opts = {}) => new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: col(hex), emissiveIntensity: 1, roughness: 1, metalness: 0,
    transparent: !!opts.transparent, opacity: opts.transparent ? (opts.opacity ?? 0.6) : 1,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !opts.transparent, side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide, toneMapped: true,
  });

  // Floating-sculpture shape generators — ORIGINAL formulas (not copies of the
  // reference art; the reference-derived set is kept in _backups/…-reference-shapes).
  // Each fills `arr` for one form; the sculpture morphs between all SCULPT_GENS.
  // Every shape is centered + normalized to ~unit radius at the end so they share
  // one envelope and stay vertically centered (no "stuck at top"). Pure math,
  // deterministic, no allocation; runs only on a morph (~every 15–30s), so the
  // two normalize passes are free.
  //   0 FRACTAL BURST   — even sphere pushed OUT by 3 octaves of spikes (busy)
  //   1 HARMONIC CORAL  — Bourke sum-of-spherical-harmonics lumpy bloom
  //   2 ROSE-TORUS      — petaled ring (torus major radius modulated by a rose)
  //   3 MÖBIUS BAND     — single-sided half-twist ribbon, wide + low
  //   4 SEED-DOME       — golden-angle phyllotaxis spiral on a shallow dome
  const fillSculptShape = (arr, shape, n) => {
    const TAU = Math.PI * 2, PI = Math.PI, GA = PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < n; i++) {
      const o = i * 3; let x, y, z;
      if (shape === 0) {
        // FRACTAL BURST — an EVEN Fibonacci sphere (no center bunching) whose radius
        // is pushed strictly OUTWARD by three octaves of sharpened spikes → a busy,
        // fractal-ish starburst that fills the whole envelope instead of denting in.
        const u = (i + 0.5) / n;
        const phi = Math.acos(1 - 2 * u);             // 0..π, area-even
        const theta = (GA * i) % TAU;                 // 0..2π
        const r = 1
          + 0.50 * Math.pow(Math.abs(Math.sin(5 * theta) * Math.cos(4 * phi)), 0.6)   // coarse spikes
          + 0.26 * Math.pow(Math.abs(Math.sin(11 * theta) * Math.cos(9 * phi)), 0.7)  // mid detail
          + 0.13 * Math.abs(Math.sin(19 * theta) * Math.cos(15 * phi));               // fine fractal fuzz
        const sf = Math.sin(phi);
        x = r * sf * Math.cos(theta); y = r * Math.cos(phi); z = r * sf * Math.sin(theta);
      } else if (shape === 1) {
        // HARMONIC CORAL — Paul-Bourke spherical-harmonic sum over even (θ,φ).
        const u = (i + 0.5) / n;
        const phi = Math.acos(1 - 2 * u);             // 0..π
        const theta = (GA * i) % TAU;                 // 0..2π
        const r = Math.pow(Math.sin(4 * phi), 2) + Math.cos(3 * phi)
          + 0.6 * Math.pow(Math.sin(5 * theta), 2) + 0.4 * Math.cos(2 * theta) + 2.2;
        const sf = Math.sin(phi);
        x = r * sf * Math.cos(theta); y = r * Math.cos(phi); z = r * sf * Math.sin(theta);
      } else if (shape === 2) {
        // ROSE-TORUS — a 5-petal rose sets the torus's major radius → petaled ring.
        const ring = 9, along = Math.floor(i / ring), ringN = Math.max(1, Math.ceil(n / ring));
        const a = (along / ringN) * TAU, b = (i % ring) / ring * TAU;
        const rr2 = 0.34, R = 1 + 0.55 * Math.cos(5 * a), rr = R + rr2 * Math.cos(b);
        x = rr * Math.cos(a); y = rr2 * Math.sin(b); z = rr * Math.sin(a);
      } else if (shape === 3) {
        // MÖBIUS BAND — classic parametric half-twist strip, laid horizontal.
        const band = 7, along = Math.floor(i / band), aN = Math.max(1, Math.ceil(n / band));
        const uu = (along / aN) * TAU, v = ((i % band) / (band - 1) - 0.5) * 0.9;
        const half = 1 + v * Math.cos(uu / 2);
        x = half * Math.cos(uu); y = v * Math.sin(uu / 2); z = half * Math.sin(uu);
      } else {
        // SEED-DOME — sunflower phyllotaxis (golden angle) domed in Y.
        const uu = i / (n - 1), rad = Math.sqrt(uu), a = GA * i;
        x = rad * Math.cos(a); z = rad * Math.sin(a); y = (1 - rad * rad) * 0.42 - 0.14;
      }
      arr[o] = x; arr[o + 1] = y; arr[o + 2] = z;
    }
    // Center on the centroid, then normalize to ~unit bounding radius.
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) { const o = i * 3; cx += arr[o]; cy += arr[o + 1]; cz += arr[o + 2]; }
    cx /= n; cy /= n; cz /= n;
    let maxR = 1e-6;
    for (let i = 0; i < n; i++) {
      const o = i * 3, dx = arr[o] - cx, dy = arr[o + 1] - cy, dz = arr[o + 2] - cz;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d > maxR) maxR = d;
    }
    const inv = 1.12 / maxR;                          // 1.12 keeps them as bold as the old ring
    for (let i = 0; i < n; i++) { const o = i * 3; arr[o] = (arr[o] - cx) * inv; arr[o + 1] = (arr[o + 1] - cy) * inv; arr[o + 2] = (arr[o + 2] - cz) * inv; }
  };
  // ── TSL DEMO: a procedural, audio-reactive emissive FLOOR shader ──────────
  // This is the part to copy when authoring your own materials — BOTH halves.
  // The same visual (domain-warped flow + pulse rings + edge fade, driven by the
  // same audio signals) is written twice:
  //   WebGPU → a TSL node graph on MeshStandardNodeMaterial (below)
  //   WebGL  → a THREE.ShaderMaterial whose GLSL mirrors the graph 1:1, driven
  //            by a plain `uniforms` object we set from the SAME values each tick.
  // That's the whole fallback pattern: one signal source, two shader dialects.
  // (GLSL gotcha: three compiles ShaderMaterial as GLSL ES 3.00, so identifiers
  // like `patch`/`sample`/`filter` are RESERVED — using one silently kills the
  // mesh. See the engine CLAUDE.md.)
  let glslFloorU = null; // shared uniforms for the WebGL floor (created on demand)
  const makeFloorMaterialWebGL = () => {
    glslFloorU = {
      uTime: { value: 0 }, uEnergy: { value: 0 }, uBass: { value: 0 }, uBeat: { value: 0 },
      uHero: { value: new THREE.Color(PALETTE[0]) }, uAccent: { value: new THREE.Color(PALETTE[2]) },
      uIntensity: { value: INTENSITY },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: glslFloorU,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        varying vec2 vP;
        void main() {
          vP = position.xy; // unit disc → [-1,1], same frame as TSL positionLocal.xy
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vP;
        uniform float uTime, uEnergy, uBass, uBeat, uIntensity;
        uniform vec3 uHero, uAccent;
        // Cheap value noise + hash — the GLSL stand-in for TSL's mx_noise_vec3.
        float hash21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
        float vnoise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i), b = hash21(i + vec2(1.0, 0.0)), c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        void main() {
          float r = length(vP);
          float edge = pow(clamp(1.0 - r, 0.0, 1.0), 0.7);
          vec2 q = vP * 2.6;
          // DOMAIN WARP — mirrors the TSL graph: noise distorts the coords of a
          // second noise → slowly flowing organic veins.
          vec2 warp = vec2(vnoise(q + uTime * 0.25), vnoise(q + 7.31 - uTime * 0.25)) * 0.9;
          float tex = vnoise(q + warp + uTime * 0.18);
          float flow = pow(tex, 1.5);
          float rings = pow(sin(r * 7.0 - uTime * 2.2) * 0.5 + 0.5, 2.0) * 0.35;
          float veins = flow + rings;
          vec3 base = mix(uHero, uAccent, tex);
          float drive = uEnergy * 0.8 + uBass * 0.7 + uBeat * 0.4 + 0.35;
          gl_FragColor = vec4(base * veins * edge * drive * uIntensity, 1.0);
        }`,
    });
    return { mat, tsl: false };
  };
  const makeFloorMaterial = () => {
    if (useWebGL || !WEBGPU) return makeFloorMaterialWebGL();
    const { color, float, time, mix, vec3, mx_noise_vec3, positionLocal } = TSL;
    const m = new WEBGPU.MeshStandardNodeMaterial();
    m.colorNode = color(0x000000);
    m.roughnessNode = float(1); m.metalnessNode = float(0); m.side = THREE.DoubleSide;
    // The floor mesh is a unit disc scaled to STAGE_RADIUS, so positionLocal.xy
    // is in [-1, 1] across the floor (no uv attribute needed).
    const p = positionLocal.xy;
    const r = p.length();
    const edge = r.oneMinus().clamp(0, 1).pow(0.7);
    // DOMAIN WARP: a noise field sampled through coordinates distorted by another
    // noise → bold, slowly flowing organic texture. This is the visible layer.
    const sc = 2.6;
    const warp = mx_noise_vec3(vec3(p.x.mul(sc), p.y.mul(sc), time.mul(0.25))).xy.mul(0.9);
    const tex = mx_noise_vec3(vec3(p.x.mul(sc).add(warp.x), p.y.mul(sc).add(warp.y), time.mul(0.18))).x.mul(0.5).add(0.5);
    const flow = tex.pow(1.5);                                            // bright veins of the flow
    // Subtle rings underneath the flow for a sense of pulse.
    const rings = r.mul(7).sub(time.mul(2.2)).sin().mul(0.5).add(0.5).pow(2).mul(0.35);
    const pattern = flow.add(rings);
    const base = mix(uHero, uAccent, tex);                               // colour follows the flow
    const drive = uEnergy.mul(0.8).add(uBass.mul(0.7)).add(uBeat.mul(0.4)).add(0.35);
    m.emissiveNode = base.mul(pattern).mul(edge).mul(drive).mul(float(INTENSITY));
    return { mat: m, tsl: true };
  };
  // ── Equalizer ring ── a per-bar SPECTRUM: each bar is coloured by its frequency
  // position around the ring (instanceColor, set per frame) and carries a baked
  // vertical brightness gradient (dim base → hot tip = LED-meter look). Unlit so it
  // glows like an LED wall day or night. Both renderers use vertexColors ×
  // instanceColor; WebGPU uses the node twin so it composites the same way.
  const makeBarGeometry = () => {
    const g = new THREE.BoxGeometry(0.8, 1, 0.8);          // local y ∈ [-0.5, 0.5]
    const pos = g.attributes.position, c = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const t = pos.getY(i) + 0.5;                          // 0 base → 1 tip
      const mul = 0.3 + t * t * 1.4;                        // eased gradient, brighter toward the tip
      c[i * 3] = mul; c[i * 3 + 1] = mul; c[i * 3 + 2] = mul;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  };
  const makeRingMaterial = () => {
    if (useWebGL || !WEBGPU) return { mat: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), tsl: false };
    const m = new WEBGPU.MeshBasicNodeMaterial();
    m.vertexColors = true; m.toneMapped = false;
    return { mat: m, tsl: true };
  };

  // ── THE LASER FAN: bold flashing blue light-shaft fan ─────────────────────
  // The shared material for the side fans. Bright additive blue volumetric
  // beams with NORMAL depth (so they sort correctly behind the avatar / clouds /
  // terrain — they read as un-occluded only because the geometry sits high above
  // the stage). A GENTLE mx_noise shimmer modulates brightness without punching
  // them out, so they stay solid and bold. colorU/opacityU are flashed on the beat.
  const makeFanMaterial = () => {
    // Light beams (WebGPU): depthTest:FALSE so terrain's hardware depth never
    // clips them, and opacity multiplied by the core SELECTIVE-OCCLUSION mask so
    // SOLID objects (buildings/avatar/props) still occlude them — terrain and the
    // weather are excluded from that pass. (WebGL has no TSL mask → standard
    // depth-tested fallback.)
    if (useWebGL || !WEBGPU) {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE[1]).multiplyScalar(2.2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, side: THREE.DoubleSide, toneMapped: false });
      return { mat, tsl: false };
    }
    const { mx_noise_vec3, positionLocal, positionWorld, time, vec3, mix } = TSL;
    const mat = new WEBGPU.MeshBasicNodeMaterial();
    mat.transparent = true; mat.depthWrite = false; mat.depthTest = false; mat.blending = THREE.AdditiveBlending; mat.side = THREE.DoubleSide; mat.toneMapped = false;
    mat.colorNode = mix(uHero, uGlow, uBeat.mul(0.6)).mul(2.0);  // shared palette, lifts toward glow on beat
    // The beam plane is a unit quad (width 0.7, height 1) scaled to length, so
    // positionLocal.x ∈ [-0.35,0.35] across, positionLocal.y ∈ [0,1] along.
    const across = positionLocal.x.div(0.35);                  // [-1,1]
    const along = positionLocal.y;                             // [0,1] base→tip
    const edge = across.abs().oneMinus().clamp(0, 1).pow(0.5); // soft across width
    const lengthFade = along.oneMinus().pow(0.6).mul(0.85).add(0.15); // bright base → dim tip (keeps the centre crossing from blowing out)
    const seed = positionWorld.x.add(positionWorld.z).mul(0.15);
    // VISIBLE travelling striations along the beam (real volumetric texture).
    const strip = mx_noise_vec3(vec3(along.mul(7.0).sub(time.mul(2.5)), seed, seed)).x.mul(0.5).add(0.5);
    const striations = strip.pow(1.5).mul(0.7).add(0.3);
    const drive = uEnergy.mul(0.5).add(uBeat.mul(0.4)).add(uLevel.mul(0.2)).add(0.12);
    let op = edge.mul(lengthFade).mul(striations).mul(drive);
    if (XR.occlusionMaskNode) op = op.mul(XR.occlusionMaskNode());  // solids occlude; terrain/weather don't
    mat.opacityNode = op;
    return { mat, tsl: true };
  };

  // Build ONE fan rig anchored at a point on the circle (by `angle`), spreading
  // its beams inward-and-up toward a crossing point high above the centre.
  const buildFan = (angle, mat) => {
    const base = new THREE.Vector3(Math.cos(angle) * STAGE_RADIUS * 0.92, 0.6, Math.sin(angle) * STAGE_RADIUS * 0.92);
    const cross = new THREE.Vector3(0, STAGE_RADIUS + 4, 0);    // beams meet/cross above centre
    const dir = cross.clone().sub(base);
    const len = dir.length() * 1.35;                            // extend past the crossing
    dir.normalize();
    // Unit-height quad (so positionLocal.y is 0..1); scaled to `len` per beam.
    const beamGeo = new THREE.PlaneGeometry(0.7, 1); beamGeo.translate(0, 0.5, 0); // rises from base along +Y
    const rig = new THREE.Group();
    rig.position.copy(base);
    rig.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); // aim local +Y at the cross
    for (let i = 0; i < FAN_BEAMS; i++) {
      const m = new THREE.Mesh(beamGeo, mat);
      const spread = (i / (FAN_BEAMS - 1) - 0.5) * FAN_SPREAD;
      m.scale.set(1, len, 1);         // scale applied before rotation → stretches along the beam
      m.rotation.z = spread;          // fan within the plane
      m.rotation.y = spread * 0.45;   // a little 3D volume
      m.renderOrder = BEAM_RENDER_ORDER; m.frustumCulled = false; // over weather rain (50) AND clouds (100-103)
      rig.add(m);
    }
    rig.userData.beamGeo = beamGeo;
    rig.userData.baseQuat = rig.quaternion.clone(); // aim to wobble around
    return rig;
  };

  // NOTE: an overhead "top laser" asterisk (a horizontal fan of thin beams
  // crossing high above the centre) lived here. It was cut from the rig — the
  // side fans + the counter-rotating lasers already own that airspace — so the
  // material/builder pair went with it rather than sitting unused.

  // ── THE HOLOGRAPHIC WALL: a translucent curtain around the WHOLE perimeter ──
  // A full-360° see-through cylinder enclosing the stage: drifting noise + fine
  // scrolling scanlines for a holographic feel, in the shared palette. Low
  // additive opacity so you see the stage through it. (Was a centre column —
  // scaled out to a wall for the entire stage.)
  const makeWallMaterial = () => {
    if (useWebGL || !WEBGPU) {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE[0]).multiplyScalar(1.2), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, side: THREE.DoubleSide, toneMapped: false });
      return { mat, tsl: false };
    }
    const { mx_noise_vec3, positionLocal, time, vec3, mix } = TSL;
    const mat = new WEBGPU.MeshBasicNodeMaterial();
    mat.transparent = true; mat.depthWrite = false; mat.depthTest = false; mat.blending = THREE.AdditiveBlending; mat.side = THREE.DoubleSide; mat.toneMapped = false;
    const x = positionLocal.x, y = positionLocal.y, z = positionLocal.z;   // x,z ∈ [-1,1], y ∈ [0,1]
    const vfade = y.oneMinus().pow(1.2).mul(0.8).add(0.2);                  // fades toward the top
    const flow = mx_noise_vec3(vec3(x.mul(2.0).add(time.mul(0.2)), y.mul(2.5).sub(time.mul(0.4)), z.mul(2.0))).x.mul(0.5).add(0.5);
    const scan = y.mul(70.0).sub(time.mul(3.0)).sin().mul(0.5).add(0.5).pow(2).mul(0.45).add(0.55); // holographic scanlines
    mat.colorNode = mix(uHero, uAccent, flow).mul(1.6);
    const drive = uEnergy.mul(0.5).add(uBeat.mul(0.2)).add(0.18);
    let op = vfade.mul(flow.mul(0.6).add(0.25)).mul(scan).mul(drive);
    if (XR.occlusionMaskNode) op = op.mul(XR.occlusionMaskNode());          // solids occlude; terrain/weather don't
    mat.opacityNode = op;
    return { mat, tsl: true };
  };
  const buildWall = (mat) => {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 128, 1, true);         // FULL 360° unit cylinder
    geo.translate(0, 0.5, 0);                                              // base at y=0
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(STAGE_RADIUS + 2.4, STAGE_RADIUS * 1.5, STAGE_RADIUS + 2.4); // out to the perimeter
    mesh.renderOrder = BEAM_RENDER_ORDER; mesh.frustumCulled = false; // over weather rain (50) AND clouds (100-103)
    mesh.userData.geo = geo;
    return mesh;
  };

  // ── THE BACK SCREEN: a curved LED wall projecting trippy visuals ──────────
  // Fills the back half of the stage (a half-cylinder). A domain-warped flow
  // like the floor, but each of the THREE stems drives a DIFFERENT parameter:
  //   track 0 → WARP strength (big slow distortion) + brightness
  //   track 1 → horizontal SCAN ripples
  //   track 2 → SCROLL speed / fine detail + lift toward the glow colour
  // Geometry is a unit half-cylinder scaled to size, so positionLocal is
  // normalized (x,z ∈ [-1,1], y ∈ [0,1]) — no uv attribute needed.
  const makeScreenMaterial = () => {
    if (useWebGL || !WEBGPU) {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE[0]).multiplyScalar(0.5), side: THREE.DoubleSide, toneMapped: false });
      return { mat, tsl: false };
    }
    const { mx_noise_vec3, positionLocal, time, vec3, mix } = TSL;
    const mat = new WEBGPU.MeshBasicNodeMaterial();
    mat.side = THREE.DoubleSide; mat.toneMapped = false;
    const x = positionLocal.x, y = positionLocal.y, z = positionLocal.z;
    const warpAmt = uTrack0.mul(1.7).add(0.2);                            // track 0 → distortion
    const warp = mx_noise_vec3(vec3(x.mul(1.5).add(time.mul(0.25)), y.mul(2.0), time.mul(0.18))).xy.mul(warpAmt);
    const spd = uTrack2.mul(1.4).add(0.25);                               // track 2 → scroll speed
    const field = mx_noise_vec3(vec3(x.mul(2.6).add(warp.x), y.mul(3.2).add(warp.y).sub(time.mul(0.6).mul(spd)), z.mul(1.6).add(time.mul(0.1)))).x.mul(0.5).add(0.5);
    const ripple = x.mul(9.0).add(time.mul(2.2)).sin().mul(0.5).add(0.5).mul(uTrack1); // track 1 → scan lines
    const patt = field.mul(0.85).add(ripple.mul(0.45)).pow(1.4);
    const baseC = mix(uHero, uAccent, field);
    const colr = mix(baseC, uGlow, uTrack2.mul(0.5).add(ripple.mul(0.3)).clamp(0, 1));
    const bright = uEnergy.mul(0.35).add(uTrack0.mul(0.6)).add(0.22);
    mat.colorNode = colr.mul(patt).mul(bright).mul(2.0);                  // bright veins bloom; dark areas read as off pixels
    return { mat, tsl: true };
  };
  const buildScreen = (mat) => {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true, 0, Math.PI); // back half arc
    geo.translate(0, 0.5, 0);                                             // base at y=0
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(STAGE_RADIUS + 1.6, STAGE_RADIUS * 1.4, STAGE_RADIUS + 1.6);
    mesh.renderOrder = 1; mesh.frustumCulled = false;
    mesh.userData.geo = geo;
    return mesh;
  };

  // ── FOG MACHINES ─────────────────────────────────────────────────────────
  // Soft radial sprite (white core → transparent edge) so additive puffs read as
  // haze, not hard quads.
  const makeSoftFogTexture = () => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.0, 'rgba(255,255,255,0.55)');   // feathered: soft core, no hard centre
    grd.addColorStop(0.4, 'rgba(255,255,255,0.22)');
    grd.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
  };
  // FOG: NORMAL-blended cool grey at ≤85% opacity. Normal blending means
  // overlapping puffs blend toward the fog colour and CANNOT exceed 85% — so it
  // never whites out, and the avatar always reads ≥15% through it. depthTest:TRUE
  // → the avatar and solids occlude it naturally (no occluder machinery). Stock
  // material on both renderers; fade is done by a SCALE envelope (grow in, shrink
  // out) so no per-instance alpha is needed.
  const makeFogMaterial = (tex, maxOp = 0.85) => new THREE.MeshBasicMaterial({
    map: tex, color: new THREE.Color(THEME.fog), transparent: true, opacity: maxOp, blending: THREE.NormalBlending,
    depthWrite: false, depthTest: true, side: THREE.DoubleSide, toneMapped: false,
  });
  // FIRE: ADDITIVE hot-orange, SOLID material colour (NO instanceColor — that was
  // the invisibility trap: an additive mesh whose instanceColor doesn't apply
  // renders black). Built EXACTLY like the fog that renders. Overlapping flames
  // stack additively → white-hot core, orange edges. Fade is a scale envelope.
  const makeFireMaterial = (tex) => new THREE.MeshBasicMaterial({
    map: tex, color: new THREE.Color(THEME.fire), transparent: true, opacity: 1, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: true, side: THREE.DoubleSide, toneMapped: false,
  });
  // Emitters sit on the front lip (the −X audience semicircle, opposite the +X
  // screen) and aim inward/up toward the screen base.
  const buildFogMachines = () => {
    const machines = [];
    for (let i = 0; i < FOG_MACHINES; i++) {
      const ang = Math.PI + (i / Math.max(1, FOG_MACHINES - 1) - 0.5) * 1.0; // around −X, spread in Z
      const px = Math.cos(ang) * STAGE_RADIUS * 0.92;
      const pz = Math.sin(ang) * STAGE_RADIUS * 0.92;
      // Aim DEEP toward the screen base (+X), low and slightly inward.
      const tx = STAGE_RADIUS * 0.9, tz = pz * 0.2;
      const dx = tx - px, dz = tz - pz;
      const dl = Math.hypot(dx, dz) || 1;
      machines.push({ x: px, z: pz, dx: dx / dl, dz: dz / dl });
    }
    return machines;
  };

  // ── visuals ────────────────────────────────────────────────────────────────
  // The walkable platform is a SEPARATE collidable solid (XRPublisher.addSolid),
  // built with its origin at the GROUND-contact point and a skirt buried below 0
  // so the base never hovers over rolling terrain.
  const buildPlatform = () => {
    const total = STAGE_HEIGHT + STAGE_SINK;
    const geo = new THREE.CylinderGeometry(STAGE_RADIUS, STAGE_RADIUS * 1.04, total, 56);
    geo.translate(0, STAGE_HEIGHT - total / 2, 0); // top at +STAGE_HEIGHT, bottom at -STAGE_SINK
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(THEME.structure), roughness: 0.35, metalness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
    return { mesh, geo, mat };
  };

  let viz = null;
  const buildStage = () => {
    const g = new THREE.Group(); g.position.set(stage.x, stage.y, stage.z);
    const dummy = new THREE.Object3D();

    // Visuals sit on the platform TOP surface.
    const top = new THREE.Group(); top.position.y = STAGE_HEIGHT + 0.02; g.add(top);

    const floorMat = makeFloorMaterial();
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 96), floorMat.mat);
    floor.rotation.x = -Math.PI / 2; floor.scale.set(STAGE_RADIUS, STAGE_RADIUS, 1); floor.position.y = 0.06; top.add(floor);

    const ringMat = makeRingMaterial();
    // Wider bars to fill the larger-diameter ring; vertical gradient baked in.
    const ring = new THREE.InstancedMesh(makeBarGeometry(), ringMat.mat, BAR_COUNT);
    ring.frustumCulled = false; top.add(ring);
    const _rc = new THREE.Color(0, 0, 0);
    for (let i = 0; i < BAR_COUNT; i++) ring.setColorAt(i, _rc); // allocate instanceColor
    if (ring.instanceColor) ring.instanceColor.needsUpdate = true;
    const barH = new Float32Array(BAR_COUNT).fill(0.2);

    // FOUR laser fans — one anchored at each side of the circle (N/E/S/W), each
    // angled inward-and-up so all four cross high above the centre. Bold,
    // flashing, drawn over terrain.
    const fanMatInfo = makeFanMaterial();
    const fanAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    const fans = fanAngles.map((a) => buildFan(a, fanMatInfo.mat));
    fans.forEach((f) => top.add(f));
    // Projector HEADS at each fan base — a squat mount + a tapered barrel angled at
    // the beam crossing + a glowing lens, so the beams read as emitting from a real
    // fixture (not a cube). The beams sway in direction but originate here.
    const encMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(THEME.hardware), roughness: 0.55, metalness: 0.6 });
    const upY = new THREE.Vector3(0, 1, 0);
    const cross = new THREE.Vector3(0, STAGE_RADIUS + 4, 0);
    fanAngles.forEach((a) => {
      const ex = Math.cos(a) * STAGE_RADIUS * 0.92, ez = Math.sin(a) * STAGE_RADIUS * 0.92;
      const grp = new THREE.Group(); grp.position.set(ex, 0, ez);
      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.4, 16), encMat);
      mount.position.y = 0.2; mount.castShadow = true; mount.receiveShadow = true; grp.add(mount);
      const dir = cross.clone().sub(new THREE.Vector3(ex, 0.6, ez)).normalize(); // aim at the crossing
      const beamOrigin = new THREE.Vector3(0, 0.6, 0);    // where the beams actually start (rig base, group-local)
      const len = 1.0;                                    // scaled-down cone
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.52, len, 18), encMat); // narrow lens → wide body
      barrel.quaternion.setFromUnitVectors(upY, dir);
      barrel.position.copy(beamOrigin).addScaledVector(dir, -len * 0.5); // mouth lands ON the beam origin
      barrel.castShadow = true; grp.add(barrel);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.26, 18), stockEmissive(PALETTE[2], {}));
      lens.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      lens.position.copy(beamOrigin).addScaledVector(dir, 0.04); // lens right at the mouth
      grp.add(lens);
      top.add(grp);
    });

    // (The overhead asterisk was removed — it piled additive light at the centre
    // and washed out everything. The fans + holographic wall own it now.)

    // Full-perimeter holographic wall.
    const wallInfo = makeWallMaterial();
    const wall = buildWall(wallInfo.mat);
    top.add(wall);

    // Curved back-wall LED screen (per-track trippy visuals).
    const screenInfo = makeScreenMaterial();
    const screen = buildScreen(screenInfo.mat);
    top.add(screen);

    // ── Backdrop: abstract neon TOWERS wrapping the back/sides of the screen and
    //    rising well above it (emissive → glows on WebGL, blooms on WebGPU). ─────
    const screenTop = STAGE_RADIUS * 1.4;
    const bdColors = [PALETTE[0], PALETTE[1], THEME.violet, PALETTE[2]];
    const backdrop = new THREE.Group();
    for (let i = 0; i < BACKDROP_COUNT; i++) {
      const t = i / (BACKDROP_COUNT - 1);
      const ang = -Math.PI * 0.5 + t * Math.PI;            // +X back semicircle, wraps to the sides
      const r = STAGE_RADIUS + 17 + (i % 3) * 3;         // well behind the screen (the strong tilt swings tops inward)
      const h = screenTop * (2.0 + (i % 4) * 0.35);        // TALLER (so it still towers after sinking)
      const geo = new THREE.CylinderGeometry(1.4, 2.7, h, 3); geo.translate(0, h / 2, 0); // THICKER triangular tower
      const m = stockEmissive(bdColors[i % bdColors.length], {});
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(Math.cos(ang) * r, -10, Math.sin(ang) * r); // sink the base ~10 below the platform → buried in terrain
      mesh.rotation.y = ang + i * 0.7;                     // varied facing → angular zigzag feel
      mesh.rotation.z = (i % 2 ? 1 : -1) * 0.55;           // strong alternating lean → adjacent towers cross
      mesh.userData.mat = m; mesh.userData.baseI = 0.55 + (i % 3) * 0.18;
      backdrop.add(mesh);
    }
    top.add(backdrop);

    const partGeo = new THREE.BoxGeometry(0.13, 0.13, 0.13);
    const partMat = stockEmissive(PALETTE[0], { transparent: true, additive: true, opacity: 1 });
    const parts = new THREE.InstancedMesh(partGeo, partMat, PARTICLE_POOL); parts.frustumCulled = false; top.add(parts);
    for (let i = 0; i < PARTICLE_POOL; i++) { dummy.position.set(0, -999, 0); dummy.scale.set(0.001, 0.001, 0.001); dummy.updateMatrix(); parts.setMatrixAt(i, dummy.matrix); }
    parts.instanceMatrix.needsUpdate = true;

    // Fog machines — normal-blended grey haze. NO instanceColor (uses material
    // colour); fade is a scale envelope. Hidden off-screen until spawned.
    const fogTex = makeSoftFogTexture();
    const fogMat = makeFogMaterial(fogTex, 0.14);          // grey, ≤14% opacity — light, feathered fill
    const fog = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), fogMat, FOG_POOL);
    fog.frustumCulled = false; fog.renderOrder = 3; top.add(fog);
    for (let i = 0; i < FOG_POOL; i++) {
      dummy.position.set(0, -999, 0); dummy.scale.set(0.001, 0.001, 0.001); dummy.updateMatrix(); fog.setMatrixAt(i, dummy.matrix);
    }
    fog.instanceMatrix.needsUpdate = true;

    // Pyro — fire gerbs: solid-orange additive sprites (NO instanceColor), exactly
    // like the fog. Emitters across the front lip; even→track1, odd→track2.
    // Same depthWrite:false-vs-clouds quirk as the laser fans/wall (see the
    // BEAM_RENDER_ORDER note near the top of the file): the flames were sitting
    // at renderOrder 4, well below the sky's cloud deck (100-103), so a cloud
    // painted over any flame reaching into it. Bump to BEAM_RENDER_ORDER so fire
    // draws after the clouds and glows over them like the beams do.
    const fireMat = makeFireMaterial(fogTex);
    const fire = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), fireMat, FIRE_POOL);
    fire.frustumCulled = false; fire.renderOrder = BEAM_RENDER_ORDER; top.add(fire); // over weather rain (50) AND clouds (100-103)
    for (let i = 0; i < FIRE_POOL; i++) {
      dummy.position.set(0, -999, 0); dummy.scale.set(0.001, 0.001, 0.001); dummy.updateMatrix(); fire.setMatrixAt(i, dummy.matrix);
    }
    fire.instanceMatrix.needsUpdate = true;
    const fireEmitters = [];
    for (let i = 0; i < FIRE_EMITTERS; i++) {
      const ang = Math.PI * 0.5 + (i + 0.5) / FIRE_EMITTERS * Math.PI; // across the front (−X) arc
      const fx = Math.cos(ang) * STAGE_RADIUS * 0.98, fz = Math.sin(ang) * STAGE_RADIUS * 0.98;
      fireEmitters.push({
        x: fx, z: fz,
        track: (i % 2 === 0) ? 1 : 2,                 // alternate stem assignment
        cd: 0.5 + i * 0.45 + Math.random() * 0.8,     // staggered, fires within ~1-4s
        base: FIRE_RECHARGE[i % FIRE_RECHARGE.length],
        second: 0, secondLvl: 0,                      // double-tap (queued 2nd flame)
      });
      // Mortar ENCLOSURE per gerb — black tube + flared base, flames shoot out the
      // top (they spawn inside it). Matches the projector-head treatment.
      const mortar = new THREE.Group(); mortar.position.set(fx, 0, fz);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.8, 14), encMat);
      tube.position.y = 0.4; tube.castShadow = true; tube.receiveShadow = true; mortar.add(tube);
      const ringBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.16, 14), encMat);
      ringBase.position.y = 0.08; ringBase.receiveShadow = true; mortar.add(ringBase);
      top.add(mortar);
    }

    // ── EQ particles ABOVE the screen, 3 BANDS so the track separation is visible:
    //    band0=track1 LOW, band1=track2 HIGH, band2=track3 HIGH. Ever-present field,
    //    each particle bounces + brightens with its band. (fogTex now exists.) ──
    const sPartMat = new THREE.MeshBasicMaterial({
      map: fogTex, transparent: true, opacity: 1, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: true, side: THREE.DoubleSide, toneMapped: false,
    });
    const sParts = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), sPartMat, SCREEN_PART_POOL);
    sParts.frustumCulled = false; sParts.renderOrder = 5; top.add(sParts);
    const spBase = new Float32Array(SCREEN_PART_POOL * 3);
    const spPhase = new Float32Array(SCREEN_PART_POOL);
    const _black = new THREE.Color(0, 0, 0);
    for (let i = 0; i < SCREEN_PART_POOL; i++) {
      const band = i % 3;                                  // 3 clusters, separated in Z
      spBase[i * 3] = STAGE_RADIUS * 0.5 + (Math.random() - 0.5) * 5;   // above/in front of screen (+X)
      spBase[i * 3 + 1] = screenTop + 2 + Math.random() * 9;            // above the screen top
      spBase[i * 3 + 2] = (band - 1) * 7 + (Math.random() - 0.5) * 4;   // band → Z cluster
      spPhase[i] = Math.random() * Math.PI * 2;
      sParts.setColorAt(i, _black);
    }
    sParts.instanceMatrix.needsUpdate = true; if (sParts.instanceColor) sParts.instanceColor.needsUpdate = true;

    // ── Floating SCULPTURE above the stage ── instanced ICOSPHERES (NOT GL points:
    //    WebGPU caps point size to ~1px, so point `size` did nothing). Each particle
    //    is a real 3D shape whose size = SCULPT_PSIZE scale — visible near AND far on
    //    both renderers. Morphs between forms + ripples to the spectrum.
    const sBase = new Float32Array(SCULPT_COUNT * 3);
    fillSculptShape(sBase, 0, SCULPT_COUNT);   // START on the supershape star-bloom
    const sGeo = new THREE.IcosahedronGeometry(1, 0);   // ~20-tri blob, visible from any angle
    const sMat = new THREE.MeshBasicMaterial({          // unlit + additive → glows; instanceColor per particle
      color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false,
    });
    const sculpt = new THREE.InstancedMesh(sGeo, sMat, SCULPT_COUNT);
    sculpt.position.set(0, 4, 0); sculpt.frustumCulled = false; sculpt.renderOrder = 6;
    const sPal = [new THREE.Color(PALETTE[0]), new THREE.Color(PALETTE[1]), new THREE.Color(PALETTE[2])];
    const _sd = new THREE.Object3D(), _sc = new THREE.Color();
    for (let i = 0; i < SCULPT_COUNT; i++) {
      const o = i * 3;
      _sd.position.set(sBase[o] * SCULPT_RADIUS, sBase[o + 1] * SCULPT_RADIUS, sBase[o + 2] * SCULPT_RADIUS);
      _sd.scale.setScalar(SCULPT_PSIZE); _sd.updateMatrix();
      sculpt.setMatrixAt(i, _sd.matrix);
      const c = sPal[i % 3], b = 1.1 + (i % 5) * 0.12;
      _sc.setRGB(c.r * b, c.g * b, c.b * b); sculpt.setColorAt(i, _sc);
    }
    sculpt.instanceMatrix.needsUpdate = true; if (sculpt.instanceColor) sculpt.instanceColor.needsUpdate = true;
    top.add(sculpt);
    // Per-particle TRIGGERED envelopes: when a particle's EQ band crosses the
    // threshold it fires a trigger that ADDS to its target (stacking toward the max),
    // spaced by a per-particle refractory; the rendered value eases toward the target
    // and the target bleeds down over a long per-particle half-life → smooth, additive,
    // staggered, never unison. Constants seeded once.
    const sculptPEnv = new Float32Array(SCULPT_COUNT);    // rendered radial push (eased)
    const sculptPTarget = new Float32Array(SCULPT_COUNT); // accumulated trigger target
    const sculptPRefr = new Float32Array(SCULPT_COUNT);   // refractory countdown between triggers
    const sculptPDelay = new Float32Array(SCULPT_COUNT);  // per-particle refractory spacing
    const sculptPHalf = new Float32Array(SCULPT_COUNT);   // per-particle target decay half-life
    for (let i = 0; i < SCULPT_COUNT; i++) {
      sculptPDelay[i] = 0.09 + Math.random() * 0.32;      // 0.09–0.41s between triggers (the "distance")
      sculptPHalf[i] = 0.7 + Math.random() * 1.9;         // 0.7–2.6s LONG, smooth bleed-down (wide spread → no unison)
    }
    // Breathing variance groups (see the SCULPT_VAR_GROUPS const): per-group
    // attack + recovery half-life around the tuned centres; particles pick a
    // random group so neighbours in the same shape band still move offset.
    const sculptGrp = new Uint8Array(SCULPT_COUNT);
    const sculptGrpAtk = new Float32Array(SCULPT_VAR_GROUPS);
    const sculptGrpHalf = new Float32Array(SCULPT_VAR_GROUPS);
    for (let g = 0; g < SCULPT_VAR_GROUPS; g++) {
      sculptGrpAtk[g] = SCULPT_ATTACK * (0.4 + Math.random() * 1.8);     // ~0.05–0.29s rise
      sculptGrpHalf[g] = SCULPT_HALFLIFE * (0.35 + Math.random() * 1.5); // ~0.44–2.3s recovery
    }
    for (let i = 0; i < SCULPT_COUNT; i++) sculptGrp[i] = Math.floor(Math.random() * SCULPT_VAR_GROUPS);

    // ── CENTER CONSOLE ── a wide control desk dead-centre on the stage: START
    // pad on the left end, STOP on the right, and one glowing mix toggle per
    // AVAILABLE track between them (no URL in LAYER_URLS → no pad; up to 8
    // supported — the desk widens to fit). Pads are engine interactables
    // ("Press E" / the mobile interact button) wired in registerConsole();
    // their lights reflect transport + mute state (refreshConsole()).
    const trackCount = LAYER_URLS.filter(Boolean).length;
    const con = new THREE.Group();
    con.rotation.y = -Math.PI / 2; // face the front of the stage (was rotated 90° too far clockwise)
    const deskW = 2.6 + 1.1 * Math.max(1, trackCount);
    const deskMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(THEME.hardware), roughness: 0.4, metalness: 0.7 });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(deskW, 0.14, 1.1), deskMat);
    deskTop.position.y = 1.0; deskTop.castShadow = true; deskTop.receiveShadow = true; con.add(deskTop);
    const deskBody = new THREE.Mesh(new THREE.BoxGeometry(deskW * 0.94, 0.96, 0.78), deskMat);
    deskBody.position.y = 0.48; deskBody.castShadow = true; con.add(deskBody);
    const padGeo = new THREE.CylinderGeometry(0.17, 0.2, 0.08, 20);
    const conStart = new THREE.Mesh(padGeo, stockEmissive('#2eff7a', {}));   // green = go
    conStart.position.set(-deskW / 2 + 0.45, 1.11, 0); con.add(conStart);
    const conStop = new THREE.Mesh(padGeo, stockEmissive('#ff3b30', {}));    // red = stop/rewind
    conStop.position.set(deskW / 2 - 0.45, 1.11, 0); con.add(conStop);
    const conToggles = [];
    const togGeo = new THREE.BoxGeometry(0.36, 0.07, 0.36);
    for (let i = 0; i < trackCount; i++) {
      const pad = new THREE.Mesh(togGeo, stockEmissive(PALETTE[i % PALETTE.length], {}));
      pad.position.set((i - (trackCount - 1) / 2) * 1.1, 1.1, 0);
      con.add(pad); conToggles.push(pad);
    }
    top.add(con);

    // ── AVATAR AURA ── a rising sparkle helix around every avatar ON the stage
    //    (see header). ONE pool: AURA_SLOTS avatars × AURA_PER sparkles, tiny
    //    additive icospheres (orientation-free — no billboard math needed) with
    //    instanceColor cycling the live palette per avatar. Parented to `g`
    //    (stage origin), so sparkle positions are world − stage.
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false,
    });
    const aura = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), auraMat, AURA_PER * AURA_SLOTS);
    aura.frustumCulled = false; aura.renderOrder = 7; g.add(aura);
    const _auc = new THREE.Color(0, 0, 0);
    for (let i = 0; i < AURA_PER * AURA_SLOTS; i++) {
      dummy.position.set(0, -999, 0); dummy.scale.set(0.001, 0.001, 0.001); dummy.updateMatrix();
      aura.setMatrixAt(i, dummy.matrix); aura.setColorAt(i, _auc);
    }
    aura.instanceMatrix.needsUpdate = true; if (aura.instanceColor) aura.instanceColor.needsUpdate = true;
    const auraSeed = new Float32Array(AURA_PER);
    for (let i = 0; i < AURA_PER; i++) auraSeed[i] = Math.random();

    scene.add(g);
    return {
      g, top, dummy, floorMat, ring, ringMat, barH, ringCol: new THREE.Color(),
      fanMatInfo, fans, wallInfo, screenInfo,
      wob: { sway: new THREE.Quaternion(), spin: new THREE.Quaternion(), eu: new THREE.Euler(), yAxis: new THREE.Vector3(0, 1, 0) },
      parts, partMat, pPos: new Float32Array(PARTICLE_POOL * 3), pVel: new Float32Array(PARTICLE_POOL * 3), pLife: new Float32Array(PARTICLE_POOL), pCursor: 0,
      fog, fogTex, fogMat, fogMachines: buildFogMachines(), fogCol: new THREE.Color(),
      fPos: new Float32Array(FOG_POOL * 3), fVel: new Float32Array(FOG_POOL * 3), fLife: new Float32Array(FOG_POOL), fSize: new Float32Array(FOG_POOL), fCursor: 0,
      fogClock: FOG_INTERVAL - 1.5, fogBurst: 0, fogEmitAccum: 0,
      fire, fireMat, fireEmitters, fireCol: new THREE.Color(),
      firePos: new Float32Array(FIRE_POOL * 3), fireVel: new Float32Array(FIRE_POOL * 3), fireLife: new Float32Array(FIRE_POOL), fireSize: new Float32Array(FIRE_POOL), fireDecay: new Float32Array(FIRE_POOL), fireCursor: 0,
      backdrop, sParts, spBase, spPhase, sCol: new THREE.Color(),
      bandCols: [new THREE.Color(PALETTE[0]), new THREE.Color(PALETTE[1]), new THREE.Color(PALETTE[2])],
      sculpt, sculptBase: sBase, sculptBaseB: new Float32Array(SCULPT_COUNT * 3),
      sculptShape: 0, sculptShapeB: 0, sculptMorphing: false, sculptMorphP: 0,
      sculptT: 0, sculptNext: 14, sculptCol: new THREE.Color(),
      sculptPEnv, sculptPTarget, sculptPRefr, sculptPDelay, sculptPHalf,
      sculptGrp, sculptGrpAtk, sculptGrpHalf,
      sculptGrpEnv: new Float32Array(SCULPT_VAR_GROUPS),
      sculptGrpEase: new Float32Array(SCULPT_VAR_GROUPS), sculptGrpDec: new Float32Array(SCULPT_VAR_GROUPS),
      conStart, conStop, conToggles,
      aura, auraSeed, auraCol: new THREE.Color(),
      auraPos: new Float32Array(AURA_SLOTS * AURA_PER * 3),   // persistent world-ish positions → drag/trails
      auraEase: new Float32Array(AURA_PER),                    // per-sparkle chase factor, refreshed per tick
      auraInit: new Uint8Array(AURA_SLOTS),                    // 0 = snap to targets on first frame of a slot
      auraUsed: new Uint8Array(AURA_SLOTS),
      auraSlotOwner: new Array(AURA_SLOTS).fill(null),
      auraAssign: new Map(),                                   // avatar id → slot (stable across ticks)
      auraLocal: { id: '__local', x: 0, y: 0, z: 0 },
      emitters: [],
    };
  };

  const disposeStage = () => {
    if (!viz) return;
    scene.remove(viz.g);
    if (viz.fogTex) viz.fogTex.dispose();  // material.dispose() doesn't free its map
    viz.g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
    viz = null;
  };

  // ── audio: stems as POSITIONED emitters around the stage (spatial) ─────────
  // Stems load PAUSED at 0:00 — the console's START pad is the play trigger.
  let layers = [], durationMs = 0, audioCtx = null, audioTimer = null;
  const startAudio = () => {
    const listener = XR.getAudioListener && XR.getAudioListener();
    if (!listener || !viz) return;
    audioCtx = listener.context;
    const urls = LAYER_URLS.filter(Boolean);
    if (mixOn.length !== urls.length) mixOn = urls.map(() => true); // default: all layers audible
    const loader = new THREE.AudioLoader();
    urls.forEach((url, i) => {
      const ang = (i / urls.length) * Math.PI * 2;
      const ex = Math.cos(ang) * STAGE_RADIUS * 0.8;
      const ez = Math.sin(ang) * STAGE_RADIUS * 0.8;
      const ey = 1.4;
      // Invisible positioned emitter — keeps the stems spatial (walking re-mixes
      // them) without a gimmicky glowing "speaker" object.
      const emitter = new THREE.Object3D();
      emitter.position.set(ex, ey, ez); viz.top.add(emitter); viz.emitters.push(emitter);

      const a = new THREE.PositionalAudio(listener);
      // Full volume across the (now larger) stage, then a gentle falloff so the
      // mix carries well beyond it. refDistance is the lever, not RADIUS.
      a.setRefDistance(STAGE_RADIUS * 1.6);
      a.setRolloffFactor(0.8);
      a.setDistanceModel('inverse');
      a.setMaxDistance(RADIUS);
      a.setLoop(true);                       // AudioBufferSourceNode loop = sample-accurate
      a.setVolume(mixOn[i] === false ? 0 : VOLUME);
      emitter.add(a); // inherits the emitter's world position → spatial
      // Per-stem analyser tap (a.gain is the track's persistent output node) so
      // the screen can react to EACH of the 3 tracks independently.
      const an = audioCtx.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = 0.8;
      a.gain.connect(an);
      const layer = { a, ctxTime: 0, offsetSec: 0, analyser: an, freq: new Uint8Array(an.frequencyBinCount), lvl: 0 };
      layers.push(layer);
      loader.load(url, (buf) => {
        a.setBuffer(buf);
        if (!durationMs) durationMs = buf.duration * 1000;
        // Default: stay PAUSED at 0:00, armed for the START pad. If the room
        // transport is already rolling (late join / re-entering the zone),
        // drop in at the shared position — alignAudio heals the rest.
        if (transport.playing) {
          const pos = positionMs(durationMs) || 0;
          a.offset = pos / 1000; a.play();
          layer.ctxTime = audioCtx.currentTime; layer.offsetSec = pos / 1000;
        }
      }, undefined, () => { /* layer failed — others still play */ });
    });
    audioTimer = setInterval(alignAudio, 700);
    refreshConsole();
  };
  const alignAudio = () => {
    if (!audioCtx || durationMs <= 0 || !transport.playing) return;
    const pos = positionMs(durationMs); if (pos == null) return;
    for (const l of layers) {
      if (!l.a.isPlaying) continue;
      let actual = (((audioCtx.currentTime - l.ctxTime) + l.offsetSec) * 1000) % durationMs;
      let drift = Math.abs(actual - pos); drift = Math.min(drift, durationMs - drift);
      if (drift > 350) { try { l.a.stop(); } catch (e) { /* not started */ } l.a.offset = pos / 1000; l.a.play(); l.ctxTime = audioCtx.currentTime; l.offsetSec = pos / 1000; }
    }
  };
  const stopAudio = () => {
    if (audioTimer) clearInterval(audioTimer); audioTimer = null;
    for (const l of layers) { try { if (l.a.isPlaying) l.a.stop(); } catch (e) { /* not started */ } l.a.disconnect(); if (l.a.parent) l.a.parent.remove(l.a); }
    layers = []; durationMs = 0;
  };

  // ── console transport controls (networked) ────────────────────────────────
  // PERMISSION SCAFFOLD: the room's FIRST participant (the engine's
  // time-authority election — `XR.isTimeAuthority()`) is the "instance admin".
  // After that check, control currently FALLS BACK TO ALLOWED for everyone
  // (public console) — the intended future shape is world-admin → allow,
  // known-admin-missing → allow-public, i.e. graceful fallback instead of a
  // dead console. TODO(authority): change the fallback `return true` to
  // `return false` (or a world-admin check) to lock the console down.
  const canControl = () => {
    const isAdmin = !XR.isTimeAuthority || XR.isTimeAuthority();
    if (isAdmin) return true;
    return true; // TODO(authority): public fallback — tighten when world-admin auth lands
  };
  const syncedNow = () => Date.now() + offset;   // leader-frame wall clock
  const broadcastTransport = () => {
    XR.broadcast(SYNC_CHANNEL, { t: 'tp', id: clientId || 'host', playing: transport.playing, epoch: transport.epoch, mix: mixOn });
  };
  // Start every loaded stem in ONE call block with a shared 50ms lead-in →
  // every AudioBufferSourceNode gets the SAME context start time, and with
  // loop=true the Web Audio graph keeps them sample-locked through every loop
  // (the "true loop" — no cumulative falloff). alignAudio stays as the healer
  // for the one real drift source: wall-clock epoch vs audio-hardware clock
  // across CLIENTS (~worst case one ~350ms correction per hour of runtime).
  const startLayersAt = (posMs) => {
    if (!audioCtx) return;
    const lead = 0.05;
    for (const l of layers) {
      if (!l.a.buffer || l.a.isPlaying) continue;
      l.a.offset = posMs / 1000;
      l.a.play(lead);
      l.ctxTime = audioCtx.currentTime + lead; l.offsetSec = posMs / 1000;
    }
  };
  const stopLayers = () => {
    for (const l of layers) {
      try { if (l.a.isPlaying) l.a.stop(); } catch (e) { /* not started */ }
      l.a.offset = 0; l.ctxTime = 0; l.offsetSec = 0;   // rewound to 0:00, armed
    }
  };
  const applyTransport = () => {
    if (audioCtx && durationMs > 0) {
      if (transport.playing) { const pos = positionMs(durationMs); if (pos != null) startLayersAt(pos); }
      else stopLayers();
    }
    refreshConsole();
  };
  const applyMix = () => {
    for (let i = 0; i < layers.length; i++) {
      // Muted stems KEEP PLAYING at volume 0 — unmute is instant and still in
      // sync (pausing a single stem would derail it from the group).
      try { layers[i].a.setVolume(mixOn[i] === false ? 0 : VOLUME); } catch (e) { /* not ready */ }
    }
    refreshConsole();
  };
  const startShow = () => {
    if (!canControl() || transport.playing) return;
    transport.playing = true;
    // 0:00 downbeat = leader-frame NOW + the 50ms source lead-in, so the
    // initiator's actual audio start IS the epoch (not 50ms behind it).
    transport.epoch = syncedNow() + 50;
    broadcastTransport();
    startLayersAt(0);                            // the initiator starts truly on the zero
    refreshConsole();
  };
  const stopShow = () => {
    if (!canControl() || !transport.playing) return;
    transport.playing = false; transport.epoch = null;
    broadcastTransport();
    applyTransport();                            // stops + rewinds to 0:00
  };
  const toggleLayer = (i) => {
    if (!canControl()) return;
    mixOn[i] = mixOn[i] === false;               // flip (undefined counts as ON)
    broadcastTransport();
    applyMix();
  };
  // Console pads light to state: START lit while stopped ("press me"), STOP lit
  // while playing, one pad per track dim when muted.
  const refreshConsole = () => {
    if (!viz || !viz.conStart) return;
    viz.conStart.material.emissiveIntensity = transport.playing ? 0.22 : 1.6;
    viz.conStop.material.emissiveIntensity = transport.playing ? 1.6 : 0.22;
    for (let i = 0; i < viz.conToggles.length; i++) {
      viz.conToggles[i].material.emissiveIntensity = mixOn[i] === false ? 0.12 : 1.25;
    }
  };
  // "E to interact" wiring — the same InteractableSystem channel the
  // apple-trees example uses (proximity prompt + E key / mobile interact
  // button). Nearest-in-range wins, so each pad needs only its own radius.
  let consoleIds = [];
  const registerConsole = () => {
    if (!XR.registerInteractable || !viz || !viz.conStart) return;
    const mk = (id, object, prompt, onInteract) => {
      XR.registerInteractable({ id, object, radius: 2.1, prompt, onInteract });
      consoleIds.push(id);
    };
    mk(`${PLUGIN_ID}-start`, viz.conStart, 'start the show', startShow);
    mk(`${PLUGIN_ID}-stop`, viz.conStop, 'stop the show (rewind to 0:00)', stopShow);
    viz.conToggles.forEach((p, i) => mk(`${PLUGIN_ID}-mix-${i}`, p, `toggle track ${i + 1}`, () => toggleLayer(i)));
  };
  const unregisterConsole = () => {
    if (XR.unregisterInteractable) for (const id of consoleIds) XR.unregisterInteractable(id);
    consoleIds = [];
  };

  const spawnParticles = (count, burst) => {
    for (let k = 0; k < count; k++) {
      const i = viz.pCursor; viz.pCursor = (viz.pCursor + 1) % PARTICLE_POOL;
      const ang = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * STAGE_RADIUS * 0.95;     // even disc fill
      viz.pPos[i * 3] = Math.cos(ang) * r; viz.pPos[i * 3 + 1] = 0.2 + Math.random() * 0.6; viz.pPos[i * 3 + 2] = Math.sin(ang) * r;
      const up = burst ? 3.5 + Math.random() * 4.5 : 0.9 + Math.random() * 1.8;
      const swirl = 0.6 + Math.random() * 0.9;                       // tangential → rising spiral
      const outward = burst ? 0.8 : 0.2;
      viz.pVel[i * 3] = -Math.sin(ang) * swirl + Math.cos(ang) * outward;
      viz.pVel[i * 3 + 1] = up;
      viz.pVel[i * 3 + 2] = Math.cos(ang) * swirl + Math.sin(ang) * outward;
      viz.pLife[i] = 1;
    }
  };

  const spawnFog = (machineIdx) => {
    const m = viz.fogMachines[machineIdx % viz.fogMachines.length];
    const i = viz.fCursor; viz.fCursor = (viz.fCursor + 1) % FOG_POOL;
    viz.fPos[i * 3] = m.x + (Math.random() - 0.5) * 0.6;
    viz.fPos[i * 3 + 1] = 0.15 + Math.random() * 0.45;
    viz.fPos[i * 3 + 2] = m.z + (Math.random() - 0.5) * 0.6;
    const spd = 4.8 + Math.random() * 3.6;                  // jets HARD toward the +X screen → travels DEEP
    viz.fVel[i * 3] = m.dx * spd + (Math.random() - 0.5) * 2.0; // WIDE lateral spread → fills the stage, not a line
    viz.fVel[i * 3 + 1] = 0.4 + Math.random() * 0.6;        // gentle rise
    viz.fVel[i * 3 + 2] = m.dz * spd + (Math.random() - 0.5) * 2.0;
    viz.fLife[i] = 1;
    viz.fSize[i] = 2.2 + Math.random() * 2.4;               // base puff size (billows wide with age)
  };

  // tall=true → the second "tap": more particles, higher launch, slower decay →
  // a bigger, LONGER final flame.
  const spawnFire = (e, intensity, tall) => {
    const N = (tall ? 48 : 30) + Math.floor(intensity * (tall ? 60 : 40));
    for (let k = 0; k < N; k++) {
      const i = viz.fireCursor; viz.fireCursor = (viz.fireCursor + 1) % FIRE_POOL;
      viz.firePos[i * 3] = e.x + (Math.random() - 0.5) * 0.5;
      viz.firePos[i * 3 + 1] = 0.2 + Math.random() * 0.3;
      viz.firePos[i * 3 + 2] = e.z + (Math.random() - 0.5) * 0.5;
      viz.fireVel[i * 3] = (Math.random() - 0.5) * 1.6;     // tight column
      viz.fireVel[i * 3 + 1] = (tall ? 14 : 10) + Math.random() * 6 + intensity * (tall ? 9 : 7); // taller on the 2nd tap
      viz.fireVel[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      viz.fireLife[i] = 1;
      viz.fireSize[i] = (tall ? 0.65 : 0.5) + Math.random() * 0.6;
      viz.fireDecay[i] = tall ? 0.62 : 1.05;               // tall flame lingers ~1.6s vs ~0.95s
    }
  };

  // ── PERF: hand-written instance matrices ──────────────────────────────────
  // The hot loops below position thousands of instances per tick (embers + fog +
  // fire + screen particles + the 2400-piece sculpture + aura). Composing each
  // through Object3D.position/rotation/scale + updateMatrix() pays a full
  // quaternion→matrix compose per particle (~4k+/frame across the pools) — it
  // was the single hottest block in the profile. The pools only ever need
  // translate+uniform-scale or translate+yaw+scale, so we write the 16 floats
  // straight into instanceMatrix.array (three stores Matrix4 column-major).
  const writeScaleMatrix = (arr, i, x, y, z, s) => {
    const o = i * 16;
    arr[o] = s; arr[o + 1] = 0; arr[o + 2] = 0; arr[o + 3] = 0;
    arr[o + 4] = 0; arr[o + 5] = s; arr[o + 6] = 0; arr[o + 7] = 0;
    arr[o + 8] = 0; arr[o + 9] = 0; arr[o + 10] = s; arr[o + 11] = 0;
    arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1;
  };
  // Rotation about +Y (yaw) × per-axis scale — same result as
  // rotation.set(0,yaw,0); scale.set(sx,sy,sz); updateMatrix().
  const writeYawScaleMatrix = (arr, i, x, y, z, yaw, sx, sy, sz) => {
    const o = i * 16, c = Math.cos(yaw), s = Math.sin(yaw);
    arr[o] = c * sx; arr[o + 1] = 0; arr[o + 2] = -s * sx; arr[o + 3] = 0;
    arr[o + 4] = 0; arr[o + 5] = sy; arr[o + 6] = 0; arr[o + 7] = 0;
    arr[o + 8] = s * sz; arr[o + 9] = 0; arr[o + 10] = c * sz; arr[o + 11] = 0;
    arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1;
  };

  const updateVisuals = (dt, audio) => {
    if (!viz) return;
    const { level, bass, beatEnv, energy, bins } = audio;
    const mid2 = audio.mid2 || 0;
    const beat = audio.beat;
    const t = performance.now() / 1000;

    // ── ONE evolving palette ── a slow drift through a cool band (cyan→blue→
    // violet) so the whole show shares a mood that changes over minutes, not a
    // rainbow that churns every second.
    const hue = getDriftCenter() + Math.sin(t * 0.045) * THEME.driftSpread;
    const h = ((hue % 1) + 1) % 1;
    heroCol.setHSL(h, 0.85, 0.55);
    accentCol.setHSL(((h + 0.07) % 1), 0.9, 0.62);
    glowCol.setHSL(h, 0.45, 0.9);

    // ── Per-stem levels ── computed ONCE in readAudio (each analyser is read a
    // single time per tick); the screen gives each track a different parameter.
    const tr0 = audio.tr[0], tr1 = audio.tr[1], tr2 = audio.tr[2];
    const band1 = audio.bands[0], band2 = audio.bands[1], band3 = audio.bands[2];

    if (!useWebGL) {
      // WebGPU: the materials read these shared uniforms — one place to drive
      // the whole stage.
      uLevel.value = level; uBass.value = bass; uBeat.value = beatEnv; uEnergy.value = energy;
      uHero.value.copy(heroCol); uAccent.value.copy(accentCol); uGlow.value.copy(glowCol);
      uTrack0.value = tr0; uTrack1.value = tr1; uTrack2.value = tr2;
    } else {
      // WebGL: drive the GLSL floor + stock materials from the SAME signals the
      // TSL uniforms carry — this is the fallback half of the floor demo.
      if (glslFloorU) {
        glslFloorU.uTime.value = t;
        glslFloorU.uEnergy.value = energy; glslFloorU.uBass.value = bass; glslFloorU.uBeat.value = beatEnv;
        glslFloorU.uHero.value.copy(heroCol); glslFloorU.uAccent.value.copy(accentCol);
      }
      // (ring is now a per-bar spectrum driven by setColorAt below — both renderers)
      // Smooth blend hero→glow by beatEnv (NOT a >0.45 on/off threshold, which was
      // the chaotic flicker). copy() first so heroCol isn't mutated.
      viz.fanMatInfo.mat.color.copy(heroCol).lerp(glowCol, Math.min(1, beatEnv)).multiplyScalar(2.2);
      viz.fanMatInfo.mat.opacity = Math.min(1, 0.15 + energy * 0.55 + beatEnv * 0.45 + level * 0.2);
      viz.wallInfo.mat.color.copy(heroCol).multiplyScalar(1.2);
      viz.wallInfo.mat.opacity = Math.min(0.3, 0.08 + energy * 0.25);
      // Screen: blend the palette by the 3 track levels (the WebGL stand-in).
      viz.screenInfo.mat.color.copy(heroCol).lerp(accentCol, tr1).lerp(glowCol, tr2 * 0.6).multiplyScalar(0.3 + tr0 * 1.6 + energy * 0.4);
    }

    // ── EQ ring ── bar HEIGHTS from the FFT, scaled by energy so it's calm in
    // breakdowns and full on drops (no constant max-height jitter).
    const n = BAR_COUNT, hScale = 0.45 + energy * 0.7;
    for (let i = 0; i < n; i++) {
      const half = i < n / 2 ? i : n - 1 - i;
      const binIdx = bins ? Math.min(bins.length - 1, 2 + Math.floor((half / (n / 2)) * (bins.length * 0.6))) : 0;
      const lvl = bins ? (bins[binIdx] / 255) : 0;
      const target = 0.15 + lvl * 5.5 * hScale;
      viz.barH[i] += (target - viz.barH[i]) * Math.min(1, dt * (target > viz.barH[i] ? 18 : 8));
      const ang = (i / n) * Math.PI * 2;
      writeYawScaleMatrix(viz.ring.instanceMatrix.array, i,
        Math.cos(ang) * (STAGE_RADIUS + 0.4), viz.barH[i] / 2, Math.sin(ang) * (STAGE_RADIUS + 0.4),
        -ang, 1, viz.barH[i], 1);
      // Per-bar SPECTRUM colour: frequency position → palette gradient (hero→accent→
      // glow), drifting around the ring with time; brightness tracks the bar's level.
      const f = (half / (n / 2) + t * 0.04) % 1;           // freq position + slow drift
      if (f < 0.5) viz.ringCol.copy(heroCol).lerp(accentCol, f * 2);
      else viz.ringCol.copy(accentCol).lerp(glowCol, (f - 0.5) * 2);
      viz.ringCol.multiplyScalar(0.4 + lvl * 1.9 + beatEnv * 0.25);
      viz.ring.setColorAt(i, viz.ringCol);
    }
    viz.ring.instanceMatrix.needsUpdate = true;
    if (viz.ring.instanceColor) viz.ring.instanceColor.needsUpdate = true;

    // ── Fans ── each sways on its own (moving-head feel): aim wobbles + flare
    // rolls slowly, per-rig phase. Brightness/colour come from the shared
    // uniforms above, so they breathe with the energy.
    const wob = viz.wob;
    for (let i = 0; i < viz.fans.length; i++) {
      const rig = viz.fans[i]; const ph = i * 1.7;
      wob.eu.set(Math.sin(t * 0.4 + ph) * 0.08, 0, Math.cos(t * 0.31 + ph * 1.3) * 0.08);
      wob.sway.setFromEuler(wob.eu);
      wob.spin.setFromAxisAngle(wob.yAxis, t * 0.22 + ph);
      rig.quaternion.copy(wob.sway).multiply(rig.userData.baseQuat).multiply(wob.spin);
    }

    // ── Particles ── a rich, ALWAYS-present ember field: gentle ambient rise
    // that thickens with loudness, plus big bursts on every beat (scaled by
    // energy). Embers spiral up (swirl velocity) and wander via curl-style
    // drift, so the field feels alive — this is a hero element, not an accent.
    const ambient = 1 + Math.floor(level * 6 + energy * 4);
    spawnParticles(ambient, false);
    if (beat) spawnParticles(26 + Math.floor(energy * 44), true);
    viz.partMat.emissive.copy(glowCol); viz.partMat.emissiveIntensity = (1.0 + beatEnv * 1.2) * INTENSITY;
    const partArr = viz.parts.instanceMatrix.array;
    let partsDirty = false;
    for (let i = 0; i < PARTICLE_POOL; i++) {
      if (viz.pLife[i] <= 0) continue;
      partsDirty = true;
      viz.pLife[i] = Math.max(0, viz.pLife[i] - dt * 0.38);            // longer life → they float
      const px = viz.pPos[i * 3], py = viz.pPos[i * 3 + 1], pz = viz.pPos[i * 3 + 2];
      viz.pVel[i * 3 + 1] -= dt * 1.3;                                 // light gravity (embers, not rocks)
      viz.pVel[i * 3] += Math.sin(py * 0.6 + t * 1.3 + px) * dt * 0.7; // curl-style wander
      viz.pVel[i * 3 + 2] += Math.cos(py * 0.5 + t * 1.1 + pz) * dt * 0.7;
      viz.pPos[i * 3] = px + viz.pVel[i * 3] * dt; viz.pPos[i * 3 + 1] = py + viz.pVel[i * 3 + 1] * dt; viz.pPos[i * 3 + 2] = pz + viz.pVel[i * 3 + 2] * dt;
      const s = viz.pLife[i] * 0.16 + 0.03;                            // bigger, with a floor
      writeScaleMatrix(partArr, i, viz.pPos[i * 3], viz.pPos[i * 3 + 1], viz.pPos[i * 3 + 2], s);
    }
    if (partsDirty) viz.parts.instanceMatrix.needsUpdate = true;

    // ── Fog machines ── fire a haze burst on an interval, jetting from the front
    // lip inward toward the screen. Puffs drift, expand, slow and fade; billboard
    // toward the viewer so they read as volume. The beams catch the haze.
    // GATE = on/off interval (FOG_INTERVAL → on for FOG_BURST_SEC). While ON, the
    // machines only puff ON THE BEAT — a cluster per beat, scaled by track 1 + 2 —
    // so the fog pulses with the music instead of streaming continuously.
    viz.fogClock += dt;
    if (viz.fogBurst <= 0 && viz.fogClock >= FOG_INTERVAL) { viz.fogBurst = FOG_BURST_SEC; viz.fogClock = 0; }
    if (viz.fogBurst > 0) {
      viz.fogBurst -= dt;
      if (beat) {
        const drive = 0.5 + (tr1 + tr2) * 1.0;
        const puffs = Math.max(1, Math.round((1 + drive * 1.4) * viz.fogMachines.length));
        for (let k = 0; k < puffs; k++) spawnFog(Math.floor(Math.random() * viz.fogMachines.length));
      }
    }
    const ps = XR.getPlayerState && XR.getPlayerState();
    const plx = ps ? ps.x : stage.x, plz = ps ? ps.z : stage.z;
    let fogDirty = false;
    for (let i = 0; i < FOG_POOL; i++) {
      if (viz.fLife[i] <= 0) continue;
      fogDirty = true;
      viz.fLife[i] = Math.max(0, viz.fLife[i] - dt * 0.19);  // ~5.3s: time to travel DEEP + fill
      const age = 1 - viz.fLife[i];
      // light drag: the jet CARRIES deep toward the screen before settling
      const drag = Math.max(0, 1 - dt * 0.45);
      viz.fVel[i * 3] *= drag; viz.fVel[i * 3 + 2] *= drag; viz.fVel[i * 3 + 1] = viz.fVel[i * 3 + 1] * drag + dt * 0.2;
      viz.fPos[i * 3] += viz.fVel[i * 3] * dt; viz.fPos[i * 3 + 1] += viz.fVel[i * 3 + 1] * dt; viz.fPos[i * 3 + 2] += viz.fVel[i * 3 + 2] * dt;
      // Scale envelope IS the fade: grows from 0 (fades in), billows wide, shrinks
      // back to 0 at end of life (dissipates) — no per-instance alpha needed.
      const env = Math.sin(Math.min(1, age) * Math.PI);
      const sz = viz.fSize[i] * (0.7 + age * 1.6) * env;
      const wx = stage.x + viz.fPos[i * 3], wz = stage.z + viz.fPos[i * 3 + 2];
      const yaw = Math.atan2(plx - wx, plz - wz);            // billboard toward the viewer
      writeYawScaleMatrix(viz.fog.instanceMatrix.array, i,
        viz.fPos[i * 3], viz.fPos[i * 3 + 1], viz.fPos[i * 3 + 2], yaw, sz, sz, sz);
    }
    if (fogDirty) viz.fog.instanceMatrix.needsUpdate = true;

    // ── Pyrotechnics ── DOUBLE-TAP: each gerb fires a quick first burst on its
    // staggered recharge, then ~0.16s later a bigger, taller, longer second flame.
    // Size scaled by its assigned stem (track 1 / track 2).
    for (let e = 0; e < viz.fireEmitters.length; e++) {
      const em = viz.fireEmitters[e];
      em.cd -= dt;
      // pending second tap
      if (em.second > 0) {
        em.second -= dt;
        if (em.second <= 0) { spawnFire(em, em.secondLvl, true); em.second = 0; } // the long final flame
      }
      if (em.cd <= 0) {
        const lvl = Math.min(1, (em.track === 1 ? tr1 : tr2) * 1.8);
        spawnFire(em, lvl, false);                        // first tap (quick)
        em.second = 0.16; em.secondLvl = Math.min(1, lvl + 0.25); // queue the bigger 2nd tap
        em.cd = em.base + Math.random() * 3.0;            // varied recharge → never repetitive
      }
    }
    let fireDirty = false;
    for (let i = 0; i < FIRE_POOL; i++) {
      if (viz.fireLife[i] <= 0) continue;
      fireDirty = true;
      viz.fireLife[i] = Math.max(0, viz.fireLife[i] - dt * (viz.fireDecay[i] || 1.05)); // per-flame decay (tall lingers)
      const age = 1 - viz.fireLife[i];
      viz.fireVel[i * 3 + 1] -= dt * 9;                    // gravity → arcs over
      viz.firePos[i * 3] += viz.fireVel[i * 3] * dt; viz.firePos[i * 3 + 1] += viz.fireVel[i * 3 + 1] * dt; viz.firePos[i * 3 + 2] += viz.fireVel[i * 3 + 2] * dt;
      // visible from birth, grows, shrinks away at end (scale IS the fade — no instanceColor)
      const sz = viz.fireSize[i] * (0.6 + age * 0.8) * Math.min(1, viz.fireLife[i] * 3);
      const wx = stage.x + viz.firePos[i * 3], wz = stage.z + viz.firePos[i * 3 + 2];
      const yaw = Math.atan2(plx - wx, plz - wz);
      writeYawScaleMatrix(viz.fire.instanceMatrix.array, i,
        viz.firePos[i * 3], viz.firePos[i * 3 + 1], viz.firePos[i * 3 + 2], yaw, sz, sz, sz);
    }
    if (fireDirty) viz.fire.instanceMatrix.needsUpdate = true;

    // ── Backdrop towers ── glow with the energy/beat (subtle, not strobe).
    for (let i = 0; i < viz.backdrop.children.length; i++) {
      const mw = viz.backdrop.children[i];
      mw.userData.mat.emissiveIntensity = (mw.userData.baseI + energy * 0.7 + beatEnv * 0.4) * INTENSITY;
    }

    // ── EQ particles above the screen ── 3 bands (track1 low / track2,3 high)
    // bounce + brighten independently so the separation is visible.
    const bandLvl = [band1, band2, band3];
    for (let i = 0; i < SCREEN_PART_POOL; i++) {
      const band = i % 3;
      const lvl = bandLvl[band];
      const bx = viz.spBase[i * 3], by = viz.spBase[i * 3 + 1], bz = viz.spBase[i * 3 + 2];
      const py = by + lvl * 7 * (0.5 + 0.5 * Math.sin(t * 3.2 + viz.spPhase[i])); // EQ bounce
      const wx = stage.x + bx, wz = stage.z + bz;
      const yaw2 = Math.atan2(plx - wx, plz - wz);
      const sz = 0.5 + lvl * 2.4;
      writeYawScaleMatrix(viz.sParts.instanceMatrix.array, i, bx, py, bz, yaw2, sz, sz, sz);
      viz.sCol.copy(viz.bandCols[band]).multiplyScalar(0.12 + lvl * 1.7);
      viz.sParts.setColorAt(i, viz.sCol);
    }
    viz.sParts.instanceMatrix.needsUpdate = true; if (viz.sParts.instanceColor) viz.sParts.instanceColor.needsUpdate = true;

    // ── Floating sculpture ── slow tumble + breathe with energy; surface ripples
    // to the spectrum; morphs between forms every ~15–30s; brightness pulses.
    const sc = viz.sculpt;
    sc.rotation.y += dt * (0.16 + mid2 * 0.5); // spin: base + subtle track-2 mids push
    sc.rotation.x = Math.sin(t * 0.18) * 0.14;
    // Audio-reactive BREATHING, per variance group. The push target is shared,
    // but each group rises with its own attack and bleeds down with its own
    // half-life → the growth STAGGERS across the form (fast groups lead, slow
    // groups linger). This replaced a single whole-sculpture envelope whose
    // Math.max SNAPPED the scale up in one frame — with the old small gain the
    // in/out pop read as a glitch. Gain is ~2× the old margin so drops visibly
    // swell the sculpture (radial growth up to ~2.5×, capped by SCULPT_MAXSCALE).
    const sPush = Math.min(SCULPT_MAXSCALE, energy * 1.0 + beatEnv * 0.9 + bass * 0.6);
    const gEnv = viz.sculptGrpEnv, gEase = viz.sculptGrpEase, gDec = viz.sculptGrpDec;
    for (let g = 0; g < SCULPT_VAR_GROUPS; g++) {
      gEase[g] = 1 - Math.pow(0.5, dt / viz.sculptGrpAtk[g]);
      gDec[g] = Math.pow(0.5, dt / viz.sculptGrpHalf[g]);
      const e = gEnv[g];
      gEnv[g] = sPush > e ? e + (sPush - e) * gEase[g] : e * gDec[g]; // smooth rise, varied recovery
    }
    viz.sculptT += dt;
    if (!viz.sculptMorphing && viz.sculptT > viz.sculptNext) {
      viz.sculptMorphing = true; viz.sculptMorphP = 0;
      viz.sculptShapeB = (viz.sculptShape + 1) % SCULPT_GENS;
      fillSculptShape(viz.sculptBaseB, viz.sculptShapeB, SCULPT_COUNT);
    }
    let me = 0; // morph ease
    if (viz.sculptMorphing) {
      viz.sculptMorphP += dt / 2.6;
      if (viz.sculptMorphP >= 1) {
        viz.sculptMorphing = false; viz.sculptBase.set(viz.sculptBaseB);
        viz.sculptShape = viz.sculptShapeB; viz.sculptT = 0; viz.sculptNext = 15 + Math.random() * 14;
      } else { const p = viz.sculptMorphP; me = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    }
    const A = viz.sculptBase, B = viz.sculptBaseB, nb = bins ? bins.length : 0, morphing = viz.sculptMorphing;
    const pEnv = viz.sculptPEnv, pTarget = viz.sculptPTarget, pRefr = viz.sculptPRefr, pDelay = viz.sculptPDelay, pHalf = viz.sculptPHalf;
    const grp = viz.sculptGrp;                                 // per-particle variance group (ease + breathing)
    const sculptArr = sc.instanceMatrix.array;
    for (let i = 0; i < SCULPT_COUNT; i++) {
      const o = i * 3;
      let bx = A[o], by = A[o + 1], bz = A[o + 2];
      if (morphing) { bx += (B[o] - bx) * me; by += (B[o + 1] - by) * me; bz += (B[o + 2] - bz) * me; }
      const amp = nb ? (bins[2 + (i % (nb - 3))] / 255) : 0;  // map particle → spectrum bin
      // TRIGGERED + ADDITIVE: only a band ABOVE the threshold fires (below = nothing,
      // so no jitter). Each trigger ADDS a kick to the target (stacks toward the max),
      // spaced by this particle's refractory. The target bleeds down over its long
      // half-life; the rendered value eases toward it → smooth, wide-range motion.
      let tgt = pTarget[i];
      pRefr[i] -= dt;
      if (amp > SCULPT_TRIG && pRefr[i] <= 0) { tgt = Math.min(SCULPT_RIPPLE, tgt + SCULPT_KICK); pRefr[i] = pDelay[i]; }
      tgt *= Math.pow(0.5, dt / pHalf[i]);
      pTarget[i] = tgt;
      const g = grp[i];
      let pe = pEnv[i]; pe += (tgt - pe) * gEase[g]; pEnv[i] = pe; // group-rate chase → offset recoveries
      const bEnv = gEnv[g];                                    // this particle's breathing envelope
      const f = SCULPT_RADIUS * (1 + pe) * (1 + bEnv);         // ripple + staggered whole-form growth
      writeScaleMatrix(sculptArr, i, bx * f, by * f, bz * f, SCULPT_PSIZE * (1 + bEnv * 0.6));
    }
    sc.instanceMatrix.needsUpdate = true;
    const sb = Math.min(1.7, 0.55 + energy * 0.7 + beatEnv * 0.5 + level * 0.3); // brightness pulse (tints instanceColor)
    viz.sculptCol.setRGB(sb, sb, sb); sc.material.color.copy(viz.sculptCol);

    // ── AVATAR AURA ── every avatar inside the stage disc gets a sparkle
    // formation (helix / seed-spiral / rose-ring — see the AURA consts) that
    // TRAILS its movement: each sparkle keeps a persistent position and chases
    // its formation anchor with a per-sparkle lag, so walking smears the whole
    // formation into a comet tail and pattern changes morph instead of snapping.
    // Slots are keyed by avatar id (Map), so a peer joining/leaving never makes
    // another avatar's trail jump. Local player first (getPlayerState), remote
    // peers via XRPublisher.getPeers() — feature-detected so the plugin still
    // runs on engines that predate the hook (local aura only).
    const aura = viz.aura, auraArr = aura.instanceMatrix.array, auraPos = viz.auraPos;
    const GA = Math.PI * (3 - Math.sqrt(5));                   // golden angle (matches fillSculptShape)
    // Per-sparkle chase ease, refreshed once per tick (dt varies with LOD tier).
    for (let k = 0; k < AURA_PER; k++) {
      const lag = AURA_DRAG_MIN + viz.auraSeed[k] * (AURA_DRAG_MAX - AURA_DRAG_MIN);
      viz.auraEase[k] = 1 - Math.pow(0.5, dt / lag);
    }
    // Roster: who is on the stage this tick?
    const assign = viz.auraAssign, owner = viz.auraSlotOwner, used = viz.auraUsed;
    used.fill(0);
    const present = [];
    if (ps && Math.hypot(plx - stage.x, plz - stage.z) < AURA_ZONE) {
      viz.auraLocal.x = plx; viz.auraLocal.y = ps.y; viz.auraLocal.z = plz;
      present.push(viz.auraLocal);
    }
    if (XR.getPeers) {
      const room = XR.getPeers();
      for (let i = 0; i < room.length; i++) {
        const p = room[i];
        if (Math.hypot(p.x - stage.x, p.z - stage.z) < AURA_ZONE) present.push(p);
      }
    }
    // Keep existing slots, then free the ones whose avatar left the disc.
    for (let i = 0; i < present.length; i++) {
      const s = assign.get(present[i].id);
      if (s != null) used[s] = 1;
    }
    let parkedAny = false;
    for (let s = 0; s < AURA_SLOTS; s++) {
      if (owner[s] != null && !used[s]) {
        assign.delete(owner[s]); owner[s] = null; viz.auraInit[s] = 0; parkedAny = true;
        const base = s * AURA_PER;
        for (let k = 0; k < AURA_PER; k++) writeScaleMatrix(auraArr, base + k, 0, -999, 0, 0.0001);
      }
    }
    // Give newcomers a free slot (roster order; local player was pushed first).
    for (let i = 0; i < present.length; i++) {
      if (assign.has(present[i].id)) continue;
      let free = -1;
      for (let s = 0; s < AURA_SLOTS; s++) if (owner[s] == null) { free = s; break; }
      if (free < 0) break;
      owner[free] = present[i].id; assign.set(present[i].id, free); used[free] = 1;
    }
    const patPhase = Math.floor(t / AURA_PATTERN_CYCLE);       // slow global pattern advance
    let activeSlots = 0;
    for (let i = 0; i < present.length; i++) {
      const a = present[i];
      const slot = assign.get(a.id);
      if (slot == null) continue;
      activeSlots++;
      const lx = a.x - stage.x, ly = a.y - stage.y, lz = a.z - stage.z;
      const baseY = ly - 0.85;                                 // ≈ feet
      // Per-slot palette colour (hero/accent/glow cycle) → a crowd shimmers in
      // the show's own hues instead of N identical halos.
      const scol = slot % 3 === 0 ? heroCol : slot % 3 === 1 ? accentCol : glowCol;
      const pat = (slot + patPhase) % AURA_PATTERNS;           // per-avatar, slowly advancing
      const base = slot * AURA_PER;
      const snap = !viz.auraInit[slot]; viz.auraInit[slot] = 1;
      for (let k = 0; k < AURA_PER; k++) {
        const sd2 = viz.auraSeed[k];
        let tx, ty, tz, env;
        if (pat === 1) {
          // SEED SPIRAL — golden-angle phyllotaxis, the sculpture's SEED-DOME
          // spiral swept upward: sqrt-radius spacing + k·GA angle is exactly
          // the sunflower layout fillSculptShape uses for shape 4.
          const frac = (t * (0.10 + sd2 * 0.06) + k / AURA_PER) % 1;
          const ang = k * GA + t * 0.6;
          const rad = Math.sqrt(frac) * 1.05;                  // opens like the seed dome
          tx = lx + Math.cos(ang) * rad; ty = baseY + frac * AURA_HEIGHT; tz = lz + Math.sin(ang) * rad;
          env = Math.sin(frac * Math.PI);
        } else if (pat === 2) {
          // ROSE RING — the rose-torus state's 5-petal radius modulation as a
          // chest-height orbit with a gentle petal bob.
          const a2 = (k / AURA_PER) * Math.PI * 2 + t * 0.9;
          const R = 0.55 + 0.3 * Math.cos(5 * a2 - t * 1.3);
          tx = lx + Math.cos(a2) * R; tz = lz + Math.sin(a2) * R;
          ty = baseY + 1.15 + Math.sin(a2 * 2 + t * 1.6) * 0.3;
          env = 0.75 + 0.25 * Math.sin(sd2 * 7 + t * 2);
        } else {
          // HELIX — rising orbit (the original formation).
          const frac = (t * (0.14 + sd2 * 0.1) + k / AURA_PER) % 1;
          const ang = sd2 * Math.PI * 2 + t * (0.8 + sd2 * 0.9) + frac * 2.6;
          const rad = 0.5 + 0.3 * Math.sin(sd2 * 9 + t * 0.9) + frac * 0.25;
          tx = lx + Math.cos(ang) * rad; ty = baseY + frac * AURA_HEIGHT; tz = lz + Math.sin(ang) * rad;
          env = Math.sin(frac * Math.PI);
        }
        const o = (base + k) * 3;
        // Drag-chase toward the anchor; SNAP while invisible (new slot, or a
        // rise-cycle wrap where env≈0) so trails never streak through the body.
        if (snap || env < 0.06) {
          auraPos[o] = tx; auraPos[o + 1] = ty; auraPos[o + 2] = tz;
        } else {
          const e = viz.auraEase[k];
          auraPos[o] += (tx - auraPos[o]) * e;
          auraPos[o + 1] += (ty - auraPos[o + 1]) * e;
          auraPos[o + 2] += (tz - auraPos[o + 2]) * e;
        }
        const s = (0.028 + sd2 * 0.05) * env * (1 + beatEnv * 0.9);
        writeScaleMatrix(auraArr, base + k, auraPos[o], auraPos[o + 1], auraPos[o + 2], s);
        viz.auraCol.copy(scol).multiplyScalar(0.8 + sd2 * 0.8 + beatEnv * 0.6);
        aura.setColorAt(base + k, viz.auraCol);
      }
    }
    if (activeSlots > 0 || parkedAny) {
      aura.instanceMatrix.needsUpdate = true;
      if (aura.instanceColor) aura.instanceColor.needsUpdate = true;
    }
  };

  // ── activation lifecycle ──────────────────────────────────────────────────
  let active = false, hazeId = null;
  let platform = null, platformId = null, placeTimer = null, placed = false;
  // The collidable platform is placed only once a real ground height is known
  // (getGroundHeight needs a terrain collider near the centre — which loads when
  // the player teleports/walks in). Until then the visuals float at the resolved
  // height; once placed, everything is locked to the surface (no per-frame drift).
  const placePlatform = () => {
    const y = XR.getGroundHeight ? XR.getGroundHeight(stage.x, stage.z) : null;
    if (typeof y !== 'number') return; // not loaded yet — keep polling
    placed = true;
    if (placeTimer) { clearInterval(placeTimer); placeTimer = null; }
    stage.y = y;
    if (viz) viz.g.position.set(stage.x, y, stage.z);
    platform = buildPlatform();
    platformId = XR.addSolid ? XR.addSolid({ id: `${PLUGIN_ID}-platform`, object: platform.mesh, position: [stage.x, y, stage.z], colliders: 'hull' }) : null;
  };

  const activate = () => {
    if (active) return; active = true; placed = false;
    startSync();
    viz = buildStage();
    startAudio();
    registerConsole();
    refreshConsole();
    // Bloom is a desktop-only WebGPU extra pass; on touch devices it corrupts the
    // render (buildings/avatar/stage vanish). Skip it there — the emissive stage
    // still renders, just without the glow.
    if (!IS_TOUCH) { try { XR.setPostProcessing({ bloom: { strength: 0.5, threshold: 0.8 }, audioReactive: true }); } catch (e) { console.warn('[resonance-stage] post-FX unavailable', e); } }
    // Lighting occlusion (beam-vs-solid masking) is a DESKTOP-only luxury: on touch
    // devices it corrupts the render (un-bundles terrain + a float-target pass that
    // mobile GPUs can't do) → no avatar/stage. Never enable it on touch. Beams
    // still render there, just without the occlusion mask.
    if (!IS_TOUCH) { try { XR.setLightingOcclusion && XR.setLightingOcclusion(true); } catch (e) { /* optional */ } }
    // NOTE: no time-of-day change here. Time is a room-shared linear timeline —
    // flipping it on proximity made a per-client night bubble (dark ground near
    // the stage, noon outside, every peer different). Night is now the explicit,
    // NETWORK-SYNCED "Night show" menu action registered in resolvePlacement().
    if (HAZE > 0 && XR.addCloudRegion) hazeId = XR.addCloudRegion({ id: 'resonance-stage-haze', center: [stage.x, stage.z], radius: RADIUS * 0.7, falloff: 0.5, density: HAZE * 0.6, coverage: HAZE, color: [0.5, 0.52, 0.62] });
    placePlatform();                          // try now (if ground already loaded)
    if (!placed) placeTimer = setInterval(placePlatform, 250); // else poll until it is
    console.log(`[${PLUGIN_ID}] show started (${useWebGL ? 'WebGL' : 'WebGPU+TSL+bloom'})`);
  };
  const deactivate = () => {
    if (!active) return; active = false;
    if (placeTimer) { clearInterval(placeTimer); placeTimer = null; }
    if (platformId && XR.removeSolid) XR.removeSolid(platformId);
    if (platform) { platform.geo.dispose(); platform.mat.dispose(); platform = null; }
    platformId = null; placed = false;
    try { XR.clearPostProcessing && XR.clearPostProcessing(); } catch (e) { /* ignore */ }
    try { XR.setLightingOcclusion && XR.setLightingOcclusion(false); } catch (e) { /* ignore */ }
    // Deliberately NOT restoring time — the room's timeline is linear and shared;
    // yanking it back to noon because one player walked away was the old bug.
    if (hazeId && XR.removeCloudRegion) { XR.removeCloudRegion(hazeId); hazeId = null; }
    unregisterConsole();
    stopAudio(); stopSync(); disposeStage();
    console.log(`[${PLUGIN_ID}] show ended`);
  };

  // ── placement (TOWN CENTRE) + main loop ────────────────────────────────────
  const groundY = (x, z) => { const y = XR.getGroundHeight ? XR.getGroundHeight(x, z) : null; return (typeof y === 'number') ? y : stage.y; };
  let placeTries = 0, enabledRoads = false;
  const resolvePlacement = async () => {
    if (PLACE) { stage.x = PLACE.x; stage.z = PLACE.z; }
    else if (XR.getWorldTowns) {
      placeTries++;
      const ps = XR.getPlayerState && XR.getPlayerState(); const cx = ps ? ps.x : 0, cz = ps ? ps.z : 0;
      const towns = await XR.getWorldTowns({ minX: cx - 4000, minZ: cz - 4000, maxX: cx + 4000, maxZ: cz + 4000 });
      if (!towns || !towns.length) {
        // No town network yet. Give an existing town plugin a few seconds to
        // come up; if there's still none, enable the deterministic town/road
        // network ourselves so there's a centre to host the venue.
        if (!enabledRoads && placeTries >= 5 && XR.configureWorldRoads) { XR.configureWorldRoads(true); enabledRoads = true; }
        return false;
      }
      let best = towns[0], bd = Infinity; for (const tt of towns) { const d = (tt.x - cx) ** 2 + (tt.z - cz) ** 2; if (d < bd) { bd = d; best = tt; } }
      stage.x = best.x; stage.z = best.z;
    } else return false;
    stage.y = groundY(stage.x, stage.z); stage.resolved = true;
    if (XR.registerMenuItem) {
      XR.registerMenuItem({ id: `song-${PLUGIN_ID}`, label: `♪ ${TITLE}`, icon: '🎵', order: 5, onSelect: () => XR.teleportPlayer && XR.teleportPlayer(stage.x, undefined, stage.z) });
      // ROOM-SYNCED night toggle. setTimeOfDay(h, false) = JUMP the shared clock,
      // keep it running (linear) — the engine broadcasts it to every participant
      // and the room's time authority (first participant) anchors it from there.
      // Anyone can press it; gate on XR.isTimeAuthority() instead if you want it
      // admin-only: `onSelect: () => XR.isTimeAuthority() && XR.setTimeOfDay(...)`.
      if (XR.setTimeOfDay) {
        XR.registerMenuItem({
          id: `night-${PLUGIN_ID}`, label: 'Night show (whole room)', icon: '🌙', order: 6,
          onSelect: () => {
            const tod = XR.getTimeOfDay ? XR.getTimeOfDay().time : 12;
            const isNight = tod >= 20 || tod < 5.5;
            XR.setTimeOfDay(isNight ? DAY_RESTORE_HOUR : NIGHT_SHOW_HOUR, false);
          },
        });
      }
    }
    return true;
  };

  let lastT = performance.now();
  let visAccum = 0, rangeAccum = 1, stageDist = Infinity;
  const loop = () => {
    const now = performance.now(); const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    requestAnimationFrame(loop);

    // Tab backgrounded → no visual work, no FFT (the rAF is already paused, but be safe).
    if (typeof document !== 'undefined' && document.hidden) return;
    if (!stage.resolved) return;

    // Range check (activate/deactivate) only needs ~8Hz — not every frame.
    rangeAccum += dt;
    if (rangeAccum >= 0.12) {
      rangeAccum = 0;
      const ps = XR.getPlayerState && XR.getPlayerState(); const px = ps ? ps.x : 0, pz = ps ? ps.z : 0;
      stageDist = Math.hypot(px - stage.x, pz - stage.z);
      const inRange = stageDist < RADIUS;
      if (inRange && !active) activate(); else if (!inRange && active) deactivate();
    }
    if (!active || !viz) return;

    // THERMAL CAP + DISTANCE LOD: the heavy per-frame work (instanced buffer
    // uploads + FFT) runs at 60Hz only when you're actually AT the show (<70u).
    // Walking the outer zone you can't tell 30Hz embers from 60Hz ones, and at
    // the activation fringe 20Hz is plenty — that's most of the thermal win when
    // the venue is merely "in view". The engine-idle flag (camera still) also
    // halves cadence, and dt is accumulated so motion speed never changes.
    const idle = (typeof window !== 'undefined') && window.__xrIdle;
    const lodDt = stageDist < 70 ? (1 / 60) : stageDist < 150 ? (1 / 30) : (1 / 20);
    const targetDt = Math.max(idle ? (1 / 30) : (1 / 60), lodDt);
    visAccum += dt;
    if (visAccum >= targetDt - 0.001) {
      updateVisuals(Math.min(0.05, visAccum), readAudio()); // accumulated dt → motion stays correct
      visAccum = 0;
    }
  };

  const init = async () => {
    await waitForRuntime();
    XR = window.XRPublisher; THREE = window.THREE; TSL = XR.tsl; WEBGPU = XR.webgpu;
    if (!XR || !THREE || typeof XR.setPostProcessing !== 'function') { console.error(`[${PLUGIN_ID}] runtime too old (needs setPostProcessing + XRPublisher.webgpu)`); return; }
    heroCol = new THREE.Color(PALETTE[0]); accentCol = new THREE.Color(PALETTE[1]); glowCol = new THREE.Color(PALETTE[2]);
    let tries = 0;
    while (!(scene = XR.getScene && XR.getScene()) && tries++ < 200) { await new Promise((r) => setTimeout(r, 100)); }
    if (!scene) { console.error(`[${PLUGIN_ID}] no scene`); return; }
    // Detect the ACTUAL renderer — `XR.webgpu` is just the node-material classes
    // (always present). The engine creates the renderer during canvas mount; on
    // WebGPU that's ASYNC, so detecting at init() raced ahead of it and mis-flagged
    // WebGPU as WebGL. Wait for the renderer's type flag now that the scene exists.
    for (let i = 0; i < 80 && typeof window.__xrWebGPU !== 'boolean'; i++) await new Promise((r) => setTimeout(r, 50));
    const _param = new URLSearchParams(window.location.search).get('renderer');
    const _engineWebGPU = (typeof XR.isWebGPU === 'function') ? XR.isWebGPU()
      : (typeof window.__xrWebGPU === 'boolean' ? window.__xrWebGPU : !!navigator.gpu);
    useWebGL = !WEBGPU || _param === 'webgl' || !_engineWebGPU;
    console.log(`[${PLUGIN_ID}] build 2026-07-01c (center console transport + tighter aura drag) · renderer=${useWebGL ? 'WebGL' : 'WebGPU'} (__xrWebGPU=${window.__xrWebGPU})`);
    if (!useWebGL && TSL) {
      uLevel = TSL.uniform(0); uBass = TSL.uniform(0); uBeat = TSL.uniform(0); uEnergy = TSL.uniform(0);
      uHero = TSL.uniform(heroCol.clone()); uAccent = TSL.uniform(accentCol.clone()); uGlow = TSL.uniform(glowCol.clone());
      uTrack0 = TSL.uniform(0); uTrack1 = TSL.uniform(0); uTrack2 = TSL.uniform(0);
    }
    for (let i = 0; i < 60 && !stage.resolved; i++) { if (await resolvePlacement()) break; await new Promise((r) => setTimeout(r, 1000)); }
    requestAnimationFrame(loop);
    console.log(`[${PLUGIN_ID}] ready at (${stage.x.toFixed(0)}, ${stage.z.toFixed(0)})`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init, 300);
  else window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
})();
}
