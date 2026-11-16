// Where the save lives on this device: localStorage. The only file that touches it.

import { SAVE_VERSION, upgradeSave } from './migrate.js';

const SAVE_KEY = 'ironvow-save-v1';     // fixed forever; the save's version lives inside the save (`v`)
const BACKUP_KEY = 'ironvow-save-prev'; // the previous save, kept whenever one is about to be replaced or deleted
const TAB_KEY = 'ironvow-tab';

// localStorage throws in some private modes and when it is full, so every call is guarded.
function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

// { kind: 'none' }                    no hero on this device
// { kind: 'ok', hero }                a hero, upgraded to the current save shape
// { kind: 'broken', code, raw }       something is stored but cannot be used; `raw` is the untouched text.
//                                     code is 'unreadable' or a SaveError code. Never overwrite it silently.
export function loadSave() {
  const raw = read(SAVE_KEY);
  if (!raw) return { kind: 'none' };
  try {
    return { kind: 'ok', hero: upgradeSave(JSON.parse(raw)) };
  } catch (err) {
    return { kind: 'broken', code: err.code || 'unreadable', raw };
  }
}

// Returns false if the device refused the write.
export function writeSave(hero) {
  hero.v = SAVE_VERSION;
  hero.updatedAt = Date.now();
  return write(SAVE_KEY, JSON.stringify(hero));
}

// Copies the stored save aside. Call before replacing or deleting it.
export function backUpSave() {
  const raw = read(SAVE_KEY);
  if (raw) write(BACKUP_KEY, raw);
}

export function deleteSave() {
  backUpSave();
  try { localStorage.removeItem(SAVE_KEY); } catch { /* nothing stored, nothing to remove */ }
}

export const loadTab = () => read(TAB_KEY);
export const saveTab = tab => { write(TAB_KEY, tab); };
