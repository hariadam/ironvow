// Save codes: copying one out and restoring a hero from one. Used on the Hero tab, the create screen
// and the save-recovery screen.

import { CLASSES } from '../../content/classes.js';
import { heroLevel } from '../../rules/hero.js';
import { decodeSave, encodeSave } from '../../save/codes.js';
import { toast } from '../feedback.js';
import { esc } from '../format.js';
import { button } from '../parts.js';
import { playAs, session } from '../session.js';

// The paste box, or the "replace your hero?" question once a code has been read.
export function restorePanel() {
  const { hero, ui } = session;
  if (ui.pendingImport) {
    const found = ui.pendingImport;
    return `<p>Replace ${esc(hero.name)} with ${esc(found.name)}, level ${heroLevel(found)} ${CLASSES[found.cls].name}? Your current hero is kept as a one-time backup on this phone.</p>
      <div class="row">${button('danger', `Restore ${esc(found.name)}`, 'restoreConfirm')}${button('plain', 'Cancel', 'restoreCancel')}</div>`;
  }
  return `<label class="label" for="importBox">Restore from a save code</label>
    <textarea id="importBox" class="code" rows="3" data-keep placeholder="Paste a code starting with IRONVOW1:" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    ${button('plain', 'Restore hero', 'restore')}`;
}

function welcomeBack() {
  toast(`Welcome back, ${session.hero.name}!`, 'gold');
}

export const actions = {
  restore() {
    let found;
    try { found = decodeSave(document.getElementById('importBox').value); }
    catch (err) { toast(err.message); return; }
    document.getElementById('importBox').value = '';
    // With a hero already here, ask before replacing it.
    if (session.hero) { session.ui.pendingImport = found; return; }
    playAs(found);
    welcomeBack();
  },
  restoreConfirm() {
    playAs(session.ui.pendingImport);
    session.ui.pendingImport = null;
    welcomeBack();
  },
  restoreCancel() { session.ui.pendingImport = null; },

  copyCode() {
    const code = encodeSave(session.hero);
    session.ui.exportCode = code;   // also shown in a box, in case the phone refuses clipboard access
    const copied = navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject(new Error('no clipboard'));
    copied.then(
      () => toast('Save code copied', 'gold'),
      () => { toast('Select the code in the box and copy it'); const box = document.getElementById('exportBox'); if (box) { box.focus(); box.select(); } },
    );
  },
};
