/**
 * DailyRewardManager — 7-day login streak. Missing a day resets the streak to day 1.
 * State in save.daily: { streak: number of days claimed this cycle (0-7), lastClaim: 'YYYY-MM-DD' | null }
 */
import { DAILY_REWARDS } from '../data/missions.js';
import { dateKey, daysBetween, msUntilMidnight } from '../utils/Helpers.js';
import { bus } from './EventBus.js';

export class DailyRewardManager {
  constructor(save) {
    this.save = save;
    this.normalize();
  }

  /** Apply streak resets (missed day, finished cycle) before reading. */
  normalize() {
    const d = this.save.get('daily');
    const today = dateKey();
    if (!d.lastClaim) return;
    const gap = daysBetween(d.lastClaim, today);
    if (gap >= 2 || (gap >= 1 && d.streak >= 7)) {
      d.streak = 0;
      this.save.set('daily', d);
    }
  }

  get rewards() {
    return DAILY_REWARDS;
  }

  canClaim() {
    this.normalize();
    return this.save.get('daily').lastClaim !== dateKey();
  }

  /** Index (0-6) of the day that is claimable today, or was claimed today. */
  todayIndex() {
    this.normalize();
    const d = this.save.get('daily');
    return this.canClaim() ? d.streak : Math.max(0, d.streak - 1);
  }

  /** 'claimed' | 'today' | 'locked' for each of the 7 tiles. */
  states() {
    const idx = this.todayIndex();
    const can = this.canClaim();
    return DAILY_REWARDS.map((_, i) => {
      if (i < idx || (i === idx && !can)) return 'claimed';
      if (i === idx) return 'today';
      return 'locked';
    });
  }

  /** Claim today's reward (multiplier from the rewarded ad). Returns the granted reward or null. */
  claim(multiplier = 1) {
    if (!this.canClaim()) return null;
    const d = this.save.get('daily');
    const reward = { ...DAILY_REWARDS[d.streak] };
    const granted = { coins: 0, gems: 0, skin: null };
    if (reward.skin) {
      const owned = this.save.get('ownedSkins');
      if (!owned.includes(reward.skin)) {
        this.save.set('ownedSkins', [...owned, reward.skin]);
        granted.skin = reward.skin;
      } else {
        granted.coins += reward.fallbackCoins || 0;
      }
    }
    granted.coins += (reward.coins || 0) * multiplier;
    granted.gems += (reward.gems || 0) * multiplier;
    if (granted.coins) this.save.addCoins(granted.coins);
    if (granted.gems) this.save.addGems(granted.gems);
    d.streak += 1;
    d.lastClaim = dateKey();
    this.save.set('daily', d);
    bus.emit('daily:claimed', granted);
    return granted;
  }

  msUntilNext() {
    return msUntilMidnight();
  }
}
