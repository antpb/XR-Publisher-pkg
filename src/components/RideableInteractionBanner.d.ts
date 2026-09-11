import { MutableRefObject } from 'react';
import { Group } from 'three';

export interface RideableInteractionBannerProps {
	rideableId: string;
	rideableName?: string;
	groupRef?: MutableRefObject<Group | null> | null;
	capacity?: number;
	visible?: boolean;
	onInteractionStart?: () => void;
}

export default function RideableInteractionBanner(props: RideableInteractionBannerProps): JSX.Element;
