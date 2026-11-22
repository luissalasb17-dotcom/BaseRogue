// Static site pages (about, how to play, 162-0, Spanish landing): real BaseRogue cards in a fan
// under the title and drifting in the background, like the game's main menu. Uses card_art.js
// (portraits) and cards2.css / cards2_eras.css (the card designs); presentation only.
(function () {
  'use strict';
  const CARDS = [{"playerID": "ruthba01", "name": "Babe Ruth", "pos": "RF", "era": "Golden Era (1920-1941)", "team": "NYY", "year": 1923, "ovr": 97.9, "rarity": "Legendary", "con": 119, "pwr": 125, "eye": 125, "k_avd": 12, "spd": 41, "def": 73}, {"playerID": "clemero01", "name": "Roberto Clemente", "pos": "RF", "era": "Expansion (1961-1976)", "team": "PIT", "year": 1967, "ovr": 96.8, "rarity": "Legendary", "con": 117, "pwr": 61, "eye": 24, "k_avd": 60, "spd": 72, "def": 124}, {"playerID": "henderi01", "name": "Rickey Henderson", "pos": "LF", "era": "Turf Era (1977-1993)", "team": "OAK", "year": 1990, "ovr": 95.3, "rarity": "Legendary", "con": 81, "pwr": 52, "eye": 113, "k_avd": 76, "spd": 125, "def": 94}, {"playerID": "suzukic01", "name": "Ichiro Suzuki", "pos": "RF", "era": "Steroid Era (1994-2005)", "team": "SEA", "year": 2004, "ovr": 90.1, "rarity": "Legendary", "con": 108, "pwr": 15, "eye": 15, "k_avd": 93, "spd": 111, "def": 110}, {"playerID": "gibsojo99", "name": "Josh Gibson", "pos": "C", "era": "Golden Era (1920-1941)", "team": "NLB", "year": 1943, "ovr": 96.8, "rarity": "Legendary", "con": 124, "pwr": 125, "eye": 87, "k_avd": 24, "spd": 48, "def": 56}, {"playerID": "wagneho01", "name": "Honus Wagner", "pos": "SS", "era": "Deadball (1901-1919)", "team": "PIT", "year": 1908, "ovr": 99.8, "rarity": "Legendary", "con": 124, "pwr": 88, "eye": 64, "k_avd": 88, "spd": 96, "def": 99}, {"playerID": "troutmi01", "name": "Mike Trout", "pos": "CF", "era": "Moneyball Era (2006-2015)", "team": "LAA", "year": 2012, "ovr": 95.9, "rarity": "Legendary", "con": 91, "pwr": 92, "eye": 108, "k_avd": 36, "spd": 96, "def": 65}, {"playerID": "mayswi01", "name": "Willie Mays", "pos": "CF", "era": "Expansion (1961-1976)", "team": "SFG", "year": 1965, "ovr": 99.9, "rarity": "Legendary", "con": 101, "pwr": 115, "eye": 68, "k_avd": 68, "spd": 115, "def": 122}, {"playerID": "willite01", "name": "Ted Williams", "pos": "LF", "era": "Integration (1942-1960)", "team": "BOS", "year": 1946, "ovr": 99.7, "rarity": "Legendary", "con": 125, "pwr": 120, "eye": 125, "k_avd": 82, "spd": 42, "def": 52}, {"playerID": "ansonca01", "name": "Cap Anson", "pos": "1B", "era": "The Genesis Era (1871-1900)", "team": "CHC", "year": 1886, "ovr": 94.8, "rarity": "Legendary", "con": 119, "pwr": 77, "eye": 73, "k_avd": 120, "spd": 20, "def": 79}, {"playerID": "ohtansh01", "name": "Shohei Ohtani", "pos": "DH", "era": "Statcast Era (2016-Pres)", "team": "LAD", "year": 2024, "ovr": 90.3, "rarity": "Legendary", "con": 75, "pwr": 97, "eye": 82, "k_avd": 27, "spd": 76, "def": 32}, {"playerID": "ortizda01", "name": "David Ortiz", "pos": "DH", "era": "Moneyball Era (2006-2015)", "team": "BOS", "year": 2007, "ovr": 94.0, "rarity": "Legendary", "con": 85, "pwr": 103, "eye": 97, "k_avd": 55, "spd": 14, "def": 32}, {"playerID": "robinja02", "name": "Jackie Robinson", "pos": "2B", "era": "Integration (1942-1960)", "team": "LAD", "year": 1951, "ovr": 92.0, "rarity": "Legendary", "con": 91, "pwr": 53, "eye": 66, "k_avd": 97, "spd": 99, "def": 88}, {"playerID": "martipe02", "name": "Pedro Martinez", "role": "SP", "era": "Steroid Era (1994-2005)", "team": "BOS", "year": 2000, "ovr": 99.9, "rarity": "Legendary", "h9": 110, "k9": 112, "bb9": 104, "hr9": 97, "sta": 109, "clt": 87}, {"playerID": "koufasa01", "name": "Sandy Koufax", "role": "SP", "era": "Expansion (1961-1976)", "team": "LAD", "year": 1963, "ovr": 94.6, "rarity": "Legendary", "h9": 96, "k9": 106, "bb9": 74, "hr9": 68, "sta": 102, "clt": 74}, {"playerID": "paigesa01", "name": "Satchel Paige", "role": "SP", "era": "Golden Era (1920-1941)", "team": "NLB", "year": 1934, "ovr": 95.1, "rarity": "Legendary", "h9": 88, "k9": 96, "bb9": 87, "hr9": 102, "sta": 104, "clt": 63}, {"playerID": "riverma01", "name": "Mariano Rivera", "role": "RP", "era": "Steroid Era (1994-2005)", "team": "NYY", "year": 1996, "ovr": 95.2, "rarity": "Legendary", "h9": 109, "k9": 85, "bb9": 109, "hr9": 125, "sta": 49, "clt": 125}, {"playerID": "johnswa01", "name": "Walter Johnson", "role": "SP", "era": "Deadball (1901-1919)", "team": "WSH", "year": 1913, "ovr": 99.9, "rarity": "Legendary", "h9": 99, "k9": 90, "bb9": 113, "hr9": 125, "sta": 122, "clt": 102}, {"playerID": "youngcy01", "name": "Cy Young", "role": "SP", "era": "The Genesis Era (1871-1900)", "team": "HIST", "year": 1892, "ovr": 92.9, "rarity": "Legendary", "h9": 66, "k9": 41, "bb9": 120, "hr9": 73, "sta": 117, "clt": 89}, {"playerID": "valenfe01", "name": "Fernando Valenzuela", "role": "SP", "era": "Turf Era (1977-1993)", "team": "LAD", "year": 1986, "ovr": 89.6, "rarity": "Epic", "h9": 71, "k9": 70, "bb9": 56, "hr9": 82, "sta": 107, "clt": 59}, {"playerID": "skenepa01", "name": "Paul Skenes", "role": "SP", "era": "Statcast Era (2016-Pres)", "team": "PIT", "year": 2025, "ovr": 88.7, "rarity": "Epic", "h9": 74, "k9": 73, "bb9": 78, "hr9": 75, "sta": 87, "clt": 63}];
  const ERA = e => /Genesis/.test(e) ? 'genesis' : /Deadball/.test(e) ? 'deadball' : /Golden/.test(e) ? 'golden' : /Integration/.test(e) ? 'integration'
    : /Expansion/.test(e) ? 'expansion' : /Turf/.test(e) ? 'bighair' : /Steroid/.test(e) ? 'steroid' : /Moneyball/.test(e) ? 'efficiency' : 'modern';
  const SERIES = { genesis: 'Cabinet Series', deadball: 'Tobacco Series', golden: 'Big League Series', integration: 'Painted Series', expansion: 'Pennant Series', bighair: 'Woodgrain Series', steroid: 'Foil Series', efficiency: 'Flagship Series', modern: 'Chrome Series' };
  // ── Card backs like the game (user, Nov 2026): career line, honors and flag. The career data is
  // big, so it is fetched the first time a card is flipped (card_art.js waits for ensureCareer).
  const CTRY = {};
  if (!window.ensureCareer) {
    let career = null;
    window.ensureCareer = () => career || (career = new Promise(ok => {
      const s = document.createElement('script');
      s.src = '/career_lite.js?v=p1'; s.onload = ok; s.onerror = () => { career = null; ok(); };
      document.head.appendChild(s);
    }));
  }
  if (!window.getPlayerCareerData) {
    window.getPlayerCareerData = p => {
      const db = window.CAREER_STATS_DB || {};
      const e = (p.playerID && db[p.playerID]) || db[`${p.name}_${p.year}`] || db[p.name];
      if (!e) return null;
      const d = v => (v === undefined || v === null ? '-' : v);
      return { war: d(e.war), mvp: e.mvp || 0, roy: e.roy || 0, ss: e.ss || 0, gg: e.gg || 0, cy: e.cy || 0, rel: e.rel || 0, allstars: e.allstars || 0, hof: !!e.hof,
        h: d(e.h), hr: d(e.hr), rbi: d(e.rbi), avg: d(e.avg), ops: d(e.ops), sb: d(e.sb), g: d(e.g), ab: d(e.ab),
        w: d(e.w), l: d(e.l), era: d(e.era), so: d(e.so), ip: d(e.ip), whip: d(e.whip), sv: d(e.sv) };
    };
  }
  if (!window.getPlayerFlagHTML) {
    window.getPlayerFlagHTML = p => {
      const iso = (CTRY[p.playerID] || (window.PLAYER_FLAGS_DB || {})[p.playerID] || 'us').toLowerCase();
      return `<img src="https://flagcdn.com/w20/${iso}.png" srcset="https://flagcdn.com/w40/${iso}.png 2x" style="width:17px;height:12px;border-radius:2px;object-fit:cover;display:inline-block;vertical-align:middle" alt="${iso.toUpperCase()}" loading="lazy">`;
    };
  }
  const grade = v => {
    v = Math.round(v || 0);
    if (v >= 100) return ['S', '#ffd700'];
    if (v >= 80) return ['A' + (v >= 95 ? '+' : v < 85 ? '-' : ''), '#22d3ee'];
    if (v >= 60) return ['B' + (v >= 75 ? '+' : v < 65 ? '-' : ''), '#4ade80'];
    if (v >= 40) return ['C' + (v >= 55 ? '+' : v < 45 ? '-' : ''), '#94a3b8'];
    if (v >= 20) return ['D' + (v >= 35 ? '+' : v < 25 ? '-' : ''), '#f97316'];
    return ['F', '#ef4444'];
  };
  const RAR = { L: 'Legendary', X: 'Elite', E: 'Epic', R: 'Rare', U: 'Uncommon', C: 'Common' };
  const ERA_LABEL = { genesis: 'Genesis', deadball: 'Deadball', golden: 'Golden', integration: 'Integration', expansion: 'Expansion', bighair: 'Turf', steroid: 'Steroid', efficiency: 'Moneyball', modern: 'Statcast' };
  const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  // Both shapes: the long one (CARDS above) and the compact one of site_cards.js / the ranking pages.
  function norm(p) {
    if (p.n !== undefined) {
      const pit = p.k === 'P', v = p.v || [];
      const o = { playerID: p.id, name: p.n, era: p.e, team: p.t, year: p.y, ovr: p.o, rarity: RAR[p.r] || 'Common', hand: p.h || '', debut: p.d, last: p.l, sec: p.s || '', badges: p.b || 0, pit };
      if (pit) Object.assign(o, { role: p.p, h9: v[0], k9: v[1], bb9: v[2], hr9: v[3], sta: v[4], clt: v[5] });
      else Object.assign(o, { pos: p.p, con: v[0], pwr: v[1], eye: v[2], k_avd: v[3], spd: v[4], def: v[5] });
      return o;
    }
    return Object.assign({}, p, { era: ERA(p.era || ''), pit: p.h9 !== undefined && p.h9 !== null, hand: (window.PlayerHands || {})[p.playerID] || '' });
  }
  function card(raw) {
    const p = norm(raw), pit = p.pit, era = p.era;
    if (raw.c && p.playerID) CTRY[p.playerID] = raw.c;
    const rt = pit ? [['H/9', p.h9], ['K/9', p.k9], ['BB/9', p.bb9], ['HR/9', p.hr9], ['STA', p.sta], ['CLT', p.clt]]
      : [['CON', p.con], ['PWR', p.pwr], ['EYE', p.eye], ['K-AVD', p.k_avd], ['SPD', p.spd], ['DEF', p.def]];
    const team = String(p.team || '').toUpperCase();
    const tname = (window.SITE_FRANCH || {})[team] || ({ NLB: 'Negro Leagues', HIST: 'Historical Franchise' })[team] || team;
    const tc = ((window.CardArt && window.CardArt.TEAM_COLORS) || {})[team] || '#3a3a3a';
    const img = window.CardArt ? window.CardArt.portrait(p, era, pit) : '';
    const len = p.name.length, sz = len >= 19 ? 'pc2-n-xs' : len >= 15 ? 'pc2-n-sm' : '';
    const ok = c => c === 'R' || c === 'L' || c === 'S';
    const h = p.hand || '', hand = (ok(h[0]) || ok(h[1])) ? `${ok(h[0]) ? h[0] : '–'}/${ok(h[1]) ? h[1] : '–'}` : '';
    const pos = p.pos || p.role || '';
    const ovr = Math.floor(p.ovr || 0);
    const sparks = /Legendary|Elite|Epic/.test(p.rarity) ? `<div class="pc2-sparks">${[0, 1, 2, 3, 4].map(k => `<i style="left:${8 + k * 19}%;top:${12 + (k * 37) % 70}%;animation-delay:${(k * 0.53).toFixed(2)}s"></i>`).join('')}</div>` : '';
    const b = p.badges || 0;
    const patch = (k, l, t) => `<span class="pc2-badge pc2-badge-${k}" title="${t}"><i>${l}</i></span>`;
    const badges = b ? `<div class="pc2-badges">${b & 1 ? patch('oct', 'PH', 'Playoff Hero') : ''}${b & 2 ? patch('cap', 'CL', 'Clubhouse Leader') : ''}${b & 4 ? patch('wh', 'W', 'Workhorse') : ''}</div>` : '';
    const badgeNames = [b & 1 ? 'Playoff Hero' : '', b & 2 ? 'Clubhouse Leader' : '', b & 4 ? 'Workhorse' : ''].filter(Boolean).join(' · ');
    const yrs = p.debut && p.last ? `${p.debut}–${p.last}` : '';
    const flipBtn = cls => `<button type="button" class="pc2-flip ${cls}" title="Flip card" aria-label="Flip card">↻</button>`;
    return `<div style="--tc:${tc}" class="player-card pc2 pc2-e-${era} rarity-${p.rarity}"
      data-pid="${esc(p.playerID)}" data-name="${esc(p.name)}" data-year="${esc(p.year)}" data-kind="${pit ? 'P' : 'B'}" data-badges="${esc(badgeNames)}"
      data-pos="${esc(pos)}" data-tname="${esc(tname)}" data-hand="${esc(hand)}" data-ovr="${ovr}" data-rar="${p.rarity}" data-rt="${esc(rt.map(([k, v]) => k + ' ' + Math.round(v || 0)).join('|'))}">
      <div class="pc2-in"><div class="pc2-face pc2-front">
        <div class="pc2-top"><span class="pc2-pos">${esc(pos)}</span><span class="pc2-ovr">${ovr}</span><span class="pc2-year">${esc(p.year)}</span></div>
        <div class="pc2-ph">${img ? `<img src="${img}" alt="${esc(p.name)}" draggable="false">` : '<div class="pc2-noimg"></div>'}<div class="pc2-foil"></div>${sparks}${badges}<span class="pc2-series">${SERIES[era]} · ${esc(p.year)}</span>${flipBtn('')}</div>
        <div class="pc2-name ${sz}">${esc(p.name)}</div>
        <div class="pc2-chips"><span class="pc2-chip pc2-chip-era pc2-ce-${era}">${ERA_LABEL[era] || ''}</span><span class="pc2-chip" title="${esc(tname)}">${esc(team)}</span>${p.sec ? `<span class="pc2-chip">SEC ${esc(String(p.sec).split(',').slice(0, 2).join(','))}</span>` : ''}</div>
        <div class="pc2-rt">${rt.map(([k, v]) => { const g = grade(v); return `<div class="pc2-r"><span>${k}</span><b style="color:${g[1]}">${g[0]}</b></div>`; }).join('')}</div>
        <div class="pc2-ft"><span>${esc(team)}</span>${hand ? `<span class="pc2-hand" title="Bats / Throws">${hand}</span>` : '<span></span>'}<span class="pc2-sta">${p.rarity}</span></div>
        <div class="pc2-tex"></div><div class="pc2-wear"></div><i class="pc2-rar"></i>
      </div>
      <div class="pc2-face pc2-back">
        <div class="pc2-bh"><span>${esc(p.name)}</span><span class="pc2-ovr">${ovr}</span></div>
        <div class="pc2-sub">${esc(pos)} · ${esc(tname)}${hand ? ' · B/T ' + hand : ''}</div>
        <div class="pc2-sub">${p.rarity} · ${ERA_LABEL[era] || ''}${yrs ? ' · ' + yrs : ''}</div>
        <div class="pc2-lab">RATINGS</div>
        <div class="pc2-nums">${rt.map(([k, v]) => `<div><span>${k}</span><b>${Math.round(v || 0)}</b></div>`).join('')}</div>
        <div class="pc2-back-lazy"></div>${flipBtn('pc2-flip-back')}<div class="pc2-tex"></div><div class="pc2-wear"></div>
      </div></div></div>`;
  }
  window.SiteCard = card;
  // Interactive cards (user, Nov 2026): they lean toward the cursor and the foil follows it.
  const TILT = '.post-card, .rp-card, .site-fan-slot';
  function tilt(root) {
    if (!window.matchMedia('(hover: hover)').matches) return;
    root.addEventListener('pointermove', e => {
      const c = e.target.closest(TILT); if (!c) return;
      const b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
      c.style.setProperty('--rx', (-y * 14).toFixed(1) + 'deg'); c.style.setProperty('--ry', (x * 18).toFixed(1) + 'deg');
      c.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(0) + '%'); c.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(0) + '%');
      c.classList.add('is-tilt');
    });
    root.addEventListener('pointerout', e => {
      const c = e.target.closest(TILT);
      if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); c.classList.remove('is-tilt'); }
    });
  }
  window.SiteTilt = tilt;
  // Right click (long press on phones) a card to see it big, like the Team Preview of the game.
  function viewBig(cardEl) {
    const old = document.querySelector('.site-view'); if (old) old.remove();
    const ov = document.createElement('div');
    ov.className = 'site-view';
    const copy = cardEl.cloneNode(true);
    copy.classList.remove('pc2-flipped');
    const back = copy.querySelector('.pc2-back'); if (back) delete back.dataset.done;
    ov.innerHTML = '<div class="site-view-box"><div class="site-view-card pc2-clickflip"></div><p>Tap the card to flip it · click outside to close</p></div>';
    ov.querySelector('.site-view-card').appendChild(copy);
    ov.addEventListener('click', e => { if (!e.target.closest('.site-view-card')) ov.remove(); });
    document.body.appendChild(ov);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const v = document.querySelector('.site-view'); if (v) v.remove(); } });
  document.addEventListener('contextmenu', e => {
    const c = e.target.closest && e.target.closest('.pc2');
    if (!c || c.closest('.site-view')) return;
    e.preventDefault(); viewBig(c);
  });
  let pressT = 0;
  document.addEventListener('touchstart', e => {
    const c = e.target.closest && e.target.closest('.pc2');
    if (!c || c.closest('.site-view')) return;
    pressT = setTimeout(() => { pressT = 0; viewBig(c); }, 520);
  }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(t => document.addEventListener(t, () => { clearTimeout(pressT); pressT = 0; }, { passive: true }));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function init() {
    // blog posts: specific cards inside the article (<div class="post-cards" data-cards='[...]'>)
    document.querySelectorAll('.post-cards[data-cards]').forEach(el => {
      try { el.innerHTML = JSON.parse(el.dataset.cards).map(p => `<div class="post-card pc2-clickflip">${card(p)}</div>`).join(''); } catch (e) {}
    });
    tilt(document.body);
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
