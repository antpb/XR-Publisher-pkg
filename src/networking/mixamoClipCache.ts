/**
 * mixamoClipCache — session-wide caches for remote-avatar animations.
 *
 * Previously EVERY peer join fetched + parsed + retargeted all 6 Mixamo
 * animation files (and leaked the 6 parsed FBX scenes). Two cache layers
 * fix the cost:
 *
 *  1. `fetchAnimBytes` — each animation URL is fetched ONCE per session.
 *  2. `getRetargetedClip` — the retarget result is cached per
 *     (animUrl, vrmUrl) pair. Retargeted track names use the VRM's
 *     normalized-humanoid node names, which are identical across
 *     independently parsed instances of the SAME .vrm file — so every
 *     peer using the default avatar shares one set of clips, and
 *     `AnimationMixer.clipAction` binds them per-root by name.
 *
 * The retarget MUTATES the parsed source clip's track values in place,
 * which is why the source is re-parsed from cached bytes per (anim, vrm)
 * pair instead of sharing one parsed FBX. The parsed source scene is
 * disposed after the clip is extracted (it carries skinned meshes we
 * never render — Player.jsx already did this; Participants leaked them).
 */
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getMixamoRig } from '../utils/rigMap';

const mixamoVRMRigMap = getMixamoRig();

const bytesCache = new Map<string, Promise<ArrayBuffer>>();
const clipCache = new Map<string, Promise<THREE.AnimationClip>>();

function fetchAnimBytes(url: string): Promise<ArrayBuffer> {
  let p = bytesCache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
      return r.arrayBuffer();
    });
    p.catch(() => bytesCache.delete(url)); // allow retry on failure
    bytesCache.set(url, p);
  }
  return p;
}

function parseAnimResource(url: string, bytes: ArrayBuffer): Promise<any> {
  if (url.endsWith('.fbx')) {
    const loader = new FBXLoader();
    return Promise.resolve(loader.parse(bytes.slice(0), ''));
  }
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(bytes.slice(0), '', resolve, reject);
  });
}

/** Dispose a parsed animation source scene (geometry + materials). */
function disposeSourceScene(root: THREE.Object3D | undefined) {
  if (!root || typeof root.traverse !== 'function') return;
  root.traverse((node: any) => {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (const m of mats) {
        for (const key of Object.keys(m)) {
          const v = (m as any)[key];
          if (v && v.isTexture) v.dispose();
        }
        m.dispose();
      }
    }
  });
}

/**
 * Retarget one Mixamo animation onto a VRM — same math as
 * Player.jsx/Participants.tsx `loadMixamoAnimation`, operating on a
 * freshly parsed copy of the cached bytes.
 */
async function retargetClip(url: string, vrm: any): Promise<THREE.AnimationClip> {
  const bytes = await fetchAnimBytes(url);
  let resource: any = await parseAnimResource(url, bytes);

  const clip = resource.animations ? resource.animations[0] : null;
  const gltfScene = url.endsWith('.glb') && resource.scene ? resource.scene : null;
  if (gltfScene) resource = gltfScene;
  if (!clip) throw new Error(`no animation in ${url}`);

  const tracks: THREE.KeyframeTrack[] = [];
  const restRotationInverse = new THREE.Quaternion();
  const parentRestWorldRotation = new THREE.Quaternion();
  const _quatA = new THREE.Quaternion();
  const _vec3 = new THREE.Vector3();

  const mixamoHips = resource.getObjectByName('mixamorigHips');
  const regularHips = resource.getObjectByName('hips');
  const mainHip = mixamoHips ? mixamoHips.position.y : regularHips?.position.y;

  const vrmHipsY = vrm.humanoid?.getNormalizedBoneNode('hips')?.getWorldPosition(_vec3).y;
  const vrmRootY = vrm.scene?.getWorldPosition(_vec3).y;
  const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
  const hipsPositionScale = vrmHipsHeight / mainHip;

  // Authoring-space handedness flip (mirrors Player.jsx loadMixamoAnimation):
  // Mixamo FBX clips use mixamorig* track names and face +Z, so the VRM0 flip
  // (negate quat x,z) reorients them to VRM0's −Z forward. VRM-space GLB clips
  // (e.g. drivingpose.glb) target VRM humanoid bone names directly and are
  // ALREADY authored in VRM0 space — applying that same flip reverses them
  // (spine bends backward), so the flip condition is INVERTED for them.
  const isMixamoSource = clip.tracks.some(
    (t: any) => mixamoVRMRigMap[t.name.split('.')[0] as keyof typeof mixamoVRMRigMap] != null,
  );
  const applyFlip = isMixamoSource
    ? vrm.meta?.metaVersion === '0'
    : vrm.meta?.metaVersion !== '0';

  clip.tracks.forEach((track: any) => {
    const trackSplitted = track.name.split('.');
    const mixamoRigName = trackSplitted[0];
    let vrmBoneName = mixamoVRMRigMap[mixamoRigName as keyof typeof mixamoVRMRigMap];
    // VRM-space clips target humanoid bone names directly (hips, spine,
    // leftUpperArm, …) rather than mixamorig* names. When the Mixamo map
    // misses, fall back to the track's own node name if it's a valid VRM
    // humanoid bone — the rest-pose correction below handles either style.
    if (vrmBoneName == null && vrm.humanoid?.getNormalizedBoneNode(mixamoRigName)) {
      vrmBoneName = mixamoRigName;
    }
    const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
    const mixamoRigNode = resource.getObjectByName(mixamoRigName);

    if (vrmNodeName != null) {
      const propertyName = trackSplitted[1];

      mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
      mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

      if (track instanceof THREE.QuaternionKeyframeTrack) {
        for (let i = 0; i < track.values.length; i += 4) {
          const flatQuaternion = track.values.slice(i, i + 4);
          _quatA.fromArray(flatQuaternion);
          _quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
          _quatA.toArray(flatQuaternion);
          flatQuaternion.forEach((v: number, index: number) => {
            track.values[index + i] = v;
          });
        }
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            `${vrmNodeName}.${propertyName}`,
            track.times,
            track.values.map((v: number, i: number) => (applyFlip && i % 2 === 0 ? -v : v)),
          ),
        );
      } else if (track instanceof THREE.VectorKeyframeTrack) {
        const value = track.values.map(
          (v: number, i: number) => (applyFlip && i % 3 !== 1 ? -v : v) * hipsPositionScale,
        );
        tracks.push(new THREE.VectorKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, value));
      }
    }
  });

  // The parsed source carries skinned meshes we never render — free them
  // (6 of these used to accumulate PER PEER).
  disposeSourceScene(resource);

  return new THREE.AnimationClip('vrmAnimation', clip.duration, tracks);
}

/**
 * Cached retarget: one retarget pass per (animation URL, avatar URL)
 * pair per session; all peers with the same avatar share the clips.
 *
 * @param vrmCacheKey the avatar URL (or 'default') the vrm was parsed from
 */
export function getRetargetedClip(
  url: string,
  vrm: any,
  vrmCacheKey: string,
): Promise<THREE.AnimationClip> {
  const key = `${url}|${vrmCacheKey}`;
  let p = clipCache.get(key);
  if (!p) {
    p = retargetClip(url, vrm);
    p.catch(() => clipCache.delete(key)); // allow retry on failure
    clipCache.set(key, p);
  }
  return p;
}
