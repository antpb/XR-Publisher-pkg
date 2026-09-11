/**
 * multiplayer-demo — XR Publisher plugin (THE MULTIPLAYER API TOUR)
 *
 * A small, readable reference plugin that exercises every multiplayer hook the
 * engine exposes, so you can copy the exact pattern you need:
 *
 *   • XRPublisher.onPeerJoin(cb) / onPeerLeave(cb)
 *       → join/leave TOASTS in a HUD corner. No more hand-rolled "last heard
 *         from" liveness windows — the engine tells you.
 *   • XRPublisher.getPeers() + getPeerAudioLevel(id)
 *       → SPEAKING INDICATOR rings that float above whoever is talking.
 *         getPeerAudioLevel is the pre-falloff voice RMS (0..1), so it works
 *         even for peers you can barely hear.
 *   • XRPublisher.broadcast(channel, data) / onMessage(channel, cb) / getClientId()
 *       → a PING flare: fire a beacon column at your avatar that every other
 *         player sees at YOUR position (correlating a message's peerId with
 *         getPeers() positions).
 *   • XRPublisher.setLocalVoiceGlobal(on) + setPeerVoiceOverride(id, {global})
 *       → the MEGAPHONE: voice is proximity-faded by default (fades from 25%
 *         of the terrain-cell radius, silent at the cell radius, and the
 *         engine stops SENDING your mic to out-of-range peers). A megaphone
 *         must therefore do TWO things: un-gate its own sends
 *         (setLocalVoiceGlobal) and tell every listener to boost the speaker
 *         (broadcast → setPeerVoiceOverride). State is re-asserted every few
 *         seconds so LATE JOINERS hear the announcer too — the same
 *         keyframe-style self-heal resonance-plaza uses for transport sync.
 *   • XRPublisher.getProximityVoiceConfig()
 *       → the HUD shows the world's resolved voice range so you can see what
 *         the engine derived from the terrain cell size.
 *
 * Voice data NEVER crosses the plugin — the engine owns mic streams; plugins
 * only steer ranges/overrides and read levels. Custom channels here use plain
 * names ('mpdemo-*'); the '__xrp:*' prefix is reserved for the engine.
 *
 * Try it: open examples/networking.html in 2-3 windows, join voice in each,
 * walk apart until voices fade, then hit 📣 Megaphone in the More menu.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'multiplayer-demo';
  const CH_MEGAPHONE = 'mpdemo-megaphone';   // {on: boolean} — re-asserted while on
  const CH_PING = 'mpdemo-ping';             // {} — beacon at the sender's avatar
  const MEGAPHONE_REASSERT_MS = 4000;        // keyframe cadence for late joiners
  const TOAST_MS = 4000;

  const waitForRuntime = () => new Promise((resolve) => {
    const ok = () => window.XRPublisher && window.THREE &&
      typeof window.XRPublisher.onPeerJoin === 'function' &&
      typeof window.XRPublisher.getPeerAudioLevel === 'function';
    if (ok()) { resolve(); return; }
    let n = 0; const iv = setInterval(() => { if (ok() || n++ > 400) { clearInterval(iv); resolve(); } }, 50);
  });

  waitForRuntime().then(() => {
    const XRP = window.XRPublisher;
    const THREE = window.THREE;
    if (!XRP || !THREE || typeof XRP.onPeerJoin !== 'function') {
      console.warn(`[${PLUGIN_ID}] runtime missing multiplayer APIs — skipping`);
      return;
    }

    /* ── HUD: voice-range readout + join/leave toasts ──────────────────────
     * registerHud gives a plugin-owned DOM node in a corner slot; we update
     * it imperatively. Flatscreen-only by design (VR users get in-world UI). */
    const hud = document.createElement('div');
    hud.style.cssText =
      'pointer-events:none;display:flex;flex-direction:column;gap:6px;align-items:flex-end;' +
      'font:12px system-ui,sans-serif;color:#f5f5f7;text-shadow:0 1px 2px rgba(0,0,0,.6)';
    const rangeLine = document.createElement('div');
    rangeLine.style.cssText = 'opacity:.75';
    hud.appendChild(rangeLine);
    XRP.registerHud(`${PLUGIN_ID}-hud`, hud, 'top-right');

    const refreshRangeLine = () => {
      const cfg = XRP.getProximityVoiceConfig();
      rangeLine.textContent = cfg.enabled
        ? `🔊 voice fades ${Math.round(cfg.resolvedFadeStart)}u → silent ${Math.round(cfg.resolvedMaxDistance)}u`
        : '🔊 proximity voice off (global)';
    };
    refreshRangeLine();
    setInterval(refreshRangeLine, 5000); // cell size can arrive after load

    const toast = (text) => {
      const el = document.createElement('div');
      el.textContent = text;
      el.style.cssText =
        'background:rgba(15,15,20,.82);border:1px solid rgba(255,255,255,.18);' +
        'border-radius:8px;padding:6px 10px;backdrop-filter:blur(8px)';
      hud.appendChild(el);
      setTimeout(() => el.remove(), TOAST_MS);
    };

    // Engine-fired join/leave — ids match getPeers()/onMessage peerIds.
    XRP.onPeerJoin((id) => toast(`👋 ${id.slice(0, 6)} joined`));
    XRP.onPeerLeave((id) => {
      toast(`💨 ${id.slice(0, 6)} left`);
      megaphones.delete(id); // a leaving announcer needs no override cleanup — engine clears it
    });

    /* ── Speaking indicators ───────────────────────────────────────────────
     * One small unlit ring per peer, shown above their head while their voice
     * level is above a threshold. Meshes are pooled in a Map keyed by peer id;
     * stock MeshBasicMaterial renders on both the WebGPU and WebGL paths. */
    const rings = new Map(); // peerId -> { mesh, level }
    const ringGeo = new THREE.TorusGeometry(0.32, 0.045, 10, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x39d98a, transparent: true, opacity: 0.9 });

    const ringFor = (id) => {
      let r = rings.get(id);
      if (!r) {
        const mesh = new THREE.Mesh(ringGeo, ringMat.clone());
        mesh.rotation.x = Math.PI / 2; // flat halo
        mesh.visible = false;
        r = { mesh, level: 0 };
        rings.set(id, r);
        const scene = XRP.getScene();
        if (scene) scene.add(mesh);
      }
      return r;
    };

    const dropRing = (id) => {
      const r = rings.get(id);
      if (r) { r.mesh.removeFromParent(); r.mesh.material.dispose(); rings.delete(id); }
    };
    XRP.onPeerLeave(dropRing);

    /* ── Ping flare ────────────────────────────────────────────────────────
     * broadcast/onMessage carry only tiny JSON; the RECEIVER looks the sender
     * up in getPeers() to place the beacon — never send world positions you
     * can already derive. */
    const flares = []; // { mesh, born }
    const flareGeo = new THREE.CylinderGeometry(0.25, 0.55, 14, 12, 1, true);

    const spawnFlare = (x, y, z, color) => {
      const scene = XRP.getScene();
      if (!scene) return;
      const mesh = new THREE.Mesh(
        flareGeo,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
      );
      mesh.position.set(x, y + 7, z);
      scene.add(mesh);
      flares.push({ mesh, born: performance.now() });
    };

    XRP.onMessage(CH_PING, (peerId) => {
      const peer = XRP.getPeers().find((p) => p.id === peerId);
      if (peer) spawnFlare(peer.x, peer.y, peer.z, 0xffd23c);
      toast(`📍 ${peerId.slice(0, 6)} pinged`);
    });

    /* ── Megaphone ─────────────────────────────────────────────────────────
     * Local side: stop distance-gating our own mic sends. Remote side: every
     * listener overrides the announcer to full volume. Re-assert while on so
     * late joiners converge; explicit {on:false} clears immediately. */
    let megaphoneOn = false;
    let reassertTimer = null;
    const megaphones = new Set(); // remote peers currently announcing

    XRP.onMessage(CH_MEGAPHONE, (peerId, data) => {
      const on = !!(data && data.on);
      if (on && !megaphones.has(peerId)) {
        megaphones.add(peerId);
        XRP.setPeerVoiceOverride(peerId, { global: true });
        toast(`📣 ${peerId.slice(0, 6)} is on the megaphone`);
      } else if (!on && megaphones.has(peerId)) {
        megaphones.delete(peerId);
        XRP.setPeerVoiceOverride(peerId, null);
      }
    });

    const setMegaphone = (on) => {
      megaphoneOn = on;
      XRP.setLocalVoiceGlobal(on);
      XRP.broadcast(CH_MEGAPHONE, { on });
      clearInterval(reassertTimer);
      if (on) reassertTimer = setInterval(() => XRP.broadcast(CH_MEGAPHONE, { on: true }), MEGAPHONE_REASSERT_MS);
      toast(on ? '📣 Megaphone ON — everyone hears you' : '📣 Megaphone off');
    };

    XRP.registerMenuItem({
      id: `${PLUGIN_ID}-megaphone`,
      label: 'Megaphone',
      icon: '📣',
      order: 40,
      onSelect: () => setMegaphone(!megaphoneOn),
    });

    XRP.registerMenuItem({
      id: `${PLUGIN_ID}-ping`,
      label: 'Ping my location',
      icon: '📍',
      order: 41,
      onSelect: () => {
        XRP.broadcast(CH_PING, {});
        const me = XRP.getPlayerState();
        if (me) spawnFlare(me.x, me.y, me.z, 0x7fd4ff); // local echo — broadcast excludes self
      },
    });

    /* ── Per-frame update (one rAF for everything) ─────────────────────────
     * Speaking levels are smoothed toward the analyser reading so rings ease
     * in/out instead of flickering with speech gaps. */
    // PACING: speaking rings and flares are cosmetic, so the peer sweep runs
    // at ~20Hz rather than every frame. Measured before this: 1.09ms EVERY
    // frame (9% of the whole main thread) versus ~0.02ms for every other demo
    // plugin — per-peer work in a raw rAF loop is the most expensive thing a
    // plugin can do, and it scales with the room. The engine also caches
    // getPeerAudioLevel at 20Hz now, so a faster loop would re-read the same
    // value anyway.
    const SWEEP_MS = 50;
    let lastSweep = 0;
    const tick = () => {
      const nowSweep = performance.now();
      if (nowSweep - lastSweep < SWEEP_MS) { requestAnimationFrame(tick); return; }
      lastSweep = nowSweep;
      const peers = XRP.getPeers();
      for (const p of peers) {
        const r = ringFor(p.id);
        const raw = XRP.getPeerAudioLevel(p.id);
        r.level += (raw - r.level) * 0.25;
        const speaking = r.level > 0.05;
        r.mesh.visible = speaking;
        if (speaking) {
          r.mesh.position.set(p.x, p.y + 2.25, p.z);
          const s = 1 + Math.min(1, r.level * 2) * 0.5;
          r.mesh.scale.setScalar(s);
          r.mesh.material.opacity = 0.35 + Math.min(0.55, r.level * 1.6);
        }
      }
      // Rings for peers that vanished without a peerclose (rare) fade away via onPeerLeave.

      const now = performance.now();
      for (let i = flares.length - 1; i >= 0; i--) {
        const f = flares[i];
        const age = (now - f.born) / 2500; // 2.5s life
        if (age >= 1) {
          f.mesh.removeFromParent(); f.mesh.material.dispose();
          flares.splice(i, 1);
        } else {
          f.mesh.material.opacity = 0.75 * (1 - age);
          f.mesh.scale.set(1 + age * 0.6, 1, 1 + age * 0.6);
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    console.log(`[${PLUGIN_ID}] ready — join/leave toasts, speaking rings, ping flares, megaphone`);
  });
})();
}
