// Adventure: venturing into a zone. See rules/hero.js for the layer's contract.

import { COMBAT, ENERGY } from '../content/balance.js';
import { ZONE_BY_ID } from '../content/zones.js';
import { grantXp, heroLevel, heroPower } from './hero.js';

export function winChance(hero, zone) {
  const chance = COMBAT.winFactor * heroPower(hero) / zone.power;
  return Math.max(COMBAT.minChance, Math.min(COMBAT.maxChance, chance));
}

export const canEnter = (hero, zone) => heroLevel(hero) >= zone.level;

// Fights one battle and applies the whole outcome at once. `rng` returns a number in [0, 1), like Math.random;
// passing it in keeps the rules testable and lets a server own the dice later.
// The first event is { type: 'ventured', zoneId, won, xp, copper, drop } (drop is an item id or null).
export function venture(hero, zoneId, rng) {
  const zone = ZONE_BY_ID[zoneId];
  if (!zone || hero.energy < ENERGY.perVenture || !canEnter(hero, zone)) return [];

  hero.energy -= ENERGY.perVenture;
  const won = rng() < winChance(hero, zone);
  let xp = Math.round(zone.xp * COMBAT.lossXpShare);
  let copper = 0;
  let drop = null;
  if (won) {
    const [least, most] = zone.copper;
    xp = zone.xp;
    copper = least + Math.floor(rng() * (most - least + 1));
    if (!hero.owned.includes(zone.drop) && rng() < COMBAT.dropChance) drop = zone.drop;
    hero.wins += 1;
    hero.copper += copper;
    if (drop) hero.owned.push(drop);
  }
  const events = [{ type: 'ventured', zoneId, won, xp, copper, drop }];
  grantXp(hero, xp, events);
  return events;
}
