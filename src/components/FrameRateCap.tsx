import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { renderPostFx } from './core/front/postFx';
import { renderOccluderDepth } from './core/front/occluderDepth';
import { serviceViewCapture } from './core/front/captureView';

/**
 * Caps the RENDER rate and throttles harder when the world is idle.
 *
 * On ProMotion / 120Hz displays, requestAnimationFrame runs at 120 and the
 * whole pipeline — node updates, shadow passes, Dawn/WebGPU command
 * processing, the GPU render itself — runs twice as hot for no perceptible
 * gain in a third-person world. Traces on an M3 Max showed the world at
 * 121Hz with the GPU process CPU fully saturated (~8ms of Dawn command
 * work per frame); skipping every other render halves all of it.
 *
 * Two tiers (idle trace on an M3 Max: GPU process ~67% of a core while just
 * STANDING in a town — water waves, grass wind, sky, shadows all re-render
 * every frame):
 *  - ACTIVE (camera moving): render at `fps` (default 60).
 *  - IDLE  (camera still ~0.5s): render at `idleFps` (default 30). All ambient
 *    TSL animation (water/grass/clouds) advances off the renderer's `time`
 *    node, which only ticks when gl.render runs — so halving the render rate
 *    halves that GPU work automatically (this IS the ambient-animation
 *    throttle). Any camera motion resumes full rate on the next frame.
 *  - HIDDEN (tab backgrounded): skip rendering entirely.
 *
 * `window.__xrIdle` is published each frame so other systems can drop their
 * own per-frame work when idle (e.g. ProceduralSky skips shadow re-renders
 * and cloud drift).
 *
 * Mechanism: registering a useFrame with renderPriority > 0 tells R3F to
 * SKIP its own gl.render — we render manually at the target cadence.
 * (`frameloop="demand"` + paced invalidate() does NOT cap a live world — a
 * follow-up trace showed R3F still rendering at 119/s because other sources
 * re-invalidate every frame. Taking over the render call skips unconditionally.)
 *
 * useFrame logic (ecctrl, interpolation, sky) still runs at native rAF rate.
 * XR sessions render every frame (headsets own their rate).
 *
 * `fps <= 0` disables the active cap (`?fps=native`); idle throttle still
 * applies unless `idleFps <= 0` too.
 */
// `?renderstats` — log per-frame GPU command volume once per second so Dawn
// command-CPU heat can be attributed on-device (draw calls, triangles, render
// passes). Reads gl.info AFTER a render, before the next info.reset().
const renderStatsEnabled = typeof window !== 'undefined'
	&& new URLSearchParams(window.location.search).has('renderstats');

export function FrameRateCap({ fps, idleFps = 30 }: { fps: number; idleFps?: number }): null {
	const lastRender = useRef(0);
	const lastCamPos = useRef(new Vector3(NaN, NaN, NaN));
	const lastCamQuat = useRef(new Quaternion());
	const lastMoveTime = useRef(0);
	const lastStatsLog = useRef(0);
	useThree();

	useFrame((state) => {
		const gl = state.gl as any;
		const presenting = !!gl?.xr?.isPresenting;

		// XR drives its own cadence — never skip while presenting.
		if (presenting) {
			gl.render(state.scene, state.camera);
			return;
		}

		// three's WebGPURenderer starts an internal self-rescheduling rAF loop
		// at init() (Animation class: info.reset() + nodeFrame.update() at
		// native display rate, forever — ~2% of a core at 120Hz in traces).
		// R3F owns the frame loop, so we stop it and tick nodeFrame ourselves
		// once per RENDERED frame below. CRITICAL: render() does NOT advance
		// nodeFrame (only compileAsync does) — the Animation loop was the ONLY
		// per-frame tick. Stopping it without the manual tick freezes
		// nodeFrame.frameId, and everything frameId-gated stops updating:
		// VRM bone-matrix uploads (avatars freeze in place mid-pose), TSL
		// `time` (grass wind, water, sky). Only XR needs the internal loop
		// (it carries the XRSession rAF) — sessionstart restarts it, and this
		// check re-stops it after sessionend. WebGL has no _animation: no-op.
		const anim = gl._animation;
		if (anim && anim._requestId !== null) {
			anim.stop();
		}

		const now = performance.now();

		// Tab hidden → don't render at all (ambient animation can wait).
		if (typeof document !== 'undefined' && document.hidden) {
			(window as any).__xrIdle = true;
			return;
		}

		// Idle detection: has the camera moved/rotated since last frame?
		const cam = state.camera;
		const moved = !(Math.abs(cam.position.x - lastCamPos.current.x) < 0.002
			&& Math.abs(cam.position.y - lastCamPos.current.y) < 0.002
			&& Math.abs(cam.position.z - lastCamPos.current.z) < 0.002
			&& Math.abs(cam.quaternion.x - lastCamQuat.current.x) < 0.0005
			&& Math.abs(cam.quaternion.y - lastCamQuat.current.y) < 0.0005
			&& Math.abs(cam.quaternion.z - lastCamQuat.current.z) < 0.0005
			&& Math.abs(cam.quaternion.w - lastCamQuat.current.w) < 0.0005);
		if (moved) lastMoveTime.current = now;
		lastCamPos.current.copy(cam.position);
		lastCamQuat.current.copy(cam.quaternion);

		// Idle after ~0.5s of stillness (grace so micro-pauses don't flap
		// 60↔30). Resume to active instantly on motion.
		const idle = now - lastMoveTime.current > 500;
		(window as any).__xrIdle = idle;

		const target = idle ? idleFps : fps;
		if (target > 0) {
			const interval = 1000 / target;
			// -2ms tolerance so a 60fps target renders on every tick of a 60Hz
			// display (16.7ms deltas) instead of skipping to 30.
			if (now - lastRender.current < interval - 2) return;
			lastRender.current = now;
		}
		// Manual nodeFrame tick — the replacement for the stopped internal
		// Animation loop (see above). Runs once per rendered frame, before any
		// render pass. NodeFrame.update() measures wall-clock deltas, so TSL
		// `time` stays real-time regardless of render cadence. info.reset()
		// mirrors what the internal loop did (info.render.calls is used as a
		// per-frame dedupe id by the attribute/cache-key paths).
		const nodes = gl._nodes;
		if (anim && nodes) {
			if (gl.info.autoReset === true) gl.info.reset();
			nodes.nodeFrame.update();
			gl.info.frame = nodes.nodeFrame.frameId;
		}
		// Selective lighting occlusion: render the occluder-depth pass BEFORE the
		// main render so light materials can sample it this frame. No-op unless a
		// plugin enabled it.
		renderOccluderDepth(gl, state.scene, state.camera);
		// When a song experience is active (WebGPU path), render through the
		// selective-bloom post-processing pipeline instead. Returns false when
		// inactive or on the WebGL renderer, falling back to gl.render.
		const renderFrame = (): void => {
			if (!renderPostFx(gl, state.scene, state.camera)) {
				gl.render(state.scene, state.camera);
			}
		};
		// A pending editor screenshot ("Use current view") becomes this tick's
		// render — avatar hidden, canvas copied, visibility restored inside.
		if (!serviceViewCapture(gl, state.scene, renderFrame)) {
			renderFrame();
		}
		if (renderStatsEnabled && now - lastStatsLog.current > 1000) {
			lastStatsLog.current = now;
			const info = gl.info;
			if (info && info.render) {
				console.log(
					`[renderstats] draws=${info.render.drawCalls} passes=${info.render.calls}` +
					` tris=${info.render.triangles} idle=${idle}`,
				);
			}
		}
	}, 1);

	return null;
}
