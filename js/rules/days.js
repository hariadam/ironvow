// Calendar days as 'YYYY-MM-DD' keys in the player's local time. Keys sort and compare as plain strings.

const pad = n => String(n).padStart(2, '0');

export const dayKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// The key `days` after (or before, if negative) the given key. Done in UTC so clock changes never skip a day.
export function shiftDay(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// A day key as a whole number that goes up by one each day. Used to roll what changes daily in the world.
export function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}
