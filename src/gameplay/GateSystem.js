/**
 * GateSystem — "Prism Gates": two white pillars, coloured glass panel with glow and an outlined number.
 * Gates are pooled meshes (re-used across levels). Detects when the player crosses a row and applies the op.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { GAME, GATE_TYPES } from '../utils/Constants.js';
import { LevelGenerator } from './LevelGenerator.js';
import { LabelFactory } from './LabelFactory.js';
import { bus } from '../core/EventBus.js';

let SHARED = null;
function shared(glowTex) {
  if (SHARED) return SHARED;
  SHARED = {
    pillar: new THREE.CylinderGeometry(0.16, 0.18, 3.2, 10),
    cap: new THREE.SphereGeometry(0.26, 12, 10),
    panel: new THREE.PlaneGeometry(1, 1),
    pillarMat: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    glowTex
  };
  return SHARED;
}

/** One pooled gate object. */
class Gate {
  constructor(s) {
    this.group = new THREE.Group();
    const w = GAME.GATE_WIDTH;
    this.capMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x111111 });
    for (const side of [-1, 1]) {
      const p = new THREE.Mesh(s.pillar, s.pillarMat);
      p.position.set(side * w / 2, 1.6, 0);
      const c = new THREE.Mesh(s.cap, this.capMat);
      c.position.set(side * w / 2, 3.3, 0);
      this.group.add(p, c);
    }
    this.panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    this.panel = new THREE.Mesh(s.panel, this.panelMat);
    this.panel.scale.set(w - 0.3, 2.6, 1);
    this.panel.position.y = 1.65;
    this.glowMat = new THREE.MeshBasicMaterial({ map: s.glowTex, color: 0xffffff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
    this.glow = new THREE.Mesh(s.panel, this.glowMat);
    this.glow.scale.set(w + 1.8, 4.2, 1);
    this.glow.position.set(0, 1.65, -0.05);
    this.labelMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
    this.label = new THREE.Mesh(s.panel, this.labelMat);
    this.label.scale.set(2.8, 1.4, 1);
    this.label.position.set(0, 1.75, 0.02);
    this.group.add(this.glow, this.panel, this.label);
    this.group.visible = false;
  }

  setup(op, x, z) {
    const type = GATE_TYPES[op.type];
    this.op = op;
    this.x = x;
    this.group.position.set(x, 0, z);
    this.group.scale.set(1, 1, 1);
    this.group.visible = true;
    this.panel.visible = true;
    this.capMat.color.setHex(type.color);
    this.panelMat.color.setHex(type.color);
    this.panelMat.opacity = 0.55;
    this.glowMat.color.setHex(type.color);
    this.glowMat.opacity = 0.7;
    this.labelMat.map = LabelFactory.texture(LevelGenerator.label(op));
    this.labelMat.opacity = 1;
    this.labelMat.needsUpdate = true;
    this.phase = Math.random() * Math.PI * 2;
    this.state = 'idle';
  }

  hide() {
    this.group.visible = false;
    gsap.killTweensOf([this.group.scale, this.panelMat, this.labelMat, this.glowMat]);
  }
}

export class GateSystem {
  constructor(scene, assets, particles) {
    this.scene = scene;
    this.particles = particles;
    this.s = shared(assets.get('glow'));
    this.pool = [];
    this.rows = [];
    this.time = 0;
  }

  getGate() {
    let g = this.pool.find((x) => !x.group.visible && !x.inUse);
    if (!g) {
      g = new Gate(this.s);
      this.scene.add(g.group);
      this.pool.push(g);
    }
    g.inUse = true;
    return g;
  }

  /** Place all gate rows of a level. */
  load(level) {
    this.clear();
    for (const row of level.rows) {
      const entry = { z: row.z, passed: false, left: null, right: null };
      if (row.left) { entry.left = this.getGate(); entry.left.setup(row.left, -2, row.z); }
      if (row.right) { entry.right = this.getGate(); entry.right.setup(row.right, 2, row.z); }
      this.rows.push(entry);
    }
  }

  clear() {
    for (const g of this.pool) { g.hide(); g.inUse = false; }
    this.rows = [];
  }

  /**
   * Check crossings. Returns nothing; emits gate:pass and calls onPass(result).
   * @param {Player} player
   * @param {function} onPass ({ op, positive, perfect, gate, x, z })
   */
  update(dt, player, onPass) {
    this.time += dt;
    const pz = player.position.z;
    for (const row of this.rows) {
      // Idle animation only for gates in view (cheap).
      if (!row.passed && row.z < pz + 5 && row.z > pz - 70) {
        for (const g of [row.left, row.right]) {
          if (!g) continue;
          const near = row.z > pz - 7;
          g.glowMat.opacity = (near ? 0.85 : 0.55) + Math.sin(this.time * 4 + g.phase) * 0.15;
          g.label.position.y = 1.75 + Math.sin(this.time * 2.5 + g.phase) * 0.06;
        }
      }
      if (row.passed || player.prevZ < row.z || pz > row.z) continue;
      // The player crossed this row this frame.
      row.passed = true;
      const x = player.position.x;
      const gate = x < 0 ? row.left : row.right;
      const other = x < 0 ? row.right : row.left;
      if (other) this.reject(other);
      if (!gate) continue;
      const type = GATE_TYPES[gate.op.type];
      const perfect = Math.abs(x - gate.x) < GAME.GATE_PERFECT_RANGE;
      this.shatter(gate, type.color);
      const result = { op: gate.op, positive: type.positive, perfect, x, z: row.z };
      onPass(result);
      bus.emit('gate:pass', result);
    }
  }

  /** Passed gate: flash + shards + shrink away. */
  shatter(gate, color) {
    gate.state = 'passed';
    gate.panel.visible = false;
    this.particles.burst({ x: gate.x, y: 1.6, z: gate.group.position.z }, { count: 22, color: [color, 0xffffff], cell: 2, speed: 5, up: 4, size: 0.9, life: 0.8 });
    this.particles.ring({ x: gate.x, y: 1.4, z: gate.group.position.z + 0.2 }, color, 2.4);
    gsap.to(gate.labelMat, { opacity: 0, duration: 0.25 });
    gsap.to(gate.glowMat, { opacity: 0, duration: 0.3 });
    gsap.to(gate.group.scale, { x: 1.15, y: 0.01, duration: 0.35, delay: 0.1, ease: 'power2.in', onComplete: () => { gate.group.visible = false; } });
  }

  /** The gate not taken fades out. */
  reject(gate) {
    gate.state = 'rejected';
    gsap.to(gate.panelMat, { opacity: 0.15, duration: 0.3 });
    gsap.to(gate.labelMat, { opacity: 0.35, duration: 0.3 });
    gsap.to(gate.glowMat, { opacity: 0, duration: 0.3 });
  }

  dispose() {
    this.clear();
    for (const g of this.pool) {
      g.group.removeFromParent();
      g.panelMat.dispose(); g.glowMat.dispose(); g.labelMat.dispose(); g.capMat.dispose();
    }
    this.pool = [];
  }
}
