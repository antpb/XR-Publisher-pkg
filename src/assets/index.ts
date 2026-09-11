// Re-exports of the seeded default assets (src/defaults/ imports resolve to
// '/assets/defaults/<path>' URL strings at build time). No binaries live in
// this directory — the defaults tree is the single source of truth.
export { default as defaultEnvironment } from '../defaults/assets/default_grid.glb';
export { default as defaultAvatarVRM } from '../defaults/avatars/xr_publisher_default_avatar.vrm';
export { default as hmdIcon } from '../defaults/assets/hmdicon.png';
