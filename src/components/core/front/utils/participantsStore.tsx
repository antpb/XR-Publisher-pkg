// participantsStore.js
import create from 'zustand'

type Participant = any; // Replace 'any' with the actual type if available

interface ParticipantsState {
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (clientId: any) => void;
}

const useParticipantsStore = create<ParticipantsState>((set) => ({
  participants: [],
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) => set((state) => ({ participants: [...state.participants, participant] })),
  removeParticipant: (clientId) => set((state) => ({
    participants: state.participants.filter((item) => item[0] !== clientId)
  })),
}))

export default useParticipantsStore;
