/**
 * CurrencyBar — coin + diamond pills bound to the save. Values count up with GSAP when they change.
 */
import gsap from 'gsap';
import { el, icon, formatNumber } from '../utils/Helpers.js';
import { bus } from '../core/EventBus.js';

export class CurrencyBar {
  /**
   * @param {object} game
   * @param {object} o { plus: bool (show + buttons), onPlus: fn, gems: bool }
   */
  constructor(game, o = {}) {
    this.game = game;
    this.shown = { coins: game.save.get('coins'), gems: game.save.get('gems') };
    this.coinNum = el('span', { class: 'num' }, formatNumber(this.shown.coins));
    this.gemNum = el('span', { class: 'num' }, formatNumber(this.shown.gems));
    this.coinIcon = icon('coin', 26);
    const plus = (kind) => (o.plus ? el('button', { class: 'plus', 'aria-label': `Get more ${kind}`, onclick: () => o.onPlus?.(kind) }, '+') : null);
    this.coinPill = el('div', { class: `pill ${o.plus ? 'has-plus' : ''}` }, [this.coinIcon, this.coinNum, plus('coins')]);
    this.gemPill = el('div', { class: `pill ${o.plus ? 'has-plus' : ''}` }, [icon('gem', 26), this.gemNum, plus('gems')]);
    this.el = el('div', { class: 'currency-bar' }, [this.coinPill, o.gems === false ? null : this.gemPill]);

    this.offs = [
      bus.on('coins:changed', (v) => this.animate('coins', v)),
      bus.on('gems:changed', (v) => this.animate('gems', v))
    ];
  }

  /** Where coin "fly to HUD" effects should land (stage dp). */
  coinTarget() {
    const r = this.coinIcon.getBoundingClientRect();
    const f = this.game.engine.frame.getBoundingClientRect();
    const s = this.game.engine.stageScale;
    return { x: (r.left + r.width / 2 - f.left) / s, y: (r.top + r.height / 2 - f.top) / s };
  }

  /** Display an arbitrary value (used by HUD for "coins this run"). */
  setCoins(v) {
    this.animate('coins', v);
  }

  animate(kind, to) {
    const numEl = kind === 'coins' ? this.coinNum : this.gemNum;
    const obj = this.shown;
    gsap.killTweensOf(obj, kind);
    gsap.to(obj, {
      [kind]: to,
      duration: 0.35,
      ease: 'power1.out',
      onUpdate: () => { numEl.textContent = formatNumber(obj[kind]); }
    });
    gsap.fromTo(numEl.parentElement, { scale: 1.15 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
  }

  destroy() {
    this.offs.forEach((off) => off());
    gsap.killTweensOf(this.shown);
    this.el.remove();
  }
}
