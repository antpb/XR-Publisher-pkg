import { create } from 'zustand';

/**
 * rideStore — LOCAL player's ride state.
 *
 * A vehicle now seats multiple people: ONE driver (the host, seat index 0, who
 * owns + moves the vehicle) plus passengers (seats 1..N, who ride along). This
 * store tracks the LOCAL player's place in whatever vehicle they're in:
 *   - `role`      'driver' = we own/steer it; 'passenger' = we ride along.
 *   - `seatIndex` 0 = driver seat; 1..N = the passenger seat assigned by the
 *                 driver (authoritative). Passengers may board optimistically at
 *                 a guessed index and get reconciled to the driver's assignment.
 *
 * Distinct from `interactionStore` (NPC chat) on purpose: riding is a NON-modal,
 * in-world interaction — it must NOT release pointer lock or open a chat panel.
 * The flow is:
 *   - RideableInteractionBanner E-press → `mount(...)` (driver if empty, else
 *     passenger into the next free seat)
 *   - Player.jsx subscribes to `isMounted` → snaps body to seat, gravity 0
 *   - RideableObject seats every occupant from the vehicle transform; the driver
 *     integrates motion + broadcasts; passengers just attach to their seat
 *   - second E → `dismount()`
 */
export type RideRole = 'driver' | 'passenger';

export interface RideMountPayload {
	vehicleId: string;
	vehicleType: string;
	role: RideRole;
	/** 0 = driver; 1..N = passenger seat. */
	seatIndex: number;
	/** Seat offset in vehicle-local space (legacy seat-0 nudge; the vehicle's
	 *  `seats` array supersedes it when present). */
	seatOffset?: [number, number, number];
}

interface RideState {
	isMounted: boolean;
	vehicleId: string | null;
	vehicleType: string | null;
	role: RideRole | null;
	seatIndex: number;
	seatOffset: [number, number, number];
	mount: (payload: RideMountPayload) => void;
	dismount: () => void;
	/** Reconcile the passenger seat to the driver's authoritative assignment. */
	setSeatIndex: (seatIndex: number) => void;
	/** True only when the given vehicle id is the one currently mounted. */
	isRiding: (vehicleId: string) => boolean;
}

const useRideStore = create<RideState>((set, get) => ({
	isMounted: false,
	vehicleId: null,
	vehicleType: null,
	role: null,
	seatIndex: 0,
	seatOffset: [0, 0, 0],

	mount: (payload) =>
		set({
			isMounted: true,
			vehicleId: payload.vehicleId,
			vehicleType: payload.vehicleType,
			role: payload.role,
			seatIndex: payload.seatIndex,
			seatOffset: payload.seatOffset ?? [0, 0, 0],
		}),

	dismount: () =>
		set({
			isMounted: false,
			vehicleId: null,
			vehicleType: null,
			role: null,
			seatIndex: 0,
		}),

	setSeatIndex: (seatIndex) => set({ seatIndex }),

	isRiding: (vehicleId) => {
		const s = get();
		return s.isMounted && s.vehicleId === vehicleId;
	},
}));

export default useRideStore;
