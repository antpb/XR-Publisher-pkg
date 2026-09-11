# XR Publisher Documentation - in development, many placeholder screenshot comments to remind myself to update these.

XR Publisher is a JavaScript library for building and publishing immersive 3D/XR worlds on the web — with VR support, P2P multiplayer, voice chat, AI-powered NPCs, physics, and infinite procedural terrain. Worlds are authored as declarative HTML blocks and extended with a JavaScript plugin API.

## Index

### Getting Started

- [01 — Overview](01-overview.md)
- [02 — Installation & Setup](02-installation-and-setup.md)

### Block Reference

Worlds are built from custom HTML elements. Start with the overview, then dive into each block.

- [03 — Blocks Overview](03-blocks-overview.md)
- [04 — Environment Block](04-environment-block.md)
- [05 — Model Block](05-model-block.md)
- [06 — Text Block](06-text-block.md)
- [07 — Image Block](07-image-block.md)
- [08 — Audio Block](08-audio-block.md)
- [09 — Video Block](09-video-block.md)
- [10 — NPC Block](10-npc-block.md)
- [11 — Rideable Block (Vehicles)](11-rideable-block.md)
- [12 — Portal Block](12-portal-block.md)
- [13 — Light Block](13-light-block.md)
- [14 — Sky Block](14-sky-block.md)
- [15 — Terrain Block](15-terrain-block.md)
- [16 — Networking Block](16-networking-block.md)
- [17 — Spawn Point Block](17-spawn-point-block.md)

### Plugin Development

Everything a plugin script can do — from scattering deterministic decorations across procedural terrain to full multiplayer experiences.

- [18 — Plugin Development Overview](18-plugin-development-overview.md)

#### Decorations (terrain-scattered objects)

- [19 — Decorations Overview](19-decorations-overview.md)
- [20 — Placement Filters](20-decoration-placement-filters.md)
- [21 — The Spawn Context](21-decoration-spawn-context.md)
- [22 — Anchors: Trees, Tree Bases & Mountains](22-decoration-anchors.md)
- [23 — Water Placement](23-decoration-water-placement.md)
- [24 — Instanced Decorations](24-decoration-instancing.md)
- [25 — Ground Patches](25-decoration-ground-patches.md)
- [26 — Collision](26-decoration-collision.md)
- [46 — Persistent Decorations (large structures)](46-persistent-decorations.md)

#### Custom Blocks & Programmatic World Building

- [27 — Custom Blocks (Editor-Placeable)](27-custom-blocks.md)
- [28 — Injected Models & Solids](28-injected-models-and-solids.md)
- [29 — Terrain Regions & Custom Surfaces](29-terrain-regions-and-surfaces.md)
- [30 — Paths & Roads](30-paths-and-roads.md)
- [31 — Terrain & World Queries](31-terrain-queries.md)
- [32 — Clouds & Weather](32-clouds-and-weather.md)

#### Interaction & UI

- [33 — Interactables ("Press E")](33-interactables.md)
- [34 — HUD Overlays](34-hud-overlays.md)
- [35 — In-World Dialogs](35-in-world-dialogs.md)
- [36 — Menu Items](36-menu-items.md)

#### Rendering & Atmosphere

- [37 — Post-Processing & Bloom](37-post-processing.md)
- [38 — Time of Day](38-time-of-day.md)

#### Multiplayer & Persistence

- [39 — Networking APIs for Plugins](39-networking-plugins.md)
- [40 — Proximity Voice](40-proximity-voice.md)
- [41 — Persisted World State](41-world-state.md)

#### Runtime Access & Advanced

- [42 — Player, Scene & Audio Access](42-player-scene-audio.md)
- [43 — World Identity & Publishing Tokens](43-world-identity-and-tokens.md)
- [44 — Third-Person Aim, Input & Avatar Attachment](44-aim-input-and-hands.md)
- [45 — Effect Particles & Render Ordering](45-effects-and-render-order.md)

### Example Plugin Walkthroughs

Every example ships as a complete, commented, drop-in plugin file. Read them in roughly this order — the first is the minimal teaching example.

- [50 — Minimal Mushrooms (start here)](50-example-minimal-mushrooms.md)
- [51 — Surface Targeting](51-example-surface-targeting.md)
- [52 — Shoreline Reeds](52-example-shoreline-reeds.md)
- [53 — Lake Fish](53-example-lake-fish.md)
- [54 — Canopy Lanterns](54-example-canopy-lanterns.md)
- [55 — Apple Trees](55-example-apple-trees.md)
- [56 — Summit Totems](56-example-summit-totems.md)
- [57 — Rock Field](57-example-rock-field.md)
- [58 — Floating Orbs](58-example-floating-orbs.md)
- [59 — Settler Huts](59-example-settler-huts.md)
- [60 — Campfires](60-example-campfires.md)
- [61 — Farm Plots](61-example-farm-plots.md)
- [62 — Town Center](62-example-town-center.md)
- [63 — Ancient Ruins](63-example-ancient-ruins.md)
- [64 — Rocky Clearings](64-example-rocky-clearings.md)
- [65 — Town Roads](65-example-town-roads.md)
- [66 — Multiplayer Demo](66-example-multiplayer-demo.md)
- [67 — Resonance Stage (flagship concert)](67-example-resonance-stage.md)
- [68 — Resonance Plaza](68-example-resonance-plaza.md)
- [69 — Weather Zones](69-example-weather-zones.md)
- [70 — Block Lab (custom blocks)](70-example-block-lab.md)
- [71 — Power Washing (aim-driven game mechanic)](71-example-power-washing.md)
