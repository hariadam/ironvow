// ---------- Data ----------
const STATS = ['str', 'agi', 'int', 'spi', 'sta'];
const STAT_NAME = { str: 'Strength', agi: 'Agility', int: 'Intellect', spi: 'Spirit', sta: 'Stamina' };
const CLASSES = {
  warrior: { name: 'Warrior', glyph: 'W', blurb: 'Steel and grit. Thrives on Strength and Stamina.',
    base: { str: 5, agi: 3, int: 1, spi: 1, sta: 5 }, grow: { str: 2, agi: 1, int: 0, spi: 0, sta: 2 },
    w: { str: 2, agi: 0.5, int: 0, spi: 0.3, sta: 1.5 }, start: 'w0w', strike: 'You charge in, blade first.' },
  mage: { name: 'Mage', glyph: 'M', blurb: 'Arcane fire. Thrives on Intellect and Spirit.',
    base: { str: 1, agi: 1, int: 5, spi: 4, sta: 3 }, grow: { str: 0, agi: 0, int: 2, spi: 1, sta: 1 },
    w: { str: 0, agi: 0, int: 2, spi: 1.2, sta: 1 }, start: 'w0m', strike: 'You hurl a blazing bolt of fire.' },
  ranger: { name: 'Ranger', glyph: 'R', blurb: 'Bow and wild. Thrives on Agility and Stamina.',
    base: { str: 2, agi: 5, int: 1, spi: 2, sta: 4 }, grow: { str: 1, agi: 2, int: 0, spi: 0, sta: 1 },
    w: { str: 0.5, agi: 2, int: 0, spi: 0.3, sta: 1.2 }, start: 'w0r', strike: 'Your arrows find their mark.' },
  priest: { name: 'Priest', glyph: 'P', blurb: 'Holy light. Thrives on Spirit and Intellect.',
    base: { str: 1, agi: 1, int: 4, spi: 5, sta: 3 }, grow: { str: 0, agi: 0, int: 1, spi: 2, sta: 1 },
    w: { str: 0, agi: 0, int: 1.2, spi: 2, sta: 1 }, start: 'w0p', strike: 'Holy light sears the shadows.' },
};
const SLOTS = { weapon: 'Weapon', helm: 'Head', chest: 'Chest', trinket: 'Trinket' };
const I = (n, slot, r, lvl, price, st, shop = true) => ({ n, slot, r, lvl, price, st, shop });
const ITEMS = {
  w0w: I('Worn Shortsword', 'weapon', 'poor', 1, 40, { str: 1 }, false),
  w0m: I('Cracked Apprentice Staff', 'weapon', 'poor', 1, 40, { int: 1 }, false),
  w0r: I('Frayed Shortbow', 'weapon', 'poor', 1, 40, { agi: 1 }, false),
  w0p: I('Chipped Mace', 'weapon', 'poor', 1, 40, { spi: 1 }, false),
  oakclub: I('Oakhewn Club', 'weapon', 'common', 1, 15000, { str: 3, sta: 1 }),
  ashstaff: I('Ashwood Staff', 'weapon', 'common', 1, 15000, { int: 3, spi: 1 }),
  huntbow: I("Hunter's Shortbow", 'weapon', 'common', 1, 15000, { agi: 3, sta: 1 }),
  sunmace: I('Sunwrought Mace', 'weapon', 'common', 1, 15000, { spi: 3, int: 1 }),
  leathercap: I('Padded Leather Cap', 'helm', 'common', 1, 10000, { sta: 2, agi: 1 }),
  jerkin: I("Traveler's Jerkin", 'chest', 'common', 1, 12000, { sta: 3 }),
  charm: I('Lucky Copper Charm', 'trinket', 'common', 2, 20000, { str: 1, agi: 1, int: 1, spi: 1, sta: 1 }),
  ironsword: I('Ironbark Greatsword', 'weapon', 'uncommon', 5, 80000, { str: 7, sta: 3 }),
  emberwand: I('Emberglass Wand', 'weapon', 'uncommon', 5, 80000, { int: 7, spi: 3 }),
  windbow: I('Windrunner Longbow', 'weapon', 'uncommon', 5, 80000, { agi: 7, sta: 3 }),
  dawnmace: I('Dawnbell Mace', 'weapon', 'uncommon', 5, 80000, { spi: 7, int: 3 }),
  squirehelm: I("Squire's Helm", 'helm', 'uncommon', 6, 60000, { sta: 5, str: 2 }),
  circlet: I('Circlet of Quiet Hours', 'helm', 'uncommon', 6, 60000, { spi: 4, int: 3 }),
  hauberk: I('Chainmail Hauberk', 'chest', 'uncommon', 8, 100000, { sta: 7, str: 3 }),
  robe: I('Robe of the Still Lake', 'chest', 'uncommon', 8, 100000, { int: 4, spi: 6 }),
  brigandine: I("Ranger's Brigandine", 'chest', 'uncommon', 8, 100000, { agi: 5, sta: 5 }),
  compass: I("Wayfarer's Compass", 'trinket', 'rare', 10, 250000, { agi: 6, sta: 6 }),
  hourglass: I('Hourglass of Calm', 'trinket', 'rare', 10, 250000, { int: 6, spi: 6 }),
  dawnblade: I('Dawnsteel Warblade', 'weapon', 'rare', 12, 300000, { str: 14, sta: 6 }),
  starscepter: I('Starfall Scepter', 'weapon', 'rare', 12, 300000, { int: 14, spi: 6 }),
  galebow: I('Galecaller Recurve', 'weapon', 'rare', 12, 300000, { agi: 14, sta: 6 }),
  mountainheart: I('Heart of the Mountain', 'trinket', 'epic', 18, 1000000, { str: 10, sta: 10 }),
  watchcrown: I('Crown of the Long Watch', 'helm', 'epic', 20, 1200000, { sta: 12, str: 3, agi: 3, int: 3, spi: 3 }),
  d1: I('Wolfhide Hood', 'helm', 'uncommon', 1, 6000, { agi: 3, sta: 2 }, false),
  d2: I("Miller's Iron Apron", 'chest', 'uncommon', 3, 12000, { sta: 4, str: 2 }, false),
  d3: I('Bog-Witch Talisman', 'trinket', 'uncommon', 6, 24000, { int: 4, spi: 3 }, false),
  d4: I("Redscar's Cutlass", 'weapon', 'rare', 10, 60000, { str: 9, agi: 5 }, false),
  d5: I('Cryptwarden Crown', 'helm', 'rare', 14, 90000, { sta: 8, spi: 6 }, false),
  d6: I('Emberforged Breastplate', 'chest', 'rare', 18, 140000, { str: 8, sta: 10 }, false),
  d7: I('Fang of Frostmaw', 'trinket', 'epic', 24, 300000, { agi: 12, str: 6, sta: 6 }, false),
  d8: I("Regalia of the Ashen King", 'chest', 'epic', 30, 500000, { str: 10, agi: 10, int: 10, spi: 10, sta: 14 }, false),
};
const ZONES = [
  { id: 'z1', name: 'Wolfpine Hollow', lvl: 1, pow: 15, xp: 30, g: [800, 2000], foe: 'A pack of mangy wolves', arrive: 'circles out of the pines', drop: 'd1' },
  { id: 'z2', name: 'Old Mill Cellars', lvl: 3, pow: 40, xp: 60, g: [1500, 3500], foe: 'A swarm of giant rats', arrive: 'pours out of the grain sacks', drop: 'd2' },
  { id: 'z3', name: 'Gloomfen Marsh', lvl: 6, pow: 75, xp: 100, g: [3000, 6000], foe: 'The Bog Witch', arrive: 'rises from the black water', drop: 'd3' },
  { id: 'z4', name: 'Bandit Ridge', lvl: 10, pow: 120, xp: 160, g: [5000, 10000], foe: 'Redscar and his bandits', arrive: 'block the mountain road', drop: 'd4' },
  { id: 'z5', name: 'Sunken Crypt', lvl: 14, pow: 180, xp: 240, g: [8000, 16000], foe: 'A restless cryptwarden', arrive: 'stirs in its tomb', drop: 'd5' },
  { id: 'z6', name: 'Emberpeak Caverns', lvl: 18, pow: 260, xp: 350, g: [12000, 24000], foe: 'A molten forge-golem', arrive: 'lumbers out of the lava glow', drop: 'd6' },
  { id: 'z7', name: 'Frostmaw Pass', lvl: 24, pow: 360, xp: 500, g: [20000, 40000], foe: 'Frostmaw, the white wyrm', arrive: 'descends from the peaks', drop: 'd7' },
  { id: 'z8', name: 'Citadel of the Ashen King', lvl: 30, pow: 480, xp: 750, g: [35000, 60000], foe: 'The Ashen King', arrive: 'rises from his smouldering throne', drop: 'd8' },
];
const fmtNum = v => Math.round(v).toLocaleString('en-GB');
const fmtL = ml => (ml / 1000).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' L';
const QUESTS = [
  { id: 'steps', name: 'The Long Road', text: g => `Walk ${fmtNum(g)} steps today.`, type: 'num', chips: [1000, 2500], chipLabel: v => '+' + fmtNum(v), fmt: v => fmtNum(v), unit: 'steps', stat: 'agi', xp: 60, c: 3500, def: 10000 },
  { id: 'exercise', name: 'Trial of Strength', text: g => `Train hard for ${g} minutes.`, type: 'num', chips: [5, 10, 15], chipLabel: v => `+${v} min`, fmt: v => `${v} min`, unit: 'min', stat: 'str', xp: 70, c: 4000, def: 30 },
  { id: 'meditate', name: 'Stillness of Mind', text: g => `Meditate for ${g} minutes.`, type: 'num', chips: [5, 10], chipLabel: v => `+${v} min`, fmt: v => `${v} min`, unit: 'min', stat: 'int', xp: 50, c: 3000, def: 10 },
  { id: 'water', name: 'Waters of the Spring', text: g => `Drink ${fmtL(g)} of water.`, type: 'num', chips: [250, 500], chipLabel: v => `+${v} ml`, fmt: v => fmtL(v), unit: 'ml', stat: 'spi', xp: 40, c: 2500, def: 2000 },
  { id: 'nojunk', name: 'Vow of the Clean Hearth', text: () => 'Eat no junk food or sweets today. Claim it once the day is done and the vow held.', type: 'check', stat: 'sta', xp: 60, c: 3000 },
];
const Q = Object.fromEntries(QUESTS.map(q => [q.id, q]));
const CHEST = { xp: 150, c: 10000, en: 2 };
const ENERGY_CAP = 10;
const MAX_LVL = 60;
