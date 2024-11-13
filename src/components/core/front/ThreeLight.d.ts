// Light Component
export interface ThreeLightProps extends BaseThreeProps {
    type: 'directional' | 'ambient' | 'point' | 'spot';
    color: string | number;
    intensity: number;
    distance?: number;
    decay?: number;
    angle?: number;
    penumbra?: number;
}

declare const  ThreeLight: React.FC<ThreeLightProps>;
export { ThreeLight };
