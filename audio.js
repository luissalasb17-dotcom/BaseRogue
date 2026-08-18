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

  // Frequencies in Hz
  const N = {
    D2: 73.42, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81, D3: 146.83,
    E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, Bb5: 932.33,
    C6: 1046.50, D6: 1174.66, E6: 1318.51
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
      // Instantly cut off sound without clicks
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
  // TRACK 1: MENU & MAP ("Cozy Clubhouse Lofi & Soft Retro Chords")
  // Warm, relaxing Rhodes/jazz chords at 90 BPM (Cmaj7 -> Am7 -> Dm7 -> G7)
  // ─────────────────────────────────────────────────────────────────────────────
  const MENU_BPM = 90;
  const MENU_BEAT = 60 / MENU_BPM; // ~0.666s
  const MENU_SIXTEENTH = MENU_BEAT / 4; // ~0.166s

  // Warm Rhodes chords: [frequencies]
  const COZY_CHORDS = [
    { notes: [N.C4, N.E4, N.G4, N.B4], bass: N.C3, t: 0 },   // Cmaj7
    { notes: [N.A3, N.C4, N.E4, N.G4], bass: N.A2, t: 16 },  // Am7
    { notes: [N.D4, N.F4, N.A4, N.C5], bass: N.D3, t: 32 },  // Dm7
    { notes: [N.G3, N.B3, N.D4, N.F4], bass: N.G2, t: 48 }   // G7
  ];

  // Gentle melody floating on top
  const COZY_MELODY = [
    { f: N.E5, d: 3, t: 4 }, { f: N.G5, d: 2, t: 8 }, { f: N.D5, d: 4, t: 12 },
    { f: N.C5, d: 3, t: 20 }, { f: N.E5, d: 2, t: 24 }, { f: N.B4, d: 4, t: 28 },
    { f: N.A4, d: 3, t: 36 }, { f: N.C5, d: 2, t: 40 }, { f: N.F5, d: 2, t: 44 }, { f: N.E5, d: 2, t: 46 },
    { f: N.D5, d: 4, t: 52 }, { f: N.B4, d: 4, t: 58 }
  ];

  let nextMenuLoopTime = 0;

  function scheduleMenuMusicLoop() {
    const c = getCtx();
    if (!c || currentBGMMode !== 'menu' || _muted) return;
    const bus = getTrackBus();
    if (!bus) return;

    const loopDur = 64 * MENU_SIXTEENTH; // ~10.66s
    const now = Math.max(c.currentTime + 0.05, nextMenuLoopTime);
    nextMenuLoopTime = now + loopDur;

    // 1. Warm electric piano / Rhodes chord pads
    COZY_CHORDS.forEach(chordObj => {
      const startTime = now + (chordObj.t * MENU_SIXTEENTH);
      const dur = 14 * MENU_SIXTEENTH;

      chordObj.notes.forEach(freq => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine'; // Softest, warmest tone
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.045, startTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(bus);
        osc.start(startTime);
        osc.stop(startTime + dur + 0.05);
        activeBGMNodes.push(osc);
      });

      // Warm round bass note
      const bassOsc = c.createOscillator();
      const bassGain = c.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(chordObj.bass, startTime);

      bassGain.gain.setValueAtTime(0, startTime);
      bassGain.gain.linearRampToValueAtTime(0.08, startTime + 0.08);
      bassGain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      bassOsc.connect(bassGain);
      bassGain.connect(bus);
      bassOsc.start(startTime);
      bassOsc.stop(startTime + dur + 0.05);
      activeBGMNodes.push(bassOsc);
    });

    // 2. Soft, cozy lead melody
    COZY_MELODY.forEach(note => {
      const startTime = now + (note.t * MENU_SIXTEENTH);
      const dur = note.d * MENU_SIXTEENTH * 0.90;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.055, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.05);
      activeBGMNodes.push(osc);
    });

    // 3. Relaxing lofi vinyl brush beat (gentle shakers)
    for (let s = 0; s < 64; s += 4) {
      const startTime = now + (s * MENU_SIXTEENTH);
      const isBackbeat = (s % 16 === 8);
      const dur = isBackbeat ? 0.08 : 0.035;
      const vol = isBackbeat ? 0.035 : 0.015;

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
  // TRACK 2: BATTLE & MATCH ("Arcade RPG Boss / Challenge Faceoff")
  // Driving 128 BPM minor key tension (D minor -> Bb -> C -> Dm) with galloping bass
  // ─────────────────────────────────────────────────────────────────────────────
  const MATCH_BPM = 128;
  const MATCH_BEAT = 60 / MATCH_BPM; // ~0.468s
  const MATCH_SIXTEENTH = MATCH_BEAT / 4; // ~0.117s

  // Driving 16th-note galloping bassline (Dm / Bb / C / Dm)
  const BATTLE_BASS_PATTERN = [
    // Bar 1: Dm
    N.D3, N.D3, N.F3, N.D3,  N.D3, N.D3, N.A3, N.D3,  N.D3, N.D3, N.F3, N.D3,  N.D3, N.D3, N.C4, N.A3,
    // Bar 2: Bb
    N.Bb2, N.Bb2, N.D3, N.Bb2, N.Bb2, N.Bb2, N.F3, N.Bb2, N.Bb2, N.Bb2, N.D3, N.Bb2, N.Bb2, N.Bb2, N.F3, N.D3,
    // Bar 3: C
    N.C3, N.C3, N.E3, N.C3,  N.C3, N.C3, N.G3, N.C3,  N.C3, N.C3, N.E3, N.C3,  N.C3, N.C3, N.G3, N.E3,
    // Bar 4: Dm Turnaround
    N.D3, N.D3, N.F3, N.D3,  N.D3, N.D3, N.A3, N.D3,  N.D3, N.F3, N.G3, N.A3,  N.C4, N.A3, N.G3, N.F3
  ];

  // Challenging, driving battle melody stabs
  const BATTLE_LEAD_NOTES = [
    // Bar 1
    { f: N.D4, d: 2, t: 0 }, { f: N.F4, d: 2, t: 4 }, { f: N.A4, d: 3, t: 8 }, { f: N.D5, d: 3, t: 12 },
    // Bar 2
    { f: N.F5, d: 2, t: 16 }, { f: N.E5, d: 2, t: 20 }, { f: N.D5, d: 3, t: 24 }, { f: N.Bb4, d: 3, t: 28 },
    // Bar 3
    { f: N.C5, d: 2, t: 32 }, { f: N.E5, d: 2, t: 36 }, { f: N.G5, d: 3, t: 40 }, { f: N.F5, d: 2, t: 44 }, { f: N.E5, d: 2, t: 46 },
    // Bar 4: Climax stab
    { f: N.D5, d: 4, t: 48 }, { f: N.A5, d: 4, t: 54 }, { f: N.D6, d: 4, t: 60 }
  ];

  let nextMatchLoopTime = 0;

  function scheduleMatchMusicLoop() {
    const c = getCtx();
    if (!c || currentBGMMode !== 'match' || _muted) return;
    const bus = getTrackBus();
    if (!bus) return;

    const loopDur = 64 * MATCH_SIXTEENTH; // ~7.5s
    const now = Math.max(c.currentTime + 0.05, nextMatchLoopTime);
    nextMatchLoopTime = now + loopDur;

    // 1. Driving Synth Bassline (Punchy Gallop)
    BATTLE_BASS_PATTERN.forEach((freq, idx) => {
      const startTime = now + (idx * MATCH_SIXTEENTH);
      const dur = MATCH_SIXTEENTH * 0.85;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sawtooth'; // Punchy battle synth
      osc.frequency.setValueAtTime(freq, startTime);

      // Low-pass filter for crisp arcade bass
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, startTime);
      filter.Q.setValueAtTime(2.0, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.09, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.02);
      activeBGMNodes.push(osc);
    });

    // 2. Challenge Lead Melody Stabs
    BATTLE_LEAD_NOTES.forEach(note => {
      const startTime = now + (note.t * MATCH_SIXTEENTH);
      const dur = note.d * MATCH_SIXTEENTH * 0.90;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.085, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.03);
      activeBGMNodes.push(osc);
    });

    // 3. Driving Kick Drum on every beat (0, 4, 8, 12, ...)
    for (let b = 0; b < 64; b += 4) {
      const startTime = now + (b * MATCH_SIXTEENTH);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, startTime);
      osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.08);

      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.10);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(startTime);
      osc.stop(startTime + 0.12);
      activeBGMNodes.push(osc);
    }

    // 4. Punchy Snare on Beat 2 and 4 (4, 12, 20, 28, ...)
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
      gain.gain.setValueAtTime(0.065, startTime);
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
  }

  window.AudioManager = AudioManager;

})();
