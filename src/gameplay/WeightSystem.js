/**
 * WeightSystem — maps power to body proportions and tweens each body part (no parent scaling):
 * bigger torso, wider shoulders, thicker arms, bigger legs. Logarithmic so early gates feel strong.
 */
import gsap from 'gsap';
import { GAME } from '../utils/Constants.js';
import { clamp, lerp } from '../utils/Helpers.js';
import { THIN, BUFF } from './CharacterModel.js';

export class WeightSystem {
  constructor(model) {
    this.model = model;
    this.tween = null;
    this.t = 0;
  }

  /** 0 (thin) … 1 (max build) for a power value. */
  static ratio(power) {
    if (power <= GAME.START_POWER) return clamp((power / GAME.START_POWER) * 0.08 - 0.08, -0.05, 0);
    const r = Math.log(power / GAME.START_POWER) / Math.log(GAME.POWER_FOR_MAX_BODY / GAME.START_POWER);
    return clamp(r, 0, 1);
  }

  /** Target proportions for a ratio. Parts grow at slightly different rates for a "bulking" feel. */
  static proportions(t) {
    const out = {};
    const ease = { shoulderW: Math.pow(Math.max(t, 0), 0.8), armThick: Math.pow(Math.max(t, 0), 0.9), deltoid: Math.pow(Math.max(t, 0), 0.75) };
    for (const k of Object.keys(THIN)) {
      const tt = ease[k] ?? t;
      out[k] = lerp(THIN[k], BUFF[k], tt);
    }
    return out;
  }

  /** Immediately apply (level start / revive). */
  set(power) {
    this.t = WeightSystem.ratio(power);
    Object.assign(this.model.params, WeightSystem.proportions(this.t));
    this.model.applyProportions();
  }

  /**
   * Tween to the build for `power`. Growth overshoots a little (back.out), shrinking is quicker.
   */
  to(power) {
    const t = WeightSystem.ratio(power);
    const growing = t >= this.t;
    this.t = t;
    this.tween?.kill();
    this.tween = gsap.to(this.model.params, {
      ...WeightSystem.proportions(t),
      duration: growing ? 0.45 : 0.3,
      ease: growing ? 'back.out(2.2)' : 'power2.out',
      onUpdate: () => this.model.applyProportions()
    });
  }

  dispose() {
    this.tween?.kill();
  }
}
