/**
 * canopy-lanterns — XR Publisher decoration plugin
 * `anchor:'tree'` places spawns in the canopies of engine trees; `density`
 * is the per-tree chance. spawn.anchorScale / anchorRadius describe the crown.
 * Deploy: copy into api `plugins/`, run `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'canopy-lanterns';
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

    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffcc66, emissive: 0xaa6600, emissiveIntensity: 0.7, roughness: 0.5,
    });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8, metalness: 0.4 });

    XRPublisher.registerDecoration({
      name: 'canopy-lantern',
      anchor: 'tree',            // ← anchor on the canopy UNDERSIDE
      density: 0.4,              // ~40% of trees get one
      // The anchor sits on a REAL canopy blob's underside (local y=0 = the
      // leaf surface). Attach the lantern THERE — its top touches the leaf,
      // globe just below on a short cord. No long fake drop: the placement is
      // accurate, so the lantern genuinely hangs off the foliage.
      create(spawn) {
        const g = new THREE.Group();
        const cord = 0.12;
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, cord, 4), ringMat);
        string.position.y = -cord / 2;              // top at y=0, on the leaf surface
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 8), ringMat);
        cap.position.y = -cord + 0.02;
        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), lanternMat);
        globe.position.y = -cord - 0.26;
        g.add(string, cap, globe);
        return g;
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
