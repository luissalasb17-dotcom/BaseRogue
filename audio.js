/**
 * BaseRogue AudioManager
 * ──────────────────────
 * Synthesizes all game audio, background music (BGM), and stadium ambiance
 * using the Web Audio API.
 * No external files required — zero bandwidth, works 100% offline, smooth background levels.
 */

(function () {
  'use strict';

  // ── Context ───────────────────────────────────────────────────────────────────
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      } catch (e) {
        return null;
      }
    }
    if (ctx && ctx.state === 'suspended') {
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

  // ── Synthesizer helpers ───────────────────────────────────────────────────────

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

    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  function noise(dur, vol = 0.3, delay = 0, filterFreq = 2000, filterType = 'bandpass') {
    const c = getCtx();
    if (!c) return;
    initGains();
    const bufSize = Math.max(128, Math.floor(c.sampleRate * (dur + 0.05)));
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    src.buffer = buf;

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

    src.start(now);
    src.stop(now + dur + 0.05);
  }

  // ── BGM & AMBIANCE SYNTHESIS ENGINE ──────────────────────────────────────────
  let currentBGMMode = 'none'; // 'menu' | 'match' | 'off'
  let bgmIntervalTimer = null;
  let activeTrackGain = null;
  let activeBGMNodes = [];
  let currentBattleIntensity = 0; // 0 (normal), 1 (tension/runners), 2 (clutch/2 outs), 3 (climax/KO alert)

  // Frequencies in Hz
  const N = {
    D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, B2: 123.47,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, B3: 246.94,
    C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
    C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, Bb5: 932.33, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98
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
      activeTrackGain.gain.setValueAtTime(activeTrackGain.gain.value, c.currentTime);
      activeTrackGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.03);
      const oldBus = activeTrackGain;
      setTimeout(() => {
        try { oldBus.disconnect(); } catch (e) {}
      }, 50);
      activeTrackGain = null;
    }
    activeBGMNodes.forEach(n => {
      try { if (typeof n.stop === 'function') n.stop(); n.disconnect(); } catch (e) {}
    });
    activeBGMNodes = [];
    nextMenuLoopTime = 0;
    nextMatchLoopTime = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TRACK 1: PROCEDURAL INFINITE MENU ("Cozy Clubhouse Generative Lofi")
  // Generates unique jazz-lofi chord progressions & algorithmic pentatonic melodies
  // ─────────────────────────────────────────────────────────────────────────────
  const MENU_BPM = 88;
  const MENU_BEAT = 60 / MENU_BPM; // ~0.681s
  const MENU_SIXTEENTH = MENU_BEAT / 4; // ~0.170s

  const COZY_PROGRESSIONS = [
    // Progression A: Cmaj7 -> Am7 -> Dm7 -> G7
    [
      { notes: [N.C4, N.E4, N.G4, N.B4], bass: N.C3, t: 0 },
      { notes: [N.A3, N.C4, N.E4, N.G4], bass: N.A2, t: 16 },
      { notes: [N.D4, N.F4, N.A4, N.C5], bass: N.D3, t: 32 },
      { notes: [N.G3, N.B3, N.D4, N.F4], bass: N.G2, t: 48 }
    ],
    // Progression B: Fmaj7 -> Em7 -> Dm7 -> Cmaj7
    [
      { notes: [N.F3, N.A3, N.C4, N.E4], bass: N.F2, t: 0 },
      { notes: [N.E3, N.G3, N.B3, N.D4], bass: N.E2, t: 16 },
      { notes: [N.D4, N.F4, N.A4, N.C5], bass: N.D3, t: 32 },
      { notes: [N.C4, N.E4, N.G4, N.B4], bass: N.C3, t: 48 }
    ],
    // Progression C: Cmaj7 -> Em7 -> Fmaj7 -> G7
    [
      { notes: [N.C4, N.E4, N.G4, N.B4], bass: N.C3, t: 0 },
      { notes: [N.E3, N.G3, N.B3, N.D4], bass: N.E2, t: 16 },
      { notes: [N.F3, N.A3, N.C4, N.E4], bass: N.F2, t: 32 },
      { notes: [N.G3, N.B3, N.D4, N.F4], bass: N.G2, t: 48 }
    ],
    // Progression D: Am7 -> D7 -> Dm7 -> G7 (Dugout Jazz)
    [
      { notes: [N.A3, N.C4, N.E4, N.G4], bass: N.A2, t: 0 },
      { notes: [N.D4, N.F4, N.A4, N.C5], bass: N.D3, t: 16 },
      { notes: [N.F3, N.A3, N.C4, N.E4], bass: N.F2, t: 32 },
      { notes: [N.G3, N.B3, N.D4, N.F4], bass: N.G2, t: 48 }
    ]
  ];

  const PENTATONIC_SCALE = [N.C4, N.D4, N.E4, N.G4, N.A4, N.C5, N.D5, N.E5, N.G5, N.A5, N.C6];
  let nextMenuLoopTime = 0;
  let menuProgressionIndex = 0;

  function generateProceduralMenuMelody() {
    const melody = [];
    let curScaleIdx = 4 + Math.floor(Math.random() * 3); // Start near C5
    const stepSlots = [4, 8, 12, 20, 24, 28, 36, 40, 44, 46, 52, 56];

    stepSlots.forEach(t => {
      // 25% chance of musical breath/rest
      if (Math.random() < 0.25 && t !== 4 && t !== 20 && t !== 36 && t !== 52) return;

      // Voice-leading step: 60% step adjacent, 25% skip 2 degrees, 15% hold/leap
      const r = Math.random();
      if (r < 0.60) {
        curScaleIdx += (Math.random() < 0.5 ? 1 : -1);
      } else if (r < 0.85) {
        curScaleIdx += (Math.random() < 0.5 ? 2 : -2);
      } else {
        curScaleIdx += (Math.random() < 0.5 ? 3 : -3);
      }
      curScaleIdx = Math.max(0, Math.min(PENTATONIC_SCALE.length - 1, curScaleIdx));

      const dur = Math.random() < 0.6 ? 3 : 2; // 16th duration
      melody.push({ f: PENTATONIC_SCALE[curScaleIdx], d: dur, t: t });
    });

    return melody;
  }

  function scheduleMenuMusicLoop() {
    const c = getCtx();
    if (!c || currentBGMMode !== 'menu' || _muted) return;
    const bus = getTrackBus();
    if (!bus) return;

    const loopDur = 64 * MENU_SIXTEENTH; // ~10.88s
    const now = Math.max(c.currentTime + 0.05, nextMenuLoopTime);
    nextMenuLoopTime = now + loopDur;

    // 1. Procedural Progression Shift
    const currentProg = COZY_PROGRESSIONS[menuProgressionIndex % COZY_PROGRESSIONS.length];
    menuProgressionIndex++;

    // Render Chords & Warm Sub-Bass
    currentProg.forEach(chordObj => {
      const startTime = now + (chordObj.t * MENU_SIXTEENTH);
      const dur = 14 * MENU_SIXTEENTH;

      chordObj.notes.forEach(freq => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.040, startTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(bus);
        osc.start(startTime);
        osc.stop(startTime + dur + 0.05);
        activeBGMNodes.push(osc);
      });

      const bassOsc = c.createOscillator();
      const bassGain = c.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(chordObj.bass, startTime);

      bassGain.gain.setValueAtTime(0, startTime);
      bassGain.gain.linearRampToValueAtTime(0.075, startTime + 0.08);
      bassGain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      bassOsc.connect(bassGain);
      bassGain.connect(bus);
      bassOsc.start(startTime);
      bassOsc.stop(startTime + dur + 0.05);
      activeBGMNodes.push(bassOsc);
    });

    // 2. Procedural Melody Improvisation
    const dynamicMelody = generateProceduralMenuMelody();
    dynamicMelody.forEach(note => {
      const startTime = now + (note.t * MENU_SIXTEENTH);
      const dur = note.d * MENU_SIXTEENTH * 0.90;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.050, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.05);
      activeBGMNodes.push(osc);
    });

    // 3. Relaxing lofi percussion
    for (let s = 0; s < 64; s += 4) {
      const startTime = now + (s * MENU_SIXTEENTH);
      const isBackbeat = (s % 16 === 8);
      const dur = isBackbeat ? 0.08 : 0.035;
      const vol = isBackbeat ? 0.030 : 0.012;

      const bufSize = Math.max(64, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);

      const src = c.createBufferSource();
      src.buffer = buf;

      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isBackbeat ? 2200 : 4500, startTime);

      const gain = c.createGain();
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      src.start(startTime);
      src.stop(startTime + dur + 0.02);
      activeBGMNodes.push(src);
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
    if (!c || currentBGMMode !== 'match' || _muted) return;
    const bus = getTrackBus();
    if (!bus) return;

    const loopDur = 64 * MATCH_SIXTEENTH; // ~7.5s
    const now = Math.max(c.currentTime + 0.05, nextMatchLoopTime);
    nextMatchLoopTime = now + loopDur;
    matchVariationCount++;

    const intensity = currentBattleIntensity; // 0 to 3

    // 1. Driving Bassline (scales from 8th-note pulse to full 16th-note galloping bass under tension)
    const bassChords = [N.D3, N.Bb2, N.C3, N.D3];
    bassChords.forEach((rootNote, barIdx) => {
      const barStart = barIdx * 16;
      // Normal: 8th notes (0, 2, 4, 6...); Intensity >= 1: 16th galloping (0, 1, 2, 3...)
      const stepInterval = intensity >= 1 ? 1 : 2;

      for (let step = 0; step < 16; step += stepInterval) {
        const startTime = now + ((barStart + step) * MATCH_SIXTEENTH);
        const dur = MATCH_SIXTEENTH * 0.85;

        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sawtooth';

        // Add octave/5th bounce on syncopated beats
        let noteFreq = rootNote;
        if (step % 4 === 2) noteFreq = rootNote * 1.5; // 5th
        else if (step % 8 === 4) noteFreq = rootNote * 2.0; // Octave

        osc.frequency.setValueAtTime(noteFreq, startTime);

        // Filter resonance opens up as intensity increases
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        const cutoff = 550 + (intensity * 250); // Opens up from 550Hz to 1300Hz
        filter.frequency.setValueAtTime(cutoff, startTime);
        filter.Q.setValueAtTime(1.8 + intensity * 0.6, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.080 + (intensity * 0.015), startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(bus);
        osc.start(startTime);
        osc.stop(startTime + dur + 0.02);
        activeBGMNodes.push(osc);
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
      // Shift up an octave if at maximum intensity/climax!
      const freq = (intensity >= 3 && Math.random() < 0.5) ? note.f * 2 : note.f;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.080 + (intensity * 0.02), startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.03);
      activeBGMNodes.push(osc);
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
        osc.start(startTime);
        osc.stop(startTime + dur + 0.02);
        activeBGMNodes.push(osc);
      }
    }

    // 4. Punchy Dynamic Drum Beats
    // Kick Drum on 1 & 3 (and double kick on intensity >= 2)
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
      osc.start(startTime);
      osc.stop(startTime + 0.12);
      activeBGMNodes.push(osc);
    });

    // Snare on 2 & 4
    for (let b = 4; b < 64; b += 8) {
      const startTime = now + (b * MATCH_SIXTEENTH);
      const dur = 0.08;

      const bufSize = Math.max(64, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);

      const src = c.createBufferSource();
      src.buffer = buf;

      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, startTime);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.060, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      src.start(startTime);
      src.stop(startTime + dur + 0.02);
      activeBGMNodes.push(src);
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
      if (state.bases && (state.bases[1] || state.bases[2])) score += 1; // 2B or 3B runner
      if (state.activePitcher && typeof state.activePitcher.hp === 'number' && state.activePitcher.hp <= 25) score += 1;
      if (typeof state.teamHp === 'number' && state.teamHp <= 30) score += 1;

      currentBattleIntensity = Math.max(0, Math.min(3, score));
    },

    /**
     * Unlock the AudioContext on the first user interaction.
     */
    unlock() {
      const c = getCtx();
      if (!c) return;
      initGains();
      if (c.state === 'suspended') {
        c.resume().then(() => {
          ensureAudioPlaying();
        }).catch(() => {});
      } else {
        ensureAudioPlaying();
      }
    },
  };

  function ensureAudioPlaying() {
    if (_muted || currentBGMMode === 'off' || currentBGMMode === 'none') return;
    const c = getCtx();
    if (!c || c.state === 'suspended') return;
    initGains();

    if (currentBGMMode === 'menu') {
      if (!bgmIntervalTimer) {
        scheduleMenuMusicLoop();
        bgmIntervalTimer = setInterval(() => {
          if (currentBGMMode === 'menu' && !_muted) {
            scheduleMenuMusicLoop();
          }
        }, 4000);
      }
    } else if (currentBGMMode === 'match') {
      if (!bgmIntervalTimer) {
        scheduleMatchMusicLoop();
        bgmIntervalTimer = setInterval(() => {
          if (currentBGMMode === 'match' && !_muted) {
            scheduleMatchMusicLoop();
          }
        }, 3000);
      }
    }
  }

  // Ultra-early auto-unlock: attempts immediate play on load + on first hover/scroll/touch/keypress/click
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

    // Attempt instant start right on page load
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

    // Auto-pause audio when switching tabs / window hidden, resume when returning
    const handleVisibilityChange = () => {
      const c = getCtx();
      if (!c) return;
      if (document.hidden) {
        if (c.state === 'running') {
          c.suspend().catch(() => {});
        }
      } else {
        if (!_muted && currentBGMMode !== 'off' && currentBGMMode !== 'none') {
          if (c.state === 'suspended') {
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
    window.addEventListener('blur', () => {
      if (document.hidden) handleVisibilityChange();
    });
    window.addEventListener('focus', () => {
      if (!document.hidden) handleVisibilityChange();
    });
  }

  window.AudioManager = AudioManager;

})();
