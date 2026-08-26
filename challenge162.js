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
    const hp = Math.max(75, Math.min(200, Math.round(75 + (staVal - 20) * (125 / 105))));
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

  function buildFranchiseDecadeTeam(code, decade) {
    const franchiseNames = (window.PlayersDB && window.PlayersDB.FranchiseNames) || {};
    const batterHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.batters) || {};
    const pitcherHistory = (window.PlayerTeamHistory && window.PlayerTeamHistory.pitchers) || {};
    const fullBatterPool = getBatterPool();
    const fullPitcherPool = getPitcherPool();
    const usedIDs = new Set();

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
  // Round 0 (Divisional): 3rd-strongest franchise (Ace SP + Playoff Bullpen)
  // Round 1 (Championship): 2nd-strongest franchise (Elite Cy Young Ace + Setup + Closer)
  // Round 2 (World Series): #1 ABSOLUTE STRONGEST FRANCHISE (Legendary Ace SP + Lockdown Closer)
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
    const closerObj = _pickSecondFranchisePitcher(chosen.t.code, chosen.t.decade, pitcherUnlockKey(franchiseTeam.pitcher)) || franchiseTeam.reliever;
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
      conEffective = 90 + (con - 90) * 0.40;
    }

    let pwrEffective = pwr;
    if (pwr > 75 && pwr <= 90) {
      pwrEffective = 75 + (pwr - 75) * 0.65;
    } else if (pwr > 90) {
      pwrEffective = 75 + (15 * 0.65) + (pwr - 90) * 0.40;
    }

    // SO: Driven directly by dedicated K Avoidance attribute (k_avd / k_avoid) & Pitcher K/9:
    // Elite strikeout aces (K/9 85-110+ e.g. Sale, Pedro, Ryan, Score) generate authentic 250-295 K in 220-240 IP.
    // Quality starters (K/9 50-65 e.g. Santana, Root) generate 140-175 K.
    // Soft-tossers / sinkerballers (K/9 10-35 e.g. Bill Lee, Randy Jones) generate 65-105 K.
    const rawKAvd = batter.k_avd !== undefined ? batter.k_avd : (batter.k_avoid !== undefined ? batter.k_avoid : (batter.k_avoid_val !== undefined ? batter.k_avoid_val : conEffective));
    const kAvoid = rawKAvd < 35 ? (42 + (rawKAvd - 35) * 0.35) : (rawKAvd > 90 ? (90 + (rawKAvd - 90) * 0.50) : rawKAvd);
    const kPitcherBoost = pK9 <= 65 ? (pK9 - 50) * 0.0020 : (15 * 0.0020 + (pK9 - 65) * 0.0032);
    let pSO = 0.185 - (kAvoid - 50) * 0.00160 + kPitcherBoost;
    pSO = Math.max(0.040, Math.min(0.38, pSO));

    const pInPlay = Math.max(0.20, 1 - pBB - pSO);

    // Hits: Target Batting Average scaled across non-walk at-bats (1 - pBB)
    // Ensures high-walk sluggers (130+ BB e.g. Ruth, Bonds, Williams) keep their authentic .370-.395 AVG:
    const defEfficiency = (pitcher && pitcher._fieldingDef) !== undefined ? pitcher._fieldingDef : 50;
    const defAdj = (defEfficiency - 50) * 0.00028;

    let targetAvg, pHR;
    if (isUserBatting) {
      targetAvg = 0.258 + (conEffective - 50) * 0.00140 - (pH9 - 50) * 0.00070 - defAdj;
      pHR = 0.028 + (pwrEffective - 50) * 0.00095 - (pHR9 - 50) * 0.00028;
    } else {
      // Opponent batting vs User pitching: calibrated to deliver authentic 2.20-3.50 ERAs for quality starters and 1.80-2.80 for elite relievers:
      targetAvg = 0.248 + (conEffective - 50) * 0.00130 - (pH9 - 50) * 0.00075 - defAdj;
      pHR = 0.028 + (pwrEffective - 50) * 0.00090 - (pHR9 - 50) * 0.00030;
    }

    targetAvg = Math.max(0.14, Math.min(0.38, targetAvg));
    let pTotalHit = (1 - pBB) * targetAvg;
    pTotalHit = Math.min(pTotalHit, pInPlay - 0.01);

    pHR = Math.max(0.001, Math.min(0.085, pHR));
    pHR = Math.min(pHR, pTotalHit * 0.50);
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
        return true;
      } catch (e) { return false; }
    },
    hasSave() { return !!localStorage.getItem(SAVE_KEY); },
    clear() {
      this.state = null;
      localStorage.removeItem(SAVE_KEY);
    },

    // ── Roster building ────────────────────────────────────────────────────
    _optimizeBattingOrder(lineup) {
      const slots = SLOTS.filter(s => lineup && lineup[s]);
      if (slots.length < 9) return slots;
      const mapped = slots.map(slot => ({ ...lineup[slot], _slotKey: slot }));
      const optimized = optimizeLineupArray(mapped);
      return optimized.map(p => p._slotKey);
    },

    startNewChallenge(lineup, pitchers, customModeConfig) {
      const leagueTeams = buildLeagueTeams();
      const cfg = customModeConfig || this.getModeConfig();
      const battingOrder = this._optimizeBattingOrder(lineup);
      this.state = {
        v: 1,
        modeConfig: cfg,
        roster: { lineup, battingOrder, pitchers },
        leagueTeams,
        schedule: buildSeasonSchedule(leagueTeams),
        gamesPlayed: 0, wins: 0, losses: 0, streak: 0,
        safetyShields: 2, safetyUsed: 0,
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
      // RP[0] = Designated Closer (CL)
      // RP[1] = Setup Reliever (SETUP)
      // RP[2] = Middle Reliever (RP)
      const closer = rpList[0] || rpList[1] || rpList[2];
      const setup  = rpList[1] || rpList[0] || rpList[2];
      const middle = rpList[2] || rpList[1] || rpList[0];
      const userRelievers = [middle, setup, closer];

      const sched = S.schedule[gameIdx];
      const opp = getFranchiseDecadeTeam(sched.code, sched.decade);
      const userLineup = S.roster.battingOrder.map(slot => S.roster.lineup[slot]).filter(Boolean);

      let attempt = this._simulateNaturalGame(userLineup, userSP, userRelievers, opp, gameIdx);
      let won = attempt.userRuns > attempt.oppRuns;

      if (S.safetyShields === undefined) S.safetyShields = 2;

      // ── Safety Net (Partidos de Seguridad / Re-sim on loss if shield available) ──
      let usedSafety = false;
      if (!won && S.safetyShields > 0) {
        const retryAttempt = this._simulateNaturalGame(userLineup, userSP, userRelievers, opp, gameIdx);
        S.safetyShields--;
        S.safetyUsed = (S.safetyUsed || 0) + 1;
        usedSafety = true;
        if (retryAttempt.userRuns > retryAttempt.oppRuns) {
          attempt = retryAttempt;
          won = true;
        } else {
          if ((retryAttempt.userRuns - retryAttempt.oppRuns) > (attempt.userRuns - attempt.oppRuns)) {
            attempt = retryAttempt;
          }
          won = false;
        }
      }

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

      S.gamesPlayed++;
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

      const logEntry = { opponent: opp.name, userRuns: attempt.userRuns, oppRuns: attempt.oppRuns, won, inning: attempt.inning, usedSafety };
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
        // spd < 50 -> 1-3 SB (catchers, slow sluggers)
        // spd 50-70 -> 5-12 SB (average runner)
        // spd 75-85 -> 20-35 SB (Pee Wee Reese, Betts, Altuve)
        // spd 90-110+ -> 50-75+ SB (Rickey Henderson, Vince Coleman, Lou Brock, Ohtani)
        if (isUserBatting && (outcome === 'BB' || outcome === '1B') && bases[0] === batter && !bases[1]) {
          const runnerSpd = batter.spd !== undefined ? batter.spd : 50;
          let stealChance = 0.004;
          if (runnerSpd >= 50) {
            const t = (runnerSpd - 50) / 50.0;
            stealChance = 0.015 + Math.pow(Math.max(0, t), 2.2) * 0.38;
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

    // ── Playoffs (Authentic Baseball Simulator & Live Viewer) ─────────────
    canStartPlayoffs() {
      return this.state && this.state.gamesPlayed >= SEASON_LENGTH && this.state.wins >= PLAYOFF_MIN_WINS && !this.state.playoffs.finished;
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
      const oppFranchise = generatePlayoffEnemyTeam(round, S.leagueTeams);
      const opp = oppFranchise.team || oppFranchise;

      const userLineup = S.roster.battingOrder.map(slot => S.roster.lineup[slot]).filter(Boolean);
      const spList = S.roster.pitchers.SP;
      const rpList = S.roster.pitchers.RP;
      // In playoffs: Ace SP1 starts round 1 & 3; SP2 starts round 2
      const userSP = spList[round % spList.length] || spList[0];
      const closer = rpList[0] || rpList[1] || rpList[2];
      const setup  = rpList[1] || rpList[0] || rpList[2];
      const middle = rpList[2] || rpList[1] || rpList[0];
      const userRelievers = [middle, setup, closer];

      const detailedGame = this._simulatePlayoffGameDetailed(userLineup, userSP, userRelievers, opp, round);
      this._activePlayoffSim = {
        game: detailedGame,
        currentStep: 0,
        autoPlay: false,
        timer: null,
        finished: false
      };
      this._activePlayoffTab = 'broadcast';
      this._selectedPlayoffBoxScoreIndex = -1;

      this.showScreen('screen-challenge-playoffs');
      this.renderPlayoffLiveGame();
    },

    _simulatePlayoffGameDetailed(userLineup, userSP, userRelievers, opp, round) {
      let userRuns = 0, oppRuns = 0;
      let userIdx = 0, oppIdx = 0;
      let userHits = 0, oppHits = 0;
      const inningLimit = 20;
      let inning = 1;
      const events = [];
      const awayLinescore = [];
      const homeLinescore = [];

      const userMaxInnings = Math.min(6, this._getStarterMaxInnings(userSP));
      const oppPitchers = opp.pitchers || [opp.pitcher, opp.reliever, opp.closer];
      const oppSP = oppPitchers[0] || { name: 'As Rival', h9: 80, k9: 80, bb9: 75, hr9: 75, role: 'SP', ovr: 90 };
      const oppRP = oppPitchers[1] || { name: 'Setup Rival', h9: 78, k9: 78, bb9: 70, hr9: 70, role: 'RP', ovr: 88 };
      const oppCL = oppPitchers[2] || { name: 'Closer Rival', h9: 88, k9: 90, bb9: 80, hr9: 80, role: 'CL', ovr: 95 };
      const oppMaxInnings = Math.min(6, this._getStarterMaxInnings(oppSP));

      // Team defense values
      const fielders = userLineup.filter(p => (p.assignedSlot || p.pos) !== 'DH');
      const userTeamDef = fielders.length
        ? fielders.reduce((s, p) => s + (p.def !== undefined ? p.def : 50), 0) / fielders.length
        : 65;

      const oppFielders = (opp.lineup || opp._batters || []).filter(p => (p.assignedSlot || p.pos) !== 'DH');
      const oppTeamDef = oppFielders.length
        ? oppFielders.reduce((s, p) => s + (p.def !== undefined ? p.def : 50), 0) / oppFielders.length
        : 65;

      // Batting stats tracking for Box Score:
      const awayBattersMap = {};
      userLineup.forEach(p => {
        awayBattersMap[p.name] = { name: p.name, pos: p.assignedSlot || p.pos || 'DH', ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, sb: 0, ovr: Math.round(p.ovr || 80) };
      });
      const homeBattersMap = {};
      (opp.lineup || opp._batters || []).forEach(p => {
        homeBattersMap[p.name] = { name: p.name, pos: p.assignedSlot || p.pos || 'DH', ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, sb: 0, ovr: Math.round(p.ovr || 80) };
      });

      // Pitching stats tracking for Box Score:
      const awayPitchersMap = {};
      const homePitchersMap = {};

      const getAwayPitcherObj = (p) => {
        const k = p.name || 'Pitcher';
        if (!awayPitchersMap[k]) awayPitchersMap[k] = { name: k, role: p.role || 'SP', outs: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, hr: 0, pitches: 0, decision: '', ovr: Math.round(p.ovr || 80) };
        return awayPitchersMap[k];
      };
      const getHomePitcherObj = (p) => {
        const k = p.cleanName || p.name || 'Pitcher';
        if (!homePitchersMap[k]) homePitchersMap[k] = { name: k, role: p.role || 'SP', outs: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, hr: 0, pitches: 0, decision: '', ovr: Math.round(p.ovr || 80) };
        return homePitchersMap[k];
      };

      // Playoff pitching selection logic:
      const getOppPitcherForInning = (inn, uR, oR) => {
        if (inn <= oppMaxInnings) return oppSP;
        if (inn === 9 || inn >= 10 || (inn === 8 && oR >= uR && oR - uR <= 3)) return oppCL;
        return oppRP;
      };

      const getUserPitcherForInning = (inn, uR, oR) => {
        if (inn <= userMaxInnings) return userSP;
        if (inn === 9 || inn >= 10 || (inn === 8 && uR >= oR && uR - oR <= 3)) return userRelievers[2] || userRelievers[1] || userSP;
        if (inn === 7 || inn === 8) return userRelievers[1] || userRelievers[0] || userSP;
        return userRelievers[0] || userSP;
      };

      while (inning <= 9 || (userRuns === oppRuns && inning <= inningLimit)) {
        // ── TOP of the Inning: Away (User) Bats vs Home (Opp) Pitcher ──
        const oppPitcherToday = getOppPitcherForInning(inning, userRuns, oppRuns);
        oppPitcherToday._fieldingDef = oppTeamDef;
        const hPitcherStat = getHomePitcherObj(oppPitcherToday);

        let topRuns = 0;
        let topOuts = 0;
        let bases = [null, null, null];

        while (topOuts < 3) {
          const slot = userIdx % userLineup.length;
          const batter = userLineup[slot];
          userIdx++;
          const bStat = awayBattersMap[batter.name];
          const outsBefore = topOuts;
          const basesBefore = bases.slice();

          const outcome = simPaOutcome(batter, oppPitcherToday, true);
          let runsThisPA = 0;
          let stolenBase = false;

          // Simulated pitch count for event realism
          const balls = outcome === 'BB' ? 4 : (Math.random() < 0.4 ? 2 : (Math.random() < 0.5 ? 1 : 0));
          const strikes = outcome === 'SO' ? 3 : (outcome === 'BB' ? Math.floor(Math.random() * 3) : (Math.random() < 0.5 ? 2 : 1));
          const pitchesInPA = balls + strikes + (outcome === 'SO' || outcome === 'BB' ? 0 : 1);
          if (hPitcherStat) hPitcherStat.pitches += pitchesInPA;

          if (outcome === 'OUT') {
            topOuts++;
            if (bStat) bStat.ab++;
            if (hPitcherStat) hPitcherStat.outs++;
          } else if (outcome === 'SO') {
            topOuts++;
            if (bStat) { bStat.ab++; bStat.so++; }
            if (hPitcherStat) { hPitcherStat.outs++; hPitcherStat.so++; }
          } else if (outcome === 'BB') {
            if (bStat) bStat.bb++;
            if (hPitcherStat) hPitcherStat.bb++;
            const scorer = forceWalk(bases, batter);
            const scorers = scorer ? [scorer] : [];
            runsThisPA = scorers.length;
            scorers.forEach(r => {
              if (r && awayBattersMap[r.name]) awayBattersMap[r.name].r++;
            });
            if (runsThisPA && bStat) bStat.rbi += runsThisPA;
            if (hPitcherStat) { hPitcherStat.er += runsThisPA; hPitcherStat.r += runsThisPA; }
          } else if (outcome === 'HR') {
            userHits++;
            if (bStat) { bStat.ab++; bStat.h++; bStat.hr++; bStat.r++; }
            if (hPitcherStat) { hPitcherStat.h++; hPitcherStat.hr++; }
            const runnersOn = bases.filter(Boolean);
            runsThisPA = 1 + runnersOn.length;
            runnersOn.forEach(r => {
              if (r && awayBattersMap[r.name]) awayBattersMap[r.name].r++;
            });
            bases = [null, null, null];
            if (bStat) bStat.rbi += runsThisPA;
            if (hPitcherStat) { hPitcherStat.er += runsThisPA; hPitcherStat.r += runsThisPA; }
          } else {
            // 1B, 2B, 3B
            userHits++;
            const basesToAdvance = outcome === '1B' ? 1 : (outcome === '2B' ? 2 : 3);
            if (bStat) {
              bStat.ab++; bStat.h++;
              if (outcome === '2B') bStat.doubles++;
              if (outcome === '3B') bStat.triples++;
            }
            if (hPitcherStat) hPitcherStat.h++;
            const scorers = advanceOnHit(bases, batter, basesToAdvance, topOuts);
            runsThisPA = scorers.length;
            scorers.forEach(r => {
              if (r && awayBattersMap[r.name]) awayBattersMap[r.name].r++;
            });
            if (runsThisPA && bStat) bStat.rbi += runsThisPA;
            if (hPitcherStat) { hPitcherStat.er += runsThisPA; hPitcherStat.r += runsThisPA; }
          }

          if ((outcome === 'BB' || outcome === '1B') && bases[0] === batter && !bases[1]) {
            const runnerSpd = batter.spd !== undefined ? batter.spd : 50;
            let stealChance = 0.004;
            if (runnerSpd >= 50) {
              const t = (runnerSpd - 50) / 50.0;
              stealChance = 0.015 + Math.pow(Math.max(0, t), 2.2) * 0.38;
            }
            if (Math.random() < stealChance) {
              bases[1] = batter;
              bases[0] = null;
              stolenBase = true;
              if (bStat) bStat.sb++;
            }
          }

          topRuns += runsThisPA;
          userRuns += runsThisPA;

          // Compute snapshot lines for duel card:
          const batterLine = `${bStat.h}-${bStat.ab}${bStat.hr > 0 ? `, ${bStat.hr} HR` : ''}${bStat.rbi > 0 ? `, ${bStat.rbi} RBI` : ''}`;
          const pOuts = hPitcherStat.outs;
          const pIp = `${Math.floor(pOuts / 3)}.${pOuts % 3}`;
          const pitcherLine = `${pIp} IP, ${hPitcherStat.h} H, ${hPitcherStat.er} ER, ${hPitcherStat.so} K`;

          events.push({
            stepIndex: events.length,
            inning,
            half: 'TOP',
            outs: outsBefore,
            newOuts: topOuts,
            bases: basesBefore,
            newBases: bases.slice(),
            batter: { name: batter.name, pos: batter.assignedSlot || batter.pos || 'DH', ovr: Math.round(batter.ovr || 80), line: batterLine },
            pitcher: { name: oppPitcherToday.cleanName || oppPitcherToday.name, role: oppPitcherToday.role || 'SP', ovr: Math.round(oppPitcherToday.ovr || 80), line: pitcherLine, pitches: hPitcherStat.pitches },
            outcome,
            runsScored: runsThisPA,
            stolenBase,
            userRuns,
            oppRuns,
            userHits,
            oppHits,
            balls,
            strikes,
            currentInningAwayRuns: topRuns
          });
        }
        awayLinescore.push(topRuns);

        // Check if home team is ahead in bottom 9th:
        if (inning >= 9 && oppRuns > userRuns) {
          homeLinescore.push('X');
          break;
        }

        // ── BOTTOM of the Inning: Home (Opp) Bats vs Away (User) Pitcher ──
        const userPitcherToday = getUserPitcherForInning(inning, userRuns, oppRuns);
        userPitcherToday._fieldingDef = userTeamDef;
        const aPitcherStat = getAwayPitcherObj(userPitcherToday);

        let botRuns = 0;
        let botOuts = 0;
        bases = [null, null, null];
        const oppLineup = opp.lineup || opp._batters || [];

        while (botOuts < 3) {
          const slot = oppIdx % oppLineup.length;
          const batter = oppLineup[slot] || { name: "Bateador Rival", ovr: 80 };
          oppIdx++;
          const bStat = homeBattersMap[batter.name];
          const outsBefore = botOuts;
          const basesBefore = bases.slice();

          const outcome = simPaOutcome(batter, userPitcherToday, false);
          let runsThisPA = 0;
          let stolenBase = false;

          const balls = outcome === 'BB' ? 4 : (Math.random() < 0.4 ? 2 : (Math.random() < 0.5 ? 1 : 0));
          const strikes = outcome === 'SO' ? 3 : (outcome === 'BB' ? Math.floor(Math.random() * 3) : (Math.random() < 0.5 ? 2 : 1));
          const pitchesInPA = balls + strikes + (outcome === 'SO' || outcome === 'BB' ? 0 : 1);
          if (aPitcherStat) aPitcherStat.pitches += pitchesInPA;

          if (outcome === 'OUT') {
            botOuts++;
            if (bStat) bStat.ab++;
            if (aPitcherStat) aPitcherStat.outs++;
          } else if (outcome === 'SO') {
            botOuts++;
            if (bStat) { bStat.ab++; bStat.so++; }
            if (aPitcherStat) { aPitcherStat.outs++; aPitcherStat.so++; }
          } else if (outcome === 'BB') {
            if (bStat) bStat.bb++;
            if (aPitcherStat) aPitcherStat.bb++;
            const scorer = forceWalk(bases, batter);
            const scorers = scorer ? [scorer] : [];
            runsThisPA = scorers.length;
            scorers.forEach(r => {
              if (r && homeBattersMap[r.name]) homeBattersMap[r.name].r++;
            });
            if (runsThisPA && bStat) bStat.rbi += runsThisPA;
            if (aPitcherStat) { aPitcherStat.er += runsThisPA; aPitcherStat.r += runsThisPA; }
          } else if (outcome === 'HR') {
            oppHits++;
            if (bStat) { bStat.ab++; bStat.h++; bStat.hr++; bStat.r++; }
            if (aPitcherStat) { aPitcherStat.h++; aPitcherStat.hr++; }
            const runnersOn = bases.filter(Boolean);
            runsThisPA = 1 + runnersOn.length;
            runnersOn.forEach(r => {
              if (r && homeBattersMap[r.name]) homeBattersMap[r.name].r++;
            });
            bases = [null, null, null];
            if (bStat) bStat.rbi += runsThisPA;
            if (aPitcherStat) { aPitcherStat.er += runsThisPA; aPitcherStat.r += runsThisPA; }
          } else {
            // 1B, 2B, 3B
            oppHits++;
            const basesToAdvance = outcome === '1B' ? 1 : (outcome === '2B' ? 2 : 3);
            if (bStat) {
              bStat.ab++; bStat.h++;
              if (outcome === '2B') bStat.doubles++;
              if (outcome === '3B') bStat.triples++;
            }
            if (aPitcherStat) aPitcherStat.h++;
            const scorers = advanceOnHit(bases, batter, basesToAdvance, botOuts);
            runsThisPA = scorers.length;
            scorers.forEach(r => {
              if (r && homeBattersMap[r.name]) homeBattersMap[r.name].r++;
            });
            if (runsThisPA && bStat) bStat.rbi += runsThisPA;
            if (aPitcherStat) { aPitcherStat.er += runsThisPA; aPitcherStat.r += runsThisPA; }
          }

          if ((outcome === 'BB' || outcome === '1B') && bases[0] === batter && !bases[1]) {
            const runnerSpd = batter.spd !== undefined ? batter.spd : 50;
            let stealChance = 0.004;
            if (runnerSpd >= 50) {
              const t = (runnerSpd - 50) / 50.0;
              stealChance = 0.015 + Math.pow(Math.max(0, t), 2.2) * 0.38;
            }
            if (Math.random() < stealChance) {
              bases[1] = batter;
              bases[0] = null;
              stolenBase = true;
              if (bStat) bStat.sb++;
            }
          }

          botRuns += runsThisPA;
          oppRuns += runsThisPA;

          const batterLine = `${bStat.h}-${bStat.ab}${bStat.hr > 0 ? `, ${bStat.hr} HR` : ''}${bStat.rbi > 0 ? `, ${bStat.rbi} RBI` : ''}`;
          const pOuts = aPitcherStat.outs;
          const pIp = `${Math.floor(pOuts / 3)}.${pOuts % 3}`;
          const pitcherLine = `${pIp} IP, ${aPitcherStat.h} H, ${aPitcherStat.er} ER, ${aPitcherStat.so} K`;

          events.push({
            stepIndex: events.length,
            inning,
            half: 'BOT',
            outs: outsBefore,
            newOuts: botOuts,
            bases: basesBefore,
            newBases: bases.slice(),
            batter: { name: batter.name, pos: batter.assignedSlot || batter.pos || 'DH', ovr: Math.round(batter.ovr || 80), line: batterLine },
            pitcher: { name: userPitcherToday.name, role: userPitcherToday.role || 'SP', ovr: Math.round(userPitcherToday.ovr || 80), line: pitcherLine, pitches: aPitcherStat.pitches },
            outcome,
            runsScored: runsThisPA,
            stolenBase,
            userRuns,
            oppRuns,
            userHits,
            oppHits,
            balls,
            strikes,
            currentInningHomeRuns: botRuns
          });

          // Walk-off win check in bottom of 9th or extras:
          if (inning >= 9 && oppRuns > userRuns) {
            break;
          }
        }
        homeLinescore.push(botRuns);

        if (inning >= 9 && userRuns !== oppRuns) {
          break;
        }

        inning++;
      }

      // Format decisions:
      const won = userRuns > oppRuns;
      const awayPitchersList = Object.values(awayPitchersMap);
      const homePitchersList = Object.values(homePitchersMap);

      if (won) {
        if (awayPitchersList[0]) awayPitchersList[0].decision = 'W';
        if (homePitchersList[0]) homePitchersList[0].decision = 'L';
        if (awayPitchersList.length > 1 && (userRuns - oppRuns) <= 3) {
          awayPitchersList[awayPitchersList.length - 1].decision = 'SV';
        }
      } else {
        if (homePitchersList[0]) homePitchersList[0].decision = 'W';
        if (awayPitchersList[0]) awayPitchersList[0].decision = 'L';
        if (homePitchersList.length > 1 && (oppRuns - userRuns) <= 3) {
          homePitchersList[homePitchersList.length - 1].decision = 'SV';
        }
      }

      const _t = (key, fallback) => (typeof window.t === 'function' ? window.t(key) : fallback);
      const roundTitleKey = round === 0 ? 'challenge162.round_1_title' : (round === 1 ? 'challenge162.round_2_title' : 'challenge162.round_3_title');
      const roundTitle = _t(roundTitleKey, `Ronda ${round + 1}`);

      return {
        events,
        awayTeam: {
          name: this.getUserTeamName(),
          runs: userRuns,
          hits: userHits,
          errors: 0,
          linescore: awayLinescore,
          batting: Object.values(awayBattersMap),
          pitching: awayPitchersList
        },
        homeTeam: {
          name: opp.name,
          runs: oppRuns,
          hits: oppHits,
          errors: 0,
          linescore: homeLinescore,
          batting: Object.values(homeBattersMap),
          pitching: homePitchersList
        },
        userLineup: userLineup.map(b => ({ name: b.name, pos: b.assignedSlot || b.pos || 'DH', ovr: Math.round(b.ovr || 80) })),
        oppLineup: (opp.lineup || opp._batters || []).slice(0, 9).map(b => ({ name: b.name, pos: b.assignedSlot || b.pos || 'DH', ovr: Math.round(b.ovr || 80) })),
        userPitchers: [userSP, userRelievers[1], userRelievers[2]],
        oppPitchers: oppPitchers,
        won,
        finalInning: Math.max(9, awayLinescore.length),
        round,
        roundTitle
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

      // Base situation banner description
      let situationText = _t('challenge162.playoff_runners_bases_empty', 'Bases Limpias');
      if (b1 && b2 && b3) situationText = _t('challenge162.playoff_runners_loaded', '¡Bases Llenas!');
      else if (b1 && b2)  situationText = _t('challenge162.playoff_runners_1b_2b', 'Corredores en 1ra y 2da');
      else if (b1 && b3)  situationText = _t('challenge162.playoff_runners_1b_3b', 'Corredores en las Esquinas');
      else if (b2 && b3)  situationText = _t('challenge162.playoff_runners_2b_3b', 'Corredores en 2da y 3ra');
      else if (b1)        situationText = _t('challenge162.playoff_runners_1b', 'Corredor en 1ra');
      else if (b2)        situationText = _t('challenge162.playoff_runners_2b', 'Corredor en 2da');
      else if (b3)        situationText = _t('challenge162.playoff_runners_3b', 'Corredor en 3ra');

      const outsCount = isFinished ? 3 : (curEvt.newOuts || 0);
      const ballsCount = isFinished ? 0 : (curEvt.balls || 0);
      const strikesCount = isFinished ? 0 : (curEvt.strikes || 0);

      // Play narrative text:
      let narrativeText = '';
      let textClass = 'c162-ticker-text';
      let outcomePillHTML = '';

      if (isPreGame) {
        narrativeText = `⚾ ${_t('challenge162.playoff_pregame_ready', '¡El partido está listo para comenzar! Primer turno:')} ${curEvt.batter.name} vs ${curEvt.pitcher.name}`;
      } else if (curEvt.outcome === 'HR') {
        narrativeText = _t('challenge162.pa_hr', `¡${curEvt.batter.name} conecta un descomunal cuadrangular! (+${curEvt.runsScored} carreras)`, { batter: curEvt.batter.name, runs: curEvt.runsScored });
        textClass += ' highlight-hr';
        outcomePillHTML = `<span class="c162-event-badge badge-hr">💥 JONRÓN</span>`;
      } else if (curEvt.outcome === '3B') {
        narrativeText = _t('challenge162.pa_3b', `¡${curEvt.batter.name} conecta triple profundo al callejón! (+${curEvt.runsScored} carreras)`, { batter: curEvt.batter.name, runs: curEvt.runsScored });
        outcomePillHTML = `<span class="c162-event-badge badge-hit">⚡ TRIPLE</span>`;
      } else if (curEvt.outcome === '2B') {
        narrativeText = _t('challenge162.pa_2b', `¡${curEvt.batter.name} conecta doblete contra la pared! (+${curEvt.runsScored} carreras)`, { batter: curEvt.batter.name, runs: curEvt.runsScored });
        outcomePillHTML = `<span class="c162-event-badge badge-hit">🔥 DOBLE</span>`;
      } else if (curEvt.outcome === '1B') {
        narrativeText = _t('challenge162.pa_1b', `¡${curEvt.batter.name} conecta imparable al jardín! (+${curEvt.runsScored} carreras)`, { batter: curEvt.batter.name, runs: curEvt.runsScored });
        outcomePillHTML = `<span class="c162-event-badge badge-hit">⚾ SENCILLO</span>`;
      } else if (curEvt.outcome === 'BB') {
        narrativeText = _t('challenge162.pa_bb', `${curEvt.batter.name} negocia boleto con paciencia.`, { batter: curEvt.batter.name });
        outcomePillHTML = `<span class="c162-event-badge badge-bb">🚶 BOLETO</span>`;
      } else if (curEvt.outcome === 'SO') {
        narrativeText = _t('challenge162.pa_so', `${curEvt.pitcher.name} poncha a ${curEvt.batter.name} tirándole.`, { pitcher: curEvt.pitcher.name, batter: curEvt.batter.name });
        textClass += ' highlight-out';
        outcomePillHTML = `<span class="c162-event-badge badge-so">💨 PONCHE</span>`;
      } else {
        narrativeText = _t('challenge162.pa_out', `${curEvt.batter.name} falla con roletazo/elevado.`, { batter: curEvt.batter.name });
        textClass += ' highlight-out';
        outcomePillHTML = `<span class="c162-event-badge badge-out">🛑 OUT</span>`;
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
              <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:#38bdf8;font-weight:bold;text-align:center;">
                ${isFinished ? 'FINAL' : inningDisplay}
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
                <div style="font-size:9.5px;color:#cbd5e1;text-align:center;border-top:1px solid rgba(255,255,255,0.08);padding-top:4px;margin-top:2px;">
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
                    <div>🎯 <strong>Turno:</strong> <span style="color:#e4e4e7;">${curEvt.half === 'TOP' ? game.awayTeam.name : game.homeTeam.name}</span></div>
                  </div>
                </div>

              </div>

              <!-- Live Narrative Play-By-Play Ticker -->
              <div class="c162-ticker-box">
                <div style="display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap;">
                  ${outcomePillHTML}
                  <span class="${textClass}">
                    ${isFinished ? `⚾ FINAL DEL PARTIDO: ${game.awayTeam.name} ${curUserRuns} - ${curOppRuns} ${game.homeTeam.name}` : narrativeText}
                  </span>
                </div>
              </div>

            </div>

          </div>
        `;
      } else if (activeTab === 'lineups') {
        // Lineups Tab View
        const renderLineupSide = (teamName, isHome, lineupList, pitcherList) => {
          const rows = (lineupList || []).slice(0, 9).map((b, idx) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:11px;">
              <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#9ca3af;width:20px;">${idx + 1}.</span>
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#38bdf8;width:32px;">${b.pos}</span>
              <span style="flex:1;font-weight:bold;color:#f3f4f6;padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.name}</span>
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#ffd700;background:rgba(255,215,0,0.12);padding:2px 5px;border-radius:4px;">OVR ${b.ovr || 80}</span>
            </div>
          `).join('');

          const pRows = (pitcherList || []).map(p => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:11px;">
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#a78bfa;width:55px;">${p.role || 'P'}</span>
              <span style="flex:1;font-weight:bold;color:#f3f4f6;padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</span>
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
        // Multi-game Box Score Tab View
        const allBoxScores = (this.state.playoffs.boxScores || []).slice();
        if (!allBoxScores.some(b => b.round === game.round)) {
          allBoxScores.push(game);
        }
        const activeBoxScoreIdx = this._selectedPlayoffBoxScoreIndex >= 0 && this._selectedPlayoffBoxScoreIndex < allBoxScores.length
          ? this._selectedPlayoffBoxScoreIndex
          : allBoxScores.length - 1;
        const targetGame = allBoxScores[activeBoxScoreIdx] || game;

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

          const halfLabel = ev.half === 'TOP' ? '▲' : '▼';
          return `
            <div class="c162-pbp-entry">
              <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#38bdf8;width:55px;">${halfLabel} ${ev.inning}</span>
              ${badge}
              <span style="flex:1;color:#f3f4f6;">
                <strong>${ev.batter.name}</strong> vs <strong>${ev.pitcher.name}</strong> · ${ev.outcome} ${ev.runsScored > 0 ? `(+${ev.runsScored} R)` : ''}
              </span>
              <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#ffd700;">
                ${ev.userRuns} - ${ev.oppRuns}
              </span>
            </div>
          `;
        }).reverse().join('');

        tabContentHTML = `
          <div class="c162-pbp-container">
            ${pbpEntriesHTML || `<div style="color:#9ca3af;text-align:center;padding:20px;">${isPreGame ? 'El partido está listo para comenzar.' : 'No hay jugadas registradas aún.'}</div>`}
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
          this.showScreen('screen-challenge-playoffs');
          this.renderPlayoffs();
        };
      }
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

      if (!won) {
        S.playoffs.finished = true;
        S.playoffs.won = false;
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

    hideAllTopLevelScreens() {
      ['screen-mode-select', 'screen-menu', 'screen-challenge-hub', 'screen-challenge-roster', 'screen-challenge-season', 'screen-challenge-playoffs', 'screen-challenge-results'].forEach(id => {
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
          const label = i === 0 ? 'CL' : (i === 1 ? 'SETUP' : 'RP');
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
          const slotDisplay = this._activeSlot.kind === 'batter' ? slotName : (this._activeSlot.kind === 'SP' ? `SP${this._activeSlot.key + 1}` : (this._activeSlot.key === 0 ? 'CL' : (this._activeSlot.key === 1 ? 'SETUP' : 'RP')));

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

      if (!S.roster.battingOrder || S.roster.battingOrder.length !== 9) {
        S.roster.battingOrder = this._optimizeBattingOrder ? this._optimizeBattingOrder(S.roster.lineup) : SLOTS;
      }
      const battingOrder = S.roster.battingOrder;

      // ── Batters Rows (in authentic 1-9 Batting Order sequence with OBP, SLG, OPS, WAR) ───
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
        const war = calcBatterWAR(s, slot);

        return `<tr class="c162-tr${i % 2 ? ' c162-tr-alt' : ''}">
          ${td(`<span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#94a3b8;">${i + 1}</span>`, { style: 'text-align:center;' })}
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
          const isCloser = i === 0;
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
              <span>${g.userRuns} - ${g.oppRuns} ${g.usedSafety ? `<span style="font-size:9px;color:#38bdf8;" title="Seguro de Partido Usado / Safety Net Used">🛡️</span>` : ''}</span>
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
        const oppBattersHTML = opp.lineup.slice(0, 9).map((p, idx) =>
          `<div style="display:flex;justify-content:space-between;align-items:center;font-size:9.5px;padding:2px 6px;">
            <span style="color:#64748b;font-family:'Press Start 2P',monospace;font-size:7px;width:14px;">${idx + 1}.</span>
            <span style="color:#9ca3af;font-weight:bold;min-width:24px;">${p.assignedSlot || p.pos}</span>
            <span style="color:#e4e4e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;flex:1;padding:0 4px;">${p.name}</span>
            <span style="color:var(--challenge162-accent);">${Math.round(p.ovr || 80)}</span>
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

      const safetyShields = S.safetyShields !== undefined ? S.safetyShields : 2;
      const safetyLabel = _t('challenge162.safety_shields', 'SEGUROS');

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
          <div style="flex: 1 1 320px; max-width: 380px; margin: 0; background: radial-gradient(circle at 50% 0%, rgba(15,23,42,0.95) 0%, rgba(8,12,22,0.98) 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.4); box-sizing: border-box;">
            <div style="margin-bottom:6px;">
              <span class="c162-mode-badge" style="background:rgba(245,158,11,0.2);color:#ffd700;border:1px solid rgba(245,158,11,0.5);font-size:9.5px;padding:4px 8px;">
                ${(S.modeConfig && S.modeConfig.label) || '162-0 CHALLENGE'}
              </span>
            </div>
            
            <div style="display:flex;align-items:center;gap:16px;margin:2px 0;">
              <div style="font-family:'Press Start 2P',monospace;font-size:22px;color:#34d399;text-shadow:0 0 12px rgba(52,211,153,0.5);">
                ${S.wins}
              </div>
              <div style="font-family:'Press Start 2P',monospace;font-size:14px;color:#64748b;">
                -
              </div>
              <div style="font-family:'Press Start 2P',monospace;font-size:22px;color:#f87171;text-shadow:0 0 12px rgba(248,113,113,0.5);">
                ${S.losses}
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;justify-content:center;">
              <span style="font-size:9.5px;color:#94a3b8;">${gamesCountText}</span>
              <span class="c162-mode-badge" style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);font-size:8px;padding:3px 6px;" title="Partidos de seguridad para re-simular derrota">
                🛡️ ${safetyLabel}: <span style="color:${safetyShields > 0 ? '#34d399' : '#f87171'};font-weight:bold;">${safetyShields}/2</span>
              </span>
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
                    <th class="c162-th" style="width:28px;text-align:center;">#</th>
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

      const getRoundTitle = (rIdx) => {
        if (rIdx === 0) return _t('challenge162.round_1_title', 'SERIE DIVISIONAL');
        if (rIdx === 1) return _t('challenge162.round_2_title', 'SERIE DE CAMPEONATO');
        return _t('challenge162.round_3_title', '🏆 SERIE MUNDIAL [JEFE FINAL]');
      };
      const getRoundDesc = (rIdx) => {
        if (rIdx === 0) return _t('challenge162.round_1_desc', 'Ronda 1: Enfrenta al 3er mejor equipo');
        if (rIdx === 1) return _t('challenge162.round_2_desc', 'Ronda 2: Enfrenta al 2do mejor equipo');
        return _t('challenge162.round_3_desc', 'Jefe Final: El #1 invicto de la liga');
      };

      const oppFranchise = generatePlayoffEnemyTeam(round, S.leagueTeams);
      const oppSP = (oppFranchise.pitchers && oppFranchise.pitchers[0]) || { cleanName: 'As Rival', name: 'As Rival', ovr: 85 };
      const oppReliever = oppFranchise.reliever || { name: 'Setup Rival', ovr: 85 };
      const oppCloser = oppFranchise.closer || { name: 'Closer Rival', ovr: 88 };
      const oppBatters = (oppFranchise._batters || oppFranchise.lineup || []).slice(0, 9);

      // User Staff & Lineup
      const topSP = (S.roster.pitchers.SP && S.roster.pitchers.SP[0]) || null;
      const topSPStats = topSP ? S.pitcherStats[pitcherUnlockKey(topSP)] : null;
      const spEra = topSPStats && topSPStats.outs > 0 ? ((topSPStats.er * 27) / topSPStats.outs).toFixed(2) : '3.00';
      const topSpOvrDisplay = topSP ? Math.round(topSP.ovr || 85) : 85;

      const userCloser = (S.roster.pitchers.RP && S.roster.pitchers.RP[0]) || { name: 'Cerrador', ovr: 80 };
      const userSetup = (S.roster.pitchers.RP && S.roster.pitchers.RP[1]) || { name: 'Setup', ovr: 80 };
      const userBatters = S.roster.battingOrder.map(slot => S.roster.lineup[slot]).filter(Boolean);

      // 3-step bracket stepper
      const stepperHTML = PLAYOFF_ROUNDS.map((r, idx) => {
        let badgeClass = 'c162-step-locked', badgeText = _t('challenge162.step_locked', '🔒 BLOQUEADA');
        if (idx < round) { badgeClass = 'c162-step-done'; badgeText = _t('challenge162.step_done', '✔ SUPERADA'); }
        else if (idx === round) { badgeClass = 'c162-step-active'; badgeText = _t('challenge162.step_active', '⚔ EN DISPUTA'); }
        const rTitle = _t('challenge162.bracket_round', `RONDA ${r.round}`, { round: r.round });
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

      const playoffsTitle = _t('challenge162.playoffs_title', 'POSTEMPORADA DE BASEROGUE');
      const playoffsSubtitle = _t('challenge162.playoffs_subtitle', `3 Rondas a Partido Único (Muerte Súbita) · ${curRoundDesc}`, { desc: curRoundDesc });
      const yourTeamName = this.getUserTeamName();
      const yourTeamLabel = `${yourTeamName} (${S.wins}-${S.losses})`;
      const acePitcherLabel = _t('challenge162.ace_pitcher', 'As Abridor');
      const closerLabel = _t('challenge162.closer_pitcher', 'Cerrador');
      const setupLabel = _t('challenge162.setup_pitcher', 'Preparador');
      const battingLineupLabel = _t('challenge162.batting_lineup', 'Alineación Titular');
      const playMatchBtnText = _t('challenge162.play_playoff_btn', `🎲 ¡DISPUTAR ${curRoundTitle}! (PARTIDO A MUERTE)`, { label: curRoundTitle });
      const viewStatsBtnText = _t('challenge162.view_stats_table', '📊 VER TABLA DE STATS');

      const renderLineupRows = (batters) => (batters || []).slice(0, 9).map((b, idx) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 6px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:10.5px;">
          <span style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#9ca3af;width:18px;">${idx + 1}.</span>
          <span style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#38bdf8;width:28px;">${b.assignedSlot || b.pos || 'DH'}</span>
          <span style="flex:1;color:#f3f4f6;font-weight:600;padding:0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.name}</span>
          <span style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#ffd700;">${Math.round(b.ovr || 80)}</span>
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
                ${acePitcherLabel}: <span style="color:#ffd700;">${oppSP.cleanName || oppSP.name}</span> <span style="font-size:9px;color:${round === 2 ? '#f87171' : '#38bdf8'};background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;font-family:'Press Start 2P',monospace;">OVR ${Math.round(oppSP.ovr || 85)}</span>
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
              ${_t('challenge162.playoff_view_boxscores', '📜 Historial de Box Scores')}
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
