// three-object-types.ts
import { Props } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMCVRM } from '@pixiv/types-vrmc-vrm-1.0';
import React from 'react';

// Define OrbitControls interface to match your needs
export interface OrbitControlsRef {
	target: Vector3;
	maxPolarAngle: number;
	minPolarAngle: number;
}

export interface BaseObjectProps {
	deviceTarget: '2d' | 'vr' | 'ar';
	backgroundColor: string;
	zoom: number;
	positionY: number;
	positionX?: number;
	positionZ?: number;
	rotationY: number;
	scale: number;
	hasZoom: string;
	hasTip: string;
	animations?: string;
	defaultAvatarAnimation?: string;
	threeObjectPlugin?: any;
}

export interface ThreeObjectFrontProps extends BaseObjectProps {
	threeUrl: string;
}

export interface SavedObjectProps extends BaseObjectProps {
	url: string;
	color: string;
	orbitRef?: React.RefObject<any>; // Changed this line
	deviceTarget: '2d' | 'vr' | 'ar';
	backgroundColor: string;
	zoom: number;
}

export interface GLTFWithVRM extends GLTF {
	userData: {
		vrm?: VRM;
		gltfExtensions?: {
			VRM?: VRMCVRM;
		};
	};
}

export interface CanvasComponentProps extends Props {
	camera?: {
		fov: number;
		zoom: number;
		position: [number, number, number];
	};
	resize?: {
		scroll: boolean;
		debounce: {
			scroll: number;
			resize: number;
		};
	};
	shadowMap?: boolean;
	style?: React.CSSProperties;
	children: React.ReactNode; // This line is causing the issue
}

export interface FloorProps {
	rotation?: [number, number, number];
	position?: [number, number, number];
}

// export type OrbitControlsComponent = typeof DreiOrbitControls;
