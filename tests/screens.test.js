// Every screen must draw, without a browser, for any hero the game can produce.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

globalThis.PixelItems = createRequire(import.meta.url)('../js/lib/pixel-items.js');

const { CLASSES } = await import('../js/content/classes.js');
const { ITEMS } = await import('../js/content/items.js');
const { QUESTS } = await import('../js/content/quests.js');
const { fight, foesInView } = await import('../js/rules/adventure.js');
const { newHero } = await import('../js/rules/hero.js');
const { claimCache, completeQuest, setQuestAmount } = await import('../js/rules/quests.js');
const { routeTo, walkTo } = await import('../js/rules/travel.js');
const { dungeons } = await import('../js/rules/world.js');
const { amountText, coinText, progressText } = await import('../js/ui/format.js');
const { session, TABS } = await import('../js/ui/session.js');
const shell = await import('../js/ui/screens/shell.js');
const screens = {
  quests: await import('../js/ui/screens/quests.js'), hero: await import('../js/ui/screens/hero.js'),
  vendor: await import('../js/ui/screens/vendor.js'), adventure: await import('../js/ui/screens/adventure.js'),
};
const create = await import('../js/ui/screens/create.js');
const recover = await import('../js/ui/screens/recover.js');

const DAY = '2026-03-10';

function assertClean(html, where) {
  assert.ok(html.length > 200, `${where}: empty`);
  for (const bad of ['undefined', 'NaN', '[object', 'null']) assert.ok(!html.includes(bad), `${where}: contains "${bad}"`);
}

function drawAll(where) {
  for (const tab of TABS) {
    session.ui.tab = tab;
    assertClean(shell.render(screens[tab].render()), `${where} / ${tab}`);
  }
}

test('every tab draws for a new hero of each class', () => {
  for (const cls of Object.keys(CLASSES)) {
    session.hero = newHero('<b>Tess</b>', cls, DAY);
    drawAll(cls);
    assert.ok(!shell.render(screens.hero.render()).includes('<b>Tess</b>'), 'the hero name is escaped');
  }
});

test('every tab draws for a maxed hero who owns everything and has done everything', () => {
  const hero = newHero('Max', 'priest', DAY);
  hero.totalXp = 1e9;
  hero.copper = 987654321;
  hero.owned = Object.keys(ITEMS);
  hero.owned.push('retired-item');
  hero.equip = { weapon: 'starscepter', helm: 'watchcrown', chest: 'd8', trinket: 'retired-item' };
  for (const quest of QUESTS) {
    if (quest.kind === 'amount') setQuestAmount(hero, quest.id, 999999); else completeQuest(hero, quest.id);
  }
  session.hero = hero;
  drawAll('maxed, cache ready');
  claimCache(hero);
  session.ui.amountOpen = 'steps';
  session.ui.sellOpen = 'oakclub';
  session.ui.confirmDelete = true;
  session.ui.exportCode = 'IRONVOW1:abc';
  session.ui.pendingImport = newHero('Other', 'mage', DAY);
  drawAll('maxed, everything open');
  Object.assign(session.ui, { amountOpen: null, sellOpen: null, confirmDelete: false, exportCode: null, pendingImport: null });
});

test('the battle story draws line by line, win or lose, and hides the result until the end', () => {
  for (const roll of [0, 0.999]) {
    const hero = newHero('Fighter', 'warrior', DAY);
    session.hero = hero;
    session.ui.tab = 'adventure';
    Object.assign(hero.map, { x: dungeons()[0].x, y: dungeons()[0].y });
    const bar = shell.barNumbers(hero);
    const events = fight(hero, () => roll);
    // The same battle record the fight action builds, without its timers.
    session.ui.battle = { lines: [{ text: 'A line' }, { text: 'Loot!', tone: 'gold', drop: 'd1' }], shown: 1, over: false, bar, events };
    const during = shell.render(screens.adventure.render());
    assertClean(during, 'battle running');
    assert.ok(during.includes('0/100 XP'), 'the hero bar still shows the XP from before the battle');
    assert.ok(!during.includes('data-a="fight"'), 'no second fight while one is playing');
    session.ui.battle.shown = 2;
    session.ui.battle.over = true;
    const after = shell.render(screens.adventure.render());
    assertClean(after, 'battle over');
    assert.ok(after.includes(`${hero.totalXp}/100 XP`) && after.includes('Wolfhide Hood'));
    session.ui.battle = null;
  }
});

test('the adventure tab draws whatever the player is looking at on the map', () => {
  const hero = newHero('Scout', 'ranger', DAY);
  hero.totals.steps = 5000;
  session.hero = hero;
  session.ui.tab = 'adventure';
  const draw = (sel, where) => {
    Object.assign(session.ui.map, { sel, route: sel ? routeTo(hero, sel.x, sel.y) : null });
    const html = shell.render(screens.adventure.render());
    assertClean(html, where);
    return html;
  };
  assert.ok(draw(null, 'in town').includes('Hearthford') && draw(null, 'in town').includes('You are here.'));
  assert.ok(draw({ x: 0, y: 40 }, 'fog').includes('Unknown land'));
  assert.ok(draw({ x: 15, y: 3 }, 'a peak').includes('Cannot be crossed'));
  assert.ok(draw({ x: -20, y: 0 }, 'open land').includes('data-a="walk"'));
  const mob = foesInView(hero)[0];
  const looking = draw({ x: mob.x, y: mob.y }, 'a mob in view');
  assert.ok(looking.includes(mob.foe.mob.name) && looking.includes('data-a="walk"') && !looking.includes('data-a="fight"'));
  walkTo(hero, mob.x, mob.y);
  const standing = draw(null, 'standing on a mob');
  assert.ok(standing.includes(mob.foe.mob.name) && standing.includes('data-a="fight"') && standing.includes('Victory chance'));
  hero.energy = 0;
  assert.ok(draw(null, 'no energy').includes('No energy'));
  const z1 = dungeons()[0], z2 = dungeons()[1];
  assert.ok(draw(null, 'dungeon list').includes(`Rumour: about 400 steps east of Hearthford`));
  Object.assign(hero.map, { x: z2.x, y: z2.y });
  const locked = draw(null, 'a dungeon above the hero');
  assert.ok(locked.includes(z2.zone.name) && locked.includes('Reach level 3 to enter') && locked.includes('at night'));
  Object.assign(hero.map, { x: z1.x, y: z1.y });
  session.ui.map.full = true;
  assert.ok(draw(null, 'full screen').includes('map-full'));
  Object.assign(session.ui.map, { sel: null, route: null, full: false });
});

test('the create and recovery screens draw', () => {
  session.hero = null;
  assertClean(create.render(), 'create');
  session.brokenSave = { code: 'unreadable', raw: '{"name":"<script>' };
  const html = recover.render();
  assert.ok(html.includes('&lt;script&gt;') && !html.includes('<script>'), 'saved text is escaped');
  for (const code of ['newer', 'no-migration', 'unreadable']) { session.brokenSave.code = code; assert.ok(recover.render().length > 200); }
  session.brokenSave = null;
});

test('numbers are written in metric units and coins', () => {
  assert.equal(amountText('steps', 10000), '10,000 steps');
  assert.equal(amountText('ml', 2500), '2.5 L');
  assert.equal(progressText('ml', 750, 2000), '0.75 / 2.0 L');
  assert.equal(progressText('min', 5, 30), '5 / 30 min');
  assert.equal(coinText(12571), '1g 25s 71c');
  assert.equal(coinText(10000), '1g');
  assert.equal(coinText(0), '0c');
});
