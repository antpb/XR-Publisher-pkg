/**
 * summit-totems — XR Publisher decoration plugin (SUMMIT SHRINES)
 * ---------------------------------------------------------------
 * The reward for climbing a mountain. `anchor:'mountain'` places ONE spawn on
 * each real summit (the engine ray-marches the mountain SDF, scatters in the
 * top 2% of the peak, and a peak is owned by the single chunk its XZ falls
 * in — so a shrine never duplicates). This plugin turns that spawn into a
 * discovery: a weathered stone shrine with wind-tattered prayer flags and an
 * emissive summit crystal you can see from the valley floor, a seeded NAME
 * and lore for every peak, and a persistent "summit log" HUD that counts
 * your first ascents. Built entirely from the public API — no engine changes.
 *
 *   • ANCHOR:'mountain' + density:1 — the teaching headline: one shrine per
 *     peak, on the REAL marching-cubes summit surface (local y=0 is the
 *     walkable stone, not the terrain heightfield far below).
 *   • SEEDED PROCEDURAL STONE — every shrine is a unique silhouette: 3-5
 *     noise-displaced stone drums (XRPublisher.utils.createNoise3D seeded
 *     from spawn.seed) on a buried plinth, with a carved band inset into one
 *     drum, a hand-stacked lean, and vertex-colored weathering (dark lichen
 *     base → pale wind-scoured top). All stone merges into ONE BufferGeometry
 *     → one draw call, castShadow on the mass that matters.
 *   • PRAYER-FLAG CORDS — 1-2 sagging cords strung from the capstone to small
 *     anchor stones, hung with tattered vertex-colored flag quads (classic
 *     five-color palette, seeded order + tear pattern). Merged into one mesh.
 *   • SUMMIT CRYSTAL — an emissive octahedron floating over the capstone.
 *     Emissive-only glow (NO scene lights — light count must stay constant or
 *     every material in the world recompiles). It blooms if the world enables
 *     postFX and reads bright without it. At NIGHT it breathes: update()
 *     polls XRPublisher.getTimeOfDay() at ~2Hz (not per frame) and a module
 *     stamp guarantees the SHARED crystal material is written once per frame
 *     no matter how many shrines are live.
 *   • DISCOVERY LOOP — interactable:true; the prompt is a FUNCTION (re-read
 *     ~10Hz by the engine): "read the shrine" until you've discovered the
 *     peak, then the peak's own name. E opens an in-world dialog (2D + VR
 *     clickable) with the seeded name + lore, a chained "survey the horizon"
 *     dialog, and a first-ascent note. First visits increment the ⛰ HUD
 *     counter; click it for the log of every peak you've named.
 *   • PERSISTENCE — discovered spawn.seeds live in localStorage namespaced by
 *     XRPublisher.getWorldStateKey() (mountain-anchor seeds are chunk-free
 *     and stable), so your summit log survives reloads. Local-only on
 *     purpose: which peaks YOU have climbed is player state, not world state.
 *   • EXPLICIT COLLIDER — one authored cuboid (userData.xrColliders) around
 *     the stone column only, so the shrine is solid but the flag cords don't
 *     wall off the summit (auto-cuboids would box every mesh).
 *
 * Deterministic: every drum, lean, flag, and name derives from spawn.rng /
 * alea(spawn.seed + '-suffix') in a fixed draw order — same seed ⇒ same
 * shrine and same peak name, every visit, every renderer. Math.random is
 * never used.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'summit-totems';

  // ── Configure me ──────────────────────────────────────────────────────────
  const INTERACTION_RADIUS = 5;      // "Press E" range around the shrine
  const CRYSTAL_COLOR = 0x9fe0ff;    // ice-blue beacon
  const BASE_GLOW = 1.5;             // daytime emissiveIntensity (>1 punches bloom)
  const NIGHT_PULSE = 0.9;           // extra intensity swing after dark
  const PULSE_SPEED = 1.4;           // rad/s of the night breathing
  // Classic five-color prayer flags. Ember set for volcanic worlds:
  // const FLAG_PALETTE = [0xd96a2b, 0xf2c14e, 0xb33a2f, 0x7a4a2b, 0xe8e0d0];
  const FLAG_PALETTE = [0x3f6fd1, 0xf2ede2, 0xd14b3f, 0x3f9e5a, 0xe8c84a];
  // ──────────────────────────────────────────────────────────────────────────

  let registered = false;

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  // ── Peak naming: a syllable-table generator ────────────────────────────────
  // Seeded from spawn.seed via a DEDICATED sub-rng (never spawn.rng — the
  // prompt function must not perturb the geometry draw order), so every peak
  // has one stable name forever. Cached: the engine re-resolves prompt
  // functions ~10Hz, so repeat calls must be a Map lookup, not string work.
  const ROOTS = ['Kar', 'Vel', 'Thorn', 'Or', 'Bran', 'Skal', 'Mor', 'Ael', 'Dun', 'Hal', 'Ir', 'Tor', 'Grim', 'Fen', 'Ash', 'Cael'];
  const MIDS = ['a', 'e', 'o', 'u', 'ar', 'en', 'il', 'or'];
  const ENDS = ['dun', 'horn', 'crag', 'fell', 'spire', 'tor', 'heim', 'mund', 'gard', 'vane', 'reach', 'watch'];
  const LORE = [
    'The stones were stacked long before the valley below had a name.',
    'Shepherds say the wind forgets its grief on this summit.',
    'Ridge-runners left a flag here for every winter they survived.',
    'The carved band is older than the shrine — the shrine was built around it.',
    'Climbers touch the crystal once for the ascent, once for the way down.',
    'On still nights the crystal is said to answer the stars in kind.',
    'A cairn stood here first; the shrine grew up through it.',
    'The old maps mark this peak with a single word: listen.',
    'Snow never settles on the capstone, and nobody agrees on why.',
    'They say the flags are tied by whoever arrives second.',
  ];
  const SIGHTS = [
    'the land folds away like a dropped blanket',
    'cloud shadows crawl across the far plains',
    'a ribbon of water catches the light',
    'the forests read as moss from this height',
    'the horizon bends pale at its edge',
    'other peaks stand like company kept at a distance',
  ];
  const DIRS = ['north', 'east', 'south', 'west'];

  const NAME_CACHE = new Map();

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || !THREE) { console.error(`[${PLUGIN_ID}] runtime not available`); return; }
    if (typeof XRPublisher.registerDecoration !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime too old (no registerDecoration)`); return;
    }

    // Feature-detect every optional API and degrade gracefully — this file
    // must still place shrines on a runtime that predates dialogs or HUDs.
    const utils = XRPublisher.utils || {};
    const HAS_DIALOG = typeof XRPublisher.openDialog === 'function';
    const HAS_HUD = typeof XRPublisher.registerHud === 'function';
    const HAS_TOD = typeof XRPublisher.getTimeOfDay === 'function';

    // Sub-rng factory: the engine's own alea when present (bit-stable across
    // renderers), else a small hash rng so old runtimes still get stable names.
    const subRng = (str) => {
      if (typeof utils.alea === 'function') return utils.alea(str);
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
      };
    };
    const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

    const peakName = (seed) => {
      let name = NAME_CACHE.get(seed);
      if (name) return name;
      const rng = subRng(seed + '-name');
      const root = pick(rng, ROOTS) + (rng() < 0.55 ? pick(rng, MIDS) : '') + pick(rng, ENDS);
      const form = rng();
      name = form < 0.3 ? `Mount ${root}` : form < 0.65 ? root : `${root} Peak`;
      NAME_CACHE.set(seed, name);
      return name;
    };
    const loreFor = (seed) => pick(subRng(seed + '-lore'), LORE);
    const surveyFor = (seed) => {
      const rng = subRng(seed + '-survey');
      return `To the ${pick(rng, DIRS)}, ${pick(rng, SIGHTS)}. To the ${pick(rng, DIRS)}, ${pick(rng, SIGHTS)}.`;
    };

    // ── Summit log: persistent discovered-peak set + ⛰ HUD counter ──────────
    // localStorage (not world-state): first ascents are PER-PLAYER bragging
    // rights, so they don't belong in the shared world record. Namespaced by
    // the world key so two worlds on one host keep separate logs.
    const worldKey = (typeof XRPublisher.getWorldStateKey === 'function'
      ? XRPublisher.getWorldStateKey() : location.hostname);
    const LOG_LS_KEY = `xrp-${PLUGIN_ID}-log-${worldKey}`;
    let discovered = new Set();
    try { discovered = new Set(JSON.parse(localStorage.getItem(LOG_LS_KEY)) || []); } catch (e) {}
    const saveLog = () => {
      try { localStorage.setItem(LOG_LS_KEY, JSON.stringify([...discovered])); } catch (e) {}
    };

    let renderHud = () => {};
    if (HAS_HUD) {
      const PANEL_STYLE = {
        background: 'rgba(15,15,20,0.82)',
        color: '#f5f5f7',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '10px',
        font: '600 15px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      };
      const wrap = document.createElement('div');
      Object.assign(wrap.style, { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' });
      const btn = document.createElement('button');
      // The HUD overlay itself is pointerEvents:none — clickable nodes opt in.
      Object.assign(btn.style, PANEL_STYLE, { padding: '8px 14px', cursor: 'pointer', pointerEvents: 'auto', userSelect: 'none' });
      const popup = document.createElement('div');
      Object.assign(popup.style, PANEL_STYLE, { padding: '10px 14px', display: 'none', minWidth: '178px', pointerEvents: 'auto' });
      wrap.append(btn, popup);
      renderHud = () => {
        btn.textContent = `⛰ Summits discovered: ${discovered.size}`;
        const rows = [...discovered].map((s) => peakName(s)).sort()
          .map((n) => `<div style="padding:2px 0">⚑ ${n}</div>`).join('');
        popup.innerHTML = `<div style="font-size:12px;opacity:0.65;margin-bottom:6px">Summit log</div>${
          rows || '<div style="opacity:0.6;font-weight:400">No first ascents yet — look for a light on a peak.</div>'}`;
      };
      btn.addEventListener('click', () => {
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
      });
      renderHud();
      XRPublisher.registerHud(`${PLUGIN_ID}-log`, wrap, 'top-right');
    }

    // ── Shared materials (module singletons — every shrine reuses these; the
    // default decoration cleanup disposes per-spawn GEOMETRY only, never
    // materials, so sharing is both the fast path and the safe one) ──────────
    const stoneMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
    const flagMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    // Emissive-only beacon: near-black base color so ALL its brightness is the
    // emissive term (blooms under postFX, still reads at distance without it).
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x0b1420, emissive: CRYSTAL_COLOR, emissiveIntensity: BASE_GLOW, roughness: 0.25, metalness: 0.1,
    });

    const C_BASE = new THREE.Color(0x4a443a);     // valley-facing dark stone
    const C_TOP = new THREE.Color(0xb6b2a4);      // wind-scoured pale top
    const C_LICHEN = new THREE.Color(0x5c6b3f);   // green crust near the base
    const C_CORD = new THREE.Color(0x2a2018);     // waxed cord
    const UP = new THREE.Vector3(0, 1, 0);
    const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

    // ── Tiny merge bucket: accumulate transformed, vertex-colored geometries
    // and weld them into ONE BufferGeometry (one mesh, one draw call — the
    // same discipline the engine's own tree/boulder builders follow). Handles
    // both indexed (Cylinder/Box/Plane) and non-indexed (Octahedron) sources.
    function createBucket() {
      const geos = [];
      return {
        add(geo) { geos.push(geo); },
        build() {
          let vTotal = 0, iTotal = 0;
          for (const g of geos) {
            vTotal += g.attributes.position.count;
            iTotal += g.index ? g.index.count : g.attributes.position.count;
          }
          const pos = new Float32Array(vTotal * 3);
          const nor = new Float32Array(vTotal * 3);
          const col = new Float32Array(vTotal * 3);
          const index = new Uint32Array(iTotal);
          let vo = 0, io = 0;
          for (const g of geos) {
            pos.set(g.attributes.position.array, vo * 3);
            nor.set(g.attributes.normal.array, vo * 3);
            col.set(g.attributes.color.array, vo * 3);
            const n = g.attributes.position.count;
            if (g.index) {
              const ia = g.index.array;
              for (let i = 0; i < ia.length; i++) index[io++] = ia[i] + vo;
            } else {
              for (let i = 0; i < n; i++) index[io++] = vo + i;
            }
            vo += n;
            g.dispose();   // source scratch geometry — free it immediately
          }
          const out = new THREE.BufferGeometry();
          out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
          out.setAttribute('color', new THREE.BufferAttribute(col, 3));
          out.setIndex(new THREE.BufferAttribute(index, 1));
          return out;
        },
      };
    }

    // Bake a per-vertex color attribute. fn(vertexPosition, outColor) — the
    // geometry is already in shrine-local space, so fn can key off height.
    function bakeColors(geo, fn) {
      const p = geo.attributes.position;
      const colors = new Float32Array(p.count * 3);
      const v = new THREE.Vector3(), c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        fn(v, c);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    // Radial noise displacement around a vertical axis at (cx, cz) — turns a
    // clean cylinder into weathered stone. `band` optionally insets a carved
    // ring (vertices inside [y0, y1] pull toward the axis).
    function displaceStone(geo, cx, cz, noise, amp, band) {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        let dx = x - cx, dz = z - cz;
        const len = Math.hypot(dx, dz);
        if (len < 1e-4) continue;               // cap-center vertices stay put
        dx /= len; dz /= len;
        const d = noise(x * 1.9, y * 1.9, z * 1.9) * amp;
        let r = len + d;
        if (band && y > band.y0 && y < band.y1) r = len * 0.88 - 0.04 + d * 0.3;
        p.setX(i, cx + dx * r);
        p.setZ(i, cz + dz * r);
      }
    }

    // ── The shrine builder. Runs once per summit; every rng draw is
    // unconditional and in fixed order, so a seed always yields this exact
    // shrine (the discovery state never touches geometry). ──────────────────
    function buildShrine(spawn) {
      const rng = spawn.rng;
      // Per-shrine 3D noise field for stone weathering — seeded from the
      // spawn so the SAME rock wear greets you on every visit.
      const noise = (typeof utils.createNoise3D === 'function' && typeof utils.alea === 'function')
        ? utils.createNoise3D(utils.alea(spawn.seed + '-stone'))
        : () => 0;

      // Grand peaks get slightly grander shrines (anchorScale is the engine's
      // mountain scale for this summit; absent on old runtimes).
      const grandeur = Math.min(Math.max(spawn.anchorScale || 1, 0.8), 1.6);
      const sizeMul = (0.9 + rng() * 0.2) * (0.85 + (grandeur - 0.8) * 0.35);

      // Silhouette plan — drawn up-front so later cosmetic draws can't shift it.
      const drums = 3 + Math.floor(rng() * 3);              // 3-5 stone drums
      const totalH = (3.1 + rng() * 1.6) * sizeMul;
      const r0 = (0.72 + rng() * 0.24) * sizeMul;           // base radius
      const rTop = r0 * (0.45 + rng() * 0.15);              // taper target
      const carveDrum = 1 + Math.floor(rng() * (drums - 1)); // which drum is carved
      const leanA = rng() * Math.PI * 2;                    // hand-stacked lean
      const leanMag = rng() * 0.055;                        // drift per unit height
      const heights = [];
      for (let i = 0; i < drums; i++) heights.push((totalH / drums) * (0.85 + rng() * 0.3));

      const stone = createBucket();
      const soft = createBucket();   // flags + cords (DoubleSide material)

      // Height of the column top, for the color gradient + collider.
      let colTop = 0.35;
      for (const h of heights) colTop += h;
      const capTop = colTop + 0.26;

      // Vertex-color story: dark, lichen-crusted base → pale wind-scoured
      // top, mottled by the same noise field that carved the stone.
      const stoneColor = (band) => (v, c) => {
        const t = clamp01((v.y + 0.55) / (capTop + 0.55));
        c.copy(C_BASE).lerp(C_TOP, Math.pow(t, 1.25));
        const m = noise(v.x * 0.8 + 13.7, v.y * 0.8, v.z * 0.8) * 0.5 + 0.5;
        c.multiplyScalar(0.88 + m * 0.24);
        if (t < 0.45 && noise(v.x * 2.6, v.y * 2.6 + 51.3, v.z * 2.6) > 0.52) c.lerp(C_LICHEN, 0.3);
        if (band && v.y > band.y0 && v.y < band.y1) c.multiplyScalar(0.55);   // carved shadow
      };

      // Plinth: wider than the column and sunk 0.55u below local y=0 — a
      // buried skirt so the shrine never hovers on the summit's curvature.
      {
        const g = new THREE.CylinderGeometry(r0 * 1.35, r0 * 1.6, 0.9, 10, 2);
        g.translate(0, 0.9 / 2 - 0.55, 0);
        displaceStone(g, 0, 0, noise, 0.1 * sizeMul);
        g.computeVertexNormals();
        bakeColors(g, stoneColor(null));
        stone.add(g);
      }

      // Stone drums, each with its own yaw + drift (hand-stacked look) and a
      // shared lean so the whole column tips a few degrees like old masonry.
      let y = 0.35;
      for (let i = 0; i < drums; i++) {
        const h = heights[i];
        const rB = (r0 + (rTop - r0) * (i / drums)) * (0.95 + rng() * 0.1);
        const rT = (r0 + (rTop - r0) * ((i + 1) / drums)) * (0.95 + rng() * 0.1);
        const cy = y + h / 2;
        const ox = Math.cos(leanA) * leanMag * cy + (rng() - 0.5) * 0.12;
        const oz = Math.sin(leanA) * leanMag * cy + (rng() - 0.5) * 0.12;
        const yaw = rng() * Math.PI;
        const g = new THREE.CylinderGeometry(rT, rB, h, 12, 5);
        const m = new THREE.Matrix4().makeRotationY(yaw);
        m.setPosition(ox, cy, oz);
        g.applyMatrix4(m);
        const band = i === carveDrum ? { y0: cy - h * 0.16, y1: cy + h * 0.16 } : null;
        displaceStone(g, ox, oz, noise, (0.09 + rng() * 0.05) * sizeMul, band);
        g.computeVertexNormals();
        bakeColors(g, stoneColor(band));
        stone.add(g);
        y += h;
      }

      // Capstone slab + a small seat the crystal floats above.
      const leanTopX = Math.cos(leanA) * leanMag * colTop;
      const leanTopZ = Math.sin(leanA) * leanMag * colTop;
      {
        const g = new THREE.CylinderGeometry(rTop * 1.5, rTop * 1.25, 0.26, 10, 1);
        g.translate(leanTopX, colTop + 0.13, leanTopZ);
        displaceStone(g, leanTopX, leanTopZ, noise, 0.06 * sizeMul);
        g.computeVertexNormals();
        bakeColors(g, stoneColor(null));
        stone.add(g);
        const seat = new THREE.CylinderGeometry(0.1, 0.16, 0.22, 6, 1);
        seat.translate(leanTopX, capTop + 0.11, leanTopZ);
        seat.computeVertexNormals();
        bakeColors(seat, stoneColor(null));
        stone.add(seat);
      }

      // ── Prayer-flag cords: capstone → small anchor stones on the ground.
      // Flags are single tattered quads with baked palette colors; the cord
      // is a run of thin boxes along a sagging quadratic curve. All static —
      // the "wind" is baked into per-flag tilt/tear so update() stays trivial.
      const attach = new THREE.Vector3(leanTopX, colTop + 0.05, leanTopZ);
      const cordCount = 1 + (rng() < 0.65 ? 1 : 0);
      let theta = rng() * Math.PI * 2;
      for (let cIdx = 0; cIdx < cordCount; cIdx++) {
        if (cIdx > 0) theta += Math.PI * (0.7 + rng() * 0.6);
        const dist = 1.6 + rng() * 0.8;
        const anchor = new THREE.Vector3(Math.cos(theta) * dist, -0.1, Math.sin(theta) * dist);

        // Anchor stone — sunk slightly so it stays seated on summit slope.
        {
          const rock = new THREE.IcosahedronGeometry(0.22 * sizeMul, 1);
          const p = rock.attributes.position, v = new THREE.Vector3();
          for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).normalize();
            const d = 1 + noise(v.x * 2.1 + cIdx * 9, v.y * 2.1, v.z * 2.1) * 0.35;
            p.setXYZ(i, v.x * 0.22 * sizeMul * d, v.y * 0.18 * sizeMul * d, v.z * 0.22 * sizeMul * d);
          }
          rock.computeVertexNormals();
          rock.translate(anchor.x, anchor.y, anchor.z);
          bakeColors(rock, (vv, c) => {
            c.copy(C_BASE).multiplyScalar(0.8 + (noise(vv.x * 3, vv.y * 3, vv.z * 3) * 0.5 + 0.5) * 0.3);
          });
          stone.add(rock);
        }

        // Sagging cord: quadratic bezier attach → anchor with a dropped mid.
        const sag = 0.28 + rng() * 0.22;
        const mid = attach.clone().lerp(anchor, 0.5); mid.y -= sag;
        const cordAt = (t) => new THREE.Vector3(
          (1 - t) * (1 - t) * attach.x + 2 * (1 - t) * t * mid.x + t * t * anchor.x,
          (1 - t) * (1 - t) * attach.y + 2 * (1 - t) * t * mid.y + t * t * anchor.y,
          (1 - t) * (1 - t) * attach.z + 2 * (1 - t) * t * mid.z + t * t * anchor.z,
        );
        const SEGS = 8;
        const q = new THREE.Quaternion(), dir = new THREE.Vector3();
        for (let s = 0; s < SEGS; s++) {
          const a = cordAt(s / SEGS), b = cordAt((s + 1) / SEGS);
          dir.subVectors(b, a);
          const len = dir.length(); dir.normalize();
          const g = new THREE.BoxGeometry(0.018, len, 0.018);
          q.setFromUnitVectors(UP, dir);
          const m = new THREE.Matrix4().makeRotationFromQuaternion(q);
          m.setPosition((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
          g.applyMatrix4(m);
          bakeColors(g, (_v, c) => c.copy(C_CORD));
          soft.add(g);
        }

        // Flags hang from the upper stretch of the cord, brightest first.
        const flagCount = 3 + Math.floor(rng() * 3);
        const palOffset = Math.floor(rng() * FLAG_PALETTE.length);
        const flagC = new THREE.Color(), bleach = new THREE.Color(0xd8d4c8);
        for (let f = 0; f < flagCount; f++) {
          const t = 0.12 + (f / (flagCount - 1 || 1)) * 0.55;
          const pnt = cordAt(t);
          const nxt = cordAt(t + 0.02);
          const w = 0.32 * sizeMul, hF = 0.26 * sizeMul;
          const g = new THREE.PlaneGeometry(w, hF, 2, 2);
          // Tatter: jitter the free (bottom) edge so each flag hangs torn.
          const p = g.attributes.position;
          for (let i = 0; i < p.count; i++) {
            const py = p.getY(i);
            if (py < -hF * 0.2) {
              p.setX(i, p.getX(i) + (rng() - 0.5) * 0.07);
              p.setY(i, py + rng() * hF * 0.3);        // torn corners ride up
            } else if (py < hF * 0.2) {
              p.setX(i, p.getX(i) + (rng() - 0.5) * 0.03); // mid-row waver
            }
          }
          g.translate(0, -hF / 2, 0);                   // hang from the top edge
          g.rotateX((rng() - 0.5) * 0.5);               // wind-blown swing, baked
          g.rotateY(Math.atan2(-(nxt.z - pnt.z), nxt.x - pnt.x)); // face along cord
          g.translate(pnt.x, pnt.y, pnt.z);
          g.computeVertexNormals();
          // Seeded palette order + sun-bleach so old flags read weathered.
          flagC.setHex(FLAG_PALETTE[(palOffset + f) % FLAG_PALETTE.length]);
          flagC.lerp(bleach, 0.18 + rng() * 0.2);
          const shade = 0.9 + rng() * 0.1;
          bakeColors(g, (_v, c) => c.copy(flagC).multiplyScalar(shade));
          soft.add(g);
        }
      }

      // ── Assemble. Stone + flags are STATIC — freeze their matrices so the
      // renderer never recomputes them; only the crystal keeps auto-update.
      const group = new THREE.Group();
      const stoneMesh = new THREE.Mesh(stone.build(), stoneMat);
      stoneMesh.castShadow = true;                 // the mass that matters
      stoneMesh.updateMatrix(); stoneMesh.matrixAutoUpdate = false;
      const softMesh = new THREE.Mesh(soft.build(), flagMat);
      softMesh.updateMatrix(); softMesh.matrixAutoUpdate = false;

      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.3 * sizeMul, 0), crystalMat);
      crystal.position.set(leanTopX, capTop + 0.62, leanTopZ);
      crystal.scale.y = 1.35;                      // elongated shard silhouette

      group.add(stoneMesh, softMesh, crystal);
      group.userData.crystal = crystal;
      group.userData.phase = rng() * Math.PI * 2;  // desync crystal spin per peak

      // Explicit collider: ONE cuboid around the stone column. Auto-cuboids
      // would also box the flag-cord mesh and wall off half the summit.
      group.userData.xrColliders = [
        { half: [r0 * 1.15, capTop / 2 + 0.15, r0 * 1.15], position: [0, capTop / 2, 0] },
      ];
      return group;
    }

    // ── Night pulse plumbing (see update() below) ────────────────────────────
    let pulseStamp = -1;      // last elapsed we wrote the shared material at
    let lastTodCheck = -1e9;  // last elapsed we polled the clock at
    let nightAmount = 0;      // 0 = day, 1 = deep night, ramps in the shoulders
    // The engine's sun is up 6.5→20.5; ramp the pulse in over the hour past
    // each edge so the crystal wakes with the dusk instead of snapping on.
    const nightAmountAt = (t) => {
      if (t >= 6.5 && t <= 20.5) return 0;
      if (t < 5.5 || t > 21.5) return 1;
      return t < 6.5 ? 6.5 - t : t - 20.5;
    };

    XRPublisher.registerDecoration({
      name: 'summit-totem',        // seeds placement — renaming relocates every shrine
      anchor: 'mountain',          // ← the headline: spawn on the REAL summit mesh
      density: 1,                  // one shrine per peak (a peak has one owner chunk)
      interactable: true,          // ← "E to interact", per-spawn mount
      collision: true,             // solid — but via the EXPLICIT xrColliders below,
                                   // not auto-cuboids (update() only spins a child
                                   // crystal; the collided root never moves)
      interactionRadius: INTERACTION_RADIUS,
      // The prompt is a FUNCTION — the engine re-resolves it ~10Hz, so an
      // undiscovered shrine invites you to read it, and a discovered one
      // greets you by the peak's name. Cheap by contract: a Set + Map lookup.
      interactionPrompt: (spawn) =>
        (discovered.has(spawn.seed) ? peakName(spawn.seed) : 'read the shrine'),

      create(spawn) {
        return buildShrine(spawn);
      },

      // update() runs per shrine per frame — keep it trivial. The per-object
      // work is ONE rotation write; everything shared (clock poll + material
      // write) runs once per frame TOTAL via the pulseStamp guard, and the
      // time-of-day check itself is throttled to ~2Hz (≈ every 30 frames).
      update(group, _delta, elapsed) {
        const crystal = group.userData.crystal;
        if (crystal) crystal.rotation.y = elapsed * 0.35 + group.userData.phase;
        if (pulseStamp === elapsed) return;   // another shrine already drove the pulse
        pulseStamp = elapsed;
        if (elapsed - lastTodCheck > 0.5) {
          lastTodCheck = elapsed;
          nightAmount = 0;
          if (HAS_TOD) {
            try { nightAmount = nightAmountAt(XRPublisher.getTimeOfDay().time); } catch (e) {}
          }
        }
        // Shared material — every crystal in the world breathes together.
        crystalMat.emissiveIntensity = BASE_GLOW
          + nightAmount * NIGHT_PULSE * (0.5 + 0.5 * Math.sin(elapsed * PULSE_SPEED));
      },

      // The discovery beat: name the peak, log the first ascent, offer a
      // chained "survey" dialog. Discovery is recorded even without the
      // dialog API so the HUD counter works on any runtime.
      onInteract({ spawn }) {
        const name = peakName(spawn.seed);
        const first = !discovered.has(spawn.seed);
        if (first) {
          discovered.add(spawn.seed);
          saveLog();
          renderHud();
        }
        if (!HAS_DIALOG) { console.log(`[${PLUGIN_ID}] discovered ${name}`); return; }
        XRPublisher.openDialog({
          title: name,
          content: loreFor(spawn.seed)
            + (first ? ' ⚑ First ascent — recorded in your summit log.' : ''),
          buttons: [
            {
              label: 'Survey the horizon',
              keepOpen: true,   // chain into a second dialog instead of closing
              onSelect: () => XRPublisher.openDialog({
                title: `The view from ${name}`,
                content: `${surveyFor(spawn.seed)} (${discovered.size} summit${discovered.size === 1 ? '' : 's'} in your log.)`,
                buttons: [{ label: 'Climb down', variant: 'primary' }],
              }),
            },
            { label: 'Leave', variant: 'primary' },
          ],
        });
      },
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] summit shrines registered (${discovered.size} peaks already logged)`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
