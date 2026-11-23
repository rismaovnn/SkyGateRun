/**
 * SettingsScene — overlay modal: music, sound, vibration, language, legal links, restore purchase.
 * Every change applies instantly and is saved (no "save" button).
 */
import { BaseScene } from './BaseScene.js';
import { Popup } from '../ui/Popup.js';
import { Toast } from '../ui/Toast.js';
import { el, icon, vibrate } from '../utils/Helpers.js';

export class SettingsScene extends BaseScene {
  async build() {
    const g = this.game;
    this.root.classList.add('overlay');
    this.popup = new Popup(g, { title: this.t('settings'), onClose: () => g.scenes.pop() });

    const toggleRow = (iconName, color, label, getter, setter) => {
      const btn = el('button', { class: 'toggle', type: 'button', role: 'switch', 'aria-label': label }, [el('span', { class: 'track' }), el('span', { class: 'knob' })]);
      const sync = () => {
        const on = getter();
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-checked', String(on));
      };
      btn.addEventListener('click', () => {
        setter(!getter());
        sync();
        g.audio.play('tap');
        vibrate(15);
      });
      sync();
      return el('div', { class: 'set-row' }, [el('span', { class: 'set-ic', style: { background: color } }, [icon(iconName, 22)]), el('span', { class: 'set-label' }, label), btn]);
    };

    const langBtn = el('button', { class: 'lang-btn', type: 'button' }, this.langName());
    langBtn.addEventListener('click', () => {
      g.i18n.cycle();
      g.audio.play('tap');
      // Rebuild so every label switches language.
      this.popup.destroy();
      this.root.innerHTML = '';
      this.build();
    });

    const link = (iconName, label, onClick) => el('button', { class: 'set-link', type: 'button', onclick: () => { g.audio.play('tap'); onClick(); } }, [icon(iconName, 20), el('span', {}, label)]);

    this.popup.body.append(
      toggleRow('music', '#8B5CF6', this.t('music'), () => g.audio.musicOn, (v) => g.audio.setMusic(v)),
      toggleRow('sound', '#2563EB', this.t('sound'), () => g.audio.soundOn, (v) => g.audio.setSound(v)),
      toggleRow('vibrate', '#FF8A1F', this.t('vibration'), () => g.save.setting('vibration'), (v) => g.save.setting('vibration', v)),
      el('div', { class: 'set-row' }, [el('span', { class: 'set-ic', style: { background: '#38B6FF' } }, [icon('globe', 22)]), el('span', { class: 'set-label' }, this.t('language')), langBtn]),
      el('div', { class: 'set-divider' }),
      link('shield', this.t('privacy'), () => Toast.show(g, this.t('privacy_toast'), 'shield')),
      link('doc', this.t('terms'), () => Toast.show(g, this.t('terms_toast'), 'doc')),
      link('restore', this.t('restore'), () => Toast.show(g, this.t('restore_toast'), 'restore')),
      el('div', { class: 'set-version' }, 'v1.0.0')
    );
    this.popup.open(this.root);
    this.track(() => this.popup.destroy());
  }

  langName() {
    return this.game.i18n.languages.find((l) => l.code === this.game.i18n.lang)?.name || 'English';
  }
}
