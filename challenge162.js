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
    { key: 'The Genesis Era (1871-1900)', label: 'The Genesis Era', years: '1871 - 1900', desc: 'Los pioneros del béisbol profesional en el siglo XIX.', icon: '📜', color: '#a16207' },
    { key: 'Deadball (1901-1919)', label: 'Deadball Era', years: '1901 - 1919', desc: 'Dominio absoluto del pitcheo, toques y juego táctico.', icon: '⚾', color: '#64748b' },
    { key: 'Golden Era (1920-1941)', label: 'Golden Era', years: '1920 - 1941', desc: 'La época de oro de Babe Ruth, Lou Gehrig y jonrones de leyenda.', icon: '👑', color: '#d97706' },
    { key: 'Integration (1942-1960)', label: 'Integration Era', years: '1942 - 1960', desc: 'Jackie Robinson rompe la barrera racial; dinastías históricas.', icon: '🤝', color: '#2563eb' },
    { key: 'Expansion (1961-1976)', label: 'Expansion Era', years: '1961 - 1976', desc: 'Nuevas franquicias y la era del montículo y los lanzadores.', icon: '🏟️', color: '#059669' },
    { key: 'Big Hair Era (1977-1993)', label: 'Big Hair Era', years: '1977 - 1993', desc: 'Años 80, velocidad supersónica, turf artificial y cerradores míticos.', icon: '🎸', color: '#dc2626' },
    { key: 'Steroid Era (1994-2005)', label: 'Steroid Era', years: '1994 - 2005', desc: 'La era de los jonrones titánicos y los récords ofensivos imposibles.', icon: '💉', color: '#7c3aed' },
    { key: 'Efficiency Era (2006-2015)', label: 'Efficiency Era', years: '2006 - 2015', desc: 'La revolución analítica, Moneyball y relevistas de precisión.', icon: '💻', color: '#0891b2' },
    { key: 'Modern Era (2016-Pres)', label: 'Modern Era', years: '2016 - Presente', desc: 'Velocidad élite, rotaciones modernas y superestrellas globales.', icon: '🚀', color: '#10b981' }
  ];


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

    // Replacement baseline against ~4.80 replacement ERA
    const repRuns = ip * (4.80 / 9.0);
    const actualRA = er * 1.05;
    const kBbAdj = (k * 0.020) - (bb * 0.010);
    const isSP = (role || 'SP').toUpperCase() === 'SP';
    const svLeverage = !isSP ? (sv * 0.45) : 0.0;

    const war = Math.max(0.0, (repRuns - actualRA + kBbAdj + svLeverage) / 10.0);
    return war.toFixed(1);
  }

  function buildEnemyPitcherObj(p, role) {
    const staVal = p.sta !== undefined ? p.sta : 50;
    const hp = Math.max(75, Math.round(75 + (staVal - 20) * (125 / 90)));
    const yearVal = p.year || p.peak_year_display || p.peak_year || 1990;
    const cName = cleanName(p);
    return {
      name: cName, cleanName: cName, role, pos: role,
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
  function weightedTopPick(sortedCandidates) {
    const n = Math.min(sortedCandidates.length, OPPONENT_PICK_WEIGHTS.length);
    const total = OPPONENT_PICK_WEIGHTS.slice(0, n).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < n; i++) {
      if (roll < OPPONENT_PICK_WEIGHTS[i]) return sortedCandidates[i];
      roll -= OPPONENT_PICK_WEIGHTS[i];
    }
    return sortedCandidates[0];
  }

  function buildFranchiseDecadeTeam(code, decade) {
    const franchiseNames = (window.PlayersDB && window.PlayersDB.FranchiseNames) || {};
    const batterHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.batters) || {};
    const pitcherHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};
    const fullBatterPool = getBatterPool();
    const fullPitcherPool = getPitcherPool();
    const usedIDs = new Set();

    const eligibleBatters = radius => fullBatterPool.filter(p => isEligibleForTeamDecade(p, batterHistory, code, decade, radius));
    const eligiblePitchers = radius => fullPitcherPool.filter(p => isEligibleForTeamDecade(p, pitcherHistory, code, decade, radius));

    const lineup = SLOTS.map(slot => {
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

    const pickPitcher = (role) => {
      for (const radius of WINDOW_RADII) {
        const bucket = eligiblePitchers(radius)
          .filter(p => (p.role || 'SP').toUpperCase() === role)
          .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        if (bucket.length) return weightedTopPick(bucket);
      }
      const globalBucket = fullPitcherPool.filter(p => (p.role || 'SP').toUpperCase() === role)
        .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      return globalBucket.length ? weightedTopPick(globalBucket) : undefined;
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

  function getFranchiseDecadeTeam(code, decade) {
    const key = `${code}_${decade}`;
    if (_teamDecadeCache.has(key)) return _teamDecadeCache.get(key);
    const team = buildFranchiseDecadeTeam(code, decade);
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

  // Extra SP for a playoff opponent's pitching staff, on top of the single SP
  // getFranchiseDecadeTeam already picked — same franchise-decade eligibility
  // window as the rest of that team's roster, just excluding whoever's already
  // the ace so the two aren't the same guy.
  function _pickSecondFranchisePitcher(code, decade, excludeKey) {
    const pitcherHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};
    const fullPitcherPool = getPitcherPool();
    for (const radius of WINDOW_RADII) {
      const bucket = fullPitcherPool.filter(p =>
        (p.role || 'SP').toUpperCase() === 'SP' &&
        pitcherUnlockKey(p) !== excludeKey &&
        isEligibleForTeamDecade(p, pitcherHistory, code, decade, radius)
      ).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      if (bucket.length) return weightedTopPick(bucket);
    }
    return null;
  }

  // Playoff opponents are the strongest real rivals THIS challenge's season
  // actually generated (this.state.leagueTeams — the same 30 franchise-decade
  // teams the regular season schedule drew from).
  // Round 0 (Divisional): 3rd-strongest franchise (+25% HP, +6 Stats)
  // Round 1 (Championship): 2nd-strongest franchise (+50% HP, +12 Stats)
  // Round 2 (World Series): #1 ABSOLUTE STRONGEST FRANCHISE (+80% HP, +20 Stats, Ruthless Boss Ace & Closer)
  function generatePlayoffEnemyTeam(round, leagueTeams) {
    const cfg = PLAYOFF_ROUNDS[round];
    const ranked = (leagueTeams || [])
      .map(t => {
        const team = getFranchiseDecadeTeam(t.code, t.decade);
        return { t, team, strength: teamStrength(team.lineup, team.pitcher) };
      })
      .sort((a, b) => b.strength - a.strength);

    // Round 0 -> 3rd best, round 1 -> 2nd best, round 2 (World Series) -> absolute #1 team in the league.
    const pickIndex = Math.min(ranked.length - 1, Math.max(0, (PLAYOFF_ROUNDS.length - 1) - round));
    const chosen = ranked[pickIndex] || ranked[0];
    const franchiseTeam = chosen.team;

    // Authentic playoff team stats without artificial inflation:
    const hpMult = 1.0;
    const statBuff = 0;

    const boostPitcher = (p, role) => {
      if (!p) return null;
      const baseObj = buildEnemyPitcherObj(p, role);
      const boostedHp = Math.round(baseObj.maxHp * hpMult);
      return {
        ...baseObj,
        maxHp: boostedHp,
        hp: boostedHp,
        h9: Math.min(125, baseObj.h9 + statBuff),
        k9: Math.min(125, baseObj.k9 + statBuff),
        bb9: Math.min(125, baseObj.bb9 + statBuff),
        hr9: Math.min(125, baseObj.hr9 + statBuff),
        stf: Math.min(125, baseObj.stf + statBuff),
        ctl: Math.min(125, baseObj.ctl + statBuff),
        upgrades: {
          con: statBuff, pwr: statBuff, eye: statBuff, spd: statBuff, def: statBuff, sta: statBuff
        }
      };
    };

    const boostedBatters = franchiseTeam.lineup.map(b => ({
      ...b,
      con: Math.min(125, (b.con || 50) + statBuff),
      pwr: Math.min(125, (b.pwr || 50) + statBuff),
      eye: Math.min(125, (b.eye || 50) + statBuff),
      def: Math.min(125, (b.def || 50) + statBuff),
      upgrades: { con: statBuff, pwr: statBuff, eye: statBuff, spd: 0, def: statBuff, sta: 0 }
    }));

    const p1 = boostPitcher(franchiseTeam.pitcher, 'SP');
    const p3 = boostPitcher(franchiseTeam.reliever, 'RP');
    const secondSP = _pickSecondFranchisePitcher(chosen.t.code, chosen.t.decade, pitcherUnlockKey(franchiseTeam.pitcher));
    const p2 = secondSP ? boostPitcher(secondSP, 'SP') : p1;

    return {
      id: `challenge162_playoff_${cfg.key}_${Date.now()}`,
      name: `${cfg.label}: ${franchiseTeam.name}`,
      tier: round === 2 ? 'BOSS_S' : 'S',
      isBoss: true,
      isWorldSeries: round === 2,
      pitchers: [p1, p2, p3],
      _ovr: Math.min(99, (p1.ovr || 75) + statBuff),
      era: p1.era,
      rarity: round === 2 ? 'Legendary' : 'Epic',
      _batters: boostedBatters
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
  function simPaOutcome(batter, pitcher, isUserBatting = true) {
    const con = batter.con !== undefined ? batter.con : 50;
    const eye = batter.eye !== undefined ? batter.eye : 50;
    const pwr = batter.pwr !== undefined ? batter.pwr : 50;
    const spd = batter.spd !== undefined ? batter.spd : 50;
    const pH9 = pitcher.h9 !== undefined ? pitcher.h9 : 50;
    const pK9 = pitcher.k9 !== undefined ? pitcher.k9 : 50;
    const pBB9 = pitcher.bb9 !== undefined ? pitcher.bb9 : 50;
    const pHR9 = pitcher.hr9 !== undefined ? pitcher.hr9 : 50;

    // BB: ~9.2% baseline with authentic discipline scaling for patience masters (Ott, Hack, Murray, Williams)
    // Minimum 5.0% floor ensures even aggressive free-swingers draw 28-38 walks across a full season:
    let pBB = 0.092 + (eye - 50) * 0.00185 - (pBB9 - 50) * 0.0007;
    pBB = Math.max(0.050, Math.min(0.24, pBB));

    // Soft compression for low floor (CON < 35) and high ceiling (CON > 90):
    let conEffective = con;
    if (con < 35) {
      conEffective = 42 + (con - 35) * 0.35;
    } else if (con > 90) {
      conEffective = 90 + (con - 90) * 0.45;
    }

    let pwrEffective = pwr;
    if (pwr > 75 && pwr <= 90) {
      pwrEffective = 75 + (pwr - 75) * 0.70;
    } else if (pwr > 90) {
      pwrEffective = 75 + (15 * 0.70) + (pwr - 90) * 0.45;
    }

    // SO: Driven directly by dedicated K Avoidance attribute (k_avd / k_avoid) & Pitcher K/9:
    // Elite strikeout aces (K/9 85-110+ e.g. Sale, Pedro, Ryan, Score) generate authentic 250-295 K in 220-240 IP.
    // Quality starters (K/9 50-65 e.g. Santana, Root) generate 140-175 K.
    // Soft-tossers / sinkerballers (K/9 10-35 e.g. Bill Lee, Randy Jones) generate 65-105 K.
    const rawKAvd = batter.k_avd !== undefined ? batter.k_avd : (batter.k_avoid !== undefined ? batter.k_avoid : (batter.k_avoid_val !== undefined ? batter.k_avoid_val : conEffective));
    const kAvoid = rawKAvd < 35 ? (42 + (rawKAvd - 35) * 0.35) : (rawKAvd > 90 ? (90 + (rawKAvd - 90) * 0.50) : rawKAvd);
    const kPitcherBoost = pK9 <= 65 ? (pK9 - 50) * 0.0022 : (15 * 0.0022 + (pK9 - 65) * 0.0034);
    let pSO = 0.185 - (kAvoid - 50) * 0.00165 + kPitcherBoost;
    pSO = Math.max(0.040, Math.min(0.42, pSO));

    const pInPlay = Math.max(0.20, 1 - pBB - pSO);

    // Hits: Target Batting Average scaled across non-walk at-bats (1 - pBB)
    // Ensures high-walk sluggers (130+ BB e.g. Ruth, Bonds, Williams) keep their authentic .370-.395 AVG:
    const defEfficiency = (pitcher && pitcher._fieldingDef) !== undefined ? pitcher._fieldingDef : 50;
    const defAdj = (defEfficiency - 50) * 0.00028;

    let targetAvg, pHR;
    if (isUserBatting) {
      targetAvg = 0.268 + (conEffective - 50) * 0.00165 - (pH9 - 50) * 0.00070 - defAdj;
      pHR = 0.028 + (pwrEffective - 50) * 0.00110 - (pHR9 - 50) * 0.00030;
    } else {
      // Opponent batting vs User pitching: calibrated to deliver authentic 2.20-3.50 ERAs for quality starters and 1.80-2.80 for elite relievers:
      targetAvg = 0.252 + (conEffective - 50) * 0.00140 - (pH9 - 50) * 0.00075 - defAdj;
      pHR = 0.030 + (pwrEffective - 50) * 0.00110 - (pHR9 - 50) * 0.00032;
    }

    targetAvg = Math.max(0.14, Math.min(0.42, targetAvg));
    let pTotalHit = (1 - pBB) * targetAvg;
    pTotalHit = Math.min(pTotalHit, pInPlay - 0.01);

    pHR = Math.max(0.001, Math.min(0.095, pHR));
    pHR = Math.min(pHR, pTotalHit * 0.55);
    const pRegularHit = pTotalHit - pHR;

    // 3B Triples Distribution:
    // Slow sluggers (SPD < 40) -> 1-2 triples; average runners (SPD 50-70) -> 4-7 triples;
    // Elite burners (SPD 75-115+ e.g. Cobb, Henderson, Crawford, Carroll) -> 10-20 triples!
    const tripleWeight = 0.008 + Math.max(0, (spd - 30) * 0.00075);
    const doubleWeight = Math.min(0.30, 0.17 + pwr * 0.0005);
    const singleWeight = Math.max(0.35, 1 - doubleWeight - tripleWeight);
    const hitTotal = singleWeight + doubleWeight + tripleWeight;
    const p1B = pRegularHit * (singleWeight / hitTotal);
    const p2B = pRegularHit * (doubleWeight / hitTotal);
    const p3B = pRegularHit * (tripleWeight / hitTotal);

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
          ? (typeof window.t === 'function' ? (window.t('mode_select.challenge162_continue_btn') || 'CONTINUAR TEMPORADA') : 'CONTINUAR TEMPORADA')
          : (typeof window.t === 'function' ? (window.t('mode_select.challenge162_btn') || 'ARMAR EQUIPO') : 'ARMAR EQUIPO');
        btn.innerHTML = hasActiveSave ? `⚾ ${btnText}` : `🏆 ${btnText}`;
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
    isBatterUnlocked(p) { return !!(p && p.playerID && this.unlockedBatters.has(batterUnlockKey(p))); },
    isPitcherUnlocked(p) { return !!(p && this.unlockedPitchers.has(pitcherUnlockKey(p))); },
    isUnlocked(player) {
      if (!player) return false;
      const looksLikePitcher = player.h9 !== undefined || player.role === 'SP' || player.role === 'RP';
      return looksLikePitcher ? this.isPitcherUnlocked(player) : this.isBatterUnlocked(player);
    },
    getEligibleBatters() {
      const mode = this.getModeConfig();
      let pool = getBatterPool().filter(p => this.isBatterUnlocked(p));
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
      let pool = getPitcherPool().filter(p => this.isPitcherUnlocked(p));
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
        return true;
      } catch (e) { return false; }
    },
    hasSave() { return !!localStorage.getItem(SAVE_KEY); },
    clear() {
      this.state = null;
      localStorage.removeItem(SAVE_KEY);
    },

    // ── Roster building ────────────────────────────────────────────────────
    startNewChallenge(lineup, pitchers, customModeConfig) {
      const leagueTeams = buildLeagueTeams();
      const cfg = customModeConfig || this.getModeConfig();
      this.state = {
        v: 1,
        modeConfig: cfg,
        roster: { lineup, battingOrder: BATTING_ORDER.slice(), pitchers },
        leagueTeams,
        schedule: buildSeasonSchedule(leagueTeams),
        gamesPlayed: 0, wins: 0, losses: 0, streak: 0,
        batterStats: {}, pitcherStats: {},
        gameLog: [],
        playoffs: { unlocked: false, round: 0, finished: false, won: false }
      };
      SLOTS.forEach(slot => {
        const p = lineup[slot];
        if (p) this.state.batterStats[batterUnlockKey(p)] = { name: p.name, g: 0, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
      });
      [...pitchers.SP, ...pitchers.RP].forEach(p => {
        this.state.pitcherStats[pitcherUnlockKey(p)] = { name: p.name, role: p.role, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
      });
      this.save();
      this.showScreen('screen-challenge-season');
      this.render();
    },

    // Stamina-driven starting pitcher depth:
    // Converts pitcher's STA attribute (30-125+) into realistic inning capacity per start.
    // Starters average 6.8-7.5 IP/start (~225-245 IP/season), leaving authentic ~280 IP for the bullpen.
    _getStarterMaxInnings(sp) {
      if (!sp) return 6;
      const sta = sp.sta !== undefined ? sp.sta : (sp.sta_val !== undefined ? sp.sta_val : (sp.stamina !== undefined ? sp.stamina : 70));
      // Base innings: STA 20 -> 6.2, STA 70 -> 7.1, STA 90 -> 7.5, STA 105+ -> 7.8
      const base = 6.2 + (Math.max(20, Math.min(125, sta)) - 20) * 0.016;
      const roll = (Math.random() - 0.5) * 1.0;
      let maxInn = Math.max(6, Math.min(9, Math.round(base + roll)));

      // High stamina complete games for workhorse aces (STA >= 85)
      if (sta >= 85 && Math.random() < 0.06) maxInn = 9;

      return maxInn;
    },

    // Bullpen delegation driven by role, situation, and Stamina (STA):
    // relievers = [middleRelief, setupRelief, closerRelief]
    _pitcherForInning(inning, sp, relievers, spMaxInnings, gameIdx, userRuns, oppRuns) {
      if (inning <= spMaxInnings) return sp;

      const closer = relievers[2] || relievers[1] || relievers[0];
      const setup  = relievers[1] || relievers[0];
      const middle = relievers[0];

      const runDiff = userRuns - oppRuns;
      const isSaveSituation = (runDiff >= 1 && runDiff <= 3);
      const isExtremeBlowout = Math.abs(runDiff) >= 7;

      // Extract reliever stamina attributes:
      const staMR = middle && (middle.sta !== undefined ? middle.sta : (middle.sta_val !== undefined ? middle.sta_val : (middle.stamina !== undefined ? middle.stamina : 65)));
      const staSU = setup && (setup.sta !== undefined ? setup.sta : (setup.sta_val !== undefined ? setup.sta_val : (setup.stamina !== undefined ? setup.stamina : 40)));
      const staCL = closer && (closer.sta !== undefined ? closer.sta : (closer.sta_val !== undefined ? closer.sta_val : (closer.stamina !== undefined ? closer.stamina : 35)));

      // In massive runaway blowouts in 9th (margin >= 8 runs), mop-up bench arm finishes to protect bullpen:
      if (Math.abs(runDiff) >= 8 && inning >= 9) {
        return null;
      }
      if (inning < 6) {
        return (staMR >= 60) ? middle : null;
      }

      // ── 9th inning and Extra Innings (10+) ──────────────────────────────────
      if (inning >= 9) {
        if (isSaveSituation) {
          // Closer pitches ~88% of save opportunities; Setup covers ~12% on rest days:
          if (gameIdx % 8 !== 0 || staCL >= 45) {
            return closer;
          }
          return setup;
        }

        // Leads of 1 to 5 runs: Closer pitches to stay sharp (~65% of appearances):
        if (runDiff >= 1 && runDiff <= 5) {
          if (gameIdx % 3 !== 0) {
            return closer;
          }
          return setup;
        }

        // Close game (tie, 1-run deficit) in 9th or Extras:
        if (runDiff === 0 || runDiff === -1) {
          return closer;
        }

        // Heavy blowout lead (6+ runs) or multi-run deficit:
        // Middle / long reliever finishes the game to preserve Closer & Setup:
        return middle;
      }

      // ── 8th Inning (Setup Inning) ───────────────────────────────────────────
      if (inning === 8) {
        if (!isExtremeBlowout && runDiff >= -2) {
          // Setup reliever handles 8th inning in leads up to 6 runs and close games (~80% of time):
          if (gameIdx % 5 !== 0 || staSU >= 45) {
            return setup;
          }
          return middle;
        }
        // Extreme blowouts (7+ runs) or deep deficits in 8th -> Middle relief
        return middle;
      }

      // ── 6th and 7th Inning (Bridge / Middle Relief) ─────────────────────────
      if (inning <= 7) {
        // High stamina middle relievers (STA >= 55, e.g. McDaniel, Gossage, Wilhelm) handle multi-inning bridge work:
        if (staMR >= 55) {
          return middle;
        }
        // If middle reliever has low stamina, alternate with Setup:
        return (gameIdx % 2 === 0) ? middle : setup;
      }

      return (inning >= 10) ? closer : middle;
    },

    // The challenge's outcome (W/L) is decided independently of the box score —
    // see the module-level winProbability()/teamStrength() functions and the
    // reroll loop below. Stats always come from _simulateNaturalGame's pure,
    // rating-only math; this just picks WHICH honestly-simulated attempt at
    // the game gets kept, biased toward the target outcome instead of always
    // taking the first roll.
    simulateGame() {
      const S = this.state;
      const gameIdx = S.gamesPlayed;
      const spList = S.roster.pitchers.SP;
      const rpList = S.roster.pitchers.RP;
      const userSP = spList[gameIdx % spList.length];

      // Respect user's explicit roster slot roles:
      // RP[0] = Middle Reliever (RP)
      // RP[1] = Setup Reliever (SETUP)
      // RP[2] = Designated Closer (CL)
      const middle = rpList[0] || rpList[1] || rpList[2];
      const setup  = rpList[1] || rpList[0] || rpList[2];
      const closer = rpList[2] || rpList[1] || rpList[0];
      const userRelievers = [middle, setup, closer];

      const sched = S.schedule[gameIdx];
      const opp = getFranchiseDecadeTeam(sched.code, sched.decade);
      const userLineup = S.roster.battingOrder.map(slot => S.roster.lineup[slot]).filter(Boolean);

      const userStrength = teamStrength(userLineup, userSP);
      const oppStrength = teamStrength(opp.lineup, opp.pitcher);
      const targetWinProb = winProbability(userStrength, oppStrength, S.streak || 0);
      const targetWin = Math.random() < targetWinProb;

      const MAX_ATTEMPTS = 2;
      let attempt = null;
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        attempt = this._simulateNaturalGame(userLineup, userSP, userRelievers, opp, gameIdx);
        if ((attempt.userRuns > attempt.oppRuns) === targetWin) break;
      }

      // Commit the accepted attempt's stats — and only this one attempt's, so
      // rejected rerolls never leak extra at-bats into the season totals.
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

      S.gamesPlayed++;
      const won = attempt.userRuns > attempt.oppRuns;
      if (won) { S.wins++; S.streak = (S.streak || 0) + 1; } else { S.losses++; S.streak = 0; }

      if (!this._autoSimRunning && window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play(won ? 'hit' : 'out');
      }

      // Pitching Decisions:
      // Starter gets W/L if pitched >= 5 innings (15 outs) or pitched the complete game.
      // Last reliever gets Save if they finished the game in a <=3 run lead and were not the starter.
      const lastPitcher = this._pitcherForInning(attempt.inning, userSP, userRelievers, attempt.userMaxInnings, gameIdx, attempt.userRuns, attempt.oppRuns) || userSP;
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

      if (S.gamesPlayed >= SEASON_LENGTH) {
        S.playoffs.unlocked = (S.wins >= PLAYOFF_MIN_WINS);
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

      const userMaxInnings = this._getStarterMaxInnings(userSP);
      const oppMaxInnings = this._getStarterMaxInnings(opp.pitcher);

      // User fielding defense efficiency across active fielders (excluding DH)
      const fielders = userLineup.filter(p => (p.assignedSlot || p.pos) !== 'DH');
      const userTeamDef = fielders.length
        ? fielders.reduce((s, p) => s + (p.def !== undefined ? p.def : (p.defense_val || 50)), 0) / fielders.length
        : 50;

      // Each game, 1 batting slot takes a routine rest day (~1 in 9 games off, yielding ~144 games / 540-580 AB per starter):
      const restedSlotIdx = gameIdx % 9;

      while (inning <= 9 || (userRuns === oppRuns && inning <= inningLimit)) {
        const oppPitcherToday = inning <= oppMaxInnings ? opp.pitcher : opp.reliever;
        oppPitcherToday._fieldingDef = 50; // Neutral opponent defense

        const runDiff = userRuns - oppRuns;
        const isBlowout = Math.abs(runDiff) >= 5 && inning >= 8;

        userRuns += this._playHalfInning(() => {
          const slot = userIdx % userLineup.length;
          const currentBatter = userLineup[slot];
          userIdx++;
          // Routine rest or late-game blowout substitution by bench:
          if (slot === restedSlotIdx || isBlowout) {
            return { name: "Bench", con: 50, pwr: 45, eye: 45, spd: 45, def: 50, _isBench: true };
          }
          return currentBatter;
        }, oppPitcherToday, true, batterDeltas, pitcherDeltas);

        const assignedPitcher = this._pitcherForInning(inning, userSP, userRelievers, userMaxInnings, gameIdx, userRuns, oppRuns);
        const userPitcherToday = assignedPitcher || { name: "Support Pitcher", h9: 50, k9: 50, bb9: 50, hr9: 50, role: "RP", _isSupport: true };
        userPitcherToday._fieldingDef = userTeamDef; // User team defense backs up pitching
        oppRuns += this._playHalfInning(() => opp.lineup[oppIdx++ % opp.lineup.length], userPitcherToday, false, batterDeltas, pitcherDeltas);

        inning++;
      }
      return { userRuns, oppRuns, inning: inning - 1, userMaxInnings, batterDeltas, pitcherDeltas };
    },

    _emptyBatterDelta() { return { ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 }; },
    _emptyPitcherDelta() { return { outs: 0, h: 0, er: 0, bb: 0, so: 0 }; },

    _playHalfInning(nextBatterFn, pitcher, isUserBatting, batterDeltas, pitcherDeltas) {
      let outs = 0, runs = 0;
      const bases = [null, null, null];

      while (outs < 3) {
        const batter = nextBatterFn();
        const outcome = simPaOutcome(batter, pitcher, isUserBatting);
        const bKey = (isUserBatting && !batter._isBench) ? batterUnlockKey(batter) : null;
        const pKey = (!isUserBatting && !pitcher._isSupport) ? pitcherUnlockKey(pitcher) : null;
        if (bKey && !batterDeltas[bKey]) batterDeltas[bKey] = this._emptyBatterDelta();
        if (pKey && !pitcherDeltas[pKey]) pitcherDeltas[pKey] = this._emptyPitcherDelta();
        const bStat = bKey ? batterDeltas[bKey] : null;
        const pStat = pKey ? pitcherDeltas[pKey] : null;

        if (outcome === 'OUT') {
          outs++;
          if (bStat) bStat.ab++;
          if (pStat) pStat.outs++;
        } else if (outcome === 'SO') {
          outs++;
          if (bStat) { bStat.ab++; bStat.so++; }
          if (pStat) { pStat.outs++; pStat.so++; }
        } else if (outcome === 'BB') {
          if (bStat) bStat.bb++;
          if (pStat) pStat.bb++;
          const scorer = forceWalk(bases, batter);
          const scorers = scorer ? [scorer] : [];
          runs += scorers.length;
          scorers.forEach(r => {
            const rKey = (isUserBatting && r && !r._isBench) ? batterUnlockKey(r) : null;
            if (rKey && batterDeltas[rKey]) batterDeltas[rKey].r++;
          });
          if (scorers.length && bStat) bStat.rbi += scorers.length;
          if (pStat) pStat.er += scorers.length;
        } else if (outcome === 'HR') {
          if (bStat) { bStat.ab++; bStat.h++; bStat.hr++; bStat.r++; }
          if (pStat) { pStat.h++; }
          const runnersOn = bases.filter(Boolean);
          const rbiCount = 1 + runnersOn.length;
          runs += rbiCount;
          runnersOn.forEach(r => {
            const rKey = (isUserBatting && r && !r._isBench) ? batterUnlockKey(r) : null;
            if (rKey && batterDeltas[rKey]) batterDeltas[rKey].r++;
          });
          bases[0] = null; bases[1] = null; bases[2] = null;
          if (bStat) bStat.rbi += rbiCount;
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
          if (pStat) pStat.h++;
          const scorers = advanceOnHit(bases, batter, basesToAdvance, outs);
          runs += scorers.length;
          scorers.forEach(r => {
            const rKey = (isUserBatting && r && !r._isBench) ? batterUnlockKey(r) : null;
            if (rKey && batterDeltas[rKey]) batterDeltas[rKey].r++;
          });
          if (scorers.length && bStat) bStat.rbi += scorers.length;
          if (pStat) pStat.er += scorers.length;
        }

        // Stolen base roll (smooth authentic sabermetric speed curve):
        // spd < 45 -> 1-3 SB (catchers, slow sluggers)
        // spd 60-70 -> 8-15 SB (average runner)
        // spd 75-85 -> 22-38 SB (Pee Wee Reese, Betts, Altuve)
        // spd 90-110+ -> 45-75+ SB (Rickey Henderson, Vince Coleman, Lou Brock, Ohtani)
        if (isUserBatting && (outcome === 'BB' || outcome === '1B') && bases[0] === batter && !bases[1]) {
          const runnerSpd = batter.spd !== undefined ? batter.spd : 50;
          let stealChance = 0.012;
          if (runnerSpd >= 45) {
            const t = (runnerSpd - 45) / 55.0;
            stealChance = 0.025 + Math.pow(Math.max(0, t), 1.6) * 0.65;
          }
          if (stealChance > 0 && Math.random() < stealChance) {
            bases[1] = batter;
            bases[0] = null;
            if (bStat) bStat.sb++;
          }
        }
      }
      return runs;
    },

    simulateBatch(n) {
      const results = [];
      for (let i = 0; i < n && this.state.gamesPlayed < SEASON_LENGTH; i++) {
        results.push(this.simulateGame());
      }
      return results;
    },
    simulateUntilLossOrEnd() {
      const results = [];
      while (this.state.gamesPlayed < SEASON_LENGTH) {
        const r = this.simulateGame();
        results.push(r);
        if (!r.won) break;
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

    // ── Playoffs (reuses the real dice-battle screen) ─────────────────────
    canStartPlayoffs() {
      return this.state && this.state.gamesPlayed >= SEASON_LENGTH && this.state.wins >= PLAYOFF_MIN_WINS && !this.state.playoffs.finished;
    },
    startPlayoffRound() {
      const G = window.Game;
      if (!G || !this.state) return;
      const round = this.state.playoffs.round;
      const enemyTeam = generatePlayoffEnemyTeam(round, this.state.leagueTeams);

      this._stash = {
        roster: G.roster, battingOrder: G.battingOrder, currentEnemy: G.currentEnemy,
        runActive: G.runActive, currentStageIndex: G.currentStageIndex, equippedTraits: G.equippedTraits
      };

      const lineup = {};
      SLOTS.forEach(slot => {
        const p = this.state.roster.lineup[slot];
        lineup[slot] = p ? { ...p, stamina: 100, upgrades: { con: 0, pwr: 0, eye: 0, spd: 0, def: 0, sta: 0 } } : null;
      });
      G.roster = lineup;

      // Auto-sort batting order sabermetrically for playoffs:
      const rawOrder = SLOTS.filter(s => lineup[s]);
      if (typeof G.autoSortBattingOrder === 'function') {
        G.battingOrder = G.autoSortBattingOrder(lineup, rawOrder);
      } else {
        G.battingOrder = this.state.roster.battingOrder ? this.state.roster.battingOrder.slice() : rawOrder;
      }

      // Determine dominant era for active synergy in playoffs:
      const eraCounts = {};
      Object.values(lineup).filter(Boolean).forEach(p => {
        if (p.era) eraCounts[p.era] = (eraCounts[p.era] || 0) + 1;
      });
      let dominantEra = (this.state.modeConfig && this.state.modeConfig.targetEra) || null;
      if (!dominantEra) {
        let maxC = 0;
        Object.entries(eraCounts).forEach(([era, count]) => {
          if (count > maxC) { maxC = count; dominantEra = era; }
        });
      }
      G.buildEra = dominantEra;

      G.currentEnemy = enemyTeam;
      G.runActive = true;
      G.currentStageIndex = round + 1;
      G.equippedTraits = [];
      G.isChallenge162PlayoffMatch = true;

      this.hideAllTopLevelScreens();
      window.showScreen('screen-match');
      if (window.renderActiveRoster) window.renderActiveRoster();
      if (window.setupAndStartMatchSimulation) window.setupAndStartMatchSimulation();
    },
    onPlayoffMatchResolved(res) {
      const G = window.Game;
      if (G) {
        G.isChallenge162PlayoffMatch = false;
        if (this._stash) Object.assign(G, this._stash);
        this._stash = null;
      }
      if (!this.state) return;
      if (!res.won) {
        this.state.playoffs.finished = true;
        this.state.playoffs.won = false;
        this.recordSeasonFinished(this.state, false);
      } else if (this.state.playoffs.round >= PLAYOFF_ROUNDS.length - 1) {
        this.state.playoffs.finished = true;
        this.state.playoffs.won = true;
        this.recordSeasonFinished(this.state, true);
      } else {
        this.state.playoffs.round++;
      }
      this.save();
      this.showScreen(this.state.playoffs.finished ? 'screen-challenge-results' : 'screen-challenge-playoffs');
      this.render();
    },

    // ── UI ──────────────────────────────────────────────────────────────
    _activeSlot: null,
    _draftLineup: null,
    _draftPitchers: null,
    _selectedFranchise: 'NYY',
    _selectedEra: 'Golden Era (1920-1941)',
    _activeFilterPill: 'ALL',

    hideAllTopLevelScreens() {
      ['screen-mode-select', 'screen-menu', 'screen-challenge-hub', 'screen-challenge-roster', 'screen-challenge-season', 'screen-challenge-playoffs', 'screen-challenge-results'].forEach(id => {
        const s = document.getElementById(id);
        if (s) s.classList.add('hidden');
      });
      const gameWorkspace = document.getElementById('game-workspace');
      if (gameWorkspace) gameWorkspace.classList.add('hidden');
      const hud = document.getElementById('game-hud');
      if (hud) hud.classList.add('hidden');
    },
    showScreen(id) {
      if (id !== 'screen-challenge-season') this.stopAutoSim();
      this.hideAllTopLevelScreens();
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
    renderHub() {
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

      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      const cardsText = _t('challenge162.cards_count', `${totalCards} CARDS`, { count: totalCards });

      // 1. Franchise cards count
      const franchiseListHTML = MLB_FRANCHISES.map(fran => {
        const bCount = getBatterPool().filter(p => this.isBatterUnlocked(p) && (p.team === fran.code || (batterHistory[p.playerID] && batterHistory[p.playerID][fran.code]))).length;
        const pCount = getPitcherPool().filter(p => this.isPitcherUnlocked(p) && (p.team === fran.code || (pitcherHistory[p.playerID] && pitcherHistory[p.playerID][fran.code]))).length;
        const total = bCount + pCount;
        const isSelected = this._selectedFranchise === fran.code;
        const isReady = total >= 17;
        const countStr = _t('challenge162.cards_count', `${total} CARTAS`, { count: total });

        return `
          <div class="c162-sub-item ${isSelected ? 'selected' : ''} challenge162-fran-select" data-code="${fran.code}" style="border-left: 3px solid ${fran.color};">
            <div style="font-size: 18px; margin-bottom: 2px;">${fran.icon}</div>
            <div style="font-size: 10px; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;">${fran.name}</div>
            <div style="font-size: 8px; color: ${isReady ? '#34d399' : '#f59e0b'}; font-family: 'Press Start 2P', monospace; margin-top: 4px;">
              ${countStr}
            </div>
          </div>
        `;
      }).join('');

      // 2. Era cards count
      const eraListHTML = BASEBALL_ERAS.map(era => {
        const bCount = getBatterPool().filter(p => this.isBatterUnlocked(p) && p.era === era.key).length;
        const pCount = getPitcherPool().filter(p => this.isPitcherUnlocked(p) && p.era === era.key).length;
        const total = bCount + pCount;
        const isSelected = this._selectedEra === era.key;
        const isReady = total >= 17;
        const countStr = _t('challenge162.cards_count', `${total} CARTAS`, { count: total });

        return `
          <div class="c162-sub-item ${isSelected ? 'selected' : ''} challenge162-era-select" data-key="${encodeURIComponent(era.key)}" style="border-left: 3px solid ${era.color};">
            <div style="font-size: 18px; margin-bottom: 2px;">${era.icon}</div>
            <div style="font-size: 10px; font-weight: bold; color: #fff;">${era.label}</div>
            <div style="font-size: 8px; color: #94a3b8; margin: 2px 0;">${era.years}</div>
            <div style="font-size: 8px; color: ${isReady ? '#34d399' : '#f59e0b'}; font-family: 'Press Start 2P', monospace; margin-top: 2px;">
              ${countStr}
            </div>
          </div>
        `;
      }).join('');

      const selFranObj = MLB_FRANCHISES.find(f => f.code === this._selectedFranchise) || MLB_FRANCHISES[0];
      const selEraObj = BASEBALL_ERAS.find(e => e.key === this._selectedEra) || BASEBALL_ERAS[2];

      const hubTitle = _t('challenge162.hub_title', '162-0 CHALLENGE HUB');
      const hubSubtitle = _t('challenge162.hub_subtitle', 'Elige tu formato de temporada regular y postemporada');
      const bestStreakText = _t('challenge162.best_streak', 'MEJOR RACHA');
      const wsText = _t('challenge162.world_series', 'SERIES MUNDIALES');
      const seasonsPlayedText = _t('challenge162.seasons_played', 'TEMPORADAS');
      const totalColText = _t('challenge162.total_collection', 'COLECCION TOTAL');

      const winsValStr = _t('challenge162.wins_count', `${records.maxStreak || 0} VICTORIAS`, { count: records.maxStreak || 0 });
      const wsValStr = _t('challenge162.titles_count', `${records.worldSeriesWins || 0} TITULOS`, { count: records.worldSeriesWins || 0 });
      const seasonsValStr = _t('challenge162.seasons_count', `${records.completedSeasons || 0} JUGADAS`, { count: records.completedSeasons || 0 });
      const cardsValStr = _t('challenge162.cards_count', `${totalCards} CARTAS`, { count: totalCards });

      const mainMenuText = _t('challenge162.main_menu', 'MENU PRINCIPAL');

      const allStarBadge = _t('challenge162.free_draft_badge', 'COLECCION LIBRE');
      const allStarTitle = _t('challenge162.all_star_title', 'ALL-STAR DREAM TEAM');
      const allStarDesc = _t('challenge162.all_star_desc', 'Construye tu alineacion y cuerpo de pitcheo sin restricciones utilizando cualquier carta desbloqueada en tu coleccion.');
      const playAllStarBtn = _t('challenge162.play_all_star', 'JUGAR ALL-STAR');

      const monoTeamBadge = _t('challenge162.mono_team_badge', 'FRANQUICIA UNICA');
      const monoTeamTitle = _t('challenge162.mono_team_title', 'DESAFIO MONO-TEAM');
      const monoTeamDesc = _t('challenge162.mono_team_desc', 'Compite exclusivamente con peloteros que vistieron la camiseta del club seleccionado.');
      const playMonoTeamBtn = _t('challenge162.play_with_team', `JUGAR CON ${selFranObj.code}`, { code: selFranObj.code });

      const monoEraBadge = _t('challenge162.mono_era_badge', 'EPOCA HISTORICA');
      const monoEraTitle = _t('challenge162.mono_era_title', 'DESAFIO MONO-ERA');
      const monoEraDesc = _t('challenge162.mono_era_desc', 'Viaja en el tiempo y compite unicamente con las estrellas de una de las 9 eras del beisbol.');
      const playMonoEraBtn = _t('challenge162.play_with_era', `JUGAR ${selEraObj.label.toUpperCase()}`, { era: selEraObj.label.toUpperCase() });

      const resumeText = _t('challenge162.resume', 'CONTINUAR');
      const abandonText = _t('challenge162.abandon', 'ABANDONAR');

      container.innerHTML = `
        <div class="c162-hub-wrap">
          <!-- Header -->
          <div class="c162-hub-header">
            <div>
              <div style="font-family: 'Press Start 2P', monospace; font-size: 13px; color: var(--challenge162-accent); letter-spacing: 0.5px;">
                🏆 ${hubTitle}
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
                ${hubSubtitle}
              </div>
            </div>
            <button id="btn-challenge162-hub-back" class="btn btn-secondary" style="padding: 6px 12px; font-size: 10px; font-family: 'Press Start 2P', monospace;">
              ← ${mainMenuText}
            </button>
          </div>

          <!-- Hall of Records Banner -->
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
          </div>

          <!-- Active Season Resume (if any) -->
          ${hasActiveRun ? `
            <div class="c162-active-run-banner">
              <div>
                <div style="font-family: 'Press Start 2P', monospace; font-size: 10.5px; color: #10b981;">
                  ▶ ${_t('challenge162.active_run', `TEMPORADA EN PROGRESO: ${(this.state.modeConfig && this.state.modeConfig.label) || '162-0 CHALLENGE'}`, { mode: (this.state.modeConfig && this.state.modeConfig.label) || '162-0 CHALLENGE' })}
                </div>
                <div style="font-size: 12px; color: #e2e8f0; margin-top: 4px;">
                  ${_t('challenge162.current_record', `Récord actual: ${this.state.wins} - ${this.state.losses} (${this.state.gamesPlayed}/162 juegos)`, { wins: this.state.wins, losses: this.state.losses, current: this.state.gamesPlayed, total: 162 })}
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

          <!-- Modes Grid -->
          <div class="c162-modes-grid">
            <!-- Card 1: All-Star Classic -->
            <div class="c162-mode-card">
              <div>
                <span class="c162-mode-badge" style="background: rgba(245, 158, 11, 0.2); color: #ffd700; border: 1px solid rgba(245, 158, 11, 0.4);">
                  ${allStarBadge}
                </span>
                <div class="c162-mode-title">👑 ${allStarTitle}</div>
                <div class="c162-mode-desc">
                  ${allStarDesc}
                </div>
              </div>
              <button id="btn-start-allstar-mode" class="btn" style="width: 100%; padding: 10px 14px; font-size: 10.5px; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #ffd700, #f59e0b); color: #000; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);">
                🚀 ${playAllStarBtn}
              </button>
            </div>

            <!-- Card 2: Mono-Team -->
            <div class="c162-mode-card">
              <div>
                <span class="c162-mode-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);">
                  ${monoTeamBadge}
                </span>
                <div class="c162-mode-title">⚔️ ${monoTeamTitle}</div>
                <div class="c162-mode-desc">
                  ${monoTeamDesc}
                </div>
                <div class="c162-sub-selector-grid">
                  ${franchiseListHTML}
                </div>
              </div>
              <button id="btn-start-monoteam-mode" class="btn" style="width: 100%; padding: 10px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #38bdf8, #0284c7); color: #000; border: none; border-radius: 8px; cursor: pointer;">
                ⚾ ${playMonoTeamBtn}
              </button>
            </div>

            <!-- Card 3: Mono-Era -->
            <div class="c162-mode-card">
              <div>
                <span class="c162-mode-badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4);">
                  ${monoEraBadge}
                </span>
                <div class="c162-mode-title">⏳ ${monoEraTitle}</div>
                <div class="c162-mode-desc">
                  ${monoEraDesc}
                </div>
                <div class="c162-sub-selector-grid">
                  ${eraListHTML}
                </div>
              </div>
              <button id="btn-start-monoera-mode" class="btn" style="width: 100%; padding: 10px 14px; font-size: 10px; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #c084fc, #9333ea); color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                ⏳ ${playMonoEraBtn}
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
        if (confirm(_t('challenge162.abandon_confirm', '¿Seguro que deseas abandonar la temporada en progreso? Se perderá el avance actual.'))) {
          this.clear();
          this.renderHub();
        }
      };

      const btnAllStar = document.getElementById('btn-start-allstar-mode');
      if (btnAllStar) btnAllStar.onclick = () => {
        this.setModeConfig({ type: 'all_star', label: '👑 ALL-STAR DREAM TEAM', desc: 'Colección Libre' });
        this.startRosterBuilder();
      };

      const btnMonoTeam = document.getElementById('btn-start-monoteam-mode');
      if (btnMonoTeam) btnMonoTeam.onclick = () => {
        const fran = MLB_FRANCHISES.find(f => f.code === this._selectedFranchise) || MLB_FRANCHISES[0];
        this.setModeConfig({ type: 'mono_team', targetTeam: fran.code, label: `⚔️ MONO-TEAM: ${fran.name.toUpperCase()}`, teamName: fran.name });
        this.startRosterBuilder();
      };

      const btnMonoEra = document.getElementById('btn-start-monoera-mode');
      if (btnMonoEra) btnMonoEra.onclick = () => {
        const era = BASEBALL_ERAS.find(e => e.key === this._selectedEra) || BASEBALL_ERAS[2];
        this.setModeConfig({ type: 'mono_era', targetEra: era.key, label: `⏳ MONO-ERA: ${era.label.toUpperCase()}`, eraName: era.label });
        this.startRosterBuilder();
      };

      container.querySelectorAll('.challenge162-fran-select').forEach(el => {
        el.onclick = () => {
          this._selectedFranchise = el.getAttribute('data-code');
          this.renderHub();
        };
      });

      container.querySelectorAll('.challenge162-era-select').forEach(el => {
        el.onclick = () => {
          this._selectedEra = decodeURIComponent(el.getAttribute('data-key'));
          this.renderHub();
        };
      });
    },

    startRosterBuilder() {
      if (!this.unlockedBatters || !this.unlockedPitchers) {
        this.initUnlocks();
      }
      this._draftLineup = {};
      this._draftPitchers = { SP: [], RP: [] };
      this._activeSlot = null;
      this._searchTerm = '';
      this._activeFilterPill = 'ALL';
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

      // 3. Fill RPs (3)
      const rps = eligiblePitchers.filter(p => (p.role || 'SP').toUpperCase() === 'RP');
      for (let i = 0; i < 3; i++) {
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

        const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

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

        const rpSlotsHTML = [0, 1, 2].map(i => {
          const assigned = this._draftPitchers.RP[i];
          const label = i === 2 ? 'CL' : (i === 1 ? 'SETUP' : 'RP');
          const isActive = this._activeSlot && this._activeSlot.kind === 'RP' && this._activeSlot.key === i;
          return this._renderTradingCardHTML(assigned, label, isActive, 'RP', i);
        }).join('');

        const filledBatters = SLOTS.filter(s => this._draftLineup[s]).length;
        const filledSPs = this._draftPitchers.SP.filter(Boolean).length;
        const filledRPs = this._draftPitchers.RP.filter(Boolean).length;
        const filledCount = filledBatters + filledSPs + filledRPs;
        const complete = filledCount === 17;

        // Calculate average OVR
        const allSlotted = [
          ...SLOTS.map(s => this._draftLineup[s]).filter(Boolean),
          ...this._draftPitchers.SP.filter(Boolean),
          ...this._draftPitchers.RP.filter(Boolean)
        ];
        const avgOVR = allSlotted.length ? (allSlotted.reduce((acc, p) => acc + (p.ovr || 50), 0) / allSlotted.length).toFixed(1) : '—';

        const usedBatterKeys = new Set(SLOTS.map(s => this._draftLineup[s]).filter(Boolean).map(batterUnlockKey));
        const usedPitcherKeys = new Set([...this._draftPitchers.SP, ...this._draftPitchers.RP].filter(Boolean).map(pitcherUnlockKey));

        // Modal Overlay for Card Selection
        let modalOverlayHTML = '';
        if (this._activeSlot) {
          const isPitcherSlot = this._activeSlot.kind !== 'batter';
          const slotName = this._activeSlot.key;
          const slotDisplay = this._activeSlot.kind === 'batter' ? slotName : (this._activeSlot.kind === 'SP' ? `SP${this._activeSlot.key + 1}` : (this._activeSlot.key === 2 ? 'CL' : `RP${this._activeSlot.key + 1}`));

          let pool = isPitcherSlot
            ? eligiblePitchers.filter(p => (p.role || 'SP').toUpperCase() === this._activeSlot.kind)
            : (slotName === 'DH' ? eligibleBatters : eligibleBatters.filter(p => {
                if (p.pos === slotName) return true;
                const secPos = (p.sec_pos || '').split(',').map(s => s.trim());
                return secPos.includes(slotName);
              }));

          // Exclude cards already assigned
          pool = isPitcherSlot
            ? pool.filter(p => !usedPitcherKeys.has(pitcherUnlockKey(p)))
            : pool.filter(p => !usedBatterKeys.has(batterUnlockKey(p)));

          // Sort by OVR descending
          pool.sort((a, b) => (b.ovr || 50) - (a.ovr || 50));

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
        const rotationTitleText = _t('challenge162.rotation_title', 'ROTACION DE ABRIDORES (ROTATION - 5 CARTAS)');
        const bullpenTitleText = _t('challenge162.bullpen_title', 'CUERPO DE RELEVISTAS (BULLPEN - 3 CARTAS)');

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
                ${rosterCountText}: <span style="color:${complete ? '#34d399' : '#f59e0b'};">${filledCount}/17</span>
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

          <!-- Section 2: Starting Rotation (5 Cards) -->
          <div class="c162-roster-section">
            <div class="c162-section-header">
              <span>🧢</span> <span>${rotationTitleText}</span>
            </div>
            <div class="c162-cards-row">${spSlotsHTML}</div>
          </div>

          <!-- Section 3: Bullpen (3 Cards) -->
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
              ${startSeasonText} (${filledCount}/17)
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
            this.startNewChallenge(this._draftLineup, this._draftPitchers, this.getModeConfig());
          };
        }

        const startTopBtn = document.getElementById('btn-challenge162-start-top');
        if (startTopBtn && complete) {
          startTopBtn.onclick = () => {
            this.startNewChallenge(this._draftLineup, this._draftPitchers, this.getModeConfig());
          };
        }
      } catch (err) {
        console.error("Error in renderRosterBuilder:", err);
      }
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

      // ── Batters Rows (with OBP, SLG, OPS, WAR) ───────────────────────────
      const batterRows = SLOTS.map((slot, i) => {
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
        const war = calcBatterWAR(s, slot);

        return `<tr class="c162-tr${i % 2 ? ' c162-tr-alt' : ''}">
          ${td(`<span class="c162-tag-pos">${slot}</span>`)}
          ${td(s.name)}
          ${td(s.ab, { num: true })}
          ${td(s.h, { num: true })}
          ${td(s.doubles || 0, { num: true })}
          ${td(s.triples || 0, { num: true })}
          ${td(s.hr, { num: true, accent: true })}
          ${td(s.rbi, { num: true })}
          ${td(s.bb, { num: true })}
          ${td(s.so, { num: true })}
          ${td(s.sb || 0, { num: true })}
          ${td(s.r || 0, { num: true })}
          ${td(avg, { num: true })}
          ${td(obp, { num: true })}
          ${td(slg, { num: true })}
          ${td(ops, { num: true })}
          ${td(war, { num: true, accent: true })}
        </tr>`;
      }).join('');

      // ── Pitchers Rows (5 SP + 3 RP with IP, WHIP, ERA, WAR) ─────────────
      const allPitchers = [
        ...(S.roster.pitchers.SP || []).map((p, i) => ({ p, roleLabel: `SP${i + 1}`, roleColor: '#38bdf8', roleBg: 'rgba(56,189,248,0.15)' })),
        ...(S.roster.pitchers.RP || []).map((p, i) => {
          const isCloser = i === 2;
          const isSetup = i === 1;
          const roleLabel = isCloser ? 'CL' : (isSetup ? 'SETUP' : 'RP');
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
        const roleBadge = `<span class="c162-tag-role" style="color:${roleColor};background:${roleBg};">${roleLabel}</span>`;
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
        const oppBattersHTML = opp.lineup.slice(0, 9).map(p =>
          `<div style="display:flex;justify-content:space-between;font-size:9.5px;padding:2px 6px;">
            <span style="color:#9ca3af;font-weight:bold;min-width:24px;">${p.assignedSlot || p.pos}</span><span style="color:#e4e4e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:145px;">${p.name}</span><span style="color:var(--challenge162-accent);">${p.ovr}</span>
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
                <div style="font-size:10.5px;color:#e4e4e7;margin-top:4px;font-weight:bold;">${opp.pitcher.cleanName}</div>
                <div style="font-size:8.5px;color:var(--challenge162-accent);margin-top:2px;font-family:'Press Start 2P',monospace;">OVR ${opp.pitcher.ovr}</div>
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

        <!-- Top Horizontal Row: [RECORD & MODE BADGE] + [NEXT GAME RIVAL BOX] SIDE-BY-SIDE -->
        <div class="c162-season-top-row" style="display:flex;justify-content:center;align-items:stretch;gap:14px;flex-wrap:wrap;margin-bottom:14px;max-width:960px;margin-left:auto;margin-right:auto;">
          
          <!-- Left: Record & Mode Summary Card -->
          <div class="c162-record-summary-card" style="flex:0 1 270px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:12px 18px;border-radius:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,215,0,0.25);box-sizing:border-box;">
            <div style="margin-bottom:6px;">
              <span class="c162-mode-badge" style="background:rgba(245,158,11,0.2);color:#ffd700;border:1px solid rgba(245,158,11,0.5);font-size:8.5px;padding:3px 8px;">
                ${(S.modeConfig && S.modeConfig.label) || '162-0 CHALLENGE'}
              </span>
            </div>
            <div style="font-family:'Press Start 2P',monospace;font-size:24px;color:#ffd700;margin:2px 0;">
              ${S.wins} - ${S.losses}
            </div>
            <div style="font-size:9.5px;color:#9ca3af;font-family:'Press Start 2P',monospace;margin-top:2px;">
              ${gamesCountText}
            </div>
            ${streakHTML}
          </div>

          <!-- Right: Next Game Rival Box (if season in progress) -->
          ${nextGameHTML}

        </div>

        <!-- Progress bar -->
        <div style="max-width:680px;margin:0 auto 16px auto;background:rgba(255,255,255,0.08);border-radius:6px;height:8px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,var(--challenge162-accent),#34d399);height:100%;width:${completedPct}%;transition:width 0.3s ease;"></div>
        </div>

        <div style="margin-bottom:18px;">
          ${actionHTML}
        </div>

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
                    <th class="c162-th">POS</th>
                    <th class="c162-th">${_t('challenge162.table_player', 'PLAYER')}</th>
                    <th class="c162-th">AB</th>
                    <th class="c162-th">H</th>
                    <th class="c162-th">2B</th>
                    <th class="c162-th">3B</th>
                    <th class="c162-th" style="color:var(--challenge162-accent);">HR</th>
                    <th class="c162-th">RBI</th>
                    <th class="c162-th">BB</th>
                    <th class="c162-th">SO</th>
                    <th class="c162-th">SB</th>
                    <th class="c162-th">R</th>
                    <th class="c162-th">AVG</th>
                    <th class="c162-th">OBP</th>
                    <th class="c162-th">SLG</th>
                    <th class="c162-th">OPS</th>
                    <th class="c162-th" style="color:var(--challenge162-accent);">WAR</th>
                  </tr></thead>
                  <tbody>${batterRows}</tbody>
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
                    <th class="c162-th">WHIP</th>
                    <th class="c162-th">ERA</th>
                    <th class="c162-th" style="color:var(--challenge162-accent);">WAR</th>
                  </tr></thead>
                  <tbody>${pitcherRows}</tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right Sidebar Panel: Recent Games Feed -->
          <div class="c162-sidebar-panel">
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
      if (btnAuto) btnAuto.onclick = () => this.toggleAutoSim();
      if (btn1) btn1.onclick = () => { this.stopAutoSim(); this.simulateGame(); this.renderSeason(); };
      if (btn10) btn10.onclick = () => { this.stopAutoSim(); this.simulateBatch(10); this.renderSeason(); };
      if (btnUntil) btnUntil.onclick = () => { this.stopAutoSim(); this.simulateUntilLossOrEnd(); this.renderSeason(); };
      if (btnPlayoffs) btnPlayoffs.onclick = () => { this.stopAutoSim(); this.showScreen('screen-challenge-playoffs'); this.renderPlayoffs(); };
      if (btnResults) btnResults.onclick = () => { this.stopAutoSim(); this.state.playoffs.finished = true; this.save(); this.showScreen('screen-challenge-results'); this.renderResults(); };
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

      const oppFranchise = generatePlayoffEnemyTeam(round, S.leagueTeams);
      const oppSP = (oppFranchise.pitchers && oppFranchise.pitchers[0]) || { cleanName: 'As Rival', name: 'As Rival', ovr: 85, hp: 100 };
      const oppBatters = oppFranchise._batters || [];
      const topOppBatter = oppBatters.slice().sort((a, b) => (b.ovr || 0) - (a.ovr || 0))[0] || { name: 'Bateador Rival', ovr: 85 };

      // Your Ace Pitcher (SP1) & Top Slugger
      const topSP = (S.roster.pitchers.SP && S.roster.pitchers.SP[0]) || null;
      const topSPStats = topSP ? S.pitcherStats[pitcherUnlockKey(topSP)] : null;
      const spEra = topSPStats && topSPStats.outs > 0 ? ((topSPStats.er * 27) / topSPStats.outs).toFixed(2) : '3.00';
      
      let topBatter = null, topHR = -1;
      SLOTS.forEach(slot => {
        const p = S.roster.lineup[slot];
        if (p) {
          const stats = S.batterStats[batterUnlockKey(p)];
          if (stats && stats.hr > topHR) { topHR = stats.hr; topBatter = p; }
        }
      });

      // 3-step bracket stepper
      const stepperHTML = PLAYOFF_ROUNDS.map((r, idx) => {
        let badgeClass = 'c162-step-locked', badgeText = _t('challenge162.step_locked', '🔒 BLOQUEADA');
        if (idx < round) { badgeClass = 'c162-step-done'; badgeText = _t('challenge162.step_done', '✔ SUPERADA'); }
        else if (idx === round) { badgeClass = 'c162-step-active'; badgeText = _t('challenge162.step_active', '⚔ EN DISPUTA'); }
        const rTitle = _t('challenge162.bracket_round', `RONDA ${r.round}`, { round: r.round });
        return `
          <div class="c162-step-card ${badgeClass}">
            <div style="font-size:9px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${rTitle}</div>
            <div style="font-size:12px;font-weight:bold;color:#f3f4f6;margin:4px 0;">${r.label}</div>
            <div class="c162-step-badge">${badgeText}</div>
          </div>
        `;
      }).join('');

      const playoffsTitle = _t('challenge162.playoffs_title', 'POSTEMPORADA DE BASEROGUE');
      const playoffsSubtitle = _t('challenge162.playoffs_subtitle', `3 Rondas a Partido Único (Muerte Súbita) · ${cfg.desc}`, { desc: cfg.desc });
      const yourTeamLabel = _t('challenge162.your_team', `TU EQUIPO (${S.wins}-${S.losses})`, { wins: S.wins, losses: S.losses });
      const acePitcherLabel = _t('challenge162.ace_pitcher', 'As Abridor');
      const seasonEraLabel = _t('challenge162.season_era', 'ERA Temporada');
      const offLeaderLabel = _t('challenge162.offensive_leader', 'Líder Ofensivo');
      const rosterRecLabel = _t('challenge162.roster_record', 'Récord de Roster');
      const draftedCardsLabel = _t('challenge162.drafted_cards', '17 Cartas Drafteadas');
      const bossDiffLabel = _t('challenge162.boss_difficulty', 'Dificultad Boss');
      const statBoostLabel = _t('challenge162.stat_boost', `+${cfg.statBoost} a todas las stats`, { boost: cfg.statBoost });
      const rivalHpLabel = _t('challenge162.rival_sp_hp', 'Vida SP Rival');
      const offDangerLabel = _t('challenge162.offensive_danger', 'Peligro Ofensivo');
      const playMatchBtnText = _t('challenge162.play_playoff_btn', `🎲 ¡DISPUTAR ${cfg.label}! (PARTIDO A MUERTE)`, { label: cfg.label });
      const viewStatsBtnText = _t('challenge162.view_stats_table', '📊 VER TABLA DE STATS');

      container.innerHTML = `
        <!-- Header -->
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:32px;margin-bottom:4px;">🏆</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:16px;color:#ffd700;letter-spacing:1px;margin-bottom:6px;">
            ${playoffsTitle}
          </div>
          <div style="font-size:12px;color:#cbd5e1;">
            ${playoffsSubtitle}
          </div>
        </div>

        <!-- Bracket Stepper -->
        <div class="c162-bracket-stepper" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:24px;">
          ${stepperHTML}
        </div>

        <!-- Tale of the Tape (Cara a Cara) -->
        <div class="c162-tale-container" style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:20px;margin-bottom:24px;">
          
          <!-- Your Team Card -->
          <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:#34d399;margin-bottom:10px;">
              ⚾ ${yourTeamLabel}
            </div>
            <div style="font-size:12px;color:#f3f4f6;font-weight:bold;margin-bottom:12px;">
              ${acePitcherLabel}: <span style="color:#ffd700;">${topSP ? topSP.name : 'SP'}</span>
            </div>
            <div style="font-size:11px;color:#9ca3af;line-height:1.6;margin-bottom:10px;text-align:left;background:rgba(0,0,0,0.3);padding:10px;border-radius:8px;">
              <div>🧢 <strong>${seasonEraLabel}:</strong> ${spEra}</div>
              <div>🔥 <strong>${offLeaderLabel}:</strong> ${topBatter ? topBatter.name : 'Bateador'}</div>
              <div>⭐ <strong>${rosterRecLabel}:</strong> ${draftedCardsLabel}</div>
            </div>
          </div>

          <!-- VS Badge -->
          <div style="text-align:center;padding:0 8px;">
            <div style="font-family:'Press Start 2P',monospace;font-size:20px;color:#ffd700;text-shadow:0 0 16px rgba(255,215,0,0.6);margin-bottom:6px;">VS</div>
            <div style="font-size:18px;">⚔️</div>
          </div>

          <!-- Enemy Team Card -->
          <div style="background:${round === 2 ? 'rgba(239,68,68,0.08)' : 'rgba(56,189,248,0.06)'};border:1px solid ${round === 2 ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.3)'};border-radius:12px;padding:16px;text-align:center;">
            <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:${round === 2 ? '#f87171' : '#38bdf8'};margin-bottom:10px;">
              👑 ${oppFranchise.name}
            </div>
            <div style="font-size:12px;color:#f3f4f6;font-weight:bold;margin-bottom:12px;">
              ${acePitcherLabel}: <span style="color:#ffd700;">${oppSP.cleanName || oppSP.name} (OVR ${oppSP.ovr})</span>
            </div>
            <div style="font-size:11px;color:#9ca3af;line-height:1.6;margin-bottom:10px;text-align:left;background:rgba(0,0,0,0.3);padding:10px;border-radius:8px;">
              <div>⚡ <strong>${bossDiffLabel}:</strong> ${statBoostLabel}</div>
              <div>🩸 <strong>${rivalHpLabel}:</strong> ${oppSP.hp} HP (${Math.round((cfg.hpMult - 1) * 100)}% extra)</div>
              <div>💣 <strong>${offDangerLabel}:</strong> ${topOppBatter ? topOppBatter.name : 'Rival'} (OVR ${topOppBatter ? topOppBatter.ovr : 85})</div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap;">
          <button id="challenge162-play-playoff-match" class="btn" style="padding:14px 26px;font-size:12px;font-family:'Press Start 2P',monospace;background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;border:2px solid #fff;box-shadow:0 0 24px rgba(255,215,0,0.5);cursor:pointer;transition:transform 0.15s ease;">
            ${playMatchBtnText}
          </button>
          <button id="challenge162-playoff-back-season" class="btn btn-secondary" style="padding:14px 22px;font-size:11px;">
            ${viewStatsBtnText}
          </button>
        </div>
      `;

      const btn = document.getElementById('challenge162-play-playoff-match');
      if (btn) btn.onclick = () => this.startPlayoffRound();
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

      if (wonWS && window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('win');
      }

      const _t = (key, fallback, params) => (typeof window.t === 'function' ? window.t(key, params) : fallback);

      // Map slot positions and DEF for batters:
      const batterSlotMap = {};
      SLOTS.forEach(slot => {
        const p = S.roster.lineup[slot];
        if (p) {
          batterSlotMap[batterUnlockKey(p)] = { pos: slot, def: p.def || 50 };
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
        if (p) pitcherCards.push({ player: p, label: i === 2 ? 'CL' : `RP${i + 1}` });
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
        const roundName = PLAYOFF_ROUNDS[S.playoffs.round] ? PLAYOFF_ROUNDS[S.playoffs.round].label : 'Playoffs';
        const poEndTitle = _t('challenge162.playoff_end_title', 'FIN DE LA POSTEMPORADA');
        const poEndDesc = _t('challenge162.playoff_end_desc', `Gran campaña finalizada en: ${roundName}`, { round: roundName });
        headerHTML = `
          <div style="text-align:center;margin-bottom:8px;">
            <div style="font-size:24px;margin-bottom:2px;">🥈</div>
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

      const mvpAwardLabel = _t('challenge162.mvp_award', '🏆 MVP DE LA DINASTIA');
      const cyAwardLabel = _t('challenge162.cy_young_award', '🧢 PREMIO CY YOUNG');
      const hrAwardLabel = _t('challenge162.hr_king_award', '💣 REY DEL CUADRANGULAR');
      const rpAwardLabel = _t('challenge162.reliever_award', '🔥 RELEVISTA DEL ANO');
      const ringLabel = _t('challenge162.ring_of_champions', '💍 PLANTILLA DE 17 CAMPEONES (ROSTER COMPLETO)');
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
              ${dynastyStatusVal}
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

        <!-- Ring of Champions (All 17 Trading Cards in 2 neat rows) -->
        <div style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 10px 18px 10px;margin-bottom:14px;">
          <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:var(--challenge162-accent);margin-bottom:16px;text-align:center;letter-spacing:0.5px;">
            ${ringLabel}
          </div>
          <div class="c162-all-champions-grid">
            <div class="c162-champions-row">
              ${lineupCardsHTML}
            </div>
            <div class="c162-champions-row" style="margin-top:14px;">
              ${pitcherCardsHTML}
            </div>
          </div>
        </div>

        <!-- Action CTAs -->
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
          <button id="challenge162-new-challenge-btn" class="btn" style="padding:8px 16px;font-size:9.5px;font-family:'Press Start 2P',monospace;background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;border:2px solid #fff;box-shadow:0 0 14px rgba(255,215,0,0.4);cursor:pointer;">
            ${newChalBtnText}
          </button>
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
      if (btnBack1) btnBack1.onclick = () => this.renderHub();
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
