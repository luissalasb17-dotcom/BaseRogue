// Integration card designs — look-only mockup. Opens with ?proto=integration and never touches the game:
// real cards (createCardHTML) shown in the current design and three new ones side by side.
(function () {
  'use strict';
  if (!/[?&]proto=integration\b/.test(location.search)) return;

  const DESIGNS = [
    { k: '', name: 'SIGNATURE (current)', yrs: '1942–1960', note: 'White stock, painted sky, the name as a facsimile signature in the team color. Stays for the whole era.' },
    { k: 'bw48', name: 'BLACK & WHITE', yrs: '1946–1948', note: 'Bowman 1948 feel: a grainy black-and-white photo fills the card, darker at the edges, the name small on a dark strip.' },
    { k: 'flat49', name: 'POSTER COLOR', yrs: '1949–1951', note: 'Bowman 1949 feel: the grey player printed over one flat bright color (red, yellow, sky or green), cream border, slab name.' },
    { k: 'panel52', name: 'TILTED BOX', yrs: '1952–1955', note: 'Topps 1952 feel: hand-painted color to the edge, a tilted box on the corner with the team code in a diamond, the name and a signature.' },
    { k: 'ring59', name: 'BIG CIRCLE', yrs: '1956–1960', note: 'Topps 1959 feel: the player in a big circle on pastel stock, the name lowercase across the top, a signature over the circle.' }
  ];

  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Integration/.test(c.era || '');
    const pick = (pool, n) => pool.find(c => c.name === n && gen(c));
    const cards = [pick(B, 'Jackie Robinson'), pick(B, 'Ted Williams'), pick(P, 'Warren Spahn'), pick(B, 'Stan Musial'), pick(B, 'Mickey Mantle')].filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>INTEGRATION ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
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
        const team = cards[i] && cards[i].team;
        const ph = c.querySelector('.pc2-ph');
        const nm = c.querySelector('.pc2-name');
        const name = (cards[i] && cards[i].name) || '';
        const pos = (c.querySelector('.pc2-pos') || {}).textContent || '';
        if (v === 'ring59') c.style.setProperty('--pa', ['#f4c6cf', '#bfe3c2', '#f6e39a', '#bcd8f0', '#f7cfa6'][i % 5]);
        if (v === 'flat49') c.style.setProperty('--fl', ['#e5432f', '#f2c230', '#5ab4e5', '#4fae6a', '#e87a3a'][i % 5]);
        if (v === 'panel52' && ph) ph.insertAdjacentHTML('beforeend', `<i class="pgv-52"><u><i>${team || ''}</i></u><b>${name}</b><s>${name}</s></i>`);
        if (v === 'ring59' && ph) { ph.insertAdjacentHTML('beforeend', `<i class="pgv-sig">${name}</i>`); ph.insertAdjacentHTML('afterend', `<i class="pgv-59">${team || ''} · ${pos}</i>`); }
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (v === 'ring59' && ser) { const row = c.querySelector('.pgv-59'); if (row) row.prepend(ser); }
        if (ser) ser.textContent = ({ bw48: 'Black & White', flat49: 'Poster Series', panel52: 'Painted Series', ring59: 'Circle Series' })[v] + ' · ' + y;
      });
    });
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_integration.css?v=8';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
