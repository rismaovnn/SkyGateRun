/**
 * CoinSystem — all coins of a level in ONE InstancedMesh (one draw call).
 * Collected coins are hidden by zero-scaling their instance matrix; only coins near the player animate.
 */
import * as THREE from 'three';
import { GAME } from '../utils/Constants.js';
import { bus } from '../core/EventBus.js';

const MAX_COINS = 256;

export class CoinSystem {
  constructor(scene, particles) {
    this.particles = particles;
    const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 18);
    geo.rotateX(Math.PI / 2); // stand upright, facing the camera
    const mat = new THREE.MeshLambertMaterial({ color: 0xffc21a, emissive: 0x6b4500 });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX_COINS);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false; // bounding sphere of instances isn't tracked; mesh is cheap
    scene.add(this.mesh);
    this.coins = [];
    this.dummy = new THREE.Object3D();
    this.spin = 0;
  }

  load(level) {
    this.coins = level.coins.slice(0, MAX_COINS).map((c) => ({ x: c.x, z: c.z, y: 0.9, taken: false }));
    this.mesh.count = this.coins.length;
    this.spin = 0;
    this.writeAll();
  }

  writeAll() {
    this.coins.forEach((c, i) => this.write(i, c, 0));
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  write(i, c, rot) {
    const d = this.dummy;
    d.position.set(c.x, c.y, c.z);
    d.rotation.set(0, rot, 0);
    d.scale.setScalar(c.taken ? 0 : 1);
    d.updateMatrix();
    this.mesh.setMatrixAt(i, d.matrix);
  }

  /**
   * Spin visible coins and collect the ones touching the player.
   * @returns {number} coins collected this frame
   */
  update(dt, player) {
    this.spin += dt * 4;
    const pz = player.position.z;
    const px = player.position.x;
    const reach = GAME.COIN_RADIUS + player.radius * 0.6;
    let got = 0;
    let dirty = false;
    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.taken || c.z > pz + 4 || c.z < pz - 55) continue; // only the window around the player
      if (Math.abs(c.z - pz) < 0.8 && Math.abs(c.x - px) < reach && player.state === 'running') {
        c.taken = true;
        got++;
        this.particles.burst({ x: c.x, y: c.y, z: c.z }, { count: 6, color: [0xffd23f, 0xffffff], cell: 0, speed: 2.5, up: 3, size: 0.45, life: 0.45 });
      }
      this.write(i, c, this.spin + i * 0.3);
      dirty = true;
    }
    if (dirty) this.mesh.instanceMatrix.needsUpdate = true;
    if (got) bus.emit('coin:collect', { count: got });
    return got;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh.dispose?.();
  }
}
