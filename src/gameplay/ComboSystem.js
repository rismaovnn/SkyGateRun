/**
 * ComboSystem — counts consecutive positive gates. ≥3 shows the combo pill; a bad gate resets it.
 * Each combo step adds a small bonus to the gate result.
 */
import { bus } from '../core/EventBus.js';

export class ComboSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.combo = 0;
    this.best = 0;
    this.perfects = 0;
  }

  /**
   * Register a gate pass.
   * @returns {{ combo, bonus }} bonus = extra power to add (from combo ≥ 3)
   */
  register({ positive, perfect }, powerAfter) {
    if (perfect) this.perfects++;
    if (!positive) {
      if (this.combo) bus.emit('combo:change', { combo: 0 });
      this.combo = 0;
      return { combo: 0, bonus: 0 };
    }
    this.combo++;
    this.best = Math.max(this.best, this.combo);
    bus.emit('combo:change', { combo: this.combo });
    // Combo bonus: +3% per step above 2 (max +15%), and a flat +5 for PERFECT.
    const comboBonus = this.combo >= 3 ? Math.round(powerAfter * Math.min(0.15, 0.03 * (this.combo - 2))) : 0;
    const perfectBonus = perfect ? 5 : 0;
    return { combo: this.combo, bonus: comboBonus + perfectBonus };
  }
}
