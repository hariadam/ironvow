// What the screens share: the hero being played, and what the interface is doing right now.
// `session.hero` is the save (see rules/hero.js → newHero). `session.ui` is never saved.

import { rollDay } from '../rules/day.js';
import { dayKey } from '../rules/days.js';
import { backUpSave, loadSave, loadTab, writeSave } from '../save/storage.js';
import { announce, toast } from './feedback.js';

export const TABS = ['quests', 'hero', 'vendor', 'adventure'];

// What the world map is showing (see ui/map.js). The camera is set the first time the map is drawn.
const closedMap = () => ({ cam: null, sel: null, route: null, walk: null, full: false });

export const session = {
  hero: null,          // null until a hero is created or loaded
  brokenSave: null,    // { code, raw } when this device holds a save that cannot be read
  ui: {
    tab: 'quests',
    createClass: 'warrior',   // class picked on the create screen
    amountOpen: null,         // quest id whose "Set total" box is open
    sellOpen: null,           // item id waiting for a second tap to sell
    confirmDelete: false,
    exportCode: null,         // the save code, when shown for copying
    pendingImport: null,      // a decoded save waiting for "replace my hero?" to be confirmed
    battle: null,             // the fight being played back (see screens/adventure.js)
    map: closedMap(),
  },
};

// app.js registers the function that redraws the screen. Call refresh() after changing something outside
// a tap (a timer, a finished clipboard copy); taps redraw on their own.
let redraw = () => {};
export const onRefresh = fn => { redraw = fn; };
export const refresh = () => redraw();

// Writes the hero to this device.
export function save() {
  if (session.hero && !writeSave(session.hero)) toast('Could not save on this phone. Copy a save code from Hero, Backup.');
}

// Call with the events a rule returned: saves and shows feedback if anything happened.
export function commit(events) {
  if (events.length) { save(); announce(events); }
}

// Moves the hero to today's quests if the date has changed. Returns true if it did.
export function startDay() {
  if (!session.hero || !rollDay(session.hero, dayKey(new Date()))) return false;
  save();
  return true;
}

// Makes `hero` the hero being played, replacing whatever this device held (which is kept as a backup).
export function playAs(hero) {
  backUpSave();
  session.hero = hero;
  session.brokenSave = null;
  session.ui.battle = null;
  session.ui.map = closedMap();
  session.ui.tab = 'quests';
  if (!startDay()) save();
}

// Reads this device's save at startup.
export function loadSession() {
  const result = loadSave();
  if (result.kind === 'ok') session.hero = result.hero;
  if (result.kind === 'broken') session.brokenSave = { code: result.code, raw: result.raw };
  const tab = loadTab();
  if (TABS.includes(tab)) session.ui.tab = tab;
  startDay();
}
