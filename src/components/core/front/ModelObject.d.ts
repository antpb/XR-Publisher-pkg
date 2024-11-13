import { ScalableProps } from '../../../types/three-components';
// Model Component
export interface ModelProps extends ScalableProps {
    url: string;
    animations?: string;
    collidable?: string;
    threeObjectPluginRoot: string;
    defaultFont: string;
    textColor?: string;
    alt?: string;
}

declare const  ModelObject: React.FC<ModelProps>;
export { ModelObject };
