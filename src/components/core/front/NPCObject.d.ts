import { ModelProps } from './ModelObject.d';

// NPC Component
export interface NPCProps extends ModelProps {
	name: string;
	defaultMessage: string;
	personality: string;
	objectAwareness: string;
	messages: Array<string>;
}

declare const  NPCObject: React.FC<NPCProps>;
export { NPCObject };
