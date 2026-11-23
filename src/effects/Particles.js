/**
 * Particles — one pooled THREE.Points system (single draw call) for every 3D burst:
 * coin sparkles, gate shards, enemy pops, stars, rings and the running trail.
 * Uses the 2×2 particle texture atlas built by AssetLoader; each particle picks its atlas cell.
 */
import * as THREE from 'three';

const MAX = 700;
export const CELL = { star: 0, dot: 1, shard: 2, ring: 3 };

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aCell;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vCell;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vCell = aCell;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vCell;
  void main() {
    vec2 cell = vec2(mod(vCell, 2.0), 1.0 - floor(vCell / 2.0));
    vec2 uv = (gl_PointCoord * vec2(1.0, -1.0) + vec2(0.0, 1.0) + cell) * 0.5;
    vec4 tex = texture2D(uAtlas, uv);
    if (tex.a * vAlpha < 0.02) discard;
    gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha);
  }
`;

export class Particles {
  constructor(scene, atlas) {
    this.pos = new Float32Array(MAX * 3);
    this.vel = new Float32Array(MAX * 3);
    this.color = new Float32Array(MAX * 3);
    this.size = new Float32Array(MAX);
    this.cell = new Float32Array(MAX);
    this.alpha = new Float32Array(MAX);
    this.life = new Float32Array(MAX);
    this.maxLife = new Float32Array(MAX);
    this.gravity = new Float32Array(MAX);
    this.grow = new Float32Array(MAX);
    this.cursor = 0;
    this.alive = 0;

    const geo = new THREE.BufferGeometry();
    const attr = (arr, n) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr(this.pos, 3));
    geo.setAttribute('aColor', attr(this.color, 3));
    geo.setAttribute('aSize', attr(this.size, 1));
    geo.setAttribute('aCell', attr(this.cell, 1));
    geo.setAttribute('aAlpha', attr(this.alpha, 1));
    this.geo = geo;
    this.material = new THREE.ShaderMaterial({
      uniforms: { uAtlas: { value: atlas }, uScale: { value: 1 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;     // particles span the whole track
    this.points.renderOrder = 5;
    scene.add(this.points);
    this.tmpColor = new THREE.Color();
  }

  /**
   * Emit `count` particles at a world position.
   * @param {THREE.Vector3|{x,y,z}} at
   * @param {object} o { count, color (hex or array of hex), cell, speed, up, size, life, gravity, spread, grow }
   */
  burst(at, o = {}) {
    const count = o.count || 12;
    const colors = [].concat(o.color ?? 0xffffff);
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % MAX;     // ring buffer = pooling, no allocations
      const i3 = i * 3;
      const a = Math.random() * Math.PI * 2;
      const sp = (o.speed ?? 4) * (0.5 + Math.random() * 0.7);
      const spread = o.spread ?? 1;
      this.pos[i3] = at.x + (Math.random() - 0.5) * 0.3 * spread;
      this.pos[i3 + 1] = at.y + (Math.random() - 0.5) * 0.3 * spread;
      this.pos[i3 + 2] = at.z + (Math.random() - 0.5) * 0.3 * spread;
      this.vel[i3] = Math.cos(a) * sp * spread;
      this.vel[i3 + 1] = (o.up ?? 3) * (0.6 + Math.random() * 0.8);
      this.vel[i3 + 2] = Math.sin(a) * sp * spread;
      this.tmpColor.setHex(colors[n % colors.length]);
      this.color[i3] = this.tmpColor.r;
      this.color[i3 + 1] = this.tmpColor.g;
      this.color[i3 + 2] = this.tmpColor.b;
      this.size[i] = (o.size ?? 0.6) * (0.7 + Math.random() * 0.6);
      this.cell[i] = o.cell ?? CELL.star;
      this.life[i] = this.maxLife[i] = (o.life ?? 0.7) * (0.7 + Math.random() * 0.6);
      this.gravity[i] = o.gravity ?? 9;
      this.grow[i] = o.grow ?? 0;
      this.alpha[i] = 1;
    }
    this.alive = MAX;
  }

  /** Single expanding ring (impact / gate pass). */
  ring(at, color = 0xffffff, size = 3) {
    this.burst(at, { count: 1, color, cell: CELL.ring, speed: 0, up: 0, size: size * 0.4, life: 0.4, gravity: 0, grow: size * 3, spread: 0 });
  }

  /** Keep point sizes consistent across screen sizes / pixel ratios. */
  setScale(pixelHeight) {
    this.material.uniforms.uScale.value = pixelHeight / 900;
  }

  update(dt) {
    if (!this.alive) return;
    let any = false;
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) continue;
      any = true;
      this.life[i] -= dt;
      const i3 = i * 3;
      this.vel[i3 + 1] -= this.gravity[i] * dt;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      this.size[i] += this.grow[i] * dt;
      const k = Math.max(0, this.life[i] / this.maxLife[i]);
      this.alpha[i] = k < 0.4 ? k / 0.4 : 1;
      if (this.life[i] <= 0) this.alpha[i] = 0;
    }
    if (!any) this.alive = 0;
    const a = this.geo.attributes;
    a.position.needsUpdate = a.aAlpha.needsUpdate = a.aSize.needsUpdate = a.aColor.needsUpdate = a.aCell.needsUpdate = true;
  }

  dispose() {
    this.points.removeFromParent();
    this.geo.dispose();
    this.material.dispose();
  }
}
