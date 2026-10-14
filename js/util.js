// ---------- Helpers ----------
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shiftDay = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dayKey(d); };
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const xpFor = L => Math.round(100 * Math.pow(L, 1.5));
function levelInfo(total) {
  let L = 1, rest = total;
  while (L < MAX_LVL && rest >= xpFor(L)) { rest -= xpFor(L); L++; }
  return { L, into: rest, need: L >= MAX_LVL ? 0 : xpFor(L) };
}
function money(c) {
  c = Math.max(0, Math.round(c));
  const g = Math.floor(c / 10000), s = Math.floor((c % 10000) / 100), cc = c % 100;
  const parts = [];
  if (g) parts.push(`<b>${fmtNum(g)}<i class="coin g"></i></b>`);
  if (s) parts.push(`<b>${s}<i class="coin s"></i></b>`);
  if (cc || !parts.length) parts.push(`<b>${cc}<i class="coin c"></i></b>`);
  return `<span class="money" aria-label="${g} gold ${s} silver ${cc} copper">${parts.join('')}</span>`;
}
const statLine = st => Object.entries(st).map(([k, v]) => `+${v} ${STAT_NAME[k]}`).join(', ');
const BOLT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>';

// ---------- Sound ----------
let ac = null;
function tone(freqs, step = 0.09, dur = 0.35, type = 'triangle', vol = 0.12) {
  if (!ac) return;
  freqs.forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + i * step;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  });
}
const sfx = {
  quest: () => tone([523, 659, 784, 1047]),
  level: () => tone([392, 523, 659, 784, 1047, 1319], 0.08, 0.6, 'triangle', 0.14),
  coin: () => tone([1568, 2093], 0.06, 0.15, 'square', 0.04),
  win: () => tone([440, 554, 659], 0.1, 0.4),
  lose: () => tone([330, 262, 196], 0.14, 0.45, 'sawtooth', 0.05),
};
document.addEventListener('pointerdown', () => {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
  if (ac && ac.state === 'suspended') ac.resume();
}, { capture: true });
