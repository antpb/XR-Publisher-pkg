/**
 * GTA-style aim overlay for the local avatar.
 *
 * Runs POST-MIXER (same slot as the riding fist pose): the animation mixer
 * lays down the base idle/walk pose every frame, then this rotates the arm
 * chains so they point at a world-space target. Because the correction is
 * recomputed from the MIXER pose each frame (never from our own previous
 * output), there is no feedback accumulation — the same stability trick as
 * applyFistPose's parent-frame axle.
 *
 * The aim direction is CLAMPED into a cone around the avatar's body forward
 * (yaw offset and pitch limits) so the arms can never bend backward — if the
 * target is far off-axis the arms track to the cone edge and the body-yaw
 * ease (Player.jsx drives it toward the target while aiming) closes the rest.
 *
 * The right arm takes the full correction; the left takes a partial one, which
 * reads as bracing/supporting a held tool (hose wand, rifle stock).
 */
import { Vector3, Quaternion } from 'three';
import type { VRMHumanoid } from '@pixiv/three-vrm';

const MAX_YAW_OFFSET = 1.35; // rad each side of body forward
const MIN_PITCH = -0.85;     // rad (aiming down)
const MAX_PITCH = 1.15;      // rad (aiming up)

const _S = new Vector3();
const _H = new Vector3();
const _A = new Vector3();
const _D = new Vector3();
const _target = new Vector3();
const _P = new Quaternion();
const _corr = new Quaternion();
const _partial = new Quaternion();
const _world = new Quaternion();

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Clamp world direction _D into the aim cone around bodyYaw (in place). */
function clampToCone(bodyYaw: number): void {
  // Avatar faces (-sin(yaw), 0, -cos(yaw)) — see Player.jsx movement block
  // (forward-facing yaw = cameraYaw + PI).
  const yawF = Math.atan2(-Math.sin(bodyYaw), -Math.cos(bodyYaw));
  const yawD = Math.atan2(_D.x, _D.z);
  let off = yawD - yawF;
  while (off > Math.PI) off -= Math.PI * 2;
  while (off < -Math.PI) off += Math.PI * 2;
  const yawW = yawF + clamp(off, -MAX_YAW_OFFSET, MAX_YAW_OFFSET);
  const pitch = clamp(Math.asin(clamp(_D.y, -1, 1)), MIN_PITCH, MAX_PITCH);
  const cp = Math.cos(pitch);
  _D.set(Math.sin(yawW) * cp, Math.sin(pitch), Math.cos(yawW) * cp);
}

/** One clamped corrective rotation: swing `bone` so chainEnd points at _D. */
function swingToward(
  bone: { parent: { getWorldQuaternion: (q: Quaternion) => Quaternion } | null;
          quaternion: Quaternion; updateMatrix: () => void;
          getWorldPosition: (v: Vector3) => Vector3 },
  chainEnd: { getWorldPosition: (v: Vector3) => Vector3 },
  weight: number,
): void {
  if (!bone.parent) return;
  bone.getWorldPosition(_S);
  chainEnd.getWorldPosition(_H);
  _A.copy(_H).sub(_S);
  if (_A.lengthSq() < 1e-8) return;
  _A.normalize();
  _corr.setFromUnitVectors(_A, _D);
  _partial.identity().slerp(_corr, weight);
  // newLocal = P⁻¹ · partial · P · localMixer   (rotate in world, express local)
  bone.parent.getWorldQuaternion(_P);
  _world.copy(_P).multiply(bone.quaternion);   // current world orientation
  _world.premultiply(_partial);                // corrected world orientation
  bone.quaternion.copy(_P.invert()).multiply(_world);
  bone.updateMatrix();
}

export function applyAimPose(
  humanoid: VRMHumanoid,
  target: [number, number, number],
  bodyYaw: number,
  amount: number,
): void {
  if (!humanoid || amount <= 0.001) return;
  _target.set(target[0], target[1], target[2]);

  const arms: Array<{ upper: string; lower: string; hand: string; w: number }> = [
    { upper: 'rightUpperArm', lower: 'rightLowerArm', hand: 'rightHand', w: 1.0 },
    { upper: 'leftUpperArm', lower: 'leftLowerArm', hand: 'leftHand', w: 0.55 },
  ];
  for (const a of arms) {
    const upper = humanoid.getNormalizedBoneNode(a.upper as never);
    const lower = humanoid.getNormalizedBoneNode(a.lower as never);
    const hand = humanoid.getNormalizedBoneNode(a.hand as never);
    if (!upper || !hand) continue;

    // Shoulder→target, clamped into the no-backward-bend cone.
    upper.getWorldPosition(_S);
    _D.copy(_target).sub(_S);
    if (_D.lengthSq() < 1e-6) continue;
    _D.normalize();
    clampToCone(bodyYaw);

    swingToward(upper, hand, amount * a.w);
    // Elbow refinement AFTER the shoulder swing (getWorldPosition re-resolves
    // the updated chain — a second CCD step that straightens the forearm).
    if (lower) {
      lower.getWorldPosition(_S);
      _D.copy(_target).sub(_S);
      if (_D.lengthSq() > 1e-6) {
        _D.normalize();
        clampToCone(bodyYaw);
        swingToward(lower, hand, amount * a.w * 0.6);
      }
    }
  }
}
