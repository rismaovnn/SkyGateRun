/**
 * LeaderboardData — dummy rankings, deterministic per board + week so they don't reshuffle on every visit.
 * The player's real best score is inserted at its correct rank.
 */
import { seededRandom, weekKey, pick } from '../utils/Helpers.js';
import { SKINS } from './skins.js';

const NAMES = ['SkyRunner', 'GateMaster', 'BigPip', 'Nova', 'Rafi', 'Kirana', 'Mochi', 'TurboTom', 'Luna', 'Bimo', 'Zed', 'Ayu', 'Kenji', 'Sora', 'Maya',
  'Dimas', 'Leo', 'Nadia', 'Hugo', 'Putri', 'Arjun', 'Bella', 'Chen', 'Dewi', 'Elio', 'Fajar', 'Gita', 'Hana', 'Ivan', 'Joko'];

export class LeaderboardData {
  /**
   * @param {'global'|'friends'|'country'} board
   * @param {{name, score, skin}} player
   * @returns {{ top: Array<{name, score, skin, isMe}>, me: {rank, name, score, skin} }}
   */
  static build(board, player) {
    let seed = 0;
    for (const ch of board + weekKey()) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rng = seededRandom(seed);
    const size = board === 'friends' ? 12 : 50;
    const topScore = board === 'global' ? 520000 : board === 'country' ? 240000 : 60000;
    const list = [];
    for (let i = 0; i < size; i++) {
      const score = Math.round(topScore * Math.pow(0.9, i) * (0.92 + rng() * 0.08) / 10) * 10;
      list.push({ name: `${pick(rng, NAMES)}${rng() < 0.5 ? Math.floor(rng() * 99) : ''}`, score, skin: pick(rng, SKINS).id, isMe: false });
    }
    list.sort((a, b) => b.score - a.score);
    // Where would the player be?
    let rank = list.findIndex((e) => player.score > e.score);
    const me = { ...player, isMe: true };
    if (rank === -1) {
      // Below the visible list: estimate a global rank from the score gap.
      const last = list[list.length - 1].score;
      rank = size + Math.max(1, Math.round((last - player.score) / Math.max(10, last * 0.02)));
      return { top: list, me: { ...me, rank: rank + 1 } };
    }
    list.splice(rank, 0, me);
    list.pop();
    return { top: list, me: { ...me, rank: rank + 1 } };
  }
}
