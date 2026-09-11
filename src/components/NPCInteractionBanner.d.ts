import { MutableRefObject } from 'react';
import { Group } from 'three';

export interface NPCInteractionBannerProps {
	npcId: string;
	npcName?: string;
	npcGroupRef?: MutableRefObject<Group | null> | null;
	visible?: boolean;
	onInteractionStart?: () => void;
}

export default function NPCInteractionBanner(props: NPCInteractionBannerProps): JSX.Element;
