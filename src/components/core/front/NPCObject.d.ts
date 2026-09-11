import { ModelProps } from './ModelObject.d';

// NPC Component
export interface NPCProps extends ModelProps {
	name: string;
	defaultMessage: string;
	personality: string;
	objectAwareness: string;
	/** Deprecated — NPC dialogue text now comes from npcMessageStore. */
	messages?: Array<string>;
}

declare const  NPCObject: React.FC<NPCProps>;
export { NPCObject };
