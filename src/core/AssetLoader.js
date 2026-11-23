/**
 * AssetLoader — loads everything the game needs and reports progress (0..1) to the splash screen.
 *  - Icon sprite (SVG, inlined into the DOM so <use href="#i-*"> works everywhere)
 *  - Fonts (Google Fonts link in index.html; we wait for them with a timeout)
 *  - Audio (delegated to AudioManager / Howler)
 *  - Generated textures: particle atlas + track texture (canvas → CanvasTexture)
 *  - Scene modules that are needed right after the splash (others stay lazy)
 */
import * as THREE from 'three';

const BASE = import.meta.env.BASE_URL;

export class AssetLoader {
  constructor(audio) {
    this.audio = audio;
    this.textures = new Map();
  }

  /** Load all startup assets. onProgress(0..1). */
  async loadAll(onProgress = () => {}, preloadScenes = []) {
    const jobs = [
      () => this.loadIconSprite(),
      () => this.loadFonts(),
      () => this.buildTextures(),
      ...this.audio.loadJobs(),
      ...preloadScenes.map((loader) => () => loader())
    ];
    let done = 0;
    onProgress(0);
    // Run jobs in parallel but count completions for a smooth progress bar.
    await Promise.all(jobs.map(async (job) => {
      try { await job(); } catch (err) { console.warn('[AssetLoader] job failed (continuing)', err); }
      done++;
      onProgress(done / jobs.length);
    }));
  }

  async loadIconSprite() {
    if (document.getElementById('icon-sprite')) return;
    const res = await fetch(`${BASE}icons/icons.svg`);
    const text = await res.text();
    const holder = document.createElement('div');
    holder.id = 'icon-sprite';
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = text;
    document.body.prepend(holder);
  }

  async loadFonts() {
    if (!document.fonts?.load) return;
    const timeout = new Promise((r) => setTimeout(r, 2500));
    await Promise.race([
      Promise.all([
        document.fonts.load('40px "Luckiest Guy"'),
        document.fonts.load('600 16px "Fredoka"'),
        document.fonts.load('700 16px "Fredoka"')
      ]),
      timeout
    ]);
  }

  /** Procedural textures — no image downloads, crisp at any DPI. */
  buildTextures() {
    this.textures.set('particles', this.buildParticleAtlas());
    this.textures.set('track', this.buildTrackTexture());
    this.textures.set('blob', this.buildBlobShadow());
    this.textures.set('glow', this.buildGlow());
  }

  get(name) {
    return this.textures.get(name);
  }

  /**
   * Particle texture atlas: 2×2 cells of 128px — [0] star, [1] circle, [2] shard, [3] ring.
   * Drawn white; particles are tinted by vertex colour in the shader.
   */
  buildParticleAtlas() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.strokeStyle = '#fff';
    const cell = size / 2;
    // star
    g.save();
    g.translate(cell / 2, cell / 2);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 54 : 22;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.restore();
    // circle (soft)
    const grad = g.createRadialGradient(cell * 1.5, cell / 2, 0, cell * 1.5, cell / 2, 56);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(cell, 0, cell, cell);
    // shard (low-poly diamond)
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(cell / 2, cell + 10);
    g.lineTo(cell - 26, cell + cell / 2);
    g.lineTo(cell / 2, size - 10);
    g.lineTo(26, cell + cell / 2);
    g.closePath();
    g.fill();
    // ring
    g.lineWidth = 12;
    g.beginPath();
    g.arc(cell * 1.5, cell * 1.5, 46, 0, Math.PI * 2);
    g.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /** Light icy track with soft lane stripes. Repeats along the run. */
  buildTrackTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#F4F9FF';
    g.fillRect(0, 0, 128, 256);
    g.fillStyle = '#E6F0FB';
    for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 128, 32);
    g.fillStyle = '#D6E4F5';
    g.fillRect(61, 0, 6, 120);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  /** Round soft shadow used under characters instead of real-time shadows (much cheaper). */
  buildBlobShadow() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(15,23,42,0.45)');
    grad.addColorStop(1, 'rgba(15,23,42,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  /** Radial glow behind gates (tinted by material colour, additive). */
  buildGlow() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
}
