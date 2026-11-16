// Gear. Item ids and slot ids are stored in saves: never rename or delete one. Retire an item by
// setting sold: false and removing it from every drop, so heroes who own it keep it.

export const SLOTS = { weapon: 'Weapon', helm: 'Head', chest: 'Chest', trinket: 'Trinket' };

// Lowest to highest. The position in this list is the rarity index the sprite generator uses.
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// look: [kind, seed] picks the sprite. Kinds are listed in ui/art/items.js; the same kind, rarity and
// seed always draw the same sprite, so changing a seed here re-draws the item for everyone.
const item = (name, slot, rarity, level, price, stats, look, sold = true) => ({ name, slot, rarity, level, price, stats, look, sold });

export const ITEMS = {
  // Starting weapons, one per class. Not sold.
  w0w: item('Worn Shortsword', 'weapon', 'common', 1, 40, { str: 1 }, ['sword', 5], false),
  w0m: item('Cracked Apprentice Staff', 'weapon', 'common', 1, 40, { int: 1 }, ['staff', 1], false),
  w0r: item('Frayed Shortbow', 'weapon', 'common', 1, 40, { agi: 1 }, ['bow', 1], false),
  w0p: item('Chipped Mace', 'weapon', 'common', 1, 40, { spi: 1 }, ['mace', 1], false),

  // Vendor stock.
  oakclub: item('Oakhewn Club', 'weapon', 'common', 1, 15000, { str: 3, sta: 1 }, ['club', 2]),
  ashstaff: item('Ashwood Staff', 'weapon', 'common', 1, 15000, { int: 3, spi: 1 }, ['staff', 11]),
  huntbow: item("Hunter's Shortbow", 'weapon', 'common', 1, 15000, { agi: 3, sta: 1 }, ['bow', 2]),
  sunmace: item('Sunwrought Mace', 'weapon', 'common', 1, 15000, { spi: 3, int: 1 }, ['mace', 3]),
  leathercap: item('Padded Leather Cap', 'helm', 'common', 1, 10000, { sta: 2, agi: 1 }, ['helm', 5]),
  jerkin: item("Traveler's Jerkin", 'chest', 'common', 1, 12000, { sta: 3 }, ['chest', 0]),
  charm: item('Lucky Copper Charm', 'trinket', 'common', 2, 20000, { str: 1, agi: 1, int: 1, spi: 1, sta: 1 }, ['coin', 1]),
  ironsword: item('Ironbark Greatsword', 'weapon', 'uncommon', 5, 80000, { str: 7, sta: 3 }, ['sword', 5]),
  emberwand: item('Emberglass Wand', 'weapon', 'uncommon', 5, 80000, { int: 7, spi: 3 }, ['staff', 0]),
  windbow: item('Windrunner Longbow', 'weapon', 'uncommon', 5, 80000, { agi: 7, sta: 3 }, ['bow', 3]),
  dawnmace: item('Dawnbell Mace', 'weapon', 'uncommon', 5, 80000, { spi: 7, int: 3 }, ['mace', 4]),
  squirehelm: item("Squire's Helm", 'helm', 'uncommon', 6, 60000, { sta: 5, str: 2 }, ['helm', 10]),
  circlet: item('Circlet of Quiet Hours', 'helm', 'uncommon', 6, 60000, { spi: 4, int: 3 }, ['helm', 3]),
  hauberk: item('Chainmail Hauberk', 'chest', 'uncommon', 8, 100000, { sta: 7, str: 3 }, ['chest', 1]),
  robe: item('Robe of the Still Lake', 'chest', 'uncommon', 8, 100000, { int: 4, spi: 6 }, ['chest', 4]),
  brigandine: item("Ranger's Brigandine", 'chest', 'uncommon', 8, 100000, { agi: 5, sta: 5 }, ['chest', 0]),
  compass: item("Wayfarer's Compass", 'trinket', 'rare', 10, 250000, { agi: 6, sta: 6 }, ['coin', 2]),
  hourglass: item('Hourglass of Calm', 'trinket', 'rare', 10, 250000, { int: 6, spi: 6 }, ['hourglass', 1]),
  dawnblade: item('Dawnsteel Warblade', 'weapon', 'rare', 12, 300000, { str: 14, sta: 6 }, ['sword', 9]),
  starscepter: item('Starfall Scepter', 'weapon', 'rare', 12, 300000, { int: 14, spi: 6 }, ['staff', 6]),
  galebow: item('Galecaller Recurve', 'weapon', 'rare', 12, 300000, { agi: 14, sta: 6 }, ['bow', 4]),
  mountainheart: item('Heart of the Mountain', 'trinket', 'epic', 18, 1000000, { str: 10, sta: 10 }, ['gem', 1]),
  watchcrown: item('Crown of the Long Watch', 'helm', 'epic', 20, 1200000, { sta: 12, str: 3, agi: 3, int: 3, spi: 3 }, ['helm', 4]),

  // Zone drops. Not sold.
  d1: item('Wolfhide Hood', 'helm', 'uncommon', 1, 6000, { agi: 3, sta: 2 }, ['helm', 9], false),
  d2: item("Miller's Iron Apron", 'chest', 'uncommon', 3, 12000, { sta: 4, str: 2 }, ['chest', 6], false),
  d3: item('Bog-Witch Talisman', 'trinket', 'uncommon', 6, 24000, { int: 4, spi: 3 }, ['gem', 2], false),
  d4: item("Redscar's Cutlass", 'weapon', 'rare', 10, 60000, { str: 9, agi: 5 }, ['sword', 5], false),
  d5: item('Cryptwarden Crown', 'helm', 'rare', 14, 90000, { sta: 8, spi: 6 }, ['helm', 7], false),
  d6: item('Emberforged Breastplate', 'chest', 'rare', 18, 140000, { str: 8, sta: 10 }, ['chest', 2], false),
  d7: item('Fang of Frostmaw', 'trinket', 'epic', 24, 300000, { agi: 12, str: 6, sta: 6 }, ['fang', 1], false),
  d8: item('Regalia of the Ashen King', 'chest', 'epic', 30, 500000, { str: 10, agi: 10, int: 10, spi: 10, sta: 14 }, ['chest', 0], false),
};
