// Game content must stay consistent: every reference points at something real, every item and zone can be drawn,
// and no id that has ever shipped disappears (saves store ids).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

globalThis.PixelItems = createRequire(import.meta.url)('../js/lib/pixel-items.js');

const { MAX_LEVEL } = await import('../js/content/balance.js');
const { CLASSES, STATS } = await import('../js/content/classes.js');
const { ITEMS, RARITIES, SLOTS } = await import('../js/content/items.js');
const { QUESTS } = await import('../js/content/quests.js');
const { ZONES } = await import('../js/content/zones.js');
const { ICON_NAMES, icon } = await import('../js/ui/art/icons.js');
const { ITEM_KINDS, itemSprite, RARITY } = await import('../js/ui/art/items.js');
const { SCENE_NAMES, sceneSvg } = await import('../js/ui/art/scenes.js');

// Every id that has been in a released version. Add new ids here when they ship; never remove one.
const SHIPPED = {
  classes: ['warrior', 'mage', 'ranger', 'priest'],
  slots: ['weapon', 'helm', 'chest', 'trinket'],
  quests: ['steps', 'exercise', 'meditate', 'water', 'vitamins', 'nojunk'],
  zones: ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7', 'z8'],
  items: ['w0w', 'w0m', 'w0r', 'w0p', 'oakclub', 'ashstaff', 'huntbow', 'sunmace', 'leathercap', 'jerkin', 'charm', 'ironsword', 'emberwand',
    'windbow', 'dawnmace', 'squirehelm', 'circlet', 'hauberk', 'robe', 'brigandine', 'compass', 'hourglass', 'dawnblade', 'starscepter',
    'galebow', 'mountainheart', 'watchcrown', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'],
};

const isStatMap = map => Object.keys(map).every(stat => STATS.includes(stat)) && Object.values(map).every(Number.isFinite);

test('no shipped id has been removed or renamed', () => {
  for (const id of SHIPPED.classes) assert.ok(CLASSES[id], `class ${id}`);
  for (const id of SHIPPED.slots) assert.ok(SLOTS[id], `slot ${id}`);
  for (const id of SHIPPED.items) assert.ok(ITEMS[id], `item ${id}`);
  for (const id of SHIPPED.quests) assert.ok(QUESTS.some(q => q.id === id), `quest ${id}`);
  for (const id of SHIPPED.zones) assert.ok(ZONES.some(z => z.id === id), `zone ${id}`);
});

test('every id in the game is on the shipped list (add new ones to SHIPPED in this file)', () => {
  assert.deepEqual(Object.keys(CLASSES).filter(id => !SHIPPED.classes.includes(id)), []);
  assert.deepEqual(Object.keys(SLOTS).filter(id => !SHIPPED.slots.includes(id)), []);
  assert.deepEqual(Object.keys(ITEMS).filter(id => !SHIPPED.items.includes(id)), []);
  assert.deepEqual(QUESTS.map(q => q.id).filter(id => !SHIPPED.quests.includes(id)), []);
  assert.deepEqual(ZONES.map(z => z.id).filter(id => !SHIPPED.zones.includes(id)), []);
});

test('classes are complete', () => {
  for (const [id, cls] of Object.entries(CLASSES)) {
    for (const part of ['base', 'growth', 'weights']) assert.deepEqual(Object.keys(cls[part]).sort(), [...STATS].sort(), `${id}.${part}`);
    assert.equal(ITEMS[cls.starter]?.slot, 'weapon', `${id} starter`);
    assert.equal(ITEMS[cls.starter].level, 1);
    assert.ok(ICON_NAMES.includes(cls.emblem), `${id} emblem`);
    assert.ok(cls.name && cls.blurb && cls.strike);
  }
});

test('items are complete and every one can be drawn', () => {
  for (const [id, item] of Object.entries(ITEMS)) {
    assert.ok(SLOTS[item.slot], `${id} slot`);
    assert.ok(RARITIES.includes(item.rarity), `${id} rarity`);
    assert.ok(Number.isInteger(item.level) && item.level >= 1 && item.level <= MAX_LEVEL, `${id} level`);
    assert.ok(Number.isInteger(item.price) && item.price > 0, `${id} price`);
    assert.ok(isStatMap(item.stats) && Object.keys(item.stats).length > 0, `${id} stats`);
    assert.ok(ITEM_KINDS.includes(item.look[0]) && Number.isInteger(item.look[1]), `${id} look`);
    assert.match(itemSprite(item, 64), /^<svg .*<\/svg>$/, `${id} sprite`);
  }
});

test('the rarity list matches the sprite generator, and every kind draws at every rarity', () => {
  assert.deepEqual(RARITY.map(r => r.name.toLowerCase()), RARITIES);
  for (const kind of ITEM_KINDS) for (const rarity of RARITIES) {
    const svg = itemSprite({ look: [kind, 7], rarity }, 64);
    assert.match(svg, /<path /, `${kind} ${rarity}`);
    assert.equal(svg.includes('px-spark'), rarity === 'legendary', `${kind} ${rarity}: only legendary sparkles`);
  }
});

test('zones are complete, in level order, and every scene can be drawn', () => {
  assert.equal(new Set(ZONES.map(z => z.id)).size, ZONES.length);
  ZONES.forEach((zone, i) => {
    assert.ok(i === 0 || zone.level > ZONES[i - 1].level, `${zone.id} level order`);
    assert.ok(zone.power > 0 && zone.xp > 0 && zone.copper[0] <= zone.copper[1], `${zone.id} numbers`);
    assert.ok(ITEMS[zone.drop] && !ITEMS[zone.drop].sold, `${zone.id} drop`);
    assert.ok(SCENE_NAMES.includes(zone.scene), `${zone.id} scene`);
    for (const mode of ['open', 'locked', 'strip']) assert.match(sceneSvg(zone.scene, mode), /^<svg .*<\/svg>$/);
  });
  assert.equal(ZONES[0].level, 1, 'a new hero needs somewhere to go');
});

test('quests are complete', () => {
  assert.equal(new Set(QUESTS.map(q => q.id)).size, QUESTS.length);
  for (const quest of QUESTS) {
    assert.ok(STATS.includes(quest.stat), `${quest.id} stat`);
    assert.ok(ICON_NAMES.includes(quest.icon), `${quest.id} icon`);
    assert.ok(quest.xp > 0 && quest.copper > 0 && quest.name && quest.text);
    if (quest.kind === 'amount') {
      assert.ok(['steps', 'min', 'ml'].includes(quest.unit), `${quest.id} unit`);
      assert.ok(quest.chips.length > 0 && quest.goal.default >= quest.goal.min && quest.goal.label && quest.total, `${quest.id} goal`);
      assert.ok(quest.text.includes('{goal}'), `${quest.id} text shows the goal`);
    } else {
      assert.equal(quest.kind, 'check');
      assert.ok(quest.doLabel && quest.undoLabel, `${quest.id} labels`);
    }
  }
});

test('every icon draws', () => {
  for (const name of ICON_NAMES) assert.match(icon(name, 2), /<path /, name);
  assert.throws(() => icon('nope', 2));
});
