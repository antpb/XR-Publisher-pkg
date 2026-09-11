/**
 * One-shot view capture — screenshot the live world WITHOUT the local avatar,
 * for the editor's "Use current view" world-preview button.
 *
 * Why this lives here and not in editor code: the renderer/camera are only
 * reachable inside R3F's frame loop (there is no getRenderer/getCamera global),
 * so — like postFx.ts and occluderDepth.ts — this module is serviced by
 * FrameRateCap. A pending capture BECOMES that tick's render (FrameRateCap
 * skips its own draw when serviceViewCapture returns true), so one presented
 * frame simply lacks the avatar.
 *
 * The canvas readback is the proven Menubar.Status.js pattern: render, then
 * drawImage the GL canvas into a 2D canvas IN THE SAME synchronous callback.
 * That works on both paths — the WebGL renderer is created with
 * `preserveDrawingBuffer: true`, and a WebGPU canvas texture stays current
 * until the frame presents. The 2D copy also does the downscale (default max
 * 2560px longest edge — the preview fills the world container as a background,
 * so it must survive full-viewport display without blurring; on a typical
 * retina canvas this is at-or-near native) before encoding to webp (jpeg
 * fallback), keeping the upload reasonable (~300-800KB).
 *
 * DOM UI (editor shell, HUDs, NetworkingControls) can never appear in the
 * output — it isn't on the canvas.
 */

export interface ViewCaptureOptions {
	/** Longest-edge cap for the output image, px. Default 2560. */
	maxDim?: number;
	/** Encoder quality 0..1. Default 0.85 (webp) / 0.87 (jpeg fallback). */
	quality?: number;
}

interface PendingCapture {
	resolve: (blob: Blob) => void;
	reject: (err: Error) => void;
	promise: Promise<Blob>;
	maxDim: number;
	quality: number;
	timer: ReturnType<typeof setTimeout>;
}

let pending: PendingCapture | null = null;

/** True while a capture is queued/being serviced this frame. */
export function isViewCapturePending(): boolean {
	return pending !== null;
}

/**
 * Queue a capture; resolves with the encoded image on the next rendered frame.
 * Rejects after 5s if never serviced (no world mounted / tab hidden).
 * Concurrent callers share the in-flight capture.
 */
export function requestViewCapture(opts?: ViewCaptureOptions): Promise<Blob> {
	if (pending) return pending.promise;
	let resolve!: (blob: Blob) => void;
	let reject!: (err: Error) => void;
	const promise = new Promise<Blob>((res, rej) => { resolve = res; reject = rej; });
	const entry: PendingCapture = {
		resolve,
		reject,
		promise,
		maxDim: opts?.maxDim ?? 2560,
		quality: opts?.quality ?? 0.85,
		timer: setTimeout(() => {
			if (pending === entry) {
				pending = null;
				reject(new Error('View capture timed out — is the world rendering?'));
			}
		}, 5000),
	};
	pending = entry;
	return promise;
}

/** webp first (smaller), jpeg when the browser can't encode it (Safari). */
function encodeCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob((webp) => {
			if (webp && webp.type === 'image/webp') { resolve(webp); return; }
			canvas.toBlob((jpeg) => {
				if (jpeg) resolve(jpeg);
				else reject(new Error('Canvas image encoding failed'));
			}, 'image/jpeg', Math.min(1, quality + 0.02));
		}, 'image/webp', quality);
	});
}

/**
 * Called by FrameRateCap where it would normally render. When a capture is
 * pending: hide the avatar (+ any transform gizmo), render this frame through
 * the normal path, copy the canvas, restore visibility. Returns true when it
 * rendered (FrameRateCap must then skip its own draw for this tick).
 *
 * `renderFrame` is the caller's normal draw (postFx-or-plain), so the capture
 * matches exactly what the player sees.
 */
export function serviceViewCapture(
	gl: { domElement?: HTMLCanvasElement },
	scene: { getObjectByName: (n: string) => { visible: boolean } | undefined; traverse: (cb: (o: unknown) => void) => void },
	renderFrame: () => void,
): boolean {
	if (!pending) return false;
	const entry = pending;
	pending = null;
	clearTimeout(entry.timer);

	// Captured up-front so `finally` ALWAYS restores — a hidden avatar must
	// never outlive this function (same invariant as occluderDepth.ts).
	const hidden: { visible: boolean }[] = [];
	const hide = (o: { visible: boolean } | undefined | null): void => {
		if (o && o.visible) { o.visible = false; hidden.push(o); }
	};

	let rendered = false;
	try {
		hide(scene.getObjectByName('playerOne'));
		hide(scene.getObjectByName('playerOneSprite'));
		// Defensive: editor gizmo, if one is mounted for the current selection.
		scene.traverse((o) => {
			const obj = o as { isTransformControls?: boolean; visible?: boolean };
			if (obj.isTransformControls === true) hide(obj as { visible: boolean });
		});

		renderFrame();
		rendered = true;

		const src = gl.domElement;
		if (!src || !src.width || !src.height) throw new Error('Renderer canvas unavailable');

		// Same-tick copy + downscale (must happen before the frame presents).
		const scale = Math.min(1, entry.maxDim / Math.max(src.width, src.height));
		const out = document.createElement('canvas');
		out.width = Math.max(1, Math.round(src.width * scale));
		out.height = Math.max(1, Math.round(src.height * scale));
		const ctx = out.getContext('2d');
		if (!ctx) throw new Error('2D canvas unavailable');
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(src, 0, 0, out.width, out.height);

		// Encoding is async but operates on the 2D copy — safe after this frame.
		encodeCanvas(out, entry.quality).then(entry.resolve, entry.reject);
	} catch (e) {
		entry.reject(e instanceof Error ? e : new Error('View capture failed'));
	} finally {
		for (const o of hidden) o.visible = true;
	}
	return rendered;
}
