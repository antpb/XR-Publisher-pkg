// participantsStore.js
import { create } from 'zustand'

// Participant tuple: [clientId, playerVRM, inWorldName, profileImage]
type Participant = [string, string, string, string];

interface ParticipantsState {
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (clientId: string) => void;
  /** Update profile data for an existing participant (from binary profile announce) */
  updateParticipantProfile: (clientId: string, playerVRM: string, inWorldName: string, profileImage: string) => void;
}

const useParticipantsStore = create<ParticipantsState>((set) => ({
  participants: [],
  setParticipants: (participants) => set({ participants }),
  // Idempotent: a reconnecting peer (new peer.id, same clientId) used to
  // create a duplicate avatar that shadowed the original.
  addParticipant: (participant) => set((state) =>
    state.participants.some((item) => item[0] === participant[0])
      ? state
      : { participants: [...state.participants, participant] }
  ),
  removeParticipant: (clientId) => set((state) => ({
    participants: state.participants.filter((item) => item[0] !== clientId)
  })),
  // Identity-guarded: profile announces REPEAT (every peerconnect event —
  // including datachannel renegotiations, e.g. proximity-voice attach when a
  // peer walks near). Returning a new array for a no-op update re-rendered
  // the entire participant tree on each announce.
  updateParticipantProfile: (clientId, playerVRM, inWorldName, profileImage) => set((state) => {
    const idx = state.participants.findIndex((item) => item[0] === clientId);
    if (idx < 0) return state;
    const cur = state.participants[idx];
    const next: Participant = [clientId, playerVRM || cur[1], inWorldName || cur[2], profileImage || cur[3]];
    if (next[1] === cur[1] && next[2] === cur[2] && next[3] === cur[3]) return state;
    const participants = state.participants.slice();
    participants[idx] = next;
    return { participants };
  }),
}))

export default useParticipantsStore;
