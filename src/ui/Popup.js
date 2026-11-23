/**
 * Popup — modal panel with a title ribbon, optional close button, dimmed backdrop and spring open/close.
 */
import gsap from 'gsap';
import { el } from '../utils/Helpers.js';
import { Button } from './Button.js';

export class Popup {
  /**
   * @param {object} game
   * @param {object} o { title, ribbon: ''|'pink'|'red', onClose, closable: true, className, dim: true }
   */
  constructor(game, o = {}) {
    this.game = game;
    this.o = o;
    this.body = el('div', { class: 'popup-body' });
    const children = [
      el('div', { class: `ribbon ${o.ribbon || ''}` }, [el('span', { class: 'num' }, o.title || '')]),
      this.body
    ];
    if (o.closable !== false) {
      children.push(Button.create(game, { icon: 'close', color: 'red', size: 'icon', className: 'modal-close', ariaLabel: 'Close', onClick: () => this.close() }));
    }
    this.panel = el('div', { class: `panel modal ${o.className || ''}`.trim(), role: 'dialog', 'aria-label': o.title || 'Dialog' }, children);
    this.backdrop = o.dim === false ? null : el('div', { class: 'dim' });
    this.el = el('div', { class: 'popup' }, [this.backdrop, this.panel]);
  }

  /** Mount into a parent and play the open animation. */
  open(parent) {
    parent.appendChild(this.el);
    if (this.backdrop) gsap.fromTo(this.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(this.panel, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.8)' });
    this.game.audio.play('whoosh');
    return this;
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    if (this.backdrop) gsap.to(this.backdrop, { opacity: 0, duration: 0.18 });
    gsap.to(this.panel, {
      scale: 0.9, opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        this.el.remove();
        this.o.onClose?.();
      }
    });
  }

  /** Remove instantly (scene exit). */
  destroy() {
    gsap.killTweensOf([this.backdrop, this.panel]);
    this.el.remove();
  }
}
