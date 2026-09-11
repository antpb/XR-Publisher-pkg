/**
 * shoreline-reeds — XR Publisher decoration plugin (shoreline life)
 *
 * THE TEACHING HEADLINE: `surface:'grass'` + `maxWaterDistance` places things
 * only in the grassy band hugging a shoreline. Every spec in this file uses
 * that one filter pair — the rest is what you can BUILD inside that band.
 * Built entirely from the public plugin API — no engine changes.
 *
 *   • REEDS (static, per-clump generated geometry): each clump is ONE merged
 *     BufferGeometry — thin tapered blades with a baked VERTEX-COLOR gradient
 *     (dark base → pale tip) so a single shared `vertexColors` material paints
 *     every clump; a seeded fraction of clumps carries brown cattail heads
 *     (stalk + sausage cylinder + tip spike). Clump size / height / lean all
 *     come from `spawn.rng` in a FIXED draw order. Because the geometry is
 *     unique per clump we deliberately OMIT `dispose` — the engine's default
 *     cleanup disposes returned GEOMETRY (never materials), which is exactly
 *     right here.
 *   • DRAGONFLIES (dynamic, `update()` — the budget pattern this file exists
 *     to demonstrate): very low density; hover/dart in small seeded orbits
 *     ~1u above the shore. `update()` runs PER SPAWN PER FRAME, so it follows
 *     three rules: (1) ZERO allocation — module-level scratch + lazily cached
 *     per-object anchors, (2) shared world reads (player position, time of
 *     day) are refreshed ONCE at ~8Hz for all spawns, not per object, and
 *     (3) DISTANCE-LOD cadence — full rate near the player, 20Hz mid-range,
 *     frozen beyond 60u. Motion is CLOSED-FORM in `elapsed` (pure functions
 *     of absolute time), so skipped LOD frames just sample the same path less
 *     often — frame-rate independence for free, no dt integration to drift.
 *     Wings are iridescent EMISSIVE-tinted quads (crossed pairs) — they punch
 *     bloom if a world enables postFX and read bright without it.
 *   • FIREFLIES (night touch): a few warm emissive sparks that only appear
 *     after dusk. Visibility is gated on `XRPublisher.getTimeOfDay()` —
 *     FEATURE-DETECTED (older runtimes just show them always) and checked at
 *     LOW CADENCE inside the same shared refresh the dragonflies use, never
 *     per frame per object. Glow = emissive material ONLY. NEVER add a scene
 *     light for effects like this: scene light count must stay constant after
 *     load or every material in the world recompiles.
 *   • Dragonflies and fireflies SHARE module-level geometry across all spawns
 *     (one GPU upload each), so both specs override `dispose(){}` with a
 *     no-op — the default cleanup would dispose the shared geometry and break
 *     every other instance.
 *
 * Deterministic: every blade, lean, orbit radius and blink phase comes from
 * `spawn.rng` in a fixed draw order — same world seed ⇒ the same shoreline,
 * every visit, every renderer. Only the ephemeral wing-flap/blink TIMING
 * reads the clock; no `Math.random()` anywhere.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'shoreline-reeds';

  // ── Configure me ──────────────────────────────────────────────────────────
  const REED_DENSITY = 5;          // clumps per chunk in the shoreline band
  const REED_BAND = 8;             // max distance (u) from a water edge for reeds
  const DRAGONFLY_DENSITY = 0.5;   // dynamic spec — keep LOW (update() is per spawn per frame)
  const DRAGONFLY_BAND = 10;
  const FIREFLY_DENSITY = 0.7;
  const FIREFLY_BAND = 12;
  const LOD_NEAR = 25;             // < this: animate every frame
  const LOD_FREEZE = 60;           // > this: freeze mid-pose, zero work
  const FIREFLY_ANIM_DIST = 45;    // sparks only bob/blink inside this
  const NIGHT_START = 19;          // fireflies visible from dusk…
  const NIGHT_END = 5;             // …until pre-dawn. Deliberately WIDER than the
                                   // engine's own dark window (sky sun is down
                                   // 20.5–6.5): sparks fade in while it's still
                                   // dusky and are gone before first light.
  // ──────────────────────────────────────────────────────────────────────────

  let registered = false;
  let XR = null, THREE = null;
  let HAS_TOD = false;

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  // ── Shared low-cadence world reads (the anti-N×frame pattern) ─────────────
  // update() runs once per spawn per frame. Anything that is the SAME for all
  // spawns (player position, time of day) must be read once and cached, not
  // N times — the first update() of a stale frame refreshes for everyone.
  let sharedStamp = -1;            // `elapsed` of the last shared refresh
  let playerX = 0, playerZ = 0;
  let todStamp = -10;
  let isNight = false;             // fireflies default hidden until we know

  const refreshShared = (elapsed) => {
    if (elapsed - sharedStamp < 0.12) return;       // ~8Hz is plenty for range checks
    sharedStamp = elapsed;
    const ps = XR.getPlayerState && XR.getPlayerState();
    if (ps) { playerX = ps.x; playerZ = ps.z; }
    // Time of day only matters to the minute — 2s cadence, feature-detected.
    if (elapsed - todStamp >= 2) {
      todStamp = elapsed;
      if (HAS_TOD) {
        const t = XR.getTimeOfDay();
        const hour = t ? t.time : 12;
        isNight = hour >= NIGHT_START || hour < NIGHT_END;
      } else {
        isNight = true;             // no clock API → graceful: sparks always on
      }
    }
  };

  // Lazily cache each spawn's STATIC world anchor (the placement wrapper's
  // world position) so per-frame distance checks are pure math — no matrix
  // walks, no allocation. One Vector3 per spawn, created on first update.
  const cacheHome = (obj, u) => {
    u.home = new THREE.Vector3();
    // ASSUMES the wrapper's matrixWorld is already current on the first
    // update() — true because the engine mounts the wrapper (and the renderer
    // updates the scene graph) a frame before update() ever ticks.
    (obj.parent || obj).getWorldPosition(u.home);   // parent = engine's placement wrapper (static)
  };

  // ── Reed clump geometry (merged, vertex-colored) ──────────────────────────
  // One BufferGeometry per clump: every blade/cattail emits raw triangles into
  // shared arrays, colors baked per vertex. A clump of ~9 blades is ~150 tris —
  // cheap — and ONE mesh + ONE shared material means one draw call per clump.
  const COL_BASE = [0.13, 0.20, 0.09];    // dark waterlogged base
  const COL_TIP = [0.62, 0.72, 0.40];     // sun-bleached tip
  const COL_HEAD = [0.42, 0.28, 0.14];    // cattail brown
  const COL_SPIKE = [0.75, 0.68, 0.42];   // straw tip spike

  function buildReedClumpGeometry(rng) {
    const pos = [];
    const col = [];

    const pushVert = (x, y, z, r, g, b) => { pos.push(x, y, z); col.push(r, g, b); };

    // A tapered strip: rings of 2 verts marching up a lean curve, closed by a
    // tip point. `face` is the strip's facing angle (independent of lean, so
    // blades don't all show their edge to the wind).
    const emitBlade = (bx, bz, h, w0, leanX, leanZ, lean, face, c0, c1) => {
      const perpX = Math.cos(face), perpZ = Math.sin(face);
      const SEG = 3;
      const ring = (t) => {
        const bend = lean * h * t * t;                 // quadratic bend — stiff base, soft tip
        const cx = bx + leanX * bend, cz = bz + leanZ * bend, cy = t * h;
        const wt = w0 * (1 - 0.85 * t);
        return [cx - perpX * wt, cy, cz - perpZ * wt, cx + perpX * wt, cy, cz + perpZ * wt, cx, cy, cz];
      };
      const colAt = (t) => {
        const k = Math.pow(t, 1.2);
        return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
      };
      let prev = ring(0), prevC = colAt(0);
      for (let s = 1; s <= SEG; s++) {
        const t = s / SEG, cur = ring(t), curC = colAt(t);
        if (s < SEG) {
          // Quad between rings → two triangles (L0 R0 R1 / L0 R1 L1).
          pushVert(prev[0], prev[1], prev[2], prevC[0], prevC[1], prevC[2]);
          pushVert(prev[3], prev[4], prev[5], prevC[0], prevC[1], prevC[2]);
          pushVert(cur[3], cur[4], cur[5], curC[0], curC[1], curC[2]);
          pushVert(prev[0], prev[1], prev[2], prevC[0], prevC[1], prevC[2]);
          pushVert(cur[3], cur[4], cur[5], curC[0], curC[1], curC[2]);
          pushVert(cur[0], cur[1], cur[2], curC[0], curC[1], curC[2]);
        } else {
          // Final segment tapers to a single tip point.
          pushVert(prev[0], prev[1], prev[2], prevC[0], prevC[1], prevC[2]);
          pushVert(prev[3], prev[4], prev[5], prevC[0], prevC[1], prevC[2]);
          pushVert(cur[6], cur[7], cur[8], curC[0], curC[1], curC[2]);
        }
        prev = cur; prevC = curC;
      }
    };

    // Open 6-sided cylinder + caps, used for the cattail head.
    const emitCylinder = (cx, cy, cz, radius, height, r, g, b) => {
      const N = 6, y0 = cy - height / 2, y1 = cy + height / 2;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
        const x0 = cx + Math.cos(a0) * radius, z0 = cz + Math.sin(a0) * radius;
        const x1 = cx + Math.cos(a1) * radius, z1 = cz + Math.sin(a1) * radius;
        pushVert(x0, y0, z0, r, g, b); pushVert(x1, y0, z1, r, g, b); pushVert(x1, y1, z1, r, g, b);
        pushVert(x0, y0, z0, r, g, b); pushVert(x1, y1, z1, r, g, b); pushVert(x0, y1, z0, r, g, b);
        pushVert(cx, y1, cz, r, g, b); pushVert(x0, y1, z0, r, g, b); pushVert(x1, y1, z1, r, g, b); // top cap
        pushVert(cx, y0, cz, r, g, b); pushVert(x1, y0, z1, r, g, b); pushVert(x0, y0, z0, r, g, b); // bottom cap
      }
    };

    // ── Fixed rng draw order (determinism contract) ──
    const bladeCount = 5 + Math.floor(rng() * 5);        // 5–9 blades
    const clumpR = 0.25 + rng() * 0.35;
    const heightScale = 0.85 + rng() * 0.4;              // whole-clump stature
    const windAngle = rng() * Math.PI * 2;               // shared lean bias — the clump agrees on a wind
    const windX = Math.cos(windAngle), windZ = Math.sin(windAngle);
    const hasCattails = rng() < 0.6;                     // seeded fraction carries heads
    const catCount = hasCattails ? 1 + Math.floor(rng() * 2) : 0;

    for (let i = 0; i < bladeCount; i++) {
      const a = rng() * Math.PI * 2, d = rng() * clumpR;
      const bx = Math.cos(a) * d, bz = Math.sin(a) * d;
      const h = (0.8 + rng() * 1.2) * heightScale;
      const w = 0.035 + rng() * 0.025;
      const lean = 0.08 + rng() * 0.22;
      // Mostly the shared wind, with per-blade scatter.
      const la = windAngle + (rng() - 0.5) * 1.2;
      const face = rng() * Math.PI * 2;
      const jit = 0.85 + rng() * 0.3;                    // per-blade hue jitter
      emitBlade(bx, bz, h, w, Math.cos(la), Math.sin(la), lean, face,
        [COL_BASE[0] * jit, COL_BASE[1] * jit, COL_BASE[2] * jit],
        [COL_TIP[0] * jit, COL_TIP[1] * jit, COL_TIP[2] * jit]);
    }

    for (let i = 0; i < catCount; i++) {
      const a = rng() * Math.PI * 2, d = rng() * clumpR * 0.7;
      const bx = Math.cos(a) * d, bz = Math.sin(a) * d;
      const hs = (1.3 + rng() * 0.5) * heightScale;      // cattails stand above the blades
      const lean = 0.03 + rng() * 0.07;                  // stiffer than blades
      const jit = 0.85 + rng() * 0.3;
      // Stalk — a narrow straight-ish blade in darker green.
      emitBlade(bx, bz, hs, 0.022, windX, windZ, lean, rng() * Math.PI * 2,
        [0.16 * jit, 0.23 * jit, 0.11 * jit], [0.40 * jit, 0.48 * jit, 0.26 * jit]);
      // Brown sausage head near the top (follow the stalk's lean at that height).
      const bendTop = lean * hs;                          // stalk bend at t=1 → head sits on the stalk
      const hx = bx + windX * bendTop * 0.75, hz = bz + windZ * bendTop * 0.75;
      emitCylinder(hx, hs * 0.84, hz, 0.045 + rng() * 0.02, 0.22 + rng() * 0.1,
        COL_HEAD[0] * jit, COL_HEAD[1] * jit, COL_HEAD[2] * jit);
      // Straw spike continuing above the head.
      emitBlade(hx, hz, hs * 1.12, 0.012, windX, windZ, lean * 0.5, rng() * Math.PI * 2, COL_SPIKE, COL_SPIKE);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geom.computeVertexNormals();                          // flat-ish normals — stylized is fine
    return geom;
  }

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    XR = window.XRPublisher; THREE = window.THREE;
    if (!XR || !THREE || typeof XR.registerDecoration !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime not available`); return;
    }
    HAS_TOD = typeof XR.getTimeOfDay === 'function';

    // ── Shared materials & geometry (module level — hard rule #3) ───────────
    // ONE material for every reed clump (vertex colors carry all variation),
    // ONE geometry per dragonfly part / firefly spark across ALL spawns.
    const reedMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide,
    });

    const dfBodyGeo = new THREE.CapsuleGeometry(0.02, 0.24, 3, 6);
    dfBodyGeo.rotateX(Math.PI / 2);                       // body axis along local Z → rotation.y = heading
    const dfTailGeo = new THREE.CylinderGeometry(0.006, 0.012, 0.26, 5);
    dfTailGeo.rotateX(Math.PI / 2);
    dfTailGeo.translate(0, 0, -0.24);                     // trails behind the body
    const dfWingGeo = new THREE.PlaneGeometry(0.26, 0.08);
    dfWingGeo.rotateX(-Math.PI / 2);                      // lie flat (XZ plane)
    dfWingGeo.translate(0.13, 0, 0);                      // hinge at the body — rotation.z flaps the tip
    const dfBodyMat = new THREE.MeshStandardMaterial({
      color: 0x14333a, roughness: 0.5, metalness: 0.2,
      emissive: 0x0f5f66, emissiveIntensity: 0.35,        // faint sheen, day or night
    });
    // Iridescent wings: emissive tint > lighting, translucent, depth-TESTED
    // (never depthTest:false — the terrain render bundle would paint over it).
    const dfWingMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12, roughness: 0.3, metalness: 0,
      emissive: 0x66ddff, emissiveIntensity: 1.1,
      transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
    });

    const sparkGeo = new THREE.PlaneGeometry(0.06, 0.06);
    // Emissive > 1 punches the default bloom threshold when a world enables
    // postFX; without postFX it still reads as a bright point. NO scene light.
    const sparkMat = new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: 0xffc95e, emissiveIntensity: 2.5,
      transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false,
    });

    // ════════════════════════════════════════════════════════════════════════
    // SPEC 1 — REEDS. The headline filter pair: surface:'grass' keeps clumps
    // on grassy ground; maxWaterDistance keeps them within REED_BAND units of
    // a water edge. Together = "the grassy band hugging a shoreline".
    // ════════════════════════════════════════════════════════════════════════
    XR.registerDecoration({
      name: 'shoreline-reeds',       // NOTE: name seeds placement — renaming relocates every clump
      density: REED_DENSITY,
      surface: 'grass',              // grassy ground only…
      maxWaterDistance: REED_BAND,   // …and within REED_BAND u of a water edge
      minSpacing: 2,
      create(spawn) {
        const mesh = new THREE.Mesh(buildReedClumpGeometry(spawn.rng), reedMat);
        mesh.castShadow = true;      // the meaningful silhouette — worth a shadow
        return mesh;
      },
      // No dispose(): the geometry is unique per clump, so the engine's
      // default cleanup (disposes returned geometry, never materials) is
      // exactly what we want.
    });

    // ════════════════════════════════════════════════════════════════════════
    // SPEC 2 — DRAGONFLIES. A dynamic spec: `update()` runs per spawn per
    // frame, so the whole spec is an exercise in budget discipline. Density
    // stays very low — this decorates EVERY shoreline in the world.
    // ════════════════════════════════════════════════════════════════════════
    XR.registerDecoration({
      name: 'shoreline-dragonflies',
      density: DRAGONFLY_DENSITY,
      surface: 'grass',
      maxWaterDistance: DRAGONFLY_BAND,
      minSpacing: 6,
      create(spawn) {
        const rng = spawn.rng;
        const df = new THREE.Group();
        const body = new THREE.Mesh(dfBodyGeo, dfBodyMat);
        const tail = new THREE.Mesh(dfTailGeo, dfBodyMat);
        df.add(body, tail);
        // Two crossed wing pairs, hinged at the body. Front pair sweeps
        // forward, rear pair back; right side mirrors via rotation.y = π−sweep
        // (DoubleSide material, so flipped winding is fine).
        const wings = [];
        const SWEEPS = [0.35, -0.3];
        for (let p = 0; p < 2; p++) {
          for (let s = 0; s < 2; s++) {
            const w = new THREE.Mesh(dfWingGeo, dfWingMat);
            w.position.z = p === 0 ? 0.05 : -0.04;
            w.rotation.y = s === 0 ? SWEEPS[p] : Math.PI - SWEEPS[p];
            df.add(w); wings.push(w);
          }
        }
        // All flight parameters drawn ONCE from spawn.rng (fixed order) —
        // the same dragonfly flies the same seeded orbit every visit.
        df.userData = {
          home: null,                          // world anchor, cached on first update
          wings,
          phase: rng() * Math.PI * 2,
          r1: 0.6 + rng() * 0.9,               // orbit radii (slightly elliptical)
          r2: 0.5 + rng() * 0.9,
          speed: 0.5 + rng() * 0.5,
          hover: 0.85 + rng() * 0.5,           // ~1u above the shoreline
          dartPhase: rng() * Math.PI * 2,
          prevX: 0, prevZ: 0,
          accum: 0,
          rangeAccum: rng() * 0.5,             // stagger range checks across spawns
          dist: Infinity,
        };
        return df;
      },
      update(df, delta, elapsed) {
        refreshShared(elapsed);                          // shared reads, ~8Hz, once for ALL spawns
        const u = df.userData;
        if (!u.home) cacheHome(df, u);                   // one-time world anchor (one Vector3 per spawn)

        // Range check at ~2Hz, staggered per spawn — not every frame.
        u.rangeAccum += delta;
        if (u.rangeAccum >= 0.5) {
          u.rangeAccum = 0;
          u.dist = Math.hypot(playerX - u.home.x, playerZ - u.home.z);
        }
        // DISTANCE LOD: beyond LOD_FREEZE the dragonfly freezes mid-pose and
        // this update costs two compares. Mid-range runs at 20Hz. Because the
        // motion below is a closed-form function of `elapsed`, skipping frames
        // just samples the same path less often — no drift, no dt integration.
        if (u.dist > LOD_FREEZE) return;
        u.accum += delta;
        const step = u.dist < LOD_NEAR ? 0 : (1 / 20);
        if (u.accum < step) return;
        u.accum = 0;

        // Hover + dart: a slow elliptical patrol with an occasional burst —
        // pow(sin, 6) spikes briefly, adding angle (a dart) and lift.
        const t = elapsed * u.speed + u.phase;
        const dart = Math.pow(Math.max(0, Math.sin(elapsed * 0.31 + u.dartPhase)), 6);
        const ang = t + dart * 2.2;
        const x = Math.cos(ang) * u.r1;
        const z = Math.sin(ang * 0.8 + u.phase) * u.r2;
        df.position.set(x, u.hover + Math.sin(elapsed * 2.3 + u.phase) * 0.15 + dart * 0.35, z);
        // Face the direction of travel (derived from the previous sample —
        // cheap, allocation-free, and correct at any LOD cadence).
        const dx = x - u.prevX, dz = z - u.prevZ;
        if (dx * dx + dz * dz > 1e-8) df.rotation.y = Math.atan2(dx, dz);
        u.prevX = x; u.prevZ = z;
        // Wing blur: 40rad/s aliases at 60fps into exactly the shimmer real
        // dragonfly wings have. Left/right counter-flap via alternating sign.
        const flap = Math.sin(elapsed * 40 + u.phase) * 0.55;
        const w = u.wings;
        w[0].rotation.z = flap;  w[1].rotation.z = -flap;
        w[2].rotation.z = -flap; w[3].rotation.z = flap;
      },
      // Wings/body/tail SHARE module-level geometry across every dragonfly —
      // default cleanup would dispose it and break all the others. No-op; the
      // shared geometry lives for the session.
      dispose() {},
    });

    // ════════════════════════════════════════════════════════════════════════
    // SPEC 3 — FIREFLIES. The cheap night touch: emissive quads only, gated
    // on the room-synced world clock. The day/night check rides the SAME
    // shared refresh as the dragonflies (2s cadence) — by the time any
    // firefly's update runs, `isNight` is already computed for everyone.
    // ════════════════════════════════════════════════════════════════════════
    XR.registerDecoration({
      name: 'shoreline-fireflies',
      density: FIREFLY_DENSITY,
      surface: 'grass',
      maxWaterDistance: FIREFLY_BAND,
      minSpacing: 5,
      create(spawn) {
        const rng = spawn.rng;
        const group = new THREE.Group();
        group.visible = false;                            // hidden until the clock says night
        const n = 3 + Math.floor(rng() * 3);              // 3–5 sparks
        const sparks = [], baseX = [], baseY = [], baseZ = [], ph = [];
        for (let i = 0; i < n; i++) {
          const s = new THREE.Mesh(sparkGeo, sparkMat);   // shared geo + mat — see dispose note
          s.rotation.set(rng() * Math.PI, rng() * Math.PI, 0); // random facing; at 6cm a billboard isn't worth per-frame lookAt
          baseX.push((rng() - 0.5) * 2.2);
          baseY.push(0.5 + rng() * 1.2);
          baseZ.push((rng() - 0.5) * 2.2);
          ph.push(rng() * Math.PI * 2);
          group.add(s); sparks.push(s);
        }
        group.userData = {
          home: null, sparks, baseX, baseY, baseZ, ph,
          accum: 0, rangeAccum: rng(), dist: Infinity,
        };
        return group;
      },
      update(group, delta, elapsed) {
        refreshShared(elapsed);
        const u = group.userData;
        if (!u.home) cacheHome(group, u);

        // Visibility + range at ~1Hz, staggered. The toggle is one flag write;
        // hidden groups cost the renderer nothing.
        u.rangeAccum += delta;
        if (u.rangeAccum >= 1) {
          u.rangeAccum = 0;
          if (group.visible !== isNight) group.visible = isNight;
          u.dist = Math.hypot(playerX - u.home.x, playerZ - u.home.z);
        }
        if (!group.visible || u.dist > FIREFLY_ANIM_DIST) return;
        // Sparks drift + blink at 20Hz — plenty for a 6cm glow point.
        u.accum += delta;
        if (u.accum < 1 / 20) return;
        u.accum = 0;
        const sparks = u.sparks;
        for (let i = 0; i < sparks.length; i++) {
          const p = u.ph[i], s = sparks[i];
          s.position.set(
            u.baseX[i] + Math.sin(elapsed * 0.45 + p) * 0.5,
            u.baseY[i] + Math.sin(elapsed * 0.7 + p * 2) * 0.3,
            u.baseZ[i] + Math.cos(elapsed * 0.38 + p) * 0.5,
          );
          // Blink by SCALE (material is shared, so per-spark opacity would
          // need per-spark materials — scale gives the same pulse for free).
          const blink = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(elapsed * 0.9 + p * 3)), 2);
          s.scale.setScalar(blink);
        }
      },
      // Shared spark geometry/material — same rule as the dragonflies.
      dispose() {},
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] shoreline life registered (reeds + dragonflies + fireflies${HAS_TOD ? ', night-gated' : ''})`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
