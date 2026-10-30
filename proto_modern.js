// MODERN card designs — look-only mockup. Opens with ?proto=modern and never touches the game.
(function () {
  'use strict';
  if (!/[?&]proto=modern\b/.test(location.search)) return;
  const DESIGNS = [{"k": "", "name": "CHROME (current)", "yrs": "2016–today", "note": "Chrome refractor: photo to the edge, thin name with a rainbow rule. Stays for the whole era."}, {"k": "smoke16", "name": "SMOKE", "yrs": "2016–2017", "note": "Topps 2016 feel: the whole card in the team color, the photo printed in that color, white smoke rising from the bottom with the name in it."}, {"k": "split20", "name": "SPLIT PANEL", "yrs": "2018–2021", "note": "Topps 2020 feel: one big diagonal cuts the card in two, the photo above on white, the name, ratings and footer below on the solid team color."}, {"k": "club", "name": "STADIUM CLUB", "yrs": "2016–today", "note": "Premium photo-first feel: the photo covers the whole card with no frame, only a small gold-foil name in the corner."}, {"k": "t24", "name": "FLAGSHIP 24", "yrs": "2022–today", "note": "Topps 2024 feel: white stock, the photo in a rounded frame with a glowing team-color edge, the team code big at the bottom left, the last name in heavy white italics at the right."}];
  const SERIES = {"smoke16": "Smoke Series", "split20": "Split Series", "club": "Club Series", "t24": "Flagship Series"};
  const WANT = [[0, "Shohei Ohtani"], [1, "Jacob deGrom"], [0, "Aaron Judge"], [1, "Gerrit Cole"], [0, "Mookie Betts"]];
  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Modern/.test(c.era || '');
    const cards = WANT.map(([pit, n]) => (pit ? P : B).find(c => c.name === n && gen(c))).filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>MODERN ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
        <button class="pgen-x">✕ CLOSE</button></div>
      ${DESIGNS.map(d => `<section class="pgen-row">
        <div class="pgen-lab"><b>${d.name}</b><em>${d.yrs}</em><p>${d.note}</p></div>
        <div class="pgen-cards" data-v="${d.k}">${cards.map(html).join('')}</div></section>`).join('')}`;
    document.body.appendChild(root);
    root.querySelectorAll('.pgen-cards').forEach(row => {
      const v = row.dataset.v;
      if (!v) return;
      row.querySelectorAll('.pc2').forEach((c, i) => {
        c.classList.add('pc2-v-' + v);
        const team = (cards[i] && cards[i].team) || '';
        const name = (cards[i] && cards[i].name) || '';
        const pos = (c.querySelector('.pc2-pos') || {}).textContent || '';
        const ph = c.querySelector('.pc2-ph');
        const nm = c.querySelector('.pc2-name');
        const front = c.querySelector('.pc2-front');
        // these three print the player on a light studio backdrop instead of the chrome's dark navy
        const img = ph && ph.querySelector('img');
        if (img && window.CardArt && (v === 'smoke16' || v === 'split20' || v === 't24')) img.src = window.CardArt.portrait(cards[i], 'efficiency', !!WANT[i][0]);
        if (v === 'smoke16' && ph) ph.insertAdjacentHTML('beforeend', `<i class="pgv-x pgv-smoke"><b>${name}</b><em>${team} · ${pos}</em></i>`);
        if (v === 'split20' && ph) ph.insertAdjacentHTML('afterend', `<i class="pgv-x pgv-split"><b>${name}</b><em>${team}</em></i>`);
        if (v === 'club' && ph) ph.insertAdjacentHTML('beforeend', `<i class="pgv-x pgv-foil">${name}<small>${team}</small></i>`);
        if (v === 't24' && ph) { const p = name.split(' '), last = p.pop(); ph.insertAdjacentHTML('beforeend', `<i class="pgv-x pgv-tn">${team}</i><i class="pgv-x pgv-bt"><u>${team}</u><span><small>${p.join(' ')}</small><b>${last}</b></span><i>${pos}</i></i>`); }
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (ser) ser.textContent = SERIES[v] + ' · ' + y;
      });
    });
    // Flagship 24: a long last name shrinks to fit beside the team code.
    setTimeout(() => root.querySelectorAll('.pgv-bt b').forEach(b => {
      let f = 14; while (b.scrollWidth > b.clientWidth && f > 8) { f -= 0.5; b.style.fontSize = f + 'px'; }
    }), 400);
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_modern.css?v=14';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
