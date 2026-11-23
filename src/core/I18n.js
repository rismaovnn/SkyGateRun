/**
 * I18n — string lookup. Language saved in settings; falls back to English, then to the key.
 */
import { STRINGS, LANGUAGES } from '../data/strings.js';

export class I18n {
  constructor(save) {
    this.save = save;
  }

  get lang() {
    const l = this.save.setting('lang');
    return STRINGS[l] ? l : 'en';
  }

  get languages() {
    return LANGUAGES;
  }

  /** t('play') or t('reset_in', { time: '01:00:00' }) */
  t(key, vars) {
    let s = STRINGS[this.lang]?.[key] ?? STRINGS.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  }

  cycle() {
    const codes = LANGUAGES.map((l) => l.code);
    const next = codes[(codes.indexOf(this.lang) + 1) % codes.length];
    this.save.setting('lang', next);
    return next;
  }
}
