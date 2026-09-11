/**
 * World editor auth + transport — the single source of truth for in-world
 * editing credentials and the world-write endpoints.
 *
 * The world API supports delegated "world editor tokens" (`we_<random>`):
 * opaque bearer strings presented exactly where a primary API key would go,
 * accepted ONLY by the world-edit endpoints (/upload-world, /world-metadata,
 * /world-upload-assets, /backup-world, /delete-world) plus token
 * self-management. The server derives the write target from the validated
 * credential — never the request body — so a token can't write outside its
 * owner's namespace, and a `world`-scoped token only authorizes its own slug.
 *
 * Credential precedence: the PRIMARY key (present only inside the desktop
 * editor, per AssetBrowser3D's storage_mode convention) wins over the stored
 * `we_` token (a delegate or the owner editing a published page). This module
 * never WRITES a primary key — it only reads one the editor injected.
 *
 * Storing a `we_` token in localStorage is deliberate: it's readable by any
 * script on the origin, which is acceptable BECAUSE these tokens are scoped,
 * revocable, and (ideally) expiring — that's the entire reason they exist
 * instead of the primary key. Grant UIs should default to a finite expiresIn.
 *
 * Browser-only, no React, no deps. Mirrors AssetBrowser3D's localStorage
 * conventions so keys stay consistent across the editor and the runtime.
 */

import { getApiBase, getExplicitApiBase } from '../config/apiConfig';

// ── localStorage keys (shared convention — see AssetBrowser3D.jsx) ─────────
const KEY_WORLD_TOKEN = 'xr_publisher_world_token';
const KEY_API_URL = 'xr_publisher_edge_api_url';
const KEY_EDGE_API_KEY = 'xr_publisher_edge_api_key';
const KEY_LOCAL_API_KEY = 'xr_publisher_local_api_key';
const KEY_STORAGE_MODE = 'storage_mode';

/** Fired on `window` when a stored world token is rejected by the server
 *  (401) — it has been cleared from storage; UI should drop edit affordances
 *  and re-prompt for a token. */
export const EDIT_AUTH_LOST_EVENT = 'xrp:edit-auth-lost';

// ── World identity ──────────────────────────────────────────────────────────
// Baked into the published HTML at publish time and set once at runtime init:
// author = XRPublisherOptions.userData.userId, slug = XRPublisherOptions.postSlug.
// `slug` is ALREADY sanitized (spaces → '-'), matching the world URL
// …/{author}/{slug}. The API re-sanitizes worldName with replace(/\s/g,'-')
// and compares a world-scoped token's slug against the result — sending the
// slug as worldName is a no-op under that sanitizer, so it always matches.

export interface WorldIdentity {
	author: string;
	slug: string;
}

let identity: WorldIdentity = { author: '', slug: '' };

/**
 * PUBLISHED pages don't inject options at all — `new XRPublisher()` runs with
 * defaults (postSlug ''), so explicit identity only exists in the desktop
 * editor context. But a published world's URL already IS its registry
 * identity: `/{author}/{slug}/{slug}.html` (R2/worker serving) or
 * `/directory/{author}/{slug}` — the SAME two patterns `getWorldStateKey()`
 * (state/worldState.ts) has relied on. The path slug is the sanitized slug,
 * which is exactly what world-scoped token checks compare against.
 */
function deriveIdentityFromUrl(): WorldIdentity {
	try {
		const parts = window.location.pathname.split('/').filter(Boolean);
		if (parts[0] === 'directory' && parts.length >= 3) {
			return { author: parts[1], slug: parts[2] };
		}
		if (parts.length >= 3 && parts[2].toLowerCase().endsWith('.html')) {
			return { author: parts[0], slug: parts[1] };
		}
	} catch { /* non-browser env */ }
	return { author: '', slug: '' };
}

export function setWorldIdentity(id: Partial<WorldIdentity>): void {
	// Explicit (editor-injected) values win; empty strings must NOT wipe the
	// URL-derived identity a published page depends on.
	identity = {
		author: id.author || identity.author,
		slug: id.slug || identity.slug,
	};
}

export function getWorldIdentity(): WorldIdentity {
	if (identity.slug) return identity;
	const derived = deriveIdentityFromUrl();
	if (derived.slug) identity = derived;
	return identity.slug ? identity : derived;
}

// ── Credentials ─────────────────────────────────────────────────────────────

function safeGet(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null; // sandboxed iframe / privacy mode
	}
}

function safeSet(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch { /* ignore */ }
}

function safeRemove(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch { /* ignore */ }
}

/** The primary API key, if the desktop editor injected one (owner session). */
export function getPrimaryKey(): string | null {
	const mode = safeGet(KEY_STORAGE_MODE) || 'edge';
	return mode === 'local' ? safeGet(KEY_LOCAL_API_KEY) : safeGet(KEY_EDGE_API_KEY);
}

/** The stored `we_` world editor token for this origin, if any. */
export function getWorldToken(): string | null {
	return safeGet(KEY_WORLD_TOKEN);
}

export function setWorldToken(token: string): void {
	safeSet(KEY_WORLD_TOKEN, token.trim());
}

export function clearWorldToken(): void {
	safeRemove(KEY_WORLD_TOKEN);
}

/** The credential to edit with: primary key if present, else the world token. */
export function getEditCredential(): string | null {
	return getPrimaryKey() ?? getWorldToken();
}

/** Optimistic gate for showing edit UI. The SERVER is the source of truth —
 *  a revoked/expired token still stored here will 401 on first use (and be
 *  cleared + `xrp:edit-auth-lost` emitted by authedFetch). */
export function hasEditCredential(): boolean {
	return getEditCredential() !== null;
}

/** True when the active credential is the primary key (owner session). */
export function isOwnerCredential(): boolean {
	return getPrimaryKey() !== null;
}

/**
 * API base resolution, in order:
 *  1. `xr_publisher_edge_api_url` localStorage override (editor convention);
 *  2. SAME ORIGIN when this page's URL matches a published-world path —
 *     published worlds are served BY the API worker (the same default
 *     `resolveApiBase()` in state/worldState.ts uses), and each deployment
 *     carries its own endpoints;
 *  3. the shared config chain (explicit setApiBase / XRPublisherOptions.
 *     apiBase → window.XRP_API_BASE → same origin). The package has no
 *     baked-in host — dev harnesses and non-world pages must inject their
 *     deployment's origin via one of those.
 */
export function getApiBaseUrl(): string {
	// Explicit configuration must always win: a setApiBase()/XRP_API_BASE
	// caller previously lost to a stale localStorage entry from the desktop
	// editor, silently pointing world writes at the wrong deployment.
	const explicit = getExplicitApiBase();
	if (explicit) return explicit;
	const stored = safeGet(KEY_API_URL);
	if (stored) return stored.replace(/\/$/, '');
	try {
		if (/^https?:/.test(window.location.origin) && deriveIdentityFromUrl().slug) {
			return window.location.origin;
		}
	} catch { /* non-browser env */ }
	return getApiBase();
}

// ── Transport ───────────────────────────────────────────────────────────────

export class WorldApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = 'WorldApiError';
		this.status = status;
	}
}

/**
 * Authenticated fetch against the world API. Injects the base URL and the
 * edit credential. Centralizes the 401 path: if the request was authenticated
 * with a stored world token, that token is cleared and `xrp:edit-auth-lost`
 * fires so the menu layer can re-prompt. Throws WorldApiError on any non-2xx
 * (with the server's `{error}` text when parseable).
 */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
	const credential = getEditCredential();
	if (!credential) {
		throw new WorldApiError(401, 'No editing credential — sign in with a world editor token');
	}
	const usedWorldToken = getPrimaryKey() === null;

	const headers = new Headers(init.headers || {});
	headers.set('Authorization', `Bearer ${credential}`);
	if (init.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });

	if (response.status === 401 && usedWorldToken) {
		clearWorldToken();
		try {
			window.dispatchEvent(new CustomEvent(EDIT_AUTH_LOST_EVENT));
		} catch { /* non-window env */ }
	}

	if (!response.ok) {
		let message = `World API ${response.status}`;
		try {
			const data = await response.json();
			if (data && typeof data.error === 'string') message = data.error;
		} catch { /* non-JSON error body */ }
		throw new WorldApiError(response.status, message);
	}

	return response;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
	const response = await authedFetch(path, {
		method: 'POST',
		body: JSON.stringify(body),
	});
	return response.json() as Promise<T>;
}

function requireIdentity(): WorldIdentity {
	const id = getWorldIdentity();
	if (!id.slug) {
		throw new WorldApiError(400, 'World identity not set — no postSlug and no /{author}/{slug}/ URL');
	}
	return id;
}

// ── World writes (the seam the 3D-side edit mode calls) ────────────────────
// `userId` is sent for parity with the existing handlers but is ADVISORY —
// the server overrides it with the validated credential's owner.

export interface SaveWorldHtmlResult {
	success: boolean;
	message?: string;
	htmlUrl?: string;
	previewUrl?: string | null;
}

/** POST /upload-world — replace the world's published HTML (and optionally
 *  its preview: base64 `data:image/…` uploads to R2, an http(s) URL is stored
 *  as a reference). */
export async function saveWorldHtml(args: { html: string; preview?: string }): Promise<SaveWorldHtmlResult> {
	const { author, slug } = requireIdentity();
	return postJson('/upload-world', {
		userId: author,
		worldName: slug,
		htmlData: args.html,
		...(args.preview !== undefined ? { preview: args.preview } : {}),
	});
}

/** POST /world-metadata — update the world's metadata.json. */
export async function saveWorldMetadata(metadata: Record<string, unknown>): Promise<{ success: boolean }> {
	const { author, slug } = requireIdentity();
	return postJson('/world-metadata', {
		userId: author,
		worldName: slug,
		metadata,
	});
}

/** POST /world-upload-assets — upload a base64-encoded asset into the world's
 *  folder (previews etc.). `fileData` is raw base64 (no data: prefix).
 *  GUEST (world-scoped) credentials are server-quarantined: the file lands in
 *  the world's quarantine/ prefix (`quarantined: true`, `url` points there)
 *  and waits in the review queue until the owner promotes it. */
export async function uploadWorldAsset(args: {
	fileName: string;
	fileData: string;
	assetType: string;
}): Promise<{ success: boolean; assetUrl?: string; url?: string; quarantined?: boolean }> {
	const { author, slug } = requireIdentity();
	return postJson('/world-upload-assets', {
		userId: author,
		worldName: slug,
		fileName: args.fileName,
		fileData: args.fileData,
		assetType: args.assetType,
	});
}

// ── Credential role + asset review queue ────────────────────────────────────
// These use PLAIN fetch (not authedFetch): they're advisory/browse paths where
// a 401 must never clear the stored world token or kill the edit session.

export interface EditRoleInfo {
	role: 'owner' | 'guest' | 'admin';
	scope: string;
	owner?: string;
	slug?: string | null;
}

let cachedRole: { credential: string; info: EditRoleInfo | null } | null = null;

/** GET /api/world-tokens/whoami — what tier is the stored credential?
 *  'owner' (primary key or author-scoped token) sees the asset library and
 *  the promote button; 'guest' (world-scoped token) gets the upload queue
 *  only. Cached per credential; null = unknown/invalid/endpoint missing. */
export async function getEditRole(): Promise<EditRoleInfo | null> {
	const credential = getEditCredential();
	if (!credential) return null;
	if (cachedRole && cachedRole.credential === credential) return cachedRole.info;
	let info: EditRoleInfo | null = null;
	try {
		const response = await fetch(`${getApiBaseUrl()}/api/world-tokens/whoami`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${credential}` },
		});
		if (response.ok) {
			const data = await response.json();
			if (data && (data.role === 'owner' || data.role === 'guest' || data.role === 'admin')) {
				info = data as EditRoleInfo;
			}
		}
	} catch { /* network/deploy gap — treat as unknown */ }
	cachedRole = { credential, info };
	return info;
}

export interface QueuedAsset {
	fileName: string;
	size: number;
	uploaded: string;
	url: string;
}

/** GET /api/world-assets/queue — the world's quarantined (guest-contributed)
 *  assets. Guests see it to place their own uploads; owners review it. */
export async function listQueuedAssets(): Promise<{ files: QueuedAsset[]; canPromote: boolean }> {
	const credential = getEditCredential();
	const { author, slug } = requireIdentity();
	if (!credential) throw new WorldApiError(401, 'No editing credential');
	const params = new URLSearchParams({ author, slug });
	const response = await fetch(`${getApiBaseUrl()}/api/world-assets/queue?${params}`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${credential}` },
	});
	if (!response.ok) {
		let message = `Queue request failed (${response.status})`;
		try {
			const data = await response.json();
			if (data && typeof data.error === 'string') message = data.error;
		} catch { /* non-JSON */ }
		throw new WorldApiError(response.status, message);
	}
	const data = await response.json();
	return {
		files: Array.isArray(data?.files) ? data.files : [],
		canPromote: Boolean(data?.canPromote),
	};
}

export interface PromoteResult {
	success: boolean;
	url: string;
	previousUrl: string;
	fileName: string;
	htmlUpdated: boolean;
}

/** POST /api/world-assets/promote — owner-only: move a queued asset into the
 *  world's official asset space; the server also rewrites the PUBLISHED HTML
 *  from the quarantine URL to the promoted URL. The caller must mirror that
 *  rewrite into any live edit session (editSession.rewriteAssetUrl). */
export async function promoteQueuedAsset(fileName: string): Promise<PromoteResult> {
	const credential = getEditCredential();
	const { author, slug } = requireIdentity();
	if (!credential) throw new WorldApiError(401, 'No editing credential');
	const response = await fetch(`${getApiBaseUrl()}/api/world-assets/promote`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credential}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ author, slug, fileName }),
	});
	if (!response.ok) {
		let message = `Promote failed (${response.status})`;
		try {
			const data = await response.json();
			if (data && typeof data.error === 'string') message = data.error;
		} catch { /* non-JSON */ }
		throw new WorldApiError(response.status, message);
	}
	return response.json();
}

/** POST /backup-world — snapshot the currently-live html/metadata/preview
 *  under a version folder. Call BEFORE a destructive saveWorldHtml. */
export async function backupWorld(version: string): Promise<{ success: boolean; message?: string }> {
	const { author, slug } = requireIdentity();
	return postJson('/backup-world', { author, slug, version });
}

// ── Token management ────────────────────────────────────────────────────────

export interface WorldTokenInfo {
	token_id: string;
	owner_username: string;
	scope: 'author' | 'world';
	slug: string | null;
	label: string;
	parent_token_id: string | null;
	created_at: number;
	expires_at: number | null;
	last_used: number | null;
	revoked: number;
}

export interface GrantTokenResult extends Omit<WorldTokenInfo, 'parent_token_id' | 'created_at' | 'last_used' | 'revoked'> {
	/** The bearer secret — shown ONCE, never retrievable again. */
	token: string;
}

/** POST /api/world-tokens/grant. Delegation rules are server-enforced:
 *  primary key → any scope for your worlds; author token → same-owner grants;
 *  world token → only its own slug. A child's expiry is capped at its
 *  parent's. Default new grants to a finite `expiresIn` (seconds). */
export function grantToken(args: {
	scope: 'author' | 'world';
	slug?: string;
	label: string;
	expiresIn?: number;
}): Promise<GrantTokenResult> {
	return postJson('/api/world-tokens/grant', args);
}

/** GET /api/world-tokens/list — with a primary key: all your tokens; with an
 *  editor token: only its own delegation subtree (including itself). Also the
 *  cheap "is this credential still valid?" probe. */
export async function listTokens(): Promise<WorldTokenInfo[]> {
	const response = await authedFetch('/api/world-tokens/list', { method: 'GET' });
	const data = await response.json();
	return Array.isArray(data?.tokens) ? data.tokens : [];
}

/** POST /api/world-tokens/revoke — by tokenId or label. Cascades to every
 *  token delegated from the revoked one. */
export function revokeToken(args: { tokenId?: string; label?: string }): Promise<{ success: boolean; revoked: number }> {
	return postJson('/api/world-tokens/revoke', args);
}

// ── Self-service credential acquisition ─────────────────────────────────────
// Manual token hand-off is a dead end for most users; these are the two
// no-curl-required paths in: the OWNER exchanges their primary key for an
// editor token in-world (key never stored on this origin), and a DELEGATE
// opens an invite link whose URL fragment carries the token.

/** Grant with an EXPLICIT credential instead of the stored one — the owner
 *  key-exchange path, where the key must be used once and never persisted. */
export async function grantTokenWithCredential(
	credential: string,
	args: { scope: 'author' | 'world'; slug?: string; label: string; expiresIn?: number },
): Promise<GrantTokenResult> {
	const response = await fetch(`${getApiBaseUrl()}/api/world-tokens/grant`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credential.trim()}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(args),
	});
	if (!response.ok) {
		let message = `World API ${response.status}`;
		try {
			const data = await response.json();
			if (data && typeof data.error === 'string') message = data.error;
		} catch { /* non-JSON */ }
		throw new WorldApiError(response.status, message);
	}
	return response.json();
}

/** Default lifetime for a self-minted owner editing pass (30 days — the
 *  owner can always re-exchange their key for a fresh one). */
export const OWNER_TOKEN_EXPIRES_IN = 30 * 86400;

/**
 * Owner bootstrap: exchange the primary API key for an author-scoped editor
 * token and store THAT. The key authenticates exactly one grant request and
 * is never written to this origin's storage — the published page only ever
 * holds the scoped, revocable, expiring `we_` token. Returns true on success.
 */
export async function signInAsOwner(primaryKey: string): Promise<boolean> {
	const key = primaryKey.trim();
	if (!key || key.startsWith('we_')) return false;
	try {
		const result = await grantTokenWithCredential(key, {
			scope: 'author',
			label: `in-world-owner-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}`,
			expiresIn: OWNER_TOKEN_EXPIRES_IN,
		});
		if (!result?.token) return false;
		setWorldToken(result.token);
		return true;
	} catch {
		return false;
	}
}

/** Build a shareable invite link for a freshly-granted token: the current
 *  page with the token in the URL FRAGMENT (never sent to any server; we
 *  strip it from the address bar on consumption). Anyone with the link can
 *  edit until the token expires or is revoked — grant finite expiries. */
export function buildInviteLink(token: string): string {
	const url = new URL(window.location.href);
	url.hash = `edit-token=${token}`;
	// Drop ?edit-token if a previous link's param survived somehow.
	url.searchParams.delete('edit-token');
	return url.toString();
}

/**
 * Invite-link consumption: if the URL carries `#edit-token=we_…` (or the
 * `?edit-token=` query fallback), strip it from the address bar IMMEDIATELY
 * (before any network round-trip — don't leave the secret on display or in
 * copy-paste range), then validate + store it. Resolves true when a token
 * was found AND authenticated.
 */
export async function consumeUrlToken(): Promise<boolean> {
	let token: string | null = null;
	try {
		const hashMatch = /(?:^#|&)edit-token=(we_[A-Za-z0-9_-]+)/.exec(window.location.hash);
		if (hashMatch) token = hashMatch[1];
		const url = new URL(window.location.href);
		if (!token) token = url.searchParams.get('edit-token');
		if (!token) return false;
		// Strip both carriers, keep everything else (?renderer, etc.).
		url.searchParams.delete('edit-token');
		url.hash = url.hash.replace(/(?:^#?|&)edit-token=we_[A-Za-z0-9_-]+/, '').replace(/^&/, '');
		window.history.replaceState(null, '', url.toString());
	} catch {
		return false;
	}
	return signInWithToken(token);
}

/** Validate a pasted token against the server (list probe, sent with THE
 *  TOKEN itself — not authedFetch, whose precedence would let a present
 *  primary key mask a bad paste), then store it. Returns true when it
 *  authenticates; an invalid token is never stored. */
export async function signInWithToken(token: string): Promise<boolean> {
	const trimmed = token.trim();
	if (!trimmed.startsWith('we_')) return false;
	try {
		const response = await fetch(`${getApiBaseUrl()}/api/world-tokens/list`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${trimmed}` },
		});
		if (!response.ok) return false;
	} catch {
		return false;
	}
	setWorldToken(trimmed);
	return true;
}
