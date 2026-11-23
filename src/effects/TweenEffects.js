/**
 * TweenEffects — reusable GSAP micro-animations for DOM elements.
 */
import gsap from 'gsap';
import { el, icon } from '../utils/Helpers.js';

export class TweenEffects {
  /** Scale pop-in: 0 → 1.2 → 1. */
  static pop(node, delay = 0) {
    return gsap.fromTo(node, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, delay, ease: 'back.out(2.5)' });
  }

  /** Quick punch scale (counter updates, combo stack). */
  static punch(node, amount = 1.18) {
    return gsap.fromTo(node, { scale: amount }, { scale: 1, duration: 0.28, ease: 'back.out(3)' });
  }

  /** Horizontal shake (wrong action, not enough currency). */
  static shake(node) {
    return gsap.fromTo(node, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
  }

  /** Floating text that rises and fades. `parent` is the UI stage. */
  static floatText(parent, text, x, y, o = {}) {
    const node = el('div', { class: `float-text num ${o.className || ''}`, style: { left: `${x}px`, top: `${y}px`, color: o.color || '#fff', fontSize: `${o.size || 28}px` } }, text);
    parent.appendChild(node);
    gsap.fromTo(node, { y: 0, opacity: 0, scale: 0.6 }, { y: -18, opacity: 1, scale: 1, duration: 0.18, ease: 'back.out(2)' });
    gsap.to(node, { y: -60, opacity: 0, duration: 0.6, delay: 0.25, ease: 'power1.in', onComplete: () => node.remove() });
    return node;
  }

  /**
   * Coins fly from a point to the currency counter (bezier-ish via two tweens), then call onEach per coin.
   */
  static coinsFly(parent, from, to, count = 8, onEach) {
    for (let i = 0; i < count; i++) {
      const c = el('div', { class: 'fly-coin', style: { left: `${from.x}px`, top: `${from.y}px` } }, [icon('coin', 26)]);
      parent.appendChild(c);
      const dx = (Math.random() - 0.5) * 120;
      const dy = (Math.random() - 0.5) * 80 - 30;
      gsap.timeline({ delay: i * 0.05, onComplete: () => { c.remove(); onEach?.(i); } })
        .to(c, { x: dx, y: dy, duration: 0.25, ease: 'power2.out' })
        .to(c, { x: to.x - from.x, y: to.y - from.y, scale: 0.7, duration: 0.45, ease: 'power2.in' });
    }
  }
}
