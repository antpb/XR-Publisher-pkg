/**
 * EditorShell — the in-world editor's control surface, rendered inside a
 * SHADOW DOM root so its styles are fully isolated from whatever CSS a
 * published page (or host site embedding a world) ships. Layout mirrors the
 * native desktop editor: a toolbar (add / gizmo modes / undo / save) over a
 * right-docked sidebar with an OUTLINER (every block in the world, grouped
 * by category, including the environment/sky/terrain/networking singletons)
 * and a SCHEMA-DRIVEN INSPECTOR — property fields generated from the same
 * schemas/*.json contract the desktop editor documents.
 *
 * Vanilla TS on purpose: the shell lives outside both React roots, owns its
 * DOM imperatively, and re-renders sections only when their inputs change
 * (a full innerHTML rebuild would drop focus while typing).
 */

import {
	subscribeEditSession,
	isEditActive,
	isDirty,
	getEntries,
	getSelectedKey,
	getSelectedEntry,
	select,
	setBlockAttrs,
	deleteEntry,
	restoreEntry,
	duplicateEntry,
	addBlock,
	exitEditMode,
	getGizmoMode,
	setGizmoMode,
	getStatus,
	setStatus,
	getShadowRoot,
	commitSavedState,
	getSubSelection,
	selectSub,
	getWaypoints,
	addWaypoint,
	removeWaypoint,
	getSpawnPose,
	type BlockEntry,
} from '../editSession';
import { subscribeHistory, undo, redo, canUndo, canRedo, clearHistory } from '../history';
import { blockTypeFor, ADDABLE_TAGS, SINGLETON_ADDABLE_TAGS, type BlockField } from '../blockSchema';
import { getCustomBlockTypes } from '../../blocks/customBlockRegistry';
import { serializeShadowDoc } from '../worldSerializer';
import { backupWorld, saveWorldHtml } from '../worldTokenClient';
import { uploadWorldPreview } from '../previewUpload';
import { requestViewCapture } from '../../components/core/front/captureView';
import { ASSET_DRAWER_CSS, buildAssetDrawer, resetAssetDrawer, isolateUiEvents } from './AssetDrawer';

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.shell {
	position: fixed; top: 0; right: 0; bottom: 0; width: 340px; z-index: 99;
	display: flex; flex-direction: column;
	background: rgba(16, 17, 22, 0.97); color: #e8e8ee;
	font: 13px/1.45 system-ui, -apple-system, sans-serif;
	border-left: 1px solid rgba(255,255,255,0.12);
	box-shadow: -12px 0 32px rgba(0,0,0,0.45);
}
.toolbar { display: flex; gap: 6px; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); flex-wrap: wrap; align-items: center; }
button {
	font: inherit; color: #ddd; background: rgba(255,255,255,0.07);
	border: 1px solid rgba(255,255,255,0.16); border-radius: 7px;
	padding: 5px 9px; cursor: pointer;
}
button:hover { background: rgba(255,255,255,0.14); }
button:disabled { opacity: 0.4; cursor: default; }
button.primary { background: #6d5ce6; border-color: transparent; color: #fff; }
button.active { background: #6d5ce6; border-color: transparent; color: #fff; }
button.danger { color: #ff9c9c; border-color: rgba(255,120,120,0.4); }
.status { padding: 6px 12px; font-size: 12px; min-height: 26px; color: #9fd79f; border-bottom: 1px solid rgba(255,255,255,0.07); }
.status.error { color: #ff9c9c; }
.body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.outliner { max-height: 38%; overflow-y: auto; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 6px 0; }
.cat { padding: 6px 12px 2px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: #8a8a97; }
.row { display: flex; align-items: center; gap: 6px; padding: 4px 12px; cursor: pointer; }
.row:hover { background: rgba(255,255,255,0.06); }
.row.sel { background: rgba(109, 92, 230, 0.28); }
.row.deleted .label { text-decoration: line-through; color: #8a8a97; }
.row .label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row .tagchip { font-size: 10px; color: #9a9ab0; }
.row .mini { padding: 1px 6px; font-size: 11px; border-radius: 5px; }
.inspector { flex: 1; overflow-y: auto; padding: 10px 12px 24px; }
.insp-title { font-weight: 600; font-size: 14px; margin: 2px 0 2px; }
.insp-sub { color: #8a8a97; font-size: 11px; margin-bottom: 10px; }
.sect { margin: 12px 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: #8a8a97; }
.vecrow { display: grid; grid-template-columns: 66px 1fr 1fr 1fr; gap: 5px; align-items: center; margin: 4px 0; }
.fieldrow { display: grid; grid-template-columns: 118px 1fr; gap: 6px; align-items: center; margin: 5px 0; }
.fieldrow label, .vecrow label { color: #b8b8c4; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
input, select, textarea {
	font: 12px ui-monospace, monospace; color: #fff; width: 100%;
	background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.18);
	border-radius: 6px; padding: 5px 7px;
}
input.droptarget { border-color: #84cc16; background: rgba(132,204,22,0.14); }
input[type="color"] { padding: 1px; height: 28px; }
textarea { min-height: 56px; resize: vertical; font-size: 11px; }
.actions { display: flex; gap: 6px; margin-top: 12px; }
.addmenu {
	position: absolute; top: 44px; left: 10px; z-index: 3;
	background: rgba(24, 25, 32, 0.99); border: 1px solid rgba(255,255,255,0.16);
	border-radius: 9px; padding: 5px; min-width: 170px; box-shadow: 0 10px 28px rgba(0,0,0,0.5);
}
.addmenu button { display: block; width: 100%; text-align: left; border: none; background: transparent; padding: 6px 9px; }
.addmenu button:hover { background: rgba(109, 92, 230, 0.35); }
.empty { padding: 12px; color: #8a8a97; }
`;

let host: HTMLDivElement | null = null;
let root: ShadowRoot | null = null;
let shell: HTMLDivElement | null = null;

// Live regions
let statusEl: HTMLDivElement | null = null;
let outlinerEl: HTMLDivElement | null = null;
let inspectorEl: HTMLDivElement | null = null;
let undoBtn: HTMLButtonElement | null = null;
let redoBtn: HTMLButtonElement | null = null;
let saveBtn: HTMLButtonElement | null = null;
let modeBtns: Record<string, HTMLButtonElement> = {};
let addMenuEl: HTMLDivElement | null = null;

let initialized = false;
let inspectorRenderedFor = '';
let outlinerRenderedFor = '';
let saving = false;

// ── Small DOM helpers ────────────────────────────────────────────────────────

function h<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	cls?: string,
	text?: string,
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	if (cls) el.className = cls;
	if (text !== undefined) el.textContent = text;
	return el;
}

function btn(label: string, cls: string, onClick: () => void, title = ''): HTMLButtonElement {
	const b = h('button', cls, label);
	if (title) b.title = title;
	b.addEventListener('click', onClick);
	return b;
}

function fmtNum(v: number): string {
	return String(Math.round(v * 1000) / 1000);
}

// ── Save / exit ──────────────────────────────────────────────────────────────

async function saveNow(): Promise<void> {
	if (saving) return;
	const root = getShadowRoot();
	if (!root) return;
	saving = true;
	if (saveBtn) saveBtn.disabled = true;
	try {
		setStatus('Backing up current world…');
		try {
			await backupWorld(`pre-edit-${Date.now()}`);
		} catch (e) {
			console.warn('[XRPublisher] backup before save failed:', e);
		}
		setStatus('Publishing…');
		const html = serializeShadowDoc(root, getEntries().values());
		await saveWorldHtml({ html });
		commitSavedState();
		setStatus('Saved ✓ — published. Colliders for moved objects apply on next load.');
	} catch (e) {
		setStatus(e instanceof Error ? e.message : 'Save failed', true);
	} finally {
		saving = false;
		if (saveBtn) saveBtn.disabled = false;
	}
}

function onExit(): void {
	if (isDirty() && !window.confirm('Discard unsaved edits?')) return;
	exitEditMode();
	clearHistory();
}

// ── Outliner ─────────────────────────────────────────────────────────────────

function renderOutliner(): void {
	if (!outlinerEl) return;
	const entries = Array.from(getEntries().values());
	const selectedKey = getSelectedKey();
	const fingerprint = entries.map((e) => `${e.key}:${e.deleted ? 1 : 0}:${e.label}`).join('|') + `@${selectedKey}`;
	if (fingerprint === outlinerRenderedFor) return;
	outlinerRenderedFor = fingerprint;

	outlinerEl.textContent = '';
	if (entries.length === 0) {
		outlinerEl.appendChild(h('div', 'empty', 'No blocks in this world yet — use + Add.'));
		return;
	}
	const byCat = new Map<string, BlockEntry[]>();
	for (const e of entries) {
		const cat = e.info.category;
		if (!byCat.has(cat)) byCat.set(cat, []);
		byCat.get(cat)!.push(e);
	}
	const order = ['Objects', 'Media', 'Interactive', 'Environment', 'World'];
	// Custom-block categories (e.g. 'Plugins') come after the fixed ones —
	// without this overflow pass, plugin blocks would be editable but
	// invisible in the outliner.
	for (const cat of byCat.keys()) {
		if (!order.includes(cat)) order.push(cat);
	}
	for (const cat of order) {
		const list = byCat.get(cat);
		if (!list?.length) continue;
		outlinerEl.appendChild(h('div', 'cat', cat));
		for (const e of list) {
			const row = h('div', `row${e.key === selectedKey ? ' sel' : ''}${e.deleted ? ' deleted' : ''}`);
			row.appendChild(h('span', 'label', e.label + (e.origin === 'added' ? ' *' : '')));
			row.appendChild(h('span', 'tagchip', e.info.title));
			if (e.deleted) {
				const r = btn('↺', 'mini', () => restoreEntry(e.key), 'Restore');
				row.appendChild(r);
			}
			row.addEventListener('click', () => select(e.key));
			outlinerEl.appendChild(row);
		}
	}
}

// ── Inspector ────────────────────────────────────────────────────────────────

function vecRow(
	label: string,
	names: [string, string, string],
	entry: BlockEntry,
	toDisplay: (v: number) => number,
	fromDisplay: (v: number) => number,
): HTMLDivElement {
	const row = h('div', 'vecrow');
	row.appendChild(h('label', '', label));
	for (const name of names) {
		const input = h('input');
		input.type = 'number';
		input.step = 'any';
		const raw = Number(entry.el.getAttribute(name)) || 0;
		input.value = fmtNum(toDisplay(raw));
		input.addEventListener('change', () => {
			const v = Number(input.value);
			if (!Number.isFinite(v)) return;
			setBlockAttrs(entry.key, { [name]: fmtNum(fromDisplay(v)) }, `Edit ${label.toLowerCase()}`);
		});
		input.addEventListener('keydown', (ev) => ev.stopPropagation());
		row.appendChild(input);
	}
	return row;
}

function fieldRow(field: BlockField, entry: BlockEntry): HTMLDivElement {
	const row = h('div', 'fieldrow');
	const label = h('label', '', field.label);
	if (field.description) label.title = field.description;
	row.appendChild(label);

	const current = entry.el.getAttribute(field.attr) ?? '';
	const commit = (value: string): void => {
		setBlockAttrs(entry.key, { [field.attr]: value }, `Edit ${field.label}`);
	};

	let control: HTMLElement;
	if (field.type === 'enum' && field.options) {
		const sel = h('select');
		for (const opt of ['', ...field.options.filter((o) => o !== '')]) {
			// Custom blocks may carry display labels for raw option values.
			const text = opt === '' ? '(default)' : (field.optionLabels?.[opt] ?? opt);
			const o = h('option', '', text);
			o.setAttribute('value', opt);
			sel.appendChild(o);
		}
		(sel as HTMLSelectElement).value = current;
		sel.addEventListener('change', () => commit((sel as HTMLSelectElement).value));
		control = sel;
	} else if (field.type === 'boolean') {
		const inp = h('input') as HTMLInputElement;
		inp.type = 'checkbox';
		const effective = current === '' ? field.default : current;
		inp.checked = effective === '1' || effective === 'true';
		inp.addEventListener('change', () => commit(inp.checked ? '1' : '0'));
		control = inp;
	} else if (field.type === 'color') {
		const inp = h('input') as HTMLInputElement;
		inp.type = 'color';
		inp.value = /^#[0-9a-fA-F]{6}$/.test(current) ? current : '#ffffff';
		inp.addEventListener('change', () => commit(inp.value));
		control = inp;
	} else if (field.type === 'longtext') {
		const ta = h('textarea') as HTMLTextAreaElement;
		ta.value = current;
		ta.addEventListener('change', () => commit(ta.value));
		ta.addEventListener('keydown', (ev) => ev.stopPropagation());
		control = ta;
	} else {
		const inp = h('input') as HTMLInputElement;
		inp.type = field.type === 'number' ? 'number' : 'text';
		if (field.type === 'number') {
			inp.step = field.step !== undefined ? String(field.step) : 'any';
			if (field.min !== undefined) inp.min = String(field.min);
			if (field.max !== undefined) inp.max = String(field.max);
		}
		inp.value = current;
		inp.placeholder = field.default;
		inp.addEventListener('change', () => commit(inp.value));
		inp.addEventListener('keydown', (ev) => ev.stopPropagation());
		// URL fields accept DRAG-AND-DROP from the asset drawer (native-editor
		// contract: cards carry asset/url + text/plain). Drop = set + commit.
		if (field.type === 'url') {
			const hasPayload = (ev: DragEvent): boolean =>
				!!ev.dataTransfer && (ev.dataTransfer.types.includes('asset/url') || ev.dataTransfer.types.includes('text/plain'));
			inp.addEventListener('dragover', (ev) => {
				if (!hasPayload(ev)) return;
				ev.preventDefault();
				if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
				inp.classList.add('droptarget');
			});
			inp.addEventListener('dragleave', () => inp.classList.remove('droptarget'));
			inp.addEventListener('drop', (ev) => {
				inp.classList.remove('droptarget');
				if (!ev.dataTransfer) return;
				const url = ev.dataTransfer.getData('asset/url') || ev.dataTransfer.getData('text/plain');
				if (!url) return;
				ev.preventDefault();
				inp.value = url;
				commit(url);
			});
		}
		control = inp;
	}
	row.appendChild(control);
	return row;
}

function renderInspector(): void {
	if (!inspectorEl) return;
	const entry = getSelectedEntry();
	const sub = getSubSelection();
	const subFp = sub && entry && sub.entryKey === entry.key ? sub.index : -1;
	const fingerprint = entry ? `${entry.key}:${entry.version}:${entry.deleted ? 1 : 0}:${subFp}` : 'none';
	if (fingerprint === inspectorRenderedFor) return;
	inspectorRenderedFor = fingerprint;

	inspectorEl.textContent = '';
	if (!entry) {
		inspectorEl.appendChild(h('div', 'empty', 'Select a block in the world or the outliner.'));
		return;
	}

	inspectorEl.appendChild(h('div', 'insp-title', entry.label));
	inspectorEl.appendChild(h('div', 'insp-sub', `${entry.info.title} — ${entry.info.description}`));

	if (entry.deleted) {
		const restore = btn('↺ Restore', '', () => restoreEntry(entry.key));
		inspectorEl.appendChild(restore);
		return;
	}

	if (entry.info.hasTransform) {
		const declared = new Set(entry.info.transformAttrs);
		inspectorEl.appendChild(h('div', 'sect', 'Transform'));
		if (declared.has('positionx')) {
			inspectorEl.appendChild(vecRow('Position', ['positionx', 'positiony', 'positionz'], entry, (v) => v, (v) => v));
		}
		if (declared.has('rotationx') || declared.has('rotationy')) {
			inspectorEl.appendChild(vecRow('Rotation°', ['rotationx', 'rotationy', 'rotationz'], entry, (v) => v * RAD2DEG, (v) => v * DEG2RAD));
		}
		if (declared.has('scalex')) {
			inspectorEl.appendChild(vecRow('Scale', ['scalex', 'scaley', 'scalez'], entry, (v) => (v === 0 ? 1 : v), (v) => v));
		}
		// "Stand where you want it, press the button" — samples the avatar's
		// live position. On spawn points this IS the primary workflow.
		const useMine = btn('📍 Use current position', '', () => {
			const ps = (window as unknown as {
				__xrPlayerState?: { x: number; y: number; z: number };
			}).__xrPlayerState;
			if (!ps) {
				setStatus('Player position not available yet.', true);
				return;
			}
			const attrs: Record<string, string> = {};
			if (declared.has('positionx')) attrs.positionx = fmtNum(ps.x);
			if (declared.has('positiony')) attrs.positiony = fmtNum(ps.y);
			if (declared.has('positionz')) attrs.positionz = fmtNum(ps.z);
			setBlockAttrs(entry.key, attrs, 'Use current position');
		}, 'Set this block\'s position to where your avatar is standing');
		const row = h('div', 'actions');
		row.appendChild(useMine);
		inspectorEl.appendChild(row);
	}

	// Rail-path editor for rideables (train/coaster follow the waypoints
	// curve). Graphical workflow: ghost spheres in-world + translate gizmo;
	// the raw JSON field stays available under Properties for power users.
	if (entry.tag === 'three-rideable-block') {
		const vt = entry.el.getAttribute('vehicletype') || 'car';
		const pts = getWaypoints(entry.key);
		if (vt === 'train' || vt === 'coaster' || pts.length > 0) {
			inspectorEl.appendChild(h('div', 'sect', `Rail path — ${pts.length} waypoint${pts.length === 1 ? '' : 's'}`));
			const sel = getSubSelection();
			const selHere = sel && sel.entryKey === entry.key && sel.index < pts.length ? sel : null;
			inspectorEl.appendChild(h('div', 'insp-sub',
				pts.length === 0
					? 'No waypoints yet. Stand where the ride should start and add the first one.'
					: 'Spheres in the world mark the rail (green = start). Click one and drag it with the gizmo — the purple tube is the exact track the ride follows.'));
			const row = h('div', 'actions');
			row.appendChild(btn('+ Add waypoint', 'primary', () => {
				const pose = getSpawnPose();
				const ps = (window as unknown as {
					__xrPlayerState?: { x: number; y: number; z: number };
				}).__xrPlayerState;
				const pos: [number, number, number] =
					pose?.position ?? (ps ? [ps.x, ps.y, ps.z] : [0, 0, 0]);
				addWaypoint(entry.key, pos);
			}, 'Insert a waypoint just ahead of you (after the selected sphere, else at the end)'));
			if (selHere) {
				row.appendChild(btn(`Delete #${selHere.index + 1}`, 'danger',
					() => removeWaypoint(entry.key, selHere.index)));
			}
			inspectorEl.appendChild(row);
			if (selHere) {
				inspectorEl.appendChild(h('div', 'insp-sub',
					`Waypoint ${selHere.index + 1} of ${pts.length} selected — drag the gizmo; Delete removes it; Esc reselects the vehicle.`));
			}
		}
	}

	if (entry.info.fields.length > 0) {
		inspectorEl.appendChild(h('div', 'sect', 'Properties'));
		for (const field of entry.info.fields) {
			inspectorEl.appendChild(fieldRow(field, entry));
		}
	}

	// Environment block: screenshot the live view (avatar hidden, DOM UI never
	// on canvas) → upload as this world's preview → commit the URL. The file
	// name is stable per world (world-preview-{slug}), so re-captures
	// overwrite the previous preview instead of accumulating.
	if (entry.tag === 'three-environment-block') {
		const capture = btn('📸 Use current view', 'primary', () => {
			capture.disabled = true;
			setStatus('Capturing view…');
			void (async () => {
				try {
					const blob = await requestViewCapture();
					setStatus('Uploading preview…');
					const result = await uploadWorldPreview(blob);
					setBlockAttrs(entry.key, { threepreviewimage: result.url }, 'Use current view');
					setStatus(result.quarantined
						? 'Preview uploaded to the review queue — it applies once the owner promotes it.'
						: 'Preview image updated.');
				} catch (e) {
					setStatus(e instanceof Error ? e.message : 'Preview capture failed', true);
				} finally {
					capture.disabled = false;
				}
			})();
		}, 'Screenshot the current view (without your avatar) and set it as this world\'s preview image');
		const row = h('div', 'actions');
		row.appendChild(capture);
		inspectorEl.appendChild(row);
	}

	const actions = h('div', 'actions');
	if (entry.info.placeable) {
		actions.appendChild(btn('Duplicate', '', () => duplicateEntry(entry.key)));
	}
	if (entry.tag !== 'three-environment-block') {
		actions.appendChild(btn('Delete', 'danger', () => deleteEntry(entry.key)));
	}
	inspectorEl.appendChild(actions);

	if (!entry.info.placeable) {
		inspectorEl.appendChild(h('div', 'insp-sub', 'World-level block: changes apply after Save + reload.'));
	}
}

// ── Add menu ─────────────────────────────────────────────────────────────────

function toggleAddMenu(anchor: HTMLElement): void {
	if (addMenuEl) {
		addMenuEl.remove();
		addMenuEl = null;
		return;
	}
	const menu = h('div', 'addmenu');
	const existingTags = new Set(Array.from(getEntries().values()).filter((e) => !e.deleted).map((e) => e.tag));
	const offer: string[] = [
		...ADDABLE_TAGS,
		// World-level singletons only when the world lacks one.
		...SINGLETON_ADDABLE_TAGS.filter((t) => !existingTags.has(t)),
	];
	for (const tag of offer) {
		const info = blockTypeFor(tag);
		if (!info) continue;
		menu.appendChild(btn(`+ ${info.title}`, '', () => {
			addBlock(tag);
			menu.remove();
			addMenuEl = null;
		}, info.description));
	}
	// Plugin custom blocks, grouped by category. The menu is built on open,
	// so late registrations appear without any extra wiring.
	const custom = getCustomBlockTypes();
	if (custom.length > 0) {
		const byCat = new Map<string, typeof custom>();
		for (const t of custom) {
			const cat = t.info.category;
			if (!byCat.has(cat)) byCat.set(cat, []);
			byCat.get(cat)!.push(t);
		}
		for (const [cat, list] of byCat) {
			menu.appendChild(h('div', 'cat', cat));
			for (const t of list) {
				menu.appendChild(btn(`+ ${t.info.title}`, '', () => {
					addBlock(t.tag);
					menu.remove();
					addMenuEl = null;
				}, t.info.description));
			}
		}
	}
	anchor.parentElement?.appendChild(menu);
	addMenuEl = menu;
}

// ── Shell assembly ───────────────────────────────────────────────────────────

function buildShell(): void {
	host = document.createElement('div');
	host.id = 'xrp-editor';
	root = host.attachShadow({ mode: 'open' });

	const style = document.createElement('style');
	style.textContent = CSS + ASSET_DRAWER_CSS;
	root.appendChild(style);

	shell = h('div', 'shell');
	// Keep world hotkeys (WASD/E/Space) AND ecctrl's document-level camera
	// arming away from the editor UI (clicking a field then moving the mouse
	// used to rotate the player camera).
	isolateUiEvents(shell);

	const toolbar = h('div', 'toolbar');
	toolbar.appendChild(btn('+ Add', 'primary', function (this: HTMLButtonElement) {
		toggleAddMenu(toolbar);
	} as unknown as () => void, 'Add a block to the world'));

	modeBtns = {
		translate: btn('Move', '', () => setGizmoMode('translate'), 'Gizmo: move (W-style)'),
		rotate: btn('Rotate', '', () => setGizmoMode('rotate'), 'Gizmo: rotate'),
		scale: btn('Scale', '', () => setGizmoMode('scale'), 'Gizmo: scale'),
	};
	for (const b of Object.values(modeBtns)) toolbar.appendChild(b);

	undoBtn = btn('↩', '', () => { undo(); }, 'Undo (Ctrl+Z)');
	redoBtn = btn('↪', '', () => { redo(); }, 'Redo (Ctrl+Shift+Z)');
	toolbar.appendChild(undoBtn);
	toolbar.appendChild(redoBtn);

	saveBtn = btn('Save', 'primary', () => { void saveNow(); }, 'Back up, then publish');
	toolbar.appendChild(saveBtn);
	toolbar.appendChild(btn('Exit', '', onExit, 'Leave edit mode'));

	shell.appendChild(toolbar);
	statusEl = h('div', 'status');
	shell.appendChild(statusEl);

	const body = h('div', 'body');
	outlinerEl = h('div', 'outliner');
	inspectorEl = h('div', 'inspector');
	body.appendChild(outlinerEl);
	body.appendChild(inspectorEl);
	shell.appendChild(body);
	root.appendChild(shell);

	// Asset drawer (bottom-docked on desktop, popup on mobile) shares this
	// shadow root so its styles are isolated and it detaches with the host.
	buildAssetDrawer(root);
}

function onKeyDown(e: KeyboardEvent): void {
	if (!isEditActive()) return;
	// Don't hijack typing anywhere (editor inputs, chat, host page).
	const target = e.composedPath()[0] as HTMLElement | undefined;
	const tag = target?.tagName;
	if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

	const mod = e.metaKey || e.ctrlKey;
	if (mod && e.key.toLowerCase() === 'z') {
		e.preventDefault();
		if (e.shiftKey) redo(); else undo();
	} else if (mod && e.key.toLowerCase() === 'y') {
		e.preventDefault();
		redo();
	} else if (e.key === 'Delete' || e.key === 'Backspace') {
		// A selected waypoint takes the Delete key before the block does.
		const sub = getSubSelection();
		if (sub) {
			e.preventDefault();
			removeWaypoint(sub.entryKey, sub.index);
			return;
		}
		const key = getSelectedKey();
		if (key) {
			e.preventDefault();
			deleteEntry(key);
		}
	} else if (e.key === 'Escape') {
		if (addMenuEl) {
			addMenuEl.remove();
			addMenuEl = null;
		} else if (getSubSelection()) {
			// Waypoint → back to the vehicle, then a second Esc deselects.
			selectSub(null);
		} else {
			select(null);
		}
	} else if (e.key === '1') setGizmoMode('translate');
	else if (e.key === '2') setGizmoMode('rotate');
	else if (e.key === '3') setGizmoMode('scale');
}

function renderAll(): void {
	if (!host) return;
	const active = isEditActive();
	if (active && !host.isConnected) document.body.appendChild(host);
	if (!active && host.isConnected) {
		host.remove();
		inspectorRenderedFor = '';
		outlinerRenderedFor = '';
		if (addMenuEl) { addMenuEl.remove(); addMenuEl = null; }
		resetAssetDrawer();
		return;
	}
	if (!active) return;

	const { message, isError } = getStatus();
	if (statusEl) {
		statusEl.textContent = message;
		statusEl.className = `status${isError ? ' error' : ''}`;
	}
	const mode = getGizmoMode();
	for (const [m, b] of Object.entries(modeBtns)) {
		b.className = m === mode ? 'active' : '';
	}
	if (undoBtn) undoBtn.disabled = !canUndo();
	if (redoBtn) redoBtn.disabled = !canRedo();
	if (saveBtn) saveBtn.textContent = isDirty() ? 'Save ●' : 'Save';

	renderOutliner();
	renderInspector();
}

/** Mount once (idempotent). The shell attaches/detaches itself with the
 *  session and re-renders on session + history changes. */
export function initEditorShell(): void {
	if (initialized) return;
	initialized = true;
	buildShell();
	subscribeEditSession(renderAll);
	subscribeHistory(renderAll);
	window.addEventListener('keydown', onKeyDown);
	renderAll();
}
