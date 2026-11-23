/**
 * InputManager — one-finger drag (swipe-to-steer) + keyboard fallback for desktop.
 * Gameplay reads `consumeDeltaX()` every frame: the horizontal finger movement in stage dp since last frame.
 */
export class InputManager {
  constructor(engine) {
    this.engine = engine;
    this.target = engine.frame;
    this.pointerId = null;
    this.lastX = 0;
    this.deltaX = 0;
    this.isDown = false;
    this.keys = { left: false, right: false };
    this.enabled = false;
    this.listeners = { down: new Set() };

    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.onKey = this.onKey.bind(this);

    this.target.addEventListener('pointerdown', this.onDown, { passive: true });
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerup', this.onUp, { passive: true });
    window.addEventListener('pointercancel', this.onUp, { passive: true });
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
  }

  /** Steering only listens while gameplay is running. */
  setEnabled(on) {
    this.enabled = on;
    this.deltaX = 0;
    this.isDown = false;
    this.pointerId = null;
  }

  /** Subscribe to "finger down anywhere" (used to dismiss the tutorial hint). */
  onPointerDown(fn) {
    this.listeners.down.add(fn);
    return () => this.listeners.down.delete(fn);
  }

  onDown(e) {
    if (!this.enabled) return;
    // Ignore touches that start on UI buttons.
    if (e.target.closest && e.target.closest('button, a, .no-steer')) return;
    this.pointerId = e.pointerId;
    this.isDown = true;
    this.lastX = e.clientX;
    for (const fn of this.listeners.down) fn(e);
  }

  onMove(e) {
    if (!this.enabled || !this.isDown || e.pointerId !== this.pointerId) return;
    const dx = e.clientX - this.lastX;
    this.lastX = e.clientX;
    this.deltaX += dx / this.engine.stageScale;   // convert screen px → stage dp
  }

  onUp(e) {
    if (e.pointerId !== this.pointerId) return;
    this.isDown = false;
    this.pointerId = null;
  }

  onKey(e) {
    const down = e.type === 'keydown';
    if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = down;
    if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = down;
    if (down && this.enabled && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      for (const fn of this.listeners.down) fn(e);
    }
  }

  /** Horizontal movement (stage dp) since the last call. Keyboard adds a constant speed. */
  consumeDeltaX(dt) {
    let d = this.deltaX;
    this.deltaX = 0;
    const keyDir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    d += keyDir * 260 * dt;
    return d;
  }
}
