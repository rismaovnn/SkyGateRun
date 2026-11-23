/**
 * SaveManager — persistent player data in localStorage.
 * Every write goes through set()/mutate() so listeners (currency bars, badges) stay in sync.
 */
import { SAVE_KEY } from '../utils/Constants.js';
import { bus } from './EventBus.js';

const DEFAULTS = () => ({
  coins: 0,
  gems: 10,
  level: 1,
  bestScore: 0,
  bestPower: 0,
  ownedSkins: ['default'],
  equippedSkin: 'default',
  ownedTrails: ['sparkle'],
  equippedTrail: 'sparkle',
  adProgress: {},                                  // skin id → rewarded ads watched (ad-unlock skins)
  settings: { music: true, sound: true, vibration: true, lang: 'en' },
  daily: { streak: 0, lastClaim: null },           // streak = days already claimed in the current 7-day cycle
  missions: { daily: null, weekly: null },        // filled by MissionManager
  stats: { runs: 0, wins: 0 },
  tutorialDone: false,
  playerName: 'You'
});

export class SaveManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    const base = DEFAULTS();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      // Shallow-merge so new fields added in updates get defaults.
      return {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings || {}) },
        daily: { ...base.daily, ...(parsed.daily || {}) },
        missions: { ...base.missions, ...(parsed.missions || {}) },
        stats: { ...base.stats, ...(parsed.stats || {}) }
      };
    } catch (err) {
      console.warn('[Save] corrupted save, resetting', err);
      return base;
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.warn('[Save] could not write save', err);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
    bus.emit('save:changed', { key });
  }

  /** Run a function that edits `data` in place, then persist. */
  mutate(fn) {
    fn(this.data);
    this.save();
    bus.emit('save:changed', { key: '*' });
  }

  addCoins(n) {
    this.data.coins = Math.max(0, Math.round(this.data.coins + n));
    this.save();
    bus.emit('coins:changed', this.data.coins);
  }

  addGems(n) {
    this.data.gems = Math.max(0, Math.round(this.data.gems + n));
    this.save();
    bus.emit('gems:changed', this.data.gems);
  }

  /** Spend currency; returns false when the player cannot afford it. */
  spend(currency, amount) {
    const key = currency === 'gems' ? 'gems' : 'coins';
    if (this.data[key] < amount) return false;
    if (key === 'gems') this.addGems(-amount);
    else this.addCoins(-amount);
    return true;
  }

  setting(name, value) {
    if (value === undefined) return this.data.settings[name];
    this.data.settings[name] = value;
    this.save();
    bus.emit('settings:changed', { name, value });
    return value;
  }

  reset() {
    this.data = DEFAULTS();
    this.save();
    bus.emit('save:changed', { key: '*' });
  }
}
