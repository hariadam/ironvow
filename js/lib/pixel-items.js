// pixel-items.js
// Pixel-art item generator for the habit RPG. No dependencies. Works in a browser (window.PixelItems) and in Node (module.exports).
// Every sprite is a 32x32 grid built from parts by code. Nothing is drawn by hand and no image files are needed.
(function (root) {
'use strict';
const Forge = (function () {
class DCLogic {}
class Component extends DCLogic {
rng(seed) {
let a = seed >>> 0;
return function () {
a = (a + 0x6D2B79F5) | 0;
let t = Math.imul(a ^ (a >>> 15), 1 | a);
t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
}
gen(type, rar, R) {
const pick = (a) => a[Math.floor(R() * a.length)];
const ri = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
const METALS = [
[['#D9D4E8', '#A39DBF', '#6E6790', '#453F66', '#1E1A38', 'Iron'], ['#F0B89A', '#C27A5E', '#8A4A4A', '#5A2E45', '#2A1428', 'Rusted'], ['#F2DFA0', '#C4A45E', '#8A6E4A', '#58424A', '#281C2A', 'Brass']],
[['#F4F6FF', '#B9C4E8', '#7C86B8', '#4A4F86', '#1A1C40', 'Steel'], ['#FFE0A0', '#E0A050', '#A8643C', '#6A3840', '#2E1626', 'Bronze']],
[['#E6FAFF', '#8ED6F5', '#4A8FD0', '#2F5296', '#101E4A', 'Bluesteel'], ['#FFFFFF', '#D4DCF8', '#96A2D8', '#5A62A0', '#1E2250', 'Moonsilver']],
[['#F6DCFF', '#C88AF0', '#8048C8', '#48247E', '#1E0C40', 'Voidglass'], ['#E0C8E8', '#9A7EB8', '#5E4A8A', '#342858', '#140E2C', 'Duskiron']],
[['#FFFBD8', '#FFD860', '#F09A30', '#B0502C', '#3A1420', 'Sunforged'], ['#FFF0C0', '#FF9A5C', '#E0505A', '#8A2A5A', '#33102E', 'Emberheart']]
];
const TRIMS = [null, ['#FFE0A0', '#E0A050', '#A8643C'], ['#F4F6FF', '#B9C4E8', '#7C86B8'], ['#FFB0E0', '#F060B8', '#A03090'], ['#FFFFFF', '#FFF0A0', '#FFC040']];
const WOODS = [['#E8B080', '#B87850', '#804848', '#522E40', 'oak'], ['#C8B8D8', '#9080A8', '#5E5080', '#3A3058', 'ash']];
const GRIPS = [['#E0705A', '#A04050'], ['#4FE0C2', '#2F8A8A'], ['#8A70C8', '#54408A'], ['#F0C060', '#B07840']];
const GEMS = [['#FF6A8A', '#B0305A'], ['#5AF0D0', '#208A88'], ['#6AD0FF', '#2A6AC0'], ['#FFD860', '#D08020'], ['#E08AFF', '#8838C0']];
const RC = ['#D5CFF0', '#8CE06A', '#5BC8FF', '#D07BFF', '#FFCF4A'];
const FR = ['#6A6699', '#8CE06A', '#5BC8FF', '#D07BFF', '#FFCF4A'];
const BG = ['#2A2550', '#243A45', '#22335E', '#36245E', '#4A3A26'];
const RN = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const WHITE = '#FFFFFF';
const PLUM = '#2A1428';
const VOID = '#1A1238';
const N = 32;
const col = [];
const olc = [];
for (let i = 0; i < N * N; i++) { col.push(null); olc.push(null); }
const set = (x, y, c, o) => { if (x >= 3 && x <= 28 && y >= 3 && y <= 28) { col[y * N + x] = c; olc[y * N + x] = o; } };
const diag = (fn) => {
for (let y = 3; y <= 28; y++) for (let x = 3; x <= 28; x++) {
const r = fn(x - y + 25, x + y - 31);
if (r) set(x, y, r[0], r[1]);
}
};
const metal = pick(METALS[rar]);
const mo = metal[4];
const trim = rar === 0 ? [metal[1], metal[2], metal[3]] : TRIMS[rar];
const grip = pick(GRIPS);
const wood = pick(WOODS);
const gem = pick(GEMS);
const tri = (p) => p < 0 ? trim[0] : (p === 0 ? trim[1] : trim[2]);
const woodC = (p) => p < 0 ? wood[1] : (p === 0 ? wood[2] : wood[3]);
let noun = '';
let parts = '';
if (type === 0) {
const shape = rar === 0 ? 0 : (rar >= 3 ? ri(0, 3) : ri(0, 2));
let L = [40, 43, 45, 47, 49][rar] - ri(0, 2);
if (shape === 2) L = Math.min(L, 44);
const W = rar >= 2 ? ri(3, 4) : ri(2, 3);
const off = (a) => shape === 2 ? Math.round(6 * Math.pow((a - 16) / (L - 16), 2)) : 0;
const wid = (a) => {
let b = W;
const f = (a - 16) / (L - 16);
if (shape === 1 && f > 0.35 && f < 0.8) b = W + 1;
if (shape === 3) b = W + ((Math.floor(a / 3) % 2) ? 1 : -1);
return Math.min(b, L - a);
};
const G = [5, 6, 7, 8, 9][rar] + ri(0, 1);
const gs = rar === 0 ? 0 : ri(0, 2);
const dir = gs === 1 ? 1 : (gs === 2 ? -1 : 0);
const gr = rar >= 3 ? 2 : 1;
diag((a, p) => {
const ap = Math.abs(p);
if (rar >= 2 && Math.abs(a - 14) <= gr && ap <= gr) return [(a === 15 && p === -1) ? WHITE : (p <= 0 ? gem[0] : gem[1]), mo];
const sh = ap > G - 3 ? 2 * dir : 0;
if (a >= 13 + sh && a <= 15 + sh && ap <= G) return [p <= -2 ? trim[0] : (p >= 2 ? trim[2] : trim[1]), mo];
const pd = (a - 3) * (a - 3) + p * p;
if (rar >= 3 && pd <= 2) return [p < 0 ? WHITE : gem[0], mo];
if (pd <= (rar >= 2 ? 10 : 5)) return [tri(p), mo];
if (a >= 5 && a <= 12 && ap <= 1) return [(Math.floor(a / 2) % 2 === 0) ? grip[0] : grip[1], PLUM];
if (a >= 16 && a <= L) {
const pp = p - off(a);
const w = wid(a);
if (Math.abs(pp) <= w) {
if (rar >= 3 && pp === 0 && a % 8 === 0 && a >= 20 && a <= L - 6) return [trim[0], mo];
if (rar >= 2 && w >= 3 && (pp === 0 || pp === 1) && a < L - 5) return [metal[3], mo];
if (pp < 0) return [(pp <= -(w - 1) && rar >= 1) ? metal[0] : metal[1], mo];
if (pp === 0) return [metal[1], mo];
return [pp >= w - 1 ? metal[3] : metal[2], mo];
}
}
return null;
});
noun = ['Sword', 'Leafblade', 'Sabre', 'Flameblade'][shape];
if (shape === 0 && L >= 45) noun = 'Greatsword';
parts = ['straight blade', 'leaf blade', 'curved blade', 'flame blade'][shape] + ', ' + ['straight guard', 'upswept guard', 'drooping guard'][gs] + (rar >= 2 ? ', set gem' : '') + (rar >= 3 ? ', runes' : '');
} else if (type === 1) {
const ah = 34;
const H = [8, 9, 11, 12, 13][rar];
const flare = pick([0.55, 0.7, 0.85]);
const cv = pick([10, 14]);
const beard = pick([0, 2, 4]);
const dbl = rar >= 3 || (rar === 2 && R() < 0.35);
const spike = rar >= 2;
const hTop = spike ? 47 : 43;
const headAt = (a, q) => {
if (q < 2) return null;
const Hl = H - (a - ah) * (a - ah) / cv;
if (q > Hl) return null;
const lim = 2 + flare * q + (a < ah ? beard * q / H : 0);
if (Math.abs(a - ah) > lim) return null;
if (q >= Hl - 2) return rar >= 1 ? metal[0] : metal[1];
if (q >= Hl - 4) return metal[1];
if (q <= 3) return metal[3];
if (q >= Hl - 7) return (q % 2 === 0) ? metal[1] : metal[2];
return metal[2];
};
diag((a, p) => {
const ap = Math.abs(p);
if (rar >= 2 && Math.abs(a - ah) <= 1 && ap <= 1) return [(a === ah + 1 && p === -1) ? WHITE : (p <= 0 ? gem[0] : gem[1]), mo];
if (rar >= 1 && Math.abs(a - ah) <= 3 && ap <= 1) return [tri(p), mo];
let c = headAt(a, -p);
if (c) return [(rar >= 2 && a === ah && -p >= 3 && -p <= H - 3) ? trim[1] : c, mo];
if (dbl) {
c = headAt(a, p);
if (c) return [c === metal[0] ? metal[1] : (c === metal[1] ? metal[2] : metal[3]), mo];
} else if (rar >= 1 && p >= 2 && p <= 6 && Math.abs(a - ah) <= (7 - p) / 1.5) return [p >= 5 ? metal[1] : metal[2], mo];
if (spike && a > 43 && a <= hTop && ap <= Math.min(1, hTop - a)) return [p < 0 ? metal[0] : metal[2], mo];
if (a >= 1 && a <= 43 && ap <= 1) {
if (a <= 2 && rar >= 1) return [trim[1], mo];
if ((a >= 7 && a <= 10) || (a >= 14 && a <= 17)) return [(a % 2 === 0) ? grip[0] : grip[1], PLUM];
return [woodC(p), PLUM];
}
return null;
});
noun = dbl ? 'Greataxe' : (beard >= 2 ? 'Bearded Axe' : 'Axe');
parts = (dbl ? 'double head' : 'single head') + (beard >= 2 ? ', long beard' : '') + (spike ? ', top spike' : '') + (rar >= 2 ? ', set gem' : '') + ', ' + wood[4] + ' haft';
} else if (type === 2) {
const hc = 38;
const forked = R() < 0.5;
const sTop = rar >= 2 ? 32 : 34;
const gemC = (da, p) => [((da === 1 && p === -1) || (da === 0 && p === -2)) ? WHITE : ((p < 0 || (p === 0 && da > 0)) ? gem[0] : gem[1]), mo];
const met = (p) => [p < -2 ? metal[0] : (p < 0 ? metal[1] : (p < 3 ? metal[2] : metal[3])), mo];
diag((a, p) => {
const ap = Math.abs(p);
const da = a - hc;
const d2 = da * da + p * p;
if (rar === 0) {
if (forked) {
if (a >= 35 && a <= 42 && ap >= 2 && ap <= 3) return [p < 0 ? wood[1] : wood[3], PLUM];
if (d2 <= 10) return [wood[2], PLUM];
} else if (d2 <= 18) return [p < -1 ? wood[0] : (p > 1 ? wood[3] : (p < 0 ? wood[1] : wood[2])), PLUM];
} else if (rar === 1) {
if (d2 <= 13) return gemC(da, p);
if (d2 <= 34 && da < 1) return [p < 0 ? wood[1] : wood[3], PLUM];
} else if (rar === 2) {
if (d2 <= 18) return gemC(da, p);
if (d2 >= 30 && d2 <= 62 && da < 3) return met(p);
} else if (rar === 3) {
if (d2 <= 20) return gemC(da, p);
if (d2 >= 34 && d2 <= 74 && da < 4) return met(p);
if (ap <= 1 && da >= 7 && da <= 9) return [trim[0], mo];
} else {
if (d2 <= 20) return gemC(da, p);
if (d2 >= 34 && d2 <= 62) return [p < -2 ? trim[0] : (p < 2 ? trim[1] : trim[2]), mo];
const ad = Math.abs(da);
if ((ap <= 1 && da >= 9 && da <= 11) || (ad <= 1 && ap >= 9 && ap <= 11) || (ad === ap && ap >= 6 && ap <= 7 && da > 0)) return [trim[1], mo];
}
if (a >= 1 && a <= sTop && ap <= 1) {
if (rar >= 1 && (a <= 2 || (a >= 10 && a <= 12) || (a >= 26 && a <= 28))) return [tri(p), mo];
if (a >= 15 && a <= 21) return [(Math.floor(a / 2) % 2 === 0) ? grip[0] : grip[1], PLUM];
return [woodC(p), PLUM];
}
return null;
});
noun = pick(['Staff', 'Stave', 'Rod']);
parts = [forked ? 'forked top' : 'gnarled knot', 'clawed gem', 'crescent and orb', 'great crescent, floating shard', 'sun halo with rays'][rar] + ', ' + wood[4] + ' shaft';
} else {
const shade = (x, y, hw, m, lift) => {
const f = (x - 15.5) / hw - (lift ? 0.2 : 0);
const ch = (x + y) % 2 === 0;
if (f < -0.75) return m[1];
if (f < -0.45) return rar >= 1 ? m[0] : m[1];
if (f < -0.15) return m[1];
if (f < 0.05) return ch ? m[1] : m[2];
if (f < 0.45) return m[2];
if (f < 0.65) return ch ? m[2] : m[3];
return m[3];
};
if (type === 3) {
const hwAt = (y) => y === 5 ? 3 : (y === 6 ? 5 : (y === 7 ? 7 : (y === 8 ? 8 : (y <= 10 ? 9 : (y <= 23 ? 10 : (y === 24 ? 9 : 8))))));
for (let y = 5; y <= 25; y++) {
const hw = hwAt(y);
for (let x = 16 - hw; x <= 15 + hw; x++) set(x, y, shade(x, y, hw, metal, y <= 7), mo);
}
const style = ri(0, 2);
if (style === 0) {
for (let y = 14; y <= 25; y++) for (let x = (y === 14 ? 11 : 10); x <= (y === 14 ? 20 : 21); x++) set(x, y, VOID, mo);
for (let y = 14; y <= 20; y++) { set(15, y, metal[1], mo); set(16, y, metal[3], mo); }
} else if (style === 1) {
for (let y = 14; y <= 15; y++) for (let x = 8; x <= 23; x++) if (x !== 15 && x !== 16) set(x, y, VOID, mo);
for (let y = 19; y <= 23; y++) { set(11, y, VOID, mo); set(13, y, VOID, mo); set(18, y, VOID, mo); set(20, y, VOID, mo); }
} else {
for (let y = 13; y <= 15; y++) for (let x = 9; x <= 22; x++) set(x, y, VOID, mo);
for (let y = 16; y <= 25; y++) for (let x = 14; x <= 17; x++) set(x, y, VOID, mo);
}
if (rar >= 3 && style !== 1) { set(12, 15, trim[0], mo); set(19, 15, trim[0], mo); }
if (rar >= 1) {
for (let x = 6; x <= 25; x++) { set(x, 10, x < 16 ? trim[0] : trim[1], mo); set(x, 11, x < 16 ? trim[1] : trim[2], mo); }
}
if (rar >= 2) {
set(15, 9, gem[0], mo); set(16, 9, gem[0], mo); set(15, 10, WHITE, mo); set(16, 10, gem[0], mo);
set(15, 11, gem[0], mo); set(16, 11, gem[1], mo); set(15, 12, gem[1], mo); set(16, 12, gem[1], mo);
set(15, 3, gem[0], mo); set(16, 3, gem[1], mo);
for (let x = 14; x <= 17; x++) { set(x, 4, x < 16 ? gem[0] : gem[1], mo); set(x, 5, x < 16 ? gem[0] : gem[1], mo); }
}
if (rar >= 3) {
const tail = [[17, 3], [18, 3], [18, 4], [19, 4], [20, 5], [21, 5], [21, 6], [22, 7]];
for (let k = 0; k < tail.length; k++) set(tail[k][0], tail[k][1], gem[1], mo);
const horn = [[5, 13], [5, 12], [4, 12], [4, 11], [3, 11], [3, 10], [3, 9], [3, 8], [4, 8], [4, 7], [4, 6], [5, 6], [5, 5], [5, 4]];
for (let k = 0; k < horn.length; k++) {
set(horn[k][0], horn[k][1], k >= 11 ? WHITE : trim[0], mo);
set(31 - horn[k][0], horn[k][1], k >= 11 ? trim[0] : trim[2], mo);
}
}
if (rar === 4) {
const cx = [8, 9, 22, 23];
for (let k = 0; k < cx.length; k++) { set(cx[k], 9, trim[1], mo); set(cx[k], 8, trim[0], mo); }
set(12, 9, trim[1], mo); set(19, 9, trim[1], mo);
}
noun = ['Nasal Helm', 'Visored Helm', 'Barbute'][style];
parts = ['open face with nasal', 'visor slit', 'T visor'][style] + (rar >= 1 ? ', brow band' : '') + (rar >= 2 ? ', plume, set gem' : '') + (rar >= 3 ? ', horns' : '') + (rar === 4 ? ', crown points' : '');
} else {
const leather = rar <= 1 && R() < 0.5;
const m = leather ? ['#F0C090', '#C08458', '#8A5048', '#5A3044'] : metal;
const o = leather ? PLUM : mo;
const lo = [0, 0, 0, 0, 0, 0, 4, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2];
const hi = [0, 0, 0, 0, 0, 0, 10, 11, 11, 11, 11, 10, 9, 9, 9, 9, 9, 9, 8, 8, 8, 8, 9, 10, 10, 10, 10];
for (let y = 6; y <= 26; y++) for (let x = 5; x <= 26; x++) {
const d = Math.abs(x - 15.5) + 0.5;
if (d >= lo[y] && d <= hi[y]) set(x, y, shade(x, y, 10, m, false), o);
}
for (let x = 9; x <= 22; x++) { const d = Math.abs(x - 15.5); if (d >= 2 && d <= 6.5) set(x, 13, m[3], o); }
set(8, 12, m[3], o); set(23, 12, m[3], o);
if (leather) {
for (let x = 8; x <= 23; x += 2) { set(x, 16, m[0], o); set(x + 1, 18, m[0], o); }
} else {
for (let x = 7; x <= 24; x++) { set(x, 16, m[3], o); if (x >= 8 && x <= 23) set(x, 18, m[3], o); }
}
for (let y = 9; y <= 19; y++) {
if (rar >= 1) { set(15, y, trim[0], o); set(16, y, trim[2], o); }
else set(16, y, m[3], o);
}
for (let x = 8; x <= 23; x++) { set(x, 20, grip[0], o); set(x, 21, grip[1], o); }
for (let x = 14; x <= 17; x++) { set(x, 20, trim[0], o); set(x, 21, trim[2], o); }
for (let y = 22; y <= 26; y++) { set(11, y, m[3], o); set(20, y, m[3], o); }
if (rar >= 1) {
for (let x = 6; x <= 25; x++) if (col[26 * N + x] !== null) set(x, 26, trim[1], o);
set(12, 6, trim[0], o); set(13, 7, trim[0], o); set(14, 8, trim[0], o); set(19, 6, trim[2], o); set(18, 7, trim[2], o); set(17, 8, trim[2], o);
}
if (rar >= 2) {
for (let y = 4; y <= 12; y++) for (let x = 3; x <= 28; x++) {
const cx = x < 16 ? 6.5 : 24.5;
const e = Math.pow((x - cx) / 3.6, 2) + Math.pow((y - 8) / 3.3, 2);
if (e <= 1) set(x, y, y >= 10 ? trim[1] : (x < 16 ? (y < 8 ? m[0] : m[1]) : (y < 8 ? m[1] : m[3])), o);
}
set(15, 10, WHITE, o); set(16, 10, gem[0], o);
set(14, 11, gem[0], o); set(15, 11, gem[0], o); set(16, 11, gem[1], o); set(17, 11, gem[1], o);
set(15, 12, gem[1], o); set(16, 12, gem[1], o);
}
if (rar >= 3) {
set(6, 4, trim[0], o); set(6, 3, WHITE, o); set(7, 4, trim[0], o);
set(25, 4, trim[1], o); set(25, 3, trim[0], o); set(24, 4, trim[1], o);
}
if (rar === 4) {
const rays = [[13, 10], [12, 9], [18, 10], [19, 9], [13, 12], [12, 13], [18, 12], [19, 13]];
for (let k = 0; k < rays.length; k++) set(rays[k][0], rays[k][1], trim[0], o);
}
noun = leather ? 'Jerkin' : (rar >= 2 ? 'Cuirass' : 'Hauberk');
parts = (leather ? 'stitched leather' : 'banded plate') + (rar >= 1 ? ', trimmed seam' : '') + (rar >= 2 ? ', pauldrons, set gem' : '') + (rar >= 3 ? ', shoulder spikes' : '') + ', belt and tassets';
}
}
const fin = col.slice();
const at = (x, y) => (x >= 0 && x < N && y >= 0 && y < N) ? col[y * N + x] : null;
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
const i = y * N + x;
if (col[i] !== null) continue;
if (at(x + 1, y) !== null) fin[i] = olc[i + 1];
else if (at(x, y + 1) !== null) fin[i] = olc[i + N];
else if (at(x - 1, y) !== null) fin[i] = olc[i - 1];
else if (at(x, y - 1) !== null) fin[i] = olc[i - N];
}
const ring = (src) => {
const o = {};
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
const i = y * N + x;
if (fin[i] !== null || src(i)) continue;
if ((x > 0 && src(i - 1)) || (x < N - 1 && src(i + 1)) || (y > 0 && src(i - N)) || (y < N - 1 && src(i + N))) o[i] = true;
}
return o;
};
let g1 = {};
let g2 = {};
if (rar >= 3) {
g1 = ring((i) => fin[i] !== null);
const r2 = ring((i) => g1[i] === true);
for (const k in r2) if (g1[k] !== true) g2[k] = true;
}
const runs = (test) => {
let d = '';
for (let y = 0; y < N; y++) {
let x = 0;
while (x < N) {
if (test(y * N + x)) {
let w = 1;
while (x + w < N && test(y * N + x + w)) w++;
d += 'M' + x + ' ' + y + 'h' + w + 'v1h-' + w + 'z';
x += w;
} else x++;
}
}
return d;
};
const colors = [];
for (let i = 0; i < N * N; i++) if (fin[i] !== null && colors.indexOf(fin[i]) < 0) colors.push(fin[i]);
const it = {};
const S = 22;
for (let s = 0; s < S; s++) {
if (s < colors.length) {
const c = colors[s];
const last = s === S - 1 && colors.length > S;
it['d' + s] = runs((i) => last ? (fin[i] !== null && colors.indexOf(fin[i]) >= S - 1) : fin[i] === c);
it['f' + s] = c;
} else { it['d' + s] = ''; it['f' + s] = 'none'; }
}
it.g1 = runs((i) => g1[i] === true);
it.g2 = runs((i) => g2[i] === true);
let sa = '';
let sb = '';
if (rar === 4) {
const cand = [];
for (const k in g2) { const i = +k; const x = i % N; const y = Math.floor(i / N); if (x >= 2 && x <= 29 && y >= 2 && y <= 29) cand.push(i); }
for (let n = 0; n < 3 && cand.length > 0; n++) {
const i = cand[Math.floor(R() * cand.length)];
const x = i % N;
const y = Math.floor(i / N);
let d = 'M' + x + ' ' + y + 'h1v1h-1z';
const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (let k = 0; k < 4; k++) { const j = (y + nb[k][1]) * N + x + nb[k][0]; if (fin[j] === null) d += 'M' + (x + nb[k][0]) + ' ' + (y + nb[k][1]) + 'h1v1h-1z'; }
if (n < 2) sa += d; else sb += d;
}
}
it.sa = sa;
it.sb = sb;
const SUF = ['of the Wolf', 'of the Mill', 'of Gloomfen', 'of the Long Road', 'of Stillness'];
const PRE = [['Worn', 'Chipped', 'Plain', 'Old'], ['Sturdy', 'Tempered', 'Keen', 'Trimmed']];
let name = '';
if (rar <= 1) name = pick(PRE[rar]) + ' ' + metal[5] + ' ' + noun;
else if (rar <= 3) name = metal[5] + ' ' + noun + ' ' + pick(SUF);
else name = metal[5] + ', ' + noun + ' ' + pick(SUF);
const MAIN = ['Strength', 'Strength', 'Intellect', 'Stamina', 'Stamina'];
const SEC = [['Agility', 'Stamina'], ['Stamina', 'Agility'], ['Spirit', 'Stamina'], ['Agility', 'Strength'], ['Strength', 'Spirit']];
const v1 = 1 + rar * 3 + ri(0, 2);
const v2 = rar >= 1 ? rar + ri(0, 2) : 0;
it.name = name;
it.rarity = RN[rar];
it.rc = RC[rar];
it.fr = FR[rar];
it.bg = BG[rar];
it.s1 = '+' + v1 + ' ' + MAIN[type];
it.s2 = v2 > 0 ? '+' + v2 + ' ' + pick(SEC[type]) : '';
it.parts = parts;
return it;
}
renderVals() {
const st = this.state || {};
const seed = st.seed == null ? 3 : st.seed;
const picked = st.picked == null ? 20 : st.picked;
const items = [];
for (let r = 0; r < 5; r++) for (let t = 0; t < 5; t++) {
const idx = r * 5 + t;
const it = this.gen(t, r, this.rng(seed * 7919 + idx * 104729 + 13));
it.ring = idx === picked ? '#F4EFD8' : 'rgba(0,0,0,0)';
it.pick = () => this.setState({ picked: idx });
items.push(it);
}
return {
r0: items.slice(0, 5), r1: items.slice(5, 10), r2: items.slice(10, 15), r3: items.slice(15, 20), r4: items.slice(20, 25),
sel: items[picked],
reroll: () => this.setState({ seed: seed + 1 })
};
}
}
return Component;
})();
const Sets = (function () {
class DCLogic {}
class Component extends DCLogic {
rng(seed) {
let a = seed >>> 0;
return function () {
a = (a + 0x6D2B79F5) | 0;
let t = Math.imul(a ^ (a >>> 15), 1 | a);
t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
}
gen(type, si) {
const SETS = [
{ name: 'Sunforged', motif: 'sun', glow: '#FFCF4A', bg: '#4A3A26', sig: 'gold metal, halos, crowns and sun rays',
metal: ['#FFFBD8', '#FFD860', '#F09A30', '#B0502C', '#3A1420'], trim: ['#FFFFFF', '#FFF0A0', '#FFC040'], gem: ['#6AD0FF', '#2A6AC0'],
wood: ['#E8B080', '#B87850', '#804848', '#522E40'], grip: ['#E0705A', '#A04050'], nouns: ['Leafblade', 'Sun Axe', 'Halo Staff', 'Crown Helm', 'Cuirass'] },
{ name: 'Rimebound', motif: 'rime', glow: '#7FE6FF', bg: '#1E3352', sig: 'ice blue, jagged shards and crystal spikes',
metal: ['#FFFFFF', '#BEEBFF', '#6FB4E8', '#3A6AB0', '#12244E'], trim: ['#FFFFFF', '#DDF4FF', '#9AD0F0'], gem: ['#B8FFF4', '#3FB8C8'],
wood: ['#C8D8E8', '#8EA4C0', '#5A6E98', '#34406A'], grip: ['#6A8AD0', '#3A4E90'], nouns: ['Shardblade', 'Glacier Axe', 'Crystal Staff', 'Frost Barbute', 'Icebound Plate'] },
{ name: 'Nightbloom', motif: 'night', glow: '#E070FF', bg: '#2E1B4E', sig: 'deep purple, thorns, crescents and glowing eyes',
metal: ['#C9A8F0', '#7E58B8', '#4A2E80', '#2A1650', '#0E0624'], trim: ['#FFB0E0', '#F060B8', '#A03090'], gem: ['#FF6AC8', '#A0308A'],
wood: ['#9080A8', '#5E5080', '#3A3058', '#241C3C'], grip: ['#F060B8', '#8A2E7A'], nouns: ['Thorn Sabre', 'Crescent Axe', 'Moon-Eye Staff', 'Horned Visor', 'Thorned Cuirass'] },
{ name: 'Wildroot', motif: 'wild', glow: '#8CE06A', bg: '#22382A', sig: 'leaf green, bark and bone, antlers and leaves',
metal: ['#F4F0C8', '#B8D070', '#6E9A48', '#3E6238', '#14281E'], trim: ['#FFF6D8', '#E8D8A8', '#B09868'], gem: ['#B8FF6A', '#4AA838'],
wood: ['#D8A070', '#A06840', '#70442E', '#48282A'], grip: ['#8A6A4A', '#5A4028'], nouns: ['Leaf Sword', 'Bearded Axe', 'Antler Staff', 'Antler Helm', 'Bark Jerkin'] },
{ name: 'Emberheart', motif: 'ember', glow: '#FF6A3C', bg: '#3A1E22', sig: 'black iron, molten cracks and flame cores',
metal: ['#8A7C90', '#5A4C64', '#3A2E44', '#221A2C', '#0C0810'], trim: ['#FFE9A0', '#FF9A3C', '#D8402C'], gem: ['#FFD860', '#F0602C'],
wood: ['#6A5060', '#4A3444', '#30202E', '#1E141E'], grip: ['#D8402C', '#8A2430'], nouns: ['Flameblade', 'Molten Greataxe', 'Brazier Staff', 'Horned Barbute', 'Cracked Plate'] }
];
const S = SETS[si];
const mf = S.motif;
const metal = S.metal;
const mo = metal[4];
const trim = S.trim;
const gem = S.gem;
const wood = S.wood;
const grip = S.grip;
const WHITE = '#FFFFFF';
const PLUM = '#2A1428';
const VOID = '#1A1238';
const N = 32;
const col = [];
const olc = [];
for (let i = 0; i < N * N; i++) { col.push(null); olc.push(null); }
const set = (x, y, c, o) => { if (x >= 3 && x <= 28 && y >= 3 && y <= 28) { col[y * N + x] = c; olc[y * N + x] = o; } };
const cells = (list, c, o) => { for (let k = 0; k < list.length; k++) set(list[k][0], list[k][1], c, o); };
const mirror = (list, cl, cr, o) => { for (let k = 0; k < list.length; k++) { set(list[k][0], list[k][1], cl, o); set(31 - list[k][0], list[k][1], cr, o); } };
const diag = (fn) => {
for (let y = 3; y <= 28; y++) for (let x = 3; x <= 28; x++) {
const r = fn(x - y + 25, x + y - 31);
if (r) set(x, y, r[0], r[1]);
}
};
const tri = (p) => p < 0 ? trim[0] : (p === 0 ? trim[1] : trim[2]);
const woodC = (p) => p < 0 ? wood[1] : (p === 0 ? wood[2] : wood[3]);
if (type === 0) {
const cfg = { sun: [1, 48, 4, 9, 1], rime: [0, 49, 3, 8, 0], night: [2, 44, 4, 8, -1], wild: [1, 46, 4, 5, 0], ember: [3, 48, 4, 9, 1] }[mf];
const shape = cfg[0];
const L = cfg[1];
const W = cfg[2];
const G = cfg[3];
const dir = cfg[4];
const off = (a) => shape === 2 ? Math.round(6 * Math.pow((a - 16) / (L - 16), 2)) : 0;
const wid = (a) => {
let b = W;
const f = (a - 16) / (L - 16);
if (shape === 1 && f > 0.35 && f < 0.8) b = W + 1;
if (shape === 3) b = W + ((Math.floor(a / 3) % 2) ? 1 : -1);
return Math.min(b, L - a);
};
const fullC = mf === 'sun' ? metal[3] : (mf === 'rime' ? trim[0] : trim[1]);
diag((a, p) => {
const ap = Math.abs(p);
if (Math.abs(a - 14) <= 2 && ap <= 2) return [(a === 15 && p === -1) ? WHITE : (p <= 0 ? gem[0] : gem[1]), mo];
if (mf === 'wild' && (a - 15) * (a - 15) / 9 + (ap - 7) * (ap - 7) / 4 <= 1) return [ap === 7 ? trim[1] : (p < 0 ? gem[0] : gem[1]), mo];
if (mf === 'rime' && ap >= G - 2 && ap <= G + 2 && Math.abs(a - 14) <= G + 3 - ap) return [p < 0 ? trim[0] : trim[2], mo];
const sh = ap > G - 3 ? 2 * dir : 0;
if (a >= 13 + sh && a <= 15 + sh && ap <= G) return [p <= -2 ? trim[0] : (p >= 2 ? trim[2] : trim[1]), mo];
const pd = (a - 3) * (a - 3) + p * p;
if (pd <= 2) return [p < 0 ? WHITE : gem[0], mo];
if (pd <= 10) return [tri(p), mo];
if (a >= 5 && a <= 12 && ap <= 1) return [(Math.floor(a / 2) % 2 === 0) ? grip[0] : grip[1], PLUM];
if (a >= 16 && a <= L) {
const pp = p - off(a);
const w = wid(a);
const app = Math.abs(pp);
if (mf === 'rime' && a % 7 <= 1 && a < L - 6 && app > w && app <= w + 2) return [pp < 0 ? metal[0] : metal[2], mo];
if (mf === 'night' && a % 6 <= 1 && a < L - 6 && pp < -w && pp >= -w - 2) return [metal[1], mo];
if (app <= w) {
if ((mf === 'sun' || mf === 'rime') && pp === 0 && a % 8 === 0 && a >= 20 && a <= L - 6) return [WHITE, mo];
if (mf === 'ember' && app <= 1 && a < L - 4) return [pp === 0 ? trim[0] : trim[1], mo];
if ((pp === 0 || pp === 1) && a < L - 5) return [fullC, mo];
if (pp < 0) return [pp <= -(w - 1) ? metal[0] : metal[1], mo];
if (pp === 0) return [metal[1], mo];
return [pp >= w - 1 ? metal[3] : metal[2], mo];
}
}
return null;
});
} else if (type === 1) {
const ah = 34;
const A = { sun: [1, 13, 0.85, 14, 0], rime: [0, 13, 0.7, 14, 2], night: [1, 13, 0.85, 10, 0], wild: [0, 12, 0.55, 14, 4], ember: [1, 13, 0.7, 10, 2] }[mf];
const dbl = A[0] === 1;
const H = A[1];
const flare = A[2];
const cv = A[3];
const beard = A[4];
const headAt = (a, q) => {
if (q < 2) return null;
const Hl = H - (a - ah) * (a - ah) / cv - ((mf === 'rime' && a % 4 < 2) ? 2 : 0);
if (q > Hl) return null;
const lim = 2 + flare * q + (a < ah ? beard * q / H : 0);
if (Math.abs(a - ah) > lim) return null;
if (mf === 'night' && q > 3 && q < Hl - 5 && Math.abs(a - ah) > 1) return null;
if (q >= Hl - 2) return mf === 'ember' ? trim[1] : metal[0];
if (q >= Hl - 4) return mf === 'ember' ? trim[2] : metal[1];
if (q <= 3) return metal[3];
if (q >= Hl - 7) return (q % 2 === 0) ? metal[1] : metal[2];
return metal[2];
};
diag((a, p) => {
const ap = Math.abs(p);
if (Math.abs(a - ah) <= 1 && ap <= 1) return [(a === ah + 1 && p === -1) ? WHITE : (p <= 0 ? gem[0] : gem[1]), mo];
if (Math.abs(a - ah) <= 3 && ap <= 1) return [tri(p), mo];
let c = headAt(a, -p);
if (c) return [(mf !== 'night' && mf !== 'ember' && a === ah && -p >= 3 && -p <= H - 3) ? trim[1] : c, mo];
if (dbl) {
c = headAt(a, p);
if (c) return [mf === 'ember' ? c : (c === metal[0] ? metal[1] : (c === metal[1] ? metal[2] : metal[3])), mo];
} else if (mf === 'rime') {
if (p >= 2 && p <= 8 && Math.abs(a - ah) <= (9 - p) / 2) return [p >= 6 ? trim[0] : metal[1], mo];
} else if (mf === 'wild') {
if ((a - ah - 4) * (a - ah - 4) / 12 + (p - 4) * (p - 4) / 5 <= 1 || (a - ah + 4) * (a - ah + 4) / 12 + (p - 4) * (p - 4) / 5 <= 1) return [p === 4 ? trim[1] : (p < 4 ? gem[0] : gem[1]), mo];
}
if (a > 43 && a <= 47 && ap <= Math.min(1, 47 - a)) return [p < 0 ? metal[0] : metal[2], mo];
if (a >= 1 && a <= 43 && ap <= 1) {
if (a <= 2) return [trim[1], mo];
if ((a >= 7 && a <= 10) || (a >= 14 && a <= 17)) return [(a % 2 === 0) ? grip[0] : grip[1], PLUM];
return [woodC(p), PLUM];
}
return null;
});
} else if (type === 2) {
const hc = 38;
const gemC = (da, p) => [((da === 1 && p === -1) || (da === 0 && p === -2)) ? WHITE : ((p < 0 || (p === 0 && da > 0)) ? gem[0] : gem[1]), mo];
const met = (p) => [p < -2 ? metal[0] : (p < 0 ? metal[1] : (p < 3 ? metal[2] : metal[3])), mo];
const sTop = mf === 'wild' ? 34 : 32;
diag((a, p) => {
const ap = Math.abs(p);
const da = a - hc;
const ad = Math.abs(da);
const d2 = da * da + p * p;
if (mf === 'sun') {
if (d2 <= 20) return gemC(da, p);
if (d2 >= 34 && d2 <= 62) return [p < -2 ? trim[0] : (p < 2 ? trim[1] : trim[2]), mo];
if ((ap <= 1 && da >= 9 && da <= 11) || (ad <= 1 && ap >= 9 && ap <= 11) || (ad === ap && ap >= 6 && ap <= 7 && da > 0)) return [trim[1], mo];
} else if (mf === 'rime') {
if ((da - 1 < 0 ? -(da - 1) : da - 1) / 9 + ap / 4 <= 1) return [p < -1 ? WHITE : (p < 1 ? metal[1] : (p < 3 ? metal[2] : metal[3])), mo];
if (Math.abs(da + 3) / 5 + Math.abs(ap - 6) / 2.5 <= 1) return [p < 0 ? metal[0] : metal[2], mo];
if (d2 >= 30 && d2 <= 52 && da < -2) return [trim[2], mo];
} else if (mf === 'night') {
if (d2 <= 20) return [(p === 0 && ad <= 2) ? VOID : gemC(da, p)[0], mo];
if (d2 >= 34 && d2 <= 80 && da < 4) return met(p);
} else if (mf === 'wild') {
if (d2 <= 13 && da >= 0) return gemC(da, p);
if (ap >= 3 && ap <= 4 && a >= 33 && a <= 45) return [p < 0 ? trim[0] : trim[2], mo];
if (ap >= 6 && ap <= 7 && a >= 38 && a <= 43) return [p < 0 ? trim[0] : trim[2], mo];
if (ap === 5 && a >= 37 && a <= 39) return [trim[1], mo];
if (ap <= 2 && a >= 33 && a <= 35) return [trim[1], mo];
if ((a - 30) * (a - 30) / 9 + (ap - 4) * (ap - 4) / 4 <= 1) return [p < 0 ? gem[0] : gem[1], mo];
} else {
if (da >= -3 && da <= 10 && ap <= (da < 2 ? 4 : (10 - da) / 2)) return [(ap <= 1 && da < 6) ? trim[0] : ((ap <= 2 && da < 8) ? trim[1] : trim[2]), mo];
if (d2 >= 20 && d2 <= 52 && da < 0) return met(p);
}
if (a >= 1 && a <= sTop && ap <= 1) {
if (a <= 2 || (a >= 10 && a <= 12) || (a >= 26 && a <= 28)) return [tri(p), mo];
if (a >= 15 && a <= 21) return [(Math.floor(a / 2) % 2 === 0) ? grip[0] : grip[1], PLUM];
return [woodC(p), PLUM];
}
return null;
});
} else {
const shade = (x, y, hw, m, lift) => {
const f = (x - 15.5) / hw - (lift ? 0.2 : 0);
const ch = (x + y) % 2 === 0;
if (f < -0.75) return m[1];
if (f < -0.45) return m[0];
if (f < -0.15) return m[1];
if (f < 0.05) return ch ? m[1] : m[2];
if (f < 0.45) return m[2];
if (f < 0.65) return ch ? m[2] : m[3];
return m[3];
};
if (type === 3) {
const hwAt = (y) => y === 5 ? 3 : (y === 6 ? 5 : (y === 7 ? 7 : (y === 8 ? 8 : (y <= 10 ? 9 : (y <= 23 ? 10 : (y === 24 ? 9 : 8))))));
for (let y = 5; y <= 25; y++) {
const hw = hwAt(y);
for (let x = 16 - hw; x <= 15 + hw; x++) set(x, y, shade(x, y, hw, metal, y <= 7), mo);
}
const style = { sun: 0, rime: 2, night: 1, wild: 0, ember: 2 }[mf];
if (style === 0) {
for (let y = 14; y <= 25; y++) for (let x = (y === 14 ? 11 : 10); x <= (y === 14 ? 20 : 21); x++) set(x, y, VOID, mo);
for (let y = 14; y <= 20; y++) { set(15, y, metal[1], mo); set(16, y, metal[3], mo); }
} else if (style === 1) {
for (let y = 14; y <= 15; y++) for (let x = 8; x <= 23; x++) if (x !== 15 && x !== 16) set(x, y, VOID, mo);
for (let y = 19; y <= 23; y++) { set(11, y, VOID, mo); set(13, y, VOID, mo); set(18, y, VOID, mo); set(20, y, VOID, mo); }
} else {
for (let y = 13; y <= 15; y++) for (let x = 9; x <= 22; x++) set(x, y, VOID, mo);
for (let y = 16; y <= 25; y++) for (let x = 14; x <= 17; x++) set(x, y, VOID, mo);
}
if (mf !== 'ember') {
for (let x = 6; x <= 25; x++) { set(x, 10, x < 16 ? trim[0] : trim[1], mo); set(x, 11, x < 16 ? trim[1] : trim[2], mo); }
}
set(15, 9, gem[0], mo); set(16, 9, gem[0], mo); set(15, 10, WHITE, mo); set(16, 10, gem[0], mo);
set(15, 11, gem[0], mo); set(16, 11, gem[1], mo); set(15, 12, gem[1], mo); set(16, 12, gem[1], mo);
if (mf === 'sun') {
mirror([[15, 3], [15, 4], [12, 4], [11, 3], [8, 6], [7, 5]], trim[0], trim[1], mo);
mirror([[8, 9], [9, 9], [12, 9]], trim[1], trim[2], mo);
mirror([[8, 8], [9, 8]], trim[0], trim[1], mo);
} else if (mf === 'rime') {
set(15, 3, WHITE, mo); set(16, 3, metal[1], mo); set(15, 4, WHITE, mo); set(16, 4, metal[2], mo);
mirror([[10, 6], [10, 5], [11, 5], [11, 4]], WHITE, metal[2], mo);
mirror([[8, 26], [8, 27], [11, 26]], metal[1], metal[2], mo);
mirror([[11, 14], [12, 14]], gem[0], gem[0], mo);
} else if (mf === 'night') {
const horn = [[5, 13], [5, 12], [4, 12], [4, 11], [3, 11], [3, 10], [3, 9], [3, 8], [4, 8], [4, 7], [4, 6], [5, 6], [5, 5], [5, 4]];
for (let k = 0; k < horn.length; k++) { set(horn[k][0], horn[k][1], k >= 11 ? trim[0] : metal[1], mo); set(31 - horn[k][0], horn[k][1], k >= 11 ? trim[1] : metal[3], mo); }
cells([[15, 3], [15, 4], [16, 4]], trim[1], mo);
mirror([[10, 14], [11, 14], [11, 15]], trim[0], trim[0], mo);
} else if (mf === 'wild') {
mirror([[6, 10], [5, 9], [5, 8], [4, 8], [4, 7], [4, 6], [3, 6], [3, 5], [3, 4], [3, 3], [5, 6], [6, 5], [6, 4], [6, 3], [7, 8], [8, 7], [8, 6]], trim[0], trim[2], mo);
cells([[15, 3], [14, 4], [15, 4], [15, 5]], gem[0], mo);
cells([[16, 3], [16, 4], [17, 4], [16, 5]], gem[1], mo);
} else {
const horn = [[5, 13], [4, 13], [4, 12], [3, 12], [3, 11], [4, 11], [3, 10], [4, 10], [3, 9], [3, 8], [3, 7], [3, 6], [4, 6], [4, 5], [4, 4], [3, 3], [4, 3]];
for (let k = 0; k < horn.length; k++) { set(horn[k][0], horn[k][1], k >= 13 ? trim[1] : metal[1], mo); set(31 - horn[k][0], horn[k][1], k >= 13 ? trim[2] : metal[3], mo); }
cells([[8, 18], [9, 19], [9, 20], [8, 21], [12, 7], [13, 8], [12, 9], [22, 19], [23, 20], [22, 21], [19, 6], [20, 7], [20, 8], [10, 23], [21, 23]], trim[1], mo);
mirror([[10, 14], [11, 14], [12, 14]], trim[0], trim[0], mo);
mirror([[15, 17], [15, 19], [15, 21]], trim[2], trim[2], mo);
}
} else {
const bark = mf === 'wild';
const m = bark ? wood : metal;
const o = bark ? PLUM : mo;
const lo = [0, 0, 0, 0, 0, 0, 4, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2];
const hi = [0, 0, 0, 0, 0, 0, 10, 11, 11, 11, 11, 10, 9, 9, 9, 9, 9, 9, 8, 8, 8, 8, 9, 10, 10, 10, 10];
for (let y = 6; y <= 26; y++) for (let x = 5; x <= 26; x++) {
const d = Math.abs(x - 15.5) + 0.5;
if (d >= lo[y] && d <= hi[y]) set(x, y, shade(x, y, 10, m, false), o);
}
for (let x = 9; x <= 22; x++) { const d = Math.abs(x - 15.5); if (d >= 2 && d <= 6.5) set(x, 13, m[3], o); }
set(8, 12, m[3], o); set(23, 12, m[3], o);
const lame = bark ? trim[1] : (mf === 'rime' ? trim[0] : m[3]);
for (let x = 7; x <= 24; x++) { set(x, 16, lame, o); if (x >= 8 && x <= 23) set(x, 18, lame, o); }
for (let y = 9; y <= 19; y++) {
if (bark) { set(15, y, y % 2 ? gem[0] : m[2], o); set(16, y, y % 2 ? m[3] : gem[1], o); }
else { set(15, y, trim[0], o); set(16, y, trim[2], o); }
}
for (let x = 8; x <= 23; x++) { set(x, 20, grip[0], o); set(x, 21, grip[1], o); }
for (let x = 14; x <= 17; x++) { set(x, 20, trim[0], o); set(x, 21, trim[2], o); }
for (let y = 22; y <= 26; y++) { set(11, y, m[3], o); set(20, y, m[3], o); }
for (let x = 6; x <= 25; x++) if (col[26 * N + x] !== null) set(x, 26, trim[1], o);
set(12, 6, trim[0], o); set(13, 7, trim[0], o); set(14, 8, trim[0], o); set(19, 6, trim[2], o); set(18, 7, trim[2], o); set(17, 8, trim[2], o);
if (mf === 'rime') {
const rowsL = [[3, 4, 4], [4, 4, 5], [5, 3, 6], [6, 3, 7], [7, 3, 8], [8, 3, 9], [9, 3, 9], [10, 4, 9], [11, 5, 8]];
for (let k = 0; k < rowsL.length; k++) for (let x = rowsL[k][1]; x <= rowsL[k][2]; x++) {
set(x, rowsL[k][0], x <= 4 ? WHITE : (x <= 6 ? metal[1] : metal[2]), o);
set(31 - x, rowsL[k][0], x <= 4 ? metal[1] : (x <= 6 ? metal[2] : metal[3]), o);
}
} else {
for (let y = 4; y <= 12; y++) for (let x = 3; x <= 28; x++) {
const cx = x < 16 ? 6.5 : 24.5;
const e = Math.pow((x - cx) / 3.6, 2) + Math.pow((y - 8) / 3.3, 2);
if (e > 1) continue;
if (bark) set(x, y, y === 8 ? trim[1] : (x < cx ? gem[0] : gem[1]), o);
else set(x, y, y >= 10 ? trim[1] : (x < 16 ? (y < 8 ? m[0] : m[1]) : (y < 8 ? m[1] : m[3])), o);
}
}
set(15, 10, WHITE, o); set(16, 10, gem[0], o);
set(14, 11, gem[0], o); set(15, 11, gem[0], o); set(16, 11, gem[1], o); set(17, 11, gem[1], o);
set(15, 12, gem[1], o); set(16, 12, gem[1], o);
if (mf === 'sun') {
cells([[13, 10], [12, 9], [18, 10], [19, 9], [13, 12], [12, 13], [18, 12], [19, 13]], trim[0], o);
mirror([[6, 4], [6, 3], [7, 4]], trim[0], trim[1], o);
} else if (mf === 'night') {
mirror([[4, 4], [4, 3], [7, 4], [7, 3], [9, 5], [9, 4]], trim[0], trim[1], o);
mirror([[10, 10], [11, 11], [10, 12]], trim[1], trim[2], o);
} else if (mf === 'ember') {
mirror([[6, 4], [6, 3], [7, 4], [5, 4], [4, 5], [8, 4], [8, 3]], trim[1], trim[2], o);
cells([[9, 10], [10, 11], [10, 12], [11, 14], [12, 15], [22, 11], [21, 12], [21, 14], [20, 15], [13, 17], [18, 17], [10, 23], [9, 24], [21, 23], [22, 24], [13, 22], [18, 23]], trim[1], o);
} else if (bark) {
mirror([[9, 14], [10, 15], [9, 17], [10, 19]], gem[0], gem[1], o);
}
}
}
const fin = col.slice();
const at = (x, y) => (x >= 0 && x < N && y >= 0 && y < N) ? col[y * N + x] : null;
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
const i = y * N + x;
if (col[i] !== null) continue;
if (at(x + 1, y) !== null) fin[i] = olc[i + 1];
else if (at(x, y + 1) !== null) fin[i] = olc[i + N];
else if (at(x - 1, y) !== null) fin[i] = olc[i - 1];
else if (at(x, y - 1) !== null) fin[i] = olc[i - N];
}
const ring = (src) => {
const o = {};
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
const i = y * N + x;
if (fin[i] !== null || src(i)) continue;
if ((x > 0 && src(i - 1)) || (x < N - 1 && src(i + 1)) || (y > 0 && src(i - N)) || (y < N - 1 && src(i + N))) o[i] = true;
}
return o;
};
const g1 = ring((i) => fin[i] !== null);
const r2 = ring((i) => g1[i] === true);
const g2 = {};
for (const k in r2) if (g1[k] !== true) g2[k] = true;
const runs = (test) => {
let d = '';
for (let y = 0; y < N; y++) {
let x = 0;
while (x < N) {
if (test(y * N + x)) {
let w = 1;
while (x + w < N && test(y * N + x + w)) w++;
d += 'M' + x + ' ' + y + 'h' + w + 'v1h-' + w + 'z';
x += w;
} else x++;
}
}
return d;
};
const colors = [];
for (let i = 0; i < N * N; i++) if (fin[i] !== null && colors.indexOf(fin[i]) < 0) colors.push(fin[i]);
const it = {};
const SL = 22;
for (let s = 0; s < SL; s++) {
if (s < colors.length) {
const c = colors[s];
const last = s === SL - 1 && colors.length > SL;
it['d' + s] = runs((i) => last ? (fin[i] !== null && colors.indexOf(fin[i]) >= SL - 1) : fin[i] === c);
it['f' + s] = c;
} else { it['d' + s] = ''; it['f' + s] = 'none'; }
}
it.g1 = runs((i) => g1[i] === true);
it.g2 = runs((i) => g2[i] === true);
const R = this.rng(si * 977 + type * 131 + 5);
const cand = [];
for (const k in g2) { const i = +k; const x = i % N; const y = Math.floor(i / N); if (x >= 2 && x <= 29 && y >= 2 && y <= 29) cand.push(i); }
let sa = '';
let sb = '';
for (let n = 0; n < 3 && cand.length > 0; n++) {
const i = cand[Math.floor(R() * cand.length)];
const x = i % N;
const y = Math.floor(i / N);
let d = 'M' + x + ' ' + y + 'h1v1h-1z';
const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (let k = 0; k < 4; k++) { const j = (y + nb[k][1]) * N + x + nb[k][0]; if (fin[j] === null) d += 'M' + (x + nb[k][0]) + ' ' + (y + nb[k][1]) + 'h1v1h-1z'; }
if (n < 2) sa += d; else sb += d;
}
it.sa = sa;
it.sb = sb;
it.name = S.name + ' ' + S.nouns[type];
it.setLine = S.name + ' set, piece ' + (type + 1) + ' of 5';
it.sig = 'Signature: ' + S.sig;
it.rc = '#FFCF4A';
it.sc = S.glow;
it.bg = '#4A3A26';
return it;
}
renderVals() {
const st = this.state || {};
const picked = st.picked == null ? 5 : st.picked;
const items = [];
for (let s = 0; s < 5; s++) for (let t = 0; t < 5; t++) {
const idx = s * 5 + t;
const it = this.gen(t, s);
it.ring = idx === picked ? '#F4EFD8' : 'rgba(0,0,0,0)';
it.pick = () => this.setState({ picked: idx });
items.push(it);
}
return {
r0: items.slice(0, 5), r1: items.slice(5, 10), r2: items.slice(10, 15), r3: items.slice(15, 20), r4: items.slice(20, 25),
sel: items[picked]
};
}
}
return Component;
})();
const forge = new Forge();
const sets = new Sets();
const SLOTS = 22;
const TYPES = ['sword', 'axe', 'staff', 'helm', 'chest'];
// Rarity owns the frame, backdrop, aura, effects and name colour. It never owns the colours inside the sprite.
const RARITY = [
{ name: 'Common', color: '#D5CFF0', frame: '#6A6699', backdrop: '#2A2550', aura: false, sparkles: false },
{ name: 'Uncommon', color: '#8CE06A', frame: '#8CE06A', backdrop: '#243A45', aura: false, sparkles: false },
{ name: 'Rare', color: '#5BC8FF', frame: '#5BC8FF', backdrop: '#22335E', aura: false, sparkles: false },
{ name: 'Epic', color: '#D07BFF', frame: '#D07BFF', backdrop: '#36245E', aura: true, sparkles: false },
{ name: 'Legendary', color: '#FFCF4A', frame: '#FFCF4A', backdrop: '#4A3A26', aura: true, sparkles: true }
];
const SET_NAMES = ['Sunforged', 'Rimebound', 'Nightbloom', 'Wildroot', 'Emberheart'];
// Add this once to the page stylesheet so legendary sparkles twinkle.
const CSS = '@keyframes px-tw{0%,100%{opacity:1}50%{opacity:.1}}.px-spark{animation:px-tw 1.1s steps(2,end) infinite}.px-late{animation-delay:.55s}@media (prefers-reduced-motion: reduce){.px-spark{animation:none}}';
// A random (non-set) item. typeIndex 0-4 (see TYPES), rarityIndex 0-4 (see RARITY), seed any integer. Same inputs always give the same item.
function randomItem(typeIndex, rarityIndex, seed) {
const it = forge.gen(typeIndex, rarityIndex, forge.rng(((seed | 0) * 7919 + typeIndex * 104729 + rarityIndex * 1299709 + 13) >>> 0));
it.type = TYPES[typeIndex];
it.rarityIndex = rarityIndex;
return it;
}
// A piece of a designed set. setIndex 0-4 (see SET_NAMES). Only the legendary version of each set exists so far.
function setItem(typeIndex, setIndex) {
const it = sets.gen(typeIndex, setIndex);
it.type = TYPES[typeIndex];
it.setIndex = setIndex;
it.setName = SET_NAMES[setIndex];
it.rarityIndex = 4;
return it;
}
// Sprite as an SVG string. size is the on-screen size in CSS px: use a multiple of 32 (64 in lists, 96 in the inspect view).
// The aura and sparkles follow the rarity, never the set.
function toSVG(it, size, rarityIndex) {
const r = rarityIndex == null ? (it.rarityIndex == null ? 0 : it.rarityIndex) : rarityIndex;
const R = RARITY[r];
let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true" style="display:block">';
if (R.aura && it.g2) s += '<path d="' + it.g2 + '" fill="' + R.color + '" fill-opacity="0.22"/>';
if (R.aura && it.g1) s += '<path d="' + it.g1 + '" fill="' + R.color + '" fill-opacity="0.5"/>';
for (let k = 0; k < SLOTS; k++) if (it['d' + k]) s += '<path d="' + it['d' + k] + '" fill="' + it['f' + k] + '"/>';
if (R.sparkles && it.sa) s += '<path class="px-spark" d="' + it.sa + '" fill="#FFFFFF"/>';
if (R.sparkles && it.sb) s += '<path class="px-spark px-late" d="' + it.sb + '" fill="#FFFFFF"/>';
return s + '</svg>';
}
const api = { TYPES: TYPES, RARITY: RARITY, SET_NAMES: SET_NAMES, CSS: CSS, randomItem: randomItem, setItem: setItem, toSVG: toSVG };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PixelItems = api;
})(typeof window !== 'undefined' ? window : this);
