// Type override for the `ecctrl` package. Its shipped Ecctrl.d.ts re-exports
// EcctrlJoystick from `../src/EcctrlJoystick.tsx` — raw source, which
// skipLibCheck does not skip — pulling ~40 of ecctrl's own type errors into
// this package's typecheck. This ambient declaration replaces the module's
// types with just the surface we use. Do NOT re-export from 'ecctrl/dist'
// here; that resolves back into the shipped source and defeats the override.
declare module 'ecctrl' {
	import type * as React from 'react';

	const Ecctrl: React.ForwardRefExoticComponent<Record<string, unknown>>;
	export default Ecctrl;

	export const EcctrlAnimation: React.FC<{
		characterURL: string;
		animationSet: Record<string, string>;
		children?: React.ReactNode;
	}>;

	export const EcctrlJoystick: React.FC<{
		buttonNumber?: number;
		buttonGroup2Position?: [number, number, number];
		buttonGroup3Position?: [number, number, number];
		buttonTop3Props?: Record<string, unknown>;
		[prop: string]: unknown;
	}>;

	export interface JoystickControlsState {
		setJoystick: (joystickDis: number, joystickAng: number, runState: boolean) => void;
		resetJoystick: () => void;
		pressButton1: () => void;
		pressButton2: () => void;
		pressButton3: () => void;
		pressButton4: () => void;
		pressButton5: () => void;
		releaseAllButtons: () => void;
		getJoystickValues: () => {
			joystickDis: number;
			joystickAng: number;
			runState: boolean;
			button1Pressed: boolean;
		};
		[key: string]: unknown;
	}

	export const useJoystickControls: {
		<T = JoystickControlsState>(selector?: (state: JoystickControlsState) => T): T;
		getState: () => JoystickControlsState;
		setState: (partial: Partial<JoystickControlsState>) => void;
		subscribe: (listener: (state: JoystickControlsState) => void) => () => void;
	};

	export const useGame: {
		<T = Record<string, unknown>>(selector?: (state: Record<string, unknown>) => T): T;
		getState: () => Record<string, unknown>;
		setState: (partial: Record<string, unknown>) => void;
	};

	export function useFollowCam(props?: Record<string, unknown>): Record<string, unknown>;
}
