// Big Hair card designs — look-only mockup. Opens with ?proto=bighair and never touches the game:
// real cards (createCardHTML) shown in the current design and three new ones side by side.
(function () {
  'use strict';
  if (!/[?&]proto=bighair\b/.test(location.search)) return;

  const DESIGNS = [
    { k: '', name: 'WOODGRAIN (current)', yrs: '1977–1993', note: 'Honey wood border, black rule around the photo, name strip in the team color. Stays for the whole era.' },
    { k: 'pennant', name: 'PENNANT', yrs: '1977–1983', note: 'Topps 1977-81 feel: a felt pennant with the team code and a ball cap with the position, both in fat outlined letters with a 3D shadow, like the name under the photo.' },
    { k: 'streak', name: 'BLACK STREAKS', yrs: '1984–1987', note: 'Donruss 1985 style: black border with diagonal streaks in the team color, name on a white bar.' },
    { k: 'stripe', name: 'DIAGONAL STRIPES', yrs: '1986–1990', note: 'Fleer 1988 style: red-white-blue pinstripes in two corners, name in black italic up top, round team badge.' },
    { k: 'premium', name: 'PREMIUM HOLOGRAM', yrs: '1989–1993', note: 'Upper Deck 1989 style: white premium stock, a team-color base path down the right side ending in a home plate with the OVR, hologram in the corner.' }
  ];

  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Big Hair/.test(c.era || '');
    const pick = (pool, n) => pool.find(c => c.name === n && gen(c));
    const cards = [pick(P, 'Nolan Ryan'), pick(P, 'Dwight Gooden'), pick(B, 'Don Mattingly'), pick(B, 'Tony Gwynn'), pick(B, 'Rickey Henderson')].filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>BIG HAIR ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
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
        if (v === 'pennant' && ph && team) ph.insertAdjacentHTML('beforeend', `<i class="pgv-pennant">${team}</i><i class="pgv-cap">${(c.querySelector('.pc2-pos') || {}).textContent || ''}</i>`);
        if (v === 'premium' && ph) ph.insertAdjacentHTML('beforeend', '<i class="pgv-holo"></i>');
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (ser) ser.textContent = ({ pennant: 'Flag Series', streak: 'Streak Series', stripe: 'Stripe Series', premium: 'Premium Series' })[v] + ' · ' + y;
      });
    });
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_bighair.css?v=11';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
