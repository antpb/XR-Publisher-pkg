import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { MToonMaterialLoaderPlugin } from "@pixiv/three-vrm-materials-mtoon";
import { MToonNodeMaterial } from "@pixiv/three-vrm-materials-mtoon/nodes";
import type { GLTFParser } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * VRM loader plugin with the MToon material matched to the ACTIVE renderer.
 *
 * MToonNodeMaterial is WebGPU-only: it has no GLSL vertex/fragment source,
 * so if a VRM carrying it is ever drawn by WebGLRenderer, three throws
 * `undefined is not an object (evaluating 'source.replace')` inside
 * acquireProgram — and an exception mid-render ABORTS the rest of that
 * frame's draw list, so everything sorted after the broken avatar (sky,
 * water, the whole transparent pass) silently vanishes. That was the
 * mobile-Safari "only terrain and trees render" bug: most call sites left
 * `useWebGL` at its old `false` default and always got the node material.
 *
 * The renderer kind is now resolved automatically from `__xrWebGPU`
 * (set by EnvironmentFront's renderer factory before any world content
 * mounts). Pass `useWebGL` explicitly only to override.
 */
export function createVRMLoaderPlugin(parser: GLTFParser, useWebGL?: boolean) {
	const webgl = useWebGL ?? (
		typeof window !== 'undefined'
		&& (window as { __xrWebGPU?: boolean }).__xrWebGPU === false
	);
	if (webgl) {
		return new VRMLoaderPlugin(parser);
	}

	const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser, {
		materialType: MToonNodeMaterial,
	});
	return new VRMLoaderPlugin(parser, { mtoonMaterialPlugin });
}

export function registerVRMLoader(loader: { register: (callback: (parser: GLTFParser) => any) => void }, useWebGL?: boolean) {
	loader.register((parser: GLTFParser) => createVRMLoaderPlugin(parser, useWebGL));
}
