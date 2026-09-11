/**
 * town-center — XR Publisher plugin (PROCEDURAL SEEDED TOWN, v2)
 *
 * Populates every engine-discovered TOWN with a BotW-inspired village on a
 * cobblestone town ground: a stone WELL at the exact centre, market stalls,
 * benches and lantern posts ringing the open plaza, and timber-framed
 * buildings facing the square — shops and a tavern at the plaza edge,
 * cottages and manors in the middle, barns and shacks at the outskirts.
 * Same world seed ⇒ the exact same town, every visit, on WebGPU and WebGL
 * alike.
 *
 * BUILT LIKE THE ENGINE BUILDS THINGS (plan → compile):
 *   • Every building starts as a semantic PLAN — footprint, BSP rooms, the
 *     door in the widest gap between interior walls, window stations that
 *     dodge wall junctions, roof kind, material bands — drawn from spawn.rng
 *     in a fixed order. Triangles come last.
 *   • The plan compiles through a material-slot MESH WRITER: one merged
 *     BufferGeometry per material (plaster, timber, shingles, stone, …) —
 *     ≈9 draw calls per building instead of one mesh per wall segment.
 *   • Solidity comes from EXPLICIT colliders (`userData.xrColliders`):
 *     hand-authored cuboids for plinth, wall runs (split at doorways), ramp,
 *     and furniture — so interiors stay fully walkable while the visual
 *     geometry stays merged. Auto-cuboids would seal the merged mesh shut.
 *   • Architecture reads at three distances: silhouette (varied massing +
 *     roof kinds + chimneys), street (timber framing, shuttered windows,
 *     door lanterns, porches, hanging shop signs), and interior (furnished
 *     rooms — beds, tables, shelves, counters, rugs).
 *
 * FINISHED-TOWN DRESSING (v3):
 *   • SIDEWALKS: a pale-stone pedestrian network — a ~24-point perimeter
 *     promenade just inside the town edge plus stone door-walks from every
 *     ramp foot to the street rings. Laid with addPath (the linear tool;
 *     regions are circles). addPath currently renders EVERY path as packed
 *     dirt × tint, so WALK_TINT grey is the look control; each walk also
 *     declares `surface: 'stone-walk'` so it upgrades to real slabs the day
 *     the engine honors it.
 *   • registerTerrainSurface('stone-walk'): rectangular running-bond slabs
 *     hashed from localXZ (NEVER uv() — it throws in this engine's node
 *     materials), toned lighter/warmer than the cobble; WebGL renders the
 *     flat fallbackColor.
 *   • PLAZA LANDMARKS, one per town, claimed + snapped exactly like the
 *     well: a two-tier stone FOUNTAIN (still MATS.water discs — same unlit
 *     water look as the well, no emissive) at a town-hashed spot between two
 *     spokes, and a roofed NOTICE BOARD opposite it that registers an
 *     interactable ("Press E") and opens an in-world dialog (openDialog —
 *     mouse AND VR clickable) with seeded town notices: market day, a lost
 *     cat, road news — stable per town, drawn from string tables.
 *   • SIGNPOSTS at the spoke/ring junctions carry the town's SEEDED NAME on
 *     a canvas-painted board (signTexture painter; the board is a plain
 *     BoxGeometry child so the name maps exactly once — the writer's
 *     edge-distance UVs would tile it). One per junction, claimed.
 *   • BANNER POLES in seeded heraldic colors (fixed shared material palette,
 *     spawn.rng picks) flank the inner plaza; dense stone-ringed FLOWER BEDS
 *     and benches line the perimeter promenade.
 *   • Every new prop compiles through the same material-slot writer with
 *     explicit cuboid colliders (fountain basin = 6-box tangent ring +
 *     pedestal, signpost = one thin post box) and draws all variation from
 *     spawn.rng or the town key — deterministic per visit, both renderers.
 *
 * STREAMING / DETERMINISM (unchanged machinery):
 *   • Town centres come from XRPublisher.getWorldTowns() — the same network
 *     the roads route between.
 *   • Each building is its own decoration spawn, so it streams with its
 *     chunk and gets per-building terrain Y. The annulus INNER..BUILD_OUTER
 *     fills densely: a footprint-aware spacing check among ACCEPTED buildings
 *     (two half-diagonals + STREET_GAP) packs houses village-tight, while a
 *     chunk-border margin guarantees buildings from neighbouring chunks can
 *     never interpenetrate. Types band by distance (shops → homes → barns).
 *     Buildings are BIG with open multi-room interiors (wide doorways, a
 *     furniture placement guard that never blocks a doorway).
 *   • Everything runs in the RENDER frame: spawns use spawn.renderPosition
 *     (render-frame for every anchor type, no correction — the legacy
 *     spawn.worldPosition is deprecated), and getWorldTowns' WORKER-frame
 *     town coords are converted once at ingestion (−½ chunk on X and Z).
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'town-center';

  // ── Configure me ──────────────────────────────────────────────────────────
  const TOWN_RADIUS = 92;       // cobblestone town footprint radius — the whole town
                                // stands on the cobble (don't shrink this; it IS the look)
  const INNER = 24;             // open plaza kept clear of buildings
  const BUILD_OUTER = 78;       // building centres fill INNER..here (the whole annulus)
  const BANDS = [40, 60];       // type bands: <40 plaza-edge, <60 residential, else outskirts
  const FILL = [0.95, 0.9, 0.8];// accept chance per band
  // Streets: sandy packed-dirt strips (the world-road recipe) painted ON TOP
  // of the town cobble (addPath — never shrinks or replaces the cobblestone).
  const RING_R = 52;            // ring street radius; buildings keep their WALLS off it
  const RING_W = 3.4;
  const INNER_RING_R = 11;      // small circle AROUND the centre piece (well) —
                                // the spokes and inner trails all connect to it
  const INNER_RING_W = 2.6;
  const SPOKES = 5;             // main spokes inner circle ↔ ring (angles hashed per town)
  const SPOKE_W = 3.0;
  const TRAIL_W = 2.2;          // per-building door WALK width (stone sidewalk)
  const PATH_TINT = [1.1, 1.03, 0.88];   // sandy warm shift on the road dirt recipe
  // Sidewalks: the perimeter promenade + door walks render through the same
  // addPath dirt recipe — WALK_TINT (pale stone grey, cool shift to cancel
  // the dirt's warmth) is the whole look; distinct from the sandy streets.
  const WALK_R = 85;            // perimeter promenade radius (inside TOWN_RADIUS=92)
  const WALK_W = 2.6;
  const WALK_TINT = [0.95, 0.97, 1.1];   // pale stone grey over the dirt recipe
  const FOUNTAIN_R = 17;        // fountain claim slot: this far out, between two spokes
  const NOTICE_R = 15;          // notice-board claim slot (the opposite between-spokes gap)
  const STREET_GAP = 2.2;       // walking gap kept between building FOOTPRINTS
  const FOOT_EXTRA = 3.8;       // footprint padding for ramp/porch/roof overhang
  const DENSITY = 85;           // building candidates per chunk (more probes → tighter packing)
  const MIN_SPACING = 8;        // candidate thinning only — the REAL spacing is the
                                // footprint-aware check in create() (two half-diagonals + STREET_GAP)
  const BORDER_MARGIN = 13.5;   // no building centre within this of a chunk border
                                // → cross-chunk pairs are ≥ 2×margin apart (> two padded half-diagonals)
  const MAX_SLOPE = 0.13;
  const REFRESH_MS = 4000;      // re-scan for nearby towns at this cadence
  const SCAN_RADIUS = 3500;     // town look-ahead window around the player
  const LANTERN_LIT = 0.15;     // fraction of door lanterns burning (bloom budget)
  // ──────────────────────────────────────────────────────────────────────────

  let registered = false;

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  // ── CanvasTexture painters ──────────────────────────────────────────────────
  const lcg = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const toRGB = (hex) => ({ r: (hex >> 16) & 255, g: (hex >> 8) & 255, b: hex & 255 });
  const css = (c, f) => `rgb(${Math.min(255, c.r * f | 0)},${Math.min(255, c.g * f | 0)},${Math.min(255, c.b * f | 0)})`;
  const canvasTex = (THREE, S, paint) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    paint(cv.getContext('2d'), S);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const woodTexture = (THREE, { base, planks = 8, vertical = true, seed = 1 }) => canvasTex(THREE, 256, (ctx, S) => {
    const rnd = lcg(seed); const c = toRGB(base);
    ctx.fillStyle = css(c, 0.9); ctx.fillRect(0, 0, S, S);
    const step = S / planks;
    for (let p = 0; p < planks; p++) {
      const o = p * step;
      ctx.fillStyle = css(c, 0.82 + rnd() * 0.32);
      if (vertical) ctx.fillRect(o, 0, step, S); else ctx.fillRect(0, o, S, step);
      for (let i = 0; i < 9; i++) {
        ctx.strokeStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '40,25,12'},${0.05 + rnd() * 0.09})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (vertical) {
          const x = o + rnd() * step; ctx.moveTo(x, 0);
          for (let y = 0; y <= S; y += 16) ctx.lineTo(x + Math.sin(y * 0.06 + i) * 1.6, y);
        } else {
          const y = o + rnd() * step; ctx.moveTo(0, y);
          for (let x = 0; x <= S; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.06 + i) * 1.6);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath();
      if (vertical) { ctx.moveTo(o, 0); ctx.lineTo(o, S); } else { ctx.moveTo(0, o); ctx.lineTo(S, o); }
      ctx.stroke();
    }
  });

  const stoneTexture = (THREE, { base, rows = 6, cols = 5, seed = 1 }) => canvasTex(THREE, 256, (ctx, S) => {
    const rnd = lcg(seed); const c = toRGB(base);
    ctx.fillStyle = css(c, 0.5); ctx.fillRect(0, 0, S, S);   // mortar
    const rh = S / rows, cw = S / cols;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * cw * 0.5;
      for (let cc = -1; cc < cols; cc++) {
        const x = cc * cw + off + 2, y = r * rh + 2, w = cw - 4, h = rh - 4;
        ctx.fillStyle = css(c, 0.78 + rnd() * 0.36);
        ctx.fillRect(x, y, w, h);
        for (let s = 0; s < 8; s++) {
          ctx.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.06})`;
          ctx.fillRect(x + rnd() * w, y + rnd() * h, 2, 2);
        }
      }
    }
  });

  const plasterTexture = (THREE, { base, seed = 1 }) => canvasTex(THREE, 128, (ctx, S) => {
    const rnd = lcg(seed); const c = toRGB(base);
    ctx.fillStyle = css(c, 1); ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '110,100,82'},${0.03 + rnd() * 0.05})`;
      ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 4, 2 + rnd() * 4);
    }
    // weathering streaks pulling darker near the bottom edge
    for (let i = 0; i < 14; i++) {
      const x = rnd() * S;
      ctx.fillStyle = `rgba(90,80,64,${0.04 + rnd() * 0.05})`;
      ctx.fillRect(x, S - 18 - rnd() * 26, 2 + rnd() * 3, 44);
    }
  });

  const shingleTexture = (THREE, { base, seed = 1 }) => canvasTex(THREE, 256, (ctx, S) => {
    const rnd = lcg(seed); const c = toRGB(base);
    const rows = 8, cols = 7, rh = S / rows, cw = S / cols;
    ctx.fillStyle = css(c, 0.55); ctx.fillRect(0, 0, S, S);
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * cw * 0.5;
      for (let cc = -1; cc <= cols; cc++) {
        const x = cc * cw + off, y = r * rh;
        ctx.fillStyle = css(c, 0.8 + rnd() * 0.35);
        ctx.fillRect(x + 1, y, cw - 2, rh - 2);
        // rounded lower edge shadow → reads as overlap
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(x + 1, y + rh - 4, cw - 2, 3);
      }
    }
  });

  const thatchTexture = (THREE, { base, seed = 1 }) => canvasTex(THREE, 256, (ctx, S) => {
    const rnd = lcg(seed); const c = toRGB(base);
    ctx.fillStyle = css(c, 0.85); ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 700; i++) {
      const y = rnd() * S;
      ctx.strokeStyle = css(c, 0.6 + rnd() * 0.7);
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1 + rnd();
      ctx.beginPath();
      const x = rnd() * S;
      ctx.moveTo(x, y); ctx.lineTo(x + 10 + rnd() * 22, y + 2 + rnd() * 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });

  const stripeTexture = (THREE, { color }) => canvasTex(THREE, 128, (ctx, S) => {
    const c = toRGB(color);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? 'rgb(236,228,210)' : css(c, 1);
      ctx.fillRect(i * S / 8, 0, S / 8, S);
    }
  });

  // Painted town-name sign board. Non-square canvas (matches the board's
  // ~2.7:1 aspect) so the name isn't squashed by BoxGeometry's 0..1 UVs.
  // PER-SPAWN texture (each town has its own name) — the props spec dispose
  // frees it via userData.__ownedMats.
  const signTexture = (THREE, { name, seed = 1 }) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
    const ctx = cv.getContext('2d');
    const rnd = lcg(seed);
    const c = toRGB(0x8a6a42);
    for (let p = 0; p < 3; p++) {              // horizontal board planks
      ctx.fillStyle = css(c, 0.8 + rnd() * 0.3);
      ctx.fillRect(0, p * 32, 256, 32);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, p * 32); ctx.lineTo(256, p * 32); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(46,32,18,0.9)'; ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 246, 86);
    ctx.fillStyle = 'rgb(240,232,214)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let size = 42;                              // shrink-to-fit long names
    do { ctx.font = `bold ${size}px Georgia, 'Times New Roman', serif`; size -= 2; }
    while (ctx.measureText(name).width > 224 && size > 16);
    ctx.fillText(name, 128, 50);
    for (const [nx, ny] of [[14, 14], [242, 14], [14, 82], [242, 82]]) {  // corner nails
      ctx.fillStyle = 'rgba(30,26,22,0.9)';
      ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  // Heraldic banner cloth: two-colour field (per-pale halves or fess bands),
  // a simple charge (roundel / lozenge / chevron) in the counter-colour, and
  // seeded weathering. Painted ONCE per palette entry at ensureMats time —
  // banner poles pick from the fixed shared set with spawn.rng.
  const bannerTexture = (THREE, { c0, c1, seed = 1 }) => canvasTex(THREE, 128, (ctx, S) => {
    const rnd = lcg(seed);
    const a = toRGB(c0), b = toRGB(c1);
    const perPale = rnd() < 0.5;
    if (perPale) {
      ctx.fillStyle = css(a, 1); ctx.fillRect(0, 0, S / 2, S);
      ctx.fillStyle = css(b, 1); ctx.fillRect(S / 2, 0, S / 2, S);
    } else {
      const bands = 3 + (rnd() * 2 | 0);
      for (let i = 0; i < bands; i++) {
        ctx.fillStyle = i % 2 ? css(b, 1) : css(a, 1);
        ctx.fillRect(0, i * S / bands, S, S / bands + 1);
      }
    }
    ctx.fillStyle = css(perPale ? b : a, perPale ? 0.7 : 1.3);
    const kind = rnd() * 3 | 0;
    ctx.beginPath();
    if (kind === 0) ctx.arc(S / 2, S / 2, S * 0.18, 0, Math.PI * 2);
    else if (kind === 1) {
      ctx.moveTo(S / 2, S * 0.28); ctx.lineTo(S * 0.72, S / 2);
      ctx.lineTo(S / 2, S * 0.72); ctx.lineTo(S * 0.28, S / 2);
    } else {
      ctx.moveTo(S * 0.26, S * 0.64); ctx.lineTo(S / 2, S * 0.34); ctx.lineTo(S * 0.74, S * 0.64);
      ctx.lineTo(S * 0.62, S * 0.64); ctx.lineTo(S / 2, S * 0.48); ctx.lineTo(S * 0.38, S * 0.64);
    }
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 60; i++) {              // cloth wear
      ctx.fillStyle = `rgba(30,24,16,${0.02 + rnd() * 0.05})`;
      ctx.fillRect(rnd() * S, rnd() * S, 2, 2 + rnd() * 5);
    }
  });

  // Mown-lawn green: soft mottled patches + short blade flecks over a leafy
  // base — reads as a KEPT yard against both the plaza cobble and the wild
  // terrain grass outside town.
  const lawnTexture = (THREE, { base = 0x67903f, seed = 1 }) => canvasTex(THREE, 128, (ctx, S) => {
    const rnd = lcg(seed);
    const c = toRGB(base);
    ctx.fillStyle = css(c, 1); ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 260; i++) {              // mottled light/dark patches
      ctx.fillStyle = css(c, 0.82 + rnd() * 0.4);
      ctx.beginPath(); ctx.arc(rnd() * S, rnd() * S, 2 + rnd() * 7, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 420; i++) {              // short blade strokes
      ctx.strokeStyle = css(c, 0.7 + rnd() * 0.75);
      ctx.lineWidth = 1;
      const x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); ctx.stroke();
    }
  });

  // ── Shared materials (module singletons — one set for the whole world) ─────
  let MATS = null;
  function ensureMats(THREE) {
    if (MATS) return MATS;
    const std = (tex, rough) => new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0 });
    const flat = (color, rough) => new THREE.MeshStandardMaterial({ color, roughness: rough || 1, metalness: 0 });
    MATS = {
      plaster: std(plasterTexture(THREE, { base: 0xd8cdb4, seed: 53 }), 0.9),
      plaster2: std(plasterTexture(THREE, { base: 0xc4b394, seed: 57 }), 0.9),
      plank: std(woodTexture(THREE, { base: 0xa07a4e, seed: 23 }), 0.92),
      plank2: std(woodTexture(THREE, { base: 0x6f5a3e, seed: 31 }), 0.92),
      barn: std(woodTexture(THREE, { base: 0x9c4434, seed: 41 }), 0.95),
      timber: std(woodTexture(THREE, { base: 0x4c3826, planks: 3, seed: 61 }), 0.9),
      stone: std(stoneTexture(THREE, { base: 0x8d8a85, seed: 51 }), 0.95),
      stoneDark: std(stoneTexture(THREE, { base: 0x6b6358, rows: 5, cols: 4, seed: 55 }), 1),
      floor: std(woodTexture(THREE, { base: 0x8a5a32, planks: 7, vertical: false, seed: 11 }), 0.85),
      ceiling: std(woodTexture(THREE, { base: 0x5c4128, planks: 5, vertical: false, seed: 37 }), 0.95),
      shingleBlue: std(shingleTexture(THREE, { base: 0x4c6478, seed: 71 }), 0.85),
      shingleRed: std(shingleTexture(THREE, { base: 0x8a4432 , seed: 73 }), 0.85),
      shake: std(shingleTexture(THREE, { base: 0x54402c, seed: 79 }), 0.95),
      thatch: std(thatchTexture(THREE, { base: 0xa8853f, seed: 83 }), 1),
      awning: std(stripeTexture(THREE, { color: 0x9c4434 }), 0.85),
      awning2: std(stripeTexture(THREE, { color: 0x3f6a52 }), 0.85),
      glow: new THREE.MeshStandardMaterial({ color: 0x3a2c1a, roughness: 0.4, metalness: 0, emissive: 0xffb45e, emissiveIntensity: 0.55 }),
      lantern: new THREE.MeshStandardMaterial({ color: 0x2a1c0c, roughness: 0.5, metalness: 0, emissive: 0xff9c3c, emissiveIntensity: 2.0 }),
      lanternOff: new THREE.MeshStandardMaterial({ color: 0x241a10, roughness: 0.6, metalness: 0 }),
      cloth: flat(0x7a4a3f, 1),
      lawn: std(lawnTexture(THREE, { base: 0x67903f, seed: 97 }), 1),
      hay: flat(0xcfa552, 1),
      pumpkin: flat(0xc9722d, 0.8),
      cabbage: flat(0x84b05c, 0.9),
      iron: flat(0x35322e, 0.7),
      water: new THREE.MeshStandardMaterial({ color: 0x27435a, roughness: 0.25, metalness: 0 }),
      // v3 dressing slots
      stoneLight: std(stoneTexture(THREE, { base: 0xa39c8d, rows: 5, cols: 4, seed: 59 }), 0.95), // fountain/flower-bed stone
      soil: flat(0x4a3a28, 1),
      parchment: flat(0xdcd2b2, 1),
      brass: flat(0xb08d3f, 0.5),
      flowerRed: flat(0xb84a50, 0.9),
      flowerWhite: flat(0xd8d2c2, 0.9),
      flowerYellow: flat(0xd8b04a, 0.9),
      flowerBlue: flat(0x5a6ea0, 0.9),
    };
    // Heraldic banner cloths — FIXED shared palette (never per-spawn
    // materials); each banner pole picks an index with spawn.rng.
    const HERALDRY = [
      [0x8a3038, 0xe0d6b8], [0x2f4d6e, 0xd8b04a], [0x3f6a52, 0xe0d6b8],
      [0x6a4a86, 0xd8b04a], [0xb06a2a, 0x33404e],
    ];
    MATS.banners = HERALDRY.map(([c0, c1], i) => std(bannerTexture(THREE, { c0, c1, seed: 101 + i * 7 }), 1));
    return MATS;
  }

  // ── Material-slot mesh writer (shared shape with the farm-plots plugin) ────
  function createWriter() {
    const slots = new Map();
    const bucket = (name) => {
      let b = slots.get(name);
      if (!b) { b = { p: [], n: [], uv: [], ix: [] }; slots.set(name, b); }
      return b;
    };
    const pushFace = (k, pts, uvs) => {
      const a = pts[0], b = pts[1], d = pts[2];
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const wx = d[0] - a[0], wy = d[1] - a[1], wz = d[2] - a[2];
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const il = 1 / (Math.hypot(nx, ny, nz) || 1); nx *= il; ny *= il; nz *= il;
      const base = k.p.length / 3;
      for (let i = 0; i < pts.length; i++) {
        k.p.push(pts[i][0], pts[i][1], pts[i][2]);
        k.n.push(nx, ny, nz);
        k.uv.push(uvs[i * 2], uvs[i * 2 + 1]);
      }
      if (pts.length === 3) k.ix.push(base, base + 1, base + 2);
      else k.ix.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    // planar quad a→b→c→d, CCW from outside; UVs from real edge distance / uvT
    const quad = (name, a, b, c, d, uvT) => {
      const s = uvT || 1;
      const eu = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const ev = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
      pushFace(bucket(name), [a, b, c, d], [0, 0, eu / s, 0, eu / s, ev / s, 0, ev / s]);
    };
    const tri = (name, a, b, c, uvT) => {
      const s = uvT || 1;
      const eu = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      pushFace(bucket(name), [a, b, c], [0, 0, eu / s, 0, eu / (2 * s), 1 / s]);
    };
    const makeRot = (yaw, pitch, roll) => {
      const cy = Math.cos(yaw || 0), sy = Math.sin(yaw || 0);
      const cx = Math.cos(pitch || 0), sx = Math.sin(pitch || 0);
      const cz = Math.cos(roll || 0), sz = Math.sin(roll || 0);
      return [
        cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx,
        cx * sz, cx * cz, -sx,
        -sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx,
      ];
    };
    const xf = (p, R, t) => [
      R[0] * p[0] + R[1] * p[1] + R[2] * p[2] + t[0],
      R[3] * p[0] + R[4] * p[1] + R[5] * p[2] + t[1],
      R[6] * p[0] + R[7] * p[1] + R[8] * p[2] + t[2],
    ];
    const box = (name, size, t, rot, uvT) => {
      const R = makeRot(rot && rot[0], rot && rot[1], rot && rot[2]);
      const x = size[0] / 2, y = size[1] / 2, z = size[2] / 2;
      const F = [
        [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]],
        [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]],
        [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]],
        [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]],
        [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]],
        [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]],
      ];
      for (const f of F) quad(name, xf(f[0], R, t), xf(f[1], R, t), xf(f[2], R, t), xf(f[3], R, t), uvT);
    };
    const cyl = (name, r0, r1, len, seg, t, rot, caps, uvT) => {
      const R = makeRot(rot && rot[0], rot && rot[1], rot && rot[2]);
      const k = bucket(name); const s = uvT || 1;
      const h = len / 2;
      const ring = (r, y) => {
        const pts = [];
        for (let i = 0; i < seg; i++) {
          const a = (i / seg) * Math.PI * 2;
          pts.push(xf([Math.cos(a) * r, y, Math.sin(a) * r], R, t));
        }
        return pts;
      };
      const bot = ring(r0, -h), top = ring(r1, h);
      for (let i = 0; i < seg; i++) {
        const j = (i + 1) % seg;
        quad(name, bot[j], bot[i], top[i], top[j], s);
      }
      if (caps) {
        const cTop = xf([0, h, 0], R, t), cBot = xf([0, -h, 0], R, t);
        const nT = xf([0, 1, 0], R, [0, 0, 0]), nB = xf([0, -1, 0], R, [0, 0, 0]);
        for (let i = 0; i < seg; i++) {
          const j = (i + 1) % seg;
          let base = k.p.length / 3;
          for (const pt of [cTop, top[i], top[j]]) { k.p.push(pt[0], pt[1], pt[2]); k.n.push(nT[0], nT[1], nT[2]); }
          k.uv.push(0, 0, 1, 0, 1, 1);
          k.ix.push(base, base + 2, base + 1);
          base = k.p.length / 3;
          for (const pt of [cBot, bot[i], bot[j]]) { k.p.push(pt[0], pt[1], pt[2]); k.n.push(nB[0], nB[1], nB[2]); }
          k.uv.push(0, 0, 1, 0, 1, 1);
          k.ix.push(base, base + 1, base + 2);
        }
      }
    };
    const T5 = (1 + Math.sqrt(5)) / 2;
    const IV = [
      [-1, T5, 0], [1, T5, 0], [-1, -T5, 0], [1, -T5, 0],
      [0, -1, T5], [0, 1, T5], [0, -1, -T5], [0, 1, -T5],
      [T5, 0, -1], [T5, 0, 1], [-T5, 0, -1], [-T5, 0, 1],
    ];
    const IF = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    const blob = (name, c, r, squashY, jitter, rnd) => {
      const k = bucket(name);
      const vs = IV.map((v) => {
        const il = 1 / Math.hypot(v[0], v[1], v[2]);
        const rr = r * (1 + (rnd ? (rnd() - 0.5) * 2 * (jitter || 0) : 0));
        return [c[0] + v[0] * il * rr, c[1] + v[1] * il * rr * (squashY || 1), c[2] + v[2] * il * rr];
      });
      for (const f of IF) {
        const a = vs[f[0]], b = vs[f[1]], d = vs[f[2]];
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
        const wx = d[0] - a[0], wy = d[1] - a[1], wz = d[2] - a[2];
        let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
        const il = 1 / (Math.hypot(nx, ny, nz) || 1); nx *= il; ny *= il; nz *= il;
        const base = k.p.length / 3;
        for (const pt of [a, b, d]) { k.p.push(pt[0], pt[1], pt[2]); k.n.push(nx, ny, nz); }
        k.uv.push(0, 0, 1, 0, 1, 1);
        k.ix.push(base, base + 1, base + 2);
      }
    };
    const build = (THREE, mats) => {
      const g = new THREE.Group();
      for (const [name, b] of slots) {
        if (b.ix.length === 0 || !mats[name]) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
        geo.setIndex(b.ix);
        const mesh = new THREE.Mesh(geo, mats[name]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        g.add(mesh);
      }
      return g;
    };
    return { quad, tri, box, cyl, blob, build };
  }

  // Bake the building's yaw into its collider list (colliders mount beside
  // the rotated object, not inside it).
  function bakeColliders(THREE, cols, yaw) {
    const qY = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    const q = new THREE.Quaternion(); const e = new THREE.Euler(); const v = new THREE.Vector3();
    const UP = new THREE.Vector3(0, 1, 0);
    return cols.map((c) => {
      const r = c.rotation || [0, 0, 0];
      q.setFromEuler(new THREE.Euler(r[0], r[1], r[2], 'XYZ')).premultiply(qY);
      e.setFromQuaternion(q, 'XYZ');
      v.set(c.position[0], c.position[1], c.position[2]).applyAxisAngle(UP, yaw);
      return { half: c.half, position: [v.x, v.y, v.z], rotation: [e.x, e.y, e.z] };
    });
  }

  // ── Wall compiler ───────────────────────────────────────────────────────────
  // One straight run along axis 'x'|'z' at fixed coord `at`, spanning u0→u1.
  // `bands` are vertical material bands [{v0,v1,slot}]; `openings` are
  // [{u0,u1,v0,v1}] in ABSOLUTE u coords. Emits wall boxes only — dressing
  // (frames, glass, shutters) is the caller's job.
  function emitWall(W, cfg) {
    const { axis, at, u0, u1, H, T, y0, bands, openings = [], uvT } = cfg;
    const yaw = axis === 'x' ? 0 : Math.PI / 2;
    const ops = openings.slice().sort((a, b) => a.u0 - b.u0);
    // Group u-overlapping openings into COLUMNS (stacked window rows share a
    // column), then slice each column vertically between its holes.
    const columns = [];
    for (const op of ops) {
      const last = columns[columns.length - 1];
      if (last && op.u0 < last.u1 - 0.01) { last.u1 = Math.max(last.u1, op.u1); last.holes.push(op); }
      else columns.push({ u0: op.u0, u1: op.u1, holes: [op] });
    }
    const segs = [];
    let cursor = u0;
    for (const col of columns) {
      if (col.u0 - cursor > 0.02) segs.push({ u0: cursor, u1: col.u0, v0: 0, v1: H });
      const holes = col.holes.slice().sort((p, q) => p.v0 - q.v0);
      let vc = 0;
      for (const hh of holes) {
        if (hh.v0 - vc > 0.02) segs.push({ u0: col.u0, u1: col.u1, v0: vc, v1: hh.v0 });
        vc = Math.max(vc, hh.v1);
      }
      if (H - vc > 0.02) segs.push({ u0: col.u0, u1: col.u1, v0: vc, v1: H });
      cursor = col.u1;
    }
    if (u1 - cursor > 0.02) segs.push({ u0: cursor, u1, v0: 0, v1: H });
    for (const s of segs) {
      for (const b of bands) {
        const v0 = Math.max(s.v0, b.v0), v1 = Math.min(s.v1, b.v1);
        if (v1 - v0 < 0.02) continue;
        const uc = (s.u0 + s.u1) / 2, vc = (v0 + v1) / 2;
        const x = axis === 'x' ? uc : at;
        const z = axis === 'x' ? at : uc;
        W.box(b.slot, [s.u1 - s.u0, v1 - v0, T], [x, y0 + vc, z], [yaw, 0, 0], uvT || 2.6);
      }
    }
  }

  // Collision boxes for one wall run: solid except at DOOR openings (windows
  // stay solid — shutters/mullions read as impassable anyway).
  function wallColliders(cols, cfg) {
    const { axis, at, u0, u1, H, T, y0, doors = [] } = cfg;
    const push = (a, b, v0, v1) => {
      if (b - a < 0.05 || v1 - v0 < 0.05) return;
      const uc = (a + b) / 2, vc = y0 + (v0 + v1) / 2;
      const half = [(b - a) / 2, (v1 - v0) / 2, T / 2 + 0.02];
      cols.push({
        half: axis === 'x' ? half : [half[2], half[1], half[0]],
        position: axis === 'x' ? [uc, vc, at] : [at, vc, uc],
      });
    };
    const ops = doors.slice().sort((a, b) => a.u0 - b.u0);
    let cursor = u0;
    for (const op of ops) {
      push(cursor, op.u0, 0, H);
      push(op.u0, op.u1, op.v1, H);   // header above the doorway
      cursor = op.u1;
    }
    push(cursor, u1, 0, H);
  }

  // BSP partition → interior wall lines + leaf room rects.
  function partitionRooms(x0, z0, x1, z1, rng, minRoom, depth, walls, rooms) {
    const w = x1 - x0, d = z1 - z0;
    const canX = w >= minRoom * 2, canZ = d >= minRoom * 2;
    if (depth <= 0 || (!canX && !canZ)) { rooms.push({ x0, z0, x1, z1 }); return; }
    if (canX && (!canZ || w >= d)) {
      const sx = x0 + minRoom + rng() * (w - minRoom * 2);
      walls.push([sx, z0, sx, z1]);
      partitionRooms(x0, z0, sx, z1, rng, minRoom, depth - 1, walls, rooms);
      partitionRooms(sx, z0, x1, z1, rng, minRoom, depth - 1, walls, rooms);
    } else {
      const sz = z0 + minRoom + rng() * (d - minRoom * 2);
      walls.push([x0, sz, x1, sz]);
      partitionRooms(x0, z0, x1, sz, rng, minRoom, depth - 1, walls, rooms);
      partitionRooms(x0, sz, x1, z1, rng, minRoom, depth - 1, walls, rooms);
    }
  }

  // ── Window / door dressing ──────────────────────────────────────────────────
  const wallPoint = (axis, at, u, off) => axis === 'x' ? [u, at + off] : [at + off, u];

  function emitWindow(W, cfg, op) {
    const { axis, at, out, y0, T, shutters } = cfg;
    const yaw = axis === 'x' ? 0 : Math.PI / 2;
    const uc = (op.u0 + op.u1) / 2, w = op.u1 - op.u0, h = op.v1 - op.v0;
    const vc = y0 + (op.v0 + op.v1) / 2;
    const P = (u, y, size, off, slot, roll) => {
      const [x, z] = wallPoint(axis, at, u, off || 0);
      W.box(slot, size, [x, y, z], [yaw, 0, roll || 0], 1);
    };
    // jambs + header (proud of the wall both sides), sill ledge outward
    P(op.u0 - 0.05, vc, [0.12, h + 0.24, T + 0.12], 0, 'timber');
    P(op.u1 + 0.05, vc, [0.12, h + 0.24, T + 0.12], 0, 'timber');
    P(uc, y0 + op.v1 + 0.06, [w + 0.22, 0.12, T + 0.12], 0, 'timber');
    P(uc, y0 + op.v0 - 0.05, [w + 0.34, 0.1, T + 0.2], out * 0.05, 'timber');
    // glass pane + cross mullion
    P(uc, vc, [w, h, 0.05], 0, 'glow');
    P(uc, vc, [0.06, h, 0.08], out * 0.02, 'timber');
    P(uc, vc, [w, 0.06, 0.08], out * 0.02, 'timber');
    if (shutters) {
      P(op.u0 - w * 0.3, vc, [w * 0.42, h * 0.96, 0.05], out * (T / 2 + 0.05), 'plank2');
      P(op.u1 + w * 0.3, vc, [w * 0.42, h * 0.96, 0.05], out * (T / 2 + 0.05), 'plank2');
    }
  }

  function emitDoor(W, cfg, op, rng) {
    const { axis, at, out, y0, T } = cfg;
    const yaw = axis === 'x' ? 0 : Math.PI / 2;
    const uc = (op.u0 + op.u1) / 2, w = op.u1 - op.u0, h = op.v1 - op.v0;
    const P = (u, y, size, off, slot, extraYaw) => {
      const [x, z] = wallPoint(axis, at, u, off || 0);
      W.box(slot, size, [x, y, z], [yaw + (extraYaw || 0), 0, 0], 1);
    };
    P(op.u0 - 0.06, y0 + h / 2, [0.16, h + 0.1, T + 0.14], 0, 'timber');
    P(op.u1 + 0.06, y0 + h / 2, [0.16, h + 0.1, T + 0.14], 0, 'timber');
    P(uc, y0 + h + 0.08, [w + 0.44, 0.16, T + 0.16], 0, 'timber');
    // swung-open leaf, hinged on op.u0 — always swings to the OUTWARD side
    // (sign −out keeps −sin(open) on the `out` side of the wall) and opens
    // WIDE (~115-140°, nearly flat against the wall) so the doorway stays clear
    const open = (2.0 + rng() * 0.45) * -out;
    const leafYaw = yaw + open;
    const dx = Math.cos(leafYaw), dz = -Math.sin(leafYaw);
    const [hx, hz] = wallPoint(axis, at, op.u0 + 0.03, out * (T / 2 + 0.03));
    W.box('plank2', [w * 0.94, h - 0.06, 0.07],
      [hx + dx * w * 0.47, y0 + h / 2 - 0.03, hz + dz * w * 0.47], [leafYaw, 0, 0], 1);
    // door lantern on a bracket beside the door — only a seeded fraction of
    // them burn (bloom/emissive budget; a fully-lit town reads like a fair)
    const lit = rng() < LANTERN_LIT;
    const lu = op.u1 + 0.5;
    P(lu, y0 + h - 0.15, [0.08, 0.08, 0.5], out * (T / 2 + 0.2), 'timber');
    P(lu, y0 + h - 0.38, [0.2, 0.28, 0.2], out * (T / 2 + 0.38), lit ? 'lantern' : 'lanternOff');
    P(lu, y0 + h - 0.2, [0.26, 0.06, 0.26], out * (T / 2 + 0.38), 'iron');
  }

  // ── Furniture kits ──────────────────────────────────────────────────────────
  // Every item goes through the building's placement guard `P` (see
  // buildBuilding): no overlap with already-placed furniture, and a clear
  // disc around EVERY doorway (front door + each interior doorway) — the
  // failure mode was beds parked in doorways in 3 of 4 houses. Items that
  // find no valid spot are simply skipped.
  function furnishRoom(W, room, rng, floorTop, cols, kind, P) {
    const rw = room.x1 - room.x0, rd = room.z1 - room.z0;
    if (rw < 2.6 || rd < 2.6) return;
    const cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2;

    // Try candidate centres in order; claim + return the first that fits the
    // room bounds, hits no placed furniture, and blocks no doorway.
    const tryPlace = (candidates, hw2, hd2) => {
      for (const [x, z] of candidates) {
        if (x - hw2 < room.x0 + 0.22 || x + hw2 > room.x1 - 0.22) continue;
        if (z - hd2 < room.z0 + 0.22 || z + hd2 > room.z1 - 0.22) continue;
        if (!P.ok(x, z, hw2, hd2)) continue;
        P.claim(x, z, hw2, hd2);
        return [x, z];
      }
      return null;
    };

    if (kind === 'shop') {
      // counter across the room + produce on top + shelf at the back
      const len = Math.max(2, rw - 2.2);
      const spot = tryPlace([[cx, cz], [cx, cz + 0.8], [cx, cz - 0.8]], len / 2 + 0.1, 0.45);
      if (spot) {
        const [sx2, sz2] = spot;
        W.box('plank2', [len, 0.92, 0.55], [sx2, floorTop + 0.46, sz2], [0, 0, 0], 1.4);
        W.box('timber', [len + 0.2, 0.07, 0.7], [sx2, floorTop + 0.95, sz2], [0, 0, 0], 1.4);
        cols.push({ half: [len / 2 + 0.1, 0.5, 0.35], position: [sx2, floorTop + 0.5, sz2] });
        const items = 2 + (rng() * 3 | 0);
        for (let i = 0; i < items; i++) {
          const u = sx2 - len / 2 + 0.5 + (len - 1) * (i + 0.5) / items;
          W.blob(rng() < 0.5 ? 'pumpkin' : 'cabbage', [u, floorTop + 1.14, sz2 + (rng() - 0.5) * 0.3], 0.16 + rng() * 0.06, 0.8, 0.1, rng);
        }
      }
      const shelfW = Math.min(rw - 1.8, 3);
      const sspot = tryPlace([[cx, room.z0 + 0.32], [cx - 1.2, room.z0 + 0.32], [cx + 1.2, room.z0 + 0.32]], shelfW / 2, 0.24);
      if (sspot) {
        for (let s = 0; s < 3; s++) {
          W.box('plank', [shelfW, 0.05, 0.34], [sspot[0], floorTop + 0.7 + s * 0.55, sspot[1]], [0, 0, 0], 1.2);
        }
        for (const dx of [-shelfW / 2 + 0.05, shelfW / 2 - 0.05]) {
          W.box('timber', [0.07, 1.85, 0.32], [sspot[0] + dx, floorTop + 0.93, sspot[1]], [0, 0, 0], 1);
        }
        cols.push({ half: [shelfW / 2, 0.95, 0.2], position: [sspot[0], floorTop + 0.95, sspot[1]] });
      }
      for (let b = 0; b < 2; b++) {
        const corners = [[room.x0 + 0.6, room.z1 - 0.65], [room.x1 - 0.6, room.z1 - 0.65], [room.x0 + 0.6, room.z0 + 0.65], [room.x1 - 0.6, room.z0 + 0.65]];
        const cspot = tryPlace(corners.slice(b * 2), 0.35, 0.35);
        if (cspot) W.box('plank2', [0.6, 0.55, 0.6], [cspot[0], floorTop + 0.28, cspot[1]], [rng() * 0.5, 0, 0], 0.7);
      }
      return;
    }

    // rug first (under the table) — doorway check only, no claim
    if (rng() < 0.5 && P.ok(cx, cz, 1.0, 0.75)) {
      W.box('cloth', [Math.min(2, rw - 1.6), 0.025, Math.min(1.4, rd - 1.6)], [cx, floorTop + 0.13, cz], [0, 0, 0], 1);
    }
    // table + stools in roomy rooms (claim includes the stool ring)
    if (rw >= 3.4 && rd >= 3.4 && rng() < 0.85) {
      const jx = (rng() - 0.5) * 1.2, jz = (rng() - 0.5) * 1.2;
      const spot = tryPlace([[cx, cz], [cx + jx, cz + jz]], 1.15, 1.0);
      if (spot) {
        const [tx2, tz2] = spot;
        W.box('plank2', [1.3, 0.07, 0.9], [tx2, floorTop + 0.72, tz2], [0, 0, 0], 1.2);
        for (const [sx, sz] of [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]]) {
          W.box('timber', [0.09, 0.7, 0.09], [tx2 + sx, floorTop + 0.35, tz2 + sz], [0, 0, 0], 1);
        }
        cols.push({ half: [0.65, 0.4, 0.45], position: [tx2, floorTop + 0.4, tz2] });
        const stools = 1 + (rng() * 2 | 0);
        for (let s = 0; s < stools; s++) {
          const a = rng() * Math.PI * 2;
          W.box('plank2', [0.38, 0.44, 0.38], [tx2 + Math.cos(a) * 1.0, floorTop + 0.22, tz2 + Math.sin(a) * 0.85], [rng(), 0, 0], 0.5);
        }
      }
    }
    // bed against a wall — several stations tried, doorway-safe
    if (rd >= 3.2 && rng() < 0.7) {
      const first = rng() < 0.5;
      const sides = first ? [room.x0 + 0.78, room.x1 - 0.78] : [room.x1 - 0.78, room.x0 + 0.78];
      const cands = [];
      for (const bx of sides) for (const bz of [room.z0 + 1.35, cz, room.z1 - 1.35]) cands.push([bx, bz]);
      const spot = tryPlace(cands, 0.62, 1.12);
      if (spot) {
        const [bx, bz] = spot;
        W.box('timber', [1.1, 0.3, 2.1], [bx, floorTop + 0.18, bz], [0, 0, 0], 1.2);        // frame
        W.box('cloth', [1.0, 0.18, 1.95], [bx, floorTop + 0.4, bz], [0, 0, 0], 1.2);        // mattress
        W.box('plaster', [0.85, 0.12, 0.5], [bx, floorTop + 0.52, bz - 0.65], [0, 0, 0], 1); // pillow
        W.box('timber', [1.15, 0.75, 0.09], [bx, floorTop + 0.45, bz - 1.06], [0, 0, 0], 1); // headboard
        cols.push({ half: [0.58, 0.3, 1.08], position: [bx, floorTop + 0.3, bz] });
      }
    }
    // shelf against the back or front wall
    if (rw >= 3 && rng() < 0.55) {
      const su = cx + (rng() - 0.5) * (rw - 2.8);
      const spot = tryPlace([[su, room.z1 - 0.3], [su, room.z0 + 0.3], [cx, room.z1 - 0.3]], 0.75, 0.25);
      if (spot) {
        const [sx, sz] = spot;
        for (const dy of [0.55, 1.05, 1.55]) {
          W.box('plank', [1.4, 0.05, 0.3], [sx, floorTop + dy, sz], [0, 0, 0], 1.2);
        }
        for (const dx of [-0.68, 0.68]) {
          W.box('timber', [0.07, 1.7, 0.3], [sx + dx, floorTop + 0.85, sz], [0, 0, 0], 1);
        }
        cols.push({ half: [0.75, 0.9, 0.2], position: [sx, floorTop + 0.9, sz] });
      }
    }
    // barrel in a corner
    if (rng() < 0.4) {
      const corners = [
        [room.x0 + 0.55, room.z0 + 0.55], [room.x1 - 0.55, room.z0 + 0.55],
        [room.x0 + 0.55, room.z1 - 0.55], [room.x1 - 0.55, room.z1 - 0.55],
      ];
      const start = rng() * 4 | 0;
      const spot = tryPlace([0, 1, 2, 3].map((i) => corners[(start + i) % 4]), 0.35, 0.35);
      if (spot) {
        W.cyl('plank2', 0.3, 0.27, 0.8, 9, [spot[0], floorTop + 0.4, spot[1]], [0, 0, 0], true, 0.8);
        cols.push({ half: [0.3, 0.4, 0.3], position: [spot[0], floorTop + 0.4, spot[1]] });
      }
    }
  }

  // ── Roofs ───────────────────────────────────────────────────────────────────
  function emitGableRoof(W, o, L, Wd, top, rise, ov, roofSlot, gableSlot) {
    const hz = Wd / 2, run = hz + ov;
    const ang = Math.atan2(rise, run), slope = Math.hypot(run, rise);
    for (const sign of [1, -1]) {
      W.box(roofSlot, [L + ov * 2, 0.14, slope + 0.2], [0, top + rise / 2 + 0.04, sign * run / 2], [0, sign * ang, 0], 2.4);
      // fascia board at the eave
      W.box('timber', [L + ov * 2, 0.2, 0.07], [0, top + 0.08, sign * (run + 0.06)], [0, 0, 0], 1.4);
      // barge boards up the gable edges
      for (const sx of [1, -1]) {
        W.box('timber', [0.09, 0.18, slope], [sx * (L / 2 + ov - 0.05), top + rise / 2 + 0.1, sign * run / 2], [0, sign * ang, 0], 1.4);
      }
    }
    // ridge cap
    W.box('timber', [L + ov * 2 + 0.12, 0.1, 0.42], [0, top + rise + 0.1, 0], [0, 0, 0], 1.4);
    // gable infill triangles (winding: outward normal per side)
    for (const sx of [1, -1]) {
      const x = sx * L / 2;
      const a = [x, top, -hz], b = [x, top, hz], c = [x, top + rise, 0];
      if (sx > 0) W.tri(gableSlot, b, a, c, 2.6); else W.tri(gableSlot, a, b, c, 2.6);
    }
  }

  function emitHipRoof(W, o, L, Wd, top, rise, ov, roofSlot) {
    const hx = L / 2 + ov, hz = Wd / 2 + ov;
    const rx = Math.max(0.3, (L - Wd) / 2);
    for (const s of [1, -1]) {
      // trapezoid slopes (±Z)
      W.quad(roofSlot,
        [-hx * s, top, hz * s], [hx * s, top, hz * s], [rx * s, top + rise, 0], [-rx * s, top + rise, 0], 2.4);
      // triangle ends (±X)
      W.tri(roofSlot, [hx * s, top, hz * s], [hx * s, top, -hz * s], [rx * s, top + rise, 0], 2.4);
    }
    W.box('timber', [rx * 2 + 0.3, 0.1, 0.34], [0, top + rise + 0.04, 0], [0, 0, 0], 1.4);
  }

  function emitShedRoof(W, o, L, Wd, top, rise, ov, roofSlot, sideSlot, T) {
    const hz = Wd / 2, run = Wd + ov * 2;
    const ang = Math.atan2(rise, run);
    const slope = Math.hypot(run, rise);
    // one slab, high at the FRONT (+Z)
    W.box(roofSlot, [L + ov * 2, 0.13, slope], [0, top + rise / 2 + 0.05, 0], [0, -ang, 0], 2.4);
    // front band under the raised eave (on the wall plane)
    W.box(sideSlot, [L, rise, T], [0, top + rise / 2, hz - T / 2], [0, 0, 0], 2.6);
    // side triangles (winding: outward normal per side)
    for (const sx of [1, -1]) {
      const x = sx * L / 2;
      const a = [x, top, -hz], b = [x, top, hz], c = [x, top + rise, hz];
      if (sx > 0) W.tri(sideSlot, b, a, c, 2.6); else W.tri(sideSlot, a, b, c, 2.6);
    }
    W.box('timber', [L + ov * 2, 0.16, 0.07], [0, top + rise + 0.02, hz + ov], [0, 0, 0], 1.4);
  }

  // ── The building compiler ───────────────────────────────────────────────────
  // plan → walls/rooms/openings → writer emission + explicit colliders.
  function buildBuilding(THREE, o, rng, faceAngle) {
    const W = createWriter();
    const cols = [];
    const Wid = o.W, D = o.D, H = o.H, hw = Wid / 2, hd = D / 2;
    const T = o.barn ? 0.34 : 0.28;
    const TI = 0.16;

    // Plinth: raised stone base so a large flat floor clears rolling ground.
    const maxHalf = Math.max(hw, hd);
    const FLOOR_TOP = Math.min(1.6, 0.35 + 0.09 * maxHalf);
    const found = [Wid + T * 2 + 0.5, FLOOR_TOP + 1.8, D + T * 2 + 0.5];
    W.box('stoneDark', found, [0, FLOOR_TOP - 0.1 - found[1] / 2, 0], [0, 0, 0], 3);
    W.box('floor', [Wid + T * 2, 0.2, D + T * 2], [0, FLOOR_TOP - 0.1, 0], [0, 0, 0], 2.2);
    cols.push({ half: [found[0] / 2, FLOOR_TOP / 2 + 0.9, found[2] / 2], position: [0, FLOOR_TOP - (FLOOR_TOP / 2 + 0.9), 0] });

    const x0 = -hw - T / 2, x1 = hw + T / 2, z0 = -hd - T / 2, z1 = hd + T / 2;
    const doorH = o.barn ? 3.4 : 2.35, doorW = o.barn ? 3.4 : 1.8;
    const winW = 1.25, winH = 1.4, sill = 1.1;

    // Interior rooms FIRST so the door/windows can dodge wall junctions.
    const walls = [], rooms = [];
    if (!o.barn) partitionRooms(x0, z0, x1, z1, rng, o.minRoom || 4, o.roomDepth || 2, walls, rooms);
    const isVert = (w) => Math.abs(w[0] - w[2]) < 1e-6;
    const frontX = walls.filter((w) => isVert(w) && Math.max(w[1], w[3]) >= z1 - 0.01).map((w) => w[0]);
    const backX = walls.filter((w) => isVert(w) && Math.min(w[1], w[3]) <= z0 + 0.01).map((w) => w[0]);
    const leftZ = walls.filter((w) => !isVert(w) && Math.min(w[0], w[2]) <= x0 + 0.01).map((w) => w[1]);
    const rightZ = walls.filter((w) => !isVert(w) && Math.max(w[0], w[2]) >= x1 - 0.01).map((w) => w[1]);

    // Door in the widest gap between front-touching interior walls.
    let doorX = 0;
    {
      const cuts = [x0, ...frontX.slice().sort((a, b) => a - b), x1];
      let best = -1;
      for (let i = 0; i + 1 < cuts.length; i++) {
        const wdt = cuts[i + 1] - cuts[i];
        if (wdt > best) { best = wdt; doorX = (cuts[i] + cuts[i + 1]) / 2; }
      }
    }

    // Furniture placement guard: placed rects + clear discs around EVERY
    // doorway. furnishRoom refuses any spot that overlaps either.
    const placedRects = [];
    const clearZones = [{ x: doorX, z: z1, r: 2.2 }];   // front door approach
    const guard = {
      ok(x, z, hw2, hd2) {
        for (const r of placedRects) {
          if (Math.abs(x - r.x) < hw2 + r.hw + 0.2 && Math.abs(z - r.z) < hd2 + r.hd + 0.2) return false;
        }
        for (const zo of clearZones) {
          const ddx = Math.max(Math.abs(x - zo.x) - hw2, 0);
          const ddz = Math.max(Math.abs(z - zo.z) - hd2, 0);
          if (ddx * ddx + ddz * ddz < zo.r * zo.r) return false;
        }
        return true;
      },
      claim(x, z, hw2, hd2) { placedRects.push({ x, z, hw: hw2, hd: hd2 }); },
    };

    const winRow = (u0, u1, junct, avoid) => {
      const len = u1 - u0;
      const n = Math.max(1, Math.round(len / 4.2));
      const out = [];
      for (let i = 1; i <= n; i++) {
        const c = u0 + len * i / (n + 1);
        if (avoid && Math.abs(c - avoid.c) < avoid.half + 0.85) continue;
        if (junct.some((j) => Math.abs(c - j) < 1.15)) continue;
        out.push({ u0: c - winW / 2, u1: c + winW / 2, v0: sill, v1: sill + winH });
      }
      return out;
    };

    const bands = o.bands || [{ v0: 0, v1: H, slot: o.wallSlot }];
    const doorOp = { u0: doorX - doorW / 2, u1: doorX + doorW / 2, v0: 0, v1: doorH };
    const wallsDef = [
      { key: 'front', axis: 'x', at: z1, out: 1, u0: x0, u1: x1, junct: frontX },
      { key: 'back', axis: 'x', at: z0, out: -1, u0: x0, u1: x1, junct: backX },
      { key: 'left', axis: 'z', at: x0, out: -1, u0: z0, u1: z1, junct: leftZ },
      { key: 'right', axis: 'z', at: x1, out: 1, u0: z0, u1: z1, junct: rightZ },
    ];
    for (const wd of wallsDef) {
      const isFront = wd.key === 'front';
      const wins = o.barn ? [] : winRow(wd.u0, wd.u1, wd.junct, isFront ? { c: doorX, half: doorW / 2 } : null);
      // Tall buildings get a second (upper-floor) window row in the same
      // columns — emitWall slices stacked openings per column. Floor of the
      // row clears the fixed timber band at 2.72 (+ its frame).
      const wins2 = (!o.barn && H > 4.4)
        ? wins.map((w2) => ({ ...w2, v0: Math.max(H - 1.75, 3.0), v1: H - 0.45 }))
        : [];
      const openings = isFront ? [doorOp, ...wins, ...wins2] : [...wins, ...wins2];
      const cfg = { axis: wd.axis, at: wd.at, out: wd.out, u0: wd.u0, u1: wd.u1, H, T, y0: FLOOR_TOP, bands, openings };
      emitWall(W, cfg);
      wallColliders(cols, { ...cfg, doors: isFront ? [doorOp] : [] });
      for (const win of wins) emitWindow(W, { ...cfg, shutters: o.shutters }, win);
      for (const win of wins2) emitWindow(W, { ...cfg, shutters: false }, win);
      if (isFront && !o.barn) emitDoor(W, cfg, doorOp, rng);
    }

    // Barn: big open doorway, slid-open panels, X-braces on the corners.
    if (o.barn) {
      for (const s of [1, -1]) {
        const px = doorX + s * (doorW / 2 + 0.9);
        W.box('barn', [1.7, doorH - 0.2, 0.09], [px, FLOOR_TOP + doorH / 2 - 0.1, z1 + T / 2 + 0.08], [0, 0, 0], 2.4);
        W.box('timber', [1.75, 0.12, 0.12], [px, FLOOR_TOP + doorH - 0.2, z1 + T / 2 + 0.1], [0, 0, 0], 1);
        for (const rr of [0.5, -0.5]) {
          W.box('timber', [2.1, 0.1, 0.1], [px, FLOOR_TOP + doorH / 2 - 0.1, z1 + T / 2 + 0.12], [0, 0, rr], 1);
        }
      }
    }

    // Timber framing: corner posts + top plate + mid band + front braces.
    if (o.timber) {
      for (const cx of [x0, x1]) {
        for (const cz of [z0, z1]) {
          W.box('timber', [0.24, H + 0.1, 0.24], [cx, FLOOR_TOP + H / 2, cz], [0, 0, 0], 1.4);
        }
      }
      for (const wd of wallsDef) {
        const len = wd.u1 - wd.u0;
        const yaw = wd.axis === 'x' ? 0 : Math.PI / 2;
        const mk = (v, dv) => {
          const [x, z] = wd.axis === 'x' ? [(wd.u0 + wd.u1) / 2, wd.at] : [wd.at, (wd.u0 + wd.u1) / 2];
          W.box('timber', [len, dv, T + 0.1], [x, FLOOR_TOP + v, z], [yaw, 0, 0], 1.4);
        };
        mk(H - 0.1, 0.16);          // top plate
        // Upper-floor band: a FIXED architectural datum above the door lintel
        // (2.35+frame) and the ground-floor window heads (2.5) — NOT a
        // fraction of H. A proportional band on mid-height buildings cut
        // straight across the doorway and windows.
        if (H > 3.9) mk(2.72, 0.13);
      }
      // diagonal braces flanking the front corners — only on buildings
      // WITHOUT an upper window row (on tall fronts they crossed the
      // upper-floor windows)
      if (H <= 4.4) {
        for (const s of [1, -1]) {
          const bx = doorX + s * Math.min(hw - 1, doorW / 2 + 2.2);
          if (Math.abs(bx) < hw - 0.8) {
            W.box('timber', [1.5, 0.11, 0.1], [bx, FLOOR_TOP + H - 0.75, z1 + 0.03], [0, 0, s * 0.65], 1);
          }
        }
      }
    }

    // Interior walls (BSP) with a doorway each; furniture per leaf room.
    for (const [ax, az, bx, bz] of walls) {
      const vert = Math.abs(ax - bx) < 1e-6;
      const len = Math.hypot(bx - ax, bz - az);
      const df = 0.25 + rng() * 0.5;
      const u0 = vert ? Math.min(az, bz) : Math.min(ax, bx);
      const dop = { u0: u0 + df * len - 0.8, u1: u0 + df * len + 0.8, v0: 0, v1: 2.3 };
      const cfg = {
        axis: vert ? 'z' : 'x', at: vert ? ax : az, out: 1,
        u0, u1: u0 + len, H, T: TI, y0: FLOOR_TOP,
        bands: [{ v0: 0, v1: H, slot: o.innerSlot || 'plank' }],
        openings: [dop],
      };
      emitWall(W, cfg);
      wallColliders(cols, { ...cfg, doors: [dop] });
      // keep furniture out of this doorway (both rooms it connects)
      const du = u0 + df * len;
      clearZones.push(vert ? { x: ax, z: du, r: 1.9 } : { x: du, z: az, r: 1.9 });
    }
    if (!o.barn) {
      const doorRoom = rooms.find((r) => doorX >= r.x0 && doorX <= r.x1 && r.z1 >= z1 - 0.1);
      for (const room of rooms) {
        furnishRoom(W, room, rng, FLOOR_TOP, cols, (o.shop && room === doorRoom) ? 'shop' : 'home', guard);
      }
    } else {
      // hay bales + crates in the open volume — clear of the big doorway
      const bales = 3 + (rng() * 3 | 0);
      for (let b = 0; b < bales; b++) {
        let bx2 = 0, bz2 = 0, found = false;
        for (let t = 0; t < 4 && !found; t++) {
          bx2 = (rng() - 0.5) * (Wid - 3);
          bz2 = -hd + 1.6 + rng() * (D - 3.4);
          found = guard.ok(bx2, bz2, 0.8, 0.8) && Math.hypot(bx2 - doorX, bz2 - z1) > 3.2;
        }
        if (!found) continue;
        guard.claim(bx2, bz2, 0.8, 0.8);
        const yaw = rng() * Math.PI;
        W.cyl('hay', 0.75, 0.75, 1.4, 11, [bx2, FLOOR_TOP + 0.75, bz2], [yaw, 0, Math.PI / 2], true, 1);
        cols.push({ half: [0.75, 0.75, 0.75], position: [bx2, FLOOR_TOP + 0.75, bz2], rotation: [0, yaw, 0] });
      }
      // loft beams
      for (let i = 1; i <= 2; i++) {
        W.box('timber', [Wid + T, 0.16, 0.18], [0, FLOOR_TOP + H - 0.6, -hd + i * D / 3], [0, 0, 0], 1.4);
      }
    }

    // Ceiling + exposed beams (barn is open to the rafters).
    if (!o.barn) {
      W.box('ceiling', [Wid + T, 0.08, D + T], [0, FLOOR_TOP + H - 0.04, 0], [0, 0, 0], 2.4);
      const nBeams = Math.max(2, Math.round(Wid / 3.2));
      for (let i = 1; i < nBeams; i++) {
        W.box('timber', [0.16, 0.2, D + T], [-hw + i * Wid / nBeams, FLOOR_TOP + H - 0.16, 0], [0, 0, 0], 1.4);
      }
    }

    // Roof.
    const top = FLOOR_TOP + H, rise = o.rise || 2.0;
    const L = Wid + T * 2, Wd = D + T * 2, ov = o.barn ? 0.5 : 0.55;
    const gableSlot = o.gableSlot || (o.timber ? 'plank' : o.wallSlot);
    if (o.roof === 'hip') emitHipRoof(W, o, L, Wd, top, rise, ov, o.roofSlot);
    else if (o.roof === 'shed') emitShedRoof(W, o, L, Wd, top, rise, ov, o.roofSlot, gableSlot, T);
    else emitGableRoof(W, o, L, Wd, top, rise, ov, o.roofSlot, gableSlot);

    // SHELTER COLLIDER. The engine's `sheltered` flag (Player.jsx — what the
    // weather plugin gates ALL rain on) is a rapier ray cast straight UP: it
    // sees COLLIDERS, not visuals. The ceiling box above is visual geometry
    // only — there was NO collider anywhere overhead, so the ray exited
    // through the roof and it rained inside every building. One thin cuboid
    // across the footprint (+eaves overhang) at ceiling height — roof line
    // for barns, which are open to the rafters — makes interiors (and the
    // strip under the eaves) read as covered.
    cols.push({
      half: [(Wid + T * 2) / 2 + ov, 0.06, (D + T * 2) / 2 + ov],
      position: [0, o.barn ? top + 0.1 : FLOOR_TOP + H - 0.04, 0],
    });

    // Chimney (stone, capped) against a side wall.
    if (o.chimney) {
      const cx = (rng() < 0.5 ? -1 : 1) * (hw - 0.75);
      const cz = (rng() < 0.5 ? -1 : 1) * (hd - 0.9);
      const topY = top + (o.roof === 'shed' ? rise + 0.7 : rise + 0.9);
      const chimH = topY - FLOOR_TOP;
      W.box('stone', [0.7, chimH, 0.7], [cx, FLOOR_TOP + chimH / 2, cz], [0, 0, 0], 2);
      W.box('stoneDark', [0.95, 0.18, 0.95], [cx, topY + 0.09, cz], [0, 0, 0], 2);
      cols.push({ half: [0.35, chimH / 2, 0.35], position: [cx, FLOOR_TOP + chimH / 2, cz] });
    } else if (o.stovepipe) {
      const px = hw * 0.4, pz = -hd * 0.3;
      W.cyl('iron', 0.14, 0.14, rise + 1.6, 7, [px, top + rise / 2 + 0.4, pz], [0, 0, 0], true, 1);
    }

    // Porch awning on posts over the door.
    if (o.porch && !o.barn) {
      const pw = Math.min(Wid * 0.6, doorW + 2.6), pd = 1.9, ph = Math.min(H - 0.3, 2.7);
      for (const px of [doorX - pw / 2 + 0.14, doorX + pw / 2 - 0.14]) {
        W.box('timber', [0.16, ph, 0.16], [px, FLOOR_TOP + ph / 2, z1 + pd - 0.14], [0, 0, 0], 1);
        cols.push({ half: [0.09, ph / 2, 0.09], position: [px, FLOOR_TOP + ph / 2, z1 + pd - 0.14] });
      }
      W.box(o.roofSlot, [pw + 0.4, 0.12, pd + 0.5], [doorX, FLOOR_TOP + ph + 0.14, z1 + pd / 2], [0, -0.16, 0], 2.4);
      // Porch awning shelters too (same rapier-up-ray contract as the roof).
      cols.push({ half: [(pw + 0.4) / 2, 0.07, (pd + 0.5) / 2], position: [doorX, FLOOR_TOP + ph + 0.14, z1 + pd / 2] });
    }

    // Hanging shop sign.
    if (o.shop) {
      const su = doorX - doorW / 2 - 1.0;
      W.box('timber', [0.09, 0.09, 0.9], [su, FLOOR_TOP + doorH + 0.5, z1 + 0.45], [0, 0, 0], 1);
      for (const du of [-0.25, 0.25]) {
        W.box('iron', [0.03, 0.3, 0.03], [su + du, FLOOR_TOP + doorH + 0.22, z1 + 0.7], [0, 0, 0], 1);
      }
      W.box('plank2', [0.8, 0.55, 0.06], [su, FLOOR_TOP + doorH - 0.2, z1 + 0.7], [0, 0, 0], 1);
    }

    // Entrance ramp up the plinth, aligned to the door (~21° — short enough
    // that ramps don't inflate the building footprint into the neighbours).
    let rampFootZ = z1 + 2.5;
    {
      const rise2 = FLOOR_TOP, run = Math.max(2.2, rise2 * 2.6);
      const ang = Math.atan2(rise2, run);
      const slen = Math.hypot(run, rise2);
      W.box('stoneDark', [doorW + 1.1, 0.15, slen], [doorX, rise2 / 2, z1 + 0.1 + run / 2], [0, ang, 0], 2.6);
      cols.push({
        half: [(doorW + 1.1) / 2, 0.09, slen / 2],
        position: [doorX, rise2 / 2, z1 + 0.1 + run / 2],
        rotation: [ang, 0, 0],
      });
      rampFootZ = z1 + 0.1 + run + 0.4;
    }

    // ── Yard: a square grass plot around the home (residential/outskirts) ──
    // Green lawn slabs ring the plinth with a CORRIDOR NOTCH in front of the
    // door — the ramp and the painted stone door-walk pass through untouched,
    // so the yard never severs the path from the door to the street. The
    // margin (2.8) stays inside the claimed footprint (FOOT_EXTRA 3.8), so
    // yards can't overlap neighbouring buildings. Slab tops sit +0.10 above
    // the cobble (a subtle raised-lawn lip, same family as the stone-ringed
    // flower beds); the body is sunk 0.7 to ride out terrain undulation.
    // Most yards get a low picket fence with its GATE GAP on the corridor.
    // Decorative only: no colliders — players can step over/through.
    if (o.yard) {
      const m = 2.8;
      const px0 = -(hw + T + 0.25), px1 = hw + T + 0.25;   // plinth edges
      const pz0 = -(hd + T + 0.25), pz1 = hd + T + 0.25;
      const yx0 = px0 - m, yx1 = px1 + m;
      const yz0 = pz0 - m, yz1 = pz1 + m;
      const cw = (doorW + 1.1) / 2 + 0.4;                  // corridor half-width (covers ramp + walk)
      const LT = 0.8, LY = 0.1 - LT / 2;                   // slab top at +0.10
      const slab = (xa, xb, za, zb) => {
        if (xb - xa < 0.3 || zb - za < 0.3) return;
        W.box('lawn', [xb - xa, LT, zb - za], [(xa + xb) / 2, LY, (za + zb) / 2], [0, 0, 0], 1.7);
      };
      slab(yx0, px0, yz0, yz1);                            // left run
      slab(px1, yx1, yz0, yz1);                            // right run
      slab(px0, px1, yz0, pz0);                            // back strip
      slab(px0, doorX - cw, pz1, yz1);                     // front, left of the walk
      slab(doorX + cw, px1, pz1, yz1);                     // front, right of the walk

      if (rng() < 0.7) {
        const fx0 = yx0 + 0.18, fx1 = yx1 - 0.18;
        const fz0 = yz0 + 0.18, fz1 = yz1 - 0.18;
        const FH = 0.78, PT = 0.09;
        const post = (x, z) => W.box('timber', [PT, FH, PT], [x, 0.1 + FH / 2, z], [0, 0, 0], 1);
        const railsX = (xa, xb, z) => {
          if (xb - xa < 0.5) return;
          for (const ry of [0.32, 0.62]) W.box('plank', [xb - xa, 0.07, 0.05], [(xa + xb) / 2, 0.1 + ry, z], [0, 0, 0], 1.6);
          const n = Math.max(1, Math.round((xb - xa) / 2.2));
          for (let i = 0; i <= n; i++) post(xa + ((xb - xa) * i) / n, z);
        };
        const railsZ = (x, za, zb) => {
          if (zb - za < 0.5) return;
          for (const ry of [0.32, 0.62]) W.box('plank', [0.05, 0.07, zb - za], [x, 0.1 + ry, (za + zb) / 2], [0, 0, 0], 1.6);
          const n = Math.max(1, Math.round((zb - za) / 2.2));
          for (let i = 0; i <= n; i++) post(x, za + ((zb - za) * i) / n);
        };
        railsX(fx0, fx1, fz0);                             // back fence
        railsZ(fx0, fz0, fz1);                             // left
        railsZ(fx1, fz0, fz1);                             // right
        railsX(fx0, doorX - cw, fz1);                      // front, left of the gate
        railsX(doorX + cw, fx1, fz1);                      // front, right of the gate
      }
    }

    const yaw = faceAngle + (rng() - 0.5) * 0.15;
    const g = W.build(THREE, ensureMats(THREE));
    g.rotation.y = yaw;
    g.userData.xrColliders = bakeColliders(THREE, cols, yaw);
    // Door/ramp-foot in LOCAL coords + the final yaw — callers use this to
    // start a walking path exactly where the ramp meets the ground.
    g.userData.__doorLocal = [doorX, rampFootZ];
    g.userData.__yaw = yaw;
    return g;
  }

  // ── Variant plans, per ring ────────────────────────────────────────────────
  // Ring 0 hugs the plaza (shops, tavern, townhouses); ring 1 is residential
  // (cottages, manors); ring 2 is the outskirts (barns, shacks, cottages).
  function makePlan(rng, ring) {
    const pick = (a) => a[rng() * a.length | 0];
    const r = rng();
    const type =
      ring === 0 ? (r < 0.4 ? 'shop' : r < 0.62 ? 'tavern' : 'townhouse')
      : ring === 1 ? (r < 0.42 ? 'cottage' : r < 0.68 ? 'manor' : 'townhouse')
      : (r < 0.34 ? 'barn' : r < 0.66 ? 'shack' : 'cottage');

    if (type === 'shack') {
      return { W: 7 + rng() * 2.5, D: 6 + rng() * 2, H: 2.8 + rng() * 0.4, rise: 1.0 + rng() * 0.4,
        roof: 'shed', roofSlot: 'shake', wallSlot: pick(['plank2', 'plank']), innerSlot: 'plank',
        roomDepth: 1, minRoom: 3.6, stovepipe: rng() < 0.5, shutters: false };
    }
    if (type === 'cottage') {
      const thatched = rng() < 0.35;
      return { W: 10.5 + rng() * 3.5, D: 8.5 + rng() * 2.5, H: 3.3 + rng() * 0.4, rise: 2.1 + rng() * 0.7,
        roof: 'gable', roofSlot: thatched ? 'thatch' : pick(['shingleRed', 'shingleBlue']),
        wallSlot: pick(['plaster', 'plaster2', 'plank']), innerSlot: 'plank',
        timber: true, shutters: true, roomDepth: 2, minRoom: 4.6,
        chimney: rng() < 0.75, porch: rng() < 0.5 };
    }
    if (type === 'townhouse') {
      return { W: 10 + rng() * 3, D: 10 + rng() * 3.5, H: 4.8 + rng() * 0.7, rise: 2.6 + rng() * 0.6,
        roof: 'gable', roofSlot: pick(['shingleBlue', 'shingleRed']),
        wallSlot: pick(['plaster', 'plaster2']), innerSlot: 'plank',
        timber: true, shutters: true, roomDepth: 2, minRoom: 4.6, chimney: rng() < 0.65 };
    }
    if (type === 'shop') {
      return { W: 11 + rng() * 3, D: 8.5 + rng() * 2.5, H: 3.6 + rng() * 0.4, rise: 2.2 + rng() * 0.5,
        roof: 'gable', roofSlot: pick(['shingleBlue', 'shingleRed']),
        wallSlot: pick(['plaster', 'plaster2']), innerSlot: 'plank',
        timber: true, shutters: true, shop: true, roomDepth: 1, minRoom: 5.2,
        chimney: rng() < 0.4, porch: rng() < 0.6 };
    }
    if (type === 'tavern') {
      return { W: 16 + rng() * 4, D: 12 + rng() * 3, H: 4.6 + rng() * 0.6, rise: 3.0 + rng() * 0.8,
        roof: rng() < 0.5 ? 'gable' : 'hip', roofSlot: 'shake',
        wallSlot: 'plaster', innerSlot: 'plank', gableSlot: 'plank',
        bands: [{ v0: 0, v1: 1.5, slot: 'stone' }, { v0: 1.5, v1: 99, slot: 'plaster' }],
        timber: true, shutters: true, shop: true, roomDepth: 2, minRoom: 6.5, chimney: true };
    }
    if (type === 'manor') {
      return { W: 15 + rng() * 4, D: 12 + rng() * 3, H: 4.1 + rng() * 0.6, rise: 2.6 + rng() * 0.7,
        roof: rng() < 0.5 ? 'hip' : 'gable', roofSlot: pick(['shingleBlue', 'shake']),
        wallSlot: pick(['plaster', 'plaster2']), innerSlot: 'plank',
        bands: [{ v0: 0, v1: 0.9, slot: 'stone' }, { v0: 0.9, v1: 99, slot: rng() < 0.5 ? 'plaster' : 'plaster2' }],
        timber: true, shutters: true, roomDepth: 3, minRoom: 5.4,
        chimney: true, porch: rng() < 0.6 };
    }
    // barn
    return { W: 13 + rng() * 4, D: 10 + rng() * 3, H: 4.5 + rng() * 0.6, rise: 3.2 + rng() * 0.6,
      roof: 'gable', roofSlot: 'shake', wallSlot: 'barn', gableSlot: 'barn', barn: true };
  }

  // Clamp bands to the actual wall height once the plan is drawn.
  function normalizePlan(o) {
    if (o.bands) for (const b of o.bands) b.v1 = Math.min(b.v1, o.H);
    return o;
  }

  // ── Plaza props ─────────────────────────────────────────────────────────────
  function buildWell(THREE, rng) {
    const W = createWriter();
    const cols = [];
    W.cyl('stone', 1.5, 1.42, 1.05, 12, [0, 0.32, 0], [0, 0, 0], false, 2.2);   // ring (sunk 0.2)
    W.cyl('stoneDark', 1.62, 1.55, 0.16, 12, [0, 0.93, 0], [0, 0, 0], true, 2.2); // lip
    W.cyl('water', 1.3, 1.3, 0.05, 12, [0, 0.45, 0], [0, 0, 0], true, 1);       // water disc
    for (const s of [1, -1]) {
      W.box('timber', [0.14, 2.1, 0.14], [s * 1.25, 1.5, 0], [0, 0, s * 0.05], 1);
    }
    W.box('timber', [2.9, 0.12, 0.12], [0, 2.5, 0], [0, 0, 0], 1);              // crossbar
    W.cyl('timber', 0.09, 0.09, 1.1, 7, [0, 2.36, 0], [0, 0, Math.PI / 2], true, 1); // winch drum
    W.box('iron', [0.03, 0.9, 0.03], [0.25, 1.95, 0], [0, 0, 0], 1);            // rope
    W.cyl('plank2', 0.18, 0.15, 0.28, 8, [0.25, 1.45, 0], [0, 0, 0], true, 0.6); // bucket
    // little gable roof over the well
    const top = 2.62, rise = 0.65, run = 1.15;
    const ang = Math.atan2(rise, run), slope = Math.hypot(run, rise);
    for (const sign of [1, -1]) {
      W.box('shingleRed', [3.3, 0.09, slope + 0.15], [0, top + rise / 2, sign * run / 2], [0, sign * ang, 0], 2.4);
    }
    W.box('timber', [3.4, 0.09, 0.3], [0, top + rise + 0.05, 0], [0, 0, 0], 1.4);
    cols.push({ half: [1.62, 0.6, 1.62], position: [0, 0.5, 0] });
    const g = W.build(THREE, ensureMats(THREE));
    g.userData.xrColliders = cols;
    return g;
  }

  function buildStall(THREE, rng, faceAngle) {
    const W = createWriter();
    const cols = [];
    const w = 2.6 + rng() * 0.8, d = 1.9, awn = rng() < 0.5 ? 'awning' : 'awning2';
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const h = sz > 0 ? 2.2 : 1.9;
      // posts extend 0.5 below grade — no floating on plaza undulation
      W.box('timber', [0.12, h + 0.5, 0.12], [sx * w / 2, (h - 0.5) / 2, sz * d / 2], [0, 0, 0], 1);
    }
    W.box('plank2', [w, 0.75, 0.7], [0, 0.55, d * 0.18], [0, 0, 0], 1.4);          // counter
    W.box('timber', [w + 0.15, 0.06, 0.85], [0, 0.96, d * 0.18], [0, 0, 0], 1.4);
    const items = 3 + (rng() * 3 | 0);
    for (let i = 0; i < items; i++) {
      W.blob(rng() < 0.5 ? 'pumpkin' : 'cabbage', [-w / 2 + 0.4 + (w - 0.8) * (i + 0.5) / items, 1.12, d * 0.18 + (rng() - 0.5) * 0.3], 0.15 + rng() * 0.06, 0.8, 0.1, rng);
    }
    // sloped striped awning, high edge forward
    const rise = 0.55, run = d + 1.0;
    const ang = Math.atan2(rise, run);
    W.box(awn, [w + 0.5, 0.05, Math.hypot(run, rise)], [0, 2.1 + rise / 2, -d / 2 + run / 2 - 0.2], [0, ang, 0], 1.1);
    for (let b = 0; b < 2; b++) {
      W.box('plank2', [0.55, 0.5, 0.55], [(rng() - 0.5) * (w - 1), 0.28, -d / 2 + 0.45], [rng() * 0.4, 0, 0], 0.6);
    }
    cols.push({ half: [w / 2, 0.55, 0.4], position: [0, 0.55, d * 0.18] });
    const g = W.build(THREE, ensureMats(THREE));
    g.rotation.y = faceAngle;
    g.userData.xrColliders = bakeColliders(THREE, cols, faceAngle);
    return g;
  }

  function buildLantern(THREE, rng) {
    const W = createWriter();
    W.box('timber', [0.13, 3.0, 0.13], [0, 1.3, 0], [0, (rng() - 0.5) * 0.04, 0], 1);
    W.box('timber', [0.7, 0.09, 0.09], [0.28, 2.72, 0], [0, 0, 0], 1);
    W.box('iron', [0.03, 0.22, 0.03], [0.55, 2.56, 0], [0, 0, 0], 1);
    W.box('lantern', [0.24, 0.32, 0.24], [0.55, 2.3, 0], [0, 0, 0], 1);
    W.box('iron', [0.3, 0.06, 0.3], [0.55, 2.49, 0], [0, 0, 0], 1);
    W.box('iron', [0.3, 0.04, 0.3], [0.55, 2.12, 0], [0, 0, 0], 1);
    const g = W.build(THREE, ensureMats(THREE));
    g.userData.xrColliders = [{ half: [0.08, 1.4, 0.08], position: [0, 1.4, 0] }];
    return g;
  }

  function buildBench(THREE, rng, faceAngle) {
    const W = createWriter();
    W.box('plank2', [1.7, 0.07, 0.45], [0, 0.46, 0], [0, 0, 0], 1.2);
    for (const s of [-0.65, 0.65]) {
      W.box('timber', [0.12, 0.86, 0.4], [s, 0.03, 0], [0, 0, 0], 1);   // legs buried 0.4
    }
    W.box('plank2', [1.7, 0.4, 0.06], [0, 0.78, -0.22], [0, 0.12, 0], 1.2);
    const g = W.build(THREE, ensureMats(THREE));
    g.rotation.y = faceAngle;
    g.userData.xrColliders = bakeColliders(THREE, [{ half: [0.85, 0.3, 0.25], position: [0, 0.3, 0] }], faceAngle);
    return g;
  }

  function buildPlanter(THREE, rng) {
    const W = createWriter();
    const w = 1.2 + rng() * 0.5;
    const yaw = (rng() - 0.5) * 0.6;
    W.box('plank2', [w, 0.65, 0.6], [0, 0.12, 0], [yaw, 0, 0], 0.8);   // sunk 0.2
    W.box('cloth', [w - 0.12, 0.06, 0.48], [0, 0.42, 0], [yaw, 0, 0], 1);
    const flowers = 3 + (rng() * 3 | 0);
    for (let i = 0; i < flowers; i++) {
      const fx = (rng() - 0.5) * (w - 0.4), fz = (rng() - 0.5) * 0.35;
      W.box('timber', [0.03, 0.3, 0.03], [fx, 0.6, fz], [0, 0, 0], 1);
      W.blob(rng() < 0.5 ? 'pumpkin' : 'cabbage', [fx, 0.78, fz], 0.09, 1, 0.15, rng);
    }
    const g = W.build(THREE, ensureMats(THREE));
    g.userData.xrColliders = [{ half: [w / 2, 0.25, 0.3], position: [0, 0.25, 0] }];
    return g;
  }

  // Two-tier stone fountain — the plaza's second landmark. The well owns the
  // exact centre; the fountain claims a town-hashed slot between two spokes
  // (see the props spec). Water discs reuse MATS.water — the same still,
  // non-emissive water the well uses (glow stays a lantern budget).
  function buildFountain(THREE, rng) {
    const W = createWriter();
    const R = 2.55 + rng() * 0.25;               // seeded basin radius
    // lower basin: wall (sunk 0.2 into the plaza), dark lip, water disc
    W.cyl('stoneLight', R + 0.15, R + 0.05, 1.0, 14, [0, 0.3, 0], [0, 0, 0], false, 2.2);
    W.cyl('stoneDark', R + 0.3, R + 0.18, 0.16, 14, [0, 0.86, 0], [0, 0, 0], true, 2.2);
    W.cyl('water', R - 0.12, R - 0.12, 0.04, 14, [0, 0.6, 0], [0, 0, 0], true, 1);
    // carved buttress blocks around the wall (seeded count + stagger)
    const nB = 5 + (rng() * 2 | 0);
    for (let i = 0; i < nB; i++) {
      const a = (i / nB) * Math.PI * 2 + rng() * 0.2;
      W.box('stoneDark', [0.34, 0.72, 0.3], [Math.cos(a) * (R + 0.12), 0.4, Math.sin(a) * (R + 0.12)], [Math.PI / 2 - a, 0, 0], 1.4);
    }
    // pedestal column, upper basin + lip + water, tapered finial
    W.cyl('stone', 0.52, 0.4, 1.3, 10, [0, 1.4, 0], [0, 0, 0], false, 1.6);
    W.cyl('stoneLight', 1.3, 1.12, 0.42, 12, [0, 2.1, 0], [0, 0, 0], false, 1.8);
    W.cyl('stoneDark', 1.38, 1.3, 0.1, 12, [0, 2.33, 0], [0, 0, 0], true, 1.8);
    W.cyl('water', 1.05, 1.05, 0.04, 12, [0, 2.22, 0], [0, 0, 0], true, 1);
    W.cyl('stone', 0.18, 0.1, 0.55, 8, [0, 2.6, 0], [0, 0, 0], false, 1);
    W.blob('stoneLight', [0, 2.98, 0], 0.2 + rng() * 0.05, 1.1, 0.06, rng);
    const g = W.build(THREE, ensureMats(THREE));
    // Colliders: the basin wall as a 6-box TANGENT RING (hexagon — closed,
    // walk right up to the lip, no giant impassable disc) + the pedestal.
    // Yaw a+π/2 turns each box's long axis onto the circle tangent.
    const cols = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      cols.push({
        half: [R * 0.64, 0.5, 0.28],
        position: [Math.cos(a) * (R + 0.08), 0.5, Math.sin(a) * (R + 0.08)],
        rotation: [0, a + Math.PI / 2, 0],
      });
    }
    cols.push({ half: [0.5, 1.0, 0.5], position: [0, 1.0, 0] });
    g.userData.xrColliders = cols;
    return g;
  }

  // Sign post carrying the town's seeded name — claimed at the spoke/ring
  // junctions so travellers read it walking into town. The board is a plain
  // BoxGeometry child (standard 0..1 UVs) so the canvas-painted name maps
  // exactly once; the writer's edge-distance UVs would tile it. Its material
  // is per-spawn (each town's name is unique) — tracked in
  // userData.__ownedMats so the props dispose() frees map + material.
  function buildSignpost(THREE, rng, name, faceAngle) {
    const W = createWriter();
    W.box('stoneDark', [0.56, 0.3, 0.56], [0, 0.05, 0], [rng() * Math.PI, 0, 0], 1.6); // base stone, half-buried
    W.box('timber', [0.14, 3.4, 0.14], [0, 1.2, 0], [0, 0, (rng() - 0.5) * 0.04], 1);  // post, buried 0.5
    W.box('timber', [1.9, 0.11, 0.11], [0, 2.72, 0], [0, 0, 0], 1);                     // crossarm
    for (const s of [-0.6, 0.6]) W.box('iron', [0.03, 0.26, 0.03], [s, 2.56, 0], [0, 0, 0], 1); // hanger links
    const g = W.build(THREE, ensureMats(THREE));
    const tex = signTexture(THREE, { name, seed: (rng() * 1e9) | 0 });
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.6, 0.07), mat);
    board.position.set(0, 2.14, 0);
    board.castShadow = board.receiveShadow = true;
    g.add(board);
    g.rotation.y = faceAngle;
    g.userData.__ownedMats = [mat];
    // thin post cuboid only — symmetric, no yaw bake needed
    g.userData.xrColliders = [{ half: [0.09, 1.5, 0.09], position: [0, 1.5, 0] }];
    return g;
  }

  // Banner pole: tapered pole, brass finial, crossarm, hanging heraldic
  // cloth with a swallow-tail hem. Cloth material comes from the FIXED
  // shared MATS.banners palette, picked with spawn.rng.
  function buildBannerPole(THREE, rng, faceAngle) {
    const M = ensureMats(THREE);
    const W = createWriter();
    const H = 4.4 + rng() * 0.7;
    W.cyl('timber', 0.1, 0.07, H + 0.5, 8, [0, (H - 0.5) / 2, 0], [0, 0, (rng() - 0.5) * 0.03], false, 1); // buried 0.5
    W.blob('brass', [0, H + 0.12, 0], 0.13, 1.25, 0.05, rng);
    W.box('timber', [1.2, 0.09, 0.09], [0.5, H - 0.28, 0], [0, 0, 0], 1);   // crossarm out +x
    W.box('iron', [0.03, 0.14, 0.03], [0.98, H - 0.4, 0], [0, 0, 0], 1);
    const bw = 0.8 + rng() * 0.15, bh = 1.9 + rng() * 0.4;
    const bx = 0.58, yTop = H - 0.46;
    W.box('bannerCloth', [bw, bh, 0.035], [bx, yTop - bh / 2, 0], [0, 0, 0], 1);
    // swallow-tail: two triangles, both windings (tris are single-sided)
    const yB = yTop - bh, x0 = bx - bw / 2, x1 = bx + bw / 2;
    const tails = [
      [[x0, yB, 0], [x0 + bw * 0.34, yB, 0], [x0 + bw * 0.14, yB - 0.42, 0]],
      [[x1 - bw * 0.34, yB, 0], [x1, yB, 0], [x1 - bw * 0.14, yB - 0.42, 0]],
    ];
    for (const [a, b, c] of tails) { W.tri('bannerCloth', a, b, c, 1); W.tri('bannerCloth', b, a, c, 1); }
    const g = W.build(THREE, { ...M, bannerCloth: M.banners[(rng() * M.banners.length) | 0] });
    g.rotation.y = faceAngle + (rng() - 0.5) * 0.3;
    g.userData.xrColliders = [{ half: [0.09, H / 2, 0.09], position: [0, H / 2, 0] }]; // symmetric post
    return g;
  }

  // Low stone-ring flower bed — denser planting than the planter box.
  function buildFlowerBed(THREE, rng) {
    const W = createWriter();
    const r = 0.9 + rng() * 0.35;
    W.cyl('stoneLight', r + 0.16, r + 0.1, 0.52, 10, [0, 0.06, 0], [0, 0, 0], false, 1.2); // ring, sunk 0.2
    W.cyl('soil', r + 0.02, r + 0.02, 0.05, 10, [0, 0.24, 0], [0, 0, 0], true, 1);
    const petals = ['flowerRed', 'flowerWhite', 'flowerYellow', 'flowerBlue'];
    const n = 9 + (rng() * 5 | 0);
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * (r - 0.22);
      const fx = Math.cos(a) * rr, fz = Math.sin(a) * rr;
      const h = 0.26 + rng() * 0.26;
      W.box('timber', [0.03, h, 0.03], [fx, 0.24 + h / 2, fz], [0, 0, 0], 1);          // stem
      W.blob('cabbage', [fx, 0.3 + h * 0.5, fz], 0.07 + rng() * 0.04, 0.7, 0.2, rng);  // leaf tuft
      W.blob(petals[(rng() * petals.length) | 0], [fx, 0.26 + h, fz], 0.08 + rng() * 0.05, 0.8, 0.15, rng);
    }
    const g = W.build(THREE, ensureMats(THREE));
    g.userData.xrColliders = [{ half: [r + 0.05, 0.16, r + 0.05], position: [0, 0.16, 0] }]; // low — steppable edge
    return g;
  }

  // Roofed town notice board. Interaction is wired by the props spec via
  // XRPublisher.registerInteractable (the props spec mounts MIXED prop types
  // per-object, so a spec-level `interactable: true` would make every bench
  // interactable too); onInteract opens the seeded-notices dialog.
  function buildNoticeBoard(THREE, rng, faceAngle) {
    const W = createWriter();
    const bw = 2.3;
    for (const s of [-1, 1]) W.box('timber', [0.16, 3.0, 0.16], [s * bw / 2, 1.1, 0], [0, 0, 0], 1); // posts, buried 0.4
    W.box('plank', [bw - 0.1, 1.15, 0.08], [0, 1.62, 0], [0, 0, 0], 1.6);   // board panel
    W.box('timber', [bw + 0.24, 0.1, 0.14], [0, 1.0, 0], [0, 0, 0], 1);     // bottom rail
    W.box('timber', [bw + 0.24, 0.1, 0.14], [0, 2.24, 0], [0, 0, 0], 1);    // top rail
    for (const sign of [1, -1]) {                                           // little shake roof cap
      W.box('shake', [bw + 0.6, 0.06, 0.58], [0, 2.45, sign * 0.21], [0, sign * 0.6, 0], 1.6);
    }
    W.box('timber', [bw + 0.7, 0.08, 0.12], [0, 2.58, 0], [0, 0, 0], 1);    // ridge
    const n = 3 + (rng() * 3 | 0);                                          // pinned parchment notices
    for (let i = 0; i < n; i++) {
      const px = (rng() - 0.5) * (bw - 0.7), py = 1.34 + rng() * 0.56;
      const pw2 = 0.3 + rng() * 0.12, ph2 = 0.34 + rng() * 0.16;
      W.box('parchment', [pw2, ph2, 0.016], [px, py, 0.05], [0, 0, (rng() - 0.5) * 0.22], 1);
      W.box('iron', [0.028, 0.028, 0.03], [px, py + ph2 / 2 - 0.03, 0.065], [0, 0, 0], 1); // pin
    }
    const g = W.build(THREE, ensureMats(THREE));
    g.rotation.y = faceAngle;
    g.userData.xrColliders = bakeColliders(THREE, [
      { half: [bw / 2 + 0.1, 0.85, 0.12], position: [0, 1.55, 0] },
    ], faceAngle);
    return g;
  }

  // ── Init: towns cache + plaza + two decoration specs + menu item ───────────
  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || typeof XRPublisher.getWorldTowns !== 'function' || typeof XRPublisher.addTerrainRegion !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime too old (needs getWorldTowns + addTerrainRegion)`);
      return;
    }

    // Optional APIs — degrade gracefully on older runtimes.
    const hasInteract = typeof XRPublisher.registerInteractable === 'function'
      && typeof XRPublisher.unregisterInteractable === 'function'
      && typeof XRPublisher.openDialog === 'function';

    // ── 'stone-walk' terrain surface ─────────────────────────────────────────
    // Rectangular running-bond sidewalk slabs, toned a touch lighter/warmer
    // than the plaza cobble so a walk reads as SIDEWALK against it. Registered
    // at plugin init (before the shared terrain material first compiles — a
    // late registration costs a one-time material rebuild). NOTE: addPath
    // accepts but currently IGNORES `surface`, so today this surface has no
    // renderer — every sidewalk below still declares it so the walks upgrade
    // to real slabs the day addPath honors the param. WebGL always renders
    // the flat fallbackColor (user TSL can't compile to GLSL).
    if (typeof XRPublisher.registerTerrainSurface === 'function') {
      XRPublisher.registerTerrainSurface({
        id: 'stone-walk',
        fallbackColor: [0.64, 0.61, 0.55],
        tsl: ({ localXZ, tint }) => {
          // Slab coords hash from localXZ — NEVER uv(), it throws in this
          // engine's node-material path.
          const { floor, fract, sin, dot, min, mix, smoothstep, vec2, vec3, vec4, float } = XRPublisher.tsl;
          const p = localXZ.div(vec2(1.9, 1.25));       // slab pitch (long axis x)
          const row = floor(p.y);
          const u = p.x.add(row.mul(0.5));              // running bond: half-slab shift per row
          const cell = vec2(floor(u), row);
          const h = fract(sin(dot(cell, vec2(127.1, 311.7))).mul(43758.5453)); // per-slab tone hash
          const fx = fract(u), fy = fract(p.y);
          // distance to the slab edge in WORLD units → constant-width joints
          const ex = min(fx, fx.oneMinus()).mul(1.9);
          const ez = min(fy, fy.oneMinus()).mul(1.25);
          const inside = smoothstep(0.0, 0.09, min(ex, ez));
          const slab = mix(vec3(0.60, 0.56, 0.48), vec3(0.74, 0.70, 0.60), h);
          const rgb = mix(vec3(0.40, 0.38, 0.34), slab, inside); // dark mortar joints
          return vec4(tint ? rgb.mul(tint) : rgb, float(0.93));
        },
      });
    }

    const townMap = new Map();
    const towns = [];
    const plazaLaid = new Set();
    const wellClaims = new Set();      // town key → a well spawn exists
    const fountainClaims = new Set();  // town key → the fountain landmark exists
    const noticeClaims = new Set();    // town key → the notice board exists
    const signClaims = new Set();      // `${townKey}:${spokeIndex}` → junction signpost exists
    // chunk key → [{x,z,r}] accepted footprints. Bounded: a roaming session
    // visits unbounded chunks, and this map has no unload hook, so trim the
    // oldest entries FIFO (only the CURRENT chunk's list is ever read).
    const acceptedByChunk = new Map();
    const ACCEPTED_CHUNK_CAP = 64;
    const trimAcceptedChunks = () => {
      while (acceptedByChunk.size > ACCEPTED_CHUNK_CAP) {
        const oldest = acceptedByChunk.keys().next().value;
        if (oldest === undefined) break;
        acceptedByChunk.delete(oldest);
      }
    };

    const playerXZ = () => {
      const po = window.currentScene && window.currentScene.getObjectByName('playerOne');
      if (!po) return [0, 0];
      const p = po.getWorldPosition(new THREE.Vector3());
      return [p.x, p.z];
    };

    // getWorldTowns returns WORKER-frame coords, ½ chunk above the render
    // frame everything else here uses (spawn.renderPosition, regions, paths,
    // the player). refreshTowns converts town centres once at ingestion.
    const tEl = document.querySelector('three-terrain-block');
    const CHUNK_W = (tEl && parseFloat(tEl.getAttribute('width'))) || 100;
    const CHUNK_H = (tEl && parseFloat(tEl.getAttribute('height'))) || 100;

    // Deterministic per-town spoke base angle (same hash in refreshTowns and
    // the building-clearance check — they MUST agree).
    const townSpokeBase = (k) => {
      let h = 0;
      for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
      return (h % 6283) / 1000;
    };
    const hasPaths = typeof XRPublisher.addPath === 'function';

    // ── Seeded town identity: names + notice-board copy ──────────────────────
    // Everything derives from the town key so the same world seed produces
    // the same "Thornmere" with the same lost cat, every visit, every client.
    const strHash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    const townRng = (k, salt) => (XRPublisher.utils && XRPublisher.utils.alea)
      ? XRPublisher.utils.alea(`${PLUGIN_ID}-${salt}-${k}`)   // the engine's own PRNG when present
      : lcg(strHash(`${salt}-${k}`));
    const NAME_HEADS = ['Ald', 'Bren', 'Cinder', 'Dun', 'Elm', 'Fen', 'Gable', 'Haver', 'Iron', 'Kest', 'Lark', 'Mill', 'Nor', 'Oaken', 'Pell', 'Quill', 'Rook', 'Sil', 'Thorn', 'Wren'];
    const NAME_TAILS = ['brook', 'dale', 'field', 'ford', 'gate', 'ham', 'hollow', 'march', 'mere', 'moor', 'stead', 'ton', 'vale', 'watch', 'wick', 'worth'];
    const townNames = new Map();
    const townName = (k) => {
      let n = townNames.get(k);
      if (!n) {
        const r = townRng(k, 'name');
        n = NAME_HEADS[r() * NAME_HEADS.length | 0] + NAME_TAILS[r() * NAME_TAILS.length | 0];
        townNames.set(k, n);
      }
      return n;
    };
    const noticesFor = (k) => {
      const r = townRng(k, 'notices');
      const pick = (a) => a[r() * a.length | 0];
      const DAYS = ['Moonday', 'Ashday', 'Winsday', 'Thornsday', 'Emberday', 'Starday'];
      const GOODS = ['autumn squash', 'river trout', 'oat bread', 'spun wool', 'pressed cider', 'wild honeycomb'];
      const CAT_NAMES = ['Biscuit', 'Soot', 'Turnip', 'Marigold', 'Cinders', 'Parsnip'];
      const CAT_LOOKS = ['a round orange tom', 'a thin black cat with one white sock', 'a grey tabby missing half an ear', 'a fluffy cream cat that bites'];
      const PLACES = ['old well', 'market stalls', 'north granary', 'tavern woodpile', 'ring road'];
      const ROADS = ['north', 'east', 'south', 'west'];
      const STATES = ['washed out past the ford', 'mired axle-deep after the rains', 'clear again — the fallen oak is cut', 'best walked in company: wolves heard at dusk'];
      return [
        `MARKET DAY — every ${pick(DAYS)} on the square. ${pick(GOODS)} fresh in from the valley; stalls open at first bell.`,
        `LOST CAT — "${pick(CAT_NAMES)}", ${pick(CAT_LOOKS)}. Last seen by the ${pick(PLACES)}. Reward: ${1 + (r() * 4 | 0)} copper.`,
        `ROAD NOTICE — the ${pick(ROADS)} road is ${pick(STATES)}. Mind your cart.`,
      ];
    };
    const openNoticeDialog = (k) => {
      if (typeof XRPublisher.openDialog !== 'function') return;
      // In-world 3D dialog — readable and clickable in flatscreen AND VR
      // (a DOM HUD would be invisible to a headset user).
      XRPublisher.openDialog({
        title: `${townName(k)} — Notice Board`,
        content: noticesFor(k).join('\n\n'),
        buttons: [{ label: 'Done', variant: 'primary' }],
      });
    };

    // Snap a claimed landmark (fountain / notice board / signpost) from its
    // candidate point onto its exact town-hashed target — the same trick the
    // well uses. Colliders mount BESIDE the object, so they carry the offset.
    const snapTo = (g, dx, dz) => {
      g.position.set(dx, 0, dz);
      g.userData.xrColliders = (g.userData.xrColliders || []).map((c) => ({
        ...c, position: [c.position[0] + dx, c.position[1], c.position[2] + dz],
      }));
      return g;
    };

    async function refreshTowns() {
      const [px, pz] = playerXZ();
      let found;
      try {
        found = await XRPublisher.getWorldTowns({ minX: px - SCAN_RADIUS, minZ: pz - SCAN_RADIUS, maxX: px + SCAN_RADIUS, maxZ: pz + SCAN_RADIUS });
      } catch (e) { return; }
      for (const t of found || []) {
        // Key from the RAW worker coords — it seeds town names, spoke angles
        // and landmark claims, so it must never change with the frame.
        const k = `${Math.round(t.x)}_${Math.round(t.z)}`;
        if (townMap.has(k)) continue;
        // Store the centre in the RENDER frame so every later comparison —
        // spawn.renderPosition, the player, regions, paths — shares one frame
        // with no corrections. getWorldTowns now hands back renderX/renderZ
        // directly; the −½ chunk arithmetic is the fallback for older engines.
        const town = {
          ...t, key: k,
          x: Number.isFinite(t.renderX) ? t.renderX : t.x - CHUNK_W / 2,
          z: Number.isFinite(t.renderZ) ? t.renderZ : t.z - CHUNK_H / 2,
        };
        townMap.set(k, town);
        towns.push(town);
        if (!plazaLaid.has(k)) {
          plazaLaid.add(k);
          // Render-frame town centre — the frame regions + paths paint in.
          const rx = town.x, rz = town.z;
          // The FULL town cobble disc — unchanged, this is the town's ground.
          XRPublisher.addTerrainRegion({
            id: `town-plaza-${k}`, center: [rx, rz], radius: TOWN_RADIUS,
            surface: 'cobblestone', scale: 0.5, mortar: 0.08, clearGrass: true,
          });
          if (hasPaths) {
            // Ring street: closed polygon painted over the cobble.
            const ringPts = [];
            for (let i = 0; i <= 14; i++) {
              const a = (i / 14) * Math.PI * 2;
              ringPts.push([rx + Math.cos(a) * RING_R, rz + Math.sin(a) * RING_R]);
            }
            XRPublisher.addPath({
              id: `town-ring-${k}`, points: ringPts, width: RING_W, tint: PATH_TINT,
            });
            // Inner circle AROUND the centre piece — the spokes' inner ends
            // connect to each other here instead of dead-ending at the well.
            const innerPts = [];
            for (let i = 0; i <= 10; i++) {
              const a = (i / 10) * Math.PI * 2;
              innerPts.push([rx + Math.cos(a) * INNER_RING_R, rz + Math.sin(a) * INNER_RING_R]);
            }
            XRPublisher.addPath({
              id: `town-inner-${k}`, points: innerPts, width: INNER_RING_W, tint: PATH_TINT,
            });
            // Main spokes inner circle ↔ ring at per-town hashed angles.
            const base = townSpokeBase(k);
            for (let s = 0; s < SPOKES; s++) {
              const a = base + (s / SPOKES) * Math.PI * 2;
              XRPublisher.addPath({
                id: `town-spoke-${k}-${s}`, width: SPOKE_W, tint: PATH_TINT,
                points: [
                  [rx + Math.cos(a) * (INNER_RING_R - 0.5), rz + Math.sin(a) * (INNER_RING_R - 0.5)],
                  [rx + Math.cos(a) * (RING_R + 1.5), rz + Math.sin(a) * (RING_R + 1.5)],
                ],
              });
            }
            // Perimeter promenade: a closed pale-stone pedestrian ring just
            // inside the town edge. addPath renders every path as packed
            // dirt × tint (`surface` accepted but ignored today) — WALK_TINT
            // is what makes it read as sidewalk; the declared 'stone-walk'
            // surface future-proofs it. 24 segments is deliberate budget
            // spend: the engine keeps the 48 NEAREST path segments, so at
            // the plaza the far side of the promenade may yield to closer
            // trails — distance-graceful, never a hard break.
            const walkPts = [];
            for (let i = 0; i <= 24; i++) {
              const a = (i / 24) * Math.PI * 2;
              walkPts.push([rx + Math.cos(a) * WALK_R, rz + Math.sin(a) * WALK_R]);
            }
            XRPublisher.addPath({
              id: `town-walk-${k}`, points: walkPts, width: WALK_W,
              tint: WALK_TINT, surface: 'stone-walk',
            });
          }
        }
      }
    }
    refreshTowns();
    setInterval(refreshTowns, REFRESH_MS);

    // Towns are stored render-frame, so pass render-frame coords in
    // (spawn.renderPosition / player position). `key` is the stable
    // worker-coord town key that seeds names, spokes and claims.
    const nearestTown = (wx, wz) => {
      let best = Infinity, tx = 0, tz = 0, key = '';
      for (const t of towns) {
        const dd = (t.x - wx) ** 2 + (t.z - wz) ** 2;
        if (dd < best) { best = dd; tx = t.x; tz = t.z; key = t.key; }
      }
      return { d: Math.sqrt(best), tx, tz, key };
    };

    // ── Buildings: ring-organised scatter, one spawn each ────────────────────
    XRPublisher.registerDecoration({
      name: PLUGIN_ID,
      density: DENSITY,
      minSpacing: MIN_SPACING,
      maxSlope: MAX_SLOPE,
      minWaterDistance: 6,
      collision: true,   // explicit colliders via userData.xrColliders
      // The cobblestone's clearGrass registers a town-wide groundPatch, and
      // the engine SKIPS any non-patch decoration inside a patch — a spec-own
      // groundPatch (pass-1) is what lets buildings place ON the cobblestone.
      // (Mostly hidden under the foundation; the region paints over it.)
      groundPatch: { radius: 7, color: [0.46, 0.44, 0.41], clearGrass: true },
      create(spawn) {
        if (towns.length === 0) return null;
        // Footprint-aware spacing among ACCEPTED buildings, per chunk. The
        // engine's minSpacing thins CANDIDATES before we gate, so relying on
        // it starved towns (~4 buildings in a plaza built for 30). Spawn
        // order within a chunk is deterministic; index 0 marks a fresh
        // scatter of this chunk.
        const ck = `${spawn.chunkX}_${spawn.chunkZ}`;
        if (spawn.index === 0) acceptedByChunk.delete(ck);   // fresh scatter → re-insert last (FIFO)
        if (!acceptedByChunk.has(ck)) { acceptedByChunk.set(ck, []); trimAcceptedChunks(); }
        const accepted = acceptedByChunk.get(ck);
        // Chunk-border margin: cross-chunk neighbours can then never be closer
        // than 2×margin — more than two rotated half-diagonals, so buildings
        // from different chunks can't interpenetrate (the footprint check
        // covers within-chunk pairs).
        if (Math.abs(spawn.position[0]) > CHUNK_W / 2 - BORDER_MARGIN) return null;
        if (Math.abs(spawn.position[2]) > CHUNK_H / 2 - BORDER_MARGIN) return null;
        // renderPosition shares the render frame with the stored town
        // centres — all distance math below runs in one frame.
        const wx = spawn.renderPosition[0], wz = spawn.renderPosition[2];
        const { d, tx, tz, key: townKey } = nearestTown(wx, wz);
        if (d < INNER + 2 || d > BUILD_OUTER) return null;  // plaza stays open
        if (spawn.treeDistance < 4) return null;            // don't bury a trunk
        const band = d < BANDS[0] ? 0 : d < BANDS[1] ? 1 : 2;
        if (spawn.rng() > FILL[band]) return null;
        const plan = normalizePlan(makePlan(spawn.rng, band));
        // Yards for residential + outskirts homes only — ring 0 hugs the open
        // plaza, and lawns there would eat the plaza's cobble look.
        plan.yard = band >= 1;
        const wallR = Math.hypot((plan.W + 1) / 2, (plan.D + 1) / 2);
        // Keep WALLS off the ring street and the main spokes — houses LINE
        // the streets instead of straddling them (ramps/yards may touch a
        // street; that reads as a driveway).
        if (hasPaths) {
          if (Math.abs(d - RING_R) < wallR + RING_W / 2 + 0.6) return null;
          // …and off the perimeter promenade — buildings LINE the sidewalk,
          // never straddle it (flower beds + benches dress its verges).
          if (Math.abs(d - WALK_R) < wallR + WALK_W / 2 + 0.6) return null;
          if (d - wallR < RING_R + 1.5) {
            const base = townSpokeBase(townKey);
            const ang = Math.atan2(wz - tz, wx - tx);
            for (let s = 0; s < SPOKES; s++) {
              let da = ang - (base + (s / SPOKES) * Math.PI * 2);
              da = ((da + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
              if (Math.abs(da) * d < wallR + SPOKE_W / 2 + 0.6) return null;
            }
          }
        }
        // padded half-diagonal: walls + ramp/porch/overhang clearance
        const myR = wallR + FOOT_EXTRA;
        for (const a of accepted) {
          const dd = Math.hypot(a.x - wx, a.z - wz);
          if (dd < myR + a.r + STREET_GAP) return null;
        }
        accepted.push({ x: wx, z: wz, r: myR });
        const faceAngle = Math.atan2(tx - wx, tz - wz);     // front (+Z) toward the plaza
        const g = buildBuilding(THREE, plan, spawn.rng, faceAngle);
        g.userData.__footR = myR;      // claimed footprint (walls + FOOT_EXTRA)
        g.userData.__wallR = wallR;
        // Door WALK: a stone-grey sidewalk from the ramp foot to the ring
        // street (outer homes) or the plaza (inner homes) — every structure
        // connects to the network. WALK_TINT (not the sandy street PATH_TINT)
        // makes it read as pavement to the door.
        if (hasPaths && g.userData.__doorLocal) {
          const rx = tx, rz = tz;   // town centre — already render-frame
          const yaw2 = g.userData.__yaw;
          const [dlx, dlz] = g.userData.__doorLocal;
          const cy = Math.cos(yaw2), sy = Math.sin(yaw2);
          const doorWX = wx + dlx * cy + dlz * sy;
          const doorWZ = wz - dlx * sy + dlz * cy;
          const ddx = doorWX - rx, ddz = doorWZ - rz;
          const dd = Math.hypot(ddx, ddz);
          // Outer homes connect to the ring street; inner homes run to the
          // inner circle around the centre piece.
          const targetR = dd > RING_R + 2 ? RING_R : INNER_RING_R;
          if (dd > targetR + 1.5) {
            const id = XRPublisher.addPath({
              id: `town-trail-${spawn.seed}`, width: TRAIL_W, tint: WALK_TINT, surface: 'stone-walk',
              points: [[doorWX, doorWZ], [rx + (ddx / dd) * targetR, rz + (ddz / dd) * targetR]],
            });
            if (id) g.userData.__pathId = id;
          }
        }
        return g;
      },
      dispose(object) {
        const pid = object && object.userData && object.userData.__pathId;
        if (pid && typeof XRPublisher.removePath === 'function') XRPublisher.removePath(pid);
        object.traverse((c) => { if (c.geometry) c.geometry.dispose(); });
      },
    });

    // ── Plaza + street furniture: well, stalls, lanterns, benches ────────────
    XRPublisher.registerDecoration({
      name: `${PLUGIN_ID}-props`,
      density: 9,
      minSpacing: 6,
      maxSlope: 0.2,
      minWaterDistance: 4,
      collision: true,
      // Needed to place on the plaza at all (see above). The cobblestone
      // region composites OVER ground patches, so this tiny circle is
      // invisible — it only clears grass and grants placement.
      groundPatch: { radius: 2, color: [0.44, 0.42, 0.4], clearGrass: true },
      create(spawn) {
        if (towns.length === 0) return null;
        if (Math.abs(spawn.position[0]) > CHUNK_W / 2 - 3) return null;
        if (Math.abs(spawn.position[2]) > CHUNK_H / 2 - 3) return null;
        const wx = spawn.renderPosition[0], wz = spawn.renderPosition[2];
        const { d, tx, tz, key: townKey } = nearestTown(wx, wz);
        const faceCentre = Math.atan2(tx - wx, tz - wz);
        const rng = spawn.rng;

        // The town WELL: first prop candidate near the centre claims it and
        // SNAPS to the exact town centre (the offset is frame-independent).
        if (d < 12 && !wellClaims.has(townKey)) {
          wellClaims.add(townKey);
          const well = buildWell(THREE, rng);
          well.position.set(tx - wx, 0, tz - wz);
          // colliders mount beside the object — carry the same snap offset
          well.userData.xrColliders = well.userData.xrColliders.map((c) => ({
            ...c, position: [c.position[0] + tx - wx, c.position[1], c.position[2] + tz - wz],
          }));
          well.userData.__wellKey = townKey;
          return well;
        }

        // Claimed LANDMARKS, one per town, mirroring the well's pattern:
        // first candidate near a town-hashed target claims it and SNAPS to
        // the exact spot. Targets sit halfway BETWEEN two spokes so nothing
        // straddles a street. Claims release in dispose() on chunk unload.
        const base = townSpokeBase(townKey);
        {
          // Two-tier fountain on the plaza margin (the well owns the centre).
          const fa = base + Math.PI / SPOKES;
          const fx2 = tx + Math.cos(fa) * FOUNTAIN_R, fz2 = tz + Math.sin(fa) * FOUNTAIN_R;
          const fd = Math.hypot(wx - fx2, wz - fz2);
          if (fd < 9 && !fountainClaims.has(townKey)) {
            fountainClaims.add(townKey);
            const f = snapTo(buildFountain(THREE, rng), fx2 - wx, fz2 - wz);
            f.userData.__fountainKey = townKey;
            return f;
          }
          if (fd < 4.8) return null;   // keep the fountain apron clear
        }
        {
          // Roofed notice board in the opposite between-spokes gap, facing
          // the plaza. Registered as an interactable → seeded-notices dialog.
          const na = base - Math.PI / SPOKES;
          const nx2 = tx + Math.cos(na) * NOTICE_R, nz2 = tz + Math.sin(na) * NOTICE_R;
          const nd = Math.hypot(wx - nx2, wz - nz2);
          if (nd < 9 && !noticeClaims.has(townKey)) {
            noticeClaims.add(townKey);
            const nb = snapTo(buildNoticeBoard(THREE, rng, Math.atan2(tx - nx2, tz - nz2)), nx2 - wx, nz2 - wz);
            nb.userData.__noticeKey = townKey;
            if (hasInteract) {
              const iid = `${PLUGIN_ID}-notice-${townKey}`;
              nb.userData.__interactableId = iid;
              // Defer one frame so the engine has mounted + positioned the
              // group before the 10Hz proximity loop can see it.
              requestAnimationFrame(() => {
                if (nb.userData.__disposed) return;
                XRPublisher.registerInteractable({
                  id: iid, object: nb, radius: 4.5,
                  prompt: 'Read the notice board',
                  onInteract: () => openNoticeDialog(townKey),
                });
              });
            }
            return nb;
          }
          if (nd < 3.6) return null;   // approach stays clear
        }
        // SIGNPOSTS: one per spoke/ring junction (claimed per junction),
        // tucked into the street corner, board normal along the spoke so it
        // reads while walking into town.
        if (hasPaths && d > RING_R - 8 && d < RING_R + 10) {
          for (let s = 0; s < SPOKES; s++) {
            const a = base + (s / SPOKES) * Math.PI * 2;
            const ca = Math.cos(a), sa = Math.sin(a);
            const jr = RING_R + RING_W / 2 + 1.6;               // just outside the ring street
            const sx2 = tx + ca * jr - sa * (SPOKE_W / 2 + 1.4); // shifted off the spoke's edge
            const sz2 = tz + sa * jr + ca * (SPOKE_W / 2 + 1.4);
            if (Math.hypot(wx - sx2, wz - sz2) > 6.5) continue;
            const key = `${townKey}:${s}`;
            if (signClaims.has(key)) continue;
            signClaims.add(key);
            const g = snapTo(buildSignpost(THREE, rng, townName(townKey), Math.atan2(ca, sa)), sx2 - wx, sz2 - wz);
            g.userData.__signKey = key;
            return g;
          }
        }

        // Plaza margin: market + civic dressing ringing the open square.
        if (d >= 12 && d < INNER - 1.5) {
          const r = rng();
          if (d < 16) {
            // Inner edge — the plaza mouth. Banner poles flank the square in
            // seeded heraldic colours; no bulky stalls this close in.
            if (r < 0.34) return buildBannerPole(THREE, rng, faceCentre);
            if (r < 0.54) return buildFlowerBed(THREE, rng);
            if (r < 0.82) return buildBench(THREE, rng, faceCentre);
            return buildPlanter(THREE, rng);
          }
          if (r < 0.28) return buildStall(THREE, rng, faceCentre + Math.PI);   // stall opens toward centre
          if (r < 0.42) return buildLantern(THREE, rng);
          if (r < 0.54) return buildBannerPole(THREE, rng, faceCentre);
          if (r < 0.64) return buildFlowerBed(THREE, rng);
          if (r < 0.86) return buildBench(THREE, rng, faceCentre);
          return buildPlanter(THREE, rng);
        }

        // Ring-street seating: benches + lanterns just off the street edge
        // (buildings keep their walls ≥ wallR+2.3 from the ring, so this
        // 3.4–4.6 band can never clip a house). Skipped on runtimes without
        // path rendering — no visible street to sit beside.
        if (hasPaths) {
          const ringOff = Math.abs(d - RING_R);
          if (ringOff > 3.4 && ringOff < 4.6 && rng() < 0.35) {
            return rng() < 0.65 ? buildBench(THREE, rng, faceCentre) : buildLantern(THREE, rng);
          }
          // Promenade verges: flower beds + benches + the odd lantern lining
          // the perimeter sidewalk (the buildings spec keeps walls off it, so
          // this band can never clip a house).
          const walkOff = Math.abs(d - WALK_R);
          if (walkOff > 2.0 && walkOff < 3.6 && rng() < 0.5) {
            const r2 = rng();
            if (r2 < 0.45) return buildFlowerBed(THREE, rng);
            if (r2 < 0.85) return buildBench(THREE, rng, faceCentre);
            return buildLantern(THREE, rng);
          }
        }
        return null;
      },
      dispose(object) {
        const u = (object && object.userData) || {};
        u.__disposed = true;                       // disarm the deferred registerInteractable
        if (u.__wellKey) wellClaims.delete(u.__wellKey);
        if (u.__fountainKey) fountainClaims.delete(u.__fountainKey);
        if (u.__noticeKey) noticeClaims.delete(u.__noticeKey);
        if (u.__signKey) signClaims.delete(u.__signKey);
        if (u.__interactableId && typeof XRPublisher.unregisterInteractable === 'function') {
          XRPublisher.unregisterInteractable(u.__interactableId);
        }
        // Per-spawn painted materials (signpost name board) own their canvas
        // texture — the default cleanup only frees geometry.
        if (u.__ownedMats) for (const m of u.__ownedMats) { if (m.map) m.map.dispose(); m.dispose(); }
        object.traverse((c) => { if (c.geometry) c.geometry.dispose(); });
      },
    });

    // "Jump to nearest town" in the HUD ☰ menu.
    XRPublisher.registerMenuItem({
      id: 'jump-to-nearest-town',
      label: 'Jump to nearest town',
      icon: '🏘️',
      order: 50,
      onSelect: () => {
        if (towns.length === 0) { refreshTowns(); return; }
        const [px, pz] = playerXZ();
        let best = Infinity, target = towns[0];
        for (const t of towns) {
          const dd = (t.x - px) ** 2 + (t.z - pz) ** 2;
          if (dd < best) { best = dd; target = t; }
        }
        // Towns are stored render-frame — the same frame teleportPlayer
        // uses — so this lands on the plaza centre.
        XRPublisher.teleportPlayer(target.x, undefined, target.z);
      },
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] registered — cobblestone towns, timber-framed walk-in buildings, grass yards + picket fences, sidewalks + fountain + named signposts + banners + notice board${hasInteract ? ' (interactive)' : ''}`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
