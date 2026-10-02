// BaseRogue — visual polish layer ("juice"). Companion to style_juice.css.
// Presentation only: observes the DOM that ui.js renders and decorates it.
// Never reads or writes game state, so game.js / simulation.js stay untouched.
(function () {
  'use strict';

  // Re-running this file (hot reload from the console) must not stack observers.
  if (window.Juice && typeof window.Juice.destroy === 'function') window.Juice.destroy();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const observers = [];
  const $ = (id) => document.getElementById(id);

  function observe(target, options, callback) {
    if (!target) return null;
    const mo = new MutationObserver(callback);
    mo.observe(target, options);
    observers.push(mo);
    return mo;
  }

  // Re-trigger a CSS animation class on an element.
  function replay(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // ── Generic FX primitives ────────────────────────────────────────────────
  function floatText(text, anchor, cls) {
    if (!anchor || !anchor.getClientRects().length) return;
    const p = centerOf(anchor);
    const node = document.createElement('div');
    node.className = 'jx-float' + (cls ? ' ' + cls : '');
    node.textContent = text;
    node.style.left = (p.x + (Math.random() * 30 - 15)) + 'px';
    node.style.top = p.y + 'px';
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 1200);
  }

  function burst(x, y, colors, count, spread) {
    if (reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'jx-particle';
      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.35 + Math.random() * 0.65);
      const size = 4 + Math.floor(Math.random() * 3) * 2;
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.width = p.style.height = size + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      // Bias upward then let "gravity" pull the end point down a little
      p.style.setProperty('--dy', (Math.sin(angle) * dist - dist * 0.25 + 40) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = (0.7 + Math.random() * 0.5) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1300);
    }
  }

  function flash(color) {
    if (reducedMotion) return;
    const f = document.createElement('div');
    f.className = 'jx-flash';
    f.style.background = color;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 520);
  }

  // ── Screen transitions: wrap showScreen so every swap gets a CRT "switch-on" ──
  let lastScreenAt = 0;
  let originalShowScreen = null;
  function initScreenTransitions() {
    const current = window.showScreen;
    if (typeof current !== 'function') return;
    originalShowScreen = current.__jxOriginal || current;
    const wrapped = function (screenId) {
      const result = originalShowScreen.apply(this, arguments);
      lastScreenAt = Date.now();
      if (!reducedMotion) replay($(screenId), 'jx-screen-in');
      if (screenId === 'screen-match') setTimeout(bindMatch, 0);
      return result;
    };
    wrapped.__jxOriginal = originalShowScreen;
    window.showScreen = wrapped;
  }

  // ── Combat: outcome banner impact ────────────────────────────────────────
  const OUTCOME_FX = {
    HR: { shake: 'jx-shake-l', flash: 'rgba(250, 204, 21, 0.9)', particles: 46, spread: 320, colors: ['#facc15', '#fff', '#fb923c', '#fde047'], hit: true },
    '3B': { shake: 'jx-shake-s', flash: 'rgba(6, 182, 212, 0.6)', particles: 24, spread: 220, colors: ['#06b6d4', '#fff', '#67e8f9'], hit: true },
    '2B': { shake: 'jx-shake-s', particles: 16, spread: 170, colors: ['#10b981', '#fff', '#6ee7b7'], hit: true },
    '1B': { particles: 9, spread: 120, colors: ['#a7f3d0', '#fff'], hit: true },
    BB: { particles: 6, spread: 90, colors: ['#3b82f6', '#bfdbfe'], hit: true },
    E: { particles: 10, spread: 120, colors: ['#f59e0b', '#fff'], hit: true },
    STEAL: { particles: 10, spread: 130, colors: ['#38bdf8', '#fff'] },
    DEF_WIN: { particles: 20, spread: 200, colors: ['#ffd700', '#fff'] },
    SO: { shake: 'jx-shake-s', flash: 'rgba(239, 68, 68, 0.55)', miss: true },
    OUT: { miss: true },
    DEF_LOSE: { shake: 'jx-shake-l', flash: 'rgba(239, 68, 68, 0.6)', miss: true }
  };

  function onOutcomePopup(popup) {
    const fx = OUTCOME_FX[popup.dataset.outcome];
    if (!fx || reducedMotion) return;
    const arena = document.querySelector('.match-arena');
    const batterSlot = $('arena-batter-card-slot');
    const pitcherSlot = $('arena-pitcher-card-slot');
    if (fx.shake) replay(arena, fx.shake);
    if (fx.flash) flash(fx.flash);
    if (fx.particles) {
      const origin = fx.hit && pitcherSlot ? centerOf(pitcherSlot) : centerOf(popup);
      burst(origin.x, origin.y, fx.colors, fx.particles, fx.spread);
    }
    // Batter card lunges at the pitcher on contact; whoever loses the exchange recoils.
    if (fx.hit && batterSlot && pitcherSlot) {
      batterSlot.style.setProperty('--lunge', '18px');
      pitcherSlot.style.setProperty('--recoil', '12px');
      replay(batterSlot, 'jx-lunge');
      replay(pitcherSlot, 'jx-recoil');
    } else if (fx.miss && batterSlot) {
      batterSlot.style.setProperty('--recoil', '-12px');
      replay(batterSlot, 'jx-recoil');
    }
  }

  // ── Combat: numeric readouts ("98/118 HP") → floating deltas + digit pops ──
  function parseFraction(text) {
    const m = /(-?\d+)\s*\/\s*(\d+)/.exec(text || '');
    return m ? { cur: +m[1], max: +m[2] } : null;
  }

  function watchFraction(el, anchorFn, cls) {
    if (!el || el.__jxWatched) return;
    el.__jxWatched = true;
    let prev = parseFraction(el.textContent);
    observe(el, { childList: true, characterData: true, subtree: true }, () => {
      const now = parseFraction(el.textContent);
      if (!now) return;
      // Ignore re-initialisation (new match, new pitcher) — only same-pool changes are hits/heals.
      const settled = Date.now() - lastScreenAt > 1200;
      if (prev && settled && now.max === prev.max && now.cur !== prev.cur) {
        const delta = now.cur - prev.cur;
        const anchor = anchorFn() || el;
        if (delta < 0) floatText(String(delta), anchor, (cls || '') + (delta <= -30 ? ' big' : ''));
        else floatText('+' + delta, anchor, 'heal');
      }
      prev = now;
    });
  }

  function watchDigit(el) {
    if (!el || el.__jxWatched) return;
    el.__jxWatched = true;
    let prev = el.textContent;
    observe(el, { childList: true, characterData: true, subtree: true }, () => {
      if (el.textContent === prev) return;
      prev = el.textContent;
      replay(el, 'jx-pop');
    });
  }

  // ── Combat: ghost trail behind HP / shield bars ──
  function ghostBar(fill) {
    if (!fill || fill.__jxGhost || !fill.parentElement) return;
    fill.__jxGhost = true;
    const wrap = fill.parentElement;
    wrap.classList.add('jx-bar');
    const ghost = document.createElement('div');
    ghost.className = 'jx-ghost';
    ghost.style.width = fill.style.width || '100%';
    wrap.insertBefore(ghost, fill);
    observe(fill, { attributes: true, attributeFilter: ['style'] }, () => {
      const w = fill.style.width;
      if (!w || ghost.style.width === w) return;
      // Growing (heal / new pitcher) snaps; shrinking trails behind via the CSS transition delay.
      const grow = parseFloat(w) > parseFloat(ghost.style.width);
      ghost.style.transition = grow ? 'none' : '';
      ghost.style.width = w;
    });
  }

  // ── Combat: out lamps on the scoreboard ──
  function outLamps() {
    const outs = $('score-home-r');
    if (!outs || outs.__jxLamps) return;
    outs.__jxLamps = true;
    const lamps = document.createElement('div');
    lamps.className = 'jx-outs';
    lamps.innerHTML = '<i></i><i></i><i></i>';
    outs.parentElement.appendChild(lamps);
    const paint = () => {
      const n = parseInt(outs.textContent, 10) || 0;
      [...lamps.children].forEach((lamp, i) => lamp.classList.toggle('on', i < n));
    };
    paint();
    observe(outs, { childList: true, characterData: true, subtree: true }, paint);
  }

  // ── Combat: d100 strip built from the Luck Zones rows ──
  function readZones() {
    return [...document.querySelectorAll('#zones-lines .outcome-row')].map(row => {
      const left = row.querySelector('.outcome-row-left');
      const m = /(\d+)\s*[–-]\s*(\d+)/.exec(row.querySelector('.outcome-row-right')?.textContent || '');
      if (!left || !m) return null;
      return { from: +m[1], to: +m[2], color: left.style.color || '#fff', label: left.textContent.trim() };
    }).filter(z => z && z.to >= z.from);
  }

  // The Luck Zones list re-renders for the NEXT batter as soon as a roll resolves.
  // While `zoneFreeze` is on, the strip keeps the ranges the roll was actually made
  // against, shows where it landed, and only then swaps to the new batter's ranges.
  let zoneFreeze = false;
  let zoneHoldTimer = null;

  function buildZoneStrip() {
    if (zoneFreeze) return;
    const wrap = $('zones-panel-wrap');
    if (!wrap) return;
    const zones = readZones();
    let strip = $('jx-zone-strip');
    if (!zones.length) { if (strip) strip.remove(); return; }
    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'jx-zone-strip';
      strip.innerHTML = '<div class="jx-zone-marker"></div><div class="jx-zone-track"></div><div class="jx-zone-caption"></div>';
      wrap.parentElement.insertBefore(strip, wrap);
    }
    const track = strip.querySelector('.jx-zone-track');
    track.innerHTML = '';
    zones.sort((a, b) => a.from - b.from).forEach(z => {
      const seg = document.createElement('div');
      seg.className = 'jx-zone-seg';
      seg.style.width = (z.to - z.from + 1) + '%';
      seg.style.background = z.color;
      seg.dataset.from = z.from;
      seg.dataset.to = z.to;
      seg.dataset.label = z.label;
      track.appendChild(seg);
    });
  }

  function releaseZoneStrip() {
    clearTimeout(zoneHoldTimer);
    if (!zoneFreeze) return;
    zoneFreeze = false;
    const strip = $('jx-zone-strip');
    if (strip) {
      strip.classList.remove('rolled');
      strip.querySelector('.jx-zone-marker').classList.remove('on');
      strip.querySelector('.jx-zone-caption').textContent = '';
    }
    buildZoneStrip();
    if (!reducedMotion) replay($('jx-zone-strip'), 'jx-strip-swap');
  }

  function freezeZoneStrip() {
    releaseZoneStrip(); // a fast second roll: catch up to the current batter first
    if (!$('jx-zone-strip')) return;
    zoneFreeze = true;
    // Never stay frozen if no result shows up (roll rejected, match ended, etc.)
    zoneHoldTimer = setTimeout(releaseZoneStrip, 4000);
  }

  function markRoll(value) {
    const strip = $('jx-zone-strip');
    if (!strip || !zoneFreeze || !(value >= 1 && value <= 100)) return;
    const marker = strip.querySelector('.jx-zone-marker');
    const caption = strip.querySelector('.jx-zone-caption');
    marker.style.left = (value - 0.5) + '%';
    marker.classList.add('on');
    strip.classList.add('rolled');
    strip.querySelectorAll('.jx-zone-seg').forEach(seg => {
      const hit = value >= +seg.dataset.from && value <= +seg.dataset.to;
      seg.classList.toggle('miss', !hit);
      if (!hit) return;
      replay(seg, 'hit');
      caption.textContent = value + ' ▸ ' + seg.dataset.label + '  [' + seg.dataset.from + '–' + seg.dataset.to + ']';
      caption.style.color = seg.style.background;
    });
    clearTimeout(zoneHoldTimer);
    zoneHoldTimer = setTimeout(releaseZoneStrip, 2600);
  }

  function onRollClick(e) {
    if (e.target.closest && e.target.closest('#btn-roll-dice')) freezeZoneStrip();
  }

  // Bind everything that lives inside the match screen. Safe to call repeatedly:
  // ui.js re-injects the dice panel per match, so each helper guards itself.
  function bindMatch() {
    const pitcherSlot = () => $('arena-pitcher-card-slot');
    watchFraction($('match-pitcher-hp-text'), pitcherSlot, '');
    watchFraction($('team-hp-text'), () => $('team-hp-text'), '');
    watchFraction($('team-shield-text'), () => $('team-shield-text'), 'shield');
    ['score-away-h', 'score-home-h'].forEach(id => watchDigit($(id)));
    ghostBar($('team-hp-bar'));
    ghostBar($('team-shield-bar'));
    ghostBar($('match-pitcher-hp-fill'));
    outLamps();

    const zoneLines = $('zones-lines');
    if (zoneLines && !zoneLines.__jxWatched) {
      zoneLines.__jxWatched = true;
      observe(zoneLines, { childList: true, subtree: true }, buildZoneStrip);
    }
    buildZoneStrip();

    const result = $('dice-result-display');
    if (result && !result.__jxWatched) {
      result.__jxWatched = true;
      observe(result, { childList: true, characterData: true, subtree: true }, () => {
        const value = parseInt(result.textContent, 10);
        if (value) markRoll(value);
      });
    }
  }

  function initMatch() {
    const slot = $('dice-container-slot');
    let pending = null;
    // The dice panel is rebuilt by ui.js; rebind (debounced) whenever its children change.
    observe(slot, { childList: true }, () => {
      clearTimeout(pending);
      pending = setTimeout(bindMatch, 30);
    });
    // Capture phase: freeze the strip before ui.js resolves the roll and re-renders the zones.
    document.addEventListener('click', onRollClick, true);
    const deck = document.querySelector('.rpg-fight-deck');
    observe(deck, { childList: true }, (mutations) => {
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('outcome-popup-overlay')) onOutcomePopup(node);
      }));
    });
    bindMatch();
  }

  // ── 162-0 Challenge: react to each simulated game on the season screen ──
  // renderSeason() replaces the whole container, so diff the record after each render.
  function initChallengeSeason() {
    const container = $('challenge162-season-container');
    if (!container) return;
    let prev = null;
    observe(container, { childList: true }, () => {
      const wEl = container.querySelector('.c162-rec-w');
      const lEl = container.querySelector('.c162-rec-l');
      if (!wEl || !lEl) { prev = null; return; }
      const now = { w: parseInt(wEl.textContent, 10) || 0, l: parseInt(lEl.textContent, 10) || 0 };
      const dw = prev ? now.w - prev.w : 0;
      const dl = prev ? now.l - prev.l : 0;
      // Only forward progress within the same season counts (a new season resets to 0-0).
      if (prev && dw >= 0 && dl >= 0 && dw + dl > 0 && !reducedMotion) {
        if (dw > 0) { wEl.classList.add('jx-pop'); floatText('+' + dw + ' W', wEl, 'win'); }
        if (dl > 0) {
          lEl.classList.add('jx-pop');
          floatText('+' + dl + ' L', lEl, '');
          flash('rgba(239, 68, 68, 0.5)');
          replay(container.querySelector('.c162-record-card'), 'jx-shake-s');
        }
        const feed = container.querySelectorAll('.c162-game-feed .c162-game-badge');
        const fresh = Math.min(dw + dl, feed.length, 10);
        for (let i = 0; i < fresh; i++) {
          feed[i].classList.add('jx-feed-new');
          feed[i].style.animationDelay = (i * 45) + 'ms';
        }
      }
      prev = now;
    });
  }

  // ── 162-0 Challenge: gold confetti when the results screen reports a World Series win ──
  function initChallengeResults() {
    const container = $('challenge162-results-container');
    if (!container) return;
    observe(container, { childList: true }, () => {
      const title = container.firstElementChild;
      if (container.dataset.champion !== '1' || !title || !title.getClientRects().length) return;
      const p = centerOf(title);
      const gold = ['#ffd700', '#fff', '#fbbf24', '#fde047'];
      [0, 260, 520].forEach((delay, i) => setTimeout(
        () => burst(p.x + (i - 1) * 260, p.y, gold, 34, 300), delay));
    });
  }

  // ── Cards: feed the cursor position to the foil / glare layers in CSS ──
  function onCardPointer(e) {
    const card = e.target.closest && e.target.closest('.player-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }

  function initCards() {
    if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.addEventListener('mousemove', onCardPointer, { passive: true });
  }

  // ── Menu: ambient motes drifting up through the stadium lights ──
  function initAmbient() {
    if (reducedMotion || $('jx-ambient')) return;
    const layer = document.createElement('div');
    layer.id = 'jx-ambient';
    for (let i = 0; i < 18; i++) {
      const mote = document.createElement('i');
      const size = 2 + Math.floor(Math.random() * 3) * 2;
      mote.style.left = (Math.random() * 100) + '%';
      mote.style.width = mote.style.height = size + 'px';
      mote.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
      mote.style.animationDuration = (9 + Math.random() * 10) + 's';
      mote.style.animationDelay = (-Math.random() * 18) + 's';
      layer.appendChild(mote);
    }
    document.body.insertBefore(layer, document.body.firstChild);
  }

  function init() {
    initScreenTransitions();
    initMatch();
    initCards();
    initAmbient();
    initChallengeSeason();
    initChallengeResults();
  }

  function destroy() {
    observers.forEach(mo => mo.disconnect());
    observers.length = 0;
    if (originalShowScreen) window.showScreen = originalShowScreen;
    document.removeEventListener('mousemove', onCardPointer);
    document.removeEventListener('click', onRollClick, true);
    clearTimeout(zoneHoldTimer);
    zoneFreeze = false;
    document.querySelectorAll('#jx-zone-strip, #jx-ambient, .jx-outs, .jx-ghost').forEach(n => n.remove());
    document.querySelectorAll('*').forEach(n => {
      delete n.__jxWatched; delete n.__jxGhost; delete n.__jxLamps;
    });
  }

  window.Juice = { replay, floatText, burst, flash, destroy, reducedMotion };

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
