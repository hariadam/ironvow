import { MAX_LEVEL, XP_CURVE } from '../content/balance.js';

// XP needed to go from `level` to the next one.
export const xpToNext = level => Math.round(XP_CURVE.base * Math.pow(level, XP_CURVE.exponent));

// Where a lifetime XP total puts a hero: { level, into (XP earned inside this level), need (XP for the next; 0 at max level) }.
export function levelInfo(totalXp) {
  let level = 1;
  let into = Math.max(0, totalXp);
  while (level < MAX_LEVEL && into >= xpToNext(level)) { into -= xpToNext(level); level++; }
  return { level, into, need: level >= MAX_LEVEL ? 0 : xpToNext(level) };
}
