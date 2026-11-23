/**
 * FinishSystem — the finish line and the boss clash.
 * When the player reaches the finish, it stops running, charges the boss and wins if power ≥ boss power.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { LabelFactory } from './LabelFactory.js';

export class FinishSystem {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.boss = this.buildBoss();
    scene.add(this.boss);
    this.state = 'idle';
  }

  buildBoss() {
    const group = new THREE.Group();
    this.bodyMat = new THREE.MeshLambertMaterial({ color: 0x8b5cf6, flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), this.bodyMat);
    body.position.y = 1.2;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.05), eyeMat); eL.position.set(-0.5, 1.6, 1.22); eL.rotation.z = -0.35;
    const eR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.05), eyeMat); eR.position.set(0.5, 1.6, 1.22); eR.rotation.z = 0.35;
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.05), mouthMat); mouth.position.set(0, 0.85, 1.22);
    const crownMat = new THREE.MeshLambertMaterial({ color: 0xffc21a, flatShading: true });
    const crown = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 4), crownMat);
      spike.position.set(-0.8 + i * 0.4, 2.7, 0);
      crown.add(spike);
    }
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 0.5), crownMat);
    band.position.y = 2.45;
    crown.add(band);
    this.label = LabelFactory.dynamic(256, 128);
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: this.label.texture, transparent: true, depthWrite: false }));
    labelMesh.position.y = 3.7;
    group.add(body, eL, eR, mouth, crown, labelMesh);
    this.body = body;
    return group;
  }

  load(level) {
    this.level = level;
    this.power = level.bossPower;
    this.state = 'idle';
    this.finishZ = level.finishZ;
    gsap.killTweensOf([this.boss.position, this.boss.rotation, this.boss.scale]);
    this.boss.position.set(0, 0, level.finishZ - 10);
    this.boss.rotation.set(0, 0, 0);
    this.boss.scale.setScalar(1 + Math.min(1.2, Math.log10(Math.max(10, this.power)) - 1) * 0.6);
    this.boss.visible = true;
    this.label.set(String(this.power), '#FF9CCB');
  }

  /** True once the player passes the finish line. */
  reached(player) {
    return this.state === 'idle' && player.position.z <= this.finishZ;
  }

  /**
   * Run the clash animation. Resolves { won }.
   * @param {Player} player
   * @param {object} fx { shake, onImpact }
   */
  clash(player, fx) {
    this.state = 'clash';
    const won = player.power >= this.power;
    const pos = player.position;
    const stopZ = this.boss.position.z + 1.6 * this.boss.scale.x + player.radius;
    return new Promise((resolve) => {
      player.model.setAnimation('run');
      gsap.timeline({ onComplete: () => resolve({ won }) })
        .to(pos, { x: 0, duration: 0.35, ease: 'power1.out' })
        .to(pos, { z: stopZ, duration: 0.5, ease: 'power2.in' }, '<')
        .call(() => {
          fx.onImpact?.(won);
          this.particles.ring({ x: 0, y: 1.5, z: stopZ - 0.6 }, 0xffffff, 4);
          this.particles.burst({ x: 0, y: 1.5, z: stopZ - 0.6 }, { count: 30, color: [0xffd23f, 0xffffff, 0xff8a1f], cell: 0, speed: 6, up: 5, size: 0.9 });
          if (won) {
            this.label.set('0', '#FFFFFF');
            gsap.to(this.boss.position, { z: this.boss.position.z - 18, y: 7, duration: 1.1, ease: 'power2.out' });
            gsap.to(this.boss.rotation, { x: -5, y: 2, duration: 1.1 });
            player.model.setAnimation('cheer');
          } else {
            gsap.to(pos, { z: pos.z + 4, duration: 0.5, ease: 'power2.out' });
            player.model.setAnimation('fall');
            gsap.fromTo(this.body.scale, { y: 0.85 }, { y: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
          }
        })
        .to({}, { duration: won ? 0.9 : 0.7 });
    });
  }

  update(dt) {
    if (this.state === 'idle') this.boss.rotation.y = Math.sin(performance.now() * 0.0015) * 0.15;
  }

  dispose() {
    this.boss.removeFromParent();
  }
}
