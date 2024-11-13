export interface XRPublisherOptions {
	threeObjectPlugin: string;
	defaultAvatarAnimation: string;
	userData: {
	  inWorldName: string;
	  playerVRM: string;
	  profileImage: string;
	  [key: string]: any;
	};
	postSlug?: string;
	hmdIcon?: string;
	xrButtonStyle?: React.CSSProperties;
	hmdIconStyle?: React.CSSProperties;
  }
  
  export interface ComponentAttributes {
	threeUrl?: string;
	deviceTarget?: string;
	backgroundColor?: string;
	zoom?: number;
	scale?: number;
	hasZoom?: boolean;
	hasTip?: string;
	positionY?: number;
	positionX?: number;
	positionZ?: number;
	rotationY?: number;
	animations?: string;
	camCollisions?: boolean;
	threePreviewImage?: string;
	hdr?: string;
  }
  
  export interface ComponentTypes {
	environments: HTMLElement[];
	objects: HTMLElement[];
	networking: HTMLElement[];
	models: HTMLElement[];
	portals: HTMLElement[];
	images: HTMLElement[];
	videos: HTMLElement[];
	audios: HTMLElement[];
	lights: HTMLElement[];
	text: HTMLElement[];
	npcs: HTMLElement[];
	sky: HTMLElement[];
	spawnPoints: HTMLElement[];
  }