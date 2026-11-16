// Zone scenes: 120×22 pixel paintings, shown at 4 CSS px per pixel (480×88) and cropped to the card's
// width from the centre, so a pixel is the same size on every phone. Keep the subject between columns 20
// and 100: the edges are cut off on narrow screens.
//
// A scene is a banded sky plus a draw(c) function that paints everything in front of it.
// Locked zones reuse the same painting in a night palette, made by nightColor() below.

import { createCanvas, gridPaths } from './pixel.js';

const W = 120;
const H = 22;
const SCALE = 4;
const STRIP = { from: 4, rows: 14 };   // the slice of a scene shown for far-off zones

const hexToRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const NIGHT_STOPS = ['#25233D', '#3E3C5C', '#6A6788', '#B8B5D0', '#E2DFD0'].map(hexToRgb);
const NIGHT_SKY = [['#17152B', 0], ['#1F1D36', 6]];

// Any colour, as it looks in a locked zone: brightness kept, hue drained to cold slate.
function nightColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  const light = Math.round((0.299 * r + 0.587 * g + 0.114 * b) / 255 * 14) / 14 * (NIGHT_STOPS.length - 1);
  const low = Math.min(NIGHT_STOPS.length - 2, Math.floor(light));
  const mix = light - low;
  return '#' + NIGHT_STOPS[low].map((v, i) => Math.round(v + (NIGHT_STOPS[low + 1][i] - v) * mix).toString(16).padStart(2, '0')).join('');
}

// ---- Drawing helpers

// Sky bands as [[colour, first row], ...]. Each band starts with one dithered row of the band above it.
function skyPaths(bands) {
  return gridPaths(W, H, (x, y) => {
    let band = 0;
    while (band + 1 < bands.length && y >= bands[band + 1][1]) band++;
    return band > 0 && y === bands[band][1] && x % 2 === 0 ? bands[band - 1][0] : bands[band][0];
  });
}

const dots = (c, color, points) => points.forEach(([x, y]) => c.set(x, y, color));

// Height of a skyline at each column, from [x, y] points joined by straight lines.
function heights(points) {
  const out = [];
  for (let x = 0; x < W; x++) {
    let i = 0;
    while (i + 2 < points.length && x >= points[i + 1][0]) i++;
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    out.push(Math.round(y0 + (y1 - y0) * Math.max(0, Math.min(1, (x - x0) / (x1 - x0)))));
  }
  return out;
}

// Land: fills from the skyline down to the bottom. `cap` colours the top pixel of each column.
function ridge(c, points, fill, cap) {
  heights(points).forEach((y, x) => {
    c.rect(x, y, 1, H - y, fill);
    if (cap) c.set(x, y, cap);
  });
}

// Cave roof: fills from the top down to the line.
function roof(c, points, fill) {
  heights(points).forEach((y, x) => c.rect(x, 0, 1, y, fill));
}

// A disc (sun or moon) centred on x, y.
function disc(c, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 1) c.set(cx + x, cy + y, color);
}

const STARS = [[6, 1], [15, 2], [24, 0], [33, 3], [41, 1], [50, 2], [58, 0], [67, 2], [75, 1], [84, 3], [92, 0], [101, 2], [109, 1], [116, 3], [46, 5], [88, 6], [20, 5]];

const PINE = { rows: ['...D...', '..DDH..', '.DDDDH.', '..DDD..', '.DDDDH.', 'DDDDDDH', '.DDDDD.', 'DDDDDDH', '...D...', '...D...'] };
const pine = (c, x, y, dark, light) => c.stamp(x, y, PINE.rows, { D: dark, H: light });

const DEAD_TREE = ['..#...#', '#.#..#.', '.##.#..', '..###..', '...#...', '...#.#.', '...##..', '...#...', '...#...', '...#...', '...#...'];

// ---- Scenes

const SCENES = {
  wolfpine: {
    label: 'a white wolf howling on a rock at dusk, with pines, mountains and a setting sun',
    sky: [['#2B1E5C', 0], ['#5B2A7A', 4], ['#A23E7C', 8], ['#E0605E', 11], ['#FF9A5C', 14]],
    draw(c) {
      dots(c, '#F4EFD8', STARS);
      c.rect(38, 10, 4, 1, '#FFD86B'); c.rect(36, 11, 8, 1, '#FFD86B'); c.rect(35, 12, 10, 1, '#FFD86B'); c.rect(34, 13, 12, 3, '#FFD86B');
      c.rect(37, 12, 6, 4, '#FFF2B8');
      ridge(c, [[0, 14], [8, 11], [14, 12], [22, 10], [30, 13], [34, 14], [48, 14], [56, 10], [62, 7], [70, 11], [78, 14], [84, 13], [92, 9], [100, 11], [110, 13], [119, 10]], '#4A2F7A');
      dots(c, '#8E6BC0', [[61, 8], [62, 7], [63, 8], [22, 10], [23, 10], [91, 10], [92, 9], [93, 10]]);
      ridge(c, [[0, 15], [16, 17], [30, 15], [40, 15], [58, 18], [66, 18], [84, 15], [92, 15], [104, 17], [119, 16]], '#1E4D4F', '#2F7A6E');
      for (const [x, y] of [[4, 7], [17, 8], [24, 6], [51, 8], [82, 5], [89, 7], [96, 8], [108, 7]]) pine(c, x, y, '#0B2228', '#2F7A6E');
      c.rect(66, 14, 10, 1, '#0B2228'); c.rect(65, 15, 12, 3, '#0B2228');
      c.stamp(67, 5, ['W........', 'WW.W.....', '.WWW.....', '..WWW....', '..WWWW...', '..WWWSS..', '..WWWSS.W', '..W.WWSSS', '.WW.WWW..'], { W: '#F4F1FA', S: '#B3ADD0' });
      ridge(c, [[0, 20], [14, 20], [28, 19], [42, 19], [62, 21], [78, 21], [92, 19], [106, 19], [119, 20]], '#0F2B33');
      dots(c, '#4FE0C2', [[12, 18], [46, 18], [60, 19], [80, 19], [103, 17]]);
    },
  },

  mill: {
    label: 'a windmill on a hill above wheat fields at dusk',
    sky: [['#1E2A5C', 0], ['#3A3F8A', 4], ['#7A4E9A', 8], ['#D0707A', 11], ['#FFB870', 14]],
    draw(c) {
      dots(c, '#F4EFD8', STARS);
      disc(c, 34, 5, 2, '#FFF2B8'); c.set(35, 5, '#D8C890');
      ridge(c, [[0, 13], [14, 11], [28, 13], [44, 12], [58, 14], [76, 12], [90, 14], [104, 11], [119, 13]], '#5A3A7A');
      ridge(c, [[0, 16], [20, 15], [36, 16], [54, 13], [70, 13], [86, 16], [104, 15], [119, 16]], '#8A5A3A', '#D8A04A');
      for (let x = 2; x < W; x += 6) dots(c, '#D8A04A', [[x, 18], [x + 3, 20]]);
      c.stamp(57, 1, ['S........S', '.S......S.', '..S....S..', '...S..S...', '....HH....', '...RHHR...', '..BSBBSD..', '..SBBBBS..', '.SBBBWBDS.', 'S.BBBBBD.S', '.BBBBBBBD.', '.BBBKKBBD.', '.BBBKKBBD.'],
        { S: '#F4EFD8', H: '#FFF2B8', R: '#804848', B: '#C8B8D8', D: '#8A7AA8', W: '#FFCF4A', K: '#2A1428' });
      c.rect(84, 12, 5, 4, '#6A3A3A'); c.rect(83, 11, 7, 1, '#522E40'); c.rect(84, 10, 5, 1, '#522E40'); c.set(86, 14, '#FFCF4A');
      for (const x of [22, 30, 38, 96, 104]) { c.rect(x, 14, 1, 2, '#522E40'); c.rect(x - 1, 13, 3, 1, '#522E40'); }
      ridge(c, [[0, 20], [24, 21], [50, 19], [80, 21], [100, 20], [119, 21]], '#522E40');
    },
  },

  marsh: {
    label: 'a dark marsh with dead trees, a stilt hut and a pale moon',
    sky: [['#0F1E2A', 0], ['#16303A', 5], ['#1E4D4F', 10]],
    draw(c) {
      dots(c, '#6FA89A', STARS.filter((_, i) => i % 2 === 0));
      disc(c, 84, 4, 3, '#BFD8C0'); dots(c, '#8FB8A0', [[85, 3], [83, 5]]);
      ridge(c, [[0, 12], [10, 10], [22, 12], [38, 11], [52, 13], [70, 12], [88, 13], [102, 10], [119, 12]], '#0A1820');
      c.rect(0, 15, W, 7, '#16303A');
      for (let x = 1; x < W; x += 2) c.set(x, 15, '#0A1820');
      c.rect(82, 16, 5, 1, '#8FB8A0'); c.rect(83, 18, 3, 1, '#6FA89A'); c.rect(84, 20, 2, 1, '#2F7A6E');
      for (const [x, y, w] of [[8, 17, 6], [30, 19, 8], [52, 17, 5], [64, 20, 7], [98, 18, 6], [110, 16, 5]]) c.rect(x, y, w, 1, '#2F7A6E');
      c.stamp(70, 5, DEAD_TREE, { '#': '#060E14' });
      c.stamp(26, 6, DEAD_TREE.map(row => [...row].reverse().join('')), { '#': '#060E14' });
      c.rect(44, 9, 9, 5, '#1A2A2A'); c.rect(43, 8, 11, 1, '#060E14'); c.rect(45, 7, 7, 1, '#060E14'); c.rect(47, 6, 3, 1, '#060E14');
      c.rect(45, 14, 1, 3, '#060E14'); c.rect(51, 14, 1, 3, '#060E14'); c.rect(48, 10, 2, 2, '#8CE06A');
      for (const x of [16, 18, 37, 59, 61, 92, 94, 105]) c.rect(x, 13 + (x % 3), 1, 4, '#060E14');
      dots(c, '#4FE0C2', [[20, 9], [58, 11], [96, 8]]);
      dots(c, '#8CE06A', [[34, 14], [78, 13], [108, 12]]);
    },
  },

  ridge: {
    label: 'a bandit camp with tents and a fire on a rocky ridge at sunset',
    sky: [['#3A1A4A', 0], ['#7A2A5A', 4], ['#C8443C', 8], ['#F08A3C', 11], ['#FFD86B', 15]],
    draw(c) {
      dots(c, '#F4EFD8', STARS.filter(([, y]) => y < 4));
      disc(c, 80, 13, 5, '#FFF2B8');
      ridge(c, [[0, 9], [6, 9], [8, 12], [18, 12], [20, 8], [30, 8], [32, 13], [44, 14], [46, 11], [52, 11], [54, 15], [88, 15], [90, 10], [98, 10], [100, 13], [108, 13], [110, 7], [119, 7]], '#7A2A4A', '#A23E5C');
      ridge(c, [[0, 16], [12, 17], [26, 15], [40, 17], [54, 17], [72, 18], [90, 17], [104, 15], [119, 16]], '#3A1428', '#5A2440');
      const tent = ['...A...', '..AAB..', '.AAKBB.', 'AAAKBBB'];
      c.stamp(42, 13, tent, { A: '#D8703C', B: '#8A3A2C', K: '#2A1428' });
      c.stamp(64, 14, tent, { A: '#C8443C', B: '#7A2A2C', K: '#2A1428' });
      c.rect(56, 16, 3, 1, '#2A1428'); dots(c, '#FFD860', [[57, 15], [56, 15], [57, 14]]); dots(c, '#FF7A3C', [[58, 15], [57, 13]]);
      dots(c, '#C8A0B0', [[58, 11], [59, 9], [58, 7]]);
      c.rect(73, 8, 1, 10, '#2A1428'); c.rect(74, 8, 4, 2, '#E0505A'); c.rect(74, 10, 3, 1, '#A0303A');
      c.rect(22, 11, 6, 5, '#2A1428'); c.rect(21, 10, 8, 1, '#2A1428'); dots(c, '#2A1428', [[21, 9], [23, 9], [25, 9], [28, 9]]); c.set(24, 12, '#FFD860');
      ridge(c, [[0, 20], [20, 21], [48, 19], [70, 21], [96, 20], [119, 21]], '#1E0C18');
    },
  },

  crypt: {
    label: 'a stone crypt with a glowing doorway among tombstones under a full moon',
    sky: [['#14102A', 0], ['#1E1A44', 5], ['#2B2560', 10], ['#3B3470', 14]],
    draw(c) {
      dots(c, '#D5CFF0', STARS);
      disc(c, 30, 6, 4, '#E6E0F5'); dots(c, '#B3ADD0', [[28, 5], [31, 8], [32, 4]]);
      ridge(c, [[0, 14], [16, 12], [34, 14], [48, 12], [72, 12], [88, 14], [104, 12], [119, 14]], '#1A1838');
      ridge(c, [[0, 17], [22, 16], [44, 17], [76, 17], [98, 16], [119, 17]], '#25233D', '#3B3470');
      c.rect(52, 8, 16, 9, '#6A6788'); c.rect(50, 7, 20, 1, '#8F8CA8'); c.rect(52, 5, 16, 2, '#6A6788'); c.rect(55, 3, 10, 2, '#6A6788'); c.rect(58, 2, 4, 1, '#8F8CA8');
      c.rect(64, 8, 4, 9, '#4A4868'); c.rect(53, 8, 2, 9, '#8F8CA8'); c.rect(65, 8, 2, 9, '#5A5878');
      c.rect(57, 10, 6, 7, '#0D0B1A'); c.rect(58, 9, 4, 1, '#0D0B1A'); c.rect(58, 13, 4, 4, '#2F7A4E'); c.rect(59, 14, 2, 3, '#8CE06A');
      dots(c, '#8CE06A', [[56, 18], [60, 19], [63, 18], [59, 6]]);
      const stone = ['.##.', '####', '#DD#', '####', '####'];
      for (const x of [22, 36, 44, 76, 84, 100]) c.stamp(x, 12 + (x % 2), stone, { '#': '#56547A', D: '#34324F' });
      c.stamp(92, 5, DEAD_TREE, { '#': '#0D0B1A' });
      ridge(c, [[0, 20], [30, 21], [60, 20], [90, 21], [119, 20]], '#14102A');
    },
  },

  caverns: {
    label: 'a cavern with a river of lava and a forge-golem with glowing eyes',
    sky: [['#1A0E1E', 0]],
    draw(c) {
      c.rect(0, 12, W, 4, '#3A1626'); c.rect(0, 14, W, 2, '#6A2030');
      for (let x = 0; x < W; x += 2) { c.set(x, 12, '#1A0E1E'); c.set(x + 1, 14, '#3A1626'); }
      roof(c, [[0, 7], [6, 3], [12, 8], [18, 4], [26, 2], [32, 9], [38, 3], [48, 2], [54, 6], [60, 2], [70, 3], [76, 8], [82, 3], [90, 2], [96, 7], [102, 3], [110, 9], [119, 4]], '#2E1626');
      roof(c, [[0, 3], [10, 1], [22, 0], [34, 2], [44, 0], [64, 0], [74, 2], [86, 0], [98, 1], [108, 2], [119, 1]], '#140A16');
      c.rect(0, 16, W, 6, '#F0602C');
      for (const [x, y, w] of [[4, 17, 9], [22, 19, 12], [40, 17, 7], [56, 20, 10], [72, 18, 9], [90, 17, 12], [106, 20, 8]]) c.rect(x, y, w, 1, '#FFD860');
      for (const [x, y, w] of [[14, 18, 5], [34, 20, 6], [66, 17, 5], [84, 20, 6], [100, 18, 5]]) c.rect(x, y, w, 1, '#D8402C');
      ridge(c, [[0, 15], [10, 16], [14, 22], [30, 22], [34, 17], [38, 15], [52, 14], [70, 14], [80, 16], [84, 22], [98, 22], [102, 17], [119, 15]], '#221220', '#4A2030');
      c.stamp(54, 4, ['...####...', '..######..', '..#Y##Y#..', '.########.', '####O#####', '##.####.##', '##.#O##.##', '##.####.##', '...#..#...', '..##..##..'], { '#': '#3A2A3E', Y: '#FFD860', O: '#FF7A3C' });
      dots(c, '#FF9A5C', [[20, 11], [44, 9], [78, 10], [96, 12], [30, 13], [108, 11]]);
      dots(c, '#FFD860', [[12, 13], [68, 12], [88, 9]]);
    },
  },

  pass: {
    label: 'a snowy mountain pass with icy peaks and a white wyrm in the sky',
    sky: [['#1E2A5C', 0], ['#2F5296', 5], ['#4A8FD0', 9], ['#8ED6F5', 13]],
    draw(c) {
      dots(c, '#F4F6FF', STARS.filter(([, y]) => y < 5));
      for (const [x, y, w] of [[12, 2, 14], [30, 3, 8], [66, 2, 12], [84, 3, 16], [104, 2, 6]]) c.rect(x, y, w, 1, '#4FE0C2');
      c.stamp(40, 4, ['....WW......', 'W..WWWW....W', 'WWWW..WW..WW', '.WW....WWWW.', '........WW..'], { W: '#F4F6FF' });
      c.set(44, 4, '#2F5296');
      ridge(c, [[0, 12], [10, 6], [16, 9], [26, 3], [36, 10], [44, 12], [56, 5], [66, 11], [78, 12], [90, 4], [100, 10], [110, 7], [119, 11]], '#3A6AB0');
      heights([[0, 12], [10, 6], [16, 9], [26, 3], [36, 10], [44, 12], [56, 5], [66, 11], [78, 12], [90, 4], [100, 10], [110, 7], [119, 11]]).forEach((y, x) => { if (y <= 8) c.rect(x, y, 1, Math.min(3, 9 - y), '#F4F6FF'); });
      ridge(c, [[0, 15], [14, 13], [30, 16], [46, 14], [60, 16], [78, 13], [96, 16], [110, 14], [119, 15]], '#B9C4E8', '#F4F6FF');
      for (const [x, y] of [[8, 8], [22, 9], [70, 9], [102, 8]]) { pine(c, x, y, '#1A2A5C', '#F4F6FF'); c.set(x + 3, y, '#F4F6FF'); }
      c.rect(52, 12, 10, 5, '#1A1C40'); c.rect(53, 11, 8, 1, '#1A1C40'); dots(c, '#E6FAFF', [[53, 12], [55, 12], [55, 13], [58, 12], [60, 12], [60, 13]]);
      ridge(c, [[0, 19], [20, 18], [44, 20], [70, 18], [96, 20], [119, 18]], '#F4F6FF', '#FFFFFF');
      for (const [x, y, w] of [[10, 20, 8], [36, 21, 10], [64, 20, 7], [88, 21, 9]]) c.rect(x, y, w, 1, '#B9C4E8');
    },
  },

  citadel: {
    label: 'a black citadel with burning windows under an ash-red sky',
    sky: [['#1A0E14', 0], ['#3A1420', 5], ['#6A2030', 9], ['#B0402C', 13]],
    draw(c) {
      dots(c, '#C8A0A0', STARS.filter((_, i) => i % 3 !== 0));
      disc(c, 88, 7, 4, '#FF6A3C'); dots(c, '#D8402C', [[86, 6], [89, 9], [90, 5]]);
      ridge(c, [[0, 12], [8, 9], [14, 13], [26, 10], [34, 14], [84, 14], [94, 10], [102, 13], [112, 9], [119, 12]], '#3A1420');
      const stone = '#0C0810';
      c.rect(50, 4, 20, 14, stone); c.rect(56, 1, 8, 3, stone); c.rect(59, 0, 2, 1, stone);
      c.rect(40, 8, 8, 10, stone); c.rect(72, 8, 8, 10, stone); c.rect(32, 12, 56, 6, stone);
      for (const x of [40, 43, 46, 72, 75, 78, 50, 53, 56, 63, 66, 69, 32, 35, 82, 85]) c.rect(x, x < 50 || x > 70 ? (x < 40 || x > 80 ? 11 : 7) : 3, 2, 1, stone);
      dots(c, '#FFD860', [[59, 6], [60, 6], [54, 9], [65, 9], [43, 11], [76, 11], [59, 11], [60, 11]]);
      dots(c, '#FF7A3C', [[59, 7], [60, 7], [54, 10], [65, 10], [43, 12], [76, 12], [36, 14], [83, 14]]);
      c.rect(57, 14, 6, 4, '#3A1420'); c.rect(58, 13, 4, 1, '#3A1420'); c.rect(59, 15, 2, 3, '#FF7A3C');
      ridge(c, [[0, 17], [16, 16], [30, 18], [90, 18], [104, 16], [119, 17]], '#1E0C14', '#4A1A24');
      for (const [x, y, w] of [[8, 19, 6], [24, 20, 9], [48, 19, 5], [66, 20, 8], [92, 19, 7], [108, 20, 6]]) c.rect(x, y, w, 1, '#D8402C');
      dots(c, '#FFB07A', [[12, 6], [28, 3], [46, 2], [74, 3], [100, 5], [110, 3], [20, 9], [96, 2]]);
    },
  },
};

export const SCENE_NAMES = Object.keys(SCENES);

const cache = new Map();

// The scene as an SVG string. mode: 'open' (dusk colours), 'locked' (night colours) or 'strip'
// (night colours, a short slice: used for zones still far away).
export function sceneSvg(name, mode) {
  const key = `${name}:${mode}`;
  if (cache.has(key)) return cache.get(key);
  const scene = SCENES[name];
  if (!scene) throw new Error(`Unknown scene "${name}"`);
  const canvas = createCanvas(W, H);
  scene.draw(canvas);
  const night = mode !== 'open';
  const front = night ? canvas.paths().replace(/fill="(#[0-9a-fA-F]{6})"/g, (_, hex) => `fill="${nightColor(hex)}"`) : canvas.paths();
  const from = mode === 'strip' ? STRIP.from : 0;
  const rows = mode === 'strip' ? STRIP.rows : H;
  const svg = `<svg class="px" width="${W * SCALE}" height="${rows * SCALE}" viewBox="0 ${from} ${W} ${rows}" shape-rendering="crispEdges" role="img" aria-label="Pixel art of ${scene.label}${night ? ', at night' : ''}">${skyPaths(night ? NIGHT_SKY : scene.sky)}${front}</svg>`;
  cache.set(key, svg);
  return svg;
}
