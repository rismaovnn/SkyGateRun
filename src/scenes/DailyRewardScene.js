/**
 * DailyRewardScene — overlay with the 7-day login calendar. Claim (or ×2 with a rewarded ad),
 * cooldown timer to the next reward, Day 7 = Rainbow skin.
 */
import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { Popup } from '../ui/Popup.js';
import { Button } from '../ui/Button.js';
import { SkinThumb } from '../ui/SkinThumb.js';
import { Toast } from '../ui/Toast.js';
import { TweenEffects } from '../effects/TweenEffects.js';
import { el, icon, formatNumber, formatDuration } from '../utils/Helpers.js';

export class DailyRewardScene extends BaseScene {
  async build() {
    const g = this.game;
    this.root.classList.add('overlay');
    this.popup = new Popup(g, { title: this.t('daily_reward'), ribbon: 'pink', className: 'daily-modal', onClose: () => g.scenes.pop() });
    this.grid = el('div', { class: 'daily-grid' });
    this.day7 = el('div', { class: 'day7' });
    this.claimBtn = Button.create(g, { label: '', color: 'green', size: 'm', onClick: () => this.claim(1) });
    this.adBtn = Button.create(g, { label: this.t('claim_x2'), icon: 'video', color: 'purple', size: 's', onClick: () => this.claimAd() });
    this.timer = el('div', { class: 'daily-timer' }, '');
    this.popup.body.append(el('div', { class: 'daily-sub' }, this.t('daily_sub')), this.grid, this.day7, this.claimBtn, this.adBtn, this.timer);
    this.popup.open(this.root);
    this.track(() => this.popup.destroy());
    this.render();
    this.every(1000, () => this.renderTimer());
  }

  rewardNodes(r) {
    const out = [];
    if (r.coins) out.push(el('span', { class: 'rw' }, [icon('coin', 30), el('span', { class: 'num s' }, formatNumber(r.coins))]));
    if (r.gems) out.push(el('span', { class: 'rw' }, [icon('gem', 30), el('span', { class: 'num s' }, formatNumber(r.gems))]));
    return out;
  }

  render() {
    const d = this.game.daily;
    const states = d.states();
    const rewards = d.rewards;
    this.grid.replaceChildren(...rewards.slice(0, 6).map((r, i) => {
      const st = states[i];
      const label = st === 'today' ? this.t('today') : this.t('day_n', { n: i + 1 });
      const corner = st === 'claimed' ? el('span', { class: 'corner ok' }, [icon('check', 18)]) : st === 'locked' ? el('span', { class: 'corner lock' }, [icon('lock', 16)]) : null;
      return el('div', { class: `day-tile ${st}` }, [el('span', { class: 'day-label' }, label), ...this.rewardNodes(r), corner]);
    }));
    const r7 = rewards[6];
    const st7 = states[6];
    this.day7.className = `day7 ${st7}`;
    this.day7.replaceChildren(
      el('div', { class: 'rays day7-rays' }),
      SkinThumb.el('rainbow', 40, 'day7-skin'),
      el('div', { class: 'day7-text' }, [el('span', { class: 'num' }, st7 === 'today' ? this.t('today') : this.t('day_n', { n: 7 })), el('span', { class: 'day7-sub' }, this.t('day7_reward', { gems: r7.gems }))]),
      st7 === 'claimed' ? icon('check', 24) : st7 === 'locked' ? icon('lock', 22) : null
    );
    const can = d.canClaim();
    const today = rewards[d.todayIndex()];
    this.claimBtn.disabled = !can;
    Button.setLabel(this.claimBtn, can ? `${this.t('claim')} ${today.skin ? '' : formatNumber(today.coins || today.gems)}`.trim() : this.t('come_back'));
    this.adBtn.classList.toggle('hidden', !can);
    this.renderTimer();
  }

  renderTimer() {
    if (!this.root) return;
    this.timer.textContent = this.t('next_reward_in', { time: formatDuration(this.game.daily.msUntilNext()) });
  }

  async claimAd() {
    const ok = await this.game.ads.showRewarded('daily_x2');
    if (ok && this.root) this.claim(2);
  }

  claim(mult) {
    const g = this.game;
    const idx = g.daily.todayIndex();
    const granted = g.daily.claim(mult);
    if (!granted) return;
    g.audio.play('claim');
    const tile = idx < 6 ? this.grid.children[idx] : this.day7;
    if (tile) gsap.fromTo(tile, { scale: 1.15 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
    if (granted.coins) TweenEffects.coinsFly(this.root, { x: 180, y: 320 }, { x: 40, y: 40 }, 8);
    if (granted.skin) Toast.show(g, this.t('unlocked', { name: 'Rainbow' }), 'gift');
    this.render();
  }
}
