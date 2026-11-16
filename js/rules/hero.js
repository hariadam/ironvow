// The hero: creating one, and reading level, stats and battle power from a save.
//
// RULES LAYER (everything in js/rules): no DOM, no storage, no timers, no clock, no Math.random.
// Every function takes the save (`hero`) as its first argument. Functions that change it return a
// list of events ({ type, ... }) describing what happened; the screens decide how to show them.
// An empty list means nothing changed. This is what lets the rules move to a server later.

import { ENERGY, START_COPPER } from '../content/balance.js';
import { CLASSES, STATS } from '../content/classes.js';
import { ITEMS, SLOTS } from '../content/items.js';
import { AMOUNT_QUESTS } from '../content/quests.js';
import { levelInfo } from './level.js';

const zeroPerStat = () => Object.fromEntries(STATS.map(stat => [stat, 0]));

// A fresh save. Its shape is the save format: change it only together with SAVE_VERSION and a migration
// (see js/save/migrate.js). `today` is a day key from rules/days.js.
export function newHero(name, classId, today) {
  const starter = CLASSES[classId].starter;
  return {
    name, cls: classId, created: today,
    totalXp: 0, copper: START_COPPER, energy: ENERGY.start,
    train: zeroPerStat(),                                             // permanent stats earned from quests
    owned: [starter],                                                 // item ids, equipped ones included
    equip: { ...Object.fromEntries(Object.keys(SLOTS).map(slot => [slot, null])), [ITEMS[starter].slot]: starter },
    goals: Object.fromEntries(AMOUNT_QUESTS.map(q => [q.id, q.goal.default])),
    day: today,                                                       // the day `progress` and `chest` belong to
    progress: {},                                                     // questId → { val, done, rw (what completing paid, so it can be undone) }
    chest: null,                                                      // what today's Champion's Cache paid, or null if unclaimed
    streaks: {},                                                      // questId → { n, last (day key) }
    history: {},                                                      // day key → quests done that day
    totals: Object.fromEntries(AMOUNT_QUESTS.map(q => [q.id, 0])),    // lifetime amounts
    wins: 0,
  };
}

export const heroLevel = hero => levelInfo(hero.totalXp).level;

// Stats = class base + growth per level + trained + equipped gear.
export function heroStats(hero) {
  const cls = CLASSES[hero.cls];
  const level = heroLevel(hero);
  const stats = {};
  for (const stat of STATS) stats[stat] = cls.base[stat] + cls.growth[stat] * (level - 1) + hero.train[stat];
  for (const id of Object.values(hero.equip)) {
    const item = ITEMS[id];
    if (item) for (const [stat, bonus] of Object.entries(item.stats)) stats[stat] += bonus;
  }
  return stats;
}

export function heroPower(hero) {
  const stats = heroStats(hero);
  const weights = CLASSES[hero.cls].weights;
  return Math.round(STATS.reduce((sum, stat) => sum + stats[stat] * weights[stat], 0));
}

// Adds XP (or removes it, when a reward is undone) and reports a level-up.
export function grantXp(hero, xp, events) {
  const before = heroLevel(hero);
  hero.totalXp = Math.max(0, hero.totalXp + xp);
  const after = heroLevel(hero);
  if (after > before) events.push({ type: 'levelUp', level: after });
}
