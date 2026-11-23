/**
 * GameWorld — the 3D run: scene, camera, environment, track and all gameplay systems.
 * Created once and kept on `game.world`, so pooled gates/enemies/particles survive between levels.
 * GameplayScene drives it (rules + UI); GameWorld only simulates and renders.
 */
import * as THREE from 'three';
import { CAMERA } from '../utils/Constants.js';
import { Environment } from './Environment.js';
import { Track } from './Track.js';
import { Player } from './Player.js';
import { PlayerController } from './PlayerController.js';
import { CameraController } from './CameraController.js';
import { WeightSystem } from './WeightSystem.js';
import { GateSystem } from './GateSystem.js';
import { CoinSystem } from './CoinSystem.js';
import { EnemySystem } from './EnemySystem.js';
import { FinishSystem } from './FinishSystem.js';
import { ComboSystem } from './ComboSystem.js';
import { Particles, CELL } from '../effects/Particles.js';
import { ScreenShake } from '../effects/ScreenShake.js';
import { TRAILS } from '../data/trails.js';

export class GameWorld {
  constructor(game) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA.FOV, 9 / 16, 0.1, 160);
    this.env = new Environment(this.scene, { mode: 'run', seed: 3 });
    this.particles = new Particles(this.scene, game.assets.get('particles'));
    this.shake = new ScreenShake();
    this.player = new Player(game, this.scene);
    this.controller = new PlayerController(game.input, this.player);
    this.cameraCtl = new CameraController(this.camera, this.player, this.shake);
    this.weight = new WeightSystem(this.player.model);
    this.gates = new GateSystem(this.scene, game.assets, this.particles);
    this.coins = new CoinSystem(this.scene, this.particles);
    this.enemies = new EnemySystem(this.scene, this.particles);
    this.finish = new FinishSystem(this.scene, this.particles);
    this.combo = new ComboSystem();
    this.track = null;
    this.trailTimer = 0;
  }

  /** Reset everything for a level layout from LevelGenerator. */
  load(level, startPower) {
    this.level = level;
    this.track?.dispose();
    this.track = new Track(this.scene, this.game.assets, level.finishZ);
    this.gates.load(level);
    this.coins.load(level);
    this.enemies.load(level);
    this.finish.load(level);
    this.combo.reset();

    const p = this.player;
    p.state = 'ready';
    p.power = startPower;
    p.maxPower = startPower;
    p.position.set(0, 0, 0);
    p.prevZ = 0;
    p.model.group.rotation.set(0, Math.PI, 0);
    p.model.body.rotation.set(0, 0, 0);
    p.model.setSkin(this.game.save.get('equippedSkin'));
    p.model.setAnimation('idle');
    this.weight.set(startPower);
    this.controller.reset(0);
    this.cameraCtl.mode = 'follow';
    this.cameraCtl.snap();
    this.trail = TRAILS.find((t) => t.id === this.game.save.get('equippedTrail')) || TRAILS[0];
  }

  show() {
    const e = this.game.engine;
    e.setView(this.scene, this.camera);
    const fit = () => this.particles.setScale(e.height * e.renderer.getPixelRatio());
    fit();
    this.offResize?.();
    this.offResize = e.onResizeListen(fit);
  }

  /** 0..1 distance progress towards the finish line. */
  get progress() {
    if (!this.level) return 0;
    return Math.min(1, Math.max(0, this.player.position.z / this.level.finishZ));
  }

  /** Per-frame simulation. Callbacks come from GameplayScene. */
  update(dt, cb) {
    const p = this.player;
    this.controller.update(dt);
    p.update(dt);
    if (p.state === 'running') {
      this.gates.update(dt, p, cb.onGate);
      const got = this.coins.update(dt, p);
      if (got) cb.onCoins(got);
      this.enemies.update(dt, p, cb.onHit);
      if (this.finish.reached(p)) cb.onFinish();
      this.emitTrail(dt);
    } else {
      // Keep idle animations alive while not running.
      this.enemies.update(dt, p, () => {});
    }
    this.finish.update(dt);
    this.particles.update(dt);
    this.env.update(dt, p.position.z);
    this.cameraCtl.update(dt);
  }

  /** Running trail from the equipped trail item (pooled particles). */
  emitTrail(dt) {
    this.trailTimer -= dt;
    if (this.trailTimer > 0) return;
    this.trailTimer = 0.05;
    const p = this.player.position;
    const t = this.trail;
    this.particles.burst({ x: p.x, y: 0.25, z: p.z + 0.4 }, {
      count: 2, color: t.colors, cell: CELL[t.cell] ?? CELL.dot, speed: 0.4, up: t.up, size: t.size, life: 0.5, gravity: t.gravity
    });
  }

  dispose() {
    this.track?.dispose();
    this.gates.dispose();
    this.coins.dispose();
    this.enemies.dispose();
    this.finish.dispose();
    this.particles.dispose();
    this.player.dispose();
    this.env.dispose();
  }
}
