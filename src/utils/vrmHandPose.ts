/**
 * Shared utility for capturing and applying VRM hand/finger poses.
 *
 * Used by Player.jsx (capture local hand poses for network broadcast)
 * and Participants.tsx (apply received hand poses to remote VRM avatars).
 */
import { VRMHumanBoneName } from '@pixiv/three-vrm';
import { Quaternion, Vector3 } from 'three';
import type { Object3D } from 'three';

/**
 * The 15 VRM finger bone names per hand, in the order they are packed
 * into the network protocol (matching XR_TO_VRM_FINGER_MAP in Player.jsx).
 */
export const LEFT_FINGER_BONES: VRMHumanBoneName[] = [
  VRMHumanBoneName.LeftThumbMetacarpal,
  VRMHumanBoneName.LeftThumbProximal,
  VRMHumanBoneName.LeftThumbDistal,
  VRMHumanBoneName.LeftIndexProximal,
  VRMHumanBoneName.LeftIndexIntermediate,
  VRMHumanBoneName.LeftIndexDistal,
  VRMHumanBoneName.LeftMiddleProximal,
  VRMHumanBoneName.LeftMiddleIntermediate,
  VRMHumanBoneName.LeftMiddleDistal,
  VRMHumanBoneName.LeftRingProximal,
  VRMHumanBoneName.LeftRingIntermediate,
  VRMHumanBoneName.LeftRingDistal,
  VRMHumanBoneName.LeftLittleProximal,
  VRMHumanBoneName.LeftLittleIntermediate,
  VRMHumanBoneName.LeftLittleDistal,
];

export const RIGHT_FINGER_BONES: VRMHumanBoneName[] = [
  VRMHumanBoneName.RightThumbMetacarpal,
  VRMHumanBoneName.RightThumbProximal,
  VRMHumanBoneName.RightThumbDistal,
  VRMHumanBoneName.RightIndexProximal,
  VRMHumanBoneName.RightIndexIntermediate,
  VRMHumanBoneName.RightIndexDistal,
  VRMHumanBoneName.RightMiddleProximal,
  VRMHumanBoneName.RightMiddleIntermediate,
  VRMHumanBoneName.RightMiddleDistal,
  VRMHumanBoneName.RightRingProximal,
  VRMHumanBoneName.RightRingIntermediate,
  VRMHumanBoneName.RightRingDistal,
  VRMHumanBoneName.RightLittleProximal,
  VRMHumanBoneName.RightLittleIntermediate,
  VRMHumanBoneName.RightLittleDistal,
];

/**
 * Capture finger joint quaternions from a VRM humanoid into a Float32Array.
 * Returns a Float32Array of length 60 (15 joints x 4 quaternion components).
 *
 * Uses the LOCAL quaternion of each bone (relative to parent), which is what
 * the IK/finger tracking system writes.
 */
export function captureFingerQuaternions(
  humanoid: any,
  fingerBones: VRMHumanBoneName[],
  output: Float32Array,
): boolean {
  let hasData = false;
  for (let i = 0; i < 15; i++) {
    const bone = humanoid.getNormalizedBoneNode(fingerBones[i]);
    if (bone) {
      const q = bone.quaternion;
      output[i * 4]     = q.x;
      output[i * 4 + 1] = q.y;
      output[i * 4 + 2] = q.z;
      output[i * 4 + 3] = q.w;
      hasData = true;
    } else {
      // Identity quaternion for missing bones
      output[i * 4]     = 0;
      output[i * 4 + 1] = 0;
      output[i * 4 + 2] = 0;
      output[i * 4 + 3] = 1;
    }
  }
  return hasData;
}

/**
 * Apply finger joint quaternions from a decoded network message to a VRM humanoid.
 * `fingerJoints` is an array of 15 quaternion arrays [x, y, z, w].
 */
export function applyRemoteFingerPose(
  humanoid: any,
  fingerBones: VRMHumanBoneName[],
  fingerJoints: [number, number, number, number][],
) {
  for (let i = 0; i < Math.min(15, fingerJoints.length); i++) {
    const bone = humanoid.getNormalizedBoneNode(fingerBones[i]);
    if (bone && fingerJoints[i]) {
      const [x, y, z, w] = fingerJoints[i];
      bone.quaternion.set(x, y, z, w);
      bone.updateMatrix();
    }
  }
}

/**
 * Apply a wrist quaternion to the VRM hand bone.
 */
export function applyRemoteWristPose(
  humanoid: any,
  isLeft: boolean,
  wristQuat: [number, number, number, number],
) {
  const boneName = isLeft ? VRMHumanBoneName.LeftHand : VRMHumanBoneName.RightHand;
  const bone = humanoid.getNormalizedBoneNode(boneName);
  if (bone) {
    bone.quaternion.set(wristQuat[0], wristQuat[1], wristQuat[2], wristQuat[3]);
    bone.updateMatrix();
  }
}

/**
 * Apply upper arm and lower arm quaternions from VR IK to a remote VRM.
 */
export function applyRemoteArmBones(
  humanoid: any,
  isLeft: boolean,
  upperArmQuat: [number, number, number, number],
  lowerArmQuat: [number, number, number, number],
) {
  const upperArm = humanoid.getNormalizedBoneNode(
    isLeft ? VRMHumanBoneName.LeftUpperArm : VRMHumanBoneName.RightUpperArm
  );
  const lowerArm = humanoid.getNormalizedBoneNode(
    isLeft ? VRMHumanBoneName.LeftLowerArm : VRMHumanBoneName.RightLowerArm
  );
  if (upperArm) { upperArm.quaternion.set(upperArmQuat[0], upperArmQuat[1], upperArmQuat[2], upperArmQuat[3]); upperArm.updateMatrix(); }
  if (lowerArm) { lowerArm.quaternion.set(lowerArmQuat[0], lowerArmQuat[1], lowerArmQuat[2], lowerArmQuat[3]); lowerArm.updateMatrix(); }
}

// ─── Fast-path variants ──────────────────────────────────────────────
// These accept pre-resolved bone Object3D refs (cached once per VRM at
// load time) instead of calling humanoid.getNormalizedBoneNode on every
// frame. Participants.tsx uses these in useFrame; the legacy versions
// above remain for one-shot lookups in Player.jsx.

export function applyWristPoseToBone(
  bone: Object3D | null | undefined,
  wristQuat: [number, number, number, number],
) {
  if (!bone) return;
  bone.quaternion.set(wristQuat[0], wristQuat[1], wristQuat[2], wristQuat[3]);
  bone.updateMatrix();
}

export function applyFingerPoseToBones(
  bones: (Object3D | null | undefined)[],
  fingerJoints: [number, number, number, number][],
) {
  const n = Math.min(bones.length, fingerJoints.length, 15);
  for (let i = 0; i < n; i++) {
    const bone = bones[i];
    const joint = fingerJoints[i];
    if (bone && joint) {
      bone.quaternion.set(joint[0], joint[1], joint[2], joint[3]);
      bone.updateMatrix();
    }
  }
}

export function applyArmBonesToBones(
  upperArm: Object3D | null | undefined,
  lowerArm: Object3D | null | undefined,
  upperArmQuat: [number, number, number, number],
  lowerArmQuat: [number, number, number, number],
) {
  if (upperArm) {
    upperArm.quaternion.set(upperArmQuat[0], upperArmQuat[1], upperArmQuat[2], upperArmQuat[3]);
    upperArm.updateMatrix();
  }
  if (lowerArm) {
    lowerArm.quaternion.set(lowerArmQuat[0], lowerArmQuat[1], lowerArmQuat[2], lowerArmQuat[3]);
    lowerArm.updateMatrix();
  }
}

/**
 * Curl a VRM's fingers into a grip, the same finger-bone approach the VR hand-
 * tracking path uses (LEFT/RIGHT_FINGER_BONES order). The finger bones are NOT
 * cleanly axis-aligned (each has its own roll), so rotating about a fixed local
 * axis bent some joints sideways ("breaking"). Instead every joint curls about
 * the real KNUCKLE AXLE — the world-space line from the index knuckle to the
 * little knuckle — converted into each bone's own frame. That bends each joint
 * the same true direction (toward the palm) no matter how the bone is rolled.
 * `amount` (0..1) scales it so it can fade in/out.
 */
const _axleWorld = new Vector3();
const _knuckleA = new Vector3();
const _knuckleB = new Vector3();
const _boneWorldQ = new Quaternion();
const _axleLocal = new Vector3();
const _curlQuat = new Quaternion();

// Per-joint bend fraction in LEFT/RIGHT_FINGER_BONES order:
// [thumbMeta,thumbProx,thumbDist, idxProx,idxInt,idxDist, midProx,midInt,midDist,
//  ringProx,ringInt,ringDist, littleProx,littleInt,littleDist]
const FIST_CURL_FRACTION = [
  0.3, 0.4, 0.4,    // thumb — gentler
  1.0, 0.9, 0.7,    // index
  1.0, 0.9, 0.7,    // middle
  1.0, 0.9, 0.7,    // ring
  1.0, 0.9, 0.7,    // little
];
// Base flexion angle (rad) per joint at amount=1 — compounds across
// proximal/intermediate/distal into a firm grip on the wheel.
const FIST_CURL_ANGLE = 0.95;

export function applyFistPose(
  humanoid: any,
  fingerBones: VRMHumanBoneName[],
  isLeft: boolean,
  amount: number,
) {
  if (!humanoid || amount <= 0) return;
  // Knuckle axle in world space: index proximal (idx 3) → little proximal (12).
  const idxProx = humanoid.getNormalizedBoneNode(fingerBones[3]);
  const litProx = humanoid.getNormalizedBoneNode(fingerBones[12]);
  if (!idxProx || !litProx) return;
  idxProx.getWorldPosition(_knuckleA);
  litProx.getWorldPosition(_knuckleB);
  _axleWorld.subVectors(_knuckleB, _knuckleA);
  if (_axleWorld.lengthSq() < 1e-8) return;
  _axleWorld.normalize();
  const sign = isLeft ? 1 : -1; // flip if fingers hyperextend instead of curling in
  for (let i = 0; i < 15; i++) {
    const bone = humanoid.getNormalizedBoneNode(fingerBones[i]);
    if (!bone || !bone.parent) continue;
    // Express the world axle in the bone's PARENT frame — NOT the bone's own
    // world frame. We overwrite this bone's local rotation below, so using the
    // bone's own world quaternion (which already contains last frame's curl)
    // feeds that curl back in every frame; whenever the avatar is ALSO turning
    // (boats / rails / hover) the axis drifts and the fingers twist out of
    // control. The parent frame excludes this bone's local rotation → stable.
    bone.parent.getWorldQuaternion(_boneWorldQ).invert();
    _axleLocal.copy(_axleWorld).applyQuaternion(_boneWorldQ).normalize();
    const angle = sign * FIST_CURL_ANGLE * FIST_CURL_FRACTION[i] * amount;
    _curlQuat.setFromAxisAngle(_axleLocal, angle);
    bone.quaternion.copy(_curlQuat);
    bone.updateMatrix();
  }
}
