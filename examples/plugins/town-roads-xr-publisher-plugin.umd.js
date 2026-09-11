/**
 * town-roads — XR Publisher plugin (WORLD ROAD NETWORK)
 *
 * This plugin does ONE thing: turn on the engine's deterministic town + road
 * network. The terrain worker discovers towns, plans the roads (routing around
 * water/rock/mountains), and BAKES a dirt road straight into each terrain chunk
 * the moment it's generated — known up front, never recomputed as the player
 * moves, grass/trees cleared off it automatically.
 *
 * It places NO structures and lays NO plazas — town VISUALS (cobblestone, GLB
 * buildings, monuments) are owned by whatever town-decoration plugin you run.
 * If that plugin needs the town centres, it can read them from
 * XRPublisher.getWorldTowns(bounds) (same deterministic network the roads use).
 *
 * Deploy: copy into the api `plugins/` dir, `npm run upload-build <build-file>`.
 */
if (typeof window !== 'undefined') {
(() => {
  const PLUGIN_ID = 'town-roads';

  // ── Configure me ──────────────────────────────────────────────────────────
  const ROAD = {
    enabled: true,
    townCell: 760,        // one town CANDIDATE per this-size cell (rare)
    minClearance: 95,     // a town needs a big buildable clearing
    roadWidth: 7,         // dirt road width
    superTile: 6000,      // road network planned per fixed 6km tile (cached once)
    maxEdge: 1700,        // longest road between two town centres
    cellSize: 16,         // road-planner cost-grid resolution
  };
  // ──────────────────────────────────────────────────────────────────────────

  let done = false;
  const waitForRuntime = () => new Promise((resolve) => {
    if (window.XRPublisher) { resolve(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      if (window.XRPublisher || tries++ > 200) { clearInterval(iv); resolve(); }
    }, 50);
  });

  const init = async () => {
    if (done) return;
    await waitForRuntime();
    const { XRPublisher } = window;
    if (!XRPublisher || typeof XRPublisher.configureWorldRoads !== 'function') {
      console.error(`[${PLUGIN_ID}] runtime too old (needs configureWorldRoads)`);
      return;
    }
    // Turn world roads ON. That's it — the engine bakes them into the terrain.
    XRPublisher.configureWorldRoads(ROAD);
    done = true;
    console.log(`[${PLUGIN_ID}] world roads enabled — engine bakes them into the terrain`);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 300);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  }
})();
}
