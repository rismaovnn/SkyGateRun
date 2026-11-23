/**
 * ScreenShake — trauma-based camera shake (trauma² for a natural falloff).
 */
export class ScreenShake {
  constructor() {
    this.trauma = 0;
    this.time = 0;
    this.out = { x: 0, y: 0, roll: 0 };
    this.enabled = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  /** amount 0..1 (0.3 small hit, 0.6 boss impact). */
  add(amount) {
    if (!this.enabled) return;
    this.trauma = Math.min(1, this.trauma + amount);
  }

  offset(dt) {
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const s = this.trauma * this.trauma;
    const t = this.time * 40;
    this.out.x = s * 0.45 * Math.sin(t * 1.1);
    this.out.y = s * 0.35 * Math.sin(t * 1.7 + 1.3);
    this.out.roll = s * 0.03 * Math.sin(t * 0.9 + 2.1);
    return this.out;
  }
}
