/**
 * LeaderboardScene — podium top 3, ranks 4–50 (dummy data, deterministic per week), and a sticky
 * "You" row with the player's real best score inserted at the right rank.
 * Swap `LeaderboardData.build()` for a backend call later (Firebase, PlayFab, Nakama…).
 */
import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { SkinThumb } from '../ui/SkinThumb.js';
import { LeaderboardData } from '../data/LeaderboardData.js';
import { el, icon, formatNumber, formatDuration, msUntilNextWeek } from '../utils/Helpers.js';

export class LeaderboardScene extends BaseScene {
  async build() {
    const g = this.game;
    this.board = 'global';
    const back = Button.create(g, { icon: 'back', color: 'white', size: 'icon', ariaLabel: this.t('back'), onClick: () => g.scenes.go('home') });
    this.tabs = el('div', { class: 'tabs lb-tabs' });
    this.podium = el('div', { class: 'podium' });
    this.list = el('div', { class: 'lb-list' });
    this.me = el('div', { class: 'lb-me' });
    this.season = el('div', { class: 'lb-season' });
    this.root.append(
      el('div', { class: 'topbar' }, [back, el('div', { class: 'num screen-title' }, this.t('leaderboard'))]),
      this.tabs,
      this.podium,
      el('div', { class: 'lb-sheet' }, [this.season, el('div', { class: 'lb-scroll' }, [this.list]), this.me])
    );
    this.render();
  }

  render() {
    const g = this.game;
    this.tabs.replaceChildren(...[['global', this.t('global')], ['friends', this.t('friends')], ['country', this.t('country')]].map(([k, l]) =>
      el('button', { class: `tab ${k === this.board ? 'active' : ''}`, type: 'button', onclick: () => { this.board = k; g.audio.play('tap'); this.render(); } }, l)));

    const { top, me } = LeaderboardData.build(this.board, { name: this.t('you'), score: g.save.get('bestScore'), skin: g.save.get('equippedSkin') });
    const [first, second, third] = top;
    const place = (e, n) => el('div', { class: `pod pod${n} ${e.isMe ? 'is-me' : ''}` }, [
      n === 1 ? icon('crown', 30, 'pod-crown') : null,
      el('div', { class: 'pod-av' }, [SkinThumb.el(e.skin, n === 1 ? 40 : 34)]),
      el('div', { class: 'pod-name' }, e.name),
      el('div', { class: 'pod-block' }, [el('span', { class: 'num' }, String(n)), el('span', { class: 'pod-score' }, formatNumber(e.score))])
    ]);
    this.podium.replaceChildren(place(second, 2), place(first, 1), place(third, 3));
    this.list.replaceChildren(...top.slice(3).map((e, i) => el('div', { class: `lb-row ${e.isMe ? 'is-me' : ''}` }, [
      el('span', { class: 'lb-rank' }, String(i + 4)),
      el('span', { class: 'lb-av' }, [SkinThumb.el(e.skin, 24)]),
      el('span', { class: 'lb-name' }, e.name),
      el('span', { class: 'lb-score' }, formatNumber(e.score))
    ])));
    this.me.replaceChildren(
      el('span', { class: 'num lb-me-rank' }, me.rank > 999 ? '999+' : String(me.rank)),
      el('span', { class: 'lb-av' }, [SkinThumb.el(me.skin, 26)]),
      el('span', { class: 'lb-name' }, me.name),
      el('span', { class: 'num' }, formatNumber(me.score))
    );
    this.season.replaceChildren(icon('gift', 22), el('span', { class: 'lb-season-text' }, this.t('season_reward')), el('span', { class: 'lb-season-time' }, formatDuration(msUntilNextWeek())));
    gsap.fromTo(this.podium.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.6)' });
  }
}
