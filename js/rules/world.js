// The world: terrain, mob levels, dungeons and wild mobs, all worked out from WORLD.seed.
//
// RULES LAYER, with one difference from the other rules files: these functions take no hero, because the
// world is the same for everyone. Nothing here is stored; the same question always gets the same answer.
// What a hero has done in the world (where they are, what they have uncovered) is in rules/travel.js.
//
// Tiles are whole-number x, y with town at 0, 0; x grows east and y grows south.

import { MOBS } from '../content/mobs.js';
import { BIOMES, TERRAIN, WORLD } from '../content/world.js';
import { ZONES } from '../content/zones.js';

// The world is worked out in blocks of CHUNK × CHUNK tiles. gridKey turns a block's (or a tile's)
// coordinates into one number, good for Map keys; gridSpot turns it back.
export const CHUNK = 32;
export const gridKey = (x, y) => (x + 32768) * 65536 + (y + 32768);
export const gridSpot = key => [Math.floor(key / 65536) - 32768, key % 65536 - 32768];

// A number from 0 up to (not including) 1 that depends only on the seed, the two coordinates and `salt`.
// Different salts give unrelated numbers for the same tile. (The mixing is the public-domain MurmurHash3.)
const stir = (h, k) => {
  k = Math.imul(k | 0, 0xCC9E2D51);
  k = Math.imul(k << 15 | k >>> 17, 0x1B873593);
  h ^= k;
  return Math.imul(h << 13 | h >>> 19, 5) + 0xE6546B64 | 0;
};
export function roll(x, y, salt) {
  let h = stir(stir(stir(WORLD.seed, x), y), salt);
  h = Math.imul(h ^ h >>> 16, 0x85EBCA6B);
  h = Math.imul(h ^ h >>> 13, 0xC2B2AE35);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}

const SALT = { height: 10, wet: 20, level: 30, dungeon: 40, mob: 1000 };

const smooth = t => t * t * (3 - 2 * t);
function noise(x, y, salt) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = smooth(x - x0), fy = smooth(y - y0);
  const a = roll(x0, y0, salt), b = roll(x0 + 1, y0, salt), c = roll(x0, y0 + 1, salt), d = roll(x0 + 1, y0 + 1, salt);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
// Big shapes, plus two finer layers so coasts and forest edges are ragged.
const field = (x, y, size, salt) => noise(x / size, y / size, salt) * 0.6 + noise(x / (size / 2.3), y / (size / 2.3), salt + 1) * 0.28 + noise(x / (size / 6), y / (size / 6), salt + 2) * 0.12;

function biomeNumber(x, y) {
  if (x * x + y * y <= TERRAIN.townMeadow) return 0;
  const height = field(x, y, TERRAIN.heightSize, SALT.height), wet = field(x, y, TERRAIN.wetSize, SALT.wet);
  if (height < TERRAIN.water) return 4;
  if (height > TERRAIN.peak) return 5;
  if (height > TERRAIN.hills) return 2;
  if (wet > TERRAIN.swampWet && height < TERRAIN.swampBelow) return 3;
  return wet > TERRAIN.forest ? 1 : 0;
}

// The biome numbers of one block, row by row. Worked out once and kept.
const blocks = new Map();
export function blockBiomes(cx, cy) {
  const key = gridKey(cx, cy);
  let biomes = blocks.get(key);
  if (!biomes) {
    biomes = new Uint8Array(CHUNK * CHUNK);
    for (let j = 0; j < CHUNK; j++) for (let i = 0; i < CHUNK; i++) biomes[j * CHUNK + i] = biomeNumber(cx * CHUNK + i, cy * CHUNK + j);
    blocks.set(key, biomes);
  }
  return biomes;
}

export const biomeAt = (x, y) => BIOMES[blockBiomes(x >> 5, y >> 5)[(y & 31) * CHUNK + (x & 31)]];
export const walkable = (x, y) => biomeAt(x, y).walk;

// The level of the mobs that live on a tile.
export function levelAt(x, y) {
  const wobble = (noise(x / 30, y / 30, SALT.level) - 0.5) * WORLD.levelWobble;
  return Math.max(1, Math.min(60, Math.round(1 + Math.hypot(x, y) / WORLD.tilesPerLevel + wobble)));
}

function nearestWalkable(x, y) {
  for (let r = 0; r < 40; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) === r && walkable(x + dx, y + dy)) return [x + dx, y + dy];
  }
  return [x, y];
}

// Where every dungeon is: [{ zone, x, y }], in the order of ZONES. Each zone gets its own eighth of the world.
let placed = null;
export function dungeons() {
  if (!placed) {
    placed = ZONES.map((zone, i) => {
      const slice = WORLD.dungeonSlices[i % WORLD.dungeonSlices.length];
      const angle = (slice + 0.15 + roll(i, 0, SALT.dungeon) * 0.7) * (Math.PI * 2 / WORLD.dungeonSlices.length);
      const distance = Math.max(WORLD.dungeonMin, (zone.level - 1) * WORLD.tilesPerLevel) + roll(i, 1, SALT.dungeon) * WORLD.dungeonBand;
      const [x, y] = nearestWalkable(Math.round(Math.cos(angle) * distance), Math.round(Math.sin(angle) * distance));
      return { zone, x, y };
    });
  }
  return placed;
}

// The zone whose dungeon stands on this tile, if any.
export const zoneAt = (x, y) => dungeons().find(spot => spot.x === x && spot.y === y)?.zone || null;

// The wild mob standing on a tile on a given day (rules/days.js → dayNumber), as { mob, level }, or null.
// Mobs move every night: the same tile is rolled afresh each day.
export function mobAt(day, x, y) {
  if (x * x + y * y < WORLD.safeRadius * WORLD.safeRadius || !walkable(x, y) || zoneAt(x, y)) return null;
  const salt = SALT.mob + day * 2;
  if (roll(x, y, salt) >= WORLD.mobChance) return null;
  const kinds = MOBS.filter(mob => mob.biome === biomeAt(x, y).id);
  if (!kinds.length) return null;
  return { mob: kinds[Math.floor(roll(x, y, salt + 1) * kinds.length)], level: levelAt(x, y) };
}
