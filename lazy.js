// Heavy data arrives when it is needed, not on startup, so a phone can open the game quickly.
// Career numbers load in the background right after the menu is up; the Story seasons load when a
// mode that uses them is chosen (window capture runs before the buttons' own handlers).
(function () {
  'use strict';
  function load(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => { s.remove(); fail(new Error('load ' + src)); };
      document.head.appendChild(s);
    });
  }
  let career = null, seasons = null;
  window.ensureCareer = () => career || (career = load('career_lite.js?v=1794500021').catch(() => { career = null; }));
  window.ensureSeasons = () => seasons || (seasons = load('opponents_database.js?v=1794500042').catch(e => { seasons = null; throw e; }));

  window.addEventListener('load', () => setTimeout(window.ensureCareer, 1200));

  function notice(text) {
    let n = document.getElementById('lazy-notice');
    if (!text) { if (n) n.remove(); return; }
    if (!n) { n = document.createElement('div'); n.id = 'lazy-notice'; document.body.appendChild(n); }
    n.textContent = text;
  }
  window.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#btn-select-story-mode, #btn-select-career-mode, #card-mode-story, #card-mode-career');
    if (!b || window.OpponentsDatabase) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    notice('LOADING SEASONS…');
    window.ensureSeasons().then(() => { notice(''); b.click(); }, () => notice('Could not load the seasons. Check your connection and try again.'));
  }, true);
})();
