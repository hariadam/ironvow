// Hero tab: stats, equipment, bags, history, quest goals, backup and starting over.

import { CLASSES, STAT_NAMES, STATS } from '../../content/classes.js';
import { ITEMS, SLOTS } from '../../content/items.js';
import { AMOUNT_QUESTS, QUESTS } from '../../content/quests.js';
import { shiftDay } from '../../rules/days.js';
import { bagItems, equipItem, sellItem, sellValue, unequipSlot } from '../../rules/gear.js';
import { heroLevel, heroPower, heroStats } from '../../rules/hero.js';
import { doneCount, goalOf, setGoals } from '../../rules/quests.js';
import { deleteSave } from '../../save/storage.js';
import { toast } from '../feedback.js';
import { amountText, coinText, esc, longDay, num } from '../format.js';
import { button, itemRow, lockedButton } from '../parts.js';
import { commit, session } from '../session.js';
import { restorePanel } from './backup.js';

const JOURNEY_DAYS = 14;

function statsPanel() {
  const { hero } = session;
  const stats = heroStats(hero);
  return `<section class="panel stack">
    <div class="stats">${STATS.map(stat => `<div class="stat"><span>${STAT_NAMES[stat]}</span>${hero.train[stat] ? `<small>+${hero.train[stat]} trained</small>` : ''}<b>${stats[stat]}</b></div>`).join('')}</div>
    <div class="power"><span>Battle power</span><b>${heroPower(hero)}</b></div>
  </section>`;
}

function equipmentPanel() {
  const { hero } = session;
  const rows = Object.entries(SLOTS).map(([slot, label]) => (ITEMS[hero.equip[slot]]
    ? itemRow(hero.equip[slot], label, button('plain', 'Remove', 'unequip', slot))
    : `<div class="item"><span class="tile empty"></span><div class="item-info"><span class="item-name dim">Empty</span><span class="item-note">${label}</span></div></div>`));
  return `<section class="panel stack"><h2>Equipment</h2>${rows.join('')}</section>`;
}

function bagsPanel() {
  const { hero, ui } = session;
  const level = heroLevel(hero);
  const rows = bagItems(hero).map(id => {
    const item = ITEMS[id];
    const equip = level < item.level ? lockedButton(`Level ${item.level}`) : button('plain', 'Equip', 'equip', id);
    const sell = ui.sellOpen === id ? button('danger', `Sell ${coinText(sellValue(item))}`, 'sell', id) : button('plain', 'Sell', 'askSell', id);
    return itemRow(id, `${SLOTS[item.slot]} · Level ${item.level}`, equip + sell);
  });
  return `<section class="panel stack"><h2>Bags</h2>${rows.join('') || '<p class="dim">Your bags are empty. Loot from adventures lands here.</p>'}</section>`;
}

function journeyPanel() {
  const { hero } = session;
  const days = [];
  for (let back = JOURNEY_DAYS - 1; back >= 0; back--) {
    const day = shiftDay(hero.day, -back);
    const done = back === 0 ? doneCount(hero) : hero.history[day] || 0;
    const tone = done >= QUESTS.length ? 'all' : done >= QUESTS.length / 2 ? 'most' : done > 0 ? 'some' : '';
    days.push(`<i class="${tone}${back === 0 ? ' today' : ''}" title="${day}: ${done} of ${QUESTS.length}"></i>`);
  }
  return `<section class="panel stack">
    <div class="split"><h2>Your journey</h2><span class="dim">Last ${JOURNEY_DAYS} days</span></div>
    <div class="days" role="img" aria-label="Quests done on each of the last ${JOURNEY_DAYS} days">${days.join('')}</div>
    <div class="totals">${AMOUNT_QUESTS.map(q => `<div><span>${q.total}</span><b>${q.unit === 'ml' ? amountText('ml', hero.totals[q.id]) : num(hero.totals[q.id])}</b></div>`).join('')}
      <div><span>Battles won</span><b>${num(hero.wins)}</b></div></div>
  </section>`;
}

function goalsPanel() {
  const { hero } = session;
  return `<section class="panel stack"><h2>Quest goals</h2>
    ${AMOUNT_QUESTS.map(q => `<label class="field"><span>${q.goal.label}</span>
      <input type="number" inputmode="numeric" data-goal="${q.id}" min="${q.goal.min}" step="${q.goal.step}" value="${goalOf(hero, q)}"></label>`).join('')}
    <div class="row end">${button('plain', 'Save goals', 'saveGoals')}</div>
  </section>`;
}

function backupPanel() {
  const { ui } = session;
  return `<section class="panel stack"><h2>Backup</h2>
    <p>Your hero is saved on this phone only. Copy a save code now and then and keep it in Notes, so you can restore your hero on a new phone or after clearing Safari.</p>
    <div class="row">${button('primary', 'Copy save code', 'copyCode')}</div>
    ${ui.exportCode ? `<textarea id="exportBox" class="code" readonly rows="3" aria-label="Your save code">${esc(ui.exportCode)}</textarea>` : ''}
    ${restorePanel()}
  </section>`;
}

function deletePanel() {
  const { hero, ui } = session;
  return `<section class="panel stack">${ui.confirmDelete
    ? `<p>This deletes ${esc(hero.name)} and all progress for good.</p><div class="row">${button('danger', 'Delete hero', 'deleteHero')}${button('plain', 'Keep playing', 'cancelDelete')}</div>`
    : `<div class="row">${button('plain', 'Start a new hero', 'askDelete')}</div>`}</section>`;
}

export function render() {
  const { hero } = session;
  return `<main class="screen">
    <div class="title"><h1>Hero</h1><p>${esc(hero.name)} the ${CLASSES[hero.cls].name}, on the road since ${longDay(hero.created)}.</p></div>
    ${statsPanel()}${equipmentPanel()}${bagsPanel()}${journeyPanel()}${goalsPanel()}${backupPanel()}${deletePanel()}
  </main>`;
}

export const actions = {
  equip(itemId) { commit(equipItem(session.hero, itemId)); },
  unequip(slot) { commit(unequipSlot(session.hero, slot)); },
  askSell(itemId) { session.ui.sellOpen = itemId; },
  sell(itemId) { session.ui.sellOpen = null; commit(sellItem(session.hero, itemId)); },
  saveGoals() {
    const goals = {};
    document.querySelectorAll('[data-goal]').forEach(input => { goals[input.dataset.goal] = Number(input.value); });
    commit(setGoals(session.hero, goals));
    toast('Goals saved');
  },
  askDelete() { session.ui.confirmDelete = true; },
  cancelDelete() { session.ui.confirmDelete = false; },
  // The deleted save is kept under the backup key on this phone (see save/storage.js).
  deleteHero() {
    deleteSave();
    session.hero = null;
    session.ui.confirmDelete = false;
    session.ui.battle = null;
  },
};
