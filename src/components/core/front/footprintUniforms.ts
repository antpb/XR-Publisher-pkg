import { uniformArray, uniform } from 'three/tsl';
import { Vector2 } from 'three';

export const MAX_TERRAIN_FOOTPRINTS = 16;

const _positionsXZ: Vector2[] = [];
const _ageType: Vector2[] = [];

for (let i = 0; i < MAX_TERRAIN_FOOTPRINTS; i++) {
  _positionsXZ.push(new Vector2(99999, 99999));
  _ageType.push(new Vector2(1.0, 0));
}

export const footprintPositionsXZ = uniformArray(_positionsXZ, 'vec2');
export const footprintAgeTypeArray = uniformArray(_ageType, 'vec2');
export const footprintCount = uniform(0);

export const rawFootprintPositions = _positionsXZ;
export const rawFootprintAgeType = _ageType;
