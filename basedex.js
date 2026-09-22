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

      // ── HELPER: PITCHER HP BASED ON STAMINA (QUICK PLAY FORMULA) ────────────
      const calcPitcherHP = (sta) => {
        const staVal = (sta !== undefined && sta !== null) ? Number(sta) : 50;
        return Math.max(75, Math.min(200, Math.round(75 + (staVal - 1) * (125 / 124))));
      };

      // ── PITCHER POOL SELECTION: 3 Pitchers (1 SP, 1 SP/RP, 1 RP) ───────────
      const allPitchers = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : (window.PITCHERS_POOL || []);
      const starters = allPitchers.filter(p => p.role === 'SP' || p.pos === 'SP' || (p.sta !== undefined && p.sta >= 65));
      const relievers = allPitchers.filter(p => p.role === 'RP' || p.role === 'CP' || p.pos === 'RP' || (p.sta !== undefined && p.sta < 65));

      const p1Pool = starters.length ? starters : allPitchers;
      const p1Raw = p1Pool[Math.floor(Math.random() * p1Pool.length)];
      const p1Sta = p1Raw.sta !== undefined ? p1Raw.sta : 75;
      const p1Hp = calcPitcherHP(p1Sta);
      const p1 = { ...p1Raw, sta: p1Sta, hp: p1Hp, maxHp: p1Hp, role: 'SP', isKO: false };

      const p2IsStarter = Math.random() < 0.5;
      const p2Pool = (p2IsStarter ? starters : relievers).length ? (p2IsStarter ? starters : relievers) : allPitchers;
      const p2Raw = p2Pool[Math.floor(Math.random() * p2Pool.length)];
      const p2Sta = p2Raw.sta !== undefined ? p2Raw.sta : 60;
      const p2Hp = calcPitcherHP(p2Sta);
      const p2 = { ...p2Raw, sta: p2Sta, hp: p2Hp, maxHp: p2Hp, role: p2IsStarter ? 'SP' : 'RP', isKO: false };

      const p3Pool = relievers.length ? relievers : allPitchers;
      const p3Raw = p3Pool[Math.floor(Math.random() * p3Pool.length)];
      const p3Sta = p3Raw.sta !== undefined ? p3Raw.sta : 45;
      const p3Hp = calcPitcherHP(p3Sta);
      const p3 = { ...p3Raw, sta: p3Sta, hp: p3Hp, maxHp: p3Hp, role: 'RP', isKO: false };

      const pitchers = [p1, p2, p3];

      // ── BATTER DEFENSE STAT ────────────────────────────────────────────────
      const nativePos = batter.pos || batter.primary_position || 'CF';
      const defPos = (nativePos === 'DH' || nativePos === 'P') ? 'CF' : nativePos;
      const defStat = batter.def !== undefined ? batter.def : (batter.defense_val || 50);

      // ── MATCH STATE ────────────────────────────────────────────────────────
      const testState = {
        inning: 1,
        outs: 0,
        runs: 0,
        bases: [null, null, null],
        streak: 0,
        soStreak: 0,
        teamHP: 100,
        teamShieldMax: defStat,
        teamShield: defStat,
        activePitcherIndex: 0,
        pitchers: pitchers,
        pitchersKO: 0,
        pitcherDebuff: null,
        battleOver: false,
        seenExtraInnings: false,
        isRolling: false,
        stats: {
          pa: 0, ab: 0, h: 0, singles: 0, doubles: 0, triples: 0, hr: 0,
          bb: 0, so: 0, rbi: 0, sb: 0, outs: 0, e: 0, dmg: 0
        },
        pitcherStats: {}
      };

      // ── HELPER: GRADE & COLORS ─────────────────────────────────────────────
      const getGrade = (val) => {
        const v = Math.round(Number(val) || 0);
        let letter = 'F', modifier = '';
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
      };

      const getGradeColor = (g) => {
        const letter = (typeof g === 'string' ? g : getGrade(g)).charAt(0);
        switch(letter) {
          case 'S': return '#ffd700';
          case 'A': return '#22d3ee';
          case 'B': return '#4ade80';
          case 'C': return '#94a3b8';
          case 'D': return '#f97316';
          default:  return '#ef4444';
        }
      };

      const getClassGrade = (val) => {
        const v = Math.floor(Number(val) || 0);
        let letter = "F";
        let color = "#ef4444";
        let modifier = "";
        if (v >= 90) {
          letter = "S"; color = "#ffd700";
          if (v >= 97) modifier = "+";
          else if (v < 93) modifier = "-";
        } else if (v >= 80) {
          letter = "A"; color = "#22d3ee";
          if (v >= 87) modifier = "+";
          else if (v < 83) modifier = "-";
        } else if (v >= 70) {
          letter = "B"; color = "#4ade80";
          if (v >= 77) modifier = "+";
          else if (v < 73) modifier = "-";
        } else if (v >= 60) {
          letter = "C"; color = "#94a3b8";
          if (v >= 67) modifier = "+";
          else if (v < 63) modifier = "-";
        } else if (v >= 50) {
          letter = "D"; color = "#f97316";
          if (v >= 57) modifier = "+";
          else if (v < 53) modifier = "-";
        } else {
          letter = "F"; color = "#ef4444";
        }
        return { text: letter + modifier, color: color };
      };

      // ── HELPER: RUNNERS ADVANCEMENT ─────────────────────────────────────────
      const forceWalk = (batterObj) => {
        let runsScored = 0;
        if (testState.bases[0]) {
          if (testState.bases[1]) {
            if (testState.bases[2]) {
              runsScored++;
            }
            testState.bases[2] = testState.bases[1];
          }
          testState.bases[1] = testState.bases[0];
        }
        testState.bases[0] = batterObj;
        return runsScored;
      };

      const advanceOnHit = (hitType, batterObj) => {
        let runsScored = 0;
        if (hitType === '1B') {
          if (testState.bases[2]) { runsScored++; testState.bases[2] = null; }
          if (testState.bases[1]) {
            if ((testState.bases[1].spd || 50) >= 70) { runsScored++; testState.bases[1] = null; }
            else { testState.bases[2] = testState.bases[1]; testState.bases[1] = null; }
          }
          if (testState.bases[0]) {
            if ((testState.bases[0].spd || 50) >= 80 && !testState.bases[2]) {
              testState.bases[2] = testState.bases[0];
            } else {
              testState.bases[1] = testState.bases[0];
            }
            testState.bases[0] = null;
          }
          testState.bases[0] = batterObj;
        } else if (hitType === '2B') {
          if (testState.bases[2]) { runsScored++; testState.bases[2] = null; }
          if (testState.bases[1]) { runsScored++; testState.bases[1] = null; }
          if (testState.bases[0]) {
            if ((testState.bases[0].spd || 50) >= 65) { runsScored++; }
            else { testState.bases[2] = testState.bases[0]; }
            testState.bases[0] = null;
          }
          testState.bases[1] = batterObj;
        } else if (hitType === '3B') {
          for (let i = 0; i < 3; i++) {
            if (testState.bases[i]) { runsScored++; testState.bases[i] = null; }
          }
          testState.bases[2] = batterObj;
        } else if (hitType === 'HR') {
          runsScored = 1;
          for (let i = 0; i < 3; i++) {
            if (testState.bases[i]) { runsScored++; testState.bases[i] = null; }
          }
        }
        return runsScored;
      };

      // ── HELPER: DEAL CARD IN (QUICK PLAY ANIMATION) ──────────────────────────
      const dealCardIn = (container, { fromX = 0, delay = 0 } = {}) => {
        if (!container) return;
        const card = container.firstElementChild;
        if (!card) return;
        container.classList.add('card-deal-perspective');
        card.style.setProperty('--deal-from-x', `${fromX}px`);
        card.style.setProperty('--deal-from-y', '0px');
        card.classList.remove('card-deal-in');
        void card.offsetWidth;
        card.style.animationDelay = `${delay}ms`;
        card.classList.add('card-deal-in');
        if (window.AudioManager) {
          setTimeout(() => window.AudioManager.play('card_deal'), delay);
        }
      };

      // ── HELPER: OUTCOME POPUP BANNER (EXACT QUICK PLAY TIMINGS & STYLING) ───
      const showOutcomePopup = (eventType, details, durationOverride, didSteal = false, spdUpgraded = null) => {
        const fightDeck = overlay.querySelector('.rpg-fight-deck') || overlay.querySelector('.match-arena') || overlay;
        if (!fightDeck) return;

        fightDeck.querySelectorAll('.outcome-popup-overlay').forEach(p => p.remove());

        let title = "";
        let color = "#fff";
        let icon = "fa-star";
        let dmgText = "";
        let borderColor = "#fff";
        let boxShadow = "none";

        switch(eventType) {
          case 'BB':
            title = "BASE ON BALLS (BB)";
            color = "#3b82f6";
            icon = "fa-walking";
            dmgText = "🚶 PITCHER TAKES DAMAGE (15 HP)";
            borderColor = "#3b82f6";
            boxShadow = "0 0 30px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)";
            break;
          case 'SO':
            title = "STRIKEOUT (SO)!";
            color = "#ef4444";
            icon = "fa-circle-xmark";
            dmgText = "💀 DIRECT DAMAGE (IGNORES SHIELD)";
            borderColor = "#ef4444";
            boxShadow = "0 0 30px rgba(239, 68, 68, 0.5), 0 0 15px rgba(239, 68, 68, 0.3)";
            break;
          case 'OUT':
            title = "OUT (FLY / GROUND)";
            color = "#9ca3af";
            icon = "fa-thumbs-down";
            dmgText = "🛡️ SHIELD ABSORBS DAMAGE";
            borderColor = "#9ca3af";
            boxShadow = "0 0 30px rgba(156, 163, 175, 0.5), 0 0 15px rgba(156, 163, 175, 0.3)";
            break;
          case '1B':
            title = "SINGLE (1B)!";
            color = "#a7f3d0";
            icon = "fa-baseball-bat-ball";
            dmgText = "⚾ PITCHER TAKES DAMAGE (20 HP)";
            borderColor = "#10b981";
            boxShadow = "0 0 30px rgba(16, 185, 129, 0.5), 0 0 15px rgba(16, 185, 129, 0.3)";
            break;
          case '2B':
            title = "DOUBLE (2B) ⚡";
            color = "#10b981";
            icon = "fa-bolt-lightning";
            dmgText = "⚡ DOUBLE DAMAGE (35 HP)";
            borderColor = "#10b981";
            boxShadow = "0 0 30px rgba(16, 185, 129, 0.6), 0 0 15px rgba(16, 185, 129, 0.4)";
            break;
          case '3B':
            title = "TRIPLE (3B) 🔥";
            color = "#06b6d4";
            icon = "fa-fire";
            dmgText = "🔥 TRIPLE DAMAGE (50 HP)";
            borderColor = "#06b6d4";
            boxShadow = "0 0 30px rgba(6, 182, 212, 0.6), 0 0 15px rgba(6, 182, 212, 0.4)";
            break;
          case 'HR':
            title = "HOME RUN! 🚀💥";
            color = "#eab308";
            icon = "fa-rocket";
            dmgText = "🚀 CRITICAL HIT! PITCHER -75 HP BASE";
            borderColor = "#eab308";
            boxShadow = "0 0 45px rgba(234, 179, 8, 0.7), 0 0 20px rgba(234, 179, 8, 0.5)";
            break;
          case 'STEAL':
            title = "STOLEN BASE! 🏃⚡";
            color = "#38bdf8";
            icon = "fa-person-running";
            dmgText = "⚡ PITCHER DEBUFF: +20% DAMAGE TAKEN";
            borderColor = "#38bdf8";
            boxShadow = "0 0 35px rgba(56, 189, 248, 0.7)";
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

        let spdUpgradeHTML = '';
        if (spdUpgraded) {
          spdUpgradeHTML = `
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#38bdf8; background:rgba(56,189,248,0.16); border:1.5px solid #38bdf8; padding:6px 10px; border-radius:8px; margin-bottom:8px; width:100%; line-height:1.35; box-shadow:0 0 12px rgba(56,189,248,0.4); text-shadow:0 0 6px #38bdf8;">
              ⚡ EXTRA BASE BY SPEED!
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:10.5px; font-weight:normal; color:#e0f2fe; margin-top:3px; line-height:1.3;">
                <strong>${batter.name}</strong> stretched the hit (${spdUpgraded.from} ➔ ${spdUpgraded.to})!
              </div>
            </div>`;
        }

        popup.innerHTML = `
          <div style="font-size: 32px; color: ${color}; margin-bottom: 8px; filter: drop-shadow(0 0 8px ${color});">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div style="font-family: 'Press Start 2P', monospace; font-size: 12px; font-weight: bold; color: ${color}; text-shadow: 0 0 10px ${color}; margin-bottom: 8px;">
            ${title}
          </div>
          ${spdUpgradeHTML}
          <div style="font-size: 11.5px; color: #e2e8f0; line-height: 1.35; margin-bottom: 8px;">
            ${details || ''}
          </div>
          <div style="font-family: 'Press Start 2P', monospace; font-size: 7.5px; color: #f59e0b; letter-spacing: 0.5px; border-top: 1px dashed rgba(255,255,255,0.15); width: 100%; padding-top: 8px; margin-top: 4px;">
            ${dmgText}
          </div>
        `;

        fightDeck.style.position = "relative";
        fightDeck.appendChild(popup);

        setTimeout(() => {
          popup.style.transform = "translate(-50%, -50%) scale(1)";
          popup.style.opacity = "1";
        }, 10);

        let isDismissed = false;
        const dismissPopup = () => {
          if (isDismissed) return;
          isDismissed = true;
          popup.style.transform = "translate(-50%, -50%) scale(0.85)";
          popup.style.opacity = "0";
          setTimeout(() => popup.remove(), 150);
        };

        popup.addEventListener('click', dismissPopup);
        const displayTime = durationOverride || (spdUpgraded ? 1300 : (eventType === 'HR' ? 1200 : (eventType === 'STEAL' ? 850 : 900)));
        setTimeout(dismissPopup, displayTime);
      };

      // ── PITCHER KO ARCADE JUICE & BULLPEN SEQUENCE (EXACT QUICK PLAY) ───────
      const triggerPitcherKOJuice = (defeatedPitcherName, nextPitcher, onReliefEntered) => {
        const arena = overlay.querySelector('#screen-match') || overlay;
        const fightDeck = overlay.querySelector('.rpg-fight-deck') || arena;

        overlay.querySelectorAll('.arcade-transition-banner, .outcome-popup-overlay, .match-screen-flash').forEach(el => el.remove());

        // 1. Screen flash & Heavy screen shake
        const flash = document.createElement('div');
        flash.className = 'match-screen-flash';
        arena.appendChild(flash);
        setTimeout(() => flash.remove(), 450);

        arena.classList.remove('screen-shake-heavy');
        void arena.offsetWidth;
        arena.classList.add('screen-shake-heavy');
        setTimeout(() => arena.classList.remove('screen-shake-heavy'), 600);

        // 2. Heavy KO sound
        if (window.AudioManager) window.AudioManager.play('pitcher_ko');

        // 3. Stamp "K.O.!" badge on Pitcher Card
        const pSlot = overlay.querySelector('#arena-pitcher-card-slot');
        if (pSlot) {
          pSlot.querySelectorAll('.ko-stamp-badge').forEach(s => s.remove());
          const stamp = document.createElement('div');
          stamp.className = 'ko-stamp-badge';
          stamp.innerHTML = `<i class="fa-solid fa-skull-crossbones"></i> K.O.!`;
          pSlot.style.position = 'relative';
          pSlot.appendChild(stamp);

          const card = pSlot.querySelector('.player-card');
          if (card) {
            card.classList.remove('pitcher-card-defeated');
            void card.offsetWidth;
            card.classList.add('pitcher-card-defeated');
          }
        }

        // 4. Arcade Cinematic Banner: PITCHER K.O.! (1100ms)
        const koBanner = document.createElement('div');
        koBanner.className = 'arcade-transition-banner banner-ko';
        koBanner.innerHTML = `
          <div class="arcade-banner-main">🥊💥 PITCHER K.O.!</div>
          <div class="arcade-banner-sub">${defeatedPitcherName ? `${defeatedPitcherName} — ` : ''}PITCHER DEFEATED!</div>
        `;
        fightDeck.appendChild(koBanner);
        setTimeout(() => koBanner.remove(), 1100);

        // 5. If relief pitcher exists, transition after 1100ms
        if (nextPitcher) {
          setTimeout(() => {
            if (pSlot) {
              const card = pSlot.querySelector('.player-card');
              if (card) {
                card.classList.remove('pitcher-card-defeated');
                card.classList.add('pitcher-card-exit');
              }
              const stamp = pSlot.querySelector('.ko-stamp-badge');
              if (stamp) stamp.classList.add('pitcher-card-exit');
            }

            if (window.AudioManager) window.AudioManager.play('bullpen_enter');

            overlay.querySelectorAll('.arcade-transition-banner').forEach(el => el.remove());

            const nextName = nextPitcher.name || 'Relief Pitcher';
            const nextOvr = typeof window.getPlayerOvr === 'function' ? window.getPlayerOvr(nextPitcher) : (nextPitcher.ovr || 70);

            const bullpenBanner = document.createElement('div');
            bullpenBanner.className = 'arcade-transition-banner banner-bullpen';
            bullpenBanner.innerHTML = `
              <div class="arcade-banner-main">🚨 BULLPEN ALERT! 🚨</div>
              <div class="arcade-banner-sub">Relief Pitcher: ${nextName} (OVR ${nextOvr})</div>
            `;
            fightDeck.appendChild(bullpenBanner);
            setTimeout(() => bullpenBanner.remove(), 1100);

            setTimeout(() => {
              if (onReliefEntered) onReliefEntered();
            }, 250);

          }, 1100);
        }
      };

      // ── DEFENSIVE CHALLENGE MODAL (EXACT COPY OF QUICK PLAY MODAL) ──────────
      const showDefensiveChallenge = (endedInning, onComplete) => {
        const isExtra = (endedInning >= 3);
        const effDef = batter.def !== undefined ? batter.def : (batter.defense_val || 50);

        const defModal = document.createElement('div');
        defModal.className = 'modal-overlay def-modal-backdrop';
        defModal.id = 'modal-mid-inning-defense';
        defModal.style.cssText = 'position:fixed;inset:0;z-index:1000005;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;-webkit-overflow-scrolling:touch;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);';

        const grade = getGrade(effDef);
        const gradeCol = getGradeColor(grade);

        const POS_COORDS = {
          'C':  { x: 150, y: 156, label: 'C' },
          '1B': { x: 212, y: 114, label: '1B' },
          '2B': { x: 175, y: 78,  label: '2B' },
          '3B': { x: 88,  y: 114, label: '3B' },
          'SS': { x: 125, y: 78,  label: 'SS' },
          'LF': { x: 75,  y: 42,  label: 'LF' },
          'CF': { x: 150, y: 25,  label: 'CF' },
          'RF': { x: 225, y: 42,  label: 'RF' }
        };
        const targetCoord = POS_COORDS[defPos] || POS_COORDS['CF'];

        defModal.innerHTML = `
          <div class="def-modal-box" style="padding:20px 18px;max-width:500px;width:100%;text-align:center;margin:auto;">
            <div class="def-scanline-bar"></div>
            
            <div class="def-badge-radar" id="def-modal-inning-badge" style="margin-bottom:10px; ${isExtra ? 'border-color:#ef4444; background:rgba(239,68,68,0.2);' : ''}">
              ${isExtra ? `<span style="color:#ef4444;text-shadow:0 0 10px #ef4444;font-weight:bold;animation:pulse-fast 1s infinite;">💀 EXTRA INNING ${endedInning} • WALK-OFF DEFENSE! 💀</span>` : `🛡️ BOTTOM OF INNING ${endedInning} • DEFENSIVE CHALLENGE`}
            </div>
            
            <h3 style="font-family:'Press Start 2P',monospace;font-size:11px;color:#fff;margin:0 0 4px 0;line-height:1.5;text-shadow:0 0 10px rgba(56,189,248,0.5);" id="def-modal-title">
              RIVAL SHARP DRIVE TO ${defPos}!
            </h3>
            
            <p style="font-size:10.5px;color:#94a3b8;margin:0 0 10px 0;line-height:1.35;" id="def-modal-scenario">
              Rival batter strikes a laser into ${defPos} territory. Test your defensive range!
            </p>

            <div class="def-field-radar-card" id="def-field-radar-card">
              <svg id="def-mini-diamond-svg" viewBox="0 0 300 175" style="width:100%;height:100%;display:block;">
                <path d="M 15 40 Q 150 8 285 40 L 150 160 Z" fill="#092014" stroke="#10b981" stroke-width="1.5" opacity="0.95" />
                <line x1="150" y1="160" x2="15" y2="40" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />
                <line x1="150" y1="160" x2="285" y2="40" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />
                <ellipse cx="150" cy="115" rx="55" ry="38" fill="#361f0d" stroke="#854d0e" stroke-width="1" />
                <polygon points="150,152 202,115 150,78 98,115" fill="#0d2e1c" stroke="#10b981" stroke-width="1" />
                <line x1="150" y1="156" x2="208" y2="115" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="208" y1="115" x2="150" y2="74" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="150" y1="74" x2="92" y2="115" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="92" y1="115" x2="150" y2="156" stroke="#cbd5e1" stroke-width="1.5" />
                <rect x="204" y="111" width="7" height="7" fill="#ffffff" transform="rotate(45 207.5 114.5)" />
                <rect x="146.5" y="70.5" width="7" height="7" fill="#ffffff" transform="rotate(45 150 74)" />
                <rect x="88.5" y="111" width="7" height="7" fill="#ffffff" transform="rotate(45 92 114.5)" />
                <polygon points="150,158 155,153 155,149 145,149 145,153" fill="#ffffff" />
                <circle cx="150" cy="115" r="5" fill="#ca8a04" stroke="#fef08a" stroke-width="1" />
                
                <line id="def-svg-trajectory" x1="150" y1="155" x2="${targetCoord.x}" y2="${targetCoord.y}" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="4,4" class="def-trajectory-laser" />
                <circle id="def-svg-ball" cx="150" cy="155" r="4.5" fill="#ffffff" stroke="#ef4444" stroke-width="1.5">
                  <animate attributeName="opacity" values="1;0.7;1" dur="0.4s" repeatCount="indefinite" />
                </circle>
                
                <g id="def-svg-positions-group">
                  ${Object.keys(POS_COORDS).map(k => {
                    const c = POS_COORDS[k];
                    const isT = (k === defPos);
                    if (isT) {
                      return `
                        <g class="def-pos-target-node" transform="translate(${c.x}, ${c.y})">
                          <circle r="14" fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.8">
                            <animate attributeName="r" values="8;20" dur="1.4s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.9;0" dur="1.4s" repeatCount="indefinite" />
                          </circle>
                          <circle r="10" fill="#0f172a" stroke="#fbbf24" stroke-width="2" />
                          <text y="1" font-size="7" font-weight="bold" fill="#fef08a">${c.label}</text>
                        </g>
                      `;
                    } else {
                      return `
                        <g class="def-pos-node" transform="translate(${c.x}, ${c.y})">
                          <circle r="7" fill="rgba(15,23,42,0.8)" stroke="#64748b" stroke-width="1" />
                          <text y="1" font-size="6" fill="#94a3b8">${c.label}</text>
                        </g>
                      `;
                    }
                  }).join('')}
                </g>
              </svg>
              
              <div id="def-field-speed-tag" style="position: absolute; top: 8px; left: 10px; font-family: 'Press Start 2P', monospace; font-size: 7px; background: rgba(0,0,0,0.8); border: 1px solid #f43f5e; color: #fecdd3; padding: 3px 7px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">
                <span style="color:#ef4444;">⚡ SPEED:</span> <span id="def-field-speed-val">104 MPH</span>
              </div>

              <div id="def-field-target-tag" style="position: absolute; top: 8px; right: 10px; font-family: 'Press Start 2P', monospace; font-size: 7px; background: rgba(0,0,0,0.8); border: 1px solid #38bdf8; color: #7dd3fc; padding: 3px 7px; border-radius: 4px;">
                🎯 ZONE: <span id="def-field-pos-val">${defPos}</span>
              </div>
            </div>

            ${isExtra ? `
              <div id="def-modal-walkoff-warning" style="background: linear-gradient(90deg, rgba(239, 68, 68, 0.4), rgba(185, 28, 28, 0.4)); border: 2px solid #ef4444; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; color: #fef08a; font-family: 'Press Start 2P', monospace; font-size: 7.5px; line-height: 1.6; text-align: center; box-shadow: 0 0 16px rgba(239, 68, 68, 0.6); animation: pulse-fast 1s infinite;">
                <div>⚠️ WALK-OFF DANGER • ALL OR NOTHING! ⚠️</div>
                <div style="color:#fff;font-size:6.5px;margin-top:2px;">If you miss this play, rival scores the golden run and walks off with victory.</div>
              </div>
            ` : ''}

            <!-- Fielder Spotlight Card -->
            <div id="def-modal-fielder-card" class="def-fielder-card" style="margin-bottom:10px;">
              <div class="def-fielder-avatar">🧤</div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:bold;color:#fff;font-size:12.5px;display:flex;align-items:center;gap:6px;">
                  <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:0.5px;">${batter.name}</span>
                  <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#38bdf8;flex-shrink:0;">[${nativePos}]</span>
                </div>
                <div style="font-size:10.5px;color:#cbd5e1;margin-top:2px;">
                  DEF: <strong style="color:${gradeCol};font-size:11.5px;">${effDef} (Grade ${grade})</strong>
                  <span style="font-size:8px;color:#fef08a;font-weight:bold;margin-left:4px;">⭐ PRIMARY POS</span>
                </div>
                <div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">
                  Hit Type: <strong style="color:#fecdd3;">Sharp Line Drive</strong> (104 MPH)
                </div>
              </div>
            </div>

            <!-- Current Team HP Status Indicator -->
            <div id="def-modal-hp-status" style="margin-bottom:10px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;font-family:'Press Start 2P',monospace;font-size:8px;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="color:#94a3b8;font-size:7px;">❤️ TEAM HP:</span>
                <strong style="color:${testState.teamHP <= 25 ? '#ef4444' : (testState.teamHP <= 50 ? '#f59e0b' : '#10b981')};font-size:10px;">${testState.teamHP}/100</strong>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="color:#38bdf8;font-size:7px;">🛡️ SHIELD:</span>
                <strong style="color:#7dd3fc;font-size:9px;">${testState.teamShield}/${testState.teamShieldMax}</strong>
              </div>
            </div>

            <!-- Tactical Strategy Selector -->
            <div class="def-tactics-selector" id="def-tactics-selector">
              <div class="def-tactic-card active" id="def-tactic-safe">
                <div class="def-tactic-title">🛡️ REGULAR PLAY</div>
                <div class="def-tactic-desc">Safe glove (Standard Target • +20 Shield)</div>
              </div>
              <div class="def-tactic-card" id="def-tactic-clutch">
                <div class="def-tactic-title">⚡ DIVE PLAY</div>
                <div class="def-tactic-desc">Diving effort (-12% Target • +60 Shield)</div>
              </div>
            </div>

            <!-- Probability Tension Gauge -->
            <div id="def-modal-gauge-zone" style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-family:'Press Start 2P',monospace;font-size:7px;margin-bottom:4px;">
                <span style="color:#34d399;" id="def-gauge-catch-label">🟢 CATCH ZONE (1–<span id="def-gauge-thresh-val">75</span>)</span>
                <span style="color:#f43f5e;" id="def-gauge-error-label">${isExtra ? '💀 WALK-OFF DEFEAT (76–100)' : '🔴 ERROR (76–100)'}</span>
              </div>
              <div class="def-gauge-wrapper">
                <div class="def-gauge-catch" id="def-gauge-catch-bar" style="width:75%;"></div>
                <div class="def-gauge-error"></div>
                <div class="def-gauge-needle" id="def-gauge-needle" style="left:0%;display:none;"></div>
              </div>
            </div>

            <!-- 3D D100 Dice for Defensive Challenge -->
            <div id="def-dice-d100-panel" style="display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:12px;">
              <div id="def-dice-d100-container" style="display:flex;gap:10px;">
                <div class="d100-die" id="def-die-tens">
                  <div class="d100-die-cube" id="def-die-tens-cube">
                    <div class="d100-die-face face-front" id="def-die-tens-face-front">0</div>
                    <div class="d100-die-face face-back">5</div>
                    <div class="d100-die-face face-right">2</div>
                    <div class="d100-die-face face-left">7</div>
                    <div class="d100-die-face face-top">4</div>
                    <div class="d100-die-face face-bottom">9</div>
                  </div>
                </div>
                <div class="d100-die" id="def-die-units">
                  <div class="d100-die-cube" id="def-die-units-cube">
                    <div class="d100-die-face face-front" id="def-die-units-face-front">0</div>
                    <div class="d100-die-face face-back">5</div>
                    <div class="d100-die-face face-right">2</div>
                    <div class="d100-die-face face-left">0</div>
                    <div class="d100-die-face face-top">0</div>
                    <div class="d100-die-face face-bottom">0</div>
                  </div>
                </div>
              </div>
              <div id="def-dice-result-display" style="font-family:'Press Start 2P',monospace;font-size:15px;color:#fff;letter-spacing:1px;text-shadow:0 0 10px rgba(255,255,255,0.6);">–</div>
            </div>

            <!-- Action Zone -->
            <div id="def-modal-action-zone">
              <button id="btn-def-modal-roll" class="btn" style="width:100%;padding:14px 18px;font-family:'Press Start 2P',monospace;font-size:11px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;border-radius:10px;cursor:pointer;box-shadow:0 0 18px rgba(124,58,237,0.5);letter-spacing:0.5px;">
                🧤 MAKE THE PLAY! (Roll 1 to 75)
              </button>
            </div>

            <div id="def-modal-result-zone" class="hidden" style="margin-top:10px;"></div>
          </div>
        `;

        document.body.appendChild(defModal);
        if (window.AudioManager) window.AudioManager.play('defense_tension_intro');

        let isClutch = false;
        const baseThresh = Math.min(100, Math.max(20, Math.round(30 + effDef * 0.6)));

        const tacticSafe = defModal.querySelector('#def-tactic-safe');
        const tacticClutch = defModal.querySelector('#def-tactic-clutch');
        const catchBar = defModal.querySelector('#def-gauge-catch-bar');
        const threshVal = defModal.querySelector('#def-gauge-thresh-val');
        const errorLabel = defModal.querySelector('#def-gauge-error-label');
        const btnRoll = defModal.querySelector('#btn-def-modal-roll');
        const needleEl = defModal.querySelector('#def-gauge-needle');
        const actionZone = defModal.querySelector('#def-modal-action-zone');
        const resultZone = defModal.querySelector('#def-modal-result-zone');

        const updateTactics = () => {
          const curThresh = isClutch ? Math.max(15, baseThresh - 12) : baseThresh;
          if (catchBar) catchBar.style.width = `${curThresh}%`;
          if (threshVal) threshVal.innerText = curThresh;
          if (errorLabel) {
            errorLabel.innerHTML = isExtra ? `💀 WALK-OFF DEFEAT (${curThresh + 1}–100)` : `🔴 ERROR (${curThresh + 1}–100)`;
          }
          if (btnRoll) {
            btnRoll.innerHTML = isClutch
              ? `⚡ DIVE PLAY! (Roll 1 to ${curThresh})`
              : `🧤 REGULAR PLAY! (Roll 1 to ${curThresh})`;
          }
          if (tacticSafe) tacticSafe.classList.toggle('active', !isClutch);
          if (tacticClutch) tacticClutch.classList.toggle('active', isClutch);
        };

        if (tacticSafe) {
          tacticSafe.onclick = () => {
            if (btnRoll && btnRoll.disabled) return;
            isClutch = false;
            updateTactics();
            if (window.AudioManager) window.AudioManager.play('menu_click');
          };
        }
        if (tacticClutch) {
          tacticClutch.onclick = () => {
            if (btnRoll && btnRoll.disabled) return;
            isClutch = true;
            updateTactics();
            if (window.AudioManager) window.AudioManager.play('menu_click');
          };
        }
        updateTactics();

        if (btnRoll) {
          btnRoll.onclick = () => {
            btnRoll.disabled = true;
            btnRoll.innerHTML = '⚾ FIELDING IN PLAY...';
            if (window.AudioManager) window.AudioManager.play('menu_click');

            const roll = Math.floor(Math.random() * 100) + 1;
            const curThresh = isClutch ? Math.max(15, baseThresh - 12) : baseThresh;
            const isSuccess = roll <= curThresh;

            const tensDigit = Math.floor(roll / 10) % 10;
            const unitsDigit = roll % 10;

            const cubeUnits = defModal.querySelector('#def-die-units-cube');
            const cubeTens  = defModal.querySelector('#def-die-tens-cube');
            const faceUnits = defModal.querySelector('#def-die-units-face-front');
            const faceTens  = defModal.querySelector('#def-die-tens-face-front');
            const resultEl  = defModal.querySelector('#def-dice-result-display');

            defModal.querySelectorAll('.d100-die-face:not(.face-front)').forEach(f => {
              f.innerText = Math.floor(Math.random() * 10);
            });

            if (faceTens) faceTens.innerText = tensDigit;
            if (faceUnits) faceUnits.innerText = unitsDigit;

            if (cubeUnits) {
              cubeUnits.classList.remove('tumbling-units', 'die-settled');
              void cubeUnits.offsetWidth;
              cubeUnits.classList.add('tumbling-units');
            }
            if (cubeTens) {
              cubeTens.classList.remove('tumbling-tens', 'die-settled');
              void cubeTens.offsetWidth;
              cubeTens.classList.add('tumbling-tens');
            }

            setTimeout(() => {
              if (cubeUnits) cubeUnits.classList.add('die-settled');
              if (window.AudioManager) window.AudioManager.play('menu_click');
            }, 550);

            setTimeout(() => {
              if (cubeTens) cubeTens.classList.add('die-settled');
              if (window.AudioManager) window.AudioManager.play('menu_click');

              if (resultEl) {
                resultEl.innerText = roll;
                resultEl.style.color = isSuccess ? '#00ff66' : '#ef4444';
              }

              if (needleEl) {
                needleEl.style.display = 'block';
                needleEl.style.left = `${Math.min(100, Math.max(0, roll))}%`;
              }

              actionZone.classList.add('hidden');
              resultZone.classList.remove('hidden');

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
                  <div style="background:rgba(16,185,129,0.15); border:1.5px solid #10b981; border-radius:8px; padding:12px; color:#a7f3d0; font-size:11px; margin-bottom:10px;">
                    <div style="font-family:'Press Start 2P',monospace; font-size:10px; color:#10b981; margin-bottom:6px;">🥇 GOLD GLOVE PLAY!</div>
                    <div>Sensational catch by ${batter.name} (Roll: ${roll}/${curThresh})! +${shieldGained} Shield restored!${hpHealed > 0 ? ` (+${hpHealed} HP healed)` : ''}</div>
                  </div>
                  <button id="btn-def-continue" class="btn" style="width:100%; padding:12px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:#10b981; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">
                    CONTINUE TO NEXT INNING ➔
                  </button>
                `;
              } else {
                const penalty = isClutch ? 30 : 10;
                testState.stats.e = (testState.stats.e || 0) + 1;
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

                  resultZone.innerHTML = `
                    <div style="background:rgba(239,68,68,0.2); border:1.5px solid #ef4444; border-radius:8px; padding:12px; color:#fca5a5; font-size:11px; margin-bottom:10px;">
                      <div style="font-family:'Press Start 2P',monospace; font-size:10px; color:#ef4444; margin-bottom:6px;">💀 WALK-OFF DEFEAT!</div>
                      <div>Defensive misplay in Extra Inning ${endedInning}. Rival walks off with the victory!</div>
                    </div>
                    <button id="btn-def-continue" class="btn" style="width:100%; padding:12px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:#ef4444; color:#fff; border:none; border-radius:8px; cursor:pointer;">
                      VIEW MATCH RESULTS ➔
                    </button>
                  `;
                } else {
                  resultZone.innerHTML = `
                    <div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; border-radius:8px; padding:12px; color:#fca5a5; font-size:11px; margin-bottom:10px;">
                      <div style="font-family:'Press Start 2P',monospace; font-size:10px; color:#ef4444; margin-bottom:6px;">⚠️ DEFENSIVE ERROR!</div>
                      <div>Rival ball slips past (Roll: ${roll}/${curThresh}). Team suffers -${penalty} Damage!</div>
                    </div>
                    <button id="btn-def-continue" class="btn" style="width:100%; padding:12px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:#ef4444; color:#fff; border:none; border-radius:8px; cursor:pointer;">
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

      // ── BATTLE SUMMARY SCREEN (EXACT QUICK PLAY STATS MODAL) ───────────────
      const renderSummary = () => {
        const isVictory = (testState.pitchersKO >= 3);
        const s = testState.stats;
        const bName = batter.name || 'Batter';

        const summaryModal = document.createElement('div');
        summaryModal.id = 'modal-run-summary';
        summaryModal.className = 'modal-overlay';
        summaryModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(10px);z-index:1000020;display:flex;align-items:center;justify-content:center;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;';

        const totAB = s.ab || 0;
        const totH = s.h || 0;
        const tot2B = s.doubles || 0;
        const tot3B = s.triples || 0;
        const totHR = s.hr || 0;
        const totRBI = s.rbi || 0;
        const totSB = s.sb || 0;
        const totBB = s.bb || 0;
        const totSO = s.so || 0;
        const totE = s.e || 0;
        const totDMG = s.dmg || 0;
        const defErrors = totE;

        const b1 = Math.max(0, totH - tot2B - tot3B - totHR);
        const tPA = totAB + totBB;
        const totalBases = b1 + (2 * tot2B) + (3 * tot3B) + (4 * totHR);

        const avgVal = totAB > 0 ? (totH / totAB) : 0;
        const obpVal = tPA > 0 ? ((totH + totBB) / tPA) : 0;
        const slgVal = totAB > 0 ? (totalBases / totAB) : 0;
        const opsVal = obpVal + slgVal;

        const tAvg = totAB > 0 ? avgVal.toFixed(3).replace(/^0/, '') : '.000';
        const tOBP = tPA > 0 ? obpVal.toFixed(3).replace(/^0/, '') : '.000';
        const tSLG = totAB > 0 ? slgVal.toFixed(3).replace(/^0/, '') : '.000';
        const tOPS = (totAB > 0 || tPA > 0) ? opsVal.toFixed(3) : '.000';

        const processedBatters = [{
          name: bName,
          g: 1,
          ab: totAB,
          h: totH,
          b2: tot2B,
          b3: tot3B,
          hr: totHR,
          rbi: totRBI,
          sb: totSB,
          bb: totBB,
          so: totSO,
          e: totE,
          dmg: totDMG,
          avgVal,
          obpVal,
          slgVal,
          opsVal
        }];

        const processedPitchers = testState.pitchers.map(p => {
          const pName = p.name || 'Pitcher';
          const ps = testState.pitcherStats[pName] || { outs: 0, k: 0, bb: 0, h: 0, hr: 0, er: 0, dmg: 0 };
          const outs = ps.outs || 0;
          const er = ps.er || 0;
          const bb = ps.bb || 0;
          const h = ps.h || 0;
          const k = ps.k || 0;
          const hr = ps.hr || 0;
          const dmg = ps.dmg || 0;
          const eraVal = outs > 0 ? ((er * 27) / outs) : 99.0;
          const whipVal = outs > 0 ? ((bb + h) / (outs / 3)) : 99.0;
          return { name: pName, outs, er, bb, h, k, hr, dmg, eraVal, whipVal };
        });

        summaryModal.innerHTML = `
          <div class="modal-run-summary-box" style="background:#090d16;border:2px solid ${isVictory ? '#ffd700' : 'var(--accent-color)'};border-radius:16px;padding:24px;width:95%;max-width:1040px;max-height:90vh;overflow-y:auto;box-shadow:0 0 50px rgba(0,0,0,0.9);position:relative;margin:auto;-webkit-overflow-scrolling:touch;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed rgba(255,255,255,0.2);padding-bottom:12px;margin-bottom:16px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">${isVictory ? '🏆' : '💀'}</span>
                <h3 style="font-family:'Press Start 2P',monospace;font-size:12px;color:${isVictory ? '#ffd700' : 'var(--accent-color)'};margin:0;">
                  <i class="fa-solid fa-baseball"></i> ${isVictory ? 'VICTORY — MATCH STATS' : 'MATCH STATS & SUMMARY'}
                </h3>
              </div>
              <button id="btn-close-run-summary-x" style="background:none;border:none;color:#9ca3af;font-size:24px;cursor:pointer;">&times;</button>
            </div>

            <!-- Team Defense & Run Totals Header -->
            <div id="summary-team-totals-header" style="margin-bottom:16px;">
              <div style="background:linear-gradient(135deg,rgba(16,185,129,0.08) 0%,rgba(14,165,233,0.08) 100%);border:1px solid rgba(56,189,248,0.3);border-radius:12px;padding:12px 16px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;">
                <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:var(--accent-color);">
                  🛡️ DEFENSE & RUN TOTALS
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:9.5px;font-family:'Press Start 2P',monospace;align-items:center;">
                  <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#22d3ee;">H: ${totH}</span>
                  <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#ef4444;">HR: ${totHR}</span>
                  <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#10b981;">RBI: ${totRBI}</span>
                  <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#ffd700;">AVG: ${tAvg}</span>
                  <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#00ff66;">OPS: ${tOPS}</span>
                  <span style="background:rgba(255,51,102,0.15);border:1px solid #ff3366;padding:5px 8px;border-radius:6px;color:#ff6699;box-shadow:0 0 10px rgba(255,51,102,0.25);">💥 DMG: ${totDMG}</span>
                  <span style="background:rgba(239,68,68,0.18);border:1.5px solid #ef4444;padding:5px 10px;border-radius:6px;color:#f87171;box-shadow:0 0 10px rgba(239,68,68,0.3);">
                    ⚠️ Errors (E): <strong style="color:#fff;font-size:11px;">${defErrors}</strong>
                  </span>
                </div>
              </div>
            </div>

            <!-- Tab Buttons -->
            <div style="display:flex;gap:10px;margin-bottom:16px;">
              <button id="tab-summary-batters" class="btn" style="padding:8px 16px;font-size:11px;background:var(--primary-color);color:#000;border:none;font-weight:bold;font-family:'Press Start 2P',monospace;">My Batter (Batting)</button>
              <button id="tab-summary-pitchers" class="btn" style="padding:8px 16px;font-size:11px;background:rgba(255,255,255,0.1);color:#fff;border:none;font-weight:bold;font-family:'Press Start 2P',monospace;">Opposing Pitchers</button>
            </div>

            <!-- Batters Content Table -->
            <div id="summary-content-batters">
              <div class="run-summary-table-scroll" style="overflow-x:auto;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;max-height:55vh;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;text-align:left;">
                  <thead>
                    <tr id="summary-thead-batters-row" style="border-bottom:2px solid rgba(255,255,255,0.2);color:var(--accent-color);user-select:none;">
                      <th style="padding:8px;cursor:pointer;" data-sort="name">Player</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="g">G</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="ab">AB</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="h">H</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="b2">2B</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="b3">3B</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="hr">HR</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="rbi">RBI</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="sb">SB</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="bb">BB</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="so">SO</th>
                      <th style="padding:8px;cursor:pointer;color:#f87171;" data-sort="e">E</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="avgVal">AVG</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="obpVal">OBP</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="slgVal">SLG</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="opsVal">OPS</th>
                      <th style="padding:8px;cursor:pointer;color:#ff3366;" data-sort="dmg">DMG</th>
                    </tr>
                  </thead>
                  <tbody id="summary-tbody-batters">
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Pitchers Content Table -->
            <div id="summary-content-pitchers" class="hidden">
              <div class="run-summary-table-scroll" style="overflow-x:auto;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;max-height:55vh;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;text-align:left;">
                  <thead>
                    <tr id="summary-thead-pitchers-row" style="border-bottom:2px solid rgba(255,255,255,0.2);color:#38bdf8;user-select:none;">
                      <th style="padding:8px;cursor:pointer;" data-sort="name">Pitcher</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="outs">IP</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="k">K</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="bb">BB</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="h">H</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="hr">HR</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="er">ER</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="eraVal">ERA</th>
                      <th style="padding:8px;cursor:pointer;" data-sort="whipVal">WHIP</th>
                      <th style="padding:8px;cursor:pointer;color:#ff3366;" data-sort="dmg">DMG</th>
                    </tr>
                  </thead>
                  <tbody id="summary-tbody-pitchers">
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bottom Action Buttons -->
            <div style="display:flex;gap:12px;margin-top:20px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:16px;">
              <button id="btn-summary-restart" class="btn" style="flex:1;padding:12px;font-family:'Press Start 2P',monospace;font-size:9.5px;background:linear-gradient(135deg,#10b981,#059669);color:#000;font-weight:bold;border:none;border-radius:8px;cursor:pointer;">
                ⚾ PLAY AGAIN
              </button>
              <button id="btn-summary-close" class="btn btn-secondary" style="flex:1;padding:12px;font-family:'Press Start 2P',monospace;font-size:9.5px;cursor:pointer;">
                ✕ RETURN TO DEX
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(summaryModal);

        // Populate Batter Table
        const tbodyB = summaryModal.querySelector('#summary-tbody-batters');
        let currentBatterSortCol = 'opsVal';
        let currentBatterSortAsc = false;

        const renderBattersTable = () => {
          if (!tbodyB) return;
          processedBatters.sort((a, b) => {
            let valA = a[currentBatterSortCol];
            let valB = b[currentBatterSortCol];
            if (typeof valA === 'string') {
              return currentBatterSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return currentBatterSortAsc ? (valA - valB) : (valB - valA);
          });

          const ths = summaryModal.querySelectorAll('#summary-thead-batters-row th');
          ths.forEach(th => {
            const col = th.dataset.sort;
            const rawText = th.getAttribute('data-original-label') || th.innerText.replace(/[ ▲▼]/g, '');
            if (!th.getAttribute('data-original-label')) th.setAttribute('data-original-label', rawText);
            if (col === currentBatterSortCol) {
              th.innerHTML = `${rawText} <span style="font-size:9px;color:#facc15;">${currentBatterSortAsc ? '▲' : '▼'}</span>`;
              th.style.color = '#facc15';
            } else {
              th.innerHTML = rawText;
              th.style.color = (col === 'e' ? '#f87171' : (col === 'dmg' ? '#ff3366' : 'var(--accent-color)'));
            }
          });

          tbodyB.innerHTML = '';
          processedBatters.forEach(s => {
            const avg = s.ab > 0 ? s.avgVal.toFixed(3) : '.000';
            const obp = (s.ab + s.bb) > 0 ? s.obpVal.toFixed(3) : '.000';
            const slg = s.ab > 0 ? s.slgVal.toFixed(3) : '.000';
            const ops = (s.ab > 0 || (s.ab + s.bb) > 0) ? s.opsVal.toFixed(3) : '.000';
            const rowColor = (s.hr >= 2) ? 'rgba(255,215,0,0.05)' : 'transparent';
            const tr = document.createElement('tr');
            tr.style.cssText = `border-bottom:1px solid rgba(255,255,255,0.06);background:${rowColor};`;
            tr.innerHTML = `
              <td style="padding:8px;color:#e2e8f0;font-weight:bold;">${s.name}</td>
              <td style="padding:8px;color:#94a3b8;">${s.g}</td>
              <td style="padding:8px;color:#94a3b8;">${s.ab}</td>
              <td style="padding:8px;color:#22d3ee;">${s.h}</td>
              <td style="padding:8px;color:#f59e0b;">${s.b2}</td>
              <td style="padding:8px;color:#f59e0b;">${s.b3}</td>
              <td style="padding:8px;color:#ef4444;">${s.hr}</td>
              <td style="padding:8px;color:#10b981;">${s.rbi}</td>
              <td style="padding:8px;color:#38bdf8;">${s.sb}</td>
              <td style="padding:8px;color:#a78bfa;">${s.bb}</td>
              <td style="padding:8px;color:#f87171;">${s.so}</td>
              <td style="padding:8px;color:${s.e > 0 ? '#f87171' : '#64748b'};font-weight:${s.e > 0 ? 'bold' : 'normal'};">${s.e}</td>
              <td style="padding:8px;color:${s.avgVal >= 0.300 ? '#ffd700' : '#94a3b8'};font-weight:bold;">${avg}</td>
              <td style="padding:8px;color:${s.obpVal >= 0.380 ? '#38bdf8' : '#94a3b8'};font-weight:bold;">${obp}</td>
              <td style="padding:8px;color:${s.slgVal >= 0.500 ? '#f59e0b' : '#94a3b8'};font-weight:bold;">${slg}</td>
              <td style="padding:8px;color:${s.opsVal >= 0.850 ? '#00ff66' : (s.opsVal >= 0.750 ? '#ffd700' : '#94a3b8')};font-weight:bold;">${ops}</td>
              <td style="padding:8px;color:#ff3366;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:9.5px;">${s.dmg}</td>
            `;
            tbodyB.appendChild(tr);
          });
        };

        const batterThs = summaryModal.querySelectorAll('#summary-thead-batters-row th');
        batterThs.forEach(th => {
          th.onclick = () => {
            const col = th.dataset.sort;
            if (!col) return;
            if (currentBatterSortCol === col) currentBatterSortAsc = !currentBatterSortAsc;
            else { currentBatterSortCol = col; currentBatterSortAsc = (col === 'name'); }
            renderBattersTable();
          };
        });
        renderBattersTable();

        // Populate Pitcher Table
        const tbodyP = summaryModal.querySelector('#summary-tbody-pitchers');
        let currentPitcherSortCol = 'outs';
        let currentPitcherSortAsc = false;

        const renderPitchersTable = () => {
          if (!tbodyP) return;
          processedPitchers.sort((a, b) => {
            let valA = a[currentPitcherSortCol];
            let valB = b[currentPitcherSortCol];
            if (typeof valA === 'string') {
              return currentPitcherSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return currentPitcherSortAsc ? (valA - valB) : (valB - valA);
          });

          const ths = summaryModal.querySelectorAll('#summary-thead-pitchers-row th');
          ths.forEach(th => {
            const col = th.dataset.sort;
            const rawText = th.getAttribute('data-original-label') || th.innerText.replace(/[ ▲▼]/g, '');
            if (!th.getAttribute('data-original-label')) th.setAttribute('data-original-label', rawText);
            if (col === currentPitcherSortCol) {
              th.innerHTML = `${rawText} <span style="font-size:9px;color:#facc15;">${currentPitcherSortAsc ? '▲' : '▼'}</span>`;
              th.style.color = '#facc15';
            } else {
              th.innerHTML = rawText;
              th.style.color = (col === 'dmg' ? '#ff3366' : '#38bdf8');
            }
          });

          tbodyP.innerHTML = '';
          processedPitchers.forEach(ps => {
            const ip = `${Math.floor(ps.outs / 3)}.${ps.outs % 3}`;
            const era = ps.outs > 0 ? ps.eraVal.toFixed(2) : '--.--';
            const whip = ps.outs > 0 ? ps.whipVal.toFixed(2) : '--.--';
            const tr = document.createElement('tr');
            tr.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.06);';
            tr.innerHTML = `
              <td style="padding:8px;color:#e2e8f0;font-weight:bold;">${ps.name}</td>
              <td style="padding:8px;color:#22d3ee;">${ip}</td>
              <td style="padding:8px;color:#a78bfa;">${ps.k}</td>
              <td style="padding:8px;color:#fbbf24;">${ps.bb}</td>
              <td style="padding:8px;color:#94a3b8;">${ps.h}</td>
              <td style="padding:8px;color:#ef4444;">${ps.hr}</td>
              <td style="padding:8px;color:#f87171;">${ps.er}</td>
              <td style="padding:8px;color:${parseFloat(era) > 4.5 ? '#ef4444' : '#10b981'};font-weight:bold;">${era}</td>
              <td style="padding:8px;color:${parseFloat(whip) > 1.3 ? '#ef4444' : '#10b981'};font-weight:bold;">${whip}</td>
              <td style="padding:8px;color:#ff3366;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:9.5px;">${ps.dmg}</td>
            `;
            tbodyP.appendChild(tr);
          });
        };

        const pitcherThs = summaryModal.querySelectorAll('#summary-thead-pitchers-row th');
        pitcherThs.forEach(th => {
          th.onclick = () => {
            const col = th.dataset.sort;
            if (!col) return;
            if (currentPitcherSortCol === col) currentPitcherSortAsc = !currentPitcherSortAsc;
            else { currentPitcherSortCol = col; currentPitcherSortAsc = (col === 'name' || col === 'eraVal' || col === 'whipVal'); }
            renderPitchersTable();
          };
        });
        renderPitchersTable();

        // Tabs switching
        const tabB = summaryModal.querySelector('#tab-summary-batters');
        const tabP = summaryModal.querySelector('#tab-summary-pitchers');
        const contB = summaryModal.querySelector('#summary-content-batters');
        const contP = summaryModal.querySelector('#summary-content-pitchers');

        if (tabB) tabB.onclick = () => {
          contB.classList.remove('hidden'); contP.classList.add('hidden');
          tabB.style.background = 'var(--primary-color)'; tabB.style.color = '#000';
          tabP.style.background = 'rgba(255,255,255,0.1)'; tabP.style.color = '#fff';
        };
        if (tabP) tabP.onclick = () => {
          contP.classList.remove('hidden'); contB.classList.add('hidden');
          tabP.style.background = '#38bdf8'; tabP.style.color = '#000';
          tabB.style.background = 'rgba(255,255,255,0.1)'; tabB.style.color = '#fff';
        };

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

        const btnCloseX = summaryModal.querySelector('#btn-close-run-summary-x');
        if (btnCloseX) {
          btnCloseX.onclick = () => {
            summaryModal.remove();
            overlay.remove();
          };
        }
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

        // Pitcher Card DOM
        const pitcherSlot = overlay.querySelector('#arena-pitcher-card-slot');
        if (pitcherSlot) {
          pitcherSlot.innerHTML = (typeof window.createCardHTML === 'function')
            ? window.createCardHTML(curPitcher, curPitcher.role || 'SP')
            : `<div class="player-card"><div class="card-name">${curPitcher.name}</div></div>`;
        }

        // Pitcher Faceoff Name & HP
        const pNameDisp = overlay.querySelector('#match-pitcher-name');
        if (pNameDisp) pNameDisp.innerText = curPitcher.name;

        const pHPFill = overlay.querySelector('#match-pitcher-hp-fill');
        if (pHPFill) {
          const pct = Math.max(0, (curPitcher.hp / curPitcher.maxHp) * 100);
          pHPFill.style.width = `${pct}%`;
          pHPFill.style.background = pct <= 25
            ? 'linear-gradient(90deg,#ff3333,#ff6666)'
            : pct <= 50
            ? 'linear-gradient(90deg,#ffcc00,#ffeb60)'
            : 'linear-gradient(90deg,#00ff66,#66ffa6)';
        }

        const pHPText = overlay.querySelector('#match-pitcher-hp-text');
        if (pHPText) pHPText.innerText = `${curPitcher.hp}/${curPitcher.maxHp} HP`;

        // Pitcher Clutch Badge (using official CSS classes)
        const clutchBadge = overlay.querySelector('#match-pitcher-clutch-badge');
        if (clutchBadge) {
          if (pClutchStatus && pClutchStatus.active) {
            clutchBadge.innerHTML = `<span class="pitcher-clutch-pill ${pClutchStatus.cssClass || ''}">${pClutchStatus.icon || '🔥'} PITCHER CLUTCH: ${pClutchStatus.label}</span>`;
            clutchBadge.classList.remove('hidden');
          } else {
            clutchBadge.innerHTML = '';
            clutchBadge.classList.add('hidden');
          }
        }

        // Pitcher Debuff Badge
        const debuffBadge = overlay.querySelector('#match-pitcher-debuff-badge');
        if (debuffBadge) {
          if (testState.pitcherDebuff && testState.pitcherDebuff.turnsLeft > 0) {
            debuffBadge.classList.remove('hidden');
            debuffBadge.innerText = `⚡ DEBUFF: +20% DMG (${testState.pitcherDebuff.turnsLeft}t)`;
          } else {
            debuffBadge.classList.add('hidden');
          }
        }

        // Rotation Queue Badges with accurate OVR and HP
        const rotQueue = overlay.querySelector('#match-pitchers-rotation-queue');
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
        const tHPFill = overlay.querySelector('#team-hp-bar');
        if (tHPFill) tHPFill.style.width = `${Math.max(0, testState.teamHP)}%`;
        const tHPText = overlay.querySelector('#team-hp-text');
        if (tHPText) tHPText.innerText = `${Math.max(0, testState.teamHP)}/100`;

        const tShieldFill = overlay.querySelector('#team-shield-bar');
        if (tShieldFill) tShieldFill.style.width = testState.teamShieldMax > 0 ? `${(testState.teamShield / testState.teamShieldMax) * 100}%` : '0%';
        const tShieldText = overlay.querySelector('#team-shield-text');
        if (tShieldText) tShieldText.innerText = `${testState.teamShield}/${testState.teamShieldMax}`;

        // Scoreboard updates
        const innDisp = overlay.querySelector('#score-away-h');
        if (innDisp) innDisp.innerText = `${testState.inning} / 3${testState.inning >= 4 ? ' (EXTRA)' : ''}`;

        const runsDisp = overlay.querySelector('#score-away-r');
        if (runsDisp) runsDisp.innerText = `${testState.runs}`;

        const outsDisp = overlay.querySelector('#score-home-r');
        if (outsDisp) outsDisp.innerText = `${testState.outs}`;

        const koDisp = overlay.querySelector('#score-home-h');
        if (koDisp) koDisp.innerText = `${testState.pitchersKO} / 3`;

        // Luck Zones updates
        const zonesLines = overlay.querySelector('#zones-lines');
        if (zonesLines) {
          zonesLines.innerHTML = `
            <div style="display:flex; justify-content:space-between; color:#3b82f6; font-size:7px; font-family:'Press Start 2P',monospace; padding:2px 0;">
              <span>🚶 Walk (BB)</span><span>1–${bounds.bbEnd}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#ef4444; font-size:7px; font-family:'Press Start 2P',monospace; padding:2px 0;">
              <span>💨 Strikeout (SO)</span><span>${bounds.bbEnd + 1}–${bounds.soEnd}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#9ca3af; font-size:7px; font-family:'Press Start 2P',monospace; padding:2px 0;">
              <span>✋ Out (Fly/GD)</span><span>${bounds.soEnd + 1}–${bounds.outEnd}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#a7f3d0; font-size:7px; font-family:'Press Start 2P',monospace; padding:2px 0;">
              <span>⚾ Single (1B)</span><span>${bounds.outEnd + 1}–${bounds.singleEnd}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#10b981; font-size:7px; font-family:'Press Start 2P',monospace; padding:2px 0;">
              <span>⚡ Double (2B)</span><span>${bounds.singleEnd + 1}–${bounds.doubleEnd}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#06b6d4; font-size:7px; font-family:'Press Start 2P',monospace; padding:2px 0;">
              <span>🔥 Triple (3B)</span><span>${bounds.doubleEnd + 1}–${bounds.tripleEnd}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#eab308; font-size:7px; font-family:'Press Start 2P',monospace; padding:2px 0;">
              <span>🚀 Home Run (HR)</span><span>${bounds.tripleEnd + 1}–100</span>
            </div>
          `;
        }
      };

      // ── RESOLVE TURN LOGIC ─────────────────────────────────────────────────
      const resolveTurn = (bounds, curPitcher) => {
        const isExtra = testState.inning >= 4;
        testState.stats.pa++;

        if (testState.pitcherDebuff) {
          testState.pitcherDebuff.turnsLeft--;
          if (testState.pitcherDebuff.turnsLeft <= 0) testState.pitcherDebuff = null;
        }

        const roll = Math.floor(Math.random() * 100) + 1;
        let rType = 'OUT';
        let rColor = '#9ca3af';
        let rText = 'Batter grounds out.';
        let pitcherDmg = 0;
        let teamHpDmg = 0;
        let runsThisTurn = 0;
        let didSteal = false;
        let spdUpgraded = null;

        if (roll <= bounds.bbEnd) {
          rType = 'BB';
          rColor = '#3b82f6';
          rText = `${batter.name} shows great patience and draws a Walk!`;
          testState.stats.bb++;
          testState.streak = 0;
          testState.soStreak = 0;
          runsThisTurn = forceWalk(batter);
          pitcherDmg = 15;

          const bSpd = batter.spd || 50;
          if (bSpd >= 50 && Math.random() < 0.35) {
            didSteal = true;
            testState.stats.sb++;
            if (!testState.bases[1]) {
              testState.bases[1] = testState.bases[0];
              testState.bases[0] = null;
            }
            testState.pitcherDebuff = { turnsLeft: 2 };
          }
        } else if (roll <= bounds.soEnd) {
          rType = 'SO';
          rColor = '#ef4444';
          testState.stats.ab++;
          testState.stats.so++;
          testState.outs++;
          testState.streak = 0;
          testState.soStreak++;

          const soDmgTable = isExtra ? [30, 38, 45] : [20, 25, 30];
          const directDmg = soDmgTable[Math.min(testState.soStreak - 1, 2)];
          teamHpDmg = directDmg;
          testState.teamHP = Math.max(0, testState.teamHP - directDmg);

          rText = `Whiff and a miss! Strikeout #${testState.soStreak} (-${directDmg} HP directly to Team!)`;
        } else if (roll <= bounds.outEnd) {
          rType = 'OUT';
          rColor = '#9ca3af';
          testState.stats.ab++;
          testState.outs++;
          testState.streak = 0;
          testState.soStreak = 0;

          const outPenalty = isExtra ? 30 : 20;
          if (testState.teamShield > 0) {
            const sDmg = Math.min(testState.teamShield, outPenalty);
            testState.teamShield -= sDmg;
            const overflow = outPenalty - sDmg;
            if (overflow > 0) {
              testState.teamHP = Math.max(0, testState.teamHP - overflow);
              teamHpDmg = overflow;
            }
          } else {
            testState.teamHP = Math.max(0, testState.teamHP - outPenalty);
            teamHpDmg = outPenalty;
          }

          rText = `Solid contact caught on the fly (-${outPenalty} Team Shield damage).`;
        } else {
          // HIT!
          testState.stats.ab++;
          testState.stats.h++;
          testState.streak++;
          testState.soStreak = 0;

          if (roll <= bounds.singleEnd) {
            rType = '1B';
            rColor = '#a7f3d0';
            testState.stats.singles++;
            pitcherDmg = 20;
            rText = `${batter.name} ropes a clean Single into the outfield!`;

            const bSpd = batter.spd || 50;
            if (bSpd >= 60 && Math.random() < 0.28) {
              rType = '2B';
              spdUpgraded = { from: '1B', to: '2B', spd: bSpd };
              pitcherDmg = 35;
              testState.stats.doubles++;
              testState.stats.singles--;
              runsThisTurn = advanceOnHit('2B', batter);
              rText = `⚡ SPEED UPGRADE: ${batter.name} hustles and stretches into a Double!`;
            } else {
              runsThisTurn = advanceOnHit('1B', batter);
              if (bSpd >= 50 && Math.random() < 0.35) {
                didSteal = true;
                testState.stats.sb++;
                if (!testState.bases[1]) {
                  testState.bases[1] = testState.bases[0];
                  testState.bases[0] = null;
                }
                testState.pitcherDebuff = { turnsLeft: 2 };
              }
            }
          } else if (roll <= bounds.doubleEnd) {
            rType = '2B';
            rColor = '#10b981';
            testState.stats.doubles++;
            pitcherDmg = 35;
            rText = `Deep gap smash! ${batter.name} slides in with a Double!`;

            const bSpd = batter.spd || 50;
            if (bSpd >= 75 && Math.random() < 0.22) {
              rType = '3B';
              spdUpgraded = { from: '2B', to: '3B', spd: bSpd };
              pitcherDmg = 50;
              testState.stats.triples++;
              testState.stats.doubles--;
              runsThisTurn = advanceOnHit('3B', batter);
              rText = `🔥 WHEELS! ${batter.name} legs out a thrilling Triple!`;
            } else {
              runsThisTurn = advanceOnHit('2B', batter);
            }
          } else if (roll <= bounds.tripleEnd) {
            rType = '3B';
            rColor = '#06b6d4';
            testState.stats.triples++;
            pitcherDmg = 50;
            runsThisTurn = advanceOnHit('3B', batter);
            rText = `Rocket off the wall! Standing Triple for ${batter.name}!`;
          } else {
            rType = 'HR';
            rColor = '#ffd700';
            testState.stats.hr++;
            pitcherDmg = 75;
            runsThisTurn = advanceOnHit('HR', batter);
            rText = `NO DOUBT ABOUT IT! A towering Home Run by ${batter.name}!`;
          }

          if (runsThisTurn > 0) {
            testState.runs += runsThisTurn;
            testState.stats.rbi += runsThisTurn;
            pitcherDmg += (runsThisTurn * 10);
            rText += ` (${runsThisTurn} run${runsThisTurn > 1 ? 's' : ''} scored!)`;
          }
        }

        if (testState.pitcherDebuff && pitcherDmg > 0) {
          pitcherDmg = Math.round(pitcherDmg * 1.2);
        }

        if (pitcherDmg > 0) {
          testState.stats.dmg = (testState.stats.dmg || 0) + pitcherDmg;
        }

        // Track per-pitcher stats
        const pName = curPitcher.name || 'Pitcher';
        if (!testState.pitcherStats[pName]) {
          testState.pitcherStats[pName] = { name: pName, outs: 0, k: 0, bb: 0, h: 0, hr: 0, er: 0, dmg: 0 };
        }
        const ps = testState.pitcherStats[pName];
        if (rType === 'SO') { ps.k++; ps.outs++; }
        else if (rType === 'OUT') { ps.outs++; }
        else if (rType === 'BB') { ps.bb++; }
        else if (['1B','2B','3B','HR'].includes(rType)) {
          ps.h++;
          if (rType === 'HR') ps.hr++;
        }
        if (runsThisTurn > 0) ps.er += runsThisTurn;
        if (teamHpDmg > 0) ps.dmg += teamHpDmg;

        let isPitcherKO = false;
        if (pitcherDmg > 0) {
          curPitcher.hp -= pitcherDmg;
          if (curPitcher.hp <= 0) {
            curPitcher.hp = 0;
            curPitcher.isKO = true;
            isPitcherKO = true;
            testState.pitchersKO++;
          }
        }

        let didAdvanceInning = false;
        if (testState.outs >= 3) {
          didAdvanceInning = true;
        }

        return {
          roll, rType, rColor, rText, pitcherDmg, teamHpDmg, runsThisTurn,
          didSteal, spdUpgraded, isPitcherKO, didAdvanceInning
        };
      };

      // ── HANDLE DICE ROLL (SEQUENTIAL POPUP QUEUE & NO OVERLAPS) ─────────────
      const handleDiceRoll = () => {
        if (testState.battleOver || testState.isRolling) return;
        testState.isRolling = true;

        const rollBtn = overlay.querySelector('#btn-roll-dice');
        const autoBtn = overlay.querySelector('#btn-match-skip-game');
        if (rollBtn) rollBtn.disabled = true;
        if (autoBtn) autoBtn.disabled = true;

        const curPitcher = testState.pitchers[testState.activePitcherIndex];
        const simCtx = {
          inning: testState.inning,
          bases: testState.bases,
          hasTrait: () => false
        };
        const bounds = (typeof window.calcBoundaries === 'function')
          ? window.calcBoundaries(batter, curPitcher, simCtx)
          : { bbEnd: 11, soEnd: 26, outEnd: 41, singleEnd: 76, doubleEnd: 86, tripleEnd: 87 };

        const outcome = resolveTurn(bounds, curPitcher);

        const tensDigit = Math.floor(outcome.roll / 10) % 10;
        const unitsDigit = outcome.roll % 10;

        const cubeUnits = overlay.querySelector('#die-units-cube');
        const cubeTens  = overlay.querySelector('#die-tens-cube');
        const faceUnits = overlay.querySelector('#die-units-face-front');
        const faceTens  = overlay.querySelector('#die-tens-face-front');
        const resultEl  = overlay.querySelector('#dice-result-display');

        overlay.querySelectorAll('.d100-die-face:not(.face-front)').forEach(f => {
          f.innerText = Math.floor(Math.random() * 10);
        });

        if (faceTens)  faceTens.innerText  = tensDigit;
        if (faceUnits) faceUnits.innerText = unitsDigit;

        if (cubeUnits) {
          cubeUnits.classList.remove('tumbling-units', 'die-settled');
          void cubeUnits.offsetWidth;
          cubeUnits.classList.add('tumbling-units');
        }
        if (cubeTens) {
          cubeTens.classList.remove('tumbling-tens', 'die-settled');
          void cubeTens.offsetWidth;
          cubeTens.classList.add('tumbling-tens');
        }

        if (resultEl) {
          resultEl.innerText = '–';
          resultEl.style.color = '#9ca3af';
        }

        if (window.AudioManager) window.AudioManager.play('menu_click');

        // Units die settles at 550ms
        setTimeout(() => {
          if (cubeUnits) cubeUnits.classList.add('die-settled');
          if (window.AudioManager) window.AudioManager.play('menu_click');
        }, 550);

        // Tens die settles at 850ms, outcome reveals & popups queue
        setTimeout(() => {
          if (cubeTens) cubeTens.classList.add('die-settled');
          if (window.AudioManager) window.AudioManager.play('menu_click');

          if (resultEl) {
            resultEl.innerText = outcome.roll;
            resultEl.style.color = outcome.rColor;
          }

          // Animate Pitcher HP Bar
          const pHPFill = overlay.querySelector('#match-pitcher-hp-fill');
          if (pHPFill) {
            const pct = Math.max(0, (curPitcher.hp / curPitcher.maxHp) * 100);
            pHPFill.style.width = `${pct}%`;
            pHPFill.style.background = pct <= 25
              ? 'linear-gradient(90deg,#ff3333,#ff6666)'
              : pct <= 50
              ? 'linear-gradient(90deg,#ffcc00,#ffeb60)'
              : 'linear-gradient(90deg,#00ff66,#66ffa6)';
          }

          const pHPText = overlay.querySelector('#match-pitcher-hp-text');
          if (pHPText) pHPText.innerText = `${curPitcher.hp}/${curPitcher.maxHp} HP`;

          // Animate Team HP & Shield
          const tHPFill = overlay.querySelector('#team-hp-bar');
          if (tHPFill) tHPFill.style.width = `${Math.max(0, testState.teamHP)}%`;

          const tHPText = overlay.querySelector('#team-hp-text');
          if (tHPText) tHPText.innerText = `${Math.max(0, testState.teamHP)}/100`;

          const tShieldFill = overlay.querySelector('#team-shield-bar');
          if (tShieldFill) tShieldFill.style.width = testState.teamShieldMax > 0 ? `${(testState.teamShield / testState.teamShieldMax) * 100}%` : '0%';

          const tShieldText = overlay.querySelector('#team-shield-text');
          if (tShieldText) tShieldText.innerText = `${testState.teamShield}/${testState.teamShieldMax}`;

          // Diamond Base Lights
          const b1 = overlay.querySelector('#base-1');
          const b2 = overlay.querySelector('#base-2');
          const b3 = overlay.querySelector('#base-3');

          if (b1) {
            b1.setAttribute('fill', testState.bases[0] ? '#00ff66' : 'rgba(255,255,255,0.1)');
            b1.setAttribute('stroke', testState.bases[0] ? '#00ff66' : 'rgba(255,255,255,0.25)');
          }
          if (b2) {
            b2.setAttribute('fill', testState.bases[1] ? '#00ff66' : 'rgba(255,255,255,0.1)');
            b2.setAttribute('stroke', testState.bases[1] ? '#00ff66' : 'rgba(255,255,255,0.25)');
          }
          if (b3) {
            b3.setAttribute('fill', testState.bases[2] ? '#00ff66' : 'rgba(255,255,255,0.1)');
            b3.setAttribute('stroke', testState.bases[2] ? '#00ff66' : 'rgba(255,255,255,0.25)');
          }

          // ── VT323 RETRO COMBAT LOG ──────────────────────────────────────────
          const logContainer = overlay.querySelector('#match-play-log-lines');
          if (logContainer) {
            const line = document.createElement('div');
            const isHit = ['HR','3B','2B','1B'].includes(outcome.rType);
            line.className = 'match-log-line' + (isHit ? ' run-scored bold' : '');
            line.style.cssText = "font-family:'VT323',monospace; font-size:19px; line-height:1.3; margin-bottom:6px; border-bottom:1px dashed rgba(0,255,102,0.15); padding-bottom:4px;";

            if (['HR','3B','2B','1B'].includes(outcome.rType)) {
              line.style.color = '#ffd700';
              line.style.textShadow = '0 0 4px rgba(255,215,0,0.5)';
            } else if (outcome.rType === 'SO') {
              line.style.color = '#ef4444';
              line.style.textShadow = '0 0 4px rgba(239,68,68,0.5)';
            } else if (outcome.rType === 'BB') {
              line.style.color = '#38bdf8';
            } else if (outcome.rType === 'OUT') {
              line.style.color = '#9ca3af';
            } else {
              line.style.color = '#00ff66';
            }

            let logMsg = `[Inn ${testState.inning} vs ${curPitcher.name}] <strong>${outcome.rType}</strong>: ${outcome.rText} (Roll: ${outcome.roll})`;
            if (outcome.pitcherDmg > 0) logMsg += ` • Pitcher -${outcome.pitcherDmg} HP`;
            if (outcome.teamHpDmg > 0) logMsg += ` • Team -${outcome.teamHpDmg} HP`;
            if (outcome.didSteal) logMsg += ` • 🏃 <strong>STOLEN BASE!</strong>`;
            if (outcome.isPitcherKO) logMsg += ` • 💥 <strong>PITCHER K.O.!</strong>`;

            line.innerHTML = logMsg;
            logContainer.appendChild(line);
            logContainer.scrollTop = logContainer.scrollHeight;
          }

          // Live Scoreboard
          const runsDisp = overlay.querySelector('#score-away-r');
          if (runsDisp) runsDisp.innerText = `${testState.runs}`;

          const outsDisp = overlay.querySelector('#score-home-r');
          if (outsDisp) outsDisp.innerText = `${testState.outs}`;

          const koDisp = overlay.querySelector('#score-home-h');
          if (koDisp) koDisp.innerText = `${testState.pitchersKO} / 3`;

          const innDisp = overlay.querySelector('#score-away-h');
          if (innDisp) innDisp.innerText = `${testState.inning} / 3`;

          // Sound effects
          if (window.AudioManager) {
            if (outcome.rType === 'HR') window.AudioManager.play('hr');
            else if (['1B', '2B', '3B'].includes(outcome.rType)) window.AudioManager.play('hit');
            else if (outcome.rType === 'SO') window.AudioManager.play('so');
            else if (outcome.rType === 'BB') window.AudioManager.play('bb');
            else window.AudioManager.play('out');
          }

          // ── STRICT POPUP & KO QUEUE ─────────────────────────────────────────
          const POPUP_GAP = 140;
          let cursor = 0;

          // 1. Play outcome popup
          const playDur = outcome.spdUpgraded ? 1300 : (outcome.rType === 'HR' ? 1200 : (outcome.rType === 'STEAL' ? 850 : 900));
          setTimeout(() => {
            showOutcomePopup(outcome.rType, outcome.rText, playDur, false, outcome.spdUpgraded);
          }, cursor);
          cursor += playDur + POPUP_GAP;

          // 2. Steal popup if stolen base occurred
          if (outcome.didSteal) {
            const stealDur = 850;
            setTimeout(() => {
              showOutcomePopup('STEAL', 'Stolen Base! Pitcher debuffed (+20% damage taken).', stealDur);
            }, cursor);
            cursor += stealDur + POPUP_GAP;
          }

          // 3. Pitcher KO juice if pitcher was eliminated
          if (outcome.isPitcherKO) {
            const nextP = (testState.activePitcherIndex < testState.pitchers.length - 1)
              ? testState.pitchers[testState.activePitcherIndex + 1]
              : null;

            setTimeout(() => {
              if (pHPFill) {
                pHPFill.style.width = '0%';
                pHPFill.style.background = 'linear-gradient(90deg,#ff3333,#ff6666)';
              }
              if (pHPText) pHPText.innerText = '0 HP (K.O.)';

              triggerPitcherKOJuice(curPitcher.name, nextP, () => {
                testState.activePitcherIndex++;
                updatePitcherCardDOM();
                const pSlot = overlay.querySelector('#arena-pitcher-card-slot');
                if (pSlot) dealCardIn(pSlot, { fromX: 70, delay: 0 });
              });
            }, cursor);

            const koTotalDur = nextP ? (1100 + 1100 + 350) : 1200;
            cursor += koTotalDur + POPUP_GAP;
          }

          // ── ON ALL POPUPS FINISHED ─────────────────────────────────────────
          setTimeout(() => {
            if (testState.teamHP <= 0 || testState.pitchersKO >= 3) {
              testState.battleOver = true;
              renderSummary();
              return;
            }

            if (outcome.didAdvanceInning) {
              const endedInning = testState.inning;
              showDefensiveChallenge(endedInning, () => {
                if (testState.battleOver || testState.teamHP <= 0) {
                  renderSummary();
                  return;
                }

                testState.inning++;
                testState.outs = 0;
                testState.bases = [null, null, null];
                testState.pitcherDebuff = null;
                testState.teamShield = Math.min(testState.teamShieldMax, testState.teamShield + 15);

                if (testState.inning >= 4 && !testState.seenExtraInnings) {
                  testState.seenExtraInnings = true;
                  showExtraInningsModal(() => {
                    updatePitcherCardDOM();
                    testState.isRolling = false;
                    if (rollBtn) rollBtn.disabled = false;
                    if (autoBtn) autoBtn.disabled = false;
                  });
                } else {
                  updatePitcherCardDOM();
                  testState.isRolling = false;
                  if (rollBtn) rollBtn.disabled = false;
                  if (autoBtn) autoBtn.disabled = false;
                }
              });
            } else {
              updatePitcherCardDOM();
              testState.isRolling = false;
              if (rollBtn) rollBtn.disabled = false;
              if (autoBtn) autoBtn.disabled = false;
            }
          }, cursor);

        }, 850);
      };

      // ── SCREEN 2: BATTLE ARENA (EXACT COPY OF QUICK PLAY screen-match) ──────
      const renderArena = () => {
        const batterCardHTML = (typeof window.createCardHTML === 'function')
          ? window.createCardHTML(batter, nativePos)
          : `<div class="player-card"><div class="card-name">${batter.name}</div></div>`;

        overlay.innerHTML = `
          <div class="glass-panel" id="screen-match" style="position: relative; max-width: 1060px; width: 95%; margin: 20px auto; padding: 20px 22px;">
            <button id="btn-combat-close" style="position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border-radius: 50%; background: #000; border: 2px solid var(--accent-color); color: var(--accent-color); font-family: 'Press Start 2P', monospace; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 210;">&times;</button>
            
            <h2 id="match-header-title" style="margin-bottom: 16px;"><i class="fa-solid fa-trophy"></i> BATTING PRACTICE • TACTICAL COMBAT</h2>
            
            <div class="match-arena">
              <!-- Left Column: 1v1 Battle Arena -->
              <div style="display: flex; flex-direction: column; gap: 15px; justify-content: center; align-items: center; flex: 1.2;">
                
                <!-- LED Stats Board (Simple 8-bit indicators) -->
                <div class="scoreboard" style="width: 100%; text-align: center; font-family: 'Press Start 2P', monospace; font-size: 10px; padding: 12px; line-height: 1.6;">
                  <div class="scoreboard-text-panel" style="flex: 1; width: 100%;">
                    <div id="scoreboard-inning-text" style="color: var(--accent-color); margin-bottom: 12px;">COMBAT ARENA</div>
                    <div style="display: flex; justify-content: space-around; font-size: 8px; margin-bottom: 8px;">
                      <div><span>RUNS:</span> <span id="score-away-r" style="color: var(--primary-color);">0</span></div>
                      <div><span>OUTS:</span> <span id="score-home-r" style="color: #ef4444;">0</span></div>
                    </div>
                    <div style="display: flex; justify-content: space-around; font-size: 8px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px;">
                      <div><span>INNING:</span> <span id="score-away-h" style="color: var(--accent-color);">1 / 3</span></div>
                      <div><span>RIVAL K.O.:</span> <span id="score-home-h" style="color: #ca8a04;">0 / 3</span></div>
                    </div>
                  </div>
                  <!-- Baseball Diamond Visual Board -->
                  <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px; margin-top: 8px; display: flex; justify-content: center; align-items: center;" id="bases-display-row">
                    <svg viewBox="0 0 100 100" style="width: 50px; height: 50px;">
                      <path d="M 50 15 L 85 50 L 50 85 L 15 50 Z" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="2,2" />
                      <rect id="base-2" x="44" y="9" width="12" height="12" rx="1" transform="rotate(45 50 15)" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
                      <rect id="base-3" x="9" y="44" width="12" height="12" rx="1" transform="rotate(45 15 50)" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
                      <rect id="base-1" x="79" y="44" width="12" height="12" rx="1" transform="rotate(45 85 50)" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
                      <polygon points="50,79 55,84 55,89 45,89 45,84" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
                    </svg>
                  </div>
                </div>

                <!-- 1v1 Fight Cards View -->
                <div class="rpg-fight-deck" style="display: flex; align-items: center; gap: 20px; margin: 15px 0; justify-content: center; width: 100%;">
                  <div class="fight-card-slot" id="arena-batter-card-slot">
                    ${batterCardHTML}
                  </div>

                  <div class="vs-circle" style="font-family: 'Press Start 2P', monospace; font-size: 18px; color: var(--accent-color); text-shadow: 0 0 10px var(--accent-glow); margin-top: 10px;">VS</div>

                  <div class="fight-card-slot" id="arena-pitcher-card-slot"></div>
                </div>

                <!-- Active Battle HP bars and controls -->
                <div class="faceoff-panel" style="width: 100%; display: flex; flex-direction: column; gap: 10px; padding: 12px 16px; margin-top: 5px;">
                  <div style="display: flex; justify-content: space-around; width: 100%; gap: 15px;">
                    <div style="flex: 1;">
                      <div class="faceoff-name" id="match-batter-name" style="font-size: 13px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${batter.name}</div>
                      <div id="match-batter-stats-box" style="font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--primary-color); margin-top: 12px; line-height: 1.6;">
                        CON: ${batter.con || 50} | PWR: ${batter.pwr || 50} | EYE: ${batter.eye || 50}<br>SPD: ${batter.spd || 50} | DEF: ${defStat} (${nativePos})
                      </div>
                    </div>
                    <div style="flex: 1;">
                      <div class="faceoff-name" id="match-pitcher-name" style="font-size: 13px; font-weight: bold; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">-</div>
                      <div class="hp-bar-container" style="height: 12px; background: rgba(0,0,0,0.5); border-radius: 6px; margin-top: 8px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                        <div class="hp-bar-fill" id="match-pitcher-hp-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #ef4444, #f87171); transition: width 0.3s ease;"></div>
                      </div>
                      <div style="font-size: 11px; text-align: left; margin-top: 4px; font-weight: bold; font-family: 'Press Start 2P', monospace; scale: 0.8; transform-origin: left;" id="match-pitcher-hp-text">150/150 HP</div>
                      <div id="match-pitcher-debuff-badge" class="hidden" style="margin-top: 4px; font-size: 8px; font-family: 'Press Start 2P', monospace; color: #38bdf8; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; border-radius: 4px; padding: 3px 6px; text-align: right; box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);">
                        ⚡ DEBUFF: +20% DMG (2t)
                      </div>
                      <div id="match-pitcher-clutch-badge" class="hidden" style="margin-top: 4px; font-size: 8px; font-family: 'Press Start 2P', monospace; border-radius: 4px; padding: 3px 6px; text-align: right; transition: all 0.2s ease;">
                      </div>
                    </div>
                  </div>

                  <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; width: 100%; text-align: center;">
                    <div id="match-pitchers-rotation-queue" style="display: flex; justify-content: center; gap: 8px; font-size: 9px; font-family: 'Press Start 2P', monospace;">
                    </div>
                  </div>
                </div>

              </div>

              <!-- Right Column: Dice Panel & Narrative Log -->
              <div style="display: flex; flex-direction: column; gap: 15px; flex: 1; height: 100%;">
                
                <div id="dice-battle-panel" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:16px; background:rgba(0,0,0,0.45); border:1px solid rgba(255,255,255,0.08); border-radius:12px; width:100%;">
                  <!-- Team vitals -->
                  <div id="team-vitals" style="width:100%;display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <span style="font-size:11px;color:#9ca3af;">❤️ TEAM HP</span>
                      <span id="team-hp-text" style="font-size:11px;font-weight:bold;color:#10b981;">100/100</span>
                    </div>
                    <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                      <div id="team-hp-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#10b981,#34d399);transition:width .3s;"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <span style="font-size:11px;color:#9ca3af;">🛡️ SHIELD (DEF ${defStat})</span>
                      <span id="team-shield-text" style="font-size:11px;font-weight:bold;color:#3b82f6;">${testState.teamShield}/${testState.teamShieldMax}</span>
                    </div>
                    <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                      <div id="team-shield-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa);transition:width .3s;"></div>
                    </div>
                  </div>

                  <!-- d100 dice -->
                  <div id="dice-d100-panel" style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <div id="dice-d100-container" style="display:flex;gap:10px;">
                      <div class="d100-die" id="die-tens">
                        <div class="d100-die-cube" id="die-tens-cube">
                          <div class="d100-die-face face-front" id="die-tens-face-front">0</div>
                          <div class="d100-die-face face-back">0</div>
                          <div class="d100-die-face face-right">0</div>
                          <div class="d100-die-face face-left">0</div>
                          <div class="d100-die-face face-top">0</div>
                          <div class="d100-die-face face-bottom">0</div>
                        </div>
                      </div>
                      <div class="d100-die" id="die-units">
                        <div class="d100-die-cube" id="die-units-cube">
                          <div class="d100-die-face face-front" id="die-units-face-front">0</div>
                          <div class="d100-die-face face-back">0</div>
                          <div class="d100-die-face face-right">0</div>
                          <div class="d100-die-face face-left">0</div>
                          <div class="d100-die-face face-top">0</div>
                          <div class="d100-die-face face-bottom">0</div>
                        </div>
                      </div>
                    </div>
                    <div id="dice-result-display" style="font-family:'Press Start 2P',monospace;font-size:14px;color:#fff;letter-spacing:1px;">–</div>
                  </div>

                  <!-- Lucky zones panel -->
                  <div id="zones-panel-wrap" style="width:100%;">
                    <details id="zones-panel" open>
                      <summary id="zones-panel-header">🎯 Lucky Zones</summary>
                      <div id="zones-lines"></div>
                    </details>
                  </div>

                  <!-- Action bar -->
                  <div id="dice-action-bar" style="width:100%;">
                    <button id="btn-roll-dice" style="
                      font-family:'Press Start 2P',monospace;
                      font-size:13px;padding:14px 32px;
                      background:linear-gradient(135deg,#7c3aed,#4f46e5);
                      color:#fff;border:none;border-radius:10px;
                      cursor:pointer;letter-spacing:1px;
                      box-shadow:0 0 20px rgba(124,58,237,0.5);
                      transition:transform .1s,box-shadow .1s;
                      width:100%;
                    "><i class="fa-solid fa-dice"></i> ROLL DICE</button>

                    <button id="btn-match-skip-game" class="btn" style="
                      font-family:'Press Start 2P',monospace;
                      font-size:10.5px;
                      padding:12px 20px;
                      background:linear-gradient(135deg,#dc2626,#ef4444);
                      color:#fff;
                      border:none;
                      border-radius:10px;
                      cursor:pointer;
                      width:100%;
                      margin-top:10px;
                      letter-spacing:0.5px;
                      box-shadow:0 0 14px rgba(220,38,38,0.4);
                      transition:transform .1s,box-shadow .1s;
                    "><i class="fa-solid fa-forward-step"></i> FAST AUTO-SIMULATE</button>
                  </div>
                </div>

                <!-- Match Log -->
                <div class="match-log" style="height: 200px; max-height: 200px; display: flex; flex-direction: column; flex: none;">
                  <div class="match-log-header">
                    <span>MATCH LOG</span>
                    <i class="fa-solid fa-list-check" style="opacity:0.6;"></i>
                  </div>
                  <div class="match-log-content" id="match-play-log-lines" style="flex: 1; overflow-y: auto; max-height: 200px;">
                    <div class="match-log-line" style="color: #64748b; font-style: italic;">Ready for the first pitch...</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        `;

        const closeBtn = overlay.querySelector('#btn-combat-close');
        if (closeBtn) closeBtn.onclick = () => overlay.remove();

        const rollBtn = overlay.querySelector('#btn-roll-dice');
        if (rollBtn) {
          rollBtn.onclick = () => handleDiceRoll();
        }

        const autoBtn = overlay.querySelector('#btn-match-skip-game');
        if (autoBtn) {
          autoBtn.onclick = () => {
            if (testState.isRolling) return;
            testState.isRolling = true;
            if (rollBtn) rollBtn.disabled = true;
            autoBtn.disabled = true;

            while (!testState.battleOver && testState.pitchersKO < 3 && testState.teamHP > 0) {
              const curP = testState.pitchers[testState.activePitcherIndex];
              if (!curP) break;
              const cBounds = (typeof window.calcBoundaries === 'function')
                ? window.calcBoundaries(batter, curP, { inning: testState.inning, bases: testState.bases, hasTrait: () => false })
                : { bbEnd: 11, soEnd: 26, outEnd: 41, singleEnd: 76, doubleEnd: 86, tripleEnd: 87 };
              
              const res = resolveTurn(cBounds, curP);
              if (res.isPitcherKO && testState.activePitcherIndex < testState.pitchers.length - 1) {
                testState.activePitcherIndex++;
              }
              if (res.didAdvanceInning) {
                testState.inning++;
                testState.outs = 0;
                testState.bases = [null, null, null];
                testState.pitcherDebuff = null;
                testState.teamShield = Math.min(testState.teamShieldMax, testState.teamShield + 15);
              }
            }
            updatePitcherCardDOM();
            renderSummary();
          };
        }

        updatePitcherCardDOM();
      };

      // ── SCREEN 1: PRE-FIGHT SHOWDOWN (EXACT COPY OF QUICK PLAY screen-pre-fight)
      let previewPitcherIdx = 0;

      const renderPreFight = () => {
        const previewPitcher = pitchers[previewPitcherIdx];
        const bCon = batter.con || 50;
        const bPwr = batter.pwr || 50;
        const bEye = batter.eye || 50;
        const bKAvd = batter.k_avd !== undefined ? batter.k_avd : (batter.k_avoid !== undefined ? batter.k_avoid : 50);

        const pH9 = previewPitcher.h9 !== undefined ? previewPitcher.h9 : 50;
        const pHr9 = previewPitcher.hr9 !== undefined ? previewPitcher.hr9 : 50;
        const pBb9 = previewPitcher.bb9 !== undefined ? previewPitcher.bb9 : 50;
        const pK9 = previewPitcher.k9 !== undefined ? previewPitcher.k9 : 50;

        const diffCon = bCon - pH9;
        const diffPwr = bPwr - pHr9;
        const diffEye = bEye - pBb9;
        const diffK   = bKAvd - pK9;

        const formatDiff = (diff) => {
          if (diff > 0) return `<span class="clash-diff-pill diff-positive">+${diff}</span>`;
          if (diff < 0) return `<span class="clash-diff-pill diff-negative">${diff}</span>`;
          return `<span class="clash-diff-pill diff-neutral">0</span>`;
        };

        const netAdvantage = diffCon + diffK + (diffPwr * 0.8) + (diffEye * 0.6);
        let overallText = '🟡 BALANCED MATCHUP';
        let overallClass = 'edge-even';
        let tipText = '⚖️ Close Duel: Dice roll and tactical timing will decide the at-bat.';

        if (netAdvantage >= 16) {
          overallText = '🟢 BATTER ADVANTAGE';
          overallClass = 'edge-hitter';
          tipText = '💡 Green Light: Your batter has tactical advantage to punish the pitcher.';
        } else if (netAdvantage <= -16) {
          overallText = '🔴 PITCHER ADVANTAGE';
          overallClass = 'edge-pitcher';
          tipText = '⚠️ Caution: Pitcher commands the zone. Risk of strikeouts or weak contact.';
        }

        const batterCardHTML = (typeof window.createCardHTML === 'function')
          ? window.createCardHTML(batter, nativePos)
          : `<div class="player-card"><div class="card-name">${batter.name}</div></div>`;

        const pitcherCardHTML = (typeof window.createCardHTML === 'function')
          ? window.createCardHTML(previewPitcher, previewPitcher.role || 'SP')
          : `<div class="player-card"><div class="card-name">${previewPitcher.name}</div></div>`;

        const bullpenRows = pitchers.map((p, idx) => {
          const isSelected = (idx === previewPitcherIdx);
          const pOvr = typeof window.getPlayerOvr === 'function' ? window.getPlayerOvr(p) : (p.ovr || 70);
          const pGrade = (typeof window.getClassGrade === 'function') ? window.getClassGrade(pOvr) : getClassGrade(pOvr);
          const pRole = p.role || (idx === 0 ? 'SP' : 'RP');

          return `
            <div class="pre-fight-row ${isSelected ? 'selected-pitcher-row' : ''}" data-pidx="${idx}" style="cursor: pointer; transition: all 0.15s ease;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 9px; font-weight: bold; color: #ef4444; background: rgba(239,68,68,0.15); padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(239,68,68,0.3);">${pRole}</span>
                <span class="name" style="color:#fff; font-size: 8.5px;">${p.name}</span>
                <span style="font-size: 8px; font-weight: bold; color: ${pGrade.color}; background: rgba(0,0,0,0.4); border: 1px solid ${pGrade.color}; padding: 1px 4px; border-radius: 4px; font-family:'Press Start 2P',monospace;">${pOvr} ${pGrade.text}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="hp-bar-container">
                  <div class="hp-bar-fill" style="width: 100%; background: linear-gradient(90deg, #ef4444, #f87171);"></div>
                </div>
                <span class="hp-text">${p.hp}/${p.maxHp} HP</span>
              </div>
            </div>
          `;
        }).join('');

        overlay.innerHTML = `
          <div class="glass-panel" id="screen-pre-fight" style="position: relative; max-width: 980px; width: 95%; margin: 25px auto; padding: 22px 24px;">
            <button id="btn-prefight-close" style="position: absolute; top: 14px; right: 16px; background: none; border: none; color: #9ca3af; font-size: 22px; cursor: pointer; line-height: 1; z-index: 10;">&times;</button>
            
            <!-- Top Showdown Header -->
            <div class="pre-fight-header">
              <div class="pre-fight-stage-badge">⚔️ BATTER PRACTICE • PRE-FIGHT SHOWDOWN</div>
              <div id="pre-fight-scouting">
                <div style="font-size: 11px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Analyze the starting pitcher and rival rotation before stepping into the batter's box.
                </div>
              </div>
            </div>

            <!-- Main Faceoff Arena -->
            <div class="pre-fight-showdown">
              
              <!-- Left: Your Batter Selector & Card -->
              <div class="showdown-side showdown-side-player">
                <div class="showdown-nav-bar">
                  <span id="showdown-batter-label" class="showdown-nav-label">#1 ${nativePos} ${batter.name}</span>
                </div>
                <div id="showdown-batter-card-wrap" class="showdown-card-slot">
                  ${batterCardHTML}
                </div>
              </div>

              <!-- Center: The VS Clash, Matchup Insights & Battle Button -->
              <div class="showdown-center">
                <div class="showdown-vs-badge">VS</div>
                <div class="showdown-stakes-pill">3 INNINGS • DUEL</div>

                <!-- Dynamic Matchup Advantage Tactical Insights -->
                <div id="showdown-matchup-insights" class="showdown-insights-panel">
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
                    <div class="clash-row" title="Batter Eye/Plate Discipline vs Pitcher BB/9">
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
                  </div>

                  <div class="matchup-quick-tip">${tipText}</div>
                </div>

                <button class="btn btn-pre-fight-battle" id="btn-pre-fight-start">
                  <i class="fa-solid fa-fire-flame-curved"></i> TO COMBAT!
                </button>
                <button class="btn btn-secondary btn-pre-fight-back" id="btn-pre-fight-back-map">
                  ✕ Return to Dex
                </button>
              </div>

              <!-- Right: Rival Pitcher Selector & Card -->
              <div class="showdown-side showdown-side-enemy">
                <div class="showdown-nav-bar nav-enemy">
                  <button class="btn btn-showdown-nav" id="btn-prev-pitcher" title="Previous Pitcher">◀</button>
                  <span id="showdown-pitcher-label" class="showdown-nav-label">${previewPitcher.role || 'SP'} ${previewPitcher.name}</span>
                  <button class="btn btn-showdown-nav" id="btn-next-pitcher" title="Next Pitcher">▶</button>
                </div>
                <div id="showdown-pitcher-card-wrap" class="showdown-card-slot">
                  ${pitcherCardHTML}
                </div>
              </div>

            </div>

            <!-- Bullpen Relievers Section (Below Showdown) -->
            <div class="pre-fight-bullpen-section">
              <div class="pre-fight-bullpen-title">
                <i class="fa-solid fa-users"></i> <span>RIVAL ROTATION & BULLPEN</span>
              </div>
              <div id="pre-fight-enemy-rotation" class="pre-fight-bullpen-list">
                ${bullpenRows}
              </div>
            </div>

          </div>
        `;

        // Pre-fight event handlers
        const btnClose = overlay.querySelector('#btn-prefight-close');
        if (btnClose) btnClose.onclick = () => overlay.remove();

        const btnBackMap = overlay.querySelector('#btn-pre-fight-back-map');
        if (btnBackMap) btnBackMap.onclick = () => overlay.remove();

        const btnStart = overlay.querySelector('#btn-pre-fight-start');
        if (btnStart) {
          btnStart.onclick = () => {
            if (window.AudioManager) window.AudioManager.play('play_ball');
            renderArena();
          };
        }

        const btnPrevP = overlay.querySelector('#btn-prev-pitcher');
        if (btnPrevP) {
          btnPrevP.onclick = () => {
            previewPitcherIdx = (previewPitcherIdx - 1 + pitchers.length) % pitchers.length;
            renderPreFight();
          };
        }

        const btnNextP = overlay.querySelector('#btn-next-pitcher');
        if (btnNextP) {
          btnNextP.onclick = () => {
            previewPitcherIdx = (previewPitcherIdx + 1) % pitchers.length;
            renderPreFight();
          };
        }

        overlay.querySelectorAll('.pre-fight-row').forEach(row => {
          row.onclick = () => {
            const idx = parseInt(row.dataset.pidx, 10);
            if (!isNaN(idx)) {
              previewPitcherIdx = idx;
              renderPreFight();
            }
          };
        });
      };

      // Start by displaying the Pre-Fight Showdown
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
