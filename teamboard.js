/* TeamBoard: the "field board" used by the Dex Team Preview and the All-Star Dream Team builder.
   Each starter stands where he plays on a diamond (same look as Meet the Team), the ace on the
   mound, and the bench / rotation / bullpen sit below as rows of cards.
   Team Preview builds only from the shortlist, keeps several named previews in localStorage and
   can send one to the All-Star Dream Team builder (only the cards unlocked for the Challenge pass). */
(function () {
  'use strict';
  const SLOTS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  const FIELD_SPOT = { CF: [50, 13.5], LF: [15, 22.5], RF: [85, 22.5], SS: [36, 32], '2B': [64, 32],
    '3B': [21, 54], '1B': [79, 54], P: [50, 55.5], C: [50, 86.5], DH: [8, 86.5] };
  const BENCH = 5, SP_N = 5, RP_N = 7;
  const STORE = 'baserogue_dex_previews_v1';
  const FIELD_SVG = `<svg class="tb-diamond" viewBox="0 0 1500 1040" preserveAspectRatio="none" aria-hidden="true">
    <path class="g-out" d="M750 770 L105 125 A912 912 0 0 1 1395 125 Z"/><path class="g-track" d="M105 125 A912 912 0 0 1 1395 125"/>
    <path class="g-dirt" d="M750 770 L446 466 A430 430 0 0 1 1054 466 Z"/><path class="g-in" d="M750 715 L925 540 L750 365 L575 540 Z"/>
    <path class="g-line" d="M750 770 L105 125 M750 770 L1395 125"/><path class="g-path" d="M750 770 L980 540 L750 310 L520 540 Z"/>
    <circle class="g-mound" cx="750" cy="560" r="38"/>
    <rect class="g-base" x="968" y="528" width="24" height="24" transform="rotate(45 980 540)"/>
    <rect class="g-base" x="738" y="298" width="24" height="24" transform="rotate(45 750 310)"/>
    <rect class="g-base" x="508" y="528" width="24" height="24" transform="rotate(45 520 540)"/>
    <path class="g-base" d="M736 762 L764 762 L764 774 L750 786 L736 774 Z"/><rect class="g-dug" x="18" y="900" width="200" height="110" rx="10"/></svg>`;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isPit = p => !!p && (p.h9 !== undefined || p.role === 'SP' || p.role === 'RP');
  // Rotation: starters, or relievers with at least one real start (user, Nov 2026)
  const canStart = p => isPit(p) && (String(p.role || 'SP').toUpperCase() !== 'RP' || (p.career_gs || 0) >= 1);
  window.canStartCard = canStart;
  const keyOf = p => (p && (p.playerID || `${p.name}_${p.year}`)) || '';
  const secOf = p => String((p && p.sec_pos) || '').split(',').map(s => s.trim()).filter(Boolean);
  const fits = (p, slot) => {
    if (!p || isPit(p)) return false;
    if (typeof window.leftyCantPlay === 'function' && window.leftyCantPlay(p, slot)) return false;
    return slot === 'DH' || p.pos === slot || secOf(p).includes(slot);
  };
  const card = (p, label) => (window.createCardHTML ? window.createCardHTML(p, label) : `<div class="player-card">${esc(p.name)}</div>`);
  const ovr = p => Number(p && p.ovr) || 0;

  // Shared markup: a field with the nine slots (and the ace on the mound) given as HTML per slot.
  function fieldHTML(slotHTML, moundHTML, extraClass) {
    const cells = SLOTS.map(s => {
      const [x, y] = FIELD_SPOT[s];
      return `<div class="tb-pos tb-at-${s}" style="--x:${x}%;--y:${y}%;">${slotHTML[s] || ''}</div>`;
    }).join('');
    const mound = moundHTML ? `<div class="tb-pos tb-at-P" style="--x:${FIELD_SPOT.P[0]}%;--y:${FIELD_SPOT.P[1]}%;">${moundHTML}</div>` : '';
    return `<div class="tb-field ${extraClass || ''}">${FIELD_SVG}${cells}${mound}</div>`;
  }

  // ---------- Team Preview (Dex) ----------
  const TP = {
    previews: [], cur: 0, active: null, msg: '',
    load() {
      try { const d = JSON.parse(localStorage.getItem(STORE) || 'null'); if (d && Array.isArray(d.list) && d.list.length) { this.previews = d.list; this.cur = Math.min(d.cur || 0, d.list.length - 1); return; } } catch (e) { /* storage blocked */ }
      this.previews = [this.blank('My Dream Team')]; this.cur = 0;
    },
    save() { try { localStorage.setItem(STORE, JSON.stringify({ list: this.previews, cur: this.cur })); } catch (e) { /* storage blocked */ } },
    blank(name) { return { name, lineup: {}, bench: [], SP: [], RP: [] }; },
    get pv() { return this.previews[this.cur]; },
    pools() {
      const dex = window.BaseballDex;
      const bats = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
      const pits = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || window.PITCHERS_POOL || [];
      const seen = new Set();
      const pick = arr => arr.filter(p => { if (!dex || !dex.isShortlisted(p)) return false; const k = keyOf(p); if (seen.has(k)) return false; seen.add(k); return true; });
      return { bats: pick(bats), pits: pick(pits) };
    },
    byKey() {
      const m = new Map();
      const bats = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
      const pits = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || window.PITCHERS_POOL || [];
      [...bats, ...pits].forEach(p => { const k = keyOf(p); if (!m.has(k)) m.set(k, p); });
      return m;
    },
    // right click (or long press) on any card: see it big in the middle, like in the Dex
    zoom(p) {
      if (!p) return;
      document.getElementById('tb-zoom')?.remove();
      const z = document.createElement('div'); z.id = 'tb-zoom';
      z.innerHTML = `<div class="tb-zoom-card pc2-clickflip">${card(p)}</div><small>Click the card to flip it · click outside to close</small>`;
      z.onclick = e => { if (!e.target.closest('.tb-zoom-card')) z.remove(); };
      z.oncontextmenu = e => { e.preventDefault(); z.remove(); };
      document.body.appendChild(z);
    },
    used() { const v = this.pv; return new Set([...Object.values(v.lineup), ...v.bench, ...v.SP, ...v.RP].filter(Boolean)); },
    open() {
      this.load();
      let ov = document.getElementById('tb-preview');
      if (!ov) { ov = document.createElement('div'); ov.id = 'tb-preview'; document.body.appendChild(ov); }
      this.active = null; this.msg = '';
      this.render();
    },
    close() { const ov = document.getElementById('tb-preview'); if (ov) ov.remove(); },
    assign(slot, p) {
      const v = this.pv, k = keyOf(p);
      // a card can only be in one place
      Object.keys(v.lineup).forEach(s => { if (v.lineup[s] === k) delete v.lineup[s]; });
      ['bench', 'SP', 'RP'].forEach(l => { v[l] = v[l].map(x => (x === k ? null : x)); });
      const [kind, i] = slot.split(':');
      if (kind === 'L') v.lineup[i] = k; else v[kind][+i] = k;
      this.save();
    },
    remove(slot) {
      const v = this.pv, [kind, i] = slot.split(':');
      if (v.locks) delete v.locks[slot];
      if (kind === 'L') delete v.lineup[i]; else v[kind][+i] = null;
      this.save();
    },
    slotFits(slot, p) {
      const [kind, i] = slot.split(':');
      if (kind === 'L') return fits(p, i);
      if (kind === 'bench') return !isPit(p);
      if (kind === 'SP') return canStart(p);
      return isPit(p); // bullpen: any arm
    },
    // first open slot a card fits, used when you tap a card with no slot picked
    autoSlot(p) {
      const v = this.pv;
      if (isPit(p)) {
        const sp = String(p.role || 'SP').toUpperCase() !== 'RP';
        if (sp) { const i = [...Array(SP_N).keys()].find(n => !v.SP[n]); if (i !== undefined) return `SP:${i}`; }
        const j = [...Array(RP_N).keys()].find(n => !v.RP[n]); return j !== undefined ? `RP:${j}` : null;
      }
      const pos = [p.pos, ...secOf(p), 'DH'].find(s => SLOTS.includes(s) && !v.lineup[s] && fits(p, s));
      if (pos) return `L:${pos}`;
      const b = [...Array(BENCH).keys()].find(n => !v.bench[n]); return b !== undefined ? `bench:${b}` : null;
    },
    autoFill() {
      const { bats, pits } = this.pools(), v = this.pv, used = this.used();
      const free = arr => arr.filter(p => !used.has(keyOf(p))).sort((a, b) => ovr(b) - ovr(a));
      SLOTS.filter(s => s !== 'DH').forEach(s => { if (v.lineup[s]) return; const p = free(bats).find(x => x.pos === s && fits(x, s)) || free(bats).find(x => fits(x, s)); if (p) { v.lineup[s] = keyOf(p); used.add(keyOf(p)); } });
      if (!v.lineup.DH) { const p = free(bats)[0]; if (p) { v.lineup.DH = keyOf(p); used.add(keyOf(p)); } }
      for (let i = 0; i < BENCH; i++) if (!v.bench[i]) { const p = free(bats)[0]; if (p) { v.bench[i] = keyOf(p); used.add(keyOf(p)); } }
      for (let i = 0; i < SP_N; i++) if (!v.SP[i]) { const p = free(pits).find(x => String(x.role || 'SP').toUpperCase() !== 'RP'); if (p) { v.SP[i] = keyOf(p); used.add(keyOf(p)); } }
      for (let i = 0; i < RP_N; i++) if (!v.RP[i]) { const p = free(pits).find(x => String(x.role).toUpperCase() === 'RP') || free(pits)[0]; if (p) { v.RP[i] = keyOf(p); used.add(keyOf(p)); } }
      this.save();
    },
    // Random team (user, 9 nov 2026): every spot that is not locked gets a random card that plays it,
    // drawn from the cards the Challenge can use (so SEND TO ALL-STAR keeps them all). Locked spots stay.
    randomTeam() {
      // the preview can use every card (only the All-Star import requires collected ones)
      const bats = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
      const pits = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || window.PITCHERS_POOL || [];
      const v = this.pv; v.locks = v.locks || {};
      const L = v.locks, used = new Set();
      const keep = (slot, k) => { if (L[slot] && k) { used.add(k); return true; } return false; };
      SLOTS.forEach(s => { if (!keep(`L:${s}`, v.lineup[s])) delete v.lineup[s]; });
      ['bench', 'SP', 'RP'].forEach(l => { v[l] = v[l].map((k, i) => (keep(`${l}:${i}`, k) ? k : null)); });
      const any = (arr, ok) => { const c = arr.filter(p => !used.has(keyOf(p)) && ok(p)); if (!c.length) return null; const p = c[Math.floor(Math.random() * c.length)]; used.add(keyOf(p)); return keyOf(p); };
      // field spots: a natural at the spot first (any of them), a secondary only if there is none
      SLOTS.filter(s => s !== 'DH').sort(() => Math.random() - 0.5).forEach(s => {
        if (v.lineup[s]) return;
        v.lineup[s] = any(bats, p => p.pos === s && fits(p, s)) || any(bats, p => fits(p, s));
      });
      if (!v.lineup.DH) v.lineup.DH = any(bats, p => !isPit(p));
      const hasC = () => v.bench.some(k => { const p = k && this.byKey().get(k); return p && (p.pos === 'C' || secOf(p).includes('C')); });
      for (let i = 0; i < BENCH; i++) if (!v.bench[i]) v.bench[i] = (!hasC() && any(bats, p => p.pos === 'C')) || any(bats, p => !isPit(p));
      for (let i = 0; i < SP_N; i++) if (!v.SP[i]) v.SP[i] = any(pits, p => String(p.role || 'SP').toUpperCase() !== 'RP');
      for (let i = 0; i < RP_N; i++) if (!v.RP[i]) v.RP[i] = any(pits, p => String(p.role).toUpperCase() === 'RP');
      Object.keys(v.lineup).forEach(s => { if (!v.lineup[s]) delete v.lineup[s]; });
      this.save();
    },
    // Mosaic (user, 9 nov 2026): 12 random faces from the whole Challenge pool, like the player wall on
    // Baseball Reference's home page; 🎲 draws a new dozen, clicking a face opens the player's card.
    mosaicPool() {
      const C = window.Challenge162;
      if (C && !C.unlockedBatters && typeof C.initUnlocks === 'function') C.initUnlocks();
      let b = (C && typeof C.getEligibleBatters === 'function' && C.getEligibleBatters()) || [];
      let p = (C && typeof C.getEligiblePitchers === 'function' && C.getEligiblePitchers()) || [];
      if (!b.length) b = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
      if (!p.length) p = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || window.PITCHERS_POOL || [];
      return b.concat(p);
    },
    rollMosaic() {
      const pool = this.mosaicPool(), out = [], seen = new Set();
      for (let t = 0; out.length < 12 && t < 200 && pool.length; t++) {
        const p = pool[Math.floor(Math.random() * pool.length)], k = keyOf(p);
        if (!seen.has(k)) { seen.add(k); out.push(p); }
      }
      this.mosaic = out;
    },
    mosaicHTML() {
      if (!this.mosaic || !this.mosaic.length) this.rollMosaic();
      const eraOf = y => { y = parseInt(y, 10) || 2020; return y <= 1900 ? 'genesis' : y <= 1919 ? 'deadball' : y <= 1941 ? 'golden' : y <= 1960 ? 'integration' : y <= 1976 ? 'expansion' : y <= 1993 ? 'bighair' : y <= 2005 ? 'steroid' : y <= 2015 ? 'efficiency' : 'modern'; };
      const face = p => (window.CardArt ? window.CardArt.portrait(p, eraOf(p.year), isPit(p)) : '');
      const tiles = this.mosaic.map((p, i) => `<button class="tb-mz r-${String(p.rarity || 'Common').toLowerCase()}" data-tb-mz="${i}" title="${esc(p.name)} · ${esc(p.pos || p.role || '')} · ${Math.floor(ovr(p))}">
          <i style="background-image:url(${face(p)})"></i><span>${esc(p.name)}</span></button>`).join('');
      return `<div class="tb-mosaic"><div class="tb-mz-head"><span>🎴 RANDOM PLAYERS</span><button class="tb-btn" data-tb="mosaic" title="Draw 12 new players">🎲 REROLL</button></div><div class="tb-mz-grid">${tiles}</div></div>`;
    },
    toggleLock(slot) { const v = this.pv; v.locks = v.locks || {}; if (v.locks[slot]) delete v.locks[slot]; else v.locks[slot] = true; this.save(); },
    sendToAllStar() {
      const C = window.Challenge162; if (!C || typeof C.importPreview !== 'function') return;
      const m = this.byKey(), v = this.pv, get = k => (k ? m.get(k) : null);
      const res = C.importPreview({
        lineup: Object.fromEntries(Object.entries(v.lineup).map(([s, k]) => [s, get(k)])),
        bench: v.bench.map(get), SP: v.SP.map(get), RP: v.RP.map(get), name: v.name
      });
      this.close();
      if (window.BaseballDex && typeof window.BaseballDex.close === 'function') window.BaseballDex.close();
      if (res && res.skipped && res.skipped.length && typeof window.showToast === 'function') {
        window.showToast(`${res.skipped.length} card${res.skipped.length > 1 ? 's are' : ' is'} not unlocked for the Challenge yet: ${res.skipped.slice(0, 4).join(', ')}${res.skipped.length > 4 ? '…' : ''}`);
      }
    },
    slotCard(slot, label) {
      const [kind, i] = slot.split(':'), v = this.pv, m = this._map;
      const k = kind === 'L' ? v.lineup[i] : v[kind][+i];
      const p = k ? m.get(k) : null;
      const on = this.active === slot;
      if (!p) return `<button class="tb-slot empty ${on ? 'on' : ''}" data-tb-slot="${slot}"><span>${label}</span><i>+</i></button>`;
      const lk = !!(v.locks && v.locks[slot]);
      return `<div class="tb-slot full ${on ? 'on' : ''} ${lk ? 'locked' : ''}" data-tb-slot="${slot}"><span class="tb-tag">${label}</span><div class="tb-card">${card(p)}</div><button class="tb-lock" data-tb-lock="${slot}" title="${lk ? 'Locked: RANDOM TEAM keeps him (click to unlock)' : 'Lock him so RANDOM TEAM keeps him'}">${lk ? '🔒' : '🔓'}</button><button class="tb-x" data-tb-x="${slot}" title="Remove">✕</button></div>`;
    },
    render() {
      const ov = document.getElementById('tb-preview'); if (!ov) return;
      const v = this.pv, { bats, pits } = this.pools();
      this._map = this.byKey();
      const used = this.used();
      const slotHTML = {}; SLOTS.forEach(s => { slotHTML[s] = this.slotCard(`L:${s}`, s); });
      const mound = this.slotCard('SP:0', 'SP1');
      const row = (kind, n, lab) => [...Array(n).keys()].map(i => this.slotCard(`${kind}:${i}`, lab(i))).join('');
      const placed = [...used].map(k => this._map.get(k)).filter(Boolean);
      const teamOvr = placed.length ? (placed.reduce((t, p) => t + ovr(p), 0) / placed.length).toFixed(1) : '—';
      let deck = [...bats, ...pits].filter(p => !used.has(keyOf(p)));
      if (this.active) deck = deck.filter(p => this.slotFits(this.active, p));
      else if (this.pos && this.pos !== 'ALL') deck = deck.filter(p => this.pos === 'SP' ? canStart(p)
        : this.pos === 'RP' ? isPit(p) && String(p.role).toUpperCase() === 'RP' : fits(p, this.pos));
      const posTabs = this.active ? '' : `<div class="tb-postabs">${['ALL', ...SLOTS, 'SP', 'RP'].map(x => `<button class="${(this.pos || 'ALL') === x ? 'on' : ''}" data-tb-pos="${x}">${x}</button>`).join('')}</div>`;
      deck.sort((a, b) => ovr(b) - ovr(a));
      const deckHTML = deck.length ? deck.map(p => `<div class="tb-deckcard" data-tb-card="${esc(keyOf(p))}">${card(p)}</div>`).join('')
        : `<div class="tb-empty">${this.active ? 'No card in your shortlist fits this spot.' : (bats.length + pits.length ? 'Every shortlisted card is on the board.' : 'Your shortlist is empty: add cards with ⭐ in the Dex.')}</div>`;
      const opts = this.previews.map((p, i) => `<option value="${i}" ${i === this.cur ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
      const filled = placed.length;
      ov.innerHTML = `<div class="tb-wrap">
        <div class="tb-head">
          <div class="tb-title"><small>TEAM PREVIEW · FROM YOUR SHORTLIST</small>
            <input class="tb-name" id="tb-name" maxlength="28" value="${esc(v.name)}" aria-label="Preview name"></div>
          <div class="tb-ovr"><small>TEAM OVR</small><b>${teamOvr}</b><span>${filled} / 26</span></div>
          <div class="tb-tools">
            <select id="tb-pick" aria-label="Saved previews">${opts}</select>
            <button class="tb-btn" data-tb="new">＋ NEW</button>
            <button class="tb-btn" data-tb="del">🗑 DELETE</button>
            <button class="tb-btn gold" data-tb="random" title="Fill every spot that is not locked with a random player who plays it">🎲 RANDOM TEAM</button>
            <button class="tb-btn" data-tb="auto">⚡ AUTO-FILL</button>
            <button class="tb-btn" data-tb="clear">CLEAR</button>
            <button class="tb-btn gold" data-tb="send">👑 SEND TO ALL-STAR DREAM TEAM</button>
            <button class="tb-btn" data-tb="close">✕ CLOSE</button>
          </div>
        </div>
        <div class="tb-hint">${this.active ? `Pick a card for <b>${this.active.replace(/^L:/, '').replace(':', ' ')}</b> from the deck on the right, or tap the spot again to cancel.` : 'Tap a spot on the board and then a card, or tap a card and it goes to the first open spot it fits. Right click (long press on phones) a card to see it big.'}</div>
        <div class="tb-body">
          <div class="tb-board">
            ${fieldHTML(slotHTML, mound)}
            <div class="tb-rack"><div class="tb-rack-t">🛋️ BENCH</div><div class="tb-row">${row('bench', BENCH, i => `BN${i + 1}`)}</div></div>
            <div class="tb-rack"><div class="tb-rack-t">🧢 ROTATION</div><div class="tb-row">${[1, 2, 3, 4].map(i => this.slotCard(`SP:${i}`, `SP${i + 1}`)).join('')}</div></div>
            <div class="tb-rack"><div class="tb-rack-t">🔥 BULLPEN</div><div class="tb-row">${row('RP', RP_N, i => (i === 0 ? 'CL' : `RP${i}`))}</div></div>
          </div>
          <div class="tb-deck"><div class="tb-rack-t">⭐ YOUR SHORTLIST · ${deck.length}${this.active ? ' THAT FIT' : ''}</div>${posTabs}<div class="tb-deckgrid">${deckHTML}</div></div>
        </div>
      </div>`;
      this.bind(ov);
    },
    bind(ov) {
      const zoomOf = el => { const k = el.dataset.tbCard || (() => { const sl = el.dataset.tbSlot; const [kind, i] = sl.split(':'); return kind === 'L' ? this.pv.lineup[i] : this.pv[kind][+i]; })(); return k ? this._map.get(k) : null; };
      ov.querySelectorAll('[data-tb-card], .tb-slot.full').forEach(el => {
        el.oncontextmenu = e => { e.preventDefault(); this.zoom(zoomOf(el)); };
        let t = null; // long press on phones
        el.addEventListener('touchstart', () => { t = setTimeout(() => { t = 'fired'; this.zoom(zoomOf(el)); }, 500); }, { passive: true });
        el.addEventListener('touchend', e => { if (t === 'fired') e.preventDefault(); else clearTimeout(t); t = null; });
        el.addEventListener('touchmove', () => { if (t && t !== 'fired') clearTimeout(t); t = null; }, { passive: true });
      });
      ov.querySelectorAll('[data-tb-x]').forEach(b => { b.onclick = e => { e.stopPropagation(); this.remove(b.dataset.tbX); this.render(); }; });
      ov.querySelectorAll('[data-tb-lock]').forEach(b => { b.onclick = e => { e.stopPropagation(); this.toggleLock(b.dataset.tbLock); this.render(); }; });
      ov.querySelectorAll('[data-tb-slot]').forEach(b => { b.onclick = e => { if (e.target.closest('.pc2-flip, [data-tb-x], [data-tb-lock]')) return; const s = b.dataset.tbSlot; this.active = this.active === s ? null : s; this.render(); }; });
      ov.querySelectorAll('[data-tb-card]').forEach(b => {
        b.onclick = e => {
          if (e.target.closest('.pc2-flip')) return;
          const p = this._map.get(b.dataset.tbCard) || this.pools().bats.concat(this.pools().pits).find(x => keyOf(x) === b.dataset.tbCard);
          if (!p) return;
          const slot = this.active || this.autoSlot(p);
          if (!slot) return;
          this.assign(slot, p); this.active = null;
          if (window.AudioManager && window.AudioManager.play) window.AudioManager.play('card_deal');
          this.render();
        };
      });
      ov.querySelectorAll('[data-tb-pos]').forEach(b => { b.onclick = () => { this.pos = b.dataset.tbPos; this.render(); }; });
      const name = ov.querySelector('#tb-name'); if (name) name.onchange = () => { this.pv.name = name.value.trim() || 'My Dream Team'; this.save(); this.render(); };
      const pick = ov.querySelector('#tb-pick'); if (pick) pick.onchange = () => { this.cur = +pick.value; this.active = null; this.save(); this.render(); };
      ov.querySelectorAll('[data-tb]').forEach(b => {
        b.onclick = () => {
          const a = b.dataset.tb;
          if (a === 'close') return this.close();
          if (a === 'new') { this.previews.push(this.blank(`Preview ${this.previews.length + 1}`)); this.cur = this.previews.length - 1; }
          if (a === 'del') { if (!confirm(`Delete "${this.pv.name}"?`)) return; this.previews.splice(this.cur, 1); if (!this.previews.length) this.previews.push(this.blank('My Dream Team')); this.cur = Math.max(0, this.cur - 1); }
          if (a === 'auto') this.autoFill();
          if (a === 'random') { this.randomTeam(); if (window.AudioManager && window.AudioManager.play) window.AudioManager.play('card_deal'); }
          if (a === 'clear') { const n = this.pv.name; this.previews[this.cur] = this.blank(n); }
          if (a === 'send') return this.sendToAllStar();
          this.active = null; this.save(); this.render();
        };
      });
      ov.onclick = e => { if (e.target === ov) this.close(); };
    }
  };

  // Random players wall (user, 9 nov 2026): mount into any element; 🎲 draws 12 new faces, a click on
  // a face calls onPick(player). Used at the top of the Dex.
  function mountMosaic(el, onPick) {
    if (!el) return;
    const draw = () => {
      TP.rollMosaic();
      el.innerHTML = TP.mosaicHTML().replace('data-tb="mosaic"', 'data-mz-roll="1"');
      el.querySelector('[data-mz-roll]').onclick = e => { e.stopPropagation(); draw(); if (window.AudioManager && window.AudioManager.play) window.AudioManager.play('card_deal'); };
      el.querySelectorAll('[data-tb-mz]').forEach(b => { b.onclick = () => (onPick || (p => TP.zoom(p)))(TP.mosaic[+b.dataset.tbMz]); });
    };
    if (TP.mosaic && TP.mosaic.length) {
      el.innerHTML = TP.mosaicHTML().replace('data-tb="mosaic"', 'data-mz-roll="1"');
      el.querySelector('[data-mz-roll]').onclick = e => { e.stopPropagation(); draw(); };
      el.querySelectorAll('[data-tb-mz]').forEach(b => { b.onclick = () => (onPick || (p => TP.zoom(p)))(TP.mosaic[+b.dataset.tbMz]); });
    } else draw();
  }
  // Main menu card wall (user, 9 nov 2026): real cards dealt at random from the whole pool, fanned like a
  // hand on the table; 🎲 deals a new hand, clicking a card opens its Dex page.
  const WALL_N = 9;
  function dealWall() {
    const el = document.getElementById('menu-card-wall');
    if (!el || typeof window.createCardHTML !== 'function') return false;
    const pool = TP.mosaicPool();
    if (!pool.length) return false;
    const pick = [], seen = new Set();
    for (let t = 0; pick.length < WALL_N && t < 300; t++) { const p = pool[Math.floor(Math.random() * pool.length)], k = keyOf(p); if (!seen.has(k)) { seen.add(k); pick.push(p); } }
    const mid = (WALL_N - 1) / 2;
    el.innerHTML = `<div class="mcw-head"><span>🎴 TODAY'S HAND</span><button class="mcw-roll" type="button" title="Deal a new hand">🎲 DEAL AGAIN</button></div>
      <div class="mcw-row">${pick.map((p, i) => `<div role="button" tabindex="0" class="mcw-card" data-mcw="${i}" style="--r:${((i - mid) * 3.2).toFixed(1)}deg;--y:${(Math.abs(i - mid) * 5).toFixed(0)}px;--d:${i * 70}ms">${window.createCardHTML(p)}</div>`).join('')}</div>`;
    el.querySelector('.mcw-roll').onclick = () => { dealWall(); if (window.AudioManager && window.AudioManager.play) window.AudioManager.play('card_deal'); };
    el.querySelectorAll('[data-mcw]').forEach(b => {
      b.onclick = e => {
        if (e.target.closest('.pc2-flip')) return;
        const p = pick[+b.dataset.mcw];
        const D = window.BaseballDex;
        if (D && typeof D.showDetail === 'function') D.showDetail(p); else TP.zoom(p);
      };
    });
    return true;
  }
  (function waitWall(n) { if (!dealWall() && n < 60) setTimeout(() => waitWall(n + 1), 500); })(0);

  window.TeamBoard = { mountMosaic, dealWall, SLOTS, FIELD_SPOT, FIELD_SVG, fieldHTML, openPreview: () => TP.open(), _tp: TP };
})();
