/**
 * Button — factory for the 3D game buttons (gradient + gloss + 6dp depth, press animation in CSS).
 * Plays the tap sound and a light haptic on press.
 */
import { el, icon, vibrate } from '../utils/Helpers.js';

export class Button {
  /**
   * @param {object} game
   * @param {object} o { label, icon, color, size: 'l'|'m'|'s'|'icon', className, ariaLabel, onClick, sound }
   * @returns {HTMLButtonElement}
   */
  static create(game, o = {}) {
    const classes = ['btn', o.color || 'green', o.size || 'm', o.className || ''].join(' ').trim();
    const children = [];
    if (o.icon) children.push(icon(o.icon, o.iconSize || (o.size === 'l' ? 28 : 22), 'shadow'));
    if (o.label !== undefined && o.label !== null) children.push(el('span', { class: 'btn-label' }, o.label));
    const btn = el('button', { class: classes, type: 'button', 'aria-label': o.ariaLabel || o.label || o.icon }, children);
    btn.addEventListener('click', (e) => {
      if (btn.disabled) return;
      if (o.sound !== false) game.audio.play('tap');
      vibrate(10);
      o.onClick?.(e);
    });
    return btn;
  }

  /** Change the label text of a button made by create(). */
  static setLabel(btn, text) {
    const label = btn.querySelector('.btn-label');
    if (label) label.textContent = text;
  }
}
