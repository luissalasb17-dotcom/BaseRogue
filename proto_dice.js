// Physical d100 dice — look-and-feel prototype. Opens over the game with ?proto=dice and never
// touches the real combat. Two d10 (tens + units) are thrown onto a felt tray with real physics
// (cannon.js), rendered in 3D (three.js) and land on a number decided BEFORE the throw: the throw is
// simulated first, then the die's faces are relabelled by a symmetry of the d10 so the chosen face is
// the one that ends up on top. Impact sounds are synthesised from the recorded collisions.
(function () {
  'use strict';
  if (!/[?&]proto=dice\b/.test(location.search)) return;

  const LIBS = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js'
  ];
  const loadScript = src => new Promise((ok, bad) => {
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => bad(new Error('load ' + src));
    document.head.appendChild(s);
  });

  const ZONES = [
    { k: 'BB', lo: 1, hi: 10, w: 'WALK', c: '#8ec5ff' }, { k: 'K', lo: 11, hi: 28, w: 'STRIKEOUT', c: '#ff7b6b' },
    { k: 'OUT', lo: 29, hi: 60, w: 'OUT', c: '#d9d0bc' }, { k: '1B', lo: 61, hi: 82, w: 'SINGLE', c: '#7ee08a' },
    { k: '2B', lo: 83, hi: 91, w: 'DOUBLE', c: '#5fd67a' }, { k: '3B', lo: 92, hi: 93, w: 'TRIPLE', c: '#ffd860' },
    { k: 'HR', lo: 94, hi: 100, w: 'HOME RUN!', c: '#ffb13d' }
  ];
  const zoneOf = n => ZONES.find(z => n >= z.lo && n <= z.hi);

  // ── tray / dice dimensions (world units) ──
  const TRAY_W = 12, TRAY_D = 7.6, WALL_H = 1.1;
  const R = 0.95, H = R * 1.08;                 // d10 ring radius / apex height
  const FPS = 60, MAX_FRAMES = 480;

  function start() {
    const T = window.THREE, C = window.CANNON;

    // ── d10 geometry: pentagonal trapezohedron, apex on local +z ──
    const cs = Math.cos(Math.PI / 5);
    const z0 = H * (1 - cs) / (1 + cs);         // keeps every kite planar
    const V = [new T.Vector3(0, 0, H), new T.Vector3(0, 0, -H)];
    for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5; V.push(new T.Vector3(R * Math.cos(a), R * Math.sin(a), z0)); }
    for (let k = 0; k < 5; k++) { const a = (k + 0.5) * 2 * Math.PI / 5; V.push(new T.Vector3(R * Math.cos(a), R * Math.sin(a), -z0)); }
    const U = k => 2 + (k % 5), L = k => 7 + (k % 5);
    // faces 0-4 top kites, 5-9 bottom kites; each [apex, side, far, side]
    const FACES = [];
    for (let k = 0; k < 5; k++) FACES.push([0, U(k), L(k), U(k + 1)]);
    for (let k = 0; k < 5; k++) FACES.push([1, L(k), U(k + 1), L(k + 1)]);
    const NORMALS = [];
    FACES.forEach((f, i) => {
      const [a, b, c] = f.map(j => V[j]);
      let n = new T.Vector3().subVectors(b, a).cross(new T.Vector3().subVectors(c, a)).normalize();
      const cen = f.reduce((s, j) => s.add(V[j]), new T.Vector3()).multiplyScalar(0.25);
      if (n.dot(cen) < 0) { f.reverse(); n.negate(); }   // outward, counter-clockwise from outside
      NORMALS.push(n);
    });
    // real d10 numbering: opposite faces add up to 9 (top k is opposite bottom k+2)
    const FACE_VALUE = [0, 2, 4, 6, 8, 3, 1, 9, 7, 5];

    // the 10 rotations that map the die onto itself (5 about the axis, 5 half-turns)
    const SYM = [];
    for (let k = 0; k < 5; k++) {
      const qz = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), k * 2 * Math.PI / 5);
      SYM.push(qz.clone());
      const flip = new T.Quaternion().setFromAxisAngle(new T.Vector3(Math.cos(Math.PI / 10), Math.sin(Math.PI / 10), 0), Math.PI);
      SYM.push(qz.clone().multiply(flip));
    }
    const symFor = (from, to) => SYM.find(q => NORMALS[from].clone().applyQuaternion(q).dot(NORMALS[to]) > 0.999) || new T.Quaternion();

    // ── textures ──
    function faceUV(f) {
      const pts = f.map(j => V[j]);
      const apex = pts.find(p => Math.abs(Math.abs(p.z) - H) < 1e-6);
      const far = pts[(pts.indexOf(apex) + 2) % 4];
      const n = new T.Vector3().subVectors(pts[1], pts[0]).cross(new T.Vector3().subVectors(pts[2], pts[0])).normalize();
      const Y = new T.Vector3().subVectors(apex, far); Y.sub(n.clone().multiplyScalar(Y.dot(n))).normalize();
      const X = new T.Vector3().crossVectors(Y, n);
      const loc = pts.map(p => [p.dot(X), p.dot(Y)]);
      const minX = Math.min(...loc.map(l => l[0])), maxX = Math.max(...loc.map(l => l[0]));
      const minY = Math.min(...loc.map(l => l[1])), maxY = Math.max(...loc.map(l => l[1]));
      const size = Math.max(maxX - minX, maxY - minY) * 1.04, cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const uv = loc.map(([x, y]) => [0.5 + (x - cx) / size, 0.5 + (y - cy) / size]);
      const sideV = uv[(pts.indexOf(apex) + 1) % 4][1];
      return { uv, sideV };
    }
    const UVS = FACES.map(faceUV);
    function faceTexture(label, style, sideV) {
      const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
      const g = cv.getContext('2d');
      const grd = g.createLinearGradient(0, 0, 0, S);
      grd.addColorStop(0, style.top); grd.addColorStop(1, style.bottom);
      g.fillStyle = grd; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${style.speck},${Math.random() * 0.06})`; g.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
      const y = (1 - (sideV + 0.07)) * S;
      g.font = `bold ${label.length > 1 ? 66 : 92}px Oswald, 'Arial Narrow', Arial, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = style.inkShadow; g.fillText(label, S / 2 + 2, y + 3);
      g.fillStyle = style.ink; g.fillText(label, S / 2, y);
      if (label === '6' || label === '9') { g.fillRect(S / 2 - 18, y + 44, 36, 7); }
      const tx = new T.CanvasTexture(cv); tx.anisotropy = 8; tx.encoding = T.sRGBEncoding; return tx;
    }
    const STYLES = {
      tens: { top: '#fbf3dc', bottom: '#e6d6ad', speck: '90,60,20', ink: '#1d2a4a', inkShadow: 'rgba(0,0,0,.18)' },
      units: { top: '#c8202c', bottom: '#8c0f19', speck: '255,220,200', ink: '#fff7e6', inkShadow: 'rgba(0,0,0,.45)' }
    };
    function diceMaterials(kind) {
      return FACES.map((f, i) => {
        const v = FACE_VALUE[i];
        const label = kind === 'tens' ? (v === 0 ? '00' : String(v * 10)) : String(v);
        return new T.MeshStandardMaterial({ map: faceTexture(label, STYLES[kind], UVS[i].sideV), roughness: 0.32, metalness: 0.02, emissive: new T.Color(0x000000) });
      });
    }
    function diceGeometry() {
      const pos = [], nor = [], uv = [], geo = new T.BufferGeometry();
      FACES.forEach((f, i) => {
        const tri = [[0, 1, 2], [0, 2, 3]];
        geo.addGroup(pos.length / 3, 6, i);
        tri.forEach(t => t.forEach(j => {
          const p = V[f[j]]; pos.push(p.x, p.y, p.z);
          nor.push(NORMALS[i].x, NORMALS[i].y, NORMALS[i].z);
          uv.push(UVS[i].uv[j][0], UVS[i].uv[j][1]);
        }));
      });
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      return geo;
    }

    // ── DOM ──
    const root = document.createElement('div');
    root.id = 'pdice';
    root.innerHTML = `
      <style>
        #pdice{position:fixed;inset:0;z-index:99999;background:radial-gradient(ellipse at 50% 30%,#1c2a22 0%,#070b09 70%);color:#f3ead2;font-family:Oswald,Arial,sans-serif;overflow:hidden;user-select:none}
        #pdice canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}
        #pdice canvas.drag{cursor:grabbing}
        #pdice .pd-top{position:absolute;top:14px;left:18px;right:18px;display:flex;align-items:center;gap:14px;pointer-events:none}
        #pdice .pd-title{font-family:'Press Start 2P',monospace;font-size:11px;color:#ffd97a;letter-spacing:1px;text-shadow:0 2px 0 #000}
        #pdice .pd-sub{font-size:13px;color:#9fb9a8;letter-spacing:.5px}
        #pdice .pd-x{margin-left:auto;pointer-events:auto;background:#13241c;border:1px solid #2f6b4c;color:#cfe;border-radius:6px;padding:6px 12px;font:600 13px Oswald,sans-serif;cursor:pointer}
        #pdice .pd-res{position:absolute;top:70px;left:50%;transform:translateX(-50%) scale(.6);opacity:0;text-align:center;pointer-events:none;transition:transform .35s cubic-bezier(.2,1.6,.4,1),opacity .2s}
        #pdice .pd-res.on{transform:translateX(-50%) scale(1);opacity:1}
        #pdice .pd-res b{display:block;font-family:VT323,monospace;font-size:96px;line-height:.85;color:#ffe08a;text-shadow:0 0 22px rgba(255,200,80,.45),0 4px 0 #000}
        #pdice .pd-res span{font-size:14px;color:#c9d8cc;letter-spacing:2px}
        #pdice .pd-res em{display:inline-block;margin-top:6px;font-style:normal;font:700 22px 'Alfa Slab One',Oswald,serif;letter-spacing:1px;padding:3px 14px;border-radius:4px;background:#0d1712;border:2px solid currentColor;transform:rotate(-3deg)}
        #pdice .pd-bar{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px)}
        #pdice .pd-chip{background:#0f1c16;border:1px solid #2f6b4c;border-radius:6px;padding:8px 11px;font:600 13px Oswald,sans-serif;color:#cfe;cursor:pointer}
        #pdice .pd-chip.on{border-color:#ffd97a;color:#ffd97a}
        #pdice .pd-chip input{width:54px;background:#08110c;border:1px solid #2f6b4c;color:#ffe08a;font:600 14px Oswald;border-radius:4px;padding:2px 4px;margin-left:6px;text-align:center}
        #pdice .pd-roll{position:relative;overflow:hidden;min-width:190px;padding:14px 26px;border-radius:10px;border:2px solid #6b4a0c;background:linear-gradient(180deg,#ffe58a,#c9a24a 60%,#a47a26);color:#2a1a0e;font:700 22px 'Alfa Slab One',Oswald,serif;letter-spacing:1px;box-shadow:0 5px 0 #6b4a0c,0 10px 24px rgba(0,0,0,.6);cursor:pointer;touch-action:none}
        #pdice .pd-roll:active{transform:translateY(3px);box-shadow:0 2px 0 #6b4a0c,0 6px 14px rgba(0,0,0,.6)}
        #pdice .pd-roll i{position:absolute;left:0;bottom:0;height:5px;width:0;background:linear-gradient(90deg,#5fd67a,#ffd860,#ff5a3c)}
        #pdice .pd-hint{position:absolute;left:50%;top:40px;transform:translateX(-50%);font-size:12.5px;color:#8fae9b;letter-spacing:.4px;white-space:nowrap;text-shadow:0 1px 0 #000}
        #pdice .pd-err{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fca5a5}
        @media (max-width:640px){#pdice .pd-res{top:50px}#pdice .pd-res b{font-size:64px}#pdice .pd-sub,#pdice .pd-hint{display:none}#pdice .pd-bar{gap:6px}#pdice .pd-chip{padding:6px 8px;font-size:11.5px}#pdice .pd-chip input{width:40px}#pdice .pd-roll{min-width:150px;font-size:18px;padding:12px 18px}}
      </style>
      <canvas></canvas>
      <div class="pd-top"><span class="pd-title">D100 · DICE TABLE</span><span class="pd-sub">prototype — physics, real faces, synthesised sound</span><button class="pd-x" data-a="close">✕ CLOSE</button></div>
      <div class="pd-res"><b>--</b><span></span><br><em></em></div>
      <div class="pd-hint">Hold ROLL (or SPACE) to shake, release to throw · flick across the felt to throw by hand · click while rolling to skip</div>
      <div class="pd-bar">
        <label class="pd-chip">TARGET<input type="text" value="" placeholder="rand" maxlength="3" data-a="target"></label>
        <button class="pd-chip" data-a="speed">SPEED: NORMAL</button>
        <button class="pd-chip on" data-a="sound">SOUND: ON</button>
        <button class="pd-roll" data-a="roll">ROLL DICE<i></i></button>
      </div>`;
    document.body.appendChild(root);
    const $ = s => root.querySelector(s);
    const canvas = $('canvas');

    // ── renderer / scene ──
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
    const CAM_HOME = new T.Vector3(0, 13.2, 9.4), LOOK_HOME = new T.Vector3(0, 0, 0.5);
    const cam = { pos: CAM_HOME.clone(), look: LOOK_HOME.clone(), tPos: CAM_HOME.clone(), tLook: LOOK_HOME.clone(), shake: 0 };

    scene.add(new T.HemisphereLight(0xfff1d6, 0x1a120a, 0.5));
    const key = new T.DirectionalLight(0xffe2b8, 1.6);
    key.position.set(-5, 14, 6); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -9, right: 9, top: 7, bottom: -7, near: 1, far: 40 });
    key.shadow.bias = -0.0006; key.shadow.radius = 4;
    scene.add(key);
    const rim = new T.PointLight(0x7fd0ff, 0.5, 30); rim.position.set(7, 5, -6); scene.add(rim);
    const lamp = new T.PointLight(0xffc77a, 0.35, 22); lamp.position.set(0, 8, 2); scene.add(lamp);

    // felt
    function feltTexture() {
      const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
      const g = cv.getContext('2d');
      g.fillStyle = '#6e141a'; g.fillRect(0, 0, S, S);
      const img = g.getImageData(0, 0, S, S), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 26; d[i] += n; d[i + 1] += n * 0.5; d[i + 2] += n * 0.5; }
      g.putImageData(img, 0, 0);
      const tx = new T.CanvasTexture(cv); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(3, 2); tx.encoding = T.sRGBEncoding; return tx;
    }
    function feltPrint() {
      const W = 1024, Hh = 650, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
      const g = cv.getContext('2d');
      g.strokeStyle = 'rgba(255,214,140,.22)'; g.lineWidth = 6;
      g.strokeRect(26, 26, W - 52, Hh - 52);
      g.lineWidth = 2; g.strokeRect(40, 40, W - 80, Hh - 80);
      // printed diamond
      g.save(); g.translate(W / 2, Hh / 2 + 10); g.rotate(Math.PI / 4);
      g.strokeStyle = 'rgba(255,214,140,.16)'; g.lineWidth = 5; g.strokeRect(-110, -110, 220, 220); g.restore();
      g.fillStyle = 'rgba(255,214,140,.16)'; g.font = "bold 58px 'Alfa Slab One', Georgia, serif"; g.textAlign = 'center';
      g.fillText('BASEROGUE', W / 2, 120);
      g.font = "600 24px Oswald, Arial"; g.fillText('· D100 ·  TENS  +  UNITS  ·  00 + 0 = 100 ·', W / 2, Hh - 70);
      const tx = new T.CanvasTexture(cv); tx.anisotropy = 4; tx.encoding = T.sRGBEncoding; return tx;
    }
    function woodTexture() {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 64;
      const g = cv.getContext('2d');
      const grd = g.createLinearGradient(0, 0, 0, 64); grd.addColorStop(0, '#6b3f1f'); grd.addColorStop(1, '#3d2210');
      g.fillStyle = grd; g.fillRect(0, 0, 512, 64);
      for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(${20 + Math.random() * 40},${10 + Math.random() * 20},0,${0.2 + Math.random() * 0.3})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * 64; g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 40 + i) * 3); g.stroke(); }
      const tx = new T.CanvasTexture(cv); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.encoding = T.sRGBEncoding; return tx;
    }
    const floor = new T.Mesh(new T.PlaneGeometry(TRAY_W, TRAY_D), new T.MeshStandardMaterial({ map: feltTexture(), roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const print = new T.Mesh(new T.PlaneGeometry(TRAY_W, TRAY_D), new T.MeshStandardMaterial({ map: feltPrint(), transparent: true, roughness: 1, depthWrite: false }));
    print.rotation.x = -Math.PI / 2; print.position.y = 0.002; print.receiveShadow = true; scene.add(print);
    const woodMat = new T.MeshStandardMaterial({ map: woodTexture(), roughness: 0.55, metalness: 0.05 });
    const RAIL = 0.6;
    [[0, -(TRAY_D / 2 + RAIL / 2), TRAY_W + RAIL * 2, RAIL], [0, TRAY_D / 2 + RAIL / 2, TRAY_W + RAIL * 2, RAIL],
     [-(TRAY_W / 2 + RAIL / 2), 0, RAIL, TRAY_D], [TRAY_W / 2 + RAIL / 2, 0, RAIL, TRAY_D]].forEach(([x, z, w, d]) => {
      const m = new T.Mesh(new T.BoxGeometry(w, WALL_H, d), woodMat); m.position.set(x, WALL_H / 2, z);
      m.castShadow = true; m.receiveShadow = true; scene.add(m);
      // thin brass strip along the inner edge of the rail
      const inner = w > d ? [w, 0.09] : [0.09, d];
      const cap = new T.Mesh(new T.BoxGeometry(inner[0] + 0.02, 0.05, inner[1] + 0.02), new T.MeshStandardMaterial({ color: 0xb8913f, metalness: 0.8, roughness: 0.35 }));
      cap.position.set(w > d ? x : x - Math.sign(x) * (RAIL / 2 - 0.05), WALL_H + 0.025, w > d ? z - Math.sign(z) * (RAIL / 2 - 0.05) : z); scene.add(cap);
    });
    const under = new T.Mesh(new T.BoxGeometry(TRAY_W + RAIL * 2 + 0.4, 0.4, TRAY_D + RAIL * 2 + 0.4), woodMat);
    under.position.y = -0.21; under.receiveShadow = true; scene.add(under);

    const dice = ['tens', 'units'].map(kind => {
      const mats = diceMaterials(kind);
      const mesh = new T.Mesh(diceGeometry(), mats);
      mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
      return { kind, mesh, mats };
    });
    dice[0].mesh.position.set(-0.9, H * 0.82, 0.4); dice[1].mesh.position.set(0.9, H * 0.82, 0.2);
    dice.forEach((d, i) => d.mesh.quaternion.setFromUnitVectors(NORMALS[i ? 3 : 0].clone(), new T.Vector3(0, 1, 0)));

    function resize() {
      const w = root.clientWidth, h = root.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      // phones: back off so the whole tray fits the narrow screen
      const narrow = w / h < 1;
      if (narrow) CAM_HOME.set(15, 24, 0.01); else CAM_HOME.set(0, 13.2, 9.4);   // portrait: look down the long side
      if (!state.rolling) { cam.tPos.copy(CAM_HOME); }
      camera.updateProjectionMatrix();
    }

    // ── physics: simulate the whole throw before showing it ──
    function simulate(throwSpec) {
      const world = new C.World();
      world.gravity.set(0, -38, 0);
      world.broadphase = new C.NaiveBroadphase();
      world.solver.iterations = 16;
      const mDie = new C.Material('die'), mFloor = new C.Material('floor'), mWall = new C.Material('wall');
      world.addContactMaterial(new C.ContactMaterial(mDie, mFloor, { friction: 0.32, restitution: 0.38 }));
      world.addContactMaterial(new C.ContactMaterial(mDie, mWall, { friction: 0.1, restitution: 0.62 }));
      world.addContactMaterial(new C.ContactMaterial(mDie, mDie, { friction: 0.12, restitution: 0.55 }));
      const ground = new C.Body({ mass: 0, material: mFloor }); ground.addShape(new C.Plane());
      ground.quaternion.setFromAxisAngle(new C.Vec3(1, 0, 0), -Math.PI / 2); world.addBody(ground);
      ground.userData = 'felt';
      [[0, -(TRAY_D / 2 + 1), TRAY_W / 2 + 2, 1], [0, TRAY_D / 2 + 1, TRAY_W / 2 + 2, 1],
       [-(TRAY_W / 2 + 1), 0, 1, TRAY_D / 2 + 2], [TRAY_W / 2 + 1, 0, 1, TRAY_D / 2 + 2]].forEach(([x, z, hw, hd]) => {
        const b = new C.Body({ mass: 0, material: mWall }); b.addShape(new C.Box(new C.Vec3(hw, 12, hd)));
        b.position.set(x, 12, z); b.userData = 'wood'; world.addBody(b);
      });
      const shape = () => new C.ConvexPolyhedron(V.map(v => new C.Vec3(v.x, v.y, v.z)), FACES.map(f => f.slice()));
      const bodies = throwSpec.map((t, i) => {
        const b = new C.Body({ mass: 1, material: mDie }); b.addShape(shape());
        b.position.set(t.p.x, t.p.y, t.p.z);
        b.quaternion.setFromEuler(t.r.x, t.r.y, t.r.z);
        b.velocity.set(t.v.x, t.v.y, t.v.z); b.angularVelocity.set(t.w.x, t.w.y, t.w.z);
        b.linearDamping = 0.12; b.angularDamping = 0.12; b.userData = 'die' + i;
        world.addBody(b); return b;
      });
      const frames = [], hits = [], lastHit = [-99, -99];
      bodies.forEach((b, i) => b.addEventListener('collide', e => {
        let v = 0;
        try { v = Math.abs(e.contact.getImpactVelocityAlongNormal()); } catch (err) { v = b.velocity.norm(); }
        const f = frames.length;
        if (v < 0.6 || f - lastHit[i] < 3) return;
        lastHit[i] = f;
        hits.push({ f, v, what: String(e.body.userData).startsWith('die') ? 'die' : e.body.userData, i });
      }));
      let still = 0;
      for (let f = 0; f < MAX_FRAMES; f++) {
        world.step(1 / FPS);
        frames.push(bodies.map(b => [b.position.x, b.position.y, b.position.z, b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w]));
        const calm = bodies.every(b => b.velocity.norm() < 0.08 && b.angularVelocity.norm() < 0.1);
        still = calm ? still + 1 : 0;
        if (still > 18 && f > 40) break;
      }
      const tops = bodies.map(b => {
        const q = new T.Quaternion(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
        let best = -2, face = 0;
        NORMALS.forEach((n, i) => { const y = n.clone().applyQuaternion(q).y; if (y > best) { best = y; face = i; } });
        return { face, up: best };
      });
      return { frames, hits, tops };
    }

    function randomThrow(power, origin, dir) {
      const p = power;
      const base = origin || new T.Vector3(TRAY_W / 2 - 1.2, 3.2, (Math.random() - 0.5) * 3);
      const d = dir || new T.Vector3(-1, 0, (Math.random() - 0.5) * 0.5).normalize();
      const side = new T.Vector3(-d.z, 0, d.x);
      const rnd = (a) => (Math.random() - 0.5) * 2 * a;
      return [-0.55, 0.55].map(off => ({
        p: base.clone().add(side.clone().multiplyScalar(off * 1.9)).add(new T.Vector3(rnd(0.2), rnd(0.15), rnd(0.2))),
        r: new T.Vector3(rnd(Math.PI), rnd(Math.PI), rnd(Math.PI)),
        v: d.clone().multiplyScalar((9 + 7 * p) * (0.9 + Math.random() * 0.2)).add(new T.Vector3(0, 1 + 3 * p, 0)),
        w: new T.Vector3(rnd(14 + 10 * p), rnd(14 + 10 * p), rnd(14 + 10 * p))
      }));
    }

    // ── sound (synthesised; no files) ──
    let actx = null, soundOn = true;
    try { soundOn = localStorage.getItem('baserogue_muted') !== 'true'; } catch (e) {}
    const audio = () => { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (actx && actx.state === 'suspended') actx.resume(); return actx; };
    let noiseBuf = null;
    function noise(ctx) {
      if (noiseBuf) return noiseBuf;
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return noiseBuf;
    }
    function hitSound(what, v, when) {
      if (!soundOn) return; const ctx = audio(); if (!ctx) return;
      const t = ctx.currentTime + (when || 0), vol = Math.min(1, v / 9);
      const out = ctx.createGain(); out.connect(ctx.destination);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const filt = ctx.createBiquadFilter();
      const tone = ctx.createOscillator(), tg = ctx.createGain();
      if (what === 'die') {          // dice on dice: bright clack
        filt.type = 'bandpass'; filt.frequency.value = 3200 + Math.random() * 900; filt.Q.value = 6;
        tone.frequency.value = 2100 + Math.random() * 500; tone.type = 'triangle';
        out.gain.setValueAtTime(0.55 * vol, t); out.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        tg.gain.setValueAtTime(0.25 * vol, t); tg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      } else if (what === 'wood') {  // dice against the wooden rail: hollow knock
        filt.type = 'bandpass'; filt.frequency.value = 1100 + Math.random() * 300; filt.Q.value = 3;
        tone.frequency.value = 260 + Math.random() * 60; tone.type = 'sine';
        out.gain.setValueAtTime(0.7 * vol, t); out.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        tg.gain.setValueAtTime(0.5 * vol, t); tg.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      } else {                       // felt: muffled thud
        filt.type = 'lowpass'; filt.frequency.value = 700 + 900 * vol; filt.Q.value = 0.8;
        tone.frequency.value = 140 + Math.random() * 40; tone.type = 'sine';
        out.gain.setValueAtTime(0.65 * vol, t); out.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        tg.gain.setValueAtTime(0.35 * vol, t); tg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      }
      src.connect(filt); filt.connect(out); tone.connect(tg); tg.connect(ctx.destination);
      src.start(t, Math.random() * 0.2, 0.15); tone.start(t); tone.stop(t + 0.16);
    }
    function rattle() { hitSound('die', 2 + Math.random() * 3); if (Math.random() < 0.5) hitSound('wood', 1.5 + Math.random() * 2, 0.02); }
    function settleChime(big) {
      if (!soundOn) return; const ctx = audio(); if (!ctx) return;
      const t = ctx.currentTime;
      (big ? [523, 659, 784, 1047] : [659, 880]).forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t + i * 0.07); g.gain.linearRampToValueAtTime(0.08, t + i * 0.07 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.5);
        o.connect(g); g.connect(ctx.destination); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.55);
      });
    }

    // ── roll flow ──
    const state = { rolling: false, sim: null, sym: null, t0: 0, speed: 1, hitIdx: 0, charging: false, charge: 0, chargeT0: 0, lastRattle: 0, result: null, glow: 0 };
    const tmpQ = new T.Quaternion();

    function pickTarget() {
      const raw = $('[data-a="target"]').value.trim();
      const n = parseInt(raw, 10);
      return (n >= 1 && n <= 100) ? n : 1 + Math.floor(Math.random() * 100);
    }
    function splitD100(n) { return n === 100 ? [0, 0] : [Math.floor(n / 10), n % 10]; }

    function roll(power, origin, dir) {
      if (state.rolling) return;
      audio();
      const target = pickTarget();
      const want = splitD100(target).map(v => FACE_VALUE.indexOf(v));
      let sim = null;
      for (let tries = 0; tries < 8; tries++) {
        sim = simulate(randomThrow(power, origin, dir));
        if (sim.tops.every(t => t.up > 0.97)) break;   // never land cocked against the rail
      }
      state.sim = sim;
      state.sym = sim.tops.map((t, i) => symFor(want[i], t.face));
      state.result = { target, faces: sim.tops.map(t => t.face) };
      state.rolling = true; state.t0 = performance.now(); state.hitIdx = 0;
      dice.forEach(d => d.mats.forEach(m => m.emissive.setRGB(0, 0, 0)));
      $('.pd-res').classList.remove('on');
      cam.tPos.copy(CAM_HOME); cam.tLook.copy(LOOK_HOME);
    }

    function applyFrame(f) {
      const fr = state.sim.frames[Math.min(f, state.sim.frames.length - 1)];
      dice.forEach((d, i) => {
        const s = fr[i];
        d.mesh.position.set(s[0], s[1], s[2]);
        tmpQ.set(s[3], s[4], s[5], s[6]);
        d.mesh.quaternion.copy(tmpQ).multiply(state.sym[i]);
      });
    }

    function finish() {
      state.rolling = false;
      applyFrame(Infinity);
      const { target, faces } = state.result;
      const [tv, uv] = splitD100(target);
      const z = zoneOf(target);
      const res = $('.pd-res');
      res.querySelector('b').textContent = target;
      res.querySelector('span').textContent = `${tv === 0 ? '00' : tv * 10}  +  ${uv}${target === 100 ? '   (00 + 0 = 100)' : ''}`;
      const em = res.querySelector('em'); em.textContent = z.w; em.style.color = z.c;
      res.classList.add('on');
      // the faces that read the number glow (the symmetry put the wanted face where the landed one was)
      state.glowFaces = faces.map((f, i) => {
        const want = FACE_VALUE.indexOf(splitD100(target)[i]);
        return dice[i].mats[want];
      });
      state.glow = 1;
      settleChime(z.k === 'HR' || z.k === '3B');
      // lean the camera in on the pair
      const mid = dice[0].mesh.position.clone().add(dice[1].mesh.position).multiplyScalar(0.5);
      cam.tLook.copy(mid);
      cam.tPos.copy(mid).add(CAM_HOME.clone().sub(LOOK_HOME).multiplyScalar(0.62));
    }

    // ── input: hold to shake, release to throw; flick on the felt; click to skip ──
    const rollBtn = $('[data-a="roll"]'), meter = rollBtn.querySelector('i');
    function chargeStart() { if (state.rolling || state.charging) return; audio(); state.charging = true; state.chargeT0 = performance.now(); state.charge = 0; }
    function chargeEnd() {
      if (!state.charging) return;
      state.charging = false; meter.style.width = '0';
      roll(state.charge < 0.08 ? 0.45 : state.charge);
    }
    rollBtn.addEventListener('pointerdown', e => { e.preventDefault(); chargeStart(); });
    window.addEventListener('pointerup', chargeEnd);
    const onKey = e => {
      if (e.code !== 'Space') return; e.preventDefault();
      if (e.type === 'keydown' && !e.repeat) { if (state.rolling) skip(); else chargeStart(); }
      if (e.type === 'keyup') chargeEnd();
    };
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
    function skip() { if (state.rolling) { state.t0 = -1e9; } }

    const ray = new T.Raycaster(), ndc = new T.Vector2(), tablePlane = new T.Plane(new T.Vector3(0, 1, 0), -3);
    const toTable = (e) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const p = new T.Vector3(); return ray.ray.intersectPlane(tablePlane, p) ? p : null;
    };
    let drag = null;
    canvas.addEventListener('pointerdown', e => {
      if (state.rolling) { skip(); return; }
      const p = toTable(e); if (!p) return;
      drag = { p, x: e.clientX, y: e.clientY, t: performance.now() }; canvas.classList.add('drag');
    });
    canvas.addEventListener('pointerup', e => {
      canvas.classList.remove('drag');
      if (!drag) return;
      const p2 = toTable(e), dt = Math.max(40, performance.now() - drag.t);
      const d = drag; drag = null;
      if (!p2) return;
      const v = p2.clone().sub(d.p); v.y = 0;
      if (v.length() < 0.6) return;                    // a tap is not a throw
      const speed = v.length() / (dt / 1000);
      const origin = d.p.clone(); origin.y = 3;
      origin.x = Math.max(-TRAY_W / 2 + 1, Math.min(TRAY_W / 2 - 1, origin.x));
      origin.z = Math.max(-TRAY_D / 2 + 1, Math.min(TRAY_D / 2 - 1, origin.z));
      roll(Math.max(0.2, Math.min(1.3, speed / 22)), origin, v.normalize());
    });

    root.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'close') close();
      if (a.dataset.a === 'speed') { state.speed = state.speed === 1 ? 1.8 : 1; a.textContent = 'SPEED: ' + (state.speed === 1 ? 'NORMAL' : 'FAST'); a.classList.toggle('on', state.speed !== 1); }
      if (a.dataset.a === 'sound') { soundOn = !soundOn; a.textContent = 'SOUND: ' + (soundOn ? 'ON' : 'OFF'); a.classList.toggle('on', soundOn); }
    });

    // ── main loop ──
    let raf = 0, alive = true, last = performance.now();
    function frame(now) {
      if (!alive) return;
      const dtS = Math.min(0.05, (now - last) / 1000); last = now;
      if (state.charging) {
        state.charge = Math.min(1.3, (now - state.chargeT0) / 1100);
        meter.style.width = (state.charge / 1.3 * 100) + '%';
        // dice jostle in the hand above the right rail
        dice.forEach((d, i) => {
          const j = 0.12 + state.charge * 0.25;
          d.mesh.position.set(TRAY_W / 2 - 1.3 + (Math.random() - 0.5) * j, 3 + (Math.random() - 0.5) * j, (i ? 0.6 : -0.6) + (Math.random() - 0.5) * j);
          d.mesh.rotation.x += (Math.random() - 0.5) * 0.9; d.mesh.rotation.y += (Math.random() - 0.5) * 0.9;
        });
        if (now - state.lastRattle > 70 + Math.random() * 60) { state.lastRattle = now; rattle(); }
      }
      if (state.rolling) {
        const f = Math.floor((now - state.t0) / 1000 * FPS * state.speed);
        const sim = state.sim;
        if (state.t0 < 0 || f >= sim.frames.length - 1) {
          // skipped or done: play nothing more of the queue
          finish();
        } else {
          applyFrame(f);
          while (state.hitIdx < sim.hits.length && sim.hits[state.hitIdx].f <= f) {
            const h = sim.hits[state.hitIdx++];
            hitSound(h.what, h.v);
            if (h.v > 7) cam.shake = Math.min(0.35, cam.shake + h.v * 0.012);
          }
        }
      }
      if (state.glow > 0 && state.glowFaces) {
        state.glow = Math.max(0, state.glow - dtS * 0.25);
        const k = 0.35 + 0.25 * Math.sin(now / 160);
        state.glowFaces.forEach(m => m.emissive.setRGB(0.55 * k, 0.42 * k, 0.12 * k));
        if (state.glow === 0) state.glowFaces.forEach(m => m.emissive.setRGB(0.12, 0.09, 0.02));
      }
      cam.pos.lerp(cam.tPos, 1 - Math.pow(0.02, dtS)); cam.look.lerp(cam.tLook, 1 - Math.pow(0.02, dtS));
      camera.position.copy(cam.pos);
      if (cam.shake > 0.001) { camera.position.x += (Math.random() - 0.5) * cam.shake; camera.position.y += (Math.random() - 0.5) * cam.shake; cam.shake *= Math.pow(0.002, dtS); }
      camera.lookAt(cam.look);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function close() {
      alive = false; cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
      window.removeEventListener('pointerup', chargeEnd); window.removeEventListener('resize', resize);
      renderer.dispose(); root.remove();
    }
    window.addEventListener('resize', resize);
    resize(); cam.pos.copy(CAM_HOME); raf = requestAnimationFrame(frame);

    // test hooks for the agent's headless preview (frames do not advance there)
    window.__protoDice = {
      roll, finish, skip,
      renderAt(ms) { if (state.rolling) applyFrame(Math.floor(ms / 1000 * FPS)); camera.position.copy(cam.pos); camera.lookAt(cam.look); renderer.render(scene, camera); },
      check(n) { $('[data-a="target"]').value = n; roll(0.6); const r = state.result; finish(); return { target: n, read: dice.map((d, i) => { let best = -2, face = 0; NORMALS.forEach((nn, j) => { const y = nn.clone().applyQuaternion(d.mesh.quaternion).y; if (y > best) { best = y; face = j; } }); return FACE_VALUE[face]; }), frames: state.sim.frames.length, hits: state.sim.hits.length, up: state.sim.tops.map(t => t.up.toFixed(3)) }; }
    };
  }

  function boot() {
    Promise.all([loadScript(LIBS[0]), loadScript(LIBS[1])]).then(start).catch(err => {
      const d = document.createElement('div'); d.id = 'pdice';
      d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#070b09;color:#fca5a5;display:flex;align-items:center;justify-content:center;font:16px Oswald,sans-serif';
      d.textContent = 'Could not load the 3D libraries (' + err.message + '). Check the internet connection.';
      document.body.appendChild(d);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
