/**
 * Track — the icy runway, side rails and finish line. One long mesh per part (3 draw calls total).
 */
import * as THREE from 'three';
import { GAME, COLORS } from '../utils/Constants.js';

export class Track {
  /**
   * @param {THREE.Scene} scene
   * @param {object} assets AssetLoader (track texture)
   * @param {number} finishZ negative z of the finish line
   */
  constructor(scene, assets, finishZ) {
    this.group = new THREE.Group();
    const length = -finishZ + 60;  // a bit past the finish for the boss arena
    const w = GAME.TRACK_WIDTH;
    const centerZ = -length / 2 + 15;

    const tex = assets.get('track').clone();
    tex.needsUpdate = true;
    tex.repeat.set(1, length / 8);
    this.tex = tex;
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, length), [
      new THREE.MeshLambertMaterial({ color: COLORS.trackSide }),
      new THREE.MeshLambertMaterial({ color: COLORS.trackSide }),
      new THREE.MeshLambertMaterial({ map: tex }),
      new THREE.MeshLambertMaterial({ color: 0x9db4d3 }),
      new THREE.MeshLambertMaterial({ color: COLORS.trackSide }),
      new THREE.MeshLambertMaterial({ color: COLORS.trackSide })
    ]);
    top.position.set(0, -0.3, centerZ);
    this.group.add(top);

    // Glowing cyan edge rails.
    const railGeo = new THREE.BoxGeometry(0.18, 0.22, length);
    const railMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(side * (w / 2 - 0.09), 0.11, centerZ);
      this.group.add(rail);
    }

    // Finish line (checker) + arch.
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 16;
    const g = c.getContext('2d');
    for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? '#0F172A' : '#FFFFFF';
      g.fillRect(i * 8, j * 8, 8, 8);
    }
    const checker = new THREE.CanvasTexture(c);
    checker.colorSpace = THREE.SRGBColorSpace;
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, 1), new THREE.MeshBasicMaterial({ map: checker }));
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.02, finishZ);
    this.group.add(line);

    const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 4.2, 10);
    const postMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(side * (w / 2 - 0.2), 2.1, finishZ);
      this.group.add(post);
    }
    const banner = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, 0.2), new THREE.MeshBasicMaterial({ map: checker }));
    banner.position.set(0, 4.2, finishZ);
    this.group.add(banner);

    // Boss arena platform (slightly wider, orange rim).
    const arena = new THREE.Mesh(new THREE.CylinderGeometry(6, 5.4, 0.6, 10), new THREE.MeshLambertMaterial({ color: 0xffd7a8, flatShading: true }));
    arena.position.set(0, -0.31, finishZ - 10);
    this.group.add(arena);

    scene.add(this.group);
    this.scene = scene;
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        [].concat(o.material).forEach((m) => { m.map?.dispose(); m.dispose(); });
      }
    });
    this.group.removeFromParent();
  }
}
