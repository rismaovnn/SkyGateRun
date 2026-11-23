/**
 * MissionManager — daily & weekly missions. Listens to gameplay events on the bus,
 * rotates sets at local midnight / Monday, grants rewards on claim.
 */
import { DAILY_POOL, WEEKLY_POOL, BONUS_CHEST } from '../data/missions.js';
import { dateKey, weekKey, seededRandom } from '../utils/Helpers.js';
import { bus } from './EventBus.js';

export class MissionManager {
  constructor(save) {
    this.save = save;
    this.ensure();
    // Gameplay → mission progress.
    bus.on('gate:pass', (e) => {
      if (e.positive) this.progress('gate_good', 1);
      if (e.op.type === 'mul') this.progress('gate_mul', 1);
      if (e.perfect) this.progress('perfect', 1);
    });
    bus.on('coin:collect', (e) => this.progress('coins', e.count || 1));
    bus.on('power:change', (e) => this.progress('power', e.power));
    bus.on('combo:change', (e) => this.progress('combo', e.combo));
    bus.on('boss:defeated', () => this.progress('boss', 1));
    bus.on('run:win', () => this.progress('wins', 1));
    bus.on('ad:watched', () => this.progress('ads', 1));
  }

  /** Build a new set if the day/week changed. */
  ensure() {
    const today = dateKey();
    const week = weekKey();
    const m = this.save.get('missions');
    let changed = false;
    if (!m.daily || m.daily.key !== today) {
      m.daily = this.generate(DAILY_POOL, today);
      changed = true;
    }
    if (!m.weekly || m.weekly.key !== week) {
      m.weekly = this.generate(WEEKLY_POOL, week);
      changed = true;
    }
    if (changed) this.save.set('missions', m);
  }

  generate(pool, key) {
    // Seed by the date so the set is stable for the whole day.
    let seed = 0;
    for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rng = seededRandom(seed);
    const copy = [...pool];
    const list = [];
    while (list.length < 4 && copy.length) {
      const def = copy.splice(Math.floor(rng() * copy.length), 1)[0];
      list.push({ id: `${key}-${def.type}`, ...def, value: 0, claimed: false });
    }
    return { key, list, bonusClaimed: false };
  }

  progress(type, amount) {
    this.ensure();
    const m = this.save.get('missions');
    let changed = false;
    for (const set of [m.daily, m.weekly]) {
      for (const mi of set.list) {
        if (mi.type !== type || mi.claimed || mi.value >= mi.target) continue;
        const next = mi.mode === 'max' ? Math.max(mi.value, amount) : mi.value + amount;
        if (next !== mi.value) {
          mi.value = Math.min(mi.target, next);
          changed = true;
        }
      }
    }
    if (changed) {
      this.save.set('missions', m);
      bus.emit('mission:changed');
    }
  }

  get(scope) {
    this.ensure();
    return this.save.get('missions')[scope];
  }

  /** Grant the reward of a completed mission. Returns the reward or null. */
  claim(scope, id) {
    const m = this.save.get('missions');
    const mi = m[scope].list.find((x) => x.id === id);
    if (!mi || mi.claimed || mi.value < mi.target) return null;
    mi.claimed = true;
    this.save.set('missions', m);
    this.grant(mi.reward);
    bus.emit('mission:changed');
    return mi.reward;
  }

  /** Bonus chest when all four are claimed. */
  claimBonus(scope) {
    const m = this.save.get('missions');
    const set = m[scope];
    if (set.bonusClaimed || set.list.some((x) => !x.claimed)) return null;
    set.bonusClaimed = true;
    this.save.set('missions', m);
    this.grant(BONUS_CHEST[scope]);
    bus.emit('mission:changed');
    return BONUS_CHEST[scope];
  }

  grant(reward) {
    if (reward.coins) this.save.addCoins(reward.coins);
    if (reward.gems) this.save.addGems(reward.gems);
  }

  /** Number of missions ready to claim (Home badge). */
  claimableCount() {
    this.ensure();
    const m = this.save.get('missions');
    return [...m.daily.list, ...m.weekly.list].filter((x) => !x.claimed && x.value >= x.target).length;
  }
}
