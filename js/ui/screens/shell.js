// The frame around every tab: the hero bar on top and the tab bar at the bottom.

import { CLASSES } from '../../content/classes.js';
import { ENERGY } from '../../content/balance.js';
import { levelInfo } from '../../rules/level.js';
import { cacheReady } from '../../rules/quests.js';
import { saveTab } from '../../save/storage.js';
import { icon } from '../art/icons.js';
import { esc, num } from '../format.js';
import { blocks, money } from '../parts.js';
import { session, TABS } from '../session.js';

const TAB_LABELS = { quests: 'Quests', hero: 'Hero', vendor: 'Vendor', adventure: 'Adventure' };

// The numbers the hero bar shows. A fight freezes a copy of these while its story plays out,
// so the bar does not give the ending away (see screens/adventure.js).
export const barNumbers = hero => ({ totalXp: hero.totalXp, copper: hero.copper, energy: hero.energy });

function heroBar() {
  const { hero, ui } = session;
  const shown = ui.battle && !ui.battle.over ? ui.battle.bar : barNumbers(hero);
  const { level, into, need } = levelInfo(shown.totalXp);
  const cls = CLASSES[hero.cls];
  return `<header class="hero-bar">
    <div class="avatar" aria-hidden="true">${icon(cls.emblem, 4)}<span class="badge">${level}</span></div>
    <div class="hero-id">
      <div class="hero-name">${esc(hero.name)}</div>
      <div class="hero-class">Level ${level} ${cls.name}</div>
      <div class="xp">${blocks(need ? into / need : 1, 'Experience')}<span>${need ? `${num(into)}/${num(need)} XP` : 'Max level'}</span></div>
    </div>
    <div class="purse">${money(shown.copper)}
      <span class="energy" role="img" aria-label="${shown.energy} of ${ENERGY.cap} energy">${icon('energy', 2)}${shown.energy}/${ENERGY.cap}</span>
    </div>
  </header>`;
}

function tabBar() {
  const { hero, ui } = session;
  const dot = { quests: cacheReady(hero), adventure: hero.energy > 0 };   // something is waiting on that tab
  return `<nav class="tabs" aria-label="Main">${TABS.map(tab => `
    <button type="button" class="tab" data-a="tab" data-v="${tab}" ${ui.tab === tab ? 'aria-current="page"' : ''}>
      ${icon(tab, 2)}${TAB_LABELS[tab]}${dot[tab] && ui.tab !== tab ? '<i class="dot"></i>' : ''}
    </button>`).join('')}</nav>`;
}

export const render = screenHtml => `${heroBar()}${screenHtml}${tabBar()}`;

export const actions = {
  tab(tab) {
    const { ui } = session;
    if (!TABS.includes(tab)) return undefined;
    ui.tab = tab;
    // Half-finished things on the old tab are dropped.
    ui.amountOpen = null;
    ui.sellOpen = null;
    ui.confirmDelete = false;
    ui.exportCode = null;
    ui.pendingImport = null;
    ui.map.sel = null;
    ui.map.route = null;
    if (ui.battle && ui.battle.over) ui.battle = null;
    saveTab(tab);
    return () => window.scrollTo(0, 0);
  },
};
