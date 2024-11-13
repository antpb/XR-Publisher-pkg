import { ReactNode } from 'react';
import { Vector3 } from 'three';

export interface TeleportTravelProps {
  spawnPoint: [number, number, number];
  avatarHeightOffset: { current: number };
  centerOnTeleport?: boolean;
  Indicator?: React.ComponentType;
  ClickIndicator?: React.ComponentType;
  useNormal?: boolean;
  children?: ReactNode;
  userData: {
	inWorldName: string;
	playerVRM: string;
	profileImage: string;
	nonce: string;
	vrm?: any;
  };
  vrm?: any;
}

export function TeleportIndicator(props: any): JSX.Element;
export function ClickIndicatorObject(props: any): JSX.Element;
export function Button(props: { onClick: () => void; position: [number, number, number]; color: string; hoverColor: string }): JSX.Element;
export function Menu(): JSX.Element;

export default function TeleportTravel(props: TeleportTravelProps): JSX.Element;