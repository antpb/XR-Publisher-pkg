// types/global.d.ts
import * as THREE from 'three';
import type { P2PCFInstance } from './p2pcf/types';
import type { UserData } from './types';

declare global {
	const threeObjectPluginRoot: string;
	interface Window {
	  // Scene/Camera
	  scene: THREE.Scene;
	  camera: THREE.Camera;
	  visualViewport: VisualViewport;
  
	  // Network/Multiplayer
	  p2pcf?: P2PCFInstance;
	  participants: Record<string, string>;
	  localStream: MediaStream | null;
	  multiplayerWorker: string;
  
	  // User/Environment Settings
	  userData: {
		playerVRM?: string;
		inWorldName?: string;
		profileImage?: string;
		nonce?: string;
		userId?: string;
		clientId?: string;
		isNetworkingEnabled?: boolean;
		voiceChatEnabled?: boolean;
		[key: string]: any;
	  };
  
	  // Plugin/Environment Configuration
	  threeObjectPlugin: string;
	  threeObjectPluginRoot: string;
	  defaultAvatar: string;
	  defaultPlayerAvatar: string;
	  defaultAvatarAnimation: string;
	  openbrushEnabled: boolean;
	  openbrushDirectory: string;
	}
  }
// Type guard for CustomElement
function isCustomElement(element: any): element is CustomElement {
	return (
		element instanceof HTMLElement &&
		typeof element.tagName === 'string' &&
		typeof element.getAttribute === 'function' &&
		typeof element.hasAttribute === 'function'
	);
}
// Common Element Types
export interface CustomElement extends HTMLElement {
  tagName: string;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
}

// Networking Types
export interface NetworkingBlockAttributes {
  attributes: {
    customAvatars?: {
      value: string;
    };
    participantLimit: {
      value: number;
    };
  };
  [key: string]: any;
}