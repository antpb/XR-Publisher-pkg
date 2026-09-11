// ═════════════════════════════════════════════════════════════════════════
//  YOUR PLUGIN — edit this file.
// ═════════════════════════════════════════════════════════════════════════
//
// `registerPlugin` is called once, after the runtime is ready. Everything you
// need hangs off the `runtime` argument:
//
//     const { XRPublisher, THREE } = runtime;
//
// Both are guaranteed present (never a second copy of three). From here you can
// register decorations, custom blocks, interactables, HUD, menu items, etc.
//
// The example below registers ONE decoration: seed-stable crystal clusters
// scattered over the terrain. It shows the four things every decoration should
// get right — shared singletons, spawn.rng (never Math.random), engine-applied
// placement, and dispose opt-out for shared resources. Delete it and build your
// own; the full spec reference is in the runtime's decorationRegistry.ts (see
// src/types/xr-publisher.d.ts for a curated summary).

import type { PluginRuntime } from './runtime';

export function registerPlugin({ XRPublisher, THREE }: PluginRuntime): void {
  // ── Shared singletons — built ONCE, reused by every spawn in the world. ──
  // create() runs per spawn as chunks stream in; per-spawn materials would
  // recompile/upload constantly and never be freed. Share them at this scope.
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x6ec6ff,
    roughness: 0.15,
    metalness: 0.1,
    emissive: 0x123a6b,     // faint glow — blooms for free if a world enables postFX
    emissiveIntensity: 0.6,
    flatShading: true,
    transparent: true,
    opacity: 0.9,
  });
  // A single sharp octahedron shard, reused (scaled/rotated) per crystal.
  const shardGeo = new THREE.OctahedronGeometry(1, 0);

  XRPublisher.registerDecoration({
    name: 'scaffold-crystal',
    density: 0.35,          // ~1 cluster every ~3 chunks — tune to taste
    minSpacing: 12,         // keep clusters apart
    maxSlope: 0.35,         // avoid the steepest cliffs
    minWaterDistance: 3,    // stay out of the water

    create(spawn) {
      // local (0,0,0) is the terrain contact point — the engine applies the
      // world position for you. Build the cluster around the origin.
      const cluster = new THREE.Group();

      const count = 3 + Math.floor(spawn.rng() * 4);   // 3–6 shards
      for (let i = 0; i < count; i++) {
        const shard = new THREE.Mesh(shardGeo, crystalMat);

        // All variation comes from spawn.rng → identical every visit, every
        // device. Never Math.random() for placement/shape.
        const height = 0.6 + spawn.rng() * 1.8;
        const width = 0.18 + spawn.rng() * 0.22;
        shard.scale.set(width, height, width);

        const angle = spawn.rng() * Math.PI * 2;
        const radius = spawn.rng() * 0.9;
        shard.position.set(Math.cos(angle) * radius, height * 0.5, Math.sin(angle) * radius);

        // Slight lean + random yaw so they read as a natural formation.
        shard.rotation.set((spawn.rng() - 0.5) * 0.4, spawn.rng() * Math.PI, (spawn.rng() - 0.5) * 0.4);
        shard.castShadow = true;

        cluster.add(shard);
      }

      return cluster;
    },

    // Geometry + material are SHARED module-level singletons above. The default
    // cleanup disposes returned geometries — which would gut every other
    // cluster — so opt out with an empty dispose.
    dispose() {},
  });

  // ── Where to go next ─────────────────────────────────────────────────────
  //  • Dynamic (per-frame) objects:  add an `update(obj, dt, elapsed)` hook.
  //  • Solid / walk-on:              `collision: true`.
  //  • Dense models:                 `instanced: true` + `transform(spawn)`.
  //  • On trees / mountains / shore: `anchor` + `surface` + `maxWaterDistance`.
  //  • Collectibles + prompts:       `interactable: true` + `onInteract`.
  //  • Editor-placeable blocks:      `XRPublisher.registerBlockType({...})`.
  //  • HUD / dialogs / menu items:   registerHud / openDialog / registerMenuItem.
  //  • Seed-stable noise:            `XRPublisher.utils.createNoise2D(...)`.
  // Browse the shipped plugins in ../plugins/ for worked examples of each.
}
