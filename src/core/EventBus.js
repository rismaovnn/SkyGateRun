/**
 * EventBus — minimal pub/sub so systems never import each other directly.
 * Events used in the game (payloads in brackets):
 *   coins:changed / gems:changed   [newValue]
 *   gate:pass       [{ op, positive, perfect, before, after, x, z }]
 *   coin:collect    [{ count }]
 *   enemy:hit       [{ power }]
 *   combo:change    [{ combo }]
 *   power:change    [{ power, delta }]
 *   run:win / run:lose  [{ ... }]
 *   boss:defeated, ad:watched, mission:changed, save:changed
 */
export class EventBus {
  constructor() {
    this.map = new Map();
  }

  /** Subscribe; returns an unsubscribe function. */
  on(type, fn) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type).add(fn);
    return () => this.off(type, fn);
  }

  off(type, fn) {
    this.map.get(type)?.delete(fn);
  }

  emit(type, payload) {
    const set = this.map.get(type);
    if (!set) return;
    for (const fn of [...set]) {
      try { fn(payload); } catch (err) { console.error(`[EventBus] ${type} handler failed`, err); }
    }
  }
}

/** Shared singleton. */
export const bus = new EventBus();
