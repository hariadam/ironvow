// Safety net, loaded before the game as a plain script. The owner plays on a phone with no developer
// console, so if the game fails to start or crashes, this puts the reason on screen instead of leaving a
// blank or frozen page. It never touches the save.
(function () {
  'use strict';
  var shown = false;
  function show(reason) {
    if (shown) return;
    shown = true;
    var box = document.createElement('div');
    box.className = 'crash';
    box.setAttribute('role', 'alert');
    var title = document.createElement('b');
    title.textContent = 'Ironvow hit a problem';
    var text = document.createElement('p');
    text.textContent = 'Your hero is safe: nothing was deleted. Reload the page. If this keeps showing, send this message to Claude:';
    var detail = document.createElement('code');
    detail.textContent = reason;
    var reload = document.createElement('button');
    reload.type = 'button';
    reload.className = 'btn btn-primary';
    reload.textContent = 'Reload';
    reload.onclick = function () { location.reload(); };
    box.append(title, text, detail, reload);
    document.body.appendChild(box);
  }
  function describe(error, fallback) {
    if (error && error.stack) return String(error.stack).split('\n').slice(0, 3).join('\n');
    return error ? String(error.message || error) : fallback;
  }
  window.addEventListener('error', function (event) {
    // A script or stylesheet that failed to download reports on its own element, not on window.
    var el = event.target;
    if (el && el !== window && el.tagName === 'SCRIPT') show('Could not load ' + el.src);
    else if (el === window) show(describe(event.error, event.message));
  }, true);
  window.addEventListener('unhandledrejection', function (event) { show(describe(event.reason, 'Unhandled promise rejection')); });
  // Modules that fail to load do not always raise an error (a missing import, for one). If the game has
  // not announced itself a few seconds after the page loaded, say so.
  window.addEventListener('load', function () {
    setTimeout(function () { if (!window.ironvowStarted) show("The game did not start. Check the connection and reload."); }, 1500);
  });
})();
