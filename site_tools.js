// Random All-Time Player and Random Team pages (baserogue.com). Uses site_cards.js (every card in the
// game, compact) and site.js (window.SiteCard renders the real BaseRogue card, flip and tilt included).
(function () {
  'use strict';
  const ALL = window.SITE_CARDS || [];
  const RAR = { L: 'Legendary', X: 'Elite', E: 'Epic', R: 'Rare', U: 'Uncommon', C: 'Common' };
  const RCOL = { L: '#ffd36a', X: '#fb3b5c', E: '#c084fc', R: '#38bdf8', U: '#4ade80', C: '#cbd5e1' };
  // Pull odds: a Hobby pack of the game (Common 0 / Uncommon 8 / Rare 35 / Epic 40 / Elite 14 / Legendary 3)
  // feels too generous on a website; this is the Mystery pack: 35 / 30 / 20 / 9 / 4.5 / 1.5.
  const ODDS = [['C', 35], ['U', 30], ['R', 20], ['E', 9], ['X', 4.5], ['L', 1.5]];
  const ERAS = [['', 'Any era'], ['genesis', 'Genesis 1871-1900'], ['deadball', 'Deadball 1901-1919'], ['golden', 'Golden 1920-1941'], ['integration', 'Integration 1942-1960'],
    ['expansion', 'Expansion 1961-1976'], ['bighair', 'Turf 1977-1993'], ['steroid', 'Steroid 1994-2005'], ['efficiency', 'Moneyball 2006-2015'], ['modern', 'Statcast 2016-today']];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rollRarity = () => { let x = Math.random() * 100; for (const [r, w] of ODDS) { if ((x -= w) < 0) return r; } return 'C'; };
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ── Random player: the Hobby Box packs of the game (same art, same odds, same 2D rip) ──
  const PACKS = [
    ['Wax', 'WAX PACK', 'common', [60, 32, 7, 1, 0, 0]], ['Retail', 'RETAIL PACK', 'retail', [15, 45, 33, 6, 1, 0]],
    ['Hobby', 'HOBBY PACK', 'hobby', [0, 8, 35, 40, 14, 3]], ['Premium', 'PREMIUM PACK', 'premium', [0, 0, 6, 24, 42, 28]],
    ['any', 'MYSTERY PACK', 'random', [35, 30, 20, 9, 4.5, 1.5]]];
  const ORDER = ['C', 'U', 'R', 'E', 'X', 'L'];
  function initPlayer() {
    const stage = $('rp-stage'); if (!stage) return;
    let era = '', pack = PACKS[4], busy = false, sealed = true;
    const history = [];
    const eraSel = $('rp-era');
    eraSel.innerHTML = ERAS.map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
    eraSel.onchange = () => { era = eraSel.value; };
    const art = p => (window.DraftPack3D && window.DraftPack3D.art ? window.DraftPack3D.art(p[2], { tagline: p[1], badge: 'ALL-TIME', fine: '' }) : '');
    const oddsTxt = p => p[3].map((w, i) => w ? `${RAR[ORDER[i]]} ${w}%` : '').filter(Boolean).join(' · ');
    const packs = $('rp-packs');
    packs.innerHTML = PACKS.map((p, i) => `<button class="rp-pk ${p === pack ? 'on' : ''}" data-rp-pk="${i}"><img src="${art(p)}" alt="${p[1]}"><span>${p[1].replace(' PACK', '')}</span></button>`).join('');
    packs.onclick = e => {
      const b = e.target.closest('[data-rp-pk]'); if (!b || busy) return;
      pack = PACKS[+b.dataset.rpPk]; packs.querySelectorAll('.rp-pk').forEach(x => x.classList.toggle('on', x === b)); sealedPack();
    };
    const roll = () => { let x = Math.random() * 100; for (let i = 0; i < 6; i++) { if ((x -= pack[3][i]) < 0) return ORDER[i]; } return 'C'; };
    const draw = () => {
      const pool = ALL.filter(c => !era || c.e === era);
      const r = roll(); const sub = pool.filter(c => c.r === r);
      return pick(sub.length ? sub : pool);
    };
    const sealedPack = () => {
      sealed = true;
      const src = art(pack);
      stage.innerHTML = `<div class="rp-p2 t-${pack[0]}">${src ? `<img class="rp-p2-body" src="${src}" alt="${pack[1]}"><img class="rp-p2-strip" src="${src}" alt="">` : ''}</div>`;
      $('rp-odds').textContent = 'Odds per card: ' + oddsTxt(pack);
      $('rp-open').textContent = 'Open the ' + pack[1].toLowerCase();
    };
    const show = c => {
      sealed = false;
      stage.innerHTML = `<div class="rp-reveal" style="--rc:${RCOL[c.r]}"><div class="rp-rays"></div><div class="rp-card pc2-clickflip rp-big">${window.SiteCard(c)}</div>
        <div class="rp-tag" style="color:${RCOL[c.r]}">${RAR[c.r]}${c.r === 'L' || c.r === 'X' ? '!' : ''}</div></div>`;
      history.unshift(c); if (history.length > 12) history.pop();
      $('rp-history').innerHTML = history.map((h, i) => `<button class="rp-mini" data-rp-h="${i}" style="--rc:${RCOL[h.r]}"><b>${Math.floor(h.o)}</b><span>${esc(h.n)}</span><i>${esc(h.p)} · ${h.y}</i></button>`).join('');
      $('rp-history-wrap').hidden = history.length < 2;
      $('rp-share').hidden = false;
      $('rp-share').dataset.text = `I pulled ${c.n} (${c.y}, ${RAR[c.r]}, ${Math.floor(c.o)} OVR) from a ${pack[1].toLowerCase()} on BaseRogue. Pull your own all-time player:`;
      $('rp-open').textContent = 'Open another ' + pack[1].toLowerCase();
    };
    $('rp-history').onclick = e => { const b = e.target.closest('[data-rp-h]'); if (b) { const c = history[+b.dataset.rpH]; history.splice(+b.dataset.rpH, 1); show(c); } };
    const snd = (k, t) => { try { window.DraftPack3D && window.DraftPack3D.sound && window.DraftPack3D.sound(k, t); } catch (e) {} };
    const open = () => {
      if (busy) return; busy = true;
      if (!sealed) sealedPack();
      const c = draw();
      const p2 = stage.querySelector('.rp-p2');
      const big = c.r === 'L' || c.r === 'X' ? 2 : c.r === 'E' ? 1 : 0;
      const shake = 420 + big * 380;
      p2.style.setProperty('--rc', RCOL[c.r]);
      p2.classList.add('tearing'); if (big) p2.classList.add('glow');
      snd('crinkle', big);
      setTimeout(() => { p2.classList.add('ripped'); snd('rip', big); }, shake);
      setTimeout(() => { show(c); busy = false; }, shake + 700);
    };
    $('rp-open').onclick = open;
    stage.onclick = e => { if (!busy && sealed && e.target.closest('.rp-p2')) open(); };
    $('rp-share').onclick = async () => {
      const text = $('rp-share').dataset.text, url = 'https://baserogue.com/random-player.html';
      try { if (navigator.share) { await navigator.share({ text, url }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(text + ' ' + url); $('rp-share').textContent = 'Copied!'; setTimeout(() => { $('rp-share').textContent = 'Share'; }, 1600); } catch (e) {}
    };
    sealedPack();
  }

  // ── Random team ──
  const SPOTS = { CF: [50, 15], LF: [15, 26], RF: [85, 26], SS: [32, 45], '2B': [68, 45], '3B': [17, 60], '1B': [83, 60], C: [50, 86], DH: [87, 87], SP: [50, 57] };
  const LINE = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  function initTeam() {
    const field = $('rt-field'); if (!field) return;
    let era = '', level = 'any';
    const team = {}, locks = new Set();
    $('rt-era').innerHTML = ERAS.map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
    $('rt-era').onchange = e => { era = e.target.value; };
    document.querySelectorAll('[data-rt-level]').forEach(b => b.onclick = () => {
      level = b.dataset.rtLevel; document.querySelectorAll('[data-rt-level]').forEach(x => x.classList.toggle('on', x === b));
    });
    const ok = c => (!era || c.e === era) && (level === 'any' || (level === 'stars' ? c.o >= 80 : c.r === 'L' || c.r === 'X'));
    const roll = () => {
      const used = new Set(Object.entries(team).filter(([k]) => locks.has(k)).map(([, c]) => c.id.split('_')[0]));
      const take = (key, list) => {
        if (locks.has(key) && team[key]) return;
        const free = list.filter(c => !used.has(c.id.split('_')[0]));
        const c = free.length ? pick(free) : null;
        if (c) { team[key] = c; used.add(c.id.split('_')[0]); }
      };
      LINE.forEach(pos => take(pos, ALL.filter(c => c.k !== 'P' && ok(c) && (pos === 'DH' ? true : c.p === pos))));
      for (let i = 1; i <= 5; i++) take('SP' + i, ALL.filter(c => c.k === 'P' && c.p === 'SP' && ok(c)));
      take('CL', ALL.filter(c => c.k === 'P' && c.p === 'RP' && ok(c)));
      draw();
    };
    const slot = (key, label) => {
      const c = team[key];
      return `<div class="rt-slot" data-rt-key="${key}"><span class="rt-lab">${label}</span>${c ? `<div class="rp-card pc2-clickflip">${window.SiteCard(c)}</div>` : '<div class="rt-empty">—</div>'}
        <button class="rt-lock ${locks.has(key) ? 'on' : ''}" data-rt-lock="${key}" title="Keep this player when you roll again">${locks.has(key) ? '🔒' : '🔓'}</button></div>`;
    };
    const draw = () => {
      field.innerHTML = `<svg class="rt-grass" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 98 L4 52 Q50 -6 96 52 Z" fill="#1d5a2f"/><path d="M50 92 L28 70 L50 48 L72 70 Z" fill="#a0703f" opacity=".55"/></svg>`
        + LINE.map(pos => `<div class="rt-spot" style="left:${SPOTS[pos][0]}%;top:${SPOTS[pos][1]}%">${slot(pos, pos)}</div>`).join('')
        + `<div class="rt-spot" style="left:${SPOTS.SP[0]}%;top:${SPOTS.SP[1]}%">${slot('SP1', 'SP1')}</div>`;
      $('rt-staff').innerHTML = ['SP2', 'SP3', 'SP4', 'SP5', 'CL'].map(k => slot(k, k)).join('');
      const all = Object.values(team);
      const ovr = all.length ? (all.reduce((t, c) => t + c.o, 0) / all.length).toFixed(1) : '—';
      $('rt-ovr').textContent = ovr;
      $('rt-count').textContent = `${all.filter(c => c.r === 'L').length} Legendary · ${all.filter(c => c.r === 'X').length} Elite · ${all.filter(c => c.r === 'E').length} Epic`;
      const verdict = ovr === '—' ? '' : ovr >= 90 ? 'A dynasty. Could this team go 162-0?' : ovr >= 82 ? 'A pennant favorite.' : ovr >= 74 ? 'A playoff contender.' : ovr >= 66 ? 'A .500 club with a few stars.' : 'A rebuilding year. Roll again!';
      $('rt-verdict').textContent = verdict;
    };
    document.addEventListener('click', e => {
      const l = e.target.closest('[data-rt-lock]');
      if (l) { e.preventDefault(); e.stopPropagation(); const k = l.dataset.rtLock; locks.has(k) ? locks.delete(k) : locks.add(k); draw(); }
    }, true);
    $('rt-roll').onclick = roll;
    roll();

  }

  const start = () => { initPlayer(); initTeam(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
