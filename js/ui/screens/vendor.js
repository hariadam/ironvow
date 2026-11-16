// Vendor tab: buy gear with gold.

import { ITEMS, SLOTS } from '../../content/items.js';
import { buyItem, shopStock } from '../../rules/gear.js';
import { heroLevel } from '../../rules/hero.js';
import { button, itemRow, lockedButton, money } from '../parts.js';
import { commit, session } from '../session.js';

export function render() {
  const { hero } = session;
  const level = heroLevel(hero);
  const rows = shopStock(hero).map(id => {
    const item = ITEMS[id];
    const buy = level < item.level ? lockedButton(`Level ${item.level}`)
      : hero.copper < item.price ? lockedButton('Need gold')
        : button('primary', 'Buy', 'buy', id);
    return itemRow(id, `${SLOTS[item.slot]} · Level ${item.level}`, money(item.price) + buy);
  });
  return `<main class="screen">
    <div class="title"><h1>Vendor</h1><p>Brannick's Supplies. "Fine steel and finer cloth, traveler. Gold first, then we talk."</p></div>
    <section class="panel stack">${rows.join('') || '<p class="dim">You have bought everything Brannick sells.</p>'}</section>
  </main>`;
}

export const actions = {
  buy(itemId) { commit(buyItem(session.hero, itemId)); },
};
