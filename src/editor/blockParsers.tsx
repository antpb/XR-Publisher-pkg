/**
 * Block parsers — the attribute→component logic for every placeable block
 * type, extracted VERBATIM from EnvironmentFront's inline maps (which had
 * two identical copies, one per renderer branch). Centralizing it here lets
 * `EditableBlockHost` re-parse a SINGLE block when the in-world editor
 * changes its attributes — the only way to re-render one block with fresh
 * props without re-rendering the world tree.
 *
 * Keep parsing semantics identical to the historical maps: attribute names,
 * Number() coercions, defaults, and prop shapes are load-bearing (published
 * worlds rely on them).
 */

import React from 'react';
import { Portal } from '../components/core/front/Portal';
import { ThreeVideo } from '../components/core/front/ThreeVideo';
import { ThreeAudio } from '../components/core/front/ThreeAudio';
import { ThreeLight } from '../components/core/front/ThreeLight';
import { TextObject } from '../components/core/front/TextObject';
import { ModelObject } from '../components/core/front/ModelObject';
import { ThreeImage } from '../components/core/front/ThreeImage';
import { NPCObject } from '../components/core/front/NPCObject.js';
import { RideableObject } from '../components/core/front/RideableObject';
import defaultFont from '../defaults/fonts/roboto.woff';
import { CustomBlockObject } from '../blocks/CustomBlockObject';
import type { EditableKind } from './editSession';

export interface BlockRenderCtx {
	/** props.threeObjectPluginRoot from EnvironmentFront (NPC prop). */
	threeObjectPluginRootProp: string;
	/** Model map side-effect: track alt names for NPC object awareness. */
	noteAlt?: (alt: string) => void;
	/** Audio map onLoad sink. */
	onAudioLoad?: (audio: unknown) => void;
	/** Keyboard movement ref from useKeyboardControls (rideables). */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	movement?: { current: any };
}

function attr(el: Element, name: string): string {
	return el.getAttribute(name) || '';
}

/** Numeric attribute with a fallback for missing/blank/NaN values. Plain
 *  `Number(attr(...))` yields NaN for an absent attribute, which is only safe
 *  where the component treats NaN as "unset". */
function num(el: Element, name: string, dflt: number): number {
	const raw = el.getAttribute(name);
	if (raw === null || raw === '') return dflt;
	const n = Number(raw);
	return Number.isFinite(n) ? n : dflt;
}

/** Boolean attribute accepting both authored spellings ('1' and 'true'). */
function bool(el: Element, name: string, dflt = false): boolean {
	const raw = el.getAttribute(name);
	if (raw === null || raw === '') return dflt;
	return raw === '1' || raw === 'true';
}

function renderModel(el: Element, index: number, ctx: BlockRenderCtx): React.ReactNode {
	const isInstanced = attr(el, 'instanced') === 'true';
	const instancesAttr = attr(el, 'instances');
	let instances;
	if (isInstanced && instancesAttr) {
		try {
			instances = JSON.parse(instancesAttr);
		} catch (e) {
			console.error('Failed to parse instances data:', e);
		}
	}
	const alt = attr(el, 'alt');
	if (alt && ctx.noteAlt) ctx.noteAlt(alt);
	return (
		<ModelObject
			key={index}
			url={attr(el, 'threeObjectUrl')}
			positionX={Number(attr(el, 'positionX'))}
			positionY={Number(attr(el, 'positionY'))}
			positionZ={Number(attr(el, 'positionZ'))}
			scaleX={Number(attr(el, 'scaleX'))}
			scaleY={Number(attr(el, 'scaleY'))}
			scaleZ={Number(attr(el, 'scaleZ'))}
			rotationX={Number(attr(el, 'rotationX'))}
			rotationY={Number(attr(el, 'rotationY'))}
			rotationZ={Number(attr(el, 'rotationZ'))}
			alt={alt}
			animations={attr(el, 'animations')}
			collidable={attr(el, 'collidable')}
			threeObjectPluginRoot={''}
			defaultFont={defaultFont}
			instanced={isInstanced}
			instances={instances}
			proximityLoad={attr(el, 'proximityLoad') === '1'}
			triggerLocationX={Number(attr(el, 'triggerLocationX')) || 0}
			triggerLocationY={Number(attr(el, 'triggerLocationY')) || 0}
			triggerLocationZ={Number(attr(el, 'triggerLocationZ')) || 0}
			triggerLocationPosX={Number(attr(el, 'triggerLocationPosX')) || 0}
			triggerLocationPosY={Number(attr(el, 'triggerLocationPosY')) || 0}
			triggerLocationPosZ={Number(attr(el, 'triggerLocationPosZ')) || 0}
		/>
	);
}

function renderImage(el: Element, index: number): React.ReactNode {
	return (
		<ThreeImage
			key={index}
			url={attr(el, 'imageUrl')}
			positionX={Number(attr(el, 'positionX'))}
			positionY={Number(attr(el, 'positionY'))}
			positionZ={Number(attr(el, 'positionZ'))}
			scaleX={Number(attr(el, 'scaleX'))}
			scaleY={Number(attr(el, 'scaleY'))}
			scaleZ={Number(attr(el, 'scaleZ'))}
			rotationX={Number(attr(el, 'rotationX'))}
			rotationY={Number(attr(el, 'rotationY'))}
			rotationZ={Number(attr(el, 'rotationZ'))}
			aspectHeight={Number(attr(el, 'aspectHeight'))}
			aspectWidth={Number(attr(el, 'aspectWidth'))}
			// ThreeImage gates on the legacy '1'/'0' form; accept both
			// authored spellings ('true' and '1') and normalize.
			transparent={attr(el, 'transparent') === 'true' || attr(el, 'transparent') === '1' ? '1' : '0'}
		/>
	);
}

function renderVideo(el: Element, index: number): React.ReactNode {
	return (
		<ThreeVideo
			key={index}
			url={attr(el, 'videoUrl')}
			positionX={Number(attr(el, 'positionX'))}
			positionY={Number(attr(el, 'positionY'))}
			positionZ={Number(attr(el, 'positionZ'))}
			scaleX={Number(attr(el, 'scaleX'))}
			scaleY={Number(attr(el, 'scaleY'))}
			scaleZ={Number(attr(el, 'scaleZ'))}
			rotationX={Number(attr(el, 'rotationX'))}
			rotationY={Number(attr(el, 'rotationY'))}
			rotationZ={Number(attr(el, 'rotationZ'))}
			aspectHeight={Number(attr(el, 'aspectHeight'))}
			aspectWidth={Number(attr(el, 'aspectWidth'))}
			autoPlay={attr(el, 'autoPlay') === '1' ? '1' : '0'}
			customModel={attr(el, 'customModel')}
			threeObjectPluginRoot={window.threeObjectPluginRoot}
			modelUrl={attr(el, 'modelUrl')}
			videoControlsEnabled={attr(el, 'videoControlsEnabled') === '1'}
		/>
	);
}

function renderText(el: Element, index: number): React.ReactNode {
	return (
		<TextObject
			key={index}
			textContent={attr(el, 'textContent')}
			positionX={Number(attr(el, 'positionX'))}
			positionY={Number(attr(el, 'positionY'))}
			positionZ={Number(attr(el, 'positionZ'))}
			scaleX={Number(attr(el, 'scaleX'))}
			scaleY={Number(attr(el, 'scaleY'))}
			scaleZ={Number(attr(el, 'scaleZ'))}
			defaultFont={defaultFont}
			threeObjectPlugin={window.threeObjectPluginRoot}
			textColor={attr(el, 'textColor')}
			rotationX={Number(attr(el, 'rotationX'))}
			rotationY={Number(attr(el, 'rotationY'))}
			rotationZ={Number(attr(el, 'rotationZ'))}
		/>
	);
}

function renderNpc(el: Element, index: number, ctx: BlockRenderCtx): React.ReactNode {
	return (
		<NPCObject
			key={index}
			url={attr(el, 'threeObjectUrl')}
			positionX={Number(attr(el, 'positionX'))}
			positionY={Number(attr(el, 'positionY'))}
			positionZ={Number(attr(el, 'positionZ'))}
			rotationX={Number(attr(el, 'rotationX'))}
			rotationY={Number(attr(el, 'rotationY'))}
			rotationZ={Number(attr(el, 'rotationZ'))}
			objectAwareness={attr(el, 'objectAwareness')}
			name={attr(el, 'name')}
			threeObjectPluginRoot={ctx.threeObjectPluginRootProp}
			defaultFont={defaultFont}
			defaultMessage={attr(el, 'defaultMessage')}
			personality={attr(el, 'personality')}
			scaleX={num(el, 'scaleX', 1)}
			scaleY={num(el, 'scaleY', 1)}
			scaleZ={num(el, 'scaleZ', 1)}
		/>
	);
}

function renderAudio(el: Element, index: number, ctx: BlockRenderCtx): React.ReactNode {
	const attributes = {
		audioUrl: attr(el, 'audioUrl'),
		positionX: Number(attr(el, 'positionX')),
		positionY: Number(attr(el, 'positionY')),
		positionZ: Number(attr(el, 'positionZ')),
		rotationX: Number(attr(el, 'rotationX')),
		rotationY: Number(attr(el, 'rotationY')),
		rotationZ: Number(attr(el, 'rotationZ')),
		autoPlay: attr(el, 'autoPlay') === '1' ? '1' : '0',
		loop: attr(el, 'loop') === '1' ? '1' : '0',
		volume: Number(attr(el, 'volume')),
		positional: attr(el, 'positional') === '1' ? '1' : '0',
		isSpatial: attr(el, 'isSpatial') === '1' ? '1' : '0',
		spatialMetaUrl: attr(el, 'spatialMetaUrl') || undefined,
		triggerLocationX: Number(attr(el, 'triggerLocationX')) || 0,
		triggerLocationY: Number(attr(el, 'triggerLocationY')) || 0,
		triggerLocationZ: Number(attr(el, 'triggerLocationZ')) || 0,
		triggerLocationPosX: Number(attr(el, 'triggerLocationPosX')) || 0,
		triggerLocationPosY: Number(attr(el, 'triggerLocationPosY')) || 0,
		triggerLocationPosZ: Number(attr(el, 'triggerLocationPosZ')) || 0,
		coneInnerAngle: Number(attr(el, 'coneInnerAngle')),
		coneOuterAngle: Number(attr(el, 'coneOuterAngle')),
		coneOuterGain: Number(attr(el, 'coneOuterGain')),
		distanceModel: attr(el, 'distanceModel'),
		maxDistance: Number(attr(el, 'maxDistance')),
		refDistance: Number(attr(el, 'refDistance')),
		rolloffFactor: Number(attr(el, 'rolloffFactor')),
	};
	return (
		<ThreeAudio
			key={index}
			threeAudio={attributes}
			onLoad={(loadedAudio: unknown) => {
				ctx.onAudioLoad?.(loadedAudio);
			}}
		/>
	);
}

function renderLight(el: Element, index: number): React.ReactNode {
	// Shadow attributes are optional: pass `undefined` for anything the author
	// didn't set so ThreeLight.configureShadow applies its own defaults rather
	// than a NaN. (These were parsed nowhere at all before, which left
	// `castshadow` — a documented attribute — permanently inert.)
	const optNum = (name: string): number | undefined => {
		const raw = el.getAttribute(name);
		if (raw === null || raw === '') return undefined;
		const n = Number(raw);
		return Number.isFinite(n) ? n : undefined;
	};
	return (
		<ThreeLight
			key={index}
			positionX={Number(attr(el, 'positionx'))}
			positionY={Number(attr(el, 'positiony'))}
			positionZ={Number(attr(el, 'positionz'))}
			rotationX={Number(attr(el, 'rotationx'))}
			rotationY={Number(attr(el, 'rotationy'))}
			rotationZ={Number(attr(el, 'rotationz'))}
			type={(attr(el, 'type') || 'ambient') as 'ambient' | 'directional' | 'point' | 'spot'}
			color={attr(el, 'color')}
			intensity={Number(attr(el, 'intensity'))}
			distance={Number(attr(el, 'distance'))}
			decay={Number(attr(el, 'decay'))}
			angle={Number(attr(el, 'angle'))}
			penumbra={Number(attr(el, 'penumbra'))}
			castShadow={bool(el, 'castShadow')}
			shadowMapSize={optNum('shadowMapSize')}
			shadowRadius={optNum('shadowRadius')}
			shadowBlurSamples={optNum('shadowBlurSamples')}
			shadowBias={optNum('shadowBias')}
			shadowNormalBias={optNum('shadowNormalBias')}
			shadowCameraNear={optNum('shadowCameraNear')}
			shadowCameraFar={optNum('shadowCameraFar')}
			shadowCameraLeft={optNum('shadowCameraLeft')}
			shadowCameraRight={optNum('shadowCameraRight')}
			shadowCameraTop={optNum('shadowCameraTop')}
			shadowCameraBottom={optNum('shadowCameraBottom')}
		/>
	);
}

function renderPortal(el: Element, index: number): React.ReactNode {
	return (
		<Portal
			key={index}
			url={attr(el, 'threeObjectUrl')}
			destinationUrl={attr(el, 'destinationUrl')}
			defaultFont={defaultFont}
			positionX={Number(attr(el, 'positionX'))}
			positionY={Number(attr(el, 'positionY'))}
			positionZ={Number(attr(el, 'positionZ'))}
			scaleX={Number(attr(el, 'scaleX'))}
			scaleY={Number(attr(el, 'scaleY'))}
			scaleZ={Number(attr(el, 'scaleZ'))}
			rotationX={Number(attr(el, 'rotationX'))}
			rotationY={Number(attr(el, 'rotationY'))}
			rotationZ={Number(attr(el, 'rotationZ'))}
			animations={attr(el, 'animations')}
			label={attr(el, 'label')}
			labelOffsetX={Number(attr(el, 'labelOffsetX'))}
			labelOffsetY={Number(attr(el, 'labelOffsetY'))}
			labelOffsetZ={Number(attr(el, 'labelOffsetZ'))}
			labelTextColor={attr(el, 'labelTextColor')}
			useTeleportDestination={attr(el, 'useTeleportDestination') === 'true'}
			teleportDestinationX={attr(el, 'teleportDestinationX') ? Number(attr(el, 'teleportDestinationX')) : undefined}
			teleportDestinationY={attr(el, 'teleportDestinationY') ? Number(attr(el, 'teleportDestinationY')) : undefined}
			teleportDestinationZ={attr(el, 'teleportDestinationZ') ? Number(attr(el, 'teleportDestinationZ')) : undefined}
		/>
	);
}

function renderRideable(el: Element, index: number, ctx: BlockRenderCtx): React.ReactNode {
	const rUrl = attr(el, 'threeObjectUrl');
	if (!rUrl || rUrl.trim() === '') return null;
	const rName = attr(el, 'name');
	const rideableId = rName || `rideable-${index}`;
	let waypoints: number[][] | undefined;
	const wpAttr = attr(el, 'waypoints');
	if (wpAttr) {
		try { waypoints = JSON.parse(wpAttr); }
		catch (e) { console.error('Failed to parse rideable waypoints:', e); }
	}
	let seats: number[][] | undefined;
	const seatsAttr = attr(el, 'seats');
	if (seatsAttr) {
		try { seats = JSON.parse(seatsAttr); }
		catch (e) { console.error('Failed to parse rideable seats:', e); }
	}
	const rNum = (a: string, d = 0): number => {
		const v = attr(el, a);
		return v === '' ? d : Number(v);
	};
	return (
		<RideableObject
			key={`rideable-${index}`}
			rideableId={rideableId}
			name={rName || 'Vehicle'}
			url={rUrl}
			vehicleType={attr(el, 'vehicleType') || 'car'}
			waypoints={waypoints}
			speed={rNum('speed', 1)}
			positionX={rNum('positionX')}
			positionY={rNum('positionY')}
			positionZ={rNum('positionZ')}
			rotationX={0}
			rotationY={rNum('rotationY')}
			rotationZ={0}
			scaleX={rNum('scaleX', 1)}
			scaleY={rNum('scaleY', 1)}
			scaleZ={rNum('scaleZ', 1)}
			seatOffsetX={rNum('seatOffsetX', 0)}
			seatOffsetY={rNum('seatOffsetY', 0)}
			seatOffsetZ={rNum('seatOffsetZ', 0)}
			seats={seats}
			movement={ctx.movement ?? { current: null }}
			threeObjectPluginRoot={ctx.threeObjectPluginRootProp}
			defaultFont={defaultFont}
		/>
	);
}

export function renderBlockComponent(
	kind: EditableKind,
	el: Element,
	index: number,
	ctx: BlockRenderCtx,
): React.ReactNode {
	switch (kind) {
		case 'model': return renderModel(el, index, ctx);
		case 'image': return renderImage(el, index);
		case 'video': return renderVideo(el, index);
		case 'text': return renderText(el, index);
		case 'npc': return renderNpc(el, index, ctx);
		case 'audio': return renderAudio(el, index, ctx);
		case 'light': return renderLight(el, index);
		case 'portal': return renderPortal(el, index);
		case 'rideable': return renderRideable(el, index, ctx);
		// Plugin custom blocks — the host component resolves the registered
		// type lazily (late plugin registration) and owns create/update/tick/
		// dispose against the plugin spec.
		case 'custom': return <CustomBlockObject key={index} el={el} index={index} />;
		default: return null;
	}
}
