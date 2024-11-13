import { Object3D } from 'three';
import { ScalableProps } from '../../../types/three-components';
// Portal Component
export interface PortalProps extends ScalableProps {
    url?: string;
    object?: Object3D;
    destinationUrl: string;
    label?: string;
    labelOffsetX?: number;
    labelOffsetY?: number;
    labelOffsetZ?: number;
    labelTextColor?: string;
    animations?: string;
    threeObjectPluginRoot: string;
    defaultFont: string;
}

declare const PortalObject: React.FC<PortalProps>;
export default PortalObject;