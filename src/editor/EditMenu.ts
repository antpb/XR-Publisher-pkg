/**
 * In-world editing UI — the "More"-menu entries and DOM overlays that let a
 * player authenticate as a world editor and manage delegated tokens, on a
 * published page, without the desktop editor.
 *
 * Everything here rides existing extension points (registerMenuItem +
 * registerHud); the auth/transport logic lives in `worldTokenClient.ts`.
 * Token entry is FLATSCREEN-FIRST by design: `we_…` tokens are long opaque
 * strings, the MSDF in-world dialog has no text field, and VR text entry is
 * impractical — so entry/management are DOM overlays (a VR session inherits
 * a credential authenticated on flatscreen; localStorage persists it).
 *
 * The actual scene editing is the 3D side (owned elsewhere). Its handoff is
 * the `xrpublisher:edit-world` window event fired by the "Edit this world"
 * menu item — it consumes `XRPublisher.getEditCredential()` / `saveWorld*`.
 */

import { registerMenuItem, unregisterMenuItem } from '../decorations/pluginMenu';
import { registerHud, unregisterHud } from '../decorations/pluginHud';
import {
	EDIT_AUTH_LOST_EVENT,
	getWorldIdentity,
	getPrimaryKey,
	getWorldToken,
	hasEditCredential,
	clearWorldToken,
	signInWithToken,
	signInAsOwner,
	consumeUrlToken,
	buildInviteLink,
	grantToken,
	listTokens,
	revokeToken,
	type WorldTokenInfo,
} from './worldTokenClient';
import { enterEditMode } from './editSession';
import { initEditorShell } from './ui/EditorShell';

function openDialogSafeError(message: string): void {
	try {
		alert(`Edit mode failed: ${message}`);
	} catch { /* headless */ }
}

/** Fired on `window` when the player picks "Edit this world" — the 3D-side
 *  edit mode listens for this. `detail` = { author, slug }. */
export const EDIT_WORLD_EVENT = 'xrpublisher:edit-world';

const MENU_SIGN_IN = 'edit-sign-in';
const MENU_EDIT_WORLD = 'edit-world';
const MENU_MANAGE = 'edit-manage-editors';
const MENU_SIGN_OUT = 'edit-sign-out';
const HUD_OVERLAY_ID = 'edit-auth-overlay';

// Menu rows sort after gameplay items but before nothing in particular —
// keep the editing cluster together at the bottom of the More menu.
const MENU_ORDER_BASE = 900;

let initialized = false;
let overlayOpen = false;
let hadPointerLock = false;

// ── Overlay plumbing (shared by sign-in and manage) ─────────────────────────

function closeOverlay(): void {
	if (!overlayOpen) return;
	overlayOpen = false;
	unregisterHud(HUD_OVERLAY_ID);
	// Best-effort re-lock: only if the player was locked when we opened.
	if (hadPointerLock) {
		hadPointerLock = false;
		const canvas = document.querySelector('canvas');
		if (canvas && typeof (canvas as HTMLCanvasElement).requestPointerLock === 'function') {
			try { (canvas as HTMLCanvasElement).requestPointerLock(); } catch { /* gesture-gated */ }
		}
	}
}

function openOverlay(build: (panel: HTMLDivElement) => void): void {
	closeOverlay();
	overlayOpen = true;
	// Release pointer lock so the cursor can reach the DOM inputs.
	hadPointerLock = !!document.pointerLockElement;
	if (hadPointerLock) {
		try { document.exitPointerLock(); } catch { /* ignore */ }
	}

	const panel = document.createElement('div');
	Object.assign(panel.style, {
		pointerEvents: 'auto',
		background: 'rgba(18, 18, 24, 0.96)',
		color: '#eee',
		borderRadius: '12px',
		border: '1px solid rgba(255,255,255,0.14)',
		padding: '18px',
		width: 'min(440px, calc(100vw - 48px))',
		maxHeight: 'calc(100vh - 160px)',
		overflowY: 'auto',
		font: '14px/1.45 system-ui, sans-serif',
		boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
	} as Partial<CSSStyleDeclaration>);
	// The world's global key handlers (WASD movement, E interact, delete) must
	// not fire while typing a token/label — swallow keys at the panel boundary.
	panel.addEventListener('keydown', (e) => e.stopPropagation());
	panel.addEventListener('keyup', (e) => e.stopPropagation());
	panel.addEventListener('keypress', (e) => e.stopPropagation());

	build(panel);
	registerHud(HUD_OVERLAY_ID, panel, 'top-center');
}

// Small element factories to keep the builders readable.

function h(tag: string, style: Partial<CSSStyleDeclaration>, text?: string): HTMLElement {
	const el = document.createElement(tag);
	Object.assign(el.style, style);
	if (text !== undefined) el.textContent = text;
	return el;
}

function makeButton(label: string, primary: boolean, onClick: () => void): HTMLButtonElement {
	const btn = document.createElement('button');
	btn.textContent = label;
	Object.assign(btn.style, {
		padding: '8px 14px',
		borderRadius: '8px',
		border: primary ? 'none' : '1px solid rgba(255,255,255,0.25)',
		background: primary ? '#7c6cff' : 'transparent',
		color: primary ? '#fff' : '#ddd',
		cursor: 'pointer',
		font: 'inherit',
	} as Partial<CSSStyleDeclaration>);
	btn.addEventListener('click', onClick);
	return btn;
}

function makeInput(placeholder: string, mono = false): HTMLInputElement {
	const input = document.createElement('input');
	input.type = 'text';
	input.placeholder = placeholder;
	input.autocomplete = 'off';
	input.spellcheck = false;
	Object.assign(input.style, {
		width: '100%',
		boxSizing: 'border-box',
		padding: '9px 10px',
		borderRadius: '8px',
		border: '1px solid rgba(255,255,255,0.25)',
		background: 'rgba(0,0,0,0.35)',
		color: '#fff',
		font: mono ? '13px/1.4 ui-monospace, monospace' : 'inherit',
	} as Partial<CSSStyleDeclaration>);
	return input;
}

function makeStatusLine(): HTMLElement {
	return h('div', { minHeight: '18px', fontSize: '13px', color: '#f88', marginTop: '8px' });
}

function titleRow(panel: HTMLDivElement, title: string): void {
	const row = h('div', {
		display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px',
	});
	row.appendChild(h('div', { fontWeight: '600', fontSize: '16px' }, title));
	const close = makeButton('✕', false, closeOverlay);
	Object.assign(close.style, { padding: '2px 9px', borderRadius: '6px' });
	row.appendChild(close);
	panel.appendChild(row);
}

// ── Sign-in overlay ──────────────────────────────────────────────────────────

function openSignInOverlay(): void {
	openOverlay((panel) => {
		titleRow(panel, 'Sign in to edit');

		const status = makeStatusLine();

		// ── Path 1: delegate with an invite token ──
		panel.appendChild(h('div', { fontWeight: '600', marginBottom: '4px' }, 'Have an editor token?'));
		panel.appendChild(h('div', { color: '#bbb', fontSize: '13px', marginBottom: '8px' },
			'Paste the we_… token (or just open the invite link the owner sent you — it signs you in automatically).'));

		const input = makeInput('we_…', true);
		panel.appendChild(input);

		const row = h('div', { display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' });

		// Clipboard paste helper — also the VR-adjacent path (one click, no typing).
		row.appendChild(makeButton('Paste', false, async () => {
			try {
				input.value = (await navigator.clipboard.readText()).trim();
			} catch {
				status.textContent = 'Clipboard unavailable — paste into the field manually.';
			}
		}));

		const save = makeButton('Sign in', true, async () => {
			const token = input.value.trim();
			if (!token.startsWith('we_')) {
				status.textContent = 'That does not look like a world editor token (we_…).';
				return;
			}
			save.disabled = true;
			status.style.color = '#bbb';
			status.textContent = 'Checking token…';
			const ok = await signInWithToken(token);
			save.disabled = false;
			if (ok) {
				closeOverlay();
				refreshMenu();
			} else {
				status.style.color = '#f88';
				status.textContent = 'Token rejected — it may be revoked, expired, or mistyped.';
			}
		});
		row.appendChild(save);
		panel.appendChild(row);

		// ── Path 2: owner key exchange ──
		panel.appendChild(h('div', {
			borderTop: '1px solid rgba(255,255,255,0.12)', margin: '14px 0 10px',
		}));
		panel.appendChild(h('div', { fontWeight: '600', marginBottom: '4px' }, 'This is my world'));
		panel.appendChild(h('div', { color: '#bbb', fontSize: '13px', marginBottom: '8px' },
			'Paste your XR Publisher API key. It is used ONCE to mint a revocable 30-day editing pass and is never stored on this page — only the pass is.'));

		const keyInput = makeInput('username.apikey…', true);
		keyInput.type = 'password';
		panel.appendChild(keyInput);

		const ownerRow = h('div', { display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' });
		const ownerBtn = makeButton('Sign in as owner', true, async () => {
			const key = keyInput.value.trim();
			if (!key || key.startsWith('we_')) {
				status.textContent = 'That looks like an editor token — paste it in the field above instead.';
				return;
			}
			ownerBtn.disabled = true;
			status.style.color = '#bbb';
			status.textContent = 'Exchanging key for an editing pass…';
			const ok = await signInAsOwner(key);
			keyInput.value = ''; // never leave the key sitting in the DOM
			ownerBtn.disabled = false;
			if (ok) {
				closeOverlay();
				refreshMenu();
			} else {
				status.style.color = '#f88';
				status.textContent = 'Key rejected — check it and try again.';
			}
		});
		ownerRow.appendChild(ownerBtn);
		panel.appendChild(ownerRow);

		panel.appendChild(status);
		setTimeout(() => input.focus(), 0);
	});
}

// ── Manage-editors overlay ───────────────────────────────────────────────────

const EXPIRY_CHOICES: Array<{ label: string; seconds: number | undefined }> = [
	{ label: '24 hours', seconds: 86400 },
	{ label: '7 days', seconds: 604800 },
	{ label: '30 days', seconds: 2592000 },
	{ label: 'Never (not recommended)', seconds: undefined },
];

function formatExpiry(expiresAt: number | null): string {
	if (!expiresAt) return 'no expiry';
	const ms = expiresAt * 1000 - Date.now();
	if (ms <= 0) return 'expired';
	const days = Math.floor(ms / 86400000);
	if (days > 0) return `expires in ${days}d`;
	const hours = Math.floor(ms / 3600000);
	if (hours > 0) return `expires in ${hours}h`;
	return 'expires in <1h';
}

function openManageOverlay(): void {
	openOverlay((panel) => {
		titleRow(panel, 'Manage editors');

		const status = makeStatusLine();
		const listBox = h('div', { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' });
		panel.appendChild(listBox);

		const renderList = async () => {
			listBox.textContent = '';
			listBox.appendChild(h('div', { color: '#999' }, 'Loading tokens…'));
			let tokens: WorldTokenInfo[];
			try {
				tokens = await listTokens();
			} catch (e) {
				listBox.textContent = '';
				listBox.appendChild(h('div', { color: '#f88' },
					e instanceof Error ? e.message : 'Failed to list tokens'));
				return;
			}
			listBox.textContent = '';
			const active = tokens.filter((t) => !t.revoked);
			if (active.length === 0) {
				listBox.appendChild(h('div', { color: '#999' }, 'No active editor tokens.'));
				return;
			}
			for (const t of active) {
				const row = h('div', {
					display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
					padding: '7px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)',
				});
				const scopeText = t.scope === 'world' ? `world: ${t.slug}` : 'all worlds';
				const info = h('div', { overflow: 'hidden' });
				info.appendChild(h('div', { fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, t.label || t.token_id));
				info.appendChild(h('div', { fontSize: '12px', color: '#aaa' }, `${scopeText} · ${formatExpiry(t.expires_at)}`));
				row.appendChild(info);
				const revoke = makeButton('Revoke', false, async () => {
					revoke.disabled = true;
					try {
						await revokeToken({ tokenId: t.token_id });
						await renderList();
					} catch (e) {
						revoke.disabled = false;
						status.textContent = e instanceof Error ? e.message : 'Revoke failed';
					}
				});
				Object.assign(revoke.style, { borderColor: 'rgba(255,120,120,0.5)', color: '#f99', flexShrink: '0' });
				row.appendChild(revoke);
				listBox.appendChild(row);
			}
		};

		// ── Grant form ──
		panel.appendChild(h('div', { fontWeight: '600', margin: '4px 0 8px' }, 'Invite an editor'));

		const labelInput = makeInput('Label (e.g. "alice")');
		panel.appendChild(labelInput);

		const controls = h('div', { display: 'flex', gap: '8px', marginTop: '8px' });
		const scopeSelect = document.createElement('select');
		const expirySelect = document.createElement('select');
		for (const sel of [scopeSelect, expirySelect]) {
			Object.assign(sel.style, {
				flex: '1', padding: '8px', borderRadius: '8px', font: 'inherit',
				background: 'rgba(0,0,0,0.35)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
			} as Partial<CSSStyleDeclaration>);
		}
		const { slug } = getWorldIdentity();
		const worldOpt = document.createElement('option');
		worldOpt.value = 'world';
		worldOpt.textContent = slug ? `This world only (${slug})` : 'This world only';
		scopeSelect.appendChild(worldOpt);
		// A world-scoped credential may only delegate within its own world —
		// offering author scope would just 401 at the server. Owners (primary
		// key) and author-scope holders get both choices; we resolve which we
		// are asynchronously below and remove the option if it doesn't apply.
		const worldToken = getWorldToken();
		const authorOpt = document.createElement('option');
		authorOpt.value = 'author';
		authorOpt.textContent = 'All my worlds';
		scopeSelect.appendChild(authorOpt);
		controls.appendChild(scopeSelect);

		for (let i = 0; i < EXPIRY_CHOICES.length; i++) {
			const opt = document.createElement('option');
			opt.value = String(i);
			opt.textContent = EXPIRY_CHOICES[i].label;
			expirySelect.appendChild(opt);
		}
		expirySelect.value = '1'; // default 7 days — finite by default, on purpose
		controls.appendChild(expirySelect);
		panel.appendChild(controls);

		// If our own credential is a world-scoped token, hide the author option
		// (server would reject it). We can tell from the list: our own token is
		// in it. Async — the option is present until we know better.
		if (!getPrimaryKey() && worldToken) {
			listTokens().then((tokens) => {
				const hasAuthorScope = tokens.some((t) => t.scope === 'author' && !t.revoked);
				if (!hasAuthorScope && authorOpt.parentNode) {
					authorOpt.parentNode.removeChild(authorOpt);
				}
			}).catch(() => { /* list already surfaced its own error */ });
		}

		const grantRow = h('div', { display: 'flex', justifyContent: 'flex-end', marginTop: '10px' });
		const grantBtn = makeButton('Grant token', true, async () => {
			const label = labelInput.value.trim();
			if (!label) {
				status.textContent = 'Give the token a label so you can revoke it later.';
				return;
			}
			const scope = scopeSelect.value as 'author' | 'world';
			const expiresIn = EXPIRY_CHOICES[Number(expirySelect.value)]?.seconds;
			grantBtn.disabled = true;
			status.style.color = '#bbb';
			status.textContent = 'Granting…';
			try {
				const result = await grantToken({
					scope,
					...(scope === 'world' ? { slug } : {}),
					label,
					...(expiresIn !== undefined ? { expiresIn } : {}),
				});
				status.textContent = '';
				showGrantedToken(panel, result.token, label);
				labelInput.value = '';
				await renderList();
			} catch (e) {
				status.style.color = '#f88';
				status.textContent = e instanceof Error ? e.message : 'Grant failed';
			} finally {
				grantBtn.disabled = false;
			}
		});
		grantRow.appendChild(grantBtn);
		panel.appendChild(grantRow);
		panel.appendChild(status);

		renderList();
	});
}

/** Show a freshly-granted token ONCE with a copy button — it can never be
 *  retrieved again (only revoked). */
function showGrantedToken(panel: HTMLDivElement, token: string, label: string): void {
	const box = h('div', {
		marginTop: '12px', padding: '10px', borderRadius: '8px',
		background: 'rgba(124,108,255,0.12)', border: '1px solid rgba(124,108,255,0.45)',
	});
	box.appendChild(h('div', { fontWeight: '600', marginBottom: '4px' }, `Token for "${label}"`));
	box.appendChild(h('div', { fontSize: '12px', color: '#fc6', marginBottom: '6px' },
		'Shown ONCE — copy it now and send it to your editor. It cannot be viewed again.'));
	const tokenEl = h('div', {
		font: '12px/1.4 ui-monospace, monospace', wordBreak: 'break-all',
		background: 'rgba(0,0,0,0.4)', padding: '7px', borderRadius: '6px', marginBottom: '8px',
	}, token);
	box.appendChild(tokenEl);
	const btnRow = h('div', { display: 'flex', gap: '8px', flexWrap: 'wrap' });
	// The invite link is the zero-friction hand-off: the recipient opens it
	// and the runtime signs them in from the URL fragment automatically.
	const copyLink = makeButton('Copy invite link', true, async () => {
		try {
			await navigator.clipboard.writeText(buildInviteLink(token));
			copyLink.textContent = 'Link copied ✓';
		} catch {
			copyLink.textContent = 'Clipboard blocked — copy the token instead';
		}
	});
	btnRow.appendChild(copyLink);
	const copy = makeButton('Copy token', false, async () => {
		try {
			await navigator.clipboard.writeText(token);
			copy.textContent = 'Copied ✓';
		} catch {
			// Clipboard API blocked — select the text for a manual copy.
			const range = document.createRange();
			range.selectNodeContents(tokenEl);
			const sel = window.getSelection();
			sel?.removeAllRanges();
			sel?.addRange(range);
			copy.textContent = 'Select + copy manually';
		}
	});
	btnRow.appendChild(copy);
	box.appendChild(btnRow);
	box.appendChild(h('div', { fontSize: '12px', color: '#999', marginTop: '6px' },
		'Anyone with the link can edit until it expires or you revoke it here.'));
	panel.appendChild(box);
}

// ── Menu registration ────────────────────────────────────────────────────────

function refreshMenu(): void {
	const { slug } = getWorldIdentity();
	const authed = hasEditCredential();

	// Without a slug there's no world to edit or scope tokens to — no UI.
	if (!slug) {
		unregisterMenuItem(MENU_SIGN_IN);
		unregisterMenuItem(MENU_EDIT_WORLD);
		unregisterMenuItem(MENU_MANAGE);
		unregisterMenuItem(MENU_SIGN_OUT);
		return;
	}

	if (!authed) {
		// Always discoverable: getting a credential must be self-service (an
		// out-of-band "ask the owner to curl a token" step is a dead end).
		// The row lives behind the hamburger, so it costs no HUD clutter, and
		// the overlay offers both paths in: invite token OR owner key exchange.
		registerMenuItem({
			id: MENU_SIGN_IN,
			label: 'Sign in to edit',
			icon: '🔑',
			order: MENU_ORDER_BASE,
			onSelect: openSignInOverlay,
		});
		unregisterMenuItem(MENU_EDIT_WORLD);
		unregisterMenuItem(MENU_MANAGE);
		unregisterMenuItem(MENU_SIGN_OUT);
		return;
	}

	unregisterMenuItem(MENU_SIGN_IN);
	registerMenuItem({
		id: MENU_EDIT_WORLD,
		label: 'Edit this world',
		icon: '✏️',
		order: MENU_ORDER_BASE,
		onSelect: () => {
			// Enter the in-world editor: shadow-document session + gizmo
			// system + shadow-DOM shell. The event also fires for tooling.
			initEditorShell();
			enterEditMode().then(() => {
				window.dispatchEvent(new CustomEvent(EDIT_WORLD_EVENT, { detail: getWorldIdentity() }));
			}).catch((e) => {
				console.error('[XRPublisher] failed to enter edit mode:', e);
				openDialogSafeError(e instanceof Error ? e.message : 'Could not load the world source');
			});
		},
	});
	registerMenuItem({
		id: MENU_MANAGE,
		label: 'Manage editors',
		icon: '👥',
		order: MENU_ORDER_BASE + 1,
		onSelect: openManageOverlay,
	});
	// The primary key belongs to the desktop editor session, not us — only a
	// stored world token is ours to sign out of.
	if (getWorldToken() !== null && getPrimaryKey() === null) {
		registerMenuItem({
			id: MENU_SIGN_OUT,
			label: 'Sign out of editing',
			icon: '🚪',
			order: MENU_ORDER_BASE + 2,
			onSelect: () => {
				clearWorldToken();
				closeOverlay();
				refreshMenu();
			},
		});
	} else {
		unregisterMenuItem(MENU_SIGN_OUT);
	}
}

/**
 * Mount the in-world editing affordances. Idempotent; called once from
 * XRPublisher.init(). Registers nothing when the page has no world identity
 * (single-object viewers, plugin-only pages without a postSlug).
 */
export function initEditMenu(): void {
	if (initialized) {
		refreshMenu();
		return;
	}
	initialized = true;
	// Server rejected our stored token (revoked/expired) — drop the edit UI
	// back to "Sign in to edit". worldTokenClient already cleared the token.
	window.addEventListener(EDIT_AUTH_LOST_EVENT, () => {
		closeOverlay();
		refreshMenu();
	});
	refreshMenu();
	// Invite link: `#edit-token=we_…` in the URL signs the visitor in with no
	// manual steps (stripped from the address bar before validation). The
	// menu re-renders once the token authenticates.
	consumeUrlToken().then((ok) => {
		if (ok) refreshMenu();
	}).catch(() => { /* invalid/absent token — sign-in row stays */ });
}
