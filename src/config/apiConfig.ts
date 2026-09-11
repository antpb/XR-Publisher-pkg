/**
 * Single source of truth for the publishing-API origin (world registry,
 * character/NPC endpoints, editor tokens, asset library, world state).
 *
 * The package ships with NO baked-in host. Resolution order:
 *
 *  1. Explicit configuration — `XRPublisherOptions.apiBase` or
 *     `XRPublisher.setApiBase(url)`.
 *  2. `window.XRP_API_BASE` — for script-tag consumers; a serve template or
 *     dev harness injects its own deployment's origin here.
 *  3. localStorage `xr_publisher_edge_api_url` — the desktop editor's
 *     stored-settings convention (shared with worldTokenClient /
 *     AssetBrowser3D).
 *  4. Same origin — published worlds are served BY the API worker, so the
 *     page origin IS the API origin. This is why published worlds need no
 *     configuration at all.
 *
 * Every step strips a trailing slash so callers can safely concatenate
 * `${getApiBase()}/api/...`.
 */

const KEY_API_URL = 'xr_publisher_edge_api_url';

let explicitBase: string | null = null;

/** Set the API origin explicitly (highest priority). Pass '' or null to
 *  clear and fall back to the resolution chain. */
export function setApiBase(url: string | null | undefined): void {
	explicitBase = url ? url.replace(/\/$/, '') : null;
}

/** The explicitly-configured origin only (setApiBase / XRPublisherOptions
 *  .apiBase, or the script-tag `window.XRP_API_BASE` injection) — null when
 *  neither was provided. Lets callers with their own storage conventions
 *  (worldTokenClient) honor explicit configuration FIRST without also
 *  inheriting this module's localStorage/same-origin fallbacks. */
export function getExplicitApiBase(): string | null {
	if (explicitBase) return explicitBase;
	try {
		const injected = (window as unknown as { XRP_API_BASE?: string }).XRP_API_BASE;
		if (typeof injected === 'string' && injected) return injected.replace(/\/$/, '');
	} catch { /* non-browser env */ }
	return null;
}

export function getApiBase(): string {
	if (explicitBase) return explicitBase;
	try {
		const injected = (window as unknown as { XRP_API_BASE?: string }).XRP_API_BASE;
		if (typeof injected === 'string' && injected) return injected.replace(/\/$/, '');
	} catch { /* non-browser env */ }
	try {
		const stored = window.localStorage?.getItem(KEY_API_URL);
		if (stored) return stored.replace(/\/$/, '');
	} catch { /* storage unavailable */ }
	try {
		if (/^https?:/.test(window.location.origin)) return window.location.origin;
	} catch { /* non-browser env */ }
	return '';
}
