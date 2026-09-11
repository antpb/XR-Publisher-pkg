/**
 * World-preview screenshot upload — the network half of the environment
 * block's "Use current view" button.
 *
 * Naming contract: previews are `world-preview-{slug}.{ext}` (see
 * WORLD_PREVIEW_PREFIX). The name is STABLE per world on purpose: the
 * author-asset R2 key is `authors/{userId}/{fileName}`, so every re-capture
 * overwrites the previous preview in place (zero storage growth), and media
 * views can filter previews out by the predictable prefix.
 *
 * Two paths, by credential (mirrors the AssetDrawer owner/guest split):
 *  - PRIMARY KEY (owner session): the chunked author-asset flow the API
 *    expects (`/api/author/asset-upload-chunk` + `-complete`, same protocol as
 *    the native editor's ToyboxView / Menubar.Status). These routes validate
 *    the key against the account username — a `we_` token 401s here.
 *    Returns a full https URL.
 *  - `we_` TOKEN (delegate/guest): the world-scoped `/world-upload-assets`
 *    single-shot path via uploadWorldAsset(). Guest uploads land in the
 *    review queue (`quarantined: true`) until the owner promotes them.
 */

import {
	getApiBaseUrl,
	getPrimaryKey,
	getWorldIdentity,
	uploadWorldAsset,
	WorldApiError,
} from './worldTokenClient';

/** Filter key for media views: every world preview file starts with this. */
export const WORLD_PREVIEW_PREFIX = 'world-preview-';

// Matches the native editor's chunked-upload protocol: chunks are slices of
// the BASE64 STRING (character offsets), not the raw bytes.
const CHUNK_SIZE = 5 * 1024 * 1024;
const THUMB_MAX_DIM = 320;

/** Chunked btoa — String.fromCharCode over a whole buffer blows the arg limit. */
export function bytesToBase64(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	let binary = '';
	const CHUNK = 0x8000;
	for (let i = 0; i < bytes.length; i += CHUNK) {
		binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	}
	return btoa(binary);
}

function extFor(type: string): string {
	if (type === 'image/webp') return 'webp';
	if (type === 'image/png') return 'png';
	return 'jpg';
}

/** Small thumb for the asset library card (the complete route requires one). */
async function makeThumbDataUrl(blob: Blob): Promise<string> {
	const bitmap = await createImageBitmap(blob);
	try {
		const scale = Math.min(1, THUMB_MAX_DIM / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(bitmap.width * scale));
		canvas.height = Math.max(1, Math.round(bitmap.height * scale));
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('2D canvas unavailable');
		ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		const webp = canvas.toDataURL('image/webp', 0.75);
		return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.75);
	} finally {
		bitmap.close();
	}
}

function safeGetUsername(): string | null {
	try {
		return localStorage.getItem('xr_publisher_username');
	} catch {
		return null;
	}
}

export interface PreviewUploadResult {
	url: string;
	/** True when a guest upload landed in the review queue. */
	quarantined: boolean;
}

/** Upload a captured preview image; resolves with the URL to store on the block. */
export async function uploadWorldPreview(blob: Blob): Promise<PreviewUploadResult> {
	const { author, slug } = getWorldIdentity();
	if (!slug) {
		throw new WorldApiError(400, 'World identity not set — cannot name the preview image');
	}
	const fileName = `${WORLD_PREVIEW_PREFIX}${slug}.${extFor(blob.type)}`
		.replace(/\s/g, '-')
		.toLowerCase(); // pre-apply the server's sanitizer so the returned URL matches
	const base64 = bytesToBase64(await blob.arrayBuffer());

	const primaryKey = getPrimaryKey();
	if (primaryKey) {
		// These routes validate the key against the ACCOUNT username, which can
		// differ from the world author (admin edits) — prefer the stored login.
		const userId = safeGetUsername() || author;
		const apiBase = getApiBaseUrl();
		const headers = {
			Authorization: `Bearer ${primaryKey}`,
			'Content-Type': 'application/json',
		};
		const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
		const totalChunks = Math.max(1, Math.ceil(base64.length / CHUNK_SIZE));
		for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
			const response = await fetch(`${apiBase}/api/author/asset-upload-chunk`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					fileName,
					fileData: base64.slice((chunkNumber - 1) * CHUNK_SIZE, chunkNumber * CHUNK_SIZE),
					chunkNumber,
					totalChunks,
					uploadId,
					userId,
				}),
			});
			if (!response.ok) {
				throw new WorldApiError(response.status, `Preview chunk ${chunkNumber}/${totalChunks} failed`);
			}
		}
		const complete = await fetch(`${apiBase}/api/author/asset-upload-complete`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				userId,
				fileName,
				fileType: blob.type,
				uploadId,
				fileSize: blob.size, // raw byte length — the server allocates Uint8Array(fileSize)
				thumb: await makeThumbDataUrl(blob), // REQUIRED by the complete handler
				tags: ['world-preview'],
				categories: [],
				metadata: { kind: 'world-preview', world: slug },
				background: {},
			}),
		});
		if (!complete.ok) {
			throw new WorldApiError(complete.status, 'Preview upload could not be finalized');
		}
		const data = await complete.json() as { success?: boolean; fileUrl?: string };
		if (!data.success || !data.fileUrl) {
			throw new WorldApiError(complete.status, 'Preview upload finished without a file URL');
		}
		return { url: data.fileUrl, quarantined: false };
	}

	// `we_` token: world-scoped single-shot upload (guests get quarantined).
	const result = await uploadWorldAsset({ fileName, fileData: base64, assetType: 'image' });
	if (!result.success) throw new WorldApiError(400, 'Preview upload rejected');
	const url = result.url ?? result.assetUrl;
	if (!url) throw new WorldApiError(500, 'Preview upload returned no URL');
	return { url, quarantined: result.quarantined === true };
}
