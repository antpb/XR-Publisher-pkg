/**
 * World serializer v3 — serializes the edit session's SAFE-AREA template.
 *
 * OUTPUT IS THE BLOCK MARKUP ONLY — the `wp:xr-publisher/environment`
 * comment region the native desktop editor manages — NEVER a page. (v2
 * returned `<!DOCTYPE html>` + documentElement.outerHTML; uploading that
 * embedded the serve-template's runtime/plugin <script> tags into the
 * stored world and every serve booted two engine instances. The API now
 * also enforces this server-side.) The session holds the markup in a
 * <template>, so `innerHTML` round-trips comments and custom elements with
 * zero document restructuring.
 *
 * Because every edit already lives as attribute state on the template's own
 * elements, saving is mostly `innerHTML`: the wp-comment scaffolding
 * survives untouched for unedited blocks. The two structural operations:
 *
 *  - DELETIONS remove the element AND its enclosing wp-comment pair (the
 *    comment immediately before / the closer immediately after), matching
 *    what the native editor would have emitted without the block.
 *  - ADDITIONS are appended inside the environment block with a freshly
 *    generated comment pair in the native format.
 */

import type { BlockEntry } from './editSession';

/** three-model-block → xr-publisher/model-block (native comment namespace). */
function commentNameFor(tag: string): string {
	return `xr-publisher/${tag.replace(/^three-/, '')}`;
}

function attrsObject(el: Element): Record<string, string> {
	const out: Record<string, string> = {};
	for (const a of Array.from(el.attributes)) out[a.name] = a.value;
	return out;
}

function isWpComment(node: Node | null, closing: boolean): node is Comment {
	if (!node || node.nodeType !== Node.COMMENT_NODE) return false;
	const text = (node as Comment).data.trim();
	return closing ? text.startsWith('/wp:xr-publisher/') : text.startsWith('wp:xr-publisher/');
}

/** Skip whitespace-only text nodes when walking siblings. */
function siblingSkippingWhitespace(node: Node, dir: 'previous' | 'next'): Node | null {
	let n: Node | null = dir === 'previous' ? node.previousSibling : node.nextSibling;
	while (n && n.nodeType === Node.TEXT_NODE && !(n as Text).data.trim()) {
		n = dir === 'previous' ? n.previousSibling : n.nextSibling;
	}
	return n;
}

function removeBlockWithComments(el: Element): void {
	const before = siblingSkippingWhitespace(el, 'previous');
	const after = siblingSkippingWhitespace(el, 'next');
	if (isWpComment(before, false)) before.parentNode?.removeChild(before);
	if (isWpComment(after, true)) after.parentNode?.removeChild(after);
	el.remove();
}

export function serializeShadowDoc(root: HTMLTemplateElement, entries: Iterable<BlockEntry>): string {
	const env = root.content.querySelector('three-environment-block');
	if (!env) throw new Error('Edit session has no <three-environment-block> — refusing to save');

	for (const entry of entries) {
		if (entry.deleted) {
			// Authored blocks, and additions that were ALREADY saved once
			// (their element is connected from the previous serialize).
			if (entry.el.parentNode) removeBlockWithComments(entry.el);
		} else if (entry.origin === 'added' && !entry.el.parentNode) {
			// Second save in one session must not re-append (appendChild on a
			// connected node would MOVE it and duplicate its comment pair).
			const name = commentNameFor(entry.tag);
			env.appendChild(document.createTextNode('\n'));
			env.appendChild(document.createComment(` wp:${name} ${JSON.stringify(attrsObject(entry.el))} `));
			env.appendChild(document.createTextNode('\n'));
			env.appendChild(entry.el);
			env.appendChild(document.createTextNode('\n'));
			env.appendChild(document.createComment(` /wp:${name} `));
			env.appendChild(document.createTextNode('\n'));
		}
	}

	// The template's innerHTML IS the safe area — block markup + wp comments,
	// no doctype, no html/head/body, no page chrome.
	return root.innerHTML.trim();
}
