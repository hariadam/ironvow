// Turns what the rules report into things the player sees and hears: toasts, the level-up banner, sounds.
// To react to a new kind of event, add an entry to REACTIONS. Events without an entry are silent on purpose
// (for example 'amountSet': the progress bar already shows it).

import { STAT_NAMES } from '../content/classes.js';
import { ITEMS } from '../content/items.js';
import { QUEST_BY_ID } from '../content/quests.js';
import { coinText } from './format.js';
import { playSound } from './sound.js';

const TOAST_MS = 2700;
const LEVEL_UP_MS = 2900;

// A short message at the top of the screen. tone 'gold' is for good news.
export function toast(text, tone) {
  const el = document.createElement('div');
  el.className = tone === 'gold' ? 'toast gold' : 'toast';
  el.textContent = text;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), TOAST_MS);
}

function showLevelUp(level) {
  const box = document.getElementById('levelup');
  box.innerHTML = `<div class="levelup-card"><b>LEVEL ${level}</b><span>You feel stronger.</span></div>`;
  setTimeout(() => { box.innerHTML = ''; }, LEVEL_UP_MS);
}

const plus = (amount, label) => (amount ? ` · +${amount} ${label}` : '');

const REACTIONS = {
  questCompleted(e) {
    toast(`Quest complete: ${QUEST_BY_ID[e.questId].name}`, 'gold');
    toast(`+${e.xp} XP · ${coinText(e.copper)}${plus(e.energy, 'energy')} · +1 ${STAT_NAMES[e.stat]}`);
    playSound('quest');
  },
  questUndone(e) { toast(`${QUEST_BY_ID[e.questId].name} marked not done`); },
  cacheReady() { toast("All vows kept! Claim the Champion's Cache.", 'gold'); },
  cacheClaimed(e) {
    toast(`Champion's Cache: +${e.xp} XP · ${coinText(e.copper)}${plus(e.energy, 'energy')}`, 'gold');
    playSound('coin');
  },
  levelUp(e) { showLevelUp(e.level); playSound('level'); },
  itemBought(e) { toast(`Bought and equipped ${ITEMS[e.itemId].name}`, 'gold'); playSound('coin'); },
  itemSold(e) { toast(`Sold ${ITEMS[e.itemId].name} for ${coinText(e.copper)}`); playSound('coin'); },
  ventured(e) { playSound(e.won ? 'win' : 'lose'); },
};

export function announce(events) {
  for (const event of events) REACTIONS[event.type]?.(event);
}
