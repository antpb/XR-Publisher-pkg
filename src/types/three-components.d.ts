import { Object3D, AnimationMixer, AnimationClip, Group, Quaternion, Euler } from 'three';
import { UserData } from './types';

export interface BaseThreeProps {
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
}
export interface ScalableProps extends BaseThreeProps {
    scaleX: number;
    scaleY: number;
    scaleZ: number;
}

// Movement and Animation Types
export interface ParticipantMovement {
    action: 'jumping' | 'walking' | 'running' | 'idle' | 'jumpStop';
}

export interface ParticipantData {
    position: [number, number, number];
    rotation: [number, number, number];
    timestamp: number;
    isMoving: ParticipantMovement;
    inWorldName?: string;
}

// VRM Related Types
export interface VRMHumanoid {
    getNormalizedBoneNode: (name: string) => THREE.Object3D | null;
}

export interface VRMData {
    scene: THREE.Group;
    meta?: {
        metaVersion: string;
    };
    userData: {
        vrm: {
            humanoid?: VRMHumanoid;
            scene: THREE.Group;
            meta?: {
                metaVersion: string;
            };
        };
        gltfExtensions?: {
            VRM: any;
        };
    };
}

// Participant Types
export interface ParticipantRefs {
    animationMixerRef: React.MutableRefObject<Record<string, AnimationMixer>>;
    vrmsRef: React.MutableRefObject<Record<string, VRM>>;
    animationsRef: React.MutableRefObject<Record<string, AnimationClip[]>>;
    mixers: React.MutableRefObject<Record<string, AnimationMixer>>;
    profileUserData: React.MutableRefObject<Record<string, any>>;
}

export interface ParticipantProps extends ParticipantRefs {
    playerName: string;
    p2pcf: any;
    playerVRM: string;
    inWorldName: string;
    profileImage: string;
    pfp?: string;
}

export interface ParticipantsProps {
    networkingEnabled?: boolean;
    maxParticipants?: number;
    userData?: UserData;
}

export interface ParticipantStore {
    participants: [string, string, string, string][]; // [playerId, vrmUrl, name, profileImage]
    addParticipant: (participant: [string, string, string, string]) => void;
    removeParticipant: (participantId: string) => void;
}


// Type guard for custom elements
export function isCustomElement(element: unknown): element is CustomElement {
    return element !== null && 
           typeof element === 'object' && 
           'tagName' in element && 
           'getAttribute' in element && 
           'hasAttribute' in element;
}

export function TeleportIndicator(props: any): JSX.Element;
export function ClickIndicatorObject(props: any): JSX.Element;
export function Button(props: { onClick: () => void; position: [number, number, number]; color: string; hoverColor: string }): JSX.Element;
export function Menu(): JSX.Element;

export default function TeleportTravel(props: TeleportTravelProps): JSX.Element;