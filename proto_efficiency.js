// Efficiency card designs — look-only mockup. Opens with ?proto=efficiency and never touches the game:
// real cards (createCardHTML) shown in the current design and four new ones side by side.
(function () {
  'use strict';
  if (!/[?&]proto=efficiency\b/.test(location.search)) return;

  const DESIGNS = [
    { k: '', name: 'TEAM BORDER (current)', yrs: '2006–2015', note: 'White stock with a team-color border and a slanted name band. Stays for the whole era.' },
    { k: 'arc06', name: 'SWOOSH ARC', yrs: '2006–2008', note: 'Topps 2006-09 feel: white stock, the photo with a rounded corner, a team-color arc sweeping under it with the name and the team code in a white circle.' },
    { k: 'vert07', name: 'SIDE BAR', yrs: '2007–2010', note: 'Upper Deck feel: photo to the edge, a team-color bar down the right side with the name written up it.' },
    { k: 'wave15', name: 'WAVE', yrs: '2013–2015', note: 'Topps 2014-15 feel: photo to the edge, a two-tone team-color wave rising across the bottom of the photo with the name in white and the team code in a rounded tile.' },
    { k: 'blackref', name: 'BLACK CHROME', yrs: '2010–2015', note: 'Chrome refractor feel: the whole card is dark polished chrome, with a rainbow refractor shine running across it and the name in brushed silver.' }
  ];

  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Efficiency/.test(c.era || '');
    const pick = (pool, n) => pool.find(c => c.name === n && gen(c));
    const cards = [pick(B, 'Albert Pujols'), pick(P, 'Clayton Kershaw'), pick(B, 'Miguel Cabrera'), pick(P, 'Roy Halladay'), pick(B, 'Joe Mauer')].filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>EFFICIENCY ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
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
        const ph = c.querySelector('.pc2-ph');
        const nm = c.querySelector('.pc2-name');
        if (v === 'arc06' && nm) nm.insertAdjacentHTML('afterbegin', `<i class="pgv-dot">${team}</i>`);
        if (v === 'vert07' && ph) ph.insertAdjacentHTML('beforeend', `<i class="pgv-bar"><b>${name}</b><em>${team}</em></i>`);
        if (v === 'wave15' && ph) ph.insertAdjacentHTML('beforeend', `<i class="pgv-wave"><b>${name}</b><em>${team}</em></i>`);
        if (v === 'blackref') c.querySelector('.pc2-front').insertAdjacentHTML('beforeend', '<i class="pgv-shine"></i>');
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (ser) ser.textContent = ({ arc06: 'Arc Series', vert07: 'Side Series', wave15: 'Wave Series', blackref: 'Chrome Series' })[v] + ' · ' + y;
      });
    });
    // Side bar: a long name shrinks until it leaves room for the team code.
    setTimeout(() => root.querySelectorAll('.pgv-bar b').forEach(b => {
      let f = 11; while (b.scrollHeight > b.clientHeight + 1 && f > 6) { f -= 0.5; b.style.fontSize = f + 'px'; }
    }), 400);
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_efficiency.css?v=5';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
