/**
 * Environment — lights, fog and the "alive" background: low-poly floating islands and clouds.
 * Islands/clouds are pooled: in run mode they are recycled ahead of the player instead of re-created.
 */
import * as THREE from 'three';
import { COLORS } from '../utils/Constants.js';
import { seededRandom } from '../utils/Helpers.js';

let GEO = null;
function geometries() {
  if (GEO) return GEO;
  const top = new THREE.CylinderGeometry(1, 0.92, 0.35, 7, 1);
  top.translate(0, -0.175, 0);
  const rock = new THREE.ConeGeometry(0.92, 1.6, 7, 1);
  rock.rotateX(Math.PI);
  rock.translate(0, -0.35 - 0.8, 0);
  GEO = {
    top,
    rock,
    tree: new THREE.ConeGeometry(0.22, 0.7, 6),
    puff: new THREE.IcosahedronGeometry(1, 1)
  };
  return GEO;
}

let MATS = null;
function materials() {
  if (MATS) return MATS;
  MATS = {
    grass: new THREE.MeshLambertMaterial({ color: COLORS.grass, flatShading: true }),
    rock: new THREE.MeshLambertMaterial({ color: COLORS.rock, flatShading: true }),
    tree: new THREE.MeshLambertMaterial({ color: 0x16a34a, flatShading: true }),
    cloud: new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9fb8d6, flatShading: true })
  };
  return MATS;
}

export class Environment {
  /**
   * @param {THREE.Scene} scene
   * @param {object} o { mode: 'showcase' | 'run', seed }
   */
  constructor(scene, o = {}) {
    this.scene = scene;
    this.mode = o.mode || 'run';
    this.rng = seededRandom(o.seed || 7);
    this.time = 0;
    this.islands = [];
    this.clouds = [];

    // Lighting: sky/ground hemisphere + one sun. No shadow maps (blob shadows instead).
    this.hemi = new THREE.HemisphereLight(0xdff3ff, 0x8fa3c8, 1.35);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sun.position.set(-4, 10, 6);
    scene.add(this.hemi, this.sun, this.sun.target);
    scene.fog = new THREE.Fog(0xcdeeff, this.mode === 'run' ? 45 : 30, this.mode === 'run' ? 120 : 70);

    if (this.mode === 'showcase') this.buildShowcase();
    else this.buildRun();
  }

  /** One low-poly island (grass cap + rock cone + optional trees). */
  makeIsland(radius, trees = 1) {
    const g = geometries();
    const m = materials();
    const island = new THREE.Group();
    const top = new THREE.Mesh(g.top, m.grass);
    const rock = new THREE.Mesh(g.rock, m.rock);
    island.add(top, rock);
    for (let i = 0; i < trees; i++) {
      const t = new THREE.Mesh(g.tree, m.tree);
      const a = this.rng() * Math.PI * 2;
      t.position.set(Math.cos(a) * 0.55, 0.35, Math.sin(a) * 0.55);
      island.add(t);
    }
    island.scale.setScalar(radius);
    island.userData.phase = this.rng() * Math.PI * 2;
    return island;
  }

  makeCloud(size) {
    const g = geometries();
    const m = materials();
    const cloud = new THREE.Group();
    const n = 3 + Math.floor(this.rng() * 2);
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(g.puff, m.cloud);
      p.position.set((i - n / 2) * 0.9, this.rng() * 0.3, this.rng() * 0.4);
      p.scale.setScalar(0.7 + this.rng() * 0.5);
      cloud.add(p);
    }
    cloud.scale.setScalar(size);
    cloud.userData.speed = 0.2 + this.rng() * 0.3;
    return cloud;
  }

  buildShowcase() {
    // Hero island under the character (top surface at y = 0).
    this.hero = this.makeIsland(2.3, 2);
    this.scene.add(this.hero);
    const spots = [[-6, 1.5, -9, 1.3], [6.5, -1.2, -11, 1.6], [-4.5, -3.2, -6, 0.8], [5, 3.5, -16, 1.2]];
    for (const [x, y, z, r] of spots) {
      const isl = this.makeIsland(r, 1);
      isl.position.set(x, y, z);
      isl.userData.baseY = y;
      this.islands.push(isl);
      this.scene.add(isl);
    }
    for (let i = 0; i < 4; i++) {
      const c = this.makeCloud(0.9 + this.rng() * 0.6);
      c.position.set(-10 + i * 7, 4 + this.rng() * 3, -18 - this.rng() * 6);
      this.clouds.push(c);
      this.scene.add(c);
    }
  }

  buildRun() {
    // A pool of islands flanking the track; recycled as the player advances.
    for (let i = 0; i < 14; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const isl = this.makeIsland(1.5 + this.rng() * 2.2, 1 + Math.floor(this.rng() * 2));
      this.placeRunIsland(isl, side, -i * 12 - this.rng() * 6);
      this.islands.push(isl);
      this.scene.add(isl);
    }
    for (let i = 0; i < 8; i++) {
      const c = this.makeCloud(1.2 + this.rng());
      c.position.set((this.rng() - 0.5) * 50, 9 + this.rng() * 8, -i * 18 - 10);
      this.clouds.push(c);
      this.scene.add(c);
    }
  }

  placeRunIsland(isl, side, z) {
    isl.position.set(side * (9 + this.rng() * 10), -3 - this.rng() * 6, z);
    isl.userData.baseY = isl.position.y;
    isl.userData.side = side;
  }

  /**
   * @param {number} dt
   * @param {number} playerZ  run mode: recycle objects that fell behind the camera
   */
  update(dt, playerZ = 0) {
    this.time += dt;
    for (const isl of this.islands) {
      isl.position.y = isl.userData.baseY + Math.sin(this.time * 0.9 + isl.userData.phase) * 0.25;
      if (this.mode === 'run' && isl.position.z > playerZ + 15) {
        this.placeRunIsland(isl, isl.userData.side, isl.position.z - 14 * 12);
      }
    }
    for (const c of this.clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 28) c.position.x = -28;
      if (this.mode === 'run' && c.position.z > playerZ + 20) c.position.z -= 8 * 18;
    }
    if (this.hero) this.hero.position.y = Math.sin(this.time * 0.8) * 0.06;
  }

  dispose() {
    // Geometries/materials are shared module-wide and kept for the next scene.
    this.scene.clear();
  }
}
