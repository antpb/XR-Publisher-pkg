import { Object3D } from 'three';
import { ScalableProps } from '../../../types/three-components.d';
// Video Component
export interface ThreeVideoProps extends ScalableProps {
    url: string;
    aspectWidth: number;
    aspectHeight: number;
    threeObjectPluginRoot: string;
    autoPlay?: string;
    modelUrl?: string;
    customModel?: string;
    videoControlsEnabled?: boolean;
    onLoad?: (video: Object3D) => void;
}

declare const  ThreeVideo: React.FC<ThreeVideoProps>;
export { ThreeVideo };

