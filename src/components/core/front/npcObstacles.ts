// World-space "keep NPCs out of here" registry.
//
// Terrain chunks register the XZ positions + clearance radii of their
// decorations (trees, boulders, shrubs, plugin decorations) as they load,
// and unregister on unmount. InfiniteTerrain publishes the water level.
// useNavcatPathfinding consumes both:
//   - the water level filters underwater triangles OUT of the navmesh
//     (so wander paths can't route through ponds at all), and
//   - isNpcPointClear() rejects candidate spawn/wander points that land
//     inside a decoration's clearance radius.
//
// Deliberately not a React store — lookups happen inside point-sampling
// loops and nothing ever needs to re-render off this data.

// chunkKey -> packed [x, z, radius] triples (world space)
const chunkObstacles = new Map<string, Float32Array>();

// Optional mirror: the NPC sim worker keeps its own copy of this registry so
// spawn/wander point rejection can run worker-side. Attached by
// useNavcatPathfinding once the worker exists; attach replays current state.
export interface NpcObstacleSink {
	setObstacles(chunkKey: string, packed: Float32Array): void;
	removeObstacles(chunkKey: string): void;
	setWaterLevel(y: number): void;
}

let obstacleSink: NpcObstacleSink | null = null;

export function setNpcObstacleSink(sink: NpcObstacleSink | null): void {
	obstacleSink = sink;
	if (sink) {
		for (const [key, packed] of chunkObstacles) sink.setObstacles(key, packed);
		if (waterLevelY > -Infinity) sink.setWaterLevel(waterLevelY);
	}
}

// Terrain cell (chunk) size — published by InfiniteTerrain. NPCs freeze
// their wandering while the player is on a different cell than they are.
// 0 = no chunked terrain in this world → same-cell is always true.
let cellWidth = 0;
let cellHeight = 0;

export function setNpcTerrainCellSize(width: number, height: number): void {
	cellWidth = width;
	cellHeight = height;
}

/**
 * True when both points are on the same terrain cell (same grid math as
 * InfiniteTerrain: floor(x / width), floor(z / height)). Always true in
 * worlds without chunked terrain.
 */
export function isSameTerrainCell(ax: number, az: number, bx: number, bz: number): boolean {
	if (cellWidth <= 0 || cellHeight <= 0) return true;
	return (
		Math.floor(ax / cellWidth) === Math.floor(bx / cellWidth) &&
		Math.floor(az / cellHeight) === Math.floor(bz / cellHeight)
	);
}

// World Y of the water surface. Default sits far below any terrain so
// worlds without water (or before terrain mounts) filter nothing.
let waterLevelY = -Infinity;

export function setNpcWaterLevel(y: number): void {
	waterLevelY = y;
	obstacleSink?.setWaterLevel(y);
}

export function getNpcWaterLevel(): number {
	return waterLevelY;
}

export function registerNpcObstacles(chunkKey: string, packed: Float32Array): void {
	if (packed.length > 0) {
		chunkObstacles.set(chunkKey, packed);
		obstacleSink?.setObstacles(chunkKey, packed);
	} else {
		chunkObstacles.delete(chunkKey);
		obstacleSink?.removeObstacles(chunkKey);
	}
}

export function unregisterNpcObstacles(chunkKey: string): void {
	chunkObstacles.delete(chunkKey);
	obstacleSink?.removeObstacles(chunkKey);
}

/**
 * Append [worldX, worldZ, radius] triples for a decoration spawn array
 * (7-float stride: x, y, z, scale, ... — chunk-local) to `out`.
 * Radius = base + scale × perScale.
 */
export function packSpawnObstacles(
	out: number[],
	spawns: Float32Array | null | undefined,
	originX: number,
	originZ: number,
	baseRadius: number,
	radiusPerScale: number
): void {
	if (!spawns || spawns.length < 7) return;
	for (let o = 0; o + 3 < spawns.length; o += 7) {
		out.push(originX + spawns[o], originZ + spawns[o + 2], baseRadius + spawns[o + 3] * radiusPerScale);
	}
}

/**
 * True when the point is above water and outside every registered
 * decoration's clearance radius. Linear scan over loaded chunks' obstacle
 * lists — a few hundred distance checks worst case, and it only runs while
 * sampling NPC spawn/wander candidates (a few times a minute).
 */
export function isNpcPointClear(x: number, y: number, z: number): boolean {
	// Small margin so "on the shoreline with feet in the water" also rejects.
	if (y < waterLevelY + 0.35) return false;
	for (const packed of chunkObstacles.values()) {
		for (let i = 0; i + 2 < packed.length; i += 3) {
			const dx = x - packed[i];
			const dz = z - packed[i + 1];
			const r = packed[i + 2];
			if (dx * dx + dz * dz < r * r) return false;
		}
	}
	return true;
}
