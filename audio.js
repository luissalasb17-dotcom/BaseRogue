/**
 * BaseRogue AudioManager
 * ──────────────────────
 * Synthesizes all game audio using the Web Audio API.
 * No external files required — works offline and avoids CORS/autoplay issues.
 *
 * Usage:
 *   AudioManager.play('hit');
 *   AudioManager.play('hr');
 *   AudioManager.toggleMute();
 */

(function () {
  'use strict';

  // ── Context ───────────────────────────────────────────────────────────────────
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null; // Browser doesn't support Web Audio — fail silently
      }
    }
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // ── Master gain (mute control) ────────────────────────────────────────────────
  let masterGain = null;
  function getMasterGain() {
    const c = getCtx();
    if (!c) return null;
    if (!masterGain) {
      masterGain = c.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(c.destination);
    }
    return masterGain;
  }

  // ── Mute state ────────────────────────────────────────────────────────────────
  let _muted = false;
  try { _muted = localStorage.getItem('baserogue_muted') === 'true'; } catch (e) {}

  function applyMuteState() {
    const g = getMasterGain();
    if (g) g.gain.value = _muted ? 0 : 1;
  }
  applyMuteState();

  // ── Utility: connect node chain to master ────────────────────────────────────
  function connect(node) {
    const g = getMasterGain();
    if (g) node.connect(g);
    return node;
  }

  // ── Synthesizer helpers ───────────────────────────────────────────────────────

  /**
   * Play a simple oscillator tone.
   * @param {number} freq    Frequency in Hz
   * @param {number} dur     Duration in seconds
   * @param {string} type    Oscillator type: 'sine'|'square'|'sawtooth'|'triangle'
   * @param {number} vol     Peak volume 0-1
   * @param {number} delay   Start delay in seconds (default 0)
   * @param {number} attack  Attack time in seconds (default 0.005)
   * @param {number} release Release time in seconds (default dur*0.7)
   */
  function tone(freq, dur, type = 'sine', vol = 0.3, delay = 0, attack = 0.005, release = null) {
    const c = getCtx();
    if (!c) return;
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
    connect(gain);

    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  /**
   * White-noise burst (for bat crack, crowd).
   */
  function noise(dur, vol = 0.3, delay = 0, filterFreq = 2000, filterType = 'bandpass') {
    const c = getCtx();
    if (!c) return;
    const bufSize = c.sampleRate * (dur + 0.1);
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
    connect(gain);

    src.start(now);
    src.stop(now + dur + 0.05);
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

    // 3. PLAY BALL — stadium-style "Let's play ball!" ambiance
    // Two-tone trumpet + crowd swell
    play_ball() {
      // Crowd rumble (low-pass noise)
      noise(1.2, 0.08, 0.0, 300, 'lowpass');
      // Trumpet fanfare — two note stab
      tone(587.33, 0.15, 'sawtooth', 0.18, 0.0,  0.01); // D5
      tone(783.99, 0.20, 'sawtooth', 0.22, 0.12, 0.01); // G5
      tone(987.77, 0.35, 'sawtooth', 0.25, 0.28, 0.01); // B5
      // Crowd cheer build
      noise(0.6, 0.10, 0.4, 800, 'bandpass');
    },

    // 4. OUT — short descending two-tone thud
    out() {
      tone(330, 0.12, 'triangle', 0.22, 0.0);
      tone(220, 0.18, 'triangle', 0.18, 0.10);
      // Soft thud noise
      noise(0.08, 0.15, 0.0, 200, 'lowpass');
    },

    // 5. STRIKE OUT — sharp buzzer-style descending
    so() {
      tone(466.16, 0.08, 'sawtooth', 0.20, 0.00); // Bb4
      tone(349.23, 0.08, 'sawtooth', 0.20, 0.07); // F4
      tone(261.63, 0.15, 'sawtooth', 0.18, 0.14); // C4
    },

    // 6. BASE HIT (1B / 2B / 3B) — bat crack
    hit() {
      // Sharp transient noise = bat crack
      noise(0.06, 0.45, 0.0, 4000, 'highpass');
      noise(0.15, 0.25, 0.0, 1200, 'bandpass');
      // Short resonant tone
      tone(200, 0.18, 'triangle', 0.12, 0.03);
    },

    // 7. HOME RUN — bigger crack + crowd cheer
    hr() {
      // Bigger crack
      noise(0.07, 0.70, 0.0, 5000, 'highpass');
      noise(0.20, 0.40, 0.0, 1500, 'bandpass');
      tone(180, 0.25, 'triangle', 0.18, 0.04);
      // Crowd cheer swell
      noise(1.2, 0.18, 0.15, 600, 'bandpass');
      noise(0.8, 0.12, 0.60, 400, 'lowpass');
      // Ascending celebration notes
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
      // Crowd cheer
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

    // 12. ROULETTE WIN — jackpot/fanfare chime when season locks in
    roulette_win() {
      tone(523.25, 0.08, 'sine', 0.22, 0.00);  // C5
      tone(659.25, 0.08, 'sine', 0.22, 0.06);  // E5
      tone(783.99, 0.08, 'sine', 0.22, 0.12);  // G5
      tone(1046.50, 0.12, 'sine', 0.25, 0.18); // C6
      tone(1318.51, 0.12, 'sine', 0.25, 0.26); // E6
      tone(1567.98, 0.25, 'sine', 0.28, 0.34); // G6
      tone(2093.00, 0.35, 'triangle', 0.20, 0.44); // C7
    },

  };

  // ── Public API ────────────────────────────────────────────────────────────────

  const AudioManager = {

    /**
     * Play a sound by key. Overlaps with any currently playing sound.
     * @param {string} key — e.g. 'hit', 'hr', 'out', 'so', 'menu_click', etc.
     * @param {any} arg    — optional parameter passed to sound synthesizer
     */
    play(key, arg) {
      if (_muted) return;
      try {
        const fn = sounds[key];
        if (fn) fn(arg);
      } catch (e) {
        // Fail silently — audio must never break game flow
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
      return _muted;
    },

    /** Returns true if currently muted. */
    isMuted() { return _muted; },

    /**
     * Sync the mute button icon/label to current state.
     * Called automatically by toggleMute(); can also be called on init.
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
     * Call this inside any early click handler.
     */
    unlock() {
      getCtx(); // creates + resumes context
    },
  };

  window.AudioManager = AudioManager;

})();
