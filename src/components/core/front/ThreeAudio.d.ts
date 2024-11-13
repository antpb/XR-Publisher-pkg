
import { Object3D } from 'three';

// Audio Component
export interface ThreeAudioConfig {
    audioUrl: string;
    positional: string;
    loop: string;
    volume: number;
    autoPlay: string;
    refDistance?: number;
    maxDistance?: number;
    rolloffFactor?: number;
    coneInnerAngle?: number;
    coneOuterAngle?: number;
    coneOuterGain?: number;
    distanceModel?: string;
    positionX?: number;
    positionY?: number;
    positionZ?: number;
    rotationX?: number;
    rotationY?: number;
    rotationZ?: number;
}

export interface ThreeAudioProps {
    threeAudio: ThreeAudioConfig;
    onLoad: (audio: Object3D) => void;
}

declare const  ThreeAudio: React.FC<ThreeAudioProps>;
export default ThreeAudio;