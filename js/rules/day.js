// Day rollover. See rules/hero.js for the layer's contract.

import { HISTORY_DAYS } from '../content/balance.js';
import { doneCount } from './quests.js';

// Starts a new quest day if the calendar has moved on. Returns true if it did.
// The day only ever moves forward: if the phone's clock jumps back (travel, a wrong date), today's
// progress stays as it is until the calendar catches up.
export function rollDay(hero, today) {
  if (today <= hero.day) return false;
  hero.history[hero.day] = doneCount(hero);
  const days = Object.keys(hero.history).sort();
  while (days.length > HISTORY_DAYS) delete hero.history[days.shift()];
  hero.day = today;
  hero.progress = {};
  hero.chest = null;
  return true;
}
