/**
 * Gamepad input for the arcade — polled from a game's EXISTING rAF loop (no loop
 * of its own; the Gamepad API is poll-only). Standard-layout mapping, fixed v1:
 * D-pad (14/15/13/12) + left stick (axes 0/1, ±0.5 deadzone) = move / soft drop /
 * hard drop · A (0) = rotate CW · B (1) = rotate CCW · LB/RB (4/5) = hold ·
 * Start (9) = pause. Directions are HOLDS (feed the same DAS as the keyboard);
 * the rest are press EDGES computed against the previous frame's snapshot.
 */

export interface PadFrame {
  left: boolean;
  right: boolean;
  softDrop: boolean;
  hardDrop: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
  hold: boolean;
  pause: boolean;
  anyPress: boolean;
}

const DEADZONE = 0.5;

const IDLE: PadFrame = {
  left: false,
  right: false,
  softDrop: false,
  hardDrop: false,
  rotateCW: false,
  rotateCCW: false,
  hold: false,
  pause: false,
  anyPress: false,
};

interface RawHeld {
  hard: boolean;
  cw: boolean;
  ccw: boolean;
  hold: boolean;
  pause: boolean;
  any: boolean;
}

const RAW_IDLE: RawHeld = {
  hard: false,
  cw: false,
  ccw: false,
  hold: false,
  pause: false,
  any: false,
};

export function createGamepadPoller(): () => PadFrame {
  let prev = RAW_IDLE;
  return () => {
    const pads =
      typeof navigator !== "undefined" && navigator.getGamepads
        ? navigator.getGamepads()
        : [];
    const gp = Array.from(pads ?? []).find(
      (p): p is Gamepad => !!p && p.connected
    );
    if (!gp) {
      prev = RAW_IDLE;
      return IDLE;
    }
    const btn = (i: number) => !!gp.buttons[i]?.pressed;
    const axisX = gp.axes[0] ?? 0;
    const axisY = gp.axes[1] ?? 0;
    const held: RawHeld = {
      hard: btn(12),
      cw: btn(0),
      ccw: btn(1),
      hold: btn(4) || btn(5),
      pause: btn(9),
      any: gp.buttons.some((b) => b.pressed),
    };
    const frame: PadFrame = {
      left: btn(14) || axisX < -DEADZONE,
      right: btn(15) || axisX > DEADZONE,
      softDrop: btn(13) || axisY > DEADZONE,
      hardDrop: held.hard && !prev.hard,
      rotateCW: held.cw && !prev.cw,
      rotateCCW: held.ccw && !prev.ccw,
      hold: held.hold && !prev.hold,
      pause: held.pause && !prev.pause,
      anyPress: held.any && !prev.any,
    };
    prev = held;
    return frame;
  };
}
