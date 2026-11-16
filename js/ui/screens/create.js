// First screen: name a hero and pick a class, or restore one from a save code.

import { CLASSES } from '../../content/classes.js';
import { dayKey } from '../../rules/days.js';
import { newHero } from '../../rules/hero.js';
import { icon } from '../art/icons.js';
import { toast } from '../feedback.js';
import { button } from '../parts.js';
import { playAs, session } from '../session.js';
import { restorePanel } from './backup.js';

const NAME_LENGTH = 16;

export function render() {
  const picked = session.ui.createClass;
  return `<main class="screen">
    <div class="title"><h1 class="logo">Ironvow</h1>
      <p>Every vow you keep in real life makes your hero stronger. Walk, train, rest your mind and eat well to earn experience, gold and gear.</p></div>
    <section class="panel stack">
      <label class="label" for="heroName">Name your hero</label>
      <input id="heroName" data-keep data-enter="begin" maxlength="${NAME_LENGTH}" autocomplete="off" placeholder="e.g. Adamar">
    </section>
    <h2 class="heading">Choose a class</h2>
    <div class="classes">${Object.entries(CLASSES).map(([id, cls]) => `
      <button type="button" class="class-card" data-a="pickClass" data-v="${id}" aria-pressed="${picked === id}">
        ${icon(cls.emblem, 4)}<b>${cls.name}</b><span>${cls.blurb}</span>
      </button>`).join('')}</div>
    <div class="row end">${button('primary', 'Begin your journey', 'begin')}</div>
    <section class="panel stack"><h2>Already have a hero?</h2>${restorePanel()}</section>
  </main>`;
}

export const actions = {
  pickClass(id) { if (CLASSES[id]) session.ui.createClass = id; },
  begin() {
    const input = document.getElementById('heroName');
    const name = input.value.trim().slice(0, NAME_LENGTH);
    if (!name) { toast('Give your hero a name first'); return () => document.getElementById('heroName').focus(); }
    playAs(newHero(name, session.ui.createClass, dayKey(new Date())));
    toast(`Welcome, ${name}. Your first quests await.`, 'gold');
    return undefined;
  },
};
