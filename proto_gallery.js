// index.html?proto=gallery : every card design of every era, side by side (plain + the era's series).
(function () {
  if (!/[?&]proto=gallery/.test(location.search)) return;
  const ERAS = [['genesis', 'The Genesis', ['studio', 'litho', 'champ', 'mayo']], ['deadball', 'Deadball', ['gold205', 'turkey', 'cj14', 'oval16']],
    ['golden', 'Golden', ['strip', 'goudey', 'stars', 'pb41']], ['integration', 'Integration', ['bw48', 'flat49', 'panel52', 'ring59']],
    ['expansion', 'Expansion', ['classic', 'burlap', 'black', 'psych']], ['bighair', 'Turf', ['pennant', 'streak', 'stripe', 'premium']],
    ['steroid', 'Steroid', ['finest', 'metal', 'club', 'mill']], ['efficiency', 'Moneyball', ['arc06', 'vert07', 'wave15', 'blackref']],
    ['modern', 'Statcast', ['smoke16', 'split20', 'club', 't24']]];
  const RARS = ['Common', 'Rare', 'Legendary'];
  function build() {
    const P = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || window.LAHMAN_POOL;
    if (!P || !window.createCardHTML) return setTimeout(build, 300);
    try { if (window.AudioManager && !AudioManager.isMuted()) AudioManager.toggleMute(); } catch (e) { /* no audio */ }
    const g = document.createElement('div');
    g.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#1b1f24;overflow:auto;padding:16px;font-family:Oswald,sans-serif;color:#e2e8f0';
    let html = '<h1 style="font:20px \'Press Start 2P\',monospace;color:#fde68a;margin:0 0 12px">CARD DESIGNS · ALL ERAS</h1>';
    ERAS.forEach(([era, name, vs]) => {
      html += `<h2 style="font-size:18px;color:#fde68a;margin:18px 0 6px;border-bottom:1px solid #334155">${name} Era</h2><div style="display:flex;flex-wrap:wrap;gap:14px">`;
      const only = (location.search.match(/only=([\w,]+)/) || [])[1];
      ['', ...vs].filter(v => !only || only.split(',').includes(v)).forEach((v, k) => {
        const rar = RARS[k % RARS.length];
        const pool = P.filter(p => String(p.era || '').toLowerCase().includes(name.toLowerCase().split(' ').pop()) && p.rarity === rar);
        const c = pool[Math.floor(Math.random() * pool.length)] || P.find(p => String(p.era || '').toLowerCase().includes(name.toLowerCase()));
        if (!c) return;
        html += `<div style="text-align:center${only ? ';zoom:2' : ''}"><div style="font-size:12px;margin-bottom:4px;color:#94a3b8">${v ? v.toUpperCase() : 'PLAIN'}</div><div data-gv="${v}">${window.createCardHTML(c, c.pos)}</div></div>`;
      });
      html += '</div>';
    });
    g.innerHTML = html;
    g.querySelectorAll('[data-gv]').forEach(w => { const card = w.querySelector('.pc2'); if (card) card.dataset.forceV = w.dataset.gv; });
    // re-insert so card_variants.js decorates them with the forced design
    const frag = document.createDocumentFragment(); while (g.firstChild) frag.appendChild(g.firstChild);
    document.body.appendChild(g); g.appendChild(frag);
  }
  if (document.readyState === 'complete') build(); else addEventListener('load', build);
})();
