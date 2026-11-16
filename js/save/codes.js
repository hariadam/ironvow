// Save codes: how players back a hero up and move it between phones. 'IRONVOW1:' + base64 of the save as UTF-8 JSON.
// The format is permanent: codes copied from any earlier version must keep importing.

import { SaveError, upgradeSave } from './migrate.js';

const CODE_PREFIX = 'IRONVOW1:';

export function encodeSave(hero) {
  const bytes = new TextEncoder().encode(JSON.stringify(hero));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return CODE_PREFIX + btoa(binary);
}

// Returns an upgraded save, or throws an Error whose message tells the player what to do.
export function decodeSave(code) {
  const text = String(code || '').replace(/\s+/g, '');
  if (!text.startsWith(CODE_PREFIX)) throw new Error('That is not an Ironvow save code. It should start with IRONVOW1:');
  let data;
  try {
    const binary = atob(text.slice(CODE_PREFIX.length));
    data = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, ch => ch.charCodeAt(0))));
  } catch {
    throw new Error('The save code is incomplete. Copy the whole code and try again.');
  }
  try {
    return upgradeSave(data);
  } catch (err) {
    if (err instanceof SaveError && err.code === 'newer') throw new Error('This code comes from a newer version of Ironvow. Reload the page to update, then try again.');
    if (err instanceof SaveError && err.code === 'no-hero') throw new Error('The save code has no hero in it.');
    throw err;
  }
}
