/**
 * Showcase — the 3D "stage" behind Home and Shop: Pip idling on a floating island.
 * Created once and reused (kept on game.showcase) so switching Home ⇄ Shop is instant.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { CAMERA } from '../utils/Constants.js';
import { Environment } from './Environment.js';
import { CharacterModel } from './CharacterModel.js';

export class Showcase {
  constructor(game) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA.FOV - 15, 9 / 16, 0.1, 150);
    this.env = new Environment(this.scene, { mode: 'showcase' });
    this.character = new CharacterModel({ skin: game.save.get('equippedSkin'), blobTexture: game.assets.get('blob') });
    this.scene.add(this.character.group);   // stands on the hero island (top surface y = 0)
    this.hop = { y: 0 };
    this.spin = 0;
    this.targetSpin = 0;
    this.framing('home');
    this.offUpdate = null;
  }

  /** Camera presets: 'home' (character centred), 'shop' (character higher, panel below). */
  framing(mode) {
    const presets = {
      home: { pos: [0, 2.3, 8.4], look: [0, 1.3, 0] },
      shop: { pos: [0, 1.6, 7.4], look: [0, -0.15, 0] }
    };
    const p = presets[mode] || presets.home;
    this.camera.position.set(...p.pos);
    this.lookAt = new THREE.Vector3(...p.look);
    this.camera.lookAt(this.lookAt);
  }

  /** Attach to the engine (render + update). */
  show(mode = 'home') {
    this.framing(mode);
    this.game.engine.setView(this.scene, this.camera);
    if (!this.offUpdate) this.offUpdate = this.game.engine.addUpdate((dt) => this.update(dt));
    this.character.setAnimation('idle');
  }

  hide() {
    this.offUpdate?.();
    this.offUpdate = null;
  }

  setSkin(id) {
    this.character.setSkin(id);
    // Little hop so the change feels rewarding.
    gsap.fromTo(this.hop, { y: 0.6 }, { y: 0, duration: 0.45, ease: 'bounce.out' });
    this.targetSpin += Math.PI * 2;
  }

  cheer(seconds = 1.2) {
    this.character.setAnimation('cheer');
    clearTimeout(this.cheerTimer);
    this.cheerTimer = setTimeout(() => this.character.setAnimation('idle'), seconds * 1000);
  }

  update(dt) {
    this.env.update(dt);
    this.character.update(dt);
    this.character.group.position.y = this.env.hero.position.y + this.hop.y;
    // Slow turntable + spin animation after a skin change.
    this.spin += (this.targetSpin - this.spin) * Math.min(1, dt * 4);
    this.character.group.rotation.y = this.spin + Math.sin(this.env.time * 0.6) * 0.35;
  }
}
