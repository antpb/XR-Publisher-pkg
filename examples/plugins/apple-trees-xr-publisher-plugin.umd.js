/**
 * apple-trees — XR Publisher decoration plugin (COLLECTIBLE ORCHARD)
 * ------------------------------------------------------------------
 * Apples hang from the canopies of the engine's own procedural trees. Walk up,
 * press E, and the apple goes into your basket — permanently for this session.
 * Roughly one in twelve is a GOLDEN apple, worth five. Built entirely from the
 * public plugin API — no engine changes.
 *
 * WHAT THIS DEMONSTRATES (the anchor:'tree' + interactable + HUD showcase):
 *   • ANCHOR:'tree'          — spawns attach to the underside of REAL canopy
 *     blob surfaces (local y=0 IS the leaf surface); the object hangs DOWNWARD
 *     on a short cord so it dangles clear of the solid canopy shell.
 *   • INTERACTABLE + onInteract — proximity "Press E" per spawn; ctx.remove()
 *     despawns the apple instantly.
 *   • STATEFUL interactionPrompt — a FUNCTION, re-resolved ~10Hz by the
 *     engine, returning "collect apple" / "collect GOLDEN apple". It must be
 *     CHEAP (a Map lookup here) and must NEVER draw from spawn.rng — drawing
 *     would advance the stream on every resolve and desync determinism.
 *   • SESSION-PERMANENT COLLECTION — deterministic spawns reappear on chunk
 *     reload, so collected `spawn.seed`s live in a Set and create() returns
 *     null for them. The apple stays gone no matter how far you roam.
 *   • registerHud            — 🧺 basket panel (🍎 + ✨ counts, total worth),
 *     persisted in localStorage namespaced per world via getWorldStateKey().
 *   • openDialog             — one-time first-collect hint explaining the
 *     orchard (in-world 3D panel: readable in VR, unlike the DOM HUD).
 *   • SEEDED VARIETY — golden roll, size, hue (red vs green-blushed shared
 *     materials) and leaf twist all come from spawn.rng in a FIXED draw order,
 *     so every apple looks identical on every visit and every renderer.
 *
 * PERF CONTRACTS HONORED:
 *   • NO update() on this spec — apples are dense and static. An update()
 *     would make EVERY apple a per-frame dynamic object (see the perf note at
 *     the spec below). Collect feedback is an instant remove(), not a falling
 *     animation, for exactly that reason.
 *   • All geometry + materials are module-shared; create() only assembles
 *     Meshes. A custom dispose() prevents the default cleanup from disposing
 *     the SHARED geometry per spawn.
 *   • Golden glow is an EMISSIVE material — never a scene light (light count
 *     must stay constant after load). It blooms if the world enables postFX.
 *
 * Persistence note: collection here is per SESSION (a page reload restores the
 * orchard; only the basket persists via localStorage). To make picked apples
 * permanent — and shared — across sessions, store collected seeds with
 * XRPublisher.setWorldState keyed by spawn.seed and check getWorldState in
 * create() (farm-plots is the reference implementation). Deliberately out of
 * scope for this demo.
 *
 * Deploy: copy into your api `plugins/` dir and run `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'apple-trees';

  // ── Configure me ──────────────────────────────────────────────────────────
  const DENSITY = 0.6;          // ~60% of trees bear an apple
  const GOLDEN_ODDS = 1 / 12;   // seeded rare roll, decided in create()
  const GOLDEN_WORTH = 5;       // basket value of a golden apple (red = 1)
  const INTERACT_RADIUS = 3.5;  // "Press E" range in meters

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
    if (!XRPublisher || !THREE || typeof XRPublisher.registerDecoration !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime not available or too old`);
      return;
    }
    // Optional APIs — feature-detect and degrade gracefully.
    const HAS_HUD = typeof XRPublisher.registerHud === 'function';
    const HAS_DIALOG = typeof XRPublisher.openDialog === 'function';

    // ── Basket state, persisted per world ────────────────────────────────────
    // LOCAL to this player (what YOU picked is yours) → localStorage, keyed by
    // the world so two worlds on one host don't share a basket. Feature-detect
    // getWorldStateKey and fall back to a plain hostname key.
    const worldKey = (typeof XRPublisher.getWorldStateKey === 'function'
      ? XRPublisher.getWorldStateKey() : location.hostname);
    const LS_KEY = `xrp-${PLUGIN_ID}-basket-${worldKey}`;
    let basket = { red: 0, golden: 0, hinted: false };
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY));
      if (saved && typeof saved === 'object') basket = Object.assign(basket, saved);
    } catch (e) { /* corrupt/blocked storage → fresh basket */ }
    const saveBasket = () => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(basket)); } catch (e) {}
    };

    // ── HUD: 🧺 basket panel, top-right. The plugin OWNS this DOM node and ──
    // updates it imperatively — no React, no store (registerHud contract).
    // DOM HUD is flatscreen-only; the VR-facing surface is the dialog below.
    let renderHud = () => {};
    if (HAS_HUD) {
      const hud = document.createElement('div');
      Object.assign(hud.style, {
        padding: '8px 14px',
        background: 'rgba(15,15,20,0.82)',
        color: '#f5f5f7',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '10px',
        font: '600 15px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        textAlign: 'right',
      });
      renderHud = () => {
        const worth = basket.red + basket.golden * GOLDEN_WORTH;
        hud.innerHTML =
          `<div>🧺 <span style="margin-left:4px">🍎 ${basket.red}</span>` +
          `<span style="margin-left:10px">✨ ${basket.golden}</span></div>` +
          `<div style="font-size:11px;font-weight:400;opacity:0.65;margin-top:2px">` +
          (worth > 0 ? `worth ${worth}` : 'find an orchard tree') + `</div>`;
      };
      renderHud();
      XRPublisher.registerHud(`${PLUGIN_ID}-basket`, hud, 'top-right');
    }

    // One-time first-collect hint. openDialog is an in-world 3D panel (mouse
    // AND VR-controller clickable); `hinted` persists in the basket record so
    // returning players are not re-lectured.
    const maybeShowHint = () => {
      if (basket.hinted || !HAS_DIALOG) return;
      basket.hinted = true;
      saveBasket();
      try {
        XRPublisher.openDialog({
          title: 'The Orchard',
          content: 'Apples grow in the tree canopies here. Walk up to one and '
            + 'press E to pick it. About one in twelve is a golden apple — '
            + `worth ${GOLDEN_WORTH}. Your basket is saved for this world.`,
          buttons: [{ label: 'Got it', variant: 'primary' }],
        });
      } catch (e) { /* dialog is a nicety — never let it break collection */ }
    };

    // ── Shared materials/geometry — create() runs per spawn, so everything ──
    // reusable lives at module level. Two fruit hues + one rare gold; per-apple
    // variety comes from WHICH material and WHAT scale, both seeded.
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd11f1f, roughness: 0.45, metalness: 0.05 });
    // "Green-blushed": an under-ripe yellow-green, pushed warm enough in the
    // base colour alone to read distinct at a distance without extra geometry.
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x8fae2e, roughness: 0.5, metalness: 0.05 });
    // GOLDEN: emissive-tinted so it glows softly on its own and punches through
    // bloom if the world enables postFX. Emissive material — NEVER a PointLight
    // (scene light count must stay constant after load or every material in the
    // world recompiles).
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf3c235, roughness: 0.3, metalness: 0.35,
      emissive: 0x8a5c00, emissiveIntensity: 0.9,
    });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7a22, roughness: 0.85, side: THREE.DoubleSide });

    const appleR = 0.16;
    const appleGeo = new THREE.SphereGeometry(appleR, 14, 10);
    // Cord LENGTH must clear the canopy's solid blob shell (same trick as the
    // canopy-lanterns plugin): the anchor (local y=0) is ON the blob surface,
    // which is a closed noise-displaced icosphere — the displacement bulges
    // past the anchor, so a shallow hang buries the apple in the foliage. Drop
    // it a short cord below to dangle clear + visibly attached.
    const cord = 0.22;
    const stemGeo = new THREE.CylinderGeometry(0.012, 0.012, cord, 4);
    const leafGeo = new THREE.PlaneGeometry(0.09, 0.05);

    // ── Session collection state ─────────────────────────────────────────────
    // Spawns are DETERMINISTIC, so a remove()d apple would reappear when the
    // chunk reloads. Tracking collected seeds and returning null from create()
    // makes collection permanent for this session. (Cross-session/shared
    // permanence = setWorldState keyed by spawn.seed — see header note.)
    const harvested = new Set();
    // Golden-ness is DECIDED in create() (first spawn.rng draw) and CACHED here
    // so interactionPrompt — re-resolved ~10Hz — is a pure Map lookup. Entries
    // are cleared in dispose() when the chunk unloads; a reload re-derives the
    // same value because spawn.rng is re-seeded identically per spawn.
    const goldenBySeed = new Map();

    XRPublisher.registerDecoration({
      name: 'tree-apple',              // part of the placement seed — renaming relocates every apple
      anchor: 'tree',                  // hang on the canopy underside (local y=0 = leaf surface)
      density: DENSITY,
      interactable: true,              // ← "E to interact" (forces per-object mount)
      // Prompt is a FUNCTION: the engine re-resolves it ~10Hz while you stand
      // near, so stateful/contextual text is free — but keep it a cheap lookup.
      interactionPrompt: (spawn) =>
        (goldenBySeed.get(spawn.seed) ? 'collect GOLDEN apple' : 'collect apple'),
      interactionRadius: INTERACT_RADIUS,

      // PERF NOTE — deliberately NO update() on this spec. Apples are dense
      // and static; adding update() would flip EVERY apple onto the per-frame
      // dynamic path (one JS call per apple per frame, no matrix freezing).
      // That is also why collecting is an instant remove() with no falling/
      // shrinking animation: the feedback tradeoff buys back an entire
      // orchard's worth of per-frame work. If you ever want pick feedback,
      // do it OUTSIDE the spec (e.g. a single pooled particle burst), never
      // by animating the spawned objects themselves.

      create(spawn) {
        if (harvested.has(spawn.seed)) return null;   // picked this session — stays gone

        // FIXED-ORDER spawn.rng draws (golden → size → hue → leaf twist).
        // Order matters: inserting a draw above another shifts every value
        // after it and re-rolls the whole orchard's look.
        const isGolden = spawn.rng() < GOLDEN_ODDS;
        const size = 0.85 + spawn.rng() * 0.3;        // subtle per-apple scale variety
        const fruitMat = isGolden ? goldMat : (spawn.rng() < 0.6 ? redMat : greenMat);
        const leafYaw = spawn.rng() * Math.PI * 2;
        goldenBySeed.set(spawn.seed, isGolden);

        const g = new THREE.Group();
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = -cord / 2;                  // top at the leaf surface (y=0)
        const apple = new THREE.Mesh(appleGeo, fruitMat);
        apple.position.y = -cord - appleR * size;     // hanging clear of the leaves
        apple.scale.setScalar(size);
        apple.scale.y *= 0.92;                        // slightly squashed = reads "apple"
        apple.castShadow = true;                      // the meaningful part casts; stem/leaf don't
        // A single tiny leaf where stem meets fruit — cheap authored detail.
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0.05, -cord + 0.01, 0);
        leaf.rotation.set(-0.5, leafYaw, 0.35);
        g.add(stem, apple, leaf);
        g.userData.appleSeed = spawn.seed;            // lets dispose() clear the golden cache
        return g;
      },

      onInteract({ spawn, remove }) {
        harvested.add(spawn.seed);     // create() now returns null on chunk reload
        if (goldenBySeed.get(spawn.seed)) basket.golden += 1;
        else basket.red += 1;
        saveBasket();
        renderHud();
        maybeShowHint();               // one-time orchard explainer (first pick ever)
        remove();                      // instant despawn — see PERF NOTE above
      },

      // Custom dispose: our geometry is MODULE-SHARED across every apple, so
      // the default cleanup (which disposes the returned tree's geometry per
      // spawn) must not run. We only drop the golden cache entry for this
      // chunk's spawns; create() re-derives it deterministically on reload.
      dispose(object) {
        // No geometry/material disposal — everything is shared, by design.
        const seed = object && object.userData && object.userData.appleSeed;
        if (seed) goldenBySeed.delete(seed);
      },
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] orchard registered${HAS_HUD ? ' + 🧺 basket HUD' : ''}${HAS_DIALOG ? ' + hint dialog' : ''}`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
