/**
 * VictoryScene — overlay after beating the boss: stars, coins earned, moving multiplier bar
 * (rewarded ad = claim × multiplier), Next Level and Home.
 */
import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { CurrencyBar } from '../ui/CurrencyBar.js';
import { TweenEffects } from '../effects/TweenEffects.js';
import { el, icon, formatNumber } from '../utils/Helpers.js';
import { ECONOMY } from '../utils/Constants.js';

export class VictoryScene extends BaseScene {
  async build(p) {
    const g = this.game;
    this.root.classList.add('overlay');
    this.p = p;
    this.claimed = false;
    this.reward = p.runCoins + ECONOMY.WIN_BASE_COINS + p.level * ECONOMY.WIN_COINS_PER_LEVEL;
    const bossPower = g.world?.finish.power || 1;
    const ratio = p.power / bossPower;
    const stars = ratio >= 2 ? 3 : ratio >= 1.4 ? 2 : 1;

    this.currency = new CurrencyBar(g, { gems: false });
    this.track(() => this.currency.destroy());

    // Multiplier bar.
    this.ptr = el('div', { class: 'mult-ptr' });
    const segs = ECONOMY.MULTIPLIERS.map((m, i) => el('div', { class: `mult-seg m${m}` }, [el('span', { class: 'num s' }, `×${m}`)]));
    const bar = el('div', { class: 'mult-bar' }, [...segs, this.ptr]);
    this.multLabel = el('span', { class: 'btn-label' }, this.t('claim_x', { n: 2 }));
    this.adBtn = Button.create(g, { color: 'purple', size: 'm', icon: 'video', className: 'shine claim-ad', onClick: () => this.claimAd() });
    this.adBtn.replaceChildren(icon('video', 24, 'shadow'), this.multLabel);

    const card = el('div', { class: 'panel result-card' }, [
      el('div', { class: 'earned' }, [icon('coin', 34), el('span', { class: 'num xl earned-num' }, `+${formatNumber(this.reward)}`)]),
      bar,
      this.adBtn
    ]);

    this.nextBtn = Button.create(g, { label: this.t('next_level'), icon: 'next', color: 'green', size: 'm', className: 'next-btn', onClick: () => this.next() });
    const homeBtn = Button.create(g, { icon: 'home', color: 'white', size: 'icon', className: 'home-sq', ariaLabel: this.t('home'), onClick: () => this.home() });

    const starEls = [0, 1, 2].map((i) => el('div', { class: `star s${i} ${i < stars ? 'on' : 'off'}` }, [icon('star', i === 1 ? 54 : 40)]));
    this.root.append(
      el('div', { class: 'rays win-rays' }),
      el('div', { class: 'win-top' }, [this.currency.el]),
      el('div', { class: 'ribbon level-ribbon' }, [el('span', { class: 'num' }, this.t('level_complete', { n: p.level }))]),
      el('div', { class: 'num xl gold win-title' }, this.t('victory')),
      el('div', { class: 'stars-row' }, starEls),
      card,
      el('div', { class: 'result-actions' }, [homeBtn, this.nextBtn])
    );

    // Entrance choreography.
    gsap.fromTo(this.root.querySelector('.win-title'), { scale: 0, rotation: -12 }, { scale: 1, rotation: -4, duration: 0.6, ease: 'back.out(2)' });
    starEls.forEach((s, i) => { if (i < stars) TweenEffects.pop(s, 0.3 + i * 0.2); });
    gsap.fromTo(card, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: 0.25, ease: 'back.out(1.6)' });
    gsap.fromTo(this.root.querySelector('.result-actions'), { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.9 });
    this.t0 = performance.now();
    g.audio.play('claim');
  }

  /** Multiplier under the pointer right now (ping-pong 1.8 s). */
  currentMultiplier() {
    const u = ((performance.now() - this.t0) / 1800) % 2;
    this.pos = u < 1 ? u : 2 - u;
    const idx = Math.min(ECONOMY.MULTIPLIERS.length - 1, Math.floor(this.pos * ECONOMY.MULTIPLIERS.length));
    return ECONOMY.MULTIPLIERS[idx];
  }

  update() {
    if (this.claimed || this.frozen || !this.root) return;
    const m = this.currentMultiplier();
    this.ptr.style.left = `${4 + this.pos * 92}%`;
    if (m !== this.lastM) {
      this.lastM = m;
      this.multLabel.textContent = this.t('claim_x', { n: m });
    }
  }

  async claimAd() {
    if (this.claimed) return;
    this.frozen = true;
    const m = this.currentMultiplier();
    const ok = await this.game.ads.showRewarded('victory_multiplier');
    if (!this.root) return;
    if (!ok) { this.frozen = false; return; }
    this.grant(this.reward * m);
    this.adBtn.disabled = true;
    Button.setLabel(this.adBtn, this.t('claimed'));
  }

  /** Give coins once, with the coin-fly animation into the counter. */
  grant(amount) {
    if (this.claimed) return;
    this.claimed = true;
    const g = this.game;
    const from = { x: 180, y: 380 };
    const to = this.currency.coinTarget();
    const per = Math.ceil(amount / 10);
    let given = 0;
    TweenEffects.coinsFly(this.root, from, to, 10, () => {
      const add = Math.min(per, amount - given);
      given += add;
      if (add > 0) g.save.addCoins(add);
      g.audio.play('coin', { throttle: 40 });
    });
    g.audio.play('claim');
  }

  next() {
    if (!this.claimed) this.game.save.addCoins(this.reward);
    this.claimed = true;
    this.game.scenes.go('gameplay', { level: this.p.level + 1 });
  }

  home() {
    if (!this.claimed) this.game.save.addCoins(this.reward);
    this.claimed = true;
    this.game.scenes.go('home');
  }
}
