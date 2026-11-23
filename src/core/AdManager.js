/**
 * AdManager — rewarded-ad placeholder.
 * Shows a 3-second fake ad overlay and resolves `true`. Replace `showRewarded()` with your ad SDK
 * (AdMob via Capacitor, CrazyGames SDK, Poki SDK, GameDistribution…) without touching the scenes.
 */
import { el } from '../utils/Helpers.js';
import { bus } from './EventBus.js';

export class AdManager {
  constructor(game) {
    this.game = game;
    this.showing = false;
  }

  /** @returns {Promise<boolean>} true when the reward should be granted */
  showRewarded(placement = 'generic') {
    if (this.showing) return Promise.resolve(false);
    this.showing = true;
    this.game.engine.paused = true;
    this.game.audio.setPaused(true);
    return new Promise((resolve) => {
      let left = 3;
      const counter = el('div', { class: 'ad-count num' }, String(left));
      const overlay = el('div', { class: 'ad-overlay' }, [
        el('div', { class: 'ad-box' }, [
          el('div', { class: 'ad-label' }, 'AD'),
          el('div', { class: 'ad-title' }, 'Rewarded video'),
          el('div', { class: 'ad-sub' }, `placement: ${placement}`),
          counter
        ])
      ]);
      this.game.engine.ui.appendChild(overlay);
      const timer = setInterval(() => {
        left--;
        counter.textContent = String(Math.max(left, 0));
        if (left <= 0) {
          clearInterval(timer);
          overlay.remove();
          this.showing = false;
          this.game.engine.paused = false;
          this.game.audio.setPaused(false);
          bus.emit('ad:watched', { placement });
          resolve(true);
        }
      }, 1000);
    });
  }
}
