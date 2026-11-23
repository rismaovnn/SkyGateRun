/**
 * MissionScene — daily & weekly missions with progress bars, claim buttons and a bonus chest
 * for completing the whole set. Progress comes from MissionManager (fed by gameplay events).
 */
import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { CurrencyBar } from '../ui/CurrencyBar.js';
import { ProgressBar } from '../ui/ProgressBar.js';
import { Toast } from '../ui/Toast.js';
import { TweenEffects } from '../effects/TweenEffects.js';
import { el, icon, formatNumber, formatDuration, msUntilMidnight, msUntilNextWeek } from '../utils/Helpers.js';
import { bus } from '../core/EventBus.js';

export class MissionScene extends BaseScene {
  async build() {
    const g = this.game;
    this.scope = 'daily';
    this.currency = new CurrencyBar(g);
    this.track(() => this.currency.destroy());
    const back = Button.create(g, { icon: 'back', color: 'white', size: 'icon', ariaLabel: this.t('back'), onClick: () => g.scenes.go('home') });
    const topbar = el('div', { class: 'topbar' }, [back, el('div', { class: 'num screen-title' }, this.t('missions')), this.currency.el]);

    this.chestBar = new ProgressBar({});
    this.chestCount = el('span', { class: 'num s' }, '0/4');
    this.chestBtn = el('button', { class: 'chest-btn', type: 'button', 'aria-label': this.t('bonus_chest'), onclick: () => this.claimBonus() }, [icon('chest', 44)]);
    const chest = el('div', { class: 'chest-card glass' }, [
      el('div', { class: 'chest-info' }, [el('div', { class: 'chest-row' }, [el('span', { class: 'num s' }, this.t('bonus_chest')), this.chestCount]), this.chestBar.el]),
      this.chestBtn
    ]);
    this.tabs = el('div', { class: 'tabs mission-tabs' });
    this.timer = el('div', { class: 'mission-timer' });
    this.list = el('div', { class: 'mission-list' });
    this.root.append(topbar, chest, this.tabs, this.timer, el('div', { class: 'mission-scroll' }, [this.list]));
    this.render();
    this.every(1000, () => this.renderTimer());
    this.track(bus.on('mission:changed', () => this.render()));
  }

  render() {
    if (!this.root) return;
    const m = this.game.missions;
    const set = m.get(this.scope);
    this.tabs.replaceChildren(...[['daily', this.t('daily')], ['weekly', this.t('weekly')]].map(([k, l]) =>
      el('button', { class: `tab ${k === this.scope ? 'active' : ''}`, type: 'button', onclick: () => { this.scope = k; this.game.audio.play('tap'); this.render(); } }, l)));

    // Completed-but-unclaimed first, then in progress, then claimed.
    const order = (x) => (x.claimed ? 2 : x.value >= x.target ? 0 : 1);
    const sorted = [...set.list].sort((a, b) => order(a) - order(b));
    this.list.replaceChildren(...sorted.map((mi) => this.row(mi)));

    const claimed = set.list.filter((x) => x.claimed).length;
    this.chestCount.textContent = `${claimed}/4`;
    this.chestBar.set(claimed / 4);
    const ready = claimed === 4 && !set.bonusClaimed;
    this.chestBtn.classList.toggle('ready', ready);
    this.chestBtn.classList.toggle('opened', set.bonusClaimed);
    this.renderTimer();
  }

  row(mi) {
    const done = mi.value >= mi.target;
    const bar = new ProgressBar({ variant: `light ${done ? 'green' : 'blue'}` });
    bar.set(mi.value / mi.target);
    const reward = mi.reward.coins ? [icon('coin', 14), formatNumber(mi.reward.coins)] : [icon('gem', 14), formatNumber(mi.reward.gems)];
    let btn;
    if (mi.claimed) btn = Button.create(this.game, { label: this.t('done'), color: 'green', size: 's', className: 'mi-btn' });
    else if (done) btn = Button.create(this.game, { label: this.t('claim'), color: 'green', size: 's', className: 'mi-btn pulse', onClick: () => this.claim(mi, btn) });
    else btn = Button.create(this.game, { label: this.t('go'), color: 'blue', size: 's', className: 'mi-btn', onClick: () => this.game.scenes.go('gameplay') });
    if (mi.claimed) btn.disabled = true;
    const iconName = { gate: 'gate', coin: 'coin', crown: 'crown', star: 'star', bolt: 'bolt', trophy: 'trophy', video: 'adfree' }[mi.icon] || 'target';
    return el('div', { class: `mi-row ${mi.claimed ? 'claimed' : ''}` }, [
      el('div', { class: 'mi-ic' }, [icon(iconName, 26)]),
      el('div', { class: 'mi-body' }, [
        el('div', { class: 'mi-title' }, this.t(`m_${mi.type}`, { n: formatNumber(mi.target) })),
        el('div', { class: 'mi-prog' }, [bar.el, el('span', {}, `${formatNumber(mi.value)}/${formatNumber(mi.target)}`)]),
        el('div', { class: 'mi-reward' }, reward)
      ]),
      btn
    ]);
  }

  renderTimer() {
    if (!this.root) return;
    const ms = this.scope === 'daily' ? msUntilMidnight() : msUntilNextWeek();
    this.timer.textContent = this.t('reset_in', { time: formatDuration(ms) });
  }

  claim(mi, btn) {
    const reward = this.game.missions.claim(this.scope, mi.id);
    if (!reward) return;
    this.game.audio.play('claim');
    const r = btn.getBoundingClientRect();
    const f = this.game.engine.frame.getBoundingClientRect();
    const s = this.game.engine.stageScale;
    TweenEffects.coinsFly(this.root, { x: (r.left - f.left + r.width / 2) / s, y: (r.top - f.top) / s }, this.currency.coinTarget(), 6);
  }

  claimBonus() {
    const reward = this.game.missions.claimBonus(this.scope);
    if (!reward) {
      TweenEffects.shake(this.chestBtn);
      return;
    }
    this.game.audio.play('claim');
    gsap.fromTo(this.chestBtn, { rotation: -12, scale: 1.3 }, { rotation: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    Toast.show(this.game, this.t('chest_reward', { n: reward.gems }), 'gem');
  }
}
