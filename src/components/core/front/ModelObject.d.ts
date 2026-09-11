import { ScalableProps } from '../../../types/three-components';

// Instance data for instanced models
export interface InstanceData {
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    // Lazily-cached per-instance jitter offsets (assigned on first matrix
    // build to break z-fighting between coplanar instances).
    _offsetX?: number;
    _offsetY?: number;
    _offsetZ?: number;
}

// Model Component
export interface ModelProps extends ScalableProps {
    url: string;
    animations?: string;
    collidable?: string;
    threeObjectPluginRoot?: string;
    defaultFont: string;
    textColor?: string;
    alt?: string;
    instanced?: boolean;
    instanceCount?: number;
    instances?: InstanceData[];
    proximityLoad?: boolean;
    triggerLocationX?: number;
    triggerLocationY?: number;
    triggerLocationZ?: number;
    triggerLocationPosX?: number;
    triggerLocationPosY?: number;
    triggerLocationPosZ?: number;
}

declare const  ModelObject: React.FC<ModelProps>;
export { ModelObject };
