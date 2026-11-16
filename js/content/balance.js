// Every balance number in one place. Rules read these; nothing else hard-codes a number.
// Changing a value here changes the game for existing heroes too, so update CLAUDE.md when you do.

export const MAX_LEVEL = 60;

// XP needed to go from level L to L + 1 is base × L^exponent.
export const XP_CURVE = { base: 100, exponent: 1.5 };

export const START_COPPER = 10000;

export const ENERGY = { cap: 10, start: 3, perQuest: 1, perVenture: 1 };

// Keeping the same quest on consecutive days adds bonusPerDay to its rewards, up to maxBonus.
export const STREAK = { bonusPerDay: 0.1, maxBonus: 0.5 };

// Champion's Cache: the reward for finishing every daily quest.
export const CACHE = { xp: 150, copper: 10000, energy: 2 };

// Win chance = winFactor × hero power ÷ zone power, kept between minChance and maxChance.
export const COMBAT = { winFactor: 0.75, minChance: 0.05, maxChance: 0.95, dropChance: 0.18, lossXpShare: 0.25 };

// Selling an item pays this share of its price.
export const SELL_SHARE = 0.25;

// How many past days of "quests done" the save keeps.
export const HISTORY_DAYS = 60;
