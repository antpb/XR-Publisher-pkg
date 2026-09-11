/**
 * rocky-clearings — XR Publisher decoration plugin (old quarry sites + a communal cairn)
 *
 * An abandoned QUARRY worked into the plains, built entirely from the public
 * API — no engine changes. The ground is packed GRAVEL (the "continuous-noise
 * surface" teaching example: a dirt base with a pebble layer thresholded in),
 * framed by a bare-dirt apron so it eases into the grass. On it: weathered,
 * lichen-spotted boulders; ONE boulder lying half-SPLIT where the wedges
 * cracked it (two halves pulled apart, flat fresh-cut inner faces); a stack of
 * CUT stone blocks with feather-and-wedge drill marks down one face; loose
 * timber poles from the last work crew — and a CAIRN near the centre that
 * EVERY VISITOR can add a stone to. The stone count is SHARED world state:
 * come back tomorrow and the stones your friends stacked are still standing
 * (for a week — then the untended pile settles back to its three founder
 * stones).
 *
 * What this demonstrates
 *   • registerTerrainSurface('gravel') — two octaves of MaterialX noise: a
 *     mottled dirt base with light/dark pebbles thresholded in. Composited
 *     into the ONE shared terrain material on WebGPU; WebGL gets the flat
 *     fallbackColor. (NEVER uv() in the TSL — coords come from localXZ.)
 *   • addTerrainRegion(...) paints the gravel circle, centred straight on
 *     spawn.renderPosition — render-frame world XZ (the frame terrain
 *     regions and world-state positions use) for every anchor type, no
 *     correction needed. (The legacy spawn.worldPosition was worker-frame
 *     and needed a −½-chunk shift; treat it as deprecated.)
 *   • The spec-level groundPatch clears grass + paints the dirt apron; the
 *     region passes clearGrass:false so ONE site costs one patch slot + one
 *     region slot (the engine keeps only the 24 / 8 nearest — don't spend two
 *     on the same clearing).
 *   • ONE merged BufferGeometry per site through a tiny matrix-baking merger
 *     (boulders + split halves + blocks + drill marks + poles → a single
 *     mesh), and ONE module-level MeshStandardMaterial with vertexColors for
 *     every rock and timber in every site. Lichen (sage/ochre), fresh-cut
 *     faces, wood grain — all baked per-vertex, zero extra materials.
 *   • Every prop seats on the REAL terrain via spawn.groundHeightAt(dx,dz),
 *     so the quarry follows a gentle hillside instead of floating on the
 *     spawn-centre plane.
 *   • Solid via EXPLICIT colliders (userData.xrColliders): the visuals are
 *     merged, so the engine's auto-cuboid would wrap the whole quarry in one
 *     impassable box. We author one cheap cuboid per big boulder / split pair
 *     / block stack / cairn base instead.
 *   • THE COMMUNAL CAIRN (world-state demo): interactable:true with a
 *     FUNCTION interactionPrompt — "Add a stone to the cairn (n stones)" —
 *     re-resolved at the engine's ~10Hz proximity cadence, so the count in
 *     the prompt updates live as the cairn grows. onInteract writes ONE tiny
 *     record { n, t } keyed by the site's deterministic spawn.seed
 *     (ttlSeconds = 7 days; pos in RENDER-frame XZ — same ½-chunk shift as
 *     the region). At CAIRN_CAP stones the prompt flips to "The cairn stands
 *     tall" and interaction becomes a no-op.
 *   • The cairn REBUILDS from a DEDICATED sub-rng: alea(spawn.seed +
 *     '-cairn'). spawn.rng is a one-shot stream consumed by create(), so a
 *     rebuild can't re-draw it — and stones 0..k must come out identical no
 *     matter how many stones follow. Restarting a namespaced alea stream on
 *     every rebuild guarantees both: the boulder layout is never perturbed,
 *     and every visitor sees the exact same cairn for a given count.
 *   • Live growth: subscribeWorldState rebuilds a mounted cairn the moment a
 *     peer adds a stone (or a chunk-prefix fetch lands). The swap uses the
 *     core's own hide-now-dispose-NEXT-frame pattern — never free a GPU
 *     buffer that might still be in this frame's render pass — and re-freezes
 *     the fresh mesh's matrices (static decorations are matrix-frozen after
 *     create(); a subtree added later must freeze itself).
 *   • STATE CHECKS ARE MOUNT-GATED: fetchWorldState runs only in create()
 *     (a chunk that actually contains a quarry), with a chunk prefix +
 *     maxAgeMs so N sites in a chunk share one request and remounts inside
 *     the freshness window cost zero HTTP. No tickers: a stone count only
 *     changes on interaction events, so there is NO per-frame or per-second
 *     work at all — the whole site is static geometry between interactions.
 *   • Degrades gracefully: no world-state API → the cairn still works as a
 *     session-only counter (rebuilt locally, forgotten on reload); no
 *     networking → HTTP-only persistence. Concurrent adds resolve by
 *     newest-updatedAt-wins, so two simultaneous stones may merge into one —
 *     acceptable for an honor-system communal pile.
 *
 * Deterministic: every boulder, chip, drill mark, and pole comes from
 * spawn.rng in a FIXED draw order — same seed ⇒ same quarry, every visit,
 * every renderer. The cairn adds on top from its own seeded stream.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'rocky-clearings';
  const SURFACE_ID = 'gravel';

  // ── Configure me ──────────────────────────────────────────────────────────
  const FLOOR_RADIUS = 13;      // gravel radius (world units)
  const DIRT_RADIUS = 18;       // dirt apron radius (> FLOOR_RADIUS)
  const SURFACE_SCALE = 0.7;    // pebble frequency
  const BOULDER_COUNT = 5;      // weathered boulders per site
  // ── Communal cairn (world-state demo) ────────────────────────────────────
  const CAIRN_CAP = 15;             // visitor stones before "the cairn stands tall"
  const BASE_CAIRN_STONES = 3;      // founder stones — the deterministic default
  const STATE_TTL_S = 7 * 24 * 3600; // untended for a week → back to 3 stones
  const STATE_FRESH_MS = 45 * 1000;  // chunk-prefix fetch freshness window
  // ── Palette (baked as vertex colors — ONE shared material renders it all) ─
  const COL = {
    rockLight: [0.55, 0.53, 0.49],   // weathered granite, sunny side
    rockDark: [0.42, 0.41, 0.38],    // weathered granite, shaded stock
    cutFresh: [0.67, 0.65, 0.60],    // unweathered split/cut faces
    cutBlock: [0.60, 0.58, 0.53],    // dressed block faces
    markDark: [0.17, 0.16, 0.15],    // drill/wedge scars
    timber: [0.38, 0.29, 0.19],      // work poles
    lichenSage: [0.46, 0.55, 0.37],  // damp-side lichen
    lichenOchre: [0.65, 0.54, 0.29], // sun-side lichen
  };
  // ──────────────────────────────────────────────────────────────────────────

  let registered = false;

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  // ── Custom terrain surface: gravel (dirt base + thresholded pebbles) ────────
  function registerSurface(XRPublisher) {
    const T = XRPublisher.tsl;
    const { Fn, vec3, vec4, float, mix, smoothstep, mx_noise_float } = T;
    XRPublisher.registerTerrainSurface({
      id: SURFACE_ID,
      fallbackColor: [0.33, 0.27, 0.20],   // packed dirt (WebGL flat fallback)
      tsl: ({ localXZ, params, tint }) => Fn(() => {
        const scale = params.y.max(float(0.001));
        const p = localXZ.mul(scale);
        const n1 = mx_noise_float(vec3(p.x, p.y, 0.0)).mul(0.5).add(0.5);
        const n2 = mx_noise_float(vec3(p.x.mul(4.0), p.y.mul(4.0), 7.0)).mul(0.5).add(0.5);
        const base = vec3(0.30, 0.24, 0.17).mul(n1.mul(0.3).add(0.8));   // mottled dirt
        const pebble = mix(vec3(0.22, 0.20, 0.18), vec3(0.54, 0.51, 0.46), n1);
        const stoneMask = smoothstep(float(0.60), float(0.78), n2);      // pebbles where n2 high
        const col = mix(base, pebble, stoneMask).mul(tint);
        const rough = mix(float(0.98), float(0.72), stoneMask);
        return vec4(col, rough);
      })(),
    });
  }

  // ── Shared material (module singleton — one for EVERY rock in every site) ──
  // vertexColors carries all the visual variety (weathering, lichen, cut
  // faces, timber), so the entire plugin ships exactly one material and the
  // default per-spawn cleanup (geometry-only) is exactly right.
  let MAT = null;
  function ensureMaterials(THREE) {
    if (MAT) return MAT;
    MAT = {
      rock: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 }),
    };
    return MAT;
  }

  // ── Tiny geometry merger ────────────────────────────────────────────────────
  // Bakes each part's matrix into its vertices and appends everything into one
  // buffer → ONE mesh (one draw call) per site instead of ~40 small meshes.
  // Handles indexed (Box/Cylinder) and non-indexed (Icosahedron) inputs and
  // disposes each source geometry as it's consumed.
  function createMerger() {
    const P = [], N = [], C = [], IX = [];
    return {
      add(geo, matrix) {
        if (matrix) geo.applyMatrix4(matrix);   // also fixes normals via normalMatrix
        const p = geo.attributes.position, n = geo.attributes.normal, c = geo.attributes.color;
        const base = P.length / 3;
        for (let i = 0; i < p.count; i++) {
          P.push(p.getX(i), p.getY(i), p.getZ(i));
          N.push(n.getX(i), n.getY(i), n.getZ(i));
          C.push(c.getX(i), c.getY(i), c.getZ(i));
        }
        const ix = geo.index;
        if (ix) { for (let i = 0; i < ix.count; i++) IX.push(base + ix.getX(i)); }
        else { for (let i = 0; i < p.count; i++) IX.push(base + i); }
        geo.dispose();
      },
      build(THREE, material) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
        geo.setIndex(IX);
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      },
    };
  }

  // ── Rock geometry: noise-displaced icospheres ───────────────────────────────
  // Non-indexed (PolyhedronGeometry), so computeVertexNormals gives the flat,
  // faceted BotW-rock look for free. `off` de-correlates each rock's lumps.
  function lumpyRockGeo(THREE, noise, r, off, amp, freq) {
    const geo = new THREE.IcosahedronGeometry(r, 1);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = noise(v.x * freq + off, v.y * freq, v.z * freq);
      v.multiplyScalar(1 + n * amp);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // One HALF of a split boulder: displace the same icosphere with the SAME
  // noise offset for both halves (so they're recognisably one boulder pulled
  // apart), then collapse everything past the split plane onto x=0. The
  // collapsed triangles are zero-area (invisible) and get zero normals from
  // computeVertexNormals, so we hand-stamp the cut-plane normal — that's what
  // makes the inner face read as one flat machine-cut surface.
  function splitHalfGeo(THREE, noise, r, off, side) {
    const geo = new THREE.IcosahedronGeometry(r, 1);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    const cut = new Uint8Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = noise(v.x * 1.6 + off, v.y * 1.6, v.z * 1.6);
      v.multiplyScalar(1 + n * 0.24);
      if (v.x * side < 0) { v.x = 0; cut[i] = 1; }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const nor = geo.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      if (cut[i]) nor.setXYZ(i, -side, 0, 0);
    }
    return { geo, cut };
  }

  // ── Vertex-color bakers ─────────────────────────────────────────────────────
  // Weathered rock: noise-mottled base, with lichen pulled in on patches that
  // favour up-facing (rain-catching) surfaces. cutFlags marks fresh-cut verts
  // (split faces) — they get the pale unweathered tone instead.
  function bakeRock(THREE, geo, noise, base, lichenAmt, lichenCol, off, cutFlags) {
    const pos = geo.attributes.position, nor = geo.attributes.normal;
    const arr = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (cutFlags && cutFlags[i]) {
        const m = 0.94 + 0.12 * (0.5 + 0.5 * noise(v.y * 4.0 + off, v.z * 4.0, 3.3));
        arr[i * 3] = COL.cutFresh[0] * m;
        arr[i * 3 + 1] = COL.cutFresh[1] * m;
        arr[i * 3 + 2] = COL.cutFresh[2] * m;
        continue;
      }
      const m = 0.86 + 0.28 * (0.5 + 0.5 * noise(v.x * 0.9 + off + 5.1, v.y * 0.9, v.z * 0.9));
      let r = base[0] * m, g = base[1] * m, b = base[2] * m;
      if (lichenAmt > 0) {
        const up = Math.max(0, nor.getY(i));
        const mask = noise(v.x * 2.3 + off + 31.7, v.y * 2.3, v.z * 2.3);
        const k = Math.min(0.55, Math.max(0, mask - 0.2) * lichenAmt * (0.3 + 0.7 * up));
        r += (lichenCol[0] - r) * k;
        g += (lichenCol[1] - g) * k;
        b += (lichenCol[2] - b) * k;
      }
      arr[i * 3] = r; arr[i * 3 + 1] = g; arr[i * 3 + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }

  // Flat color with per-vertex jitter (blocks, marks, timber). Draws come from
  // the caller's rng — vertex counts are fixed per geometry type, so the draw
  // count (and therefore everything after it) stays deterministic.
  function bakeFlat(THREE, geo, c, jitter, rnd) {
    const pos = geo.attributes.position;
    const arr = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const j = 1 + (rnd() - 0.5) * 2 * jitter;
      arr[i * 3] = c[0] * j; arr[i * 3 + 1] = c[1] * j; arr[i * 3 + 2] = c[2] * j;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }

  // ── The quarry site: every seeded decision in a FIXED draw order ────────────
  // (1) boulders → (2) split pair → (3) block stack + drill marks → (4) timber
  // → (5) cairn anchor. All from spawn.rng; the cairn itself draws from its own
  // stream (see buildCairnMesh). Returns the single merged mesh + where the
  // cairn goes; fills `colliders` with hand-authored cuboids.
  function buildSite(THREE, XR, spawn, gy, colliders) {
    const rng = spawn.rng;
    const noise = XR.utils.createNoise3D(XR.utils.alea(`${spawn.seed}-rock`));
    const M = createMerger();
    const ONE = new THREE.Vector3(1, 1, 1);

    // 1) Weathered boulders — lumpy, tilted, some lichen-spotted, half-buried.
    for (let b = 0; b < BOULDER_COUNT; b++) {
      const r = 0.7 + rng() * 1.5;
      const a = rng() * Math.PI * 2;
      const dist = 3.5 + rng() * (FLOOR_RADIUS - 6);   // keep the centre clear for the cairn
      const dark = rng() < 0.45;
      const lichenAmt = rng() < 0.55 ? 0.45 + rng() * 0.45 : 0;
      const sage = rng() < 0.5;
      const yaw = rng() * Math.PI * 2;
      const tilt = (rng() - 0.5) * 0.5;
      const roll = (rng() - 0.5) * 0.5;
      const x = Math.cos(a) * dist, z = Math.sin(a) * dist;
      const gb = gy(x, z);
      const geo = lumpyRockGeo(THREE, noise, r, b * 17.3, 0.28, 1.6);
      bakeRock(THREE, geo, noise, dark ? COL.rockDark : COL.rockLight,
        lichenAmt, sage ? COL.lichenSage : COL.lichenOchre, b * 17.3);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, roll, 'YXZ'));
      M.add(geo, new THREE.Matrix4().compose(new THREE.Vector3(x, gb + r * 0.5, z), q, ONE));
      // Only the boulders big enough to block a player get a collider.
      if (r >= 1.05) colliders.push({ half: [r * 0.72, r * 0.6, r * 0.72], position: [x, gb + r * 0.5, z] });
    }

    // 2) The half-split boulder: two halves of ONE displaced sphere (same
    // noise offset), pulled apart along the pair's local X with flat cut
    // faces facing each other, each leaning slightly away from the split.
    const pa = rng() * Math.PI * 2;
    const pd = 3 + rng() * (FLOOR_RADIUS - 7);
    const pr = 0.95 + rng() * 0.65;
    const gap = 0.35 + rng() * 0.5;
    const pairYaw = rng() * Math.PI * 2;
    const pairLichen = 0.3 + rng() * 0.3;
    const px = Math.cos(pa) * pd, pz = Math.sin(pa) * pd;
    for (const side of [1, -1]) {
      const lean = 0.06 + rng() * 0.08;
      const yawJit = (rng() - 0.5) * 0.2;
      const off = gap / 2 + pr * 0.08;
      // Local +X under makeRotationY(θ) maps to world (cosθ, 0, −sinθ).
      const hx = px + Math.cos(pairYaw) * side * off;
      const hz = pz - Math.sin(pairYaw) * side * off;
      const { geo, cut } = splitHalfGeo(THREE, noise, pr, 57.9, side);
      bakeRock(THREE, geo, noise, COL.rockLight, pairLichen, COL.lichenSage, 57.9, cut);
      const m = new THREE.Matrix4().makeTranslation(hx, gy(hx, hz) + pr * 0.42, hz)
        .multiply(new THREE.Matrix4().makeRotationY(pairYaw + yawJit))
        .multiply(new THREE.Matrix4().makeRotationZ(-side * lean));
      M.add(geo, m);
    }
    colliders.push({
      half: [pr * 1.05 + gap / 2, pr * 0.5, pr * 0.8],
      position: [px, gy(px, pz) + pr * 0.45, pz],
      rotation: [0, pairYaw, 0],
    });

    // 3) Cut stone blocks — 2-4 dressed boxes with seeded chip-jitter on size
    // and yaw, stacked with a slight settle. Feather-and-wedge drill marks
    // (thin dark inset boxes) run along the top edge of each block's face —
    // the detail that says these were CUT here, not found here.
    const ba = rng() * Math.PI * 2;
    const bd = 3 + rng() * (FLOOR_RADIUS - 7.5);
    const bx = Math.cos(ba) * bd, bz = Math.sin(ba) * bd;
    const stackYaw = rng() * Math.PI * 2;
    const nBlocks = 2 + Math.floor(rng() * 3);
    const gBlock = gy(bx, bz);
    let topY = gBlock - 0.06;                          // bottom block settles into the gravel
    for (let k = 0; k < nBlocks; k++) {
      const w = (1.15 - k * 0.1) * (0.92 + rng() * 0.16);
      const h = 0.5 + rng() * 0.22;
      const d = (0.85 - k * 0.06) * (0.92 + rng() * 0.16);
      const yawJit = (rng() - 0.5) * 0.28;
      const jx = (rng() - 0.5) * 0.16, jz = (rng() - 0.5) * 0.16;
      const mb = new THREE.Matrix4().makeTranslation(bx + jx, topY + h / 2, bz + jz)
        .multiply(new THREE.Matrix4().makeRotationY(stackYaw + yawJit));
      const nMarks = 3 + Math.floor(rng() * 3);
      for (let mi = 0; mi < nMarks; mi++) {
        const mg = new THREE.BoxGeometry(0.05, 0.16 + rng() * 0.07, 0.035);
        bakeFlat(THREE, mg, COL.markDark, 0.03, rng);
        const mx = ((mi + 0.5) / nMarks - 0.5) * w * 0.85;
        M.add(mg, mb.clone().multiply(new THREE.Matrix4().makeTranslation(mx, h / 2 - 0.07, d / 2 + 0.004)));
      }
      const geo = new THREE.BoxGeometry(w, h, d);
      bakeFlat(THREE, geo, COL.cutBlock, 0.06, rng);
      M.add(geo, mb);
      topY += h - 0.02;
    }
    colliders.push({
      half: [0.75, (topY - gBlock) / 2 + 0.03, 0.6],
      position: [bx, gBlock + (topY - gBlock) / 2, bz],
      rotation: [0, stackYaw, 0],
    });

    // 4) Timber poles — a loose pile near the blocks, plus (usually) one pole
    // left leaning against the stack. Thin enough that no collider is worth it.
    if (rng() < 0.7) {
      const ta = ba + Math.PI * (0.25 + rng() * 0.5);
      const td = bd * 0.6 + 1.5 + rng() * 2;
      const tx = Math.cos(ta) * td, tz = Math.sin(ta) * td;
      const nP = 2 + (rng() < 0.5 ? 1 : 0);
      const baseYaw = rng() * Math.PI * 2;
      const UP = new THREE.Vector3(0, 1, 0);
      for (let p = 0; p < nP; p++) {
        const len = 3 + rng() * 1.2;
        const rP = 0.055 + rng() * 0.03;
        const yaw = baseYaw + (rng() - 0.5) * 0.5;
        const ox = tx + (rng() - 0.5) * 0.9, oz = tz + (rng() - 0.5) * 0.9;
        const geo = new THREE.CylinderGeometry(rP * 0.8, rP, len, 6);
        bakeFlat(THREE, geo, COL.timber, 0.08, rng);
        const dir = new THREE.Vector3(Math.cos(yaw), 0.02 + rng() * 0.05, Math.sin(yaw)).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
        // Later poles rest a touch higher — reads as a pile, not a raked row.
        const cy = gy(ox, oz) + rP + p * rP * 1.4;
        M.add(geo, new THREE.Matrix4().compose(new THREE.Vector3(ox, cy, oz), q, ONE));
      }
      if (rng() < 0.75) {
        const la = ba + (rng() - 0.5) * 1.2;
        const fx = bx + Math.cos(la) * 2.4, fz = bz + Math.sin(la) * 2.4;
        const basePt = new THREE.Vector3(fx, gy(fx, fz) + 0.05, fz);
        const tip = new THREE.Vector3(bx, topY + 0.02, bz);
        const dirL = tip.clone().sub(basePt);
        const lenL = dirL.length() + 0.5;
        const qL = new THREE.Quaternion().setFromUnitVectors(UP, dirL.normalize());
        const geo = new THREE.CylinderGeometry(0.05, 0.065, lenL, 6);
        bakeFlat(THREE, geo, COL.timber, 0.08, rng);
        const mid = basePt.clone().add(tip).multiplyScalar(0.5);
        M.add(geo, new THREE.Matrix4().compose(mid, qL, ONE));
      }
    }

    // 5) Cairn anchor — near the centre (the boulder ring starts at 3.5u, so
    // this spot is always clear). The POSITION is part of the base layout
    // (spawn.rng draws, fixed order); the STONES come from the dedicated
    // '-cairn' stream so rebuilds never touch these draws.
    const ca = rng() * Math.PI * 2;
    const cd = 0.7 + rng() * 1.5;
    const cairnPos = [Math.cos(ca) * cd, Math.sin(ca) * cd];
    // Static base collider — sized for the founder stack. Visitor stones grow
    // past it visually; colliders mount once at create() and can't follow a
    // rebuild, which is fine for a decorative pile.
    colliders.push({
      half: [0.5, 0.95, 0.5],
      position: [cairnPos[0], gy(cairnPos[0], cairnPos[1]) + 0.95, cairnPos[1]],
    });

    const mesh = M.build(THREE, ensureMaterials(THREE).rock);
    mesh.name = 'quarry';
    return { mesh, cairnPos };
  }

  // ── The cairn: BASE_CAIRN_STONES founders + n visitor stones ────────────────
  // Rebuilt whole on every count change from alea(seed + '-cairn'): restarting
  // the namespaced stream means stones 0..k are IDENTICAL for every n ≥ k —
  // adding a stone visibly continues the pile instead of reshuffling it, and
  // every peer sees the same pile for the same count. Founder stones are dark
  // and lichened (they've been here for years); visitor stones are fresh pale
  // granite, so a grown cairn tells its own story.
  function buildCairnMesh(THREE, XR, seed, count, gy, cx, cz) {
    const rng = XR.utils.alea(`${seed}-cairn`);
    const noise = XR.utils.createNoise3D(XR.utils.alea(`${seed}-cairn-shape`));
    const M = createMerger();
    const total = BASE_CAIRN_STONES + Math.max(0, Math.min(CAIRN_CAP, count));
    let y = gy(cx, cz) - 0.05;
    for (let s = 0; s < total; s++) {
      const r = Math.max(0.13, 0.42 * Math.pow(0.9, s)) * (0.92 + rng() * 0.16);
      const jx = (rng() - 0.5) * 0.14, jz = (rng() - 0.5) * 0.14;
      const yawS = rng() * Math.PI * 2;
      const tiltX = (rng() - 0.5) * 0.16, tiltZ = (rng() - 0.5) * 0.16;
      // Higher noise frequency than the boulders — hand-sized stones need
      // their lumps at hand scale.
      const geo = lumpyRockGeo(THREE, noise, r, s * 11.7, 0.2, 4.5);
      const founder = s < BASE_CAIRN_STONES;
      bakeRock(THREE, geo, noise, founder ? COL.rockDark : COL.rockLight,
        founder ? 0.5 : 0, COL.lichenSage, s * 11.7);
      y += r * 0.42;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, yawS, tiltZ, 'YXZ'));
      M.add(geo, new THREE.Matrix4().compose(
        new THREE.Vector3(cx + jx, y, cz + jz), q, new THREE.Vector3(1, 0.6, 1)));
      y += r * 0.5;
    }
    const mesh = M.build(THREE, ensureMaterials(THREE).rock);
    mesh.name = 'cairn';
    return mesh;
  }

  // seed → { group, gy, cairnPos, count } for every mounted site.
  const liveSites = new Map();
  // No-world-state fallback: the same counter, session-only (lost on reload).
  const sessionCounts = new Map();

  // Chunk prefix from a spawn.seed: strip the trailing `-gx-gz` cell coords,
  // leaving `${worldSeed}-decoration-rocky-clearings-cx-cz-` — one fetch
  // covers every site in the chunk.
  const chunkPrefixOf = (seed) => {
    const a = seed.lastIndexOf('-');
    const b = seed.lastIndexOf('-', a - 1);
    return seed.slice(0, b + 1);
  };

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || typeof XRPublisher.registerTerrainSurface !== 'function'
      || !XRPublisher.utils
      || typeof XRPublisher.utils.alea !== 'function'
      || typeof XRPublisher.utils.createNoise3D !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime too old (needs registerTerrainSurface + utils)`);
      return;
    }
    registerSurface(XRPublisher);

    // Persisted cairns need the world-state API; without it the cairn still
    // works, but counts live only in this session's memory.
    const HAS_STATE = typeof XRPublisher.setWorldState === 'function'
      && typeof XRPublisher.getWorldState === 'function'
      && typeof XRPublisher.subscribeWorldState === 'function'
      && typeof XRPublisher.fetchWorldState === 'function';

    // Harden against garbage records — a peer could broadcast anything.
    const countOf = (v) => (v && typeof v.n === 'number' && isFinite(v.n))
      ? Math.max(0, Math.min(CAIRN_CAP, Math.floor(v.n))) : 0;
    const deriveCount = (seed) => {
      if (HAS_STATE) {
        const rec = XRPublisher.getWorldState(PLUGIN_ID, seed);   // SYNC snapshot read
        return countOf(rec && rec.value);
      }
      return countOf(sessionCounts.get(seed));
    };

    // Live rebuild = hide NOW, dispose NEXT frame (the core's own pattern —
    // never free a GPU buffer that might still be in this frame's render
    // pass), then freeze the fresh mesh's matrices: static decorations are
    // matrix-frozen after create(), so a later-added subtree must freeze
    // itself or it renders at identity.
    const rebuildCairn = (entry, n) => {
      const old = entry.group.getObjectByName('cairn');
      if (old) {
        old.visible = false;
        entry.group.remove(old);
        requestAnimationFrame(() => { if (old.geometry) old.geometry.dispose(); });
      }
      const fresh = buildCairnMesh(THREE, XRPublisher, entry.seed, n, entry.gy,
        entry.cairnPos[0], entry.cairnPos[1]);
      entry.group.add(fresh);
      fresh.updateMatrix();
      fresh.matrixAutoUpdate = false;
      fresh.updateMatrixWorld(true);
      entry.count = n;
    };

    if (HAS_STATE) {
      // Peers' stones (and chunk-prefix fetch results) grow mounted cairns
      // live. The local setWorldState below also applies optimistically and
      // lands here — one rebuild path for every source of truth.
      XRPublisher.subscribeWorldState((plugin, key) => {
        if (plugin !== PLUGIN_ID) return;
        const entry = liveSites.get(key);
        if (!entry) return;
        const n = deriveCount(key);
        if (n !== entry.count) rebuildCairn(entry, n);
      });
    }

    const spec = {
      name: PLUGIN_ID,
      density: 0.5,
      biomes: ['default'],
      maxSlope: 0.16,
      minWaterDistance: 8,
      minSpacing: 42,
      collision: true,            // explicit colliders via userData.xrColliders
      // The spec groundPatch clears grass and paints the dirt apron; the
      // region below passes clearGrass:false so one site costs ONE patch slot
      // + ONE region slot (the engine keeps only the 24/8 nearest).
      groundPatch: { radius: DIRT_RADIUS, color: [0.33, 0.26, 0.18], clearGrass: true },
      create(spawn) {
        // renderPosition is render-frame world XZ — the frame regions paint
        // in — for every anchor type; no correction needed.
        const wx = spawn.renderPosition[0];
        const wz = spawn.renderPosition[2];
        const regionId = `${PLUGIN_ID}-${spawn.seed}`;
        XRPublisher.addTerrainRegion({
          id: regionId,
          center: [wx, wz],
          radius: FLOOR_RADIUS,
          surface: SURFACE_ID,
          scale: SURFACE_SCALE,
          mortar: 0.0,
          clearGrass: false,      // the spec groundPatch already cleared the apron
        });

        // Ground sampler relative to the object's origin plane — seats every
        // boulder/block/stone on the real terrain. Older runtimes: flat plane.
        const gy = spawn.groundHeightAt || (() => 0);

        const colliders = [];
        const { mesh, cairnPos } = buildSite(THREE, XRPublisher, spawn, gy, colliders);

        const group = new THREE.Group();
        group.add(mesh);

        // The cairn mounts at its CURRENT persisted count (sync snapshot —
        // the mount-gated fetch below fills/refreshes the snapshot, and any
        // late-arriving record rebuilds via subscribeWorldState).
        const count = deriveCount(spawn.seed);
        group.add(buildCairnMesh(THREE, XRPublisher, spawn.seed, count, gy, cairnPos[0], cairnPos[1]));

        liveSites.set(spawn.seed, { group, seed: spawn.seed, gy, cairnPos, count });
        group.userData.__regionId = regionId;
        group.userData.__siteSeed = spawn.seed;
        group.userData.xrColliders = colliders;

        if (HAS_STATE) {
          // State is checked ONLY here — when a chunk that actually contains
          // a quarry mounts. maxAgeMs makes remounts free and coalesces the
          // sites of one chunk into one request; roaming quarry-free terrain
          // costs zero HTTP.
          XRPublisher.fetchWorldState(PLUGIN_ID, {
            prefix: chunkPrefixOf(spawn.seed),
            maxAgeMs: STATE_FRESH_MS,
          }).catch(() => {});
        }
        return group;
      },
      dispose(object) {
        const rid = object && object.userData && object.userData.__regionId;
        if (rid) XRPublisher.removeTerrainRegion(rid);
        const seed = object && object.userData && object.userData.__siteSeed;
        // Guard by IDENTITY: the engine defers dispose() a frame while React
        // runs cleanup BEFORE the next effect body, so a chunk re-scatter
        // calls create(new) before dispose(old) for the same seed —
        // deleting by seed alone would evict the live entry.
        if (seed && liveSites.get(seed) === object) liveSites.delete(seed);
        // Shared material is a module singleton — geometry-only disposal is
        // exactly the default contract.
        object.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      },
    };

    // ── "E to interact": add a stone to the communal cairn ────────────────────
    // The prompt is a FUNCTION — re-resolved at the engine's ~10Hz proximity
    // cadence, so the count updates live as this player (or a peer!) adds
    // stones. Keep it cheap: deriveCount is one sync Map lookup.
    spec.interactable = true;
    spec.interactionRadius = 6;   // stand by the cairn, well inside the server's
                                  // ~32u world-state writer-distance rule
    spec.interactionPrompt = (spawn) => {
      const n = deriveCount(spawn.seed);
      return n >= CAIRN_CAP
        ? `The cairn stands tall (${CAIRN_CAP} stones)`
        : `Add a stone to the cairn (${n} ${n === 1 ? 'stone' : 'stones'})`;
    };
    spec.onInteract = (ctx) => {
      const seed = ctx.spawn.seed;
      const n = deriveCount(seed);
      if (n >= CAIRN_CAP) return;   // full — the prompt already says so
      const value = { n: n + 1, t: Date.now() };   // t: merge tiebreak + human archaeology
      if (HAS_STATE) {
        // Positions are RENDER-frame world XZ — renderPosition directly,
        // same frame as the terrain region; a wrong frame here and the
        // server rejects the write as too far from the player.
        const wx = ctx.spawn.renderPosition[0], wz = ctx.spawn.renderPosition[2];
        XRPublisher.setWorldState(PLUGIN_ID, seed, value, {
          pos: [wx, wz],
          ttlSeconds: STATE_TTL_S,
        });
        // Optimistic local apply fires subscribeWorldState → the cairn grows
        // immediately; peers and the API converge behind it (newest-updatedAt
        // wins, so two simultaneous stones may merge into one — fine for an
        // honor-system pile).
      } else {
        sessionCounts.set(seed, value);
        const entry = liveSites.get(seed);
        if (entry) rebuildCairn(entry, value.n);
      }
    };
    // Test hook: harnesses drive the counter machinery without a world.
    spec.__test = { countOf, chunkPrefixOf };

    XRPublisher.registerDecoration(spec);

    registered = true;
    console.log(`[${PLUGIN_ID}] registered — quarry sites (gravel r=${FLOOR_RADIUS}, dirt r=${DIRT_RADIUS}) in DEFAULT biome${
      HAS_STATE ? ' + persisted communal cairns (E to add a stone)' : ' + session-only cairns'}`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
