/**
 * Skin catalogue. Colours are hex numbers for Three.js materials.
 * price.currency: 'coins' | 'gems' | 'ads' | 'daily' | 'level'
 */
export const SKINS = [
  { id: 'default', name: 'Pip', rarity: 'Common', price: { currency: 'free', amount: 0 },
    body: 0x2f8cff, shade: 0x1d5fd8, visor: 0x0f172a, eye: 0x7df9ff, acc: 0xff8a1f, accessory: 'scarf' },
  { id: 'robot', name: 'Robot', rarity: 'Common', price: { currency: 'coins', amount: 500 },
    body: 0xcbd5e1, shade: 0x8796ae, visor: 0x0f172a, eye: 0x22d3ee, acc: 0x22d3ee, accessory: 'antenna' },
  { id: 'police', name: 'Police', rarity: 'Common', price: { currency: 'coins', amount: 800 },
    body: 0x2563eb, shade: 0x1e3a8a, visor: 0xfcd9b6, eye: 0x111827, acc: 0xfacc15, accessory: 'cap' },
  { id: 'knight', name: 'Knight', rarity: 'Rare', price: { currency: 'coins', amount: 1200 },
    body: 0xe5eaf2, shade: 0x9aa7ba, visor: 0x1e293b, eye: 0xfde68a, acc: 0xef4444, accessory: 'plume' },
  { id: 'ninja', name: 'Ninja', rarity: 'Rare', price: { currency: 'coins', amount: 1200 },
    body: 0x273449, shade: 0x111827, visor: 0xfcd9b6, eye: 0x111827, acc: 0xef4444, accessory: 'headband' },
  { id: 'pirate', name: 'Pirate', rarity: 'Rare', price: { currency: 'coins', amount: 1500 },
    body: 0xb45309, shade: 0x7c2d12, visor: 0xfcd9b6, eye: 0x111827, acc: 0xdc2626, accessory: 'bandana' },
  { id: 'astronaut', name: 'Astronaut', rarity: 'Epic', price: { currency: 'coins', amount: 2500 },
    body: 0xf8fafc, shade: 0xb8c4d6, visor: 0xf59e0b, eye: 0xfff7d6, acc: 0xff8a1f, accessory: 'helmet' },
  { id: 'samurai', name: 'Samurai', rarity: 'Epic', price: { currency: 'coins', amount: 3000 },
    body: 0xdc2626, shade: 0x991b1b, visor: 0xfcd9b6, eye: 0x111827, acc: 0x111827, accessory: 'topknot' },
  { id: 'alien', name: 'Alien', rarity: 'Epic', price: { currency: 'ads', amount: 5 },
    body: 0x4ade80, shade: 0x16a34a, visor: 0x0f172a, eye: 0xbef264, acc: 0xa3e635, accessory: 'antennae' },
  { id: 'golden', name: 'Golden', rarity: 'Legendary', price: { currency: 'gems', amount: 60 },
    body: 0xffc21a, shade: 0xd98e04, visor: 0x7c2d12, eye: 0xfff3b0, acc: 0xfff3b0, accessory: 'sparkle', metal: true },
  { id: 'rainbow', name: 'Rainbow', rarity: 'Legendary', price: { currency: 'daily', amount: 7 },
    body: 0xff5fa8, shade: 0x8b5cf6, visor: 0x0f172a, eye: 0xffffff, acc: 0xffffff, accessory: 'sparkle', rainbow: true }
];

export const RARITY_STYLE = {
  Common: 'rar-common',
  Rare: 'rar-rare',
  Epic: 'rar-epic',
  Legendary: 'rar-legendary'
};

export const getSkin = (id) => SKINS.find((s) => s.id === id) || SKINS[0];

/** CSS hex for UI swatches. */
export const cssHex = (n) => `#${n.toString(16).padStart(6, '0')}`;
