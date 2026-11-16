// Gear: the vendor, bags and equipment. See rules/hero.js for the layer's contract.
// A save can hold item ids this version no longer knows (retired content); every lookup allows for that.

import { SELL_SHARE } from '../content/balance.js';
import { ITEMS } from '../content/items.js';
import { heroLevel } from './hero.js';

const isEquipped = (hero, itemId) => Object.values(hero.equip).includes(itemId);

// Owned items that are not equipped.
export const bagItems = hero => hero.owned.filter(id => ITEMS[id] && !isEquipped(hero, id));

// What the vendor still has for this hero, cheapest tier first.
export const shopStock = hero => Object.keys(ITEMS)
  .filter(id => ITEMS[id].sold && !hero.owned.includes(id))
  .sort((a, b) => ITEMS[a].level - ITEMS[b].level || ITEMS[a].price - ITEMS[b].price);

export const sellValue = item => Math.max(1, Math.floor(item.price * SELL_SHARE));

// Buying also equips the item.
export function buyItem(hero, itemId) {
  const item = ITEMS[itemId];
  if (!item || !item.sold || hero.owned.includes(itemId) || hero.copper < item.price || heroLevel(hero) < item.level) return [];
  hero.copper -= item.price;
  hero.owned.push(itemId);
  hero.equip[item.slot] = itemId;
  return [{ type: 'itemBought', itemId }];
}

export function equipItem(hero, itemId) {
  const item = ITEMS[itemId];
  if (!item || !hero.owned.includes(itemId) || hero.equip[item.slot] === itemId || heroLevel(hero) < item.level) return [];
  hero.equip[item.slot] = itemId;
  return [{ type: 'itemEquipped', itemId }];
}

export function unequipSlot(hero, slot) {
  const itemId = hero.equip[slot];
  if (!itemId) return [];
  hero.equip[slot] = null;
  return [{ type: 'itemUnequipped', itemId }];
}

// Only items in the bags can be sold.
export function sellItem(hero, itemId) {
  const item = ITEMS[itemId];
  if (!item || !hero.owned.includes(itemId) || isEquipped(hero, itemId)) return [];
  const copper = sellValue(item);
  hero.owned = hero.owned.filter(id => id !== itemId);
  hero.copper += copper;
  return [{ type: 'itemSold', itemId, copper }];
}
