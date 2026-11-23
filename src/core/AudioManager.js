/**
 * AudioManager — Howler wrapper. Music and SFX can be toggled independently (saved in settings).
 * Every file ships as .mp3 (+ .ogg fallback) in /public/audio.
 */
import { Howl, Howler } from 'howler';

const BASE = `${import.meta.env.BASE_URL}audio/`;

/** name → { file, volume, loop } */
const SOUNDS = {
  tap: { file: 'sfx_tap', volume: 0.5 },
  gate_good: { file: 'sfx_gate_good', volume: 0.6 },
  gate_bad: { file: 'sfx_gate_bad', volume: 0.6 },
  coin: { file: 'sfx_coin', volume: 0.35 },
  perfect: { file: 'sfx_perfect', volume: 0.6 },
  combo: { file: 'sfx_combo', volume: 0.5 },
  hit: { file: 'sfx_hit', volume: 0.7 },
  win: { file: 'sfx_win', volume: 0.7 },
  lose: { file: 'sfx_lose', volume: 0.7 },
  claim: { file: 'sfx_claim', volume: 0.6 },
  whoosh: { file: 'sfx_whoosh', volume: 0.45 },
  tick: { file: 'sfx_tick', volume: 0.5 }
};
const MUSIC = {
  menu: { file: 'music_menu', volume: 0.35 },
  run: { file: 'music_run', volume: 0.32 }
};

export class AudioManager {
  constructor(save) {
    this.save = save;
    this.sfx = new Map();
    this.music = new Map();
    this.currentMusic = null;
    this.lastPlay = new Map(); // throttle spammy sounds (coins)
    this.musicOn = save.setting('music');
    this.soundOn = save.setting('sound');
  }

  /** Returns load jobs for the AssetLoader (one per file). */
  loadJobs() {
    const make = (name, def, target, loop) => () => new Promise((resolve) => {
      const howl = new Howl({
        src: [`${BASE}${def.file}.mp3`, `${BASE}${def.file}.ogg`],
        volume: def.volume,
        loop,
        preload: true,
        onload: resolve,
        onloaderror: (_id, err) => { console.warn('[Audio] failed', def.file, err); resolve(); }
      });
      target.set(name, howl);
    });
    return [
      ...Object.entries(SOUNDS).map(([n, d]) => make(n, d, this.sfx, false)),
      ...Object.entries(MUSIC).map(([n, d]) => make(n, d, this.music, true))
    ];
  }

  play(name, { rate = 1, throttle = 0 } = {}) {
    if (!this.soundOn) return;
    const howl = this.sfx.get(name);
    if (!howl) return;
    if (throttle) {
      const now = performance.now();
      if (now - (this.lastPlay.get(name) || 0) < throttle) return;
      this.lastPlay.set(name, now);
    }
    const id = howl.play();
    if (rate !== 1) howl.rate(rate, id);
  }

  playMusic(name) {
    if (this.currentMusic === name) return;
    const prev = this.music.get(this.currentMusic);
    if (prev) prev.fade(prev.volume(), 0, 300).once('fade', () => prev.stop());
    this.currentMusic = name;
    if (!this.musicOn) return;
    const next = this.music.get(name);
    if (!next) return;
    const target = MUSIC[name].volume;
    next.volume(0);
    next.play();
    next.fade(0, target, 500);
  }

  setMusic(on) {
    this.musicOn = this.save.setting('music', on);
    const cur = this.music.get(this.currentMusic);
    if (!cur) return;
    if (on) {
      cur.volume(MUSIC[this.currentMusic].volume);
      if (!cur.playing()) cur.play();
    } else cur.stop();
  }

  setSound(on) {
    this.soundOn = this.save.setting('sound', on);
  }

  /** Pause / resume everything (game pause, tab hidden). */
  setPaused(paused) {
    Howler.mute(paused);
  }
}
