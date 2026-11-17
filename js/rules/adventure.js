// Adventure: the foes of the world map and fighting them. See rules/hero.js for the layer's contract.
//
// A foe is either a dungeon's boss (a zone from content/zones.js, standing on its dungeon tile) or a wild
// mob (content/mobs.js, rolled per tile per day by rules/world.js). Both are described the same way:
//   { zone, mob (one of them is null), level, needs (hero level needed to fight it), power, xp,
//     copper: [least, most], drop (an item id, or null) }

import { COMBAT, ENERGY } from '../content/balance.js';
import { WORLD } from '../content/world.js';
import { ZONES } from '../content/zones.js';
import { dayNumber } from './days.js';
import { grantXp, heroLevel, heroPower } from './hero.js';
import { inView } from './travel.js';
import { mobAt, zoneAt } from './world.js';

// A wild mob's numbers at a level: what a zone of that level would have. Between two zones the numbers
// slide from one to the other; past the last zone they keep climbing at the same pace.
function mobNumbers(level) {
  let i = 1;
  while (i < ZONES.length - 1 && ZONES[i].level < level) i++;
  const low = ZONES[i - 1], high = ZONES[i];
  const share = Math.max(0, level - low.level) / (high.level - low.level);
  const slide = (from, to) => Math.round(from + (to - from) * share);
  return { power: slide(low.power, high.power), xp: slide(low.xp, high.xp), copper: [slide(low.copper[0], high.copper[0]), slide(low.copper[1], high.copper[1])] };
}

const spotName = (x, y) => `${x},${y}`;
// The tiles whose mob the hero has already beaten today.
const slainToday = hero => (hero.map.slain.day === hero.day ? hero.map.slain.at : []);

// The foe the hero knows of on a tile, or null. A dungeon's boss is always there; a wild mob is known
// only while its tile is inside the hero's view, and is gone for the day once beaten.
export function foeAt(hero, x, y) {
  const zone = zoneAt(x, y);
  if (zone) return { zone, mob: null, level: zone.level, needs: zone.level, power: zone.power, xp: zone.xp, copper: zone.copper, drop: zone.drop };
  if (!inView(hero, x, y) || slainToday(hero).includes(spotName(x, y))) return null;
  const found = mobAt(dayNumber(hero.day), x, y);
  if (!found) return null;
  return { zone: null, mob: found.mob, level: found.level, needs: Math.max(1, found.level - WORLD.mobReach), ...mobNumbers(found.level), drop: null };
}

// Every wild mob the hero can see right now, as [{ x, y, foe }].
export function foesInView(hero) {
  const found = [];
  for (let y = hero.map.y - WORLD.view; y <= hero.map.y + WORLD.view; y++) {
    for (let x = hero.map.x - WORLD.view; x <= hero.map.x + WORLD.view; x++) {
      const foe = foeAt(hero, x, y);
      if (foe && foe.mob) found.push({ x, y, foe });
    }
  }
  return found;
}

export function winChance(hero, foe) {
  const chance = COMBAT.winFactor * heroPower(hero) / foe.power;
  return Math.max(COMBAT.minChance, Math.min(COMBAT.maxChance, chance));
}

export const canFight = (hero, foe) => heroLevel(hero) >= foe.needs;

// Fights the foe on the hero's own tile and applies the whole outcome at once. `rng` returns a number in
// [0, 1), like Math.random; passing it in keeps the rules testable and lets a server own the dice later.
// The first event is { type: 'fought', zoneId, mobId (one of them is null), won, xp, copper, drop }.
export function fight(hero, rng) {
  const { x, y } = hero.map;
  const foe = foeAt(hero, x, y);
  if (!foe || hero.energy < ENERGY.perFight || !canFight(hero, foe)) return [];

  hero.energy -= ENERGY.perFight;
  const won = rng() < winChance(hero, foe);
  let xp = Math.round(foe.xp * COMBAT.lossXpShare);
  let copper = 0;
  let drop = null;
  if (won) {
    const [least, most] = foe.copper;
    xp = foe.xp;
    copper = least + Math.floor(rng() * (most - least + 1));
    if (foe.drop && !hero.owned.includes(foe.drop) && rng() < COMBAT.dropChance) drop = foe.drop;
    hero.wins += 1;
    hero.copper += copper;
    if (drop) hero.owned.push(drop);
    if (foe.mob) hero.map.slain = { day: hero.day, at: [...slainToday(hero), spotName(x, y)] };
  }
  const events = [{ type: 'fought', zoneId: foe.zone ? foe.zone.id : null, mobId: foe.mob ? foe.mob.id : null, won, xp, copper, drop }];
  grantXp(hero, xp, events);
  return events;
}
