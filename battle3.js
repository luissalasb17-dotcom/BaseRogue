// Battle 2.0 stage: rebuilds the layout of the real combat screen like the prototype (?proto=battle2).
// Presentation only. It never creates or removes the elements ui.js updates: it moves them into a new
// arrangement (ids, listeners and the .match-arena / .rpg-fight-deck hooks stay), and adds two read-only
// views of the live battle: runner tokens on the diamond and the lineup fan. Styles in battle3.css.
(function () {
  'use strict';
  // scope: the page, or the Dex's batting-practice overlay while it is open (same ids, same stage)
  let scope = document, testGet = null;
  const $ = id => scope.querySelector('#' + id);
  const ERAS = [['Genesis', 'genesis'], ['Deadball', 'deadball'], ['Golden', 'golden'], ['Integration', 'integration'], ['Expansion', 'expansion'], ['Turf', 'bighair'], ['Steroid', 'steroid'], ['Efficiency', 'efficiency']];
  const eraKey = p => { const e = String(p.era || p._era || ''); const f = ERAS.find(x => e.includes(x[0])); return f ? f[1] : 'modern'; };
  const portrait = p => (window.CardArt && p ? window.CardArt.portrait(p, eraKey(p), false) : '');
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const t = (k, d) => (typeof window.t === 'function' ? window.t(k, d) : d);

  // Diamond geometry (percent of the diamond box): 1B, 2B, 3B and home
  const BASE_XY = [[84, 50], [50, 16], [16, 50]], HOME_XY = [50, 84];

  // THIS AT-BAT: the user disliked it as a big separate panel, liked the content; it now lives inside
  // the batter's plaque as a compact strip.
  const SHOW_ODDS = true;

  function build() {
    const m = $('screen-match');
    const arena = m && m.querySelector('.match-arena');
    if (!arena || m._bx3built) return;
    const left = arena.children[0], right = arena.children[1];
    const deck = m.querySelector('.rpg-fight-deck');
    const board = m.querySelector('.scoreboard');
    const bases = $('bases-display-row');
    const bSlot = $('arena-batter-card-slot'), pSlot = $('arena-pitcher-card-slot');
    const bInfo = $('match-batter-name') && $('match-batter-name').parentElement;
    const pInfo = $('match-pitcher-name') && $('match-pitcher-name').parentElement;
    const pen = $('match-pitchers-rotation-queue');
    const face = m.querySelector('.faceoff-panel');
    const log = m.querySelector('.match-log');
    if (!left || !right || !deck || !board || !bases || !bSlot || !pSlot || !bInfo || !pInfo || !log) return;
    m._bx3built = true;
    arena.classList.add('bx3');

    // Left column: the hanging scoreboard, the printed diamond with runner tokens, the scorer's log
    left.classList.add('bx3-left');
    const dia = document.createElement('div');
    dia.className = 'bx3-dia';
    dia.innerHTML = `<div class="bx3-dia-field"></div><div class="bx3-runners"></div><div class="bx3-dia-tag" data-bx3-mult>BASES EMPTY</div>`;
    dia.querySelector('.bx3-dia-field').appendChild(bases);
    board.after(dia);
    left.appendChild(log);

    // Middle: the pitcher on the mound (far, smaller) facing your batter at the plate (near)
    deck.classList.add('bx3-deck');
    arena.insertBefore(deck, right);
    const mound = document.createElement('div');
    mound.className = 'bx3-mound';
    mound.innerHTML = `<div class="bx3-tag">${t('match.bx3_mound', 'ON THE MOUND')}</div>`;
    const moundRow = document.createElement('div');
    moundRow.className = 'bx3-row';
    moundRow.append(pSlot, pInfo);
    mound.appendChild(moundRow);
    if (pen) { pen.classList.add('bx3-pen'); mound.appendChild(pen); }
    const plate = document.createElement('div');
    plate.className = 'bx3-plate';
    plate.innerHTML = `<div class="bx3-tag gold">${t('match.bx3_atbat', 'AT BAT')}</div>`;
    const plateRow = document.createElement('div');
    plateRow.className = 'bx3-row';
    // Right of the batter: his info, then this at-bat's odds and who is on deck (filled in tick)
    const pcol = document.createElement('div');
    pcol.className = 'bx3-pcol';
    const odds = document.createElement('div');
    odds.className = 'bx3-odds';
    odds.id = 'bx3-odds';
    pcol.append(bInfo);
    if (SHOW_ODDS) bInfo.appendChild(odds);
    plateRow.append(bSlot, pcol);
    plate.appendChild(plateRow);
    deck.prepend(mound);
    deck.appendChild(plate);
    if (face) face.classList.add('bx3-empty');

    // Right: the dice tray (ui.js injects #dice-battle-panel into #dice-container-slot)
    right.classList.add('bx3-right');

    // Bottom: your nine as a fanned hand
    const hand = document.createElement('div');
    hand.className = 'bx3-hand';
    hand.id = 'bx3-hand';
    arena.appendChild(hand);
  }

  // ── Live views (read-only) ──
  let sig = '';
  function tick() {
    if (scope !== document && !scope.isConnected) { scope = document; testGet = null; sig = ''; }
    const m = $('screen-match');
    if (!m || m.classList.contains('hidden')) return;
    build();
    const b = testGet ? testGet() : (typeof window.__activeBattle === 'function' ? window.__activeBattle() : null);
    if (!b || !b.awayTeam) return;
    const lineup = b.awayTeam.lineup || [];
    const idx = b.awayLineupIndex || 0;
    const onBase = b.bases || [null, null, null];
    const s = idx + '|' + onBase.map(p => p ? (p.playerID || p.name) : '-').join(',') + '|' + lineup.length;
    const bd = typeof b.currentBoundaries === 'function' ? b.currentBoundaries() : null;
    const s2 = s + '|' + (bd ? [bd.bbEnd, bd.soEnd, bd.outEnd, bd.singleEnd, bd.doubleEnd, bd.tripleEnd].join(',') : '');
    if (s2 === sig) return;
    sig = s2;
    if (SHOW_ODDS) paintOdds(bd, lineup, idx);
    trimZones();
    watchProcs();
    watchSteals();
    paintHand(lineup, idx, onBase);
    paintRunners(onBase);
  }

  function paintHand(lineup, idx, onBase) {
    const hand = $('bx3-hand');
    if (!hand) return;
    const n = lineup.length;
    if (hand.childElementCount !== n) {
      hand.innerHTML = lineup.map((p, i) => `
        <div class="bx3-h" data-i="${i}" title="${esc(p.name)}">
          <div class="bx3-h-ph" style="background-image:url(${portrait(p)})"><span class="bx3-h-ord">${i + 1}</span><span class="bx3-h-pos">${esc(p.pos || p.position || '')}</span></div>
          <div class="bx3-h-nm">${esc(String(p.name || '').split(' ').slice(-1)[0])}</div>
        </div>`).join('');
    }
    hand.querySelectorAll('.bx3-h').forEach((h, i) => {
      const off = i - (n - 1) / 2;
      h.style.setProperty('--rot', (off * 3) + 'deg');
      h.style.setProperty('--dy', (Math.abs(off) * 4) + 'px');
      h.classList.toggle('cur', i === idx % n);
      h.classList.toggle('next', i === (idx + 1) % n);
      h.classList.toggle('on', onBase.includes(lineup[i]));
    });
  }

  function paintOdds(bd, lineup, idx) {
    const box = $('bx3-odds');
    if (!box) return;
    const n = lineup.length || 1;
    const nx = k => lineup[(idx + k) % n];
    const last = p => esc(String((p && p.name) || '').split(' ').slice(-1)[0]);
    let cells = '';
    if (bd) {
      const pct = (a, z) => Math.max(0, z - a);
      const cell = (v, l, c) => `<span class="bx3-od ${c}"><b>${v}%</b>${l}</span>`;
      cells = cell(bd.bbEnd + pct(bd.outEnd, 100), 'ON BASE', 'g') + cell(pct(bd.outEnd, 100), 'HIT', 'g2')
        + cell(pct(bd.tripleEnd, 100), 'HR', 'o') + cell(pct(bd.bbEnd, bd.soEnd), 'K', 'r');
    }
    box.innerHTML = `<div class="bx3-odds-k">${t('match.bx3_odds', 'THIS AT-BAT')}</div><div class="bx3-odrow">${cells}</div>
      <div class="bx3-ondeck"><span>ON DECK</span><i style="background-image:url(${portrait(nx(1))})"></i><b>${last(nx(1))}</b><span>· THEN</span><b>${last(nx(2))}</b></div>`;
  }

  function paintRunners(onBase) {
    const layer = scope.querySelector('.bx3-runners');
    if (!layer) return;
    const toks = [...layer.querySelectorAll('.bx3-runner')];
    toks.forEach(tok => {
      if (!onBase.includes(tok._p)) {      // scored or out: slide home and fade
        tok.style.left = HOME_XY[0] + '%'; tok.style.top = HOME_XY[1] + '%';
        tok.classList.add('gone');
        setTimeout(() => tok.remove(), 650);
      }
    });
    onBase.forEach((p, i) => {
      if (!p) return;
      let tok = toks.find(x => x._p === p && !x.classList.contains('gone'));
      if (!tok) {
        tok = document.createElement('div');
        tok.className = 'bx3-runner';
        tok._p = p;
        tok.title = p.name || '';
        tok.style.backgroundImage = `url(${portrait(p)})`;
        tok.style.left = HOME_XY[0] + '%'; tok.style.top = HOME_XY[1] + '%';
        layer.appendChild(tok);
        void tok.offsetWidth;
      }
      tok.style.left = BASE_XY[i][0] + '%'; tok.style.top = BASE_XY[i][1] + '%';
    });
    const on = onBase.filter(Boolean).length;
    const tag = scope.querySelector('[data-bx3-mult]');
    if (tag) {
      tag.textContent = on ? (testGet ? `${on} ON BASE` : `${on} ON · FOCUS HIT +${on * 50}%`) : "BASES EMPTY";
      tag.classList.toggle('hot', on > 0);
    }
  }

  function trimZones() {
    const z = $('zones-lines');
    if (!z || z._bx3) return;
    z._bx3 = true;
    const run = () => z.querySelectorAll('.outcome-row-left').forEach(e => {
      const tn = [...e.childNodes].find(x => x.nodeType === 3 && /\(/.test(x.nodeValue));
      if (tn) tn.nodeValue = tn.nodeValue.replace(/\s*\([^)]*\)/g, '');
    });
    new MutationObserver(run).observe(z, { childList: true, subtree: true });
    run();
  }

  // Era synergy procs: when a play's log line names an era synergy, its card in the right panel
  // glows and a banner flashes on the felt. Names are the same in both languages.
  const PROC_KEYS = ['Small Ball', 'Liveball', 'Five-Tool', 'AstroTurf', 'Bash Brothers', 'Moneyball', 'Three True', 'Speed & Hustle', 'Genesis'];
  function watchProcs() {
    const logEl = $('match-play-log-lines');
    if (!logEl || logEl._bx3) return;
    logEl._bx3 = true;
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
      const txt = n.textContent || '';
      PROC_KEYS.filter(k => txt.includes(k)).forEach(proc);
    }))).observe(logEl, { childList: true });
  }
  function proc(key) {
    const card = [...document.querySelectorAll('#synergies-list-container .pokelike-syn-card')]
      .find(c => (c.querySelector('.syn-title-text') || c).textContent.includes(key));
    let label = key, color = '#ffd36a';
    if (card) {
      label = (card.querySelector('.syn-title-text') || card).textContent.replace(/\s*\(.*$/, '').trim();
      const tag = card.querySelector('.syn-tag-badge');
      if (tag) color = getComputedStyle(tag).color || color;
      card.classList.remove('bx3-proc'); void card.offsetWidth; card.classList.add('bx3-proc');
      card.style.setProperty('--proc', color);
      clearTimeout(card._bx3t); card._bx3t = setTimeout(() => card.classList.remove('bx3-proc'), 1800);
    }
    const deck = scope.querySelector('.bx3-deck');
    if (!deck) return;
    const b = document.createElement('div');
    b.className = 'bx3-procban';
    b.style.setProperty('--proc', color);
    b.textContent = '⚡ ' + label.toUpperCase();
    const prev = deck.querySelectorAll('.bx3-procban').length;
    b.style.top = (46 + prev * 9) + '%';
    deck.appendChild(b);
    setTimeout(() => b.remove(), 2000);
  }

  // A steal popup: the runner token that just stole pulses on its base
  function watchSteals() {
    const deck = scope.querySelector('.bx3-deck');
    if (!deck || deck._bx3s) return;
    deck._bx3s = true;
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
      // Phones: the end-of-game card lives in the felt, which scrolls and is transformed; lift it to <body>
      if (n.classList && n.classList.contains('battle-over-modal') && window.innerWidth <= 768) { document.body.appendChild(n); return; }
      if (!n.dataset || n.dataset.outcome !== 'STEAL') return;
      const third = /third|tercera|3B/i.test(n.textContent);
      const toks = [...scope.querySelectorAll('.bx3-runner:not(.gone)')];
      const target = toks.find(tk => Math.abs(parseFloat(tk.style.left) - (third ? BASE_XY[2][0] : BASE_XY[1][0])) < 1 && Math.abs(parseFloat(tk.style.top) - (third ? BASE_XY[2][1] : BASE_XY[1][1])) < 1);
      if (target) { target.classList.remove('stole'); void target.offsetWidth; target.classList.add('stole'); }
    }))).observe(deck, { childList: true });
  }

  // Defensive trial: show the fielder's real card under the field (two-column layout in battle3.css)
  function watchDefense() {
    const modal = $('modal-mid-inning-defense');
    if (!modal || modal._bx3) return;
    modal._bx3 = true;
    const paint = () => {
      if (modal.classList.contains('hidden')) return;
      // ready the 3D dice in the tray before the roll (hides the 2D cubes)
      setTimeout(() => { const tray = $('def-dice-d100-panel'); if (window.DiceTable && tray) window.DiceTable.active(tray); }, 80);
      const b = typeof window.__activeBattle === 'function' ? window.__activeBattle() : null;
      const ev = b && b.pendingDefenseEvent;
      const radar = $('def-field-radar-card');
      if (!ev || !ev.player || !radar || typeof window.createCardHTML !== 'function') return;
      let slot = modal.querySelector('.def3-card');
      if (!slot) { slot = document.createElement('div'); slot.className = 'def3-card'; radar.after(slot); }
      const key = ev.player.playerID || ev.player.name;
      if (slot.dataset.k === key) return;
      slot.dataset.k = key;
      slot.innerHTML = `<div class="def3-card-tag">${esc(ev.pos || '')} · ${t('match.def3_fielder', 'YOUR FIELDER')}</div>${window.createCardHTML(ev.player)}`;
    };
    new MutationObserver(paint).observe(modal, { attributes: true, attributeFilter: ['class'] });
    paint();
  }

  // Batting practice (basedex.js): same stage, its own state
  window.Battle3Test = { start(overlay, get) {
    scope = overlay; testGet = get; sig = ''; build(); tick();
    const bar = $('dice-action-bar');   // phones: pinned to the overlay, the panel around it traps position: fixed
    if (bar && window.innerWidth <= 768) overlay.appendChild(bar);
  } };

  function init() {
    build();
    watchDefense();
    setInterval(tick, 250);
  }
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
