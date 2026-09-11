/**
 * Block schema layer — turns the package's JSON block schemas (schemas/*.json,
 * the same contract the native desktop editor and docs are built on) into a
 * field model the in-world inspector renders generically. Every block type
 * gets full attribute editing without per-type UI code.
 */

import modelSchema from '../../schemas/model-block.schema.json';
import npcSchema from '../../schemas/npc-block.schema.json';
import portalSchema from '../../schemas/portal-block.schema.json';
import audioSchema from '../../schemas/audio-block.schema.json';
import videoSchema from '../../schemas/video-block.schema.json';
import imageSchema from '../../schemas/image-block.schema.json';
import lightSchema from '../../schemas/light-block.schema.json';
import textSchema from '../../schemas/text-block.schema.json';
import skySchema from '../../schemas/sky-block.schema.json';
import terrainSchema from '../../schemas/terrain-block.schema.json';
import networkingSchema from '../../schemas/networking-block.schema.json';
import environmentSchema from '../../schemas/environment-block.schema.json';
import spawnPointSchema from '../../schemas/spawn-point-block.schema.json';
import rideableSchema from '../../schemas/rideable-block.schema.json';
import { getCustomBlockType, getCustomBlockTypes } from '../blocks/customBlockRegistry';
// Seeded blank avatar — resolves to '/assets/defaults/avatars/blank_avatar.vrm'
// via the build's asset-url transform (same mechanism as Player/Participants).
// @ts-ignore - asset import
import blankVRM from '../defaults/avatars/blank_avatar.vrm';

export type FieldType = 'number' | 'string' | 'enum' | 'color' | 'longtext' | 'url' | 'boolean';

export interface BlockField {
	/** Attribute name as written to HTML (schema names are lowercase; HTML
	 *  attribute lookup is case-insensitive so this is canonical). */
	attr: string;
	label: string;
	type: FieldType;
	default: string;
	options?: string[];
	/** Display labels for enum options (custom blocks); keys are raw values. */
	optionLabels?: Record<string, string>;
	description?: string;
	/** number fields only (custom blocks). */
	min?: number;
	max?: number;
	step?: number;
}

export interface BlockTypeInfo {
	tag: string;
	title: string;
	description: string;
	category: string;
	/** 3D-placeable (selectable in the viewport) vs singleton/config block. */
	placeable: boolean;
	fields: BlockField[];
	/** Attr names that make up the transform rows (kept out of `fields`). */
	hasTransform: boolean;
	/** Which transform attrs this schema actually defines (spawn points have
	 *  position+rotation but no scale — don't write attrs it doesn't own). */
	transformAttrs: string[];
}

interface RawSchema {
	title?: string;
	description?: string;
	properties?: Record<string, {
		type?: string;
		description?: string;
		default?: unknown;
		enum?: string[];
	}>;
}

const TRANSFORM_ATTRS = new Set([
	'positionx', 'positiony', 'positionz',
	'rotationx', 'rotationy', 'rotationz',
	'scalex', 'scaley', 'scalez',
]);

const LONGTEXT_ATTRS = new Set([
	'personality', 'defaultmessage', 'objectawareness', 'instances', 'waypoints', 'seats', 'textcontent',
]);

function fieldTypeFor(attr: string, raw: { type?: string; enum?: string[] }): FieldType {
	if (raw.enum && raw.enum.length > 0) return 'enum';
	if (attr.includes('color')) return 'color';
	if (LONGTEXT_ATTRS.has(attr)) return 'longtext';
	if (attr.endsWith('url') || attr === 'hdr' || attr === 'threepreviewimage') return 'url';
	if (raw.type === 'number' || raw.type === 'integer') return 'number';
	return 'string';
}

function labelFor(attr: string): string {
	// threeobjecturl → Three Object Url; participantlimit → Participant Limit.
	// Schema attrs are lowercase, so split on known word stems.
	const words = attr
		.replace(/(url|color|limit|distance|model|content|message|offset|factor|angle|gain|height|width|scale|enabled|point|location|awareness|destination|target|image)/g, ' $1')
		.replace(/(position|rotation|trigger|aspect|inner|outer|max|ref|rolloff|device|preview|three|object|spawn|world|video|audio|texture|render|day|night|time|cycle)/g, ' $1')
		.trim();
	return words.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function buildInfo(
	tag: string,
	schema: RawSchema,
	category: string,
	placeable: boolean,
): BlockTypeInfo {
	const fields: BlockField[] = [];
	let hasTransform = false;
	const transformAttrs: string[] = [];
	const props = schema.properties ?? {};
	for (const [attr, raw] of Object.entries(props)) {
		if (TRANSFORM_ATTRS.has(attr)) {
			hasTransform = true;
			transformAttrs.push(attr);
			continue;
		}
		fields.push({
			attr,
			label: labelFor(attr),
			type: fieldTypeFor(attr, raw),
			default: raw.default !== undefined ? String(raw.default) : '',
			options: raw.enum,
			description: raw.description,
		});
	}
	return {
		tag,
		title: schema.title ?? tag,
		description: schema.description ?? '',
		category,
		placeable,
		fields,
		hasTransform,
		transformAttrs,
	};
}

/** Every supported block type, keyed by tag. */
export const BLOCK_TYPES: Record<string, BlockTypeInfo> = {
	'three-model-block': buildInfo('three-model-block', modelSchema as RawSchema, 'Objects', true),
	'three-text-block': buildInfo('three-text-block', textSchema as RawSchema, 'Objects', true),
	'three-image-block': buildInfo('three-image-block', imageSchema as RawSchema, 'Media', true),
	'three-video-block': buildInfo('three-video-block', videoSchema as RawSchema, 'Media', true),
	'three-audio-block': buildInfo('three-audio-block', audioSchema as RawSchema, 'Media', true),
	'three-npc-block': buildInfo('three-npc-block', npcSchema as RawSchema, 'Interactive', true),
	'three-portal-block': buildInfo('three-portal-block', portalSchema as RawSchema, 'Interactive', true),
	'three-rideable-block': buildInfo('three-rideable-block', rideableSchema as RawSchema, 'Interactive', true),
	'three-light-block': buildInfo('three-light-block', lightSchema as RawSchema, 'Environment', true),
	'three-spawn-point-block': buildInfo('three-spawn-point-block', spawnPointSchema as RawSchema, 'World', true),
	'three-sky-block': buildInfo('three-sky-block', skySchema as RawSchema, 'World', false),
	'three-terrain-block': buildInfo('three-terrain-block', terrainSchema as RawSchema, 'World', false),
	'three-networking-block': buildInfo('three-networking-block', networkingSchema as RawSchema, 'World', false),
	'three-environment-block': buildInfo('three-environment-block', environmentSchema as RawSchema, 'World', false),
};

/** Tags a user can ADD from the palette. Spawn points render as edit-mode
 *  ghosts (EditGhostsHost) rather than through the block parsers. */
export const ADDABLE_TAGS = [
	'three-model-block',
	'three-text-block',
	'three-image-block',
	'three-video-block',
	'three-audio-block',
	'three-npc-block',
	'three-portal-block',
	'three-light-block',
	'three-rideable-block',
	'three-spawn-point-block',
] as const;

/** Singleton/config blocks offered in the palette ONLY when the world does
 *  not already have one (a second sky or networking block is a bug). */
export const SINGLETON_ADDABLE_TAGS = [
	'three-sky-block',
	'three-terrain-block',
	'three-networking-block',
] as const;

export function blockTypeFor(tag: string): BlockTypeInfo | null {
	return BLOCK_TYPES[tag] ?? getCustomBlockType(tag)?.info ?? null;
}

/** Built-in tags + currently registered custom block tags. */
export function allBlockTypeTags(): string[] {
	return [...Object.keys(BLOCK_TYPES), ...getCustomBlockTypes().map((t) => t.tag)];
}

/** Reasonable starter attributes for a freshly added block of `tag`,
 *  placed at `position` (world). Values come from schema defaults. */
export function defaultAttrsFor(tag: string, position: [number, number, number]): Record<string, string> {
	const info = blockTypeFor(tag);
	const attrs: Record<string, string> = {};
	if (!info) return attrs;
	for (const f of info.fields) {
		if (f.default !== '') attrs[f.attr] = f.default;
	}
	if (info.hasTransform) {
		const has = new Set(info.transformAttrs);
		if (has.has('positionx')) attrs.positionx = String(position[0]);
		if (has.has('positiony')) attrs.positiony = String(position[1]);
		if (has.has('positionz')) attrs.positionz = String(position[2]);
		for (const r of ['rotationx', 'rotationy', 'rotationz']) {
			if (has.has(r)) attrs[r] = '0';
		}
		for (const s of ['scalex', 'scaley', 'scalez']) {
			if (has.has(s)) attrs[s] = '1';
		}
	}
	// Type-specific seeds that make a new block visible/useful immediately.
	if (tag === 'three-text-block') attrs.textcontent = attrs.textcontent || 'New text';
	if (tag === 'three-light-block') {
		attrs.type = attrs.type || 'point';
		attrs.intensity = attrs.intensity || '1';
		attrs.color = attrs.color || '#ffffff';
	}
	if (tag === 'three-npc-block') {
		// A fresh npc block must never mount with an empty avatar URL —
		// GLTFLoader('') fetches the page itself and crashes the canvas.
		// Seed the shipped blank avatar; the author swaps it in the inspector.
		attrs.threeobjecturl = attrs.threeobjecturl || blankVRM;
		attrs.name = attrs.name || 'New NPC';
	}
	return attrs;
}
