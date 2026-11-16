// Adventure tab: zones to venture into, and the story of the last battle.

import { ENERGY } from '../../content/balance.js';
import { CLASSES } from '../../content/classes.js';
import { ITEMS } from '../../content/items.js';
import { ZONE_BY_ID, ZONES } from '../../content/zones.js';
import { canEnter, venture, winChance } from '../../rules/adventure.js';
import { heroPower } from '../../rules/hero.js';
import { icon } from '../art/icons.js';
import { sceneSvg } from '../art/scenes.js';
import { announce } from '../feedback.js';
import { coinText, esc } from '../format.js';
import { button, chip, itemName, itemTile, lockedButton, money } from '../parts.js';
import { refresh, save, session } from '../session.js';
import { barNumbers } from './shell.js';

const LINE_MS = 450;   // pause between lines of the battle story

// The story of a venture, one line at a time. `drop` on a line shows that item under it.
function story(hero, result) {
  const zone = ZONE_BY_ID[result.zoneId];
  const lines = [
    { text: `You venture into ${zone.name}.` },
    { text: `${zone.foe} ${zone.arrive}!` },
    { text: CLASSES[hero.cls].strike },
  ];
  if (result.won) lines.push({ text: `Victory! +${result.xp} XP · ${coinText(result.copper)}`, tone: 'good' });
  else lines.push({ text: `You are overwhelmed and limp back to camp. +${result.xp} XP for the lesson.`, tone: 'bad' });
  if (result.drop) lines.push({ text: 'Loot!', tone: 'gold', drop: result.drop });
  return lines;
}

function battleLog() {
  const { battle } = session.ui;
  if (!battle) return '';
  const lines = battle.lines.slice(0, battle.shown).map(line => `<p class="${line.tone || ''}">${esc(line.text)}</p>${
    line.drop ? `<div class="loot">${itemTile(ITEMS[line.drop])}${itemName(ITEMS[line.drop])}</div>` : ''}`);
  return `<section class="panel stack log" aria-live="polite">${lines.join('')}${battle.over ? `<div class="row">${button('plain', 'Close', 'closeBattle')}</div>` : ''}</section>`;
}

const copperRange = ([least, most]) => `${money(least)} to ${money(most)}`;

function zoneCard(zone, isNext) {
  const { hero, ui } = session;
  const open = canEnter(hero, zone);
  // Zones beyond the next locked one are only a strip of scenery and a name.
  if (!open && !isNext) {
    return `<section class="panel zone"><div class="scene">${sceneSvg(zone.scene, 'strip')}<span class="scene-tag">${zone.name} LV ${zone.level}+</span></div></section>`;
  }
  const drop = ITEMS[zone.drop];
  const chance = Math.round(winChance(hero, zone) * 100);
  const fighting = ui.battle && !ui.battle.over;
  const action = !open ? lockedButton(`Reach level ${zone.level} to enter`)
    : hero.energy < ENERGY.perVenture ? lockedButton('No energy. Complete a quest')
      : fighting ? lockedButton('In battle')
        : button('primary', 'Venture', 'venture', zone.id);
  return `<section class="panel zone${open ? '' : ' locked'}">
    <div class="scene">${sceneSvg(zone.scene, open ? 'open' : 'locked')}${open ? '' : `<span class="scene-lock">${icon('padlock', 4, 'Locked')}</span>`}</div>
    <div class="zone-body">
      <div class="split"><h2>${zone.name}</h2><span class="level-tag">LV ${zone.level}+</span></div>
      <p>${zone.foe}.</p>
      <div class="chips">${chip(`${zone.xp} XP`, 'xp')}${chip(copperRange(zone.copper), 'coin')}</div>
      <p class="dim">Rare drop: ${itemName(drop)}${hero.owned.includes(zone.drop) ? ' (owned)' : ''}</p>
      <div class="split zone-foot">${open ? `<div class="odds"><span>Victory chance</span><b class="${chance >= 70 ? 'good' : chance >= 40 ? 'gold' : 'bad'}">${chance}%</b></div>` : ''}${action}</div>
    </div>
  </section>`;
}

export function render() {
  const { hero } = session;
  const next = ZONES.find(zone => !canEnter(hero, zone));
  return `<main class="screen">
    <div class="title"><h1>Adventure</h1><p>${ENERGY.perVenture} energy per venture. Battle power <b class="gold">${heroPower(hero)}</b></p></div>
    ${battleLog()}
    ${ZONES.map(zone => zoneCard(zone, zone === next)).join('')}
  </main>`;
}

// Reveals the next line of the story; on the last one, lets the hero bar catch up and plays the result.
function tell(battle) {
  if (session.ui.battle !== battle) return;   // the hero was deleted or replaced mid-story
  battle.shown += 1;
  if (battle.shown < battle.lines.length) setTimeout(tell, LINE_MS, battle);
  else { battle.over = true; announce(battle.events); }
  refresh();
}

export const actions = {
  // The rules settle the whole battle at once and it is saved straight away, so closing the game
  // mid-story loses nothing. The story then plays back what already happened.
  venture(zoneId) {
    const { hero, ui } = session;
    if (ui.battle && !ui.battle.over) return undefined;
    const bar = { ...barNumbers(hero), energy: hero.energy - ENERGY.perVenture };
    const events = venture(hero, zoneId, Math.random);
    if (!events.length) return undefined;
    save();
    ui.battle = { lines: story(hero, events[0]), shown: 0, over: false, bar, events };
    setTimeout(tell, LINE_MS, ui.battle);
    return () => window.scrollTo(0, 0);
  },
  closeBattle() { session.ui.battle = null; },
};
