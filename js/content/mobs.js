// Wild mobs. Each kind lives in one biome (an id in content/world.js → BIOMES).
// foe + arrive make the battle story's opening line: "A pine wolf lunges from the undergrowth!"
// A mob's level comes from where it stands; its strength and rewards come from its level (rules/adventure.js).
// Mob ids are not stored in saves. Each id needs an 8×8 sprite in ui/art/tiles.js.

export const MOBS = [
  { id: 'boar', biome: 'grass', name: 'Bristle Boar', foe: 'A bristle boar', arrive: 'charges out of the tall grass' },
  { id: 'bandit', biome: 'grass', name: 'Road Bandit', foe: 'A road bandit', arrive: 'steps out with a drawn knife' },
  { id: 'wolf', biome: 'forest', name: 'Pine Wolf', foe: 'A pine wolf', arrive: 'lunges from the undergrowth' },
  { id: 'spider', biome: 'forest', name: 'Thornback Spider', foe: 'A thornback spider', arrive: 'drops from the branches' },
  { id: 'ram', biome: 'hills', name: 'Crag Ram', foe: 'A crag ram', arrive: 'lowers its horns and charges' },
  { id: 'golem', biome: 'hills', name: 'Rubble Golem', foe: 'A rubble golem', arrive: 'pulls itself out of the scree' },
  { id: 'toad', biome: 'swamp', name: 'Fen Toad', foe: 'A bloated fen toad', arrive: 'surfaces from the black water' },
  { id: 'wisp', biome: 'swamp', name: 'Marsh Wisp', foe: 'A marsh wisp', arrive: 'drifts out of the mist' },
];

export const MOB_BY_ID = Object.fromEntries(MOBS.map(mob => [mob.id, mob]));
