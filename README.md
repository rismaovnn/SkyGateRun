# Sky Gate Run

Game runner hypercasual HTML5 (portrait 9:16). Geser kiri/kanan untuk pilih gate angka, Pip makin **besar**, lalu hajar boss di garis finish.
Stack: **Vite · Three.js · GSAP · Howler.js**, JavaScript ES Modules murni (tanpa React/Vue).

## Menjalankan

```bash
npm install
npm run dev        # buka URL yang muncul (juga bisa diakses dari HP di jaringan yang sama)
npm run build      # hasil build produksi ke /dist
npm run preview
```

Parameter URL untuk debug:

| Param | Fungsi |
|---|---|
| `?speed=3` | simulasi 3× lebih cepat |
| `?level=8` | langsung main level 8 (sekali) |
| `?fps` | tampilkan FPS + jumlah draw call |

Di mode dev, objek `window.__game` tersedia di console (save, scenes, world, dll).
Kontrol desktop: drag mouse atau tombol panah ← →.

## Struktur

```
main.js                 entry: bikin context `game`, buka Splash
src/core/               Engine (renderer + loop + layout 9:16), AssetLoader, SceneManager (lazy import),
                        InputManager (swipe), AudioManager (Howler), SaveManager (localStorage),
                        EventBus, AdManager (placeholder rewarded ad), MissionManager, DailyRewardManager, I18n
src/scenes/             Splash, Home, Gameplay, Victory, Lose, Shop, Settings, DailyReward, Mission, Leaderboard
src/gameplay/           GameWorld, Player, PlayerController, CameraController, GateSystem, WeightSystem,
                        EnemySystem, FinishSystem, CoinSystem, ComboSystem, LevelGenerator,
                        CharacterModel, Environment, Track, Showcase, LabelFactory
src/ui/                 HUD, Popup, Button, ProgressBar, CurrencyBar, Toast, SkinThumb
src/effects/            Confetti (canvas 2D), Particles (THREE.Points + atlas), TweenEffects, ScreenShake
src/data/               skins, trails, missions, strings (EN/ID), LeaderboardData (dummy)
src/styles/             tokens.css, base.css, components.css, screens.css, animations.css
public/audio            12 SFX + 2 musik loop (mp3 + ogg), dibuat dengan tools/gen_audio.py
public/icons/icons.svg  sprite ikon (30+ symbol)
```

## Aturan gameplay

- Mulai dengan power 10. Gate: `+N` (cyan), `×N` (hijau), `−N` (merah), `÷N` (ungu). Gate tidak bisa membunuh (minimal power 1).
- Pasukan merah & gergaji mengurangi power; kalau power habis, kalah.
- Masuk tepat di tengah gate = **PERFECT** (+5, slow-mo singkat). 3+ gate positif berturut-turut = **COMBO** (+3% per step, maksimal +15%).
- Di finish: power ≥ boss = menang. Revive sekali per run (iklan atau 10 diamond).
- **WeightSystem**: badan, bahu, lengan, dan kaki di-tween satu per satu (tanpa scale parent), skala logaritmik sampai power 600.

## Performa

- Object pooling: gate, enemy, saw, partikel (ring buffer 700), confetti, pulau/awan yang didaur ulang di depan pemain.
- Semua koin = 1 InstancedMesh, semua partikel = 1 draw call (texture atlas 2×2 dibuat di canvas).
- Scene di-lazy-load (`import()`), Three/GSAP/Howler dipisah jadi chunk tersendiri saat build.
- Frustum culling bawaan Three; pixel ratio dibatasi 2; tanpa shadow map (pakai blob shadow).
- Loop berhenti kalau tab disembunyikan; dt dibatasi supaya nggak ada lompatan.

## Integrasi berikutnya

- **Iklan**: ganti `AdManager.showRewarded()` dengan SDK pilihanmu (AdMob/Capacitor, Poki, CrazyGames, GameDistribution).
- **Leaderboard online**: ganti `LeaderboardData.build()` dengan panggilan ke backend.
- **Privacy/Terms**: isi URL-nya di `SettingsScene` (sekarang masih menampilkan toast).
- **Font offline**: lihat `public/fonts/README.txt`.
- **Model 3D**: karakter dll. masih dibuat dari primitive Three.js; GLB bisa ditaruh di `public/models`.
