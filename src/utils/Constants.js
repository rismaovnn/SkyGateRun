/**
 * Constants.js — every tunable number of the game lives here.
 * Units: world units ≈ metres, time in seconds, UI in dp (1 dp = 1 CSS px of the 360×640 stage).
 */

/** Design grid of the UI stage (the 9:16 mockups). */
export const STAGE = { WIDTH: 360, HEIGHT: 640, ASPECT: 9 / 16 };

/** Brand colours (mirror of styles/tokens.css, for Three.js materials & canvas drawing). */
export const COLORS = {
  sky: 0x38b6ff,
  skyTop: 0x2fa8ff,
  skyBottom: 0xd6f3ff,
  cyan: 0x22d3ee,
  green: 0x22c55e,
  orange: 0xff8a1f,
  yellow: 0xffd23f,
  blue: 0x2563eb,
  purple: 0x8b5cf6,
  pink: 0xff5fa8,
  red: 0xf43f5e,
  ink: 0x0f172a,
  white: 0xffffff,
  track: 0xf4f9ff,
  trackSide: 0xb9cde6,
  grass: 0x4ade80,
  rock: 0x8fa3c8
};

/** Gate type → visual + gameplay meaning. Colour + symbol, never colour alone. */
export const GATE_TYPES = {
  add: { color: 0x22d3ee, css: '#67E8F9', symbol: '+', positive: true },
  mul: { color: 0x22c55e, css: '#7CF29C', symbol: '×', positive: true },
  sub: { color: 0xf43f5e, css: '#FF8A9A', symbol: '−', positive: false },
  div: { color: 0x8b5cf6, css: '#B794FF', symbol: '÷', positive: false }
};

/** Core gameplay tuning. */
export const GAME = {
  START_POWER: 10,
  RUN_SPEED: 10,              // units / second
  RUN_SPEED_PER_LEVEL: 0.12,  // speed added per level
  RUN_SPEED_MAX: 15,
  TRACK_WIDTH: 8,
  PLAYER_X_LIMIT: 3.1,        // clamp of the player's lateral position
  SWIPE_SENSITIVITY: 0.035,   // world units per stage-px of finger movement
  STEER_LERP: 14,             // how fast the body follows the finger (per second)
  GATE_WIDTH: 3.6,
  GATE_PERFECT_RANGE: 0.55,   // |x - gateCenter| under this = PERFECT
  ENEMY_RADIUS: 0.55,
  COIN_RADIUS: 0.9,
  COIN_VALUE: 1,
  START_Z: 0,
  FINISH_PADDING: 12,         // distance from last obstacle to finish line
  POWER_FOR_MAX_BODY: 600,    // at this power the body reaches its biggest proportions
  REVIVE_POWER_MULT: 1.5,
  REVIVE_COST_GEMS: 10,
  REVIVE_SECONDS: 5,
  SCORE_PER_POWER: 10
};

/** Camera framing. Player runs towards −Z; camera sits behind (+Z) and above. */
export const CAMERA = {
  FOV: 55,
  OFFSET_Y: 5.2,
  OFFSET_Z: 8.6,
  LOOK_AHEAD: 6,
  FOLLOW_LERP: 6,       // per second
  X_FOLLOW: 0.55,       // camera follows only part of the lateral motion
  TILT_MAX: 0.07,       // radians of roll when turning
  TILT_LERP: 5,
  SIZE_ZOOM: 0.55       // extra distance per unit of body growth
};

/** Economy. */
export const ECONOMY = {
  WIN_BASE_COINS: 40,
  WIN_COINS_PER_LEVEL: 8,
  MULTIPLIERS: [2, 3, 5, 3, 2],
  FREE_COINS_AD: 100
};

/** Save key in localStorage (bump the version to reset old saves). */
export const SAVE_KEY = 'sky-gate-run/save/v1';

/** Debug: `?speed=3` speeds the simulation up; `?level=8` starts on a level. */
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const DEBUG = {
  timeScale: Math.min(10, Math.max(0.1, Number(params.get('speed')) || 1)),
  startLevel: Number(params.get('level')) || 0,
  showFps: params.has('fps')
};
