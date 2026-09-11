/**
 * farm-plots — XR Publisher decoration plugin (procedural farmsteads)
 *
 * A believable cultivated PLOT carved into the plains, built the way the
 * engine's own decorations are: a semantic PLAN first (seeded from spawn.rng),
 * then compiled into a handful of MERGED meshes — one per material — instead
 * of a mesh per fence post.
 *
 *   • registerTerrainSurface('tilled-soil') — sine furrows × grain noise,
 *     brown soil with darker troughs and a faint sprout speckle on the crests.
 *     Composited into the terrain material on WebGPU; WebGL gets the flat
 *     fallbackColor.
 *   • addTerrainRegion(...) paints the tilled circle, centred straight on
 *     spawn.renderPosition — render-frame world XZ for every anchor type,
 *     no correction needed. (The legacy spawn.worldPosition was worker-frame
 *     and needed a −½-chunk shift; treat it as deprecated.)
 *   • Each plot draws a seeded FOCUS (wheat / pumpkins / cabbages / carrots)
 *     and plants its crop rows ON THE FURROW CREST LINES of the tilled
 *     surface (crest z = (k + 0.25) / SURFACE_SCALE in region-local coords),
 *     so geometry and shader agree about where things grow.
 *   • Rectangular post-and-rail fence with a gate, leaning posts, doubled
 *     rails nailed to the outside face — orientation comes from per-segment
 *     yaw only (no euler-composition surprises), all emitted into the writer.
 *   • Solid via EXPLICIT colliders (`userData.xrColliders`): the visual
 *     geometry is merged, so the engine's auto-cuboid path would wrap the
 *     whole farm in one impassable box. We author one thin cuboid per fence
 *     run + one per prop instead — walk through the gate, jump the rails.
 *   • PERSISTED CROP LIFECYCLE (the world-state flagship demo): each plot
 *     keeps ONE tiny record in XRPublisher's world-state API, keyed by its
 *     deterministic spawn.seed. "E to interact" (+ the mobile button) is
 *     contextual by stage: Harvest ripe crops → stubble → sprouts that DIE
 *     unless someone waters them → watered crops grow back to ripe. The
 *     stage is DERIVED from one timestamp at read time (no server clock);
 *     records expire after 24h so untended farms reset to the deterministic
 *     default (ripe). Crops live in their own subgroup with a dedicated
 *     `alea(seed+'-crops')` rng, so stage rebuilds are deterministic and
 *     never perturb the fence/prop layout. State syncs to room peers live
 *     (reserved channel) and persists via the API; with no API it degrades
 *     to session-only, and on old runtimes the farm is simply always ripe.
 *     The tilled SOIL tints with the stage too (wet-dark while watered crops
 *     grow, ashen when they die) so every action reads from a distance.
 *   • STATE CHECKS ARE MOUNT-GATED: fetch happens only in create() (a chunk
 *     that actually contains a plot), with `maxAgeMs` so remounts inside the
 *     freshness window cost zero HTTP and same-chunk plots share one request.
 *     The 1s stage ticker exists only while plots are mounted — leaving farm
 *     country stops ALL state work (no timers, no fetches).
 *   • HARVEST INVENTORY: a 🧺 HUD button counts what YOU picked, per crop
 *     type (wheat/pumpkin/cabbage/carrot — the plan's crop slug is the key);
 *     click it for the breakdown. Local to this player, persisted in
 *     localStorage per world key.
 *
 * Deterministic: every dimension, crop, prop, and lean comes from spawn.rng
 * in a fixed draw order — same seed ⇒ same farm, every visit, every renderer.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'farm-plots';
  const SURFACE_ID = 'tilled-soil';

  // ── Configure me ──────────────────────────────────────────────────────────
  const SURFACE_SCALE = 0.55;   // furrows per world unit (crest pitch = 1/0.55)
  const DENSITY = 0.5;          // expected plots per chunk
  const MIN_SPACING = 36;       // between plots within a chunk
  const PATCH_RADIUS = 20;      // dirt farmyard circle (covers the largest fence rect)
  const GATE_W = 2.7;           // fence gate opening
  // ── Persisted crop lifecycle (world-state demo) ──────────────────────────
  // One tiny record per PLOT (key = spawn.seed): { st, t }. The current stage
  // is DERIVED from the timestamp at read time — no server clock needed:
  //   no record            → ripe   (the deterministic default)
  //   picked   + <REGROW   → stubble (freshly cut)
  //   picked   + <+WITHER  → sprout  (needs water!)
  //   picked   + else      → dead
  //   cleared  + <WITHER   → sprout  (needs water!)
  //   watered  + <GROW     → growing
  //   watered  + else      → ripe
  // Untended records expire server-side after STATE_TTL_S → back to ripe.
  const REGROW_MS = 30 * 1000;    // picked → sprout
  const WITHER_MS = 180 * 1000;   // sprout unwatered → dead
  const GROW_MS = 90 * 1000;      // watered → ripe
  const STATE_TTL_S = 24 * 3600;  // server-side reset when nobody tends the plot
  // ──────────────────────────────────────────────────────────────────────────

  let registered = false;

  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher && window.THREE) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if ((window.XRPublisher && window.THREE) || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  // ── Custom terrain surface: tilled-soil (furrows + grain) ───────────────────
  function registerSurface(XRPublisher) {
    const T = XRPublisher.tsl;
    const { Fn, vec3, vec4, float, sin, mix, smoothstep, mx_noise_float } = T;
    XRPublisher.registerTerrainSurface({
      id: SURFACE_ID,
      fallbackColor: [0.34, 0.24, 0.14],   // brown soil (WebGL flat fallback)
      tsl: ({ localXZ, params, tint }) => Fn(() => {
        const scale = params.y.max(float(0.001));
        const p = localXZ.mul(scale);
        const u = p.x;                                       // along the furrows
        const v = p.y;                                       // across the furrows
        const furrow = sin(v.mul(6.2831853)).mul(0.5).add(0.5);
        const ridge = smoothstep(float(0.18), float(0.85), furrow);   // 0 trough → 1 crest
        const grain = mx_noise_float(vec3(u.mul(3.0), v.mul(12.0), 0.0)).mul(0.5).add(0.5);
        // Large-scale patchiness so a plot isn't one uniform brown.
        const patchy = mx_noise_float(vec3(u.mul(0.35), v.mul(0.35), 7.0)).mul(0.5).add(0.5);
        const trough = vec3(0.18, 0.12, 0.07);
        const crest = mix(vec3(0.40, 0.29, 0.18), vec3(0.33, 0.25, 0.16), patchy);
        const soil = mix(trough, crest, ridge).mul(grain.mul(0.3).add(0.8)).mul(tint);
        // Faint green sprouts catching the crest tops.
        const sprout = mx_noise_float(vec3(u.mul(20.0), v.mul(20.0), 3.0)).mul(0.5).add(0.5);
        const green = vec3(0.22, 0.34, 0.12);
        const col = mix(soil, green, ridge.mul(smoothstep(float(0.72), float(0.95), sprout)).mul(0.45));
        return vec4(col, float(0.96));
      })(),
    });
  }

  // ── Shared materials (module singletons — one set for every farm) ──────────
  function woodTexture(THREE) {
    const S = 128;
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    let s = 7;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    ctx.fillStyle = 'rgb(112,80,48)'; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 26; i++) {
      const y = rnd() * S;
      ctx.strokeStyle = `rgba(${rnd() < 0.5 ? '58,38,20' : '150,112,70'},${0.12 + rnd() * 0.2})`;
      ctx.lineWidth = 1 + rnd() * 1.5;
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= S; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 2.2);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  let MAT = null;
  function ensureMaterials(THREE) {
    if (MAT) return MAT;
    const std = (opts) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 1, metalness: 0 }, opts));
    MAT = {
      wood: std({ map: woodTexture(THREE), roughness: 0.92 }),
      woodDark: std({ color: 0x54381f, roughness: 0.95 }),
      hay: std({ color: 0xcfa552 }),
      wheat: std({ color: 0xd3a94e, side: THREE.DoubleSide }),
      wheatYoung: std({ color: 0x7ba341, side: THREE.DoubleSide }),   // growing stage
      deadStraw: std({ color: 0x77664a, side: THREE.DoubleSide }),    // withered crops
      leaf: std({ color: 0x4f7a2e, side: THREE.DoubleSide }),
      cabbage: std({ color: 0x84b05c, roughness: 0.9 }),
      pumpkin: std({ color: 0xc9722d, roughness: 0.8 }),
      straw: std({ color: 0xd8b96a }),
    };
    return MAT;
  }

  // ── Tiny material-slot mesh writer ──────────────────────────────────────────
  // Everything the farm emits goes through here → ONE BufferGeometry per
  // material slot (≈8 draw calls per plot instead of hundreds of meshes).
  function createWriter() {
    const slots = new Map();
    const bucket = (name) => {
      let b = slots.get(name);
      if (!b) { b = { p: [], n: [], uv: [], ix: [] }; slots.set(name, b); }
      return b;
    };

    // Parallelogram quad a→b→c→d (CCW seen from outside). UVs in world units
    // scaled by uvT so texture density is real distance, not per-quad 0..1.
    const quad = (name, a, b, c, d, uvT) => {
      const k = bucket(name); const base = k.p.length / 3;
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const il = 1 / (Math.hypot(nx, ny, nz) || 1); nx *= il; ny *= il; nz *= il;
      const eu = Math.hypot(ux, uy, uz);
      const ev = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
      const s = uvT || 1;
      for (const pt of [a, b, c, d]) { k.p.push(pt[0], pt[1], pt[2]); k.n.push(nx, ny, nz); }
      k.uv.push(0, 0, eu / s, 0, eu / s, ev / s, 0, ev / s);
      k.ix.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };

    // Rotation R = Ry(yaw)·Rx(pitch)·Rz(roll) as a row-major 3×3.
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

    // Axis-aligned box of size [w,h,d], rotated by (yaw,pitch,roll), centred at t.
    const box = (name, size, t, rot, uvT) => {
      const R = makeRot(rot && rot[0], rot && rot[1], rot && rot[2]);
      const x = size[0] / 2, y = size[1] / 2, z = size[2] / 2;
      const F = [
        [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]],        // +X
        [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]],    // −X
        [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]],        // +Y
        [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]],    // −Y
        [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]],        // +Z
        [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]],    // −Z
      ];
      for (const f of F) quad(name, xf(f[0], R, t), xf(f[1], R, t), xf(f[2], R, t), xf(f[3], R, t), uvT);
    };

    // Tapered cylinder (local axis Y, r0 bottom → r1 top), optional caps.
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
        // Side quad, wound so the normal faces OUT (bot i → bot j → top j → top i).
        quad(name, bot[j], bot[i], top[i], top[j], s);
      }
      if (caps) {
        const cTop = xf([0, h, 0], R, t), cBot = xf([0, -h, 0], R, t);
        for (let i = 0; i < seg; i++) {
          const j = (i + 1) % seg;
          const base = k.p.length / 3;
          // top fan (normal +Y before rotation)
          const nT = xf([0, 1, 0], R, [0, 0, 0]);
          for (const pt of [cTop, top[i], top[j]]) { k.p.push(pt[0], pt[1], pt[2]); k.n.push(nT[0], nT[1], nT[2]); }
          k.uv.push(0, 0, 1, 0, 1, 1);
          k.ix.push(base, base + 2, base + 1);
          const b2 = k.p.length / 3;
          const nB = xf([0, -1, 0], R, [0, 0, 0]);
          for (const pt of [cBot, bot[i], bot[j]]) { k.p.push(pt[0], pt[1], pt[2]); k.n.push(nB[0], nB[1], nB[2]); }
          k.uv.push(0, 0, 1, 0, 1, 1);
          k.ix.push(b2, b2 + 1, b2 + 2);
        }
      }
    };

    // Faceted low-poly blob (jittered icosahedron, flat-shaded) — the BotW
    // "round thing" primitive: pumpkins, cabbages, straw heads.
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

    return { quad, box, cyl, blob, build };
  }

  // ── Plan: every seeded decision, drawn in a FIXED order ─────────────────────
  function makePlan(rng) {
    const R = 7 + rng() * 3;                       // tilled circle radius
    const FX = R + 2 + rng() * 1.5;                // fence half-extent X
    const FZ = R + 2 + rng() * 1.5;                // fence half-extent Z
    const gateSide = ['n', 's', 'e', 'w'][rng() * 4 | 0];
    const focus = rng();                           // crop pick
    const crop = focus < 0.32 ? 'wheat' : focus < 0.56 ? 'pumpkin' : focus < 0.8 ? 'cabbage' : 'carrot';
    return {
      R, FX, FZ, gateSide, crop,
      bales: crop === 'wheat' ? 1 + (rng() * 2 | 0) : (rng() < 0.45 ? 1 : 0),
      scarecrow: rng() < 0.65,
      barrel: rng() < 0.55,
      crates: rng() < 0.45 ? 1 + (rng() * 3 | 0) : 0,
    };
  }

  // ── Fence: rectangular post-and-rail with a gate ────────────────────────────
  // Sides are axis-aligned; every rail's orientation is a single yaw (0 or
  // π/2) plus a slope roll following the ground — no stacked-euler surprises.
  // EVERYTHING is seated on the real terrain via `gy` (spawn.groundHeightAt):
  // posts root at their own ground height, rails slope between post tops, so
  // the fence follows a hillside instead of floating on the spawn plane.
  function buildFence(W, plan, rng, colliders, gy) {
    const { FX, FZ, gateSide } = plan;
    // side: run axis 'x'|'z', fixed coord of the other axis, outward sign.
    const sides = [
      { key: 'n', axis: 'x', at: -FZ, out: -1 },
      { key: 's', axis: 'x', at: FZ, out: 1 },
      { key: 'w', axis: 'z', at: -FX, out: -1 },
      { key: 'e', axis: 'z', at: FX, out: 1 },
    ];

    const post = (x, z, tall) => {
      const base = gy(x, z);
      const h = (tall ? 1.28 : 1.08) + rng() * 0.08;
      const lean = (rng() - 0.5) * 0.07;
      const leanDir = rng() * Math.PI * 2;
      // Buried 1.0 below its OWN ground height — a dip between height
      // samples can never open a gap under a post.
      W.box('wood', [0.14, h + 1.0, 0.14], [x, base + (h - 1.0) / 2, z],
        [leanDir, lean, 0], 1.1);
      if (tall) W.box('woodDark', [0.22, 0.07, 0.22], [x, base + h + 0.02, z], [0, 0, 0], 1);
      return base;
    };

    for (const s of sides) {
      const L = s.axis === 'x' ? FX : FZ;
      const hasGate = s.key === gateSide;
      // Post stations along the side, symmetric, ~2.5u pitch.
      const n = Math.max(2, Math.round((L * 2) / 2.5));
      const pitch = (L * 2) / n;
      const stations = [];
      for (let i = 0; i <= n; i++) stations.push(-L + i * pitch);

      // Split the side into runs around the gate gap (gap centred at 0).
      const runs = [];
      if (hasGate) {
        runs.push(stations.filter((u) => u <= -GATE_W / 2 + 0.01));
        runs.push(stations.filter((u) => u >= GATE_W / 2 - 0.01));
        // Flanking gate posts exactly at the gap edges (taller, capped).
        for (const gu of [-GATE_W / 2, GATE_W / 2]) {
          const [x, z] = s.axis === 'x' ? [gu, s.at] : [s.at, gu];
          post(x, z, true);
        }
      } else {
        runs.push(stations);
      }

      const yaw = s.axis === 'x' ? 0 : Math.PI / 2;
      // With yaw=π/2 the box's local +X maps to world −Z (the SMALLER u end),
      // so the ground-slope roll flips sign on the z-running sides.
      const rollSign = s.axis === 'x' ? 1 : -1;
      // Rails sit nailed to the OUTSIDE face of the posts.
      const off = 0.1 * s.out;
      const groundAt = (u) => (s.axis === 'x' ? gy(u, s.at) : gy(s.at, u));
      for (const run of runs) {
        // Ordinary posts (skip any station inside the gate gap).
        for (const u of run) {
          if (hasGate && Math.abs(u) < GATE_W / 2 - 0.01) continue;
          if (hasGate && (Math.abs(u - GATE_W / 2) < 0.15 || Math.abs(u + GATE_W / 2) < 0.15)) continue;
          const [x, z] = s.axis === 'x' ? [u, s.at] : [s.at, u];
          post(x, z, false);
        }
        // Two rails per bay, sloping between each post pair's ground heights.
        for (let i = 0; i + 1 < run.length; i++) {
          const u0 = run[i], u1 = run[i + 1];
          const y0 = groundAt(u0), y1 = groundAt(u1);
          const span = u1 - u0;
          const len = Math.hypot(span, y1 - y0) + 0.22;
          const roll = rollSign * Math.atan2(y1 - y0, span);
          const uc = (u0 + u1) / 2, ybase = (y0 + y1) / 2;
          for (const ry of [0.78, 0.42]) {
            const y = ybase + ry + (rng() - 0.5) * 0.05;
            const [x, z] = s.axis === 'x' ? [uc, s.at + off] : [s.at + off, uc];
            W.box('wood', [len, 0.09, 0.055], [x, y, z], [yaw, 0, roll + (rng() - 0.5) * 0.02], 1.1);
          }
        }
        // One thin collider per run (jumpable, blocks walking) — tall enough
        // to cover the ground swing along the run.
        if (run.length >= 2) {
          const u0 = run[0], u1 = run[run.length - 1];
          let lo = Infinity, hi = -Infinity;
          for (const u of run) { const gv = groundAt(u); lo = Math.min(lo, gv); hi = Math.max(hi, gv); }
          const halfY = 0.55 + (hi - lo) / 2;
          const half = [(u1 - u0) / 2 + 0.1, halfY, 0.12];
          const uc = (u0 + u1) / 2;
          const [x, z] = s.axis === 'x' ? [uc, s.at] : [s.at, uc];
          colliders.push({
            half: s.axis === 'x' ? half : [half[2], half[1], half[0]],
            position: [x, (lo + hi) / 2 + 0.55, z],
          });
        }
      }

      // Swung-open gate leaf hinged on one gate post, seated on the ground
      // at the hinge (the leaf is short, so one sample carries it).
      if (hasGate) {
        const hingeU = -GATE_W / 2;
        const leafYaw = yaw + (0.85 + rng() * 0.35) * (rng() < 0.5 ? 1 : -1);
        const leafLen = GATE_W * 0.92;
        // Leaf frame: two rails + three pickets, oriented by leafYaw around the hinge.
        const dx = Math.cos(leafYaw), dz = -Math.sin(leafYaw);
        const [hx, hz] = s.axis === 'x' ? [hingeU, s.at] : [s.at, hingeU];
        const hy = Math.max(gy(hx, hz), gy(hx + dx * leafLen, hz + dz * leafLen));
        for (const ry of [0.75, 0.38]) {
          W.box('woodDark', [leafLen, 0.08, 0.05],
            [hx + dx * leafLen / 2, hy + ry, hz + dz * leafLen / 2], [leafYaw, 0, 0], 1);
        }
        // Pickets hang from the top rail down to THEIR OWN ground point
        // (+0.12 burial), so the leaf never floats over a dip.
        for (let pi = 0; pi < 3; pi++) {
          const t = (pi + 0.5) / 3;
          const px2 = hx + dx * leafLen * t, pz2 = hz + dz * leafLen * t;
          const pg = gy(px2, pz2) - 0.12;
          const ph = Math.max(0.5, hy + 0.79 - pg);
          W.box('woodDark', [0.07, ph, 0.05],
            [px2, pg + ph / 2, pz2], [leafYaw, 0, 0], 1);
        }
      }
    }
  }

  // ── Crops planted on the furrow crest lines ─────────────────────────────────
  // Crest z (region-local == group-local) = (k + 0.25) / SURFACE_SCALE.
  // Every plant seats on its OWN ground height (gy) — the tilled surface
  // follows the terrain, so the plants must too.
  //
  // STAGE-AWARE: the same deterministic layout renders 5 ways —
  //   'ripe' (full, current look) · 'growing' (smaller, green) ·
  //   'sprout' (tiny leaf fans)   · 'stubble' (fresh-cut stalks) ·
  //   'dead' (withered brown).
  // Callers pass a DEDICATED rng (alea(seed + '-crops')) so a stage rebuild
  // is deterministic and never perturbs the fence/prop draws.
  function buildCrops(W, plan, rng, gy, stage) {
    const { R, crop } = plan;
    stage = stage || 'ripe';

    const pitch0 = 1 / SURFACE_SCALE;
    const kMax0 = Math.floor((R - 1) * SURFACE_SCALE);
    const rowsFor = () => {
      const out = [];
      for (let k = -kMax0 - 1; k <= kMax0; k++) {
        const z = (k + 0.25) * pitch0;
        if (Math.abs(z) < R - 1) out.push(z);
      }
      return out;
    };

    // Fresh-cut stubble: short golden crossed stalks along every crest row.
    if (stage === 'stubble') {
      for (const z of rowsFor()) {
        const xMax = Math.sqrt(Math.max(0, (R - 0.9) ** 2 - z * z));
        for (let x = -xMax; x <= xMax; x += 0.7) {
          if (rng() < 0.15) continue;
          const jx = x + (rng() - 0.5) * 0.2, jz = z + (rng() - 0.5) * 0.15;
          const y = gy(jx, jz) - 0.05;
          const a = rng() * Math.PI, w = 0.12, h = 0.16 + rng() * 0.08;
          for (const rot of [a, a + Math.PI / 2]) {
            const dx = Math.cos(rot) * w, dz = Math.sin(rot) * w;
            W.quad('wheat', [jx - dx, y, jz - dz], [jx + dx, y, jz + dz],
              [jx + dx * 0.6, y + h, jz + dz * 0.6], [jx - dx * 0.6, y + h, jz - dz * 0.6], 1);
          }
        }
      }
      return;
    }

    // Fresh sprouts: tiny green fans on the rows, waiting for water.
    if (stage === 'sprout') {
      for (const z of rowsFor()) {
        const xMax = Math.sqrt(Math.max(0, (R - 0.9) ** 2 - z * z));
        for (let x = -xMax; x <= xMax; x += 1.0) {
          if (rng() < 0.12) continue;
          const jx = x + (rng() - 0.5) * 0.3, jz = z + (rng() - 0.5) * 0.18;
          const y = gy(jx, jz) - 0.06;
          const blades = 2 + (rng() * 2 | 0);
          for (let b = 0; b < blades; b++) {
            const a = rng() * Math.PI * 2;
            const dx = Math.cos(a), dz = Math.sin(a);
            const l = 0.12, h = 0.1;
            W.quad('leaf',
              [jx - dz * 0.02, y + 0.02, jz + dx * 0.02], [jx + dz * 0.02, y + 0.02, jz - dx * 0.02],
              [jx + dx * l + dz * 0.01, y + h, jz + dz * l - dx * 0.01],
              [jx + dx * l - dz * 0.01, y + h, jz + dz * l + dx * 0.01], 1);
          }
        }
      }
      return;
    }

    // ripe / growing / dead share the full layout with stage modifiers.
    const grow = stage === 'growing' ? 0.55 : 1;
    const dead = stage === 'dead';
    const wheatSlot = dead ? 'deadStraw' : (stage === 'growing' ? 'wheatYoung' : 'wheat');
    const leafSlot = dead ? 'deadStraw' : 'leaf';
    const blobSlot = (normal) => (dead ? 'deadStraw' : normal);
    const rows = rowsFor();

    const wheatTuft = (x, y, z, sc) => {
      // Dead wheat droops: shorter, splayed wider.
      const h = (0.55 + rng() * 0.25) * sc * (dead ? 0.55 : 1);
      const w = 0.22 * sc * (dead ? 1.4 : 1);
      const a = rng() * Math.PI;
      for (const rot of [a, a + Math.PI / 2]) {
        const dx = Math.cos(rot) * w, dz = Math.sin(rot) * w;
        // Tapered blade quad: wide at the base, narrow at the tip.
        W.quad(wheatSlot,
          [x - dx, y, z - dz], [x + dx, y, z + dz],
          [x + dx * 0.35, y + h, z + dz * 0.35], [x - dx * 0.35, y + h, z - dz * 0.35], 1);
      }
    };
    const leafFan = (x, y, z, sc, mat) => {
      const blades = 3 + (rng() * 2 | 0);
      for (let b = 0; b < blades; b++) {
        const a = rng() * Math.PI * 2;
        const dx = Math.cos(a), dz = Math.sin(a);
        const l = 0.28 * sc, h = 0.22 * sc;
        W.quad(mat || 'leaf',
          [x - dz * 0.05, y + 0.02, z + dx * 0.05], [x + dz * 0.05, y + 0.02, z - dx * 0.05],
          [x + dx * l + dz * 0.02, y + h, z + dz * l - dx * 0.02],
          [x + dx * l - dz * 0.02, y + h, z + dz * l + dx * 0.02], 1);
      }
    };

    let rowIdx = 0;
    for (const z of rows) {
      rowIdx++;
      if (crop === 'pumpkin' && rowIdx % 2 === 0) continue;   // pumpkins skip rows
      const spacing = crop === 'wheat' ? 0.55 : crop === 'carrot' ? 0.85 : crop === 'cabbage' ? 1.15 : 1.7;
      const xMax = Math.sqrt(Math.max(0, (R - 0.9) ** 2 - z * z));
      for (let x = -xMax; x <= xMax; x += spacing) {
        if (rng() < 0.08) continue;                           // gaps read as hand-tended
        const jx = x + (rng() - 0.5) * spacing * 0.3;
        const jz = z + (rng() - 0.5) * 0.18;
        const sc = (0.8 + rng() * 0.4) * grow;
        const y = gy(jx, jz) - 0.08;                           // rooted just below grade
        if (crop === 'wheat') {
          wheatTuft(jx, y, jz, sc);
        } else if (crop === 'cabbage') {
          const cr = 0.3 * sc * (dead ? 0.7 : 1);
          W.blob(blobSlot('cabbage'), [jx, y + cr * (dead ? 0.5 : 0.87), jz], cr, dead ? 0.5 : 0.75, 0.12, rng);
        } else if (crop === 'carrot') {
          leafFan(jx, y, jz, sc, leafSlot);
        } else {                                               // pumpkin
          const pr = (0.32 + rng() * 0.16) * sc * (dead ? 0.7 : 1);
          W.blob(blobSlot('pumpkin'), [jx, y + pr * (dead ? 0.5 : 0.72), jz], pr, dead ? 0.5 : 0.72, 0.1, rng);
          W.box(leafSlot, [0.05, 0.14, 0.05], [jx, y + pr * 1.44 + 0.05, jz], [0, 0.2, rng() * Math.PI], 1);
          leafFan(jx + (rng() - 0.5) * 0.8, y, jz + (rng() - 0.5) * 0.5, sc * 1.3, leafSlot);
        }
      }
    }
  }

  // ── Props: bales, scarecrow, barrel, crates — all seated on real ground ────
  function buildProps(W, plan, rng, colliders, gy) {
    const { R, FX, FZ } = plan;

    // Yard corners (between the tilled circle and the fence) for ground props.
    const corners = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
    let ci = rng() * 4 | 0;
    const nextSpot = () => {
      const c = corners[ci++ % 4];
      const x = c[0] * (FX - 2.2) + (rng() - 0.5) * 1.4;
      const z = c[1] * (FZ - 2.2) + (rng() - 0.5) * 1.4;
      return [x, z, gy(x, z)];
    };

    for (let b = 0; b < plan.bales; b++) {
      const [x, z, gb] = nextSpot();
      const yaw = rng() * Math.PI;
      W.cyl('hay', 0.72, 0.72, 1.35, 12, [x, gb + 0.66, z], [yaw, 0, Math.PI / 2], true, 1);
      colliders.push({ half: [0.72, 0.68, 0.72], position: [x, gb + 0.66, z], rotation: [0, yaw, 0] });
    }

    if (plan.barrel) {
      const [x, z, gb] = nextSpot();
      W.cyl('woodDark', 0.32, 0.29, 0.95, 10, [x, gb + 0.37, z], [0, 0, 0], true, 1);
      W.cyl('wood', 0.335, 0.335, 0.08, 10, [x, gb + 0.18, z], [0, 0, 0], false, 1);
      W.cyl('wood', 0.335, 0.335, 0.08, 10, [x, gb + 0.62, z], [0, 0, 0], false, 1);
      colliders.push({ half: [0.32, 0.42, 0.32], position: [x, gb + 0.42, z] });
    }

    if (plan.crates > 0) {
      const [x, z, gb] = nextSpot();
      for (let c = 0; c < plan.crates; c++) {
        const s = 0.55 + rng() * 0.15;
        const yaw = (rng() - 0.5) * 0.6;
        const cy = gb - 0.06 + c * 0.62 + s / 2;
        W.box('wood', [s, s * 0.9, s], [x + (rng() - 0.5) * 0.15, cy, z + (rng() - 0.5) * 0.15], [yaw, 0, 0], 0.6);
      }
      colliders.push({ half: [0.4, plan.crates * 0.33, 0.4], position: [x, gb + plan.crates * 0.33 - 0.06, z] });
    }

    if (plan.scarecrow) {
      const sx = (rng() - 0.5) * R * 0.8;
      const sz = (rng() - 0.5) * R * 0.8;
      const gb = gy(sx, sz);
      const lean = (rng() - 0.5) * 0.1;
      const yaw = rng() * Math.PI * 2;
      W.box('woodDark', [0.09, 2.5, 0.09], [sx, gb + 0.85, sz], [yaw, lean, 0], 1);     // pole (buried 0.4)
      W.box('woodDark', [1.5, 0.08, 0.08], [sx, gb + 1.62, sz], [yaw, lean, 0], 1);     // arms
      W.blob('straw', [sx, gb + 2.02, sz], 0.26, 1.05, 0.1, rng);                       // head
      W.cyl('straw', 0.44, 0.44, 0.05, 8, [sx, gb + 2.24, sz], [0, 0.12, 0], true, 1);  // hat brim
      W.cyl('straw', 0.3, 0.1, 0.3, 8, [sx, gb + 2.4, sz], [0, 0.12, 0], false, 1);     // hat crown
      colliders.push({ half: [0.08, 1.1, 0.08], position: [sx, gb + 1.1, sz] });
    }
  }

  // ── Persisted crop lifecycle (world-state demo) ─────────────────────────────
  // Pure stage derivation from one record — exported on the spec (__test) so
  // harnesses can drive the full lifecycle table.
  function plotStage(v, now) {
    if (!v || typeof v !== 'object' || !v.st || typeof v.t !== 'number') return 'ripe';
    const age = now - v.t;
    if (v.st === 'picked') {
      if (age < REGROW_MS) return 'stubble';
      if (age < REGROW_MS + WITHER_MS) return 'sprout';
      return 'dead';
    }
    if (v.st === 'cleared') return age < WITHER_MS ? 'sprout' : 'dead';
    if (v.st === 'watered') return age < GROW_MS ? 'growing' : 'ripe';
    return 'ripe';
  }

  const PROMPTS = {
    ripe: 'Harvest crops',
    sprout: 'Water crops',
    dead: 'Clear dead crops',
    growing: 'Crops growing…',
    stubble: 'Freshly harvested',
  };
  // stage → the record an interaction writes (null = nothing to do yet)
  const NEXT_ON_INTERACT = { ripe: 'picked', sprout: 'watered', dead: 'cleared' };

  // seed → { farm, plan, spawn, gy, stage, region } for every mounted plot.
  const livePlots = new Map();
  // How long a chunk's fetched state stays fresh: re-entering a chunk within
  // this window costs zero HTTP (core serves the snapshot); after it, one
  // refetch picks up what other visitors did while you were away.
  const STATE_FRESH_MS = 45 * 1000;

  // Chunk prefix from a spawn.seed: strip the trailing `-gx-gz` cell coords
  // (both non-negative), leaving `${worldSeed}-decoration-farm-plots-cx-cz-`.
  const chunkPrefixOf = (seed) => {
    const a = seed.lastIndexOf('-');
    const b = seed.lastIndexOf('-', a - 1);
    return seed.slice(0, b + 1);
  };

  // ── Harvest inventory (local to this player, persisted per world) ──────────
  const CROP_META = {
    wheat: { icon: '🌾', label: 'Wheat' },
    pumpkin: { icon: '🎃', label: 'Pumpkins' },
    cabbage: { icon: '🥬', label: 'Cabbages' },
    carrot: { icon: '🥕', label: 'Carrots' },
  };

  // Per-stage soil tint on the tilled region — the ground tells the story too:
  // wet-dark while watered crops grow, ashen-dry when they die, normal otherwise.
  const SOIL_TINT = {
    growing: [0.55, 0.54, 0.60],
    dead: [1.16, 1.08, 0.92],
    sprout: [1.06, 1.02, 0.96],
  };

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || typeof XRPublisher.registerTerrainSurface !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime too old (no registerTerrainSurface)`);
      return;
    }
    registerSurface(XRPublisher);

    // Persisted state needs the worldState runtime API; without it the farm
    // registers exactly the old static spec (always-ripe crops).
    const HAS_STATE = typeof XRPublisher.setWorldState === 'function'
      && typeof XRPublisher.getWorldState === 'function'
      && typeof XRPublisher.subscribeWorldState === 'function';

    const deriveStage = (seed, now) => {
      if (!HAS_STATE) return 'ripe';
      const rec = XRPublisher.getWorldState(PLUGIN_ID, seed);
      return plotStage(rec ? rec.value : null, now || Date.now());
    };

    // Crops live in their OWN subgroup with a DEDICATED rng — stage rebuilds
    // are deterministic and never perturb the fence/prop layout.
    const cropRngFor = (seed) => {
      if (XRPublisher.utils && typeof XRPublisher.utils.alea === 'function') {
        return XRPublisher.utils.alea(seed + '-crops');
      }
      // Old-runtime fallback: tiny string-seeded LCG (still deterministic).
      let h = 2166136261;
      const s = seed + '-crops';
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      let st = h >>> 0 || 1;
      return () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
    };

    const buildCropGroup = (plan, seed, gy, stage) => {
      const W = createWriter();
      buildCrops(W, plan, cropRngFor(seed), gy, stage);
      const g = W.build(THREE, ensureMaterials(THREE));
      g.name = 'crops';
      return g;
    };

    // Stage-tinted soil: re-registering the region under the SAME id updates
    // the tint in place (the registry is keyed by id) — no remove/add churn.
    const applySoilTint = (entry, stage) => {
      const r = entry.region;
      if (!r) return;
      const tint = SOIL_TINT[stage] || [1, 1, 1];
      const cur = entry.soilTint || [1, 1, 1];
      if (tint[0] === cur[0] && tint[1] === cur[1] && tint[2] === cur[2]) return;
      entry.soilTint = tint;
      XRPublisher.addTerrainRegion(Object.assign({}, r, { tint }));
    };

    const rebuildCrops = (entry, newStage) => {
      const { farm, plan, spawn, gy } = entry;
      const old = farm.getObjectByName('crops');
      if (old) {
        // Hide now, dispose one frame later — never free a GPU buffer that
        // might still be in this frame's render pass (core's own pattern).
        old.visible = false;
        farm.remove(old);
        requestAnimationFrame(() => old.traverse((o) => { if (o.geometry) o.geometry.dispose(); }));
      }
      const fresh = buildCropGroup(plan, spawn.seed, gy, newStage);
      farm.add(fresh);
      // Static decorations are matrix-frozen after create() — freeze the new
      // subtree explicitly or it renders at identity.
      fresh.traverse((o) => { o.updateMatrix(); o.matrixAutoUpdate = false; });
      fresh.updateMatrixWorld(true);
      entry.stage = newStage;
      applySoilTint(entry, newStage);
    };

    // Time-derived transitions (growing→ripe, stubble→sprout, sprout→dead)
    // tick once a second — NOT via spec.update, which would make every farm
    // a per-frame dynamic object for something that changes once a minute.
    // The ticker only exists WHILE plots are mounted: it starts with the
    // first live plot and dissolves itself when the player leaves farm
    // country (livePlots empties) — zero idle work far from any farm.
    let tickerId = null;
    const ensureTicker = () => {
      if (tickerId !== null || livePlots.size === 0) return;
      tickerId = setInterval(() => {
        if (livePlots.size === 0) { clearInterval(tickerId); tickerId = null; return; }
        for (const [seed, entry] of livePlots) {
          const st = deriveStage(seed);
          if (st !== entry.stage) rebuildCrops(entry, st);
        }
      }, 1000);
    };

    if (HAS_STATE) {
      // Remote changes (chunk fetches, peers' interactions) → rebuild live plots.
      XRPublisher.subscribeWorldState((plugin, key) => {
        if (plugin !== PLUGIN_ID) return;
        const entry = livePlots.get(key);
        if (!entry) return;
        const st = deriveStage(key);
        if (st !== entry.stage) rebuildCrops(entry, st);
      });
    }

    // ── Harvest inventory: 🧺 HUD button + popup, per-crop-type counts ──────
    // LOCAL to this player (state records are shared world truth; what YOU
    // carried away is yours), persisted in localStorage per world key.
    const HAS_HUD = HAS_STATE && typeof XRPublisher.registerHud === 'function';
    let addToInventory = () => {};
    if (HAS_HUD) {
      const worldKey = (typeof XRPublisher.getWorldStateKey === 'function'
        ? XRPublisher.getWorldStateKey() : location.hostname);
      const INV_LS_KEY = `xrp-${PLUGIN_ID}-inventory-${worldKey}`;
      let inventory = {};
      try { inventory = JSON.parse(localStorage.getItem(INV_LS_KEY)) || {}; } catch (e) {}

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
      Object.assign(btn.style, PANEL_STYLE, {
        padding: '8px 14px', cursor: 'pointer', pointerEvents: 'auto', userSelect: 'none',
      });
      const popup = document.createElement('div');
      Object.assign(popup.style, PANEL_STYLE, {
        padding: '10px 14px', display: 'none', minWidth: '164px', pointerEvents: 'auto',
      });
      wrap.append(btn, popup);

      const total = () => Object.values(inventory).reduce((a, n) => a + n, 0);
      const renderHud = () => {
        btn.textContent = `🧺 ${total()}`;
        const rows = Object.keys(CROP_META)
          .filter((c) => inventory[c] > 0)
          .map((c) => `<div style="display:flex;justify-content:space-between;gap:14px;padding:2px 0">
            <span>${CROP_META[c].icon} ${CROP_META[c].label}</span><span>${inventory[c]}</span></div>`)
          .join('');
        popup.innerHTML = `<div style="font-size:12px;opacity:0.65;margin-bottom:6px">Harvested crops</div>${
          rows || '<div style="opacity:0.6;font-weight:400">Nothing yet — find a ripe plot and press E.</div>'}`;
      };
      btn.addEventListener('click', () => {
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
      });
      renderHud();
      XRPublisher.registerHud(`${PLUGIN_ID}-inventory`, wrap, 'top-right');

      addToInventory = (crop) => {
        if (!CROP_META[crop]) return;
        inventory[crop] = (inventory[crop] || 0) + 1;
        try { localStorage.setItem(INV_LS_KEY, JSON.stringify(inventory)); } catch (e) {}
        renderHud();
      };
    }

    const spec = {
      name: PLUGIN_ID,
      density: DENSITY,
      biomes: ['plains'],
      maxSlope: 0.06,             // fields want genuinely flat ground
      minWaterDistance: 8,
      minSpacing: MIN_SPACING,
      collision: true,            // explicit colliders via userData.xrColliders
      groundPatch: { radius: PATCH_RADIUS, color: [0.32, 0.24, 0.15], clearGrass: true },
      create(spawn) {
        const rng = spawn.rng;
        const plan = makePlan(rng);

        // renderPosition is render-frame world XZ — the frame regions paint
        // in — for every anchor type; no correction needed.
        const wx = spawn.renderPosition[0];
        const wz = spawn.renderPosition[2];
        const regionId = `${PLUGIN_ID}-${spawn.seed}`;
        const region = {
          id: regionId,
          center: [wx, wz],
          radius: plan.R + 0.5,
          surface: SURFACE_ID,
          scale: SURFACE_SCALE,
          mortar: 0.0,
          clearGrass: false,      // the spec groundPatch already clears the whole yard
        };
        XRPublisher.addTerrainRegion(region);

        // Ground sampler (relative to the object's origin plane) — seats every
        // post/plant/prop on the real terrain. Older runtimes: flat fallback.
        const gy = spawn.groundHeightAt || (() => 0);

        const W = createWriter();
        const colliders = [];
        buildFence(W, plan, rng, colliders, gy);
        buildProps(W, plan, rng, colliders, gy);

        const farm = W.build(THREE, ensureMaterials(THREE));
        farm.userData.__regionId = regionId;
        farm.userData.xrColliders = colliders;

        // Crops: separate subgroup, dedicated rng, built at the plot's CURRENT
        // persisted stage (sync snapshot read — the chunk fetch below fills
        // the snapshot; late-arriving state rebuilds via subscribeWorldState).
        const stage = deriveStage(spawn.seed);
        farm.add(buildCropGroup(plan, spawn.seed, gy, stage));

        if (HAS_STATE) {
          farm.userData.__plotSeed = spawn.seed;
          const entry = { farm, plan, spawn, gy, stage, region };
          livePlots.set(spawn.seed, entry);
          applySoilTint(entry, stage);
          ensureTicker();
          // State is checked ONLY here — when a chunk that actually contains
          // a plot mounts. maxAgeMs makes remounts free: the core serves the
          // snapshot without HTTP inside the window and coalesces concurrent
          // identical fetches, so N plots in one chunk cost one request and
          // roaming plot-free terrain costs zero.
          XRPublisher.fetchWorldState(PLUGIN_ID, {
            prefix: chunkPrefixOf(spawn.seed),
            maxAgeMs: STATE_FRESH_MS,
          }).catch(() => {});
        }
        return farm;
      },
      dispose(object) {
        const rid = object && object.userData && object.userData.__regionId;
        if (rid) XRPublisher.removeTerrainRegion(rid);
        const seed = object && object.userData && object.userData.__plotSeed;
        // GUARD BY IDENTITY, not by seed. The engine defers dispose() by one
        // frame (WebGPU buffer safety) while React runs the effect CLEANUP
        // before the new effect body — so a re-scatter of this chunk calls
        // create(new) BEFORE dispose(old) for the same seed. Deleting by seed
        // alone would evict the freshly-mounted plot and leave a dead pad.
        if (seed) {
          const held = livePlots.get(seed);
          if (held && held.farm === object) livePlots.delete(seed);
        }
        object.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      },
    };

    if (HAS_STATE) {
      // "E to interact" (desktop key + the mobile interact button): the one
      // action is contextual by stage — harvest ripe crops, water sprouts,
      // clear dead ones. Growing/stubble show a status prompt and do nothing.
      spec.interactable = true;
      spec.interactionRadius = 24;      // reach the plot from the fence line,
                                        // comfortably inside the server's 32u write radius
      spec.interactionPrompt = (spawn) => PROMPTS[deriveStage(spawn.seed)] || 'Farm plot';
      spec.onInteract = (ctx) => {
        const seed = ctx.spawn.seed;
        const stage = deriveStage(seed);
        const next = NEXT_ON_INTERACT[stage];
        if (!next) return;
        // Harvesting puts the crop in YOUR basket (the plot's shared state
        // just records that it was picked — by whom is local).
        if (next === 'picked') {
          const entry = livePlots.get(seed);
          if (entry) addToInventory(entry.plan.crop);
        }
        // Positions are RENDER-frame world XZ — renderPosition directly.
        const wx = ctx.spawn.renderPosition[0], wz = ctx.spawn.renderPosition[2];
        XRPublisher.setWorldState(PLUGIN_ID, seed, { st: next, t: Date.now() }, {
          pos: [wx, wz],
          ttlSeconds: STATE_TTL_S,
        });
        // The optimistic local apply fires subscribeWorldState → the plot
        // rebuilds immediately; peers and the API converge behind it.
      };
    }
    // Test hook: harnesses drive the pure stage machine through the lifecycle.
    spec.__test = { plotStage, PROMPTS, NEXT_ON_INTERACT, chunkPrefixOf };

    XRPublisher.registerDecoration(spec);

    registered = true;
    console.log(`[${PLUGIN_ID}] registered — seeded farmsteads (wheat/pumpkin/cabbage/carrot) in PLAINS${
      HAS_STATE ? ' + persisted crop lifecycle (E to water/harvest)' : ''}${
      HAS_HUD ? ' + 🧺 inventory' : ''}`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
