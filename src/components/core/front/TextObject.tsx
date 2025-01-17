import React, { useRef } from "react";
import { Color } from "three";
import {
	Text,
} from "@react-three/drei";
import { TextObjectProps } from "./TextObject.d";

/**
 * Represents a text object in a virtual reality scene.
 *
 * @param {Object} model - The props for the text object.
 *
 * @return {JSX.Element} The text object.
 */
export function TextObject(model: TextObjectProps): JSX.Element {
	const htmlObj = useRef();
	var colorValue = new Color( parseInt ( model.textColor.replace("#","0x"), 16 ) );
	return (
		<>
			<group
				userData={{ camExcludeCollision: true }}
				position={[model.positionX, model.positionY, model.positionZ]}
				rotation={[model.rotationX, model.rotationY, model.rotationZ]}
				scale={[model.scaleX, model.scaleY, model.scaleZ]}
				ref={htmlObj}
			>
				<Text
					font={model.defaultFont}
					scale={[1, 1, 1]}
					// rotation-y={-Math.PI / 2}
					maxWidth={10}
					color={colorValue}
				>
					{model.textContent}
				</Text>
			</group>
		</>
	);
}
