// Pixel art for the world map: 8×8 terrain tiles, the marks that stand on them, and wild mobs.
// Sprites are rows of characters like the rest of the art (see pixel.js): '.' is empty, every other
// character is a key into the palette. The map paints them on a canvas (ui/map.js).

const INK = '#0D0B1A';

// One entry per biome id (content/world.js → BIOMES). base: the tile's ground colour, and the colour of
// the whole tile when the map is zoomed out. rows: two variants of the detail drawn over it.
export const TERRAIN_ART = {
  grass: { base: '#3E6B4A', palette: { d: '#34593F', l: '#55875E' }, rows: [
    ['........', '.l......', '......d.', '........', '...d....', '........', '.....l..', '........'],
    ['........', '....l...', '.d......', '........', '......l.', '..d.....', '........', '........']] },
  forest: { base: '#2F5240', palette: { L: '#2A7050', h: '#46976A', t: '#5A3F2E' }, rows: [
    ['...LL...', '..LLhL..', '.LLLLhL.', '.LLLLLL.', '..LLLL..', '...tt...', '...tt...', '........'],
    ['.LL.....', 'LLhL....', 'LLLL.LL.', '.tt.LLhL', '....LLLL', '.....tt.', '........', '........']] },
  hills: { base: '#5F5248', palette: { m: '#8A7460', s: '#4A3F38', l: '#A38C74' }, rows: [
    ['........', '...ll...', '..lmmm..', '.lmmmss.', 'lmmmmsss', '........', '.....lm.', '....lmss'],
    ['........', '.ll.....', 'lmms....', 'mmmss...', '.....ll.', '....lmms', '...lmmss', '........']] },
  swamp: { base: '#3D4A3C', palette: { p: '#2B3A52', r: '#8A9A4E' }, rows: [
    ['........', '.r...pp.', '.r..pppp', '.....pp.', '..pp....', '.pppp.r.', '..pp..r.', '........'],
    ['......r.', '.ppp..r.', 'ppppp...', '.ppp....', '....r...', '....r.pp', '.....ppp', '........']] },
  water: { base: '#274684', palette: { w: '#4A74C0' }, rows: [
    ['........', '.ww.....', '........', '.....ww.', '........', '..ww....', '........', '......w.'],
    ['........', '....ww..', '........', '.ww.....', '........', '.....ww.', 'w.......', '........']] },
  peak: { base: '#3A3654', palette: { w: '#F4EFD8', r: '#8E8AA8', s: '#5F5B7C' }, rows: [
    ['...ww...', '..wwrs..', '..rrrs..', '.rrrrss.', '.rrrrss.', 'rrrrrsss', 'rrrrrsss', '........'],
    ['........', '....ww..', '...wwrs.', '...rrrs.', '..rrrrss', '.rrrrrss', '.rrrrrss', '........']] },
};

// Things that stand on a tile.
export const MARK_ART = {
  town: { palette: { r: '#C8553D', w: '#F4EFD8', d: '#5A3F2E', k: INK }, rows: ['...rr...', '..rrrr..', '.rrrrrr.', 'rrrrrrrr', 'kwwwwwwk', 'kwwddwwk', 'kwwddwwk', '.kkkkkk.'] },
  dungeon: { palette: { s: '#8E8AA8', k: INK, f: '#FFCF4A' }, rows: ['..ssss..', '.ssssss.', 'sskkkkss', 'skkkkkks', 'fkkkkkkf', 'skkkkkks', 'skkkkkks', 'ssk..kss'] },
  hero: { palette: { h: '#FFCF4A', f: '#F2C9A0', c: '#4FE0C2', l: '#F4EFD8', k: INK }, rows: ['.khhhhk.', '.kffffk.', '.kffffk.', 'kcccccck', 'ckcccckc', '.kcccck.', '.klkklk.', '.klkklk.'] },
};

// One entry per mob id (content/mobs.js).
export const MOB_ART = {
  boar: { palette: { b: '#8A5A3C', p: '#E89A8A', w: '#F4EFD8', k: INK }, rows: ['.kk..kk.', 'kbbkkbbk', 'kbbbbbbk', 'kbkbbkbk', 'kbbppbbk', 'kwbppbwk', '.kbbbbk.', '..kkkk..'] },
  bandit: { palette: { h: '#5A4A6A', f: '#F2C9A0', r: '#C8553D', c: '#4A4660', k: INK }, rows: ['..kkkk..', '.khhhhk.', '.khffhk.', '.krrrrk.', 'kcccccck', 'kcckkcck', '.kcccck.', '.kk..kk.'] },
  wolf: { palette: { g: '#8E8AA8', y: '#FFCF4A', w: '#E6E0F5', k: INK }, rows: ['k......k', 'kgk..kgk', 'kggkkggk', 'kggggggk', 'kgyggygk', '.kggggk.', '..kwwk..', '...kk...'] },
  spider: { palette: { d: '#4A3460', r: '#FF7A59', k: INK }, rows: ['k.k..k.k', '.k.kk.k.', '.kkddkk.', 'kkdrrdkk', '.kddddk.', 'k.kddk.k', 'k.k..k.k', '........'] },
  ram: { palette: { c: '#E8D8A8', w: '#D5CFF0', p: '#8A7460', k: INK }, rows: ['.cc..cc.', 'c.kkkk.c', 'cckwwkcc', '.kwkkwk.', '.kwwwwk.', '.kwppwk.', '..kwwk..', '...kk...'] },
  golem: { palette: { s: '#8A7460', o: '#4FE0C2', k: INK }, rows: ['..kkkk..', '.kssssk.', 'kssssssk', 'ksossosk', 'kssssssk', 'kksssskk', '.ks..sk.', '.kk..kk.'] },
  toad: { palette: { g: '#5E9A4A', y: '#FFCF4A', k: INK }, rows: ['........', '.kk..kk.', 'kykkkkyk', 'kggggggk', 'kgkkkkgk', 'kggggggk', '.kgkkgk.', '.kk..kk.'] },
  wisp: { palette: { c: '#4FE0C2', w: '#E6FAFF', k: '#2F8A8A' }, rows: ['...cc...', '..cwwc..', '.cwwwwc.', '.cwkkwc.', '.cwwwwc.', '..cwwc..', '...cc...', '..c..c..'] },
};
