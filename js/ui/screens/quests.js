// Quests tab: today's habits, their rewards, and the Champion's Cache.

import { CACHE } from '../../content/balance.js';
import { STAT_NAMES } from '../../content/classes.js';
import { QUEST_BY_ID, QUESTS } from '../../content/quests.js';
import { addQuestAmount, cacheReady, claimCache, completeQuest, doneCount, goalOf, progressOf, rewardOf, setQuestAmount, streakOf, uncompleteQuest } from '../../rules/quests.js';
import { icon } from '../art/icons.js';
import { amountText, chipText, coinText, longDate, progressText, unitName } from '../format.js';
import { blocks, button, chip, lockedButton, money } from '../parts.js';
import { commit, session } from '../session.js';

function amountControls(quest, progress, goal) {
  const fraction = Math.min(1, progress.val / goal);
  const bar = `<div class="progress">${blocks(fraction, quest.name, progress.done ? 'good' : '')}
    <span>${progressText(quest.unit, progress.val, goal)}</span><span class="dim">${Math.floor(fraction * 100)}%</span></div>`;
  if (session.ui.amountOpen === quest.id) {
    return `${bar}<div class="row">
      <input id="amountInput" type="number" inputmode="numeric" min="0" value="${progress.val}" data-enter="saveAmount" data-v="${quest.id}" aria-label="Today's total in ${unitName(quest.unit)}">
      ${button('primary', 'Save', 'saveAmount', quest.id)}${button('plain', 'Cancel', 'closeAmount')}</div>`;
  }
  return `${bar}<div class="row">
    ${quest.chips.map(n => button('plain', chipText(quest.unit, n), 'addAmount', quest.id, `data-n="${n}"`)).join('')}
    ${button('plain', 'Set total', 'openAmount', quest.id)}</div>`;
}

function questCard(quest) {
  const { hero } = session;
  const progress = progressOf(hero, quest.id);
  const reward = rewardOf(hero, quest);
  const streak = streakOf(hero, quest.id);
  const goal = quest.kind === 'amount' ? goalOf(hero, quest) : null;
  const controls = quest.kind === 'amount'
    ? amountControls(quest, progress, goal)
    : `<div class="row">${progress.done ? button('danger', quest.undoLabel, 'uncheckQuest', quest.id) : button('primary', quest.doLabel, 'checkQuest', quest.id)}</div>`;
  return `<article class="panel quest${progress.done ? ' done' : ''}">
    <div class="quest-head">
      <div class="icon-tile">${icon(quest.icon, 4)}<span class="badge${progress.done ? ' good' : ''}">${progress.done ? icon('check', 2, 'Done') : '!'}</span></div>
      <div><h2>${quest.name}</h2><p>${quest.text.replace('{goal}', goal === null ? '' : amountText(quest.unit, goal))}</p></div>
    </div>
    <div class="chips">${chip(`${reward.xp} XP`, 'xp')}${chip(money(reward.copper), 'coin')}${chip(`+1 ${STAT_NAMES[quest.stat]}`, 'good')}${streak ? chip(`${streak}-day streak`, 'gold') : ''}</div>
    ${controls}
  </article>`;
}

function cachePanel() {
  const { hero } = session;
  const action = hero.chest ? chip('Claimed', 'good')
    : cacheReady(hero) ? button('primary', 'Claim', 'claimCache')
      : lockedButton(`${doneCount(hero)} of ${QUESTS.length} done`);
  return `<section class="panel cache">
    <div class="quest-head"><div class="icon-tile">${icon('chest', 4)}</div>
      <div><h2>Champion's Cache</h2><p>${hero.chest ? 'Claimed today. A fresh cache waits tomorrow.' : `Keep all ${QUESTS.length} vows today: +${CACHE.xp} XP, ${coinText(CACHE.copper)}, +${CACHE.energy} energy.`}</p></div></div>
    <div class="row end">${action}</div>
  </section>`;
}

export function render() {
  const { hero } = session;
  return `<main class="screen">
    <div class="title"><h1>Daily quests</h1><p>${doneCount(hero)} of ${QUESTS.length} done. ${longDate(new Date())}</p></div>
    ${QUESTS.map(questCard).join('')}
    ${cachePanel()}
    <p class="hint">Quests reset at midnight. Keep a quest several days in a row for up to +50% rewards. Enter your steps from the Health app.</p>
  </main>`;
}

export const actions = {
  addAmount(questId, el) { commit(addQuestAmount(session.hero, questId, Number(el.dataset.n))); },
  openAmount(questId) {
    if (QUEST_BY_ID[questId]) session.ui.amountOpen = questId;
    return () => { const input = document.getElementById('amountInput'); if (input) { input.focus(); input.select(); } };
  },
  closeAmount() { session.ui.amountOpen = null; },
  saveAmount(questId) {
    const text = document.getElementById('amountInput').value.trim();
    session.ui.amountOpen = null;
    if (text !== '') commit(setQuestAmount(session.hero, questId, Number(text)));
  },
  checkQuest(questId) { commit(completeQuest(session.hero, questId)); },
  uncheckQuest(questId) { commit(uncompleteQuest(session.hero, questId)); },
  claimCache() { commit(claimCache(session.hero)); },
};
