// BaseRogue Game State Manager
// Refined for Lineup order controls, Bench removal, and Manager Decisions Events

(function() {
  const ManagerEventsList = [
    {
      id: "ev_cork",
      title: "Bates de Contrabando",
      desc: "Un misterioso comerciante te ofrece bates modificados con corcho. Aumentará la potencia de tu equipo, pero afectará el contacto de la bola.",
      choices: [
        {
          text: "Modificar bates (+15 Fuerza, -4 Contacto a todo el equipo)",
          cost: 15,
          action: (G) => {
            G.activeItemBonuses.teamPwr += 15;
            G.activeItemBonuses.teamCon -= 4;
          }
        },
        {
          text: "Rechazar oferta (No hacer nada)",
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_fitness",
      title: "Preparador Físico Retro",
      desc: "Un entrenador físico del campeonato de 1982 se ofrece a coordinar una rutina de acondicionamiento intensa para tu alineación.",
      choices: [
        {
          text: "Rutina cardiovascular (+40 Stamina a toda la alineación)",
          cost: 20,
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.min(100, G.roster[pos].stamina + 40);
            });
          }
        },
        {
          text: "Continuar sin entrenar",
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_cryo",
      title: "Cápsula de Hidroterapia",
      desc: "Instalas una cámara de recuperación avanzada en el vestuario. Cura a todo el equipo al instante, pero es costosa.",
      choices: [
        {
          text: "Criogenización (Recupera 100% de Stamina a todos)",
          cost: 30,
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = 100;
            });
          }
        },
        {
          text: "Prescindir de la cámara",
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_pinetar",
      title: "Brea de Pino Japonesa",
      desc: "Consigues un tarro de brea especial que mejora el agarre y agarre del bate, afinando el contacto.",
      choices: [
        {
          text: "Comprar brea (+8 Contacto global a todo el equipo)",
          cost: 12,
          action: (G) => {
            G.activeItemBonuses.teamCon += 8;
          }
        },
        {
          text: "Seguir igual",
          cost: 0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_bribe",
      title: "Cazatalento en Apuros",
      desc: "Un caza-talentos te ofrece dinero del presupuesto del equipo rival a cambio de canjear un poco de enfoque deportivo.",
      choices: [
        {
          text: "Aceptar dinero (Ganas +$45 presupuesto, pero pierdes -5 Disciplina/Eye global)",
          cost: -45, // negative cost means gaining budget
          action: (G) => {
            G.activeItemBonuses.teamEye -= 5;
          }
        },
        {
          text: "Denunciarlo al comisionado (Ganas +8 Disciplina/Eye global en tu equipo)",
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

  class GameState {
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

    // ── DRAFT: pick one player in the current round ──────────────────────────────
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
         const eff = this.getEffectiveStats(p, item.slot) || p;
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
      if (r === 1) return { label: 'EPIC O SUPERIOR', rarities: ['Legendary','Epic'], icon: '💎' };
      if (r === 2) return { label: 'RARE O SUPERIOR',  rarities: ['Legendary','Epic','Rare'], icon: '🔵' };
      if (r === 3) return { label: 'UNCOMMON O SUPERIOR', rarities: ['Legendary','Epic','Rare','Uncommon'], icon: '🟢' };
      if (r >= 4 && r <= 6) return { label: 'COMMON OBLIGATORIO', rarities: ['Common'], icon: '⚪' };
      return { label: 'RONDA LIBRE — CUALQUIER RAREZA', rarities: null, icon: '🎲' };
    }

    // ── DRAFT: get 3 random picks for the current round (rarity-filtered) ──
    getDraftRoundPicks() {
      if (this.currentDraftPicks && this.currentDraftPicks.round === this.draftRound) {
        return this.currentDraftPicks.picks;
      }

      const pool = window.PlayersDB.LAHMAN_POOL || [];
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
      const pool = window.PlayersDB.LAHMAN_POOL || [];
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
        const ovr = (p.con||0)*0.30 + (p.pwr||0)*0.30 + (p.spd||0)*0.15 + (p.def||0)*0.15 + (p.eye||0)*0.10;
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
          subtitle: "Inicio de temporada - Dificultad: Normal",
          theme: "zone-minor",
          bossLabel: "Juego de Apertura",
          bossIcon: "🌱",
          stages: [0, 1, 2, 3]
        },
        {
          id: 1,
          name: "All-Star Break",
          subtitle: "Mitad de temporada - Dificultad: Difícil",
          theme: "zone-major",
          bossLabel: "All-Star Game",
          bossIcon: "⭐",
          stages: [4, 5, 6, 7]
        },
        {
          id: 2,
          name: "Pennant Chase",
          subtitle: "Final de temporada - Dificultad: Experto",
          theme: "zone-pennant",
          bossLabel: "Campeón de Liga",
          bossIcon: "🏆",
          stages: [8, 9, 10, 11]
        },
        {
          id: 3,
          name: "Playoffs",
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
              // 30% match (mini battle), 25% draft, 25% event, 12% train, 8% rest
              if (roll < 0.30)      type = 'match';
              else if (roll < 0.55) type = 'draft';
              else if (roll < 0.80) type = 'event';
              else if (roll < 0.92) type = 'train';
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

    getEffectiveStats(player, slotPosition) {
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
      const synergies = this.calculateActiveSynergies();
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
        const teamCount = this.getActiveFranchiseCounts()[player.team] || 0;
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

    getActiveFranchiseCounts() {
      const counts = {};
      Object.keys(this.roster).forEach(pos => {
        const player = this.roster[pos];
        if (player && !player.isReplacement && player.team && player.team !== 'ROOK') {
          counts[player.team] = (counts[player.team] || 0) + 1;
        }
      });
      return counts;
    }

    calculateActiveSynergies() {
      const eraCounts = {};
      Object.keys(this.roster).forEach(pos => {
        const player = this.roster[pos];
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

    // ── MID-GAME EVENT: FIRMA LEYENDA — picks Uncommon or higher ──────────
    getDraftPicks() {
      const pool = window.PlayersDB.LAHMAN_POOL || window.PlayersDB.PLAYERS_POOL || [];
      const onRosterNames = new Set(Object.values(this.roster).filter(Boolean).map(x => x.name));

      // Sign Legend event: Uncommon or higher (no Commons)
      const allowedRarities = ['Legendary', 'Epic', 'Rare', 'Uncommon'];
      const filtered = pool.filter(p =>
        !onRosterNames.has(p.name) && allowedRarities.includes(p.rarity || 'Common')
      );

      const selectedPicks = [];
      const temp = [...filtered];
      while (selectedPicks.length < 3 && temp.length > 0) {
        const idx = Math.floor(Math.random() * temp.length);
        selectedPicks.push(temp.splice(idx, 1)[0]);
      }
      // Fallback
      if (selectedPicks.length < 3) {
        const fallback = pool.filter(p => !onRosterNames.has(p.name) && !selectedPicks.some(x => x.name === p.name));
        while (selectedPicks.length < 3 && fallback.length > 0) {
          const idx = Math.floor(Math.random() * fallback.length);
          selectedPicks.push(fallback.splice(idx, 1)[0]);
        }
      }
      return selectedPicks;
    }

    getPostMatchDraftPicks(isBoss = false) {
      const pool = window.PlayersDB.LAHMAN_POOL || [];
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

      const selected = [];
      const tempFiltered = [...filtered];
      while (selected.length < 3 && tempFiltered.length > 0) {
        const idx = Math.floor(Math.random() * tempFiltered.length);
        selected.push(tempFiltered.splice(idx, 1)[0]);
      }
      // Fallback if pool too small
      if (selected.length < 3) {
        const fallback = pool.filter(p => !onRosterNames.has(p.name) && !selected.some(x => x.name === p.name));
        while (selected.length < 3 && fallback.length > 0) {
          const idx = Math.floor(Math.random() * fallback.length);
          selected.push(fallback.splice(idx, 1)[0]);
        }
      }
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

    getEnemyTeam() {
      if (this.currentEnemy) return this.currentEnemy;

      const pool = window.OpponentsPool || [];
      const stage = this.currentStageIndex;

      // Map 16-stage zone system to tiers
      // Zone 1 (stages 0-3): Low  | Zone 1 boss (stage 3): Low boss
      // Zone 2 (stages 4-7): Mid  | Zone 2 boss (stage 7): Mid boss
      // Zone 3 (stages 8-11): High | Zone 3 boss (stage 11): High boss
      // Zone 4 (stages 12-15): Final_Boss | Zone 4 boss (stage 15): Final_Boss boss
      let targetTier = 'Low';
      const isBossStage = (stage === 3 || stage === 7 || stage === 11 || stage === 15);

      if (stage <= 3) {
        targetTier = 'Low';
      } else if (stage <= 7) {
        targetTier = 'Mid';
      } else if (stage <= 11) {
        targetTier = 'High';
      } else {
        targetTier = 'Final_Boss';
      }

      // For boss stages: prefer isBoss:true entries from that tier
      let candidates = pool.filter(e => e.tier === targetTier);
      if (isBossStage) {
        const bossOnly = candidates.filter(e => e.isBoss);
        if (bossOnly.length > 0) candidates = bossOnly;
      } else {
        // For regular stages: prefer non-boss entries
        const nonBoss = candidates.filter(e => !e.isBoss);
        if (nonBoss.length > 0) candidates = nonBoss;
      }

      if (candidates.length === 0) candidates = pool; // absolute fallback

      this.currentEnemy = candidates[Math.floor(Math.random() * candidates.length)];
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
      // Reduce stamina of active batters (flat 12 loss for playing the 3-inning match)
      Object.keys(this.roster).forEach(pos => {
        const player = this.roster[pos];
        if (player) {
          player.stamina = Math.max(0, player.stamina - 12);
        }
      });

      const currentEnemy = this.getEnemyTeam();
      const won = simResult.winner === 'away';

      this.history.push({
        stage: this.currentStageIndex,
        enemyName: currentEnemy.name,
        ourScore: simResult.runsScored,
        enemyScore: simResult.enemyPitchers.length - simResult.pitchersDefeated,
        won
      });

      this.currentEnemy = null; // Reset for next match

      const isBossStage = (this.currentStageIndex === 3 || this.currentStageIndex === 7 || this.currentStageIndex === 11 || this.currentStageIndex === 15);

      if (won) {
        const earnings = isBossStage ? 20 : 5;
        this.budget += earnings;
        return {
          won: true,
          isBossStage,
          earnings,
          message: isBossStage 
            ? `¡Victoria! Derrotaste al JEFE ${currentEnemy.name}. ¡+$${earnings} y recompensa de élite!` 
            : `¡Victoria! Derrotaste a la rotación de ${currentEnemy.name} en 3 innings. ¡+$${earnings}!`
        };
      } else {
        this.runActive = false;
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
