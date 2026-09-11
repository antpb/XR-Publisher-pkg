import React, { useState, useEffect, ReactNode } from 'react';
import { useRapier } from '@react-three/rapier';
import { markLoaded } from '../state/loadProgress';

interface WaitForTerrainProps {
	children: ReactNode;
}

/**
 * Wrapper component that delays rendering children until terrain colliders exist in the physics world.
 * This prevents the player from falling through the terrain during initial load.
 */
export function WaitForTerrain({ children }: WaitForTerrainProps) {
	const { world, rapier } = useRapier();
	const [terrainReady, setTerrainReady] = useState(false);

	useEffect(() => {
		if (!world || !rapier) return;

		const checkForTerrain = () => {
			try {
				const bodies = world.bodies;
				let bodyIndex = 0;
				let body = bodies.get(bodyIndex);
				
				while (body) {
					if (body.bodyType() === rapier.RigidBodyType.Fixed) {
						const numColliders = body.numColliders();
						if (numColliders > 0) {
							for (let i = 0; i < numColliders; i++) {
								const collider = body.collider(i);
								if (collider.shapeType() === rapier.ShapeType.TriMesh) {
									setTerrainReady(true);
									markLoaded('terrain');
									return true;
								}
							}
						}
					}
					bodyIndex++;
					body = bodies.get(bodyIndex);
				}
				return false;
			} catch (e) {
				console.error('❌ Error checking for terrain:', e);
				return false;
			}
		};

		// Check immediately
		if (checkForTerrain()) {
			return;
		}

		// Poll every 100ms until terrain is found
		const interval = setInterval(() => {
			if (checkForTerrain()) {
				clearInterval(interval);
			}
		}, 100);

		// Safety timeout - render player after 10 seconds even if no terrain
		const timeout = setTimeout(() => {
			console.warn('⚠️ WaitForTerrain: Timeout reached, rendering player anyway');
			setTerrainReady(true);
			markLoaded('terrain');
			clearInterval(interval);
		}, 10000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, [world, rapier]);

	if (!terrainReady) {
		return null;
	}

	return <>{children}</>;
}

