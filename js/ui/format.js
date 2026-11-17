// Text formatting. Plain strings only: no HTML, no DOM, no art. Units are metric.

import { STAT_NAMES } from '../content/classes.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escape anything typed by the player (hero names, save text) before putting it in HTML.
export const esc = text => String(text).replace(/[&<>"']/g, ch => ESCAPES[ch]);

export const num = value => Math.round(value).toLocaleString('en-GB');

// Currency is counted in copper: 100 copper = 1 silver, 100 silver = 1 gold.
export function coins(copper) {
  const total = Math.max(0, Math.round(copper));
  return { gold: Math.floor(total / 10000), silver: Math.floor(total % 10000 / 100), copper: total % 100 };
}

// "1g 25s 71c", for toasts and the battle log.
export function coinText(copper) {
  const c = coins(copper);
  return [c.gold && `${num(c.gold)}g`, c.silver && `${c.silver}s`, c.copper && `${c.copper}c`].filter(Boolean).join(' ') || '0c';
}

const litres = ml => (ml / 1000).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

// How each quest unit is shown. bare: the number alone. label: what follows it. chip: a "+" button.
// name: the unit spelled out, for input labels. Water is entered in millilitres and shown in litres.
const UNITS = {
  steps: { bare: num, label: 'steps', chip: v => `+${num(v)}`, name: 'steps' },
  min: { bare: num, label: 'min', chip: v => `+${v} min`, name: 'minutes' },
  ml: { bare: litres, label: 'L', chip: v => `+${v} ml`, name: 'millilitres' },
};

// "10,000 steps", "30 min", "2.0 L"
export const amountText = (unit, value) => `${UNITS[unit].bare(value)} ${UNITS[unit].label}`;
// "2,500 / 10,000 steps"
export const progressText = (unit, value, goal) => `${UNITS[unit].bare(value)} / ${amountText(unit, goal)}`;
export const chipText = (unit, value) => UNITS[unit].chip(value);
export const unitName = unit => UNITS[unit].name;

// "+3 Strength, +1 Stamina"
export const statLine = stats => Object.entries(stats).map(([stat, bonus]) => `+${bonus} ${STAT_NAMES[stat]}`).join(', ');

// "Monday 16 November"
export const longDate = date => date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

// A day key ('2026-11-16') as "16 November 2026".
export function longDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const WINDS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

// The compass direction of a step of dx tiles east and dy tiles south: "north-east".
export const compass = (dx, dy) => WINDS[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
