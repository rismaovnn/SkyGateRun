/**
 * HomeScene — main menu over the 3D showcase. PLAY sits in the thumb zone; meta shortcuts around it.
 */
import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { CurrencyBar } from '../ui/CurrencyBar.js';
import { Showcase } from '../gameplay/Showcase.js';
import { el, icon, formatNumber } from '../utils/Helpers.js';
import { ECONOMY } from '../utils/Constants.js';
import { bus } from '../core/EventBus.js';

let dailyAutoShown = false; // auto-open the daily popup once per session

export class HomeScene extends BaseScene {
  async build() {
    const g = this.game;
    g.showcase ||= new Showcase(g);
    g.showcase.character.setSkin(g.save.get('equippedSkin'));
    g.showcase.show('home');
    g.audio.playMusic('menu');

    // --- top bar ---
    this.currency = new CurrencyBar(g, { plus: true, onPlus: () => g.scenes.go('shop') });
    const settingsBtn = Button.create(g, { icon: 'settings', color: 'blue', size: 'icon', ariaLabel: this.t('settings'), onClick: () => g.scenes.push('settings') });
    const topbar = el('div', { class: 'topbar' }, [this.currency.el, el('div', { class: 'spacer' }), settingsBtn]);

    // --- logo + best ---
    const logo = el('div', { class: 'logo home-logo' }, [
      el('div', { class: 'num xl logo-top' }, 'SKY GATE'),
      el('div', { class: 'num xl gold logo-bottom' }, 'RUN!')
    ]);
    const best = el('div', { class: 'best-chip glass' }, [icon('crown', 20), el('span', { class: 'best-label' }, this.t('best')), el('span', { class: 'num' }, formatNumber(g.save.get('bestScore')))]);

    // --- side shortcuts ---
    this.dailyBadge = el('span', { class: 'badge' }, '!');
    this.missionBadge = el('span', { class: 'badge' }, '0');
    const side = (iconName, label, badge, onClick, extra = '') =>
      el('button', { class: 'side', type: 'button', 'aria-label': label, onclick: () => { g.audio.play('tap'); onClick(); } }, [
        el('span', { class: `ic ${extra}` }, [icon(iconName, 32), badge]),
        el('span', { class: 'num s' }, label)
      ]);
    const left = el('div', { class: 'side-col left' }, [
      side('gift', this.t('daily'), this.dailyBadge, () => g.scenes.push('daily'), g.daily.canClaim() ? 'shake-loop' : ''),
      side('target', this.t('missions'), this.missionBadge, () => g.scenes.go('mission'))
    ]);
    const right = el('div', { class: 'side-col right' }, [
      side('trophy', this.t('rank'), null, () => g.scenes.go('leaderboard')),
      side('adfree', this.t('free'), null, () => this.freeCoins())
    ]);

    // --- play ---
    const level = g.save.get('level');
    this.playBtn = Button.create(g, {
      label: this.t('play'), icon: 'play', size: 'l', color: 'green', className: 'pulse shine play-btn',
      onClick: () => g.scenes.go('gameplay', { level })
    });
    const play = el('div', { class: 'play-area' }, [el('div', { class: 'num level-label' }, this.t('level_n', { n: level })), this.playBtn]);

    const bottom = el('div', { class: 'home-bottom' }, [
      Button.create(g, { label: this.t('skins'), icon: 'shirt', color: 'blue', size: 's', onClick: () => g.scenes.go('shop', { tab: 'skins' }) }),
      Button.create(g, { label: this.t('trails'), icon: 'bag', color: 'orange', size: 's', onClick: () => g.scenes.go('shop', { tab: 'trails' }) }),
      Button.create(g, { label: this.t('rank'), icon: 'cup', color: 'purple', size: 's', onClick: () => g.scenes.go('leaderboard') })
    ]);

    this.root.append(topbar, logo, best, left, right, play, bottom);
    this.refreshBadges();
    this.track(bus.on('mission:changed', () => this.refreshBadges()));
    this.track(bus.on('daily:claimed', () => this.refreshBadges()));
    this.track(() => this.currency.destroy());

    // Entrance animation.
    gsap.fromTo(logo, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
    gsap.fromTo(play, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: 0.1, ease: 'back.out(1.6)' });

    if (!dailyAutoShown && g.daily.canClaim()) {
      dailyAutoShown = true;
      setTimeout(() => { if (this.root && g.scenes.current === this) g.scenes.push('daily'); }, 600);
    }
  }

  refreshBadges() {
    if (!this.root) return;
    const n = this.game.missions.claimableCount();
    this.missionBadge.textContent = String(n);
    this.missionBadge.classList.toggle('hidden', n === 0);
    this.dailyBadge.classList.toggle('hidden', !this.game.daily.canClaim());
    this.dailyBadge.parentElement.classList.toggle('shake-loop', this.game.daily.canClaim());
  }

  async freeCoins() {
    const ok = await this.game.ads.showRewarded('home_free_coins');
    if (!ok) return;
    this.game.save.addCoins(ECONOMY.FREE_COINS_AD);
    this.game.audio.play('claim');
    this.game.showcase.cheer();
  }

  /** Overlay closed (Settings/Daily) → refresh. */
  onUncover() {
    this.refreshBadges();
  }

  exit() {
    this.game.showcase?.hide();
    super.exit();
  }
}
