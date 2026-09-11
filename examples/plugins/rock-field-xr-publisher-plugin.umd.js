/**
 * rock-field — XR Publisher decoration plugin
 *
 * Larger, WALKABLE rock formations that emerge from the terrain — built to
 * match the engine's own boulders (`ProceduralBoulders.tsx` /
 * `boulderBuilder.ts`) so they sit in the world instead of clashing with it.
 * Each spawn is a UNIQUE mesh seeded by `spawn.seed` (same shape every visit,
 * every renderer) — NOT one boulder instanced everywhere — and
 * `collision:'hull'` makes them solid so you can walk up onto the low ones.
 *
 * Matching the engine look (this is what the first pass got wrong):
 *   - LOW-POLY dodecahedron base (detail 0-2; only the biggest main mass gets
 *     2, satellites stay at 0) — chunky faceted rock, the same
 *     primitive the engine boulders use. High-detail icospheres + high-freq
 *     noise read as spiky debris; don't.
 *   - GENTLE radial displacement, low frequency, low amplitude — the exact
 *     `(n1*0.4 + n2*0.2 + n3*0.1) * r * 0.35` field the engine boulders use.
 *   - SINGLE coherent mass per formation, with smaller rocks only at the BASE
 *     (like the engine's pebble ring) — never stacked on top. Stacked lobes
 *     read as "geometries piled on each other".
 *   - NEAR-UNIFORM warm GRAY matching the boulder albedo (~0.34 grey, slight
 *     noise variation) — no moss/strata colours, which fight the rock band.
 *   Silhouette variety comes from non-uniform SCALE of that single mass
 *   (wide outcrop / round boulder / tall standing-stone), not from piling.
 *
 * Surgical enrichment ON TOP of that base (every look rule above still holds —
 * same displacement field, same base primitive, same grey band, same layouts):
 *   - LICHEN: ~40% of formations (seeded) blend a desaturated sage or ochre
 *     tint into the vertex colours on upward-ish faces only (gated on the
 *     face normal's Y), masked by a lower-frequency octave/offset of the same
 *     noise3 field. Deviation is ≤ ~0.06 per channel, so lichened rock never
 *     leaves the terrain's grey band.
 *   - QUARTZ VEIN: ~1 in 6 formations carries a narrow planar band through
 *     the mass — a seeded plane through the origin; vertices within a thin
 *     distance of it lighten toward ~0.5 grey. Colour only, NO emissive
 *     (a glowing rock would fight the terrain and punch bloom in worlds
 *     that enable postFX).
 *   - SPLIT ROCK: a rare (~1 in 7) alternative layout builds the main mass
 *     twice as mirrored halves offset ~0.4u apart along a seeded horizontal
 *     axis, with displacement clamped near the split plane so the inner
 *     faces read flat — one boulder cracked in two. Still ONE mesh and one
 *     'hull' collider: the hull wraps BOTH halves, bridging the crack —
 *     acceptable, the gap is too narrow to walk into.
 *   All three roll from a dedicated `alea(spawn.seed + '-detail')` sub-rng so
 *   they never perturb the base layout/silhouette draws from `spawn.rng`.
 *
 * Generative inputs come from the engine so placement/shape stay deterministic
 * (`spawn.rng` + `XRPublisher.utils.createNoise3D(alea(spawn.seed))`).
 *
 * Deploy: copy into api `plugins/`, run `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'rock-field';
  let registered = false;

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

    const TWO_PI = Math.PI * 2;

    // Shared material (module singleton — engine default cleanup disposes
    // per-spawn GEOMETRY, never shared materials). roughness/metalness match
    // the engine boulder material. vertexColors only carry the subtle grey
    // variation the engine bakes in its shader (it can't do TSL from a plugin),
    // so the rock tone lands in the same band as terrain/boulders.
    const rockMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
    });

    // ── Lobe layout per silhouette. Each formation is ONE main mass + 0-3
    // small rocks at its BASE (never stacked). Variety is non-uniform scale,
    // not piling. All draws use spawn.rng → stable per visit. ────────────────
    function lobeParamsFor(type, rng, sizeMul) {
      const lobes = [];
      const add = (radius, ox, oy, oz, sx, sy, sz, isMain) => {
        const r = radius * sizeMul;
        lobes.push({
          radius: r,
          offset: { x: ox * sizeMul, y: oy * sizeMul, z: oz * sizeMul },
          scale: { x: sx, y: sy, z: sz },
          seedOffset: rng() * 23,
          // Engine uses detail 0-1; give only the big main mass detail 2.
          detail: isMain ? (r > 1.9 ? 2 : 1) : 0,
          main: isMain,
        });
      };
      // 1-3 small rocks shouldering the base, partially merged into the main
      // mass so the whole thing reads as one outcrop rising from the ground.
      const addBaseRocks = (mainR, count, lowness) => {
        for (let i = 0; i < count; i++) {
          const a = rng() * TWO_PI;
          const d = mainR * (0.6 + rng() * 0.5);
          add(mainR * (0.4 + rng() * 0.35),
            Math.cos(a) * d, -mainR * lowness, Math.sin(a) * d,
            1, 0.7 + rng() * 0.2, 1, false);
        }
      };

      if (type === 'monolith') {
        // A single weathered standing stone — taller than wide, but ONE
        // coherent rounded mass (not a spike, not a stack). A distant landmark.
        const r = 1.2 + rng() * 0.6;
        add(r, 0, 0, 0, 0.72 + rng() * 0.12, 1.5 + rng() * 0.5, 0.72 + rng() * 0.12, true);
        addBaseRocks(r, 1 + Math.floor(rng() * 2), 0.55);
      } else if (type === 'boulder') {
        // Broad rounded boulder, slightly flattened so the top is standable.
        const r = 1.5 + rng() * 1.0;
        add(r, 0, 0, 0, 1, 0.72 + rng() * 0.16, 1, true);
        addBaseRocks(r, 1 + Math.floor(rng() * 2), 0.15);
      } else {
        // 'outcrop' (most common): wide, low, climbable rock shelf — a single
        // flattened mass with a craggier base ring.
        const r = 1.6 + rng() * 1.1;
        add(r, 0, 0, 0, 1.1 + rng() * 0.5, 0.5 + rng() * 0.18, 0.85 + rng() * 0.35, true);
        addBaseRocks(r, 2 + Math.floor(rng() * 2), 0.05);
      }
      return lobes;
    }

    function buildFormation(spawn) {
      const rng = spawn.rng;
      const noise3 = XRPublisher.utils.createNoise3D(XRPublisher.utils.alea(spawn.seed + '-rock'));

      // Outcrops common; boulders next; standing stones the rare landmark.
      const roll = rng();
      const type = roll < 0.55 ? 'outcrop' : roll < 0.82 ? 'boulder' : 'monolith';
      // Skewed small (pow²) — mostly knee/chest height, occasionally a big one.
      const sizeMul = 0.9 + Math.pow(rng(), 2) * 2.0;   // ~0.9 .. 2.9
      const lobes = lobeParamsFor(type, rng, sizeMul);

      // ── Surface-detail rolls come from a DEDICATED sub-rng (fixed draw
      // order, always drawn) so lichen/vein/split never shift the base layout
      // draws above — the silhouette a seed produced before these features
      // existed is the silhouette it produces now. ────────────────────────────
      const drng = XRPublisher.utils.alea(spawn.seed + '-detail');
      const hasLichen = drng() < 0.40;                   // ~40% of formations
      const lichenOchre = drng() < 0.35;                 // else desaturated sage
      const hasVein = drng() < (1 / 6);                  // rare quartz band
      const veinTheta = drng() * TWO_PI;                 // seeded plane normal…
      const veinY = (drng() * 2 - 1) * 0.8;              // …any tilt, never flat
      const veinXZ = Math.sqrt(Math.max(0, 1 - veinY * veinY));
      const veinN = { x: Math.cos(veinTheta) * veinXZ, y: veinY, z: Math.sin(veinTheta) * veinXZ };
      const veinHalfWidth = (0.07 + drng() * 0.06) * sizeMul;
      const isSplit = drng() < 0.14;                     // ~1 in 7: cracked pair
      const splitTheta = drng() * TWO_PI;                // horizontal split axis
      const splitN = { x: Math.cos(splitTheta), z: Math.sin(splitTheta) };
      const HALF_GAP = 0.2;                              // ×2 halves ⇒ ~0.4u gap

      // Build all lobes into ONE non-indexed buffer. Displacement is the
      // engine boulder field: GENTLE, low-frequency, radial — sampled at the
      // (already non-uniformly scaled) local position so adjacent low-poly
      // verts move together (no spikes), and coincident seam verts match.
      const positions = [];
      const dir = new THREE.Vector3();
      const v = new THREE.Vector3();
      for (const L of lobes) {
        const geo = new THREE.DodecahedronGeometry(L.radius, L.detail);
        const pa = geo.attributes.position;
        const so = L.seedOffset;
        // Split-rock: only the MAIN mass cracks; base rocks stay whole. The
        // first half's verts collect here, then a mirrored twin is emitted.
        const split = isSplit && L.main;
        const half = split ? [] : null;
        for (let i = 0; i < pa.count; i++) {
          v.fromBufferAttribute(pa, i);
          // Non-uniform scale first (gives the silhouette), then displace.
          const px = v.x * L.scale.x;
          const py = v.y * L.scale.y;
          const pz = v.z * L.scale.z;
          const ns = 2.5;
          const n1 = noise3(px * ns + so, py * ns, pz * ns) * 0.4;
          const n2 = noise3(px * ns * 2, py * ns * 2 + so, pz * ns * 2) * 0.2;
          const n3 = noise3(px * ns * 4, py * ns * 4, pz * ns * 4 + so) * 0.1;
          let disp = (n1 + n2 + n3) * L.radius * 0.35;       // engine amplitude
          if (split) {
            // Clamp displacement near the split plane so the inner faces of
            // the crack read flat-ish (a fresh break, not two weathered rocks).
            const d0 = px * splitN.x + pz * splitN.z;
            disp *= Math.min(1, Math.abs(d0) / (L.radius * 0.45));
          }
          const len = Math.sqrt(px * px + py * py + pz * pz) || 1;
          const inv = disp / len;
          let x = px + px * inv;
          const y = py + py * inv;
          let z = pz + pz * inv;
          if (split) {
            // Flatten everything past the plane onto it (the crack face),
            // then push this half its side of the ~0.4u gap.
            const d = x * splitN.x + z * splitN.z;
            if (d < 0) { x -= splitN.x * d; z -= splitN.z * d; }
            x += splitN.x * HALF_GAP;
            z += splitN.z * HALF_GAP;
            half.push(x + L.offset.x, y + L.offset.y, z + L.offset.z);
          } else {
            positions.push(x + L.offset.x, y + L.offset.y, z + L.offset.z);
          }
        }
        if (split) {
          // First half as built…
          for (let i = 0; i < half.length; i++) positions.push(half[i]);
          // …then its MIRROR across the split plane (lands on the far side of
          // the gap automatically, since the reflection includes HALF_GAP).
          // The axis is horizontal so Y is untouched; per-triangle vertex
          // order is swapped (0,2,1) because reflection flips the winding.
          for (let t = 0; t < half.length; t += 9) {
            for (const k of [0, 2, 1]) {
              const j = t + k * 3;
              const hx = half[j], hy = half[j + 1], hz = half[j + 2];
              const d = hx * splitN.x + hz * splitN.z;
              positions.push(hx - 2 * d * splitN.x, hy, hz - 2 * d * splitN.z);
            }
          }
        }
        geo.dispose();
      }

      // Geometry (and flat normals, like the engine) come FIRST now, because
      // the lichen pass below gates on the face normal's Y.
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.computeVertexNormals();                         // flat, like engine

      // Vertex colours: near-uniform warm grey matching the engine boulder
      // albedo (baseGray 0.34, channels ×[1.05, 0.98, 0.92]) with the same
      // 3-octave noise variation — NO moss/strata. Slightly darker low down so
      // the buried base grounds into the terrain.
      let minY = Infinity, maxY = -Infinity;
      for (let i = 1; i < positions.length; i += 3) {
        const y = positions[i];
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const span = Math.max(0.001, maxY - minY);

      const norA = geom.attributes.normal;
      const colors = new Float32Array(positions.length);
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i], y = positions[i + 1], z = positions[i + 2];
        const variation = noise3(x * 0.8, y * 0.8, z * 0.8) * 0.07
          + noise3(x * 2.5, y * 2.5, z * 2.5) * 0.04;
        let g = 0.34 + variation;
        // Subtle darkening over the lowest ~quarter (contact shadow / damp).
        const t = (y - minY) / span;
        if (t < 0.25) g *= 0.82 + (t / 0.25) * 0.18;
        g = Math.min(0.6, Math.max(0.16, g));

        // Quartz vein: lighten toward ~0.5 grey inside a thin band around the
        // seeded plane. A whisper of noise wobbles the edge so the band reads
        // as mineral, not a painted stripe. Colour only — no emissive.
        if (hasVein) {
          const d = x * veinN.x + y * veinN.y + z * veinN.z
            + noise3(x * 1.4 + 83, y * 1.4, z * 1.4) * 0.05;
          const ad = Math.abs(d);
          if (ad < veinHalfWidth) {
            const s = 1 - ad / veinHalfWidth;
            g += (0.5 - g) * s * 0.85;
          }
        }

        let r = g * 1.05, gc = g * 0.98, b = g * 0.92;

        // Lichen: upward-ish faces only (rain + light land there), masked by a
        // LOWER-frequency octave/offset of the same noise3 field. Per-channel
        // deviation caps at ~0.06 so the rock stays inside the grey band.
        if (hasLichen) {
          const ny = norA.getY(i / 3);
          if (ny > 0.35) {
            const up = Math.min(1, (ny - 0.35) / 0.4);
            const nL = noise3(x * 0.5 + 37, y * 0.5 - 11, z * 0.5 + 59);
            const m = Math.min(1, Math.max(0, (nL - 0.1) / 0.45)) * up;
            if (m > 0) {
              if (lichenOchre) { r += 0.055 * m; gc += 0.02 * m; b -= 0.04 * m; }
              else { r -= 0.04 * m; gc += 0.055 * m; b -= 0.03 * m; }
            }
          }
        }

        colors[i] = r;
        colors[i + 1] = gc;
        colors[i + 2] = b;
      }
      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      // Bury the base so the rock reads as emerging from the ground (and
      // doesn't float on slopes).
      const sink = 0.4 + sizeMul * 0.28;
      geom.translate(0, -minY - sink, 0);
      geom.computeBoundingSphere();

      const mesh = new THREE.Mesh(geom, rockMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.rotation.y = rng() * TWO_PI;
      return mesh;
    }

    XRPublisher.registerDecoration({
      name: 'rock-field',
      density: 0.85,             // ~1 per chunk — landmarks, not litter
      minSpacing: 12,            // lets the odd pair cluster, never overlap
      minHeight: 0.485,          // above the waterline
      maxHeight: 0.80,           // up into the rocky band, not snow-cap peaks
      maxSlope: 0.55,            // skip near-cliffs (they'd clip/float badly)
      collision: 'hull',         // ← solid convex hull: walk up onto them.
                                 //   Split rocks share ONE hull across both
                                 //   halves (bridges the narrow crack — fine).
      create(spawn) {
        return buildFormation(spawn);
      },
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] decoration registered`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
