// DEADBALL card designs — look-only mockup. Opens with ?proto=deadball and never touches the game.
(function () {
  'use strict';
  if (!/[?&]proto=deadball\b/.test(location.search)) return;
  const DESIGNS = [{"k": "", "name": "TOBACCO (current)", "yrs": "1901–1919", "note": "T206 feel: cream stock with a double brown rule, the name between two lines. Stays for the whole era."}, {"k": "gold205", "name": "GOLD BORDER", "yrs": "1909–1911", "note": "T205 feel: a gold-leaf border, the photo in an ornate frame with a notched top, the name in a cartouche under it."}, {"k": "turkey", "name": "CABINET", "yrs": "1911–1913", "note": "Turkey Red cabinet feel: a painted picture hung inside a wide grey mat with an embossed frame, like a print on the wall."}, {"k": "cj14", "name": "CANDY RED", "yrs": "1914–1915", "note": "Cracker Jack feel: bright red stock, the picture on a cream panel, the name and team on a cream strip with red lettering."}, {"k": "oval16", "name": "NEWSPRINT OVAL", "yrs": "1916–1919", "note": "Sporting News feel: pale newsprint, the photo in a soft oval vignette, the name in bold black type with a rule under it."}];
  const SERIES = {"gold205": "Gold Series", "turkey": "Cabinet Series", "cj14": "Candy Series", "oval16": "News Series"};
  const WANT = [[0, "Ty Cobb"], [1, "Walter Johnson"], [0, "Honus Wagner"], [1, "Christy Mathewson"], [0, "Tris Speaker"]];
  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const gen = c => /Deadball/.test(c.era || '');
    const cards = WANT.map(([pit, n]) => (pit ? P : B).find(c => c.name === n && gen(c))).filter(Boolean);
    const html = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');
    const root = document.createElement('div');
    root.id = 'pgen';
    root.innerHTML = `
      <div class="pgen-head"><b>DEADBALL ERA · CARD DESIGNS</b><span>Mockup only. Real cards, same data. Each new design would only go to players whose card year falls in its years.</span>
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
        if (v === 'gold205' && ph) ph.insertAdjacentHTML('beforeend', '<i class="pgv-x pgv-notch"></i>');
        if (v === 'turkey' && ph) ph.insertAdjacentHTML('beforeend', '<i class="pgv-x pgv-nail"></i>');
        if (v === 'cj14' && nm) nm.insertAdjacentHTML('beforeend', `<i class="pgv-x pgv-code">${team}</i>`);
        if (v === 'oval16' && nm) nm.insertAdjacentHTML('beforeend', `<i class="pgv-x pgv-sub">${team} · ${pos}</i>`);
        const ser = c.querySelector('.pc2-series');
        const y = (c.querySelector('.pc2-year') || {}).textContent || '';
        if (ser) ser.textContent = SERIES[v] + ' · ' + y;
      });
    });
    root.querySelector('.pgen-x').onclick = () => root.remove();
  }
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'proto_deadball.css?v=3';
  document.head.appendChild(css);
  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
