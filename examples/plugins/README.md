# Deployable Decoration Plugins

Each `*-xr-publisher-plugin.umd.js` file here is a **drop-in plugin** for the
XR Publisher API. They register procedural **decorations** (via
`XRPublisher.registerDecoration`) instead of a scene object, but otherwise
take the same self-executing form as `rotating-red-cube-block`'s renderer.

These are the deployable twins of the learn-by-reading pages in
[`../decorations/`](../decorations/). The HTML pages are for browsing locally
with `npm run dev`; these files are for shipping to a live world.

## ⚠️ Flat files, no subfolders, no manifests

`scripts/upload-build.js` finds plugins with:

```js
readdirSync('plugins').filter(f => f.endsWith('-xr-publisher-plugin.umd.js'))
```

That scan is **NOT recursive** and matches **files**, not folders. So:

- A plugin in a subfolder (`plugins/campfires/campfires-…umd.js`) is **invisible** —
  `readdirSync` only sees the `campfires` directory, which doesn't match.
  The file must sit **directly** in `plugins/`.
- `manifest.json` is **never read** by the uploader or the worker
  (`/api/plugins/set-active` just stores the array of *filenames*). Bundling a
  `manifest.json` per plugin is dead weight — and if you flatten several
  folders into `plugins/`, every `manifest.json` collides on one name.

So each plugin here is a **single, uniquely-named `.umd.js` file** at the top
level of this directory. Drop any of them straight into your api `plugins/`
folder — no renaming, no nesting, no collisions.

## Deploy

```bash
# from your api/ project — copy the file(s) you want, FLAT into plugins/:
cp /path/to/xr-publisher/examples/plugins/campfires-xr-publisher-plugin.umd.js plugins/
cp /path/to/xr-publisher/examples/plugins/rock-field-xr-publisher-plugin.umd.js plugins/

# upload a build — plugins ride along automatically:
npm run upload-build dist/xr-publisher.umd.js
# → uploads the build, then every plugins/*-xr-publisher-plugin.umd.js,
#   then calls /api/plugins/set-active with the list.
```

To remove a plugin, delete its file from `plugins/` and re-run — `set-active`
reflects whatever is present. Each plugin is independent; drop in any subset.

> The deployed `xr-publisher.umd.js` in your worker must be a build that
> includes the decoration API (`window.XRPublisher.registerDecoration`). If
> your worker's copy predates that, redeploy it from
> `packages/xr-publisher/dist/` first, or the plugins log
> "runtime not available".

## Available plugins

| File | Decoration | Feature |
|------|-----------|---------|
| `minimal-mushrooms-…` | speckled mushroom clumps at tree bases (+ rare glow species) — THE minimal read-first example | `anchor:'tree-base'` |
| `surface-targeting-…` | a "field guide": wildflowers/scree/seashells/ice shards/litter, one spec per surface band | `surface:` + `instanced`/`transform` + height bands |
| `shoreline-reeds-…`   | reeds + cattails, patrolling dragonflies, night fireflies | `surface` + `maxWaterDistance`; the reference distance-LOD `update()` pattern |
| `lake-fish-…`         | lakebed kelp, swimming glTF fish, lotus lily pads — all three water depths | `XRPublisher.loadModel` + `waterPlacement` `'floor'/'submerged'/'surface'` |
| `canopy-lanterns-…`   | lanterns in tree canopies     | `anchor:'tree'` |
| `apple-trees-…`       | closed collect loop: pick apples (rare golden), 🧺 HUD, session persistence | `interactable` + fn `interactionPrompt` + `registerHud` + `openDialog` |
| `summit-totems-…`     | seeded-named summit shrines w/ prayer flags, discovery HUD, night beacon | `anchor:'mountain'` + `openDialog` + `getTimeOfDay` |
| `rock-field-…`        | walkable rock outcrops (+ lichen, quartz veins, split-rock pairs) | per-spawn generative mesh + `collision:'hull'` |
| `floating-orbs-…`     | named wisps with branching conversations, riddles, absorb/befriend quest | `update()` + `interactable` + chained `openDialog()` |
| `settler-huts-…`      | lived-in homesteads: yards, hearths, door trails, lootable stores, abandoned variant | `collision` + `xrColliders` + `registerInteractable` + `addPath` |
| `campfires-…`         | tendable campsites: live fire, seating, lit state shared across visitors | `groundPatch` + worldState (`setWorldState`/`subscribeWorldState`) — farm-plots' minimal sibling |
| `town-center-…`       | plaza + well + buildings + sidewalk promenade + fountain/signposts/banners/notice board | `addTerrainRegion` + `addPath` + `registerTerrainSurface` + `registerInteractable` |
| `ancient-ruins-…`     | story sites: broken arch, drum trail, moss, seeded lore dialogs, rare sanctum (DEFAULT) | `registerTerrainSurface` (Worley) + `groundPatch` apron + `openDialog` |
| `farm-plots-…`        | tilled-soil plot + dirt frame + fence + hay (PLAINS) | custom striped surface + 3D structures |
| `rocky-clearings-…`   | old quarry: gravel clearing, cut-stone stacks, split boulders, communal growing cairn (DEFAULT) | custom noise surface + worldState-shared cairn |
| `town-roads-…`        | world-wide road network + towns, enabled with one call | `configureWorldRoads` (the whole plugin is one config object) |
| `multiplayer-demo-…`  | THE multiplayer API tour: join/leave toasts, speaking rings over talking peers, ping flares, world-wide megaphone | `onPeerJoin/Leave` + `getPeerAudioLevel` + `broadcast`/`onMessage` + `setLocalVoiceGlobal`/`setPeerVoiceOverride` |
| `weather-zones-…`     | localized storms/fog banks you can walk into, with rain the plugin renders itself | `addCloudRegion` + `getWeatherAt` (density/coverage/rain/speed/phase) |
| `resonance-plaza-…`   | a shared loop you mix by walking: one stone per layer, toggled by everyone in the room | `registerInteractable` + `getAudioListener` + `broadcast`/`onMessage` |
| `resonance-stage-…`   | THE flagship concert: stage-in-the-round, FFT ring, beams/lasers, avatar auras, synced stem transport | `setPostProcessing` + `XRPublisher.tsl`/`webgpu` + `getAudioAnalyser` + `getPeers` + `setTimeOfDay` + `registerMenuItem` |
| `block-lab-…`         | the custom-block reference/stress test: every field type, gizmo transforms, save round-trip | `registerBlockType` (typed `fields`, generated inspector, editor Add menu) |

`ancient-ruins`, `farm-plots` and `rocky-clearings` are biome-targeted **variants of `town-center`** that each carve a
believable **site** into the terrain: a custom procedural ground material
(`registerTerrainSurface`), a bare-dirt apron (`groundPatch`) so it blends in,
and 3D structures on top. Together they show the material range of the surface
system in NATURAL palettes — cellular (flagstone), striped (tilled soil), and
continuous noise (gravel). They rely on the **water-aware core**: the terrain
material fades any region surface out at the water line (`regionWaterY`), so a
site never paints over water. Browse them at `/decorations/biome-surfaces/` with
`npm run dev`. WebGPU shows the full TSL surface; WebGL (`?renderer=webgl`) shows
each surface's flat `fallbackColor`.

## Authoring your own

Copy any file, rename it (keep the `-xr-publisher-plugin.umd.js` suffix — and
note the decoration `name` inside is part of the placement seed, so renaming
it relocates the spawns), and edit the `registerDecoration` call. The full
spec reference (every field, with inline docs) lives in
`src/decorations/decorationRegistry.ts`.

> If you instead deploy through the **editor's** drag-drop importer (the
> `manifest.json` + renderer folder format used by `rotating-red-cube-block`),
> that's a different path — wrap one of these files in a folder with a
> `manifest.json` whose `main`/`renderer` point at the `.umd.js`. The flat
> files here are specifically for the `upload-build.js` script path.
