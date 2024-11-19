import { ReactNode, MutableRefObject } from 'react';
import { Vector3, Quaternion } from 'three';

export interface PlayerProps {
  spawnPoint: [number, number, number];
  movement: MutableRefObject<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    shift: boolean;
    space: boolean;
    respawn: boolean;
  }>;
  avatarHeightOffset: MutableRefObject<number>;
  threeObjectPluginRoot: string;
  defaultPlayerAvatar?: string;
  defaultAvatarVRM?: string;
  camCollisions?: string;
  p2pcf?: any;
}

export default function Player(props: PlayerProps): JSX.Element;

export class XrHead {
  constructor(context: any);
  position: Vector3;
  quaternion: Quaternion;
  worldUp: Vector3;
  forward: Vector3;
  up: Vector3;
  right: Vector3;
  update(): void;
}

export class Vector3Damper {
  constructor(period?: number);
  add(time: number, sample: Vector3): Vector3;
  get average(): Vector3;
  clear(): void;
}