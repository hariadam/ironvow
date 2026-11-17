// The world map's canvas: painting it, and the fingers on it (drag to move, pinch to zoom, tap to pick).
//
// This is the one part of the interface that is not an HTML string. The Adventure screen puts an empty
// <canvas id="map"> in the page and calls mountMap() after every redraw (see afterDraw in app.js); the
// map is then painted from `session`, like everything else. Only two things happen without a redraw of
// the page, because they must run at the speed of a finger or a frame: moving the camera, and playing
// back a walk the rules have already settled. Both live in session.ui.map (never saved):
//   cam   { x, y: the tile at the centre of the map (fractions allowed), z: CSS px per sprite pixel }
//   sel   the tile picked by a tap, or null          route  rules/travel.js → routeTo for that tile
//   walk  { path, began, ms } while a walk is played back, or null

import { BIOMES, WORLD } from '../content/world.js';
import { foesInView } from '../rules/adventure.js';
import { fogOf, isSeen } from '../rules/travel.js';
import { blockBiomes, CHUNK, dungeons, gridKey, gridSpot, roll } from '../rules/world.js';
import { MARK_ART, MOB_ART, TERRAIN_ART } from './art/tiles.js';
import { refresh, session } from './session.js';

const TILE = 8;                 // sprite pixels per tile
// Zoom levels, in CSS px per sprite pixel. Below 1 the land is flat colour, one small picture per block;
// at the far end the whole world fits on a phone.
const ZOOMS = [1 / 128, 1 / 64, 1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 3, 4, 6, 8];
const START_ZOOM = 1;
const MARK_PX = 16;             // marks, mobs and the hero are never drawn smaller than this
const MOBS_FROM_PX = 2;         // mobs are hidden once a tile is smaller than this
const FOG = '#14102A';
const FOG_DOT = '#1F1A3A';
const GOLD = '#FFCF4A';
const SHADE = [13, 11, 26];     // uncovered land outside the hero's view is mixed with this...
const DIM = 0.3;                // ...by this much
const WALK_MS = { perTile: 80, most: 2200 };
const REACH = WORLD.view * WORLD.view + WORLD.view;
const SALT = { variant: 90, flip: 91 };

// ---- Sprites: each is painted once on its own 8×8 canvas, then drawn at whatever zoom the map is at.
const sprites = new Map();
function sprite(key, art, rows, flip = false, base = null) {
  let made = sprites.get(key);
  if (!made) {
    made = document.createElement('canvas');
    made.width = made.height = TILE;
    const c = made.getContext('2d');
    if (base) { c.fillStyle = base; c.fillRect(0, 0, TILE, TILE); }
    for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) {
      const color = art.palette[rows[j][flip ? TILE - 1 - i : i]];
      if (color) { c.fillStyle = color; c.fillRect(i, j, 1, 1); }
    }
    sprites.set(key, made);
  }
  return made;
}
function terrainSprite(biome, x, y) {
  const art = TERRAIN_ART[biome.id], variant = roll(x, y, SALT.variant) < 0.5 ? 0 : 1, flip = roll(x, y, SALT.flip) < 0.5;
  return sprite(`${biome.id}${variant}${flip}`, art, art.rows[variant], flip, art.base);
}
const markSprite = name => sprite(name, MARK_ART[name], MARK_ART[name].rows);
const mobSprite = id => sprite(`mob-${id}`, MOB_ART[id], MOB_ART[id].rows);
function fogSprite(odd) {
  let made = sprites.get(`fog${odd}`);
  if (!made) {
    made = document.createElement('canvas');
    made.width = made.height = TILE;
    const c = made.getContext('2d');
    c.fillStyle = FOG; c.fillRect(0, 0, TILE, TILE);
    c.fillStyle = FOG_DOT;
    for (let b = 0; b < 4; b++) c.fillRect((b % 2) * 4 + odd * 2, (b >> 1) * 4 + 1, 2, 2);
    sprites.set(`fog${odd}`, made);
  }
  return made;
}

// Zoomed out, a tile is one flat colour: its biome's, darker outside the hero's view.
const BRIGHT = BIOMES.map(biome => [1, 3, 5].map(at => parseInt(TERRAIN_ART[biome.id].base.slice(at, at + 2), 16)).concat(255));
const DULL = BRIGHT.map(([r, g, b]) => [r, g, b].map((part, n) => Math.round(part * (1 - DIM) + SHADE[n] * DIM)).concat(255));

// Zoomed out, each block of the world is one small picture, one pixel per tile: its uncovered land in
// full colour on the left half and dimmed on the right. `count` is how many tiles were uncovered when
// it was painted; when the fog's count has moved on, the picture is painted again.
let painted = { fog: null, pictures: new Map() };
function paintBlock(key, block) {
  let picture = painted.pictures.get(key);
  if (!picture) {
    picture = { canvas: document.createElement('canvas'), count: 0 };
    picture.canvas.width = CHUNK * 2; picture.canvas.height = CHUNK;
    painted.pictures.set(key, picture);
  }
  const [cx, cy] = gridSpot(key);
  const biomes = blockBiomes(cx, cy), c = picture.canvas.getContext('2d'), image = c.createImageData(CHUNK * 2, CHUNK);
  for (let n = 0; n < CHUNK * CHUNK; n++) {
    if (!(block.bits[n >> 3] >> (n & 7) & 1)) continue;
    const at = ((n >> 5) * CHUNK * 2 + (n & 31)) * 4;
    image.data.set(BRIGHT[biomes[n]], at);
    image.data.set(DULL[biomes[n]], at + CHUNK * 4);
  }
  c.putImageData(image, 0, 0);
  picture.count = block.count;
  return picture;
}

// ---- What is on the map right now, worked out once per redraw of the page.
let marks = [];    // [{ x, y, image, mob (true for wild mobs) }]: the town, dungeons already uncovered, mobs in view
const view = { w: 0, h: 0, dpr: 1 };   // the canvas, in its own pixels

function findMarks() {
  const { hero } = session;
  marks = [{ x: 0, y: 0, image: markSprite('town'), mob: false }];
  for (const { x, y } of dungeons()) if (isSeen(hero, x, y)) marks.push({ x, y, image: markSprite('dungeon'), mob: false });
  for (const { x, y, foe } of foesInView(hero)) marks.push({ x, y, image: mobSprite(foe.mob.id), mob: true });
}
const tilePx = () => session.ui.map.cam.z * TILE;
const shown = mark => !mark.mob || tilePx() >= MOBS_FROM_PX;

// Where the hero is drawn: on their tile, or part-way along a walk that is being played back.
function heroSpot() {
  const { hero, ui } = session;
  const walk = ui.map.walk;
  if (!walk) return [hero.map.x, hero.map.y];
  const done = walk.ms ? Math.min(1, (performance.now() - walk.began) / walk.ms) : 1;
  return walk.path[Math.round(done * (walk.path.length - 1))];
}

function draw(canvas) {
  const { hero, ui } = session;
  const ctx = canvas.getContext('2d'), cam = ui.map.cam, fog = fogOf(hero);
  if (painted.fog !== fog) painted = { fog, pictures: new Map() };
  const size = cam.z * TILE * view.dpr;                                   // one tile, in canvas pixels
  const ox = view.w / 2 - cam.x * size, oy = view.h / 2 - cam.y * size;    // where tile 0,0 starts
  const edge = (origin, n) => Math.round(origin + n * size);
  const least = MARK_PX * view.dpr;
  // The square a mark is drawn in: its tile, or a bigger square centred on it when tiles are tiny.
  const box = (x, y) => {
    const px = edge(ox, x), py = edge(oy, y), w = edge(ox, x + 1) - px, s = Math.max(w, least);
    return [Math.round(px + (w - s) / 2), Math.round(py + (w - s) / 2), s];
  };
  const [heroX, heroY] = heroSpot();
  const lit = (x, y) => (x - heroX) * (x - heroX) + (y - heroY) * (y - heroY) <= REACH;
  const x0 = Math.floor(-ox / size), x1 = Math.floor((view.w - ox) / size);
  const y0 = Math.floor(-oy / size), y1 = Math.floor((view.h - oy) / size);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = FOG; ctx.fillRect(0, 0, view.w, view.h);

  if (cam.z < 1) {
    // Zoomed out: one picture per block. Painting is rationed per frame so a huge map never freezes the page.
    ctx.imageSmoothingEnabled = size < 1;
    const drawn = [];
    let budget = 80, more = false;
    for (const [key, block] of fog.blocks) {
      const [cx, cy] = gridSpot(key);
      if (cx < x0 >> 5 || cx > x1 >> 5 || cy < y0 >> 5 || cy > y1 >> 5) continue;
      let picture = painted.pictures.get(key);
      if (!picture || picture.count !== block.count) {
        if (budget > 0) { budget--; picture = paintBlock(key, block); } else more = true;
      }
      if (!picture) continue;
      const px = edge(ox, cx * CHUNK), py = edge(oy, cy * CHUNK), w = edge(ox, (cx + 1) * CHUNK) - px, h = edge(oy, (cy + 1) * CHUNK) - py;
      ctx.drawImage(picture.canvas, CHUNK, 0, CHUNK, CHUNK, px, py, w, h);
      drawn.push([picture.canvas, px, py, w, h]);
    }
    // The patch the hero can see right now is drawn again in full colour, cut to its tile-stepped circle.
    ctx.save(); ctx.beginPath();
    for (let dy = -WORLD.view; dy <= WORLD.view; dy++) {
      const half = Math.floor(Math.sqrt(REACH - dy * dy)), px = edge(ox, heroX - half), py = edge(oy, heroY + dy);
      ctx.rect(px, py, edge(ox, heroX + half + 1) - px, edge(oy, heroY + dy + 1) - py);
    }
    ctx.clip();
    for (const [picture, px, py, w, h] of drawn) ctx.drawImage(picture, 0, 0, CHUNK, CHUNK, px, py, w, h);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
    if (more) requestAnimationFrame(() => { if (canvas.isConnected) draw(canvas); });
  } else {
    // Zoomed in: every tile is a sprite.
    let lastKey = null, block = null, biomes = null;
    for (let y = y0; y <= y1; y++) {
      const py = edge(oy, y), h = edge(oy, y + 1) - py;
      for (let x = x0; x <= x1; x++) {
        const px = edge(ox, x), w = edge(ox, x + 1) - px;
        const key = gridKey(x >> 5, y >> 5);
        if (key !== lastKey) { lastKey = key; block = fog.blocks.get(key); biomes = block ? blockBiomes(x >> 5, y >> 5) : null; }
        const n = (y & 31) * CHUNK + (x & 31);
        if (!block || !(block.bits[n >> 3] >> (n & 7) & 1)) { ctx.drawImage(fogSprite((x + y) & 1), px, py, w, h); continue; }
        ctx.drawImage(terrainSprite(BIOMES[biomes[n]], x, y), px, py, w, h);
        if (!lit(x, y)) { ctx.fillStyle = `rgba(${SHADE.join(',')},${DIM})`; ctx.fillRect(px, py, w, h); }
      }
    }
  }

  for (const mark of marks) {
    if (!shown(mark)) continue;
    const [px, py, s] = box(mark.x, mark.y);
    ctx.drawImage(mark.image, px, py, s, s);
  }
  ctx.fillStyle = GOLD;
  if (ui.map.route && ui.map.route.path) for (const [x, y] of ui.map.route.path.slice(0, -1)) {
    const px = edge(ox, x), py = edge(oy, y), w = edge(ox, x + 1) - px, dot = Math.max(2, Math.round(w / 4));
    ctx.fillRect(px + Math.round((w - dot) / 2), py + Math.round((w - dot) / 2), dot, dot);
  }
  const [hx, hy, hs] = box(heroX, heroY);
  ctx.drawImage(markSprite('hero'), hx, hy, hs, hs);
  if (ui.map.sel) {
    const [px, py, w] = box(ui.map.sel.x, ui.map.sel.y);
    const t = Math.max(2, Math.round(w / 8)), arm = Math.max(t, Math.round(w * 3 / 8));
    for (const [cx, cy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      ctx.fillRect(px + cx * (w - arm), py + cy * (w - t), arm, t);
      ctx.fillRect(px + cx * (w - t), py + cy * (w - arm), t, arm);
    }
  }
}

// Redraws once per frame however many finger moves arrive.
let queued = false;
function redraw(canvas) {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; if (canvas.isConnected) draw(canvas); });
}

// ---- The camera
const nearestZoom = z => ZOOMS.reduce((best, level) => (Math.abs(Math.log(level / z)) < Math.abs(Math.log(best / z)) ? level : best));
const followHero = () => { const [x, y] = heroSpot(); Object.assign(session.ui.map.cam, { x: x + 0.5, y: y + 0.5 }); };

// Changes the zoom while keeping the spot under the fingers where it is.
function zoomAt(canvas, z, clientX, clientY) {
  const cam = session.ui.map.cam, rect = canvas.getBoundingClientRect();
  const sx = clientX - rect.left - rect.width / 2, sy = clientY - rect.top - rect.height / 2;
  const wx = cam.x + sx / (cam.z * TILE), wy = cam.y + sy / (cam.z * TILE);
  cam.z = Math.max(ZOOMS[0], Math.min(ZOOMS[ZOOMS.length - 1], z));
  cam.x = wx - sx / (cam.z * TILE); cam.y = wy - sy / (cam.z * TILE);
  redraw(canvas);
}

// For the map's buttons. The page is redrawn after a tap, which repaints the map.
export function zoomMap(by) {
  const cam = session.ui.map.cam;
  if (cam) cam.z = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(nearestZoom(cam.z)) + by))];
}
export function centreMap() {
  if (session.ui.map.cam) followHero();
}

// The record of a walk to play back: `path` starts with the tile the hero left.
export function walkPlayback(path) {
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { path, began: performance.now(), ms: still ? 0 : Math.min(WALK_MS.most, (path.length - 1) * WALK_MS.perTile) };
}

// The tile under a finger. When tiles are smaller than a fingertip, a tap near a mark picks the mark.
function tileAt(canvas, clientX, clientY) {
  const cam = session.ui.map.cam, rect = canvas.getBoundingClientRect(), px = tilePx();
  const fx = cam.x + (clientX - rect.left - rect.width / 2) / px, fy = cam.y + (clientY - rect.top - rect.height / 2) / px;
  let best = [Math.floor(fx), Math.floor(fy)];
  if (px >= MARK_PX) return best;
  let nearest = (MARK_PX / px) ** 2;
  for (const mark of marks) {
    const gap = (mark.x + 0.5 - fx) ** 2 + (mark.y + 0.5 - fy) ** 2;
    if (gap < nearest && shown(mark)) { nearest = gap; best = [mark.x, mark.y]; }
  }
  return best;
}

// ---- Fingers: one drags the map, two pinch to zoom, a tap picks a tile.
const fingers = new Map();
let touch = null;   // { moved, sx, sy, spread, z } for the gesture in progress
const middle = () => { const all = [...fingers.values()]; return { x: all.reduce((a, f) => a + f.x, 0) / all.length, y: all.reduce((a, f) => a + f.y, 0) / all.length }; };
const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };

function listen(canvas, onPick) {
  fingers.clear(); touch = null;
  canvas.addEventListener('pointerdown', event => {
    try { canvas.setPointerCapture(event.pointerId); } catch { /* not a real finger */ }
    fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (fingers.size === 1) touch = { moved: false, sx: event.clientX, sy: event.clientY };
    else if (fingers.size === 2 && touch) Object.assign(touch, { moved: true, spread: spread(), z: session.ui.map.cam.z });
  });
  canvas.addEventListener('pointermove', event => {
    const finger = fingers.get(event.pointerId), cam = session.ui.map.cam;
    if (!finger || !touch) return;
    const before = middle();
    finger.x = event.clientX; finger.y = event.clientY;
    if (!touch.moved && Math.hypot(event.clientX - touch.sx, event.clientY - touch.sy) < 8) return;
    touch.moved = true;
    const after = middle();
    cam.x -= (after.x - before.x) / (cam.z * TILE); cam.y -= (after.y - before.y) / (cam.z * TILE);
    if (fingers.size === 2) zoomAt(canvas, touch.z * spread() / touch.spread, after.x, after.y);
    else redraw(canvas);
  });
  const lift = event => {
    if (!fingers.has(event.pointerId) || !touch) return;
    const at = middle();
    fingers.delete(event.pointerId);
    if (fingers.size) return;
    const tapped = !touch.moved && event.type === 'pointerup';
    touch = null;
    if (tapped) onPick(...tileAt(canvas, event.clientX, event.clientY));
    else zoomAt(canvas, nearestZoom(session.ui.map.cam.z), at.x, at.y);   // settle on a whole zoom level so the art stays crisp
  };
  canvas.addEventListener('pointerup', lift);
  canvas.addEventListener('pointercancel', lift);
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    const level = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(nearestZoom(session.ui.map.cam.z)) + (event.deltaY < 0 ? 1 : -1)))];
    zoomAt(canvas, level, event.clientX, event.clientY);
  }, { passive: false });
  // Stops iPhone Safari zooming the whole page when the map is pinched.
  for (const name of ['gesturestart', 'gesturechange']) canvas.addEventListener(name, event => event.preventDefault());
}

// ---- Mounting
let watcher = null;
let playing = 0;   // goes up each time a walk's playback starts, so an older one stops

function fit(canvas) {
  const rect = canvas.getBoundingClientRect();
  view.dpr = Math.min(3, window.devicePixelRatio || 1);
  view.w = canvas.width = Math.round(rect.width * view.dpr);
  view.h = canvas.height = Math.round(rect.height * view.dpr);
  draw(canvas);
}

// Plays back the walk in session.ui.map.walk: the camera follows the hero, then the page is redrawn once.
function playWalk() {
  const mine = ++playing;
  const frame = () => {
    const canvas = document.getElementById('map'), walk = session.ui.map.walk;
    if (mine !== playing || !walk) return;
    if (!canvas) { session.ui.map.walk = null; return; }   // the player left the tab
    if (performance.now() - walk.began >= walk.ms) { session.ui.map.walk = null; followHero(); refresh(); return; }
    followHero();
    draw(canvas);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Call after every redraw of the page that contains <canvas id="map">. onPick(x, y) is told which tile a tap chose.
export function mountMap(onPick) {
  const canvas = document.getElementById('map');
  if (!canvas) return;
  const { hero, ui } = session;
  if (!ui.map.cam) ui.map.cam = { x: hero.map.x + 0.5, y: hero.map.y + 0.5, z: START_ZOOM };
  findMarks();
  listen(canvas, onPick);
  if (watcher) watcher.disconnect();
  watcher = new ResizeObserver(() => fit(canvas));
  watcher.observe(canvas);
  fit(canvas);
  if (ui.map.walk) playWalk();
}
