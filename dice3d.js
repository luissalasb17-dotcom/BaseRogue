// 3D d100 dice that roll on the duel felt (battle screen). Presentation only: ui.js decides the roll
// first and asks DiceTable.roll(n) to show it; the throw is simulated with cannon.js, then the dice are
// relabelled by a symmetry of the d10 so the decided faces land on top. Falls back to the old 2D cubes
// whenever the 3D libraries are missing, the player turns it off, or motion is reduced.
(function () {
  'use strict';

  const LIBS = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js'
  ];
  const PREF_KEY = 'baserogue_dice3d';
  const FPS = 60, MAX_FRAMES = 420, PLAY_SPEED = 1.35;
  const R = 0.95, H = R * 1.08;          // d10 ring radius / apex height (world units)
  const TILT = 25 * Math.PI / 180;       // camera tilt from straight down
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let enabled = true;
  try { enabled = localStorage.getItem(PREF_KEY) !== 'off'; } catch (e) {}
  let libsState = 'idle';                 // idle | loading | ready | failed
  let G = null;                           // built 3D state

  function loadLibs() {
    if (libsState !== 'idle') return;
    libsState = 'loading';
    const load = src => new Promise((ok, bad) => {
      // three.js may already be on the page (draft3d.js loads the same file)
      if (src.includes('three') && window.THREE) { ok(); return; }
      const prior = src.includes('three') && document.querySelector('script[src*="three.min.js"]');
      if (prior) { let n = 0; const iv = setInterval(() => { if (window.THREE) { clearInterval(iv); ok(); } else if (++n > 200) { clearInterval(iv); bad(new Error(src)); } }, 100); return; }
      const s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = ok; s.onerror = () => bad(new Error(src)); document.head.appendChild(s);
    });
    load(LIBS[0]).then(() => load(LIBS[1])).then(() => { libsState = 'ready'; }).catch(() => { libsState = 'failed'; });
  }

  // ── d10 model (shared by physics and mesh) ──
  function buildModel(T) {
    const cs = Math.cos(Math.PI / 5), z0 = H * (1 - cs) / (1 + cs);
    const V = [new T.Vector3(0, 0, H), new T.Vector3(0, 0, -H)];
    for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5; V.push(new T.Vector3(R * Math.cos(a), R * Math.sin(a), z0)); }
    for (let k = 0; k < 5; k++) { const a = (k + 0.5) * 2 * Math.PI / 5; V.push(new T.Vector3(R * Math.cos(a), R * Math.sin(a), -z0)); }
    const U = k => 2 + (k % 5), L = k => 7 + (k % 5);
    const FACES = [];
    for (let k = 0; k < 5; k++) FACES.push([0, U(k), L(k), U(k + 1)]);
    for (let k = 0; k < 5; k++) FACES.push([1, L(k), U(k + 1), L(k + 1)]);
    const NORMALS = FACES.map(f => {
      const [a, b, c] = f.map(j => V[j]);
      const n = new T.Vector3().subVectors(b, a).cross(new T.Vector3().subVectors(c, a)).normalize();
      const cen = f.reduce((s, j) => s.add(V[j]), new T.Vector3()).multiplyScalar(0.25);
      if (n.dot(cen) < 0) { f.reverse(); n.negate(); }
      return n;
    });
    const FACE_VALUE = [0, 2, 4, 6, 8, 3, 1, 9, 7, 5];   // opposite faces add up to 9
    const SYM = [];
    for (let k = 0; k < 5; k++) {
      const qz = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), k * 2 * Math.PI / 5);
      SYM.push(qz.clone());
      SYM.push(qz.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(Math.cos(Math.PI / 10), Math.sin(Math.PI / 10), 0), Math.PI)));
    }
    const symFor = (from, to) => SYM.find(q => NORMALS[from].clone().applyQuaternion(q).dot(NORMALS[to]) > 0.999) || new T.Quaternion();
    const UVS = FACES.map(f => {
      const pts = f.map(j => V[j]);
      const apex = pts.find(p => Math.abs(Math.abs(p.z) - H) < 1e-6);
      const ai = pts.indexOf(apex), far = pts[(ai + 2) % 4];
      const n = new T.Vector3().subVectors(pts[1], pts[0]).cross(new T.Vector3().subVectors(pts[2], pts[0])).normalize();
      const Y = new T.Vector3().subVectors(apex, far); Y.sub(n.clone().multiplyScalar(Y.dot(n))).normalize();
      const X = new T.Vector3().crossVectors(Y, n);
      const loc = pts.map(p => [p.dot(X), p.dot(Y)]);
      const xs = loc.map(l => l[0]), ys = loc.map(l => l[1]);
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.04;
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
      const uv = loc.map(([x, y]) => [0.5 + (x - cx) / size, 0.5 + (y - cy) / size]);
      return { uv, sideV: uv[(ai + 1) % 4][1] };
    });
    return { V, FACES, NORMALS, FACE_VALUE, symFor, UVS };
  }

  const STYLES = {
    tens: { top: '#fbf3dc', bottom: '#e6d6ad', speck: '90,60,20', ink: '#1d2a4a', inkShadow: 'rgba(0,0,0,.18)' },
    units: { top: '#c8202c', bottom: '#8c0f19', speck: '255,220,200', ink: '#fff7e6', inkShadow: 'rgba(0,0,0,.45)' }
  };
  function faceTexture(T, label, style, sideV) {
    const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, S); grd.addColorStop(0, style.top); grd.addColorStop(1, style.bottom);
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${style.speck},${Math.random() * 0.06})`; g.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
    const y = (1 - (sideV + 0.07)) * S;
    g.font = `bold ${label.length > 1 ? 66 : 92}px Oswald, 'Arial Narrow', Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = style.inkShadow; g.fillText(label, S / 2 + 2, y + 3);
    g.fillStyle = style.ink; g.fillText(label, S / 2, y);
    if (label === '6' || label === '9') g.fillRect(S / 2 - 18, y + 44, 36, 7);
    const tx = new T.CanvasTexture(cv); tx.anisotropy = 8; tx.encoding = T.sRGBEncoding; return tx;
  }

  // ── sound (synthesised) ──
  let actx = null, noiseBuf = null;
  const muted = () => (window.AudioManager && typeof window.AudioManager.isMuted === 'function') ? window.AudioManager.isMuted() : false;
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function hitSound(what, v) {
    if (muted()) return; const ctx = audio(); if (!ctx) return;
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = ctx.currentTime, vol = Math.min(1, v / 9) * 0.8;
    const out = ctx.createGain(); out.connect(ctx.destination);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const filt = ctx.createBiquadFilter(), tone = ctx.createOscillator(), tg = ctx.createGain();
    const P = {
      die:  ['bandpass', 3200 + Math.random() * 900, 6, 2100 + Math.random() * 500, 'triangle', 0.55, 0.07, 0.25, 0.05],
      wall: ['bandpass', 1100 + Math.random() * 300, 3, 260 + Math.random() * 60, 'sine', 0.6, 0.11, 0.4, 0.13],
      card: ['highpass', 2400, 0.7, 900 + Math.random() * 200, 'square', 0.35, 0.04, 0.06, 0.03],
      felt: ['lowpass', 700 + 900 * vol, 0.8, 140 + Math.random() * 40, 'sine', 0.65, 0.09, 0.35, 0.1]
    }[what] || null;
    if (!P) return;
    filt.type = P[0]; filt.frequency.value = P[1]; filt.Q.value = P[2];
    tone.frequency.value = P[3]; tone.type = P[4];
    out.gain.setValueAtTime(P[5] * vol, t); out.gain.exponentialRampToValueAtTime(0.001, t + P[6]);
    tg.gain.setValueAtTime(P[7] * vol, t); tg.gain.exponentialRampToValueAtTime(0.001, t + P[8]);
    src.connect(filt); filt.connect(out); tone.connect(tg); tg.connect(ctx.destination);
    src.start(t, Math.random() * 0.2, 0.15); tone.start(t); tone.stop(t + 0.16);
  }

  // ── scene on the felt ──
  function build(deck, tray) {
    const T = window.THREE;
    const M = buildModel(T);
    const canvas = document.createElement('canvas');
    canvas.className = 'dice3d-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6;';
    deck.appendChild(canvas);
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    scene.add(new T.HemisphereLight(0xfff1d6, 0x1a120a, 0.55));
    const key = new T.DirectionalLight(0xffe2b8, 1.5);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0006; key.shadow.radius = 4;
    scene.add(key); scene.add(key.target);
    const rim = new T.PointLight(0x7fd0ff, 0.35, 60); scene.add(rim);
    // the real CSS felt is the table: only the dice shadows are drawn on it
    const floor = new T.Mesh(new T.PlaneGeometry(400, 400), new T.ShadowMaterial({ opacity: 0.38 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    const geo = (() => {
      const pos = [], nor = [], uv = [], g = new T.BufferGeometry();
      M.FACES.forEach((f, i) => {
        g.addGroup(pos.length / 3, 6, i);
        [[0, 1, 2], [0, 2, 3]].forEach(t => t.forEach(j => {
          const p = M.V[f[j]]; pos.push(p.x, p.y, p.z);
          nor.push(M.NORMALS[i].x, M.NORMALS[i].y, M.NORMALS[i].z);
          uv.push(M.UVS[i].uv[j][0], M.UVS[i].uv[j][1]);
        }));
      });
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      return g;
    })();
    const texCache = {};
    const mats = kind => M.FACES.map((f, i) => {
      const v = M.FACE_VALUE[i];
      const label = kind === 'tens' ? (v === 0 ? '00' : String(v * 10)) : String(v);
      const key = kind + label;
      if (!texCache[key]) texCache[key] = faceTexture(T, label, STYLES[kind], M.UVS[i].sideV);
      return new T.MeshStandardMaterial({ map: texCache[key], roughness: 0.32, metalness: 0.02, transparent: true });
    });
    // two pairs: the second only shows when Focus throws two
    const dice = ['tens', 'units', 'tens', 'units'].map(kind => {
      const m = mats(kind), mesh = new T.Mesh(geo, m);
      mesh.castShadow = true; mesh.visible = false; scene.add(mesh);
      return { kind, mesh, mats: m };
    });
    G = { T, M, floor, deck, canvas, renderer, scene, camera, key, rim, dice, W: 0, H: 0, k: 30, sim: null, sym: null,
      playing: false, t0: 0, hitIdx: 0, done: null, glow: 0, glowMats: [], raf: 0, tray: !!tray };
    layout();
  }

  // Ortho camera tilted 25°: a felt pixel maps to world x = px / k, z = py / (k cos25°).
  function layout() {
    const { deck, renderer, camera, key, rim } = G;
    const W = deck.clientWidth, Hh = deck.clientHeight;
    if (!W || !Hh) return false;
    if (W === G.W && Hh === G.H) return true;
    G.W = W; G.H = Hh;
    G.k = G.tray ? 36 : Math.max(30, Math.min(46, Math.min(W * 1.5, Hh) / 15));   // the tray is small: slightly bigger dice
    renderer.setSize(W, Hh, false);
    const hw = W / 2 / G.k, hh = Hh / 2 / G.k;
    Object.assign(camera, { left: -hw, right: hw, top: hh, bottom: -hh });
    camera.position.set(0, Math.cos(TILT) * 60, Math.sin(TILT) * 60); camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    key.position.set(-hw * 0.6, 30, hh * 0.4); key.target.position.set(0, 0, 0);
    Object.assign(key.shadow.camera, { left: -hw * 1.3, right: hw * 1.3, top: hh * 1.6, bottom: -hh * 1.6, near: 1, far: 80 });
    key.shadow.camera.updateProjectionMatrix();
    rim.position.set(hw, 10, -hh);
    return true;
  }
  // felt rect (page px) → world box on the floor
  function rectToWorld(r) {
    const d = G.deck.getBoundingClientRect(), c = Math.cos(TILT);
    const x0 = (r.left - d.left - G.W / 2) / G.k, x1 = (r.right - d.left - G.W / 2) / G.k;
    const z0 = (r.top - d.top - G.H / 2) / (G.k * c), z1 = (r.bottom - d.top - G.H / 2) / (G.k * c);
    return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, hx: Math.abs(x1 - x0) / 2, hz: Math.abs(z1 - z0) / 2 };
  }

  function simulate(n) {
    const T = G.T, C = window.CANNON, M = G.M;
    const world = new C.World();
    world.gravity.set(0, -38, 0); world.broadphase = new C.NaiveBroadphase(); world.solver.iterations = 16;
    const mDie = new C.Material(), mFloor = new C.Material(), mWall = new C.Material();
    world.addContactMaterial(new C.ContactMaterial(mDie, mFloor, { friction: 0.32, restitution: 0.38 }));
    world.addContactMaterial(new C.ContactMaterial(mDie, mWall, { friction: 0.1, restitution: 0.55 }));
    world.addContactMaterial(new C.ContactMaterial(mDie, mDie, { friction: 0.12, restitution: 0.5 }));
    const ground = new C.Body({ mass: 0, material: mFloor }); ground.addShape(new C.Plane());
    ground.quaternion.setFromAxisAngle(new C.Vec3(1, 0, 0), -Math.PI / 2); ground.tag = 'felt'; world.addBody(ground);
    const hx = G.W / 2 / G.k, hz = G.H / 2 / (G.k * Math.cos(TILT));
    const wall = (cx, cz, ax, az, tag) => { const b = new C.Body({ mass: 0, material: mWall }); b.addShape(new C.Box(new C.Vec3(ax, 30, az))); b.position.set(cx, 30, cz); b.tag = tag; world.addBody(b); };
    wall(0, -hz - 1, hx + 2, 1, 'wall'); wall(0, hz + 1, hx + 2, 1, 'wall'); wall(-hx - 1, 0, 1, hz + 2, 'wall'); wall(hx + 1, 0, 1, hz + 2, 'wall');
    // The cards lie flat on the felt (like a real table): the dice roll over them. Each throw comes
    // in from a random side, aimed at a random spot, so they land somewhere different every time.
    const rnd = a => (Math.random() - 0.5) * 2 * a;
    const aim = { x: rnd(hx * 0.55), z: rnd(hz * 0.55) };
    const side = Math.random();
    const from = side < 0.4 ? { x: hx - 0.8, z: rnd(hz * 0.7) }            // the dice-tray side, most often
      : side < 0.6 ? { x: -hx + 0.8, z: rnd(hz * 0.7) }
      : side < 0.8 ? { x: rnd(hx * 0.7), z: hz - 0.8 }
      : { x: rnd(hx * 0.7), z: -hz + 0.8 };
    let dx = aim.x - from.x, dz = aim.z - from.z;
    const dist = Math.hypot(dx, dz) || 1; dx /= dist; dz /= dist;
    const bodies = [];
    for (let i = 0; i < n; i++) {
      const b = new C.Body({ mass: 1, material: mDie });
      b.addShape(new C.ConvexPolyhedron(M.V.map(v => new C.Vec3(v.x, v.y, v.z)), M.FACES.map(f => f.slice())));
      const off = (i - (n - 1) / 2) * 1.4;
      b.position.set(from.x - dz * off + rnd(0.3), 3 + Math.random() * 2.5 + (i % 2) * 0.6, from.z + dx * off + rnd(0.3));
      b.quaternion.setFromEuler(rnd(Math.PI), rnd(Math.PI), rnd(Math.PI));
      const sp = (dist * 1.1 + 4) * (0.75 + Math.random() * 0.5);
      b.velocity.set(dx * sp + rnd(1.5), 1 + Math.random() * 3, dz * sp + rnd(1.5));
      b.angularVelocity.set(rnd(24), rnd(24), rnd(24));
      b.linearDamping = 0.12; b.angularDamping = 0.12; b.tag = 'die';
      world.addBody(b); bodies.push(b);
    }
    const frames = [], hits = [], last = bodies.map(() => -99);
    bodies.forEach((b, i) => b.addEventListener('collide', e => {
      let v = 0; try { v = Math.abs(e.contact.getImpactVelocityAlongNormal()); } catch (err) { v = b.velocity.norm(); }
      const f = frames.length;
      if (v < 0.6 || f - last[i] < 3) return;
      last[i] = f; hits.push({ f, v, what: e.body.tag || 'felt' });
    }));
    let still = 0;
    for (let f = 0; f < MAX_FRAMES; f++) {
      world.step(1 / FPS);
      frames.push(bodies.map(b => [b.position.x, b.position.y, b.position.z, b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w]));
      still = bodies.every(b => b.velocity.norm() < 0.08 && b.angularVelocity.norm() < 0.1) ? still + 1 : 0;
      if (still > 14 && f > 40) break;
    }
    const tops = bodies.map(b => {
      const q = new T.Quaternion(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      let best = -2, face = 0;
      M.NORMALS.forEach((nn, i) => { const y = nn.clone().applyQuaternion(q).y; if (y > best) { best = y; face = i; } });
      return { face, up: best };
    });
    return { frames, hits, tops };
  }

  const sig = () => G.W + 'x' + G.H + ':' + G.k;
  function goodSim(n) { let sim = null; for (let t = 0; t < 8; t++) { sim = simulate(n); if (sim.tops.every(x => x.up > 0.97)) break; } return sim; }
  function prewarm() {
    if (!G || (G.next && G.next.sig === sig())) return;
    const run = () => { try { if (G && !G.playing) G.next = { sig: sig(), sim: goodSim(2) }; } catch (e) { console.warn('dice3d prewarm', e); } };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 1500 }); else setTimeout(run, 50);
  }

  const split = n => (n === 100 ? [0, 0] : [Math.floor(n / 10), n % 10]);

  const _qa = { a: null, b: null };
  function applyFrame(f) {
    const F = G.sim.frames, last = F.length - 1;
    const t = Math.max(0, Math.min(f, last)), i0 = Math.floor(t), i1 = Math.min(last, i0 + 1), u = t - i0;
    if (!_qa.a) { _qa.a = new G.T.Quaternion(); _qa.b = new G.T.Quaternion(); }
    F[0].forEach((_, i) => {
      const a = F[i0][i], b = F[i1][i], d = G.dice[i];
      d.mesh.position.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
      _qa.a.set(a[3], a[4], a[5], a[6]); _qa.b.set(b[3], b[4], b[5], b[6]);
      d.mesh.quaternion.copy(_qa.a).slerp(_qa.b, u).multiply(G.sym[i]);
    });
  }
  function render() { G.renderer.render(G.scene, G.camera); }

  function loop(now) {
    try { loopInner(now); } catch (e) { console.error('dice3d loop', e); G.raf = 0; if (G.playing) { G.playing = false; const cb = G.done; G.done = null; if (cb) cb(); } broken = true; document.body.classList.remove('dice3d-on'); }
  }
  function loopInner(now) {
    G.raf = 0;
    if (!G.deck.isConnected) return;
    let more = false;
    if (G.playing) {
      const f = (now - G.t0) / 1000 * FPS * PLAY_SPEED;
      if (G.t0 < 0 || f >= G.sim.frames.length - 1) settle();
      else {
        applyFrame(f);
        while (G.hitIdx < G.sim.hits.length && G.sim.hits[G.hitIdx].f <= f) { const h = G.sim.hits[G.hitIdx++]; hitSound(h.what, h.v); }
        more = true;
      }
    }
    if (G.glow > 0) {
      G.glow = Math.max(0, G.glow - 0.016);
      const k = 0.3 + 0.25 * Math.sin(now / 150);
      G.glowMats.forEach(m => m.emissive.setRGB(0.55 * k, 0.42 * k, 0.12 * k));
      if (G.glow === 0) G.glowMats.forEach(m => m.emissive.setRGB(0.1, 0.08, 0.02));
      more = true;
    }
    render();
    if (more) G.raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!G.raf) G.raf = requestAnimationFrame(loop); };

  function settle() {
    G.playing = false;
    applyFrame(Infinity);
    const cb = G.done; G.done = null;
    G.glow = 1; kick();
    // when they rest on top of the cards, clear them off after a moment (the defense tray keeps them)
    if (!G.tray) fadeLater();
    if (cb) cb();
  }

  // the dice sit on the cards: once read, they fade off the felt
  function fadeLater() {
    clearTimeout(G.hideT);
    G.hideT = setTimeout(() => {
      if (G.playing) return;
      const t0 = performance.now();
      const step = now => {
        if (G.playing) return;
        const k = Math.min(1, (now - t0) / 450);
        G.dice.forEach(d => d.mats.forEach(m => { m.opacity = Math.min(m.opacity, 1 - k); }));
        G.floor.material.opacity = 0.38 * (1 - k);
        render();
        if (G.chip) G.chip.style.opacity = String(1 - k);
        if (k < 1) requestAnimationFrame(step); else { G.dice.forEach(d => { d.mesh.visible = false; }); render(); if (G.chip) G.chip.classList.remove('show'); }   // re-draw: an invisible die still left its shadow
      };
      requestAnimationFrame(step);
    }, 2200);
  }

  // On phones the dice panel is hidden: the number shows on the felt, next to the dice.
  function showTotal(v) {
    if (!G.chip || !G.chip.isConnected) { G.chip = document.createElement('div'); G.chip.className = 'dice3d-total'; G.deck.appendChild(G.chip); }
    G.chip.textContent = v === 100 ? '100' : String(v).padStart(2, '0');
    G.chip.style.opacity = '1'; G.chip.classList.add('show');
  }

  function resetLooks(n) {
    if (G.chip) G.chip.classList.remove('show');
    G.floor.material.opacity = 0.38;
    G.dice.forEach((d, i) => {
      d.mesh.visible = i < n;
      d.mats.forEach(m => { m.emissive.setRGB(0, 0, 0); m.opacity = 1; });
    });
  }

  // ── public API ──
  let broken = false;
  // host: the battle felt by default, or another box the dice fall into (the defensive-play tray).
  // One WebGL scene at a time: switching boxes rebuilds it.
  const battleDeck = () => document.querySelector('#screen-match:not(.hidden) .bx3-deck');
  function active(host) {
    if (!enabled || reduced || broken) return false;
    const deck = host || battleDeck();
    if (!deck || !deck.clientWidth) return false;
    if (libsState === 'idle') loadLibs();
    if (libsState !== 'ready') return false;
    if (!G || G.deck !== deck) {
      if (G) { clearTimeout(G.hideT); try { G.renderer.dispose(); G.renderer.forceContextLoss(); } catch (e) {} if (G.canvas) G.canvas.remove(); }
      build(deck, !!host && !deck.classList.contains('dice3d-felt'));   // a felt host behaves like the battle felt
    }
    const ok = layout();
    if (ok) prewarm();
    if (host) deck.classList.toggle('dice3d-tray-on', ok);
    else document.body.classList.toggle('dice3d-on', ok);
    return ok;
  }

  // Throw the dice; resolves when they rest. focus = { r1, r2, kept } throws two pairs.
  function roll(target, focus, host) {
    return new Promise(resolve => {
      try { rollInner(target, focus, resolve, host); }
      catch (e) { console.error('dice3d: falling back to the 2D dice', e); broken = true; document.body.classList.remove('dice3d-on'); resolve(); }
    });
  }
  function rollInner(target, focus, resolve, host) {
    {
      if (!active(host)) { resolve(); return; }
      if (G.playing && G.done) { const prev = G.done; G.done = null; prev(); }
      const targets = focus ? [focus.r1, focus.r2] : [target];
      const n = targets.length * 2;
      let sim = (n === 2 && G.next && G.next.sig === sig()) ? G.next.sim : null;
      G.next = null;
      if (!sim) sim = goodSim(n);
      setTimeout(prewarm, 2500);
      const want = [];
      targets.forEach(v => split(v).forEach(d => want.push(G.M.FACE_VALUE.indexOf(d))));
      G.sim = sim; G.sym = sim.tops.map((x, i) => G.M.symFor(want[i], x.face));
      resetLooks(n);
      // which faces read the kept number glow; with Focus the other pair fades
      const keptPair = focus ? (focus.kept === focus.r1 ? 0 : 1) : 0;
      G.glowMats = [0, 1].map(j => G.dice[keptPair * 2 + j].mats[want[keptPair * 2 + j]]);
      G.done = () => {
        if (focus) G.dice.forEach((d, i) => { if (Math.floor(i / 2) !== keptPair) d.mats.forEach(m => { m.opacity = 0.35; }); });
        if (!G.tray) showTotal(focus ? focus.kept : target);
        resolve();
      };
      G.playing = true; G.t0 = performance.now(); G.hitIdx = 0; G.glow = 0;
      audio();
      kick();
      // a hidden tab stops animation frames: never leave the at-bat waiting on the dice
      const myRoll = G.done;
      setTimeout(() => { if (G.playing && G.done === myRoll) settle(); }, sim.frames.length / FPS / PLAY_SPEED * 1000 + 1500);
    }
  }

  // Auto-play: no throw, the dice just turn up on the felt with the number.
  function snap(target, host) {
    if (!active(host)) return;
    if (G.playing) { G.playing = false; G.done && G.done(); G.done = null; }
    const T = G.T, M = G.M, up = new T.Vector3(0, 1, 0);
    const want = split(target).map(d => M.FACE_VALUE.indexOf(d));
    resetLooks(2);
    const hx = G.W / 2 / G.k, hz = G.H / 2 / (G.k * Math.cos(TILT));
    const spot = { x: (Math.random() - 0.5) * hx * 1.1, z: (Math.random() - 0.5) * hz * 1.1 };
    want.forEach((face, i) => {
      const d = G.dice[i];
      const q = new T.Quaternion().setFromUnitVectors(M.NORMALS[face], up);
      q.premultiply(new T.Quaternion().setFromAxisAngle(up, Math.random() * Math.PI * 2));
      d.mesh.quaternion.copy(q);
      // resting height: the apex-to-face distance along the normal (all faces are equivalent)
      const h = M.V.reduce((m, v) => Math.max(m, -v.dot(M.NORMALS[face])), 0);
      d.mesh.position.set(spot.x + (i ? 1.1 : -1.1), h, spot.z + (Math.random() - 0.5) * 1.2);
    });
    G.glowMats = want.map((f, i) => G.dice[i].mats[f]); G.glow = 0.5;
    showTotal(target);
    kick(); fadeLater();
  }

  function skip() { if (G && G.playing) { G.t0 = -1; kick(); } }
  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(PREF_KEY, on ? 'on' : 'off'); } catch (e) {}
    if (!on && G) { G.dice.forEach(d => { d.mesh.visible = false; }); render(); }
    if (!on) document.body.classList.remove('dice3d-on'); else active();
    document.querySelectorAll('#btn-dice3d-toggle').forEach(b => { b.textContent = '🎲 3D DICE: ' + (on ? 'ON' : 'OFF'); });
    document.querySelectorAll('.dice3d-mini').forEach(b => { b.textContent = '🎲 3D ' + (on ? 'ON' : 'OFF'); b.classList.toggle('off', !on); });
  }
  // Phones hide the dice panel (and its 3D switch): a small switch sits in the corner of the felt.
  setInterval(() => {
    const deck = document.querySelector('#screen-match:not(.hidden) .bx3-deck');
    if (!deck || reduced || deck.querySelector('.dice3d-mini')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dice3d-mini' + (enabled ? '' : ' off'); b.textContent = '🎲 3D ' + (enabled ? 'ON' : 'OFF');
    b.addEventListener('click', e => { e.stopPropagation(); setEnabled(!enabled); });
    deck.appendChild(b);
  }, 1000);

  // A click on the felt while the dice roll skips to the end.
  document.addEventListener('pointerdown', e => { if (G && G.playing && e.target.closest && e.target.closest('.bx3-deck, #dice-d100-panel, #def-dice-d100-panel, .po3-felt, .po3-tray')) skip(); }, true);
  // Start fetching the libraries as soon as a battle screen shows up.
  const warm = setInterval(() => {
    if (!enabled || reduced) return;
    if (document.querySelector('#screen-match:not(.hidden)')) { loadLibs(); if (libsState !== 'loading') clearInterval(warm); }
  }, 800);
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#btn-dice3d-toggle')) setEnabled(!enabled); });

  window.DiceTable = { active, roll, snap, skip, setEnabled, isEnabled: () => enabled, state: () => libsState,
    // debug / tests: where the dice are on screen, and step the throw without animation frames
    debug: () => G && (G.camera.updateMatrixWorld(), true) && { k: G.k, W: G.W, H: G.H, dice: G.dice.filter(d => d.mesh.visible).map(d => { const v = d.mesh.position.clone().project(G.camera); return [Math.round((v.x + 1) / 2 * G.W), Math.round((1 - v.y) / 2 * G.H)]; }) },
    renderAt: ms => { if (G && G.playing) { applyFrame(ms / 1000 * FPS * PLAY_SPEED); render(); } } };
})();
