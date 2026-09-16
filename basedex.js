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

      let availablePitchers = (window.PITCHERS_POOL && window.PITCHERS_POOL.length > 0)
        ? window.PITCHERS_POOL
        : ((window.PlayersDB && window.PlayersDB.Pitchers) ? window.PlayersDB.Pitchers : []);
      if (!availablePitchers.length) {
        alert('Pitchers pool not available.');
        return;
      }

      // Draw 10 Random Pitchers
      const shuffled = [...availablePitchers].sort(() => Math.random() - 0.5);
      const testPitchers = shuffled.slice(0, 10);

      const testState = {
        batter,
        pitchers: testPitchers,
        currentIndex: 0,
        isRolling: false,
        isResolved: false,
        lastRoll: null,
        lastOutcome: null,
        history: [],
        stats: {
          pa: 0,
          ab: 0,
          h: 0,
          singles: 0,
          doubles: 0,
          triples: 0,
          hr: 0,
          bb: 0,
          so: 0,
          out: 0
        }
      };

      const overlay = document.createElement('div');
      overlay.id = 'dex-batter-test-overlay';
      overlay.className = 'dex-test-arena-overlay';
      document.body.appendChild(overlay);

      const render = () => {
        const _t = (k, fallback, params) => (typeof window.t === 'function' ? window.t(k, params) : fallback);
        
        // If finished all 10 at-bats, render the summary report
        if (testState.currentIndex >= 10) {
          const S = testState.stats;
          const avg = S.ab > 0 ? (S.h / S.ab).toFixed(3).replace(/^0/, '') : '.000';
          const obp = S.pa > 0 ? ((S.h + S.bb) / S.pa).toFixed(3).replace(/^0/, '') : '.000';
          const totalBases = S.singles * 1 + S.doubles * 2 + S.triples * 3 + S.hr * 4;
          const slg = S.ab > 0 ? (totalBases / S.ab).toFixed(3).replace(/^0/, '') : '.000';
          const opsNum = (parseFloat(obp) + parseFloat(slg));
          const opsStr = opsNum.toFixed(3);

          let gradeText = 'F', gradeColor = '#ef4444', gradeLabel = '💀 ICE COLD';
          if (opsNum >= 1.200) {
            gradeText = 'S'; gradeColor = '#ffd700'; gradeLabel = '⭐ HALL OF FAME HITTER';
          } else if (opsNum >= 0.900) {
            gradeText = 'A'; gradeColor = '#38bdf8'; gradeLabel = '🔥 ALL-STAR PERFORMANCE';
          } else if (opsNum >= 0.750) {
            gradeText = 'B'; gradeColor = '#4ade80'; gradeLabel = '⚾ SOLID BATTING PROFILE';
          } else if (opsNum >= 0.600) {
            gradeText = 'C'; gradeColor = '#94a3b8'; gradeLabel = '📋 AVERAGE PRODUCTION';
          } else if (opsNum >= 0.400) {
            gradeText = 'D'; gradeColor = '#fb923c'; gradeLabel = '⚠️ COLD STREAK';
          }

          overlay.innerHTML = `
            <div class="dex-test-arena-box" style="text-align:center;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:#ffd700;">
                  ${_t('dex.test_summary_title', '🏆 BATTING PRACTICE REPORT')}
                </div>
                <button id="btn-test-modal-close" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer;">✕</button>
              </div>

              <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:16px;margin-bottom:16px;">
                <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:#fff;margin-bottom:4px;">
                  ${batter.name} (${batter.year || '—'})
                </div>
                <div style="font-size:10px;color:#94a3b8;margin-bottom:12px;">
                  ${batter.team || '—'} · OVR ${Math.floor(batter.ovr || 50)} · ${batter.pos || 'OF'}
                </div>

                <div style="display:inline-flex;align-items:center;gap:12px;background:rgba(0,0,0,0.5);border:2px solid ${gradeColor};border-radius:10px;padding:10px 20px;margin-bottom:14px;box-shadow:0 0 20px ${gradeColor}44;">
                  <div style="font-family:'Press Start 2P',monospace;font-size:32px;color:${gradeColor};">${gradeText}</div>
                  <div style="text-align:left;">
                    <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:${gradeColor};">${gradeLabel}</div>
                    <div style="font-size:10px;color:#cbd5e1;margin-top:2px;">OPS: <strong style="color:#fff;">${opsStr}</strong></div>
                  </div>
                </div>

                <!-- 8-Stat Grid -->
                <div class="dex-test-summary-stat-grid">
                  <div class="dex-test-summary-stat-card"><div class="dex-test-summary-stat-lbl">PA</div><div class="dex-test-summary-stat-val" style="color:#38bdf8;">${S.pa}</div></div>
                  <div class="dex-test-summary-stat-card"><div class="dex-test-summary-stat-lbl">AB</div><div class="dex-test-summary-stat-val" style="color:#cbd5e1;">${S.ab}</div></div>
                  <div class="dex-test-summary-stat-card"><div class="dex-test-summary-stat-lbl">HITS</div><div class="dex-test-summary-stat-val" style="color:#4ade80;">${S.h}</div></div>
                  <div class="dex-test-summary-stat-card"><div class="dex-test-summary-stat-lbl">HR</div><div class="dex-test-summary-stat-val" style="color:#f87171;">${S.hr}</div></div>
                  <div class="dex-test-summary-stat-card"><div class="dex-test-summary-stat-lbl">BB</div><div class="dex-test-summary-stat-val" style="color:#2dd4bf;">${S.bb}</div></div>
                  <div class="dex-test-summary-stat-card"><div class="dex-test-summary-stat-lbl">SO (K)</div><div class="dex-test-summary-stat-val" style="color:#ef4444;">${S.so}</div></div>
                  <div class="dex-test-summary-stat-card"><div class="dex-test-summary-stat-lbl">AVG</div><div class="dex-test-summary-stat-val" style="color:#ffd700;">${avg}</div></div>
                  <div class="dex-test-summary-stat-card"><div class="dex-test-summary-stat-lbl">OPS</div><div class="dex-test-summary-stat-val" style="color:${gradeColor};">${opsStr}</div></div>
                </div>

                <!-- Hits breakdown pills -->
                <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;font-size:9px;color:#cbd5e1;background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;">
                  <span>1B: <strong style="color:#38bdf8;">${S.singles}</strong></span> ·
                  <span>2B: <strong style="color:#4ade80;">${S.doubles}</strong></span> ·
                  <span>3B: <strong style="color:#fbbf24;">${S.triples}</strong></span> ·
                  <span>HR: <strong style="color:#f87171;">${S.hr}</strong></span> ·
                  <span>BB: <strong style="color:#2dd4bf;">${S.bb}</strong></span> ·
                  <span>SO: <strong style="color:#ef4444;">${S.so}</strong></span> ·
                  <span>OUT: <strong style="color:#94a3b8;">${S.out - S.so}</strong></span>
                </div>
              </div>

              <!-- Match history list -->
              <div style="text-align:left;max-height:160px;overflow-y:auto;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px;margin-bottom:16px;">
                <div style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#94a3b8;margin-bottom:8px;">DUEL HISTORY (10 AT-BATS)</div>
                ${testState.history.map(h => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:9px;">
                    <span style="color:#94a3b8;">#${h.atBatNum} vs <strong style="color:#fff;">${h.pitcher.name}</strong> (${h.pitcher.team || ''})</span>
                    <span><span style="color:#64748b;margin-right:6px;">[Roll: ${h.roll}]</span> <span style="font-family:'Press Start 2P',monospace;font-size:8px;font-weight:bold;color:${h.color};">${h.resultType}</span></span>
                  </div>
                `).join('')}
              </div>

              <div style="display:flex;justify-content:center;gap:12px;">
                <button id="btn-test-again" style="padding:10px 18px;background:linear-gradient(135deg,#38bdf8,#0284c7);border:none;border-radius:6px;color:#fff;font-family:'Press Start 2P',monospace;font-size:8px;cursor:pointer;box-shadow:0 0 15px rgba(56,189,248,0.4);">${_t('dex.test_again_btn', '🔄 TEST AGAIN')}</button>
                <button id="btn-test-finish" style="padding:10px 18px;background:linear-gradient(135deg,#64748b,#475569);border:none;border-radius:6px;color:#fff;font-family:'Press Start 2P',monospace;font-size:8px;cursor:pointer;">${_t('dex.test_finish_btn', '✕ CLOSE')}</button>
              </div>
            </div>
          `;

          overlay.querySelector('#btn-test-modal-close').onclick = () => overlay.remove();
          overlay.querySelector('#btn-test-finish').onclick = () => overlay.remove();
          overlay.querySelector('#btn-test-again').onclick = () => {
            const newShuffled = [...availablePitchers].sort(() => Math.random() - 0.5);
            testState.pitchers = newShuffled.slice(0, 10);
            testState.currentIndex = 0;
            testState.isRolling = false;
            testState.isResolved = false;
            testState.lastRoll = null;
            testState.lastOutcome = null;
            testState.history = [];
            testState.stats = { pa: 0, ab: 0, h: 0, singles: 0, doubles: 0, triples: 0, hr: 0, bb: 0, so: 0, out: 0 };
            render();
          };
          return;
        }

        // Active at-bat rendering
        const curPitcher = testState.pitchers[testState.currentIndex];
        const isClutchSituation = (testState.currentIndex % 3 === 2); // Situational tension on at-bats 3, 6, 9
        const simCtx = {
          inning: Math.floor(testState.currentIndex / 3) + 1,
          bases: isClutchSituation ? [null, {}, null] : [null, null, null],
          hasTrait: () => false
        };
        const bounds = (typeof window.calcBoundaries === 'function')
          ? window.calcBoundaries(batter, curPitcher, simCtx)
          : { bbEnd: 10, soEnd: 28, outEnd: 60, singleEnd: 85, doubleEnd: 95, tripleEnd: 97, pitcherClutchStatus: { active: false, label: '' } };

        const pClutchStatus = bounds.pitcherClutchStatus || { active: false };

        overlay.innerHTML = `
          <div class="dex-test-arena-box">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid rgba(255,215,0,0.25);padding-bottom:8px;">
              <div>
                <span style="font-family:'Press Start 2P',monospace;font-size:10px;color:#ffd700;">${_t('dex.test_modal_title', '🎯 BATTING PRACTICE')}</span>
                <span style="font-family:'Press Start 2P',monospace;font-size:9px;color:#38bdf8;margin-left:10px;">${_t('dex.test_ab_counter', `AT-BAT ${testState.currentIndex + 1} / 10`, { curr: testState.currentIndex + 1, total: 10 })}</span>
              </div>
              <button id="btn-test-modal-close" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer;padding:0 4px;line-height:1;">✕</button>
            </div>

            <!-- Matchup Faceoff Grid -->
            <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin-bottom:14px;">
              
              <!-- Batter Mini Panel -->
              <div class="dex-test-card-panel" style="border-color:#38bdf8;">
                <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#38bdf8;margin-bottom:4px;">BATTER</div>
                <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#fff;text-align:center;margin-bottom:2px;">${batter.name}</div>
                <div style="font-size:8px;color:#94a3b8;margin-bottom:6px;">${batter.team || '—'} · ${batter.year || '—'} · OVR ${Math.floor(batter.ovr || 50)}</div>
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;width:100%;font-size:7.5px;text-align:center;">
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">CON:</span> <strong style="color:#ffd700;">${batter.con || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">PWR:</span> <strong style="color:#f87171;">${batter.pwr || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">EYE:</span> <strong style="color:#38bdf8;">${batter.eye || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">K/AVD:</span> <strong style="color:#4ade80;">${batter.k_avd || batter.k_avoid || batter.con || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">SPD:</span> <strong style="color:#2dd4bf;">${batter.spd || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">DEF:</span> <strong style="color:#c084fc;">${batter.def || 50}</strong></div>
                </div>
              </div>

              <!-- VS Emblem -->
              <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:#ffd700;text-shadow:0 0 10px rgba(255,215,0,0.6);text-align:center;">
                VS
              </div>

              <!-- Pitcher Mini Panel -->
              <div class="dex-test-card-panel" style="border-color:#ef4444;">
                <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#ef4444;margin-bottom:4px;">PITCHER (${testState.currentIndex + 1}/10)</div>
                <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#fff;text-align:center;margin-bottom:2px;">${curPitcher.name}</div>
                <div style="font-size:8px;color:#94a3b8;margin-bottom:6px;">${curPitcher.team || '—'} · ${curPitcher.year || '—'} · ${curPitcher.role || 'SP'} · OVR ${Math.floor(curPitcher.ovr || 50)}</div>
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;width:100%;font-size:7.5px;text-align:center;">
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">H/9:</span> <strong style="color:#ffd700;">${curPitcher.h9 || curPitcher.grt || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">K/9:</span> <strong style="color:#f87171;">${curPitcher.k9 || curPitcher.stf || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">BB/9:</span> <strong style="color:#38bdf8;">${curPitcher.bb9 || curPitcher.ctl || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">HR/9:</span> <strong style="color:#4ade80;">${curPitcher.hr9 || curPitcher.mov || 50}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">STA:</span> <strong style="color:#2dd4bf;">${curPitcher.sta || 65}</strong></div>
                  <div style="background:#0a0f18;padding:3px;border-radius:4px;"><span style="color:#94a3b8;">CLT:</span> <strong style="color:#c084fc;">${curPitcher.clt !== undefined ? curPitcher.clt : 50}</strong></div>
                </div>
                ${pClutchStatus.active ? `
                  <div style="margin-top:6px;"><span class="pitcher-clutch-pill ${pClutchStatus.cssClass}">${pClutchStatus.icon} ${pClutchStatus.label}</span></div>
                ` : ''}
              </div>

            </div>

            <!-- Dice Zone Probability Breakdown -->
            <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;font-family:'Press Start 2P',monospace;font-size:7px;color:#94a3b8;margin-bottom:6px;">
                <span>DICE ZONES (1-100)</span>
                <span>HIT CHANCE: <strong style="color:#00ff66;">${(100 - bounds.outEnd)}%</strong></span>
              </div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;font-size:8px;">
                <span style="background:rgba(45,212,191,0.15);color:#2dd4bf;border:1px solid #2dd4bf;padding:2px 6px;border-radius:4px;">BB: 1-${bounds.bbEnd} (${bounds.bbEnd}%)</span>
                <span style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid #ef4444;padding:2px 6px;border-radius:4px;">SO: ${bounds.bbEnd+1}-${bounds.soEnd} (${bounds.soEnd - bounds.bbEnd}%)</span>
                <span style="background:rgba(251,146,60,0.15);color:#fb923c;border:1px solid #fb923c;padding:2px 6px;border-radius:4px;">OUT: ${bounds.soEnd+1}-${bounds.outEnd} (${bounds.outEnd - bounds.soEnd}%)</span>
                <span style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid #38bdf8;padding:2px 6px;border-radius:4px;">1B: ${bounds.outEnd+1}-${bounds.singleEnd}</span>
                <span style="background:rgba(74,222,128,0.15);color:#4ade80;border:1px solid #4ade80;padding:2px 6px;border-radius:4px;">2B: ${bounds.singleEnd+1}-${bounds.doubleEnd}</span>
                <span style="background:rgba(250,204,21,0.15);color:#facc15;border:1px solid #facc15;padding:2px 6px;border-radius:4px;">3B: ${bounds.doubleEnd+1}-${bounds.tripleEnd}</span>
                <span style="background:rgba(244,63,94,0.15);color:#f43f5e;border:1px solid #f43f5e;padding:2px 6px;border-radius:4px;">HR: ${bounds.tripleEnd+1}-100</span>
              </div>
            </div>

            <!-- Roll & Outcome Area -->
            <div style="background:rgba(0,0,0,0.6);border:1.5px solid ${testState.lastOutcome ? testState.lastOutcome.color : '#ffd700'};border-radius:10px;padding:14px;text-align:center;margin-bottom:14px;">
              <div id="dex-test-dice-display" style="font-family:'Press Start 2P',monospace;font-size:24px;color:#ffd700;margin-bottom:8px;height:30px;">
                ${testState.lastRoll !== null ? `🎲 ROLL: ${testState.lastRoll}` : '🎲 READY'}
              </div>
              <div id="dex-test-outcome-display" style="font-family:'Press Start 2P',monospace;font-size:12px;color:${testState.lastOutcome ? testState.lastOutcome.color : '#94a3b8'};min-height:18px;">
                ${testState.lastOutcome ? testState.lastOutcome.text : 'Click Roll Dice to simulate this at-bat'}
              </div>

              <!-- Action Buttons -->
              <div style="margin-top:14px;display:flex;justify-content:center;gap:10px;">
                ${!testState.isResolved ? `
                  <button id="btn-test-roll" class="btn" style="background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;font-weight:bold;font-size:9px;padding:10px 18px;">
                    ${_t('dex.test_roll_btn', '🎲 ROLL DICE')}
                  </button>
                  <button id="btn-test-auto" class="btn btn-secondary" style="font-size:9px;padding:10px 16px;">
                    ${_t('dex.test_auto_btn', '⚡ FAST SIM (10)')}
                  </button>
                ` : `
                  <button id="btn-test-next" class="btn" style="background:linear-gradient(135deg,#00ff66,#10b981);color:#000;font-weight:bold;font-size:9px;padding:10px 20px;">
                    ${testState.currentIndex === 9 ? '📊 VIEW FINAL REPORT ➔' : _t('dex.test_next_btn', 'NEXT PITCHER ➔')}
                  </button>
                `}
              </div>
            </div>

            <!-- Mini Duel History -->
            ${testState.history.length > 0 ? `
              <div style="text-align:left;max-height:100px;overflow-y:auto;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px;">
                <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#94a3b8;margin-bottom:4px;">PREVIOUS AT-BATS (${testState.history.length}/10):</div>
                ${testState.history.map(h => `
                  <div style="font-size:8.5px;color:#cbd5e1;padding:2px 0;">
                    <span style="color:#94a3b8;">#${h.atBatNum} vs ${h.pitcher.name}:</span>
                    <span style="color:${h.color};font-weight:bold;margin-left:4px;">${h.resultType}</span>
                    <span style="color:#64748b;margin-left:4px;">(Roll: ${h.roll})</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

          </div>
        `;

        // Event Listeners
        const closeBtn = overlay.querySelector('#btn-test-modal-close');
        if (closeBtn) closeBtn.onclick = () => overlay.remove();

        const rollBtn = overlay.querySelector('#btn-test-roll');
        if (rollBtn) {
          rollBtn.onclick = () => {
            if (testState.isRolling) return;
            testState.isRolling = true;
            if (window.AudioEngine) window.AudioEngine.play('dice_roll');

            const diceEl = overlay.querySelector('#dex-test-dice-display');
            let tickCount = 0;
            const interval = setInterval(() => {
              tickCount++;
              if (diceEl) diceEl.innerText = `🎲 ${Math.floor(Math.random() * 100) + 1}`;
              if (tickCount >= 6) {
                clearInterval(interval);
                testState.isRolling = false;
                executeAtBatRoll();
              }
            }, 50);
          };
        }

        const autoBtn = overlay.querySelector('#btn-test-auto');
        if (autoBtn) {
          autoBtn.onclick = () => {
            while (testState.currentIndex < 10) {
              const p = testState.pitchers[testState.currentIndex];
              const cBounds = (typeof window.calcBoundaries === 'function')
                ? window.calcBoundaries(batter, p, { inning: 1, bases: [null, null, null], hasTrait: () => false })
                : { bbEnd: 10, soEnd: 28, outEnd: 60, singleEnd: 85, doubleEnd: 95, tripleEnd: 97 };
              resolveRollForState(cBounds, p);
              testState.currentIndex++;
            }
            render();
          };
        }

        const nextBtn = overlay.querySelector('#btn-test-next');
        if (nextBtn) {
          nextBtn.onclick = () => {
            testState.currentIndex++;
            testState.isResolved = false;
            testState.lastRoll = null;
            testState.lastOutcome = null;
            render();
          };
        }
      };

      const resolveRollForState = (bounds, pitcher) => {
        const roll = Math.floor(Math.random() * 100) + 1;
        let rType = 'OUT', rText = 'Flyout / Groundout', rColor = '#94a3b8';
        const S = testState.stats;
        S.pa++;

        if (roll <= bounds.bbEnd) {
          rType = 'BB';
          rText = 'Base on Balls (Walk) 🎯';
          rColor = '#2dd4bf';
          S.bb++;
        } else if (roll <= bounds.soEnd) {
          rType = 'SO';
          rText = 'Strikeout (Ponche) 💀';
          rColor = '#ef4444';
          S.ab++; S.so++; S.out++;
        } else if (roll <= bounds.outEnd) {
          rType = 'OUT';
          rText = 'Out (Groundout/Flyout) 🛡️';
          rColor = '#fb923c';
          S.ab++; S.out++;
        } else if (roll <= bounds.singleEnd) {
          rType = '1B';
          rText = 'Single (Sencillo)! ⚡';
          rColor = '#38bdf8';
          S.ab++; S.h++; S.singles++;
        } else if (roll <= bounds.doubleEnd) {
          rType = '2B';
          rText = 'Double (Doblete)! 💥';
          rColor = '#4ade80';
          S.ab++; S.h++; S.doubles++;
        } else if (roll <= bounds.tripleEnd) {
          rType = '3B';
          rText = 'Triple (Triplete)! 🚀';
          rColor = '#facc15';
          S.ab++; S.h++; S.triples++;
        } else {
          rType = 'HR';
          rText = 'HOME RUN! 💣🔥';
          rColor = '#f43f5e';
          S.ab++; S.h++; S.hr++;
        }

        testState.lastRoll = roll;
        testState.lastOutcome = { type: rType, text: `${rType} — ${rText}`, color: rColor };
        testState.history.push({
          atBatNum: testState.currentIndex + 1,
          pitcher,
          roll,
          resultType: rType,
          resultText: rText,
          color: rColor
        });

        if (window.AudioEngine) {
          if (rType === 'HR') window.AudioEngine.play('homerun');
          else if (rType === '1B' || rType === '2B' || rType === '3B') window.AudioEngine.play('hit');
          else if (rType === 'BB') window.AudioEngine.play('walk');
          else window.AudioEngine.play('out');
        }
      };

      const executeAtBatRoll = () => {
        const curPitcher = testState.pitchers[testState.currentIndex];
        const isClutchSituation = (testState.currentIndex % 3 === 2);
        const simCtx = {
          inning: Math.floor(testState.currentIndex / 3) + 1,
          bases: isClutchSituation ? [null, {}, null] : [null, null, null],
          hasTrait: () => false
        };
        const bounds = (typeof window.calcBoundaries === 'function')
          ? window.calcBoundaries(batter, curPitcher, simCtx)
          : { bbEnd: 10, soEnd: 28, outEnd: 60, singleEnd: 85, doubleEnd: 95, tripleEnd: 97 };

        resolveRollForState(bounds, curPitcher);
        testState.isResolved = true;
        render();
      };

      render();
    }
  };

  window.getPlayerCareerData = getPlayerCareerData;
  window.getPlayerFlagHTML = getPlayerFlagHTML;
  window.getBbrefUrl = getBbrefUrl;
  window.getPosText = getPosText;
  window.getGrade = getGrade;
  window.getGradeColor = getGradeColor;
})();
