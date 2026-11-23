/**
 * main.js — entry point. Builds the shared `game` context and opens the splash screen.
 * The `game` object is passed to every scene: { engine, save, audio, input, assets, scenes, ads, missions, daily, i18n }
 */
import './src/styles/tokens.css';
import './src/styles/base.css';
import './src/styles/components.css';
import './src/styles/screens.css';
import './src/styles/animations.css';

import { Engine } from './src/core/Engine.js';
import { SaveManager } from './src/core/SaveManager.js';
import { AudioManager } from './src/core/AudioManager.js';
import { AssetLoader } from './src/core/AssetLoader.js';
import { InputManager } from './src/core/InputManager.js';
import { SceneManager } from './src/core/SceneManager.js';
import { AdManager } from './src/core/AdManager.js';
import { MissionManager } from './src/core/MissionManager.js';
import { DailyRewardManager } from './src/core/DailyRewardManager.js';
import { I18n } from './src/core/I18n.js';
import { bus } from './src/core/EventBus.js';
import { vibrate } from './src/utils/Helpers.js';

const save = new SaveManager();
vibrate.enabled = save.setting('vibration');
bus.on('settings:changed', ({ name, value }) => { if (name === 'vibration') vibrate.enabled = value; });

const engine = new Engine();
const audio = new AudioManager(save);

const game = {
  engine,
  save,
  audio,
  bus,
  input: new InputManager(engine),
  assets: new AssetLoader(audio),
  missions: new MissionManager(save),
  daily: new DailyRewardManager(save),
  i18n: new I18n(save)
};
game.ads = new AdManager(game);
game.scenes = new SceneManager(game);

// Block the browser's pinch-zoom / pull-to-refresh / long-press menu inside the game.
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

engine.start();
game.scenes.go('splash');

// Handy for debugging from the console during development.
if (import.meta.env.DEV) window.__game = game;
