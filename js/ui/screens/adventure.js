// Adventure tab: the world map, the place the hero is looking at, fights, and where the dungeons are.

import { ENERGY } from '../../content/balance.js';
import { CLASSES } from '../../content/classes.js';
import { ITEMS } from '../../content/items.js';
import { MOB_BY_ID } from '../../content/mobs.js';
import { TOWN, WORLD } from '../../content/world.js';
import { ZONE_BY_ID, ZONES } from '../../content/zones.js';
import { canFight, fight, foeAt, winChance } from '../../rules/adventure.js';
import { heroLevel } from '../../rules/hero.js';
import { isSeen, routeTo, stepsLeft, walkTo } from '../../rules/travel.js';
import { biomeAt, dungeons, levelAt } from '../../rules/world.js';
import { icon } from '../art/icons.js';
import { sceneSvg } from '../art/scenes.js';
import { announce } from '../feedback.js';
import { coinText, compass, esc, num } from '../format.js';
import { centreMap, mountMap, walkPlayback, zoomMap } from '../map.js';
import { button, chip, itemName, itemTile, lockedButton, money } from '../parts.js';
import { commit, refresh, save, session } from '../session.js';
import { barNumbers } from './shell.js';

const LINE_MS = 450;   // pause between lines of the battle story

// The story of a fight, one line at a time. `drop` on a line shows that item under it.
function story(hero, result) {
  const zone = ZONE_BY_ID[result.zoneId];
  const mob = MOB_BY_ID[result.mobId];
  const lines = zone ? [{ text: `You venture into ${zone.name}.` }, { text: `${zone.foe} ${zone.arrive}!` }] : [{ text: `${mob.foe} ${mob.arrive}!` }];
  lines.push({ text: CLASSES[hero.cls].strike });
  if (result.won) lines.push({ text: `Victory! +${result.xp} XP · ${coinText(result.copper)}`, tone: 'good' });
  else lines.push({ text: `You are overwhelmed and fall back. +${result.xp} XP for the lesson.`, tone: 'bad' });
  if (result.drop) lines.push({ text: 'Loot!', tone: 'gold', drop: result.drop });
  return lines;
}

function battleLog() {
  const { battle } = session.ui;
  const lines = battle.lines.slice(0, battle.shown).map(line => `<p class="${line.tone || ''}">${esc(line.text)}</p>${
    line.drop ? `<div class="loot">${itemTile(ITEMS[line.drop])}${itemName(ITEMS[line.drop])}</div>` : ''}`);
  return `<section class="panel stack log place" aria-live="polite">${lines.join('')}${battle.over ? `<div class="row">${button('plain', 'Close', 'closeBattle')}</div>` : ''}</section>`;
}

const copperRange = ([least, most]) => `${money(least)} to ${money(most)}`;

// Distance between two tiles as the crow flies, in steps.
const stepsBetween = (dx, dy) => Math.hypot(dx, dy) * WORLD.stepsPerTile;

// What can be done about the tile the player picked: walk there, or why not.
function walkButton(route) {
  const left = stepsLeft(session.hero);
  if (route.path) {
    return route.steps > left ? lockedButton(`Needs ${num(route.steps)} steps. You have ${num(left)}`) : button('primary', `Walk ${num(route.steps)} steps`, 'walk');
  }
  return lockedButton({ fog: 'Uncover it first', wall: 'Cannot be crossed', cut: 'No way there yet. Explore around it', far: 'Too far to plan. Pick a closer spot' }[route.why]);
}

function fightButton(foe) {
  const { hero } = session;
  if (!canFight(hero, foe)) return lockedButton(`Reach level ${foe.needs} to ${foe.zone ? 'enter' : 'fight'}`);
  if (hero.energy < ENERGY.perFight) return lockedButton('No energy. Complete a quest');
  return button('primary', foe.zone ? 'Venture' : 'Fight', 'fight');
}

// The card under the map: the tile the player tapped, or the one the hero stands on.
function placeCard() {
  const { hero, ui } = session;
  const at = ui.map.sel || hero.map;
  const here = at.x === hero.map.x && at.y === hero.map.y;
  const route = here ? null : ui.map.route || routeTo(hero, at.x, at.y);
  if (!isSeen(hero, at.x, at.y)) {
    return `<section class="panel zone place"><div class="zone-body"><h2>Unknown land</h2><p>Still under fog. Walk closer to uncover it.</p>
      <div class="split zone-foot">${walkButton(route)}</div></div></section>`;
  }
  const foe = foeAt(hero, at.x, at.y);
  const biome = biomeAt(at.x, at.y);
  const town = at.x === 0 && at.y === 0;
  const open = foe && canFight(hero, foe);
  const name = foe ? (foe.zone || foe.mob).name : town ? TOWN.name : biome.name;
  const tag = foe ? `LV ${foe.level}${foe.zone ? '+' : ''}` : biome.walk && !town ? `Mobs LV ${levelAt(at.x, at.y)}` : '';
  const text = foe ? (foe.zone ? `${foe.zone.foe}.` : `${foe.mob.foe} roams here.`)
    : town ? 'Where your journey began. No mobs come this close to town.'
      : biome.walk ? 'Wild land.' : 'Cannot be crossed. Find a way around.';
  const scene = foe && foe.zone
    ? `<div class="scene">${sceneSvg(foe.zone.scene, open ? 'open' : 'locked')}${open ? '' : `<span class="scene-lock">${icon('padlock', 4, 'Locked')}</span>`}</div>` : '';
  const chance = open ? Math.round(winChance(hero, foe) * 100) : 0;
  return `<section class="panel zone place${foe && !open ? ' locked' : ''}">${scene}
    <div class="zone-body">
      <div class="split"><h2>${name}</h2>${tag ? `<span class="level-tag">${tag}</span>` : ''}</div>
      <p>${text}</p>
      ${foe ? `<div class="chips">${chip(`${foe.xp} XP`, 'xp')}${chip(copperRange(foe.copper), 'coin')}</div>` : ''}
      ${foe && foe.drop ? `<p class="dim">Rare drop: ${itemName(ITEMS[foe.drop])}${hero.owned.includes(foe.drop) ? ' (owned)' : ''}</p>` : ''}
      <div class="split zone-foot">${open ? `<div class="odds"><span>Victory chance</span><b class="${chance >= 70 ? 'good' : chance >= 40 ? 'gold' : 'bad'}">${chance}%</b></div>` : ''}${
  here ? (foe ? fightButton(foe) : '<span class="dim">You are here.</span>') : walkButton(route)}</div>
    </div>
  </section>`;
}

// Where each dungeon is. One the hero has uncovered is described from where they stand; the ones they are
// ready for (and the next one after) are a rumour, described from town; the rest are only a name.
function dungeonList() {
  const { hero } = session;
  const level = heroLevel(hero);
  const next = ZONES.find(zone => level < zone.level);
  const rows = dungeons().map(({ zone, x, y }) => {
    const dx = x - hero.map.x, dy = y - hero.map.y;
    const where = !dx && !dy ? 'You are here.'
      : isSeen(hero, x, y) ? `Found: ${num(Math.round(stepsBetween(dx, dy) / 10) * 10)} steps to the ${compass(dx, dy)}.`
        : level >= zone.level || zone === next ? `Rumour: about ${num(Math.max(100, Math.round(stepsBetween(x, y) / 100) * 100))} steps ${compass(x, y)} of ${TOWN.name}.`
          : 'No one speaks of where it lies yet.';
    return `<div class="dungeon${level >= zone.level ? '' : ' locked'}"><div class="split"><span class="label">${zone.name}</span><span class="level-tag">LV ${zone.level}+</span></div><span class="dim">${where}</span></div>`;
  });
  return `<section class="panel stack dungeons"><h2>Dungeons</h2>${rows.join('')}</section>`;
}

const tool = (label, action, value, more) => `<button type="button" class="tool" data-a="${action}" data-v="${value}" ${more}>${label}</button>`;

export function render() {
  const { hero, ui } = session;
  return `<main class="screen${ui.map.full ? ' map-full' : ''}">
    <div class="title map-title"><h1>Adventure</h1>
      <div class="chips">${chip(`${num(stepsLeft(hero))} steps to walk`, 'xp')}<span class="chip xp full-only">${icon('energy', 2)}&nbsp;${hero.energy}/${ENERGY.cap}</span></div></div>
    <div class="stage"><canvas class="map" id="map" role="img" aria-label="Map of the world around your hero"></canvas>
      <div class="tools">
        ${tool(ui.map.full ? 'Exit' : 'Full', 'mapFull', '', `aria-pressed="${ui.map.full}" aria-label="${ui.map.full ? 'Leave full screen' : 'Full screen map'}"`)}
        ${tool('+', 'mapZoom', 1, 'aria-label="Zoom in"')}${tool('-', 'mapZoom', -1, 'aria-label="Zoom out"')}
        ${tool('Me', 'mapCentre', '', 'aria-label="Centre the map on your hero"')}
      </div></div>
    ${ui.battle ? battleLog() : placeCard()}
    ${dungeonList()}
  </main>`;
}

// A tap on the map. Tapping a tile picks it; tapping the picked tile again walks there.
function pick(x, y) {
  const { hero, ui } = session;
  if (ui.map.walk || (ui.battle && !ui.battle.over)) return;
  ui.battle = null;
  if (ui.map.sel && ui.map.sel.x === x && ui.map.sel.y === y) actions.walk();
  else if (x === hero.map.x && y === hero.map.y) { ui.map.sel = null; ui.map.route = null; }
  else { ui.map.sel = { x, y }; ui.map.route = routeTo(hero, x, y); }
  refresh();
}

export const afterDraw = () => mountMap(pick);

// Reveals the next line of the story; on the last one, lets the hero bar catch up and plays the result.
function tell(battle) {
  if (session.ui.battle !== battle) return;   // the hero was deleted or replaced mid-story
  battle.shown += 1;
  if (battle.shown < battle.lines.length) setTimeout(tell, LINE_MS, battle);
  else { battle.over = true; announce(battle.events); }
  refresh();
}

export const actions = {
  // The rules settle the walk at once and it is saved straight away; the map then plays it back.
  walk() {
    const { hero, ui } = session;
    if (!ui.map.sel || ui.map.walk) return;
    const from = [hero.map.x, hero.map.y];
    const events = walkTo(hero, ui.map.sel.x, ui.map.sel.y);
    if (!events.length) return;
    ui.map.sel = null;
    ui.map.route = null;
    ui.map.walk = walkPlayback([from, ...events[0].path]);
    commit(events);
  },
  // The rules settle the whole fight at once and it is saved straight away, so closing the game
  // mid-story loses nothing. The story then plays back what already happened.
  fight() {
    const { hero, ui } = session;
    if (ui.battle && !ui.battle.over) return;
    const bar = { ...barNumbers(hero), energy: hero.energy - ENERGY.perFight };
    const events = fight(hero, Math.random);
    if (!events.length) return;
    save();
    ui.map.sel = null;
    ui.map.route = null;
    ui.battle = { lines: story(hero, events[0]), shown: 0, over: false, bar, events };
    setTimeout(tell, LINE_MS, ui.battle);
  },
  closeBattle() { session.ui.battle = null; },
  mapFull() { session.ui.map.full = !session.ui.map.full; },
  mapZoom(by) { zoomMap(Number(by)); },
  mapCentre() { centreMap(); },
};
