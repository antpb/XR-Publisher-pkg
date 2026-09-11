/**
 * campfires — XR Publisher decoration plugin (tended campsites, shared across visitors)
 *
 * A living campsite scattered through the grass: the stone ring / char disc /
 * log teepee on a dirt groundPatch clearing (this plugin's original teaching
 * headline, kept intact), now dressed with seeded seating and a camp prop,
 * topped by a LIVE fire — and TENDABLE. Walk up, press E to light or
 * extinguish it, and the fire's state is SHARED: everyone in the room sees
 * the flip live, and later visitors find the camp the way the last camper
 * left it. farm-plots is the MAXIMAL world-state demo (5-stage lifecycle,
 * inventory HUD, soil tints); this is its MINIMAL sibling — ONE boolean
 * record per fire is all it takes to make a world feel inhabited.
 *
 * WHAT THIS DEMONSTRATES
 *   • groundPatch { radius, color, clearGrass } — a dirt clearing painted on
 *     the terrain around each spawn with grass cleared out of it, on BOTH
 *     renderers, so the camp reads as a deliberate, lived-in spot. Other
 *     decorations are skipped inside the patch.
 *   • LIVE FIRE WITH ZERO SCENE LIGHTS (hard engine contract: scene light
 *     count must stay constant after load — a PointLight per campfire would
 *     recompile every material in the world as chunks stream). Flames are
 *     crossed quads with a black-albedo + emissiveMap material (the
 *     `stockEmissive` trick: punches the bloom threshold in worlds that
 *     enable postFX, reads bright anyway), smoke is 3 recycled fading puffs,
 *     sparks are additive motes, and "firelight" on the ground is an
 *     additive glow disc scaled by the flicker. All depth-TESTED — never
 *     depthTest:false (terrain render bundles ignore renderOrder; depth-
 *     disabled quads paint BEHIND the world).
 *   • update() DISCIPLINE: allocation-free (one module scratch Vector3,
 *     nothing constructed per frame), distance-LOD cadence (full rate <40u,
 *     20Hz to 90u, skipped entirely beyond), ~8Hz housekeeping for the range
 *     check / cheap yaw billboarding / day-night glow boost
 *     (getTimeOfDay()), a document.hidden short-circuit, and ONE shared-
 *     material ember pulse guarded to run once per frame no matter how many
 *     fires are live.
 *   • interactable + interactionPrompt AS A FUNCTION — re-resolved ~10Hz by
 *     the engine, so the prompt flips "Light campfire" ⇄ "Extinguish
 *     campfire" with the state, no re-registration.
 *   • PERSISTED SHARED STATE (the world-state API, minimal form): one tiny
 *     record { lit, t } keyed by the deterministic spawn.seed, TTL a few
 *     hours so untended camps relax back to the deterministic default.
 *     Positions come from spawn.renderPosition — render-frame world XZ (the
 *     frame setWorldState positions and the player live in) for every anchor
 *     type, no correction needed. (The legacy spawn.worldPosition was
 *     worker-frame and needed a −½-chunk shift; treat it as deprecated —
 *     see docs/21-decoration-spawn-context.md.) create() reads
 *     getWorldState SYNCHRONOUSLY (safe — it's a snapshot) and kicks one
 *     MOUNT-GATED fetchWorldState({ prefix, maxAgeMs }) per chunk (N fires
 *     in a chunk coalesce to one HTTP request; remounts inside the window
 *     cost none; roaming campless terrain costs nothing).
 *     subscribeWorldState flips live fires when a peer tends one — and
 *     because setWorldState applies optimistically, YOUR toggle arrives
 *     through the same path. Every piece is feature-detected: without the
 *     API the plugin degrades to a session-only Map and still works.
 *   • Explicit colliders via userData.xrColliders — the visual is dozens of
 *     small meshes; the auto-cuboid path would wrap every stone in its own
 *     box. Instead: one low box over the fire ring + one per seat/prop.
 *     update() animates only NON-collidable children (flames/smoke/sparks),
 *     never the root — colliders don't follow moved objects.
 *   • Shared GPU resources: every geometry and almost every material is a
 *     module-level singleton. The one justified exception: each smoke puff
 *     owns a cloned material (per-puff opacity fade needs it; the texture —
 *     the expensive part — stays shared), disposed in dispose(). Because
 *     the geometry is ALL shared, dispose() deliberately does NOT run the
 *     usual traverse-and-dispose (that would free geometry still used by
 *     every other campfire).
 *
 * Deterministic: stones, teepee, seats, and the camp prop all draw from
 * spawn.rng in a FIXED order — same seed ⇒ same camp, every visit, every
 * renderer. Even the flame flicker phases are seeded, so a camp's fire
 * dances the same way each time you return.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'campfires';

  // ── Configure me ──────────────────────────────────────────────────────────
  const DENSITY = 0.8;            // camps per 100×100u chunk
  const MIN_SPACING = 30;         // between camps within a chunk
  const PATCH_RADIUS = 5;         // dirt clearing (covers ring + seats + prop)
  const DEFAULT_LIT = true;       // a camp nobody has touched burns — the
                                  // deterministic default the TTL resets to
  const STATE_TTL_S = 4 * 3600;   // untended records expire after ~4h
  const STATE_FRESH_MS = 45e3;    // chunk re-entry inside this window = no HTTP
  const FULL_RATE_DIST = 40;      // <40u: animate every frame
  const SKIP_DIST = 90;           // >90u: skip animation entirely
  const SMOKE_PUFFS = 3;          // recycled puff quads per fire
  const SPARK_COUNT = 3;          // drifting spark motes per fire
  // ──────────────────────────────────────────────────────────────────────────

  let registered = false;

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  // Chunk prefix from a spawn.seed: strip the trailing `-gx-gz` cell coords,
  // leaving `${worldSeed}-decoration-campfire-cx-cz-` — the natural query for
  // "all campfire records in this chunk" (same helper as farm-plots).
  const chunkPrefixOf = (seed) => {
    const a = seed.lastIndexOf('-');
    const b = seed.lastIndexOf('-', a - 1);
    return seed.slice(0, b + 1);
  };

  // seed → mounted fire group, for subscribeWorldState to flip live camps.
  const liveFires = new Map();
  // No-world-state fallback: this session's toggles only.
  const sessionLit = new Map();

  // ── Canvas textures (shared — one soft disc, one flame gradient) ──────────
  const makeDiscTex = (THREE) => {
    const S = 64;
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  const makeFlameTex = (THREE) => {
    const W = 64, H = 96;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    // Bright core low in the quad, cooling outward — the quad's bottom pivot
    // plus vertical scale flicker does the "licking" so the texture stays soft.
    const g = ctx.createRadialGradient(W / 2, 62, 3, W / 2, 54, 50);
    g.addColorStop(0, 'rgba(255,246,200,0.95)');
    g.addColorStop(0.28, 'rgba(255,184,70,0.85)');
    g.addColorStop(0.62, 'rgba(255,98,20,0.4)');
    g.addColorStop(1, 'rgba(255,60,8,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || !THREE) { console.error(`[${PLUGIN_ID}] runtime not available`); return; }

    // Feature-detect the OPTIONAL world-state API — without it the campsite
    // still works, tending just doesn't outlive this session.
    const HAS_STATE = typeof XRPublisher.setWorldState === 'function'
      && typeof XRPublisher.getWorldState === 'function'
      && typeof XRPublisher.subscribeWorldState === 'function'
      && typeof XRPublisher.fetchWorldState === 'function';

    // ── Shared GPU resources (module singletons — one set for ALL camps) ────
    const TEX = { disc: makeDiscTex(THREE), flame: makeFlameTex(THREE) };
    const GEO = {
      stone: new THREE.DodecahedronGeometry(1, 0),           // scaled per stone
      charDisc: new THREE.CylinderGeometry(0.7, 0.7, 0.04, 16),
      teepeeLog: new THREE.CylinderGeometry(0.07, 0.1, 1.1, 6),
      ember: new THREE.IcosahedronGeometry(0.28, 0),
      seatLog: new THREE.CylinderGeometry(0.17, 0.19, 1.5, 7),
      stump: new THREE.CylinderGeometry(0.26, 0.33, 0.42, 8),
      smallLog: new THREE.CylinderGeometry(0.07, 0.085, 0.95, 6),
      post: new THREE.CylinderGeometry(0.045, 0.055, 1.45, 5),
      bar: new THREE.CylinderGeometry(0.03, 0.03, 1.85, 5),
      fabric: new THREE.PlaneGeometry(0.36, 0.52),
      bedroll: new THREE.CapsuleGeometry(0.3, 1.05, 3, 8),
      pillow: new THREE.CylinderGeometry(0.13, 0.13, 0.55, 8),
      // Flame pivot at the BOTTOM so vertical scale flicker stretches upward.
      flame: new THREE.PlaneGeometry(0.8, 1.15).translate(0, 0.55, 0),
      puff: new THREE.PlaneGeometry(1, 1),
      glow: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    };
    const MAT = {
      stone: new THREE.MeshStandardMaterial({ color: 0x6f6a63, roughness: 1 }),
      log: new THREE.MeshStandardMaterial({ color: 0x4a3526, roughness: 0.9 }),
      cutWood: new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.95 }),
      char: new THREE.MeshStandardMaterial({ color: 0x161310, roughness: 1 }),
      fabric: new THREE.MeshStandardMaterial({ color: 0x7d4b3a, roughness: 1 }),
      // Lit embers: the bloom-catcher. Black-ish albedo + strong emissive =
      // glows day and night, blooms if the world enables postFX, and needs
      // NO scene light. Its emissiveIntensity is pulsed once per frame below.
      emberLit: new THREE.MeshStandardMaterial({ color: 0x2a130a, emissive: 0xff3d08, emissiveIntensity: 1.5 }),
      emberCold: new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 1 }),
      // Flames: `stockEmissive` shaped by a texture — black albedo kills the
      // lit term, emissiveMap × white emissive carries the color, the map's
      // alpha carries the cutout. Additive so the crossed quads sum hot.
      flame: new THREE.MeshStandardMaterial({
        color: 0x000000, emissive: 0xffffff, emissiveIntensity: 2.2,
        map: TEX.flame, emissiveMap: TEX.flame,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, roughness: 1, metalness: 0,
      }),
      spark: new THREE.MeshStandardMaterial({
        color: 0x000000, emissive: 0xffb257, emissiveIntensity: 2.6,
        map: TEX.disc, emissiveMap: TEX.disc,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, roughness: 1, metalness: 0,
      }),
      // Smoke BASE — cloned per puff (per-puff opacity fade), texture shared.
      smokeBase: new THREE.MeshBasicMaterial({
        map: TEX.disc, color: 0x8b8681, transparent: true, opacity: 0.3,
        depthWrite: false, side: THREE.DoubleSide,
      }),
      // Fake firelight on the ground: additive disc, depth-TESTED, flickered
      // by scale in update(). Unlit basic material — it must not bloom.
      glow: new THREE.MeshBasicMaterial({
        map: TEX.disc, color: 0xff7a26, transparent: true, opacity: 0.16,
        depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    };

    // Module scratch — update() must never allocate.
    const V = new THREE.Vector3();
    // Once-per-frame guard for the SHARED ember material pulse (all lit fires
    // share MAT.emberLit; only the first fire updated each frame writes it).
    let emberTick = -1;

    // ── State model: { lit: boolean, t: epoch ms } keyed by spawn.seed ──────
    const isLit = (seed) => {
      if (HAS_STATE) {
        const rec = XRPublisher.getWorldState(PLUGIN_ID, seed);
        return rec && rec.value && typeof rec.value.lit === 'boolean' ? rec.value.lit : DEFAULT_LIT;
      }
      return sessionLit.has(seed) ? sessionLit.get(seed) : DEFAULT_LIT;
    };

    const setVisuals = (u, lit) => {
      u.flameHolder.visible = lit;
      u.smoke.visible = lit;
      u.sparks.visible = lit;
      u.glow.visible = lit;
      // Material SWAP (not a new material) between two module singletons —
      // plugin decorations mount outside the WebGPU render bundles precisely
      // so swaps like this are safe.
      u.ember.material = lit ? MAT.emberLit : MAT.emberCold;
    };
    const applyState = (group, lit) => {
      const u = group.userData;
      if (u.lit === lit) return;
      u.lit = lit;
      setVisuals(u, lit);
    };

    if (HAS_STATE) {
      // Peers' toggles, chunk fetches, AND our own optimistic writes all land
      // here — one convergence path for every source of truth.
      XRPublisher.subscribeWorldState((plugin, key) => {
        if (plugin !== PLUGIN_ID) return;
        const g = liveFires.get(key);
        if (g) applyState(g, isLit(key));
      });
    }

    XRPublisher.registerDecoration({
      // Name unchanged from v1 on purpose: the name seeds placement, so a
      // rename would relocate every existing campfire in every world.
      name: 'campfire',
      density: DENSITY,
      surface: 'grass',          // build them ON grass…
      maxSlope: 0.2,
      minSpacing: MIN_SPACING,
      collision: true,           // …with EXPLICIT colliders (userData.xrColliders)
      // The original headline, kept: a dirt clearing painted on the terrain
      // around the fire, grass cleared, so the campsite reads as a deliberate,
      // lived-in spot rather than an object dropped in grass.
      groundPatch: {
        radius: PATCH_RADIUS,
        color: [0.30, 0.21, 0.13],
        clearGrass: true,
      },

      // "E to interact" with a STATEFUL prompt — the engine re-resolves this
      // function at its ~10Hz proximity cadence, so keep it a cheap map read.
      interactable: true,
      interactionRadius: 5,
      interactionPrompt: (spawn) => (isLit(spawn.seed) ? 'Extinguish campfire' : 'Light campfire'),
      onInteract(ctx) {
        const seed = ctx.spawn.seed;
        const lit = !isLit(seed);
        if (HAS_STATE) {
          // renderPosition is RENDER-frame world XZ — no correction needed.
          // The server enforces a ~32u writer-distance rule around this point;
          // interactionRadius 5 keeps us comfortably inside it.
          const wx = ctx.spawn.renderPosition[0], wz = ctx.spawn.renderPosition[2];
          XRPublisher.setWorldState(PLUGIN_ID, seed, { lit, t: Date.now() }, {
            pos: [wx, wz],
            ttlSeconds: STATE_TTL_S,
          });
          // The optimistic local apply fires subscribeWorldState → the fire
          // flips this frame; peers and the API converge behind it.
        } else {
          sessionLit.set(seed, lit);
        }
        applyState(ctx.object, lit);   // belt-and-braces immediate flip
      },

      create(spawn) {
        const rng = spawn.rng;
        const fire = new THREE.Group();
        // Static dressing lives in its own subtree so we can matrix-freeze it;
        // animated children (flames/smoke/sparks/glow) stay auto-updating.
        const staticG = new THREE.Group();
        fire.add(staticG);
        const colliders = [];
        // Seats/props sit 2-3u out where a 0.2-slope hillside can drop half a
        // unit — seat each on its OWN ground height (relative to the origin
        // plane), with a flat fallback for older runtimes.
        const gy = spawn.groundHeightAt || (() => 0);

        // Ring of fieldstones sitting on the dirt — sells the "made spot".
        // (Shared unit geometry, per-stone non-uniform scale — no per-spawn
        // geometry anywhere in this plugin.)
        const stones = 8 + Math.floor(rng() * 3);
        const ringR = 0.85;
        for (let i = 0; i < stones; i++) {
          const s = new THREE.Mesh(GEO.stone, MAT.stone);
          const a = (i / stones) * Math.PI * 2 + rng() * 0.2;
          const sc = 0.18 + rng() * 0.12;
          s.position.set(Math.cos(a) * ringR, 0.06, Math.sin(a) * ringR);
          s.rotation.set(rng() * 3, rng() * 3, rng() * 3);
          s.scale.set(sc, sc * (0.7 + rng() * 0.4), sc);   // squashed, half-buried
          staticG.add(s);                                   // pebbles don't cast shadows
        }

        // Charred ground disc inside the ring.
        const char = new THREE.Mesh(GEO.charDisc, MAT.char);
        char.position.y = 0.02;
        staticG.add(char);

        // Teepee of logs leaning inward.
        const logs = 4 + Math.floor(rng() * 2);
        for (let i = 0; i < logs; i++) {
          const log = new THREE.Mesh(GEO.teepeeLog, MAT.log);
          const a = (i / logs) * Math.PI * 2 + rng() * 0.3;
          log.position.set(Math.cos(a) * 0.28, 0.45, Math.sin(a) * 0.28);
          log.rotation.set(0, -a, 0.45);                    // lean the top toward centre
          log.castShadow = true;
          staticG.add(log);
        }
        // One low box over the whole ring instead of a cuboid per stone/log.
        colliders.push({ half: [1.05, 0.35, 1.05], position: [0, 0.35, 0] });

        // Ember mound at the base — material swaps lit ⇄ cold.
        const ember = new THREE.Mesh(GEO.ember, MAT.emberLit);
        ember.position.y = 0.18;
        staticG.add(ember);

        // ── Seating: 2-3 logs/stumps in seats+1 slots around the fire (the
        // spare slot holds the camp prop, so they never collide). ────────────
        const seats = 2 + (rng() < 0.5 ? 1 : 0);
        const slots = seats + 1;
        const seatBase = rng() * Math.PI * 2;
        for (let i = 0; i < seats; i++) {
          const a = seatBase + (i / slots) * Math.PI * 2 + (rng() - 0.5) * 0.35;
          const r = 1.95 + rng() * 0.55;
          const x = Math.cos(a) * r, z = Math.sin(a) * r;
          const gv = gy(x, z);
          if (rng() < 0.62) {
            // Log bench, tangent to the fire circle so it faces the flames.
            const yaw = Math.PI / 2 - a + (rng() - 0.5) * 0.5;
            const m = new THREE.Mesh(GEO.seatLog, MAT.log);
            m.position.set(x, gv + 0.16, z);
            m.rotation.set(0, yaw, Math.PI / 2);            // lie it down, then yaw
            m.castShadow = true;
            staticG.add(m);
            colliders.push({ half: [0.78, 0.2, 0.2], position: [x, gv + 0.18, z], rotation: [0, yaw, 0] });
          } else {
            const m = new THREE.Mesh(GEO.stump, MAT.cutWood);
            m.position.set(x, gv + 0.18, z);
            m.rotation.set((rng() - 0.5) * 0.08, rng() * Math.PI, 0);
            m.castShadow = true;
            staticG.add(m);
            colliders.push({ half: [0.3, 0.23, 0.3], position: [x, gv + 0.21, z] });
          }
        }

        // ── Camp prop (seeded variant): firewood stack / drying rack / bedroll
        {
          const pa = seatBase + (seats / slots) * Math.PI * 2 + (rng() - 0.5) * 0.3;
          const pr = 2.4 + rng() * 0.7;
          const px = Math.cos(pa) * pr, pz = Math.sin(pa) * pr;
          const pg = gy(px, pz);
          const pick = rng();
          const pyaw = rng() * Math.PI * 2;
          // With rotation.set(0, yaw, π/2) a cylinder's length runs along the
          // yaw-rotated X axis; (sin yaw, 0, cos yaw) is its horizontal perp.
          const perpX = Math.sin(pyaw), perpZ = Math.cos(pyaw);
          const axX = -Math.cos(pyaw), axZ = Math.sin(pyaw);
          if (pick < 0.4) {
            // Firewood stack: 3 logs + 2 stacked in the notches.
            const offs = [-0.19, 0, 0.19, -0.1, 0.1];
            for (let i = 0; i < 5; i++) {
              const lm = new THREE.Mesh(GEO.smallLog, MAT.log);
              lm.position.set(px + perpX * offs[i], pg + (i < 3 ? 0.085 : 0.235), pz + perpZ * offs[i]);
              lm.rotation.set(0, pyaw + (rng() - 0.5) * 0.12, Math.PI / 2);
              lm.castShadow = i < 3;
              staticG.add(lm);
            }
            colliders.push({ half: [0.5, 0.3, 0.32], position: [px, pg + 0.3, pz], rotation: [0, pyaw, 0] });
          } else if (pick < 0.72) {
            // Drying rack: two posts, a crossbar, two hanging cloths.
            for (const s of [-0.8, 0.8]) {
              const post = new THREE.Mesh(GEO.post, MAT.log);
              post.position.set(px + axX * s, pg + 0.66, pz + axZ * s);
              post.rotation.z = (rng() - 0.5) * 0.06;
              post.castShadow = true;
              staticG.add(post);
            }
            const bar = new THREE.Mesh(GEO.bar, MAT.log);
            bar.position.set(px, pg + 1.34, pz);
            bar.rotation.set(0, pyaw, Math.PI / 2);
            bar.castShadow = true;
            staticG.add(bar);
            for (const s of [-0.42, 0.14]) {
              const cloth = new THREE.Mesh(GEO.fabric, MAT.fabric);
              cloth.position.set(px + axX * s, pg + 1.07, pz + axZ * s);
              cloth.rotation.y = pyaw + (rng() - 0.5) * 0.2;
              staticG.add(cloth);
            }
            colliders.push({ half: [0.88, 0.72, 0.08], position: [px, pg + 0.72, pz], rotation: [0, pyaw, 0] });
          } else {
            // Bedroll: flattened capsule + rolled pillow. Ankle-height — no
            // collider, you can walk over it.
            const bed = new THREE.Mesh(GEO.bedroll, MAT.fabric);
            bed.position.set(px, pg + 0.17, pz);
            bed.rotation.set(0, pyaw, Math.PI / 2);
            bed.scale.set(0.55, 1, 1);       // local X is vertical once lying — flatten
            bed.castShadow = true;
            staticG.add(bed);
            const pil = new THREE.Mesh(GEO.pillow, MAT.fabric);
            pil.position.set(px + axX * 0.62, pg + 0.13, pz + axZ * 0.62);
            pil.rotation.set(0, pyaw + Math.PI / 2, Math.PI / 2);
            staticG.add(pil);
          }
        }

        // ── The live fire: flames, smoke, sparks, ground glow ───────────────
        const flameHolder = new THREE.Group();   // yaw-billboarded at ~8Hz
        flameHolder.position.y = 0.3;
        const flames = [];
        for (let i = 0; i < 3; i++) {
          const f = new THREE.Mesh(GEO.flame, MAT.flame);
          f.rotation.y = i * (Math.PI / 3);      // crossed fan: 0° / 60° / 120°
          // Seeded flicker params — even the fire dance is deterministic.
          f.userData = {
            ph: rng() * Math.PI * 2,
            sp: 5.5 + rng() * 3,
            bw: 0.9 + rng() * 0.25,
            bh: 0.95 + rng() * 0.3,
          };
          flames.push(f);
          flameHolder.add(f);
        }
        fire.add(flameHolder);

        const smoke = new THREE.Group();
        const ownedMats = [];                    // per-puff clones → dispose()
        const puffs = [];
        for (let i = 0; i < SMOKE_PUFFS; i++) {
          const m = MAT.smokeBase.clone();       // clone shares the texture
          ownedMats.push(m);
          const p = new THREE.Mesh(GEO.puff, m);
          p.userData = { ph: i / SMOKE_PUFFS + rng() * 0.1 };  // staggered lives
          p.scale.setScalar(0.001);              // parked until first update
          puffs.push(p);
          smoke.add(p);
        }
        fire.add(smoke);

        const sparks = new THREE.Group();
        const sparkQuads = [];
        for (let i = 0; i < SPARK_COUNT; i++) {
          const s = new THREE.Mesh(GEO.puff, MAT.spark);
          s.userData = { ph: rng(), sp: 0.55 + rng() * 0.5 };
          s.scale.setScalar(0.001);
          sparkQuads.push(s);
          sparks.add(s);
        }
        fire.add(sparks);

        const glow = new THREE.Mesh(GEO.glow, MAT.glow);
        glow.position.y = 0.07;                  // above the char disc, no z-fight
        fire.add(glow);

        // Freeze the static dressing — matrices computed once, never again.
        staticG.traverse((o) => { o.updateMatrix(); o.matrixAutoUpdate = false; });

        fire.userData.__seed = spawn.seed;
        fire.userData.__ownedMats = ownedMats;
        Object.assign(fire.userData, {
          flameHolder, flames, smoke, puffs, sparks, sparkQuads, glow, ember,
          lit: isLit(spawn.seed),
          // Per-fire animation state (update() reads/writes ONLY these).
          phase: rng() * 100,                    // desyncs neighbouring fires
          windX: (rng() - 0.5) * 1.6,            // smoke drift direction
          windZ: (rng() - 0.5) * 1.6,
          hk: rng() * 0.12,                      // housekeeping accumulator (staggered)
          acc: 0, yaw: 0, far: false, mid: false, glowBase: 3.8,
        });
        setVisuals(fire.userData, fire.userData.lit);
        fire.userData.xrColliders = colliders;

        if (HAS_STATE) {
          liveFires.set(spawn.seed, fire);
          // MOUNT-GATED fetch: runs only when a chunk that actually contains
          // a campfire mounts. maxAgeMs + the core's request coalescing mean
          // N fires per chunk cost one HTTP request, remounts inside the
          // window cost none, and campless terrain costs nothing. Late state
          // lands through subscribeWorldState above.
          XRPublisher.fetchWorldState(PLUGIN_ID, {
            prefix: chunkPrefixOf(spawn.seed),
            maxAgeMs: STATE_FRESH_MS,
          }).catch(() => {});
        }
        return fire;
      },

      // Runs per fire per frame — the budget discipline lives here.
      update(fire, delta, elapsed) {
        const u = fire.userData;
        if (!u.lit) return;                              // cold camp = fully static
        if (document.hidden) return;                     // backgrounded tab = free

        // ~8Hz housekeeping: distance LOD, billboard yaw, day-night glow.
        u.hk += delta;
        if (u.hk >= 0.12) {
          u.hk = 0;
          const ps = XRPublisher.getPlayerState && XRPublisher.getPlayerState();
          if (ps) {
            fire.getWorldPosition(V);                    // scratch — no alloc
            const dx = ps.x - V.x, dz = ps.z - V.z;
            const d2 = dx * dx + dz * dz;
            u.far = d2 > SKIP_DIST * SKIP_DIST;
            u.mid = d2 > FULL_RATE_DIST * FULL_RATE_DIST;
            // Cheap billboard: yaw the flame fan toward the player. Crossed
            // quads read from every angle anyway — this just keeps the widest
            // face toward you. Low cadence is plenty.
            u.yaw = Math.atan2(dx, dz);
          }
          if (!u.far) {
            u.flameHolder.rotation.y = u.yaw;
            // Day/night awareness: firelight carries further after sundown
            // (sun is up 6.5→20.5 on the engine's shared timeline).
            let night = false;
            if (typeof XRPublisher.getTimeOfDay === 'function') {
              const tod = XRPublisher.getTimeOfDay();
              night = !!tod && (tod.time < 6.5 || tod.time > 20.5);
            }
            u.glowBase = night ? 4.8 : 3.8;
          }
        }
        if (u.far) return;                               // >90u: skip everything

        // Distance-LOD cadence: 40-90u fires animate at 20Hz. dt accumulates
        // so the animation is time-based either way (phases key off elapsed).
        u.acc += delta;
        if (u.mid && u.acc < 1 / 20) return;
        u.acc = 0;

        const t = elapsed + u.phase;

        // Flames: two-sine scale flicker, stretching up from the bottom pivot.
        const fl = u.flames;
        for (let i = 0; i < fl.length; i++) {
          const f = fl[i], d = f.userData;
          const w = Math.sin(t * d.sp + d.ph) * 0.5 + Math.sin(t * d.sp * 2.33 + d.ph * 1.7) * 0.5;
          f.scale.set(d.bw * (1 - w * 0.12), d.bh * (1 + w * 0.22), 1);
        }

        // Smoke: 3 recycled puffs on staggered loops — rise, drift downwind,
        // grow, fade. Per-puff opacity is why each puff owns a material clone.
        const puffs = u.puffs;
        for (let i = 0; i < puffs.length; i++) {
          const p = puffs[i], d = p.userData;
          const life = (t * 0.15 + d.ph) % 1;
          p.position.set(
            Math.sin(t * 0.6 + d.ph * 9) * 0.12 + u.windX * life,
            0.95 + life * 3.3,
            Math.cos(t * 0.5 + d.ph * 7) * 0.12 + u.windZ * life,
          );
          const s = 0.5 + life * 2.0;
          p.scale.set(s, s, 1);
          p.rotation.y = u.yaw;                          // single quads DO need the billboard
          p.material.opacity = 0.34 * Math.min(1, life * 6) * (1 - life);
        }

        // Sparks: tiny additive motes spiralling up, fading by SCALE so they
        // can share one material.
        const sq = u.sparkQuads;
        for (let i = 0; i < sq.length; i++) {
          const s = sq[i], d = s.userData;
          const life = (t * d.sp + d.ph) % 1;
          const r = 0.18 * (1 - life * 0.4);
          s.position.set(
            Math.sin(t * 2.1 + d.ph * 11) * r,
            0.45 + life * 1.6,
            Math.cos(t * 1.7 + d.ph * 13) * r,
          );
          const sc = 0.09 * (1 - life);
          s.scale.set(sc, sc, 1);
          s.rotation.y = u.yaw;
        }

        // Ground glow: flicker in sympathy with the flames, wider at night.
        const gs = u.glowBase * (1 + Math.sin(t * 9.3) * 0.08 + Math.sin(t * 14.7) * 0.05);
        u.glow.scale.set(gs, 1, gs);

        // Ember pulse — SHARED material, so write it exactly once per frame
        // no matter how many fires are live (elapsed is frame-identical).
        if (emberTick !== elapsed) {
          emberTick = elapsed;
          MAT.emberLit.emissiveIntensity = 1.45 + Math.sin(elapsed * 6.7) * 0.3 + Math.sin(elapsed * 11.9) * 0.15;
        }
      },

      dispose(object) {
        const seed = object.userData.__seed;
        // Guard by IDENTITY: the engine defers dispose() a frame while React
        // runs cleanup BEFORE the next effect body, so a chunk re-scatter
        // calls create(new) before dispose(old) for the same seed —
        // deleting by seed alone would evict the live entry.
        if (seed && liveFires.get(seed) === object) liveFires.delete(seed);
        // Every geometry (and all but one material) is a MODULE SINGLETON
        // shared by every campfire — so, unlike the default cleanup, we must
        // NOT traverse-and-dispose geometry here. The only per-spawn GPU
        // resources are the cloned smoke materials (their texture is shared
        // and survives; material.dispose() doesn't touch .map).
        for (const m of object.userData.__ownedMats || []) m.dispose();
      },

      // Test hook: the ONE pure helper worth asserting from a harness — the
      // world-state prefix a chunk's spawns share. The state machine itself
      // (isLit/applyState) stays closure-private; it reads live module state,
      // so it is exercised through the interaction path, not from here.
      __test: { chunkPrefixOf },
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] registered — tended campsites (E to light/extinguish)${
      HAS_STATE ? ' + shared persisted fire state' : ' (session-only state — no world-state API)'}`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
