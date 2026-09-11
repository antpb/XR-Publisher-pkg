/**
 * block-lab — XR Publisher CUSTOM BLOCK stress-test plugin
 * ---------------------------------------------------------------------------
 * The reference (and torture test) for `XRPublisher.registerBlockType`:
 * plugins registering EDITOR-PLACEABLE block types. Unlike decorations
 * (terrain-scattered), a custom block is an authored object — it appears in
 * the in-world editor's Add menu, gets a generated inspector panel from its
 * typed `fields`, moves with the gizmo (transform is ENGINE-owned; create()
 * builds at local origin), and round-trips through save as
 * `<three-block-lab-{name}-block>` elements.
 *
 * The four blocks deliberately cover every field type and lifecycle path:
 *
 *  - BEACON  — every field type in one inspector (number+min/max/step,
 *              string, longtext, url, select with labeled options, color,
 *              boolean). update() applies color/height/label/active IN
 *              PLACE; mode/emblemurl changes return false → the engine
 *              disposes + recreates (both paths exercised). tick() drives
 *              pulse/strobe. ctx.isWebGPU branches emissive intensity
 *              (bloom-ready on WebGPU worlds with postFX).
 *  - SPINNER — pure in-place update() for every field + tick() rotation +
 *              a logging dispose() (watch the console to verify disposal
 *              fires on delete AND on recreate).
 *  - STATUE  — async model path: create() returns an empty Group instantly,
 *              then XRPublisher.loadModel() populates it. Tint clones
 *              materials per instance (the loaded scene is SHARED — never
 *              mutate or dispose its geometry). Custom dispose() frees only
 *              the cloned materials.
 *  - NOCODE  — no update, no tick, no dispose: the minimal spec. Every
 *              inspector edit disposes + recreates (the default path).
 *
 * Contracts to copy into your own block plugin:
 *  - `plugin:` MUST equal your build filename slug ({slug}-xr-publisher-
 *    plugin.umd.js) — the server strips saved blocks of inactive plugins.
 *  - Use ctx.rng (seeded per instance), never Math.random, for generative
 *    variation that must be stable across visits/renderers.
 *  - create() must be RE-RUNNABLE (React StrictMode double-invokes in dev).
 *  - Default cleanup deep-disposes geometry+materials; anything shared at
 *    module level (or loadModel-cached) needs your own dispose().
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'block-lab';
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
    if (typeof XRPublisher.registerBlockType !== 'function') {
      console.error(`[${PLUGIN_ID}] this runtime build has no registerBlockType — update the engine`);
      return;
    }

    // Label plate painter — one canvas texture per beacon (per-instance, so
    // the default/explicit dispose story stays simple).
    const paintLabel = (text) => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(10,14,24,0.85)'; g.fillRect(0, 0, 256, 64);
      g.strokeStyle = '#5cc8f2'; g.lineWidth = 3; g.strokeRect(2, 2, 252, 60);
      g.fillStyle = '#eaf6ff'; g.font = 'bold 28px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(text || '').slice(0, 18), 128, 34);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // ── BEACON — every field type, in-place update + forced-recreate ──────
    XRPublisher.registerBlockType({
      plugin: PLUGIN_ID,
      name: 'beacon',
      title: 'Lab Beacon',
      description: 'Stress-test beacon — every inspector field type in one block',
      fields: [
        { key: 'height', type: 'number', label: 'Height', default: 2, min: 0.5, max: 10, step: 0.5 },
        { key: 'label', type: 'string', label: 'Label', default: 'Beacon' },
        { key: 'notes', type: 'longtext', label: 'Notes', default: '' },
        { key: 'emblemurl', type: 'url', label: 'Emblem Image', default: '' },
        { key: 'mode', type: 'select', label: 'Mode', default: 'pulse', options: [
          { value: 'pulse', label: 'Pulse' },
          { value: 'steady', label: 'Steady' },
          { value: 'strobe', label: 'Strobe' },
        ] },
        { key: 'color', type: 'color', label: 'Color', default: '#5cc8f2' },
        { key: 'active', type: 'boolean', label: 'Active', default: true },
      ],
      create({ props, THREE: T, isWebGPU, rng }) {
        const group = new T.Group();

        const pedestal = new T.Mesh(
          new T.CylinderGeometry(0.42, 0.5, 0.3, 20),
          new T.MeshStandardMaterial({ color: '#3a4150', roughness: 0.9 }),
        );
        pedestal.position.y = 0.15;
        group.add(pedestal);

        const pole = new T.Mesh(
          new T.CylinderGeometry(0.06, 0.08, 1, 10),
          new T.MeshStandardMaterial({ color: '#6a7383', roughness: 0.7 }),
        );
        group.add(pole);

        // Bloom-ready on WebGPU (postFX blooms emissive-bearing materials);
        // WebGL keeps a sane un-bloomed brightness. ctx.isWebGPU exercise.
        const orbMat = new T.MeshStandardMaterial({
          color: props.color, emissive: props.color,
          emissiveIntensity: isWebGPU ? 2.0 : 1.0,
          roughness: 0.3,
        });
        const orb = new T.Mesh(new T.SphereGeometry(0.28, 20, 14), orbMat);
        group.add(orb);

        const labelMat = new T.MeshBasicMaterial({
          map: paintLabel(props.label), transparent: true, side: T.DoubleSide,
        });
        const plate = new T.Mesh(new T.PlaneGeometry(1.2, 0.3), labelMat);
        group.add(plate);

        if (props.emblemurl) {
          new T.TextureLoader().load(String(props.emblemurl), (tex) => {
            tex.colorSpace = T.SRGBColorSpace;
            const emblem = new T.Mesh(
              new T.PlaneGeometry(0.7, 0.7),
              new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide }),
            );
            emblem.position.set(0, 0.6, 0.06);
            emblem.name = 'emblem';
            group.add(emblem);
          });
        }

        // Seeded flourish: a stable per-instance yaw so rows of beacons
        // don't look stamped (ctx.rng — same angle every load).
        group.rotation.y = rng() * Math.PI * 2;

        group.userData.parts = { pedestal, pole, orb, plate };
        group.userData.state = { mode: props.mode, active: !!props.active, phase: rng() * Math.PI * 2 };
        applyBeaconLayout(group, Number(props.height) || 2);
        return group;
      },
      update(object, props, prevProps) {
        // Structural fields force the recreate path (also validates it).
        if (props.mode !== prevProps.mode || props.emblemurl !== prevProps.emblemurl) return false;
        const { orb, plate } = object.userData.parts;
        if (props.color !== prevProps.color) {
          orb.material.color.set(props.color);
          orb.material.emissive.set(props.color);
        }
        if (props.label !== prevProps.label) {
          const old = plate.material.map;
          plate.material.map = paintLabel(props.label);
          plate.material.needsUpdate = true;
          if (old) old.dispose();
        }
        if (props.height !== prevProps.height) applyBeaconLayout(object, Number(props.height) || 2);
        object.userData.state.active = !!props.active;
        // notes has no visual — nothing to do, still handled in place.
        return true;
      },
      tick(object, _dt, elapsed) {
        const st = object.userData.state;
        const orb = object.userData.parts.orb;
        if (!st.active) { orb.material.emissiveIntensity = 0.05; return; }
        const base = orb.material.userData.baseIntensity
          ?? (orb.material.userData.baseIntensity = orb.material.emissiveIntensity);
        if (st.mode === 'steady') orb.material.emissiveIntensity = base;
        else if (st.mode === 'strobe') orb.material.emissiveIntensity = (Math.floor(elapsed * 4) % 2) ? base : 0.05;
        else orb.material.emissiveIntensity = base * (0.55 + 0.45 * Math.sin(elapsed * 2.4 + st.phase));
      },
      // No dispose(): everything here is per-instance, so the engine's
      // default deep dispose is exactly right. (The label canvas texture on
      // the material is freed with the material.)
    });

    function applyBeaconLayout(group, height) {
      const { pole, orb, plate } = group.userData.parts;
      pole.scale.y = height;
      pole.position.y = 0.3 + height / 2;
      orb.position.y = 0.3 + height + 0.28;
      plate.position.y = 0.3 + height + 0.75;
    }

    // ── SPINNER — pure in-place update + tick + logging dispose ───────────
    XRPublisher.registerBlockType({
      plugin: PLUGIN_ID,
      name: 'spinner',
      title: 'Lab Spinner',
      description: 'Rotating knot — in-place updates, tick animation, logged dispose',
      fields: [
        { key: 'speed', type: 'number', label: 'Speed', default: 1, min: 0, max: 10, step: 0.1 },
        { key: 'direction', type: 'select', label: 'Direction', default: 'cw', options: [
          { value: 'cw', label: 'Clockwise' },
          { value: 'ccw', label: 'Counter-clockwise' },
        ] },
        { key: 'wireframe', type: 'boolean', label: 'Wireframe', default: false },
      ],
      create({ props, THREE: T }) {
        const mesh = new T.Mesh(
          new T.TorusKnotGeometry(0.5, 0.16, 96, 12),
          new T.MeshStandardMaterial({
            color: '#ffb84d', roughness: 0.35, metalness: 0.2,
            wireframe: !!props.wireframe,
          }),
        );
        mesh.position.y = 1.1;
        mesh.userData.spin = { speed: Number(props.speed) || 0, dir: props.direction === 'ccw' ? -1 : 1 };
        return mesh;
      },
      update(object, props) {
        object.userData.spin.speed = Number(props.speed) || 0;
        object.userData.spin.dir = props.direction === 'ccw' ? -1 : 1;
        object.material.wireframe = !!props.wireframe;
        return true; // everything handled — this block NEVER recreates
      },
      tick(object, dt) {
        object.rotation.y += object.userData.spin.speed * object.userData.spin.dir * dt;
      },
      dispose(object) {
        console.log(`[${PLUGIN_ID}] spinner disposed`); // verify on delete
        object.geometry.dispose();
        object.material.dispose();
      },
    });

    // ── STATUE — async loadModel + shared-scene-safe tint/dispose ─────────
    XRPublisher.registerBlockType({
      plugin: PLUGIN_ID,
      name: 'statue',
      title: 'Lab Statue',
      description: 'Async glTF via loadModel — drop a GLB from the asset drawer onto Model URL',
      fields: [
        { key: 'modelurl', type: 'url', label: 'Model URL', default: '' },
        { key: 'tint', type: 'color', label: 'Tint', default: '#ffffff' },
      ],
      create({ props, THREE: T }) {
        const group = new T.Group();
        group.userData.tintedMats = [];
        if (!props.modelurl) {
          // Empty-URL placeholder so the block is visible/selectable.
          const ph = new T.Mesh(
            new T.BoxGeometry(0.6, 1.2, 0.6),
            new T.MeshStandardMaterial({ color: '#8892a6', wireframe: true }),
          );
          ph.position.y = 0.6;
          ph.userData.placeholder = true;
          group.add(ph);
          return group;
        }
        XRPublisher.loadModel(String(props.modelurl)).then((scene) => {
          if (group.userData.disposed) return; // block was deleted mid-load
          const clone = scene.clone(true);
          // The loaded scene (and the clone's geometry/materials) are SHARED
          // via the loadModel cache — tint through per-instance material
          // clones and never touch the originals.
          clone.traverse((n) => {
            if (n.isMesh && n.material) {
              n.material = n.material.clone();
              if (n.material.color) n.material.color.multiply(new T.Color(props.tint));
              group.userData.tintedMats.push(n.material);
            }
          });
          group.add(clone);
        }).catch((e) => console.error(`[${PLUGIN_ID}] statue model failed to load`, e));
        return group;
      },
      update(object, props, prevProps) {
        // Both fields need a rebuild: a new URL must reload, and tint is a
        // destructive multiply on the cloned materials — recreate re-clones
        // from the pristine cached scene. Returning false ALWAYS is a valid
        // spec choice when in-place patching isn't worth the bookkeeping.
        if (props.modelurl !== prevProps.modelurl || props.tint !== prevProps.tint) return false;
        return true;
      },
      dispose(object) {
        // Geometry is SHARED with the loadModel cache — free ONLY the
        // per-instance cloned materials (+ the placeholder's own bits).
        object.userData.disposed = true;
        for (const m of object.userData.tintedMats || []) m.dispose();
        object.traverse((n) => {
          if (n.userData && n.userData.placeholder) {
            n.geometry.dispose();
            n.material.dispose();
          }
        });
      },
    });

    // ── NOCODE — the minimal spec: create only, default lifecycle ─────────
    XRPublisher.registerBlockType({
      plugin: PLUGIN_ID,
      name: 'nocode',
      title: 'Lab Crystal',
      description: 'Minimal spec — no update/tick/dispose; every edit recreates',
      fields: [
        { key: 'size', type: 'number', label: 'Size', default: 1, min: 0.1, max: 5, step: 0.1 },
      ],
      create({ props, THREE: T, rng }) {
        const size = Number(props.size) || 1;
        const mesh = new T.Mesh(
          new T.IcosahedronGeometry(0.5 * size, 0),
          new T.MeshStandardMaterial({
            color: new T.Color().setHSL(rng(), 0.55, 0.6), // seeded, stable per instance
            roughness: 0.2, metalness: 0.1, flatShading: true,
          }),
        );
        mesh.position.y = 0.5 * size;
        return mesh;
      },
    });

    registered = true;
    console.log(`[${PLUGIN_ID}] 4 custom block types registered (beacon, spinner, statue, nocode)`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
