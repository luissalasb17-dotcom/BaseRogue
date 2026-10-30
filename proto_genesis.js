// Genesis card designs — look-only mockup. Opens with ?proto=genesis and never touches the game:
// real cards (createCardHTML) shown in the current design and three new ones side by side.
(function () {
  'use strict';
  if (!/[?&]proto=genesis\b/.test(location.search)) return;

  const DESIGNS = [
    { k: '', name: 'CABINET CARD (current)', yrs: '1871–1900', note: 'Photo mounted on dark board with gilt rules. Stays for the whole era.' },
    { k: 'studio', name: 'STUDIO PHOTO', yrs: '1886–1890', note: 'Old Judge style: sepia studio photo filling the card, name and team written by hand on a cream strip.' },
    { k: 'litho', name: 'COLOR LITHOGRAPH', yrs: '1887–1890', note: 'Allen & Ginter style: color portrait in a gilt oval on white stock, red engraved name.' },
    { k: 'champ', name: 'CHAMPIONS', yrs: '1888–1890', note: 'Goodwin style: ornate red and gold frame, arched portrait, a small game scene in the corner.' },
    { k: 'mayo', name: 'BLACK CARDBOARD', yrs: '1891–1900', note: 'Mayo Cut Plug style (1895): black-and-white photo on black stock, a thin white rule, the name in white capitals and the team under it.' }
  ];

  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Genesis/.test(c.era || '');
    const pick = (pool, n) => pool.find(c => c.name === n && gen(c));
    const rar = r => B.concat(P).filter(c => gen(c) && c.rarity === r && (c.year || 0) >= 1886 && (c.year || 0) <= 1890)[0];
    const cards = [pick(B, 'Cap Anson'), pick(B, 'King Kelly'), pick(P, 'Old Hoss Radbourn') || pick(P, 'Tim Keefe'), rar('Rare'), rar('Common')].filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>GENESIS ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
        <button class="pgen-x">✕ CLOSE</button></div>
      ${DESIGNS.map(d => `<section class="pgen-row">
        <div class="pgen-lab"><b>${d.name}</b><em>${d.yrs}</em><p>${d.note}</p></div>
        <div class="pgen-cards" data-v="${d.k}">${cards.map(html).join('')}</div></section>`).join('')}`;
    document.body.appendChild(root);
    root.querySelectorAll('.pgen-cards').forEach(row => {
      const v = row.dataset.v;
      if (!v) return;
      row.querySelectorAll('.pc2').forEach((c, i) => {
        // The lithograph is printed in color: same face, drawn with a colored palette.
        if (v === 'litho' && window.CardArt) { const img = c.querySelector('.pc2-ph img'); if (img) img.src = window.CardArt.portrait(cards[i], 'golden', true); }
        c.classList.add('pc2-v-' + v);
        if (v === 'champ') {
          const ph = c.querySelector('.pc2-ph');
          if (ph && !ph.querySelector('.pgv-scene')) ph.insertAdjacentHTML('beforeend', '<i class="pgv-scene"><svg viewBox="0 0 20 20"><circle cx="15" cy="5" r="2.2" fill="#f5efe0" stroke="#7a1f14" stroke-width=".8"/><path d="M3 17 L12 6" stroke="#8a5a2b" stroke-width="2.2" stroke-linecap="round"/></svg></i>');
        }
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (ser) ser.textContent = ({ studio: 'Studio Series', litho: 'Lithograph Series', champ: 'Champions Series', mayo: 'Cut Plug Series' })[v] + ' · ' + y;
      });
    });
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_genesis.css?v=5';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
