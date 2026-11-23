/**
 * Confetti — 2D canvas overlay (cheap, crisp). Two cannons from the bottom corners, pooled particles,
 * runs only while particles are alive.
 */
const COLORS = ['#FF5FA8', '#FFD23F', '#22C55E', '#2563EB', '#8B5CF6', '#FF8A1F', '#22D3EE'];

export class Confetti {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.getElementById('fx2d');
    this.ctx = this.canvas.getContext('2d');
    this.pool = Array.from({ length: 160 }, () => ({ alive: false }));
    this.running = false;
    this.tick = this.tick.bind(this);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.engine.width;
    const h = this.engine.height;
    if (this.canvas.width !== Math.round(w * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
  }

  /** Fire both cannons. */
  fire(amount = 80) {
    this.resize();
    let spawned = 0;
    for (const p of this.pool) {
      if (p.alive || spawned >= amount) continue;
      const left = spawned % 2 === 0;
      const a = (left ? -1 : -1) * (Math.PI / 2) + (left ? 0.45 : -0.45) + (Math.random() - 0.5) * 0.7;
      const sp = (0.9 + Math.random() * 0.7) * this.h * 1.4;
      Object.assign(p, {
        alive: true,
        x: left ? this.w * 0.05 : this.w * 0.95,
        y: this.h * 0.95,
        vx: Math.cos(a) * sp * 0.6,
        vy: Math.sin(a) * sp,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 12,
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 8,
        round: Math.random() < 0.25,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 2.4 + Math.random()
      });
      spawned++;
    }
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.tick);
    }
  }

  tick(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const g = this.ctx;
    g.clearRect(0, 0, this.w, this.h);
    let alive = 0;
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life -= dt;
      p.vy += this.h * 1.6 * dt;   // gravity
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.life <= 0 || p.y > this.h + 30) { p.alive = false; continue; }
      alive++;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.globalAlpha = Math.min(1, p.life);
      g.fillStyle = p.color;
      if (p.round) { g.beginPath(); g.arc(0, 0, p.w / 2, 0, Math.PI * 2); g.fill(); } else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot)));
      g.restore();
    }
    if (alive) requestAnimationFrame(this.tick);
    else { this.running = false; g.clearRect(0, 0, this.w, this.h); }
  }

  clear() {
    for (const p of this.pool) p.alive = false;
  }
}
