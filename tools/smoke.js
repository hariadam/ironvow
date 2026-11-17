// Plays the real game in headless Chromium at iPhone size, fails on any error, and saves screenshots.
//
//   node tools/smoke.js [folder for screenshots]      (default: ./screenshots, which git ignores)
//
// Run it after every change, then look at the screenshots before pushing. It needs Playwright, which
// Claude's cloud sessions have built in; it is a development tool and is not part of the published game.

import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = resolve(process.argv[2] || join(ROOT, 'screenshots'));
const SAVE_KEY = 'ironvow-save-v1';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

// A hero far into the game, in the shape version 1 saved it: lots of gear, most quests done, one short of the cache.
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const done = (xp, c) => ({ val: 0, done: true, rw: { xp, c, en: 0, prev: { n: 0, last: null } } });
const VETERAN = {
  v: 1, name: 'Brannoch', cls: 'warrior', created: '2026-06-01', totalXp: 62000, copper: 2345678, energy: 9,
  train: { str: 60, agi: 44, int: 20, spi: 31, sta: 80 },
  owned: ['w0w', 'oakclub', 'ironsword', 'dawnblade', 'squirehelm', 'watchcrown', 'hauberk', 'd6', 'd8', 'charm', 'compass', 'mountainheart', 'd1', 'd3', 'd4', 'd7', 'galebow', 'dawnmace', 'hourglass'],
  equip: { weapon: 'dawnblade', helm: 'watchcrown', chest: 'd8', trinket: 'mountainheart' },
  goals: { steps: 12000, exercise: 45, meditate: 10, water: 2500 },
  day: today,
  progress: {
    steps: { ...done(90, 5300), val: 12400 }, exercise: { ...done(105, 6000), val: 50 }, meditate: { ...done(50, 3000), val: 10 },
    water: { val: 1750, done: false, rw: null }, vitamins: done(30, 2000), nojunk: done(60, 3000),
  },
  chest: null, streaks: { steps: { n: 9, last: today }, exercise: { n: 6, last: today } },
  history: {}, totals: { steps: 1500000, exercise: 5200, meditate: 900, water: 260000 }, wins: 212, updatedAt: 0,
};

const problems = [];
const check = (ok, what) => { if (!ok) problems.push(what); };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  try {
    const body = await readFile(join(ROOT, path.endsWith('/') ? `${path}index.html` : path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'text/html' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(ready => server.listen(0, '127.0.0.1', ready));
const url = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

// Opens the game in a fresh browser profile. `save` (text) is put in storage before the game loads.
async function open(name, { width = 390, save = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  if (save !== null) await context.addInitScript(([key, value]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, [SAVE_KEY, save]);
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') problems.push(`${name}: console error: ${msg.text()}`); });
  page.on('pageerror', err => problems.push(`${name}: ${err.stack || err.message}`));
  await page.goto(url);
  await page.waitForFunction(() => window.ironvowStarted === true, null, { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  const shot = (label, fullPage = true) => page.screenshot({ path: join(OUT, `${name}-${label}.png`), fullPage });
  const tab = async id => { await page.click(`[data-a="tab"][data-v="${id}"]`); };
  // Nothing may be wider than the phone: sideways scrolling is always a bug.
  const fits = async label => check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${name}: ${label} is wider than the screen`);
  return { page, shot, tab, fits, close: () => context.close() };
}

// ---- The world map. It is a canvas, so the test asks the game's own rules where things are, then taps there.

// Where a tile is on screen, at the map's starting zoom with the hero in the middle.
async function tileOnScreen(page, x, y) {
  const box = await page.locator('#map').boundingBox();
  const hero = await page.evaluate(async () => (await import('./js/ui/session.js')).session.hero.map);
  return [box.x + box.width / 2 + (x - hero.x) * 8, box.y + box.height / 2 + (y - hero.y) * 8];
}

// Taps a tile, taps Walk, and waits for the walk to be played back.
async function walkOnMap(page, x, y) {
  await page.mouse.click(...await tileOnScreen(page, x, y));
  await page.click('[data-a="walk"]');
  await page.evaluate(async () => {
    const { session } = await import('./js/ui/session.js');
    while (session.ui.map.walk) await new Promise(next => requestAnimationFrame(next));
  });
}

// The nearest wild mob the hero can walk to, or the walkable tile furthest from them if no mob is in view.
const nearestMob = page => page.evaluate(async () => {
  const { session } = await import('./js/ui/session.js');
  const { foesInView } = await import('./js/rules/adventure.js');
  const { inView, routeTo } = await import('./js/rules/travel.js');
  const hero = session.hero;
  // Tiles under the map's buttons (its top right corner) cannot be tapped without dragging the map first, so they are left out.
  const hidden = (x, y) => x - hero.map.x > 11 && y - hero.map.y < 8;
  const steps = (x, y) => (hidden(x, y) ? Infinity : routeTo(hero, x, y).steps || Infinity);
  const mobs = foesInView(hero).map(({ x, y, foe }) => ({ x, y, name: foe.mob.name, steps: steps(x, y) })).filter(mob => mob.steps < Infinity);
  if (mobs.length) return mobs.sort((a, b) => a.steps - b.steps)[0];
  let far = null;
  for (let y = hero.map.y - 20; y <= hero.map.y + 20; y++) for (let x = hero.map.x - 20; x <= hero.map.x + 20; x++) {
    if (inView(hero, x, y) && steps(x, y) < Infinity && (!far || steps(x, y) > far.steps)) far = { x, y, steps: steps(x, y) };
  }
  return far;
});

// 1. A brand new player: create a hero, do quests, visit every tab, walk to a mob and fight it.
{
  const { page, shot, tab, fits, close } = await open('new');
  await shot('1-create');
  await page.click('[data-a="begin"]');
  check(await page.locator('#heroName').count() === 1, 'new: an empty name must not create a hero');
  await page.fill('#heroName', 'Adam');
  await page.click('[data-a="pickClass"][data-v="ranger"]');
  check(await page.inputValue('#heroName') === 'Adam', 'new: picking a class must keep the typed name');
  await page.click('[data-a="begin"]');
  await page.click('[data-a="addAmount"][data-v="steps"]');
  await page.click('[data-a="checkQuest"][data-v="vitamins"]');
  await page.click('[data-a="openAmount"][data-v="water"]');
  await page.fill('#amountInput', '2000');
  await page.press('#amountInput', 'Enter');
  await shot('2-quests-toasts', false);
  await page.waitForTimeout(3000);
  await fits('quests'); await shot('2-quests');
  for (const id of ['hero', 'vendor', 'adventure']) { await tab(id); await fits(id); await shot(`3-${id}`); }
  // Walk to a wild mob (moving on first on a day when none is near town) and fight it.
  let mob = await nearestMob(page);
  for (let tries = 0; !mob.name && tries < 4; tries++) { await walkOnMap(page, mob.x, mob.y); mob = await nearestMob(page); }
  check(Boolean(mob.name), 'new: no wild mob could be found to fight');
  await page.mouse.click(...await tileOnScreen(page, mob.x, mob.y));
  check((await page.locator('.place h2').innerText()).toUpperCase() === mob.name.toUpperCase(), 'new: tapping a mob on the map did not show its card');
  await shot('4-mob-picked', false);
  await page.click('[data-a="walk"]');
  await page.waitForSelector('[data-a="fight"]');
  await fits('adventure after walking'); await shot('5-at-the-mob', false);
  await page.click('[data-a="fight"]');
  await page.waitForSelector('[data-a="closeBattle"]');
  await shot('6-battle', false);
  await page.click('[data-a="closeBattle"]');
  // Full screen, zoomed out, dragged.
  await page.click('[data-a="mapFull"]');
  await page.click('[data-a="mapZoom"][data-v="-1"]');
  await page.mouse.move(120, 500); await page.mouse.down(); await page.mouse.move(180, 440, { steps: 4 }); await page.mouse.up();
  await fits('full screen map'); await shot('7-full-screen', false);
  await page.click('[data-a="mapFull"]');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  check(saved && saved.name === 'Adam' && saved.cls === 'ranger' && saved.energy === 4, 'new: the save does not match what was played');
  check(saved.map.x === mob.x && saved.map.y === mob.y && saved.map.walked > 0 && saved.map.trail.length > 0, 'new: the walk was not saved');
  await page.reload();
  await page.waitForFunction(() => window.ironvowStarted === true);
  check(await page.locator('.hero-name').innerText() === 'ADAM', 'new: the hero did not come back after a reload');
  await close();
}

// 2. A long-running version 1 save: every rarity of gear, the cache, selling, a narrow and a wide phone.
for (const width of [375, 390, 430]) {
  const { page, shot, tab, fits, close } = await open(`veteran-${width}`, { width, save: JSON.stringify(VETERAN) });
  check(await page.locator('.hero-name').innerText() === 'BRANNOCH', 'veteran: version 1 save did not load');
  await page.click('[data-a="addAmount"][data-v="water"][data-n="500"]');
  await page.click('[data-a="addAmount"][data-v="water"][data-n="250"]');
  await page.click('[data-a="claimCache"]');
  await page.waitForTimeout(3200);
  await fits('quests'); await shot('1-quests');
  await tab('hero');
  await page.click('[data-a="askSell"][data-v="oakclub"]');
  await page.click('[data-a="sell"][data-v="oakclub"]');
  await page.click('[data-a="copyCode"]');
  await page.waitForTimeout(3000);
  await fits('hero'); await shot('2-hero');
  await tab('vendor'); await page.click('[data-a="buy"]'); await page.waitForTimeout(3000); await fits('vendor'); await shot('3-vendor');
  await tab('adventure'); await fits('adventure'); await shot('4-adventure');
  if (width === 390) {
    // A veteran has steps to spare: walk a long way, then look at the trail from far above.
    for (let hop = 0; hop < 6; hop++) { const far = await nearestMob(page); await walkOnMap(page, far.x, far.y); }
    await shot('5-walked', false);
    await page.click('[data-a="mapFull"]');
    for (let i = 0; i < 3; i++) await page.click('[data-a="mapZoom"][data-v="-1"]');
    await shot('6-zoomed-out', false);
  }
  await close();
}

// 3. A damaged save: the recovery screen shows, and nothing is overwritten until the player says so.
{
  const damaged = '{"v":1,"name":"Lost","cls":"mage","totalXp":9000,"copp';
  const { page, shot, fits, close } = await open('recover', { save: damaged });
  check((await page.locator('h1').innerText()).toUpperCase() === 'SAVE TROUBLE', 'recover: the recovery screen did not show');
  check(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY) === damaged, 'recover: the damaged save was changed');
  await fits('recovery'); await shot('1-screen');
  await page.click('[data-a="abandonBrokenSave"]');
  await page.fill('#heroName', 'Second');
  await page.click('[data-a="begin"]');
  check(await page.evaluate(() => localStorage.getItem('ironvow-save-prev')) === damaged, 'recover: the damaged save was not kept as a backup');
  await close();
}

await browser.close();
server.close();
if (problems.length) { console.error(`${problems.length} problem(s):\n- ${problems.join('\n- ')}`); process.exit(1); }
console.log(`Smoke test passed. Screenshots are in ${OUT}`);
