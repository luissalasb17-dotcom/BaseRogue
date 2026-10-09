// challenge162.js — "162-0 Challenge" game mode.
// Build a fixed roster from players/pitchers you've already unlocked by winning
// a Quick Play or Story Mode run, then simulate a 162-game regular season against
// real MLB franchises with a fast abstract engine tuned toward realistic league
// stat rates (see simPaOutcome) rather than the arcade dice-battle math used
// elsewhere in the game. A perfect 162-0 unlocks 3 playoff rounds played on the
// real dice battle screen (which does use the arcade engine, unchanged).
(function() {
  const SLOTS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  const BATTING_ORDER = ['CF', 'LF', 'RF', '1B', '2B', '3B', 'SS', 'C', 'DH'];
  const SEASON_LENGTH = 162;
  // Playoff Qualification: 100 wins is the iconic MLB century mark for powerhouse teams.
  // Reach 100+ wins in 162 games to advance to the 3-round postseason gauntlet.
  const PLAYOFF_MIN_WINS = 100;
  const UNLOCKS_KEY = 'baserogue_challenge_unlocks_v1';
  const SAVE_KEY = 'baserogue_162challenge_v1';

  const PLAYOFF_ROUNDS = [
    { key: 'division', label: 'SERIE DIVISIONAL', round: 1, difficulty: 'Dificultad: Experto', desc: 'Ronda 1: Enfrenta al 3er mejor equipo', statBoost: 2, hpMult: 1.05, rarities: ['Rare', 'Epic'] },
    { key: 'championship', label: 'SERIE DE CAMPEONATO', round: 2, difficulty: 'Dificultad: Leyenda', desc: 'Ronda 2: Enfrenta al 2do mejor equipo', statBoost: 4, hpMult: 1.12, rarities: ['Epic', 'Legendary'] },
    { key: 'world', label: '🏆 SERIE MUNDIAL [JEFE FINAL]', round: 3, difficulty: 'DIFICULTAD: PESADILLA', desc: 'Jefe Final: El #1 invicto de la liga', statBoost: 6, hpMult: 1.20, rarities: ['Legendary'] }
  ];

  const RECORDS_KEY = 'baserogue_162challenge_records_v1';

  const RARITY_COLORS = {
    Legendary: '#ffd700',
    Epic: '#a855f7',
    Rare: '#3b82f6',
    Uncommon: '#10b981',
    Common: '#6b7280'
  };

  // Attribute Grade Color coding matching BaseballDex
  const GRADE_COLORS = {
    'S': '#ffd700',
    'A': '#22d3ee',
    'B': '#4ade80',
    'C': '#94a3b8',
    'D': '#f97316',
    'F': '#ef4444'
  };

  function getGrade(val) {
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
  }

  function getGradeColor(val) {
    const letter = getGrade(val).charAt(0);
    return GRADE_COLORS[letter] || GRADE_COLORS.F;
  }

  const MLB_FRANCHISES = [
    { code: 'NYY', name: 'New York Yankees', city: 'New York', color: '#132448', accent: '#c4ced4', icon: '🗽' },
    { code: 'BOS', name: 'Boston Red Sox', city: 'Boston', color: '#bd3039', accent: '#0c2340', icon: '🧦' },
    { code: 'LAD', name: 'Los Angeles Dodgers', city: 'Los Angeles', color: '#005a9c', accent: '#ef3e42', icon: '🌴' },
    { code: 'SFG', name: 'San Francisco Giants', city: 'San Francisco', color: '#fd5a1e', accent: '#27251f', icon: '🌉' },
    { code: 'STL', name: 'St. Louis Cardinals', city: 'St. Louis', color: '#c41e3a', accent: '#fedb00', icon: '🐦' },
    { code: 'CHC', name: 'Chicago Cubs', city: 'Chicago', color: '#0e3386', accent: '#cc3433', icon: '🐻' },
    { code: 'ATL', name: 'Atlanta Braves', city: 'Atlanta', color: '#ce1141', accent: '#13274f', icon: '🪓' },
    { code: 'CIN', name: 'Cincinnati Reds', city: 'Cincinnati', color: '#c6011f', accent: '#000000', icon: '🔴' },
    { code: 'DET', name: 'Detroit Tigers', city: 'Detroit', color: '#0c2340', accent: '#fa4616', icon: '🐅' },
    { code: 'PHI', name: 'Philadelphia Phillies', city: 'Philadelphia', color: '#e81828', accent: '#002d72', icon: '🔔' },
    { code: 'PIT', name: 'Pittsburgh Pirates', city: 'Pittsburgh', color: '#fdb827', accent: '#000000', icon: '🏴‍☠️' },
    { code: 'OAK', name: 'Oakland Athletics', city: 'Oakland', color: '#003831', accent: '#efb21e', icon: '🐘' },
    { code: 'CHW', name: 'Chicago White Sox', city: 'Chicago', color: '#27251f', accent: '#c4ced4', icon: '⚪' },
    { code: 'CLE', name: 'Cleveland Guardians', city: 'Cleveland', color: '#e31937', accent: '#0c2340', icon: '🛡️' },
    { code: 'BAL', name: 'Baltimore Orioles', city: 'Baltimore', color: '#df4601', accent: '#000000', icon: '🐤' },
    { code: 'MIN', name: 'Minnesota Twins', city: 'Minnesota', color: '#002b5c', accent: '#d31145', icon: '👬' },
    { code: 'HOU', name: 'Houston Astros', city: 'Houston', color: '#002d62', accent: '#eb6e1f', icon: '🚀' },
    { code: 'NYM', name: 'New York Mets', city: 'New York', color: '#002d72', accent: '#ff5910', icon: '🍎' },
    { code: 'TOR', name: 'Toronto Blue Jays', city: 'Toronto', color: '#134a8e', accent: '#e8291c', icon: '🍁' },
    { code: 'KCR', name: 'Kansas City Royals', city: 'Kansas City', color: '#004687', accent: '#bd9b60', icon: '👑' },
    { code: 'SDP', name: 'San Diego Padres', city: 'San Diego', color: '#2f241d', accent: '#ffc425', icon: '⛪' },
    { code: 'MIL', name: 'Milwaukee Brewers', city: 'Milwaukee', color: '#12284b', accent: '#ffc52f', icon: '🍺' },
    { code: 'LAA', name: 'Los Angeles Angels', city: 'Anaheim', color: '#ba0021', accent: '#003263', icon: '👼' },
    { code: 'SEA', name: 'Seattle Mariners', city: 'Seattle', color: '#0c2c56', accent: '#005c5c', icon: '⚓' },
    { code: 'TEX', name: 'Texas Rangers', city: 'Texas', color: '#003278', accent: '#c0111f', icon: '🤠' },
    { code: 'WSH', name: 'Washington Nationals', city: 'Washington', color: '#ab0003', accent: '#14225a', icon: '🏛️' },
    { code: 'COL', name: 'Colorado Rockies', city: 'Colorado', color: '#33006f', accent: '#c4ced4', icon: '🏔️' },
    { code: 'MIA', name: 'Miami Marlins', city: 'Miami', color: '#00a3e0', accent: '#ef3340', icon: '🐬' },
    { code: 'ARI', name: 'Arizona Diamondbacks', city: 'Arizona', color: '#a71930', accent: '#e3d4ad', icon: '🐍' },
    { code: 'TB', name: 'Tampa Bay Rays', city: 'Tampa Bay', color: '#092c5c', accent: '#8fbce6', icon: '☀️' },
    { code: 'NLB', name: 'Negro Leagues All-Stars', city: 'Negro Leagues', color: '#854d0e', accent: '#fef08a', icon: '⭐' }
  ];

  const BASEBALL_ERAS = [
    { key: 'The Genesis Era (1871-1900)', label: 'The Genesis Era', years: '1871 - 1900', years_es: '1871 - 1900', years_en: '1871 - 1900', desc_es: 'Los pioneros del béisbol profesional en el siglo XIX.', desc_en: 'The 19th-century pioneers of professional baseball.', icon: '📜', color: '#a16207' },
    { key: 'Deadball (1901-1919)', label: 'Deadball Era', years: '1901 - 1919', years_es: '1901 - 1919', years_en: '1901 - 1919', desc_es: 'Dominio absoluto del pitcheo, toques y juego táctico.', desc_en: 'Complete pitching dominance, small ball, and tactical bunting.', icon: '⚾', color: '#64748b' },
    { key: 'Golden Era (1920-1941)', label: 'Golden Era', years: '1920 - 1941', years_es: '1920 - 1941', years_en: '1920 - 1941', desc_es: 'La época de oro de Babe Ruth, Lou Gehrig y jonrones de leyenda.', desc_en: 'The golden age of Babe Ruth, Lou Gehrig, and legendary home runs.', icon: '👑', color: '#d97706' },
    { key: 'Integration (1942-1960)', label: 'Integration Era', years: '1942 - 1960', years_es: '1942 - 1960', years_en: '1942 - 1960', desc_es: 'Jackie Robinson rompe la barrera racial; dinastías históricas.', desc_en: 'Jackie Robinson breaks the color barrier; historic dynasties.', icon: '🤝', color: '#2563eb' },
    { key: 'Expansion (1961-1976)', label: 'Expansion Era', years: '1961 - 1976', years_es: '1961 - 1976', years_en: '1961 - 1976', desc_es: 'Nuevas franquicias y la era del montículo y los lanzadores.', desc_en: 'New franchises and the dominant era of the pitching mound.', icon: '🏟️', color: '#059669' },
    { key: 'Big Hair Era (1977-1993)', label: 'Big Hair Era', years: '1977 - 1993', years_es: '1977 - 1993', years_en: '1977 - 1993', desc_es: 'Años 80, velocidad supersónica, turf artificial y cerradores míticos.', desc_en: '80s baseball, supersonic speed, artificial turf, and elite closers.', icon: '🎸', color: '#dc2626' },
    { key: 'Steroid Era (1994-2005)', label: 'Steroid Era', years: '1994 - 2005', years_es: '1994 - 2005', years_en: '1994 - 2005', desc_es: 'La era de los jonrones titánicos y los récords ofensivos imposibles.', desc_en: 'Colossal home runs and historic offensive slugging records.', icon: '💉', color: '#7c3aed' },
    { key: 'Efficiency Era (2006-2015)', label: 'Efficiency Era', years: '2006 - 2015', years_es: '2006 - 2015', years_en: '2006 - 2015', desc_es: 'La revolución analítica, Moneyball y relevistas de precisión.', desc_en: 'The analytics revolution, Moneyball, and bullpen specialization.', icon: '💻', color: '#0891b2' },
    { key: 'Modern Era (2016-Pres)', label: 'Modern Era', years: '2016 - Present', years_es: '2016 - Presente', years_en: '2016 - Present', desc_es: 'Velocidad élite, rotaciones modernas y superestrellas globales.', desc_en: 'Elite velocity, modern rotations, and global superstars.', icon: '🚀', color: '#10b981' }
  ];

  function getEraDescription(era) {
    if (!era) return '';
    const isEn = (window.i18next && window.i18next.language && window.i18next.language.startsWith('en')) || (document.documentElement && document.documentElement.lang === 'en');
    return isEn ? (era.desc_en || era.desc_es || '') : (era.desc_es || era.desc_en || '');
  }
  function getEraYears(era) {
    if (!era) return '';
    const isEn = (window.i18next && window.i18next.language && window.i18next.language.startsWith('en')) || (document.documentElement && document.documentElement.lang === 'en');
    return isEn ? (era.years_en || era.years) : (era.years_es || era.years);
  }


  function getBatterPool() {
    return (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) || window.LAHMAN_POOL || [];
  }
  function getPitcherPool() {
    return (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) || window.PITCHERS_POOL || [];
  }
  function cleanName(p) {
    if (!p) return '';
    return (p.cleanName || p.name || '').replace(/\s*\(\d{4}\)/g, '').trim();
  }
  function batterUnlockKey(p) {
    if (!p) return '';
    return `${p.playerID || p.name || 'player'}_${p.year || ''}`;
  }
  function pitcherUnlockKey(p) {
    if (!p) return '';
    return `${cleanName(p)}_${p.year || p.peak_year_display || p.peak_year || ''}`;
  }

  // ── Sabermetric WAR Calculations (Shared across Season & Results) ────────
  function calcBatterDWAR(s, pos = 'DH', defVal = 50) {
    if (!s) return '0.0';
    const ab = s.ab || 0;
    const bb = s.bb || 0;
    const pa = ab + bb;
    if (pa <= 0) return '0.0';
    const posAdjTable = { C: 9.0, SS: 7.0, '2B': 3.0, '3B': 2.0, CF: 2.5, LF: -7.0, RF: -7.0, '1B': -12.0, DH: -15.0 };
    const posAdj = (posAdjTable[(pos || 'DH').toUpperCase()] || 0.0) * (pa / 600.0);
    const defRuns = (defVal - 50) * 0.16 * (pa / 600.0);
    const dwar = (posAdj + defRuns) / 10.0;
    return dwar >= 0 ? `+${dwar.toFixed(1)}` : dwar.toFixed(1);
  }

  function calcBatterWAR(s, pos = 'DH', defVal = 50) {
    if (!s) return '0.0';
    const ab = s.ab || 0;
    const h = s.h || 0;
    const d = s.doubles || 0;
    const t = s.triples || 0;
    const hr = s.hr || 0;
    const bb = s.bb || 0;
    const sb = s.sb || 0;
    const singles = Math.max(0, h - (d + t + hr));
    const outs = Math.max(0, ab - h);
    const pa = ab + bb;
    if (pa <= 0) return '0.0';

    // Linear weights wRAA (Wins Above Average runs)
    const wraa = (bb * 0.32) + (singles * 0.46) + (d * 0.78) + (t * 1.05) + (hr * 1.40) + (sb * 0.20) - (outs * 0.27);

    // Positional adjustment per 600 PA (runs)
    const posAdjTable = { C: 9.0, SS: 7.0, '2B': 3.0, '3B': 2.0, CF: 2.5, LF: -7.0, RF: -7.0, '1B': -12.0, DH: -15.0 };
    const posAdj = (posAdjTable[(pos || 'DH').toUpperCase()] || 0.0) * (pa / 600.0);

    // Fielding value from DEF rating
    const defRuns = (defVal - 50) * 0.16 * (pa / 600.0);

    // Replacement level baseline (20 runs per 600 PA)
    const repRuns = 20.0 * (pa / 600.0);

    const war = (wraa + posAdj + defRuns + repRuns) / 10.0;
    return war.toFixed(1);
  }

  function calcPitcherWAR(s, role = 'SP') {
    if (!s) return '0.0';
    const outs = s.outs || 0;
    const ip = outs / 3.0;
    if (ip <= 0) return '0.0';
    const er = s.er || 0;
    const bb = s.bb || 0;
    const k = s.so || 0;
    const sv = s.sv || 0;

    // Replacement level = 1.25 x the league ERA (~4.0 after the 1947-2025 calibration).
    // It used to be 4.80 with a floor at 0: an average starter was worth ~0.5 and anyone a bit
    // worse showed 0.0 no matter how bad.
    const repRuns = ip * (5.00 / 9.0);
    const actualRA = er * 1.05;
    const kBbAdj = (k * 0.020) - (bb * 0.010);
    const isSP = (role || 'SP').toUpperCase() === 'SP';
    const svLeverage = !isSP ? (sv * 0.45) : 0.0;

    const war = (repRuns - actualRA + kBbAdj + svLeverage) / 10.0;
    return war.toFixed(1);
  }

  function buildEnemyPitcherObj(p, role) {
    const staVal = p.sta !== undefined ? p.sta : 50;
    const hp = Math.max(75, Math.min(200, Math.round(75 + (staVal - 1) * (125 / 124))));
    const yearVal = p.year || p.peak_year_display || p.peak_year || 1990;
    const cName = cleanName(p);
    return {
      name: cName, cleanName: cName, role, pos: role, playerID: p.playerID,
      hp, maxHp: hp, ovr: p.ovr || 50, rarity: p.rarity || 'Common', era: p.era || '', team: p.team || '', year: yearVal,
      h9: p.h9 !== undefined ? p.h9 : 50, k9: p.k9 !== undefined ? p.k9 : 50,
      bb9: p.bb9 !== undefined ? p.bb9 : 50, hr9: p.hr9 !== undefined ? p.hr9 : 50,
      sta: staVal, stf: p.stf !== undefined ? p.stf : 50, ctl: p.ctl !== undefined ? p.ctl : 50, mov: p.hr9 !== undefined ? p.hr9 : 50,
      upgrades: { con: 0, pwr: 0, eye: 0, spd: 0, def: 0, sta: 0 }
    };
  }

  // ── Real franchise opponents (regular season) — a "team-decade" roster per MLB
  // team code (e.g. "1990s New York Yankees"), built from the same pool the player
  // drafts from but scoped to one decade at a time — much closer to a real team's
  // actual power level than an all-time roster cherry-picked across a century,
  // which made every opponent absurdly stacked. Falls back to the team's full
  // history, then the global pool, only when a decade's own roster can't fill
  // a slot (e.g. an expansion team with no 1950s cards). ──────────────────────
  const _teamDecadeCache = new Map();

  function decadeOf(year) { return Math.floor((year || 2000) / 10) * 10; }

  function getFranchiseCodes() {
    const franchiseNames = (window.PlayersDB && window.PlayersDB.FranchiseNames) || {};
    return Object.keys(franchiseNames).filter(c => c !== 'NLB');
  }

  // Weighted by total cards available that decade (batters + pitchers), not just
  // batters — a decade with plenty of hitters but zero pitchers still isn't a
  // great pick, so this keeps the roll from favoring lopsided decades.
  function pickWeightedDecade(code) {
    const counts = {};
    getBatterPool().filter(p => p.team === code).forEach(p => {
      const d = decadeOf(p.year);
      counts[d] = (counts[d] || 0) + 1;
    });
    getPitcherPool().filter(p => p.team === code).forEach(p => {
      const d = decadeOf(p.year);
      counts[d] = (counts[d] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (!entries.length) return 2000;
    const total = entries.reduce((s, [, c]) => s + c, 0);
    let roll = Math.random() * total;
    for (const [d, c] of entries) {
      if (roll < c) return parseInt(d, 10);
      roll -= c;
    }
    return parseInt(entries[0][0], 10);
  }

  // Expanding-window fill: start at the exact target decade, then widen the
  // window ±10y, ±20y... around it before ever leaving the team's own history,
  // and only fall back to the global pool by position as an absolute last
  // resort. This squeezes the most "authentic to that team-era" roster the
  // pool can actually support instead of jumping straight to all-time or a
  // random team the moment one slot comes up short.
  const WINDOW_RADII = [0, 10, 20, 30, 40, 50, 60, Infinity];

  // A player is eligible to represent a franchise-decade if the *real* Lahman
  // record (PlayerTeamHistory, built from Batting.csv/Pitching.csv — every
  // team-decade they actually logged >=20 games for, not just the one team
  // their single card happens to display) has a decade within range. Falls
  // back to the card's own team/year when the player isn't in that table
  // (pre-modern-franchise cards, or the rare unmatched pitcher).
  function isEligibleForTeamDecade(p, historyMap, code, decade, radius) {
    const realDecades = historyMap[p.playerID] && historyMap[p.playerID][code];
    if (realDecades) {
      return radius === Infinity || realDecades.some(d => Math.abs(d - decade) <= radius);
    }
    if (p.team !== code) return false;
    return radius === Infinity || Math.abs(decadeOf(p.year) - decade) <= radius;
  }

  // Real teams don't always field their single best-ever player at every spot
  // in a given decade — picking strictly the top OVR candidate made every
  // opponent an implausible "dream roster" version of itself, which is also
  // what made the challenge nearly unwinnable at any real length. Weighted pick
  // among the top candidates instead: usually strong, sometimes a real weak
  // link, same as an actual roster would have. Doesn't touch the PA-outcome
  // formula at all, so individual stat lines stay exactly as calibrated.
  const OPPONENT_PICK_WEIGHTS = [0.18, 0.16, 0.15, 0.14, 0.13, 0.12, 0.12];
  // The Negro Leagues All-Stars draw from every Negro League team of a decade, not from one
  // franchise, so taking the best available at every spot built a super team (106 projected
  // wins on average, first in the whole league half the time). For them each pick comes from
  // a little deeper in the list: about 88 projected wins, a contender and no longer a lock.
  const NLB_PICK_RANGE = [0.05, 0.35];
  let _deepPick = false;
  function withTeamDepth(code, fn) {
    const prev = _deepPick;
    _deepPick = code === 'NLB';
    try { return fn(); } finally { _deepPick = prev; }
  }
  function weightedTopPick(sortedCandidates) {
    if (_deepPick && sortedCandidates.length >= 6) {
      const lo = Math.floor(sortedCandidates.length * NLB_PICK_RANGE[0]);
      const hi = Math.max(lo + 1, Math.floor(sortedCandidates.length * NLB_PICK_RANGE[1]));
      return sortedCandidates[lo + Math.floor(Math.random() * (hi - lo))];
    }
    const n = Math.min(sortedCandidates.length, OPPONENT_PICK_WEIGHTS.length);
    const total = OPPONENT_PICK_WEIGHTS.slice(0, n).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < n; i++) {
      if (roll < OPPONENT_PICK_WEIGHTS[i]) return sortedCandidates[i];
      roll -= OPPONENT_PICK_WEIGHTS[i];
    }
    return sortedCandidates[0];
  }

  // ── Authentic Sabermetric Batting Order Optimizer ───────────────────────
  // Arranges 9 batters according to realistic MLB lineup construction:
  // 1: Leadoff (High OBP + Speed/Stolen base threat)
  // 2: Modern Sabermetric Ace (Best overall hitter / High OBP + High Contact)
  // 3: Prime Slugger (High Contact + Power, e.g. Griffey, Ruth, Mays)
  // 4: Cleanup Monster (Purest Power & Slugging, e.g. Aaron, Gehrig, Pujols)
  // 5: Secondary Run Producer (Strong Power/SLG)
  // 6: Middle-order Bat
  // 7: Lower-mid Order Bat
  // 8: Bottom-order Bat
  // 9: Second Leadoff (Speed/OBP to loop back to the top of the order)
  function optimizeLineupArray(battersArray) {
    if (!Array.isArray(battersArray) || battersArray.length < 9) return battersArray;

    const candidates = battersArray.map(p => {
      const con = p.con !== undefined ? p.con : 50;
      const eye = p.eye !== undefined ? p.eye : 50;
      const pwr = p.pwr !== undefined ? p.pwr : 50;
      const spd = p.spd !== undefined ? p.spd : 50;
      const ovr = p.ovr !== undefined ? p.ovr : 50;

      const obpScore = (con * 0.45) + (eye * 0.40) + (spd * 0.15);
      const slgScore = (pwr * 0.70) + (con * 0.30);
      const opsScore = (pwr * 0.50) + (con * 0.30) + (eye * 0.20);
      const speedScore = (spd * 0.65) + (con * 0.20) + (eye * 0.15);
      const allAroundSlugger = (con * 0.45) + (pwr * 0.45) + (eye * 0.10);
      const leadoffScore = (obpScore * 0.55) + (speedScore * 0.45);

      return { p, con, eye, pwr, spd, ovr, obpScore, slgScore, opsScore, speedScore, allAroundSlugger, leadoffScore };
    });

    let remaining = candidates.slice();
    const order = [];

    // 1. #4 Cleanup Hitter: Purest Power & Slugging Monster
    remaining.sort((a, b) => (b.slgScore * 0.75 + b.pwr * 0.25) - (a.slgScore * 0.75 + a.pwr * 0.25));
    const cleanUp = remaining.shift();

    // 2. #3 Prime All-Around Hitter: High Contact + High Power (e.g. Griffey, Ruth, Mays)
    remaining.sort((a, b) => b.allAroundSlugger - a.allAroundSlugger);
    const thirdHitter = remaining.shift();

    // 3. #2 Modern Sabermetric Ace: Best overall OPS remaining (e.g. Trout, Judge, Morgan, Bonds)
    remaining.sort((a, b) => (b.opsScore * 0.70 + b.obpScore * 0.30) - (a.opsScore * 0.70 + a.obpScore * 0.30));
    const secondHitter = remaining.shift();

    // 4. #1 Leadoff: High OBP + Great Speed (e.g. Pete Rose, Rickey Henderson, Tim Raines)
    remaining.sort((a, b) => b.leadoffScore - a.leadoffScore);
    const leadoffHitter = remaining.shift();

    // 5. #5 Secondary Slugger / Run Producer
    remaining.sort((a, b) => (b.slgScore * 0.65 + b.opsScore * 0.35) - (a.slgScore * 0.65 + a.opsScore * 0.35));
    const fifthHitter = remaining.shift();

    // 6. #6 Middle Order Bat
    remaining.sort((a, b) => b.opsScore - a.opsScore);
    const sixthHitter = remaining.shift();

    // 7. #7 Lower-Mid Order Bat
    remaining.sort((a, b) => b.opsScore - a.opsScore);
    const seventhHitter = remaining.shift();

    // 8. #9 Second Leadoff / Speed connector (pick faster/higher OBP of last 2)
    remaining.sort((a, b) => b.leadoffScore - a.leadoffScore);
    const ninthHitter = remaining.shift();

    // 9. #8 Bottom of order
    const eighthHitter = remaining.shift();

    order[0] = leadoffHitter.p;
    order[1] = secondHitter.p;
    order[2] = thirdHitter.p;
    order[3] = cleanUp.p;
    order[4] = fifthHitter.p;
    order[5] = sixthHitter.p;
    order[6] = seventhHitter.p;
    order[7] = eighthHitter.p;
    order[8] = ninthHitter.p;

    return order;
  }

  // A real person's identity across both pools (a two-way player is one person).
  function personId(p) {
    return (p && (p.playerID || cleanName(p))) || '';
  }

  // `taken` (optional): people already on another roster of the same league. Picks skip
  // them and are added to it, so no player shows up on two teams.
  function buildFranchiseDecadeTeam(code, decade, taken) {
    const franchiseNames = (window.PlayersDB && window.PlayersDB.FranchiseNames) || {};
    const batterHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.batters) || {};
    const pitcherHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};
    const fullBatterPool = getBatterPool();
    const fullPitcherPool = getPitcherPool();
    const usedIDs = taken || new Set();

    const eligibleBatters = radius => fullBatterPool.filter(p => isEligibleForTeamDecade(p, batterHistory, code, decade, radius));
    const eligiblePitchers = radius => fullPitcherPool.filter(p => isEligibleForTeamDecade(p, pitcherHistory, code, decade, radius));

    const rawLineup = SLOTS.map(slot => {
      // 1. For DH: pick the best available batter from the franchise-decade who hasn't been placed in a field slot
      if (slot === 'DH') {
        for (const radius of WINDOW_RADII) {
          const bucket = eligibleBatters(radius).filter(p => !usedIDs.has(p.playerID));
          if (bucket.length) {
            const sorted = bucket.slice().sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
            const pick = weightedTopPick(sorted);
            usedIDs.add(pick.playerID);
            return { ...pick, assignedSlot: 'DH' };
          }
        }
        const globalCandidates = fullBatterPool.filter(p => !usedIDs.has(p.playerID))
          .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        const pick = globalCandidates.length ? weightedTopPick(globalCandidates) : null;
        if (pick) {
          usedIDs.add(pick.playerID);
          return { ...pick, assignedSlot: 'DH' };
        }
        return null;
      }

      // 2. For fielding slots (C, 1B, 2B, 3B, SS, LF, CF, RF):
      // Priority A: Primary Position match within team-decade radius
      for (const radius of WINDOW_RADII) {
        const bucket = eligibleBatters(radius);
        let primaryCandidates = bucket.filter(p => !usedIDs.has(p.playerID) && p.pos === slot);
        if (primaryCandidates.length) {
          primaryCandidates = primaryCandidates.slice().sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
          const pick = weightedTopPick(primaryCandidates);
          usedIDs.add(pick.playerID);
          return { ...pick, assignedSlot: slot };
        }
      }

      // Priority B: Secondary Position match (p.sec_pos) within team-decade radius
      for (const radius of WINDOW_RADII) {
        const bucket = eligibleBatters(radius);
        let secCandidates = bucket.filter(p => !usedIDs.has(p.playerID) &&
          (p.sec_pos || '').split(',').map(s => s.trim()).includes(slot));
        if (secCandidates.length) {
          secCandidates = secCandidates.slice().sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
          const pick = weightedTopPick(secCandidates);
          usedIDs.add(pick.playerID);
          return { ...pick, assignedSlot: slot };
        }
      }

      // Priority C: Global pool by Primary Position, then Secondary Position
      const globalPrimary = fullBatterPool.filter(p => !usedIDs.has(p.playerID) && p.pos === slot)
        .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      if (globalPrimary.length) {
        const pick = weightedTopPick(globalPrimary);
        usedIDs.add(pick.playerID);
        return { ...pick, assignedSlot: slot };
      }

      const globalSec = fullBatterPool.filter(p => !usedIDs.has(p.playerID) && (p.sec_pos || '').split(',').map(s => s.trim()).includes(slot))
        .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      const pick = globalSec.length ? weightedTopPick(globalSec) : null;
      if (pick) {
        usedIDs.add(pick.playerID);
        return { ...pick, assignedSlot: slot };
      }
      return null;
    }).filter(Boolean);

    const lineup = optimizeLineupArray(rawLineup);

    const pickPitcher = (role) => {
      const free = p => !usedIDs.has(personId(p)) && (p.role || 'SP').toUpperCase() === role;
      let pick;
      for (const radius of WINDOW_RADII) {
        const bucket = eligiblePitchers(radius).filter(free).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        if (bucket.length) { pick = weightedTopPick(bucket); break; }
      }
      if (!pick) {
        const globalBucket = fullPitcherPool.filter(free).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        pick = globalBucket.length ? weightedTopPick(globalBucket) : undefined;
      }
      if (pick) usedIDs.add(personId(pick));
      return pick;
    };
    const sp = pickPitcher('SP');
    const rp = pickPitcher('RP');

    return {
      code, decade,
      name: `${decade}s ${franchiseNames[code] || code}`,
      lineup,
      pitcher: buildEnemyPitcherObj(sp, 'SP'),
      reliever: buildEnemyPitcherObj(rp, 'RP')
    };
  }

  // Full pitching staff for a franchise-decade: 5 starters + 6 relievers (closer, setup,
  // 4 middle, same as the user's packs bullpen), all real pitchers who played for that franchise near that decade. The
  // existing ace (team.pitcher) and reliever (team.reliever) stay as SP1 and the setup man.
  // `taken` works as in buildFranchiseDecadeTeam (league-wide uniqueness).
  function buildFranchiseStaff(code, decade, team, taken) {
    const history = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};
    const pool = getPitcherPool();
    const used = new Set();
    const keyOf = p => pitcherUnlockKey(p);
    const isFree = p => !used.has(keyOf(p)) && !(taken && taken.has(personId(p)));
    const claim = p => { used.add(keyOf(p)); if (taken) taken.add(personId(p)); };
    const take = (role, count) => {
      const out = [];
      for (const radius of WINDOW_RADII) {
        if (out.length >= count) break;
        const bucket = pool
          .filter(p => (p.role || 'SP').toUpperCase() === role && isFree(p) && isEligibleForTeamDecade(p, history, code, decade, radius))
          .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        while (out.length < count && bucket.length) {
          const pick = weightedTopPick(bucket);
          bucket.splice(bucket.indexOf(pick), 1);
          claim(pick);
          out.push(pick);
        }
      }
      return out;
    };
    // Seed with the pitchers the team already shows, so the ace you scout is still SP1.
    const aceRaw = pool.find(p => keyOf(p) === keyOf(team.pitcher));
    const relRaw = pool.find(p => keyOf(p) === keyOf(team.reliever));
    if (aceRaw) used.add(keyOf(aceRaw));
    if (relRaw) used.add(keyOf(relRaw));
    const starters = [...(aceRaw ? [aceRaw] : []), ...take('SP', aceRaw ? 4 : 5)];
    const relievers = [...(relRaw ? [relRaw] : []), ...take('RP', relRaw ? 5 : 6)];
    while (starters.length < 5 && relievers.length > 6) starters.push(relievers.pop());
    const rotation = starters.slice(0, 5).map(p => buildEnemyPitcherObj(p, 'SP'));
    const pen = relievers.slice(0, 6).map(p => buildEnemyPitcherObj(p, 'RP'))
      .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    if (pen[0]) pen[0].role = 'CL';
    if (pen[1]) pen[1].role = 'SETUP';
    return { rotation: rotation.length ? rotation : [team.pitcher], bullpen: pen.length ? pen : [team.reliever] };
  }

  const _staffCache = new Map();
  function getFranchiseStaff(code, decade) {
    const cacheKey = `${code}_${decade}`;
    const reg = _leagueRosterRegistry.get(cacheKey);
    if (reg) return reg.staff;
    if (_staffCache.has(cacheKey)) return _staffCache.get(cacheKey);
    const staff = withTeamDepth(code, () => buildFranchiseStaff(code, decade, getFranchiseDecadeTeam(code, decade), null));
    _staffCache.set(cacheKey, staff);
    return staff;
  }

  // Five bench bats for a franchise-decade, so every club carries 25 (9 + 5 bench + 5 SP + 6 RP):
  // a backup catcher first, then a middle infielder and an outfielder when the franchise has
  // them, then the best bats left. Same eligibility windows as the starting lineup.
  const BENCH_SIZE = 5;
  const ROSTER_RP = 6;
  function buildFranchiseBench(code, decade, team, taken) {
    const history = (window.PlayerTeamHistory && window.PlayerTeamHistory.batters) || {};
    const pool = getBatterPool();
    const used = taken || new Set(team.lineup.map(p => p.playerID));
    const bench = [];
    const pick = (fits) => {
      for (const radius of WINDOW_RADII) {
        const bucket = pool
          .filter(p => !used.has(personId(p)) && fits(p) && isEligibleForTeamDecade(p, history, code, decade, radius))
          .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        if (bucket.length) {
          const p = weightedTopPick(bucket);
          used.add(personId(p));
          bench.push(p);
          return true;
        }
      }
      return false;
    };
    pick(p => canPlayerFillSlot(p, 'C'));
    pick(p => canPlayerFillSlot(p, 'SS') || canPlayerFillSlot(p, '2B'));
    pick(p => canPlayerFillSlot(p, 'CF') || canPlayerFillSlot(p, 'LF') || canPlayerFillSlot(p, 'RF'));
    while (bench.length < BENCH_SIZE && pick(() => true)) { /* best remaining bats */ }
    return bench;
  }

  const _benchCache = new Map();
  function getFranchiseBench(code, decade) {
    const cacheKey = `${code}_${decade}`;
    const reg = _leagueRosterRegistry.get(cacheKey);
    if (reg) return reg.bench;
    if (_benchCache.has(cacheKey)) return _benchCache.get(cacheKey);
    const bench = withTeamDepth(code, () => buildFranchiseBench(code, decade, getFranchiseDecadeTeam(code, decade), null));
    _benchCache.set(cacheKey, bench);
    return bench;
  }

  // ── League rosters: built once per league, unique across it, saved with the season ──
  // Every rival's 25 is rolled when the league is created, skipping anyone already on
  // another roster (the user's cards first), and stored as card keys in league.rosters so
  // the same players come back after a reload. _leagueRosterRegistry holds the hydrated
  // rosters of the active league; the getters above read from it first.
  const _leagueRosterRegistry = new Map();
  let _poolIndex = null;
  function poolIndex() {
    if (!_poolIndex) {
      _poolIndex = { bat: new Map(), pit: new Map() };
      getBatterPool().forEach(p => _poolIndex.bat.set(batterUnlockKey(p), p));
      getPitcherPool().forEach(p => _poolIndex.pit.set(pitcherUnlockKey(p), p));
    }
    return _poolIndex;
  }

  function buildLeagueRosters(teams, userCards) {
    const taken = new Set((userCards || []).filter(Boolean).map(personId));
    const out = {};
    // Shuffled so no franchise always gets first claim on a shared star.
    seededShuffle(Object.keys(teams).filter(id => !teams[id].isUser), Math.random).forEach(id => {
      const t = teams[id];
      const team = withTeamDepth(t.code, () => buildFranchiseDecadeTeam(t.code, t.decade, taken));
      const staff = withTeamDepth(t.code, () => buildFranchiseStaff(t.code, t.decade, team, taken));
      const bench = withTeamDepth(t.code, () => buildFranchiseBench(t.code, t.decade, team, taken));
      out[id] = {
        lineup: team.lineup.map(p => [batterUnlockKey(p), p.assignedSlot]),
        bench: bench.map(batterUnlockKey),
        rotation: staff.rotation.map(pitcherUnlockKey),
        bullpen: staff.bullpen.map(p => [pitcherUnlockKey(p), p.role])
      };
    });
    return out;
  }

  // Loads league.rosters into the registry (missing cards are skipped).
  function registerLeagueRosters(league) {
    _leagueRosterRegistry.clear();
    if (!league || !league.rosters) return;
    const idx = poolIndex();
    const franchiseNames = (window.PlayersDB && window.PlayersDB.FranchiseNames) || {};
    Object.entries(league.rosters).forEach(([id, r]) => {
      const t = league.teams[id];
      if (!t) return;
      const lineup = r.lineup.map(([k, slot]) => idx.bat.get(k) && ({ ...idx.bat.get(k), assignedSlot: slot })).filter(Boolean);
      const rotation = r.rotation.map(k => idx.pit.get(k)).filter(Boolean).map(p => buildEnemyPitcherObj(p, 'SP'));
      const bullpen = r.bullpen.map(([k, role]) => idx.pit.get(k) && { ...buildEnemyPitcherObj(idx.pit.get(k), 'RP'), role }).filter(Boolean);
      if (lineup.length < 9 || !rotation.length || !bullpen.length) return;
      const setup = bullpen.find(p => p.role === 'SETUP') || bullpen[0];
      const team = {
        code: t.code, decade: t.decade,
        name: `${t.decade}s ${franchiseNames[t.code] || t.code}`,
        lineup, pitcher: rotation[0], reliever: { ...setup, role: 'RP', pos: 'RP' }
      };
      _leagueRosterRegistry.set(`${t.code}_${t.decade}`, {
        team, staff: { rotation, bullpen },
        bench: r.bench.map(k => idx.bat.get(k)).filter(Boolean)
      });
    });
  }

  function getFranchiseDecadeTeam(code, decade) {
    const key = `${code}_${decade}`;
    const reg = _leagueRosterRegistry.get(key);
    if (reg) return reg.team;
    if (_teamDecadeCache.has(key)) return _teamDecadeCache.get(key);
    const team = withTeamDepth(code, () => buildFranchiseDecadeTeam(code, decade));
    _teamDecadeCache.set(key, team);
    return team;
  }

  // One random decade is rolled per franchise ONCE per challenge (not re-rolled
  // every time that franchise comes up on the schedule) — so "the Yankees" stay
  // a single fixed identity (e.g. "1990s New York Yankees") for the whole season.
  function buildLeagueTeams() {
    return getFranchiseCodes().map(code => ({ code, decade: pickWeightedDecade(code) }));
  }

  function buildSeasonSchedule(leagueTeams) {
    const shuffled = leagueTeams.slice().sort(() => Math.random() - 0.5);
    const schedule = [];
    for (let i = 0; i < SEASON_LENGTH; i++) {
      const t = shuffled[i % shuffled.length];
      schedule.push({ code: t.code, decade: t.decade });
    }
    return schedule;
  }

  // Extra real franchise pitcher for playoff opponent's 3-man pitching staff (SP, RP, CL).
  // Searches RP first if role === 'RP' or 'CL', then falls back to SP within franchise-decade radius,
  // and finally to the global pool if necessary, guaranteeing a real historical player.
  function _pickSecondFranchisePitcher(code, decade, excludeKeys = [], preferredRole = 'RP') {
    const pitcherHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};
    const fullPitcherPool = getPitcherPool();
    const excludeSet = new Set(Array.isArray(excludeKeys) ? excludeKeys : [excludeKeys]);

    // 1. Try franchise-decade radius matching preferred role
    for (const radius of WINDOW_RADII) {
      const bucket = fullPitcherPool.filter(p =>
        !excludeSet.has(pitcherUnlockKey(p)) &&
        ((p.role || 'SP').toUpperCase() === preferredRole.toUpperCase()) &&
        isEligibleForTeamDecade(p, pitcherHistory, code, decade, radius)
      ).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      if (bucket.length) return weightedTopPick(bucket);
    }

    // 2. Try franchise-decade radius with any role (e.g. elite SP converted to playoff ace reliever/closer)
    for (const radius of WINDOW_RADII) {
      const bucket = fullPitcherPool.filter(p =>
        !excludeSet.has(pitcherUnlockKey(p)) &&
        isEligibleForTeamDecade(p, pitcherHistory, code, decade, radius)
      ).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      if (bucket.length) return weightedTopPick(bucket);
    }

    // 3. Fallback: global pool matching preferred role
    const globalRoleBucket = fullPitcherPool.filter(p =>
      !excludeSet.has(pitcherUnlockKey(p)) &&
      ((p.role || 'SP').toUpperCase() === preferredRole.toUpperCase())
    ).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    if (globalRoleBucket.length) return weightedTopPick(globalRoleBucket);

    // 4. Fallback: global pool any role
    const globalAnyBucket = fullPitcherPool.filter(p => !excludeSet.has(pitcherUnlockKey(p)))
      .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    return globalAnyBucket.length ? weightedTopPick(globalAnyBucket) : null;
  }

  // Playoff opponents are the strongest real rivals THIS challenge's season
  // actually generated (this.state.leagueTeams — the same 30 franchise-decade
  // teams the regular season schedule drew from).
  // Round 0 (Divisional): 3rd-strongest franchise (+25% HP, +6 Stats)
  // Round 0 (Divisional): 3rd-strongest franchise (Ace SP + Playoff Bullpen)
  // Round 1 (Championship): 2nd-strongest franchise (Elite Cy Young Ace + Setup + Closer)
  // Round 2 (World Series): #1 ABSOLUTE STRONGEST FRANCHISE (Legendary Ace SP + Lockdown Closer)
  // With the real league, `opponentRef` is whoever the bracket paired the user with;
  // without one (legacy state), the opponent falls back to the strength ranking.
  function generatePlayoffEnemyTeam(round, leagueTeams, opponentRef) {
    const cfg = PLAYOFF_ROUNDS[round];
    let chosen;
    if (opponentRef && opponentRef.code) {
      chosen = { t: opponentRef, team: getFranchiseDecadeTeam(opponentRef.code, opponentRef.decade) };
    } else {
      const ranked = (leagueTeams || [])
        .map(t => {
          const team = getFranchiseDecadeTeam(t.code, t.decade);
          return { t, team, strength: teamStrength(team.lineup, team.pitcher) };
        })
        .sort((a, b) => b.strength - a.strength);
      // Round 0 -> 3rd best, round 1 -> 2nd best, round 2 (World Series) -> absolute #1 team in the league.
      const pickIndex = Math.min(ranked.length - 1, Math.max(0, (PLAYOFF_ROUNDS.length - 1) - round));
      chosen = ranked[pickIndex] || ranked[0];
    }
    const franchiseTeam = chosen.team;

    // Playoff intensity calibration: Sharper pitching & defense for competitive postseason duels
    const statBuff = round === 2 ? 10 : (round === 1 ? 6 : 3);

    const boostPitcher = (p, role, targetMinOvr) => {
      if (!p) return null;
      const baseObj = buildEnemyPitcherObj(p, role);
      const effectiveOvr = Math.max(targetMinOvr || 80, Math.min(99, (baseObj.ovr || 75) + statBuff));
      const statBonus = Math.max(0, effectiveOvr - (baseObj.ovr || 75));
      return {
        ...baseObj,
        role,
        pos: role,
        ovr: effectiveOvr,
        h9: Math.min(125, baseObj.h9 + statBonus),
        k9: Math.min(125, baseObj.k9 + statBonus),
        bb9: Math.min(125, baseObj.bb9 + statBonus),
        hr9: Math.min(125, baseObj.hr9 + statBonus),
        stf: Math.min(125, baseObj.stf + statBonus),
        ctl: Math.min(125, baseObj.ctl + statBonus)
      };
    };

    const boostedBatters = optimizeLineupArray(franchiseTeam.lineup).map(b => ({
      ...b,
      con: Math.min(125, (b.con || 50) + statBuff),
      pwr: Math.min(125, (b.pwr || 50) + statBuff),
      eye: Math.min(125, (b.eye || 50) + statBuff),
      def: Math.min(125, (b.def || 50) + statBuff),
      ovr: Math.min(99, (b.ovr || 80) + statBuff)
    }));

    const targetSpOvr = round === 2 ? 96 : (round === 1 ? 92 : 88);
    const targetRpOvr = round === 2 ? 93 : (round === 1 ? 88 : 84);
    const targetClOvr = round === 2 ? 97 : (round === 1 ? 93 : 89);

    const sp = boostPitcher(franchiseTeam.pitcher, 'SP', targetSpOvr);
    const setup = boostPitcher(franchiseTeam.reliever, 'RP', targetRpOvr);
    const excludeKeys = [pitcherUnlockKey(franchiseTeam.pitcher), pitcherUnlockKey(franchiseTeam.reliever)].filter(Boolean);
    // In a real league the closer comes from the team's own bullpen (no borrowed players).
    const reg = _leagueRosterRegistry.get(`${chosen.t.code}_${chosen.t.decade}`);
    const regCloser = reg && reg.staff.bullpen.find(p => p.role === 'CL');
    const closerObj = regCloser || _pickSecondFranchisePitcher(chosen.t.code, chosen.t.decade, excludeKeys, 'RP') || franchiseTeam.reliever;
    const closer = boostPitcher(closerObj, 'CL', targetClOvr);

    return {
      id: `challenge162_playoff_${cfg.key}_${Date.now()}`,
      name: franchiseTeam.name,
      tier: round === 2 ? 'BOSS_S' : 'S',
      isBoss: true,
      isWorldSeries: round === 2,
      team: franchiseTeam,
      pitchers: [sp, setup, closer],
      pitcher: sp,
      reliever: setup,
      closer: closer,
      lineup: boostedBatters,
      _batters: boostedBatters,
      _ovr: sp.ovr,
      era: sp.era,
      rarity: round === 2 ? 'Legendary' : 'Epic'
    };
  }

  // ── Baserunning helpers (realistic advancements on hits & walks) ─────────
  function forceWalk(bases, batter) {
    if (!bases[0]) { bases[0] = batter; return null; }
    if (!bases[1]) { bases[1] = bases[0]; bases[0] = batter; return null; }
    if (!bases[2]) { bases[2] = bases[1]; bases[1] = bases[0]; bases[0] = batter; return null; }
    const scorer = bases[2];
    bases[2] = bases[1]; bases[1] = bases[0]; bases[0] = batter;
    return scorer;
  }

  function advanceOnHit(bases, batter, basesToAdvance, outs) {
    const scorers = [];
    const r1 = bases[0];
    const r2 = bases[1];
    const r3 = bases[2];

    if (basesToAdvance >= 4) {
      // Home Run: all runners on base + batter score
      if (r3) scorers.push(r3);
      if (r2) scorers.push(r2);
      if (r1) scorers.push(r1);
      scorers.push(batter);
      bases[0] = null; bases[1] = null; bases[2] = null;
      return scorers;
    }

    if (basesToAdvance === 3) {
      // Triple: all runners on base score, batter to 3rd
      if (r3) scorers.push(r3);
      if (r2) scorers.push(r2);
      if (r1) scorers.push(r1);
      bases[0] = null; bases[1] = null; bases[2] = batter;
      return scorers;
    }

    if (basesToAdvance === 2) {
      // Double: 3rd and 2nd score. Runner on 1st scores ~40% (more if fast or 2 outs), else goes to 3rd.
      if (r3) scorers.push(r3);
      if (r2) scorers.push(r2);
      bases[0] = null; bases[1] = batter; bases[2] = null;
      if (r1) {
        const spd1 = r1.spd !== undefined ? r1.spd : 50;
        const scoreChance = (spd1 >= 60 || outs === 2) ? 0.55 : 0.35;
        if (Math.random() < scoreChance) {
          scorers.push(r1);
        } else {
          bases[2] = r1;
        }
      }
      return scorers;
    }

    // Single: 3rd scores. 2nd scores ~55% (more if fast or 2 outs), else goes to 3rd. 1st goes to 2nd.
    if (r3) scorers.push(r3);
    bases[2] = null;
    if (r2) {
      const spd2 = r2.spd !== undefined ? r2.spd : 50;
      const scoreChance = (spd2 >= 60 || outs === 2) ? 0.65 : 0.45;
      if (Math.random() < scoreChance) {
        scorers.push(r2);
      } else {
        bases[2] = r2;
      }
    }
    bases[1] = r1 || null;
    bases[0] = batter;
    return scorers;
  }

  // ── PA outcome model, tuned toward realistic MLB rates ────────────────────
  // Base hit and HR rates for a 50-rated batter vs a 50-rated pitcher.
  // League game engine (regular season), tuned to an all-eras environment rather than today's MLB.
  const HOME_EDGE = 3;          // rating points: the home staff pitches with +N, the visitors' with -N
  const STEAL_TRY_BASE = 0.0; // steal attempts per plate appearance with the next base open
  const STEAL_TRY_SCALE = 0.27;
  const STEAL_TRY_POW = 1.25;
  const STEAL_THIRD = 0.22;     // share of those attempts when the runner is on second
  const GREAT_STEALER = 1.2;    // hidden steal tendency from which a runner counts as a great base stealer
  const ERROR_RATE = 0.038;     // batted-ball outs that turn into an error, for an average defense
  const GIDP_RATE = 0.19;       // batted-ball outs with a man on first and under 2 outs
  const RUN_ON_OUT = 0.42;      // man on third, under 2 outs: scores on a batted-ball out
  const ADVANCE_ON_OUT = 0.30;  // man on second, third open, under 2 outs: moves up on the out
  const ERROR_WEIGHT = { SS: 22, '3B': 20, '2B': 16, '1B': 10, C: 8, LF: 7, CF: 7, RF: 7 };
  // Rating -> stat tables: the real peak numbers of the cards at each rating (all eras together),
  // so a player produces the line his rating stands for instead of a flattened one.
  const RT_X = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 115, 125];
  const BAT_AVG = [.220, .241, .255, .267, .278, .288, .298, .309, .322, .340, .367, .385];
  const BAT_HR = [.0039, .0086, .0140, .0209, .0281, .0321, .0366, .0410, .0486, .0550, .0640, .0760];
  const BAT_K = [.250, .223, .187, .164, .132, .108, .085, .070, .053, .042, .033, .028];
  const BAT_BB = [.045, .060, .073, .086, .098, .109, .120, .129, .146, .164, .200, .250];
  const BAT_2B = [.141, .168, .186, .203, .218, .223, .225, .231, .231, .232, .240, .240]; // share of non-HR hits, by power
  const BAT_3B = [.016, .024, .036, .043, .045, .046, .046, .046, .046, .047, .048, .050]; // share of non-HR hits, by speed
  const PIT_H9 = [10.9, 9.9, 9.27, 8.8, 8.35, 7.9, 7.55, 7.15, 6.75, 6.3, 5.5, 5.2];
  const PIT_K9 = [2.57, 3.6, 4.65, 5.6, 6.7, 7.65, 8.5, 9.1, 9.8, 10.2, 12.2, 13.5];
  const PIT_BB9 = [5.4, 4.5, 4.05, 3.6, 3.23, 2.83, 2.55, 2.29, 2.05, 1.83, 1.45, 1.25];
  const PIT_HR9 = [1.32, 1.12, .98, .82, .70, .57, .47, .36, .29, .22, .19, .17];
  // League level: everybody here is at his peak, so the tables are scaled to an all-eras league.
  // Reference chosen by the user: AL/NL 1947-2025 all together (.257 / .325 / .399, 4.42 runs,
  // 0.93 HR, 1.58 doubles, 0.21 triples and 0.74 errors per team-game, K 16.4%, ERA 4.02).
  const PA_SCALE_HR = 0.92, PA_SCALE_K = 1.38, PA_SCALE_BB = 1.04;
  const AVG_PIVOT = 0.265, AVG_SPREAD = 1.08, AVG_SHIFT = 0.010;
  const PA_SCALE_2B = 1.0, PA_SCALE_3B = 0.68; // share of the non-HR hits that go for two and three bases
  const K_BAT_SPREAD = 0.7, K_PIT_LOW_SPREAD = 0.75, H_PIT_HIGH_SPREAD = 0.3; // 1 = full spread of the tables
  // The pitchers who allow fewer hits than the average one get that edge a little bigger, the
  // same idea as AVG_SPREAD for the hitters: the aces reach their own level (their ERA was
  // 0.17 above their neutral one) and the league stays where it is.
  const H_PIT_LOW_SPREAD = 1.1;
  function rateAt(ys, v) {
    if (!(v > RT_X[0])) return ys[0];
    for (let n = 1; n < RT_X.length; n++) {
      if (v <= RT_X[n]) return ys[n - 1] + (ys[n] - ys[n - 1]) * (v - RT_X[n - 1]) / (RT_X[n] - RT_X[n - 1]);
    }
    return ys[ys.length - 1];
  }
  const baaOf = h9 => h9 / (27 + h9);
  // Hidden tendencies (challenge_tendencies.js, built from the real record): how each player
  // used his tools. bat: [homers, steals, strikeouts], pit: strikeouts, each as a multiplier of what the
  // engine gives that rating. Without them Ty Cobb hit 31 homers (his power was doubles and
  // triples) and Mathewson struck out 8.6 per nine. Only this mode reads them.
  // How much of each tendency is used: 0 = ratings only (neutral environment: "what would he
  // do today"), 1 = his real numbers. Decision of the user: homers and strikeouts stay neutral
  // (it is fun to see old players in a modern setting); steals follow the real player, because
  // running is a habit of the player more than of his era.
  // hrUp: the homers a hitter really hit ABOVE what his Power stands for (all of them). The rating
  // mixes homers, ISO and extra bases and its top is compressed, so the modern sluggers topped
  // out near 42 (McGwire 42 against 55 in a neutral setting, Sosa 40 / 47). Hitters below
  // their rating (dead-ball era) are not touched: the environment stays neutral for them.
  // sbUp: tried at 1.5 to lift the great base stealers (their chances to run are limited:
  // Rickey Henderson 67 against 91). It did not help them (65) and took steals from everybody
  // else once the league level was put back, so it stays at 1.
  const TENDENCY_STRENGTH = { hr: 0, hrUp: 1, sb: 1, sbUp: 1, k: 0 };
  const NO_BAT_TENDENCY = [1, 1, 1];
  const _strength = (mult, s) => (s <= 0 || !mult ? 1 : (s === 1 ? mult : Math.pow(mult, s)));
  const _batCache = new Map();
  function batTendency(p) {
    const t = window.ChallengeTendencies;
    const raw = t && p && p.playerID && t.bat[p.playerID];
    if (!raw) return NO_BAT_TENDENCY;
    let out = _batCache.get(p.playerID);
    if (!out) {
      out = [_strength(raw[0], raw[0] > 1 ? TENDENCY_STRENGTH.hrUp : TENDENCY_STRENGTH.hr), _strength(raw[1], raw[1] > 1 ? TENDENCY_STRENGTH.sbUp : TENDENCY_STRENGTH.sb), _strength(raw[2], TENDENCY_STRENGTH.k)];
      _batCache.set(p.playerID, out);
    }
    return out;
  }
  function pitTendency(p) {
    const t = window.ChallengeTendencies;
    return _strength(t && p && p.playerID && t.pit[p.playerID], TENDENCY_STRENGTH.k);
  }

  function simPaOutcome(batter, pitcher, isUserBatting = true) {
    const num = (v, d) => (v !== undefined ? v : d);
    const con = num(batter.con, 50), eye = num(batter.eye, 50), pwr = num(batter.pwr, 50), spd = num(batter.spd, 50);
    const kAvd = num(batter.k_avd, num(batter.k_avoid, num(batter.k_avoid_val, con)));
    const pH9 = num(pitcher.h9, 50), pK9 = num(pitcher.k9, 50), pBB9 = num(pitcher.bb9, 50), pHR9 = num(pitcher.hr9, 50);

    // Each rate is the batter's own rate times how the pitcher compares with an average one.
    // One formula for every batter in the league; isUserBatting is kept only for old callers.
    let pBB = rateAt(BAT_BB, eye) * (rateAt(PIT_BB9, pBB9) / PIT_BB9[4]) * PA_SCALE_BB;
    pBB = Math.max(0.02, Math.min(0.30, pBB));
    // The extremes were too far apart (144 seasons of stars against their neutral peaks):
    // sluggers struck out ~25% too much and contact hitters too little, strikeout pitchers a
    // bit too much and control pitchers too little. A batter who strikes out more than the
    // average one is pulled toward it (pulling the contact hitters too gave Gwynn 43 against
    // 28), and a pitcher below the average K/9 is pulled up; above it he keeps his own.
    const kBatRatio = rateAt(BAT_K, kAvd) / BAT_K[4];
    const kBat = BAT_K[4] * (kBatRatio > 1 ? Math.pow(kBatRatio, K_BAT_SPREAD) : kBatRatio);
    const kPitRatio = rateAt(PIT_K9, pK9) / PIT_K9[4];
    const kPit = kPitRatio >= 1 ? kPitRatio : Math.pow(kPitRatio, K_PIT_LOW_SPREAD);
    let pSO = kBat * kPit * PA_SCALE_K * pitTendency(pitcher) * (batTendency(batter)[2] || 1);
    pSO = Math.max(0.015, Math.min(0.45, pSO));
    const pInPlay = Math.max(0.20, 1 - pBB - pSO);

    const defEfficiency = (pitcher && pitcher._fieldingDef) !== undefined ? pitcher._fieldingDef : 50;
    const defAdj = (defEfficiency - 50) * 0.00028;
    // Same for hits: a pitcher who allows more than the average one was punished too much
    // (about 1.1 extra hits per nine against 0.3 for the aces), so only that side is softened.
    let hPit = baaOf(rateAt(PIT_H9, pH9)) / baaOf(PIT_H9[4]);
    hPit = hPit > 1 ? 1 + (hPit - 1) * H_PIT_HIGH_SPREAD : 1 - (1 - hPit) * H_PIT_LOW_SPREAD;
    // League level as a fixed shift, not as a percentage: a percentage took the most from the
    // best hitters (Cobb .365 against .393 in a neutral setting). AVG_SPREAD opens the gap
    // between good and bad hitters a little, so the stars reach their own level and the cost
    // falls on the weak bats instead of on the league.
    const avgBat = AVG_PIVOT + (rateAt(BAT_AVG, con) - AVG_PIVOT) * AVG_SPREAD - AVG_SHIFT;
    let targetAvg = avgBat * hPit - defAdj;
    targetAvg = Math.max(0.12, Math.min(0.42, targetAvg));
    let pTotalHit = (1 - pBB) * targetAvg;
    pTotalHit = Math.min(pTotalHit, pInPlay - 0.01);

    const clampHR = v => Math.min(Math.max(0.0005, Math.min(0.11, v)), pTotalHit * 0.50);
    const baseHR = clampHR(rateAt(BAT_HR, pwr) * (rateAt(PIT_HR9, pHR9) / PIT_HR9[4]) * PA_SCALE_HR);
    const pHR = clampHR(baseHR * batTendency(batter)[0]);
    const pRegularHit = pTotalHit - pHR;

    const share3B = rateAt(BAT_3B, spd) * PA_SCALE_3B;
    const share2B = rateAt(BAT_2B, pwr) * PA_SCALE_2B;
    // Part of the power a hitter did not put over the fence stays as extra bases: a quarter of
    // the homers his tendency takes away come back as doubles and triples (more triples for the
    // fast ones), the rest as singles. Moving all of them gave Ty Cobb 68 doubles.
    const moved = baseHR - pHR;
    let p2B = (pTotalHit - baseHR) * share2B + moved * 0.15;
    let p3B = (pTotalHit - baseHR) * share3B + moved * 0.10 * Math.min(1.5, Math.max(0.3, spd / 75));
    p2B = Math.max(pRegularHit * 0.06, p2B);
    p3B = Math.max(pRegularHit * 0.004, p3B);
    const over = (p2B + p3B) - pRegularHit * 0.62; // always leave room for singles
    if (over > 0) { const k = (pRegularHit * 0.62) / (p2B + p3B); p2B *= k; p3B *= k; }
    const p1B = pRegularHit - p2B - p3B;

    const roll = Math.random();
    let acc = 0;
    acc += pBB; if (roll < acc) return 'BB';
    acc += pSO; if (roll < acc) return 'SO';
    acc += p1B; if (roll < acc) return '1B';
    acc += p2B; if (roll < acc) return '2B';
    acc += p3B; if (roll < acc) return '3B';
    acc += pHR; if (roll < acc) return 'HR';
    return 'OUT';
  }

  // ── Layer 2: who wins the game. Deliberately separate from simPaOutcome
  // above — a simple, transparent team-quality comparison (weighted OVR of
  // the lineup + today's pitcher + fielding defense), turned into a win probability. ──
  function teamStrength(lineup, pitcherToday) {
    const battingOvr = lineup.length
      ? lineup.reduce((s, p) => s + (p.ovr || 50), 0) / lineup.length
      : 50;
    const pitchingOvr = (pitcherToday && pitcherToday.ovr) || 50;
    
    // Team Defense (average of fielders excluding DH)
    const fielders = lineup.filter(p => (p.assignedSlot || p.pos) !== 'DH');
    const fieldingOvr = fielders.length
      ? fielders.reduce((s, p) => s + (p.def !== undefined ? p.def : (p.defense_val || 50)), 0) / fielders.length
      : 50;

    return battingOvr * 0.50 + pitchingOvr * 0.35 + fieldingOvr * 0.15;
  }

  function winProbability(userStrength, oppStrength, streak) {
    const diff = userStrength - oppStrength;
    // Baseball parity logit: a +10 OVR difference produces ~68-72% expected win rate
    // Teams with 90+ OVR will average 105-125 wins over 162 games.
    let p = 1 / (1 + Math.exp(-diff * 0.080));
    p += Math.min(0.03, streak * 0.0008);
    return Math.max(0.12, Math.min(0.92, p));
  }


  // ── Pack Draft & Roster Match Helpers ─────────────────────────────────────
  function getAllPositionsForPlayer(p) {
    const positions = new Set();
    const rawPosList = [
      p.pos || p.pos_display || p.primary_pos || '',
      p.sec_pos || p.secondary_pos || p.secondary_positions || ''
    ];
    rawPosList.forEach(raw => {
      if (!raw) return;
      const parts = String(raw).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      parts.forEach(part => {
        if (part === 'OF') {
          positions.add('LF');
          positions.add('CF');
          positions.add('RF');
        } else if (part === 'IF') {
          positions.add('1B');
          positions.add('2B');
          positions.add('3B');
          positions.add('SS');
        } else {
          positions.add(part);
        }
      });
    });
    return positions;
  }

  function canPlayerFillSlot(p, slot) {
    if (!p) return false;
    if (slot === 'DH') return true;
    const positions = getAllPositionsForPlayer(p);
    return positions.has(slot.toUpperCase());
  }

  function canPlayerFillPrimary(p, slot) {
    if (!p) return false;
    const raw = (p.pos || p.pos_display || p.primary_pos || '').toUpperCase().trim();
    if (raw === slot) return true;
    if (raw === 'OF' && (slot === 'LF' || slot === 'CF' || slot === 'RF')) return true;
    if (raw === 'IF' && (slot === '1B' || slot === '2B' || slot === '3B' || slot === 'SS')) return true;
    return false;
  }

  function calculateChallengeRosterSlots(pulledCards, finalize = false) {
    const batters = pulledCards.filter(c => !c.role).sort((a, b) => (b.ovr || 50) - (a.ovr || 50));
    const pitchers = pulledCards.filter(c => c.role).sort((a, b) => (b.ovr || 50) - (a.ovr || 50));

    const lineup = { C: null, '1B': null, '2B': null, '3B': null, SS: null, LF: null, CF: null, RF: null, DH: null };
    // Best nine, not just a legal nine: every way of filling the 8 fielding spots and the DH is
    // scored and the highest total wins (exact search over the batters pulled so far).
    //  - a player counts for his OVR, plus or minus his glove where gloves matter most;
    //  - at a secondary position his glove plays at 85% and he gives up a little;
    //  - the DH brings only his bat, so a great glove is wasted there;
    //  - out of position only when nobody on the roster can play the spot.
    // It used to stop at the first legal assignment by primary position, so a 64 could start in
    // right field while an 81 who also plays there sat on the bench.
    const allowOutOfPosition = finalize || batters.length >= 9;
    const GLOVE_WEIGHT = { C: 0.10, SS: 0.10, CF: 0.10, '2B': 0.08, '3B': 0.06, LF: 0.04, RF: 0.04, '1B': 0.03 };
    const ALL_SLOTS = ['C', 'SS', 'CF', '2B', '3B', '1B', 'LF', 'RF', 'DH'];
    const pool = batters.slice(0, 16); // already sorted by OVR; a draft never has more than 14
    const gloveOf = p => (p.def !== undefined ? p.def : (p.defense_val !== undefined ? p.defense_val : 50));
    const slotValue = (p, slot) => {
      const ovr = p.ovr || 50, def = gloveOf(p);
      if (slot === 'DH') return ovr - 0.12 * (def - 50);
      if (canPlayerFillPrimary(p, slot)) return ovr + GLOVE_WEIGHT[slot] * (def - 50);
      if (canPlayerFillSlot(p, slot)) return ovr + GLOVE_WEIGHT[slot] * (def * 0.85 - 50) - 1.5;
      return allowOutOfPosition ? ovr - 45 : -Infinity;
    };
    const val = pool.map(p => ALL_SLOTS.map(slot => slotValue(p, slot)));
    let layer = new Map([[0, { v: 0, pick: [] }]]);
    ALL_SLOTS.forEach((slot, si) => {
      const next = new Map();
      const offer = (mask, v, pick) => { const cur = next.get(mask); if (!cur || v > cur.v) next.set(mask, { v, pick }); };
      layer.forEach((st, mask) => {
        offer(mask, st.v, st.pick.concat(-1)); // leave the spot empty
        for (let k = 0; k < pool.length; k++) {
          if (mask & (1 << k)) continue;
          const v = val[k][si];
          if (v === -Infinity) continue;
          offer(mask | (1 << k), st.v + 1000 + v, st.pick.concat(k)); // +1000: filling a spot always beats leaving it empty
        }
      });
      layer = next;
    });
    let best = null;
    layer.forEach(st => { if (!best || st.v > best.v) best = st; });
    const taken = new Set();
    (best ? best.pick : []).forEach((k, si) => { if (k >= 0) { lineup[ALL_SLOTS[si]] = pool[k]; taken.add(pool[k]); } });
    const overflowBatters = batters.filter(p => !taken.has(p));

    // ── PASS 5: Bench Reserves (5 Cards) ─────────────────────────────────────
    const bench = [null, null, null, null, null];
    let bIdx = 0;
    while (overflowBatters.length > 0 && bIdx < 5) {
      bench[bIdx++] = overflowBatters.shift();
    }

    const sp = [null, null, null, null, null];
    const rp = [null, null, null, null, null, null];
    const usedPitchers = new Set();

    const isSP = (p) => (p.role || 'SP').toUpperCase() === 'SP';
    const spList = pitchers.filter(isSP);
    const rpList = pitchers.filter(p => !isSP(p));

    let spIdx = 0;
    spList.forEach(p => {
      if (spIdx < 5) {
        sp[spIdx++] = p;
        usedPitchers.add(pitcherUnlockKey(p));
      }
    });

    let rpIdx = 0;
    rpList.forEach(p => {
      if (!usedPitchers.has(pitcherUnlockKey(p)) && rpIdx < 6) {
        rp[rpIdx++] = p;
        usedPitchers.add(pitcherUnlockKey(p));
      }
    });

    spList.forEach(p => {
      if (!usedPitchers.has(pitcherUnlockKey(p))) {
        const emptyRp = rp.findIndex(s => s === null);
        if (emptyRp !== -1) {
          rp[emptyRp] = p;
          usedPitchers.add(pitcherUnlockKey(p));
        }
      }
    });

    rpList.forEach(p => {
      if (!usedPitchers.has(pitcherUnlockKey(p))) {
        const emptySp = sp.findIndex(s => s === null);
        if (emptySp !== -1) {
          sp[emptySp] = p;
          usedPitchers.add(pitcherUnlockKey(p));
        }
      }
    });

    return { lineup, bench, sp, rp, batters, pitchers };
  }

  const RARITY_TIERS = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Mythic': 6 };

  function pickWeightedChallengeDraftCard(pool, missingPos, usedKeys, minRarity = null) {
    let available = pool.filter(p => {
      const k = p.role ? pitcherUnlockKey(p) : batterUnlockKey(p);
      return !usedKeys.has(k);
    });
    if (!available.length) return pool[0];

    // Filter by minimum rarity tier if specified
    if (minRarity && RARITY_TIERS[minRarity]) {
      const targetTier = RARITY_TIERS[minRarity];
      const rarityMatches = available.filter(p => {
        const rTier = RARITY_TIERS[p.rarity] || 1;
        return rTier >= targetTier;
      });
      if (rarityMatches.length > 0) {
        available = rarityMatches;
      }
    }

    const isMissing = (p) => {
      if (!missingPos || missingPos.length === 0) return false;
      const allPos = getAllPositionsForPlayer(p);
      const role = (p.role || '').toUpperCase();
      if (role && missingPos.includes(role)) return true;
      for (let i = 0; i < missingPos.length; i++) {
        if (allPos.has(missingPos[i])) return true;
      }
      return false;
    };

    if (missingPos && missingPos.length > 0) {
      const matchingCards = available.filter(isMissing);
      if (matchingCards.length > 0) {
        const idx = Math.floor(Math.random() * matchingCards.length);
        return matchingCards[idx];
      }
    }

    const toWeighted = (p) => {
      const allPos = getAllPositionsForPlayer(p);
      const role = (p.role || '').toUpperCase();
      let weight = 1;
      let matched = false;

      if (missingPos && missingPos.length > 0) {
        if (role && missingPos.includes(role)) {
          matched = true;
        } else {
          for (let i = 0; i < missingPos.length; i++) {
            if (allPos.has(missingPos[i])) {
              matched = true;
              break;
            }
          }
        }
      }

      if (matched) weight = 10;
      return { player: p, weight };
    };

    const weightedList = available.map(toWeighted);
    let totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = weightedList[weightedList.length - 1].player;
    for (let i = 0; i < weightedList.length; i++) {
      if (random < weightedList[i].weight) {
        selected = weightedList[i].player;
        break;
      }
      random -= weightedList[i].weight;
    }
    return selected;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REAL LEAGUE — 32 teams in two leagues (AL / NL, no divisions).
  // 15 real franchises per league (today's alignment) + the Negro Leagues All-Stars
  // in one league and the user's team in the other.
  // Every team plays 162 games: one 16-game slate per day. The user's game is fully
  // simulated by simulateGame(); the other 15 are resolved with winProbability().
  // The top 4 of each league make a 3-round single-game bracket:
  //   R1: 1v4 & 2v3 in each league · R2: league final · R3: World Series.
  // ══════════════════════════════════════════════════════════════════════════
  const AL_CODES = ['NYY', 'BOS', 'TOR', 'BAL', 'TB', 'CLE', 'DET', 'CHW', 'MIN', 'KCR', 'HOU', 'TEX', 'LAA', 'SEA', 'OAK'];
  const NL_CODES = ['NYM', 'PHI', 'ATL', 'WSH', 'MIA', 'CHC', 'STL', 'MIL', 'CIN', 'PIT', 'LAD', 'SFG', 'SDP', 'ARI', 'COL'];
  const USER_TEAM_ID = 'USER';
  const NLB_TEAM_ID = 'NLB';
  const INTERLEAGUE_EVERY = 5;   // every 5th day is an interleague slate
  const PLAYOFF_SEEDS = 4;
  const POWER_RANK_EVERY = 7;    // power rankings refresh weekly
  const MAX_HEADLINES = 40;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Leagues follow today's MLB alignment regardless of the rolled decade
  // (e.g. the Astros are always AL), so both leagues have 15 franchises.
  function realLeagueOf(code) {
    return AL_CODES.includes(code) ? 'AL' : 'NL';
  }

  function otherLeague(lg) { return lg === 'AL' ? 'NL' : 'AL'; }

  // The Negro Leagues All-Stars always take the spot in the league the user didn't pick: 16 and 16.
  function placeNegroLeagues(league) {
    league.teams[NLB_TEAM_ID].league = otherLeague(league.teams[USER_TEAM_ID].league);
  }

  function newTeamRecord(base) {
    return { ...base, w: 0, l: 0, streak: 0, last10: [] };
  }

  // decadeByCode lets a migrated save keep the franchise-decades it already faced.
  // userCards: the user's 25, kept off every rival roster (no player on two teams).
  function createLeague(userLeague, userStrength, userName, decadeByCode, userCards) {
    const teams = {};
    [...AL_CODES, ...NL_CODES, NLB_TEAM_ID].forEach(code => {
      const decade = (decadeByCode && decadeByCode[code]) || pickWeightedDecade(code);
      teams[code] = newTeamRecord({ id: code, code, decade, league: code === NLB_TEAM_ID ? null : realLeagueOf(code) });
    });
    const rosters = buildLeagueRosters(teams, userCards);
    registerLeagueRosters({ teams, rosters });
    Object.values(teams).forEach(t => {
      const team = getFranchiseDecadeTeam(t.code, t.decade);
      t.name = team.name;
      t.strength = Math.round(teamStrength(team.lineup, team.pitcher) * 10) / 10;
    });
    teams[USER_TEAM_ID] = newTeamRecord({
      id: USER_TEAM_ID, code: USER_TEAM_ID, decade: null, league: userLeague,
      name: userName, strength: Math.round(userStrength * 10) / 10, isUser: true
    });
    placeNegroLeagues({ teams });
    return {
      v: 1,
      seed: Math.floor(Math.random() * 2147483647),
      userLeague,
      teams,
      rosters,
      day: 0,
      powerRanks: [],   // weekly snapshots: { day, order: [ids] }
      headlines: [],    // { day, text, kind }
      leaders: { AL: null, NL: null },
      clinched: false,
      eliminated: false
    };
  }

  function leagueTeamIds(league, lg) {
    return Object.keys(league.teams).filter(id => league.teams[id].league === lg).sort();
  }

  // Deterministic per seed + day, so the slate never has to be stored.
  function leagueDaySlate(league, day) {
    const rnd = mulberry32((league.seed + day * 7919) >>> 0);
    const al = seededShuffle(leagueTeamIds(league, 'AL'), rnd);
    const nl = seededShuffle(leagueTeamIds(league, 'NL'), rnd);
    const pairs = [];
    const pairWithin = arr => { for (let i = 0; i + 1 < arr.length; i += 2) pairs.push([arr[i], arr[i + 1]]); };
    // Leagues can be uneven (historical alignments). 32 teams is even, so both leagues are
    // odd or both even; any leftovers are paired across leagues so everyone plays every day.
    if (day % INTERLEAGUE_EVERY === INTERLEAGUE_EVERY - 1) {
      const n = Math.min(al.length, nl.length);
      for (let i = 0; i < n; i++) pairs.push([al[i], nl[i]]);
      pairWithin(al.slice(n));
      pairWithin(nl.slice(n));
    } else {
      if (al.length % 2 === 1 && nl.length % 2 === 1) pairs.push([al.pop(), nl.pop()]);
      pairWithin(al);
      pairWithin(nl);
    }
    return pairs;
  }

  function userOpponentId(league, day) {
    const pair = leagueDaySlate(league, day).find(p => p.includes(USER_TEAM_ID));
    return pair ? (pair[0] === USER_TEAM_ID ? pair[1] : pair[0]) : null;
  }

  function scheduleFromLeague(league) {
    const schedule = [];
    for (let d = 0; d < SEASON_LENGTH; d++) {
      const t = league.teams[userOpponentId(league, d)];
      schedule.push({ code: t.code, decade: t.decade, id: t.id });
    }
    return schedule;
  }

  function applyTeamResult(team, won) {
    if (won) { team.w++; team.streak = team.streak > 0 ? team.streak + 1 : 1; }
    else { team.l++; team.streak = team.streak < 0 ? team.streak - 1 : -1; }
    team.last10.push(won ? 1 : 0);
    if (team.last10.length > 10) team.last10.shift();
  }

  // Momentum: ±1 to every rating per 3 straight wins (or losses), capped at ±3.
  // Applies to every team in the regular season, the user included.
  // Games a regular plays in a season, normal vs as an Iron Man (measured over full seasons).
  const IRON_GAMES = { C: [135, 154], SS: [151, 159], '2B': [151, 159], CF: [151, 159], '3B': [152, 160], LF: [154, 160], RF: [154, 160], '1B': [156, 161], DH: [158, 161] };
  const LEGENDARY_PACK_CHANCE = 0.04;
  const PACK_OPTIONS = 3; // cards shown in each pack; the player keeps one
  const PACK_OPTION_OVR_SPREAD = 2; // how far the two alternatives may be from the pack's roll
  const MOMENTUM_STEP = 3;
  const MOMENTUM_CAP = 10;
  // Pitcher fatigue (see _freshBatters / _fatiguePenalty)
  const FATIGUE_PER_BATTER = 2;
  const FATIGUE_MAX = 16;
  // Batter wear: every start adds wear by position, minus a little natural recovery
  // (net ≈ C 2.2, SS/2B/CF 0.8, 3B 0.7, LF/RF 0.6, 1B 0.45, DH 0.3). Each 10 points
  // costs −1 to CON/PWR/EYE/SPD/K-AVD, up to −3; a day off resets it. Managers rest a
  // starter as soon as he would play at −1, if the roster can cover his position — a bench
  // player straight in, or a starter sliding over to a secondary position so the bench
  // player takes his (≈ C 135 G, middle IF/CF 150, 3B 152, LF/RF 153, 1B 155, DH 157);
  // with no cover at all he sits at −2 instead, covered out of position. Iron Men (up to
  // 3, picked before the season) follow the same rules but wear at a quarter of the speed, so they
  // need far fewer days off.
  const WEAR_BY_POS = { C: 2.5, SS: 1.1, '2B': 1.1, CF: 1.1, '3B': 1.0, LF: 0.9, RF: 0.9, '1B': 0.75, DH: 0.6 };
  const MAX_IRON_MAN = 3;
  const IRON_MAN_WEAR = 1 / 4;
  const WEAR_RECOVERY = 0.3;
  const WEAR_PER_POINT = 10;
  const WEAR_MAX_PENALTY = 3;
  const WEAR_CAP = 40;
  const MAX_RESTS_PER_GAME = 2;
  const OUT_OF_POSITION_DEF = 25;
  // Field positions whose starter can't get a rest day with proper cover: no bench player
  // plays it, and no double switch works (another starter who can play it, whose own spot
  // a bench player can fill).
  function rosterCoverGaps(lineupMap, bench) {
    const fits = (p, s) => p && canPlayerFillSlot(p, s);
    return SLOTS.filter(s => s !== 'DH' && lineupMap[s]).filter(s =>
      !bench.some(b => fits(b, s)) &&
      !SLOTS.some(s2 => s2 !== s && fits(lineupMap[s2], s) && bench.some(b => fits(b, s2))));
  }

  function wearPenalty(f) {
    return Math.min(WEAR_MAX_PENALTY, Math.floor((f || 0) / WEAR_PER_POINT));
  }

  function withWearBatter(p, pen) {
    if (!p || !pen) return p;
    const sub = v => (v === undefined ? v : v - pen);
    return { ...p, con: sub(p.con), pwr: sub(p.pwr), eye: sub(p.eye), spd: sub(p.spd), k_avd: sub(p.k_avd), _wear: pen };
  }

  function momentumFor(streak) {
    const s = streak || 0;
    return Math.sign(s) * Math.min(MOMENTUM_CAP, Math.floor(Math.abs(s) / MOMENTUM_STEP));
  }

  function withMomentumBatter(p, m) {
    if (!p || !m) return p;
    const add = v => (v === undefined ? v : v + m);
    return { ...p, con: add(p.con), pwr: add(p.pwr), eye: add(p.eye), spd: add(p.spd), k_avd: add(p.k_avd) };
  }

  function withMomentumPitcher(p, m) {
    if (!p || !m) return p;
    const add = v => (v === undefined ? v : v + m);
    return { ...p, h9: add(p.h9), k9: add(p.k9), bb9: add(p.bb9), hr9: add(p.hr9) };
  }

  function aiBeats(a, b, rnd, useMomentum = true) {
    const sa = a.strength + (useMomentum ? momentumFor(a.streak) : 0);
    const sb = b.strength + (useMomentum ? momentumFor(b.streak) : 0);
    return (rnd || Math.random)() < winProbability(sa, sb, 0);
  }

  function leagueStandings(league, lg) {
    const rows = leagueTeamIds(league, lg).map(id => league.teams[id]);
    rows.sort((x, y) => (y.w - y.l) - (x.w - x.l) || y.w - x.w || y.strength - x.strength);
    const lead = rows[0];
    return rows.map((t, i) => ({
      ...t,
      rank: i + 1,
      gb: i === 0 ? 0 : ((lead.w - t.w) + (t.l - lead.l)) / 2,
      pct: (t.w + t.l) > 0 ? t.w / (t.w + t.l) : 0
    }));
  }

  // Blend of results so far and roster strength; strength alone before opening day.
  function powerScores(league) {
    const ids = Object.keys(league.teams);
    const strengths = ids.map(id => league.teams[id].strength);
    const sMin = Math.min(...strengths), sMax = Math.max(...strengths);
    const played = league.day;
    const resultWeight = Math.min(0.75, played / 60);
    const scores = {};
    ids.forEach(id => {
      const t = league.teams[id];
      const sNorm = sMax > sMin ? (t.strength - sMin) / (sMax - sMin) : 0.5;
      const pct = (t.w + t.l) > 0 ? t.w / (t.w + t.l) : 0.5;
      const recent = t.last10.length ? t.last10.reduce((s, v) => s + v, 0) / t.last10.length : 0.5;
      scores[id] = (1 - resultWeight) * sNorm + resultWeight * (0.8 * pct + 0.2 * recent);
    });
    return scores;
  }

  function powerOrder(league) {
    const scores = powerScores(league);
    return Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  }

  // A team is mathematically in once fewer than PLAYOFF_SEEDS rivals can still reach its win total.
  function clinchStatus(league, teamId) {
    const team = league.teams[teamId];
    const remaining = id => SEASON_LENGTH - (league.teams[id].w + league.teams[id].l);
    const rivals = leagueTeamIds(league, team.league).filter(id => id !== teamId);
    const canCatch = rivals.filter(id => league.teams[id].w + remaining(id) >= team.w).length;
    const myMax = team.w + remaining(teamId);
    const ahead = rivals.filter(id => league.teams[id].w > myMax).length;
    return { clinched: canCatch < PLAYOFF_SEEDS, eliminated: ahead >= PLAYOFF_SEEDS };
  }

  // ── League-wide leaders & awards (global: all 32 teams together) ────────
  function batterPA(b) { return (b.ab || 0) + (b.bb || 0); }
  function batterAVG(b) { return b.ab ? b.h / b.ab : 0; }
  function batterOPS(b) {
    const pa = batterPA(b);
    if (!pa || !b.ab) return 0;
    const singles = b.h - b.doubles - b.triples - b.hr;
    const tb = singles + 2 * b.doubles + 3 * b.triples + 4 * b.hr;
    return (b.h + b.bb) / pa + tb / b.ab;
  }
  function pitcherERA(p) { return p.outs ? (p.er * 27) / p.outs : 99; }

  function rankBy(list, score, n) {
    return list.map(x => ({ x, v: score(x) }))
      .filter(o => Number.isFinite(o.v))
      .sort((a, b) => b.v - a.v)
      .slice(0, n);
  }

  // Qualifying thresholds scale with games played so races are meaningful all season.
  function leagueQualifiers(league) {
    const day = Math.max(1, league.day);
    const stats = league.stats || { bat: {}, pit: {} };
    const bat = Object.values(stats.bat);
    const pit = Object.values(stats.pit);
    return {
      day, bat, pit,
      batQual: bat.filter(b => batterPA(b) >= 3.1 * day),
      batRegular: bat.filter(b => batterPA(b) >= 2.0 * day),
      spQual: pit.filter(p => p.gs > 0 && p.outs / 3 >= 0.8 * day),
      rpQual: pit.filter(p => !p.gs && p.g >= 0.2 * day)
    };
  }

  function computeAwards(league) {
    const q = leagueQualifiers(league);
    const war = b => parseFloat(calcBatterWAR(b, b.pos, b.def));
    const dwar = b => parseFloat(calcBatterDWAR(b, b.pos, b.def));
    const awards = {
      mvp: rankBy(q.batRegular, war, 5),
      cyYoung: rankBy(q.spQual, p => parseFloat(calcPitcherWAR(p, 'SP')), 5),
      reliever: rankBy(q.rpQual, p => parseFloat(calcPitcherWAR(p, 'RP')), 5),
      platinum: rankBy(q.batRegular.filter(b => b.pos !== 'DH'), dwar, 5),
      hrKing: rankBy(q.bat, b => b.hr, 5),
      battingTitle: rankBy(q.batQual, batterAVG, 5),
      silverSlugger: {},
      goldGlove: {}
    };
    SLOTS.forEach(pos => {
      const atPos = q.batRegular.filter(b => b.pos === pos);
      awards.silverSlugger[pos] = rankBy(atPos, batterOPS, 3);
      // Gold Glove by dWAR within the position (user's call): glove quality times playing time.
      if (pos !== 'DH') awards.goldGlove[pos] = rankBy(atPos, dwar, 3);
    });
    return awards;
  }

  function playoffBracketFromStandings(league) {
    const seeds = {
      AL: leagueStandings(league, 'AL').slice(0, PLAYOFF_SEEDS).map(t => t.id),
      NL: leagueStandings(league, 'NL').slice(0, PLAYOFF_SEEDS).map(t => t.id)
    };
    const r1 = [];
    ['AL', 'NL'].forEach(lg => {
      r1.push({ league: lg, a: seeds[lg][0], b: seeds[lg][3], winner: null });
      r1.push({ league: lg, a: seeds[lg][1], b: seeds[lg][2], winner: null });
    });
    return { seeds, rounds: [r1, [], []] };
  }

  window.Challenge162 = {
    unlockedBatters: new Set(),
    unlockedPitchers: new Set(),
    state: null,

    // ── Unlock store (badge eligibility & mode gating) ───────────────────
    isModeUnlocked() {
      try {
        return localStorage.getItem('baserogue_challenge162_unlocked') === '1';
      } catch (e) { /* storage check fallback */ }
      return false;
    },
    unlockMode() {
      try {
        localStorage.setItem('baserogue_challenge162_unlocked', '1');
      } catch (e) {}
      this.updateModeSelectCard();
    },
    lockMode() {
      try {
        localStorage.removeItem('baserogue_challenge162_unlocked');
      } catch (e) {}
      this.updateModeSelectCard();
    },
    updateModeSelectCard() {
      const card = document.getElementById('card-mode-challenge162');
      const btn = document.getElementById('btn-select-challenge-mode');
      if (!card || !btn) return;

      const icon = card.querySelector('.mode-icon');
      const desc = document.getElementById('challenge162-card-desc') || card.querySelector('.mode-desc');
      const unlocked = this.isModeUnlocked();

      const titleEl = card.querySelector('.mode-title');
      if (titleEl && typeof window.t === 'function') {
        titleEl.textContent = window.t('mode_select.challenge162_title', '162-0 CHALLENGE');
      }
      const subtitleEl = card.querySelector('.mode-subtitle');
      if (subtitleEl && typeof window.t === 'function') {
        subtitleEl.textContent = window.t('mode_select.challenge162_subtitle', 'TEMPORADA PERFECTA');
      }

      if (unlocked) {
        card.classList.remove('is-locked');
        card.removeAttribute('title');
        if (icon) icon.textContent = '🏆';
        if (desc) {
          desc.textContent = typeof window.t === 'function' ? window.t('mode_select.challenge162_desc') : 'Arma tu equipo con cartas desbloqueadas y simula una temporada de 162 juegos en busca de un récord perfecto.';
        }
        const hasActiveSave = this.hasSave() && this.load() && this.state && !this.state.finished;
        btn.disabled = false;
        btn.removeAttribute('data-locked');
        const btnText = hasActiveSave
          ? (typeof window.t === 'function' ? (window.t('mode_select.challenge162_continue_btn') || '⚾ CONTINUAR TEMPORADA') : '⚾ CONTINUAR TEMPORADA')
          : (typeof window.t === 'function' ? (window.t('mode_select.challenge162_btn') || '🏆 ARMAR EQUIPO') : '🏆 ARMAR EQUIPO');
        btn.innerHTML = btnText;
      } else {
        card.classList.add('is-locked');
        const lockedDesc = typeof window.t === 'function' 
          ? (window.t('mode_select.challenge162_locked_desc') || '🔒 Modo Bloqueado. Gana tu primera run en Partida Rápida para desbloquear el desafío 162-0.')
          : '🔒 Modo Bloqueado. Gana tu primera run en Partida Rápida para desbloquear el desafío 162-0.';
        const lockedBtn = typeof window.t === 'function'
          ? (window.t('mode_select.challenge162_locked_btn') || '🔒 BLOQUEADO (GANA PARTIDA RÁPIDA)')
          : '🔒 BLOQUEADO (GANA PARTIDA RÁPIDA)';
        card.setAttribute('title', lockedDesc);
        if (icon) icon.textContent = '🔒';
        if (desc) desc.textContent = lockedDesc;
        btn.disabled = true;
        btn.setAttribute('data-locked', 'true');
        btn.innerHTML = lockedBtn;
      }
    },

    // ── Records & Hall of Fame ──────────────────────────────────────────
    getRecords() {
      try {
        const raw = localStorage.getItem(RECORDS_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return {
        maxStreak: 0,
        worldSeriesWins: 0,
        completedSeasons: 0,
        modeClears: { all_star: 0, mono_team: 0, mono_era: 0 },
        teamClears: {},
        eraClears: {}
      };
    },
    saveRecords(records) {
      try {
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
      } catch (e) {}
    },
    recordSeasonFinished(state, wonWS) {
      if (!state) return;
      const records = this.getRecords();
      records.completedSeasons = (records.completedSeasons || 0) + 1;
      if (state.wins > (records.maxStreak || 0)) {
        records.maxStreak = state.wins;
      }
      if (wonWS) {
        records.worldSeriesWins = (records.worldSeriesWins || 0) + 1;
        const mode = state.modeConfig || { type: 'all_star' };
        if (!records.modeClears) records.modeClears = {};
        records.modeClears[mode.type] = (records.modeClears[mode.type] || 0) + 1;
        if (mode.type === 'mono_team' && mode.targetTeam) {
          if (!records.teamClears) records.teamClears = {};
          records.teamClears[mode.targetTeam] = (records.teamClears[mode.targetTeam] || 0) + 1;
        }
        if (mode.type === 'mono_era' && mode.targetEra) {
          if (!records.eraClears) records.eraClears = {};
          records.eraClears[mode.targetEra] = (records.eraClears[mode.targetEra] || 0) + 1;
        }
      }
      this.saveRecords(records);
    },

    // ── Challenge Sub-Modes Configuration ────────────────────────────────
    _modeConfig: { type: 'all_star', label: '👑 ALL-STAR DREAM TEAM', desc: 'Colección Libre' },
    setModeConfig(cfg) {
      this._modeConfig = cfg || { type: 'all_star', label: '👑 ALL-STAR DREAM TEAM', desc: 'Colección Libre' };
    },
    getModeConfig() {
      return this._modeConfig || { type: 'all_star', label: '👑 ALL-STAR DREAM TEAM', desc: 'Colección Libre' };
    },

    initUnlocks() {
      try {
        const raw = localStorage.getItem(UNLOCKS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.unlockedBatters = new Set(parsed.batters || []);
          this.unlockedPitchers = new Set(parsed.pitchers || []);
        }
      } catch (e) { /* corrupt/missing storage — start fresh */ }
    },
    saveUnlocks() {
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify({
        batters: Array.from(this.unlockedBatters),
        pitchers: Array.from(this.unlockedPitchers)
      }));
    },
    unlockFromRun(Game) {
      if (!Game) return;
      let added = false;
      Object.values(Game.runRosterHistory || {}).forEach(p => {
        if (p.playerID && p.year) {
          const key = `${p.playerID}_${p.year}`;
          if (!this.unlockedBatters.has(key)) { this.unlockedBatters.add(key); added = true; }
        }
      });
      if (Game.selectedMode === 'quick') {
        (Game.runDefeatedPitchers || []).forEach(p => {
          const key = pitcherUnlockKey(p);
          if (!this.unlockedPitchers.has(key)) { this.unlockedPitchers.add(key); added = true; }
        });
      }
      if (added) this.saveUnlocks();
    },
    isDexUnlocked(player) {
      if (!player) return false;
      if (!window.BaseballDex) return false;
      if (typeof window.BaseballDex._getPlayerKeys === 'function') {
        const keys = window.BaseballDex._getPlayerKeys(player);
        if (keys.some(k => window.BaseballDex.unlocked && window.BaseballDex.unlocked.has(k))) return true;
      }
      if (typeof window.BaseballDex._getOpponentKeys === 'function') {
        const oppKeys = window.BaseballDex._getOpponentKeys(player);
        if (oppKeys.some(k => window.BaseballDex.unlockedOpponents && window.BaseballDex.unlockedOpponents.has(k))) return true;
      }
      return false;
    },
    isBatterUnlocked(p) {
      if (!p) return false;
      return !!(p.playerID && this.unlockedBatters && this.unlockedBatters.has(batterUnlockKey(p)));
    },
    isPitcherUnlocked(p) {
      if (!p) return false;
      return !!(this.unlockedPitchers && this.unlockedPitchers.has(pitcherUnlockKey(p)));
    },
    isUnlocked(player) {
      if (!player) return false;
      const looksLikePitcher = player.h9 !== undefined || player.role === 'SP' || player.role === 'RP';
      return looksLikePitcher ? this.isPitcherUnlocked(player) : this.isBatterUnlocked(player);
    },
    getEligibleBatters() {
      const mode = this.getModeConfig();
      const isMono = (mode.type === 'mono_team' || mode.type === 'mono_era');
      let pool = getBatterPool().filter(p => isMono ? (this.isBatterUnlocked(p) || this.isDexUnlocked(p)) : this.isBatterUnlocked(p));
      if (mode.type === 'mono_team' && mode.targetTeam) {
        const history = (window.PlayerTeamHistory && window.PlayerTeamHistory.batters) || {};
        pool = pool.filter(p => {
          if (p.team === mode.targetTeam) return true;
          if (history[p.playerID] && history[p.playerID][mode.targetTeam]) return true;
          return false;
        });
      } else if (mode.type === 'mono_era' && mode.targetEra) {
        pool = pool.filter(p => p.era === mode.targetEra);
      }
      return pool;
    },
    getEligiblePitchers() {
      const mode = this.getModeConfig();
      const isMono = (mode.type === 'mono_team' || mode.type === 'mono_era');
      let pool = getPitcherPool().filter(p => isMono ? (this.isPitcherUnlocked(p) || this.isDexUnlocked(p)) : this.isPitcherUnlocked(p));
      if (mode.type === 'mono_team' && mode.targetTeam) {
        const history = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};
        pool = pool.filter(p => {
          if (p.team === mode.targetTeam) return true;
          if (history[p.playerID] && history[p.playerID][mode.targetTeam]) return true;
          return false;
        });
      } else if (mode.type === 'mono_era' && mode.targetEra) {
        pool = pool.filter(p => p.era === mode.targetEra);
      }
      return pool;
    },

    // Testing helper — same idea as BaseballDex.unlockAll(), for trying out
    // rosters without grinding wins first. Console-only, not wired to any UI.
    unlockAllForTesting() {
      this.unlockedBatters = new Set(getBatterPool().map(batterUnlockKey));
      this.unlockedPitchers = new Set(getPitcherPool().filter(p => p.playerID || cleanName(p)).map(pitcherUnlockKey));
      this.saveUnlocks();
      if (window.BaseballDex && typeof window.BaseballDex.unlockAll === 'function' && !this._syncing) {
        this._syncing = true;
        window.BaseballDex.unlockAll();
        this._syncing = false;
      }
      console.log(`⚾ Challenge162: ${this.unlockedBatters.size} bateadores y ${this.unlockedPitchers.size} pitchers desbloqueados para pruebas.`);
      return `${this.unlockedBatters.size} bateadores / ${this.unlockedPitchers.size} pitchers desbloqueados.`;
    },

    _debugSimPaOutcome: simPaOutcome,
    _debugGeneratePlayoffEnemyTeam: generatePlayoffEnemyTeam,
    _debugGetFranchiseDecadeTeam: getFranchiseDecadeTeam,
    _debugPickSecondFranchisePitcher: _pickSecondFranchisePitcher,

    // ── Persistence (career.js pattern) ───────────────────────────────────
    _serialize() {
      return { v: 1, state: this.state };
    },
    save() {
      if (!this.state) return;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this._serialize())); } catch (e) { /* storage unavailable */ }
    },
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || data.v !== 1) return false;
        this.state = data.state;
        if (this.state && this.state.modeConfig) {
          this.setModeConfig(this.state.modeConfig);
        }
        if (this.state && !this.state.league) this._migrateToRealLeague();
        if (this.state && this.state.league) {
          // Leagues from before unique rosters get theirs built now (rivals re-rolled once).
          if (!this.state.league.rosters) {
            this.state.league.rosters = buildLeagueRosters(this.state.league.teams, this._userCards(this.state.roster));
            this.save();
          }
          registerLeagueRosters(this.state.league);
        }
        return true;
      } catch (e) { return false; }
    },
    hasSave() { return !!localStorage.getItem(SAVE_KEY); },
    clear() {
      this.state = null;
      localStorage.removeItem(SAVE_KEY);
    },

    // ── Real league ─────────────────────────────────────────────────────────
    // Every card on a user roster ({ lineup, bench, pitchers }), for league uniqueness.
    _userCards(r) {
      if (!r) return [];
      return [...SLOTS.map(s => r.lineup && r.lineup[s]), ...(r.bench || []),
        ...((r.pitchers && r.pitchers.SP) || []), ...((r.pitchers && r.pitchers.RP) || [])].filter(Boolean);
    },

    _userLineupArray(S) {
      return S.roster.battingOrder.map(slot => S.roster.lineup[slot]).filter(Boolean);
    },

    _userStrength(S) {
      const sp = (S.roster.pitchers && S.roster.pitchers.SP && S.roster.pitchers.SP[0]) || null;
      return teamStrength(this._userLineupArray(S), sp);
    },

    // Default league for the user: whichever one most of the roster's franchises belong to.
    _suggestUserLeague(S) {
      const cards = [
        ...SLOTS.map(s => S.roster.lineup[s]).filter(Boolean),
        ...((S.roster.pitchers && S.roster.pitchers.SP) || []),
        ...((S.roster.pitchers && S.roster.pitchers.RP) || [])
      ];
      let al = 0, nl = 0;
      cards.forEach(c => { if (AL_CODES.includes(c.team)) al++; else if (NL_CODES.includes(c.team)) nl++; });
      return nl > al ? 'NL' : 'AL';
    },

    _createLeagueForState(S, userLeague, decadeByCode) {
      S.league = createLeague(userLeague || this._suggestUserLeague(S), this._userStrength(S), this.getUserTeamName(), decadeByCode, this._userCards(S.roster));
      S.schedule = scheduleFromLeague(S.league);
      S.leagueTeams = Object.values(S.league.teams).filter(t => !t.isUser).map(t => ({ code: t.code, decade: t.decade }));
      S.league.powerRanks.push({ day: 0, order: powerOrder(S.league) });
    },

    // Saves from before the real league: build the league, keep the franchise-decades the
    // user already faced, and replay the days already played for everyone else. The user's
    // past opponents get a result drawn from the user's own win rate on each of those days.
    _migrateToRealLeague() {
      const S = this.state;
      if (!S || !S.roster) return;
      const decadeByCode = {};
      (S.leagueTeams || []).forEach(t => { if (t && t.code) decadeByCode[t.code] = t.decade; });
      const played = S.gamesPlayed || 0;
      this._createLeagueForState(S, null, decadeByCode);
      const user = S.league.teams[USER_TEAM_ID];
      const userWinRate = played > 0 ? S.wins / played : 0.5;
      for (let d = 0; d < played; d++) {
        this._advanceLeagueDay(Math.random() < userWinRate, { silent: true });
      }
      user.w = S.wins; user.l = S.losses; user.streak = S.streak || 0;
      if (played >= SEASON_LENGTH && !S.playoffs.bracket) {
        // Grandfather a run that already qualified under the old 100-win rule.
        this._finishRegularSeason({ grandfather: !!(S.playoffs.unlocked || S.playoffs.round > 0) });
      }
      this.save();
    },

    _pushHeadline(text, kind) {
      const L = this.state.league;
      L.headlines.unshift({ day: L.day, text, kind: kind || 'info' });
      if (L.headlines.length > MAX_HEADLINES) L.headlines.length = MAX_HEADLINES;
    },

    // Resolves one league day around the user's game result.
    _advanceLeagueDay(userWon, opts = {}) {
      const S = this.state;
      const L = S.league;
      if (!L || L.day >= SEASON_LENGTH) return;
      const day = L.day;

      leagueDaySlate(L, day).forEach(([a, b]) => {
        const A = L.teams[a], B = L.teams[b];
        let aWon;
        if (a === USER_TEAM_ID) aWon = userWon;
        else if (b === USER_TEAM_ID) aWon = !userWon;
        else {
          // Every other league game is played out too, so league stats and awards are complete.
          const result = this._simLeagueGame(this._aiSide(A, true), this._aiSide(B, true), day);
          this._commitLeagueGame(result, day);
          aWon = result.winnerId === a;
        }
        applyTeamResult(A, aWon);
        applyTeamResult(B, !aWon);
      });
      L.day = day + 1;

      ['AL', 'NL'].forEach(lg => { L.leaders[lg] = leagueStandings(L, lg)[0].id; });
      if ((L.day % POWER_RANK_EVERY) === 0 || L.day === SEASON_LENGTH) {
        L.powerRanks.push({ day: L.day, order: powerOrder(L) });
        if (L.powerRanks.length > 30) L.powerRanks.splice(1, 1); // keep the preseason snapshot
      }
      if (opts.silent) return;

      // ── Headlines ──
      const user = L.teams[USER_TEAM_ID];
      Object.values(L.teams).forEach(t => {
        if (t.isUser) return;
        if ([8, 12, 16, 20].includes(t.streak)) this._pushHeadline(`🔥 The ${t.name} have won ${t.streak} straight.`, 'streak');
        if ([10, 15, 20].includes(-t.streak)) this._pushHeadline(`🧊 The ${t.name} have dropped ${-t.streak} in a row.`, 'slump');
      });
      // Leader headlines only fire for a real lead (>= 1 game) and only when the leader
      // differs from the last one announced, so two teams trading 1st don't spam the feed.
      if (!L.announcedLeaders) L.announcedLeaders = { AL: null, NL: null };
      ['AL', 'NL'].forEach(lg => {
        const table = leagueStandings(L, lg);
        const leader = table[0];
        const lead = table[1] ? table[1].gb : 0;
        if (L.day >= 10 && lead >= 1 && leader.id !== L.announcedLeaders[lg]) {
          if (L.announcedLeaders[lg]) {
            this._pushHeadline(`👑 ${leader.name} take over 1st place in the ${lg}.`, leader.isUser ? 'user' : 'race');
          }
          L.announcedLeaders[lg] = leader.id;
        }
      });
      if (userWon && [10, 20, 30, 40, 50, 75, 100, 125, 150].includes(user.streak)) {
        this._pushHeadline(`⚾ ${user.name} extend their win streak to ${user.streak}.`, 'user');
      }
      if (!userWon && user.l === 1) this._pushHeadline(`💔 The perfect season is over: ${user.name} suffer their first loss on day ${L.day}.`, 'user');
      const cs = clinchStatus(L, USER_TEAM_ID);
      if (cs.clinched && !L.clinched) {
        L.clinched = true;
        this._pushHeadline(`🎟️ ${user.name} clinch a ${user.league} playoff spot!`, 'user');
      }
      if (cs.eliminated && !L.eliminated) {
        L.eliminated = true;
        this._pushHeadline(`❌ ${user.name} are mathematically eliminated from the ${user.league} playoff race.`, 'user');
      }
    },

    // Seeds the bracket and decides whether the user is in.
    _finishRegularSeason(opts = {}) {
      const S = this.state;
      const L = S.league;
      if (!L || S.playoffs.bracket) return;
      const bracket = playoffBracketFromStandings(L);
      const lg = L.teams[USER_TEAM_ID].league;
      if (opts.grandfather && !bracket.seeds[lg].includes(USER_TEAM_ID)) {
        // Old save that already qualified: the user takes the 4th seed.
        const dropped = bracket.seeds[lg][PLAYOFF_SEEDS - 1];
        bracket.seeds[lg][PLAYOFF_SEEDS - 1] = USER_TEAM_ID;
        bracket.rounds[0].forEach(m => { if (m.a === dropped) m.a = USER_TEAM_ID; if (m.b === dropped) m.b = USER_TEAM_ID; });
      }
      S.playoffs.bracket = bracket;
      if (L.stats) {
        // Freeze the season awards and announce the big ones.
        const aw = computeAwards(L);
        const winner = list => list && list[0] && list[0].x;
        S.awards = {
          mvp: winner(aw.mvp), cyYoung: winner(aw.cyYoung), reliever: winner(aw.reliever),
          platinum: winner(aw.platinum), hrKing: winner(aw.hrKing), battingTitle: winner(aw.battingTitle),
          silverSlugger: Object.fromEntries(Object.entries(aw.silverSlugger).map(([p, l]) => [p, winner(l)])),
          goldGlove: Object.fromEntries(Object.entries(aw.goldGlove).map(([p, l]) => [p, winner(l)]))
        };
        const teamName = id => (L.teams[id] ? L.teams[id].name : id);
        [['mvp', '🏅 MVP'], ['cyYoung', '🧢 Cy Young'], ['reliever', '🔥 Reliever of the Year'], ['platinum', '💎 Platinum Glove']].forEach(([k, label]) => {
          const w = S.awards[k];
          if (w) this._pushHeadline(`${label}: ${w.name} (${teamName(w.team)}).`, w.team === USER_TEAM_ID ? 'user' : 'race');
        });
      }
      // An old save may already be past round 1: replay the rounds it had won.
      for (let r = 0; r < (S.playoffs.round || 0); r++) this._resolvePlayoffRound(r, true);
      const qualified = bracket.seeds[lg].includes(USER_TEAM_ID);
      S.playoffs.unlocked = qualified;
      S.playoffs.userSeed = qualified ? bracket.seeds[lg].indexOf(USER_TEAM_ID) + 1 : null;
      this._pushHeadline(qualified
        ? `🏟️ ${L.teams[USER_TEAM_ID].name} enter the postseason as the ${lg} #${S.playoffs.userSeed} seed.`
        : `📉 ${L.teams[USER_TEAM_ID].name} miss the postseason.`, 'user');
      if (!qualified) {
        S.playoffs.missed = true;
        this._simulateRestOfPlayoffs();
        S.playoffs.finished = true;
        S.playoffs.won = false;
        this.recordSeasonFinished(S, false);
      }
    },

    _playoffMatchup(round) {
      const S = this.state;
      const b = S.playoffs && S.playoffs.bracket;
      if (!b || !b.rounds[round]) return null;
      return b.rounds[round].find(m => m.a === USER_TEAM_ID || m.b === USER_TEAM_ID) || null;
    },

    _playoffOpponentRef(round) {
      const m = this._playoffMatchup(round);
      if (!m) return null;
      const t = this.state.league.teams[m.a === USER_TEAM_ID ? m.b : m.a];
      return t ? { code: t.code, decade: t.decade, id: t.id, name: t.name } : null;
    },

    // Resolves every AI-vs-AI game of a round and builds the next round's matchups.
    _resolvePlayoffRound(round, userWon) {
      const S = this.state;
      const L = S.league;
      const b = S.playoffs.bracket;
      if (!b || !b.rounds[round]) return;
      b.rounds[round].forEach(m => {
        if (m.winner) return;
        if (m.a === USER_TEAM_ID) m.winner = userWon ? m.a : m.b;
        else if (m.b === USER_TEAM_ID) m.winner = userWon ? m.b : m.a;
        else {
          const res = this._simLeagueGame({ ...this._aiSide(L.teams[m.a], false), noRest: true }, { ...this._aiSide(L.teams[m.b], false), noRest: true }, SEASON_LENGTH + round * 2, { homeFieldIdx: 0 });
          m.winner = res.winnerId;
          m.score = `${res.runs[0]}-${res.runs[1]}`;
        }
      });
      if (round === 0) {
        b.rounds[1] = ['AL', 'NL'].map(lg => {
          const w = b.rounds[0].filter(m => m.league === lg).map(m => m.winner);
          return { league: lg, a: w[0], b: w[1], winner: null };
        });
      } else if (round === 1) {
        const al = b.rounds[1].find(m => m.league === 'AL').winner;
        const nl = b.rounds[1].find(m => m.league === 'NL').winner;
        b.rounds[2] = [{ league: 'WS', a: al, b: nl, winner: null }];
      } else if (round === 2) {
        b.champion = b.rounds[2][0].winner;
        this._pushHeadline(`🏆 The ${L.teams[b.champion].name} win the World Series!`, b.champion === USER_TEAM_ID ? 'user' : 'race');
      }
    },

    // After the user is out (or never got in), play the rest of the bracket for the record.
    _simulateRestOfPlayoffs() {
      const b = this.state.playoffs.bracket;
      if (!b) return;
      for (let r = 0; r < 3; r++) {
        if (!b.rounds[r] || !b.rounds[r].length) break;
        if (b.rounds[r].every(m => m.winner)) continue;
        this._resolvePlayoffRound(r, false);
      }
    },

    // ── Roster building ────────────────────────────────────────────────────
    _optimizeBattingOrder(lineup) {
      const slots = SLOTS.filter(s => lineup && lineup[s]);
      if (slots.length < 9) return slots;
      const mapped = slots.map(slot => ({ ...lineup[slot], _slotKey: slot }));
      const optimized = optimizeLineupArray(mapped);
      return optimized.map(p => p._slotKey);
    },

    // opts: { league, teamName, battingOrder } from the League Preview, or a 'AL'/'NL' string.
    startNewChallenge(lineup, pitchers, customModeConfig, bench = [], opts = null) {
      const cfg = customModeConfig || this.getModeConfig();
      const o = (opts && typeof opts === 'object') ? opts : {};
      const battingOrder = (o.battingOrder && o.battingOrder.length === 9) ? o.battingOrder.slice() : this._optimizeBattingOrder(lineup);
      this.state = {
        v: 1,
        modeConfig: cfg,
        roster: { lineup, battingOrder, pitchers, bench: bench || [] },
        leagueTeams: [],
        schedule: [],
        gamesPlayed: 0, wins: 0, losses: 0, streak: 0,
        batterStats: {}, pitcherStats: {}, oppBatterStats: {},
        gameLog: [],
        playoffs: { unlocked: false, round: 0, finished: false, won: false }
      };
      SLOTS.forEach(slot => {
        const p = lineup[slot];
        if (p) this.state.batterStats[batterUnlockKey(p)] = { name: p.name, g: 0, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
      });
      (bench || []).forEach(p => {
        if (p) this.state.batterStats[batterUnlockKey(p)] = { name: p.name, g: 0, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
      });
      [...pitchers.SP, ...pitchers.RP].forEach(p => {
        this.state.pitcherStats[pitcherUnlockKey(p)] = { name: p.name, role: p.role, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
      });
      if (o.teamName) this.state.teamName = o.teamName;
      // Iron Men are picked in the League Preview (max 3) and locked for the season.
      if (o.ironMan) this.state.ironMan = Object.fromEntries(Object.keys(o.ironMan).slice(0, MAX_IRON_MAN).map(k => [k, true]));
      if (o.league) {
        const S = this.state;
        S.league = o.league;
        registerLeagueRosters(S.league);
        S.league.teams[USER_TEAM_ID].name = this.getUserTeamName();
        S.league.teams[USER_TEAM_ID].strength = Math.round(this._userStrength(S) * 10) / 10;
        S.schedule = scheduleFromLeague(S.league);
        S.leagueTeams = Object.values(S.league.teams).filter(t => !t.isUser).map(t => ({ code: t.code, decade: t.decade }));
        if (!S.league.powerRanks.length) S.league.powerRanks.push({ day: 0, order: powerOrder(S.league) });
      } else {
        this._createLeagueForState(this.state, typeof opts === 'string' ? opts : null);
      }
      this.save();
      this.showScreen('screen-challenge-season');
      this.render();
    },

    // Stamina-driven starting pitcher base capacity:
    // Converts pitcher's STA attribute into a baseline target of ~7.0 - 7.6 IP per start for dominant aces.
    // In-game performance (knockout early or extending for CG / gem) dynamically shifts this.
    _getStarterMaxInnings(sp) {
      if (!sp) return 7;
      const sta = sp.sta !== undefined ? sp.sta : (sp.sta_val !== undefined ? sp.sta_val : (sp.stamina !== undefined ? sp.stamina : 75));
      // Base innings target: STA 20 -> 5.8, STA 70 -> 7.0, STA 90 -> 7.4, STA 105+ -> 7.7
      const base = 5.8 + (Math.max(20, Math.min(125, sta)) - 20) * 0.021;
      const roll = (Math.random() - 0.5) * 0.6;
      return Math.max(5, Math.min(8, Math.round(base + roll)));
    },

    // Bullpen delegation driven by role, situation, and inning:
    // In full mode (25 players): userRelievers = [rp1, rp2, rp3, rp4, setup, closer] (length >= 5)
    // In challenge mode (17 players): userRelievers = [rp, setup, closer] (length <= 3)
    _pitcherForInning(inning, sp, relievers, spMaxInnings, gameIdx, userRuns, oppRuns, spRunsAllowed = 0, spHitsAllowed = 0) {
      // 1. Dynamic Starter Retention:
      // SP pitches through spMaxInnings (typically 7 innings for aces).
      // Gem retention: Complete Game on Shutout / No-Hitter.
      if (inning > spMaxInnings && inning <= 9) {
        const isNoHitter = (spHitsAllowed === 0);
        const isShutout = (spRunsAllowed === 0);
        if (isNoHitter || isShutout) {
          return sp;
        }
      }

      // If starter is within capacity and hasn't been knocked out, starter pitches:
      if (inning <= spMaxInnings) return sp;

      // 2. Unpack bullpen hierarchy
      const isShortBullpen = (relievers.length <= 3);
      // In short mode userRelievers is passed as [singleRP, setup, closer]:
      const closer = isShortBullpen ? (relievers[2] || relievers[0]) : (relievers.find(r => r && (r.role === 'CL' || r.pos === 'CL')) || relievers[relievers.length - 1]);
      const setup  = isShortBullpen ? (relievers[1] || relievers[0]) : (relievers.find(r => r && (r.role === 'SETUP' || r.pos === 'SETUP')) || relievers[Math.max(0, relievers.length - 2)]);
      const singleRP = isShortBullpen ? (relievers[0] || setup || closer) : null;
      const midRelievers = !isShortBullpen ? relievers.filter(r => r && r !== closer && r !== setup) : [];

      const runDiff = userRuns - oppRuns;
      const isSaveSituation = (runDiff >= 1 && runDiff <= 3);

      // ── SHORT BULLPEN MODE (ROSTERS OF 17: Exactly 3 Relievers [RP, SETUP, CL]) ──
      // Target workload in a 150-160 win season:
      // Closer: ~55-65 IP (all saves, close ties/deficits, and ~50% of 4-6 run leads)
      // Setup: ~55-65 IP (close 8ths, maintenance 8ths/9ths)
      // RP: ~55-65 IP (7th innings, blowouts, early knockout relief)
      if (isShortBullpen) {
        // ── 9th Inning ──
        if (inning === 9) {
          if (isSaveSituation) {
            return (gameIdx % 20 !== 0) ? closer : setup;
          }
          if (runDiff === 0 || runDiff === -1) {
            return (gameIdx % 5 !== 0) ? closer : setup;
          }
          if (runDiff >= 4 && runDiff <= 6) {
            // Maintenance appearance for Closer / Setup in comfortable wins
            const roll = (gameIdx + inning) % 10;
            if (roll < 5) return closer;
            if (roll < 8) return setup;
            return singleRP;
          }
          // Large blowouts (7+ runs):
          return (gameIdx % 2 === 0) ? singleRP : setup;
        }

        // ── 8th Inning ──
        if (inning === 8) {
          if (isSaveSituation || (runDiff >= -1 && runDiff <= 4)) {
            const roll = gameIdx % 10;
            if (roll === 0) return closer; // rare 2-inning save bridge
            if (roll < 8) return setup;
            return singleRP;
          }
          // Blowouts in 8th: Single RP takes 70%, Setup takes 30%
          return (gameIdx % 3 === 0) ? setup : singleRP;
        }

        // ── 7th Inning ──
        if (inning === 7) {
          return (gameIdx % 4 === 0) ? setup : singleRP;
        }

        // ── Extra Innings (10+) ──
        if (inning >= 10) {
          const rotation = [singleRP, setup, closer];
          return rotation[(inning - 10 + gameIdx) % 3];
        }

        // ── Early pull before 7th (innings 1-6) ──
        return (gameIdx % 3 === 0) ? setup : singleRP;
      }

      // ── FULL BULLPEN MODE (ROSTERS OF 25: 6 Relievers [RP1..RP4, SETUP, CL]) ──
      // Original unchanged logic for the standard 25-man roster.
      const getMiddleReliever = (offset = 0) => {
        if (!midRelievers.length) return setup || closer || sp;
        return midRelievers[(gameIdx + offset) % midRelievers.length];
      };

      // ── 9th inning (Closer finishes in saves, ties, close leads / deficits) ─
      // Authentic MLB closer workload: ~60-72 IP across 162 games.
      if (inning === 9) {
        if (isSaveSituation) {
          // Closer pitches 95% of save opportunities; Setup covers rare rest days
          if (gameIdx % 16 !== 0) {
            return closer;
          }
          return setup;
        }
        if (runDiff === 0 || runDiff === -1) {
          // Tie game or 1-run deficit in 9th: Closer pitches 75% to hold the line at home/away
          return (gameIdx % 4 !== 0) ? closer : setup;
        }
        if (runDiff >= 4 && runDiff <= 5) {
          // Comfortable lead (4-5 runs): Closer pitches 40%, setup 30%, middle 30%
          if (gameIdx % 5 < 2) return closer;
          if (gameIdx % 5 === 2) return setup;
          return getMiddleReliever(0);
        }
        // Blowout lead (6+) or larger deficit: Middle reliever finishes
        return getMiddleReliever(0);
      }

      // ── Extra Innings (10+) ────────────────────────────────────────────────
      if (inning >= 10) {
        // Extra innings bullpen rotation (RP1-RP4 take over to prevent burning the closer)
        return getMiddleReliever((inning - 10) % midRelievers.length);
      }

      // ── 8th Inning (Setup Inning) ───────────────────────────────────────────
      if (inning === 8) {
        // Setup takes ~65% of close 8th innings; middle relievers absorb the other 35%
        if (runDiff >= -1 && runDiff <= 4) {
          if (gameIdx % 3 !== 0) return setup;
          return getMiddleReliever(1);
        }
        return getMiddleReliever(1);
      }

      // ── 6th and 7th Inning (Bridge / Middle Relief: RP1-RP4) ────────────────
      if (inning === 7) {
        return getMiddleReliever(2);
      }
      if (inning === 6) {
        return getMiddleReliever(3);
      }

      // Early relief (innings 1-5 if starter got pulled early):
      return getMiddleReliever((inning - 1) % Math.max(1, midRelievers.length));
    },

    // The challenge's outcome (W/L) is decided independently of the box score —
    // see the module-level winProbability()/teamStrength() functions and the
    // reroll loop below. Stats always come from _simulateNaturalGame's pure,
    // rating-only math; this just picks WHICH honestly-simulated attempt at
    // the game gets kept, biased toward the target outcome instead of always
    // taking the first roll.
    // User game in the real league: same engine as every other league game.
    _simulateLeagueUserGame() {
      const S = this.state;
      const L = S.league;
      const day = L.day;
      S.pendingAlerts = []; // a new game means the player has seen whatever stopped the sim
      const sched = S.schedule[S.gamesPlayed];
      const oppRec = L.teams[sched.id] || Object.values(L.teams).find(t => t.code === sched.code);
      const userSide = this._userSide(S, true);
      const oppSide = this._aiSide(oppRec, true);
      const userHome = day % 2 === 1;
      const result = userHome ? this._simLeagueGame(oppSide, userSide, day) : this._simLeagueGame(userSide, oppSide, day);
      const ui = userHome ? 1 : 0;
      const userRuns = result.runs[ui];
      const oppRuns = result.runs[1 - ui];
      const won = userRuns > oppRuns;
      this._commitLeagueGame(result, day);

      // The user's own season tables keep their original card keys.
      Object.values(result.bat).forEach(d => {
        if (d.team === USER_TEAM_ID) {
          const s = S.batterStats[d.key];
          if (s) ['g', 'ab', 'h', 'doubles', 'triples', 'hr', 'rbi', 'bb', 'so', 'r', 'sb', 'cs', 'gidp', 'sf', 'e'].forEach(f => { s[f] = (s[f] || 0) + (d[f] || 0); });
        } else {
          if (!S.oppBatterStats) S.oppBatterStats = {};
          const s = S.oppBatterStats[d.name] || (S.oppBatterStats[d.name] = { name: d.name, team: oppRec.code, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0 });
          ['ab', 'h', 'doubles', 'triples', 'hr', 'rbi', 'bb', 'so', 'r'].forEach(f => { s[f] += d[f] || 0; });
        }
      });
      Object.values(result.pit).forEach(d => {
        if (d.team !== USER_TEAM_ID) return;
        const s = S.pitcherStats[d.key];
        if (s) ['outs', 'h', 'er', 'bb', 'so', 'w', 'l', 'sv', 'g', 'gs', 'r', 'cg', 'sho', 'hld', 'bs'].forEach(f => { s[f] = (s[f] || 0) + (d[f] || 0); });
      });

      S.gamesPlayed++;
      if (won) { S.wins++; S.streak = (S.streak || 0) + 1; } else { S.losses++; S.streak = 0; }
      if (!this._autoSimRunning && window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play(won ? 'hit' : 'out');
      }
      const logEntry = { opponent: oppRec.name, userRuns, oppRuns, won, inning: Math.min(result.innings, 20) };
      S.gameLog.push(logEntry);
      if (S.gameLog.length > 30) S.gameLog.shift();

      S.lastGame = this._buildLastGame(result, ui, oppRec, userHome);
      this._advanceLeagueDay(won);
      this._checkMilestones(S.lastGame);
      if (S.gamesPlayed >= SEASON_LENGTH) this._finishRegularSeason();
      this.save();
      return logEntry;
    },

    // What the season screen shows about the game just played.
    _buildLastGame(result, ui, oppRec, userHome) {
      const mine = x => x.team === USER_TEAM_ID;
      const bats = Object.values(result.bat), pits = Object.values(result.pit);
      const tot = (arr, f) => arr.reduce((t, x) => t + (x[f] || 0), 0);
      const dec = k => { const p = pits.find(x => x.decision === k); return p ? { name: p.name, user: mine(p) } : null; };
      const ipOf = p => `${Math.floor(p.outs / 3)}.${p.outs % 3}`;
      const batScore = b => b.h + b.hr * 2 + b.rbi + (b.r || 0) * 0.5 + (b.sb || 0) * 0.5;
      const pitScore = p => p.outs / 3 + p.so * 0.5 - p.er * 2 - 6;
      const bestBat = bats.filter(mine).sort((a, b) => batScore(b) - batScore(a))[0];
      const bestPit = pits.filter(mine).sort((a, b) => pitScore(b) - pitScore(a))[0];
      let star = null;
      if (bestPit && (!bestBat || pitScore(bestPit) > batScore(bestBat))) {
        star = { name: bestPit.name, text: `${ipOf(bestPit)} IP, ${bestPit.h} H, ${bestPit.er} ER, ${bestPit.so} K` };
      } else if (bestBat) {
        star = { name: bestBat.name, text: `${bestBat.h}-${bestBat.ab}${bestBat.hr ? `, ${bestBat.hr} HR` : ''}${bestBat.rbi ? `, ${bestBat.rbi} RBI` : ''}${bestBat.sb ? `, ${bestBat.sb} SB` : ''}` };
      }
      return {
        game: this.state.gamesPlayed, opp: oppRec.name, home: userHome, won: result.runs[ui] > result.runs[1 - ui],
        runs: [result.runs[ui], result.runs[1 - ui]],
        hits: [tot(bats.filter(mine), 'h'), tot(bats.filter(x => !mine(x)), 'h')],
        errors: [tot(bats.filter(mine), 'e'), tot(bats.filter(x => !mine(x)), 'e')],
        line: [result.line[ui], result.line[1 - ui]], innings: result.innings,
        w: dec('W'), l: dec('L'), sv: dec('SV'), star,
        staff: pits.filter(mine).map(p => p.name)
      };
    },

    // Moments worth stopping for. Each one pauses "simulate 10" / "until next loss" / auto sim
    // and shows as a banner on the season screen until the next game is played.
    _checkMilestones(game) {
      const S = this.state, L = S.league;
      if (!S.alertsSeen) S.alertsSeen = {};
      const g = S.gamesPlayed;
      const fire = (key, icon, title, text) => {
        if (S.alertsSeen[key]) return;
        S.alertsSeen[key] = 1;
        S.pendingAlerts.push({ icon, title, text });
        this._pushHeadline(`${icon} ${text}`, 'user');
      };
      const user = L.teams[USER_TEAM_ID];
      const name = user.name;

      // Streaks and the perfect season
      if ([10, 20, 30, 50].includes(user.streak)) fire(`ws${user.streak}@${g}`, '🔥', `${user.streak} STRAIGHT WINS`, `${name} have won ${user.streak} in a row. Momentum is at +${momentumFor(user.streak)}.`);
      if ([8, 12].includes(-user.streak)) fire(`ls${-user.streak}@${g}`, '🧊', `${-user.streak} STRAIGHT LOSSES`, `${name} have dropped ${-user.streak} in a row. Momentum is at −${-momentumFor(user.streak)}.`);
      if (S.losses === 0 && [25, 50, 81, 100, 125, 150, 161].includes(g)) fire(`perfect${g}`, '👑', `STILL PERFECT: ${g}-0`, `${name} are ${g}-0. ${SEASON_LENGTH - g} to go for the perfect season.`);
      if (game.hits[1] === 0 && game.innings >= 9) fire(`nohit@${g}`, '🚫', 'NO-HITTER!', `${game.staff.join(' and ')} no-hit the ${game.opp}.`);

      // Individual milestones
      const marks = (key, who, val, list, icon, label) => {
        list.forEach(n => { if (val >= n) fire(`${key}:${label}${n}`, icon, `${n} ${label}`, `${who} reaches ${n} ${label.toLowerCase()} with ${SEASON_LENGTH - g} games left.`); });
      };
      Object.entries(S.batterStats || {}).forEach(([k, b]) => {
        marks(k, b.name, b.hr || 0, [50, 60, 70], '💣', 'HOME RUNS');
        marks(k, b.name, b.h || 0, [220, 250], '🏏', 'HITS');
        marks(k, b.name, b.sb || 0, [75, 100], '💨', 'STOLEN BASES');
        marks(k, b.name, b.rbi || 0, [160], '🎯', 'RBI');
        if ([100, 120, 140, 155].includes(g) && b.ab >= g * 3 && b.h / b.ab >= 0.390) {
          fire(`${k}:400@${g}`, '🔭', '.400 WATCH', `${b.name} is hitting ${(b.h / b.ab).toFixed(3).replace(/^0/, '')} after ${g} games.`);
        }
        if ([100, 130].includes(g) && (b.hr || 0) / g * SEASON_LENGTH >= 60) {
          fire(`${k}:pace@${g}`, '📈', 'CHASING 60', `${b.name} has ${b.hr} home runs after ${g} games: on pace for ${Math.round(b.hr / g * SEASON_LENGTH)}.`);
        }
      });
      Object.entries(S.pitcherStats || {}).forEach(([k, p]) => {
        marks(k, p.name, p.w || 0, [25, 30], '🏅', 'WINS');
        marks(k, p.name, p.so || 0, [300, 350], '🌪️', 'STRIKEOUTS');
        marks(k, p.name, p.sv || 0, [50], '🔒', 'SAVES');
      });

      // The playoff race, once it matters
      const table = leagueStandings(L, user.league);
      const rank = table.findIndex(t => t.id === USER_TEAM_ID) + 1;
      const inNow = rank <= PLAYOFF_SEEDS;
      // At most one of these every 15 games: a team sitting on the cut line flips back and forth.
      if (g >= 100 && S.inPlayoffSpot !== undefined && S.inPlayoffSpot !== inNow && g - (S.lastCutAlert || 0) >= 15) {
        S.lastCutAlert = g;
        fire(`cut@${g}`, inNow ? '📈' : '📉', inNow ? 'INTO A PLAYOFF SPOT' : 'OUT OF A PLAYOFF SPOT',
          inNow ? `${name} climb to #${rank} in the ${user.league} with ${SEASON_LENGTH - g} to play.` : `${name} fall to #${rank} in the ${user.league} with ${SEASON_LENGTH - g} to play.`);
      }
      S.inPlayoffSpot = inNow;
      if (g === SEASON_LENGTH - 15) {
        const edge = table[PLAYOFF_SEEDS - 1], chaser = table[PLAYOFF_SEEDS];
        const gap = inNow ? user.w - (chaser ? chaser.w : 0) : (edge ? edge.w : 0) - user.w;
        if (gap <= 3) fire('stretch', '⏳', 'FINAL STRETCH', inNow
          ? `15 games left and ${name} hold a playoff spot by just ${gap} ${gap === 1 ? 'game' : 'games'}.`
          : `15 games left and ${name} are ${gap} ${gap === 1 ? 'game' : 'games'} out of a playoff spot.`);
      }
      (L.headlines || []).filter(h => h.day === L.day && h.kind === 'user' && /clinch|mathematically eliminated|first loss/.test(h.text)).forEach(h => {
        if (S.alertsSeen[h.text]) return;
        S.alertsSeen[h.text] = 1;
        const kind = /clinch/.test(h.text) ? ['🎟️', 'PLAYOFFS CLINCHED'] : /eliminated/.test(h.text) ? ['❌', 'ELIMINATED'] : ['💔', 'FIRST LOSS'];
        S.pendingAlerts.push({ icon: kind[0], title: kind[1], text: h.text.replace(/^\S+\s/, '') });
      });
    },

    // Final roster on the results screen: every player with his season line, no scrolling.
    // (It used to be two rows of overlapping trading cards titled "ring of champions" even
    // when the team missed the playoffs, and it left the bench out.)
    _resultsRosterHTML(wonWS) {
      const S = this.state;
      if (!S || !S.roster) return '';
      const avg3 = v => v.toFixed(3).replace(/^0/, '');
      const row = (label, p, text) => {
        if (!p) return '';
        const rar = String(p.rarity || 'Common').toLowerCase();
        return `<div class="c162-rb-row r-${rar}" title="${p.name} · ${p.rarity || ''}">
          <span class="c162-rb-pos">${label}</span>
          <span class="c162-rb-name">${p.name}</span>
          <span class="c162-rb-meta">${text}</span>
          <span class="c162-rb-ovr">${Math.floor(p.ovr || 50)}</span>
        </div>`;
      };
      const batLine = p => {
        const b = (S.batterStats || {})[batterUnlockKey(p)];
        if (!b || !b.ab) return 'did not play';
        return `${avg3(b.h / b.ab)} · ${b.hr} HR · ${b.rbi} RBI${b.sb >= 10 ? ` · ${b.sb} SB` : ''}`;
      };
      const pitLine = p => {
        const x = (S.pitcherStats || {})[pitcherUnlockKey(p)];
        if (!x || !x.outs) return 'did not pitch';
        const era = (x.er * 27 / x.outs).toFixed(2);
        return x.sv >= 5 ? `${x.sv} SV · ${era} ERA` : `${x.w}-${x.l} · ${era} ERA · ${x.so} K`;
      };
      const lineup = S.roster.battingOrder.map(slot => row(slot, S.roster.lineup[slot], S.roster.lineup[slot] ? batLine(S.roster.lineup[slot]) : '')).join('');
      const bench = (S.roster.bench || []).filter(Boolean).map((p, i) => row(`BN${i + 1}`, p, batLine(p))).join('');
      const sp = (S.roster.pitchers.SP || []).filter(Boolean).map((p, i) => row(`SP${i + 1}`, p, pitLine(p))).join('');
      const rpLabels = ['CL', 'SU', 'RP1', 'RP2', 'RP3', 'RP4'];
      const rp = (S.roster.pitchers.RP || []).filter(Boolean).map((p, i) => row(rpLabels[i] || `RP${i - 1}`, p, pitLine(p))).join('');
      const count = S.roster.battingOrder.filter(sl => S.roster.lineup[sl]).length + (S.roster.bench || []).filter(Boolean).length
        + (S.roster.pitchers.SP || []).filter(Boolean).length + (S.roster.pitchers.RP || []).filter(Boolean).length;
      return `<div class="c162-rb stats" style="margin-bottom:14px;">
        <div class="c162-rb-head"><div><b>${wonWS ? '💍 WORLD CHAMPIONS' : '📋 YOUR ROSTER'} · ${count} PLAYERS</b><small>Season line of every player</small></div></div>
        <div class="c162-rb-cols" style="margin-top:10px;">
          <div class="c162-rb-col">
            <div class="c162-rb-title t-lineup"><span>⚡ LINEUP</span></div>${lineup}
            ${bench ? `<div class="c162-rb-title t-bench"><span>🛋️ BENCH</span></div>${bench}` : ''}
          </div>
          <div class="c162-rb-col">
            <div class="c162-rb-title t-rot"><span>🧢 ROTATION</span></div>${sp}
            <div class="c162-rb-title t-pen"><span>🔥 BULLPEN</span></div>${rp}
          </div>
        </div>
      </div>`;
    },

    dismissAlerts() {
      if (this.state) this.state.pendingAlerts = [];
      this.save();
      this.renderSeason();
    },

    _alertsHTML() {
      const a = (this.state && this.state.pendingAlerts) || [];
      if (!a.length) return '';
      return `<div class="c162-alerts">
        <div class="c162-alerts-list">${a.map(x => `<div class="c162-alert"><span class="c162-alert-icon">${x.icon}</span><div><b>${x.title}</b><p>${x.text}</p></div></div>`).join('')}</div>
        <button class="btn c162-alerts-ok" onclick="window.Challenge162.dismissAlerts()">▶ CONTINUE</button>
      </div>`;
    },

    _lastGameHTML() {
      const G = this.state && this.state.lastGame;
      if (!G || !G.line) return '';
      const n = Math.max(9, G.line[0].length, G.line[1].length);
      const cells = arr => Array.from({ length: n }, (_, i) => `<td>${arr[i] !== undefined ? arr[i] : (i < 9 ? 'x' : '')}</td>`).join('');
      const head = Array.from({ length: n }, (_, i) => `<th>${i + 1}</th>`).join('');
      const me = `<tr class="me"><th>${this.getUserTeamName()}</th>${cells(G.line[0])}<td class="rhe r">${G.runs[0]}</td><td class="rhe">${G.hits[0]}</td><td class="rhe">${G.errors[0]}</td></tr>`;
      const them = `<tr><th>${G.opp}</th>${cells(G.line[1])}<td class="rhe r">${G.runs[1]}</td><td class="rhe">${G.hits[1]}</td><td class="rhe">${G.errors[1]}</td></tr>`;
      const tag = (k, d) => (d ? `<span class="${d.user ? 'mine' : ''}"><i>${k}</i> ${d.name}</span>` : '');
      return `<div class="c162-lastgame ${G.won ? 'won' : 'lost'}">
        <div class="c162-lastgame-head">
          <b>${G.won ? 'WIN' : 'LOSS'} ${G.runs[0]}-${G.runs[1]}</b>
          <span>LAST GAME · #${G.game} ${G.home ? 'vs' : '@'} ${G.opp}${G.innings > 9 ? ` · ${G.innings} innings` : ''}</span>
        </div>
        <div class="c162-lastgame-body">
          <div class="c162-table-wrap"><table class="c162-linescore"><thead><tr><th></th>${head}<th class="rhe">R</th><th class="rhe">H</th><th class="rhe">E</th></tr></thead>
            <tbody>${G.home ? them + me : me + them}</tbody></table></div>
          <div class="c162-lastgame-notes">
            <div class="dec">${tag('W', G.w)}${tag('L', G.l)}${tag('SV', G.sv)}</div>
            ${G.star ? `<div class="star">⭐ <b>${G.star.name}</b> ${G.star.text}</div>` : ''}
          </div>
        </div>
      </div>`;
    },

    simulateGame() {
      const S = this.state;
      if (S.league) return this._simulateLeagueUserGame();
      const gameIdx = S.gamesPlayed;
      const spList = S.roster.pitchers.SP;
      const rpList = S.roster.pitchers.RP;
      const userSP = spList[gameIdx % spList.length];

      // Full bullpen roster passed down so each middle reliever (RP1..RP4), Setup and Closer get used:
      let userRelievers;
      if (rpList.length <= 3) {
        // Short mode (17 players): exactly [RP, SETUP, CL] by actual role
        const cl = rpList.find(p => p && (p.role === 'CL' || p.pos === 'CL')) || rpList[0];
        const su = rpList.find(p => p && (p.role === 'SETUP' || p.pos === 'SETUP')) || rpList[1] || rpList[0];
        const rp = rpList.find(p => p && p !== cl && p !== su) || rpList[2] || rpList[1] || rpList[0];
        userRelievers = [rp, su, cl];
      } else {
        const closer = rpList.find(p => p && (p.role === 'CL' || p.pos === 'CL')) || rpList[0];
        const setup  = rpList.find(p => p && (p.role === 'SETUP' || p.pos === 'SETUP')) || rpList[1] || rpList[0];
        const midRelievers = rpList.filter(p => p && p !== closer && p !== setup);
        userRelievers = [...midRelievers, setup, closer];
      }

      const sched = S.schedule[gameIdx];
      let opp = getFranchiseDecadeTeam(sched.code, sched.decade);
      let userLineup = S.roster.battingOrder.map(slot => S.roster.lineup[slot]).filter(Boolean);

      // Momentum (real league only): both sides play with their streak's ±1..±3 ratings.
      // Copies keep name/year, so stat keys still match the real cards.
      let userSPToday = userSP;
      if (S.league) {
        const um = momentumFor(S.league.teams[USER_TEAM_ID].streak);
        const oppTeam = sched.id && S.league.teams[sched.id];
        const om = oppTeam ? momentumFor(oppTeam.streak) : 0;
        if (um) {
          userLineup = userLineup.map(p => withMomentumBatter(p, um));
          userSPToday = withMomentumPitcher(userSP, um);
          userRelievers = userRelievers.map(p => withMomentumPitcher(p, um));
        }
        if (om) {
          opp = { ...opp, lineup: opp.lineup.map(p => withMomentumBatter(p, om)),
            pitcher: withMomentumPitcher(opp.pitcher, om), reliever: withMomentumPitcher(opp.reliever, om) };
        }
      }

      // Pure 100% honest single-attempt simulation directly determined by player ratings:
      const attempt = this._simulateNaturalGame(userLineup, userSPToday, userRelievers, opp, gameIdx);
      const won = attempt.userRuns > attempt.oppRuns;

      // Commit the chosen game attempt's stats into the season totals:
      Object.entries(attempt.batterDeltas).forEach(([key, d]) => {
        const s = S.batterStats[key];
        if (!s) return;
        s.ab += d.ab; s.h += d.h; s.doubles += d.doubles; s.triples += d.triples;
        s.hr += d.hr; s.rbi += d.rbi; s.bb += d.bb; s.so += d.so; s.r += d.r; s.sb += d.sb;
      });
      Object.entries(attempt.pitcherDeltas).forEach(([key, d]) => {
        const s = S.pitcherStats[key];
        if (!s) return;
        s.outs += d.outs; s.h += d.h; s.er += d.er; s.bb += d.bb; s.so += d.so;
      });

      if (attempt.oppBatterDeltas) {
        if (!S.oppBatterStats) S.oppBatterStats = {};
        Object.entries(attempt.oppBatterDeltas).forEach(([key, d]) => {
          if (!S.oppBatterStats[key]) {
            S.oppBatterStats[key] = { name: d.name, team: d.team || '', ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0 };
          }
          const s = S.oppBatterStats[key];
          s.ab += d.ab || 0;
          s.h += d.h || 0;
          s.doubles += d.doubles || 0;
          s.triples += d.triples || 0;
          s.hr += d.hr || 0;
          s.rbi += d.rbi || 0;
          s.bb += d.bb || 0;
          s.so += d.so || 0;
          s.r += d.r || 0;
        });
      }

      S.gamesPlayed++;
      if (won) { S.wins++; S.streak = (S.streak || 0) + 1; } else { S.losses++; S.streak = 0; }

      if (!this._autoSimRunning && window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play(won ? 'hit' : 'out');
      }

      // Pitching Decisions:
      // Starter gets W/L if pitched >= 5 innings (15 outs) or pitched the complete game.
      // Last reliever gets Save if they finished the game in a <=3 run lead and were not the starter.
      const lastPitcher = attempt.lastUserPitcher || userSP;
      const lastKey = pitcherUnlockKey(lastPitcher);
      const spKey = pitcherUnlockKey(userSP);
      const spOuts = attempt.pitcherDeltas[spKey] ? attempt.pitcherDeltas[spKey].outs : 0;
      const decisionKey = (spOuts >= 15 || attempt.inning <= 9) ? spKey : (lastKey || spKey);

      if (S.pitcherStats[decisionKey]) {
        if (won) S.pitcherStats[decisionKey].w++; else S.pitcherStats[decisionKey].l++;
      }
      if (won && (attempt.userRuns - attempt.oppRuns) <= 3 && lastKey !== spKey && S.pitcherStats[lastKey]) {
        S.pitcherStats[lastKey].sv++;
      }

      const logEntry = { opponent: opp.name, userRuns: attempt.userRuns, oppRuns: attempt.oppRuns, won, inning: attempt.inning };
      S.gameLog.push(logEntry);
      if (S.gameLog.length > 30) S.gameLog.shift();

      if (S.league) this._advanceLeagueDay(won);
      if (S.gamesPlayed >= SEASON_LENGTH) {
        if (S.league) this._finishRegularSeason();
        else S.playoffs.unlocked = (S.wins >= PLAYOFF_MIN_WINS);
      }

      this.save();
      return logEntry;
    },

    // One full, honest 9(+)-inning game — pure simPaOutcome, no knowledge of
    // any target outcome. Returns the natural score plus this attempt's stat
    // deltas (not yet written into season totals — simulateGame() does that
    // only for whichever attempt it ends up keeping).
    _simulateNaturalGame(userLineup, userSP, userRelievers, opp, gameIdx) {
      let userRuns = 0, oppRuns = 0;
      let userIdx = 0, oppIdx = 0;
      const inningLimit = 30;
      let inning = 1;
      const batterDeltas = {};
      const pitcherDeltas = {};
      const oppBatterDeltas = {};

      let userMaxInnings = this._getStarterMaxInnings(userSP);
      let oppMaxInnings = this._getStarterMaxInnings(opp.pitcher);

      // User fielding defense efficiency across active fielders (excluding DH)
      const fielders = userLineup.filter(p => (p.assignedSlot || p.pos) !== 'DH');
      const userTeamDef = fielders.length
        ? fielders.reduce((s, p) => s + (p.def !== undefined ? p.def : (p.defense_val || 50)), 0) / fielders.length
        : 50;

      // Each game, 1 batting slot takes a routine rest day (~1 in 9 games off, yielding ~144 games / 540-580 AB per starter):
      const restedSlotIdx = gameIdx % 9;
      let lastUserPitcher = userSP;

      while (inning <= 9 || (userRuns === oppRuns && inning <= inningLimit)) {
        const oppPitcherToday = inning <= oppMaxInnings ? opp.pitcher : opp.reliever;
        oppPitcherToday._fieldingDef = 50; // Neutral opponent defense

        const runDiff = userRuns - oppRuns;
        const isBlowout = Math.abs(runDiff) >= 5 && inning >= 8;

        const userSPKey = pitcherUnlockKey(userSP);
        const spStatsSoFar = pitcherDeltas[userSPKey] || { er: 0, h: 0 };

        // Early pull / Knockout hook:
        // If starter allows 4+ ER in first 4 innings, or 5+ ER by 6th inning, hook them early to save ERA:
        if ((inning <= 4 && spStatsSoFar.er >= 4) || (inning <= 6 && spStatsSoFar.er >= 5)) {
          if (userMaxInnings >= inning) {
            userMaxInnings = inning - 1;
          }
        }

        userRuns += this._playHalfInning(() => {
          const slot = userIdx % userLineup.length;
          const currentBatter = userLineup[slot];
          userIdx++;
          // Routine rest or late-game blowout substitution:
          if (slot === restedSlotIdx || isBlowout) {
            const benchList = (this.state && this.state.roster && this.state.roster.bench) || [];
            if (benchList.length > 0) {
              const bSub = benchList[(gameIdx + slot) % benchList.length];
              if (bSub) return bSub;
            } else {
              // In short 17-player mode without a real bench, give the starter routine rest / blowout sub
              // using a reserve role player to keep total AB in standard 560-630 MLB range
              return {
                name: 'Suplente',
                pos: currentBatter.assignedSlot || currentBatter.pos || 'DH',
                con: 50,
                pwr: 45,
                eye: 45,
                spd: 50,
                ovr: 68,
                _isShortBenchSub: true
              };
            }
            return currentBatter;
          }
          return currentBatter;
        }, oppPitcherToday, true, batterDeltas, pitcherDeltas);

        // Check opponent starter early knockout:
        if (inning <= 4 && userRuns >= 5 && oppMaxInnings > inning) {
          oppMaxInnings = inning - 1;
        }

        const assignedPitcher = this._pitcherForInning(
          inning,
          userSP,
          userRelievers,
          userMaxInnings,
          gameIdx,
          userRuns,
          oppRuns,
          spStatsSoFar.er,
          spStatsSoFar.h
        );
        const midFallback = userRelievers[0] || userRelievers[1] || userRelievers[2] || userSP;
        const userPitcherToday = assignedPitcher || midFallback;
        lastUserPitcher = userPitcherToday;
        userPitcherToday._fieldingDef = userTeamDef; // User team defense backs up pitching
        oppRuns += this._playHalfInning(() => opp.lineup[oppIdx++ % opp.lineup.length], userPitcherToday, false, batterDeltas, pitcherDeltas, oppBatterDeltas);

        inning++;
      }
      return { userRuns, oppRuns, inning: inning - 1, userMaxInnings, lastUserPitcher, batterDeltas, pitcherDeltas, oppBatterDeltas };
    },

    // ── League game engine ────────────────────────────────────────────────
    // Plays any game of the real league (user or AI on either side) plate appearance by
    // plate appearance, with pitcher fatigue, bullpen roles and reliever rest days.

    // Fatigue: a pitcher is "fresh" for a number of batters set by his STA. Past that, every
    // extra batter costs 2 points on each pitching rating, up to −16.
    _freshBatters(p, isStarter) {
      const sta = p.sta !== undefined ? p.sta : (p.sta_val !== undefined ? p.sta_val : 50);
      return isStarter ? 12 + sta * 0.15 : 4 + sta * 0.05;
    },

    _fatiguePenalty(ps) {
      return Math.min(FATIGUE_MAX, FATIGUE_PER_BATTER * Math.max(0, ps.bf - ps.fresh));
    },

    // A side: { id, isUser, lineup, bench, sp, bullpen, def, gameIdx }
    _aiSide(teamRec, useMomentum) {
      const team = getFranchiseDecadeTeam(teamRec.code, teamRec.decade);
      const staff = getFranchiseStaff(teamRec.code, teamRec.decade);
      const m = useMomentum ? momentumFor(teamRec.streak) : 0;
      const gp = teamRec.w + teamRec.l;
      const fielders = team.lineup.filter(p => (p.assignedSlot || p.pos) !== 'DH');
      return {
        id: teamRec.id, isUser: false,
        lineup: team.lineup.map(p => withMomentumBatter(p, m)),
        bench: getFranchiseBench(teamRec.code, teamRec.decade).map(p => withMomentumBatter(p, m)),
        sp: withMomentumPitcher(staff.rotation[gp % staff.rotation.length], m),
        bullpen: staff.bullpen.map(p => withMomentumPitcher(p, m)),
        def: fielders.length ? fielders.reduce((s, p) => s + (p.def !== undefined ? p.def : 50), 0) / fielders.length : 50,
        gameIdx: gp
      };
    },

    _userSide(S, useMomentum) {
      const m = (useMomentum && S.league) ? momentumFor(S.league.teams[USER_TEAM_ID].streak) : 0;
      // assignedSlot carries the lineup position into league stats (Silver Slugger / Gold Glove).
      const lineup = S.roster.battingOrder.map(slot => S.roster.lineup[slot] && ({ ...S.roster.lineup[slot], assignedSlot: slot })).filter(Boolean);
      const spList = S.roster.pitchers.SP;
      const rp = (S.roster.pitchers.RP || []).filter(Boolean);
      const closer = rp.find(p => p.role === 'CL') || rp[0];
      const setup = rp.find(p => p.role === 'SETUP') || rp[1];
      const bullpen = rp.map(p => ({ ...withMomentumPitcher(p, m) || p, role: p === closer ? 'CL' : p === setup ? 'SETUP' : 'RP' }));
      const fielders = lineup.filter(p => (p.assignedSlot || p.pos) !== 'DH');
      return {
        id: USER_TEAM_ID, isUser: true,
        lineup: lineup.map(p => withMomentumBatter(p, m)),
        bench: (S.roster.bench || []).filter(Boolean).map(p => withMomentumBatter(p, m)),
        ironMan: S.ironMan || {},
        sp: withMomentumPitcher(spList[S.gamesPlayed % spList.length], m),
        bullpen,
        def: fielders.length ? fielders.reduce((s, p) => s + (p.def !== undefined ? p.def : (p.defense_val || 50)), 0) / fielders.length : 50,
        gameIdx: S.gamesPlayed
      };
    },

    // Reliever picked for a new inning, by role and situation; skips arms that already
    // pitched this game or are resting (pitched on each of the previous two days).
    _pickReliever(side, gs, inning, lead, day) {
      const pen = (this.state.league && this.state.league.pen) || {};
      const available = side.bullpen.filter(p => {
        const k = this._leagueKey(side.id, pitcherUnlockKey(p));
        if (gs.usedPitchers.has(k)) return false;
        const u = pen[k];
        return !(u && u.last === day - 1 && u.run >= 2);
      });
      if (!available.length) return null;
      const byRole = role => available.find(p => p.role === role);
      // Middle relievers: the one who has rested the longest goes first.
      const lastDay = p => { const u = pen[this._leagueKey(side.id, pitcherUnlockKey(p))]; return u ? u.last : -999; };
      const middle = available.filter(p => p.role !== 'CL' && p.role !== 'SETUP').sort((a, b) => lastDay(a) - lastDay(b));
      const lateClose = lead >= 0 && lead <= 3;
      if (inning >= 9 && (lateClose || inning > 9)) return byRole('CL') || byRole('SETUP') || middle[0] || available[0];
      if (inning === 8 && lead >= -1 && lead <= 4) return byRole('SETUP') || middle[0] || byRole('CL');
      return middle[0] || byRole('SETUP') || byRole('CL') || available[0];
    },

    _leagueKey(teamId, playerKey) { return `${teamId}:${playerKey}`; },

    // Today's lineup: tired regulars (who would play at −1) get the day off when the roster
    // can cover the position, up to two a game; everyone else plays with their wear
    // penalty (Iron Men included: they just get there more slowly). Cover, in order of preference:
    //   1. a fresh bench player who plays the position;
    //   2. a double switch: another starter slides to the position (primary or secondary)
    //      and a fresh bench player takes his spot on the field;
    //   3. at −2, any fresh bench player out of position, with a poor glove that day.
    // The sub always bats in the rested regular's spot in the order.
    _restLineup(side) {
      const W = side.noRest ? {} : ((this.state.league && this.state.league.wear) || {});
      const keyOf = p => this._leagueKey(side.id, batterUnlockKey(p));
      const benchLeft = side.bench.slice();
      const out = side.lineup.slice();
      const rested = [];
      side.lineup
        .map((p, i) => ({ p, i, f: W[keyOf(p)] || 0 }))
        .filter(x => wearPenalty(x.f) >= 1)
        .sort((a, b) => b.f - a.f)
        .forEach(x => {
          if (rested.length >= MAX_RESTS_PER_GAME) return;
          const slot = x.p.assignedSlot || x.p.pos || 'DH';
          const fresh = benchLeft.filter(b => wearPenalty(W[keyOf(b)]) === 0).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
          const direct = fresh.find(b => canPlayerFillSlot(b, slot));
          if (direct) {
            benchLeft.splice(benchLeft.indexOf(direct), 1);
            out[x.i] = { ...direct, assignedSlot: slot };
            rested.push(batterUnlockKey(x.p));
            return;
          }
          // Double switch: starter j moves to the rested player's position, bench player covers j's.
          let best = null;
          out.forEach((starter, j) => {
            if (j === x.i || !starter) return;
            const jSlot = starter.assignedSlot || starter.pos || 'DH';
            if (!canPlayerFillSlot(starter, slot)) return;
            const b = fresh.find(c => canPlayerFillSlot(c, jSlot));
            if (b && (!best || (b.ovr || 0) > (best.b.ovr || 0))) best = { j, jSlot, b };
          });
          if (best) {
            benchLeft.splice(benchLeft.indexOf(best.b), 1);
            out[best.j] = { ...out[best.j], assignedSlot: slot };
            out[x.i] = { ...best.b, assignedSlot: best.jSlot };
            rested.push(batterUnlockKey(x.p));
            return;
          }
          // No cover at all: at −2 the manager plays someone out of position rather than
          // run the regular into the ground.
          if (wearPenalty(x.f) >= 2 && fresh.length) {
            benchLeft.splice(benchLeft.indexOf(fresh[0]), 1);
            out[x.i] = { ...fresh[0], assignedSlot: slot, def: OUT_OF_POSITION_DEF };
            rested.push(batterUnlockKey(x.p));
          }
        });
      const lineup = out.map(p => withWearBatter(p, wearPenalty(W[keyOf(p)])));
      return {
        lineup, benchLeft, rested,
        roster: [...side.lineup, ...side.bench].map(keyOf),
        iron: Object.keys(side.ironMan || {}).map(k => this._leagueKey(side.id, k)),
        starts: lineup.map(p => ({ k: keyOf(p), pos: p.assignedSlot || p.pos || 'DH' }))
      };
    },

    // opts.trace = { events: [], line: [[], []] } records every play for the playoff broadcast;
    // opts.homeFieldIdx says which side gets the home edge (default: the side batting last).
    _simLeagueGame(away, home, day, opts = {}) {
      const trace = opts.trace || null;
      const homeFieldIdx = opts.homeFieldIdx !== undefined ? opts.homeFieldIdx : 1;
      const hits = [0, 0];
      const line = [[], []]; // runs per inning, for the last-game recap
      const sides = [away, home];
      const daily = sides.map(side => this._restLineup(side));
      sides.forEach((side, i) => {
        side.lineup = daily[i].lineup;
        side.benchLeft = daily[i].benchLeft;
        // Team defense with today's fielders (subs, out-of-position gloves)
        const fielders = side.lineup.filter(p => (p.assignedSlot || p.pos) !== 'DH');
        if (fielders.length) side.def = fielders.reduce((s, p) => s + (p.def !== undefined ? p.def : (p.defense_val || 50)), 0) / fielders.length;
      });
      const runs = [0, 0];
      // Pitchers of record: set when a team takes the lead, cleared when the game is tied again.
      let record = null; // { team, w: pitching line key, l: pitching line key }
      const bat = {};   // leagueKey -> batting line
      const pit = {};   // leagueKey -> pitching line
      const gs = { usedPitchers: new Set() };
      const relief = [[], []]; // relief appearances per side, for holds and blown saves
      const inc = (o, f, n = 1) => { o[f] = (o[f] || 0) + n; };
      const state = sides.map(side => ({ idx: 0, pitcher: null, ps: null, starterPs: null }));

      const startPitcher = (si, p, isStarter) => {
        const side = sides[si];
        const k = this._leagueKey(side.id, pitcherUnlockKey(p));
        gs.usedPitchers.add(k);
        if (!pit[k]) pit[k] = { key: pitcherUnlockKey(p), name: p.cleanName || p.name, team: side.id, role: p.role || (isStarter ? 'SP' : 'RP'), g: 1, gs: isStarter ? 1 : 0, outs: 0, h: 0, er: 0, bb: 0, so: 0, hr: 0, w: 0, l: 0, sv: 0 };
        const ps = { k, p, isStarter, bf: 0, fresh: this._freshBatters(p, isStarter), er: 0, h: 0 };
        state[si].pitcher = p;
        state[si].ps = ps;
        if (isStarter) state[si].starterPs = ps;
        return ps;
      };
      startPitcher(0, away.sp, true);
      startPitcher(1, home.sp, true);

      const batterLine = (side, b) => {
        const k = this._leagueKey(side.id, batterUnlockKey(b));
        if (!bat[k]) bat[k] = { key: batterUnlockKey(b), name: b.name, team: side.id, pos: b.assignedSlot || b.pos || 'DH', def: b.def !== undefined ? b.def : (b.defense_val || 50), g: 1, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
        return bat[k];
      };

      // Late blowouts: unused bench players who can cover the position finish the game.
      const blowoutSubs = sides.map(() => ({}));
      const nextBatter = (si, blowout) => {
        const side = sides[si];
        const slot = state[si].idx % side.lineup.length;
        state[si].idx++;
        const starter = side.lineup[slot];
        if (!blowout) return starter;
        if (!(slot in blowoutSubs[si])) {
          const pos = starter.assignedSlot || starter.pos || 'DH';
          const sub = side.benchLeft.find(b => canPlayerFillSlot(b, pos));
          if (sub) side.benchLeft.splice(side.benchLeft.indexOf(sub), 1);
          blowoutSubs[si][slot] = sub ? { ...sub, assignedSlot: pos } : null;
        }
        return blowoutSubs[si][slot] || starter;
      };

      // Manager decision at the start of each defensive half-inning.
      const managePitcher = (si, inning) => {
        const side = sides[si];
        const ps = state[si].ps;
        const lead = runs[si] - runs[1 - si];
        let pull = false;
        if (ps.isStarter) {
          const knockedOut = (inning <= 5 && ps.er >= 4) || (inning <= 7 && ps.er >= 5);
          const gem = ps.er === 0 && inning <= 9;
          const tired = this._fatiguePenalty(ps);
          pull = knockedOut || (gem ? tired >= 10 : tired >= 6) || inning > 9;
        } else {
          pull = true; // relievers work one inning at a time
        }
        if (!pull) return;
        const next = this._pickReliever(side, gs, inning, lead, day);
        if (next) {
          const rp = startPitcher(si, next, false);
          rp.saveSit = inning >= 6 && lead >= 1 && lead <= 3;
          relief[si].push(rp);
        }
      };

      const playHalf = (bi, inning) => {
        const pi = 1 - bi;
        const batSide = sides[bi];
        const pitSide = sides[pi];
        const blowout = Math.abs(runs[0] - runs[1]) >= 6 && inning >= 7;
        const edge = pi === homeFieldIdx ? HOME_EDGE : -HOME_EDGE;
        let outs = 0, scored = 0;
        const bases = [null, null, null];
        const unearned = new Set(); // runners who reached on an error
        // Real scoring rule: rebuild the inning without the errors. Once the outs made plus the
        // outs the errors gave away reach three, the inning should be over and every run after
        // that is unearned. Before this only the runner who reached on the error counted, and
        // 96% of the runs were earned (about 92% in real baseball).
        let errOuts = 0;
        const slim = () => bases.map(b => (b ? { name: b.name } : null));
        const emit = (who, wl, ps0, pl0, o) => {
          const ip = `${Math.floor(pl0.outs / 3)}.${pl0.outs % 3}`;
          trace.events.push({
            stepIndex: trace.events.length, inning, half: bi === 0 ? 'TOP' : 'BOT',
            batter: { name: who.name, pos: who.assignedSlot || who.pos || 'DH', ovr: Math.floor(who.ovr || 80), line: `${wl.h}-${wl.ab}${wl.hr > 0 ? `, ${wl.hr} HR` : ''}${wl.rbi > 0 ? `, ${wl.rbi} RBI` : ''}` },
            pitcher: { name: ps0.p.cleanName || ps0.p.name, role: ps0.isStarter ? 'SP' : (ps0.p.role || 'RP'), ovr: Math.floor(ps0.p.ovr || 80), line: `${ip} IP, ${pl0.h} H, ${pl0.er} ER, ${pl0.so} K`, pitches: pl0.pitches || 0 },
            stolenBase: false, balls: 0, strikes: 0, runsScored: 0,
            ...o,
            newBases: slim(),
            userRuns: runs[0] + (bi === 0 ? scored : 0), oppRuns: runs[1] + (bi === 1 ? scored : 0),
            userHits: hits[0], oppHits: hits[1],
            [bi === 0 ? 'currentInningAwayRuns' : 'currentInningHomeRuns']: scored
          });
        };
        while (outs < 3) {
          const ps = state[pi].ps;
          const pl = pit[ps.k];

          // Stolen bases: any runner with the next base open may go, before any pitch to the batter.
          // The great base stealers (real tendency well above their Speed) get what they had in
          // real life and the others do not: they keep running with a bigger lead, they go for
          // third much more often, and they may steal second and third in the same at-bat.
          // With one try per at-bat and nobody running five runs up, Rickey Henderson stole 67
          // against 91 and Ty Cobb 54 against 73.
          const margin = runs[bi] + scored - runs[pi];
          for (let tries = 0; tries < 2 && outs < 3; tries++) {
            const from = (bases[0] && !bases[1]) ? 0 : ((bases[1] && !bases[2]) ? 1 : -1);
            if (from < 0) break;
            const runner = bases[from];
            const sbT = batTendency(runner)[1];
            const great = sbT >= GREAT_STEALER;
            if ((tries > 0 && !great) || Math.abs(margin) >= (great ? 8 : 5)) break;
            const rate = Math.min(1.0, Math.max(0, runner.spd !== undefined ? runner.spd : 50) / 125.0);
            const third = from === 1 ? Math.min(0.45, STEAL_THIRD * (great ? sbT : 1)) : 1;
            const tryP = (STEAL_TRY_BASE + Math.pow(rate, STEAL_TRY_POW) * STEAL_TRY_SCALE) * third * sbT;
            if (!(Math.random() < tryP)) break;
            const rl = batterLine(batSide, runner);
            const before = trace ? slim() : null;
            bases[from] = null;
            const safe = Math.random() < 0.58 + rate * 0.27 - (from === 1 ? 0.03 : 0);
            if (safe) { bases[from + 1] = runner; inc(rl, 'sb'); }
            else { outs++; pl.outs++; inc(rl, 'cs'); }
            if (trace) {
              emit(runner, rl, ps, pl, { outcome: safe ? 'SB' : 'CS', base: from + 2, outs: outs - (safe ? 0 : 1), newOuts: outs, bases: before,
                d: { ab: 0, outs: safe ? 0 : 1, rbi: 0, er: 0, scored: [], sb: safe ? runner.name : null, cs: safe ? null : runner.name } });
            }
            if (!safe) break;
          }
          if (outs >= 3) break;

          const pen = this._fatiguePenalty(ps) - edge;
          const p = ps.p;
          const eff = pen ? { ...p, h9: p.h9 - pen, k9: p.k9 - pen, bb9: p.bb9 - pen, hr9: p.hr9 - pen } : { ...p };
          eff._fieldingDef = pitSide.def;
          const batter = nextBatter(bi, blowout);
          const bl = batterLine(batSide, batter);
          ps.bf++;
          const outcome = simPaOutcome(batter, eff, batSide.isUser);
          const t0 = trace ? { outs, bases: slim(), scored, ab: bl.ab, rbi: bl.rbi, er: pl.er, names: [] } : null;
          let detail = null, errBy = null;
          const credit = (scorers, rbi = true, allUnearned = false) => {
            scorers = scorers.filter(Boolean);
            if (!scorers.length) return;
            if (t0) scorers.forEach(r => t0.names.push(r.name));
            const before = runs[bi] + scored - runs[pi];
            scorers.forEach(r => { batterLine(batSide, r).r++; });
            const earned = (allUnearned || outs + errOuts >= 3) ? 0 : scorers.filter(r => !unearned.has(r)).length;
            if (rbi) bl.rbi += scorers.length;
            pl.er += earned; ps.er += earned; inc(pl, 'r', scorers.length); scored += scorers.length;
            const after = before + scorers.length;
            if (after === 0) record = null;
            else if (before <= 0 && after > 0) record = { team: bi, w: state[bi].ps.k, l: ps.k };
            if (ps.saveSit && !ps.blown && after >= 0) { ps.blown = true; inc(pl, 'bs'); }
          };
          if (outcome === 'OUT') {
            const defv = pitSide.def !== undefined ? pitSide.def : 50;
            const pErr = Math.max(0.012, Math.min(0.08, ERROR_RATE - (defv - 50) * 0.0007));
            const bspd = Math.min(1.0, Math.max(0, batter.spd !== undefined ? batter.spd : 50) / 125.0);
            if (Math.random() < pErr) {
              // Reached on an error: everybody moves up one base, nothing here is earned.
              bl.ab++;
              const fielders = pitSide.lineup.filter(f => ERROR_WEIGHT[f.assignedSlot || f.pos]);
              let pick = Math.random() * fielders.reduce((t, f) => t + ERROR_WEIGHT[f.assignedSlot || f.pos], 0);
              const culprit = fielders.find(f => (pick -= ERROR_WEIGHT[f.assignedSlot || f.pos]) < 0);
              if (culprit) inc(batterLine(pitSide, culprit), 'e');
              detail = 'E'; errBy = culprit ? culprit.name : null;
              unearned.add(batter);
              errOuts++;
              const scorer = bases[2];
              bases[2] = bases[1]; bases[1] = bases[0]; bases[0] = batter;
              credit([scorer], false, true);
            } else if (outs < 2 && bases[0] && Math.random() < GIDP_RATE * (1.2 - 0.5 * bspd)) {
              // Double play: batter and the man on first are out; the others move up.
              outs += 2; pl.outs += 2; bl.ab++; inc(bl, 'gidp'); detail = 'DP';
              const scorer = outs < 3 ? bases[2] : null;
              if (outs < 3) { bases[2] = bases[1]; bases[1] = null; }
              bases[0] = null;
              credit([scorer], false);
            } else {
              outs++; pl.outs++;
              if (outs < 3 && bases[2] && Math.random() < RUN_ON_OUT) {
                // Sacrifice fly (no at-bat) or a run-scoring grounder, half and half.
                const scorer = bases[2];
                bases[2] = null;
                if (Math.random() < 0.5) { inc(bl, 'sf'); detail = 'SF'; } else bl.ab++;
                credit([scorer]);
              } else {
                bl.ab++;
                if (outs < 3 && bases[1] && !bases[2] && Math.random() < ADVANCE_ON_OUT) { bases[2] = bases[1]; bases[1] = null; }
              }
            }
          }
          else if (outcome === 'SO') { outs++; bl.ab++; bl.so++; pl.outs++; pl.so++; }
          else if (outcome === 'BB') {
            bl.bb++; pl.bb++;
            credit([forceWalk(bases, batter)]);
          } else if (outcome === 'HR') {
            bl.ab++; bl.h++; bl.hr++; pl.h++; pl.hr++; ps.h++;
            const scorers = [...bases.filter(Boolean), batter];
            bases[0] = bases[1] = bases[2] = null;
            credit(scorers);
          } else {
            const adv = outcome === '1B' ? 1 : outcome === '2B' ? 2 : 3;
            bl.ab++; bl.h++; pl.h++; ps.h++;
            if (outcome === '2B') bl.doubles++;
            if (outcome === '3B') bl.triples++;
            credit(advanceOnHit(bases, batter, adv, outs));
          }
          if (trace) {
            const balls = outcome === 'BB' ? 4 : (Math.random() < 0.4 ? 2 : (Math.random() < 0.5 ? 1 : 0));
            const strikes = outcome === 'SO' ? 3 : (outcome === 'BB' ? Math.floor(Math.random() * 3) : (Math.random() < 0.5 ? 2 : 1));
            inc(pl, 'pitches', balls + strikes + (outcome === 'SO' || outcome === 'BB' ? 0 : 1));
            if (['1B', '2B', '3B', 'HR'].includes(outcome)) hits[bi]++;
            emit(batter, bl, ps, pl, { outcome, detail, errBy, outs: t0.outs, newOuts: Math.min(3, outs), bases: t0.bases, balls, strikes,
              runsScored: scored - t0.scored,
              d: { ab: bl.ab - t0.ab, outs: outs - t0.outs, rbi: bl.rbi - t0.rbi, er: pl.er - t0.er, scored: t0.names, sb: null, cs: null } });
          }
          // Walk-off: the home team stops batting once it leads in the 9th or later
          if (bi === 1 && inning >= 9 && runs[1] + scored > runs[0]) break;
        }
        runs[bi] += scored;
        line[bi].push(scored);
        if (trace) trace.line[bi].push(scored);
      };

      let inning = 1, played = 0;
      while (inning <= 9 || (runs[0] === runs[1] && inning <= 20)) {
        played = inning;
        managePitcher(1, inning);
        playHalf(0, inning);
        if (inning >= 9 && runs[1] > runs[0]) break; // home leads after the top of the 9th+
        managePitcher(0, inning);
        playHalf(1, inning);
        inning++;
      }
      if (runs[0] === runs[1]) runs[Math.random() < 0.5 ? 0 : 1]++; // 20-inning safety valve

      // Decisions by the real rule: W to the pitcher of record when his team took the lead for
      // good, L to the pitcher who gave up that run. A starter needs 15 outs for the W; short of
      // that it goes to the winning team's busiest reliever. SV to the winning team's last
      // pitcher when he finished a game won by 1-3 runs and didn't get the win.
      const wi = runs[0] > runs[1] ? 0 : 1, li = 1 - wi;
      const teamPitchers = si => Object.values(pit).filter(x => x.team === sides[si].id);
      const wStarter = pit[state[wi].starterPs.k];
      const last = pit[state[wi].ps.k];
      const valid = record && record.team === wi; // false only after the 20-inning safety valve
      let wPitcher = valid ? pit[record.w] : last;
      if (wPitcher === wStarter && wStarter.outs < 15) {
        wPitcher = teamPitchers(wi).filter(x => x !== wStarter).sort((a, b) => b.outs - a.outs)[0] || wStarter;
      }
      wPitcher.w++; wPitcher.decision = 'W';
      const lPitcher = valid ? pit[record.l] : pit[state[li].ps.k];
      lPitcher.l++; lPitcher.decision = 'L';
      if (last !== wPitcher && (runs[wi] - runs[li]) <= 3) { last.sv++; last.decision = 'SV'; }
      [0, 1].forEach(si => {
        const staff = teamPitchers(si);
        if (staff.length === 1) { inc(staff[0], 'cg'); if (runs[1 - si] === 0) inc(staff[0], 'sho'); }
        relief[si].forEach(rp => {
          const line = pit[rp.k];
          if (rp.saveSit && !rp.blown && line.outs >= 1 && rp !== state[si].ps && line !== wPitcher) inc(line, 'hld');
        });
      });

      return {
        runs, innings: played, line, bat, pit, winnerId: sides[wi].id,
        wear: daily.map((d, i) => ({ team: sides[i].id, roster: d.roster, starts: d.starts, rested: d.rested, iron: d.iron }))
      };
    },

    // Folds one game's lines into the season's league-wide stats and the bullpen usage log.
    _commitLeagueGame(result, day) {
      const L = this.state.league;
      if (!L.stats) L.stats = { bat: {}, pit: {} };
      Object.entries(result.bat).forEach(([k, d]) => {
        const s = L.stats.bat[k] || (L.stats.bat[k] = { key: d.key, name: d.name, team: d.team, pos: d.pos, def: d.def, g: 0, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 });
        ['g', 'ab', 'h', 'doubles', 'triples', 'hr', 'rbi', 'bb', 'so', 'r', 'sb', 'cs', 'gidp', 'sf', 'e'].forEach(f => { s[f] = (s[f] || 0) + (d[f] || 0); });
      });
      if (!L.pen) L.pen = {};
      Object.entries(result.pit).forEach(([k, d]) => {
        const s = L.stats.pit[k] || (L.stats.pit[k] = { key: d.key, name: d.name, team: d.team, role: d.role, g: 0, gs: 0, outs: 0, h: 0, er: 0, bb: 0, so: 0, hr: 0, w: 0, l: 0, sv: 0 });
        ['g', 'gs', 'outs', 'h', 'er', 'bb', 'so', 'hr', 'w', 'l', 'sv', 'r', 'cg', 'sho', 'hld', 'bs'].forEach(f => { s[f] = (s[f] || 0) + (d[f] || 0); });
        if (!d.gs) {
          const u = L.pen[k];
          L.pen[k] = { last: day, run: (u && u.last === day - 1) ? u.run + 1 : 1 };
        }
      });
      // Batter wear: starters add their position's wear, everyone who sat resets.
      if (!L.wear) L.wear = {};
      (result.wear || []).forEach(w => {
        const started = new Map(w.starts.map(s => [s.k, s.pos]));
        const iron = new Set(w.iron || []);
        w.roster.forEach(k => {
          if (started.has(k)) {
            const add = Math.max(0, (WEAR_BY_POS[started.get(k)] || 0.5) - WEAR_RECOVERY) * (iron.has(k) ? IRON_MAN_WEAR : 1);
            L.wear[k] = Math.min(WEAR_CAP, Math.round(((L.wear[k] || 0) + add) * 100) / 100);
          } else if (L.wear[k]) {
            delete L.wear[k];
          }
        });
      });
    },

    _emptyBatterDelta() { return { ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 }; },
    _emptyPitcherDelta() { return { outs: 0, h: 0, er: 0, bb: 0, so: 0 }; },

    _playHalfInning(nextBatterFn, pitcher, isUserBatting, batterDeltas, pitcherDeltas, oppBatterDeltas) {
      let outs = 0, runs = 0;
      const bases = [null, null, null];

      while (outs < 3) {
        const batter = nextBatterFn();
        const outcome = simPaOutcome(batter, pitcher, isUserBatting);
        const bKey = isUserBatting ? batterUnlockKey(batter) : null;
        const pKey = !isUserBatting ? pitcherUnlockKey(pitcher) : null;
        if (bKey && !batterDeltas[bKey]) batterDeltas[bKey] = this._emptyBatterDelta();
        if (pKey && !pitcherDeltas[pKey]) pitcherDeltas[pKey] = this._emptyPitcherDelta();
        const bStat = bKey ? batterDeltas[bKey] : null;
        const pStat = pKey ? pitcherDeltas[pKey] : null;

        const oppBKey = (!isUserBatting && oppBatterDeltas && batter && batter.name) ? batter.name : null;
        if (oppBKey && !oppBatterDeltas[oppBKey]) {
          oppBatterDeltas[oppBKey] = { name: batter.name, team: batter.team || '', ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0 };
        }
        const oppBStat = oppBKey ? oppBatterDeltas[oppBKey] : null;

        if (outcome === 'OUT') {
          outs++;
          if (bStat) bStat.ab++;
          if (oppBStat) oppBStat.ab++;
          if (pStat) pStat.outs++;
        } else if (outcome === 'SO') {
          outs++;
          if (bStat) { bStat.ab++; bStat.so++; }
          if (oppBStat) { oppBStat.ab++; oppBStat.so++; }
          if (pStat) { pStat.outs++; pStat.so++; }
        } else if (outcome === 'BB') {
          if (bStat) bStat.bb++;
          if (oppBStat) oppBStat.bb++;
          if (pStat) pStat.bb++;
          const scorer = forceWalk(bases, batter);
          const scorers = scorer ? [scorer] : [];
          runs += scorers.length;
          scorers.forEach(r => {
            const rKey = (isUserBatting && r) ? batterUnlockKey(r) : null;
            if (rKey && batterDeltas[rKey]) batterDeltas[rKey].r++;
            if (!isUserBatting && r && oppBatterDeltas && r.name && oppBatterDeltas[r.name]) {
              oppBatterDeltas[r.name].r++;
            }
          });
          if (scorers.length && bStat) bStat.rbi += scorers.length;
          if (scorers.length && oppBStat) oppBStat.rbi += scorers.length;
          if (pStat) pStat.er += scorers.length;
        } else if (outcome === 'HR') {
          if (bStat) { bStat.ab++; bStat.h++; bStat.hr++; bStat.r++; }
          if (oppBStat) { oppBStat.ab++; oppBStat.h++; oppBStat.hr++; oppBStat.r++; }
          if (pStat) { pStat.h++; }
          const runnersOn = bases.filter(Boolean);
          const rbiCount = 1 + runnersOn.length;
          runs += rbiCount;
          runnersOn.forEach(r => {
            const rKey = (isUserBatting && r) ? batterUnlockKey(r) : null;
            if (rKey && batterDeltas[rKey]) batterDeltas[rKey].r++;
            if (!isUserBatting && r && oppBatterDeltas && r.name && oppBatterDeltas[r.name]) {
              oppBatterDeltas[r.name].r++;
            }
          });
          bases[0] = null; bases[1] = null; bases[2] = null;
          if (bStat) bStat.rbi += rbiCount;
          if (oppBStat) oppBStat.rbi += rbiCount;
          if (pStat) pStat.er += rbiCount;
        } else {
          // 1B, 2B, 3B
          const basesToAdvance = outcome === '1B' ? 1 : (outcome === '2B' ? 2 : 3);
          if (bStat) {
            bStat.ab++;
            bStat.h++;
            if (outcome === '2B') bStat.doubles++;
            if (outcome === '3B') bStat.triples++;
          }
          if (oppBStat) {
            oppBStat.ab++;
            oppBStat.h++;
            if (outcome === '2B') oppBStat.doubles++;
            if (outcome === '3B') oppBStat.triples++;
          }
          if (pStat) pStat.h++;
          const scorers = advanceOnHit(bases, batter, basesToAdvance, outs);
          runs += scorers.length;
          scorers.forEach(r => {
            const rKey = (isUserBatting && r) ? batterUnlockKey(r) : null;
            if (rKey && batterDeltas[rKey]) batterDeltas[rKey].r++;
            if (!isUserBatting && r && oppBatterDeltas && r.name && oppBatterDeltas[r.name]) {
              oppBatterDeltas[r.name].r++;
            }
          });
          if (scorers.length && bStat) bStat.rbi += scorers.length;
          if (scorers.length && oppBStat) oppBStat.rbi += scorers.length;
          if (pStat) pStat.er += scorers.length;
        }

        // Stolen base roll (smooth organic sabermetric curve across 0-125 SPD):
        // spd ~15-25 (Ted Simmons, Luzinski) -> 1-3 SB
        // spd ~30-40 (Ripken, Fred McGriff) -> 4-6 SB
        // spd ~45-55 (Eddie Murray, Kirby Puckett) -> 7-12 SB
        // spd ~55-65 (Mike Schmidt, George Brett) -> 13-18 SB
        // spd ~70-85 (Robin Yount, Willie Randolph) -> 20-32 SB
        // spd ~90-105 (Paul Molitor, Lenny Dykstra) -> 38-55 SB
        // spd ~120-125 (Rickey Henderson, Davey Lopes, Vince Coleman) -> 65-80 SB
        if (isUserBatting && (outcome === 'BB' || outcome === '1B') && bases[0] === batter) {
          const runnerSpd = batter.spd !== undefined ? Math.max(0, batter.spd) : 50;
          if (!bases[1]) {
            const rate = Math.min(1.0, runnerSpd / 125.0);
            const attemptChance = 0.003 + Math.pow(rate, 2.0) * 0.42;
            if (Math.random() < attemptChance) {
              const successRate = 0.55 + rate * 0.32;
              if (Math.random() < successRate) {
                bases[1] = batter;
                bases[0] = null;
                if (bStat) bStat.sb++;
              } else {
                // Caught stealing (CS)
                bases[0] = null;
                outs++;
                if (bStat && bStat.cs !== undefined) bStat.cs++;
              }
            }
          } else if (!bases[2] && runnerSpd >= 65) {
            const leadRunner = bases[1];
            const leadSpd = (leadRunner && leadRunner.spd !== undefined) ? leadRunner.spd : runnerSpd;
            const rate3 = Math.min(1.0, leadSpd / 125.0);
            const steal3BChance = 0.002 + Math.pow(rate3, 2.5) * 0.10;
            if (Math.random() < steal3BChance) {
              const successRate3 = 0.60 + rate3 * 0.28;
              if (Math.random() < successRate3) {
                bases[2] = leadRunner;
                bases[1] = batter;
                bases[0] = null;
                const leadKey = (leadRunner) ? batterUnlockKey(leadRunner) : null;
                if (leadKey && batterDeltas[leadKey]) batterDeltas[leadKey].sb++;
              } else {
                bases[1] = null;
                outs++;
              }
            }
          }
        }
      }
      return runs;
    },

    simulateBatch(n) {
      const results = [];
      for (let i = 0; i < n && this.state.gamesPlayed < SEASON_LENGTH; i++) {
        results.push(this.simulateGame());
        if ((this.state.pendingAlerts || []).length) break; // a milestone stops the run
      }
      return results;
    },
    simulateUntilLossOrEnd() {
      const results = [];
      while (this.state.gamesPlayed < SEASON_LENGTH) {
        const r = this.simulateGame();
        results.push(r);
        if (!r.won || (this.state.pendingAlerts || []).length) break;
      }
      return results;
    },

    toggleAutoSim() {
      if (this._autoSimTimer) {
        this.stopAutoSim();
        this.renderSeason();
      } else {
        this.startAutoSim();
      }
    },
    startAutoSim() {
      if (this._autoSimTimer) return;
      this._autoSimTimer = setInterval(() => {
        if (!this.state || this.state.gamesPlayed >= SEASON_LENGTH) {
          this.stopAutoSim();
          this.renderSeason();
          return;
        }
        this.simulateGame();
        if ((this.state.pendingAlerts || []).length) this.stopAutoSim();
        this.renderSeason();
      }, 120);
      this.renderSeason();
    },
    stopAutoSim() {
      if (this._autoSimTimer) {
        clearInterval(this._autoSimTimer);
        this._autoSimTimer = null;
      }
    },

    // ── Playoffs (Authentic Baseball Simulator & Live Viewer) ─────────────
    canStartPlayoffs() {
      const S = this.state;
      if (!S || S.gamesPlayed < SEASON_LENGTH || S.playoffs.finished) return false;
      return S.league ? !!S.playoffs.unlocked : S.wins >= PLAYOFF_MIN_WINS;
    },

    getUserTeamName() {
      const _t = (key, fallback) => (typeof window.t === 'function' ? window.t(key) : fallback);
      if (!this.state) return _t('challenge162.my_legends', 'Mis Leyendas');
      const S = this.state;
      if (S.teamName) return S.teamName;
      if (S.modeConfig && S.modeConfig.key === 'mono_franchise' && S.modeConfig.label) {
        return S.modeConfig.label;
      }
      const franchiseNames = (window.PlayersDB && window.PlayersDB.FranchiseNames) || {};
      const allCards = [
        ...SLOTS.map(s => S.roster && S.roster.lineup && S.roster.lineup[s]).filter(Boolean),
        ...((S.roster && S.roster.pitchers && S.roster.pitchers.SP) || []),
        ...((S.roster && S.roster.pitchers && S.roster.pitchers.RP) || [])
      ];
      const counts = {};
      allCards.forEach(c => {
        const t = c.team || '';
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
      const topCode = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      if (topCode && counts[topCode] >= 13 && franchiseNames[topCode]) {
        return franchiseNames[topCode];
      }
      return _t('challenge162.my_legends', 'Mis Leyendas');
    },

    startPlayoffRound() {
      this.startPlayoffLiveGame();
    },

    _activePlayoffTab: 'broadcast', // 'broadcast' | 'lineups' | 'boxscore' | 'pbp'
    _selectedPlayoffBoxScoreIndex: -1,

    startPlayoffLiveGame() {
      if (!this.state) return;
      const S = this.state;
      const round = S.playoffs.round;
      // The round's game is rolled once and saved: leaving with BACK (or reloading) resumes
      // the same game where you left it instead of simulating a new one.
      const pending = S.playoffs.pendingGame;
      if (pending && pending.round === round && pending.game) {
        this._activePlayoffSim = { game: pending.game, currentStep: pending.step || 0, autoPlay: false, timer: null, finished: false };
        this._activePlayoffTab = 'broadcast';
        this._selectedPlayoffBoxScoreIndex = -1;
        this.showScreen('screen-challenge-playoffs');
        this.renderPlayoffLiveGame();
        return;
      }
      const oppFranchise = generatePlayoffEnemyTeam(round, S.leagueTeams, this._playoffOpponentRef(round));
      const opp = oppFranchise;

      const userLineup = S.roster.battingOrder.map(slot => S.roster.lineup[slot]).filter(Boolean);
      const spList = S.roster.pitchers.SP;
      const rpList = S.roster.pitchers.RP;
      // In playoffs: Ace SP1 starts round 1 & 3; SP2 starts round 2
      const userSP = spList[round % spList.length] || spList[0];
      const closer = rpList[0] || rpList[1] || rpList[2];
      const setup  = rpList[1] || rpList[0] || rpList[2];
      const middle = rpList[2] || rpList[1] || rpList[0];
      const userRelievers = [setup, closer].filter(Boolean);
      if (userRelievers.length < 2 && middle) userRelievers.push(middle);

      const detailedGame = this._simulatePlayoffGameDetailed(userLineup, userSP, userRelievers, opp, round);
      this._activePlayoffSim = {
        game: detailedGame,
        currentStep: 0,
        autoPlay: false,
        timer: null,
        finished: false
      };
      S.playoffs.pendingGame = { round, game: detailedGame, step: 0 };
      this.save();
      this._activePlayoffTab = 'broadcast';
      this._selectedPlayoffBoxScoreIndex = -1;

      this.showScreen('screen-challenge-playoffs');
      this.renderPlayoffLiveGame();
    },

    // The user's playoff game: same engine as the regular season (real W/L rule, steals, errors,
    // double plays, fatigue, full bullpen), recorded play by play for the broadcast. The user
    // always bats first on screen; the better seed still gets the home-field edge. No wear or
    // days off in October.
    _simulatePlayoffGameDetailed(userLineup, userSP, userRelievers, opp, round) {
      const S = this.state;
      const userSide = { ...this._userSide(S, false), sp: userSP, noRest: true };
      const ref = this._playoffOpponentRef(round);
      const oppLineup = (opp.lineup || opp._batters || []).slice(0, 9);
      const oppSP = (opp.pitchers && opp.pitchers[0]) || opp.pitcher;
      const oppRP = (opp.pitchers && opp.pitchers[1]) || opp.reliever || null;
      const oppCL = (opp.pitchers && opp.pitchers[2]) || opp.closer || null;
      const oppPen = [];
      if (oppRP) oppPen.push({ ...oppRP, role: 'SETUP' });
      if (oppCL && oppCL !== oppRP) oppPen.push({ ...oppCL, role: 'CL' });
      if (ref && ref.code) {
        const taken = new Set([oppSP, ...oppPen].filter(Boolean).map(p => p.cleanName || p.name));
        getFranchiseStaff(ref.code, ref.decade).bullpen.forEach(p => {
          if (!taken.has(p.cleanName || p.name)) oppPen.push({ ...p, role: 'RP' });
        });
      }
      const oppFielders = oppLineup.filter(p => (p.assignedSlot || p.pos) !== 'DH');
      const oppSide = {
        id: (ref && ref.id) || 'PLAYOFF_OPP', isUser: false, noRest: true,
        lineup: oppLineup, bench: [], sp: oppSP, bullpen: oppPen, gameIdx: 0,
        def: oppFielders.length ? oppFielders.reduce((t, p) => t + (p.def !== undefined ? p.def : 50), 0) / oppFielders.length : 50
      };
      const m = this._playoffMatchup(round);
      // Home field: the better seed in the league rounds, the better record in the World Series.
      const T = S.league && S.league.teams;
      const oppRec = T && ref && T[ref.id];
      const userHosts = (round === 2 && T && oppRec) ? T[USER_TEAM_ID].w >= oppRec.w : !!(m && m.a === USER_TEAM_ID);
      const trace = { events: [], line: [[], []] };
      const res = this._simLeagueGame(userSide, oppSide, SEASON_LENGTH + 1 + round * 2, { trace, homeFieldIdx: userHosts ? 0 : 1 });

      const boxSide = (side) => {
        const everyone = [...side.lineup, ...(side.bench || [])];
        const order = name => { const k = everyone.findIndex(p => p.name === name); return k < 0 ? 99 : k; };
        const ovrOfName = name => { const p = everyone.find(x => x.name === name); return Math.floor((p && p.ovr) || 80); };
        const staff = [side.sp, ...side.bullpen].filter(Boolean);
        const batting = Object.values(res.bat).filter(x => x.team === side.id).sort((a, b) => order(a.name) - order(b.name))
          .map(x => ({ name: x.name, pos: x.pos, ab: x.ab, r: x.r, h: x.h, doubles: x.doubles, triples: x.triples, hr: x.hr, rbi: x.rbi, bb: x.bb, so: x.so, sb: x.sb || 0, cs: x.cs || 0, ovr: ovrOfName(x.name) }));
        const pitching = Object.values(res.pit).filter(x => x.team === side.id).map(x => {
          const p = staff.find(q => (q.cleanName || q.name) === x.name);
          return { name: x.name, role: x.gs ? 'SP' : (x.role || 'RP'), outs: x.outs, h: x.h, r: x.r || 0, er: x.er, bb: x.bb, so: x.so, hr: x.hr, pitches: x.pitches || 0, decision: x.decision || '', ovr: Math.floor((p && p.ovr) || 80) };
        });
        const errors = Object.values(res.bat).filter(x => x.team === side.id).reduce((t, x) => t + (x.e || 0), 0);
        return { batting, pitching, errors };
      };
      const ub = boxSide(userSide), ob = boxSide(oppSide);
      const _t = (key, fallback) => (typeof window.t === 'function' ? window.t(key) : fallback);
      const roundTitleKey = round === 0 ? 'challenge162.round_1_title' : (round === 1 ? 'challenge162.round_2_title' : 'challenge162.round_3_title');
      const slimP = p => ({ name: p.cleanName || p.name, role: p.role || 'P', ovr: Math.floor(p.ovr || 80) });
      return {
        events: trace.events,
        awayTeam: { name: this.getUserTeamName(), runs: res.runs[0], hits: ub.batting.reduce((t, b) => t + b.h, 0), errors: ub.errors, linescore: trace.line[0], batting: ub.batting, pitching: ub.pitching },
        homeTeam: { name: opp.name, runs: res.runs[1], hits: ob.batting.reduce((t, b) => t + b.h, 0), errors: ob.errors, linescore: trace.line[1], batting: ob.batting, pitching: ob.pitching },
        userLineup: userSide.lineup.map(b => ({ name: b.name, pos: b.assignedSlot || b.pos || 'DH', ovr: Math.floor(b.ovr || 80) })),
        oppLineup: oppLineup.map(b => ({ name: b.name, pos: b.assignedSlot || b.pos || 'DH', ovr: Math.floor(b.ovr || 80) })),
        userPitchers: [userSide.sp, ...userSide.bullpen].filter(Boolean).map(slimP),
        oppPitchers: [oppSP, ...oppPen].filter(Boolean).map(slimP),
        won: res.winnerId === USER_TEAM_ID,
        homeField: userHosts ? 'away' : 'home',
        finalInning: Math.max(9, trace.line[0].length),
        round,
        roundTitle: _t(roundTitleKey, `Ronda ${round + 1}`)
      };
    },

    renderPlayoffLiveGame() {
      const container = document.getElementById('challenge162-playoffs-container');
      if (!container || !this._activePlayoffSim) return;
      const sim = this._activePlayoffSim;
      const game = sim.game;
      const events = game.events;
      const totalSteps = events.length;
      const isPreGame = sim.currentStep === 0;
      const isFinished = sim.currentStep >= totalSteps;
      const activeTab = this._activePlayoffTab || 'broadcast';

      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      const getRoundTitle = (rIdx) => {
        if (rIdx === 0) return _t('challenge162.round_1_title', 'SERIE DIVISIONAL');
        if (rIdx === 1) return _t('challenge162.round_2_title', 'SERIE DE CAMPEONATO');
        return _t('challenge162.round_3_title', '🏆 SERIE MUNDIAL [JEFE FINAL]');
      };

      const roundTitle = getRoundTitle(game.round);
      const simTitle = _t('challenge162.playoff_sim_title', 'SIMULADOR DE POSTEMPORADA');
      const teamHeader = _t('challenge162.playoff_linescore_team', 'EQUIPO');
      const outsLabel = _t('challenge162.playoff_outs', 'Outs');
      const atBatLabel = _t('challenge162.playoff_at_bat', 'Al bate');
      const pitchingLabel = _t('challenge162.playoff_pitching', 'Lanzando');
      const todayLineLabel = _t('challenge162.playoff_today_line', 'Hoy');
      const pitchesLabel = _t('challenge162.playoff_pitches', 'Lanzamientos');
      const turnTeamLabel = _t('challenge162.playoff_turn_team', 'Turno');
      const finalScoreLabel = _t('challenge162.playoff_final_score', 'FINAL DEL PARTIDO');
      const backBtnText = _t('challenge162.playoff_back_hub', '← VOLVER');

      // Resolve event for current state:
      let curEvt;
      if (isPreGame) {
        const leadOff = game.awayTeam.batting[0] || { name: 'Bateador', pos: 'DH', ovr: 80 };
        const oppAce = game.homeTeam.pitching[0] || { name: 'Lanzador', role: 'SP', ovr: 90 };
        curEvt = {
          inning: 1,
          half: 'TOP',
          outs: 0,
          newOuts: 0,
          bases: [null, null, null],
          newBases: [null, null, null],
          batter: { name: leadOff.name, pos: leadOff.pos || 'DH', ovr: leadOff.ovr || 80, line: '0-0' },
          pitcher: { name: oppAce.name, role: oppAce.role || 'SP', ovr: oppAce.ovr || 90, line: '0.0 IP, 0 H, 0 ER, 0 K', pitches: 0 },
          outcome: null,
          runsScored: 0,
          stolenBase: false,
          userRuns: 0,
          oppRuns: 0,
          userHits: 0,
          oppHits: 0,
          balls: 0,
          strikes: 0,
          currentInningAwayRuns: 0
        };
      } else {
        const stepIdx = Math.min(sim.currentStep - 1, totalSteps - 1);
        curEvt = events[stepIdx] || events[0];
      }

      // ── Playoff Audio Effects Integration ──
      if (this._lastAudioPlayoffStep !== sim.currentStep) {
        this._lastAudioPlayoffStep = sim.currentStep;
        if (window.AudioManager && typeof window.AudioManager.play === 'function') {
          if (isFinished) {
            if (game.won) {
              window.AudioManager.play('win');
            } else {
              window.AudioManager.play('lose');
            }
          } else if (!isPreGame && curEvt && curEvt.outcome) {
            if (curEvt.outcome === 'HR') {
              window.AudioManager.play('hr');
            } else if (curEvt.outcome === 'SO') {
              window.AudioManager.play('so');
            } else if (curEvt.outcome === 'BB') {
              window.AudioManager.play('bb');
            } else if (['1B', '2B', '3B'].includes(curEvt.outcome)) {
              window.AudioManager.play('hit');
            } else if (curEvt.outcome === 'OUT') {
              window.AudioManager.play('out');
            }
          }
        }
      }

      const innHalf = curEvt.half === 'TOP' ? _t('challenge162.playoff_inning_top', 'Alta') : _t('challenge162.playoff_inning_bot', 'Baja');
      const inningDisplay = isPreGame ? `${innHalf} 1` : `${innHalf} ${curEvt.inning}`;

      // Build live linescore data:
      const totalInnings = Math.max(9, game.finalInning);
      let linescoreHeadHTML = `<th>${teamHeader}</th>`;
      for (let i = 1; i <= totalInnings; i++) {
        linescoreHeadHTML += `<th>${i}</th>`;
      }
      linescoreHeadHTML += `<th class="stat-total">R</th><th class="stat-total">H</th><th class="stat-total">E</th>`;

      const awayLiveLine = [];
      const homeLiveLine = [];
      for (let i = 1; i <= totalInnings; i++) {
        if (isPreGame) {
          awayLiveLine.push(i === 1 ? '0' : '-');
          homeLiveLine.push('-');
        } else if (i < curEvt.inning) {
          awayLiveLine.push(game.awayTeam.linescore[i - 1] !== undefined ? game.awayTeam.linescore[i - 1] : 0);
          homeLiveLine.push(game.homeTeam.linescore[i - 1] !== undefined ? game.homeTeam.linescore[i - 1] : 0);
        } else if (i === curEvt.inning) {
          if (curEvt.half === 'TOP') {
            awayLiveLine.push(curEvt.currentInningAwayRuns || 0);
            homeLiveLine.push('-');
          } else {
            awayLiveLine.push(game.awayTeam.linescore[i - 1] !== undefined ? game.awayTeam.linescore[i - 1] : 0);
            homeLiveLine.push(curEvt.currentInningHomeRuns || 0);
          }
        } else {
          awayLiveLine.push('-');
          homeLiveLine.push('-');
        }
      }

      if (isFinished) {
        for (let i = 0; i < totalInnings; i++) {
          awayLiveLine[i] = game.awayTeam.linescore[i] !== undefined ? game.awayTeam.linescore[i] : '-';
          homeLiveLine[i] = game.homeTeam.linescore[i] !== undefined ? game.homeTeam.linescore[i] : '-';
        }
      }

      let awayRowHTML = `<td class="team-cell">⚾ ${game.awayTeam.name}</td>`;
      let homeRowHTML = `<td class="team-cell">👑 ${game.homeTeam.name}</td>`;
      for (let i = 0; i < totalInnings; i++) {
        const isAwayActive = !isFinished && (curEvt.inning === i + 1) && (curEvt.half === 'TOP');
        const isHomeActive = !isFinished && (curEvt.inning === i + 1) && (curEvt.half === 'BOT');
        awayRowHTML += `<td class="${isAwayActive ? 'active-inning' : ''}">${awayLiveLine[i]}</td>`;
        homeRowHTML += `<td class="${isHomeActive ? 'active-inning' : ''}">${homeLiveLine[i]}</td>`;
      }
      const curUserRuns = isFinished ? game.awayTeam.runs : curEvt.userRuns;
      const curOppRuns = isFinished ? game.homeTeam.runs : curEvt.oppRuns;
      const curUserHits = isFinished ? game.awayTeam.hits : curEvt.userHits;
      const curOppHits = isFinished ? game.homeTeam.hits : curEvt.oppHits;

      awayRowHTML += `<td class="stat-total">${curUserRuns}</td><td class="stat-total">${curUserHits}</td><td class="stat-total">0</td>`;
      homeRowHTML += `<td class="stat-total">${curOppRuns}</td><td class="stat-total">${curOppHits}</td><td class="stat-total">0</td>`;

      // Diamond bases with active runner names:
      const activeBases = (isFinished || isPreGame) ? [null, null, null] : (curEvt.newBases || [null, null, null]);
      const b1 = activeBases[0];
      const b2 = activeBases[1];
      const b3 = activeBases[2];

      const getRunnerShort = (r) => {
        if (!r) return '';
        const parts = (r.name || '').split(' ');
        return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : (r.name || '');
      };

      // Base situation banner description & High-Leverage Tension Detection
      let situationText = _t('challenge162.playoff_runners_bases_empty', 'Bases Limpias');
      let isHighLeverage = false;

      if (b1 && b2 && b3) {
        situationText = _t('challenge162.playoff_runners_loaded', '🔥 ¡BASES LLENAS!');
        isHighLeverage = true;
      } else if (b2 && b3) {
        situationText = _t('challenge162.playoff_runners_2b_3b', '⚡ Corredores en 2da y 3ra (Posición Anotadora)');
        isHighLeverage = true;
      } else if (b1 && b3) {
        situationText = _t('challenge162.playoff_runners_1b_3b', '⚡ Corredores en las Esquinas');
        isHighLeverage = true;
      } else if (b1 && b2) {
        situationText = _t('challenge162.playoff_runners_1b_2b', 'Corredores en 1ra y 2da');
      } else if (b2) {
        situationText = _t('challenge162.playoff_runners_2b', 'Corredor en 2da (Posición Anotadora)');
      } else if (b3) {
        situationText = _t('challenge162.playoff_runners_3b', '⚡ Corredor en 3ra (Amenaza de Carrera)');
        isHighLeverage = true;
      } else if (b1) {
        situationText = _t('challenge162.playoff_runners_1b', 'Corredor en 1ra');
      }

      if (!isFinished && curEvt.inning >= 8 && Math.abs(curUserRuns - curOppRuns) <= 2) {
        isHighLeverage = true;
      }

      const outsCount = isFinished ? 3 : (curEvt.newOuts || 0);
      const ballsCount = isFinished ? 0 : (curEvt.balls || 0);
      const strikesCount = isFinished ? 0 : (curEvt.strikes || 0);

      // Play narrative text:
      let narrativeText = '';
      let textClass = 'c162-ticker-text';
      let outcomePillHTML = '';

      if (isPreGame) {
        narrativeText = `⚾ ${_t('challenge162.playoff_pregame_ready', '¡El partido está listo para comenzar! Primer turno:')} ${curEvt.batter.name} vs ${curEvt.pitcher.name}`;
      } else if (curEvt.outcome === 'SB' || curEvt.outcome === 'CS') {
        const baseName = curEvt.base === 3 ? '3B' : '2B';
        narrativeText = curEvt.outcome === 'SB' ? `🏃 ${curEvt.batter.name} steals ${baseName}!` : `🚫 ${curEvt.batter.name} is caught stealing ${baseName}.`;
        textClass += curEvt.outcome === 'SB' ? ' highlight-hit' : ' highlight-out';
        outcomePillHTML = `<span class="c162-event-badge ${curEvt.outcome === 'SB' ? 'badge-hit' : 'badge-out'}">${curEvt.outcome}</span>`;
      } else if (curEvt.detail === 'E') {
        narrativeText = `${curEvt.batter.name} reaches on an error${curEvt.errBy ? ` by ${curEvt.errBy}` : ''}.${curEvt.runsScored ? ` (+${curEvt.runsScored} R)` : ''}`;
        textClass += ' highlight-hit';
        outcomePillHTML = `<span class="c162-event-badge badge-bb">ERROR</span>`;
      } else if (curEvt.detail === 'DP') {
        narrativeText = `${curEvt.batter.name} grounds into a double play.${curEvt.runsScored ? ` (+${curEvt.runsScored} R)` : ''}`;
        textClass += ' highlight-out';
        outcomePillHTML = `<span class="c162-event-badge badge-out">DOUBLE PLAY</span>`;
      } else if (curEvt.outcome === 'OUT' && curEvt.runsScored > 0) {
        narrativeText = `${curEvt.batter.name} ${curEvt.detail === 'SF' ? 'hits a sacrifice fly' : 'drives in a run with a groundout'}. (+${curEvt.runsScored} R)`;
        textClass += ' highlight-out';
        outcomePillHTML = `<span class="c162-event-badge badge-out">${curEvt.detail === 'SF' ? 'SAC FLY' : 'RBI OUT'}</span>`;
      } else if (curEvt.outcome === 'HR') {
        narrativeText = _t('challenge162.pa_hr', `¡${curEvt.batter.name} conecta un descomunal cuadrangular! (+${curEvt.runsScored} carreras)`, { batter: curEvt.batter.name, runs: curEvt.runsScored });
        textClass += ' highlight-hr';
        outcomePillHTML = `<span class="c162-event-badge badge-hr">${_t('challenge162.badge_hr', '💥 JONRÓN')}</span>`;
      } else if (curEvt.outcome === '3B') {
        narrativeText = _t('challenge162.pa_3b', `¡${curEvt.batter.name} conecta triple profundo al callejón! (+${curEvt.runsScored} carreras)`, { batter: curEvt.batter.name, runs: curEvt.runsScored });
        outcomePillHTML = `<span class="c162-event-badge badge-hit">${_t('challenge162.badge_3b', '⚡ TRIPLE')}</span>`;
      } else if (curEvt.outcome === '2B') {
        narrativeText = _t('challenge162.pa_2b', `¡${curEvt.batter.name} conecta doblete contra la pared! (+${curEvt.runsScored} carreras)`, { batter: curEvt.batter.name, runs: curEvt.runsScored });
        outcomePillHTML = `<span class="c162-event-badge badge-hit">${_t('challenge162.badge_2b', '🔥 DOBLE')}</span>`;
      } else if (curEvt.outcome === '1B') {
        narrativeText = _t('challenge162.pa_1b', `¡${curEvt.batter.name} conecta imparable al jardín! (+${curEvt.runsScored} carreras)`, { batter: curEvt.batter.name, runs: curEvt.runsScored });
        outcomePillHTML = `<span class="c162-event-badge badge-hit">${_t('challenge162.badge_1b', '⚾ SENCILLO')}</span>`;
      } else if (curEvt.outcome === 'BB') {
        narrativeText = _t('challenge162.pa_bb', `${curEvt.batter.name} negocia boleto con paciencia.`, { batter: curEvt.batter.name });
        outcomePillHTML = `<span class="c162-event-badge badge-bb">${_t('challenge162.badge_bb', '🚶 BOLETO')}</span>`;
      } else if (curEvt.outcome === 'SO') {
        narrativeText = _t('challenge162.pa_so', `${curEvt.pitcher.name} poncha a ${curEvt.batter.name} tirándole.`, { pitcher: curEvt.pitcher.name, batter: curEvt.batter.name });
        textClass += ' highlight-out';
        outcomePillHTML = `<span class="c162-event-badge badge-so">${_t('challenge162.badge_so', '💨 PONCHE')}</span>`;
      } else {
        narrativeText = _t('challenge162.pa_out', `${curEvt.batter.name} falla con roletazo/elevado.`, { batter: curEvt.batter.name });
        textClass += ' highlight-out';
        outcomePillHTML = `<span class="c162-event-badge badge-out">${_t('challenge162.badge_out', '🛑 OUT')}</span>`;
      }

      if (!isPreGame && curEvt.stolenBase) {
        narrativeText += ` 🏃 ` + _t('challenge162.pa_sb', `¡${curEvt.batter.name} estafa la segunda base con éxito!`, { runner: curEvt.batter.name });
      }

      // Buttons labels:
      const btnNextPaText = _t('challenge162.playoff_btn_next_pa', '▶ Siguiente Bateador');
      const btnNextInningText = _t('challenge162.playoff_btn_next_inning', '⏩ Siguiente Entrada');
      const btnSimEndText = _t('challenge162.playoff_btn_sim_end', '⚡ Simular al Final');
      const btnAutoPlayText = sim.autoPlay ? '⏸ Pausar' : _t('challenge162.playoff_btn_autoplay', '▶ Auto-Play');
      const tabBroadcastLabel = _t('challenge162.playoff_tab_broadcast', '🏟️ CAMPO EN VIVO');
      const tabLineupsLabel = _t('challenge162.playoff_tab_lineups', '📋 ALINEACIONES');
      const tabBoxScoreLabel = _t('challenge162.playoff_tab_boxscore', '📊 BOX SCORE OFICIAL');
      const tabPbpLabel = _t('challenge162.playoff_tab_pbp', '📜 JUGADA A JUGADA');

      let actionButtonsHTML = '';
      if (!isFinished) {
        actionButtonsHTML = `
          <button id="btn-playoff-next-pa" class="c162-sim-btn btn" style="background:#0284c7;color:#fff;">${btnNextPaText}</button>
          <button id="btn-playoff-next-inn" class="c162-sim-btn btn" style="background:#0369a1;color:#fff;">${btnNextInningText}</button>
          <button id="btn-playoff-autoplay" class="c162-sim-btn btn" style="background:${sim.autoPlay ? '#f59e0b' : '#334155'};color:#fff;">${btnAutoPlayText}</button>
          <button id="btn-playoff-sim-end" class="c162-sim-btn btn" style="background:linear-gradient(135deg,#eab308,#ca8a04);color:#000;font-weight:bold;">${btnSimEndText}</button>
        `;
      } else {
        const won = game.won;
        const resultTitle = won ? _t('challenge162.playoff_game_won', '¡VICTORIA EN EL JUEGO DE PLAYOFF!') : _t('challenge162.playoff_game_lost', 'DERROTA EN EL JUEGO DE PLAYOFF');
        const continueBtnText = won
          ? (game.round === 2 ? _t('challenge162.playoff_btn_view_ws_trophy', '👑 Ver Coronación Mundial') : _t('challenge162.playoff_btn_continue_playoffs', '🏆 Avanzar a Siguiente Ronda'))
          : _t('challenge162.playoff_btn_view_results', '📋 Ver Resumen de Temporada');

        actionButtonsHTML = `
          <div style="width:100%;text-align:center;margin-bottom:10px;">
            <div style="font-family:'Press Start 2P',monospace;font-size:13px;color:${won ? '#ffd700' : '#f87171'};margin-bottom:4px;text-shadow:0 0 16px ${won ? 'rgba(255,215,0,0.8)' : 'rgba(239,68,68,0.8)'};">
              ${won ? '🏆' : '💀'} ${resultTitle} (${curUserRuns} - ${curOppRuns})
            </div>
          </div>
          <div style="display:flex;justify-content:center;gap:12px;width:100%;flex-wrap:wrap;">
            <button id="btn-playoff-finish-game" class="btn" style="padding:12px 24px;font-size:11px;font-family:'Press Start 2P',monospace;background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;border:2px solid #fff;box-shadow:0 0 25px rgba(255,215,0,0.6);cursor:pointer;">
              ${continueBtnText}
            </button>
          </div>
        `;
      }

      // Build Tab Content:
      let tabContentHTML = '';
      if (activeTab === 'broadcast') {
        tabContentHTML = `
          <!-- Main Field & Matchup Split Grid -->
          <div class="c162-broadcast-main-grid">
            
            <!-- Diamond Field Card -->
            <div class="c162-stadium-field-card">
              <!-- Inning display badge placed clearly above the diamond without overlap -->
              <div style="display:flex;justify-content:center;margin-bottom:12px;z-index:5;position:relative;">
                <span style="font-family:'Press Start 2P',monospace;font-size:9.5px;color:#38bdf8;background:rgba(0,0,0,0.85);padding:5px 12px;border-radius:6px;border:1px solid rgba(56,189,248,0.4);box-shadow:0 2px 10px rgba(0,0,0,0.6);">
                  ${isFinished ? 'FINAL' : inningDisplay}
                </span>
              </div>

              <!-- Diamond Graphic with Bases and Runner Tags -->
              <div class="c162-diamond-canvas">
                <div class="c162-base-pod base-home"></div>
                <div class="c162-base-pod base-1b ${b1 ? 'occupied' : ''}">
                  ${b1 ? `<span class="c162-runner-tag">${getRunnerShort(b1)}</span>` : ''}
                </div>
                <div class="c162-base-pod base-2b ${b2 ? 'occupied' : ''}">
                  ${b2 ? `<span class="c162-runner-tag">${getRunnerShort(b2)}</span>` : ''}
                </div>
                <div class="c162-base-pod base-3b ${b3 ? 'occupied' : ''}">
                  ${b3 ? `<span class="c162-runner-tag">${getRunnerShort(b3)}</span>` : ''}
                </div>
              </div>

              <!-- BSO LED Panel -->
              <div class="c162-bso-panel">
                <div class="c162-bso-row">
                  <span>BALL</span>
                  <div class="c162-led-group">
                    <div class="c162-led-dot ${ballsCount >= 1 ? 'ball-on' : ''}"></div>
                    <div class="c162-led-dot ${ballsCount >= 2 ? 'ball-on' : ''}"></div>
                    <div class="c162-led-dot ${ballsCount >= 3 ? 'ball-on' : ''}"></div>
                    <div class="c162-led-dot ${ballsCount >= 4 ? 'ball-on' : ''}"></div>
                  </div>
                </div>
                <div class="c162-bso-row">
                  <span>STRIKE</span>
                  <div class="c162-led-group">
                    <div class="c162-led-dot ${strikesCount >= 1 ? 'strike-on' : ''}"></div>
                    <div class="c162-led-dot ${strikesCount >= 2 ? 'strike-on' : ''}"></div>
                  </div>
                </div>
                <div class="c162-bso-row">
                  <span>OUT</span>
                  <div class="c162-led-group">
                    <div class="c162-led-dot ${outsCount >= 1 ? 'out-on' : ''}"></div>
                    <div class="c162-led-dot ${outsCount >= 2 ? 'out-on' : ''}"></div>
                  </div>
                </div>
                <div style="font-size:9.5px;color:${isHighLeverage ? '#ffd700' : '#cbd5e1'};text-align:center;border-top:1px solid rgba(255,255,255,0.08);padding-top:4px;margin-top:2px;font-weight:${isHighLeverage ? 'bold' : 'normal'};${isHighLeverage ? 'text-shadow: 0 0 10px rgba(255,215,0,0.8);' : ''}">
                  ${situationText}
                </div>
              </div>
            </div>

            <!-- Matchup Duel Section -->
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div class="c162-duel-card-grid">
                
                <!-- Pitcher Duel Card -->
                <div class="c162-duel-player-card pitcher-card">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                    <div>
                      <div style="font-size:8px;color:#38bdf8;font-family:'Press Start 2P',monospace;">${pitchingLabel} (${curEvt.pitcher.role})</div>
                      <div style="font-size:13px;font-weight:bold;color:#f3f4f6;margin-top:3px;">${curEvt.pitcher.name}</div>
                    </div>
                    <span style="font-size:9.5px;color:#38bdf8;font-family:'Press Start 2P',monospace;background:rgba(56,189,248,0.15);padding:3px 6px;border-radius:4px;border:1px solid rgba(56,189,248,0.3);">OVR ${curEvt.pitcher.ovr}</span>
                  </div>
                  <div style="background:rgba(0,0,0,0.4);padding:8px 10px;border-radius:6px;font-size:11px;color:#94a3af;line-height:1.5;">
                    <div>📊 <strong>${todayLineLabel}:</strong> <span style="color:#e4e4e7;">${curEvt.pitcher.line || '0.0 IP, 0 H, 0 ER, 0 K'}</span></div>
                    <div>⚡ <strong>${pitchesLabel}:</strong> <span style="color:#ffd700;font-weight:bold;">${curEvt.pitcher.pitches || 0}</span></div>
                  </div>
                </div>

                <!-- Batter Duel Card -->
                <div class="c162-duel-player-card batter-card">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                    <div>
                      <div style="font-size:8px;color:#ffd700;font-family:'Press Start 2P',monospace;">${atBatLabel} (${curEvt.batter.pos})</div>
                      <div style="font-size:13px;font-weight:bold;color:#f3f4f6;margin-top:3px;">${curEvt.batter.name}</div>
                    </div>
                    <span style="font-size:9.5px;color:#ffd700;font-family:'Press Start 2P',monospace;background:rgba(255,215,0,0.15);padding:3px 6px;border-radius:4px;border:1px solid rgba(255,215,0,0.3);">OVR ${curEvt.batter.ovr}</span>
                  </div>
                  <div style="background:rgba(0,0,0,0.4);padding:8px 10px;border-radius:6px;font-size:11px;color:#94a3af;line-height:1.5;">
                    <div>⚾ <strong>${todayLineLabel}:</strong> <span style="color:#ffd700;font-weight:bold;">${curEvt.batter.line || '0-0'}</span></div>
                    <div>🎯 <strong>${turnTeamLabel}:</strong> <span style="color:#e4e4e7;">${curEvt.half === 'TOP' ? game.awayTeam.name : game.homeTeam.name}</span></div>
                  </div>
                </div>

              </div>

              <!-- Live Narrative Play-By-Play Ticker -->
              <div class="c162-ticker-box">
                <div style="display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap;">
                  ${outcomePillHTML}
                  <span class="${textClass}">
                    ${isFinished ? `⚾ ${finalScoreLabel}: ${game.awayTeam.name} ${curUserRuns} - ${curOppRuns} ${game.homeTeam.name}` : narrativeText}
                  </span>
                </div>
              </div>

            </div>

          </div>
        `;
      } else if (activeTab === 'lineups') {
        // Lineups Tab View
        const renderLineupSide = (teamName, isHome, lineupList, pitcherList) => {
          const validBatters = (lineupList || []).filter(Boolean).slice(0, 9);
          const rows = validBatters.map((b, idx) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:11px;">
              <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#9ca3af;width:20px;">${idx + 1}.</span>
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#38bdf8;width:32px;">${b.pos || 'DH'}</span>
              <span style="flex:1;font-weight:bold;color:#f3f4f6;padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.name || 'Player'}</span>
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#ffd700;background:rgba(255,215,0,0.12);padding:2px 5px;border-radius:4px;">OVR ${b.ovr || 80}</span>
            </div>
          `).join('');

          const validPitchers = (pitcherList || []).filter(Boolean);
          const pRows = validPitchers.map(p => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:11px;">
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#a78bfa;width:55px;">${p.role || 'P'}</span>
              <span style="flex:1;font-weight:bold;color:#f3f4f6;padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.cleanName || p.name || 'Pitcher'}</span>
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#38bdf8;background:rgba(56,189,248,0.12);padding:2px 5px;border-radius:4px;">OVR ${p.ovr || 80}</span>
            </div>
          `).join('');

          return `
            <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;">
              <div style="font-family:'Press Start 2P',monospace;font-size:10.5px;color:${isHome ? '#ffd700' : '#38bdf8'};border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:6px;margin-bottom:4px;">
                ${isHome ? '👑' : '⚾'} ${teamName}
              </div>
              <div style="font-size:9.5px;font-family:'Press Start 2P',monospace;color:#94a3af;margin-top:2px;">
                ${_t('challenge162.batting_lineup', 'Alineación Titular')}
              </div>
              <div style="background:rgba(255,255,255,0.02);border-radius:6px;padding:2px 4px;">
                ${rows}
              </div>
              <div style="font-size:9.5px;font-family:'Press Start 2P',monospace;color:#94a3af;margin-top:6px;">
                ${_t('challenge162.pitching_staff', 'Cuerpo de Pitcheo')}
              </div>
              <div style="background:rgba(255,255,255,0.02);border-radius:6px;padding:2px 4px;">
                ${pRows}
              </div>
            </div>
          `;
        };

        tabContentHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            ${renderLineupSide(game.awayTeam.name, false, game.userLineup || game.awayTeam.batting, game.userPitchers || game.awayTeam.pitching)}
            ${renderLineupSide(game.homeTeam.name, true, game.oppLineup || game.homeTeam.batting, game.oppPitchers || game.homeTeam.pitching)}
          </div>
        `;
      } else if (activeTab === 'boxscore') {
        // Multi-game Box Score Tab View with live in-progress snapshot (0 spoilers)
        const currentLiveSnapshot = this._buildLiveBoxScoreSnapshot(game, sim.currentStep, sim.finished);
        const allBoxScores = (this.state.playoffs.boxScores || []).slice();
        const currIdx = allBoxScores.findIndex(b => b.round === game.round);
        if (currIdx >= 0) {
          allBoxScores[currIdx] = currentLiveSnapshot;
        } else {
          allBoxScores.push(currentLiveSnapshot);
        }

        const activeBoxScoreIdx = this._selectedPlayoffBoxScoreIndex >= 0 && this._selectedPlayoffBoxScoreIndex < allBoxScores.length
          ? this._selectedPlayoffBoxScoreIndex
          : allBoxScores.length - 1;
        const targetGame = allBoxScores[activeBoxScoreIdx] || currentLiveSnapshot;

        const selectorTabsHTML = allBoxScores.map((b, idx) => {
          const rTitle = getRoundTitle(b.round);
          const isAct = idx === activeBoxScoreIdx;
          return `
            <button class="c162-game-tab-btn ${isAct ? 'active' : ''}" data-boxidx="${idx}">
              ${idx === 2 ? '🏆' : '⚾'} ${rTitle} (${b.awayTeam.runs}-${b.homeTeam.runs})
            </button>
          `;
        }).join('');

        tabContentHTML = `
          <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
              <div style="font-family:'Press Start 2P',monospace;font-size:9.5px;color:#ffd700;">
                📊 ${targetGame.roundTitle || 'Box Score'} · ${targetGame.awayTeam.name} (${targetGame.awayTeam.runs}) @ ${targetGame.homeTeam.name} (${targetGame.homeTeam.runs})
              </div>
              <div class="c162-game-selector-tabs" style="margin-bottom:0;">
                ${selectorTabsHTML}
              </div>
            </div>
            ${this._renderBoxScoreTablesHTML(targetGame)}
          </div>
        `;
      } else if (activeTab === 'pbp') {
        // Play-By-Play Log Tab
        const pbpEntriesHTML = events.slice(0, sim.currentStep).map((ev, i) => {
          let badge = `<span class="c162-event-badge badge-out">OUT</span>`;
          if (ev.outcome === 'HR') badge = `<span class="c162-event-badge badge-hr">HR</span>`;
          else if (['1B', '2B', '3B'].includes(ev.outcome)) badge = `<span class="c162-event-badge badge-hit">${ev.outcome}</span>`;
          else if (ev.outcome === 'BB') badge = `<span class="c162-event-badge badge-bb">BB</span>`;
          else if (ev.outcome === 'SO') badge = `<span class="c162-event-badge badge-so">SO</span>`;
          else if (ev.outcome === 'SB') badge = `<span class="c162-event-badge badge-hit">SB</span>`;
          else if (ev.outcome === 'CS') badge = `<span class="c162-event-badge badge-out">CS</span>`;
          else if (ev.detail === 'E') badge = `<span class="c162-event-badge badge-bb">E</span>`;
          else if (ev.detail === 'DP') badge = `<span class="c162-event-badge badge-out">DP</span>`;
          else if (ev.detail === 'SF') badge = `<span class="c162-event-badge badge-out">SF</span>`;

          const halfLabel = ev.half === 'TOP' ? '▲' : '▼';
          return `
            <div class="c162-pbp-entry">
              <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#38bdf8;width:55px;">${halfLabel} ${ev.inning}</span>
              ${badge}
              <span style="flex:1;color:#f3f4f6;">
                <strong>${ev.batter.name}</strong> vs <strong>${ev.pitcher.name}</strong> · ${ev.detail || ev.outcome} ${ev.runsScored > 0 ? `(+${ev.runsScored} R)` : ''}
              </span>
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#ffd700;">
                ${ev.userRuns} - ${ev.oppRuns}
              </span>
            </div>
          `;
        }).reverse().join('');

        tabContentHTML = `
          <div class="c162-pbp-container">
            ${pbpEntriesHTML || `<div style="color:#9ca3af;text-align:center;padding:20px;">${isPreGame ? _t('challenge162.playoff_pbp_pregame', 'El partido está listo para comenzar.') : _t('challenge162.playoff_pbp_empty', 'No hay jugadas registradas aún.')}</div>`}
          </div>
        `;
      }

      container.innerHTML = `
        <div class="c162-sim-stage">
          <!-- Stadium Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:6px;">
            <div>
              <div style="font-family:'Press Start 2P',monospace;font-size:12.5px;color:#ffd700;letter-spacing:1px;">
                🏆 ${roundTitle}
              </div>
              <div style="font-size:10.5px;color:#94a3af;margin-top:2px;">
                ${simTitle} · ${game.awayTeam.name} vs ${game.homeTeam.name}
              </div>
            </div>
            <button id="btn-playoff-exit-back" class="btn btn-secondary" style="padding:4px 8px;font-size:8.5px;font-family:'Press Start 2P',monospace;">
              ${backBtnText}
            </button>
          </div>

          <!-- Jumbotron Linescore -->
          <div class="c162-linescore-wrap">
            <table class="c162-linescore-table">
              <thead><tr>${linescoreHeadHTML}</tr></thead>
              <tbody>
                <tr>${awayRowHTML}</tr>
                <tr>${homeRowHTML}</tr>
              </tbody>
            </table>
          </div>

          <!-- Tab Bar -->
          <div class="c162-broadcast-tab-bar">
            <button id="tab-btn-broadcast" class="c162-broadcast-tab-btn ${activeTab === 'broadcast' ? 'active' : ''}">${tabBroadcastLabel}</button>
            <button id="tab-btn-lineups" class="c162-broadcast-tab-btn ${activeTab === 'lineups' ? 'active' : ''}">${tabLineupsLabel}</button>
            <button id="tab-btn-boxscore" class="c162-broadcast-tab-btn ${activeTab === 'boxscore' ? 'active' : ''}">${tabBoxScoreLabel}</button>
            <button id="tab-btn-pbp" class="c162-broadcast-tab-btn ${activeTab === 'pbp' ? 'active' : ''}">${tabPbpLabel}</button>
          </div>

          <!-- Tab Main View -->
          ${tabContentHTML}

          <!-- Simulation Controls Bar -->
          <div class="c162-sim-controls">
            ${actionButtonsHTML}
          </div>
        </div>
      `;

      // Event Listeners:
      const tabBroadcast = document.getElementById('tab-btn-broadcast');
      if (tabBroadcast) tabBroadcast.onclick = () => { this._activePlayoffTab = 'broadcast'; this.renderPlayoffLiveGame(); };

      const tabLineups = document.getElementById('tab-btn-lineups');
      if (tabLineups) tabLineups.onclick = () => { this._activePlayoffTab = 'lineups'; this.renderPlayoffLiveGame(); };

      const tabBoxScore = document.getElementById('tab-btn-boxscore');
      if (tabBoxScore) tabBoxScore.onclick = () => { this._activePlayoffTab = 'boxscore'; this.renderPlayoffLiveGame(); };

      const tabPbp = document.getElementById('tab-btn-pbp');
      if (tabPbp) tabPbp.onclick = () => { this._activePlayoffTab = 'pbp'; this.renderPlayoffLiveGame(); };

      // Box Score multi-game tab clicks:
      container.querySelectorAll('.c162-game-tab-btn').forEach(btn => {
        btn.onclick = () => {
          this._selectedPlayoffBoxScoreIndex = parseInt(btn.getAttribute('data-boxidx'), 10);
          this.renderPlayoffLiveGame();
        };
      });

      const btnNextPa = document.getElementById('btn-playoff-next-pa');
      if (btnNextPa) {
        btnNextPa.onclick = () => {
          sim.currentStep++;
          this.renderPlayoffLiveGame();
        };
      }

      const btnNextInn = document.getElementById('btn-playoff-next-inn');
      if (btnNextInn) {
        btnNextInn.onclick = () => {
          if (sim.currentStep === 0) {
            // Advance past Top 1:
            while (sim.currentStep < totalSteps) {
              sim.currentStep++;
              const nextEvt = events[sim.currentStep - 1];
              if (!nextEvt || nextEvt.inning !== 1 || nextEvt.half !== 'TOP') {
                break;
              }
            }
          } else {
            const curInn = curEvt.inning;
            const curHalf = curEvt.half;
            while (sim.currentStep < totalSteps) {
              sim.currentStep++;
              const nextEvt = events[sim.currentStep - 1];
              if (!nextEvt || nextEvt.inning !== curInn || nextEvt.half !== curHalf) {
                break;
              }
            }
          }
          this.renderPlayoffLiveGame();
        };
      }

      const btnSimEnd = document.getElementById('btn-playoff-sim-end');
      if (btnSimEnd) {
        btnSimEnd.onclick = () => {
          if (sim.timer) clearInterval(sim.timer);
          sim.autoPlay = false;
          sim.currentStep = totalSteps;
          this.renderPlayoffLiveGame();
        };
      }

      const btnAutoPlay = document.getElementById('btn-playoff-autoplay');
      if (btnAutoPlay) {
        btnAutoPlay.onclick = () => {
          if (sim.autoPlay) {
            sim.autoPlay = false;
            if (sim.timer) clearInterval(sim.timer);
            sim.timer = null;
          } else {
            sim.autoPlay = true;
            sim.timer = setInterval(() => {
              if (sim.currentStep >= totalSteps) {
                clearInterval(sim.timer);
                sim.timer = null;
                sim.autoPlay = false;
                this.renderPlayoffLiveGame();
                return;
              }
              sim.currentStep++;
              this.renderPlayoffLiveGame();
            }, 600);
          }
          this.renderPlayoffLiveGame();
        };
      }

      const btnFinishGame = document.getElementById('btn-playoff-finish-game');
      if (btnFinishGame) {
        btnFinishGame.onclick = () => this.finishPlayoffGame(game.won, game);
      }

      const btnExitBack = document.getElementById('btn-playoff-exit-back');
      if (btnExitBack) {
        btnExitBack.onclick = () => {
          if (sim.timer) clearInterval(sim.timer);
          sim.autoPlay = false;
          const pg = this.state && this.state.playoffs.pendingGame;
          if (pg && pg.game === game) { pg.step = sim.currentStep; this.save(); }
          this.showScreen('screen-challenge-playoffs');
          this.renderPlayoffs();
        };
      }
    },
    _buildLiveBoxScoreSnapshot(game, currentStep, isFinished) {
      if (isFinished || currentStep >= (game.events || []).length) {
        return game; // Full official final box score
      }
      const eventsPlayed = (game.events || []).slice(0, currentStep);

      const awayBattersMap = {};
      (game.userLineup || (game.awayTeam && game.awayTeam.batting) || []).forEach(b => {
        awayBattersMap[b.name] = { name: b.name, pos: b.pos || 'DH', ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, sb: 0 };
      });
      const homeBattersMap = {};
      (game.oppLineup || (game.homeTeam && game.homeTeam.batting) || []).forEach(b => {
        homeBattersMap[b.name] = { name: b.name, pos: b.pos || 'DH', ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, sb: 0 };
      });

      const awayPitchersMap = {};
      const homePitchersMap = {};

      let curAwayRuns = 0, curHomeRuns = 0;
      const awayLinescore = [];
      const homeLinescore = [];

      eventsPlayed.forEach(ev => {
        const isTop = ev.half === 'TOP';
        const bMap = isTop ? awayBattersMap : homeBattersMap;
        const pMap = isTop ? homePitchersMap : awayPitchersMap;

        const bName = ev.batter ? ev.batter.name : null;
        if (bName && !bMap[bName]) {
          bMap[bName] = { name: bName, pos: ev.batter.pos || 'DH', ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, sb: 0 };
        }
        const bStat = bName ? bMap[bName] : null;

        const pName = ev.pitcher ? (ev.pitcher.cleanName || ev.pitcher.name) : 'Pitcher';
        if (!pMap[pName]) {
          pMap[pName] = { name: pName, role: ev.pitcher ? (ev.pitcher.role || 'P') : 'P', outs: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, hr: 0, pitches: 0, decision: '' };
        }
        const pStat = pMap[pName];
        if (ev.d) {
          // New games: the engine says exactly what the play was worth.
          const d = ev.d;
          const line = n => bMap[n] || (bMap[n] = { name: n, pos: '', ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, sb: 0 });
          if (ev.pitcher) pStat.pitches = ev.pitcher.pitches || pStat.pitches;
          if (ev.outcome !== 'SB' && ev.outcome !== 'CS' && bStat) {
            bStat.ab += d.ab; bStat.rbi += d.rbi;
            if (ev.outcome === 'BB') { bStat.bb++; pStat.bb++; }
            if (ev.outcome === 'SO') { bStat.so++; pStat.so++; }
            if (['1B', '2B', '3B', 'HR'].includes(ev.outcome)) {
              bStat.h++; pStat.h++;
              if (ev.outcome === '2B') bStat.doubles++;
              if (ev.outcome === '3B') bStat.triples++;
              if (ev.outcome === 'HR') { bStat.hr++; pStat.hr++; }
            }
          }
          pStat.outs += d.outs; pStat.er += d.er; pStat.r += ev.runsScored || 0;
          (d.scored || []).forEach(n => { line(n).r++; });
          if (d.sb) line(d.sb).sb++;
          if (isTop) curAwayRuns += ev.runsScored || 0; else curHomeRuns += ev.runsScored || 0;
          return;
        }
        if (pStat) pStat.pitches = (pStat.pitches || 0) + (ev.strikes || 0) + (ev.balls || 0) + 1;

        if (ev.outcome === 'BB') {
          if (bStat) bStat.bb++;
          if (pStat) pStat.bb++;
        } else if (ev.outcome === 'SO' || ev.outcome === 'OUT') {
          if (bStat) { bStat.ab++; if (ev.outcome === 'SO') bStat.so++; }
          if (pStat) { pStat.outs++; if (ev.outcome === 'SO') pStat.so++; }
        } else if (ev.outcome === 'HR') {
          if (bStat) { bStat.ab++; bStat.h++; bStat.hr++; bStat.r++; }
          if (pStat) { pStat.h++; pStat.hr++; }
        } else {
          if (bStat) {
            bStat.ab++; bStat.h++;
            if (ev.outcome === '2B') bStat.doubles++;
            if (ev.outcome === '3B') bStat.triples++;
          }
          if (pStat) pStat.h++;
        }

        if (ev.runsScored) {
          if (bStat) bStat.rbi += ev.runsScored;
          if (pStat) { pStat.r += ev.runsScored; pStat.er += ev.runsScored; }
          if (isTop) curAwayRuns += ev.runsScored;
          else curHomeRuns += ev.runsScored;
        }

        if (ev.stolenBase && bStat) {
          bStat.sb++;
        }
      });

      const maxInn = eventsPlayed.length > 0 ? eventsPlayed[eventsPlayed.length - 1].inning : 1;
      for (let inn = 1; inn <= maxInn; inn++) {
        const topEvs = eventsPlayed.filter(e => e.inning === inn && e.half === 'TOP');
        const botEvs = eventsPlayed.filter(e => e.inning === inn && e.half === 'BOT');
        const aRuns = topEvs.reduce((sum, e) => sum + (e.runsScored || 0), 0);
        const hRuns = botEvs.reduce((sum, e) => sum + (e.runsScored || 0), 0);
        if (topEvs.length > 0) awayLinescore.push(aRuns);
        if (botEvs.length > 0) homeLinescore.push(hRuns);
      }

      return {
        round: game.round,
        roundTitle: game.roundTitle,
        awayTeam: {
          name: game.awayTeam.name,
          runs: curAwayRuns,
          hits: eventsPlayed.filter(e => e.half === 'TOP' && ['1B','2B','3B','HR'].includes(e.outcome)).length,
          errors: eventsPlayed.filter(e => e.half === 'BOT' && e.detail === 'E').length,
          linescore: awayLinescore,
          batting: Object.values(awayBattersMap),
          pitching: Object.values(awayPitchersMap)
        },
        homeTeam: {
          name: game.homeTeam.name,
          runs: curHomeRuns,
          hits: eventsPlayed.filter(e => e.half === 'BOT' && ['1B','2B','3B','HR'].includes(e.outcome)).length,
          errors: eventsPlayed.filter(e => e.half === 'TOP' && e.detail === 'E').length,
          linescore: homeLinescore,
          batting: Object.values(homeBattersMap),
          pitching: Object.values(homePitchersMap)
        }
      };
    },
    _renderBoxScoreTablesHTML(game) {
      const _t = (key, fallback) => (typeof window.t === 'function' ? window.t(key) : fallback);
      const battingTitle = _t('challenge162.playoff_boxscore_batting', 'ESTADÍSTICAS DE BATEO');
      const pitchingTitle = _t('challenge162.playoff_boxscore_pitching', 'ESTADÍSTICAS DE PITCHEO');
      const batterColLabel = _t('challenge162.table_player', 'BATEADOR');
      const pitcherColLabel = _t('challenge162.table_pitcher', 'LANZADOR');

      const renderBattingTable = (teamName, batters) => {
        const rows = (batters || []).map(b => {
          const avg = b.ab > 0 ? (b.h / b.ab).toFixed(3).replace('0.', '.') : '.---';
          return `
            <tr class="c162-tr">
              <td class="c162-td" style="text-align:left;font-family:'Outfit',sans-serif;font-weight:bold;">${b.name} <span style="font-size:9px;color:#9ca3af;">(${b.pos})</span></td>
              <td class="c162-td">${b.ab}</td>
              <td class="c162-td" style="font-weight:bold;color:#ffd700;">${b.r}</td>
              <td class="c162-td" style="font-weight:bold;color:#fff;">${b.h}</td>
              <td class="c162-td">${b.doubles}</td>
              <td class="c162-td">${b.triples}</td>
              <td class="c162-td" style="color:#f59e0b;">${b.hr}</td>
              <td class="c162-td" style="font-weight:bold;color:#38bdf8;">${b.rbi}</td>
              <td class="c162-td">${b.bb}</td>
              <td class="c162-td">${b.so}</td>
              <td class="c162-td">${b.sb}</td>
              <td class="c162-td" style="font-family:'JetBrains Mono',monospace;">${avg}</td>
            </tr>
          `;
        }).join('');

        return `
          <div style="margin-bottom:12px;">
            <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#ffd700;margin-bottom:4px;">${teamName} — ${battingTitle}</div>
            <div class="c162-table-wrap">
              <table class="c162-table">
                <thead>
                  <tr>
                    <th class="c162-th c162-th-name">${batterColLabel}</th>
                    <th class="c162-th">AB</th><th class="c162-th">R</th><th class="c162-th">H</th>
                    <th class="c162-th">2B</th><th class="c162-th">3B</th><th class="c162-th">HR</th>
                    <th class="c162-th">RBI</th><th class="c162-th">BB</th><th class="c162-th">SO</th>
                    <th class="c162-th">SB</th><th class="c162-th">AVG</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        `;
      };

      const renderPitchingTable = (teamName, pitchers) => {
        const rows = (pitchers || []).map(p => {
          const ip = `${Math.floor(p.outs / 3)}.${p.outs % 3}`;
          const era = p.outs > 0 ? ((p.er * 27) / p.outs).toFixed(2) : '0.00';
          const decStr = p.decision ? `<span style="background:rgba(255,215,0,0.2);color:#ffd700;padding:2px 5px;border-radius:3px;font-size:8.5px;font-weight:bold;">${p.decision}</span>` : '';
          return `
            <tr class="c162-tr">
              <td class="c162-td" style="text-align:left;font-family:'Outfit',sans-serif;font-weight:bold;">${p.name} <span style="font-size:9px;color:#9ca3af;">(${p.role})</span> ${decStr}</td>
              <td class="c162-td" style="font-weight:bold;">${ip}</td>
              <td class="c162-td">${p.h}</td>
              <td class="c162-td">${p.r}</td>
              <td class="c162-td" style="color:#f87171;">${p.er}</td>
              <td class="c162-td">${p.bb}</td>
              <td class="c162-td" style="font-weight:bold;color:#38bdf8;">${p.so}</td>
              <td class="c162-td">${p.hr}</td>
              <td class="c162-td">${p.pitches || '-'}</td>
              <td class="c162-td" style="font-family:'JetBrains Mono',monospace;">${era}</td>
            </tr>
          `;
        }).join('');

        return `
          <div style="margin-bottom:12px;">
            <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#38bdf8;margin-bottom:4px;">${teamName} — ${pitchingTitle}</div>
            <div class="c162-table-wrap">
              <table class="c162-table">
                <thead>
                  <tr>
                    <th class="c162-th c162-th-name">${pitcherColLabel}</th>
                    <th class="c162-th">IP</th><th class="c162-th">H</th><th class="c162-th">R</th>
                    <th class="c162-th">ER</th><th class="c162-th">BB</th><th class="c162-th">SO</th>
                    <th class="c162-th">HR</th><th class="c162-th">PIT</th><th class="c162-th">ERA</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        `;
      };

      return `
        ${renderBattingTable(game.awayTeam.name, game.awayTeam.batting)}
        ${renderPitchingTable(game.awayTeam.name, game.awayTeam.pitching)}
        ${renderBattingTable(game.homeTeam.name, game.homeTeam.batting)}
        ${renderPitchingTable(game.homeTeam.name, game.homeTeam.pitching)}
      `;
    },

    showPlayoffBoxScoreModal(targetGameOrIndex) {
      const existing = document.getElementById('c162-playoff-boxscore-modal');
      if (existing) existing.remove();

      const allBoxScores = (this.state && this.state.playoffs && this.state.playoffs.boxScores) || [];
      if (!allBoxScores.length && typeof targetGameOrIndex === 'object') {
        allBoxScores.push(targetGameOrIndex);
      }

      let selectedIndex = typeof targetGameOrIndex === 'number' ? targetGameOrIndex : (allBoxScores.length - 1);
      if (selectedIndex < 0) selectedIndex = 0;

      const _t = (key, fallback) => (typeof window.t === 'function' ? window.t(key) : fallback);
      const title = _t('challenge162.playoff_boxscore_title', 'BOX SCORE OFICIAL');
      const closeBtnText = _t('challenge162.modal_close', '✕ CERRAR');

      const modal = document.createElement('div');
      modal.id = 'c162-playoff-boxscore-modal';
      modal.className = 'c162-boxscore-modal';

      const renderModalContent = (idx) => {
        const game = allBoxScores[idx] || (typeof targetGameOrIndex === 'object' ? targetGameOrIndex : allBoxScores[0]);
        if (!game) return;

        const selectorTabsHTML = allBoxScores.map((b, bIdx) => {
          const rTitle = b.roundTitle || `Ronda ${b.round + 1}`;
          const isAct = bIdx === idx;
          return `
            <button class="c162-game-tab-btn ${isAct ? 'active' : ''}" data-modalboxidx="${bIdx}">
              ${bIdx === 2 ? '🏆' : '⚾'} ${rTitle} (${b.awayTeam.runs}-${b.homeTeam.runs})
            </button>
          `;
        }).join('');

        modal.innerHTML = `
          <div class="c162-boxscore-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:8px;margin-bottom:10px;">
              <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:#ffd700;">
                📊 ${title} · ${game.awayTeam.name} (${game.awayTeam.runs}) @ ${game.homeTeam.name} (${game.homeTeam.runs})
              </div>
              <button id="btn-close-boxscore-modal" class="btn btn-secondary" style="padding:6px 12px;font-size:10px;font-family:'Press Start 2P',monospace;cursor:pointer;">
                ${closeBtnText}
              </button>
            </div>
            ${allBoxScores.length > 1 ? `
              <div class="c162-game-selector-tabs">
                ${selectorTabsHTML}
              </div>
            ` : ''}
            <div style="overflow-y:auto;flex:1;padding-right:4px;">
              ${this._renderBoxScoreTablesHTML(game)}
            </div>
          </div>
        `;

        const closeBtn = modal.querySelector('#btn-close-boxscore-modal');
        if (closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); modal.remove(); };

        modal.querySelectorAll('.c162-game-tab-btn').forEach(btn => {
          btn.onclick = () => {
            const nextIdx = parseInt(btn.getAttribute('data-modalboxidx'), 10);
            renderModalContent(nextIdx);
          };
        });
      };

      document.body.appendChild(modal);
      renderModalContent(selectedIndex);
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    },

    finishPlayoffGame(won, detailedGame) {
      if (!this.state) return;
      const S = this.state;
      if (!S.playoffs.boxScores) S.playoffs.boxScores = [];
      S.playoffs.boxScores.push(detailedGame);
      delete S.playoffs.pendingGame;

      if (S.playoffs.bracket) this._resolvePlayoffRound(S.playoffs.round, won);
      if (!won) {
        S.playoffs.finished = true;
        S.playoffs.won = false;
        if (S.playoffs.bracket) this._simulateRestOfPlayoffs();
        this.recordSeasonFinished(S, false);
      } else if (S.playoffs.round >= PLAYOFF_ROUNDS.length - 1) {
        S.playoffs.finished = true;
        S.playoffs.won = true;
        this.recordSeasonFinished(S, true);
      } else {
        S.playoffs.round++;
      }

      this._activePlayoffSim = null;
      this.save();
      this.showScreen(S.playoffs.finished ? 'screen-challenge-results' : 'screen-challenge-playoffs');
      this.render();
    },

    // ── UI ──────────────────────────────────────────────────────────────
    _activeSlot: null,
    _draftLineup: null,
    _draftPitchers: null,
    _selectedFranchise: 'NYY',
    _selectedEra: 'Golden Era (1920-1941)',
    _activeFilterPill: 'ALL',
    _previousHubView: 'hub',

    hideAllTopLevelScreens() {
      ['screen-mode-select', 'screen-menu', 'screen-challenge-hub', 'screen-challenge-pack', 'screen-challenge-roster', 'screen-challenge-season', 'screen-challenge-liga', 'screen-challenge-playoffs', 'screen-challenge-results'].forEach(id => {
        const s = document.getElementById(id);
        if (s) s.classList.add('hidden');
      });
      const gameWorkspace = document.getElementById('game-workspace');
      if (gameWorkspace) gameWorkspace.classList.add('hidden');
      const hud = document.getElementById('game-hud');
      if (hud) hud.classList.add('hidden');
      document.body.classList.remove('workspace-active');
      document.body.classList.remove('on-main-menu');
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowY = '';
    },
    showScreen(id) {
      if (id !== 'screen-challenge-season') this.stopAutoSim();
      this.hideAllTopLevelScreens();
      if (['screen-challenge-hub', 'screen-challenge-pack', 'screen-challenge-roster', 'screen-challenge-season', 'screen-challenge-liga', 'screen-challenge-playoffs', 'screen-challenge-results'].includes(id)) {
        document.body.classList.add('on-challenge-mode');
      } else {
        document.body.classList.remove('on-challenge-mode');
      }
      const target = document.getElementById(id);
      if (target) target.classList.remove('hidden');
      if (window.updateMobileNavVisibility) window.updateMobileNavVisibility();
    },

    render() {
      if (!this.state) {
        this.renderHub();
        return;
      }
      if (this.state.playoffs && this.state.playoffs.finished) {
        this.showScreen('screen-challenge-results');
        this.renderResults();
        return;
      }
      if (this.canStartPlayoffs() || (this.state.playoffs && this.state.playoffs.round > 0)) {
        this.showScreen('screen-challenge-playoffs');
        this.renderPlayoffs();
        return;
      }
      this.showScreen('screen-challenge-season');
      this.renderSeason();
    },

    // ── Challenge Hub (Mode & Themed Selector) ───────────────────────────
    // ── Challenge Hub (Pokelike Inspired Mode & Sub-Challenge Selector) ───
    renderHub() {
      this._previousHubView = 'hub';
      this.showScreen('screen-challenge-hub');
      const container = document.getElementById('challenge162-hub-container');
      if (!container) return;

      if (!this.unlockedBatters || !this.unlockedPitchers) {
        this.initUnlocks();
      }

      const records = this.getRecords();
      const hasActiveRun = this.hasSave() && this.load() && this.state && this.state.gamesPlayed < 162 && !this.state.playoffs.finished;

      const totalUnlockedB = getBatterPool().filter(p => this.isBatterUnlocked(p)).length;
      const totalUnlockedP = getPitcherPool().filter(p => this.isPitcherUnlocked(p)).length;
      const totalCards = totalUnlockedB + totalUnlockedP;

      const batterHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.batters) || {};
      const pitcherHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};

      let readyFranchises = 0;
      let clearedFranchises = 0;
      MLB_FRANCHISES.forEach(fran => {
        const bCount = getBatterPool().filter(p => (this.isBatterUnlocked(p) || this.isDexUnlocked(p)) && (p.team === fran.code || (batterHistory[p.playerID] && batterHistory[p.playerID][fran.code]))).length;
        const pCount = getPitcherPool().filter(p => (this.isPitcherUnlocked(p) || this.isDexUnlocked(p)) && (p.team === fran.code || (pitcherHistory[p.playerID] && pitcherHistory[p.playerID][fran.code]))).length;
        if (bCount + pCount >= 17) readyFranchises++;
        if (records.teamClears && records.teamClears[fran.code]) clearedFranchises++;
      });

      let readyEras = 0;
      let clearedEras = 0;
      BASEBALL_ERAS.forEach(era => {
        const bCount = getBatterPool().filter(p => (this.isBatterUnlocked(p) || this.isDexUnlocked(p)) && p.era === era.key).length;
        const pCount = getPitcherPool().filter(p => (this.isPitcherUnlocked(p) || this.isDexUnlocked(p)) && p.era === era.key).length;
        if (bCount + pCount >= 17) readyEras++;
        if (records.eraClears && records.eraClears[era.key]) clearedEras++;
      });

      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      const hubTitle = _t('challenge162.hub_title', '162-0 CHALLENGE HUB');
      const hubSubtitle = _t('challenge162.hub_subtitle', 'Elige tu formato de temporada regular y postemporada');
      const bestStreakText = _t('challenge162.best_streak', 'MEJOR RACHA');
      const wsText = _t('challenge162.world_series', 'SERIES MUNDIALES');
      const seasonsPlayedText = _t('challenge162.seasons_played', 'TEMPORADAS');
      const totalColText = _t('challenge162.total_collection', 'COLECCIÓN TOTAL');

      const winsValStr = `${records.maxStreak || 0} WINS`;
      const wsValStr = `${records.worldSeriesWins || 0} TITLES`;
      const seasonsValStr = `${records.completedSeasons || 0} PLAYED`;
      const cardsValStr = `${totalCards} CARDS`;

      const mainMenuText = _t('challenge162.main_menu', 'MENÚ PRINCIPAL');

      const packsBadge = _t('challenge162.packs_badge', 'FORMATO SOBRES');
      const packsTitle = _t('challenge162.packs_title', 'DRAFT DE SOBRES HOBBY');
      const packsDesc = _t('challenge162.packs_desc', 'Abre 25 sobres retro directamente del universo de leyendas MLB para draftear tu alineación de 9 titulares, 5 de banca, rotación de 5 abridores y 6 relevistas.');
      const playPacksBtn = _t('challenge162.play_packs', 'DRAFT CON SOBRES');

      const allStarBadge = _t('challenge162.free_draft_badge', 'COLECCIÓN LIBRE');
      const allStarTitle = _t('challenge162.all_star_title', 'ALL-STAR DREAM TEAM');
      const allStarDesc = _t('challenge162.all_star_desc', 'Construye tu alineación y cuerpo de pitcheo sin restricciones utilizando cualquier carta desbloqueada en tu colección.');
      const playAllStarBtn = _t('challenge162.play_all_star', 'JUGAR ALL-STAR');

      const monoTeamBadge = _t('challenge162.mono_team_badge', 'FRANQUICIA ÚNICA');
      const monoTeamTitle = _t('challenge162.mono_team_title', 'DESAFÍO MONO-TEAM');
      const monoTeamDesc = _t('challenge162.mono_team_desc', 'Compite exclusivamente con peloteros que vistieron la camiseta de una única franquicia de Grandes Ligas.');
      const selectFranchiseBtn = _t('challenge162.select_franchise_btn', 'ELEGIR EQUIPO ▶');

      const monoEraBadge = _t('challenge162.mono_era_badge', 'ÉPOCA HISTÓRICA');
      const monoEraTitle = _t('challenge162.mono_era_title', 'DESAFÍO MONO-ERA');
      const monoEraDesc = _t('challenge162.mono_era_desc', 'Viaja en el tiempo y compite únicamente con las estrellas de una de las 9 eras doradas del béisbol.');
      const selectEraBtn = _t('challenge162.select_era_btn', 'ELEGIR ERA ▶');

      const resumeText = _t('challenge162.resume', 'CONTINUAR');
      const abandonText = _t('challenge162.abandon', 'ABANDONAR');

      container.innerHTML = `
        <div class="c162-hub-wrap">
          <!-- Pokelike Header -->
          <div class="c162-hub-header">
            <div>
              <div style="font-family: 'Press Start 2P', monospace; font-size: 13px; color: var(--challenge162-accent); letter-spacing: 0.5px;">
                ⚔️ ${hubTitle}
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
                ${hubSubtitle}
              </div>
            </div>
            <button id="btn-challenge162-hub-back" class="btn btn-secondary" style="padding: 8px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace;">
              ← ${mainMenuText}
            </button>
          </div>

          <!-- Pokelike Hall of Records Banner -->
          <div class="c162-records-banner">
            <div class="c162-record-stat">
              <span class="c162-record-label">👑 ${bestStreakText}</span>
              <span class="c162-record-val">${winsValStr}</span>
            </div>
            <div class="c162-record-stat">
              <span class="c162-record-label">🏆 ${wsText}</span>
              <span class="c162-record-val">${wsValStr}</span>
            </div>
            <div class="c162-record-stat">
              <span class="c162-record-label">⚾ ${seasonsPlayedText}</span>
              <span class="c162-record-val">${seasonsValStr}</span>
            </div>
            <div class="c162-record-stat">
              <span class="c162-record-label">🎴 ${totalColText}</span>
              <span class="c162-record-val" style="color: #38bdf8;">${cardsValStr}</span>
            </div>
            <div class="c162-record-stat">
              <span class="c162-record-label">⚔️ MONO-TEAM</span>
              <span class="c162-record-val" style="color: #34d399; font-size: 13px;">${clearedFranchises} / ${MLB_FRANCHISES.length} WS</span>
            </div>
            <div class="c162-record-stat">
              <span class="c162-record-label">⏳ MONO-ERA</span>
              <span class="c162-record-val" style="color: #c084fc; font-size: 13px;">${clearedEras} / ${BASEBALL_ERAS.length} WS</span>
            </div>
          </div>

          <!-- Active Season Resume (if any) -->
          ${hasActiveRun ? `
            <div class="c162-active-run-banner">
              <div>
                <div style="font-family: 'Press Start 2P', monospace; font-size: 10.5px; color: #10b981;">
                  ▶ ${_t('challenge162.active_run', `SEASON IN PROGRESS: ${(this.state.modeConfig && this.state.modeConfig.label) || '162-0 CHALLENGE'}`, { mode: (this.state.modeConfig && this.state.modeConfig.label) || '162-0 CHALLENGE' })}
                </div>
                <div style="font-size: 12px; color: #e2e8f0; margin-top: 4px;">
                  ${_t('challenge162.current_record', `Current record: ${this.state.wins} - ${this.state.losses} (${this.state.gamesPlayed}/162 games)`, { wins: this.state.wins, losses: this.state.losses, current: this.state.gamesPlayed, total: 162 })}
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button id="btn-challenge162-resume-season" class="btn" style="padding: 8px 16px; font-size: 10px; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #10b981, #059669); color: #000; border: none; cursor: pointer; border-radius: 8px;">
                  ▶ ${resumeText}
                </button>
                <button id="btn-challenge162-abandon-season" class="btn btn-secondary" style="padding: 8px 12px; font-size: 9.5px;">
                  🗑️ ${abandonText}
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Modes Grid (4 Pokelike Mode Cards) -->
          <div class="c162-modes-grid">
            <!-- Card 1: Hobby Packs Draft -->
            <div class="c162-mode-card" style="border-color: rgba(255, 215, 0, 0.4); box-shadow: 0 4px 20px rgba(255, 215, 0, 0.15);">
              <div>
                <span class="c162-mode-badge" style="background: rgba(255, 215, 0, 0.2); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.5);">
                  ${packsBadge}
                </span>
                <div class="c162-mode-title" style="color: #ffd700;">📦 ${packsTitle}</div>
                <div class="c162-mode-desc">
                  ${packsDesc}
                </div>
                <div style="margin-top: 10px; padding: 8px 10px; background: rgba(255, 215, 0, 0.08); border-radius: 6px; border: 1px dashed rgba(255, 215, 0, 0.3); font-size: 8px; color: #ffd700; font-family: 'Press Start 2P', monospace; line-height: 1.5;">
                  ${_t('challenge162.hub_packs_chip', '✨ 25 PACKS: 14 BATTERS + 11 PITCHERS')}
                </div>
              </div>
              <button id="btn-start-packsdraft-mode" class="btn" style="width: 100%; margin-top: 14px; padding: 11px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #ffd700, #b45309); color: #000; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 0 16px rgba(255, 215, 0, 0.4); font-weight: bold;">
                📦 ${playPacksBtn}
              </button>
            </div>

            <!-- Card 2: All-Star Classic -->
            <div class="c162-mode-card">
              <div>
                <span class="c162-mode-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);">
                  ${allStarBadge}
                </span>
                <div class="c162-mode-title">👑 ${allStarTitle}</div>
                <div class="c162-mode-desc">
                  ${allStarDesc}
                </div>
                <div style="margin-top: 10px; padding: 8px 10px; background: rgba(56, 189, 248, 0.08); border-radius: 6px; border: 1px dashed rgba(56, 189, 248, 0.3); font-size: 8px; color: #38bdf8; font-family: 'Press Start 2P', monospace; line-height: 1.5;">
                  ${_t('challenge162.hub_allstar_chip', '💎 FULL UNLOCKED COLLECTION')}
                </div>
              </div>
              <button id="btn-start-allstar-mode" class="btn" style="width: 100%; margin-top: 14px; padding: 11px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #38bdf8, #0284c7); color: #000; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 0 15px rgba(56, 189, 248, 0.3); font-weight: bold;">
                🚀 ${playAllStarBtn}
              </button>
            </div>

            <!-- Card 3: Mono-Team (Clean Pokelike Entry) -->
            <div class="c162-mode-card" style="border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);">
              <div>
                <span class="c162-mode-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);">
                  ${monoTeamBadge}
                </span>
                <div class="c162-mode-title" style="color: #34d399;">⚔️ ${monoTeamTitle}</div>
                <div class="c162-mode-desc">
                  ${monoTeamDesc}
                </div>
                <div class="c162-pokelike-chips" style="margin-top: 10px;">
                  <span class="c162-pokelike-tag ready">${_t('challenge162.franchises_ready_chip', `🟢 ${readyFranchises}/${MLB_FRANCHISES.length} TEAMS READY`, { ready: readyFranchises, total: MLB_FRANCHISES.length })}</span>
                  ${clearedFranchises > 0 ? `<span class="c162-pokelike-tag champion">🏆 ${clearedFranchises} WS</span>` : ''}
                </div>
              </div>
              <button id="btn-goto-monoteam-select" class="btn" style="width: 100%; margin-top: 14px; padding: 11px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #10b981, #047857); color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 0 14px rgba(16, 185, 129, 0.35);">
                ⚾ ${selectFranchiseBtn}
              </button>
            </div>

            <!-- Card 4: Mono-Era (Clean Pokelike Entry) -->
            <div class="c162-mode-card" style="border-color: rgba(168, 85, 247, 0.4); box-shadow: 0 4px 20px rgba(168, 85, 247, 0.15);">
              <div>
                <span class="c162-mode-badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4);">
                  ${monoEraBadge}
                </span>
                <div class="c162-mode-title" style="color: #c084fc;">⏳ ${monoEraTitle}</div>
                <div class="c162-mode-desc">
                  ${monoEraDesc}
                </div>
                <div class="c162-pokelike-chips" style="margin-top: 10px;">
                  <span class="c162-pokelike-tag ready">${_t('challenge162.eras_ready_chip', `🟢 ${readyEras}/${BASEBALL_ERAS.length} ERAS READY`, { ready: readyEras, total: BASEBALL_ERAS.length })}</span>
                  ${clearedEras > 0 ? `<span class="c162-pokelike-tag champion">🏆 ${clearedEras} WS</span>` : ''}
                </div>
              </div>
              <button id="btn-goto-monoera-select" class="btn" style="width: 100%; margin-top: 14px; padding: 11px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #c084fc, #9333ea); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 0 14px rgba(192, 132, 252, 0.35);">
                ⏳ ${selectEraBtn}
              </button>
            </div>
          </div>
        </div>
      `;

      // Event listeners
      const btnBack = document.getElementById('btn-challenge162-hub-back');
      if (btnBack) btnBack.onclick = () => { this.showScreen('screen-mode-select'); this.updateModeSelectCard(); };

      const btnResume = document.getElementById('btn-challenge162-resume-season');
      if (btnResume) btnResume.onclick = () => { this.render(); };

      const btnAbandon = document.getElementById('btn-challenge162-abandon-season');
      if (btnAbandon) btnAbandon.onclick = () => {
        if (confirm(_t('challenge162.abandon_confirm', 'Are you sure you want to abandon the current season? All progress will be lost.'))) {
          this.clear();
          this.renderHub();
        }
      };

      const btnPacks = document.getElementById('btn-start-packsdraft-mode');
      if (btnPacks) btnPacks.onclick = () => {
        this.startPacksDraftMode();
      };

      const btnAllStar = document.getElementById('btn-start-allstar-mode');
      if (btnAllStar) btnAllStar.onclick = () => {
        this.setModeConfig({ type: 'all_star', label: '👑 ALL-STAR DREAM TEAM', desc: 'Free Collection' });
        this.startRosterBuilder();
      };

      const btnGotoMonoTeam = document.getElementById('btn-goto-monoteam-select');
      if (btnGotoMonoTeam) btnGotoMonoTeam.onclick = () => {
        this.renderFranchiseSelect();
      };

      const btnGotoMonoEra = document.getElementById('btn-goto-monoera-select');
      if (btnGotoMonoEra) btnGotoMonoEra.onclick = () => {
        this.renderEraSelect();
      };
    },

    // ── Dedicated Franchise Selection Screen (Pokelike Style) ────────────
    renderFranchiseSelect() {
      this._previousHubView = 'franchise';
      this.showScreen('screen-challenge-hub');
      const container = document.getElementById('challenge162-hub-container');
      if (!container) return;

      if (!this.unlockedBatters || !this.unlockedPitchers) {
        this.initUnlocks();
      }

      const records = this.getRecords();
      const batterHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.batters) || {};
      const pitcherHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};

      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      let readyFranchises = 0;
      let clearedFranchises = 0;
      const franchiseData = MLB_FRANCHISES.map(fran => {
        const bCount = getBatterPool().filter(p => (this.isBatterUnlocked(p) || this.isDexUnlocked(p)) && (p.team === fran.code || (batterHistory[p.playerID] && batterHistory[p.playerID][fran.code]))).length;
        const pCount = getPitcherPool().filter(p => (this.isPitcherUnlocked(p) || this.isDexUnlocked(p)) && (p.team === fran.code || (pitcherHistory[p.playerID] && pitcherHistory[p.playerID][fran.code]))).length;
        const total = bCount + pCount;
        const isReady = total >= 17;
        const clears = (records.teamClears && records.teamClears[fran.code]) || 0;
        if (isReady) readyFranchises++;
        if (clears > 0) clearedFranchises++;
        return { fran, total, isReady, clears };
      });

      const backToHubText = _t('challenge162.back_to_hub', '← VOLVER AL HUB');
      const title = _t('challenge162.franchise_select_title', 'DESAFÍO MONO-TEAM (FRANQUICIAS MLB)');
      const desc = _t('challenge162.franchise_select_desc', 'Elige una franquicia de MLB. Tu roster completo de 17 peloteros se construirá exclusivamente con estrellas y leyendas que defendieron sus colores. Necesitas al menos 17 cartas desbloqueadas para jugar.');
      const searchPlaceholder = _t('challenge162.search_franchise', '🔍 Buscar franquicia (ej. Yankees, Dodgers, Boston...)');

      const tilesHTML = franchiseData.map(({ fran, total, isReady, clears }) => {
        return `
          <div class="c162-pokelike-tile ${isReady ? '' : 'locked'} c162-franchise-tile" data-code="${fran.code}" data-name="${fran.name.toLowerCase()}" data-city="${fran.city.toLowerCase()}" style="border-left: 4px solid ${fran.color}; cursor: ${isReady ? 'pointer' : 'default'};">
            <div class="c162-pokelike-emblem" style="background: ${fran.color}; border: 1.5px solid ${fran.accent || '#ffd700'};">
              ${fran.icon}
            </div>
            <div class="c162-pokelike-info">
              <div class="c162-pokelike-name">${fran.name}</div>
              <div class="c162-pokelike-sub">${fran.city} • <span style="font-family:'Press Start 2P',monospace; font-size:8.5px; color:${fran.accent || '#ffd700'};">${fran.code}</span></div>
              <div class="c162-pokelike-chips">
                <span class="c162-pokelike-tag ${isReady ? 'ready' : 'locked'}">${total} ${_t('challenge162.cards_label', 'CARDS')}</span>
                ${clears > 0 ? `<span class="c162-pokelike-tag champion">🏆 ${clears} WS</span>` : ''}
                ${!isReady ? `<span style="font-size:7.5px; color:#f87171; font-family:'Press Start 2P',monospace;">${_t('challenge162.need_more_count', `NEED ${17 - total}`, { count: 17 - total })}</span>` : ''}
              </div>
            </div>
            <div>
              ${isReady ? `
                <button class="c162-pokelike-btn play btn-c162-launch-team" data-code="${fran.code}">
                  ${_t('challenge162.play_btn', 'PLAY ▶')}
                </button>
              ` : `
                <div class="c162-pokelike-lock-box" title="Requires at least 17 cards to play">
                  🔒
                </div>
              `}
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="c162-subview-wrap">
          <!-- Top Bar -->
          <div class="c162-subview-header">
            <button id="btn-c162-back-hub" class="btn btn-secondary" style="padding: 8px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace;">
              ${backToHubText}
            </button>
            <input type="text" id="c162-franchise-search" class="c162-search-input" placeholder="${searchPlaceholder}" />
          </div>

          <!-- Pokelike Overview Card -->
          <div class="c162-pokelike-overview">
            <div class="c162-pokelike-overview-title">
              ⚔️ ${title}
            </div>
            <div class="c162-pokelike-overview-desc">
              ${desc}
            </div>
            <div class="c162-pokelike-progress-row">
              <span style="color: #ffd700;">${_t('challenge162.franchises_cleared_summary', `🏆 ${clearedFranchises} / ${MLB_FRANCHISES.length} Champion Franchises`, { cleared: clearedFranchises, total: MLB_FRANCHISES.length })}</span>
              <span style="color: #34d399;">${_t('challenge162.franchises_ready_summary', `🟢 ${readyFranchises} / ${MLB_FRANCHISES.length} Teams with Ready Roster (17+ cards)`, { ready: readyFranchises, total: MLB_FRANCHISES.length })}</span>
            </div>
          </div>

          <!-- Responsive Tiles Grid -->
          <div class="c162-pokelike-grid" id="c162-franchise-grid">
            ${tilesHTML}
          </div>
        </div>
      `;

      // Event listeners
      const btnBackHub = document.getElementById('btn-c162-back-hub');
      if (btnBackHub) btnBackHub.onclick = () => this.renderHub();

      const searchInput = document.getElementById('c162-franchise-search');
      if (searchInput) {
        searchInput.oninput = () => {
          const q = (searchInput.value || '').trim().toLowerCase();
          container.querySelectorAll('.c162-franchise-tile').forEach(tile => {
            const name = tile.getAttribute('data-name') || '';
            const city = tile.getAttribute('data-city') || '';
            const code = (tile.getAttribute('data-code') || '').toLowerCase();
            const match = !q || name.includes(q) || city.includes(q) || code.includes(q);
            tile.style.display = match ? 'flex' : 'none';
          });
        };
      }

      container.querySelectorAll('.btn-c162-launch-team').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const code = btn.getAttribute('data-code');
          const fran = MLB_FRANCHISES.find(f => f.code === code) || MLB_FRANCHISES[0];
          this.setModeConfig({
            type: 'mono_team',
            targetTeam: fran.code,
            label: `⚔️ MONO-TEAM: ${fran.name.toUpperCase()}`,
            teamName: fran.name
          });
          this.startRosterBuilder();
        };
      });

      container.querySelectorAll('.c162-pokelike-tile').forEach(tile => {
        tile.onclick = () => {
          const code = tile.getAttribute('data-code');
          const fran = MLB_FRANCHISES.find(f => f.code === code) || MLB_FRANCHISES[0];
          const item = franchiseData.find(d => d.fran.code === code);
          const total = item ? item.total : 0;
          if (item && item.isReady) {
            this.setModeConfig({
              type: 'mono_team',
              targetTeam: fran.code,
              label: `⚔️ MONO-TEAM: ${fran.name.toUpperCase()}`,
              teamName: fran.name
            });
            this.startRosterBuilder();
          } else {
            alert(_t('challenge162.need_cards_warning', `Se requieren al menos 17 cartas para este modo (tienes ${total}). ¡Gana partidas rápidas para desbloquear más!`, { count: total }));
          }
        };
      });
    },

    // ── Dedicated Historic Era Selection Screen (Pokelike Style) ─────────
    renderEraSelect() {
      this._previousHubView = 'era';
      this.showScreen('screen-challenge-hub');
      const container = document.getElementById('challenge162-hub-container');
      if (!container) return;

      if (!this.unlockedBatters || !this.unlockedPitchers) {
        this.initUnlocks();
      }

      const records = this.getRecords();
      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      let readyEras = 0;
      let clearedEras = 0;
      const eraData = BASEBALL_ERAS.map(era => {
        const bCount = getBatterPool().filter(p => (this.isBatterUnlocked(p) || this.isDexUnlocked(p)) && p.era === era.key).length;
        const pCount = getPitcherPool().filter(p => (this.isPitcherUnlocked(p) || this.isDexUnlocked(p)) && p.era === era.key).length;
        const total = bCount + pCount;
        const isReady = total >= 17;
        const clears = (records.eraClears && records.eraClears[era.key]) || 0;
        if (isReady) readyEras++;
        if (clears > 0) clearedEras++;
        return { era, total, isReady, clears };
      });

      const backToHubText = _t('challenge162.back_to_hub', '← VOLVER AL HUB');
      const title = _t('challenge162.era_select_title', 'DESAFÍO MONO-ERA (ERAS HISTÓRICAS)');
      const desc = _t('challenge162.era_select_desc', 'Viaja en el tiempo y juega exclusivamente con figuras de una época histórica del béisbol. Tu roster se armará únicamente con cartas de esa era. Necesitas al menos 17 cartas desbloqueadas para jugar.');

      const tilesHTML = eraData.map(({ era, total, isReady, clears }) => {
        return `
          <div class="c162-pokelike-tile ${isReady ? '' : 'locked'} c162-era-tile" data-key="${encodeURIComponent(era.key)}" style="border-left: 4px solid ${era.color}; cursor: ${isReady ? 'pointer' : 'default'};">
            <div class="c162-pokelike-emblem" style="background: ${era.color}; border: 1.5px solid rgba(255,255,255,0.3);">
              ${era.icon}
            </div>
            <div class="c162-pokelike-info">
              <div class="c162-pokelike-name">${era.label}</div>
              <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">${getEraDescription(era)}</div>
              <div class="c162-pokelike-chips">
                <span class="c162-pokelike-tag info">${getEraYears(era)}</span>
                <span class="c162-pokelike-tag ${isReady ? 'ready' : 'locked'}">${total} ${_t('challenge162.cards_label', 'CARDS')}</span>
                ${clears > 0 ? `<span class="c162-pokelike-tag champion">🏆 ${clears} WS</span>` : ''}
                ${!isReady ? `<span style="font-size:7.5px; color:#f87171; font-family:'Press Start 2P',monospace;">${_t('challenge162.need_more_count', `NEED ${17 - total}`, { count: 17 - total })}</span>` : ''}
              </div>
            </div>
            <div>
              ${isReady ? `
                <button class="c162-pokelike-btn play btn-c162-launch-era" data-key="${encodeURIComponent(era.key)}">
                  ${_t('challenge162.play_btn', 'PLAY ▶')}
                </button>
              ` : `
                <div class="c162-pokelike-lock-box" title="Requires at least 17 cards to play">
                  🔒
                </div>
              `}
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="c162-subview-wrap">
          <!-- Top Bar -->
          <div class="c162-subview-header">
            <button id="btn-c162-back-hub" class="btn btn-secondary" style="padding: 8px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace;">
              ${backToHubText}
            </button>
          </div>

          <!-- Pokelike Overview Card -->
          <div class="c162-pokelike-overview era-theme">
            <div class="c162-pokelike-overview-title">
              ⏳ ${title}
            </div>
            <div class="c162-pokelike-overview-desc">
              ${desc}
            </div>
            <div class="c162-pokelike-progress-row">
              <span style="color: #ffd700;">${_t('challenge162.eras_cleared_summary', `🏆 ${clearedEras} / ${BASEBALL_ERAS.length} Champion Eras`, { cleared: clearedEras, total: BASEBALL_ERAS.length })}</span>
              <span style="color: #34d399;">${_t('challenge162.eras_ready_summary', `🟢 ${readyEras} / ${BASEBALL_ERAS.length} Eras with Ready Roster (17+ cards)`, { ready: readyEras, total: BASEBALL_ERAS.length })}</span>
            </div>
          </div>

          <!-- Responsive Tiles Grid -->
          <div class="c162-pokelike-grid" id="c162-era-grid">
            ${tilesHTML}
          </div>
        </div>
      `;

      // Event listeners
      const btnBackHub = document.getElementById('btn-c162-back-hub');
      if (btnBackHub) btnBackHub.onclick = () => this.renderHub();

      container.querySelectorAll('.btn-c162-launch-era').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const key = decodeURIComponent(btn.getAttribute('data-key'));
          const era = BASEBALL_ERAS.find(e => e.key === key) || BASEBALL_ERAS[2];
          this.setModeConfig({
            type: 'mono_era',
            targetEra: era.key,
            label: `⏳ MONO-ERA: ${era.label.toUpperCase()}`,
            eraName: era.label
          });
          this.startRosterBuilder();
        };
      });

      container.querySelectorAll('.c162-pokelike-tile').forEach(tile => {
        tile.onclick = () => {
          const key = decodeURIComponent(tile.getAttribute('data-key'));
          const era = BASEBALL_ERAS.find(e => e.key === key) || BASEBALL_ERAS[2];
          const item = eraData.find(d => d.era.key === key);
          const total = item ? item.total : 0;
          if (item && item.isReady) {
            this.setModeConfig({
              type: 'mono_era',
              targetEra: era.key,
              label: `⏳ MONO-ERA: ${era.label.toUpperCase()}`,
              eraName: era.label
            });
            this.startRosterBuilder();
          } else {
            alert(_t('challenge162.need_cards_warning', `Se requieren al menos 17 cartas para este modo (tienes ${total}). ¡Gana partidas rápidas para desbloquear más!`, { count: total }));
          }
        };
      });
    },

    // ── Hobby Packs Draft Mode Engine ─────────────────────────────────────
    _packDraft: null,

    startPacksDraftMode() {
      this.setModeConfig({ type: 'packs', label: '📦 HOBBY PACKS DRAFT', desc: '25-Pack Universe Draft' });
      this._packDraft = {
        stage: 'batters',
        currentPack: 0,
        totalPacks: 14,
        pulledBatters: [],
        pulledPitchers: [],
        usedKeys: new Set(),
        packOpened: false,
        currentCard: null,
        manualSlots: null,
        schedule: { batters: this._rollPackSchedule(14), pitchers: this._rollPackSchedule(11) }
      };
      this.showScreen('screen-challenge-pack');
      this.renderPacksDraft();
    },

    // Each box keeps its guarantees (2 Epic+, 2 Rare+, 2 Uncommon+, the rest any rarity) but in
    // a random order, so a purple pack can show up at any moment. On top of that every pack has
    // a small chance of being a Legendary pack.
    _rollPackSchedule(n) {
      const tiers = ['Epic', 'Epic', 'Rare', 'Rare', 'Uncommon', 'Uncommon'];
      while (tiers.length < n) tiers.push(null);
      for (let i = tiers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
      }
      return tiers.map(t => (Math.random() < LEGENDARY_PACK_CHANCE ? 'Legendary' : t));
    },

    _getDraftSlotPlayer(slots, kind, key) {
      if (!slots) return null;
      if (kind === 'batter') return (slots.lineup && slots.lineup[key]) || null;
      if (kind === 'bench') return (slots.bench || [])[parseInt(key, 10)] || null;
      if (kind === 'SP') return (slots.sp || [])[parseInt(key, 10)] || null;
      if (kind === 'RP') return (slots.rp || [])[parseInt(key, 10)] || null;
      return null;
    },

    _setDraftSlotPlayer(slots, kind, key, player) {
      if (!slots) return;
      if (kind === 'batter') {
        if (!slots.lineup) slots.lineup = {};
        slots.lineup[key] = player;
      } else if (kind === 'bench') {
        if (!slots.bench) slots.bench = [null, null, null, null, null];
        slots.bench[parseInt(key, 10)] = player;
      } else if (kind === 'SP') {
        if (!slots.sp) slots.sp = [null, null, null, null, null];
        slots.sp[parseInt(key, 10)] = player;
      } else if (kind === 'RP') {
        if (!slots.rp) slots.rp = [null, null, null, null, null, null];
        slots.rp[parseInt(key, 10)] = player;
      }
    },

    renderPacksDraftTransition() {
      const container = document.getElementById('challenge162-pack-container');
      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);
      container.innerHTML = `
        <div style="max-width: 680px; margin: 30px auto; text-align:center; background:rgba(0,0,0,0.85); border:2px solid #ffd700; border-radius:14px; padding:28px; box-shadow:0 0 40px rgba(255,215,0,0.35);">
          <div style="font-size:44px; margin-bottom:12px;">⚾</div>
          <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#ffd700; margin-bottom:12px; line-height:1.4;">
            ${_t('challenge162.pack_transition_title', 'BATTERS BOX COMPLETED!')}
          </div>
          <p style="font-size:12px; color:#e2e8f0; line-height:1.6; margin-bottom:20px;">
            ${_t('challenge162.pack_transition_desc', 'Your starting lineup of <strong>9 batters</strong> and <strong>5 bench players</strong> are set. Now open the <strong>Pitchers Box (11 Packs)</strong> to draft your 5-man starting rotation (SP1-SP5) and 6-man bullpen (Closer, Setup, and 4 Middle Relievers).')}
          </p>
          <div style="display:inline-block; background:rgba(255,215,0,0.1); border:1px solid #ffd700; border-radius:8px; padding:12px 20px; margin-bottom:24px;">
            <div style="font-family:'Press Start 2P',monospace; font-size:9.5px; color:#ffd700; margin-bottom:4px;">
              ${_t('challenge162.pack_transition_box2', '📦 BOX #2: PITCHERS HOBBY BOX (11 PACKS)')}
            </div>
            <div style="font-size:9.5px; color:#9ca3af;">
              ${_t('challenge162.pack_transition_box2_sub', '5 Starters (SP) + 6 Bullpen Arms (CL, SU, RP1-RP4)')}
            </div>
          </div>
          <div>
            <button id="btn-c162-start-pitchers-box" class="btn" style="padding:14px 28px; font-family:'Press Start 2P',monospace; font-size:11px; background:linear-gradient(135deg,#ffd700,#f59e0b); color:#000; border:none; border-radius:8px; cursor:pointer; box-shadow:0 0 20px rgba(255,215,0,0.5); font-weight:bold;">
              ${_t('challenge162.pack_transition_btn', '📦 OPEN PITCHERS BOX (11 PACKS) ➔')}
            </button>
          </div>
        </div>
      `;

      const btn = document.getElementById('btn-c162-start-pitchers-box');
      if (btn) {
        btn.onclick = () => {
          this._packDraft.stage = 'pitchers';
          this._packDraft.currentPack = 0;
          this._packDraft.totalPacks = 11;
          this._packDraft.packOpened = false;
          this._packDraft.currentCard = null;
          this.renderPacksDraft();
        };
      }
    },

    // Guaranteed Pack Rarity Schedule:
    // Packs 1-2: Epic or better
    // Packs 3-4: Rare or better
    // Packs 5-6: Uncommon or better
    // Packs 7-8: Common or better (Base guarantee)
    // Packs 9+: Any Rarity
    _getPackTierInfo(packIndexZeroBased) {
      const _t = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
      const d = this._packDraft;
      const plan = d && d.schedule && d.schedule[d.stage];
      if (plan) {
        const tier = plan[packIndexZeroBased];
        if (tier === 'Legendary') return { minRarity: 'Legendary', legendary: true, badge: '👑 LEGENDARY PACK', color: '#fde68a', border: '#fbbf24', glow: 'rgba(251,191,36,0.85)' };
        if (tier === 'Epic') return { minRarity: 'Epic', badge: _t('challenge162.pack_tier_epic', '✨ EPIC OR BETTER'), color: '#c084fc', border: '#a855f7', glow: 'rgba(168,85,247,0.6)' };
        if (tier === 'Rare') return { minRarity: 'Rare', badge: _t('challenge162.pack_tier_rare', '💎 RARE OR BETTER'), color: '#60a5fa', border: '#3b82f6', glow: 'rgba(59,130,246,0.6)' };
        if (tier === 'Uncommon') return { minRarity: 'Uncommon', badge: _t('challenge162.pack_tier_uncommon', '🟢 UNCOMMON OR BETTER'), color: '#34d399', border: '#10b981', glow: 'rgba(16,185,129,0.6)' };
        return { minRarity: null, badge: _t('challenge162.pack_tier_any', '🎲 ANY RARITY'), color: '#ffd700', border: '#eab308', glow: 'rgba(234,179,8,0.5)' };
      }
      if (packIndexZeroBased === 0 || packIndexZeroBased === 1) {
        return { minRarity: 'Epic', badge: _t('challenge162.pack_tier_epic', '✨ EPIC OR BETTER'), color: '#c084fc', border: '#a855f7', glow: 'rgba(168,85,247,0.6)' };
      }
      if (packIndexZeroBased === 2 || packIndexZeroBased === 3) {
        return { minRarity: 'Rare', badge: _t('challenge162.pack_tier_rare', '💎 RARE OR BETTER'), color: '#60a5fa', border: '#3b82f6', glow: 'rgba(59,130,246,0.6)' };
      }
      if (packIndexZeroBased === 4 || packIndexZeroBased === 5) {
        return { minRarity: 'Uncommon', badge: _t('challenge162.pack_tier_uncommon', '🟢 UNCOMMON OR BETTER'), color: '#34d399', border: '#10b981', glow: 'rgba(16,185,129,0.6)' };
      }
      if (packIndexZeroBased === 6 || packIndexZeroBased === 7) {
        return { minRarity: 'Common', badge: _t('challenge162.pack_tier_common', '⚪ COMMON OR BETTER'), color: '#e2e8f0', border: '#94a3b8', glow: 'rgba(148,163,184,0.4)' };
      }
      return { minRarity: null, badge: _t('challenge162.pack_tier_any', '🎲 ANY RARITY'), color: '#ffd700', border: '#eab308', glow: 'rgba(234,179,8,0.5)' };
    },

    renderPacksDraft() {
      const container = document.getElementById('challenge162-pack-container');
      if (!container || !this._packDraft) return;

      const draft = this._packDraft;
      const isPitchersStage = draft.stage === 'pitchers';
      const isCardRevealed = Boolean(draft.packOpened && draft.currentCard);
      const packNum = isCardRevealed ? draft.currentPack : (draft.currentPack + 1);
      const totalInStage = draft.totalPacks;
      const globalCardNum = isPitchersStage ? (14 + packNum) : packNum;
      const isLastPackInStage = isCardRevealed && (draft.currentPack >= totalInStage);
      const isDraftComplete = isPitchersStage && isLastPackInStage;

      const allPulled = [...draft.pulledBatters, ...draft.pulledPitchers];
      const autoSlots = calculateChallengeRosterSlots(allPulled, false);
      if (!draft.manualSlots) {
        draft.manualSlots = {
          lineup: Object.assign({}, autoSlots.lineup),
          bench: (autoSlots.bench || []).slice(),
          sp: (autoSlots.sp || []).slice(),
          rp: (autoSlots.rp || []).slice()
        };
      }
      const updatedSlots = draft.manualSlots;

      const allSlotted = [
        ...Object.values(updatedSlots.lineup),
        ...(updatedSlots.bench || []),
        ...(updatedSlots.sp || []),
        ...(updatedSlots.rp || [])
      ].filter(Boolean);
      const avgOVR = allSlotted.length
        ? (allSlotted.reduce((acc, p) => acc + (p.ovr || 50), 0) / allSlotted.length).toFixed(1)
        : '—';

      const shownCard = draft.viewCard || draft.currentCard;
      const currentCardKey = shownCard
        ? (shownCard.role ? pitcherUnlockKey(shownCard) : batterUnlockKey(shownCard))
        : null;

      const _t = (key, fallback, params) => {
        if (typeof window.t === 'function') {
          const res = window.t(key, params);
          if (res && res !== key) return res;
        }
        if (params && typeof fallback === 'string') {
          return fallback.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, m) => params[m] !== undefined ? params[m] : (params[m] || ''));
        }
        return fallback;
      };

      const stageBoxName = isPitchersStage ? _t('challenge162.box_pitchers', 'PITCHERS BOX') : _t('challenge162.box_batters', 'BATTERS BOX');
      const packTier = this._getPackTierInfo(draft.currentPack);

      // ── Left Column Stage: Sealed Foil Pack OR Revealed 3D Card ──────────
      let leftColumnHTML = '';

      // draft.viewCard: a roster row was clicked, so the panel shows that player's card instead
      // of the pack (same card view as a fresh pull, flip included).
      if (!isCardRevealed && !draft.viewCard && draft.options && draft.options.length) {
        const needs = draft.optionNeeds || [];
        const gradeOf = v => (typeof getGrade === 'function' ? getGrade(v) : '');
        const tile = (c, i) => {
          const rar = String(c.rarity || 'Common');
          const pit = !!c.role;
          const stats = pit
            ? [['H/9', c.h9], ['K/9', c.k9], ['BB/9', c.bb9], ['HR/9', c.hr9], ['STA', c.sta], ['CLT', c.clt !== undefined ? c.clt : c.clu]]
            : [['CON', c.con], ['PWR', c.pwr], ['EYE', c.eye], ['K/AVD', c.k_avd], ['SPD', c.spd], ['DEF', c.def]];
          const pos = pit ? (c.role || 'SP') : `${c.pos}${c.sec_pos ? ' / ' + c.sec_pos : ''}`;
          // Only worth pointing out when it sets one card apart from the others.
          const fills = this._packOptionFills(c, needs) && !draft.options.every(o => this._packOptionFills(o, needs));
          const cardHTML = typeof window.createCardHTML === 'function'
            ? window.createCardHTML(c)
            : `<div class="player-card"><div class="card-name">${c.name}</div></div>`;
          return `<div class="c162-optcard r-${rar.toLowerCase()}" style="animation-delay:${i * 110}ms">
            <div class="c162-optcard-card" data-pack-view="${i}" title="See the full card">${cardHTML}</div>
            <div class="c162-optcard-cap"><b>${Math.floor(c.ovr || 50)}</b><span>${pit ? (c.role || 'SP') : c.pos} · ${rar}</span></div>
            <div class="c162-optcard-stats">${stats.map(([l, v]) => `<span><i>${l}</i><b>${v !== undefined ? Math.round(v) : '—'}</b></span>`).join('')}</div>
            <div class="c162-optcard-need">${fills ? 'FILLS A HOLE' : ''}</div>
            <button class="btn c162-opt-pick" data-pack-pick="${i}">✔ PICK</button>
          </div>`;
        };
        leftColumnHTML = `
          <div class="c162-opts">
            <div class="c162-opts-title"><b>${packTier.badge}</b><span>PACK ${draft.currentPack + 1} / ${totalInStage}</span></div>
            <div class="c162-opts-prompt">✨ PICK ONE OF ${draft.options.length} ✨</div>
            <div class="c162-opts-row">${draft.options.map(tile).join('')}</div>
            <div class="c162-opts-hint">Click a card to see it in full before you decide</div>
          </div>`;
      } else if (!isCardRevealed && !draft.viewCard) {
        const boxLabel = isPitchersStage ? _t('challenge162.box_pitchers', 'PITCHERS BOX') : _t('challenge162.box_batters', 'BATTERS BOX');
        const boxSubtitle = isPitchersStage ? _t('challenge162.pitchers_box_subtitle', '5 Starters (SP) + 6 Relievers') : _t('challenge162.batters_box_subtitle', '9 Starters + 5 Bench');
        leftColumnHTML = `
          <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,215,0,0.3); border-radius:12px; padding:20px; text-align:center; min-height:540px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <div class="dex-foil-pack-wrapper ${packTier.legendary ? 'c162-pack-legendary' : ''}" id="c162-foil-pack-target" style="cursor:pointer; margin: 10px auto;" title="${_t('challenge162.pack_tap_rip', 'TAP THE PACK TO RIP OPEN!')}">
              <div class="dex-foil-pack" id="c162-foil-pack-inner" style="background:linear-gradient(135deg, #1e293b 0%, #0f172a 40%, #1e1b4b 70%, #311042 100%); border-color:${packTier.border}; box-shadow:0 0 35px ${packTier.glow};">
                <div class="dex-foil-crimp" id="c162-pack-crimp-top" style="background:repeating-linear-gradient(90deg, ${packTier.border}, ${packTier.border} 3px, #b45309 3px, #b45309 6px);"></div>

                <div style="text-align:center; margin: 24px 0;">
                  <div style="font-size:42px; filter:drop-shadow(0 0 14px ${packTier.border}); margin-bottom:8px;">📦</div>
                  <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:#ffd700; text-shadow:0 0 12px rgba(255,215,0,0.8); line-height:1.4;">
                    ${boxLabel}
                  </div>
                  <div style="font-size:9.5px; color:#cbd5e1; margin-top:6px;">
                    ${boxSubtitle}
                  </div>
                  
                  <!-- Guaranteed Rarity Badge -->
                  <div style="margin-top:10px; display:inline-block; padding:4px 10px; background:rgba(0,0,0,0.7); border:1px solid ${packTier.border}; border-radius:14px; font-family:'Press Start 2P',monospace; font-size:7.5px; color:${packTier.color}; box-shadow:0 0 10px ${packTier.glow};">
                    ${packTier.badge}
                  </div>

                  <div style="display:inline-block; margin-top:8px; padding:4px 10px; background:rgba(0,0,0,0.6); border:1px dashed #ffd700; border-radius:20px; font-family:'Press Start 2P',monospace; font-size:8px; color:#ffd700;">
                    ${_t('challenge162.pack_num_indicator', `PACK ${packNum} / ${totalInStage}`, { current: packNum, total: totalInStage })}
                  </div>
                </div>

                <div class="dex-foil-crimp" id="c162-pack-crimp-bottom" style="background:repeating-linear-gradient(90deg, ${packTier.border}, ${packTier.border} 3px, #b45309 3px, #b45309 6px);"></div>
              </div>
            </div>

            <div style="font-family:'Press Start 2P',monospace; font-size:8.5px; color:${packTier.color}; margin-top:16px; animation:pulse 1.5s infinite;">
              ${_t('challenge162.pack_rip_prompt', '✨ TAP PACK TO RIP OPEN ✨')}
            </div>
            <div style="margin-top:10px; font-size:9.5px; color:#94a3b8; font-family:'Press Start 2P',monospace; line-height:1.4;">
              ${_t('challenge162.pack_click_to_reveal', 'Click the pack to rip it open: three cards come out and you keep one')}
            </div>
          </div>
        `;
      } else {
        const card = draft.viewCard || draft.currentCard;
        const rarity = card.rarity || 'Common';
        const rColor = RARITY_COLORS[rarity] || (card.ovr >= 95 ? '#ffd700' : (card.ovr >= 88 ? '#a855f7' : (card.ovr >= 80 ? '#3b82f6' : (card.ovr >= 75 ? '#10b981' : '#6b7280'))));
        const isPitcher = Boolean(card.role);
        const eraShort = card.era || 'All-Time';
        const cName = cleanName(card);
        const cardOVR = Math.floor(card.ovr || 50);

        let teamFull = card.team || '';
        if (card.team === 'FA' || !card.team) {
          teamFull = typeof window.t === 'function' ? window.t('dex.free_agent', 'Free Agent') : 'Free Agent';
        } else if (card.team === 'HIST') {
          teamFull = typeof window.t === 'function' ? window.t('dex.franchise_hist', 'Historical Franchise') : 'Historical Franchise';
        } else if (card.team === 'NLB') {
          teamFull = typeof window.t === 'function' ? window.t('dex.franchise_nlb', 'Negro Leagues') : 'Negro Leagues';
        } else if (window.PlayersDB && window.PlayersDB.FranchiseNames) {
          teamFull = window.PlayersDB.FranchiseNames[card.team] || card.team;
        }

        const renderStat = (lbl, val) => {
          if (typeof val !== 'number') {
            return `
              <div style="background:#111827;border-radius:6px;padding:7px 9px;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:9px;color:#94a3af;font-family:'Press Start 2P',monospace;">${lbl}</span>
                <span style="font-size:11px;font-weight:bold;color:#38bdf8">${val}</span>
              </div>
            `;
          }
          return `
            <div style="background:#111827;border-radius:6px;padding:7px 9px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:9px;color:#94a3af;font-family:'Press Start 2P',monospace;">${lbl}</span>
              <span style="font-size:11px;font-weight:bold;color:${getGradeColor(val)}">${val} <small style="font-size:8px;margin-left:2px;">${getGrade(val)}</small></span>
            </div>
          `;
        };

        const careerStats = (typeof getPlayerCareerData === 'function')
          ? getPlayerCareerData(card)
          : ((window.BaseballDex && typeof window.BaseballDex.getPlayerCareerData === 'function')
              ? window.BaseballDex.getPlayerCareerData(card)
              : null);
        const isReliever = isPitcher && (
          card.role === 'RP' || card.role === 'CL' || card.pos === 'RP' || card.pos === 'CL' ||
          (careerStats && typeof careerStats.sv === 'number' && careerStats.sv >= 10)
        );

        let statsHTML = '';
        if (isPitcher) {
          const h9 = card.h9 !== undefined ? card.h9 : (card.grt !== undefined ? card.grt : 50);
          const k9 = card.k9 !== undefined ? card.k9 : (card.stf !== undefined ? card.stf : (card.str !== undefined ? card.str : 50));
          const bb9 = card.bb9 !== undefined ? card.bb9 : (card.ctl !== undefined ? card.ctl : 50);
          const hr9 = card.hr9 !== undefined ? card.hr9 : (card.mov !== undefined ? card.mov : 50);
          const sta = card.sta !== undefined ? card.sta : 65;
          const clt = card.clt !== undefined ? card.clt : (card.clu !== undefined ? card.clu : 50);
          statsHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:16px">
              ${renderStat('H/9', h9)}
              ${renderStat('K/9', k9)}
              ${renderStat('BB/9', bb9)}
              ${renderStat('HR/9', hr9)}
              ${renderStat('STA', sta)}
              ${renderStat('CLT', clt)}
            </div>
          `;
        } else {
          const kavd = card.k_avd !== undefined ? card.k_avd : (card.k_avoid !== undefined ? card.k_avoid : (card.k_avoid_val !== undefined ? card.k_avoid_val : (card.con || 40)));
          statsHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:16px">
              ${renderStat('CON', card.con || 40)}
              ${renderStat('PWR', card.pwr || 40)}
              ${renderStat('EYE', card.eye || 40)}
              ${renderStat('K/AVD', kavd)}
              ${renderStat('SPD', card.spd || 40)}
              ${renderStat('DEF', card.def || 40)}
            </div>
          `;
        }

        const isHof = Boolean(card.hof || card.is_hof || (careerStats && careerStats.hof));
        let badgesHtml = '';
        if (isHof) badgesHtml += '<span style="background:#ffd70022;color:#ffd700;border:1px solid #ffd700;padding:2px 8px;border-radius:4px;font-size:8px">🏆 HOF</span>';
        if (card.clutch || card.is_clutch) badgesHtml += '<span style="background:#ef444422;color:#ef4444;border:1px solid #ef4444;padding:2px 8px;border-radius:4px;font-size:8px">⚡ CLUTCH</span>';
        if (card.captain || card.is_captain) badgesHtml += '<span style="background:#3b82f622;color:#3b82f6;border:1px solid #3b82f6;padding:2px 8px;border-radius:4px;font-size:8px">👑 CAPTAIN</span>';

        let careerStatsBlockHTML = '';
        if (careerStats) {
          careerStatsBlockHTML = `
            <div style="background:#111827;border-radius:8px;padding:12px">
              <div style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#38bdf8;margin-bottom:10px;text-align:center">${_t('dex.career_header', 'CAREER STATISTICS (MLB)')}</div>
              <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px 10px;text-align:center">
                ${isPitcher ? (isReliever ? `
                  <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${typeof careerStats.sv === 'number' ? careerStats.sv.toLocaleString() : (careerStats.sv || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.sv_label', 'SAVES (SV)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#10b981">${careerStats.era || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.era_label', 'ERA')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#fb923c">${typeof careerStats.so === 'number' ? careerStats.so.toLocaleString() : (careerStats.so || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.so_label', 'STRIKEOUTS (K)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.whip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.whip_label', 'WHIP')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#2dd4bf">${careerStats.w !== '-' ? `${careerStats.w}-${careerStats.l}` : (careerStats.ip || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${careerStats.w !== '-' ? _t('dex.wl_label', 'RECORD (W-L)') : _t('dex.ip_label', 'INNINGS (IP)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.war_label', 'WAR')}</div></div>
                ` : `
                  <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${careerStats.w !== '-' ? `${careerStats.w}-${careerStats.l}` : '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.wl_label', 'RECORD (W-L)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#10b981">${careerStats.era || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.era_label', 'ERA')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#fb923c">${typeof careerStats.so === 'number' ? careerStats.so.toLocaleString() : (careerStats.so || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.so_label', 'STRIKEOUTS (K)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.whip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.whip_label', 'WHIP')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#2dd4bf">${careerStats.ip || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.ip_label', 'INNINGS (IP)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.war_label', 'WAR')}</div></div>
                `) : `
                  <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${typeof careerStats.h === 'number' ? careerStats.h.toLocaleString() : (careerStats.h || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.hits_label', 'HITS (H)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#f87171">${typeof careerStats.hr === 'number' ? careerStats.hr.toLocaleString() : (careerStats.hr || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.hr_label', 'HOME RUNS (HR)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#fbbf24">${typeof careerStats.rbi === 'number' ? careerStats.rbi.toLocaleString() : (careerStats.rbi || '-')}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.rbi_label', 'RBIS (RBI)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#34d399">${careerStats.avg || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.avg_label', 'AVERAGE (AVG)')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#facc15">${careerStats.ops || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.ops_label', 'OPS')}</div></div>
                  <div><div style="font-size:13px;font-weight:bold;color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px;color:#9ca3af;margin-top:2px">${_t('dex.war_label', 'WAR')}</div></div>
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
          `;
        }

        const tradingCardHTML = typeof window.createCardHTML === 'function'
          ? window.createCardHTML(card, isPitcher ? (card.role || 'P') : (card.pos || 'OF'))
          : `<div class="player-card"><div class="card-name">${card.name}</div></div>`;

        const bbrefUrl = (typeof getBbrefUrl === 'function')
          ? getBbrefUrl(card)
          : ((window.BaseballDex && typeof window.BaseballDex.getBbrefUrl === 'function')
              ? window.BaseballDex.getBbrefUrl(card)
              : `https://www.baseball-reference.com/search/search.fcgi?search=${encodeURIComponent(card.cleanName || card.name || '')}`);

        leftColumnHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; max-width: 440px; width: 100%; margin: 0 auto;">
            <div class="dex-flip-card-container" id="c162-flip-container" style="perspective:1200px; width:100%; max-width:440px; min-height:480px; margin: 0 auto; cursor:pointer;" title="${_t('challenge162.click_to_flip', 'Click to flip card')}">
              <div class="dex-flip-card-inner" id="c162-flip-inner">
                
                <!-- LADO A: ESTADÍSTICAS & FICHA BASEBALL-DEX EXACTA (CALCADA) -->
                <div class="dex-card-face dex-card-front" style="background:#0a0f1a; border:3px solid ${rColor}; border-radius:12px; padding:24px; box-shadow: 0 0 35px ${rColor}66; text-align:left;">
                  <div style="margin-bottom:16px; padding-right:10px;">
                    <div style="font-family:'Press Start 2P',monospace; font-size:9.5px; color:${rColor}; margin-bottom:4px;">${card.rarity || 'Common'} · ${eraShort}</div>
                    <h2 style="font-family:'Press Start 2P',monospace; font-size:13px; color:#fff; margin:0 0 4px 0; line-height:1.4; display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
                      <span>${cName}</span>
                      ${(typeof getPlayerFlagHTML === 'function') ? getPlayerFlagHTML(card) : ((window.BaseballDex && typeof window.BaseballDex.getPlayerFlagHTML === 'function') ? window.BaseballDex.getPlayerFlagHTML(card) : '')}
                    </h2>
                    <div style="font-size:11px; color:#9ca3af;">${teamFull} — ${card.year || ''} · ${card.role || (typeof getPosText === 'function' ? getPosText(card) : ((window.BaseballDex && typeof window.BaseballDex.getPosText === 'function') ? window.BaseballDex.getPosText(card) : (card.sec_pos && String(card.sec_pos).trim() ? `${card.pos || 'DH'} / ${card.sec_pos}` : (card.pos || 'DH'))))}</div>
                  </div>

                  <div style="text-align:center; margin-bottom:16px;">
                    <div style="font-family:'Press Start 2P',monospace; font-size:32px; color:${rColor}; text-shadow:0 0 20px ${rColor}88;">${cardOVR}</div>
                    <div style="font-size:10px; color:#6b7280;">OVR</div>
                  </div>

                  ${statsHTML}

                  ${badgesHtml ? `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px;">${badgesHtml}</div>` : ''}

                  ${careerStatsBlockHTML}
                </div>

                <!-- LADO B: DISEÑO DE CARTA COLECCIONABLE DE DRAFT -->
                <div class="dex-card-face dex-card-back" style="border:3px solid ${rColor}; box-shadow: 0 0 35px ${rColor}66;">
                  <div style="font-family:'Press Start 2P',monospace; font-size:9px; color:#ffd700; margin-bottom:14px; letter-spacing:1px; text-align:center;">
                    🎴 DRAFT TRADING CARD
                  </div>
                  <div style="transform:scale(1.2); margin:15px 0;">
                    ${tradingCardHTML}
                  </div>
                  <div style="font-size:10px; color:#9ca3af; margin-top:8px; text-align:center; font-family:'Press Start 2P',monospace;">
                    ${card.name} · ${card.year || ''}
                  </div>
                </div>

              </div>
            </div>

            <!-- ACTION BUTTONS BELOW MODAL (FLIP, B-REF & NEXT PACK) -->
            <div style="margin-top:14px; width:100%; display:flex; justify-content:center; gap:8px; flex-wrap:wrap; align-items:center;">
              <button id="btn-c162-flip-card" class="btn btn-secondary" style="padding:8px 14px; font-size:8.5px; font-family:'Press Start 2P',monospace; border:1px solid #38bdf8; color:#38bdf8;">
                🔄 ${_t('challenge162.flip_card_btn', 'FLIP')}
              </button>
              <a href="${bbrefUrl}" target="_blank" rel="noopener noreferrer" style="padding:8px 14px; background:linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.3)); border:1.5px solid #10b981; color:#34d399; border-radius:6px; font-family:'Press Start 2P',monospace; font-size:8px; text-decoration:none; cursor:pointer; display:inline-flex; align-items:center; gap:5px; box-shadow:0 0 10px rgba(16,185,129,0.3);">
                📊 ${_t('dex.btn_bbref', 'B-REF ↗')}
              </a>
              <button id="btn-c162-next-pack" class="btn" style="padding:9px 16px; font-family:'Press Start 2P',monospace; font-size:8.5px; background:linear-gradient(135deg,#ffd700,#f59e0b); color:#000; border:none; border-radius:6px; cursor:pointer; font-weight:bold; box-shadow:0 0 15px rgba(255,215,0,0.4);">
                ${draft.viewCard ? '◀ BACK TO THE DRAFT' : isDraftComplete ? _t('challenge162.finalize_roster', '🚀 FINALIZE ROSTER & START 162-0 ➔') : (isLastPackInStage ? _t('challenge162.open_pitchers_box', '⚾ OPEN PITCHERS BOX ➔') : _t('challenge162.open_next_pack', `📦 OPEN NEXT PACK (${globalCardNum + 1}/25) ➔`, { pack: globalCardNum + 1 }))}
              </button>
            </div>
          </div>
        `;
      }

      // ── Right Column: Visual Card Deck Formation Board ───────────────────
      const renderCompactSlot = (player, slotLabel, kind, key) => {
        const isCurrentActive = Boolean(
          player && currentCardKey && (player.role ? pitcherUnlockKey(player) : batterUnlockKey(player)) === currentCardKey
        );
        if (!player) {
          return `
            <div class="c162-slot-item c162-rb-row empty" data-drag-kind="${kind}" data-drag-key="${key}">
              <span class="c162-rb-pos">${slotLabel}</span>
              <span class="c162-rb-name">—</span>
            </div>
          `;
        }
        const rar = String(player.rarity || 'Common').toLowerCase();
        const isBatSlot = kind === 'batter';
        const outOfPos = isBatSlot && slotLabel !== 'DH' && typeof canPlayerFillSlot === 'function' && !canPlayerFillSlot(player, slotLabel);
        const meta = [player.year, player.team].filter(Boolean).join(' · ');
        return `
          <div class="c162-slot-item c162-rb-row r-${rar} ${isCurrentActive ? 'active' : ''}"
               title="${player.name} · ${player.rarity || ''} (${_t('challenge162.drag_to_reorder', 'Drag to swap position')})"
               draggable="true" data-drag-kind="${kind}" data-drag-key="${key}">
            <span class="c162-rb-pos">${slotLabel}</span>
            <span class="c162-rb-name">${player.name}${outOfPos ? ' <i title="Playing out of position">⚠</i>' : ''}</span>
            <span class="c162-rb-meta">${meta}</span>
            <span class="c162-rb-ovr">${Math.floor(player.ovr || 50)}</span>
          </div>
        `;
      };

      const infieldSlots = ['C', '1B', '2B', '3B', 'SS'];
      const outfieldSlots = ['LF', 'CF', 'RF', 'DH'];

      const infieldSlotsHTML = infieldSlots.map(slot =>
        renderCompactSlot(updatedSlots.lineup[slot], slot, 'batter', slot)
      ).join('');

      const outfieldSlotsHTML = outfieldSlots.map(slot =>
        renderCompactSlot(updatedSlots.lineup[slot], slot, 'batter', slot)
      ).join('');

      const benchSlotsHTML = [0, 1, 2, 3, 4].map(idx =>
        renderCompactSlot(updatedSlots.bench[idx], `BN${idx + 1}`, 'bench', idx)
      ).join('');

      const spSlotsHTML = [0, 1, 2, 3, 4].map(idx =>
        renderCompactSlot(updatedSlots.sp[idx], `SP${idx + 1}`, 'SP', idx)
      ).join('');

      const rpSlotsHTML = [
        renderCompactSlot(updatedSlots.rp[0], 'CL', 'RP', 0),
        renderCompactSlot(updatedSlots.rp[1], 'SU', 'RP', 1),
        renderCompactSlot(updatedSlots.rp[2], 'RP1', 'RP', 2),
        renderCompactSlot(updatedSlots.rp[3], 'RP2', 'RP', 3),
        renderCompactSlot(updatedSlots.rp[4], 'RP3', 'RP', 4),
        renderCompactSlot(updatedSlots.rp[5], 'RP4', 'RP', 5)
      ].join('');

      const filledLineupCount = SLOTS.filter(s => updatedSlots.lineup[s]).length;
      const filledBenchCount = (updatedSlots.bench || []).filter(Boolean).length;
      const filledSPCount = (updatedSlots.sp || []).filter(Boolean).length;
      const filledRPCount = (updatedSlots.rp || []).filter(Boolean).length;

      const progressPercent = Math.min(100, Math.round((allPulled.length / 25) * 100));

      container.innerHTML = `
        <div style="max-width: 1400px; width: 98%; margin: 0 auto;">
          <!-- Top Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="font-family:'Press Start 2P',monospace; font-size:11.5px; color:#ffd700;">
                ${_t('challenge162.packs_draft_stage', `📦 HOBBY PACKS DRAFT: {{box}} (PACK {{pack}} OF {{total}})`, { box: stageBoxName, pack: globalCardNum, total: 25 })}
              </span>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-family:'Press Start 2P',monospace; font-size:10px; color:#00ff66;">
                ${_t('challenge162.roster_count', 'ROSTER')}: ${allPulled.length}/25
              </span>
              ${!isDraftComplete ? `
                <button id="btn-c162-pack-open5" class="btn btn-secondary c162-pack-fast-btn" title="Open the next 5 packs of this box at once">📦 OPEN 5</button>
                <button id="btn-c162-pack-auto" class="btn c162-pack-fast-btn c162-pack-auto-btn" title="Open every remaining pack and jump to Meet the Team">⚡ AUTO DRAFT</button>
              ` : ''}
              <button id="btn-c162-pack-cancel" class="btn btn-secondary" style="padding:6px 12px; font-size:8.5px; font-family:'Press Start 2P',monospace;">
                ✕ ${_t('challenge162.cancel', 'CANCEL')}
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-bottom:16px;">
            <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, #38bdf8, #ffd700, #00ff66); transition:width 0.3s ease;"></div>
          </div>

          <!-- Main Grid: Left Stage (Pack/Card) + Right Board (Card Deck) -->
          <div class="c162-pack-layout" style="display:grid; grid-template-columns: ${(!isCardRevealed && !draft.viewCard && draft.options && draft.options.length) ? '540px' : '460px'} 1fr; gap:16px; align-items:start;">
            
            <!-- Left Column -->
            ${leftColumnHTML}

            <!-- Right Column: roster board, every spot visible at once -->
            <div class="c162-rb">
              <div class="c162-rb-head">
                <div>
                  <b>📋 ${_t('challenge162.deck_title', 'TEAM CARD DECK')} · ${allPulled.length}/25</b>
                  <small>Click a player to see his card · drag to swap positions</small>
                </div>
                <div class="c162-rb-ovrbox"><small>${_t('challenge162.team_ovr', 'TEAM OVR')}</small><b>${avgOVR}</b></div>
              </div>
              <div class="c162-rb-rarity">${['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'].map(r => {
                const n = allSlotted.filter(p => (p.rarity || 'Common') === r).length;
                return `<span class="r-${r.toLowerCase()} ${n ? '' : 'zero'}"><b>${n}</b> ${r}</span>`;
              }).join('')}</div>
              <div class="c162-rb-cols">
                <div class="c162-rb-col">
                  <div class="c162-rb-title t-lineup"><span>⚡ LINEUP</span><span>${filledLineupCount}/9</span></div>
                  ${infieldSlotsHTML}${outfieldSlotsHTML}
                  <div class="c162-rb-title t-bench"><span>🛋️ BENCH</span><span>${filledBenchCount}/5</span></div>
                  ${benchSlotsHTML}
                </div>
                <div class="c162-rb-col">
                  <div class="c162-rb-title t-rot"><span>🧢 ROTATION</span><span>${filledSPCount}/5</span></div>
                  ${spSlotsHTML}
                  <div class="c162-rb-title t-pen"><span>🔥 BULLPEN</span><span>${filledRPCount}/6</span></div>
                  ${rpSlotsHTML}
                </div>
              </div>
            </div>

          </div>
        </div>
      `;

      // ── Event Handlers ──
      // Drag & Drop
      let _dragSource = null;
      container.querySelectorAll('.c162-slot-item[draggable="true"]').forEach(el => {
        el.addEventListener('dragstart', (e) => {
          _dragSource = { kind: el.dataset.dragKind, key: el.dataset.dragKey };
          el.style.opacity = '0.5';
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify(_dragSource));
          }
        });
        el.addEventListener('dragend', () => {
          el.style.opacity = '';
          container.querySelectorAll('.c162-slot-item').forEach(s => s.style.outline = '');
        });
      });

      container.querySelectorAll('.c162-slot-item[data-drag-kind]').forEach(el => {
        el.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          el.style.outline = '2px dashed #ffd700';
        });
        el.addEventListener('dragleave', () => { el.style.outline = ''; });
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          el.style.outline = '';
          if (!_dragSource) return;
          const targetKind = el.dataset.dragKind;
          const targetKey = el.dataset.dragKey;
          if (_dragSource.kind === targetKind && _dragSource.key === targetKey) return;
          const isSrcPitcher = _dragSource.kind === 'SP' || _dragSource.kind === 'RP';
          const isTgtPitcher = targetKind === 'SP' || targetKind === 'RP';
          if (isSrcPitcher !== isTgtPitcher) return;

          const ms = draft.manualSlots;
          const srcPlayer = this._getDraftSlotPlayer(ms, _dragSource.kind, _dragSource.key);
          const dstPlayer = this._getDraftSlotPlayer(ms, targetKind, targetKey);
          this._setDraftSlotPlayer(ms, _dragSource.kind, _dragSource.key, dstPlayer || null);
          this._setDraftSlotPlayer(ms, targetKind, targetKey, srcPlayer || null);
          _dragSource = null;
          draft.userEdited = true; // from here on new cards fill empty spots; nothing is re-sorted
          this.renderPacksDraft();
        });
      });

      // Click a player on the board to see his card (click him again to go back).
      container.querySelectorAll('.c162-rb-row[draggable="true"]').forEach(el => {
        el.addEventListener('click', () => {
          const p = this._getDraftSlotPlayer(draft.manualSlots, el.dataset.dragKind, el.dataset.dragKey);
          if (!p) return;
          draft.viewCard = (draft.viewCard === p) ? null : p;
          this.renderPacksDraft();
        });
      });

      // 1. Pack Foil Rip
      const foilTarget = container.querySelector('#c162-foil-pack-target');
      if (foilTarget) {
        foilTarget.onclick = () => {
          if (window.BaseballDex && typeof window.BaseballDex.playPackSound === 'function') {
            window.BaseballDex.playPackSound('Rare');
          } else if (window.AudioManager && typeof window.AudioManager.play === 'function') {
            window.AudioManager.play('card_deal');
          } else if (typeof window.playSound === 'function') {
            window.playSound('card_flip');
          }
          this._openPackOptions();
          this.renderPacksDraft();
        };
      }

      // 1a. Pick one of the pack's cards (or look at one first)
      container.querySelectorAll('[data-pack-pick]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const card = (draft.options || [])[parseInt(btn.dataset.packPick, 10)];
          if (!card) return;
          if (window.AudioManager && typeof window.AudioManager.play === 'function') window.AudioManager.play('draft_pick');
          this._pullNextPackCard(card);
          this.renderPacksDraft();
        };
      });
      container.querySelectorAll('[data-pack-view]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const card = (draft.options || [])[parseInt(btn.dataset.packView, 10)];
          if (card) { draft.viewCard = card; this.renderPacksDraft(); }
        };
      });

      // 1b. Fast options: open 5 (within the current box) or auto-draft everything left
      const btnOpen5 = container.querySelector('#btn-c162-pack-open5');
      if (btnOpen5) btnOpen5.onclick = () => this._autoPullPacks(5);
      const btnAuto = container.querySelector('#btn-c162-pack-auto');
      if (btnAuto) btnAuto.onclick = () => this._autoPullPacks(Infinity);

      // 2. Card 3D Flip Handlers
      const btnFlip = container.querySelector('#btn-c162-flip-card');
      const flipContainer = container.querySelector('#c162-flip-container');
      const flipInner = container.querySelector('#c162-flip-inner');

      const doFlip = (e) => {
        if (e) e.stopPropagation();
        if (flipInner) {
          flipInner.classList.toggle('flipped');
          if (window.AudioManager && typeof window.AudioManager.play === 'function') {
            window.AudioManager.play('card_deal');
          } else if (typeof window.playSound === 'function') {
            window.playSound('card_flip');
          }
        }
      };
      if (btnFlip) btnFlip.onclick = doFlip;
      if (flipContainer) flipContainer.onclick = doFlip;

      // 3. Cancel Button
      const btnCancel = container.querySelector('#btn-c162-pack-cancel');
      if (btnCancel) {
        btnCancel.onclick = () => {
          if (confirm(_t('challenge162.pack_cancel_confirm', '¿Deseas cancelar el draft de sobres y volver al menú?'))) {
            this._packDraft = null;
            this.renderHub();
          }
        };
      }

      // 4. Next Pack / Complete Button
      const btnNext = container.querySelector('#btn-c162-next-pack');
      if (btnNext) {
        btnNext.onclick = (e) => {
          e.stopPropagation();
          if (draft.viewCard) { draft.viewCard = null; this.renderPacksDraft(); return; }
          if (isDraftComplete) this.finishPacksDraftAndStart();
          else if (isLastPackInStage) this.renderPacksDraftTransition();
          else {
            draft.packOpened = false;
            draft.currentCard = null;
            this.renderPacksDraft();
          }
        };
      }
    },

    finishPacksDraftAndStart() {
      if (!this._packDraft) return;
      const allPulled = [...this._packDraft.pulledBatters, ...this._packDraft.pulledPitchers];
      const manual = this._packDraft.manualSlots;
      const autoComputed = calculateChallengeRosterSlots(allPulled, true);
      const lineup = manual ? Object.assign({}, manual.lineup) : autoComputed.lineup;
      const bench = manual ? (manual.bench || []).slice() : (autoComputed.bench || []);
      const sp = manual ? (manual.sp || []).slice() : (autoComputed.sp || []);
      const rp = manual ? (manual.rp || []).slice() : (autoComputed.rp || []);

      SLOTS.forEach(slot => {
        if (!lineup[slot]) {
          const b = this._packDraft.pulledBatters.find(cand => !Object.values(lineup).includes(cand));
          if (b) lineup[slot] = b;
          else lineup[slot] = this._packDraft.pulledBatters[0];
        }
      });

      const finalSP = sp.filter(Boolean);
      const finalRP = rp.filter(Boolean);
      while (finalSP.length < 5) {
        const p = this._packDraft.pulledPitchers.find(cand => !finalSP.includes(cand) && !finalRP.includes(cand));
        if (p) finalSP.push(p);
        else break;
      }
      while (finalRP.length < 6) {
        const p = this._packDraft.pulledPitchers.find(cand => !finalSP.includes(cand) && !finalRP.includes(cand));
        if (p) finalRP.push(p);
        else break;
      }

      const finalBench = bench ? bench.filter(Boolean) : [];
      while (finalBench.length < 5) {
        const b = this._packDraft.pulledBatters.find(cand => !Object.values(lineup).includes(cand) && !finalBench.includes(cand));
        if (b) finalBench.push(b);
        else break;
      }

      const pitchers = { SP: finalSP, RP: finalRP };
      this._packDraft = null;
      this.showMeetTheTeam({
        lineup, pitchers, bench: finalBench,
        cfg: { type: 'packs', label: '📦 HOBBY PACKS DRAFT', desc: '25-Pack Universe Draft' }
      });
    },

    // Pulls the next card of the current box, exactly as tapping the foil does.
    // Every pack holds PACK_OPTIONS cards of the pack's tier and the player keeps one
    // (decision of the user: a choice in every pack instead of one fixed card).
    _rollPackOptions() {
      const draft = this._packDraft;
      const isPitchersStage = draft.stage === 'pitchers';
      const currentSlots = draft.manualSlots || calculateChallengeRosterSlots([...draft.pulledBatters, ...draft.pulledPitchers], false);
      const missingPos = [];
      if (isPitchersStage) {
        if (currentSlots.sp.filter(x => !x).length > 0) missingPos.push('SP');
        if (currentSlots.rp.filter(x => !x).length > 0) missingPos.push('RP', 'CL', 'CP');
      } else {
        SLOTS.forEach(slot => { if (!currentSlots.lineup[slot]) missingPos.push(slot); });
      }
      const activePool = isPitchersStage ? getPitcherPool() : getBatterPool();
      const currentTier = this._getPackTierInfo(draft.currentPack);
      const keyOf = c => (c.role ? pitcherUnlockKey(c) : batterUnlockKey(c));
      const seen = new Set(draft.usedKeys);
      // The first card is the pack's roll, exactly as before. The other two are of the same
      // rarity and within PACK_OPTION_OVR_SPREAD points of it, so the choice is about fit and
      // style (position, contact or power, starter or reliever) and not about who is plainly
      // better. With three free rolls and "keep the best", pack teams went from ~75 to ~80 OVR
      // and from 82-109 wins to 103-136.
      let first = pickWeightedChallengeDraftCard(activePool, missingPos, seen, currentTier.minRarity);
      if (!first || seen.has(keyOf(first))) first = activePool.find(c => !seen.has(keyOf(c)));
      const options = [];
      if (first) {
        options.push(first);
        seen.add(keyOf(first));
        const near = spread => activePool.filter(c => !seen.has(keyOf(c)) && c.rarity === first.rarity && Math.abs((c.ovr || 0) - (first.ovr || 0)) <= spread);
        while (options.length < PACK_OPTIONS) {
          let cands = near(PACK_OPTION_OVR_SPREAD);
          if (!cands.length) cands = near(99);
          if (!cands.length) break;
          // Prefer a different position from the cards already on offer, then one the roster needs.
          const shown = new Set(options.map(o => (o.role ? o.role : o.pos)));
          const fresh = cands.filter(c => !shown.has(c.role ? c.role : c.pos));
          const pickFrom = fresh.length ? fresh : cands;
          const needed = pickFrom.filter(c => this._packOptionFills(c, missingPos));
          const list = (needed.length && Math.random() < 0.5) ? needed : pickFrom;
          const card = list[Math.floor(Math.random() * list.length)];
          seen.add(keyOf(card));
          options.push(card);
        }
      }
      return { options, missingPos };
    },

    _packOptionFills(card, missingPos) {
      if (!missingPos || !missingPos.length) return false;
      if (card.role) return missingPos.includes((card.role || 'SP').toUpperCase());
      const all = getAllPositionsForPlayer(card);
      return missingPos.some(p => p !== 'DH' && all.has(p));
    },

    // What OPEN 5 / AUTO DRAFT keep: the best card, with a nudge for one that fills a hole.
    _bestPackOption(options, missingPos) {
      const score = c => (c.ovr || 50) + (this._packOptionFills(c, missingPos) ? 5 : 0);
      return options.slice().sort((a, b) => score(b) - score(a))[0];
    },

    // Tapping the foil shows the three options; nothing joins the roster until one is picked.
    _openPackOptions() {
      const draft = this._packDraft;
      if (!draft || draft.currentPack >= draft.totalPacks) return;
      const o = this._rollPackOptions();
      draft.options = o.options;
      draft.optionNeeds = o.missingPos;
      draft.packOpened = false;
      draft.currentCard = null;
      draft.viewCard = null;
    },

    // Adds one card of the current pack to the roster: the one the player chose, or (OPEN 5 /
    // AUTO DRAFT) the best of the pack's options.
    _pullNextPackCard(chosen) {
      const draft = this._packDraft;
      if (!draft || draft.currentPack >= draft.totalPacks) return null;
      const isPitchersStage = draft.stage === 'pitchers';
      let card = chosen || null;
      if (!card) {
        const o = (draft.options && draft.options.length) ? { options: draft.options, missingPos: draft.optionNeeds || [] } : this._rollPackOptions();
        card = this._bestPackOption(o.options, o.missingPos);
      }
      draft.options = null;
      draft.optionNeeds = null;
      if (!card) return null;

      draft.usedKeys.add(card.role ? pitcherUnlockKey(card) : batterUnlockKey(card));
      if (isPitchersStage) draft.pulledPitchers.push(card);
      else draft.pulledBatters.push(card);

      draft.currentCard = card;
      draft.currentPack++;
      draft.packOpened = true;

      draft.viewCard = null;
      const ms = draft.manualSlots;
      if (draft.userEdited && ms) {
        // The player has arranged the roster by hand: keep it exactly as it is and drop the
        // new card into an empty spot (its own position if it is free).
        const firstEmpty = arr => arr.findIndex(x => !x);
        if (card.role) {
          const starter = (card.role || 'SP').toUpperCase() === 'SP';
          const order = starter ? [ms.sp, ms.rp] : [ms.rp, ms.sp];
          const target = order.find(arr => firstEmpty(arr) !== -1);
          if (target) target[firstEmpty(target)] = card;
        } else {
          const open = SLOTS.filter(sl => !ms.lineup[sl]);
          const spot = open.find(sl => sl !== 'DH' && canPlayerFillPrimary(card, sl))
            || open.find(sl => sl !== 'DH' && canPlayerFillSlot(card, sl))
            || (open.includes('DH') ? 'DH' : null);
          const b = firstEmpty(ms.bench);
          if (spot) ms.lineup[spot] = card;
          else if (b !== -1) ms.bench[b] = card;
          else if (open.length) ms.lineup[open[0]] = card;
        }
        return card;
      }
      const newAuto = calculateChallengeRosterSlots([...draft.pulledBatters, ...draft.pulledPitchers], false);
      draft.manualSlots = {
        lineup: Object.assign({}, newAuto.lineup),
        bench: (newAuto.bench || []).slice(),
        sp: (newAuto.sp || []).slice(),
        rp: (newAuto.rp || []).slice()
      };
      return card;
    },

    // count = 5 opens up to 5 packs without leaving the current box;
    // count = Infinity drafts everything left (both boxes) and goes to the montage.
    _autoPullPacks(count) {
      const draft = this._packDraft;
      if (!draft) return;
      const pulled = [];
      const crossBoxes = count === Infinity;
      while (pulled.length < count) {
        if (draft.currentPack >= draft.totalPacks) {
          if (crossBoxes && draft.stage === 'batters') {
            draft.stage = 'pitchers';
            draft.currentPack = 0;
            draft.totalPacks = 11;
            continue;
          }
          break;
        }
        const card = this._pullNextPackCard();
        if (!card) break;
        pulled.push(card);
      }
      if (!pulled.length) return;
      if (window.AudioManager && typeof window.AudioManager.play === 'function') window.AudioManager.play('card_deal');
      const done = draft.stage === 'pitchers' && draft.currentPack >= draft.totalPacks;
      this._renderPackMontage(pulled, done);
    },

    _renderPackMontage(cards, draftDone) {
      const container = document.getElementById('challenge162-pack-container');
      if (!container) return;
      const best = cards.slice().sort((a, b) => (b.ovr || 0) - (a.ovr || 0))[0];
      container.innerHTML = `
        <div class="c162-montage">
          <div class="c162-montage-title">${cards.length > 5 ? '⚡ AUTO DRAFT COMPLETE' : `📦 ${cards.length} PACKS OPENED`}</div>
          <div class="c162-montage-sub">Best pull: <strong>${best.name}</strong> · OVR ${Math.floor(best.ovr || 0)} · ${best.rarity || ''}</div>
          <div class="c162-montage-grid">
            ${cards.map((c, i) => `<div class="c162-montage-card" style="--i:${i};">${window.createCardHTML ? window.createCardHTML(c, c.role || c.pos) : c.name}</div>`).join('')}
          </div>
          <div class="c162-montage-actions">
            <button id="btn-c162-montage-continue" class="btn c162-cta">${draftDone ? '🤝 MEET THE TEAM ▶' : '▶ BACK TO THE PACKS'}</button>
          </div>
        </div>`;
      container.querySelector('#btn-c162-montage-continue').onclick = () => {
        if (draftDone) this.finishPacksDraftAndStart();
        else this.renderPacksDraft();
      };
    },

    // ── Meet the Team → League Preview → season ─────────────────────────────
    _pendingSeason: null,

    _suggestTeamName(cards) {
      const franchiseNames = (window.PlayersDB && window.PlayersDB.FranchiseNames) || {};
      const counts = {};
      cards.forEach(c => { if (c && c.team) counts[c.team] = (counts[c.team] || 0) + 1; });
      const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      if (top && counts[top] >= 13 && franchiseNames[top]) return franchiseNames[top];
      return 'My Legends';
    },

    _pendingCards(p) {
      return [
        ...SLOTS.map(s => p.lineup[s]).filter(Boolean),
        ...(p.pitchers.SP || []), ...(p.pitchers.RP || [])
      ];
    },

    _pendingStrength(p) {
      const lineup = p.battingOrder.map(s => p.lineup[s]).filter(Boolean);
      return teamStrength(lineup, (p.pitchers.SP || [])[0] || null);
    },

    showMeetTheTeam(pending) {
      pending.battingOrder = pending.battingOrder || this._optimizeBattingOrder(pending.lineup);
      pending.teamName = pending.teamName || this._suggestTeamName(this._pendingCards(pending));
      this._preselectIronMen(pending);
      this._pendingSeason = pending;
      this._meetAnimated = false;
      this.showScreen('screen-challenge-pack');
      this.renderMeetTheTeam();
    },

    // Iron Men come preselected (the positions that gain the most games, best player first)
    // so the choice is visible; the user can change them before the season starts.
    _preselectIronMen(pending) {
      if (pending.ironMan) return;
      pending.ironMan = {};
      (pending.battingOrder || [])
        .filter(slot => pending.lineup[slot])
        .map(slot => ({ slot, b: pending.lineup[slot], gain: (IRON_GAMES[slot] || IRON_GAMES.DH)[1] - (IRON_GAMES[slot] || IRON_GAMES.DH)[0] }))
        .sort((x, y) => y.gain - x.gain || (y.b.ovr || 0) - (x.b.ovr || 0))
        .slice(0, MAX_IRON_MAN)
        .forEach(x => { pending.ironMan[batterUnlockKey(x.b)] = true; });
    },

    // Iron Man picker. Pack teams choose on Meet the Team; the other formats skip that screen
    // and choose on the League Preview.
    _ironPicksHTML(p) {
      const count = Object.keys(p.ironMan || {}).length;
      return `<div class="c162-meet-section">🛡 IRON MEN · ${count} / ${MAX_IRON_MAN} CHOSEN</div>
          <div class="c162-pr-note">Tap a player to make him an Iron Man (up to ${MAX_IRON_MAN}). Everyone gets tired from playing every day and has to sit; an Iron Man tires 4 times slower, so he plays almost every game. It pays off most at catcher, shortstop, second base and center field. We picked the best ${MAX_IRON_MAN} for you; change them if you like. Locked once the season starts.</div>
          <div class="c162-iron-picks">${p.battingOrder.map(slot => {
            const b = p.lineup[slot];
            if (!b) return '';
            const k = batterUnlockKey(b);
            const on = !!(p.ironMan && p.ironMan[k]);
            const full = !on && count >= MAX_IRON_MAN;
            const g = IRON_GAMES[slot] || IRON_GAMES.DH;
            return `<button class="c162-iron-pick ${on ? 'on' : ''}" data-iron="${k}" ${full ? 'disabled' : ''}>
              <span class="c162-iron-pos">${slot}</span><b>${b.name}</b>
              <small>${on ? `plays ~${g[1]} games` : `~${g[0]} games → ~${g[1]} as Iron Man`}</small>
              <em class="c162-iron-state">${on ? '🛡 IRON MAN ✓' : (full ? 'unpick one first' : '＋ TAP TO PICK')}</em>
            </button>`;
          }).join('')}</div>`;
    },

    _bindIronPicks(container, p, rerender) {
      container.querySelectorAll('.c162-iron-pick').forEach(btn => {
        btn.onclick = () => {
          if (!p.ironMan) p.ironMan = {};
          const k = btn.dataset.iron;
          if (p.ironMan[k]) delete p.ironMan[k];
          else if (Object.keys(p.ironMan).length < MAX_IRON_MAN) p.ironMan[k] = true;
          const y = window.scrollY;
          rerender();
          window.scrollTo(0, y);
        };
      });
    },

    renderMeetTheTeam() {
      const p = this._pendingSeason;
      const container = document.getElementById('challenge162-pack-container');
      if (!p || !container) return;
      const order = p.battingOrder;
      const batters = order.map(s => ({ ...p.lineup[s], _slot: s })).filter(b => b.name);
      const SP = p.pitchers.SP || [];
      const RP = p.pitchers.RP || [];
      const avg = (arr, f) => arr.length ? arr.reduce((s, x) => s + (Number(f(x)) || 0), 0) / arr.length : 0;
      const fielders = batters.filter(b => b._slot !== 'DH');
      const grades = [
        ['CONTACT', avg(batters, b => b.con)],
        ['POWER', avg(batters, b => b.pwr)],
        ['EYE', avg(batters, b => b.eye)],
        ['SPEED', avg(batters, b => b.spd)],
        ['DEFENSE', avg(fielders, b => b.def)],
        ['ROTATION', avg(SP, x => x.ovr)],
        ['BULLPEN', avg(RP, x => x.ovr)]
      ];
      const teamOvr = avg([...batters, ...SP, ...RP], x => x.ovr);
      const ATTRS = [['con', 'CONTACT'], ['pwr', 'POWER'], ['eye', 'EYE'], ['spd', 'SPEED'], ['def', 'GLOVE']];
      const bestTool = b => ATTRS.map(([k, l]) => [l, Number(b[k]) || 0]).sort((x, y) => y[1] - x[1])[0];
      const xFactor = batters.slice().sort((a, b) => (b.ovr || 0) - (a.ovr || 0))[0];
      // Same convention simulateGame() uses: an explicit CL/SETUP role, else RP[0] closes and RP[1] sets up.
      const closer = RP.find(r => r.role === 'CL') || RP[0];
      const setup = RP.find(r => r.role === 'SETUP') || RP[1];
      const penRole = x => (x === closer ? 'CL' : x === setup ? 'SU' : 'RP');
      // On re-renders (reordering) the cards are marked as already dealt so ui.js doesn't flip them again.
      const anim = this._meetAnimated ? 'no-anim card-deal-in' : '';

      const cardsHTML = batters.map((b, i) => {
        const [tool, val] = bestTool(b);
        return `<div class="c162-meet-card ${anim}" style="--i:${i};">
          <div class="c162-meet-order">#${i + 1} · ${b._slot}${p.ironMan && p.ironMan[batterUnlockKey(b)] ? ' 🛡' : ''}</div>
          ${window.createCardHTML ? window.createCardHTML(b, b._slot) : b.name}
          <div class="c162-meet-tag" style="color:${getGradeColor(val)};">${tool} ${getGrade(val)}</div>
        </div>`;
      }).join('');

      const orderRows = batters.map((b, i) => `
        <div class="c162-meet-row r6">
          <span class="c162-meet-num">${i + 1}</span>
          <span class="c162-meet-pos">${b._slot}</span>
          <span class="c162-meet-name">${b.name}</span>
          <span class="c162-meet-ovr">${Math.floor(b.ovr || 0)}</span>
          <button class="c162-mv" data-list="order" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button class="c162-mv" data-list="order" data-i="${i}" data-d="1" ${i === batters.length - 1 ? 'disabled' : ''}>▼</button>
        </div>`).join('');
      const rotRows = SP.map((x, i) => `
        <div class="c162-meet-row r5">
          <span class="c162-meet-num">SP${i + 1}</span>
          <span class="c162-meet-name">${x.name}</span>
          <span class="c162-meet-ovr">${Math.floor(x.ovr || 0)}</span>
          <button class="c162-mv" data-list="rot" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button class="c162-mv" data-list="rot" data-i="${i}" data-d="1" ${i === SP.length - 1 ? 'disabled' : ''}>▼</button>
        </div>`).join('');
      // Bench: who covers rest days, and which positions have no one behind the starter.
      const bench = (p.bench || []).filter(Boolean);
      const uncovered = rosterCoverGaps(p.lineup, bench);
      const benchRows = bench.map(b => {
        const cover = SLOTS.filter(s => s !== 'DH' && canPlayerFillSlot(b, s));
        return `<div class="c162-meet-row r3">
          <span class="c162-meet-num">BN</span>
          <span class="c162-meet-name">${b.name} <small class="c162-meet-cover">${cover.join(' ') || 'DH'}</small></span>
          <span class="c162-meet-ovr">${Math.floor(b.ovr || 0)}</span>
        </div>`;
      }).join('');
      const coverNote = !bench.length ? ''
        : uncovered.length
          ? `<div class="c162-meet-warn">⚠ No backup at ${uncovered.join(', ')}: ${uncovered.length > 1 ? 'those starters' : 'that starter'} will sit less often (at −2) and a bench player fills in out of position, with a poor glove.</div>`
          : `<div class="c162-meet-ok">✓ Every position has a backup for rest days.</div>`;
      const penRows = RP.map(x => `
        <div class="c162-meet-row r3">
          <span class="c162-meet-num">${penRole(x)}</span>
          <span class="c162-meet-name">${x.name}</span>
          <span class="c162-meet-ovr">${Math.floor(x.ovr || 0)}</span>
        </div>`).join('');

      container.innerHTML = `
        <div class="c162-meet">
          <div class="c162-meet-hero ${this._meetAnimated ? 'no-anim' : ''}">
            <div class="c162-meet-kicker">MEET YOUR TEAM</div>
            <input id="c162-team-name" class="c162-team-name-input" maxlength="28" value="${String(p.teamName).replace(/"/g, '&quot;')}" aria-label="Team name">
            <div class="c162-meet-ovr-big"><span>TEAM OVR</span><b>${teamOvr.toFixed(1)}</b></div>
            <div class="c162-meet-grades">
              ${grades.map(([l, v]) => `<div class="c162-grade-chip"><span>${l}</span><b style="color:${getGradeColor(v)};">${getGrade(v)}</b></div>`).join('')}
            </div>
            <div class="c162-meet-spotlight">
              <div><span>X-FACTOR</span><b>${xFactor ? xFactor.name : '—'}</b></div>
              <div><span>ACE</span><b>${SP[0] ? SP[0].name : '—'}</b></div>
              <div><span>CLOSER</span><b>${closer ? closer.name : '—'}</b></div>
            </div>
          </div>

          <div class="c162-meet-section">THE STARTING NINE</div>
          <div class="c162-meet-cards">${cardsHTML}</div>

          ${this._ironPicksHTML(p)}

          <div class="c162-meet-columns">
            <div class="c162-meet-panel">
              <div class="c162-meet-panel-title"><span>⚾ BATTING ORDER</span><button id="btn-c162-optimize" class="c162-link-btn">⚙ OPTIMIZE</button></div>
              ${orderRows}
              ${bench.length ? `<div class="c162-meet-panel-title" style="margin-top:10px;"><span>🛋️ BENCH</span><span class="c162-meet-hint">covers rest days</span></div>
              ${benchRows}${coverNote}` : ''}
            </div>
            <div class="c162-meet-panel">
              <div class="c162-meet-panel-title"><span>🧢 ROTATION</span><span class="c162-meet-hint">SP1 opens day 1</span></div>
              ${rotRows}
              <div class="c162-meet-panel-title" style="margin-top:10px;"><span>🔥 BULLPEN</span></div>
              ${penRows}
            </div>
          </div>

          <div class="c162-meet-actions">
            <button id="btn-c162-meet-next" class="btn c162-cta">🏟️ LEAGUE PREVIEW ▶</button>
          </div>
        </div>`;
      this._meetAnimated = true;

      const nameInput = container.querySelector('#c162-team-name');
      nameInput.oninput = () => { p.teamName = nameInput.value.trim() || this._suggestTeamName(this._pendingCards(p)); };
      container.querySelectorAll('.c162-mv').forEach(btn => {
        btn.onclick = () => {
          const i = parseInt(btn.dataset.i, 10), d = parseInt(btn.dataset.d, 10);
          const list = btn.dataset.list === 'order' ? p.battingOrder : p.pitchers.SP;
          const j = i + d;
          if (j < 0 || j >= list.length) return;
          [list[i], list[j]] = [list[j], list[i]];
          this.renderMeetTheTeam();
        };
      });
      this._bindIronPicks(container, p, () => this.renderMeetTheTeam());
      container.querySelector('#btn-c162-optimize').onclick = () => {
        p.battingOrder = this._optimizeBattingOrder(p.lineup);
        this.renderMeetTheTeam();
      };
      container.querySelector('#btn-c162-meet-next').onclick = () => this.showLeaguePreview(p);
    },

    // Expected wins over the actual 162-day slate, from the same win model the league uses.
    // Projected wins from the rosters, fitted on full simulated seasons (224 team-seasons):
    // each OVR point of the lineup is worth ~2.1 wins, of the rotation ~1.1, of the bullpen ~0.3.
    // The old version used one strength number (lineup + ace) and a win-probability curve that
    // had nothing to do with the game engine: it missed by 7 wins on average and by up to 29.
    _projectLeague(L) {
      const avg = (a) => (a.length ? a.reduce((t, p) => t + ((p && p.ovr) || 50), 0) / a.length : 50);
      const pend = this._pendingSeason;
      const feat = {};
      Object.values(L.teams).forEach(t => {
        let lineup, rot, pen;
        if (t.id === USER_TEAM_ID) {
          const src = pend && pend.lineup ? pend : (this.state && this.state.roster);
          if (!src) return;
          lineup = Object.values(src.lineup || {}).filter(Boolean);
          rot = ((src.pitchers || {}).SP || []).filter(Boolean);
          pen = ((src.pitchers || {}).RP || []).filter(Boolean);
        } else {
          const staff = getFranchiseStaff(t.code, t.decade);
          lineup = getFranchiseDecadeTeam(t.code, t.decade).lineup;
          rot = staff.rotation; pen = staff.bullpen;
        }
        feat[t.id] = [avg(lineup), avg(rot), avg(pen)];
      });
      const ids = Object.keys(feat);
      const mean = k => ids.reduce((t, id) => t + feat[id][k], 0) / Math.max(1, ids.length);
      const m = [mean(0), mean(1), mean(2)];
      const exp = {};
      Object.keys(L.teams).forEach(id => {
        const f = feat[id] || m;
        const w = SEASON_LENGTH / 2 + 2.15 * (f[0] - m[0]) + 1.09 * (f[1] - m[1]) + 0.29 * (f[2] - m[2]);
        exp[id] = Math.max(40, Math.min(125, w));
      });
      return exp;
    },

    showLeaguePreview(pending) {
      pending.battingOrder = pending.battingOrder || this._optimizeBattingOrder(pending.lineup);
      this._preselectIronMen(pending);
      pending.teamName = pending.teamName || this._suggestTeamName(this._pendingCards(pending));
      const strength = this._pendingStrength(pending);
      if (!pending.league) {
        const draftLike = { roster: { lineup: pending.lineup, pitchers: pending.pitchers } };
        pending.league = createLeague(this._suggestUserLeague(draftLike), strength, pending.teamName, null, this._userCards(pending));
      }
      registerLeagueRosters(pending.league);
      pending.league.teams[USER_TEAM_ID].strength = Math.round(strength * 10) / 10;
      pending.league.teams[USER_TEAM_ID].name = pending.teamName;
      this._pendingSeason = pending;
      this.showScreen('screen-challenge-pack');
      this.renderLeaguePreview();
    },

    _setPendingLeague(lg) {
      const L = this._pendingSeason.league;
      L.userLeague = lg;
      L.teams[USER_TEAM_ID].league = lg;
      placeNegroLeagues(L);
    },

    renderLeaguePreview() {
      const p = this._pendingSeason;
      const container = document.getElementById('challenge162-pack-container');
      if (!p || !container) return;
      const L = p.league;
      const userLg = L.teams[USER_TEAM_ID].league;
      const exp = this._projectLeague(L);
      const proj = id => Math.round(exp[id]);
      const order = Object.keys(L.teams).sort((a, b) => exp[b] - exp[a]);
      const mine = order.filter(id => L.teams[id].league === userLg);
      const myRank = mine.indexOf(USER_TEAM_ID) + 1;
      const threats = mine.filter(id => id !== USER_TEAM_ID).slice(0, 3);
      const leagueCard = lg => {
        const top = order.filter(id => L.teams[id].league === lg && id !== USER_TEAM_ID).slice(0, 3);
        // The user and the Negro Leagues All-Stars always sit in opposite leagues.
        const chosen = userLg === lg;
        const franchises = Object.values(L.teams).filter(t => !t.isUser && t.id !== NLB_TEAM_ID && t.league === lg).length;
        const nlbHere = L.teams[NLB_TEAM_ID].league === lg;
        return `<button class="c162-lg-pick ${chosen ? 'active' : ''} lg-${lg}" data-lg="${lg}">
          <span class="c162-lg-pick-name">${lg === 'AL' ? 'AMERICAN LEAGUE' : 'NATIONAL LEAGUE'}${chosen ? ' <span class="c162-lg-pick-badge">✓ YOUR LEAGUE</span>' : ''}</span>
          <span class="c162-lg-pick-sub">${chosen
            ? `You play here against ${franchises} franchises${nlbHere ? ' and the Negro Leagues All-Stars' : ''}.`
            : `${franchises} franchises${nlbHere ? ' + the Negro Leagues All-Stars' : ''}. Tap to join instead; the All-Stars would move to the ${otherLeague(lg)}.`}</span>
          <span class="c162-lg-pick-top">Favorites: ${top.map(id => L.teams[id].name).join(' · ')}</span>
        </button>`;
      };
      // One column per league (AL left, NL right), each ranked on its own: that is the race
      // that decides the playoffs.
      const prColumn = lg => {
        const ids = order.filter(id => L.teams[id].league === lg);
        return `<div class="c162-pr-col">
          <div class="c162-pr-col-title lg-${lg}">${lg === 'AL' ? 'AMERICAN LEAGUE' : 'NATIONAL LEAGUE'}${lg === userLg ? ' · YOUR LEAGUE' : ''}</div>
          ${ids.map((id, i) => {
            const t = L.teams[id];
            const w = proj(id);
            return `<div class="c162-pr-row no-move ${t.isUser ? 'is-user' : ''} ${i === PLAYOFF_SEEDS - 1 ? 'cutline' : ''}">
              <span class="c162-pr-rank">${i + 1}</span>
              <span class="c162-pr-lg lg-${t.league}">${t.league}</span>
              <span class="c162-pr-name">${t.name}</span>
              <span class="c162-pr-rec">${w}-${SEASON_LENGTH - w}</span>
              <span class="c162-pr-str">${i < PLAYOFF_SEEDS ? 'PLAYOFFS' : ''}</span>
            </div>`;
          }).join('')}
        </div>`;
      };
      const rows = prColumn('AL') + prColumn('NL');

      container.innerHTML = `
        <div class="c162-preview">
          <div class="c162-preview-head">
            <div>
              <div class="c162-meet-kicker">LEAGUE PREVIEW · ${SEASON_LENGTH}-GAME SEASON</div>
              <div class="c162-preview-title">${p.teamName}</div>
            </div>
            <div class="c162-preview-proj">
              <div><span>PROJECTED</span><b>${proj(USER_TEAM_ID)}-${SEASON_LENGTH - proj(USER_TEAM_ID)}</b></div>
              <div><span>${userLg} RANK</span><b>#${myRank}</b></div>
              <div><span>GOAL</span><b>162-0</b></div>
            </div>
          </div>

          <div class="c162-meet-section">CHOOSE YOUR LEAGUE</div>
          <div class="c162-lg-picks">${leagueCard('AL')}${leagueCard('NL')}</div>
          <div class="c162-pr-note">Top ${PLAYOFF_SEEDS} of each league make the playoffs: 1 plays 4, 2 plays 3, league final, then the World Series. Most of your games are against your own league.</div>

          ${p.cfg && p.cfg.type === 'packs' ? '' : this._ironPicksHTML(p)}

          <div class="c162-meet-section">TEAMS TO WATCH IN THE ${userLg}</div>
          <div class="c162-threats">
            ${threats.map(id => `<div class="c162-threat"><b>${L.teams[id].name}</b><span>Proj. ${proj(id)}-${SEASON_LENGTH - proj(id)}</span></div>`).join('')}
          </div>

          <div class="c162-meet-section">PRESEASON POWER RANKINGS</div>
          <div class="c162-pr-note">Projected records from each roster's lineup, rotation and bullpen. The top ${PLAYOFF_SEEDS} of each league make the playoffs. A season still swings about 8 wins either way: every game is played out pitch by pitch.</div>
          <div class="c162-pr-leagues">${rows}</div>

          <div class="c162-meet-actions">
            ${p.cfg && p.cfg.type === 'packs' ? '<button id="btn-c162-preview-back" class="btn btn-secondary">◀ TEAM</button>' : ''}
            <button id="btn-c162-preview-start" class="btn c162-cta">⚾ PLAY BALL! START THE SEASON</button>
          </div>
        </div>`;

      container.querySelectorAll('.c162-lg-pick').forEach(btn => {
        btn.onclick = () => { this._setPendingLeague(btn.dataset.lg); this.renderLeaguePreview(); };
      });
      this._bindIronPicks(container, p, () => this.renderLeaguePreview());
      const back = container.querySelector('#btn-c162-preview-back');
      if (back) back.onclick = () => this.renderMeetTheTeam();
      container.querySelector('#btn-c162-preview-start').onclick = () => {
        this._pendingSeason = null;
        if (window.AudioManager && typeof window.AudioManager.play === 'function') window.AudioManager.play('play_ball');
        this.startNewChallenge(p.lineup, p.pitchers, p.cfg || this.getModeConfig(), p.bench || [], {
          league: L, teamName: p.teamName, battingOrder: p.battingOrder, ironMan: p.ironMan || {}
        });
      };
    },

    startRosterBuilder() {
      if (!this.unlockedBatters || !this.unlockedPitchers) {
        this.initUnlocks();
      }
      this._draftLineup = {};
      this._draftBench = [];
      this._draftPitchers = { SP: [], RP: [] };
      this._activeSlot = null;
      this._searchTerm = '';
      this._activeFilterPill = 'ALL';
      this.showScreen('screen-challenge-roster');
      this.renderRosterBuilder();
    },

    startRosterBuilderWithRun(runGame) {
      if (!this.unlockedBatters || !this.unlockedPitchers) {
        this.initUnlocks();
      }
      if (runGame) {
        this.unlockFromRun(runGame);
      }
      this._draftLineup = {};
      this._draftBench = [];
      this._draftPitchers = { SP: [], RP: [] };
      this._activeSlot = null;
      this._searchTerm = '';
      this._activeFilterPill = 'ALL';

      // 1. Pre-fill lineup with the winning run's exact batters
      if (runGame && runGame.roster) {
        const eligibleBatters = this.getEligibleBatters() || [];
        SLOTS.forEach(slot => {
          const runPlayer = runGame.roster[slot];
          if (runPlayer) {
            const match = eligibleBatters.find(b => cleanName(b) === cleanName(runPlayer)) || runPlayer;
            this._draftLineup[slot] = match;
          }
        });
      }

      // 2. Auto-fill remaining empty spots and pitchers
      this.autoFillRoster();

      this.showScreen('screen-challenge-roster');
      this.renderRosterBuilder();
    },

    autoFillRoster() {
      const eligibleBatters = (this.getEligibleBatters() || []).slice().sort((a, b) => (b.ovr || 50) - (a.ovr || 50));
      const eligiblePitchers = (this.getEligiblePitchers() || []).slice().sort((a, b) => (b.ovr || 50) - (a.ovr || 50));

      const usedB = new Set(SLOTS.map(s => this._draftLineup[s]).filter(Boolean).map(batterUnlockKey));
      const usedP = new Set([...this._draftPitchers.SP, ...this._draftPitchers.RP].filter(Boolean).map(pitcherUnlockKey));

      // 1. Fill Batters
      SLOTS.forEach(slot => {
        if (!this._draftLineup[slot]) {
          const match = eligibleBatters.find(p => {
            if (usedB.has(batterUnlockKey(p))) return false;
            if (slot === 'DH') return true;
            if (p.pos === slot) return true;
            const sec = (p.sec_pos || '').split(',').map(s => s.trim());
            return sec.includes(slot);
          });
          if (match) {
            this._draftLineup[slot] = match;
            usedB.add(batterUnlockKey(match));
          }
        }
      });

      // 2. Fill SPs (5)
      const sps = eligiblePitchers.filter(p => (p.role || 'SP').toUpperCase() === 'SP');
      for (let i = 0; i < 5; i++) {
        if (!this._draftPitchers.SP[i]) {
          const match = sps.find(p => !usedP.has(pitcherUnlockKey(p)));
          if (match) {
            this._draftPitchers.SP[i] = match;
            usedP.add(pitcherUnlockKey(match));
          }
        }
      }

      // 3. Fill the bench (5): a backup catcher first, then a middle infielder and an
      // outfielder, then the best bats left — the bench is who covers rest days.
      if (!Array.isArray(this._draftBench)) this._draftBench = [];
      this._draftBench.filter(Boolean).forEach(p => usedB.add(batterUnlockKey(p)));
      const benchNeeds = [p => canPlayerFillSlot(p, 'C'), p => canPlayerFillSlot(p, 'SS') || canPlayerFillSlot(p, '2B'),
        p => ['LF', 'CF', 'RF'].some(s => canPlayerFillSlot(p, s))];
      const benchHas = fits => this._draftBench.some(p => p && fits(p));
      const fillBench = fits => {
        const i = [0, 1, 2, 3, 4].find(n => !this._draftBench[n]);
        if (i === undefined) return;
        const match = eligibleBatters.find(p => !usedB.has(batterUnlockKey(p)) && fits(p));
        if (match) { this._draftBench[i] = match; usedB.add(batterUnlockKey(match)); }
      };
      benchNeeds.forEach(fits => { if (!benchHas(fits)) fillBench(fits); });
      for (let n = 0; n < 5; n++) fillBench(() => true);

      // 4. Fill RPs (6: CL, SETUP, 4 middle)
      const rps = eligiblePitchers.filter(p => (p.role || 'SP').toUpperCase() === 'RP');
      for (let i = 0; i < ROSTER_RP; i++) {
        if (!this._draftPitchers.RP[i]) {
          const match = rps.find(p => !usedP.has(pitcherUnlockKey(p))) || sps.find(p => !usedP.has(pitcherUnlockKey(p)));
          if (match) {
            this._draftPitchers.RP[i] = match;
            usedP.add(pitcherUnlockKey(match));
          }
        }
      }

      this.renderRosterBuilder();
      setTimeout(() => {
        const btn = document.getElementById('challenge162-start-season-btn');
        if (btn) {
          btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    },

    clearDraftRoster() {
      this._draftLineup = {};
      this._draftBench = [];
      this._draftPitchers = { SP: [], RP: [] };
      this._activeSlot = null;
      this._searchTerm = '';
      this.renderRosterBuilder();
    },

    _renderTradingCardHTML(player, slotLabel, isActive, kind, key) {
      if (!player) {
        return `
          <div class="c162-slot-item ${isActive ? 'active' : ''} challenge162-slot-btn" data-kind="${kind}" data-key="${key}">
            <div class="c162-slot-header-pill">${slotLabel}</div>
            <div class="c162-empty-card-frame">
              <span class="c162-empty-icon"><i class="fa-solid fa-plus"></i></span>
              <span class="c162-empty-text">${typeof window.t === 'function' ? window.t('challenge162.builder_empty_slot') : 'ELEGIR CARTA'}</span>
            </div>
          </div>
        `;
      }

      const cardHTML = typeof window.createCardHTML === 'function'
        ? window.createCardHTML(player, slotLabel)
        : `<div class="player-card"><div class="card-name">${player.name}</div></div>`;

      return `
        <div class="c162-slot-item ${isActive ? 'active' : ''} challenge162-slot-btn" data-kind="${kind}" data-key="${key}" title="${player.name} - Clic para cambiar">
          <div class="c162-slot-header-pill">${slotLabel}</div>
          <div class="c162-card-container">
            ${cardHTML}
          </div>
        </div>
      `;
    },

    renderRosterBuilder() {
      const container = document.getElementById('challenge162-roster-container');
      if (!container) return;

      try {
        if (!this.unlockedBatters || !this.unlockedPitchers) {
          this.initUnlocks();
        }
        if (!this._draftLineup) this._draftLineup = {};
        if (!this._draftPitchers) this._draftPitchers = { SP: [], RP: [] };
        if (!Array.isArray(this._draftPitchers.SP)) this._draftPitchers.SP = [];
        if (!Array.isArray(this._draftPitchers.RP)) this._draftPitchers.RP = [];
        if (!Array.isArray(this._draftBench)) this._draftBench = [];

        const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);
        const rpLabel = i => (i === 0 ? 'CL' : (i === 1 ? 'SETUP' : `RP${i - 1}`));

        const mode = this.getModeConfig();
        const eligibleBatters = this.getEligibleBatters() || [];
        const eligiblePitchers = this.getEligiblePitchers() || [];

        const infieldSlots = ['C', '1B', '2B', '3B', 'SS'];
        const outfieldSlots = ['LF', 'CF', 'RF', 'DH'];

        const infieldSlotsHTML = infieldSlots.map(slot => {
          const assigned = this._draftLineup[slot];
          const isActive = this._activeSlot && this._activeSlot.kind === 'batter' && this._activeSlot.key === slot;
          return this._renderTradingCardHTML(assigned, slot, isActive, 'batter', slot);
        }).join('');

        const outfieldSlotsHTML = outfieldSlots.map(slot => {
          const assigned = this._draftLineup[slot];
          const isActive = this._activeSlot && this._activeSlot.kind === 'batter' && this._activeSlot.key === slot;
          return this._renderTradingCardHTML(assigned, slot, isActive, 'batter', slot);
        }).join('');

        const spSlotsHTML = [0, 1, 2, 3, 4].map(i => {
          const assigned = this._draftPitchers.SP[i];
          const isActive = this._activeSlot && this._activeSlot.kind === 'SP' && this._activeSlot.key === i;
          return this._renderTradingCardHTML(assigned, `SP${i + 1}`, isActive, 'SP', i);
        }).join('');

        const rpSlotsHTML = Array.from({ length: ROSTER_RP }, (_, i) => i).map(i => {
          const assigned = this._draftPitchers.RP[i];
          const isActive = this._activeSlot && this._activeSlot.kind === 'RP' && this._activeSlot.key === i;
          return this._renderTradingCardHTML(assigned, rpLabel(i), isActive, 'RP', i);
        }).join('');

        const benchSlotsHTML = Array.from({ length: BENCH_SIZE }, (_, i) => i).map(i => {
          const assigned = this._draftBench[i];
          const isActive = this._activeSlot && this._activeSlot.kind === 'bench' && this._activeSlot.key === i;
          return this._renderTradingCardHTML(assigned, `BN${i + 1}`, isActive, 'bench', i);
        }).join('');

        const usedBatterKeys = new Set([...SLOTS.map(s => this._draftLineup[s]), ...this._draftBench].filter(Boolean).map(batterUnlockKey));
        const usedPitcherKeys = new Set([...this._draftPitchers.SP, ...this._draftPitchers.RP].filter(Boolean).map(pitcherUnlockKey));

        // 25-man roster: 9 + 5 bench + 5 SP + 6 RP. Bench or bullpen slots the unlocked
        // collection can't fill anymore are waived, so a small collection can still start.
        const filledBatters = SLOTS.filter(s => this._draftLineup[s]).length;
        const filledBench = this._draftBench.filter(Boolean).length;
        const filledSPs = this._draftPitchers.SP.filter(Boolean).length;
        const filledRPs = this._draftPitchers.RP.filter(Boolean).length;
        const spareBatters = eligibleBatters.filter(p => !usedBatterKeys.has(batterUnlockKey(p))).length;
        const sparePitchers = eligiblePitchers.filter(p => !usedPitcherKeys.has(pitcherUnlockKey(p))).length;
        const needBench = Math.min(BENCH_SIZE, filledBench + spareBatters);
        const needRPs = Math.max(3, Math.min(ROSTER_RP, filledRPs + sparePitchers));
        const filledCount = filledBatters + filledBench + filledSPs + filledRPs;
        const rosterTarget = 9 + needBench + 5 + needRPs;
        const complete = filledBatters === 9 && filledSPs === 5 && filledBench >= needBench && filledRPs >= needRPs;

        // Calculate average OVR
        const allSlotted = [
          ...SLOTS.map(s => this._draftLineup[s]).filter(Boolean),
          ...this._draftBench.filter(Boolean),
          ...this._draftPitchers.SP.filter(Boolean),
          ...this._draftPitchers.RP.filter(Boolean)
        ];
        const avgOVR = allSlotted.length ? (allSlotted.reduce((acc, p) => acc + (p.ovr || 50), 0) / allSlotted.length).toFixed(1) : '—';

        // Modal Overlay for Card Selection
        let modalOverlayHTML = '';
        if (this._activeSlot) {
          const isPitcherSlot = this._activeSlot.kind === 'SP' || this._activeSlot.kind === 'RP';
          const slotName = this._activeSlot.kind === 'bench' ? 'DH' : this._activeSlot.key;
          const slotDisplay = this._activeSlot.kind === 'batter' ? slotName
            : this._activeSlot.kind === 'bench' ? `BN${this._activeSlot.key + 1}`
            : (this._activeSlot.kind === 'SP' ? `SP${this._activeSlot.key + 1}` : rpLabel(this._activeSlot.key));

          // Bullpen slots list relievers first, then starters (any starter can pitch in relief).
          const isRelieverCard = p => (p.role || 'SP').toUpperCase() === 'RP';
          let pool = isPitcherSlot
            ? (this._activeSlot.kind === 'SP'
              ? eligiblePitchers.filter(p => !isRelieverCard(p))
              : eligiblePitchers.slice())
            : (slotName === 'DH' ? eligibleBatters : eligibleBatters.filter(p => {
                if (p.pos === slotName) return true;
                const secPos = (p.sec_pos || '').split(',').map(s => s.trim());
                return secPos.includes(slotName);
              }));

          // Exclude cards already assigned
          pool = isPitcherSlot
            ? pool.filter(p => !usedPitcherKeys.has(pitcherUnlockKey(p)))
            : pool.filter(p => !usedBatterKeys.has(batterUnlockKey(p)));

          // Sort by OVR descending (relievers ahead of starters for bullpen slots)
          const rpFirst = this._activeSlot.kind === 'RP';
          pool.sort((a, b) => (rpFirst ? (isRelieverCard(b) - isRelieverCard(a)) : 0) || (b.ovr || 50) - (a.ovr || 50));

          const term = (this._searchTerm || '').toLowerCase();
          const filtered = pool.filter(p => !term || (p.name && p.name.toLowerCase().includes(term)) || (p.team && p.team.toLowerCase().includes(term)));

          const candidateCardsHTML = filtered.map(p => {
            const cardHTML = typeof window.createCardHTML === 'function'
              ? window.createCardHTML(p, slotName)
              : `<div class="player-card"><div class="card-name">${p.name}</div></div>`;

            return `
              <div class="c162-candidate-wrap challenge162-candidate-btn" data-name="${encodeURIComponent(p.name)}" data-year="${p.year || ''}">
                ${cardHTML}
              </div>
            `;
          }).join('');

          const chooseTitle = _t('challenge162.choose_card_for', `ELEGIR CARTA PARA [${slotDisplay}]`, { slot: slotDisplay });
          const availableCountStr = _t('challenge162.cards_available', `${filtered.length} cartas disponibles para esta posición`, { count: filtered.length });
          const searchPlace = _t('challenge162.search_placeholder', '🔍 Buscar jugador por nombre o equipo...');
          const closeModalText = _t('challenge162.close', '✕ CERRAR');
          const noCardsFoundText = _t('challenge162.no_cards_found', `No se encontraron cartas desbloqueadas para la posición [${slotDisplay}] en este modo.`, { slot: slotDisplay });

          modalOverlayHTML = `
            <div id="c162-picker-modal-backdrop" class="c162-picker-backdrop" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 14px;">
              <div class="glass-panel" style="max-width: 960px; width: 100%; max-height: 88vh; display: flex; flex-direction: column; border: 2px solid #ffd700; box-shadow: 0 0 40px rgba(255, 215, 0, 0.4); border-radius: 16px; padding: 18px; position: relative; background: radial-gradient(circle at 50% 0%, #111827 0%, #030712 100%);">
                
                <!-- Modal Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">🎴</span>
                    <div>
                      <div style="font-family: 'Press Start 2P', monospace; font-size: 11px; color: #ffd700;">
                        ${chooseTitle}
                      </div>
                      <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
                        ${availableCountStr}
                      </div>
                    </div>
                  </div>
                  <button id="btn-challenge162-close-modal" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer;">
                    ${closeModalText}
                  </button>
                </div>

                <!-- Search Input -->
                <div style="margin-bottom: 14px;">
                  <input id="challenge162-search-modal" type="text" placeholder="${searchPlace}" value="${this._searchTerm || ''}"
                    style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; box-sizing: border-box; font-family: 'Outfit', sans-serif;">
                </div>

                <!-- Cards Grid -->
                <div class="c162-gallery-grid" style="flex: 1; overflow-y: auto; max-height: 60vh; padding: 8px 4px 16px 4px;">
                  ${candidateCardsHTML || `
                    <div style="width: 100%; color: #94a3af; font-size: 12px; text-align: center; padding: 40px 10px;">
                      ${noCardsFoundText}
                    </div>
                  `}
                </div>
              </div>
            </div>
          `;
        }

        const startSeasonText = _t('challenge162.start_season', 'EMPEZAR TEMPORADA 162-0');
        const autoFillText = _t('challenge162.autofill', 'AUTO-COMPLETAR');
        const clearRosterText = _t('challenge162.clear_roster', 'VACIAR');
        const hubBtnText = _t('challenge162.hub_btn', 'HUB');
        const teamOvrText = _t('challenge162.team_ovr', 'OVR EQUIPO');
        const rosterCountText = _t('challenge162.roster_count', 'ROSTER');
        const infieldText = _t('challenge162.infield', 'CUADRO / INFIELD');
        const outfieldDhText = _t('challenge162.outfield_dh', 'JARDINES Y DESIGNADO / OUTFIELD & DH');
        const lineupTitleText = _t('challenge162.lineup_title', 'ALINEACION TITULAR (LINEUP - 9 CARTAS)');
        const rotationTitleText = _t('challenge162.rotation_title_5', 'ROTACION DE ABRIDORES (ROTATION - 5 CARTAS)');
        const bullpenTitleText = _t('challenge162.bullpen_title_6', 'CUERPO DE RELEVISTAS (BULLPEN - 6 CARTAS)');

        container.innerHTML = `
          <!-- High-End Tactical HUD Top Bar -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;background:radial-gradient(circle at 50% 0%, rgba(15,23,42,0.95) 0%, rgba(8,12,22,0.98) 100%);padding:12px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);box-shadow:0 4px 20px rgba(0,0,0,0.4);flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <span class="c162-mode-badge" style="background:rgba(245,158,11,0.2);color:#ffd700;border:1px solid rgba(245,158,11,0.5);font-size:9.5px;padding:5px 10px;">
                ${mode.label}
              </span>
              <div style="font-size:11px;font-family:'Press Start 2P',monospace;color:#38bdf8;">
                ⭐ ${teamOvrText}: <span style="color:#ffd700;">${avgOVR}</span>
              </div>
              <div style="font-size:10px;font-family:'Press Start 2P',monospace;color:#94a3b8;">
                ${rosterCountText}: <span style="color:${complete ? '#34d399' : '#f59e0b'};">${filledCount}/${rosterTarget}</span>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              ${complete ? `
                <button id="btn-challenge162-start-top" class="btn" style="padding:6px 14px;font-size:9px;font-family:'Press Start 2P',monospace;background:linear-gradient(135deg,var(--challenge162-accent),#f59e0b);color:#000;border:none;border-radius:6px;cursor:pointer;box-shadow:0 0 16px rgba(255,215,0,0.5);">
                  ▶ ${startSeasonText}
                </button>
              ` : ''}
              <button id="btn-challenge162-autofill" class="btn" style="padding:6px 12px;font-size:9px;font-family:'Press Start 2P',monospace;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#000;border:none;border-radius:6px;cursor:pointer;">
                ⚡ ${autoFillText}
              </button>
              <button id="btn-challenge162-clear-roster" class="btn btn-secondary" style="padding:6px 10px;font-size:9px;font-family:'Press Start 2P',monospace;">
                🗑️ ${clearRosterText}
              </button>
              <button id="btn-challenge162-roster-back-hub" class="btn btn-secondary" style="padding:6px 10px;font-size:9px;font-family:'Press Start 2P',monospace;">
                ← ${hubBtnText}
              </button>
            </div>
          </div>

          <!-- Section 1: Batting Lineup (9 Cards) -->
          <div class="c162-roster-section">
            <div class="c162-section-header">
              <span>⚾</span> <span>${lineupTitleText}</span>
            </div>
            <div style="margin-bottom:10px;">
              <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#94a3af;margin-bottom:8px;text-align:center;">— ${infieldText} —</div>
              <div class="c162-cards-row">${infieldSlotsHTML}</div>
            </div>
            <div>
              <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#94a3af;margin-bottom:8px;text-align:center;">— ${outfieldDhText} —</div>
              <div class="c162-cards-row">${outfieldSlotsHTML}</div>
            </div>
          </div>

          <!-- Section 1b: Bench (5 Cards) — they cover rest days -->
          <div class="c162-roster-section">
            <div class="c162-section-header">
              <span>🛋️</span> <span>${_t('challenge162.bench_title', 'BENCH RESERVES (BENCH - 5 CARDS)')}</span>
            </div>
            <div class="c162-bench-hint">Bench players start when a regular needs a day off — carry a backup C and IF/OF cover.</div>
            ${(() => {
              const bn = this._draftBench.filter(Boolean);
              const gaps = rosterCoverGaps(this._draftLineup, bn);
              return bn.length && gaps.length ? `<div class="c162-meet-warn" style="text-align:center;">⚠ No backup at ${gaps.join(', ')} yet: ${gaps.length > 1 ? 'those starters' : 'that starter'} would rest less and be covered out of position.</div>` : '';
            })()}
            <div class="c162-cards-row">${benchSlotsHTML}</div>
          </div>

          <!-- Section 2: Starting Rotation (5 Cards) -->
          <div class="c162-roster-section">
            <div class="c162-section-header">
              <span>🧢</span> <span>${rotationTitleText}</span>
            </div>
            <div class="c162-cards-row">${spSlotsHTML}</div>
          </div>

          <!-- Section 3: Bullpen (6 Cards) -->
          <div class="c162-roster-section">
            <div class="c162-section-header">
              <span>🔥</span> <span>${bullpenTitleText}</span>
            </div>
            <div class="c162-cards-row">${rpSlotsHTML}</div>
          </div>

          <!-- Candidate Cards Pop-up Modal Overlay -->
          ${modalOverlayHTML}

          <!-- Start Season CTA -->
          <div style="text-align:center;margin-top:14px;margin-bottom:8px;">
            <button id="challenge162-start-season-btn" class="btn" ${complete ? '' : 'disabled'}
              style="padding:10px 26px;font-size:11.5px;font-family:'Press Start 2P',monospace;background:${complete ? 'linear-gradient(135deg,var(--challenge162-accent),#f59e0b)' : '#334155'};color:${complete ? '#000' : '#94a3af'};border:none;border-radius:10px;cursor:${complete ? 'pointer' : 'not-allowed'};box-shadow:${complete ? '0 0 28px rgba(255,215,0,0.45)' : 'none'};transition:all 0.2s ease;">
              ${startSeasonText} (${filledCount}/${rosterTarget})
            </button>
          </div>
        `;

        container.querySelectorAll('.challenge162-slot-btn').forEach(btn => {
          btn.onclick = () => {
            const kind = btn.getAttribute('data-kind');
            const rawKey = btn.getAttribute('data-key');
            const key = kind === 'batter' ? rawKey : parseInt(rawKey, 10);
            
            if (this._activeSlot && this._activeSlot.kind === kind && this._activeSlot.key === key) {
              this._activeSlot = null;
            } else {
              this._activeSlot = { kind, key };
            }
            this._searchTerm = '';
            this.renderRosterBuilder();
          };
        });

        container.querySelectorAll('.challenge162-candidate-btn').forEach(btn => {
          btn.onclick = () => {
            const name = decodeURIComponent(btn.getAttribute('data-name'));
            const yearStr = btn.getAttribute('data-year');
            const year = yearStr ? parseInt(yearStr, 10) : null;
            const kind = this._activeSlot.kind;
            if (kind === 'batter') {
              const p = eligibleBatters.find(b => b.name === name && (!year || b.year === year));
              if (p) this._draftLineup[this._activeSlot.key] = p;
            } else if (kind === 'bench') {
              const p = eligibleBatters.find(b => b.name === name && (!year || b.year === year));
              if (p) this._draftBench[this._activeSlot.key] = p;
            } else if (kind === 'SP') {
              const p = eligiblePitchers.find(pi => pi.name === name && (!year || pi.year === year));
              if (p) this._draftPitchers.SP[this._activeSlot.key] = p;
            } else if (kind === 'RP') {
              const p = eligiblePitchers.find(pi => pi.name === name && (!year || pi.year === year));
              if (p) this._draftPitchers.RP[this._activeSlot.key] = p;
            }
            if (window.AudioManager && typeof window.AudioManager.play === 'function') {
              window.AudioManager.play('card_deal');
            } else if (typeof window.playSound === 'function') {
              window.playSound('card_flip');
            }
            this._activeSlot = null;
            this._searchTerm = '';
            this.renderRosterBuilder();
          };
        });

        const btnCloseModal = document.getElementById('btn-challenge162-close-modal');
        if (btnCloseModal) {
          btnCloseModal.onclick = () => {
            this._activeSlot = null;
            this.renderRosterBuilder();
          };
        }

        const backdrop = document.getElementById('c162-picker-modal-backdrop');
        if (backdrop) {
          backdrop.onclick = (e) => {
            if (e.target === backdrop) {
              this._activeSlot = null;
              this.renderRosterBuilder();
            }
          };
        }

        const searchInput = document.getElementById('challenge162-search-modal');
        if (searchInput) {
          searchInput.oninput = (e) => {
            this._searchTerm = e.target.value;
            this.renderRosterBuilder();
            const reSearch = document.getElementById('challenge162-search-modal');
            if (reSearch) {
              reSearch.focus();
              reSearch.setSelectionRange(reSearch.value.length, reSearch.value.length);
            }
          };
        }

        const btnAutoFill = document.getElementById('btn-challenge162-autofill');
        if (btnAutoFill) btnAutoFill.onclick = () => this.autoFillRoster();

        const btnClear = document.getElementById('btn-challenge162-clear-roster');
        if (btnClear) btnClear.onclick = () => this.clearDraftRoster();

        const btnBackHub = document.getElementById('btn-challenge162-roster-back-hub');
        if (btnBackHub) btnBackHub.onclick = () => this.renderHub();

        const startBtn = document.getElementById('challenge162-start-season-btn');
        if (startBtn && complete) {
          startBtn.onclick = () => {
            this.showLeaguePreview({ lineup: this._draftLineup, pitchers: { SP: this._draftPitchers.SP.filter(Boolean), RP: this._draftPitchers.RP.filter(Boolean) }, bench: this._draftBench.filter(Boolean), cfg: this.getModeConfig() });
          };
        }

        const startTopBtn = document.getElementById('btn-challenge162-start-top');
        if (startTopBtn && complete) {
          startTopBtn.onclick = () => {
            this.showLeaguePreview({ lineup: this._draftLineup, pitchers: { SP: this._draftPitchers.SP.filter(Boolean), RP: this._draftPitchers.RP.filter(Boolean) }, bench: this._draftBench.filter(Boolean), cfg: this.getModeConfig() });
          };
        }
      } catch (err) {
        console.error("Error in renderRosterBuilder:", err);
      }
    },

    // Wear meter for one of the user's batters: the bar fills toward the next −1; past it the
    // cell shows the penalty he is playing with. Iron Men (picked in the preview) get a badge.
    _wearCellHTML(p, isRegular) {
      const S = this.state;
      const k = batterUnlockKey(p);
      const f = (S.league && S.league.wear && S.league.wear[this._leagueKey(USER_TEAM_ID, k)]) || 0;
      const pen = wearPenalty(f);
      const fill = pen >= WEAR_MAX_PENALTY ? 100 : Math.round(((f % WEAR_PER_POINT) / WEAR_PER_POINT) * 100);
      const iron = !!(S.ironMan && S.ironMan[k]);
      const label = pen ? `−${pen}` : '';
      const btn = isRegular && iron ? '<span class="c162-iron on" title="Iron Man: wears down at a quarter of the speed">IM</span>' : '';
      return `<span class="c162-wear pen-${pen}"><span class="c162-wear-bar"><i style="width:${fill}%"></i></span><b>${label}</b>${btn}</span>`;
    },

    _statLine(s) {
      const avg = s.ab > 0 ? (s.h / s.ab).toFixed(3).replace(/^0/, '') : '.000';
      return `${s.name}: AB ${s.ab} H ${s.h} HR ${s.hr} RBI ${s.rbi} BB ${s.bb} SO ${s.so} AVG ${avg}`;
    },

    renderSeason() {
      const container = document.getElementById('challenge162-season-container');
      if (!container || !this.state) return;
      const S = this.state;
      const seasonOver = S.gamesPlayed >= SEASON_LENGTH;

      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      const td = (val, opts) => `<td class="c162-td${opts && opts.num ? ' c162-td-num' : ''}"${opts && opts.accent ? ' style="color:var(--challenge162-accent);font-weight:bold;"' : (opts && opts.style ? ` style="${opts.style}"` : '')}>${val}</td>`;

      if (!S.roster.battingOrder || S.roster.battingOrder.length !== 9) {
        S.roster.battingOrder = this._optimizeBattingOrder ? this._optimizeBattingOrder(S.roster.lineup) : SLOTS;
      }
      const battingOrder = S.roster.battingOrder;

      // ── Batters Rows (in authentic 1-9 Batting Order sequence with OBP, SLG, OPS, dWAR, WAR) ───
      const batterRows = battingOrder.map((slot, i) => {
        const p = S.roster.lineup[slot];
        if (!p) return '';
        const k = batterUnlockKey(p);
        const s = S.batterStats[k] || { g: 0, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
        const singles = Math.max(0, s.h - (s.doubles || 0) - (s.triples || 0) - s.hr);
        const tb = singles + (s.doubles || 0) * 2 + (s.triples || 0) * 3 + s.hr * 4;
        const pa = s.ab + s.bb;
        const avg = s.ab > 0 ? (s.h / s.ab).toFixed(3).replace(/^0/, '') : '.000';
        const obp = pa > 0 ? ((s.h + s.bb) / pa).toFixed(3).replace(/^0/, '') : '.000';
        const slg = s.ab > 0 ? (tb / s.ab).toFixed(3).replace(/^0/, '') : '.000';
        const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3).replace(/^0/, '');
        const defVal = p.def !== undefined ? p.def : (p.defense_val !== undefined ? p.defense_val : 50);
        const dwar = calcBatterDWAR(s, slot, defVal);
        const war = calcBatterWAR(s, slot, defVal);
        const dwarColor = parseFloat(dwar) > 0 ? '#34d399' : (parseFloat(dwar) < 0 ? '#f87171' : '#94a3b8');

        return `<tr class="c162-tr${i % 2 ? ' c162-tr-alt' : ''}">
          ${td(`<span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#94a3b8;">${i + 1}</span>`, { style: 'text-align:center;' })}
          ${td(`<span class="c162-tag-pos">${slot}</span>`)}
          ${td(s.name)}
          ${td(s.g || 0, { num: true })}
          ${td(this._wearCellHTML(p, true))}
          ${td(s.ab, { num: true })}
          ${td(s.h, { num: true })}
          ${td(s.doubles || 0, { num: true })}
          ${td(s.triples || 0, { num: true })}
          ${td(s.hr, { num: true, accent: true })}
          ${td(s.rbi, { num: true })}
          ${td(s.bb, { num: true })}
          ${td(s.so, { num: true })}
          ${td(s.sb || 0, { num: true })}
          ${td(s.cs || 0, { num: true })}
          ${td(s.r || 0, { num: true })}
          ${td(avg, { num: true })}
          ${td(obp, { num: true })}
          ${td(slg, { num: true })}
          ${td(ops, { num: true })}
          ${td(`<span style="color:${dwarColor};font-size:9.5px;">${dwar}</span>`, { num: true })}
          ${td(war, { num: true, accent: true })}
        </tr>`;
      }).join('');

      // ── Bench Rows (5 Bench Reserves if present in roster) ─────────────
      const benchRows = (S.roster.bench || []).map((p, i) => {
        if (!p) return '';
        const k = batterUnlockKey(p);
        const s = S.batterStats[k] || { g: 0, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
        const singles = Math.max(0, s.h - (s.doubles || 0) - (s.triples || 0) - s.hr);
        const tb = singles + (s.doubles || 0) * 2 + (s.triples || 0) * 3 + s.hr * 4;
        const pa = s.ab + s.bb;
        const avg = s.ab > 0 ? (s.h / s.ab).toFixed(3).replace(/^0/, '') : '.000';
        const obp = pa > 0 ? ((s.h + s.bb) / pa).toFixed(3).replace(/^0/, '') : '.000';
        const slg = s.ab > 0 ? (tb / s.ab).toFixed(3).replace(/^0/, '') : '.000';
        const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3).replace(/^0/, '');
        const defVal = p.def !== undefined ? p.def : (p.defense_val !== undefined ? p.defense_val : 50);
        const dwar = calcBatterDWAR(s, p.pos || 'BN', defVal);
        const war = calcBatterWAR(s, p.pos || 'BN', defVal);
        const dwarColor = parseFloat(dwar) > 0 ? '#34d399' : (parseFloat(dwar) < 0 ? '#f87171' : '#94a3b8');

        return `<tr class="c162-tr${(i + 9) % 2 ? ' c162-tr-alt' : ''}">
          ${td(`<span style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#94a3b8;">BN</span>`, { style: 'text-align:center;' })}
          ${td(`<span class="c162-tag-pos" style="background:rgba(52,211,153,0.15);color:#34d399;border:1px solid rgba(52,211,153,0.4);">BN${i + 1}</span>`)}
          ${td(s.name)}
          ${td(s.g || 0, { num: true })}
          ${td(this._wearCellHTML(p, false))}
          ${td(s.ab, { num: true })}
          ${td(s.h, { num: true })}
          ${td(s.doubles || 0, { num: true })}
          ${td(s.triples || 0, { num: true })}
          ${td(s.hr, { num: true, accent: true })}
          ${td(s.rbi, { num: true })}
          ${td(s.bb, { num: true })}
          ${td(s.so, { num: true })}
          ${td(s.sb || 0, { num: true })}
          ${td(s.cs || 0, { num: true })}
          ${td(s.r || 0, { num: true })}
          ${td(avg, { num: true })}
          ${td(obp, { num: true })}
          ${td(slg, { num: true })}
          ${td(ops, { num: true })}
          ${td(`<span style="color:${dwarColor};font-size:9.5px;">${dwar}</span>`, { num: true })}
          ${td(war, { num: true, accent: true })}
        </tr>`;
      }).join('');

      // ── Pitchers Rows (5 SP + Bullpen with IP, WHIP, ERA, WAR) ─────────────
      const allPitchers = [
        ...(S.roster.pitchers.SP || []).map((p, i) => ({ p, roleLabel: `SP${i + 1}`, roleColor: '#38bdf8', roleBg: 'rgba(56,189,248,0.15)' })),
        ...(S.roster.pitchers.RP || []).map((p, i) => {
          const isCloser = i === 0;
          const isSetup = i === 1;
          const roleLabel = isCloser ? 'CL' : (isSetup ? 'SETUP' : (S.roster.pitchers.RP.length > 3 ? `RP${i - 1}` : 'RP'));
          const roleColor = isCloser ? '#fbbf24' : (isSetup ? '#a78bfa' : '#34d399');
          const roleBg = isCloser ? 'rgba(251,191,36,0.15)' : (isSetup ? 'rgba(167,139,250,0.15)' : 'rgba(52,211,153,0.15)');
          return { p, roleLabel, roleColor, roleBg, isCloser };
        })
      ];

      const pitcherRows = allPitchers.map(({ p, roleLabel, roleColor, roleBg, isCloser }, i) => {
        if (!p) return '';
        const k = pitcherUnlockKey(p);
        const s = S.pitcherStats[k] || { outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
        const fullInn = Math.floor(s.outs / 3);
        const remOuts = s.outs % 3;
        const ipDisplay = `${fullInn}.${remOuts}`;
        const ipDec = s.outs / 3;
        const era = ipDec > 0 ? ((s.er * 9) / ipDec).toFixed(2) : '0.00';
        const whip = ipDec > 0 ? ((s.bb + s.h) / ipDec).toFixed(2) : '0.00';
        const roleBadge = `<span class="c162-tag-role" style="background:${roleBg};">${roleLabel}</span>`;
        const war = calcPitcherWAR(s, roleLabel);

        return `<tr class="c162-tr${i % 2 ? ' c162-tr-alt' : ''}">
          ${td(s.name)}
          ${td(roleBadge, { style: 'text-align:center;' })}
          ${td(ipDisplay, { num: true })}
          ${td(s.h, { num: true })}
          ${td(s.er, { num: true })}
          ${td(s.bb, { num: true })}
          ${td(s.so, { num: true })}
          ${td(s.w, { num: true })}
          ${td(s.l, { num: true })}
          ${td(s.sv, { num: true, style: isCloser ? 'color:#fbbf24;font-weight:bold;' : '' })}
          ${td(s.hld || 0, { num: true })}
          ${td(s.bs || 0, { num: true })}
          ${td(s.cg || 0, { num: true })}
          ${td(whip, { num: true })}
          ${td(era, { num: true })}
          ${td(war, { num: true, accent: true })}
        </tr>`;
      }).join('');

      const logRows = S.gameLog.slice().reverse().map(g => `
        <div class="c162-game-badge">
          <span class="c162-outcome-pill ${g.won ? 'c162-outcome-w' : 'c162-outcome-l'}">${g.won ? 'W' : 'L'}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:bold;color:#f3f4f6;display:flex;justify-content:space-between;font-size:10px;">
              <span>${g.userRuns} - ${g.oppRuns}</span>
              ${g.inning && g.inning > 9 ? `<span style="font-size:8.5px;color:#fbbf24;">(${g.inning} inn)</span>` : ''}
            </div>
            <div style="font-size:8.5px;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;">vs ${g.opponent}</div>
          </div>
        </div>
      `).join('');

      let nextGameHTML = '';
      if (!seasonOver) {
        const sched = S.schedule[S.gamesPlayed];
        const opp = getFranchiseDecadeTeam(sched.code, sched.decade);
        // With the real league, show the rival's starter whose turn it is in their rotation.
        const oppRec = S.league && (S.league.teams[sched.id] || Object.values(S.league.teams).find(t => t.code === sched.code));
        const oppRotation = oppRec ? getFranchiseStaff(oppRec.code, oppRec.decade).rotation : null;
        const oppStarter = oppRotation ? oppRotation[(oppRec.w + oppRec.l) % oppRotation.length] : opp.pitcher;
        const oppBattersHTML = opp.lineup.slice(0, 9).map((p, idx) =>
          `<div style="display:flex;justify-content:space-between;align-items:center;font-size:9.5px;padding:2px 6px;">
            <span style="color:#64748b;font-family:'Press Start 2P',monospace;font-size:7px;width:14px;">${idx + 1}.</span>
            <span style="color:#9ca3af;font-weight:bold;min-width:24px;">${p.assignedSlot || p.pos}</span>
            <span style="color:#e4e4e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;flex:1;padding:0 4px;">${p.name}</span>
            <span style="color:var(--challenge162-accent);">${Math.floor(p.ovr || 80)}</span>
          </div>`
        ).join('');
        
        const nextGameLabel = _t('challenge162.season_next_game', 'Próximo partido');
        const rivalSPLabel = _t('challenge162.season_rival_sp', 'ABRIDOR RIVAL');

        nextGameHTML = `
          <div style="flex: 1 1 480px; max-width: 580px; margin: 0; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,215,0,0.2); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box;">
            <div style="font-size:8.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-family:'Press Start 2P',monospace;">${nextGameLabel}</div>
            <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:var(--challenge162-accent);margin-bottom:8px;">vs ${opp.name}</div>
            <div style="display:flex;gap:10px;text-align:left;">
              <div style="flex:1;background:rgba(255,255,255,0.03);border-radius:6px;padding:4px 2px;">${oppBattersHTML}</div>
              <div style="flex:0 0 135px;background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;text-align:center;display:flex;flex-direction:column;justify-content:center;">
                <div style="font-size:8px;color:#94a3b8;font-family:'Press Start 2P',monospace;">${rivalSPLabel}</div>
                <div style="font-size:10.5px;color:#e4e4e7;margin-top:4px;font-weight:bold;">${oppStarter.cleanName || oppStarter.name}</div>
                <div style="font-size:8.5px;color:var(--challenge162-accent);margin-top:2px;font-family:'Press Start 2P',monospace;">OVR ${Math.floor(oppStarter.ovr || 0)}</div>
              </div>
            </div>
          </div>
        `;
      }

      let actionHTML = '';
      const sim1Text = _t('challenge162.season_sim_1', '▶ SIMULAR 1');
      const sim10Text = _t('challenge162.season_sim_10', '⏩ SIMULAR 10');
      const simUntilText = _t('challenge162.season_sim_until', '⏭ HASTA DERROTA');

      if (!seasonOver) {
        const isAutoRunning = Boolean(this._autoSimTimer);
        const autoSimRunText = _t('challenge162.auto_sim_run', 'PAUSAR AUTO SIM');
        const autoSimStartText = _t('challenge162.auto_sim_start', 'AUTO SIM (1 A 1)');

        actionHTML = `
          <button id="challenge162-play-auto" class="btn" style="padding:10px 16px;font-size:10px;font-family:'Press Start 2P',monospace;margin:4px;background:${isAutoRunning ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#06b6d4,#3b82f6)'};color:#fff;border:1px solid #fff;box-shadow:${isAutoRunning ? '0 0 14px rgba(239,68,68,0.6)' : '0 0 14px rgba(6,182,212,0.5)'};cursor:pointer;">
            ${isAutoRunning ? `⏸️ ${autoSimRunText}` : `⚡ ${autoSimStartText}`}
          </button>
          <button id="challenge162-play-1" class="btn" style="padding:10px 16px;font-size:10px;font-family:'Press Start 2P',monospace;margin:4px;">${sim1Text}</button>
          <button id="challenge162-play-10" class="btn btn-secondary" style="padding:10px 16px;font-size:10px;font-family:'Press Start 2P',monospace;margin:4px;">${sim10Text}</button>
          <button id="challenge162-play-until" class="btn btn-secondary" style="padding:10px 16px;font-size:10px;font-family:'Press Start 2P',monospace;margin:4px;">${simUntilText}</button>
        `;
      } else if (S.league) {
        this.stopAutoSim();
        const lg = S.league.teams[USER_TEAM_ID].league;
        const myRank = leagueStandings(S.league, lg).findIndex(t => t.id === USER_TEAM_ID) + 1;
        const viewResultsText = 'VIEW FINAL RESULTS';
        if (S.playoffs.missed) {
          actionHTML = `<div style="color:#f87171;font-size:12px;margin-bottom:6px;font-family:'Press Start 2P',monospace;line-height:1.6;">Season over ${S.wins}-${S.losses} · finished #${myRank} in the ${lg}. Only the top ${PLAYOFF_SEEDS} make the postseason.</div>
            <button id="challenge162-view-results" class="btn btn-secondary" style="padding:10px 16px;font-size:10px;font-family:'Press Start 2P',monospace;">${viewResultsText}</button>`;
        } else if (!S.playoffs.finished) {
          const title = S.wins === SEASON_LENGTH
            ? `🏆 PERFECT SEASON (162-0)! ${lg} #1 seed.`
            : `🎉 Playoff bound! ${S.wins}-${S.losses} · ${lg} #${S.playoffs.userSeed} seed.`;
          actionHTML = `<div style="color:var(--challenge162-accent);font-size:13px;margin-bottom:10px;font-family:'Press Start 2P',monospace;">${title}</div>
            <button id="challenge162-goto-playoffs" class="btn" style="padding:12px 20px;font-size:11px;font-family:'Press Start 2P',monospace;">▶ GO TO PLAYOFFS</button>`;
        } else {
          actionHTML = `<div style="color:#ffd700;font-size:12px;margin-bottom:6px;">🏆 Regular season (${S.wins}-${S.losses}) & postseason complete.</div>
            <button id="challenge162-view-results" class="btn btn-secondary" style="padding:10px 16px;font-size:10px;font-family:'Press Start 2P',monospace;">${viewResultsText}</button>`;
        }
      } else if (S.wins >= PLAYOFF_MIN_WINS) {
        this.stopAutoSim();
        if (!S.playoffs.finished) {
          const gotoPlayoffsText = _t('challenge162.season_goto_playoffs', '▶ IR A PLAYOFFS');
          const title = S.wins === SEASON_LENGTH
            ? _t('challenge162.season_perfect_title', '🏆 ¡TEMPORADA PERFECTA (162-0)! Playoffs desbloqueados.')
            : _t('challenge162.season_qualified_title', `🎉 ¡Clasificaste a Playoffs! (${S.wins}-${S.losses})`, { wins: S.wins, losses: S.losses });
          actionHTML = `<div style="color:var(--challenge162-accent);font-size:13px;margin-bottom:10px;font-family:'Press Start 2P',monospace;">${title}</div>
            <button id="challenge162-goto-playoffs" class="btn" style="padding:12px 20px;font-size:11px;font-family:'Press Start 2P',monospace;">${gotoPlayoffsText}</button>`;
        } else {
          const viewResultsText = _t('challenge162.season_view_results', 'VER RESULTADO FINAL');
          actionHTML = `<div style="color:#ffd700;font-size:12px;margin-bottom:6px;">🏆 Temporada regular (${S.wins}-${S.losses}) & Postemporada finalizadas.</div>
            <button id="challenge162-view-results" class="btn btn-secondary" style="padding:10px 16px;font-size:10px;font-family:'Press Start 2P',monospace;">${viewResultsText}</button>`;
        }
      } else {
        this.stopAutoSim();
        const needed = PLAYOFF_MIN_WINS - S.wins;
        const lostTitle = `Temporada terminada ${S.wins}-${S.losses} — faltaron ${needed} victorias para clasificar.`;
        const viewResultsText = _t('challenge162.season_view_results', 'VER RESULTADO FINAL');
        const nearMissText = needed <= 5 ? _t('challenge162.season_near_miss', '¡Tan cerca de las 100 victorias! Reforzá el roster e intentalo de nuevo.') : _t('challenge162.season_try_again', 'Necesitas al menos 100 victorias para clasificar a Playoffs. ¡Reforzá el roster e intentalo de nuevo!');
        actionHTML = `<div style="color:#f87171;font-size:12px;margin-bottom:6px;">${lostTitle}</div>
          <div style="color:#fbbf24;font-size:11px;margin-bottom:10px;">${nearMissText}</div>
          <button id="challenge162-view-results" class="btn btn-secondary" style="padding:10px 16px;font-size:10px;font-family:'Press Start 2P',monospace;">${viewResultsText}</button>`;
      }

      const streak = S.streak || 0;
      let streakHTML = '';
      if (streak >= 3) {
        const tier = streak >= 60 ? 3 : streak >= 25 ? 2 : streak >= 10 ? 1 : 0;
        const flames = ['🔥', '🔥🔥', '🔥🔥🔥', '🔥🔥🔥🔥'][tier];
        const sizes = [11, 12, 13, 14];
        const streakLabel = _t('challenge162.season_streak', `RACHA DE ${streak}`, { streak });
        streakHTML = `<div class="c162-streak-badge" style="font-size:${sizes[tier]}px;margin-top:6px;color:#fbbf24;text-shadow:0 0 ${6 + tier * 4}px rgba(251,191,36,${0.5 + tier * 0.15});font-family:'Press Start 2P',monospace;letter-spacing:0.5px;">
          ${flames} ${streakLabel}
        </div>`;
      }

      const completedPct = Math.round((S.gamesPlayed / SEASON_LENGTH) * 100);
      const titleText = _t('challenge162.season_title', '162-0 CHALLENGE');
      const regularSeasonText = _t('challenge162.season_regular', 'TEMPORADA REGULAR');
      const gamesCountText = _t('challenge162.season_games_count', `Juego ${S.gamesPlayed} / ${SEASON_LENGTH}`, { current: S.gamesPlayed, total: SEASON_LENGTH });
      const battersTitle = _t('challenge162.season_batters_title', 'BATEADORES');
      const pitchersTitle = _t('challenge162.season_pitchers_title', 'LANZADORES');
      const recentGamesTitle = _t('challenge162.season_recent_games', 'ULTIMOS PARTIDOS');
      const noGamesText = _t('challenge162.season_no_games', 'No hay juegos disputados aún');

      container.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:15px;color:var(--challenge162-accent);letter-spacing:1px;margin-bottom:4px;">
          ${titleText}
        </div>
        <div style="font-size:10px;color:#94a3b8;font-family:'Press Start 2P',monospace;letter-spacing:0.5px;margin-bottom:12px;">
          ${regularSeasonText} &middot; ${gamesCountText}
        </div>

        ${this._alertsHTML()}
        <!-- Top Horizontal Row: [RECORD & MODE BADGE] + [NEXT GAME RIVAL BOX] SIDE-BY-SIDE -->
        <div class="c162-season-top-row" style="display:flex;justify-content:center;align-items:stretch;gap:14px;flex-wrap:wrap;margin-bottom:14px;max-width:960px;margin-left:auto;margin-right:auto;">
          
          <!-- Left: Record & Mode Summary Card -->
          <div class="c162-record-card" style="flex: 1 1 320px; max-width: 380px; margin: 0; background: radial-gradient(circle at 50% 0%, rgba(15,23,42,0.95) 0%, rgba(8,12,22,0.98) 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.4); box-sizing: border-box;">
            <div style="margin-bottom:6px;">
              <span class="c162-mode-badge" style="background:rgba(245,158,11,0.2);color:#ffd700;border:1px solid rgba(245,158,11,0.5);font-size:9.5px;padding:4px 8px;">
                ${(S.modeConfig && S.modeConfig.label) || '162-0 CHALLENGE'}
              </span>
            </div>
            
            <div style="display:flex;align-items:center;gap:16px;margin:2px 0;">
              <div class="c162-rec-w" style="font-family:'Press Start 2P',monospace;font-size:22px;color:#34d399;text-shadow:0 0 12px rgba(52,211,153,0.5);">
                ${S.wins}
              </div>
              <div style="font-family:'Press Start 2P',monospace;font-size:14px;color:#64748b;">
                -
              </div>
              <div class="c162-rec-l" style="font-family:'Press Start 2P',monospace;font-size:22px;color:#f87171;text-shadow:0 0 12px rgba(248,113,113,0.5);">
                ${S.losses}
              </div>
            </div>

            <div style="font-size:10.5px;color:#94a3b8;margin-top:2px;">
              ${gamesCountText}
            </div>

            ${streakHTML}
            ${this._momentumBadgeHTML()}
          </div>

          <!-- Right: Next Game Rival Box (if season in progress) -->
          ${nextGameHTML}

        </div>

        <!-- Progress bar -->
        <div class="c162-season-progress" style="max-width:680px;margin:0 auto 16px auto;background:rgba(255,255,255,0.08);border-radius:6px;height:8px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,var(--challenge162-accent),#34d399);height:100%;width:${completedPct}%;transition:width 0.3s ease;"></div>
        </div>

        <div style="margin-bottom:18px;">
          ${actionHTML}
        </div>

        ${this._lastGameHTML()}
        <!-- Two column layout: Left (Tables) + Right (Game Log Feed) -->
        <div class="c162-season-grid">
          <div class="c162-main-panel">
            <!-- Batters -->
            <div style="margin-bottom:18px;">
              <div style="font-size:10.5px;color:#ffd700;margin-bottom:6px;text-align:left;font-family:'Press Start 2P',monospace;">
                ⚾ ${battersTitle}
              </div>
              <div class="c162-table-wrap">
                <table class="c162-table">
                  <thead><tr>
                    <th class="c162-th" style="width:28px;text-align:center;">#</th>
                    <th class="c162-th">POS</th>
                    <th class="c162-th">${_t('challenge162.table_player', 'PLAYER')}</th>
                    <th class="c162-th">G</th>
                    <th class="c162-th" title="Wear: fills with every start (catchers fastest). A full bar costs −1 to batting ratings; a day off resets it. IM = Iron Man, wears at a quarter of the speed (picked in the League Preview).">WEAR</th>
                    <th class="c162-th">AB</th>
                    <th class="c162-th">H</th>
                    <th class="c162-th">2B</th>
                    <th class="c162-th">3B</th>
                    <th class="c162-th" style="color:var(--challenge162-accent);">HR</th>
                    <th class="c162-th">RBI</th>
                    <th class="c162-th">BB</th>
                    <th class="c162-th">SO</th>
                    <th class="c162-th">SB</th>
                    <th class="c162-th" title="Caught stealing">CS</th>
                    <th class="c162-th">R</th>
                    <th class="c162-th">AVG</th>
                    <th class="c162-th">OBP</th>
                    <th class="c162-th">SLG</th>
                    <th class="c162-th">OPS</th>
                    <th class="c162-th" style="color:#34d399;" title="Defensive WAR">dWAR</th>
                    <th class="c162-th" style="color:var(--challenge162-accent);">WAR</th>
                  </tr></thead>
                  <tbody>${batterRows}${benchRows}</tbody>
                </table>
              </div>
            </div>

            <!-- Pitchers -->
            <div>
              <div style="font-size:10.5px;color:#ffd700;margin-bottom:6px;text-align:left;font-family:'Press Start 2P',monospace;">
                🧢 ${pitchersTitle}
              </div>
              <div class="c162-table-wrap">
                <table class="c162-table">
                  <thead><tr>
                    <th class="c162-th">${_t('challenge162.table_pitcher', 'PITCHER')}</th>
                    <th class="c162-th">ROLE</th>
                    <th class="c162-th">IP</th>
                    <th class="c162-th">H</th>
                    <th class="c162-th">ER</th>
                    <th class="c162-th">BB</th>
                    <th class="c162-th">SO</th>
                    <th class="c162-th">W</th>
                    <th class="c162-th">L</th>
                    <th class="c162-th">SV</th>
                    <th class="c162-th" title="Holds">HLD</th>
                    <th class="c162-th" title="Blown saves">BS</th>
                    <th class="c162-th" title="Complete games">CG</th>
                    <th class="c162-th">WHIP</th>
                    <th class="c162-th">ERA</th>
                    <th class="c162-th" style="color:var(--challenge162-accent);">WAR</th>
                  </tr></thead>
                  <tbody>${pitcherRows}</tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right Sidebar Panel: League race + headlines + Recent Games Feed -->
          <div class="c162-sidebar-panel">
            ${this._leagueSidebarHTML()}
            <div style="font-size:9.5px;color:#38bdf8;margin-bottom:10px;font-family:'Press Start 2P',monospace;display:flex;align-items:center;justify-content:space-between;">
              <span>📜 ${recentGamesTitle}</span>
              <span style="font-size:8px;color:#9ca3af;font-family:'Outfit',sans-serif;">(${S.gameLog.length})</span>
            </div>
            <div class="c162-game-feed">
              ${logRows || `<div style="color:#6b7280;font-size:10px;text-align:center;padding:20px 0;">${noGamesText}</div>`}
            </div>
          </div>
        </div>
      `;

      const btnAuto = document.getElementById('challenge162-play-auto');
      const btn1 = document.getElementById('challenge162-play-1');
      const btn10 = document.getElementById('challenge162-play-10');
      const btnUntil = document.getElementById('challenge162-play-until');
      const btnPlayoffs = document.getElementById('challenge162-goto-playoffs');
      const btnResults = document.getElementById('challenge162-view-results');
      const btnLiga = document.getElementById('btn-challenge162-season-liga');
      // Auto sim re-renders this screen every game, so the button is replaced between
      // mousedown and mouseup and a plain click never lands: toggle on press instead
      // (onclick stays for keyboard activation, which reports detail 0).
      if (btnAuto) {
        btnAuto.onpointerdown = (e) => { if (e.button === 0) { e.preventDefault(); this.toggleAutoSim(); } };
        btnAuto.onclick = (e) => { if (e.detail === 0) this.toggleAutoSim(); };
      }
      if (btn1) btn1.onclick = () => { this.stopAutoSim(); this.simulateGame(); this.renderSeason(); };
      if (btn10) btn10.onclick = () => { this.stopAutoSim(); this.simulateBatch(10); this.renderSeason(); };
      if (btnUntil) btnUntil.onclick = () => { this.stopAutoSim(); this.simulateUntilLossOrEnd(); this.renderSeason(); };
      if (btnPlayoffs) btnPlayoffs.onclick = () => { this.stopAutoSim(); this.showScreen('screen-challenge-playoffs'); this.renderPlayoffs(); };
      if (btnResults) btnResults.onclick = () => { this.stopAutoSim(); this.state.playoffs.finished = true; this.save(); this.showScreen('screen-challenge-results'); this.renderResults(); };
      if (btnLiga) btnLiga.onclick = () => { this.stopAutoSim(); this.renderLiga(); };
      container.querySelectorAll('[data-c162-liga-tab]').forEach(el => {
        el.onclick = () => { this.stopAutoSim(); this._ligaTab = el.dataset.c162LigaTab; this.renderLiga(); };
      });
    },

    // ── League views (standings, power rankings, playoff picture) ─────────
    _ligaTab: 'standings',
    _ligaLeague: null,

    _teamLabel(t) {
      return t.isUser ? `<strong>${t.name}</strong>` : t.name;
    },

    _momentumBadgeHTML() {
      const L = this.state && this.state.league;
      if (!L || this.state.gamesPlayed >= SEASON_LENGTH) return '';
      const streak = L.teams[USER_TEAM_ID].streak || 0;
      const m = momentumFor(streak);
      const next = MOMENTUM_STEP - (Math.abs(streak) % MOMENTUM_STEP);
      const more = next === 1 ? (streak >= 0 ? 'next W' : 'next L') : `${next} more ${streak >= 0 ? 'W' : 'L'}`;
      const hint = Math.abs(m) >= MOMENTUM_CAP ? 'max' : `${more}: ${streak >= 0 ? '+' : '−'}${Math.abs(m) + 1} · a ${streak >= 0 ? 'loss' : 'win'} resets it`;
      const cls = m > 0 ? 'up' : m < 0 ? 'down' : '';
      const label = m > 0 ? `🔥 MOMENTUM +${m}` : m < 0 ? `🧊 MOMENTUM −${-m}` : 'MOMENTUM 0';
      return `<div class="c162-momentum ${cls}" title="Every ${MOMENTUM_STEP} straight wins add +1 to all your ratings and every ${MOMENTUM_STEP} straight losses take 1 away, up to ±${MOMENTUM_CAP}. The streak ending resets it. Applies to every team in the league.">
        ${label}<span>${m === 0 && streak === 0 ? 'every ' + MOMENTUM_STEP + ' straight wins: +1 to all ratings (max +' + MOMENTUM_CAP + ')' : hint}</span>
      </div>`;
    },

    _streakText(t) {
      if (!t.streak) return '—';
      return t.streak > 0 ? `W${t.streak}` : `L${-t.streak}`;
    },

    _leagueSidebarHTML() {
      const S = this.state;
      const L = S && S.league;
      if (!L) return '';
      const lg = L.teams[USER_TEAM_ID].league;
      const table = leagueStandings(L, lg);
      const userRow = table.find(t => t.id === USER_TEAM_ID);
      const shown = table.slice(0, 6);
      if (userRow.rank > 6) shown.push(userRow);
      const rows = shown.map(t => `
        <div class="c162-mini-row ${t.isUser ? 'is-user' : ''} ${t.rank === PLAYOFF_SEEDS ? 'cutline' : ''}">
          <span class="c162-mini-rank">${t.rank}</span>
          <span class="c162-mini-name">${t.name}</span>
          <span class="c162-mini-rec">${t.w}-${t.l}</span>
          <span class="c162-mini-gb">${t.gb === 0 ? '—' : t.gb}</span>
        </div>`).join('');
      const heads = (L.headlines || []).slice(0, 5).map(h => `
        <div class="c162-headline kind-${h.kind}"><span class="c162-headline-day">D${h.day}</span> ${h.text}</div>`).join('');
      return `
        <div class="c162-mini-standings">
          <div class="c162-mini-title">
            <span>🏟️ ${lg} RACE</span>
            <button class="c162-link-btn" data-c162-liga-tab="standings">FULL TABLE ▸</button>
          </div>
          <div class="c162-mini-head"><span>#</span><span>TEAM</span><span>W-L</span><span>GB</span></div>
          ${rows}
          <div class="c162-mini-note">Top ${PLAYOFF_SEEDS} of each league make the playoffs</div>
        </div>
        ${heads ? `<div class="c162-headlines">
          <div class="c162-mini-title"><span>📰 AROUND THE LEAGUE</span></div>
          ${heads}
        </div>` : ''}`;
    },

    _standingsTableHTML(lg) {
      const L = this.state.league;
      const rows = leagueStandings(L, lg).map(t => {
        const l10 = t.last10.length ? `${t.last10.filter(Boolean).length}-${t.last10.length - t.last10.filter(Boolean).length}` : '—';
        const pct = (t.w + t.l) ? t.pct.toFixed(3).replace(/^0/, '') : '.000';
        return `<tr class="c162-tr ${t.isUser ? 'c162-row-user' : ''} ${t.rank === PLAYOFF_SEEDS ? 'c162-row-cutline' : ''}">
          <td class="c162-td c162-td-num">${t.rank}</td>
          <td class="c162-td">${this._teamLabel(t)}</td>
          <td class="c162-td c162-td-num">${t.w}</td>
          <td class="c162-td c162-td-num">${t.l}</td>
          <td class="c162-td c162-td-num">${pct}</td>
          <td class="c162-td c162-td-num">${t.gb === 0 ? '—' : t.gb}</td>
          <td class="c162-td c162-td-num">${l10}</td>
          <td class="c162-td c162-td-num ${t.streak > 0 ? 'c162-pos' : t.streak < 0 ? 'c162-neg' : ''}">${this._streakText(t)}</td>
          <td class="c162-td c162-td-num">${t.strength}</td>
        </tr>`;
      }).join('');
      return `
        <div class="c162-table-wrap">
          <table class="c162-table c162-standings" style="width:100%;">
            <thead><tr>
              <th class="c162-th">#</th><th class="c162-th">${lg} TEAM</th><th class="c162-th">W</th><th class="c162-th">L</th>
              <th class="c162-th">PCT</th><th class="c162-th">GB</th><th class="c162-th">L10</th><th class="c162-th">STRK</th><th class="c162-th">STR</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    },

    _powerRankingsHTML() {
      const L = this.state.league;
      const snaps = L.powerRanks || [];
      const latest = snaps.length ? snaps[snaps.length - 1].order : powerOrder(L);
      const prev = snaps.length > 1 ? snaps[snaps.length - 2].order : null;
      const rows = latest.map((id, i) => {
        const t = L.teams[id];
        const before = prev ? prev.indexOf(id) : -1;
        const move = before < 0 ? 0 : before - i;
        const moveHTML = move > 0 ? `<span class="c162-move up">▲${move}</span>` : move < 0 ? `<span class="c162-move down">▼${-move}</span>` : `<span class="c162-move">—</span>`;
        return `<div class="c162-pr-row ${t.isUser ? 'is-user' : ''}">
          <span class="c162-pr-rank">${i + 1}</span>
          ${moveHTML}
          <span class="c162-pr-lg lg-${t.league}">${t.league}</span>
          <span class="c162-pr-name">${t.name}</span>
          <span class="c162-pr-rec">${t.w}-${t.l}</span>
          <span class="c162-pr-str">STR ${t.strength}</span>
        </div>`;
      }).join('');
      const asOf = snaps.length ? snaps[snaps.length - 1].day : 0;
      return `<div class="c162-pr-note">${asOf === 0 ? 'Preseason rankings, by roster strength.' : `Week of day ${asOf}: results weigh more as the season goes on.`}</div>
        <div class="c162-pr-list">${rows}</div>`;
    },

    _playoffPictureHTML() {
      const S = this.state;
      const L = S.league;
      const b = S.playoffs && S.playoffs.bracket;
      const nameOf = id => (id ? L.teams[id].name : 'TBD');
      const matchHTML = m => {
        const cls = id => `${m.winner === id ? 'won' : ''} ${m.winner && m.winner !== id ? 'lost' : ''} ${id === USER_TEAM_ID ? 'is-user' : ''}`;
        return `<div class="c162-bk-match">
          <div class="c162-bk-team ${cls(m.a)}">${nameOf(m.a)}</div>
          <div class="c162-bk-team ${cls(m.b)}">${nameOf(m.b)}</div>
        </div>`;
      };
      if (b) {
        const col = (title, matches) => `<div class="c162-bk-col"><div class="c162-bk-title">${title}</div>${(matches || []).length ? matches.map(matchHTML).join('') : '<div class="c162-bk-empty">TBD</div>'}</div>`;
        return `<div class="c162-bracket">
          ${col('AL ROUND 1', b.rounds[0].filter(m => m.league === 'AL'))}
          ${col('AL FINAL', b.rounds[1].filter(m => m.league === 'AL'))}
          ${col('WORLD SERIES', b.rounds[2])}
          ${col('NL FINAL', b.rounds[1].filter(m => m.league === 'NL'))}
          ${col('NL ROUND 1', b.rounds[0].filter(m => m.league === 'NL'))}
        </div>
        ${b.champion ? `<div class="c162-bk-champ">🏆 ${nameOf(b.champion)} — World Series champions</div>` : ''}`;
      }
      const picture = lg => leagueStandings(L, lg).slice(0, PLAYOFF_SEEDS + 2).map(t => `
        <div class="c162-mini-row ${t.isUser ? 'is-user' : ''} ${t.rank === PLAYOFF_SEEDS ? 'cutline' : ''} ${t.rank > PLAYOFF_SEEDS ? 'hunt' : ''}">
          <span class="c162-mini-rank">${t.rank <= PLAYOFF_SEEDS ? '#' + t.rank : '·'}</span>
          <span class="c162-mini-name">${t.name}</span>
          <span class="c162-mini-rec">${t.w}-${t.l}</span>
          <span class="c162-mini-gb">${t.gb === 0 ? '—' : t.gb}</span>
        </div>`).join('');
      return `<div class="c162-pr-note">If the season ended today: seeds 1-4 qualify, 1 plays 4 and 2 plays 3.</div>
        <div class="c162-picture">
          <div class="c162-mini-standings"><div class="c162-mini-title"><span>AL</span></div>${picture('AL')}</div>
          <div class="c162-mini-standings"><div class="c162-mini-title"><span>NL</span></div>${picture('NL')}</div>
        </div>`;
    },

    // ── Leaders & award races (global) ──────────────────────────────────────
    _teamChip(id) {
      const L = this.state.league;
      if (id === USER_TEAM_ID) return '<span class="c162-team-chip is-user">YOU</span>';
      const t = L.teams[id];
      return `<span class="c162-team-chip lg-${t ? t.league : ''}" title="${t ? t.name : id}">${t ? t.code : id}</span>`;
    },

    _leaderRows(list, fmt) {
      if (!list.length) return '<div class="c162-bk-empty">Not enough games yet</div>';
      return list.map((o, i) => `
        <div class="c162-ldr-row ${o.x.team === USER_TEAM_ID ? 'is-user' : ''}">
          <span class="c162-ldr-rank">${i + 1}</span>
          <span class="c162-ldr-name">${o.x.name}</span>
          ${this._teamChip(o.x.team)}
          <span class="c162-ldr-val">${fmt(o.v, o.x)}</span>
        </div>`).join('');
    },

    _leaderBox(title, list, fmt) {
      return `<div class="c162-ldr-box"><div class="c162-ldr-title">${title}</div>${this._leaderRows(list, fmt)}</div>`;
    },

    _leadersHTML() {
      const L = this.state.league;
      if (!L.stats) return '<div class="c162-pr-note">League stats start with the next game.</div>';
      const q = leagueQualifiers(L);
      const avg3 = v => v.toFixed(3).replace(/^0/, '');
      const ip = p => (p.outs / 3).toFixed(1);
      return `
        <div class="c162-pr-note">All 32 teams · day ${L.day}. Rate stats need ${Math.ceil(3.1 * q.day)} PA or ${Math.ceil(0.8 * q.day)} IP to qualify.</div>
        <div class="c162-meet-section">BATTING</div>
        <div class="c162-ldr-grid">
          ${this._leaderBox('AVG', rankBy(q.batQual, batterAVG, 5), avg3)}
          ${this._leaderBox('HOME RUNS', rankBy(q.bat, b => b.hr, 5), v => v)}
          ${this._leaderBox('RBI', rankBy(q.bat, b => b.rbi, 5), v => v)}
          ${this._leaderBox('OPS', rankBy(q.batQual, batterOPS, 5), avg3)}
          ${this._leaderBox('STOLEN BASES', rankBy(q.bat, b => b.sb, 5), v => v)}
          ${this._leaderBox('HITS', rankBy(q.bat, b => b.h, 5), v => v)}
        </div>
        <div class="c162-meet-section">PITCHING</div>
        <div class="c162-ldr-grid">
          ${this._leaderBox('WINS', rankBy(q.pit, p => p.w, 5), v => v)}
          ${this._leaderBox('ERA', rankBy(q.spQual, p => -pitcherERA(p), 5), v => (-v).toFixed(2))}
          ${this._leaderBox('STRIKEOUTS', rankBy(q.pit, p => p.so, 5), v => v)}
          ${this._leaderBox('SAVES', rankBy(q.pit, p => p.sv, 5), v => v)}
          ${this._leaderBox('INNINGS', rankBy(q.pit, p => p.outs, 5), (v, x) => ip(x))}
          ${this._leaderBox('WHIP', rankBy(q.spQual, p => -((p.h + p.bb) * 3 / Math.max(1, p.outs)), 5), v => (-v).toFixed(2))}
        </div>`;
    },

    _awardsHTML() {
      const S = this.state;
      const L = S.league;
      if (!L.stats) return '<div class="c162-pr-note">Award races start with the next game.</div>';
      const final = S.gamesPlayed >= SEASON_LENGTH && S.awards;
      const aw = computeAwards(L);
      const warFmt = v => `${v.toFixed(1)} WAR`;
      const race = (title, list, fmt) => `<div class="c162-ldr-box c162-award-box"><div class="c162-ldr-title">${title}${final ? ' · FINAL' : ''}</div>${this._leaderRows(list, fmt)}</div>`;
      const posTable = (title, byPos, fmt) => `
        <div class="c162-ldr-box c162-pos-box">
          <div class="c162-ldr-title">${title}</div>
          ${Object.entries(byPos).map(([pos, list]) => {
            const lead = list[0];
            return `<div class="c162-ldr-row ${lead && lead.x.team === USER_TEAM_ID ? 'is-user' : ''}">
              <span class="c162-ldr-rank">${pos}</span>
              <span class="c162-ldr-name">${lead ? lead.x.name : '—'}</span>
              ${lead ? this._teamChip(lead.x.team) : '<span></span>'}
              <span class="c162-ldr-val">${lead ? fmt(lead.v) : ''}</span>
            </div>`;
          }).join('')}
        </div>`;
      const avg3 = v => v.toFixed(3).replace(/^0/, '');
      return `
        <div class="c162-pr-note">${final ? 'Final results of the regular season.' : 'Live races across all 32 teams. Winners are decided when the regular season ends.'}</div>
        <div class="c162-ldr-grid">
          ${race('🏅 MVP', aw.mvp, warFmt)}
          ${race('🧢 CY YOUNG', aw.cyYoung, warFmt)}
          ${race('🔥 RELIEVER OF THE YEAR', aw.reliever, warFmt)}
          ${race('💎 PLATINUM GLOVE', aw.platinum, v => `${v >= 0 ? '+' : ''}${v.toFixed(1)} dWAR`)}
          ${race('💣 HOME RUN KING', aw.hrKing, v => `${v} HR`)}
          ${race('🎯 BATTING TITLE', aw.battingTitle, avg3)}
        </div>
        <div class="c162-meet-section">BY POSITION</div>
        <div class="c162-ldr-grid c162-ldr-grid-2">
          ${posTable('🥈 SILVER SLUGGER · BEST OPS', aw.silverSlugger, v => `${avg3(v)} OPS`)}
          ${posTable('🧤 GOLD GLOVE · BEST dWAR', aw.goldGlove, v => `${v >= 0 ? '+' : ''}${v.toFixed(1)} dWAR`)}
        </div>`;
    },

    _resultsAwardsHTML() {
      const S = this.state;
      const L = S.league;
      if (!L || !S.awards) return '';
      const nameOf = x => x ? `${x.name} <small>${x.team === USER_TEAM_ID ? '(YOU)' : '(' + (L.teams[x.team] ? L.teams[x.team].name : x.team) + ')'}</small>` : '—';
      const all = [S.awards.mvp, S.awards.cyYoung, S.awards.reliever, S.awards.platinum, S.awards.hrKing, S.awards.battingTitle,
        ...Object.values(S.awards.silverSlugger || {}), ...Object.values(S.awards.goldGlove || {})];
      const mine = all.filter(x => x && x.team === USER_TEAM_ID).length;
      const cell = (label, x) => `<div class="c162-res-award ${x && x.team === USER_TEAM_ID ? 'is-user' : ''}"><span>${label}</span><b>${nameOf(x)}</b></div>`;
      return `
        <details class="c162-results-bracket" open>
          <summary>🏅 SEASON AWARDS · YOUR PLAYERS WON ${mine}</summary>
          <div class="c162-res-awards">
            ${cell('MVP', S.awards.mvp)}${cell('CY YOUNG', S.awards.cyYoung)}${cell('RELIEVER OF THE YEAR', S.awards.reliever)}
            ${cell('PLATINUM GLOVE', S.awards.platinum)}${cell('HOME RUN KING', S.awards.hrKing)}${cell('BATTING TITLE', S.awards.battingTitle)}
          </div>
          <div class="c162-res-awards c162-res-awards-pos">
            ${Object.entries(S.awards.silverSlugger || {}).map(([p, x]) => cell(`SILVER SLUGGER ${p}`, x)).join('')}
            ${Object.entries(S.awards.goldGlove || {}).map(([p, x]) => cell(`GOLD GLOVE ${p}`, x)).join('')}
          </div>
        </details>`;
    },

    // Season wrap-up for the results screen: final standing, how the postseason went, the bracket.
    _resultsLeagueHTML() {
      const S = this.state;
      const L = S && S.league;
      if (!L) return '';
      const lg = L.teams[USER_TEAM_ID].league;
      const rank = leagueStandings(L, lg).findIndex(t => t.id === USER_TEAM_ID) + 1;
      const b = S.playoffs.bracket;
      let story;
      if (S.playoffs.missed) story = `Finished #${rank} in the ${lg} · missed the postseason`;
      else if (S.playoffs.won) story = `${lg} #${S.playoffs.userSeed} seed · World Series champions`;
      else {
        const roundNames = ['in the first round', 'in the league final', 'in the World Series'];
        story = `${lg} #${S.playoffs.userSeed} seed · eliminated ${roundNames[S.playoffs.round] || ''}`;
      }
      return `
        <div class="c162-results-league">
          <div class="c162-results-story">${story}</div>
          ${b ? `<details class="c162-results-bracket" ${b.champion && b.champion !== USER_TEAM_ID ? 'open' : ''}>
            <summary>🏆 POSTSEASON BRACKET</summary>
            ${this._playoffPictureHTML()}
          </details>` : ''}
          ${this._resultsAwardsHTML()}
        </div>`;
    },

    renderLiga() {
      if (!this.state) return;
      this.showScreen('screen-challenge-liga');
      const container = document.getElementById('challenge162-liga-container');
      if (!container) return;
      const S = this.state;
      if (!S.league) { this._renderLigaStats(container); return; }
      const L = S.league;
      const tab = this._ligaTab || 'standings';
      const userLg = L.teams[USER_TEAM_ID].league;
      const lgView = this._ligaLeague || userLg;
      const tabs = [['standings', '🏟️ STANDINGS'], ['power', '📈 POWER RANKINGS'], ['playoffs', '🏆 PLAYOFF PICTURE'], ['leaders', '📊 LEADERS'], ['awards', '🏅 AWARD RACES']];
      container.innerHTML = `
        <div class="c162-liga-header">
          <div class="c162-liga-title">⚾ THE LEAGUE · DAY ${L.day} / ${SEASON_LENGTH}</div>
          <button id="btn-challenge162-liga-back" class="btn btn-secondary" style="padding:6px 12px; font-size:10px;">← SEASON</button>
        </div>
        <div class="c162-tabs">
          ${tabs.map(([k, label]) => `<button class="c162-tab ${tab === k ? 'active' : ''}" data-tab="${k}">${label}</button>`).join('')}
        </div>
        <div id="c162-liga-body"></div>`;
      const body = container.querySelector('#c162-liga-body');
      if (tab === 'standings') {
        body.innerHTML = `
          <div class="c162-tabs c162-subtabs">
            ${['AL', 'NL'].map(lg => `<button class="c162-tab ${lgView === lg ? 'active' : ''}" data-lg="${lg}">${lg === 'AL' ? 'AMERICAN LEAGUE' : 'NATIONAL LEAGUE'}${lg === userLg ? ' ★' : ''}</button>`).join('')}
          </div>
          ${this._standingsTableHTML(lgView)}
          <div class="c162-pr-note">The line under #${PLAYOFF_SEEDS} marks the playoff cut. STR = roster strength.</div>`;
      } else if (tab === 'power') {
        body.innerHTML = this._powerRankingsHTML();
      } else if (tab === 'playoffs') {
        body.innerHTML = this._playoffPictureHTML();
      } else if (tab === 'leaders') {
        body.innerHTML = this._leadersHTML();
      } else if (tab === 'awards') {
        body.innerHTML = this._awardsHTML();
      } else {
        this._renderLigaStats(body, true);
      }
      container.querySelectorAll('.c162-tab[data-tab]').forEach(btn => {
        btn.onclick = () => { this._ligaTab = btn.dataset.tab; this.renderLiga(); };
      });
      container.querySelectorAll('.c162-tab[data-lg]').forEach(btn => {
        btn.onclick = () => { this._ligaLeague = btn.dataset.lg; this.renderLiga(); };
      });
      const backBtn = document.getElementById('btn-challenge162-liga-back');
      if (backBtn) backBtn.onclick = () => {
        this.showScreen('screen-challenge-season');
        this.renderSeason();
      };
    },

    _renderLigaStats(container, embedded = false) {
      const S = this.state;
      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      const oppStats = S.oppBatterStats || {};
      const rows = Object.values(oppStats)
        .filter(s => s.ab >= 1)
        .sort((a, b) => (b.ab - a.ab))
        .map((s, i) => {
          const avg = s.ab > 0 ? (s.h / s.ab).toFixed(3).replace(/^0/, '') : '.000';
          const obp = (s.ab + s.bb) > 0 ? ((s.h + s.bb) / (s.ab + s.bb)).toFixed(3).replace(/^0/, '') : '.000';
          const altRow = i % 2 ? ' c162-tr-alt' : '';
          return `<tr class="c162-tr${altRow}">
            <td class="c162-td">${s.name}</td>
            <td class="c162-td">${s.team || '—'}</td>
            <td class="c162-td c162-td-num">${s.ab}</td>
            <td class="c162-td c162-td-num">${s.h}</td>
            <td class="c162-td c162-td-num">${s.doubles || 0}</td>
            <td class="c162-td c162-td-num">${s.triples || 0}</td>
            <td class="c162-td c162-td-num" style="color:var(--challenge162-accent);">${s.hr || 0}</td>
            <td class="c162-td c162-td-num">${s.rbi || 0}</td>
            <td class="c162-td c162-td-num">${s.bb || 0}</td>
            <td class="c162-td c162-td-num">${s.so || 0}</td>
            <td class="c162-td c162-td-num">${s.r || 0}</td>
            <td class="c162-td c162-td-num" style="color:var(--challenge162-accent);font-weight:bold;">${avg}</td>
            <td class="c162-td c162-td-num">${obp}</td>
          </tr>`;
        }).join('');

      const gamesPlayed = S.gamesPlayed || 0;
      let totalH = 0, totalAB = 0, totalHR = 0, totalSO = 0, totalBB = 0;
      Object.values(oppStats).forEach(s => {
        totalH += s.h || 0;
        totalAB += s.ab || 0;
        totalHR += s.hr || 0;
        totalSO += s.so || 0;
        totalBB += s.bb || 0;
      });
      const leagueAvg = totalAB > 0 ? (totalH / totalAB).toFixed(3).replace(/^0/, '') : '.000';
      const numAvg = parseFloat(totalAB > 0 ? (totalH / totalAB) : 0);

      container.innerHTML = `
        ${embedded ? '' : `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <div style="font-family: 'Press Start 2P', monospace; font-size: 13px; color: var(--challenge162-accent);">📊 OPPONENT LEAGUE STATS</div>
          <button id="btn-challenge162-liga-back" class="btn btn-secondary" style="padding:6px 12px; font-size:10px;">← SEASON</button>
        </div>`}
        <div style="display:flex; gap:14px; margin-bottom:20px; flex-wrap:wrap;">
          <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 18px; text-align:center;">
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#94a3af; margin-bottom:6px;">GAMES</div>
            <div style="font-family:'Press Start 2P',monospace; font-size:16px; color:#ffd700;">${gamesPlayed}</div>
          </div>
          <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 18px; text-align:center;">
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#94a3af; margin-bottom:6px;">OPPONENT TEAM AVG</div>
            <div style="font-family:'Press Start 2P',monospace; font-size:16px; color:${numAvg < 0.220 ? '#38bdf8' : numAvg > 0.275 ? '#ef4444' : '#00ff66'};">${leagueAvg}</div>
          </div>
          <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 18px; text-align:center;">
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#94a3af; margin-bottom:6px;">TOTAL H / AB</div>
            <div style="font-size:12px; color:#e2e8f0; font-weight:bold; margin-top:2px;">${totalH} / ${totalAB}</div>
          </div>
          <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 18px; text-align:center;">
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#94a3af; margin-bottom:6px;">HR / SO / BB</div>
            <div style="font-size:12px; color:#e2e8f0; font-weight:bold; margin-top:2px;">${totalHR} HR · ${totalSO} K · ${totalBB} BB</div>
          </div>
        </div>
        ${rows ? `
          <div class="c162-table-wrap" style="max-height:68vh; overflow-y:auto;">
            <table class="c162-table" style="width:100%;">
              <thead>
                <tr>
                  <th class="c162-th">OPPONENT BATTER</th>
                  <th class="c162-th">TEAM</th>
                  <th class="c162-th">AB</th>
                  <th class="c162-th">H</th>
                  <th class="c162-th">2B</th>
                  <th class="c162-th">3B</th>
                  <th class="c162-th" style="color:var(--challenge162-accent);">HR</th>
                  <th class="c162-th">RBI</th>
                  <th class="c162-th">BB</th>
                  <th class="c162-th">SO</th>
                  <th class="c162-th">R</th>
                  <th class="c162-th" style="color:var(--challenge162-accent);">AVG</th>
                  <th class="c162-th">OBP</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        ` : `<div style="text-align:center; color:#94a3af; padding:40px; font-family:'Press Start 2P',monospace; font-size:10px;">Simulate games to view accumulated opponent stats.</div>`}
      `;

      const backBtn = document.getElementById('btn-challenge162-liga-back');
      if (backBtn) backBtn.onclick = () => {
        this.showScreen('screen-challenge-season');
        this.renderSeason();
      };
    },

    renderPlayoffs() {
      this.stopAutoSim();
      const container = document.getElementById('challenge162-playoffs-container');
      if (!container || !this.state) return;
      const S = this.state;
      const round = S.playoffs.round;
      const cfg = PLAYOFF_ROUNDS[round];
      if (!cfg) return;

      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      const getRoundTitle = (rIdx) => {
        if (rIdx === 0) return _t('challenge162.round_1_title', 'DIVISION SERIES');
        if (rIdx === 1) return _t('challenge162.round_2_title', 'CHAMPIONSHIP SERIES');
        return _t('challenge162.round_3_title', '🏆 WORLD SERIES [FINAL BOSS]');
      };
      const getRoundDesc = (rIdx) => {
        if (rIdx === 0) return _t('challenge162.round_1_desc', 'Round 1: Face the 3rd best team');
        if (rIdx === 1) return _t('challenge162.round_2_desc', 'Round 2: Face the 2nd best team');
        return _t('challenge162.round_3_desc', 'Final Boss: The #1 undefeated league rival');
      };

      const oppFranchise = generatePlayoffEnemyTeam(round, S.leagueTeams, this._playoffOpponentRef(round));
      const oppSP = (oppFranchise.pitchers && oppFranchise.pitchers[0]) || { cleanName: 'Rival Ace', name: 'Rival Ace', ovr: 85 };
      const oppReliever = oppFranchise.reliever || { name: 'Rival Setup', ovr: 85 };
      const oppCloser = oppFranchise.closer || { name: 'Rival Closer', ovr: 88 };
      const oppBatters = (oppFranchise._batters || oppFranchise.lineup || []).slice(0, 9);

      // User Staff & Lineup
      const topSP = (S.roster.pitchers.SP && S.roster.pitchers.SP[0]) || null;
      const topSPStats = topSP ? S.pitcherStats[pitcherUnlockKey(topSP)] : null;
      const spEra = topSPStats && topSPStats.outs > 0 ? ((topSPStats.er * 27) / topSPStats.outs).toFixed(2) : '3.00';
      const topSpOvrDisplay = topSP ? Math.floor(topSP.ovr || 85) : 85;

      const userCloser = (S.roster.pitchers.RP && S.roster.pitchers.RP[0]) || { name: 'Closer', ovr: 80 };
      const userSetup = (S.roster.pitchers.RP && S.roster.pitchers.RP[1]) || { name: 'Setup', ovr: 80 };
      const userBatters = S.roster.battingOrder.map(slot => S.roster.lineup[slot]).filter(Boolean);

      // 3-step bracket stepper
      const stepperHTML = PLAYOFF_ROUNDS.map((r, idx) => {
        let badgeClass = 'c162-step-locked', badgeText = _t('challenge162.step_locked', '🔒 LOCKED');
        if (idx < round) { badgeClass = 'c162-step-done'; badgeText = _t('challenge162.step_done', '✔ CLEARED'); }
        else if (idx === round) { badgeClass = 'c162-step-active'; badgeText = _t('challenge162.step_active', '⚔ ACTIVE'); }
        const rTitle = _t('challenge162.bracket_round', `ROUND ${r.round}`, { round: r.round });
        const roundCardLabel = getRoundTitle(idx);
        return `
          <div class="c162-step-card ${badgeClass}">
            <div style="font-size:9px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${rTitle}</div>
            <div style="font-size:11.5px;font-weight:bold;color:#f3f4f6;margin:4px 0;line-height:1.3;">${roundCardLabel}</div>
            <div><span class="c162-step-badge">${badgeText}</span></div>
          </div>
        `;
      }).join('');

      const curRoundTitle = getRoundTitle(round);
      const curRoundDesc = getRoundDesc(round);

      const playoffsTitle = _t('challenge162.playoffs_title', 'BASEROGUE POSTSEASON');
      const playoffsSubtitle = _t('challenge162.playoffs_subtitle', `3 Single-Elimination Rounds (Sudden Death) · ${curRoundDesc}`, { desc: curRoundDesc });
      const yourTeamName = this.getUserTeamName();
      const yourTeamLabel = `${yourTeamName} (${S.wins}-${S.losses})`;
      const acePitcherLabel = _t('challenge162.ace_pitcher', 'Ace Pitcher');
      const closerLabel = _t('challenge162.closer_pitcher', 'Closer');
      const setupLabel = _t('challenge162.setup_pitcher', 'Setup');
      const battingLineupLabel = _t('challenge162.batting_lineup', 'Starting Lineup');
      const playMatchBtnText = _t('challenge162.play_playoff_btn', `🎲 PLAY ${curRoundTitle}! (DO OR DIE MATCH)`, { label: curRoundTitle });
      const viewStatsBtnText = _t('challenge162.view_stats_table', '📊 VIEW STATS TABLE');

      const renderLineupRows = (batters) => (batters || []).slice(0, 9).map((b, idx) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 6px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:10.5px;">
          <span style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#9ca3af;width:18px;">${idx + 1}.</span>
          <span style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#38bdf8;width:28px;">${b.assignedSlot || b.pos || 'DH'}</span>
          <span style="flex:1;color:#f3f4f6;font-weight:600;padding:0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.name}</span>
          <span style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#ffd700;">${Math.floor(b.ovr || 80)}</span>
        </div>
      `).join('');

      container.innerHTML = `
        <!-- Header -->
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:36px;margin-bottom:4px;filter:drop-shadow(0 0 14px #ffd700);animation:bounce 2.5s infinite;">🏆</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:16px;color:#ffd700;letter-spacing:1px;text-shadow:0 0 20px rgba(255,215,0,0.8);margin-bottom:6px;">
            ${playoffsTitle}
          </div>
          <div style="font-size:12px;color:#cbd5e1;font-weight:500;">
            ${playoffsSubtitle}
          </div>
        </div>

        <!-- Bracket Stepper -->
        <div class="c162-bracket-stepper">
          ${stepperHTML}
        </div>

        <!-- Tale of the Tape (Cara a Cara) -->
        <div class="c162-tale-container">
          
          <!-- Your Team Card -->
          <div class="c162-team-box player-side">
            <div>
              <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:#34d399;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>⚾</span> <span>${yourTeamLabel}</span>
              </div>
              <div style="font-size:12px;color:#f3f4f6;font-weight:bold;margin-bottom:8px;text-align:center;">
                ${acePitcherLabel}: <span style="color:#ffd700;">${topSP ? topSP.name : 'SP'}</span> <span style="font-size:9px;color:#38bdf8;background:rgba(56,189,248,0.15);padding:2px 5px;border-radius:4px;font-family:'Press Start 2P',monospace;">OVR ${topSpOvrDisplay} · ERA ${spEra}</span>
              </div>
              <div style="font-size:10.5px;color:#9ca3af;text-align:center;margin-bottom:10px;">
                ${closerLabel}: <span style="color:#fbbf24;font-weight:bold;">${userCloser.name}</span> · ${setupLabel}: <span style="color:#a78bfa;font-weight:bold;">${userSetup.name}</span>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:8.5px;font-family:'Press Start 2P',monospace;color:#34d399;margin-bottom:4px;text-align:center;">
                ${battingLineupLabel}
              </div>
              ${renderLineupRows(userBatters)}
            </div>
          </div>

          <!-- VS Badge -->
          <div class="c162-vs-emblem">
            <div class="c162-vs-badge">VS</div>
            <div style="font-size:22px;">⚔️</div>
          </div>

          <!-- Enemy Team Card -->
          <div class="c162-team-box ${round === 2 ? 'boss-side' : 'boss-side-regular'}">
            <div>
              <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:${round === 2 ? '#f87171' : '#38bdf8'};margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>👑</span> <span>${oppFranchise.name}</span>
              </div>
              <div style="font-size:12px;color:#f3f4f6;font-weight:bold;margin-bottom:8px;text-align:center;">
                ${acePitcherLabel}: <span style="color:#ffd700;">${oppSP.cleanName || oppSP.name}</span> <span style="font-size:9px;color:${round === 2 ? '#f87171' : '#38bdf8'};background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;font-family:'Press Start 2P',monospace;">OVR ${Math.floor(oppSP.ovr || 85)}</span>
              </div>
              <div style="font-size:10.5px;color:#9ca3af;text-align:center;margin-bottom:10px;">
                ${closerLabel}: <span style="color:#fbbf24;font-weight:bold;">${oppCloser.name}</span> · ${setupLabel}: <span style="color:#a78bfa;font-weight:bold;">${oppReliever.name}</span>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:8.5px;font-family:'Press Start 2P',monospace;color:${round === 2 ? '#f87171' : '#38bdf8'};margin-bottom:4px;text-align:center;">
                ${battingLineupLabel}
              </div>
              ${renderLineupRows(oppBatters)}
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap;">
          <button id="challenge162-play-playoff-match" class="btn" style="padding:14px 28px;font-size:11px;font-family:'Press Start 2P',monospace;background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;border:2px solid #fff;box-shadow:0 0 24px rgba(255,215,0,0.6);cursor:pointer;transition:transform 0.15s ease;">
            ${playMatchBtnText}
          </button>
          ${(S.playoffs && S.playoffs.boxScores && S.playoffs.boxScores.length > 0) ? `
            <button id="challenge162-playoff-view-boxscores-btn" class="btn btn-secondary" style="padding:14px 22px;font-size:11px;font-family:'Press Start 2P',monospace;color:#38bdf8;border-color:rgba(56,189,248,0.4);">
              ${_t('challenge162.playoff_view_boxscores', '📜 Box Scores Log')}
            </button>
          ` : ''}
          <button id="challenge162-playoff-back-season" class="btn btn-secondary" style="padding:14px 22px;font-size:11px;font-family:'Press Start 2P',monospace;">
            ${viewStatsBtnText}
          </button>
        </div>
      `;

      const btn = document.getElementById('challenge162-play-playoff-match');
      if (btn) btn.onclick = () => this.startPlayoffRound();
      const btnViewBS = document.getElementById('challenge162-playoff-view-boxscores-btn');
      if (btnViewBS) btnViewBS.onclick = () => this.showPlayoffBoxScoreModal(0);
      const backBtn = document.getElementById('challenge162-playoff-back-season');
      if (backBtn) backBtn.onclick = () => { this.showScreen('screen-challenge-season'); this.renderSeason(); };
    },

    renderResults() {
      this.stopAutoSim();
      const container = document.getElementById('challenge162-results-container');
      if (!container || !this.state) return;
      const S = this.state;
      const wonWS = S.playoffs && S.playoffs.won;
      const isPerfect = S.losses === 0;
      container.dataset.champion = wonWS ? '1' : '0'; // hook for juice.js confetti

      if (wonWS && window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('win');
      }

      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      // Map slot positions and DEF for batters:
      const batterSlotMap = {};
      SLOTS.forEach(slot => {
        const p = S.roster.lineup[slot];
        if (p) {
          batterSlotMap[batterUnlockKey(p)] = { pos: slot, def: p.def !== undefined ? p.def : (p.defense_val !== undefined ? p.defense_val : 50) };
        }
      });

      // Calculate Dynasty Awards with real WAR:
      let mvp = null, mvpWAR = -999;
      let hrKing = null, maxHR = -1;
      let battingChamp = null, bestAVG = -1;

      Object.entries(S.batterStats || {}).forEach(([k, b]) => {
        const info = batterSlotMap[k] || { pos: 'DH', def: 50 };
        const warVal = parseFloat(calcBatterWAR(b, info.pos, info.def)) || 0;
        b._war = warVal;

        if (warVal > mvpWAR) { mvpWAR = warVal; mvp = b; }
        if (b.hr > maxHR) { maxHR = b.hr; hrKing = b; }
        if (b.ab >= 100) {
          const avg = b.h / b.ab;
          if (avg > bestAVG) { bestAVG = avg; battingChamp = b; }
        }
      });

      let cyYoung = null, cyWAR = -999;
      let topReliever = null, bestRelieverScore = -999;

      // Identify SP keys vs RP keys:
      const rpKeys = new Set((S.roster.pitchers.RP || []).map(pitcherUnlockKey));
      const spKeys = new Set((S.roster.pitchers.SP || []).map(pitcherUnlockKey));

      Object.entries(S.pitcherStats || {}).forEach(([k, p]) => {
        const isRP = rpKeys.has(k) || p.role === 'RP' || p.role === 'CL';
        const isSP = spKeys.has(k) || (!isRP && p.outs >= 300);
        const warVal = parseFloat(calcPitcherWAR(p, isSP ? 'SP' : 'RP')) || 0;
        p._war = warVal;

        if (isRP) {
          const score = (p.sv * 2.5) + (warVal * 2) + (p.so * 0.05);
          if (score > bestRelieverScore) { bestRelieverScore = score; topReliever = p; }
        }
        if (isSP) {
          if (warVal > cyWAR) { cyWAR = warVal; cyYoung = p; }
        }
      });

      // Format stat lines
      const mvpLine = mvp ? `${mvp.name} · .${bestAVG > 0 ? (mvp.h / Math.max(1, mvp.ab)).toFixed(3).replace(/^0\./, '') : '000'} AVG / ${mvp.hr} HR / ${mvp.rbi} RBI (${mvpWAR.toFixed(1)} WAR)` : 'N/A';
      const cyEra = cyYoung && cyYoung.outs > 0 ? ((cyYoung.er * 27) / cyYoung.outs).toFixed(2) : '0.00';
      const cyLine = cyYoung ? `${cyYoung.name} · ${cyYoung.w}-${cyYoung.l}, ${cyEra} ERA, ${cyYoung.so} K (${cyWAR.toFixed(1)} WAR)` : 'N/A';
      const hrLine = hrKing ? `${hrKing.name} · ${hrKing.hr} HR (${hrKing.rbi} RBI)` : 'N/A';
      const rpEra = topReliever && topReliever.outs > 0 ? ((topReliever.er * 27) / topReliever.outs).toFixed(2) : '0.00';
      const rpLine = topReliever ? `${topReliever.name} · ${topReliever.sv} SV, ${rpEra} ERA (${(topReliever._war || 0).toFixed(1)} WAR)` : 'N/A';

      // Ring of Champions: 9 Lineup cards in Row 1 + 8 Pitchers cards in Row 2
      const lineupCards = [];
      SLOTS.forEach(slot => {
        const p = S.roster.lineup[slot];
        if (p) lineupCards.push({ player: p, label: slot });
      });

      const pitcherCards = [];
      (S.roster.pitchers.SP || []).forEach((p, i) => {
        if (p) pitcherCards.push({ player: p, label: `SP${i + 1}` });
      });
      (S.roster.pitchers.RP || []).forEach((p, i) => {
        if (p) {
          const isHobbyOr25 = (S.roster.pitchers.RP || []).length > 3;
          let label = `RP${i + 1}`;
          if (isHobbyOr25) {
            label = i === 0 ? 'CL' : (i === 1 ? 'SU' : `RP${i - 1}`);
          } else {
            label = i === 2 ? 'CL' : (i === 1 ? 'SU' : 'RP1');
          }
          pitcherCards.push({ player: p, label });
        }
      });

      const renderCardWrap = ({ player, label }) => {
        const cardHTML = typeof window.createCardHTML === 'function'
          ? window.createCardHTML(player, label)
          : `<div class="player-card"><div class="card-name">${player.name}</div></div>`;
        return `
          <div class="c162-result-card-wrap">
            ${cardHTML}
          </div>
        `;
      };

      const lineupCardsHTML = lineupCards.map(renderCardWrap).join('');
      const pitcherCardsHTML = pitcherCards.map(renderCardWrap).join('');

      let headerHTML = '';
      if (wonWS) {
        if (isPerfect) {
          const perfTitle = _t('challenge162.perfect_champion_title', '¡TEMPORADA PERFECTA 162-0 & CAMPEÓN MUNDIAL!');
          const perfDesc = _t('challenge162.perfect_champion_desc', '🏆 162-0 REGULAR + 3-0 PLAYOFFS (165-0 INVICTO) · ¡INMORTALIDAD LOGRADA!');
          headerHTML = `
            <div style="text-align:center;margin-bottom:8px;">
              <div style="font-size:28px;margin-bottom:2px;filter:drop-shadow(0 0 16px #ffd700);animation:bounce 2s infinite;">👑</div>
              <div style="font-family:'Press Start 2P',monospace;font-size:12.5px;color:#ffd700;letter-spacing:1px;text-shadow:0 0 20px rgba(255,215,0,0.9);margin-bottom:3px;">
                ${perfTitle}
              </div>
              <div style="font-size:10.5px;color:#34d399;font-weight:bold;">
                ${perfDesc}
              </div>
            </div>
          `;
        } else {
          const wsTitle = _t('challenge162.ws_champion_title', '¡CAMPEÓN DE LA SERIE MUNDIAL!');
          const wsDesc = _t('challenge162.ws_champion_desc', `👑 Alzaste el Trofeo (${S.wins}-${S.losses} en Regular + 3-0 en Playoffs)`, { wins: S.wins, losses: S.losses });
          headerHTML = `
            <div style="text-align:center;margin-bottom:8px;">
              <div style="font-size:26px;margin-bottom:2px;filter:drop-shadow(0 0 14px #ffd700);animation:bounce 2s infinite;">🏆</div>
              <div style="font-family:'Press Start 2P',monospace;font-size:12.5px;color:#ffd700;letter-spacing:1px;text-shadow:0 0 20px rgba(255,215,0,0.8);margin-bottom:3px;">
                ${wsTitle}
              </div>
              <div style="font-size:10.5px;color:#cbd5e1;">
                ${wsDesc}
              </div>
            </div>
          `;
        }
      } else if (S.playoffs && S.playoffs.finished) {
        const missedPO = !!S.playoffs.missed;
        const roundKey = `challenge162.round_${(S.playoffs.round || 0) + 1}_title`;
        const roundName = _t(roundKey, PLAYOFF_ROUNDS[S.playoffs.round] ? PLAYOFF_ROUNDS[S.playoffs.round].label : 'Playoffs');
        // Missing the playoffs is not a postseason exit: say so instead of naming a round never played.
        const poEndTitle = missedPO ? 'SEASON OVER' : _t('challenge162.playoff_end_title', 'FIN DE LA POSTEMPORADA');
        const poEndDesc = missedPO
          ? `${S.wins}-${S.losses} · no postseason this year. Only the top 4 of each league get in.`
          : _t('challenge162.playoff_end_desc', `Gran campaña finalizada en: ${roundName}`, { round: roundName });
        headerHTML = `
          <div style="text-align:center;margin-bottom:8px;">
            <div style="font-size:24px;margin-bottom:2px;">${missedPO ? '📉' : '🥈'}</div>
            <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:#f87171;letter-spacing:1px;margin-bottom:3px;">
              ${poEndTitle}
            </div>
            <div style="font-size:10.5px;color:#f3f4f6;">
              ${poEndDesc}
            </div>
          </div>
        `;
      } else {
        const regEndTitle = _t('challenge162.regular_end_title', 'TEMPORADA REGULAR FINALIZADA');
        const regEndDesc = _t('challenge162.regular_end_desc', `Récord: ${S.wins}-${S.losses} (Mínimo 100 victorias para clasificar)`, { wins: S.wins, losses: S.losses });
        headerHTML = `
          <div style="text-align:center;margin-bottom:8px;">
            <div style="font-size:22px;margin-bottom:2px;">⚾</div>
            <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:var(--challenge162-accent);letter-spacing:1px;margin-bottom:3px;">
              ${regEndTitle}
            </div>
            <div style="font-size:10.5px;color:#9ca3af;">${regEndDesc}</div>
          </div>
        `;
      }

      const regSeasonLabel = _t('challenge162.season_regular', 'TEMPORADA REGULAR');
      const postSeasonLabel = _t('challenge162.postseason_label', 'POSTEMPORADA');
      const dynastyLabel = _t('challenge162.dynasty_status', 'ESTATUS DINASTIA');
      const dynastyStatusVal = wonWS ? (isPerfect ? _t('challenge162.status_undefeated', '👑 INVICTO SUPREMO') : _t('challenge162.status_champion', '👑 CAMPEON MUNDIAL')) : (S.playoffs.unlocked ? _t('challenge162.status_finalist', '🥈 FINALISTA') : _t('challenge162.status_contender', '⚾ CONTENDIENTE'));
      const exitLabels = ['🏟️ FIRST ROUND EXIT', '🥉 LEAGUE FINALIST', '🥈 WORLD SERIES FINALIST'];
      const leagueStatus = !S.league || wonWS ? null : (S.playoffs.missed ? '⚾ MISSED PLAYOFFS' : exitLabels[S.playoffs.round] || null);

      // With the real league these four are your team's internal honors; the league-wide
      // awards (MVP, Cy Young, ...) are listed separately above, so the labels must not clash.
      const teamHonors = !!S.league;
      const mvpAwardLabel = teamHonors ? '🏆 TEAM MVP' : _t('challenge162.mvp_award', '🏆 MVP DE LA DINASTIA');
      const cyAwardLabel = teamHonors ? '🧢 TEAM ACE' : _t('challenge162.cy_young_award', '🧢 PREMIO CY YOUNG');
      const hrAwardLabel = teamHonors ? '💣 TEAM HR LEADER' : _t('challenge162.hr_king_award', '💣 REY DEL CUADRANGULAR');
      const rpAwardLabel = teamHonors ? '🔥 TEAM BULLPEN ACE' : _t('challenge162.reliever_award', '🔥 RELEVISTA DEL ANO');
      const totalRosterCards = lineupCards.length + pitcherCards.length;
      const ringLabel = _t('challenge162.ring_of_champions', `💍 PLANTILLA DE ${totalRosterCards} CAMPEONES (ROSTER COMPLETO)`, { count: totalRosterCards });
      const newChalBtnText = _t('challenge162.new_challenge_btn', '🔄 EMPEZAR NUEVO CHALLENGE');
      const viewStatsBtnText = _t('challenge162.view_stats_table', '📊 VER ESTADISTICAS');
      const backMenuBtnText = _t('challenge162.main_menu', 'MENU PRINCIPAL');

      container.innerHTML = `
        ${headerHTML}

        <div style="text-align:center;margin-bottom:8px;">
          <span class="c162-mode-badge" style="background:rgba(245,158,11,0.2);color:#ffd700;border:1px solid rgba(245,158,11,0.5);font-size:9.5px;padding:4px 10px;">
            ${(S.modeConfig && S.modeConfig.label) || '162-0 CHALLENGE'}
          </span>
        </div>

        ${this._resultsLeagueHTML()}

        <!-- Top Record Bar -->
        <div style="display:flex;justify-content:space-around;align-items:center;background:rgba(0,0,0,0.45);border:1px solid rgba(255,215,0,0.25);border-radius:8px;padding:6px 12px;margin-bottom:8px;flex-wrap:wrap;gap:6px;text-align:center;">
          <div>
            <div style="font-size:7.5px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${regSeasonLabel}</div>
            <div style="font-size:13px;font-family:'Press Start 2P',monospace;color:#ffd700;margin-top:2px;">${S.wins}-${S.losses}</div>
          </div>
          <div>
            <div style="font-size:7.5px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${postSeasonLabel}</div>
            <div style="font-size:13px;font-family:'Press Start 2P',monospace;color:${wonWS ? '#34d399' : (S.playoffs.unlocked ? '#f87171' : '#6b7280')};margin-top:2px;">
              ${wonWS ? '3 - 0 🏆' : (S.playoffs.unlocked ? `${S.playoffs.round} Win(s)` : 'N/A')}
            </div>
          </div>
          <div>
            <div style="font-size:7.5px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${dynastyLabel}</div>
            <div style="font-size:10px;font-family:'Press Start 2P',monospace;color:${wonWS ? '#ffd700' : '#38bdf8'};margin-top:2px;">
              ${leagueStatus || dynastyStatusVal}
            </div>
          </div>
        </div>

        <!-- Awards Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:8px;margin-bottom:8px;">
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:6px;padding:6px 10px;">
            <div style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#ffd700;margin-bottom:2px;">${mvpAwardLabel}</div>
            <div style="font-size:10.5px;color:#f3f4f6;font-weight:bold;">${mvp ? mvp.name : 'N/A'}</div>
            <div style="font-size:8.5px;color:#9ca3af;margin-top:1px;">${mvpLine}</div>
          </div>

          <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);border-radius:6px;padding:6px 10px;">
            <div style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#38bdf8;margin-bottom:2px;">${cyAwardLabel}</div>
            <div style="font-size:10.5px;color:#f3f4f6;font-weight:bold;">${cyYoung ? cyYoung.name : 'N/A'}</div>
            <div style="font-size:8.5px;color:#9ca3af;margin-top:1px;">${cyLine}</div>
          </div>

          <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:6px 10px;">
            <div style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#f87171;margin-bottom:2px;">${hrAwardLabel}</div>
            <div style="font-size:10.5px;color:#f3f4f6;font-weight:bold;">${hrKing ? hrKing.name : 'N/A'}</div>
            <div style="font-size:8.5px;color:#9ca3af;margin-top:1px;">${hrLine}</div>
          </div>

          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:6px 10px;">
            <div style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#34d399;margin-bottom:2px;">${rpAwardLabel}</div>
            <div style="font-size:10.5px;color:#f3f4f6;font-weight:bold;">${topReliever ? topReliever.name : 'N/A'}</div>
            <div style="font-size:8.5px;color:#9ca3af;margin-top:1px;">${rpLine}</div>
          </div>
        </div>

        ${this._resultsRosterHTML(wonWS)}

        <!-- Action CTAs -->
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
          <button id="challenge162-new-challenge-btn" class="btn" style="padding:8px 16px;font-size:9.5px;font-family:'Press Start 2P',monospace;background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;border:2px solid #fff;box-shadow:0 0 14px rgba(255,215,0,0.4);cursor:pointer;">
            ${newChalBtnText}
          </button>
          ${(S.playoffs && S.playoffs.boxScores && S.playoffs.boxScores.length > 0) ? `
            <button id="challenge162-results-view-boxscores-btn" class="btn btn-secondary" style="padding:8px 14px;font-size:9.5px;color:#38bdf8;border-color:rgba(56,189,248,0.4);">
              ${_t('challenge162.playoff_view_boxscores', '📜 Historial de Box Scores')}
            </button>
          ` : ''}
          <button id="challenge162-results-view-stats-btn" class="btn btn-secondary" style="padding:8px 14px;font-size:9.5px;">
            ${viewStatsBtnText}
          </button>
          <button id="challenge162-results-back-btn" class="btn btn-secondary" style="padding:8px 14px;font-size:9.5px;">
            ← ${backMenuBtnText}
          </button>
        </div>
      `;

      const btnNew = document.getElementById('challenge162-new-challenge-btn');
      if (btnNew) btnNew.onclick = () => { this.clear(); this.renderHub(); };
      const btnBoxScores = document.getElementById('challenge162-results-view-boxscores-btn');
      if (btnBoxScores) {
        btnBoxScores.onclick = () => {
          const bList = S.playoffs.boxScores;
          if (bList && bList.length) {
            // Show latest or first box score modal:
            this.showPlayoffBoxScoreModal(bList[bList.length - 1]);
          }
        };
      }
      const btnStats = document.getElementById('challenge162-results-view-stats-btn');
      if (btnStats) btnStats.onclick = () => { this.showScreen('screen-challenge-season'); this.renderSeason(); };
      const btnBack = document.getElementById('challenge162-results-back-btn');
      if (btnBack) btnBack.onclick = () => { this.showScreen('screen-mode-select'); this.updateModeSelectCard(); };
    },

    initUI() {
      this.updateModeSelectCard();
      const btn = document.getElementById('btn-select-challenge-mode');
      if (btn) {
        btn.onclick = () => {
          if (!this.isModeUnlocked()) {
            if (typeof window.showToast === 'function') {
              window.showToast('🔒 Completa una run de Partida Rápida para desbloquear el 162-0 Challenge');
            }
            return;
          }
          this.renderHub();
        };
      }
      const backToMenu = () => {
        this.showScreen('screen-mode-select');
        this.updateModeSelectCard();
      };
      const btnBack1 = document.getElementById('btn-challenge162-back-menu');
      const btnBack2 = document.getElementById('btn-challenge162-season-back-menu');
      if (btnBack1) {
        btnBack1.onclick = () => {
          if (this._previousHubView === 'franchise') {
            this.renderFranchiseSelect();
          } else if (this._previousHubView === 'era') {
            this.renderEraSelect();
          } else {
            this.renderHub();
          }
        };
      }
      if (btnBack2) btnBack2.onclick = backToMenu;
    }
  };

  window.Challenge162.initUnlocks();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Challenge162.initUI());
  } else {
    window.Challenge162.initUI();
  }
})();
