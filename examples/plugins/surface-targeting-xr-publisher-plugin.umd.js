/**
 * surface-targeting — XR Publisher decoration plugin (a field guide to terrain surfaces)
 *
 * The `surface:` filter restricts a decoration to the terrain surface type its
 * spawn cell lands on — the same colour bands the terrain paints:
 *
 *   'water' | 'sand' | 'grass' | 'dirt' | 'rock' | 'snow'   (value or array)
 *
 * This plugin is a CATALOG: one small, cheap, seeded decoration per surface
 * type, so you can walk a world and see exactly where each band lives.
 * Built entirely from the public API — no engine changes.
 *
 *   • GRASS  → wildflower clumps    (per-object; seeded petal palettes,
 *              2-3 curved-stem heads per clump)
 *   • ROCK   → lichened scree       (per-object; rubble + sage/ochre lichen
 *              discs, the occasional hiker's cairn)
 *   • SAND   → seashells            (INSTANCED — the dense-static showcase)
 *            → starfish             (per-object, rare, hugging the tide line)
 *   • SNOW   → ice shards           (INSTANCED; crystals that glint, not glow)
 *   • DIRT   → forest-floor litter  (per-object; pebbles, broken twigs,
 *              dried leaves)
 *   ('water' targeting — which drops the above-waterline height floor so
 *    spawns can sit in the water column — is demonstrated by the lake-fish
 *    plugin; it needs loadModel + waterPlacement and deserves its own file.)
 *
 * APIs exercised, and the contracts they honor:
 *   • registerDecoration `surface:` — applied AFTER the accept/reject draw,
 *     so it only moves the spawns it filters; determinism is preserved.
 *     Surface classification derives from the WASM/JS-identical heightfield,
 *     so every renderer agrees where the sand is.
 *   • THE HEIGHT-BAND GOTCHA: the default spawn band is normalized height
 *     [0.485, 0.62] — barely above the waterline up into the low meadows.
 *     'rock' and 'snow' surfaces live ABOVE that band, so those specs must
 *     RAISE maxHeight or the surface filter will silently match nothing.
 *   • `maxWaterDistance` composed with `surface:` ("sand near the tide
 *     line"). The water scan is within-chunk and capped at 24u — cells with
 *     no water in their own chunk report the cap, so keep thresholds lenient.
 *   • `instanced: true` + `transform(spawn)` for the two DENSE static specs
 *     (seashells, ice shards). Why instancing fits: many spawns, one
 *     identical template, nothing moves — the engine mounts ONE
 *     THREE.InstancedMesh per template mesh per chunk instead of a scene
 *     object per shell. Constraints (why the other specs stay per-object):
 *     `create()` runs ONCE per chunk as the template (seeded by that chunk's
 *     first spawn), so per-spawn variety is ONLY what `transform()` returns
 *     — rotationY / scale / tilt — and instancing is incompatible with
 *     `update()` and `interactable`.
 *   • Merged-geometry writer: per-object decorations mount OUTSIDE the
 *     engine's per-chunk render bundles, so every extra Mesh is a real
 *     per-frame draw call. Each clump/scree/litter spawn is compiled into
 *     ONE vertex-colored BufferGeometry on ONE shared material — a flower
 *     clump is one draw, not 20.
 *
 * Determinism: every draw comes from spawn.rng in a fixed order — same seed
 * ⇒ same flowers, same lichen, same shell tilt, every visit, every renderer.
 * No Math.random() anywhere.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'surface-targeting';

  // ── Configure me ──────────────────────────────────────────────────────────
  // Densities are spawns per ~100×100u chunk. These specs cover the WHOLE
  // world (every chunk that has the surface), so restraint is the point:
  // the catalog should read as set dressing, not carpet.
  const FLOWER_DENSITY = 6;      // grass is everywhere — keep clumps sparse
  const SCREE_DENSITY = 2.5;    // rock band accents
  const SHELL_DENSITY = 5;      // instanced — cheap, but still a beach, not a midden
  const STARFISH_DENSITY = 0.6; // rare find
  const SHARD_DENSITY = 2.5;    // snow-cap accents
  const LITTER_DENSITY = 5;     // dirt-patch texture
  // Seeded petal palettes — one is drawn per clump from spawn.rng.
  const FLOWER_PALETTES = [
    { petal: [0.98, 0.97, 0.94], core: [0.95, 0.78, 0.28] },  // daisy white
    { petal: [0.95, 0.62, 0.75], core: [0.96, 0.83, 0.35] },  // pink
    { petal: [0.72, 0.62, 0.92], core: [0.98, 0.66, 0.25] },  // lavender
    { petal: [0.55, 0.72, 0.96], core: [0.97, 0.95, 0.85] },  // cornflower
    { petal: [0.96, 0.55, 0.38], core: [0.55, 0.32, 0.16] },  // coral poppy
  ];
  const STARFISH_PALETTES = [
    [0.86, 0.42, 0.30],   // coral
    [0.91, 0.58, 0.22],   // orange
    [0.58, 0.42, 0.62],   // dusty purple
  ];
  // ──────────────────────────────────────────────────────────────────────────

  let registered = false;
  const TWO_PI = Math.PI * 2;

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
    if (!XRPublisher || !THREE) { console.error(`[${PLUGIN_ID}] runtime not available`); return; }
    if (typeof XRPublisher.registerDecoration !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime too old — registerDecoration missing`);
      return;
    }

    // ── Shared materials (module singletons) ─────────────────────────────────
    // The engine's default cleanup disposes per-spawn GEOMETRY only, never
    // materials — so shared materials are safe and every spec here rides one
    // of exactly three. Per-part color is baked into vertex colors instead of
    // material variants.
    const propMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.85, metalness: 0,
    });
    const shellMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.45, metalness: 0,
    });
    // "Translucent-looking" without transparency: pale vertex-color gradient,
    // LOW roughness (specular glint) and a SUBTLE emissive (0.15 — glint, not
    // glow). Emissive materials bloom if a world enables postFX, and 0.15
    // stays under bloom thresholds while still lifting the crystal at dusk.
    const iceMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.18, metalness: 0.05,
      emissive: 0x8fd0ff, emissiveIntensity: 0.15,
    });

    // ── Merged-geometry writer ───────────────────────────────────────────────
    // Accumulates transformed primitive parts (with a flat color, or a
    // per-vertex color function sampled in the part's LOCAL pre-transform
    // frame — so patterns like ridge stripes don't depend on placement) into
    // one indexed, vertex-colored BufferGeometry. One mesh per spawn.
    const _m4 = new THREE.Matrix4();
    const _q4 = new THREE.Quaternion();
    const _e3 = new THREE.Euler();
    const _v3 = new THREE.Vector3();
    const _s3 = new THREE.Vector3();
    const Y_AXIS = new THREE.Vector3(0, 1, 0);
    const Z_AXIS = new THREE.Vector3(0, 0, 1);
    // Dedicated identity — compose() returns the SHARED scratch matrix, so
    // its result must be consumed immediately, never held across calls.
    const IDENTITY = new THREE.Matrix4();

    function makeWriter() {
      const pos = [], nrm = [], col = [], idx = [];
      let base = 0;
      return {
        // color: [r,g,b] or (x,y,z) => [r,g,b] on pre-transform coords.
        push(geo, matrix, color) {
          const p = geo.attributes.position;
          const isFn = typeof color === 'function';
          const partCol = new Float32Array(p.count * 3);
          for (let i = 0; i < p.count; i++) {
            const c = isFn ? color(p.getX(i), p.getY(i), p.getZ(i)) : color;
            partCol[i * 3] = c[0]; partCol[i * 3 + 1] = c[1]; partCol[i * 3 + 2] = c[2];
          }
          geo.applyMatrix4(matrix);   // moves positions AND fixes normals
          const n = geo.attributes.normal;
          for (let i = 0; i < p.count; i++) {
            pos.push(p.getX(i), p.getY(i), p.getZ(i));
            nrm.push(n.getX(i), n.getY(i), n.getZ(i));
            col.push(partCol[i * 3], partCol[i * 3 + 1], partCol[i * 3 + 2]);
          }
          const index = geo.index;
          if (index) for (let i = 0; i < index.count; i++) idx.push(index.getX(i) + base);
          else for (let i = 0; i < p.count; i++) idx.push(i + base);
          base += p.count;
          geo.dispose();              // source primitive; merged copy lives on
        },
        build(sinkY) {
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
          g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
          g.setIndex(idx);
          // Sink the whole prop slightly so bases embed on slopes instead of
          // floating on the spawn-centre plane.
          if (sinkY) g.translate(0, -sinkY, 0);
          g.computeBoundingSphere();
          return g;
        },
      };
    }

    // T·R·S compose into the shared scratch matrix. Euler order 'YXZ' so
    // rx/rz tilts happen in the part's OWN yawed frame (petal cups, shard
    // leans) instead of around world axes.
    const compose = (px, py, pz, rx, ry, rz, sx, sy, sz) => {
      _e3.set(rx, ry, rz, 'YXZ');
      _q4.setFromEuler(_e3);
      _v3.set(px, py, pz);
      _s3.set(sx, sy, sz);
      return _m4.compose(_v3, _q4, _s3);
    };
    // Same, but orienting a given local axis to an arbitrary direction
    // (lichen discs onto rock faces, twigs along their lie).
    const composeAxis = (px, py, pz, fromAxis, dir, sx, sy, sz) => {
      _q4.setFromUnitVectors(fromAxis, dir);
      _v3.set(px, py, pz);
      _s3.set(sx, sy, sz);
      return _m4.compose(_v3, _q4, _s3);
    };
    const lerp3 = (a, b, t) => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];

    // ═════════════════════════════════════════════════════════════════════════
    // ── grass: wildflower clumps ──
    // Per-object (each clump is a unique seeded arrangement — instancing
    // couldn't vary head count, palette, or stem curves). One merged mesh
    // per clump: 2-3 heads on CURVED stems (a bezier tube each), a shared
    // per-clump palette with per-head lightness variation, basal leaves.
    // ═════════════════════════════════════════════════════════════════════════
    function pushFlowerHead(w, rng, tipX, tipY, tipZ, pal) {
      const shade = 0.88 + rng() * 0.24;               // heads differ subtly
      w.push(
        new THREE.SphereGeometry(0.05, 7, 5),
        compose(tipX, tipY, tipZ, 0, 0, 0, 1, 0.75, 1),
        [pal.core[0] * shade, pal.core[1] * shade, pal.core[2] * shade],
      );
      const petalCol = [pal.petal[0] * shade, pal.petal[1] * shade, pal.petal[2] * shade];
      const petals = 5 + Math.floor(rng() * 2);        // 5-6
      const phase = rng() * TWO_PI;
      for (let i = 0; i < petals; i++) {
        const a = phase + (i / petals) * TWO_PI;
        const cup = -(0.18 + rng() * 0.2);             // outer edge lifts
        w.push(
          new THREE.SphereGeometry(0.055, 6, 4),
          compose(
            tipX + Math.cos(a) * 0.085, tipY + 0.012, tipZ + Math.sin(a) * 0.085,
            cup, Math.PI / 2 - a, 0,                   // point long axis outward
            1, 0.3, 1.55,
          ),
          petalCol,
        );
      }
    }

    function buildFlowerClump(spawn) {
      const rng = spawn.rng;
      const w = makeWriter();
      const pal = FLOWER_PALETTES[Math.floor(rng() * FLOWER_PALETTES.length)];
      const heads = 2 + Math.floor(rng() * 2);         // 2-3 heads per clump

      for (let h = 0; h < heads; h++) {
        const baseA = rng() * TWO_PI;
        const baseD = h === 0 ? 0 : 0.1 + rng() * 0.22;
        const bx = Math.cos(baseA) * baseD, bz = Math.sin(baseA) * baseD;
        const height = 0.34 + rng() * 0.3;
        // Slight stem curve: tip drifts off the root, bezier bows toward it.
        const leanA = rng() * TWO_PI;
        const lean = (0.05 + rng() * 0.16) * height;
        const dx = Math.cos(leanA) * lean, dz = Math.sin(leanA) * lean;
        const stemCol = [0.26 + rng() * 0.08, 0.42 + rng() * 0.1, 0.2];
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(bx, 0, bz),
          new THREE.Vector3(bx + dx * 0.35, height * 0.6, bz + dz * 0.35),
          new THREE.Vector3(bx + dx, height, bz + dz),
        );
        w.push(new THREE.TubeGeometry(curve, 5, 0.015, 4, false), IDENTITY, stemCol);
        pushFlowerHead(w, rng, bx + dx, height, bz + dz, pal);
      }
      // 1-2 basal leaves ground the clump.
      const leaves = 1 + Math.floor(rng() * 2);
      for (let i = 0; i < leaves; i++) {
        const a = rng() * TWO_PI;
        w.push(
          new THREE.SphereGeometry(0.05, 6, 4),
          compose(Math.cos(a) * 0.09, 0.025, Math.sin(a) * 0.09, -0.35, Math.PI / 2 - a, 0, 1, 0.25, 1.9),
          [0.3, 0.46 + rng() * 0.08, 0.2],
        );
      }
      const mesh = new THREE.Mesh(w.build(0.015), propMat);
      mesh.castShadow = false;   // tiny — not worth a shadow-pass entry
      mesh.receiveShadow = true;
      return mesh;
    }

    XRPublisher.registerDecoration({
      name: 'surface-flower',    // keep the name — it seeds placement; a
                                 // rename would relocate every clump
      density: FLOWER_DENSITY,
      surface: 'grass',
      maxSlope: 0.3,             // meadows, not scarps
      minSpacing: 1.5,
      create(spawn) { return buildFlowerClump(spawn); },
    });

    // ═════════════════════════════════════════════════════════════════════════
    // ── rock: lichened scree ──
    // Per-object: rubble whose count/pose is seeded, lichen discs hugged
    // onto the upper rock faces (sage/ochre vertex tint), and ~30% of spawns
    // add a small hiker's cairn — stacked flattened stones, the human touch
    // that makes the rock band feel travelled.
    // NOTE the raised maxHeight: the DEFAULT band ([0.485, 0.62]) barely
    // reaches the rock band — without it this spec would match nothing.
    // ═════════════════════════════════════════════════════════════════════════
    const LICHEN_COLS = [
      [0.55, 0.6, 0.42],   // sage
      [0.74, 0.6, 0.3],    // ochre
      [0.62, 0.66, 0.55],  // pale grey-green
    ];

    function pushRock(w, rng, x, y, z, r, sy, shade) {
      const g = [shade * 1.04, shade * 0.99, shade * 0.93];   // warm grey
      w.push(
        new THREE.DodecahedronGeometry(1, 0),
        compose(x, y, z, rng() * 0.6, rng() * TWO_PI, rng() * 0.6, r, r * sy, r),
        g,
      );
    }

    function buildScree(spawn) {
      const rng = spawn.rng;
      const w = makeWriter();
      const dir = new THREE.Vector3();

      const rocks = 3 + Math.floor(rng() * 3);         // 3-5 rubble pieces
      for (let i = 0; i < rocks; i++) {
        const r = 0.14 + rng() * 0.28;
        const sy = 0.6 + rng() * 0.3;                  // squashed = settled
        const x = (rng() - 0.5) * 1.6, z = (rng() - 0.5) * 1.6;
        const y = r * sy * 0.42;                       // more than half buried
        pushRock(w, rng, x, y, z, r, sy, 0.4 + rng() * 0.12);
        // Lichen: flat discs sitting on the upper faces. Direction is drawn
        // from the upper hemisphere and the disc is oriented to it — cheap,
        // and at pebble scale it reads as growth following the stone.
        if (rng() < 0.65) {
          const discs = 1 + Math.floor(rng() * 2);
          for (let d = 0; d < discs; d++) {
            const theta = rng() * TWO_PI, phi = rng() * 0.85;
            dir.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)).normalize();
            const lc = LICHEN_COLS[Math.floor(rng() * LICHEN_COLS.length)];
            const lr = r * (0.3 + rng() * 0.2);
            w.push(
              new THREE.CircleGeometry(1, 8),
              composeAxis(
                x + dir.x * r * 0.82, y + dir.y * r * sy * 0.82, z + dir.z * r * 0.82,
                Z_AXIS, dir, lr, lr, 1,
              ),
              [lc[0] * (0.9 + rng() * 0.2), lc[1] * (0.9 + rng() * 0.2), lc[2] * (0.9 + rng() * 0.2)],
            );
          }
        }
      }

      // Occasional cairn: 3-4 flattened stones, shrinking upward with a
      // little jitter so it reads hand-stacked, not extruded.
      if (rng() < 0.3) {
        const ca = rng() * TWO_PI, cd = 0.7 + rng() * 0.5;
        const cx = Math.cos(ca) * cd, cz = Math.sin(ca) * cd;
        const stones = 3 + Math.floor(rng() * 2);
        let topY = 0;
        let cr = 0.2 + rng() * 0.08;
        for (let s = 0; s < stones; s++) {
          const sy = 0.5 + rng() * 0.12;
          const jx = (rng() - 0.5) * cr * 0.3, jz = (rng() - 0.5) * cr * 0.3;
          topY += cr * sy * (s === 0 ? 0.5 : 0.85);    // slight interpenetration
          pushRock(w, rng, cx + jx, topY, cz + jz, cr, sy, 0.44 + rng() * 0.1);
          topY += cr * sy * 0.6;
          cr *= 0.72 + rng() * 0.1;
        }
      }

      const mesh = new THREE.Mesh(w.build(0.05), propMat);
      mesh.castShadow = true;    // chunky enough to anchor with a shadow
      mesh.receiveShadow = true;
      return mesh;
    }

    XRPublisher.registerDecoration({
      name: 'surface-rubble',    // keep the name — it seeds placement
      density: SCREE_DENSITY,
      surface: 'rock',
      minHeight: 0.5,
      maxHeight: 0.9,            // REQUIRED: reach up into the rock band
      maxSlope: 0.6,             // scree tolerates slope; near-cliffs clip
      minSpacing: 3,
      create(spawn) { return buildScree(spawn); },
    });

    // ═════════════════════════════════════════════════════════════════════════
    // ── sand: seashells (INSTANCED) ──
    // The dense-static instancing showcase. `create()` runs ONCE PER CHUNK as
    // the template — a flattened ridge-striped clamshell whose stripe count
    // and tint are seeded by that chunk's first spawn — and the engine mounts
    // ONE InstancedMesh for all shells in the chunk. Per-spawn variety is
    // ONLY `transform()` (rotationY / scale / tilt): that's the trade — no
    // per-shell palettes, no `update`, no `interactable`, in exchange for one
    // draw call per beach per chunk. (Compare the starfish below, which stays
    // per-object precisely because rarity makes uniqueness affordable.)
    // ═════════════════════════════════════════════════════════════════════════
    function buildShellTemplate(spawn) {
      const rng = spawn.rng;
      const w = makeWriter();
      const stripes = 10 + Math.floor(rng() * 7);      // per-chunk character
      const baseCol = [0.93, 0.88, 0.79];
      const stripeCol = [0.7 + rng() * 0.12, 0.57, 0.46];

      // Flattened dome, radial ridge stripes baked as vertex color bands
      // (sampled in the part's LOCAL frame, pre-transform — see the writer).
      w.push(
        new THREE.SphereGeometry(1, 16, 6, 0, TWO_PI, 0, Math.PI / 2),
        compose(0, 0, 0, 0, 0, 0, 0.11, 0.045, 0.1),
        (x, y, z) => {
          const ang = Math.atan2(z, x) / TWO_PI + 0.5;
          const band = Math.floor(ang * stripes) % 2;
          const rim = 0.85 + y * 0.15;                 // rim slightly darker
          const c = band ? stripeCol : baseCol;
          return [c[0] * rim, c[1] * rim, c[2] * rim];
        },
      );
      // Underside disc so the open dome never shows a hole on uneven sand.
      w.push(
        new THREE.CircleGeometry(1, 16),
        compose(0, 0.002, 0, Math.PI / 2, 0, 0, 0.11, 0.1, 1),
        [0.8, 0.72, 0.6],
      );
      // Hinge knob at one edge sells "shell" over "pebble".
      w.push(
        new THREE.SphereGeometry(1, 6, 5),
        compose(0, 0.014, -0.096, 0, 0, 0, 0.028, 0.02, 0.024),
        [0.82, 0.74, 0.64],
      );
      const mesh = new THREE.Mesh(w.build(0.008), shellMat);
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      return mesh;
    }

    XRPublisher.registerDecoration({
      name: 'surface-shells',
      density: SHELL_DENSITY,
      surface: 'sand',
      minHeight: 0.48,           // down to the waterline (default floor is 0.485)
      maxWaterDistance: 18,      // beach finds concentrate toward the water
      maxSlope: 0.3,
      minSpacing: 1.2,
      instanced: true,           // dense + static + identical template
      create(spawn) { return buildShellTemplate(spawn); },
      transform(spawn) {
        // The ONLY per-spawn variety an instanced spec gets. All draws from
        // spawn.rng — stable per visit.
        return {
          rotationY: spawn.rng() * TWO_PI,
          scale: 0.6 + spawn.rng() * 0.8,
          tilt: (spawn.rng() - 0.5) * 0.16,            // settled into the sand
        };
      },
    });

    // ── sand: starfish (rare, per-object) ──
    // Five lobes from scaled blobs, seeded palette with paler tips. Rare
    // enough (0.6/chunk) that a unique mesh per find is the right trade —
    // finding one should feel like finding one.
    function buildStarfish(spawn) {
      const rng = spawn.rng;
      const w = makeWriter();
      const base = STARFISH_PALETTES[Math.floor(rng() * STARFISH_PALETTES.length)];
      const shade = 0.9 + rng() * 0.2;
      const bodyCol = [base[0] * shade, base[1] * shade, base[2] * shade];
      const tipCol = lerp3(bodyCol, [0.96, 0.9, 0.8], 0.45);

      // Domed centre body.
      w.push(
        new THREE.SphereGeometry(0.09, 8, 6),
        compose(0, 0.03, 0, 0, 0, 0, 1, 0.5, 1),
        bodyCol,
      );
      // Five lobes — elongated squashed spheres radiating out; tips pale.
      const phase = rng() * TWO_PI;
      for (let i = 0; i < 5; i++) {
        const a = phase + (i / 5) * TWO_PI + (rng() - 0.5) * 0.12;
        w.push(
          new THREE.SphereGeometry(0.085, 8, 5),
          compose(
            Math.cos(a) * 0.14, 0.028, Math.sin(a) * 0.14,
            0, -a, (rng() - 0.5) * 0.1,                // long axis outward, slight lift
            2.1, 0.4, 0.72,
          ),
          // +X is outward pre-transform → fade to the tip color.
          (x) => lerp3(bodyCol, tipCol, Math.max(0, x / 0.085) * 0.5),
        );
      }
      const mesh = new THREE.Mesh(w.build(0.012), propMat);
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      return mesh;
    }

    XRPublisher.registerDecoration({
      name: 'surface-starfish',
      density: STARFISH_DENSITY,
      surface: 'sand',
      minHeight: 0.48,           // down to the waterline
      maxWaterDistance: 8,       // right at the tide line — stricter than shells
      maxSlope: 0.25,
      minSpacing: 6,
      create(spawn) { return buildStarfish(spawn); },
    });

    // ═════════════════════════════════════════════════════════════════════════
    // ── snow: ice shards (INSTANCED) ──
    // Clustered crystals at seeded tilts. Same instancing rationale as the
    // shells: dense, static, one template per chunk (the CLUSTER layout is
    // the per-chunk seeded part; per-spawn pose comes from transform()).
    // Raised height band for the same reason as the rubble — snow lives far
    // above the default spawn band.
    // ═════════════════════════════════════════════════════════════════════════
    const ICE_DEEP = [0.55, 0.72, 0.88];
    const ICE_PALE = [0.9, 0.97, 1.0];

    function buildShardTemplate(spawn) {
      const rng = spawn.rng;
      const w = makeWriter();
      // Vertical blue→white gradient (pre-transform y of a unit octahedron
      // spans −1..1) — reads as light passing through the crystal.
      const iceGrad = (x, y) => lerp3(ICE_DEEP, ICE_PALE, (y + 1) * 0.5);

      const crystals = 3 + Math.floor(rng() * 3);      // 3-5 per cluster
      for (let i = 0; i < crystals; i++) {
        const main = i === 0;
        const a = rng() * TWO_PI;
        const d = main ? 0 : 0.12 + rng() * 0.3;
        const r = main ? 0.2 + rng() * 0.08 : 0.09 + rng() * 0.1;
        const hs = main ? 2.4 + rng() * 0.8 : 1.5 + rng() * 1.0;
        const tiltA = rng() * TWO_PI;
        const tilt = main ? rng() * 0.18 : 0.1 + rng() * 0.45;
        w.push(
          new THREE.OctahedronGeometry(1, 0),
          compose(
            Math.cos(a) * d, r * hs * 0.55, Math.sin(a) * d, // base buried
            Math.cos(tiltA) * tilt, rng() * TWO_PI, Math.sin(tiltA) * tilt,
            r * (0.5 + rng() * 0.2), r * hs, r * (0.5 + rng() * 0.2),
          ),
          iceGrad,
        );
      }
      // A couple of broken chips at the base ground the cluster.
      for (let i = 0; i < 2; i++) {
        const a = rng() * TWO_PI, d = 0.25 + rng() * 0.2;
        const r = 0.05 + rng() * 0.05;
        w.push(
          new THREE.OctahedronGeometry(1, 0),
          compose(Math.cos(a) * d, r * 0.4, Math.sin(a) * d,
            rng() * 0.8, rng() * TWO_PI, rng() * 0.8, r, r * 0.7, r),
          iceGrad,
        );
      }
      const mesh = new THREE.Mesh(w.build(0.02), iceMat);
      mesh.castShadow = true;    // tall enough to throw a readable shadow
      mesh.receiveShadow = true;
      return mesh;
    }

    XRPublisher.registerDecoration({
      name: 'surface-ice-shards',
      density: SHARD_DENSITY,
      surface: 'snow',
      minHeight: 0.6,
      maxHeight: 0.97,           // REQUIRED: snow caps sit far above the default band
      maxSlope: 0.5,
      minSpacing: 4,
      instanced: true,
      create(spawn) { return buildShardTemplate(spawn); },
      transform(spawn) {
        return {
          rotationY: spawn.rng() * TWO_PI,
          scale: 0.75 + spawn.rng() * 0.75,
          tilt: (spawn.rng() - 0.5) * 0.2,
        };
      },
    });

    // ═════════════════════════════════════════════════════════════════════════
    // ── dirt: forest-floor litter ──
    // Per-object: pebbles + broken twigs (thin cylinders with a kink and
    // sometimes a stub branch) + a dried leaf or two. Bare-dirt patches read
    // as swept-under-trees once they carry litter.
    // ═════════════════════════════════════════════════════════════════════════
    function pushTwigSegment(w, rng, p0, dir, len, radius, col) {
      // CylinderGeometry's axis is +Y — orient it along the segment.
      w.push(
        new THREE.CylinderGeometry(radius * 0.85, radius, len, 5),
        composeAxis(
          p0.x + dir.x * len * 0.5, p0.y + dir.y * len * 0.5, p0.z + dir.z * len * 0.5,
          Y_AXIS, dir, 1, 1, 1,
        ),
        col,
      );
    }

    function buildLitter(spawn) {
      const rng = spawn.rng;
      const w = makeWriter();
      const p0 = new THREE.Vector3();
      const dir = new THREE.Vector3();
      const kinked = new THREE.Vector3();

      // Pebbles — small squashed dodecahedra in grey-browns.
      const pebbles = 3 + Math.floor(rng() * 4);
      for (let i = 0; i < pebbles; i++) {
        const r = 0.035 + rng() * 0.06;
        const g = 0.32 + rng() * 0.14, warm = 0.9 + rng() * 0.15;
        w.push(
          new THREE.DodecahedronGeometry(1, 0),
          compose((rng() - 0.5) * 1.1, r * 0.35, (rng() - 0.5) * 1.1,
            rng() * 0.5, rng() * TWO_PI, rng() * 0.5, r, r * 0.6, r),
          [g * warm, g * 0.92, g * 0.8],
        );
      }

      // Broken twigs — two thin segments meeting at a kink, lying nearly
      // flat; sometimes a stub branch at the joint.
      const twigs = 1 + Math.floor(rng() * 3);
      for (let i = 0; i < twigs; i++) {
        const radius = 0.013 + rng() * 0.008;
        const bark = 0.85 + rng() * 0.3;
        const col = [0.3 * bark, 0.22 * bark, 0.14 * bark];
        const yaw = rng() * TWO_PI;
        p0.set((rng() - 0.5) * 1.2, radius, (rng() - 0.5) * 1.2);
        dir.set(Math.cos(yaw), 0.03, Math.sin(yaw)).normalize();
        const len0 = 0.18 + rng() * 0.2;
        pushTwigSegment(w, rng, p0, dir, len0, radius, col);
        // Continue past the break at a kinked angle.
        p0.addScaledVector(dir, len0);
        const kink = yaw + (rng() < 0.5 ? 1 : -1) * (0.5 + rng() * 0.8);
        kinked.set(Math.cos(kink), 0.02, Math.sin(kink)).normalize();
        pushTwigSegment(w, rng, p0, kinked, 0.12 + rng() * 0.16, radius * 0.9, col);
        if (rng() < 0.4) {
          const stub = yaw + Math.PI * (0.35 + rng() * 0.3);
          kinked.set(Math.cos(stub), 0.25, Math.sin(stub)).normalize();
          pushTwigSegment(w, rng, p0, kinked, 0.05 + rng() * 0.05, radius * 0.6, col);
        }
      }

      // Dried leaves — flat tan discs, cheap and they sell "litter".
      const leaves = 1 + Math.floor(rng() * 2);
      for (let i = 0; i < leaves; i++) {
        const t = 0.9 + rng() * 0.2;
        w.push(
          new THREE.CircleGeometry(0.045 + rng() * 0.025, 6),
          compose((rng() - 0.5) * 1.0, 0.006, (rng() - 0.5) * 1.0,
            -Math.PI / 2 + (rng() - 0.5) * 0.3, rng() * TWO_PI, 0, 1, 1, 1),
          [0.62 * t, 0.46 * t, 0.26 * t],
        );
      }

      const mesh = new THREE.Mesh(w.build(0.008), propMat);
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      return mesh;
    }

    XRPublisher.registerDecoration({
      name: 'surface-litter',
      density: LITTER_DENSITY,
      surface: 'dirt',
      maxSlope: 0.35,
      minSpacing: 1.5,
      create(spawn) { return buildLitter(spawn); },
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] field guide registered — grass:flowers rock:scree sand:shells+starfish snow:ice-shards dirt:litter`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
