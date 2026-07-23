// BaseRogue Baseball RPG — Interactive Dice Battler Engine
// Each plate appearance is resolved by a manual dice roll (1–100).
// New damage model:
//   OUT (groundout/flyout): 8 dmg -> shields first, then 100 HP team
//   SO  (strikeout):        Bypasses shield! Direct HP dmg with chain mult
//   BB  (base on balls):    10 + (EYE/10) damage to pitcher
//   1B  (single):           15 * (1 + CON/100)  to pitcher
//   2B  (double):           30 * (1 + PWR/100)  to pitcher
//   3B  (triple):           40 + (PWR/5) + (SPD/5)
//   HR  (home run):         75 * (1 + (PWR*1.5)/100)
// SPD procs:
//   SPD >= 60 on single → steal chance → pitcher +20% dmg debuff for 2 turns
//   Grade A/A+/S          → 25-50% chance to upgrade hit type before dmg calc

(function() {

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  /** Grade label from value 1-99 */
  function getGrade(val) {
    if (val >= 100) return 'S';
    if (val >= 80) return 'A';
    if (val >= 60) return 'B';
    if (val >= 40) return 'C';
    if (val >= 20) return 'D';
    return 'F';
  }

  const HIGH_SPEED_GRADES = new Set(['S', 'A']);

  // ── PROBABILITY BOUNDARIES ──────────────────────────────────────────────────
  /**
   * Calculates the dice boundary zones for a batter vs. pitcher.
   * Returns an object with cumulative thresholds on 1-100 scale:
   *   { bb: <end of BB zone>, so: <end of SO zone>, out: <end of OUT zone>, hit: 100 }
   * The roll is compared as:
   *   1 .. bb_end         → BB (Base on Balls)
   *   bb_end+1 .. so_end  → SO (Strikeout)
   *   so_end+1 .. out_end → OUT (Groundout/Flyout)
   *   out_end+1 .. 100    → HIT
   *
   * @param {object} batter  - Effective batter stats {con, pwr, eye, spd}
   * @param {object} pitcher - Pitcher stats {stf, vel, ctl}
   * @returns {{ bbEnd, soEnd, outEnd, singleEnd, doubleEnd, tripleEnd, pBB, pSO, pOut, pHit }}
   */
  function calcBoundaries(batter, pitcher) {
    const effCon = batter.con || 50;
    const effEye = batter.eye || 50;
    const effPwr = batter.pwr || 50;
    const effSpd = batter.spd || 50;
    
    // Pitcher attributes (new opponent system uses stf, ctl, mov)
    const pStf   = pitcher.stf || 50;
    const pCtl   = pitcher.ctl || 50;
    const pMov   = pitcher.mov || 50;

    // BB rate: Batter Eye vs Pitcher Control
    let pBB = 0.08 + (effEye - pCtl) * 0.0025;
    pBB = Math.max(0.04, Math.min(0.22, pBB));

    // SO rate: Pitcher Stuff vs Batter Contact
    let pSO = 0.15 + (pStf - effCon) * 0.0025;
    pSO = Math.max(0.04, Math.min(0.38, pSO));

    // HR rate: INDEPENDENT of standard hit rate (Quadratic scaling on Power - Pitcher Movement)
    let pHR = 0.01 + (effPwr * effPwr) * 0.000018 - (pMov - 50) * 0.0012;
    pHR = Math.max(0.005, pHR); // Floor at 0.5% HR chance

    // Regular HIT rate (1B, 2B, 3B): Base 35% + Contact vs Movement
    let pRegularHit = 0.35 + (effCon - pMov) * 0.004;
    pRegularHit = Math.max(0.10, Math.min(0.55, pRegularHit)); // Max 55%, Min 10%

    // OUT gets the rest
    let pOut = Math.max(0.05, 1.0 - pBB - pSO - pHR - pRegularHit);

    // Normalize to sum = 1
    const total = pBB + pSO + pOut + pRegularHit + pHR;
    pBB  /= total;
    pSO  /= total;
    pOut /= total;
    pRegularHit /= total;
    pHR  /= total;
    let pHit = pRegularHit + pHR;

    // Subdivide Regular Hits into 1B, 2B, 3B
    let extraBasePower = Math.max(0, (effPwr - pMov) * 0.003); 
    let doubleWeight = 0.15 + (effSpd * 0.001) + (extraBasePower * 0.5);
    let tripleWeight = 0.02 + (effSpd * 0.002);
    let singleWeight = Math.max(0.10, 1.0 - doubleWeight - tripleWeight);
    
    // Normalize weights inside regular hits
    const hitTotal = singleWeight + doubleWeight + tripleWeight;
    const pSingle = pRegularHit * (singleWeight / hitTotal);
    const pDouble = pRegularHit * (doubleWeight / hitTotal);
    const pTriple = pRegularHit * (tripleWeight / hitTotal);
    
    // Map to 1-100 integer boundaries ensuring NO overlap and strict ascending order
    const bbEnd = Math.max(1, Math.round(pBB * 100));
    const soWidth = Math.round(pSO * 100);
    const soEnd = bbEnd + Math.max(1, soWidth);
    
    let hrWidth = Math.round(pHR * 100);
    if (hrWidth < 1) hrWidth = 1;
    
    const tripleEnd = Math.max(soEnd + 4, 100 - hrWidth);
    
    const tripleWidth = Math.round(pTriple * 100);
    const doubleEnd = Math.max(soEnd + 3, tripleEnd - tripleWidth);
    
    const doubleWidth = Math.round(pDouble * 100);
    const singleEnd = Math.max(soEnd + 2, doubleEnd - doubleWidth);
    
    const singleWidth = Math.round(pSingle * 100);
    const outEnd = Math.max(soEnd + 1, singleEnd - singleWidth);

    return { bbEnd, soEnd, outEnd, singleEnd, doubleEnd, tripleEnd, pBB, pSO, pOut, pHit };
  }

  /**
   * Determine hit type from a secondary roll (0-1) based on pitcher/batter.
   * Returns '1B', '2B', '3B', or 'HR'
   */
  function determineHitType(batter, pitcher) {
    const effPwr = batter.pwr || 50;
    const pStf   = pitcher.stf || 50;

    let pHR = 0.05 + (effPwr - pStf) * 0.002;
    pHR = Math.max(0.02, Math.min(0.20, pHR));

    const r = Math.random();
    if (r < pHR)              return 'HR';
    if (r < pHR + 0.07)       return '3B';
    if (r < pHR + 0.07 + 0.22) return '2B';
    return '1B';
  }


  // ── MAIN SIMULATION CLASS ────────────────────────────────────────────────────
  /**
   * InteractiveBattle manages state between manual dice rolls.
   * Call .rollDice(1-100) to process one plate appearance.
   */
  class InteractiveBattle {
    /**
     * @param {object} awayTeam  - { name, lineup: Player[], pitchers: [] (unused in battle) }
     * @param {object} homeTeam  - { name, pitchers: Pitcher[] }
     * @param {number} teamShield - Sum(def_val of 9 batters) / 9  (pre-calculated by UI)
     */
    constructor(awayTeam, homeTeam, teamShield) {
      this.awayTeam = awayTeam;
      this.homeTeam = homeTeam;

      // ── Team (player side) vitals ─────────────────────────────────
      this.teamHP    = 100;           // Fixed; strikeouts bite here directly
      this.teamShield = Math.min(50, Math.round(teamShield || 0));  // Absorbs groundouts/flyouts (capped at 50)
      this.teamShieldMax = this.teamShield;

      // ── Pitcher side ──────────────────────────────────────────────
      this.enemyPitcherIndex = 0;     // Which pitcher we're currently facing

      // ── Baseball state ────────────────────────────────────────────
      this.inning  = 1;
      this.outs    = 0;
      this.runs    = 0;
      this.bases   = [null, null, null]; // 1B, 2B, 3B

      // ── Lineup tracking ───────────────────────────────────────────
      this.awayLineupIndex = 0;

      // ── Strikeout chain ───────────────────────────────────────────
      this.strikeoutChain = 0;

      // ── SPD debuff on pitcher ─────────────────────────────────────
      // { turnsLeft: N, multiplier: 1.20 } – applied to pitcher dmg received
      this.pitcherDebuff = null;

      // ── Combat log ───────────────────────────────────────────────
      this.events = [];

      // ── Active Synergies calculation ──────────────────────────────
      this.activeSynergies = this._calculateActiveSynergies(awayTeam.lineup);

      // ── Game over flag ───────────────────────────────────────────
      this.battleOver = false;
      this.winner = null; // 'player' | 'pitcher'

      // Log opening
      const totalPitchers = this.homeTeam.pitchers.length;
      this.logEvent('START',
        `--- INICIO DEL COMBATE INTERACTIVO (3 INNINGS) ---\n` +
        `${awayTeam.name} (HP: ${this.teamHP} | Escudo: ${this.teamShield}) vs ` +
        `${homeTeam.name} (${totalPitchers} lanzadores)`,
        'START');
    }

    _calculateActiveSynergies(lineup) {
      const eraCounts = {};
      lineup.forEach(p => {
        if (p && p.era && p.era !== 'None') {
          eraCounts[p.era] = (eraCounts[p.era] || 0) + 1;
        }
      });
      const active = {};
      Object.keys(eraCounts).forEach(era => {
        const count = eraCounts[era];
        if (count >= 2) {
          active[era] = count >= 4 ? 2 : 1;
        }
      });
      return active;
    }

    // ── Current active pitcher ──────────────────────────────────────
    get activePitcher() {
      return this.homeTeam.pitchers[this.enemyPitcherIndex] || null;
    }

    // ── Boundaries for the current matchup (batter vs pitcher) ──────
    getBoundaries() {
      const batter  = this.awayTeam.lineup[this.awayLineupIndex];
      const pitcher = this.activePitcher;
      if (!batter || !pitcher) return null;
      return calcBoundaries(batter, pitcher);
    }

    // ── MAIN PUBLIC API: process one dice roll ──────────────────────
    /**
     * @param {number} roll - Integer 1-100 (inclusive)
     * @returns {object} event logged for this turn (or null if battle was already over)
     */
    rollDice(roll) {
      if (this.battleOver) return [];

      const startIndex = this.events.length;

      const batter  = this.awayTeam.lineup[this.awayLineupIndex];
      const pitcher = this.activePitcher;
      const batterEra = batter.era;
      const eraSynergy = this.activeSynergies[batterEra] || 0;

      // 1. Integration Era stat boost before calcBoundaries
      let effBatter = { ...batter };
      if (batterEra === 'Integration (1942-1960)' && eraSynergy >= 1) {
        const boost = eraSynergy === 2 ? 8 : 4;
        effBatter.con = (effBatter.con || 50) + boost;
        effBatter.pwr = (effBatter.pwr || 50) + boost;
        effBatter.eye = (effBatter.eye || 50) + boost;
        effBatter.spd = (effBatter.spd || 50) + boost;
        effBatter.def = (effBatter.def || 50) + boost;
      }

      const bounds = calcBoundaries(effBatter, pitcher);

      let eventType, playText;
      let pitcherDmg = 0;
      let teamHpDmg  = 0;
      let shieldDmg  = 0;
      let runsThisTurn = 0;
      let didSteal   = false;
      let spdProc    = null; // description of any SPD proc that fired
      let synergyProc = null; // description of any Era Synergy proc that fired
      let errorProc   = null; // description of Genesis Chaos error

      // ── DETERMINE OUTCOME ────────────────────────────────────────
      if (roll <= bounds.bbEnd) {
        // ── BASE ON BALLS ──────────────────────────────────────────
        eventType = 'BB';
        this.strikeoutChain = 0;
        runsThisTurn = this._advanceWalk(batter);
        this.runs += runsThisTurn;
        pitcherDmg = 10 + (runsThisTurn * 10);

        // Efficiency Era BB boost
        if (batterEra === 'Efficiency (2006-2015)' && eraSynergy >= 1) {
          const extra = eraSynergy === 2 ? 20 : 10;
          pitcherDmg += extra;
          synergyProc = `📊 Moneyball: ¡Boleto paciente inflige +${extra} daño!`;
        }
        // Modern Era BB boost
        else if (batterEra === 'Modern Era (2016-Pres)' && eraSynergy >= 1) {
          const extra = eraSynergy === 2 ? 24 : 12;
          pitcherDmg += extra;
          synergyProc = `🚀 Three True Outcomes: ¡Boleto optimizado inflige +${extra} daño!`;
        }

        pitcherDmg = this._applyDebuffToPitcherDmg(pitcherDmg);
        this._damagePitcher(pitcherDmg);
        
        let batterPlayText = `🎲 [${roll}] [BASE POR BOLAS] ${batter.name} trabaja el conteo y saca pasaporte.` +
          (runsThisTurn ? ` ¡Carrera de caballito! ` : ` Avanza a primera. `) +
          `${pitcher.name} sufre ${pitcherDmg} HP de daño.`;

        // Steal Proc Logic on BB if batter ends on 1B and 2B is empty
        let stealChance = Math.min(0.85, 0.10 + ((effBatter.spd - 40) * 0.01));
        let stealHeal = 0;
        let extraStealDmg = 0;
        let debuffTurns = 2;
        let debuffMult = 1.20;
        let stealProcMsg = "";

        // Expansion Era steal boost
        if (batterEra === 'Expansion (1961-1976)' && eraSynergy >= 1) {
          stealChance = eraSynergy === 2 ? 0.80 : 0.50;
          stealHeal = eraSynergy === 2 ? 20 : 10;
          extraStealDmg = eraSynergy === 2 ? 10 : 0;
          stealProcMsg = `Sinergia Expansion`;
        }
        else if (batterEra === 'Big Hair Era (1977-1993)' && eraSynergy >= 1) {
          stealChance = Math.min(0.95, stealChance * 2);
          extraStealDmg = eraSynergy === 2 ? 30 : 15;
          if (eraSynergy === 2) {
            debuffTurns = 3;
            debuffMult = 1.30;
          }
          stealProcMsg = `Sinergia Big Hair`;
        }

        if ((effBatter.spd || 0) >= 40 && this.bases[0] === batter && !this.bases[1] && Math.random() < stealChance) {
          this.bases[1] = batter;
          this.bases[0] = null;
          didSteal = true;

          if (this.pitcherDebuff && this.pitcherDebuff.turnsLeft > 0) {
            this.pitcherDebuff.turnsLeft += debuffTurns;
            if (debuffMult > this.pitcherDebuff.multiplier) this.pitcherDebuff.multiplier = debuffMult;
          } else {
            this.pitcherDebuff = { turnsLeft: debuffTurns, multiplier: debuffMult };
          }
          
          let spdMsg = `🏃 ¡ROBO DE BASE! ${batter.name} se roba la segunda base.`;
          if (stealProcMsg) spdMsg += ` (${stealProcMsg})`;
          const impLabel = this.pitcherDebuff.turnsLeft === 1 ? 'impacto restante' : 'impactos restantes';
          spdMsg += ` Debuff de +20% daño (${this.pitcherDebuff.turnsLeft} ${impLabel}).`;
          
          if (stealHeal > 0) {
            batter.stamina = Math.min(100, (batter.stamina || 100) + stealHeal);
            spdMsg += ` (+${stealHeal} Stamina)`;
          }
          if (extraStealDmg > 0) {
            this._damagePitcher(extraStealDmg);
            pitcherDmg += extraStealDmg;
            spdMsg += ` (+${extraStealDmg} daño extra al lanzador)`;
          }
          
          spdProc = (spdProc ? spdProc + ' | ' : '') + spdMsg;
        }

        playText = batterPlayText + (spdProc ? ` ${spdProc}` : ``) + (synergyProc ? ` ${synergyProc}` : ``);

      } else if (roll <= bounds.soEnd) {
        // ── STRIKEOUT ─────────────────────────────────────────────
        eventType = 'SO';
        this.outs++;
        this.strikeoutChain++;

        let modernSoReduction = false;
        if (batterEra === 'Modern Era (2016-Pres)' && eraSynergy >= 1) {
          modernSoReduction = true;
          if (eraSynergy === 2) {
            this.strikeoutChain = Math.max(0, this.strikeoutChain - 1);
          }
        }

        let baseSoDmg = 18;
        if (this.strikeoutChain === 2) {
          baseSoDmg = 24;
        } else if (this.strikeoutChain >= 3) {
          baseSoDmg = 30;
        }

        let finalSoDmg = baseSoDmg;
        if (modernSoReduction) {
          finalSoDmg = Math.round(finalSoDmg * 0.5);
          synergyProc = `🚀 Three True Outcomes: Ponche causa -50% daño HP`;
        }
        teamHpDmg = finalSoDmg;

        this.teamHP = Math.max(0, this.teamHP - teamHpDmg);
        const chainLabel = this.strikeoutChain > 1 ? ` 🔥 RACHA ×${this.strikeoutChain} (-${baseSoDmg} HP)!` : '';
        playText = `🎲 [${roll}] [PONCHE] ¡${pitcher.name} poncha a ${batter.name}!${chainLabel}` +
          ` Daño directo: -${teamHpDmg} HP del equipo (¡ignora el escudo!).` +
          ` HP restante: ${this.teamHP}/100`;

        if (batterEra === 'Integration (1942-1960)' && eraSynergy === 2) {
          this.awayTeam.lineup.forEach(p => {
            if (p) p.stamina = Math.min(100, (p.stamina || 100) + 5);
          });
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + `🔋 Five-Tool: ¡OUT recupera +5 de Stamina a todos!`;
        }
        if (batterEra === 'Efficiency (2006-2015)' && eraSynergy === 2) {
          this._damagePitcher(10);
          pitcherDmg += 10;
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + `📊 Moneyball Out Wear: +10 daño al lanzador.`;
        }

      } else if (roll <= bounds.outEnd) {
        // ── GROUNDOUT / FLYOUT ────────────────────────────────────
        eventType = 'OUT';
        this.outs++;
        this.strikeoutChain = 0;
        const outDmg = 10;
        if (this.teamShield > 0) {
          shieldDmg = Math.min(this.teamShield, outDmg);
          this.teamShield -= shieldDmg;
          const overflow = outDmg - shieldDmg;
          if (overflow > 0) {
            teamHpDmg = overflow;
            this.teamHP = Math.max(0, this.teamHP - overflow);
          }
        } else {
          teamHpDmg = outDmg;
          this.teamHP = Math.max(0, this.teamHP - outDmg);
        }
        const outTypes = [
          'saca un rodado por el cuadro para out',
          'conecta un elevado al jardín para out de rutina',
          'línea quemante atrapada en el aire'
        ];
        const outStr = outTypes[Math.floor(Math.random() * outTypes.length)];
        playText = `🎲 [${roll}] [OUT] ${batter.name} ${outStr}.` +
          ` Escudo -${shieldDmg} HP | Team HP -${teamHpDmg} HP.` +
          ` (Escudo: ${this.teamShield}/${this.teamShieldMax} | HP: ${this.teamHP}/100)`;

        if (this.bases[2] && batterEra === 'Steroid Era (1994-2005)' && eraSynergy === 2 && Math.random() < 0.50) {
          runsThisTurn++;
          this.bases[2] = null;
          synergyProc = `💪 Bash Brothers Sac Fly: ¡Corredor en 3B anota carrera!`;
          this.runs += runsThisTurn;
        }

        if (batterEra === 'Integration (1942-1960)' && eraSynergy === 2) {
          this.awayTeam.lineup.forEach(p => {
            if (p) p.stamina = Math.min(100, (p.stamina || 100) + 5);
          });
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + `🔋 Five-Tool: ¡OUT recupera +5 de Stamina a todos!`;
        }
        if (batterEra === 'Efficiency (2006-2015)' && eraSynergy === 2) {
          this._damagePitcher(10);
          pitcherDmg += 10;
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + `📊 Moneyball Out Wear: +10 daño al lanzador.`;
        }

      } else {
        // ── HIT ───────────────────────────────────────────────────
        this.strikeoutChain = 0;
        
        let hitType;
        if (roll <= bounds.singleEnd) {
          hitType = '1B';
        } else if (roll <= bounds.doubleEnd) {
          hitType = '2B';
        } else if (roll <= bounds.tripleEnd) {
          hitType = '3B';
        } else {
          hitType = 'HR';
        }

        const spdGrade = getGrade(effBatter.spd || 50);
        if (HIGH_SPEED_GRADES.has(spdGrade)) {
          const upgradeChance = spdGrade === 'S' ? 0.50 : (spdGrade === 'A+' ? 0.40 : 0.25);
          if (Math.random() < upgradeChance) {
            const upgrade = { '1B': '2B', '2B': '3B', '3B': '3B', 'HR': 'HR' };
            const newType = upgrade[hitType];
            if (newType !== hitType) {
              spdProc = `⚡ SPD Proc (Grado ${spdGrade}): ¡${hitType} convertido en ${newType}!`;
              hitType = newType;
            }
          }
        }

        if (hitType === '2B' && batterEra === 'Golden Era (1920-1941)' && eraSynergy === 2 && Math.random() < 0.30) {
          hitType = '3B';
          synergyProc = `🔥 Liveball Sluggers: ¡Doble convertido en Triple!`;
        }

        let genesisErrorSucceeded = false;
        if (batterEra === 'The Genesis Era (1871-1900)' && eraSynergy >= 1) {
          const errChance = eraSynergy === 2 ? 0.30 : 0.15;
          if (Math.random() < errChance) {
            genesisErrorSucceeded = true;
            const extraDmg = eraSynergy === 2 ? 20 : 10;
            pitcherDmg += extraDmg;
            errorProc = `💥 Genesis Chaos: ¡Error rival! +${extraDmg} daño e incremento extra de bases.`;
          }
        }

        if (hitType === 'HR') {
          runsThisTurn = this._advanceHomeRun(batter);
          const runnersOnBase = Math.max(0, runsThisTurn - 1);
          let hrDmg = 75 + (runnersOnBase * 10);
          
          if (batterEra === 'Steroid Era (1994-2005)' && eraSynergy >= 1) {
            const extraHr = eraSynergy === 2 ? 40 : 20;
            hrDmg += extraHr;
            synergyProc = `💪 Bash Brothers: ¡Jonrón inflige +${extraHr} daño!`;
          }
          
          pitcherDmg += hrDmg;
          eventType = 'HR';
          playText = `🎲 [${roll}] [JONRÓN] ¡${batter.name} CUADRANGULAR de ${runsThisTurn} carreras! `;

        } else if (hitType === '3B') {
          runsThisTurn = this._advanceTriple(batter);
          if (genesisErrorSucceeded) {
            if (this.bases[2]) { runsThisTurn++; this.bases[2] = null; }
            if (this.bases[1]) { runsThisTurn++; this.bases[1] = null; }
            if (this.bases[0]) { runsThisTurn++; this.bases[0] = null; }
          }
          pitcherDmg += 45 + (runsThisTurn * 10);
          eventType = '3B';
          playText = `🎲 [${roll}] [TRIPLE] ¡${batter.name} triple al rincón! `;

        } else if (hitType === '2B') {
          runsThisTurn = this._advanceDouble(batter);
          if (genesisErrorSucceeded) {
            if (this.bases[2]) { runsThisTurn++; this.bases[2] = null; }
            if (this.bases[1]) { runsThisTurn++; this.bases[1] = null; }
            if (this.bases[0]) { this.bases[2] = this.bases[0]; this.bases[0] = null; }
          }
          pitcherDmg += 30 + (runsThisTurn * 10);
          eventType = '2B';
          playText = `🎲 [${roll}] [DOBLE] ¡${batter.name} línea violenta por la raya! `;

        } else {
          let deadballDoubleAdvance = false;
          if (batterEra === 'Deadball (1901-1919)' && eraSynergy >= 1) {
            const doubleChance = eraSynergy === 2 ? 0.40 : 0.20;
            if (Math.random() < doubleChance) {
              deadballDoubleAdvance = true;
              synergyProc = `⏳ Small Ball: ¡Avanzan 2 bases en sencillo!`;
            }
          }

          runsThisTurn = this._advanceSingle(batter, deadballDoubleAdvance);

          if (genesisErrorSucceeded) {
            if (this.bases[2]) { runsThisTurn++; this.bases[2] = null; }
            if (this.bases[1]) { this.bases[2] = this.bases[1]; this.bases[1] = null; }
            if (this.bases[0]) { this.bases[1] = this.bases[0]; this.bases[0] = null; }
          }

          pitcherDmg += 15 + (runsThisTurn * 10);
          eventType = '1B';
          playText = `🎲 [${roll}] [SENCILLO] ¡${batter.name} imparable raso! `;
        }

        if (batterEra === 'Golden Era (1920-1941)' && eraSynergy >= 1) {
          const extraGolden = eraSynergy === 2 ? 12 : 6;
          pitcherDmg += extraGolden;
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + `🔥 Liveball Sluggers: +${extraGolden} daño.`;
        }

        this.runs += runsThisTurn;
        pitcherDmg = this._applyDebuffToPitcherDmg(pitcherDmg);
        this._damagePitcher(pitcherDmg);

        if (eventType === '1B') {
          let stealChance = Math.min(0.85, 0.10 + ((effBatter.spd - 40) * 0.01));
          let stealHeal = 0;
          let extraStealDmg = 0;
          let debuffTurns = 2;
          let debuffMult = 1.20;
          let stealProcMsg = "";

          if (batterEra === 'Expansion (1961-1976)' && eraSynergy >= 1) {
            stealChance = eraSynergy === 2 ? 0.80 : 0.50;
            stealHeal = eraSynergy === 2 ? 20 : 10;
            extraStealDmg = eraSynergy === 2 ? 10 : 0;
            stealProcMsg = `Sinergia Expansion`;
          }
          else if (batterEra === 'Big Hair Era (1977-1993)' && eraSynergy >= 1) {
            stealChance = Math.min(0.95, stealChance * 2);
            extraStealDmg = eraSynergy === 2 ? 30 : 15;
            if (eraSynergy === 2) {
              debuffTurns = 3;
              debuffMult = 1.30;
            }
            stealProcMsg = `Sinergia Big Hair`;
          }

          if ((effBatter.spd || 0) >= 40 && !this.bases[1] && Math.random() < stealChance) {
            this.bases[1] = batter;
            this.bases[0] = null;
            didSteal = true;

            if (this.pitcherDebuff && this.pitcherDebuff.turnsLeft > 0) {
              this.pitcherDebuff.turnsLeft += debuffTurns;
              if (debuffMult > this.pitcherDebuff.multiplier) this.pitcherDebuff.multiplier = debuffMult;
            } else {
              this.pitcherDebuff = { turnsLeft: debuffTurns, multiplier: debuffMult };
            }
            
            let spdMsg = `🏃 ¡ROBO DE BASE! ${batter.name} se roba la segunda base.`;
            if (stealProcMsg) spdMsg += ` (${stealProcMsg})`;
            const impLabel2 = this.pitcherDebuff.turnsLeft === 1 ? 'impacto restante' : 'impactos restantes';
            spdMsg += ` Debuff de +20% daño (${this.pitcherDebuff.turnsLeft} ${impLabel2}).`;
            
            if (stealHeal > 0) {
              batter.stamina = Math.min(100, (batter.stamina || 100) + stealHeal);
              spdMsg += ` (+${stealHeal} Stamina)`;
            }
            if (extraStealDmg > 0) {
              this._damagePitcher(extraStealDmg);
              pitcherDmg += extraStealDmg;
              spdMsg += ` (+${extraStealDmg} daño extra al lanzador)`;
            }
            
            spdProc = (spdProc ? spdProc + ' | ' : '') + spdMsg;
          }
        }

        playText += `Anotan ${runsThisTurn} carreras. ${pitcher.name} sufre ${pitcherDmg} HP de daño.`;
        if (spdProc) playText += ` ${spdProc}`;
        if (errorProc) playText += ` ${errorProc}`;
        if (synergyProc) playText += ` ${synergyProc}`;
      }

      // Advance to next batter
      this.awayLineupIndex = (this.awayLineupIndex + 1) % this.awayTeam.lineup.length;

      // Log event
      this.logEvent('PLAY', playText, eventType, batter.name, teamHpDmg, pitcherDmg);

      // Advance internal state immediately (outs -> innings, KO -> next pitcher)
      this._advanceState();

      // Check win/loss conditions after the play and state advance
      this._checkEndConditions();

      return this.events.slice(startIndex);
    }

    // ── INTERNAL: advance state (outs → innings, KO → next pitcher) ──
    _advanceState() {
      // Pitcher KO check
      const pitcher = this.activePitcher;
      if (pitcher && pitcher.hp <= 0) {
        this.pitcherDebuff = null; // Clear debuff on pitcher KO
        this.logEvent('KO_PITCHER',
          `¡[K.O.] ${pitcher.name} ha sido derrotado! ¡Entra el relevo!`,
          'KO', pitcher.name);
        this.enemyPitcherIndex++;
        if (this.activePitcher) {
          this.logEvent('NEXT_PITCHER',
            `⚾ Entra el relevo: ${this.activePitcher.name} (${this.activePitcher.hp}/${this.activePitcher.maxHp} HP).`,
            'PITCHER_ENTER');
        }
        this._checkEndConditions();
      }
      // 3 outs → end inning
      if (this.outs >= 3) {
        this.logEvent('INNING_END',
          `--- FIN DE LA ENTRADA ${this.inning} (${this.runs} carreras anotadas) ---`,
          'INNING_END');
        this.inning++;
        this.outs = 0;
        this.bases = [null, null, null];
        this.pitcherDebuff = null; // Clear debuff when inning ends
        if (this.inning > 3) {
          this._checkEndConditions();
        }
      }
    }

    // ── INTERNAL: win/loss check ─────────────────────────────────────
    _checkEndConditions() {
      if (this.battleOver) return;

      const allPitchersDown = this.enemyPitcherIndex >= this.homeTeam.pitchers.length;
      const teamDead = this.teamHP <= 0;
      const outOfInnings = this.inning > 3 && this.outs >= 3;

      if (allPitchersDown) {
        this.winner = 'player';
        this.battleOver = true;
        this.logEvent('END',
          `🏆 ¡VICTORIA! ¡Has derrotado a toda la rotación de ${this.homeTeam.name}!`,
          'END');
      } else if (teamDead) {
        this.winner = 'pitcher';
        this.battleOver = true;
        this.logEvent('END',
          `💀 DERROTA. Tu equipo llegó a 0 HP. Los ponches acabaron con tu alineación.`,
          'END');
      } else if (this.inning > 3) {
        this.winner = 'pitcher';
        this.battleOver = true;
        const remaining = this.homeTeam.pitchers.length - this.enemyPitcherIndex;
        this.logEvent('END',
          `⏱ FIN DE PARTIDO (3 innings). Te faltaron ${remaining} lanzadores por derrotar.`,
          'END');
      }
    }

    // ── INTERNAL: strikeout chain multiplier ─────────────────────────
    _strikeoutMultiplier() {
      if (this.strikeoutChain >= 4) return 3.0;
      if (this.strikeoutChain === 3) return 2.0;
      if (this.strikeoutChain === 2) return 1.5;
      return 1.0;
    }

    // ── INTERNAL: apply pitcher debuff to pitcher damage received ────
    _applyDebuffToPitcherDmg(baseDmg) {
      if (!this.pitcherDebuff || this.pitcherDebuff.turnsLeft <= 0) return baseDmg;
      const boosted = Math.round(baseDmg * this.pitcherDebuff.multiplier);
      this.pitcherDebuff.turnsLeft--;
      if (this.pitcherDebuff.turnsLeft <= 0) this.pitcherDebuff = null;
      return boosted;
    }

    // ── INTERNAL: deal damage to active pitcher ─────────────────────
    _damagePitcher(dmg) {
      const p = this.activePitcher;
      if (!p) return;
      p.hp = Math.max(0, p.hp - dmg);
    }

    // ── INTERNAL: base-running helpers ──────────────────────────────
    _advanceWalk(batter) {
      let runs = 0;
      if (!this.bases[0]) {
        this.bases[0] = batter;
      } else if (!this.bases[1]) {
        this.bases[1] = this.bases[0]; this.bases[0] = batter;
      } else if (!this.bases[2]) {
        this.bases[2] = this.bases[1]; this.bases[1] = this.bases[0]; this.bases[0] = batter;
      } else {
        runs++;
        this.bases[2] = this.bases[1]; this.bases[1] = this.bases[0]; this.bases[0] = batter;
      }
      return runs;
    }

    _advanceSingle(batter, doubleAdvance = false) {
      let runs = 0;
      if (doubleAdvance) {
        if (this.bases[2]) { runs++; this.bases[2] = null; }
        if (this.bases[1]) { runs++; this.bases[1] = null; }
        if (this.bases[0]) { this.bases[2] = this.bases[0]; this.bases[0] = null; }
        this.bases[0] = batter;
        return runs;
      }

      if (this.bases[2]) { runs++; this.bases[2] = null; }
      if (this.bases[1]) {
        if ((this.bases[1].spd || 50) > 65) { runs++; }
        else { this.bases[2] = this.bases[1]; }
        this.bases[1] = null;
      }
      if (this.bases[0]) {
        if ((this.bases[0].spd || 50) > 75 && !this.bases[2]) { this.bases[2] = this.bases[0]; }
        else { this.bases[1] = this.bases[0]; }
        this.bases[0] = null;
      }
      this.bases[0] = batter;
      return runs;
    }

    _advanceDouble(batter) {
      let runs = 0;
      if (this.bases[2]) { runs++; this.bases[2] = null; }
      if (this.bases[1]) { runs++; this.bases[1] = null; }
      if (this.bases[0]) {
        if ((this.bases[0].spd || 50) > 65) { runs++; } else { this.bases[2] = this.bases[0]; }
        this.bases[0] = null;
      }
      this.bases[1] = batter;
      return runs;
    }

    _advanceTriple(batter) {
      let runs = 0;
      for (let i = 0; i < 3; i++) { if (this.bases[i]) { runs++; this.bases[i] = null; } }
      this.bases[2] = batter;
      return runs;
    }

    _advanceHomeRun(batter) {
      let runs = 1;
      for (let i = 0; i < 3; i++) { if (this.bases[i]) { runs++; this.bases[i] = null; } }
      return runs;
    }

    // ── INTERNAL: event logger ───────────────────────────────────────
    logEvent(playType, playText, eventType, activeBatter = '', teamHpDmg = 0, pitcherDmg = 0) {
      const pitcher = this.activePitcher;
      const ev = {
        playType,
        playText,
        eventType,
        activeBatter,
        activePitcher: pitcher ? {
          name:  pitcher.name,
          hp:    pitcher.hp,
          maxHp: pitcher.maxHp,
          index: this.enemyPitcherIndex,
          vel:   pitcher.vel,
          stf:   pitcher.stf,
          ctl:   pitcher.ctl,
          era:   pitcher.era,
          team:  pitcher.team,
          rarity: pitcher.rarity
        } : null,
        inning:          this.inning,
        outs:            this.outs,
        runs:            this.runs,
        bases:           this.bases.map(b => b ? 'X' : ' '),
        teamHP:          this.teamHP,
        teamShield:      this.teamShield,
        teamShieldMax:   this.teamShieldMax,
        strikeoutChain:  this.strikeoutChain,
        pitchersDefeated: this.enemyPitcherIndex,
        teamHpDmg,
        pitcherDmg,
        battleOver:      this.battleOver,
        winner:          this.winner
      };
      this.events.push(ev);
      return ev;
    }

    // ── PUBLIC HELPERS for UI ────────────────────────────────────────
    /** Returns boundaries for current matchup (to show zones in UI). */
    currentBoundaries() {
      if (this.battleOver) return null;
      const batter  = this.awayTeam.lineup[this.awayLineupIndex];
      const pitcher = this.activePitcher;
      if (!batter || !pitcher) return null;
      const b = calcBoundaries(batter, pitcher);
      return {
        batter, pitcher,
        bbEnd:  b.bbEnd,
        soEnd:  b.soEnd,
        outEnd: b.outEnd,
        singleEnd: b.singleEnd,
        doubleEnd: b.doubleEnd,
        tripleEnd: b.tripleEnd
      };
    }

    /** Snapshot of the full battle state for the UI. */
    getState() {
      return {
        teamHP:          this.teamHP,
        teamShield:      this.teamShield,
        teamShieldMax:   this.teamShieldMax,
        strikeoutChain:  this.strikeoutChain,
        inning:          this.inning,
        outs:            this.outs,
        runs:            this.runs,
        bases:           this.bases.map(b => b ? 'X' : ' '),
        activePitcher:   this.activePitcher ? {
          name:   this.activePitcher.name,
          hp:     this.activePitcher.hp,
          maxHp:  this.activePitcher.maxHp,
          index:  this.enemyPitcherIndex,
          total:  this.homeTeam.pitchers.length,
          vel:    this.activePitcher.vel,
          stf:    this.activePitcher.stf,
          ctl:    this.activePitcher.ctl,
          era:    this.activePitcher.era,
          team:   this.activePitcher.team,
          rarity: this.activePitcher.rarity
        } : null,
        currentBatter:   this.awayTeam.lineup[this.awayLineupIndex] || null,
        lineupIndex:     this.awayLineupIndex,
        pitcherDebuff:   this.pitcherDebuff,
        battleOver:      this.battleOver,
        winner:          this.winner,
        events:          this.events
      };
    }
  }

  // Expose
  window.InteractiveBattle = InteractiveBattle;
  window.calcBoundaries    = calcBoundaries;

})();
