import { MutableRefObject } from 'react';
import { VRM } from '@pixiv/three-vrm';
import type {
	OrbitControlsRef,
} from '../types/three-object-types';

export interface SavedObjectProps {
  url: string;
  scale: number;
  positionX?: number;
  positionY: number;
  positionZ?: number;
  rotationY: number;
  orbitRef?: MutableRefObject<OrbitControlsRef | undefined>;
  color?: string;
  hasZoom?: boolean;
  hasTip?: string;
  animations?: string;
  defaultAvatarAnimation?: string;
  threeObjectPlugin?: string;
  deviceTarget: '2d' | 'vr' | 'ar';
  backgroundColor: string;
  zoom: number;
}

export interface ThreeObjectFrontProps {
  threeUrl: string;
  deviceTarget: '2d' | 'vr' | 'ar';
  zoom: number;
  scale: number;
  backgroundColor: string;
  hasZoom: string;
  hasTip: string;
  positionX?: number;
  positionY: number;
  positionZ?: number;
  rotationY: number;
  animations?: string;
  threeObjectPlugin?: string;
  defaultAvatarAnimation?: string;
}

export interface LoadMixamoAnimationParams {
  url: string;
  vrm: VRM;
  positionY: number;
  positionX: number;
  positionZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotationW: number;
}

export interface ThreeObjectEnvironmentConfig {
  openbrushEnabled?: boolean;
  openbrushDirectory?: string;
  threeObjectPluginRoot?: string;
}

  