/**
 * TextObject — the `<three-text-block>` renderer.
 *
 * History: this drew a 2×0.5×0.1 coloured BOX and never rendered
 * `textcontent` at all (the MSDF text mesh it originally used was removed).
 * It now renders real text through `CanvasTextMesh`, the renderer-agnostic
 * text path — MSDF text is TSL-based and draws nothing on the WebGL/XR
 * branch, so canvas text is the only option that works on both.
 *
 * Sizing: the text lays out in a 2-world-unit-wide wrap box with ~0.35u
 * glyphs (about the footprint of the old placeholder box) and is scaled by
 * the block's own scale attributes, so `scalex="2"` doubles the text size.
 */
import React, { useRef } from "react";
import { CanvasTextMesh } from "./CanvasTextMesh";
import { TextObjectProps } from "./TextObject.d";

/** Wrap-box width in world units at scale 1. */
const TEXT_BOX_WIDTH = 2;
/** Glyph height in world units at scale 1. */
const TEXT_FONT_SIZE = 0.35;

export function TextObject(model: TextObjectProps): React.JSX.Element {
	const htmlObj = useRef(null);
	const safeColor = typeof model.textColor === 'string' && model.textColor ? model.textColor : '#ffffff';
	const text = typeof model.textContent === 'string' ? model.textContent : '';
	// An absent attribute parses to NaN upstream, and a NaN anywhere in the
	// transform drops the object out of the scene graph's matrix math.
	const axis = (v: number | undefined, dflt: number) =>
		(typeof v === 'number' && Number.isFinite(v)) ? v : dflt;
	return (
		<group
			userData={{ camExcludeCollision: true }}
			position={[axis(model.positionX, 0), axis(model.positionY, 0), axis(model.positionZ, 0)]}
			rotation={[axis(model.rotationX, 0), axis(model.rotationY, 0), axis(model.rotationZ, 0)]}
			scale={[axis(model.scaleX, 1), axis(model.scaleY, 1), axis(model.scaleZ, 1)]}
			ref={htmlObj}
		>
			{text ? (
				<CanvasTextMesh
					text={text}
					worldWidth={TEXT_BOX_WIDTH}
					worldFontSize={TEXT_FONT_SIZE}
					color={safeColor}
					anchorX="center"
					anchorY="middle"
					align="center"
				/>
			) : null}
		</group>
	);
}
