/**
 * Worker-side grass blade geometry builder.
 *
 * This is a fork of `tslfx`'s `createFullGrassGeometry` (the CPU half of
 * its `grass()` helper). The TSL half — `createPositionNode`, which
 * billboards each blade toward the camera and applies wind sway — stays
 * on the main thread in `GrassShader.tsx` as a shared material factory,
 * because TSL node graphs are GPU/main-thread constructs and can't be
 * built in a worker.
 *
 * Why fork instead of import: `tslfx` only exports the combined `grass()`
 * (geometry + node together), so there is no way to run the two halves on
 * different threads without duplicating the CPU half here. Running it here
 * removes the ~400k-vertex synchronous build from the main thread — the
 * last decoration that still hitched the frame on chunk-cross.
 *
 * Output: one merged `BakedMesh` (`{ blades }`). Each spawn point expands
 * into `bladesPerPoint` blades; each blade is a 3-vertex degenerate
 * triangle (all 3 verts at the same point) that the GPU spreads into a
 * camera-facing billboard using the per-vertex `bladeHeight` / `bladeWidth`
 * attributes. Indices are Uint32 — blade counts easily exceed the 16-bit
 * cap (e.g. 300 blades × hundreds of spawns).
 *
 * Determinism: tslfx uses bare `Math.random()`, so its blade layout differs
 * every reload and per machine. This port seeds an `alea` PRNG from the
 * chunk's `rngSeedSalt`, drawing in tslfx's exact order (height, width,
 * colorSampleIndex, then per non-centre blade: angle, distance). The result
 * is stable across reloads and multiplayer peers — a deliberate behaviour
 * change from the pre-worker visual.
 */
import { Color, Vector3 } from 'three';
import { alea } from 'seedrandom';
import type { BakedMesh } from '../terrainWorker.protocol';

/**
 * Grass appearance + wind parameters. Hoisted out of `GrassShader.tsx`
 * so the worker builder, the main-thread fallback, and the wind
 * `positionNode` factory all read the same numbers and can't drift.
 *
 * `bladesPerPoint` / `clusterRadius` are device-tiered. The `wind*` and
 * `upBias` fields are consumed only by the main-thread `positionNode`
 * (the worker doesn't touch them) but live here to keep one source of truth.
 */
export const GRASS_PARAMS = {
  colorA: '#2d5a25',
  colorB: '#4a7c3f',
  colorSamples: 4,
  baseDarkness: 0.05,
  heightVariation: { min: 0.4, max: 0.7 },
  widthVariation: { min: 0.03, max: 0.06 },
  bladesPerPoint: { desktop: 300, mobile: 100 },
  clusterRadius: { desktop: 1.2, mobile: 0.8 },
  // Consumed by the main-thread positionNode (createPositionNode port).
  windSpeed: 0.45,
  windSize: 2,
  windDisplacement: 0.15,
  upBias: 1.5,
} as const;

export interface BuildGrassInput {
  /** Grass spawn positions, `[x, y, z, ...]` triplets (chunk-local). */
  spawns: Float32Array;
  isMobile: boolean;
  /** Seed salt for deterministic blade layout (e.g. `${seed}-${gx}-${gz}`). */
  rngSeedSalt: string;
}

const EMPTY_BLADES: BakedMesh = {
  positions: new Float32Array(0),
  normals: new Float32Array(0),
  indices: new Uint32Array(0),
};

export function buildGrassDecoration(input: BuildGrassInput): { blades: BakedMesh } {
  const { spawns, isMobile, rngSeedSalt } = input;

  const pointCount = Math.floor(spawns.length / 3);
  if (pointCount === 0) return { blades: { ...EMPTY_BLADES } };

  const bladesPerPoint = isMobile
    ? GRASS_PARAMS.bladesPerPoint.mobile
    : GRASS_PARAMS.bladesPerPoint.desktop;
  const clusterRadius = isMobile
    ? GRASS_PARAMS.clusterRadius.mobile
    : GRASS_PARAMS.clusterRadius.desktop;

  const totalBladeCount = pointCount * bladesPerPoint;
  const vertexCount = totalBladeCount * 3;

  const positions = new Float32Array(vertexCount * 3);
  // Grass is rendered with an unlit MeshBasicNodeMaterial whose positionNode
  // billboards toward the camera — it never reads vertex normals. Emitting a
  // normal buffer was ~12 bytes/vertex of pure waste (the single largest
  // decoration geometry per chunk), so we skip it entirely. The terrain-up
  // vector is still used below for the cluster-scatter tangent frame.
  const normals = new Float32Array(0);
  const colors = new Float32Array(vertexCount * 3);
  const bladeHeight = new Float32Array(vertexCount);
  const bladeWidth = new Float32Array(vertexCount);
  const indices = new Uint32Array(totalBladeCount * 3);

  // Pre-compute the colour ramp samples (matches tslfx exactly).
  const colorAVec = new Color(GRASS_PARAMS.colorA);
  const colorBVec = new Color(GRASS_PARAMS.colorB);
  const colorSamples: Color[] = [];
  for (let i = 0; i < GRASS_PARAMS.colorSamples; i++) {
    const lerpValue = i / (GRASS_PARAMS.colorSamples - 1);
    colorSamples.push(colorAVec.clone().lerp(colorBVec, lerpValue));
  }

  const { min: minHeight, max: maxHeight } = GRASS_PARAMS.heightVariation;
  const { min: minWidth, max: maxWidth } = GRASS_PARAMS.widthVariation;
  const heightRange = maxHeight - minHeight;
  const widthRange = maxWidth - minWidth;
  const twoPi = 2 * Math.PI;

  // Terrain normal is hard-coded up (the pre-worker GrassShader built the
  // spawn geometry with `normal = (0,1,0)` for every point). Keep the same
  // tangent-frame math as tslfx so the cluster disc matches.
  const tmpTerrainNormal = new Vector3(0, 1, 0);
  const tmpReference = new Vector3();
  const tmpTangent1 = new Vector3();
  const tmpTangent2 = new Vector3();
  const tmpOffset = new Vector3();
  const tmpOffsetComponent1 = new Vector3();
  const tmpOffsetComponent2 = new Vector3();

  const random = alea(`grass-${rngSeedSalt}`);

  let bladeIndex = 0;
  for (let i = 0; i < pointCount; i++) {
    const centerX = spawns[i * 3];
    const centerY = spawns[i * 3 + 1];
    const centerZ = spawns[i * 3 + 2];

    for (let j = 0; j < bladesPerPoint; j++) {
      const vertexOffset = bladeIndex * 9;
      const indexOffset = bladeIndex * 3;
      const heightOffset = bladeIndex * 3;

      const randomHeight = minHeight + random() * heightRange;
      const randomWidth = minWidth + random() * widthRange;
      const colorSampleIndex = Math.floor(random() * GRASS_PARAMS.colorSamples);
      const bladeColor = colorSamples[colorSampleIndex];
      const bladeColorR = bladeColor.r;
      const bladeColorG = bladeColor.g;
      const bladeColorB = bladeColor.b;

      let worldX: number, worldY: number, worldZ: number;
      if (j === 0) {
        worldX = centerX;
        worldY = centerY;
        worldZ = centerZ;
      } else {
        const angle = random() * twoPi;
        const distance = Math.sqrt(random()) * clusterRadius;
        const terrainUp = tmpTerrainNormal;
        tmpReference.set(
          Math.abs(terrainUp.y) < 0.9 ? 0 : 1,
          Math.abs(terrainUp.y) < 0.9 ? 1 : 0,
          0,
        );
        tmpTangent1.crossVectors(terrainUp, tmpReference).normalize();
        tmpTangent2.crossVectors(terrainUp, tmpTangent1).normalize();
        const offsetX = Math.cos(angle) * distance;
        const offsetZ = Math.sin(angle) * distance;
        tmpOffsetComponent1.copy(tmpTangent1).multiplyScalar(offsetX);
        tmpOffsetComponent2.copy(tmpTangent2).multiplyScalar(offsetZ);
        tmpOffset.copy(tmpOffsetComponent1).add(tmpOffsetComponent2);
        worldX = centerX + tmpOffset.x;
        worldY = centerY + tmpOffset.y;
        worldZ = centerZ + tmpOffset.z;
      }

      for (let k = 0; k < 3; k++) {
        positions[vertexOffset + k * 3 + 0] = worldX;
        positions[vertexOffset + k * 3 + 1] = worldY;
        positions[vertexOffset + k * 3 + 2] = worldZ;
        bladeHeight[heightOffset + k] = randomHeight;
        bladeWidth[heightOffset + k] = randomWidth;
      }

      // Middle vertex (k===1, the blade tip) gets the brighter tint.
      const tipBrightness =
        1 - GRASS_PARAMS.baseDarkness + (randomHeight / maxHeight) * GRASS_PARAMS.baseDarkness;
      const baseBrightness = 1 - GRASS_PARAMS.baseDarkness;
      for (let k = 0; k < 3; k++) {
        const brightness = k === 1 ? tipBrightness : baseBrightness;
        colors[vertexOffset + k * 3 + 0] = bladeColorR * brightness;
        colors[vertexOffset + k * 3 + 1] = bladeColorG * brightness;
        colors[vertexOffset + k * 3 + 2] = bladeColorB * brightness;
      }

      // Winding matches tslfx: (0, 2, 1).
      indices[indexOffset + 0] = indexOffset + 0;
      indices[indexOffset + 1] = indexOffset + 2;
      indices[indexOffset + 2] = indexOffset + 1;

      bladeIndex++;
    }
  }

  return {
    blades: { positions, normals, indices, colors, bladeHeight, bladeWidth },
  };
}
