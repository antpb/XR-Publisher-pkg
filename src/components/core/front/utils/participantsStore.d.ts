// participantsStore.d.ts
import { StateCreator } from 'zustand';

export interface ParticipantsState {
  participants: [string, string, string, string][];
  setParticipants: (participants: [string, string, string, string][]) => void;
  addParticipant: (participant: [string, string, string, string]) => void;
  removeParticipant: (clientId: string) => void;
}

declare const useParticipantsStore: StateCreator<ParticipantsState>;
export default useParticipantsStore;