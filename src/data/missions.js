/**
 * Mission pools. `mode`: 'add' accumulates, 'max' keeps the best value of a single run.
 * Text keys are looked up in data/strings.js with {n} replaced by the target.
 */
export const DAILY_POOL = [
  { type: 'gate_good', mode: 'add', target: 15, reward: { coins: 150 }, icon: 'gate' },
  { type: 'gate_mul', mode: 'add', target: 6, reward: { coins: 150 }, icon: 'gate' },
  { type: 'coins', mode: 'add', target: 150, reward: { coins: 100 }, icon: 'coin' },
  { type: 'boss', mode: 'add', target: 3, reward: { coins: 200 }, icon: 'crown' },
  { type: 'perfect', mode: 'add', target: 5, reward: { coins: 120 }, icon: 'star' },
  { type: 'power', mode: 'max', target: 150, reward: { coins: 150 }, icon: 'bolt' },
  { type: 'combo', mode: 'max', target: 4, reward: { coins: 120 }, icon: 'star' },
  { type: 'wins', mode: 'add', target: 3, reward: { coins: 150 }, icon: 'trophy' }
];

export const WEEKLY_POOL = [
  { type: 'boss', mode: 'add', target: 25, reward: { coins: 1000 }, icon: 'crown' },
  { type: 'power', mode: 'max', target: 600, reward: { coins: 800 }, icon: 'bolt' },
  { type: 'ads', mode: 'add', target: 10, reward: { gems: 15 }, icon: 'video' },
  { type: 'combo', mode: 'max', target: 8, reward: { coins: 900 }, icon: 'star' },
  { type: 'gate_good', mode: 'add', target: 150, reward: { coins: 900 }, icon: 'gate' },
  { type: 'coins', mode: 'add', target: 1500, reward: { gems: 10 }, icon: 'coin' },
  { type: 'perfect', mode: 'add', target: 40, reward: { coins: 800 }, icon: 'star' }
];

/** Reward for claiming all 4 missions of a set. */
export const BONUS_CHEST = { daily: { gems: 5 }, weekly: { gems: 25 } };

/** 7-day login calendar. Day 7 grants the Rainbow skin (or coins if already owned). */
export const DAILY_REWARDS = [
  { coins: 100 },
  { coins: 150 },
  { coins: 200 },
  { gems: 5 },
  { coins: 300 },
  { gems: 10 },
  { gems: 50, skin: 'rainbow', fallbackCoins: 500 }
];
