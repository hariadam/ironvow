// HTML building blocks shared by the screens. Everything returns a string.
// Buttons do things through data-a (the action name) and data-v (its value): see app.js.

import { ITEMS, RARITIES } from '../content/items.js';
import { icon } from './art/icons.js';
import { itemSprite, RARITY } from './art/items.js';
import { coins, esc, num, statLine } from './format.js';

// A button. kind: 'primary' (the one main action), 'plain' (everything else) or 'danger' (deletes or undoes).
// `more` is extra attributes, e.g. 'data-n="500"'.
export function button(kind, label, action, value = '', more = '') {
  return `<button type="button" class="btn btn-${kind}" data-a="${action}" data-v="${esc(value)}" ${more}>${label}</button>`;
}

// A button that cannot be pressed yet. Its label says what is needed ("Reach level 3 to enter").
export const lockedButton = need => `<button type="button" class="btn btn-locked" disabled>${need}</button>`;

// A small flat label. tone: 'xp', 'good', 'gold', 'coin' or '' for plain.
export const chip = (html, tone = '') => `<span class="chip ${tone}">${html}</span>`;

// Coins as sprites and numbers: gold, silver, copper, skipping empty ones.
export function money(copper) {
  const c = coins(copper);
  const parts = [];
  if (c.gold) parts.push(`<span class="coin">${icon('gold', 2)}${num(c.gold)}</span>`);
  if (c.silver) parts.push(`<span class="coin">${icon('silver', 2)}${c.silver}</span>`);
  if (c.copper || !parts.length) parts.push(`<span class="coin">${icon('copper', 2)}${c.copper}</span>`);
  return `<span class="money" role="img" aria-label="${num(c.gold)} gold ${c.silver} silver ${c.copper} copper">${parts.join('')}</span>`;
}

// Ten blocks filled in proportion to `fraction` (0 to 1). Used for XP and quest progress.
export function blocks(fraction, label, tone = '') {
  const filled = Math.max(0, Math.min(10, Math.floor(fraction * 10 + 1e-9)));
  const cells = Array.from({ length: 10 }, (_, i) => `<i${i < filled ? ' class="on"' : ''}></i>`).join('');
  return `<span class="blocks ${tone}" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Math.min(1, fraction) * 100)}">${cells}</span>`;
}

const rarityIndex = item => RARITIES.indexOf(item.rarity);

// The item's sprite in its rarity frame.
export const itemTile = item => `<span class="tile rar-${rarityIndex(item)}">${itemSprite(item, 64)}</span>`;

export const itemName = item => `<span class="item-name rar-${rarityIndex(item)}">${esc(item.name)}</span>`;

// One item in a list: tile, then name, stats, a note line (rarity first, so rarity never depends on colour
// alone) and a foot line for a price and buttons.
export function itemRow(itemId, note, foot) {
  const item = ITEMS[itemId];
  return `<div class="item">${itemTile(item)}
    <div class="item-info">${itemName(item)}<span class="item-stats">${statLine(item.stats)}</span><span class="item-note">${RARITY[rarityIndex(item)].name} · ${note}</span>
      <div class="item-foot">${foot}</div></div></div>`;
}

// CSS made from the sprite generator's rarity table, so frames and name colours have one source of truth.
// Sets --rar (name colour), --rar-frame and --rar-bg on .rar-0 … .rar-4.
export const rarityCss = () => RARITY.map((r, i) => `.rar-${i}{--rar:${r.color};--rar-frame:${r.frame};--rar-bg:${r.backdrop}}`).join('');
