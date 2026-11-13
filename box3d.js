/* box3d.js - the 162-0 hobby box in 3D (Nov 2026).
   A sealed box sits on the table; tap it and the lid swings open, the packs inside rise one by one
   (the real ones of this box, shuffled), then fly out into a fanned deck of packs to open.
   Presentation only: Challenge162._showBoxIntro decides what is in the box. Needs three.js (same
   r128 as draft3d.js / dice3d.js) and DraftPack3D.art for the pack prints; without them it does
   nothing and the flat box stays. */
(function () {
  'use strict';
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let libs = window.THREE ? 'ready' : 'idle';
  const waiters = [];
  function ensureLibs(cb) {
    if (window.THREE) { libs = 'ready'; cb(true); return; }
    waiters.push(cb);
    if (libs === 'loading') return;
    libs = 'loading';
    let s = document.querySelector('script[src*="three.min.js"]');
    const done = ok => { libs = ok ? 'ready' : 'failed'; waiters.splice(0).forEach(f => f(ok)); };
    if (s) { let n = 0; const poll = setInterval(() => { if (window.THREE) { clearInterval(poll); done(true); } else if (++n > 150) { clearInterval(poll); done(false); } }, 100); return; }
    s = document.createElement('script'); s.src = THREE_URL; s.async = true;
    s.onload = () => done(!!window.THREE); s.onerror = () => done(false);
    document.head.appendChild(s);
  }

  // printed cardboard of the box
  function boxTexture(T, kind) {
    const c = document.createElement('canvas'); c.width = 512; c.height = kind === 'lid' ? 256 : 160;
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1d3a8a'); gr.addColorStop(.6, '#0f1d46'); gr.addColorStop(1, '#0a1433');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e2b33c'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.lineWidth = 2; g.strokeRect(18, 18, w - 36, h - 36);
    g.textAlign = 'center'; g.fillStyle = '#f5d77a';
    if (kind === 'lid') {
      g.font = '64px "Alfa Slab One", serif'; g.lineWidth = 8; g.strokeStyle = '#000'; g.strokeText('BASEROGUE', w / 2, 118); g.fillText('BASEROGUE', w / 2, 118);
      g.font = '700 30px Oswald, sans-serif'; g.fillStyle = '#ffffff'; g.fillText('HOBBY BOX  ·  ALL-TIME SERIES', w / 2, 170);
      g.font = '600 22px Oswald, sans-serif'; g.fillStyle = '#f5d77a'; g.fillText('26 PACKS  ·  3 CARDS PER PACK', w / 2, 210);
    } else {
      g.font = '46px "Alfa Slab One", serif'; g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText('BASEROGUE', w / 2, 82); g.fillText('BASEROGUE', w / 2, 82);
      g.font = '600 22px Oswald, sans-serif'; g.fillStyle = '#ffffff'; g.fillText('HOBBY BOX', w / 2, 120);
    }
    const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  // inside of the box (lid underside and floor): cream stock with baseball stitches and a line of print
  function insideTexture(T, label) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d'), w = c.width, h = c.height;
    g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(200,48,43,.35)'; g.lineWidth = 2;
    for (let y = -40; y < h + 40; y += 64) for (let x = -40; x < w + 40; x += 96) {
      const ox = x + ((y / 64) % 2 ? 48 : 0);
      g.beginPath(); g.arc(ox, y, 22, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(ox + 44, y, 22, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
    }
    g.strokeStyle = '#1e3c7c'; g.lineWidth = 5; g.strokeRect(10, 10, w - 20, h - 20);
    if (!label) { const t0 = new T.CanvasTexture(c); t0.anisotropy = 4; return t0; }
    g.textAlign = 'center'; g.fillStyle = '#1e3c7c'; g.font = '18px "Alfa Slab One", serif'; g.fillText(label, w / 2, h / 2 + 4);
    g.font = '600 18px Oswald, sans-serif'; g.fillStyle = '#7a1c18'; g.fillText('BASEROGUE  ·  ALL-TIME SERIES', w / 2, h / 2 + 40);
    const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }

  let live = null;   // { renderer, raf, ... }
  function stop() {
    if (!live) return;
    cancelAnimationFrame(live.raf); clearInterval(live.watch);
    try { live.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } }); } catch (e) { /* already gone */ }
    try { live.renderer.dispose(); live.renderer.forceContextLoss(); } catch (e) { /* ignore */ }
    if (live.cvs && live.cvs.parentNode) live.cvs.parentNode.removeChild(live.cvs);
    live = null;
  }

  // host: element to draw in; themes: one entry per pack (e.g. 'common', 'retail', 'hobby', 'premium', 'random')
  // opts.onOpen() fires when the lid starts to open, opts.onDone() when the deck is laid out.
  function mount(host, themes, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      ensureLibs(ok => {
        if (!ok || !host.isConnected || !window.DraftPack3D || !window.DraftPack3D.art) { resolve(false); return; }
        try { resolve(build(host, themes, opts)); } catch (e) { stop(); resolve(false); }
      });
    });
  }

  function build(host, themes, opts) {
    stop();
    const T = window.THREE;
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(window.innerWidth < 900 ? 1.25 : Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    const cvs = renderer.domElement; cvs.className = 'bx3d-canvas';
    host.appendChild(cvs);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 60);
    camera.position.set(0, 2.2, 5.0); camera.lookAt(0, 0.78, 0);
    scene.add(new T.AmbientLight(0xffffff, 0.5));
    const key = new T.DirectionalLight(0xffffff, 0.75); key.position.set(-2.5, 5, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    scene.add(key);
    const spot = new T.SpotLight(0xfff1cf, 0.55, 14, 0.62, 0.55); spot.position.set(0.3, 6, 2.2); spot.target.position.set(0.2, 0, 0.2); scene.add(spot); scene.add(spot.target);
    const glow = new T.PointLight(0xffd27a, 0, 6); glow.position.set(0, 1.2, 0.2); scene.add(glow);
    // shadow catcher
    const floor = new T.Mesh(new T.PlaneGeometry(14, 14), new T.ShadowMaterial({ opacity: 0.35 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    // ── the box: open tray + lid hinged at the back ──
    const BW = 2.6, BD = 1.25, BH = 0.62, TH = 0.04;
    const side = boxTexture(T, 'side'), lidTex = boxTexture(T, 'lid');
    const card = new T.MeshStandardMaterial({ color: 0x15295e, roughness: 0.7, metalness: 0.1 });
    const sideMat = new T.MeshStandardMaterial({ map: side, roughness: 0.65 });
    const inner = new T.MeshStandardMaterial({ color: 0xd9cba6, roughness: 0.9 });
    const lidIn = new T.MeshStandardMaterial({ map: insideTexture(T, 'COLLECT · ROLL · REPEAT'), roughness: 0.85 });
    const floorIn = new T.MeshStandardMaterial({ map: insideTexture(T, 'HOBBY BOX'), roughness: 0.9 });
    const tray = new T.Group();
    const wall = (w, h, d, x, y, z, mat) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; tray.add(m); return m; };
    wall(BW, TH, BD, 0, TH / 2, 0, [card, card, floorIn, card, card, card]);                                          // bottom
    wall(BW, BH, TH, 0, BH / 2, BD / 2, [card, card, card, card, sideMat, inner]);  // front (printed)
    wall(BW, BH, TH, 0, BH / 2, -BD / 2, [card, card, card, card, inner, card]);                                     // back
    wall(TH, BH, BD, -BW / 2, BH / 2, 0, [inner, card, card, card, card, card]);
    wall(TH, BH, BD, BW / 2, BH / 2, 0, [card, inner, card, card, card, card]);
    const BX = -0.95; tray.position.x = BX;   // box on the left, the stack builds on the right
    scene.add(tray);
    const hinge = new T.Group(); hinge.position.set(BX, BH, -BD / 2); scene.add(hinge);
    const lid = new T.Mesh(new T.BoxGeometry(BW + 0.06, 0.07, BD + 0.06), [card, card, new T.MeshStandardMaterial({ map: lidTex, roughness: 0.5, metalness: 0.15 }), lidIn, card, card]);
    lid.position.set(0, 0.035, BD / 2); lid.castShadow = true; hinge.add(lid);

    // ── the packs: two rows standing inside, prints facing the camera ──
    const PW = 0.5, PH = 0.7, PD = 0.03;
    const loader = new T.TextureLoader();
    const texCache = {};
    const texFor = th => texCache[th] || (texCache[th] = loader.load(window.DraftPack3D.art(th, { tagline: '', badge: '', fine: '' })));
    const edgeCol = { common: 0xd8c79f, retail: 0xe6b52e, hobby: 0x2a5694, premium: 0xd4a017, random: 0xc084fc };
    const packs = themes.map((th, i) => {
      const t = texFor(th);
      const shiny = th === 'premium' ? 0.55 : th === 'hobby' ? 0.4 : 0.1;
      const front = new T.MeshStandardMaterial({ map: t, roughness: 1 - shiny, metalness: shiny * 0.6 });
      const edge = new T.MeshStandardMaterial({ color: edgeCol[th] || 0xcccccc, roughness: 0.5, metalness: shiny * 0.5 });
      const m = new T.Mesh(new T.BoxGeometry(PW, PH, PD), [edge, edge, edge, edge, front, edge]);
      m.castShadow = true;
      const col = i % 2, row = Math.floor(i / 2), rows = Math.ceil(themes.length / 2);
      const home = new T.Vector3(BX + (col ? 0.32 : -0.32), TH + PH / 2 + 0.006, -BD / 2 + 0.12 + row * ((BD - 0.24) / Math.max(1, rows - 1)));
      m.position.copy(home); m.rotation.x = -0.08;
      scene.add(m);
      return { m, home, th };
    });
    // deck: a neat stack of packs lying face up in front of the box; each lands on top of the last
    const n = packs.length, SX = 1.3, SZ = 0.45, LAY = 0.017;
    packs.forEach((p, i) => {
      const jit = Math.sin(i * 12.9898) * 43758.5453; const r = jit - Math.floor(jit);
      p.deck = new T.Vector3(SX + (r - 0.5) * 0.05, 0.02 + i * LAY + PD / 2, SZ + (((r * 7) % 1) - 0.5) * 0.04);
      p.deckRot = new T.Euler(-Math.PI / 2 + 0.28, 0, (r - 0.5) * 0.14);
      p.delay = i * 0.075;
    });

    function size() {
      const b = host.getBoundingClientRect();
      const w = Math.max(200, Math.round(b.width)), h = Math.max(180, Math.round(b.height));
      renderer.setSize(w, h, false); cvs.style.width = w + 'px'; cvs.style.height = h + 'px';
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    size();

    const st = { t0: performance.now(), open: null, done: false, aim: 0 };
    live = { renderer, scene, cvs, raf: 0, watch: 0 };
    const ease = p => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
    const easeIO = p => { p = Math.min(1, Math.max(0, p)); return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
    const LID = 0.8, RISE = 1.0, FLY = 0.55;
    // ── sound: synthesised (no files), respects the game mute ──
    let actx = null;
    const muted = () => { try { if (window.AudioManager && typeof window.AudioManager.isMuted === 'function') return window.AudioManager.isMuted(); return localStorage.getItem('baserogue_muted') === 'true'; } catch (e) { return false; } };
    const ac = () => { if (muted()) return null; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; } catch (e) { return null; } };
    const noise = (dur, f, q, vol, type) => { const a = ac(); if (!a) return; const len = Math.ceil(a.sampleRate * dur), b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      const src = a.createBufferSource(); src.buffer = b; const fl = a.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q; const g = a.createGain(); g.gain.value = vol;
      src.connect(fl).connect(g).connect(a.destination); src.start(); };
    const tone = (f, dur, vol, type, at) => { const a = ac(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + (at || 0);
      o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02); };
    const SFX = {
      lid: () => { noise(0.35, 420, 0.8, 0.5, 'lowpass'); noise(0.5, 1800, 2, 0.12); tone(110, 0.25, 0.15, 'triangle'); },
      rise: i => noise(0.12, 2600 + (i % 5) * 220, 1.4, 0.07),
      land: i => { noise(0.06, 1400 + i * 18, 3, 0.22, 'bandpass'); tone(170 + i * 4, 0.09, 0.08, 'triangle'); },
      done: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => tone(f, 0.5, 0.06, 'sine', k * 0.07))
    };
    packs.forEach(p => { p.sRise = false; p.sLand = false; });
    function step(now) {
      if (!live || live.renderer !== renderer) return;
      if (!host.isConnected) { stop(); return; }
      live.last = now;
      const t = (now - st.t0) / 1000;
      const O = st.open;
      if (!O) {                          // closed: breathe and wiggle the lid now and then
        tray.rotation.y = Math.sin(t * 0.6) * 0.06; hinge.rotation.y = tray.rotation.y;
        hinge.rotation.x = (t % 3 < 0.25) ? -Math.sin((t % 3) / 0.25 * Math.PI) * 0.05 : 0;
        packs.forEach(p => { p.m.visible = false; });
      } else {
        const e = (now - O) / 1000;
        tray.rotation.y *= 0.9; hinge.rotation.y = tray.rotation.y;
        glow.position.x = BX;
        hinge.rotation.x = -ease(e / LID) * 1.7;                        // lid swings open
        if (!st.sLid) { st.sLid = true; SFX.lid(); }
        glow.intensity = Math.min(1.4, e / LID * 1.4) * (e < LID + RISE + FLY ? 1 : 0.6);
        packs.forEach((p, i) => {
          p.m.visible = true;
          const re = (e - LID * 0.6 - i * 0.03) / 0.5;                   // rise out of the box, one by one
          const up = ease(re) * 0.42;
          if (re > 0 && !p.sRise) { p.sRise = true; if (!st.skipped) SFX.rise(i); }
          const fe = (e - LID - RISE - p.delay) / FLY;                   // lift out and drop onto the stack
          if (fe <= 0) {
            p.m.position.set(p.home.x, p.home.y + up, p.home.z);
            p.m.rotation.set(-0.08, 0, 0);
          } else if (fe < 1) {
            const k = easeIO(fe);
            const arc = Math.sin(k * Math.PI) * 0.75;
            p.m.position.set(p.home.x + (p.deck.x - p.home.x) * k, p.home.y + 0.42 + (p.deck.y - p.home.y - 0.42) * k + arc, p.home.z + (p.deck.z - p.home.z) * k);
            p.m.rotation.set(-0.08 + (p.deckRot.x + 0.08) * k, 0, p.deckRot.z * k);
          } else {
            const b = Math.max(0, 1 - (fe - 1) * FLY / 0.18);             // tiny settle when it lands
            p.m.position.set(p.deck.x, p.deck.y + b * 0.025, p.deck.z);
            p.m.rotation.set(p.deckRot.x, 0, p.deckRot.z);
            if (!p.sLand) { p.sLand = true; if (!st.skipped) SFX.land(i); }
          }
        });
        if (!st.done && e > LID + RISE + FLY + packs[n - 1].delay + 0.25) { st.done = true; SFX.done(); if (opts.onDone) opts.onDone(); }
      }
      try { renderer.render(scene, camera); } catch (err) { stop(); }
    }
    const tick = now => { if (!live || live.renderer !== renderer) return; live.raf = requestAnimationFrame(tick); step(now); };
    live.raf = requestAnimationFrame(tick);
    live.watch = setInterval(() => { const nn = performance.now(); if (!live || live.renderer !== renderer) return; if (nn - (live.last || 0) > 70) step(nn); }, 45);
    live.resize = size;
    live.open = () => {
      if (st.open) return;
      st.open = performance.now();
      if (opts.onOpen) opts.onOpen();
    };
    live.skip = () => { if (!st.open) live.open(); st.skipped = true; st.open -= 10000; };
    live.frameAt = ms => step(st.open ? st.open + ms : performance.now());
    return true;
  }

  window.addEventListener('resize', () => { if (live && live.resize) live.resize(); });
  window.Box3D = { mount, resize: () => live && live.resize && live.resize(), open: () => live && live.open(), skip: () => live && live.skip(), stop, frameAt: ms => live && live.frameAt(ms) };
})();
