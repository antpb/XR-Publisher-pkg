export interface KeyboardState {
	forward: boolean;
	backward: boolean;
	left: boolean;
	right: boolean;
	jump: boolean;
	shift: boolean;
  }
  
  export type UseKeyboardControls = () => KeyboardState;
    