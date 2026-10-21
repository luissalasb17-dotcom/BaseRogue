// Card art for the 2.0 trading card (createCardHTML in ui.js builds the markup).
// - Pixel portrait generated from the player id: always the same face for the same
//   player, printed in two inks (team colour + the paper / ink of the card's era).
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
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(x) { let h = 2166136261; for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h; }

  const cache = new Map();

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

    const W = 24, H = 18, S = 6;
    const cv = document.createElement('canvas');
    cv.width = W * S; cv.height = H * S;
    const c = cv.getContext('2d');
    const R = rng(hash(id));
    const px = (x, y, col) => { c.fillStyle = col; c.fillRect(x * S, y * S, S, S); };

    // Backdrop per era, like the photos / paintings of real cards of that time (the face keeps its two inks).
    const vgrad = (top, bot) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(x, y, mix(top, bot, y / (H - 1))); };
    const GOLDEN_BG = ['#f2c230', '#5aa0d8', '#e86a4a', '#7ac46a', '#f08a3c'];
    switch (eraKey) {
      case 'genesis': vgrad('#9a8462', '#4e3c27'); break;                                   // studio backdrop
      case 'deadball': vgrad('#cfdbd2', '#eadfc2'); break;                                  // pale lithograph
      case 'golden': { const g = GOLDEN_BG[(hash(id + 'bg') >>> 0) % GOLDEN_BG.length];             // flat painted colour
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

    const url = cv.toDataURL();
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

  // Fills the lazy part of the back (career line, honours, flag) the first time the card turns.
  function fillBack(card) {
    const slot = card.querySelector('.pc2-back-lazy');
    if (!slot || slot.dataset.done) return;
    slot.dataset.done = '1';
    const pid = card.dataset.pid, name = card.dataset.name, isP = card.dataset.kind === 'P';
    const probe = { playerID: pid || undefined, name, year: card.dataset.year };
    let cs = null;
    try { cs = typeof window.getPlayerCareerData === 'function' ? window.getPlayerCareerData(probe) : null; } catch (e) { cs = null; }
    const t = (k, d) => (typeof window.t === 'function' ? window.t(k, { defaultValue: d }) : d);
    let line = '';
    if (cs) {
      line = isP
        ? `${cs.w ?? '-'}-${cs.l ?? '-'} · ERA ${cs.era ?? '-'} · ${fmtIp(cs.ip)} IP · ${cs.so ?? '-'} K`
        : `${cs.g ?? '-'} G · ${cs.avg ?? '-'} · ${cs.hr ?? '-'} HR · ${cs.sb ?? '-'} SB`;
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
    if (card.dataset.badges) honors.push(card.dataset.badges);
    let flag = '';
    try { flag = typeof window.getPlayerFlagHTML === 'function' ? window.getPlayerFlagHTML(probe) : ''; } catch (e) { flag = ''; }
    slot.innerHTML = `
      ${line ? `<div class="pc2-lab">${t('card.career', 'CAREER')}${cs && cs.war !== '-' ? ` · WAR ${cs.war}` : ''}</div><div class="pc2-line">${line}</div>` : ''}
      ${honors.length ? `<div class="pc2-lab">${t('card.honors', 'HONORS')}</div><div class="pc2-line">${honors.join(' · ')}</div>` : ''}
`;
    const bh = card.querySelector('.pc2-bh span');
    if (flag && bh && !bh.querySelector('img')) bh.insertAdjacentHTML('beforeend', ` <span class="pc2-flag">${flag}</span>`);
    card.querySelectorAll('.pc2-back img').forEach(img => { img.onerror = () => img.remove(); });
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
      // Inside the Dex detail view the card itself flips on click.
      const card = e.target.closest && e.target.closest('.pc2');
      if (card && card.closest('.pc2-clickflip')) { e.preventDefault(); e.stopPropagation(); flip(card); }
    }, true);
    // Keep the ↻ press from starting a drag on draggable rosters.
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('.pc2-flip')) e.stopPropagation();
    }, true);
  }

  // Long names: shrink each name until it fits its strip (the size classes only guess by length;
  // banners with margins / skew, like Golden or Efficiency, are narrower than the card).
  function fitName(el) {
    if (!el.isConnected || !el.clientWidth || el.scrollWidth <= el.clientWidth) return;
    let fs = parseFloat(getComputedStyle(el).fontSize) || 10;
    for (let i = 0; i < 14 && el.scrollWidth > el.clientWidth && fs > 6; i++) {
      fs -= 0.5;
      el.style.setProperty('font-size', fs + 'px', 'important');
      el.style.setProperty('letter-spacing', '0', 'important');
    }
  }
  let fitTimer = null;
  function fitAll() {
    fitTimer = null;
    document.querySelectorAll('.pc2 .pc2-name').forEach(fitName);
  }
  function initFit() {
    const queue = () => { if (!fitTimer) fitTimer = setTimeout(fitAll, 60); };
    new MutationObserver(muts => {
      if (muts.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.pc2, .pc2 *') || n.querySelector?.('.pc2'))))) queue();
    }).observe(document.body, { childList: true, subtree: true });
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
  }
})();
