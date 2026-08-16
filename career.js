// ── CAREER MODE (Player) ──────────────────────────────────────────────────
// Multi-season career for a single ballplayer: pick a rookie at a chosen
// difficulty tier, debut in a random real MLB year, then progress season by
// season (1936 -> 1937 -> ...) toward or away from the player's "potential"
// (their peak card from game_cards_pool.js). See CLAUDE.md / plan doc
// "estado-actual-de-baserogue-atomic-dijkstra" (REWORK v2 section) for the
// full conceptual design.
//
// v2 rework: closer to copero.com.ar / El Ídolo — a narrative, decision-
// first career sim instead of a boxscore-accurate one. Each season is 2
// narrative choice-events (card UI, deltas here) + 1 "momento de la
// temporada" resolved with a weighted ROULETTE (not dice) — see
// SEASON_MOMENT_TIERS. Awards are no longer a probability roll against a
// synthetic baseline (that let a .140 AVG season win MVP); they're a real
// RANK against a league of real players from that year (buildSeasonLeague).
// The team you sign with also assigns a projected role (starter/rotation/
// bench, see getProjectedRole) that scales both playing time and growth —
// picking a team is a real development trade-off, not just flavor.
//
// Still deferred (see plan): real aging curves derived from Lahman (a
// hardcoded curve is used for now), Manager mode, NLB.

(function () {
  const SAVE_KEY = 'baserogue_career_save_v1';

  const DIFFICULTY_TIERS = {
    easy: ['Legendary', 'Epic'],
    medium: ['Rare'],
    hard: ['Uncommon'],
    impossible: ['Common'],
    random: null // null = no tier filter, pack mixes all rarities
  };

  const PA_PER_GAME = 4.3; // rough league-average plate appearances per game

  // Pool of narrative choice-event templates — 2 are drawn at random each
  // season (so the same 2 don't show up every year) plus the season-moment
  // roulette always closes out the season. Deltas are deliberately
  // aggressive: this is the ONLY way the player grows (no passive season-end
  // convergence toward potential), so each decision has to visibly matter.
  // Each choice maps to a TARGET OVR DELTA (see distributeOvrDelta), not raw
  // attribute deltas — that's what keeps the growth legible: a "+3" choice
  // always reads as +3 OVR, regardless of where the player sits on ovrOf()'s
  // compressive curve. Bigger/riskier-flavored choices skew higher.
  // stakes ('routine'/'notable', see CAREER_STAKES) tags how big a deal an
  // event reads as — feeds both the choice-card badge (ui.js) and, for
  // situational events, the wheel's size (see CAREER_STAKES below).
  const EVENT_TEMPLATE_POOL = [
    { id: 'preseason_training', stakes: 'routine', choices: { hard: 3, technical: 2, careful: 2 } },
    { id: 'batting_cage', stakes: 'routine', choices: { power_focus: 3, contact_focus: 3, balanced: 2 } },
    { id: 'sprint_drills', stakes: 'routine', choices: { speed_work: 2, agility: 2 } },
    { id: 'film_study', stakes: 'routine', choices: { study_pitchers: 2, study_defense: 2 } },
    { id: 'midseason_slump', stakes: 'notable', choices: { push: 3, patient: 2, rest: 1 } },
    { id: 'clubhouse_leader', stakes: 'notable', choices: { vocal: 2, quiet: 2 } },
    { id: 'contract_pressure', stakes: 'notable', choices: { play_angry: 3, stay_cool: 2 } },
    { id: 'nagging_injury', stakes: 'notable', choices: { play_through: 3, sit_out: 1 } },
    { id: 'hitting_coach', stakes: 'routine', choices: { new_stance: 3, tweak_swing: 2 } },
    { id: 'road_trip', stakes: 'routine', choices: { focus_travel: 2, party_hard: 1 } }
  ];

  /** Relevance tiers threaded through seasonEvents so the presentation
   * layer (choice-card badge, wheel size) can visibly scale with how big a
   * deal something is instead of every event looking the same regardless
   * of stakes. */
  const CAREER_STAKES = { ROUTINE: 'routine', NOTABLE: 'notable', MAJOR: 'major', CRITICAL: 'critical' };
  function getEventStakes(event) {
    if (!event) return CAREER_STAKES.ROUTINE;
    if (event.stakes) return event.stakes;
    if (event.type === 'choice') return (getEventTemplate(event.id) || {}).stakes || CAREER_STAKES.ROUTINE;
    if (event.type === 'situational') return (getSituationalTemplate(event.id) || {}).stakes || CAREER_STAKES.NOTABLE;
    if (event.type === 'roulette') return CAREER_STAKES.MAJOR;
    return CAREER_STAKES.ROUTINE;
  }

  // Choices that trade a bigger short-term upside for a lasting reputation
  // hit (see Career.reputation) — flagged separately from the OVR-target
  // numbers above rather than restructuring EVENT_TEMPLATE_POOL's shape.
  const RISKY_CHOICE_KEYS = new Set([
    'contract_pressure.play_angry',
    'nagging_injury.play_through',
    'road_trip.party_hard',
    'midseason_slump.push'
  ]);
  function isRiskyChoice(eventId, choiceKey) {
    return RISKY_CHOICE_KEYS.has(`${eventId}.${choiceKey}`);
  }

  // Reputation deltas for specific choice picks — independent of the OVR
  // outcome, and doesn't drift back to 50 on its own (see
  // CareerState.nudgeReputation). Only choices that plausibly say something
  // about how a player is perceived get an entry; anything absent is
  // reputation-neutral.
  const REPUTATION_CHOICE_DELTA = {
    'contract_pressure.play_angry': -2,
    'contract_pressure.stay_cool': 1,
    'nagging_injury.play_through': -1,
    'nagging_injury.sit_out': 1,
    'road_trip.party_hard': -3,
    'road_trip.focus_travel': 1,
    'midseason_slump.push': -1,
    'clubhouse_leader.vocal': 3,
    'clubhouse_leader.quiet': 1
  };

  // Wear and tear deltas for specific choice picks — "push through it"
  // options cost real wear, "take care of yourself" options pay it down.
  // Independent of the reputation table above (a choice can move both, one,
  // or neither axis).
  const WEAR_CHOICE_DELTA = {
    'contract_pressure.play_angry': 4,
    'nagging_injury.play_through': 6,
    'nagging_injury.sit_out': -8,
    'road_trip.party_hard': 3,
    'road_trip.focus_travel': -2,
    'midseason_slump.push': 5,
    'midseason_slump.rest': -6,
    'preseason_training.careful': -3
  };

  function getEventTemplate(id) {
    return EVENT_TEMPLATE_POOL.find(e => e.id === id);
  }

  /** Two distinct templates drawn at random from the pool for this season's
   * choice events. */
  function pickSeasonTemplates() {
    const pool = [...EVENT_TEMPLATE_POOL];
    const first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const second = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    return [first.id, second.id];
  }

  // Same tiering pattern Quick Play's Train screen already uses
  // (TRAINING_TIER_CONFIG in ui.js): each choice card rolls a tier
  // independently, so the 3 options on a card aren't all the same flat
  // reward — a card can come up all-Normal, or land a Gold. Rolled once
  // per event when the season is generated (see startSeason), not on every
  // render, so the tiers stay stable while the card is on screen.
  const CARD_TIER_CONFIG = {
    probabilities: { Gold: 0.10, Silver: 0.25, Normal: 0.65 },
    multipliers: { Normal: 1.0, Silver: 1.6, Gold: 2.4 }
  };
  function rollCardTier() {
    const r = Math.random();
    if (r < CARD_TIER_CONFIG.probabilities.Gold) return 'Gold';
    if (r < CARD_TIER_CONFIG.probabilities.Gold + CARD_TIER_CONFIG.probabilities.Silver) return 'Silver';
    return 'Normal';
  }
  /** Rolls a tier for every option of a choice event, once. */
  function rollTiersForChoices(choices) {
    const tiers = {};
    Object.keys(choices).forEach(key => { tiers[key] = rollCardTier(); });
    return tiers;
  }

  // The season's one big moment is a roulette spin across 6 outcome tiers,
  // not a dice-rolled at-bat sequence — weighted by the player's current
  // strength (see getSeasonMomentWeights) but any tier can hit, same as a
  // real roulette. statMod feeds into _sampleLine's era-normalized
  // probability shift; growthScale drives how much the roulette result
  // moves the player's ratings.
  // ovrTarget is the exact OVR swing this tier applies (see applyOvrDelta) —
  // a "Sólida" moment always reads as +2 OVR, a bust always costs OVR, no
  // matter where the player sits on ovrOf()'s curve.
  const SEASON_MOMENT_TIERS = [
    { key: 'nightmare', label: 'Pesadilla', statMod: -0.55, ovrTarget: -3, weightBase: 3 },
    { key: 'poor', label: 'Floja', statMod: -0.22, ovrTarget: -1, weightBase: 6 },
    { key: 'modest', label: 'Discreta', statMod: 0, ovrTarget: 1, weightBase: 8 },
    { key: 'solid', label: 'Sólida', statMod: 0.22, ovrTarget: 2, weightBase: 6 },
    { key: 'great', label: 'Grande', statMod: 0.45, ovrTarget: 4, weightBase: 3 },
    { key: 'historic', label: 'Histórica', statMod: 0.8, ovrTarget: 7, weightBase: 1 }
  ];

  // Situational events: one is drawn per season (in addition to the 2 choice
  // events and the season-moment wheel) — something HAPPENS to the player,
  // resolved with a wheel whose weights shift with their current attributes
  // (not fixed like EVENT_TEMPLATE_POOL). Catalog is meant to keep growing;
  // this is a starting spread across different attribute-driven situations.
  const SITUATIONAL_EVENT_POOL = [
    {
      id: 'slump_watch',
      label: 'Racha',
      stakes: 'notable',
      prompt: 'Llevas varios juegos discretos. La prensa empieza a preguntar.',
      getOutcomes(player) {
        const form = Math.max(15, Math.min(80, (player.con + player.eye) / 2));
        return [
          { key: 'break_out', label: 'Rompes la racha', color: '#10b981', weight: form, ovr: 2 },
          { key: 'stay_same', label: 'Sigues igual', color: '#9ca3af', weight: 100 - form, ovr: 0 }
        ];
      }
    },
    {
      id: 'ace_matchup',
      label: 'Duelo contra un as',
      stakes: 'major',
      // Prompt/rival identity is resolved dynamically (see
      // Career.getAceMatchupContext) against a real opposing pitcher pulled
      // from OpponentsDatabase[year] instead of a generic "best pitcher in
      // the league" — falls back to this generic prompt if no real pitcher
      // can be resolved (e.g. no team/year context yet).
      prompt: 'Te toca enfrentar al mejor lanzador de la liga esta semana, con todos los ojos encima.',
      getOutcomes(player, event) {
        const pitcher = event && event.rivalContext && event.rivalContext.pitcher;
        // Real pitcher stf/ctl (see Career.getRivalTeamAndAce) nudges the
        // odds when a real rival is attached — falls back to the plain
        // player-only formula otherwise.
        const stfPenalty = pitcher && typeof pitcher.stf === 'number' ? (pitcher.stf - 70) * 0.15 : 0;
        const ctlPenalty = pitcher && typeof pitcher.ctl === 'number' ? (pitcher.ctl - 70) * 0.1 : 0;
        const edge = Math.max(15, Math.min(65, player.con - 50 + 40 - stfPenalty));
        const strikeoutRisk = Math.max(10, Math.min(35, 50 - player.eye / 2 + stfPenalty - ctlPenalty));
        const clutch = Math.max(10, 100 - edge - strikeoutRisk);
        return [
          { key: 'clutch_hit', label: 'Batazo oportuno', color: '#f59e0b', weight: clutch, ovr: 3, rep: 2 },
          { key: 'out', label: 'Fallas en el momento', color: '#9ca3af', weight: edge, ovr: 0 },
          { key: 'strikeout', label: 'Te ponchas', color: '#ef4444', weight: strikeoutRisk, ovr: -2, rep: -1 }
        ];
      }
    },
    {
      id: 'endurance_test',
      label: 'Prueba de resistencia',
      stakes: 'notable',
      prompt: 'Doble jornada + viaje largo sin descanso — ¿aguanta el cuerpo?',
      getOutcomes(player) {
        const stamina = Math.max(15, Math.min(75, (player.def + player.spd) / 2));
        return [
          { key: 'hold_up', label: 'Aguantas el ritmo', color: '#10b981', weight: stamina, ovr: 1 },
          { key: 'wear_down', label: 'Te desgastas', color: '#ef4444', weight: 100 - stamina, ovr: -1 }
        ];
      }
    },
    {
      id: 'media_pressure',
      label: 'Presión mediática',
      stakes: 'notable',
      prompt: 'Se habla mucho de ti esta semana — contrato, comparaciones, todo.',
      getOutcomes(player) {
        const composure = Math.max(15, Math.min(75, player.eye));
        return [
          { key: 'thrive', label: 'Rindes bajo presión', color: '#10b981', weight: composure, ovr: 2, rep: 2 },
          { key: 'freeze', label: 'Te bloqueas', color: '#ef4444', weight: 100 - composure, ovr: -1, rep: -2 }
        ];
      }
    },
    {
      id: 'defensive_moment',
      label: 'Jugada decisiva',
      stakes: 'notable',
      prompt: 'Un batazo difícil te obliga a definir el partido con el guante.',
      getOutcomes(player) {
        const skill = Math.max(15, Math.min(75, player.def));
        return [
          { key: 'spectacular', label: 'Atrapada espectacular', color: '#3b82f6', weight: skill, ovr: 2 },
          { key: 'error', label: 'Error costoso', color: '#ef4444', weight: 100 - skill, ovr: -2 }
        ];
      }
    }
  ];

  function getSituationalTemplate(id) {
    return SITUATIONAL_EVENT_POOL.find(e => e.id === id);
  }

  // ── CAREER CROSSROADS — a Copero-style third layer, separate in spirit
  // from EVENT_TEMPLATE_POOL (frequent, low-weight training cards) and
  // SITUATIONAL_EVENT_POOL (one wheel spin/season). These are occasional,
  // high-weight, single binary decisions that move MULTIPLE axes at once
  // (OVR, reputation, wear, cash — not just OVR), presented full-screen
  // with no tier/rarity, because it's a real life decision, not a purchase.
  // See getCrossroadsTriggerChance for how rarely these actually fire.
  const CAREER_CROSSROADS_POOL = [
    {
      id: 'mentor_rookie',
      icon: '🧑‍🏫',
      title: 'MENTOR DE UN ROOKIE',
      prompt: 'El equipo te pide ser mentor de un prospecto joven esta temporada.',
      options: {
        accept: { label: 'Aceptar — menos foco en tu juego', ovr: -1, reputation: 6, wear: -3, desc: 'Le bajas el ritmo a tu propio juego, pero el vestuario y la directiva lo valoran.' },
        decline: { label: 'Declinar — enfocarte en ti', ovr: 0, reputation: -1, wear: 0, desc: 'Sigues con tu rutina normal, sin ganar ni perder demasiado.' }
      }
    },
    {
      id: 'media_extension_question',
      icon: '🎙️',
      title: 'PREGUNTA DIRECTA EN CONFERENCIA',
      prompt: 'Un periodista te pregunta en vivo si el equipo te va a extender el contrato.',
      options: {
        confident: { label: 'Contestar con seguridad', ovr: 0, reputation: 4, wear: 0, desc: 'Te arriesgaste con la respuesta — la afición y la prensa lo valoran.' },
        dodge: { label: 'Esquivar la pregunta', ovr: 0, reputation: 0, wear: 0, desc: 'Jugada segura, sin repercusión de ningún lado.' }
      }
    },
    {
      id: 'allstar_with_injury',
      icon: '⭐',
      title: 'JUEGO DE ESTRELLAS CON MOLESTIA',
      prompt: 'Te convocan al Juego de Estrellas, pero arrastras una molestia física real.',
      options: {
        play: { label: 'Jugar igual', ovr: 1, reputation: 8, wear: 10, desc: 'El prestigio vale la pena — pero el cuerpo lo paga.' },
        decline: { label: 'Declinar la convocatoria', ovr: 0, reputation: -3, wear: -4, desc: 'Cuidas el cuerpo, aunque la afición se lo toma a mal.' }
      }
    },
    {
      id: 'turning_30_workload',
      icon: '🎂',
      title: 'CUMPLES 30',
      prompt: 'El cuerpo técnico te pregunta si quieres bajar la carga de partidos de aquí en adelante.',
      options: {
        reduce: { label: 'Bajar la carga', ovr: 0, reputation: -2, wear: -15, desc: 'Vas a durar más, aunque el equipo lo nota menos presente.' },
        keep: { label: 'Seguir al mismo ritmo', ovr: 1, reputation: 2, wear: 8, desc: 'Sigues siendo una pieza clave — al precio de siempre.' }
      }
    },
    {
      id: 'trade_rumor',
      icon: '📰',
      title: 'RUMOR DE TRADE',
      prompt: 'Se filtra que tu nombre está en conversaciones de trade.',
      options: {
        push: { label: 'Pedir que te definan la situación', ovr: 0, reputation: -4, cash: 30, desc: 'Presionas por claridad y mejor trato — no cae bien en la gerencia.' },
        quiet: { label: 'No decir nada públicamente', ovr: 0, reputation: 2, cash: 0, desc: 'Mantienes el perfil bajo — el club lo valora.' }
      }
    },
    {
      id: 'image_investment',
      icon: '💼',
      title: 'OFERTA DE UN REPRESENTANTE',
      prompt: 'Un representante te propone invertir en tu imagen pública.',
      options: {
        invest: { label: 'Invertir ($50K)', ovr: 0, reputation: 10, cash: -50, desc: 'Un golpe al bolsillo, pero tu imagen mejora de verdad.' },
        skip: { label: 'Declinar', ovr: 0, reputation: 0, cash: 0, desc: 'Ahorras el dinero, sin cambios.' }
      }
    }
  ];

  function getCrossroadsTemplate(id) {
    return CAREER_CROSSROADS_POOL.find(e => e.id === id);
  }

  // Team role assigned when signing with a club — a real development
  // trade-off (see plan doc section 4.4), not flavor text: starters play
  // more (bigger stat sample, feeds the league leaderboard harder) and grow
  // faster; bench players are the "safe" slow-burn path.
  const ROLE_PA_MULTIPLIER = { starter: 1.0, rotation: 0.65, bench: 0.35 };
  const ROLE_GROWTH_MULTIPLIER = { starter: 1.15, rotation: 1.0, bench: 0.75 };

  // Rough historical offense levels per era, used to normalize the aggregate
  // stat sampling so a given attribute spread "feels" like its year (e.g. a
  // Deadball-era season shouldn't produce Steroid-era home run totals).
  const ERA_OFFENSE = [
    { max: 1900, avg: 0.265, hrPer600: 8, bb: 0.07 },
    { max: 1919, avg: 0.250, hrPer600: 6, bb: 0.07 },
    { max: 1941, avg: 0.280, hrPer600: 20, bb: 0.09 },
    { max: 1960, avg: 0.260, hrPer600: 22, bb: 0.10 },
    { max: 1976, avg: 0.250, hrPer600: 20, bb: 0.09 },
    { max: 1993, avg: 0.260, hrPer600: 24, bb: 0.09 },
    { max: 2005, avg: 0.270, hrPer600: 32, bb: 0.09 },
    { max: 2015, avg: 0.255, hrPer600: 30, bb: 0.08 },
    { max: 9999, avg: 0.245, hrPer600: 34, bb: 0.085 }
  ];
  function getEraOffense(year) {
    const y = parseInt(year, 10);
    return ERA_OFFENSE.find(e => y <= e.max) || ERA_OFFENSE[ERA_OFFENSE.length - 1];
  }

  /** Real MLB regular-season length by year (simplified: ignores strike-
   * shortened years like 1981/1994/1995/2020, which would need their own
   * per-year table). 154 games was standard through 1960 (AL) / 1961 (NL);
   * 162 games from the 1961-62 expansions onward. */
  function getSeasonGameCount(year) {
    const y = parseInt(year, 10);
    if (y < 1904) return 140;
    if (y <= 1960) return 154;
    return 162;
  }

  /** Career mode is built on the Lahman/MLB batter pool — a player can
   * never end up drafted onto, offered by, or facing a Negro League team
   * (segregation-era, no crossover in this data), which would break the
   * historical frame. OpponentsDatabase teams carry a `league` field; AL/NL
   * are the modern leagues, FL is the Federal League (1914-15, a real
   * third recognized "major league" — kept). Everything else in this data
   * (NNL/NN2/NSL/ECL/EWL/ANL/IND/INT/NAC/NAL/EAS/WES) is confirmed Negro
   * League / pre-Negro-League Black baseball by its real team names
   * (Homestead Grays, Kansas City Monarchs-era, Lincoln Giants, Cuban
   * Stars, Chicago Leland Giants, etc.) — excluded everywhere Career pulls
   * a team list. */
  function isCareerEligibleTeam(team) {
    return !!team && (team.league === 'AL' || team.league === 'NL' || team.league === 'FL');
  }

  /** Same formula as ui.js's batter getPlayerOvr branch, kept independent so
   * career.js doesn't depend on ui.js load order. */
  function ovrOf(p) {
    if (!p) return 60;
    if (typeof p.ovr === 'number') return Math.round(p.ovr);
    const con = p.con || 50, pwr = p.pwr || 50, eye = p.eye || 50, spd = p.spd || 50, def = p.def || 50;
    const raw = con * 0.35 + pwr * 0.30 + def * 0.15 + eye * 0.10 + spd * 0.10;
    if (raw <= 30) return Math.round(50 + (raw / 30) * 10);
    if (raw <= 45) return Math.round(60 + ((raw - 30) / 15) * 9);
    if (raw <= 58) return Math.round(70 + ((raw - 45) / 13) * 8);
    if (raw <= 74) return Math.round(79 + ((raw - 58) / 16) * 8);
    if (raw <= 85) return Math.round(88 + ((raw - 74) / 11) * 6);
    return Math.round(95 + Math.min(4, ((raw - 85) / 18) * 4));
  }

  // ── OVR-targeted growth ────────────────────────────────────────────────
  // ovrOf()'s piecewise curve has a different (and mostly low) slope in
  // every band, so moving attributes by a fixed amount produces an
  // inconsistent, hard-to-read OVR change — the same +8 attribute swing can
  // read as +1 OVR in one band and +3 in another. Growth events instead
  // target an exact OVR delta; this converts that target into the raw-point
  // move needed at the player's CURRENT position on the curve, then splits
  // that raw budget across the 5 attributes in the same proportions ovrOf()
  // combines them — so the OVR the player sees moves by the designed
  // amount, not whatever the curve happens to produce.
  const OVR_ATTR_WEIGHTS = { con: 0.35, pwr: 0.30, def: 0.15, eye: 0.10, spd: 0.10 };
  function computeRaw(attrs) {
    const con = attrs.con || 50, pwr = attrs.pwr || 50, eye = attrs.eye || 50, spd = attrs.spd || 50, def = attrs.def || 50;
    return con * OVR_ATTR_WEIGHTS.con + pwr * OVR_ATTR_WEIGHTS.pwr + def * OVR_ATTR_WEIGHTS.def + eye * OVR_ATTR_WEIGHTS.eye + spd * OVR_ATTR_WEIGHTS.spd;
  }
  function localOvrSlope(raw) {
    if (raw <= 30) return 10 / 30;
    if (raw <= 45) return 9 / 15;
    if (raw <= 58) return 8 / 13;
    if (raw <= 74) return 8 / 16;
    if (raw <= 85) return 6 / 11;
    return 4 / 18;
  }
  /** Distributes a target OVR delta across con/pwr/eye/spd/def, weighted the
   * same way ovrOf() combines them, at the given attrs' current position on
   * the curve. Pure — doesn't mutate anything, used both to apply growth and
   * to preview it before the player commits to a choice. */
  function distributeOvrDelta(attrs, targetOvrDelta) {
    const raw = computeRaw(attrs);
    const slope = localOvrSlope(raw);
    const rawDelta = targetOvrDelta / slope;
    // raw = sum(attr[k] * weight[k]), so moving raw by rawDelta via deltas
    // proportional to weight[k] only contributes rawDelta * weight[k]^2 each —
    // scale by 1/sum(weight^2) so sum(delta[k] * weight[k]) actually equals
    // rawDelta instead of silently under-shooting it (~4x, previously).
    const weightSqSum = Object.values(OVR_ATTR_WEIGHTS).reduce((s, w) => s + w * w, 0);
    const scale = rawDelta / weightSqSum;
    const delta = {};
    Object.keys(OVR_ATTR_WEIGHTS).forEach(k => {
      delta[k] = Math.round(scale * OVR_ATTR_WEIGHTS[k]);
    });
    return delta;
  }

  class CareerState {
    constructor() {
      this.reset();
    }

    reset() {
      this.active = false;
      this.difficulty = null;
      this.player = null;      // mutable rookie card, attributes evolve over the career
      this.potential = null;   // original peak card (ceiling reference), untouched
      this.debutYear = null;
      this.currentYear = null;
      this.team = null;        // team object from OpponentsDatabase[year][tier]
      this.role = null;        // 'starter'|'rotation'|'bench' — see getProjectedRole
      this.contractYearsLeft = null; // years remaining on the current deal — see setTeam
      this.contractValue = null;     // abstract $K figure, flavor only
      this.seasonEvents = [];  // this season's 3 events (2 choices + 1 season-moment roulette)
      this._signatureLine = null; // stat line from the season-moment roulette result
      this.seasonStats = null; // final season totals — only set once finalizeSeason() runs
      this.seasonSeriesRecord = null;
      this.seasonGameCount = null;   // real MLB season length for the current year (154/162)
      this.seasonRatingDelta = null; // live in-season rating growth from this season's events
      this.seasonHistory = []; // compact per-year summaries (includes leagueTable/leagueRank)
      this.playoffs = null; // { rounds:[{key,label,resolved,won}], active } — see startPlayoffs
      this.awards = [];
      this.hofScore = 0;
      this.retired = false;
      this.hofResult = null; // { votePct, votesFor, votesTotal, inducted } — set by resolveHofVote() at retirement

      // Reputation: a second, persistent axis of consequence separate from
      // OVR — certain choice/situational outcomes nudge it and it never
      // drifts back to 50 on its own (see nudgeReputation). Colors future
      // contract offers (getContractOffers) and role assignment
      // (getProjectedRole).
      this.reputation = 50;
      // Real spendable balance (distinct from contractValue, the season's
      // salary RATE) — paid out at season close, spent in the Career shop
      // (see getShopCatalog/purchaseShopItem).
      this.cash = 0;
      this.nemesis = null; // { teamID, name, wins, losses } — see getAceMatchupContext/recordNemesisResult
      this.shopEffects = {}; // { effectKey: seasonsRemaining } — active purchased perks, see applyShopPurchaseEffect

      // Wear and tear: 0-100, never auto-decays — persistent physical cost
      // of playing time, forcing choices, and age. High wear cuts into
      // growth (see getEffectiveGrowthMultiplier) and, past 30, worsens the
      // age-decline curve and injury risk. Resting brings it back down.
      this.wear = 0;

      // Offseason (between seasons, before the next startSeason()): contract
      // decision + one wheel-resolved offseason event (see
      // getOffseasonEventOutcomes — winter ball is just one possible wedge).
      this.offseasonPending = false;
      this.contractResolved = false;
      this.offseasonEventResolved = false;
      this._pendingOffseasonOutcomes = null;
      this.pendingInjuryPenalty = null; // {attr, amount} applied at the top of next startSeason()
    }

    getRookiePool() {
      // Batters only for now — pitchers pool excluded until career mode has a
      // pitching-specific rookie/aging model (see plan doc, "diferido").
      return (window.PlayersDB && (window.PlayersDB.LAHMAN_POOL || window.PlayersDB.PLAYERS_POOL)) || window.LAHMAN_POOL || [];
    }

    /** Returns 3 distinct candidate cards for the given difficulty's tier. */
    getRookiePicks(difficulty) {
      const pool = this.getRookiePool();
      const tiers = DIFFICULTY_TIERS[difficulty];
      const filtered = tiers ? pool.filter(p => tiers.includes(p.rarity || 'Common')) : pool;
      const source = filtered.length >= 3 ? filtered : pool;

      const picks = [];
      const used = new Set();
      let guard = 0;
      while (picks.length < 3 && guard < 1000 && used.size < source.length) {
        guard++;
        const cand = source[Math.floor(Math.random() * source.length)];
        if (!cand || used.has(cand.name)) continue;
        used.add(cand.name);
        picks.push(cand);
      }
      return picks;
    }

    /** Rookies start as a real long-shot — roughly 50-55 OVR regardless of
     * how good their potential card is — not a flat percentage of the peak
     * (which let high-tier picks debut already strong). The potential
     * card's own attribute lean is kept as a light bias, so a rookie whose
     * ceiling is a power hitter debuts relatively more power-leaning than
     * contact, just low across the board; everything is earned back up
     * through played events, not given at the start. */
    /** `ageBonus` (0-6, see getDebutPathwayOptions) shifts the rookie's
     * starting attribute floor up — debuting later (more college) trades a
     * few years of career runway for a real starting-level boost, resolved
     * by the debut-pathway wheel before this is called. */
    _buildRookieFromPeak(card, ageBonus = 0, age = 19) {
      const clone = { ...card };
      const attrKeys = ['con', 'pwr', 'eye', 'spd', 'def'];
      attrKeys.forEach(k => {
        const potVal = typeof card[k] === 'number' ? card[k] : 50;
        const lean = (potVal - 50) / 50; // -1..+1, the potential's own attribute shape
        const base = 14 + lean * 8 + ageBonus;
        const noise = Math.random() * 8 - 4;
        clone[k] = Math.max(10, Math.min(40, Math.round(base + noise)));
      });
      clone.careerAge = age;
      // The pool card carries a precomputed .ovr from its peak season — ovrOf()
      // returns that stale value first if it's still present, so it must be
      // cleared before recomputing from the just-scaled-down attributes.
      delete clone.ovr;
      clone.ovr = ovrOf(clone);
      return clone;
    }

    /** The 4 debut-pathway wheel segments (see 12.3 in the design doc) —
     * a real trade-off, not just flavor: debuting straight out of high
     * school starts younger with more runway but a lower floor; more years
     * of college trades runway for a real starting-attribute boost. Equal
     * weights — this is a life-path reveal, not a rigged wheel. */
    getDebutPathwayOptions() {
      return [
        { key: 'high_school', label: 'Directo de high school', age: 19, ageBonus: 0, color: '#64748b', desc: 'Empiezas 3 años más joven, con más margen para crecer — pero más novato.' },
        { key: 'junior_college', label: 'Junior college (2 años)', age: 20, ageBonus: 2, color: '#3b82f6', desc: 'Un poco más de nivel de arranque, un año menos de desarrollo por delante.' },
        { key: 'college_3', label: 'Universidad (3 años)', age: 21, ageBonus: 4, color: '#10b981', desc: 'Llegas más formado, con menos años de carrera por delante.' },
        { key: 'college_4', label: 'Universidad (4 años)', age: 22, ageBonus: 6, color: '#f59e0b', desc: 'El mejor nivel de arranque — pero empiezas con menos carrera por delante.' }
      ];
    }

    /** Builds the actual rookie player from the wheel's result — called
     * once, right after the debut-pathway wheel resolves. */
    applyDebutPathway(pathwayKey) {
      const options = this.getDebutPathwayOptions();
      const chosen = options.find(o => o.key === pathwayKey) || options[0];
      this.player = this._buildRookieFromPeak(this.potential, chosen.ageBonus, chosen.age);
      this.save();
      return chosen;
    }

    startCareer(difficulty, peakCard) {
      this.reset();
      this.active = true;
      this.difficulty = difficulty;
      this.potential = peakCard;
      // this.player is built once the debut-pathway wheel resolves (see
      // applyDebutPathway), not here — the chosen pathway shapes it.
      this.save();
    }

    setDebutYear(year) {
      this.debutYear = year;
      this.currentYear = year;
      this.save();
    }

    /** Signs with `team` for `years` (1-4, random if omitted) at `value`
     * (abstract $K figure, estimated from OVR/team quality if omitted).
     * Called at the initial draft and whenever a contract offer is
     * accepted — NOT on every incidental team reference, so this is exactly
     * "you just signed a deal". */
    setTeam(team, years, value) {
      this.team = team;
      this.role = this.getProjectedRole(team);
      this.contractYearsLeft = typeof years === 'number' ? years : (1 + Math.floor(Math.random() * 4));
      this.contractValue = typeof value === 'number' ? value : this._estimateContractValue(team);
      this.save();
    }

    _estimateContractValue(team) {
      const ovr = this.player ? (this.player.ovr || 55) : 55;
      const teamFactor = team && typeof team.win_pct === 'number' ? (0.7 + team.win_pct) : 1.0;
      return Math.round(Math.max(50, (ovr - 40) * 20) * teamFactor / 10) * 10; // abstract $K, flavor only
    }

    _emptyStatLine() {
      return { PA: 0, AB: 0, H: 0, HR: 0, '2B': 0, '3B': 0, BB: 0, K: 0, SB: 0, R: 0, RBI: 0 };
    }

    // ── ROLE: what a team offer actually means for development ───────────
    /** Compares the player's OVR against the team's real OVR (already in
     * OpponentsDatabase) to project starter/rotation/bench — a rookie will
     * almost always project bench/rotation on a good team, forcing an actual
     * choice between playing time and prestige. */
    getProjectedRole(team) {
      if (!team) return 'rotation';
      const teamOvr = typeof team.ovr === 'number' ? team.ovr : 80;
      const playerOvr = this.player ? (this.player.ovr || 55) : 55;
      // Reputation nudges the OVR gap a manager will tolerate for a starting
      // job — a well-regarded player (reputation > 50) edges into a starter
      // role at a slightly worse gap; a poorly-regarded one needs a bigger
      // edge to avoid the bench.
      const repAdjust = ((this.reputation != null ? this.reputation : 50) - 50) * 0.15;
      const diff = playerOvr - teamOvr + repAdjust;
      if (diff >= -8) return 'starter';
      if (diff >= -20) return 'rotation';
      return 'bench';
    }

    // ── SEASON: 2 choice-events + 1 season-moment roulette, then the rest
    // of the season resolves instantly in the background. ────────────────
    startSeason() {
      const year = this.currentYear;

      // A winter league injury (see resolveWinterLeague) costs the player
      // a chunk of one attribute for this season only.
      if (this.pendingInjuryPenalty) {
        const { attr, amount } = this.pendingInjuryPenalty;
        if (typeof this.player[attr] === 'number') {
          this.player[attr] = Math.max(10, this.player[attr] - amount);
          delete this.player.ovr;
          this.player.ovr = ovrOf(this.player);
        }
        this.pendingInjuryPenalty = null;
      }

      this.seasonGameCount = getSeasonGameCount(year);
      this.seasonRatingDelta = { con: 0, pwr: 0, eye: 0, spd: 0, def: 0 };
      this._signatureLine = null;
      this.seasonStats = null;
      this.seasonSeriesRecord = null;
      // Role is locked in for the season based on the team at season start.
      this.role = this.getProjectedRole(this.team);
      this._ovrAtSeasonStart = this.player.ovr;

      const [templateA, templateB] = pickSeasonTemplates();
      const situational = SITUATIONAL_EVENT_POOL[Math.floor(Math.random() * SITUATIONAL_EVENT_POOL.length)];
      const situationalEvent = { id: situational.id, type: 'situational', resolved: false, stakes: situational.stakes };
      // ace_matchup gets a real opposing team/pitcher attached at creation
      // time (not resolve time) so the prompt can name them before the
      // player even spins — see getRivalTeamAndAce/Career.nemesis.
      if (situational.id === 'ace_matchup') {
        situationalEvent.rivalContext = this.getRivalTeamAndAce(this.team ? this.team.teamID : null);
      }
      this.seasonEvents = [
        { id: templateA, type: 'choice', resolved: false, stakes: getEventTemplate(templateA).stakes, tiers: rollTiersForChoices(this.getChoiceEventOptions(templateA)) },
        { id: templateB, type: 'choice', resolved: false, stakes: getEventTemplate(templateB).stakes, tiers: rollTiersForChoices(this.getChoiceEventOptions(templateB)) },
        situationalEvent,
        { id: 'season_moment', type: 'roulette', resolved: false, stakes: CAREER_STAKES.MAJOR }
      ];

      // Career Crossroads (see CAREER_CROSSROADS_POOL) — occasional, not
      // every season, so when one lands it reads as a real moment, Copero-
      // style. Placed first so the season opens with the big decision
      // before the routine training cards.
      if (Math.random() < this.getCrossroadsTriggerChance()) {
        const template = CAREER_CROSSROADS_POOL[Math.floor(Math.random() * CAREER_CROSSROADS_POOL.length)];
        this.seasonEvents.unshift({ id: template.id, type: 'crossroads', resolved: false, stakes: CAREER_STAKES.MAJOR });
      }
      this.save();
    }

    /** How likely a Career Crossroads decision is to appear this season —
     * base rate plus milestone bumps (contract about to expire, turning 30,
     * coming off a season with no awards/playoffs) so they cluster around
     * moments that would plausibly prompt a real decision, not pure noise. */
    getCrossroadsTriggerChance() {
      let chance = 0.35;
      if ((this.contractYearsLeft || 0) <= 1) chance += 0.3;
      if (this.player && this.player.careerAge === 30) chance += 0.25;
      const lastSeason = this.seasonHistory[this.seasonHistory.length - 1];
      if (lastSeason && !lastSeason.playoffQualified && (!lastSeason.awards || lastSeason.awards.length === 0)) chance += 0.2;
      return Math.min(0.9, chance);
    }

    getCrossroadsOptions(eventId) {
      const template = getCrossroadsTemplate(eventId);
      return template ? template.options : {};
    }

    resolveCrossroadsEvent(eventId, choiceKey) {
      const event = this.seasonEvents.find(e => e.id === eventId);
      if (!event || event.resolved) return null;
      const options = this.getCrossroadsOptions(eventId);
      const chosen = options[choiceKey];
      if (!chosen) return null;

      let result = { applied: {}, ovrDelta: 0 };
      if (chosen.ovr) result = this.applyOvrDelta(chosen.ovr);
      this.nudgeReputation(chosen.reputation || 0);
      this.nudgeWear(chosen.wear || 0);
      if (chosen.cash) this.cash = Math.max(0, (this.cash || 0) + chosen.cash);

      event.resolved = true;
      event.choiceMade = choiceKey;
      this.save();
      return {
        chosen,
        ovrDelta: result.ovrDelta,
        reputationDelta: chosen.reputation || 0,
        wearDelta: chosen.wear || 0,
        cashDelta: chosen.cash || 0
      };
    }

    /** Picks a real opposing team (and its best pitcher, if the data has
     * one) from the current year's league — once Career.nemesis is locked
     * in, mostly re-draws that same team (when they exist that year) so the
     * head-to-head record actually accumulates instead of every encounter
     * being a new stranger. Returns null if no league data is loaded yet. */
    getRivalTeamAndAce(excludeTeamID) {
      const db = window.OpponentsDatabase || {};
      const yearData = db[this.currentYear] || db[String(this.currentYear)];
      if (!yearData) return null;
      const all = [];
      ['low', 'mid', 'high'].forEach(tier => { if (Array.isArray(yearData[tier])) all.push(...yearData[tier]); });
      let candidates = all.filter(t => t.teamID !== excludeTeamID && isCareerEligibleTeam(t));
      if (!candidates.length) return null;
      if (this.nemesis && Math.random() < 0.7) {
        const nemesisTeam = candidates.find(t => t.teamID === this.nemesis.teamID);
        if (nemesisTeam) candidates = [nemesisTeam];
      }
      const team = candidates[Math.floor(Math.random() * candidates.length)];
      let pitcher = null;
      if (Array.isArray(team.pitchers) && team.pitchers.length) {
        pitcher = team.pitchers.reduce((best, p) => (!best || (p.ovr || 0) > (best.ovr || 0)) ? p : best, null);
      }
      return { teamID: team.teamID, teamName: team.name, pitcher };
    }

    /** Weighted wheel outcomes for a situational event, computed from the
     * player's CURRENT attributes — same player, same event, different
     * odds depending on their form. */
    getSituationalOutcomes(eventId) {
      const template = getSituationalTemplate(eventId);
      if (!template) return [];
      const event = this.seasonEvents.find(e => e.id === eventId);
      return template.getOutcomes(this.player, event);
    }

    resolveSituationalEvent(eventId, outcomeKey) {
      const event = this.seasonEvents.find(e => e.id === eventId);
      if (!event || event.resolved) return null;
      const outcomes = this.getSituationalOutcomes(eventId);
      const outcome = outcomes.find(o => o.key === outcomeKey) || outcomes[0];
      const result = this.applyOvrDelta(outcome.ovr);
      this.nudgeReputation(outcome.rep || 0);
      // ace_matchup builds/feeds the nemesis thread: the first real rival
      // encountered locks in as Career.nemesis, and later encounters against
      // the same team (getRivalTeamAndAce re-draws them ~70% of the time
      // once locked in) accumulate a real head-to-head record.
      if (eventId === 'ace_matchup' && event.rivalContext) {
        const won = outcome.key === 'clutch_hit';
        if (!this.nemesis) this.nemesis = { teamID: event.rivalContext.teamID, name: event.rivalContext.teamName, wins: 0, losses: 0 };
        if (this.nemesis.teamID === event.rivalContext.teamID) {
          if (won) this.nemesis.wins++; else this.nemesis.losses++;
        }
      }
      event.resolved = true;
      event.outcomeKey = outcomeKey;
      this.save();
      return { outcome, delta: result.applied, ovrDelta: result.ovrDelta };
    }

    _findTeamInYear(teamID, year) {
      const db = window.OpponentsDatabase || {};
      const yearData = db[year] || db[String(year)];
      if (!yearData || !teamID) return null;
      for (const tier of ['low', 'mid', 'high']) {
        const list = yearData[tier];
        if (Array.isArray(list)) {
          const found = list.find(t => t.teamID === teamID && isCareerEligibleTeam(t));
          if (found) return found;
        }
      }
      return null;
    }

    // ── OFFSEASON: contract decision + optional winter league ────────────
    /** Current team's next-year incarnation (may not exist — relocated,
     * dissolved franchise, etc.) plus 2 free-agent offers from other real
     * teams that year. */
    getContractOffers() {
      const year = this.currentYear;
      const db = window.OpponentsDatabase || {};
      const yearData = db[year] || db[String(year)];
      const byTier = { low: [], mid: [], high: [] };
      if (yearData) {
        ['low', 'mid', 'high'].forEach(tier => {
          if (Array.isArray(yearData[tier])) byTier[tier] = yearData[tier].filter(isCareerEligibleTeam);
        });
      }
      const allTeams = [...byTier.low, ...byTier.mid, ...byTier.high];
      const current = this.team ? this._findTeamInYear(this.team.teamID, year) : null;

      // Reputation biases which tier of team is more likely to come
      // knocking — a well-regarded player draws more interest from top
      // clubs, a poorly-regarded one mostly hears from weaker ones. Doesn't
      // change ROLE (see getProjectedRole) — just which teams show up here.
      // An agent perk (see getShopCatalog) pushes offers up a bracket on
      // top of whatever reputation already earned — stacks with, doesn't
      // replace, the reputation bias.
      const hasAgent = (this.shopEffects && this.shopEffects.agent > 0);
      const rep = (this.reputation != null ? this.reputation : 50) + (hasAgent ? 20 : 0);
      const tierWeights = rep >= 65 ? { low: 0.15, mid: 0.35, high: 0.50 }
        : rep <= 35 ? { low: 0.50, mid: 0.35, high: 0.15 }
        : { low: 0.30, mid: 0.40, high: 0.30 };
      const pickFromTiers = (exclude) => {
        const pool = [];
        Object.keys(tierWeights).forEach(tier => {
          const list = byTier[tier].filter(t => !exclude.has(t.teamID) && (!current || t.teamID !== current.teamID));
          const copies = Math.max(1, Math.round(tierWeights[tier] * 10));
          list.forEach(t => { for (let i = 0; i < copies; i++) pool.push(t); });
        });
        if (!pool.length) {
          const fallback = allTeams.filter(t => !exclude.has(t.teamID) && (!current || t.teamID !== current.teamID));
          return fallback.length ? fallback[Math.floor(Math.random() * fallback.length)] : null;
        }
        return pool[Math.floor(Math.random() * pool.length)];
      };
      const usedIds = new Set();
      const offerA = pickFromTiers(usedIds);
      if (offerA) usedIds.add(offerA.teamID);
      const offerB = pickFromTiers(usedIds);

      // Each offer gets its own pre-rolled duration (1-4 years), shown on the
      // card before it's picked, so resolveContract can sign for exactly
      // what was promised.
      const withOffer = (team) => team ? { ...team, _offeredYears: 1 + Math.floor(Math.random() * 4) } : null;
      return { current: withOffer(current || (allTeams[0] || null)), offerA: withOffer(offerA), offerB: withOffer(offerB) };
    }

    resolveContract(choice, offers) {
      const chosen = choice === 'offerA' ? (offers.offerA || offers.current)
        : choice === 'offerB' ? (offers.offerB || offers.current)
        : (offers.current || this.team);
      this.setTeam(chosen, chosen ? chosen._offeredYears : null);
      this.contractResolved = true;
      this.save();
    }

    /** What happens in the offseason (winter ball, rest, an ad deal, a minor
     * injury...) is NOT a yes/no toggle available every year — it's one of
     * several possibilities, resolved with a wheel, that together decide how
     * next season starts. Winter league risk/reward is just one wedge among
     * several, not a standing option. */
    getOffseasonEventOutcomes() {
      const attrs = ['con', 'pwr', 'eye', 'spd', 'def'];
      const attr = attrs[Math.floor(Math.random() * attrs.length)];
      // A physio perk (see getShopCatalog) softens winter-ball injury risk —
      // both the chance it's even offered as an outcome weight and how much
      // it costs when it happens.
      const hasPhysio = (this.shopEffects && this.shopEffects.physio > 0);
      // High wear raises real injury risk on top of the physio perk's
      // discount — a worn-down body going into winter ball is genuinely
      // more likely to break down.
      const wear = this.wear || 0;
      const wearInjuryBump = wear > 60 ? Math.round((wear - 60) / 5) : 0;
      return [
        { key: 'winter_ball_boost', label: 'Liga invernal — te salió bien', color: '#10b981', weight: 18, ovr: 2, attr },
        { key: 'winter_ball_injury', label: 'Liga invernal — te lesionaste', color: '#ef4444', weight: (hasPhysio ? 5 : 10) + wearInjuryBump, injuryAttr: attr, injuryAmount: (hasPhysio ? 2 : 3) + Math.floor(Math.random() * 3) },
        { key: 'full_rest', label: 'Descanso completo', color: '#9ca3af', weight: 20, ovr: 0, wear: -25 },
        { key: 'intense_training', label: 'Pretemporada intensa con el cuerpo técnico', color: '#3b82f6', weight: 18, ovr: 1 },
        { key: 'sponsorship_deal', label: 'Firmaste un contrato de auspicios', color: '#f59e0b', weight: 14, hof: 5, cash: 40 + Math.round((this.player.ovr || 55) * 0.8) },
        { key: 'unexpected_expense', label: 'Un gasto inesperado te complica el bolsillo', color: '#ef4444', weight: 10, cash: -(20 + Math.floor(Math.random() * 30)) }
      ];
    }

    resolveOffseasonEvent(outcomeKey) {
      const outcomes = this._pendingOffseasonOutcomes || this.getOffseasonEventOutcomes();
      const outcome = outcomes.find(o => o.key === outcomeKey) || outcomes[0];
      let result = { applied: {}, ovrDelta: 0 };
      if (typeof outcome.ovr === 'number' && outcome.ovr !== 0) {
        result = this.applyOvrDelta(outcome.ovr);
      }
      if (outcome.injuryAttr) {
        this.pendingInjuryPenalty = { attr: outcome.injuryAttr, amount: outcome.injuryAmount };
      }
      if (outcome.hof) {
        this.hofScore += outcome.hof;
      }
      if (outcome.cash) {
        this.cash = Math.max(0, (this.cash || 0) + outcome.cash);
      }
      if (outcome.wear) {
        this.nudgeWear(outcome.wear);
      }
      this.offseasonEventResolved = true;
      this._pendingOffseasonOutcomes = null;
      this.save();
      return { outcome, delta: result.applied, ovrDelta: result.ovrDelta };
    }

    isOffseasonComplete() {
      return this.contractResolved && this.offseasonEventResolved;
    }

    getNextPendingEvent() {
      return (this.seasonEvents || []).find(e => !e.resolved) || null;
    }

    isSeasonEventsComplete() {
      return this.seasonEvents.length > 0 && this.seasonEvents.every(e => e.resolved);
    }

    getChoiceEventOptions(eventId) {
      const template = getEventTemplate(eventId);
      return (template && template.choices) || {};
    }

    /** The choice options for `eventId` scaled by that event's already-rolled
     * per-option tier (see rollTiersForChoices) — {key: {base, tier, ovrTarget}}.
     * ovrTarget is base * the tier's multiplier, rounded — this is the value
     * that actually gets applied and should be shown on the card. */
    getTieredChoiceOptions(eventId) {
      const event = this.seasonEvents.find(e => e.id === eventId);
      const base = this.getChoiceEventOptions(eventId);
      const tiers = (event && event.tiers) || {};
      const out = {};
      Object.keys(base).forEach(key => {
        const tier = tiers[key] || 'Normal';
        const mult = CARD_TIER_CONFIG.multipliers[tier] || 1.0;
        out[key] = { base: base[key], tier, ovrTarget: Math.round(base[key] * mult) };
      });
      return out;
    }

    /** Applies a rating delta object to the player, scaled by the current
     * role's growth multiplier (starters develop faster than bench players
     * — see ROLE_GROWTH_MULTIPLIER), tracked in seasonRatingDelta for the
     * always-visible ratings panel, and keeps the cached .ovr in sync. */
    /** Role multiplier plus the personal-trainer perk's bonus, if active
     * (see getShopCatalog) — the ONE place growth-rate scaling is computed,
     * used both when actually applying growth (_applyRatingDelta) and when
     * previewing it on a card (getRoleAdjustedOvrTarget), so a purchased
     * trainer can never make a card's promise diverge from its result. */
    getEffectiveGrowthMultiplier() {
      const roleMult = ROLE_GROWTH_MULTIPLIER[this.role] || 1.0;
      const trainerBonus = (this.shopEffects && this.shopEffects.trainer > 0) ? 0.15 : 0;
      // Past a real wear threshold, a worn-down player simply gets less out
      // of the same work — up to a real bite (-0.35 at wear=100) so
      // grinding through high wear has a visible cost, not just flavor.
      const wear = this.wear || 0;
      const wearPenalty = wear > 60 ? ((wear - 60) / 40) * 0.35 : 0;
      return Math.max(0.3, roleMult + trainerBonus - wearPenalty);
    }

    /** Moves wear and clamps to 0-100 — same non-auto-decaying persistence
     * pattern as nudgeReputation. */
    nudgeWear(amount) {
      if (!amount) return;
      this.wear = Math.max(0, Math.min(100, Math.round((this.wear || 0) + amount)));
    }

    _applyRatingDelta(delta) {
      if (!this.seasonRatingDelta) this.seasonRatingDelta = { con: 0, pwr: 0, eye: 0, spd: 0, def: 0 };
      const roleMult = this.getEffectiveGrowthMultiplier();
      const applied = {};
      Object.keys(delta).forEach(k => {
        if (typeof this.player[k] !== 'number') return;
        const scaled = Math.round(delta[k] * roleMult);
        this.player[k] = Math.max(20, Math.min(125, this.player[k] + scaled));
        this.seasonRatingDelta[k] = (this.seasonRatingDelta[k] || 0) + scaled;
        applied[k] = scaled;
      });
      delete this.player.ovr;
      this.player.ovr = ovrOf(this.player);
      return applied;
    }

    /** Applies a targeted OVR delta (see distributeOvrDelta) — the entry
     * point every growth source (choice events, season-moment tiers,
     * playoffs) should use instead of hand-picking attribute deltas. Returns
     * { applied (attribute deltas), ovrDelta (the REAL resulting OVR
     * change) } — ovrDelta is what the UI should show, since the role
     * growth multiplier (ROLE_GROWTH_MULTIPLIER) and rounding both make the
     * final result diverge slightly from the raw target. */
    applyOvrDelta(targetOvrDelta) {
      const ovrBefore = ovrOf(this.player);
      const delta = distributeOvrDelta(this.player, targetOvrDelta);
      const applied = this._applyRatingDelta(delta);
      const ovrDelta = ovrOf(this.player) - ovrBefore;
      return { applied, ovrDelta };
    }

    /** The OVR delta a choice/situational option will ACTUALLY produce —
     * dry-runs the exact same distributeOvrDelta + role-scaling math that
     * applyOvrDelta uses, against a clone of the player, so what a card
     * shows BEFORE it's picked is guaranteed to match the result (a naive
     * round(target * roleMult) estimate drifted from the real outcome once
     * per-attribute rounding was involved — this can't drift, since it's the
     * real computation, just run against a throwaway copy). */
    getRoleAdjustedOvrTarget(targetOvrDelta) {
      const clone = Object.assign({}, this.player);
      const ovrBefore = ovrOf(clone);
      const delta = distributeOvrDelta(clone, targetOvrDelta);
      const roleMult = this.getEffectiveGrowthMultiplier();
      Object.keys(delta).forEach(k => {
        if (typeof clone[k] !== 'number') return;
        clone[k] = Math.max(20, Math.min(125, clone[k] + Math.round(delta[k] * roleMult)));
      });
      delete clone.ovr;
      return ovrOf(clone) - ovrBefore;
    }

    /** Moves reputation and clamps to 0-100 — never called automatically to
     * drift back toward 50, so it's a real persistent consequence, not a
     * temporary in-season modifier like seasonRatingDelta. */
    nudgeReputation(amount) {
      if (!amount) return;
      this.reputation = Math.max(0, Math.min(100, Math.round((this.reputation || 50) + amount)));
    }

    resolveChoiceEvent(eventId, choiceKey) {
      const event = this.seasonEvents.find(e => e.id === eventId);
      if (!event || event.resolved) return null;
      const tiered = this.getTieredChoiceOptions(eventId)[choiceKey];
      const result = tiered
        ? this.applyOvrDelta(tiered.ovrTarget)
        : { applied: {}, ovrDelta: 0 };
      const repDelta = REPUTATION_CHOICE_DELTA[`${eventId}.${choiceKey}`] || 0;
      this.nudgeReputation(repDelta);
      result.reputationDelta = repDelta;
      const wearDelta = WEAR_CHOICE_DELTA[`${eventId}.${choiceKey}`] || 0;
      this.nudgeWear(wearDelta);
      result.wearDelta = wearDelta;
      event.resolved = true;
      event.choiceMade = choiceKey;
      this.save();
      return result;
    }

    // ── SEASON MOMENT: roulette, not dice ─────────────────────────────────
    getSeasonMomentWeights() {
      const strength = Math.max(0.5, Math.min(1.6, (this.player.ovr || 55) / 70));
      return SEASON_MOMENT_TIERS.map((t, i) => {
        const centered = i - 2.5; // -2.5..2.5, tiers ordered worst -> best
        const weight = Math.max(0.5, t.weightBase * Math.pow(strength, centered * 0.6));
        return { ...t, weight };
      });
    }

    /** Resolves the season's one big moment for the already-chosen tier (the
     * UI's wheel widget picks the tier by weight and spins to it — this just
     * applies the consequences): a short stretch of games sampled with that
     * tier's stat modifier, folded into the season total, plus a rating
     * swing scaled by the tier (a bust can genuinely cost you ratings, not
     * just stats). Returns { tier, line, delta }. */
    resolveSeasonMoment(tierKey) {
      const event = this.seasonEvents.find(e => e.id === 'season_moment');
      if (!event || event.resolved) return null;

      const tier = SEASON_MOMENT_TIERS.find(t => t.key === tierKey) || SEASON_MOMENT_TIERS[2];
      // A ~week-long sample (20-29 PA) was small enough that per-PA binomial
      // noise could make a neutral "Discreta" tier (statMod 0) read as a
      // .150 disaster despite the flavor text promising "nada memorable,
      // sin sobresaltos" — widened to roughly a month so the law of large
      // numbers keeps a modest tier looking modest, not catastrophic.
      const momentPA = 45 + Math.floor(Math.random() * 25);
      const line = this._sampleLine(this.player, momentPA, tier.statMod);

      event.resolved = true;
      event.tierKey = tier.key;
      event.line = line;
      this._signatureLine = line;

      const result = this.applyOvrDelta(tier.ovrTarget);
      this.save();
      return { tier, line, delta: result.applied, ovrDelta: result.ovrDelta };
    }

    /** Statistically samples `pa` plate appearances' worth of counting
     * stats for the given attribute set, era-normalized. `modifier` shifts
     * the underlying probabilities up/down (used by the season-moment
     * roulette tiers and, with modifier 0, for both the career player's
     * background season and every league rival's simulated season — same
     * formula for everyone, so the leaderboard comparison is apples to
     * apples). */
    _sampleLine(attrs, pa, modifier = 0) {
      const off = getEraOffense(this.currentYear);
      const con = attrs.con || 50, pwr = attrs.pwr || 50, eye = attrs.eye || 50, spd = attrs.spd || 50;

      // Additive, hard-capped skill contribution — NOT a multiplier on the
      // era baseline. A multiplicative `off.avg * (con/60)` let a high
      // attribute (con=120+) blow straight past any real season ever
      // played (a bug report showed a generated .573 AVG / 217 RBI line —
      // the actual single-season RBI record is 191). These caps keep even
      // a maxed-out attribute in "best season ever" territory, not
      // impossible territory, and apply identically to the career player
      // and every league rival (same function), so the comparison stays
      // apples to apples.
      const bbRate = Math.max(0.03, Math.min(0.22, off.bb + (eye - 70) * 0.0018 + modifier * 0.02));
      let bb = 0;
      for (let i = 0; i < pa; i++) if (Math.random() < bbRate) bb++;
      const ab = Math.max(0, pa - bb);

      // hitProb and hrProb used to be fully independent (con-only / pwr-only),
      // which let a high-pwr/low-con card produce lines like .157 AVG with
      // 30+ HR for a full season — statistically nonexistent in real MLB
      // (genuine elite power over a full season correlates with real
      // contact ability, even for three-true-outcomes profiles). A small
      // positive nudge from elite pwr keeps that combination rare instead
      // of being the league leaderboard's typical shape.
      const hitProb = Math.max(0.15, Math.min(0.40, off.avg + (con - 70) * 0.0025 + Math.max(0, pwr - 82) * 0.0012 + modifier * 0.05));
      let hits = 0;
      for (let i = 0; i < ab; i++) if (Math.random() < hitProb) hits++;

      const hrProb = Math.max(0, Math.min(0.09, (off.hrPer600 / 600) + (pwr - 70) * 0.00035 + modifier * 0.015));
      let hr = 0;
      for (let i = 0; i < ab; i++) if (Math.random() < hrProb) hr++;
      hr = Math.min(hr, hits);
      hits = Math.max(hits, hr);

      const nonHrHits = hits - hr;
      const doublesRate = pwr > 70 ? 0.28 : 0.16;
      let doubles = 0, triples = 0;
      for (let i = 0; i < nonHrHits; i++) {
        const roll = Math.random();
        if (roll < doublesRate) doubles++;
        else if (roll < doublesRate + 0.02) triples++;
      }

      const outs = Math.max(0, ab - hits);
      const k = Math.round(outs * (0.35 - Math.min(0.15, (con - 50) / 400)));
      const sbAttempts = Math.round((spd / 100) * (hits + bb) * 0.3);
      const sb = Math.round(sbAttempts * Math.max(0, Math.min(1, 0.55 + spd / 300)));
      const rbi = Math.round(hr * 1.6 + doubles * 0.5 + hits * 0.35);
      const r = Math.round(hits * 0.4 + bb * 0.3 + sb * 0.4);

      return { PA: pa, AB: ab, H: hits, HR: hr, '2B': doubles, '3B': triples, BB: bb, K: Math.max(0, k), SB: Math.max(0, sb), R: Math.max(0, r), RBI: Math.max(0, rbi) };
    }

    // ── LEAGUE: real players to compare the season against ───────────────
    /** ~16 real Rare+ batter cards active during `year` (same activity
     * filter Story Mode uses), standing in as "the league" for the
     * leaderboard — no new ETL, reuses game_cards_pool.js. Rare+ only: this
     * is meant to read as a league of real stars, not a random mix that
     * could include journeyman Commons. */
    buildSeasonLeague(year) {
      const pool = this.getRookiePool();
      const STAR_TIERS = ['Rare', 'Epic', 'Legendary'];
      // A quality floor on top of rarity — a technically-Rare card can still
      // sit at a mediocre OVR; without this, the league table could seat a
      // barely-qualifying scrub next to real household names, which read as
      // arbitrary rather than "16 stars of this era". Falls back exactly
      // like before (rarity-only, then any-era, then the whole pool) if the
      // quality-floored pool doesn't have enough candidates that year.
      const MIN_LEAGUE_OVR = 68;
      const isActive = p => p.debut_year !== undefined && p.last_year !== undefined && p.debut_year <= year && p.last_year >= year;
      const isStar = p => STAR_TIERS.includes(p.rarity);
      const isQuality = p => ovrOf(p) >= MIN_LEAGUE_OVR;

      const activeQualityStars = pool.filter(p => isActive(p) && isStar(p) && isQuality(p));
      const activeStars = pool.filter(p => isActive(p) && isStar(p));
      const anyStars = pool.filter(isStar);
      const source = activeQualityStars.length >= 12 ? activeQualityStars
        : (activeStars.length >= 12 ? activeStars
        : (anyStars.length >= 12 ? anyStars : pool));

      const used = new Set([this.player.name]);
      const league = [];
      let guard = 0;
      while (league.length < 16 && guard < 500 && used.size < source.length) {
        guard++;
        const cand = source[Math.floor(Math.random() * source.length)];
        if (!cand || used.has(cand.name)) continue;
        used.add(cand.name);
        league.push(cand);
      }
      return league;
    }

    /** Once both choice events and the season-moment roulette are resolved:
     * instantly simulates the rest of the season in the background (scaled
     * by the player's role — starters play more), combines it with the
     * season-moment's line, derives the team record from the real team's
     * historical win_pct, and runs endSeason() to compute the leaderboard,
     * awards, and progression. */
    finalizeSeason() {
      const paMult = ROLE_PA_MULTIPLIER[this.role] || 0.65;
      const fullSeasonPA = Math.round((this.seasonGameCount || 162) * PA_PER_GAME * paMult);
      const remainingPA = Math.max(10, fullSeasonPA - 25);
      const backgroundLine = this._sampleLine(this.player, remainingPA);
      const sigLine = this._signatureLine || this._emptyStatLine();

      const total = this._emptyStatLine();
      [backgroundLine, sigLine].forEach(line => {
        Object.keys(total).forEach(k => { total[k] += line[k] || 0; });
      });
      this.seasonStats = total;

      const winPct = (this.team && typeof this.team.win_pct === 'number') ? this.team.win_pct : 0.5;
      const wins = Math.round((this.seasonGameCount || 162) * winPct);
      this.seasonSeriesRecord = { w: wins, l: (this.seasonGameCount || 162) - wins };
      this.save();

      return this.endSeason();
    }

    // ── END OF SEASON ────────────────────────────────────────────────────
    endSeason() {
      const s = this.seasonStats || this._emptyStatLine();
      const avg = s.AB > 0 ? s.H / s.AB : 0;
      const obp = s.PA > 0 ? (s.H + s.BB) / s.PA : 0;
      const slg = s.AB > 0 ? (s.H - s.HR - s['2B'] - s['3B'] + s['2B'] * 2 + s['3B'] * 3 + s.HR * 4) / s.AB : 0;
      const record = this.seasonSeriesRecord || { w: 0, l: 0 };

      const scoreOf = (line) => {
        const lAvg = line.AB > 0 ? line.H / line.AB : 0;
        const lObp = line.PA > 0 ? (line.H + line.BB) / line.PA : 0;
        return lAvg * 300 + line.HR * 1.5 + lObp * 100 + line.RBI * 0.3;
      };

      // Real leaderboard: simulate a season for ~16 real batters active
      // that year using the SAME sampling formula (see _sampleLine) —
      // apples-to-apples, so a bad season genuinely ranks low against real
      // names instead of winning MVP against a synthetic baseline.
      const league = this.buildSeasonLeague(this.currentYear);
      const leaguePA = Math.round((this.seasonGameCount || 162) * PA_PER_GAME);
      const table = league.map(card => {
        const line = this._sampleLine(card, leaguePA);
        return {
          name: card.name,
          avg: line.AB > 0 ? line.H / line.AB : 0,
          hr: line.HR,
          rbi: line.RBI,
          score: scoreOf(line),
          isPlayer: false
        };
      });
      table.push({ name: this.player.name, avg, hr: s.HR, rbi: s.RBI, score: scoreOf(s), isPlayer: true });
      table.sort((a, b) => b.score - a.score);
      const rank = table.findIndex(row => row.isPlayer) + 1;
      const leagueSize = table.length;

      const awards = [];
      if (rank === 1) awards.push('MVP');
      else if (rank <= 3) awards.push('All-Star');
      if (this.seasonHistory.length === 0 && rank <= 5) awards.push('ROY');
      const mvpWinner = rank === 1 ? 'player' : 'league';
      if (awards.includes('MVP')) this.nudgeReputation(5);
      else if (awards.includes('All-Star')) this.nudgeReputation(2);

      // quality: a 0-100 readout for the ratings/history UI — normalized
      // against THIS season's real league score spread (the same `score`
      // that determines rank/awards above), not an independent formula
      // with its own cap. Old formula saturated at 100 for almost any
      // decent season on a winning team regardless of how the player
      // actually stacked up (e.g. a real case: .215 AVG/14HR on a 97-win
      // team hit the 100 cap while ranking 15th of 17 with no awards —
      // contradicted the very table it sat next to). Now 100 means "best
      // in the league that year", 0 means "worst" — always consistent
      // with rank.
      const leagueScores = table.map(row => row.score);
      const minScore = Math.min(...leagueScores);
      const maxScore = Math.max(...leagueScores);
      const playerScore = table[rank - 1].score;
      const quality = maxScore > minScore
        ? Math.max(0, Math.min(100, Math.round(100 * (playerScore - minScore) / (maxScore - minScore))))
        : 50;

      // No passive stat progression here — growth only comes from actually
      // played events (the 2 choice events + the season-moment roulette,
      // see _applyRatingDelta/resolveSeasonMoment) plus the offseason
      // decisions. The background-simulated games that fill out the rest
      // of the season count toward stats/awards but never toward ratings.
      // Age-based decline is the one passive change left — that's decay,
      // not growth (hardcoded curve — real Lahman-derived curves are
      // deferred, see plan doc section 5).
      const age = this.player.careerAge || 21;

      // Wear accumulates from how much you played (role — starters take
      // the most punishment) and, past 30, from age alone on top of that —
      // the body just holds up less. Applied before the decline check below
      // so this season's wear can amplify this season's decline.
      const roleWearGain = { starter: 22, rotation: 12, bench: 6 }[this.role] || 12;
      const ageWearGain = age > 30 ? (age - 30) * 1.5 : 0;
      this.nudgeWear(roleWearGain + ageWearGain);

      if (age > 30) {
        // High wear makes the same age hit harder — up to +50% more decline
        // at wear=100 than at wear<=50.
        const wearFactor = 1 + Math.max(0, ((this.wear || 0) - 50) / 100);
        const decline = Math.round((age - 30) * 0.5 * wearFactor);
        if (decline > 0) {
          ['con', 'pwr', 'eye', 'spd', 'def'].forEach(k => {
            if (typeof this.player[k] !== 'number') return;
            this.player[k] = Math.max(15, this.player[k] - decline);
          });
          delete this.player.ovr;
          this.player.ovr = ovrOf(this.player);
        }
      }

      this.hofScore += Math.round(quality * 0.3 + awards.length * 8 + Math.max(0, 10 - rank));
      this.player.careerAge = age + 1;

      // High wear on top of age also pushes retirement closer — a beat-up
      // veteran calls it quits sooner than a fresh one at the same age.
      const wearRetireBump = ((this.wear || 0) > 70) ? 0.05 : 0;
      const declineFactor = Math.max(0, this.player.careerAge - 34) * 0.05 + wearRetireBump;
      if (this.player.careerAge >= 34 && Math.random() < declineFactor) this.retired = true;
      if (this.player.careerAge >= 45) this.retired = true;

      // Playoff qualification: a winning-ish record gets a shot at the
      // postseason, resolved separately (see startPlayoffs/resolvePlayoffRound)
      // before the season is truly "closed" — a champion adds to this same
      // summary object by reference once the bracket plays out.
      const winPctRecord = record.w / Math.max(1, record.w + record.l);
      const playoffQualified = winPctRecord >= 0.52;

      const summary = {
        year: this.currentYear,
        games: this.seasonGameCount,
        team: this.team ? this.team.name : null,
        role: this.role,
        stats: { ...s, AVG: avg, OBP: obp, SLG: slg },
        record: { ...record },
        awards,
        mvpWinner,
        leagueTable: table,
        leagueRank: rank,
        leagueSize,
        quality,
        hofScore: this.hofScore,
        retired: this.retired,
        playoffQualified,
        playoffChampion: false,
        ovrStart: this._ovrAtSeasonStart || ovrOf(this.player),
        ovrEnd: this.player.ovr
      };
      this.seasonHistory.push(summary);
      // The season's salary is paid out here, at close — cash is real and
      // spendable (see getShopCatalog), separate from contractValue (the
      // season's salary RATE, which stays flat for the life of the deal).
      this.cash = (this.cash || 0) + (this.contractValue || 0);
      if (playoffQualified && !this.retired) this.startPlayoffs();

      if (!this.retired) {
        this.currentYear += 1;
        this.seasonEvents = [];
        this.seasonStats = null;
        this.offseasonPending = true;
        // Contract auto-renews on the same team while years remain — the
        // "stay or sign elsewhere" screen only comes back once it expires.
        this.contractYearsLeft = Math.max(0, (this.contractYearsLeft || 1) - 1);
        this.contractResolved = this.contractYearsLeft > 0;
        this.offseasonEventResolved = false;
        // Purchased perks (see getShopCatalog) count down a season at a time.
        Object.keys(this.shopEffects || {}).forEach(key => {
          this.shopEffects[key] = Math.max(0, this.shopEffects[key] - 1);
          if (this.shopEffects[key] === 0) delete this.shopEffects[key];
        });
      }
      this.save();
      return summary;
    }

    // ── PLAYOFFS: short bracket, resolved round-by-round with the wheel ──
    getPlayoffRoundDefs() {
      return [
        { key: 'division', label: 'Serie Divisional', stakes: CAREER_STAKES.MAJOR },
        { key: 'championship', label: 'Serie de Campeonato', stakes: CAREER_STAKES.MAJOR },
        { key: 'worldseries', label: 'Serie Mundial', stakes: CAREER_STAKES.CRITICAL }
      ];
    }

    startPlayoffs() {
      // Each round gets a real opposing team attached (instead of an
      // anonymous win/lose coin flip) — reuses the same rival picker as
      // ace_matchup, so a nemesis built up during the season can plausibly
      // show up again in October.
      this.playoffs = {
        rounds: this.getPlayoffRoundDefs().map(r => ({ ...r, resolved: false, won: null, opponent: this.getRivalTeamAndAce(this.team ? this.team.teamID : null) })),
        active: true
      };
      this.save();
    }

    getNextPlayoffRound() {
      if (!this.playoffs || !this.playoffs.active) return null;
      return this.playoffs.rounds.find(r => !r.resolved) || null;
    }

    /** Win/lose wheel weights for the next playoff round — later rounds are
     * tougher, and the player's own OVR nudges the odds too, but it's
     * always a real wheel spin (15-85% clamp), never a guaranteed result. */
    getPlayoffRoundWeights() {
      const round = this.getNextPlayoffRound();
      const roundIndex = round ? this.playoffs.rounds.findIndex(r => r.key === round.key) : 0;
      const winPct = (this.team && typeof this.team.win_pct === 'number') ? this.team.win_pct : 0.5;
      const ovrEdge = ((this.player.ovr || 55) - 70) / 300;
      const winChance = Math.max(0.15, Math.min(0.85, winPct - roundIndex * 0.1 + ovrEdge));
      return [
        { key: 'win', label: 'GANAN LA SERIE', color: '#10b981', weight: Math.round(winChance * 100) },
        { key: 'lose', label: 'PIERDEN LA SERIE', color: '#ef4444', weight: Math.round((1 - winChance) * 100) }
      ];
    }

    resolvePlayoffRound(outcomeKey) {
      const round = this.getNextPlayoffRound();
      if (!round) return null;
      round.resolved = true;
      round.won = outcomeKey === 'win';
      let eliminated = false, champion = false;
      let result = null;
      if (!round.won) {
        eliminated = true;
        this.playoffs.active = false;
        result = this.applyOvrDelta(-1); // early exit still costs a little development
        // Getting knocked out locks in a nemesis just as readily as an
        // ace_matchup loss would, if one isn't already set.
        if (round.opponent && !this.nemesis) {
          this.nemesis = { teamID: round.opponent.teamID, name: round.opponent.teamName, wins: 0, losses: 1 };
        } else if (round.opponent && this.nemesis && this.nemesis.teamID === round.opponent.teamID) {
          this.nemesis.losses++;
        }
      } else if (round.key === 'worldseries') {
        champion = true;
        this.playoffs.active = false;
        this.hofScore += 25;
        this.nudgeReputation(5);
        result = this.applyOvrDelta(2);
        const summary = this.seasonHistory[this.seasonHistory.length - 1];
        if (summary) {
          summary.awards = [...(summary.awards || []), 'Campeón Serie Mundial'];
          summary.playoffChampion = true;
          summary.hofScore = this.hofScore;
        }
      } else {
        result = this.applyOvrDelta(1); // advancing a round is itself worth something
      }
      this.save();
      return { round, eliminated, champion, delta: result.applied, ovrDelta: result.ovrDelta };
    }

    /** The Career shop — spend accumulated salary (Career.cash) on perks
     * with real mechanical effects (not cosmetic), New Star Soccer-style but
     * pure simulation: no minigame, just a decision and a number. Costs
     * scale with the player's current OVR so veteran-tier purchases cost
     * more, roughly tracking how contract value itself grows. */
    getShopCatalog() {
      const ovr = this.player ? (this.player.ovr || 55) : 55;
      const scale = Math.max(1, ovr / 60);
      return [
        {
          key: 'trainer', tier: 'Silver', cost: Math.round(120 * scale),
          label: 'Entrenador personal', desc: 'Acelera tu crecimiento por 2 temporadas.',
          effectKey: 'trainer', duration: 2
        },
        {
          key: 'agent', tier: 'Gold', cost: Math.round(200 * scale),
          label: 'Representante top', desc: 'Mejores ofertas de contrato por 3 temporadas.',
          effectKey: 'agent', duration: 3
        },
        {
          key: 'physio', tier: 'Silver', cost: Math.round(100 * scale),
          label: 'Kinesiólogo personal', desc: 'Menos riesgo/impacto de lesión por 2 temporadas.',
          effectKey: 'physio', duration: 2
        },
        {
          key: 'pr', tier: 'Normal', cost: Math.round(60 * scale),
          label: 'Relaciones públicas', desc: 'Suma reputación de inmediato (+8).',
          reputationDelta: 8
        }
      ];
    }

    /** Buys `key` from getShopCatalog if there's enough cash — duration
     * perks stack their remaining seasons (buying trainer again while it's
     * already active extends it), the PR item is instant and has no
     * duration. */
    purchaseShopItem(key) {
      const item = this.getShopCatalog().find(i => i.key === key);
      if (!item || (this.cash || 0) < item.cost) return null;
      this.cash -= item.cost;
      if (item.effectKey) {
        if (!this.shopEffects) this.shopEffects = {};
        this.shopEffects[item.effectKey] = (this.shopEffects[item.effectKey] || 0) + item.duration;
      }
      if (item.reputationDelta) {
        this.nudgeReputation(item.reputationDelta);
      }
      this.save();
      return item;
    }

    /** Real standings for `year` — every team from OpponentsDatabase[year]
     * (union of the low/mid/high tiers used elsewhere for rookie/contract
     * pools, deduped by teamID), sorted by win_pct. This is a read over
     * data Career already loads for other purposes — no new data source,
     * just a view the player never got to see before. */
    getYearStandings(year) {
      const db = window.OpponentsDatabase || {};
      const yearData = db[year] || db[String(year)];
      if (!yearData) return [];
      const seen = new Set();
      const all = [];
      ['low', 'mid', 'high'].forEach(tier => {
        if (Array.isArray(yearData[tier])) {
          yearData[tier].forEach(t => {
            if (!t || !t.teamID || seen.has(t.teamID) || !isCareerEligibleTeam(t)) return;
            seen.add(t.teamID);
            all.push(t);
          });
        }
      });
      all.sort((a, b) => (b.win_pct || 0) - (a.win_pct || 0));
      return all;
    }

    /** Career-long accumulated totals across every closed season (Copero's
     * always-visible PJ/GLS/AST row, translated to baseball: games/AVG/HR/
     * RBI etc, summed from seasonHistory rather than the current season
     * alone) — the persistent player panel shows this every screen, not
     * just the season-in-progress line. */
    getCareerTotals() {
      const totals = { games: 0, PA: 0, AB: 0, H: 0, HR: 0, '2B': 0, '3B': 0, BB: 0, K: 0, SB: 0, R: 0, RBI: 0, seasons: this.seasonHistory.length };
      this.seasonHistory.forEach(s => {
        totals.games += s.games || 0;
        Object.keys(totals).forEach(k => {
          if (k === 'games' || k === 'seasons') return;
          totals[k] += (s.stats && s.stats[k]) || 0;
        });
      });
      totals.AVG = totals.AB > 0 ? totals.H / totals.AB : 0;
      totals.OBP = totals.PA > 0 ? (totals.H + totals.BB) / totals.PA : 0;
      totals.SLG = totals.AB > 0 ? (totals.H - totals.HR - totals['2B'] - totals['3B'] + totals['2B'] * 2 + totals['3B'] * 3 + totals.HR * 4) / totals.AB : 0;
      totals.awards = this.seasonHistory.reduce((n, s) => n + (s.awards ? s.awards.length : 0), 0);
      return totals;
    }

    /** Resolves the Hall of Fame vote at retirement — simulates a panel of
     * voters (a rough echo of a real BBWAA ballot count) each voting yes/no
     * on a probability derived from career merit, then tallies a real
     * percentage. Deliberately hard to clear 75%: a merely good career sits
     * well under it, only a genuinely dominant one (multiple MVPs,
     * championships, elite career totals) reliably crosses. Idempotent —
     * the vote happens once per career and the result is cached, not
     * re-rolled every time this screen is revisited. */
    resolveHofVote() {
      if (this.hofResult) return this.hofResult;
      const totals = this.getCareerTotals();
      const mvpCount = this.seasonHistory.filter(s => (s.awards || []).includes('MVP')).length;
      const allStarCount = this.seasonHistory.filter(s => (s.awards || []).includes('All-Star')).length;
      const championships = this.seasonHistory.filter(s => s.playoffChampion).length;
      const seasons = totals.seasons || 1;

      const longevityScore = Math.min(15, seasons * 1.0);
      const dominanceScore = mvpCount * 14 + allStarCount * 4 + championships * 9;
      const statScore = Math.max(0, (totals.AVG - 0.260) * 180) + Math.max(0, (totals.HR - 150) * 0.05) + Math.max(0, (totals.RBI - 700) * 0.02);
      const hofScoreComponent = Math.min(20, (this.hofScore || 0) * 0.04);

      const meritScore = Math.max(2, Math.min(96, longevityScore + dominanceScore + statScore + hofScoreComponent));
      const voteProb = meritScore / 100;

      const votesTotal = 40;
      let votesFor = 0;
      for (let i = 0; i < votesTotal; i++) { if (Math.random() < voteProb) votesFor++; }
      const votePct = Math.round((votesFor / votesTotal) * 100);
      this.hofResult = { votePct, votesFor, votesTotal, inducted: votePct >= 75, meritScore: Math.round(meritScore) };
      this.save();
      return this.hofResult;
    }

    save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this._serialize()));
      } catch (e) { /* storage unavailable — carrera no persiste, no bloquea el juego */ }
    }

    _serialize() {
      return {
        v: 1,
        active: this.active,
        difficulty: this.difficulty,
        player: this.player,
        potential: this.potential,
        debutYear: this.debutYear,
        currentYear: this.currentYear,
        team: this.team,
        role: this.role,
        contractYearsLeft: this.contractYearsLeft,
        contractValue: this.contractValue,
        seasonEvents: this.seasonEvents,
        seasonStats: this.seasonStats,
        seasonSeriesRecord: this.seasonSeriesRecord,
        seasonGameCount: this.seasonGameCount,
        seasonRatingDelta: this.seasonRatingDelta,
        seasonHistory: this.seasonHistory,
        playoffs: this.playoffs,
        awards: this.awards,
        hofScore: this.hofScore,
        hofResult: this.hofResult,
        retired: this.retired,
        reputation: this.reputation,
        wear: this.wear,
        cash: this.cash,
        nemesis: this.nemesis,
        shopEffects: this.shopEffects,
        offseasonPending: this.offseasonPending,
        contractResolved: this.contractResolved,
        offseasonEventResolved: this.offseasonEventResolved,
        pendingInjuryPenalty: this.pendingInjuryPenalty
      };
    }

    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || data.v !== 1) return false;
        Object.assign(this, data);
        return true;
      } catch (e) {
        return false;
      }
    }

    hasSave() {
      try {
        return !!localStorage.getItem(SAVE_KEY);
      } catch (e) {
        return false;
      }
    }

    clear() {
      this.reset();
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    }
  }

  window.Career = new CareerState();
  window.CAREER_IS_RISKY_CHOICE = isRiskyChoice;
  window.CAREER_IS_ELIGIBLE_TEAM = isCareerEligibleTeam;
  window.CAREER_STAKES = CAREER_STAKES;
  window.CAREER_GET_EVENT_STAKES = getEventStakes;
  window.CAREER_DIFFICULTY_TIERS = DIFFICULTY_TIERS;
  window.CAREER_EVENT_TEMPLATE_POOL = EVENT_TEMPLATE_POOL;
  window.CAREER_CARD_TIER_CONFIG = CARD_TIER_CONFIG;
  window.CAREER_SEASON_MOMENT_TIERS = SEASON_MOMENT_TIERS;
  window.CAREER_SITUATIONAL_TEMPLATES = SITUATIONAL_EVENT_POOL.reduce((map, t) => {
    map[t.id] = { label: t.label, prompt: t.prompt };
    return map;
  }, {});
  window.CAREER_CROSSROADS_TEMPLATES = CAREER_CROSSROADS_POOL.reduce((map, t) => {
    map[t.id] = { icon: t.icon, title: t.title, prompt: t.prompt };
    return map;
  }, {});
})();
