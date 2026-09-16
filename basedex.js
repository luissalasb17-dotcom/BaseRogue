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

  const SHORTLIST_POS_TABS = [
    { key: 'all', get label() { return (typeof window.t === 'function' ? window.t('dex.pos_all', 'TODOS') : 'TODOS'); } },
    { key: 'C', label: 'C' },
    { key: '1B', label: '1B' },
    { key: '2B', label: '2B' },
    { key: '3B', label: '3B' },
    { key: 'SS', label: 'SS' },
    { key: 'LF', label: 'LF' },
    { key: 'CF', label: 'CF' },
    { key: 'RF', label: 'RF' },
    { key: 'DH', label: 'DH' },
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

  const ISO_COUNTRY_NAMES = {
    'us': 'Estados Unidos',
    'do': 'República Dominicana',
    've': 'Venezuela',
    'pr': 'Puerto Rico',
    'cu': 'Cuba',
    'mx': 'México',
    'jp': 'Japón',
    'ca': 'Canadá',
    'pa': 'Panamá',
    'co': 'Colombia',
    'cw': 'Curazao',
    'ni': 'Nicaragua',
    'kr': 'Corea del Sur',
    'tw': 'Taiwán',
    'bs': 'Bahamas',
    'au': 'Australia',
    'de': 'Alemania',
    'it': 'Italia',
    'gb-eng': 'Inglaterra',
    'gb-sct': 'Escocia',
    'gb-wls': 'Gales',
    'gb-nir': 'Irlanda del Norte',
    'ie': 'Irlanda',
    'nl': 'Países Bajos',
    'aw': 'Aruba',
    'vi': 'Islas Vírgenes (EE.UU.)',
    'jm': 'Jamaica',
    'br': 'Brasil',
    'hn': 'Honduras',
    'es': 'España',
    'fr': 'Francia',
    'cz': 'República Checa',
    'za': 'Sudáfrica',
    'pl': 'Polonia',
    'at': 'Austria',
    'se': 'Suecia',
    'no': 'Noruega',
    'fi': 'Finlandia',
    'dk': 'Dinamarca',
    'be': 'Bélgica',
    'ch': 'Suiza',
    'ph': 'Filipinas',
    'cn': 'China',
    'pe': 'Perú',
    'bz': 'Belice',
    'gu': 'Guam',
    'as': 'Samoa Americana',
    'lt': 'Lituania',
    'lv': 'Letonia',
    'vn': 'Vietnam',
    'pt': 'Portugal',
    'gr': 'Grecia',
    'ru': 'Rusia',
    'af': 'Afganistán'
  };

  function getPlayerFlagHTML(p) {
    const db = window.PLAYER_FLAGS_DB || {};
    let pid = p ? (p.playerID || p.bbref_id || p.id) : null;
    let iso = pid && (db[pid] || db[String(pid).toLowerCase()]);

    if (!iso && p) {
      const rawName = p.cleanName || p.name || '';
      const cleanName = rawName.replace(/\s*\(.*?\)$/, '').trim();
      const normKey = cleanName.toLowerCase().replace(/\b(jr\.?|sr\.?|ii|iii|iv)\b/gi, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      
      iso = db[cleanName] || db[cleanName.toLowerCase()] || db[normKey];

      if (!iso && window.PlayersDB && Array.isArray(window.PlayersDB.LAHMAN_POOL)) {
        const match = window.PlayersDB.LAHMAN_POOL.find(x => x && (x.name === cleanName || x.playerID === pid));
        if (match && match.playerID && db[match.playerID]) iso = db[match.playerID];
      }
      if (!iso && window.PitchersDB && Array.isArray(window.PitchersDB.PITCHERS_POOL)) {
        const match = window.PitchersDB.PITCHERS_POOL.find(x => x && (x.name === cleanName || x.playerID === pid));
        if (match && match.playerID && db[match.playerID]) iso = db[match.playerID];
      }
    }
    const cleanIso = (iso || 'us').toLowerCase();
    const countryName = ISO_COUNTRY_NAMES[cleanIso] || cleanIso.toUpperCase();
    return `<img src="https://flagcdn.com/w20/${cleanIso}.png" srcset="https://flagcdn.com/w40/${cleanIso}.png 2x" style="width:17px;height:12px;border-radius:2px;object-fit:cover;box-shadow:0 0 5px rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.25);display:inline-block;vertical-align:middle;cursor:pointer;" title="${countryName}" alt="${countryName}" loading="lazy">`;
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
    SHORTLIST_STORAGE_KEY: 'baserogue_dex_shortlist_v1',
    unlocked: new Set(),
    unlockedOpponents: new Set(),
    shortlist: new Set(),
    activeCategory: 'legends', // 'legends', 'opponents', or 'shortlist'
    currentFilterEra: 'all',
    currentFilterPos: 'all',
    currentSearchTerm: '',
    challenge162Only: false,
    filteredPlayers: [],
    renderLimit: 200,
    currentRendered: 0,
    getPlayerCareerData,
    getPlayerFlagHTML,
    getBbrefUrl,
    getGrade,
    getGradeColor,
    RARITY_COLORS,
    ERA_TABS,
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
      const storedShortlist = localStorage.getItem(this.SHORTLIST_STORAGE_KEY);
      if (storedShortlist) {
        try {
          const arrShortlist = JSON.parse(storedShortlist);
          this.shortlist = new Set(arrShortlist);
        } catch (e) {
          this.shortlist = new Set();
        }
      }
    },

    save() {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.unlocked)));
      localStorage.setItem(this.OPPONENTS_STORAGE_KEY, JSON.stringify(Array.from(this.unlockedOpponents)));
      localStorage.setItem(this.SHORTLIST_STORAGE_KEY, JSON.stringify(Array.from(this.shortlist)));
      this.updateCounters();
    },

    getShortlistKey(player) {
      if (!player) return null;
      const isPitcher = (player.role === 'SP' || player.role === 'RP' || player.pos === 'P' || player.pos === 'SP' || player.pos === 'RP' || player.pos === 'CL' || player.h9 !== undefined || player.stf !== undefined);
      const keys = isPitcher ? this._getOpponentKeys(player) : this._getPlayerKeys(player);
      return keys[0] || `${player.name || ''}_${player.year || ''}`;
    },

    isShortlisted(player) {
      if (!player) return false;
      const isPitcher = (player.role === 'SP' || player.role === 'RP' || player.pos === 'P' || player.pos === 'SP' || player.pos === 'RP' || player.pos === 'CL' || player.h9 !== undefined || player.stf !== undefined);
      const keys = isPitcher ? this._getOpponentKeys(player) : this._getPlayerKeys(player);
      return keys.some(k => this.shortlist.has(k));
    },

    toggleShortlist(player) {
      if (!player) return false;
      const key = this.getShortlistKey(player);
      if (!key) return false;
      let added = false;
      if (this.isShortlisted(player)) {
        const isPitcher = (player.role === 'SP' || player.role === 'RP' || player.pos === 'P' || player.pos === 'SP' || player.pos === 'RP' || player.pos === 'CL' || player.h9 !== undefined || player.stf !== undefined);
        const keys = isPitcher ? this._getOpponentKeys(player) : this._getPlayerKeys(player);
        keys.forEach(k => this.shortlist.delete(k));
        added = false;
      } else {
        this.shortlist.add(key);
        added = true;
      }
      this.save();
      if (this.container) {
        this.applyFilters();
      }
      return added;
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
      const isPitcher = (player.role === 'SP' || player.role === 'RP' || player.pos === 'P' || player.pos === 'SP' || player.pos === 'RP' || player.pos === 'CL' || player.h9 !== undefined || player.stf !== undefined);
      if (this.activeCategory === 'opponents' || (this.activeCategory === 'shortlist' && isPitcher)) {
        const keys = this._getOpponentKeys(player);
        return keys.some(k => this.unlockedOpponents.has(k));
      }
      const keys = this._getPlayerKeys(player);
      return keys.some(k => this.unlocked.has(k));
    },

    getStats() {
      let pool = [];
      if (this.activeCategory === 'shortlist') {
        const lahmanPool = window.PlayersDB ? (window.PlayersDB.LAHMAN_POOL || []) : [];
        const pitchersPool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : (window.PITCHERS_POOL || []);
        const combined = [...lahmanPool, ...pitchersPool];
        const seenKeys = new Set();
        let validShortlistCount = 0;
        let unlockedCount = 0;
        combined.forEach(p => {
          if (this.isShortlisted(p)) {
            const k = this.getShortlistKey(p);
            if (k && !seenKeys.has(k)) {
              seenKeys.add(k);
              validShortlistCount++;
              if (this.isUnlocked(p)) {
                unlockedCount++;
              }
            }
          }
        });
        return { total: validShortlistCount, unlocked: unlockedCount };
      }
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
        let catLabel = (typeof window.t === 'function' ? window.t('dex.counter_legends', 'Cartas Descubiertas') : 'Cartas Descubiertas');
        if (this.activeCategory === 'opponents') {
          catLabel = (typeof window.t === 'function' ? window.t('dex.counter_opponents', 'Oponentes Enfrentados') : 'Oponentes Enfrentados');
        } else if (this.activeCategory === 'shortlist') {
          catLabel = (typeof window.t === 'function' ? window.t('dex.counter_shortlist', 'Cartas en Shortlist') : 'Cartas en Shortlist');
          elText.innerText = `${stats.total} (${catLabel})`;
          if (elFill) elFill.style.width = '100%';
          return;
        }
        elText.innerText = `${stats.unlocked} / ${stats.total} (${catLabel})`;
      }
      if (elFill) {
        elFill.style.width = `${pct}%`;
      }
    },

    applyFilters() {
      let pool = [];
      if (this.activeCategory === 'shortlist') {
        const lahmanPool = window.PlayersDB ? (window.PlayersDB.LAHMAN_POOL || []) : [];
        const pitchersPool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : (window.PITCHERS_POOL || []);
        const combined = [...lahmanPool, ...pitchersPool];
        const seenKeys = new Set();
        pool = combined.filter(p => {
          if (!this.isShortlisted(p)) return false;
          const k = this.getShortlistKey(p);
          if (k && seenKeys.has(k)) return false;
          if (k) seenKeys.add(k);
          return true;
        });
      } else if (this.activeCategory === 'opponents') {
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

      // Sort: shortlisted / unlocked first, then by OVR desc
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

      if (this.activeCategory === 'shortlist' && this.filteredPlayers.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #9ca3af; font-family: 'Press Start 2P', monospace; font-size: 9px; line-height: 1.8;">
            <div style="font-size: 30px; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.4));">⭐</div>
            <div>${typeof window.t === 'function' ? window.t('dex.shortlist_empty', 'Your shortlist is empty. Click on any card and select ⭐ ADD TO SHORTLIST to bookmark your favorite players!') : 'Your shortlist is empty. Click on any card and select ⭐ ADD TO SHORTLIST to bookmark your favorite players!'}</div>
          </div>
        `;
        return;
      }

      const toRender = this.filteredPlayers.slice(this.currentRendered, this.currentRendered + this.renderLimit);
      
      toRender.forEach(p => {
        const isUnl = this.isUnlocked(p);
        const isFav = this.isShortlisted(p);
        const el = document.createElement('div');
        if (isUnl) {
          const rColor = RARITY_COLORS[p.rarity] || RARITY_COLORS.Common;
          const isChallengeEligible = !!(window.Challenge162 && window.Challenge162.isUnlocked(p));
          el.className = 'dex-card unlocked';
          el.style.cssText = `position: relative; background: #0d1f12; border: 2px solid ${rColor}; border-radius: 8px; padding: 10px 6px; text-align: center; cursor: pointer; transition: transform 0.15s; display: flex; flex-direction: column; justify-content: space-between;`;

          const posLabel = p.role || p.pos || 'P';
          const subLabel = p.team || '';

          const challenge162Tooltip = (typeof window.t === 'function' ? window.t('dex.challenge162_badge_tooltip', 'Eligible for 162-0 Challenge') : 'Eligible for 162-0 Challenge');
          el.innerHTML = `
            ${isFav ? `<span title="Shortlisted" style="position:absolute;top:4px;left:4px;font-size:11px;filter:drop-shadow(0 0 4px rgba(255,215,0,0.9));">⭐</span>` : ''}
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
          el.style.cssText = `position: relative; background: #111827; border: 2px solid #1f2937; border-radius: 8px; padding: 10px 6px; text-align: center; cursor: default`;
          el.innerHTML = `
            ${isFav ? `<span title="Shortlisted" style="position:absolute;top:4px;left:4px;font-size:11px;filter:drop-shadow(0 0 4px rgba(255,215,0,0.9));">⭐</span>` : ''}
            <div style="width:50px;height:50px;background:#1f2937;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center">
              <i class="fa-solid fa-user" style="color:#374151;font-size:20px"></i>
            </div>
            <div style="font-size:7px;color:#4b5563;font-family:'Press Start 2P',monospace">???</div>
            <div style="font-size:6px;color:#374151;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.locked', 'LOCKED') : 'LOCKED')}</div>
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
        btn.innerText = (typeof window.t === 'function' ? window.t('dex.load_more', 'Load more') : 'Load more');
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

      // Top Category Bar: [ LEYENDAS / BATEADORES ] vs [ OPONENTES (PARTIDA RÁPIDA) ] vs [ ⭐ SHORTLIST ]
      const categoryBar = document.createElement('div');
      categoryBar.style.cssText = 'display: flex; gap: 8px; justify-content: center; padding: 10px 16px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1); flex-wrap: wrap;';
      
      const btnLeg = document.createElement('button');
      btnLeg.innerText = typeof window.t === 'function' ? window.t('dex.tab_legends', '⚾ LEGENDS / BATTERS') : '⚾ LEGENDS / BATTERS';
      const isLegActive = this.activeCategory === 'legends';
      btnLeg.style.cssText = `padding: 6px 14px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 8.5px; font-weight: bold; cursor: pointer; transition: all 0.2s; border: 1px solid #10b981; ${isLegActive ? 'background: #10b981; color: #000;' : 'background: rgba(16,185,129,0.1); color: #10b981;'}`;

      const btnOpp = document.createElement('button');
      btnOpp.innerText = typeof window.t === 'function' ? window.t('dex.tab_opponents', '🥊 OPPONENTS (QUICK PLAY)') : '🥊 OPPONENTS (QUICK PLAY)';
      const isOppActive = this.activeCategory === 'opponents';
      btnOpp.style.cssText = `padding: 6px 14px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 8.5px; font-weight: bold; cursor: pointer; transition: all 0.2s; border: 1px solid #38bdf8; ${isOppActive ? 'background: #38bdf8; color: #000;' : 'background: rgba(56,189,248,0.1); color: #38bdf8;'}`;

      const btnShortlist = document.createElement('button');
      btnShortlist.innerText = typeof window.t === 'function' ? window.t('dex.tab_shortlist', '⭐ SHORTLIST / FAVORITES') : '⭐ SHORTLIST / FAVORITES';
      const isShortlistActive = this.activeCategory === 'shortlist';
      btnShortlist.style.cssText = `padding: 6px 14px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 8.5px; font-weight: bold; cursor: pointer; transition: all 0.2s; border: 1px solid #ffd700; ${isShortlistActive ? 'background: #ffd700; color: #000;' : 'background: rgba(255,215,0,0.12); color: #ffd700;'}`;

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
      btnShortlist.onclick = () => {
        this.activeCategory = 'shortlist';
        this.currentFilterPos = 'all';
        this.renderPanel();
      };

      categoryBar.appendChild(btnLeg);
      categoryBar.appendChild(btnOpp);
      categoryBar.appendChild(btnShortlist);
      panel.appendChild(categoryBar);

      // Search bar
      const searchContainer = document.createElement('div');
      searchContainer.style.cssText = 'padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.value = this.currentSearchTerm;
      const placeholderText = this.activeCategory === 'shortlist'
        ? (typeof window.t === 'function' ? window.t('dex.search_placeholder_shortlist', 'Search shortlist by name, team, era or role...') : 'Search shortlist by name, team, era or role...')
        : (this.activeCategory === 'opponents'
          ? (typeof window.t === 'function' ? window.t('dex.search_placeholder_pitchers', 'Search pitcher by name, team, era or role (SP/RP)...') : 'Search pitcher by name, team, era or role (SP/RP)...')
          : (typeof window.t === 'function' ? window.t('dex.search_placeholder', 'Search by name, team or position (C, 1B, SS...)...') : 'Search by name, team or position (C, 1B, SS...)...'));
      searchInput.placeholder = placeholderText;
      searchInput.style.cssText = 'width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;';
      searchInput.oninput = (e) => {
        this.currentSearchTerm = e.target.value;
        this.applyFilters();
      };
      searchContainer.appendChild(searchInput);

      const challenge162Toggle = document.createElement('label');
      challenge162Toggle.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:8px;font-size:10px;color:#ffd700;cursor:pointer;';
      const challenge162FilterLabel = (typeof window.t === 'function' ? window.t('dex.challenge162_filter', '🏆 162-0 Challenge eligible only') : '🏆 162-0 Challenge eligible only');
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
      posLabel.innerText = this.activeCategory === 'opponents' ? (typeof window.t === 'function' ? window.t('dex.role_label', 'ROLE:') : 'ROLE:') : (typeof window.t === 'function' ? window.t('dex.pos_label', 'POS:') : 'POS:');
      posLabel.style.cssText = 'font-family:"Press Start 2P", monospace; font-size: 8px; color: #9ca3af; margin-right: 4px;';
      posTabsContainer.appendChild(posLabel);

      const posTabs = this.activeCategory === 'opponents' ? PITCHER_POS_TABS : (this.activeCategory === 'shortlist' ? SHORTLIST_POS_TABS : BATTER_POS_TABS);
      const accentColor = this.activeCategory === 'opponents' ? '#38bdf8' : (this.activeCategory === 'shortlist' ? '#ffd700' : '#10b981');

      posTabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.innerText = (tab.key === 'all' && typeof window.t === 'function') ? window.t('dex.pos_all', 'ALL') : tab.label;
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
        const clt = p.clt !== undefined ? p.clt : (p.clt_val !== undefined ? p.clt_val : (p.clu !== undefined ? p.clu : (p.clu_val !== undefined ? p.clu_val : 50)));

        statsHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
            ${renderStat('H/9', h9)}
            ${renderStat('K/9', k9)}
            ${renderStat('BB/9', bb9)}
            ${renderStat('HR/9', hr9)}
            ${renderStat('STA', sta)}
            ${renderStat('CLT', clt)}
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
        const challenge162BadgeLabel = (typeof window.t === 'function' ? window.t('dex.challenge162_badge_label', '🏆 162-0 CHALLENGE') : '🏆 162-0 CHALLENGE');
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
                  <h2 style="font-family:'Press Start 2P',monospace;font-size:13px;color:#fff;margin:0 0 4px 0;line-height:1.4;display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
                    <span>${p.name}</span>
                    ${getPlayerFlagHTML(p)}
                  </h2>
                  <div style="font-size:11px;color:#9ca3af">${teamFull} — ${p.year} · ${p.role || getPosText(p)}</div>
                </div>
              
              <div style="text-align:center;margin-bottom:16px">
                <div style="font-family:'Press Start 2P',monospace;font-size:32px;color:${rColor};text-shadow:0 0 20px ${rColor}88">${Math.floor(p.ovr)}</div>
                <div style="font-size:10px;color:#6b7280">OVR</div>
              </div>
              
              ${statsHTML}
              
              ${badgesHtml ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${badgesHtml}</div>` : ''}
              
              <div style="background:#111827;border-radius:8px;padding:12px">
                <div style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#38bdf8;margin-bottom:10px;text-align:center">${(typeof window.t === 'function' ? window.t('dex.career_header', 'CAREER STATS (MLB)') : 'CAREER STATS (MLB)')}</div>
                
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px 10px;text-align:center">
                  ${isPitcher ? (isReliever ? `
                    <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${typeof careerStats.sv === 'number' ? careerStats.sv.toLocaleString() : (careerStats.sv || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.sv_label', 'SAVES (SV)') : 'SAVES (SV)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#10b981">${careerStats.era || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.era_label', 'ERA') : 'ERA')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#fb923c">${typeof careerStats.so === 'number' ? careerStats.so.toLocaleString() : (careerStats.so || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.so_label', 'STRIKEOUTS (K)') : 'STRIKEOUTS (K)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.whip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.whip_label', 'WHIP') : 'WHIP')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#2dd4bf">${careerStats.w !== '-' ? `${careerStats.w}-${careerStats.l}` : (careerStats.ip || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${careerStats.w !== '-' ? (typeof window.t === 'function' ? window.t('dex.wl_label', 'RECORD (W-L)') : 'RECORD (W-L)') : (typeof window.t === 'function' ? window.t('dex.ip_label', 'INNINGS (IP)') : 'INNINGS (IP)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.war_label', 'WAR') : 'WAR')}</div></div>
                  ` : `
                    <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${careerStats.w !== '-' ? `${careerStats.w}-${careerStats.l}` : '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.wl_label', 'RECORD (W-L)') : 'RECORD (W-L)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#10b981">${careerStats.era || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.era_label', 'ERA') : 'ERA')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#fb923c">${typeof careerStats.so === 'number' ? careerStats.so.toLocaleString() : (careerStats.so || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.so_label', 'STRIKEOUTS (K)') : 'STRIKEOUTS (K)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.whip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.whip_label', 'WHIP') : 'WHIP')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#2dd4bf">${careerStats.ip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.ip_label', 'INNINGS (IP)') : 'INNINGS (IP)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.war_label', 'WAR') : 'WAR')}</div></div>
                  `) : `
                    <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${typeof careerStats.h === 'number' ? careerStats.h.toLocaleString() : (careerStats.h || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.hits_label', 'HITS (H)') : 'HITS (H)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#f87171">${typeof careerStats.hr === 'number' ? careerStats.hr.toLocaleString() : (careerStats.hr || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.hr_label', 'HOME RUNS (HR)') : 'HOME RUNS (HR)')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#fbbf24">${typeof careerStats.rbi === 'number' ? careerStats.rbi.toLocaleString() : (careerStats.rbi || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.rbi_label', 'RBI') : 'RBI')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#34d399">${careerStats.avg || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.avg_label', 'AVG') : 'AVG')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.ops || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.ops_label', 'OPS') : 'OPS')}</div></div>
                    <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.war_label', 'WAR') : 'WAR')}</div></div>
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
                  if (careerStats.rel > 0) pills.push(`<span style="background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid #f59e0b;padding:2px 6px;border-radius:4px;font-size:8px">🔥 ${careerStats.rel}x Reliever of the Year</span>`);
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

        <!-- CONTROLES EXTERIORES INFERIORES: SHORTLIST + FLIP + TEST BATTER + NEXT PACK + B-REF -->
        <div style="margin-top: 14px; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; z-index: 100;">
          <button id="btn-modal-shortlist-bottom" style="padding: 6px 14px; background: ${this.isShortlisted(p) ? 'linear-gradient(135deg, rgba(255,215,0,0.35), rgba(245,158,11,0.45))' : 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(245,158,11,0.2))'}; border: 1.5px solid #ffd700; color: #ffd700; border-radius: 6px; font-family: 'Press Start 2P', monospace; font-size: 7.5px; cursor: pointer; transition: all 0.15s; box-shadow: 0 0 10px rgba(255,215,0,0.3); display: inline-flex; align-items: center; gap: 5px;">
            ${this.isShortlisted(p) ? (typeof window.t === 'function' ? window.t('dex.btn_shortlist_remove', '★ SHORTLISTED') : '★ SHORTLISTED') : (typeof window.t === 'function' ? window.t('dex.btn_shortlist_add', '⭐ SHORTLIST') : '⭐ SHORTLIST')}
          </button>
          <button id="btn-modal-flip-bottom" style="padding: 6px 14px; background: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.3)); border: 1.5px solid #38bdf8; color: #38bdf8; border-radius: 6px; font-family: 'Press Start 2P', monospace; font-size: 7.5px; cursor: pointer; transition: all 0.15s; box-shadow: 0 0 10px rgba(56,189,248,0.3); display: inline-flex; align-items: center; gap: 5px;">
            🔄 FLIP
          </button>
          ${!isPitcher ? `
            <button id="btn-modal-test-batter-bottom" style="padding: 6px 14px; background: linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.4)); border: 1.5px solid #ef4444; color: #fca5a5; border-radius: 6px; font-family: 'Press Start 2P', monospace; font-size: 7.5px; cursor: pointer; transition: all 0.15s; box-shadow: 0 0 10px rgba(239,68,68,0.3); display: inline-flex; align-items: center; gap: 5px;">
              ${typeof window.t === 'function' ? window.t('dex.btn_test_batter', '🎯 TEST BATTER') : '🎯 TEST BATTER'}
            </button>
          ` : ''}
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

      const btnShortlistBottom = overlay.querySelector('#btn-modal-shortlist-bottom');
      if (btnShortlistBottom) {
        btnShortlistBottom.onclick = (e) => {
          if (e) e.stopPropagation();
          const isAdded = this.toggleShortlist(p);
          btnShortlistBottom.style.background = isAdded ? 'linear-gradient(135deg, rgba(255,215,0,0.35), rgba(245,158,11,0.45))' : 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(245,158,11,0.2))';
          btnShortlistBottom.innerHTML = isAdded
            ? (typeof window.t === 'function' ? window.t('dex.btn_shortlist_remove', '★ SHORTLISTED') : '★ SHORTLISTED')
            : (typeof window.t === 'function' ? window.t('dex.btn_shortlist_add', '⭐ SHORTLIST') : '⭐ SHORTLIST');
          
          if (typeof window.showToastNotification === 'function') {
            const toastMsg = isAdded
              ? (typeof window.t === 'function' ? window.t('dex.shortlist_added_msg', 'Player added to Shortlist') : 'Player added to Shortlist')
              : (typeof window.t === 'function' ? window.t('dex.shortlist_removed_msg', 'Player removed from Shortlist') : 'Player removed from Shortlist');
            window.showToastNotification(toastMsg);
          }
        };
        btnShortlistBottom.onmouseenter = () => {
          btnShortlistBottom.style.transform = 'scale(1.05)';
          btnShortlistBottom.style.boxShadow = '0 0 20px rgba(255,215,0,0.6)';
        };
        btnShortlistBottom.onmouseleave = () => {
          btnShortlistBottom.style.transform = 'scale(1)';
          btnShortlistBottom.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';
        };
      }

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

      const btnTestBatterBottom = overlay.querySelector('#btn-modal-test-batter-bottom');
      if (btnTestBatterBottom) {
        btnTestBatterBottom.onclick = (e) => {
          e.stopPropagation();
          this.openBatterTestModal(p);
        };
        btnTestBatterBottom.onmouseenter = () => {
          btnTestBatterBottom.style.transform = 'scale(1.05)';
          btnTestBatterBottom.style.boxShadow = '0 0 20px rgba(239,68,68,0.6)';
        };
        btnTestBatterBottom.onmouseleave = () => {
          btnTestBatterBottom.style.transform = 'scale(1)';
          btnTestBatterBottom.style.boxShadow = '0 0 10px rgba(239,68,68,0.3)';
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
    },

    openBatterTestModal(batter) {
      if (!batter) return;
      const existing = document.getElementById('dex-batter-test-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'dex-batter-test-overlay';
      overlay.className = 'dex-test-arena-overlay';
      document.body.appendChild(overlay);

      const _t = (k, fallback, params) => (typeof window.t === 'function' ? window.t(k, params) : fallback);

      // ── PITCHER POOL SELECTION: 3 Pitchers (1 SP, 1 SP/RP, 1 RP) ───────────
      const allPitchers = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : (window.PITCHERS_POOL || []);
      const starters = allPitchers.filter(p => p.role === 'SP' || p.pos === 'SP' || (p.sta !== undefined && p.sta >= 65));
      const relievers = allPitchers.filter(p => p.role === 'RP' || p.role === 'CP' || p.pos === 'RP' || (p.sta !== undefined && p.sta < 65));

      const p1Pool = starters.length ? starters : allPitchers;
      const p1Raw = p1Pool[Math.floor(Math.random() * p1Pool.length)];
      const p1 = { ...p1Raw, hp: 100, maxHp: 100, role: 'SP', isKO: false };

      const p2IsStarter = Math.random() < 0.5;
      const p2Pool = (p2IsStarter ? starters : relievers).length ? (p2IsStarter ? starters : relievers) : allPitchers;
      const p2Raw = p2Pool[Math.floor(Math.random() * p2Pool.length)];
      const p2 = { ...p2Raw, hp: 100, maxHp: 100, role: p2IsStarter ? 'SP' : 'RP', isKO: false };

      const p3Pool = relievers.length ? relievers : allPitchers;
      const p3Raw = p3Pool[Math.floor(Math.random() * p3Pool.length)];
      const p3 = { ...p3Raw, hp: 100, maxHp: 100, role: 'RP', isKO: false };

      const pitchers = [p1, p2, p3];
      const nativePos = batter.primary_pos || batter.pos || 'DH';
      const defPos = nativePos === 'DH' ? 'CF' : nativePos;
      const defStat = batter.def !== undefined ? batter.def : (batter.defense_val !== undefined ? batter.defense_val : 50);
      const initialShield = Math.min(100, Math.max(20, Math.round(defStat)));

      const testState = {
        batter,
        pitchers,
        activePitcherIndex: 0,
        teamHP: 100,
        teamHPMax: 100,
        teamShield: initialShield,
        teamShieldMax: initialShield,
        inning: 1,
        maxInnings: 3,
        outs: 0,
        runs: 0,
        bases: [null, null, null], // 1B, 2B, 3B
        strikeoutChain: 0,
        pitcherDebuff: null, // { turnsLeft, multiplier }
        pitchersKO: 0,
        streak: 0,
        isRolling: false,
        battleOver: false,
        winner: null, // 'player' | 'pitcher' | 'draw'
        history: [],
        seenExtraInnings: false,
        stats: {
          pa: 0,
          ab: 0,
          h: 0,
          singles: 0,
          doubles: 0,
          triples: 0,
          hr: 0,
          rbi: 0,
          r: 0,
          bb: 0,
          so: 0,
          out: 0,
          sb: 0,
          totalDamageDealt: 0
        }
      };

      // ── BASE ADVANCEMENT HELPERS ───────────────────────────────────────────
      const forceWalk = (bases, runner) => {
        let runsScored = 0;
        if (!bases[0]) { bases[0] = runner; return runsScored; }
        if (!bases[1]) { bases[1] = bases[0]; bases[0] = runner; return runsScored; }
        if (!bases[2]) { bases[2] = bases[1]; bases[1] = bases[0]; bases[0] = runner; return runsScored; }
        runsScored++;
        bases[2] = bases[1];
        bases[1] = bases[0];
        bases[0] = runner;
        return runsScored;
      };

      const advanceOnHit = (bases, runner, hitTypeVal, currentOuts) => {
        let runsScored = 0;
        const r1 = bases[0], r2 = bases[1], r3 = bases[2];

        if (hitTypeVal === 3) { // 3B
          if (r3) runsScored++;
          if (r2) runsScored++;
          if (r1) runsScored++;
          bases[0] = null; bases[1] = null; bases[2] = runner;
        } else if (hitTypeVal === 2) { // 2B
          if (r3) runsScored++;
          if (r2) runsScored++;
          if (r1) {
            const r1Spd = r1.spd || 50;
            if (currentOuts === 2 || r1Spd >= 70) {
              runsScored++;
              bases[0] = null;
            } else {
              bases[2] = r1;
              bases[0] = null;
            }
          }
          bases[1] = runner;
          if (!bases[2] && r1 && (currentOuts === 2 || (r1.spd || 50) >= 70)) bases[2] = null;
        } else { // 1B
          if (r3) runsScored++;
          if (r2) {
            const r2Spd = r2.spd || 50;
            if (currentOuts === 2 || r2Spd >= 65) {
              runsScored++;
              bases[1] = null;
            } else {
              bases[2] = r2;
              bases[1] = null;
            }
          } else {
            bases[2] = null;
          }
          if (r1) {
            bases[1] = r1;
          }
          bases[0] = runner;
        }
        return runsScored;
      };

      // ── OUTCOME POPUP (QUICK PLAY REPLICA) ──────────────────────────────────
      const showOutcomePopup = (eventType, details, durationOverride, didSteal, spdUpgraded) => {
        const fightDeck = overlay.querySelector('.rpg-fight-deck');
        if (!fightDeck) return;

        overlay.querySelectorAll('.outcome-popup-overlay').forEach(el => el.remove());

        let title = "";
        let color = "#fff";
        let icon = "fa-star";
        let dmgText = "";
        let borderColor = "#fff";
        let boxShadow = "none";

        switch(eventType) {
          case 'BB':
            title = "WALK (BB)";
            color = "#3b82f6";
            icon = "fa-person-walking";
            dmgText = "🚶 PITCHER TAKES DAMAGE!";
            borderColor = "#3b82f6";
            boxShadow = "0 0 30px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)";
            break;
          case 'SO':
            title = "STRIKEOUT (SO)!";
            color = "#ef4444";
            icon = "fa-circle-xmark";
            dmgText = "💀 DIRECT HP DAMAGE (IGNORES SHIELD)";
            borderColor = "#ef4444";
            boxShadow = "0 0 35px rgba(239, 68, 68, 0.6), 0 0 15px rgba(239, 68, 68, 0.4)";
            break;
          case 'OUT':
            title = "OUT (FLY / GROUND)!";
            color = "#9ca3af";
            icon = "fa-hand";
            dmgText = "✋ SHIELD ABSORBS DAMAGE (-18 HP)";
            borderColor = "#6b7280";
            boxShadow = "0 0 25px rgba(107, 114, 128, 0.4)";
            break;
          case '1B':
            title = "SINGLE (1B)!";
            color = "#a7f3d0";
            icon = "fa-baseball-bat-ball";
            dmgText = "✅ PITCHER TAKES DAMAGE";
            borderColor = "#10b981";
            boxShadow = "0 0 30px rgba(16, 185, 129, 0.5)";
            break;
          case '2B':
            title = "DOUBLE (2B)!";
            color = "#10b981";
            icon = "fa-bolt";
            dmgText = "⚡ PITCHER TAKES HEAVY DAMAGE";
            borderColor = "#10b981";
            boxShadow = "0 0 35px rgba(16, 185, 129, 0.6)";
            break;
          case '3B':
            title = "TRIPLE (3B)!";
            color = "#06b6d4";
            icon = "fa-fire";
            dmgText = "🔥 PITCHER TAKES CRITICAL DAMAGE";
            borderColor = "#06b6d4";
            boxShadow = "0 0 40px rgba(6, 182, 212, 0.7)";
            break;
          case 'HR':
            title = "🚀 HOME RUN! 🚀";
            color = "#ffd700";
            icon = "fa-trophy";
            dmgText = "💥 MASSIVE HIT! PITCHER -75 HP BASE";
            borderColor = "#ffd700";
            boxShadow = "0 0 50px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.5)";
            break;
          case 'KO':
            title = "💥 PITCHER K.O.! 🥊";
            color = "#ffd700";
            icon = "fa-skull-crossbones";
            dmgText = "RIVAL PITCHER HAS BEEN ELIMINATED!";
            borderColor = "#ef4444";
            boxShadow = "0 0 50px rgba(239, 68, 68, 0.8)";
            break;
          default:
            title = eventType;
            dmgText = details || "";
            break;
        }

        const popup = document.createElement('div');
        popup.className = "outcome-popup-overlay";
        popup.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.5);
          z-index: 100;
          background: rgba(8, 12, 20, 0.96);
          border: 3px solid ${borderColor};
          border-radius: 16px;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: ${boxShadow};
          pointer-events: auto;
          cursor: pointer;
          opacity: 0;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-align: center;
          min-width: 260px;
          max-width: 320px;
        `;

        popup.innerHTML = `
          <div style="font-size: 26px; color: ${color}; filter: drop-shadow(0 0 10px ${color}); margin-bottom: 6px;">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div style="font-family: 'Press Start 2P', monospace; font-size: 13px; color: ${color}; letter-spacing: 1px; text-shadow: 0 0 10px ${color}; margin-bottom: 6px;">
            ${title}
          </div>
          <div style="font-size: 11px; color: #cbd5e1; max-width: 260px; line-height: 1.35; margin-bottom: 4px;">
            ${details || dmgText}
          </div>
          ${spdUpgraded ? `
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#38bdf8; background:rgba(56,189,248,0.18); border:1.5px solid #38bdf8; padding:5px 8px; border-radius:6px; margin-top:6px; line-height:1.3; box-shadow:0 0 10px rgba(56,189,248,0.4);">
              ⚡ EXTRA BASE BY SPEED! (SPD ${batter.spd || 50})
            </div>
          ` : ''}
          ${didSteal ? `
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#06b6d4; background:rgba(6,182,212,0.2); border:1.5px solid #06b6d4; padding:5px 8px; border-radius:6px; margin-top:6px; line-height:1.3; box-shadow:0 0 10px rgba(6,182,212,0.4);">
              🏃 STOLEN BASE! (+20% Pitcher Damage Debuff)
            </div>
          ` : ''}
        `;

        fightDeck.style.position = "relative";
        fightDeck.appendChild(popup);

        setTimeout(() => {
          popup.style.transform = "translate(-50%, -50%) scale(1)";
          popup.style.opacity = "1";
        }, 15);

        let isDismissed = false;
        const dismissPopup = () => {
          if (isDismissed) return;
          isDismissed = true;
          popup.style.transform = "translate(-50%, -50%) scale(0.85)";
          popup.style.opacity = "0";
          setTimeout(() => popup.remove(), 150);
        };

        popup.addEventListener('click', dismissPopup);
        const duration = durationOverride || (eventType === 'HR' ? 1200 : 1000);
        setTimeout(dismissPopup, duration);
      };

      // ── PITCHER KO ARCADE JUICE ─────────────────────────────────────────────
      const triggerPitcherKOJuice = (defeatedPitcherName, nextPitcher) => {
        const arena = overlay.querySelector('.dex-test-arena-box') || overlay;
        const fightDeck = overlay.querySelector('.rpg-fight-deck') || arena;

        // Screen flash
        const flash = document.createElement('div');
        flash.className = 'match-screen-flash';
        arena.appendChild(flash);
        setTimeout(() => flash.remove(), 450);

        // Screen shake
        arena.classList.remove('screen-shake-heavy');
        void arena.offsetWidth;
        arena.classList.add('screen-shake-heavy');
        setTimeout(() => arena.classList.remove('screen-shake-heavy'), 600);

        // Sound
        if (window.AudioManager) window.AudioManager.play('pitcher_ko');

        // KO Stamp on Pitcher Card
        const pSlot = overlay.querySelector('#dex-pitcher-card-slot');
        if (pSlot) {
          pSlot.querySelectorAll('.ko-stamp-badge').forEach(s => s.remove());
          const stamp = document.createElement('div');
          stamp.className = 'ko-stamp-badge';
          stamp.innerHTML = `<i class="fa-solid fa-skull-crossbones"></i> K.O.!`;
          pSlot.style.position = 'relative';
          pSlot.appendChild(stamp);
        }

        // Arcade Transition Banner
        const koBanner = document.createElement('div');
        koBanner.className = 'arcade-transition-banner banner-ko';
        koBanner.innerHTML = `
          <div class="arcade-banner-main">🥊💥 PITCHER K.O.!</div>
          <div class="arcade-banner-sub">${defeatedPitcherName} — DEFEATED!</div>
        `;
        fightDeck.appendChild(koBanner);
        setTimeout(() => koBanner.remove(), 1100);
      };

      // ── DEFENSIVE CHALLENGE MODAL (END OF INNING EVENT) ─────────────────────
      const showDefensiveChallenge = (endedInning, onComplete) => {
        const isExtra = (endedInning >= 3);
        const effDef = batter.def !== undefined ? batter.def : (batter.defense_val || 50);
        const baseThreshold = Math.min(100, Math.max(20, Math.round(30 + effDef * 0.6)));

        const defModal = document.createElement('div');
        defModal.className = 'modal-overlay def-modal-backdrop';
        defModal.style.cssText = 'position:fixed; inset:0; z-index:1000005; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); overflow-y:auto;';

        const grade = getGrade(effDef);
        const gradeCol = getGradeColor(grade);

        const POS_COORDS = {
          'C':  { x: 150, y: 156 },
          '1B': { x: 212, y: 114 },
          '2B': { x: 175, y: 78  },
          '3B': { x: 88,  y: 114 },
          'SS': { x: 125, y: 78  },
          'LF': { x: 75,  y: 42  },
          'CF': { x: 150, y: 25  },
          'RF': { x: 225, y: 42  }
        };
        const targetCoord = POS_COORDS[defPos] || POS_COORDS['CF'];

        defModal.innerHTML = `
          <div class="def-modal-box" style="padding:20px 18px; max-width:500px; width:100%; text-align:center; margin:auto; background:#090d16; border:2px solid ${isExtra ? '#ef4444' : '#38bdf8'}; border-radius:14px; box-shadow:0 0 35px rgba(0,0,0,0.9);">
            <div class="def-scanline-bar"></div>

            <div class="def-badge-radar" style="margin-bottom:10px; font-family:'Press Start 2P',monospace; font-size:8px; color:${isExtra ? '#ef4444' : '#38bdf8'};">
              ${isExtra ? `💀 EXTRA INNING ${endedInning} • WALK-OFF DEFENSE! 💀` : `🛡️ BOTTOM OF INNING ${endedInning} • DEFENSIVE CHALLENGE`}
            </div>

            <h3 style="font-family:'Press Start 2P',monospace; font-size:11px; color:#fff; margin:0 0 4px 0; line-height:1.5;">
              RIVAL SHARP DRIVE TO ${defPos}!
            </h3>
            <p style="font-size:10.5px; color:#94a3b8; margin:0 0 10px 0; line-height:1.35;">
              Rival batter strikes a laser into ${defPos} territory. Test your defensive range!
            </p>

            ${isExtra ? `
              <div style="background:linear-gradient(90deg, rgba(239,68,68,0.4), rgba(185,28,28,0.4)); border:2px solid #ef4444; border-radius:8px; padding:8px 12px; margin-bottom:10px; color:#fef08a; font-family:'Press Start 2P',monospace; font-size:7.5px; line-height:1.5;">
                ⚠️ WALK-OFF DANGER: Any defensive error causes an immediate Walk-Off Defeat!
              </div>
            ` : ''}

            <!-- Retro Field Radar -->
            <div class="def-field-radar-card" style="position:relative; margin-bottom:12px;">
              <svg viewBox="0 0 300 175" style="width:100%; height:130px; display:block;">
                <path d="M 15 40 Q 150 8 285 40 L 150 160 Z" fill="#092014" stroke="#10b981" stroke-width="1.5" opacity="0.95" />
                <ellipse cx="150" cy="115" rx="55" ry="38" fill="#361f0d" stroke="#854d0e" stroke-width="1" />
                <polygon points="150,152 202,115 150,78 98,115" fill="#0d2e1c" stroke="#10b981" stroke-width="1" />
                <line id="def-svg-trajectory" x1="150" y1="155" x2="${targetCoord.x}" y2="${targetCoord.y}" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="4,4" />
                <circle id="def-svg-ball" cx="150" cy="155" r="4.5" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" />
                <g transform="translate(${targetCoord.x}, ${targetCoord.y})">
                  <circle r="12" fill="#0f172a" stroke="#fbbf24" stroke-width="2" />
                  <text y="3" text-anchor="middle" font-size="7" font-weight="bold" fill="#fef08a" font-family="'Press Start 2P', monospace">${defPos}</text>
                </g>
              </svg>
              <div style="position:absolute; top:8px; left:10px; font-family:'Press Start 2P',monospace; font-size:7px; background:rgba(0,0,0,0.8); border:1px solid #f43f5e; color:#fecdd3; padding:3px 7px; border-radius:4px;">
                ⚡ SPEED: 104 MPH
              </div>
              <div style="position:absolute; top:8px; right:10px; font-family:'Press Start 2P',monospace; font-size:7px; background:rgba(0,0,0,0.8); border:1px solid #38bdf8; color:#7dd3fc; padding:3px 7px; border-radius:4px;">
                🎯 ZONE: ${defPos}
              </div>
            </div>

            <!-- Fielder Spotlight Card -->
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; display:flex; align-items:center; gap:10px; margin-bottom:10px; text-align:left;">
              <div style="font-size:24px;">🧤</div>
              <div style="flex:1;">
                <div style="font-weight:bold; color:#fff; font-size:12px;">${batter.name} <span style="color:#38bdf8; font-size:9px; font-family:'Press Start 2P',monospace;">[${nativePos}]</span></div>
                <div style="font-size:10px; color:#cbd5e1; margin-top:2px;">
                  DEF: <strong style="color:${gradeCol}; font-size:11px;">${effDef} (Grade ${grade})</strong>
                  <span style="font-size:8px; color:#fef08a; margin-left:4px; font-family:'Press Start 2P',monospace;">⭐ PRIMARY POS</span>
                </div>
              </div>
            </div>

            <!-- Tactics Selector -->
            <div class="def-tactics-selector" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
              <div class="def-tactic-card active" id="btn-tactic-safe" style="cursor:pointer; border:1px solid #10b981; border-radius:8px; padding:8px; background:rgba(16,185,129,0.12); text-align:left;">
                <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#10b981; margin-bottom:3px;">🛡️ REGULAR PLAY</div>
                <div style="font-size:9px; color:#9ca3af;">Safe glove (+20 Shield)</div>
              </div>
              <div class="def-tactic-card" id="btn-tactic-clutch" style="cursor:pointer; border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:8px; background:rgba(0,0,0,0.3); text-align:left;">
                <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#cbd5e1; margin-bottom:3px;">⚡ HIGHLIGHT PLAY</div>
                <div style="font-size:9px; color:#9ca3af;">Diving attempt (-12% Target • +60 Shield)</div>
              </div>
            </div>

            <!-- Tension Gauge -->
            <div style="margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; font-family:'Press Start 2P',monospace; font-size:7.5px; margin-bottom:4px;">
                <span style="color:#34d399;" id="def-catch-label">🟢 CATCH ZONE (1–<span id="def-thresh-val">${baseThreshold}</span>)</span>
                <span style="color:#f43f5e;" id="def-error-label">🔴 ERROR (<span id="def-err-start">${baseThreshold + 1}</span>–100)</span>
              </div>
              <div class="def-gauge-wrapper" style="position:relative; height:12px; background:rgba(0,0,0,0.6); border-radius:6px; overflow:hidden; border:1px solid rgba(255,255,255,0.15);">
                <div id="def-catch-bar" style="height:100%; width:${baseThreshold}%; background:linear-gradient(90deg, #10b981, #34d399); transition:width .2s;"></div>
                <div id="def-needle" style="position:absolute; top:0; bottom:0; width:3px; background:#fff; display:none; transition:left .3s;"></div>
              </div>
            </div>

            <!-- 3D Defense Dice -->
            <div id="def-dice-d100-panel" style="display:flex; flex-direction:column; align-items:center; gap:4px; margin-bottom:12px;">
              <div style="display:flex; gap:10px;">
                <div class="d100-die" id="def-die-tens">
                  <div class="d100-die-cube" id="def-die-tens-cube">
                    <div class="d100-die-face face-front" id="def-die-tens-front">0</div>
                    <div class="d100-die-face face-back">5</div>
                    <div class="d100-die-face face-right">2</div>
                    <div class="d100-die-face face-left">7</div>
                    <div class="d100-die-face face-top">4</div>
                    <div class="d100-die-face face-bottom">9</div>
                  </div>
                </div>
                <div class="d100-die" id="def-die-units">
                  <div class="d100-die-cube" id="def-die-units-cube">
                    <div class="d100-die-face face-front" id="def-die-units-front">0</div>
                    <div class="d100-die-face face-back">5</div>
                    <div class="d100-die-face face-right">2</div>
                    <div class="d100-die-face face-left">0</div>
                    <div class="d100-die-face face-top">0</div>
                    <div class="d100-die-face face-bottom">0</div>
                  </div>
                </div>
              </div>
              <div id="def-dice-readout" style="font-family:'Press Start 2P',monospace; font-size:15px; color:#fff; margin-top:4px;">–</div>
            </div>

            <!-- Roll Button -->
            <div id="def-action-zone">
              <button class="def-roll-btn btn" id="btn-def-roll" style="width:100%; padding:12px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:linear-gradient(135deg, #10b981, #059669); color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">
                🧤 EXECUTE DEFENSIVE PLAY!
              </button>
            </div>

            <!-- Result Zone -->
            <div id="def-result-zone" class="hidden" style="margin-top:12px;"></div>
          </div>
        `;

        document.body.appendChild(defModal);

        if (window.AudioManager) window.AudioManager.play('defense_tension_intro');

        let isClutch = false;
        const updateThreshold = () => {
          const currentThresh = isClutch ? Math.max(10, baseThreshold - 12) : baseThreshold;
          const bar = defModal.querySelector('#def-catch-bar');
          if (bar) bar.style.width = `${currentThresh}%`;
          const threshVal = defModal.querySelector('#def-thresh-val');
          if (threshVal) threshVal.innerText = currentThresh;
          const errStart = defModal.querySelector('#def-err-start');
          if (errStart) errStart.innerText = currentThresh + 1;
        };

        const btnSafe = defModal.querySelector('#btn-tactic-safe');
        const btnClutch = defModal.querySelector('#btn-tactic-clutch');

        if (btnSafe && btnClutch) {
          btnSafe.onclick = () => {
            isClutch = false;
            btnSafe.style.background = 'rgba(16,185,129,0.12)';
            btnSafe.style.borderColor = '#10b981';
            btnSafe.querySelector('div').style.color = '#10b981';

            btnClutch.style.background = 'rgba(0,0,0,0.3)';
            btnClutch.style.borderColor = 'rgba(255,255,255,0.15)';
            btnClutch.querySelector('div').style.color = '#cbd5e1';
            updateThreshold();
          };

          btnClutch.onclick = () => {
            isClutch = true;
            btnClutch.style.background = 'rgba(245,158,11,0.18)';
            btnClutch.style.borderColor = '#f59e0b';
            btnClutch.querySelector('div').style.color = '#f59e0b';

            btnSafe.style.background = 'rgba(0,0,0,0.3)';
            btnSafe.style.borderColor = 'rgba(255,255,255,0.15)';
            btnSafe.querySelector('div').style.color = '#cbd5e1';
            updateThreshold();
          };
        }

        const btnRoll = defModal.querySelector('#btn-def-roll');
        if (btnRoll) {
          btnRoll.onclick = () => {
            btnRoll.disabled = true;
            btnRoll.innerText = '⚾ FIELDING IN PLAY...';

            const cubeUnits = defModal.querySelector('#def-die-units-cube');
            const cubeTens  = defModal.querySelector('#def-die-tens-cube');
            const faceUnits = defModal.querySelector('#def-die-units-front');
            const faceTens  = defModal.querySelector('#def-die-tens-front');
            const readout   = defModal.querySelector('#def-dice-readout');

            const roll = Math.floor(Math.random() * 100) + 1;
            const tensVal = roll === 100 ? 0 : Math.floor(roll / 10);
            const unitsVal = roll === 100 ? 0 : (roll % 10);

            if (cubeUnits) { cubeUnits.classList.remove('tumbling-units', 'die-settled'); void cubeUnits.offsetWidth; cubeUnits.classList.add('tumbling-units'); }
            if (cubeTens)  { cubeTens.classList.remove('tumbling-tens', 'die-settled');   void cubeTens.offsetWidth;  cubeTens.classList.add('tumbling-tens'); }

            if (window.AudioManager) window.AudioManager.play('defense_dice_roll');

            setTimeout(() => {
              if (faceUnits) faceUnits.innerText = unitsVal;
              if (cubeUnits) cubeUnits.classList.add('die-settled');
              if (window.AudioManager) window.AudioManager.play('menu_click');
            }, 550);

            setTimeout(() => {
              if (faceTens) faceTens.innerText = tensVal;
              if (cubeTens) cubeTens.classList.add('die-settled');
              if (readout) readout.innerText = `${roll}`;

              const currentThresh = isClutch ? Math.max(10, baseThreshold - 12) : baseThreshold;
              const isSuccess = (roll <= currentThresh);

              const needle = defModal.querySelector('#def-needle');
              if (needle) {
                needle.style.display = 'block';
                needle.style.left = `${roll}%`;
                needle.style.background = isSuccess ? '#4ade80' : '#f43f5e';
              }

              const resultZone = defModal.querySelector('#def-result-zone');
              const actionZone = defModal.querySelector('#def-action-zone');
              if (actionZone) actionZone.classList.add('hidden');
              if (resultZone) resultZone.classList.remove('hidden');

              if (isSuccess) {
                const shieldGained = isClutch ? 60 : 20;
                const oldShield = testState.teamShield;
                testState.teamShield = Math.min(testState.teamShieldMax, testState.teamShield + shieldGained);
                const actualGained = testState.teamShield - oldShield;
                const excess = shieldGained - actualGained;
                let hpHealed = 0;
                if (excess > 0 && testState.teamHP < 100) {
                  hpHealed = Math.round(Math.min(excess * 0.5, 100 - testState.teamHP));
                  testState.teamHP = Math.min(100, testState.teamHP + hpHealed);
                }

                if (window.AudioManager) window.AudioManager.play('defense_gold_glove');

                resultZone.innerHTML = `
                  <div style="background:rgba(16,185,129,0.15); border:1.5px solid #10b981; border-radius:8px; padding:10px; color:#a7f3d0; font-size:11px; margin-bottom:10px;">
                    <div style="font-family:'Press Start 2P',monospace; font-size:9.5px; color:#10b981; margin-bottom:4px;">🥇 GOLD GLOVE PLAY!</div>
                    <div>Sensational catch by ${batter.name} (Roll: ${roll}/${currentThresh}). +${shieldGained} Shield restored!${hpHealed > 0 ? ` (+${hpHealed} HP healed)` : ''}</div>
                  </div>
                  <button id="btn-def-continue" class="btn" style="width:100%; padding:10px; font-family:'Press Start 2P',monospace; font-size:9px; background:#10b981; color:#000; border:none; border-radius:6px; cursor:pointer;">
                    CONTINUE TO NEXT INNING ➔
                  </button>
                `;
              } else {
                const penalty = isClutch ? 30 : 10;
                if (testState.teamShield > 0) {
                  const sDmg = Math.min(testState.teamShield, penalty);
                  testState.teamShield -= sDmg;
                  const overflow = penalty - sDmg;
                  if (overflow > 0) testState.teamHP = Math.max(0, testState.teamHP - overflow);
                } else {
                  testState.teamHP = Math.max(0, testState.teamHP - penalty);
                }

                if (window.AudioManager) window.AudioManager.play('defense_error');

                if (isExtra) {
                  testState.teamHP = 0;
                  testState.battleOver = true;
                  testState.winner = 'pitcher';

                  resultZone.innerHTML = `
                    <div style="background:rgba(239,68,68,0.2); border:1.5px solid #ef4444; border-radius:8px; padding:10px; color:#fca5a5; font-size:11px; margin-bottom:10px;">
                      <div style="font-family:'Press Start 2P',monospace; font-size:9.5px; color:#ef4444; margin-bottom:4px;">💀 WALK-OFF DEFEAT!</div>
                      <div>Defensive misplay in Extra Inning ${endedInning}. Rival walks off with the victory!</div>
                    </div>
                    <button id="btn-def-continue" class="btn" style="width:100%; padding:10px; font-family:'Press Start 2P',monospace; font-size:9px; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer;">
                      VIEW MATCH RESULTS ➔
                    </button>
                  `;
                } else {
                  resultZone.innerHTML = `
                    <div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; border-radius:8px; padding:10px; color:#fca5a5; font-size:11px; margin-bottom:10px;">
                      <div style="font-family:'Press Start 2P',monospace; font-size:9.5px; color:#ef4444; margin-bottom:4px;">⚠️ DEFENSIVE ERROR!</div>
                      <div>Rival ball slips past (Roll: ${roll}/${currentThresh}). Team suffers -${penalty} Damage!</div>
                    </div>
                    <button id="btn-def-continue" class="btn" style="width:100%; padding:10px; font-family:'Press Start 2P',monospace; font-size:9px; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer;">
                      CONTINUE TO NEXT INNING ➔
                    </button>
                  `;
                }
              }

              const btnCont = resultZone.querySelector('#btn-def-continue');
              if (btnCont) {
                btnCont.onclick = () => {
                  defModal.remove();
                  if (onComplete) onComplete();
                };
              }
            }, 850);
          };
        }
      };

      // ── EXTRA INNINGS SUDDEN DEATH MODAL ────────────────────────────────────
      const showExtraInningsModal = (onClose) => {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; inset:0; z-index:1000010; background:rgba(0,0,0,0.88); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:16px;';
        modal.innerHTML = `
          <div style="background:radial-gradient(circle at center, #1a0505 0%, #090202 100%); border:3px solid #ef4444; box-shadow:0 0 35px rgba(239,68,68,0.6); border-radius:12px; max-width:480px; width:100%; padding:22px; text-align:center; font-family:'Press Start 2P',monospace; color:#fff;">
            <div style="font-size:14px; color:#ef4444; text-shadow:0 0 12px #ef4444; margin-bottom:8px;">
              ⚡ EXTRA INNINGS! ⚡
            </div>
            <div style="font-size:11px; color:#f59e0b; text-shadow:0 0 10px #f59e0b; margin-bottom:18px; letter-spacing:1px;">
              💀 SUDDEN DEATH 💀
            </div>
            <div style="background:rgba(0,0,0,0.6); border:1px dashed rgba(239,68,68,0.5); border-radius:8px; padding:14px 12px; margin-bottom:18px; display:flex; flex-direction:column; gap:10px; font-size:8px; line-height:1.6; text-align:left;">
              <div style="display:flex; align-items:flex-start; gap:8px; color:#fca5a5;">
                <span style="font-size:12px;">🩸</span>
                <div><strong style="color:#ef4444;">DEADLY OUTS:</strong> Regular outs now inflict 30 HP damage.</div>
              </div>
              <div style="display:flex; align-items:flex-start; gap:8px; color:#fde047;">
                <span style="font-size:12px;">💨</span>
                <div><strong style="color:#eab308;">BRUTAL STRIKEOUTS:</strong> Direct HP damage increases to 30 / 38 / 45 HP in streak.</div>
              </div>
              <div style="display:flex; align-items:flex-start; gap:8px; color:#93c5fd;">
                <span style="font-size:12px;">🛡️</span>
                <div><strong style="color:#38bdf8;">WALK-OFF DEFENSE:</strong> Any error during bottom-of-the-inning fielding is an immediate Walk-Off Defeat!</div>
              </div>
            </div>
            <button id="btn-close-extra-modal" class="btn" style="width:100%; padding:12px; background:linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border:2px solid #fecaca; color:#fff; font-family:'Press Start 2P',monospace; font-size:9px; cursor:pointer; border-radius:6px; box-shadow:0 0 15px rgba(239,68,68,0.6);">
              🔥 ENTER COMBAT! 🔥
            </button>
          </div>
        `;

        document.body.appendChild(modal);
        if (window.AudioManager) window.AudioManager.play('danger_stinger');

        const btn = modal.querySelector('#btn-close-extra-modal');
        if (btn) {
          btn.onclick = () => {
            modal.remove();
            if (onClose) onClose();
          };
        }
      };

      // ── BATTLE SUMMARY SCREEN (VICTORY / DEFEAT) ────────────────────────────
      const renderSummary = () => {
        const isVictory = (testState.pitchersKO >= 3);
        const s = testState.stats;
        const avg = s.ab > 0 ? (s.h / s.ab).toFixed(3).replace(/^0/, '') : '.000';
        const tb = s.singles + (s.doubles * 2) + (s.triples * 3) + (s.hr * 4);
        const slg = s.ab > 0 ? (tb / s.ab).toFixed(3).replace(/^0/, '') : '.000';
        const obp = s.pa > 0 ? ((s.h + s.bb) / s.pa).toFixed(3).replace(/^0/, '') : '.000';
        const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3).replace(/^0/, '');

        const summaryModal = document.createElement('div');
        summaryModal.style.cssText = 'position:fixed; inset:0; z-index:1000020; background:rgba(0,0,0,0.92); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:16px;';

        summaryModal.innerHTML = `
          <div style="background:#0a0f18; border:2px solid ${isVictory ? '#ffd700' : '#ef4444'}; border-radius:14px; padding:24px; max-width:560px; width:100%; text-align:center; box-shadow:0 0 45px rgba(${isVictory ? '255,215,0,0.4' : '239,68,68,0.4'});">
            <div style="font-size:36px; margin-bottom:8px;">${isVictory ? '🏆' : '💀'}</div>
            <div style="font-family:'Press Start 2P',monospace; font-size:15px; color:${isVictory ? '#ffd700' : '#ef4444'}; margin-bottom:6px; letter-spacing:1px;">
              ${isVictory ? 'ABSOLUTE VICTORY!' : 'MATCH DEFEAT!'}
            </div>
            <div style="font-size:11px; color:#cbd5e1; margin-bottom:18px;">
              ${isVictory ? 'All 3 rival pitchers eliminated!' : 'Team HP reached 0. Strikeouts took their toll.'}
            </div>

            <!-- Stats Grid -->
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-bottom:18px; text-align:center;">
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 4px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#ffd700;">${s.h}</div>
                <div style="font-size:8px; color:#9ca3af; font-family:'Press Start 2P',monospace; margin-top:2px;">HITS</div>
              </div>
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 4px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#ef4444;">${s.hr}</div>
                <div style="font-size:8px; color:#9ca3af; font-family:'Press Start 2P',monospace; margin-top:2px;">HR</div>
              </div>
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 4px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#38bdf8;">${s.rbi}</div>
                <div style="font-size:8px; color:#9ca3af; font-family:'Press Start 2P',monospace; margin-top:2px;">RBI</div>
              </div>
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 4px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#06b6d4;">${s.sb}</div>
                <div style="font-size:8px; color:#9ca3af; font-family:'Press Start 2P',monospace; margin-top:2px;">SB</div>
              </div>
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 4px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#34d399;">${s.bb}</div>
                <div style="font-size:8px; color:#9ca3af; font-family:'Press Start 2P',monospace; margin-top:2px;">BB</div>
              </div>
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 4px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#f43f5e;">${s.so}</div>
                <div style="font-size:8px; color:#9ca3af; font-family:'Press Start 2P',monospace; margin-top:2px;">SO</div>
              </div>
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 4px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#10b981;">${avg}</div>
                <div style="font-size:8px; color:#9ca3af; font-family:'Press Start 2P',monospace; margin-top:2px;">AVG</div>
              </div>
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 4px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#a855f7;">${ops}</div>
                <div style="font-size:8px; color:#9ca3af; font-family:'Press Start 2P',monospace; margin-top:2px;">OPS</div>
              </div>
            </div>

            <div style="font-size:10px; color:#94a3b8; margin-bottom:18px; font-family:'Press Start 2P',monospace;">
              Pitchers Defeated: <strong style="color:#ffd700;">${testState.pitchersKO} / 3</strong> • Final Inning: <strong style="color:#38bdf8;">${testState.inning}</strong>
            </div>

            <div style="display:flex; gap:10px;">
              <button id="btn-summary-restart" class="btn" style="flex:1; padding:12px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:linear-gradient(135deg, #10b981, #059669); color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">
                ⚾ PLAY AGAIN
              </button>
              <button id="btn-summary-close" class="btn btn-secondary" style="flex:1; padding:12px; font-family:'Press Start 2P',monospace; font-size:9.5px;">
                ✕ RETURN TO DEX
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(summaryModal);

        const btnRestart = summaryModal.querySelector('#btn-summary-restart');
        if (btnRestart) {
          btnRestart.onclick = () => {
            summaryModal.remove();
            overlay.remove();
            BaseballDex.openBatterTestModal(batter);
          };
        }

        const btnClose = summaryModal.querySelector('#btn-summary-close');
        if (btnClose) {
          btnClose.onclick = () => {
            summaryModal.remove();
            overlay.remove();
          };
        }
      };

      // ── SCREEN 2: BATTLE ARENA (QUICK PLAY REPLICA) ─────────────────────────
      const renderArena = () => {
        const batterCardHTML = (typeof window.createCardHTML === 'function')
          ? window.createCardHTML(batter, nativePos)
          : `<div class="player-card"><div class="card-name">${batter.name}</div></div>`;

        overlay.innerHTML = `
          <div class="dex-test-arena-box">
            <!-- Header Bar -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(0,255,102,0.3); padding-bottom:10px;">
              <div style="display:flex; align-items:center; gap:10px; font-family:'Press Start 2P',monospace; font-size:10.5px; color:#00ff66;">
                <span>⚾ TACTICAL BATTLE</span>
                <span style="color:#ffd700;">VS</span>
                <span id="dex-hdr-pitcher-name" style="color:#fff;">RIVAL ROTATION (3 PITCHERS)</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <div id="dex-hdr-atbat-badge" style="background:#000; border:1.5px solid #ffd700; color:#ffd700; font-family:'Press Start 2P',monospace; font-size:8.5px; padding:4px 8px; border-radius:4px; box-shadow:0 0 10px rgba(255,215,0,0.3);">
                  INN 1 • OUT 0
                </div>
                <button id="btn-test-modal-close" style="background:none; border:none; color:#9ca3af; font-size:22px; cursor:pointer; line-height:1;">✕</button>
              </div>
            </div>

            <!-- 2-Column Match Arena -->
            <div class="match-arena">
              
              <!-- Left Column: 1v1 Battle Arena -->
              <div style="display:flex; flex-direction:column; gap:12px; justify-content:center; align-items:center;">
                
                <!-- LED Scoreboard & Diamond -->
                <div class="scoreboard" style="width:100%; text-align:center; font-family:'Press Start 2P',monospace; font-size:10px; padding:10px 14px; line-height:1.6; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:10px;">
                  <div class="scoreboard-text-panel" style="width:100%;">
                    <div style="display:flex; justify-content:space-between; font-size:8.5px; margin-bottom:6px; color:#ffd700;">
                      <div><span>INNING:</span> <span id="dex-scoreboard-inning" style="color:#fff;">1 / 3</span></div>
                      <div><span>RUNS (R):</span> <span id="dex-scoreboard-runs" style="color:#00ff66;">0</span></div>
                    </div>
                    <div style="display:flex; justify-content:space-around; font-size:8px; margin-bottom:6px;">
                      <div><span>HITS:</span> <span id="dex-scoreboard-hits" style="color:#00ff66; font-weight:bold;">0</span></div>
                      <div><span>OUTS:</span> <span id="dex-scoreboard-outs" style="color:#ef4444; font-weight:bold;">○ ○ ○</span></div>
                      <div><span>STOLEN (SB):</span> <span id="dex-scoreboard-sb" style="color:#06b6d4; font-weight:bold;">0</span></div>
                    </div>
                    <div style="display:flex; justify-content:space-around; font-size:8px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px;">
                      <div><span>RIVAL K.O.s:</span> <span id="dex-scoreboard-ko" style="color:#ca8a04;">0 / 3</span></div>
                      <div><span>HIT STREAK:</span> <span id="dex-scoreboard-streak" style="color:#f59e0b;">0</span></div>
                    </div>
                  </div>

                  <!-- Diamond Visual Board -->
                  <div style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px; margin-top:6px; display:flex; justify-content:center; align-items:center;">
                    <svg viewBox="0 0 100 100" style="width:48px; height:48px;">
                      <path d="M 50 15 L 85 50 L 50 85 L 15 50 Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="2,2" />
                      <rect id="dex-base-2" x="44" y="9" width="12" height="12" rx="1" transform="rotate(45 50 15)" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" style="transition:all 0.3s;" />
                      <rect id="dex-base-3" x="9" y="44" width="12" height="12" rx="1" transform="rotate(45 15 50)" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" style="transition:all 0.3s;" />
                      <rect id="dex-base-1" x="79" y="44" width="12" height="12" rx="1" transform="rotate(45 85 50)" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" style="transition:all 0.3s;" />
                      <polygon id="dex-base-home" points="50,79 55,84 55,89 45,89 45,84" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
                    </svg>
                  </div>
                </div>

                <!-- 1v1 Fight Cards View -->
                <div class="rpg-fight-deck" style="display:flex; align-items:center; gap:16px; margin:8px 0; justify-content:center; width:100%; position:relative;">
                  <div class="fight-card-slot">
                    ${batterCardHTML}
                  </div>

                  <div class="vs-circle" style="font-family:'Press Start 2P',monospace; font-size:18px; color:var(--accent-color,#ffd700); text-shadow:0 0 10px rgba(255,215,0,0.8);">VS</div>

                  <div class="fight-card-slot" id="dex-pitcher-card-slot"></div>
                </div>

                <!-- Active Battle HP bars & Vitals Panel -->
                <div class="faceoff-panel" style="width:100%; display:flex; flex-direction:column; gap:8px; padding:10px 14px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:10px;">
                  <div style="display:flex; justify-content:space-between; width:100%; gap:14px;">
                    <div style="flex:1;">
                      <div class="faceoff-name" style="font-size:11px; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#00ff66;">
                        ${batter.name} <span style="font-size:8px; color:#94a3b8;">(${nativePos})</span>
                      </div>
                      
                      <!-- Team HP Bar -->
                      <div style="display:flex; justify-content:space-between; font-size:7.5px; font-family:'Press Start 2P',monospace; margin-top:4px;">
                        <span style="color:#00ff66;">❤️ TEAM HP</span>
                        <span id="dex-team-hp-text" style="color:#00ff66;">100/100</span>
                      </div>
                      <div class="hp-bar-container" style="height:9px; background:rgba(0,0,0,0.6); border-radius:5px; margin-top:2px; overflow:hidden; border:1px solid rgba(255,255,255,0.15);">
                        <div class="hp-bar-fill" id="dex-team-hp-fill" style="width:100%; height:100%; background:linear-gradient(90deg, #10b981, #00ff66); transition:width 0.3s ease;"></div>
                      </div>

                      <!-- Team Shield Bar -->
                      <div style="display:flex; justify-content:space-between; font-size:7.5px; font-family:'Press Start 2P',monospace; margin-top:4px;">
                        <span style="color:#38bdf8;">🛡️ SHIELD (DEF)</span>
                        <span id="dex-team-shield-text" style="color:#38bdf8;">${testState.teamShield}/${testState.teamShieldMax}</span>
                      </div>
                      <div class="hp-bar-container" style="height:7px; background:rgba(0,0,0,0.6); border-radius:4px; margin-top:2px; overflow:hidden; border:1px solid rgba(56,189,248,0.25);">
                        <div class="hp-bar-fill" id="dex-team-shield-fill" style="width:100%; height:100%; background:linear-gradient(90deg, #0284c7, #38bdf8); transition:width 0.3s ease;"></div>
                      </div>
                    </div>

                    <div style="flex:1;">
                      <div class="faceoff-name" id="dex-pitcher-name-disp" style="font-size:11px; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#ef4444; text-align:right;">
                        --
                      </div>
                      
                      <!-- Pitcher HP Bar -->
                      <div style="display:flex; justify-content:space-between; font-size:7.5px; font-family:'Press Start 2P',monospace; margin-top:4px;">
                        <span id="dex-pitcher-hp-text" style="color:#ef4444;">100/100 HP</span>
                        <span style="color:#ef4444;">💀 PITCHER HP</span>
                      </div>
                      <div class="hp-bar-container" style="height:9px; background:rgba(0,0,0,0.6); border-radius:5px; margin-top:2px; overflow:hidden; border:1px solid rgba(239,68,68,0.25);">
                        <div class="hp-bar-fill" id="dex-pitcher-hp-fill" style="width:100%; height:100%; background:linear-gradient(90deg, #dc2626, #ef4444); transition:width 0.3s ease;"></div>
                      </div>

                      <!-- Pitcher Clutch Status badge -->
                      <div id="dex-pitcher-clutch-wrap" style="text-align:right; margin-top:4px; font-size:7.5px; font-family:'Press Start 2P',monospace; min-height:12px;"></div>
                    </div>
                  </div>

                  <!-- Bullpen Rotation Status Row -->
                  <div style="display:flex; align-items:center; justify-content:space-between; border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px; margin-top:2px;">
                    <div style="font-size:7.5px; font-family:'Press Start 2P',monospace; color:#9ca3af;">
                      <i class="fa-solid fa-users"></i> ROTATION QUEUE:
                    </div>
                    <div id="dex-rotation-queue" style="display:flex; gap:6px;"></div>
                  </div>
                </div>

              </div>

              <!-- Right Column: Dice & Controls & Match History -->
              <div style="display:flex; flex-direction:column; gap:12px; justify-content:space-between;">
                
                <!-- Dice Roll Panel & Combat Controls -->
                <div class="dice-box" style="width:100%; display:flex; flex-direction:column; align-items:center; gap:10px; padding:12px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:10px;">
                  
                  <!-- Live Batting Stats Chips -->
                  <div style="display:flex; justify-content:space-between; width:100%; align-items:center; font-family:'Press Start 2P',monospace; font-size:7.5px; border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:6px;">
                    <span id="dex-vitals-avg-badge" style="color:#ffd700; background:rgba(255,215,0,0.1); border:1px solid #ffd700; padding:2px 5px; border-radius:4px;">AVG .000</span>
                    <div style="display:flex; gap:6px; color:#cbd5e1;">
                      <span>H: <strong id="dex-vitals-h" style="color:#00ff66;">0</strong></span>
                      <span>HR: <strong id="dex-vitals-hr" style="color:#f87171;">0</strong></span>
                      <span>BB: <strong id="dex-vitals-bb" style="color:#38bdf8;">0</strong></span>
                      <span>SO: <strong id="dex-vitals-so" style="color:#ef4444;">0</strong></span>
                      <span>SB: <strong id="dex-vitals-sb" style="color:#06b6d4;">0</strong></span>
                    </div>
                  </div>

                  <!-- 3D d100 Dice -->
                  <div id="dice-d100-panel" style="display:flex; flex-direction:column; align-items:center; gap:6px; margin:4px 0;">
                    <div id="dice-d100-container" style="display:flex; gap:12px;">
                      <!-- Tens Die -->
                      <div class="d100-die" id="dex-die-tens">
                        <div class="d100-die-cube" id="dex-die-tens-cube">
                          <div class="d100-die-face face-front" id="dex-die-tens-face-front">0</div>
                          <div class="d100-die-face face-back">0</div>
                          <div class="d100-die-face face-right">0</div>
                          <div class="d100-die-face face-left">0</div>
                          <div class="d100-die-face face-top">0</div>
                          <div class="d100-die-face face-bottom">0</div>
                        </div>
                      </div>
                      <!-- Units Die -->
                      <div class="d100-die" id="dex-die-units">
                        <div class="d100-die-cube" id="dex-die-units-cube">
                          <div class="d100-die-face face-front" id="dex-die-units-face-front">0</div>
                          <div class="d100-die-face face-back">0</div>
                          <div class="d100-die-face face-right">0</div>
                          <div class="d100-die-face face-left">0</div>
                          <div class="d100-die-face face-top">0</div>
                          <div class="d100-die-face face-bottom">0</div>
                        </div>
                      </div>
                    </div>
                    <div id="dex-dice-result-display" style="font-family:'Press Start 2P',monospace; font-size:13px; color:#9ca3af; letter-spacing:1px; min-height:18px;">
                      –
                    </div>
                  </div>

                  <!-- Lucky Zones Panel -->
                  <div id="zones-panel-wrap" style="width:100%;">
                    <details id="zones-panel" open style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:6px 10px;">
                      <summary id="zones-panel-header" style="font-family:'Press Start 2P',monospace; font-size:8px; color:#cbd5e1; cursor:pointer; margin-bottom:6px;">🎯 ${_t('match.luck_zones', 'Luck Zones')}</summary>
                      <div id="dex-zones-lines"></div>
                    </details>
                  </div>

                  <!-- Action Buttons -->
                  <div id="dice-action-bar" style="width:100%; display:flex; flex-direction:column; gap:8px; margin-top:4px;">
                    <button id="btn-dex-roll-dice" style="
                      font-family:'Press Start 2P',monospace;
                      font-size:11px; padding:12px 20px;
                      background:linear-gradient(135deg,#7c3aed,#4f46e5);
                      color:#fff; border:none; border-radius:10px;
                      cursor:pointer; letter-spacing:1px;
                      box-shadow:0 0 18px rgba(124,58,237,0.5);
                      transition:transform .1s,box-shadow .1s;
                      width:100%;
                    "><i class="fa-solid fa-dice"></i> ${_t('match.roll_dice', 'ROLL DICE')}</button>
                    
                    <button id="btn-dex-fast-auto" class="btn" style="
                      font-family:'Press Start 2P',monospace;
                      font-size:9.5px; padding:10px 16px;
                      background:linear-gradient(135deg,#dc2626,#ef4444);
                      color:#fff; border:none; border-radius:10px;
                      cursor:pointer; width:100%;
                      box-shadow:0 0 14px rgba(220,38,38,0.4);
                    "><i class="fa-solid fa-forward-step"></i> ${_t('match.simulate_all', 'FAST AUTO-SIMULATE')}</button>
                  </div>

                </div>

                <!-- Match History Log -->
                <div class="match-log" style="height:140px; max-height:140px; display:flex; flex-direction:column; flex:none; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px 10px; overflow-y:auto;">
                  <div class="match-log-header" style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#9ca3af; margin-bottom:6px; border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:4px;">
                    COMBAT LOG
                  </div>
                  <div id="dex-match-log-lines" style="display:flex; flex-direction:column; gap:4px;">
                    <div class="log-line" style="font-size:8.5px; color:#64748b; font-style:italic;">Ready for the first pitch...</div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        `;

        // Close event
        const closeBtn = overlay.querySelector('#btn-test-modal-close');
        if (closeBtn) closeBtn.onclick = () => overlay.remove();

        // Roll Dice handler
        const rollBtn = overlay.querySelector('#btn-dex-roll-dice');
        if (rollBtn) {
          rollBtn.onclick = () => handleDiceRoll();
        }

        // Fast Auto-play handler
        const autoBtn = overlay.querySelector('#btn-dex-fast-auto');
        if (autoBtn) {
          autoBtn.onclick = () => {
            while (!testState.battleOver && testState.activePitcherIndex < testState.pitchers.length) {
              const curP = testState.pitchers[testState.activePitcherIndex];
              const cBounds = (typeof window.calcBoundaries === 'function')
                ? window.calcBoundaries(batter, curP, { inning: testState.inning, bases: testState.bases, hasTrait: () => false })
                : { bbEnd: 11, soEnd: 26, outEnd: 41, singleEnd: 76, doubleEnd: 86, tripleEnd: 87 };
              
              resolveTurn(cBounds, curP);
            }
            renderSummary();
          };
        }

        // Initialize first pitcher
        updatePitcherCardDOM();
      };

      // ── UPDATE PITCHER AND HUD DOM ──────────────────────────────────────────
      const updatePitcherCardDOM = () => {
        if (testState.battleOver) {
          renderSummary();
          return;
        }

        const curPitcher = testState.pitchers[testState.activePitcherIndex];
        if (!curPitcher) {
          renderSummary();
          return;
        }

        const simCtx = {
          inning: testState.inning,
          bases: testState.bases,
          hasTrait: () => false
        };
        const bounds = (typeof window.calcBoundaries === 'function')
          ? window.calcBoundaries(batter, curPitcher, simCtx)
          : { bbEnd: 11, soEnd: 26, outEnd: 41, singleEnd: 76, doubleEnd: 86, tripleEnd: 87, pitcherClutchStatus: { active: false } };

        const pClutchStatus = bounds.pitcherClutchStatus || { active: false };

        // Header updates
        const hdrPitcherName = overlay.querySelector('#dex-hdr-pitcher-name');
        if (hdrPitcherName) hdrPitcherName.innerText = `${curPitcher.name.toUpperCase()} & ROTATION`;

        const hdrBadge = overlay.querySelector('#dex-hdr-atbat-badge');
        if (hdrBadge) {
          hdrBadge.innerText = `INN ${testState.inning} • OUT ${testState.outs}`;
          hdrBadge.style.borderColor = testState.inning >= 4 ? '#ef4444' : '#ffd700';
          hdrBadge.style.color = testState.inning >= 4 ? '#ef4444' : '#ffd700';
        }

        // Pitcher Card DOM
        const pitcherSlot = overlay.querySelector('#dex-pitcher-card-slot');
        if (pitcherSlot) {
          pitcherSlot.innerHTML = (typeof window.createCardHTML === 'function')
            ? window.createCardHTML(curPitcher, curPitcher.role || 'SP')
            : `<div class="player-card"><div class="card-name">${curPitcher.name}</div></div>`;
        }

        // Pitcher Faceoff Name & HP
        const pNameDisp = overlay.querySelector('#dex-pitcher-name-disp');
        if (pNameDisp) pNameDisp.innerText = `${curPitcher.name} (${curPitcher.role || 'SP'})`;

        const pHPFill = overlay.querySelector('#dex-pitcher-hp-fill');
        if (pHPFill) pHPFill.style.width = `${Math.max(0, curPitcher.hp)}%`;

        const pHPText = overlay.querySelector('#dex-pitcher-hp-text');
        if (pHPText) pHPText.innerText = `${Math.max(0, curPitcher.hp)}/100 HP`;

        const clutchWrap = overlay.querySelector('#dex-pitcher-clutch-wrap');
        if (clutchWrap) {
          if (pClutchStatus.active) {
            clutchWrap.innerHTML = `<span style="color:#ef4444; background:rgba(239,68,68,0.15); border:1px solid #ef4444; padding:2px 4px; border-radius:3px;">🔥 RISP CLUTCH (${pClutchStatus.val >= 0 ? '+' : ''}${pClutchStatus.val})</span>`;
          } else if (testState.pitcherDebuff && testState.pitcherDebuff.turnsLeft > 0) {
            clutchWrap.innerHTML = `<span style="color:#06b6d4; background:rgba(6,182,212,0.15); border:1px solid #06b6d4; padding:2px 4px; border-radius:3px;">⚡ STOLEN BASE DEBUFF (+20% DMG)</span>`;
          } else {
            clutchWrap.innerHTML = `<span style="color:#64748b;">STANDARD FOCUS</span>`;
          }
        }

        // Rotation Queue Badges with accurate OVR
        const rotQueue = overlay.querySelector('#dex-rotation-queue');
        if (rotQueue) {
          rotQueue.innerHTML = testState.pitchers.map((p, idx) => {
            const isCurrent = (idx === testState.activePitcherIndex);
            const isDefeated = p.hp <= 0;
            const bg = isCurrent ? '#ffd700' : (isDefeated ? '#374151' : 'rgba(255,255,255,0.08)');
            const textCol = isCurrent ? '#000' : (isDefeated ? '#9ca3af' : '#fff');
            const borderCol = isCurrent ? '#ffd700' : (isDefeated ? '#4b5563' : 'rgba(255,255,255,0.2)');
            const statusLabel = isDefeated ? 'KO' : (isCurrent ? `${p.hp} HP` : 'READY');
            const pOvr = typeof window.getPlayerOvr === 'function' ? window.getPlayerOvr(p) : (p.ovr || 70);
            return `
              <div style="background:${bg}; color:${textCol}; border:1px solid ${borderCol}; font-family:'Press Start 2P',monospace; font-size:7px; padding:2px 5px; border-radius:4px; display:flex; align-items:center; gap:4px;">
                <span>${p.role || (idx === 0 ? 'SP' : 'RP')}</span>
                <span>${pOvr}</span>
                <span style="font-size:6px; opacity:0.85;">(${statusLabel})</span>
              </div>
            `;
          }).join('');
        }

        // Team HP & Shield
        const tHPFill = overlay.querySelector('#dex-team-hp-fill');
        if (tHPFill) tHPFill.style.width = `${Math.max(0, testState.teamHP)}%`;
        const tHPText = overlay.querySelector('#dex-team-hp-text');
        if (tHPText) tHPText.innerText = `${Math.max(0, testState.teamHP)}/100`;

        const tShieldFill = overlay.querySelector('#dex-team-shield-fill');
        if (tShieldFill) tShieldFill.style.width = testState.teamShieldMax > 0 ? `${(testState.teamShield / testState.teamShieldMax) * 100}%` : '0%';
        const tShieldText = overlay.querySelector('#dex-team-shield-text');
        if (tShieldText) tShieldText.innerText = `${testState.teamShield}/${testState.teamShieldMax}`;

        // Scoreboard updates
        const innDisp = overlay.querySelector('#dex-scoreboard-inning');
        if (innDisp) innDisp.innerText = `${testState.inning} / 3${testState.inning >= 4 ? ' (EXTRA)' : ''}`;

        const runsDisp = overlay.querySelector('#dex-scoreboard-runs');
        if (runsDisp) runsDisp.innerText = `${testState.runs}`;

        const hitsDisp = overlay.querySelector('#dex-scoreboard-hits');
        if (hitsDisp) hitsDisp.innerText = `${testState.stats.h}`;

        const outsDisp = overlay.querySelector('#dex-scoreboard-outs');
        if (outsDisp) {
          const outDots = testState.outs === 0 ? '○ ○ ○' : (testState.outs === 1 ? '● ○ ○' : (testState.outs === 2 ? '● ● ○' : '● ● ●'));
          outsDisp.innerText = outDots;
        }

        const sbDisp = overlay.querySelector('#dex-scoreboard-sb');
        if (sbDisp) sbDisp.innerText = `${testState.stats.sb}`;

        const koDisp = overlay.querySelector('#dex-scoreboard-ko');
        if (koDisp) koDisp.innerText = `${testState.pitchersKO} / 3`;

        const streakDisp = overlay.querySelector('#dex-scoreboard-streak');
        if (streakDisp) streakDisp.innerText = `${testState.streak}`;

        // Vitals updates
        const avgDisp = overlay.querySelector('#dex-vitals-avg-badge');
        if (avgDisp) avgDisp.innerText = `AVG ${testState.stats.ab > 0 ? (testState.stats.h / testState.stats.ab).toFixed(3).replace(/^0/, '') : '.000'}`;

        const vH = overlay.querySelector('#dex-vitals-h');
        if (vH) vH.innerText = `${testState.stats.h}`;
        const vHR = overlay.querySelector('#dex-vitals-hr');
        if (vHR) vHR.innerText = `${testState.stats.hr}`;
        const vBB = overlay.querySelector('#dex-vitals-bb');
        if (vBB) vBB.innerText = `${testState.stats.bb}`;
        const vSO = overlay.querySelector('#dex-vitals-so');
        if (vSO) vSO.innerText = `${testState.stats.so}`;
        const vSB = overlay.querySelector('#dex-vitals-sb');
        if (vSB) vSB.innerText = `${testState.stats.sb}`;

        // Luck Zones updates
        const zonesLines = overlay.querySelector('#dex-zones-lines');
        if (zonesLines) {
          zonesLines.innerHTML = `
            <div class="outcome-probabilities-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:8px;">
              <div style="display:flex; flex-direction:column; gap:3px;">
                <div class="outcome-row" style="display:flex; justify-content:space-between;">
                  <span style="color:#3b82f6;">⚾ ${_t('match.bb', 'Walk (BB)')}</span>
                  <span style="color:#3b82f6; font-weight:bold;">1–${bounds.bbEnd}</span>
                </div>
                <div class="outcome-row" style="display:flex; justify-content:space-between;">
                  <span style="color:#ef4444;">💨 ${_t('match.so', 'Strikeout (SO)')}</span>
                  <span style="color:#ef4444; font-weight:bold;">${bounds.bbEnd + 1}–${bounds.soEnd}</span>
                </div>
                <div class="outcome-row" style="display:flex; justify-content:space-between;">
                  <span style="color:#9ca3af;">🤚 ${_t('match.out', 'Out (Fly/GO)')}</span>
                  <span style="color:#9ca3af; font-weight:bold;">${bounds.soEnd + 1}–${bounds.outEnd}</span>
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:3px;">
                <div class="outcome-row" style="display:flex; justify-content:space-between;">
                  <span style="color:#a7f3d0;">✅ ${_t('match.single', 'Single (1B)')}</span>
                  <span style="color:#a7f3d0; font-weight:bold;">${bounds.outEnd + 1}–${bounds.singleEnd}</span>
                </div>
                <div class="outcome-row" style="display:flex; justify-content:space-between;">
                  <span style="color:#10b981;">⚡ ${_t('match.double', 'Double (2B)')}</span>
                  <span style="color:#10b981; font-weight:bold;">${bounds.singleEnd + 1}–${bounds.doubleEnd}</span>
                </div>
                <div class="outcome-row" style="display:flex; justify-content:space-between;">
                  <span style="color:#06b6d4;">🔥 ${_t('match.triple', 'Triple (3B)')}</span>
                  <span style="color:#06b6d4; font-weight:bold;">${bounds.doubleEnd + 1}–${bounds.tripleEnd}</span>
                </div>
                <div class="outcome-row" style="display:flex; justify-content:space-between;">
                  <span style="color:#eab308; font-weight:bold;">🚀 ${_t('match.hr', 'Home Run (HR)')}</span>
                  <span style="color:#eab308; font-weight:bold;">${bounds.tripleEnd + 1}–100</span>
                </div>
              </div>
            </div>
          `;
        }

        // Diamond base glows
        const b1 = overlay.querySelector('#dex-base-1');
        const b2 = overlay.querySelector('#dex-base-2');
        const b3 = overlay.querySelector('#dex-base-3');
        const bHome = overlay.querySelector('#dex-base-home');

        if (b1) {
          b1.setAttribute('fill', testState.bases[0] ? '#00ff66' : 'rgba(255,255,255,0.1)');
          b1.setAttribute('stroke', testState.bases[0] ? '#00ff66' : 'rgba(255,255,255,0.3)');
        }
        if (b2) {
          b2.setAttribute('fill', testState.bases[1] ? '#00ff66' : 'rgba(255,255,255,0.1)');
          b2.setAttribute('stroke', testState.bases[1] ? '#00ff66' : 'rgba(255,255,255,0.3)');
        }
        if (b3) {
          b3.setAttribute('fill', testState.bases[2] ? '#00ff66' : 'rgba(255,255,255,0.1)');
          b3.setAttribute('stroke', testState.bases[2] ? '#00ff66' : 'rgba(255,255,255,0.3)');
        }
        if (bHome) {
          bHome.setAttribute('fill', 'rgba(255,255,255,0.25)');
        }
      };

      // ── SCREEN 1: PRE-FIGHT SHOWDOWN (QUICK PLAY MATCHUP PREVIEW) ───────────
      let previewPitcherIdx = 0;

      const renderPreFight = () => {
        const previewPitcher = pitchers[previewPitcherIdx];
        const bCon = batter.con || 50;
        const bPwr = batter.pwr || 50;
        const bEye = batter.eye || 50;
        const bKAvd = batter.k_avd !== undefined ? batter.k_avd : (batter.k_avoid !== undefined ? batter.k_avoid : 50);
        const bSpd = batter.spd || 50;

        const pH9 = previewPitcher.h9 !== undefined ? previewPitcher.h9 : 50;
        const pHr9 = previewPitcher.hr9 !== undefined ? previewPitcher.hr9 : 50;
        const pBb9 = previewPitcher.bb9 !== undefined ? previewPitcher.bb9 : 50;
        const pK9 = previewPitcher.k9 !== undefined ? previewPitcher.k9 : 50;
        const pSta = previewPitcher.sta !== undefined ? previewPitcher.sta : 65;

        const diffCon = bCon - pH9;
        const diffPwr = bPwr - pHr9;
        const diffEye = bEye - pBb9;
        const diffK   = bKAvd - pK9;
        const diffSpd = bSpd - pSta;

        const formatDiff = (diff) => {
          if (diff > 0) return `<span class="clash-diff-pill diff-positive">+${diff}</span>`;
          if (diff < 0) return `<span class="clash-diff-pill diff-negative">${diff}</span>`;
          return `<span class="clash-diff-pill diff-neutral">0</span>`;
        };

        const netAdvantage = diffCon + diffK + (diffPwr * 0.8) + (diffEye * 0.6);
        let overallText = '🟡 BALANCED DUEL';
        let overallClass = 'edge-even';
        let tipText = '⚖️ Close duel: Dice rolls and situational timing will decide the at-bat.';

        if (netAdvantage >= 16) {
          overallText = '🟢 ADVANTAGE: HITTER';
          overallClass = 'edge-hitter';
          tipText = '💡 Green light: Your batter has tactical leverage to punish rival pitching.';
        } else if (netAdvantage <= -16) {
          overallText = '🔴 ADVANTAGE: PITCHER';
          overallClass = 'edge-pitcher';
          tipText = '⚠️ Danger: Pitcher commands the strike zone. High strikeout and weak contact risk.';
        }

        const batterCardHTML = (typeof window.createCardHTML === 'function')
          ? window.createCardHTML(batter, nativePos)
          : `<div class="player-card"><div class="card-name">${batter.name}</div></div>`;

        const pitcherCardHTML = (typeof window.createCardHTML === 'function')
          ? window.createCardHTML(previewPitcher, previewPitcher.role || 'SP')
          : `<div class="player-card"><div class="card-name">${previewPitcher.name}</div></div>`;

        // Pitcher bullpen rows with accurate OVR
        const bullpenRows = pitchers.map((p, idx) => {
          const isSelected = (idx === previewPitcherIdx);
          const pOvr = typeof window.getPlayerOvr === 'function' ? window.getPlayerOvr(p) : (p.ovr || 70);
          const grade = getGrade(pOvr);
          const gradeCol = getGradeColor(grade);
          return `
            <div class="pre-fight-row ${isSelected ? 'selected-pitcher-row' : ''}" data-p-idx="${idx}" style="cursor:pointer;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:9px; font-weight:bold; color:#ef4444; background:rgba(239,68,68,0.15); padding:2px 5px; border-radius:4px; border:1px solid rgba(239,68,68,0.3);">${p.role || (idx === 0 ? 'SP' : 'RP')}</span>
                <span class="name" style="color:#fff; font-size:9px;">${p.name}</span>
                <span style="font-size:8px; font-weight:bold; color:${gradeCol}; background:rgba(0,0,0,0.4); border:1px solid ${gradeCol}; padding:1px 4px; border-radius:4px; font-family:'Press Start 2P',monospace;">${pOvr} ${grade}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <div class="hp-bar-container">
                  <div class="hp-bar-fill" style="width:100%; background:linear-gradient(90deg, #ef4444, #f87171);"></div>
                </div>
                <span class="hp-text">100/100 HP</span>
              </div>
            </div>
          `;
        }).join('');

        overlay.innerHTML = `
          <div class="glass-panel" id="screen-pre-fight" style="position: relative; max-width: 960px; width: 95%; margin: 20px auto; padding: 22px 20px; box-shadow: 0 0 45px rgba(0,0,0,0.9), 0 0 20px rgba(0,255,102,0.25);">
            
            <!-- Top Showdown Header -->
            <div class="pre-fight-header">
              <div class="pre-fight-stage-badge">⚔️ SERIES SHOWDOWN • BATTING PRACTICE</div>
              <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:#fff; margin:8px 0 12px 0; text-align:center; letter-spacing:0.5px;">
                ${batter.name} <span style="color:#ffd700;">VS</span> 3 RIVAL PITCHERS
              </div>
            </div>

            <!-- Main Faceoff Arena -->
            <div class="pre-fight-showdown">
              
              <!-- Left: Your Batter Selector & Card -->
              <div class="showdown-side showdown-side-player">
                <div class="showdown-nav-bar">
                  <span class="showdown-nav-label">${nativePos} ${batter.name}</span>
                </div>
                <div class="showdown-card-slot">
                  ${batterCardHTML}
                </div>
              </div>

              <!-- Center: The VS Clash, Matchup Insights & Battle Button -->
              <div class="showdown-center">
                <div class="showdown-vs-badge">VS</div>
                <div class="showdown-stakes-pill">3 INNINGS • DUEL</div>

                <!-- Dynamic Matchup Advantage Tactical Insights -->
                <div class="showdown-insights-panel">
                  <div class="matchup-overall-badge ${overallClass}">${overallText}</div>
                  
                  <div class="matchup-clash-matrix">
                    <!-- Contact vs H/9 -->
                    <div class="clash-row" title="Batter Contact vs Pitcher H/9">
                      <div class="clash-col-batter">
                        <span>CON</span>
                        <span class="clash-val-b">${bCon}</span>
                      </div>
                      ${formatDiff(diffCon)}
                      <div class="clash-col-pitcher">
                        <span class="clash-val-p">${pH9}</span>
                        <span>H/9</span>
                      </div>
                    </div>

                    <!-- Power vs HR/9 -->
                    <div class="clash-row" title="Batter Power vs Pitcher HR/9">
                      <div class="clash-col-batter">
                        <span>PWR</span>
                        <span class="clash-val-b">${bPwr}</span>
                      </div>
                      ${formatDiff(diffPwr)}
                      <div class="clash-col-pitcher">
                        <span class="clash-val-p">${pHr9}</span>
                        <span>HR/9</span>
                      </div>
                    </div>

                    <!-- Eye vs BB/9 -->
                    <div class="clash-row" title="Batter Eye vs Pitcher BB/9">
                      <div class="clash-col-batter">
                        <span>EYE</span>
                        <span class="clash-val-b">${bEye}</span>
                      </div>
                      ${formatDiff(diffEye)}
                      <div class="clash-col-pitcher">
                        <span class="clash-val-p">${pBb9}</span>
                        <span>BB/9</span>
                      </div>
                    </div>

                    <!-- K-Avoid vs K/9 -->
                    <div class="clash-row" title="Batter K-Avoid vs Pitcher K/9">
                      <div class="clash-col-batter">
                        <span>K-AVD</span>
                        <span class="clash-val-b">${bKAvd}</span>
                      </div>
                      ${formatDiff(diffK)}
                      <div class="clash-col-pitcher">
                        <span class="clash-val-p">${pK9}</span>
                        <span>K/9</span>
                      </div>
                    </div>

                    <!-- Speed vs STA -->
                    <div class="clash-row" title="Batter Speed vs Pitcher Stamina">
                      <div class="clash-col-batter">
                        <span>SPD</span>
                        <span class="clash-val-b">${bSpd}</span>
                      </div>
                      ${formatDiff(diffSpd)}
                      <div class="clash-col-pitcher">
                        <span class="clash-val-p">${pSta}</span>
                        <span>STA</span>
                      </div>
                    </div>
                  </div>

                  <div class="matchup-quick-tip">${tipText}</div>
                </div>

                <button class="btn btn-pre-fight-battle" id="btn-test-start-combat">
                  <i class="fa-solid fa-fire-flame-curved"></i> TO COMBAT!
                </button>
                <button class="btn btn-secondary btn-pre-fight-back" id="btn-test-close-prefight">
                  ✕ Return to Dex
                </button>
              </div>

              <!-- Right: Rival Pitcher Selector & Card -->
              <div class="showdown-side showdown-side-enemy">
                <div class="showdown-nav-bar nav-enemy">
                  <button class="btn btn-showdown-nav" id="btn-test-prev-p">◀</button>
                  <span class="showdown-nav-label" id="showdown-pitcher-label">${previewPitcher.role || 'SP'} ${previewPitcher.name}</span>
                  <button class="btn btn-showdown-nav" id="btn-test-next-p">▶</button>
                </div>
                <div class="showdown-card-slot" id="showdown-pitcher-card-wrap">
                  ${pitcherCardHTML}
                </div>
              </div>

            </div>

            <!-- Bullpen Relievers Section (Below Showdown) -->
            <div class="pre-fight-bullpen-section">
              <div class="pre-fight-bullpen-title">
                <i class="fa-solid fa-users"></i> RIVAL ROTATION & BULLPEN
              </div>
              <div class="pre-fight-bullpen-list">
                ${bullpenRows}
              </div>
            </div>

          </div>
        `;

        // Bind events
        const btnCombat = overlay.querySelector('#btn-test-start-combat');
        if (btnCombat) {
          btnCombat.onclick = () => {
            if (window.AudioManager) window.AudioManager.play('play_ball');
            renderArena();
          };
        }

        const btnClose = overlay.querySelector('#btn-test-close-prefight');
        if (btnClose) {
          btnClose.onclick = () => overlay.remove();
        }

        const btnPrevP = overlay.querySelector('#btn-test-prev-p');
        if (btnPrevP) {
          btnPrevP.onclick = () => {
            previewPitcherIdx = (previewPitcherIdx - 1 + pitchers.length) % pitchers.length;
            renderPreFight();
          };
        }

        const btnNextP = overlay.querySelector('#btn-test-next-p');
        if (btnNextP) {
          btnNextP.onclick = () => {
            previewPitcherIdx = (previewPitcherIdx + 1) % pitchers.length;
            renderPreFight();
          };
        }

        overlay.querySelectorAll('.pre-fight-row').forEach(row => {
          row.onclick = () => {
            const idx = parseInt(row.dataset.pIdx);
            if (!isNaN(idx)) {
              previewPitcherIdx = idx;
              renderPreFight();
            }
          };
        });
      };

      // Start by displaying the Pre-Fight Matchup Preview!
      renderPreFight();
    }

  };

    window.getPlayerCareerData = getPlayerCareerData;
  window.getPlayerFlagHTML = getPlayerFlagHTML;
  window.getBbrefUrl = getBbrefUrl;
  window.getPosText = getPosText;
  window.getGrade = getGrade;
  window.getGradeColor = getGradeColor;
})();
