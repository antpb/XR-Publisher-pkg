/**
 * lake-fish — XR Publisher decoration plugin (THE `waterPlacement` showcase)
 *
 * One lake, three depths. This single file exercises ALL THREE `waterPlacement`
 * modes of `registerDecoration`, plus `XRPublisher.loadModel` — built entirely
 * from the public API, no engine changes:
 *
 *   • 'floor'     — KELP. Procedural crossed-ribbon strands (vertex-color
 *     gradient, dark lakebed green → sunlit tip) rising from the bed. Strand
 *     height is sized from `spawn.waterLevel - spawn.position[1]` — both are
 *     in the SAME local frame, so that difference IS the water-column depth —
 *     so kelp reaches toward the surface but never breaks it.
 *   • 'submerged' — FISH. A published GLB loaded ONCE via `loadModel` (cached
 *     per URL), `.clone(true)`d per spawn, with a no-op `dispose(){}` so the
 *     default cleanup can't destroy the shared geometry. Each fish swims a
 *     lazy seeded orbit in LOCAL space around the engine-placed point, with a
 *     distance-LOD `update` that goes fully idle beyond ~70u.
 *   • 'surface'   — LILY PADS. Notched pads exactly at the waterline; a seeded
 *     fraction carry a lotus (merged petal-blob geometry, per-vertex gradient,
 *     white or pink). Deliberately STATIC — see the spec comment for why.
 *
 * Three specs, three DISPOSE strategies (the other teaching axis here):
 *   kelp  → unique per-spawn geometry: NO dispose override; the engine's
 *           default cleanup (disposes geometry, never materials) is exactly right.
 *   fish  → everything shared with the cached model: no-op dispose(){}.
 *   pads  → MIXED: shared pad geometry + unique merged flower geometry, so a
 *           custom dispose frees only what this spawn owns.
 *
 * Determinism: every radius, speed, petal count, and strand lean comes from
 * `spawn.rng` in a fixed draw order — same world seed ⇒ the same lake life on
 * every visit and every renderer. `Math.random()` appears nowhere.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'lake-fish';
  let registered = false;

  // ── Configure me ──────────────────────────────────────────────────────────
  // Densities are per 100×100u chunk and deliberately restrained — lakes are
  // accents, not aquariums, and every dynamic fish costs an update() call.
  const FISH_DENSITY = 2;
  const FISH_SPACING = 4;
  const FISH_LOD_DIST = 70;      // beyond this, fish update() early-outs entirely
  const FISH_FORWARD = 0;        // yaw offset if a different GLB noses sideways
  const PAD_DENSITY = 2;
  const PAD_SPACING = 2.5;
  const FLOWER_CHANCE = 0.35;    // seeded fraction of pads that bloom
  const KELP_DENSITY = 1.2;      // each spawn is a CLUSTER of 3-6 strands
  const KELP_SPACING = 5;
  const KELP_MIN_DEPTH = 1.4;    // shallower water gets no kelp (return null → skip)
  const KELP_SURFACE_GAP = 0.75; // tips stay this far under the waterline; the
                                 // engine's waves are cosmetic vertex displacement
                                 // (~±0.5u), so this clears even a wave trough
  const FISH_URL = 'https://items.sxp.digital/f8886983-a11b-4367-a19c-388662542d84/fish.glb';

  const TAU = Math.PI * 2;

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || !THREE || typeof XRPublisher.registerDecoration !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime not available`);
      return;
    }
    registered = true;

    // ════════════════════════════════════════════════════════════════════════
    // Shared resources — module-level, built ONCE. create() runs per spawn, so
    // anything reusable lives up here; per-spawn allocations below are only the
    // genuinely unique meshes (kelp strands, lotus flowers).
    // ════════════════════════════════════════════════════════════════════════

    // Lily pad: ONE unit-radius notched disc, scaled per spawn. The notch (the
    // wedge slit every real pad has) makes a plain circle read as authored.
    const PAD_NOTCH = 0.55; // radians of missing wedge
    const padShape = new THREE.Shape();
    padShape.moveTo(Math.cos(PAD_NOTCH / 2), Math.sin(PAD_NOTCH / 2));
    padShape.absarc(0, 0, 1, PAD_NOTCH / 2, TAU - PAD_NOTCH / 2, false);
    padShape.lineTo(0, 0);
    const PAD_GEO = new THREE.ShapeGeometry(padShape, 20);
    PAD_GEO.rotateX(-Math.PI / 2); // bake flat, facing up — spawns then only yaw

    // Variety on SHARED materials comes from choosing WHICH shared material a
    // spawn uses — never from tinting a clone's material (clones share material
    // objects by reference; tinting one would tint every pad in the world).
    const PAD_MATS = [
      new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.85, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x4a7d2a, roughness: 0.9, side: THREE.DoubleSide }),
    ];
    const FLOWER_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide });
    const KELP_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });

    // ── Lotus petal/core templates + a tiny merge writer ─────────────────────
    // One flower = ONE mesh (merged petal blobs + core with per-vertex color),
    // not a dozen tiny meshes — draw calls stay per-flower, not per-petal.
    const tplFrom = (geo) => {
      const pos = geo.attributes.position.array.slice();
      const idx = Array.from(geo.index.array);
      let zMin = Infinity, zMax = -Infinity;
      for (let i = 2; i < pos.length; i += 3) { if (pos[i] < zMin) zMin = pos[i]; if (pos[i] > zMax) zMax = pos[i]; }
      geo.dispose();
      return { pos, idx, zMin, zMax };
    };
    const petalGeo = new THREE.SphereGeometry(0.5, 6, 4);
    petalGeo.scale(0.11, 0.035, 0.21);   // squash a sphere into a petal blob
    petalGeo.translate(0, 0, 0.14);      // origin at the flower center, tip out +Z
    const PETAL_TPL = tplFrom(petalGeo);
    const coreGeo = new THREE.SphereGeometry(0.5, 6, 4);
    coreGeo.scale(0.1, 0.075, 0.1);
    const CORE_TPL = tplFrom(coreGeo);

    const _bm = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _be = new THREE.Euler();
    const _bp = new THREE.Vector3(), _bs = new THREE.Vector3(), _bv = new THREE.Vector3();
    // Append one template into the growing buffer, colored base→tip along the
    // template's local Z ('YXZ' euler: yaw around the flower axis first, then
    // tilt lifts the petal tip — no euler-composition surprises).
    const bakePart = (buf, tpl, yaw, tilt, x, y, z, scale, cBase, cTip) => {
      _be.set(tilt, yaw, 0, 'YXZ'); _bq.setFromEuler(_be);
      _bm.compose(_bp.set(x, y, z), _bq, _bs.setScalar(scale));
      const start = buf.pos.length / 3;
      const span = (tpl.zMax - tpl.zMin) || 1;
      for (let i = 0; i < tpl.pos.length; i += 3) {
        _bv.set(tpl.pos[i], tpl.pos[i + 1], tpl.pos[i + 2]).applyMatrix4(_bm);
        buf.pos.push(_bv.x, _bv.y, _bv.z);
        const t = (tpl.pos[i + 2] - tpl.zMin) / span;
        buf.col.push(
          cBase.r + (cTip.r - cBase.r) * t,
          cBase.g + (cTip.g - cBase.g) * t,
          cBase.b + (cTip.b - cBase.b) * t,
        );
      }
      for (let i = 0; i < tpl.idx.length; i++) buf.idx.push(start + tpl.idx[i]);
    };

    const LOTUS_WHITE = [new THREE.Color(0xe8e0cf), new THREE.Color(0xfbf8ef)];
    const LOTUS_PINK = [new THREE.Color(0xc95f92), new THREE.Color(0xf6cade)];
    const LOTUS_CORE = new THREE.Color(0xf0c23c);

    const buildFlower = (rng) => {
      const buf = { pos: [], col: [], idx: [] };
      const pal = rng() < 0.45 ? LOTUS_PINK : LOTUS_WHITE;
      const nOuter = 7 + Math.floor(rng() * 3);      // 7-9 splayed outer petals
      for (let i = 0; i < nOuter; i++) {
        const yaw = (i / nOuter) * TAU + (rng() - 0.5) * 0.2;
        const tilt = -(0.3 + rng() * 0.2);           // slight cup upward
        bakePart(buf, PETAL_TPL, yaw, tilt, 0, 0.028, 0, 1, pal[0], pal[1]);
      }
      const nInner = 5 + Math.floor(rng() * 2);      // tighter, more upright ring
      const innOff = rng() * TAU;
      for (let i = 0; i < nInner; i++) {
        const yaw = innOff + (i / nInner) * TAU;
        const tilt = -(0.75 + rng() * 0.2);
        bakePart(buf, PETAL_TPL, yaw, tilt, 0, 0.04, 0, 0.68, pal[0], pal[1]);
      }
      bakePart(buf, CORE_TPL, 0, 0, 0, 0.055, 0, 1, LOTUS_CORE, LOTUS_CORE);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(buf.pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(buf.col, 3));
      geo.setIndex(buf.idx);
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, FLOWER_MAT);
    };

    // ════════════════════════════════════════════════════════════════════════
    // 'surface' — LILY PADS, exactly at the waterline
    // ════════════════════════════════════════════════════════════════════════
    // Deliberately STATIC (no `update`): a spec without update() gets its
    // matrices frozen by the engine and costs literally zero per frame, and
    // this is the DENSEST of the three specs. A bobbing pad was considered and
    // rejected: the engine's waves are GPU vertex displacement the CPU can't
    // read, so a CPU-bobbed pad drifts THROUGH the swell out of phase — it
    // reads worse than a still pad, and charges per-frame work for it.
    XRPublisher.registerDecoration({
      name: 'lily-pad',
      density: PAD_DENSITY,
      surface: 'water',
      waterPlacement: 'surface',   // engine seats local y=0 exactly at the waterline
      minSpacing: PAD_SPACING,
      create(spawn) {
        const rng = spawn.rng;     // fixed draw order → stable per visit
        const r = 0.35 + rng() * 0.42;
        const matPick = rng();
        const yaw = rng() * TAU;
        const hasFlower = rng() < FLOWER_CHANCE;
        const group = new THREE.Group();
        const pad = new THREE.Mesh(PAD_GEO, matPick < 0.6 ? PAD_MATS[0] : PAD_MATS[1]);
        pad.scale.set(r, 1, r);    // shared unit geometry, per-spawn scale — free
        pad.rotation.y = yaw;
        pad.position.y = 0.02;     // hair above the plane, avoids waterline z-fighting
        group.add(pad);
        if (hasFlower) {
          const flower = buildFlower(rng);
          const fs = 0.75 + rng() * 0.45;
          const fa = rng() * TAU, fr = rng() * r * 0.35;
          flower.scale.setScalar(fs);
          flower.position.set(Math.cos(fa) * fr, 0.04, Math.sin(fa) * fr);
          group.add(flower);
        }
        return group;
      },
      // MIXED ownership: the pad's geometry is the SHARED unit disc (must
      // survive), the flower's merged geometry is unique to this spawn (must
      // be freed). The default cleanup can't tell them apart, so we do.
      dispose(object) {
        object.traverse((o) => {
          if (o.isMesh && o.geometry && o.geometry !== PAD_GEO) o.geometry.dispose();
        });
      },
    });

    // ════════════════════════════════════════════════════════════════════════
    // 'floor' — KELP, rooted on the lakebed
    // ════════════════════════════════════════════════════════════════════════
    // FRAME MATH (the point of this spec): with waterPlacement 'floor' the
    // spawn sits ON the bed, so spawn.position[1] is the bed's local Y and
    // spawn.waterLevel is the water surface Y IN THAT SAME LOCAL FRAME — their
    // difference is the true column depth with no world/chunk conversion.
    // Strands are sized from it so they reach toward — never through — the
    // surface. Kelp is static: underwater sway would need per-vertex CPU work
    // per frame (or a dual-authored TSL material) for something mostly seen
    // from above; the baked S-curve lean sells "current" for free.
    const KELP_SEGS = 6;
    const KELP_BASE_COL = new THREE.Color(0x123a22);
    const KELP_TIP_COL = new THREE.Color(0x55b06a);
    // One strand = two crossed tapered ribbons sharing a centerline (classic
    // foliage-card trick: reads volumetric from every angle for 48 vertices).
    const emitStrand = (buf, rng, depth, clusterR) => {
      // Draw ALL of this strand's randomness up front, in fixed order, so a
      // strand skipped by the height guard below still consumes the same draws
      // — later strands land identically whether or not this one built.
      const ang = rng() * TAU, rad = Math.sqrt(rng()) * clusterR;
      const frac = 0.55 + rng() * 0.3;
      const psi = rng() * TAU;
      const leanTheta = rng() * TAU;
      const leanAmp = 0.15 + rng() * 0.5;
      const wobPhase = rng() * TAU;
      const w0 = 0.16 + rng() * 0.12;
      const tint = 0.85 + rng() * 0.3;
      const h = Math.min(depth * frac, depth - KELP_SURFACE_GAP);
      if (h < 0.5) return;
      const ox = Math.cos(ang) * rad, oz = Math.sin(ang) * rad;
      const lx = Math.cos(leanTheta), lz = Math.sin(leanTheta);
      const sx = -lz, sz = lx; // sway ⟂ lean, shared by both ribbons of the pair
      for (let ribbon = 0; ribbon < 2; ribbon++) {
        const p = psi + ribbon * (Math.PI / 2);
        const dHx = Math.cos(p), dHz = Math.sin(p);
        const vBase = buf.pos.length / 3;
        for (let i = 0; i <= KELP_SEGS; i++) {
          const t = i / KELP_SEGS;
          const y = t * h;
          const bend = leanAmp * t * t;                    // quadratic — roots stay planted
          const sway = Math.sin(t * 2.8 + wobPhase) * 0.1 * t;
          const x = ox + lx * bend + sx * sway;
          const z = oz + lz * bend + sz * sway;
          const halfW = (w0 * (1 - 0.82 * t)) / 2;         // taper to a near-point tip
          buf.pos.push(x - dHx * halfW, y, z - dHz * halfW, x + dHx * halfW, y, z + dHz * halfW);
          const cr = (KELP_BASE_COL.r + (KELP_TIP_COL.r - KELP_BASE_COL.r) * t) * tint;
          const cg = (KELP_BASE_COL.g + (KELP_TIP_COL.g - KELP_BASE_COL.g) * t) * tint;
          const cb = (KELP_BASE_COL.b + (KELP_TIP_COL.b - KELP_BASE_COL.b) * t) * tint;
          buf.col.push(cr, cg, cb, cr, cg, cb);
          if (i < KELP_SEGS) {
            const a = vBase + i * 2;
            buf.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
          }
        }
      }
    };

    XRPublisher.registerDecoration({
      name: 'lake-kelp',
      density: KELP_DENSITY,
      surface: 'water',
      waterPlacement: 'floor',     // default, but explicit — this IS the showcase
      minSpacing: KELP_SPACING,
      create(spawn) {
        const depth = (spawn.waterLevel ?? spawn.position[1]) - spawn.position[1];
        if (depth < KELP_MIN_DEPTH) return null;  // shallows: null skips this spawn
        const rng = spawn.rng;
        const strands = 3 + Math.floor(rng() * 4);
        const buf = { pos: [], col: [], idx: [] };
        for (let s = 0; s < strands; s++) emitStrand(buf, rng, depth, 0.9);
        if (!buf.idx.length) return null;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(buf.pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(buf.col, 3));
        geo.setIndex(buf.idx);
        geo.computeVertexNormals();
        return new THREE.Mesh(geo, KELP_MAT);
        // No dispose override ON PURPOSE: this geometry is unique to the spawn
        // and the engine's default cleanup (dispose geometry, never materials)
        // is exactly the right teardown for it.
      },
    });

    // ════════════════════════════════════════════════════════════════════════
    // 'submerged' — FISH, cruising the water column (glTF via loadModel)
    // ════════════════════════════════════════════════════════════════════════
    // Load the GLB ONCE (XRPublisher.loadModel caches per URL), normalize its
    // size, then register. Awaiting before registering lets create() clone
    // synchronously; late registration re-scatters any chunks already loaded.
    //
    // RETRY, don't give up: init() already set `registered`, so a single
    // transient fetch failure here used to lose the fish spec for the whole
    // session (kelp + pads stayed). A published world on a flaky connection
    // is the normal case, so retry with backoff before settling for no fish.
    const loadFish = async (attempts = 3) => {
      for (let i = 0; i < attempts; i++) {
        try {
          return await XRPublisher.loadModel(FISH_URL);
        } catch (err) {
          if (i === attempts - 1) {
            console.error(`[${PLUGIN_ID}] failed to load fish model after ${attempts} attempts`, err);
            return null;
          }
          await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
        }
      }
      return null;
    };
    const fishModel = await loadFish();
    if (!fishModel) {
      console.log(`[${PLUGIN_ID}] kelp + lily pads registered (no fish)`);
      return;
    }
    // Normalize to ~0.8u long (mutate the shared template once; clones inherit).
    const box = new THREE.Box3().setFromObject(fishModel);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    fishModel.scale.setScalar(0.8 / maxDim);

    // Distance-LOD scratch — module-level so update() allocates NOTHING.
    // getPlayerState() is polled at ~8Hz by whichever fish updates first each
    // window (all fish share one `elapsed` clock); the rest reuse the cache.
    const _wp = new THREE.Vector3();
    const FISH_LOD_DIST_SQ = FISH_LOD_DIST * FISH_LOD_DIST;
    let px = 0, pz = 0, hasPlayer = false, pollAt = -1;

    XRPublisher.registerDecoration({
      name: 'lake-fish',
      density: FISH_DENSITY,
      surface: 'water',
      waterPlacement: 'submerged',  // engine seats the wrapper mid-column
      minSpacing: FISH_SPACING,
      create(spawn) {
        // clone(true) shares geometry + materials by reference (one GPU upload,
        // many fish). Scale is FREE on clones — each clone owns its transform —
        // but material tint is NOT: clones share material objects, so tinting
        // one fish would tint the whole school. Vary size, not color.
        const fish = fishModel.clone(true);
        const rng = spawn.rng;      // fixed draw order → same fish every visit
        const scale = 0.6 + rng() * 0.7;
        const orbitR = 0.9 + rng() * 1.4;
        const speed = 0.25 + rng() * 0.45;             // rad/s — lazy
        const dir = rng() < 0.5 ? 1 : -1;
        const phase0 = rng() * TAU;
        const bobAmp = 0.08 + rng() * 0.1;             // small: never surfaces
        const bobFreq = 0.6 + rng() * 0.8;
        const bobPhase = rng() * TAU;
        fish.scale.multiplyScalar(scale);
        fish.userData.sw = { orbitR, speed, dir, phase0, bobAmp, bobFreq, bobPhase };
        // Start ON the orbit so frame one doesn't pop from the center.
        fish.position.set(Math.cos(phase0) * orbitR, 0, Math.sin(phase0) * orbitR);
        fish.rotation.y = (dir > 0 ? -phase0 : Math.PI - phase0) + FISH_FORWARD;
        return fish;
      },
      update(fish, _delta, elapsed) {
        // Refresh the shared player-position cache at ~8Hz (not per fish).
        if (elapsed - pollAt >= 0.12 || elapsed < pollAt) {
          pollAt = elapsed;
          const ps = XRPublisher.getPlayerState && XRPublisher.getPlayerState();
          if (ps) { px = ps.x; pz = ps.z; hasPlayer = true; }
        }
        if (hasPlayer) {
          _wp.setFromMatrixPosition(fish.matrixWorld); // 3 float copies, no math
          const dx = _wp.x - px, dz = _wp.z - pz;
          // Beyond the LOD ring: skip everything. Motion below is a pure
          // function of `elapsed`, so a skipped fish never drifts — it snaps
          // to the exact right point on its orbit when you swim back in range.
          if (dx * dx + dz * dz > FISH_LOD_DIST_SQ) return;
        }
        // LOCAL-space swim: the engine wrapper OWNS the water-column placement
        // ('submerged' seats it mid-column); this motion is relative to that
        // point — the documented contract for dynamic water decorations.
        const s = fish.userData.sw;
        const a = s.phase0 + s.dir * s.speed * elapsed;
        fish.position.x = Math.cos(a) * s.orbitR;
        fish.position.z = Math.sin(a) * s.orbitR;
        fish.position.y = Math.sin(elapsed * s.bobFreq + s.bobPhase) * s.bobAmp;
        // Nose along the orbit tangent (closed form — no atan2 per fish).
        fish.rotation.y = (s.dir > 0 ? -a : Math.PI - a) + FISH_FORWARD;
      },
      // The clones SHARE the model's geometry/materials by reference, so the
      // default cleanup (which disposes geometry) would break every other
      // fish. No-op: the cached model owns those resources for the session.
      dispose() {},
    });

    console.log(`[${PLUGIN_ID}] waterPlacement showcase registered — kelp (floor) + fish (submerged) + lily pads (surface)`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
