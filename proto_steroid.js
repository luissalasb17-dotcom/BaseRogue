// Steroid card designs — look-only mockup. Opens with ?proto=steroid and never touches the game:
// real cards (createCardHTML) shown in the current design and three new ones side by side.
(function () {
  'use strict';
  if (!/[?&]proto=steroid\b/.test(location.search)) return;

  const DESIGNS = [
    { k: '', name: 'FOIL (current)', yrs: '1994–2005', note: 'Silver foil body, photo to the edges, gold name block over the photo. Stays for the whole era.' },
    { k: 'finest', name: 'CHROME GEOMETRIC', yrs: '1994–1999', note: 'Finest style: dark chrome with beveled panels in the rarity color, refractor sheen, name on a chrome plate.' },
    { k: 'metal', name: 'ETCHED METAL', yrs: '1996–1999', note: 'Metal Universe style: the player over an etched metal background, huge outlined name, no borders.' },
    { k: 'club', name: 'FULL BLEED', yrs: '1994–2005', note: 'Stadium Club style: the photo is the whole card, gold foil script name, team color stripe down the side.' },
    { k: 'mill', name: 'MILLENNIUM', yrs: '2000–2005', note: 'Early-2000s flagship style: grey-white border, team color tab with the position, round team badge.' }
  ];

  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Steroid/.test(c.era || '');
    const pick = (pool, n) => pool.find(c => c.name === n && gen(c));
    const rar = r => B.filter(c => gen(c) && c.rarity === r)[3];
    const cards = [pick(B, 'Ken Griffey Jr.'), pick(B, 'Mike Piazza'), P.find(c => c.name === 'Pedro Martinez' && c.role === 'SP'), pick(B, 'Ichiro Suzuki'), rar('Uncommon')].filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>STEROID ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
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
        if (v === 'mill') {
          const top = c.querySelector('.pc2-top'), team = cards[i] && cards[i].team;
          if (top && team) top.insertAdjacentHTML('beforeend', `<i class="pgv-badge">${team}</i>`);
        }
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (ser) ser.textContent = ({ finest: 'Chrome Series', metal: 'Metal Series', club: 'Club Series', mill: 'Millennium Series' })[v] + ' · ' + y;
      });
    });
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_steroid.css?v=8';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
