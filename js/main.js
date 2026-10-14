// ---------- Day rollover ----------
function checkDay() { if (state && ensureDay()) { persist(); render(); } }
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDay(); });
setInterval(checkDay, 60000);

// ---------- Boot ----------
state = loadLocal();
if (state && ensureDay()) persist();
render();

// Ask the browser not to clear our save when storage runs low (works best from the Home Screen).
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

// Offline support: the service worker serves the last downloaded version when there is no connection.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
