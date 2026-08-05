// BaseRogue Game State Manager
// Refined for Lineup order controls, Bench removal, and Manager Decisions Events

(function() {
  const ManagerEventsList = [
    {
      id: "ev_cork",
      get title() { return window.t ? window.t("events.ev_cork_title") : "Bates de Contrabando"; },
      get desc() { return window.t ? window.t("events.ev_cork_desc") : "Un misterioso comerciante te ofrece bates modificados con corcho. Aumentará la potencia de tu equipo, pero afectará el contacto de la bola."; },
      choices: [
        {
          get text() { return window.t ? window.t("events.ev_cork_choice1") : "Modificar bates (+15 Fuerza, -4 Contacto a todo el equipo)"; },
          cost: 15,
          action: (G) => {
            G.activeItemBonuses.teamPwr += 15;
            G.activeItemBonuses.teamCon -= 4;
          }
        },
        {
          get text() { return window.t ? window.t("events.ev_cork_choice2") : "Rechazar oferta (No hacer nada)"; },
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_fitness",
      get title() { return window.t ? window.t("events.ev_fitness_title") : "Preparador Físico Retro"; },
      get desc() { return window.t ? window.t("events.ev_fitness_desc") : "Un entrenador físico del campeonato de 1982 se ofrece a coordinar una rutina de acondicionamiento intensa para tu alineación."; },
      choices: [
        {
          get text() { return window.t ? window.t("events.ev_fitness_choice1") : "Rutina cardiovascular (+40 Stamina a toda la alineación)"; },
          cost: 20,
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.min(100, G.roster[pos].stamina + 40);
            });
          }
        },
        {
          get text() { return window.t ? window.t("events.ev_fitness_choice2") : "Continuar sin entrenar"; },
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_cryo",
      get title() { return window.t ? window.t("events.ev_cryo_title") : "Cápsula de Hidroterapia"; },
      get desc() { return window.t ? window.t("events.ev_cryo_desc") : "Instalas una cámara de recuperación avanzada en el vestuario. Cura a todo el equipo al instante, pero es costosa."; },
      choices: [
        {
          get text() { return window.t ? window.t("events.ev_cryo_choice1") : "Criogenización (Recupera 100% de Stamina a todos)"; },
          cost: 30,
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = 100;
            });
          }
        },
        {
          get text() { return window.t ? window.t("events.ev_cryo_choice2") : "Prescindir de la cámara"; },
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_pinetar",
      get title() { return window.t ? window.t("events.ev_pinetar_title") : "Brea de Pino Japonesa"; },
      get desc() { return window.t ? window.t("events.ev_pinetar_desc") : "Consigues un tarro de brea especial que mejora el agarre y agarre del bate, afinando el contacto."; },
      choices: [
        {
          get text() { return window.t ? window.t("events.ev_pinetar_choice1") : "Comprar brea (+8 Contacto global a todo el equipo)"; },
          cost: 12,
          action: (G) => {
            G.activeItemBonuses.teamCon += 8;
          }
        },
        {
          get text() { return window.t ? window.t("events.ev_pinetar_choice2") : "Seguir igual"; },
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_bribe",
      get title() { return window.t ? window.t("events.ev_bribe_title") : "Cazatalento en Apuros"; },
      get desc() { return window.t ? window.t("events.ev_bribe_desc") : "Un caza-talentos te ofrece dinero del presupuesto del equipo rival a cambio de canjear un poco de enfoque deportivo."; },
      choices: [
        {
          get text() { return window.t ? window.t("events.ev_bribe_choice1") : "Aceptar dinero (Ganas +$45 presupuesto, pero pierdes -5 Disciplina/Eye global)"; },
          cost: -45, // negative cost means gaining budget
          action: (G) => {
            G.activeItemBonuses.teamEye -= 5;
          }
        },
        {
          get text() { return window.t ? window.t("events.ev_bribe_choice2") : "Denunciarlo al comisionado (Ganas +8 Disciplina/Eye global en tu equipo)"; },
          cost: 10,
          action: (G) => {
            G.activeItemBonuses.teamEye += 8;
          }
        }
      ]
    },
    {
      id: "ev_spikes",
      title: "Clavos Ligeros Experimentales",
      desc: "Un fabricante local te ofrece calzado de clavos de aluminio ultraligeros para mejorar la velocidad.",
      choices: [
        {
          text: "Equipar clavos (+12 Velocidad/Speed global)",
          cost: 15,
          action: (G) => {
            G.activeItemBonuses.teamSpd += 12;
          }
        },
        {
          text: "Rechazar",
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_gloves",
      title: "Guantes de Piel Curtida",
      desc: "Un coleccionista de antigüedades vende guantes clásicos pesados de béisbol que otorgan máxima protección defensiva.",
      choices: [
        {
          text: "Comprar guantes (+12 Defensa global a todo el equipo)",
          cost: 12,
          action: (G) => {
            G.activeItemBonuses.teamDef += 12;
          }
        },
        {
          text: "Rechazar",
          cost: 0,
          action: (G) => {}
        }
      ]
    }
  ];

  function pickWeightedUnique(pool, count, weakPositionsSet) {
    const selected = [];
    const poolCopy = [...pool];

    while (selected.length < count && poolCopy.length > 0) {
      let totalWeight = 0;
      const weights = poolCopy.map(p => {
        const pos = p.pos || p.pos_display || p.primary_pos || '';
        const isWeak = weakPositionsSet && weakPositionsSet.has(pos);
        const w = isWeak ? 3.0 : 1.0;
        totalWeight += w;
        return w;
      });

      let randVal = Math.random() * totalWeight;
      let chosenIdx = 0;

      for (let i = 0; i < poolCopy.length; i++) {
        randVal -= weights[i];
        if (randVal <= 0) {
          chosenIdx = i;
          break;
        }
      }

      selected.push(poolCopy.splice(chosenIdx, 1)[0]);
    }

    return selected;
  }

  function sortPitchingStaff(pitchers) {
    if (!pitchers || !Array.isArray(pitchers) || pitchers.length === 0) return pitchers;

    const sps = [];
    const rps = [];

    pitchers.forEach(p => {
      const roleUpper = (p.role || '').toUpperCase();
      const isSP = roleUpper === 'SP' || (!p.role && ((p.sta || p.sta_val || 50) >= 50));
      if (isSP) {
        sps.push(p);
      } else {
        rps.push(p);
      }
    });

    // Sort SPs by stamina descending
    sps.sort((a, b) => (b.sta || b.sta_val || 50) - (a.sta || a.sta_val || 50));

    // Sort RPs by stamina descending
    rps.sort((a, b) => (b.sta || b.sta_val || 50) - (a.sta || a.sta_val || 50));

    // SPs first (highest stamina SP at Slot 0), RPs last (highest stamina RP first among relievers)
    return [...sps, ...rps];
  }

  class GameState {
    loadSeasonOpponents(year) {
      if (!window.OpponentsDatabase) return;
      const yearsAvailable = Object.keys(window.OpponentsDatabase);
      
      let targetYear = String(year);
      if (year === 'random' || !year) {
        targetYear = yearsAvailable[Math.floor(Math.random() * yearsAvailable.length)];
      }

      const seasonData = window.OpponentsDatabase[targetYear] || window.OpponentsDatabase[String(targetYear)];
      if (!seasonData) {
        console.error(`Season data not found for year ${targetYear}`);
        return;
      }

      this.currentSeasonYear = targetYear;
      this.selectedSeasonYear = targetYear;
      this.selectedMode = 'story';
      
      const customPool = [];
      if (seasonData.low && seasonData.low.length > 0) {
        seasonData.low.forEach(t => customPool.push({...t, tier: 'Low'}));
      }
      if (seasonData.mid && seasonData.mid.length > 0) {
        seasonData.mid.forEach(t => customPool.push({...t, tier: 'Mid'}));
      }
      if (seasonData.high && seasonData.high.length > 0) {
        seasonData.high.forEach(t => customPool.push({...t, tier: 'High'}));
      }
      if (seasonData.boss) {
        customPool.push({...seasonData.boss, tier: 'Final_Boss', isBoss: true});
      }

      this.customSeasonPool = customPool;
      window.OpponentsPool = customPool;
      this.seasonPoolData = seasonData;
      console.log(`Loaded Story Mode Season ${targetYear} with ${customPool.length} teams`);
    }

    constructor() {
      this.resetRun();
    }

    resetRun() {
      this.budget = 10;
      this.currentStageIndex = 0;
      this.currentNodeIndex = 0;
      this.runActive = false;
      this.starterChosen = false;

      this.activeItemBonuses = {
        teamCon: 0, teamPwr: 0, teamEye: 0, teamSpd: 0, teamDef: 0
      };
      this.purchasedItems = [];
      this.currentEnemy = null;
      this.encounteredTeams = new Set();
      this.encounteredPitchers = new Set();
      this.isSuperBossActive = false;

      // ── Traits Passives ───────────────────────────────────────────────
      this.equippedTraits = [];  // Up to 3 traits (one per boss map)

      // ── Run Stats Tracking ────────────────────────────────────────────
      // { playerName: { ab, h, bb, so, doubles, triples, hr, rbi, runs } }
      this.runBatterStats = {};
      // { pitcherName: { outs, k, bb, h, hr, er, ip } }
      this.runPitcherStats = {};
      // All players that were part of roster during the run
      this.runRosterHistory = {};  // slot -> player snapshot

      // ── 9-round Draft State ───────────────────────────────────────────
      // Round structure:
      //   Round 1: Epic or higher (guaranteed)
      //   Round 2: Rare or higher (guaranteed)
      //   Round 3: Uncommon or higher (guaranteed)
      //   Rounds 4-6: Common ONLY (builds bench / filler)
      //   Rounds 7-9: Any rarity from full pool
      this.draftRound     = 1;   // Current round: 1–9
      this.draftedPlayers = [];  // Accumulated picks: list of up to 9 player objects
      this.currentDraftPicks = null; // Cache for the current round's 3 choices

      // draftRoster: slot → player instance (built live during draft)
      this.draftRoster = {
        C: null, "1B": null, "2B": null, "3B": null, SS: null,
        LF: null, CF: null, RF: null, DH: null
      };
      // draftBattingOrder: ordered array of slot names for the batting lineup
      this.draftBattingOrder = ['CF', 'LF', 'RF', '1B', '2B', '3B', 'SS', 'C', 'DH'];

      this.roster = {
        C: null, "1B": null, "2B": null, "3B": null, SS: null,
        LF: null, CF: null, RF: null, DH: null
      };

      // Custom Batting Order (positions sequence)
      this.battingOrder = ['CF', 'LF', 'RF', '1B', '2B', '3B', 'SS', 'C', 'DH'];

      this.map = [];
      this.history = [];
    }

    // ── TRAITS: Full trait catalog ────────────────────────────────────────────
    static get TRAITS_CATALOG() {
      return [
        { id: 'eagle_patience',    name: '🦅 Paciencia de Águila',       desc: 'Zona de Boleto (BB) aumenta +3 puntos. Cada BB regenera +5 Stamina al bateador.', icon: '🦅' },
        { id: 'slugger_momentum',  name: '💥 Impulso de Jonronero',       desc: 'Cada HR inflige +30 HP de daño extra al pitcher rival.', icon: '💥' },
        { id: 'surgical_contact',  name: '🎯 Contacto Quirúrgico',        desc: 'Zona de Ponche (SO) reducida en -3 puntos para toda la alineación.', icon: '🎯' },
        { id: 'speed_demons',      name: '⚡ Velocistas Agresivos',       desc: 'Jugadores con SPD > 60 roban la base automáticamente en sencillos y boletos. Debuff al pitcher dura 3 impactos.', icon: '⚡' },
        { id: 'extra_base_impact', name: '💣 Impacto Acumulado',          desc: 'Batazos de extra bases (2B, 3B, HR) infligen +10 HP de daño adicional al pitcher.', icon: '💣' },
        { id: 'iron_shield',       name: '🛡️ Escudo de Hierro',          desc: 'El Escudo absorbe 75% del DEF promedio del roster (en lugar de 50%). Regenera +5 al inicio de cada entrada.', icon: '🛡️' },
        { id: 'defensive_wall',    name: '🧱 Muro Defensivo',             desc: 'Outs normales reducen HP del equipo en 8 en lugar de 12.', icon: '🧱' },
        { id: 'endless_stamina',   name: '🔋 Resistencia Inagotable',     desc: 'Los bateadores solo pierden 6 de Stamina por partido (en lugar de 12).', icon: '🔋' },
        { id: 'clutch_legends',    name: '❤️ Resiliencia de Leyendas',   desc: 'Si Team HP cae por debajo de 35, activa estado Clutch: +15 a CON, PWR, EYE, SPD, DEF para toda la alineación.', icon: '❤️' },
        { id: 'golden_glove',      name: '🧤 Guantelete Dorado',          desc: 'Todos los bateadores reciben +10 DEF, aumentando la capacidad del Escudo de equipo.', icon: '🧤' },
        { id: 'secondary_master',  name: '🔄 Posición Secundaria Maestra',desc: 'Elimina la penalización (-15%) al colocar bateadores en su Posición Secundaria.', icon: '🔄' },
        { id: 'era_accelerated',   name: '⏳ Sinergia de Era Acelerada',  desc: 'Solo necesitas 2 jugadores de la misma Era para activar la Sinergia de Nivel 2 (normalmente 4).', icon: '⏳' },
        { id: 'elite_negotiator',  name: '💼 Negociador de Élite',        desc: 'Obtienes +$10 de presupuesto extra tras cada victoria.', icon: '💼' },
        { id: 'scout_eye',         name: '🌟 Ojo de Cazatalentos',        desc: 'Las ofertas de draft muestran 4 jugadores en lugar de 3 y aumenta probabilidad de Epic/Legendary.', icon: '🌟' },
        { id: 'veteran_rotation',  name: '🔋 Segunda Vida',               desc: 'Tu alineación completa recupera un +30% de Stamina al inicio de cada nuevo mapa.', icon: '🔋' },
        { id: 'reliever_ambush',   name: '🔥 Emboscada al Relevista',     desc: 'El primer batazo contra un nuevo pitcher rival inflige +50% de daño extra.', icon: '🔥' },
        { id: 'early_pressure',    name: '📈 Presión Temprana',           desc: 'El primer bateador de cada entrada gana +20 de CON y EYE para ese turno.', icon: '📈' },
        { id: 'ghost_runners',     name: '🏃 Corredores Fantasma',        desc: 'Inicias la 3ª entrada de cada partido con un corredor en 2ª base automáticamente.', icon: '🏃' },
        { id: 'legendary_domination', name: '👑 Dominio Legendario',      desc: 'Si tienes 2 o más jugadores Legendary en titular, todos reciben +10 a todas sus estadísticas.', icon: '👑' },
        { id: 'back_to_back',      name: '💥 Cadena de Poder',            desc: 'Después de un HR, el siguiente bateador gana +20 de PWR y CON para ese turno.', icon: '💥' },
      ];
    }

    hasTrait(id) { return this.equippedTraits.some(t => t.id === id); }

    getRandomTraitChoices(count = 3) {
      const catalog = GameState.TRAITS_CATALOG;
      const equipped = new Set(this.equippedTraits.map(t => t.id));
      const available = catalog.filter(t => !equipped.has(t.id));
      const shuffled = available.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    equipTrait(traitId) {
      const trait = GameState.TRAITS_CATALOG.find(t => t.id === traitId);
      if (trait && !this.hasTrait(traitId)) {
        this.equippedTraits.push(trait);
      }
    }

    // ── RUN STATS: record a match's events into cumulative per-run totals ─────
    recordMatchStats(simEvents, enemyPitchers) {
      if (!simEvents || !simEvents.length) return;

      // Accumulate batter stats from events
      for (const ev of simEvents) {
        if (ev.playType !== 'PLAY' && ev.type !== 'PLAY') continue;
        const rawName = ev.activeBatter || ev.batterName;
        if (!rawName) continue;
        const name = rawName.replace(/\s*\(\d{4}\)$/, '').trim();

        if (!this.runBatterStats[name]) {
          this.runBatterStats[name] = { ab: 0, h: 0, bb: 0, so: 0, doubles: 0, triples: 0, hr: 0, rbi: 0 };
        }
        const s = this.runBatterStats[name];
        const eventType = ev.eventType || ev.type;

        if (eventType === 'BB') { s.bb++; }
        else if (eventType === 'SO') { s.ab++; s.so++; }
        else if (eventType === 'OUT') { s.ab++; }
        else if (eventType === '1B') { s.ab++; s.h++; }
        else if (eventType === '2B') { s.ab++; s.h++; s.doubles++; }
        else if (eventType === '3B') { s.ab++; s.h++; s.triples++; }
        else if (eventType === 'HR') { s.ab++; s.h++; s.hr++; }
        
        if (ev.runsThisTurn || ev.runsScored) {
          s.rbi += (ev.runsThisTurn || ev.runsScored);
        }
      }

      // Accumulate pitcher stats
      if (enemyPitchers && enemyPitchers.length) {
        for (const p of enemyPitchers) {
          const pName = (p.cleanName || p.name || 'Unknown Pitcher').replace(/\s*\(\d{4}\)$/, '').trim();
          if (!this.runPitcherStats[pName]) {
            this.runPitcherStats[pName] = { outs: 0, k: 0, bb: 0, h: 0, hr: 0, er: 0 };
          }
        }
        // Count events against each pitcher from the log
        let currentPitcherIdx = 0;
        for (const ev of simEvents) {
          if (ev.playType === 'KO_PITCHER' || ev.type === 'KO_PITCHER') { currentPitcherIdx++; continue; }
          if (ev.playType !== 'PLAY' && ev.type !== 'PLAY') continue;
          const p = enemyPitchers[currentPitcherIdx];
          if (!p) continue;
          const pName = (p.cleanName || p.name || 'Unknown Pitcher').replace(/\s*\(\d{4}\)$/, '').trim();
          if (!this.runPitcherStats[pName]) this.runPitcherStats[pName] = { outs: 0, k: 0, bb: 0, h: 0, hr: 0, er: 0 };
          const ps = this.runPitcherStats[pName];
          const eventType = ev.eventType || ev.type;

          if (eventType === 'SO') { ps.outs++; ps.k++; }
          else if (eventType === 'OUT') { ps.outs++; }
          else if (eventType === 'BB') { ps.bb++; }
          else if (eventType === '1B') { ps.h++; }
          else if (eventType === '2B') { ps.h++; }
          else if (eventType === '3B') { ps.h++; }
          else if (eventType === 'HR') { ps.h++; ps.hr++; }
          if (ev.runsThisTurn || ev.runsScored) ps.er += (ev.runsThisTurn || ev.runsScored);
        }
      }

      // Snapshot current roster for the run history
      const slots = ['C','1B','2B','3B','SS','LF','CF','RF','DH'];
      for (const slot of slots) {
        const p = this.roster[slot];
        if (p) {
          const name = p.name.replace(/\s*\(\d{4}\)$/, '').trim();
          if (!this.runRosterHistory[name]) {
            this.runRosterHistory[name] = { name: name, pos: slot, rarity: p.rarity, era: p.era, ovr: p.avg_attr_score || p.ovr };
          }
        }
      }
    }


    draftPickPlayer(playerData) {
      if (this.draftRound > 9) return false;
      const instance = {
        ...playerData,
        id: `player_${playerData.name.replace(/\s+/g, '')}_${Date.now()}`,
        stamina: 100,
        upgrades: { con: 0, pwr: 0, eye: 0, spd: 0, def: 0, sta: 0 }
      };
      this.draftedPlayers.push(instance);

      // Auto-assign to draftRoster: try native pos → secondary pos → any empty slot
      const slots = ['C','1B','2B','3B','SS','LF','CF','RF','DH'];
      let assigned = false;
      if (!this.draftRoster[instance.pos]) {
        this.draftRoster[instance.pos] = instance;
        assigned = true;
      } else if (instance.sec_pos) {
        const secArr = instance.sec_pos.split(',').map(s => s.trim());
        for (const s of secArr) {
          if (slots.includes(s) && !this.draftRoster[s]) {
            this.draftRoster[s] = instance;
            assigned = true;
            break;
          }
        }
      }
      if (!assigned) {
        const emptySlot = slots.find(s => !this.draftRoster[s]);
        if (emptySlot) this.draftRoster[emptySlot] = instance;
      }

      this.currentDraftPicks = null; // Clear cached picks for the next round
      this.draftRound++;
      return true;
    }

    // ── DRAFT: return info about the current round's rarity constraints ───
    autoSortBattingOrder(rosterDict, orderArray) {
      const players = orderArray.map(slot => ({ slot, p: rosterDict[slot] }));
      const drafted = players.filter(item => item.p);
      const empty = players.filter(item => !item.p);
      
      if (drafted.length < 2) return orderArray;
      
      drafted.forEach(item => {
         const p = item.p;
         // Use getEffectiveStats so it accounts for Batting Cage upgrades and Era traits
         const eff = this.getEffectiveStats(p, item.slot, rosterDict) || p;
         const effCon = eff.con || 40;
         const effPwr = eff.pwr || 35;
         const effEye = eff.eye || 40;
         const effSpd = eff.spd || 40;
         item.speedScore = effSpd * 1.5 + effCon + effEye;
         item.powerScore = effPwr * 1.5 + effCon;
         item.overall = effCon * 1.2 + effPwr + effEye + effSpd * 0.2;
         item.contact = effCon + effEye * 0.5;
      });
      
      const newOrder = [];
      
      drafted.sort((a,b) => b.overall - a.overall);
      let topHalf = drafted.slice(0, Math.max(2, Math.ceil(drafted.length/2)));
      topHalf.sort((a,b) => b.speedScore - a.speedScore);
      const leadoff = topHalf[0];
      newOrder.push(leadoff);
      drafted.splice(drafted.indexOf(leadoff), 1);
      
      if (drafted.length > 0) {
        drafted.sort((a,b) => b.powerScore - a.powerScore);
        const cleanup = drafted[0];
        cleanup.targetSlot = 3;
        drafted.splice(0, 1);
        newOrder.push(cleanup);
      }
      
      if (drafted.length > 0) {
        drafted.sort((a,b) => b.overall - a.overall);
        const third = drafted[0];
        third.targetSlot = 2;
        drafted.splice(0, 1);
        newOrder.push(third);
      }
      
      if (drafted.length > 0) {
        drafted.sort((a,b) => b.contact - a.contact);
        const second = drafted[0];
        second.targetSlot = 1;
        drafted.splice(0, 1);
        newOrder.push(second);
      }
      
      if (drafted.length > 0) {
        drafted.sort((a,b) => b.powerScore - a.powerScore);
        const fifth = drafted[0];
        fifth.targetSlot = 4;
        drafted.splice(0, 1);
        newOrder.push(fifth);
      }
      
      drafted.sort((a,b) => b.overall - a.overall);
      drafted.forEach((p, idx) => {
         p.targetSlot = 5 + idx;
         newOrder.push(p);
      });
      
      newOrder.sort((a,b) => (a.targetSlot||0) - (b.targetSlot||0));
      return [...newOrder.map(x => x.slot), ...empty.map(x => x.slot)];
    }

    // ── DRAFT: return info about the current round's rarity constraints ───
    getDraftRoundInfo() {
      const r = this.draftRound;
      if (r === 1) return { label: 'EPIC O SUPERIOR', labelKey: 'draft.round_1_label', rarities: ['Legendary','Epic'], icon: '💎' };
      if (r === 2) return { label: 'RARE O SUPERIOR', labelKey: 'draft.round_2_label', rarities: ['Legendary','Epic','Rare'], icon: '🔵' };
      if (r === 3) return { label: 'UNCOMMON O SUPERIOR', labelKey: 'draft.round_3_label', rarities: ['Legendary','Epic','Rare','Uncommon'], icon: '🟢' };
      if (r >= 4 && r <= 6) return { label: 'COMMON OBLIGATORIO', labelKey: 'draft.round_4_label', rarities: ['Common'], icon: '⚪' };
      return { label: 'RONDA LIBRE — CUALQUIER RAREZA', labelKey: 'draft.round_free_label', rarities: null, icon: '🎲' };
    }

    // ── DRAFT: get 3 random picks for the current round (rarity-filtered) ──
    getDraftRoundPicks() {
      if (this.currentDraftPicks && this.currentDraftPicks.round === this.draftRound) {
        return this.currentDraftPicks.picks;
      }

      const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : (window.PlayersDB && window.PlayersDB.PLAYERS_POOL) ? window.PlayersDB.PLAYERS_POOL : (window.LAHMAN_POOL || []);
      if (pool.length === 0) return [];

      const draftedNames = new Set(this.draftedPlayers.map(p => p.name));
      const info = this.getDraftRoundInfo();

      // Filter by rarity constraint + not already drafted
      const available = pool.filter(p => {
        if (draftedNames.has(p.name)) return false;
        if (info.rarities === null) return true; // free round: all rarities
        return info.rarities.includes(p.rarity || 'Common');
      });

      // Determine missing positions in roster
      const missingPos = Object.keys(this.draftRoster).filter(pos => !this.draftRoster[pos]);

      // Assign weights: 6x probability if player fills a missing position (primary or secondary)
      const weightedAvailable = available.map(p => {
        let isNeeded = false;
        if (missingPos.includes(p.pos)) isNeeded = true;
        if (p.sec_pos && p.sec_pos.split(', ').some(sp => missingPos.includes(sp))) isNeeded = true;
        return { player: p, weight: isNeeded ? 6 : 1 };
      });

      const picks = [];
      while (picks.length < 3 && weightedAvailable.length > 0) {
        let totalWeight = weightedAvailable.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedIdx = weightedAvailable.length - 1;
        for (let i = 0; i < weightedAvailable.length; i++) {
          if (random < weightedAvailable[i].weight) {
            selectedIdx = i;
            break;
          }
          random -= weightedAvailable[i].weight;
        }
        picks.push(weightedAvailable.splice(selectedIdx, 1)[0].player);
      }
      // Fallback: if not enough picks after rarity filter, pull from full pool
      if (picks.length < 3) {
        const fallback = pool.filter(p => !draftedNames.has(p.name) && !picks.some(x => x.name === p.name));
        while (picks.length < 3 && fallback.length > 0) {
          const idx = Math.floor(Math.random() * fallback.length);
          picks.push(fallback.splice(idx, 1)[0]);
        }
      }
      this.currentDraftPicks = { round: this.draftRound, picks };
      return picks;
    }

    // ── FINALIZE DRAFT ROSTER → copy draftRoster + draftBattingOrder into active roster ──
    commitDraftRoster() {
      const slots = ['C','1B','2B','3B','SS','LF','CF','RF','DH'];
      slots.forEach(slot => {
        this.roster[slot] = this.draftRoster[slot] || null;
      });
      // Commit batting order from draft
      this.battingOrder = [...this.draftBattingOrder];
    }

    // ── LEGACY AUTO-FILL (kept as internal fallback, not used in 9-round draft) ──
    autoFillLineup() {
      const slots = ['C','1B','2B','3B','SS','LF','CF','RF','DH'];
      const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : (window.PlayersDB && window.PlayersDB.PLAYERS_POOL) ? window.PlayersDB.PLAYERS_POOL : (window.LAHMAN_POOL || []);
      const usedNames = new Set();
      
      // 1. Assign the 3 drafted superstars
      // Sort them by number of possible positions (least flexible first)
      const sortedDrafted = [...this.draftedPlayers].sort((a, b) => {
        const aSec = a.sec_pos ? a.sec_pos.split(',').length : 0;
        const bSec = b.sec_pos ? b.sec_pos.split(',').length : 0;
        return aSec - bSec;
      });
      sortedDrafted.forEach(p => {
        let assigned = false;
        // Try native position first
        if (!this.roster[p.pos]) {
          this.roster[p.pos] = p;
          assigned = true;
        } else if (p.sec_pos) {
          // Try secondary positions
          const sec = p.sec_pos.split(',').map(s=>s.trim());
          for (let s of sec) {
            if (s && slots.includes(s) && !this.roster[s]) {
              this.roster[s] = p;
              assigned = true;
              break;
            }
          }
        }
        // Fallback to any empty slot
        if (!assigned) {
          const emptySlot = slots.find(s => !this.roster[s]);
          if (emptySlot) {
            this.roster[emptySlot] = p;
            assigned = true;
          }
        }
        usedNames.add(p.name);
      });

      // 2. Fill the remaining slots with <= 39.9 players (Grade F and D)
      const lowPool = pool.filter(p => {
        const ovr = (p.con||0)*0.35 + (p.pwr||0)*0.30 + (p.spd||0)*0.10 + (p.def||0)*0.15 + (p.eye||0)*0.10;
        return ovr <= 39.9;
      });
      slots.forEach(slot => {
        if (!this.roster[slot]) {
          const eligible = lowPool.filter(p => p.pos === slot && !usedNames.has(p.name));
          let pick = null;
          if (eligible.length > 0) {
            pick = eligible[Math.floor(Math.random() * eligible.length)];
          } else {
            // Fallback if no natural position matches
            const fallback = lowPool.filter(p => !usedNames.has(p.name));
            if (fallback.length > 0) {
              pick = fallback[Math.floor(Math.random() * fallback.length)];
            }
          }

          if (pick) {
            const instance = {
              ...pick,
              id: `player_${pick.name.replace(/\s+/g, '')}_${Date.now()}_auto`,
              stamina: 100,
              upgrades: { con: 0, pwr: 0, eye: 0, spd: 0, def: 0, sta: 0 }
            };
            this.roster[slot] = instance;
            usedNames.add(pick.name);
          }
        }
      });
    }

    // ── LINEUP ASSIGNMENT: assign drafted player to a slot ────────────────────
    assignPlayerToSlot(slotPos, playerIndex) {
      const player = this.draftedPlayers[playerIndex];
      if (!player) return false;
      this.roster[slotPos] = player;
      return true;
    }

    // ── LINEUP: check all 9 slots filled + activate run ──────────────────────
    finalizeLineup() {
      const slots = ['C','1B','2B','3B','SS','LF','CF','RF','DH'];
      const allFilled = slots.every(s => this.roster[s] !== null);
      if (!allFilled) return false;
      this.starterChosen = true;
      this.runActive = true;
      this.generateMap();
      return true;
    }

    // ── 9-ROUND DRAFT COMPLETE: commit and launch campaign ───────────────
    finalizeDraftAndStart() {
      this.commitDraftRoster();
      return this.finalizeLineup();
    }

    // ── SHIELD: calculate team shield from lineup assignment ──────────────────
    /**
     * Rules:
     *   DH slot       → 0 contribution
     *   Native pos    → 100% of def_val
     *   Out of pos    →  50% of def_val
     * Returns the average of the 8 defensive slots (excluding DH), clamped 0-99.
     */
    calculateLineupShield() {
      const defSlots = ['C','1B','2B','3B','SS','LF','CF','RF'];
      let total = 0;
      defSlots.forEach(slot => {
        const p = this.roster[slot];
        if (!p) return;
        const eff = this.getEffectiveStats(p, slot);
        total += eff.def;
      });
      const avgDef = total / defSlots.length;
      return Math.round(Math.max(0, Math.min(50, avgDef / 2)));
    }

    calculateDraftShield() {
      const defSlots = ['C','1B','2B','3B','SS','LF','CF','RF'];
      let total = 0;
      defSlots.forEach(slot => {
        const p = this.draftRoster[slot];
        if (!p) return;
        const eff = this.getEffectiveStats(p, slot);
        total += eff.def;
      });
      const avgDef = total / defSlots.length;
      return Math.round(Math.max(0, Math.min(50, avgDef / 2)));
    }

    // ── ZONE CONFIG ──────────────────────────────────────────────────────────
    // 4 zones × 4 stages = 16 total stages (indices 0 to 15)
    // zone 0 = "Opening Day (Inicio de temporada)" (stages 0-3)
    // zone 1 = "All-Star Break (Mitad de temporada)" (stages 4-7)
    // zone 2 = "Pennant Chase (Final de temporada)" (stages 8-11)
    // zone 3 = "Playoffs (Fase Final)"              (stages 12-15)
    getZoneForStage(stage) {
      if (stage <= 3) return 0;
      if (stage <= 7) return 1;
      if (stage <= 11) return 2;
      return 3;
    }

    getZoneConfig(zoneIdx) {
      const zones = [
        {
          id: 0,
          name: "Opening Day",
          subtitleKey: "map.stage_opening",
          subtitle: "Inicio de temporada - Dificultad: Normal",
          theme: "zone-minor",
          bossLabel: "Juego de Apertura",
          bossIcon: "🌱",
          stages: [0, 1, 2, 3]
        },
        {
          id: 1,
          name: "All-Star Break",
          subtitleKey: "map.stage_allstar",
          subtitle: "Mitad de temporada - Dificultad: Difícil",
          theme: "zone-major",
          bossLabel: "All-Star Game",
          bossIcon: "⭐",
          stages: [4, 5, 6, 7]
        },
        {
          id: 2,
          name: "Pennant Chase",
          subtitleKey: "map.stage_pennant",
          subtitle: "Final de temporada - Dificultad: Experto",
          theme: "zone-pennant",
          bossLabel: "Campeón de Liga",
          bossIcon: "🏆",
          stages: [8, 9, 10, 11]
        },
        {
          id: 3,
          name: "Playoffs",
          subtitleKey: "map.stage_playoffs",
          subtitle: "Fase Final - Dificultad: Leyenda",
          theme: "zone-hof",
          bossLabel: "Serie Mundial",
          bossIcon: "👑",
          stages: [12, 13, 14, 15]
        }
      ];
      return zones[zoneIdx] || zones[0];
    }

    generateMap() {
      const numStages = 16; // 4 zones × 4 stages
      this.map = [];

      for (let s = 0; s < numStages; s++) {
        const stageNodes = [];
        const isBossStage = (s === 3 || s === 7 || s === 11 || s === 15);
        const isFirstInZone = (s === 0 || s === 4 || s === 8 || s === 12);
        let nodeCount = isBossStage ? 1 : (isFirstInZone ? 2 : 3);
        let isFixedMatch = isBossStage;

        for (let idx = 0; idx < nodeCount; idx++) {
          let type = 'match';
          if (!isFixedMatch) {
            if (s === 0) {
              type = 'match';
            } else {
              const roll = Math.random();
              // 30% match (mini battle), 25% draft, 25% event, 10% train, 10% rest
              if (roll < 0.30)      type = 'match';
              else if (roll < 0.55) type = 'draft';
              else if (roll < 0.80) type = 'event';
              else if (roll < 0.90) type = 'train';
              else                  type = 'rest';
            }
          }

          let label = type.toUpperCase();
          if (isBossStage) {
            type = 'boss';
            const bossLabels = { 3: 'JUEGO APERTURA', 7: 'ALL-STAR GAME', 11: 'CAMPEÓN LIGA', 15: 'SERIE MUNDIAL' };
            label = bossLabels[s] || 'SERIE MUNDIAL';
          } else if (type === 'match') {
            label = 'SERIE CLÁSICA';
          } else if (type === 'event') {
            label = 'DECISIÓN';
          } else if (type === 'train') {
            label = 'JAULA BATEO';
          } else if (type === 'rest') {
            label = 'CASA CLUB';
          } else if (type === 'draft') {
            label = 'FIRMA LEYENDA';
          }

          stageNodes.push({
            id: `node_${s}_${idx}`,
            type,
            label,
            stage: s,
            index: idx,
            connections: [],
            visited: false
          });
        }
        
        this.map.push(stageNodes);
      }

      // Generate branching paths connections (skip zone-boundary boss stages)
      const ZONE_BOSS_STAGES = new Set([3, 7, 11, 15]);
      for (let s = 0; s < numStages - 1; s++) {
        // Don't generate connections OUT of boss stages (zone ends here)
        if (ZONE_BOSS_STAGES.has(s)) continue;

        const currentNodes = this.map[s];
        const nextNodes = this.map[s + 1];

        const N = currentNodes.length;
        const M = nextNodes.length;

        if (M === 1) {
          currentNodes.forEach(node => {
            node.connections = [0];
          });
        } else if (N === 1) {
          currentNodes[0].connections = nextNodes.map((_, idx) => idx);
        } else if (N === 2 && M === 3) {
          // Symmetrical expansion 2 -> 3
          if (currentNodes[0]) currentNodes[0].connections = [0, 1];
          if (currentNodes[1]) currentNodes[1].connections = [1, 2];
        } else if (N === 3 && M === 3) {
          // Fully symmetrical 3 -> 3 lattice
          if (currentNodes[0]) currentNodes[0].connections = [0, 1];
          if (currentNodes[1]) currentNodes[1].connections = [0, 1, 2];
          if (currentNodes[2]) currentNodes[2].connections = [1, 2];
        } else if (N === 3 && M === 2) {
          if (currentNodes[0]) currentNodes[0].connections = [0];
          if (currentNodes[1]) currentNodes[1].connections = [0, 1];
          if (currentNodes[2]) currentNodes[2].connections = [1];
        } else {
          currentNodes.forEach((node, i) => {
            const targets = [];
            if (i < M) targets.push(i);
            if (i - 1 >= 0 && i - 1 < M) targets.push(i - 1);
            if (i + 1 < M) targets.push(i + 1);
            node.connections = [...new Set(targets)].sort((a, b) => a - b);
          });
        }
      }
    }

    getCurrentNode() {
      if (this.map.length === 0) return null;
      return this.map[this.currentStageIndex][this.currentNodeIndex];
    }

    getEffectiveStats(player, slotPosition, contextRoster = this.roster) {
      if (!player) return null;

      let con = (player.con || 0) + (player.upgrades.con || 0);
      let pwr = (player.pwr || 0) + (player.upgrades.pwr || 0);
      let eye = (player.eye || 0) + (player.upgrades.eye || 0);
      let spd = (player.spd || 0) + (player.upgrades.spd || 0);
      let def = (player.def || 0) + (player.upgrades.def || 0);

      // Stamina Penalty
      const stamina = player.stamina || 100;
      let staminaPenalty = 0;
      if (stamina < 50) staminaPenalty = -6;
      if (stamina < 25) staminaPenalty = -16;

      con += staminaPenalty;
      pwr += staminaPenalty;
      eye += staminaPenalty;
      spd += staminaPenalty;
      def += staminaPenalty;

      // Apply Era Passive Trait stat bonuses
      const statsObj = { con, pwr, eye, spd, def };
      if (player.era && window.PlayersDB.EraTraits && window.PlayersDB.EraTraits[player.era]) {
        const trait = window.PlayersDB.EraTraits[player.era];
        if (trait.applyStatBonus) {
          trait.applyStatBonus(statsObj);
          con = statsObj.con;
          pwr = statsObj.pwr;
          eye = statsObj.eye;
          spd = statsObj.spd;
          def = statsObj.def;
        }
      }

      // Position Penalty (DH or native match)
      if (slotPosition && slotPosition !== 'DH' && player.pos !== slotPosition) {
        const secPosArray = player.sec_pos ? player.sec_pos.split(',').map(s => s.trim()) : [];
        if (secPosArray.includes(slotPosition)) {
          def = Math.round(def * 0.85); // Secondary position: 85% defensive value
        } else {
          def = Math.round(def * 0.50); // Out of position: 50% defensive value
        }
      }

      // Manager Decision/Item Bonuses
      con += this.activeItemBonuses.teamCon;
      pwr += this.activeItemBonuses.teamPwr;
      eye += this.activeItemBonuses.teamEye;
      spd += this.activeItemBonuses.teamSpd;
      def += this.activeItemBonuses.teamDef;

      // Synergy Bonuses
      const synergies = this.calculateActiveSynergies(contextRoster);
      synergies.forEach(syn => {
        if (syn.category === 'era') {
          if (syn.bonuses.con) con += syn.bonuses.con;
          if (syn.bonuses.pwr) pwr += syn.bonuses.pwr;
          if (syn.bonuses.eye) eye += syn.bonuses.eye;
          if (syn.bonuses.spd) spd += syn.bonuses.spd;
          if (syn.bonuses.def) def += syn.bonuses.def;
        }
      });

      // Franchise Team Morale Synergy
      if (player.team !== 'ROOK' && player.team !== 'None') {
        const teamCount = this.getActiveFranchiseCounts(contextRoster)[player.team] || 0;
        if (teamCount >= 4) {
          con += 10; pwr += 10; eye += 10; spd += 10; def += 10;
        } else if (teamCount >= 2) {
          con += 4; pwr += 4; eye += 4; spd += 4; def += 4;
        }
      }

      return {
        ...player,
        con: Math.max(1, Math.min(125, con)),
        pwr: Math.max(1, Math.min(125, pwr)),
        eye: Math.max(1, Math.min(125, eye)),
        spd: Math.max(1, Math.min(125, spd)),
        def: Math.max(1, Math.min(125, def)),
        stamina: player.stamina
      };
    }

    getActiveFranchiseCounts(contextRoster = this.roster) {
      const counts = {};
      Object.keys(contextRoster).forEach(pos => {
        const player = contextRoster[pos];
        if (player && !player.isReplacement && player.team && player.team !== 'ROOK') {
          counts[player.team] = (counts[player.team] || 0) + 1;
        }
      });
      return counts;
    }

    calculateActiveSynergies(contextRoster = this.roster) {
      const eraCounts = {};
      Object.keys(contextRoster).forEach(pos => {
        const player = contextRoster[pos];
        if (player && !player.isReplacement && player.era && player.era !== 'None') {
          eraCounts[player.era] = (eraCounts[player.era] || 0) + 1;
        }
      });

      const synergies = [];
      const Eras = window.PlayersDB.Eras;

      Object.keys(eraCounts).forEach(era => {
        const count = eraCounts[era];
        if (count < 2) return;

        let level = 1;
        let bonuses = {};
        let desc = "";

        if (era === Eras.GENESIS) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = "Genesis Chaos: 30% prob de error rival en hit.";
          } else {
            level = 1;
            bonuses = {};
            desc = "Genesis Chaos: 15% prob de error rival en hit.";
          }
        } else if (era === Eras.DEADBALL) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = "Deadball: 40% prob en hit sencillo de avanzar 2 bases.";
          } else {
            level = 1;
            bonuses = {};
            desc = "Deadball: 20% prob en hit sencillo de avanzar 2 bases.";
          }
        } else if (era === Eras.GOLDEN) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = "Golden Era: Hits +12 daño; 30% de convertir 2B en 3B.";
          } else {
            level = 1;
            bonuses = {};
            desc = "Golden Era: Todos los hits hacen +6 daño adicional.";
          }
        } else if (era === Eras.INTEGRATION) {
          if (count >= 4) {
            level = 2;
            bonuses = { con: 8, pwr: 8, eye: 8, spd: 8, def: 8 };
            desc = "Integración: Bateador +8 stats; outs curan +5 Stamina.";
          } else {
            level = 1;
            bonuses = { con: 4, pwr: 4, eye: 4, spd: 4, def: 4 };
            desc = "Integración: Jugador obtiene +4 a todos sus stats en turno.";
          }
        } else if (era === Eras.EXPANSION) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = "Expansion: 80% robo; robo cura +20 y hace 10 daño.";
          } else {
            level = 1;
            bonuses = {};
            desc = "Expansion: 50% robo en 1B; robo cura +10 Stamina.";
          }
        } else if (era === Eras.BIGHAIR) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = "Big Hair: Robos +30 daño y debuff de 3 turnos al rival.";
          } else {
            level = 1;
            bonuses = {};
            desc = "Big Hair: Robos exitosos hacen +15 daño al lanzador.";
          }
        } else if (era === Eras.STEROID) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = "Bash Brothers: HR hacen +40 daño; 50% fly sac anotador.";
          } else {
            level = 1;
            bonuses = {};
            desc = "Bash Brothers: Jonrones (HR) hacen +20 daño adicional.";
          }
        } else if (era === Eras.EFFICIENCY) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = "Moneyball: BB hacen +20 daño; outs hacen +10 daño.";
          } else {
            level = 1;
            bonuses = {};
            desc = "Moneyball: Bases por bolas (BB) hacen +10 daño extra.";
          }
        } else if (era === Eras.MODERN) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = "Three True Outcomes: BB hacen 24 daño, Ponche -50% y no corta racha.";
          } else {
            level = 1;
            bonuses = {};
            desc = "Three True Outcomes: BB hacen 15 daño, Ponche -50% daño al equipo.";
          }
        }

        synergies.push({
          category: 'era',
          era,
          count,
          level,
          bonuses,
          desc
        });
      });

      return synergies;
    }

    getWeakestRosterPositions() {
      const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
      const posScores = positions.map(pos => {
        const p = this.roster[pos];
        let ovr = 0;
        if (p) {
          ovr = p.ovr !== undefined
            ? p.ovr
            : (p.avg_attr_score !== undefined ? p.avg_attr_score : Math.round((p.con || 40) * 0.35 + (p.pwr || 35) * 0.30 + (p.spd || 45) * 0.10 + (p.def || 40) * 0.15 + (p.eye || 40) * 0.10));
        }
        return { pos, ovr };
      });

      // Sort ascending by OVR to find the 3 weakest positions
      posScores.sort((a, b) => a.ovr - b.ovr);
      return new Set(posScores.slice(0, 3).map(x => x.pos));
    }

    // ── MID-GAME EVENT: FIRMA LEYENDA — picks Uncommon or higher ──────────
    getDraftPicks() {
      const pool = window.PlayersDB.LAHMAN_POOL || window.PlayersDB.PLAYERS_POOL || [];
      const onRosterNames = new Set(Object.values(this.roster).filter(Boolean).map(x => x.name));

      // Sign Legend event: Uncommon or higher (no Commons)
      const allowedRarities = ['Legendary', 'Epic', 'Rare', 'Uncommon'];
      const filtered = pool.filter(p =>
        !onRosterNames.has(p.name) && allowedRarities.includes(p.rarity || 'Common')
      );

      const weakPositionsSet = this.getWeakestRosterPositions();
      const selectedPicks = pickWeightedUnique(filtered, 3, weakPositionsSet);

      // Fallback
      if (selectedPicks.length < 3) {
        const fallback = pool.filter(p => !onRosterNames.has(p.name) && !selectedPicks.some(x => x.name === p.name));
        const extraPicks = pickWeightedUnique(fallback, 3 - selectedPicks.length, weakPositionsSet);
        selectedPicks.push(...extraPicks);
      }
      return selectedPicks;
    }

    getPostMatchDraftPicks(isBoss = false) {
      const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : (window.PlayersDB && window.PlayersDB.PLAYERS_POOL) ? window.PlayersDB.PLAYERS_POOL : (window.LAHMAN_POOL || []);
      if (pool.length === 0) return [];

      const onRosterNames = new Set(Object.values(this.roster).filter(Boolean).map(x => x.name));

      // Normal match: Rare or higher | Boss: Epic or higher
      const allowedRarities = isBoss
        ? ['Legendary', 'Epic']
        : ['Legendary', 'Epic', 'Rare'];

      const filtered = pool.filter(p => {
        if (onRosterNames.has(p.name)) return false;
        return allowedRarities.includes(p.rarity || 'Common');
      });

      const weakPositionsSet = this.getWeakestRosterPositions();
      const selected = pickWeightedUnique(filtered, 3, weakPositionsSet);

      // Fallback if pool too small
      if (selected.length < 3) {
        const fallback = pool.filter(p => !onRosterNames.has(p.name) && !selected.some(x => x.name === p.name));
        const extra = pickWeightedUnique(fallback, 3 - selected.length, weakPositionsSet);
        selected.push(...extra);
      }
      return selected;
      return selected;
    }

    addPlayerToRoster(playerData) {
      const playerInstance = {
        ...playerData,
        id: `player_${playerData.name.replace(/\s+/g, '')}_${Date.now()}`,
        stamina: 100,
        upgrades: { con: 0, pwr: 0, eye: 0, spd: 0, def: 0, sta: 0 }
      };

      const nativePos = playerInstance.pos;
      if (this.roster[nativePos] && this.roster[nativePos].isReplacement) {
        this.roster[nativePos] = playerInstance;
        return { success: true, message: `¡${playerInstance.name} colocado directamente en ${nativePos}!` };
      }

      if (nativePos !== 'DH' && this.roster.DH && this.roster.DH.isReplacement) {
        this.roster.DH = playerInstance;
        return { success: true, message: `¡${playerInstance.name} colocado como DH!` };
      }

      // Roster has no replacement level at native position: trigger manual replace selection
      return { success: false, message: "Alineación ocupada. Elige a quién reemplazar." };
    }

    replaceRosterPlayer(slot, newPlayerData) {
      if (!this.roster[slot]) return false;
      
      const playerInstance = {
        ...newPlayerData,
        id: `player_${newPlayerData.name.replace(/\s+/g, '')}_${Date.now()}`,
        stamina: 100,
        upgrades: { con: 0, pwr: 0, eye: 0, spd: 0, def: 0, sta: 0 }
      };

      this.roster[slot] = playerInstance;
      return true;
    }

    swapBattingOrder(idx1, idx2) {
      if (idx1 < 0 || idx1 >= 9 || idx2 < 0 || idx2 >= 9) return false;
      const temp = this.battingOrder[idx1];
      this.battingOrder[idx1] = this.battingOrder[idx2];
      this.battingOrder[idx2] = temp;
      return true;
    }

    swapDefensivePositions(slot1, slot2) {
      if (!slot1 || !slot2 || slot1 === slot2) return false;
      if (!this.roster[slot1] || !this.roster[slot2]) return false;
      const temp = this.roster[slot1];
      this.roster[slot1] = this.roster[slot2];
      this.roster[slot2] = temp;
      return true;
    }

    getEnemyTeam() {
      if (this.currentEnemy) return this.currentEnemy;

      // Mode 1: Story Mode - pick from customSeasonPool or OpponentsDatabase by Stage Tier
      if (this.selectedMode === 'story') {
        const stage = this.currentStageIndex; // 0 to 15 (16 stages total)
        const seasonData = this.seasonPoolData || (window.OpponentsDatabase && this.selectedSeasonYear ? window.OpponentsDatabase[this.selectedSeasonYear] : null);

        if (seasonData) {
          let tierPool = [];
          if (stage === 15) {
            // Stage 16 (index 15): Final Boss -> [YEAR] STARS
            tierPool = seasonData.boss ? [seasonData.boss] : [];
          } else if (stage <= 3) {
            // Stages 1-4 (indices 0-3): Low tier
            tierPool = seasonData.low || [];
          } else if (stage <= 7) {
            // Stages 5-8 (indices 4-7): Mid tier
            tierPool = seasonData.mid || [];
          } else if (stage <= 11) {
            // Stages 9-12 (indices 8-11): High tier
            tierPool = seasonData.high || [];
          } else {
            // Stages 13-15 (indices 12-14): High / contender teams
            tierPool = (seasonData.high && seasonData.high.length > 0) ? seasonData.high : seasonData.mid;
          }

          if (!this.encounteredTeams) this.encounteredTeams = new Set();
          let candidates = tierPool.filter(e => e && !this.encounteredTeams.has(e.id || e.name));
          if (candidates.length === 0) candidates = tierPool;
          if (candidates.length === 0) candidates = (this.customSeasonPool || []);

          const chosen = candidates[Math.floor(Math.random() * candidates.length)];
          if (chosen) {
            this.encounteredTeams.add(chosen.id || chosen.name);
            chosen.pitchers = sortPitchingStaff(chosen.pitchers);
            this.currentEnemy = chosen;
            return this.currentEnemy;
          }
        }

        let pool = (this.customSeasonPool && this.customSeasonPool.length > 0) ? this.customSeasonPool : (window.OpponentsPool || []);
        if (!this.encounteredTeams) this.encounteredTeams = new Set();
        let candidates = pool.filter(e => !this.encounteredTeams.has(e.id || e.name));
        if (candidates.length === 0) candidates = pool;
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        this.encounteredTeams.add(chosen.id || chosen.name);
        chosen.pitchers = sortPitchingStaff(chosen.pitchers);
        this.currentEnemy = chosen;
        return this.currentEnemy;
      }

      // Mode 2: Quick Play Mode - Fully Procedural Pitcher Generation (No presets)
      if (this.currentEnemy) return this.currentEnemy;

      const stage = this.currentStageIndex; // 0 to 15
      const fullPool = window.PITCHERS_POOL || [];
      if (!this.encounteredPitchers) this.encounteredPitchers = new Set();

      const pickPitcher = (candidates, preferredRole = null) => {
        let unvisited = candidates.filter(p => !this.encounteredPitchers.has((p.name || '') + '_' + (p.year || p.peak_year_display)));
        if (unvisited.length === 0) unvisited = candidates;
        if (preferredRole) {
          const roleMatches = unvisited.filter(p => (p.role || '').toUpperCase() === preferredRole.toUpperCase());
          if (roleMatches.length > 0) unvisited = roleMatches;
        }
        if (unvisited.length === 0) unvisited = fullPool;
        const chosen = unvisited[Math.floor(Math.random() * unvisited.length)];
        this.encounteredPitchers.add((chosen.name || '') + '_' + (chosen.year || chosen.peak_year_display));
        return chosen;
      };

      const createPitcherObj = (p, roleOverride = null) => {
        const role = roleOverride || p.role || 'SP';
        const staVal = p.sta !== undefined ? p.sta : (p.sta_val !== undefined ? p.sta_val : 50);
        const hp = (role === 'SP') ? Math.round(45 + (staVal / 99) * 75) : Math.round(25 + (staVal / 99) * 20);
        const yearVal = p.year || p.peak_year_display || p.peak_year || 1990;
        const nameVal = yearVal ? `${p.name} (${yearVal})` : p.name;
        return {
          name: nameVal,
          cleanName: p.name,
          role: role,
          pos: role,
          hp: hp,
          maxHp: hp,
          stf: p.str !== undefined ? p.str : (p.stf !== undefined ? p.stf : 50),
          ctl: p.ctl !== undefined ? p.ctl : 50,
          mov: p.grt !== undefined ? p.grt : (p.mov !== undefined ? p.mov : 50),
          sta: staVal,
          ovr: p.ovr || p._ovr || 50,
          rarity: p.rarity || 'Common',
          era: p.era || '',
          team: p.team || '',
          year: yearVal
        };
      };

      // Check if Super Boss Fight is active (Stage 15 Part 2: 4 Legendary Pitchers!)
      if (this.isSuperBossActive) {
        const legPool = fullPool.filter(p => p.rarity === 'Legendary');
        const p1 = createPitcherObj(pickPitcher(legPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(legPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(legPool, 'RP'), 'RP');
        const p4 = createPitcherObj(pickPitcher(legPool, 'RP'), 'RP');
        const selected = [p1, p2, p3, p4];
        this.currentEnemy = {
          id: `super_boss_${stage}_${Date.now()}`,
          name: `⚡ SUPER BOSS: ${p1.cleanName}`,
          tier: 'S',
          isBoss: true,
          isSuperBoss: true,
          pitchers: selected,
          _ovr: 96,
          era: p1.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Map 1 Boss (Stage 3): 1 Legendary, 1 Epic, 1 Rare
      if (stage === 3) {
        const legPool  = fullPool.filter(p => p.rarity === 'Legendary');
        const epicPool = fullPool.filter(p => p.rarity === 'Epic');
        const rarePool = fullPool.filter(p => p.rarity === 'Rare');
        const p1 = createPitcherObj(pickPitcher(legPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(epicPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(rarePool, 'RP'), 'RP');
        const selected = [p1, p2, p3];
        this.currentEnemy = {
          id: `boss_map1_${Date.now()}`,
          name: `BOSS: ${p1.cleanName}`,
          tier: 'A',
          isBoss: true,
          pitchers: selected,
          _ovr: 88,
          era: p1.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Map 2 Boss (Stage 7): 1 Legendary, 2 Epic
      if (stage === 7) {
        const legPool  = fullPool.filter(p => p.rarity === 'Legendary');
        const epicPool = fullPool.filter(p => p.rarity === 'Epic');
        const p1 = createPitcherObj(pickPitcher(legPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(epicPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(epicPool, 'RP'), 'RP');
        const selected = [p1, p2, p3];
        this.currentEnemy = {
          id: `boss_map2_${Date.now()}`,
          name: `BOSS: ${p1.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: selected,
          _ovr: 91,
          era: p1.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Map 3 Boss (Stage 11): 2 Legendary, 1 Epic
      if (stage === 11) {
        const legPool  = fullPool.filter(p => p.rarity === 'Legendary');
        const epicPool = fullPool.filter(p => p.rarity === 'Epic');
        const p1 = createPitcherObj(pickPitcher(legPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(legPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(epicPool, 'RP'), 'RP');
        const selected = [p1, p2, p3];
        this.currentEnemy = {
          id: `boss_map3_${Date.now()}`,
          name: `BOSS: ${p1.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: selected,
          _ovr: 94,
          era: p1.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Map 4 Boss Fight #1 (Stage 15): 3 Legendary
      if (stage === 15) {
        const legPool = fullPool.filter(p => p.rarity === 'Legendary');
        const p1 = createPitcherObj(pickPitcher(legPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(legPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(legPool, 'RP'), 'RP');
        const selected = [p1, p2, p3];
        this.currentEnemy = {
          id: `boss_map4_part1_${Date.now()}`,
          name: `BOSS FINAL: ${p1.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: selected,
          _ovr: 96,
          era: p1.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Regular stages (Map 1 to 4)
      let minOvr = 60, maxOvr = 74;
      let allowedRarities = ['Common', 'Uncommon'];
      if (stage >= 4 && stage <= 7) {
        minOvr = 72; maxOvr = 82;
        allowedRarities = ['Uncommon', 'Rare'];
      } else if (stage >= 8 && stage <= 11) {
        minOvr = 80; maxOvr = 88;
        allowedRarities = ['Rare', 'Epic'];
      } else if (stage >= 12) {
        minOvr = 85; maxOvr = 95;
        allowedRarities = ['Epic', 'Legendary'];
      }

      const stagePool = fullPool.filter(p => allowedRarities.includes(p.rarity) || ((p.ovr || 50) >= minOvr && (p.ovr || 50) <= maxOvr));
      const p1 = createPitcherObj(pickPitcher(stagePool, 'SP'), 'SP');
      const p2 = createPitcherObj(pickPitcher(stagePool), 'SP');
      const p3 = createPitcherObj(pickPitcher(stagePool, 'RP'), 'RP');
      const selected = [p1, p2, p3];

      this.currentEnemy = {
        id: `opp_team_stage_${stage}_${Date.now()}`,
        name: `${p1.cleanName} & Rotación`,
        tier: 'B',
        isBoss: false,
        pitchers: selected,
        _ovr: p1.ovr,
        era: p1.era,
        rarity: p1.rarity
      };

      return this.currentEnemy;
    }

    getSimLineups() {
      // Return batters in custom battingOrder sequence (skip null slots)
      const ourLineup = this.battingOrder.map(slot => {
        const player = this.roster[slot];
        if (!player) return null;
        const eff = this.getEffectiveStats(player, slot);
        eff.hp = 100;
        eff.maxHp = 100;
        return eff;
      }).filter(Boolean);

      const enemy = this.getEnemyTeam();
      
      const enemyPitchers = enemy.pitchers.map(p => {
        return {
          ...p,
          hp: p.hp || p.maxHp,
          maxHp: p.maxHp,
          upgrades: { con: 0, pwr: 0, eye: 0, spd: 0, def: 0, sta: 0 }
        };
      });

      return {
        away: {
          name: "Mis Leyendas",
          lineup: ourLineup
        },
        home: {
          name: enemy.name,
          pitchers: enemyPitchers
        }
      };
    }

    postMatchDebrief(simResult) {
      // Trait: Resistencia Inagotable — batters lose 6 instead of 12 stamina
      const staminaLoss = this.hasTrait('endless_stamina') ? 6 : 12;
      Object.keys(this.roster).forEach(pos => {
        const player = this.roster[pos];
        if (player) {
          player.stamina = Math.max(0, player.stamina - staminaLoss);
        }
      });

      // Record cumulative run stats for this match
      this.recordMatchStats(simResult.matchEvents || [], simResult.enemyPitchers || []);

      const currentEnemy = this.getEnemyTeam();
      const won = simResult.winner === 'away';

      this.history.push({
        stage: this.currentStageIndex,
        enemyName: currentEnemy.name,
        ourScore: simResult.runsScored,
        enemyScore: simResult.enemyPitchers ? (simResult.enemyPitchers.length - simResult.pitchersDefeated) : 0,
        won
      });

      const isBossStage = (this.currentStageIndex === 3 || this.currentStageIndex === 7 || this.currentStageIndex === 11 || this.currentStageIndex === 15);

      if (won) {
        // Stage 15 (Map 4 Boss Fight #1) victory -> Trigger SUPER BOSS FIGHT Part 2!
        if (this.currentStageIndex === 15 && !this.isSuperBossActive) {
          this.isSuperBossActive = true;
          this.currentEnemy = null;
          const superBossTeam = this.getEnemyTeam();
          this.teamHP = Math.min(100, this.teamHP + 30);
          this.teamShield = this.teamShieldMax;
          return {
            won: true,
            isSuperBossTrigger: true,
            superBossTeam,
            message: `⚡ ¡SUPER BOSS FIGHT! ⚡ ¡Derrotaste al primer grupo de leyendas! AHORA ENFRENTA A LA ROTACIÓN SUPREMA DE 4 LEYENDAS.`
          };
        }

        // Super Boss was active and player just won it -> TRUE VICTORY!
        if (this.isSuperBossActive) {
          this.isSuperBossActive = false;
          this.currentEnemy = null;
          return {
            won: true,
            isTrueVictory: true,
            message: `🏆 ¡CAMPEÓN ABSOLUTO! ¡Derrotaste a la Rotación Suprema de 4 Leyendas! BaseRogue conquistado.`
          };
        }

        // Boss Maps 1-3: offer a Trait reward before continuing
        const isTraitBossMap = (this.currentStageIndex === 3 || this.currentStageIndex === 7 || this.currentStageIndex === 11);
        const earnings = isBossStage ? 20 : 5;
        // Trait: Negociador de Élite — +$10 extra per win
        const eliteBonus = this.hasTrait('elite_negotiator') ? 10 : 0;
        this.budget += earnings + eliteBonus;
        this.currentEnemy = null;

        if (isTraitBossMap) {
          const traitChoices = this.getRandomTraitChoices(3);
          return {
            won: true,
            isBossStage: true,
            isTraitReward: true,
            traitChoices,
            earnings: earnings + eliteBonus,
            message: `¡Victoria de Jefe! +$${earnings + eliteBonus}. Elige una Trait Pasiva de Leyenda.`
          };
        }

        return {
          won: true,
          isBossStage,
          earnings: earnings + eliteBonus,
          message: isBossStage 
            ? `¡Victoria! Derrotaste al JEFE ${currentEnemy.name}. ¡+$${earnings + eliteBonus} y recompensa de élite!` 
            : `¡Victoria! Derrotaste a la rotación de ${currentEnemy.name} en 3 innings. ¡+$${earnings + eliteBonus}!`
        };
      } else {
        this.runActive = false;
        this.currentEnemy = null;
        return {
          won: false,
          message: `Derrota. Finalizaron los 3 innings (9 outs) antes de derrotar a toda la rotación de ${currentEnemy.name}.`
        };
      }
    }

    getRandomEvent() {
      const idx = Math.floor(Math.random() * ManagerEventsList.length);
      return ManagerEventsList[idx];
    }
  }

  window.Game = new GameState();
})();
