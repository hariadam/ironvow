// ---------- State & saving ----------
// The whole hero lives in one plain JSON object, `state`, saved to this device's localStorage.
// RULE: never break an existing save. When the shape of `state` changes, bump SAVE_VERSION
// and add a step to migrate() that upgrades older saves. See CLAUDE.md → "Save data".
const SAVE_KEY = 'ironvow-save-v1';     // storage key stays fixed forever; the version lives inside the save
const BACKUP_KEY = 'ironvow-save-prev'; // copy of the save before the last restore or delete
const SAVE_VERSION = 1;
const CODE_PREFIX = 'IRONVOW1:';

let state = null;
let ui = { tab: 'quests', setOpen: null, log: null, logZone: null, busy: false, confirmReset: false, createCls: 'warrior', sellOpen: null, exportCode: null, confirmImport: null };
try { ui.tab = localStorage.getItem('ironvow-tab') || 'quests'; } catch (e) {}

// ---------- Hero & day state ----------
function newHero(name, cls) {
  const start = CLASSES[cls].start;
  return {
    v: SAVE_VERSION, name, cls, created: dayKey(), totalXp: 0, copper: 10000, energy: 3,
    train: { str: 0, agi: 0, int: 0, spi: 0, sta: 0 },
    owned: [start], equip: { weapon: start, helm: null, chest: null, trinket: null },
    goals: { steps: 10000, exercise: 30, meditate: 10, water: 2000 },
    day: dayKey(), progress: {}, chest: null, streaks: {}, history: {},
    totals: { steps: 0, exercise: 0, meditate: 0, water: 0 }, wins: 0, updatedAt: Date.now(),
  };
}
function prog(id) { return state.progress[id] || (state.progress[id] = { val: 0, done: false, rw: null }); }
const doneCount = () => QUESTS.filter(q => state.progress[q.id] && state.progress[q.id].done).length;
function ensureDay() {
  if (!state) return false;
  const today = dayKey();
  if (state.day === today) return false;
  state.history[state.day] = doneCount();
  const keys = Object.keys(state.history).sort();
  while (keys.length > 60) delete state.history[keys.shift()];
  state.day = today; state.progress = {}; state.chest = null;
  return true;
}
function streakOf(id) {
  const s = state.streaks[id];
  if (!s) return 0;
  return (s.last === dayKey() || s.last === shiftDay(-1)) ? s.n : 0;
}

function migrate(s) {
  if (!s || typeof s !== 'object' || !s.name || !CLASSES[s.cls]) return null;
  s.v = s.v || 1;
  // Example for the future:
  // if (s.v < 2) { s.talents = {}; s.v = 2; }
  // Fill any fields a newer version expects, so old saves never crash the game.
  const fresh = newHero(s.name, s.cls);
  for (const k of Object.keys(fresh)) if (s[k] === undefined) s[k] = fresh[k];
  return s;
}

function loadLocal() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? migrate(JSON.parse(raw)) : null; } catch (e) { return null; }
}

function persist() {
  if (!state) return;
  state.updatedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Could not save on this device. Copy a backup code from Hero → Backup.'); }
}

function backupCurrent() {
  try { const cur = localStorage.getItem(SAVE_KEY); if (cur) localStorage.setItem(BACKUP_KEY, cur); } catch (e) {}
}

function makeExportCode() {
  return CODE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

// Returns a migrated save object, or throws an Error with a message the player can act on.
function readImportCode(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (!code.startsWith(CODE_PREFIX)) throw new Error('That is not an Ironvow save code. It should start with IRONVOW1:');
  let s;
  try { s = JSON.parse(decodeURIComponent(escape(atob(code.slice(CODE_PREFIX.length))))); }
  catch (e) { throw new Error('The save code is incomplete. Copy the whole code and try again.'); }
  const m = migrate(s);
  if (!m) throw new Error('The save code has no hero in it.');
  if ((m.v || 1) > SAVE_VERSION) throw new Error('This save comes from a newer version of Ironvow. Reload the page to update, then try again.');
  return m;
}
