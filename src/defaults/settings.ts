import type { XRPublisherSettings } from '../types/types';
import defaultEnvironment from './assets/default_grid.glb';
import defaultAvatarVRM from './avatars/xr_publisher_default_avatar.vrm';
import hmdIcon from './assets/hmdicon.png';

export const defaultSettings: XRPublisherSettings = {
  threeObjectPlugin: '/assets/',
  defaultAvatarAnimation: '',
  defaultAvatar: defaultAvatarVRM,
  defaultEnvironment: defaultEnvironment,
  userData: {
    inWorldName: 'Guest',
    playerVRM: defaultAvatarVRM,
    profileImage: '',
    nonce: '',
    currentPostId: '',
    heartbeatEnabled: false,
  },
  hmdIcon: hmdIcon,
  backgroundColor: '#ffffff',
  postSlug: '',
  multiplayerWorker: '',
  turnServerKey: '',
  multiplayerAccess: 'loggedIn',
  defaultZoom: 90,
  defaultScale: 1,
  defaultHasZoom: false,
  defaultHasTip: true,
  camCollisions: true,
  enableAI: false,
  enableNetworking: false,
  enableVoiceChat: false
};