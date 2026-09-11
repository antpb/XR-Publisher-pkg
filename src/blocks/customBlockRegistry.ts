/**
 * Custom block registry — plugins register EDITOR-PLACEABLE block types.
 *
 * One `XRPublisher.registerBlockType(spec)` call feeds EVERY seam: the
 * in-world editor's Add menu, the schema-generated inspector (typed fields),
 * selection/gizmo/undo, the save round-trip (custom element + wp comment
 * pair inside the environment safe area), and normal page rendering. This
 * is deliberately the opposite of the native desktop editor's old
 * registerBlockMarkupGenerator, which covered only serialization and left
 * the menu/panel/lifecycle hand-wired per type.
 *
 * Tag convention: `three-{pluginSlug}-{blockName}-block`. The slug MUST
 * match the plugin build filename ({slug}-xr-publisher-plugin.umd.js) —
 * the API worker derives the allowed-tag prefix set from the ACTIVE plugin
 * list and strips saved blocks whose plugin isn't active.
 *
 * LATE REGISTRATION IS THE MAINLINE PATH: shipped plugins init on
 * DOMContentLoaded + a runtime poll, which lands AFTER the runtime scanned
 * and rendered the world. The scanner therefore captures ALL non-built-in
 * `three-*-block` elements unconditionally; renderers and the edit session
 * subscribe to this registry's version and pop blocks in when their type
 * registers. An element whose plugin never loads renders nothing (and shows
 * a selectable proxy in edit mode).
 */

import type { Object3D } from 'three';
import type { BlockTypeInfo, BlockField } from '../editor/blockSchema';

export type CustomFieldType =
	| 'number' | 'string' | 'longtext' | 'url' | 'color' | 'boolean' | 'select';

export interface CustomFieldDef {
	/** Attribute name. Lowercased on registration; must then match
	 *  /^[a-z][a-z0-9]*$/ (no dashes/underscores — mirrors built-in schema
	 *  attrs like `positionx`, keeps getAttribute lookups trivially safe). */
	key: string;
	type: CustomFieldType;
	/** Inspector label; defaults to the key title-cased. */
	label?: string;
	default?: string | number | boolean;
	description?: string;
	/** `select` only — raw values or {value,label} pairs. */
	options?: Array<string | { value: string; label: string }>;
	/** `number` only. */
	min?: number;
	max?: number;
	step?: number;
}

/** Typed props parsed from element attributes per the field defs.
 *  number → number (invalid → default → 0), boolean → true/false,
 *  everything else → string. Transform attrs are engine-owned and NOT
 *  included here. */
export type CustomBlockProps = Record<string, string | number | boolean>;

export interface CustomBlockCtx {
	props: CustomBlockProps;
	/** The live block element (attribute source of truth). */
	el: Element;
	THREE: typeof import('three');
	/** True on the WebGPU renderer. Branch before touching XRPublisher.tsl —
	 *  it is absent on WebGL. */
	isWebGPU: boolean;
	/** Deterministic per-instance PRNG (alea seeded from tag + instance
	 *  index) — same sequence every load. Use this, never Math.random, for
	 *  generative variation that must be stable per visit. */
	rng: () => number;
	seed: string;
}

export interface CustomBlockSpec {
	/** Plugin slug — MUST equal the plugin build filename slug. */
	plugin: string;
	/** Block name within the plugin. Tag = three-{plugin}-{name}-block. */
	name: string;
	/** Add menu / outliner label. Default: title-cased name. */
	title?: string;
	description?: string;
	/** Add-menu + outliner grouping. Default 'Plugins'. */
	category?: string;
	/** Inspector fields. Omit for a block with no editable props. */
	fields?: CustomFieldDef[];
	/** Build the object at LOCAL ORIGIN — the engine owns position/rotation/
	 *  scale (standard transform attrs + gizmo + pivot wrapper). Return null
	 *  to render nothing. May populate children asynchronously (loadModel).
	 *  MUST be re-runnable: React StrictMode double-invokes effects in dev,
	 *  so share heavy resources at module level and pair with dispose. */
	create: (ctx: CustomBlockCtx) => Object3D | null;
	/** Apply a prop change in place. Return false to force dispose+recreate;
	 *  true/undefined = handled. Absent → every prop change recreates. */
	update?: (
		object: Object3D,
		props: CustomBlockProps,
		prevProps: CustomBlockProps,
		ctx: CustomBlockCtx,
	) => boolean | void;
	/** Per-frame hook (R3F useFrame in the host component). */
	tick?: (object: Object3D, delta: number, elapsed: number) => void;
	/** Custom cleanup — called INSTEAD of the default deep geometry/material
	 *  dispose. Specs whose objects share module-level geometry/materials
	 *  must provide a no-op dispose(){} (same contract as decorations). */
	dispose?: (object: Object3D) => void;
}

export interface CustomBlockType {
	tag: string;
	spec: CustomBlockSpec;
	/** Editor-facing shape, converted once at registration. */
	info: BlockTypeInfo;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FIELD_KEY_RE = /^[a-z][a-z0-9]*$/;

const TRANSFORM_ATTRS = [
	'positionx', 'positiony', 'positionz',
	'rotationx', 'rotationy', 'rotationz',
	'scalex', 'scaley', 'scalez',
];
const TRANSFORM_SET = new Set(TRANSFORM_ATTRS);

const types = new Map<string, CustomBlockType>();
const listeners = new Set<() => void>();
let version = 0;

function notify(): void {
	version++;
	for (const cb of Array.from(listeners)) {
		try { cb(); } catch (e) { console.error('[XRPublisher] custom block listener threw', e); }
	}
}

export function customBlockTagFor(plugin: string, name: string): string {
	return `three-${plugin}-${name}-block`;
}

function titleCase(s: string): string {
	return s.split(/[-\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** CustomFieldDef → the editor's BlockField shape (blockSchema contract). */
function toBlockField(def: CustomFieldDef): BlockField | null {
	const attr = String(def.key ?? '').toLowerCase();
	if (!FIELD_KEY_RE.test(attr)) {
		console.warn(`[XRPublisher] registerBlockType: invalid field key "${def.key}" (want /^[a-z][a-z0-9]*$/ after lowercasing) — dropped`);
		return null;
	}
	if (TRANSFORM_SET.has(attr)) {
		console.warn(`[XRPublisher] registerBlockType: field "${attr}" collides with an engine transform attr — dropped (transform is engine-owned)`);
		return null;
	}
	let options: string[] | undefined;
	let optionLabels: Record<string, string> | undefined;
	if (def.type === 'select') {
		options = [];
		for (const o of def.options ?? []) {
			if (typeof o === 'string') options.push(o);
			else if (o && typeof o.value === 'string') {
				options.push(o.value);
				if (o.label) (optionLabels ??= {})[o.value] = o.label;
			}
		}
		if (options.length === 0) {
			console.warn(`[XRPublisher] registerBlockType: select field "${attr}" has no options — dropped`);
			return null;
		}
	}
	let dflt = '';
	if (def.default !== undefined) {
		dflt = typeof def.default === 'boolean' ? (def.default ? '1' : '0') : String(def.default);
	}
	return {
		attr,
		label: def.label ?? titleCase(attr),
		type: def.type === 'select' ? 'enum' : def.type,
		default: dflt,
		options,
		optionLabels,
		description: def.description,
		min: def.min,
		max: def.max,
		step: def.step,
	};
}

function toBlockTypeInfo(tag: string, spec: CustomBlockSpec): BlockTypeInfo {
	const fields: BlockField[] = [];
	const seen = new Set<string>();
	for (const def of spec.fields ?? []) {
		const f = toBlockField(def);
		if (!f) continue;
		if (seen.has(f.attr)) {
			console.warn(`[XRPublisher] registerBlockType: duplicate field key "${f.attr}" — dropped`);
			continue;
		}
		seen.add(f.attr);
		fields.push(f);
	}
	return {
		tag,
		title: spec.title ?? `${titleCase(spec.name)}`,
		description: spec.description ?? `Custom block from the ${spec.plugin} plugin`,
		category: spec.category ?? 'Plugins',
		placeable: true,
		fields,
		hasTransform: true,
		transformAttrs: [...TRANSFORM_ATTRS],
	};
}

/**
 * Register a custom block type. Returns the tag on success, null on invalid
 * spec (warn, never throw — a bad plugin must not take down the world).
 * Re-registering an existing tag REPLACES it (hot-reload friendly).
 */
export function registerBlockType(spec: CustomBlockSpec): string | null {
	if (!spec || typeof spec !== 'object') {
		console.warn('[XRPublisher] registerBlockType: spec must be an object');
		return null;
	}
	const plugin = String(spec.plugin ?? '').toLowerCase();
	const name = String(spec.name ?? '').toLowerCase();
	if (!SLUG_RE.test(plugin) || !SLUG_RE.test(name)) {
		console.warn(`[XRPublisher] registerBlockType: plugin "${spec.plugin}" / name "${spec.name}" must match ${SLUG_RE} — refused`);
		return null;
	}
	if (typeof spec.create !== 'function') {
		console.warn(`[XRPublisher] registerBlockType(${plugin}/${name}): create must be a function — refused`);
		return null;
	}
	const tag = customBlockTagFor(plugin, name);
	const normalized: CustomBlockSpec = { ...spec, plugin, name };
	types.set(tag, { tag, spec: normalized, info: toBlockTypeInfo(tag, normalized) });
	notify();
	return tag;
}

export function unregisterBlockType(tag: string): void {
	if (types.delete(String(tag).toLowerCase())) notify();
}

export function getCustomBlockType(tag: string): CustomBlockType | null {
	return types.get(String(tag).toLowerCase()) ?? null;
}

/** Insertion (registration) order. */
export function getCustomBlockTypes(): CustomBlockType[] {
	return Array.from(types.values());
}

export function isCustomBlockTag(tag: string): boolean {
	return types.has(String(tag).toLowerCase());
}

export function getCustomBlocksVersion(): number {
	return version;
}

export function subscribeCustomBlocks(cb: () => void): () => void {
	listeners.add(cb);
	return () => listeners.delete(cb);
}

/** Parse typed props from a block element per the spec's fields. Attributes
 *  are stored lowercase; absent/empty attrs fall back to field defaults. */
export function parseCustomProps(spec: CustomBlockSpec, el: Element): CustomBlockProps {
	const out: CustomBlockProps = {};
	const type = types.get(customBlockTagFor(spec.plugin, spec.name));
	const fields = type ? type.info.fields : [];
	for (const f of fields) {
		const raw = el.getAttribute(f.attr);
		const str = raw === null || raw === '' ? f.default : raw;
		if (f.type === 'number') {
			const n = Number(str);
			out[f.attr] = Number.isFinite(n) ? n : (Number(f.default) || 0);
		} else if (f.type === 'boolean') {
			out[f.attr] = str === '1' || str === 'true';
		} else {
			out[f.attr] = str;
		}
	}
	return out;
}
