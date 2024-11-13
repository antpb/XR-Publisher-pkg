import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, DoubleSide } from "three";
import { ThreeImageProps } from "./ThreeImage.d";

/**
 * Renders an image in a three.js scene.
 *
 * @param {Object} threeImage - The props for the image.
 *
 * @return {JSX.Element} The image.
 */
export function ThreeImage(props: ThreeImageProps): JSX.Element {
	const texture2 = useLoader(TextureLoader, props.url);
	
	return (
	  <mesh
		userData={{ camExcludeCollision: true }}
		visible
		position={[props.positionX, props.positionY, props.positionZ]}
		scale={[props.scaleX, props.scaleY, props.scaleZ]}
		rotation={[props.rotationX, props.rotationY, props.rotationZ]}
	  >
		<planeGeometry args={[props.aspectWidth / 12, props.aspectHeight / 12]} />
		{props.transparent === "1" ? (
		  <meshBasicMaterial transparent side={DoubleSide} map={texture2} />
		) : (
		  <meshStandardMaterial side={DoubleSide} map={texture2} />
		)}
	  </mesh>
	);
  }
	