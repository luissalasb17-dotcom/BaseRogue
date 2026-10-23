// Static site pages (about, how to play, 162-0, Spanish landing): real BaseRogue cards in a fan
// under the title and drifting in the background, like the game's main menu. Uses card_art.js
// (portraits) and cards2.css / cards2_eras.css (the card designs); presentation only.
(function () {
  'use strict';
  const CARDS = [{"playerID": "ruthba01", "name": "Babe Ruth", "pos": "RF", "era": "Golden Era (1920-1941)", "team": "NYY", "year": 1923, "ovr": 97.9, "rarity": "Legendary", "con": 119, "pwr": 125, "eye": 125, "k_avd": 12, "spd": 41, "def": 73}, {"playerID": "clemero01", "name": "Roberto Clemente", "pos": "RF", "era": "Expansion (1961-1976)", "team": "PIT", "year": 1967, "ovr": 96.8, "rarity": "Legendary", "con": 117, "pwr": 61, "eye": 24, "k_avd": 60, "spd": 72, "def": 124}, {"playerID": "henderi01", "name": "Rickey Henderson", "pos": "LF", "era": "Big Hair Era (1977-1993)", "team": "OAK", "year": 1990, "ovr": 95.3, "rarity": "Legendary", "con": 81, "pwr": 52, "eye": 113, "k_avd": 76, "spd": 125, "def": 94}, {"playerID": "suzukic01", "name": "Ichiro Suzuki", "pos": "RF", "era": "Steroid Era (1994-2005)", "team": "SEA", "year": 2004, "ovr": 90.1, "rarity": "Legendary", "con": 108, "pwr": 15, "eye": 15, "k_avd": 93, "spd": 111, "def": 110}, {"playerID": "gibsojo99", "name": "Josh Gibson", "pos": "C", "era": "Golden Era (1920-1941)", "team": "NLB", "year": 1943, "ovr": 96.8, "rarity": "Legendary", "con": 124, "pwr": 125, "eye": 87, "k_avd": 24, "spd": 48, "def": 56}, {"playerID": "wagneho01", "name": "Honus Wagner", "pos": "SS", "era": "Deadball (1901-1919)", "team": "PIT", "year": 1908, "ovr": 99.8, "rarity": "Legendary", "con": 124, "pwr": 88, "eye": 64, "k_avd": 88, "spd": 96, "def": 99}, {"playerID": "troutmi01", "name": "Mike Trout", "pos": "CF", "era": "Efficiency Era (2006-2015)", "team": "LAA", "year": 2012, "ovr": 95.9, "rarity": "Legendary", "con": 91, "pwr": 92, "eye": 108, "k_avd": 36, "spd": 96, "def": 65}, {"playerID": "mayswi01", "name": "Willie Mays", "pos": "CF", "era": "Expansion (1961-1976)", "team": "SFG", "year": 1965, "ovr": 99.9, "rarity": "Legendary", "con": 101, "pwr": 115, "eye": 68, "k_avd": 68, "spd": 115, "def": 122}, {"playerID": "willite01", "name": "Ted Williams", "pos": "LF", "era": "Integration (1942-1960)", "team": "BOS", "year": 1946, "ovr": 99.7, "rarity": "Legendary", "con": 125, "pwr": 120, "eye": 125, "k_avd": 82, "spd": 42, "def": 52}, {"playerID": "ansonca01", "name": "Cap Anson", "pos": "1B", "era": "The Genesis Era (1871-1900)", "team": "CHC", "year": 1886, "ovr": 94.8, "rarity": "Legendary", "con": 119, "pwr": 77, "eye": 73, "k_avd": 120, "spd": 20, "def": 79}, {"playerID": "ohtansh01", "name": "Shohei Ohtani", "pos": "DH", "era": "Modern Era (2016-Pres)", "team": "LAD", "year": 2024, "ovr": 90.3, "rarity": "Legendary", "con": 75, "pwr": 97, "eye": 82, "k_avd": 27, "spd": 76, "def": 32}, {"playerID": "ortizda01", "name": "David Ortiz", "pos": "DH", "era": "Efficiency Era (2006-2015)", "team": "BOS", "year": 2007, "ovr": 94.0, "rarity": "Legendary", "con": 85, "pwr": 103, "eye": 97, "k_avd": 55, "spd": 14, "def": 32}, {"playerID": "robinja02", "name": "Jackie Robinson", "pos": "2B", "era": "Integration (1942-1960)", "team": "LAD", "year": 1951, "ovr": 92.0, "rarity": "Legendary", "con": 91, "pwr": 53, "eye": 66, "k_avd": 97, "spd": 99, "def": 88}, {"playerID": "martipe02", "name": "Pedro Martinez", "role": "SP", "era": "Steroid Era (1994-2005)", "team": "BOS", "year": 2000, "ovr": 99.9, "rarity": "Legendary", "h9": 110, "k9": 112, "bb9": 104, "hr9": 97, "sta": 109, "clt": 87}, {"playerID": "koufasa01", "name": "Sandy Koufax", "role": "SP", "era": "Expansion (1961-1976)", "team": "LAD", "year": 1963, "ovr": 94.6, "rarity": "Legendary", "h9": 96, "k9": 106, "bb9": 74, "hr9": 68, "sta": 102, "clt": 74}, {"playerID": "paigesa01", "name": "Satchel Paige", "role": "SP", "era": "Golden Era (1920-1941)", "team": "NLB", "year": 1934, "ovr": 95.1, "rarity": "Legendary", "h9": 88, "k9": 96, "bb9": 87, "hr9": 102, "sta": 104, "clt": 63}, {"playerID": "riverma01", "name": "Mariano Rivera", "role": "RP", "era": "Steroid Era (1994-2005)", "team": "NYY", "year": 1996, "ovr": 95.2, "rarity": "Legendary", "h9": 109, "k9": 85, "bb9": 109, "hr9": 125, "sta": 49, "clt": 125}, {"playerID": "johnswa01", "name": "Walter Johnson", "role": "SP", "era": "Deadball (1901-1919)", "team": "WSH", "year": 1913, "ovr": 99.9, "rarity": "Legendary", "h9": 99, "k9": 90, "bb9": 113, "hr9": 125, "sta": 122, "clt": 102}, {"playerID": "youngcy01", "name": "Cy Young", "role": "SP", "era": "The Genesis Era (1871-1900)", "team": "HIST", "year": 1892, "ovr": 92.9, "rarity": "Legendary", "h9": 66, "k9": 41, "bb9": 120, "hr9": 73, "sta": 117, "clt": 89}, {"playerID": "valenfe01", "name": "Fernando Valenzuela", "role": "SP", "era": "Big Hair Era (1977-1993)", "team": "LAD", "year": 1986, "ovr": 89.6, "rarity": "Epic", "h9": 71, "k9": 70, "bb9": 56, "hr9": 82, "sta": 107, "clt": 59}, {"playerID": "skenepa01", "name": "Paul Skenes", "role": "SP", "era": "Modern Era (2016-Pres)", "team": "PIT", "year": 2025, "ovr": 88.7, "rarity": "Epic", "h9": 74, "k9": 73, "bb9": 78, "hr9": 75, "sta": 87, "clt": 63}];
  const ERA = e => /Genesis/.test(e) ? 'genesis' : /Deadball/.test(e) ? 'deadball' : /Golden/.test(e) ? 'golden' : /Integration/.test(e) ? 'integration'
    : /Expansion/.test(e) ? 'expansion' : /Big Hair/.test(e) ? 'bighair' : /Steroid/.test(e) ? 'steroid' : /Efficiency/.test(e) ? 'efficiency' : 'modern';
  const SERIES = { genesis: 'Cabinet Series', deadball: 'Tobacco Series', golden: 'Big League Series', integration: 'Painted Series', expansion: 'Pennant Series', bighair: 'Woodgrain Series', steroid: 'Foil Series', efficiency: 'Flagship Series', modern: 'Chrome Series' };
  const grade = v => {
    v = Math.round(v || 0);
    if (v >= 100) return ['S', '#ffd700'];
    if (v >= 80) return ['A' + (v >= 95 ? '+' : v < 85 ? '-' : ''), '#22d3ee'];
    if (v >= 60) return ['B' + (v >= 75 ? '+' : v < 65 ? '-' : ''), '#4ade80'];
    if (v >= 40) return ['C' + (v >= 55 ? '+' : v < 45 ? '-' : ''), '#94a3b8'];
    if (v >= 20) return ['D' + (v >= 35 ? '+' : v < 25 ? '-' : ''), '#f97316'];
    return ['F', '#ef4444'];
  };
  function card(p) {
    const pit = p.h9 !== undefined && p.h9 !== null;
    const era = ERA(p.era || '');
    const rt = pit ? [['H/9', p.h9], ['K/9', p.k9], ['BB/9', p.bb9], ['HR/9', p.hr9], ['STA', p.sta], ['CLT', p.clt]]
      : [['CON', p.con], ['PWR', p.pwr], ['EYE', p.eye], ['K-AVD', p.k_avd], ['SPD', p.spd], ['DEF', p.def]];
    const tc = ((window.CardArt && window.CardArt.TEAM_COLORS) || {})[String(p.team).toUpperCase()] || '#3a3a3a';
    const img = window.CardArt ? window.CardArt.portrait(p, era, pit) : '';
    const len = p.name.length, sz = len >= 19 ? 'pc2-n-xs' : len >= 15 ? 'pc2-n-sm' : '';
    const sparks = (p.rarity === 'Legendary' || p.rarity === 'Epic') ? `<div class="pc2-sparks">${[0, 1, 2, 3, 4].map(k => `<i style="left:${8 + k * 19}%;top:${12 + (k * 37) % 70}%;animation-delay:${(k * 0.53).toFixed(2)}s"></i>`).join('')}</div>` : '';
    return `<div style="--tc:${tc}" class="player-card pc2 pc2-e-${era} rarity-${p.rarity}" aria-hidden="true">
      <div class="pc2-in"><div class="pc2-face pc2-front">
        <div class="pc2-top"><span class="pc2-pos">${p.pos || p.role}</span><span class="pc2-ovr">${Math.floor(p.ovr)}</span><span class="pc2-year">${p.year}</span></div>
        <div class="pc2-ph">${img ? `<img src="${img}" alt="">` : '<div class="pc2-noimg"></div>'}<div class="pc2-foil"></div>${sparks}<span class="pc2-series">${SERIES[era]} · ${p.year}</span></div>
        <div class="pc2-name ${sz}">${p.name}</div>
        <div class="pc2-rt">${rt.map(([k, v]) => { const g = grade(v); return `<div class="pc2-r"><span>${k}</span><b style="color:${g[1]}">${g[0]}</b></div>`; }).join('')}</div>
        <div class="pc2-ft"><span>${p.team}</span><span></span><span class="pc2-sta">${p.rarity}</span></div>
        <div class="pc2-tex"></div><div class="pc2-wear"></div>
      </div></div></div>`;
  }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function init() {
    const deck = shuffle(CARDS);
    // the fan under the title: five cards, tilted like the main menu
    const fan = document.querySelector('.site-fan');
    if (fan) {
      const five = deck.slice(0, 5);
      fan.innerHTML = five.map((p, i) => `<div class="site-fan-slot" style="--i:${i - 2}">${card(p)}</div>`).join('');
    }
    // the drifting cards behind the page
    const bg = document.querySelector('.site-bgcards');
    if (bg) {
      const rest = deck.slice(5).concat(deck.slice(0, 5));
      const n = window.innerWidth < 700 ? 6 : 14;
      bg.innerHTML = rest.slice(0, n).map((p, i) => {
        const side = i % 2 ? 'r' : 'l';
        const x = side === 'l' ? 1 + Math.random() * 14 : 85 - Math.random() * 14;
        const y = (i / n) * 100 + Math.random() * 4;
        const r = (Math.random() - 0.5) * 34, s = 0.62 + Math.random() * 0.3, d = 14 + Math.random() * 12;
        return `<div class="site-bg-slot" style="left:${x}%;top:${y}%;--r:${r.toFixed(1)}deg;--s:${s.toFixed(2)};--dur:${d.toFixed(1)}s;--del:${(-Math.random() * d).toFixed(1)}s">${card(p)}</div>`;
      }).join('');
    }
    // cards lean toward the cursor in the fan
    if (fan && window.matchMedia('(hover: hover)').matches) {
      fan.addEventListener('pointermove', e => {
        const c = e.target.closest('.site-fan-slot'); if (!c) return;
        const b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
        c.style.setProperty('--rx', (-y * 14).toFixed(1) + 'deg'); c.style.setProperty('--ry', (x * 18).toFixed(1) + 'deg');
        c.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(0) + '%');
      });
      fan.addEventListener('pointerleave', () => fan.querySelectorAll('.site-fan-slot').forEach(c => { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); }));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
