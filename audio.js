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
      bgmGain.gain.value = 0.28; // Clear, pleasant background volume
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
  let crowdSourceNodes = [];

  // Frequencies in Hz
  const N = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TRACK 1: MENU & MAP BGM ("Retro 16-Bit Baseball Lounge")
  // ─────────────────────────────────────────────────────────────────────────────
  const MENU_BPM = 110;
  const MENU_BEAT = 60 / MENU_BPM; // ~0.545s
  const MENU_SIXTEENTH = MENU_BEAT / 4; // ~0.136s

  const MENU_LEAD_NOTES = [
    // Bar 1: C Major - Upbeat bounce
    { f: N.E4, d: 2, t: 0 }, { f: N.G4, d: 2, t: 2 }, { f: N.C5, d: 3, t: 4 }, { f: N.E5, d: 1, t: 7 },
    { f: N.D5, d: 2, t: 8 }, { f: N.C5, d: 2, t: 10 }, { f: N.A4, d: 4, t: 12 },
    // Bar 2: A Minor / F - Nostalgic roll
    { f: N.C4, d: 2, t: 16 }, { f: N.E4, d: 2, t: 18 }, { f: N.A4, d: 3, t: 20 }, { f: N.C5, d: 1, t: 23 },
    { f: N.B4, d: 2, t: 24 }, { f: N.A4, d: 2, t: 26 }, { f: N.G4, d: 4, t: 28 },
    // Bar 3: F Major - Bright rising
    { f: N.F4, d: 2, t: 32 }, { f: N.A4, d: 2, t: 34 }, { f: N.C5, d: 2, t: 36 }, { f: N.E5, d: 2, t: 38 },
    { f: N.D5, d: 3, t: 40 }, { f: N.C5, d: 1, t: 43 }, { f: N.D5, d: 4, t: 44 },
    // Bar 4: G Major - Warm turnaround
    { f: N.G4, d: 2, t: 48 }, { f: N.B4, d: 2, t: 50 }, { f: N.D5, d: 2, t: 52 }, { f: N.G5, d: 2, t: 54 },
    { f: N.E5, d: 2, t: 56 }, { f: N.D5, d: 2, t: 58 }, { f: N.C5, d: 4, t: 60 }
  ];

  const MENU_BASS_NOTES = [
    { f: N.C3, t: 0 }, { f: N.G3, t: 4 }, { f: N.C3, t: 8 }, { f: N.G3, t: 12 },
    { f: N.A3, t: 16 }, { f: N.E3, t: 20 }, { f: N.A3, t: 24 }, { f: N.E3, t: 28 },
    { f: N.F3, t: 32 }, { f: N.C3, t: 36 }, { f: N.F3, t: 40 }, { f: N.C3, t: 44 },
    { f: N.G3, t: 48 }, { f: N.D3, t: 52 }, { f: N.G3, t: 56 }, { f: N.B3, t: 60 }
  ];

  let nextMenuLoopTime = 0;

  function scheduleMenuMusicLoop() {
    const c = getCtx();
    if (!c || currentBGMMode !== 'menu' || _muted) return;
    initGains();

    const loopDur = 64 * MENU_SIXTEENTH; // ~8.72s
    const now = Math.max(c.currentTime + 0.05, nextMenuLoopTime);
    nextMenuLoopTime = now + loopDur;

    // Lead Melody
    MENU_LEAD_NOTES.forEach(note => {
      const startTime = now + (note.t * MENU_SIXTEENTH);
      const noteDur = Math.max(0.08, note.d * MENU_SIXTEENTH * 0.90);

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDur);

      osc.connect(gain);
      if (bgmGain) gain.connect(bgmGain);

      osc.start(startTime);
      osc.stop(startTime + noteDur + 0.05);
    });

    // Bassline
    MENU_BASS_NOTES.forEach(note => {
      const startTime = now + (note.t * MENU_SIXTEENTH);
      const noteDur = MENU_SIXTEENTH * 3.6;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDur);

      osc.connect(gain);
      if (bgmGain) gain.connect(bgmGain);

      osc.start(startTime);
      osc.stop(startTime + noteDur + 0.05);
    });

    // Percussion
    for (let s = 0; s < 64; s += 2) {
      const startTime = now + (s * MENU_SIXTEENTH);
      const isSnare = (s % 8 === 4);
      const dur = isSnare ? 0.07 : 0.035;
      const vol = isSnare ? 0.08 : 0.035;
      const freq = isSnare ? 1400 : 4000;

      const bufSize = Math.max(64, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);

      const src = c.createBufferSource();
      src.buffer = buf;

      const filter = c.createBiquadFilter();
      filter.type = isSnare ? 'bandpass' : 'highpass';
      filter.frequency.setValueAtTime(freq, startTime);

      const gain = c.createGain();
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      src.connect(filter);
      filter.connect(gain);
      if (bgmGain) gain.connect(bgmGain);

      src.start(startTime);
      src.stop(startTime + dur + 0.02);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TRACK 2: BATTLE & MATCH BGM ("Live Ballpark Stadium Organ & Claps")
  // ─────────────────────────────────────────────────────────────────────────────
  const MATCH_BPM = 126;
  const MATCH_BEAT = 60 / MATCH_BPM; // ~0.476s
  const MATCH_SIXTEENTH = MATCH_BEAT / 4; // ~0.119s

  // Ballpark Organ Chords (Voicings: [root, 3rd, 5th, octave])
  const ORGAN_CHORD_C = [N.C4, N.E4, N.G4, N.C5];
  const ORGAN_CHORD_F = [N.F4, N.A4, N.C5, N.F5];
  const ORGAN_CHORD_G = [N.G4, N.B4, N.D5, N.G5];
  const ORGAN_CHORD_AM = [N.A4, N.C5, N.E5, N.A5];

  // 4-Bar Ballpark Progression: Bar 1 (C) -> Bar 2 (F) -> Bar 3 (G) -> Bar 4 (Turnaround / Fanfare)
  const MATCH_ORGAN_BARS = [
    // Bar 1: C Chord syncopation (Beats 1, 2.5, 3, 4)
    { chord: ORGAN_CHORD_C, beats: [0, 6, 8, 12] },
    // Bar 2: F Chord syncopation
    { chord: ORGAN_CHORD_F, beats: [16, 22, 24, 28] },
    // Bar 3: G Chord syncopation
    { chord: ORGAN_CHORD_G, beats: [32, 38, 40, 44] },
    // Bar 4: C Chord + High Fanfare Hit
    { chord: ORGAN_CHORD_C, beats: [48, 52, 56, 60] }
  ];

  // Periodic stadium organ riff overlaid on Bar 4 (every 2 loops)
  const MATCH_ORGAN_RIFF = [
    { f: N.G5, d: 2, t: 48 }, { f: N.A5, d: 2, t: 50 }, { f: N.B5, d: 2, t: 52 },
    { f: N.C6, d: 4, t: 54 }, { f: N.G5, d: 2, t: 58 }, { f: N.C6, d: 4, t: 60 }
  ];

  let nextMatchLoopTime = 0;
  let matchLoopCount = 0;

  function scheduleMatchMusicLoop() {
    const c = getCtx();
    if (!c || currentBGMMode !== 'match' || _muted) return;
    initGains();

    const loopDur = 64 * MATCH_SIXTEENTH; // ~7.62s
    const now = Math.max(c.currentTime + 0.05, nextMatchLoopTime);
    nextMatchLoopTime = now + loopDur;
    matchLoopCount++;

    // 1. Play Organ Chords (Rich drawbar organ harmonic: Fundamental + Octave)
    MATCH_ORGAN_BARS.forEach(bar => {
      bar.beats.forEach(b => {
        const startTime = now + (b * MATCH_SIXTEENTH);
        const dur = MATCH_SIXTEENTH * 2.2;

        bar.chord.forEach(freq => {
          const osc1 = c.createOscillator();
          const osc2 = c.createOscillator();
          const gain = c.createGain();

          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(freq, startTime);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(freq * 2, startTime); // Rich organ harmonic

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.085, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

          osc1.connect(gain);
          osc2.connect(gain);
          if (bgmGain) gain.connect(bgmGain);

          osc1.start(startTime);
          osc1.stop(startTime + dur + 0.03);
          osc2.start(startTime);
          osc2.stop(startTime + dur + 0.03);
        });
      });
    });

    // 2. Play Organ Melodic Fanfare on alternating loops
    if (matchLoopCount % 2 === 0) {
      MATCH_ORGAN_RIFF.forEach(n => {
        const startTime = now + (n.t * MATCH_SIXTEENTH);
        const dur = n.d * MATCH_SIXTEENTH * 0.95;

        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.14, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        if (bgmGain) gain.connect(bgmGain);

        osc.start(startTime);
        osc.stop(startTime + dur + 0.04);
      });
    }

    // 3. Play Rhythmic Stadium Claps (Classic "Clap! Clap! Clap-Clap-Clap!")
    // Claps land on: Beat 1 (0), Beat 2 (4), Beat 3 (8), Beat 3.5 (10), Beat 4 (12)
    const clapPattern = [0, 4, 8, 10, 12, 16, 20, 24, 26, 28, 32, 36, 40, 42, 44, 48, 52, 56, 58, 60];
    clapPattern.forEach(b => {
      const startTime = now + (b * MATCH_SIXTEENTH);
      const dur = 0.06;

      const bufSize = Math.max(64, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);

      const src = c.createBufferSource();
      src.buffer = buf;

      // Realistic stadium clap acoustic filter
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, startTime);
      filter.Q.setValueAtTime(1.2, startTime);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      src.connect(filter);
      filter.connect(gain);
      if (bgmGain) gain.connect(bgmGain);

      src.start(startTime);
      src.stop(startTime + dur + 0.02);
    });

    // 4. Low Stadium Kick Drum on Beat 1 and 3 of every measure
    [0, 8, 16, 24, 32, 40, 48, 56].forEach(b => {
      const startTime = now + (b * MATCH_SIXTEENTH);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, startTime);
      osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.08);

      gain.gain.setValueAtTime(0.20, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      if (bgmGain) gain.connect(bgmGain);

      osc.start(startTime);
      osc.stop(startTime + 0.14);
    });
  }

  // Continuous Stadium Crowd Murmur Layer
  function startStadiumAmbiance() {
    stopStadiumAmbiance();
    const c = getCtx();
    if (!c || currentBGMMode !== 'match' || _muted) return;
    initGains();

    try {
      const bufferSize = c.sampleRate * 4;
      const noiseBuffer = c.createBuffer(2, bufferSize, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const out = noiseBuffer.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          out[i] = (b0 + b1 + b2) * 0.25;
        }
      }

      const crowdSource = c.createBufferSource();
      crowdSource.buffer = noiseBuffer;
      crowdSource.loop = true;

      const crowdFilter = c.createBiquadFilter();
      crowdFilter.type = 'bandpass';
      crowdFilter.frequency.setValueAtTime(580, c.currentTime);
      crowdFilter.Q.setValueAtTime(0.7, c.currentTime);

      const crowdGain = c.createGain();
      crowdGain.gain.setValueAtTime(0.001, c.currentTime);
      crowdGain.gain.linearRampToValueAtTime(0.10, c.currentTime + 0.8); // Clear stadium presence

      crowdSource.connect(crowdFilter);
      crowdFilter.connect(crowdGain);
      if (bgmGain) crowdGain.connect(bgmGain);

      crowdSource.start(0);
      crowdSourceNodes.push(crowdSource, crowdGain);
    } catch (e) {}
  }

  function stopStadiumAmbiance() {
    crowdSourceNodes.forEach(node => {
      try {
        if (typeof node.stop === 'function') node.stop();
        if (typeof node.disconnect === 'function') node.disconnect();
      } catch (e) {}
    });
    crowdSourceNodes = [];
  }

  function stopAllBGM() {
    if (bgmIntervalTimer) {
      clearInterval(bgmIntervalTimer);
      bgmIntervalTimer = null;
    }
    stopStadiumAmbiance();
    nextMenuLoopTime = 0;
    nextMatchLoopTime = 0;
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
      if (currentBGMMode === mode) return;
      currentBGMMode = mode;
      stopAllBGM();

      if (_muted || mode === 'off' || !mode) return;

      const c = getCtx();
      if (!c) return;

      if (mode === 'menu') {
        scheduleMenuMusicLoop();
        bgmIntervalTimer = setInterval(() => {
          if (currentBGMMode === 'menu' && !_muted) {
            scheduleMenuMusicLoop();
          }
        }, 3500);
      } else if (mode === 'match') {
        startStadiumAmbiance();
        scheduleMatchMusicLoop();
        bgmIntervalTimer = setInterval(() => {
          if (currentBGMMode === 'match' && !_muted) {
            scheduleMatchMusicLoop();
          }
        }, 3200);
      }
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
        // Resume BGM for current mode
        const mode = currentBGMMode;
        currentBGMMode = 'none';
        this.setBGM(mode || 'menu');
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
      if (c && c.state === 'suspended') {
        c.resume().then(() => {
          if (!_muted && currentBGMMode !== 'off') {
            this.setBGM(currentBGMMode || 'menu');
          }
        }).catch(() => {});
      } else if (c && !_muted && currentBGMMode === 'none') {
        this.setBGM('menu');
      }
    },
  };

  // Auto-unlock audio on any pointer down / click
  if (typeof document !== 'undefined') {
    const unlockHandler = () => {
      AudioManager.unlock();
      document.removeEventListener('pointerdown', unlockHandler);
      document.removeEventListener('keydown', unlockHandler);
    };
    document.addEventListener('pointerdown', unlockHandler);
    document.addEventListener('keydown', unlockHandler);
  }

  window.AudioManager = AudioManager;

})();
