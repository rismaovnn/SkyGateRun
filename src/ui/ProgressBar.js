/**
 * ProgressBar — rounded bar with optional moving marker (level progress, loading, missions).
 */
import { el, clamp } from '../utils/Helpers.js';

export class ProgressBar {
  /**
   * @param {object} o { marker: bool, variant: ''|'light'|'green'|'blue', className }
   */
  constructor(o = {}) {
    this.fill = el('div', { class: 'fill' });
    this.marker = o.marker ? el('div', { class: 'marker' }) : null;
    this.el = el('div', { class: `progress ${o.variant || ''} ${o.className || ''}`.trim(), role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 }, [this.fill, this.marker]);
    this.value = -1;
    this.set(0);
  }

  /** v in 0..1 */
  set(v) {
    v = clamp(v, 0, 1);
    if (Math.abs(v - this.value) < 0.001) return;
    this.value = v;
    const pct = `${(v * 100).toFixed(1)}%`;
    this.fill.style.width = pct;
    if (this.marker) this.marker.style.left = pct;
    this.el.setAttribute('aria-valuenow', Math.round(v * 100));
  }
}
