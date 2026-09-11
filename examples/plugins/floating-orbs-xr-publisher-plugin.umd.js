/**
 * floating-orbs — XR Publisher decoration plugin (NARRATIVE / DIALOG showcase)
 * ----------------------------------------------------------------------------
 * Wisp-orbs drift over the meadows, and every one of them is SOMEBODY: a
 * seeded name, one of four colour-themed personalities, and a branching
 * in-world conversation 2-3 layers deep. Walk up, press E, and an in-WORLD
 * modal opens (title + content + action buttons — readable and clickable in
 * 2D AND VR). Talk your way to a friendship, solve a tide-wisp's riddle for
 * a reward, or absorb an orb's light outright — it dims to a grey husk and
 * your "✦ light gathered" HUD counter ticks up. Gather enough and the light
 * you carry has something to say about it. Built entirely from the public
 * API — no engine changes.
 *
 *   • registerDecoration + update()  — deterministic scatter, cheap per-frame
 *     bob/spin/pulse motion (allocation-free; pulse is SCALE breathing, never
 *     shared-material mutation — see the comment in update()).
 *   • SEEDED IDENTITY — name (syllable-table generator), theme, and every
 *     silhouette parameter come from spawn.seed / spawn.rng in a fixed draw
 *     order: same world seed ⇒ same wisp with the same name in the same spot,
 *     every visit, every renderer.
 *   • interactable + interactionPrompt as a FUNCTION — the prompt re-resolves
 *     at ~10Hz, so it can be stateful: "speak with Ly'mira" → "Ly'mira (faded)"
 *     → "greet Ly'mira" without re-registering anything. Identities are
 *     memoized so the 10Hz resolve is a Map lookup.
 *   • openDialog() CHAINS — branching conversations built by opening a new
 *     dialog from a button's onSelect (with keepOpen:true so the default
 *     close-after-select doesn't tear down the dialog we just opened), plus a
 *     genuine keepOpen MULTI-STEP exchange: the tide-wisp's riddle keeps the
 *     panel open on wrong answers so you can try again.
 *   • CHOICES THAT MATTER — absorb (power now: orb fades, +1 ✦), befriend
 *     (earned by walking the conversation: friends can't be absorbed and
 *     pulse brighter), return light to a faded husk (✦ −1, it rekindles).
 *   • registerHud + localStorage — "✦ light gathered" persists per world
 *     (namespaced by getWorldStateKey()); absorbed orbs themselves are
 *     SESSION-scoped by design (a Set of spawn.seeds checked in create(), so
 *     husks survive chunk remounts but re-kindle on reload — the wisps come
 *     back; the light you gathered stays yours). Hitting LIGHT_GOAL fires a
 *     one-time special dialog (flag persisted alongside the counter).
 *   • getTimeOfDay() — greetings pick up a day/night flavour line.
 *   • NO scene lights — glow is shared emissive materials only (they punch
 *     the bloom threshold if a world enables postFX, and read bright anyway).
 *     Materials/geometry are shared per THEME at module scope, so create()
 *     allocates nothing but a Group and two Mesh wrappers per orb.
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'floating-orbs';

  // ── Configure me ──────────────────────────────────────────────────────────
  const DENSITY = 1.2;          // wisps per chunk — encounters, not clutter
  const MIN_SPACING = 22;       // keep conversations from overlapping
  const HOVER_MIN = 1.6;        // hover band above the spawn point (m)
  const HOVER_MAX = 2.3;
  const INTERACT_RADIUS = 4.5;
  const LIGHT_GOAL = 5;         // ✦ count that triggers the one-time dialog
  // ──────────────────────────────────────────────────────────────────────────

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
    if (typeof XRPublisher.registerDecoration !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime too old (no registerDecoration)`);
      return;
    }
    // Feature-detect the optional surfaces and degrade gracefully: without
    // dialogs the orbs still drift and glow; without HUD the count is silent.
    const HAS_DIALOG = typeof XRPublisher.openDialog === 'function';
    const HAS_HUD = typeof XRPublisher.registerHud === 'function';

    // ── Seeded sub-rng ────────────────────────────────────────────────────────
    // Identity draws come from a DEDICATED alea stream (seed + '-identity'),
    // the engine's own PRNG — never Math.random(), and never spawn.rng itself
    // (identityFor is also called from the prompt function, outside create()'s
    // fixed draw order). Tiny mulberry32 fallback keeps old runtimes working.
    const makeRng = (str) => {
      const utils = XRPublisher.utils;
      if (utils && typeof utils.alea === 'function') return utils.alea(str);
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      let a = h >>> 0;
      return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    // ── Names: syllable-table generator ──────────────────────────────────────
    const SYL_A = ['Ae', 'Ly', 'Or', 'Va', 'Ish', 'Nim', 'Sol', 'Um', 'Qui', 'Tha', 'Eir', 'Mo'];
    const SYL_B = ["'ra", 'lin', 'the', "'mira", 'dal', 'ven', 'ess', 'oa', 'ki', 'ru', 'phe', 'nna'];
    const SYL_C = ['el', 'ith', 'ar', 'un', 'is', 'or', 'wen', 'ei'];

    // interactionPrompt re-resolves ~10Hz — memoize identities so the prompt
    // function is a Map lookup, not a fresh PRNG + string build every tick.
    const identityCache = new Map();
    const identityFor = (seed) => {
      let id = identityCache.get(seed);
      if (id) return id;
      const r = makeRng(seed + '-identity');
      let name = SYL_A[(r() * SYL_A.length) | 0] + SYL_B[(r() * SYL_B.length) | 0];
      if (r() < 0.45) name += SYL_C[(r() * SYL_C.length) | 0];
      const themeKey = THEME_KEYS[(r() * THEME_KEYS.length) | 0];
      id = { name, themeKey };
      identityCache.set(seed, id);
      return id;
    };

    // ── Shared geometry + materials (per THEME, not per orb) ─────────────────
    // create() runs per spawn; everything visual is allocated ONCE here. Four
    // themes × (core + halo ring) + one shared "faded" pair. Emissive
    // intensities sit above 1.0 so the wisps punch a bloom threshold when a
    // world enables postFX — and simply read bright when it doesn't. NO scene
    // lights: adding/removing a light recompiles every material in the world.
    const coreGeo = new THREE.IcosahedronGeometry(0.42, 1);
    const ringGeo = new THREE.TorusGeometry(0.62, 0.035, 6, 48);
    const wispMats = (body, glow, ringGlow) => ({
      core: new THREE.MeshStandardMaterial({
        color: body, emissive: glow, emissiveIntensity: 2.0, roughness: 0.25, metalness: 0.0,
      }),
      ring: new THREE.MeshStandardMaterial({
        color: body, emissive: ringGlow, emissiveIntensity: 1.3, roughness: 0.35, metalness: 0.0,
      }),
    });
    const dimMats = {
      core: new THREE.MeshStandardMaterial({
        color: 0x394049, emissive: 0x0c0f13, emissiveIntensity: 0.3, roughness: 0.7, metalness: 0.05,
      }),
      ring: new THREE.MeshStandardMaterial({
        color: 0x2c3138, emissive: 0x000000, roughness: 0.8, metalness: 0.05,
      }),
    };

    // ── Session narrative state ───────────────────────────────────────────────
    // Absorbed/befriended wisps are keyed by spawn.seed and SESSION-scoped:
    // create() consults these Sets, so a husk stays a husk when its chunk
    // streams out and back — but a reload re-kindles the world. Deliberate:
    // the wisps return; the light you gathered (below, in localStorage) stays.
    const absorbedSeeds = new Set();
    const befriendedSeeds = new Set();
    const solvedRiddles = new Set();

    // ── Persistent ✦ counter (per world, per player) ──────────────────────────
    // Local keepsake, not shared world truth — localStorage namespaced by the
    // world-state key so two worlds on one host don't share a lantern.
    const worldKey = (typeof XRPublisher.getWorldStateKey === 'function'
      ? XRPublisher.getWorldStateKey() : location.hostname);
    const LS_KEY = `xrp-${PLUGIN_ID}-light-${worldKey}`;
    const state = { n: 0, goal: false };
    try { Object.assign(state, JSON.parse(localStorage.getItem(LS_KEY)) || {}); } catch (e) { /* fresh */ }
    const saveState = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } };

    // ── HUD: "✦ light gathered: n", top-right ────────────────────────────────
    // Plugin-owned DOM node, updated imperatively (flatscreen-only by design —
    // the VR-facing feedback is the dialogs themselves).
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
      });
      renderHud = () => { hud.textContent = `✦ light gathered: ${state.n}`; };
      renderHud();
      XRPublisher.registerHud(`${PLUGIN_ID}-light`, hud, 'top-right');
    }
    const addLight = (d) => { state.n = Math.max(0, state.n + d); saveState(); renderHud(); };

    // ── Day/night flavour ─────────────────────────────────────────────────────
    // getTimeOfDay() is room-synced shared time — read it, never set it here.
    const timeFlavor = () => {
      try {
        if (typeof XRPublisher.getTimeOfDay !== 'function') return '';
        const t = XRPublisher.getTimeOfDay();
        const h = (t && typeof t.time === 'number') ? t.time : 12;
        if (h < 6 || h >= 21) return ' Its glow burns bolder against the dark.';
        if (h < 9) return ' Dawn thins its glow to a pale halo.';
        if (h >= 17) return ' Dusk gathers, and its light leans long.';
        return '';
      } catch (e) { return ''; }
    };

    // ── Dialog plumbing ───────────────────────────────────────────────────────
    // CHAINING CONTRACT: a button closes its dialog AFTER onSelect unless
    // keepOpen — so every button whose onSelect opens the NEXT dialog sets
    // keepOpen:true, or the deferred close would tear down the panel the
    // onSelect just opened. `chain()` bakes that in.
    const chain = (label, open, variant) => ({ label, keepOpen: true, variant, onSelect: open });

    // Swap an orb between its lit theme look and the shared faded husk. The
    // material SWAP is the whole trick — one shared material per state, never
    // a per-orb clone, never mutating a shared material's colour in place.
    const setOrbLit = (orb, theme, lit) => {
      const u = orb.userData;
      u.dimmed = !lit;
      u.core.material = lit ? theme.mats.core : dimMats.core;
      u.ring.material = lit ? theme.mats.ring : dimMats.ring;
      // Husks drift: slower spin, shallower bob (per-orb userData — safe).
      u.spin = lit ? u.spinLit : u.spinLit * 0.25;
      u.bobAmp = lit ? u.bobAmpLit : u.bobAmpLit * 0.35;
    };

    // Shared "you gained light" epilogue. Intercepts the LIGHT_GOAL crossing
    // exactly once (flag persisted with the counter) with a special dialog.
    const concludeWithLight = (title, content) => {
      addLight(1);
      if (state.n >= LIGHT_GOAL && !state.goal) {
        state.goal = true; saveState();
        XRPublisher.openDialog({
          title: '✦ The gathered light stirs',
          content: `The ${LIGHT_GOAL} sparks you carry hum in unison — a small constellation of borrowed fires beating where your pulse should be. Whatever you were before, you are also a lantern now.`,
          buttons: [{ label: 'Carry it onward', variant: 'primary' }],
        });
        return;
      }
      XRPublisher.openDialog({ title, content, buttons: [{ label: 'Move on', variant: 'primary' }] });
    };

    const doAbsorb = (io) => {
      absorbedSeeds.add(io.seed);
      setOrbLit(io.orb, io.theme, false);
      concludeWithLight(`${io.name} fades`, io.theme.absorbEpilogue(io.name));
    };

    const doBefriend = (io) => {
      befriendedSeeds.add(io.seed);
      io.orb.userData.pulseAmp = 1.8;   // friends pulse brighter (scale only)
      XRPublisher.openDialog({
        title: `${io.name} brightens`,
        content: io.theme.befriendThanks(io.name),
        buttons: [{ label: 'Until next time', variant: 'primary' }],
      });
    };

    // ── The four personalities ───────────────────────────────────────────────
    // Each theme owns: shared materials, a voice (greeting / friend-greeting /
    // absorb epilogue / befriend thanks), and a branch() that builds its
    // 2nd/3rd conversation layer by chaining openDialog from onSelect.
    const THEMES = {
      ember: {
        mats: wispMats(0xffb469, 0xff5a1a, 0xffa14a),
        epithet: 'an ember-wisp',
        branchLabel: '"What do you burn for?"',
        absorbLabel: 'Absorb its warmth',
        greeting: (name) => `A warm orb crackles softly. "Closer, traveler — the night is wide and I am small. I am ${name}. I have kept this flame since the last hearth on these plains went cold."`,
        friendGreeting: (name) => `"The wind came, and your hands were there." ${name} bobs in a slow, contented circle. "Sit awhile. The flame knows you now."`,
        absorbEpilogue: (name) => `The warmth pours into your palms and ${name} greys like a spent coal. Somewhere, a hearth you will never see grows a little colder.`,
        befriendThanks: () => '"Warmth given is warmth doubled. I will burn the brighter for you, friend — let the wind try me now."',
        branch(io) {
          XRPublisher.openDialog({
            title: `${io.name} flares`,
            content: '"For the ones who camped here before the grass took the road back. Someone must remember warmth after the fires go out. So I burn. Quietly. On."',
            buttons: [
              chain('"And when the last fire dies?"', () => {
                const buttons = [];
                if (!befriendedSeeds.has(io.seed)) {
                  buttons.push(chain('Cup your hands around the flame', () => doBefriend(io), 'primary'));
                }
                buttons.push({ label: 'Let it gutter' });
                XRPublisher.openDialog({
                  title: `${io.name} bends low`,
                  content: '"Then I will be the last fire." The flame leans toward you, guttering. "Unless someone shields it when the wind comes."',
                  buttons,
                });
              }),
              { label: 'Step back from the heat' },
            ],
          });
        },
      },

      tide: {
        mats: wispMats(0x7fd4ff, 0x1a8ae0, 0x4ab8ff),
        epithet: 'a tide-wisp',
        branchLabel: '"Ask me your riddle."',
        absorbLabel: 'Absorb its light',
        greeting: (name) => `A cool blue orb sways like a buoy. "Mm. A walker, far from any shore. I am ${name}. I keep an old riddle the sea forgot to take back — answer it, and a drop of my light is yours."`,
        friendGreeting: (name) => `"The clever walker returns." ${name} ripples, pleased. "The moon is lighter when you are here."`,
        absorbEpilogue: (name) => `The blue light drains like an ebbing pool. ${name} does not resist. "Everything the sea gives," it whispers, "the sea expects back."`,
        befriendThanks: () => '"Then drift beside me when the tide is low, friend. Company is the one thing the sea never learned to carry off."',
        branch(io) {
          if (solvedRiddles.has(io.seed)) {
            XRPublisher.openDialog({
              title: `${io.name} hums`,
              content: '"You already carry my droplet, clever one. Listen instead — the moon is heavy tonight, and someone must hold her up."',
              buttons: [{ label: 'Listen awhile', variant: 'primary' }],
            });
            return;
          }
          // The keepOpen MULTI-STEP exchange: wrong answers keep the SAME
          // panel open (no close, no re-open) so the player just picks again —
          // that's the retry loop. Only the right answer chains onward, and
          // "Give up" is the plain close.
          XRPublisher.openDialog({
            title: `${io.name} swells`,
            content: '"I rise without wings. I fall without weight. I carry the moon in my arms and lay her at your feet. What am I?"',
            buttons: [
              { label: '"A dream"', keepOpen: true },
              chain('"The tide"', () => {
                solvedRiddles.add(io.seed);
                concludeWithLight(
                  `${io.name} laughs like surf`,
                  `"The tide, the tide! Sharp as sea-glass, you are." A cold bright droplet settles into your keeping — ${io.name} shines on, undimmed.`,
                );
              }),
              { label: '"The rain"', keepOpen: true },
              { label: 'Give up' },
            ],
          });
        },
      },

      verdant: {
        mats: wispMats(0x9fe08a, 0x2fae3f, 0x6fd45a),
        epithet: 'a meadow-wisp',
        branchLabel: '"What sleeps in this meadow?"',
        absorbLabel: 'Absorb its light',
        greeting: (name) => `A green orb startles upward. "Oh — roots and rain! You tread quietly. I am ${name}. I count the seeds this meadow keeps, and hum to the slow ones."`,
        friendGreeting: (name) => `"Soft steps!" ${name} spins a happy loop. "The meadow heard you coming and did not flinch, friend."`,
        absorbEpilogue: (name) => `The green glow sinks into you like spring into thawed ground. The husk that was ${name} sways on, seedless and grey.`,
        befriendThanks: () => '"Then the meadow will remember your steps kindly, and the slow seeds will hear two hums instead of one. Green keep you, friend."',
        branch(io) {
          XRPublisher.openDialog({
            title: `${io.name} hums low`,
            content: '"Ten thousand summers, folded small. Every seed is a promise the grass made to the sun. Most keep it. Some need... encouragement."',
            buttons: [
              chain('"And the ones that never wake?"', () => {
                const buttons = [];
                if (!befriendedSeeds.has(io.seed)) {
                  buttons.push(chain('Promise to tread lightly', () => doBefriend(io), 'primary'));
                }
                buttons.push({ label: 'Say nothing' });
                XRPublisher.openDialog({
                  title: `${io.name} dims gently`,
                  content: '"They become the quiet under everything — the dark the bright things stand on. Tread lightly here, and even the quiet will know your name."',
                  buttons,
                });
              }),
              { label: 'Nod and step back' },
            ],
          });
        },
      },

      umbral: {
        mats: wispMats(0xc9a8ff, 0x7a3aff, 0x9a6aff),
        epithet: 'a star-shard',
        branchLabel: '"What do you watch for?"',
        absorbLabel: 'Absorb its light',
        greeting: (name) => `A violet orb regards you. "You are luminous tonight — did you know? I am ${name}, fallen from a constellation whose name I am still falling away from."`,
        friendGreeting: (name) => `"You came back to watch." ${name} tilts starward. "The gaps seem smaller already, friend."`,
        absorbEpilogue: (name) => `${name} folds into a single point and settles behind your ribs like a held breath. Overhead, the night feels one star quieter.`,
        befriendThanks: () => '"Then tonight the gap where my star was is a little smaller. Watch with me sometimes, friend — the sky forgets its shape alone."',
        branch(io) {
          XRPublisher.openDialog({
            title: `${io.name} turns skyward`,
            content: '"The gaps. Stars die politely, but they leave gaps, and the gaps drift. I map them, so the sky remembers its own shape."',
            buttons: [
              chain('"Can a shard go home?"', () => {
                // The starkest choice-that-matters: the SAME third-layer
                // dialog offers both endings — carried (absorb) or kept
                // company (befriend). Both chain, so both use keepOpen.
                const buttons = [
                  chain('Carry the shard onward', () => doAbsorb(io)),
                ];
                if (!befriendedSeeds.has(io.seed)) {
                  buttons.push(chain('Keep it company awhile', () => doBefriend(io), 'primary'));
                }
                buttons.push({ label: 'Leave it to its vigil' });
                XRPublisher.openDialog({
                  title: `${io.name} considers`,
                  content: '"Home is a direction, not a place. A shard may be carried—" it dims, meaningfully, "—or it may be kept company. Both are kindnesses. Choose one."',
                  buttons,
                });
              }),
              { label: 'Leave it to its vigil' },
            ],
          });
        },
      },
    };
    const THEME_KEYS = Object.keys(THEMES);

    // ── Root + faded dialogs ──────────────────────────────────────────────────
    const openFadedDialog = (io) => {
      const buttons = [];
      // Returning light is the counterweight choice: −1 ✦, the husk rekindles
      // (Set delete + shared-material swap back — create() stays consistent).
      if (state.n > 0) {
        buttons.push(chain('Return its light (✦ −1)', () => {
          absorbedSeeds.delete(io.seed);
          setOrbLit(io.orb, io.theme, true);
          addLight(-1);
          XRPublisher.openDialog({
            title: `${io.name} rekindles`,
            content: `Colour floods back like breath into cold hands. ${io.name} spins once, remembering itself. "That was yours to keep," it says quietly. "Thank you for choosing otherwise."`,
            buttons: [{ label: 'Watch it glow', variant: 'primary' }],
          });
        }, 'primary'));
      }
      buttons.push({ label: 'Leave it be' });
      XRPublisher.openDialog({
        title: 'A faded husk',
        content: `What was ${io.name} drifts here, grey and slow — a lantern with its door left open.${state.n > 0 ? ' The light you carry tugs toward it.' : ''}`,
        buttons,
      });
    };

    const openRootDialog = (io) => {
      if (io.orb.userData.dimmed) { openFadedDialog(io); return; }
      const befriended = befriendedSeeds.has(io.seed);
      const buttons = [chain(io.theme.branchLabel, () => io.theme.branch(io), 'primary')];
      // Friends cannot be absorbed — the bond protects them. That asymmetry
      // is what makes befriending a real choice instead of a flavour button.
      if (!befriended) {
        buttons.push(chain(io.theme.absorbLabel, () => doAbsorb(io)));
      }
      buttons.push({ label: 'Leave quietly' });   // no onSelect → just closes
      XRPublisher.openDialog({
        title: `${io.name}, ${io.theme.epithet}`,
        content: (befriended ? io.theme.friendGreeting(io.name) : io.theme.greeting(io.name) + timeFlavor()),
        buttons,
        dismissDistance: 8,   // wander off mid-chat and it closes itself
      });
    };

    // ── The decoration ────────────────────────────────────────────────────────
    XRPublisher.registerDecoration({
      name: 'floating-orb',          // part of the placement seed — renaming relocates every wisp
      density: DENSITY,
      minSpacing: MIN_SPACING,
      minWaterDistance: 2,
      interactable: true,            // "E to interact" (forces per-object mount)
      interactionRadius: INTERACT_RADIUS,
      // STATEFUL prompt: a function, re-resolved ~10Hz by the proximity loop.
      // identityFor is memoized, the Sets are O(1) — cheap enough to poll.
      interactionPrompt: (spawn) => {
        const id = identityFor(spawn.seed);
        if (absorbedSeeds.has(spawn.seed)) return `${id.name} (faded)`;
        if (befriendedSeeds.has(spawn.seed)) return `greet ${id.name}`;
        return `speak with ${id.name}`;
      },
      create(spawn) {
        const id = identityFor(spawn.seed);
        const theme = THEMES[id.themeKey];
        const rng = spawn.rng;

        // Fixed draw order — every rng draw happens unconditionally, so the
        // absorbed/befriended branches below can't shift sibling variation.
        const baseScale = 0.85 + rng() * 0.35;
        const baseY = HOVER_MIN + rng() * (HOVER_MAX - HOVER_MIN);
        const ringTiltX = Math.PI / 2 + (rng() - 0.5) * 0.9;
        const ringTiltZ = (rng() - 0.5) * 0.6;
        const phase = rng() * Math.PI * 2;
        const spinLit = 0.35 + rng() * 0.5;
        const bobAmpLit = 0.22 + rng() * 0.14;
        const bobHz = 0.9 + rng() * 0.5;
        const pulseHz = 1.4 + rng() * 0.8;

        const g = new THREE.Group();
        const core = new THREE.Mesh(coreGeo, theme.mats.core);
        const ring = new THREE.Mesh(ringGeo, theme.mats.ring);
        ring.rotation.set(ringTiltX, 0, ringTiltZ);
        // No castShadow: these read as light SOURCES — a wisp throwing a
        // crisp shadow reads wrong, and skipping it keeps them off the
        // shadow-pass caster list entirely.
        g.add(core, ring);
        g.position.y = baseY;
        g.scale.setScalar(baseScale);
        g.userData = {
          core, ring, seed: spawn.seed, dimmed: false,
          phase, bobHz, pulseHz, baseScale, baseY,
          spinLit, bobAmpLit, spin: spinLit, bobAmp: bobAmpLit,
          pulseAmp: befriendedSeeds.has(spawn.seed) ? 1.8 : 1.0,
        };
        // Session persistence: a wisp absorbed earlier this session comes
        // back as a husk when its chunk remounts.
        if (absorbedSeeds.has(spawn.seed)) setOrbLit(g, theme, false);
        return g;
      },
      // Per spawn per frame — allocation-free by contract. Everything below
      // is userData reads + Math.sin + in-place transform writes.
      update(orb, _delta, elapsed) {
        const u = orb.userData;
        orb.rotation.y = elapsed * u.spin + u.phase;
        orb.position.y = u.baseY + Math.sin(elapsed * u.bobHz + u.phase) * u.bobAmp;
        // "Pulse" = SCALE breathing, deliberately NOT emissiveIntensity: the
        // theme materials are SHARED by every wisp of that colour, so
        // mutating one would pulse the whole world in lockstep (and per-orb
        // material clones would defeat the sharing). Husks don't pulse.
        const pulse = u.dimmed ? 0 : Math.sin(elapsed * u.pulseHz + u.phase) * 0.06 * u.pulseAmp;
        orb.scale.setScalar(u.baseScale * (1 + pulse));
      },
      onInteract({ object, spawn }) {
        if (!HAS_DIALOG) return;   // old runtime: orbs stay ambient scenery
        const id = identityFor(spawn.seed);
        openRootDialog({ orb: object, seed: spawn.seed, name: id.name, theme: THEMES[id.themeKey] });
      },
      // Explicit no-op: geometry AND materials are shared module-scope
      // singletons — the default cleanup would dispose this orb's (shared)
      // geometry on chunk unload and break every other wisp.
      dispose() {},
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] ${THEME_KEYS.length} wisp personalities registered (dialog=${HAS_DIALOG}, hud=${HAS_HUD})`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
