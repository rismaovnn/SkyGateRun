/**
 * LoseScene — overlay after failing: why you lost, how far you got, a 5-second revive offer
 * (rewarded ad or gems), Try Again and Home.
 */
import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { ProgressBar } from '../ui/ProgressBar.js';
import { Toast } from '../ui/Toast.js';
import { TweenEffects } from '../effects/TweenEffects.js';
import { el, icon, formatNumber } from '../utils/Helpers.js';
import { GAME } from '../utils/Constants.js';

const RING = 2 * Math.PI * 30;

export class LoseScene extends BaseScene {
  async build(p) {
    const g = this.game;
    this.root.classList.add('overlay');
    this.p = p;
    this.done = false;

    const reasonText = {
      boss: this.t('reason_boss'),
      enemy: this.t('reason_enemy'),
      saw: this.t('reason_saw'),
      gate: this.t('reason_gate')
    }[p.reason] || this.t('reason_enemy');

    const bar = new ProgressBar({ marker: true, variant: 'light' });
    const compare = p.reason === 'boss'
      ? el('div', { class: 'compare' }, [
        el('div', { class: 'cmp you' }, [el('span', {}, this.t('you')), el('span', { class: 'num' }, formatNumber(p.power))]),
        el('span', { class: 'cmp-lt' }, '<'),
        el('div', { class: 'cmp boss' }, [el('span', {}, this.t('boss')), el('span', { class: 'num', style: { color: '#FF9CCB' } }, formatNumber(p.bossPower))])
      ])
      : null;

    const card = el('div', { class: 'panel lose-card' }, [
      el('div', { class: 'lose-reason' }, reasonText),
      compare,
      el('div', { class: 'lose-progress' }, [
        el('div', { class: 'lp-row' }, [el('span', {}, this.t('progress')), el('span', {}, `${Math.round(p.progress * 100)}%`)]),
        bar.el
      ]),
      el('div', { class: 'lose-tip' }, this.t(p.reason === 'boss' ? 'tip_1' : 'tip_dodge'))
    ]);

    // Revive offer with countdown ring.
    this.reviveBox = null;
    if (p.canRevive) {
      this.ringCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 76 76');
      svg.setAttribute('width', '76');
      svg.setAttribute('height', '76');
      svg.innerHTML = '<circle cx="38" cy="38" r="30" fill="#fff" stroke="rgba(255,255,255,.4)" stroke-width="8"/>';
      Object.entries({ cx: 38, cy: 38, r: 30, fill: 'none', stroke: '#EC4899', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-dasharray': RING, transform: 'rotate(-90 38 38)' }).forEach(([k, v]) => this.ringCircle.setAttribute(k, v));
      svg.appendChild(this.ringCircle);
      this.countNum = el('span', { class: 'num xl' }, String(GAME.REVIVE_SECONDS));
      const ring = el('div', { class: 'revive-ring' }, [svg, el('div', { class: 'ring-num' }, [this.countNum])]);
      const adBtn = Button.create(g, { label: this.t('revive'), icon: 'video', color: 'purple', size: 'm', onClick: () => this.reviveAd() });
      const gemBtn = Button.create(g, { label: String(GAME.REVIVE_COST_GEMS), icon: 'gem', color: 'pink', size: 'm', onClick: () => this.reviveGems(gemBtn) });
      this.reviveBox = el('div', { class: 'revive-box' }, [ring, el('div', { class: 'revive-btns' }, [adBtn, gemBtn]), el('div', { class: 'revive-note' }, this.t('revive_note'))]);
    }

    const actions = el('div', { class: 'result-actions' }, [
      Button.create(g, { icon: 'home', color: 'white', size: 'icon', className: 'home-sq', ariaLabel: this.t('home'), onClick: () => this.leave('home') }),
      Button.create(g, { label: this.t('try_again'), icon: 'retry', color: 'green', size: 'm', className: 'next-btn', onClick: () => this.leave('retry') })
    ]);

    this.root.append(el('div', { class: 'lose-vignette' }), el('div', { class: 'num xl lose-title' }, this.t('oops')), card, this.reviveBox, actions);
    bar.set(p.progress);

    gsap.fromTo(this.root.querySelector('.lose-title'), { rotation: -6, scale: 0.6 }, { rotation: 3, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    gsap.fromTo(card, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.6)' });
    if (this.reviveBox) {
      TweenEffects.pop(this.reviveBox, 0.2);
      this.remaining = GAME.REVIVE_SECONDS;
      this.lastTick = GAME.REVIVE_SECONDS;
    }
  }

  /** Countdown (real time, keeps running even though gameplay is frozen). */
  update(dt) {
    if (!this.reviveBox || this.done || this.inAd) return;
    this.remaining -= dt / (this.game.engine.timeScale || 1);
    const s = Math.max(0, Math.ceil(this.remaining));
    this.ringCircle.setAttribute('stroke-dashoffset', String(RING * (1 - Math.max(0, this.remaining) / GAME.REVIVE_SECONDS)));
    if (s !== this.lastTick) {
      this.lastTick = s;
      this.countNum.textContent = String(s);
      TweenEffects.punch(this.countNum, 1.3);
      if (s > 0) this.game.audio.play('tick');
    }
    if (this.remaining <= 0) this.expire();
  }

  expire() {
    const box = this.reviveBox;
    this.reviveBox = null;
    gsap.to(box, { opacity: 0, scale: 0.8, duration: 0.25, onComplete: () => box.remove() });
  }

  async reviveAd() {
    this.inAd = true;
    const ok = await this.game.ads.showRewarded('revive');
    this.inAd = false;
    if (ok && this.root) this.revive();
  }

  reviveGems(btn) {
    if (!this.game.save.spend('gems', GAME.REVIVE_COST_GEMS)) {
      TweenEffects.shake(btn);
      Toast.show(this.game, this.t('not_enough_gems'), 'gem');
      return;
    }
    this.revive();
  }

  revive() {
    if (this.done) return;
    this.done = true;
    const gameplay = this.game.scenes.base;
    this.game.audio.play('claim');
    this.game.scenes.pop();
    gameplay?.revive?.();
  }

  leave(where) {
    if (this.done) return;
    this.done = true;
    const gameplay = this.game.scenes.base;
    gameplay?.bankRunCoins?.();
    if (where === 'home') this.game.scenes.go('home');
    else this.game.scenes.go('gameplay', { level: this.p.level || this.game.save.get('level') });
  }
}
