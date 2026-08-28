// basedex.js
(function() {
  const ERA_TABS = [
    { key: 'all', get label() { return (typeof window.t === 'function' ? window.t('dex.era_all') : 'TODOS'); } },
    { key: 'The Genesis Era (1871-1900)', label: 'GENESIS' },
    { key: 'Deadball (1901-1919)', label: 'DEADBALL' },
    { key: 'Golden Era (1920-1941)', label: 'GOLDEN' },
    { key: 'Integration (1942-1960)', label: 'INTEGRATION' },
    { key: 'Expansion (1961-1976)', label: 'EXPANSION' },
    { key: 'Big Hair Era (1977-1993)', label: 'BIG HAIR' },
    { key: 'Steroid Era (1994-2005)', label: 'STEROID' },
    { key: 'Efficiency Era (2006-2015)', label: 'EFFICIENCY' },
    { key: 'Modern Era (2016-Pres)', label: 'MODERN' },
  ];

  const BATTER_POS_TABS = [
    { key: 'all', get label() { return (typeof window.t === 'function' ? window.t('dex.pos_all', 'TODOS') : 'TODOS'); } },
    { key: 'C', label: 'C' },
    { key: '1B', label: '1B' },
    { key: '2B', label: '2B' },
    { key: '3B', label: '3B' },
    { key: 'SS', label: 'SS' },
    { key: 'LF', label: 'LF' },
    { key: 'CF', label: 'CF' },
    { key: 'RF', label: 'RF' },
    { key: 'DH', label: 'DH' }
  ];

  const PITCHER_POS_TABS = [
    { key: 'all', get label() { return (typeof window.t === 'function' ? window.t('dex.pos_all', 'TODOS') : 'TODOS'); } },
    { key: 'SP', label: 'SP' },
    { key: 'RP', label: 'RP' }
  ];

  const POS_SYNONYMS = {
    'c': 'C', 'catcher': 'C', 'receptor': 'C', 'cat': 'C',
    '1b': '1B', 'first base': '1B', 'primera base': '1B', 'primera': '1B',
    '2b': '2B', 'second base': '2B', 'segunda base': '2B', 'segunda': '2B',
    '3b': '3B', 'third base': '3B', 'tercera base': '3B', 'tercera': '3B',
    'ss': 'SS', 'shortstop': 'SS', 'campo corto': 'SS', 'campocorto': 'SS',
    'lf': 'LF', 'left field': 'LF', 'left fielder': 'LF', 'jardinero izquierdo': 'LF', 'izquierdo': 'LF',
    'cf': 'CF', 'center field': 'CF', 'center fielder': 'CF', 'jardinero central': 'CF', 'central': 'CF',
    'rf': 'RF', 'right field': 'RF', 'right fielder': 'RF', 'jardinero derecho': 'RF', 'derecho': 'RF',
    'dh': 'DH', 'designated hitter': 'DH', 'bateador designado': 'DH', 'designado': 'DH',
    'sp': 'SP', 'starter': 'SP', 'starting pitcher': 'SP', 'abridor': 'SP', 'pitcher abridor': 'SP',
    'rp': 'RP', 'reliever': 'RP', 'relief pitcher': 'RP', 'relevista': 'RP', 'closer': 'RP', 'cerrador': 'RP'
  };

  const RARITY_COLORS = {
    Legendary: '#ffd700',
    Epic: '#a855f7',
    Rare: '#3b82f6',
    Uncommon: '#10b981',
    Common: '#6b7280'
  };

  const GRADE_COLORS = {
    'S': '#ffd700',
    'A': '#22d3ee',
    'B': '#4ade80',
    'C': '#94a3b8',
    'D': '#f97316',
    'F': '#ef4444'
  };

  // Matches ui.js's getStatGrade() +/- bands so BaseballDex doesn't flatten
  // every mid-range value into one bare letter (was showing "C" for a wide
  // 40-59 span with no C+/C- distinction, unlike the rest of the game's cards).
  function getGrade(val) {
    const v = Math.round(Number(val) || 0);
    let letter = 'F', modifier = '';
    // 20-point Attribute Grade Scale
    if (v >= 100) {
      letter = 'S';
    } else if (v >= 80) {
      letter = 'A';
      if (v >= 95) modifier = '+';
      else if (v < 85) modifier = '-';
    } else if (v >= 60) {
      letter = 'B';
      if (v >= 75) modifier = '+';
      else if (v < 65) modifier = '-';
    } else if (v >= 40) {
      letter = 'C';
      if (v >= 55) modifier = '+';
      else if (v < 45) modifier = '-';
    } else if (v >= 20) {
      letter = 'D';
      if (v >= 35) modifier = '+';
      else if (v < 25) modifier = '-';
    } else {
      letter = 'F';
    }
    return letter + modifier;
  }

  function getGradeColor(val) {
    const letter = getGrade(val).charAt(0);
    return GRADE_COLORS[letter] || GRADE_COLORS.F;
  }

  function normalizeSearchText(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents (ñ -> n, á -> a, etc.)
      .toLowerCase()
      .trim();
  }

  function getPosText(p) {
    if (!p) return '';
    if (p.sec_pos && String(p.sec_pos).trim() !== '') {
      return `${p.pos} / ${p.sec_pos}`;
    }
    return p.pos || '';
  }

  function getBbrefUrl(p) {
    if (!p) return 'https://www.baseball-reference.com';
    const rawName = p.cleanName || p.name || '';
    const cleanName = rawName.replace(/\s*\(.*?\)$/, '').trim();
    const normName = normalizeSearchText(cleanName);

    // 1. Direct playerID on object
    let pid = p.playerID || p.bbref_id || p.id;

    // 2. Lookup in Lahman Batters Pool
    if (!pid && window.PlayersDB && Array.isArray(window.PlayersDB.LAHMAN_POOL)) {
      const match = window.PlayersDB.LAHMAN_POOL.find(x => 
        x && (x.name === cleanName || normalizeSearchText(x.name) === normName)
      );
      if (match && match.playerID) pid = match.playerID;
    }

    // 3. Lookup in Pitchers Pool
    if (!pid && window.PitchersDB && Array.isArray(window.PitchersDB.PITCHERS_POOL)) {
      const match = window.PitchersDB.PITCHERS_POOL.find(x => 
        x && (x.name === cleanName || normalizeSearchText(x.name) === normName)
      );
      if (match && match.playerID) pid = match.playerID;
    }

    // 4. Lookup in Career Stats DB
    if (!pid) {
      const db = window.CAREER_STATS_DB || {};
      const keyWithYear = `${cleanName}_${p.year}`;
      const entry = (p.playerID && db[p.playerID]) || db[keyWithYear] || db[cleanName] || db[p.name] || db[cleanName.toLowerCase()] || db[normName];
      if (entry) pid = entry.playerID || entry.bbref_id;
    }

    // If valid playerID found, build canonical URL
    if (pid && typeof pid === 'string' && pid.length >= 3) {
      const cleanPid = pid.trim().toLowerCase();
      const firstLetter = cleanPid.charAt(0);
      return `https://www.baseball-reference.com/players/${firstLetter}/${cleanPid}.shtml`;
    }

    // Clean fallback search URL
    const searchParam = cleanName.replace(/['`]/g, '');
    return `https://www.baseball-reference.com/search/search.fcgi?search=${encodeURIComponent(searchParam)}`;
  }

  function getPlayerCareerData(p) {
    if (!p) return { war: '-', mvp: 0, roy: 0, ss: 0, gg: 0, cy: 0, rel: 0, allstars: 0, hof: false, h: '-', hr: '-', rbi: '-', avg: '-', ops: '-', sb: '-', g: '-', ab: '-', w: '-', l: '-', era: '-', so: '-', ip: '-', whip: '-', sv: '-' };
    const cleanName = p.name ? p.name.replace(/\s\(.*?\)$/, '').trim() : '';
    const keyWithYear = `${cleanName}_${p.year}`;
    const db = window.CAREER_STATS_DB || {};
    const entry = (p.playerID && db[p.playerID]) || db[keyWithYear] || db[cleanName] || db[p.name] || db[cleanName.toLowerCase()];

    if (entry) {
      return {
        war: (entry.war !== null && entry.war !== undefined) ? entry.war : (p.ovr ? (p.ovr / 10).toFixed(1) : '-'),
        mvp: entry.mvp !== undefined ? entry.mvp : (p.mvp || 0),
        roy: entry.roy !== undefined ? entry.roy : (p.roy || 0),
        ss: entry.ss !== undefined ? entry.ss : (p.silver_sluggers || p.ss || 0),
        gg: entry.gg !== undefined ? entry.gg : (p.gold_gloves || p.gg || 0),
        cy: entry.cy !== undefined ? entry.cy : (p.cy_youngs || p.cy || 0),
        rel: entry.rel !== undefined ? entry.rel : (p.reliever_awards || p.rel || 0),
        allstars: entry.allstars !== undefined ? entry.allstars : (p.allstars || 0),
        hof: entry.hof !== undefined ? entry.hof : (p.hof || false),

        // Batting traditional stats
        h: entry.h !== undefined ? entry.h : '-',
        hr: entry.hr !== undefined ? entry.hr : '-',
        rbi: entry.rbi !== undefined ? entry.rbi : '-',
        avg: entry.avg !== undefined ? entry.avg : '-',
        ops: entry.ops !== undefined ? entry.ops : '-',
        sb: entry.sb !== undefined ? entry.sb : '-',
        g: entry.g !== undefined ? entry.g : '-',
        ab: entry.ab !== undefined ? entry.ab : '-',

        // Pitching traditional stats
        w: entry.w !== undefined ? entry.w : '-',
        l: entry.l !== undefined ? entry.l : '-',
        era: entry.era !== undefined ? entry.era : '-',
        so: entry.so !== undefined ? entry.so : '-',
        ip: entry.ip !== undefined ? entry.ip : '-',
        whip: entry.whip !== undefined ? entry.whip : '-',
        sv: entry.sv !== undefined ? entry.sv : '-'
      };
    }

    return {
      war: p.ovr ? (p.ovr / 10).toFixed(1) : '-',
      mvp: p.mvp || 0,
      roy: p.roy || 0,
      ss: p.silver_sluggers || p.ss || 0,
      gg: p.gold_gloves || p.gg || 0,
      cy: p.cy_youngs || p.cy || 0,
      rel: p.reliever_awards || p.rel || 0,
      allstars: p.allstars || 0,
      hof: p.hof || false,
      h: '-', hr: '-', rbi: '-', avg: '-', ops: '-', sb: '-', g: '-', ab: '-',
      w: '-', l: '-', era: '-', so: '-', ip: '-', whip: '-', sv: '-'
    };
  }

  window.BaseballDex = {
    STORAGE_KEY: 'baserogue_dex_v1',
    OPPONENTS_STORAGE_KEY: 'baserogue_dex_opponents_v1',
    unlocked: new Set(),
    unlockedOpponents: new Set(),
    activeCategory: 'legends', // 'legends' or 'opponents'
    currentFilterEra: 'all',
    currentFilterPos: 'all',
    currentSearchTerm: '',
    challenge162Only: false,
    filteredPlayers: [],
    renderLimit: 200,
    currentRendered: 0,
    container: null,

    init() {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          this.unlocked = new Set(arr);
        } catch (e) {
          this.unlocked = new Set();
        }
      }
      const storedOpp = localStorage.getItem(this.OPPONENTS_STORAGE_KEY);
      if (storedOpp) {
        try {
          const arrOpp = JSON.parse(storedOpp);
          this.unlockedOpponents = new Set(arrOpp);
        } catch (e) {
          this.unlockedOpponents = new Set();
        }
      }
    },

    save() {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.unlocked)));
      localStorage.setItem(this.OPPONENTS_STORAGE_KEY, JSON.stringify(Array.from(this.unlockedOpponents)));
      this.updateCounters();
    },

    _getPlayerKeys(player) {
      if (!player) return [];
      const keys = [];
      const rawName = (player.cleanName || player.name || '').replace(/\s*\(\d{4}\)/g, '').replace(/\s*\(.*?\)/g, '').trim();
      const year = player.year || player.peak_year || '';
      if (rawName && year) {
        keys.push(`${rawName}_${year}`);
      }
      if (player.name && player.year) {
        keys.push(`${player.name}_${player.year}`);
      }
      if (player.playerID) {
        keys.push(`id_${player.playerID}`);
      }
      return keys;
    },

    _getOpponentKeys(pitcher) {
      if (!pitcher) return [];
      const keys = [];
      const clean = (pitcher.cleanName || pitcher.name || '').replace(/\s*\(\d{4}\)/g, '').replace(/\s*\(.*?\)/g, '').trim();
      const name = (pitcher.name || '').trim();
      const year = pitcher.year || pitcher.peak_year_display || pitcher.peak_year || '';
      const role = (pitcher.role || pitcher.pos || 'SP').toUpperCase();

      if (clean && year && role) keys.push(`${clean}_${year}_${role}`);
      if (clean && year) keys.push(`${clean}_${year}`);
      if (name && year && role) keys.push(`${name}_${year}_${role}`);
      if (name && year) keys.push(`${name}_${year}`);
      if (pitcher.playerID) keys.push(`id_${pitcher.playerID}`);
      return keys;
    },

    unlock(player) {
      if (!player || player.isReplacement) return;
      const keys = this._getPlayerKeys(player);
      let changed = false;
      keys.forEach(k => {
        if (!this.unlocked.has(k)) {
          this.unlocked.add(k);
          changed = true;
        }
      });
      if (changed) this.save();
    },

    playCardFlipSound() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const bufferSize = ctx.sampleRate * 0.16;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.08);
        filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.16);
        filter.Q.value = 3.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } catch (e) {}
    },

    playPackSound(rarity) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        // 1. Foil tear noise
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3200;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();

        // 2. Chime fanfare based on rarity
        const isLeg = rarity === 'Legendary';
        const isEpic = rarity === 'Epic';
        const chord = isLeg 
          ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // C Major fanfare
          : (isEpic ? [440.0, 554.37, 659.25, 880.0] : [392.0, 493.88, 587.33, 783.99]);

        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = isLeg ? 'triangle' : 'sine';
          osc.frequency.value = freq;
          const startTime = ctx.currentTime + 0.12 + (idx * 0.06);
          g.gain.setValueAtTime(0, startTime);
          g.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.85);
        });
      } catch (e) {}
    },

    showRandomCard() {
      // Remove any existing overlay
      const existing = document.getElementById('dex-detail-overlay');
      if (existing) existing.remove();
      const existingPack = document.getElementById('dex-pack-overlay');
      if (existingPack) existingPack.remove();

      // Completely unfiltered global pool: every card in the catalog has equal probability regardless of era tabs, position pills or search text
      let pool = [];
      const isPitchers = this.activeCategory === 'opponents';
      if (isPitchers) {
        pool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : (window.PITCHERS_POOL || []);
      } else {
        pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : (window.PlayersDB && window.PlayersDB.PLAYERS_POOL ? window.PlayersDB.PLAYERS_POOL : (window.LAHMAN_POOL || []));
      }

      if (!pool || pool.length === 0) {
        console.warn('BaseballDex: pool is empty for category', this.activeCategory);
        return;
      }

      const randomPlayer = pool[Math.floor(Math.random() * pool.length)];
      if (!randomPlayer) return;

      // Render Interactive Pack Opening Overlay
      const packOverlay = document.createElement('div');
      packOverlay.id = 'dex-pack-overlay';
      packOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);';

      const packSubtitle = isPitchers ? 'ALL-TIME PITCHERS PACK' : 'ALL-TIME LEGENDS PACK';

      packOverlay.innerHTML = `
        <div class="dex-foil-pack-wrapper" id="dex-booster-pack-target">
          <div class="dex-foil-pack" id="dex-foil-pack-inner">
            <div class="dex-foil-crimp" id="dex-pack-crimp-top"></div>
            
            <div style="text-align:center;margin:20px 0;">
              <div style="font-size:32px;filter:drop-shadow(0 0 10px #ffd700);margin-bottom:8px;">⚾</div>
              <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:#ffd700;letter-spacing:1px;text-shadow:0 0 10px rgba(255,215,0,0.8);line-height:1.4;">
                ${typeof window.t === 'function' ? window.t('dex.pack_title', 'SOBRE RETRO COLECCIONABLE') : 'SOBRE RETRO COLECCIONABLE'}
              </div>
              <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#38bdf8;margin-top:10px;background:rgba(56,189,248,0.15);border:1px solid #38bdf8;padding:4px 8px;border-radius:4px;display:inline-block;">
                ${packSubtitle}
              </div>
            </div>

            <div style="text-align:center;margin-bottom:12px;">
              <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#00ff66;animation:packGlowPulse 1.2s infinite ease-in-out;letter-spacing:0.5px;">
                ${typeof window.t === 'function' ? window.t('dex.pack_tap', '✨ TOCA PARA ABRIR ✨') : '✨ TOCA PARA ABRIR ✨'}
              </div>
            </div>

            <div class="dex-foil-crimp"></div>
          </div>
        </div>
      `;

      let opened = false;
      const doOpen = () => {
        if (opened) return;
        opened = true;

        this.playPackSound(randomPlayer.rarity);

        const crimpTop = packOverlay.querySelector('#dex-pack-crimp-top');
        const packInner = packOverlay.querySelector('#dex-foil-pack-inner');
        if (crimpTop) crimpTop.style.animation = 'packFoilRipTop 0.35s forwards ease-out';
        if (packInner) packInner.style.boxShadow = '0 0 60px rgba(255,255,255,0.8)';

        // Automatically unlock this player in the Dex when opened from pack
        if (this.activeCategory === 'opponents') {
          this.unlockOpponent(randomPlayer);
        } else {
          this.unlock(randomPlayer);
        }
        this.updateCounters();
        if (this.container) {
          this.applyFilters();
        }

        setTimeout(() => {
          packOverlay.remove();
          this.showDetail(randomPlayer, true);
        }, 400);
      };

      packOverlay.querySelector('#dex-booster-pack-target').onclick = doOpen;
      packOverlay.onclick = (e) => {
        if (e.target === packOverlay) packOverlay.remove();
      };

      document.body.appendChild(packOverlay);
    },

    unlockRoster(roster) {
      if (!roster) return;
      const players = Array.isArray(roster) ? roster : Object.values(roster);
      let changed = false;
      players.forEach(p => {
        if (p && !p.isReplacement) {
          const keys = this._getPlayerKeys(p);
          keys.forEach(k => {
            if (!this.unlocked.has(k)) {
              this.unlocked.add(k);
              changed = true;
            }
          });
        }
      });
      if (changed) this.save();
    },

    unlockOpponent(pitcher) {
      if (!pitcher) return;
      const keys = this._getOpponentKeys(pitcher);
      let changed = false;
      keys.forEach(k => {
        if (!this.unlockedOpponents.has(k)) {
          this.unlockedOpponents.add(k);
          changed = true;
        }
      });
      if (changed) {
        this.save();
        console.log('⚾ BaseballDex: Oponente desbloqueado ->', keys[0]);
      }
    },

    unlockAll() {
      const pool = window.PlayersDB ? window.PlayersDB.LAHMAN_POOL : [];
      this.unlocked = new Set();
      pool.forEach(p => {
        const keys = this._getPlayerKeys(p);
        keys.forEach(k => this.unlocked.add(k));
      });
      
      const pPool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : (window.PITCHERS_POOL || []);
      this.unlockedOpponents = new Set();
      pPool.forEach(p => {
        const keys = this._getOpponentKeys(p);
        keys.forEach(k => this.unlockedOpponents.add(k));
      });

      this.save();
      if (this.container) this.renderPanel();
      if (window.Challenge162 && typeof window.Challenge162.unlockAllForTesting === 'function' && !this._syncing) {
        this._syncing = true;
        window.Challenge162.unlockAllForTesting();
        this._syncing = false;
      }
      console.log(`⚾ BaseballDex: ¡Todas las cartas han sido desbloqueadas!`);
      return `¡Desbloqueadas todas las cartas (${pool.length} leyendas / ${pPool.length} oponentes)!`;
    },

    lockAll() {
      this.unlocked.clear();
      this.unlockedOpponents.clear();
      this.save();
      if (this.container) this.renderPanel();
      console.log('⚾ BaseballDex: Todas las cartas han sido bloqueadas.');
      return 'Todas las cartas bloqueadas.';
    },

    isUnlocked(player) {
      if (!player) return false;
      if (this.activeCategory === 'opponents') {
        const keys = this._getOpponentKeys(player);
        return keys.some(k => this.unlockedOpponents.has(k));
      }
      const keys = this._getPlayerKeys(player);
      return keys.some(k => this.unlocked.has(k));
    },

    getStats() {
      let pool = [];
      if (this.activeCategory === 'opponents') {
        pool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : [];
        let validCount = 0;
        for (let i = 0; i < pool.length; i++) {
          if (this.isUnlocked(pool[i])) validCount++;
        }
        return { total: pool.length, unlocked: validCount };
      }
      pool = window.PlayersDB ? window.PlayersDB.LAHMAN_POOL : [];
      let validCount = 0;
      for (let i = 0; i < pool.length; i++) {
        if (this.isUnlocked(pool[i])) validCount++;
      }
      return { total: pool.length, unlocked: validCount };
    },

    open() {
      this.renderPanel();
    },

    close() {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
    },

    updateCounters() {
      const elText = document.getElementById('dex-counter');
      const elFill = document.getElementById('dex-progress-fill');
      const stats = this.getStats();
      const pct = stats.total > 0 ? ((stats.unlocked / stats.total) * 100).toFixed(1) : 0;
      
      if (elText) {
        const catLabel = this.activeCategory === 'opponents'
          ? (typeof window.t === 'function' ? window.t('dex.counter_opponents', 'Oponentes Enfrentados') : 'Oponentes Enfrentados')
          : (typeof window.t === 'function' ? window.t('dex.counter_legends', 'Cartas Descubiertas') : 'Cartas Descubiertas');
        elText.innerText = `${stats.unlocked} / ${stats.total} (${catLabel})`;
      }
      if (elFill) {
        elFill.style.width = `${pct}%`;
      }
    },

    applyFilters() {
      let pool = [];
      if (this.activeCategory === 'opponents') {
        pool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : [];
      } else {
        pool = window.PlayersDB ? window.PlayersDB.LAHMAN_POOL : [];
      }

      const rawTerm = normalizeSearchText(this.currentSearchTerm);
      let term = rawTerm;
      let explicitPos = null;

      // Check for explicit "pos:C" or "pos:1B"
      const posMatch = term.match(/^pos:([a-z0-9]+)\s*(.*)$/i);
      if (posMatch) {
        explicitPos = posMatch[1].toUpperCase();
        term = posMatch[2].trim();
      }

      const activePosFilter = explicitPos || (this.currentFilterPos !== 'all' ? this.currentFilterPos : null);

      this.filteredPlayers = pool.filter(p => {
        if (this.currentFilterEra !== 'all' && p.era !== this.currentFilterEra) return false;
        if (this.challenge162Only && !(window.Challenge162 && window.Challenge162.isUnlocked(p))) return false;

        const pPos = (p.pos || p.role || '').toUpperCase();
        const secPosArr = (p.sec_pos || '').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);

        // Position pill / explicit position filter (Strictly by Primary Position)
        if (activePosFilter) {
          const target = activePosFilter.toUpperCase();
          const matchPos = (pPos === target);
          if (!matchPos) return false;
        }

        if (term) {
          const synPos = POS_SYNONYMS[term];
          const nameNorm = normalizeSearchText(p.name || p.cleanName || '');
          const teamNorm = normalizeSearchText(p.team || '');
          const pPosNorm = normalizeSearchText(p.pos || p.role || '');
          const secPosNorm = normalizeSearchText(p.sec_pos || '');

          // 1. If user typed a recognized position alias (e.g. "c", "catcher", "1b", "ss", "sp", "rp")
          if (synPos) {
            const isPosMatch = pPos === synPos || secPosArr.includes(synPos);
            // Also allow matching names starting with this term (e.g. "Cain" when typing "c")
            const nameWords = nameNorm.split(/\s+/);
            const isNamePrefix = nameWords.some(w => w.startsWith(term));
            const isTeamMatch = teamNorm === term;
            if (!isPosMatch && !isNamePrefix && !isTeamMatch) return false;
            return true;
          }

          // 2. Short search term (1-2 characters): match exact pos, exact team, or start of words in name
          if (term.length <= 2) {
            const isExactPos = pPosNorm === term || secPosNorm.split(',').map(s => s.trim()).includes(term);
            const nameWords = nameNorm.split(/\s+/);
            const isNamePrefix = nameWords.some(w => w.startsWith(term));
            const isTeamMatch = teamNorm === term || teamNorm.startsWith(term);
            if (!isExactPos && !isNamePrefix && !isTeamMatch) return false;
            return true;
          }

          // 3. Multi-character search term (3+ chars): substring match on name, team, position
          const nMatch = nameNorm.includes(term);
          const tMatch = teamNorm.includes(term);
          const pMatch = pPosNorm.includes(term) || secPosNorm.includes(term);
          if (!nMatch && !tMatch && !pMatch) return false;
        }
        return true;
      });

      // Sort: unlocked first, then by OVR desc
      this.filteredPlayers.sort((a, b) => {
        const uA = this.isUnlocked(a) ? 1 : 0;
        const uB = this.isUnlocked(b) ? 1 : 0;
        if (uA !== uB) return uB - uA;
        return (b.ovr || 0) - (a.ovr || 0);
      });

      this.currentRendered = 0;
      const grid = document.getElementById('dex-grid');
      if (grid) {
        grid.innerHTML = '';
        this.renderMore();
      }
    },

    renderMore() {
      const grid = document.getElementById('dex-grid');
      if (!grid) return;

      const toRender = this.filteredPlayers.slice(this.currentRendered, this.currentRendered + this.renderLimit);
      
      toRender.forEach(p => {
        const isUnl = this.isUnlocked(p);
        const el = document.createElement('div');
        if (isUnl) {
          const rColor = RARITY_COLORS[p.rarity] || RARITY_COLORS.Common;
          const isChallengeEligible = !!(window.Challenge162 && window.Challenge162.isUnlocked(p));
          el.className = 'dex-card unlocked';
          el.style.cssText = `position: relative; background: #0d1f12; border: 2px solid ${rColor}; border-radius: 8px; padding: 10px 6px; text-align: center; cursor: pointer; transition: transform 0.15s; display: flex; flex-direction: column; justify-content: space-between;`;

          const posLabel = p.role || p.pos || 'P';
          const subLabel = p.team || '';

          const challenge162Tooltip = (typeof window.t === 'function' ? window.t('dex.challenge162_badge_tooltip') : 'Elegible para el 162-0 Challenge');
          el.innerHTML = `
            ${isChallengeEligible ? `<span title="${challenge162Tooltip}" style="position:absolute;top:4px;right:4px;font-size:11px;filter:drop-shadow(0 0 3px rgba(255,215,0,0.8));">🏆</span>` : ''}
            <div>
              <div style="font-size:7px;color:#00ff66;font-family:'Press Start 2P',monospace;margin-bottom:4px">${posLabel}</div>
              <div style="font-size:7px;color:#e5e7eb;font-family:'Press Start 2P',monospace;line-height:1.3;word-break:break-word">${p.name}</div>
              <div style="font-size:6px;color:#9ca3af;margin-top:3px">${subLabel} '${p.year}</div>
            </div>
            <div>
              <div style="font-size:8px;font-weight:bold;color:${rColor};margin-top:4px">OVR ${Math.floor(p.ovr)}</div>
              <div style="font-size:5px;background:${rColor}22;color:${rColor};padding:1px 4px;border-radius:3px;margin-top:3px;display:inline-block">${p.rarity || 'Common'}</div>
            </div>
          `;
          el.onclick = () => this.showDetail(p);
          el.onmouseenter = () => el.style.transform = 'scale(1.05)';
          el.onmouseleave = () => el.style.transform = 'scale(1)';
        } else {
          el.className = 'dex-card locked';
          el.style.cssText = 'background: #111827; border: 2px solid #1f2937; border-radius: 8px; padding: 10px 6px; text-align: center; cursor: default';
          el.innerHTML = `
            <div style="width:50px;height:50px;background:#1f2937;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center">
              <i class="fa-solid fa-user" style="color:#374151;font-size:20px"></i>
            </div>
            <div style="font-size:7px;color:#4b5563;font-family:'Press Start 2P',monospace">???</div>
            <div style="font-size:6px;color:#374151;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.locked') : 'BLOQUEADO')}</div>
          `;
        }
        grid.appendChild(el);
      });

      this.currentRendered += toRender.length;

      const oldBtn = document.getElementById('dex-load-more');
      if (oldBtn) oldBtn.remove();

      if (this.currentRendered < this.filteredPlayers.length) {
        const btn = document.createElement('button');
        btn.id = 'dex-load-more';
        btn.innerText = (typeof window.t === 'function' ? window.t('dex.load_more') : 'Mostrar más');
        btn.style.cssText = 'grid-column: 1 / -1; padding: 10px; background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px; font-family:"Press Start 2P", monospace; font-size: 8px;';
        btn.onclick = () => this.renderMore();
        grid.appendChild(btn);
      }
    },

    renderPanel() {
      if (this.container) this.close();

      this.container = document.createElement('div');
      this.container.style.cssText = 'position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; padding: 20px;';
      
      const panel = document.createElement('div');
      panel.style.cssText = 'width: 100%; max-width: 900px; max-height: 90vh; height: 100%; background: #0a0f1a; border: 3px solid #00ff66; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; position: relative;';

      // Header
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3)';
      
      const title = document.createElement('h2');
      title.style.cssText = 'font-family: "Press Start 2P", monospace; font-size: 14px; color: #00ff66; margin: 0;';
      title.innerText = '⚾ BASEBALL-DEX';
      
      const counter = document.createElement('div');
      counter.id = 'dex-counter';
      counter.style.cssText = 'font-family: "Press Start 2P", monospace; font-size: 8px; color: #9ca3af;';
      
      // Progress Bar
      const progressOuter = document.createElement('div');
      progressOuter.style.cssText = 'width: 100%; max-width: 280px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; border: 1px solid rgba(0,255,102,0.3); overflow: hidden; margin-top: 4px;';
      
      const progressFill = document.createElement('div');
      progressFill.id = 'dex-progress-fill';
      progressFill.style.cssText = 'height: 100%; background: linear-gradient(90deg, #10b981, #00ff66); width: 0%; transition: width 0.4s ease;';
      progressOuter.appendChild(progressFill);

      const headerRight = document.createElement('div');
      headerRight.style.cssText = 'display: flex; align-items: center; gap: 8px;';

      const randomBtn = document.createElement('button');
      randomBtn.innerHTML = typeof window.t === 'function' ? window.t('dex.btn_random_player', '🎲 CARTA RANDOM') : '🎲 CARTA RANDOM';
      randomBtn.style.cssText = 'padding: 6px 12px; background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.25)); border: 1.5px solid #f59e0b; color: #fbbf24; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 10px rgba(245,158,11,0.25); white-space: nowrap;';
      randomBtn.onmouseenter = () => { randomBtn.style.transform = 'scale(1.05)'; randomBtn.style.boxShadow = '0 0 16px rgba(245,158,11,0.5)'; };
      randomBtn.onmouseleave = () => { randomBtn.style.transform = 'scale(1)'; randomBtn.style.boxShadow = '0 0 10px rgba(245,158,11,0.25)'; };
      randomBtn.onclick = () => this.showRandomCard();

      const closeBtn = document.createElement('button');
      closeBtn.innerText = '✕';
      closeBtn.style.cssText = 'background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer; padding: 0 8px;';
      closeBtn.onclick = () => this.close();

      headerRight.appendChild(randomBtn);
      headerRight.appendChild(closeBtn);

      const headerLeft = document.createElement('div');
      headerLeft.style.display = 'flex';
      headerLeft.style.flexDirection = 'column';
      headerLeft.style.gap = '4px';
      headerLeft.appendChild(title);
      headerLeft.appendChild(counter);
      headerLeft.appendChild(progressOuter);

      header.appendChild(headerLeft);
      header.appendChild(headerRight);
      panel.appendChild(header);

      // Top Category Bar: [ LEYENDAS / JUGADORES ] vs [ OPONENTES (PARTIDA RÁPIDA) ]
      const categoryBar = document.createElement('div');
      categoryBar.style.cssText = 'display: flex; gap: 8px; justify-content: center; padding: 10px 16px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1);';
      
      const btnLeg = document.createElement('button');
      btnLeg.innerText = typeof window.t === 'function' ? window.t('dex.tab_legends') : '⚾ LEYENDAS / BATEADORES';
      const isLegActive = this.activeCategory === 'legends';
      btnLeg.style.cssText = `padding: 6px 14px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 9px; font-weight: bold; cursor: pointer; transition: all 0.2s; border: 1px solid #10b981; ${isLegActive ? 'background: #10b981; color: #000;' : 'background: rgba(16,185,129,0.1); color: #10b981;'}`;

      const btnOpp = document.createElement('button');
      btnOpp.innerText = typeof window.t === 'function' ? window.t('dex.tab_opponents') : '🥊 OPONENTES (PARTIDA RÁPIDA)';
      const isOppActive = this.activeCategory === 'opponents';
      btnOpp.style.cssText = `padding: 6px 14px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 9px; font-weight: bold; cursor: pointer; transition: all 0.2s; border: 1px solid #38bdf8; ${isOppActive ? 'background: #38bdf8; color: #000;' : 'background: rgba(56,189,248,0.1); color: #38bdf8;'}`;

      btnLeg.onclick = () => {
        this.activeCategory = 'legends';
        this.currentFilterPos = 'all';
        this.renderPanel();
      };
      btnOpp.onclick = () => {
        this.activeCategory = 'opponents';
        this.currentFilterPos = 'all';
        this.renderPanel();
      };

      categoryBar.appendChild(btnLeg);
      categoryBar.appendChild(btnOpp);
      panel.appendChild(categoryBar);

      // Search bar
      const searchContainer = document.createElement('div');
      searchContainer.style.cssText = 'padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.value = this.currentSearchTerm;
      searchInput.placeholder = this.activeCategory === 'opponents' ? (typeof window.t === 'function' ? window.t('dex.search_placeholder_pitchers') : 'Buscar lanzador por nombre, equipo, era o rol (SP/RP)...') : (typeof window.t === 'function' ? window.t('dex.search_placeholder') : 'Buscar por nombre, equipo o posición (C, 1B, SS...)...');
      searchInput.style.cssText = 'width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;';
      searchInput.oninput = (e) => {
        this.currentSearchTerm = e.target.value;
        this.applyFilters();
      };
      searchContainer.appendChild(searchInput);

      const challenge162Toggle = document.createElement('label');
      challenge162Toggle.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:8px;font-size:10px;color:#ffd700;cursor:pointer;';
      const challenge162FilterLabel = (typeof window.t === 'function' ? window.t('dex.challenge162_filter') : '🏆 Solo elegibles para el 162-0 Challenge');
      challenge162Toggle.innerHTML = `<input type="checkbox" ${this.challenge162Only ? 'checked' : ''} style="accent-color:#ffd700;cursor:pointer;"> ${challenge162FilterLabel}`;
      challenge162Toggle.querySelector('input').onchange = (e) => {
        this.challenge162Only = e.target.checked;
        this.applyFilters();
      };
      searchContainer.appendChild(challenge162Toggle);
      panel.appendChild(searchContainer);

      // Position / Role Filter Tabs (Dedicated Row)
      const posTabsContainer = document.createElement('div');
      posTabsContainer.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; align-items: center; padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.25);';

      const posLabel = document.createElement('span');
      posLabel.innerText = this.activeCategory === 'opponents' ? (typeof window.t === 'function' ? window.t('dex.role_label') : 'ROL:') : (typeof window.t === 'function' ? window.t('dex.pos_label') : 'POS:');
      posLabel.style.cssText = 'font-family:"Press Start 2P", monospace; font-size: 8px; color: #9ca3af; margin-right: 4px;';
      posTabsContainer.appendChild(posLabel);

      const posTabs = this.activeCategory === 'opponents' ? PITCHER_POS_TABS : BATTER_POS_TABS;
      const accentColor = this.activeCategory === 'opponents' ? '#38bdf8' : '#10b981';

      posTabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.innerText = (tab.key === 'all' && typeof window.t === 'function') ? window.t('dex.pos_all') : tab.label;
        const isActive = this.currentFilterPos === tab.key;
        btn.style.cssText = `
          padding: 3px 8px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 8px; font-weight: bold; white-space: nowrap; border: 1px solid ${accentColor}44; cursor: pointer; transition: all 0.15s;
          ${isActive ? `background: ${accentColor}; color: #000; font-weight: bold;` : `background: rgba(255,255,255,0.05); color: #e4e4e7;`}
        `;
        btn.onclick = () => {
          this.currentFilterPos = tab.key;
          Array.from(posTabsContainer.querySelectorAll('button')).forEach(c => {
            c.style.background = 'rgba(255,255,255,0.05)';
            c.style.color = '#e4e4e7';
          });
          btn.style.background = accentColor;
          btn.style.color = '#000';
          this.applyFilters();
        };
        posTabsContainer.appendChild(btn);
      });
      panel.appendChild(posTabsContainer);

      // Era Tabs (Compact & Responsive Wrap)
      const tabsContainer = document.createElement('div');
      tabsContainer.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.15);';
      
      ERA_TABS.forEach(tab => {
        const btn = document.createElement('button');
        btn.innerText = tab.label;
        const isActive = this.currentFilterEra === tab.key;
        btn.style.cssText = `
          padding: 4px 8px; border-radius: 12px; font-size: 8.5px; font-weight: bold; white-space: nowrap; border: none; cursor: pointer; transition: all 0.2s;
          ${isActive ? 'background: #00ff66; color: #000;' : 'background: rgba(255,255,255,0.1); color: #fff;'}
        `;
        btn.onclick = () => {
          this.currentFilterEra = tab.key;
          Array.from(tabsContainer.children).forEach(c => {
            c.style.background = 'rgba(255,255,255,0.1)';
            c.style.color = '#fff';
          });
          btn.style.background = '#00ff66';
          btn.style.color = '#000';
          this.applyFilters();
        };
        tabsContainer.appendChild(btn);
      });
      panel.appendChild(tabsContainer);

      // Grid
      const grid = document.createElement('div');
      grid.id = 'dex-grid';
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; overflow-y: auto; padding: 16px; flex: 1; align-content: start;';
      panel.appendChild(grid);

      this.container.appendChild(panel);
      document.body.appendChild(this.container);
      
      this.updateCounters();
      this.applyFilters();
    },

    showDetail(p, isPackReveal = false) {
      const existing = document.getElementById('dex-detail-overlay');
      if (existing) existing.remove();
      const existingPack = document.getElementById('dex-pack-overlay');
      if (existingPack) existingPack.remove();

      const rColor = RARITY_COLORS[p.rarity] || RARITY_COLORS.Common;
      const eraTab = ERA_TABS.find(t => t.key === p.era);
      const eraShort = eraTab ? eraTab.label : p.era;
      
      let teamFull = p.team;
      if (typeof window.getFranchiseDisplayName === 'function') {
        teamFull = window.getFranchiseDisplayName(p.team);
      } else if (p.team === 'HIST') {
        teamFull = typeof window.t === 'function' ? window.t('dex.franchise_hist', 'Historical Franchise') : 'Historical Franchise';
      } else if (p.team === 'NLB') {
        teamFull = typeof window.t === 'function' ? window.t('dex.franchise_nlb', 'Negro Leagues') : 'Negro Leagues';
      } else if (window.PlayersDB && window.PlayersDB.FranchiseNames) {
        teamFull = window.PlayersDB.FranchiseNames[p.team] || p.team;
      }

      const overlay = document.createElement('div');
      overlay.id = 'dex-detail-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };

      const renderStat = (lbl, val) => {
        if (typeof val !== 'number') {
          return `
            <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:9px;color:#9ca3af">${lbl}</span>
              <span style="font-size:11px;font-weight:bold;color:#38bdf8">${val}</span>
            </div>
          `;
        }
        return `
          <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:9px;color:#9ca3af">${lbl}</span>
            <span style="font-size:11px;font-weight:bold;color:${getGradeColor(val)}">${val} <small style="font-size:8px">${getGrade(val)}</small></span>
          </div>
        `;
      };

      const careerStats = getPlayerCareerData(p);
      const isPitcher = (this.activeCategory === 'opponents') || p.h9 !== undefined || p.stf !== undefined || p.grt !== undefined || p.pos === 'P' || p.pos === 'SP' || p.pos === 'RP' || p.pos === 'CL';
      const isReliever = isPitcher && (
        p.role === 'RP' || p.role === 'CL' || p.pos === 'RP' || p.pos === 'CL' ||
        (careerStats && typeof careerStats.sv === 'number' && careerStats.sv >= 10)
      );

      let statsHTML = '';
      if (isPitcher) {
        const h9  = p.h9 !== undefined ? p.h9 : (p.grt !== undefined ? p.grt : 50);
        const k9  = p.k9 !== undefined ? p.k9 : (p.stf !== undefined ? p.stf : (p.str !== undefined ? p.str : 50));
        const bb9 = p.bb9 !== undefined ? p.bb9 : (p.ctl !== undefined ? p.ctl : 50);
        const hr9 = p.hr9 !== undefined ? p.hr9 : (p.mov !== undefined ? p.mov : 50);
        const sta = p.sta !== undefined ? p.sta : 65;

        statsHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
            ${renderStat('H/9', h9)}
            ${renderStat('K/9', k9)}
            ${renderStat('BB/9', bb9)}
            ${renderStat('HR/9', hr9)}
            ${renderStat('STA', sta)}
            ${renderStat('ROL', p.role || p.pos || 'P')}
          </div>
        `;
      } else {
        const kavd = p.k_avd !== undefined ? p.k_avd : (p.k_avoid !== undefined ? p.k_avoid : (p.k_avoid_val !== undefined ? p.k_avoid_val : (p.con || 40)));
        statsHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
            ${renderStat('CON', p.con || 40)}
            ${renderStat('PWR', p.pwr || 40)}
            ${renderStat('EYE', p.eye || 40)}
            ${renderStat('K/AVD', kavd)}
            ${renderStat('SPD', p.spd || 40)}
            ${renderStat('DEF', p.def || 40)}
          </div>
        `;
      }

      const isHof = Boolean(p.hof || p.is_hof || (careerStats && careerStats.hof));
      
      let badgesHtml = '';
      if (isHof) badgesHtml += '<span style="background:#ffd70022;color:#ffd700;border:1px solid #ffd700;padding:2px 8px;border-radius:4px;font-size:8px">🏆 HOF</span>';
      if (p.clutch || p.is_clutch) badgesHtml += '<span style="background:#ef444422;color:#ef4444;border:1px solid #ef4444;padding:2px 8px;border-radius:4px;font-size:8px">⚡ CLUTCH</span>';
      if (p.captain || p.is_captain) badgesHtml += '<span style="background:#3b82f622;color:#3b82f6;border:1px solid #3b82f6;padding:2px 8px;border-radius:4px;font-size:8px">👑 CAPTAIN</span>';
      if (window.Challenge162 && window.Challenge162.isUnlocked(p)) {
        const challenge162BadgeLabel = (typeof window.t === 'function' ? window.t('dex.challenge162_badge_label') : '🏆 162-0 CHALLENGE');
        badgesHtml += `<span style="background:#ffd70022;color:#ffd700;border:1px solid #ffd700;padding:2px 8px;border-radius:4px;font-size:8px">${challenge162BadgeLabel}</span>`;
      }

      const cardAnimStyle = isPackReveal ? 'animation: packCardBurst 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;' : '';
      const glowColor = rColor;

      // Generate Draft Card HTML
      let draftCardHTML = '';
      if (typeof window.createCardHTML === 'function') {
        draftCardHTML = window.createCardHTML(p);
      } else {
        draftCardHTML = `<div style="padding:20px;color:#fff;">${p.name} - OVR ${p.ovr}</div>`;
      }

      overlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; max-width: 440px; width: 100%;">
          <div class="dex-flip-card-container" id="dex-card-flip-target" style="${cardAnimStyle}">
            <div class="dex-flip-card-inner" id="dex-card-inner">
              
              <!-- LADO A: ESTADÍSTICAS & FICHA BASEBALL-DEX -->
              <div class="dex-card-face dex-card-front" style="background:#0a0f1a;border:3px solid ${rColor};border-radius:12px;padding:24px;box-shadow: 0 0 35px ${glowColor}66;">
                <div style="position:absolute;top:12px;right:14px;z-index:10;">
                  <button id="btn-modal-close-detail" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer;padding:0 4px;line-height:1;transition:color 0.15s;">✕</button>
                </div>
                
                <div style="margin-bottom:16px;padding-right:30px;">
                  <div style="font-family:'Press Start 2P',monospace;font-size:9.5px;color:${rColor};margin-bottom:4px">${p.rarity || 'Common'} · ${eraShort}</div>
                  <h2 style="font-family:'Press Start 2P',monospace;font-size:13px;color:#fff;margin:0 0 4px 0;line-height:1.4">${p.name}</h2>
                  <div style="font-size:11px;color:#9ca3af">${teamFull} — ${p.year} · ${p.role || getPosText(p)}</div>
                </div>
              
              <div style="text-align:center;margin-bottom:16px">
                <div style="font-family:'Press Start 2P',monospace;font-size:32px;color:${rColor};text-shadow:0 0 20px ${rColor}88">${Math.floor(p.ovr)}</div>
                <div style="font-size:10px;color:#6b7280">OVR</div>
              </div>
              
              ${statsHTML}
              
              ${badgesHtml ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${badgesHtml}</div>` : ''}
              
              <div style="background:#111827;border-radius:8px;padding:12px">
                <div style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#38bdf8;margin-bottom:10px;text-align:center">${(typeof window.t === 'function' ? window.t('dex.career_header') : 'ESTADÍSTICAS DE CARRERA (MLB)')}</div>
                
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px 10px;text-align:center">
                  ${isPitcher ? (isReliever ? `
                    <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${typeof careerStats.sv === 'number' ? careerStats.sv.toLocaleString() : (careerStats.sv || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.sv_label') : 'SALVADOS (SV)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#10b981">${careerStats.era || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.era_label') : 'ERA')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#fb923c">${typeof careerStats.so === 'number' ? careerStats.so.toLocaleString() : (careerStats.so || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.so_label') : 'PONCHES (K)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.whip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.whip_label') : 'WHIP')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#2dd4bf">${careerStats.w !== '-' ? `${careerStats.w}-${careerStats.l}` : (careerStats.ip || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${careerStats.w !== '-' ? (typeof window.t === 'function' ? window.t('dex.wl_label') : 'RÉCORD (W-L)') : (typeof window.t === 'function' ? window.t('dex.ip_label') : 'INNINGS (IP)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.war_label') : 'WAR')}</div></div>
                  ` : `
                    <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${careerStats.w !== '-' ? `${careerStats.w}-${careerStats.l}` : '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.wl_label') : 'RÉCORD (W-L)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#10b981">${careerStats.era || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.era_label') : 'ERA')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#fb923c">${typeof careerStats.so === 'number' ? careerStats.so.toLocaleString() : (careerStats.so || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.so_label') : 'PONCHES (K)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.whip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.whip_label') : 'WHIP')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#2dd4bf">${careerStats.ip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.ip_label') : 'INNINGS (IP)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.war_label') : 'WAR')}</div></div>
                  `) : `
                    <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${typeof careerStats.h === 'number' ? careerStats.h.toLocaleString() : (careerStats.h || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.hits_label') : 'HITS (H)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#f87171">${typeof careerStats.hr === 'number' ? careerStats.hr.toLocaleString() : (careerStats.hr || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.hr_label') : 'JONRONES (HR)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#fbbf24">${typeof careerStats.rbi === 'number' ? careerStats.rbi.toLocaleString() : (careerStats.rbi || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.rbi_label') : 'IMPULSADAS (RBI)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#34d399">${careerStats.avg || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.avg_label') : 'PROMEDIO (AVG)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.ops || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.ops_label') : 'OPS')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.war_label') : 'WAR')}</div></div>
                  `}
                </div>

                ${(() => {
                  const pills = [];
                  if (careerStats.allstars > 0) pills.push(`<span style="background:rgba(255,255,255,0.08);color:#fff;border:1px solid #4b5563;padding:2px 6px;border-radius:4px;font-size:8px">⭐ ${careerStats.allstars}x All-Star</span>`);
                  if (careerStats.mvp > 0) pills.push(`<span style="background:rgba(234,179,8,0.12);color:#eab308;border:1px solid #eab308;padding:2px 6px;border-radius:4px;font-size:8px">🏆 ${careerStats.mvp}x MVP</span>`);
                  if (careerStats.cy > 0) pills.push(`<span style="background:rgba(56,189,248,0.12);color:#38bdf8;border:1px solid #38bdf8;padding:2px 6px;border-radius:4px;font-size:8px">👑 ${careerStats.cy}x Cy Young</span>`);
                  if (careerStats.gg > 0) pills.push(`<span style="background:rgba(255,215,0,0.12);color:#ffd700;border:1px solid #ffd700;padding:2px 6px;border-radius:4px;font-size:8px">🥊 ${careerStats.gg}x GG</span>`);
                  if (careerStats.ss > 0) pills.push(`<span style="background:rgba(56,189,248,0.12);color:#38bdf8;border:1px solid #38bdf8;padding:2px 6px;border-radius:4px;font-size:8px">🥈 ${careerStats.ss}x SS</span>`);
                  if (careerStats.roy > 0) pills.push(`<span style="background:rgba(167,243,208,0.12);color:#a7f3d0;border:1px solid #a7f3d0;padding:2px 6px;border-radius:4px;font-size:8px">🌱 ${careerStats.roy}x ROY</span>`);
                  if (careerStats.rel > 0) pills.push(`<span style="background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid #f59e0b;padding:2px 6px;border-radius:4px;font-size:8px">🔥 ${careerStats.rel}x Relevista</span>`);
                  return pills.length > 0
                    ? `<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:10px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.12)">${pills.join('')}</div>`
                    : '';
                })()}
              </div>
            </div>

            <!-- LADO B: DISEÑO DE CARTA COLECCIONABLE DE DRAFT -->
            <div class="dex-card-face dex-card-back" style="border:3px solid ${rColor};box-shadow: 0 0 35px ${glowColor}66;">
              <div style="position:absolute;top:12px;right:12px;display:flex;align-items:center;gap:8px;z-index:10;">
                <button id="btn-modal-next-back" style="padding:6px 12px;background:linear-gradient(135deg,rgba(245,158,11,0.25),rgba(234,88,12,0.3));border:1.5px solid #f59e0b;color:#fbbf24;border-radius:6px;font-family:'Press Start 2P',monospace;font-size:8px;cursor:pointer;transition:all 0.15s;box-shadow:0 0 10px rgba(245,158,11,0.3);">${typeof window.t === 'function' ? window.t('dex.btn_next_pack', '📦 OTRO') : '📦 OTRO'}</button>
                <button id="btn-modal-close-back" style="background:none;border:none;color:#9ca3af;font-size:22px;cursor:pointer;padding:0 4px;line-height:1;">✕</button>
              </div>

              <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#ffd700;margin-bottom:14px;letter-spacing:1px;text-align:center;">
                🎴 DRAFT TRADING CARD
              </div>

              <div style="transform:scale(1.2);margin:15px 0;">
                ${draftCardHTML}
              </div>

              <div style="font-size:10px;color:#9ca3af;margin-top:16px;text-align:center;font-family:'Press Start 2P',monospace;line-height:1.4;">
                ${p.name} · ${p.year}
              </div>
            </div>

          </div>
        </div>

        <!-- CONTROLES EXTERIORES INFERIORES: FLIP + NEXT PACK + B-REF -->
        <div style="margin-top: 14px; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; z-index: 100;">
          <button id="btn-modal-flip-bottom" style="padding: 6px 14px; background: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.3)); border: 1.5px solid #38bdf8; color: #38bdf8; border-radius: 6px; font-family: 'Press Start 2P', monospace; font-size: 7.5px; cursor: pointer; transition: all 0.15s; box-shadow: 0 0 10px rgba(56,189,248,0.3); display: inline-flex; align-items: center; gap: 5px;">
            🔄 FLIP
          </button>
          <button id="btn-modal-next-bottom" style="padding: 6px 14px; background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.3)); border: 1.5px solid #f59e0b; color: #fbbf24; border-radius: 6px; font-family: 'Press Start 2P', monospace; font-size: 7.5px; cursor: pointer; transition: all 0.15s; box-shadow: 0 0 10px rgba(245,158,11,0.3); display: inline-flex; align-items: center; gap: 5px;">
            📦 ${typeof window.t === 'function' ? window.t('dex.btn_next_pack', 'NEXT PACK') : 'NEXT PACK'}
          </button>
          <a id="btn-modal-bbref-bottom" href="${getBbrefUrl(p)}" target="_blank" rel="noopener noreferrer" style="padding: 6px 14px; background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.3)); border: 1.5px solid #10b981; color: #34d399; border-radius: 6px; font-family: 'Press Start 2P', monospace; font-size: 7.5px; text-decoration: none; cursor: pointer; transition: all 0.15s; box-shadow: 0 0 10px rgba(16,185,129,0.3); display: inline-flex; align-items: center; gap: 5px;">
            📊 ${typeof window.t === 'function' ? window.t('dex.btn_bbref', 'B-REF ↗') : 'B-REF ↗'}
          </a>
        </div>

      </div>
      `;

      document.body.appendChild(overlay);

      const cardInner = overlay.querySelector('#dex-card-inner');
      const toggleFlip = (e) => {
        if (e) e.stopPropagation();
        if (cardInner) {
          cardInner.classList.toggle('flipped');
          this.playCardFlipSound();
        }
      };

      const btnFlipBottom = overlay.querySelector('#btn-modal-flip-bottom');
      if (btnFlipBottom) {
        btnFlipBottom.onclick = toggleFlip;
        btnFlipBottom.onmouseenter = () => {
          btnFlipBottom.style.transform = 'scale(1.05)';
          btnFlipBottom.style.boxShadow = '0 0 25px rgba(56,189,248,0.7)';
        };
        btnFlipBottom.onmouseleave = () => {
          btnFlipBottom.style.transform = 'scale(1)';
          btnFlipBottom.style.boxShadow = '0 0 15px rgba(56,189,248,0.4)';
        };
      }

      const nextBtnBottom = overlay.querySelector('#btn-modal-next-bottom');
      if (nextBtnBottom) {
        nextBtnBottom.onclick = (e) => {
          e.stopPropagation();
          this.showRandomCard();
        };
        nextBtnBottom.onmouseenter = () => {
          nextBtnBottom.style.transform = 'scale(1.04)';
          nextBtnBottom.style.boxShadow = '0 0 18px rgba(245,158,11,0.6)';
        };
        nextBtnBottom.onmouseleave = () => {
          nextBtnBottom.style.transform = 'scale(1)';
          nextBtnBottom.style.boxShadow = '0 0 10px rgba(245,158,11,0.3)';
        };
      }

      const closeBtns = overlay.querySelectorAll('#btn-modal-close-detail, #btn-modal-close-back');
      closeBtns.forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          overlay.remove();
        };
      });
    }
  };
})();
