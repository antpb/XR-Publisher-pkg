import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, DoubleSide, Texture } from "three";
import {
	Sky
} from "@react-three/drei";
import { ThreeSkyProps } from "./ThreeSky.d";

/**
 * Represents a sky in a virtual reality scene.
 *
 * @param {Object} sky - The props for the sky.
 *
 * @return {JSX.Element} The sky.
 */
export function ThreeSky(sky : ThreeSkyProps) {
	let skyUrl, distance, rayleigh, sunPositionX, sunPositionY, sunPositionZ;

	if (sky.src[0].tagName.toLowerCase() === 'three-sky-block') {
		skyUrl = sky.src[0].getAttribute("skyUrl");
		distance = sky.src[0].getAttribute("distance");
		rayleigh = sky.src[0].getAttribute("rayleigh");
		sunPositionX = sky.src[0].getAttribute("sunPositionX");
		sunPositionY = sky.src[0].getAttribute("sunPositionY");
		sunPositionZ = sky.src[0].getAttribute("sunPositionZ");															
	} else {

		skyUrl = sky.src[0].querySelector("p.sky-block-url")
		? sky.src[0].querySelector("p.sky-block-url").innerText
		: "";

		distance = sky.src[0].querySelector("p.sky-block-distance")
		? sky.src[0].querySelector("p.sky-block-distance").innerText
		: "";

		rayleigh = sky.src[0].querySelector("p.sky-block-rayleigh")
		? sky.src[0].querySelector("p.sky-block-rayleigh").innerText
		: "";

		sunPositionX = sky.src[0].querySelector("p.sky-block-sunPositionX")
		? sky.src[0].querySelector("p.sky-block-sunPositionX").innerText
		: "";

		sunPositionY = sky.src[0].querySelector("p.sky-block-sunPositionY")
		? sky.src[0].querySelector("p.sky-block-sunPositionY").innerText
		: "";

		sunPositionZ = sky.src[0].querySelector("p.sky-block-sunPositionZ")
		? sky.src[0].querySelector("p.sky-block-sunPositionZ").innerText
		: "";
	}

	if(skyUrl === "" || skyUrl === undefined || skyUrl === null) {
		// Defaults matter here: an absent attribute reads as null, and
		// `Number(null)` is 0 — a sky at distance 0 with the sun at the origin
		// renders as a degenerate black dome. These match schemas/
		// sky-block.schema.json, so a bare <three-sky-block> looks like a sky.
		// (This block was never rendered at all until the auto-init path
		// stopped hardcoding `sky: ''`, so partial attributes were never
		// exercised before.)
		const numOr = (v: string | null | undefined, dflt: number) => {
			if (v === null || v === undefined || v === '') return dflt;
			const n = Number(v);
			return Number.isFinite(n) ? n : dflt;
		};
		return (
			<Sky
			distance={numOr(distance, 170000)}
			sunPosition={[
				numOr(sunPositionX, 0),
				numOr(sunPositionY, 1),
				numOr(sunPositionZ, -10000),
			]}
			rayleigh={numOr(rayleigh, 1)}
		/>
		);
	} else {
		const texture1 = useLoader(TextureLoader, skyUrl) as Texture | Texture[];
		return (
			<>
				<mesh
					userData={{ camExcludeCollision: true }}
					visible
					position={[0, 0, 0]}
					scale={[1, 1, 1]}
					rotation={[0, 0, 0]}
				>
					<sphereGeometry args={[300, 60, 60]} />
					<meshBasicMaterial side={DoubleSide} map={Array.isArray(texture1) ? texture1[0] : texture1} />
				</mesh>
			</>
		);
	}	
}
