/**
 * GameplayScene — game rules + state machine on top of GameWorld, and the HUD.
 * States: ready → running → finish (boss clash) → won | lost
 */
import { BaseScene } from './BaseScene.js';
import { GameWorld } from '../gameplay/GameWorld.js';
import { LevelGenerator } from '../gameplay/LevelGenerator.js';
import { HUD } from '../ui/HUD.js';
import { Popup } from '../ui/Popup.js';
import { Button } from '../ui/Button.js';
import { Confetti } from '../effects/Confetti.js';
import { GAME, DEBUG } from '../utils/Constants.js';
import { vibrate } from '../utils/Helpers.js';
import { bus } from '../core/EventBus.js';

let debugLevelUsed = false;

export class GameplayScene extends BaseScene {
  async build(params) {
    const g = this.game;
    let level = params.level || g.save.get('level');
    if (DEBUG.startLevel && !debugLevelUsed) { level = DEBUG.startLevel; debugLevelUsed = true; }
    this.levelNum = level;
    this.levelData = LevelGenerator.generate(level);
    this.world = g.world ||= new GameWorld(g);
    this.world.load(this.levelData, GAME.START_POWER);
    this.world.show();
    this.player = this.world.player;
    this.runCoins = 0;
    this.revived = false;
    this.invulnerable = 0;
    this.state = 'ready';
    this.baseTimeScale = g.engine.timeScale;
    this.confetti = g.confetti ||= new Confetti(g.engine);

    this.hud = new HUD(g, this.root, { onPause: () => this.pause(), onSettings: () => this.openSettings() });
    this.hud.setLevel(level);
    this.hud.setCoins(0);

    this.world.controller.setEnabled(true);
    this.track(g.input.onPointerDown(() => this.start()));
    this.track(g.engine.addUpdate((dt) => this.tick(dt)));
    this.track(() => this.world.controller.setEnabled(false));
    this.callbacks = {
      onGate: (r) => this.onGate(r),
      onCoins: (n) => this.onCoins(n),
      onHit: (e) => this.onHit(e),
      onFinish: () => this.onFinish()
    };
    g.audio.playMusic('run');
    g.engine.canvas.classList.remove('desat');
    bus.emit('run:start', { level });
  }

  /** First touch starts the run. */
  start() {
    if (this.state !== 'ready' || this.game.engine.paused) return;
    this.state = 'running';
    this.player.start(this.levelData.speed);
    this.game.save.mutate((d) => { d.stats.runs++; });
    if (this.levelNum <= 2 && !this.game.save.get('tutorialDone')) {
      this.hud.showHint(this.t('swipe_to_move'));
      setTimeout(() => this.hud?.hideHint(), 2600);
      if (this.levelNum === 2) this.game.save.set('tutorialDone', true);
    } else {
      this.hud.hideHint();
    }
    vibrate(15);
  }

  tick(dt) {
    if (this.invulnerable > 0) this.invulnerable -= dt;
    this.world.update(dt, this.callbacks);
    this.hud.update(this.world);
  }

  /* ---------------- gameplay events ---------------- */

  onGate(r) {
    const p = this.player;
    const before = p.power;
    // Gates never kill: they can drain you to 1, only enemies, saws and the boss can finish you.
    let after = Math.max(1, LevelGenerator.apply(before, r.op));
    const combo = this.world.combo.register(r, after);
    after += combo.bonus;
    p.setPower(after);
    this.world.weight.to(p.power);
    const audio = this.game.audio;
    const headPos = { x: p.position.x, y: p.height + 0.4, z: p.position.z };
    this.hud.float(LevelGenerator.label(r.op), headPos, this.world.camera, { color: HUD.gateColor(r.op), size: 30, dx: 46 });
    if (r.positive) {
      audio.play('gate_good', { rate: 1 + Math.min(combo.combo, 8) * 0.04 });
      vibrate(12);
    } else {
      audio.play('gate_bad');
      this.world.shake.add(0.25);
      p.model.hitFlash();
      vibrate([20, 30, 20]);
    }
    if (r.perfect && r.positive) {
      this.hud.perfect();
      audio.play('perfect');
      this.world.particles.burst({ x: p.position.x, y: p.height, z: p.position.z }, { count: 14, color: [0xffd23f, 0xffffff], cell: 0, speed: 4, up: 5, size: 0.8 });
      this.slowMo();
    }
    this.hud.setCombo(combo.combo);
    if (combo.combo >= 3) audio.play('combo');
  }

  onCoins(n) {
    this.runCoins += n * GAME.COIN_VALUE;
    this.hud.setCoins(this.runCoins);
    this.game.audio.play('coin', { throttle: 60 });
  }

  onHit(e) {
    if (this.invulnerable > 0) return;
    const p = this.player;
    p.setPower(p.power - e.power);
    this.world.weight.to(p.power);
    this.world.combo.register({ positive: false, perfect: false }, p.power);
    this.hud.setCombo(0);
    this.world.shake.add(0.45);
    p.model.hitFlash();
    this.game.audio.play('hit');
    vibrate(35);
    this.hud.float(`−${e.power}`, { x: p.position.x, y: p.height + 0.4, z: p.position.z }, this.world.camera, { color: '#FF8A9A', size: 30, dx: -46 });
    if (p.power <= 0) this.lose(e.kind === 'saw' ? 'saw' : 'enemy');
  }

  async onFinish() {
    if (this.state !== 'running') return;
    this.state = 'finish';
    this.player.state = 'finish';
    this.world.controller.setEnabled(false);
    this.world.cameraCtl.mode = 'boss';
    this.hud.banner(this.t('fight'));
    await this.clash();
  }

  async clash() {
    const { won } = await this.world.finish.clash(this.player, {
      onImpact: () => {
        this.world.shake.add(0.75);
        this.game.audio.play('hit');
        vibrate(60);
      }
    });
    if (!this.root) return;
    if (won) this.win();
    else this.lose('boss');
  }

  slowMo() {
    const e = this.game.engine;
    e.timeScale = this.baseTimeScale * 0.85;
    clearTimeout(this.slowTimer);
    this.slowTimer = setTimeout(() => { e.timeScale = this.baseTimeScale; }, 140);
  }

  /* ---------------- results ---------------- */

  win() {
    this.state = 'won';
    this.player.state = 'won';
    const g = this.game;
    const power = this.player.power;
    const score = power * GAME.SCORE_PER_POWER;
    bus.emit('boss:defeated', { level: this.levelNum });
    bus.emit('run:win', { level: this.levelNum, power });
    g.save.mutate((d) => {
      d.stats.wins++;
      d.level = Math.max(d.level, this.levelNum + 1);
      d.bestScore = Math.max(d.bestScore, score);
      d.bestPower = Math.max(d.bestPower, power);
    });
    this.confetti.fire(90);
    g.audio.play('win');
    vibrate([30, 40, 30]);
    setTimeout(() => {
      if (!this.root) return;
      g.scenes.push('victory', { level: this.levelNum, runCoins: this.runCoins, power, score, combo: this.world.combo.best });
    }, 1100);
  }

  lose(reason) {
    if (this.state === 'lost' || this.state === 'won') return;
    this.state = 'lost';
    this.loseReason = reason;
    this.player.state = 'lost';
    this.player.model.setAnimation('fall');
    this.world.controller.setEnabled(false);
    this.game.engine.canvas.classList.add('desat');
    this.game.audio.play('lose');
    vibrate([60, 40, 60]);
    bus.emit('run:lose', { reason, level: this.levelNum });
    setTimeout(() => {
      if (!this.root) return;
      this.game.scenes.push('lose', {
        reason,
        level: this.levelNum,
        progress: this.world.progress,
        power: this.player.power,
        bossPower: this.world.finish.power,
        canRevive: !this.revived
      });
    }, 750);
  }

  /** Second chance (called by LoseScene after an ad or gems). */
  revive() {
    this.revived = true;
    this.game.engine.canvas.classList.remove('desat');
    const p = this.player;
    p.model.body.rotation.set(0, 0, 0);
    if (this.loseReason === 'boss') {
      p.setPower(Math.ceil(this.world.finish.power * 1.1));
      this.world.weight.to(p.power);
      this.state = 'finish';
      p.state = 'finish';
      this.world.finish.state = 'idle';
      setTimeout(() => this.clash(), 500);
      return;
    }
    p.setPower(Math.max(GAME.START_POWER, Math.ceil(p.maxPower * 0.5 * GAME.REVIVE_POWER_MULT)));
    this.world.weight.to(p.power);
    this.invulnerable = 1.5;
    this.state = 'running';
    p.start(this.levelData.speed);
    this.world.controller.setEnabled(true);
  }

  /** Coins picked up during a lost run are kept when leaving the run. */
  bankRunCoins() {
    if (this.runCoins > 0) this.game.save.addCoins(this.runCoins);
    this.runCoins = 0;
  }

  /* ---------------- pause / settings ---------------- */

  pause() {
    if (this.pausePopup || this.state === 'won' || this.state === 'lost') return;
    const g = this.game;
    g.engine.paused = true;
    this.world.controller.setEnabled(false);
    this.pausePopup = new Popup(g, { title: this.t('paused'), onClose: () => this.resume() });
    this.pausePopup.body.append(
      Object.assign(document.createElement('div'), { className: 'pause-actions' })
    );
    const actions = this.pausePopup.body.firstChild;
    actions.append(
      Button.create(g, { label: this.t('resume'), icon: 'play', color: 'green', size: 'm', onClick: () => this.pausePopup.close() }),
      Button.create(g, { label: this.t('restart'), icon: 'retry', color: 'blue', size: 'm', onClick: () => { this.closePause(); this.bankRunCoins(); g.scenes.go('gameplay', { level: this.levelNum }); } }),
      Button.create(g, { label: this.t('home'), icon: 'home-w', color: 'orange', size: 'm', onClick: () => { this.closePause(); this.bankRunCoins(); g.scenes.go('home'); } })
    );
    this.pausePopup.open(this.root);
    this.pausePopup.el.style.pointerEvents = 'auto';
  }

  closePause() {
    this.pausePopup?.destroy();
    this.pausePopup = null;
    this.game.engine.paused = false;
  }

  resume() {
    this.pausePopup = null;
    this.game.engine.paused = false;
    if (this.state === 'running' || this.state === 'ready') this.world.controller.setEnabled(true);
  }

  openSettings() {
    this.game.engine.paused = true;
    this.world.controller.setEnabled(false);
    this.game.scenes.push('settings');
  }

  /** An overlay (Settings / Victory / Lose) opened above us. */
  onCover() {
    this.world.controller.setEnabled(false);
    // Result screens get a clean stage.
    if (this.state === 'won' || this.state === 'lost') this.hud?.el.classList.add('hidden');
  }

  /** Overlay closed. */
  onUncover() {
    this.hud?.el.classList.remove('hidden');
    if (this.pausePopup) return;
    this.game.engine.paused = false;
    if (this.state === 'running' || this.state === 'ready') this.world.controller.setEnabled(true);
  }

  exit() {
    clearTimeout(this.slowTimer);
    this.game.engine.timeScale = this.baseTimeScale;
    this.game.engine.paused = false;
    this.game.engine.canvas.classList.remove('desat');
    this.pausePopup?.destroy();
    this.hud?.destroy();
    this.confetti?.clear();
    super.exit();
    this.hud = null;
  }
}
