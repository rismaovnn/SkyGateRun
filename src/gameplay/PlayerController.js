/**
 * PlayerController — turns finger drags into smooth lateral movement.
 * The finger sets a target X; the body follows with exponential smoothing (feels responsive, never jittery).
 */
import { GAME } from '../utils/Constants.js';
import { clamp, damp } from '../utils/Helpers.js';

export class PlayerController {
  constructor(input, player) {
    this.input = input;
    this.player = player;
    this.targetX = 0;
    this.enabled = false;
  }

  setEnabled(on) {
    this.enabled = on;
    this.input.setEnabled(on);
  }

  reset(x = 0) {
    this.targetX = x;
    this.player.position.x = x;
  }

  update(dt) {
    if (!this.enabled || this.player.state !== 'running') {
      this.player.lean = damp(this.player.lean, 0, 8, dt);
      return;
    }
    const limit = GAME.PLAYER_X_LIMIT - Math.max(0, this.player.radius - 0.4) * 0.5;
    this.targetX = clamp(this.targetX + this.input.consumeDeltaX(dt) * GAME.SWIPE_SENSITIVITY, -limit, limit);
    const before = this.player.position.x;
    this.player.position.x = damp(before, this.targetX, GAME.STEER_LERP, dt);
    const vx = dt > 0 ? (this.player.position.x - before) / dt : 0;
    this.player.lean = damp(this.player.lean, vx, 10, dt);
  }
}
