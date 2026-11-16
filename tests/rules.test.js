// Game rules. Run all tests with:  node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';

import { CACHE, COMBAT, ENERGY, HISTORY_DAYS, START_COPPER } from '../js/content/balance.js';
import { ITEMS } from '../js/content/items.js';
import { QUESTS } from '../js/content/quests.js';
import { ZONES } from '../js/content/zones.js';
import { venture, winChance } from '../js/rules/adventure.js';
import { rollDay } from '../js/rules/day.js';
import { dayKey, shiftDay } from '../js/rules/days.js';
import { bagItems, buyItem, equipItem, sellItem, sellValue, shopStock, unequipSlot } from '../js/rules/gear.js';
import { heroLevel, heroPower, heroStats, newHero } from '../js/rules/hero.js';
import { levelInfo, xpToNext } from '../js/rules/level.js';
import { addQuestAmount, cacheReady, claimCache, completeQuest, doneCount, rewardOf, setGoals, setQuestAmount, streakOf, uncompleteQuest } from '../js/rules/quests.js';

const DAY = '2026-03-10';
const hero = (cls = 'warrior') => newHero('Tester', cls, DAY);
const snapshot = h => JSON.stringify(h);
const types = events => events.map(e => e.type);

test('day keys shift across months, years and clock changes', () => {
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDay('2025-12-31', 1), '2026-01-01');
  assert.equal(shiftDay('2026-03-29', 1), '2026-03-30');
});

test('level curve: 100 × L^1.5, capped at level 60', () => {
  assert.equal(xpToNext(1), 100);
  assert.equal(xpToNext(4), 800);
  assert.deepEqual(levelInfo(0), { level: 1, into: 0, need: 100 });
  assert.deepEqual(levelInfo(100), { level: 2, into: 0, need: xpToNext(2) });
  assert.equal(levelInfo(1e9).level, 60);
  assert.equal(levelInfo(1e9).need, 0);
});

test('a new hero starts with the class weapon equipped', () => {
  const h = hero('mage');
  assert.deepEqual(h.owned, ['w0m']);
  assert.equal(h.equip.weapon, 'w0m');
  assert.equal(h.copper, START_COPPER);
  assert.equal(h.energy, ENERGY.start);
  assert.equal(heroStats(h).int, 5 + 1);
  assert.equal(heroPower(h), Math.round(6 * 2 + 4 * 1.2 + 3 * 1));
});

test('completing a quest pays XP, copper, energy and a trained stat; undoing takes it all back', () => {
  const h = hero();
  const before = snapshot(h);
  const events = completeQuest(h, 'vitamins');
  assert.deepEqual(types(events), ['questCompleted']);
  assert.equal(h.totalXp, 30);
  assert.equal(h.copper, START_COPPER + 2000);
  assert.equal(h.energy, ENERGY.start + 1);
  assert.equal(h.train.sta, 1);
  assert.deepEqual(completeQuest(h, 'vitamins'), [], 'cannot complete twice');

  assert.deepEqual(types(uncompleteQuest(h, 'vitamins')), ['questUndone']);
  h.progress = {};
  assert.equal(snapshot(h), before);
});

test('amount quests complete at the goal, track lifetime totals and undo below the goal', () => {
  const h = hero();
  assert.deepEqual(types(addQuestAmount(h, 'steps', 2500)), ['amountSet']);
  assert.deepEqual(types(setQuestAmount(h, 'steps', 10000)), ['amountSet', 'questCompleted']);
  assert.equal(h.totals.steps, 10000);
  assert.deepEqual(types(setQuestAmount(h, 'steps', 4000)), ['amountSet', 'questUndone']);
  assert.equal(h.totals.steps, 4000);
  assert.equal(h.totalXp, 0);
  assert.deepEqual(setQuestAmount(h, 'steps', 4000), [], 'no change, no events');
  assert.deepEqual(setQuestAmount(h, 'steps', NaN), []);
  assert.deepEqual(setQuestAmount(h, 'vitamins', 5), [], 'check quests take no amount');
  assert.equal(setQuestAmount(h, 'steps', -50).length, 1);
  assert.equal(h.progress.steps.val, 0);
});

test('energy never passes the cap', () => {
  const h = hero();
  h.energy = ENERGY.cap;
  const [event] = completeQuest(h, 'vitamins');
  assert.equal(event.energy, 0);
  assert.equal(h.energy, ENERGY.cap);
  uncompleteQuest(h, 'vitamins');
  assert.equal(h.energy, ENERGY.cap, 'undo does not take energy that was never given');
});

test('streaks add 10% per day up to 50% and break after a missed day', () => {
  const h = hero();
  let day = DAY;
  for (let n = 1; n <= 8; n++) {
    assert.equal(rewardOf(h, QUESTS[0]).xp, Math.round(60 * (1 + Math.min(0.5, (n - 1) * 0.1))));
    completeQuest(h, 'steps');
    assert.equal(streakOf(h, 'steps'), n);
    day = shiftDay(day, 1);
    rollDay(h, day);
  }
  assert.equal(streakOf(h, 'steps'), 8, 'yesterday still counts');
  rollDay(h, shiftDay(day, 1));
  assert.equal(streakOf(h, 'steps'), 0);
  assert.equal(rewardOf(h, QUESTS[0]).xp, 60);
});

test('undoing a quest restores the streak it had before', () => {
  const h = hero();
  completeQuest(h, 'steps');
  rollDay(h, shiftDay(DAY, 1));
  completeQuest(h, 'steps');
  assert.equal(h.streaks.steps.n, 2);
  uncompleteQuest(h, 'steps');
  assert.deepEqual(h.streaks.steps, { n: 1, last: DAY });
});

test("Champion's Cache: needs every quest, pays once, and is taken back if a quest is undone", () => {
  const h = hero();
  assert.deepEqual(claimCache(h), []);
  let events = [];
  for (const quest of QUESTS) events = completeQuest(h, quest.id);
  assert.ok(types(events).includes('cacheReady'));
  assert.ok(cacheReady(h));
  const xpBefore = h.totalXp;
  assert.equal(claimCache(h)[0].type, 'cacheClaimed');
  assert.equal(h.totalXp, xpBefore + CACHE.xp);
  assert.deepEqual(claimCache(h), [], 'cannot claim twice');

  uncompleteQuest(h, 'nojunk');
  assert.equal(h.chest, null);
  assert.equal(h.totalXp, xpBefore - 60);
});

test('changing goals completes quests already past the new goal and ignores bad values', () => {
  const h = hero();
  setQuestAmount(h, 'steps', 6000);
  const events = setGoals(h, { steps: 5000, exercise: 2, meditate: NaN, water: undefined });
  assert.deepEqual(types(events), ['goalSet', 'questCompleted']);
  assert.equal(h.goals.steps, 5000);
  assert.equal(h.goals.exercise, 30, 'below the minimum is ignored');
  setGoals(h, { steps: 20000 });
  assert.ok(h.progress.steps.done, 'raising a goal never takes a reward back');
});

test('a new day records history, clears progress and never moves backwards', () => {
  const h = hero();
  completeQuest(h, 'vitamins');
  assert.equal(rollDay(h, DAY), false);
  assert.equal(rollDay(h, shiftDay(DAY, -1)), false, 'clock moved back: keep today');
  assert.equal(doneCount(h), 1);
  assert.equal(rollDay(h, shiftDay(DAY, 1)), true);
  assert.equal(h.history[DAY], 1);
  assert.deepEqual(h.progress, {});
  for (let n = 2; n < HISTORY_DAYS + 20; n++) rollDay(h, shiftDay(DAY, n));
  assert.equal(Object.keys(h.history).length, HISTORY_DAYS);
});

test('vendor: buying needs gold and level, equips the item, and it leaves the stock', () => {
  const h = hero();
  assert.deepEqual(buyItem(h, 'oakclub'), [], 'too expensive');
  h.copper = 100000;
  assert.deepEqual(buyItem(h, 'ironsword'), [], 'level too low');
  assert.deepEqual(buyItem(h, 'd1'), [], 'drops are not for sale');
  assert.equal(buyItem(h, 'oakclub')[0].type, 'itemBought');
  assert.equal(h.copper, 100000 - ITEMS.oakclub.price);
  assert.equal(h.equip.weapon, 'oakclub');
  assert.deepEqual(bagItems(h), ['w0w']);
  assert.ok(!shopStock(h).includes('oakclub'));
  assert.deepEqual(buyItem(h, 'oakclub'), [], 'already owned');
});

test('bags: equip, unequip and sell', () => {
  const h = hero();
  h.copper = 100000;
  buyItem(h, 'oakclub');
  assert.deepEqual(sellItem(h, 'oakclub'), [], 'equipped items cannot be sold');
  assert.equal(equipItem(h, 'w0w')[0].type, 'itemEquipped');
  assert.deepEqual(equipItem(h, 'w0w'), []);
  assert.deepEqual(equipItem(h, 'charm'), [], 'not owned');
  const copper = h.copper;
  assert.equal(sellItem(h, 'oakclub')[0].copper, sellValue(ITEMS.oakclub));
  assert.equal(h.copper, copper + Math.floor(ITEMS.oakclub.price / 4));
  assert.equal(unequipSlot(h, 'weapon')[0].itemId, 'w0w');
  assert.deepEqual(unequipSlot(h, 'weapon'), []);
  assert.equal(heroStats(h).str, 5);
});

test('a save holding an item this version does not know still works', () => {
  const h = hero();
  h.owned.push('retired-item');
  h.equip.trinket = 'retired-item';
  assert.equal(heroStats(h).str, 6);
  assert.deepEqual(bagItems(h), []);
  assert.deepEqual(sellItem(h, 'retired-item'), []);
});

test('win chance follows power and stays between 5% and 95%', () => {
  const h = hero();
  assert.equal(winChance(h, ZONES[0]), COMBAT.maxChance);
  assert.equal(winChance(h, ZONES[7]), COMBAT.minChance);
  assert.equal(winChance(h, ZONES[1]), 0.75 * heroPower(h) / 40);
});

test('venture: a win pays XP and copper, can drop the zone item once, and costs energy', () => {
  const h = hero();
  const events = venture(h, 'z1', () => 0);
  assert.deepEqual(events[0], { type: 'ventured', zoneId: 'z1', won: true, xp: 30, copper: 800, drop: 'd1' });
  assert.equal(h.energy, ENERGY.start - 1);
  assert.equal(h.totalXp, 30);
  assert.equal(h.copper, START_COPPER + 800);
  assert.equal(h.wins, 1);
  assert.ok(h.owned.includes('d1'));
  assert.equal(venture(h, 'z1', () => 0)[0].drop, null, 'the drop comes once');
});

test('venture: a loss pays a quarter of the XP and nothing else', () => {
  const h = hero();
  const events = venture(h, 'z1', () => 0.999);
  assert.deepEqual(events[0], { type: 'ventured', zoneId: 'z1', won: false, xp: 8, copper: 0, drop: null });
  assert.equal(h.copper, START_COPPER);
  assert.equal(h.wins, 0);
});

test('venture: refused without energy, below the zone level, or for an unknown zone', () => {
  const h = hero();
  assert.deepEqual(venture(h, 'z2', () => 0), []);
  assert.deepEqual(venture(h, 'nowhere', () => 0), []);
  h.energy = 0;
  assert.deepEqual(venture(h, 'z1', () => 0), []);
  assert.equal(snapshot(h), snapshot({ ...hero(), energy: 0 }));
});

test('levelling up is reported as an event', () => {
  const h = hero();
  h.totalXp = 95;
  assert.deepEqual(types(completeQuest(h, 'vitamins')), ['questCompleted', 'levelUp']);
  assert.equal(heroLevel(h), 2);
});
