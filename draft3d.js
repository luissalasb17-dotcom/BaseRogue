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
    random:    { rainbow: true, a: '#ffffff', b: '#f472b6', c: '#312e81', ink: '#ffffff', edge: '#1e1b4b', glow: '#f472b6', refl: 0.16, tier: 2 }
  };

  // ── three.js loading (shared with dice3d.js: whichever asks first loads it) ──
  let libs = window.THREE ? 'ready' : 'idle';
  function loadThree() {
    if (libs !== 'idle') return;
    if (window.THREE) { libs = 'ready'; return; }
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
      renderer.setPixelRatio(Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)));
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

  function drawFront(c, th, opts) {
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
      shininess: th.wax ? 20 : 70, specular: th.wax ? 0x1a1a1a : 0x444444, transparent: !!transparent, side: T.FrontSide
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
    const th = Object.assign({}, THEMES[opts.theme] || THEMES.random, opts.tier != null ? { tier: opts.tier } : {});
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
    const strip = new T.Group(); strip.add(mk(stripGeo, tf, false, true), mk(stripGeo, tb, true, true));
    const pivot = new T.Group(); pivot.position.set(-W / 2, TEAR_Y, 0);
    strip.position.set(W / 2, -TEAR_Y, 0); pivot.add(strip);
    root.add(body, pivot);
    bodyGeo.dispose(); stripGeo.dispose();
    R.scene.add(root);
    R.inner.color.set(th.glow); R.inner.intensity = 0;
    S = { pack, th, root, body, pivot, strip, tex: [tf, tb], tilt: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, open: null, t0: performance.now() };

    // the canvas and a glow behind it live inside the pack element
    const cvs = R.renderer.domElement;
    let glow = pack.querySelector('.d3-glow');
    if (!glow) { glow = document.createElement('div'); glow.className = 'd3-glow'; pack.prepend(glow); }
    pack.style.setProperty('--d3g', th.glow);
    pack.appendChild(cvs);
    pack.classList.add('d3-pack-live', `d3-tier-${th.tier}`);
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
        S.body.children.forEach(m => { m.material.opacity = 1 - p; });
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
      sp.style.setProperty('--sc', Math.random() < 0.5 ? th.glow : '#ffffff');
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
  window.DraftPack3D = { mount, open, frameAt, debug: () => ({ libs, broken, live: !!S, theme: S && S.th }) };
})();
