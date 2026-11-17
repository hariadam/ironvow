// Travel: where the hero is in the world, what they have uncovered, and walking, which spends real steps.
// See rules/hero.js for the layer's contract.
//
// The save keeps the hero's position, the steps spent walking, and the TRAIL: the walks that uncovered
// new land, as legs of [start x, start y, moves]. The fog of war is not saved; it is rebuilt by walking
// the trail again, which keeps saves and save codes small however much of the world is explored.
// Uncovered land never goes back under fog.

import { WORLD } from '../content/world.js';
import { CHUNK, gridKey, gridSpot, walkable } from './world.js';

// ---- The trail's text form. Moves are north, east, south, west (0-3). One character holds one, two or
// three moves (codes 0-3, 4-19 and 20-83), so a day's walking is a few hundred characters.
const MOVES = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~!*()$+,;:@=/?#[]%^';
const CODE_OF = Object.fromEntries([...LETTERS].map((letter, code) => [letter, code]));
const FIRST_CODE = [0, 4, 20];   // where the codes for 1, 2 and 3 moves start

function pack(moves) {
  let text = '';
  for (let i = 0; i < moves.length; i += 3) {
    const part = moves.slice(i, i + 3);
    text += LETTERS[FIRST_CODE[part.length - 1] + part.reduce((value, move) => value * 4 + move, 0)];
  }
  return text;
}

// Characters this version does not know are skipped, like any other unknown id in a save.
function unpack(text) {
  const moves = [];
  for (const letter of text) {
    const code = CODE_OF[letter];
    if (code === undefined) continue;
    if (code < 4) moves.push(code);
    else if (code < 20) moves.push((code - 4) >> 2, (code - 4) & 3);
    else moves.push((code - 20) >> 4, (code - 20) >> 2 & 3, (code - 20) & 3);
  }
  return moves;
}

// ---- What the hero can see from a tile: a round patch, WORLD.view tiles in every direction.
const REACH = WORLD.view * WORLD.view + WORLD.view;
const inPatch = (dx, dy) => dx * dx + dy * dy <= REACH;
const PATCH = [];
for (let dy = -WORLD.view; dy <= WORLD.view; dy++) for (let dx = -WORLD.view; dx <= WORLD.view; dx++) if (inPatch(dx, dy)) PATCH.push([dx, dy]);
// After one step, only the leading edge of the patch is new: the tiles the old patch did not reach.
const EDGES = MOVES.map(([mx, my]) => PATCH.filter(([dx, dy]) => !inPatch(dx + mx, dy + my)));

export const inView = (hero, x, y) => inPatch(x - hero.map.x, y - hero.map.y);

// ---- The fog: for each block of the world, one bit per tile (set = uncovered) and how many are set.
function uncover(fog, x, y) {
  const key = gridKey(x >> 5, y >> 5);
  let block = fog.blocks.get(key);
  if (!block) { block = { bits: new Uint8Array(CHUNK * CHUNK / 8), count: 0 }; fog.blocks.set(key, block); }
  const n = (y & 31) * CHUNK + (x & 31), bit = 1 << (n & 7);
  if (block.bits[n >> 3] & bit) return 0;
  block.bits[n >> 3] |= bit;
  block.count++;
  return 1;
}
// Both return how many tiles were newly uncovered.
const uncoverAround = (fog, x, y) => PATCH.reduce((fresh, [dx, dy]) => fresh + uncover(fog, x + dx, y + dy), 0);
const uncoverAhead = (fog, x, y, move) => EDGES[move].reduce((fresh, [dx, dy]) => fresh + uncover(fog, x + dx, y + dy), 0);

// Tells a save's trail and position apart from the one a fog was built for.
const markOf = map => `${map.trail.length}:${map.trail.length ? map.trail[map.trail.length - 1][2].length : 0}:${map.x},${map.y}`;

function buildFog(map) {
  const fog = { blocks: new Map(), mark: markOf(map) };
  for (const [startX, startY, text] of map.trail) {
    let x = startX, y = startY;
    uncoverAround(fog, x, y);
    for (const move of unpack(text)) {
      x += MOVES[move][0]; y += MOVES[move][1];
      uncoverAhead(fog, x, y, move);
    }
  }
  uncoverAround(fog, map.x, map.y);
  return fog;
}

// The hero's fog: { blocks: Map of block key → { bits, count } }. Kept between calls and rebuilt only if
// the save's trail is not the one it was built from (a different hero, an imported save).
const fogs = new WeakMap();
export function fogOf(hero) {
  let fog = fogs.get(hero);
  if (!fog || fog.mark !== markOf(hero.map)) { fog = buildFog(hero.map); fogs.set(hero, fog); }
  return fog;
}

function seenIn(fog, x, y) {
  const block = fog.blocks.get(gridKey(x >> 5, y >> 5));
  if (!block) return false;
  const n = (y & 31) * CHUNK + (x & 31);
  return (block.bits[n >> 3] >> (n & 7) & 1) === 1;
}
export const isSeen = (hero, x, y) => seenIn(fogOf(hero), x, y);

// ---- Steps. Walking is paid for with the real steps the player has logged on the steps quest.
export const stepsLeft = hero => Math.max(0, WORLD.startSteps + (hero.totals.steps || 0) - hero.map.walked);

// The shortest walk from the hero to a tile over uncovered land, four directions.
// Returns { path: [[x, y], ...] (the hero's own tile left out), steps } or { why }:
// 'fog' (the tile is not uncovered), 'wall' (it cannot be walked on), 'cut' (no uncovered way there),
// 'far' (too far to plan in one go).
export function routeTo(hero, tx, ty) {
  const fog = fogOf(hero);
  if (!seenIn(fog, tx, ty)) return { why: 'fog' };
  if (!walkable(tx, ty)) return { why: 'wall' };
  const { x: fromX, y: fromY } = hero.map;
  if (tx === fromX && ty === fromY) return { path: [], steps: 0 };
  // A search that looks toward the target first. `walked` is the best known distance to each tile.
  const guess = (x, y) => Math.abs(x - tx) + Math.abs(y - ty);
  const start = gridKey(fromX, fromY), goal = gridKey(tx, ty);
  const from = new Map([[start, -1]]), walked = new Map([[start, 0]]);
  const queue = new Map();   // estimated total → tiles waiting to be looked at
  let waiting = 1, estimate = guess(fromX, fromY), looked = 0;
  queue.set(estimate, [[fromX, fromY, 0]]);
  while (waiting) {
    const line = queue.get(estimate);
    if (!line || !line.length) { estimate++; continue; }
    const [x, y, cost] = line.pop();
    waiting--;
    const at = gridKey(x, y);
    if (cost > walked.get(at)) continue;
    if (at === goal) break;
    if (++looked > WORLD.planLimit) return { why: 'far' };
    for (const [dx, dy] of MOVES) {
      const nx = x + dx, ny = y + dy, next = gridKey(nx, ny);
      if (walked.has(next) && walked.get(next) <= cost + 1) continue;
      if (!seenIn(fog, nx, ny) || !walkable(nx, ny)) continue;
      walked.set(next, cost + 1); from.set(next, at);
      const total = cost + 1 + guess(nx, ny);
      if (!queue.has(total)) queue.set(total, []);
      queue.get(total).push([nx, ny, cost + 1]);
      waiting++;
    }
  }
  if (!from.has(goal)) return { why: 'cut' };
  const path = [];
  for (let at = goal; at !== start; at = from.get(at)) path.push(gridSpot(at));
  path.reverse();
  return { path, steps: path.length * WORLD.stepsPerTile };
}

// Walks the hero to a tile, spending steps and uncovering land on the way.
// The event is { type: 'walked', path, steps }.
export function walkTo(hero, tx, ty) {
  const route = routeTo(hero, tx, ty);
  if (!route.path || !route.path.length || route.steps > stepsLeft(hero)) return [];
  const map = hero.map, fog = fogOf(hero);
  const startX = map.x, startY = map.y, moves = [];
  let fresh = 0;
  for (const [x, y] of route.path) {
    const move = MOVES.findIndex(([dx, dy]) => map.x + dx === x && map.y + dy === y);
    moves.push(move);
    map.x = x; map.y = y;
    fresh += uncoverAhead(fog, x, y, move);
  }
  map.walked += route.steps;
  // Only walks that uncovered something are added to the trail; crossing known land leaves no mark.
  if (fresh) {
    const last = map.trail[map.trail.length - 1];
    const lastEnd = last && unpack(last[2]).reduce(([x, y], move) => [x + MOVES[move][0], y + MOVES[move][1]], [last[0], last[1]]);
    if (last && lastEnd[0] === startX && lastEnd[1] === startY) {
      last[2] = last[2].slice(0, -1) + pack([...unpack(last[2].slice(-1)), ...moves]);
    } else {
      map.trail.push([startX, startY, pack(moves)]);
    }
  }
  fog.mark = markOf(map);
  return [{ type: 'walked', path: route.path, steps: route.steps }];
}
