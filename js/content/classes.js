// Stats and hero classes. Class ids are stored in saves: never rename or delete one.

export const STATS = ['str', 'agi', 'int', 'spi', 'sta'];

export const STAT_NAMES = { str: 'Strength', agi: 'Agility', int: 'Intellect', spi: 'Spirit', sta: 'Stamina' };

// base: stats at level 1. growth: stats gained per level. weights: how much each stat adds to battle power.
// starter: the weapon a new hero begins with (an id in ITEMS). emblem: a sprite name in ui/art/icons.js.
export const CLASSES = {
  warrior: {
    name: 'Warrior', blurb: 'Steel and grit. Thrives on Strength and Stamina.', emblem: 'warrior',
    base: { str: 5, agi: 3, int: 1, spi: 1, sta: 5 }, growth: { str: 2, agi: 1, int: 0, spi: 0, sta: 2 },
    weights: { str: 2, agi: 0.5, int: 0, spi: 0.3, sta: 1.5 }, starter: 'w0w', strike: 'You charge in, blade first.',
  },
  mage: {
    name: 'Mage', blurb: 'Arcane fire. Thrives on Intellect and Spirit.', emblem: 'mage',
    base: { str: 1, agi: 1, int: 5, spi: 4, sta: 3 }, growth: { str: 0, agi: 0, int: 2, spi: 1, sta: 1 },
    weights: { str: 0, agi: 0, int: 2, spi: 1.2, sta: 1 }, starter: 'w0m', strike: 'You hurl a blazing bolt of fire.',
  },
  ranger: {
    name: 'Ranger', blurb: 'Bow and wild. Thrives on Agility and Stamina.', emblem: 'ranger',
    base: { str: 2, agi: 5, int: 1, spi: 2, sta: 4 }, growth: { str: 1, agi: 2, int: 0, spi: 0, sta: 1 },
    weights: { str: 0.5, agi: 2, int: 0, spi: 0.3, sta: 1.2 }, starter: 'w0r', strike: 'Your arrows find their mark.',
  },
  priest: {
    name: 'Priest', blurb: 'Holy light. Thrives on Spirit and Intellect.', emblem: 'priest',
    base: { str: 1, agi: 1, int: 4, spi: 5, sta: 3 }, growth: { str: 0, agi: 0, int: 1, spi: 2, sta: 1 },
    weights: { str: 0, agi: 0, int: 1.2, spi: 2, sta: 1 }, starter: 'w0p', strike: 'Holy light sears the shadows.',
  },
};
