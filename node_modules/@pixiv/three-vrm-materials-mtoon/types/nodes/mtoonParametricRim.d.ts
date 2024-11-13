import * as THREE from 'three/webgpu';
export declare const mtoonParametricRim: (args: THREE.ProxiedObject<{
    parametricRimLift: THREE.NodeRepresentation;
    parametricRimFresnelPower: THREE.NodeRepresentation;
    parametricRimColor: THREE.NodeRepresentation;
}>) => THREE.ShaderNodeObject<import("three/src/nodes/math/OperatorNode.js").default>;
