// Save versions and upgrades. No DOM and no storage in here, so it can be tested and reused anywhere.
//
// RULE: never break an existing save. When the shape of the save changes (a field is renamed, moved or
// changes meaning), do all three:
//   1. raise SAVE_VERSION by one,
//   2. add MIGRATIONS[old version], a function that rewrites an old save into the new shape in place,
//   3. add a test in tests/save.test.js that feeds it an old save.
// A brand new field with a simple default needs none of that: fillDefaults copies it from newHero().

import { CLASSES } from '../content/classes.js';
import { newHero } from '../rules/hero.js';

export const SAVE_VERSION = 1;

// MIGRATIONS[n] upgrades a save from version n to version n + 1.
// Example, when version 2 arrives:  1: save => { save.talents = save.perks; delete save.perks; },
const MIGRATIONS = {};

// code: 'no-hero' (not a save at all), 'newer' (written by a later version of the game), 'no-migration' (a bug: a step is missing).
export class SaveError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Gives a save every field the current version expects, without touching what is already there.
function fillDefaults(save) {
  const fresh = newHero(save.name, save.cls, save.day || save.created || '2000-01-01');
  for (const [key, value] of Object.entries(fresh)) {
    if (save[key] === undefined || save[key] === null && value !== null) save[key] = value;
    else if (typeof value === 'number' && !Number.isFinite(save[key])) save[key] = value;
    else if (Array.isArray(value) && !Array.isArray(save[key])) save[key] = value;
    else if (isObject(value)) {
      if (!isObject(save[key])) save[key] = value;
      else for (const [inner, innerValue] of Object.entries(value)) if (save[key][inner] === undefined) save[key][inner] = innerValue;
    }
  }
  return save;
}

// Takes parsed save data of any version and returns a save in the current shape. Works on a copy.
// Throws SaveError. `migrations` and `version` are parameters only so tests can exercise the upgrade path.
export function upgradeSave(data, migrations = MIGRATIONS, version = SAVE_VERSION) {
  if (!isObject(data) || typeof data.name !== 'string' || !data.name.trim() || !CLASSES[data.cls]) {
    throw new SaveError('no-hero', 'There is no hero in this save.');
  }
  const save = JSON.parse(JSON.stringify(data));
  if (!Number.isInteger(save.v) || save.v < 1) save.v = 1;
  if (save.v > version) throw new SaveError('newer', 'This save comes from a newer version of Ironvow.');
  while (save.v < version) {
    const step = migrations[save.v];
    if (!step) throw new SaveError('no-migration', `No upgrade from save version ${save.v}.`);
    step(save);
    save.v += 1;
  }
  return fillDefaults(save);
}
