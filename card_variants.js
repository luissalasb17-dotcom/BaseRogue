// Card designs per era in the real game. Each card picks at random, once per page load, between all the designs of its era,
// whatever the card's year (same player = same design until reload).
// Presentation only: decorates what createCardHTML renders. Styles in card_variants.css.
(function () {
  'use strict';
  if (/[?&]proto=/.test(location.search)) return;   // the design mockups decorate their own cards

  const SEED = (Math.random() * 4294967296) >>> 0;
  const D = {
    genesis: [['studio', 1886, 1890, 'Studio Series'], ['litho', 1887, 1890, 'Lithograph Series'], ['champ', 1888, 1890, 'Champions Series'], ['mayo', 1891, 1900, 'Cut Plug Series']],
    deadball: [['gold205', 1909, 1911, 'Gold Series'], ['turkey', 1911, 1913, 'Cabinet Series'], ['cj14', 1914, 1915, 'Candy Series'], ['oval16', 1916, 1919, 'News Series']],
    golden: [['strip', 1920, 1932, 'Strip Series'], ['goudey', 1933, 1936, 'Painted Series'], ['stars', 1934, 1936, 'Diamond Stars'], ['pb41', 1937, 1941, 'Play Ball Series']],
    integration: [['bw48', 1946, 1948, 'Black & White'], ['flat49', 1949, 1951, 'Poster Series'], ['panel52', 1952, 1955, 'Painted Series'], ['ring59', 1956, 1960, 'Circle Series']],
    expansion: [['classic', 1961, 1965, 'Classic Series'], ['burlap', 1966, 1969, 'Burlap Series'], ['black', 1970, 1972, 'Black Series'], ['psych', 1972, 1974, 'Groovy Series']],
    bighair: [['pennant', 1977, 1983, 'Flag Series'], ['streak', 1984, 1987, 'Streak Series'], ['stripe', 1986, 1990, 'Stripe Series'], ['premium', 1989, 1993, 'Premium Series']],
    steroid: [['finest', 1994, 1999, 'Chrome Series'], ['metal', 1996, 1999, 'Metal Series'], ['club', 1994, 2005, 'Club Series'], ['mill', 2000, 2005, 'Millennium Series']],
    efficiency: [['arc06', 2006, 2008, 'Arc Series'], ['vert07', 2007, 2010, 'Side Series'], ['wave15', 2013, 2015, 'Wave Series'], ['blackref', 2010, 2015, 'Chrome Series']],
    modern: [['smoke16', 2016, 2017, 'Smoke Series'], ['split20', 2018, 2021, 'Split Series'], ['club', 2016, 9999, 'Club Series'], ['t24', 2022, 9999, 'Flagship Series']]
  };
  const hash = s => { let h = SEED; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h ^ (h >>> 15)) >>> 0; };
  const FLAT = ['#e5432f', '#f2c230', '#5ab4e5', '#4fae6a', '#e87a3a'];
  const PASTEL = ['#f4c6cf', '#bfe3c2', '#f6e39a', '#bcd8f0', '#f7cfa6'];
  const add = (el, where, html) => el && el.insertAdjacentHTML(where, html);

  function repaint(c, era, player) {
    const img = c.querySelector('.pc2-ph img');
    if (img && window.CardArt) img.src = window.CardArt.portrait(player, era, c.dataset.kind === 'P');
  }

  function decorate(c) {
    if (c.dataset.dz) return;
    c.dataset.dz = '1';
    const era = (c.className.match(/pc2-e-(\w+)/) || [])[1];
    const year = parseInt(c.dataset.year, 10);
    const id = c.dataset.pid || c.dataset.name || '';
    const opts = [null].concat(D[era] || []);
    const h = hash(id + '|' + year);
    const pick = opts[h % opts.length];
    if (!pick) return;
    const v = pick[0], name = c.dataset.name || '', pos = c.dataset.pos || '';
    const ft = c.querySelector('.pc2-ft'), team = ((ft && ft.firstElementChild && ft.firstElementChild.textContent) || '').trim();
    const ph = c.querySelector('.pc2-ph'), nm = c.querySelector('.pc2-name'), top = c.querySelector('.pc2-top'), front = c.querySelector('.pc2-front');
    const parts = name.split(' '), last = parts.pop(), first = parts.join(' ');
    const player = { playerID: c.dataset.pid, name, team };
    c.classList.add('pc2-v-' + v);
    if (v === 'litho') {
      repaint(c, 'golden', player);
      if (!document.getElementById('pgv-paint-svg')) document.body.insertAdjacentHTML('beforeend', '<svg id="pgv-paint-svg" width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="pgv-paint" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation=".75" result="soft"/><feTurbulence type="fractalNoise" baseFrequency=".11" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="soft" in2="n" scale="4"/></filter></svg>');
    }
    if (v === 'smoke16' || v === 'split20' || v === 't24') repaint(c, 'efficiency', player);
    if (v === 'champ') add(ph, 'beforeend', '<i class="pgv-scene"><svg viewBox="0 0 20 20"><circle cx="15" cy="5" r="2.2" fill="#f5efe0" stroke="#7a1f14" stroke-width=".8"/><path d="M3 17 L12 6" stroke="#8a5a2b" stroke-width="2.2" stroke-linecap="round"/></svg></i>');
    if (v === 'mill') add(top, 'beforeend', `<i class="pgv-badge">${team}</i>`);
    if (v === 'pennant') add(ph, 'beforeend', `<i class="pgv-pennant">${team}</i><i class="pgv-cap">${pos}</i>`);
    if (v === 'premium') { add(ph, 'beforeend', '<i class="pgv-holo"></i>'); add(front, 'beforeend', '<i class="pgv-dia"><svg viewBox="0 0 20 20"><path d="M10 3 L17 10 L10 17 L3 10 Z" fill="none" stroke="#fff" stroke-width="1.4"/><g fill="#f3d27a"><rect x="8.5" y="1.5" width="3" height="3"/><rect x="15.5" y="8.5" width="3" height="3"/><rect x="1.5" y="8.5" width="3" height="3"/><rect x="8.5" y="15.5" width="3" height="3"/></g></svg></i>'); }
    if (v === 'classic' || v === 'burlap' || v === 'black' || v === 'playball' || v === 'cj14') add(nm, 'beforeend', `<i class="pgv-x pgv-code">${team}</i>`);
    if (v === 'psych') add(ph, 'beforeend', `<i class="pgv-team">${team}</i>`);
    if (v === 'oval16') add(nm, 'beforeend', `<i class="pgv-x pgv-sub">${team} · ${pos}</i>`);
    if (v === 'flat49') c.style.setProperty('--fl', FLAT[h % 5]);
    if (v === 'bw48') {
      c.style.setProperty('--fl', FLAT[h % 5]);
      const chips = c.querySelectorAll('.pc2-chip'), full = (chips[1] && chips[1].title) || team;
      add(nm, 'beforeend', `<i class="pgv-60"><span>${full}</span><span>${pos}</span></i>`);
    }
    if (v === 'panel52') add(ph, 'beforeend', `<i class="pgv-52"><u><i>${team}</i></u><b>${name}</b><s>${name}</s></i>`);
    if (v === 'ring59') { c.style.setProperty('--pa', PASTEL[h % 5]); add(ph, 'beforeend', `<i class="pgv-sig">${name}</i>`); add(ph, 'afterend', `<i class="pgv-59">${team} · ${pos}</i>`); }
    if (v === 'arc06') add(nm, 'afterbegin', `<i class="pgv-dot">${team}</i>`);
    if (v === 'vert07') { add(ph, 'beforeend', `<i class="pgv-bar"><b>${name}</b><em>${team}</em></i>`); const b = ph.querySelector('.pgv-bar b'); if (b) b.style.fontSize = Math.max(5.5, Math.min(11, 115 / Math.max(name.length, 1))) + 'px'; }
    if (v === 'wave15') add(ph, 'beforeend', `<i class="pgv-wave"><b>${name}</b><em>${team}</em></i>`);
    if (v === 'blackref') add(front, 'beforeend', '<i class="pgv-shine"></i>');
    if (v === 'smoke16') add(ph, 'beforeend', `<i class="pgv-x pgv-smoke"><b>${name}</b><em>${team} · ${pos}</em></i>`);
    if (v === 'split20') add(ph, 'afterend', `<i class="pgv-x pgv-split"><b>${name}</b><em>${team}</em></i>`);
    if (v === 'club' && era === 'modern') add(ph, 'beforeend', `<i class="pgv-x pgv-foil">${name}<small>${team}</small></i>`);
    if (v === 't24') { add(ph, 'beforeend', `<i class="pgv-x pgv-bt"><u>${team}</u><span><small>${first}</small><b>${last}</b></span></i>`); const b = ph.querySelector('.pgv-bt b'); if (b) b.style.fontSize = Math.max(7, Math.min(14, 66 / Math.max(last.length, 1))) + 'px'; }
    const ser = c.querySelector('.pc2-series');
    if (ser) { ser.textContent = pick[3] + ' · ' + c.dataset.year; if (v === 'ring59') { const row = c.querySelector('.pgv-59'); if (row) row.prepend(ser); } }
  }

  const scan = root => { if (root.matches && root.matches('.pc2')) decorate(root); if (root.querySelectorAll) root.querySelectorAll('.pc2').forEach(decorate); };
  const start = () => {
    scan(document.body);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) scan(n); }))).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
