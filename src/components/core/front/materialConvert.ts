/**
 * Shared material-conversion helpers for GLB content.
 *
 * Extracted so both `ModelObject` and `RideableObject` use one implementation.
 * WebGPU needs Node materials; raw GLTF ships standard/shader materials that
 * crash inside `acquireProgram` under WebGPU (no vertex/fragment shader
 * strings). Under WebGL we leave the materials untouched.
 */
import * as THREE from 'three';
import {
	Material,
	MeshStandardMaterial,
	MeshPhysicalMaterial,
	MeshBasicMaterial,
	ShaderMaterial,
	RawShaderMaterial,
} from 'three';
import { MeshStandardNodeMaterial, MeshBasicNodeMaterial } from 'three/webgpu';

/**
 * Returns true when the current renderer is a WebGL (non-WebGPU) renderer.
 * WebGPURenderer does NOT expose `isWebGLRenderer`.
 */
export function isWebGLRenderer(gl: any): boolean {
	return gl && typeof gl.isWebGLRenderer !== 'undefined' && gl.isWebGLRenderer === true;
}

/**
 * Convert an incompatible material to a WebGPU-compatible NodeMaterial.
 * MUST NOT be called under a WebGL renderer.
 */
export function convertToWebGPUMaterial(material: Material): Material {
	if (material instanceof ShaderMaterial || material instanceof RawShaderMaterial) {
		const replacement = new MeshStandardNodeMaterial();
		replacement.color.copy((material as any).color || new THREE.Color(0xffffff));
		replacement.transparent = material.transparent;
		replacement.opacity = material.opacity;
		replacement.side = material.side;
		return replacement;
	}

	if (material instanceof MeshStandardMaterial || material instanceof MeshPhysicalMaterial) {
		const nodeMat = new MeshStandardNodeMaterial();
		nodeMat.color.copy(material.color);
		nodeMat.map = material.map;
		nodeMat.normalMap = material.normalMap;
		nodeMat.roughness = material.roughness;
		nodeMat.metalness = material.metalness;
		nodeMat.emissive.copy(material.emissive);
		nodeMat.emissiveMap = material.emissiveMap;
		nodeMat.transparent = material.transparent;
		nodeMat.opacity = material.opacity;
		nodeMat.side = material.side;
		return nodeMat;
	}

	if (material instanceof MeshBasicMaterial) {
		const nodeMat = new MeshBasicNodeMaterial();
		nodeMat.color.copy(material.color);
		nodeMat.map = material.map;
		nodeMat.transparent = material.transparent;
		nodeMat.opacity = material.opacity;
		nodeMat.side = material.side;
		return nodeMat;
	}

	return material;
}

/**
 * Walk a loaded GLTF scene: enable shadows and convert materials for WebGPU
 * (unless running under WebGL).
 */
export function prepareGltfScene(scene: THREE.Object3D, gl: any): void {
	const webgl = isWebGLRenderer(gl);
	scene.traverse((node: THREE.Object3D) => {
		const mesh = node as THREE.Mesh;
		if ((mesh as any).isMesh) {
			node.castShadow = true;
			node.receiveShadow = true;
			if (mesh.material && !webgl) {
				if (Array.isArray(mesh.material)) {
					mesh.material = mesh.material.map((m) => convertToWebGPUMaterial(m));
				} else {
					mesh.material = convertToWebGPUMaterial(mesh.material);
				}
			}
		}
	});
}
