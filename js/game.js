// ---------- Game logic ----------
const level = () => levelInfo(state.totalXp).L;
function stats() {
  const C = CLASSES[state.cls], L = level(), s = {};
  STATS.forEach(k => { s[k] = C.base[k] + C.grow[k] * (L - 1) + (state.train[k] || 0); });
  Object.values(state.equip).forEach(id => { if (id && ITEMS[id]) Object.entries(ITEMS[id].st).forEach(([k, v]) => { s[k] += v; }); });
  return s;
}
function power() { const s = stats(), w = CLASSES[state.cls].w; return Math.round(STATS.reduce((a, k) => a + s[k] * w[k], 0)); }
function gainXp(xp) {
  const before = level();
  state.totalXp = Math.max(0, state.totalXp + xp);
  const after = level();
  if (after > before) levelUp(after);
}
function complete(id) {
  const q = Q[id], p = prog(id);
  if (p.done) return;
  const s = state.streaks[id] || { n: 0, last: null };
  const prev = { n: s.n, last: s.last };
  const n = s.last === shiftDay(-1) ? s.n + 1 : 1;
  const mult = 1 + Math.min(0.5, (n - 1) * 0.1);
  const xp = Math.round(q.xp * mult), c = Math.round(q.c * mult / 100) * 100;
  const en = state.energy < ENERGY_CAP ? 1 : 0;
  state.streaks[id] = { n, last: dayKey() };
  p.done = true; p.rw = { xp, c, en, prev };
  state.copper += c; state.energy += en; state.train[q.stat]++;
  toast(`Quest complete: ${q.name}`, 'gold');
  toast(`+${xp} XP · ${coinText(c)}${en ? ' · +1 energy' : ''} · +1 ${STAT_NAME[q.stat]}`);
  sfx.quest();
  gainXp(xp);
  if (doneCount() === QUESTS.length && !state.chest) toast("All vows kept! Claim the Champion's Cache.", 'gold');
}
function uncomplete(id) {
  const q = Q[id], p = prog(id);
  if (!p.done || !p.rw) return;
  if (state.chest) { const ch = state.chest; state.totalXp = Math.max(0, state.totalXp - ch.xp); state.copper = Math.max(0, state.copper - ch.c); state.energy = Math.max(0, state.energy - ch.en); state.chest = null; }
  state.totalXp = Math.max(0, state.totalXp - p.rw.xp);
  state.copper = Math.max(0, state.copper - p.rw.c);
  state.energy = Math.max(0, state.energy - p.rw.en);
  state.train[q.stat] = Math.max(0, state.train[q.stat] - 1);
  if (p.rw.prev.last) state.streaks[id] = p.rw.prev; else delete state.streaks[id];
  p.done = false; p.rw = null;
  toast(`${q.name} marked not done`);
}
function setVal(id, val) {
  const q = Q[id], p = prog(id), goal = state.goals[id];
  val = Math.max(0, Math.round(val));
  if (q.id in state.totals) state.totals[q.id] = Math.max(0, state.totals[q.id] + (val - p.val));
  p.val = val;
  if (!p.done && val >= goal) complete(id);
  else if (p.done && val < goal) uncomplete(id);
}
function claimChest() {
  if (state.chest || doneCount() < QUESTS.length) return;
  const en = Math.min(CHEST.en, ENERGY_CAP - state.energy);
  state.chest = { xp: CHEST.xp, c: CHEST.c, en };
  state.copper += CHEST.c; state.energy += en;
  toast(`Champion's Cache: +${CHEST.xp} XP · ${coinText(CHEST.c)}${en ? ` · +${en} energy` : ''}`, 'gold');
  sfx.coin();
  gainXp(CHEST.xp);
}
const coinText = c => { const g = Math.floor(c / 10000), s = Math.floor(c % 10000 / 100), cc = c % 100; return [g && g + 'g', s && s + 's', cc && cc + 'c'].filter(Boolean).join(' ') || '0c'; };
function winChance(z) { return Math.max(0.05, Math.min(0.95, 0.75 * power() / z.pow)); }

function venture(zid) {
  const z = ZONES.find(x => x.id === zid);
  if (!z || ui.busy || state.energy < 1 || level() < z.lvl) return;
  ui.busy = true; ui.logZone = zid;
  state.energy -= 1;
  const chance = winChance(z), won = Math.random() < chance;
  const lines = [
    { t: `You venture into ${z.name}.` },
    { t: `${z.foe} ${z.arrive}!` },
    { t: CLASSES[state.cls].strike },
  ];
  let reward = null;
  if (won) {
    const c = rand(z.g[0], z.g[1]);
    let drop = null;
    if (!state.owned.includes(z.drop) && Math.random() < 0.18) drop = z.drop;
    reward = { xp: z.xp, c, drop };
    lines.push({ t: `Victory! +${z.xp} XP · ${coinText(c)}`, cls: 'win' });
    if (drop) lines.push({ t: `Loot: [${ITEMS[drop].n}]`, cls: 'loot r-' + ITEMS[drop].r, item: drop });
  } else {
    const xp = Math.round(z.xp * 0.25);
    reward = { xp, c: 0, drop: null };
    lines.push({ t: `You are overwhelmed and limp back to camp. +${xp} XP for the lesson.`, cls: 'lose' });
  }
  ui.log = [];
  persist();
  render();
  lines.forEach((ln, i) => setTimeout(() => {
    ui.log.push(ln);
    if (i === lines.length - 1) {
      state.copper += reward.c;
      if (reward.drop) state.owned.push(reward.drop);
      if (won) { state.wins = (state.wins || 0) + 1; sfx.win(); } else sfx.lose();
      gainXp(reward.xp);
      ui.busy = false;
      persist();
    }
    render();
  }, 450 * (i + 1)));
}

function buy(id) {
  const it = ITEMS[id];
  if (!it || state.owned.includes(id) || state.copper < it.price || level() < it.lvl) return;
  state.copper -= it.price; state.owned.push(id);
  state.equip[it.slot] = id;
  toast(`Bought and equipped ${it.n}`, 'gold'); sfx.coin();
}
function equip(id) { const it = ITEMS[id]; if (!it || level() < it.lvl) return; state.equip[it.slot] = id; }
function unequip(slot) { state.equip[slot] = null; }
function sell(id) {
  const it = ITEMS[id];
  if (!it || Object.values(state.equip).includes(id)) return;
  const val = Math.max(1, Math.floor(it.price / 4));
  state.owned = state.owned.filter(x => x !== id);
  state.copper += val;
  toast(`Sold ${it.n} for ${coinText(val)}`); sfx.coin();
}

// ---------- Feedback ----------
function toast(text, kind) {
  const el = document.createElement('div');
  el.className = 'toast';
  if (kind === 'gold') el.style.color = 'var(--gold)';
  el.textContent = text;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 2700);
}
function levelUp(L) {
  const box = document.getElementById('levelup');
  box.innerHTML = `<div><b>Level ${L}</b><span>You feel stronger.</span></div>`;
  sfx.level();
  setTimeout(() => { box.innerHTML = ''; }, 2900);
}
