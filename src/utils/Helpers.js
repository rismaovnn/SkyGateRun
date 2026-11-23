/**
 * Helpers.js — small pure helpers shared by every module.
 */

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const lerp = (a, b, t) => a + (b - a) * t;

/** Frame-rate independent smoothing: move `a` towards `b` with rate `k` per second. */
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

/** 12345 → "12,345" */
export const formatNumber = (n) => Math.round(n).toLocaleString('en-US');

/** Mulberry32 seeded random — levels are deterministic per level number. */
export function seededRandom(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random int in [min, max] using a provided rng. */
export const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/** Local date key "YYYY-MM-DD" (daily reward / missions). */
export function dateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Whole days between two date keys. */
export function daysBetween(keyA, keyB) {
  const a = new Date(keyA + 'T00:00:00');
  const b = new Date(keyB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

/** Week key "YYYY-Www" (ISO week, Monday start). */
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Milliseconds until next local midnight. */
export function msUntilMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next - now;
}

/** Milliseconds until next Monday 00:00 local. */
export function msUntilNextWeek(now = new Date()) {
  const next = new Date(now);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() + (8 - day));
  next.setHours(0, 0, 0, 0);
  return next - now;
}

/** 3725000 → "01:02:05", or "2d 03:04" when longer than a day. */
export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return d > 0 ? `${d}d ${h}:${m}` : `${h}:${m}:${sec}`;
}

/**
 * Tiny DOM builder.
 *   el('div', { class: 'card', onclick: fn }, [child, 'text'])
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return node;
}

/** SVG icon from the sprite in /public/icons/icons.svg (inlined into the page by AssetLoader). */
export function icon(name, size = 24, extraClass = '') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', `ico ${extraClass}`.trim());
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.appendChild(use);
  return svg;
}

/** Haptic feedback, respecting the vibration setting (set by SaveManager). */
export function vibrate(pattern = 12) {
  if (!vibrate.enabled) return;
  try { navigator.vibrate?.(pattern); } catch { /* not supported */ }
}
vibrate.enabled = true;

/** Wait helper. */
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
