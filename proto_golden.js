// Golden card designs — look-only mockup. Opens with ?proto=golden and never touches the game:
// real cards (createCardHTML) shown in the current design and three new ones side by side.
(function () {
  'use strict';
  if (!/[?&]proto=golden\b/.test(location.search)) return;

  const DESIGNS = [
    { k: '', name: 'ART DECO (current)', yrs: '1920–1941', note: 'Red stock with deco stripes and a gold slanted banner. Stays for the whole era.' },
    { k: 'strip', name: 'STRIP CARD', yrs: '1920–1932', note: '1920s strip cards: thin cream paper, the photo printed in a single ink of the team color, a plain black frame, the name in serif capitals.' },
    { k: 'goudey', name: 'PAINTED', yrs: '1933–1936', note: 'Goudey 1933 feel: thick white border, a painted portrait on one bright flat color, the name in red capitals on the white.' },
    { k: 'stars', name: 'DIAMOND STARS', yrs: '1934–1936', note: 'Diamond Stars feel: a deco sunburst behind the photo in the team color, cream border, the name in a small dark plate.' },
    { k: 'playball', name: 'PLAY BALL', yrs: '1939–1941', note: 'Play Ball 1939-41 feel: black-and-white photo, plain white border, the name in small black capitals with the team code.' }
  ];

  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Golden/.test(c.era || '');
    const pick = (pool, n) => pool.find(c => c.name === n && gen(c));
    const cards = [pick(B, 'Babe Ruth'), pick(B, 'Lou Gehrig'), pick(P, 'Lefty Grove'), pick(B, 'Jimmie Foxx'), pick(P, 'Carl Hubbell')].filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>GOLDEN ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
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
        if ((v === 'playball') && nm && team) nm.insertAdjacentHTML('beforeend', `<i class="pgv-code">${team}</i>`);
        
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (ser) ser.textContent = ({ strip: 'Strip Series', goudey: 'Painted Series', stars: 'Diamond Stars', playball: 'Play Ball Series' })[v] + ' · ' + y;
      });
    });
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_golden.css?v=2';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
