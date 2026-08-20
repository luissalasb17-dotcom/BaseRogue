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
          get text() { return typeof window.t==='function'?window.t('ev.cork.choice2'):'Corcho Masivo Ilegal (+25 PWR, -5 CON)'; },
          cost: 5,
          successChance: 0.60,
          get successMsg() { return typeof window.t==='function'?window.t('ev.cork.suc'):'¡Bates modificados con éxito! Tu alineación obtiene +25 PWR y -5 CON.'; },
          action: (G) => {
            G.activeItemBonuses.teamPwr += 25;
            G.activeItemBonuses.teamCon -= 5;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.cork.fail'):'¡EL UMPIRE DESCUBRIÓ LOS BATES! La liga confisca los bates y te impone una multa de -$10.'; },
          failPreview: "-$10 Presupuesto",
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
          get text() { return typeof window.t==='function'?window.t('ev.signs.choice2'):'Robo de Señas Callejero (+30 EYE, +10 CON)'; },
          cost: 8,
          successChance: 0.65,
          get successMsg() { return typeof window.t==='function'?window.t('ev.signs.suc'):'¡Señas interceptadas! Tu equipo obtiene +30 EYE y +10 CON.'; },
          action: (G) => {
            G.activeItemBonuses.teamEye += 30;
            G.activeItemBonuses.teamCon += 10;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.signs.fail'):'¡Descubiertos en cámara! El comisionado sanciona al equipo con -$15 Presupuesto.'; },
          failPreview: "-$15 Presupuesto",
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
          failPreview: "-15 Stamina a todos",
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
          icon: "🧘",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.hyp.choice2'):'Sesión Guiada Estándar (+8 EYE, +5 CON)'; },
          cost: 18,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamEye += 8;
            G.activeItemBonuses.teamCon += 5;
          }
        },
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
          failPreview: "-8 EYE",
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
          get text() { return typeof window.t==='function'?window.t('ev.graphene.choice1'):'Comprar Modelo Homologado (+12 PWR)'; },
          cost: 20,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamPwr += 12;
          }
        },
        {
          icon: "💥",
          risk: "high",
          get text() { return typeof window.t==='function'?window.t('ev.graphene.choice2'):'Prototipo Hyper-Carbono (+28 PWR)'; },
          cost: 6,
          successChance: 0.55,
          get successMsg() { return typeof window.t==='function'?window.t('ev.graphene.suc'):'¡Poder devastador! Tu equipo obtiene +28 PWR extra.'; },
          action: (G) => {
            G.activeItemBonuses.teamPwr += 28;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.graphene.fail'):'¡El bate se astilló en pedazos! Pierdes la inversión y restas -5 PWR.'; },
          failPreview: "-5 PWR",
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
          get text() { return typeof window.t==='function'?window.t('ev.tabloid.choice1'):'Vender Exclusiva (+$45 Presupuesto)'; },
          cost: 0,
          successChance: 0.65,
          get successMsg() { return typeof window.t==='function'?window.t('ev.tabloid.suc'):'¡Entrevista vendida con éxito! Recibes +$45 de presupuesto.'; },
          action: (G) => { G.budget += 45; },
          get failMsg() { return typeof window.t==='function'?window.t('ev.tabloid.fail'):'¡El artículo desató polémica y no se vendió! La presión mediática causa estrés (-15 Stamina), sin presupuesto a cambio.'; },
          failPreview: "-15 Stamina a todos, sin presupuesto",
          failAction: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.max(10, G.roster[pos].stamina - 15);
            });
          }
        },
        {
          icon: "🤝",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.tabloid.choice2'):'Conferencia de Prensa Oficial (+$10 Presupuesto)'; },
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
          icon: "🧊",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.cryo.choice2'):'Bañera de Hielo Rápida (+40 Stamina a todos)'; },
          cost: 18,
          successChance: 1.0,
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.min(100, G.roster[pos].stamina + 40);
            });
          }
        },
        {
          icon: "🧪",
          risk: "high",
          get text() { return typeof window.t==='function'?window.t('ev.cryo.choice1'):'Criogenización Experimental (100% Stamina a todos)'; },
          cost: 8,
          successChance: 0.55,
          get successMsg() { return typeof window.t==='function'?window.t('ev.cryo.suc'):'¡Sesión perfecta! Toda la plantilla recupera el 100% de Stamina.'; },
          action: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = 100;
            });
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.cryo.fail'):'¡Choque térmico! La cámara falla y el frío extremo agota a la plantilla (-20 Stamina).'; },
          failPreview: "-20 Stamina a todos",
          failAction: (G) => {
            Object.keys(G.roster).forEach(pos => {
              if (G.roster[pos]) G.roster[pos].stamina = Math.max(10, G.roster[pos].stamina - 20);
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
          get text() { return typeof window.t==='function'?window.t('ev.pinetar.choice1'):'Brea de Grado Profesional (+8 CON)'; },
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
          get successMsg() { return typeof window.t==='function'?window.t('ev.pinetar.suc'):'¡Agarre extraordinario! Tu equipo gana +18 Contacto.'; },
          action: (G) => {
            G.activeItemBonuses.teamCon += 18;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.pinetar.fail'):'¡El umpire nota el residuo ilícito! Te sanciona restando -10 Defensa.'; },
          failPreview: "-10 DEF",
          failAction: (G) => {
            G.activeItemBonuses.teamDef -= 10;
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.pinetar.choice3'):'Seguir igual'; },
          cost: 0,
          successChance: 1.0,
          action: (G) => {}
        }
      ]
    },
    {
      id: "ev_bribe",
      icon: "💼",
      get title() { return typeof window.t==='function'?window.t('ev.bribe.title'):'Cazatalento en Apuros'; },
      get desc() { return typeof window.t==='function'?window.t('ev.bribe.desc'):'Un cazatalentos te ofrece presupuesto del equipo rival a cambio de canjear un poco de enfoque deportivo.'; },
      choices: [
        {
          icon: "⚖️",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.bribe.choice1'):'Denunciarlo al Comisionado (+10 EYE, +5 DEF)'; },
          cost: 10,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamEye += 10;
            G.activeItemBonuses.teamDef += 5;
          }
        },
        {
          icon: "💵",
          risk: "high",
          get text() { return typeof window.t==='function'?window.t('ev.bribe.choice2'):'Trato Bajo la Mesa (+$60 Presupuesto, -5 EYE)'; },
          cost: 0,
          successChance: 0.60,
          get successMsg() { return typeof window.t==='function'?window.t('ev.bribe.suc'):'¡Trato cerrado sin que nadie se entere! +$60 de presupuesto (-5 EYE por la mala conciencia).'; },
          action: (G) => {
            G.budget += 60;
            G.activeItemBonuses.teamEye -= 5;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.bribe.fail'):'¡Te descubrieron! La liga te multa -$20 y el escándalo distrae a tu alineación (-10 EYE).'; },
          failPreview: "-$20 Presupuesto, -10 EYE",
          failAction: (G) => {
            G.budget = Math.max(0, G.budget - 20);
            G.activeItemBonuses.teamEye -= 10;
          }
        },
        {
          icon: "🚪",
          risk: "safe",
          get text() { return typeof window.t==='function'?window.t('ev.bribe.choice3'):'Ignorar la llamada'; },
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
          get text() { return typeof window.t==='function'?window.t('ev.spikes.choice1'):'Equipar Calzado Profesional (+12 SPD)'; },
          cost: 15,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamSpd += 12;
          }
        },
        {
          icon: "🚀",
          risk: "moderate",
          get text() { return typeof window.t==='function'?window.t('ev.spikes.choice2'):'Prototipo de Clavos Turbo (+25 SPD)'; },
          cost: 8,
          successChance: 0.65,
          get successMsg() { return typeof window.t==='function'?window.t('ev.spikes.suc'):'¡Velocidad explosiva! Tu equipo gana +25 SPD.'; },
          action: (G) => {
            G.activeItemBonuses.teamSpd += 25;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.spikes.fail'):'¡Mala tracción! Los clavos resbalan y causan torceduras (-10 Stamina a todos).'; },
          failPreview: "-10 Stamina a todos",
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
          get text() { return typeof window.t==='function'?window.t('ev.gloves.choice1'):'Comprar Guantes Legendarios (+14 DEF)'; },
          cost: 14,
          successChance: 1.0,
          action: (G) => {
            G.activeItemBonuses.teamDef += 14;
          }
        },
        {
          icon: "🥊",
          risk: "high",
          get text() { return typeof window.t==='function'?window.t('ev.gloves.choice2'):'Guante de Prototipo No Certificado (+28 DEF)'; },
          cost: 6,
          successChance: 0.55,
          get successMsg() { return typeof window.t==='function'?window.t('ev.gloves.suc'):'¡Ajuste perfecto! El prototipo funciona de maravilla: +28 DEF.'; },
          action: (G) => {
            G.activeItemBonuses.teamDef += 28;
          },
          get failMsg() { return typeof window.t==='function'?window.t('ev.gloves.fail'):'¡El cuero se raja en pleno partido! Pierdes agarre: -8 DEF.'; },
          failPreview: "-8 DEF",
          failAction: (G) => {
            G.activeItemBonuses.teamDef -= 8;
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

  // Shared composite rating used to find the "worst"/"best" roster player for gambles.
  const _gambleOvr = (p) => {
    if (!p) return -Infinity;
    const con = (p.con || 0) + ((p.upgrades && p.upgrades.con) || 0);
    const pwr = (p.pwr || 0) + ((p.upgrades && p.upgrades.pwr) || 0);
    const eye = (p.eye || 0) + ((p.upgrades && p.upgrades.eye) || 0);
    const kavd = (p.k_avd !== undefined ? p.k_avd : (p.k_avoid !== undefined ? p.k_avoid : (p.k_avoid_val !== undefined ? p.k_avoid_val : con))) + ((p.upgrades && p.upgrades.k_avd) || 0);
    const spd = (p.spd || 0) + ((p.upgrades && p.upgrades.spd) || 0);
    const def = (p.def || 0) + ((p.upgrades && p.upgrades.def) || 0);
    return con * 0.30 + pwr * 0.30 + eye * 0.10 + kavd * 0.10 + def * 0.10 + spd * 0.10;
  };
  const _gambleRarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

  const _playsPosition = (p, pos) => {
    if (p.pos === pos) return true;
    if (!p.sec_pos) return false;
    return p.sec_pos.split(',').map(s => s.trim()).includes(pos);
  };

  // Picks a random player who can actually play `pos`. Tries `preferredRarities`
  // first; if none of those exist at that position, widens to any rarity —
  // but NEVER drops the position requirement (a Catcher slot must get a Catcher).
  const _pickGambleCandidate = (pool, pos, preferredRarities) => {
    let candidates = pool.filter(p => _playsPosition(p, pos) && preferredRarities.includes(p.rarity));
    if (!candidates.length) candidates = pool.filter(p => _playsPosition(p, pos));
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  // ── HIGH-STAKES GAMBLE NODES ("apuesta de alto riesgo") ──────────────────
  // Unlike ManagerEventsList (modest, always-safe-option stat tweaks), these are
  // single all-or-nothing bets: one dice roll, no safe middle choice besides declining.
  const HighStakesGamblesList = [
    {
      id: 'gamble_all_in_budget',
      icon: '💰',
      get title() { return typeof window.t==='function'?window.t('gamble.budget.title'):'💰 Todo o Nada (Lotería Triple)'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.budget.desc'):'¡Apuestas TODO tu presupuesto actual a una tirada! Si ganas (50%), ¡TRIPLICAS tu dinero (x3)! Si pierdes (50%), te quedas en $0.'; },
      chance: 0.50,
      resolve(G) {
        const staked = G.budget || 0;
        const success = Math.random() <= this.chance;
        G.budget = success ? staked * 3 : 0;
        return {
          success,
          resultText: success
            ? (typeof window.t==='function'?window.t('gamble.budget.result_win', { staked, newBudget: G.budget }):`¡Triunfo total en la lotería! Triplicaste tus $${staked} y ahora tienes $${G.budget}.`)
            : (typeof window.t==='function'?window.t('gamble.budget.result_lose', { staked }):`¡La casa gana! Perdiste tus $${staked} apostados. Presupuesto actual: $0.`)
        };
      }
    },
    {
      id: 'gamble_blind_trade',
      icon: '🔄',
      get title() { return typeof window.t==='function'?window.t('gamble.trade.title'):'Intercambio a Ciegas'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.trade.desc'):'Cambias a tu jugador titular más débil por una oferta a ciegas. Si ganas, el reemplazo es de rareza SUPERIOR garantizada. Si pierdes, el reemplazo es Common y esa posición queda bloqueada para draft por 2 nodos.'; },
      chance: 0.50,
      resolve(G) {
        const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : [];
        let worstPos = null, worstOvr = Infinity;
        Object.keys(G.roster).forEach(pos => {
          const p = G.roster[pos];
          const ovr = p ? _gambleOvr(p) : -Infinity;
          if (ovr < worstOvr) { worstOvr = ovr; worstPos = pos; }
        });
        if (!worstPos) return { success: false, resultText: (typeof window.t==='function'?window.t('gamble.trade.no_target'):'No hay roster titular para intercambiar.') };

        const current = G.roster[worstPos];
        const currentRarityIdx = current ? _gambleRarityOrder.indexOf(current.rarity || 'Common') : -1;
        const success = Math.random() <= this.chance;

        const pick = success
          ? _pickGambleCandidate(pool, worstPos, _gambleRarityOrder.slice(Math.max(currentRarityIdx + 1, 0)))
          : _pickGambleCandidate(pool, worstPos, ['Common']);
        if (!pick) return { success, resultText: (typeof window.t==='function'?window.t('gamble.no_player_found', { pos: worstPos }):`No se encontró ningún jugador de ${worstPos} disponible.`) };

        const newInstance = {
          ...pick,
          id: `player_${pick.name.replace(/\s+/g, '')}_${Date.now()}_trade`,
          stamina: 100,
          upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
        };
        G.roster[worstPos] = newInstance;

        if (!success) {
          G.positionLocks = G.positionLocks || {};
          G.positionLocks[worstPos] = 2;
        }

        return {
          success,
          resultText: success
            ? (typeof window.t==='function'?window.t('gamble.trade.result_win', { oldName: current ? current.name : '(vacío)', newName: newInstance.name, rarity: newInstance.rarity, pos: worstPos }):`¡Buena oferta! ${current ? current.name : '(vacío)'} → ${newInstance.name} (${newInstance.rarity}) en ${worstPos}.`)
            : (typeof window.t==='function'?window.t('gamble.trade.result_lose', { newName: newInstance.name, oldName: current ? current.name : '(vacío)', pos: worstPos }):`Mal negocio: ${newInstance.name} (Common) reemplaza a ${current ? current.name : '(vacío)'} en ${worstPos}. Posición bloqueada 2 nodos.`)
        };
      }
    },
    {
      id: 'gamble_forbidden_synergy',
      icon: '🧬',
      requiresTargetPlayer: true,
      get title() { return typeof window.t==='function'?window.t('gamble.synergy.title'):'Sinergia Prohibida'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.synergy.desc'):'Elige un jugador de tu roster: si ganas, cuenta x4 para la sinergia de su Era. Si pierdes, 2 jugadores al azar de tu roster pierden la elegibilidad de Era por el resto de la run.'; },
      chance: 0.50,
      resolve(G, targetPos) {
        const target = G.roster[targetPos];
        if (!target || !target.era) return { success: false, resultText: (typeof window.t==='function'?window.t('gamble.synergy.no_valid_target'):'Elige un jugador con Era válida.') };
        const success = Math.random() <= this.chance;
        if (success) {
          target.synergyWeight = 4;
          return { success, resultText: (typeof window.t==='function'?window.t('gamble.synergy.result_win', { name: target.name, era: target.era }):`${target.name} ahora cuenta x4 para la sinergia de ${target.era}.`) };
        }
        const candidates = Object.keys(G.roster).filter(pos => pos !== targetPos && G.roster[pos] && G.roster[pos].era && !G.roster[pos].synergyBanned);
        const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 2);
        const names = shuffled.map(pos => { G.roster[pos].synergyBanned = true; return G.roster[pos].name; });
        return {
          success,
          resultText: names.length
            ? (typeof window.t==='function'?window.t('gamble.synergy.result_lose', { names: names.join(' y ') }):`¡Falló! ${names.join(' y ')} pierden elegibilidad de Era por el resto de la run.`)
            : (typeof window.t==='function'?window.t('gamble.synergy.result_lose_none'):'Falló, pero no había otros jugadores elegibles para penalizar.')
        };
      }
    },
    {
      id: 'gamble_scout',
      icon: '🕵️',
      get title() { return typeof window.t==='function'?window.t('gamble.scout.title'):'Cazatalentos Misterioso'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.scout.desc'):'Un cazatalentos ofrece una carta Legendary para tu posición más débil. Si ganas, la firmas gratis. Si pierdes, tu mejor jugador se lesiona: -20 en todas sus stats por el resto de la run.'; },
      chance: 0.50,
      resolve(G) {
        const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : [];
        const success = Math.random() <= this.chance;

        if (success) {
          let worstPos = null, worstOvr = Infinity;
          Object.keys(G.roster).forEach(pos => {
            const p = G.roster[pos];
            const ovr = p ? _gambleOvr(p) : -Infinity;
            if (ovr < worstOvr) { worstOvr = ovr; worstPos = pos; }
          });
          if (!worstPos) return { success, resultText: (typeof window.t==='function'?window.t('gamble.scout.no_target'):'No hay roster titular disponible.') };
          const pick = _pickGambleCandidate(pool, worstPos, ['Legendary']);
          if (!pick) return { success, resultText: (typeof window.t==='function'?window.t('gamble.no_player_found', { pos: worstPos }):`No se encontró ningún jugador de ${worstPos} disponible.`) };
          const newInstance = {
            ...pick,
            id: `player_${pick.name.replace(/\s+/g, '')}_${Date.now()}_scout`,
            stamina: 100,
            upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
          };
          const oldName = G.roster[worstPos] ? G.roster[worstPos].name : '(vacío)';
          G.roster[worstPos] = newInstance;
          return { success, resultText: (typeof window.t==='function'?window.t('gamble.scout.result_win', { newName: newInstance.name, oldName, pos: worstPos }):`¡Fichaje legendario! ${newInstance.name} reemplaza a ${oldName} en ${worstPos}.`) };
        }

        let bestPos = null, bestOvr = -Infinity;
        Object.keys(G.roster).forEach(pos => {
          const p = G.roster[pos];
          if (!p) return;
          const ovr = _gambleOvr(p);
          if (ovr > bestOvr) { bestOvr = ovr; bestPos = pos; }
        });
        if (!bestPos) return { success, resultText: (typeof window.t==='function'?window.t('gamble.scout.no_injury_target'):'No había jugador titular para lesionar.') };
        const p = G.roster[bestPos];
        ['con', 'pwr', 'eye', 'k_avd', 'spd', 'def'].forEach(k => { p.upgrades[k] = (p.upgrades[k] || 0) - 20; });
        return { success, resultText: (typeof window.t==='function'?window.t('gamble.scout.result_lose', { name: p.name }):`${p.name} se lesiona: -20 en todas sus stats por el resto de la run.`) };
      }
    }
  ];

  function pickWeightedUnique(pool, count, weakPositionsSet, rarityBoost = false, rarityWeights = null) {
    const selected = [];
    const poolCopy = [...pool];

    while (selected.length < count && poolCopy.length > 0) {
      let totalWeight = 0;
      const weights = poolCopy.map(p => {
        const primaryPos = p.pos || p.pos_display || p.primary_pos || '';
        const secPosRaw = p.sec_pos || p.secondary_pos || p.secondary_positions || '';
        const secPositions = Array.isArray(secPosRaw)
          ? secPosRaw
          : String(secPosRaw).split(',').map(s => s.trim()).filter(Boolean);

        const isWeak = weakPositionsSet && (weakPositionsSet.has(primaryPos) || secPositions.some(sp => weakPositionsSet.has(sp)));
        let w = isWeak ? 3.0 : 1.0;

        // Stage-based Rarity Multiplier
        if (rarityWeights && rarityWeights[p.rarity]) {
          w *= rarityWeights[p.rarity];
        }

        // scout_eye: increases the odds of Epic/Legendary showing up in draft offers
        if (rarityBoost && (p.rarity === 'Epic' || p.rarity === 'Legendary')) w *= 2.5;
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

      // Zone / Division-based maps:
      // For pre-1969 seasons: seasonData.zones contains the 4 structured historical zones in order.
      // For 1969+ seasons: seasonData.divisions contains the divisional map (pick 4).
      this.selectedDivisions = null;
      if (seasonData.zones && seasonData.zones.length > 0) {
        this.selectedDivisions = seasonData.zones.map(z => ({ label: z.label, ...z }));
      } else if (seasonData.divisions) {
        const labels = Object.keys(seasonData.divisions);
        const shuffled = [...labels].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, 4);
        this.selectedDivisions = picked.map(label => ({ label, ...seasonData.divisions[label] }));
      }

      console.log(`Loaded Story Mode Season ${targetYear} with ${customPool.length} teams${this.selectedDivisions ? ` (${this.selectedDivisions.length} zones/divisions)` : ''}`);
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
        teamCon: 0, teamPwr: 0, teamEye: 0, teamKAvd: 0, teamSpd: 0, teamDef: 0
      };
      this.itemsInventory = []; // Team backpack storing unequipped items
      this.purchasedItems = [];
      this.runNodeHistory = [];
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
      // Enemy pitchers defeated (won matches only) during the run — used by
      // the 162-0 Challenge to gate Quick Play pitcher eligibility.
      this.runDefeatedPitchers = [];

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

      // positionLocks: pos → node-completions remaining before it can be
      // drafted into again. Set by a failed "Intercambio a Ciegas" gamble.
      this.positionLocks = {};

      // Era of Build: the single era the player actively commits their run to.
      // Only this era's synergy scales past T1 (2+ players) — see setBuildEra().
      this.buildEra = null;
      // True once the player has ever clicked "Set/Remove Build" — before
      // that, the UI auto-previews the roster's leading era via
      // autoAssignBuildEra() so a build is active by default without the
      // player having to notice and click the button themselves.
      this.buildEraTouched = false;

      // Custom Batting Order (positions sequence)
      this.battingOrder = ['CF', 'LF', 'RF', '1B', '2B', '3B', 'SS', 'C', 'DH'];

      this.map = [];
      this.history = [];
    }

    // ── TRAITS: Full trait catalog ────────────────────────────────────────────
    static get TRAITS_CATALOG() {
      // Live getters (not pre-resolved strings) so that already-equipped traits
      // (persisted in this.equippedTraits) still re-translate on language switch,
      // same pattern as the getter-based title/desc used throughout ManagerEventsList.
      const tr = (id, icon, key, fallbackName, fallbackDesc) => ({
        id,
        icon,
        get name() { return typeof window.t==='function'?window.t(`trait.${key}.name`):fallbackName; },
        get desc() { return typeof window.t==='function'?window.t(`trait.${key}.desc`):fallbackDesc; }
      });
      return [
        tr('eagle_patience',    '🦅', 'eagle', '🦅 Paciencia de Águila', 'Zona de Boleto (BB) aumenta +3 puntos. Cada BB regenera +5 Stamina al bateador.'),
        tr('slugger_momentum',  '💥', 'slugger', '💥 Impulso de Jonronero', 'Cada HR inflige +30 HP de daño extra al pitcher rival.'),
        tr('surgical_contact',  '🎯', 'surgical', '🎯 Contacto Quirúrgico', 'Zona de Ponche (SO) reducida en -3 puntos para toda la alineación.'),
        tr('speed_demons',      '⚡', 'speed', '⚡ Velocistas Agresivos', 'Jugadores con SPD > 60 roban la base automáticamente en sencillos y boletos. Debuff al pitcher dura 3 impactos.'),
        tr('extra_base_impact', '💣', 'extrabase', '💣 Impacto Acumulado', 'Batazos de extra bases (2B, 3B, HR) infligen +10 HP de daño adicional al pitcher.'),
        tr('iron_shield',       '🛡️', 'shield', '🛡️ Escudo de Hierro', 'El Escudo absorbe 75% del DEF promedio del roster (en lugar de 50%). Regenera +5 al inicio de cada entrada.'),
        tr('defensive_wall',    '🧱', 'wall', '🧱 Muro Defensivo', 'Outs normales reducen HP del equipo en 8 en lugar de 12.'),
        tr('endless_stamina',   '🔋', 'stamina', '🔋 Resistencia Inagotable', 'Los bateadores solo pierden 6 de Stamina por partido (en lugar de 12).'),
        tr('clutch_legends',    '❤️', 'clutch', '❤️ Resiliencia de Leyendas', 'Si Team HP cae por debajo de 35, activa estado Clutch: +15 a CON, PWR, EYE, SPD, DEF para toda la alineación.'),
        tr('golden_glove',      '🧤', 'glove', '🧤 Guantelete Dorado', 'Todos los bateadores reciben +10 DEF, aumentando la capacidad del Escudo de equipo.'),
        tr('secondary_master',  '🔄', 'secondary', '🔄 Posición Secundaria Maestra', 'Elimina la penalización (-15%) al colocar bateadores en su Posición Secundaria.'),
        tr('era_accelerated',   '⏳', 'era_acc', '⏳ Sinergia de Era Acelerada', 'Solo necesitas 2 jugadores de la misma Era para activar la Sinergia de Nivel 2 (normalmente 4).'),
        tr('elite_negotiator',  '💼', 'elite', '💼 Negociador de Élite', 'Obtienes +$10 de presupuesto extra tras cada victoria.'),
        tr('scout_eye',         '🌟', 'scout', '🌟 Ojo de Cazatalentos', 'Las ofertas de draft muestran 4 jugadores en lugar de 3 y aumenta probabilidad de Epic/Legendary.'),
        tr('veteran_rotation',  '🔋', 'veteran', '🔋 Segunda Vida', 'Tu alineación completa recupera un +30% de Stamina al inicio de cada nuevo mapa.'),
        tr('reliever_ambush',   '🔥', 'reliever', '🔥 Emboscada al Relevista', 'El primer batazo contra un nuevo pitcher rival inflige +50% de daño extra.'),
        tr('early_pressure',    '📈', 'pressure', '📈 Presión Temprana', 'El primer bateador de cada entrada gana +20 de CON y EYE para ese turno.'),
        tr('ghost_runners',     '🏃', 'ghost', '🏃 Corredores Fantasma', 'Inicias la 3ª entrada de cada partido con un corredor en 2ª base automáticamente.'),
        tr('legendary_domination', '👑', 'legendary', '👑 Dominio Legendario', 'Si tienes 2 o más jugadores Legendary en titular, todos reciben +10 a todas sus estadísticas.'),
        tr('back_to_back',      '💥', 'back2back', '💥 Cadena de Poder', 'Después de un HR, el siguiente bateador gana +20 de PWR y CON para ese turno.'),
      ];
    }

    // Set (or clear with null) the player's chosen Era of Build for this run.
    setBuildEra(era) {
      this.buildEraTouched = true;
      const validEras = window.PlayersDB ? Object.values(window.PlayersDB.Eras) : [];
      this.buildEra = (era && validEras.includes(era)) ? era : null;
      return this.buildEra;
    }

    // Internal auto-default: previews the roster's currently-leading era as
    // Build until the player manually sets/removes one via setBuildEra().
    // Unlike setBuildEra(), this does NOT set buildEraTouched, so it keeps
    // tracking the leading era as the roster changes pick to pick.
    autoAssignBuildEra(era) {
      if (this.buildEraTouched) return;
      const validEras = window.PlayersDB ? Object.values(window.PlayersDB.Eras) : [];
      this.buildEra = (era && validEras.includes(era)) ? era : null;
    }

    // Display-only tier resolver — mirrors InteractiveBattle._calculateActiveSynergies
    // in simulation.js exactly (T1=2, T2=4, T3=6, T4=8), for rendering the Synergies
    // panel outside of combat. Not used by battle logic itself.
    getEraTier(era, count) {
      if (count < 2) return 0;
      // era_accelerated: only 2 players needed for T2 (instead of 4)
      const t2Threshold = this.hasTrait('era_accelerated') ? 2 : 4;
      return count >= 8 ? 4 : count >= 6 ? 3 : count >= t2Threshold ? 2 : 1;
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

    logRunNode(entry) {
      if (!this.runNodeHistory) this.runNodeHistory = [];
      if (typeof entry === 'string') {
        entry = { title: entry, titleEN: entry, desc: '', descEN: '', icon: '⚾', type: 'generic', status: 'info' };
      }
      entry.nodeIndex = (this.currentNodeIndex !== undefined ? this.currentNodeIndex : 0);
      entry.stage = ((this.currentStageIndex !== undefined ? this.currentStageIndex : 0) + 1);
      entry.timestamp = Date.now();
      this.runNodeHistory.push(entry);
      if (!this.purchasedItems) this.purchasedItems = [];
      this.purchasedItems.push((entry.icon ? `${entry.icon} ` : '') + (entry.title || '') + (entry.desc ? ` (${entry.desc})` : ''));
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
            this.runRosterHistory[name] = {
              name: name, pos: slot, rarity: p.rarity, era: p.era, ovr: p.avg_attr_score || p.ovr,
              playerID: p.playerID || null, year: p.year || null, id: p.id || null
            };
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
        upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
      };
      this.draftedPlayers.push(instance);
      if (window.BaseballDex) window.BaseballDex.unlock(instance);

      // Auto-assign to draftRoster: try native pos → secondary pos → DH → any empty slot
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
      // If native and secondary positions are taken, prioritize DH before other slots
      if (!assigned && !this.draftRoster['DH']) {
        this.draftRoster['DH'] = instance;
        assigned = true;
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
        const primaryPos = p.pos || p.pos_display || p.primary_pos || '';
        const secPosRaw = p.sec_pos || p.secondary_pos || p.secondary_positions || '';
        const secPositions = Array.isArray(secPosRaw)
          ? secPosRaw
          : String(secPosRaw).split(',').map(s => s.trim()).filter(Boolean);

        const isNeeded = missingPos.includes(primaryPos) || secPositions.some(sp => missingPos.includes(sp));
        return { player: p, weight: isNeeded ? 6 : 1 };
      };

      // Story Mode: ~95% of offered cards are restricted to players actually
      // active during the selected season (debut_year<=year<=last_year), the
      // remaining ~5% is a wildcard from any era — flagged isInterEra so it
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
        const useActive = isStoryYearAware && activeWeighted.length > 0 && Math.random() < 0.95;
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
        // 1. Try native position first
        if (!this.roster[p.pos]) {
          this.roster[p.pos] = p;
          assigned = true;
        } else if (p.sec_pos) {
          // 2. Try secondary positions
          const sec = p.sec_pos.split(',').map(s=>s.trim());
          for (let s of sec) {
            if (s && slots.includes(s) && !this.roster[s]) {
              this.roster[s] = p;
              assigned = true;
              break;
            }
          }
        }
        // 3. Try DH slot before falling back to other defensive slots
        if (!assigned && !this.roster['DH']) {
          this.roster['DH'] = p;
          assigned = true;
        }
        // 4. Fallback to any empty slot
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
              upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
            };
            this.roster[slot] = instance;
            usedNames.add(pick.name);
          }
        }
      });
      if (window.BaseballDex) window.BaseballDex.unlockRoster(this.roster);
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
      if (window.BaseballDex) window.BaseballDex.unlockRoster(this.roster);
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
      // iron_shield: Shield absorbs 75% of avg DEF instead of 50%
      const shieldPct = this.hasTrait('iron_shield') ? 0.75 : 0.5;
      return Math.round(Math.max(0, Math.min(50, avgDef * shieldPct)));
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
      const shieldPct = this.hasTrait('iron_shield') ? 0.75 : 0.5;
      return Math.round(Math.max(0, Math.min(50, avgDef * shieldPct)));
    }

    // ── ZONE CONFIG ──────────────────────────────────────────────────────────
    // 4 zones × 4 stages = 16 total stages (indices 0 to 15)
    // zone 0 = "Opening Day (Inicio de temporada)" (stages 0-3); its boss (stage
    // 3) is labeled "Ace Showdown"/"Duelo de Ases" (map.boss_label.3), NOT
    // "Opening Day" — that was the original naming bug: the zone and its own
    // boss shared a name, which reads oddly once you've already played 3
    // games to reach that boss. The zone keeps "Opening Day" (fine — it's the
    // whole early-season stretch), only the boss got renamed.
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
          bossLabel: "Duelo de Ases",
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
              // 30% match, 15% draft, 15% event, 15% train, 15% rest, 5% chest, 5% gamble
              if (roll < 0.30)      type = 'match';
              else if (roll < 0.45) type = 'draft';
              else if (roll < 0.60) type = 'event';
              else if (roll < 0.75) type = 'train';
              else if (roll < 0.90) type = 'rest';
              else if (roll < 0.95) type = 'chest';
              else                  type = 'gamble';
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
          } else if (type === 'chest') {
            label = 'COFRE';
          } else if (type === 'gamble') {
            label = 'LUCK';
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

      let con = (player.con || 0) + ((player.upgrades && player.upgrades.con) || 0);
      let pwr = (player.pwr || 0) + ((player.upgrades && player.upgrades.pwr) || 0);
      let eye = (player.eye || 0) + ((player.upgrades && player.upgrades.eye) || 0);
      let kavd = (player.k_avd !== undefined ? player.k_avd : (player.k_avoid !== undefined ? player.k_avoid : (player.k_avoid_val !== undefined ? player.k_avoid_val : (player.con || 50)))) + ((player.upgrades && player.upgrades.k_avd) || 0);
      let spd = (player.spd || 0) + ((player.upgrades && player.upgrades.spd) || 0);
      let def = (player.def || 0) + ((player.upgrades && player.upgrades.def) || 0);

      // Stamina Penalty
      const stamina = player.stamina || 100;
      let staminaPenalty = 0;
      if (stamina < 50) staminaPenalty = -6;
      if (stamina < 25) staminaPenalty = -16;

      con += staminaPenalty;
      pwr += staminaPenalty;
      eye += staminaPenalty;
      kavd += staminaPenalty;
      spd += staminaPenalty;
      def += staminaPenalty;

      // Apply Era Passive Trait stat bonuses
      const statsObj = { con, pwr, eye, kavd, spd, def };
      if (player.era && window.PlayersDB.EraTraits && window.PlayersDB.EraTraits[player.era]) {
        const trait = window.PlayersDB.EraTraits[player.era];
        if (trait.applyStatBonus) {
          trait.applyStatBonus(statsObj);
          con = statsObj.con;
          pwr = statsObj.pwr;
          eye = statsObj.eye;
          kavd = statsObj.kavd !== undefined ? statsObj.kavd : (statsObj.k_avd !== undefined ? statsObj.k_avd : kavd);
          spd = statsObj.spd;
          def = statsObj.def;
        }
      }

      // Position Penalty (DH or native match)
      if (slotPosition && slotPosition !== 'DH' && player.pos !== slotPosition) {
        const secPosArray = player.sec_pos ? player.sec_pos.split(',').map(s => s.trim()) : [];
        if (secPosArray.includes(slotPosition)) {
          // secondary_master: removes the -15% penalty at a Secondary position entirely
          def = this.hasTrait('secondary_master') ? def : Math.round(def * 0.85);
        } else {
          def = Math.round(def * 0.50); // Out of position: 50% defensive value
        }
      }

      // golden_glove: every batter gets +10 DEF
      if (this.hasTrait('golden_glove')) def += 10;

      // Manager Decision/Item Bonuses (Legacy + Individual Equipment)
      con += (this.activeItemBonuses.teamCon || 0);
      pwr += (this.activeItemBonuses.teamPwr || 0);
      eye += (this.activeItemBonuses.teamEye || 0);
      kavd += (this.activeItemBonuses.teamKAvd || 0);
      spd += (this.activeItemBonuses.teamSpd || 0);
      def += (this.activeItemBonuses.teamDef || 0);

      // Individual Equipped Item Stats
      if (player.equipped_item && player.equipped_item.stats) {
        const s = player.equipped_item.stats;
        if (s.con) con += s.con;
        if (s.pwr) pwr += s.pwr;
        if (s.eye) eye += s.eye;
        if (s.k_avd || s.kavd) kavd += (s.k_avd || s.kavd);
        if (s.spd) spd += s.spd;
        if (s.def) def += s.def;
      }

      // Permanent Consumable Buffs
      if (player.perm_con) con += player.perm_con;
      if (player.perm_pwr) pwr += player.perm_pwr;
      if (player.perm_eye) eye += player.perm_eye;
      if (player.perm_kavd || player.perm_k_avd) kavd += (player.perm_kavd || player.perm_k_avd);
      if (player.perm_spd) spd += player.perm_spd;
      if (player.perm_def) def += player.perm_def;

      // Synergy Bonuses
      const synergies = this.calculateActiveSynergies(contextRoster);
      synergies.forEach(syn => {
        if (syn.category === 'era') {
          if (syn.bonuses.con) con += syn.bonuses.con;
          if (syn.bonuses.pwr) pwr += syn.bonuses.pwr;
          if (syn.bonuses.eye) eye += syn.bonuses.eye;
          if (syn.bonuses.k_avd) kavd += syn.bonuses.k_avd;
          if (syn.bonuses.spd) spd += syn.bonuses.spd;
          if (syn.bonuses.def) def += syn.bonuses.def;
        }
      });

      // Franchise Team Morale Synergy (2: +4, 3: +6, 4+: +8 to all combat stats)
      if (player.team !== 'ROOK' && player.team !== 'None') {
        const teamCount = this.getActiveFranchiseCounts(contextRoster)[player.team] || 0;
        if (teamCount >= 4) {
          con += 8; pwr += 8; eye += 8; kavd += 8; spd += 8; def += 8;
        } else if (teamCount === 3) {
          con += 6; pwr += 6; eye += 6; kavd += 6; spd += 6; def += 6;
        } else if (teamCount === 2) {
          con += 4; pwr += 4; eye += 4; kavd += 4; spd += 4; def += 4;
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
        con += 5; pwr += 5; eye += 5; kavd += 5; spd += 5; def += 5;
      }

      // legendary_domination: if 2+ Legendary players are in the starting lineup, everyone gets +10 to all stats
      if (this.hasTrait('legendary_domination')) {
        const legendaryCount = Object.values(contextRoster).filter(p => p && !p.isReplacement && p.rarity === 'Legendary').length;
        if (legendaryCount >= 2) {
          con += 10; pwr += 10; eye += 10; kavd += 10; spd += 10; def += 10;
        }
      }

      return {
        ...player,
        con: Math.max(1, Math.min(125, con)),
        pwr: Math.max(1, Math.min(125, pwr)),
        eye: Math.max(1, Math.min(125, eye)),
        k_avd: Math.max(1, Math.min(125, kavd)),
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
        if (player && !player.isReplacement && player.era && player.era !== 'None' && !player.synergyBanned) {
          const weight = player.synergyWeight || (player.isInterEra ? 2 : 1);
          eraCounts[player.era] = (eraCounts[player.era] || 0) + weight;
        }
      });

      const synergies = [];
      const Eras = window.PlayersDB.Eras;
      const t2Threshold = this.hasTrait('era_accelerated') ? 2 : 4;

      Object.keys(eraCounts).forEach(era => {
        const count = eraCounts[era];
        if (count < 2) return;

        let level = count >= 8 ? 4 : count >= 6 ? 3 : count >= t2Threshold ? 2 : 1;
        let bonuses = {};
        let desc = "";

        if (era === Eras.GENESIS) {
          const boost = level === 4 ? 6 : level === 3 ? 4 : level === 2 ? 2 : 0;
          if (boost > 0) bonuses = { con: boost };
        } else if (era === Eras.DEADBALL) {
          const boost = level === 4 ? 10 : level === 3 ? 7 : level === 2 ? 4 : 2;
          bonuses = { con: boost, k_avd: boost };
        } else if (era === Eras.GOLDEN) {
          const boost = level === 4 ? 10 : level === 3 ? 7 : level === 2 ? 4 : 2;
          bonuses = { pwr: boost };
        } else if (era === Eras.INTEGRATION) {
          const boost = level === 4 ? 10 : level === 3 ? 7 : level === 2 ? 4 : 2;
          bonuses = { con: boost, pwr: boost, eye: boost, k_avd: boost, spd: boost, def: boost };
        } else if (era === Eras.EXPANSION) {
          const spdBoost = level === 4 ? 10 : level === 3 ? 7 : level === 2 ? 4 : 2;
          const eyeBoost = level === 4 ? 6 : level === 3 ? 4 : level === 2 ? 2 : 0;
          bonuses = { spd: spdBoost };
          if (eyeBoost > 0) bonuses.eye = eyeBoost;
        } else if (era === Eras.BIGHAIR) {
          const boost = level === 4 ? 10 : level === 3 ? 7 : level === 2 ? 4 : 2;
          bonuses = { def: boost, spd: boost };
        } else if (era === Eras.STEROID) {
          const boost = level === 4 ? 12 : level === 3 ? 8 : level === 2 ? 5 : 2;
          bonuses = { pwr: boost };
        } else if (era === Eras.EFFICIENCY) {
          const boost = level === 4 ? 10 : level === 3 ? 7 : level === 2 ? 4 : 2;
          bonuses = { eye: boost };
        } else if (era === Eras.MODERN) {
          const boost = level === 4 ? 10 : level === 3 ? 7 : level === 2 ? 4 : 2;
          bonuses = { eye: boost, pwr: boost };
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
          ovr = typeof window !== 'undefined' && window.getPlayerOvr
            ? window.getPlayerOvr(p)
            : Math.floor(p.ovr || p.avg_attr_score || 50);
        }
        return { pos, ovr };
      });

      // Sort ascending by OVR to find the 3 weakest positions
      posScores.sort((a, b) => a.ovr - b.ovr);
      return new Set(posScores.slice(0, 3).map(x => x.pos));
    }

    getSignLegendRarityWeights() {
      const stage = (this.currentStageIndex !== undefined ? this.currentStageIndex : 0) + 1;
      const map = {
        1: { Uncommon: 1.0, Rare: 1.0, Epic: 0.90, Legendary: 0.70 },
        2: { Uncommon: 0.50, Rare: 1.10, Epic: 1.60, Legendary: 1.40 },
        3: { Uncommon: 0.20, Rare: 0.80, Epic: 2.70, Legendary: 2.90 },
        4: { Uncommon: 0.05, Rare: 0.40, Epic: 4.00, Legendary: 5.00 },
      };
      return map[stage] || map[4];
    }

    getMatchRewardRarityWeights(isBoss = false) {
      if (isBoss) return null;
      const stage = (this.currentStageIndex !== undefined ? this.currentStageIndex : 0) + 1;
      const map = {
        1: { Uncommon: 1.50, Rare: 0.90, Epic: 0.45, Legendary: 0.25 },
        2: { Uncommon: 0.80, Rare: 1.10, Epic: 0.85, Legendary: 0.60 },
        3: { Uncommon: 0.35, Rare: 1.00, Epic: 1.60, Legendary: 1.50 },
        4: { Uncommon: 0.12, Rare: 0.70, Epic: 2.50, Legendary: 2.70 },
      };
      return map[stage] || map[4];
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
      const stageWeights = this.getSignLegendRarityWeights();

      // scout_eye: draft offers show 4 cards instead of 3, with better Epic/Legendary odds
      const hasScoutEye = this.hasTrait('scout_eye');
      const offerCount = hasScoutEye ? 4 : 3;

      // Story Mode: same 95/5 activity-based split as getDraftRoundPicks /
      // getPostMatchDraftPicks — Sign Legend nodes were pulling from the raw
      // global pool with no year-awareness or Time Traveler flag.
      const isStoryYearAware = this.selectedMode === 'story' && this.selectedSeasonYear;
      let selectedPicks = [];
      if (isStoryYearAware) {
        const year = parseInt(this.selectedSeasonYear, 10);
        const isActive = p => p.debut_year !== undefined && p.last_year !== undefined && p.debut_year <= year && p.last_year >= year;
        let activePool = filtered.filter(isActive);
        let fullPool = [...filtered];
        while (selectedPicks.length < offerCount && (fullPool.length > 0 || activePool.length > 0)) {
          const useActive = activePool.length > 0 && Math.random() < 0.95;
          const source = useActive ? activePool : (fullPool.length > 0 ? fullPool : activePool);
          const picked = pickWeightedUnique(source, 1, weakPositionsSet, hasScoutEye, stageWeights);
          if (!picked.length) break;
          let chosen = picked[0];
          activePool = activePool.filter(x => x.name !== chosen.name);
          fullPool = fullPool.filter(x => x.name !== chosen.name);
          if (!useActive && !isActive(chosen)) chosen = { ...chosen, isInterEra: true };
          selectedPicks.push(chosen);
        }
      } else {
        selectedPicks = pickWeightedUnique(filtered, offerCount, weakPositionsSet, hasScoutEye, stageWeights);
      }

      // Fallback
      if (selectedPicks.length < offerCount) {
        const fallback = pool.filter(p => !onRosterNames.has(p.name) && !selectedPicks.some(x => x.name === p.name));
        const extraPicks = pickWeightedUnique(fallback, offerCount - selectedPicks.length, weakPositionsSet, hasScoutEye, stageWeights);
        selectedPicks.push(...extraPicks);
      }
      return selectedPicks;
    }

    getPostMatchDraftPicks(isBoss = false) {
      const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : (window.PlayersDB && window.PlayersDB.PLAYERS_POOL) ? window.PlayersDB.PLAYERS_POOL : (window.LAHMAN_POOL || []);
      if (pool.length === 0) return [];

      const onRosterNames = new Set(Object.values(this.roster).filter(Boolean).map(x => x.name));

      // Normal match: Uncommon, Rare, Epic, Legendary | Boss: Epic or Legendary exclusively
      const allowedRarities = isBoss
        ? ['Legendary', 'Epic']
        : ['Legendary', 'Epic', 'Rare', 'Uncommon'];

      const filtered = pool.filter(p => {
        if (onRosterNames.has(p.name)) return false;
        return allowedRarities.includes(p.rarity || 'Common');
      });

      const weakPositionsSet = this.getWeakestRosterPositions();
      const stageWeights = this.getMatchRewardRarityWeights(isBoss);

      // scout_eye: draft offers show 4 cards instead of 3, with better Epic/Legendary odds
      const hasScoutEye = this.hasTrait('scout_eye');
      const offerCount = hasScoutEye ? 4 : 3;

      // Story Mode: same 95/5 activity-based split as the draft round picks
      // (see getDraftRoundPicks) — applies to Sign Legend node + post-match
      // win rewards alike so the wildcard mechanic is consistent everywhere.
      const isStoryYearAware = this.selectedMode === 'story' && this.selectedSeasonYear;
      let selected = [];
      if (isStoryYearAware) {
        const year = parseInt(this.selectedSeasonYear, 10);
        const isActive = p => p.debut_year !== undefined && p.last_year !== undefined && p.debut_year <= year && p.last_year >= year;
        let activePool = filtered.filter(isActive);
        let fullPool = [...filtered];
        while (selected.length < offerCount && (fullPool.length > 0 || activePool.length > 0)) {
          const useActive = activePool.length > 0 && Math.random() < 0.95;
          const source = useActive ? activePool : (fullPool.length > 0 ? fullPool : activePool);
          const picked = pickWeightedUnique(source, 1, weakPositionsSet, hasScoutEye, stageWeights);
          if (!picked.length) break;
          let chosen = picked[0];
          activePool = activePool.filter(x => x.name !== chosen.name);
          fullPool = fullPool.filter(x => x.name !== chosen.name);
          if (!useActive && !isActive(chosen)) chosen = { ...chosen, isInterEra: true };
          selected.push(chosen);
        }
      } else {
        selected = pickWeightedUnique(filtered, offerCount, weakPositionsSet, hasScoutEye, stageWeights);
      }

      // Fallback if pool too small
      if (selected.length < offerCount) {
        const fallback = pool.filter(p => !onRosterNames.has(p.name) && !selected.some(x => x.name === p.name));
        const extra = pickWeightedUnique(fallback, offerCount - selected.length, weakPositionsSet, hasScoutEye, stageWeights);
        selected.push(...extra);
      }
      return selected;
    }

    addPlayerToRoster(playerData) {
      const playerInstance = {
        ...playerData,
        id: `player_${playerData.name.replace(/\s+/g, '')}_${Date.now()}`,
        stamina: 100,
        upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
      };
      if (window.BaseballDex) window.BaseballDex.unlock(playerInstance);

      const nativePos = playerInstance.pos;
      const nativeLocked = this.positionLocks && (this.positionLocks[nativePos] || 0) > 0;
      if (!nativeLocked && this.roster[nativePos] && this.roster[nativePos].isReplacement) {
        const oldPlayer = this.roster[nativePos];
        if (oldPlayer && oldPlayer.equipped_item) {
          if (!this.itemsInventory) this.itemsInventory = [];
          this.itemsInventory.push(oldPlayer.equipped_item);
          oldPlayer.equipped_item = null;
        }
        this.roster[nativePos] = playerInstance;
        return { success: true, message: (typeof window.t==='function'?window.t('game.player_placed_native', { name: playerInstance.name, pos: nativePos }):`¡${playerInstance.name} colocado directamente en ${nativePos}!`) };
      }

      const dhLocked = this.positionLocks && (this.positionLocks.DH || 0) > 0;
      if (!dhLocked && nativePos !== 'DH' && this.roster.DH && this.roster.DH.isReplacement) {
        const oldPlayer = this.roster.DH;
        if (oldPlayer && oldPlayer.equipped_item) {
          if (!this.itemsInventory) this.itemsInventory = [];
          this.itemsInventory.push(oldPlayer.equipped_item);
          oldPlayer.equipped_item = null;
        }
        this.roster.DH = playerInstance;
        return { success: true, message: (typeof window.t==='function'?window.t('game.player_placed_dh', { name: playerInstance.name }):`¡${playerInstance.name} colocado como DH!`) };
      }

      // Roster has no replacement level at native position: trigger manual replace selection
      return { success: false, message: (typeof window.t==='function'?window.t('game.lineup_full'):'Alineación ocupada. Elige a quién reemplazar.') };
    }

    replaceRosterPlayer(slot, newPlayerData) {
      if (!this.roster[slot]) return false;
      if (this.positionLocks && (this.positionLocks[slot] || 0) > 0) return false;

      // Auto-unequip old player's item to backpack
      const oldPlayer = this.roster[slot];
      if (oldPlayer && oldPlayer.equipped_item) {
        if (!this.itemsInventory) this.itemsInventory = [];
        this.itemsInventory.push(oldPlayer.equipped_item);
        oldPlayer.equipped_item = null;
      }

      const playerInstance = {
        ...newPlayerData,
        id: `player_${newPlayerData.name.replace(/\s+/g, '')}_${Date.now()}`,
        stamina: 100,
        upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
      };
      if (window.BaseballDex) window.BaseballDex.unlock(playerInstance);

      this.roster[slot] = playerInstance;
      return true;
    }

    // ── EQUIPMENT & ITEM INVENTORY MANAGEMENT ─────────────────────────────────
    equipItem(itemIndex, slotKey) {
      if (!this.itemsInventory) this.itemsInventory = [];
      if (itemIndex < 0 || itemIndex >= this.itemsInventory.length) return false;
      const player = this.roster[slotKey];
      if (!player) return false;

      const itemToEquip = this.itemsInventory.splice(itemIndex, 1)[0];
      if (player.equipped_item) {
        this.itemsInventory.push(player.equipped_item);
      }
      player.equipped_item = itemToEquip;
      return true;
    }

    unequipItem(slotKey) {
      if (!this.itemsInventory) this.itemsInventory = [];
      const player = this.roster[slotKey];
      if (!player || !player.equipped_item) return false;

      this.itemsInventory.push(player.equipped_item);
      player.equipped_item = null;
      return true;
    }

    useConsumableItem(item, targetSlotKey) {
      if (!item) return false;
      const player = targetSlotKey ? this.roster[targetSlotKey] : null;

      // 1. Stamina Heals
      if (player) {
        if (item.staminaHealPercent) {
          player.stamina = 100;
        } else if (item.staminaHeal) {
          player.stamina = Math.min(100, (player.stamina !== undefined ? player.stamina : 100) + item.staminaHeal);
        }
        // Permanent stats
        if (item.permStats) {
          if (item.permStats.con) player.perm_con = (player.perm_con || 0) + item.permStats.con;
          if (item.permStats.pwr) player.perm_pwr = (player.perm_pwr || 0) + item.permStats.pwr;
          if (item.permStats.spd) player.perm_spd = (player.perm_spd || 0) + item.permStats.spd;
          if (item.permStats.def) player.perm_def = (player.perm_def || 0) + item.permStats.def;
          if (item.permStats.eye) player.perm_eye = (player.perm_eye || 0) + item.permStats.eye;
          if (item.permStats.k_avd || item.permStats.kavd) player.perm_kavd = (player.perm_kavd || 0) + (item.permStats.k_avd || item.permStats.kavd);
        }
      }

      // 2. Team-wide Stamina Heals
      if (item.teamStaminaHeal) {
        Object.keys(this.roster).forEach(slot => {
          const p = this.roster[slot];
          if (p) {
            p.stamina = Math.min(100, (p.stamina !== undefined ? p.stamina : 100) + item.teamStaminaHeal);
          }
        });
      }

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
          // Super Boss Part 2 (post-Stage-15): Story Mode never had an
          // equivalent to Quick Play's 4-Legendary-pitcher rotation — it just
          // re-served the same seasonData.boss object, so the "second fight"
          // looked identical to the first. Build a fresh squad of 4 random
          // Legendary pitchers pulled from every pitcher baked into this
          // season's data (falls back to Epic if a thin year has <4 Legendaries).
          if (stage === 15 && this.isSuperBossActive) {
            const allPitchers = [];
            const addFrom = (arr) => { (arr || []).forEach(e => { (e.pitchers || []).forEach(p => allPitchers.push(p)); }); };
            addFrom(seasonData.low); addFrom(seasonData.mid); addFrom(seasonData.high);
            if (seasonData.boss) addFrom([seasonData.boss]);
            if (seasonData.zones) {
              seasonData.zones.forEach(z => {
                addFrom(z.teams);
                if (z.boss) addFrom([z.boss]);
              });
            }
            if (seasonData.divisions) {
              Object.values(seasonData.divisions).forEach(d => {
                addFrom(d.teams);
                if (d.boss) addFrom([d.boss]);
              });
            }
            const seen = new Set();
            const dedup = allPitchers.filter(p => {
              if (!p || seen.has(p.name)) return false;
              seen.add(p.name);
              return true;
            });
            let legPool = dedup.filter(p => p.rarity === 'Legendary');
            if (legPool.length < 4) {
              const legNames = new Set(legPool.map(p => p.name));
              const epicPool = dedup.filter(p => p.rarity === 'Epic' && !legNames.has(p.name));
              legPool = legPool.concat(epicPool);
            }
            const shuffled = [...legPool].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(4, shuffled.length));
            if (selected.length > 0) {
              const avgOvr = Math.round(selected.reduce((s, p) => s + (p.ovr || 50), 0) / selected.length);
              this.currentEnemy = {
                id: `story_super_boss_${this.selectedSeasonYear}_${Date.now()}`,
                name: `⚡ SUPER BOSS: ${selected[0].name}`,
                tier: 'S',
                isBoss: true,
                isSuperBoss: true,
                year: this.selectedSeasonYear,
                win_pct: 1.0,
                ovr: avgOvr,
                pitchers: sortPitchingStaff(selected),
                rarity: 'Legendary'
              };
              return this.currentEnemy;
            }
          }

          // Division-based maps (1969+ seasons only — see loadSeasonOpponents).
          // Zone = one division; the zone's boss stage (local stage 3) draws
          // from that division's Epic+ pool instead of the global tier boss.
          // Stage 15 (the absolute Final Boss) is untouched by divisions.
          if (this.selectedDivisions && stage !== 15) {
            const zoneIdx = this.getZoneForStage(stage);
            const division = this.selectedDivisions[zoneIdx];
            if (division) {
              const localIdx = stage - zoneIdx * 4;
              const isZoneBossStage = (localIdx === 3);

              if (!this.encounteredTeams) this.encounteredTeams = new Set();
              let chosen = null;
              if (isZoneBossStage && division.boss) {
                chosen = division.boss;
              } else {
                const teams = division.teams || [];
                let candidates = teams.filter(e => e && !this.encounteredTeams.has(e.id || e.name));
                if (candidates.length === 0) candidates = teams;
                if (candidates.length > 0) {
                  chosen = candidates[Math.floor(Math.random() * candidates.length)];
                }
              }
              if (chosen) {
                this.encounteredTeams.add(chosen.id || chosen.name);
                chosen = { ...chosen, pitchers: sortPitchingStaff(chosen.pitchers) };
                this.currentEnemy = chosen;
                return this.currentEnemy;
              }
            }
          }

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
        // Anchored on the real sta range across both pools (20-110): SP 60-160 HP, RP/CL 45-80 HP.
        const hp = (role === 'SP')
          ? Math.round(60 + (staVal - 20) * (10 / 9))
          : Math.round(45 + (staVal - 20) * (7 / 18));
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
          ovr: p.ovr !== undefined ? p.ovr : (p._ovr !== undefined ? p._ovr : (window.UI && window.UI.getPlayerOvr ? window.UI.getPlayerOvr(p) : 50)),
          rarity: p.rarity || 'Common',
          era: p.era || '',
          team: p.team || '',
          year: yearVal,
          h9:  p.h9  !== undefined ? p.h9  : (p.grt !== undefined ? p.grt : 50),
          k9:  p.k9  !== undefined ? p.k9  : (p.stf !== undefined ? p.stf : 50),
          bb9: p.bb9 !== undefined ? p.bb9 : (p.ctl !== undefined ? p.ctl : 50),
          hr9: p.hr9 !== undefined ? p.hr9 : (p.mov !== undefined ? p.mov : 50)
        };
      };

      // Helper for OVR calculation
      const getOvr = (p) => (p.ovr !== undefined ? p.ovr : (p._ovr !== undefined ? p._ovr : (window.UI && window.UI.getPlayerOvr ? window.UI.getPlayerOvr(p) : 50)));

      // Check if Super Boss Fight is active (Stage 15 Part 2: 4 Legendary Pitchers 95+ OVR!)
      if (this.isSuperBossActive) {
        let leg95Pool = fullPool.filter(p => p.rarity === 'Legendary' && getOvr(p) >= 95);
        if (leg95Pool.length < 4) leg95Pool = fullPool.filter(p => p.rarity === 'Legendary');
        const p1 = createPitcherObj(pickPitcher(leg95Pool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(leg95Pool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(leg95Pool, 'RP'), 'RP');
        const p4 = createPitcherObj(pickPitcher(leg95Pool, 'RP'), 'RP');
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

      // Map 1 Boss (Stage 3): 1 Rare, 2 Uncommon
      if (stage === 3) {
        const rarePool   = fullPool.filter(p => p.rarity === 'Rare');
        const uncommPool = fullPool.filter(p => p.rarity === 'Uncommon');
        const p1 = createPitcherObj(pickPitcher(rarePool.length ? rarePool : fullPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(uncommPool.length ? uncommPool : fullPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(uncommPool.length > 1 ? uncommPool : fullPool, 'RP'), 'RP');
        const selected = [p1, p2, p3];
        this.currentEnemy = {
          id: `boss_map1_${Date.now()}`,
          name: `BOSS: ${p1.cleanName}`,
          tier: 'A',
          isBoss: true,
          pitchers: selected,
          _ovr: p1.ovr,
          era: p1.era,
          rarity: 'Rare'
        };
        return this.currentEnemy;
      }

      // Map 2 Boss (Stage 7): 1 Epic, 2 Rare
      if (stage === 7) {
        const epicPool   = fullPool.filter(p => p.rarity === 'Epic');
        const rarePool   = fullPool.filter(p => p.rarity === 'Rare');
        const p1 = createPitcherObj(pickPitcher(epicPool.length ? epicPool : fullPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(rarePool.length ? rarePool : fullPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(rarePool.length > 1 ? rarePool : fullPool, 'RP'), 'RP');
        const selected = [p1, p2, p3];
        this.currentEnemy = {
          id: `boss_map2_${Date.now()}`,
          name: `BOSS: ${p1.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: selected,
          _ovr: p1.ovr,
          era: p1.era,
          rarity: 'Epic'
        };
        return this.currentEnemy;
      }

      // Map 3 Boss (Stage 11): 1 Legendary, 2 Epic
      if (stage === 11) {
        const legPool  = fullPool.filter(p => p.rarity === 'Legendary');
        const epicPool = fullPool.filter(p => p.rarity === 'Epic');
        const p1 = createPitcherObj(pickPitcher(legPool.length ? legPool : fullPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(epicPool.length ? epicPool : fullPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(epicPool.length > 1 ? epicPool : fullPool, 'RP'), 'RP');
        const selected = [p1, p2, p3];
        this.currentEnemy = {
          id: `boss_map3_${Date.now()}`,
          name: `BOSS: ${p1.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: selected,
          _ovr: p1.ovr,
          era: p1.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Map 4 Boss Fight #1 (Stage 15): 2 Legendary, 1 Epic
      if (stage === 15) {
        const legPool  = fullPool.filter(p => p.rarity === 'Legendary');
        const epicPool = fullPool.filter(p => p.rarity === 'Epic');
        const p1 = createPitcherObj(pickPitcher(legPool.length ? legPool : fullPool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(legPool.length > 1 ? legPool : fullPool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(epicPool.length ? epicPool : fullPool, 'RP'), 'RP');
        const selected = [p1, p2, p3];
        this.currentEnemy = {
          id: `boss_map4_part1_${Date.now()}`,
          name: `BOSS FINAL: ${p1.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: selected,
          _ovr: p1.ovr,
          era: p1.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Regular stages (Map 1 to 4) overlapping 20-point OVR bands
      let minOvr = 50, maxOvr = 69.9;
      if (stage >= 4 && stage <= 7) {
        minOvr = 60; maxOvr = 79.9;
      } else if (stage >= 8 && stage <= 11) {
        minOvr = 70; maxOvr = 89.9;
      } else if (stage >= 12) {
        minOvr = 80; maxOvr = 99.0;
      }

      let stagePool = fullPool.filter(p => {
        const o = getOvr(p);
        return o >= minOvr && o <= maxOvr;
      });
      if (stagePool.length === 0) stagePool = fullPool;
      const p1 = createPitcherObj(pickPitcher(stagePool, 'SP'), 'SP');
      const p2 = createPitcherObj(pickPitcher(stagePool));
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
        eff.slot = slot;
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
          upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
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
          const isStaminaImmune = staminaImmuneIds.has(player.id || player.name) || (player.equipped_item && player.equipped_item.energy_immune);
          let actualLoss = staminaLoss;
          if (player.equipped_item && player.equipped_item.energy_half_loss) {
            actualLoss = Math.round(actualLoss * 0.5);
          }

          player.stamina = isStaminaImmune
            ? Math.max(0, player.stamina !== undefined ? player.stamina : 100)
            : Math.max(0, (player.stamina !== undefined ? player.stamina : 100) - actualLoss);

          if (player.stamina <= 0) {
            // Auto-unequip retired player's item to backpack
            if (player.equipped_item) {
              if (!this.itemsInventory) this.itemsInventory = [];
              this.itemsInventory.push(player.equipped_item);
              player.equipped_item = null;
            }

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
                upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
              };
              this.roster[pos] = newInstance;
              if (window.BaseballDex) window.BaseballDex.unlock(newInstance);
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

      // Always unlock entire active roster in Dex upon completing match
      if (window.BaseballDex) window.BaseballDex.unlockRoster(this.roster);

      // Winning a match means the full enemy rotation for that match was
      // knocked out — record them as "defeated" for this run (162-0 Challenge
      // pitcher eligibility, Quick Play only, gated at unlock time).
      if (won && simResult.enemyPitchers && simResult.enemyPitchers.length) {
        simResult.enemyPitchers.forEach(p => this.runDefeatedPitchers.push(p));
      }

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
          const divisionMsg = currentEnemy.division
            ? (typeof window.t==='function'?window.t('game.division_defeated', { division: currentEnemy.division, year: this.selectedSeasonYear }):`¡Venciste a la División ${currentEnemy.division} de la ${this.selectedSeasonYear}!`) + ' '
            : '';
          return {
            won: true,
            isBossStage: true,
            isTraitReward: true,
            traitChoices,
            earnings: earnings + eliteBonus,
            retiredAlerts,
            message: divisionMsg + (typeof window.t==='function'?window.t('game.boss_victory_trait', { earnings: earnings + eliteBonus }):`¡Victoria de Jefe! +$${earnings + eliteBonus}. Elige una Trait Pasiva de Leyenda.`)
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
      const list = (window.ItemsDatabase && window.ItemsDatabase.length > 0) ? window.ItemsDatabase : ManagerEventsList;
      const idx = Math.floor(Math.random() * list.length);
      return list[idx];
    }

    getRandomGamble() {
      const idx = Math.floor(Math.random() * HighStakesGamblesList.length);
      return HighStakesGamblesList[idx];
    }

    resolveGamble(gambleId, targetPos) {
      const gamble = HighStakesGamblesList.find(g => g.id === gambleId);
      if (!gamble) return { success: false, resultText: 'Apuesta inválida.' };
      return gamble.resolve(this, targetPos);
    }
  }

  window.Game = new GameState();
})();
