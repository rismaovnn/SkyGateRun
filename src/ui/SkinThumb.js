/**
 * SkinThumb — tiny 2D SVG portrait of Pip in a skin's colours (shop grid, leaderboard avatars).
 * Cheaper than rendering 3D thumbnails and always crisp.
 */
import { getSkin, cssHex } from '../data/skins.js';

const ACC = {
  scarf: (c) => `<rect x="34" y="52" width="32" height="8" rx="4" fill="${c}"/>`,
  antenna: (c) => `<line x1="50" y1="9" x2="50" y2="-2" stroke="#64748B" stroke-width="3"/><circle cx="50" cy="-3" r="4" fill="${c}"/>`,
  plume: (c) => `<path d="M50 9C56-6 74-4 80 8 70 3 60 6 55 13Z" fill="${c}"/>`,
  headband: (c) => `<rect x="27" y="17" width="46" height="6" rx="3" fill="${c}"/>`,
  cap: (c) => `<path d="M28 18Q50-4 72 18Z" fill="#1E3A8A"/><rect x="24" y="16" width="52" height="6" rx="3" fill="#0F172A"/><circle cx="50" cy="10" r="3.5" fill="${c}"/>`,
  helmet: () => `<circle cx="50" cy="32" r="30" fill="rgba(255,255,255,.2)" stroke="#fff" stroke-width="2.5"/>`,
  bandana: (c) => `<path d="M27 24Q50 0 73 24Z" fill="${c}"/>`,
  topknot: () => `<circle cx="50" cy="6" r="7" fill="#111827"/>`,
  antennae: (c) => `<line x1="40" y1="12" x2="32" y2="-2" stroke="#16A34A" stroke-width="3"/><line x1="60" y1="12" x2="68" y2="-2" stroke="#16A34A" stroke-width="3"/><circle cx="32" cy="-3" r="4.5" fill="${c}"/><circle cx="68" cy="-3" r="4.5" fill="${c}"/>`,
  sparkle: () => `<path d="M84 60l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" fill="#fff"/><path d="M12 30l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="#FFF7C2"/>`
};

export class SkinThumb {
  /** @returns {string} SVG markup */
  static svg(skinId, size = 48) {
    const s = getSkin(skinId);
    const body = s.rainbow ? 'url(#rb)' : cssHex(s.body);
    const shade = cssHex(s.shade);
    const acc = ACC[s.accessory]?.(cssHex(s.acc)) || '';
    const defs = s.rainbow ? '<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5FA8"/><stop offset=".33" stop-color="#FFD23F"/><stop offset=".66" stop-color="#22D3EE"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>' : '';
    return `<svg width="${size}" height="${Math.round(size * 1.6)}" viewBox="0 -8 100 168" aria-hidden="true">${defs}
<line x1="43" y1="100" x2="41" y2="147" stroke="${body}" stroke-width="13" stroke-linecap="round"/>
<line x1="57" y1="100" x2="59" y2="147" stroke="${shade}" stroke-width="13" stroke-linecap="round"/>
<rect x="33" y="54" width="34" height="50" rx="17" fill="${body}"/>
<line x1="36" y1="62" x2="25" y2="95" stroke="${body}" stroke-width="11" stroke-linecap="round"/>
<line x1="64" y1="62" x2="75" y2="95" stroke="${shade}" stroke-width="11" stroke-linecap="round"/>
<circle cx="50" cy="32" r="24" fill="${body}"/>
<ellipse cx="40" cy="20" rx="7" ry="4.5" fill="#fff" opacity=".45"/>
<rect x="29" y="25" width="42" height="15" rx="7.5" fill="${cssHex(s.visor)}"/>
<circle cx="42" cy="32.5" r="3.2" fill="${cssHex(s.eye)}"/><circle cx="58" cy="32.5" r="3.2" fill="${cssHex(s.eye)}"/>
${acc}</svg>`;
  }

  /** Same as svg() but wrapped in an element. */
  static el(skinId, size = 48, className = 'skin-thumb') {
    const span = document.createElement('span');
    span.className = className;
    span.innerHTML = SkinThumb.svg(skinId, size);
    return span;
  }
}
