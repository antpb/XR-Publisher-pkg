/**
 * ancient-ruins — XR Publisher decoration plugin (discoverable STORY sites)
 *
 * A believable ruin you can READ, not just walk past: a worn FLAGSTONE floor
 * laid into the terrain, framed by a dirt apron that blends it into the meadow,
 * a ring of broken moss-footed columns standing on it — and at the centre a
 * plinth carrying a worn inscription. Press E and an in-world dialog tells you
 * this ruin's name and history, generated from its seed: every site has a
 * stable identity (same seed → same name, same lore, every visit, every
 * renderer). Built entirely from the public API — no engine changes.
 *
 * WHAT THIS DEMONSTRATES
 *   • registerTerrainSurface('flagstone') — Worley/cellular ground material in
 *     weathered stone tones with mossy grout, composited into the ONE shared
 *     terrain material on WebGPU; WebGL gets the flat fallbackColor.
 *   • addTerrainRegion(...) — paints the flagstone circle under each site,
 *     centred straight on spawn.renderPosition: render-frame world XZ (the
 *     frame regions paint in) for every anchor type, no correction needed.
 *     (The legacy spawn.worldPosition was worker-frame and needed a −½-chunk
 *     shift; treat it as deprecated.) groundPatch needs no world coords at
 *     all — the engine places it around the spawn for you.
 *   • MERGED, VERTEX-COLOURED architecture: every stone part (plinth, columns,
 *     broken arch, drum trail, cracked fragments) is baked through a tiny
 *     writer into ONE BufferGeometry / ONE draw call per ruin. Stone tone AND
 *     moss creep (green darkening on the lower ~0.5u of columns and on the
 *     ground-contact side of fallen drums) live in the `color` attribute, so
 *     one shared white MeshStandardMaterial serves every ruin ever spawned.
 *   • Seeded VARIETY from spawn.rng in a fixed draw order: broken column ring,
 *     a collapsed arch on one side (two columns, one intact springer stone, a
 *     partial lintel propped where it fell), a trail of fallen drums walking
 *     away from the ring (progressively swallowed by the grass), fragments at
 *     the column feet — and a rare (~1 in 8, seeded) "intact sanctum" variant:
 *     taller ring, more standing columns, and a complete architrave section
 *     still bridging 2-3 of them.
 *   • LORE via `interactable` + a STATEFUL `interactionPrompt` FUNCTION +
 *     `openDialog`: the prompt reads "Read the worn inscription" until you've
 *     read it this session, then shows the ruin's name (a session Set — cheap
 *     lookups, re-resolved ~10Hz by the engine). The dialog is a 2-page chain:
 *     a `keepOpen` "Look closer" button opens the second page from onSelect.
 *   • NIGHT reading light without lights: a faint emissive GLYPH BAND around
 *     the plinth (one shared material, canvas emissiveMap). Emissive reads at
 *     night and blooms if a world enables postFX; scene light count stays
 *     constant (hard engine contract — never add PointLights from a plugin).
 *   • Solid via EXPLICIT colliders (userData.xrColliders): the visual geometry
 *     is merged into one mesh, so the engine's auto-cuboid path would wrap the
 *     whole site in one impassable box. We author one cuboid per standing
 *     column + the plinth instead; drums and fragments stay walk-over.
 *
 * WHY THERE IS NO update() LOOP: this is a dense STATIC site — with no
 * `update` in the spec the engine freezes every matrix after placement and the
 * ruin costs nothing per frame. Nothing here needs animation (the glyph band
 * "responds" to night purely by being emissive), so a per-frame callback would
 * be unjustified cost multiplied across every spawned ruin.
 *
 * Deterministic: layout and variant come from spawn.rng in a fixed draw order;
 * lore comes from a DEDICATED alea(seed + '-lore') stream so reading order can
 * never perturb the architecture. Same seed ⇒ same ruin, same name, same story.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'ancient-ruins';
  const SURFACE_ID = 'flagstone';

  // ── Configure me ──────────────────────────────────────────────────────────
  const FLOOR_RADIUS = 16;        // flagstone floor radius (world units)
  const DIRT_RADIUS = 22;         // dirt apron radius (must be > FLOOR_RADIUS)
  const SURFACE_SCALE = 0.45;     // slabs per world unit
  const SURFACE_GROUT = 0.09;     // mossy grout width
  const COLUMN_RING = 10;         // column ring radius (inside the floor)
  const COLUMN_COUNT = 7;         // broken columns in a common ruin
  const SANCTUM_COLUMNS = 9;      // ...more survive in a sanctum
  const SANCTUM_CHANCE = 1 / 8;   // seeded odds of the intact-sanctum variant
  const SANCTUM_HEIGHT = 5.2;     // full column height in a sanctum
  const MOSS_HEIGHT = 0.5;        // moss creep band above ground contact
  // Stone palette — baked into vertex colours (the shared material is white).
  const TONE_STONE = [0.72, 0.69, 0.62];   // weathered limestone shafts
  const TONE_DARK = [0.57, 0.54, 0.47];    // plinth, bases, drums, lintels
  const TONE_FRAG = [0.52, 0.50, 0.44];    // cracked fragments
  const TONE_MOSS = [0.28, 0.40, 0.23];    // creep target (darken + green)
  // ──────────────────────────────────────────────────────────────────────────

  let registered = false;

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  // ── Custom terrain surface: flagstone (Worley cells, weathered stone) ───────
  function registerSurface(XRPublisher) {
    const T = XRPublisher.tsl;
    const { Fn, vec2, vec3, vec4, float, floor, fract, sin, dot, length, min, mix, select, smoothstep } = T;
    const hash2 = Fn(([p]) => fract(
      sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))).mul(43758.5453),
    ));
    const hash1 = Fn(([p]) => fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453)));

    XRPublisher.registerTerrainSurface({
      id: SURFACE_ID,
      fallbackColor: [0.47, 0.44, 0.39],   // weathered stone (WebGL flat fallback)
      tsl: ({ localXZ, params, tint }) => Fn(() => {
        const scale = params.y.max(float(0.001));
        const grout = params.z.max(float(0.001));
        const uv = localXZ.mul(scale);          // region-local coords — NEVER uv()
        const i = floor(uv).toVar();
        const f = fract(uv).toVar();
        const f1 = float(9).toVar();
        const f2 = float(9).toVar();
        const cellId = vec2(0).toVar();
        T.Loop({ start: -1, end: 2, type: 'int' }, ({ i: x }) => {
          T.Loop({ start: -1, end: 2, type: 'int' }, ({ i: y }) => {
            const g = vec2(float(x), float(y));
            const o = hash2(i.add(g));
            const r = g.add(o).sub(f);
            const d = length(r);
            const dLtF1 = d.lessThan(f1);
            f2.assign(select(dLtF1, f1, min(f2, d)));
            cellId.assign(select(dLtF1, i.add(g), cellId));
            f1.assign(min(f1, d));
          });
        });
        const cr = hash1(cellId);
        const cr2 = hash1(cellId.add(vec2(3.1, 7.7)));
        const grey = vec3(0.46, 0.45, 0.42);
        const tan = vec3(0.55, 0.50, 0.42);
        const brown = vec3(0.40, 0.37, 0.33);
        const stone = mix(mix(grey, tan, cr), brown, smoothstep(0.5, 0.9, cr2))
          .mul(cr.mul(0.18).add(0.86)).mul(tint);
        const groutCol = vec3(0.17, 0.19, 0.14);   // mossy seam
        const stoneMask = smoothstep(float(0), grout, f2.sub(f1));
        const col = mix(groutCol, stone, stoneMask);
        const rough = mix(float(0.95), float(0.7), stoneMask);
        return vec4(col, rough);
      })(),
    });
  }

  // ── Seeded lore: every ruin gets a stable name and story ────────────────────
  // Drawn from a DEDICATED per-seed rng stream (alea(seed + '-lore')) so the
  // text tables can grow/shrink without ever moving a column: spawn.rng and the
  // lore rng never share a cursor.
  const ROOTS = ['Vael', 'Thess', 'Orun', 'Khara', 'Mirel', 'Sorn', 'Adri', 'Beld', 'Ithra', 'Cael'];
  const SUFFIXES = ['spire', 'mere', 'crown', 'reach', 'hollow', 'gate', 'watch', 'fall', 'rest', 'moor'];
  const RUIN_STYLES = ['The Broken Ring of', 'The Fallen Court of', 'The Ruin of', 'The Standing Stones of'];
  const ERAS = [
    'Raised in the Age of Quiet Tides, when this meadow was the floor of a busy sea-road.',
    'The stones were cut in the Years of the Long Thaw and dragged here across forty miles of ice.',
    'Older than the hills that shade it — the ring was already ancient when the first farmers came.',
    'Built in a single summer, the carvings claim, by masons who never gave their names.',
    'A waypoint of the Lantern Kings, whose roads now run a spade’s depth under the grass.',
    'The founding line is in two scripts: one still taught, one that matches nothing known.',
  ];
  const DEDICATIONS = [
    'Dedicated to the Keeper of Doors, who counted travellers in and never counted them out.',
    'Dedicated to a queen whose name has been chiselled away — deliberately, and more than once.',
    'Dedicated to the harvest moon, which the columns once framed exactly on the equinox.',
    'Dedicated to the twin rivers, though no river runs within a day’s walk of here.',
    'Dedicated to whoever keeps the ring standing. The wording implies that is now you.',
    'Dedicated to the quarry itself, "which gave its bones gladly and asked one thing back."',
  ];
  const WARNINGS = [
    'Beneath the moss, a warning: "Take no stone from this circle. The circle keeps count."',
    '"Do not light fires within the ring after the last day of autumn." The reason is worn away.',
    '"The arch fell in a single night. We did not rebuild it. We will not write why."',
    '"Travellers may rest here freely. Travellers who dig will be counted differently."',
    '"When the glyphs glow, the door is near. Do not knock."',
  ];
  const CLOSER_DETAILS = [
    'Below the script someone has scratched hundreds of tally marks. The last group is unfinished.',
    'A child’s handprint is pressed into the mortar of the lowest course, small and sure.',
    'The masons’ marks are still crisp inside the grooves — a bird, a key, a spiral, a boat.',
    'One line is newer than the rest, cut with a knife: "still standing. still counting. — R"',
    'The moss grows in perfect rows across the base, as if it, too, follows the inscription.',
  ];

  const LORE = new Map();              // spawn.seed → { title, page1, page2 } (built in create)
  const readInscriptions = new Set();  // session memory: seeds whose plinth was read

  // alea if the runtime exposes it (bit-stable with the engine's own PRNG);
  // otherwise an FNV-seeded LCG — still deterministic per seed string.
  function seededRng(str) {
    const utils = window.XRPublisher && window.XRPublisher.utils;
    if (utils && typeof utils.alea === 'function') return utils.alea(str);
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
  }

  function buildLore(seed, isSanctum) {
    const cached = LORE.get(seed);
    if (cached) return cached;       // chunk remounts re-run create() — same lore
    const r = seededRng(seed + '-lore');
    const pick = (arr) => arr[(r() * arr.length) | 0];
    const name = pick(ROOTS) + pick(SUFFIXES);
    const title = isSanctum ? `The Sanctum of ${name}` : `${pick(RUIN_STYLES)} ${name}`;
    const stateLine = isSanctum
      ? 'Overhead, the architrave still bridges its columns — this ring never wholly fell.'
      : 'Whatever roof these columns once carried is long gone; its drums lie in the grass where they rolled.';
    const lore = {
      title,
      page1: `${pick(ERAS)} ${pick(DEDICATIONS)} ${stateLine}`,
      page2: `${pick(WARNINGS)} ${pick(CLOSER_DETAILS)}`,
    };
    LORE.set(seed, lore);
    return lore;
  }

  // ── Shared materials (module-level — reused by every ruin ever spawned) ────
  // ONE white vertex-coloured stone material serves all merged architecture:
  // stone tone and moss creep are baked per-vertex, so no per-spawn materials
  // exist to leak (default decoration cleanup disposes geometry, not materials).
  let MAT = null;

  // Faint glyph strokes on black — used as an emissiveMap so only the strokes
  // glow. Deterministic LCG, one canvas for the whole session.
  function glyphTexture(THREE) {
    const W = 512, H = 64;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    let s = 21;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (let x = 8; x < W - 8; x += 13 + (rnd() * 6 | 0)) {
      if (rnd() < 0.18) continue;                    // worn-away gaps in the band
      const strokes = 2 + (rnd() * 3 | 0);
      ctx.strokeStyle = `rgba(255,255,255,${(0.35 + rnd() * 0.5).toFixed(2)})`;
      ctx.lineWidth = 1.5 + rnd() * 1.5;
      for (let k = 0; k < strokes; k++) {
        const x0 = x + rnd() * 8, y0 = 12 + rnd() * 40;
        ctx.beginPath(); ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + (rnd() - 0.5) * 10, y0 + (rnd() - 0.5) * 26);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);                            // three glyph runs around the band
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function ensureMaterials(THREE) {
    if (MAT) return MAT;
    MAT = {
      stone: new THREE.MeshStandardMaterial({
        color: 0xffffff, vertexColors: true, roughness: 0.9, metalness: 0,
      }),
      // NIGHT WITHOUT LIGHTS: emissive-only glow. Scene light count must stay
      // constant after load (hard engine contract), so the plinth's glyphs are
      // a dark stone band whose emissiveMap strokes read faintly after dusk
      // (and punch bloom if a world enables postFX). Invisible-ish in daylight
      // by design — discovery is a night reward.
      glyphs: new THREE.MeshStandardMaterial({
        color: 0x23241f, roughness: 0.9, metalness: 0,
        emissive: 0x7fc493, emissiveIntensity: 0.85, emissiveMap: glyphTexture(THREE),
      }),
    };
    return MAT;
  }

  // ── Merged stone writer ─────────────────────────────────────────────────────
  // Every stone part goes through here → ONE vertex-coloured BufferGeometry
  // (one draw call per ruin instead of ~40 meshes). `add` consumes a freshly
  // created THREE geometry: transforms it in place, bakes tone + moss into the
  // color attribute, appends, then disposes the temp geometry.
  function createStoneWriter(THREE) {
    const pos = [], nor = [], col = [], idx = [];
    let base = 0;
    const M = new THREE.Matrix4();
    const Q = new THREE.Quaternion();
    const E = new THREE.Euler();
    const PV = new THREE.Vector3();
    const SV = new THREE.Vector3();
    // Cheap positional hash — jitters the moss line per vertex so the creep
    // has an organic edge WITHOUT consuming spawn.rng (vertex counts must
    // never influence the layout draw order).
    const hash01 = (x, z) => {
      const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      return s - Math.floor(s);
    };

    const add = (geom, tone, opts = {}) => {
      const p0 = opts.position || [0, 0, 0];
      const r0 = opts.rotation || [0, 0, 0];
      const s0 = opts.scale == null ? 1 : opts.scale;
      E.set(r0[0], r0[1], r0[2]);            // default 'XYZ': M = Rx·Ry·Rz
      Q.setFromEuler(E);
      PV.set(p0[0], p0[1], p0[2]);
      if (Array.isArray(s0)) SV.set(s0[0], s0[1], s0[2]); else SV.set(s0, s0, s0);
      M.compose(PV, Q, SV);
      geom.applyMatrix4(M);                  // three fixes normals for us
      const P = geom.attributes.position, N = geom.attributes.normal;
      // Moss creep: darken + green the band within ~MOSS_HEIGHT of the part's
      // ground contact (mossFrom). Because it's evaluated AFTER the transform,
      // a drum lying on its side gets moss on whichever side touches the
      // ground — no special casing.
      const mossFrom = opts.mossFrom == null ? 0 : opts.mossFrom;
      const mossH = opts.moss == null ? MOSS_HEIGHT : opts.moss;
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        pos.push(x, y, z);
        nor.push(N.getX(i), N.getY(i), N.getZ(i));
        let m = 0;
        if (mossH > 0) {
          const edge = mossH * (0.6 + 0.8 * hash01(x, z));   // ragged creep line
          m = Math.min(1, Math.max(0, 1 - (y - mossFrom) / edge)) * 0.85;
        }
        col.push(
          tone[0] + (TONE_MOSS[0] - tone[0]) * m,
          tone[1] + (TONE_MOSS[1] - tone[1]) * m,
          tone[2] + (TONE_MOSS[2] - tone[2]) * m,
        );
      }
      if (geom.index) {
        const ix = geom.index.array;
        for (let k = 0; k < ix.length; k++) idx.push(ix[k] + base);
      } else {
        for (let k = 0; k < P.count; k++) idx.push(base + k);   // e.g. Icosahedron
      }
      base += P.count;
      geom.dispose();
    };

    const build = () => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      return g;
    };

    return { add, build };
  }

  // ── The ruin itself — every draw comes from spawn.rng in a FIXED order ──────
  // Order: variant → plinth → ring plan → ring emit → arch → drum trail.
  // (Conditionals may skip draws, but the sequence per seed never changes at
  // runtime, so a site is identical on every visit and every renderer.)
  function buildRuin(THREE, spawn) {
    const rng = spawn.rng;
    const gy = spawn.groundHeightAt || (() => 0);   // seat parts on REAL terrain
    const W = createStoneWriter(THREE);
    const colliders = [];
    const jitterTone = (t, k) => [t[0] * k, t[1] * k, t[2] * k];
    // Yaw that points a box's local +X along horizontal direction (dx, dz).
    const alignYaw = (dx, dz) => Math.atan2(-dz, dx);

    // 1) Variant draw FIRST — the rare intact sanctum (~1 in 8, seeded).
    const isSanctum = rng() < SANCTUM_CHANCE;
    const nCols = isSanctum ? SANCTUM_COLUMNS : COLUMN_COUNT;

    // 2) Central plinth: two weathered tiers. Read radius/height off these if
    // you resize — the glyph band and the inscription interaction sit on it.
    const footP = gy(0, 0);
    W.add(new THREE.CylinderGeometry(2.3, 2.55, 0.35, 20), TONE_DARK,
      { position: [0, footP + 0.14, 0] });
    W.add(new THREE.CylinderGeometry(1.45, 1.7, 0.5, 18), TONE_DARK,
      { position: [0, footP + 0.6, 0], moss: 0.35, mossFrom: footP + 0.32 });
    colliders.push({ half: [1.8, 0.45, 1.8], position: [0, footP + 0.45, 0] });

    // Reusable column emitter: buried base block + tapered shaft (+ capital on
    // intact columns). Returns the shaft-top Y for anything stacked above.
    const emitColumn = (x, z, h, foot, capital) => {
      const tone = jitterTone(TONE_STONE, 0.92 + rng() * 0.14);
      W.add(new THREE.BoxGeometry(1.2, 0.26, 1.2), TONE_DARK,
        { position: [x, foot + 0.08, z], rotation: [0, rng() * Math.PI, 0] });
      W.add(new THREE.CylinderGeometry(0.4, 0.48, h, 12), tone, {
        position: [x, foot + 0.21 + h / 2, z],
        rotation: [0, rng() * Math.PI, (rng() - 0.5) * 0.05],   // weathered lean
        mossFrom: foot,
      });
      const top = foot + 0.21 + h;
      if (capital) {
        W.add(new THREE.BoxGeometry(1.05, 0.3, 1.05), TONE_DARK,
          { position: [x, top + 0.15, z], rotation: [0, rng() * 0.4, 0], moss: 0 });
      }
      colliders.push({ half: [0.52, (h + 0.35) / 2, 0.52], position: [x, foot + (h + 0.35) / 2, z] });
      return capital ? top + 0.3 : top;
    };

    // Cracked fragments scattered around a base — spalled stone chips.
    const emitFragments = (x, z, n) => {
      for (let f = 0; f < n; f++) {
        const aF = rng() * Math.PI * 2;
        const rF = 0.8 + rng() * 1.3;
        const size = 0.12 + rng() * 0.2;
        const fx = x + Math.cos(aF) * rF, fz = z + Math.sin(aF) * rF;
        W.add(new THREE.IcosahedronGeometry(size, 0), jitterTone(TONE_FRAG, 0.9 + rng() * 0.2), {
          position: [fx, gy(fx, fz) + size * 0.35, fz],      // part-sunk in the dirt
          rotation: [rng() * Math.PI, rng() * Math.PI, 0],
          scale: [1, 0.55 + rng() * 0.4, 1],                 // flat spall, not pebble
          moss: 0.2,
          mossFrom: gy(fx, fz),
        });
      }
    };

    // 3) Ring PLAN before any emit: heights first, so the sanctum architrave
    // can level its bridged columns before geometry is written.
    const ringStart = rng() * Math.PI * 2;
    const plan = [];
    for (let c = 0; c < nCols; c++) {
      const a = ringStart + (c / nCols) * Math.PI * 2 + (rng() - 0.5) * 0.16;
      const h = isSanctum
        ? SANCTUM_HEIGHT * (0.55 + rng() * 0.45)             // mostly still tall
        : 1.4 + rng() * 3.4;                                 // snapped stumps
      plan.push({ a, h, x: Math.cos(a) * COLUMN_RING, z: Math.sin(a) * COLUMN_RING });
    }
    let bridge = null;
    if (isSanctum) {
      // A COMPLETE architrave section bridging 2-3 adjacent columns: force
      // that run to full height on a shared footing so the beams sit level.
      const start = (rng() * nCols) | 0;
      const count = 2 + (rng() < 0.6 ? 1 : 0);
      bridge = { start, count };
      let footRef = Infinity;
      for (let k = 0; k <= count; k++) {
        const p = plan[(start + k) % nCols];
        p.h = SANCTUM_HEIGHT;
        p.bridged = true;
        footRef = Math.min(footRef, gy(p.x, p.z));
      }
      for (let k = 0; k <= count; k++) plan[(start + k) % nCols].foot = footRef;
    }

    // 4) Emit the ring: column + fragments at its foot; intact columns keep a
    // capital. Occasionally a fallen capital drum just outside the ring.
    for (const p of plan) {
      const foot = p.foot != null ? p.foot : gy(p.x, p.z);
      const intact = p.bridged || p.h > (isSanctum ? SANCTUM_HEIGHT : 4.8) * 0.8;
      p.top = emitColumn(p.x, p.z, p.h, foot, intact);
      emitFragments(p.x, p.z, 1 + (rng() * 2 | 0));
      if (!p.bridged && rng() < 0.35) {
        const da = p.a + (rng() - 0.5) * 0.6;
        const dr = COLUMN_RING + 1.4 + rng() * 1.6;
        const dx = Math.cos(da) * dr, dz = Math.sin(da) * dr;
        W.add(new THREE.CylinderGeometry(0.48, 0.48, 0.85, 12), TONE_DARK, {
          position: [dx, gy(dx, dz) + 0.42, dz],
          rotation: [0, rng() * Math.PI, Math.PI / 2],       // lying on its side
          mossFrom: gy(dx, dz),
        });
      }
    }
    if (bridge) {
      // Beams span consecutive bridged tops (they share a footing → level run).
      for (let k = 0; k < bridge.count; k++) {
        const p = plan[(bridge.start + k) % nCols];
        const q = plan[(bridge.start + k + 1) % nCols];
        const len = Math.hypot(q.x - p.x, q.z - p.z) + 0.7;  // slight overhang
        W.add(new THREE.BoxGeometry(len, 0.5, 0.85), TONE_DARK, {
          position: [(p.x + q.x) / 2, p.top + 0.25, (p.z + q.z) / 2],
          rotation: [0, alignYaw(q.x - p.x, q.z - p.z), 0],
          moss: 0,                                           // no creep 5u up
        });
      }
    }

    // 5) The BROKEN ARCH on one side: two taller columns just outside the
    // ring; ONE keeps its intact springer stone, and the partial lintel lies
    // where it fell — one end propped on a broken drum, nose in the dirt.
    const aArch = ringStart + Math.PI / nCols + (rng() * nCols | 0) * (Math.PI * 2 / nCols);
    const rArch = FLOOR_RADIUS - 3;
    const dA = 1.5 / rArch;                                  // ~3u clear gap
    const hArch = 3.4 + rng() * 0.6;
    const ax = Math.cos(aArch - dA) * rArch, az = Math.sin(aArch - dA) * rArch;
    const bx = Math.cos(aArch + dA) * rArch, bz = Math.sin(aArch + dA) * rArch;
    const topA = emitColumn(ax, az, hArch, gy(ax, az), false);
    emitColumn(bx, bz, hArch * (0.94 + rng() * 0.06), gy(bx, bz), false);
    // Intact springer on column A, shifted a touch toward the gap — the stone
    // the arch sprang from, still waiting for a curve that never comes back.
    const gapLen = Math.hypot(bx - ax, bz - az) || 1;
    const gnx = (bx - ax) / gapLen, gnz = (bz - az) / gapLen;
    W.add(new THREE.BoxGeometry(0.95, 0.42, 0.95), TONE_DARK, {
      position: [ax + gnx * 0.14, topA + 0.21, az + gnz * 0.14],
      rotation: [0, alignYaw(gnx, gnz), 0],
      moss: 0,
    });
    // Fallen lintel tableau, pushed radially outward from the gap centre.
    const gcx = (ax + bx) / 2, gcz = (az + bz) / 2;
    const gr = Math.hypot(gcx, gcz) || 1;
    const ux = gcx / gr, uz = gcz / gr;                      // outward from ruin centre
    const px = gcx + ux * 1.7, pz = gcz + uz * 1.7;          // support drum
    W.add(new THREE.CylinderGeometry(0.42, 0.42, 0.8, 12), TONE_DARK, {
      position: [px, gy(px, pz) + 0.4, pz],
      rotation: [0, alignYaw(-uz, ux), Math.PI / 2],
      mossFrom: gy(px, pz),
    });
    const lx = px + ux * 1.0, lz = pz + uz * 1.0;
    W.add(new THREE.BoxGeometry(2.6, 0.42, 0.6), TONE_DARK, {
      position: [lx, gy(lx, lz) + 0.5, lz],
      // +X end tips UP toward the drum it rests on (Euler XYZ: Ry then Rz).
      rotation: [0, alignYaw(-ux, -uz), 0.19],
      mossFrom: gy(lx, lz),
    });
    emitFragments(px, pz, 2);

    // 6) Drum trail walking AWAY from the ring (roughly opposite the arch —
    // the stones someone started carting off, centuries ago). Each drum sinks
    // a little deeper into the meadow than the last.
    const aTrail = aArch + Math.PI + (rng() - 0.5) * 0.9;
    const nDrums = 3 + (rng() * 3 | 0);
    let dist = FLOOR_RADIUS + 1.5;
    for (let i = 0; i < nDrums; i++) {
      dist += 2.6 + rng() * 1.8;
      const lat = (rng() - 0.5) * 2.6;
      const tx = Math.cos(aTrail) * dist - Math.sin(aTrail) * lat;
      const tz = Math.sin(aTrail) * dist + Math.cos(aTrail) * lat;
      const sink = 0.1 + (i / nDrums) * 0.28 + rng() * 0.08; // grass swallows the far ones
      W.add(new THREE.CylinderGeometry(0.46, 0.46, 0.9, 12), TONE_DARK, {
        position: [tx, gy(tx, tz) + 0.46 - sink, tz],
        rotation: [0, aTrail + Math.PI / 2 + (rng() - 0.5) * 0.7, Math.PI / 2],
        mossFrom: gy(tx, tz),
      });
    }

    // Compile: ONE mesh for all stonework + the glyph band (its own material).
    const m = ensureMaterials(THREE);
    const g = new THREE.Group();
    const stones = new THREE.Mesh(W.build(), m.stone);
    stones.castShadow = true;
    stones.receiveShadow = true;
    g.add(stones);
    // Glyph band hugging the plinth's upper tier (openEnded — just the strap).
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.63, 1.63, 0.22, 24, 1, true), m.glyphs);
    band.position.y = footP + 0.62;
    g.add(band);
    return { group: g, colliders, isSanctum };
  }

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || typeof XRPublisher.registerTerrainSurface !== 'function'
        || typeof XRPublisher.registerDecoration !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime too old (needs registerTerrainSurface + registerDecoration)`);
      return;
    }
    // Optional API — degrade gracefully: without openDialog the ruins still
    // spawn, they just aren't readable.
    const HAS_DIALOG = typeof XRPublisher.openDialog === 'function';
    registerSurface(XRPublisher);

    const spec = {
      name: PLUGIN_ID,           // part of the placement seed — renaming moves every ruin
      density: 0.5,              // sparse — the engine's deterministic accept draw
      biomes: ['default'],       // ancient ruins in ordinary grassland
      maxSlope: 0.13,
      minWaterDistance: 10,      // keep the whole site on dry land
      minSpacing: 44,
      // Dirt apron — bare-earth ring framing the flagstone so the site blends
      // into the meadow (engine paints it around the spawn + clears grass).
      // ONE patch per ruin: patches are a world budget of 24 — reserve them
      // for real sites like this, never per-column.
      groundPatch: { radius: DIRT_RADIUS, color: [0.34, 0.27, 0.18], clearGrass: true },
      // The merged mesh means the auto-cuboid path would box the whole site;
      // explicit per-column cuboids (userData.xrColliders below) instead.
      collision: true,
      // NOTE: no update() — a ruin is a dense STATIC site. The engine freezes
      // matrices for update-less specs, so all of this costs zero per frame;
      // a per-frame callback here would be unjustified cost × every ruin.
      create(spawn) {
        // renderPosition is render-frame world XZ — the frame regions paint
        // in — for every anchor type; no correction needed.
        const wx = spawn.renderPosition[0];
        const wz = spawn.renderPosition[2];

        // Flagstone floor under the ruin.
        // Water-safe via the core's regionWaterY fade — a site brushing a pond
        // keeps natural shore there instead of paving over it.
        const regionId = `${PLUGIN_ID}-${spawn.seed}`;
        XRPublisher.addTerrainRegion({
          id: regionId,
          center: [wx, wz],
          radius: FLOOR_RADIUS,
          surface: SURFACE_ID,
          scale: SURFACE_SCALE,
          mortar: SURFACE_GROUT,
          clearGrass: true,
        });

        const { group, colliders, isSanctum } = buildRuin(THREE, spawn);
        group.userData.__regionId = regionId;
        group.userData.xrColliders = colliders;
        // Lore is built HERE (create is the one place that knows the variant)
        // from a dedicated alea(seed+'-lore') stream, and memoized so the
        // ~10Hz prompt callback is a Map lookup, never a rebuild.
        buildLore(spawn.seed, isSanctum);
        return group;
      },
      dispose(object) {
        const rid = object && object.userData && object.userData.__regionId;
        if (rid) XRPublisher.removeTerrainRegion(rid);
        // Merged stone + glyph band geometry are PER-SPAWN (unique baked
        // vertex colours) → dispose them. The two materials + glyph texture
        // are module singletons and live for the session.
        object.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      },
    };

    if (HAS_DIALOG) {
      // "E to read" on the central plinth. The prompt is a FUNCTION — the
      // engine re-resolves it ~10Hz, so after the first read this session it
      // flips from an invitation to the ruin's name (cheap: two Map/Set hits).
      spec.interactable = true;
      spec.interactionRadius = 6;      // roughly "standing at the plinth"
      spec.interactionPrompt = (spawn) => {
        const lore = LORE.get(spawn.seed);
        if (lore && readInscriptions.has(spawn.seed)) return `“${lore.title}”`;
        return 'Read the worn inscription';
      };
      spec.onInteract = (ctx) => {
        const seed = ctx.spawn.seed;
        const lore = LORE.get(seed);
        if (!lore) return;
        readInscriptions.add(seed);    // session memory — flips the prompt
        // Two-page dialog chain: `keepOpen` holds page 1 open while onSelect
        // replaces it with page 2 (opening a dialog from onSelect chains).
        XRPublisher.openDialog({
          title: lore.title,
          content: lore.page1,
          buttons: [
            {
              label: 'Look closer',
              keepOpen: true,
              onSelect: () => XRPublisher.openDialog({
                title: 'Weathered lines, half-legible',
                content: lore.page2,
                buttons: [{ label: 'Step back', variant: 'primary' }],
              }),
            },
            { label: 'Step away', variant: 'primary' },
          ],
        });
      };
    }

    XRPublisher.registerDecoration(spec);

    registered = true;
    console.log(`[${PLUGIN_ID}] registered — flagstone ruins (floor r=${FLOOR_RADIUS}, dirt r=${DIRT_RADIUS}, `
      + `sanctum odds 1/${Math.round(1 / SANCTUM_CHANCE)})${HAS_DIALOG ? ' + readable inscriptions (E)' : ''}`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
