// Shown instead of the game when this phone holds a save that cannot be read. Nothing is deleted here:
// the stored text stays put until the player chooses what to do, and is kept as a backup even then.

import { toast } from '../feedback.js';
import { esc } from '../format.js';
import { button } from '../parts.js';
import { session } from '../session.js';
import { restorePanel } from './backup.js';

const REASONS = {
  newer: 'It was written by a newer version of Ironvow than the one on screen. Connect to the internet and reload the page to update, and your hero will be back.',
  'no-migration': 'This version of the game is missing an upgrade step for it. That is a bug in the game, not in your save.',
};
const UNREADABLE = 'The saved data is damaged or incomplete.';

export function render() {
  const { code, raw } = session.brokenSave;
  return `<main class="screen">
    <div class="title"><h1>Save trouble</h1>
      <p>Your hero's save on this phone could not be opened. <b>It has not been deleted.</b> ${REASONS[code] || UNREADABLE}</p></div>
    <section class="panel stack"><h2>Keep a copy</h2>
      <p>Copy the saved data and keep it in Notes. Claude can usually repair a hero from it.</p>
      <textarea id="rawSave" class="code" rows="4" readonly>${esc(raw)}</textarea>
      ${button('primary', 'Copy saved data', 'copyRawSave')}
    </section>
    <section class="panel stack"><h2>Have a save code?</h2>${restorePanel()}</section>
    <section class="panel stack"><h2>Start over</h2>
      <p>Creates a new hero. The unreadable save is kept as a backup on this phone.</p>
      ${button('danger', 'Start a new hero', 'abandonBrokenSave')}
    </section>
  </main>`;
}

export const actions = {
  copyRawSave() {
    const select = () => { const box = document.getElementById('rawSave'); box.focus(); box.select(); };
    const copied = navigator.clipboard ? navigator.clipboard.writeText(session.brokenSave.raw) : Promise.reject(new Error('no clipboard'));
    copied.then(() => toast('Saved data copied', 'gold'), () => { toast('Select the text in the box and copy it'); select(); });
  },
  // Leaves the stored text where it is; creating the new hero backs it up before writing (session.js → playAs).
  abandonBrokenSave() { session.brokenSave = null; },
};
