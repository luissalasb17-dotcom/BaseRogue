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

  function _t(key, options, fallback) {
    if (typeof window.t === 'function') {
      return window.t(key, options);
    }
    return fallback;
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
  function calcBoundaries(batter, pitcher, simCtx) {
    const effCon = batter.con || 50;
    const effEye = batter.eye || 50;
    const effPwr = batter.pwr || 50;
    const effSpd = batter.spd || 50;
    
    // Pitcher attributes (MLB The Show suite: h9, k9, bb9, hr9, sta)
    const pH9  = pitcher.h9  !== undefined ? pitcher.h9  : (pitcher.grt !== undefined ? pitcher.grt : 50);
    const pK9  = pitcher.k9  !== undefined ? pitcher.k9  : (pitcher.stf !== undefined ? pitcher.stf : 50);
    const pBB9 = pitcher.bb9 !== undefined ? pitcher.bb9 : (pitcher.ctl !== undefined ? pitcher.ctl : 50);
    const pHR9 = pitcher.hr9 !== undefined ? pitcher.hr9 : (pitcher.mov !== undefined ? pitcher.mov : 50);

    // 1. BB rate: Batter Eye vs Pitcher BB/9 Control (Base 10%, Slope 0.20%)
    let pBB = 0.10 + (effEye - pBB9) * 0.0020;
    pBB = Math.max(0.04, Math.min(0.35, pBB));

    // 2. SO rate: Pitcher K/9 Strikeout vs Batter Contact (Base 16%, Slope 0.20%)
    let pSO = 0.16 + (pK9 - effCon) * 0.0020;
    pSO = Math.max(0.04, Math.min(0.35, pSO));

    // 3. Total HIT rate (1B, 2B, 3B, HR): Batter Contact vs Pitcher H/9 Hit Suppression (Base 44%, Slope 0.22%)
    let pTotalHit = 0.44 + (effCon - pH9) * 0.0022;
    pTotalHit = Math.max(0.16, Math.min(0.60, pTotalHit));

    // 4. HR share of Hits: Batter Power vs Pitcher HR/9 Prevention (Base 10% of hits, Slope 0.35%)
    let hrRatio = 0.10 + (effPwr - pHR9) * 0.0035;
    hrRatio = Math.max(0.02, Math.min(0.45, hrRatio));

    let pHR = pTotalHit * hrRatio;
    let pRegularHit = pTotalHit - pHR;

    // 5. OUT gets the rest (Floor 10%)
    let pOut = Math.max(0.10, 1.0 - pBB - pSO - pTotalHit);

    // ── Clutch Player Badge Config & Boost Application ───────────────────────
    // Differentiated boosts: 1B: +2%, 2B: +2%, 3B: 0%, HR: +4% (Total +8% subtracted from Out)
    const CLUTCH_BOOST_CONFIG = {
      single: 0.02,
      double: 0.02,
      triple: 0.00,
      hr:     0.04
    };

    let isClutchActive = false;
    let clutchActualBoosts = { single: 0, double: 0, triple: 0, hr: 0, totalOutPenalty: 0 };

    if ((batter.clutch || batter.is_clutch) && simCtx) {
      const isLastInning = simCtx.inning >= 3;
      const runnersInScoring = !!(simCtx.bases && (simCtx.bases[1] || simCtx.bases[2]));
      if (isLastInning || runnersInScoring) {
        isClutchActive = true;
        const totalDesired = CLUTCH_BOOST_CONFIG.single + CLUTCH_BOOST_CONFIG.double + CLUTCH_BOOST_CONFIG.triple + CLUTCH_BOOST_CONFIG.hr;
        const availableFromOut = Math.max(0, pOut - 0.10);
        const actualTotalBoost = Math.min(totalDesired, availableFromOut);
        const scale = totalDesired > 0 ? actualTotalBoost / totalDesired : 1.0;

        clutchActualBoosts = {
          single: CLUTCH_BOOST_CONFIG.single * scale,
          double: CLUTCH_BOOST_CONFIG.double * scale,
          triple: CLUTCH_BOOST_CONFIG.triple * scale,
          hr:     CLUTCH_BOOST_CONFIG.hr * scale,
          totalOutPenalty: actualTotalBoost
        };

        const regularHitBoost = clutchActualBoosts.single + clutchActualBoosts.double + clutchActualBoosts.triple;
        pRegularHit += regularHitBoost;
        pHR         += clutchActualBoosts.hr;
        pOut        -= actualTotalBoost;
      }
    }

    // Normalize to sum = 1
    const total = pBB + pSO + pOut + pRegularHit + pHR;
    pBB  /= total;
    pSO  /= total;
    pOut /= total;
    pRegularHit /= total;
    pHR  /= total;
    let pHit = pRegularHit + pHR;

    // Subdivide Regular Hits into 1B, 2B, 3B
    let extraBasePower = Math.max(0, (effPwr - pHR9) * 0.003); 
    let doubleWeight = 0.15 + (effSpd * 0.001) + (extraBasePower * 0.5);
    
    // Gated Triple Weight Curve by Speed (SPD):
    // - SPD < 40 (Slow sluggers e.g. David Ortiz, Frank Thomas): ~0.1% triple weight (almost 0)
    // - SPD 40-69 (Average runners): 0.5% - 2.0% triple weight
    // - SPD >= 70 (Fast runners e.g. Ichiro, Rickey): 2.0% - 7.5% triple weight
    let tripleWeight = 0.001;
    if (effSpd >= 70) {
      tripleWeight = 0.020 + (effSpd - 70) * 0.0018;
    } else if (effSpd >= 40) {
      tripleWeight = 0.005 + (effSpd - 40) * 0.0005;
    }

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
    
    let hrWidth = Math.max(1, Math.round(pHR * 100));
    
    const tripleEnd = Math.max(soEnd + 4, 100 - hrWidth);
    
    // Ensure Triple has at least 1 percentage point width (e.g. 93-93) so ranges never invert
    const tripleWidth = Math.max(1, Math.round(pTriple * 100));
    const doubleEnd = Math.max(soEnd + 3, tripleEnd - tripleWidth);
    
    const doubleWidth = Math.max(1, Math.round(pDouble * 100));
    const singleEnd = Math.max(soEnd + 2, doubleEnd - doubleWidth);
    
    const singleWidth = Math.max(1, Math.round(pSingle * 100));
    const outEnd = Math.max(soEnd + 1, singleEnd - singleWidth);

    return { bbEnd, soEnd, outEnd, singleEnd, doubleEnd, tripleEnd, pBB, pSO, pOut, pHit, isClutchActive, clutchActualBoosts };
  }

  /**
   * Determine hit type from a secondary roll (0-1) based on pitcher/batter.
   * Returns '1B', '2B', '3B', or 'HR'
   */
  function determineHitType(batter, pitcher) {
    const effPwr = batter.pwr || 50;
    const effSpd = batter.spd || 50;
    const pStf   = pitcher.stf || 50;

    let pHR = 0.05 + (effPwr - pStf) * 0.002;
    pHR = Math.max(0.02, Math.min(0.20, pHR));

    let p3B = 0.001;
    if (effSpd >= 70) p3B = 0.02 + (effSpd - 70) * 0.0018;
    else if (effSpd >= 40) p3B = 0.005 + (effSpd - 40) * 0.0005;

    const r = Math.random();
    if (r < pHR)              return 'HR';
    if (r < pHR + p3B)        return '3B';
    if (r < pHR + p3B + 0.25) return '2B';
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
     * @param {string} buildEra  - Player-chosen Era of Build (window.PlayersDB.Eras value) or null
     */
    constructor(awayTeam, homeTeam, teamShield, buildEra = null) {
      this.awayTeam = awayTeam;
      this.homeTeam = homeTeam;
      this.buildEra = buildEra || null;

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

      // ── Five-Tool Legends T4: batters exempt from post-match Stamina loss ──
      this.staminaImmuneBatterIds = new Set();

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

    // Tier scale: T1=2+, T2=4+, T3=6+, T4=8+ players of that era in the roster.
    // Only the active Build Era scales past T1 — any other era with 2+ players
    // is locked at a fixed T1 effect no matter how many more it has.
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
        if (count < 2) return;
        if (era === this.buildEra) {
          active[era] = count >= 8 ? 4 : count >= 6 ? 3 : count >= 4 ? 2 : 1;
        } else {
          active[era] = 1;
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
      return calcBoundaries(batter, pitcher, this);
    }

    // ── MAIN PUBLIC API: process one dice roll ──────────────────────
    /**
     * @param {number} roll - Integer 1-100 (inclusive)
     * @returns {object} event logged for this turn (or null if battle was already over)
     */
    rollDice(roll) {
      if (this.battleOver) return [];

      const _t = (key, params, fallback) => (typeof window.t === 'function' ? window.t(key, params) : (fallback || key));
      const startIndex = this.events.length;

      const batter  = this.awayTeam.lineup[this.awayLineupIndex];
      const pitcher = this.activePitcher;
      const batterEra = batter.era;
      const eraSynergy = this.activeSynergies[batterEra] || 0;

      // 1. Integration Era stat boost before calcBoundaries
      let effBatter = { ...batter };
      if (batterEra === 'Integration (1942-1960)' && eraSynergy >= 1) {
        const boost = eraSynergy === 4 ? 12 : eraSynergy >= 2 ? 8 : 4;
        effBatter.con = (effBatter.con || 50) + boost;
        effBatter.pwr = (effBatter.pwr || 50) + boost;
        effBatter.eye = (effBatter.eye || 50) + boost;
        effBatter.spd = (effBatter.spd || 50) + boost;
        effBatter.def = (effBatter.def || 50) + boost;
      }

      const bounds = calcBoundaries(effBatter, pitcher, this);

      let eventType, playText;
      let pitcherDmg = 0;
      let teamHpDmg  = 0;
      let shieldDmg  = 0;
      let runsThisTurn = 0;
      let didSteal   = false;
      let spdProc    = null; // description of any SPD proc that fired
      let synergyProc = null; // description of any Era Synergy proc that fired
      let errorProc   = null; // description of Genesis Chaos error
      let clutchProc  = null;
      if (batter && (batter.clutch || batter.is_clutch)) {
        const isLastInning = this.inning >= 3;
        const runnersInScoring = !!(this.bases[1] || this.bases[2]);
        if (isLastInning || runnersInScoring) {
          const reason = (isLastInning && runnersInScoring)
            ? _t('sim.clutch_reason_both', {}, 'última entrada con corredores en posición de anotar')
            : isLastInning
              ? _t('sim.clutch_reason_inning', {}, 'última entrada')
              : _t('sim.clutch_reason_runners', {}, 'corredores en posición de anotar');
          clutchProc = `⚡ ¡CLUTCH PLAYER! ${batter.name} ${_t('sim.clutch_desc', {}, 'batea en momento decisivo')} (${reason}) — (+2% 1B/2B, +4% HR).`;
        }
      }

      // ── DETERMINE OUTCOME ────────────────────────────────────────
      if (roll <= bounds.bbEnd) {
        // ── BASE ON BALLS ──────────────────────────────────────────
        eventType = 'BB';
        this.strikeoutChain = 0;

        // Small Ball T3+: BB also gets the "advance 2 bases" chance (T1/T2 only apply to 1B)
        let bbDeadballDoubleAdvance = false;
        if (batterEra === 'Deadball (1901-1919)' && eraSynergy >= 3) {
          const bbDoubleChance = eraSynergy === 4 ? 0.55 : 0.40;
          if (Math.random() < bbDoubleChance) {
            bbDeadballDoubleAdvance = true;
            synergyProc = _t('sim.syn_smallball', {}, '⏳ Small Ball: ¡Avanzan 2 bases en sencillo!');
          }
        }

        runsThisTurn = this._advanceWalk(batter, bbDeadballDoubleAdvance);
        this.runs += runsThisTurn;
        pitcherDmg = 10 + (runsThisTurn * 10);

        // Efficiency Era BB boost
        if (batterEra === 'Efficiency Era (2006-2015)' && eraSynergy >= 1) {
          const extra = eraSynergy === 4 ? 30 : eraSynergy >= 2 ? 20 : 10;
          pitcherDmg += extra;
          synergyProc = _t('sim.syn_moneyball_bb', { extra }, `📊 Moneyball: ¡Boleto paciente inflige +${extra} daño!`);
        }
        // Modern Era BB boost
        else if (batterEra === 'Modern Era (2016-Pres)' && eraSynergy >= 1) {
          const extra = eraSynergy === 4 ? 36 : eraSynergy >= 2 ? 24 : 12;
          pitcherDmg += extra;
          synergyProc = _t('sim.syn_tto_bb', { extra }, `🚀 Three True Outcomes: ¡Boleto optimizado inflige +${extra} daño!`);
        }

        pitcherDmg = this._applyDebuffToPitcherDmg(pitcherDmg);
        
        let batterPlayText = `🎲 [${roll}] [${_t('sim.label_bb', {}, 'BASE POR BOLAS')}] ${batter.name} ${_t('sim.bb_desc', {}, 'trabaja el conteo y saca pasaporte')}.` +
          (runsThisTurn ? ` ${_t('sim.bb_run', {}, '¡Carrera de caballito!')} ` : ` ${_t('sim.bb_advance', {}, 'Avanza a primera.')} `) +
          `${pitcher.name} ${_t('sim.pitcher_dmg_txt', { dmg: pitcherDmg }, 'sufre ' + pitcherDmg + ' HP de daño')}.`;

        // Steal Proc Logic on BB if batter ends on 1B and 2B is empty
        let stealChance = Math.min(0.85, 0.10 + ((effBatter.spd - 40) * 0.01));
        let stealHeal = 0;
        let extraStealDmg = 0;
        let debuffTurns = 2;
        let debuffMult = 1.20;
        let stealProcMsg = "";

        // Expansion Era steal boost
        if (batterEra === 'Expansion (1961-1976)' && eraSynergy >= 1) {
          // T1: 50%/+10 heal · T2/T3: 80%/+20 heal/+10dmg · T4: 90%/+30 heal/+20dmg
          stealChance = eraSynergy === 4 ? 0.90 : eraSynergy >= 2 ? 0.80 : 0.50;
          stealHeal = eraSynergy === 4 ? 30 : eraSynergy >= 2 ? 20 : 10;
          extraStealDmg = eraSynergy === 4 ? 20 : eraSynergy >= 2 ? 10 : 0;
          // T3+: also apply the pitcher debuff (reusing Big Hair's multiplier, not a new one)
          if (eraSynergy >= 3) {
            debuffTurns = eraSynergy === 4 ? 4 : 3;
            debuffMult = 1.30;
          }
          stealProcMsg = _t('sim.syn_expansion', {}, 'Sinergia Expansion');
        }
        else if (batterEra === 'Big Hair Era (1977-1993)' && eraSynergy >= 1) {
          // Chance: 2x base (cap 95%) at every tier · Dmg: T1 15, T2/T3 30, T4 45
          // Debuff: T1 2t/1.20x (default) · T2 3t/1.30x · T3 4t/1.30x · T4 5t/1.40x
          stealChance = Math.min(0.95, stealChance * 2);
          extraStealDmg = eraSynergy === 4 ? 45 : eraSynergy >= 2 ? 30 : 15;
          if (eraSynergy === 2) {
            debuffTurns = 3;
            debuffMult = 1.30;
          } else if (eraSynergy === 3) {
            debuffTurns = 4;
            debuffMult = 1.30;
          } else if (eraSynergy === 4) {
            debuffTurns = 5;
            debuffMult = 1.40;
          }
          stealProcMsg = _t('sim.syn_bighair', {}, 'Sinergia Big Hair');
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
          
          let spdMsg = `🏃 ${_t('sim.steal_label', {}, '¡ROBO DE BASE!')} ${batter.name} ${_t('sim.steal_desc', {}, 'se roba la segunda base')}.`;
          if (stealProcMsg) spdMsg += ` (${stealProcMsg})`;
          const impLabel = this.pitcherDebuff.turnsLeft === 1 ? _t('sim.debuff_turn_s', {}, 'impacto restante') : _t('sim.debuff_turns_p', {}, 'impactos restantes');
          spdMsg += ` ${_t('sim.debuff_note', {}, 'Debuff de +20% daño')} (${this.pitcherDebuff.turnsLeft} ${impLabel}).`;
          
          if (stealHeal > 0) {
            batter.stamina = Math.min(100, (batter.stamina || 100) + stealHeal);
            spdMsg += ` (+${stealHeal} Stamina)`;
          }
          if (extraStealDmg > 0) {
            pitcherDmg += extraStealDmg;
            spdMsg += ` (+${extraStealDmg} ${_t('sim.extra_dmg_pitcher', {}, 'daño extra al lanzador')})`;
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
          if (eraSynergy >= 2) {
            this.strikeoutChain = Math.max(0, this.strikeoutChain - 1);
          }
        }

        // Moneyball T3/T4: this batter's own strikeout streak needs 1/2 extra
        // strikeouts before the damage escalation (24/30) kicks in.
        let soEscalationDelay = 0;
        if (batterEra === 'Efficiency Era (2006-2015)' && eraSynergy >= 3) {
          soEscalationDelay = eraSynergy === 4 ? 2 : 1;
        }
        const effectiveSoChain = Math.max(1, this.strikeoutChain - soEscalationDelay);

        let baseSoDmg = 18;
        if (effectiveSoChain === 2) {
          baseSoDmg = 24;
        } else if (effectiveSoChain >= 3) {
          baseSoDmg = 30;
        }

        let finalSoDmg = baseSoDmg;
        if (modernSoReduction) {
          finalSoDmg = Math.round(finalSoDmg * 0.5);
          synergyProc = _t('sim.syn_tto_so', {}, '🚀 Three True Outcomes: Ponche causa -50% daño HP');
        }
        teamHpDmg = finalSoDmg;

        this.teamHP = Math.max(0, this.teamHP - teamHpDmg);
        const chainLabel = this.strikeoutChain > 1 ? ` 🔥 ${_t('sim.streak_label', { count: this.strikeoutChain, dmg: baseSoDmg }, 'RACHA ×' + this.strikeoutChain + ' (-' + baseSoDmg + ' HP)!')}` : '';
        playText = `🎲 [${roll}] [${_t('sim.label_so', {}, 'PONCHE')}] ¡${pitcher.name} ${_t('sim.so_pitcher_verb', { batter: batter.name }, 'poncha a ' + batter.name)}!${chainLabel}` +
          ` ${_t('sim.so_direct_dmg', { dmg: teamHpDmg }, 'Daño directo: -' + teamHpDmg + ' HP del equipo (¡ignora el escudo!)')}.` +
          ` ${_t('sim.hp_remaining', { hp: this.teamHP }, 'HP restante: ' + this.teamHP + '/100')}`;

        if (batterEra === 'Integration (1942-1960)' && eraSynergy >= 2) {
          // T2: +5 Stamina to all · T3: +10 · T4: +15, and this batter skips the post-match Stamina loss
          const healAmt = eraSynergy === 4 ? 15 : eraSynergy === 3 ? 10 : 5;
          this.awayTeam.lineup.forEach(p => {
            if (p) p.stamina = Math.min(100, (p.stamina || 100) + healAmt);
          });
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + _t('sim.syn_fivetool_out', { amt: healAmt }, `🔋 Five-Tool: ¡OUT recupera +${healAmt} de Stamina a todos!`);
          if (eraSynergy === 4) {
            this.staminaImmuneBatterIds.add(batter.id || batter.name);
            synergyProc += ' | ' + _t('sim.syn_fivetool_immune', { name: batter.name }, `🔋 Five-Tool: ¡${batter.name} es inmune al desgaste de Stamina de este partido!`);
          }
        }
        if (batterEra === 'Efficiency Era (2006-2015)' && eraSynergy >= 2) {
          const outExtra = eraSynergy === 4 ? 20 : eraSynergy === 3 ? 15 : 10;
          pitcherDmg += outExtra;
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + _t('sim.syn_moneyball_out', { extra: outExtra }, `📊 Moneyball Out Wear: +${outExtra} daño al lanzador.`);
        }
        // Pre-existing bug: SO branch built playText above and never appended synergyProc,
        // so any era proc on a strikeout (Five-Tool, Moneyball) was silently invisible in the log.
        if (synergyProc) playText += ` ${synergyProc}`;

      } else if (roll <= bounds.outEnd) {
        // ── GROUNDOUT / FLYOUT ────────────────────────────────────
        eventType = 'OUT';
        this.outs++;
        this.strikeoutChain = 0;
        const outDmg = 12;
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
          _t('sim.out_ground', {}, 'saca un rodado por el cuadro para out'),
          _t('sim.out_fly', {}, 'conecta un elevado al jardín para out de rutina'),
          _t('sim.out_line', {}, 'línea quemante atrapada en el aire')
        ];
        const outStr = outTypes[Math.floor(Math.random() * outTypes.length)];
        playText = `🎲 [${roll}] [${_t('sim.label_out', {}, 'OUT')}] ${batter.name} ${outStr}.` +
          ` ${_t('sim.out_dmg_label', { shield: shieldDmg, hp: teamHpDmg }, 'Escudo -' + shieldDmg + ' HP | Team HP -' + teamHpDmg + ' HP')}.` +
          ` (${_t('sim.shield_status', { shield: this.teamShield, max: this.teamShieldMax, hp: this.teamHP }, 'Escudo: ' + this.teamShield + '/' + this.teamShieldMax + ' | HP: ' + this.teamHP + '/100')})`;

        if (batterEra === 'Integration (1942-1960)' && eraSynergy >= 2) {
          // T2: +5 Stamina to all · T3: +10 · T4: +15, and this batter skips the post-match Stamina loss
          const healAmt = eraSynergy === 4 ? 15 : eraSynergy === 3 ? 10 : 5;
          this.awayTeam.lineup.forEach(p => {
            if (p) p.stamina = Math.min(100, (p.stamina || 100) + healAmt);
          });
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + _t('sim.syn_fivetool_out', { amt: healAmt }, `🔋 Five-Tool: ¡OUT recupera +${healAmt} de Stamina a todos!`);
          if (eraSynergy === 4) {
            this.staminaImmuneBatterIds.add(batter.id || batter.name);
            synergyProc += ' | ' + _t('sim.syn_fivetool_immune', { name: batter.name }, `🔋 Five-Tool: ¡${batter.name} es inmune al desgaste de Stamina de este partido!`);
          }
        }
        if (batterEra === 'Efficiency Era (2006-2015)' && eraSynergy >= 2) {
          const outExtra = eraSynergy === 4 ? 20 : eraSynergy === 3 ? 15 : 10;
          pitcherDmg += outExtra;
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + _t('sim.syn_moneyball_out', { extra: outExtra }, `📊 Moneyball Out Wear: +${outExtra} daño al lanzador.`);
        }
        // Same pre-existing bug as the SO branch: append the proc message to the log.
        if (synergyProc) playText += ` ${synergyProc}`;

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
              spdProc = _t('sim.spd_upgrade', { grade: spdGrade, from: hitType, to: newType }, `⚡ SPD Proc (Grado ${spdGrade}): ¡${hitType} convertido en ${newType}!`);
              hitType = newType;
            }
          }
        }

        if (hitType === '2B' && batterEra === 'Golden Era (1920-1941)' && eraSynergy >= 2) {
          // T2/T3: 2B→3B chance · T4: higher 2B→3B chance
          const upgradeChance = eraSynergy === 4 ? 0.50 : eraSynergy === 3 ? 0.40 : 0.30;
          if (Math.random() < upgradeChance) {
            hitType = '3B';
            synergyProc = _t('sim.syn_liveball_upgrade', {}, '🔥 Liveball Sluggers: ¡Doble convertido en Triple!');
          }
        }
        // T4 only: 3B (original or just upgraded from 2B) has a further chance to become a HR
        if (hitType === '3B' && batterEra === 'Golden Era (1920-1941)' && eraSynergy === 4 && Math.random() < 0.20) {
          hitType = 'HR';
          synergyProc = _t('sim.syn_liveball_upgrade_hr', {}, '🔥 Liveball Sluggers: ¡Triple convertido en Jonrón!');
        }

        let genesisErrorSucceeded = false;
        if (batterEra === 'The Genesis Era (1871-1900)' && eraSynergy >= 1) {
          // T1: 15%/+10dmg · T2: 30%/+20dmg · T3: 30%/+20dmg (+10 extra on top) · T4: 40%/+30dmg
          const errChance = eraSynergy === 4 ? 0.40 : eraSynergy >= 2 ? 0.30 : 0.15;
          if (Math.random() < errChance) {
            genesisErrorSucceeded = true;
            const extraDmg = eraSynergy >= 3 ? 30 : eraSynergy === 2 ? 20 : 10;
            pitcherDmg += extraDmg;
            errorProc = _t('sim.syn_genesis_error', { dmg: extraDmg }, `💥 Genesis Chaos: ¡Error rival! +${extraDmg} daño e incremento extra de bases.`);
          }
        }

        if (hitType === 'HR') {
          runsThisTurn = this._advanceHomeRun(batter);
          const runnersOnBase = Math.max(0, runsThisTurn - 1);
          let hrDmg = 75 + (runnersOnBase * 10);
          
          if (batterEra === 'Steroid Era (1994-2005)' && eraSynergy >= 1) {
            // T1: +15 · T2/T3: +30 · T4: +45. T3+ also heals the team on HR (T3 +10, T4 +20).
            const extraHr = eraSynergy === 4 ? 45 : eraSynergy >= 2 ? 30 : 15;
            hrDmg += extraHr;
            synergyProc = _t('sim.syn_bash_hr', { extra: extraHr }, `💪 Bash Brothers: ¡Jonrón inflige +${extraHr} daño!`);
            if (eraSynergy >= 3) {
              const hrHeal = eraSynergy === 4 ? 20 : 10;
              this.awayTeam.lineup.forEach(p => {
                if (p) p.stamina = Math.min(100, (p.stamina || 100) + hrHeal);
              });
              synergyProc += ' | ' + _t('sim.syn_bash_hr_heal', { amt: hrHeal }, `💪 Bash Brothers: ¡Jonrón recupera +${hrHeal} Stamina a todos!`);
            }
          }

          // Three True Outcomes T3+: the HR itself also applies the pitcher debuff
          // (same this.pitcherDebuff mechanism the steal procs use — T3 2t/1.20x, T4 3t/1.30x)
          if (batterEra === 'Modern Era (2016-Pres)' && eraSynergy >= 3) {
            const ttoDebuffTurns = eraSynergy === 4 ? 3 : 2;
            const ttoDebuffMult = eraSynergy === 4 ? 1.30 : 1.20;
            if (this.pitcherDebuff && this.pitcherDebuff.turnsLeft > 0) {
              this.pitcherDebuff.turnsLeft += ttoDebuffTurns;
              if (ttoDebuffMult > this.pitcherDebuff.multiplier) this.pitcherDebuff.multiplier = ttoDebuffMult;
            } else {
              this.pitcherDebuff = { turnsLeft: ttoDebuffTurns, multiplier: ttoDebuffMult };
            }
            synergyProc = (synergyProc ? synergyProc + ' | ' : '') + _t('sim.syn_tto_hr_debuff', { turns: ttoDebuffTurns }, `🚀 Three True Outcomes: ¡Jonrón debilita al lanzador por ${ttoDebuffTurns} impactos!`);
          }

          pitcherDmg += hrDmg;
          eventType = 'HR';
          playText = `🎲 [${roll}] [${_t('sim.label_hr', {}, 'JONRÓN')}] ¡${batter.name} ${_t('sim.hr_desc', { runs: runsThisTurn }, 'CUADRANGULAR de ' + runsThisTurn + ' carreras')}! `;

        } else if (hitType === '3B') {
          runsThisTurn = this._advanceTriple(batter);
          if (genesisErrorSucceeded) {
            if (this.bases[2]) { runsThisTurn++; this.bases[2] = null; }
            if (this.bases[1]) { runsThisTurn++; this.bases[1] = null; }
            if (this.bases[0]) { runsThisTurn++; this.bases[0] = null; }
          }
          pitcherDmg += 45 + (runsThisTurn * 10);
          eventType = '3B';
          playText = `🎲 [${roll}] [${_t('sim.label_3b', {}, 'TRIPLE')}] ¡${batter.name} ${_t('sim.3b_desc', {}, 'triple al rincón')}! `;

        } else if (hitType === '2B') {
          runsThisTurn = this._advanceDouble(batter);
          if (genesisErrorSucceeded) {
            if (this.bases[2]) { runsThisTurn++; this.bases[2] = null; }
            if (this.bases[1]) { runsThisTurn++; this.bases[1] = null; }
            if (this.bases[0]) { this.bases[2] = this.bases[0]; this.bases[0] = null; }
          }
          pitcherDmg += 30 + (runsThisTurn * 10);
          eventType = '2B';
          playText = `🎲 [${roll}] [${_t('sim.label_2b', {}, 'DOBLE')}] ¡${batter.name} ${_t('sim.2b_desc', {}, 'línea violenta por la raya')}! `;

        } else {
          let deadballDoubleAdvance = false;
          if (batterEra === 'Deadball (1901-1919)' && eraSynergy >= 1) {
            // T1: 20% · T2/T3: 40% (T3 also unlocks the BB chance above) · T4: 55%
            const doubleChance = eraSynergy === 4 ? 0.55 : eraSynergy >= 2 ? 0.40 : 0.20;
            if (Math.random() < doubleChance) {
              deadballDoubleAdvance = true;
              synergyProc = _t('sim.syn_smallball', {}, '⏳ Small Ball: ¡Avanzan 2 bases en sencillo!');
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
          playText = `🎲 [${roll}] [${_t('sim.label_1b', {}, 'SENCILLO')}] ¡${batter.name} ${_t('sim.1b_desc', {}, 'imparable raso')}! `;
        }

        if (batterEra === 'Golden Era (1920-1941)' && eraSynergy >= 1) {
          const extraGolden = eraSynergy === 4 ? 18 : eraSynergy >= 2 ? 12 : 6;
          pitcherDmg += extraGolden;
          synergyProc = (synergyProc ? synergyProc + ' | ' : '') + _t('sim.syn_liveball_dmg', { extra: extraGolden }, `🔥 Liveball Sluggers: +${extraGolden} daño.`);
        }

        this.runs += runsThisTurn;
        pitcherDmg = this._applyDebuffToPitcherDmg(pitcherDmg);

        if (eventType === '1B') {
          let stealChance = Math.min(0.85, 0.10 + ((effBatter.spd - 40) * 0.01));
          let stealHeal = 0;
          let extraStealDmg = 0;
          let debuffTurns = 2;
          let debuffMult = 1.20;
          let stealProcMsg = "";

          if (batterEra === 'Expansion (1961-1976)' && eraSynergy >= 1) {
            stealChance = eraSynergy === 4 ? 0.90 : eraSynergy >= 2 ? 0.80 : 0.50;
            stealHeal = eraSynergy === 4 ? 30 : eraSynergy >= 2 ? 20 : 10;
            extraStealDmg = eraSynergy === 4 ? 20 : eraSynergy >= 2 ? 10 : 0;
            if (eraSynergy >= 3) {
              debuffTurns = eraSynergy === 4 ? 4 : 3;
              debuffMult = 1.30;
            }
            stealProcMsg = _t('sim.syn_expansion', {}, 'Sinergia Expansion');
          }
          else if (batterEra === 'Big Hair Era (1977-1993)' && eraSynergy >= 1) {
            stealChance = Math.min(0.95, stealChance * 2);
            extraStealDmg = eraSynergy === 4 ? 45 : eraSynergy >= 2 ? 30 : 15;
            if (eraSynergy === 2) {
              debuffTurns = 3;
              debuffMult = 1.30;
            } else if (eraSynergy === 3) {
              debuffTurns = 4;
              debuffMult = 1.30;
            } else if (eraSynergy === 4) {
              debuffTurns = 5;
              debuffMult = 1.40;
            }
            stealProcMsg = _t('sim.syn_bighair', {}, 'Sinergia Big Hair');
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
            
            let spdMsg = `🏃 ${_t('sim.steal_label', {}, '¡ROBO DE BASE!')} ${batter.name} ${_t('sim.steal_desc', {}, 'se roba la segunda base')}.`;
            if (stealProcMsg) spdMsg += ` (${stealProcMsg})`;
            const impLabel2 = this.pitcherDebuff.turnsLeft === 1 ? _t('sim.debuff_turn_s', {}, 'impacto restante') : _t('sim.debuff_turns_p', {}, 'impactos restantes');
            spdMsg += ` ${_t('sim.debuff_note', {}, 'Debuff de +20% daño')} (${this.pitcherDebuff.turnsLeft} ${impLabel2}).`;
            
            if (stealHeal > 0) {
              batter.stamina = Math.min(100, (batter.stamina || 100) + stealHeal);
              spdMsg += ` (+${stealHeal} Stamina)`;
            }
            if (extraStealDmg > 0) {
              pitcherDmg += extraStealDmg;
              spdMsg += ` (+${extraStealDmg} ${_t('sim.extra_dmg_pitcher', {}, 'daño extra al lanzador')})`;
            }
            
            spdProc = (spdProc ? spdProc + ' | ' : '') + spdMsg;
          }
        }

        playText += _t('sim.runs_scored', { runs: runsThisTurn, pitcher: pitcher.name, dmg: pitcherDmg }, `Anotan ${runsThisTurn} carreras. ${pitcher.name} sufre ${pitcherDmg} HP de daño`) + '.';
        if (spdProc) playText += ` ${spdProc}`;
        if (errorProc) playText += ` ${errorProc}`;
        if (synergyProc) playText += ` ${synergyProc}`;
      }

      if (clutchProc) {
        playText = `${clutchProc} ${playText}`;
      }

      // Advance to next batter
      this.awayLineupIndex = (this.awayLineupIndex + 1) % this.awayTeam.lineup.length;

      // Log PLAY event first so log order is: Outcome -> KO -> Next Pitcher / Remnant Damage
      this.logEvent('PLAY', playText, eventType, batter.name, teamHpDmg, pitcherDmg, runsThisTurn, didSteal);

      // Now apply pitcher damage (which logs KO_PITCHER and RESIDUAL_DMG if pitcher is KO'd)
      if (pitcherDmg > 0) {
        this._damagePitcher(pitcherDmg);
      }

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
        // Debuff persists across pitcher changes until impacts expire or inning ends
        this.logEvent('KO_PITCHER',
          _t('match.log_ko', { name: pitcher.name }, `¡[K.O.] ${pitcher.name} ha sido derrotado! ¡Entra el relevo!`),
          'KO', pitcher.name);
        this.enemyPitcherIndex++;
        if (this.activePitcher) {
          this.logEvent('NEXT_PITCHER',
            _t('match.log_relief', { name: this.activePitcher.name, hp: this.activePitcher.hp, maxHp: this.activePitcher.maxHp }, `⚾ Entra al relevo: ${this.activePitcher.name} (${this.activePitcher.hp}/${this.activePitcher.maxHp} HP)`),
            'PITCHER_ENTER');
        }
        this._checkEndConditions();
      }
      // 3 outs → end inning
      if (this.outs >= 3) {
        this.logEvent('INNING_END',
          _t('sim.inning_end', { inning: this.inning, runs: this.runs }, `--- FIN DE LA ENTRADA ${this.inning} (${this.runs} carreras anotadas) ---`),
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

      const _t = (key, params, fallback) => (typeof window.t === 'function' ? window.t(key, params) : (fallback || key));
      const allPitchersDown = this.enemyPitcherIndex >= this.homeTeam.pitchers.length;
      const teamDead = this.teamHP <= 0;

      if (allPitchersDown) {
        this.winner = 'player';
        this.battleOver = true;
        this.logEvent('END',
          _t('match.log_victory', {}, `🏆 ¡VICTORIA! ¡Has derrotado a toda la rotación de ${this.homeTeam.name}!`),
          'END');
      } else if (teamDead) {
        this.winner = 'pitcher';
        this.battleOver = true;
        this.logEvent('END',
          _t('match.log_defeat', {}, `💀 DERROTA. Tu equipo llegó a 0 HP. Los ponches acabaron con tu alineación.`),
          'END');
      } else if (this.inning > 3) {
        this.winner = 'pitcher';
        this.battleOver = true;
        const remaining = this.homeTeam.pitchers.length - this.enemyPitcherIndex;
        this.logEvent('END',
          _t('sim.match_timeout', { remaining }, `⏱ FIN DE PARTIDO (3 innings). Te faltaron ${remaining} lanzadores por derrotar.`),
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
      const _t = (key, params, fallback) => (typeof window.t === 'function' ? window.t(key, params) : (fallback || key));
      let remainingDmg = dmg;
      while (remainingDmg > 0 && this.activePitcher) {
        const p = this.activePitcher;
        if (p.hp <= 0) {
          this.enemyPitcherIndex++;
          continue;
        }

        if (remainingDmg >= p.hp) {
          const overflow = remainingDmg - p.hp;
          p.hp = 0;
          this.logEvent('KO_PITCHER',
            _t('match.log_ko', { name: p.name }, `[K.O.] ¡${p.name} ha sido derrotado!`),
            'KO', p.name);

          this.enemyPitcherIndex++;
          const nextP = this.activePitcher;
          if (nextP && overflow > 0) {
            // Only half the overflow carries over to the next pitcher
            const carryOver = Math.floor(overflow / 2);
            const residualDmg = Math.min(carryOver, nextP.hp - 1);
            if (residualDmg > 0) {
              nextP.hp = Math.max(1, nextP.hp - residualDmg);
              this.logEvent('RESIDUAL_DMG',
                _t('match.log_residual', { name: nextP.name, dmg: residualDmg, hp: nextP.hp, maxHp: nextP.maxHp }, `⚡ ¡Daño residual! Entra al relevo ${nextP.name} absorbiendo -${residualDmg} HP de impacto (${nextP.hp}/${nextP.maxHp} HP restantes).`),
                'RESIDUAL', nextP.name);
            } else {
              this.logEvent('NEXT_PITCHER',
                _t('match.log_relief', { name: nextP.name, hp: nextP.hp, maxHp: nextP.maxHp }, `Entra al relevo: ${nextP.name} (${nextP.hp}/${nextP.maxHp} HP).`),
                'NEXT', nextP.name);
            }
          } else if (nextP) {
            this.logEvent('NEXT_PITCHER',
              _t('match.log_relief', { name: nextP.name, hp: nextP.hp, maxHp: nextP.maxHp }, `Entra al relevo: ${nextP.name} (${nextP.hp}/${nextP.maxHp} HP).`),
              'NEXT', nextP.name);
          }
          break;
        } else {
          p.hp -= remainingDmg;
          remainingDmg = 0;
        }
      }
    }

    // ── INTERNAL: base-running helpers ──────────────────────────────
    _advanceWalk(batter, doubleAdvance = false) {
      let runs = 0;
      if (doubleAdvance) {
        // Small Ball T3+: existing runners advance 2 bases instead of 1 on this walk
        // (mirrors _advanceSingle's doubleAdvance branch)
        if (this.bases[2]) { runs++; this.bases[2] = null; }
        if (this.bases[1]) { runs++; this.bases[1] = null; }
        if (this.bases[0]) { this.bases[2] = this.bases[0]; this.bases[0] = null; }
        this.bases[0] = batter;
        return runs;
      }
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
    logEvent(playType, playText, eventType, activeBatter = '', teamHpDmg = 0, pitcherDmg = 0, runsThisTurn = 0, didSteal = false) {
      const pitcher = this.activePitcher;
      const ev = {
        playType,
        playText,
        eventType,
        activeBatter,
        runsThisTurn,
        didSteal,
        activePitcher: pitcher ? {
          name:   pitcher.name,
          hp:     pitcher.hp,
          maxHp:  pitcher.maxHp,
          index:  this.enemyPitcherIndex,
          vel:    pitcher.vel,
          stf:    pitcher.stf !== undefined ? pitcher.stf : (pitcher.str !== undefined ? pitcher.str : 40),
          ctl:    pitcher.ctl !== undefined ? pitcher.ctl : (pitcher.ctl_val !== undefined ? pitcher.ctl_val : 40),
          mov:    pitcher.mov !== undefined ? pitcher.mov : (pitcher.grt !== undefined ? pitcher.grt : (pitcher.grt_val !== undefined ? pitcher.grt_val : 50)),
          sta:    pitcher.sta !== undefined ? pitcher.sta : 65,
          role:   pitcher.role || 'SP',
          year:   pitcher.year || pitcher._year,
          era:    pitcher.era,
          team:   pitcher.team,
          rarity: pitcher.rarity,
          grt:    pitcher.grt
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
      const b = calcBoundaries(batter, pitcher, this);
      return {
        batter, pitcher,
        bbEnd:  b.bbEnd,
        soEnd:  b.soEnd,
        outEnd: b.outEnd,
        singleEnd: b.singleEnd,
        doubleEnd: b.doubleEnd,
        tripleEnd: b.tripleEnd,
        isClutchActive: b.isClutchActive,
        clutchActualBoosts: b.clutchActualBoosts
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
          stf:    this.activePitcher.stf !== undefined ? this.activePitcher.stf : (this.activePitcher.str !== undefined ? this.activePitcher.str : 40),
          ctl:    this.activePitcher.ctl !== undefined ? this.activePitcher.ctl : (this.activePitcher.ctl_val !== undefined ? this.activePitcher.ctl_val : 40),
          mov:    this.activePitcher.mov !== undefined ? this.activePitcher.mov : (this.activePitcher.grt !== undefined ? this.activePitcher.grt : (this.activePitcher.grt_val !== undefined ? this.activePitcher.grt_val : 50)),
          sta:    this.activePitcher.sta !== undefined ? this.activePitcher.sta : 65,
          role:   this.activePitcher.role || 'SP',
          year:   this.activePitcher.year || this.activePitcher._year,
          era:    this.activePitcher.era,
          team:   this.activePitcher.team,
          rarity: this.activePitcher.rarity,
          grt:    this.activePitcher.grt
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
