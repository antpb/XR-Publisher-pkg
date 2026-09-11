import { BaseThreeProps } from '@/types/three-components';
// Light Component
export interface ThreeLightProps extends BaseThreeProps {
    type: 'directional' | 'ambient' | 'point' | 'spot';
    color: string | number;
    intensity: number;
    distance?: number;
    decay?: number;
    angle?: number;
    penumbra?: number;
    castShadow?: boolean;
    shadowMapSize?: number;
    shadowRadius?: number;
    shadowBlurSamples?: number;
    shadowBias?: number;
    shadowNormalBias?: number;
    shadowCameraFar?: number;
    shadowCameraNear?: number;
    shadowCameraLeft?: number;
    shadowCameraRight?: number;
    shadowCameraTop?: number;
    shadowCameraBottom?: number;
}

declare const  ThreeLight: React.FC<ThreeLightProps>;
export { ThreeLight };
