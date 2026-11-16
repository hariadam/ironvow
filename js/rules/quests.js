// Daily quests: progress, completion, streaks and the Champion's Cache. See rules/hero.js for the layer's contract.
// "Today" is always hero.day; rules/day.js is the only place the calendar moves it.

import { CACHE, ENERGY, STREAK } from '../content/balance.js';
import { AMOUNT_QUESTS, QUEST_BY_ID, QUESTS } from '../content/quests.js';
import { shiftDay } from './days.js';
import { grantXp } from './hero.js';

const blankProgress = () => ({ val: 0, done: false, rw: null });

// Today's progress on a quest, for reading only.
export const progressOf = (hero, questId) => hero.progress[questId] || blankProgress();

const progressFor = (hero, questId) => hero.progress[questId] || (hero.progress[questId] = blankProgress());

export const goalOf = (hero, quest) => hero.goals[quest.id] ?? quest.goal.default;

export const doneCount = hero => QUESTS.filter(quest => progressOf(hero, quest.id).done).length;

// Days in a row this quest has been kept, counting today if it is done. 0 once a day has been missed.
export function streakOf(hero, questId) {
  const streak = hero.streaks[questId];
  if (!streak) return 0;
  return streak.last === hero.day || streak.last === shiftDay(hero.day, -1) ? streak.n : 0;
}

// What the quest pays: the reward already banked if it is done, otherwise what completing it now would pay.
export function rewardOf(hero, quest) {
  const progress = progressOf(hero, quest.id);
  if (progress.done && progress.rw) return { xp: progress.rw.xp, copper: progress.rw.c };
  const streak = hero.streaks[quest.id];
  const days = streak && streak.last === shiftDay(hero.day, -1) ? streak.n + 1 : 1;
  const mult = 1 + Math.min(STREAK.maxBonus, (days - 1) * STREAK.bonusPerDay);
  return { xp: Math.round(quest.xp * mult), copper: Math.round(quest.copper * mult / 100) * 100, days };
}

export const cacheReady = hero => !hero.chest && doneCount(hero) === QUESTS.length;

export function completeQuest(hero, questId) {
  const quest = QUEST_BY_ID[questId];
  if (!quest) return [];
  const progress = progressFor(hero, questId);
  if (progress.done) return [];

  const { xp, copper, days } = rewardOf(hero, quest);
  const energy = Math.max(0, Math.min(ENERGY.perQuest, ENERGY.cap - hero.energy));
  const before = hero.streaks[questId];
  // rw remembers exactly what was paid, so uncompleteQuest can take the same amounts back.
  progress.done = true;
  progress.rw = { xp, c: copper, en: energy, prev: before ? { n: before.n, last: before.last } : { n: 0, last: null } };
  hero.streaks[questId] = { n: days, last: hero.day };
  hero.copper += copper;
  hero.energy += energy;
  hero.train[quest.stat] += 1;

  const events = [{ type: 'questCompleted', questId, xp, copper, energy, stat: quest.stat }];
  grantXp(hero, xp, events);
  if (cacheReady(hero)) events.push({ type: 'cacheReady' });
  return events;
}

export function uncompleteQuest(hero, questId) {
  const quest = QUEST_BY_ID[questId];
  const progress = hero.progress[questId];
  if (!quest || !progress || !progress.done || !progress.rw) return [];

  const events = [];
  // The cache needs every quest done, so undoing one takes the cache back too.
  if (hero.chest) {
    hero.copper = Math.max(0, hero.copper - hero.chest.c);
    hero.energy = Math.max(0, hero.energy - hero.chest.en);
    grantXp(hero, -hero.chest.xp, events);
    hero.chest = null;
  }
  const paid = progress.rw;
  hero.copper = Math.max(0, hero.copper - paid.c);
  hero.energy = Math.max(0, hero.energy - paid.en);
  hero.train[quest.stat] = Math.max(0, hero.train[quest.stat] - 1);
  grantXp(hero, -paid.xp, events);
  if (paid.prev.last) hero.streaks[questId] = paid.prev; else delete hero.streaks[questId];
  progress.done = false;
  progress.rw = null;
  events.push({ type: 'questUndone', questId });
  return events;
}

// Sets today's total for an amount quest; completes or un-completes it as the total crosses the goal.
export function setQuestAmount(hero, questId, value) {
  const quest = QUEST_BY_ID[questId];
  if (!quest || quest.kind !== 'amount' || !Number.isFinite(value)) return [];
  const progress = progressFor(hero, questId);
  const amount = Math.max(0, Math.round(value));
  if (amount === progress.val) return [];

  hero.totals[questId] = Math.max(0, (hero.totals[questId] || 0) + amount - progress.val);
  progress.val = amount;
  const events = [{ type: 'amountSet', questId, amount }];
  const goal = goalOf(hero, quest);
  if (!progress.done && amount >= goal) events.push(...completeQuest(hero, questId));
  else if (progress.done && amount < goal) events.push(...uncompleteQuest(hero, questId));
  return events;
}

export const addQuestAmount = (hero, questId, amount) => setQuestAmount(hero, questId, progressOf(hero, questId).val + amount);

// Changes daily targets. `goals` is questId → number; entries below the quest's minimum are ignored.
// Lowering a goal below today's total completes the quest; raising one never takes a reward back.
export function setGoals(hero, goals) {
  const events = [];
  for (const quest of AMOUNT_QUESTS) {
    const goal = Math.round(goals[quest.id]);
    if (!Number.isFinite(goal) || goal < quest.goal.min || goal === goalOf(hero, quest)) continue;
    hero.goals[quest.id] = goal;
    events.push({ type: 'goalSet', questId: quest.id, goal });
    const progress = progressOf(hero, quest.id);
    if (!progress.done && progress.val >= goal) events.push(...completeQuest(hero, quest.id));
  }
  return events;
}

export function claimCache(hero) {
  if (!cacheReady(hero)) return [];
  const energy = Math.max(0, Math.min(CACHE.energy, ENERGY.cap - hero.energy));
  hero.chest = { xp: CACHE.xp, c: CACHE.copper, en: energy };
  hero.copper += CACHE.copper;
  hero.energy += energy;
  const events = [{ type: 'cacheClaimed', xp: CACHE.xp, copper: CACHE.copper, energy }];
  grantXp(hero, CACHE.xp, events);
  return events;
}
