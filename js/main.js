// Startup. Everything else is reached from here: js/ui/app.js draws and handles taps, js/rules holds the
// game rules, js/content the game data, js/save the save format. See CLAUDE.md.

import { start } from './ui/app.js';

start();
window.ironvowStarted = true;   // tells js/boot-guard.js the game came up

// Ask the browser not to clear the save when storage runs low (works best from the Home Screen).
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// Offline support: the service worker serves the last downloaded version when there is no connection.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
