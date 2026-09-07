// dynasty.js — MODO DINASTÍA & HOBBY BOX (162 JUEGOS MULTIANUAL)
// Roster oficial de 25 jugadores con contratos multianuales de 1 a 10 temporadas.
// Simulación auténtica juego a juego con sabermetría real, registro de estadísticas individuales
// acumuladas por temporada y carrera, rachas con bonificaciones (Buff/Bust), visualizador de
// rosters rivales, líderes de la liga, y preservación multi-temporada del roster y contratos.

(function() {
  'use strict';

  const SAVE_KEY = 'baserogue_dynasty_v1';
  const ROSTER_SIZE = 25;
  const LINEUP_SLOTS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

  function _t(key, fallback, params = {}) {
    let str = (typeof window.t === 'function' ? window.t(key) : null);
    if (!str || str === key) str = fallback;
    Object.keys(params).forEach(k => {
      str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), params[k]);
    });
    return str;
  }

  const MLB_TEAMS = [
    { code: 'NYY', name: 'New York Yankees', city: 'New York', color: '#132448', icon: '🗽', league: 'AL', div: 'East' },
    { code: 'BOS', name: 'Boston Red Sox', city: 'Boston', color: '#bd3039', icon: '🧦', league: 'AL', div: 'East' },
    { code: 'TOR', name: 'Toronto Blue Jays', city: 'Toronto', color: '#134a8e', icon: '🍁', league: 'AL', div: 'East' },
    { code: 'BAL', name: 'Baltimore Orioles', city: 'Baltimore', color: '#df4601', icon: '🐤', league: 'AL', div: 'East' },
    { code: 'TB',  name: 'Tampa Bay Rays', city: 'Tampa Bay', color: '#092c5c', icon: '☀️', league: 'AL', div: 'East' },

    { code: 'CHW', name: 'Chicago White Sox', city: 'Chicago', color: '#27251f', icon: '⚪', league: 'AL', div: 'Central' },
    { code: 'CLE', name: 'Cleveland Guardians', city: 'Cleveland', color: '#e31937', icon: '🛡️', league: 'AL', div: 'Central' },
    { code: 'DET', name: 'Detroit Tigers', city: 'Detroit', color: '#0c2340', icon: '🐅', league: 'AL', div: 'Central' },
    { code: 'KCR', name: 'Kansas City Royals', city: 'Kansas City', color: '#004687', icon: '👑', league: 'AL', div: 'Central' },
    { code: 'MIN', name: 'Minnesota Twins', city: 'Minnesota', color: '#002b5c', icon: '👬', league: 'AL', div: 'Central' },

    { code: 'HOU', name: 'Houston Astros', city: 'Houston', color: '#002d62', icon: '🚀', league: 'AL', div: 'West' },
    { code: 'LAA', name: 'Los Angeles Angels', city: 'Anaheim', color: '#ba0021', icon: '👼', league: 'AL', div: 'West' },
    { code: 'OAK', name: 'Oakland Athletics', city: 'Oakland', color: '#003831', icon: '🐘', league: 'AL', div: 'West' },
    { code: 'SEA', name: 'Seattle Mariners', city: 'Seattle', color: '#0c2c56', icon: '⚓', league: 'AL', div: 'West' },
    { code: 'TEX', name: 'Texas Rangers', city: 'Texas', color: '#003278', icon: '🤠', league: 'AL', div: 'West' },

    { code: 'ATL', name: 'Atlanta Braves', city: 'Atlanta', color: '#ce1141', icon: '🪓', league: 'NL', div: 'East' },
    { code: 'MIA', name: 'Miami Marlins', city: 'Miami', color: '#00a3e0', icon: '🐬', league: 'NL', div: 'East' },
    { code: 'NYM', name: 'New York Mets', city: 'New York', color: '#002d72', icon: '🍎', league: 'NL', div: 'East' },
    { code: 'PHI', name: 'Philadelphia Phillies', city: 'Philadelphia', color: '#e81828', icon: '🔔', league: 'NL', div: 'East' },
    { code: 'WSH', name: 'Washington Nationals', city: 'Washington', color: '#ab0003', icon: '🏛️', league: 'NL', div: 'East' },

    { code: 'CHC', name: 'Chicago Cubs', city: 'Chicago', color: '#0e3386', icon: '🐻', league: 'NL', div: 'Central' },
    { code: 'CIN', name: 'Cincinnati Reds', city: 'Cincinnati', color: '#c6011f', icon: '🔴', league: 'NL', div: 'Central' },
    { code: 'MIL', name: 'Milwaukee Brewers', city: 'Milwaukee', color: '#12284b', icon: '🍺', league: 'NL', div: 'Central' },
    { code: 'PIT', name: 'Pittsburgh Pirates', city: 'Pittsburgh', color: '#fdb827', icon: '🏴‍☠️', league: 'NL', div: 'Central' },
    { code: 'STL', name: 'St. Louis Cardinals', city: 'St. Louis', color: '#c41e3a', icon: '🐦', league: 'NL', div: 'Central' },

    { code: 'ARI', name: 'Arizona Diamondbacks', city: 'Arizona', color: '#a71930', icon: '🐍', league: 'NL', div: 'West' },
    { code: 'COL', name: 'Colorado Rockies', city: 'Colorado', color: '#33006f', icon: '🏔️', league: 'NL', div: 'West' },
    { code: 'LAD', name: 'Los Angeles Dodgers', city: 'Los Angeles', color: '#005a9c', icon: '🌴', league: 'NL', div: 'West' },
    { code: 'SDP', name: 'San Diego Padres', city: 'San Diego', color: '#2f241d', icon: '⛪', league: 'NL', div: 'West' },
    { code: 'SFG', name: 'San Francisco Giants', city: 'San Francisco', color: '#fd5a1e', icon: '🌉', league: 'NL', div: 'West' }
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

  function cardKey(p) {
    if (!p) return 'unknown';
    return (p.playerID || cleanName(p)) + '_' + (p.year || '') + '_' + (p.role || p.pos || '');
  }

  function generateContract(player) {
    const ovr = Math.max(60, Math.min(99, player.ovr || 75));
    const norm = (ovr - 60) / 39.0;
    const peak = 2.0 + norm * 7.0;
    const weights = [];
    for (let y = 1; y <= 10; y++) {
      const dist = Math.abs(y - peak);
      const base = 2.0;
      const expW = Math.exp(-0.5 * Math.pow(dist / 2.2, 2)) * 35.0;
      weights.push(base + expW);
    }
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      if (roll < weights[i]) return i + 1;
      roll -= weights[i];
    }
    return Math.min(10, Math.max(1, Math.round(peak)));
  }

  function getCardFlagHTML(p) {
    if (window.BaseballDex && typeof window.BaseballDex.getPlayerFlagHTML === 'function') {
      return window.BaseballDex.getPlayerFlagHTML(p);
    }
    const db = window.PLAYER_FLAGS_DB || {};
    let pid = p ? (p.playerID || p.bbref_id || p.id) : null;
    let iso = pid && (db[pid] || db[String(pid).toLowerCase()]);
    if (!iso && p) {
      const rawName = p.cleanName || p.name || '';
      const clean = rawName.replace(/\s*\(.*?\)$/, '').trim();
      iso = db[clean] || db[clean.toLowerCase()];
    }
    const cleanIso = (iso || 'us').toLowerCase();
    return `<img src="https://flagcdn.com/w20/${cleanIso}.png" srcset="https://flagcdn.com/w40/${cleanIso}.png 2x" style="width:17px;height:12px;border-radius:2px;object-fit:cover;box-shadow:0 0 5px rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.25);display:inline-block;vertical-align:middle;" alt="${cleanIso.toUpperCase()}">`;
  }

  function getCardPositionText(p) {
    if (!p) return '';
    if (p.role) return p.role;
    const pri = p.pos || p.primary_pos || 'UTL';
    const secRaw = p.sec_pos || p.secondary_pos || p.secondary_positions || '';
    const sec = Array.isArray(secRaw) ? secRaw.join(', ') : String(secRaw).trim();
    if (sec) {
      return `${pri} / ${sec}`;
    }
    return pri;
  }

  function getCardCareerStats(p) {
    if (window.BaseballDex && typeof window.BaseballDex.getPlayerCareerData === 'function') {
      return window.BaseballDex.getPlayerCareerData(p);
    }
    const clean = p.name ? p.name.replace(/\s\(.*?\)$/, '').trim() : '';
    const keyWithYear = `${clean}_${p.year}`;
    const db = window.CAREER_STATS_DB || {};
    const entry = (p.playerID && db[p.playerID]) || db[keyWithYear] || db[clean] || db[p.name] || db[clean.toLowerCase()];
    if (entry) {
      return {
        war: (entry.war !== null && entry.war !== undefined) ? entry.war : (p.ovr ? (p.ovr / 10).toFixed(1) : '-'),
        mvp: entry.mvp || p.mvp || 0,
        roy: entry.roy || p.roy || 0,
        ss: entry.ss || p.silver_sluggers || 0,
        gg: entry.gg || p.gold_gloves || 0,
        cy: entry.cy || p.cy_youngs || 0,
        rel: entry.rel || p.reliever_awards || 0,
        allstars: entry.allstars || p.allstars || 0,
        hof: entry.hof || p.hof || false,
        h: entry.h !== undefined ? entry.h : '-',
        hr: entry.hr !== undefined ? entry.hr : '-',
        rbi: entry.rbi !== undefined ? entry.rbi : '-',
        avg: entry.avg !== undefined ? entry.avg : '-',
        ops: entry.ops !== undefined ? entry.ops : '-',
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
      mvp: p.mvp || 0, roy: 0, ss: 0, gg: 0, cy: 0, rel: 0, allstars: 0,
      hof: p.hof || false,
      h: '-', hr: '-', rbi: '-', avg: '-', ops: '-',
      w: '-', l: '-', era: '-', so: '-', ip: '-', whip: '-', sv: '-'
    };
  }

  function getCardGrade(val) {
    if (window.BaseballDex && typeof window.BaseballDex.getGrade === 'function') {
      return window.BaseballDex.getGrade(val);
    }
    const v = Math.round(Number(val) || 0);
    if (v >= 100) return 'S';
    if (v >= 80) return (v >= 95 ? 'A+' : (v < 85 ? 'A-' : 'A'));
    if (v >= 60) return (v >= 75 ? 'B+' : (v < 65 ? 'B-' : 'B'));
    if (v >= 40) return (v >= 55 ? 'C+' : (v < 45 ? 'C-' : 'C'));
    if (v >= 20) return (v >= 35 ? 'D+' : (v < 25 ? 'D-' : 'D'));
    return 'F';
  }

  function getCardGradeColor(val) {
    if (window.BaseballDex && typeof window.BaseballDex.getGradeColor === 'function') {
      return window.BaseballDex.getGradeColor(val);
    }
    const g = getCardGrade(val).charAt(0);
    const colors = { S: '#ffd700', A: '#22d3ee', B: '#4ade80', C: '#94a3b8', D: '#f97316', F: '#ef4444' };
    return colors[g] || '#94a3b8';
  }

  // ── Sabermetric WAR & Stats Computation (Parity with Challenge 162) ──────────
  function calcBatterWAR(s, defVal = 50, pos = 'DH') {
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

    const wraa = (bb * 0.32) + (singles * 0.46) + (d * 0.78) + (t * 1.05) + (hr * 1.40) + (sb * 0.20) - (outs * 0.27);
    const posAdjTable = { C: 9.0, SS: 7.0, '2B': 3.0, '3B': 2.0, CF: 2.5, LF: -7.0, RF: -7.0, '1B': -12.0, DH: -15.0 };
    const posAdj = (posAdjTable[(pos || 'DH').toUpperCase()] || 0.0) * (pa / 600.0);
    const defRuns = (defVal - 50) * 0.16 * (pa / 600.0);
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

    const repRuns = ip * (4.80 / 9.0);
    const actualRA = er * 1.05;
    const kBbAdj = (k * 0.020) - (bb * 0.010);
    const isSP = (role || 'SP').toUpperCase() === 'SP';
    const svLeverage = !isSP ? (sv * 0.45) : 0.0;

    const war = Math.max(0.0, (repRuns - actualRA + kBbAdj + svLeverage) / 10.0);
    return war.toFixed(1);
  }

  // ── Baserunning & Inning Engine ───────────────────────────────────────────
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
      if (r3) scorers.push(r3);
      if (r2) scorers.push(r2);
      if (r1) scorers.push(r1);
      scorers.push(batter);
      bases[0] = null; bases[1] = null; bases[2] = null;
      return scorers;
    }
    if (basesToAdvance === 3) {
      if (r3) scorers.push(r3);
      if (r2) scorers.push(r2);
      if (r1) scorers.push(r1);
      bases[0] = null; bases[1] = null; bases[2] = batter;
      return scorers;
    }
    if (basesToAdvance === 2) {
      if (r3) scorers.push(r3);
      if (r2) scorers.push(r2);
      bases[0] = null; bases[1] = batter; bases[2] = null;
      if (r1) {
        const spd1 = r1.spd !== undefined ? r1.spd : 50;
        const scoreChance = (spd1 >= 60 || outs === 2) ? 0.55 : 0.35;
        if (Math.random() < scoreChance) scorers.push(r1);
        else bases[2] = r1;
      }
      return scorers;
    }
    if (r3) scorers.push(r3);
    bases[2] = null;
    if (r2) {
      const spd2 = r2.spd !== undefined ? r2.spd : 50;
      const scoreChance = (spd2 >= 60 || outs === 2) ? 0.65 : 0.45;
      if (Math.random() < scoreChance) scorers.push(r2);
      else bases[2] = r2;
    }
    bases[1] = r1 || null;
    bases[0] = batter;
    return scorers;
  }

  function simPaOutcome(batter, pitcher, isUserBatting = true, streakBonus = 0) {
    // Global rating boosts applied across all key disciplines (CON, PWR, EYE, SPD, and pitching H9, K9, BB9)
    const bBoost = streakBonus + (batter._boost || 0);
    const pBoost = (!isUserBatting ? streakBonus : 0) + (pitcher._boost || 0);

    const con = (batter.con !== undefined ? batter.con : 50) + bBoost;
    const eye = (batter.eye !== undefined ? batter.eye : 50) + Math.round(bBoost * 0.7);
    const pwr = (batter.pwr !== undefined ? batter.pwr : 50) + Math.round(bBoost * 0.8);
    const spd = (batter.spd !== undefined ? batter.spd : 50) + Math.round(bBoost * 0.5);

    const pH9 = Math.max(25, (pitcher.h9 !== undefined ? pitcher.h9 : 50) + pBoost);
    const pK9 = Math.max(25, (pitcher.k9 !== undefined ? pitcher.k9 : 50) + pBoost);
    const pBB9 = Math.max(25, (pitcher.bb9 !== undefined ? pitcher.bb9 : 50) + Math.round(pBoost * 0.7));
    const pHR9 = Math.max(25, (pitcher.hr9 !== undefined ? pitcher.hr9 : 50) + Math.round(pBoost * 0.7));

    let pBB = 0.092 + (eye - 50) * 0.00185 - (pBB9 - 50) * 0.0007;
    pBB = Math.max(0.050, Math.min(0.24, pBB));

    let conEffective = con;
    if (con < 35) conEffective = 42 + (con - 35) * 0.35;
    else if (con > 90) conEffective = 90 + (con - 90) * 0.40;

    let pwrEffective = pwr;
    if (pwr > 75 && pwr <= 90) pwrEffective = 75 + (pwr - 75) * 0.65;
    else if (pwr > 90) pwrEffective = 75 + (15 * 0.65) + (pwr - 90) * 0.40;

    const rawKAvd = batter.k_avd !== undefined ? batter.k_avd : (batter.k_avoid !== undefined ? batter.k_avoid : conEffective);
    const kAvoid = rawKAvd < 35 ? (42 + (rawKAvd - 35) * 0.35) : (rawKAvd > 90 ? (90 + (rawKAvd - 90) * 0.50) : rawKAvd);
    const kPitcherBoost = pK9 <= 65 ? (pK9 - 50) * 0.0020 : (15 * 0.0020 + (pK9 - 65) * 0.0032);
    let pSO = 0.185 - (kAvoid - 50) * 0.00160 + kPitcherBoost;
    pSO = Math.max(0.040, Math.min(0.38, pSO));

    const pInPlay = Math.max(0.20, 1 - pBB - pSO);
    const defEfficiency = (pitcher && pitcher._fieldingDef) !== undefined ? pitcher._fieldingDef : 50;
    const defAdj = (defEfficiency - 50) * 0.00028;

    let targetAvg, pHR;
    if (isUserBatting) {
      targetAvg = 0.266 + (conEffective - 50) * 0.00145 - (pH9 - 50) * 0.00065 - defAdj;
      pHR = 0.028 + (pwrEffective - 50) * 0.00095 - (pHR9 - 50) * 0.00028;
    } else {
      targetAvg = 0.248 + (conEffective - 50) * 0.00130 - (pH9 - 50) * 0.00075 - defAdj;
      pHR = 0.028 + (pwrEffective - 50) * 0.00090 - (pHR9 - 50) * 0.00030;
    }

    targetAvg = Math.max(0.14, Math.min(0.38, targetAvg));
    let pTotalHit = (1 - pBB) * targetAvg;
    pTotalHit = Math.min(pTotalHit, pInPlay - 0.01);

    pHR = Math.max(0.001, Math.min(0.085, pHR));
    pHR = Math.min(pHR, pTotalHit * 0.50);
    const pRegularHit = pTotalHit - pHR;

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

  function getStarterMaxInnings(sp) {
    if (!sp) return 6;
    const sta = sp.sta !== undefined ? sp.sta : (sp.sta_val !== undefined ? sp.sta_val : 70);
    const base = 6.2 + (Math.max(20, Math.min(125, sta)) - 20) * 0.016;
    const roll = (Math.random() - 0.5) * 1.0;
    let maxInn = Math.max(6, Math.min(9, Math.round(base + roll)));
    if (sta >= 85 && Math.random() < 0.06) maxInn = 9;
    return maxInn;
  }

  function pitcherForInning(inning, sp, relievers, spMaxInnings, gameIdx, userRuns, oppRuns) {
    if (inning <= spMaxInnings) return sp;
    if (!relievers || relievers.length === 0) return sp;

    const rLen = relievers.length;
    // Slots típicos de MLB:
    // [0, 1]: Long relief / Mop-up
    // [2, 3]: Middle relief
    // [4]: 7th Inning / Middle-Setup
    // [5]: 8th Inning Setup (SU)
    // [6]: 9th Inning Closer (CP)
    const closer = relievers[rLen - 1];
    const setup  = (rLen >= 2) ? relievers[rLen - 2] : closer;
    const seventhInning = (rLen >= 3) ? relievers[rLen - 3] : setup;

    const runDiff = userRuns - oppRuns;
    const isSaveSituation = (runDiff >= 1 && runDiff <= 3);

    // Entradas extras (10+)
    if (inning >= 10) {
      const extraIdx = (gameIdx + inning) % rLen;
      return relievers[extraIdx] || closer;
    }

    // 9na entrada
    if (inning === 9) {
      if (isSaveSituation) {
        // En días back-to-back o fatiga simulada cada 7 juegos, el setup entra a cerrar
        return (gameIdx % 7 !== 0) ? closer : setup;
      }
      if (runDiff === 0) {
        // Juego empatado en la 9na: setup o closer
        return (gameIdx % 2 === 0) ? closer : setup;
      }
      if (Math.abs(runDiff) <= 2) {
        // Juego muy apretado (+1 a +2 o -1 a -2)
        return (gameIdx % 3 === 0) ? seventhInning : closer;
      }
      if (runDiff >= 3 && runDiff <= 5) {
        // Ventaja cómoda
        return setup;
      }
      // Paliza (Blowout >= 4 carreras en contra o >= 6 a favor): mop-up / long relief
      return relievers[gameIdx % Math.max(1, Math.min(3, rLen))];
    }

    // 8va entrada
    if (inning === 8) {
      if (runDiff >= -2 && runDiff <= 4) {
        return (gameIdx % 6 !== 0) ? setup : seventhInning;
      }
      if (runDiff > 4) {
        // Ventaja amplia: middle relief
        return relievers[2 % rLen] || relievers[0];
      }
      // Perdiendo por más de 2: middle relief o mop-up
      return relievers[(gameIdx + 1) % Math.max(1, Math.min(4, rLen))];
    }

    // 7ma entrada
    if (inning === 7) {
      if (Math.abs(runDiff) <= 3) {
        return seventhInning;
      }
      return relievers[(gameIdx + 2) % Math.max(1, Math.min(4, rLen))];
    }

    // Entradas anteriores (starter salió temprano por lesión, fatiga o límite de innings)
    // Usar long relief / middle relief temprano (slots 0 a 2)
    const longIdx = (gameIdx + inning) % Math.max(1, Math.min(3, rLen));
    return relievers[longIdx] || relievers[0];
  }

  // Asignación estricta y lógica de posiciones para el Roster de 25
  // Helper para obtener todas las posiciones primarias y secundarias de un jugador
  function getAllPlayerPositions(p) {
    if (!p) return new Set();
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

  function canPlaySlot(p, slot) {
    if (!p) return false;
    if (slot === 'DH') return true;
    const positions = getAllPlayerPositions(p);
    return positions.has(slot.toUpperCase());
  }

  // Asignacion estricta, optima y dinamica de posiciones para el Roster de 25
  // Utiliza Maximum Bipartite Matching con aumentacion de caminos para garantizar
  // que jugadores multi-posicion cedan slots a especialistas, cubriendo siempre
  // la mayor cantidad de posiciones posibles y evitando slots vacios.
  function calculateRosterSlots(pulledCards, finalize = false) {
    const batters = pulledCards.filter(c => !c.role).sort((a, b) => (b.ovr || 50) - (a.ovr || 50));
    const pitchers = pulledCards.filter(c => c.role).sort((a, b) => (b.ovr || 50) - (a.ovr || 50));

    const lineup = { C: null, '1B': null, '2B': null, '3B': null, SS: null, LF: null, CF: null, RF: null, DH: null };
    const bench = [];

    const FIELD_ORDER = ['C', 'SS', 'CF', '2B', '3B', '1B', 'LF', 'RF'];
    const matchSlot = { C: null, SS: null, CF: null, '2B': null, '3B': null, '1B': null, LF: null, RF: null };

    // Bipartite Matching: asignar bateadores a posiciones defensivas optimas
    function bpm(batterIdx, visited) {
      const p = batters[batterIdx];
      for (let i = 0; i < FIELD_ORDER.length; i++) {
        const slot = FIELD_ORDER[i];
        if (canPlaySlot(p, slot) && !visited.has(slot)) {
          visited.add(slot);
          if (matchSlot[slot] === null || bpm(matchSlot[slot], visited)) {
            matchSlot[slot] = batterIdx;
            return true;
          }
        }
      }
      return false;
    }

    for (let i = 0; i < batters.length; i++) {
      bpm(i, new Set());
    }

    const assignedIndices = new Set();
    FIELD_ORDER.forEach(slot => {
      const idx = matchSlot[slot];
      if (idx !== null && idx !== undefined) {
        lineup[slot] = batters[idx];
        assignedIndices.add(idx);
      }
    });

    // Asignar DH con el mejor bateador restante disponible
    for (let i = 0; i < batters.length; i++) {
      if (!assignedIndices.has(i)) {
        lineup['DH'] = batters[i];
        assignedIndices.add(i);
        break;
      }
    }

    // Los bateadores no asignados van al banco
    for (let i = 0; i < batters.length; i++) {
      if (!assignedIndices.has(i)) {
        bench.push(batters[i]);
      }
    }

    // Si finalize es true o ya tenemos 9+ bateadores, NINGUN slot de la alineacion puede quedar vacio
    if (finalize || batters.length >= 9) {
      const ALL_SLOTS = ['C', 'SS', 'CF', '2B', '3B', '1B', 'LF', 'RF', 'DH'];
      ALL_SLOTS.forEach(slot => {
        if (!lineup[slot] && bench.length > 0) {
          lineup[slot] = bench.shift();
        }
      });
    }

    // Pitcheo
    const sp = [null, null, null, null, null];
    const rp = [null, null, null, null, null, null, null];
    const usedPitchers = new Set();

    const isSP = (p) => (p.role || 'SP').toUpperCase() === 'SP';
    const isRP = (p) => !isSP(p);

    const spList = pitchers.filter(isSP);
    const rpList = pitchers.filter(isRP);

    let spIdx = 0;
    spList.forEach(p => {
      if (spIdx < 5) {
        sp[spIdx++] = p;
        usedPitchers.add(cardKey(p));
      }
    });

    if (rpList.length > 0) {
      const cpCandidate = rpList[0];
      rp[6] = cpCandidate;
      usedPitchers.add(cardKey(cpCandidate));
    }
    let rpIdx = 0;
    rpList.forEach(p => {
      if (!usedPitchers.has(cardKey(p)) && rpIdx < 6) {
        rp[rpIdx++] = p;
        usedPitchers.add(cardKey(p));
      }
    });

    spList.forEach(p => {
      if (!usedPitchers.has(cardKey(p))) {
        const emptyRpIdx = rp.findIndex(slot => slot === null);
        if (emptyRpIdx !== -1) {
          rp[emptyRpIdx] = p;
          usedPitchers.add(cardKey(p));
        }
      }
    });

    rpList.forEach(p => {
      if (!usedPitchers.has(cardKey(p))) {
        const emptySpIdx = sp.findIndex(slot => slot === null);
        if (emptySpIdx !== -1) {
          sp[emptySpIdx] = p;
          usedPitchers.add(cardKey(p));
        }
      }
    });

    return { lineup, bench, sp, rp, batters, pitchers };
  }

  // Orden de bateo óptimo y lógico de béisbol
  // 1: Leadoff (Alto OBP / Velocidad / Contacto)
  // 2: #2 Hitter (Alto Contacto / OBP / Bateo integral)
  // 3: #3 Hitter (Mejor bateador general del equipo: OPS / OVR)
  // 4: Cleanup (Máximo poder / Slugging)
  // 5: #5 Hitter (Segundo bateador de poder / protección)
  // 6: #6 Hitter (Buen bateador secundario)
  // 7, 8, 9: Parte baja del orden
  function buildOptimalLineupOrder(lineupObj) {
    if (!lineupObj) return [];
    const players = Array.isArray(lineupObj) ? [...lineupObj] : Object.values(lineupObj).filter(Boolean);
    if (players.length === 0) return [];
    if (players.length < 9) return players;

    const pool = [...players];
    const scorePlayer = (p) => {
      const con = p.con !== undefined ? p.con : 50;
      const pwr = p.pwr !== undefined ? p.pwr : 50;
      const eye = p.eye !== undefined ? p.eye : 50;
      const spd = p.spd !== undefined ? p.spd : 50;
      const ovr = p.ovr !== undefined ? p.ovr : 75;
      return { con, pwr, eye, spd, ovr };
    };

    const ordered = [];
    const pickBestAndRemove = (fn) => {
      if (pool.length === 0) return null;
      pool.sort((a, b) => fn(scorePlayer(b)) - fn(scorePlayer(a)));
      return pool.shift();
    };

    // 1. Leadoff: SPD * 0.45 + EYE * 0.35 + CON * 0.2
    ordered[0] = pickBestAndRemove(s => s.spd * 0.45 + s.eye * 0.35 + s.con * 0.20);
    // 4. Cleanup: PWR * 0.65 + CON * 0.20 + EYE * 0.15
    ordered[3] = pickBestAndRemove(s => s.pwr * 0.65 + s.con * 0.20 + s.eye * 0.15);
    // 3. Best Overall: OVR * 0.5 + CON * 0.25 + PWR * 0.25
    ordered[2] = pickBestAndRemove(s => s.ovr * 0.50 + s.con * 0.25 + s.pwr * 0.25);
    // 2. Strong Contact/OBP: CON * 0.45 + EYE * 0.35 + SPD * 0.2
    ordered[1] = pickBestAndRemove(s => s.con * 0.45 + s.eye * 0.35 + s.spd * 0.20);
    // 5. Secondary Power: PWR * 0.50 + OVR * 0.30 + CON * 0.20
    ordered[4] = pickBestAndRemove(s => s.pwr * 0.50 + s.ovr * 0.30 + s.con * 0.20);
    // 6. Good Hitter: OVR
    ordered[5] = pickBestAndRemove(s => s.ovr);
    // 7. Next best
    ordered[6] = pickBestAndRemove(s => s.ovr);
    // 8. Next best
    ordered[7] = pickBestAndRemove(s => s.ovr);
    // 9. Last
    ordered[8] = pool.length > 0 ? pool.shift() : null;

    return ordered.filter(Boolean);
  }

  function getPlayerPositionInLineup(lineupObj, player) {
    if (!lineupObj || !player) return player.pos || 'DH';
    for (const [slot, p] of Object.entries(lineupObj)) {
      if (p && cardKey(p) === cardKey(player)) return slot;
    }
    return player.pos || 'DH';
  }

  // ── Selección Ponderada por Posiciones Faltantes (Mismo algoritmo de Quick Play Draft) ─
  function pickWeightedCard(pool, missingPos, usedKeys) {
    const available = pool.filter(p => !usedKeys.has(cardKey(p)));
    if (!available.length) return pool[0];

    const isMissing = (p) => {
      if (!missingPos || missingPos.length === 0) return false;
      const allPos = getAllPlayerPositions(p);
      const role = (p.role || '').toUpperCase();
      if (role && missingPos.includes(role)) return true;
      for (let i = 0; i < missingPos.length; i++) {
        if (allPos.has(missingPos[i])) return true;
      }
      return false;
    };

    // Si faltan posiciones, primero intentar filtrar estrictamente si quedan cartas que cumplan
    if (missingPos && missingPos.length > 0) {
      const matchingCards = available.filter(isMissing);
      if (matchingCards.length > 0) {
        const idx = Math.floor(Math.random() * matchingCards.length);
        return matchingCards[idx];
      }
    }

    const toWeighted = (p) => {
      const allPos = getAllPlayerPositions(p);
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

      if (matched) {
        weight = 10;
      }
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

  // Generador de la carta 1:1 idéntica al BaseballDex con soporte 3D Flip
  function renderDexCardFlipHTML(card, contractYears, packNum, total, customActionHTML = null) {
    const isPitcher = Boolean(card.role);
    const isReliever = isPitcher && (card.role === 'RP' || card.role === 'CL' || card.role === 'CP');

    const rColor = (window.BaseballDex && window.BaseballDex.RARITY_COLORS && window.BaseballDex.RARITY_COLORS[card.rarity])
      || (card.ovr >= 95 ? '#ffd700' : (card.ovr >= 88 ? '#a855f7' : (card.ovr >= 80 ? '#3b82f6' : (card.ovr >= 75 ? '#10b981' : '#6b7280'))));

    const eraShort = card.era || 'All-Time';
    const cName = cleanName(card);
    const flagHTML = getCardFlagHTML(card);
    const careerStats = getCardCareerStats(card);

    const renderStat = (lbl, val) => {
      if (typeof val !== 'number') {
        return `
          <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:9px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${lbl}</span>
            <span style="font-size:11px;font-weight:bold;color:#38bdf8">${val}</span>
          </div>
        `;
      }
      return `
        <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${lbl}</span>
          <span style="font-size:11px;font-weight:bold;color:${getCardGradeColor(val)}">${val} <small style="font-size:8px">${getCardGrade(val)}</small></span>
        </div>
      `;
    };

    let statsHTML = '';
    if (isPitcher) {
      const h9  = card.h9 !== undefined ? card.h9 : (card.grt !== undefined ? card.grt : 50);
      const k9  = card.k9 !== undefined ? card.k9 : (card.stf !== undefined ? card.stf : 50);
      const bb9 = card.bb9 !== undefined ? card.bb9 : (card.ctl !== undefined ? card.ctl : 50);
      const hr9 = card.hr9 !== undefined ? card.hr9 : (card.mov !== undefined ? card.mov : 50);
      const sta = card.sta !== undefined ? card.sta : 65;
      statsHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          ${renderStat('H/9', h9)}
          ${renderStat('K/9', k9)}
          ${renderStat('BB/9', bb9)}
          ${renderStat('HR/9', hr9)}
          ${renderStat('STA', sta)}
          <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:9px;color:#9ca3af;font-family:'Press Start 2P',monospace;">ROL</span>
            <span style="font-size:11px;font-weight:bold;color:#38bdf8">${card.role || 'P'}</span>
          </div>
        </div>
      `;
    } else {
      const kavd = card.k_avd !== undefined ? card.k_avd : (card.k_avoid !== undefined ? card.k_avoid : (card.con || 40));
      statsHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          ${renderStat('CON', card.con || 40)}
          ${renderStat('PWR', card.pwr || 40)}
          ${renderStat('EYE', card.eye || 40)}
          ${renderStat('K/AVD', kavd)}
          ${renderStat('SPD', card.spd || 40)}
          ${renderStat('DEF', card.def || 40)}
        </div>
      `;
    }

    let badgesHtml = '';
    if (card.hof || card.is_hof || careerStats.hof) badgesHtml += '<span style="background:#ffd70022;color:#ffd700;border:1px solid #ffd700;padding:2px 8px;border-radius:4px;font-size:8px">🏆 HOF</span>';
    if (card.clutch || card.is_clutch) badgesHtml += '<span style="background:#ef444422;color:#ef4444;border:1px solid #ef4444;padding:2px 8px;border-radius:4px;font-size:8px">⚡ CLUTCH</span>';
    if (card.captain || card.is_captain) badgesHtml += '<span style="background:#3b82f622;color:#3b82f6;border:1px solid #3b82f6;padding:2px 8px;border-radius:4px;font-size:8px">👑 CAPTAIN</span>';

    const awardPills = [];
    if (careerStats.allstars > 0) awardPills.push(`<span style="background:rgba(255,255,255,0.08);color:#fff;border:1px solid #4b5563;padding:2px 6px;border-radius:4px;font-size:8px">⭐ ${careerStats.allstars}x All-Star</span>`);
    if (careerStats.mvp > 0) awardPills.push(`<span style="background:rgba(234,179,8,0.12);color:#eab308;border:1px solid #eab308;padding:2px 6px;border-radius:4px;font-size:8px">🏆 ${careerStats.mvp}x MVP</span>`);
    if (careerStats.cy > 0) awardPills.push(`<span style="background:rgba(56,189,248,0.12);color:#38bdf8;border:1px solid #38bdf8;padding:2px 6px;border-radius:4px;font-size:8px">👑 ${careerStats.cy}x Cy Young</span>`);
    if (careerStats.gg > 0) awardPills.push(`<span style="background:rgba(255,215,0,0.12);color:#ffd700;border:1px solid #ffd700;padding:2px 6px;border-radius:4px;font-size:8px">🥊 ${careerStats.gg}x GG</span>`);
    if (careerStats.ss > 0) awardPills.push(`<span style="background:rgba(56,189,248,0.12);color:#38bdf8;border:1px solid #38bdf8;padding:2px 6px;border-radius:4px;font-size:8px">🥈 ${careerStats.ss}x SS</span>`);
    if (careerStats.roy > 0) awardPills.push(`<span style="background:rgba(167,243,208,0.12);color:#a7f3d0;border:1px solid #a7f3d0;padding:2px 6px;border-radius:4px;font-size:8px">🌱 ${careerStats.roy}x ROY</span>`);

    let draftCardHTML = '';
    if (typeof window.createCardHTML === 'function') {
      draftCardHTML = window.createCardHTML(card);
    } else {
      draftCardHTML = `<div style="padding:20px; color:#fff;">${card.name} - OVR ${card.ovr}</div>`;
    }

    let contractFlavor = _t('dynasty.contract_multi', 'Acuerdo multianual de franquicia');
    if (contractYears >= 8) {
      contractFlavor = '🌟 ' + _t('dynasty.contract_mega', '¡Mega contrato de franquicia!');
    } else if ((card.ovr || 75) >= 88 && contractYears <= 2) {
      contractFlavor = '⚠️ ' + _t('dynasty.contract_short', 'Contrato corto de prueba (Mala suerte)');
    } else if ((card.ovr || 75) <= 75 && contractYears >= 7) {
      contractFlavor = '🎉 ' + _t('dynasty.contract_surprise', '¡Apuesta de futuro sorpresa!');
    }

    const isLastPack = packNum >= total;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; width:100%; max-width:440px; margin:0 auto; animation: packCardBurst 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
        
        <!-- 3D FLIP CARD CONTAINER (Exact 440px width and original Dex padding) -->
        <div class="dex-flip-card-container" id="dynasty-flip-container" style="perspective:1200px; width:100%; max-width:440px; min-height:480px; margin:0 auto; cursor:pointer;" title="${_t('dynasty.tap_to_flip', 'Toca para girar la carta')}">
          <div class="dex-flip-card-inner" id="dynasty-flip-inner">
            
            <!-- LADO A: FICHA EXACTA BASEBALL-DEX (1:1) -->
            <div class="dex-card-face dex-card-front" style="background:#0a0f1a; border:3px solid ${rColor}; border-radius:12px; padding:24px; box-shadow: 0 0 35px ${rColor}66; text-align:left;">
              
              <div style="margin-bottom:16px; padding-right:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-family:'Press Start 2P',monospace; font-size:9.5px; color:${rColor};">${card.rarity || 'Common'} · ${eraShort}</span>
                  <span style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#38bdf8; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:2px 6px; border-radius:4px;">${_t('dynasty.tap_to_flip', '🔄 TOCA PARA FLIP')}</span>
                </div>
                <h2 style="font-family:'Press Start 2P',monospace; font-size:13px; color:#fff; margin:0 0 4px 0; line-height:1.4; display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
                  <span>${cName}</span>
                  ${flagHTML}
                </h2>
                <div style="font-size:11px; color:#9ca3af;">${card.team || 'MLB'} — ${card.year || ''} · <span style="color:#e2e8f0; font-weight:bold;">${getCardPositionText(card)}</span></div>
              </div>

              <div style="text-align:center; margin-bottom:16px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:32px; color:${rColor}; text-shadow:0 0 20px ${rColor}88;">${Math.floor(card.ovr || 75)}</div>
                <div style="font-size:10px; color:#6b7280; font-family:'Press Start 2P',monospace;">${_t('dynasty.ovr_rating', 'OVR')}</div>
              </div>

              ${statsHTML}

              ${badgesHtml ? `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px;">${badgesHtml}</div>` : ''}

              <!-- Career MLB Stats Box (1:1 with Dex) -->
              <div style="background:#111827; border-radius:8px; padding:12px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#38bdf8; margin-bottom:10px; text-align:center;">
                  ${_t('dynasty.career_stats_header', 'ESTADÍSTICAS DE CARRERA (MLB)')}
                </div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px 10px; text-align:center;">
                  ${isPitcher ? (isReliever ? `
                    <div><div style="font-size:13px; font-weight:bold; color:#38bdf8">${typeof careerStats.sv === 'number' ? careerStats.sv.toLocaleString() : (careerStats.sv || '-')}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">${_t("dynasty.card_career_saves", "SALVADOS (SV)")}</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#10b981">${careerStats.era || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">ERA</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#fb923c">${typeof careerStats.so === 'number' ? careerStats.so.toLocaleString() : (careerStats.so || '-')}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">${_t("dynasty.card_career_strikeouts", "PONCHES (K)")}</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#facc15">${careerStats.whip || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">WHIP</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#2dd4bf">${careerStats.w !== '-' ? `${careerStats.w}-${careerStats.l}` : (careerStats.ip || '-')}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">W-L</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">WAR</div></div>
                  ` : `
                    <div><div style="font-size:13px; font-weight:bold; color:#38bdf8">${careerStats.w !== '-' ? `${careerStats.w}-${careerStats.l}` : '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">${_t("dynasty.card_career_record", "RÉCORD (W-L)")}</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#10b981">${careerStats.era || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">ERA</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#fb923c">${typeof careerStats.so === 'number' ? careerStats.so.toLocaleString() : (careerStats.so || '-')}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">${_t("dynasty.card_career_strikeouts", "PONCHES (K)")}</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#facc15">${careerStats.whip || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">WHIP</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#2dd4bf">${careerStats.ip || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">${_t("dynasty.card_career_innings", "INNINGS (IP)")}</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">WAR</div></div>
                  `) : `
                    <div><div style="font-size:13px; font-weight:bold; color:#38bdf8">${typeof careerStats.h === 'number' ? careerStats.h.toLocaleString() : (careerStats.h || '-')}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">${_t("dynasty.card_career_hits", "HITS (H)")}</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#f87171">${typeof careerStats.hr === 'number' ? careerStats.hr.toLocaleString() : (careerStats.hr || '-')}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">${_t("dynasty.card_career_homers", "JONRONES (HR)")}</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#fbbf24">${typeof careerStats.rbi === 'number' ? careerStats.rbi.toLocaleString() : (careerStats.rbi || '-')}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">${_t("dynasty.card_career_rbis", "IMPULSADAS (RBI)")}</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#34d399">${careerStats.avg || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">AVG</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#facc15">${careerStats.ops || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">OPS</div></div>
                    <div><div style="font-size:13px; font-weight:bold; color:#4ade80">${careerStats.war || '-'}</div><div style="font-size:7px; color:#9ca3af; margin-top:2px">WAR</div></div>
                  `}
                </div>
                ${awardPills.length > 0 ? `<div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-top:10px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.12);">${awardPills.join('')}</div>` : ''}
              </div>

            </div>

            <!-- LADO B: TRADING CARD 1:1 CON DEX -->
            <div class="dex-card-face dex-card-back" style="border:3px solid ${rColor}; box-shadow: 0 0 35px ${rColor}66;">
              <div style="font-family:'Press Start 2P',monospace; font-size:9px; color:#ffd700; margin-bottom:14px; letter-spacing:1px; text-align:center;">
                🎴 DRAFT TRADING CARD
              </div>
              <div style="transform:scale(1.15); margin:15px 0;">
                ${draftCardHTML}
              </div>
              <div style="font-size:10px; color:#9ca3af; margin-top:16px; text-align:center; font-family:'Press Start 2P',monospace; line-height:1.4;">
                ${card.name} · ${card.year || ''}
              </div>
              <div style="margin-top:12px; font-family:'Press Start 2P',monospace; font-size:7.5px; color:#38bdf8;">
                ${_t('dynasty.tap_to_flip', '🔄 TOCA PARA VER ESTADÍSTICAS (DEX)')}
              </div>
            </div>

          </div>
        </div>

        <!-- CONTROLES INFERIORES: FLIP + CONTRATO + BOTÓN SIGUIENTE -->
        <div style="margin-top:14px; width:100%; max-width:440px; display:flex; flex-direction:column; align-items:center; gap:10px;">
          
          <button id="btn-dynasty-flip-card" type="button" style="padding:7px 16px; background:linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.3)); border:1.5px solid #38bdf8; color:#38bdf8; border-radius:6px; font-family:'Press Start 2P',monospace; font-size:8px; cursor:pointer; box-shadow:0 0 12px rgba(56,189,248,0.3); display:inline-flex; align-items:center; gap:6px; transition:transform 0.15s;">
            🔄 ${_t('dynasty.tap_to_flip', 'FLIP CARTA')}
          </button>

          <div style="background:rgba(0,255,102,0.1); border:1.5px solid #00ff66; border-radius:8px; padding:8px 16px; text-align:center; width:100%; box-sizing:border-box;">
            <div style="font-family:'Press Start 2P',monospace; font-size:10.5px; color:#00ff66; text-shadow:0 0 8px rgba(0,255,102,0.6);">
              ${_t('dynasty.signed_contract', '✍️ CONTRATO FIRMADO: {{years}} AÑOS', { years: contractYears })}
            </div>
            <div style="font-size:9px; color:#94a3b8; margin-top:3px;">
              ${contractFlavor} • OVR ${Math.round(card.ovr || 75)}
            </div>
          </div>

          ${customActionHTML !== null ? customActionHTML : `
          <button id="btn-dynasty-next-pack" class="btn" style="width:100%; padding:13px 20px; font-family:'Press Start 2P',monospace; font-size:10.5px; background:linear-gradient(135deg,#00ff66,#059669); color:#000; border:none; border-radius:8px; cursor:pointer; box-shadow:0 0 18px rgba(0,255,102,0.4); margin-top:4px;">
            ${isLastPack ? _t('dynasty.view_roster_btn', '📋 VER ROSTER COMPLETO (25 JUGADORES) ➔') : _t('dynasty.next_pack_btn', '📦 ABRIR SIGUIENTE SOBRE ({{next}}/{{total}}) ➔', { next: packNum + 1, total })}
          </button>
          `}

        </div>

      </div>
    `;
  }


  // ── Generador de Equipos Rivales para la Liga ─────────────────────────────
  function generateLeagueOpponents() {
    const bPool = getBatterPool();
    const pPool = getPitcherPool();
    const opponents = {};

    MLB_TEAMS.forEach(team => {
      // Rosters de 25 jugadores completamente aleatorios de TODO el pool de la MLB
      const pulled = [];
      const used = new Set();

      // 1. 9 Bateadores titulares para cubrir cada posición requerida
      const targetSlots = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
      targetSlots.forEach(slot => {
        const pick = pickWeightedCard(bPool, [slot], used);
        if (pick) {
          pulled.push(pick);
          used.add(cardKey(pick));
        }
      });

      // 2. 4 Bateadores aleatorios para la banca (total 13 bateadores)
      while (pulled.filter(c => !c.role).length < 13) {
        const pick = pickWeightedCard(bPool, [], used);
        if (pick) {
          pulled.push(pick);
          used.add(cardKey(pick));
        } else {
          break;
        }
      }

      // 3. 5 Lanzadores Abridores (SP) aleatorios de todo el pool
      const spPoolAll = pPool.filter(p => (p.role || 'SP').toUpperCase() === 'SP');
      for (let i = 0; i < 5; i++) {
        const pick = pickWeightedCard(spPoolAll.length ? spPoolAll : pPool, ['SP'], used);
        if (pick) {
          pulled.push(pick);
          used.add(cardKey(pick));
        }
      }

      // 4. 7 Relevistas / Cerradores (RP/CP/CL) aleatorios de todo el pool
      const rpPoolAll = pPool.filter(p => (p.role || 'SP').toUpperCase() !== 'SP');
      for (let i = 0; i < 7; i++) {
        const pick = pickWeightedCard(rpPoolAll.length ? rpPoolAll : pPool, ['RP', 'CL', 'CP'], used);
        if (pick) {
          pulled.push(pick);
          used.add(cardKey(pick));
        }
      }

      const { lineup, bench, sp, rp } = calculateRosterSlots(pulled, true);
      const orderedLineup = buildOptimalLineupOrder(lineup);

      opponents[team.code] = {
        code: team.code,
        name: team.name,
        icon: team.icon,
        color: team.color,
        league: team.league,
        div: team.div,
        lineup: orderedLineup,
        bench: bench,
        sp: sp.filter(Boolean),
        rp: rp.filter(Boolean)
      };
    });

    return opponents;
  }

  // ── OBJETO PRINCIPAL DYNASTY MODE ──────────────────────────────────────────
  window.DynastyMode = {
    state: null,
    boxOpening: {
      totalPacks: ROSTER_SIZE,
      currentPack: 0,
      pulledCards: [],
      isOpening: false
    },

    init() {
      this.load();
      this.bindMenu();
    },

    onLanguageChange() {
      const screen = document.getElementById('screen-dynasty-hub');
      if (screen && !screen.classList.contains('hidden')) {
        if (this.hasSave()) {
          this.renderSeasonHub();
        } else {
          this.renderNewFranchiseScreen();
        }
      }
    },

    hasSave() {
      return Boolean(this.state && this.state.seasonYear && this.state.roster && this.state.roster.lineup);
    },

    save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Dynasty: Failed to save', e);
      }
    },

    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          this.state = JSON.parse(raw);
          if (!this.state.stats) this.state.stats = { batters: {}, pitchers: {} };
          if (!this.state.careerStats) this.state.careerStats = { batters: {}, pitchers: {} };
          if (!this.state.history) this.state.history = [];
          if (!this.state.resignAttempts) this.state.resignAttempts = {};
          if (this.state.streak === undefined) this.state.streak = 0;
          // Si los rosters de los rivales se habían generado con la versión anterior por franquicia, regenerar aleatorio
          if (!this.state.leagueRosters || !this.state.rivalRostersRandomizedV2) {
            this.state.leagueRosters = generateLeagueOpponents();
            this.state.rivalRostersRandomizedV2 = true;
            this.save();
          }
        }
      } catch (e) {
        this.state = null;
      }
      return this.state;
    },

    clear() {
      localStorage.removeItem(SAVE_KEY);
      this.state = null;
      this.renderNewFranchiseScreen();
    },

    bindMenu() {
      const btn = document.getElementById('btn-dynasty-mode-open');
      if (btn) {
        btn.onclick = () => this.openDynastyHub();
      }
    },

    openDynastyHub() {
      this.hideAllScreens();
      const screen = document.getElementById('screen-dynasty-hub');
      if (screen) screen.classList.remove('hidden');

      if (this.hasSave()) {
        this.renderSeasonHub();
      } else {
        this.renderNewFranchiseScreen();
      }
    },

    hideAllScreens() {
      const screens = [
        'screen-mode-select', 'screen-menu', 'screen-dynasty-hub',
        'screen-challenge-hub', 'screen-challenge-roster', 'screen-challenge-season',
        'screen-challenge-playoffs', 'screen-challenge-results'
      ];
      screens.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.classList.add('hidden');
      });
      const gw = document.getElementById('game-workspace');
      if (gw) gw.classList.add('hidden');
      const hud = document.getElementById('game-hud');
      if (hud) hud.classList.add('hidden');
    },

    // ── 1. Pantalla de Selección de Franquicia (Agrupada por AL/NL y Divisiones) ──
    renderNewFranchiseScreen() {
      const container = document.getElementById('dynasty-content-area');
      if (!container) return;

      const renderDivision = (league, div) => {
        const teams = MLB_TEAMS.filter(t => t.league === league && t.div === div);
        return `
          <div style="margin-bottom:12px;">
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#38bdf8; margin-bottom:6px; text-transform:uppercase;">
              División ${_t('dynasty.' + div.toLowerCase(), div)}
            </div>
            <div class="dynasty-divisions-teams" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:6px;">
              ${teams.map(team => `
                <div class="dynasty-team-card" data-code="${team.code}" style="border-left: 3px solid ${team.color}; padding:8px 4px; background:rgba(255,255,255,0.03); border-radius:6px; cursor:pointer; text-align:center;">
                  <div style="font-size: 18px; margin-bottom: 3px;">${team.icon}</div>
                  <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${team.code}</div>
                  <div style="font-size:8px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${team.city}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      };

      container.innerHTML = `
        <div style="text-align: center; max-width: 1050px; margin: 0 auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:#ffd700;">
              📦 ${_t('dynasty.title', 'MODO DINASTÍA')}: ${_t('dynasty.select_franchise', 'ELIGE TU FRANQUICIA')}
            </div>
            <button id="btn-dynasty-back-menu" class="btn btn-secondary" style="padding:6px 12px; font-size:8.5px;">
              ${_t('dynasty.back_menu', '← MENÚ')}
            </button>
          </div>

          <p style="font-size:10.5px; color:#94a3b8; line-height:1.5; max-width:750px; margin:0 auto 16px auto;">
            ${_t('dynasty.select_desc', 'Selecciona tu franquicia. Recibirás una Hobby Box de 25 sobres coleccionables para abrir uno a uno y conformar tu Roster oficial de 25 jugadores con contratos multianuales.')}
          </p>

          <div class="dynasty-leagues-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
            <!-- AMERICAN LEAGUE -->
            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:12px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:10px; color:#38bdf8; margin-bottom:12px; border-bottom:1px solid rgba(56,189,248,0.2); padding-bottom:6px;">
                ⚾ ${_t('dynasty.american_league', 'LIGA AMERICANA (AL)')}
              </div>
              ${renderDivision('AL', 'East')}
              ${renderDivision('AL', 'Central')}
              ${renderDivision('AL', 'West')}
            </div>

            <!-- NATIONAL LEAGUE -->
            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(244,63,94,0.3); border-radius:10px; padding:12px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:10px; color:#f43f5e; margin-bottom:12px; border-bottom:1px solid rgba(244,63,94,0.2); padding-bottom:6px;">
                ⚾ ${_t('dynasty.national_league', 'LIGA NACIONAL (NL)')}
              </div>
              ${renderDivision('NL', 'East')}
              ${renderDivision('NL', 'Central')}
              ${renderDivision('NL', 'West')}
            </div>
          </div>

          <div id="dynasty-selected-team-banner" style="display:none; background:rgba(255,215,0,0.1); border:1.5px solid #ffd700; border-radius:8px; padding:10px 16px; margin-bottom:14px;">
            <span id="dynasty-selected-team-text" style="font-family:'Press Start 2P',monospace; font-size:11px; color:#ffd700;"></span>
          </div>

          <button id="btn-dynasty-start-box" class="btn" style="padding:13px 26px; font-family:'Press Start 2P',monospace; font-size:11px; background:linear-gradient(135deg,#ffd700,#f59e0b); color:#000; border:none; border-radius:8px; cursor:pointer; box-shadow:0 0 20px rgba(255,215,0,0.4); display:none;" disabled>
            ${_t('dynasty.open_box_btn', '📦 ABRIR HOBBY BOX (25 SOBRES) ➔')}
          </button>
        </div>
      `;

      const btnBack = document.getElementById('btn-dynasty-back-menu');
      if (btnBack) {
        btnBack.onclick = () => {
          this.hideAllScreens();
          const ms = document.getElementById('screen-mode-select');
          if (ms) ms.classList.remove('hidden');
        };
      }

      let chosenCode = null;
      container.querySelectorAll('.dynasty-team-card').forEach(card => {
        card.onclick = () => {
          container.querySelectorAll('.dynasty-team-card').forEach(c => {
            c.style.background = 'rgba(255,255,255,0.03)';
            c.style.borderColor = 'rgba(255,255,255,0.1)';
          });
          card.style.background = 'rgba(255,215,0,0.15)';
          card.style.borderColor = '#ffd700';
          chosenCode = card.dataset.code;
          const tObj = MLB_TEAMS.find(t => t.code === chosenCode);

          const banner = document.getElementById('dynasty-selected-team-banner');
          const bannerText = document.getElementById('dynasty-selected-team-text');
          const btnStart = document.getElementById('btn-dynasty-start-box');

          if (banner && bannerText && btnStart) {
            banner.style.display = 'block';
            const divRivals = MLB_TEAMS.filter(t => t.league === tObj.league && t.div === tObj.div && t.code !== tObj.code).map(t => t.code).join(', ');
            bannerText.innerHTML = `
              <div style="display:flex; align-items:center; gap:14px; text-align:left;">
                <div style="font-size:36px; filter:drop-shadow(0 0 10px ${tObj.color});">${tObj.icon}</div>
                <div>
                  <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:#ffd700;">${tObj.name.toUpperCase()}</div>
                  <div style="font-size:9.5px; color:#9ca3af; margin-top:3px;">${tObj.city} • ${tObj.league} ${tObj.div} • ${_t('dynasty.div_rivals', 'Rivales')}: <strong style="color:#38bdf8;">${divRivals}</strong></div>
                  <div style="font-size:8.5px; color:#34d399; margin-top:2px;">${_t('dynasty.box_plan', 'Caja 1: 13 Bateadores (Lineup + Banca) ➔ Caja 2: 12 Lanzadores (Rotación + Bullpen)')}</div>
                </div>
              </div>
              <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#00ff66; background:rgba(0,255,102,0.1); border:1px solid rgba(0,255,102,0.3); padding:6px 12px; border-radius:6px;">
                ✔ ${_t('dynasty.ready_to_draft', 'LISTO')}
              </div>
            `;
            btnStart.style.display = 'inline-block';
            btnStart.disabled = false;
            btnStart.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };
      });

      const btnStart = document.getElementById('btn-dynasty-start-box');
      if (btnStart) {
        btnStart.onclick = () => {
          if (!chosenCode) return;
          this.startNewFranchise(chosenCode);
        };
      }
    },

    startNewFranchise(teamCode) {
      const userTeam = MLB_TEAMS.find(t => t.code === teamCode) || MLB_TEAMS[0];

      this.state = {
        team: userTeam,
        seasonYear: 1,
        budget: 50,
        championships: 0,
        roster: {
          lineup: {},
          lineupOrder: [],
          bench: [],
          sp: [],
          rp: []
        },
        contracts: {},
        stats: { batters: {}, pitchers: {} },
        careerStats: { batters: {}, pitchers: {} },
        history: [],
        streak: 0,
        currentDay: 0,
        standings: this.generateInitialStandings(),
        leagueRosters: generateLeagueOpponents(),
        gameLog: [],
        eventsSeen: { day40: false, day81: false, day110: false }
      };

      this.startHobbyBoxOpening('batters');
    },

    startHobbyBoxOpening(stage = 'batters') {
      const isOffseason = (this.state.roster && (
        Object.keys(this.state.roster.lineup || {}).length > 0 ||
        (this.state.roster.bench && this.state.roster.bench.length > 0) ||
        (this.state.roster.sp && this.state.roster.sp.length > 0) ||
        (this.state.roster.rp && this.state.roster.rp.length > 0)
      ));

      if (isOffseason) {
        this.boxOpening = {
          stage: 'offseason',
          totalPacks: this.boxOpening ? this.boxOpening.totalPacks : 5,
          currentPack: 0,
          pulledCards: [],
          isOpening: false
        };
      } else if (stage === 'batters') {
        this.boxOpening = {
          stage: 'batters',
          boxNumber: 1,
          totalPacks: 13,
          currentPack: 0,
          pulledCards: [],
          isOpening: false
        };
      } else {
        this.boxOpening = {
          stage: 'pitchers',
          boxNumber: 2,
          totalPacks: 12,
          currentPack: 0,
          pulledCards: this.boxOpening ? this.boxOpening.pulledCards : [],
          isOpening: false
        };
      }
      this.renderNextPack();
    },

    renderBoxTransitionScreen() {
      const container = document.getElementById('dynasty-content-area');
      if (!container) return;

      container.innerHTML = `
        <div style="max-width: 700px; margin: 30px auto; text-align:center; background:rgba(0,0,0,0.7); border:2px solid #38bdf8; border-radius:12px; padding:26px; box-shadow:0 0 35px rgba(56,189,248,0.35);">
          <div style="font-size:40px; margin-bottom:10px;">⚾</div>
          <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#ffd700; margin-bottom:12px; line-height:1.4;">
            ${_t('dynasty.batters_complete_title', '¡CAJA DE BATEADORES COMPLETADA!')}
          </div>
          <p style="font-size:11px; color:#e2e8f0; line-height:1.6; margin-bottom:18px;">
            ${_t('dynasty.batters_complete_desc', 'Has seleccionado tus 9 titulares y 4 piezas de banca. Ahora abre la <strong>Caja de Pitcheo (12 Sobres)</strong> para definir a tus 5 abridores y 7 brazos del bullpen.')}
          </p>

          <div style="display:inline-block; background:rgba(56,189,248,0.1); border:1px solid #38bdf8; border-radius:8px; padding:12px 20px; margin-bottom:24px;">
            <div style="font-family:'Press Start 2P',monospace; font-size:9px; color:#38bdf8; margin-bottom:4px;">
              📦 CAJA #2: HOBBY BOX DE PITCHERS
            </div>
            <div style="font-size:9.5px; color:#9ca3af;">
              5 Abridores (SP1..SP5) + 7 Relevistas (Bullpen & Cerrador)
            </div>
          </div>

          <div>
            <button id="btn-start-pitchers-box" class="btn" style="padding:14px 28px; font-family:'Press Start 2P',monospace; font-size:10.5px; background:linear-gradient(135deg,#38bdf8,#0284c7); color:#000; border:none; border-radius:8px; cursor:pointer; box-shadow:0 0 20px rgba(56,189,248,0.4);">
              ${_t('dynasty.open_pitchers_box_btn', '📦 ABRIR CAJA DE PITCHERS (12 SOBRES) ➔')}
            </button>
          </div>
        </div>
      `;

      const btn = document.getElementById('btn-start-pitchers-box');
      if (btn) {
        btn.onclick = () => {
          this.startHobbyBoxOpening('pitchers');
        };
      }
    },

    renderNextPack() {
      const container = document.getElementById('dynasty-content-area');
      if (!container) return;

      const packNum = this.boxOpening.currentPack + 1;
      const total = this.boxOpening.totalPacks;
      const pulled = this.boxOpening.pulledCards;

      let isPitcherPack = false;
      const isOffseasonRefill = (this.state.roster && (
        Object.keys(this.state.roster.lineup || {}).length > 0 ||
        (this.state.roster.bench && this.state.roster.bench.length > 0) ||
        (this.state.roster.sp && this.state.roster.sp.length > 0) ||
        (this.state.roster.rp && this.state.roster.rp.length > 0)
      ));

      if (isOffseasonRefill) {
        const curSP = this.state.roster.sp ? this.state.roster.sp.length : 0;
        const curRP = this.state.roster.rp ? this.state.roster.rp.length : 0;
        const neededPitchers = Math.max(0, 5 - curSP) + Math.max(0, 7 - curRP);
        const pulledPitchers = pulled.filter(c => c.role).length;
        isPitcherPack = (pulledPitchers < neededPitchers);
      } else {
        isPitcherPack = (this.boxOpening.stage === 'pitchers');
      }

      // ── Selección directa e instantánea de la carta ─────────────────────────
      const bPool = getBatterPool();
      const pPool = getPitcherPool();
      const usedKeys = new Set(this.boxOpening.pulledCards.map(cardKey));

      const currentSlots = calculateRosterSlots(this.boxOpening.pulledCards, false);
      const missingPos = [];

      if (isOffseasonRefill) {
        if (isPitcherPack) {
          const curSP = (this.state.roster.sp || []).length + this.boxOpening.pulledCards.filter(c => (c.role||'SP').toUpperCase() === 'SP').length;
          const curRP = (this.state.roster.rp || []).length + this.boxOpening.pulledCards.filter(c => (c.role||'SP').toUpperCase() !== 'SP').length;
          if (curSP < 5) missingPos.push('SP');
          if (curRP < 7) missingPos.push('RP', 'CL', 'CP');
        } else {
          LINEUP_SLOTS.forEach(slot => {
            const hasSlotInRoster = this.state.roster.lineup && this.state.roster.lineup[slot];
            const hasSlotInPulled = this.boxOpening.pulledCards.some(c => c.pos === slot || (c.sec_pos && c.sec_pos.includes(slot)));
            if (!hasSlotInRoster && !hasSlotInPulled) missingPos.push(slot);
          });
        }
      } else {
        if (isPitcherPack) {
          const spEmpty = currentSlots.sp.filter(s => s === null).length;
          const rpEmpty = currentSlots.rp.filter(s => s === null).length;
          if (spEmpty > 0) missingPos.push('SP');
          if (rpEmpty > 0) missingPos.push('RP', 'CL', 'CP');
        } else {
          LINEUP_SLOTS.forEach(slot => {
            if (!currentSlots.lineup[slot]) missingPos.push(slot);
          });
        }
      }

      const pool = isPitcherPack ? pPool : bPool;
      let card = pickWeightedCard(pool, missingPos, usedKeys);

      if (!card) {
        const fallbackPool = isPitcherPack ? pPool : bPool;
        card = fallbackPool.find(c => !usedKeys.has(cardKey(c))) || fallbackPool[0];
      }

      const contractYears = generateContract(card);
      const cKey = cardKey(card);
      this.state.contracts[cKey] = contractYears;

      this.boxOpening.pulledCards.push(card);
      this.boxOpening.currentPack++;

      // Reproducir sonido de carta
      if (window.BaseballDex && typeof window.BaseballDex.playPackSound === 'function') {
        window.BaseballDex.playPackSound('Rare');
      }

      // Recalcular slots con la nueva carta incluida
      const updatedSlots = calculateRosterSlots(this.boxOpening.pulledCards, false);

      const renderMiniSlot = (slotLabel, player) => {
        if (!player) {
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); border:1px dashed rgba(255,255,255,0.15); border-radius:4px; padding:2px 6px; margin-bottom:2px; font-size:7.5px;">
              <span style="font-family:'Press Start 2P',monospace; color:#64748b;">${slotLabel}</span>
              <span style="color:#475569; font-style:italic;">${_t("dynasty.empty_slot", "[Vacío]")}</span>
            </div>
          `;
        }
        const contract = this.state.contracts[cardKey(player)] || 1;
        const ovrCol = player.ovr >= 90 ? '#ffd700' : (player.ovr >= 80 ? '#38bdf8' : '#10b981');
        const isCurrentCard = cardKey(player) === cKey;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:${isCurrentCard ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.04)'}; border:1px solid ${isCurrentCard ? '#ffd700' : 'rgba(255,255,255,0.1)'}; border-radius:4px; padding:2px 6px; margin-bottom:2px; font-size:7.5px; animation: fadeIn 0.3s ease;">
            <div style="display:flex; align-items:center; gap:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">
              <span style="font-family:'Press Start 2P',monospace; font-size:6.5px; color:${isCurrentCard ? '#ffd700' : '#94a3b8'}; width:20px;">${slotLabel}</span>
              <span style="color:#fff; font-weight:bold; overflow:hidden; text-overflow:ellipsis;">${cleanName(player)}</span>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
              <span style="font-family:'Press Start 2P',monospace; font-size:7px; color:${ovrCol};">${Math.round(player.ovr || 75)}</span>
              <span style="font-family:'Press Start 2P',monospace; font-size:6.5px; color:#00ff66; background:rgba(0,255,102,0.1); border:1px solid rgba(0,255,102,0.25); padding:1px 3px; border-radius:2px;">${contract}${_t("dynasty.year_suffix", "a")}</span>
            </div>
          </div>
        `;
      };

      const lineupSlotsHTML = LINEUP_SLOTS.map(slot => renderMiniSlot(slot, updatedSlots.lineup[slot])).join('');
      const benchSlotsHTML = [0, 1, 2, 3].map(idx => renderMiniSlot(`BN${idx + 1}`, updatedSlots.bench[idx])).join('');
      const spSlotsHTML = [0, 1, 2, 3, 4].map(idx => renderMiniSlot(`SP${idx + 1}`, updatedSlots.sp[idx])).join('');
      const rpSlotsHTML = [0, 1, 2, 3, 4, 5, 6].map(idx => renderMiniSlot(idx === 6 ? 'CP' : `RP${idx + 1}`, updatedSlots.rp[idx])).join('');

      container.innerHTML = `
        <div style="max-width: 1240px; margin: 0 auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <span style="font-family:'Press Start 2P',monospace; font-size:12px; color:#ffd700;">
                📦 HOBBY BOX: ${this.state.team.icon} ${this.state.team.name.toUpperCase()}
              </span>
              <span style="font-size:9.5px; color:#94a3b8; margin-left:8px;">
                (${_t('dynasty.pack_progress', 'CARTA {{curr}} DE {{total}}', { curr: packNum, total })})
              </span>
            </div>
            <div style="font-family:'Press Start 2P',monospace; font-size:8.5px; color:#00ff66;">
              ${packNum}/${total}
            </div>
          </div>

          <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-bottom:14px;">
            <div style="width:${(packNum / total) * 100}%; height:100%; background:linear-gradient(90deg, #38bdf8, #ffd700, #00ff66); transition:width 0.3s ease;"></div>
          </div>

          <div class="dynasty-pack-stage-grid" style="display:grid; grid-template-columns: 460px 1fr; gap:16px; align-items:start;">
            
            <!-- COLUMNA IZQUIERDA: CARTA REVELADA DIRECTAMENTE (SIN SOBRE INTERMEDIO) -->
            <div class="dynasty-pack-left-col" style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,215,0,0.25); border-radius:10px; padding:12px; text-align:center; min-height:500px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
              <div id="dynasty-pack-revealed-slot" style="width:100%;">
                ${renderDexCardFlipHTML(card, contractYears, packNum, total)}
              </div>
            </div>

            <!-- COLUMNA DERECHA: TABLERO EN VIVO DEL ROSTER LLENÁNDOSE -->
            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(56,189,248,0.25); border-radius:10px; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
                <span style="font-family:'Press Start 2P',monospace; font-size:9px; color:#38bdf8;">
                  ${_t('dynasty.roster_forming_title', '📋 ROSTER EN FORMACIÓN ({{count}}/25)', { count: this.boxOpening.pulledCards.length })}
                </span>
                <span style="font-size:8.5px; color:#94a3b8;">
                  ${_t('dynasty.bat_pitch_count', '{{bat}} Bat • {{pitch}} Pitch', { bat: updatedSlots.batters.length, pitch: updatedSlots.pitchers.length })}
                </span>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                  <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#ffd700; margin-bottom:4px;">
                    ${_t('dynasty.lineup_forming', '⚡ LINEUP (9 TITULARES)')}
                  </div>
                  ${lineupSlotsHTML}

                  <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#a7f3d0; margin:8px 0 4px 0;">
                    ${_t('dynasty.bench_forming', '🛋️ BANCA ({{count}}/4)', { count: updatedSlots.bench.length })}
                  </div>
                  ${benchSlotsHTML}
                </div>

                <div>
                  <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#38bdf8; margin-bottom:4px;">
                    ${_t('dynasty.rotation_forming', '🧢 ROTACIÓN (5 SP)')}
                  </div>
                  ${spSlotsHTML}

                  <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#f472b6; margin:8px 0 4px 0;">
                    ${_t('dynasty.bullpen_forming', '🔥 BULLPEN (7 RP)')}
                  </div>
                  ${rpSlotsHTML}
                </div>
              </div>
            </div>

          </div>
        </div>
      `;

      const isLastPack = this.boxOpening.currentPack >= total;

      const btnFlip = container.querySelector('#btn-dynasty-flip-card');
      const flipInner = container.querySelector('#dynasty-flip-inner');
      const flipContainer = container.querySelector('#dynasty-flip-container');

      const doFlip = (e) => {
        if (e) e.stopPropagation();
        if (flipInner) {
          flipInner.classList.toggle('flipped');
          if (window.BaseballDex && typeof window.BaseballDex.playCardFlipSound === 'function') {
            window.BaseballDex.playCardFlipSound();
          } else if (typeof window.playSound === 'function') {
            window.playSound('card_flip');
          }
        }
      };

      if (btnFlip) btnFlip.onclick = doFlip;
      if (flipContainer) flipContainer.onclick = doFlip;

      const btnNext = container.querySelector('#btn-dynasty-next-pack');
      if (btnNext) {
        btnNext.onclick = (e) => {
          e.stopPropagation();
          if (isLastPack) {
            if (this.boxOpening.stage === 'batters') {
              this.renderBoxTransitionScreen();
            } else {
              this.assignAndShowRoster();
            }
          } else {
            this.renderNextPack();
          }
        };
      }
    },

    assignAndShowRoster() {
      const isReplenishing = (this.state.roster && (
        Object.keys(this.state.roster.lineup || {}).length > 0 ||
        (this.state.roster.bench && this.state.roster.bench.length > 0) ||
        (this.state.roster.sp && this.state.roster.sp.length > 0) ||
        (this.state.roster.rp && this.state.roster.rp.length > 0)
      ));

      if (isReplenishing) {
        // En reposición tras agencia libre: solo rellenamos los huecos vacantes con las cartas obtenidas
        const newBatters = this.boxOpening.pulledCards.filter(c => !c.role);
        const newPitchers = this.boxOpening.pulledCards.filter(c => c.role);

        // Rellenar lineup titular faltante
        LINEUP_SLOTS.forEach(slot => {
          if (!this.state.roster.lineup[slot] && newBatters.length > 0) {
            const matchIdx = newBatters.findIndex(b => b.pos === slot || (b.sec_pos && b.sec_pos.includes(slot)));
            if (matchIdx !== -1) {
              this.state.roster.lineup[slot] = newBatters.splice(matchIdx, 1)[0];
            } else {
              this.state.roster.lineup[slot] = newBatters.shift();
            }
          }
        });

        // Rellenar banca restante
        while (this.state.roster.bench.length < 4 && newBatters.length > 0) {
          this.state.roster.bench.push(newBatters.shift());
        }

        // Si sobran lanzadores o bateadores por descarte
        newPitchers.forEach(p => {
          const isSP = (p.role || 'SP').toUpperCase() === 'SP';
          if (isSP && this.state.roster.sp.length < 5) {
            this.state.roster.sp.push(p);
          } else if (this.state.roster.rp.length < 7) {
            this.state.roster.rp.push(p);
          } else if (this.state.roster.sp.length < 5) {
            this.state.roster.sp.push(p);
          }
        });
      } else {
        const { lineup, bench, sp, rp } = calculateRosterSlots(this.boxOpening.pulledCards, true);
        this.state.roster = { lineup, bench, sp, rp };
      }

      // Asegurar orden óptimo inicial
      if (!this.state.roster.lineupOrder || this.state.roster.lineupOrder.length < 9) {
        const opt = buildOptimalLineupOrder(this.state.roster.lineup);
        this.state.roster.lineupOrder = opt.map(cardKey);
      } else {
        // Filtrar claves que ya no existan y agregar nuevas
        const activeKeys = Object.values(this.state.roster.lineup).filter(Boolean).map(cardKey);
        let order = this.state.roster.lineupOrder.filter(k => activeKeys.includes(k));
        activeKeys.forEach(k => {
          if (!order.includes(k)) order.push(k);
        });
        this.state.roster.lineupOrder = order;
      }

      this.initPlayerStats();
      this.save();
      this.renderRosterOverview();
    },

    initPlayerStats() {
      if (!this.state.stats) this.state.stats = { batters: {}, pitchers: {} };
      if (!this.state.careerStats) this.state.careerStats = { batters: {}, pitchers: {} };

      const allPlayers = [
        ...Object.values(this.state.roster.lineup),
        ...this.state.roster.bench,
        ...this.state.roster.sp,
        ...this.state.roster.rp
      ].filter(Boolean);

      allPlayers.forEach(p => {
        const k = cardKey(p);
        const isPitcher = Boolean(p.role);
        if (isPitcher) {
          if (!this.state.stats.pitchers[k]) {
            this.state.stats.pitchers[k] = { name: cleanName(p), role: p.role || 'P', year: p.year, team: p.team, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
          }
          if (!this.state.careerStats.pitchers[k]) {
            this.state.careerStats.pitchers[k] = { name: cleanName(p), role: p.role || 'P', outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0, seasons: 0 };
          }
        } else {
          if (!this.state.stats.batters[k]) {
            this.state.stats.batters[k] = { name: cleanName(p), pos: p.pos || 'UTL', year: p.year, team: p.team, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
          }
          if (!this.state.careerStats.batters[k]) {
            this.state.careerStats.batters[k] = { name: cleanName(p), pos: p.pos || 'UTL', ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0, seasons: 0 };
          }
        }
      });
    },

    renderRosterOverview() {
      const container = document.getElementById('dynasty-content-area');
      if (!container || !this.state) return;

      const R = this.state.roster;
      const C = this.state.contracts || {};

      // Asegurar orden de bateo válido
      if (!R.lineupOrder || R.lineupOrder.length < 9) {
        const opt = buildOptimalLineupOrder(R.lineup);
        R.lineupOrder = opt.map(cardKey);
      }

      // Obtener bateadores ordenados por lineupOrder
      const orderedLineupBatters = R.lineupOrder.map(k => {
        return Object.values(R.lineup).find(p => p && cardKey(p) === k)
          || R.bench.find(p => p && cardKey(p) === k);
      }).filter(Boolean);

      const renderPlayerRow = (p, roleOrPos, isDraggable = false, orderNum = null) => {
        if (!p) return `<div style="padding:4px; color:#6b7280; font-size:9px;">${_t("dynasty.empty_slot", "Vacío")}</div>`;
        const cK = cardKey(p);
        const years = C[cK] || 1;
        const ovrClass = p.ovr >= 90 ? '#ffd700' : (p.ovr >= 80 ? '#38bdf8' : '#10b981');
        const posLabel = getPlayerPositionInLineup(R.lineup, p);

        return `
          <div class="dynasty-player-row ${isDraggable ? 'dynasty-draggable-player' : ''}" 
               data-key="${cK}" 
               ${isDraggable ? `draggable="true" data-index="${orderNum - 1}"` : ''}
               style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:5px; padding:5px 8px; margin-bottom:4px; cursor:pointer; transition:all 0.15s ease;">
            <div style="display:flex; align-items:center; gap:6px;">
              ${isDraggable ? `<span style="font-family:'Press Start 2P',monospace; font-size:8px; color:#ffd700; width:18px; text-align:center;">${orderNum}.</span>` : ''}
              <span style="font-family:'Press Start 2P',monospace; font-size:7px; color:#9ca3af; background:rgba(255,255,255,0.08); padding:2px 4px; border-radius:3px;">${isDraggable ? posLabel : roleOrPos}</span>
              <span style="font-size:10px; font-weight:bold; color:#fff;">${cleanName(p)}</span>
              <span style="font-size:8px; color:#94a3b8;">(${p.year || ''})</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-family:'Press Start 2P',monospace; font-size:8px; color:${ovrClass};">${Math.round(p.ovr || 75)} OVR</span>
              <span style="font-family:'Press Start 2P',monospace; font-size:7px; color:#00ff66; background:rgba(0,255,102,0.1); border:1px solid rgba(0,255,102,0.3); padding:1px 4px; border-radius:2px;">
                ${years} ${years === 1 ? _t('dynasty.year_suffix', 'AÑO') : _t('dynasty.years_suffix', 'AÑOS')}
              </span>
              ${isDraggable ? `
                <div class="dynasty-order-btn-group" style="display:inline-flex; gap:2px; align-items:center;">
                  <button type="button" class="dynasty-order-btn btn-move-up" data-idx="${orderNum - 1}" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#ffd700; padding:2px 5px; font-size:8px; border-radius:3px; cursor:pointer;" title="Subir">▲</button>
                  <button type="button" class="dynasty-order-btn btn-move-down" data-idx="${orderNum - 1}" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#ffd700; padding:2px 5px; font-size:8px; border-radius:3px; cursor:pointer;" title="Bajar">▼</button>
                </div>
                <span style="color:#64748b; font-size:10px; cursor:grab;" class="dynasty-drag-handle">☰</span>
              ` : ''}
            </div>
          </div>
        `;
      };

      const lineupHTML = orderedLineupBatters.map((p, idx) => renderPlayerRow(p, null, true, idx + 1)).join('');
      const benchHTML = R.bench.map((p, idx) => renderPlayerRow(p, `BN${idx + 1}`)).join('');
      const spHTML = R.sp.map((p, idx) => renderPlayerRow(p, `SP${idx + 1}`)).join('');
      const rpHMTL = R.rp.map((p, idx) => renderPlayerRow(p, idx === R.rp.length - 1 ? 'CP' : `RP${idx + 1}`)).join('');

      container.innerHTML = `
        <div style="max-width: 1240px; margin: 0 auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:#ffd700;">
                ${_t('dynasty.official_roster_title', '📋 ROSTER OFICIAL DE 25: {{icon}} {{name}}', { icon: this.state.team.icon, name: this.state.team.name.toUpperCase() })}
              </div>
              <div style="font-size:9.5px; color:#94a3b8; margin-top:3px;">
                ${_t('dynasty.official_roster_subtitle', 'Temporada {{year}} • Contratos multianuales vigentes', { year: this.state.seasonYear })}
              </div>
            </div>

            <div style="display:flex; gap:8px;">
              <button id="btn-dynasty-optimal-lineup" class="btn btn-secondary" style="padding:10px 14px; font-family:'Press Start 2P',monospace; font-size:8.5px; color:#ffd700; border-color:#ffd70077;">
                ${_t('dynasty.optimal_order_btn', '⚡ ORDEN ÓPTIMO')}
              </button>
              <button id="btn-dynasty-start-season" class="btn" style="padding:10px 18px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:linear-gradient(135deg,#38bdf8,#0284c7); color:#000; border:none; border-radius:6px; cursor:pointer; box-shadow:0 0 12px rgba(56,189,248,0.4);">
                ${_t('dynasty.start_season_btn', '⚾ INICIAR TEMPORADA REGULAR (162 JUEGOS) ➔')}
              </button>
            </div>
          </div>

          <div style="font-size:9px; color:#38bdf8; margin-bottom:10px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:6px 12px;">
            ${_t('dynasty.click_player_hint', '💡 Toca a cualquier jugador para ver su carta y estadísticas completas')} • ${_t('dynasty.batting_order_hint', 'Orden de Bateo (Arrastra y suelta para reordenar)')}
          </div>

          <div class="dynasty-roster-columns" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:14px; margin-bottom:16px;">
            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,215,0,0.2); border-radius:8px; padding:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-family:'Press Start 2P',monospace; font-size:8.5px; color:#ffd700;">
                  ${_t('dynasty.lineup_title', '⚡ LINEUP TITULAR (9 BATEADORES)')}
                </div>
              </div>
              <div id="dynasty-lineup-container">
                ${lineupHTML}
              </div>
            </div>

            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(56,189,248,0.2); border-radius:8px; padding:10px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:8.5px; color:#38bdf8; margin-bottom:6px;">
                ${_t('dynasty.rotation_title', '🧢 ROTACIÓN DE ABRIDORES (5 SP)')}
              </div>
              ${spHTML}

              <div style="font-family:'Press Start 2P',monospace; font-size:8.5px; color:#38bdf8; margin:10px 0 6px 0;">
                ${_t('dynasty.bullpen_title', '🔥 BULLPEN & CERRADOR (7 RP)')}
              </div>
              ${rpHMTL}
            </div>

            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:10px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:8.5px; color:#a7f3d0; margin-bottom:6px;">
                ${_t('dynasty.bench_title', '🛋️ BANCA DE SUPLENTES (4 JUGADORES)')}
              </div>
              ${benchHTML}
            </div>
          </div>
        </div>
      `;

      const btnStartSeason = document.getElementById('btn-dynasty-start-season');
      if (btnStartSeason) {
        btnStartSeason.onclick = () => this.renderSeasonHub();
      }

      const btnOptimal = document.getElementById('btn-dynasty-optimal-lineup');
      if (btnOptimal) {
        btnOptimal.onclick = () => {
          const opt = buildOptimalLineupOrder(R.lineup);
          R.lineupOrder = opt.map(cardKey);
          this.save();
          this.renderRosterOverview();
        };
      }

      // Drag and Drop para el Lineup
      const lineupRows = container.querySelectorAll('.dynasty-draggable-player');
      let dragSrcEl = null;

      lineupRows.forEach(row => {
        row.addEventListener('dragstart', (e) => {
          dragSrcEl = row;
          row.style.opacity = '0.4';
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', row.dataset.key);
        });

        row.addEventListener('dragover', (e) => {
          if (e.preventDefault) e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          row.style.background = 'rgba(255,215,0,0.15)';
          row.style.borderColor = '#ffd700';
          return false;
        });

        row.addEventListener('dragleave', () => {
          row.style.background = 'rgba(255,255,255,0.03)';
          row.style.borderColor = 'rgba(255,255,255,0.08)';
        });

        row.addEventListener('drop', (e) => {
          if (e.stopPropagation) e.stopPropagation();
          row.style.background = 'rgba(255,255,255,0.03)';
          row.style.borderColor = 'rgba(255,255,255,0.08)';

          if (dragSrcEl !== row) {
            const srcIdx = parseInt(dragSrcEl.dataset.index, 10);
            const targetIdx = parseInt(row.dataset.index, 10);

            if (!isNaN(srcIdx) && !isNaN(targetIdx)) {
              const item = R.lineupOrder.splice(srcIdx, 1)[0];
              R.lineupOrder.splice(targetIdx, 0, item);
              this.save();
              this.renderRosterOverview();
            }
          }
          return false;
        });

        row.addEventListener('dragend', () => {
          row.style.opacity = '1.0';
        });
      });

      // Botones de orden táctiles (Móvil / Pantallas táctiles)
      container.querySelectorAll('.dynasty-order-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx, 10);
          if (isNaN(idx)) return;
          if (btn.classList.contains('btn-move-up') && idx > 0) {
            const item = R.lineupOrder.splice(idx, 1)[0];
            R.lineupOrder.splice(idx - 1, 0, item);
            this.save();
            this.renderRosterOverview();
          } else if (btn.classList.contains('btn-move-down') && idx < R.lineupOrder.length - 1) {
            const item = R.lineupOrder.splice(idx, 1)[0];
            R.lineupOrder.splice(idx + 1, 0, item);
            this.save();
            this.renderRosterOverview();
          }
        };
      });

      // Click en cualquier jugador para abrir el Modal de Carta y Estadísticas de la Run
      container.querySelectorAll('.dynasty-player-row').forEach(row => {
        row.onclick = (e) => {
          if (e.target.closest('.dynasty-order-btn')) return;
          const key = row.dataset.key;
          const allPlayers = [
            ...Object.values(R.lineup),
            ...R.bench,
            ...R.sp,
            ...R.rp
          ].filter(Boolean);
          const found = allPlayers.find(p => cardKey(p) === key);
          if (found) {
            this.showPlayerStatsModal(found);
          }
        };
      });
    },

    generateInitialStandings() {
      const standings = {};
      MLB_TEAMS.forEach(team => {
        standings[team.code] = {
          code: team.code,
          name: team.name,
          icon: team.icon,
          league: team.league,
          div: team.div,
          w: 0,
          l: 0,
          rs: 0,
          ra: 0
        };
      });
      return standings;
    },

    // ── 2. Season Hub con Pestañas: Standings, Stats, Líderes, Rivales y Reset ──
    renderSeasonHub(activeTab = 'standings') {
      const container = document.getElementById('dynasty-content-area');
      if (!container || !this.state) return;

      const S = this.state;
      const userTeam = S.team;
      const gamesPlayed = S.currentDay;
      const totalGames = 162;
      const isSeasonFinished = gamesPlayed >= totalGames;

      const userRecord = S.standings[userTeam.code] || { w: 0, l: 0 };
      const streak = S.streak || 0;

      let streakBadge = '';
      if (streak >= 3) {
        const buff = Math.min(8, Math.floor(streak / 2) + 2);
        streakBadge = `
          <div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; border-radius:6px; padding:4px 10px; display:inline-flex; align-items:center; gap:6px; font-family:'Press Start 2P',monospace; font-size:7.5px; color:#ef4444;">
            ${_t('dynasty.streak_hot', '🔥 EN RACHA: {{count}} VICTORIAS (BUFF +{{buff}} CONTACTO)', { count: streak, buff })}
          </div>
        `;
      } else if (streak <= -3) {
        streakBadge = `
          <div style="background:rgba(56,189,248,0.15); border:1px solid #38bdf8; border-radius:6px; padding:4px 10px; display:inline-flex; align-items:center; gap:6px; font-family:'Press Start 2P',monospace; font-size:7.5px; color:#38bdf8;">
            ${_t('dynasty.streak_cold', '❄️ SLUMP: {{count}} DERROTAS (PENALIDAD)', { count: Math.abs(streak) })}
          </div>
        `;
      }

      container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
          
          <!-- Header con Información de Temporada y Récord -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span style="font-family:'Press Start 2P',monospace; font-size:12px; color:#ffd700;">
                  ${_t('dynasty.season_header', '⚾ TEMPORADA {{year}}: {{icon}} {{name}}', { year: S.seasonYear, icon: userTeam.icon, name: userTeam.name.toUpperCase() })}
                </span>
                ${streakBadge}
              </div>
              <div style="font-size:10px; color:#9ca3af; margin-top:3px;">
                ${_t('dynasty.season_record_summary', 'Récord: <strong style="color:#34d399;">{{w}}W</strong> - <strong style="color:#f87171;">{{l}}L</strong> • {{league}} {{div}} ({{played}}/162 juegos) • Anillos: 🏆 {{rings}}', { w: userRecord.w, l: userRecord.l, league: userTeam.league, div: userTeam.div, played: gamesPlayed, rings: S.championships || 0 })}
              </div>
            </div>

            <!-- Botones de Acción de Simulación y Menú -->
            <div class="dynasty-action-buttons" style="display:flex; gap:6px; flex-wrap:wrap;">
              ${!isSeasonFinished ? `
                <button id="btn-dynasty-sim-segment" class="btn" style="padding:7px 14px; font-family:'Press Start 2P',monospace; font-size:8.5px; background:linear-gradient(135deg,#ffd700,#f59e0b); color:#000; box-shadow:0 0 10px rgba(255,215,0,0.35);">
                  ${_t('dynasty.sim_segment', '▶ SIMULAR SERIE (8 JUEGOS)')}
                </button>
                <button id="btn-dynasty-sim-1" class="btn" style="padding:7px 11px; font-family:'Press Start 2P',monospace; font-size:7.5px; background:#10b981; color:#000;">
                  ${_t('dynasty.sim_1', '▶ 1 JUEGO')}
                </button>
                <button id="btn-dynasty-sim-to-event" class="btn btn-secondary" style="padding:7px 11px; font-family:'Press Start 2P',monospace; font-size:7.5px;">
                  ${_t('dynasty.sim_event', '🎯 AL EVENTO')}
                </button>
              ` : `
                <button id="btn-dynasty-playoffs" class="btn" style="padding:9px 18px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:linear-gradient(135deg,#ffd700,#f59e0b); color:#000;">
                  ${_t('dynasty.playoffs_btn', '🏆 IR A POSTEMPORADA ➔')}
                </button>
              `}
              <button id="btn-dynasty-view-roster" class="btn btn-secondary" style="padding:7px 10px; font-size:8px;">
                ${_t('dynasty.roster_contracts', '📋 ROSTER & CONTRATOS')}
              </button>
              <button id="btn-dynasty-reset" class="btn btn-secondary" style="padding:7px 10px; font-size:8px; color:#ef4444; border-color:#ef444455;">
                ${_t('dynasty.reset_dynasty', '🗑️ REINICIAR')}
              </button>
              <button id="btn-dynasty-exit-menu" class="btn btn-secondary" style="padding:7px 10px; font-size:8px;">
                ${_t('dynasty.back_menu', '← MENÚ')}
              </button>
            </div>
          </div>

          <!-- Barra de Progreso de 162 Juegos -->
          <div style="position:relative; margin-bottom:14px;">
            <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">
              <div style="width:${(gamesPlayed / totalGames) * 100}%; height:100%; background:linear-gradient(90deg, #38bdf8, #ffd700, #34d399); transition:width 0.2s ease;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:7px; font-family:'Press Start 2P',monospace; color:#9ca3af; margin-top:3px;">
              <span>${_t("dynasty.day_timeline_start", "DÍA 1")}</span>
              <span style="color:${gamesPlayed >= 40 ? '#34d399' : '#f59e0b'};">${_t("dynasty.day_timeline_40", "DÍA 40 (REFUERZO)")}</span>
              <span style="color:${gamesPlayed >= 81 ? '#34d399' : '#ffd700'};">${_t("dynasty.day_timeline_81", "DÍA 81 (ALL-STAR)")}</span>
              <span style="color:${gamesPlayed >= 110 ? '#34d399' : '#ec4899'};">${_t("dynasty.day_timeline_110", "DÍA 110 (TRADE DEADLINE)")}</span>
              <span>${_t("dynasty.day_timeline_end", "DÍA 162")}</span>
            </div>
          </div>

          <!-- Pestañas Principales del Hub -->
          <div class="dynasty-tabs-bar" style="display:flex; gap:6px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; flex-wrap:wrap;">
            <button class="dynasty-tab-btn" data-tab="standings" style="padding:6px 12px; border-radius:5px; font-family:'Press Start 2P',monospace; font-size:7.5px; cursor:pointer; ${activeTab === 'standings' ? 'background:#ffd700; color:#000;' : 'background:rgba(255,255,255,0.05); color:#9ca3af;'}">
              ${_t('dynasty.standings', 'POSICIONES')}
            </button>
            <button class="dynasty-tab-btn" data-tab="power_rankings" style="padding:6px 12px; border-radius:5px; font-family:'Press Start 2P',monospace; font-size:7.5px; cursor:pointer; ${activeTab === 'power_rankings' ? 'background:#a855f7; color:#fff;' : 'background:rgba(255,255,255,0.05); color:#9ca3af;'}">
              ${_t('dynasty.power_rankings_tab', '⚡ POWER RANKINGS')}
            </button>
            <button class="dynasty-tab-btn" data-tab="stats" style="padding:6px 12px; border-radius:5px; font-family:'Press Start 2P',monospace; font-size:7.5px; cursor:pointer; ${activeTab === 'stats' ? 'background:#38bdf8; color:#000;' : 'background:rgba(255,255,255,0.05); color:#9ca3af;'}">
              ${_t('dynasty.team_stats', '📊 STATS EQUIPO')}
            </button>
            <button class="dynasty-tab-btn" data-tab="leaders" style="padding:6px 12px; border-radius:5px; font-family:'Press Start 2P',monospace; font-size:7.5px; cursor:pointer; ${activeTab === 'leaders' ? 'background:#00ff66; color:#000;' : 'background:rgba(255,255,255,0.05); color:#9ca3af;'}">
              ${_t('dynasty.league_leaders', '🏅 LÍDERES LIGA')}
            </button>
            <button class="dynasty-tab-btn" data-tab="rivals" style="padding:6px 12px; border-radius:5px; font-family:'Press Start 2P',monospace; font-size:7.5px; cursor:pointer; ${activeTab === 'rivals' ? 'background:#f43f5e; color:#000;' : 'background:rgba(255,255,255,0.05); color:#9ca3af;'}">
              ${_t('dynasty.view_opponents', '🔍 RIVALES')}
            </button>
            <button class="dynasty-tab-btn" data-tab="history" style="padding:6px 12px; border-radius:5px; font-family:'Press Start 2P',monospace; font-size:7.5px; cursor:pointer; ${activeTab === 'history' ? 'background:#f59e0b; color:#000;' : 'background:rgba(255,255,255,0.05); color:#9ca3af;'}">
              ${_t('dynasty.history_tab', '📜 HISTORIAL')}
            </button>
          </div>

          <!-- Contenido Dinámico de la Pestaña Activa -->
          <div id="dynasty-tab-content"></div>

        </div>
      `;

      if (activeTab === 'standings') this.renderStandingsTab();
      else if (activeTab === 'power_rankings') this.renderPowerRankingsTab();
      else if (activeTab === 'stats') this.renderStatsTab();
      else if (activeTab === 'leaders') this.renderLeadersTab();
      else if (activeTab === 'rivals') this.renderRivalsTab();
      else if (activeTab === 'history') this.renderHistoryTab();

      container.querySelectorAll('.dynasty-tab-btn').forEach(btn => {
        btn.onclick = () => this.renderSeasonHub(btn.dataset.tab);
      });

      const btnSimSegment = document.getElementById('btn-dynasty-sim-segment');
      const btnSim1 = document.getElementById('btn-dynasty-sim-1');
      const btnSimEvent = document.getElementById('btn-dynasty-sim-to-event');
      if (btnSimSegment) btnSimSegment.onclick = () => this.simulateSegment(8);
      const btnRoster = document.getElementById('btn-dynasty-view-roster');
      const btnPlayoffs = document.getElementById('btn-dynasty-playoffs');
      const btnReset = document.getElementById('btn-dynasty-reset');
      const btnExit = document.getElementById('btn-dynasty-exit-menu');

      if (btnSim1) btnSim1.onclick = () => this.simulateDays(1);
      const btnSim10 = document.getElementById('btn-dynasty-sim-10');
      if (btnSim10) btnSim10.onclick = () => this.simulateDays(10);
      if (btnSimEvent) btnSimEvent.onclick = () => this.simulateToNextEvent();
      if (btnRoster) btnRoster.onclick = () => this.renderRosterOverview();
      if (btnPlayoffs) btnPlayoffs.onclick = () => this.handlePlayoffsAndOffseason();
      if (btnReset) {
        btnReset.onclick = () => {
          if (confirm(_t('dynasty.reset_confirm', '¿Estás seguro de reiniciar tu dinastía? Perderás todo tu progreso actual.'))) {
            this.clear();
          }
        };
      }
      if (btnExit) {
        btnExit.onclick = () => {
          this.hideAllScreens();
          const ms = document.getElementById('screen-mode-select');
          if (ms) ms.classList.remove('hidden');
        };
      }
    },

    // ── Pestaña 1: Standings y Registro de Últimos Juegos ─────────────────────

    // ── Pestaña: Power Rankings (Clasificación de los 30 Equipos) ─────────────
    renderPowerRankingsTab() {
      const tabContent = document.getElementById('dynasty-tab-content');
      if (!tabContent || !this.state) return;

      const S = this.state;
      const rankings = MLB_TEAMS.map(team => {
        const std = S.standings[team.code] || { w: 0, l: 0, rs: 0, ra: 0 };
        const total = (std.w + std.l) || 1;
        const winPct = std.w / total;
        const runDiff = std.rs - std.ra;
        const roster = team.code === S.team.code 
          ? S.roster 
          : ((S.leagueRosters && S.leagueRosters[team.code]) || {});

        const lineupOvr = (roster.lineup ? (Array.isArray(roster.lineup) ? roster.lineup : Object.values(roster.lineup)) : []).map(p => p ? (p.ovr || 75) : 75);
        const spOvr = (roster.sp || []).map(p => p ? (p.ovr || 75) : 75);
        const allOvr = [...lineupOvr, ...spOvr];
        const avgOvr = allOvr.length > 0 ? (allOvr.reduce((a, b) => a + b, 0) / allOvr.length) : 76;

        // Composite Power Score formula: 55% Win%, 25% Run Differential, 20% Team Talent OVR
        const score = (winPct * 55) + (Math.max(-20, Math.min(20, runDiff / 5.0)) * 1.25) + ((avgOvr - 70) * 1.0);

        return {
          team,
          w: std.w,
          l: std.l,
          pct: (winPct).toFixed(3).replace(/^0/, ''),
          diff: runDiff >= 0 ? `+${runDiff}` : `${runDiff}`,
          ovr: Math.round(avgOvr),
          score: score.toFixed(1),
          isUser: team.code === S.team.code
        };
      });

      rankings.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

      const rowsHTML = rankings.map((r, idx) => {
        const rankNum = idx + 1;
        const rankColor = rankNum <= 5 ? '#ffd700' : (rankNum <= 12 ? '#38bdf8' : (rankNum > 25 ? '#ef4444' : '#9ca3af'));
        const bg = r.isUser ? 'background:rgba(255,215,0,0.12); border:1px solid #ffd700;' : 'background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.06);';

        return `
          <tr style="${bg} transition:background 0.15s ease;">
            <td style="padding:6px 8px; font-family:'Press Start 2P',monospace; font-size:8px; color:${rankColor}; text-align:center;">#${rankNum}</td>
            <td style="padding:6px 8px; font-weight:bold; color:#fff; display:flex; align-items:center; gap:6px;">
              <span style="font-size:16px;">${r.team.icon}</span>
              <span>${r.team.name}</span>
              ${r.isUser ? '<span style="font-family:\'Press Start 2P\',monospace; font-size:6px; color:#000; background:#ffd700; padding:1px 4px; border-radius:3px;">TU EQUIPO</span>' : ''}
            </td>
            <td style="padding:6px 8px; text-align:center; color:#9ca3af; font-size:8px;">${r.team.league} ${r.team.div}</td>
            <td style="padding:6px 8px; text-align:center; font-weight:bold; color:#34d399;">${r.w}-${r.l}</td>
            <td style="padding:6px 8px; text-align:center; color:#38bdf8;">${r.pct}</td>
            <td style="padding:6px 8px; text-align:center; color:${r.diff.startsWith('+') ? '#34d399' : '#f87171'}; font-weight:bold;">${r.diff}</td>
            <td style="padding:6px 8px; text-align:center; color:#fbbf24; font-weight:bold;">${r.ovr}</td>
            <td style="padding:6px 8px; text-align:center; font-family:'Press Start 2P',monospace; font-size:8px; color:#38bdf8;">${r.score}</td>
          </tr>
        `;
      }).join('');

      tabContent.innerHTML = `
        <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="font-family:'Press Start 2P',monospace; font-size:10.5px; color:#a855f7;">
              ⚡ POWER RANKINGS OFICIALES (TOP 1 AL 30)
            </div>
            <div style="font-size:9px; color:#9ca3af;">
              Ponderación de W-L, Diferencial de Carreras y Talento OVR
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:9.5px; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#9ca3af; font-family:'Press Start 2P',monospace; font-size:7px;">
                  <th style="padding:6px 8px; text-align:center;">RANK</th>
                  <th style="padding:6px 8px;">FRANQUICIA</th>
                  <th style="padding:6px 8px; text-align:center;">DIVISIÓN</th>
                  <th style="padding:6px 8px; text-align:center;">RÉCORD</th>
                  <th style="padding:6px 8px; text-align:center;">PCT</th>
                  <th style="padding:6px 8px; text-align:center;">DIF</th>
                  <th style="padding:6px 8px; text-align:center;">OVR</th>
                  <th style="padding:6px 8px; text-align:center;">POWER</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // ── Pestaña: Historial de Dinastía (Temporadas Pasadas & Trofeos) ─────────
    renderHistoryTab() {
      const tabContent = document.getElementById('dynasty-tab-content');
      if (!tabContent || !this.state) return;

      const S = this.state;
      const history = S.history || [];

      let historyHTML = '';
      if (history.length === 0) {
        historyHTML = `
          <div style="text-align:center; padding:30px 10px; color:#6b7280; font-size:10.5px;">
            <div style="font-size:32px; margin-bottom:8px;">📜</div>
            ${_t('dynasty.no_history_yet', 'Esta es tu Temporada de Debut (Temporada 1). Cuando culmines la Serie Mundial y pases a la agencia libre, aquí quedará registrada la historia de tu franquicia año tras año.')}
          </div>
        `;
      } else {
        historyHTML = history.map(h => `
          <div style="background:rgba(255,255,255,0.03); border:1px solid ${h.wonWS ? '#ffd700' : 'rgba(255,255,255,0.1)'}; border-radius:8px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-family:'Press Start 2P',monospace; font-size:9px; color:#ffd700;">TEMPORADA ${h.season}</span>
                ${h.wonWS ? '<span style="background:rgba(255,215,0,0.2); border:1px solid #ffd700; color:#ffd700; font-size:8px; padding:2px 6px; border-radius:4px; font-weight:bold;">🏆 CAMPEÓN MUNDIAL</span>' : ''}
              </div>
              <div style="font-size:10px; color:#e2e8f0; margin-top:4px;">${h.playoffResult}</div>
            </div>
            <div style="font-family:'Press Start 2P',monospace; font-size:10px; color:#34d399;">
              ${h.record}
            </div>
          </div>
        `).join('');
      }

      tabContent.innerHTML = `
        <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <div>
              <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:#ffd700;">
                📜 HISTORIAL DE LA DINASTÍA: ${S.team.icon} ${S.team.name.toUpperCase()}
              </div>
              <div style="font-size:9.5px; color:#9ca3af; margin-top:2px;">
                Temporada Actual: <strong>Año ${S.seasonYear}</strong> • Trofeos de Serie Mundial: 🏆 <strong>${S.championships || 0}</strong>
              </div>
            </div>
          </div>

          <div>
            ${historyHTML}
          </div>
        </div>
      `;
    },

    renderStandingsTab() {
      const tabContent = document.getElementById('dynasty-tab-content');
      if (!tabContent || !this.state) return;

      const S = this.state;
      const userTeam = S.team;

      const divTeams = Object.values(S.standings)
        .filter(t => t.league === userTeam.league && t.div === userTeam.div)
        .sort((a, b) => b.w - a.w || a.l - b.l || (b.rs - b.ra) - (a.rs - a.ra));

      const divRows = divTeams.map((t, idx) => {
        const isUser = t.code === userTeam.code;
        const leaderWins = divTeams[0].w;
        const gb = idx === 0 ? '-' : ((leaderWins - t.w) + (t.l - divTeams[0].l)) / 2;
        return `
          <tr style="background:${isUser ? 'rgba(255,215,0,0.12)' : 'transparent'}; font-weight:${isUser ? 'bold' : 'normal'};">
            <td style="padding:5px; text-align:center; color:${isUser ? '#ffd700' : '#9ca3af'};">${idx + 1}</td>
            <td style="padding:5px; color:${isUser ? '#ffd700' : '#fff'};">${t.icon} ${t.name}</td>
            <td style="padding:5px; text-align:center; color:#34d399;">${t.w}</td>
            <td style="padding:5px; text-align:center; color:#f87171;">${t.l}</td>
            <td style="padding:5px; text-align:center; color:#9ca3af;">${gb}</td>
            <td style="padding:5px; text-align:center; color:#9ca3af;">${t.rs - t.ra >= 0 ? '+' : ''}${t.rs - t.ra}</td>
          </tr>
        `;
      }).join('');

      const recentLogs = S.gameLog.slice(-6).reverse().map(g => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 8px; margin-bottom:3px; background:rgba(255,255,255,0.02); border-left:3px solid ${g.won ? '#34d399' : '#f87171'}; font-size:8.5px;">
          <span>${g.won ? '🟢 W' : '🔴 L'} vs ${g.oppIcon || '⚾'} ${g.oppName}</span>
          <span style="font-family:'Press Start 2P',monospace; font-size:7.5px;">${g.score}</span>
        </div>
      `).join('') || `<div style="color:#6b7280; font-size:8.5px; text-align:center; padding:10px;">${_t("dynasty.no_games_yet", "Aún no se han disputado partidos.")}</div>`;

      tabContent.innerHTML = `
        <div class="dynasty-standings-grid" style="display:grid; grid-template-columns: 2fr 1fr; gap:14px;">
          <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,215,0,0.2); border-radius:8px; padding:12px;">
            <div style="font-family:'Press Start 2P',monospace; font-size:9px; color:#ffd700; margin-bottom:8px;">
              📊 ${userTeam.league} ${userTeam.div.toUpperCase()}
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:10px;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#9ca3af; font-family:'Press Start 2P',monospace; font-size:7.5px;">
                  <th style="padding:5px; text-align:center;">#</th>
                  <th style="padding:5px; text-align:left;">${_t("dynasty.team_header_col", "EQUIPO")}</th>
                  <th style="padding:5px; text-align:center;">W</th>
                  <th style="padding:5px; text-align:center;">L</th>
                  <th style="padding:5px; text-align:center;">GB</th>
                  <th style="padding:5px; text-align:center;">${_t("dynasty.diff_header_col", "DIF")}</th>
                </tr>
              </thead>
              <tbody>
                ${divRows}
              </tbody>
            </table>
          </div>

          <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(56,189,248,0.2); border-radius:8px; padding:12px;">
            <div style="font-family:'Press Start 2P',monospace; font-size:9px; color:#38bdf8; margin-bottom:8px;">
              ${_t("dynasty.recent_results_title", "📜 ÚLTIMOS RESULTADOS")}
            </div>
            ${recentLogs}
          </div>
        </div>
      `;

      tabContent.querySelectorAll('.dynasty-stat-row').forEach(row => {
        row.onclick = () => {
          const key = row.dataset.key;
          const R = S.roster;
          const allPlayers = [
            ...Object.values(R.lineup),
            ...R.bench,
            ...R.sp,
            ...R.rp
          ].filter(Boolean);
          const found = allPlayers.find(p => cardKey(p) === key);
          if (found) {
            this.showPlayerStatsModal(found);
          }
        };
      });
    },

    // ── Pestaña 2: Estadísticas del Equipo (Bateo & Pitcheo con WAR) ─────────
    renderStatsTab() {
      const tabContent = document.getElementById('dynasty-tab-content');
      if (!tabContent || !this.state) return;

      const S = this.state;
      const bStats = S.stats.batters || {};
      const pStats = S.stats.pitchers || {};

      const batterRows = Object.entries(bStats)
        .filter(([key, s]) => !s.teamCode || s.teamCode === S.team.code)
        .map(([key, s]) => {
        const ab = s.ab || 0;
        const h = s.h || 0;
        const bb = s.bb || 0;
        const hr = s.hr || 0;
        const rbi = s.rbi || 0;
        const r = s.r || 0;
        const sb = s.sb || 0;
        const doubles = s.doubles || 0;
        const triples = s.triples || 0;
        const singles = Math.max(0, h - doubles - triples - hr);
        const tb = singles + doubles * 2 + triples * 3 + hr * 4;

        const avg = ab > 0 ? (h / ab).toFixed(3).replace(/^0/, '') : '.---';
        const obp = (ab + bb) > 0 ? ((h + bb) / (ab + bb)).toFixed(3).replace(/^0/, '') : '.---';
        const slg = ab > 0 ? (tb / ab).toFixed(3).replace(/^0/, '') : '.---';
        const ops = (avg !== '.---' && slg !== '.---') ? ((h + bb) / (ab + bb) + tb / ab).toFixed(3) : '.---';
        const war = calcBatterWAR(s, 50, s.pos || 'DH');

        return `
          <tr class="dynasty-stat-row" data-key="${key}" style="border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:background 0.15s ease;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">
            <td style="padding:4px 6px; font-weight:bold; color:#fff;">${s.name}</td>
            <td style="padding:4px 6px; text-align:center; color:#9ca3af;">${s.pos || 'UTL'}</td>
            <td style="padding:4px 6px; text-align:center;">${ab}</td>
            <td style="padding:4px 6px; text-align:center;">${r}</td>
            <td style="padding:4px 6px; text-align:center;">${h}</td>
            <td style="padding:4px 6px; text-align:center; font-weight:bold; color:#f87171;">${hr}</td>
            <td style="padding:4px 6px; text-align:center; font-weight:bold; color:#fbbf24;">${rbi}</td>
            <td style="padding:4px 6px; text-align:center;">${bb}</td>
            <td style="padding:4px 6px; text-align:center;">${sb}</td>
            <td style="padding:4px 6px; text-align:center; color:#34d399;">${avg}</td>
            <td style="padding:4px 6px; text-align:center; color:#38bdf8;">${obp}</td>
            <td style="padding:4px 6px; text-align:center; color:#facc15;">${slg}</td>
            <td style="padding:4px 6px; text-align:center; font-weight:bold; color:#facc15;">${ops}</td>
            <td style="padding:4px 6px; text-align:center; font-weight:bold; color:#4ade80;">${war}</td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="14" style="text-align:center; padding:10px; color:#6b7280;">${_t("dynasty.no_at_bats", "Sin turnos al bate disputados todavía.")}</td></tr>';

      const pitcherRows = Object.entries(pStats)
        .filter(([key, s]) => !s.teamCode || s.teamCode === S.team.code)
        .map(([key, s]) => {
        const outs = s.outs || 0;
        const ipFull = Math.floor(outs / 3);
        const ipRem = outs % 3;
        const ip = `${ipFull}.${ipRem}`;
        const ipNum = outs / 3.0;

        const era = ipNum > 0 ? ((s.er * 9.0) / ipNum).toFixed(2) : '-.--';
        const whip = ipNum > 0 ? (((s.h || 0) + (s.bb || 0)) / ipNum).toFixed(2) : '-.--';
        const war = calcPitcherWAR(s, s.role || 'SP');

        return `
          <tr class="dynasty-stat-row" data-key="${key}" style="border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:background 0.15s ease;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">
            <td style="padding:4px 6px; font-weight:bold; color:#fff;">${s.name}</td>
            <td style="padding:4px 6px; text-align:center; color:#9ca3af;">${s.role || 'P'}</td>
            <td style="padding:4px 6px; text-align:center; color:#38bdf8; font-weight:bold;">${s.w || 0}-${s.l || 0}</td>
            <td style="padding:4px 6px; text-align:center;">${ip}</td>
            <td style="padding:4px 6px; text-align:center;">${s.h || 0}</td>
            <td style="padding:4px 6px; text-align:center;">${s.er || 0}</td>
            <td style="padding:4px 6px; text-align:center;">${s.bb || 0}</td>
            <td style="padding:4px 6px; text-align:center; font-weight:bold; color:#fb923c;">${s.so || 0}</td>
            <td style="padding:4px 6px; text-align:center; font-weight:bold; color:#38bdf8;">${s.sv || 0}</td>
            <td style="padding:4px 6px; text-align:center; color:#10b981; font-weight:bold;">${era}</td>
            <td style="padding:4px 6px; text-align:center; color:#facc15;">${whip}</td>
            <td style="padding:4px 6px; text-align:center; font-weight:bold; color:#4ade80;">${war}</td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="12" style="text-align:center; padding:10px; color:#6b7280;">${_t("dynasty.no_innings_pitched", "Sin innings lanzados todavía.")}</td></tr>';

      tabContent.innerHTML = `
        <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(56,189,248,0.25); border-radius:10px; padding:12px; margin-bottom:14px;">
          <div style="font-family:'Press Start 2P',monospace; font-size:9px; color:#ffd700; margin-bottom:8px;">
            ${_t("dynasty.batter_stats_header", "⚡ ESTADÍSTICAS DE BATEADORES ({{icon}} {{name}})", { icon: S.team.icon, name: S.team.name.toUpperCase() })}
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:9.5px; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#9ca3af; font-family:'Press Start 2P',monospace; font-size:7px;">
                  <th style="padding:4px 6px;">BATEADOR</th>
                  <th style="padding:4px 6px; text-align:center;">POS</th>
                  <th style="padding:4px 6px; text-align:center;">AB</th>
                  <th style="padding:4px 6px; text-align:center;">R</th>
                  <th style="padding:4px 6px; text-align:center;">H</th>
                  <th style="padding:4px 6px; text-align:center;">HR</th>
                  <th style="padding:4px 6px; text-align:center;">RBI</th>
                  <th style="padding:4px 6px; text-align:center;">BB</th>
                  <th style="padding:4px 6px; text-align:center;">SB</th>
                  <th style="padding:4px 6px; text-align:center;">AVG</th>
                  <th style="padding:4px 6px; text-align:center;">OBP</th>
                  <th style="padding:4px 6px; text-align:center;">SLG</th>
                  <th style="padding:4px 6px; text-align:center;">OPS</th>
                  <th style="padding:4px 6px; text-align:center;">WAR</th>
                </tr>
              </thead>
              <tbody>
                ${batterRows}
              </tbody>
            </table>
          </div>
        </div>

        <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(56,189,248,0.25); border-radius:10px; padding:12px;">
          <div style="font-family:'Press Start 2P',monospace; font-size:9px; color:#38bdf8; margin-bottom:8px;">
            ${_t("dynasty.pitcher_stats_header", "🧢 ESTADÍSTICAS DE LANZADORES ({{icon}} {{name}})", { icon: S.team.icon, name: S.team.name.toUpperCase() })}
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:9.5px; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#9ca3af; font-family:'Press Start 2P',monospace; font-size:7px;">
                  <th style="padding:4px 6px;">LANZADOR</th>
                  <th style="padding:4px 6px; text-align:center;">ROL</th>
                  <th style="padding:4px 6px; text-align:center;">W-L</th>
                  <th style="padding:4px 6px; text-align:center;">IP</th>
                  <th style="padding:4px 6px; text-align:center;">H</th>
                  <th style="padding:4px 6px; text-align:center;">ER</th>
                  <th style="padding:4px 6px; text-align:center;">BB</th>
                  <th style="padding:4px 6px; text-align:center;">SO</th>
                  <th style="padding:4px 6px; text-align:center;">SV</th>
                  <th style="padding:4px 6px; text-align:center;">ERA</th>
                  <th style="padding:4px 6px; text-align:center;">WHIP</th>
                  <th style="padding:4px 6px; text-align:center;">WAR</th>
                </tr>
              </thead>
              <tbody>
                ${pitcherRows}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tabContent.querySelectorAll('.dynasty-stat-row').forEach(row => {
        row.onclick = () => {
          const key = row.dataset.key;
          const R = S.roster;
          const allPlayers = [
            ...Object.values(R.lineup),
            ...R.bench,
            ...R.sp,
            ...R.rp
          ].filter(Boolean);
          const found = allPlayers.find(p => cardKey(p) === key);
          if (found) {
            this.showPlayerStatsModal(found);
          }
        };
      });
    },

    // ── Pestaña 3: Líderes de la Liga (Toda la MLB - 30 Franquicias) ─────────
    renderLeadersTab() {
      const tabContent = document.getElementById('dynasty-tab-content');
      if (!tabContent || !this.state) return;

      const S = this.state;
      const bList = Object.entries(S.stats.batters || {}).map(([key, s]) => ({ ...s, _key: key }));
      const pList = Object.entries(S.stats.pitchers || {}).map(([key, s]) => ({ ...s, _key: key }));

      // Mínimo de apariciones para promedios (se escala con los días jugados)
      const minAB = Math.max(10, Math.floor(S.currentDay * 1.6));
      const minOuts = Math.max(15, Math.floor(S.currentDay * 2.2));

      const topHR = [...bList].sort((a, b) => (b.hr || 0) - (a.hr || 0)).slice(0, 5);
      const topRBI = [...bList].sort((a, b) => (b.rbi || 0) - (a.rbi || 0)).slice(0, 5);
      const topAVG = [...bList].filter(b => (b.ab || 0) >= minAB).sort((a, b) => ((b.h || 0) / (b.ab || 1)) - ((a.h || 0) / (a.ab || 1))).slice(0, 5);
      const topHits = [...bList].sort((a, b) => (b.h || 0) - (a.h || 0)).slice(0, 5);

      const topK = [...pList].sort((a, b) => (b.so || 0) - (a.so || 0)).slice(0, 5);
      const topW = [...pList].sort((a, b) => (b.w || 0) - (a.w || 0)).slice(0, 5);
      const topSV = [...pList].sort((a, b) => (b.sv || 0) - (a.sv || 0)).slice(0, 5);
      const topERA = [...pList].filter(p => (p.outs || 0) >= minOuts).sort((a, b) => (((a.er || 0) * 9) / ((a.outs || 1) / 3)) - (((b.er || 0) * 9) / ((b.outs || 1) / 3))).slice(0, 5);

      const getTeamBadge = (teamCode) => {
        if (!teamCode) return '';
        const meta = MLB_TEAMS.find(t => t.code === teamCode);
        const icon = meta ? meta.icon : '';
        const isUser = teamCode === S.team.code;
        const col = isUser ? '#ffd700' : '#38bdf8';
        return `<span style="font-size:7.5px; color:${col}; margin-left:3px;" title="${meta ? meta.name : teamCode}">(${icon || ''}${teamCode})</span>`;
      };

      const renderLeaderCol = (title, list, valFn, unit) => `
        <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,215,0,0.2); border-radius:6px; padding:8px;">
          <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#ffd700; margin-bottom:6px; text-align:center;">
            ${title}
          </div>
          ${list.map((p, idx) => `
            <div class="dynasty-leader-item-row" data-key="${p._key}" style="display:flex; justify-content:space-between; align-items:center; padding:4px 3px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:8.5px; cursor:pointer; border-radius:3px; transition:background 0.15s ease;">
              <span style="display:flex; align-items:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:130px;">
                <strong style="color:#ffd700; margin-right:4px;">${idx + 1}.</strong>
                <span style="color:#fff; font-weight:500;">${p.name}</span>
                ${getTeamBadge(p.teamCode)}
              </span>
              <span style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#38bdf8; white-space:nowrap;">
                ${valFn(p)} <small style="font-size:6px; color:#9ca3af;">${unit}</small>
              </span>
            </div>
          `).join('') || '<div style="font-size:7.5px; color:#6b7280; text-align:center; padding:6px 0;">-</div>'}
        </div>
      `;

      tabContent.innerHTML = `
        <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,215,0,0.25); border-radius:10px; padding:12px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:6px;">
            <div style="font-family:'Press Start 2P',monospace; font-size:10px; color:#ffd700;">
              ${_t('dynasty.season_leaders_title', '🏅 LÍDERES DE LA LIGA (TEMPORADA {{year}})', { year: S.seasonYear })}
            </div>
            <div style="font-size:7.5px; color:#9ca3af; font-family:'Press Start 2P',monospace;">
              MLB (30 EQUIPOS) • DÍA ${S.currentDay}/162
            </div>
          </div>
          
          <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#38bdf8; margin:8px 0 6px 2px;">
            ⚡ BATEO
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin-bottom:14px;">
            ${renderLeaderCol(_t('dynasty.leader_hr', 'JONRONES (HR)'), topHR, p => p.hr || 0, 'HR')}
            ${renderLeaderCol(_t('dynasty.leader_rbi', 'IMPULSADAS (RBI)'), topRBI, p => p.rbi || 0, 'RBI')}
            ${renderLeaderCol('PROMEDIO (AVG)', topAVG, p => p.ab ? ((p.h / p.ab).toFixed(3).replace(/^0/, '')) : '.000', '')}
            ${renderLeaderCol('HITS (H)', topHits, p => p.h || 0, 'H')}
          </div>

          <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#00ff66; margin:8px 0 6px 2px;">
            🧢 PITCHEO
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
            ${renderLeaderCol(_t('dynasty.leader_k', 'PONCHES (K)'), topK, p => p.so || 0, 'SO')}
            ${renderLeaderCol(_t('dynasty.leader_w', 'VICTORIAS (W)'), topW, p => p.w || 0, 'W')}
            ${renderLeaderCol('SALVADOS (SV)', topSV, p => p.sv || 0, 'SV')}
            ${renderLeaderCol('EFECTIVIDAD (ERA)', topERA, p => p.outs ? (((p.er * 9.0) / (p.outs / 3.0)).toFixed(2)) : '0.00', 'ERA')}
          </div>
        </div>
      `;

      // Enlazar click en cualquier líder de la liga para abrir su ficha completa en modal
      const poolBatters = getBatterPool();
      const poolPitchers = getPitcherPool();

      tabContent.querySelectorAll('.dynasty-leader-item-row').forEach(row => {
        row.onmouseenter = () => { row.style.background = 'rgba(56,189,248,0.15)'; };
        row.onmouseleave = () => { row.style.background = 'transparent'; };
        row.onclick = () => {
          const key = row.dataset.key;
          if (!key) return;

          // 1. Buscar en el roster del usuario
          const R = S.roster;
          const userPlayers = [
            ...Object.values(R.lineup || {}),
            ...(R.bench || []),
            ...(R.sp || []),
            ...(R.rp || [])
          ].filter(Boolean);
          let found = userPlayers.find(p => cardKey(p) === key);

          // 2. Si no es del usuario, buscar en los rosters de las 29 franquicias rivales
          if (!found && S.leagueRosters) {
            for (const tMeta of MLB_TEAMS) {
              const rObj = S.leagueRosters[tMeta.code];
              if (!rObj) continue;
              const rivalPlayers = [
                ...(rObj.lineup || []),
                ...(rObj.bench || []),
                ...(rObj.sp || []),
                ...(rObj.rp || [])
              ].filter(Boolean);
              found = rivalPlayers.find(p => cardKey(p) === key);
              if (found) break;
            }
          }

          // 3. Si aún no se encuentra, buscar en los pools de la MLB
          if (!found) {
            found = poolBatters.find(p => cardKey(p) === key) || poolPitchers.find(p => cardKey(p) === key);
          }

          if (found) {
            this.showPlayerStatsModal(found);
          }
        };
      });
    },

    // ── Sistema de Renovación / Resign de Jugadores ──────────────────────────
    showResignModal(player, onDone) {
      if (!player) return;
      const key = cardKey(player);
      const S = this.state || {};
      if (!S.resignAttempts) S.resignAttempts = {};
      const alreadyAttempted = Boolean(S.resignAttempts[key] && S.resignAttempts[key].year === S.seasonYear);
      const currentYears = (S.contracts && S.contracts[key]) || 1;
      const cName = cleanName(player);
      const ovr = Math.round(player.ovr || 75);

      // Calcular probabilidad según la fórmula
      const calcProb = (years) => {
        let prob = 55; // Base 55%

        // Rendimiento del equipo (W-L%)
        const userRecord = S.standings && S.standings[S.team.code];
        if (userRecord && (userRecord.w + userRecord.l) > 0) {
          const winPct = userRecord.w / (userRecord.w + userRecord.l);
          if (winPct >= 0.550) prob += 15;
          else if (winPct <= 0.450) prob -= 15;
        }

        // Calibre del jugador (OVR)
        if (ovr >= 90) prob -= 18;
        else if (ovr >= 85) prob -= 10;
        else if (ovr <= 76) prob += 15;

        // Longitud del contrato ofrecido
        if (years >= 4) prob += 10;
        else if (years === 1) prob -= 5;

        return Math.max(20, Math.min(90, prob));
      };

      const existing = document.getElementById('dynasty-resign-modal-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'dynasty-resign-modal-overlay';
      overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:100002; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(6px);';

      let selectedYears = 2;

      const updateUI = () => {
        const prob = calcProb(selectedYears);
        const probEl = overlay.querySelector('#dynasty-resign-prob-badge');
        if (probEl) {
          let badgeText = _t('dynasty.resign_interest_med', 'Interés Moderado ({{pct}}% Probabilidad)', { pct: prob });
          let color = '#38bdf8';
          let border = 'rgba(56,189,248,0.4)';
          let bg = 'rgba(56,189,248,0.1)';
          if (prob >= 70) {
            badgeText = _t('dynasty.resign_interest_high', 'Alto Interés ({{pct}}% Probabilidad)', { pct: prob });
            color = '#00ff66';
            border = 'rgba(0,255,102,0.4)';
            bg = 'rgba(0,255,102,0.1)';
          } else if (prob <= 40) {
            badgeText = _t('dynasty.resign_interest_low', 'Negociación Difícil ({{pct}}% Probabilidad)', { pct: prob });
            color = '#f87171';
            border = 'rgba(248,113,113,0.4)';
            bg = 'rgba(248,113,113,0.1)';
          }
          probEl.innerHTML = badgeText;
          probEl.style.color = color;
          probEl.style.borderColor = border;
          probEl.style.background = bg;
        }
      };

      overlay.innerHTML = `
        <div style="max-width:440px; width:100%; background:#0a0f1a; border:2px solid #ffd700; border-radius:12px; padding:20px; position:relative; box-shadow:0 0 35px rgba(255,215,0,0.3); text-align:center;">
          <button id="btn-close-resign-modal" style="position:absolute; top:12px; right:12px; background:none; border:none; color:#9ca3af; font-size:20px; cursor:pointer; line-height:1;">✕</button>
          
          <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:#ffd700; margin-bottom:8px;">
            ${_t('dynasty.resign_modal_title', 'OFERTA DE EXTENSIÓN')}
          </div>
          
          <div style="font-size:13px; font-weight:bold; color:#fff; margin-bottom:4px;">
            ${cName} (${ovr} OVR)
          </div>

          <div style="font-size:9px; color:#9ca3af; margin-bottom:14px; line-height:1.4;">
            ${_t('dynasty.resign_modal_desc', 'Intenta renovar a {{name}} antes de que llegue a la agencia libre. Evalúa récord, rol y contrato.', { name: cName, ovr: ovr })}
          </div>

          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px; margin-bottom:14px; text-align:left;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:9.5px; color:#9ca3af;">Contrato actual:</span>
              <span style="font-family:'Press Start 2P',monospace; font-size:9px; color:#ffd700;">${currentYears} ${currentYears === 1 ? _t('dynasty.year_suffix', 'AÑO') : _t('dynasty.years_suffix', 'AÑOS')}</span>
            </div>

            <div style="margin-top:10px;">
              <label style="font-size:9.5px; color:#38bdf8; display:block; margin-bottom:6px; font-weight:bold;">
                ${_t('dynasty.resign_offer_length', 'Años adicionales a ofrecer:')}
              </label>
              <div style="display:flex; gap:6px; justify-content:center;">
                ${[1, 2, 3, 4, 5].map(y => `
                  <button type="button" class="dynasty-resign-year-btn ${y === 2 ? 'active' : ''}" data-years="${y}" style="flex:1; padding:7px 0; font-family:'Press Start 2P',monospace; font-size:9px; background:${y === 2 ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)'}; border:1.5px solid ${y === 2 ? '#38bdf8' : 'rgba(255,255,255,0.15)'}; color:${y === 2 ? '#38bdf8' : '#fff'}; border-radius:6px; cursor:pointer;">
                    +${y}
                  </button>
                `).join('')}
              </div>
            </div>

            <div id="dynasty-resign-prob-badge" style="margin-top:12px; padding:8px 10px; border:1px solid rgba(56,189,248,0.3); border-radius:6px; text-align:center; font-size:9px; font-family:'Press Start 2P',monospace; transition:all 0.2s;">
            </div>
          </div>

          <div id="dynasty-resign-result-area" style="display:none; margin-bottom:12px; padding:10px; border-radius:8px; font-size:10px;"></div>

          ${alreadyAttempted ? `
            <div style="color:#f87171; font-size:9.5px; margin-bottom:10px; font-weight:bold;">
              ${_t('dynasty.resign_already_attempted', 'Ya le hiciste una oferta a {{name}} durante esta temporada.', { name: cName })}
            </div>
            <button id="btn-submit-resign" class="btn" style="width:100%; padding:12px; font-family:'Press Start 2P',monospace; font-size:9px; background:rgba(255,255,255,0.1); color:#64748b; border:none; border-radius:6px; cursor:not-allowed;" disabled>
              ${_t('dynasty.btn_already_negotiated', 'YA NEGOCIADO ESTE AÑO')}
            </button>
          ` : `
            <button id="btn-submit-resign" class="btn" style="width:100%; padding:12px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:linear-gradient(135deg,#00ff66,#059669); color:#000; border:none; border-radius:6px; cursor:pointer; box-shadow:0 0 15px rgba(0,255,102,0.4);">
              ${_t('dynasty.resign_submit_btn', 'ENVIAR OFERTA ➔')}
            </button>
          `}
        </div>
      `;

      document.body.appendChild(overlay);
      updateUI();

      const closeModal = () => overlay.remove();
      const closeBtn = overlay.querySelector('#btn-close-resign-modal');
      if (closeBtn) closeBtn.onclick = closeModal;
      overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

      overlay.querySelectorAll('.dynasty-resign-year-btn').forEach(btn => {
        btn.onclick = () => {
          if (alreadyAttempted) return;
          overlay.querySelectorAll('.dynasty-resign-year-btn').forEach(b => {
            b.style.background = 'rgba(255,255,255,0.05)';
            b.style.borderColor = 'rgba(255,255,255,0.15)';
            b.style.color = '#fff';
          });
          btn.style.background = 'rgba(56,189,248,0.25)';
          btn.style.borderColor = '#38bdf8';
          btn.style.color = '#38bdf8';
          selectedYears = parseInt(btn.dataset.years, 10) || 1;
          updateUI();
        };
      });

      const submitBtn = overlay.querySelector('#btn-submit-resign');
      if (submitBtn && !alreadyAttempted) {
        submitBtn.onclick = () => {
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.5';
          const prob = calcProb(selectedYears);
          const roll = Math.random() * 100;
          const accepted = roll < prob;

          // Registrar intento de negociación para esta temporada
          S.resignAttempts[key] = {
            year: S.seasonYear,
            accepted: accepted,
            date: Date.now()
          };

          const resultArea = overlay.querySelector('#dynasty-resign-result-area');
          if (accepted) {
            S.contracts[key] = (S.contracts[key] || 1) + selectedYears;
            this.save();
            if (typeof window.playSound === 'function') window.playSound('level_up');

            if (resultArea) {
              resultArea.style.display = 'block';
              resultArea.style.background = 'rgba(0,255,102,0.15)';
              resultArea.style.border = '1px solid #00ff66';
              resultArea.style.color = '#00ff66';
              resultArea.innerHTML = `
                <div style="font-family:'Press Start 2P',monospace; font-size:9.5px; margin-bottom:4px;">${_t('dynasty.resign_success_title', '¡ACUERDO ALCANZADO! 🎉')}</div>
                <div>${_t('dynasty.resign_success_desc', '¡{{name}} aceptó y renovó por {{years}} temporadas adicionales!', { name: cName, years: selectedYears })}</div>
              `;
            }
            submitBtn.textContent = '✔ EXTENSIÓN FIRMADA';
            submitBtn.style.background = 'rgba(0,255,102,0.2)';
            submitBtn.style.color = '#00ff66';
            setTimeout(() => {
              closeModal();
              if (onDone) onDone(true);
            }, 1600);
          } else {
            this.save();
            if (typeof window.playSound === 'function') window.playSound('strikeout');

            if (resultArea) {
              resultArea.style.display = 'block';
              resultArea.style.background = 'rgba(239,68,68,0.15)';
              resultArea.style.border = '1px solid #ef4444';
              resultArea.style.color = '#f87171';
              resultArea.innerHTML = `
                <div style="font-family:'Press Start 2P',monospace; font-size:9.5px; margin-bottom:4px;">${_t('dynasty.resign_fail_title', 'OFERTA RECHAZADA ❌')}</div>
                <div>${_t('dynasty.resign_fail_desc', '{{name}} rechazó la oferta. Prefiere probar el mercado en la agencia libre.', { name: cName })}</div>
              `;
            }
            submitBtn.textContent = '❌ RECHAZADA';
            submitBtn.style.background = 'rgba(239,68,68,0.2)';
            submitBtn.style.color = '#f87171';
            setTimeout(() => {
              closeModal();
              if (onDone) onDone(false);
            }, 1800);
          }
        };
      }
    },

    // ── Modal de Ficha y Estadísticas de Temporada y Dinastía ─────────────────
    showPlayerStatsModal(player) {
      if (!player) return;
      const key = cardKey(player);
      const isPitcher = Boolean(player.role);
      const S = this.state || {};
      const sStats = isPitcher ? (S.stats.pitchers[key] || {}) : (S.stats.batters[key] || {});
      const cStats = isPitcher ? (S.careerStats.pitchers[key] || {}) : (S.careerStats.batters[key] || {});
      const contract = (S.contracts && S.contracts[key]) || 1;

      let seasonStatsHTML = '';
      let careerStatsHTML = '';

      if (isPitcher) {
        const sOuts = sStats.outs || 0;
        const sIp = `${Math.floor(sOuts / 3)}.${sOuts % 3}`;
        const sEra = sOuts > 0 ? ((sStats.er * 9.0) / (sOuts / 3.0)).toFixed(2) : '-.--';
        const sWhip = sOuts > 0 ? (((sStats.h || 0) + (sStats.bb || 0)) / (sOuts / 3.0)).toFixed(2) : '-.--';

        seasonStatsHTML = `
          <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:6px; background:rgba(0,0,0,0.4); border:1px solid rgba(56,189,248,0.2); border-radius:6px; padding:8px; text-align:center;">
            <div><div style="font-size:10px; font-weight:bold; color:#38bdf8;">${sStats.w || 0}-${sStats.l || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">W-L</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#10b981;">${sEra}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">ERA</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#fb923c;">${sStats.so || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">K</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#38bdf8;">${sStats.sv || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">SV</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#facc15;">${sWhip}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">WHIP</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#fff;">${sIp}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">IP</div></div>
          </div>
        `;

        const cOuts = cStats.outs || 0;
        const cIp = `${Math.floor(cOuts / 3)}.${cOuts % 3}`;
        const cEra = cOuts > 0 ? ((cStats.er * 9.0) / (cOuts / 3.0)).toFixed(2) : '-.--';
        const cWhip = cOuts > 0 ? (((cStats.h || 0) + (cStats.bb || 0)) / (cOuts / 3.0)).toFixed(2) : '-.--';

        careerStatsHTML = `
          <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:6px; background:rgba(0,0,0,0.4); border:1px solid rgba(0,255,102,0.2); border-radius:6px; padding:8px; text-align:center;">
            <div><div style="font-size:10px; font-weight:bold; color:#38bdf8;">${cStats.w || 0}-${cStats.l || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">W-L</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#10b981;">${cEra}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">ERA</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#fb923c;">${cStats.so || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">K</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#38bdf8;">${cStats.sv || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">SV</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#facc15;">${cWhip}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">WHIP</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#fff;">${cIp}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">IP</div></div>
          </div>
        `;
      } else {
        const sAb = sStats.ab || 0;
        const sH = sStats.h || 0;
        const sAvg = sAb > 0 ? (sH / sAb).toFixed(3).replace(/^0/, '') : '.---';
        const sOps = sAb > 0 ? (((sH + (sStats.bb || 0)) / (sAb + (sStats.bb || 0))) + (sH / sAb)).toFixed(3) : '.---';

        seasonStatsHTML = `
          <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:6px; background:rgba(0,0,0,0.4); border:1px solid rgba(56,189,248,0.2); border-radius:6px; padding:8px; text-align:center;">
            <div><div style="font-size:10px; font-weight:bold; color:#34d399;">${sAvg}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">AVG</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#f87171;">${sStats.hr || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">HR</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#fbbf24;">${sStats.rbi || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">RBI</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#38bdf8;">${sH}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">H</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#fff;">${sStats.r || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">R</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#facc15;">${sOps}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">OPS</div></div>
          </div>
        `;

        const cAb = cStats.ab || 0;
        const cH = cStats.h || 0;
        const cAvg = cAb > 0 ? (cH / cAb).toFixed(3).replace(/^0/, '') : '.---';
        const cOps = cAb > 0 ? (((cH + (cStats.bb || 0)) / (cAb + (cStats.bb || 0))) + (cH / cAb)).toFixed(3) : '.---';

        careerStatsHTML = `
          <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:6px; background:rgba(0,0,0,0.4); border:1px solid rgba(0,255,102,0.2); border-radius:6px; padding:8px; text-align:center;">
            <div><div style="font-size:10px; font-weight:bold; color:#34d399;">${cAvg}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">AVG</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#f87171;">${cStats.hr || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">HR</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#fbbf24;">${cStats.rbi || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">RBI</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#38bdf8;">${cH}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">H</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#fff;">${cStats.r || 0}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">R</div></div>
            <div><div style="font-size:10px; font-weight:bold; color:#facc15;">${cOps}</div><div style="font-size:6.5px; color:#9ca3af; margin-top:2px;">OPS</div></div>
          </div>
        `;
      }

      const existing = document.getElementById('dynasty-player-modal-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'dynasty-player-modal-overlay';
      overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(4px);';

      const isUserTeam = S.roster && (
        Object.values(S.roster.lineup || {}).some(p => p && cardKey(p) === key) ||
        (S.roster.bench || []).some(p => p && cardKey(p) === key) ||
        (S.roster.sp || []).some(p => p && cardKey(p) === key) ||
        (S.roster.rp || []).some(p => p && cardKey(p) === key)
      );

      const alreadyAttempted = Boolean(S.resignAttempts && S.resignAttempts[key] && S.resignAttempts[key].year === S.seasonYear);

      const resignButtonHTML = isUserTeam ? `
        <div style="margin-top:14px; width:100%; text-align:center;">
          <button id="btn-dynasty-modal-resign" class="btn" style="width:100%; padding:11px 16px; font-family:'Press Start 2P',monospace; font-size:8.5px; background:${alreadyAttempted ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#ffd700,#f59e0b)'}; color:${alreadyAttempted ? '#94a3b8' : '#000'}; border:${alreadyAttempted ? '1px solid rgba(255,255,255,0.15)' : 'none'}; border-radius:6px; cursor:${alreadyAttempted ? 'not-allowed' : 'pointer'}; box-shadow:${alreadyAttempted ? 'none' : '0 0 15px rgba(255,215,0,0.35)'};" ${alreadyAttempted ? 'disabled' : ''}>
            ${alreadyAttempted ? _t('dynasty.btn_already_negotiated', 'YA NEGOCIADO ESTE AÑO') : _t('dynasty.btn_resign_player', '✍️ OFRECER RENOVACIÓN')}
          </button>
        </div>
      ` : '';

      const cardFlipHTML = renderDexCardFlipHTML(player, contract, 1, 1, `
        <div style="width:100%; text-align:left; margin-top:14px;">
          <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#38bdf8; margin-bottom:6px;">
            ${_t('dynasty.season_stats_header', 'TEMPORADA ACTUAL (AÑO {{year}})', { year: S.seasonYear })}
          </div>
          ${seasonStatsHTML}

          <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#00ff66; margin:10px 0 6px 0;">
            ${_t('dynasty.career_dynasty_stats_header', 'TOTAL ACUMULADO DINASTÍA')}
          </div>
          ${careerStatsHTML}

          ${resignButtonHTML}
        </div>
      `);

      overlay.innerHTML = `
        <div style="max-width:460px; width:100%; position:relative;">
          <button id="btn-dynasty-close-player-modal" style="position:absolute; top:-12px; right:-8px; z-index:100001; background:#ef4444; border:2px solid #fff; border-radius:50%; color:#fff; width:28px; height:28px; font-weight:bold; font-size:14px; cursor:pointer; line-height:1; box-shadow:0 0 10px rgba(0,0,0,0.8);">✕</button>
          ${cardFlipHTML}
        </div>
      `;

      document.body.appendChild(overlay);

      const closeModal = () => overlay.remove();
      const closeBtn = overlay.querySelector('#btn-dynasty-close-player-modal');
      if (closeBtn) closeBtn.onclick = closeModal;
      overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

      const flipInner = overlay.querySelector('#dynasty-flip-inner');
      const flipContainer = overlay.querySelector('#dynasty-flip-container');
      const btnFlip = overlay.querySelector('#btn-dynasty-flip-card');
      const doFlip = (e) => {
        if (e) e.stopPropagation();
        if (flipInner) {
          flipInner.classList.toggle('flipped');
          if (window.BaseballDex && typeof window.BaseballDex.playCardFlipSound === 'function') {
            window.BaseballDex.playCardFlipSound();
          }
        }
      };
      if (btnFlip) btnFlip.onclick = doFlip;
      if (flipContainer) flipContainer.onclick = doFlip;

      const btnResign = overlay.querySelector('#btn-dynasty-modal-resign');
      if (btnResign && !btnResign.disabled) {
        btnResign.onclick = (e) => {
          e.stopPropagation();
          closeModal();
          this.showResignModal(player, (accepted) => {
            if (this.renderRosterOverview && document.getElementById('dynasty-lineup-container')) {
              this.renderRosterOverview();
            } else if (this.renderSeasonHub) {
              this.renderSeasonHub();
            }
          });
        };
      }
    },

    // ── Modal de Roster Completo de 25 de un Rival ───────────────────────────
    showRivalRosterModal(teamMeta, tObj) {
      if (!teamMeta || !tObj) return;

      const existing = document.getElementById('dynasty-rival-modal-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'dynasty-rival-modal-overlay';
      overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(4px);';

      const renderRivalRow = (p, roleOrPos) => {
        if (!p) return `<div style="padding:3px; color:#64748b; font-size:8.5px;">-</div>`;
        const cK = cardKey(p);
        const ovrCol = p.ovr >= 90 ? '#ffd700' : (p.ovr >= 80 ? '#38bdf8' : '#10b981');
        return `
          <div class="dynasty-rival-player-row" data-key="${cK}" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:4px 6px; margin-bottom:3px; font-size:8px; cursor:pointer; transition:all 0.15s ease;">
            <div style="display:flex; align-items:center; gap:5px;">
              <span style="font-family:'Press Start 2P',monospace; font-size:6.5px; color:#9ca3af; width:22px;">${roleOrPos}</span>
              <span style="font-weight:bold; color:#fff;">${cleanName(p)}</span>
              <span style="font-size:7.5px; color:#94a3b8;">(${p.year || ''})</span>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
              <span style="font-size:7.5px; color:#38bdf8;">${getCardPositionText(p)}</span>
              <span style="font-family:'Press Start 2P',monospace; font-size:7px; color:${ovrCol};">${Math.round(p.ovr || 75)} OVR</span>
            </div>
          </div>
        `;
      };

      const lineupHTML = (tObj.lineup || []).map((p, idx) => renderRivalRow(p, `${idx + 1}.`)).join('');
      const benchHTML = (tObj.bench || []).map((p, idx) => renderRivalRow(p, `BN${idx + 1}`)).join('');
      const spHTML = (tObj.sp || []).map((p, idx) => renderRivalRow(p, `SP${idx + 1}`)).join('');
      const rpHTML = (tObj.rp || []).map((p, idx) => renderRivalRow(p, idx === tObj.rp.length - 1 ? 'CP' : `RP${idx + 1}`)).join('');

      overlay.innerHTML = `
        <div style="background:#0a0f1a; border:2px solid ${teamMeta.color || '#ffd700'}; border-radius:10px; max-width:820px; width:100%; max-height:90vh; overflow-y:auto; padding:18px; position:relative; box-shadow:0 0 30px rgba(0,0,0,0.9);">
          <button id="btn-dynasty-close-rival-modal" style="position:absolute; top:12px; right:12px; background:none; border:none; color:#9ca3af; font-size:20px; cursor:pointer; line-height:1;">✕</button>
          
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
            <span style="font-size:26px;">${teamMeta.icon}</span>
            <div>
              <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:#fff;">
                ${_t('dynasty.rival_roster_modal_title', 'ROSTER OFICIAL DE 25: {{team}}', { team: teamMeta.name.toUpperCase() })}
              </div>
              <div style="font-size:9px; color:#ffd700; margin-top:3px; font-family:'Press Start 2P',monospace;">
                ${teamMeta.league} ${teamMeta.div} • 25 Jugadores Activos
              </div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
            <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,215,0,0.2); border-radius:6px; padding:8px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#ffd700; margin-bottom:6px;">
                ${_t('dynasty.lineup_forming', '⚡ LINEUP (9 TITULARES)')}
              </div>
              ${lineupHTML}
            </div>

            <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(56,189,248,0.2); border-radius:6px; padding:8px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#38bdf8; margin-bottom:6px;">
                ${_t('dynasty.rotation_forming', '🧢 ROTACIÓN (5 SP)')}
              </div>
              ${spHTML}
              <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#38bdf8; margin:8px 0 6px 0;">
                ${_t('dynasty.bullpen_forming', '🔥 BULLPEN (7 RP)')}
              </div>
              ${rpHTML}
            </div>

            <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:8px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#a7f3d0; margin-bottom:6px;">
                ${_t('dynasty.bench_forming', '🛋️ BANCA (4 SUPLENTES)', { count: 4 })}
              </div>
              ${benchHTML}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const closeModal = () => overlay.remove();
      const closeBtn = overlay.querySelector('#btn-dynasty-close-rival-modal');
      if (closeBtn) closeBtn.onclick = closeModal;
      overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

      // Permitir inspeccionar la carta y estadísticas de cualquier jugador rival al hacer click
      const allRivalPlayers = [
        ...(tObj.lineup || []),
        ...(tObj.bench || []),
        ...(tObj.sp || []),
        ...(tObj.rp || [])
      ].filter(Boolean);

      overlay.querySelectorAll('.dynasty-rival-player-row').forEach(row => {
        row.onmouseenter = () => { row.style.background = 'rgba(56,189,248,0.15)'; row.style.borderColor = '#38bdf8'; };
        row.onmouseleave = () => { row.style.background = 'rgba(255,255,255,0.03)'; row.style.borderColor = 'rgba(255,255,255,0.06)'; };
        row.onclick = () => {
          const key = row.dataset.key;
          const found = allRivalPlayers.find(p => cardKey(p) === key);
          if (found) {
            this.showPlayerStatsModal(found);
          }
        };
      });
    },

    // ── Pestaña 4: Ver Rosters de los Demás 29 Equipos ────────────────────────
    renderRivalsTab() {
      const tabContent = document.getElementById('dynasty-tab-content');
      if (!tabContent || !this.state) return;

      const S = this.state;
      const rivals = MLB_TEAMS.filter(t => t.code !== S.team.code);
      const leagueRosters = S.leagueRosters || {};

      const rivalCardsHTML = rivals.map(r => {
        const teamObj = leagueRosters[r.code];
        const sp = (teamObj && teamObj.sp && teamObj.sp[0]) ? cleanName(teamObj.sp[0]) : 'Ace Starter';
        const bestBatter = (teamObj && teamObj.lineup && teamObj.lineup[0]) ? cleanName(teamObj.lineup[0]) : 'Slugger';
        return `
          <div class="dynasty-rival-card" data-code="${r.code}" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-left:3px solid ${r.color}; border-radius:6px; padding:8px; cursor:pointer;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:16px;">${r.icon}</span>
              <span style="font-family:'Press Start 2P',monospace; font-size:7px; color:#ffd700;">${r.league} ${r.div}</span>
            </div>
            <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#fff; margin:4px 0;">${r.name}</div>
            <div style="font-size:8px; color:#9ca3af;">Ace: <span style="color:#38bdf8;">${sp}</span></div>
            <div style="font-size:8px; color:#9ca3af;">Bate: <span style="color:#34d399;">${bestBatter}</span></div>
          </div>
        `;
      }).join('');

      tabContent.innerHTML = `
        <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(244,63,94,0.3); border-radius:10px; padding:12px;">
          <div style="font-family:'Press Start 2P',monospace; font-size:10px; color:#f43f5e; margin-bottom:10px;">
            ${_t('dynasty.other_teams_title', '🔍 ROSTERS DE LAS OTRAS 29 FRANQUICIAS DE LA LIGA')}
          </div>
          <div class="dynasty-rivals-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:8px; max-height:480px; overflow-y:auto; padding-right:4px;">
            ${rivalCardsHTML}
          </div>
        </div>
      `;

      tabContent.querySelectorAll('.dynasty-rival-card').forEach(card => {
        card.onclick = () => {
          const code = card.dataset.code;
          const tObj = leagueRosters[code];
          const teamMeta = MLB_TEAMS.find(t => t.code === code);
          if (tObj && teamMeta) {
            this.showRivalRosterModal(teamMeta, tObj);
          }
        };
      });
    },

    // ── 3. Motor de Simulación Día a Día (Sabermetría Honesta de Challenge 162) ─

    // ── Simulación por Segmentos (8 Partidos) con Resumen y Evento de Manager ──
    simulateSegment(gameCount = 8) {
      if (!this.state || this.state.currentDay >= 162) return;

      const startDay = this.state.currentDay;
      const startW = this.state.standings[this.state.team.code].w;
      const startL = this.state.standings[this.state.team.code].l;
      const startRS = this.state.standings[this.state.team.code].rs;
      const startRA = this.state.standings[this.state.team.code].ra;

      let eventTriggered = null;

      for (let i = 0; i < gameCount; i++) {
        if (this.state.currentDay >= 162) break;
        this.simulateOneDay();

        if (this.state.currentDay >= 40 && !this.state.eventsSeen.day40) {
          this.state.eventsSeen.day40 = true;
          eventTriggered = 'day40';
          break;
        }
        if (this.state.currentDay >= 81 && !this.state.eventsSeen.day81) {
          this.state.eventsSeen.day81 = true;
          eventTriggered = 'day81';
          break;
        }
        if (this.state.currentDay >= 110 && !this.state.eventsSeen.day110) {
          this.state.eventsSeen.day110 = true;
          eventTriggered = 'day110';
          break;
        }
      }

      this.save();

      const segW = this.state.standings[this.state.team.code].w - startW;
      const segL = this.state.standings[this.state.team.code].l - startL;
      const segRS = this.state.standings[this.state.team.code].rs - startRS;
      const segRA = this.state.standings[this.state.team.code].ra - startRA;
      const endDay = this.state.currentDay;

      this.showSegmentSummaryModal({
        startDay: startDay + 1,
        endDay,
        w: segW,
        l: segL,
        rs: segRS,
        ra: segRA,
        eventTriggered
      });
    },

    showSegmentSummaryModal(seg) {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.background = 'rgba(0,0,0,0.85)';
      overlay.style.backdropFilter = 'blur(6px)';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.padding = '14px';

      const winPct = (seg.w + seg.l) > 0 ? (seg.w / (seg.w + seg.l)) : 0;
      const isPositive = seg.w >= seg.l;

      // Pick a random player from user lineup or pitching for dilemma
      const lineupArray = Object.values(this.state.roster.lineup || {}).filter(Boolean);
      const spArray = (this.state.roster.sp || []).filter(Boolean);
      const featuredPlayer = Math.random() < 0.6 
        ? lineupArray[Math.floor(Math.random() * lineupArray.length)]
        : (spArray[Math.floor(Math.random() * spArray.length)] || lineupArray[0]);

      const playerName = featuredPlayer ? cleanName(featuredPlayer) : 'Tu Jugador Clave';
      const isPitcher = featuredPlayer && featuredPlayer.role;

      const dilemmas = [
        {
          title: 'Sesión Extra de Entrenamiento Especial',
          desc: `${playerName} te pide permiso para realizar una sesión intensiva de videos y mecánica avanzada tras la serie.`,
          opt1: { text: 'Aprobar entrenamiento intensivo (+5 Boost Global)', boost: 5, risk: 0.15 },
          opt2: { text: 'Darle descanso físico y recuperación táctica (+3 Boost Seguro)', boost: 3, risk: 0.0 }
        },
        {
          title: 'Ajuste de Estrategia del Coach de Bateo/Pitcheo',
          desc: `El cuerpo técnico ha identificado debilidades en el timing del rival y propone un nuevo enfoque táctico para ${playerName}.`,
          opt1: { text: 'Implementar cambio radical (+6 Boost Global)', boost: 6, risk: 0.20 },
          opt2: { text: 'Ajuste moderado y mantener consistencia (+3 Boost Global)', boost: 3, risk: 0.0 }
        },
        {
          title: 'Discurso Motivacional en el Club House',
          desc: `El vestuario necesita un empujón de liderazgo para la próxima serie. ${playerName} toma la palabra ante el grupo.`,
          opt1: { text: 'Animar al equipo a jugar agresivo (+5 Boost Global)', boost: 5, risk: 0.10 },
          opt2: { text: 'Enfoque en fundamentos y paciencia (+4 Boost Global)', boost: 4, risk: 0.0 }
        }
      ];

      const dilemma = dilemmas[Math.floor(Math.random() * dilemmas.length)];

      overlay.innerHTML = `
        <div style="max-width:560px; width:100%; background:#0a0f1a; border:2px solid ${isPositive ? '#ffd700' : '#38bdf8'}; border-radius:14px; padding:22px; position:relative; box-shadow:0 0 35px rgba(0,0,0,0.8); text-align:center;">
          <div style="font-size:32px; margin-bottom:4px;">${isPositive ? '🔥' : '⚾'}</div>
          <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:#ffd700; margin-bottom:6px;">
            ${_t('dynasty.segment_recap_title', 'RESUMEN DE LA SERIE (JUEGOS {{start}} - {{end}})', { start: seg.startDay, end: seg.endDay })}
          </div>

          <div style="display:flex; justify-content:center; gap:16px; margin:14px 0;">
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px 18px;">
              <div style="font-size:9px; color:#9ca3af; margin-bottom:2px;">RÉCORD SERIE</div>
              <div style="font-family:'Press Start 2P',monospace; font-size:14px; color:${seg.w >= seg.l ? '#34d399' : '#f87171'};">
                ${seg.w}W - ${seg.l}L
              </div>
            </div>
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px 18px;">
              <div style="font-size:9px; color:#9ca3af; margin-bottom:2px;">CARRERAS</div>
              <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:#38bdf8;">
                ${seg.rs} <span style="font-size:9px; color:#9ca3af;">AF</span> / ${seg.ra} <span style="font-size:9px; color:#9ca3af;">EC</span>
              </div>
            </div>
          </div>

          <!-- Evento Interactivo de Decisión del Manager -->
          <div style="background:rgba(56,189,248,0.08); border:1.5px dashed #38bdf8; border-radius:10px; padding:14px; margin-bottom:16px; text-align:left;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span style="font-size:16px;">🧠</span>
              <span style="font-family:'Press Start 2P',monospace; font-size:9px; color:#38bdf8;">
                DECISIÓN DEL MANAGER: ${dilemma.title}
              </span>
            </div>
            <p style="font-size:10px; color:#e2e8f0; line-height:1.45; margin-bottom:12px;">
              ${dilemma.desc}
            </p>
            <div style="display:flex; flex-direction:column; gap:8px;" id="dynasty-dilemma-buttons">
              <button class="btn btn-dilemma-choice" data-choice="1" style="padding:9px 12px; font-size:9.5px; text-align:left; background:rgba(255,255,255,0.06); border:1px solid #38bdf8; border-radius:6px; color:#fff; cursor:pointer;">
                🟢 ${dilemma.opt1.text}
              </button>
              <button class="btn btn-dilemma-choice" data-choice="2" style="padding:9px 12px; font-size:9.5px; text-align:left; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.2); border-radius:6px; color:#fff; cursor:pointer;">
                🔵 ${dilemma.opt2.text}
              </button>
            </div>
            <div id="dynasty-dilemma-outcome" style="display:none; margin-top:10px; padding:8px; border-radius:6px; font-size:9.5px;"></div>
          </div>

          <button id="btn-dynasty-close-segment" class="btn" style="padding:12px 24px; font-family:'Press Start 2P',monospace; font-size:10px; background:linear-gradient(135deg,#00ff66,#059669); color:#000; border:none; border-radius:6px; cursor:pointer; width:100%; box-shadow:0 0 15px rgba(0,255,102,0.35);">
            ${_t('dynasty.continue_next_series', 'CONTINUAR SIGUIENTE SERIE ➔')}
          </button>
        </div>
      `;

      document.body.appendChild(overlay);

      const closeSummary = () => {
        overlay.remove();
        if (seg.eventTriggered) {
          this.showMidSeasonEvent(seg.eventTriggered);
        } else {
          this.renderSeasonHub();
        }
      };

      const btnClose = overlay.querySelector('#btn-dynasty-close-segment');
      if (btnClose) btnClose.onclick = closeSummary;

      overlay.querySelectorAll('.btn-dilemma-choice').forEach(btn => {
        btn.onclick = () => {
          overlay.querySelectorAll('.btn-dilemma-choice').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
          const choiceNum = btn.dataset.choice;
          const choiceObj = choiceNum === '1' ? dilemma.opt1 : dilemma.opt2;

          let appliedBoost = choiceObj.boost;
          let outcomeSuccess = true;
          if (choiceObj.risk && Math.random() < choiceObj.risk) {
            appliedBoost = 1;
            outcomeSuccess = false;
          }

          if (featuredPlayer) {
            featuredPlayer._boost = (featuredPlayer._boost || 0) + appliedBoost;
          }

          const outcomeDiv = overlay.querySelector('#dynasty-dilemma-outcome');
          if (outcomeDiv) {
            outcomeDiv.style.display = 'block';
            if (outcomeSuccess) {
              outcomeDiv.style.background = 'rgba(0,255,102,0.15)';
              outcomeDiv.style.border = '1px solid #00ff66';
              outcomeDiv.style.color = '#00ff66';
              outcomeDiv.innerHTML = `<strong>¡Excelente decisión!</strong> ${playerName} recibe <strong>+${appliedBoost} Boost Global</strong> en todos sus ratings para los próximos partidos.`;
              if (typeof window.playSound === 'function') window.playSound('level_up');
            } else {
              outcomeDiv.style.background = 'rgba(239,68,68,0.15)';
              outcomeDiv.style.border = '1px solid #ef4444';
              outcomeDiv.style.color = '#f87171';
              outcomeDiv.innerHTML = `<strong>El esfuerzo fue exigente:</strong> Solo se obtuvo un leve ajuste táctico (+1 rating).`;
            }
          }
          this.save();
        };
      });
    },

    simulateDays(count) {
      if (!this.state || this.state.currentDay >= 162) return;

      for (let i = 0; i < count; i++) {
        if (this.state.currentDay >= 162) break;
        this.simulateOneDay();

        if (this.state.currentDay >= 40 && !this.state.eventsSeen.day40) {
          this.state.eventsSeen.day40 = true;
          this.save();
          this.showMidSeasonEvent('day40');
          return;
        }
        if (this.state.currentDay >= 81 && !this.state.eventsSeen.day81) {
          this.state.eventsSeen.day81 = true;
          this.save();
          this.showMidSeasonEvent('day81');
          return;
        }
        if (this.state.currentDay >= 110 && !this.state.eventsSeen.day110) {
          this.state.eventsSeen.day110 = true;
          this.save();
          this.showMidSeasonEvent('day110');
          return;
        }
      }

      this.save();
      this.renderSeasonHub();
    },

    simulateToNextEvent() {
      const cur = this.state.currentDay;
      let target = 162;
      if (cur < 40) target = 40;
      else if (cur < 81) target = 81;
      else if (cur < 110) target = 110;

      const diff = target - cur;
      if (diff > 0) {
        this.simulateDays(diff);
      }
    },

    simulateOneDay() {
      const S = this.state;
      S.currentDay++;
      const gameIdx = S.currentDay;

      const otherTeams = MLB_TEAMS.filter(t => t.code !== S.team.code);
      const oppTeamMeta = otherTeams[Math.floor(Math.random() * otherTeams.length)];
      const oppRoster = (S.leagueRosters && S.leagueRosters[oppTeamMeta.code]) || { lineup: [], sp: [], rp: [] };

      const spList = S.roster.sp.filter(Boolean);
      const userSP = spList[(gameIdx - 1) % spList.length] || { ovr: 75, sta: 65 };
      const oppSP = (oppRoster.sp && oppRoster.sp.length > 0) ? oppRoster.sp[(gameIdx - 1) % oppRoster.sp.length] : { ovr: 75, sta: 65 };

      const userRelievers = S.roster.rp.filter(Boolean);
      const userMaxInnings = getStarterMaxInnings(userSP);
      const oppMaxInnings = getStarterMaxInnings(oppSP);

      let streakBonus = 0;
      if (S.streak >= 3) streakBonus = Math.min(8, Math.floor(S.streak / 2) + 2);
      else if (S.streak <= -3) streakBonus = Math.max(-6, -Math.floor(Math.abs(S.streak) / 2));

      let userRuns = 0, oppRuns = 0;
      let userBatIdx = 0, oppBatIdx = 0;
      let inning = 1;
      const inningLimit = 15;

      // Usar el orden de bateo personalizado o configurado por el usuario
      let userLineup = [];
      if (S.roster.lineupOrder && S.roster.lineupOrder.length >= 9) {
        userLineup = S.roster.lineupOrder.map(k => {
          return Object.values(S.roster.lineup).find(p => p && cardKey(p) === k)
            || S.roster.bench.find(p => p && cardKey(p) === k);
        }).filter(Boolean);
      }
      if (!userLineup || userLineup.length < 9) {
        userLineup = LINEUP_SLOTS.map(slot => S.roster.lineup[slot]).filter(Boolean);
      }

      // ── Sistema Realista de Descanso de Titulares y Rotación de Banca ───────
      // En MLB los titulares descansan cada 5-8 días. La banca inicia ~25-45 juegos por año.
      const userBench = (S.roster.bench || []).filter(Boolean);
      const usedBenchKeys = new Set();
      if (userBench.length > 0 && (gameIdx % 4 !== 0)) {
        // Rotar un titular para darle día libre y poner a un suplente de la banca en su lugar
        const benchPlayerToStart = userBench[(gameIdx) % userBench.length];
        const restIndex = (Math.floor(gameIdx / 4)) % Math.min(9, userLineup.length);
        if (benchPlayerToStart && userLineup[restIndex]) {
          userLineup = [...userLineup];
          userLineup[restIndex] = benchPlayerToStart;
          usedBenchKeys.add(cardKey(benchPlayerToStart));
        }
      }

      // Preparar rotación de banca para el equipo rival también
      let oppLineup = (oppRoster.lineup && oppRoster.lineup.length >= 9) ? [...oppRoster.lineup] : userLineup;
      if (oppRoster.bench && oppRoster.bench.length > 0 && (gameIdx % 4 !== 0)) {
        const oppBenchSub = oppRoster.bench[gameIdx % oppRoster.bench.length];
        const oppRestIdx = (Math.floor(gameIdx / 3)) % Math.min(9, oppLineup.length);
        if (oppBenchSub && oppLineup[oppRestIdx]) {
          oppLineup[oppRestIdx] = oppBenchSub;
        }
      }

      const gameBatterDeltas = {};
      const gamePitcherDeltas = {};

      const emptyBDelta = () => ({ ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 });
      const emptyPDelta = () => ({ outs: 0, h: 0, er: 0, bb: 0, so: 0 });

      while (inning <= 9 || (userRuns === oppRuns && inning <= inningLimit)) {
        const oppPitcherToday = inning <= oppMaxInnings ? oppSP : (oppRoster.rp[0] || oppSP);
        let outs = 0;
        const bases = [null, null, null];

        while (outs < 3) {
          let batter = userLineup[userBatIdx++ % userLineup.length];

          // Rotación y sustitución de banca (Pinch Hitter en entradas finales 7+ o juego de descanso)
          if (inning >= 7 && userBench.length > 0 && Math.random() < 0.28) {
            const ph = userBench.find(b => !usedBenchKeys.has(cardKey(b)));
            if (ph) {
              batter = ph;
              usedBenchKeys.add(cardKey(ph));
            }
          }

          const outcome = simPaOutcome(batter, oppPitcherToday, true, streakBonus);
          const bKey = cardKey(batter);
          if (!gameBatterDeltas[bKey]) gameBatterDeltas[bKey] = emptyBDelta();
          const bStat = gameBatterDeltas[bKey];

          if (outcome === 'OUT') {
            outs++;
            bStat.ab++;
          } else if (outcome === 'SO') {
            outs++;
            bStat.ab++;
            bStat.so++;
          } else if (outcome === 'BB') {
            bStat.bb++;
            const scorer = forceWalk(bases, batter);
            if (scorer) {
              userRuns++;
              bStat.rbi++;
              const sKey = cardKey(scorer);
              if (!gameBatterDeltas[sKey]) gameBatterDeltas[sKey] = emptyBDelta();
              gameBatterDeltas[sKey].r++;
            }
          } else if (outcome === 'HR') {
            bStat.ab++; bStat.h++; bStat.hr++; bStat.r++;
            const runnersOn = bases.filter(Boolean);
            const rbiCount = 1 + runnersOn.length;
            userRuns += rbiCount;
            bStat.rbi += rbiCount;
            runnersOn.forEach(r => {
              const rKey = cardKey(r);
              if (!gameBatterDeltas[rKey]) gameBatterDeltas[rKey] = emptyBDelta();
              gameBatterDeltas[rKey].r++;
            });
            bases[0] = null; bases[1] = null; bases[2] = null;
          } else {
            const adv = outcome === '1B' ? 1 : (outcome === '2B' ? 2 : 3);
            bStat.ab++; bStat.h++;
            if (outcome === '2B') bStat.doubles++;
            if (outcome === '3B') bStat.triples++;
            const scorers = advanceOnHit(bases, batter, adv, outs);
            userRuns += scorers.length;
            bStat.rbi += scorers.length;
            scorers.forEach(r => {
              const rKey = cardKey(r);
              if (!gameBatterDeltas[rKey]) gameBatterDeltas[rKey] = emptyBDelta();
              gameBatterDeltas[rKey].r++;
            });
          }
        }

        const userPitcherToday = pitcherForInning(inning, userSP, userRelievers, userMaxInnings, gameIdx, userRuns, oppRuns) || userSP;
        const pKey = cardKey(userPitcherToday);
        if (!gamePitcherDeltas[pKey]) gamePitcherDeltas[pKey] = emptyPDelta();
        const pStat = gamePitcherDeltas[pKey];

        outs = 0;
        bases[0] = null; bases[1] = null; bases[2] = null;
        while (outs < 3) {
          const oppBatter = oppLineup[oppBatIdx++ % oppLineup.length];
          const outcome = simPaOutcome(oppBatter, userPitcherToday, false, 0);

          if (outcome === 'OUT') {
            outs++;
            pStat.outs++;
          } else if (outcome === 'SO') {
            outs++;
            pStat.outs++;
            pStat.so++;
          } else if (outcome === 'BB') {
            pStat.bb++;
            const scorer = forceWalk(bases, oppBatter);
            if (scorer) {
              oppRuns++;
              pStat.er++;
            }
          } else if (outcome === 'HR') {
            pStat.h++;
            const runnersOn = bases.filter(Boolean);
            const rbiCount = 1 + runnersOn.length;
            oppRuns += rbiCount;
            pStat.er += rbiCount;
            bases[0] = null; bases[1] = null; bases[2] = null;
          } else {
            const adv = outcome === '1B' ? 1 : (outcome === '2B' ? 2 : 3);
            pStat.h++;
            const scorers = advanceOnHit(bases, oppBatter, adv, outs);
            oppRuns += scorers.length;
            pStat.er += scorers.length;
          }
        }

        inning++;
      }

      const won = userRuns > oppRuns;

      Object.entries(gameBatterDeltas).forEach(([key, d]) => {
        if (!S.stats.batters[key]) {
          const pObj = userLineup.find(p => cardKey(p) === key) || {};
          S.stats.batters[key] = { name: cleanName(pObj), pos: pObj.pos || 'DH', teamCode: S.team.code, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
        }
        if (!S.stats.batters[key].teamCode) S.stats.batters[key].teamCode = S.team.code;
        const s = S.stats.batters[key];
        s.ab += d.ab; s.h += d.h; s.doubles += d.doubles; s.triples += d.triples;
        s.hr += d.hr; s.rbi += d.rbi; s.bb += d.bb; s.so += d.so; s.r += d.r; s.sb += d.sb;

        if (!S.careerStats.batters[key]) S.careerStats.batters[key] = { name: s.name, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
        const cs = S.careerStats.batters[key];
        cs.ab += d.ab; cs.h += d.h; cs.doubles += d.doubles; cs.triples += d.triples;
        cs.hr += d.hr; cs.rbi += d.rbi; cs.bb += d.bb; cs.so += d.so; cs.r += d.r; cs.sb += d.sb;
      });

      Object.entries(gamePitcherDeltas).forEach(([key, d]) => {
        if (!S.stats.pitchers[key]) {
          const pObj = [...spList, ...userRelievers].find(p => cardKey(p) === key) || {};
          S.stats.pitchers[key] = { name: cleanName(pObj), role: pObj.role || 'P', teamCode: S.team.code, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
        }
        if (!S.stats.pitchers[key].teamCode) S.stats.pitchers[key].teamCode = S.team.code;
        const s = S.stats.pitchers[key];
        s.outs += d.outs; s.h += d.h; s.er += d.er; s.bb += d.bb; s.so += d.so;

        if (!S.careerStats.pitchers[key]) S.careerStats.pitchers[key] = { name: s.name, role: s.role, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
        const cs = S.careerStats.pitchers[key];
        cs.outs += d.outs; cs.h += d.h; cs.er += d.er; cs.bb += d.bb; cs.so += d.so;
      });

      const spKey = cardKey(userSP);
      const spOuts = gamePitcherDeltas[spKey] ? gamePitcherDeltas[spKey].outs : 0;
      const lastPitcher = pitcherForInning(inning - 1, userSP, userRelievers, userMaxInnings, gameIdx, userRuns, oppRuns) || userSP;
      const lastKey = cardKey(lastPitcher);
      const decisionKey = (spOuts >= 15 || (inning - 1) <= 9) ? spKey : (lastKey || spKey);

      if (S.stats.pitchers[decisionKey]) {
        if (won) { S.stats.pitchers[decisionKey].w++; if (S.careerStats.pitchers[decisionKey]) S.careerStats.pitchers[decisionKey].w++; }
        else { S.stats.pitchers[decisionKey].l++; if (S.careerStats.pitchers[decisionKey]) S.careerStats.pitchers[decisionKey].l++; }
      }
      if (won && (userRuns - oppRuns) <= 3 && lastKey !== spKey && S.stats.pitchers[lastKey]) {
        S.stats.pitchers[lastKey].sv++;
        if (S.careerStats.pitchers[lastKey]) S.careerStats.pitchers[lastKey].sv++;
      }

      if (won) {
        S.streak = (S.streak >= 0) ? (S.streak + 1) : 1;
      } else {
        S.streak = (S.streak <= 0) ? (S.streak - 1) : -1;
      }

      S.standings[S.team.code].w += (won ? 1 : 0);
      S.standings[S.team.code].l += (won ? 0 : 1);
      S.standings[S.team.code].rs += userRuns;
      S.standings[S.team.code].ra += oppRuns;

      S.standings[oppTeamMeta.code].w += (won ? 0 : 1);
      S.standings[oppTeamMeta.code].l += (won ? 1 : 0);
      S.standings[oppTeamMeta.code].rs += oppRuns;
      S.standings[oppTeamMeta.code].ra += userRuns;

      S.gameLog.push({
        day: S.currentDay,
        won,
        oppCode: oppTeamMeta.code,
        oppName: oppTeamMeta.name,
        oppIcon: oppTeamMeta.icon,
        score: `${userRuns} - ${oppRuns}`
      });

      // ── Acumulación de estadísticas de bateo y pitcheo del rival directo ──
      if (oppRoster && oppRoster.sp && oppRoster.sp.length > 0) {
        const oSP = oppSP;
        const oSPKey = cardKey(oSP);
        if (!S.stats.pitchers[oSPKey]) {
          S.stats.pitchers[oSPKey] = { name: cleanName(oSP), role: 'SP', teamCode: oppTeamMeta.code, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
        }
        const oSpStat = S.stats.pitchers[oSPKey];
        const oOuts = Math.min(27, (userBatIdx || 27) - userRuns);
        oSpStat.outs += Math.max(15, oOuts);
        oSpStat.h += Math.floor(userRuns * 1.3) + 3;
        oSpStat.er += userRuns;
        oSpStat.bb += Math.floor(Math.random() * 3) + 1;
        oSpStat.so += Math.floor(Math.random() * 6) + 3;
        if (won) oSpStat.l++; else oSpStat.w++;
      }
      (oppLineup || []).forEach(oBatter => {
        if (!oBatter) return;
        const oKey = cardKey(oBatter);
        if (!S.stats.batters[oKey]) {
          S.stats.batters[oKey] = { name: cleanName(oBatter), pos: oBatter.pos || 'DH', teamCode: oppTeamMeta.code, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
        }
        const obs = S.stats.batters[oKey];
        const abCount = 4;
        obs.ab += abCount;
        const hitProb = 0.235 + ((oBatter.con || oBatter.ovr || 75) - 60) * 0.0025;
        let hitsToday = 0;
        for (let a = 0; a < abCount; a++) {
          if (Math.random() < Math.max(0.20, Math.min(0.36, hitProb))) {
            hitsToday++;
          }
        }
        obs.h += hitsToday;
        for (let h = 0; h < hitsToday; h++) {
          const pRoll = Math.random();
          if (pRoll < 0.16) { obs.hr++; obs.rbi += (Math.random() < 0.45 ? 2 : 1); obs.r++; }
          else if (pRoll < 0.38) { obs.doubles++; if (Math.random() < 0.35) obs.rbi++; }
          else if (pRoll < 0.42 && (oBatter.spd || 50) >= 65) { obs.triples++; if (Math.random() < 0.4) obs.rbi++; }
        }
        if (Math.random() < 0.35) obs.bb++;
        if (Math.random() < 0.60) obs.so += (Math.random() < 0.3 ? 2 : 1);
        if (hitsToday > 0 && (oBatter.spd || 50) >= 65 && Math.random() < 0.20) obs.sb++;
      });

      // ── Simulación y acumulación de estadísticas para los otros 14 partidos ─
      const otherMatches = MLB_TEAMS.filter(t => t.code !== S.team.code && t.code !== oppTeamMeta.code);
      for (let i = 0; i < otherMatches.length; i += 2) {
        const t1 = otherMatches[i];
        const t2 = otherMatches[i + 1];
        if (!t1 || !t2) break;

        const t1Roster = (S.leagueRosters && S.leagueRosters[t1.code]) || {};
        const t2Roster = (S.leagueRosters && S.leagueRosters[t2.code]) || {};

        const t1SP = (t1Roster.sp && t1Roster.sp.length > 0) ? t1Roster.sp[(gameIdx - 1) % t1Roster.sp.length] : null;
        const t2SP = (t2Roster.sp && t2Roster.sp.length > 0) ? t2Roster.sp[(gameIdx - 1) % t2Roster.sp.length] : null;

        const t1Rating = (t1SP ? (t1SP.ovr || 75) : 75);
        const t2Rating = (t2SP ? (t2SP.ovr || 75) : 75);

        const t1Prob = 0.50 + ((t1Rating - t2Rating) * 0.005);
        const t1Wins = Math.random() < Math.max(0.25, Math.min(0.75, t1Prob));
        const r1 = Math.floor(Math.random() * 6) + 2;
        const r2 = Math.max(0, r1 - Math.floor(Math.random() * 4) - 1);
        const t1Runs = t1Wins ? r1 : r2;
        const t2Runs = t1Wins ? r2 : r1;

        S.standings[t1.code].w += (t1Wins ? 1 : 0);
        S.standings[t1.code].l += (t1Wins ? 0 : 1);
        S.standings[t1.code].rs += t1Runs;
        S.standings[t1.code].ra += t2Runs;

        S.standings[t2.code].w += (t1Wins ? 0 : 1);
        S.standings[t2.code].l += (t1Wins ? 1 : 0);
        S.standings[t2.code].rs += t2Runs;
        S.standings[t2.code].ra += t1Runs;

        // Generar estadísticas diarias para el abridor y relevista cerrador de t1
        if (t1SP) {
          const k = cardKey(t1SP);
          if (!S.stats.pitchers[k]) {
            S.stats.pitchers[k] = { name: cleanName(t1SP), role: 'SP', teamCode: t1.code, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
          }
          const ps = S.stats.pitchers[k];
          const innPitched = Math.floor(Math.random() * 3) + 5; // 5-7 innings
          ps.outs += innPitched * 3;
          ps.er += Math.min(t2Runs, Math.floor(Math.random() * 4));
          ps.h += Math.floor(Math.random() * 4) + 4;
          ps.bb += Math.floor(Math.random() * 3);
          ps.so += Math.floor(Math.random() * 6) + 3;
          if (t1Wins) ps.w++; else ps.l++;
        }
        if (t1Wins && (t1Runs - t2Runs) <= 3 && t1Roster.rp && t1Roster.rp.length > 0) {
          const cp = t1Roster.rp[t1Roster.rp.length - 1];
          if (cp) {
            const k = cardKey(cp);
            if (!S.stats.pitchers[k]) {
              S.stats.pitchers[k] = { name: cleanName(cp), role: 'CP', teamCode: t1.code, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
            }
            S.stats.pitchers[k].outs += 3;
            S.stats.pitchers[k].so += (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0);
            S.stats.pitchers[k].sv++;
          }
        }

        // Generar estadísticas diarias para el abridor y relevista cerrador de t2
        if (t2SP) {
          const k = cardKey(t2SP);
          if (!S.stats.pitchers[k]) {
            S.stats.pitchers[k] = { name: cleanName(t2SP), role: 'SP', teamCode: t2.code, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
          }
          const ps = S.stats.pitchers[k];
          const innPitched = Math.floor(Math.random() * 3) + 5; // 5-7 innings
          ps.outs += innPitched * 3;
          ps.er += Math.min(t1Runs, Math.floor(Math.random() * 4));
          ps.h += Math.floor(Math.random() * 4) + 4;
          ps.bb += Math.floor(Math.random() * 3);
          ps.so += Math.floor(Math.random() * 6) + 3;
          if (!t1Wins) ps.w++; else ps.l++;
        }
        if (!t1Wins && (t2Runs - t1Runs) <= 3 && t2Roster.rp && t2Roster.rp.length > 0) {
          const cp = t2Roster.rp[t2Roster.rp.length - 1];
          if (cp) {
            const k = cardKey(cp);
            if (!S.stats.pitchers[k]) {
              S.stats.pitchers[k] = { name: cleanName(cp), role: 'CP', teamCode: t2.code, outs: 0, h: 0, er: 0, bb: 0, so: 0, w: 0, l: 0, sv: 0 };
            }
            S.stats.pitchers[k].outs += 3;
            S.stats.pitchers[k].so += (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0);
            S.stats.pitchers[k].sv++;
          }
        }

        // Simular estadísticas diarias para los 9 titulares de t1 y t2
        const simTeamBatters = (lineup, runs, teamMeta) => {
          if (!lineup) return;
          lineup.forEach(b => {
            if (!b) return;
            const k = cardKey(b);
            if (!S.stats.batters[k]) {
              S.stats.batters[k] = { name: cleanName(b), pos: b.pos || 'DH', teamCode: teamMeta.code, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0, r: 0, sb: 0 };
            }
            const bs = S.stats.batters[k];
            bs.ab += 4;
            const hitProb = 0.235 + ((b.con || b.ovr || 75) - 60) * 0.0025;
            let hits = 0;
            for (let a = 0; a < 4; a++) {
              if (Math.random() < Math.max(0.20, Math.min(0.36, hitProb))) {
                hits++;
              }
            }
            bs.h += hits;
            for (let h = 0; h < hits; h++) {
              const pwrRoll = Math.random();
              if (pwrRoll < 0.16) {
                bs.hr++;
                bs.rbi += (Math.random() < 0.45 ? 2 : 1);
                bs.r++;
              } else if (pwrRoll < 0.38) {
                bs.doubles++;
                if (Math.random() < 0.35) bs.rbi++;
              } else if (pwrRoll < 0.42 && (b.spd || 50) >= 65) {
                bs.triples++;
                if (Math.random() < 0.40) bs.rbi++;
              }
            }
            if (Math.random() < 0.35) bs.bb++;
            if (Math.random() < 0.60) bs.so += (Math.random() < 0.3 ? 2 : 1);
            if (hits > 0 && (b.spd || 50) >= 65 && Math.random() < 0.20) bs.sb++;
          });
        };
        simTeamBatters(t1Roster.lineup, t1Runs, t1);
        simTeamBatters(t2Roster.lineup, t2Runs, t2);
      }
    },

    // ── 4. Eventos de Temporada ───────────────────────────────────────────────
    showMidSeasonEvent(type) {
      const container = document.getElementById('dynasty-content-area');
      if (!container) return;

      if (type === 'day40') {
        container.innerHTML = `
          <div style="max-width: 800px; margin: 20px auto; text-align:center;">
            <div style="background:rgba(0,0,0,0.6); border:2px solid #38bdf8; border-radius:12px; padding:18px; margin-bottom:16px; box-shadow:0 0 25px rgba(56,189,248,0.25);">
              <div style="font-size:32px; margin-bottom:6px;">📦</div>
              <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:#38bdf8; margin-bottom:8px;">
                ${_t('dynasty.reinforcement_title', 'JUEGO 40: REFUERZO DE PRIMAVERA')}
              </div>
              <p style="font-size:10px; color:#e2e8f0; line-height:1.5; margin:0 0 14px 0;">
                ${_t('dynasty.reinforcement_desc', '¡Tu directiva te entrega 1 Sobre Especial de Refuerzo para apuntalar tu plantilla!')}
              </p>
            </div>

            <!-- Contenedor del Sobre Retro Foil -->
            <div id="dynasty-reinforce-pack-stage" style="background:rgba(0,0,0,0.5); border:1px solid rgba(56,189,248,0.3); border-radius:12px; padding:20px; min-height:480px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
              <div class="dex-foil-pack-wrapper" id="dynasty-reinforce-pack-target" style="cursor:pointer;">
                <div class="dex-foil-pack" id="dynasty-reinforce-foil-inner" style="background:linear-gradient(135deg, #0284c7, #0369a1, #0f172a); border-color:#38bdf8;">
                  <div class="dex-foil-crimp" id="dynasty-reinforce-crimp-top" style="background:repeating-linear-gradient(90deg, #38bdf8, #38bdf8 3px, #0284c7 3px, #0284c7 6px);"></div>

                  <div style="text-align:center; margin: 22px 0;">
                    <div style="font-size:34px; filter:drop-shadow(0 0 12px #38bdf8); margin-bottom:6px;">⭐</div>
                    <div style="font-family:'Press Start 2P',monospace; font-size:10.5px; color:#38bdf8; text-shadow:0 0 10px rgba(56,189,248,0.8); line-height:1.4;">
                      SPRING BOOSTER PACK
                    </div>
                    <div style="font-family:'Press Start 2P',monospace; font-size:7px; color:#ffd700; margin-top:8px; background:rgba(255,215,0,0.15); border:1px solid #ffd700; padding:3px 6px; border-radius:4px; display:inline-block;">
                      ${_t('dynasty.spring_booster_badge', 'REFUERZO DE FRANQUICIA (2 AÑOS)')}
                    </div>
                  </div>

                  <div style="text-align:center; margin-bottom:12px;">
                    <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#00ff66; animation:packGlowPulse 1.2s infinite ease-in-out;">
                      ✨ ${_t('dynasty.open_reinforcement_pack', 'TOCA PARA ABRIR REFUERZO')} ✨
                    </div>
                  </div>

                  <div class="dex-foil-crimp" style="background:repeating-linear-gradient(90deg, #38bdf8, #38bdf8 3px, #0284c7 3px, #0284c7 6px);"></div>
                </div>
              </div>

              <!-- Slot Revelado de Carta y Selector de Reemplazo -->
              <div id="dynasty-reinforce-reveal-slot" style="display:none; width:100%;"></div>
            </div>
          </div>
        `;

        const packTarget = document.getElementById('dynasty-reinforce-pack-target');
        if (packTarget) {
          packTarget.onclick = () => {
            if (window.BaseballDex && typeof window.BaseballDex.playPackSound === 'function') {
              window.BaseballDex.playPackSound('Epic');
            }

            const crimpTop = document.getElementById('dynasty-reinforce-crimp-top');
            const packInner = document.getElementById('dynasty-reinforce-foil-inner');
            if (crimpTop) crimpTop.style.animation = 'packFoilRipTop 0.35s forwards ease-out';
            if (packInner) packInner.style.animation = 'packFoilRipBody 0.4s 0.1s forwards ease-in';

            // Ponderar posición faltante o menor OVR
            const isPitcherPull = Math.random() < 0.4;
            const bPool = getBatterPool();
            const pPool = getPitcherPool();
            const pool = isPitcherPull ? pPool : bPool;

            const curRosterKeys = new Set();
            Object.values(this.state.roster.lineup).forEach(p => { if (p) curRosterKeys.add(cardKey(p)); });
            this.state.roster.bench.forEach(p => { if (p) curRosterKeys.add(cardKey(p)); });
            this.state.roster.sp.forEach(p => { if (p) curRosterKeys.add(cardKey(p)); });
            this.state.roster.rp.forEach(p => { if (p) curRosterKeys.add(cardKey(p)); });

            const missingPos = [];
            LINEUP_SLOTS.forEach(slot => {
              if (!this.state.roster.lineup[slot]) missingPos.push(slot);
            });
            if (this.state.roster.sp.length < 5) missingPos.push('SP');
            if (this.state.roster.rp.length < 7) missingPos.push('RP', 'CL', 'CP');

            const newCard = pickWeightedCard(pool, missingPos, curRosterKeys);
            const contractYears = 2; // Contrato garantizado de 2 temporadas

            setTimeout(() => {
              const packTargetEl = document.getElementById('dynasty-reinforce-pack-target');
              if (packTargetEl) packTargetEl.style.display = 'none';

              const revealSlot = document.getElementById('dynasty-reinforce-reveal-slot');
              if (!revealSlot) return;
              revealSlot.style.display = 'block';

              const customActionHTML = `
                <div style="margin-top:12px; width:100%;">
                  <button id="btn-dynasty-open-replacement" class="btn" style="width:100%; padding:12px 18px; font-family:'Press Start 2P',monospace; font-size:9.5px; background:linear-gradient(135deg,#38bdf8,#0284c7); color:#000; border:none; border-radius:6px; cursor:pointer; box-shadow:0 0 16px rgba(56,189,248,0.4); margin-bottom:8px;">
                    🔄 ${_t('dynasty.replace_player_title', 'SELECCIONAR JUGADOR A REEMPLAZAR')} ➔
                  </button>
                  <button id="btn-dynasty-discard-reinforce" class="btn btn-secondary" style="width:100%; padding:9px 14px; font-family:'Press Start 2P',monospace; font-size:8px;">
                    ${_t('dynasty.keep_current_roster', '❌ CONSERVAR ROSTER ACTUAL (DESCARTAR REFUERZO)')}
                  </button>
                </div>
              `;

              revealSlot.innerHTML = renderDexCardFlipHTML(newCard, contractYears, 1, 1, customActionHTML);

              const btnFlip = revealSlot.querySelector('#btn-dynasty-flip-card');
              const flipInner = revealSlot.querySelector('#dynasty-flip-inner');
              const flipContainer = revealSlot.querySelector('#dynasty-flip-container');

              const doFlip = (e) => {
                if (e) e.stopPropagation();
                if (flipInner) {
                  flipInner.classList.toggle('flipped');
                  if (window.BaseballDex && typeof window.BaseballDex.playCardFlipSound === 'function') {
                    window.BaseballDex.playCardFlipSound();
                  } else if (typeof window.playSound === 'function') {
                    window.playSound('card_flip');
                  }
                }
              };

              if (btnFlip) btnFlip.onclick = doFlip;
              if (flipContainer) flipContainer.onclick = doFlip;

              const btnReplace = revealSlot.querySelector('#btn-dynasty-open-replacement');
              if (btnReplace) {
                btnReplace.onclick = () => this.showRosterReplacementModal(newCard, contractYears);
              }

              const btnDiscard = revealSlot.querySelector('#btn-dynasty-discard-reinforce');
              if (btnDiscard) {
                btnDiscard.onclick = () => {
                  this.save();
                  this.renderSeasonHub();
                };
              }
            }, 450);
          };
        }
      } else if (type === 'day81') {
        const bPool = getBatterPool();
        const pPool = getPitcherPool();
        const allStarStars = [...bPool.filter(b => b.ovr >= 87), ...pPool.filter(p => p.ovr >= 87)];
        const shuffled = allStarStars.sort(() => Math.random() - 0.5).slice(0, 3);

        const cardsHTML = shuffled.map((card, idx) => `
          <div class="dynasty-allstar-pick-card" data-idx="${idx}" style="background:rgba(255,255,255,0.04); border:2px solid rgba(255,215,0,0.3); border-radius:10px; padding:12px; cursor:pointer; text-align:center; transition:all 0.2s;">
            <div style="font-size:24px; margin-bottom:4px;">${card.role ? '🧢' : '⚡'}</div>
            <div style="font-family:'Press Start 2P',monospace; font-size:9px; color:#ffd700; margin-bottom:4px;">${cleanName(card)}</div>
            <div style="font-size:8.5px; color:#38bdf8; margin-bottom:6px;">${card.role || card.pos || 'UTL'} • ${card.year || ''}</div>
            <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:#00ff66; margin-bottom:8px;">${Math.round(card.ovr || 88)} OVR</div>
            <button class="btn" style="padding:6px 12px; font-family:'Press Start 2P',monospace; font-size:7.5px; background:#ffd700; color:#000; border:none; border-radius:4px; cursor:pointer;">
              ${_t('dynasty.draft_this_star', 'SELECCIONAR')}
            </button>
          </div>
        `).join('');

        container.innerHTML = `
          <div style="max-width: 820px; margin: 20px auto; text-align:center; background:rgba(0,0,0,0.7); border:2px solid #ffd700; border-radius:12px; padding:22px; box-shadow:0 0 35px rgba(255,215,0,0.3);">
            <div style="font-size:36px; margin-bottom:6px;">🌟</div>
            <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:#ffd700; margin-bottom:6px;">
              ${_t('dynasty.midseason_allstar_title', 'JUEGO 81: ALL-STAR DRAFT')}
            </div>
            <p style="font-size:10.5px; color:#e2e8f0; line-height:1.5; margin-bottom:16px;">
              ${_t('dynasty.allstar_draft_desc', '¡Felicitaciones por llegar a la pausa del Juego de Estrellas! Como bono especial de franquicia, puedes elegir <strong>1 superestrella All-Star</strong> para reforzar tu roster hacia el título.')}
            </p>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:16px;">
              ${cardsHTML}
            </div>
          </div>
        `;

        container.querySelectorAll('.dynasty-allstar-pick-card').forEach(cDiv => {
          cDiv.onclick = () => {
            const idx = parseInt(cDiv.dataset.idx, 10);
            const chosen = shuffled[idx];
            if (chosen) {
              this.showRosterReplacementModal(chosen, 2);
            }
          };
        });
      } else if (type === 'day110') {
        const bPool = getBatterPool();
        const tradeTarget = bPool.filter(b => b.ovr >= 86)[Math.floor(Math.random() * 20)] || bPool[0];

        container.innerHTML = `
          <div style="max-width: 600px; margin: 30px auto; text-align:center; background:rgba(0,0,0,0.7); border:2px solid #ec4899; border-radius:10px; padding:20px; box-shadow:0 0 25px rgba(236,72,153,0.3);">
            <div style="font-size:30px; margin-bottom:8px;">🚨</div>
            <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:#ec4899; margin-bottom:8px;">
              ${_t("dynasty.midseason_trade_title", "JUEGO 110: TRADE DEADLINE")}
            </div>
            <p style="font-size:10.5px; color:#e2e8f0; line-height:1.5; margin-bottom:14px;">
              Otro club ofrece a la estrella <strong>${cleanName(tradeTarget)} (OVR ${Math.round(tradeTarget.ovr || 85)})</strong> para tu recta final.
            </p>
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:10px; margin-bottom:18px; font-size:9.5px; color:#9ca3af;">
              ${_t('dynasty.midseason_trade_question', '¿Deseas aceptar el canje para reforzar tu alineación hacia los Playoffs?')}
            </div>
            <div style="display:flex; justify-content:center; gap:10px;">
              <button id="btn-accept-trade" class="btn" style="padding:11px 18px; font-family:'Press Start 2P',monospace; font-size:9px; background:#00ff66; color:#000;">
                ${_t('dynasty.midseason_trade_accept', '🤝 ACEPTAR TRASPASO')}
              </button>
              <button id="btn-decline-trade" class="btn btn-secondary" style="padding:11px 18px; font-family:'Press Start 2P',monospace; font-size:9px;">
                ${_t('dynasty.midseason_trade_decline', 'MANTENER ROSTER')}
              </button>
            </div>
          </div>
        `;

        const btnAccept = document.getElementById('btn-accept-trade');
        const btnDecline = document.getElementById('btn-decline-trade');
        if (btnAccept) {
          btnAccept.onclick = () => {
            this.state.contracts[cardKey(tradeTarget)] = 1;
            this.state.roster.bench.push(tradeTarget);
            this.save();
            this.renderSeasonHub();
          };
        }
        if (btnDecline) {
          btnDecline.onclick = () => this.renderSeasonHub();
        }
      }
    },

    // ── Selector Interactivo de Reemplazo de Jugador para Refuerzos de Temporada ──
    showRosterReplacementModal(newCard, contractYears) {
      const container = document.getElementById('dynasty-content-area');
      if (!container || !this.state) return;

      const R = this.state.roster;
      const C = this.state.contracts;
      const newIsPitcher = Boolean(newCard.role);
      const newCardTitle = `${cleanName(newCard)} (OVR ${Math.round(newCard.ovr || 75)} · ${newCard.role || newCard.pos || 'UTL'})`;

      const renderPlayerChoiceRow = (p, roleOrPos, groupKey, slotKey = null) => {
        if (!p) return '';
        const k = cardKey(p);
        const years = C[k] || 1;
        const ovrClass = p.ovr >= 90 ? '#ffd700' : (p.ovr >= 80 ? '#38bdf8' : '#10b981');
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:6px 10px; margin-bottom:4px; gap:8px;">
            <div style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
              <span style="font-family:'Press Start 2P',monospace; font-size:7.5px; color:#9ca3af; width:28px; flex-shrink:0;">${roleOrPos}</span>
              <span style="font-size:9.5px; font-weight:bold; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${cleanName(p)}</span>
              <span style="font-size:8px; color:#94a3b8; flex-shrink:0;">(${p.year || ''})</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
              <span style="font-family:'Press Start 2P',monospace; font-size:8px; color:${ovrClass};">${Math.round(p.ovr || 75)} OVR</span>
              <span style="font-family:'Press Start 2P',monospace; font-size:7px; color:#00ff66; background:rgba(0,255,102,0.1); border:1px solid rgba(0,255,102,0.3); padding:1px 4px; border-radius:2px;">${years}a</span>
              <button class="btn-dynasty-do-swap btn" data-group="${groupKey}" data-slot="${slotKey || ''}" data-key="${k}" style="padding:4px 8px; font-family:'Press Start 2P',monospace; font-size:7px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">
                ${_t('dynasty.replace_btn', 'REEMPLAZAR')}
              </button>
            </div>
          </div>
        `;
      };

      const lineupHTML = LINEUP_SLOTS.map(slot => renderPlayerChoiceRow(R.lineup[slot], slot, 'lineup', slot)).join('');
      const benchHTML = R.bench.map((p, idx) => renderPlayerChoiceRow(p, `BN${idx + 1}`, 'bench', idx)).join('');
      const spHTML = R.sp.map((p, idx) => renderPlayerChoiceRow(p, `SP${idx + 1}`, 'sp', idx)).join('');
      const rpHTML = R.rp.map((p, idx) => renderPlayerChoiceRow(p, idx === R.rp.length - 1 ? 'CP' : `RP${idx + 1}`, 'rp', idx)).join('');

      container.innerHTML = `
        <div style="max-width: 900px; margin: 20px auto;">
          <div style="background:rgba(0,0,0,0.6); border:2px solid #ffd700; border-radius:10px; padding:16px; margin-bottom:14px; text-align:center;">
            <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:#ffd700; margin-bottom:6px;">
              ${_t('dynasty.replace_player_title', '🔄 SELECCIONA EL JUGADOR A REEMPLAZAR')}
            </div>
            <div style="font-size:9.5px; color:#e2e8f0; line-height:1.4;">
              ${_t('dynasty.replace_player_desc', 'El jugador seleccionado causará baja inmediata de tu franquicia y el nuevo refuerzo ocupará su lugar con un contrato de 2 temporadas.')}
            </div>
            <div style="margin-top:8px; font-family:'Press Start 2P',monospace; font-size:9px; color:#00ff66;">
              ${_t("dynasty.new_reinforcement_label", "NUEVO REFUERZO: {{title}}", { title: newCardTitle })}
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,215,0,0.2); border-radius:8px; padding:10px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#ffd700; margin-bottom:8px;">
                ⚡ LINEUP TITULAR
              </div>
              ${lineupHTML}
              <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#a7f3d0; margin:10px 0 8px 0;">
                🛋️ BANCA DE SUPLENTES
              </div>
              ${benchHTML}
            </div>

            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(56,189,248,0.2); border-radius:8px; padding:10px;">
              <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#38bdf8; margin-bottom:8px;">
                ${_t('dynasty.rotation_forming', '🧢 ROTACIÓN (5 SP)')}
              </div>
              ${spHTML}
              <div style="font-family:'Press Start 2P',monospace; font-size:8px; color:#38bdf8; margin:10px 0 8px 0;">
                ${_t('dynasty.bullpen_forming', '🔥 BULLPEN (7 RP)')}
              </div>
              ${rpHTML}
            </div>
          </div>

          <div style="text-align:center;">
            <button id="btn-dynasty-cancel-replacement" class="btn btn-secondary" style="padding:10px 20px; font-family:'Press Start 2P',monospace; font-size:8.5px;">
              ${_t('dynasty.keep_current_roster', '❌ CONSERVAR ROSTER ACTUAL (DESCARTAR REFUERZO)')}
            </button>
          </div>
        </div>
      `;

      container.querySelectorAll('.btn-dynasty-do-swap').forEach(btn => {
        btn.onclick = () => {
          const group = btn.dataset.group;
          const slot = btn.dataset.slot;
          const oldKey = btn.dataset.key;

          this.replaceRosterPlayer(group, slot, oldKey, newCard, contractYears);
        };
      });

      const btnCancel = document.getElementById('btn-dynasty-cancel-replacement');
      if (btnCancel) {
        btnCancel.onclick = () => {
          this.save();
          this.renderSeasonHub();
        };
      }
    },

    replaceRosterPlayer(group, slot, oldKey, newCard, contractYears) {
      const R = this.state.roster;
      const newKey = cardKey(newCard);

      // Borrar contrato anterior y registrar nuevo contrato
      delete this.state.contracts[oldKey];
      this.state.contracts[newKey] = contractYears;

      if (group === 'lineup') {
        R.lineup[slot] = newCard;
        // Update lineupOrder: replace old key with new key to preserve batting order
        if (R.lineupOrder) {
          const orderIdx = R.lineupOrder.indexOf(oldKey);
          if (orderIdx !== -1) R.lineupOrder[orderIdx] = newKey;
          else R.lineupOrder = R.lineupOrder.filter(k => k !== oldKey).concat([newKey]);
        }
      } else if (group === 'bench') {
        const idx = parseInt(slot, 10);
        R.bench[idx] = newCard;
      } else if (group === 'sp') {
        const idx = parseInt(slot, 10);
        R.sp[idx] = newCard;
      } else if (group === 'rp') {
        const idx = parseInt(slot, 10);
        R.rp[idx] = newCard;
      }

      this.initPlayerStats();
      this.save();
      this.renderSeasonHub();
    },

    // ── 5. Postemporada Ronda a Ronda y Progresión Viva de Rivales ────────────
    handlePlayoffsAndOffseason() {
      const container = document.getElementById('dynasty-content-area');
      if (!container || !this.state) return;

      const userRecord = this.state.standings[this.state.team.code];
      const qualified = userRecord.w >= 88;

      let playoffResultText = '';
      let wonWorldSeries = false;
      let roundsWon = 0;

      if (qualified) {
        // Simular ronda a ronda: Wild Card (al mejor de 3), Division Series (al mejor de 5), Championship Series (al mejor de 7), World Series (al mejor de 7)
        const teamOvr = 80 + (userRecord.w - 88) * 0.5;
        const simRound = (gamesNeeded, oppRating) => {
          let uWins = 0, oWins = 0;
          const prob = 0.50 + ((teamOvr - oppRating) * 0.015);
          while (uWins < gamesNeeded && oWins < gamesNeeded) {
            if (Math.random() < prob) uWins++; else oWins++;
          }
          return uWins > oWins;
        };

        const passWC = simRound(2, 82);
        if (passWC) {
          roundsWon++;
          const passDS = simRound(3, 84);
          if (passDS) {
            roundsWon++;
            const passCS = simRound(4, 86);
            if (passCS) {
              roundsWon++;
              const passWS = simRound(4, 88);
              if (passWS) {
                roundsWon++;
                wonWorldSeries = true;
                this.state.championships = (this.state.championships || 0) + 1;
                playoffResultText = _t("dynasty.playoff_won_ws", "🏆 ¡CAMPEONES DE LA SERIE MUNDIAL! Barrida triunfal en la Postemporada de Octubre.");
              } else {
                playoffResultText = _t("dynasty.playoff_sub_ws", "🥈 SUBCAMPEONES: Caída épica en el Juego 7 de la Serie Mundial.");
              }
            } else {
              playoffResultText = _t("dynasty.playoff_cs", "🥉 Eliminados en la Serie de Campeonato (Final de Liga).");
            }
          } else {
            playoffResultText = _t("dynasty.playoff_ds", "Eliminados en la Serie Divisional.");
          }
        } else {
          playoffResultText = _t("dynasty.playoff_wc", "Eliminados en la Serie de Comodines (Wild Card).");
        }
      } else {
        playoffResultText = _t("dynasty.playoff_missed", "❌ Récord de {{w}}-{{l}}: No alcanzó para clasificar a la fiesta de Octubre.", { w: userRecord.w, l: userRecord.l });
      }

      // Progresión viva de la liga: Las 29 franquicias rivales realizan movimientos de temporada baja
      if (this.state.leagueRosters) {
        const bPool = getBatterPool();
        const pPool = getPitcherPool();
        Object.keys(this.state.leagueRosters).forEach(code => {
          if (code === this.state.team.code) return;
          const rObj = this.state.leagueRosters[code];
          if (Math.random() < 0.50 && rObj.lineup && rObj.lineup.length > 0) {
            const swapIdx = Math.floor(Math.random() * rObj.lineup.length);
            const newB = bPool[Math.floor(Math.random() * bPool.length)];
            if (newB) rObj.lineup[swapIdx] = newB;
          }
          if (Math.random() < 0.40 && rObj.sp && rObj.sp.length > 0) {
            const swapIdx = Math.floor(Math.random() * rObj.sp.length);
            const newP = pPool[Math.floor(Math.random() * pPool.length)];
            if (newP) rObj.sp[swapIdx] = newP;
          }
        });
      }

      if (!this.state.history) this.state.history = [];
      this.state.history.push({
        season: this.state.seasonYear,
        record: `${userRecord.w}-${userRecord.l}`,
        wonWS: wonWorldSeries,
        playoffResult: playoffResultText,
        teamName: this.state.team.name
      });

      const expiredKeys = [];
      Object.keys(this.state.contracts).forEach(k => {
        this.state.contracts[k]--;
        if (this.state.contracts[k] <= 0) {
          expiredKeys.push(k);
        }
      });

      const expSet = new Set(expiredKeys);

      container.innerHTML = `
        <div style="max-width: 680px; margin: 20px auto; text-align:center; background:rgba(0,0,0,0.6); border:2px solid #ffd700; border-radius:10px; padding:22px;">
          <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:#ffd700; margin-bottom:10px;">
            ${_t('dynasty.offseason_title', '🏁 FIN DE LA TEMPORADA {{year}}', { year: this.state.seasonYear })}
          </div>
          <div style="font-size:11.5px; color:#e2e8f0; margin-bottom:16px; line-height:1.5;">
            ${playoffResultText}
          </div>

          <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:12px; margin-bottom:18px; text-align:left;">
            <div style="font-family:'Press Start 2P',monospace; font-size:8.5px; color:#ef4444; margin-bottom:6px;">
              ${_t('dynasty.expired_contracts_title', '⚠️ CONTRATOS EXPIRADOS (AGENCIA LIBRE):')} ${_t('dynasty.offseason_expired_count', '{{count}} jugadores', { count: expiredKeys.length })}
            </div>
            <div style="font-size:9.5px; color:#94a3b8; line-height:1.4;">
              ${expiredKeys.length > 0 
                ? _t("dynasty.offseason_expired_desc", "Los jugadores que culminaron contrato salen a la agencia libre. <strong>¡Todos tus jugadores con contratos vigentes se mantienen en el roster!</strong> Abrirás exactamente {{count}} sobres para cubrir las vacantes.", { count: expiredKeys.length }) 
                : _t("dynasty.offseason_no_expired", "¡Excelente gestión! Ningún jugador ha expirado contrato este año. Tu roster se mantiene intacto.")}
            </div>
          </div>

          <button id="btn-dynasty-next-year" class="btn" style="padding:12px 24px; font-family:'Press Start 2P',monospace; font-size:10px; background:linear-gradient(135deg,#00ff66,#059669); color:#000; border:none; border-radius:6px; cursor:pointer;">
            ${_t('dynasty.next_year_btn', '🌅 ARRANCAR TEMPORADA {{year}} ➔', { year: this.state.seasonYear + 1 })}
          </button>
        </div>
      `;

      const btnNextYear = document.getElementById('btn-dynasty-next-year');
      if (btnNextYear) {
        btnNextYear.onclick = () => {
          this.state.seasonYear++;
          this.state.currentDay = 0;
          this.state.streak = 0;
          this.state.gameLog = [];
          this.state.standings = this.generateInitialStandings();
          this.state.leagueRosters = generateLeagueOpponents();
          this.state.stats = { batters: {}, pitchers: {} };
          this.state.resignAttempts = {};
          this.state.eventsSeen = { day40: false, day81: false, day110: false };

          if (expiredKeys.length > 0) {
            LINEUP_SLOTS.forEach(s => {
              if (this.state.roster.lineup[s] && expSet.has(cardKey(this.state.roster.lineup[s]))) {
                delete this.state.roster.lineup[s];
              }
            });
            this.state.roster.bench = this.state.roster.bench.filter(b => !expSet.has(cardKey(b)));
            this.state.roster.sp = this.state.roster.sp.filter(p => !expSet.has(cardKey(p)));
            this.state.roster.rp = this.state.roster.rp.filter(p => !expSet.has(cardKey(p)));

            this.boxOpening = {
              totalPacks: expiredKeys.length,
              currentPack: 0,
              pulledCards: [],
              isOpening: false
            };
            this.renderNextPack();
          } else {
            this.save();
            this.renderSeasonHub();
          }
        };
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.DynastyMode.init());
  } else {
    window.DynastyMode.init();
  }
})();
