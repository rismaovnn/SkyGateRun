/**
 * HUD — in-run DOM overlay: pause/sound/settings, level + progress, coins/gems, combo, power badge
 * that follows Pip's head, floating numbers, PERFECT text, power meter and the swipe hint.
 * Elements that don't need input use pointer-events: none so swipes are never blocked.
 */
import gsap from 'gsap';
import * as THREE from 'three';
import { el, icon, formatNumber } from '../utils/Helpers.js';
import { Button } from './Button.js';
import { ProgressBar } from './ProgressBar.js';
import { TweenEffects } from '../effects/TweenEffects.js';
import { GATE_TYPES } from '../utils/Constants.js';

export class HUD {
  /**
   * @param {object} game
   * @param {HTMLElement} parent scene root
   * @param {object} cb { onPause, onSettings }
   */
  constructor(game, parent, cb) {
    this.game = game;
    this.parent = parent;
    const t = (k, v) => game.i18n.t(k, v);
    this.t = t;

    // --- top-left buttons ---
    this.soundBtn = Button.create(game, { icon: game.audio.soundOn ? 'sound' : 'sound-off', color: 'blue', size: 'icon', className: 'glassy', ariaLabel: t('sound'), onClick: () => this.toggleSound() });
    const left = el('div', { class: 'hud-left' }, [
      Button.create(game, { icon: 'pause', color: 'blue', size: 'icon', ariaLabel: t('pause'), onClick: cb.onPause }),
      this.soundBtn,
      Button.create(game, { icon: 'settings', color: 'blue', size: 'icon', className: 'glassy', ariaLabel: t('settings'), onClick: cb.onSettings })
    ]);

    // --- top centre: level + progress ---
    this.levelEl = el('div', { class: 'num hud-level' }, '');
    this.progress = new ProgressBar({ marker: true });
    const center = el('div', { class: 'hud-center' }, [this.levelEl, el('div', { class: 'hud-progress' }, [this.progress.el, icon('flag', 20)])]);

    // --- top right: currency ---
    this.coinNum = el('span', { class: 'num' }, '0');
    this.coinIcon = icon('coin', 24);
    const right = el('div', { class: 'hud-right' }, [
      el('div', { class: 'pill' }, [this.coinIcon, this.coinNum]),
      el('div', { class: 'pill' }, [icon('gem', 24), el('span', { class: 'num' }, formatNumber(game.save.get('gems')))])
    ]);

    // --- combo, power badge, meter, hint ---
    this.comboEl = el('div', { class: 'hud-combo hidden' }, [el('span', { class: 'num' }, '')]);
    this.powerBadge = el('div', { class: 'power-badge' }, [el('span', { class: 'num' }, '10')]);
    this.meterFill = el('div', { class: 'meter-fill' });
    this.meter = el('div', { class: 'hud-meter' }, [
      el('div', { class: 'meter-head' }, [icon('bolt', 16), el('span', { class: 'num s' }, t('power'))]),
      el('div', { class: 'meter-track' }, [this.meterFill])
    ]);
    this.hintText = el('div', { class: 'num s' }, t('swipe_to_start'));
    this.hint = el('div', { class: 'hud-hint' }, [
      el('div', { class: 'hint-gesture' }, [el('i', { class: 'hint-line' }), icon('back', 18, 'hint-arrow l'), icon('back', 18, 'hint-arrow r'), icon('hand', 32, 'hint-hand')]),
      this.hintText
    ]);
    this.fxLayer = el('div', { class: 'hud-fx' });

    this.el = el('div', { class: 'hud' }, [this.fxLayer, this.powerBadge, left, center, right, this.comboEl, this.meter, this.hint]);
    parent.appendChild(this.el);
    this.v3 = new THREE.Vector3();
    this.shownPower = 10;
  }

  setLevel(n) {
    this.levelEl.textContent = this.t('level_n', { n });
  }

  setCoins(n) {
    this.coinNum.textContent = formatNumber(n);
    TweenEffects.punch(this.coinNum.parentElement, 1.12);
  }

  toggleSound() {
    const on = !this.game.audio.soundOn;
    this.game.audio.setSound(on);
    this.game.audio.setMusic(on);
    this.soundBtn.querySelector('use').setAttribute('href', `#i-${on ? 'sound' : 'sound-off'}`);
  }

  showHint(text) {
    this.hintText.textContent = text;
    this.hint.classList.remove('hidden');
    gsap.fromTo(this.hint, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  }

  hideHint() {
    gsap.to(this.hint, { opacity: 0, duration: 0.25, onComplete: () => this.hint.classList.add('hidden') });
  }

  setCombo(n) {
    if (n < 3) {
      if (!this.comboEl.classList.contains('hidden')) gsap.to(this.comboEl, { opacity: 0, duration: 0.2, onComplete: () => this.comboEl.classList.add('hidden') });
      return;
    }
    this.comboEl.classList.remove('hidden');
    this.comboEl.className = `hud-combo ${n >= 8 ? 'c3' : n >= 5 ? 'c2' : 'c1'}`;
    this.comboEl.firstChild.textContent = `${this.t('combo')} ×${n}`;
    gsap.fromTo(this.comboEl, { scale: 1.3, opacity: 1 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
  }

  /** Floating text above the player (gate result, coins, damage). */
  float(text, worldPos, camera, o = {}) {
    const s = this.project(worldPos, camera);
    TweenEffects.floatText(this.fxLayer, text, s.x + (o.dx || 0), s.y + (o.dy || 0), o);
  }

  perfect() {
    const node = el('div', { class: 'num xl perfect-text' }, this.t('perfect'));
    this.fxLayer.appendChild(node);
    gsap.fromTo(node, { scale: 0, rotation: -12 }, { scale: 1, rotation: -6, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
    gsap.to(node, { opacity: 0, y: -30, duration: 0.3, delay: 0.7, onComplete: () => node.remove() });
  }

  /** Big centre message (e.g. "FIGHT!"). */
  banner(text, color = '#FFD23F') {
    const node = el('div', { class: 'num xl hud-banner', style: { color } }, text);
    this.fxLayer.appendChild(node);
    gsap.fromTo(node, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.5)' });
    gsap.to(node, { opacity: 0, scale: 1.3, duration: 0.3, delay: 0.8, onComplete: () => node.remove() });
  }

  /** World → stage dp. */
  project(pos, camera) {
    this.v3.set(pos.x, pos.y, pos.z).project(camera);
    return { x: (this.v3.x + 1) / 2 * 360, y: (1 - this.v3.y) / 2 * this.game.engine.stageHeight };
  }

  /** Called every frame. */
  update(world) {
    const p = world.player;
    this.progress.set(world.progress);
    // Power badge follows the head.
    const head = this.project({ x: p.position.x, y: p.height + 0.55, z: p.position.z }, world.camera);
    this.powerBadge.style.transform = `translate(${head.x}px, ${head.y}px) translate(-50%, -100%)`;
    if (p.power !== this.shownPower) {
      const type = p.power > this.shownPower ? 'up' : 'down';
      this.shownPower = p.power;
      this.powerBadge.firstChild.textContent = formatNumber(p.power);
      this.powerBadge.dataset.dir = type;
      TweenEffects.punch(this.powerBadge.firstChild, 1.25);
    }
    const ratio = world.finish.power ? p.power / world.finish.power : 0;
    this.meterFill.style.width = `${Math.min(100, ratio * 100)}%`;
    this.meterFill.classList.toggle('ok', ratio >= 1);
  }

  /** Colour for floating gate numbers. */
  static gateColor(op) {
    return GATE_TYPES[op.type].css;
  }

  destroy() {
    this.el.remove();
  }
}
