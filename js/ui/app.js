// Draws the screen and routes taps.
//
// Drawing: render() rebuilds the whole page from `session` as one HTML string. Screens never touch the DOM
// to show state; they change `session` and the page is redrawn.
//
// Taps: any element with data-a="name" runs the action of that name, with data-v as its value. Each screen
// exports its own `actions`; they are merged here. After an action the page is redrawn. An action may return
// a function to run after the redraw (to focus an input or scroll).
// Inputs: data-enter="name" runs that action when Enter is pressed. data-keep (with an id) keeps what the
// player typed across redraws.
//
// To add a tab: write js/ui/screens/<name>.js exporting render() and actions, add it to SCREENS below and
// to TABS in session.js, add its label in screens/shell.js and its 8×8 icon in art/icons.js.

import { rarityCss } from './parts.js';
import * as adventure from './screens/adventure.js';
import * as backup from './screens/backup.js';
import * as create from './screens/create.js';
import * as hero from './screens/hero.js';
import * as quests from './screens/quests.js';
import * as recover from './screens/recover.js';
import * as shell from './screens/shell.js';
import * as vendor from './screens/vendor.js';
import { loadSession, onRefresh, session, startDay } from './session.js';
import { initSound } from './sound.js';

const SCREENS = { quests, hero, vendor, adventure };

// Every action by name. Two screens defining the same name is a mistake, caught here at startup.
const ACTIONS = {};
for (const part of [shell, backup, create, recover, quests, hero, vendor, adventure]) {
  for (const [name, handler] of Object.entries(part.actions)) {
    if (ACTIONS[name]) throw new Error(`Two screens define the action "${name}"`);
    ACTIONS[name] = handler;
  }
}

const root = document.getElementById('app');

function render() {
  const kept = new Map();
  root.querySelectorAll('[data-keep]').forEach(el => kept.set(el.id, el.value));
  root.innerHTML = session.brokenSave ? recover.render()
    : !session.hero ? create.render()
      : shell.render(SCREENS[session.ui.tab].render());
  kept.forEach((value, id) => { const el = document.getElementById(id); if (el) el.value = value; });
}

function run(name, value, el) {
  const handler = ACTIONS[name];
  if (!handler) throw new Error(`No action named "${name}"`);
  const afterRedraw = handler(value, el);
  render();
  if (afterRedraw) afterRedraw();
}

export function start() {
  // Rarity colours and the sparkle animation come from the sprite generator, so they are added here, not in style.css.
  const style = document.createElement('style');
  style.textContent = globalThis.PixelItems.CSS + rarityCss();
  document.head.appendChild(style);

  document.addEventListener('click', event => {
    const el = event.target.closest('[data-a]');
    if (el && !el.disabled) run(el.dataset.a, el.dataset.v, el);
  });
  document.addEventListener('keydown', event => {
    const el = event.target;
    if (event.key === 'Enter' && el.dataset && el.dataset.enter) { event.preventDefault(); run(el.dataset.enter, el.dataset.v, el); }
  });

  // A new day can start while the game is open or in the background.
  const checkDay = () => { if (startDay()) render(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDay(); });
  setInterval(checkDay, 60000);

  initSound();
  onRefresh(render);
  loadSession();
  render();
}
