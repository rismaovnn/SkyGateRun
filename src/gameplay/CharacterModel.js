/**
 * CharacterModel — "Pip", a modern 3D stickman built from primitives (no model download needed).
 * Every body part is its own mesh so the WeightSystem can grow shoulders, arms, legs and torso
 * independently (no parent scaling). Faces +Z by default.
 */
import * as THREE from 'three';
import { getSkin } from '../data/skins.js';

// Shared unit geometries (created once, reused by every character instance).
let GEO = null;
function geometries() {
  if (GEO) return GEO;
  // Unit capsule of total height 2, radius .5 → scale.y = length / 2. "Top" variant hangs from y = 0.
  const capsuleTop = new THREE.CapsuleGeometry(0.5, 1, 4, 10);
  capsuleTop.translate(0, -1, 0);
  GEO = {
    capsule: new THREE.CapsuleGeometry(0.5, 1, 4, 12),
    capsuleTop,
    sphere: new THREE.SphereGeometry(1, 18, 14),
    smallSphere: new THREE.SphereGeometry(1, 8, 6),
    box: new THREE.BoxGeometry(1, 1, 1),
    cone: new THREE.ConeGeometry(1, 1, 8),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
    torus: new THREE.TorusGeometry(1, 0.18, 6, 16),
    plane: new THREE.PlaneGeometry(1, 1)
  };
  return GEO;
}

/** Thin build — the WeightSystem interpolates from this towards BUFF. */
export const THIN = { legLen: 0.92, legThick: 0.17, hipW: 0.15, torsoW: 0.42, torsoH: 0.62, torsoD: 0.3, shoulderW: 0.46, armLen: 0.62, armThick: 0.13, deltoid: 0.11, headR: 0.34 };
export const BUFF = { legLen: 1.05, legThick: 0.42, hipW: 0.3, torsoW: 1.25, torsoH: 0.95, torsoD: 0.78, shoulderW: 1.45, armLen: 0.8, armThick: 0.38, deltoid: 0.36, headR: 0.4 };

const RAINBOW = [0xff5fa8, 0xffd23f, 0x22c55e, 0x22d3ee, 0x8b5cf6, 0xff8a1f];

export class CharacterModel {
  /**
   * @param {object} o { skin: id, blobTexture }
   */
  constructor(o = {}) {
    const g = geometries();
    this.group = new THREE.Group();
    this.group.name = 'character';
    this.params = { ...THIN };
    this.anim = 'idle';
    this.phase = 0;
    this.runSpeed = 1;
    this.flash = 0;

    this.matBody = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: false });
    this.matShade = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.matVisor = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    this.matEye = new THREE.MeshBasicMaterial({ color: 0x7df9ff });
    this.matAcc = new THREE.MeshLambertMaterial({ color: 0xff8a1f });
    this.materials = [this.matBody, this.matShade, this.matVisor, this.matEye, this.matAcc];

    // --- body hierarchy ---
    this.body = new THREE.Group();            // bobbing root (not scaled)
    this.group.add(this.body);

    const mk = (geo, mat) => new THREE.Mesh(geo, mat);
    this.hips = new THREE.Group();
    this.body.add(this.hips);

    this.legL = new THREE.Group(); this.legR = new THREE.Group();
    this.legMeshL = mk(g.capsuleTop, this.matBody); this.legMeshR = mk(g.capsuleTop, this.matShade);
    this.legL.add(this.legMeshL); this.legR.add(this.legMeshR);
    this.hips.add(this.legL, this.legR);

    this.torso = mk(g.capsule, this.matBody);
    this.hips.add(this.torso);
    this.chest = new THREE.Group();            // shoulders + head attach here
    this.hips.add(this.chest);

    this.armL = new THREE.Group(); this.armR = new THREE.Group();
    this.armMeshL = mk(g.capsuleTop, this.matBody); this.armMeshR = mk(g.capsuleTop, this.matShade);
    this.deltL = mk(g.sphere, this.matBody); this.deltR = mk(g.sphere, this.matShade);
    this.armL.add(this.armMeshL); this.armR.add(this.armMeshR);
    this.chest.add(this.armL, this.armR, this.deltL, this.deltR);

    this.head = new THREE.Group();
    this.headMesh = mk(g.sphere, this.matBody);
    this.visor = mk(g.box, this.matVisor);
    this.eyeL = mk(g.smallSphere, this.matEye); this.eyeR = mk(g.smallSphere, this.matEye);
    this.head.add(this.headMesh, this.visor, this.eyeL, this.eyeR);
    this.chest.add(this.head);

    this.accessory = new THREE.Group();
    this.head.add(this.accessory);
    this.neckAcc = new THREE.Group();
    this.chest.add(this.neckAcc);

    // Fake soft shadow (cheaper than shadow maps).
    if (o.blobTexture) {
      this.shadow = new THREE.Mesh(g.plane, new THREE.MeshBasicMaterial({ map: o.blobTexture, transparent: true, depthWrite: false }));
      this.shadow.rotation.x = -Math.PI / 2;
      this.shadow.position.y = 0.02;
      this.shadow.renderOrder = -1;
      this.group.add(this.shadow);
      this.materials.push(this.shadow.material);
    }

    this.setSkin(o.skin || 'default');
    this.applyProportions();
  }

  /** Re-colour and swap accessory meshes. */
  setSkin(id) {
    const s = getSkin(id);
    this.skinId = s.id;
    this.matBody.color.setHex(s.body);
    this.matShade.color.setHex(s.rainbow ? 0x22d3ee : s.shade);
    this.matVisor.color.setHex(s.visor);
    this.matEye.color.setHex(s.eye);
    this.matAcc.color.setHex(s.acc);
    this.matBody.emissive.setHex(s.metal ? 0x5a3a00 : 0x000000);
    this.matShade.emissive.setHex(s.metal ? 0x3a2400 : 0x000000);
    // Rainbow: give each limb its own palette colour.
    if (s.rainbow) {
      const parts = [this.legMeshL, this.legMeshR, this.armMeshL, this.armMeshR, this.deltL, this.deltR];
      this.rainbowMats = this.rainbowMats || parts.map(() => new THREE.MeshLambertMaterial());
      parts.forEach((m, i) => { this.rainbowMats[i].color.setHex(RAINBOW[i % RAINBOW.length]); m.material = this.rainbowMats[i]; });
    } else if (this.rainbowMats) {
      [this.legMeshL, this.armMeshL, this.deltL].forEach((m) => { m.material = this.matBody; });
      [this.legMeshR, this.armMeshR, this.deltR].forEach((m) => { m.material = this.matShade; });
    }
    this.buildAccessory(s.accessory);
  }

  buildAccessory(type) {
    const g = geometries();
    this.accessory.clear();
    this.neckAcc.clear();
    const add = (parent, geo, mat, pos, scale, rot) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      m.scale.set(...scale);
      if (rot) m.rotation.set(...rot);
      parent.add(m);
      return m;
    };
    const ink = this.inkMat || (this.inkMat = new THREE.MeshLambertMaterial({ color: 0x111827 }));
    const glass = this.glassMat || (this.glassMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false }));
    switch (type) {
      case 'scarf':
        add(this.neckAcc, g.torus, this.matAcc, [0, 0, 0], [0.62, 0.62, 0.9], [Math.PI / 2, 0, 0]);
        add(this.neckAcc, g.box, this.matAcc, [0.18, -0.2, -0.32], [0.14, 0.4, 0.06], [0.3, 0, 0.4]);
        break;
      case 'antenna':
        add(this.accessory, g.cyl, ink, [0, 1.15, 0], [0.04, 0.5, 0.04]);
        add(this.accessory, g.sphere, this.matEye, [0, 1.45, 0], [0.12, 0.12, 0.12]);
        break;
      case 'plume':
        add(this.accessory, g.cone, this.matAcc, [0, 1.12, -0.3], [0.22, 0.75, 0.22], [-0.9, 0, 0]);
        break;
      case 'headband':
        add(this.accessory, g.torus, this.matAcc, [0, 0.42, 0], [1.02, 1.02, 0.7], [Math.PI / 2, 0, 0]);
        add(this.accessory, g.box, this.matAcc, [0.4, 0.38, -0.95], [0.12, 0.08, 0.5], [0, 0.6, 0]);
        break;
      case 'cap':
        add(this.accessory, g.sphere, ink, [0, 0.45, 0], [1.02, 0.6, 1.02]);
        add(this.accessory, g.cyl, ink, [0, 0.45, 0.55], [0.7, 0.06, 0.55]);
        add(this.accessory, g.sphere, this.matAcc, [0, 0.82, 0.78], [0.14, 0.14, 0.06]);
        break;
      case 'helmet':
        add(this.accessory, g.sphere, glass, [0, 0, 0], [1.3, 1.3, 1.3]);
        add(this.neckAcc, g.torus, this.matAcc, [0, 0, 0], [0.62, 0.62, 0.9], [Math.PI / 2, 0, 0]);
        break;
      case 'bandana':
        add(this.accessory, g.sphere, this.matAcc, [0, 0.35, -0.05], [1.05, 0.72, 1.05]);
        add(this.accessory, g.sphere, ink, [0.38, 0.0, 0.85], [0.22, 0.22, 0.08]);
        break;
      case 'topknot':
        add(this.accessory, g.sphere, ink, [0, 1.12, -0.1], [0.3, 0.3, 0.3]);
        add(this.accessory, g.cyl, this.matAcc, [0, 0.95, -0.08], [0.2, 0.1, 0.2]);
        break;
      case 'antennae':
        add(this.accessory, g.cyl, this.matShade, [-0.35, 1.05, 0], [0.04, 0.6, 0.04], [0, 0, 0.45]);
        add(this.accessory, g.cyl, this.matShade, [0.35, 1.05, 0], [0.04, 0.6, 0.04], [0, 0, -0.45]);
        add(this.accessory, g.sphere, this.matAcc, [-0.5, 1.35, 0], [0.14, 0.14, 0.14]);
        add(this.accessory, g.sphere, this.matAcc, [0.5, 1.35, 0], [0.14, 0.14, 0.14]);
        break;
      case 'sparkle':
        add(this.accessory, g.smallSphere, this.matEye, [0.95, 0.9, 0], [0.08, 0.08, 0.08]);
        add(this.accessory, g.smallSphere, this.matEye, [-0.9, 0.5, 0.2], [0.06, 0.06, 0.06]);
        break;
      default:
        break;
    }
  }

  /** Position/scale every part from `this.params`. Called by the WeightSystem while tweening. */
  applyProportions() {
    const p = this.params;
    this.hips.position.y = p.legLen;
    for (const [leg, mesh, side] of [[this.legL, this.legMeshL, -1], [this.legR, this.legMeshR, 1]]) {
      leg.position.set(side * p.hipW, 0.05, 0);
      mesh.scale.set(p.legThick * 2, (p.legLen + 0.05) / 2, p.legThick * 2);
    }
    this.torso.position.y = p.torsoH / 2;
    this.torso.scale.set(p.torsoW, p.torsoH / 2, p.torsoD);
    this.chest.position.y = p.torsoH * 0.82;
    for (const [arm, mesh, delt, side] of [[this.armL, this.armMeshL, this.deltL, -1], [this.armR, this.armMeshR, this.deltR, 1]]) {
      arm.position.set(side * p.shoulderW / 2, 0.02, 0);
      mesh.scale.set(p.armThick * 2, p.armLen / 2, p.armThick * 2);
      delt.position.set(side * p.shoulderW / 2, 0.02, 0);
      delt.scale.setScalar(p.deltoid);
    }
    this.head.position.y = p.torsoH * 0.18 + p.headR * 0.95;
    this.headMesh.scale.setScalar(p.headR);
    this.visor.position.set(0, p.headR * 0.05, p.headR * 0.78);
    this.visor.scale.set(p.headR * 1.35, p.headR * 0.45, p.headR * 0.5);
    this.eyeL.position.set(-p.headR * 0.32, p.headR * 0.06, p.headR * 1.02);
    this.eyeR.position.set(p.headR * 0.32, p.headR * 0.06, p.headR * 1.02);
    this.eyeL.scale.setScalar(p.headR * 0.13);
    this.eyeR.scale.setScalar(p.headR * 0.13);
    this.accessory.scale.setScalar(p.headR);
    this.neckAcc.position.y = p.torsoH * 0.12;
    this.neckAcc.scale.setScalar(Math.max(p.torsoW, p.torsoD) * 0.85);
    if (this.shadow) this.shadow.scale.set(p.shoulderW * 2.2 + 0.6, p.torsoD * 3 + 0.6, 1);
  }

  /** Approximate total height (for camera framing / labels). */
  get height() {
    const p = this.params;
    return p.legLen + p.torsoH + p.headR * 2.1;
  }

  /** Approximate half-width (collision). */
  get radius() {
    return Math.max(0.35, this.params.shoulderW * 0.5 + this.params.armThick);
  }

  setAnimation(name) {
    this.anim = name;
  }

  /** Red/white flash on hit (decays in update). */
  hitFlash() {
    this.flash = 1;
  }

  update(dt) {
    this.phase += dt * (this.anim === 'run' ? 11 * this.runSpeed : 2.4);
    const s = Math.sin(this.phase);
    const c = Math.cos(this.phase);
    const L = this.legL.rotation, R = this.legR.rotation, AL = this.armL.rotation, AR = this.armR.rotation;
    if (this.anim === 'run') {
      L.x = s * 0.85; R.x = -s * 0.85;
      AL.x = -s * 0.9; AR.x = s * 0.9;
      AL.z = -0.15; AR.z = 0.15;
      this.body.position.y = Math.abs(c) * 0.09;
      this.body.rotation.x = 0.08;
    } else if (this.anim === 'cheer') {
      L.x = R.x = 0;
      AL.x = AR.x = 0;
      AL.z = -2.5 + s * 0.25; AR.z = 2.5 - s * 0.25;
      this.body.position.y = Math.max(0, Math.sin(this.phase * 1.6)) * 0.55;
      this.body.rotation.x = 0;
    } else if (this.anim === 'fall') {
      this.body.rotation.x = Math.min(this.body.rotation.x + dt * 4, 1.4);
      AL.z = -1.2; AR.z = 1.2;
    } else {
      // idle breathing
      L.x = R.x = 0;
      AL.x = AR.x = 0;
      AL.z = -0.12 - s * 0.04; AR.z = 0.12 + s * 0.04;
      this.body.position.y = 0;
      this.body.rotation.x = 0;
      this.chest.position.y = this.params.torsoH * 0.82 + s * 0.012;
    }
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 4);
      const f = this.flash;
      this.matBody.emissive.setRGB(f * 0.9, f * 0.15, f * 0.2);
      this.matShade.emissive.setRGB(f * 0.9, f * 0.15, f * 0.2);
      if (f === 0) this.setSkin(this.skinId); // restore metal tint etc.
    }
  }

  dispose() {
    this.group.removeFromParent();
    for (const m of this.materials) m.dispose();
    this.rainbowMats?.forEach((m) => m.dispose());
  }
}
