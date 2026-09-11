# Changelog

## Unreleased

### Packaging: dual build for npm import consumers

- **The default `.` export (ES + CJS) now externalizes `three`, `react`, and `react-dom`** — import consumers share a single three/react instance with their own app, fixing the duplicate-instance breakage for react-three-fiber hosts. Bundle: 13.3 MB → 8.7 MB (ES). Deep three specifiers are emitted extension-complete (`three/examples/jsm/...GLTFLoader.js`) so strict Node/ESM resolution works.
- **New `./standalone` subpath export** — the fully self-contained ES bundle (everything inlined, previous behavior) for Vite-alias/Electron consumers. The UMD build is unchanged (script-tag worlds stay drop-in).
- **Runtime `dependencies` moved to `devDependencies`** — everything is compiled into dist, so consumers install zero transitive deps; the drei@9 ↔ fiber@9 ERESOLVE that broke plain `npm install` is gone.
- `three` peer range narrowed to `>=0.170.0 <0.181.0` (TSL API churn makes an open ceiling untestable).
- `dist/THIRD_PARTY_NOTICES.txt` now generated at build time (bundled MIT/BSD package attribution inside the GPL artifact).
- CI added (`.github/workflows/ci.yml`): wasm build with Rust caching, typecheck (blocking), lint ratchet, dual build, and a pack-install-import smoke test against a peers-only scratch project. `publish.yml` publishes on `v*` tags (provenance pending `repository.url` reconciliation).

### Performance

- **Peer decode + interpolation moved fully into the network worker.** Binary state packets are decoded AND jitter-buffered/interpolated in Rust inside the worker; transforms reach the main thread via one zero-copy ping-pong buffer per frame instead of per-packet JSON build → structured clone → `JSON.parse` → per-Participant listener fan-out. Remote avatars now ride the Rust hermite/ring-buffer interpolator (60 ms configurable jitter buffer, `setInterpRenderDelay`) instead of the main-thread lerp-toward-latest. Main-thread cost no longer scales with peer count × packet rate.
- **VR IK restructured**: the 10-iteration CCD arm solve now tracks chain world transforms in local math (verified numerically identical to the scene-graph solver) instead of ~60 full arm-subtree `updateWorldMatrix` cascades per frame, and the six per-torso-bone world-matrix cascades collapse into one rig-wide update per frame. `?ikclassic=1` restores the old solver for A/B.
- Terrain flood-fill water-distance now double-buffers instead of cloning the full grid each of its 10 passes (bit-identical output, unit-tested).
- **Marching-cubes mountain meshing now welds while it marches.** The old two-pass build materialized an unwelded triangle soup (f32 positions + f64 colors/depths per soup vertex, typically ~6× the welded count) alongside the weld tables — the largest transient of a mountain build and the iOS Safari memory-watchdog trigger. The weld now happens inline at emission (identical vertex order → identical f64 accumulation), eliminating the soup entirely, plus a never-consumed soup index array. **Bit-parity verified** against the original algorithm (kept as a test reference) across sphere/blended-lobe/edge-case SDFs at multiple cell sizes — every position, color, depth, and index bit-identical. Dormant ECS scaffolding also feature-gated out of the WASM binary.
- **The navmesh worker is now a persistent NPC simulation worker.** It owns the navmesh, the mirrored decoration-obstacle registry, and per-NPC agents: spawn/wander point sampling, `findSmoothPath`, and per-tick steering (`findNearestPoly` + `moveAlongSurface`) all run worker-side. The navmesh no longer structured-clones to the main thread on every rebuild, per-frame navcat queries left the main thread, and the per-vertex world transform + underwater-triangle filter during rebuilds moved into the worker too (the main thread only copies raw chunk buffers + matrices, transferred zero-copy). Sync main-thread fallback retained for worker-less environments. Verified with a headless worker sim test (build → spawn → path → steering to path end).

### Fixed

- **Multiplayer receive path no longer re-renders the participant tree on repeated profile announces.** p2pcf fires `peerconnect` on datachannel renegotiations too (e.g. proximity voice attaching when a peer walks near); each event re-broadcast the profile, and every receiver's `updateParticipantProfile` built a new participants array even for no-op updates. Now: announces are deduped per peer on the sender, the store update is identity-guarded, and the legacy-JSON `setDisplayName` per-packet setState is equality-guarded. The synthetic-peer harness (`window.__xrpFakePeers`) also installs with the bridge instead of requiring a live signaling connection.
- **Mobile (WebGL renderer): sky, water, and avatars no longer vanish when a world contains NPCs/VRM models.** `createVRMLoaderPlugin` defaulted to the WebGPU-only `MToonNodeMaterial` and 7 of 8 call sites (NPCObject, ModelObject, EnvironmentFront, Portal, ThreeVideo, ThreeObjectFront) never passed the renderer flag. A node material has no GLSL source, so WebGLRenderer threw `undefined is not an object (evaluating '….replace')` in `acquireProgram` on every frame — and an exception mid-render aborts the rest of that frame's draw list, silently skipping everything sorted after the broken avatar (sky, water, the whole transparent pass) while terrain/trees still drew. The loader now resolves the renderer kind itself from `__xrWebGPU`; explicit flags still win.
- Worker bundles no longer embed `sourceMappingURL` comments — the base64-inlined worker blobs made Safari resolve the map path against the blob origin and log "Not allowed to load local resource: blob://null…js.map" access-control errors on every world load.
- **Adding an NPC block in the in-world editor no longer blacks out the render.** Fresh npc blocks had no avatar URL, so `GLTFLoader('')` fetched the page's own HTML and threw (`Unexpected token '<'`) through suspense, unmounting the canvas. Fixed at both layers: the editor seeds new npc blocks with the shipped blank avatar, and `NPCObject` falls back to it whenever the URL is empty.
- `THREE.TSL: Vertex attribute "normal" not found` console errors from the video/model dialog triangles on WebGPU — position-only `setFromPoints` geometries now carry normals + uvs (the pitfall WaypointRail already documented).
- `<three-sky-block>` renders again in auto-init worlds (the scanner collected it but the environment props hardcoded `sky: ''`).
- Image block `transparent` attribute works from the editor parser (parser emitted `"true"/"false"`, renderer expected `"1"`).
- Explicit `setApiBase()` / `window.XRP_API_BASE` now beats a stale localStorage entry for world-write API resolution (`getApiBaseUrl`).
- `onMessage` now rejects reserved `__xrp:*` channels like `broadcast` already did.
- `uploadWorldAsset` declared return type includes `url`/`quarantined`; `getAudioAnalyser` documents that `fftSize` only applies on first call.
- NPC mixamo loader: passing an array of animation URLs no longer hands the whole array to `loadAsync` (latent runtime error).
- `useLoader` in ModelObject dropped a 5th "error callback" argument that react-three-fiber never supported (it was silently ignored).

### Changed

- **Remote participants now use the local Player's natural-idle system** instead of looping the raw idle clip: the idle action becomes a frozen pose layer scrubbed between random poses (middle 60% of the clip, distance-adaptive easing, micro speed variation, jitter skipping, natural pauses) with a low-weight breathing loop beside it. Extracted to `src/utils/naturalIdle.ts` as a per-instance port of Player.jsx's system; the existing participant animation state machine keeps owning the idle weight and the breathing layer follows it, so swim/fly/riding blends behave unchanged.

### Docs & examples

- **All example plugins and their teaching docs (59-64) migrated off deprecated `spawn.worldPosition`** to `renderPosition` — every hand-applied ½-chunk correction removed. `getWorldTowns` results (worker-frame per docs/31) are now converted to render-frame once at ingestion in settler-huts/town-center; town keys still derive from raw worker coords so seeded names/spokes/claims are unchanged. Fixes a latent half-chunk offset in town-center's "jump to nearest town" teleport.
- Rotation units documented honestly: model + light block schemas now say DEGREES (they convert at runtime; all other blocks take radians). README spot-light example fixed (`rotationx="-90"`, was the radian value `-1.57`).
- Bloom described accurately as a threshold pipeline (README + `setPostProcessing` docstring) — bright surfaces above the luminance threshold bloom; it is not a per-material selection mask.
- `setWorldState` docstring/example now teaches `spawn.renderPosition`; `addModel` documents its `''` invalid-spec return.

### Schemas (honesty pass)

- Marked NOT-YET-IMPLEMENTED attributes as such instead of silently accepting them: light `castshadow`/`shadow*`, NPC `scalex/y/z`, terrain `renderdistance`, sky `turbidity`/`miedirectionalg`/`miecoefficient`.
- Added missing real attributes: sky `skyurl`, networking `signalingurl`/`roomslug`.
- Text block schema now states it renders a placeholder (deprecated pending a real text renderer).

### Quality gate

- `npm run typecheck` is at **zero errors** (was 33) and CI-blocking.
- Lint warnings ratcheted 109 → 95 (`prefer-const` auto-fixed); remaining debt is react-hooks warnings in legacy components, gated behind a future browser smoke test.

## 2.0.0 — 2026-07-06

First general-availability release of `@antpb/xr-publisher` as a standalone npm package.

### Highlights

- **WebGPU rendering by default** with a complete WebGL fallback path (`?renderer=webgl`) — every node-material component ships a WebGL twin.
- **WASM procedural terrain**: Rust-powered heightfield, biome, mountain (SDF + marching cubes), and decoration-spawn generation in a Web Worker, bit-exact with the JS fallback for multiplayer coherence. Ocean basins, grove-clustered trees, shore-aware GPU water waves.
- **Plugin system**:
  - `registerBlockType` — editor-placeable custom blocks with typed inspector fields (number/string/longtext/url/select/color/boolean), gizmo transforms, and save round-trip.
  - `registerDecoration` — deterministic terrain-scattered objects with placement filters, tree/mountain anchors, instancing, ground patches, collision, and interactables.
  - Programmatic world building (`addModel`, `addTerrainRegion`, `registerTerrainSurface`), in-world dialogs, HUD overlays, menu items, selective-bloom post-processing, room-synced time of day, and persisted world state.
- **P2P multiplayer** (P2PCF/WebRTC): binary delta protocol with keyframes, distance-tiered send rates, VRM avatars with LOD, voice chat.
- **In-world editor**: edit published worlds in the browser with outliner, schema-driven inspector, gizmo, undo/redo, and delegated editor tokens.

### Breaking: self-contained default assets (no CDN references)

Default assets (avatar VRM, animation FBX clips, grid GLB, font, textures) were previously hotlinked from a private CDN in several places (`defaultSettings`, the NPC animation table). All default-asset references now resolve through the package's own seeded-asset mechanism to `/assets/defaults/<path>`, and the full defaults tree ships in `dist/assets/defaults/` — deployments serve that folder (or point `threeObjectPlugin` at a custom asset root). The asset-URL transform now also covers `.jpg`/`.woff`, un-inlining the canopy texture and UI font from the bundles (−138 KB per bundle format).

**Deployment note**: pages that relied on the old CDN defaults must serve `/assets/defaults/` (copy it from `dist/`) or pass `threeObjectPlugin`.

### Breaking: no baked-in API host

Earlier builds hardcoded a private API worker origin (and one hardcoded character author) into the NPC chat, editor-token, and asset-browser code paths. The package now ships with **no baked-in host**. The publishing-API origin resolves: `apiBase` constructor option / `XRPublisher.setApiBase(url)` → `window.XRP_API_BASE` → localStorage `xr_publisher_edge_api_url` → same origin. Published worlds are served by the API worker itself, so they need no configuration; dev harnesses and non-world pages must now inject their deployment's origin via one of the first three. NPC chat resolves the character author from the world's identity (URL path / configured identity) instead of a hardcoded account.

### Packaging changes in this release

- TypeScript declarations now ship (`dist/types/`), wired via `types` and a proper `exports` map.
- `LICENSE` (GPL-3.0-only) included; `license`, `repository`, `keywords`, and `description` added to package.json.
- Source maps are still generated for local debugging but excluded from the npm tarball (~110 MB smaller).
- Removed ~60 dead source files and 9 unused dependencies; deleted debug console logging throughout (`console.warn`/`error` diagnostics retained).
- `npm run lint` works again (package-local ESLint config; the monorepo root config was broken).

### Known issues

- `npm run typecheck` reports 33 pre-existing type errors in internal modules (implicit-return-type and buffer-type mismatches); they do not affect the shipped bundles or the emitted public declarations. Driving this to zero is planned for a follow-up release.
- 32 `react-hooks/rules-of-hooks` lint warnings in four legacy components (early-return-before-hooks patterns, stable in practice).
- Building from a fresh clone requires generating the WASM terrain worker first (`npm run build:wasm`, needs rustup with the `wasm32-unknown-unknown` target) — `src/workers/wasm/` is generated, not committed. The published npm package needs no Rust toolchain; the WASM is already inlined in the bundles.
