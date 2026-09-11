import { CanvasProps as R3FCanvasProps } from '@react-three/fiber';
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
	defaultAvatar: string;
	multiplayerWorker: string;
	userData: UserData;
	postSlug?: string;
	hmdIcon?: string;
	containedMode?: boolean;
	/** Publishing-API origin (world registry, NPC/character endpoints,
	 *  editor tokens, world state). When omitted, resolution falls back to
	 *  `window.XRP_API_BASE` → localStorage `xr_publisher_edge_api_url` →
	 *  same origin (published worlds are served by the API worker, so they
	 *  need no configuration). */
	apiBase?: string;
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
	rideablesToAdd: HTMLElement[];
	sky: HTMLElement;
	terrainToAdd: HTMLElement[];
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
	/** Scanner-collected <three-sky-block> elements (or '' when none). */
	sky: string | HTMLElement[];
	audiosToAdd: CustomElement[];
	videosToAdd: CustomElement[];
	imagesToAdd: CustomElement[];
	lightsToAdd: CustomElement[];
	textToAdd: CustomElement[];
	npcsToAdd: CustomElement[];
	rideablesToAdd: CustomElement[];
	modelsToAdd: CustomElement[];
	portalsToAdd: CustomElement[];
	terrainToAdd: CustomElement[];
	/** Plugin custom blocks (non-built-in three-*-block elements), captured
	 *  unconditionally at scan time; types resolve lazily via the registry. */
	customBlocksToAdd?: Array<{ tag: string; el: CustomElement; index: number }>;
	threePreviewImage: string;
	threeObjectPluginRoot: string;
	postSlug: string;
	defaultAvatarAnimation: string;
	containedMode?: boolean;
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


export interface CanvasProps extends R3FCanvasProps {
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
	isCustomElement,
	TeleportIndicator,
	ClickIndicatorObject,
	Button,
	Menu,
  } from './three-components.d';

export type SpawnPoint = [number, number, number] | null;

