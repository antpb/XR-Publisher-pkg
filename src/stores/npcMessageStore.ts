import { create } from 'zustand';

export interface NPCChatMessage {
	sender: string;
	text: string;
	timestamp: string;
	error?: boolean;
}

interface NPCMessageState {
	messages: NPCChatMessage[];
	addMessage: (m: NPCChatMessage) => void;
	clearMessages: () => void;
}

/**
 * NPC chat transcript. This deliberately lives OUTSIDE EnvironmentFront —
 * when it was `useState` there, every sent message and every NPC response
 * re-rendered the entire Canvas/world tree (visible as a frame hitch per
 * chat exchange). Subscribers: ChatBox (full list), NPCObject (last text
 * only, via selector).
 */
const useNpcMessageStore = create<NPCMessageState>((set) => ({
	messages: [],
	addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
	clearMessages: () => set({ messages: [] }),
}));

export default useNpcMessageStore;
