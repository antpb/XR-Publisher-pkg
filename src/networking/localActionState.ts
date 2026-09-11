/**
 * Local player broadcast-action state machine.
 *
 * One pure per-frame decision replaces the three competing broadcast
 * sites Player.jsx had (movement block, idle-stop, jump-sync) — they
 * could disagree within a single frame (e.g. `broadcastPlayerStop()`
 * racing the jump block's `jumpStop`), which flickered remote
 * animations. The jump→land→ground sequence is emitted deterministically:
 * airborne frames produce 'jumping', the first grounded frame after air
 * produces 'jumpStop', subsequent frames fall through to walk/run/idle.
 *
 * Also owns hangtime counting and the send cadence — previously these
 * lived in `let` bindings in the component body, which silently reset on
 * every React re-render.
 */

export interface ActionInputs {
  /** Any locomotion input held this frame. */
  moving: boolean;
  shift: boolean;
  /** jumpStateRef !== 'grounded'. */
  airborne: boolean;
  swimming: boolean;
}

export interface ActionDecision {
  action: 'idle' | 'walking' | 'running' | 'jumping' | 'jumpStop';
  /** Action changed this frame — broadcast immediately, skip rate gates. */
  isTransition: boolean;
  hangtime: number;
}

export class LocalActionState {
  private current: ActionDecision['action'] = 'idle';
  private wasAirborne = false;
  private hangtime = 0;
  private lastSendTime = 0;

  /** Steady-state re-send cadence while grounded (ms). ~15Hz: the
   *  receiver lerps toward the latest packet over 300ms and RESETS on
   *  each arrival — at 5Hz it only ever covered ~⅔ of the gap before
   *  the next reset, which read as jagged "always catching up" motion.
   *  (Idle players don't pay this rate: the NetworkBridge change gate
   *  drops byte-identical sends to the 1s keyframe.) */
  static GROUND_RATE_MS = 66;
  /** Faster cadence while airborne so the arc tracks (ms). */
  static AIR_RATE_MS = 66;

  compute(inputs: ActionInputs): ActionDecision {
    let action: ActionDecision['action'];

    if (inputs.airborne && !inputs.swimming) {
      action = 'jumping';
      this.hangtime = Math.min(this.hangtime + 1, 255);
    } else if (this.wasAirborne && !inputs.swimming) {
      // First grounded frame after air — the landing transition.
      action = 'jumpStop';
    } else if (inputs.moving) {
      action = inputs.shift ? 'running' : 'walking';
      this.hangtime = 0;
    } else {
      action = 'idle';
      this.hangtime = 0;
    }

    this.wasAirborne = inputs.airborne && !inputs.swimming;

    const isTransition = action !== this.current;
    this.current = action;
    return { action, isTransition, hangtime: this.hangtime };
  }

  /**
   * Rate gate: true when this frame's decision should be broadcast —
   * always on transitions, otherwise on the steady cadence. (The
   * NetworkBridge change-gate further suppresses byte-identical sends.)
   */
  shouldSend(decision: ActionDecision, nowMs: number, airborne: boolean): boolean {
    const rate = airborne ? LocalActionState.AIR_RATE_MS : LocalActionState.GROUND_RATE_MS;
    if (decision.isTransition || nowMs - this.lastSendTime >= rate) {
      this.lastSendTime = nowMs;
      return true;
    }
    return false;
  }

  get currentAction(): ActionDecision['action'] {
    return this.current;
  }

  reset(): void {
    this.current = 'idle';
    this.wasAirborne = false;
    this.hangtime = 0;
    this.lastSendTime = 0;
  }
}
