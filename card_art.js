// Card art for the 2.0 trading card (createCardHTML in ui.js builds the markup).
// - Pixel portrait generated from the player id: the same face for the same player
//   during a session, a new face each time the game is opened (SESSION_SEED),
//   printed in two inks (team colour + the paper / ink of the card's era).
//   Two inks on purpose: there is no data on what each player looked like, and a
//   random skin tone would misrepresent real people.
// - Flip: the small ↻ button turns any card; inside the Dex detail a click flips it.
// - The back is filled on the first flip (career line and flag come from basedex.js).
(function () {
  'use strict';

  const TEAM_COLORS = {
    ARI: '#a71930', ATL: '#13274f', BAL: '#df4601', BOS: '#bd3039', CHC: '#0e3386', CHW: '#27251f',
    CIN: '#c6011f', CLE: '#0c2340', COL: '#33006f', DET: '#0c2340', HOU: '#eb6e1f', KCR: '#004687',
    LAA: '#ba0021', LAD: '#005a9c', MIA: '#00a3e0', MIL: '#12284b', MIN: '#002b5c', NYM: '#002d72',
    NYY: '#0c2340', OAK: '#003831', PHI: '#e81828', PIT: '#27251f', SDP: '#2f241d', SEA: '#005c5c',
    SFG: '#fd5a1e', STL: '#c41e3a', TBR: '#092c5c', TEX: '#003278', TOR: '#134a8e', WSN: '#ab0003',
    NLB: '#5a3b21', HIST: '#4a3a2a', MON: '#002d72'
  };

  // [paper, ink] per era; the face is printed with tints between the two.
  const ERA_INK = {
    genesis: ['#d9c7a3', '#2b1d10'], deadball: ['#ebe0c4', '#3a2817'], golden: ['#f2e3b3', '#1d1a2e'],
    integration: ['#f6efe0', '#1c2240'], expansion: ['#fbefe0', '#2a1410'], bighair: ['#f3ecc8', '#1f2a1c'],
    steroid: ['#dfe6ea', '#0b2a3a'], efficiency: ['#eef1f6', '#0c1a30'], modern: ['#13254a', '#060b18']
  };
  // Chance of each look per era (moustache, full beard, sideburns, helmet for batters).
  const ERA_LOOK = {
    genesis: [0.8, 0.15, 0.4, 0], deadball: [0.65, 0.05, 0.3, 0], golden: [0.2, 0.02, 0.1, 0],
    integration: [0.08, 0.02, 0.1, 0], expansion: [0.15, 0.05, 0.3, 0.3], bighair: [0.6, 0.15, 0.7, 0.7],
    steroid: [0.25, 0.3, 0.3, 0.8], efficiency: [0.3, 0.45, 0.25, 0.8], modern: [0.3, 0.55, 0.25, 0.85]
  };

  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  const _mixCache = new Map();
  function mix(a, b, t) {
    const k = a + b + t, hit = _mixCache.get(k);
    if (hit) return hit;
    const v = mixRaw(a, b, t);
    _mixCache.set(k, v);
    return v;
  }
  function mixRaw(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(x) { let h = 2166136261; for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h; }

  const cache = new Map();
  // One shared canvas; each portrait is painted into a pixel buffer and copied in once.
  const _rgba = new Map();
  function rgba(col) {
    let v = _rgba.get(col);
    if (!v) {
      const n = parseInt(col.slice(1, 7), 16);
      v = [n >> 16 & 255, n >> 8 & 255, n & 255, col.length > 7 ? parseInt(col.slice(7, 9), 16) / 255 : 1];
      _rgba.set(col, v);
    }
    return v;
  }
  let _cv = null, _ctx = null, _img = null;
  // A new set of faces every time the game is opened; within a session each player keeps his face.
  const SESSION_SEED = (Math.random() * 4294967296) >>> 0;

  function portrait(player, eraKey, isPitcher) {
    const team = String(player.team || 'HIST').toUpperCase();
    const id = player.playerID || player.name || '?';
    const key = id + '|' + eraKey + '|' + team;
    if (cache.has(key)) return cache.get(key);
    if (typeof document === 'undefined') return '';

    const [paper, ink] = ERA_INK[eraKey] || ERA_INK.modern;
    const modern = eraKey === 'modern';
    const md = modern ? '#b9c6dc' : mix(paper, ink, 0.38);
    const lt = modern ? '#e3eaf6' : mix(paper, ink, 0.16);
    const dk = modern ? '#0a1224' : ink;
    let ac = TEAM_COLORS[team] || mix(paper, ink, 0.7);
    if (eraKey === 'genesis') ac = mix(paper, ink, 0.62);       // sepia photo: no team colour
    else if (eraKey === 'deadball') ac = mix(ac, '#5a3b21', 0.45); // faded lithograph
    const acDark = mix(ac, '#000000', 0.35), acLight = mix(ac, '#ffffff', 0.55);

    const W = 24, H = 18, S = 1;   // drawn at its real pixel size; the CSS scales it up (image-rendering: pixelated)
    if (!_cv) { _cv = document.createElement('canvas'); _cv.width = W * S; _cv.height = H * S; _ctx = _cv.getContext('2d'); _img = _ctx.createImageData(W, H); }
    const buf = _img.data;
    const R = rng(hash(id) ^ SESSION_SEED);
    const px = (x, y, col) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const [r, g, b, a] = rgba(col), i = (y * W + x) * 4;
      if (a >= 1) { buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; }
      else { buf[i] += (r - buf[i]) * a; buf[i + 1] += (g - buf[i + 1]) * a; buf[i + 2] += (b - buf[i + 2]) * a; }
      buf[i + 3] = 255;
    };

    // Backdrop per era, like the photos / paintings of real cards of that time (the face keeps its two inks).
    const vgrad = (top, bot) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(x, y, mix(top, bot, y / (H - 1))); };
    const GOLDEN_BG = ['#f2c230', '#5aa0d8', '#e86a4a', '#7ac46a', '#f08a3c'];
    switch (eraKey) {
      case 'genesis': vgrad('#9a8462', '#4e3c27'); break;                                   // studio backdrop
      case 'deadball': vgrad('#cfdbd2', '#eadfc2'); break;                                  // pale lithograph
      case 'golden': { const g = GOLDEN_BG[((hash(id + 'bg') ^ SESSION_SEED) >>> 0) % GOLDEN_BG.length];             // flat painted colour
        vgrad(g, mix(g, '#ffffff', 0.25));
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x - 12) ** 2) / 70 + ((y - 7) ** 2) / 40 < 1) px(x, y, mix(g, '#ffffff', 0.45)); break; }
      case 'integration': vgrad('#8fb9d6', '#e3edf0'); break;                               // painted sky
      case 'expansion': case 'bighair': {                                                   // ballpark photo: sky, stands, wall
        const sky = eraKey === 'bighair' ? '#86b7d6' : '#7fb0d8';
        vgrad(sky, mix(sky, '#ffffff', 0.35));
        for (let y = 9; y < 13; y++) for (let x = 0; x < W; x++) px(x, y, (x + y) % 2 ? '#5d6b7c' : '#6f7d8e');
        for (let x = 0; x < W; x++) px(x, 13, '#2f6b3a');
        break; }
      case 'steroid': vgrad('#0f3540', '#1d5866');                                          // action backdrop with light streaks
        for (let i = 0; i < 26; i++) px((i * 3 + Math.floor(i / 3)) % W, (i * 5) % 13, '#5fb7c4'); break;
      case 'efficiency': vgrad('#d6dee8', '#f3f6f9'); break;                               // clean studio grey
      default: vgrad('#13254a', '#1d3a6e');                                                 // modern: dark chrome
        for (let y = 0; y < 13; y++) for (let x = 0; x < W; x++) if ((x + y) % 4 === 0) px(x, y, '#5aa0ff2a');
    }

    const look = ERA_LOOK[eraKey] || ERA_LOOK.modern;
    const hw = 4 + Math.floor(R() * 2), hh = 5, cx = 12, cy = 8;
    // jersey, collar, neck
    for (let x = 2; x < 22; x++) for (let y = 15; y < H; y++) px(x, y, ac);
    for (let y = 15; y < H; y++) { px(11, y, acLight); px(12, y, acLight); }
    for (let y = 13; y < 15; y++) for (let x = 10; x < 14; x++) px(x, y, md);
    // head
    for (let y = cy - hh; y <= cy + hh; y++) for (let x = cx - hw; x <= cx + hw; x++) {
      if (((x - cx) / hw) ** 2 + ((y - cy) / hh) ** 2 <= 1) px(x, y, x > cx + hw - 2 ? lt : md);
    }
    px(cx - hw - 1, cy, md); px(cx - hw - 1, cy + 1, dk); px(cx + hw + 1, cy, md);
    // cap or batting helmet (with ear flap on the side he faces the pitcher)
    const top = cy - hh;
    const helmet = !isPitcher && R() < look[3];
    for (let y = top - (helmet ? 1 : 0); y < top + 3; y++) for (let x = cx - hw - (helmet ? 1 : 0); x <= cx + hw + (helmet ? 1 : 0); x++) px(x, y, ac);
    for (let x = cx - hw - 1; x <= cx + hw + (helmet ? 1 : 2); x++) px(x, top + 3, acDark);
    if (helmet) for (let y = top + 3; y < cy + 2; y++) { px(cx - hw - 1, y, ac); px(cx - hw, y, ac); }
    px(cx, top + 1, acLight);
    if (eraKey === 'genesis' || eraKey === 'deadball') for (let x = cx - hw + 1; x < cx + hw; x++) px(x, top - 1, ac); // tall old-style cap
    // eyes, brows, nose, mouth
    const eg = 2 + Math.floor(R() * 2), ey = cy;
    px(cx - eg, ey, dk); px(cx + eg, ey, dk);
    px(cx - eg, ey - 1, dk); px(cx + eg, ey - 1, dk);
    if (R() < 0.5) { px(cx - eg - 1, ey - 1, dk); px(cx + eg + 1, ey - 1, dk); }
    px(cx, ey + 1, mix(md, dk, 0.5)); if (R() < 0.6) px(cx, ey + 2, mix(md, dk, 0.5));
    const my = ey + 3;
    if (R() < look[0]) {
      for (let x = cx - 2; x <= cx + 2; x++) px(x, my, dk);
      if ((eraKey === 'genesis' || eraKey === 'deadball') && R() < 0.5) { px(cx - 3, my + 1, dk); px(cx + 3, my + 1, dk); }
    }
    for (let x = cx - 1; x <= cx + 1; x++) px(x, my + 1, dk);
    if (R() < look[1]) for (let y = my + 1; y <= cy + hh; y++) for (let x = cx - hw + 1; x <= cx + hw - 1; x++) {
      if (((x - cx) / hw) ** 2 + ((y - cy) / hh) ** 2 <= 1 && R() < 0.75) px(x, y, mix(md, dk, 0.75));
    }
    if (R() < look[2]) for (let y = top + 4; y < ey + 3; y++) { px(cx - hw, y, dk); px(cx + hw, y, dk); }
    if ((eraKey === 'modern' || eraKey === 'efficiency') && R() < 0.25) { px(cx - eg, ey + 1, dk); px(cx + eg, ey + 1, dk); } // eye black

    _ctx.putImageData(_img, 0, 0);
    const url = _cv.toDataURL();
    cache.set(key, url);
    return url;
  }

  // Cardboard grain, made once and shared by every card through a CSS variable.
  function initNoise() {
    if (typeof document === 'undefined') return;
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const x = c.getContext('2d'), R = rng(7);
    for (let i = 0; i < 96; i++) for (let j = 0; j < 96; j++) {
      const v = 150 + R() * 105 | 0;
      x.fillStyle = `rgb(${v},${v - 4},${v - 12})`; x.fillRect(i, j, 1, 1);
    }
    for (let k = 0; k < 40; k++) { x.fillStyle = '#7a6a5544'; x.fillRect(R() * 96, R() * 96, R() * 6, 1); }
    document.documentElement.style.setProperty('--pc2-noise', `url(${c.toDataURL()})`);
  }

  function fmtIp(v) { return v === undefined || v === null || v === '-' ? '-' : String(v); }

  // ── Card back: a bubble-gum card back (card_backs.js: bio + one line averaged from the peaks).
  // The data file (~1.3 MB) is fetched the first time any card is turned over.
  // Slow or dropped connections (phones): a failed download is retried, and a back only stays built once it has its data.
  let backsState = window.CardBacks ? 'ready' : 'idle', backsTries = 0;
  const backsWaiting = [];
  function loadBacks() {
    if (window.CardBacks || backsState === 'loading') return;
    backsState = 'loading';
    const s = document.createElement('script');
    s.src = 'card_backs.js?v=2' + (backsTries ? '&r=' + backsTries : '');
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      backsState = window.CardBacks ? 'ready' : 'idle';
      if (!window.CardBacks) {
        s.remove();
        if (++backsTries < 4) { setTimeout(loadBacks, 1500 * backsTries); return; }
        backsTries = 0;
      }
      backsWaiting.splice(0).forEach(f => { try { f(); } catch (e) { console.warn('card back', e); } });
    };
    const timer = setTimeout(finish, 45000);
    s.onload = finish; s.onerror = finish;
    document.head.appendChild(s);
  }
  function withBacks(cb) {
    if (window.CardBacks) { cb(); return; }
    backsWaiting.push(cb);
    loadBacks();
  }
  // Maker's line at the foot of the back, one per era (made-up brands, never real ones).
  const ERA_BACK = {
    genesis: ['Cabinet Card Co.', 'Photographic studio card'], deadball: ['Old Diamond Tobacco', 'Free with every pack'],
    golden: ['Big League Gum', 'One slab of gum inside'], integration: ['Painted Stars Gum', 'Collect the whole set'],
    expansion: ['Pennant Gum Co.', 'Baseball quiz inside'], bighair: ['Woodgrain Gum Co.', 'Wax pack · 15 cards'],
    steroid: ['Foil Series', 'Premium collector card'], efficiency: ['Flagship Series', 'Official licensed set'],
    modern: ['Chrome Series', 'Refractor parallel']
  };
  const f3 = v => (v == null ? '—' : Number(v).toFixed(3).replace(/^0(?=\.)/, ''));
  const nz = v => (v == null ? '—' : v);
  const ipTxt = v => { if (v == null) return '—'; const w = Math.floor(v), f = Math.round((v - w) * 3); return f >= 3 ? String(w + 1) : f ? `${w}.${f}` : String(w); };
  const htTxt = inch => inch ? `${Math.floor(inch / 12)}'${inch % 12}"` : '—';
  const yr2 = y => "'" + String(y).slice(-2);

  function backHTML(card, cs, flag) {
    const d = card.dataset, isP = d.kind === 'P';
    const pid = d.pid || '';
    const B = window.CardBacks || {};
    const row = isP ? (B.pit || {})[pid] : (B.bat || {})[pid];
    const bio = (B.bio || {})[pid.split('_')[0]];
    const era = (card.className.match(/pc2-e-(\w+)/) || [])[1] || 'modern';
    const t = (k, dflt) => (typeof window.t === 'function' ? window.t(k, { defaultValue: dflt }) : dflt);
    const no = (hash(pid || d.name) >>> 0) % 792 + 1;
    const cell = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
    let peak = '';
    if (row) {
      const span = row[0] === row[1] ? yr2(row[0]) : `${yr2(row[0])}–${yr2(row[1])}`;
      const cap = isP ? t('card.back_peak_p', 'PEAK · AVERAGE SEASON') : t('card.back_peak_b', 'PEAK · 162-GAME AVERAGE');
      const g1 = isP
        ? [['W', row[3]], ['L', row[4]], ['ERA', Number(row[5]).toFixed(2)], ['ERA+', nz(row[15])], ['G', row[6]], ['GS', row[7]], ['SV', row[8]]]
        : [['AB', row[3]], ['R', row[4]], ['H', row[5]], ['2B', row[6]], ['3B', row[7]], ['HR', row[8]], ['RBI', row[9]], ['WAR', nz(row[19])]];
      const g2 = isP
        ? [['IP', ipTxt(row[9])], ['H', row[10]], ['HR', row[11]], ['BB', row[12]], ['SO', row[13]], ['WHIP', Number(row[14]).toFixed(2)], ['WAR', nz(row[16])]]
        : [['SB', row[10]], ['BB', row[12]], ['SO', nz(row[13])], ['AVG', f3(row[14])], ['OBP', f3(row[15])], ['SLG', f3(row[16])], ['OPS+', nz(row[18])], ['FLD', row[17] == null ? '—' : (row[17] > 0 ? '+' : '') + row[17]]];
      peak = `<div class="bk-box">
          <div class="bk-cap"><span>${cap}</span><span>${span}</span></div>
          <div class="bk-grid bk-c${g1.length}">${g1.map(([k, v]) => cell(k, v)).join('')}</div>
          <div class="bk-grid bk-c${g2.length}">${g2.map(([k, v]) => cell(k, v)).join('')}</div>
        </div>`;
    }
    let career = '';
    if (cs) {
      career = isP
        ? `${cs.w ?? '-'}-${cs.l ?? '-'} · ${cs.era ?? '-'} ERA · ${fmtIp(cs.ip)} IP · ${cs.so ?? '-'} SO`
        : `${cs.g ?? '-'} G · ${cs.avg ?? '-'} · ${cs.hr ?? '-'} HR · ${cs.sb ?? '-'} SB`;
      if (cs.war !== undefined && cs.war !== '-') career += ` · ${cs.war} WAR`;
    }
    const honors = [];
    if (cs) {
      if (cs.mvp) honors.push(`${cs.mvp > 1 ? cs.mvp + '× ' : ''}MVP`);
      if (cs.cy) honors.push(`${cs.cy > 1 ? cs.cy + '× ' : ''}Cy Young`);
      if (cs.allstars) honors.push(`${cs.allstars}× All-Star`);
      if (cs.gg) honors.push(`${cs.gg}× Gold Glove`);
      if (cs.ss) honors.push(`${cs.ss}× Silver Slugger`);
      if (cs.roy) honors.push('ROY');
      if (cs.hof) honors.push('Hall of Fame');
    }
    if (d.badges) honors.push(d.badges);
    const rts = (d.rt || '').split('|').filter(Boolean).map(x => { const [k, v] = x.split(' '); return cell(k, v); }).join('');
    const brand = ERA_BACK[era] || ERA_BACK.modern;
    const bioLine = bio
      ? `<b>HT</b> ${htTxt(bio[0])} <b>WT</b> ${bio[1] || '—'}${d.hand ? ` <b>B/T</b> ${d.hand}` : ''}`
      : (d.hand ? `<b>B/T</b> ${d.hand}` : '');
    const bornLine = bio && (bio[2] || bio[3]) ? `<b>BORN</b> ${[bio[2], bio[3]].filter(Boolean).join(', ')}` : '';
    return `
      <div class="bk-top">
        <span class="bk-no">${no}</span>
        <div class="bk-id"><div class="bk-name">${d.name || ''}${flag ? ` <span class="pc2-flag">${flag}</span>` : ''}</div>
          <div class="bk-team">${d.pos || ''} · ${d.tname || ''}</div></div>
        <span class="bk-ovr" title="${d.rar || ''}">${d.ovr || ''}</span>
      </div>
      ${bioLine ? `<div class="bk-bio">${bioLine}</div>` : ''}
      ${bornLine ? `<div class="bk-bio">${bornLine}</div>` : ''}
      ${peak}
      ${career ? `<div class="bk-sec"><span>${t('card.career', 'CAREER')}</span>${career}</div>` : ''}
      ${honors.length ? `<div class="bk-sec"><span>${t('card.honors', 'HONORS')}</span>${honors.join(' · ')}</div>` : ''}
      ${rts ? `<div class="bk-rt">${rts}</div>` : ''}
      <div class="bk-foot"><span>${brand[0]}</span><span>${brand[1]}</span></div>`;
  }

  // Builds the back the first time the card turns over.
  function fillBack(card) {
    const back = card.querySelector('.pc2-back');
    if (!back || back.dataset.done) return;
    back.dataset.done = '1';
    if (!window.CardBacks) back.classList.add('bk-wait');
    const probe = { playerID: card.dataset.pid || undefined, name: card.dataset.name, year: card.dataset.year };
    let cs = null, flag = '';
    try { cs = typeof window.getPlayerCareerData === 'function' ? window.getPlayerCareerData(probe) : null; } catch (e) { cs = null; }
    try { flag = typeof window.getPlayerFlagHTML === 'function' ? window.getPlayerFlagHTML(probe) : ''; } catch (e) { flag = ''; }
    withBacks(() => {
      back.classList.remove('bk-wait');
      // still no data: keep the plain back and try again on the next turn
      if (!window.CardBacks) { delete back.dataset.done; return; }
      const keep = [...back.querySelectorAll('.pc2-flip, .pc2-tex, .pc2-wear')];
      back.innerHTML = `<div class="bk">${backHTML(card, cs, flag)}</div>`;
      keep.forEach(n => back.appendChild(n));
      back.classList.add('bk-on');
      back.querySelectorAll('img').forEach(img => { img.onerror = () => img.remove(); });
      // long names: shrink to fit the header (again once the flag image has its width)
      const nm = back.querySelector('.bk-name');
      if (nm) { fitName(nm); setTimeout(() => fitName(nm), 120); nm.querySelectorAll('img').forEach(img => img.addEventListener('load', () => fitName(nm), { once: true })); }
    });
  }

  function flip(card) {
    card.classList.toggle('pc2-flipped');
    if (card.classList.contains('pc2-flipped')) fillBack(card);
  }

  function initFlip() {
    if (typeof document === 'undefined') return;
    // Capture phase so the click never reaches the card's own handler (draft pick, Dex open...).
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('.pc2-flip');
      if (btn) {
        e.preventDefault(); e.stopPropagation();
        const card = btn.closest('.pc2');
        if (card) flip(card);
        return;
      }
      // Inside the Dex detail view and the draft offers the card itself flips on click
      // (the pick button under it still drafts).
      const card = e.target.closest && e.target.closest('.pc2');
      if (card && card.closest('.pc2-clickflip, .draft-card-flipzone')) { e.preventDefault(); e.stopPropagation(); flip(card); }
    }, true);
    // Keep the ↻ press from starting a drag on draggable rosters.
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('.pc2-flip')) e.stopPropagation();
    }, true);
  }

  // Long names: shrink each name until it fits its strip (the size classes only guess by length;
  // banners with margins / skew, like Golden or Efficiency, are narrower than the card).
  // scrollWidth rounds: a name a fraction of a pixel too wide reports as fitting but still gets the ellipsis
  function nameOverflows(el) {
    if (el.scrollWidth > el.clientWidth) return true;
    const txt = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!txt) return false;
    const r = document.createRange(); r.selectNodeContents(txt);
    const cs = getComputedStyle(el), box = el.getBoundingClientRect();
    const k = box.width / (el.offsetWidth || 1);
    const room = box.width - (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) * k;
    return r.getBoundingClientRect().width > room - 0.5 * k;
  }
  function fitName(el) {
    if (!el.isConnected || !el.clientWidth || !nameOverflows(el)) return;
    const back = el.classList.contains('bk-name');
    const min = back ? 7.5 : 6;
    let fs = parseFloat(getComputedStyle(el).fontSize) || 10;
    for (let i = 0; i < 14 && nameOverflows(el) && fs > min; i++) {
      fs -= 0.5;
      el.style.setProperty('font-size', fs + 'px', 'important');
      el.style.setProperty('letter-spacing', '0', 'important');
    }
    // the back header has room for two lines: the very longest names wrap instead of shrinking more
    if (back && el.scrollWidth > el.clientWidth) { el.style.setProperty('white-space', 'normal', 'important'); el.style.setProperty('line-height', '1.05', 'important'); }
  }
  const FIT_SEL = '.pc2 .pc2-name, .pc2 .bk-name, .pc2 .pgv-52 b, .pc2 .pgv-52 s, .pc2 .pgv-wave b, .pc2 .pgv-smoke b, .pc2 .pgv-foil, .pc2 .pgv-split b, .pc2 .pgv-sig';
  let fitTimer = null;
  function fitAll() {
    fitTimer = null;
    document.querySelectorAll(FIT_SEL).forEach(fitName);   // front strip and the back header
  }
  function initFit() {
    const queue = () => { if (!fitTimer) fitTimer = setTimeout(fitAll, 60); };
    new MutationObserver(muts => {
      if (muts.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.pc2, .pc2 *') || n.querySelector?.('.pc2'))))) queue();
    }).observe(document.body, { childList: true, subtree: true });
    // the design fonts arrive late: a name that fitted in the fallback font may not fit in the real one
    if (document.fonts) { document.fonts.ready.then(queue); document.fonts.addEventListener('loadingdone', queue); }
    document.addEventListener('transitionend', queue, true);
    document.addEventListener('animationend', queue, true);
    // cards rendered into a hidden screen measure 0 wide: refit when a screen is shown
    const wrap = () => {
      if (typeof window.showScreen !== 'function' || window.showScreen._fit) return;
      const orig = window.showScreen;
      window.showScreen = function () { const r = orig.apply(this, arguments); queue(); setTimeout(queue, 400); return r; };
      window.showScreen._fit = true;
    };
    wrap(); window.addEventListener('load', () => setTimeout(wrap, 50));
    queue();
  }

  window.CardArt = { portrait, flip, fillBack, fitName, TEAM_COLORS };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { initNoise(); initFlip(); initFit(); });
    else { initNoise(); initFlip(); initFit(); }
    // Fetched ahead of the first flip, once the game has finished loading.
    const preload = () => setTimeout(loadBacks, 1500);
    if (document.readyState === 'complete') preload(); else window.addEventListener('load', preload);
  }
})();
