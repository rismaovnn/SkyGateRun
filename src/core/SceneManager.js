/**
 * SceneManager — screen router.
 *  go(name)   : replace the whole stack (with a fade transition)
 *  push(name) : open an overlay scene above the current one (Victory, Lose, Settings, Daily)
 *  pop()      : close the top overlay
 * Scene modules are lazy-loaded with dynamic import() so the first download stays small.
 */
import gsap from 'gsap';

const LOADERS = {
  splash: () => import('../scenes/SplashScene.js'),
  home: () => import('../scenes/HomeScene.js'),
  gameplay: () => import('../scenes/GameplayScene.js'),
  victory: () => import('../scenes/VictoryScene.js'),
  lose: () => import('../scenes/LoseScene.js'),
  shop: () => import('../scenes/ShopScene.js'),
  settings: () => import('../scenes/SettingsScene.js'),
  daily: () => import('../scenes/DailyRewardScene.js'),
  mission: () => import('../scenes/MissionScene.js'),
  leaderboard: () => import('../scenes/LeaderboardScene.js')
};

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.stack = [];       // [base, ...overlays]
    this.busy = false;
    this.fadeEl = document.getElementById('fade');
    this.cache = new Map(); // name → class
    game.engine.addUpdate((dt, t) => {
      for (const s of this.stack) s.update?.(dt, t);
    });
  }

  /** Module loader (also used by AssetLoader to preload). */
  loader(name) {
    return async () => {
      if (!this.cache.has(name)) {
        const mod = await LOADERS[name]();
        this.cache.set(name, Object.values(mod).find((v) => typeof v === 'function'));
      }
      return this.cache.get(name);
    };
  }

  get current() {
    return this.stack[this.stack.length - 1] || null;
  }

  get base() {
    return this.stack[0] || null;
  }

  async create(name, params) {
    const SceneClass = await this.loader(name)();
    const scene = new SceneClass(this.game);
    scene.name = name;
    await scene.enter(params || {});
    return scene;
  }

  /** Replace everything with a new scene. */
  async go(name, params) {
    if (this.busy) return;
    this.busy = true;
    try {
      const hasOld = this.stack.length > 0;
      if (hasOld) await this.fade(1, 0.18);
      while (this.stack.length) this.stack.pop().exit();
      const scene = await this.create(name, params);
      this.stack.push(scene);
      // The new scene is live: accept input while the fade-out plays.
      this.busy = false;
      if (hasOld) await this.fade(0, 0.26);
    } catch (err) {
      console.error('[SceneManager] go failed', name, err);
      this.fadeEl.style.opacity = 0;
    } finally {
      this.busy = false;
    }
  }

  /** Open an overlay on top of the current scene. */
  async push(name, params) {
    if (this.busy) return null;
    this.busy = true;
    try {
      this.current?.onCover?.();
      const scene = await this.create(name, params);
      this.stack.push(scene);
      return scene;
    } catch (err) {
      console.error('[SceneManager] push failed', name, err);
      return null;
    } finally {
      this.busy = false;
    }
  }

  /** Close the top overlay (never the base scene). */
  pop() {
    if (this.stack.length <= 1) return;
    const top = this.stack.pop();
    top.exit();
    this.current?.onUncover?.();
  }

  fade(to, duration) {
    this.fadeEl.style.pointerEvents = to > 0 ? 'auto' : 'none';
    return new Promise((resolve) => {
      gsap.to(this.fadeEl, { opacity: to, duration, ease: 'power1.inOut', onComplete: resolve });
    });
  }
}
