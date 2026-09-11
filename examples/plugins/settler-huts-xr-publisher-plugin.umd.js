/**
 * settler-huts — XR Publisher decoration plugin (WALK-IN HOMESTEADS, v3)
 *
 * Lone settler HOMESTEADS scattered on flat dry clearings in the wilds —
 * built entirely from the public API, with the SAME plan→compile
 * architecture as the town-center plugin (one shared building compiler,
 * hut-scale plans):
 *
 *   • cottage — one room, gable roof (shingle/shake/thatch), sometimes
 *               timber-framed plaster, shuttered windows
 *   • home    — two-room BSP interior with connecting doorways, furnished
 *               (bed, table, shelves), chimney, porch
 *   • barn    — red boards, wide open front with slid-open panels, hay bales
 *
 * WHAT MAKES THEM READ LIVED-IN (the v3 layer):
 *   • YARDS — 2-4 seeded props per hut inside the ground-patch clearing,
 *     emitted into the SAME merged writer + collider stream as the building
 *     (draw-call count barely moves): a firewood stack under a lean-to,
 *     a rough leaning fence run (a START of a fence, not a pen), a plank-edged
 *     vegetable patch with cabbage/pumpkin rows, a clothesline or drying rack.
 *     Yard variation runs on a DEDICATED `utils.alea(seed + '-yard')` stream so
 *     yard tuning never perturbs the building's own rng draws.
 *   • DOOR TRAILS — a short `addPath` footpath (~8-14u, seeded bend) from the
 *     ramp foot outward, using the `__doorLocal`/`__yaw` the compiler already
 *     returns. Path points come straight from `spawn.renderPosition` (render
 *     frame, no correction — the legacy `spawn.worldPosition` needed a
 *     −½-chunk shift and is deprecated); `removePath` runs in dispose.
 *   • HEARTHS — chimney huts bank a fire in the firebox: hearthstone, log
 *     pair, EMISSIVE ember blobs, and a stronger `glowHearth` window material.
 *     Emissive-only, NEVER a scene light (adding/removing lights recompiles
 *     every material in the world); embers pick up postFX bloom for free.
 *   • LOOTABLE STORES — a rain barrel (cottage/barn) or lidded chest (home)
 *     by the door, built as its OWN Object3D so `registerInteractable` can
 *     target just that sub-object (spec-level `interactable` would make the
 *     WHOLE hut one interactable). One-time loot per session (Set keyed by
 *     spawn.seed), seeded flavor text via `openDialog`, prompt is a FUNCTION
 *     that flips to "Empty barrel" after looting. `unregisterInteractable`
 *     in dispose. Both APIs feature-detected; without them the container is
 *     just decorative.
 *   • ABANDONED variant (seeded ~1 in 6) — no window glow (dark glass), no
 *     lantern, door missing or ajar, one gable slope collapsed (skeletal
 *     rafters + fallen planks inside, sky through the roof), weed tufts
 *     crowding the plinth, yard reduced to at most a stretch of fence, and
 *     no door trail (grown over). Known API gap: `groundPatch` is spec-level,
 *     so an abandoned hut can't flip `clearGrass:false` per spawn — the
 *     overgrowth is emitted as weed-blob geometry instead.
 *
 * Mechanics shared with town-center:
 *   • Semantic PLAN first (footprint, rooms, door in the widest gap, window
 *     stations that dodge wall junctions), then compilation through a
 *     material-slot MESH WRITER — ≈9 draw calls per building instead of one
 *     mesh per wall segment.
 *   • EXPLICIT colliders (`userData.xrColliders`): hand-authored cuboids for
 *     plinth, wall runs split at doorways, ramp, furniture, and yard props —
 *     interiors stay walkable while the visuals stay merged.
 *   • Furniture placement guard: nothing overlaps, nothing parks in a
 *     doorway (clear discs around the front door + every interior doorway),
 *     and beds stay out of the fireplace (hearth zone claimed up front).
 *   • Door leaves swing WIDE to the outward side; only ~15% of door
 *     lanterns burn (seeded), keeping the emissive/bloom budget honest.
 *   • Foundation skirt + raised plinth + entry ramp handle rolling ground.
 *
 * API surface exercised: registerDecoration (groundPatch, explicit colliders,
 * maxSlope/minWaterDistance/treeDistance filters, spawn.rng/seed determinism),
 * getWorldTowns (town exclusion), addPath/removePath, registerInteractable/
 * unregisterInteractable, openDialog, XRPublisher.utils.alea.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'settler-huts';
  const LANTERN_LIT = 0.15;       // fraction of door lanterns burning
  const ABANDONED_CHANCE = 1 / 6; // seeded fraction of huts left to the weeds
  const TRAIL_W = 1.7;            // door-trail width — a footpath, not a street
  const TRAIL_TINT = [1.06, 0.99, 0.85]; // warm packed-dirt shift on the road recipe
  let registered = false;

  // One-time loot per SESSION: chunk streaming remounts a hut deterministically,
  // so without this Set a player could farm the same barrel by walking away and
  // back. Keyed by spawn.seed (stable per world seed + chunk + index).
  const lootedSeeds = new Set();
  const LOOT_BARREL = [
    'A jar of preserved plums, the wax seal still good. You take it.',
    'Half a wheel of hard cheese wrapped in cloth. Still edible. Probably.',
    'A coil of decent hemp rope and three iron nails.',
    'Rainwater — and at the bottom, a small tin of pipe tobacco, bone dry.',
    'A stoppered clay bottle of something that smells like turpentine and burns like victory.',
    'Salted fish packed in straw. The cat of the house has clearly been at it.',
    'A honeycomb in an oiled sack, only slightly leaking into everything.',
    "Someone's hidden coin purse: four coppers and a button.",
  ];
  const LOOT_CHEST = [
    'A folded wool blanket with a letter tucked inside, unsigned.',
    'A hunting knife with a cracked antler handle. Sharp enough.',
    "A carved wooden horse — a child's toy, worn smooth with handling.",
    'A tin of beeswax candles and a striker.',
    'A deed to a plot of land three valleys over, water-stained beyond reading.',
    'A silver locket. The portrait inside has faded to a ghost.',
    'Woolen socks. Hand-knitted. Priceless out here.',
    'A small bag of seed grain, kept dry against spring.',
  ];
  // Seeded flavor pick — dedicated alea stream so it never touches spawn.rng.
  const lootFlavor = (seed, chest, utils) => {
    const list = chest ? LOOT_CHEST : LOOT_BARREL;
    const r = utils && utils.alea ? utils.alea(seed + '-loot')() : 0.5;
    return list[Math.min(list.length - 1, (r * list.length) | 0)];
  };

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
      // "hearth-lit" window variant: huts with a banked fire glow warmer and
      // stronger through the glass than the baseline candle-glow
      glowHearth: new THREE.MeshStandardMaterial({ color: 0x40220e, roughness: 0.4, metalness: 0, emissive: 0xffa050, emissiveIntensity: 1.05 }),
      // dead glass for the abandoned variant — dark, slightly reflective, NO emissive
      glassDark: new THREE.MeshStandardMaterial({ color: 0x1b2126, roughness: 0.35, metalness: 0 }),
      // banked-fire ember bed — emissive only (never a scene light); pops
      // under postFX bloom, still reads warm without it
      ember: new THREE.MeshStandardMaterial({ color: 0x1c0d06, roughness: 0.85, metalness: 0, emissive: 0xff5a1e, emissiveIntensity: 1.7 }),
      lantern: new THREE.MeshStandardMaterial({ color: 0x2a1c0c, roughness: 0.5, metalness: 0, emissive: 0xff9c3c, emissiveIntensity: 2.0 }),
      lanternOff: new THREE.MeshStandardMaterial({ color: 0x241a10, roughness: 0.6, metalness: 0 }),
      soil: flat(0x35281a, 1),      // tilled vegetable-patch earth
      weed: flat(0x6f7a42, 1),      // dry overgrowth tufts (abandoned huts)
      cloth: flat(0x7a4a3f, 1),
      hay: flat(0xcfa552, 1),
      pumpkin: flat(0xc9722d, 0.8),
      cabbage: flat(0x84b05c, 0.9),
      iron: flat(0x35322e, 0.7),
      water: new THREE.MeshStandardMaterial({ color: 0x27435a, roughness: 0.25, metalness: 0 }),
    };
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
    const { axis, at, out, y0, T, shutters, glassSlot } = cfg;
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
    // glass pane + cross mullion — the glass slot is a variant knob:
    // 'glow' (candle-lit), 'glowHearth' (fire banked inside), 'glassDark'
    // (abandoned — nobody home)
    P(uc, vc, [w, h, 0.05], 0, glassSlot || 'glow');
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
    // Door leaf — the leaf state is a seeded variant knob (cfg.doorMode):
    //   'normal'  — swung WIDE to the outward side (sign −out keeps −sin(open)
    //               on the `out` side of the wall; ~115-140°, nearly flat
    //               against the wall) so the doorway stays walkable
    //   'ajar'    — barely open (abandoned huts left half-shut in a hurry)
    //   'missing' — no leaf at all (scavenged long ago); jambs/header remain
    if (cfg.doorMode !== 'missing') {
      const swing = cfg.doorMode === 'ajar' ? (0.3 + rng() * 0.35) : (2.0 + rng() * 0.45);
      const open = swing * -out;
      const leafYaw = yaw + open;
      const dx = Math.cos(leafYaw), dz = -Math.sin(leafYaw);
      const [hx, hz] = wallPoint(axis, at, op.u0 + 0.03, out * (T / 2 + 0.03));
      W.box('plank2', [w * 0.94, h - 0.06, 0.07],
        [hx + dx * w * 0.47, y0 + h / 2 - 0.03, hz + dz * w * 0.47], [leafYaw, 0, 0], 1);
    }
    // door lantern on a bracket beside the door — only a seeded fraction of
    // them burn (bloom/emissive budget; a fully-lit town reads like a fair),
    // and NEVER on an abandoned hut (cfg.noLight)
    const lit = rng() < LANTERN_LIT && !cfg.noLight;
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
  function furnishRoom(W, room, rng, floorTop, cols, P) {
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

    // (A 'shop' furnishing kit lived here, carried over from the town-center
    // plugin. Wilderness huts are only ever homes/barns, so it was unreachable
    // and has been removed along with the `kind` argument that selected it.)

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
  // `skipSign` (1 | -1 | 0): collapse that slope — no slab/fascia, just three
  // sagging skeletal rafters left standing (abandoned variant).
  function emitGableRoof(W, o, L, Wd, top, rise, ov, roofSlot, gableSlot, skipSign) {
    const hz = Wd / 2, run = hz + ov;
    const ang = Math.atan2(rise, run), slope = Math.hypot(run, rise);
    for (const sign of [1, -1]) {
      if (sign === skipSign) {
        for (let i = 0; i < 3; i++) {
          const x = -L / 3 + i * (L / 3);
          W.box('timber', [0.13, 0.13, slope * 0.88], [x, top + rise / 2 - 0.08, sign * run / 2], [0, sign * (ang + 0.1), 0], 1.4);
        }
        continue;
      }
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

  // NOTE: hip and shed roof emitters lived here (carried over from the
  // town-center plugin). `makeHutPlan` only ever emits `roof: 'gable'`, so they
  // were unreachable and have been removed — add them back alongside a plan
  // that actually selects them if a new hut type ever needs one.

  // ── Homestead yard ──────────────────────────────────────────────────────────
  // 2-4 seeded props inside the ground-patch clearing, emitted into the SAME
  // writer/collider stream as the building — the merged draw-call count barely
  // moves. All coords are building-LOCAL (pre-yaw): the yard rotates with the
  // hut and every solid piece goes through the same bakeColliders pass.
  // `yr` is a DEDICATED alea(seed + '-yard') stream so yard tuning never
  // perturbs the building's own rng draws (rooms, furniture, roof, chimney).
  function emitYard(W, cols, o, yr, geom) {
    const { hw, hd, T, z1, doorX, doorW } = geom;
    const patchR = Math.max(4.2, (o.patchR || 6) - 0.5);
    const fits = (x, z, m) => Math.hypot(x, z) < patchR - m;

    // Feature draw — fixed evaluation order keeps this deterministic per seed.
    // Abandoned homesteads keep at most a stretch of fence; the yard died
    // with the hut.
    const chosen = [];
    if (o.abandoned) {
      if (yr() < 0.6) chosen.push('fence');
    } else {
      if (yr() < 0.9) chosen.push('firewood');
      if (yr() < 0.7) chosen.push('veg');
      if (yr() < 0.6) chosen.push(yr() < 0.55 ? 'clothesline' : 'rack');
      if (yr() < 0.6) chosen.push('fence');
      if (chosen.length < 2 && chosen.indexOf('firewood') < 0) chosen.push('firewood');
      if (chosen.length < 2) chosen.push('fence');
    }

    for (const feat of chosen) {
      if (feat === 'firewood') {
        // split-log rows under a lean-to plank against a side wall
        const side = yr() < 0.5 ? -1 : 1;
        const fx = side * (hw + T + 1.0);
        const fz = (yr() - 0.5) * hd * 1.3;
        if (!fits(fx, fz, 1.3)) continue;
        const rows = [4, 3, 2];   // stacked pyramid, ends facing out
        for (let r = 0; r < rows.length; r++) {
          for (let i = 0; i < rows[r]; i++) {
            const lz = fz - (rows[r] - 1) * 0.15 + i * 0.3;
            W.cyl('timber', 0.13, 0.13, 0.95, 7, [fx + (yr() - 0.5) * 0.06, 0.14 + r * 0.24, lz], [0, 0, Math.PI / 2], true, 0.8);
          }
        }
        for (const pz of [fz - 0.85, fz + 0.85]) {
          W.box('timber', [0.1, 1.15, 0.1], [fx + side * 0.55, 0.55, pz], [0, 0, side * 0.05], 1);
        }
        // roof plank dips away from the wall onto the posts
        W.box('plank2', [1.6, 0.06, 1.95], [fx + side * 0.12, 1.24, fz], [0, 0, -side * 0.3], 1.4);
        cols.push({ half: [0.75, 0.7, 1.0], position: [fx, 0.7, fz] });
      } else if (feat === 'veg') {
        // plank-edged vegetable patch — try beside the ramp, else out back
        const cands = [
          [doorX - (doorW / 2 + 3.0), z1 + 2.2 + yr() * 1.0],
          [doorX + (doorW / 2 + 3.2), z1 + 2.2 + yr() * 1.0],
          [-(hw + T + 1.9), -hd * 0.4],
        ];
        let vp = null;
        for (const c of cands) if (fits(c[0], c[1], 1.6)) { vp = c; break; }
        if (!vp) continue;
        const [vx, vz] = vp;
        W.box('soil', [2.5, 0.16, 1.8], [vx, 0.04, vz], [0, 0, 0], 1.6);
        for (const s of [1, -1]) {
          W.box('timber', [2.6, 0.14, 0.07], [vx, 0.12, vz + s * 0.93], [0, 0, 0], 1);
          W.box('timber', [0.07, 0.14, 1.9], [vx + s * 1.3, 0.12, vz], [0, 0, 0], 1);
        }
        for (let r = 0; r < 2; r++) {
          const crop = yr() < 0.55 ? 'cabbage' : 'pumpkin';   // one crop per row
          for (let i = 0; i < 3; i++) {
            W.blob(crop, [vx - 0.8 + i * 0.8, 0.22, vz - 0.45 + r * 0.9],
              (crop === 'pumpkin' ? 0.2 : 0.16) + yr() * 0.07, 0.75, 0.15, yr);
          }
        }
      } else if (feat === 'clothesline') {
        // two posts + taut line + a couple of hung cloths, out back
        const bx = (yr() - 0.5) * hw * 0.9;
        const bz = -(hd + T + 1.3);
        if (!fits(bx, bz, 1.6)) continue;
        for (const s of [1, -1]) W.box('timber', [0.09, 1.95, 0.09], [bx + s * 1.35, 0.92, bz], [0, 0, s * 0.04], 1);
        W.box('iron', [2.7, 0.03, 0.03], [bx, 1.78, bz], [0, 0, 0], 1);
        const n = 2 + (yr() * 2 | 0);
        for (let i = 0; i < n; i++) {
          const cx = bx - 0.9 + yr() * 1.8;
          W.box('cloth', [0.45 + yr() * 0.2, 0.55 + yr() * 0.25, 0.03], [cx, 1.48, bz], [(yr() - 0.5) * 0.15, 0, (yr() - 0.5) * 0.1], 1);
        }
      } else if (feat === 'rack') {
        // A-frame drying rack: crossed leg pairs + three rails + draped cloth
        const bx = (yr() - 0.5) * hw * 0.9;
        const bz = -(hd + T + 1.2);
        if (!fits(bx, bz, 1.3)) continue;
        for (const s of [1, -1]) {
          W.box('timber', [0.09, 1.5, 0.09], [bx + s * 0.85, 0.72, bz - 0.18], [0.22, 0, 0], 1);
          W.box('timber', [0.09, 1.5, 0.09], [bx + s * 0.85, 0.72, bz + 0.18], [-0.22, 0, 0], 1);
        }
        for (const ry of [0.55, 0.95, 1.32]) W.box('plank', [1.9, 0.06, 0.06], [bx, ry, bz], [0, 0, 0], 1);
        W.box('cloth', [0.7, 0.5, 0.04], [bx - 0.3, 1.06, bz + 0.03], [0, 0, 0.05], 1);
        cols.push({ half: [0.95, 0.7, 0.15], position: [bx, 0.7, bz] });
      } else {
        // 2-4 leaning post+rail fence sections wandering off the front corner —
        // deliberately NOT enclosing anything; sections that would leave the
        // clearing just stop (the fence was never finished)
        const fside = yr() < 0.5 ? -1 : 1;
        const a = (fside > 0 ? 0 : Math.PI) + (yr() - 0.5) * 0.6;
        const dirX = Math.cos(a), dirZ = -Math.sin(a);   // writer yaw: local X → (cos a, −sin a)
        let px = doorX + fside * (doorW / 2 + 2.4);
        let pz = z1 + 2.8 + yr() * 1.2;
        const sections = 2 + (yr() * 3 | 0);
        let built = 0;
        for (let s = 0; s < sections; s++) {
          const cx = px + dirX, cz = pz + dirZ;
          if (!fits(cx, cz, 0.9)) break;
          W.box('timber', [0.09, 1.05 - yr() * 0.12, 0.09], [px, 0.48, pz], [a, 0, (yr() - 0.5) * 0.24], 1);
          for (const ry of [0.52, 0.86]) {
            W.box('plank2', [2.05, 0.09, 0.05], [cx, ry + (yr() - 0.5) * 0.08, cz], [a, 0, (yr() - 0.5) * 0.06], 1.2);
          }
          cols.push({ half: [1.0, 0.5, 0.08], position: [cx, 0.5, cz], rotation: [0, a, 0] });
          px += dirX * 2.0; pz += dirZ * 2.0; built++;
        }
        // end post caps the last standing section
        if (built) W.box('timber', [0.09, 1.0, 0.09], [px, 0.46, pz], [a, 0, (yr() - 0.5) * 0.24], 1);
      }
    }
  }

  // Lootable container: rain barrel or lidded chest. Deliberately its OWN
  // Object3D (not merged into the writer) so registerInteractable can target
  // just this sub-object — spec-level `interactable` would make the WHOLE hut
  // one interactable. Per-spawn geometry is tiny and freed by the dispose
  // traverse; all materials are the shared MATS singletons.
  function buildLootContainer(THREE, chest, x, z, rng) {
    const M = ensureMats(THREE);
    const g = new THREE.Group();
    const add = (geo, mat, y) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.y = y;
      m.castShadow = true; m.receiveShadow = true;
      g.add(m); return m;
    };
    if (chest) {
      add(new THREE.BoxGeometry(0.9, 0.5, 0.55), M.plank2, 0.25);
      add(new THREE.BoxGeometry(0.96, 0.16, 0.6), M.timber, 0.56);
      add(new THREE.BoxGeometry(0.1, 0.2, 0.06), M.iron, 0.44).position.z = 0.28;
    } else {
      add(new THREE.CylinderGeometry(0.3, 0.34, 0.85, 10), M.plank2, 0.425);
      add(new THREE.CylinderGeometry(0.34, 0.345, 0.05, 10), M.iron, 0.2);    // hoops
      add(new THREE.CylinderGeometry(0.325, 0.33, 0.05, 10), M.iron, 0.62);
      add(new THREE.CylinderGeometry(0.305, 0.305, 0.06, 10), M.plank, 0.86); // lid
    }
    g.position.set(x, 0, z);
    g.rotation.y = (rng() - 0.5) * 0.8;
    return g;
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

    // Chimney station is chosen BEFORE furnishing so the guard can keep beds
    // out of the fireplace — the hearth needs ~1u of clear floor in front.
    let chimPos = null;
    if (o.chimney) {
      chimPos = [(rng() < 0.5 ? -1 : 1) * (hw - 0.75), (rng() < 0.5 ? -1 : 1) * (hd - 0.9)];
      if (o.hearth) guard.claim(chimPos[0] - Math.sign(chimPos[0]) * 0.55, chimPos[1], 1.1, 0.9);
    }

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
      const cfg = {
        axis: wd.axis, at: wd.at, out: wd.out, u0: wd.u0, u1: wd.u1, H, T, y0: FLOOR_TOP, bands, openings,
        // variant knobs (see emitWindow/emitDoor): hearth-lit glass, dead
        // glass + missing/ajar door + unlit lantern on abandoned huts
        glassSlot: o.glassSlot, doorMode: o.doorMode, noLight: o.noLight,
      };
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
      for (const room of rooms) {
        furnishRoom(W, room, rng, FLOOR_TOP, cols, guard);
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

    // Abandoned huts may lose one whole gable slope — the roof caves toward
    // ±Z, so the ceiling slab goes with it (sky shows through the rafters);
    // the exposed beams stay as the skeleton.
    const collapseSide = (o.abandoned && (!o.roof || o.roof === 'gable') && rng() < 0.75)
      ? (rng() < 0.5 ? 1 : -1) : 0;

    // Ceiling + exposed beams (barn is open to the rafters).
    if (!o.barn) {
      if (!collapseSide) W.box('ceiling', [Wid + T, 0.08, D + T], [0, FLOOR_TOP + H - 0.04, 0], [0, 0, 0], 2.4);
      const nBeams = Math.max(2, Math.round(Wid / 3.2));
      for (let i = 1; i < nBeams; i++) {
        W.box('timber', [0.16, 0.2, D + T], [-hw + i * Wid / nBeams, FLOOR_TOP + H - 0.16, 0], [0, 0, 0], 1.4);
      }
    }

    // Roof.
    const top = FLOOR_TOP + H, rise = o.rise || 2.0;
    const L = Wid + T * 2, Wd = D + T * 2, ov = o.barn ? 0.5 : 0.55;
    const gableSlot = o.gableSlot || (o.timber ? 'plank' : o.wallSlot);
    // Gable only — every plan makeHutPlan produces is `roof: 'gable'`.
    emitGableRoof(W, o, L, Wd, top, rise, ov, o.roofSlot, gableSlot, collapseSide);

    // SHELTER COLLIDER. The engine's `sheltered` flag (Player.jsx — what the
    // weather plugin gates ALL rain on) is a rapier ray cast straight UP: it
    // sees COLLIDERS, not visuals. The ceiling/roof boxes above are visual
    // geometry only, so without this slab the ray exits through the roof and
    // it rains inside the hut. One thin cuboid across the footprint (+eaves
    // overhang) at ceiling height — roof line for barns, which are open to
    // the rafters. Collapsed abandoned roofs deliberately get NONE: rain
    // falling through the caved-in gable is correct.
    if (!collapseSide) {
      cols.push({
        half: [(Wid + T * 2) / 2 + ov, 0.06, (D + T * 2) / 2 + ov],
        position: [0, o.barn ? top + 0.1 : FLOOR_TOP + H - 0.04, 0],
      });
    }

    // The fallen slope: roofing planks dropped across the floor inside, plus
    // one rafter leaning down from the wall plate.
    if (collapseSide) {
      const n = 4 + (rng() * 3 | 0);
      for (let i = 0; i < n; i++) {
        W.box(rng() < 0.6 ? 'plank2' : o.roofSlot, [0.3 + rng() * 0.3, 0.06, 1.5 + rng() * 1.1],
          [(rng() - 0.5) * (Wid - 2), FLOOR_TOP + 0.16 + rng() * 0.1, collapseSide * (0.2 + rng() * 0.5) * hd],
          [rng() * Math.PI, (rng() - 0.5) * 0.5, (rng() - 0.5) * 0.35], 1.2);
      }
      W.box('timber', [0.14, 0.14, Math.min(D * 0.8, 4)],
        [(rng() - 0.5) * (Wid - 3), FLOOR_TOP + H * 0.4, collapseSide * hd * 0.3],
        [0, collapseSide * 0.9, 0], 1.4);
    }

    // Chimney (stone, capped) against a side wall — station chosen up top so
    // the furniture guard already kept this floor clear.
    if (o.chimney) {
      const cx = chimPos[0], cz = chimPos[1];
      const topY = top + rise + 0.9;
      const chimH = topY - FLOOR_TOP;
      W.box('stone', [0.7, chimH, 0.7], [cx, FLOOR_TOP + chimH / 2, cz], [0, 0, 0], 2);
      W.box('stoneDark', [0.95, 0.18, 0.95], [cx, topY + 0.09, cz], [0, 0, 0], 2);
      cols.push({ half: [0.35, chimH / 2, 0.35], position: [cx, FLOOR_TOP + chimH / 2, cz] });
      // Hearth: lived-in chimney huts keep a fire banked in the firebox —
      // hearthstone slab, a dark firebox mouth, EMISSIVE ember blobs, and a
      // pair of logs. Emissive materials only, never a scene light (adding or
      // removing a light recompiles every material in the world); the window
      // glass on these huts is the stronger 'glowHearth' variant to match.
      if (o.hearth) {
        const inX = -Math.sign(cx);   // toward the room centre
        W.box('stoneDark', [1.15, 0.1, 1.2], [cx + inX * 0.5, FLOOR_TOP + 0.05, cz], [0, 0, 0], 2);
        W.box('iron', [0.06, 0.95, 0.78], [cx + inX * 0.37, FLOOR_TOP + 0.55, cz], [0, 0, 0], 1);
        for (let i = 0; i < 3; i++) {
          W.blob('ember', [cx + inX * (0.48 + rng() * 0.14), FLOOR_TOP + 0.14, cz + (rng() - 0.5) * 0.34],
            0.11 + rng() * 0.05, 0.5, 0.3, rng);
        }
        W.cyl('timber', 0.07, 0.07, 0.55, 6, [cx + inX * 0.52, FLOOR_TOP + 0.24, cz - 0.1], [0, Math.PI / 2, 0], true, 1);
        W.cyl('timber', 0.06, 0.06, 0.5, 6, [cx + inX * 0.58, FLOOR_TOP + 0.2, cz + 0.14], [0.5, Math.PI / 2, 0], true, 1);
      }
    }

    // Porch awning on posts over the door.
    if (o.porch && !o.barn) {
      const pw = Math.min(Wid * 0.6, doorW + 2.6), pd = 1.9, ph = Math.min(H - 0.3, 2.7);
      for (const px of [doorX - pw / 2 + 0.14, doorX + pw / 2 - 0.14]) {
        W.box('timber', [0.16, ph, 0.16], [px, FLOOR_TOP + ph / 2, z1 + pd - 0.14], [0, 0, 0], 1);
        cols.push({ half: [0.09, ph / 2, 0.09], position: [px, FLOOR_TOP + ph / 2, z1 + pd - 0.14] });
      }
      W.box(o.roofSlot, [pw + 0.4, 0.12, pd + 0.5], [doorX, FLOOR_TOP + ph + 0.14, z1 + pd / 2], [0, -0.16, 0], 2.4);
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

    // Yard: 2-4 seeded homestead props inside the ground-patch clearing,
    // merged into the same writer + collider stream (see emitYard).
    if (o.yardRng) emitYard(W, cols, o, o.yardRng, { hw, hd, T, z1, doorX, doorW });

    // Abandoned: the clearing is being reclaimed — weed tufts crowd the
    // plinth and sprout through the ramp seams. (API gap: `groundPatch` is
    // spec-level, so we can't flip clearGrass:false per spawn; the overgrown
    // look is emitted as geometry instead.)
    if (o.abandoned) {
      const n = 10 + (rng() * 6 | 0);
      for (let i = 0; i < n; i++) {
        const a = rng() * Math.PI * 2;
        const rr = maxHalf + 0.9 + rng() * 2.4;
        W.blob('weed', [Math.cos(a) * rr, 0.06 + rng() * 0.08, Math.sin(a) * rr],
          0.2 + rng() * 0.22, 0.5 + rng() * 0.25, 0.35, rng);
      }
      for (let i = 0; i < 3; i++) {
        W.blob('weed', [doorX + (rng() - 0.5) * doorW, 0.1, z1 + 0.8 + rng() * 1.6],
          0.16 + rng() * 0.12, 0.5, 0.3, rng);
      }
    }

    // Lootable container beside the ramp foot: rain barrel (cottage/barn) or
    // lidded chest (home). Its collider joins `cols` BEFORE baking so it gets
    // the same yaw treatment as everything else.
    let loot = null;
    if (o.loot) {
      const lx = doorX + doorW / 2 + 1.3, lz = z1 + 0.7;
      loot = buildLootContainer(THREE, o.loot === 'chest', lx, lz, rng);
      cols.push(o.loot === 'chest'
        ? { half: [0.5, 0.35, 0.35], position: [lx, 0.35, lz] }
        : { half: [0.4, 0.5, 0.4], position: [lx, 0.5, lz] });
    }

    const yaw = faceAngle + (rng() - 0.5) * 0.15;
    const g = W.build(THREE, ensureMats(THREE));
    if (loot) { g.add(loot); g.userData.__loot = loot; }
    g.rotation.y = yaw;
    g.userData.xrColliders = bakeColliders(THREE, cols, yaw);
    // Door/ramp-foot in LOCAL coords + the final yaw — callers use this to
    // start a walking path exactly where the ramp meets the ground.
    g.userData.__doorLocal = [doorX, rampFootZ];
    g.userData.__yaw = yaw;
    return g;
  }

  // ── Hut-scale plans (same option shape the compiler consumes) ──────────────
  function makeHutPlan(rng, type) {
    const pick = (a) => a[rng() * a.length | 0];
    if (type === 'cottage') {
      const timber = rng() < 0.5;
      return { W: 5.6 + rng() * 1.6, D: 4.8 + rng() * 1.4, H: 3.0 + rng() * 0.3, rise: 1.5 + rng() * 0.5,
        roof: 'gable', roofSlot: pick(['shingleRed', 'shake', 'thatch']),
        wallSlot: timber ? pick(['plaster', 'plaster2']) : pick(['plank', 'plank2']), innerSlot: 'plank',
        timber, shutters: true, roomDepth: 1, minRoom: 3.2,
        chimney: rng() < 0.45, porch: rng() < 0.25 };
    }
    if (type === 'home') {
      return { W: 9 + rng() * 2, D: 6.5 + rng() * 1.5, H: 3.4 + rng() * 0.4, rise: 1.9 + rng() * 0.6,
        roof: 'gable', roofSlot: pick(['shingleBlue', 'shingleRed', 'thatch']),
        wallSlot: pick(['plaster', 'plaster2', 'plank']), innerSlot: 'plank',
        timber: true, shutters: true, roomDepth: 2, minRoom: 3.6,
        chimney: rng() < 0.7, porch: rng() < 0.5 };
    }
    // barn
    return { W: 7.5 + rng() * 2, D: 5.6 + rng() * 1.5, H: 3.8 + rng() * 0.5, rise: 2.2 + rng() * 0.6,
      roof: 'gable', roofSlot: 'shake', wallSlot: 'barn', gableSlot: 'barn', barn: true };
  }

  function normalizePlan(o) {
    if (o.bands) for (const b of o.bands) b.v1 = Math.min(b.v1, o.H);
    return o;
  }

  function registerType(XRPublisher, THREE, type, opts, env) {
    const { isNearTown, hasPaths, hasLoot, utils } = env;
    XRPublisher.registerDecoration({
      name: `settler-${type}`,
      density: opts.density,
      minSpacing: opts.minSpacing,
      maxSlope: 0.10,                 // flat ground only — keeps terrain off the floor
      minWaterDistance: 12,           // dry footing
      collision: true,                // explicit colliders via userData.xrColliders
      groundPatch: { radius: opts.patch, color: [0.40, 0.34, 0.26], clearGrass: true },
      create(spawn) {
        if (spawn.treeDistance < 6) return null;     // don't bury a trunk in a wall
        // Stay OUT of engine towns — the town-center plugin packs its own
        // buildings there and a wilderness hut would overlap them.
        if (isNearTown(spawn.renderPosition[0], spawn.renderPosition[2])) return null;
        const rng = spawn.rng;
        // Variant knobs FIRST, in fixed order — the rng draw sequence per
        // seed must never depend on runtime conditions (determinism).
        const abandoned = rng() < ABANDONED_CHANCE;
        // face a random cardinal-ish direction (wilderness huts don't face a plaza)
        const faceAngle = (rng() * 4 | 0) * (Math.PI / 2) + (rng() - 0.5) * 0.3;
        const plan = normalizePlan(makeHutPlan(rng, type));
        plan.abandoned = abandoned;
        plan.hearth = !!plan.chimney && !abandoned;
        plan.glassSlot = abandoned ? 'glassDark' : (plan.hearth ? 'glowHearth' : 'glow');
        plan.doorMode = abandoned ? (rng() < 0.5 ? 'missing' : 'ajar') : 'normal';
        plan.noLight = abandoned;
        plan.patchR = opts.patch;
        // Dedicated yard stream — yard tuning can't shift the building draws.
        plan.yardRng = utils && utils.alea ? utils.alea(spawn.seed + '-yard') : rng;
        // The container ALWAYS builds when the hut is lived-in (seeded state
        // only — a runtime condition here would shift the rng draws that
        // follow it and desync layouts across runtime versions). Whether it
        // becomes interactive is decided below by feature detection.
        plan.loot = abandoned ? null : (type === 'home' ? 'chest' : 'barrel');
        const g = buildBuilding(THREE, plan, rng, faceAngle);

        // Door trail: a short footpath from the ramp foot outward (~8-14u
        // with a seeded bend) — same __doorLocal/__yaw handshake the
        // town-center plugin uses. spawn.renderPosition is the render frame
        // addPath draws in — no correction needed.
        // Abandoned huts get NO trail (it grew over years ago).
        if (hasPaths && !abandoned && g.userData.__doorLocal) {
          const [dlx, dlz] = g.userData.__doorLocal;
          const yaw2 = g.userData.__yaw;
          const cy = Math.cos(yaw2), sy = Math.sin(yaw2);
          const doorWX = spawn.renderPosition[0] + dlx * cy + dlz * sy;
          const doorWZ = spawn.renderPosition[2] - dlx * sy + dlz * cy;
          const ox = sy, oz = cy;                     // outward door normal (local +Z, yawed)
          const len = 8 + rng() * 6;
          const bend = (rng() - 0.5) * 0.8;           // trails wander; roads don't
          const cb = Math.cos(bend), sb = Math.sin(bend);
          const bx = ox * cb + oz * sb, bz = -ox * sb + oz * cb;
          const mx = doorWX + ox * len * 0.45, mz = doorWZ + oz * len * 0.45;
          const id = XRPublisher.addPath({
            id: `settler-trail-${spawn.seed}`, width: TRAIL_W, tint: TRAIL_TINT,
            points: [[doorWX, doorWZ], [mx, mz], [mx + bx * len * 0.55, mz + bz * len * 0.55]],
          });
          if (id) g.userData.__pathId = id;
        }

        // Searchable store: register the barrel/chest sub-object as its own
        // interactable (id keyed by spawn.seed so dispose can unregister and
        // the session loot Set survives chunk streaming). Without the
        // interactable/dialog APIs the container stays purely decorative.
        if (g.userData.__loot && hasLoot) {
          const seed = spawn.seed;
          const chest = plan.loot === 'chest';
          const lootId = `settler-loot-${seed}`;
          const title = chest ? 'Old chest' : 'Rain barrel';
          XRPublisher.registerInteractable({
            id: lootId,
            object: g.userData.__loot,
            radius: 2.5,
            // prompt is a FUNCTION — re-resolved ~10Hz, so it flips to
            // "Empty …" the moment the loot is taken. Keep it a Set lookup.
            prompt: () => lootedSeeds.has(seed)
              ? (chest ? 'Empty chest' : 'Empty barrel')
              : (chest ? 'Open chest' : 'Search barrel'),
            onInteract: () => {
              if (lootedSeeds.has(seed)) {
                XRPublisher.openDialog({
                  title,
                  content: 'Empty. Someone — probably you — already cleaned it out.',
                  buttons: [{ label: 'Close' }],
                });
                return;
              }
              lootedSeeds.add(seed);
              XRPublisher.openDialog({
                title,
                content: lootFlavor(seed, chest, utils),
                buttons: [{ label: 'Take it', variant: 'primary' }],
              });
            },
          });
          g.userData.__lootId = lootId;
        }
        return g;
      },
      dispose(object) {
        const ud = (object && object.userData) || {};
        if (ud.__pathId && typeof XRPublisher.removePath === 'function') XRPublisher.removePath(ud.__pathId);
        if (ud.__lootId && typeof XRPublisher.unregisterInteractable === 'function') XRPublisher.unregisterInteractable(ud.__lootId);
        object.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      },
    });
  }

  const init = async () => {
    if (registered) return;
    await waitForRuntime();
    const { XRPublisher, THREE } = window;
    if (!XRPublisher || !THREE) { console.error(`[${PLUGIN_ID}] runtime not available`); return; }

    // Town exclusion: keep wilderness huts out of engine towns (the
    // town-center plugin packs its own buildings there — a hut would overlap
    // them). getWorldTowns returns WORKER-frame coords — convert once to the
    // render frame (−½ chunk on X and Z, dims from the terrain block attrs)
    // so they compare directly against spawn.renderPosition.
    const tEl = document.querySelector('three-terrain-block');
    const CHUNK_W = (tEl && parseFloat(tEl.getAttribute('width'))) || 100;
    const CHUNK_H = (tEl && parseFloat(tEl.getAttribute('height'))) || 100;
    const TOWN_EXCLUDE = 105;
    const towns = [];                 // render-frame town centres
    const townKeys = new Set();
    const isNearTown = (rx, rz) => {
      for (const t of towns) {
        if ((t.x - rx) ** 2 + (t.z - rz) ** 2 < TOWN_EXCLUDE * TOWN_EXCLUDE) return true;
      }
      return false;
    };
    if (typeof XRPublisher.getWorldTowns === 'function') {
      const refresh = async () => {
        const po = window.currentScene && window.currentScene.getObjectByName && window.currentScene.getObjectByName('playerOne');
        const p = po ? po.getWorldPosition(new THREE.Vector3()) : { x: 0, z: 0 };
        let found;
        try {
          found = await XRPublisher.getWorldTowns({ minX: p.x - 3500, minZ: p.z - 3500, maxX: p.x + 3500, maxZ: p.z + 3500 });
        } catch (e) { return; }
        for (const t of found || []) {
          const k = `${Math.round(t.x)}_${Math.round(t.z)}`;   // dedupe on raw worker coords
          if (!townKeys.has(k)) {
            townKeys.add(k);
            towns.push({ x: t.x - CHUNK_W / 2, z: t.z - CHUNK_H / 2 });  // worker → render frame
          }
        }
      };
      refresh();
      // BOUNDED ticker (same self-clearing shape as farm-plots' ensureTicker):
      // the town list only GROWS — every centre found is deduped and kept — so
      // this is a warm-up poll that widens the exclusion set as the first towns
      // stream in, not a forever timer. It stops once the world stops yielding
      // NEW towns (IDLE_STOP consecutive empty passes) or after MAX_TICKS, so a
      // long session never leaves a module-level interval running for nothing.
      const MAX_TICKS = 60;          // hard ceiling: ~5 min of polling
      const IDLE_STOP = 6;           // …or 30s with nothing new found
      let ticks = 0, idle = 0;
      const townIv = setInterval(async () => {
        const before = towns.length;
        await refresh();
        idle = (towns.length === before) ? idle + 1 : 0;
        if (++ticks >= MAX_TICKS || idle >= IDLE_STOP) clearInterval(townIv);
      }, 5000);
    }

    // Shared environment for all three specs. Feature-detect every optional
    // API and degrade gracefully: no addPath → no trails; no interactable/
    // dialog pair → the barrel/chest is just decorative.
    const env = {
      isNearTown,
      hasPaths: typeof XRPublisher.addPath === 'function',
      hasLoot: typeof XRPublisher.registerInteractable === 'function'
        && typeof XRPublisher.openDialog === 'function',
      utils: XRPublisher.utils || null,
    };

    registerType(XRPublisher, THREE, 'cottage', { density: 0.22, minSpacing: 48, patch: 6.0 }, env);
    registerType(XRPublisher, THREE, 'home', { density: 0.16, minSpacing: 64, patch: 8.5 }, env);
    registerType(XRPublisher, THREE, 'barn', { density: 0.18, minSpacing: 55, patch: 7.0 }, env);

    registered = true;
    console.log(`[${PLUGIN_ID}] registered — homesteads: cottage / home / barn with yards, door trails, hearths, lootable stores, and abandoned variants (merged geometry, explicit colliders)`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
