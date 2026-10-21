// Battle 2.0 — look-only prototype. Opens over the game with ?proto=battle2 and never touches the
// real combat: fake lineup, fake rolls, real cards (createCardHTML) and real portraits (card_art.js).
(function () {
  'use strict';
  if (!/[?&]proto=battle2\b/.test(location.search)) return;

  const ZONES = [
    { k: 'BB', lo: 1, hi: 10, c: '#bfe0ff' }, { k: 'K', lo: 11, hi: 28, c: '#f6b2a6' },
    { k: 'OUT', lo: 29, hi: 60, c: '#d9d0bc' }, { k: '1B', lo: 61, hi: 82, c: '#c4ecbd' },
    { k: '2B', lo: 83, hi: 91, c: '#9fe0a0' }, { k: '3B', lo: 92, hi: 93, c: '#ffe08a' },
    { k: 'HR', lo: 94, hi: 100, c: '#ffbe5c' }
  ];
  const WORD = { BB: 'WALK', K: 'STRIKEOUT', OUT: 'OUT', '1B': 'SINGLE', '2B': 'DOUBLE', '3B': 'TRIPLE', HR: 'HOME RUN!' };
  const BASE_XY = [[195, 115], [115, 35], [35, 115]]; // 1B, 2B, 3B on the printed diamond (230×230)
  const HOME_XY = [115, 195];

  function start() {
    const B = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || [];
    const P = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || [];
    const byName = n => B.find(p => p.name === n);
    const lineup = ['Rickey Henderson', 'Derek Jeter', 'Ken Griffey Jr.', 'Lou Gehrig', 'Mike Schmidt', 'Jackie Robinson', 'Honus Wagner', 'Johnny Bench', 'Shohei Ohtani']
      .map(byName).filter(Boolean);
    const pitcher = P.find(p => p.playerID === 'gibsobo01') || P.find(p => p.name === 'Bob Gibson') || P[0];
    const card = p => (typeof window.createCardHTML === 'function' ? window.createCardHTML(p) : '');

    const S = { hp: 100, shield: 41, pHp: 120, pMax: 120, outs: 0, inn: 0, runs: [0, 0, 0, 0, 0, 0, 0, 0, 0], bases: [null, null, null], idx: 0, busy: false };

    const root = document.createElement('div');
    root.id = 'pb2';
    root.innerHTML = `
      <button class="close" title="Close prototype">✕ PROTOTYPE</button>
      <div class="stage">
        <div class="sky"></div><div class="flash"></div>
        <div class="board">
          <div class="ls">
            <span></span>${[1,2,3,4,5,6,7,8,9].map(n => `<span class="h">${n}</span>`).join('')}<span></span><span class="h">R</span><span class="h">HP</span>
            <span class="tm">YOUR NINE</span>${[0,1,2,3,4,5,6,7,8].map(n => `<span class="slot" data-i="${n}"></span>`).join('')}<span></span><span class="slot" data-r>0</span><span class="slot" data-hp>100</span>
          </div>
          <div class="side"><span class="bulbs">OUTS<i></i><i></i><i></i></span><span class="bulbs">ON<i class="b"></i><i class="b"></i><i class="b"></i></span></div>
        </div>
        <div class="rival">
          <div class="cardwrap">${card(pitcher)}<div class="strap"><div class="ghost"></div><div class="fill"></div><span></span></div></div>
          <div class="pen"><div class="deck"><b></b><b></b><b></b></div><span class="tag">BULLPEN 2</span></div>
        </div>
        <div class="table">
          <div class="rail"></div><div class="felt"></div>
          <div class="dia"><div class="sq"></div>
            ${BASE_XY.map(([x, y]) => `<span class="bs" style="left:${x}px;top:${y}px"></span>`).join('')}
            <span class="bs" style="left:${HOME_XY[0]}px;top:${HOME_XY[1]}px;border-radius:0 0 0 0;transform:rotate(45deg) scale(.9)"></span>
            <div class="lbl"><span class="tag" data-mult>BASES EMPTY</span></div>
          </div>
          <div class="atbat"><div class="lbl"><span class="tag">AT BAT</span></div><div class="cardslot"></div></div>
          <div class="tray"><div class="bed"><div class="die d1">0<small>×10</small></div><div class="die d2">0</div></div>
            <div class="ruler">${ZONES.map(z => `<span data-z="${z.k}" style="flex:${z.hi - z.lo + 1};background:${z.c}">${z.k}<small>${z.lo}-${z.hi}</small></span>`).join('')}<i class="mark" style="left:50%"></i></div>
          </div>
          <div class="ctrl">
            <div class="team"><div class="row"><span>TEAM HP</span><span data-thp>100</span></div><div class="bar"><i data-hpbar style="width:100%"></i></div>
              <div class="row"><span>SHIELD · DEF 41</span><span data-tsh>41</span></div><div class="bar sh"><i data-shbar style="width:100%"></i></div></div>
            <div class="chips"><span class="chip">FOCUS</span><span class="chip">FOCUS</span><span class="chip blue">+3<br>HAND</span></div>
            <button class="roll">ROLL</button>
            <div class="note">LOOK-ONLY PROTOTYPE · FAKE ROLLS</div>
          </div>
          <div class="hand">${lineup.map((p, i) => `<div class="h" data-i="${i}">${card(p)}</div>`).join('')}</div>
        </div>
        <div class="result"><div class="word"></div><div class="dmg"></div></div>
      </div>`;
    document.body.appendChild(root);
    const $ = s => root.querySelector(s);
    const stage = $('.stage');
    const fit = () => { const k = Math.min(innerWidth / 1600, innerHeight / 900); stage.style.transform = `translate(-50%,-50%) scale(${k})`; };
    fit(); addEventListener('resize', fit);
    $('.close').onclick = () => root.remove();

    function paint() {
      const b = lineup[S.idx % lineup.length];
      const slot = $('.atbat .cardslot');
      if (slot.dataset.pid !== b.playerID) {
        slot.innerHTML = card(b); slot.dataset.pid = b.playerID;
        const ab = $('.atbat'); ab.classList.remove('swap', 'k'); void ab.offsetWidth; ab.classList.add('swap');
      }
      root.querySelectorAll('.hand .h').forEach((h, i) => {
        const n = lineup.length, off = i - (n - 1) / 2;
        h.style.transform = `translateY(${Math.abs(off) * 6}px) rotate(${off * 4}deg)`;
        h.classList.toggle('cur', i === S.idx % n);
      });
      $('[data-thp]').textContent = Math.max(0, Math.round(S.hp));
      $('[data-tsh]').textContent = Math.max(0, Math.round(S.shield));
      $('[data-hpbar]').style.width = Math.max(0, S.hp) + '%';
      $('[data-shbar]').style.width = Math.max(0, S.shield / 41 * 100) + '%';
      $('[data-hp]').textContent = Math.max(0, Math.round(S.hp));
      const pct = Math.max(0, S.pHp / S.pMax * 100);
      $('.strap .fill').style.width = `calc(${pct}% - 8px)`;
      $('.strap .ghost').style.width = `calc(${pct}% - 8px)`;
      $('.strap span').textContent = `${Math.max(0, Math.round(S.pHp))} / ${S.pMax} HP`;
      root.querySelectorAll('.board .slot[data-i]').forEach((el, i) => { el.textContent = i < S.inn ? S.runs[i] : i === S.inn ? S.runs[i] : ''; el.classList.toggle('now', i === S.inn); });
      $('[data-r]').textContent = S.runs.reduce((a, x) => a + x, 0);
      root.querySelectorAll('.bulbs')[0].querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i < S.outs));
      root.querySelectorAll('.bulbs')[1].querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', !!S.bases[i]));
      const on = S.bases.filter(Boolean).length;
      $('[data-mult]').textContent = on ? `${on} ON · ×${1 + on * 0.5} DMG` : 'BASES EMPTY';
      // runner tokens
      const dia = $('.dia');
      dia.querySelectorAll('.runner').forEach(r => { if (!S.bases.includes(r._p)) { r.style.left = HOME_XY[0] + 'px'; r.style.top = HOME_XY[1] + 'px'; r.classList.add('score'); setTimeout(() => r.remove(), 600); } });
      S.bases.forEach((p, i) => {
        if (!p) return;
        let tok = [...dia.querySelectorAll('.runner')].find(r => r._p === p);
        if (!tok) {
          tok = document.createElement('div'); tok.className = 'runner'; tok._p = p;
          tok.style.backgroundImage = `url(${window.CardArt ? window.CardArt.portrait(p, eraKey(p), false) : ''})`;
          tok.style.left = HOME_XY[0] + 'px'; tok.style.top = HOME_XY[1] + 'px';
          dia.appendChild(tok); void tok.offsetWidth;
        }
        tok.style.left = BASE_XY[i][0] + 'px'; tok.style.top = BASE_XY[i][1] + 'px';
      });
    }
    function eraKey(p) {
      const e = p.era || ''; const m = [['Genesis', 'genesis'], ['Deadball', 'deadball'], ['Golden', 'golden'], ['Integration', 'integration'], ['Expansion', 'expansion'], ['Big Hair', 'bighair'], ['Steroid', 'steroid'], ['Efficiency', 'efficiency']];
      const f = m.find(x => e.includes(x[0])); return f ? f[1] : 'modern';
    }

    function advance(n, batter, forced) {
      let scored = 0;
      if (forced) { // walk: only forced runners move
        if (S.bases[0]) { if (S.bases[1]) { if (S.bases[2]) scored++; S.bases[2] = S.bases[1]; } S.bases[1] = S.bases[0]; }
        S.bases[0] = batter; return scored;
      }
      const nb = [null, null, null];
      S.bases.forEach((p, i) => { if (!p) return; const t = i + n; if (t >= 3) scored++; else nb[t] = p; });
      if (n >= 4) scored++; else nb[n - 1] = batter;
      S.bases = nb; return scored;
    }

    function sparks(color, count) {
      const res = $('.result');
      for (let i = 0; i < count; i++) {
        const s = document.createElement('i'); s.className = 'spark';
        s.style.background = color[i % color.length];
        s.style.left = (790 + Math.random() * 20) + 'px'; s.style.top = (400 + Math.random() * 20) + 'px';
        s.style.setProperty('--dx', (Math.random() * 700 - 350) + 'px'); s.style.setProperty('--dy', (Math.random() * -420 + 60) + 'px');
        stage.appendChild(s); setTimeout(() => s.remove(), 1300);
      }
      void res;
    }

    function countUp(el, to, prefix) {
      const t0 = performance.now();
      const step = t => { const k = Math.min(1, (t - t0) / 550); el.textContent = prefix + Math.round(to * k); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }

    function show(kind, word, dmgText, dmgVal) {
      const r = $('.result'); r.className = 'result';
      r.querySelector('.word').textContent = word;
      const d = r.querySelector('.dmg'); d.textContent = '';
      void r.offsetWidth; r.classList.add('show', kind);
      if (dmgVal) countUp(d, dmgVal, dmgText); else d.textContent = dmgText;
      clearTimeout(show._t); show._t = setTimeout(() => { r.className = 'result'; r.querySelector('.word').textContent = ''; d.textContent = ''; }, 1700);
    }

    function roll() {
      if (S.busy) return; S.busy = true;
      const v = 1 + Math.floor(Math.random() * 100);
      const tens = Math.floor((v % 100) / 10), units = v % 10;
      const tray = $('.tray'); tray.classList.remove('rolling'); void tray.offsetWidth; tray.classList.add('rolling');
      const d1 = $('.die.d1'), d2 = $('.die.d2');
      const flick = setInterval(() => { d1.firstChild.nodeValue = Math.floor(Math.random() * 10); d2.textContent = Math.floor(Math.random() * 10); }, 60);
      root.querySelectorAll('.ruler span').forEach(s => s.classList.remove('hitz'));
      setTimeout(() => {
        clearInterval(flick);
        d1.firstChild.nodeValue = tens; d2.textContent = units;
        const z = ZONES.find(z => v >= z.lo && v <= z.hi);
        $('.ruler .mark').style.left = ((v - 0.5) / 100 * 100) + '%';
        root.querySelector(`.ruler span[data-z="${z.k}"]`).classList.add('hitz');
        setTimeout(() => resolve(z.k), 380);
      }, 900);
    }

    function resolve(k) {
      const batter = lineup[S.idx % lineup.length];
      const on = S.bases.filter(Boolean).length;
      const mult = 1 + on * 0.5;
      let scored = 0;
      if (k === 'K' || k === 'OUT') {
        S.outs++;
        if (k === 'K') { S.hp -= 8; $('.atbat').classList.add('k'); show('bad', WORD.K, '−8 HP · SKIPS THE SHIELD', 0); root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); }
        else { const a = Math.min(S.shield, 8); S.shield -= a; S.hp -= 8 - a; show('', WORD.OUT, a === 8 ? 'SHIELD −8' : `SHIELD −${a} · HP −${8 - a}`, 0); }
      } else {
        const base = { BB: 4, '1B': 10, '2B': 16, '3B': 22, HR: 30 }[k];
        const n = { '1B': 1, '2B': 2, '3B': 3, HR: 4 }[k];
        scored = k === 'BB' ? advance(0, batter, true) : advance(n, batter, false);
        const dmg = Math.round(base * mult);
        S.pHp -= dmg;
        S.runs[S.inn] += scored;
        show(k === 'HR' ? 'hr' : 'good', WORD[k], `${base}${mult > 1 ? ' ×' + mult : ''} = −`, dmg);
        const rv = $('.rival'); rv.classList.remove('hit'); void rv.offsetWidth; rv.classList.add('hit');
        if (k === 'HR') { root.classList.remove('hr', 'shake'); void root.offsetWidth; root.classList.add('hr', 'shake'); sparks(['#ffd36a', '#ff6a3c', '#fff6d8', '#7ad7ff'], 46); }
        else if (k !== 'BB') sparks(['#ffd36a', '#fff6d8'], 14);
      }
      if (S.pHp <= 0) {
        setTimeout(() => { show('hr', 'K.O.!', 'NEXT ARM FROM THE PEN', 0); S.pHp = S.pMax; paint(); }, 900);
      }
      if (S.outs >= 3) {
        setTimeout(() => { S.outs = 0; S.bases = [null, null, null]; S.inn = Math.min(8, S.inn + 1); paint(); }, 1100);
      }
      if (S.hp <= 0) S.hp = 100;
      S.idx++;
      paint();
      setTimeout(() => { S.busy = false; }, 650);
    }

    $('.roll').onclick = roll;
    addEventListener('keydown', e => { if (e.code === 'Space' && document.getElementById('pb2')) { e.preventDefault(); roll(); } });
    paint();
  }

  if (document.readyState === 'complete') setTimeout(start, 300);
  else addEventListener('load', () => setTimeout(start, 300));
})();
