/**
 * ShopScene — preview (3D showcase), tabs (Skins / Trails), item grid and one context CTA:
 * EQUIP · UNLOCK <price> · WATCH AD (n/5) · DAY-7 REWARD · EQUIPPED. Purchases are saved instantly.
 */
import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { CurrencyBar } from '../ui/CurrencyBar.js';
import { SkinThumb } from '../ui/SkinThumb.js';
import { Toast } from '../ui/Toast.js';
import { Showcase } from '../gameplay/Showcase.js';
import { TweenEffects } from '../effects/TweenEffects.js';
import { Confetti } from '../effects/Confetti.js';
import { SKINS, RARITY_STYLE } from '../data/skins.js';
import { TRAILS } from '../data/trails.js';
import { el, icon, formatNumber } from '../utils/Helpers.js';

export class ShopScene extends BaseScene {
  async build(params) {
    const g = this.game;
    g.showcase ||= new Showcase(g);
    g.showcase.show('shop');
    this.tab = params.tab === 'trails' ? 'trails' : 'skins';
    this.sel = this.tab === 'skins' ? g.save.get('equippedSkin') : g.save.get('equippedTrail');

    this.currency = new CurrencyBar(g);
    this.track(() => this.currency.destroy());
    const back = Button.create(g, { icon: 'back', color: 'white', size: 'icon', ariaLabel: this.t('back'), onClick: () => g.scenes.go('home') });
    const topbar = el('div', { class: 'topbar' }, [back, el('div', { class: 'num screen-title' }, this.t('shop')), this.currency.el]);

    this.nameEl = el('span', { class: 'num' }, '');
    this.tagEl = el('span', { class: 'tag' }, '');
    this.trailPreview = el('div', { class: 'trail-preview hidden' });
    const preview = el('div', { class: 'shop-preview' }, [el('div', { class: 'rays shop-rays' }), el('div', { class: 'shop-name' }, [this.nameEl, this.tagEl]), this.trailPreview]);

    this.tabsEl = el('div', { class: 'tabs mist' });
    this.grid = el('div', { class: 'shop-grid' });
    this.cta = Button.create(g, { label: '', color: 'green', size: 'm', className: 'shop-cta', onClick: () => this.action() });
    const sheet = el('div', { class: 'shop-sheet' }, [this.tabsEl, el('div', { class: 'shop-scroll' }, [this.grid]), this.cta]);

    this.root.append(preview, topbar, sheet);
    this.render();
    gsap.fromTo(sheet, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
  }

  get items() {
    return this.tab === 'skins' ? SKINS : TRAILS;
  }

  owned(id) {
    return this.game.save.get(this.tab === 'skins' ? 'ownedSkins' : 'ownedTrails').includes(id);
  }

  equipped(id) {
    return this.game.save.get(this.tab === 'skins' ? 'equippedSkin' : 'equippedTrail') === id;
  }

  render() {
    const g = this.game;
    // Tabs
    this.tabsEl.replaceChildren(...[['skins', this.t('skins')], ['trails', this.t('trails')]].map(([k, label]) =>
      el('button', { class: `tab ${k === this.tab ? 'active' : ''}`, type: 'button', onclick: () => this.switchTab(k) }, label)));
    // Grid
    this.grid.replaceChildren(...this.items.map((item) => {
      const owned = this.owned(item.id);
      const eq = this.equipped(item.id);
      const cls = ['shop-item', eq ? 'eq' : '', item.id === this.sel ? 'sel' : '', owned ? '' : 'locked'].join(' ');
      const visual = this.tab === 'skins' ? SkinThumb.el(item.id, 38) : el('span', { class: 'trail-swatch', style: { background: item.css } });
      let cap;
      if (eq) cap = el('span', { class: 'cap eq' }, this.t('equipped'));
      else if (owned) cap = el('span', { class: 'cap owned' }, this.t('owned'));
      else cap = el('span', { class: 'cap price' }, this.priceNodes(item));
      return el('button', { class: cls, type: 'button', 'aria-label': item.name, onclick: () => this.select(item.id) }, [el('span', { class: 'item-visual' }, [visual]), cap]);
    }));
    // Preview + CTA
    const item = this.items.find((i) => i.id === this.sel) || this.items[0];
    this.nameEl.textContent = item.name.toUpperCase();
    if (item.rarity) {
      this.tagEl.className = `tag ${RARITY_STYLE[item.rarity]}`;
      this.tagEl.textContent = item.rarity;
      this.tagEl.classList.remove('hidden');
    } else this.tagEl.classList.add('hidden');
    this.trailPreview.classList.toggle('hidden', this.tab !== 'trails');
    this.trailPreview.style.background = item.css || '';
    if (this.tab === 'skins' && g.showcase.character.skinId !== item.id) g.showcase.setSkin(item.id);
    this.renderCta(item);
  }

  priceNodes(item) {
    const p = item.price;
    if (p.currency === 'coins') return [icon('coin', 14), formatNumber(p.amount)];
    if (p.currency === 'gems') return [icon('gem', 14), formatNumber(p.amount)];
    if (p.currency === 'ads') return [icon('adfree', 14), `${this.adCount(item.id)}/${p.amount}`];
    if (p.currency === 'daily') return [icon('gift', 14), this.t('day_n', { n: 7 })];
    return [this.t('free')];
  }

  adCount(id) {
    return this.game.save.get('adProgress')[id] || 0;
  }

  renderCta(item) {
    const btn = this.cta;
    btn.disabled = false;
    btn.className = 'btn m shop-cta';
    let label;
    let color = 'green';
    if (this.equipped(item.id)) { label = this.t('equipped'); btn.disabled = true; }
    else if (this.owned(item.id)) { label = this.t('equip'); }
    else {
      const p = item.price;
      if (p.currency === 'coins' || p.currency === 'gems') { label = `${this.t('unlock')} · ${formatNumber(p.amount)}`; color = 'yellow'; }
      else if (p.currency === 'ads') { label = `${this.t('watch_ad')} ${this.adCount(item.id)}/${p.amount}`; color = 'purple'; }
      else { label = this.t('daily_reward_only'); btn.disabled = true; }
    }
    btn.classList.add(color);
    const iconName = !this.owned(item.id) && item.price.currency === 'coins' ? 'coin' : !this.owned(item.id) && item.price.currency === 'gems' ? 'gem' : !this.owned(item.id) && item.price.currency === 'ads' ? 'video' : null;
    btn.replaceChildren(...(iconName ? [icon(iconName, 22, 'shadow')] : []), el('span', { class: 'btn-label' }, label));
  }

  switchTab(tab) {
    if (tab === this.tab) return;
    this.game.audio.play('tap');
    this.tab = tab;
    this.sel = this.tab === 'skins' ? this.game.save.get('equippedSkin') : this.game.save.get('equippedTrail');
    this.render();
  }

  select(id) {
    this.game.audio.play('tap');
    this.sel = id;
    this.render();
  }

  async action() {
    const g = this.game;
    const item = this.items.find((i) => i.id === this.sel);
    if (!item || this.equipped(item.id)) return;
    if (this.owned(item.id)) return this.equip(item);
    const p = item.price;
    if (p.currency === 'coins' || p.currency === 'gems') {
      if (!g.save.spend(p.currency, p.amount)) {
        TweenEffects.shake(this.cta);
        Toast.show(g, this.t(p.currency === 'gems' ? 'not_enough_gems' : 'not_enough_coins'), p.currency === 'gems' ? 'gem' : 'coin');
        return;
      }
      this.unlock(item);
    } else if (p.currency === 'ads') {
      const ok = await g.ads.showRewarded('shop_skin');
      if (!ok || !this.root) return;
      g.save.mutate((d) => { d.adProgress[item.id] = (d.adProgress[item.id] || 0) + 1; });
      if (this.adCount(item.id) >= p.amount) this.unlock(item);
      else this.render();
    }
  }

  unlock(item) {
    const g = this.game;
    const key = this.tab === 'skins' ? 'ownedSkins' : 'ownedTrails';
    g.save.set(key, [...g.save.get(key), item.id]);
    g.audio.play('claim');
    (g.confetti ||= new Confetti(g.engine)).fire(40);
    Toast.show(g, this.t('unlocked', { name: item.name }), 'check');
    this.equip(item);
  }

  equip(item) {
    const g = this.game;
    g.save.set(this.tab === 'skins' ? 'equippedSkin' : 'equippedTrail', item.id);
    if (this.tab === 'skins') g.showcase.cheer();
    g.audio.play('gate_good');
    this.render();
  }

  exit() {
    // Leave the showcase wearing the equipped skin.
    this.game.showcase?.character.setSkin(this.game.save.get('equippedSkin'));
    this.game.showcase?.hide();
    super.exit();
  }
}
