// Small pixel sprites: navigation, coins, energy, quest icons, class emblems. No emoji anywhere in the game.
// Each sprite is rows of characters plus a palette (see pixel.js). 'currentColor' takes the text colour.

import { spriteSvg } from './pixel.js';

const INK = { '#': 'currentColor' };

const SPRITES = {
  // Navigation, 8×8, one colour.
  quests: { palette: INK, rows: ['.######.', '.#....#.', '.#.##.#.', '.#....#.', '.#.##.#.', '.#....#.', '.#....#.', '.######.'] },
  hero: { palette: INK, rows: ['...##...', '...##...', '........', '.######.', '.######.', '..####..', '..#..#..', '..#..#..'] },
  vendor: { palette: INK, rows: ['...##...', '..#..#..', '.######.', '.######.', '.######.', '.######.', '.######.', '..####..'] },
  adventure: { palette: INK, rows: ['.......#', '......#.', '.....#..', '.#..#...', '..##....', '..##....', '.#..#...', '#.......'] },

  // Status, one colour.
  energy: { palette: INK, rows: ['..##', '.##.', '####', '..##', '.##.', '#...'] },
  check: { palette: INK, rows: ['......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'] },

  // Padlock over locked zone scenes, 8×10.
  padlock: {
    palette: { W: '#F4EFD8', G: '#FFCF4A', D: '#B8862A', K: '#14102A' },
    rows: ['..WWWW..', '.W....W.', '.W....W.', '.W....W.', 'GGGGGGGG', 'GGGGGGGG', 'GGGKKGGG', 'GGGKKGGG', 'GGGGGGGG', 'DDDDDDDD'],
  },

  // Coins, 5×5.
  gold: { palette: { o: '#F2B01E', g: '#FFE9A0' }, rows: ['.ooo.', 'ogooo', 'ooooo', 'ooooo', '.ooo.'] },
  silver: { palette: { o: '#EEF1F8', g: '#9AA0B8' }, rows: ['.ooo.', 'ooooo', 'ooooo', 'ooogo', '.ooo.'] },
  copper: { palette: { o: '#B5562A', g: '#E89A6A' }, rows: ['.ooo.', 'ogooo', 'ooooo', 'ooooo', '.ooo.'] },

  // Class emblems, 12×12.
  warrior: {
    palette: { L: '#E6E9F2', S: '#9AA0B8', C: '#FF7A59' },
    rows: ['............', '............', '..LLLLSSSS..', '..LLLCCSSS..', '..LCCCCCCS..', '..LCCCCCCS..', '..LLLCCSSS..', '...LLCCSS...', '....LLSS....', '.....LS.....', '............', '............'],
  },
  mage: {
    palette: { O: '#FF9A5C', Y: '#FFD860', R: '#E0505A', W: '#FFF2B8' },
    rows: ['............', '......O.....', '.....OO.....', '.....OOR....', '....OYORR...', '...OOYYOR...', '...OYYYORR..', '..OOYWYYOR..', '..OYYWWYOR..', '..OOYWWYRR..', '...OOYYRR...', '....OORR....'],
  },
  ranger: {
    palette: { G: '#8CE06A', D: '#4AA838', B: '#F4EFD8' },
    rows: ['............', '.......GGG..', '.....GGGGD..', '....GGGDGD..', '...GGGDGGD..', '...GGDGGDD..', '..GGDGGGD...', '..GDGGGDD...', '..DGGDDD....', '.BDDDD......', 'BB..........', '............'],
  },
  priest: {
    palette: { Y: '#FFD860', W: '#FFF2B8', O: '#F09A30' },
    rows: ['.....YY.....', '.....YY.....', '.Y........Y.', '..Y.YYYY.Y..', '....YWWYO...', 'YY.YWWWYO.YY', 'YY.YWWYYO.YY', '....YYYOO...', '..Y.OOOO.Y..', '.Y........Y.', '.....YY.....', '.....YY.....'],
  },

  // Quest icons, 12×12.
  boot: {
    palette: { H: '#F0C090', L: '#C08458', D: '#8A5048', S: '#5A3044', G: '#FFCF4A' },
    rows: ['............', '...HLLL.....', '...HLLD.....', '...HGLD.....', '...HLLD.....', '...HGLD.....', '...HLLLL....', '...HLLLLLL..', '..HLLLLLLLD.', '..LLLLLLLDD.', '..SSSSSSSSS.', '............'],
  },
  dumbbell: {
    palette: { H: '#F4F6FF', M: '#B9C4E8', D: '#7C86B8', B: '#6E6790' },
    rows: ['............', '............', '.HM......HM.', '.MM......MM.', 'HMMD....HMMD', 'MMMBBBBBBMMD', 'MMMBBBBBBMMD', 'MMDD....MMDD', '.MD......MD.', '.DD......DD.', '............', '............'],
  },
  lotus: {
    palette: { P: '#FFB0E0', M: '#F060B8', D: '#A03090', W: '#4FE0C2' },
    rows: ['............', '.....PP.....', '....PPMM....', '.P..PPMM..M.', '.PP.PPMM.MM.', '.PPPPPMMMMD.', '..PPMPMMMD..', '..PPMMMMDD..', '...MMMDDD...', '.WW.MDDD.WW.', '..WWWWWWWW..', '............'],
  },
  droplet: {
    palette: { H: '#E6FAFF', L: '#8ED6F5', M: '#4A8FD0', D: '#2F5296' },
    rows: ['............', '.....LM.....', '.....LM.....', '....LLMM....', '....LLMM....', '...LHLMMD...', '..LLHLMMMD..', '..LHLLMMMD..', '..LLLMMMDD..', '...LMMMDD...', '....MMDD....', '............'],
  },
  flask: {
    palette: { G: '#D4DCF8', C: '#B87850', O: '#FF9A5C', Y: '#FFD860', D: '#E0505A' },
    rows: ['............', '....CCCC....', '.....GG.....', '.....GG.....', '....G..G....', '...G....G...', '..GYOOOOOG..', '..GOYOOODG..', '..GOOOODDG..', '...GOODDG...', '....GGGG....', '............'],
  },
  apple: {
    palette: { H: '#B8FF6A', G: '#8CE06A', D: '#4AA838', S: '#804848', L: '#2F7A6E' },
    rows: ['............', '......S.LL..', '.....SSLL...', '...GG.SGG...', '..GHGGGGGD..', '.GHGGGGGGDD.', '.GGGGGGGGDD.', '.GGGGGGGDDD.', '.GGGGGGGDDD.', '..GGGGGDDD..', '...GG.DDD...', '............'],
  },

  // Champion's Cache, 12×12.
  chest: {
    palette: { G: '#FFCF4A', K: '#B8862A', W: '#B87850', D: '#804848' },
    rows: ['............', '............', '..GGGGGGGG..', '.GWWWWWWWWG.', '.GWWWWWWWDG.', '.GGGGGGGGGG.', '.GDDDGGDDDG.', '.GWWWGKWWDG.', '.GWWWWWWWDG.', '.GWWWWWWDDG.', '.GGGGGGGGGG.', '............'],
  },
};

export const ICON_NAMES = Object.keys(SPRITES);

// A sprite by name. `scale` is CSS px per sprite pixel. Pass a label only when the icon carries meaning
// that the text next to it does not.
export function icon(name, scale, label) {
  const sprite = SPRITES[name];
  if (!sprite) throw new Error(`Unknown icon "${name}"`);
  return spriteSvg(sprite.rows, sprite.palette, scale, label);
}
