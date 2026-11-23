/**
 * SplashScene — logo animation + real asset loading progress, then transitions to Home.
 */
import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { ProgressBar } from '../ui/ProgressBar.js';
import { el, wait } from '../utils/Helpers.js';

export class SplashScene extends BaseScene {
  async build() {
    const tip = this.t(`tip_${1 + Math.floor(Math.random() * 3)}`);
    this.bar = new ProgressBar({ className: 'loading-bar' });
    this.pct = el('div', { class: 'num s loading-pct' }, `${this.t('loading')} 0%`);
    this.logo = el('div', { class: 'logo' }, [
      el('div', { class: 'num xl logo-top' }, 'SKY GATE'),
      el('div', { class: 'num xl gold logo-bottom' }, 'RUN!')
    ]);

    this.root.append(
      el('div', { class: 'stars' }, [
        el('i', { class: 'twinkle', style: { left: '60px', top: '70px' } }),
        el('i', { class: 'twinkle', style: { right: '70px', top: '120px', animationDelay: '-1s' } }),
        el('i', { class: 'twinkle', style: { left: '120px', top: '300px', animationDelay: '-.5s' } })
      ]),
      el('img', { class: 'cloud drift', src: `${import.meta.env.BASE_URL}images/cloud.svg`, alt: '', style: { left: '-20px', top: '50px', width: '130px' } }),
      el('img', { class: 'cloud drift', src: `${import.meta.env.BASE_URL}images/cloud.svg`, alt: '', style: { right: '-10px', top: '250px', width: '100px', animationDelay: '-4s', opacity: 0.8 } }),
      el('img', { class: 'island bob', src: `${import.meta.env.BASE_URL}images/island.svg`, alt: '', style: { left: '-16px', top: '330px', width: '120px' } }),
      el('img', { class: 'island hero-island', src: `${import.meta.env.BASE_URL}images/island.svg`, alt: '' }),
      el('img', { class: 'splash-pip bob', src: `${import.meta.env.BASE_URL}images/pip.svg`, alt: 'Pip' }),
      this.logo,
      el('div', { class: 'splash-bottom' }, [this.bar.el, this.pct, el('div', { class: 'splash-tip' }, tip)])
    );

    // Logo pop-in.
    gsap.fromTo(this.logo, { scale: 0.6, rotation: -4, opacity: 0 }, { scale: 1, rotation: -4, opacity: 1, duration: 0.7, ease: 'back.out(2)' });

    // Don't await here: SceneManager is still inside go('splash') until build() returns.
    this.load();
  }

  async load() {
    const scenes = this.game.scenes;
    const start = performance.now();
    await this.game.assets.loadAll(
      (p) => {
        this.bar.set(p);
        this.pct.textContent = `${this.t('loading')} ${Math.round(p * 100)}%`;
      },
      [scenes.loader('home'), scenes.loader('gameplay')]
    );
    // Keep the splash at least ~1.2 s so the logo animation reads.
    const elapsed = performance.now() - start;
    if (elapsed < 1200) await wait(1200 - elapsed);
    if (!this.root) return;
    scenes.go('home');
  }
}
