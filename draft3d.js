// 3D foil pack for the 9-round draft (Quick Play / Story). Presentation only: ui.js builds the flat
// pack as always and calls DraftPack3D.mount(pack, opts); once three.js is ready the pack is drawn as a
// real pillow-shaped foil wrapper that leans toward the cursor. DraftPack3D.open(pack) plays the tear
// (shake, strip ripped off, light, wrapper dropping away) and resolves when the cards should be dealt.
// If three.js is missing, motion is reduced or WebGL fails, open() returns null and ui.js keeps the
// old flat tear.
(function () {
  'use strict';

  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 1.7, H = 2.36, BULGE = 0.13, TEAR_Y = H / 2 - H * 0.17;   // world units; tear line 17% from the top
  const TEX_W = 512, TEX_H = 712;
  const PAD_X = 70, PAD_Y = 90;                                      // canvas overhang around the pack (px)

  const THEMES = {
    epic_plus: { a: '#fff4b8', b: '#e2b33c', c: '#7a560f', ink: '#2e1d04', edge: '#5c3f08', glow: '#ffd700', refl: 0.22, tier: 4 },
    epic:      { a: '#ecd2ff', b: '#9b4dff', c: '#33105f', ink: '#ffffff', edge: '#240a44', glow: '#c084fc', refl: 0.2, tier: 3 },
    rare:      { a: '#d4e9ff', b: '#3b82f6', c: '#0c275c', ink: '#ffffff', edge: '#08193d', glow: '#60a5fa', refl: 0.2, tier: 2 },
    uncommon:  { a: '#cdf8de', b: '#22a35a', c: '#0b4528', ink: '#ffffff', edge: '#06301b', glow: '#4ade80', refl: 0.18, tier: 1 },
    common:    { wax: true, a: '#f4e7c6', b: '#c8302b', c: '#1e3c7c', ink: '#2a1a0e', edge: '#7a1c18', glow: '#f3e7c6', refl: 0.1, tier: 0 },
    // 162-0 box packs (user, Nov 2026): Wax / Retail / Hobby / Premium, each with its own print
    // pack art v2 (Nov 2026): vintage-pack layout (arched wordmark, ribbon, starburst); the finish sells the tier
    wax2:      { pk: 'wax', a: '#f3e6c4', b: '#c8302b', c: '#1e3c7c', ink: '#2a1a0e', edge: '#7a1c18', glow: '#f3e6c4', refl: 0.05, tier: 0, matte: true },
    retail2:   { pk: 'retail', a: '#ffd23f', b: '#d62828', c: '#1d3557', ink: '#ffffff', edge: '#7d1414', glow: '#ffd23f', refl: 0.1, tier: 1 },
    hobby2:    { pk: 'hobby', a: '#dfe6ee', b: '#12305e', c: '#d4a52c', ink: '#ffffff', edge: '#081a36', glow: '#9ec0ff', refl: 0.22, tier: 2, metal: 1 },
    premium2:  { pk: 'premium', a: '#fff1b0', b: '#0b0b0d', c: '#d4a017', ink: '#ffffff', edge: '#000000', glow: '#ffd700', refl: 0.3, tier: 4, metal: 2 },
    retail:    { retail: true, a: '#ffd23f', b: '#e63946', c: '#1d3557', ink: '#ffffff', edge: '#8f1a24', glow: '#ffd23f', refl: 0.14, tier: 1 },
    hobby:     { hobby: true, a: '#e9c46a', b: '#1b2a4a', c: '#0b1426', ink: '#ffffff', edge: '#070d1a', glow: '#e9c46a', refl: 0.24, tier: 2 },
    premium:   { premium: true, a: '#fff1b0', b: '#121212', c: '#d4a017', ink: '#ffffff', edge: '#000000', glow: '#ffd700', refl: 0.34, tier: 4 },
    // design trials (Nov 2026): vintage-style Hobby and Premium variants, painted by drawVariant
    hob1: { v: 'hob1', a: '#f2d16b', b: '#b8322a', c: '#1f3a6e', ink: '#ffffff', edge: '#6b4a24', glow: '#f2d16b', refl: 0.06, tier: 2 },
    hob2: { v: 'hob2', a: '#fdf6e3', b: '#d9472b', c: '#14284b', ink: '#ffffff', edge: '#14284b', glow: '#f59e0b', refl: 0.1, tier: 2 },
    hob3: { v: 'hob3', a: '#c9d6c2', b: '#0f4d3a', c: '#082b20', ink: '#ffffff', edge: '#05190f', glow: '#7ee0b0', refl: 0.3, tier: 2 },
    pre1: { v: 'pre1', a: '#ffffff', b: '#9aa3ad', c: '#2b2f36', ink: '#ffffff', edge: '#1b1e23', glow: '#e5e7eb', refl: 0.45, tier: 4 },
    pre2: { v: 'pre2', a: '#f5d77a', b: '#0d0d0d', c: '#b8860b', ink: '#ffffff', edge: '#000000', glow: '#ffd700', refl: 0.3, tier: 4 },
    pre3: { v: 'pre3', a: '#f3e3b5', b: '#6b0f1a', c: '#c9a227', ink: '#ffffff', edge: '#3a0710', glow: '#e7c55a', refl: 0.22, tier: 4 },
    random:    { rainbow: true, a: '#ffffff', b: '#f472b6', c: '#312e81', ink: '#ffffff', edge: '#1e1b4b', glow: '#f472b6', refl: 0.16, tier: 2 }
  };

  // ── three.js loading (shared with dice3d.js: whichever asks first loads it) ──
  let libs = window.THREE ? 'ready' : 'idle';
  function loadThree() {
    if (libs !== 'idle') return;
    if (window.THREE) { libs = 'ready'; setTimeout(onReady, 0); return; } // dice3d.js may have loaded it first
    libs = 'loading';
    const already = document.querySelector('script[src*="three.min.js"]');
    if (already) {
      let n = 0;
      const poll = setInterval(() => { if (window.THREE) { libs = 'ready'; clearInterval(poll); onReady(); } else if (++n > 200) { libs = 'failed'; clearInterval(poll); } }, 100);
      return;
    }
    const s = document.createElement('script');
    s.src = THREE_URL; s.async = true;
    s.onload = () => { libs = window.THREE ? 'ready' : 'failed'; onReady(); };
    s.onerror = () => { libs = 'failed'; };
    document.head.appendChild(s);
  }

  // ── shared renderer (one WebGL context, moved from pack to pack) ──
  let R = null;          // { renderer, scene, camera, lights, env }
  let S = null;          // the pack currently mounted
  let broken = false;

  function setupRenderer() {
    if (R || broken) return R;
    try {
      const T = window.THREE;
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(window.innerWidth < 900 ? 1.25 : Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = 'd3-canvas';
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(30, 0.75, 0.1, 50);
      camera.position.set(0, 0, 8.4);
      const amb = new T.AmbientLight(0xffffff, 0.5);
      const key = new T.DirectionalLight(0xffffff, 0.48); key.position.set(-2, 3, 4);
      const cursor = new T.PointLight(0xffffff, 0.32, 14); cursor.position.set(0, 0, 3.2);
      const inner = new T.PointLight(0xffffff, 0, 6); inner.position.set(0, TEAR_Y, 0.6);
      scene.add(amb, key, cursor, inner);
      R = { renderer, scene, camera, cursor, inner, env: makeEnv(T) };
    } catch (e) { broken = true; R = null; }
    return R;
  }

  // a cheap studio environment: six gradient faces with soft bright bands, so the foil throws
  // moving highlights as the pack turns
  function makeEnv(T) {
    const faces = [];
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 64, 64);
      gr.addColorStop(0, i % 2 ? '#1a1a1a' : '#3a3a3a');
      gr.addColorStop(0.44, '#6a6a6a'); gr.addColorStop(0.5, '#e8e8e8'); gr.addColorStop(0.56, '#5a5a5a');
      gr.addColorStop(1, i === 2 ? '#d8d8d8' : '#151515');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      faces.push(c);
    }
    const cube = new T.CubeTexture(faces);
    cube.needsUpdate = true;
    return cube;
  }

  // ── the printed wrapper ──
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function drawVariant(g, w, h, th) {
    const v = th.v;
    if (v === 'hob1') {        // 1950s gum pack: kraft paper, red band, star sticker
      g.fillStyle = '#c9a46a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '90,60,25' : '240,220,180'},${Math.random() * .12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = th.b; g.fillRect(0, h * 0.2, w, h * 0.12); g.fillRect(0, h * 0.86, w, h * 0.06);
      g.fillStyle = th.c; g.fillRect(0, h * 0.2 - 8, w, 6); g.fillRect(0, h * 0.32 + 2, w, 6);
      g.fillStyle = '#fff3d6'; g.font = '700 30px Oswald, sans-serif'; g.textAlign = 'center'; g.fillText('★ PICTURE CARDS ★', w / 2, h * 0.28);
      g.save(); g.translate(w - 84, h * 0.47); g.rotate(-0.2); g.beginPath(); for (let k = 0; k < 24; k++) { const r = k % 2 ? 40 : 54, a = k * Math.PI / 12; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath();
      g.fillStyle = th.a; g.fill(); g.strokeStyle = th.b; g.lineWidth = 3; g.stroke(); g.fillStyle = th.b; g.font = '700 16px Oswald, sans-serif'; g.fillText('WITH', 0, -4); g.fillText('GUM', 0, 14); g.restore();
    } else if (v === 'hob2') { // 1970s-80s cream pack with bold racing stripes
      g.fillStyle = th.a; g.fillRect(0, 0, w, h);
      [['#d9472b', 0.2], ['#f08a24', 0.26], ['#f5c542', 0.32]].forEach(([col, y]) => { g.fillStyle = col; g.fillRect(0, h * y, w, h * 0.05); });
      g.fillStyle = th.c; g.fillRect(0, h * 0.82, w, h * 0.12);
      g.fillStyle = '#fdf6e3'; g.font = '700 26px Oswald, sans-serif'; g.textAlign = 'center'; g.fillText('OFFICIAL BASEBALL CARDS', w / 2, h * 0.895);
      g.strokeStyle = th.c; g.lineWidth = 2; g.strokeRect(14, 50, w - 28, h - 100);
    } else if (v === 'hob3') { // 1990s metallic green with silver diagonals
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1d6b52'); gr.addColorStop(0.5, th.b); gr.addColorStop(1, th.c); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.save(); g.globalAlpha = 0.35; for (let i = -h; i < w; i += 90) { const sg = g.createLinearGradient(i, 0, i + 40, 0); sg.addColorStop(0, '#e6efe9'); sg.addColorStop(1, '#7c8f86'); g.fillStyle = sg; g.beginPath(); g.moveTo(i, h); g.lineTo(i + 30, h); g.lineTo(i + 30 + h * 0.6, 0); g.lineTo(i + h * 0.6, 0); g.fill(); } g.restore();
      g.fillStyle = '#e6efe9'; g.font = '700 22px Oswald, sans-serif'; g.textAlign = 'center'; g.fillText('SERIES  TWO  ·  COLLECTOR', w / 2, h * 0.27);
    } else if (v === 'pre1') { // silver hologram foil
      const gr = g.createLinearGradient(0, 0, w, h); ['#f5f7fa', '#9aa3ad', '#eef1f5', '#7d8794', '#e3e7ec'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.save(); g.globalAlpha = 0.28; const hg = g.createLinearGradient(0, h, w, 0); ['#ff6b9d', '#ffd36b', '#6bffb0', '#6bc8ff', '#b06bff', '#ff6b9d'].forEach((c, i, a) => hg.addColorStop(i / (a.length - 1), c)); g.fillStyle = hg;
      for (let y = 0; y < h; y += 22) g.fillRect(0, y, w, 11); g.restore();
      g.fillStyle = th.c; g.fillRect(0, h * 0.52 - 70, w, 104);
    } else if (v === 'pre2') { // black satin, gold border, quilted diamonds, gold seal
      g.fillStyle = th.b; g.fillRect(0, 0, w, h);
      g.save(); g.strokeStyle = 'rgba(184,134,11,.18)'; g.lineWidth = 1; for (let i = -h; i < w + h; i += 34) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); } g.restore();
      const gg = g.createLinearGradient(0, 0, w, 0); gg.addColorStop(0, '#8a6410'); gg.addColorStop(0.5, '#ffe9a8'); gg.addColorStop(1, '#8a6410');
      g.strokeStyle = gg; g.lineWidth = 8; g.strokeRect(18, 52, w - 36, h - 104); g.lineWidth = 2; g.strokeRect(32, 66, w - 64, h - 132);
      g.fillStyle = gg; g.font = '700 20px Oswald, sans-serif'; g.textAlign = 'center'; g.fillText('PREMIUM  EDITION', w / 2, h * 0.26);
    } else if (v === 'pre3') { // burgundy collector with gold filigree and cream oval
      g.fillStyle = th.b; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 50; y < h - 50; y += 6) g.fillRect(0, y, w, 2);
      g.strokeStyle = th.c; g.lineWidth = 3; g.strokeRect(22, 56, w - 44, h - 112);
      [[40, 74, 1, 1], [w - 40, 74, -1, 1], [40, h - 74, 1, -1], [w - 40, h - 74, -1, -1]].forEach(([x, y, sx, sy]) => { g.beginPath(); for (let k = 0; k < 3; k++) { g.moveTo(x, y + sy * k * 10); g.quadraticCurveTo(x + sx * 40, y + sy * k * 10, x + sx * 40, y + sy * (k * 10 + 40)); } g.stroke(); });
      g.beginPath(); g.ellipse(w / 2, h * 0.4, 120, 98, 0, 0, Math.PI * 2); g.fillStyle = th.a; g.fill(); g.lineWidth = 5; g.strokeStyle = th.c; g.stroke();
    }
  }

  function drawPack2(g, w, h, th, opts) {
    const st = th.pk, cx = w / 2;
    // body
    if (st === 'wax') {
      g.fillStyle = th.a; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 34) for (let x = (y / 34) % 2 ? 17 : 0; x < w; x += 34) {   // repeating diamond print, like a wax wrapper
        g.fillStyle = (x + y) % 68 ? 'rgba(200,48,43,.22)' : 'rgba(30,60,124,.18)';
        g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 7, y); g.lineTo(x, y + 7); g.lineTo(x - 7, y); g.fill();
      }
      g.fillStyle = th.b; g.fillRect(0, h * 0.84, w, h * 0.06); g.fillStyle = th.c; g.fillRect(0, h * 0.9, w, h * 0.02);
      for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .08})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 1); }
    } else if (st === 'retail') {
      g.fillStyle = th.b; g.fillRect(0, 0, w, h);
      g.fillStyle = th.a; g.beginPath(); g.moveTo(0, h * 0.52); g.lineTo(w, h * 0.36); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = th.c; g.beginPath(); g.moveTo(0, h * 0.5); g.lineTo(w, h * 0.34); g.lineTo(w, h * 0.37); g.lineTo(0, h * 0.53); g.fill();
      g.fillStyle = 'rgba(255,255,255,.07)'; for (let x = -h; x < w; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, 0); g.lineTo(x + 8 + h * .3, h); g.lineTo(x + h * .3, h); g.fill(); }
    } else if (st === 'hobby') {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a5694'); gr.addColorStop(0.45, th.b); gr.addColorStop(0.55, '#3e6fb0'); gr.addColorStop(1, '#0a1f42');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.06)'; for (let x = 0; x < w; x += 10) g.fillRect(x, 0, 2, h);
      const gold = g.createLinearGradient(0, 0, w, 0); gold.addColorStop(0, '#8a6410'); gold.addColorStop(.5, '#ffe9a8'); gold.addColorStop(1, '#8a6410');
      g.fillStyle = gold; g.fillRect(0, h * 0.83, w, 8); g.fillRect(0, h * 0.86, w, 3);
    } else if (st === 'premium') {
      g.fillStyle = th.b; g.fillRect(0, 0, w, h);
      const holo = g.createLinearGradient(0, h, w, 0);
      ['#ff5f9e', '#ffcf5a', '#6dffb1', '#5ac8ff', '#a86bff', '#ff5f9e', '#ffcf5a'].forEach((col, i, arr) => holo.addColorStop(i / (arr.length - 1), col));
      g.save(); g.globalAlpha = 0.55; g.fillStyle = holo; g.fillRect(0, 0, w, h); g.restore();
      g.save(); g.globalAlpha = 0.35; g.fillStyle = th.b; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 3); g.restore();
      g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
      for (let i = -h; i < w + h; i += 26) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
      const gold = g.createLinearGradient(0, 0, w, h); gold.addColorStop(0, '#7a560f'); gold.addColorStop(.35, '#ffe9a8'); gold.addColorStop(.55, '#c99a1c'); gold.addColorStop(.8, '#fff6c8'); gold.addColorStop(1, '#7a560f');
      g.strokeStyle = gold; g.lineWidth = 7; g.strokeRect(16, 50, w - 32, h - 100); g.lineWidth = 2; g.strokeRect(28, 62, w - 56, h - 124);
    }
    // crimps
    const crimp = y0 => { g.fillStyle = th.edge; g.fillRect(0, y0, w, 40); g.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 0; x < w; x += 8) g.fillRect(x, y0 + 3, 3, 34); };
    crimp(0); crimp(h - 40);
    // tear line + badge
    const ty = Math.round(h * 0.17), dark = st === 'wax';
    g.save(); g.setLineDash([12, 8]); g.lineWidth = 3; g.strokeStyle = dark ? 'rgba(42,26,14,.75)' : 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(14, ty); g.lineTo(w - 14, ty); g.stroke(); g.restore();
    g.fillStyle = dark ? 'rgba(42,26,14,.7)' : 'rgba(255,255,255,.8)'; g.font = '600 15px Oswald, sans-serif'; g.textAlign = 'left'; g.fillText('TEAR HERE', 18, ty - 8);
    g.textAlign = 'center'; rr(g, w - 104, 52, 86, 40, 8); g.fillStyle = 'rgba(0,0,0,.55)'; g.fill();
    g.fillStyle = '#fff'; g.font = '700 24px Oswald, sans-serif'; g.fillText(opts.badge || '', w - 61, 81);
    // arched wordmark
    const word = 'BASEROGUE', R0 = 520, cy = h * 0.29 + R0, span = 0.78;
    let wfill = st === 'wax' ? th.b : th.a;
    if (st === 'hobby') { const sg = g.createLinearGradient(0, h * .2, 0, h * .33); sg.addColorStop(0, '#ffffff'); sg.addColorStop(.5, '#aeb9c6'); sg.addColorStop(.55, '#e6ebf1'); sg.addColorStop(1, '#8794a4'); wfill = sg; }
    if (st === 'premium') { const gg = g.createLinearGradient(0, h * .2, 0, h * .33); gg.addColorStop(0, '#fff6c8'); gg.addColorStop(.45, '#e2b33c'); gg.addColorStop(.55, '#fff1b0'); gg.addColorStop(1, '#8a6410'); wfill = gg; }
    g.font = '78px "Alfa Slab One", serif'; g.lineJoin = 'round';
    [...word].forEach((ch, i) => {
      const a = -span / 2 + span * (i / (word.length - 1));
      g.save(); g.translate(cx + Math.sin(a) * R0, cy - Math.cos(a) * R0); g.rotate(a);
      g.lineWidth = 16; g.strokeStyle = (st === 'wax' || st === 'retail') ? th.c : '#000'; g.strokeText(ch, 0, 0);
      g.lineWidth = 6; g.strokeStyle = st === 'wax' ? '#fff8e6' : st === 'retail' ? '#ffffff' : 'rgba(0,0,0,.6)'; g.strokeText(ch, 0, 0);
      g.fillStyle = wfill; g.fillText(ch, 0, 0);
      if (st === 'hobby' || st === 'premium') {   // embossed: light edge on top, dark edge below
        g.save(); g.globalCompositeOperation = 'source-atop'; g.restore();
        g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.85)'; g.strokeText(ch, -1, -1.5);
        g.strokeStyle = 'rgba(0,0,0,.45)'; g.strokeText(ch, 1.5, 2);
      }
      g.restore();
    });
    // ribbon
    const ry = h * 0.36;
    g.fillStyle = st === 'wax' ? th.c : st === 'retail' ? '#ffffff' : st === 'hobby' ? th.c : '#000';
    g.beginPath(); g.moveTo(40, ry); g.lineTo(w - 40, ry); g.lineTo(w - 58, ry + 26); g.lineTo(w - 40, ry + 52); g.lineTo(40, ry + 52); g.lineTo(58, ry + 26); g.closePath(); g.fill();
    if (st === 'premium') { g.strokeStyle = '#d4a017'; g.lineWidth = 2; g.stroke(); }
    g.fillStyle = st === 'wax' ? '#fff8e6' : st === 'retail' ? th.b : st === 'hobby' ? '#081a36' : '#ffe27a';
    g.font = '700 28px Oswald, sans-serif'; g.fillText('BASEBALL CARDS', cx, ry + 37);
    // emblem: ball + crossed bats
    const rr0 = 66;
    g.save(); g.translate(cx, h * 0.57);
    [-0.6, 0.6].forEach(a => { g.save(); g.rotate(a); const bg = g.createLinearGradient(-10, 0, 10, 0); bg.addColorStop(0, '#8b5a2b'); bg.addColorStop(.5, '#d9a066'); bg.addColorStop(1, '#7a4a20'); g.fillStyle = bg;
      g.beginPath(); g.moveTo(-6, 120); g.lineTo(6, 120); g.lineTo(13, -115); g.quadraticCurveTo(0, -132, -13, -115); g.closePath(); g.fill(); g.fillStyle = '#3a2410'; g.fillRect(-7, 108, 14, 14); g.restore(); });
    g.beginPath(); g.arc(0, 0, rr0 + 8, 0, Math.PI * 2); g.fillStyle = st === 'premium' ? '#d4a017' : st === 'hobby' ? '#dfe6ee' : th.c; g.fill();
    g.beginPath(); g.arc(0, 0, rr0, 0, Math.PI * 2); g.fillStyle = '#f4efe2'; g.fill();
    g.strokeStyle = '#c8302b'; g.lineWidth = 4;
    g.beginPath(); g.arc(-rr0 * 1.25, 0, rr0 * 0.86, -0.95, 0.95); g.stroke(); g.beginPath(); g.arc(rr0 * 1.25, 0, rr0 * 0.86, Math.PI - 0.95, Math.PI + 0.95); g.stroke();
    g.lineWidth = 2.5; for (let k = -3; k <= 3; k++) { const yy = k * 14; [-1, 1].forEach(sd => { const xx = sd * (rr0 * 0.42 + Math.abs(k) * 2); g.beginPath(); g.moveTo(xx - 5, yy - 4); g.lineTo(xx + 5, yy + 4); g.stroke(); }); }
    g.restore();
    // starburst / seal
    const burst = (x, y, r1, r2, n, fill, stroke, l1, l2, ink, rot) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); for (let k = 0; k < n * 2; k++) { const rad = k % 2 ? r1 : r2, a = k * Math.PI / n; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.closePath();
      g.fillStyle = fill; g.fill(); g.lineWidth = 3; g.strokeStyle = stroke; g.stroke();
      g.fillStyle = ink; g.font = '700 19px Oswald, sans-serif'; g.fillText(l1, 0, l2 ? -3 : 7); if (l2) { g.font = '700 16px Oswald, sans-serif'; g.fillText(l2, 0, 16); } g.restore();
    };
    if (st === 'wax') burst(w - 96, h * 0.62, 44, 58, 14, '#ffd23f', th.b, 'WITH', 'GUM!', th.b, 0.2);
    if (st === 'retail') burst(96, h * 0.63, 46, 62, 14, '#ffffff', th.b, 'VALUE', 'PACK!', th.b, -0.2);
    if (st === 'hobby') { const gold = g.createRadialGradient(w - 104, h * 0.62, 4, w - 96, h * 0.63, 56); gold.addColorStop(0, '#fff6c8'); gold.addColorStop(.7, '#d4a52c'); gold.addColorStop(1, '#7a560f'); burst(w - 96, h * 0.63, 46, 54, 20, gold, '#5c3f08', 'HOBBY', 'EDITION', '#2e1d04', 0.15); }
    if (st === 'premium') { const gold = g.createRadialGradient(80, h * 0.6, 4, 90, h * 0.62, 60); gold.addColorStop(0, '#fff6c8'); gold.addColorStop(.6, '#e2b33c'); gold.addColorStop(1, '#7a560f'); burst(92, h * 0.63, 50, 58, 24, gold, '#5c3f08', 'LIMITED', 'PREMIUM', '#2e1d04', -0.15); }
    // serial number and gem
    if (st === 'hobby' || st === 'premium') {
      const ser = st === 'premium' ? 'No. ' + String(1 + Math.floor(Math.random() * 250)).padStart(3, '0') + ' / 250' : 'No. ' + String(1 + Math.floor(Math.random() * 5000)).padStart(4, '0') + ' / 5000';
      g.font = '600 17px "Courier New", monospace'; g.fillStyle = st === 'premium' ? '#ffe27a' : '#e6ebf1'; g.fillText(ser, cx, h * 0.735);
    }
    if (st === 'premium') {    // red gem at the top center
      const gx = cx, gy = 98; g.save(); g.translate(gx, gy);
      g.beginPath(); g.moveTo(0, -18); g.lineTo(16, -4); g.lineTo(10, 16); g.lineTo(-10, 16); g.lineTo(-16, -4); g.closePath();
      const gg2 = g.createLinearGradient(-16, -18, 16, 16); gg2.addColorStop(0, '#ff8aa8'); gg2.addColorStop(.5, '#d0103a'); gg2.addColorStop(1, '#5a0016');
      g.fillStyle = gg2; g.fill(); g.lineWidth = 3; g.strokeStyle = '#e2b33c'; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(-6, -8); g.lineTo(0, -14); g.lineTo(4, -6); g.closePath(); g.fill(); g.restore();
    }
    // tier name + fine print
    g.font = '700 32px Oswald, sans-serif';
    g.fillStyle = (st === 'wax' || st === 'retail') ? th.c : st === 'hobby' ? '#ffe9a8' : '#ffe27a';
    if (st === 'hobby' || st === 'premium') { g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6; }
    g.fillText(String(opts.tagline || '').toUpperCase(), cx, h * 0.8); g.shadowBlur = 0;
    g.font = '500 17px Oswald, sans-serif'; g.fillStyle = st === 'wax' ? '#fff8e6' : 'rgba(255,255,255,.85)';
    g.fillText(opts.fine || '', cx, h - 60);
  }

  function drawFront(c, th, opts) {
    if (th.pk) { drawPack2(c.getContext('2d'), TEX_W, TEX_H, th, opts); return; }
    const tagline = opts.tagline, badge = opts.badge || `R${opts.round}/9`, fine = opts.fine || 'SERIES 2.0  ·  3 PLAYER CARDS';
    const g = c.getContext('2d'), w = TEX_W, h = TEX_H;
    g.clearRect(0, 0, w, h);
    // body
    if (th.wax) {
      g.fillStyle = th.a; g.fillRect(0, 0, w, h);
      for (let i = -h; i < w + h; i += 120) {          // vintage diagonal wax-pack bands
        g.fillStyle = th.b; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 46, 0); g.lineTo(i + 46 - h * 0.55, h); g.lineTo(i - h * 0.55, h); g.fill();
        g.fillStyle = th.c; g.beginPath(); g.moveTo(i + 58, 0); g.lineTo(i + 72, 0); g.lineTo(i + 72 - h * 0.55, h); g.lineTo(i + 58 - h * 0.55, h); g.fill();
      }
      g.fillStyle = 'rgba(244,231,198,.55)'; g.fillRect(0, 0, w, h);
    } else if (th.rainbow) {
      const gr = g.createLinearGradient(0, 0, w, h);
      ['#ff6b9d', '#ffb86b', '#fff36b', '#6bffb0', '#6bc8ff', '#a96bff', '#ff6bd5'].forEach((col, i, a) => gr.addColorStop(i / (a.length - 1), col));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(30,27,75,.28)'; g.fillRect(0, 0, w, h);
    } else if (th.v) {
      drawVariant(g, w, h, th);
    } else if (th.retail) {
      // supermarket pack: loud yellow with red and navy racing stripes
      g.fillStyle = th.a; g.fillRect(0, 0, w, h);
      g.fillStyle = th.b; g.beginPath(); g.moveTo(0, h * 0.78); g.lineTo(w, h * 0.5); g.lineTo(w, h * 0.66); g.lineTo(0, h * 0.94); g.fill();
      g.fillStyle = th.c; g.beginPath(); g.moveTo(0, h * 0.95); g.lineTo(w, h * 0.67); g.lineTo(w, h * 0.72); g.lineTo(0, h); g.fill();
      g.fillStyle = 'rgba(230,57,70,.18)'; for (let y = 60; y < h * 0.45; y += 26) g.fillRect(0, y, w, 8);
    } else if (th.hobby) {
      // collector pack: deep navy, matte, thin gold rules and a gold frame
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#22345c'); gr.addColorStop(0.5, th.b); gr.addColorStop(1, th.c);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = th.a; g.lineWidth = 3; rr(g, 22, 54, w - 44, h - 108, 10); g.stroke();
      g.lineWidth = 1; rr(g, 30, 62, w - 60, h - 124, 8); g.stroke();
      g.fillStyle = 'rgba(233,196,106,.08)'; for (let y = 70; y < h - 70; y += 18) g.fillRect(34, y, w - 68, 1);
    } else if (th.premium) {
      // premium: black with a gold sunburst and a holographic sheen across
      g.fillStyle = th.b; g.fillRect(0, 0, w, h);
      const cx0 = w / 2, cy0 = h * 0.4;
      g.save(); g.globalAlpha = 0.22; g.fillStyle = th.c;
      for (let k = 0; k < 48; k += 2) { const a0 = k * Math.PI / 24, a1 = (k + 1) * Math.PI / 24; g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx0 + Math.cos(a0) * 700, cy0 + Math.sin(a0) * 700); g.lineTo(cx0 + Math.cos(a1) * 700, cy0 + Math.sin(a1) * 700); g.fill(); }
      g.restore();
      const hg = g.createLinearGradient(0, 0, w, h);
      ['rgba(255,107,157,.0)', 'rgba(255,107,157,.18)', 'rgba(107,200,255,.18)', 'rgba(255,243,107,.2)', 'rgba(169,107,255,.0)'].forEach((col, i, a) => hg.addColorStop(i / (a.length - 1), col));
      g.fillStyle = hg; g.fillRect(0, 0, w, h);
      g.strokeStyle = th.c; g.lineWidth = 6; rr(g, 16, 50, w - 32, h - 100, 12); g.stroke();
      g.strokeStyle = th.a; g.lineWidth = 2; rr(g, 26, 60, w - 52, h - 120, 9); g.stroke();
    } else {
      const gr = g.createLinearGradient(0, 0, w * 0.5, h);
      gr.addColorStop(0, th.b); gr.addColorStop(0.22, th.a); gr.addColorStop(0.45, th.b); gr.addColorStop(0.75, th.c); gr.addColorStop(1, th.b);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    // pinstripes in the foil
    g.save(); g.globalAlpha = th.wax ? 0.05 : 0.09; g.strokeStyle = '#fff'; g.lineWidth = 2;
    for (let i = -h; i < w; i += 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
    g.restore();
    // crimped seals top and bottom
    const crimp = (y0) => {
      g.fillStyle = th.edge; g.fillRect(0, y0, w, 40);
      g.fillStyle = 'rgba(255,255,255,.18)';
      for (let x = 0; x < w; x += 8) g.fillRect(x, y0 + 3, 3, 34);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y0 === 0 ? 38 : y0, w, 2);
    };
    crimp(0); crimp(h - 40);
    // tear line
    const ty = Math.round(h * 0.17);
    g.save(); g.setLineDash([12, 8]); g.lineWidth = 3;
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.moveTo(14, ty + 2); g.lineTo(w - 14, ty + 2); g.stroke();
    g.strokeStyle = th.wax ? 'rgba(42,26,14,.8)' : 'rgba(255,255,255,.9)'; g.beginPath(); g.moveTo(14, ty); g.lineTo(w - 14, ty); g.stroke(); g.restore();
    g.fillStyle = th.wax ? 'rgba(42,26,14,.7)' : 'rgba(255,255,255,.8)';
    g.font = '600 15px Oswald, sans-serif'; g.textAlign = 'left'; g.fillText('✂  TEAR HERE', 18, ty - 8);
    // round badge
    g.textAlign = 'center';
    rr(g, w - 104, 52, 86, 40, 8); g.fillStyle = 'rgba(0,0,0,.55)'; g.fill();
    g.fillStyle = '#fff'; g.font = '700 24px Oswald, sans-serif'; g.fillText(badge, w - 61, 81);
    // sunburst and baseball emblem
    const cx = w / 2, cy = h * 0.4, r = 58;
    g.save(); g.globalAlpha = th.wax ? 0.12 : 0.16; g.fillStyle = th.wax ? '#1e3c7c' : '#000';
    for (let k = 0; k < 24; k += 2) { const a0 = k * Math.PI / 12, a1 = (k + 1) * Math.PI / 12; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * 420, cy + Math.sin(a0) * 420); g.lineTo(cx + Math.cos(a1) * 420, cy + Math.sin(a1) * 420); g.fill(); }
    g.restore();
    g.beginPath(); g.arc(cx, cy, r + 12, 0, Math.PI * 2); g.fillStyle = th.edge; g.fill();
    g.lineWidth = 4; g.strokeStyle = th.wax ? '#c8302b' : th.a; g.stroke();
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = '#efe8d6'; g.fill();
    g.strokeStyle = '#c8302b'; g.lineWidth = 5;
    g.beginPath(); g.arc(cx - r * 1.25, cy, r * 0.85, -0.95, 0.95); g.stroke();
    g.beginPath(); g.arc(cx + r * 1.25, cy, r * 0.85, Math.PI - 0.95, Math.PI + 0.95); g.stroke();
    g.lineWidth = 3;
    for (let k = -3; k <= 3; k++) {
      const yy = cy + k * 13;
      [-1, 1].forEach(sd => { const xx = cx + sd * (r * 0.42 + Math.abs(k) * 2); g.beginPath(); g.moveTo(xx - 6, yy - 4); g.lineTo(xx + 6, yy + 4); g.stroke(); });
    }
    // brand on a ribbon
    g.fillStyle = 'rgba(0,0,0,.42)'; g.fillRect(0, h * 0.62 - 62, w, 82);
    g.fillStyle = th.wax ? '#c8302b' : th.a; g.fillRect(0, h * 0.62 - 62, w, 4); g.fillRect(0, h * 0.62 + 16, w, 4);
    g.font = '64px "Alfa Slab One", serif'; g.lineJoin = 'round';
    g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText('BASEROGUE', cx, h * 0.62);
    g.fillStyle = th.wax ? '#c8302b' : '#ffffff'; g.fillText('BASEROGUE', cx, h * 0.62);
    // tagline
    g.font = '600 30px Oswald, sans-serif';
    rr(g, 46, h * 0.665, w - 92, 50, 25); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
    g.fillStyle = th.wax ? '#f4e7c6' : (th.tier >= 4 ? '#ffe27a' : '#ffffff');
    g.fillText(String(tagline || '').toUpperCase().slice(0, 26), cx, h * 0.665 + 35);
    // stickers of the 162-0 packs
    if (th.retail) {   // starburst "VALUE PACK!"
      const sx = w - 92, sy = h * 0.27; g.save(); g.translate(sx, sy); g.rotate(0.22);
      g.beginPath(); for (let k = 0; k < 28; k++) { const rad = k % 2 ? 46 : 62, a = k * Math.PI / 14; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.closePath();
      g.fillStyle = '#e63946'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
      g.fillStyle = '#fff'; g.font = '700 21px Oswald, sans-serif'; g.fillText('VALUE', 0, -4); g.fillText('PACK!', 0, 20); g.restore();
    } else if (th.hobby) {  // gold ribbon
      g.fillStyle = th.a; g.fillRect(0, h * 0.18 + 22, w, 30);
      g.fillStyle = th.c; g.font = '700 19px Oswald, sans-serif'; g.fillText('★  COLLECTOR EDITION  ★', cx, h * 0.18 + 44);
    } else if (th.premium) { // gold seal
      const sx = 86, sy = h * 0.27; g.save(); g.translate(sx, sy); g.rotate(-0.18);
      g.beginPath(); for (let k = 0; k < 40; k++) { const rad = k % 2 ? 50 : 58, a = k * Math.PI / 20; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.closePath();
      const sg = g.createRadialGradient(-12, -12, 4, 0, 0, 60); sg.addColorStop(0, '#fff6c8'); sg.addColorStop(0.6, '#e2b33c'); sg.addColorStop(1, '#7a560f');
      g.fillStyle = sg; g.fill(); g.strokeStyle = '#5c3f08'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#2e1d04'; g.font = '700 17px Oswald, sans-serif'; g.fillText('LIMITED', 0, -2); g.font = '600 13px Oswald, sans-serif'; g.fillText('PREMIUM', 0, 16); g.restore();
    }
    // fine print
    g.font = '500 18px Oswald, sans-serif'; g.fillStyle = th.wax ? 'rgba(42,26,14,.8)' : 'rgba(255,255,255,.85)';
    g.fillText(fine, cx, h - 64);
  }

  function drawBack(c, th) {
    const g = c.getContext('2d'), w = TEX_W, h = TEX_H;
    g.fillStyle = th.wax ? th.a : th.c; g.fillRect(0, 0, w, h);
    g.fillStyle = th.edge; g.fillRect(0, 0, w, 40); g.fillRect(0, h - 40, w, 40);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(w / 2 - 14, 40, 28, h - 80);    // the glued seam
    g.textAlign = 'center'; g.fillStyle = th.wax ? 'rgba(42,26,14,.7)' : 'rgba(255,255,255,.6)';
    g.font = '600 22px Oswald, sans-serif'; g.fillText('BASEROGUE TRADING CARDS', w / 2, h * 0.45);
    g.font = '400 16px Oswald, sans-serif'; g.fillText('Collect all the legends · 1871 – 2025', w / 2, h * 0.5);
  }

  // pillow-shaped section of the wrapper between two heights (world y), flat at the crimps
  function section(T, y0, y1) {
    const segs = Math.max(2, Math.round((y1 - y0) / H * 26));
    const geo = new T.PlaneGeometry(W, y1 - y0, 22, segs);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    const crimpY = H / 2 - 0.13;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i) + (y0 + y1) / 2;
      const u = Math.max(0, 1 - Math.pow(Math.abs(2 * x / W), 2.4));
      const v = Math.abs(y) >= crimpY ? 0 : Math.max(0, 1 - Math.pow(Math.abs(y) / crimpY, 2.4));
      pos.setXYZ(i, x, y, BULGE * Math.sqrt(u * v));
      uv.setY(i, (y + H / 2) / H);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function material(T, map, th, transparent) {
    return new T.MeshPhongMaterial({
      map, envMap: R.env, combine: T.MixOperation, reflectivity: th.refl,
      shininess: th.metal === 2 ? 45 : th.metal ? 40 : (th.wax || th.matte) ? 20 : 70, specular: th.metal === 2 ? 0x2a2a2a : th.metal ? 0x222222 : (th.wax || th.matte) ? 0x1a1a1a : 0x444444, transparent: !!transparent, side: T.FrontSide
    });
  }

  function disposePack() {
    if (!S || !S.root) return;
    S.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    if (S.tex) S.tex.forEach(t => t.dispose());
    R.scene.remove(S.root);
  }

  function build(pack, opts) {
    const T = window.THREE;
    if (!setupRenderer()) return false;
    if (S && S.pack !== pack) stopLoop();
    disposePack();
    const th = Object.assign({}, THEMES[({ common: 'wax2', retail: 'retail2', hobby: 'hobby2', premium: 'premium2' })[opts.theme] || opts.theme] || THEMES.random, opts.tier != null ? { tier: opts.tier } : {});
    const front = document.createElement('canvas'); front.width = TEX_W; front.height = TEX_H;
    const back = document.createElement('canvas'); back.width = TEX_W; back.height = TEX_H;
    drawFront(front, th, opts); drawBack(back, th);
    const tf = new T.CanvasTexture(front), tb = new T.CanvasTexture(back);
    [tf, tb].forEach(t => { t.anisotropy = 4; });
    if (document.fonts && document.fonts.load) {     // redraw once the print fonts are in
      Promise.all([document.fonts.load('64px "Alfa Slab One"'), document.fonts.load('600 30px Oswald')])
        .then(() => { drawFront(front, th, opts); drawBack(back, th); tf.needsUpdate = true; tb.needsUpdate = true; }).catch(() => {});
    }
    const root = new T.Group();
    const bodyGeo = section(T, -H / 2, TEAR_Y), stripGeo = section(T, TEAR_Y, H / 2);
    const mk = (geo, map, back, transparent) => {
      const g2 = geo.clone(); if (back) g2.rotateY(Math.PI);
      return new T.Mesh(g2, material(T, map, th, transparent));
    };
    const body = new T.Group(); body.add(mk(bodyGeo, tf, false, true), mk(bodyGeo, tb, true, true));
    // finish layer: a moving sheen that follows the tilt (the material is what sells the tier)
    let sheen = null;
    const SHEEN = { retail: [0.10, 'gloss'], hobby: [0.22, 'silver'], premium: [0.42, 'holo'] }[th.pk];
    if (SHEEN) {
      const sc = document.createElement('canvas'); sc.width = 256; sc.height = 256;
      const sg = sc.getContext('2d'), grd = sg.createLinearGradient(0, 0, 256, 256);
      const stops = SHEEN[1] === 'holo' ? ['#000', '#ff4f9a', '#ffd25a', '#000', '#5affb0', '#4fc3ff', '#000', '#a35cff', '#000']
        : SHEEN[1] === 'silver' ? ['#000', '#000', '#9fb4d0', '#ffffff', '#9fb4d0', '#000', '#000', '#000', '#000']
        : ['#000', '#000', '#000', '#ffffff', '#000', '#000', '#000', '#000', '#000'];
      stops.forEach((c, i) => grd.addColorStop(i / (stops.length - 1), c));
      sg.fillStyle = grd; sg.fillRect(0, 0, 256, 256);
      const st = new T.CanvasTexture(sc); st.wrapS = st.wrapT = T.RepeatWrapping;
      const sm = new T.MeshBasicMaterial({ map: st, transparent: true, opacity: SHEEN[0], blending: T.AdditiveBlending, depthWrite: false });
      const sgeo = bodyGeo.clone(); sgeo.translate(0, 0, 0.004);
      sm.userData.o0 = SHEEN[0]; sheen = new T.Mesh(sgeo, sm); body.add(sheen);
    }
    const strip = new T.Group(); strip.add(mk(stripGeo, tf, false, true), mk(stripGeo, tb, true, true));
    const pivot = new T.Group(); pivot.position.set(-W / 2, TEAR_Y, 0);
    strip.position.set(W / 2, -TEAR_Y, 0); pivot.add(strip);
    root.add(body, pivot);
    bodyGeo.dispose(); stripGeo.dispose();
    R.scene.add(root);
    R.inner.color.set(th.glow); R.inner.intensity = 0;
    S = { pack, th, root, body, pivot, strip, sheen, tex: [tf, tb], tilt: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, open: null, t0: performance.now() };

    // the canvas and a glow behind it live inside the pack element
    const cvs = R.renderer.domElement;
    let glow = pack.querySelector('.d3-glow');
    if (!glow) { glow = document.createElement('div'); glow.className = 'd3-glow'; pack.prepend(glow); }
    pack.style.setProperty('--d3g', th.glow);
    if (pack.dataset.glow) {   // caller asked for the color of the best card inside
      glow.style.setProperty('--d3g', pack.dataset.glow); pack.style.setProperty('--d3g', pack.dataset.glow);
      glow.style.setProperty('opacity', pack.dataset.glowOp || '.4', 'important');
      glow.style.setProperty('animation', 'd3Breath 2.2s ease-in-out infinite', 'important');
    }
    pack.appendChild(cvs);
    pack.classList.remove('d3-pk-wax', 'd3-pk-retail', 'd3-pk-hobby', 'd3-pk-premium');
    pack.classList.add('d3-pack-live', `d3-tier-${th.tier}`);
    if (th.pk) pack.classList.add('d3-pk-' + th.pk);
    sizeTo(pack);
    if (!pack._d3bound) {
      pack._d3bound = true;
      pack.addEventListener('pointermove', e => {
        if (!S || S.pack !== pack) return;
        const b = pack.getBoundingClientRect();
        S.aim.x = ((e.clientX - b.left) / b.width - 0.5) * 2;
        S.aim.y = ((e.clientY - b.top) / b.height - 0.5) * 2;
      });
      pack.addEventListener('pointerleave', () => { if (S && S.pack === pack) { S.aim.x = 0; S.aim.y = 0; } });
    }
    startLoop();
    return true;
  }

  function sizeTo(pack) {
    const b = pack.getBoundingClientRect();     // the canvas overhangs the pack (see .d3-canvas) so the strip can fly
    const w = Math.max(160, Math.round(b.width)) + 2 * PAD_X, h = Math.max(220, Math.round(b.height)) + 2 * PAD_Y;
    R.renderer.setSize(w, h, true);
    R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
  }

  // ── animation loop (rAF, with a timer watchdog for tabs that do not paint) ──
  let raf = 0, watch = 0, last = 0;
  function startLoop() {
    stopLoop();
    const tick = now => { raf = requestAnimationFrame(tick); step(now); };
    raf = requestAnimationFrame(tick);
    watch = setInterval(() => { const n = performance.now(); if (n - last > 70) step(n); }, 45);
  }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); if (watch) clearInterval(watch); raf = 0; watch = 0; }

  const O_isOpen = () => !!(S && S.open);
  const ease = p => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);

  function step(now) {
    last = now;
    if (!S || !R) return;
    if (!S.pack.isConnected) { stopLoop(); return; }
    const t = (now - S.t0) / 1000;
    // lean toward the cursor, breathe a little
    S.tilt.x += (S.aim.y * 0.32 - S.tilt.x) * 0.12;
    S.tilt.y += (S.aim.x * 0.48 - S.tilt.y) * 0.12;
    const root = S.root;
    root.rotation.set(S.tilt.x, S.tilt.y + Math.sin(t * 0.9) * 0.06, Math.sin(t * 0.7) * 0.015);
    root.position.set(0, Math.sin(t * 1.6) * 0.05, 0);
    root.scale.setScalar(1);
    R.cursor.position.set(S.aim.x * 2.4, -S.aim.y * 2.4, 3.2);
    if (S.sheen) { const m = S.sheen.material.map; m.offset.set(S.tilt.y * 0.9 + t * 0.04, S.tilt.x * 0.6 + t * 0.02); }
    if (S.th.pk === 'premium' && !O_isOpen()) root.scale.setScalar(1.08);
    const O = S.open;
    if (O) {
      const e = now - O.t0;
      const tier = S.th.tier;
      if (e < O.shake) {                          // build-up
        const k = e / O.shake;
        const amp = (0.025 + 0.07 * k) * (1 + tier * 0.22);
        root.rotation.z += (Math.random() - 0.5) * amp * 2;
        root.position.x += (Math.random() - 0.5) * amp * 0.9;
        root.scale.setScalar(1 + 0.06 * k);
        R.inner.intensity = 0.3 + 1.6 * k * (0.6 + tier * 0.15);
        S.pack.style.setProperty('--d3k', k.toFixed(3));
      } else if (e < O.shake + O.tear) {          // the strip is ripped off
        if (!O.ripped) { O.ripped = true; rip(S.pack, S.th); }
        const p = ease((e - O.shake) / O.tear);
        root.scale.setScalar(1.06);
        S.pivot.rotation.set(-0.9 * p, 0.5 * p, 0.9 * p + 0.8 * p * p);
        S.pivot.position.set(-W / 2 + 1.5 * p, TEAR_Y + 0.45 * p, 0.9 * p);
        S.strip.children.forEach(m => { m.material.opacity = 1 - Math.max(0, (p - 0.72) / 0.28); });
        R.inner.intensity = 2.4 * (1 - p * 0.3);
      } else if (e < O.total) {                   // the wrapper drops away
        const p = ease((e - O.shake - O.tear) / O.drop);
        S.pivot.visible = false;
        root.scale.setScalar(1.06 - 0.1 * p);
        S.body.position.set(0, -1.9 * p, -0.3 * p);
        S.body.rotation.set(0.7 * p, 0, -0.12 * p);
        S.body.children.forEach(m => { m.material.opacity = (m === S.sheen ? m.material.userData.o0 || 0.3 : 1) * (1 - p); });
        R.inner.intensity = 2 * (1 - p);
      }
    }
    try { R.renderer.render(R.scene, R.camera); } catch (err) { broken = true; stopLoop(); }
  }

  // ── tear effects: light burst, foil confetti, paper rip ──
  function rip(pack, th) {
    pack.classList.add('d3-ripped');
    const n = 10 + th.tier * 4;
    for (let i = 0; i < n; i++) {
      const sp = document.createElement('span');
      sp.className = 'd3-spark';
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const d = 60 + Math.random() * (70 + th.tier * 20);
      sp.style.setProperty('--sx', `${Math.cos(a) * d}px`);
      sp.style.setProperty('--sy', `${Math.sin(a) * d}px`);
      sp.style.setProperty('--sc', Math.random() < 0.5 ? (pack.dataset.glow || th.glow) : '#ffffff');
      sp.style.animationDelay = `${Math.random() * 120}ms`;
      pack.appendChild(sp);
    }
    sound('rip', th.tier);
  }

  let actx = null;
  function sound(kind, tier) {
    try {
      if (window.AudioManager && typeof window.AudioManager.isMuted === 'function' && window.AudioManager.isMuted()) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC();
      const now = actx.currentTime;
      const noise = (dur, f0, f1, vol, q, at = 0) => {
        const len = Math.floor(actx.sampleRate * dur), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.random());
        const src = actx.createBufferSource(); src.buffer = buf;
        const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
        bp.frequency.setValueAtTime(f0, now + at); bp.frequency.exponentialRampToValueAtTime(f1, now + at + dur);
        const gn = actx.createGain(); gn.gain.setValueAtTime(0.0001, now + at);
        gn.gain.exponentialRampToValueAtTime(vol, now + at + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
        src.connect(bp).connect(gn).connect(actx.destination); src.start(now + at); src.stop(now + at + dur + 0.02);
      };
      if (kind === 'crinkle') {
        for (let i = 0; i < 4; i++) noise(0.06, 2500 + Math.random() * 2500, 1800, 0.08, 1.2, i * 0.09 + Math.random() * 0.04);
      } else if (kind === 'rip') {
        noise(0.32, 900, 5200, 0.32, 0.9);
        noise(0.18, 3000, 7000, 0.14, 2, 0.08);
        if (tier >= 2) {                      // a shimmer for the good packs
          [1046, 1318, 1568, tier >= 4 ? 2093 : 0].filter(Boolean).forEach((f, i) => {
            const o = actx.createOscillator(), gn = actx.createGain(); o.type = 'sine'; o.frequency.value = f;
            gn.gain.setValueAtTime(0.0001, now + 0.1 + i * 0.07); gn.gain.exponentialRampToValueAtTime(0.07, now + 0.12 + i * 0.07);
            gn.gain.exponentialRampToValueAtTime(0.0001, now + 0.9 + i * 0.07);
            o.connect(gn).connect(actx.destination); o.start(now + 0.1 + i * 0.07); o.stop(now + 1 + i * 0.07);
          });
        }
      }
    } catch (e) {}
  }

  // ── public API ──
  const pending = new WeakMap();
  function onReady() {
    if (libs !== 'ready') return;
    document.querySelectorAll('.draft-pack[data-d3]').forEach(pack => {
      if (pack.isConnected && !pack.classList.contains('d3-pack-live') && !pack.classList.contains('pack-tearing') && pending.has(pack)) build(pack, pending.get(pack));
    });
  }

  function mount(pack, opts) {
    if (reduced || broken || !pack) return;
    pack.setAttribute('data-d3', '1');
    pending.set(pack, opts || {});
    // already on the page: draw it now, so the flat pack never flashes first
    if (libs === 'ready' && pack.isConnected && build(pack, pending.get(pack))) return;
    if (libs === 'ready') { requestAnimationFrame(() => { if (pack.isConnected && !pack.classList.contains('pack-tearing')) build(pack, pending.get(pack)); }); setTimeout(() => { if (pack.isConnected && !pack.classList.contains('d3-pack-live') && !pack.classList.contains('pack-tearing')) build(pack, pending.get(pack)); }, 120); }
    else loadThree();
  }

  function open(pack) {
    if (!S || S.pack !== pack || !pack.classList.contains('d3-pack-live') || S.open || broken) return null;
    const tier = S.th.tier;
    const shake = 520 + tier * 140, tear = 560, drop = 380;
    S.open = { t0: performance.now(), shake, tear, drop, total: shake + tear + drop };
    pack.classList.add('d3-opening');
    sound('crinkle', tier);
    return new Promise(res => setTimeout(() => {
      stopLoop();
      const cvs = R && R.renderer.domElement; if (cvs && cvs.parentNode === pack) cvs.remove();
      disposePack(); S = null;
      res();
    }, shake + tear + drop + 30));
  }

  // test hook: draw the opening at a given moment (ms) and return the frame
  function frameAt(ms) {
    if (!S || !R) return '';
    if (!S.open) { const tier = S.th.tier; const shake = 520 + tier * 140; S.open = { shake, tear: 560, drop: 380, total: shake + 940 }; stopLoop(); }
    const now = performance.now(); S.open.t0 = now - ms; step(now);
    return R.renderer.domElement.toDataURL();
  }
  // flat picture of a pack's printed front (no WebGL), for menus and legends
  const artCache = {};
  function art(theme, opts) {
    const key = theme + '|' + JSON.stringify(opts || {});
    if (artCache[key]) return artCache[key];
    const th = Object.assign({}, THEMES[({ common: 'wax2', retail: 'retail2', hobby: 'hobby2', premium: 'premium2' })[theme] || theme] || THEMES.random);
    const c = document.createElement('canvas'); c.width = TEX_W; c.height = TEX_H;
    drawFront(c, th, Object.assign({ badge: '', tagline: '', fine: '' }, opts || {}));
    return (artCache[key] = c.toDataURL('image/jpeg', 0.85));
  }
  window.DraftPack3D = { mount, open, frameAt, art, debug: () => ({ libs, broken, live: !!S, theme: S && S.th }) };
})();
