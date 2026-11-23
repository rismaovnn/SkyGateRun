/**
 * LabelFactory — renders outlined numbers (white fill, ink outline, drop shadow) to CanvasTextures.
 * Textures are cached by text+colour, so 50 gates showing "+50" share one texture.
 */
import * as THREE from 'three';

const cache = new Map();

export class LabelFactory {
  /**
   * @param {string} text
   * @param {object} o { fill: css colour, size: font px, w, h }
   * @returns {THREE.CanvasTexture}
   */
  static texture(text, o = {}) {
    const fill = o.fill || '#ffffff';
    const key = `${text}|${fill}|${o.size || 0}`;
    if (cache.has(key)) return cache.get(key);
    const w = o.w || 256;
    const h = o.h || 128;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    LabelFactory.draw(g, text, fill, w, h, o.size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    cache.set(key, tex);
    return tex;
  }

  static draw(g, text, fill, w, h, size) {
    g.clearRect(0, 0, w, h);
    let fontSize = size || Math.floor(h * 0.78);
    g.font = `${fontSize}px "Luckiest Guy", "Arial Black", Impact, sans-serif`;
    // Shrink long labels to fit.
    while (g.measureText(text).width > w * 0.9 && fontSize > 12) {
      fontSize -= 4;
      g.font = `${fontSize}px "Luckiest Guy", "Arial Black", Impact, sans-serif`;
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    const x = w / 2;
    const y = h / 2 + fontSize * 0.06;
    g.fillStyle = 'rgba(15,23,42,.45)';
    g.fillText(text, x, y + fontSize * 0.09);          // drop shadow
    g.lineWidth = fontSize * 0.16;
    g.strokeStyle = '#0F172A';
    g.strokeText(text, x, y);                           // outline
    g.fillStyle = fill;
    g.fillText(text, x, y);                             // fill
  }

  /**
   * A dynamic label (power above enemies/boss) that can be redrawn without new textures.
   */
  static dynamic(w = 256, h = 128) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    let last = null;
    return {
      texture: tex,
      set(text, fill = '#ffffff') {
        const k = text + fill;
        if (k === last) return;
        last = k;
        LabelFactory.draw(g, text, fill, w, h);
        tex.needsUpdate = true;
      }
    };
  }

  static clear() {
    for (const t of cache.values()) t.dispose();
    cache.clear();
  }
}
