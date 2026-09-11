/**
 * minimal-mushrooms — XR Publisher decoration plugin (the minimal teaching example)
 * ---------------------------------------------------------------------------------
 * Mushroom clumps ringing the BASE of engine trees. Deliberately the SMALLEST
 * complete plugin — one decoration spec, no HUD/dialog/state/update loop. Read
 * this first, then graduate to farm-plots / resonance-stage. Built entirely
 * from the public API — no engine changes.
 *
 *  - ANCHOR:'tree-base' — the engine hands create() the trunk/terrain contact
 *    point (local y = 0) plus spawn.anchorRadius (a ring just outside the
 *    trunk); the plugin scatters a small cluster into that ring.
 *  - SPAWN.RNG ONLY — every draw (count, angle, size, tilt, species, pairing)
 *    comes from the per-spawn seeded PRNG, so the same trees grow the same
 *    clumps every visit, on every renderer. Never Math.random() for placement.
 *  - SHARED SINGLETONS — all materials + base geometries live at module level.
 *    create() runs once per TREE; per-spawn materials would compile/upload per
 *    clump and never be freed. Sharing also needs the no-op dispose() below.
 *  - AUTHORED DETAIL, ZERO PER-FRAME COST — speckled amanita caps (one 64px
 *    CanvasTexture), a gill cone under the cap edge, barrel-bulged stems
 *    (one-time vertex tweak), seeded lean, occasional paired caps.
 *  - RARE GLOW SPECIES (~1 clump in 8, seeded) — slender teal mushrooms on ONE
 *    shared emissive material: bright at night for free, blooms if a world
 *    enables postFX. NEVER scene lights — light count must stay constant.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'minimal-mushrooms';
  let registered = false;

  // The runtime exposes window.XRPublisher + window.THREE on load. A plugin
  // script may evaluate before the runtime finishes, so poll briefly.
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
    if (!XRPublisher || !THREE) {
      console.error(`[${PLUGIN_ID}] runtime (XRPublisher/THREE) not available`);
      return;
    }

    // ── Shared singletons — built ONCE, reused by every clump in the world ──
    // Amanita cap texture, painted once: red base + white speckles scattered by
    // golden ratio (deterministic, no rng); dots avoid v extremes (pole smear).
    const speckleTex = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#a92c2c'; ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#f3ead9';
      for (let i = 0; i < 26; i++) {
        const u = 0.05 + ((i * 0.61803398875) % 1) * 0.9;
        const v = 0.15 + ((i * 0.7548776662) % 1) * 0.7;
        const r = 1.6 + (i % 3) * 0.9;
        ctx.beginPath();
        ctx.ellipse(u * 64, v * 64, r, r * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace; return tex;
    })();

    const stemMat = new THREE.MeshStandardMaterial({ color: 0xeee4d0, roughness: 0.95 });
    const gillMat = new THREE.MeshStandardMaterial({ color: 0xdccfae, roughness: 0.9, side: THREE.DoubleSide });
    const capMatRed = new THREE.MeshStandardMaterial({ map: speckleTex, roughness: 0.65 });
    const capMatAmber = new THREE.MeshStandardMaterial({ color: 0xd98a2b, roughness: 0.7 });
    // Glow species: near-black albedo so the teal EMISSIVE carries the look —
    // no scene light needed, and it blooms wherever a world enables postFX.
    const glowMat = new THREE.MeshStandardMaterial({ color: 0x030a0c, emissive: 0x27e0cf, emissiveIntensity: 1.4, roughness: 0.55 });

    const capGeo = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    // Gills: an open cone from the cap rim sloping in toward the stem.
    const gillGeo = new THREE.CylinderGeometry(0.92, 0.4, 0.18, 10, 1, true);
    // Stem: tapered cylinder + one-time barrel bulge (widest mid-height) baked
    // straight into the SHARED geometry — authored shape, zero per-spawn cost.
    const stemGeo = new THREE.CylinderGeometry(0.09, 0.13, 1, 7, 3);
    {
      const p = stemGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const bulge = 1 + 0.22 * Math.sin((p.getY(i) + 0.5) * Math.PI);
        p.setX(i, p.getX(i) * bulge); p.setZ(i, p.getZ(i) * bulge);
      }
      stemGeo.computeVertexNormals();
    }

    // One mushroom: stem + gills + cap — shared geometry/materials, only the
    // transforms vary. `rng` is the spawn's seeded stream passed straight in.
    const makeMushroom = (rng, glow) => {
      const m = new THREE.Group();
      const h = glow ? 0.5 + rng() * 0.45 : 0.28 + rng() * 0.45;
      const capR = glow ? 0.09 + rng() * 0.07 : 0.16 + rng() * 0.18;
      const stem = new THREE.Mesh(stemGeo, glow ? glowMat : stemMat);
      const girth = glow ? 0.5 : 1; // glow species is slender
      stem.scale.set(girth, h, girth);
      stem.position.y = h / 2;
      const gills = new THREE.Mesh(gillGeo, glow ? glowMat : gillMat);
      gills.scale.setScalar(capR);
      gills.position.y = h - capR * 0.09;
      const cap = new THREE.Mesh(capGeo, glow ? glowMat : (rng() < 0.55 ? capMatRed : capMatAmber));
      cap.scale.set(capR, capR * (glow ? 0.8 : 0.62), capR);
      cap.position.y = h;
      cap.castShadow = !glow; // shadow the chunky caps; tiny glow caps skip it
      m.add(stem, gills, cap);
      // Seeded lean around the base (origin = ground contact) + a yaw that
      // varies which way the speckle texture faces.
      m.rotation.set((rng() - 0.5) * 0.24, rng() * Math.PI * 2, (rng() - 0.5) * 0.24);
      return m;
    };

    XRPublisher.registerDecoration({
      name: 'minimal-mushroom',
      anchor: 'tree-base',     // ← cluster at the foot of each tree
      density: 0.7,            // ~70% of trees get a clump
      create(spawn) {
        // local (0,0,0) is the trunk base on the terrain. Ring the mushrooms
        // between the trunk and spawn.anchorRadius — all variation from rng.
        const clump = new THREE.Group();
        const glow = spawn.rng() < 1 / 8; // rare species — seeded per clump
        const outer = Math.max(0.5, spawn.anchorRadius || 1.2);
        const inner = outer * 0.45;
        const count = 3 + Math.floor(spawn.rng() * 4); // 3–6 mushrooms
        for (let i = 0; i < count; i++) {
          const ang = spawn.rng() * Math.PI * 2;
          const rad = inner + spawn.rng() * (outer - inner);
          const mush = makeMushroom(spawn.rng, glow);
          mush.position.set(Math.cos(ang) * rad, -0.03, Math.sin(ang) * rad);
          clump.add(mush);
          // ~1 in 3 grows a smaller partner, caps nearly touching — pairs
          // read organic where an even scatter reads placed.
          if (spawn.rng() < 0.3) {
            const buddy = makeMushroom(spawn.rng, glow);
            buddy.scale.setScalar(0.55 + spawn.rng() * 0.25);
            const bAng = spawn.rng() * Math.PI * 2;
            buddy.position.set(mush.position.x + Math.cos(bAng) * 0.16, -0.03, mush.position.z + Math.sin(bAng) * 0.16);
            clump.add(buddy);
          }
        }
        return clump;
      },
      // Every mesh uses SHARED module-level geometry; default cleanup would
      // dispose it on chunk unload and gut every other clump — opt out.
      dispose() {},
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
