import type { XRPublisherSettings } from '../types/types';
// These imports resolve to '/assets/defaults/<path>' URL strings at build
// time (asset-url-transformer in vite.config.ts) — the same seeded-asset
// location every other default (fonts, icons, Participants' FBX clips)
// already uses. The deployment serves the files; nothing is bundled and
// no external CDN is referenced.
import defaultEnvironment from './assets/default_grid.glb';
import defaultAvatarVRM from './avatars/xr_publisher_default_avatar.vrm';
import hmdIcon from './assets/hmdicon.png';

export const defaultSettings: XRPublisherSettings = {
  // Root for runtime-asset path building (Player's animation FBX table).
  // '/assets/defaults/' is where the seeded assets land, so the default
  // resolves against the serving origin like every other default asset.
  threeObjectPlugin: '/assets/defaults/',
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