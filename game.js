// BaseRogue Game State Manager
// Refined for Lineup order controls, Bench removal, and Manager Decisions Events

(function() {
  const ManagerEventsList = [
    {
      id: "ev_cork",
      icon: "🪵",
      get title() { return typeof window.t==='function'?window.t('ev.cork.title'):'Bates de Contrabando'; },
      get desc() { return typeof window.t==='function'?window.t('ev.cork.desc'):'Un misterioso carpintero se aproxima al vestuario con bates modificados con corcho.'; },
      choices: [
        {
          icon: "⚙️",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.cork.choice1'):'Modificación Estándar (+10 PWR, -2 CON)'; },
          cost: 15,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamPwr += 10;
            G.activeItemBonuses.teamCon -= 2;
          }
        },
        {
          icon: "🔥",
          risk: "high",
          text: "Corcho Masivo Ilegal (+25 PWR, -5 CON)",
          cost: 5,
          successChance: 0.60,
          get successMsg() { return typeof window.t==='function'?window.t('ev.cork.suc'):'¡Bates modificados con éxito! Tu alineación obtiene +25 PWR y -5 CON.'; },
          action: (G) => {
            G.activeItemBonuses.teamPwr += 25;
            G.activeItemBonuses.teamCon -= 5;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.cork.fail'):'¡EL UMPIRE DESCUBRIÓ LOS BATES! La liga confisca los bates y te impone una multa de -$10.'; },
          failAction: (G) => {
            G.budget = Math.max(0, G.budget - 10);
          }
        },
        {
          icon: "🛡️",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.choice_reject'):'Rechazar Oferta (No hacer nada)'; },
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_sign_stealing",
      icon: "📡",
      get title() { return typeof window.t==='function'?window.t('ev.signs.title'):'El Espía de Señas'; },
      get desc() { return typeof window.t==='function'?window.t('ev.signs.desc'):'Un ex-receptor retirado afirma conocer la secuencia secreta de lanzamientos.'; },
      choices: [
        {
          icon: "💼",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.signs.choice1'):'Comprar Informe VIP (+15 EYE, +8 CON)'; },
          cost: 22,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamEye += 15;
            G.activeItemBonuses.teamCon += 8;
          }
        },
        {
          icon: "⚡",
          risk: "moderate",
          get text() { return typeof window.t==='function'?window.t('ev.signs.choice2'):'Robo de Señas Callejero (+20 EYE)'; },
          cost: 8,
          successChance: 0.65,
          get successMsg() { return typeof window.t==='function'?window.t('ev.signs.suc'):'¡Señas interceptadas! Tu equipo obtiene +20 EYE (Disciplina).'; },
          action: (G) => {
            G.activeItemBonuses.teamEye += 20;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.signs.fail'):'¡Descubiertos en cámara! El comisionado sanciona al equipo con -$15 Presupuesto.'; },
          failAction: (G) => {
            G.budget = Math.max(0, G.budget - 15);
          }
        },
        {
          icon: "⚾",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.choice_clean'):'Jugar Limpio (Rechazar)'; },
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_fitness",
      icon: "🏋️",
      get title() { return typeof window.t==='function'?window.t('ev.fitness.title'):'Preparador Físico Retro'; },
      get desc() { return typeof window.t==='function'?window.t('ev.fitness.desc'):'Un legendario preparador físico del campeonato de 1982.'; },
      choices: [
        {
          icon: "🔋",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.fitness.choice1'):'Rutina Aeróbica Estándar (+40 Stamina a todos)'; },
          cost: 18,
          successChance: 1.0,
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.min(100, G.roster[pos].stamina + 40);
            });
          }
        },
        {
          icon: "⚡",
          risk: "high",
          get text() { return typeof window.t==='function'?window.t('ev.fitness.choice2'):'Acondicionamiento Extremo (100% Stamina)'; },
          cost: 10,
          successChance: 0.60,
          get successMsg() { return typeof window.t==='function'?window.t('ev.fitness.suc'):'¡Sesión milagrosa! Toda la plantilla recupera el 100% de Stamina.'; },
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = 100;
            });
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.fitness.fail'):'¡Sobrecarga muscular masiva! El equipo se agota y pierde -15 Stamina.'; },
          failAction: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.max(10, G.roster[pos].stamina - 15);
            });
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.choice_skip'):'Continuar sin entrenar'; },
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_hypnosis",
      icon: "🧠",
      get title() { return typeof window.t==='function'?window.t('ev.hyp.title'):'Hipnosis de Bateo Focalizado'; },
      get desc() { return typeof window.t==='function'?window.t('ev.hyp.desc'):'Un psicólogo deportivo ofrece reprogramar la concentración mental de tus bateadores.'; },
      choices: [
        {
          icon: "🎯",
          risk: "moderate",
          get text() { return typeof window.t==='function'?window.t('ev.hyp.choice1'):'Sesión de Trance Profundo (+14 EYE, +10 CON)'; },
          cost: 14,
          successChance: 0.70,
          get successMsg() { return typeof window.t==='function'?window.t('ev.hyp.suc'):'¡Mente lúcida! Tu equipo obtiene +14 EYE y +10 CON.'; },
          action: (G) => {
            G.activeItemBonuses.teamEye += 14;
            G.activeItemBonuses.teamCon += 10;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.hyp.fail'):'¡Desorientación hipnótica! Los bateadores dudan en el conteo (-8 EYE).'; },
          failAction: (G) => {
            G.activeItemBonuses.teamEye -= 8;
          }
        },
        {
          icon: "🛡️",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.choice_reject_therapy'):'Rechazar Psicoterapia'; },
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_graphene_bat",
      icon: "🔬",
      get title() { return typeof window.t==='function'?window.t('ev.graphene.title'):'Bates de Aleación Experimental'; },
      get desc() { return typeof window.t==='function'?window.t('ev.graphene.desc'):'Un laboratorio tecnológico propone probar bates con fibra de carbono y titanio.'; },
      choices: [
        {
          icon: "💎",
          risk: "safe",
          text: "Comprar Modelo Homologado (+12 PWR)",
          cost: 20,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamPwr += 12;
          }
        },
        {
          icon: "💥",
          risk: "high",
          text: "Prototipo Hyper-Carbono (+28 PWR)",
          cost: 6,
          successChance: 0.55,
          successMsg: "¡Poder devastador! Tu equipo obtiene +28 PWR extra.",
          action: (G) => {
            G.activeItemBonuses.teamPwr += 28;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.graphene.fail'):'¡El bate se astilló en pedazos! Pierdes la inversión y restas -5 PWR.'; },
          failAction: (G) => {
            G.activeItemBonuses.teamPwr -= 5;
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.graphene.choice3'):'Pasar de la tecnología'; },
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_tabloid",
      icon: "📰",
      get title() { return typeof window.t==='function'?window.t('ev.tabloid.title'):'Prensa Sensacionalista'; },
      get desc() { return typeof window.t==='function'?window.t('ev.tabloid.desc'):'Un importante periódico deportivo quiere la primicia del vestuario.'; },
      choices: [
        {
          icon: "💰",
          risk: "moderate",
          text: "Vender Exclusiva (+$35 Presupuesto)",
          cost: -35,
          successChance: 0.70,
          get successMsg() { return typeof window.t==='function'?window.t('ev.tabloid.suc'):'¡Entrevista vendida con éxito! Recibes +$35 de presupuesto.'; },
          action: (G) => {},
          get failMsg() { return typeof window.t==='function'?window.t('ev.tabloid.fail'):'¡El artículo desató polémica! La presión mediática causa estrés (-15 Stamina).'; },
          failAction: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.max(10, G.roster[pos].stamina - 15);
            });
          }
        },
        {
          icon: "🤝",
          risk: "safe",
          text: "Conferencia de Prensa Oficial (+$10 Presupuesto)",
          cost: -10,
          successChance: 1.0,
          action: (G) => {}
        },
        {
          icon: "🚪",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.tabloid.choice3'):'Cerrar las Puertas (No hablar)'; },
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_cryo",
      icon: "❄️",
      get title() { return typeof window.t==='function'?window.t('ev.cryo.title'):'Cápsula de Hidroterapia'; },
      get desc() { return typeof window.t==='function'?window.t('ev.cryo.desc'):'Instalas una cámara de criogenización para rejuvenecer a tus bateadores.'; },
      choices: [
        {
          icon: "🧪",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.cryo.choice1'):'Criogenización Completa (100% Stamina a todos)'; },
          cost: 28,
          successChance: 1.0,
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = 100;
            });
          }
        },
        {
          icon: "🧊",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.cryo.choice2'):'Bañera de Hielo Rápida (+40 Stamina a todos)'; },
          cost: 12,
          successChance: 1.0,
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.min(100, G.roster[pos].stamina + 40);
            });
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.cryo.choice3'):'Prescindir de la cámara'; },
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_pinetar",
      icon: "🍯",
      get title() { return typeof window.t==='function'?window.t('ev.pinetar.title'):'Brea de Pino Japonesa'; },
      get desc() { return typeof window.t==='function'?window.t('ev.pinetar.desc'):'Un distribuidor ofrece resina de brea de pino especial.'; },
      choices: [
        {
          icon: "✨",
          risk: "safe",
          text: "Brea de Grado Profesional (+8 CON)",
          cost: 12,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamCon += 8;
          }
        },
        {
          icon: "🧪",
          risk: "high",
          get text() { return typeof window.t==='function'?window.t('ev.pinetar.choice2'):'Fórmula Casera Ultra-Pegajosa (+18 CON)'; },
          cost: 5,
          successChance: 0.55,
          successMsg: "¡Agarre extraordinario! Tu equipo gana +18 Contacto.",
          action: (G) => {
            G.activeItemBonuses.teamCon += 18;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.pinetar.fail'):'¡El umpire nota el residuo ilícito! Te sanciona restando -10 Defensa.'; },
          failAction: (G) => {
            G.activeItemBonuses.teamDef -= 10;
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          text: "Seguir igual",
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_bribe",
      icon: "💼",
      title: "Cazatalento en Apuros",
      desc: "Un cazatalentos te ofrece presupuesto del equipo rival a cambio de canjear un poco de enfoque deportivo.",
      choices: [
        {
          icon: "💵",
          risk: "moderate",
          text: "Aceptar Dinero (+$45 Presupuesto, -5 EYE)",
          cost: -45,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamEye -= 5;
          }
        },
        {
          icon: "⚖️",
          risk: "safe",
          text: "Denunciarlo al Comisionado (+10 EYE, +5 DEF)",
          cost: 10,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamEye += 10;
            G.activeItemBonuses.teamDef += 5;
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          text: "Ignorar la llamada",
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_spikes",
      icon: "👟",
      get title() { return typeof window.t==='function'?window.t('ev.spikes.title'):'Clavos Ligeros Experimentales'; },
      get desc() { return typeof window.t==='function'?window.t('ev.spikes.desc'):'Un fabricante local te ofrece calzado de clavos de aluminio ultraligeros.'; },
      choices: [
        {
          icon: "⚡",
          risk: "safe",
          text: "Equipar Calzado Profesional (+12 SPD)",
          cost: 15,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamSpd += 12;
          }
        },
        {
          icon: "🚀",
          risk: "moderate",
          text: "Prototipo de Clavos Turbo (+25 SPD)",
          cost: 8,
          successChance: 0.65,
          successMsg: "¡Velocidad explosiva! Tu equipo gana +25 SPD.",
          action: (G) => {
            G.activeItemBonuses.teamSpd += 25;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.spikes.fail'):'¡Mala tracción! Los clavos resbalan y causan torceduras (-10 Stamina a todos).'; },
          failAction: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.max(10, G.roster[pos].stamina - 10);
            });
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          text: "Rechazar",
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_gloves",
      icon: "🧤",
      get title() { return typeof window.t==='function'?window.t('ev.gloves.title'):'Guantes de Piel Curtida'; },
      get desc() { return typeof window.t==='function'?window.t('ev.gloves.desc'):'Un coleccionista ofrece guantes clásicos pesados.'; },
      choices: [
        {
          icon: "🛡️",
          risk: "safe",
          text: "Comprar Guantes Legendarios (+14 DEF)",
          cost: 14,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamDef += 14;
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          text: "Rechazar",
          cost: 0,
          successChance: 1.0,
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

      // Era of Build: the single era the player actively commits their run to.
      // Only this era's synergy scales past T1 (2+ players) — see setBuildEra().
      this.buildEra = null;

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

    // Set (or clear with null) the player's chosen Era of Build for this run.
    setBuildEra(era) {
      const validEras = window.PlayersDB ? Object.values(window.PlayersDB.Eras) : [];
      this.buildEra = (era && validEras.includes(era)) ? era : null;
      return this.buildEra;
    }

    // Display-only tier resolver — mirrors InteractiveBattle._calculateActiveSynergies
    // in simulation.js exactly (T1=2, T2=4, T3=6, T4=8), for rendering the Synergies
    // panel outside of combat. Not used by battle logic itself.
    getEraTier(era, count) {
      if (count < 2) return 0;
      if (era === this.buildEra) {
        return count >= 8 ? 4 : count >= 6 ? 3 : count >= 4 ? 2 : 1;
      }
      return 1;
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

      // Track games played (g) for each batter appearing in this match
      const battersInMatch = new Set();
      for (const ev of simEvents) {
        if (ev.playType !== 'PLAY' && ev.type !== 'PLAY') continue;
        const rawName = ev.activeBatter || ev.batterName;
        if (!rawName) continue;
        const name = rawName.replace(/\s*\(\d{4}\)$/, '').trim();
        battersInMatch.add(name);
      }

      battersInMatch.forEach(name => {
        if (!this.runBatterStats[name]) {
          this.runBatterStats[name] = { g: 0, ab: 0, h: 0, bb: 0, so: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, sb: 0 };
        }
        this.runBatterStats[name].g = (this.runBatterStats[name].g || 0) + 1;
      });

      // Accumulate batter stats from events
      for (const ev of simEvents) {
        if (ev.playType !== 'PLAY' && ev.type !== 'PLAY') continue;
        const rawName = ev.activeBatter || ev.batterName;
        if (!rawName) continue;
        const name = rawName.replace(/\s*\(\d{4}\)$/, '').trim();

        if (!this.runBatterStats[name]) {
          this.runBatterStats[name] = { g: 0, ab: 0, h: 0, bb: 0, so: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, sb: 0 };
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

        if (ev.didSteal || (ev.playText && ev.playText.includes('ROBO DE BASE'))) {
          s.sb = (s.sb || 0) + 1;
        }

        if (ev.runsThisTurn || ev.runsScored) {
          s.rbi += (ev.runsThisTurn || ev.runsScored);
        }
      }

      // Accumulate pitcher stats
      if (enemyPitchers && enemyPitchers.length) {
        for (const p of enemyPitchers) {
          const rawPName = p.cleanName || p.name || 'Unknown Pitcher';
          const pName = rawPName.replace(/\s*\(\d{4}\)$/, '').trim();
          if (!this.runPitcherStats[pName]) {
            this.runPitcherStats[pName] = { outs: 0, k: 0, bb: 0, h: 0, hr: 0, er: 0 };
          }
        }

        let currentPitcherIdx = 0;
        for (const ev of simEvents) {
          if (ev.playType === 'KO_PITCHER' || ev.type === 'KO_PITCHER') {
            if (currentPitcherIdx < enemyPitchers.length - 1) currentPitcherIdx++;
            continue;
          }
          if (ev.playType !== 'PLAY' && ev.type !== 'PLAY') continue;

          let pName = null;
          if (ev.activePitcher && (ev.activePitcher.name || ev.activePitcher.cleanName)) {
            const rawPName = ev.activePitcher.cleanName || ev.activePitcher.name;
            pName = rawPName.replace(/\s*\(\d{4}\)$/, '').trim();
          } else {
            const p = enemyPitchers[currentPitcherIdx];
            if (p) {
              const rawPName = p.cleanName || p.name || 'Unknown Pitcher';
              pName = rawPName.replace(/\s*\(\d{4}\)$/, '').trim();
            }
          }

          if (!pName) continue;

          if (!this.runPitcherStats[pName]) {
            this.runPitcherStats[pName] = { outs: 0, k: 0, bb: 0, h: 0, hr: 0, er: 0 };
          }
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
      
      // Leadoff's speedScore leans on EYE as an OBP proxy — sabermetric weight,
      // kept as a named constant so it's easy to recalibrate later.
      const LEADOFF_EYE_WEIGHT = 1.3;

      drafted.forEach(item => {
         const p = item.p;
         // Use getEffectiveStats so it accounts for Batting Cage upgrades and Era traits
         const eff = this.getEffectiveStats(p, item.slot, rosterDict) || p;
         const effCon = eff.con || 40;
         const effPwr = eff.pwr || 35;
         const effEye = eff.eye || 40;
         const effSpd = eff.spd || 40;
         item.speedScore = effSpd * 1.5 + effCon + effEye * LEADOFF_EYE_WEIGHT;
         item.powerScore = effPwr * 1.5 + effCon;
         item.overall = effCon * 1.2 + effPwr + effEye + effSpd * 0.2;
         item.contact = effCon + effEye * 0.5;
      });

      const newOrder = [];

      // 3rd is the scarcest slot — reserve the single best overall bat from the
      // whole roster FIRST, before anyone else (including cleanup) can claim it.
      drafted.sort((a,b) => b.overall - a.overall);
      const third = drafted[0];
      third.targetSlot = 2;
      drafted.splice(0, 1);
      newOrder.push(third);

      if (drafted.length > 0) {
        drafted.sort((a,b) => b.powerScore - a.powerScore);
        const cleanup = drafted[0];
        cleanup.targetSlot = 3;
        drafted.splice(0, 1);
        newOrder.push(cleanup);
      }

      if (drafted.length > 0) {
        drafted.sort((a,b) => b.overall - a.overall);
        let topHalf = drafted.slice(0, Math.max(2, Math.ceil(drafted.length/2)));
        topHalf.sort((a,b) => b.speedScore - a.speedScore);
        const leadoff = topHalf[0];
        leadoff.targetSlot = 0;
        drafted.splice(drafted.indexOf(leadoff), 1);
        newOrder.push(leadoff);
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
      const toWeighted = (p) => {
        let isNeeded = false;
        if (missingPos.includes(p.pos)) isNeeded = true;
        if (p.sec_pos && p.sec_pos.split(', ').some(sp => missingPos.includes(sp))) isNeeded = true;
        return { player: p, weight: isNeeded ? 6 : 1 };
      };

      // Story Mode: ~80% of offered cards are restricted to players actually
      // active during the selected season (debut_year<=year<=last_year), the
      // remaining ~20% is a wildcard from any era — flagged isInterEra so it
      // gets a visual marker and a 2x synergy weight (see _calculateActiveSynergies
      // / renderSynergiesAndItems), as a deliberate incentive to take it.
      const isStoryYearAware = this.selectedMode === 'story' && this.selectedSeasonYear;
      let activeWeighted = null;
      let fullWeighted = available.map(toWeighted);
      if (isStoryYearAware) {
        const year = parseInt(this.selectedSeasonYear, 10);
        activeWeighted = available
          .filter(p => p.debut_year !== undefined && p.last_year !== undefined && p.debut_year <= year && p.last_year >= year)
          .map(toWeighted);
      }

      const pickWeighted = (list) => {
        if (!list.length) return null;
        let totalWeight = list.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedIdx = list.length - 1;
        for (let i = 0; i < list.length; i++) {
          if (random < list[i].weight) { selectedIdx = i; break; }
          random -= list[i].weight;
        }
        return list.splice(selectedIdx, 1)[0].player;
      };
      const removeFromList = (list, playerName) => {
        const idx = list.findIndex(item => item.player.name === playerName);
        if (idx !== -1) list.splice(idx, 1);
      };

      const picks = [];
      while (picks.length < 3 && (fullWeighted.length > 0 || (activeWeighted && activeWeighted.length > 0))) {
        const useActive = isStoryYearAware && activeWeighted.length > 0 && Math.random() < 0.8;
        let chosen = useActive ? pickWeighted(activeWeighted) : pickWeighted(fullWeighted);
        if (!chosen) chosen = useActive ? pickWeighted(fullWeighted) : (activeWeighted ? pickWeighted(activeWeighted) : null);
        if (!chosen) break;
        if (activeWeighted) removeFromList(activeWeighted, chosen.name);
        removeFromList(fullWeighted, chosen.name);
        if (isStoryYearAware && !useActive) {
          const year = parseInt(this.selectedSeasonYear, 10);
          const wasActive = chosen.debut_year !== undefined && chosen.last_year !== undefined && chosen.debut_year <= year && chosen.last_year >= year;
          if (!wasActive) chosen = { ...chosen, isInterEra: true };
        }
        picks.push(chosen);
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
            const _bt = k => typeof window.t==='function'?window.t(k):k;
const bossLabels = { 3: _bt('map.boss_label.3'), 7: _bt('map.boss_label.7'), 11: _bt('map.boss_label.11'), 15: _bt('map.boss_label.15') };
            label = bossLabels[s] || 'SERIE MUNDIAL';
          } else if (type === 'match') {
            label = (typeof window.t==='function'?window.t('map.label_classic'):'SERIE CLÁSICA');
          } else if (type === 'event') {
            label = (typeof window.t==='function'?window.t('map.label_decision'):'DECISIÓN');
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

      // Captain Badge: any teammate (not the player itself) with captain === true or is_captain === true gives +5 to all stats
      // Non-cumulative: multiple captains on the roster still give only +5 total, not stacked.
      const hasCaptainTeammate = Object.values(contextRoster).some(p => {
        if (!p || p === player) return false;
        if (p.name && player.name && p.name === player.name) return false;
        if (p.id && player.id && p.id === player.id) return false;
        return (p.captain === true || p.is_captain === true);
      });
      if (hasCaptainTeammate) {
        con += 5; pwr += 5; eye += 5; spd += 5; def += 5;
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
            desc = (typeof window.t==='function'?window.t('syn.deadball.lv2'):'Deadball: 40% chance on single to advance 2 bases.');
          } else {
            level = 1;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.deadball.lv1'):'Deadball: 20% chance on single to advance 2 bases.');
          }
        } else if (era === Eras.GOLDEN) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.golden.lv2'):'Golden Era: Hits +12 damage; 30% convert 2B to 3B.');
          } else {
            level = 1;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.golden.lv1'):'Golden Era: All hits +6 extra damage.');
          }
        } else if (era === Eras.INTEGRATION) {
          if (count >= 4) {
            level = 2;
            bonuses = { con: 8, pwr: 8, eye: 8, spd: 8, def: 8 };
            desc = (typeof window.t==='function'?window.t('syn.integration.lv2'):'Integration: Batter +8 stats; outs heal +5 Stamina.');
          } else {
            level = 1;
            bonuses = { con: 4, pwr: 4, eye: 4, spd: 4, def: 4 };
            desc = (typeof window.t==='function'?window.t('syn.integration.lv1'):'Integration: Player gets +4 to all stats this turn.');
          }
        } else if (era === Eras.EXPANSION) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.expansion.lv2'):'Expansion: 80% steal; steal heals +20 and deals 10 damage.');
          } else {
            level = 1;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.expansion.lv1'):'Expansion: 50% steal on 1B; steal heals +10 Stamina.');
          }
        } else if (era === Eras.BIGHAIR) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.bighair.lv2'):'Big Hair: Steals +30 damage and 3-turn debuff to rival.');
          } else {
            level = 1;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.bighair.lv1'):'Big Hair: Successful steals deal +15 damage to pitcher.');
          }
        } else if (era === Eras.STEROID) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.steroid.lv2'):'Bash Brothers: HR deal +40 damage; 50% sac fly scores.');
          } else {
            level = 1;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.steroid.lv1'):'Bash Brothers: Home Runs deal +20 extra damage.');
          }
        } else if (era === Eras.EFFICIENCY) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.efficiency.lv2'):'Moneyball: BB deal +20 damage; outs deal +10 damage.');
          } else {
            level = 1;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.efficiency.lv1'):'Moneyball: Walks (BB) deal +10 extra damage.');
          }
        } else if (era === Eras.MODERN) {
          if (count >= 4) {
            level = 2;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.modern.lv2'):'Three True Outcomes: BB deal 24 damage, SO -50% and no chain cut.');
          } else {
            level = 1;
            bonuses = {};
            desc = (typeof window.t==='function'?window.t('syn.modern.lv1'):'Three True Outcomes: BB deal 15 damage, SO -50% team HP damage.');
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

      // Story Mode: same 80/20 activity-based split as the draft round picks
      // (see getDraftRoundPicks) — applies to Sign Legend node + post-match
      // win rewards alike so the wildcard mechanic is consistent everywhere.
      const isStoryYearAware = this.selectedMode === 'story' && this.selectedSeasonYear;
      let selected = [];
      if (isStoryYearAware) {
        const year = parseInt(this.selectedSeasonYear, 10);
        const isActive = p => p.debut_year !== undefined && p.last_year !== undefined && p.debut_year <= year && p.last_year >= year;
        let activePool = filtered.filter(isActive);
        let fullPool = [...filtered];
        while (selected.length < 3 && (fullPool.length > 0 || activePool.length > 0)) {
          const useActive = activePool.length > 0 && Math.random() < 0.8;
          const source = useActive ? activePool : (fullPool.length > 0 ? fullPool : activePool);
          const picked = pickWeightedUnique(source, 1, weakPositionsSet);
          if (!picked.length) break;
          let chosen = picked[0];
          activePool = activePool.filter(x => x.name !== chosen.name);
          fullPool = fullPool.filter(x => x.name !== chosen.name);
          if (!useActive && !isActive(chosen)) chosen = { ...chosen, isInterEra: true };
          selected.push(chosen);
        }
      } else {
        selected = pickWeightedUnique(filtered, 3, weakPositionsSet);
      }

      // Fallback if pool too small
      if (selected.length < 3) {
        const fallback = pool.filter(p => !onRosterNames.has(p.name) && !selected.some(x => x.name === p.name));
        const extra = pickWeightedUnique(fallback, 3 - selected.length, weakPositionsSet);
        selected.push(...extra);
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
      return { success: false, message: (typeof window.t==='function'?window.t('game.lineup_full'):'Alineación ocupada. Elige a quién reemplazar.') };
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
      const unlockEnemyPitchers = (enemy) => {
        if (enemy && enemy.pitchers && window.BaseballDex) {
          enemy.pitchers.forEach(p => window.BaseballDex.unlockOpponent(p));
        }
        return enemy;
      };

      if (this.currentEnemy) return unlockEnemyPitchers(this.currentEnemy);

      const stage = this.currentStageIndex; // 0 to 15
      const fullPool = window.PITCHERS_POOL || [];
      if (!this.encounteredPitchers) this.encounteredPitchers = new Set();

      // Guards against picking the same real pitcher twice for one 3-pitcher
      // roster — reset per getEnemyTeam() call (fresh closure each time).
      const rosterPicks = new Set();

      const pickPitcher = (candidates, preferredRole = null) => {
        const pitcherKey = (p) => (p.name || '') + '_' + (p.year || p.peak_year_display);

        let unvisited = candidates.filter(p => !this.encounteredPitchers.has(pitcherKey(p)));
        if (unvisited.length === 0) unvisited = candidates;
        if (preferredRole) {
          const roleMatches = unvisited.filter(p => (p.role || '').toUpperCase() === preferredRole.toUpperCase());
          if (roleMatches.length > 0) unvisited = roleMatches;
        }
        if (unvisited.length === 0) unvisited = fullPool;

        // When the encountered-pool fallback above has to reuse already-seen
        // pitchers (small pools, e.g. Legendary-only for boss stages, exhausted
        // over a long run), it could return the same pitcher already picked
        // earlier in THIS roster — collapsing 2 of the 3 into one BaseballDex
        // entry. Filter those out as a final backstop.
        let candidatePool = unvisited.filter(p => !rosterPicks.has(pitcherKey(p)));
        if (candidatePool.length === 0) candidatePool = unvisited;

        const chosen = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        this.encounteredPitchers.add(pitcherKey(chosen));
        rosterPicks.add(pitcherKey(chosen));
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
          mov: p.mov !== undefined ? p.mov : (p.hr9 !== undefined ? p.hr9 : 50),
          sta: staVal,
          ovr: p.ovr || p._ovr || 50,
          rarity: p.rarity || 'Common',
          era: p.era || '',
          team: p.team || '',
          year: yearVal,
          // Explicit rate stats — without these, basedex.js/simulation.js's fallback
          // chains for h9 (checks .h9 then .grt, neither of which this object used
          // to carry) silently defaulted to a flat 50, so H/9 always graded a plain
          // "C" and pitcher skill in H/9 never actually affected combat math. Also
          // fixes the .mov field above, which was wrongly reading .grt (H9's value)
          // instead of .mov/.hr9, so HR probability was using the wrong stat too.
          h9:  p.h9  !== undefined ? p.h9  : (p.grt !== undefined ? p.grt : 50),
          k9:  p.k9  !== undefined ? p.k9  : (p.stf !== undefined ? p.stf : 50),
          bb9: p.bb9 !== undefined ? p.bb9 : (p.ctl !== undefined ? p.ctl : 50),
          hr9: p.hr9 !== undefined ? p.hr9 : (p.mov !== undefined ? p.mov : 50)
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

      return unlockEnemyPitchers(this.currentEnemy);
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
      if (enemy && enemy.pitchers && window.BaseballDex) {
        enemy.pitchers.forEach(p => window.BaseballDex.unlockOpponent(p));
      }
      
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
      // Trait: Resistencia Inagotable — batters lose 7 instead of 15 stamina
      const staminaLoss = this.hasTrait('endless_stamina') ? 7 : 15;
      // Five-Tool Legends T4: batters who triggered the OUT heal this match are spared this loss entirely
      const staminaImmuneIds = simResult && simResult.staminaImmuneIds ? simResult.staminaImmuneIds : new Set();
      const retiredAlerts = [];
      const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : (window.PlayersDB && window.PlayersDB.PLAYERS_POOL) ? window.PlayersDB.PLAYERS_POOL : [];

      Object.keys(this.roster).forEach(pos => {
        const player = this.roster[pos];
        if (player) {
          const isStaminaImmune = staminaImmuneIds.has(player.id || player.name);
          player.stamina = isStaminaImmune
            ? Math.max(0, player.stamina !== undefined ? player.stamina : 100)
            : Math.max(0, (player.stamina !== undefined ? player.stamina : 100) - staminaLoss);

          if (player.stamina <= 0) {
            // Player retired due to zero stamina -> replace with random Common player of same position!
            const targetPos = player.pos || pos;
            let commonMatches = pool.filter(p => p.rarity === 'Common' && (p.pos === targetPos || p.pos === pos));
            if (!commonMatches.length) {
              commonMatches = pool.filter(p => p.rarity === 'Common');
            }
            if (commonMatches.length > 0) {
              const pick = commonMatches[Math.floor(Math.random() * commonMatches.length)];
              const newInstance = {
                ...pick,
                id: `player_${pick.name.replace(/\s+/g, '')}_${Date.now()}_repl`,
                stamina: 100,
                upgrades: { con: 0, pwr: 0, eye: 0, spd: 0, def: 0, sta: 0 }
              };
              this.roster[pos] = newInstance;
              retiredAlerts.push({
                oldPlayerName: player.name,
                oldPlayerPos: pos,
                oldPlayerRarity: player.rarity,
                newPlayerName: newInstance.name,
                newPlayerPos: newInstance.pos,
                newPlayerRarity: newInstance.rarity,
                newPlayerOvr: newInstance.avg_attr_score || newInstance.ovr || 50
              });
            }
          }
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
        // Distinct from pitchersDefeated (KO count): this counts every pitcher the
        // player actually threw a dice roll against, including one who survived a
        // timeout/team-death loss — pitchersDefeated alone can't tell you that.
        pitchersFaced: simResult.pitchersFaced !== undefined ? simResult.pitchersFaced : (simResult.enemyPitchers ? simResult.enemyPitchers.length : 0),
        totalPitchers: simResult.enemyPitchers ? simResult.enemyPitchers.length : 0,
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
            retiredAlerts,
            message: (typeof window.t==='function'?window.t('game.super_boss_trigger'):`⚡ ¡SUPER BOSS FIGHT! ⚡ ¡Derrotaste al primer grupo de leyendas! AHORA ENFRENTA A LA ROTACIÓN SUPREMA DE 4 LEYENDAS.`)
          };
        }

        // Super Boss was active and player just won it -> TRUE VICTORY!
        if (this.isSuperBossActive) {
          this.isSuperBossActive = false;
          this.currentEnemy = null;
          return {
            won: true,
            isTrueVictory: true,
            retiredAlerts,
            message: (typeof window.t==='function'?window.t('game.true_victory'):`🏆 ¡CAMPEÓN ABSOLUTO! ¡Derrotaste a la Rotación Suprema de 4 Leyendas! BaseRogue conquistado.`)
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
            retiredAlerts,
            message: (typeof window.t==='function'?window.t('game.boss_victory_trait', { earnings: earnings + eliteBonus }):`¡Victoria de Jefe! +$${earnings + eliteBonus}. Elige una Trait Pasiva de Leyenda.`)
          };
        }

        return {
          won: true,
          isBossStage,
          earnings: earnings + eliteBonus,
          retiredAlerts,
          message: isBossStage
            ? (typeof window.t==='function'?window.t('game.boss_win_msg', { name: currentEnemy.name, earnings: earnings + eliteBonus }):`¡Victoria! Derrotaste al JEFE ${currentEnemy.name}. ¡+$${earnings + eliteBonus}!`)
            : (typeof window.t==='function'?window.t('game.win_msg', { name: currentEnemy.name, earnings: earnings + eliteBonus }):`¡Victoria! Derrotaste a la rotación de ${currentEnemy.name}. ¡+$${earnings + eliteBonus}!`)
        };
      } else {
        this.runActive = false;
        this.currentEnemy = null;
        return {
          won: false,
          retiredAlerts,
          message: (typeof window.t==='function'?window.t('game.defeat_msg', { name: currentEnemy.name }):`Derrota. Finalizaron los 3 innings (9 outs) antes de derrotar a toda la rotación de ${currentEnemy.name}.`)
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
