// Game rules. Run all tests with:  node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';

import { CACHE, COMBAT, ENERGY, HISTORY_DAYS, START_COPPER } from '../js/content/balance.js';
import { ITEMS } from '../js/content/items.js';
import { QUESTS } from '../js/content/quests.js';
import { BIOMES, WORLD } from '../js/content/world.js';
import { ZONES } from '../js/content/zones.js';
import { canFight, fight, foeAt, foesInView, winChance } from '../js/rules/adventure.js';
import { rollDay } from '../js/rules/day.js';
import { dayKey, dayNumber, shiftDay } from '../js/rules/days.js';
import { bagItems, buyItem, equipItem, sellItem, sellValue, shopStock, unequipSlot } from '../js/rules/gear.js';
import { heroLevel, heroPower, heroStats, newHero } from '../js/rules/hero.js';
import { levelInfo, xpToNext } from '../js/rules/level.js';
import { addQuestAmount, cacheReady, claimCache, completeQuest, doneCount, rewardOf, setGoals, setQuestAmount, streakOf, uncompleteQuest } from '../js/rules/quests.js';
import { inView, isSeen, routeTo, stepsLeft, walkTo } from '../js/rules/travel.js';
import { biomeAt, dungeons, levelAt, mobAt, walkable, zoneAt } from '../js/rules/world.js';

const DAY = '2026-03-10';
const hero = (cls = 'warrior') => newHero('Tester', cls, DAY);
const snapshot = h => JSON.stringify(h);
const types = events => events.map(e => e.type);
// A hero standing on a tile of the world, without having walked there.
const heroAt = (x, y, cls) => { const h = hero(cls); h.map.x = x; h.map.y = y; return h; };
const dungeonOf = id => dungeons().find(spot => spot.zone.id === id);

test('day keys shift across months, years and clock changes', () => {
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDay('2025-12-31', 1), '2026-01-01');
  assert.equal(shiftDay('2026-03-29', 1), '2026-03-30');
  assert.equal(dayNumber('2026-03-01') - dayNumber('2026-02-28'), 1);
  assert.equal(dayNumber('2027-01-01') - dayNumber('2026-01-01'), 365);
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

// ---- The world

test('the world never changes: a sample of its terrain, levels and dungeons is pinned', () => {
  // If this fails, the land players have already explored no longer matches the world. Do not update the
  // numbers below unless the owner has decided to reshape the world. See content/world.js.
  let digest = 0;
  for (let y = -64; y < 64; y++) for (let x = -64; x < 64; x++) digest = (digest * 31 + BIOMES.indexOf(biomeAt(x, y)) + 1) % 1000000007;
  assert.equal(digest, 687346395, 'terrain around town');
  assert.deepEqual([[0, 0], [100, 0], [0, -500], [-1500, 1500], [3000, 0]].map(([x, y]) => levelAt(x, y)), [1, 5, 9, 42, 60], 'mob levels');
  assert.deepEqual(dungeons().map(({ zone, x, y }) => [zone.id, x, y]),
    [['z1', 38, 15], ['z2', -123, 46], ['z3', 121, -261], ['z4', 229, 409], ['z5', -618, -228], ['z6', 706, -536], ['z7', -534, 1049], ['z8', -513, -1377]], 'dungeons');
});

test('every dungeon stands on land a hero can reach, in its own eighth of the world, further out the harder it is', () => {
  const slices = dungeons().map(({ x, y }) => Math.floor(((Math.atan2(y, x) / (Math.PI * 2) + 1) % 1) * 8));
  assert.equal(new Set(slices).size, ZONES.length);
  dungeons().forEach(({ zone, x, y }, i) => {
    assert.ok(walkable(x, y), `${zone.id} on walkable land`);
    assert.equal(zoneAt(x, y), zone);
    assert.ok(Math.hypot(x, y) >= WORLD.dungeonMin - 1, `${zone.id} away from town`);
    assert.ok(i === 0 || Math.hypot(x, y) > Math.hypot(dungeons()[i - 1].x, dungeons()[i - 1].y), `${zone.id} further out than the one before`);
  });
  assert.ok(walkable(0, 0) && !zoneAt(0, 0));
});

test('wild mobs: the same for everyone on a day, different the next, never next to town, as strong as their land', () => {
  const day = dayNumber(DAY);
  const today = [], tomorrow = [];
  for (let y = -60; y <= 60; y++) for (let x = -60; x <= 60; x++) {
    const found = mobAt(day, x, y);
    assert.deepEqual(found, mobAt(day, x, y));
    if (mobAt(day + 1, x, y)) tomorrow.push(`${x},${y}`);
    if (!found) continue;
    today.push(`${x},${y}`);
    assert.ok(walkable(x, y) && x * x + y * y >= WORLD.safeRadius ** 2, `mob at ${x},${y}`);
    assert.equal(found.mob.biome, biomeAt(x, y).id);
    assert.equal(found.level, levelAt(x, y));
  }
  assert.ok(today.length > 20 && tomorrow.length > 20);
  assert.ok(today.filter(spot => tomorrow.includes(spot)).length < today.length / 4, 'mobs move overnight');
});

// ---- Travel

test('a new hero stands in town and sees a round patch of land around it', () => {
  const h = hero();
  assert.deepEqual(h.map, { x: 0, y: 0, walked: 0, trail: [], slain: { day: DAY, at: [] } });
  assert.ok(isSeen(h, 0, 0) && isSeen(h, 0, WORLD.view) && isSeen(h, -WORLD.view, 0) && isSeen(h, 14, 14));
  assert.ok(!isSeen(h, 0, WORLD.view + 1) && !isSeen(h, 15, 15));
  assert.ok(inView(h, 0, WORLD.view) && !inView(h, 0, WORLD.view + 1));
});

test('steps to walk: a starting allowance plus every step logged, minus the steps walked', () => {
  const h = hero();
  assert.equal(stepsLeft(h), WORLD.startSteps);
  setQuestAmount(h, 'steps', 2500);
  assert.equal(stepsLeft(h), WORLD.startSteps + 2500);
  setQuestAmount(h, 'steps', 500);
  assert.equal(stepsLeft(h), WORLD.startSteps + 500, 'taking logged steps back takes the travel back');
  h.map.walked = 99999;
  assert.equal(stepsLeft(h), 0);
});

test('walking spends steps, moves the hero and uncovers land for good', () => {
  const h = hero();
  const route = routeTo(h, -20, 0);
  assert.equal(route.steps, 20 * WORLD.stepsPerTile);
  assert.deepEqual(route.path[0], [-1, 0]);
  const before = snapshot(h);
  assert.equal(snapshot(h), before, 'planning a route changes nothing');

  const events = walkTo(h, -20, 0);
  assert.deepEqual(events, [{ type: 'walked', path: route.path, steps: 200 }]);
  assert.deepEqual([h.map.x, h.map.y, h.map.walked], [-20, 0, 200]);
  assert.equal(stepsLeft(h), WORLD.startSteps - 200);
  assert.ok(isSeen(h, -40, 0) && !isSeen(h, -41, 0), 'new land ahead');
  assert.ok(isSeen(h, WORLD.view, 0), 'the land behind stays uncovered');
  assert.equal(h.map.trail.length, 1);
});

test('walking is refused into fog, onto water or peaks, without the steps, and to where the hero stands', () => {
  const h = hero();
  assert.equal(walkable(15, 3), false, 'this test needs a tile that cannot be crossed inside the starting view');
  assert.deepEqual(routeTo(h, 0, 40), { why: 'fog' });
  assert.deepEqual(routeTo(h, 15, 3), { why: 'wall' });
  assert.deepEqual(routeTo(h, 0, 0), { path: [], steps: 0 });
  const before = snapshot(h);
  for (const [x, y] of [[0, 40], [15, 3], [0, 0]]) assert.deepEqual(walkTo(h, x, y), []);
  h.map.walked = WORLD.startSteps - 190;
  assert.deepEqual(walkTo(h, -20, 0), [], '200 steps needed, 190 left');
  h.map.walked = 0;
  assert.equal(snapshot(h), before);
});

test('a route never crosses land that cannot be walked or has not been uncovered', () => {
  const h = hero();
  for (const [x, y] of [[-20, 0], [0, 19], [14, 14], [-10, -12], [12, 9]]) {
    const { path } = routeTo(h, x, y);
    assert.ok(path && path.length >= Math.abs(x) + Math.abs(y), `a way to ${x},${y}`);
    let at = [0, 0];
    for (const [px, py] of path) {
      assert.equal(Math.abs(px - at[0]) + Math.abs(py - at[1]), 1, 'one tile at a time');
      assert.ok(walkable(px, py) && isSeen(h, px, py));
      at = [px, py];
    }
    assert.deepEqual(at, [x, y]);
  }
});

test('the fog is rebuilt exactly from a save, however the walks were made', () => {
  const h = hero();
  h.totals.steps = 100000;
  // Walks of every length class (the trail packs three moves to a character), with a walk over known land between.
  for (const [x, y] of [[-1, 0], [-3, 0], [-6, 0], [-20, 0], [-19, 0], [-30, 2], [0, 0], [0, 19], [-4, 30]]) {
    if (routeTo(h, x, y).path) walkTo(h, x, y);
  }
  assert.ok(h.map.trail.length >= 2, 'walking back over known land ends a leg of the trail');
  const loaded = JSON.parse(JSON.stringify(h));
  assert.deepEqual(loaded.map, h.map);
  for (let y = -70; y <= 70; y++) for (let x = -70; x <= 70; x++) assert.equal(isSeen(loaded, x, y), isSeen(h, x, y), `${x},${y}`);
  assert.ok(isSeen(loaded, -50, 2) && isSeen(loaded, -4, 50));
});

test('walking over land already uncovered costs steps but adds nothing to the save', () => {
  const h = hero();
  walkTo(h, -20, 0);
  const trail = snapshot(h.map.trail);
  assert.equal(walkTo(h, -10, 0).length, 1);
  assert.equal(walkTo(h, 0, 0).length, 1);
  assert.equal(snapshot(h.map.trail), trail);
  assert.equal(h.map.walked, 400);
});

// ---- Fighting

test('a foe is known on a dungeon tile always, and on a mob tile only while it is in view', () => {
  const h = hero();
  const seen = foesInView(h);
  assert.ok(seen.length > 0, 'this test needs a mob near town on the test day');
  for (const { x, y, foe } of seen) {
    assert.ok(inView(h, x, y) && foe.mob && !foe.zone && foe.drop === null);
    assert.deepEqual(foeAt(h, x, y), foe);
    assert.equal(foe.needs, Math.max(1, foe.level - WORLD.mobReach));
  }
  const far = heroAt(300, 300);
  assert.equal(foeAt(far, seen[0].x, seen[0].y), null, 'out of view');
  const { zone, x, y } = dungeonOf('z3');
  assert.deepEqual(foeAt(h, x, y), { zone, mob: null, level: 6, needs: 6, power: 75, xp: 100, copper: [3000, 6000], drop: 'd3' });
});

test('a wild mob is as strong and pays as much as a zone of its level', () => {
  // Looks along the ring where mobs are about this level until one of exactly this level turns up.
  const numbers = level => {
    const ring = (level - 1) * WORLD.tilesPerLevel;
    for (let x = Math.max(WORLD.safeRadius, ring - 150); x < ring + 150; x++) for (let y = -40; y <= 40; y++) {
      const found = mobAt(dayNumber(DAY), x, y);
      if (found && found.level === level) { const foe = foeAt(heroAt(x, y), x, y); return [foe.power, foe.xp, foe.copper]; }
    }
    return null;
  };
  assert.deepEqual(numbers(1), [15, 30, [800, 2000]]);
  assert.deepEqual(numbers(3), [40, 60, [1500, 3500]]);
  assert.deepEqual(numbers(8), [98, 130, [4000, 8000]], 'half-way between the level 6 and level 10 zones');
  assert.deepEqual(numbers(30), [480, 750, [35000, 60000]]);
  assert.deepEqual(numbers(40), [680, 1167, [60000, 93333]], 'past the last zone the numbers keep climbing');
});

test('win chance follows power and stays between 5% and 95%', () => {
  const h = hero();
  const foe = id => foeAt(h, dungeonOf(id).x, dungeonOf(id).y);
  assert.equal(winChance(h, foe('z1')), COMBAT.maxChance);
  assert.equal(winChance(h, foe('z8')), COMBAT.minChance);
  assert.equal(winChance(h, foe('z2')), 0.75 * heroPower(h) / 40);
});

test('fighting a wild mob: a win pays XP and copper, costs energy, and the mob is gone until tomorrow', () => {
  const start = hero();
  const { x, y, foe } = foesInView(start)[0];
  assert.deepEqual(fight(start, () => 0), [], 'nothing to fight in town');

  const h = heroAt(x, y);
  const events = fight(h, () => 0);
  assert.deepEqual(events[0], { type: 'fought', zoneId: null, mobId: foe.mob.id, won: true, xp: 30, copper: 800, drop: null });
  assert.equal(h.energy, ENERGY.start - 1);
  assert.equal(h.totalXp, 30);
  assert.equal(h.copper, START_COPPER + 800);
  assert.equal(h.wins, 1);
  assert.deepEqual(h.map.slain, { day: DAY, at: [`${x},${y}`] });
  assert.equal(foeAt(h, x, y), null);
  assert.deepEqual(fight(h, () => 0), [], 'the mob is gone');

  rollDay(h, shiftDay(DAY, 1));
  assert.deepEqual(foesInView(h), foesInView(Object.assign(heroAt(x, y), { day: shiftDay(DAY, 1) })), 'a new day forgets who was beaten');
});

test('fighting a wild mob: a loss pays a quarter of the XP, and the mob stays', () => {
  const { x, y, foe } = foesInView(hero())[0];
  const h = heroAt(x, y);
  const events = fight(h, () => 0.999);
  assert.deepEqual(events[0], { type: 'fought', zoneId: null, mobId: foe.mob.id, won: false, xp: 8, copper: 0, drop: null });
  assert.equal(h.copper, START_COPPER);
  assert.equal(h.wins, 0);
  assert.equal(h.energy, ENERGY.start - 1);
  assert.deepEqual(foeAt(h, x, y), foe);
});

test('fighting is refused without energy, or against a mob too far above the hero', () => {
  const { x, y } = foesInView(hero())[0];
  const tired = heroAt(x, y);
  tired.energy = 0;
  const before = snapshot(tired);
  assert.deepEqual(fight(tired, () => 0), []);
  assert.equal(snapshot(tired), before);

  const lost = heroAt(2000, 0);
  const strong = foesInView(lost)[0];
  assert.ok(strong.foe.level > 30 && !canFight(lost, strong.foe));
  Object.assign(lost.map, { x: strong.x, y: strong.y });
  assert.deepEqual(fight(lost, () => 0), []);
  lost.totalXp = 1e9;
  assert.ok(canFight(lost, strong.foe));
  assert.equal(fight(lost, () => 0)[0].won, true);
});

test('a dungeon: the boss can be fought again and again, and drops its item once', () => {
  const { x, y } = dungeonOf('z1');
  const h = heroAt(x, y);
  const events = fight(h, () => 0);
  assert.deepEqual(events[0], { type: 'fought', zoneId: 'z1', mobId: null, won: true, xp: 30, copper: 800, drop: 'd1' });
  assert.equal(h.energy, ENERGY.start - 1);
  assert.ok(h.owned.includes('d1'));
  assert.deepEqual(h.map.slain.at, [], 'a boss is never used up');
  assert.equal(fight(h, () => 0)[0].drop, null, 'the drop comes once');
  assert.equal(fight(h, () => 0.999)[0].won, false);

  const tooSoon = heroAt(dungeonOf('z2').x, dungeonOf('z2').y);
  assert.deepEqual(fight(tooSoon, () => 0), [], 'below the zone level');
});

test('levelling up is reported as an event', () => {
  const h = hero();
  h.totalXp = 95;
  assert.deepEqual(types(completeQuest(h, 'vitamins')), ['questCompleted', 'levelUp']);
  assert.equal(heroLevel(h), 2);
});
