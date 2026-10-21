// Menus 2.0: decorations the CSS can't do alone (menus2.css). Presentation only.
(function () {
  'use strict';

  // Each mode card gets a pixel illustration of what the mode is (user: faces were confusing here).
  const COVERS = [
    { card: 'card-mode-story', art: 'story', kicker: 'Mode 1 · Real seasons' },
    { card: 'card-mode-quick', art: 'quick', kicker: 'Mode 2 · Roguelike' },
    { card: 'card-mode-challenge162', art: 'season', kicker: 'Mode 3 · Full season' }
  ];

  function drawArt(kind) {
    const W = 48, H = 36, S = 6;
    const cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
    const c = cv.getContext('2d');
    const px = (x, y, col) => { c.fillStyle = col; c.fillRect(x * S, y * S, S, S); };
    const rect = (x0, y0, w, h, col) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) px(x, y, col); };
    const disc = (cx, cy, r, col) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .6) px(cx + x, cy + y, col); };
    const ball = (cx, cy, r) => {
      disc(cx, cy + 1, r, 'rgba(0,0,0,.25)'); disc(cx, cy, r, '#fbf7ec');
      for (let k = -r + 1; k < r; k += 2) { px(cx - r + 2 + Math.round(Math.abs(k) / 3), cy + k, '#c0392b'); px(cx + r - 2 - Math.round(Math.abs(k) / 3), cy + k, '#c0392b'); }
    };
    if (kind === 'story') {            // a season calendar on an old wall, with a ball
      rect(0, 0, W, H, '#cdb990');
      for (let y = 0; y < H; y += 3) rect(0, y, W, 1, '#c3ae84');
      rect(7, 5, 28, 27, 'rgba(0,0,0,.18)');
      rect(6, 4, 28, 27, '#f6efdc'); rect(6, 4, 28, 6, '#a8322a');
      rect(11, 2, 2, 4, '#3a2817'); rect(27, 2, 2, 4, '#3a2817');
      for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) rect(8 + k * 4, 13 + r * 4, 3, 2, '#c9b996');
      [[24, 17], [25, 16], [26, 16], [27, 17], [27, 18], [26, 19], [25, 19], [24, 18]].forEach(([x, y]) => px(x, y, '#c0392b'));
      rect(9, 6, 10, 1, '#f6efdc'); rect(9, 8, 7, 1, '#f3c7b8');
      ball(38, 27, 6);
    } else if (kind === 'quick') {     // dice and a bat on a sunburst
      rect(0, 0, W, H, '#e8432d');
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = Math.atan2(y - 18, x - 24); if (Math.floor((a + Math.PI) / (Math.PI / 8)) % 2) px(x, y, '#d93a26'); }
      for (let t = 0; t < 34; t++) { const x = 6 + t, y = 33 - Math.round(t * .8), w = t > 22 ? 3 : 2; rect(x, y, w, w, t > 30 ? '#3a2410' : '#c98d4f'); px(x, y, '#e6b278'); }
      const die = (x, y, pips) => {
        rect(x + 1, y + 1, 12, 12, 'rgba(0,0,0,.3)'); rect(x, y, 12, 12, '#fbf7ec'); rect(x, y + 11, 12, 1, '#c9bfa6');
        pips.forEach(([a, b]) => rect(x + 2 + a * 3, y + 2 + b * 3, 2, 2, '#241510'));
      };
      die(8, 8, [[0, 0], [1, 1], [2, 2]]);
      die(25, 16, [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]]);
    } else {                           // a gold trophy under the lights
      rect(0, 0, W, H, '#0a1530');
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x * 7 + y * 13) % 23) === 0) px(x, y, '#2a4a80');
      [[6, 5], [40, 8], [9, 27], [42, 25], [36, 4]].forEach(([x, y]) => { px(x, y, '#fff6c8'); px(x - 1, y, '#ffd36a'); px(x + 1, y, '#ffd36a'); px(x, y - 1, '#ffd36a'); px(x, y + 1, '#ffd36a'); });
      for (let y = 6; y < 18; y++) { const w = 14 - Math.round((y - 6) * .55); rect(24 - w, y, w * 2, 1, y < 9 ? '#fff1b8' : '#e8b93a'); px(24 - w, y, '#a8791a'); }
      for (let y = 8; y < 15; y++) { px(8, y, '#e8b93a'); px(39, y, '#e8b93a'); }
      rect(8, 8, 3, 1, '#e8b93a'); rect(37, 8, 3, 1, '#e8b93a'); rect(8, 14, 4, 1, '#e8b93a'); rect(36, 14, 4, 1, '#e8b93a');
      rect(22, 18, 4, 5, '#c99a2e'); rect(18, 23, 12, 2, '#e8b93a'); rect(15, 25, 18, 6, '#3a2410'); rect(17, 27, 14, 2, '#c9a24a');
      rect(20, 9, 3, 6, '#fff6d8');
    }
    return cv.toDataURL();
  }

  function decorateModeCards() {
    COVERS.forEach(c => {
      const el = document.getElementById(c.card);
      if (!el || el.querySelector('.mc-photo')) return;
      const title = el.querySelector('.mode-title');
      const kick = document.createElement('div');
      kick.className = 'mc-kicker';
      kick.textContent = c.kicker;
      const ph = document.createElement('div');
      ph.className = 'mc-photo';
      ph.innerHTML = `<img src="${drawArt(c.art)}" alt="" draggable="false">`;
      el.insertBefore(kick, title);
      el.insertBefore(ph, title);
    });
  }

  // Pop-ups that ui.js builds with neon inline styles get the paper & ink layer (menus2.css).
  const SHEET_OVERLAYS = '.trade-overlay, .gamble-overlay, .player-selector-modal-overlay, .roulette-overlay';
  const SHEET_MARKERS = '#btn-close-retro-result-modal, #btn-chest-claim, #btn-midboss-reward-continue, .btn-trait-pick, #btn-ack-exhaustion';
  function paperize(node) {
    if (!(node instanceof HTMLElement) || node.classList.contains('m2-overlay')) return;
    if (!node.matches(SHEET_OVERLAYS) && !node.querySelector(SHEET_MARKERS)) return;
    node.classList.add('m2-overlay');
    const sheet = node.querySelector('.roulette-modal') || node.firstElementChild;
    if (!sheet) return;
    sheet.classList.add('m2-sheet');
    // the trade pop-up shows real cards, whose rating colours must not be re-inked
    if (!node.matches('.trade-overlay')) sheet.classList.add('m2-ink');
  }
  function watchOverlays() {
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(paperize)))
      .observe(document.body, { childList: true });
  }

  // Opening draft: the roster and batting-order columns are lineup cards (paper & ink, menus2.css).
  function watchDraft() {
    const pool = document.getElementById('starter-selection-pool');
    if (!pool) return;
    const mark = () => {
      const cols = ['draft-col-roster', 'draft-col-order'].map(id => document.getElementById(id));
      const fin = document.getElementById('final-lineup-layout');
      if (fin) cols.push(...fin.children);
      cols.forEach(c => { if (c && !c.classList.contains('m2-ink')) c.classList.add('m2-ink', 'm2-lineup'); });
    };
    new MutationObserver(mark).observe(pool, { childList: true, subtree: true });
    mark();
  }

  // Phones: the map stacks October on top, so the zone you are playing sat at the bottom.
  // When the map opens, bring the next playable node into view.
  function watchMap() {
    const map = document.getElementById('screen-map');
    if (!map) return;
    const go = () => {
      if (map.classList.contains('hidden') || window.innerWidth > 768) return;
      setTimeout(() => {
        const node = map.querySelector('.map-node-group.node-is-active');
        if (node) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 120);
    };
    new MutationObserver(go).observe(map, { attributes: true, attributeFilter: ['class'] });
  }

  function init() { decorateModeCards(); watchOverlays(); watchDraft(); watchMap(); }
  // Loaded at the end of <body> but BEFORE the player data scripts, so the menu markup already exists:
  // run now. Waiting for 'load' (megabytes of data) made the mode cards appear bare and then jump.
  if (document.getElementById('card-mode-story')) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
