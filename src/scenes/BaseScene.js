/**
 * BaseScene — shared lifecycle for every screen.
 * Subclasses override build(params) to create DOM inside `this.root`, and may set up 3D via engine.setView().
 * Anything registered through `this.track(disposer)` is cleaned up automatically on exit().
 */
import { el } from '../utils/Helpers.js';

export class BaseScene {
  constructor(game) {
    this.game = game;
    this.root = null;
    this.disposers = [];
  }

  /** Short-hand translator. */
  t(key, vars) {
    return this.game.i18n.t(key, vars);
  }

  async enter(params) {
    this.root = el('div', { class: `screen screen-${this.constructor.name.replace('Scene', '').toLowerCase()}` });
    this.game.engine.ui.appendChild(this.root);
    await this.build(params);
  }

  /** Override in subclasses. */
  async build() {}

  /** Keep a cleanup function (event unsubscribes, timers, engine updates). */
  track(disposer) {
    this.disposers.push(disposer);
    return disposer;
  }

  /** setInterval that is cleared on exit. */
  every(ms, fn) {
    const id = setInterval(fn, ms);
    this.track(() => clearInterval(id));
    return id;
  }

  exit() {
    for (const d of this.disposers.splice(0)) {
      try { d(); } catch (err) { console.warn('[Scene] dispose failed', err); }
    }
    this.root?.remove();
    this.root = null;
  }
}
