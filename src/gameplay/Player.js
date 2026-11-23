/**
 * Player — owns the character model, the power value and the run state.
 * Moves along −Z; lateral position comes from the PlayerController.
 */
import * as THREE from 'three';
import { GAME } from '../utils/Constants.js';
import { CharacterModel } from './CharacterModel.js';
import { bus } from '../core/EventBus.js';

export class Player {
  constructor(game, scene) {
    this.game = game;
    this.model = new CharacterModel({ skin: game.save.get('equippedSkin'), blobTexture: game.assets.get('blob') });
    this.model.group.rotation.y = Math.PI;      // face the run direction (−Z)
    scene.add(this.model.group);
    this.position = this.model.group.position;  // shared Vector3 (x lateral, z forward)
    this.power = GAME.START_POWER;
    this.maxPower = this.power;
    this.speed = GAME.RUN_SPEED;
    this.state = 'ready';                        // ready | running | finish | won | lost
    this.lean = 0;                               // lateral velocity, drives body + camera tilt
    this.prevZ = 0;
    this.trailTimer = 0;
  }

  get radius() {
    return this.model.radius * 0.8;
  }

  get height() {
    return this.model.height;
  }

  start(speed) {
    this.speed = speed;
    this.state = 'running';
    this.model.setAnimation('run');
  }

  /** Change power by a delta or to a value; emits power:change. */
  setPower(value) {
    const before = this.power;
    this.power = Math.max(0, Math.round(value));
    this.maxPower = Math.max(this.maxPower, this.power);
    bus.emit('power:change', { power: this.power, delta: this.power - before });
    return this.power;
  }

  update(dt) {
    this.prevZ = this.position.z;
    if (this.state === 'running') {
      this.position.z -= this.speed * dt;
      this.model.runSpeed = this.speed / GAME.RUN_SPEED;
    }
    // Lean into turns (body roll) — subtle, purely visual.
    this.model.group.rotation.z = THREE.MathUtils.lerp(this.model.group.rotation.z, -this.lean * 0.05, Math.min(1, dt * 8));
    this.model.update(dt);
  }

  dispose() {
    this.model.dispose();
  }
}
