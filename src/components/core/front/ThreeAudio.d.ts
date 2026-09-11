
import { Object3D } from 'three';

// Audio Component
export interface ThreeAudioConfig {
    audioUrl: string;
    positional: string;
    loop: string;
    volume: number;
    autoPlay: string;
    /**
     * Set to "1" to force the Apple APAC spatial audio parsing path.
     * When the audioUrl ends in ".mp4" this is detected automatically.
     */
    isSpatial?: string;
    /**
     * Optional explicit URL for the sidecar .spatial.json metadata file.
     * When omitted the parser derives it from the audioUrl by replacing
     * the .mp4 extension with .spatial.json.
     */
    spatialMetaUrl?: string;
    // Trigger location properties (cuboid)
    triggerLocationX?: number;  // 0 = disabled, >0 = trigger width
    triggerLocationY?: number;  // 0 = disabled, >0 = trigger height
    triggerLocationZ?: number;  // 0 = disabled, >0 = trigger depth
    triggerLocationPosX?: number;  // X offset from audio object
    triggerLocationPosY?: number;  // Y offset from audio object
    triggerLocationPosZ?: number;  // Z offset from audio object
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