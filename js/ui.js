// ---------- Render ----------
const app = document.getElementById('app');
function render() {
  if (!state) { app.innerHTML = renderCreate(); return; }
  const li = levelInfo(state.totalXp), C = CLASSES[state.cls];
  const pct = li.need ? Math.min(100, li.into / li.need * 100) : 100;
  const cacheReady = doneCount() === QUESTS.length && !state.chest;
  app.innerHTML = `
    <header class="frame">
      <div class="sigil" aria-hidden="true">${art(state.cls)}<span class="lvl">${li.L}</span></div>
      <div class="who">
        <div class="name">${esc(state.name)} <small>Level ${li.L} ${C.name}</small></div>
        <div class="xpbar" role="progressbar" aria-label="Experience" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i><span>${li.need ? `${fmtNum(li.into)} / ${fmtNum(li.need)} XP` : 'Max level'}</span></div>
      </div>
      <div class="purse">${money(state.copper)}<span class="energy" title="Energy">${BOLT}${state.energy}/${ENERGY_CAP}</span></div>
    </header>
    ${ui.tab === 'quests' ? renderQuests() : ui.tab === 'hero' ? renderHero() : ui.tab === 'vendor' ? renderVendor() : renderAdventure()}
    <div class="tabs"><nav aria-label="Sections">
      ${tabBtn('quests', 'Quests', '<path d="M6 3h10l2 2v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>', cacheReady)}
      ${tabBtn('hero', 'Hero', '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')}
      ${tabBtn('vendor', 'Vendor', '<path d="M4 9h16l-1.5 11h-13z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/>')}
      ${tabBtn('adventure', 'Adventure', '<path d="M14.5 3 21 3 21 9.5 9 21.5 2.5 15z" transform="scale(.85) translate(2 2)"/><path d="M5 19l3-3M13 7l4 4"/>', state.energy > 0)}
    </nav></div>`;
}
function tabBtn(id, label, path, dot) {
  return `<button type="button" data-a="tab" data-v="${id}" ${ui.tab === id ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg><span class="${dot && ui.tab !== id ? 'dot' : ''}">${label}</span></button>`;
}

function renderCreate() {
  return `<div class="create">
    <h1>Ironvow</h1>
    <p class="tag">Every vow you keep in real life makes your hero stronger. Walk, train, rest your mind and eat well to earn experience, gold and gear.</p>
    <div class="panel" style="display:grid;gap:10px">
      <label class="label" for="heroName">Name your hero</label>
      <div class="set-row"><input id="heroName" maxlength="16" autocomplete="off" placeholder="e.g. Adamar" value=""></div>
    </div>
    <div class="label">Choose a class</div>
    <div class="classes">${Object.entries(CLASSES).map(([k, c]) => `<button type="button" class="cls" data-a="pickcls" data-v="${k}" aria-pressed="${ui.createCls === k}"><span class="emb">${art(k)}</span><b>${c.name}</b><span>${c.blurb}</span></button>`).join('')}</div>
    <button type="button" class="btn primary" id="beginBtn" data-a="begin" disabled>Begin your journey</button>
    <div class="panel" style="display:grid;gap:10px;margin-top:8px">
      <h3>Already have a hero?</h3>
      <textarea id="importBox" class="codebox" rows="3" placeholder="Paste your save code (starts with IRONVOW1:)" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
      <button type="button" class="btn" data-a="import">Restore hero</button>
    </div>
  </div>`;
}

function renderQuests() {
  const d = doneCount(), total = QUESTS.length;
  const ready = d === total && !state.chest;
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return `<section class="pane">
    <div class="dayline"><h2>Daily Quests</h2><span class="muted num">${d}/${total} · ${dateStr}</span></div>
    ${QUESTS.map(renderQuest).join('')}
    <div class="panel chest ${ready ? 'ready' : ''}">
      <div style="display:grid;gap:3px">
        <h3 class="${state.chest ? '' : 'r-epic'}">Champion's Cache</h3>
        <span class="muted" style="font-size:.9rem">${state.chest ? 'Claimed today. A fresh cache waits tomorrow.' : `Keep all ${total} vows today: +${CHEST.xp} XP, ${coinText(CHEST.c)}, +${CHEST.en} energy.`}</span>
      </div>
      ${state.chest ? '<span class="streak">Claimed</span>' : `<button type="button" class="btn primary" data-a="chest" ${ready ? '' : 'disabled'}>Claim</button>`}
    </div>
    <p class="muted" style="margin:0;font-size:.85rem">Quests reset at midnight. Keep a quest several days in a row for up to +50% rewards. Enter your steps from the Health app.</p>
  </section>`;
}
function renderQuest(q) {
  const p = state.progress[q.id] || { val: 0, done: false };
  const goal = state.goals[q.id];
  const st = streakOf(q.id);
  const nextN = (state.streaks[q.id] && state.streaks[q.id].last === shiftDay(-1)) ? state.streaks[q.id].n + 1 : 1;
  const mult = p.done ? null : 1 + Math.min(0.5, (nextN - 1) * 0.1);
  const xp = p.done ? p.rw.xp : Math.round(q.xp * mult);
  const c = p.done ? p.rw.c : Math.round(q.c * mult / 100) * 100;
  let body = '';
  if (q.type === 'num') {
    const pct = Math.min(100, p.val / goal * 100);
    body = `<div class="prog"><div class="prog-bar"><i style="width:${pct}%"></i></div>
      <div class="prog-text"><span>${q.fmt(p.val)} / ${q.fmt(goal)}</span><span class="muted">${Math.floor(pct)}%</span></div></div>
      ${ui.setOpen === q.id
        ? `<div class="set-row"><input id="setInput" type="number" inputmode="numeric" min="0" value="${p.val}" aria-label="Today's total in ${q.unit}"><button type="button" class="btn primary" data-a="setsave" data-v="${q.id}">Save</button><button type="button" class="btn ghost" data-a="setcancel">Cancel</button></div>`
        : `<div class="chips">${q.chips.map(v => `<button type="button" class="btn" data-a="add" data-v="${q.id}" data-n="${v}">${q.chipLabel(v)}</button>`).join('')}<button type="button" class="btn ghost" data-a="setopen" data-v="${q.id}">Set total</button></div>`}`;
  } else {
    body = p.done
      ? `<div class="chips"><button type="button" class="btn ghost" data-a="uncheck" data-v="${q.id}">${q.undoLabel || 'I broke the vow'}</button></div>`
      : `<div class="chips"><button type="button" class="btn primary" data-a="check" data-v="${q.id}">${q.doLabel || 'Vow kept today'}</button></div>`;
  }
  return `<article class="panel quest ${p.done ? 'done' : ''}">
    <div class="q-top"><div class="qicon" aria-hidden="true">${art(QUEST_ART[q.id])}<span class="badge">${p.done ? '✓' : '!'}</span></div>
      <div class="q-body"><h3>${q.name}</h3><p>${q.text(goal)}</p>
        <div class="q-reward"><span class="xp">${xp} XP</span>${money(c)}<span>+1 ${STAT_NAME[q.stat]}</span>${st ? `<span class="streak">${st}-day streak</span>` : ''}</div>
      </div></div>
    ${body}
  </article>`;
}

function itemRow(id, actions, extra = '') {
  const it = ITEMS[id];
  return `<div class="item"><div class="icon r-${it.r}">${itemArt(id)}</div>
    <div class="meta"><span class="iname r-${it.r}">${it.n}</span><span class="istats">${statLine(it.st)}</span>${extra}</div>
    <div class="acts">${actions}</div></div>`;
}
function renderHero() {
  const s = stats(), C = CLASSES[state.cls];
  const bag = state.owned.filter(id => !Object.values(state.equip).includes(id));
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const k = shiftDay(-i);
    const n = i === 0 ? doneCount() : (state.history[k] || 0);
    const lvl = n >= QUESTS.length ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
    days.push(`<i class="${lvl ? 'l' + lvl : ''} ${i === 0 ? 'today' : ''}" title="${k}: ${n}/${QUESTS.length}"></i>`);
  }
  return `<section class="pane">
    <div class="panel">
      <div class="sect-head"><h2>${esc(state.name)}</h2><span class="muted">Level ${level()} ${C.name}</span></div>
      <div class="stats" style="margin-top:10px">${STATS.map(k => `<div class="stat"><span>${STAT_NAME[k]}</span><span>${s[k]}${state.train[k] ? ` <small>(+${state.train[k]} trained)</small>` : ''}</span></div>`).join('')}</div>
      <div class="power"><span class="label">Battle power</span><b>${power()}</b></div>
    </div>
    <div class="panel" style="display:grid;gap:10px">
      <h2>Equipment</h2>
      <div class="slots">${Object.entries(SLOTS).map(([slot, label]) => state.equip[slot]
        ? itemRow(state.equip[slot], `<button type="button" class="btn ghost" data-a="unequip" data-v="${slot}">Remove</button>`, `<span class="ireq">${label}</span>`)
        : `<div class="item"><div class="icon empty" aria-hidden="true">–</div><div class="meta"><span class="iname muted">Empty</span><span class="ireq">${label}</span></div><div></div></div>`).join('')}</div>
    </div>
    <div class="panel" style="display:grid;gap:10px">
      <h2>Bags</h2>
      ${bag.length ? `<div class="bag">${bag.map(id => {
        const it = ITEMS[id], low = level() < it.lvl;
        const acts = ui.sellOpen === id
          ? `<button type="button" class="btn danger" data-a="sell" data-v="${id}">Sell ${coinText(Math.max(1, Math.floor(it.price / 4)))}</button>`
          : `<button type="button" class="btn" data-a="equip" data-v="${id}" ${low ? 'disabled' : ''}>Equip</button><button type="button" class="btn ghost" data-a="sellopen" data-v="${id}">Sell</button>`;
        return itemRow(id, acts, `<span class="ireq ${low ? 'bad' : ''}">${SLOTS[it.slot]} · Requires level ${it.lvl}</span>`);
      }).join('')}</div>` : '<p class="muted" style="margin:0">Your bags are empty. Loot from adventures lands here.</p>'}
    </div>
    <div class="panel" style="display:grid;gap:12px">
      <div class="sect-head"><h2>Your Journey</h2><span class="muted" style="font-size:.85rem">Last 14 days</span></div>
      <div class="days">${days.join('')}</div>
      <div class="totals">
        <div><span class="label">Steps walked</span><b>${fmtNum(state.totals.steps)}</b></div>
        <div><span class="label">Minutes trained</span><b>${fmtNum(state.totals.exercise)}</b></div>
        <div><span class="label">Minutes meditated</span><b>${fmtNum(state.totals.meditate)}</b></div>
        <div><span class="label">Water drunk</span><b>${fmtL(state.totals.water)}</b></div>
      </div>
      <span class="muted" style="font-size:.85rem">${state.wins || 0} battles won</span>
    </div>
    <div class="panel" style="display:grid;gap:10px">
      <h2>Quest Goals</h2>
      <label class="field"><span>Steps per day</span><input id="g-steps" type="number" inputmode="numeric" min="1000" step="500" value="${state.goals.steps}"></label>
      <label class="field"><span>Training minutes</span><input id="g-exercise" type="number" inputmode="numeric" min="5" value="${state.goals.exercise}"></label>
      <label class="field"><span>Meditation minutes</span><input id="g-meditate" type="number" inputmode="numeric" min="1" value="${state.goals.meditate}"></label>
      <label class="field"><span>Water (ml)</span><input id="g-water" type="number" inputmode="numeric" min="250" step="250" value="${state.goals.water}"></label>
      <button type="button" class="btn" data-a="goals">Save goals</button>
    </div>
    <div class="panel" style="display:grid;gap:10px">
      <h2>Backup</h2>
      <p class="muted" style="margin:0;font-size:.92rem">Your hero is saved on this phone only. Copy a save code now and then and keep it in Notes, so you can restore your hero on a new phone or after clearing Safari.</p>
      <button type="button" class="btn primary" data-a="exportsave">Copy save code</button>
      ${ui.exportCode ? `<textarea id="exportBox" class="codebox" readonly rows="3">${esc(ui.exportCode)}</textarea>` : ''}
      ${renderRestore()}
    </div>
    <div class="panel confirm">
      ${ui.confirmReset
        ? `<p style="margin:0">This deletes ${esc(state.name)} and all progress for good.</p><div class="chips"><button type="button" class="btn danger" data-a="reset">Delete hero</button><button type="button" class="btn ghost" data-a="resetcancel">Keep playing</button></div>`
        : `<button type="button" class="btn ghost" data-a="resetask">Start a new hero</button>`}
    </div>
  </section>`;
}

function renderRestore() {
  if (ui.confirmImport) {
    const s = ui.confirmImport;
    return `<div class="confirm"><p style="margin:0">Replace ${esc(state.name)} with ${esc(s.name)}, level ${levelInfo(s.totalXp).L} ${CLASSES[s.cls].name}? Your current hero is kept as a one-time backup on this phone.</p>
      <div class="chips"><button type="button" class="btn danger" data-a="importyes">Restore ${esc(s.name)}</button><button type="button" class="btn ghost" data-a="importno">Cancel</button></div></div>`;
  }
  return `<label class="label" for="importBox">Restore from a save code</label>
    <textarea id="importBox" class="codebox" rows="3" placeholder="Paste a code starting with IRONVOW1:" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    <button type="button" class="btn" data-a="import">Restore hero</button>`;
}

function renderVendor() {
  const L = level();
  const items = Object.entries(ITEMS).filter(([id, it]) => it.shop && !state.owned.includes(id)).sort((a, b) => a[1].lvl - b[1].lvl || a[1].price - b[1].price);
  return `<section class="pane">
    <div class="sect-head"><h2>Brannick's Supplies</h2>${money(state.copper)}</div>
    <p class="muted" style="margin:0">"Fine steel and finer cloth, traveler. Gold first, then we talk."</p>
    <div class="shop">${items.map(([id, it]) => {
      const lowLvl = L < it.lvl, poor = state.copper < it.price;
      return itemRow(id, `<button type="button" class="btn ${lowLvl || poor ? '' : 'primary'}" data-a="buy" data-v="${id}" ${lowLvl || poor ? 'disabled' : ''}>Buy</button>`,
        `<span class="ireq ${lowLvl ? 'bad' : ''}">${SLOTS[it.slot]} · Level ${it.lvl} · ${money(it.price)}</span>`);
    }).join('') || '<p class="muted">You have bought everything Brannick sells.</p>'}</div>
  </section>`;
}

function renderAdventure() {
  const L = level(), pw = power();
  return `<section class="pane">
    <div class="sect-head"><h2>Adventure</h2><span class="energy">${BOLT}${state.energy} energy</span></div>
    <p class="muted" style="margin:0">Each venture costs 1 energy. Earn energy by completing daily quests. Your battle power: <b class="num" style="color:var(--gold)">${pw}</b></p>
    ${ui.log ? `<div class="panel log">${ui.log.map(l => `<p class="${l.cls || ''}">${l.item ? `<span class="icon r-${ITEMS[l.item].r}">${itemArt(l.item)}</span>` : ''}${esc(l.t)}</p>`).join('')}${ui.busy ? '' : `<button type="button" class="btn ghost" data-a="closelog" style="justify-self:start">Close</button>`}</div>` : ''}
    <div class="zones">${ZONES.map(z => {
      const locked = L < z.lvl, ch = winChance(z), pctv = Math.round(ch * 100);
      const oc = ch >= 0.7 ? 'hi' : ch >= 0.4 ? 'mid' : 'lo';
      const dropOwned = state.owned.includes(z.drop);
      return `<article class="panel zone ${locked ? 'locked' : ''}">
        <div class="zone-art">${zoneArt(z)}<h3>${z.name}</h3><span class="zl num">Level ${z.lvl}+</span></div>
        <div class="zone-body"><p>${z.foe}. Reward ${z.xp} XP and ${coinText(z.g[0])}–${coinText(z.g[1])}. Rare drop: <span class="r-${ITEMS[z.drop].r}">[${ITEMS[z.drop].n}]</span>${dropOwned ? ' (owned)' : ''}</p>
        <div class="z-top">${locked ? `<span class="muted">Reach level ${z.lvl} to enter</span>` : `<span>Victory chance <span class="odds ${oc}">${pctv}%</span></span>`}
        <button type="button" class="btn ${locked ? '' : 'primary'}" data-a="venture" data-v="${z.id}" ${locked || ui.busy || state.energy < 1 ? 'disabled' : ''}>Venture</button></div></div>
      </article>`;
    }).join('')}</div>
  </section>`;
}

// ---------- Events ----------
document.addEventListener('input', e => {
  if (e.target.id === 'heroName') document.getElementById('beginBtn').disabled = !e.target.value.trim();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'setInput') { const b = document.querySelector('[data-a="setsave"]'); if (b) b.click(); }
});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const a = el.dataset.a, v = el.dataset.v;
  if (!state) {
    if (a === 'pickcls') {
      ui.createCls = v;
      document.querySelectorAll('.cls').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    } else if (a === 'begin') {
      const name = document.getElementById('heroName').value.trim().slice(0, 16);
      if (!name) return;
      state = newHero(name, ui.createCls);
      ui.tab = 'quests';
      persist(); render();
      toast(`Welcome, ${name}. Your first quests await.`, 'gold');
    } else if (a === 'import') {
      try { state = readImportCode(document.getElementById('importBox').value); }
      catch (err) { toast(err.message); return; }
      ensureDay(); persist(); ui.tab = 'quests'; render();
      toast(`Welcome back, ${state.name}!`, 'gold');
    }
    return;
  }
  let changed = true;
  switch (a) {
    case 'tab': ui.tab = v; ui.setOpen = null; ui.sellOpen = null; ui.confirmReset = false; if (!ui.busy) ui.log = null; changed = false; try { localStorage.setItem('ironvow-tab', v); } catch (err) {} window.scrollTo(0, 0); break;
    case 'add': setVal(v, prog(v).val + Number(el.dataset.n)); break;
    case 'setopen': ui.setOpen = v; changed = false; render(); { const inp = document.getElementById('setInput'); if (inp) { inp.focus(); inp.select(); } } return;
    case 'setcancel': ui.setOpen = null; changed = false; break;
    case 'setsave': { const n = Number(document.getElementById('setInput').value); ui.setOpen = null; if (Number.isFinite(n)) setVal(v, n); else changed = false; break; }
    case 'check': complete(v); break;
    case 'uncheck': uncomplete(v); break;
    case 'chest': claimChest(); break;
    case 'venture': venture(v); return;
    case 'closelog': ui.log = null; changed = false; break;
    case 'buy': buy(v); break;
    case 'equip': equip(v); break;
    case 'unequip': unequip(v); break;
    case 'sellopen': ui.sellOpen = v; changed = false; break;
    case 'sell': sell(v); ui.sellOpen = null; break;
    case 'goals': {
      const read = (id, min) => { const n = Math.round(Number(document.getElementById(id).value)); return Number.isFinite(n) && n >= min ? n : null; };
      const g = { steps: read('g-steps', 1000), exercise: read('g-exercise', 5), meditate: read('g-meditate', 1), water: read('g-water', 250) };
      Object.entries(g).forEach(([k, n]) => { if (n) state.goals[k] = n; });
      QUESTS.forEach(q => { if (q.type === 'num') { const p = prog(q.id); if (!p.done && p.val >= state.goals[q.id]) complete(q.id); } });
      toast('Goals saved');
      break;
    }
    case 'import': {
      changed = false;
      try { ui.confirmImport = readImportCode(document.getElementById('importBox').value); }
      catch (err) { toast(err.message); return; }
      break;
    }
    case 'importyes': {
      backupCurrent();
      state = ui.confirmImport; ui.confirmImport = null;
      ensureDay(); persist(); ui.tab = 'quests';
      toast(`Welcome back, ${state.name}!`, 'gold');
      break;
    }
    case 'importno': ui.confirmImport = null; changed = false; break;
    case 'exportsave': {
      const code = makeExportCode();
      ui.exportCode = code; changed = false;
      const done = () => toast('Save code copied', 'gold');
      const fallback = () => { render(); const b = document.getElementById('exportBox'); if (b) { b.focus(); b.select(); } toast('Select the code below and copy it'); };
      try { navigator.clipboard.writeText(code).then(() => { render(); done(); }, fallback); } catch (err) { fallback(); }
      return;
    }
    case 'resetask': ui.confirmReset = true; changed = false; break;
    case 'resetcancel': ui.confirmReset = false; changed = false; break;
    case 'reset': {
      backupCurrent();
      state = null; ui.confirmReset = false;
      try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
      render(); return;
    }
    default: changed = false;
  }
  if (changed) persist();
  render();
});
