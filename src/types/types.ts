import { Props } from '@react-three/fiber';
// import { ThreeObjectFrontProps } from './three-object-types';
// import { MutableRefObject } from 'react';
// import { OrbitControlsRef } from './three-object-types';

export interface XRPublisherSettings {
	threeObjectPlugin: string;
	defaultAvatarAnimation: string;
	defaultAvatar: string;
	defaultEnvironment: string;
	userData: UserData;
	hmdIcon: string;
	backgroundColor: string;
	postSlug: string;
	multiplayerWorker: string;
	turnServerKey: string;
	multiplayerAccess: 'loggedIn' | 'public';
	defaultZoom: number;
	defaultScale: number;
	defaultHasZoom: boolean;
	defaultHasTip: boolean;
	camCollisions: boolean;
	enableAI: boolean;
	enableNetworking: boolean;
	enableVoiceChat: boolean;
	networkingConfig?: {
		maxParticipants: number;
		roomId: string;
		iceServers?: RTCIceServer[];
		reconnectInterval?: number;
		peerTimeout?: number;
	  };	
}

export interface XRPublisherOptions {
	threeObjectPlugin: string;
	defaultAvatarAnimation: string;
	userData: UserData;
	postSlug?: string;
	hmdIcon?: string;
}  

export interface ComponentScanResult {
	networkingBlock: HTMLElement[];
	modelsToAdd: HTMLElement[];
	portalsToAdd: HTMLElement[];
	imagesToAdd: HTMLElement[];
	videosToAdd: HTMLElement[];
	audiosToAdd: HTMLElement[];
	lightsToAdd: HTMLElement[];
	textToAdd: HTMLElement[];
	npcsToAdd: HTMLElement[];
	sky: HTMLElement;
}

export interface EnvironmentAttributes {
	threeUrl: string;
	deviceTarget: string;
	backgroundColor: string;
	zoom: number;
	scale: number;
	hasZoom: string;
	hasTip: string;
	positionY: number;
	rotationY: number;
	animations: string;
	camCollisions: boolean;
	threePreviewImage: string;
	hdr: string;
}

export interface EnvironmentFrontProps {
	userData: {
	  inWorldName: string;
	  playerVRM: string;
	  profileImage: string;
	  nonce: string;
	};
	threeUrl: string;
	previewImage: string;
	backgroundColor: string;
	deviceTarget: string;
	networkingBlock: NetworkingBlockAttributes[];
	spawnPoint: any;
	positionY: number;
	positionX?: number;
	positionZ?: number;
	rotationY: number;
	scale: number;
	zoom: number;
	hasZoom: string;
	hasTip: string;
	animations: string;
	hdr: string;
	camCollisions: boolean;
	sky: string;
	audiosToAdd: CustomElement[];
	videosToAdd: CustomElement[];
	imagesToAdd: CustomElement[];
	lightsToAdd: CustomElement[];
	textToAdd: CustomElement[];
	npcsToAdd: CustomElement[];
	modelsToAdd: CustomElement[];
	portalsToAdd: CustomElement[];
	threePreviewImage: string;
	threeObjectPluginRoot: string;
	postSlug: string;
	defaultAvatarAnimation: string;
  }  

export interface ObjectProps {
	threeUrl: string;
	deviceTarget: '2d' | 'vr' | 'ar';
	backgroundColor: string;
	zoom: number;
	scale: number;
	hasZoom: string;
	hasTip: string;
	positionY: number;
	positionX: number;
	positionZ: number;
	rotationY: number;
	animations: string;
	threeObjectPlugin: string;
	defaultAvatarAnimation: string;
}


export interface ObjectAttributes {
	threeUrl: string;
	deviceTarget: string;
	backgroundColor: string;
	zoom: number;
	scale: number;
	hasZoom: string;
	hasTip: string;
	positionY: number;
	positionX: number;
	positionZ: number;
	rotationY: number;
	animations: string;
}

export interface SavedObjectProps {
	url: string;
	positionY: number;
	positionX?: number;
	positionZ?: number;
	rotationY: number;
	scale: number;
	setSpawnPoints: (points: any[]) => void;
	label?: string;
	playerData?: any;
	color?: string;
	hasZoom?: string;
	hasTip?: string;
	animations?: string;
	deviceTarget?: '2d' | 'vr' | 'ar';
  }
  

// Floor props with proper mesh type
export interface FloorProps {
	rotation?: [number, number, number];
	position?: [number, number, number];
	// Add any other mesh-specific props you need
}


export interface CanvasProps extends Props {
	shadowMap?: boolean;
}

export interface CommonCanvasProps {
	camera: {
		fov: number;
		zoom: number;
		position: [number, number, number];
	};
	style: {
		backgroundColor: string;
		margin: string;
		height: string;
		width: string;
	};
}

export interface NetworkingBlockAttributes {
	'participant-limit': {
	  value: number;
	};
	[key: string]: any;
  }
  
  export interface CustomElement extends HTMLElement {
	getAttribute(name: string): string | null;
	[key: string]: any;
  }
  
  export interface P2PCFPeer {
	id: string;
	client_id: string;
  }
  
  export interface P2PCFInstance {
	on(event: string, callback: (peer: P2PCFPeer, data: ArrayBuffer) => void): void;
	send(data: ArrayBuffer): void;
	close(): void;
  }
  
  export interface UserData {
	inWorldName: string;
	playerVRM: string;
	profileImage: string;
	nonce?: string;
	userId?: string;
	clientId?: string;
	isNetworkingEnabled?: boolean;
	voiceChatEnabled?: boolean;
	[key: string]: any;
  }

  
  export type {
	ThreeImageProps,
	ThreeAudioConfig,
	ThreeAudioProps,
	ThreeLightProps,
	ModelProps,
	NPCProps,
	ThreeVideoProps,
	PortalProps,
	ThreeSkyProps,
	TextObjectProps,
	ParticipantMovement,
	ParticipantData,
	VRMHumanoid,
	VRMData,
	ParticipantRefs,
	ParticipantProps,
	ParticipantsProps,
	ParticipantStore,
  } from './three-components.d';
  
  export {
	ThreeImage,
	ThreeAudio,
	ThreeLight,
	ModelObject,
	NPCObject,
	ThreeVideo,
	PortalObject,
	ThreeSky,
	TextObject,
	isCustomElement,
	TeleportIndicator,
	ClickIndicatorObject,
	Button,
	Menu,
  } from './three-components.d';

export type SpawnPoint = [number, number, number] | null;

