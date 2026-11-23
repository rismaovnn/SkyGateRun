/**
 * Engine — owns the WebGL renderer, the 9:16 frame layout and the main loop.
 * Scenes hand it a THREE.Scene + camera via setView(); systems register per-frame updates.
 */
import * as THREE from 'three';
import { STAGE, DEBUG } from '../utils/Constants.js';

export class Engine {
  constructor() {
    this.frame = document.getElementById('frame');
    this.canvas = document.getElementById('game');
    this.ui = document.getElementById('ui');

    // Transparent canvas: the CSS sky gradient shows through (cheaper than a sky mesh).
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: window.devicePixelRatio < 2,   // high-DPI phones look fine without MSAA
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.view = null;           // { scene, camera }
    this.updaters = new Set();  // fn(dt, time)
    this.clock = new THREE.Clock();
    this.time = 0;
    this.paused = false;
    this.timeScale = DEBUG.timeScale;

    this.stageScale = 1;
    this.stageHeight = STAGE.HEIGHT;
    this.width = 1;
    this.height = 1;

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    this.onResize();

    // Pause the loop when the tab is hidden (saves battery, avoids huge dt spikes).
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clock.stop();
      else this.clock.start();
    });

    if (DEBUG.showFps) this.createFpsMeter();
  }

  /**
   * Layout: the frame is full-screen on phones (taller than 9:16) and a centred 9:16 column on wide screens.
   * The UI stage is always 360 dp wide and as tall as the frame allows (≥ 640 dp), scaled to fit.
   */
  onResize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(vw, Math.round(vh * STAGE.ASPECT));
    const h = vh;
    this.width = w;
    this.height = h;
    this.frame.style.width = `${w}px`;
    this.frame.style.height = `${h}px`;

    this.stageScale = w / STAGE.WIDTH;
    this.stageHeight = Math.max(STAGE.HEIGHT, h / this.stageScale);
    this.ui.style.width = `${STAGE.WIDTH}px`;
    this.ui.style.height = `${this.stageHeight}px`;
    this.ui.style.transform = `scale(${this.stageScale})`;
    document.documentElement.style.setProperty('--stage-h', `${this.stageHeight}px`);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    if (this.view?.camera) {
      this.view.camera.aspect = w / h;
      this.view.camera.updateProjectionMatrix();
    }
    for (const fn of this.resizeListeners || []) fn(w, h);
  }

  onResizeListen(fn) {
    (this.resizeListeners ||= new Set()).add(fn);
    return () => this.resizeListeners.delete(fn);
  }

  /** Switch which 3D scene/camera is rendered. Pass null to render nothing. */
  setView(scene, camera) {
    this.view = scene && camera ? { scene, camera } : null;
    if (camera) {
      camera.aspect = this.width / this.height;
      camera.updateProjectionMatrix();
    }
  }

  /** Register a per-frame update; returns an unregister function. */
  addUpdate(fn) {
    this.updaters.add(fn);
    return () => this.updaters.delete(fn);
  }

  /** Convert a screen-space point (CSS px relative to frame) to stage dp. */
  toStage(px, py) {
    return { x: px / this.stageScale, y: py / this.stageScale };
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      // Clamp dt so a hitch never teleports the player through a gate.
      const raw = Math.min(this.clock.getDelta(), 1 / 20);
      const dt = this.paused ? 0 : raw * this.timeScale;
      this.time += dt;
      for (const fn of this.updaters) fn(dt, this.time);
      if (this.view) this.renderer.render(this.view.scene, this.view.camera);
      if (this.fps) this.tickFps(raw);
    };
    loop();
  }

  createFpsMeter() {
    this.fps = { el: document.createElement('div'), acc: 0, frames: 0 };
    Object.assign(this.fps.el.style, {
      position: 'fixed', left: '4px', top: '4px', zIndex: 99, font: '12px monospace',
      color: '#fff', background: 'rgba(0,0,0,.5)', padding: '2px 6px', borderRadius: '4px'
    });
    document.body.appendChild(this.fps.el);
  }

  tickFps(dt) {
    const f = this.fps;
    f.acc += dt;
    f.frames++;
    if (f.acc >= 0.5) {
      const info = this.renderer.info?.render;
      f.el.textContent = `${Math.round(f.frames / f.acc)} fps · ${info ? info.calls : 0} calls`;
      f.acc = 0;
      f.frames = 0;
    }
  }
}
