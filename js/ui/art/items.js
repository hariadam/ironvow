// Item sprites: 32×32, shown at 64px in lists. An item's `look` is [kind, seed]; with its rarity that is
// everything needed to redraw it.
//
// Swords, axes, staves, helms and chest pieces come from js/lib/pixel-items.js (the design handoff's
// generator, kept exactly as delivered). Bows, maces, clubs and trinkets are not in it yet, so the
// stand-ins below draw them by the same rules: weapons lie corner to corner, armour is front-on, outlines
// are a dark tint of the material, and rarity adds ornament. Replace them when the generator learns the shapes.
//
// Rarity owns what is around the sprite (frame, backdrop, aura, sparkles, name colour): PixelItems.RARITY.
// It never owns the colours inside the sprite.

import { RARITIES } from '../../content/items.js';

const PixelItems = globalThis.PixelItems;

export const RARITY = PixelItems.RARITY;

const N = 32;            // sprite size
const SLOTS = 22;        // colour slots PixelItems.toSVG reads (d0…d21 / f0…f21)
const WHITE = '#FFFFFF';
const PLUM = '#2A1428';  // outline for wood, leather and bone

// One material per rarity, from the handoff's ladder: [highlight, light, mid, dark, outline].
const METALS = [
  ['#D9D4E8', '#A39DBF', '#6E6790', '#453F66', '#1E1A38'],
  ['#F4F6FF', '#B9C4E8', '#7C86B8', '#4A4F86', '#1A1C40'],
  ['#E6FAFF', '#8ED6F5', '#4A8FD0', '#2F5296', '#101E4A'],
  ['#F6DCFF', '#C88AF0', '#8048C8', '#48247E', '#1E0C40'],
  ['#FFFBD8', '#FFD860', '#F09A30', '#B0502C', '#3A1420'],
];
const TRIMS = [null, ['#FFE0A0', '#E0A050', '#A8643C'], ['#F4F6FF', '#B9C4E8', '#7C86B8'], ['#FFB0E0', '#F060B8', '#A03090'], ['#FFFFFF', '#FFF0A0', '#FFC040']];
const WOODS = [['#E8B080', '#B87850', '#804848', '#522E40'], ['#C8B8D8', '#9080A8', '#5E5080', '#3A3058']];
const GRIPS = [['#E0705A', '#A04050'], ['#4FE0C2', '#2F8A8A'], ['#8A70C8', '#54408A'], ['#F0C060', '#B07840']];
const GEMS = [['#FF6A8A', '#B0305A'], ['#5AF0D0', '#208A88'], ['#6AD0FF', '#2A6AC0'], ['#FFD860', '#D08020'], ['#E08AFF', '#8838C0']];
const BONE = ['#FFF6D8', '#E8D8A8', '#B09868'];
const CORD = ['#C08458', '#8A5048'];
const GLASS = ['#D4DCF8', '#3B3470'];

// Small seeded random generator (mulberry32), so a seed always gives the same sprite.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Stand-in shapes. Each gets a `pen`: set(x, y, colour, outline), diag(fn) for corner-to-corner
// weapons (fn receives `a` along the weapon from the bottom-left and `p` across it, negative = upper left),
// and the materials chosen for this rarity and seed.

function drawBow({ diag, rar, metal, trim, wood, grip, gem, mo }) {
  const half = 17 + rar;                       // half the bow's length
  const depth = 9 + Math.min(rar, 3);          // how far the belly bows out
  const limb = rar >= 2 ? metal : wood;
  const edge = rar >= 2 ? mo : PLUM;
  diag((a, p) => {
    const t = (a - 25) / half;
    if (Math.abs(t) > 1) return null;
    const off = p - Math.round(5 - depth * (1 - t * t));   // distance from the limb's centre line
    const far = Math.abs(off);
    if (rar >= 2 && Math.abs(a - 25) <= 1 && off >= -4 && off <= -3) return [off === -4 ? WHITE : gem[0], mo];
    if (Math.abs(a - 25) <= 3 && far <= 2) return [a % 2 === 0 ? grip[0] : grip[1], PLUM];
    if (rar >= 3 && Math.abs(Math.abs(t) - 0.55) < 0.09 && off < -1 && off >= -4) return [metal[0], mo];
    if (rar >= 1 && far <= 1 + Math.abs(t) && (Math.abs(t) > 0.84 || Math.abs(Math.abs(t) - 0.42) < 0.06)) return [off < 0 ? trim[0] : trim[2], mo];
    if (far <= 1 + Math.abs(t)) return [off < 0 ? limb[1] : (off === 0 ? limb[2] : limb[3]), edge];
    if (p >= 5 && p <= 6) return ['#F4EFD8', PLUM];
    return null;
  });
}

function drawMace({ diag, rar, metal, trim, wood, grip, gem, mo, club }) {
  const head = 37;                              // centre of the head along the weapon
  const radius = club ? 0 : 5 + Math.min(rar, 2) * 0.5;
  const woodC = p => (p < 0 ? wood[1] : (p === 0 ? wood[2] : wood[3]));
  diag((a, p) => {
    const ap = Math.abs(p);
    const da = a - head;
    const ad = Math.abs(da);
    const d2 = da * da + p * p;
    if (club) {
      if (da * da / 72 + p * p / 18 <= 1) {
        if (rar >= 1 && ad % 5 === 0) return [p < 0 ? metal[1] : metal[3], mo];
        if (ap === 2 && ad % 4 === 0) return [metal[1], mo];
        return [p < -2 ? wood[0] : (p < 0 ? wood[1] : (p < 3 ? wood[2] : wood[3])), PLUM];
      }
    } else {
      if (rar >= 2 && d2 <= 4) return [da === 1 && p === -1 ? WHITE : (p <= 0 ? gem[0] : gem[1]), mo];
      if (rar >= 1 && ((ad <= 1 && ap <= radius + 3) || (ap <= 1 && ad <= radius + 3))) return [p < 0 || da > 0 ? metal[0] : metal[2], mo];
      if (rar >= 3 && Math.abs(ad - ap) <= 1 && d2 <= (radius + 3) * (radius + 3)) return [p < 0 ? metal[0] : metal[2], mo];
      if (d2 <= radius * radius + 1) {
        if (p < -2) return [rar >= 1 ? metal[0] : metal[1], mo];
        if (p < 0) return [metal[1], mo];
        return [p < 3 ? ((a + p) % 4 === 0 ? metal[1] : metal[2]) : metal[3], mo];
      }
      if (rar >= 1 && da < 0 && ad <= radius + 3 && ad > radius && ap <= 2) return [p < 0 ? trim[0] : (p === 0 ? trim[1] : trim[2]), mo];
    }
    const pd = (a - 3) * (a - 3) + p * p;
    if (pd <= 5) return rar >= 1 ? [p < 0 ? trim[0] : (p === 0 ? trim[1] : trim[2]), mo] : [woodC(p), PLUM];
    if (a >= 4 && a <= head && ap <= 1) return a >= 7 && a <= 13 ? [a % 2 === 0 ? grip[0] : grip[1], PLUM] : [woodC(p), PLUM];
    return null;
  });
}

// Every trinket hangs from the same loop of cord (common) or chain (uncommon and up).
function drawLoop({ set, rar, metal, mo }) {
  for (let y = 3; y <= 13; y++) for (let x = 8; x <= 23; x++) {
    const e = Math.pow((x - 15.5) / 6.5, 2) + Math.pow((y - 9.5) / 6, 2);
    if (e < 0.7 || e > 1.2) continue;
    if (rar === 0) set(x, y, x < 16 ? CORD[0] : CORD[1], PLUM);
    else set(x, y, (x + y) % 2 === 0 ? metal[1] : metal[3], mo);
  }
}

function drawCoin(pen) {
  const { set, rar, metal, trim, gem, mo } = pen;
  drawLoop(pen);
  for (let y = 14; y <= 28; y++) for (let x = 8; x <= 23; x++) {
    const dx = x - 15.5;
    const dy = y - 21;
    const d2 = dx * dx + dy * dy;
    if (d2 > 44) continue;
    if (d2 > 28) set(x, y, dx + dy < 0 ? (rar >= 1 ? metal[0] : metal[1]) : metal[3], mo);
    else if (rar >= 1 && Math.abs(dx) + Math.abs(dy) <= 2.5) set(x, y, dx < 0 && dy < 0 ? WHITE : (dx + dy < 0 ? gem[0] : gem[1]), mo);
    else if (rar >= 2 && (Math.abs(dx) < 1 || Math.abs(dy) < 1)) set(x, y, dx + dy < 0 ? trim[0] : trim[2], mo);
    else set(x, y, dx + dy < -3 ? metal[1] : ((x + y) % 2 === 0 ? metal[1] : metal[2]), mo);
  }
  if (rar >= 3) for (const [x, y] of [[9, 15], [22, 15], [9, 27], [22, 27]]) set(x, y, trim[0], mo);
}

function drawGem(pen) {
  const { set, rar, metal, trim, gem, mo } = pen;
  drawLoop(pen);
  for (let y = 13; y <= 28; y++) for (let x = 8; x <= 23; x++) {
    const dx = x - 15.5;
    const dy = y - 20.5;
    const e = Math.abs(dx) / 6.5 + Math.abs(dy) / 7.5;
    if (e > 1) continue;
    if (e > 0.72) set(x, y, dx < 0 ? (rar >= 1 ? metal[0] : metal[1]) : metal[3], mo);
    else if (dy < 0 && dx < 0) set(x, y, e < 0.3 ? WHITE : gem[0], mo);
    else set(x, y, dx < 0 || dy < 0 ? ((x + y) % 2 === 0 ? gem[0] : gem[1]) : gem[1], mo);
  }
  if (rar >= 2) for (const [x, y] of [[8, 20], [8, 21], [23, 20], [23, 21]]) set(x, y, x < 16 ? trim[0] : trim[2], mo);
  if (rar >= 3) for (const [x, y] of [[7, 19], [6, 18], [6, 17], [7, 22], [6, 23], [6, 24]]) { set(x, y, trim[0], mo); set(31 - x, y, trim[2], mo); }
}

function drawFang(pen) {
  const { set, rar, metal, trim, gem, mo } = pen;
  drawLoop(pen);
  for (let y = 16; y <= 28; y++) {
    const t = (y - 16) / 12;
    const half = 4.2 * Math.pow(1 - t, 0.7);
    const cx = 14 + 5 * t * t;
    for (let x = 8; x <= 23; x++) {
      const dx = x - cx;
      if (Math.abs(dx) > half) continue;
      set(x, y, dx < -half * 0.3 ? BONE[0] : (dx < half * 0.45 ? BONE[1] : BONE[2]), PLUM);
    }
  }
  for (let y = 13; y <= 15; y++) for (let x = 10; x <= 19; x++) set(x, y, y === 13 ? metal[1] : (x < 15 ? (rar >= 1 ? metal[0] : metal[1]) : metal[3]), mo);
  if (rar >= 1) for (let x = 10; x <= 19; x++) set(x, 15, x < 15 ? trim[0] : trim[2], mo);
  if (rar >= 3) { set(14, 13, WHITE, mo); set(15, 13, gem[0], mo); set(14, 14, gem[0], mo); set(15, 14, gem[1], mo); }
}

function drawHourglass(pen) {
  const { set, rar, metal, trim, gem, mo } = pen;
  drawLoop(pen);
  for (let y = 15; y <= 26; y++) {
    const half = 1 + Math.abs(y - 20.5) * 0.8;
    for (let x = 9; x <= 22; x++) {
      const dx = Math.abs(x - 15.5);
      if (dx > half) continue;
      const sand = y >= 24 || (y >= 17 && y <= 19 && dx < half - 1) || (dx < 1 && y >= 20);
      set(x, y, dx > half - 1 ? GLASS[0] : (sand ? (x < 16 ? gem[0] : gem[1]) : GLASS[1]), mo);
    }
  }
  for (const y of [13, 14, 27, 28]) for (let x = 9; x <= 22; x++) set(x, y, y === 13 || y === 27 ? (rar >= 1 ? metal[0] : metal[1]) : metal[3], mo);
  if (rar >= 1) for (let y = 15; y <= 26; y++) { set(9, y, trim[0], mo); set(22, y, trim[2], mo); }
  if (rar >= 3) { set(15, 13, gem[0], mo); set(16, 13, gem[1], mo); set(15, 28, gem[0], mo); set(16, 28, gem[1], mo); }
}

const STAND_INS = {
  bow: drawBow,
  mace: drawMace,
  club: pen => drawMace({ ...pen, club: true }),
  coin: drawCoin,
  gem: drawGem,
  fang: drawFang,
  hourglass: drawHourglass,
};

// Draws a stand-in and returns it in the shape PixelItems.toSVG expects, so both kinds of sprite get the
// same rarity treatment from one place.
function buildStandIn(kind, rar, seed) {
  const random = seeded(seed * 7919 + rar * 104729 + 13);
  const pick = list => list[Math.floor(random() * list.length)];
  const col = new Array(N * N).fill(null);   // pixel colours
  const olc = new Array(N * N).fill(null);   // the outline colour each pixel asks for
  const set = (x, y, color, outline) => { if (x >= 3 && x <= 28 && y >= 3 && y <= 28) { col[y * N + x] = color; olc[y * N + x] = outline; } };
  const diag = fn => {
    for (let y = 3; y <= 28; y++) for (let x = 3; x <= 28; x++) {
      const hit = fn(x - y + 25, x + y - 31);
      if (hit) set(x, y, hit[0], hit[1]);
    }
  };
  const metal = METALS[rar];
  STAND_INS[kind]({ set, diag, rar, metal, mo: metal[4], trim: TRIMS[rar] || [metal[1], metal[2], metal[3]], wood: pick(WOODS), grip: pick(GRIPS), gem: pick(GEMS) });

  // Outline: every empty pixel touching the sprite takes that neighbour's outline colour.
  const fin = col.slice();
  const at = (x, y) => (x >= 0 && x < N && y >= 0 && y < N ? col[y * N + x] : null);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (col[i] !== null) continue;
    if (at(x + 1, y) !== null) fin[i] = olc[i + 1];
    else if (at(x, y + 1) !== null) fin[i] = olc[i + N];
    else if (at(x - 1, y) !== null) fin[i] = olc[i - 1];
    else if (at(x, y - 1) !== null) fin[i] = olc[i - N];
  }
  // Two rings of empty pixels around the outlined sprite: the aura, drawn for rarities that have one.
  const ringAround = inside => {
    const ring = new Set();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (fin[i] !== null || inside(i)) continue;
      if ((x > 0 && inside(i - 1)) || (x < N - 1 && inside(i + 1)) || (y > 0 && inside(i - N)) || (y < N - 1 && inside(i + N))) ring.add(i);
    }
    return ring;
  };
  const inner = ringAround(i => fin[i] !== null);
  const outer = ringAround(i => inner.has(i));
  const runs = test => {
    let d = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N;) {
      if (!test(y * N + x)) { x++; continue; }
      let w = 1;
      while (x + w < N && test(y * N + x + w)) w++;
      d += `M${x} ${y}h${w}v1h-${w}z`;
      x += w;
    }
    return d;
  };
  const colors = [...new Set(fin.filter(c => c !== null))];
  if (colors.length > SLOTS) throw new Error(`Item sprite "${kind}" uses ${colors.length} colours; the limit is ${SLOTS}.`);
  const sprite = { rarityIndex: rar, g1: runs(i => inner.has(i)), g2: runs(i => outer.has(i)), sa: '', sb: '' };
  for (let s = 0; s < SLOTS; s++) {
    sprite['d' + s] = s < colors.length ? runs(i => fin[i] === colors[s]) : '';
    sprite['f' + s] = s < colors.length ? colors[s] : 'none';
  }
  // Sparkles (legendary only): three twinkling pixels on the outer ring, in two groups so they alternate.
  const spots = [...outer].filter(i => i % N >= 2 && i % N <= 29 && i >= 2 * N && i < 30 * N);
  for (let n = 0; n < 3 && spots.length > 0; n++) {
    const i = spots[Math.floor(random() * spots.length)];
    const d = `M${i % N} ${Math.floor(i / N)}h1v1h-1z`;
    if (n < 2) sprite.sa += d; else sprite.sb += d;
  }
  return sprite;
}

// Every kind an item's `look` may name.
export const ITEM_KINDS = [...PixelItems.TYPES, ...Object.keys(STAND_INS)];

const built = new Map();

// The sprite for an item from js/content/items.js, as an SVG string. `size` is in CSS px: 64 in lists.
export function itemSprite(item, size) {
  const [kind, seed] = item.look;
  const rar = RARITIES.indexOf(item.rarity);
  const key = `${kind}:${rar}:${seed}`;
  if (!built.has(key)) {
    const type = PixelItems.TYPES.indexOf(kind);
    built.set(key, type >= 0 ? PixelItems.randomItem(type, rar, seed) : buildStandIn(kind, rar, seed));
  }
  return PixelItems.toSVG(built.get(key), size, rar);
}
