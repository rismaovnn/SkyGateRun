/**
 * Toast — short non-blocking message that slides down from the top (2 s).
 */
import gsap from 'gsap';
import { el, icon } from '../utils/Helpers.js';

export class Toast {
  static show(game, text, iconName = 'check') {
    const node = el('div', { class: 'toast', role: 'status' }, [icon(iconName, 20), el('span', {}, text)]);
    game.engine.ui.appendChild(node);
    gsap.fromTo(node, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' });
    gsap.to(node, { opacity: 0, y: -10, duration: 0.25, delay: 1.9, onComplete: () => node.remove() });
  }
}
