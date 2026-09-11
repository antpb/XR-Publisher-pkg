/**
 * AssetDrawer — the in-world editor's port of the native desktop editor's
 * asset drawer ("Toybox", src/editors/AssetDrawer[.Toybox].js), with a
 * ROLE-GATED access model layered on top:
 *
 *  - OWNER (primary key or author-scoped `we_` token): Assets + Media tabs
 *    (the author's libraries, same endpoints as the native drawer) plus the
 *    QUEUE tab — the review list of guest-contributed quarantined assets,
 *    each with a Promote action.
 *  - GUEST (world-scoped `we_` token): NO library access at all (the API
 *    rejects world-scoped tokens on the library endpoints too — this isn't
 *    just UI). Guests get the Queue tab only: their uploads land in the
 *    world's quarantine/ prefix server-side, render from there immediately,
 *    and wait for the owner to promote them.
 *
 *  - PROMOTE (owner): the server copies quarantine → official asset space,
 *    rewrites the PUBLISHED HTML's references, and deletes the quarantined
 *    file; the client mirrors the URL rewrite into the live session
 *    (editSession.rewriteAssetUrl) so an open shadow doc can't resurrect the
 *    dead quarantine URL on its next save.
 *
 * Presentation is viewport-dependent: a collapsible drawer docked to the
 * bottom of the screen on desktop (native design), a centered popup on small
 * screens (≤768px) where a bottom drawer has no room. One content element
 * re-parents between the two shells.
 *
 * Click places (there's no drag target in-world): each card adds the block
 * type matching the file (model/image/video/audio) at the spawn pose, through
 * the edit session's history. Fetches here are PLAIN fetch / soft-fail — a
 * 401 while browsing must never clear the stored world token or end the
 * session. Lives inside EditorShell's shadow root.
 */

import { addBlockWithOverrides, rewriteAssetUrl, setStatus } from '../editSession';
import { bytesToBase64 } from '../previewUpload';
import {
	getApiBaseUrl,
	getEditCredential,
	getEditRole,
	getWorldIdentity,
	isOwnerCredential,
	listQueuedAssets,
	promoteQueuedAsset,
	uploadWorldAsset,
	type QueuedAsset,
} from '../worldTokenClient';

// Matches EditorShell's sidebar width — the drawer stops where it starts.
const SIDEBAR_WIDTH = 340;
const MOBILE_QUERY = '(max-width: 768px)';
const PAGE_SIZE = 20;
const MAX_UPLOAD_BYTES = 30_000_000; // base64-in-JSON transport — keep sane.

export const ASSET_DRAWER_CSS = `
.adrawer {
	position: fixed; left: 0; right: ${SIDEBAR_WIDTH}px; bottom: 0; height: 240px; z-index: 98;
	display: flex; flex-direction: column;
	background: rgba(16, 17, 22, 0.97); color: #e8e8ee;
	font: 13px/1.45 system-ui, -apple-system, sans-serif;
	border-top: 1px solid rgba(255,255,255,0.12);
	box-shadow: 0 -10px 28px rgba(0,0,0,0.4);
}
.adrawer-tab {
	position: fixed; right: ${SIDEBAR_WIDTH + 8}px; bottom: 10px; z-index: 99;
	display: flex; align-items: center; gap: 6px;
	font: 600 12px system-ui, -apple-system, sans-serif; color: #fff;
	background: #6d5ce6; border: none; border-radius: 8px; padding: 6px 12px;
	cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.45);
}
.adrawer-tab.open { bottom: 248px; }
.amodal-backdrop {
	position: fixed; inset: 0; z-index: 120;
	background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center;
}
.amodal {
	width: min(560px, 94vw); height: min(560px, 78vh);
	display: flex; flex-direction: column;
	background: rgba(16, 17, 22, 0.99); color: #e8e8ee; border-radius: 12px;
	border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 18px 48px rgba(0,0,0,0.6);
	font: 13px/1.45 system-ui, -apple-system, sans-serif; overflow: hidden;
}
.amodal-head { display: flex; align-items: center; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.amodal-head .ttl { flex: 1; font-weight: 600; }
.abrowser { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.abar { display: flex; gap: 6px; padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.1); align-items: center; flex-wrap: wrap; }
.abar .tabbtn { padding: 5px 12px; }
.abar input[type="text"] {
	flex: 1; min-width: 110px; font: 12px system-ui, sans-serif; color: #fff;
	background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.18);
	border-radius: 12px; padding: 5px 10px;
}
.agrid-wrap { flex: 1; overflow-y: auto; padding: 8px 10px; min-height: 0; }
.agrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
.acard {
	border-radius: 8px; overflow: hidden; cursor: grab; position: relative;
	background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
	transition: transform 0.12s ease;
}
.acard:hover { transform: translateY(-1px); border-color: rgba(109,92,230,0.8); }
.acard:active { cursor: grabbing; }
.acard .cardactions { display: flex; }
.acard .act {
	flex: 1; border: none; border-radius: 0; background: #3d3d56; color: #fff;
	font-size: 10px; font-weight: 600; padding: 4px;
}
.acard .act:hover { background: #4c4c6d; }
.acard .nm {
	font-size: 10px; font-weight: 600; padding: 3px 5px; background: rgba(0,0,0,0.55);
	white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.acard .nm .ext { color: #84cc16; }
.acard .thumb {
	height: 72px; background-size: contain; background-position: center; background-repeat: no-repeat;
	display: flex; align-items: center; justify-content: center; font-size: 26px;
}
.acard .meta {
	display: flex; justify-content: space-between; padding: 2px 5px;
	font-size: 9px; color: #b8b8c4; background: rgba(0,0,0,0.45);
}
.acard .act.promote { background: #2f7a4b; }
.acard .act.promote:hover { background: #38935b; }
.astatus { padding: 8px 12px; color: #8a8a97; font-size: 12px; }
.astatus.err { color: #ff9c9c; }
.amore { grid-column: 1 / -1; }
`;

// ── Browser state (persists across open/close within the page) ─────────────

type Tab = 'assets' | 'media' | 'queue';

interface AssetItem {
	filename: string;
	fileUrl: string;
	thumbUrl: string | null;
	filesize: number;
	background: string | null;
	polycount: number | null;
}

interface MediaItem {
	fileName: string;
	fileUrl: string;
	fileType: string;
	fileSize: number;
}

let role: 'owner' | 'guest' | null = null;
let roleResolved = false;
let activeTab: Tab = 'assets';
let searchQuery = '';
let assets: AssetItem[] = [];
let assetsPage = 1;
let assetsHasMore = true;
let mediaFiles: MediaItem[] = [];
let mediaPage = 1;
let mediaHasMore = false;
let queued: QueuedAsset[] = [];
let canPromote = false;
let queueLoaded = false;
let loading = false;

// ── DOM handles ─────────────────────────────────────────────────────────────

let drawerEl: HTMLDivElement | null = null;
let tabBtn: HTMLButtonElement | null = null;
let modalBackdrop: HTMLDivElement | null = null;
let modalPanel: HTMLDivElement | null = null;
let browserEl: HTMLDivElement | null = null;
let gridEl: HTMLDivElement | null = null;
let statusLine: HTMLDivElement | null = null;
let assetsTabBtn: HTMLButtonElement | null = null;
let mediaTabBtn: HTMLButtonElement | null = null;
let queueTabBtn: HTMLButtonElement | null = null;
let searchInput: HTMLInputElement | null = null;
let fileInput: HTMLInputElement | null = null;

let drawerOpen = false;
let modalOpen = false;
let mql: MediaQueryList | null = null;

function isMobile(): boolean {
	return mql ? mql.matches : false;
}

// ── Shared helpers ──────────────────────────────────────────────────────────

const GRADIENTS: Array<[string, string]> = [
	['#2aff00', '#00ffb3'], ['#621396', '#f70000'], ['#00ffdd', '#aa00ff'],
	['#9900ff', '#00ffd5'], ['#9fff38', '#42cbd7'], ['#daff00', '#d30000'],
];

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']);

/** File extension → the block that renders it. */
const EXT_BLOCK: Record<string, { tag: string; attr: string; label: string }> = {
	glb: { tag: 'three-model-block', attr: 'threeobjecturl', label: 'model' },
	gltf: { tag: 'three-model-block', attr: 'threeobjecturl', label: 'model' },
	vrm: { tag: 'three-model-block', attr: 'threeobjecturl', label: 'model' },
	fbx: { tag: 'three-model-block', attr: 'threeobjecturl', label: 'model' },
	png: { tag: 'three-image-block', attr: 'imageurl', label: 'image' },
	jpg: { tag: 'three-image-block', attr: 'imageurl', label: 'image' },
	jpeg: { tag: 'three-image-block', attr: 'imageurl', label: 'image' },
	webp: { tag: 'three-image-block', attr: 'imageurl', label: 'image' },
	gif: { tag: 'three-image-block', attr: 'imageurl', label: 'image' },
	mp3: { tag: 'three-audio-block', attr: 'audiourl', label: 'audio' },
	wav: { tag: 'three-audio-block', attr: 'audiourl', label: 'audio' },
	ogg: { tag: 'three-audio-block', attr: 'audiourl', label: 'audio' },
	mp4: { tag: 'three-video-block', attr: 'videourl', label: 'video' },
	webm: { tag: 'three-video-block', attr: 'videourl', label: 'video' },
};

function extOf(name: string): string {
	return name.split('.').pop()?.toLowerCase() ?? '';
}

function absolutize(url: string | null | undefined, base: string): string | null {
	if (!url) return null;
	return url.startsWith('http') ? url : `${base}${url}`;
}

function setBrowserStatus(msg: string, isError = false): void {
	if (statusLine) {
		statusLine.textContent = msg;
		statusLine.className = `astatus${isError ? ' err' : ''}`;
	}
}

/** Place a file URL as the block type its extension implies. EXPLICIT action
 *  only (the ＋ Place button) — clicking a card must never add anything. */
function placeUrl(url: string, fileName: string): void {
	const target = EXT_BLOCK[extOf(fileName)];
	if (!target) {
		copyUrl(url, fileName);
		return;
	}
	const key = addBlockWithOverrides(target.tag, { [target.attr]: url }, `Add ${fileName}`);
	if (key) {
		setStatus(`Added ${fileName} as a ${target.label} block — move it with the gizmo.`);
		if (modalOpen) closeModal();
	}
}

function copyUrl(url: string, fileName: string): void {
	try {
		void navigator.clipboard?.writeText(url);
		setStatus(`${fileName} URL copied to clipboard.`);
	} catch {
		setStatus(`Couldn't copy URL for ${fileName}.`, true);
	}
}

/** Native-editor drag contract (AssetDrawer.Toybox.js): cards carry the URL
 *  as text/plain + asset/url (+ asset/type). Drop targets: the inspector's
 *  URL fields (EditorShell wires them). */
function makeDraggable(card: HTMLElement, url: string, kind: string): void {
	card.draggable = true;
	card.addEventListener('dragstart', (ev: DragEvent) => {
		if (!ev.dataTransfer) return;
		ev.dataTransfer.effectAllowed = 'copy';
		ev.dataTransfer.setData('text/plain', url);
		ev.dataTransfer.setData('asset/url', url);
		ev.dataTransfer.setData('asset/type', kind);
	});
}

function actionBtn(label: string, onClick: () => void, title = ''): HTMLButtonElement {
	const b = h('button', 'act', label);
	if (title) b.title = title;
	b.addEventListener('click', (e) => {
		e.stopPropagation();
		onClick();
	});
	return b;
}

// ── Data fetching ────────────────────────────────────────────────────────────

async function fetchAssets(): Promise<void> {
	const credential = getEditCredential();
	const author = getWorldIdentity().author;
	if (!credential || !author) {
		setBrowserStatus('Sign in to browse this world\'s asset library.', true);
		return;
	}
	const base = getApiBaseUrl();
	loading = true;
	setBrowserStatus(assetsPage === 1 ? 'Loading assets…' : 'Loading more…');
	try {
		const response = await fetch(`${base}/api/author/assets`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${credential}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				userId: author,
				searchTerm: searchQuery,
				categories: '',
				limit: PAGE_SIZE,
				offset: (assetsPage - 1) * PAGE_SIZE,
			}),
		});
		if (response.status === 401 || response.status === 403) {
			// NEVER clear the world token here — browsing is optional.
			setBrowserStatus('This credential can\'t browse the asset library.', true);
			return;
		}
		if (!response.ok) throw new Error(`Assets request failed (${response.status})`);
		const data = await response.json();
		const rows: Array<Record<string, unknown>> = Array.isArray(data)
			? data
			: Array.isArray(data?.assets) ? data.assets : [];
		assetsHasMore = Array.isArray(data)
			? rows.length >= PAGE_SIZE
			: Boolean(data?.pagination?.hasMore);
		const mapped: AssetItem[] = rows.map((a) => ({
			filename: String(a.filename ?? 'asset'),
			fileUrl: absolutize(a.file_url as string, base) ?? '',
			thumbUrl: absolutize(a.thumb_url as string | null, base),
			filesize: Number(a.filesize) || 0,
			background: (a.background as string) || null,
			polycount: a.polycount != null ? Number(a.polycount) : null,
		})).filter((a) => a.fileUrl);
		assets = assetsPage === 1 ? mapped : [...assets, ...mapped];
		setBrowserStatus(assets.length === 0 ? 'No assets found.' : '');
	} catch (e) {
		setBrowserStatus(e instanceof Error ? e.message : 'Failed to load assets', true);
	} finally {
		loading = false;
		renderGrid();
	}
}

async function fetchMedia(): Promise<void> {
	const credential = getEditCredential();
	const author = getWorldIdentity().author;
	if (!credential || !author) {
		setBrowserStatus('Sign in to browse this world\'s media library.', true);
		return;
	}
	const base = getApiBaseUrl();
	loading = true;
	setBrowserStatus(mediaPage === 1 ? 'Loading media…' : 'Loading more…');
	try {
		const params = new URLSearchParams({
			userId: author,
			fileType: 'all',
			page: String(mediaPage),
			limit: String(PAGE_SIZE),
		});
		const response = await fetch(`${base}/api/user/media?${params}`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${credential}` },
		});
		if (response.status === 401 || response.status === 403) {
			setBrowserStatus('This credential can\'t browse the media library.', true);
			return;
		}
		if (!response.ok) throw new Error(`Media request failed (${response.status})`);
		const data = await response.json();
		const rows: Array<Record<string, unknown>> = Array.isArray(data?.files) ? data.files : [];
		mediaHasMore = Boolean(data?.pagination?.hasMore);
		const mapped: MediaItem[] = rows.map((f) => ({
			fileName: String(f.fileName ?? 'file'),
			fileUrl: absolutize(f.fileUrl as string, base) ?? '',
			fileType: String(f.fileType ?? ''),
			fileSize: Number(f.fileSize) || 0,
		})).filter((f) => f.fileUrl);
		mediaFiles = mediaPage === 1 ? mapped : [...mediaFiles, ...mapped];
		setBrowserStatus(mediaFiles.length === 0 ? 'No media files found.' : '');
	} catch (e) {
		setBrowserStatus(e instanceof Error ? e.message : 'Failed to load media', true);
	} finally {
		loading = false;
		renderGrid();
	}
}

async function fetchQueue(): Promise<void> {
	loading = true;
	setBrowserStatus('Loading queue…');
	try {
		const result = await listQueuedAssets();
		queued = result.files;
		canPromote = result.canPromote;
		queueLoaded = true;
		setBrowserStatus(queued.length === 0
			? (role === 'guest'
				? 'No uploads yet — use ⬆ Upload to contribute a file.'
				: 'Queue is empty — guest uploads appear here for review.')
			: (canPromote ? 'Click to place · Promote moves a file into official assets.' : ''));
	} catch (e) {
		setBrowserStatus(e instanceof Error ? e.message : 'Failed to load queue', true);
	} finally {
		loading = false;
		renderGrid();
	}
}

function refetch(): void {
	if (activeTab === 'assets') {
		assetsPage = 1;
		assets = [];
		assetsHasMore = true;
		void fetchAssets();
	} else if (activeTab === 'media') {
		mediaPage = 1;
		mediaFiles = [];
		mediaHasMore = false;
		void fetchMedia();
	} else {
		void fetchQueue();
	}
}

// ── Role resolution ─────────────────────────────────────────────────────────

async function resolveRole(): Promise<void> {
	if (roleResolved) return;
	roleResolved = true;
	setBrowserStatus('Checking access…');
	const info = await getEditRole();
	if (info) {
		role = info.role === 'guest' ? 'guest' : 'owner';
	} else {
		// whoami unavailable (older API deploy / offline): a primary key is
		// self-evidently the owner; any token defaults to GUEST — deny-by-
		// default is the entire point of the role split.
		role = isOwnerCredential() ? 'owner' : 'guest';
	}
	if (role === 'guest') {
		activeTab = 'queue';
		if (assetsTabBtn) assetsTabBtn.style.display = 'none';
		if (mediaTabBtn) mediaTabBtn.style.display = 'none';
		if (queueTabBtn) queueTabBtn.textContent = 'My uploads';
	}
	refetch();
}

// ── Upload ──────────────────────────────────────────────────────────────────

async function onUploadFile(file: File): Promise<void> {
	if (file.size > MAX_UPLOAD_BYTES) {
		setBrowserStatus(`${file.name} is too large (max ${Math.round(MAX_UPLOAD_BYTES / 1_000_000)}MB).`, true);
		return;
	}
	setBrowserStatus(`Uploading ${file.name}…`);
	try {
		const fileData = bytesToBase64(await file.arrayBuffer());
		const kind = EXT_BLOCK[extOf(file.name)]?.label ?? 'file';
		const result = await uploadWorldAsset({ fileName: file.name, fileData, assetType: kind });
		if (!result.success) throw new Error('Upload rejected');
		// NEVER auto-place — adding blocks is always an explicit action
		// (＋ Place on a card, or drag onto a URL field).
		if (result.quarantined) {
			setBrowserStatus(`${file.name} uploaded to the review queue — drag it from there or press ＋ Place.`);
			void fetchQueue();
		} else {
			// Owner uploads land in the world folder (not the library tabs), so
			// the URL is handed to the clipboard for pasting into any URL field.
			if (result.url) {
				try { void navigator.clipboard?.writeText(result.url); } catch { /* best effort */ }
				setBrowserStatus(`${file.name} uploaded — URL copied to clipboard; paste it into any URL field.`);
			} else {
				setBrowserStatus(`${file.name} uploaded.`);
			}
			if (activeTab === 'queue') void fetchQueue();
		}
	} catch (e) {
		setBrowserStatus(e instanceof Error ? e.message : 'Upload failed', true);
	}
}

// ── Promote ─────────────────────────────────────────────────────────────────

async function onPromote(item: QueuedAsset, button: HTMLButtonElement): Promise<void> {
	button.disabled = true;
	button.textContent = 'Promoting…';
	try {
		const result = await promoteQueuedAsset(item.fileName);
		// Mirror the server's published-HTML rewrite into the live session.
		const touched = rewriteAssetUrl(result.previousUrl, result.url);
		setStatus(`Promoted ${item.fileName} to official assets${touched > 0 ? ` — ${touched} scene reference${touched === 1 ? '' : 's'} updated` : ''}.`);
		void fetchQueue();
	} catch (e) {
		button.disabled = false;
		button.textContent = '⬆ Promote';
		setBrowserStatus(e instanceof Error ? e.message : 'Promote failed', true);
	}
}

// ── Rendering ────────────────────────────────────────────────────────────────

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

function nameHeader(fullName: string): HTMLDivElement {
	const nm = h('div', 'nm');
	const dot = fullName.lastIndexOf('.');
	if (dot > 0) {
		nm.append(fullName.slice(0, dot));
		nm.appendChild(h('span', 'ext', fullName.slice(dot)));
	} else {
		nm.textContent = fullName;
	}
	return nm;
}

function gradientFor(name: string, background: string | null): string {
	try {
		if (background) {
			const bg = JSON.parse(background);
			if (bg.backgroundColor && bg.backgroundColor2) {
				return `linear-gradient(45deg, ${bg.backgroundColor} 0%, ${bg.backgroundColor2} 100%)`;
			}
		}
	} catch { /* malformed background json */ }
	// Deterministic per filename (native used Math.random — flickery on rerender).
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
	const [c1, c2] = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
	return `linear-gradient(45deg, ${c1} 0%, ${c2} 100%)`;
}

const TYPE_ICON: Record<string, string> = {
	model: '🧊', image: '🖼️', audio: '🎵', video: '🎬', pdf: '📄',
};

function iconFor(fileName: string): string {
	const target = EXT_BLOCK[extOf(fileName)];
	return TYPE_ICON[target?.label ?? ''] ?? '📦';
}

function cardMeta(left: string, right: string): HTMLDivElement {
	const meta = h('div', 'meta');
	meta.appendChild(h('span', '', left));
	meta.appendChild(h('span', '', right));
	return meta;
}

function renderGrid(): void {
	if (!gridEl) return;
	gridEl.textContent = '';
	const q = searchQuery.trim().toLowerCase();

	const DRAG_HINT = 'Drag onto a URL field in the sidebar, or use ＋ Place';

	if (activeTab === 'assets') {
		for (const item of assets) {
			const card = h('div', 'acard');
			card.title = `${item.filename} — ${DRAG_HINT}`;
			card.appendChild(nameHeader(item.filename));
			const thumb = h('div', 'thumb');
			thumb.style.backgroundImage = item.thumbUrl
				? `url('${item.thumbUrl}'), ${gradientFor(item.filename, item.background)}`
				: gradientFor(item.filename, item.background);
			card.appendChild(thumb);
			card.appendChild(cardMeta(
				`${(item.filesize / 1_000_000).toFixed(1)}MB`,
				item.polycount != null ? `${Math.round(item.polycount)} tris` : '',
			));
			makeDraggable(card, item.fileUrl, 'model');
			const actions = h('div', 'cardactions');
			actions.appendChild(actionBtn('＋ Place', () => placeUrl(item.fileUrl, item.filename),
				'Add a model block with this asset at your position'));
			card.appendChild(actions);
			gridEl.appendChild(card);
		}
	} else if (activeTab === 'media') {
		// The media endpoint has no search param — filter the fetched pages.
		const visible = q ? mediaFiles.filter((f) => f.fileName.toLowerCase().includes(q)) : mediaFiles;
		for (const item of visible) {
			const card = h('div', 'acard');
			card.title = `${item.fileName} — ${DRAG_HINT}`;
			card.appendChild(nameHeader(item.fileName));
			const thumb = h('div', 'thumb');
			if (item.fileType === 'image') {
				thumb.style.backgroundImage = `url('${item.fileUrl}')`;
				thumb.style.backgroundSize = 'cover';
			} else {
				thumb.textContent = TYPE_ICON[item.fileType] ?? '📦';
			}
			card.appendChild(thumb);
			card.appendChild(cardMeta(`${(item.fileSize / 1_000_000).toFixed(1)}MB`, item.fileType.toUpperCase()));
			makeDraggable(card, item.fileUrl, item.fileType || 'file');
			const actions = h('div', 'cardactions');
			if (EXT_BLOCK[extOf(item.fileName)]) {
				actions.appendChild(actionBtn('＋ Place', () => placeUrl(item.fileUrl, item.fileName),
					'Add a block for this file at your position'));
			}
			actions.appendChild(actionBtn('⧉ URL', () => copyUrl(item.fileUrl, item.fileName), 'Copy the file URL'));
			card.appendChild(actions);
			gridEl.appendChild(card);
		}
	} else {
		const visible = q ? queued.filter((f) => f.fileName.toLowerCase().includes(q)) : queued;
		for (const item of visible) {
			const card = h('div', 'acard');
			card.title = `${item.fileName} — ${DRAG_HINT}`;
			card.appendChild(nameHeader(item.fileName));
			const thumb = h('div', 'thumb');
			if (IMAGE_EXTS.has(extOf(item.fileName))) {
				thumb.style.backgroundImage = `url('${item.url}')`;
				thumb.style.backgroundSize = 'cover';
			} else {
				thumb.textContent = iconFor(item.fileName);
			}
			card.appendChild(thumb);
			card.appendChild(cardMeta(`${(item.size / 1_000_000).toFixed(1)}MB`, 'QUEUED'));
			makeDraggable(card, item.url, EXT_BLOCK[extOf(item.fileName)]?.label ?? 'file');
			const actions = h('div', 'cardactions');
			if (EXT_BLOCK[extOf(item.fileName)]) {
				actions.appendChild(actionBtn('＋ Place', () => placeUrl(item.url, item.fileName),
					'Add a block for this file at your position'));
			}
			if (canPromote) {
				const promote = h('button', 'act promote', '⬆ Promote');
				promote.title = 'Move into official assets and relink scene references';
				promote.addEventListener('click', (e) => {
					e.stopPropagation();
					void onPromote(item, promote);
				});
				actions.appendChild(promote);
			}
			card.appendChild(actions);
			gridEl.appendChild(card);
		}
	}

	const hasMore = activeTab === 'assets' ? assetsHasMore : activeTab === 'media' ? mediaHasMore : false;
	if (hasMore && !loading) {
		const more = h('button', 'amore', 'Load more');
		more.addEventListener('click', () => {
			if (activeTab === 'assets') { assetsPage++; void fetchAssets(); }
			else if (activeTab === 'media') { mediaPage++; void fetchMedia(); }
		});
		gridEl.appendChild(more);
	}

	if (assetsTabBtn) assetsTabBtn.className = `tabbtn${activeTab === 'assets' ? ' active' : ''}`;
	if (mediaTabBtn) mediaTabBtn.className = `tabbtn${activeTab === 'media' ? ' active' : ''}`;
	if (queueTabBtn) {
		queueTabBtn.className = `tabbtn${activeTab === 'queue' ? ' active' : ''}`;
		const base = role === 'guest' ? 'My uploads' : 'Queue';
		queueTabBtn.textContent = queueLoaded && queued.length > 0 ? `${base} (${queued.length})` : base;
	}
}

function switchTab(tab: Tab): void {
	if (activeTab === tab) return;
	activeTab = tab;
	const empty = tab === 'assets' ? assets.length === 0
		: tab === 'media' ? mediaFiles.length === 0
		: !queueLoaded;
	if (empty) refetch();
	else setBrowserStatus('');
	renderGrid();
}

function buildBrowser(): HTMLDivElement {
	const browser = h('div', 'abrowser');

	const bar = h('div', 'abar');
	assetsTabBtn = h('button', 'tabbtn active', 'Assets');
	assetsTabBtn.addEventListener('click', () => switchTab('assets'));
	mediaTabBtn = h('button', 'tabbtn', 'Media');
	mediaTabBtn.addEventListener('click', () => switchTab('media'));
	queueTabBtn = h('button', 'tabbtn', 'Queue');
	queueTabBtn.addEventListener('click', () => switchTab('queue'));
	bar.appendChild(assetsTabBtn);
	bar.appendChild(mediaTabBtn);
	bar.appendChild(queueTabBtn);

	searchInput = h('input');
	searchInput.type = 'text';
	searchInput.placeholder = 'Search…';
	searchInput.addEventListener('keydown', (e) => {
		e.stopPropagation();
		if (e.key === 'Enter') {
			searchQuery = searchInput?.value ?? '';
			if (activeTab === 'assets') refetch();
			else renderGrid();
		}
	});
	searchInput.addEventListener('keyup', (e) => e.stopPropagation());
	bar.appendChild(searchInput);

	const searchBtn = h('button', '', 'Search');
	searchBtn.addEventListener('click', () => {
		searchQuery = searchInput?.value ?? '';
		if (activeTab === 'assets') refetch();
		else renderGrid();
	});
	bar.appendChild(searchBtn);

	fileInput = h('input');
	fileInput.type = 'file';
	fileInput.style.display = 'none';
	fileInput.accept = Object.keys(EXT_BLOCK).map((e) => `.${e}`).join(',');
	fileInput.addEventListener('change', () => {
		const file = fileInput?.files?.[0];
		if (file) void onUploadFile(file);
		if (fileInput) fileInput.value = '';
	});
	bar.appendChild(fileInput);

	const uploadBtn = h('button', 'primary', '⬆ Upload');
	uploadBtn.title = 'Upload a file into this world';
	uploadBtn.addEventListener('click', () => fileInput?.click());
	bar.appendChild(uploadBtn);
	browser.appendChild(bar);

	const wrap = h('div', 'agrid-wrap');
	gridEl = h('div', 'agrid');
	wrap.appendChild(gridEl);
	browser.appendChild(wrap);

	statusLine = h('div', 'astatus');
	browser.appendChild(statusLine);

	return browser;
}

// ── Open/close + viewport-mode plumbing ─────────────────────────────────────

function syncTabButton(): void {
	if (!tabBtn) return;
	if (isMobile()) {
		tabBtn.textContent = '🧰 Assets';
		tabBtn.classList.remove('open');
		tabBtn.style.right = 'auto';
		tabBtn.style.left = '10px';
	} else {
		tabBtn.textContent = drawerOpen ? '🧰 Assets ▾' : '🧰 Assets ▴';
		tabBtn.classList.toggle('open', drawerOpen);
		tabBtn.style.left = 'auto';
		tabBtn.style.right = `${SIDEBAR_WIDTH + 8}px`;
	}
}

function openDrawer(): void {
	if (!drawerEl || !browserEl) return;
	drawerOpen = true;
	drawerEl.appendChild(browserEl);
	drawerEl.style.display = 'flex';
	void resolveRole();
	renderGrid();
	syncTabButton();
}

function closeDrawer(): void {
	drawerOpen = false;
	if (drawerEl) drawerEl.style.display = 'none';
	syncTabButton();
}

function openModal(): void {
	if (!modalBackdrop || !modalPanel || !browserEl) return;
	modalOpen = true;
	modalPanel.appendChild(browserEl);
	modalBackdrop.style.display = 'flex';
	void resolveRole();
	renderGrid();
}

function closeModal(): void {
	modalOpen = false;
	if (modalBackdrop) modalBackdrop.style.display = 'none';
}

function onToggle(): void {
	if (isMobile()) {
		if (modalOpen) closeModal();
		else openModal();
	} else {
		if (drawerOpen) closeDrawer();
		else openDrawer();
	}
}

function onViewportModeChange(): void {
	// Whatever was open in the old mode closes; the button adapts. (Content
	// element survives — it just re-parents on the next open.)
	closeDrawer();
	closeModal();
	syncTabButton();
}

/**
 * Ecctrl (Player.jsx, camListenerTarget="document") arms camera rotation on
 * ANY document mousedown — including editor UI. Without this, pressing a
 * card and dragging (the drag-to-field gesture) also swung the player
 * camera. Stopping propagation at the UI root keeps ecctrl blind to editor
 * interactions; HTML5 drag events are unaffected (dragstart still fires).
 */
export function isolateUiEvents(el: HTMLElement): void {
	for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend'] as const) {
		el.addEventListener(type, (e) => e.stopPropagation());
	}
	el.addEventListener('keydown', (e) => e.stopPropagation());
	el.addEventListener('keyup', (e) => e.stopPropagation());
}

/**
 * Build the drawer/tab/modal into EditorShell's shadow root. Called once from
 * buildShell(). Everything lives inside the shell host, so visibility follows
 * the edit session automatically.
 */
export function buildAssetDrawer(root: ShadowRoot): void {
	browserEl = buildBrowser();

	drawerEl = h('div', 'adrawer');
	drawerEl.style.display = 'none';
	isolateUiEvents(drawerEl);
	root.appendChild(drawerEl);

	tabBtn = h('button', 'adrawer-tab', '🧰 Assets ▴');
	tabBtn.title = 'Browse assets & the upload queue';
	tabBtn.addEventListener('click', onToggle);
	isolateUiEvents(tabBtn);
	root.appendChild(tabBtn);

	modalBackdrop = h('div', 'amodal-backdrop');
	modalBackdrop.style.display = 'none';
	modalBackdrop.addEventListener('click', (e) => {
		if (e.target === modalBackdrop) closeModal();
	});
	modalPanel = h('div', 'amodal');
	const head = h('div', 'amodal-head');
	head.appendChild(h('span', 'ttl', '🧰 Assets'));
	const close = h('button', '', '✕');
	close.addEventListener('click', closeModal);
	head.appendChild(close);
	modalPanel.appendChild(head);
	modalBackdrop.appendChild(modalPanel);
	isolateUiEvents(modalBackdrop);
	root.appendChild(modalBackdrop);

	mql = window.matchMedia(MOBILE_QUERY);
	try {
		mql.addEventListener('change', onViewportModeChange);
	} catch {
		// Older Safari: addListener only.
		(mql as unknown as { addListener?: (cb: () => void) => void }).addListener?.(onViewportModeChange);
	}
	syncTabButton();
}

/** Session ended — collapse everything so re-entry starts closed. */
export function resetAssetDrawer(): void {
	closeDrawer();
	closeModal();
}
