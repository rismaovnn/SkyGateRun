/**
 * LevelGenerator — builds a deterministic level layout from the level number.
 * Layout (all z negative, the player runs towards −Z):
 *   gate rows every ROW_SPACING, with coins / enemy squads / saws in between, then the finish + boss.
 * The boss power is derived from a simulated "good run" so every level is beatable.
 */
import { GAME } from '../utils/Constants.js';
import { seededRandom, randInt, clamp } from '../utils/Helpers.js';

const ROW_SPACING = 24;
const LANES = [-2, 2];
const round5 = (v) => Math.max(5, Math.round(v / 5) * 5);

export class LevelGenerator {
  /** @returns {{level, speed, rows, coins, enemies, saws, finishZ, bossPower}} */
  static generate(level) {
    const rng = seededRandom(level * 9973 + 17);
    const rowCount = clamp(5 + Math.floor(level / 2), 5, 12);
    const rows = [];
    const coins = [];
    const enemies = [];
    const saws = [];

    let best = GAME.START_POWER;   // simulated power when always picking the better gate
    let z = -22;

    for (let r = 0; r < rowCount; r++) {
      const row = LevelGenerator.makeRow(rng, level, r, best);
      row.z = z;
      rows.push(row);
      best = Math.max(LevelGenerator.apply(best, row.left), LevelGenerator.apply(best, row.right));

      // Content between this row and the next one.
      const midZ = z - ROW_SPACING / 2;
      const roll = rng();
      if (level >= 2 && roll < 0.38) {
        // Enemy squad in one lane — dodge it or pay its power.
        const lane = LANES[randInt(rng, 0, 1)];
        const count = randInt(rng, 1, Math.min(3, 1 + Math.floor(level / 3)));
        for (let i = 0; i < count; i++) {
          const power = Math.round(Math.max(4 + level, best * (0.12 + rng() * 0.14)));
          enemies.push({ x: lane + (i - (count - 1) / 2) * 1.1, z: midZ - i * 0.4, power });
        }
        LevelGenerator.coinLine(coins, -lane, midZ + 4, 5);
      } else if (level >= 3 && roll < 0.6) {
        // Spinning saw sweeping across the track.
        saws.push({ x: 0, z: midZ, range: 2.6, speed: 1.4 + rng() * 1.2 + level * 0.03, phase: rng() * Math.PI * 2, damage: Math.round(Math.max(8 + level, best * 0.15)) });
        LevelGenerator.coinLine(coins, LANES[randInt(rng, 0, 1)], midZ + 5, 3);
      } else {
        LevelGenerator.coinLine(coins, rng() < 0.5 ? LANES[randInt(rng, 0, 1)] : 0, midZ + 5, 7, rng() < 0.4);
      }
      z -= ROW_SPACING;
    }

    const finishZ = z - GAME.FINISH_PADDING + ROW_SPACING / 2;
    // Boss: a fraction of the perfect-path power, growing with level (cap keeps it fair).
    const ratio = clamp(0.55 + level * 0.025, 0.55, 0.95);
    const bossPower = Math.max(15, Math.round(best * ratio));
    const speed = Math.min(GAME.RUN_SPEED_MAX, GAME.RUN_SPEED + level * GAME.RUN_SPEED_PER_LEVEL);
    return { level, speed, rows, coins, enemies, saws, finishZ, bossPower, bestPossible: best };
  }

  /** One pair of gates. `best` = current simulated power, used to keep numbers meaningful. */
  static makeRow(rng, level, r, best) {
    // Values scale with the power you are expected to have, so gates stay meaningful all run long.
    const addV = () => round5(Math.max(10 + rng() * 15 + r * 4 + level, best * (0.18 + rng() * 0.17)));
    const subV = () => round5(Math.max(5, best * (0.2 + rng() * 0.25)));
    const mulChance = Math.min(0.32, 0.2 + level * 0.01);
    const good = () => (rng() < mulChance && best < 2500
      ? { type: 'mul', v: level > 6 && rng() < 0.15 ? 3 : 2 }
      : { type: 'add', v: addV() });
    const bad = () => (best > 60 && rng() < 0.4 ? { type: 'div', v: 2 } : { type: 'sub', v: subV() });

    const kind = rng();
    let left;
    let right;
    if (kind < 0.55) {
      [left, right] = [good(), bad()];          // classic: good vs bad
    } else if (kind < 0.85) {
      [left, right] = [{ type: 'add', v: addV() }, { type: 'mul', v: 2 }]; // which is better *now*?
    } else {
      [left, right] = [good(), null];          // single gate, empty lane
    }
    if (rng() < 0.5) [left, right] = [right, left];
    return { left, right };
  }

  static coinLine(out, x, startZ, count, zigzag = false) {
    for (let i = 0; i < count; i++) {
      out.push({ x: zigzag ? Math.sin(i * 0.9) * 2 : x, z: startZ - i * 1.8 });
    }
  }

  /** Apply a gate operation to a power value. */
  static apply(power, op) {
    if (!op) return power;
    switch (op.type) {
      case 'add': return power + op.v;
      case 'sub': return power - op.v;
      case 'mul': return power * op.v;
      case 'div': return Math.floor(power / op.v);
      default: return power;
    }
  }

  /** Text shown on a gate. */
  static label(op) {
    const sym = { add: '+', sub: '−', mul: '×', div: '÷' }[op.type];
    return `${sym}${op.v}`;
  }
}
