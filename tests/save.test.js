// Saves must survive every update. These tests feed the game saves and codes written by older versions.
import test from 'node:test';
import assert from 'node:assert/strict';

import { decodeSave, encodeSave } from '../js/save/codes.js';
import { SAVE_VERSION, SaveError, upgradeSave } from '../js/save/migrate.js';
import { heroPower, newHero } from '../js/rules/hero.js';
import { rollDay } from '../js/rules/day.js';

// A hero exactly as version 1 of the game (the first release) stored it, mid-day, with gear, streaks and history.
const V1_SAVE = {
  v: 1, name: 'Ádám', cls: 'ranger', created: '2026-09-01', totalXp: 4321, copper: 123456, energy: 7,
  train: { str: 12, agi: 40, int: 9, spi: 31, sta: 55 },
  owned: ['w0r', 'huntbow', 'leathercap', 'd1', 'charm'],
  equip: { weapon: 'huntbow', helm: 'd1', chest: null, trinket: 'charm' },
  goals: { steps: 12000, exercise: 45, meditate: 10, water: 2500 },
  day: '2026-11-15',
  progress: {
    steps: { val: 12500, done: true, rw: { xp: 90, c: 5300, en: 1, prev: { n: 7, last: '2026-11-14' } } },
    water: { val: 750, done: false, rw: null },
    vitamins: { val: 0, done: true, rw: { xp: 30, c: 2000, en: 1, prev: { n: 0, last: null } } },
  },
  chest: null,
  streaks: { steps: { n: 8, last: '2026-11-15' }, vitamins: { n: 1, last: '2026-11-15' }, exercise: { n: 3, last: '2026-11-13' } },
  history: { '2026-11-13': 6, '2026-11-14': 4 },
  totals: { steps: 800000, exercise: 2100, meditate: 640, water: 150000 },
  wins: 37, updatedAt: 1794700000000,
};

// How version 1 built a save code. Kept here so today's decoder is always checked against it.
const v1Code = save => 'IRONVOW1:' + btoa(unescape(encodeURIComponent(JSON.stringify(save))));

test('a version 1 save loads with nothing lost or changed', () => {
  const save = upgradeSave(V1_SAVE);
  assert.deepEqual(save, V1_SAVE);
  assert.notEqual(save, V1_SAVE, 'works on a copy');
  assert.ok(heroPower(save) > 0);
  assert.ok(rollDay(save, '2026-11-16'));
  assert.equal(save.history['2026-11-15'], 2);
});

test('a version 1 save code still imports, accents and line breaks included', () => {
  const code = v1Code(V1_SAVE);
  assert.deepEqual(decodeSave(code), V1_SAVE);
  assert.deepEqual(decodeSave(`  ${code.slice(0, 40)}\n${code.slice(40)} \n`), V1_SAVE);
});

test('codes written today read back the same, and match the version 1 format', () => {
  const hero = newHero('Zoë ⚔', 'priest', '2026-11-16');
  assert.equal(encodeSave(hero), v1Code(hero));
  assert.deepEqual(decodeSave(encodeSave(hero)), { ...hero, v: 1 });
});

test('bad codes are refused with a message the player can act on', () => {
  assert.throws(() => decodeSave(''), /not an Ironvow save code/);
  assert.throws(() => decodeSave('hello'), /not an Ironvow save code/);
  assert.throws(() => decodeSave('IRONVOW1:@@@'), /incomplete/);
  assert.throws(() => decodeSave(v1Code(V1_SAVE).slice(0, -9)), /incomplete/);
  assert.throws(() => decodeSave(v1Code({ hello: 'world' })), /no hero/);
  assert.throws(() => decodeSave(v1Code({ ...V1_SAVE, v: SAVE_VERSION + 1 })), /newer version/);
});

test('things that are not saves are refused', () => {
  for (const bad of [null, 42, 'text', [], {}, { name: 'X', cls: 'bard' }, { name: '  ', cls: 'mage' }]) {
    assert.throws(() => upgradeSave(bad), err => err instanceof SaveError && err.code === 'no-hero');
  }
});

test('missing or damaged fields are filled in without touching the rest', () => {
  const save = upgradeSave({ name: 'Old', cls: 'mage', totalXp: 500, copper: null, train: { int: 9 }, goals: { steps: 7000 }, owned: 'oops' });
  assert.equal(save.v, 1);
  assert.equal(save.totalXp, 500);
  assert.equal(save.copper, 10000);
  assert.deepEqual(save.train, { str: 0, agi: 0, int: 9, spi: 0, sta: 0 });
  assert.deepEqual(save.goals, { steps: 7000, exercise: 30, meditate: 10, water: 2000 });
  assert.deepEqual(save.owned, ['w0m']);
  assert.equal(save.chest, null);
  assert.deepEqual(save.progress, {});
});

test('upgrades run in order, one version at a time', () => {
  const migrations = {
    1: save => { save.gold = save.copper / 10000; },
    2: save => { save.title = `${save.name} the level-${save.gold} rich`; },
  };
  const save = upgradeSave({ name: 'Ann', cls: 'mage', copper: 30000 }, migrations, 3);
  assert.equal(save.v, 3);
  assert.equal(save.title, 'Ann the level-3 rich');
  assert.deepEqual(upgradeSave({ ...save }, migrations, 3), save, 'an up-to-date save is left alone');
});

test('a save from a newer game, or a missing upgrade step, stops instead of guessing', () => {
  assert.throws(() => upgradeSave({ ...V1_SAVE, v: SAVE_VERSION + 1 }), err => err.code === 'newer');
  assert.throws(() => upgradeSave({ ...V1_SAVE }, {}, 2), err => err.code === 'no-migration');
});
