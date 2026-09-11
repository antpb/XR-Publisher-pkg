import { useJoystickControls } from 'ecctrl';

/**
 * Tank-style mobile joystick controls.
 *
 * Stock EcctrlJoystick maps lateral stick deflection to strafing (Ecctrl
 * reads the raw angle straight out of the shared joystick store), which is
 * disorienting on a touchscreen — especially while flying. We want the
 * stick's X axis to TURN the view direction and only the Y axis to move the
 * character (forward/backward relative to the camera).
 *
 * Ecctrl consumes the store directly inside its own useFrame, so the only
 * race-free place to reshape the input is the store's `setJoystick` writer
 * itself. This module patches it once, at import time — before
 * EcctrlJoystick's render captures the function — to:
 *   - publish the lateral component to `joystickTurn` (Player.jsx reads it
 *     each frame and rotates Ecctrl's camera pivot), and
 *   - forward only the longitudinal component to the store, snapped to
 *     straight up (PI/2) or down (3PI/2), so Ecctrl can never strafe from
 *     touch input.
 *
 * Gamepad sticks bypass the reshape on purpose: Ecctrl feeds the first
 * gamepad stick through the same `setJoystick` with a 0..1 magnitude
 * (touch deflection is in pixels, 0..~65), and gamepads have a second stick
 * for the camera — so any write with dis <= 1 passes through untouched.
 */

/** Lateral turn input, -1..1 (+1 = stick hard right). Player.jsx consumes it. */
export const joystickTurn = { value: 0 };

// EcctrlJoystick's max deflection is 0.65 * (wrapper width / 2); the wrapper
// defaults to 200px → max dis 65. If the joystick is ever resized via
// joystickHeightAndWidth, keep this in sync.
const TOUCH_MAX_DIS = 65;
const TURN_DEAD_FRAC = 0.18; // lateral fraction ignored (finger wobble)
const TURN_FULL_FRAC = 0.85; // lateral fraction that yields full-rate turn
const MOVE_DEAD_FRAC = 0.16; // longitudinal dead zone (~10px — matches Player's joyDis > 10 gate)

const PATCHED = Symbol.for('xrp.joystickTankControls');

function applyPatch(): void {
  const store = useJoystickControls;
  const current = store.getState();
  if ((current.setJoystick as any)[PATCHED]) return;

  const originalSet = current.setJoystick;
  const originalReset = current.resetJoystick;

  const setJoystick = (dis: number, ang: number, run: boolean): void => {
    if (dis <= 1.001) {
      // Gamepad scale (or sub-pixel touch) — leave untouched.
      joystickTurn.value = 0;
      originalSet(dis, ang, run);
      return;
    }

    const lateral = Math.cos(ang) * dis;
    const longitudinal = Math.sin(ang) * dis;

    const latFrac = Math.abs(lateral) / TOUCH_MAX_DIS;
    joystickTurn.value = latFrac <= TURN_DEAD_FRAC
      ? 0
      : Math.sign(lateral) * Math.min(1, (latFrac - TURN_DEAD_FRAC) / (TURN_FULL_FRAC - TURN_DEAD_FRAC));

    const moveDis = Math.abs(longitudinal) / TOUCH_MAX_DIS <= MOVE_DEAD_FRAC
      ? 0
      : Math.abs(longitudinal);
    originalSet(moveDis, longitudinal >= 0 ? Math.PI / 2 : Math.PI * 1.5, run);
  };
  (setJoystick as any)[PATCHED] = true;

  const resetJoystick = (): void => {
    joystickTurn.value = 0;
    originalReset();
  };

  store.setState({ setJoystick, resetJoystick });
}

applyPatch();
