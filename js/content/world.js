// The world map: one seeded world, the same for every player. Every number that shapes it lives here.
//
// CHANGING THE SEED OR ANY TERRAIN NUMBER RESHAPES THE WORLD under the land players have already
// explored, and moves the dungeons. tests/rules.test.js pins a sample of the world so that cannot happen
// by accident. Mob numbers (mobChance, mobReach) and the step numbers are safe to tune.

export const WORLD = {
  seed: 20261117,
  stepsPerTile: 10,     // real steps it costs to walk one tile
  startSteps: 1000,     // a hero's travel allowance on top of the steps they have logged
  view: 20,             // how far the hero sees, in tiles
  tilesPerLevel: 50,    // mob level rises by one every this many tiles from town...
  levelWobble: 4,       // ...give or take half of this, so some pockets are safer or nastier than their ring
  safeRadius: 4,        // no mobs this close to town
  mobChance: 0.006,     // chance that a tile of wild land holds a mob on a given day
  mobReach: 2,          // a hero can fight mobs up to this many levels above their own
  // Dungeons (the zones in content/zones.js). Each sits in its own eighth of the world, at the ring where
  // mobs are its level (never closer than dungeonMin tiles), plus up to dungeonBand tiles further out.
  dungeonSlices: [0, 3, 6, 1, 4, 7, 2, 5],
  dungeonMin: 30,
  dungeonBand: 40,
  planLimit: 120000,    // how many tiles a route search may look at before giving up
};

// Terrain comes from two smooth random fields, height and wetness, each between 0 and 1.
// The *Size numbers are how many tiles wide their biggest shapes are.
export const TERRAIN = {
  heightSize: 46, wetSize: 58,
  water: 0.36,                          // height below this is water
  peak: 0.69, hills: 0.61,              // height above these is mountain peak, or hills
  swampWet: 0.62, swampBelow: 0.46,     // wet, low land is swamp
  forest: 0.52,                         // wetter than this is forest; the rest is meadow
  townMeadow: 40,                       // squared radius of the meadow that always surrounds town
};

// Kinds of land. The position in this list is the number the generator uses: do not reorder.
// walk: whether a hero can cross it.
export const BIOMES = [
  { id: 'grass', name: 'Open meadow', walk: true },
  { id: 'forest', name: 'Pine forest', walk: true },
  { id: 'hills', name: 'Rocky hills', walk: true },
  { id: 'swamp', name: 'Gloomfen', walk: true },
  { id: 'water', name: 'Deep water', walk: false },
  { id: 'peak', name: 'Mountain peak', walk: false },
];

// The town at the centre of the world, where every hero starts.
export const TOWN = { name: 'Hearthford' };
