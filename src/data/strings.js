/**
 * UI strings. Add a language by copying the `en` block. Missing keys fall back to English.
 * Placeholders: {n}, {time}, {name}, {gems}
 */
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'id', name: 'Bahasa Indonesia' }
];

export const STRINGS = {
  en: {
    loading: 'LOADING...',
    tip_1: 'Tip: ×2 gates beat +50 once your power is big!',
    tip_2: 'Tip: hit the centre of a gate for a PERFECT bonus.',
    tip_3: 'Tip: chain good gates to build a COMBO.',
    tip_dodge: 'Tip: dodge red squads and saws — they eat your power.',
    tap_continue: 'TAP TO CONTINUE',
    play: 'PLAY', best: 'BEST', level_n: 'LEVEL {n}',
    daily: 'DAILY', missions: 'MISSIONS', rank: 'RANK', free: 'FREE',
    skins: 'SKINS', trails: 'TRAILS', shop: 'SHOP', back: 'Back', home: 'HOME',
    settings: 'SETTINGS', music: 'Music', sound: 'Sound FX', vibration: 'Vibration', language: 'Language',
    privacy: 'Privacy Policy', terms: 'Terms of Service', restore: 'Restore Purchase',
    privacy_toast: 'Add your privacy policy URL here', terms_toast: 'Add your terms URL here', restore_toast: 'No purchases to restore',
    pause: 'Pause', paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART',
    power: 'POWER', swipe_to_start: 'SWIPE TO START', swipe_to_move: 'SWIPE TO MOVE', combo: 'COMBO', perfect: 'PERFECT!', fight: 'FIGHT!',
    victory: 'VICTORY!', level_complete: 'LEVEL {n} COMPLETE', claim_x: 'CLAIM ×{n}', claimed: 'CLAIMED', next_level: 'NEXT LEVEL',
    oops: 'OOPS!', reason_boss: 'NOT ENOUGH POWER', reason_enemy: 'THE SQUAD WAS TOO STRONG', reason_saw: 'CUT BY A SAW', reason_gate: 'POWER RAN OUT',
    you: 'YOU', boss: 'BOSS', progress: 'Level progress', revive: 'REVIVE', revive_note: 'Continue with extra power',
    try_again: 'TRY AGAIN', not_enough_gems: 'Not enough diamonds', not_enough_coins: 'Not enough coins',
    equip: 'EQUIP', equipped: 'EQUIPPED', owned: 'OWNED', unlock: 'UNLOCK', watch_ad: 'WATCH AD', daily_reward_only: 'DAY-7 REWARD', unlocked: '{name} unlocked!',
    daily_reward: 'DAILY REWARD', daily_sub: 'Log in 7 days in a row for the Rainbow skin!', today: 'TODAY', day_n: 'DAY {n}',
    day7_reward: 'Rainbow skin + {gems} diamonds', claim: 'CLAIM', claim_x2: 'CLAIM ×2', come_back: 'COME BACK TOMORROW', next_reward_in: 'Next reward in {time}',
    weekly: 'WEEKLY', bonus_chest: 'BONUS CHEST', chest_reward: '+{n} diamonds!', done: 'DONE', go: 'GO', reset_in: 'Resets in {time}',
    m_gate_good: 'Pass {n} good gates', m_gate_mul: 'Pass {n} × gates', m_coins: 'Collect {n} coins', m_boss: 'Defeat {n} bosses',
    m_perfect: 'Get {n} PERFECTs', m_power: 'Reach {n} power in one run', m_combo: 'Reach a ×{n} combo', m_wins: 'Win {n} levels', m_ads: 'Watch {n} reward videos',
    leaderboard: 'LEADERBOARD', global: 'Global', friends: 'Friends', country: 'Country', season_reward: 'Top 10 this week win the Golden skin'
  },
  id: {
    loading: 'MEMUAT...',
    tip_1: 'Tips: gate ×2 lebih kuat dari +50 kalau angkamu besar!',
    tip_2: 'Tips: masuk tepat di tengah gate untuk bonus PERFECT.',
    tip_3: 'Tips: lewati gate bagus berturut-turut untuk COMBO.',
    tip_dodge: 'Tips: hindari pasukan merah & gergaji — mereka memakan power.',
    tap_continue: 'TAP UNTUK LANJUT',
    play: 'MAIN', best: 'TERBAIK', level_n: 'LEVEL {n}',
    daily: 'HARIAN', missions: 'MISI', rank: 'PERINGKAT', free: 'GRATIS',
    skins: 'SKIN', trails: 'JEJAK', shop: 'TOKO', back: 'Kembali', home: 'BERANDA',
    settings: 'PENGATURAN', music: 'Musik', sound: 'Efek Suara', vibration: 'Getar', language: 'Bahasa',
    privacy: 'Kebijakan Privasi', terms: 'Syarat Layanan', restore: 'Pulihkan Pembelian',
    privacy_toast: 'Tambahkan URL kebijakan privasi di sini', terms_toast: 'Tambahkan URL syarat layanan di sini', restore_toast: 'Tidak ada pembelian',
    pause: 'Jeda', paused: 'JEDA', resume: 'LANJUT', restart: 'ULANG',
    power: 'POWER', swipe_to_start: 'GESER UNTUK MULAI', swipe_to_move: 'GESER UNTUK BERGERAK', combo: 'COMBO', perfect: 'PERFECT!', fight: 'LAWAN!',
    victory: 'MENANG!', level_complete: 'LEVEL {n} SELESAI', claim_x: 'AMBIL ×{n}', claimed: 'DIAMBIL', next_level: 'LEVEL BERIKUTNYA',
    oops: 'OOPS!', reason_boss: 'POWER KURANG', reason_enemy: 'PASUKAN TERLALU KUAT', reason_saw: 'KENA GERGAJI', reason_gate: 'POWER HABIS',
    you: 'KAMU', boss: 'BOSS', progress: 'Progres level', revive: 'HIDUP LAGI', revive_note: 'Lanjut dengan power ekstra',
    try_again: 'COBA LAGI', not_enough_gems: 'Diamond tidak cukup', not_enough_coins: 'Koin tidak cukup',
    equip: 'PAKAI', equipped: 'DIPAKAI', owned: 'DIMILIKI', unlock: 'BUKA', watch_ad: 'TONTON IKLAN', daily_reward_only: 'HADIAH HARI-7', unlocked: '{name} terbuka!',
    daily_reward: 'HADIAH HARIAN', daily_sub: 'Login 7 hari berturut-turut untuk skin Rainbow!', today: 'HARI INI', day_n: 'HARI {n}',
    day7_reward: 'Skin Rainbow + {gems} diamond', claim: 'AMBIL', claim_x2: 'AMBIL ×2', come_back: 'DATANG LAGI BESOK', next_reward_in: 'Hadiah berikutnya {time}',
    weekly: 'MINGGUAN', bonus_chest: 'PETI BONUS', chest_reward: '+{n} diamond!', done: 'SELESAI', go: 'MAIN', reset_in: 'Reset dalam {time}',
    m_gate_good: 'Lewati {n} gate bagus', m_gate_mul: 'Lewati {n} gate ×', m_coins: 'Kumpulkan {n} koin', m_boss: 'Kalahkan {n} boss',
    m_perfect: 'Dapat {n} PERFECT', m_power: 'Capai power {n} dalam 1 run', m_combo: 'Capai combo ×{n}', m_wins: 'Menangkan {n} level', m_ads: 'Tonton {n} video hadiah',
    leaderboard: 'PERINGKAT', global: 'Global', friends: 'Teman', country: 'Negara', season_reward: 'Top 10 minggu ini dapat skin Golden'
  }
};
