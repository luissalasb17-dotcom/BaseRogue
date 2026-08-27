/**
 * BaseRogue AudioManager
 * ──────────────────────
 * Synthesizes all game audio, background music (BGM), and stadium ambiance
 * using the Web Audio API.
 * No external files required — zero bandwidth, works 100% offline, smooth background levels.
 * Optimized for mobile memory management & zero audio graph leaks.
 */

(function () {
  'use strict';

  // ── Context ───────────────────────────────────────────────────────────────────
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          ctx = new AudioCtx({ latencyHint: 'playback' });
          ctx.onstatechange = () => {
            if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted') && !_muted && currentBGMMode !== 'off') {
              // Soft auto-resume
            }
          };
        }
      } catch (e) {
        return null;
      }
    }
    if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // ── Master & Bus Gains ────────────────────────────────────────────────────────
  let masterGain = null;
  let sfxGain = null;
  let bgmGain = null;

  function initGains() {
    const c = getCtx();
    if (!c) return;
    if (!masterGain) {
      masterGain = c.createGain();
      masterGain.gain.value = _muted ? 0 : 1;
      masterGain.connect(c.destination);

      sfxGain = c.createGain();
      sfxGain.gain.value = 0.65;
      sfxGain.connect(masterGain);

      bgmGain = c.createGain();
      bgmGain.gain.value = 0.14; // Cozy, moderate background volume
      bgmGain.connect(masterGain);
    }
  }

  // ── Mute state ────────────────────────────────────────────────────────────────
  let _muted = false;
  try { _muted = localStorage.getItem('baserogue_muted') === 'true'; } catch (e) {}

  function applyMuteState() {
    if (masterGain) {
      masterGain.gain.setValueAtTime(_muted ? 0 : 1, (ctx ? ctx.currentTime : 0));
    }
  }

  // ── Utility: connect SFX node to SFX bus ──────────────────────────────────────
  function connectSFX(node) {
    initGains();
    if (sfxGain) node.connect(sfxGain);
    else if (masterGain) node.connect(masterGain);
    return node;
  }

  // ── Shared Pre-generated Noise Buffer (Avoids GC thrashing on mobile) ──────────
  let sharedNoiseBuffer = null;
  function getNoiseBuffer(c) {
    if (!sharedNoiseBuffer || sharedNoiseBuffer.sampleRate !== c.sampleRate) {
      const size = Math.floor(c.sampleRate * 2.0); // 2 seconds of pre-generated white noise
      sharedNoiseBuffer = c.createBuffer(1, size, c.sampleRate);
      const data = sharedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    }
    return sharedNoiseBuffer;
  }

  // ── Synthesizer helpers with automatic node garbage collection ────────────────

  function tone(freq, dur, type = 'sine', vol = 0.3, delay = 0, attack = 0.005, release = null) {
    const c = getCtx();
    if (!c) return;
    initGains();
    if (release === null) release = dur * 0.7;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    const now = c.currentTime + delay;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    connectSFX(gain);

    // Auto-cleanup node from Web Audio graph when sound finishes
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  function noise(dur, vol = 0.3, delay = 0, filterFreq = 2000, filterType = 'bandpass') {
    const c = getCtx();
    if (!c) return;
    initGains();

    const src = c.createBufferSource();
    src.buffer = getNoiseBuffer(c);

    const filter = c.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;

    const gain = c.createGain();
    const now = c.currentTime + delay;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    connectSFX(gain);

    // Auto-cleanup node from Web Audio graph
    src.onended = () => {
      try {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    src.start(now);
    src.stop(now + dur + 0.05);
  }

  // ── BGM & AMBIANCE SYNTHESIS ENGINE ──────────────────────────────────────────
  let currentBGMMode = 'none'; // 'menu' | 'match' | 'off'
  let bgmIntervalTimer = null;
  let activeTrackGain = null;
  const activeBGMNodes = new Set();
  let currentBattleIntensity = 0; // 0 (normal), 1 (tension/runners), 2 (clutch/2 outs), 3 (climax/KO alert)

  function registerBGMNode(sourceNode, ...auxNodes) {
    activeBGMNodes.add(sourceNode);
    sourceNode.onended = () => {
      activeBGMNodes.delete(sourceNode);
      try { sourceNode.disconnect(); } catch (e) {}
      auxNodes.forEach(n => {
        try { if (n && n.disconnect) n.disconnect(); } catch (e) {}
      });
    };
  }

  // Frequencies in Hz (Extended for lush Balatro Jazz voicings)
  const N = {
    C2: 65.41, Db2: 69.30, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, Gb2: 92.50, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
    C3: 130.81, Db3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Gb3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
    C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Gb4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
    C5: 523.25, Db5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Gb5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00
  };

  function getTrackBus() {
    const c = getCtx();
    if (!c) return null;
    initGains();
    if (!activeTrackGain) {
      activeTrackGain = c.createGain();
      activeTrackGain.gain.setValueAtTime(1.0, c.currentTime);
      activeTrackGain.connect(bgmGain);
    }
    return activeTrackGain;
  }

  function stopAllBGM() {
    const c = getCtx();
    if (bgmIntervalTimer) {
      clearInterval(bgmIntervalTimer);
      bgmIntervalTimer = null;
    }
    if (activeTrackGain && c) {
      try {
        activeTrackGain.gain.setValueAtTime(activeTrackGain.gain.value, c.currentTime);
        activeTrackGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.03);
      } catch (e) {}
      const oldBus = activeTrackGain;
      setTimeout(() => {
        try { oldBus.disconnect(); } catch (e) {}
      }, 50);
      activeTrackGain = null;
    }
    activeBGMNodes.forEach(n => {
      try {
        if (typeof n.stop === 'function') n.stop();
        n.disconnect();
      } catch (e) {}
    });
    activeBGMNodes.clear();
    nextMenuLoopTime = 0;
    nextMatchLoopTime = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TRACK 1: PROCEDURAL BALATRO-STYLE CASINO LOUNGE ("Hypnotic Jazz Noir & Rhodes")
  // Generates lush extended 9th/13th chords with tremolo Rhodes, walking sub-bass,
  // ethereal vibraphone cascades, and a relaxed lo-fi swing groove.
  // ─────────────────────────────────────────────────────────────────────────────
  const MENU_BPM = 82;
  const MENU_BEAT = 60 / MENU_BPM; // ~0.731s
  const MENU_SIXTEENTH = MENU_BEAT / 4; // ~0.183s

  const BALATRO_PROGRESSIONS = [
    // Progression 1: Dm9 -> G13 -> Cmaj9 -> A7(b13) [Iconic Balatro Velvet Loop]
    [
      { notes: [N.F3, N.A3, N.C4, N.E4], bass: N.D2, bassWalk: [N.D2, N.A2, N.C3], t: 0 },
      { notes: [N.F3, N.B3, N.E4, N.A4], bass: N.G2, bassWalk: [N.G2, N.D3, N.F2], t: 16 },
      { notes: [N.E3, N.G3, N.B3, N.D4], bass: N.C2, bassWalk: [N.C2, N.G2, N.B2], t: 32 },
      { notes: [N.G3, N.C4, N.Db4, N.F4], bass: N.A2, bassWalk: [N.A2, N.E3, N.Eb2], t: 48 }
    ],
    // Progression 2: Fmaj9 -> Em9 -> Dm9 -> G7alt [Dreamy Casino Descent]
    [
      { notes: [N.E3, N.A3, N.C4, N.G4], bass: N.F2, bassWalk: [N.F2, N.C3, N.E2], t: 0 },
      { notes: [N.D3, N.G3, N.B3, N.F4], bass: N.E2, bassWalk: [N.E2, N.B2, N.Eb2], t: 16 },
      { notes: [N.C3, N.F3, N.A3, N.E4], bass: N.D2, bassWalk: [N.D2, N.A2, N.Ab2], t: 32 },
      { notes: [N.B3, N.Eb4, N.F4, N.Ab4], bass: N.G2, bassWalk: [N.G2, N.Db3, N.Gb2], t: 48 }
    ],
    // Progression 3: Bbmaj9 -> Am9 -> Gm9 -> C13(b9) [Smoky Late-Night Lounge]
    [
      { notes: [N.D3, N.F3, N.A3, N.C4], bass: N.Bb2, bassWalk: [N.Bb2, N.F2, N.A2], t: 0 },
      { notes: [N.C3, N.E3, N.G3, N.B3], bass: N.A2, bassWalk: [N.A2, N.E2, N.Ab2], t: 16 },
      { notes: [N.Bb2, N.D3, N.F3, N.A3], bass: N.G2, bassWalk: [N.G2, N.D2, N.Gb2], t: 32 },
      { notes: [N.Bb2, N.Db3, N.E3, N.A3], bass: N.C3, bassWalk: [N.C3, N.G2, N.B2], t: 48 }
    ],
    // Progression 4: Ebmaj9 -> Dm9 -> Cm9 -> F13 [Smooth Deck Shuffling Melancholy]
    [
      { notes: [N.G3, N.Bb3, N.D4, N.F4], bass: N.Eb2, bassWalk: [N.Eb2, N.Bb2, N.D2], t: 0 },
      { notes: [N.F3, N.A3, N.C4, N.E4], bass: N.D2, bassWalk: [N.D2, N.A2, N.Db2], t: 16 },
      { notes: [N.Eb3, N.G3, N.Bb3, N.D4], bass: N.C2, bassWalk: [N.C2, N.G2, N.B2], t: 32 },
      { notes: [N.Eb3, N.A3, N.D4, N.G4], bass: N.F2, bassWalk: [N.F2, N.C3, N.E2], t: 48 }
    ]
  ];

  const BALATRO_CHIME_SCALE = [
    N.C4, N.D4, N.E4, N.F4, N.G4, N.A4, N.B4,
    N.C5, N.D5, N.E5, N.F5, N.G5, N.A5, N.B5,
    N.C6, N.D6, N.E6
  ];

  let nextMenuLoopTime = 0;
  let menuProgressionIndex = 0;

  function generateBalatroMelody() {
    const melody = [];
    let curIdx = 7 + Math.floor(Math.random() * 4); // Start around C5-G5
    // Syncopated, playful casino placements (with space to breathe)
    const possibleSlots = [
      4, 7, 10, 14,
      20, 23, 26, 30,
      36, 39, 42, 46,
      52, 55, 58, 62
    ];

    possibleSlots.forEach((t, i) => {
      // Natural musical phrasing with 35% probability of rests
      if (Math.random() < 0.35 && i % 4 !== 0) return;

      const r = Math.random();
      if (r < 0.55) {
        curIdx += (Math.random() < 0.52 ? 1 : -1);
      } else if (r < 0.85) {
        curIdx += (Math.random() < 0.5 ? 2 : -2);
      } else {
        curIdx += (Math.random() < 0.5 ? 3 : -3);
      }
      curIdx = Math.max(0, Math.min(BALATRO_CHIME_SCALE.length - 1, curIdx));

      const dur = (Math.random() < 0.65) ? 3 : 2;
      melody.push({ f: BALATRO_CHIME_SCALE[curIdx], d: dur, t: t });
    });

    return melody;
  }

  function scheduleMenuMusicLoop() {
    const c = getCtx();
    if (!c || currentBGMMode !== 'menu' || _muted || (typeof document !== 'undefined' && document.hidden)) return;
    const bus = getTrackBus();
    if (!bus) return;

    const loopDur = 64 * MENU_SIXTEENTH; // ~11.7s loop
    const now = Math.max(c.currentTime + 0.05, nextMenuLoopTime);
    nextMenuLoopTime = now + loopDur;

    // Progression cycle
    const currentProg = BALATRO_PROGRESSIONS[menuProgressionIndex % BALATRO_PROGRESSIONS.length];
    menuProgressionIndex++;

    // ── 1. RHODES ELECTRIC PIANO (Dual Detuned Osc + Soft Tremolo) ────────────
    currentProg.forEach(chordObj => {
      const startTime = now + (chordObj.t * MENU_SIXTEENTH);
      const chordDur = 15 * MENU_SIXTEENTH;

      chordObj.notes.forEach(freq => {
        // Dual oscillator for lush analog chorus body
        const oscA = c.createOscillator();
        const oscB = c.createOscillator();
        const chordGain = c.createGain();
        const filter = c.createBiquadFilter();

        // Gentle Rhodes warm filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, startTime);
        filter.frequency.exponentialRampToValueAtTime(1400, startTime + chordDur);

        oscA.type = 'sine';
        oscA.frequency.setValueAtTime(freq, startTime);
        oscA.detune.setValueAtTime(3.5, startTime); // +3.5 cents

        oscB.type = 'triangle';
        oscB.frequency.setValueAtTime(freq, startTime);
        oscB.detune.setValueAtTime(-3.5, startTime); // -3.5 cents

        // Rhodes velocity envelope with soft swell & sustained bell decay
        chordGain.gain.setValueAtTime(0, startTime);
        chordGain.gain.linearRampToValueAtTime(0.038, startTime + 0.04);
        chordGain.gain.exponentialRampToValueAtTime(0.016, startTime + 0.6);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, startTime + chordDur);

        // LFO Tremolo effect (Classic 3.8 Hz Rhodes wobble)
        const tremoloOsc = c.createOscillator();
        const tremoloGain = c.createGain();
        tremoloOsc.type = 'sine';
        tremoloOsc.frequency.setValueAtTime(3.8, startTime);
        tremoloGain.gain.setValueAtTime(0.010, startTime); // Subtle depth

        tremoloOsc.connect(tremoloGain);
        tremoloGain.connect(chordGain.gain);

        oscA.connect(filter);
        oscB.connect(filter);
        filter.connect(chordGain);
        chordGain.connect(bus);

        registerBGMNode(oscA, oscB, chordGain, filter, tremoloOsc, tremoloGain);

        oscA.start(startTime);
        oscB.start(startTime);
        tremoloOsc.start(startTime);

        oscA.stop(startTime + chordDur + 0.05);
        oscB.stop(startTime + chordDur + 0.05);
        tremoloOsc.stop(startTime + chordDur + 0.05);
      });

      // ── 2. WALKING & DEEP LOUNGE SUB-BASS ────────────────────────────────────
      const walkNotes = chordObj.bassWalk || [chordObj.bass];
      const stepOffsets = [0, 8, 12]; // Beat 1, Beat 3, Beat 4 anticipation

      walkNotes.forEach((bFreq, idx) => {
        const stepOffset = stepOffsets[idx] !== undefined ? stepOffsets[idx] : idx * 6;
        const bassTime = startTime + (stepOffset * MENU_SIXTEENTH);
        const bDur = (idx === 0 ? 7.5 : 3.5) * MENU_SIXTEENTH;

        const bOsc = c.createOscillator();
        const bSub = c.createOscillator();
        const bGain = c.createGain();
        const bFilter = c.createBiquadFilter();

        bFilter.type = 'lowpass';
        bFilter.frequency.setValueAtTime(260, bassTime);

        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bFreq, bassTime);

        bSub.type = 'sine';
        bSub.frequency.setValueAtTime(bFreq * 0.5, bassTime); // Sub-octave warmth

        const bVol = (idx === 0 ? 0.075 : 0.050);
        bGain.gain.setValueAtTime(0, bassTime);
        bGain.gain.linearRampToValueAtTime(bVol, bassTime + 0.03);
        bGain.gain.exponentialRampToValueAtTime(0.001, bassTime + bDur);

        bOsc.connect(bFilter);
        bSub.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(bus);

        registerBGMNode(bOsc, bSub, bFilter, bGain);

        bOsc.start(bassTime);
        bSub.start(bassTime);
        bOsc.stop(bassTime + bDur + 0.05);
        bSub.stop(bassTime + bDur + 0.05);
      });
    });

    // ── 3. ETHEREAL BALATRO VIBRAPHONE / CHIMES (Melodic Sprinkles) ──────────
    const chimeMelody = generateBalatroMelody();
    chimeMelody.forEach(note => {
      const chimeTime = now + (note.t * MENU_SIXTEENTH);
      const chimeDur = note.d * MENU_SIXTEENTH * 1.4;

      const osc = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(note.f, chimeTime);
      filter.Q.setValueAtTime(1.8, chimeTime);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, chimeTime);

      // Crystalline bell envelope with gentle initial ping and ringing tail
      gain.gain.setValueAtTime(0, chimeTime);
      gain.gain.linearRampToValueAtTime(0.042, chimeTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0005, chimeTime + chimeDur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bus);

      registerBGMNode(osc, filter, gain);
      osc.start(chimeTime);
      osc.stop(chimeTime + chimeDur + 0.05);
    });

    // ── 4. RELAXED BALATRO LO-FI CASINO GROOVE (Kick, Brush Snare, Swing Hats) ─
    for (let s = 0; s < 64; s += 2) {
      const stepTime = now + (s * MENU_SIXTEENTH);
      const isKick = (s === 0 || s === 24 || s === 32 || s === 56);
      const isSnare = (s === 16 || s === 48); // Beats 2 and 4
      const isHat = (s % 4 === 0) || (s % 4 === 2 && Math.random() < 0.75);

      // A. Soft Pitch-Drop Sub Kick
      if (isKick) {
        const kOsc = c.createOscillator();
        const kGain = c.createGain();
        kOsc.type = 'sine';
        kOsc.frequency.setValueAtTime(70, stepTime);
        kOsc.frequency.exponentialRampToValueAtTime(32, stepTime + 0.12);

        kGain.gain.setValueAtTime(0.065, stepTime);
        kGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.14);

        kOsc.connect(kGain);
        kGain.connect(bus);
        registerBGMNode(kOsc, kGain);
        kOsc.start(stepTime);
        kOsc.stop(stepTime + 0.15);
      }

      // B. Jazz Brushed Snare / Warm Snap
      if (isSnare) {
        const sSrc = c.createBufferSource();
        sSrc.buffer = getNoiseBuffer(c);
        const sFilter = c.createBiquadFilter();
        const sGain = c.createGain();

        sFilter.type = 'bandpass';
        sFilter.frequency.setValueAtTime(1350, stepTime);
        sFilter.Q.setValueAtTime(0.9, stepTime);

        sGain.gain.setValueAtTime(0.038, stepTime);
        sGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.11);

        sSrc.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(bus);
        registerBGMNode(sSrc, sFilter, sGain);
        sSrc.start(stepTime);
        sSrc.stop(stepTime + 0.12);
      }

      // C. Soft Swung Hi-Hat / Shaker
      if (isHat && !isSnare) {
        const swingOffset = (s % 4 === 2) ? (MENU_SIXTEENTH * 0.20) : 0; // Swing micro-timing
        const hTime = stepTime + swingOffset;
        const hSrc = c.createBufferSource();
        hSrc.buffer = getNoiseBuffer(c);
        const hFilter = c.createBiquadFilter();
        const hGain = c.createGain();

        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(4800, hTime);

        hGain.gain.setValueAtTime(0.012, hTime);
        hGain.gain.exponentialRampToValueAtTime(0.0005, hTime + 0.035);

        hSrc.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(bus);
        registerBGMNode(hSrc, hFilter, hGain);
        hSrc.start(hTime);
        hSrc.stop(hTime + 0.04);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TRACK 2: ADAPTIVE DYNAMIC BATTLE ("Arcade RPG Showdown & Tension Scaling")
  // Reacts in real-time to outs, runners in scoring position, and pitcher HP
  // ─────────────────────────────────────────────────────────────────────────────
  const MATCH_BPM = 128;
  const MATCH_BEAT = 60 / MATCH_BPM; // ~0.468s
  const MATCH_SIXTEENTH = MATCH_BEAT / 4; // ~0.117s

  const BATTLE_SCALE = [N.D4, N.E4, N.F4, N.G4, N.A4, N.Bb4, N.C5, N.D5, N.E5, N.F5, N.G5, N.A5, N.D6];

  let nextMatchLoopTime = 0;
  let matchVariationCount = 0;

  function scheduleMatchMusicLoop() {
    const c = getCtx();
    if (!c || currentBGMMode !== 'match' || _muted || (typeof document !== 'undefined' && document.hidden)) return;
    const bus = getTrackBus();
    if (!bus) return;

    const loopDur = 64 * MATCH_SIXTEENTH; // ~7.5s
    const now = Math.max(c.currentTime + 0.05, nextMatchLoopTime);
    nextMatchLoopTime = now + loopDur;
    matchVariationCount++;

    const intensity = currentBattleIntensity; // 0 to 3

    // 1. Driving Bassline
    const bassChords = [N.D3, N.Bb2, N.C3, N.D3];
    bassChords.forEach((rootNote, barIdx) => {
      const barStart = barIdx * 16;
      const stepInterval = intensity >= 1 ? 1 : 2;

      for (let step = 0; step < 16; step += stepInterval) {
        const startTime = now + ((barStart + step) * MATCH_SIXTEENTH);
        const dur = MATCH_SIXTEENTH * 0.85;

        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sawtooth';

        let noteFreq = rootNote;
        if (step % 4 === 2) noteFreq = rootNote * 1.5; // 5th
        else if (step % 8 === 4) noteFreq = rootNote * 2.0; // Octave

        osc.frequency.setValueAtTime(noteFreq, startTime);

        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        const cutoff = 550 + (intensity * 250);
        filter.frequency.setValueAtTime(cutoff, startTime);
        filter.Q.setValueAtTime(1.8 + intensity * 0.6, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.080 + (intensity * 0.015), startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(bus);
        registerBGMNode(osc, filter, gain);
        osc.start(startTime);
        osc.stop(startTime + dur + 0.02);
      }
    });

    // 2. Procedural Lead Battle Riffs / Fanfares
    const leadPatterns = [
      // Pattern 1: Rhythmic stabs
      [
        { f: N.D4, d: 2, t: 0 }, { f: N.F4, d: 2, t: 4 }, { f: N.A4, d: 3, t: 8 }, { f: N.D5, d: 3, t: 12 },
        { f: N.F5, d: 2, t: 16 }, { f: N.E5, d: 2, t: 20 }, { f: N.D5, d: 3, t: 24 }, { f: N.Bb4, d: 3, t: 28 },
        { f: N.C5, d: 2, t: 32 }, { f: N.E5, d: 2, t: 36 }, { f: N.G5, d: 3, t: 40 }, { f: N.A5, d: 4, t: 48 }
      ],
      // Pattern 2: Dramatic descending tension
      [
        { f: N.A5, d: 3, t: 0 }, { f: N.G5, d: 2, t: 4 }, { f: N.F5, d: 3, t: 8 }, { f: N.D5, d: 4, t: 12 },
        { f: N.Bb4, d: 2, t: 16 }, { f: N.D5, d: 2, t: 20 }, { f: N.F5, d: 3, t: 24 }, { f: N.G5, d: 3, t: 28 },
        { f: N.E5, d: 3, t: 32 }, { f: N.C5, d: 2, t: 36 }, { f: N.E5, d: 3, t: 40 }, { f: N.D5, d: 4, t: 48 }
      ],
      // Pattern 3: High-clutch climbing arpeggios
      [
        { f: N.D4, d: 2, t: 0 }, { f: N.F4, d: 2, t: 4 }, { f: N.A4, d: 2, t: 8 }, { f: N.D5, d: 2, t: 12 },
        { f: N.F5, d: 2, t: 16 }, { f: N.A5, d: 2, t: 20 }, { f: N.D6, d: 4, t: 24 }, { f: N.A5, d: 3, t: 32 },
        { f: N.G5, d: 2, t: 36 }, { f: N.F5, d: 2, t: 40 }, { f: N.E5, d: 2, t: 44 }, { f: N.D5, d: 4, t: 48 }
      ]
    ];

    const chosenLead = leadPatterns[matchVariationCount % leadPatterns.length];
    chosenLead.forEach(note => {
      const startTime = now + (note.t * MATCH_SIXTEENTH);
      const dur = note.d * MATCH_SIXTEENTH * 0.90;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      const freq = (intensity >= 3 && Math.random() < 0.5) ? note.f * 2 : note.f;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.080 + (intensity * 0.02), startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(bus);
      registerBGMNode(osc, gain);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.03);
    });

    // 3. High Intensity Arpeggio Layer (Active on Intensity >= 1: Runners on base / 2 outs)
    if (intensity >= 1) {
      for (let s = 0; s < 64; s += 2) {
        const startTime = now + (s * MATCH_SIXTEENTH);
        const dur = MATCH_SIXTEENTH * 0.75;
        const arpIdx = (s / 2) % BATTLE_SCALE.length;

        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(BATTLE_SCALE[arpIdx], startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.035 + (intensity * 0.015), startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(bus);
        registerBGMNode(osc, gain);
        osc.start(startTime);
        osc.stop(startTime + dur + 0.02);
      }
    }

    // 4. Punchy Dynamic Drum Beats
    const kickBeats = (intensity >= 2)
      ? [0, 6, 8, 14, 16, 22, 24, 30, 32, 38, 40, 46, 48, 54, 56, 62]
      : [0, 8, 16, 24, 32, 40, 48, 56];

    kickBeats.forEach(b => {
      const startTime = now + (b * MATCH_SIXTEENTH);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(125, startTime);
      osc.frequency.exponentialRampToValueAtTime(38, startTime + 0.08);

      gain.gain.setValueAtTime(0.13, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.10);

      osc.connect(gain);
      gain.connect(bus);
      registerBGMNode(osc, gain);
      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });

    // Snare on 2 & 4 (using shared noise buffer)
    for (let b = 4; b < 64; b += 8) {
      const startTime = now + (b * MATCH_SIXTEENTH);
      const dur = 0.08;

      const src = c.createBufferSource();
      src.buffer = getNoiseBuffer(c);

      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, startTime);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.060, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      registerBGMNode(src, filter, gain);
      src.start(startTime);
      src.stop(startTime + dur + 0.02);
    }
  }

  // ── Sound definitions ─────────────────────────────────────────────────────────

  const sounds = {

    // 1. MENU CLICK — quick square-wave blip
    menu_click() {
      tone(440, 0.06, 'square', 0.15);
    },

    // 2. DRAFT PICK — ascending 3-note confirmation chime
    draft_pick() {
      tone(523.25, 0.12, 'sine', 0.25, 0.00);  // C5
      tone(659.25, 0.12, 'sine', 0.25, 0.09);  // E5
      tone(783.99, 0.20, 'sine', 0.30, 0.18);  // G5
    },

    // 3. PLAY BALL — stadium-style fanfare + crowd swell
    play_ball() {
      noise(1.2, 0.08, 0.0, 300, 'lowpass');
      tone(587.33, 0.15, 'sawtooth', 0.18, 0.0,  0.01); // D5
      tone(783.99, 0.20, 'sawtooth', 0.22, 0.12, 0.01); // G5
      tone(987.77, 0.35, 'sawtooth', 0.25, 0.28, 0.01); // B5
      noise(0.6, 0.10, 0.4, 800, 'bandpass');
    },

    // 4. OUT — short descending two-tone thud
    out() {
      tone(330, 0.12, 'triangle', 0.22, 0.0);
      tone(220, 0.18, 'triangle', 0.18, 0.10);
      noise(0.08, 0.15, 0.0, 200, 'lowpass');
    },

    // 5. STRIKE OUT — sharp buzzer-style descending
    so() {
      tone(466.16, 0.08, 'sawtooth', 0.20, 0.00); // Bb4
      tone(349.23, 0.08, 'sawtooth', 0.20, 0.07); // F4
      tone(261.63, 0.15, 'sawtooth', 0.18, 0.14); // C4
    },

    // 6. BASE HIT (1B / 2B / 3B) — bat crack + quick pop
    hit() {
      noise(0.06, 0.45, 0.0, 4000, 'highpass');
      noise(0.15, 0.25, 0.0, 1200, 'bandpass');
      tone(200, 0.18, 'triangle', 0.12, 0.03);
    },

    // 7. HOME RUN — bigger crack + crowd cheer
    hr() {
      noise(0.07, 0.70, 0.0, 5000, 'highpass');
      noise(0.20, 0.40, 0.0, 1500, 'bandpass');
      tone(180, 0.25, 'triangle', 0.18, 0.04);
      noise(1.2, 0.18, 0.15, 600, 'bandpass');
      noise(0.8, 0.12, 0.60, 400, 'lowpass');
      tone(523.25, 0.10, 'sine', 0.15, 0.25); // C5
      tone(659.25, 0.10, 'sine', 0.18, 0.38); // E5
      tone(783.99, 0.20, 'sine', 0.22, 0.50); // G5
      tone(1046.5, 0.30, 'sine', 0.18, 0.65); // C6
    },

    // 8. BASE ON BALLS — soft walk-off pluck
    bb() {
      tone(392.0, 0.15, 'sine', 0.15, 0.0);  // G4
      tone(466.16, 0.15, 'sine', 0.12, 0.12); // Bb4
    },

    // 9. WIN — short triumphant fanfare
    win() {
      tone(523.25, 0.12, 'sawtooth', 0.22, 0.00); // C5
      tone(659.25, 0.12, 'sawtooth', 0.22, 0.10); // E5
      tone(783.99, 0.12, 'sawtooth', 0.22, 0.20); // G5
      tone(1046.5, 0.30, 'sawtooth', 0.28, 0.32); // C6
      noise(1.0, 0.15, 0.30, 700, 'bandpass');
    },

    // 10. LOSE — somber descending tones
    lose() {
      tone(440.0, 0.20, 'triangle', 0.20, 0.00); // A4
      tone(369.99, 0.20, 'triangle', 0.18, 0.18); // F#4
      tone(293.66, 0.30, 'triangle', 0.15, 0.36); // D4
      tone(220.0,  0.40, 'triangle', 0.12, 0.60); // A3
    },

    // 11. ROULETTE TICK — rapid arcade slot machine blip
    roulette_tick(pitchMult = 1.0) {
      const baseFreq = (750 + Math.floor(Math.random() * 150)) * pitchMult;
      tone(baseFreq, 0.035, 'square', 0.09, 0, 0.001, 0.02);
    },

    // 12. ROULETTE WIN — jackpot chime
    roulette_win() {
      tone(523.25, 0.08, 'sine', 0.22, 0.00);  // C5
      tone(659.25, 0.08, 'sine', 0.22, 0.06);  // E5
      tone(783.99, 0.08, 'sine', 0.22, 0.12);  // G5
      tone(1046.50, 0.12, 'sine', 0.25, 0.18); // C6
      tone(1318.51, 0.12, 'sine', 0.25, 0.26); // E6
      tone(1567.98, 0.25, 'sine', 0.28, 0.34); // G6
      tone(2093.00, 0.35, 'triangle', 0.20, 0.44); // C7
    },

    // 13. PITCHER K.O. — heavy impact + bell gong
    pitcher_ko() {
      noise(0.35, 0.70, 0.0, 700, 'lowpass');
      noise(0.18, 0.40, 0.0, 3000, 'highpass');
      tone(120, 0.45, 'triangle', 0.45, 0.0, 0.005, 0.4);
      tone(880.0, 0.55, 'triangle', 0.30, 0.04);
      tone(1320.0, 0.65, 'sine', 0.25, 0.08);
      tone(1760.0, 0.75, 'sine', 0.20, 0.12);
    },

    // 14. INNING CHANGE — umpire whistle + stadium cue
    inning_change() {
      tone(1975.5, 0.09, 'sine', 0.22, 0.00);
      tone(2349.3, 0.13, 'sine', 0.25, 0.07);
      noise(0.22, 0.20, 0.04, 2000, 'bandpass');
      noise(0.35, 0.18, 0.18, 900, 'lowpass');
      tone(587.33, 0.16, 'sawtooth', 0.20, 0.28); // D5
      tone(880.00, 0.32, 'sawtooth', 0.24, 0.42); // A5
    },

    // 15. BULLPEN ENTER — rising siren
    bullpen_enter() {
      noise(0.25, 0.22, 0.0, 1500, 'bandpass');
      tone(440.00, 0.09, 'sawtooth', 0.22, 0.00);
      tone(659.25, 0.10, 'sawtooth', 0.24, 0.08);
      tone(987.77, 0.26, 'sawtooth', 0.28, 0.17);
    },

    // 16. CARD DEAL — card slide
    card_deal() {
      noise(0.07, 0.11, 0.0, 3200, 'bandpass');
      tone(440.0, 0.04, 'triangle', 0.12, 0.01, 0.002, 0.03);
      tone(880.0, 0.035, 'sine', 0.08, 0.02, 0.002, 0.03);
    },

    // 17. DEFENSE TENSION INTRO — dramatic sub-bass heartbeat & cinematic riser
    defense_tension_intro() {
      tone(65, 0.22, 'sine', 0.35, 0.00, 0.005, 0.18);
      tone(95, 0.16, 'triangle', 0.28, 0.00, 0.005, 0.12);
      noise(0.12, 0.15, 0.00, 150, 'lowpass');

      tone(60, 0.30, 'sine', 0.38, 0.22, 0.005, 0.25);
      tone(85, 0.20, 'triangle', 0.30, 0.22, 0.005, 0.15);
      noise(0.15, 0.18, 0.22, 120, 'lowpass');

      tone(1174.66, 0.45, 'sine', 0.12, 0.38, 0.01, 0.35); // D6
      tone(1760.00, 0.35, 'sine', 0.08, 0.42, 0.01, 0.28); // A6
    },

    // 18. DEFENSE DICE ROLL — high-tension escalating tumble & pitch sweep
    defense_dice_roll() {
      for (let i = 0; i < 7; i++) {
        const d = i * 0.06;
        tone(300 + (i * 80), 0.04, 'triangle', 0.15 + (i * 0.02), d, 0.002, 0.03);
        noise(0.04, 0.08, d, 2500, 'bandpass');
      }
    },

    // 19. DEFENSE GOLD GLOVE — heroic fanfare, crowd cheer, golden sparkle
    defense_gold_glove() {
      noise(0.08, 0.50, 0.00, 3500, 'bandpass');
      tone(180, 0.15, 'triangle', 0.25, 0.01);

      tone(523.25, 0.35, 'sawtooth', 0.20, 0.08, 0.01, 0.30); // C5
      tone(659.25, 0.35, 'sawtooth', 0.22, 0.14, 0.01, 0.30); // E5
      tone(783.99, 0.45, 'sawtooth', 0.25, 0.20, 0.01, 0.38); // G5
      tone(1046.50, 0.60, 'sawtooth', 0.28, 0.28, 0.01, 0.50); // C6

      tone(1318.51, 0.40, 'sine', 0.18, 0.35, 0.01, 0.35); // E6
      tone(1567.98, 0.50, 'sine', 0.20, 0.42, 0.01, 0.45); // G6
      tone(2093.00, 0.60, 'sine', 0.22, 0.50, 0.01, 0.55); // C7

      noise(1.10, 0.22, 0.15, 600, 'bandpass');
    },

    // 20. DEFENSE ERROR — heavy impact, low alarm buzzer, shield crack
    defense_error() {
      noise(0.12, 0.65, 0.00, 4500, 'highpass');
      tone(120, 0.35, 'sawtooth', 0.30, 0.00, 0.005, 0.30);
      tone(75, 0.50, 'sine', 0.40, 0.02, 0.005, 0.45);

      tone(233.08, 0.35, 'sawtooth', 0.25, 0.10, 0.01, 0.30); // Bb3
      tone(220.00, 0.40, 'sawtooth', 0.25, 0.12, 0.01, 0.35); // A3
      noise(0.60, 0.20, 0.10, 300, 'lowpass');
    },

    // 21. ERROR & FAILURE SFX
    error() {
      this.defense_error();
    },
    fail() {
      this.defense_error();
    },
    gamble_fail() {
      this.defense_error();
    },
    item_fail() {
      this.defense_error();
    },

    // 22. ITEM EQUIP — tactile buckle click + soft chime
    item_equip() {
      noise(0.04, 0.22, 0.0, 3500, 'bandpass');
      tone(523.25, 0.06, 'sine', 0.16, 0.00);
      tone(783.99, 0.08, 'sine', 0.18, 0.04);
    },

    // 23. ITEM USE (Consumable) — sparkle energy swish
    item_use() {
      noise(0.08, 0.16, 0.0, 4800, 'highpass');
      tone(659.25, 0.08, 'sine', 0.14, 0.00);
      tone(880.00, 0.10, 'sine', 0.16, 0.05);
      tone(1318.51, 0.15, 'sine', 0.18, 0.10);
    },

    // 24. MONEY / COIN SPEND — crisp retro coin jingle
    money() {
      tone(987.77, 0.05, 'square', 0.11, 0.00, 0.002, 0.04); // B5
      tone(1318.51, 0.10, 'square', 0.13, 0.04, 0.002, 0.08); // E6
    },
    coin_spend() {
      this.money();
    },

    // 25. MAP NODE SELECT — gentle tactile woody step
    map_node_select() {
      tone(440, 0.035, 'triangle', 0.12, 0.00);
      noise(0.025, 0.08, 0.00, 1800, 'bandpass');
    },
    map_step() {
      this.map_node_select();
    },

    // 26. SYNERGY TIER UP — uplifting harmonic activation chime
    synergy_tier_up() {
      tone(523.25, 0.09, 'sine', 0.16, 0.00);
      tone(659.25, 0.09, 'sine', 0.16, 0.00);
      tone(783.99, 0.16, 'sine', 0.20, 0.07);
      tone(1046.50, 0.22, 'sine', 0.22, 0.07);
    },

    // 27. PLAYER RELEASE / CARD WHOOSH — soft dismissal slide
    player_release() {
      noise(0.09, 0.18, 0.0, 2200, 'bandpass');
      tone(329.63, 0.07, 'triangle', 0.11, 0.00);
      tone(261.63, 0.10, 'triangle', 0.09, 0.04);
    },

    // 28. SPEED STRETCH / PROC — energetic electric swoosh + futuristic rising chime
    speed_proc() {
      noise(0.12, 0.25, 0.0, 4200, 'highpass');
      tone(440.00, 0.08, 'sine', 0.20, 0.00, 0.005, 0.06); // A4
      tone(659.25, 0.09, 'sine', 0.22, 0.04, 0.005, 0.07); // E5
      tone(880.00, 0.12, 'square', 0.16, 0.08, 0.002, 0.10); // A5
      tone(1318.51, 0.18, 'sine', 0.25, 0.12, 0.002, 0.15); // E6 sparkle
    },
    speed_stretch() {
      this.speed_proc();
    },

    card_flip() {
      this.card_deal();
    },
    upgrade() {
      this.synergy_tier_up();
    }
  };

  // ── Public API ────────────────────────────────────────────────────────────────

  const AudioManager = {

    /**
     * Play a sound by key. Overlaps with any currently playing sound.
     */
    play(key, arg) {
      if (_muted) return;
      try {
        const fn = sounds[key];
        if (fn) fn(arg);
      } catch (e) {}
    },

    playSound(key, arg) {
      this.play(key, arg);
    },

    /**
     * Switch BGM mode: 'menu' (chill retro melody) | 'match' (stadium ambiance & organ) | 'off'
     */
    setBGM(mode) {
      if (currentBGMMode === mode && bgmIntervalTimer !== null) return;
      if (currentBGMMode === mode && mode !== 'off') {
        ensureAudioPlaying();
        return;
      }
      currentBGMMode = mode;
      stopAllBGM();

      if (_muted || mode === 'off' || !mode) return;
      ensureAudioPlaying();
    },

    /**
     * Toggle mute on/off. Returns new muted state.
     */
    toggleMute() {
      _muted = !_muted;
      try { localStorage.setItem('baserogue_muted', String(_muted)); } catch (e) {}
      applyMuteState();
      this.updateMuteButton();

      if (!_muted) {
        ensureAudioPlaying();
      } else {
        stopAllBGM();
      }
      return _muted;
    },

    /** Returns true if currently muted. */
    isMuted() { return _muted; },

    /**
     * Sync the mute button icon/label to current state.
     */
    updateMuteButton() {
      const btn = document.getElementById('btn-audio-toggle');
      if (!btn) return;
      btn.title = _muted
        ? (typeof window.t === 'function' ? window.t('ui.unmute_tooltip', 'Activar sonido') : 'Activar sonido')
        : (typeof window.t === 'function' ? window.t('ui.mute_tooltip', 'Silenciar') : 'Silenciar');
      btn.innerHTML = _muted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
      btn.style.opacity = _muted ? '0.5' : '1';
    },

    /**
     * Update match battle intensity level based on match state.
     * Evaluates outs, runners in scoring position, inning, and pitcher HP.
     */
    updateBattleIntensity(state) {
      if (!state) {
        currentBattleIntensity = 0;
        return;
      }
      let score = 0;
      if (state.outs === 2) score += 1;
      if (state.inning >= 3) score += 1;
      if (state.bases && (state.bases[1] || state.bases[2])) score += 1;
      if (state.activePitcher && typeof state.activePitcher.hp === 'number' && state.activePitcher.hp <= 25) score += 1;
      if (typeof state.teamHp === 'number' && state.teamHp <= 30) score += 1;

      currentBattleIntensity = Math.max(0, Math.min(3, score));
    },

    /**
     * Unlock the AudioContext on user interaction.
     */
    unlock() {
      const c = getCtx();
      if (!c) return;
      initGains();
      if (c.state === 'suspended' || c.state === 'interrupted') {
        c.resume().then(() => {
          ensureAudioPlaying();
        }).catch(() => {});
      } else {
        ensureAudioPlaying();
      }
    },
  };

  function ensureAudioPlaying() {
    if (_muted || currentBGMMode === 'off' || currentBGMMode === 'none' || (typeof document !== 'undefined' && document.hidden)) return;
    const c = getCtx();
    if (!c || c.state === 'suspended' || c.state === 'interrupted') return;
    initGains();

    if (!bgmIntervalTimer) {
      // Immediate initial schedule
      if (currentBGMMode === 'menu') scheduleMenuMusicLoop();
      else if (currentBGMMode === 'match') scheduleMatchMusicLoop();

      // Lookahead scheduler runs every 800ms
      bgmIntervalTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (_muted || currentBGMMode === 'off' || currentBGMMode === 'none') return;
        const curCtx = getCtx();
        if (!curCtx || curCtx.state === 'suspended' || curCtx.state === 'interrupted') return;

        if (currentBGMMode === 'menu') {
          if (nextMenuLoopTime <= curCtx.currentTime + 1.5) {
            scheduleMenuMusicLoop();
          }
        } else if (currentBGMMode === 'match') {
          if (nextMatchLoopTime <= curCtx.currentTime + 1.5) {
            scheduleMatchMusicLoop();
          }
        }
      }, 800);
    }
  }

  // Ultra-early auto-unlock: attempts immediate play on load + on user interactions
  if (typeof document !== 'undefined') {
    let unlocked = false;
    const unlockOnce = () => {
      if (unlocked) return;
      unlocked = true;
      AudioManager.unlock();
      const events = ['pointermove', 'mousemove', 'wheel', 'scroll', 'pointerdown', 'touchstart', 'mousedown', 'keydown', 'click', 'focus'];
      events.forEach(evt => {
        try {
          window.removeEventListener(evt, unlockOnce, true);
          document.removeEventListener(evt, unlockOnce, true);
        } catch (e) {}
      });
    };

    const events = ['pointermove', 'mousemove', 'wheel', 'scroll', 'pointerdown', 'touchstart', 'mousedown', 'keydown', 'click', 'focus'];
    events.forEach(evt => {
      window.addEventListener(evt, unlockOnce, { capture: true, once: true, passive: true });
      document.addEventListener(evt, unlockOnce, { capture: true, once: true, passive: true });
    });

    // Attempt instant start on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!_muted) {
          AudioManager.setBGM('menu');
          AudioManager.unlock();
        }
      });
    } else {
      if (!_muted) {
        AudioManager.setBGM('menu');
        AudioManager.unlock();
      }
    }

    // Auto-pause audio when switching tabs / minimizing window, resume when returning
    const handleVisibilityChange = () => {
      const c = getCtx();
      if (!c) return;

      if (document.hidden) {
        // Tab hidden: stop all nodes and suspend context
        if (bgmIntervalTimer) {
          clearInterval(bgmIntervalTimer);
          bgmIntervalTimer = null;
        }
        if (activeTrackGain) {
          try { activeTrackGain.gain.setValueAtTime(0, c.currentTime); } catch (e) {}
        }
        activeBGMNodes.forEach(n => {
          try { if (typeof n.stop === 'function') n.stop(); n.disconnect(); } catch (e) {}
        });
        activeBGMNodes.clear();
        if (c.state === 'running') {
          c.suspend().catch(() => {});
        }
      } else {
        // Tab visible again: restore bus gain and resume
        nextMenuLoopTime = 0;
        nextMatchLoopTime = 0;
        if (activeTrackGain) {
          try { activeTrackGain.gain.setValueAtTime(1.0, c.currentTime); } catch (e) {}
        }
        if (!_muted && currentBGMMode !== 'off' && currentBGMMode !== 'none') {
          if (c.state === 'suspended' || c.state === 'interrupted') {
            c.resume().then(() => {
              ensureAudioPlaying();
            }).catch(() => {});
          } else {
            ensureAudioPlaying();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  window.AudioManager = AudioManager;
  window.Sound = AudioManager;

})();
