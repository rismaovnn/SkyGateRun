/**
 * EnemySystem — "Grunt" squads (red cubes with a power number) and spinning saws.
 * Touching a grunt costs its power; touching a saw costs its damage. Both are pooled.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { GAME } from '../utils/Constants.js';
import { LabelFactory } from './LabelFactory.js';

let GEO = null;
function geometries() {
  if (GEO) return GEO;
  GEO = {
    body: new THREE.BoxGeometry(0.9, 0.9, 0.9),
    eye: new THREE.BoxGeometry(0.18, 0.16, 0.05),
    label: new THREE.PlaneGeometry(1.4, 0.7),
    saw: new THREE.CylinderGeometry(0.85, 0.85, 0.14, 14),
    tooth: new THREE.ConeGeometry(0.16, 0.34, 4),
    hub: new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10),
    post: new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6)
  };
  return GEO;
}

class Grunt {
  constructor() {
    const g = geometries();
    this.group = new THREE.Group();
    this.mat = new THREE.MeshLambertMaterial({ color: 0xf43f5e, flatShading: true });
    const eyeMat = Grunt.eyeMat || (Grunt.eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    this.body = new THREE.Mesh(g.body, this.mat);
    this.body.position.y = 0.45;
    const eL = new THREE.Mesh(g.eye, eyeMat); eL.position.set(-0.2, 0.58, 0.46); eL.rotation.z = -0.3;
    const eR = new THREE.Mesh(g.eye, eyeMat); eR.position.set(0.2, 0.58, 0.46); eR.rotation.z = 0.3;
    this.label = LabelFactory.dynamic(256, 128);
    this.labelMesh = new THREE.Mesh(g.label, new THREE.MeshBasicMaterial({ map: this.label.texture, transparent: true, depthWrite: false }));
    this.labelMesh.position.y = 1.35;
    this.group.add(this.body, eL, eR, this.labelMesh);
    this.group.visible = false;
  }
}

class Saw {
  constructor() {
    const g = geometries();
    this.group = new THREE.Group();
    const steel = Saw.steel || (Saw.steel = new THREE.MeshLambertMaterial({ color: 0xcbd5e1, flatShading: true }));
    const red = Saw.red || (Saw.red = new THREE.MeshLambertMaterial({ color: 0xf43f5e }));
    this.blade = new THREE.Group();
    const disc = new THREE.Mesh(g.saw, steel);
    disc.rotation.x = Math.PI / 2;
    this.blade.add(disc);
    for (let i = 0; i < 10; i++) {
      const t = new THREE.Mesh(g.tooth, steel);
      const a = (i / 10) * Math.PI * 2;
      t.position.set(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0);
      t.rotation.z = a - Math.PI / 2;
      this.blade.add(t);
    }
    const hub = new THREE.Mesh(g.hub, red);
    hub.rotation.x = Math.PI / 2;
    this.blade.add(hub);
    this.blade.position.y = 0.95;
    this.group.add(this.blade);
    this.group.visible = false;
  }
}

export class EnemySystem {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.grunts = [];
    this.saws = [];
    this.gruntPool = [];
    this.sawPool = [];
    this.time = 0;
  }

  take(pool, Ctor) {
    let o = pool.find((x) => !x.inUse);
    if (!o) {
      o = new Ctor();
      this.scene.add(o.group);
      pool.push(o);
    }
    o.inUse = true;
    o.group.visible = true;
    o.group.scale.set(1, 1, 1);
    return o;
  }

  load(level) {
    this.clear();
    for (const e of level.enemies) {
      const g = this.take(this.gruntPool, Grunt);
      g.data = { ...e, alive: true };
      g.group.position.set(e.x, 0, e.z);
      g.group.rotation.set(0, 0, 0);
      g.label.set(String(e.power));
      this.grunts.push(g);
    }
    for (const s of level.saws) {
      const saw = this.take(this.sawPool, Saw);
      saw.data = { ...s, hit: false };
      saw.group.position.set(s.x, 0, s.z);
      this.saws.push(saw);
    }
  }

  clear() {
    for (const o of [...this.gruntPool, ...this.sawPool]) {
      o.inUse = false;
      o.group.visible = false;
      gsap.killTweensOf([o.group.position, o.group.scale, o.group.rotation]);
    }
    this.grunts = [];
    this.saws = [];
  }

  /**
   * @param {function} onHit ({ kind: 'grunt'|'saw', power, x, z })
   */
  update(dt, player, onHit) {
    this.time += dt;
    const p = player.position;
    const pr = player.radius;
    for (const g of this.grunts) {
      const d = g.data;
      if (!d.alive || d.z > p.z + 6 || d.z < p.z - 60) continue;
      // Idle hop + red outline when stronger than the player.
      g.body.position.y = 0.45 + Math.abs(Math.sin(this.time * 6 + d.x)) * 0.15;
      g.label.set(String(d.power), d.power >= player.power ? '#FF8A9A' : '#FFFFFF');
      if (player.state === 'running' && Math.abs(d.z - p.z) < 0.7 && Math.abs(d.x - p.x) < pr + GAME.ENEMY_RADIUS) {
        d.alive = false;
        this.knockAway(g, d.x - p.x);
        onHit({ kind: 'grunt', power: d.power, x: d.x, z: d.z });
      }
    }
    for (const s of this.saws) {
      const d = s.data;
      const x = Math.sin(this.time * d.speed + d.phase) * d.range;
      s.group.position.x = x;
      s.blade.rotation.z -= dt * 14;
      if (d.hit || d.z > p.z + 6 || d.z < p.z - 60) continue;
      if (player.state === 'running' && Math.abs(d.z - p.z) < 0.6 && Math.abs(x - p.x) < pr + 0.75) {
        d.hit = true;
        onHit({ kind: 'saw', power: d.damage, x, z: d.z });
      }
    }
  }

  /** Grunt flies off the track with a red burst. */
  knockAway(g, dir) {
    const pos = g.group.position;
    this.particles.burst({ x: pos.x, y: 0.6, z: pos.z }, { count: 14, color: [0xf43f5e, 0xffffff], cell: 2, speed: 4, up: 4, size: 0.7 });
    gsap.to(pos, { x: pos.x + (dir >= 0 ? 6 : -6), y: 3, z: pos.z - 4, duration: 0.6, ease: 'power2.out' });
    gsap.to(g.group.rotation, { x: 4, z: dir >= 0 ? -3 : 3, duration: 0.6 });
    gsap.to(g.group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.3, delay: 0.35, onComplete: () => { g.group.visible = false; } });
  }

  dispose() {
    this.clear();
    for (const o of [...this.gruntPool, ...this.sawPool]) o.group.removeFromParent();
    this.gruntPool = [];
    this.sawPool = [];
  }
}
