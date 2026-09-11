import React, { useRef, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { RigidBody, HeightfieldCollider } from '@react-three/rapier';
import {
  Group, Vector3, DoubleSide, Texture,
  DataTexture, RGFormat, HalfFloatType, LinearFilter, ClampToEdgeWrapping,
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
  vertexColor, positionWorld, positionView, mx_noise_vec3, vec3, vec2, vec4, float,
  Fn, If, Loop, select, distance, smoothstep, saturate, mix, uniform, time, sin,
  dot, floor, fract, length, min, max, attribute,
  texture as tslTexture,
} from 'three/tsl';
import { groundPatchXZR, groundPatchColor, groundPatchCount, filterSpawnsByPatches } from '../../../decorations/groundPatchUniforms';
import { putPrefetch, dropPrefetch, treePrefetchKey } from './decorationPrefetch';
import { regionXZR, regionParam, regionTint, regionCount, regionWaterY } from '../../../decorations/regionMaterialUniforms';
import { pathSeg, pathMeta, pathTint, pathCount } from '../../../decorations/pathUniforms';
import {
  getWorldRoadConfig, getWorldRoadConfigVersion, subscribeWorldRoadConfig,
} from '../../../decorations/roadConfigStore';
import { GrassShader } from './GrassShader';
import { ProceduralBoulders } from './ProceduralBoulders';
import { ProceduralTrees } from './ProceduralTrees';
import { ProceduralShrubs } from './ProceduralShrubs';
import { ProceduralFlowers } from './ProceduralFlowers';
import { PluginDecorations } from './PluginDecorations';
import { useTerrainChunkStore } from './terrainChunkStore';
import { getBiomeAt } from './biomeHelpers';
import {
  footprintPositionsXZ, footprintAgeTypeArray, footprintCount
} from './footprintUniforms';
import { createDarknessNode } from './terrainDarkness';
import { createAudioPulseNode } from './terrainAudio';
import { terrainWorker, type TerrainArrays } from '../../../terrain/TerrainWorkerClient';
import { buildTerrainGeometry } from '../../../terrain/TerrainChunkBuilder';
import { getMountainsNearChunk } from './worldHelpers';
import { buildHeightfieldCollider } from './terrainColliderHelpers';
import { ChunkBundleProvider, useCreateChunkBundle } from './chunkBundle';
import { packSpawnObstacles, registerNpcObstacles, unregisterNpcObstacles } from './npcObstacles';
import { getTerrainSurfaces } from './terrainSurfaceRegistry';

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// EXPERIMENTAL (?surfacechain=1): composite REGISTERED terrain surfaces
// (terrainSurfaceRegistry) into the shared material via a select-chain on the
// winning region's surface index, instead of the shipping inline-cobble +
// flat-tint paint. Off by default until verified in a live WebGPU session —
// the previous select-chain attempt compiled but failed to draw (only the
// dirt underlay showed), so this stays strictly opt-in.
const SURFACE_CHAIN_ENABLED =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('surfacechain') === '1';

// ── Shared terrain material (compiled once, reused by all chunks) ──
// TSL nodes use positionWorld/vertexColor which are per-vertex,
// so the same MeshStandardNodeMaterial instance works for every chunk's
// geometry. Returning a full material (not just the nodes) is the key
// performance fix: previously each chunk's JSX created its own
// <meshStandardNodeMaterial>, forcing TSL to recompile the shader on
// every newly-visible chunk. That recompile was the source of the
// mid-flight frame drops that corresponded with the
//   "THREE.TSL: transformedNormalView is deprecated"
// console spam. Share the material and the compile happens exactly once.
let _sharedTerrainMaterial: MeshStandardNodeMaterial | null = null;

// Water-surface world Y for the shoreline wash. Set once by
// InfiniteTerrain (which owns the water level); the default sits far
// below any terrain so every shore term collapses to zero until then.
const _shoreWaterY = uniform(-99999);
export function setShoreWaterLevel(y: number) {
  _shoreWaterY.value = y;
}

// Shore-distance field shared from WaterShader: the G channel carries the
// nearest water body's max shore distance ("openness"), dilated onto land
// texels in the worker so BEACH fragments can read it. Gates the wash by
// body size — puddles and small ponds get no crashing foam. Until the
// water shader provides the real field, a 1×1 zero texture keeps every
// shore term off (G=0 → openness 0).
const _shoreFieldDefaultTex = (() => {
  const tex = new DataTexture(new Uint16Array(2), 1, 1, RGFormat, HalfFloatType);
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
})();
const _shoreFieldOriginX = uniform(0);
const _shoreFieldOriginZ = uniform(0);
const _shoreFieldExtentInv = uniform(0);
let _shoreFieldTexNode: ReturnType<typeof tslTexture> | null = null;
let _pendingShoreFieldTex: Texture | null = null;

/** Called by WaterShader whenever the shore-distance field (re)builds. */
export function setShoreWaterField(
  tex: Texture, originX: number, originZ: number, extentInv: number,
) {
  _shoreFieldOriginX.value = originX;
  _shoreFieldOriginZ.value = originZ;
  _shoreFieldExtentInv.value = extentInv;
  _pendingShoreFieldTex = tex;
  if (_shoreFieldTexNode) _shoreFieldTexNode.value = tex;
}

function getSharedTerrainMaterial(): MeshStandardNodeMaterial {
  if (_sharedTerrainMaterial) return _sharedTerrainMaterial;

  const footprintEffect = Fn(() => {
    const worldPos = positionWorld;
    const totalDark = float(0).toVar();
    const totalWet = float(0).toVar();

    Loop(footprintCount.toInt(), ({ i }: { i: any }) => {
      const fpPos = footprintPositionsXZ.element(i);
      const fpAgeType = footprintAgeTypeArray.element(i);
      const fpAge = fpAgeType.x;
      const fpType = fpAgeType.y;

      const dist = distance(worldPos.xz, fpPos);
      const influence = smoothstep(float(0.18), float(0), dist)
        .mul(smoothstep(float(1.0), float(0.0), fpAge));

      totalDark.addAssign(influence.mul(0.3));
      totalWet.addAssign(
        select(fpType.greaterThan(1.5), influence, float(0))
      );
    });

    return vec2(saturate(totalDark), saturate(totalWet));
  })();

  const baseColor = vertexColor();
  const worldPos = positionWorld;

  const largeNoise = mx_noise_vec3(vec3(
    worldPos.x.mul(0.015), worldPos.z.mul(0.015), worldPos.y.mul(0.005)
  )).x;
  const mediumNoise = mx_noise_vec3(vec3(
    worldPos.x.mul(0.06), worldPos.z.mul(0.06), worldPos.y.mul(0.02)
  )).x;
  const fineNoise = mx_noise_vec3(vec3(
    worldPos.x.mul(0.2), worldPos.z.mul(0.2), worldPos.y.mul(0.06)
  )).x;

  const variation = largeNoise.mul(0.18).add(mediumNoise.mul(0.10)).add(fineNoise.mul(0.05)).add(0.90);

  // ── Grass identity + meadow patchwork ────────────────────────────────
  // Grassness is a material-identity weight derived from the baked vertex
  // color (green-dominant fragments) — the color bands already encode the
  // identity, so rock/sand/earth/snow fragments are untouched for free.
  const grassness = saturate(
    baseColor.y.sub(max(baseColor.x, baseColor.z)).mul(8.0),
  );
  // ONE meadow-scale noise sample, domain-warped by the large/medium fields
  // sampled above (shared causes — not independent per-channel noise).
  // Breaks the flat green into irregular sun-dried-warm / lush-cool patches.
  const meadow = mx_noise_vec3(vec3(
    worldPos.x.mul(0.022).add(largeNoise.mul(0.9)),
    worldPos.z.mul(0.022).sub(mediumNoise.mul(0.6)),
    float(7.3),
  )).x.mul(0.5).add(0.5);
  const meadowMix = smoothstep(float(0.35), float(0.72), meadow);
  // Multiplicative tints preserve the authored hue and coverage: the green
  // stays green — it just stops being ONE green.
  const grassTint = mix(
    vec3(0.86, 1.04, 0.90),   // lush, cool, slightly deeper
    vec3(1.16, 1.06, 0.74),   // sun-dried, warm, hay-tinged
    meadowMix,
  );
  // Blade-scale micro grain, faded out by view distance so sub-pixel detail
  // never survives to shimmer (it's texture up close, gone by ~120u).
  const microNoise = mx_noise_vec3(vec3(
    worldPos.x.mul(0.75), worldPos.z.mul(0.75), float(3.1),
  )).x;
  const microFade = smoothstep(float(120.0), float(35.0), length(positionView));
  const grassLayer = mix(vec3(1.0), grassTint, grassness)
    .mul(float(1.0).add(microNoise.mul(0.07).mul(grassness).mul(microFade)));

  const colorWithVariation = baseColor.mul(variation).mul(grassLayer);
  const footprintDarken = float(1.0).sub(footprintEffect.x);

  // ── Ground patches ("dirt-surrounded" decorations) ──────────────────
  // A small uniform array of world-space dirt circles (campfires etc.),
  // registered by PluginDecorations as they mount. Same mechanism as the
  // footprint darkening above. Returns (rgb=dirt colour, a=strongest
  // mask) and we mix it over the base terrain colour. radius 0 ⇒ inactive
  // slot (centre parked far away, so d/radius is huge → mask 0).
  const patchInfo = Fn(() => {
    const wp = positionWorld;
    const dirt = vec3(0.34, 0.26, 0.16).toVar();
    const mask = float(0).toVar();
    Loop(groundPatchCount.toInt(), ({ i }: { i: any }) => {
      const xzr = groundPatchXZR.element(i);
      const col = groundPatchColor.element(i);
      const d = distance(wp.xz, vec2(xzr.x, xzr.y));
      // radius is signed (sign carries clearGrass) — abs() for the mask.
      const dn = d.div(xzr.z.abs().max(float(0.001)));
      // Clean soft-edged circle. (No per-fragment noise here — a simplex
      // sample per fragment per patch across the whole terrain was a real
      // GPU cost whenever any patch was loaded.)
      const m = smoothstep(float(1.0), float(0.72), dn);
      dirt.assign(select(m.greaterThan(mask), col, dirt));
      mask.assign(mask.max(m));
    });
    return vec4(dirt, mask);
  })();
  // Above-water factor (0 below the water line → 1 a couple units above). Region
  // surfaces, paths AND their dirt shoulders all fade out by it, so nothing a
  // plugin paints (road dirt included) ever covers water — the natural shore/
  // water shows through. regionWaterY default sits far below any terrain (=1).
  const aboveWaterTerrain = smoothstep(
    regionWaterY.add(float(0.2)), regionWaterY.add(float(2.0)), worldPos.y,
  );
  const patchedColor = mix(colorWithVariation, patchInfo.xyz, patchInfo.w.mul(aboveWaterTerrain));

  // ── Shoreline wash (foam overlap onto the land side) ──────────────
  // The water plane's own foam lives on the water side of the shoreline;
  // this band paints the matching wash on the terrain just above the
  // waterline so crests visibly run UP the beach. It reuses the water
  // shader's blotch noise + phase (phase1 at shore distance d=0 is
  // `blotch·2.5 − t·1.6`), so the run-up surges in sync with the crest
  // train arriving on the water side.
  const hAbove = worldPos.y.sub(_shoreWaterY);
  const shoreBlotch = mx_noise_vec3(vec3(
    worldPos.x.mul(0.045), worldPos.z.mul(0.045), time.mul(0.07)
  )).x.mul(0.5).add(0.5);
  // Full-cycle phase decorrelation (×6.3 ≈ 2π): different stretches of
  // shore crest at different times. The old ×2.5 offset spanned less
  // than half a cycle, so the entire coastline pulsed in near-unison
  // and the wash read as one synchronized stroke.
  const surge = sin(shoreBlotch.mul(6.3).sub(time.mul(1.6))).mul(0.5).add(0.5);
  // Spatial patch gate — derived from the SAME blotch field as the water
  // shader's foamPatch, so the beach wash and the water-side foam come
  // and go on the same stretches of shore (~55% coverage; smooth
  // foam-free zones elsewhere). Reuses shoreBlotch — no extra noise
  // sample on the terrain fragment path.
  const foamPatch = smoothstep(float(0.32), float(0.62), shoreBlotch);
  // Body-size gate from the shared shore-distance field (G = nearest
  // body's max shore distance, dilated onto land in the worker). Puddles
  // and small ponds have no fetch — no waves, so no crashing wash on
  // their rims. Thresholds match the water shader's MIN/FULL_BODY_WIDTH.
  if (!_shoreFieldTexNode) {
    _shoreFieldTexNode = tslTexture(
      _pendingShoreFieldTex ?? _shoreFieldDefaultTex,
      vec2(
        worldPos.x.sub(_shoreFieldOriginX).mul(_shoreFieldExtentInv),
        worldPos.z.sub(_shoreFieldOriginZ).mul(_shoreFieldExtentInv),
      ),
    );
  }
  const bodyOpenness = smoothstep(float(14.0), float(40.0), _shoreFieldTexNode.g);
  // Animated high-water mark, thickness varied by the patch mask. Capped
  // at ~0.95u above the waterline (was 1.62 — the wash climbed beach
  // stretches no wave could plausibly reach).
  const runup = float(0.3).add(surge.mul(0.55)).mul(foamPatch.mul(0.6).add(0.5));
  const wash = float(1).sub(smoothstep(float(0.0), runup, hAbove))
    // Fade out just below the waterline — keeps a thin overlap with the
    // water plane's own shore foam so the two bands read as one.
    .mul(smoothstep(float(-0.5), float(-0.1), hAbove));
  const shoreFoamNoise = mx_noise_vec3(vec3(
    worldPos.x.mul(0.9).add(time.mul(0.15)),
    worldPos.z.mul(0.9).sub(time.mul(0.11)),
    time.mul(0.2)
  )).x;
  const shoreFoam = smoothstep(float(0.35), float(0.7), wash.add(shoreFoamNoise.mul(0.35)))
    .mul(surge.mul(0.5).add(0.5))
    .mul(foamPatch)
    .mul(bodyOpenness);
  // Wet darkening below the high-water mark (also tints submerged ground
  // seen through the transparent water). Persists at reduced strength on
  // small bodies — pond rims still look damp, they just don't foam.
  const wet = float(1).sub(smoothstep(float(0.05), float(1.5), hAbove))
    .mul(bodyOpenness.mul(0.6).add(0.4));
  const wetMul = float(1).sub(wet.mul(0.22));

  const foamTint = vec3(0.93, 0.97, 1.0);
  const litBase = patchedColor.mul(footprintDarken).mul(wetMul);

  const roughnessNoise = mx_noise_vec3(vec3(
    worldPos.x.mul(0.15), worldPos.z.mul(0.15), worldPos.y.mul(0.15)
  )).x;
  // Dry meadow patches read slightly rougher/duller than lush ones — the
  // roughness responds to the SAME meadow field as the color (coupled
  // causes), not its own noise.
  const baseRoughness = float(0.82).add(roughnessNoise.mul(0.12))
    .add(meadowMix.mul(grassness).mul(0.05));

  // Pre-region colour + roughness (before the surface-material override).
  const basePreColor = mix(litBase, foamTint, shoreFoam);
  const basePreRough = mix(
    mix(baseRoughness, float(0.2), footprintEffect.y),
    float(0.3),
    saturate(wet.add(shoreFoam))
  );

  // ── Surface-material regions ("replace the ground inside a circle") ──────
  // World-space circles (regionMaterialUniforms.ts). Two stages:
  //  1) A Loop picks the STRONGEST region covering this fragment — carrying only
  //     SCALARS/vecs out of the loop (surfaceIndex, scale, p2, centre, tint,
  //     mask). NO surface shader is evaluated inside the Loop — a nested Fn with
  //     its own Loop/toVar inside this Loop produced wrong output (the reason the
  //     old code unrolled cobblestone by hand).
  //  2) OUTSIDE the loop, the WINNING surface is painted — cobblestone (index 0)
  //     inline, any other index as its flat tint (the WebGL twin matches).
  // Region-LOCAL coords keep procedural hashes precise far from the origin.
  const regionComposite = Fn(() => {
    // .xyz: vertexColor() is RGBA (vec4); keep colour vec3 so `vec4(col, rough)`
    // below isn't a 5-component call.
    const outColor = basePreColor.xyz.toVar();
    const outRough = basePreRough.toVar();

    // Stage 1 — winner selection (scalars only).
    const winMask = float(0).toVar();
    const winIdx = float(0).toVar();
    const winScale = float(1).toVar();
    const winP2 = float(0.08).toVar();
    const winCx = float(0).toVar();
    const winCz = float(0).toVar();
    const winTint = vec3(1).toVar();
    Loop(regionCount.toInt(), ({ i }: { i: any }) => {
      const xzr = regionXZR.element(i);
      const param = regionParam.element(i);   // (surfaceIndex, scale, p2)
      const tint = regionTint.element(i);
      const d = distance(worldPos.xz, vec2(xzr.x, xzr.y));
      const dn = d.div(xzr.z.abs().max(float(0.001)));
      const m = smoothstep(float(1.0), float(0.82), dn);
      const win = m.greaterThan(winMask);
      winIdx.assign(select(win, param.x, winIdx));
      winScale.assign(select(win, param.y, winScale));
      winP2.assign(select(win, param.z, winP2));
      winCx.assign(select(win, xzr.x, winCx));
      winCz.assign(select(win, xzr.y, winCz));
      winTint.assign(select(win, tint, winTint));
      winMask.assign(winMask.max(m));
    });

    // Stage 1b — PATH segments (addPath): accumulate a mask + tint. Paths get
    // their OWN painter (packed dirt + pebbles, the world-road recipe) after
    // Stage 2, layered over whatever ground/region is beneath — a sandy trail
    // reads across a cobblestone plaza and across bare terrain alike. The
    // loop runs `pathCount` iterations — zero registered paths costs (almost)
    // nothing; the repacker caps the live set at the nearest
    // MAX_PATH_SEGMENTS.
    const pathMask = float(0).toVar();
    const pathTintV = vec3(1).toVar();
    Loop(pathCount.toInt(), ({ i }: { i: any }) => {
      const seg = pathSeg.element(i);      // (x1, z1, x2, z2)
      const meta = pathMeta.element(i);    // (halfWidth, …)
      const tint = pathTint.element(i);
      const ex = seg.z.sub(seg.x);
      const ez = seg.w.sub(seg.y);
      const len2 = ex.mul(ex).add(ez.mul(ez)).max(float(0.0001));
      const t = saturate(
        worldPos.x.sub(seg.x).mul(ex)
          .add(worldPos.z.sub(seg.y).mul(ez))
          .div(len2),
      );
      const d = distance(
        worldPos.xz,
        vec2(seg.x.add(ex.mul(t)), seg.y.add(ez.mul(t))),
      );
      // hw 0 marks a parked slot; .max keeps smoothstep edges ordered (NaN-safe).
      const hw = meta.x.max(float(0.02));
      const m = smoothstep(hw, hw.mul(0.8), d);
      pathTintV.assign(select(m.greaterThan(pathMask), tint, pathTintV));
      pathMask.assign(pathMask.max(m));
    });

    // (Roads are no longer a region/path loop — they're a worker-baked
    // per-vertex attribute, painted as a separate stage below. Plazas stay here
    // as circular regions: cobblestone for index 0. Plugin PATHS are the
    // Stage-1b loop above.)

    // Stage 2 — paint the winning surface. INLINE cobblestone (Worley F1/F2,
    // 3×3 unrolled — no nested Fn/Loop, no `If`) for surface index 0; any other
    // index renders the flat region tint. This is the original working WebGPU
    // path — the registered-surface select-chain that replaced it failed to draw
    // on WebGPU (only the dirt underlay showed). Region-LOCAL coords keep the
    // hash precise far from origin.
    const scale = winScale.max(float(0.001));
    const mortar = winP2.max(float(0.001));
    const uv = vec2(worldPos.x.sub(winCx), worldPos.z.sub(winCz)).mul(scale);
    const ci = floor(uv);
    const cf = fract(uv);
    const h2 = (cell: any) => fract(
      sin(vec2(dot(cell, vec2(127.1, 311.7)), dot(cell, vec2(269.5, 183.3)))).mul(43758.5453),
    );
    const h1 = (cell: any) => fract(sin(dot(cell, vec2(12.9898, 78.233))).mul(43758.5453));
    const fdist = (gx: number, gz: number) => {
      const g = vec2(float(gx), float(gz));
      return length(g.add(h2(ci.add(g))).sub(cf));
    };
    const d00 = fdist(-1, -1), d10 = fdist(0, -1), d20 = fdist(1, -1);
    const d01 = fdist(-1, 0), d11 = fdist(0, 0), d21 = fdist(1, 0);
    const d02 = fdist(-1, 1), d12 = fdist(0, 1), d22 = fdist(1, 1);
    const f1 = min(min(min(d00, d10), min(d20, d01)), min(min(d11, d21), min(d02, min(d12, d22))));
    const BIG = float(99);
    const g2 = (di: any) => select(di.greaterThan(f1.add(float(0.0001))), di, BIG);
    const f2 = min(
      min(min(g2(d00), g2(d10)), min(g2(d20), g2(d01))),
      min(min(g2(d11), g2(d21)), min(g2(d02), min(g2(d12), g2(d22)))),
    );
    const cellRand = h1(ci);
    const stone = vec3(0.52, 0.49, 0.45).mul(float(0.78).add(cellRand.mul(0.42))).mul(winTint);
    const mortarCol = vec3(0.12, 0.11, 0.10);
    const stoneMask = smoothstep(float(0.0), mortar, f2.sub(f1));
    const cobble = mix(mortarCol, stone, stoneMask);
    const cobbleRough = mix(float(0.95), float(0.6), stoneMask);

    // Default (shipping) paint: inline cobble for index 0, flat tint otherwise.
    // Behind `?surfacechain=1`, the REGISTERED-surface select-chain replaces it —
    // every registry factory is evaluated unconditionally (no If — Stage-2's
    // history: If/nested-Fn/Loop constructs failed to draw on WebGPU) and the
    // winner picked by a nested select on winIdx. EXPERIMENTAL until verified
    // in a live WebGPU session; the default path is untouched so the town look
    // can't regress. Late-registered surfaces aren't in the chain (material is
    // a compile-once singleton; register at plugin init).
    const isCobble = winIdx.lessThan(float(0.5));     // index 0 → cobblestone
    let surfCol = select(isCobble, cobble, winTint);  // else flat region tint
    let surfRough = select(isCobble, cobbleRough, float(0.85));
    if (SURFACE_CHAIN_ENABLED) {
      const chainLocalXZ = vec2(worldPos.x.sub(winCx), worldPos.z.sub(winCz));
      const chainParams = vec3(winIdx, winScale, winP2);
      const surfs = getTerrainSurfaces();
      let chainCol: any = winTint;                    // tail fallback: flat tint
      let chainRough: any = float(0.85);
      for (let k = surfs.length - 1; k >= 0; k--) {
        let out: any = null;
        try {
          out = surfs[k].tsl({ worldPos, localXZ: chainLocalXZ, params: chainParams, tint: winTint });
        } catch (err) {
          console.warn('[XRPublisher] terrain surface tsl() threw, skipping:', surfs[k].id, err);
        }
        if (!out) continue;
        const isK = winIdx.lessThan(float(k + 0.5));
        chainCol = select(isK, out.xyz, chainCol);
        chainRough = select(isK, out.w, chainRough);
      }
      surfCol = chainCol;
      surfRough = chainRough;
    }

    // Water awareness: surface fades out at the water line so a road/plaza never
    // paints over water; surfMask is 0 outside any region/path → no-op there.
    const surfMask = winMask.mul(aboveWaterTerrain);
    outColor.assign(mix(outColor, surfCol, surfMask));
    outRough.assign(mix(outRough, surfRough, surfMask));

    // ── Stage 2b — plugin PATHS: the world-road recipe (packed dirt +
    // pebbles), tinted per path, layered OVER the region paint so a trail
    // crosses a plaza visibly. Same noise family as Stage-3 roads (different
    // seeds) so paths and roads read as one material system. Gated by If so
    // path-less fragments (most of the world) skip the two noise evals.
    If(pathMask.greaterThan(float(0.001)), () => {
      const pn1 = mx_noise_vec3(vec3(worldPos.x.mul(0.6), worldPos.z.mul(0.6), float(3))).x.mul(0.5).add(0.5);
      const pn2 = mx_noise_vec3(vec3(worldPos.x.mul(3.0), worldPos.z.mul(3.0), float(11))).x.mul(0.5).add(0.5);
      const pDirt = vec3(0.44, 0.36, 0.26).mul(float(0.85).add(pn1.mul(0.30)));
      const pPebble = mix(vec3(0.34, 0.30, 0.25), vec3(0.58, 0.53, 0.45), pn2);
      const pathCol = mix(pDirt, pPebble, smoothstep(float(0.62), float(0.82), pn2).mul(0.6)).mul(pathTintV);
      const pathPaint = pathMask.mul(aboveWaterTerrain);
      outColor.assign(mix(outColor, pathCol, pathPaint));
      outRough.assign(mix(outRough, float(0.95), pathPaint));
    });

    // ── Stage 3 — WORLD ROADS. A per-vertex roadStrength (0..1) baked in the
    // worker from the deterministic road network: known the moment this chunk
    // was generated, never recomputed as the player moves. A believable packed-
    // dirt road. NOT gated by aboveWaterTerrain — the planner already keeps road
    // centres a shoreline margin above water (ROAD_WATER_LIMIT), and the gate was
    // dimming roads that run along low ground near the waterline.
    const road = attribute('roadStrength');
    const rn1 = mx_noise_vec3(vec3(worldPos.x.mul(0.6), worldPos.z.mul(0.6), float(0))).x.mul(0.5).add(0.5);
    const rn2 = mx_noise_vec3(vec3(worldPos.x.mul(3.0), worldPos.z.mul(3.0), float(7))).x.mul(0.5).add(0.5);
    const dirt = vec3(0.44, 0.36, 0.26).mul(float(0.85).add(rn1.mul(0.30)));
    const pebble = mix(vec3(0.34, 0.30, 0.25), vec3(0.58, 0.53, 0.45), rn2);
    const roadCol = mix(dirt, pebble, smoothstep(float(0.62), float(0.82), rn2).mul(0.6));
    outColor.assign(mix(outColor, roadCol, road));
    outRough.assign(mix(outRough, float(0.95), road));

    return vec4(outColor, outRough);
  })();

  // × darkness (day/night) × audio pulse (ground breathes with the music; the tap
  // is post-distance so it only pulses where the audio is audible).
  const colorNode = regionComposite.xyz.mul(createDarknessNode()).mul(createAudioPulseNode(0.35));
  const roughnessNode = regionComposite.w;

  const mat = new MeshStandardNodeMaterial();
  mat.colorNode = colorNode;
  mat.roughnessNode = roughnessNode;
  mat.metalnessNode = float(0.05);
  mat.side = DoubleSide;

  _sharedTerrainMaterial = mat;
  return mat;
}

/**
 * Subscribes to the Zustand decoration phase for a specific chunk.
 * Only re-renders THIS wrapper when the phase threshold is crossed —
 * the parent ProceduralTerrain component is never re-rendered.
 */
function DecorationGate({ chunkKey, minPhase, children }: {
  chunkKey: string; minPhase: number; children: React.ReactNode;
}) {
  const isReady = useTerrainChunkStore(
    (s) => (s.decorationPhases[chunkKey] ?? 0) >= minPhase
  );
  if (!isReady) return null;
  return <>{children}</>;
}

interface ProceduralTerrainProps {
  width?: number;
  height?: number;
  segments?: number;
  scale?: number;
  heightScale?: number;
  seed?: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  color?: string;
  roughness?: number;
  metalness?: number;
  skyColor?: string;
  horizonColor?: string;
  cloudColor?: string;
  cloudDensity?: number;
  cloudScale?: number;
  cloudSpeed?: number;
  cloudHeight?: number;
  cloudLayers?: number;
  timeOfDay?: number;
  timeCycleDuration?: number;
  noiseOctaves?: number;
  noisePersistence?: number;
  noiseLacunarity?: number;
  gridX?: number;
  gridZ?: number;
  isCenterChunk?: boolean;
  playerPosition?: Vector3;
  enableDecorations?: boolean;
}

export function ProceduralTerrain({
  width = 100,
  height = 100,
  segments = 100,
  scale = 0.5,
  heightScale = 50,
  seed = Math.random().toString(),
  positionX = 0,
  positionY = 0,
  positionZ = 0,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  color: _color = '#4a7c59',
  roughness: _roughness = 0.8,
  metalness: _metalness = 0.2,
  noiseOctaves = 6,
  noisePersistence = 0.5,
  noiseLacunarity = 2,
  gridX = 0,
  gridZ = 0,
  playerPosition,
  enableDecorations = true
}: ProceduralTerrainProps) {
  const highestPointsRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const groupRef = useRef<Group>(new Group());
  const heightDataRef = useRef<Float32Array>(new Float32Array());
  const colorDataRef = useRef<Float32Array>(new Float32Array());
  const roadStrengthRef = useRef<Float32Array>(new Float32Array());
  const grassSpawnsRef = useRef<Float32Array>(new Float32Array());
  const boulderSpawnsRef = useRef<Float32Array>(new Float32Array());
  const treeSpawnsRef = useRef<Float32Array>(new Float32Array());
  const shrubSpawnsRef = useRef<Float32Array>(new Float32Array());
  const flowerSpawnsRef = useRef<Float32Array>(new Float32Array());
  const registerGeometry = useTerrainChunkStore((state) => state.registerGeometry);
  const getGeometry = useTerrainChunkStore((state) => state.getGeometry);
  // Whether terrain chunks should carry a (cooked) trimesh collider. Driven by
  // InfiniteTerrain — false while flying high above the ground, so streamed
  // chunks don't pay the synchronous cook cost. This selector only re-renders
  // the chunk when the flag flips, not every frame.
  const collidersActive = useTerrainChunkStore((state) => state.collidersActive);

  // Per-chunk WebGPU render bundle — opaque static meshes (terrain, and the
  // decoration components' opaque groups via context) render through a
  // cached GPU bundle, skipping per-object renderer overhead every frame.
  const chunkBundle = useCreateChunkBundle();

  const chunkBiome = useMemo(() => {
    return getBiomeAt(positionX, positionZ, seed);
  }, [positionX, positionZ, seed]);

  // Decoration phases are stored in Zustand (terrainChunkStore) so child
  // DecorationGate components can subscribe independently without causing
  // this parent component to re-render when phases change.
  const chunkKey = `${gridX},${gridZ}`;
  const setDecorationPhase = useTerrainChunkStore((s) => s.setDecorationPhase);
  const removeDecorationPhase = useTerrainChunkStore((s) => s.removeDecorationPhase);

  // Shared full MeshStandardNodeMaterial — compiled once, reused across all
  // terrain chunks. Attached imperatively via <primitive …/> with
  // dispose={null} so that when any chunk unmounts, the material survives
  // for the other chunks still holding a reference.
  const sharedTerrainMaterial = getSharedTerrainMaterial();

  // Async terrain generation via Web Worker (off main thread).
  // Falls back to synchronous main-thread generation if Worker unavailable.
  const [terrainData, setTerrainData] = useState<{
    geometry: import('three').BufferGeometry;
    highestPoints: Array<{ x: number; y: number; z: number }>;
  } | null>(null);

  // Re-generate this chunk if world roads are enabled (or reconfigured) AFTER it
  // first streamed — so spawn-area chunks pick up roads without a revisit. Cheap
  // (the super-tile road plan is cached in the worker); re-runs the normal
  // generate, never a material rebuild.
  const roadConfigVersion = useSyncExternalStore(
    subscribeWorldRoadConfig, getWorldRoadConfigVersion, getWorldRoadConfigVersion,
  );

  useEffect(() => {
    let cancelled = false;
    // Drop this chunk's queued terrain job if we scroll away before the worker
    // reaches it — the fast-movement win, so the backlog stays chunks the
    // player still cares about. A job already in flight finishes; `cancelled`
    // ignores its result as before.
    const abort = new AbortController();

    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Pass the JS mountain list into the worker so the WASM terrain
    // path uses the same mountains (and per-entrance outward directions)
    // that JS `MountainMesh` renders. Without this, Rust falls back to
    // its internal radial-ramp stub and produces round craters that
    // don't match the meshes on screen.
    const chunkMountains = getMountainsNearChunk(
      gridX,
      gridZ,
      width,
      height,
      seed,
      width * 2
    );

    terrainWorker
      .generateTerrain({
        width,
        height,
        segments,
        scale,
        heightScale,
        seed,
        noiseOctaves,
        noisePersistence,
        noiseLacunarity,
        positionX,
        positionZ,
        gridX,
        gridZ,
        positionY,
        grassDensity: chunkBiome.grassDensity,
        boulderDensity: chunkBiome.boulderDensity,
        treeDensity: chunkBiome.treeDensity,
        shrubDensity: chunkBiome.shrubDensity,
        flowerDensity: chunkBiome.flowerDensity,
        isMobile,
        mountains: chunkMountains,
        roadConfig: getWorldRoadConfig(),
      }, { signal: abort.signal })
      .then((arrays: TerrainArrays) => {
        if (cancelled) return;

        // Build Three.js geometry from the raw arrays on the main thread (fast).
        const geometry = buildTerrainGeometry(
          arrays.positions,
          arrays.colors,
          arrays.roadStrength,
          width,
          height,
          segments,
          arrays.normals
        );

        highestPointsRef.current = arrays.highestPoints;
        heightDataRef.current = arrays.positions;
        colorDataRef.current = arrays.colors;
        roadStrengthRef.current = arrays.roadStrength;
        grassSpawnsRef.current = arrays.grassSpawns;
        boulderSpawnsRef.current = arrays.boulderSpawns;
        treeSpawnsRef.current = arrays.treeSpawns;
        shrubSpawnsRef.current = arrays.shrubSpawns;
        flowerSpawnsRef.current = arrays.flowerSpawns;

        // Prefetch the tree geometry build NOW — the spawns are in hand, and
        // without this the worker request waits for the phase-2 decoration
        // timer + the proximity gate to mount ProceduralTrees first (pure
        // added latency; trees visibly trailed the terrain). Inputs are
        // IDENTICAL to ProceduralTrees' own request (same patch filter, same
        // salt, biome sampled at the CHUNK CENTER — the corner-sampled
        // chunkBiome in scope is a different sample point and would change
        // species selection), so the output is bit-identical and the
        // component consumes the cached promise when its gates open.
        // MOBILE: only prefetch chunks the (tight, 1.2/1.6×width) mobile tree
        // gate could actually show soon. Unconditional prefetch was tried and
        // ran phones measurably hot — the worker built trees for every
        // streamed chunk (CPU churn for meshes the gate never mounted) and
        // held ~150KB of baked buffers per chunk against the iOS memory
        // ceiling. Desktop prefetches everything (the wide gate mounts it
        // all anyway). No player state yet ⇒ initial-load chunks, prefetch.
        const treeGateCenterX = gridX * width + width / 2;
        const treeGateCenterZ = gridZ * height + height / 2;
        const psForPrefetch = typeof window !== 'undefined'
          ? (window as any).__xrPlayerState : null;
        const prefetchNearEnough = !isMobile
          || typeof psForPrefetch?.x !== 'number'
          || Math.hypot(psForPrefetch.x - treeGateCenterX, psForPrefetch.z - treeGateCenterZ)
            < 1.6 * width;
        if (enableDecorations && prefetchNearEnough
          && arrays.treeSpawns.length > 0 && chunkBiome.treeDensity > 0) {
          const centerBiomeId = getBiomeAt(
            gridX * width + width / 2, gridZ * height + height / 2, seed,
          )?.id;
          const filtered = filterSpawnsByPatches(
            arrays.treeSpawns, 7, gridX, gridZ, width, height,
          );
          if (filtered && filtered.length > 0) {
            const prefetch = terrainWorker.buildDecorationGeometry(
              'trees', filtered, 0, 0, isMobile,
              `${seed}-${gridX}-${gridZ}`, centerBiomeId,
              { signal: abort.signal, centerX: gridX * width, centerZ: gridZ * height },
            );
            // The consumer handles rejection (main-thread fallback); this tap
            // only prevents an unhandled-rejection warning when the worker
            // errors before/without a consumer.
            prefetch.catch(() => {});
            putPrefetch(treePrefetchKey(seed, gridX, gridZ), {
              promise: prefetch, spawnCount: filtered.length,
            });
          }
        }

        // Publish this chunk's decoration footprint so NPC spawn/wander
        // points never land inside a tree trunk, boulder, or shrub.
        {
          const packed: number[] = [];
          packSpawnObstacles(packed, arrays.treeSpawns, positionX, positionZ, 0.6, 0.4);
          packSpawnObstacles(packed, arrays.boulderSpawns, positionX, positionZ, 0.5, 1.0);
          packSpawnObstacles(packed, arrays.shrubSpawns, positionX, positionZ, 0.4, 0.6);
          registerNpcObstacles(`chunk-${gridX}-${gridZ}`, new Float32Array(packed));
        }

        // Register geometry in chunk store for neighbor edge-blending.
        const geoKey = `terrain-chunk-${gridX}-${gridZ}`;
        registerGeometry(geoKey, geometry);

        // Edge-blend with existing neighbor chunks.
        const positions3 = geometry.attributes.position;
        const colors3 = geometry.attributes.color;
        const verticesPerSide = segments + 1;
        let hasNeighborBlend = false;

        const leftKey = `terrain-chunk-${gridX - 1}-${gridZ}`;
        const leftGeom = getGeometry(leftKey);
        if (leftGeom) {
          const leftPos = leftGeom.attributes.position;
          const leftColor = leftGeom.attributes.color;
          for (let j = 0; j <= segments; j++) {
            const thisIdx = j * verticesPerSide;
            const leftIdx = j * verticesPerSide + segments;
            positions3.setY(thisIdx, leftPos.getY(leftIdx));
            colors3.setXYZ(thisIdx, leftColor.getX(leftIdx), leftColor.getY(leftIdx), leftColor.getZ(leftIdx));
          }
          positions3.needsUpdate = true;
          colors3.needsUpdate = true;
          hasNeighborBlend = true;
        }

        const rightKey = `terrain-chunk-${gridX + 1}-${gridZ}`;
        const rightGeom = getGeometry(rightKey);
        if (rightGeom) {
          const rightPos = rightGeom.attributes.position;
          const rightColor = rightGeom.attributes.color;
          for (let j = 0; j <= segments; j++) {
            const thisIdx = j * verticesPerSide + segments;
            const rightIdx = j * verticesPerSide;
            positions3.setY(thisIdx, rightPos.getY(rightIdx));
            colors3.setXYZ(thisIdx, rightColor.getX(rightIdx), rightColor.getY(rightIdx), rightColor.getZ(rightIdx));
          }
          positions3.needsUpdate = true;
          colors3.needsUpdate = true;
          hasNeighborBlend = true;
        }

        const topKey = `terrain-chunk-${gridX}-${gridZ - 1}`;
        const topGeom = getGeometry(topKey);
        if (topGeom) {
          const topPos = topGeom.attributes.position;
          const topColor = topGeom.attributes.color;
          for (let i = 0; i <= segments; i++) {
            const thisIdx = i;
            const topIdx = segments * verticesPerSide + i;
            positions3.setY(thisIdx, topPos.getY(topIdx));
            colors3.setXYZ(thisIdx, topColor.getX(topIdx), topColor.getY(topIdx), topColor.getZ(topIdx));
          }
          positions3.needsUpdate = true;
          colors3.needsUpdate = true;
          hasNeighborBlend = true;
        }

        const bottomKey = `terrain-chunk-${gridX}-${gridZ + 1}`;
        const bottomGeom = getGeometry(bottomKey);
        if (bottomGeom) {
          const bottomPos = bottomGeom.attributes.position;
          const bottomColor = bottomGeom.attributes.color;
          for (let i = 0; i <= segments; i++) {
            const thisIdx = segments * verticesPerSide + i;
            const bottomIdx = i;
            positions3.setY(thisIdx, bottomPos.getY(bottomIdx));
            colors3.setXYZ(thisIdx, bottomColor.getX(bottomIdx), bottomColor.getY(bottomIdx), bottomColor.getZ(bottomIdx));
          }
          positions3.needsUpdate = true;
          colors3.needsUpdate = true;
          hasNeighborBlend = true;
        }

        if (hasNeighborBlend) {
          geometry.computeVertexNormals();
        }

        setTerrainData({ geometry, highestPoints: arrays.highestPoints });
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Terrain generation failed for chunk', gridX, gridZ, err);
        }
      });

    return () => {
      cancelled = true;
      abort.abort();
      unregisterNpcObstacles(`chunk-${gridX}-${gridZ}`);
      // Cache lifetime = chunk lifetime (see decorationPrefetch.ts).
      dropPrefetch(treePrefetchKey(seed, gridX, gridZ));
    };
  }, [width, height, segments, scale, heightScale, seed, noiseOctaves, noisePersistence, noiseLacunarity, positionX, positionZ, gridX, gridZ, registerGeometry, getGeometry, roadConfigVersion]);

  // Dispose this chunk's terrain geometry when the chunk scrolls out of the
  // render window (unmount). InfiniteTerrain removes the chunk from the store
  // map, but the BufferGeometry's GPU buffers are only freed by an explicit
  // dispose() — otherwise traversing the world leaks one trimesh geometry per
  // chunk crossed, and frame drops worsen the further the player travels.
  useEffect(() => {
    return () => {
      if (terrainData?.geometry) terrainData.geometry.dispose();
    };
  }, [terrainData]);

  useEffect(() => {
    if (!terrainData) return;

    const timer = setTimeout(() => {
      const meshName = `terrain-chunk-${gridX}-${gridZ}`;
      window.dispatchEvent(new CustomEvent('terrainChunkLoaded', {
        detail: { 
          gridX, 
          gridZ, 
          key: meshName,
          meshName
        }
      }));
    }, 100);

    return () => clearTimeout(timer);
  }, [terrainData, gridX, gridZ]);
  
  useEffect(() => {
    if (!terrainData) return;

    const chunkHash = Math.abs(Math.sin(gridX * 12.9898 + gridZ * 78.233) * 43758.5453) % 1;
    const spreadDelay = chunkHash * (isMobile ? 500 : 150);

    // Phase 1: grass + boulders (most visible)
    const phase1Timer = setTimeout(
      () => setDecorationPhase(chunkKey, 1),
      (isMobile ? 300 : 50) + spreadDelay
    );
    // Phase 2: trees + shrubs + flowers
    const phase2Timer = setTimeout(
      () => setDecorationPhase(chunkKey, 2),
      (isMobile ? 900 : 150) + spreadDelay
    );
    
    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      // Clean up decoration phase from store when chunk unmounts
      removeDecorationPhase(chunkKey);
    };
  }, [terrainData, gridX, gridZ, chunkKey, setDecorationPhase, removeDecorationPhase]);

  // Full-resolution heightfield collider — O(n) heights copy, no trimesh cook,
  // matches the visual mesh exactly (see terrainColliderHelpers.ts for why
  // this replaced the decimated trimesh).
  const colliderData = useMemo(
    () => (terrainData ? buildHeightfieldCollider(terrainData.geometry, segments, width, height) : null),
    [terrainData, segments, width, height]
  );

  if (!terrainData) return null;

  return (
    <>
      <group
        ref={groupRef as any}
        position={[positionX, positionY, positionZ]}
        rotation={[rotationX, rotationY, rotationZ]}
        matrixAutoUpdate={false}
        onUpdate={(self) => self.updateMatrix()}
      >
        <ChunkBundleProvider value={chunkBundle}>
        <primitive
          object={chunkBundle.group}
          onUpdate={() => chunkBundle.invalidate()}
        >
          <RigidBody
            type="fixed"
            colliders={false}
          >
            <mesh
              name={`terrain-chunk-${gridX}-${gridZ}`}
              receiveShadow
              raycast={() => null}
              frustumCulled={false}
              matrixAutoUpdate={false}
              userData={{ camExcludeCollision: true }}
              onUpdate={() => chunkBundle.invalidate()}
            >
              <primitive object={terrainData.geometry} attach="geometry" />
              <primitive object={sharedTerrainMaterial} attach="material" dispose={null} />
            </mesh>
            {collidersActive && colliderData && (
              <HeightfieldCollider args={colliderData as any} />
            )}
          </RigidBody>
        </primitive>

        {enableDecorations && (
          <DecorationGate chunkKey={chunkKey} minPhase={1}>
            <GrassShader
              chunkX={gridX}
              chunkZ={gridZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              scale={scale}
              noiseOctaves={noiseOctaves}
              noisePersistence={noisePersistence}
              noiseLacunarity={noiseLacunarity}
              segments={segments}
              heightData={heightDataRef.current}
              colorData={colorDataRef.current}
              roadStrength={roadStrengthRef.current}
              playerPosition={playerPosition}
              biomeDensity={chunkBiome.grassDensity}
              precomputedSpawns={grassSpawnsRef.current}
            />
          </DecorationGate>
        )}
        
        {enableDecorations && (
          <DecorationGate chunkKey={chunkKey} minPhase={1}>
            <ProceduralBoulders
              width={width}
              height={height}
              positionX={0}
              positionY={0}
              positionZ={0}
              seed={seed}
              gridX={gridX}
              gridZ={gridZ}
              heightData={heightDataRef.current}
              heightScale={heightScale}
              biomeDensity={chunkBiome.boulderDensity}
              precomputedSpawns={boulderSpawnsRef.current}
            />
          </DecorationGate>
        )}

        {enableDecorations && chunkBiome.treeDensity > 0 && (
          <DecorationGate chunkKey={chunkKey} minPhase={2}>
            <ProceduralTrees
              chunkX={gridX}
              chunkZ={gridZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              segments={segments}
              heightData={heightDataRef.current}
              colorData={colorDataRef.current}
              playerPosition={playerPosition}
              treeDensity={chunkBiome.treeDensity}
              positionY={positionY}
              precomputedSpawns={treeSpawnsRef.current}
            />
          </DecorationGate>
        )}

        {enableDecorations && chunkBiome.shrubDensity > 0 && (
          <DecorationGate chunkKey={chunkKey} minPhase={2}>
            <ProceduralShrubs
              chunkX={gridX}
              chunkZ={gridZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              segments={segments}
              heightData={heightDataRef.current}
              colorData={colorDataRef.current}
              playerPosition={playerPosition}
              shrubDensity={chunkBiome.shrubDensity}
              positionY={positionY}
              precomputedSpawns={shrubSpawnsRef.current}
            />
          </DecorationGate>
        )}

        {enableDecorations && chunkBiome.flowerDensity > 0 && (
          <DecorationGate chunkKey={chunkKey} minPhase={2}>
            <ProceduralFlowers
              chunkX={gridX}
              chunkZ={gridZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              segments={segments}
              heightData={heightDataRef.current}
              colorData={colorDataRef.current}
              playerPosition={playerPosition}
              flowerDensity={chunkBiome.flowerDensity}
              positionY={positionY}
              precomputedSpawns={flowerSpawnsRef.current}
            />
          </DecorationGate>
        )}

        {enableDecorations && (
          <DecorationGate chunkKey={chunkKey} minPhase={2}>
            <PluginDecorations
              chunkX={gridX}
              chunkZ={gridZ}
              originX={positionX}
              originZ={positionZ}
              seed={seed}
              width={width}
              height={height}
              heightScale={heightScale}
              segments={segments}
              heightData={heightDataRef.current}
              roadStrength={roadStrengthRef.current}
              playerPosition={playerPosition}
              treeSpawns={treeSpawnsRef.current}
              boulderSpawns={boulderSpawnsRef.current}
            />
          </DecorationGate>
        )}

        </ChunkBundleProvider>
      </group>
    </>
  );
}
