import { FC } from 'react';

interface ThreeObjectFrontProps {
  threeObjectPlugin: string;
  defaultAvatarAnimation: string;
  threeUrl: string;
  deviceTarget: string;
  zoom: number;
  scale: number;
  hasTip: string;
  hasZoom: string;
  positionY: number;
  positionX?: number;
  positionZ?: number;
  rotationY: number;
  animations: string;
  backgroundColor: string;
}

declare const ThreeObjectFront: FC<ThreeObjectFrontProps>;
export default ThreeObjectFront;