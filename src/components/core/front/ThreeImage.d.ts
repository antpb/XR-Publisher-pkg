import { ScalableProps } from '../../../types/three-components';
export interface ThreeImageProps extends ScalableProps {
    url: string;
    aspectWidth: number;
    aspectHeight: number;
    transparent?: string;
}

declare const  ThreeImage: React.FC<ThreeImageProps>;
export { ThreeImage };
