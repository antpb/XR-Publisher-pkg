/**
 * weather-zones — XR Publisher weather plugin
 *
 * Demonstrates the engine's region-based CLOUD/weather API:
 *   - XRPublisher.addCloudRegion({...})  → paint world-space weather zones
 *     (dense dark-grey storms vs sparse fair sky), seed-deterministic.
 *   - XRPublisher.getWeatherAt(x, z)     → query the blended weather (+ time/
 *     phase) at any point. Core does NOT render rain — this plugin renders its
 *     own THREE.Points rain by polling the query around the player.
 *     The query's `phase` field is also what gates the day/night logic here (a
 *     dusk-only storm is added/removed as the clock crosses into evening) — no
 *     separate getTimeOfDay() poll needed, the weather query already carries it.
 *   - XRPublisher.getScene() / getPlayerState() → mount world-space FX. An
 *     ambient rain volume follows the camera; sparse drips shed off the PLAYER,
 *     gated like swimming on { sheltered, isSwimming, isFlying } so they stop
 *     under a roof / indoors. (Camera + listener aren't in the scene graph, so
 *     getScene() is required for anything that must render.)
 *
 * Zones are placed with XRPublisher.utils.alea(seed) so the same world always
 * has the same weather. Deploy: copy into api `plugins/`, run
 * `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'weather-zones';
  let started = false;

  const waitFor = (pred) => new Promise((resolve) => {
    if (pred()) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if (pred() || tries++ > 400) { clearInterval(iv); resolve(); }
    }, 50);
  });

  const fmtTime = (t) => {
    const h = Math.floor(t) % 24;
    const m = Math.floor((t - Math.floor(t)) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const init = async () => {
    if (started) return;
    started = true;

    await waitFor(() => window.XRPublisher && window.THREE);
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || !THREE) { console.error(`[${PLUGIN_ID}] runtime missing`); return; }

    // Seed-deterministic zone placement — wait for the world seed to publish.
    await waitFor(() => !!XRPublisher.getWorldSeed());
    const seed = XRPublisher.getWorldSeed() || 'default';
    const rng = XRPublisher.utils.alea(`${seed}-weather`);

    // Helper: a zone at a seed-stable polar offset from the origin.
    const polarZone = (minDist, maxDist, cfg) => {
      const a = rng() * Math.PI * 2;
      const d = minDist + rng() * (maxDist - minDist);
      return { center: [Math.cos(a) * d, Math.sin(a) * d], ...cfg };
    };

    // ── Permanent zones (seed-stable) ───────────────────────────────────────
    // A heavy dark-grey storm reasonably near spawn so it's easy to find.
    XRPublisher.addCloudRegion(polarZone(450, 850, {
      id: 'wz-storm', radius: 420, falloff: 0.55,
      density: 0.98, coverage: 0.92, scale: 1.35,
      color: [0.34, 0.36, 0.40], rain: 0.85,
    }));
    // A broad grey overcast deck with light drizzle.
    XRPublisher.addCloudRegion(polarZone(900, 1500, {
      id: 'wz-overcast', radius: 520, falloff: 0.5,
      density: 0.82, coverage: 0.7, scale: 1.1,
      color: [0.62, 0.64, 0.68], rain: 0.3,
    }));
    // A bright, sparse "clearing" — thin white puffs (shows the low end).
    XRPublisher.addCloudRegion(polarZone(900, 1500, {
      id: 'wz-clear', radius: 430, falloff: 0.6,
      density: 0.22, coverage: 0.12, scale: 0.95,
      color: [1.0, 1.0, 1.0], rain: 0.0,
    }));

    // A DUSK-ONLY storm — added/removed as the clock crosses into evening,
    // proving plugins can branch weather on the day/night cycle.
    const duskStorm = polarZone(500, 1100, {
      id: 'wz-dusk-storm', radius: 460, falloff: 0.5,
      density: 1.0, coverage: 0.95, scale: 1.4,
      color: [0.28, 0.29, 0.34], rain: 0.95,
    });
    let duskStormOn = false;
    const isDuskish = (phase) => phase === 'evening' || phase === 'dusk' || phase === 'night';

    // ── Rain: an InstancedMesh of streaks mounted in the SCENE, moved to the
    // player each frame, driven by getWeatherAt. (NOT parented to the camera/
    // listener — those aren't in the scene graph, so they don't render. And
    // PointsMaterial doesn't render under WebGPU; MeshBasicMaterial does on both.)
    await waitFor(() => !!XRPublisher.getAudioListener() && !!XRPublisher.getScene());
    const listener = XRPublisher.getAudioListener();
    const scene = XRPublisher.getScene();
    const RAIN_OPACITY = 0.35;   // subtle — full-rain streaks barely tint the view
    const RAIN_N = 500;
    const RAIN_BOX = 40;     // horizontal spread (m)
    const RAIN_TOP = 28;     // column top above eye (m)
    const RAIN_BOTTOM = -6;  // column bottom below eye (m)
    const rainY = new Float32Array(RAIN_N);
    const rainX = new Float32Array(RAIN_N);
    const rainZ = new Float32Array(RAIN_N);
    const speeds = new Float32Array(RAIN_N);
    for (let i = 0; i < RAIN_N; i++) {
      rainX[i] = (Math.random() - 0.5) * RAIN_BOX;
      rainY[i] = RAIN_BOTTOM + Math.random() * (RAIN_TOP - RAIN_BOTTOM);
      rainZ[i] = (Math.random() - 0.5) * RAIN_BOX;
      speeds[i] = 22 + Math.random() * 16;
    }
    // A thin vertical quad = a rain streak. Double-sided so it reads from any angle.
    const dropGeo = new THREE.PlaneGeometry(0.03, 0.55);
    const rainMat = new THREE.MeshBasicMaterial({
      color: 0xbcd2e8, transparent: true, opacity: 0,
      depthWrite: false, side: THREE.DoubleSide, fog: false,
    });
    const rain = new THREE.InstancedMesh(dropGeo, rainMat, RAIN_N);
    rain.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    rain.frustumCulled = false;
    rain.renderOrder = 50;
    rain.visible = false;
    const rainGroup = new THREE.Group();   // positioned at the player each frame
    rainGroup.add(rain);
    scene.add(rainGroup);
    const dropDummy = new THREE.Object3D();
    // Seed the instance matrices once so they exist before the first visible frame.
    for (let i = 0; i < RAIN_N; i++) {
      dropDummy.position.set(rainX[i], rainY[i], rainZ[i]);
      dropDummy.updateMatrix();
      rain.setMatrixAt(i, dropDummy.matrix);
    }
    rain.instanceMatrix.needsUpdate = true;

    // ── Drips shedding off WET CLOTHING (a rare, occasional bead) ─────────────
    // NOT a rain column. Each "drip" is a tiny bead that forms at a random point
    // on the body (shoulder/arm/hem), accelerates off under gravity, falls a
    // short way, then disappears — followed by a multi-second wait before that
    // slot drips again. Driven by a `wetness` value that builds while standing in
    // rain and slowly DECAYS after, so the player keeps dripping for a few
    // seconds after ducking under cover (real wet-clothes behaviour) then stops.
    const DRIP_N = 10;          // slots; most are idle at any instant → only ~1-2 visible
    const DRIP_FEET = -1.0;     // ≈ feet, relative to the capsule centre
    const dripActive = new Uint8Array(DRIP_N);
    const dripTimer = new Float32Array(DRIP_N);  // idle countdown to next bead
    const dripX = new Float32Array(DRIP_N);
    const dripZ = new Float32Array(DRIP_N);
    const dripY = new Float32Array(DRIP_N);
    const dripVy = new Float32Array(DRIP_N);      // downward velocity (accelerates)
    for (let i = 0; i < DRIP_N; i++) dripTimer[i] = 1 + Math.random() * 5;
    // A small bead — a short, near-square quad, distinct from the long rain streak.
    const dripGeo = new THREE.PlaneGeometry(0.022, 0.05);
    const dripMat = new THREE.MeshBasicMaterial({
      color: 0xcfe2f0, transparent: true, opacity: 0.85,
      depthWrite: false, side: THREE.DoubleSide, fog: false,
    });
    const drips = new THREE.InstancedMesh(dripGeo, dripMat, DRIP_N);
    drips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    drips.frustumCulled = false;
    drips.renderOrder = 51;
    drips.visible = false;
    const dripGroup = new THREE.Group();   // sits on the player each frame
    dripGroup.add(drips);
    scene.add(dripGroup);
    let wetness = 0;

    // ── HUD readout ──────────────────────────────────────────────────────────
    let hud = null;
    if (typeof XRPublisher.registerHud === 'function') {
      hud = document.createElement('div');
      hud.style.cssText =
        'font:12px/1.5 ui-monospace,Menlo,monospace;color:#dfe7ef;' +
        'background:rgba(12,16,22,.6);padding:8px 11px;border-radius:8px;' +
        'min-width:150px;backdrop-filter:blur(4px);';
      XRPublisher.registerHud(`${PLUGIN_ID}-hud`, hud, 'top-right');
    }

    // ── Optional: "Summon storm here" menu item (dynamic addCloudRegion) ─────
    if (typeof XRPublisher.registerMenuItem === 'function') {
      let summonId = null;
      XRPublisher.registerMenuItem({
        id: `${PLUGIN_ID}-summon`, label: 'Summon storm here', icon: '⛈️', order: 50,
        onSelect: () => {
          const p = new THREE.Vector3();
          listener.getWorldPosition(p);
          if (summonId) XRPublisher.removeCloudRegion(summonId);
          summonId = XRPublisher.addCloudRegion({
            center: [p.x, p.z], radius: 300, falloff: 0.5,
            density: 1.0, coverage: 0.95, scale: 1.3,
            color: [0.3, 0.31, 0.36], rain: 0.9,
          });
        },
      });
    }

    // ── Per-frame loop ───────────────────────────────────────────────────────
    const camPos = new THREE.Vector3();
    let last = performance.now();
    let lastHud = 0;
    let lastHudHtml = '';
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      // Cap the simulation at ~60Hz — on 120Hz ProMotion displays rAF fires
      // at native rate and the 500-drop matrix loop ran twice as hot for no
      // visible gain. Skipped ticks fold into the next delta.
      if (now - last < 14) return;
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;

      listener.getWorldPosition(camPos);
      const w = XRPublisher.getWeatherAt(camPos.x, camPos.z);

      // Day/night-gated storm: present only in the evening/dusk/night.
      const wantDusk = isDuskish(w.phase);
      if (wantDusk && !duskStormOn) { XRPublisher.addCloudRegion(duskStorm); duskStormOn = true; }
      else if (!wantDusk && duskStormOn) { XRPublisher.removeCloudRegion('wz-dusk-storm'); duskStormOn = false; }

      // Keep the rain volume centred on the player (group lives in the scene).
      rainGroup.position.set(camPos.x, camPos.y, camPos.z);

      // Player state gates EVERYTHING: no rain at all when sheltered (under a
      // roof / indoors) — otherwise it visibly falls through the ceiling.
      const st = XRPublisher.getPlayerState();
      const sheltered = !!(st && st.sheltered);
      const intensity = sheltered ? 0 : Math.max(0, Math.min(1, w.rain));

      // Shared streak material — subtle even at full rain. Drives BOTH the world
      // volume and the player drips (so they look identical).
      const targetOpacity = intensity * RAIN_OPACITY;
      rainMat.opacity += (targetOpacity - rainMat.opacity) * Math.min(1, delta * 3);
      const rate = (0.5 + intensity) * delta;   // heavier rain falls faster
      rain.visible = rainMat.opacity > 0.01;
      if (rain.visible) {
        dropDummy.scale.set(1, 1, 1);   // drip loop mutates this dummy's scale — reset it
        for (let i = 0; i < RAIN_N; i++) {
          rainY[i] -= speeds[i] * rate;
          if (rainY[i] < RAIN_BOTTOM) {
            rainY[i] = RAIN_TOP;
            rainX[i] = (Math.random() - 0.5) * RAIN_BOX;
            rainZ[i] = (Math.random() - 0.5) * RAIN_BOX;
          }
          dropDummy.position.set(rainX[i], rainY[i], rainZ[i]);
          dropDummy.updateMatrix();
          rain.setMatrixAt(i, dropDummy.matrix);
        }
        rain.instanceMatrix.needsUpdate = true;
      }

      // ── Player drips: rare beads shedding off wet clothing. Wetness builds in
      // the rain (when out in it) and decays slowly after, so dripping tapers off
      // over a few seconds rather than stopping dead. Never while swimming.
      const outInRain = st && intensity > 0.25 && !st.isSwimming && !st.isFlying;
      wetness = outInRain
        ? Math.min(1, wetness + delta * 0.6)
        : Math.max(0, wetness - delta * 0.12);
      const dripping = !!st && wetness > 0.04 && !st.isSwimming;
      drips.visible = dripping;
      if (dripping) {
        dripGroup.position.set(st.x, st.y, st.z);
        for (let i = 0; i < DRIP_N; i++) {
          if (dripActive[i]) {
            dripVy[i] += 11 * delta;             // gravity accel
            dripY[i] -= dripVy[i] * delta;
            if (dripY[i] <= DRIP_FEET) {
              dripActive[i] = 0;
              dripTimer[i] = 1.5 + Math.random() * 5; // long wait before this slot drips again
              dropDummy.scale.set(0, 0, 0);          // hide
            } else {
              dropDummy.scale.set(1, 1, 1);
              dropDummy.position.set(dripX[i], dripY[i], dripZ[i]);
            }
          } else {
            // Idle: count down (faster when wetter), then emit a new bead at a
            // random point on the body.
            dripTimer[i] -= delta * (0.4 + wetness * 0.9);
            if (dripTimer[i] <= 0) {
              dripActive[i] = 1;
              const ang = Math.random() * Math.PI * 2;
              const r = 0.16 + Math.random() * 0.2;   // on the body surface
              dripX[i] = Math.cos(ang) * r;
              dripZ[i] = Math.sin(ang) * r;
              dripY[i] = -0.25 + Math.random() * 1.0;  // hem → shoulder, vs capsule centre
              dripVy[i] = 0.2 + Math.random() * 0.3;   // slow start, then accelerates
              dropDummy.scale.set(1, 1, 1);
              dropDummy.position.set(dripX[i], dripY[i], dripZ[i]);
            } else {
              dropDummy.scale.set(0, 0, 0);            // stay hidden while waiting
              dropDummy.position.set(0, 0, 0);
            }
          }
          dropDummy.updateMatrix();
          drips.setMatrixAt(i, dropDummy.matrix);
        }
        drips.instanceMatrix.needsUpdate = true;
      }

      // HUD: 2Hz, and only touch the DOM when the text actually changed.
      // innerHTML every rAF forced a full style/layout/paint pass per frame
      // (~350ms of Layout+ParseHTML across a 12s trace).
      if (hud && now - lastHud >= 500) {
        lastHud = now;
        const label = w.isStorm ? 'STORM' : w.rain > 0.1 ? 'drizzle' : w.density > 0.6 ? 'overcast' : 'fair';
        const html =
          `<b>Weather</b> · ${label}<br>` +
          `time ${fmtTime(w.time)} (${w.phase})<br>` +
          `rain ${Math.round(w.rain * 100)}% · cover ${Math.round(w.coverage * 100)}%`;
        if (html !== lastHudHtml) {
          lastHudHtml = html;
          hud.innerHTML = html;
        }
      }
    };
    let raf = requestAnimationFrame(tick);

    console.log(`[${PLUGIN_ID}] weather zones placed (seed: ${seed})`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
