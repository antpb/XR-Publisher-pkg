import { FC } from 'react';

interface EnvironmentFrontProps {
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
	hasZoom: string;
	hasTip: string;
	animations: string;
	hdr: string;
	camCollisions: boolean;
	sky: '';
	audiosToAdd: CustomElement[];
	videosToAdd: CustomElement[];
	imagesToAdd: CustomElement[];
	lightsToAdd: CustomElement[];
	textToAdd: CustomElement[];
	npcsToAdd: CustomElement[];
	modelsToAdd: CustomElement[];
	portalsToAdd: CustomElement[];
  }
  
  
declare const EnvironmentFront: FC<EnvironmentFrontProps>;
export default EnvironmentFront;