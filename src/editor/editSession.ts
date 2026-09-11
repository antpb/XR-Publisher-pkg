/**
 * In-world edit session — SHADOW DOCUMENT model.
 *
 * On enter, the session fetches a FRESH copy of the published HTML and
 * parses it into a shadow Document. That document is the single source of
 * truth for the whole session: every block (including the environment/sky/
 * terrain/networking singletons and spawn points) exists as a real element
 * in it, every edit is an attribute write on it, and Save serializes IT —
 * preserving the wp-comment structure the native desktop editor emits.
 * The live page's DOM can't play this role: React consumed the environment
 * block's children at init and the page is full of runtime state.
 *
 * Live rendering: each placeable authored block is mounted through an
 * `EditableBlockHost` (EnvironmentFront), joined to its shadow element by
 * (tag, index in document order) — both sides enumerate the same served
 * HTML, so the join is stable. Hosts re-parse from the shadow element when
 * an entry's version bumps; transform gizmo edits take a FAST PATH (wrapper
 * transform live + attrs recomputed from the last version-bump snapshot) so
 * dragging never remounts components or recooks colliders.
 *
 * All mutations flow through history.ts commands → full undo/redo.
 */

import { Euler, Quaternion, type Object3D } from 'three';
import { allBlockTypeTags, blockTypeFor, defaultAttrsFor, type BlockTypeInfo } from './blockSchema';
import { isCustomBlockTag, subscribeCustomBlocks } from '../blocks/customBlockRegistry';
import { execute } from './history';

export type EditableKind =
	| 'model' | 'image' | 'video' | 'text' | 'npc' | 'audio' | 'light' | 'portal' | 'rideable'
	| 'custom';

export const TAG_TO_KIND: Record<string, EditableKind> = {
	'three-model-block': 'model',
	'three-image-block': 'image',
	'three-video-block': 'video',
	'three-text-block': 'text',
	'three-npc-block': 'npc',
	'three-audio-block': 'audio',
	'three-light-block': 'light',
	'three-portal-block': 'portal',
	'three-rideable-block': 'rideable',
};

/** 'custom' is one kind ↔ many tags, so it has no entry here — hosts for
 *  custom blocks pass their tag explicitly. */
export const KIND_TO_TAG: Record<Exclude<EditableKind, 'custom'>, string> = Object.fromEntries(
	Object.entries(TAG_TO_KIND).map(([t, k]) => [k, t]),
) as Record<Exclude<EditableKind, 'custom'>, string>;

/** Kind for any editable tag — built-ins from the static map, plus 'custom'
 *  for every REGISTERED plugin block tag. */
export function kindForTag(tag: string): EditableKind | null {
	return TAG_TO_KIND[tag] ?? (isCustomBlockTag(tag) ? 'custom' : null);
}

export interface BlockEntry {
	key: string;
	tag: string;
	info: BlockTypeInfo;
	/** Shadow-document element (authored) or detached element (added). */
	el: Element;
	/** The live scanned element hosts render from OUTSIDE a session; synced
	 *  to the shadow attrs after a successful save. Null for singletons. */
	originalEl: Element | null;
	/** Per-tag document-order index (authored); -1 for additions. */
	index: number;
	origin: 'authored' | 'added';
	deleted: boolean;
	/** Bumps → the host re-parses attrs and resets its wrapper. */
	version: number;
	/** Wrapper group (pivot-anchored) while mounted. */
	group: Object3D | null;
	/** Attr snapshot at the last version bump — the base the transform fast
	 *  path recomputes attrs from (prevents double-counting wrapper state). */
	base: Record<string, string>;
	label: string;
}

// ── State ────────────────────────────────────────────────────────────────────

/** The SAFE AREA under edit — the `wp:xr-publisher/environment` comment
 *  region, held in a <template> so comments/custom elements round-trip
 *  byte-faithfully with NO document restructuring (DOMParser would hoist
 *  the leading wp comment out of <body> and force html/head/body wrappers
 *  into the serialized output — the native editor manages the block markup
 *  only, never a page). */
let shadowTpl: HTMLTemplateElement | null = null;
const entries = new Map<string, BlockEntry>();
let addSeq = 0;

let active = false;
let dirty = false;
let selectedKey: string | null = null;
let gizmoMode: 'translate' | 'rotate' | 'scale' = 'translate';
let version = 0;
let statusMessage = '';
let statusIsError = false;

/** Post-save persistence (survives exit so the world keeps the saved look
 *  without a reload): authored blocks deleted+saved stay hidden; added
 *  blocks keep rendering. */
const hiddenHostKeys = new Set<string>();
const persistedAdditions: Element[] = [];

const listeners = new Set<() => void>();
let spawnPoser: (() => { position: [number, number, number] }) | null = null;

function notify(): void {
	version++;
	listeners.forEach((l) => {
		try { l(); } catch { /* ignore */ }
	});
}

export function subscribeEditSession(cb: () => void): () => void {
	listeners.add(cb);
	return () => { listeners.delete(cb); };
}

export function getEditVersion(): number { return version; }
export function isEditActive(): boolean { return active; }
export function isDirty(): boolean { return dirty; }
export function getSelectedKey(): string | null { return selectedKey; }
export function getEntries(): Map<string, BlockEntry> { return entries; }
export function getEntry(key: string): BlockEntry | null { return entries.get(key) ?? null; }
export function getSelectedEntry(): BlockEntry | null {
	return selectedKey ? entries.get(selectedKey) ?? null : null;
}
export function getGizmoMode(): 'translate' | 'rotate' | 'scale' { return gizmoMode; }
export function setGizmoMode(m: 'translate' | 'rotate' | 'scale'): void {
	gizmoMode = m;
	notify();
}
export function getStatus(): { message: string; isError: boolean } {
	return { message: statusMessage, isError: statusIsError };
}
export function setStatus(message: string, isError = false): void {
	statusMessage = message;
	statusIsError = isError;
	notify();
}
export function getShadowRoot(): HTMLTemplateElement | null { return shadowTpl; }
export function getPersistedAdditions(): Element[] { return persistedAdditions; }
export function isHostHidden(hostKey: string): boolean { return hiddenHostKeys.has(hostKey); }

export function setSpawnPoser(fn: (() => { position: [number, number, number] }) | null): void {
	spawnPoser = fn;
}
export function getSpawnPose(): { position: [number, number, number] } | null {
	try { return spawnPoser ? spawnPoser() : null; } catch { return null; }
}

// ── Entry helpers ────────────────────────────────────────────────────────────

export function hostKeyFor(tag: string, index: number): string {
	return `${tag}#${index}`;
}

function snapshotAttrs(el: Element): Record<string, string> {
	const out: Record<string, string> = {};
	for (const a of Array.from(el.attributes)) out[a.name] = a.value;
	return out;
}

function labelFor(entry: Pick<BlockEntry, 'tag' | 'el' | 'index' | 'info'>): string {
	const el = entry.el;
	const name = el.getAttribute('name') || el.getAttribute('alt') || '';
	if (name) return name;
	if (entry.tag === 'three-text-block') {
		const t = (el.getAttribute('textcontent') || '').slice(0, 22);
		if (t) return `"${t}"`;
	}
	const url = el.getAttribute('threeobjecturl') || el.getAttribute('imageurl')
		|| el.getAttribute('videourl') || el.getAttribute('audiourl') || '';
	const base = url.split('/').pop()?.split('?')[0] ?? '';
	if (base) return base;
	if (entry.tag === 'three-light-block') return `${el.getAttribute('type') || 'light'} light`;
	return `${entry.info.title} ${entry.index + 1}`;
}

export function getPivot(el: Element): [number, number, number] {
	return [
		Number(el.getAttribute('positionx')) || 0,
		Number(el.getAttribute('positiony')) || 0,
		Number(el.getAttribute('positionz')) || 0,
	];
}

/** Version a host should render at: -1 = no session entry (render the
 *  original element), >=0 = render the entry's shadow element. */
export function entryRenderVersion(tag: string, index: number): number {
	if (!active) return -1;
	const e = entries.get(hostKeyFor(tag, index));
	return e ? e.version : -1;
}

/** The element a host should parse attributes from right now. */
export function renderElFor(tag: string, index: number, originalEl: Element): Element {
	if (!active) return originalEl;
	const e = entries.get(hostKeyFor(tag, index));
	return e ? e.el : originalEl;
}

/** Hosts call this after every parse: the transform-commit base must always
 *  equal the attrs the currently-rendered props were derived from. */
export function syncEntryBase(key: string): void {
	const e = entries.get(key);
	if (e) e.base = snapshotAttrs(e.el);
}

export function linkHostGroup(tag: string, index: number, originalEl: Element, group: Object3D | null): void {
	const e = entries.get(hostKeyFor(tag, index));
	if (e) {
		e.group = group;
		if (e.originalEl === null) e.originalEl = originalEl;
		if (group) group.visible = !e.deleted;
	}
}

export function linkAdditionGroup(key: string, group: Object3D | null): void {
	const e = entries.get(key);
	if (e) {
		e.group = group;
		if (group) group.visible = !e.deleted;
	}
}

/** Reverse-map a raycast hit to its entry by walking ancestors. */
export function findEntryForObject(obj: Object3D): BlockEntry | null {
	const byGroup = new Map<Object3D, BlockEntry>();
	for (const e of entries.values()) {
		if (e.group) byGroup.set(e.group, e);
	}
	let node: Object3D | null = obj;
	while (node) {
		const hit = byGroup.get(node);
		if (hit) return hit;
		node = node.parent;
	}
	return null;
}

// ── Session lifecycle ────────────────────────────────────────────────────────

async function fetchWorldHtml(): Promise<string> {
	const res = await fetch(`${window.location.pathname}?nocache=1`, { credentials: 'omit' });
	if (!res.ok) throw new Error(`Could not fetch world HTML (${res.status})`);
	return res.text();
}

/**
 * EXTRACT THE SAFE AREA. The editor manages ONLY the world's block markup —
 * the `<!-- wp:xr-publisher/environment -->…<!-- /wp:xr-publisher/environment -->`
 * region — exactly like the native desktop editor. The worker serves worlds
 * with a page template wrapped around it (header bar, runtime <script>,
 * plugin <script>s, init call, inside `<div id="world-view">`); NONE of that
 * may ever enter the edit session or a save. (A save that included the
 * wrapper embedded stale runtime/plugin script tags in the stored world —
 * every serve then booted TWO engine instances: duplicated menus, and the
 * weather plugin reading a dead engine's player state → rain indoors.)
 *
 * Primary extraction is STRING-LEVEL on the wp comment markers (immune to
 * template changes and to DOMParser restructuring). Fallbacks for worlds
 * published without wp comments: descend the world-view wrapper(s), then
 * take the environment element's outerHTML.
 */
const ENV_OPEN = '<!-- wp:xr-publisher/environment';
const ENV_CLOSE = '<!-- /wp:xr-publisher/environment -->';

function extractSafeArea(html: string): string | null {
	const open = html.indexOf(ENV_OPEN);
	const close = html.lastIndexOf(ENV_CLOSE);
	if (open >= 0 && close > open) {
		return html.slice(open, close + ENV_CLOSE.length);
	}
	// No wp comments — fall back to DOM: unwrap serve-template layer(s), then
	// use the raw environment element.
	let doc = new DOMParser().parseFromString(html, 'text/html');
	for (let depth = 0; depth < 8; depth++) {
		const view = doc.querySelector('#world-view');
		if (!view) break;
		doc = new DOMParser().parseFromString(view.innerHTML, 'text/html');
	}
	const env = doc.querySelector('three-environment-block');
	return env ? env.outerHTML : null;
}

/** Build authored entries for one tag from the shadow template. No-ops for
 *  tags with no schema info or whose entries already exist (idempotent —
 *  also the late-registration backfill path). */
function buildAuthoredEntriesForTag(tag: string): boolean {
	if (!shadowTpl) return false;
	const info = blockTypeFor(tag);
	if (!info) return false;
	let added = false;
	shadowTpl.content.querySelectorAll(tag).forEach((el, index) => {
		const key = hostKeyFor(tag, index);
		if (entries.has(key)) return;
		const entry: BlockEntry = {
			key, tag, info, el,
			originalEl: null,
			index,
			origin: 'authored',
			deleted: false,
			version: 0,
			group: null,
			base: snapshotAttrs(el),
			label: '',
		};
		entry.label = labelFor(entry);
		entries.set(key, entry);
		added = true;
	});
	return added;
}

// A plugin can register its block types AFTER a session opened (plugin init
// is DOMContentLoaded + poll — late registration is the mainline path).
// Backfill entries for newly registered tags so their authored blocks become
// editable the moment the type exists.
subscribeCustomBlocks(() => {
	if (!active || !shadowTpl) return;
	let added = false;
	for (const tag of allBlockTypeTags()) {
		if (buildAuthoredEntriesForTag(tag)) added = true;
	}
	if (added) notify();
});

export async function enterEditMode(): Promise<void> {
	if (active) return;
	setStatus('Loading world source…');
	const html = await fetchWorldHtml();
	const safeArea = extractSafeArea(html);
	if (!safeArea) {
		throw new Error('Could not find the world markup (environment block) in the page');
	}
	const tpl = document.createElement('template');
	tpl.innerHTML = safeArea;
	if (!tpl.content.querySelector('three-environment-block')) {
		throw new Error('World markup has no <three-environment-block> — cannot edit');
	}
	shadowTpl = tpl;
	entries.clear();

	for (const tag of allBlockTypeTags()) {
		buildAuthoredEntriesForTag(tag);
	}

	active = true;
	dirty = false;
	(window as unknown as { __xrEditActive?: boolean }).__xrEditActive = true;
	try { document.exitPointerLock?.(); } catch { /* not locked */ }
	setStatus('Edit mode — changes publish when you Save.');
}

export function exitEditMode(): void {
	if (!active) return;
	active = false;
	selectedKey = null;
	subSel = null;
	subGroups.clear();
	shadowTpl = null;
	// Wrappers back to play state: identity transforms, visible unless the
	// deletion was SAVED (then the host stays hidden via hiddenHostKeys).
	for (const e of entries.values()) {
		if (e.group) {
			e.group.position.set(...getPivot(e.originalEl ?? e.el));
			e.group.quaternion.identity();
			e.group.scale.setScalar(1);
			e.group.visible = !hiddenHostKeys.has(e.key);
		}
	}
	entries.clear();
	dirty = false;
	(window as unknown as { __xrEditActive?: boolean }).__xrEditActive = false;
	setStatus('');
}

// ── Edits (all through history commands) ────────────────────────────────────

function applyAttrs(entry: BlockEntry, attrs: Record<string, string | null>, bump: boolean): void {
	for (const [name, value] of Object.entries(attrs)) {
		if (value === null) entry.el.removeAttribute(name);
		else entry.el.setAttribute(name, value);
	}
	entry.label = labelFor(entry);
	if (bump) {
		entry.base = snapshotAttrs(entry.el);
		entry.version++;
	}
	dirty = true;
	notify();
}

function currentValues(entry: BlockEntry, names: string[]): Record<string, string | null> {
	const out: Record<string, string | null> = {};
	for (const n of names) out[n] = entry.el.getAttribute(n);
	return out;
}

/** Inspector edits: set attributes with undo, re-render the block live. */
export function setBlockAttrs(key: string, attrs: Record<string, string | null>, label = 'Edit properties'): void {
	const entry = entries.get(key);
	if (!entry) return;
	const before = currentValues(entry, Object.keys(attrs));
	execute({
		label,
		do: () => applyAttrs(entry, attrs, true),
		undo: () => applyAttrs(entry, before, true),
	});
}

const _q0 = new Quaternion();
const _q1 = new Quaternion();
const _e = new Euler();

function fmt(v: number): string {
	return String(Math.round(v * 10000) / 10000);
}

/**
 * Transform fast path: the gizmo moved the wrapper; recompute the block's
 * transform attributes from the BASE snapshot composed with the wrapper's
 * current transform. Applied WITHOUT a version bump (no remount — the
 * wrapper already shows the result); undo restores the previous attrs WITH
 * a bump (remount is the safe way back).
 */
export function commitWrapperTransform(key: string): void {
	const entry = entries.get(key);
	if (!entry?.group) return;
	const g = entry.group;
	const base = entry.base;
	const num = (n: string, d = 0): number => {
		const v = Number(base[n]);
		return Number.isFinite(v) && base[n] !== undefined && base[n] !== '' ? v : d;
	};

	_e.set(num('rotationx'), num('rotationy'), num('rotationz'));
	_q0.setFromEuler(_e);
	_q1.copy(g.quaternion).multiply(_q0);
	_e.setFromQuaternion(_q1);

	const all: Record<string, string> = {
		positionx: fmt(g.position.x),
		positiony: fmt(g.position.y),
		positionz: fmt(g.position.z),
		rotationx: fmt(_e.x),
		rotationy: fmt(_e.y),
		rotationz: fmt(_e.z),
		scalex: fmt(g.scale.x * num('scalex', 1)),
		scaley: fmt(g.scale.y * num('scaley', 1)),
		scalez: fmt(g.scale.z * num('scalez', 1)),
	};
	// Only write transform attrs this block's schema declares (spawn points
	// are position-only — scale/rotation attrs there would be junk).
	const declared = new Set(entry.info.transformAttrs);
	const after: Record<string, string> = {};
	for (const [k, v] of Object.entries(all)) {
		if (declared.has(k)) after[k] = v;
	}
	if (Object.keys(after).length === 0) {
		// Nothing this schema can store (e.g. rotating a position-only spawn
		// ghost) — snap the wrapper back so the discarded gesture is obvious.
		g.position.set(num('positionx'), num('positiony'), num('positionz'));
		g.quaternion.identity();
		g.scale.setScalar(1);
		return;
	}
	const before = currentValues(entry, Object.keys(after));
	// Fast path (no remount) works only for blocks whose meshes follow the
	// R3F transform hierarchy. Vehicles are driven by their DYNAMIC rapier
	// body in world space, and NPCs position themselves via pathfinding —
	// for those the wrapper is just a gizmo handle, and the commit must
	// remount the component so it respawns at the new attrs.
	const remount = entry.tag === 'three-rideable-block' || entry.tag === 'three-npc-block';
	execute({
		label: 'Transform',
		do: () => applyAttrs(entry, after, remount),
		undo: () => applyAttrs(entry, before, true),
	});
}

/**
 * Rewrite every reference to `oldUrl` across the session after an asset
 * promotion: the server has already rewritten the PUBLISHED HTML (and deleted
 * the quarantined file), so the shadow document must follow or the next Save
 * would resurrect a dead URL. Patches shadow elements (version bump → hosts
 * re-render from the promoted URL), originalEls (live world stays valid after
 * exit-without-save), and persisted additions. NOT a history command — this
 * mirrors a committed server action; undoing it would recreate the dead ref.
 */
export function rewriteAssetUrl(oldUrl: string, newUrl: string): number {
	if (!oldUrl || !newUrl || oldUrl === newUrl) return 0;
	const patch = (el: Element): boolean => {
		let changed = false;
		for (const a of Array.from(el.attributes)) {
			if (a.value.includes(oldUrl)) {
				el.setAttribute(a.name, a.value.split(oldUrl).join(newUrl));
				changed = true;
			}
		}
		return changed;
	};
	let count = 0;
	for (const e of entries.values()) {
		if (patch(e.el)) {
			count++;
			e.base = snapshotAttrs(e.el);
			e.version++;
			e.label = labelFor(e);
		}
		if (e.originalEl) patch(e.originalEl);
	}
	for (const el of persistedAdditions) patch(el);
	// No dirty flag: the shadow doc now MATCHES the server-rewritten HTML.
	if (count > 0) notify();
	return count;
}

export function select(key: string | null): void {
	if (selectedKey === key) {
		// Re-selecting the block itself pops any sub-selection (waypoint) so
		// the gizmo returns to the block wrapper.
		if (subSel) {
			subSel = null;
			notify();
		}
		return;
	}
	selectedKey = key;
	subSel = null;
	notify();
}

// ── Sub-object selection (vehicle waypoints, future seats) ──────────────────
// Some block attributes are ARRAYS OF POINTS (a rail vehicle's `waypoints`
// JSON). Hand-writing them is unrealistic, so the editor renders each point
// as a ghost sphere the gizmo can move. A sub-selection targets ONE point of
// ONE entry; the block stays selected underneath (inspector context), and
// every mutation flows through setBlockAttrs → full undo/redo.

export interface SubSelection {
	entryKey: string;
	kind: 'waypoint';
	index: number;
}

let subSel: SubSelection | null = null;
const subGroups = new Map<string, { sel: SubSelection; group: Object3D }>();

export function subKeyFor(sel: SubSelection): string {
	return `${sel.entryKey}:${sel.kind}:${sel.index}`;
}

export function getSubSelection(): SubSelection | null { return subSel; }

export function selectSub(sel: SubSelection | null): void {
	subSel = sel;
	notify();
}

export function linkSubGroup(sel: SubSelection, group: Object3D | null): void {
	const key = subKeyFor(sel);
	if (group) subGroups.set(key, { sel, group });
	else subGroups.delete(key);
	// A freshly-ADDED waypoint is selected before its ghost mounts (the link
	// runs in the ghost's effect, after render) — nudge subscribers so the
	// gizmo attaches to it as soon as the group exists.
	if (subSel && subKeyFor(subSel) === key) notify();
}

export function getSubGroup(sel: SubSelection): Object3D | null {
	return subGroups.get(subKeyFor(sel))?.group ?? null;
}

/** Reverse-map a raycast hit to a sub-object by walking ancestors. */
export function findSubForObject(obj: Object3D): SubSelection | null {
	const byGroup = new Map<Object3D, SubSelection>();
	for (const { sel, group } of subGroups.values()) byGroup.set(group, sel);
	let node: Object3D | null = obj;
	while (node) {
		const hit = byGroup.get(node);
		if (hit) return hit;
		node = node.parent;
	}
	return null;
}

// ── Waypoints (rail vehicles: train / coaster) ──────────────────────────────
// `waypoints` is a JSON array of [x,y,z] WORLD points (the vehicle body is a
// rapier kinematic body — its curve translations are true world coordinates,
// NOT the environment-frame coords block position attrs live in). Waypoint
// ghosts therefore render at the SCENE ROOT (EditModeSystem's portal), where
// group.position IS the waypoint value, no frame math.

export function getWaypoints(entryKey: string): number[][] {
	const e = entries.get(entryKey);
	if (!e) return [];
	try {
		const arr = JSON.parse(e.el.getAttribute('waypoints') || '[]');
		if (!Array.isArray(arr)) return [];
		return arr.filter((p: unknown): p is number[] =>
			Array.isArray(p) && p.length >= 3 && p.slice(0, 3).every((n) => Number.isFinite(n)));
	} catch {
		return [];
	}
}

function setWaypoints(entryKey: string, pts: number[][], label: string): void {
	const rounded = pts.map((p) => [
		Math.round(p[0] * 100) / 100,
		Math.round(p[1] * 100) / 100,
		Math.round(p[2] * 100) / 100,
	]);
	setBlockAttrs(entryKey, { waypoints: JSON.stringify(rounded) }, label);
}

/** Insert a waypoint (after the current sub-selection on this entry, else at
 *  the end) and select it so the gizmo lands on it immediately. */
export function addWaypoint(entryKey: string, pos: [number, number, number]): void {
	const pts = getWaypoints(entryKey);
	const after = subSel && subSel.entryKey === entryKey && subSel.kind === 'waypoint'
		? Math.min(subSel.index, pts.length - 1)
		: pts.length - 1;
	const index = after + 1;
	const next = [...pts.slice(0, index), [pos[0], pos[1], pos[2]], ...pts.slice(index)];
	setWaypoints(entryKey, next, 'Add waypoint');
	subSel = { entryKey, kind: 'waypoint', index };
	notify();
}

export function removeWaypoint(entryKey: string, index: number): void {
	const pts = getWaypoints(entryKey);
	if (index < 0 || index >= pts.length) return;
	const next = pts.filter((_, i) => i !== index);
	setWaypoints(entryKey, next, 'Delete waypoint');
	if (subSel && subSel.entryKey === entryKey) subSel = null;
	notify();
}

/** The gizmo moved a waypoint ghost: its scene-root position IS the new
 *  waypoint. Flows through setBlockAttrs → undoable, version bump remounts
 *  the vehicle so it re-reads the curve. */
export function commitSubTransform(sel: SubSelection): void {
	const g = getSubGroup(sel);
	if (!g) return;
	const pts = getWaypoints(sel.entryKey);
	if (sel.index < 0 || sel.index >= pts.length) return;
	const next = pts.map((p, i) => (i === sel.index ? [g.position.x, g.position.y, g.position.z] : p));
	setWaypoints(sel.entryKey, next, 'Move waypoint');
}

export function deleteEntry(key: string): void {
	const entry = entries.get(key);
	if (!entry || entry.tag === 'three-environment-block') return;
	const wasSelected = selectedKey === key;
	execute({
		label: `Delete ${entry.label}`,
		do: () => {
			entry.deleted = true;
			if (entry.group) entry.group.visible = false;
			if (selectedKey === key) selectedKey = null;
			dirty = true;
			notify();
		},
		undo: () => {
			entry.deleted = false;
			if (entry.group) entry.group.visible = true;
			if (wasSelected) selectedKey = key;
			dirty = true;
			notify();
		},
	});
}

export function restoreEntry(key: string): void {
	const entry = entries.get(key);
	if (!entry || !entry.deleted) return;
	execute({
		label: `Restore ${entry.label}`,
		do: () => {
			entry.deleted = false;
			if (entry.group) entry.group.visible = true;
			dirty = true;
			notify();
		},
		undo: () => {
			entry.deleted = true;
			if (entry.group) entry.group.visible = false;
			dirty = true;
			notify();
		},
	});
}

export function duplicateEntry(key: string): string | null {
	const src = entries.get(key);
	if (!src || !kindForTag(src.tag)) return null;
	const attrs = snapshotAttrs(src.el);
	// Offset the copy so it doesn't z-fight the original.
	attrs.positionx = fmt((Number(attrs.positionx) || 0) + 1.5);
	return addBlockWithAttrs(src.tag, attrs, `Duplicate ${src.label}`);
}

// ── Additions ────────────────────────────────────────────────────────────────

export function addBlock(tag: string): string | null {
	const pose = getSpawnPose();
	const attrs = defaultAttrsFor(tag, pose?.position ?? [0, 0, 0]);
	return addBlockWithAttrs(tag, attrs, `Add ${blockTypeFor(tag)?.title ?? tag}`);
}

/** Add a block seeded with schema defaults + spawn pose, then `overrides`
 *  on top — the asset drawer's click-to-place path (e.g. a model asset sets
 *  threeobjecturl on a fresh model block). */
export function addBlockWithOverrides(
	tag: string,
	overrides: Record<string, string>,
	label?: string,
): string | null {
	const pose = getSpawnPose();
	const attrs = { ...defaultAttrsFor(tag, pose?.position ?? [0, 0, 0]), ...overrides };
	return addBlockWithAttrs(tag, attrs, label ?? `Add ${blockTypeFor(tag)?.title ?? tag}`);
}

function addBlockWithAttrs(tag: string, attrs: Record<string, string>, label: string): string | null {
	const info = blockTypeFor(tag);
	if (!info || !shadowTpl) return null;
	const el = document.createElement(tag);
	for (const [n, v] of Object.entries(attrs)) el.setAttribute(n, v);
	const key = `add-${addSeq++}`;
	const entry: BlockEntry = {
		key, tag, info, el,
		originalEl: null,
		index: -1,
		origin: 'added',
		deleted: false,
		version: 0,
		group: null,
		base: snapshotAttrs(el),
		label: '',
	};
	entry.label = labelFor(entry);
	execute({
		label,
		do: () => {
			entries.set(key, entry);
			selectedKey = key;
			dirty = true;
			notify();
		},
		undo: () => {
			entries.delete(key);
			if (selectedKey === key) selectedKey = null;
			dirty = true;
			notify();
		},
	});
	return key;
}

/** Active additions to render live (both renderer branches mount an
 *  additions host that maps over these). */
export function getActiveAdditions(): BlockEntry[] {
	if (!active) return [];
	return Array.from(entries.values()).filter((e) => e.origin === 'added' && !e.deleted);
}

// ── Save bookkeeping ─────────────────────────────────────────────────────────

/** After a successful upload: make the live world match the server without a
 *  reload, so exiting edit mode doesn't visually revert anything. */
export function commitSavedState(): void {
	for (const e of entries.values()) {
		if (e.origin === 'authored' && e.originalEl) {
			if (e.deleted) {
				hiddenHostKeys.add(e.key);
				continue;
			}
			// originalEl := shadow attrs
			for (const a of Array.from(e.originalEl.attributes)) {
				if (!e.el.hasAttribute(a.name)) e.originalEl.removeAttribute(a.name);
			}
			for (const a of Array.from(e.el.attributes)) {
				e.originalEl.setAttribute(a.name, a.value);
			}
		} else if (e.origin === 'added') {
			const i = persistedAdditions.indexOf(e.el);
			if (e.deleted) {
				// Added earlier in the session, saved, then deleted and saved
				// again — stop rendering it after exit.
				if (i >= 0) persistedAdditions.splice(i, 1);
			} else if (i < 0) {
				persistedAdditions.push(e.el);
			}
		}
	}
	dirty = false;
	notify();
}
