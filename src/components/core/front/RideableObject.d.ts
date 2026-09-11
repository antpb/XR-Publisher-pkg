import { ScalableProps } from '../../../types/three-components';

// Rideable vehicle block component props.
export interface RideableProps extends ScalableProps {
	url: string;
	/** Stable id used as the networking key (block name, else `rideable-N`). */
	rideableId: string;
	/** Display name shown in the "Press E to Ride" banner. */
	name?: string;
	/** car | bike | flying | hovering | animal | train | coaster */
	vehicleType: string;
	/** JSON array of [x,y,z] world waypoints for on-rails types (train/coaster). */
	waypoints?: number[][];
	/** Designer speed multiplier (default 1). */
	speed?: number;
	/** Seat NUDGE in vehicle-local space, applied on top of the auto-derived
	 *  seat (the model's bounding-box center). Default 0 = use the best guess.
	 *  Used for seat 0 when no `seats` array is provided. */
	seatOffsetX?: number;
	seatOffsetY?: number;
	seatOffsetZ?: number;
	/** Multi-seat layout: array of [x,y,z] LOCAL offsets (relative to the auto
	 *  bbox-center, same frame as seatOffset). Index 0 = driver/host, 1..N =
	 *  passengers filled in boarding order. Capacity = array length. Omit for a
	 *  single-seat (driver-only) vehicle. */
	seats?: number[][];
	threeObjectPluginRoot?: string;
	defaultFont?: string;
	/** Shared keyboard/joystick movement ref (from EnvironmentFront) used to
	 *  steer the vehicle while the local player is the driver. */
	movement?: { current: any };
}

declare const RideableObject: React.FC<RideableProps>;
export { RideableObject };
