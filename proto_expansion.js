// Expansion card designs — look-only mockup. Opens with ?proto=expansion and never touches the game:
// real cards (createCardHTML) shown in the current design and three new ones side by side.
(function () {
  'use strict';
  if (!/[?&]proto=expansion\b/.test(location.search)) return;

  const DESIGNS = [
    { k: '', name: 'TWO-TONE (current)', yrs: '1961–1976', note: 'Team color over yellow, name in a white pill (Topps 1975 feel). Stays for the whole era.' },
    { k: 'classic', name: 'CLASSIC', yrs: '1961–1965', note: 'Topps 1961 mixed with 1976: white stock with a team-color rim round the card, the photo framed in the team color, the name in white on a team-color plate with the team code on a yellow tab.' },
    { k: 'burlap', name: 'BURLAP', yrs: '1966–1969', note: 'Topps 1968 style: woven burlap stock, rounded photo in a cream frame, the name in the team color on a cream plate with the team code.' },
    { k: 'black', name: 'BLACK BORDER', yrs: '1970–1972', note: 'Topps 1971 style: black stock with a white hairline, photo in a white frame, the name in lowercase with the team code in its color.' },
    { k: 'psych', name: 'PSYCHEDELIC', yrs: '1972–1974', note: 'Topps 1972 style: arched tombstone frame in two loud colors, the team in fat bubble letters with a drop shadow.' }
  ];

  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Expansion/.test(c.era || '');
    const pick = (pool, n) => pool.find(c => c.name === n && gen(c));
    const cards = [pick(P, 'Sandy Koufax'), pick(B, 'Roberto Clemente'), pick(P, 'Bob Gibson'), pick(B, 'Johnny Bench'), pick(B, 'Joe Morgan')].filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>EXPANSION ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
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
        if ((v === 'classic' || v === 'burlap' || v === 'black') && nm && team) nm.insertAdjacentHTML('beforeend', `<i class="pgv-code">${team}</i>`);
        if (v === 'psych' && ph && team) ph.insertAdjacentHTML('beforeend', `<i class="pgv-team">${team}</i>`);
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (ser) ser.textContent = ({ classic: 'Classic Series', burlap: 'Burlap Series', black: 'Black Series', psych: 'Groovy Series' })[v] + ' · ' + y;
      });
    });
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_expansion.css?v=16';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
