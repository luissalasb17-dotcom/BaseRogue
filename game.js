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
    if (typeof window !== 'undefined' && typeof window.getPlayerOvr === 'function') {
      return window.getPlayerOvr(p);
    }
    if (p.ovr !== undefined) return p.ovr;
    const con = (p.con || 0) + ((p.upgrades && p.upgrades.con) || 0);
    const pwr = (p.pwr || 0) + ((p.upgrades && p.upgrades.pwr) || 0);
    const eye = (p.eye || 0) + ((p.upgrades && p.upgrades.eye) || 0);
    const kavd = (p.k_avd !== undefined ? p.k_avd : (p.k_avoid !== undefined ? p.k_avoid : (p.k_avoid_val !== undefined ? p.k_avoid_val : con))) + ((p.upgrades && p.upgrades.k_avd) || 0);
    const spd = (p.spd || 0) + ((p.upgrades && p.upgrades.spd) || 0);
    const def = (p.def || 0) + ((p.upgrades && p.upgrades.def) || 0);
    const raw = con * 0.28 + pwr * 0.28 + eye * 0.12 + def * 0.12 + spd * 0.10 + kavd * 0.10;
    if (raw <= 37.0) return Math.floor(50.0 + ((raw - 10.0) / 27.0) * 9.9);
    if (raw <= 48.0) return Math.floor(60.0 + ((raw - 37.0) / 11.0) * 9.9);
    if (raw <= 62.0) return Math.floor(70.0 + ((raw - 48.0) / 14.0) * 9.9);
    if (raw <= 76.0) return Math.floor(80.0 + ((raw - 62.0) / 14.0) * 9.9);
    return Math.floor(90.0 + Math.min(9.9, ((raw - 76.0) / 18.0) * 9.9));
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

  const _getGambleChance = (G, baseChance = 0.50) => {
    const boost = (G && typeof G.hasTrait === 'function' && G.hasTrait('midas_touch')) ? 0.25 : 0;
    return Math.min(0.95, baseChance + boost);
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
        const success = Math.random() <= _getGambleChance(G, this.chance);
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
      id: 'gamble_scout',
      icon: '🕵️',
      get title() { return typeof window.t==='function'?window.t('gamble.scout.title'):'Cazatalentos Clandestino'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.scout.desc'):'Un cazatalentos ofrece una carta Legendary para tu posición más débil. Si ganas, la firmas gratis. Si pierdes, tu mejor jugador se lesiona: -20 en todas sus stats por el resto de la run.'; },
      chance: 0.50,
      resolve(G, targetPos) {
        const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : [];
        const success = Math.random() <= _getGambleChance(G, this.chance);

        if (success) {
          let worstPos = (targetPos && G.roster[targetPos]) ? targetPos : null;
          if (!worstPos) {
            let worstOvr = Infinity;
            Object.keys(G.roster).forEach(pos => {
              const p = G.roster[pos];
              if (p) {
                const ovr = _gambleOvr(p);
                if (ovr < worstOvr) { worstOvr = ovr; worstPos = pos; }
              }
            });
          }
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
          if (window.BaseballDex && typeof window.BaseballDex.unlockPlayer === 'function') {
            window.BaseballDex.unlockPlayer(newInstance);
          }
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
        if (!p.upgrades) p.upgrades = { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 };
        ['con', 'pwr', 'eye', 'k_avd', 'spd', 'def'].forEach(k => { p.upgrades[k] = (p.upgrades[k] || 0) - 20; });
        p.isInjured = true;
        return { success, resultText: (typeof window.t==='function'?window.t('gamble.scout.result_lose', { name: p.name }):`${p.name} se lesiona: -20 en todas sus stats por el resto de la run.`) };
      }
    },
    {
      id: 'gamble_blind_trade',
      icon: '🔄',
      get title() { return typeof window.t==='function'?window.t('gamble.trade.title'):'Traspaso a Ciegas (Peor Titular)'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.trade.desc'):'Pones a tu peor titular en el mercado de traspasos. Si ganas (50%), recibes un reemplazo ÉPICO o LEGENDARIO garantizado en esa posición. Si pierdes (50%), es sustituido por un Common (50 OVR) y la posición queda bloqueada por 1 mapa completo (6 nodos).'; },
      chance: 0.50,
      resolve(G, targetPos) {
        const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) ? window.PlayersDB.LAHMAN_POOL : [];
        let worstPos = (targetPos && G.roster[targetPos]) ? targetPos : null;
        if (!worstPos) {
          let worstOvr = Infinity;
          Object.keys(G.roster).forEach(pos => {
            const p = G.roster[pos];
            if (p) {
              const ovr = _gambleOvr(p);
              if (ovr < worstOvr) { worstOvr = ovr; worstPos = pos; }
            }
          });
        }
        if (!worstPos || !G.roster[worstPos]) return { success: false, resultText: (typeof window.t==='function'?window.t('gamble.trade.no_target'):'No hay titular para intercambiar.') };

        const current = G.roster[worstPos];
        const success = Math.random() <= _getGambleChance(G, this.chance);

        if (success) {
          const pick = _pickGambleCandidate(pool, worstPos, ['Legendary', 'Epic']);
          if (!pick) return { success, resultText: (typeof window.t==='function'?window.t('gamble.no_player_found', { pos: worstPos }):`No se encontró ningún jugador de ${worstPos} disponible.`) };

          const newInstance = {
            ...pick,
            id: `player_${pick.name.replace(/\s+/g, '')}_${Date.now()}_trade`,
            stamina: 100,
            upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
          };
          G.roster[worstPos] = newInstance;

          if (window.BaseballDex && typeof window.BaseballDex.unlockPlayer === 'function') {
            window.BaseballDex.unlockPlayer(newInstance);
          }

          return {
            success: true,
            resultText: (typeof window.t==='function'?window.t('gamble.trade.result_win', { oldName: current ? current.name : '(vacío)', newName: newInstance.name, rarity: newInstance.rarity, pos: worstPos }):`¡Gran negocio! ${current ? current.name : '(vacío)'} → ${newInstance.name} (${newInstance.rarity}) en ${worstPos}.`)
          };
        } else {
          const pick = _pickGambleCandidate(pool, worstPos, ['Common']);
          if (pick) {
            const newInstance = {
              ...pick,
              id: `player_${pick.name.replace(/\s+/g, '')}_${Date.now()}_trade_fail`,
              stamina: 100,
              upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 }
            };
            G.roster[worstPos] = newInstance;
          }
          G.positionLocks = G.positionLocks || {};
          G.positionLocks[worstPos] = 6; // 1 full map (6 floors/nodes)

          return {
            success: false,
            resultText: (typeof window.t==='function'?window.t('gamble.trade.result_lose', { oldName: current ? current.name : '(vacío)', newName: pick ? pick.name : 'Common', pos: worstPos }):`Negociación fallida: ${pick ? pick.name : 'Common'} (50 OVR) reemplaza a ${current ? current.name : '(vacío)'} en [${worstPos}] y la posición queda bloqueada por 1 mapa completo (6 nodos).`)
          };
        }
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
        const success = Math.random() <= _getGambleChance(G, this.chance);
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
      id: 'gamble_super_soldier',
      icon: '⚡',
      requiresTargetPlayer: true,
      get title() { return typeof window.t==='function'?window.t('gamble.soldier.title'):'Suero del Súper-Bateador'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.soldier.desc'):'Inyectas un suero experimental en tu bateador elegido. Si ganas, obtiene +35 Contacto y +35 Poder permanentes. Si pierdes, sufre fatiga crónica: -15 en todas sus estadísticas.'; },
      chance: 0.50,
      resolve(G, targetPos) {
        const target = G.roster[targetPos];
        if (!target) return { success: false, resultText: (typeof window.t==='function'?window.t('gamble.soldier.no_valid_target'):'Elige un jugador válido.') };
        const success = Math.random() <= _getGambleChance(G, this.chance);
        if (!target.upgrades) target.upgrades = { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 };
        if (success) {
          target.upgrades.con = (target.upgrades.con || 0) + 35;
          target.upgrades.pwr = (target.upgrades.pwr || 0) + 35;
          return { success, resultText: (typeof window.t==='function'?window.t('gamble.soldier.result_win', { name: target.name }):`¡Éxito absoluto! ${target.name} desata un poder titánico: +35 CON y +35 PWR permanentes.`) };
        }
        ['con', 'pwr', 'eye', 'k_avd', 'spd', 'def'].forEach(k => { target.upgrades[k] = (target.upgrades[k] || 0) - 15; });
        return { success, resultText: (typeof window.t==='function'?window.t('gamble.soldier.result_lose', { name: target.name }):`Rechazo celular: ${target.name} sufre fatiga crónica (-15 a todas sus estadísticas).`) };
      }
    },
    {
      id: 'gamble_black_market',
      icon: '🎒',
      get title() { return typeof window.t==='function'?window.t('gamble.market.title'):'Mercado Negro de Equipamiento'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.market.desc'):'Negocias con un contrabandista clandestino. Si ganas, obtienes 2 Ítems de Equipamiento Supremos (+35 stats). Si pierdes, te estafan: pierdes $20 de presupuesto y todo el equipo sufre -30 de Stamina.'; },
      chance: 0.50,
      resolve(G) {
        const success = Math.random() <= _getGambleChance(G, this.chance);
        if (success) {
          const itemsList = (window.ItemsDatabase && window.ItemsDatabase.length > 0) ? window.ItemsDatabase : [];
          if (!G.itemsInventory) G.itemsInventory = [];
          const granted = [];
          if (itemsList.length > 0) {
            const shuffled = [...itemsList].sort(() => Math.random() - 0.5);
            const chosen = shuffled.slice(0, 2);
            chosen.forEach(it => {
              const itemObj = it.riskyOption ? { ...it.riskyOption } : { ...it.safeOption };
              G.itemsInventory.push(itemObj);
              granted.push(itemObj.name || itemObj.text || 'Ítem Supremo');
            });
          }
          const itemNamesStr = granted.join(' y ');
          return { success, resultText: (typeof window.t==='function'?window.t('gamble.market.result_win', { items: itemNamesStr }):`¡Contrabando legendario! Recibiste en tu mochila: ${itemNamesStr}.`) };
        }
        const lostBudget = Math.min(G.budget || 0, 20);
        G.budget = Math.max(0, (G.budget || 0) - 20);
        Object.keys(G.roster).forEach(pos => {
          const p = G.roster[pos];
          if (p) p.stamina = Math.max(10, (p.stamina || 100) - 30);
        });
        return { success, resultText: (typeof window.t==='function'?window.t('gamble.market.result_lose', { budget: lostBudget }):`¡Emboscada en el callejón! Perdiste $${lostBudget} y todos tus jugadores sufren -30 de Stamina por el forcejeo.`) };
      }
    },
    {
      id: 'gamble_gold_glove',
      icon: '🛡️',
      get title() { return typeof window.t==='function'?window.t('gamble.defense.title'):'Guante de Oro Clandestino'; },
      get desc() { return typeof window.t==='function'?window.t('gamble.defense.desc'):'Apuestas a transformar tu defensiva. Si ganas, TODA tu alineación (los 9 jugadores) recibe +20 DEF permanente. Si pierdes, tus 3 jardineros titulares (LF, CF, RF) sufren desconcentración: -15 DEF permanente.'; },
      chance: 0.50,
      resolve(G) {
        const success = Math.random() <= _getGambleChance(G, this.chance);
        if (success) {
          Object.keys(G.roster).forEach(pos => {
            const p = G.roster[pos];
            if (p) {
              if (!p.upgrades) p.upgrades = { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 };
              p.upgrades.def = (p.upgrades.def || 0) + 20;
            }
          });
          return { success, resultText: (typeof window.t==='function'?window.t('gamble.defense.result_win'):'¡Muralla infranqueable! Toda tu alineación (los 9 titulares) recibe +20 DEF de por vida.') };
        }
        const ofPositions = ['LF', 'CF', 'RF'];
        const affectedNames = [];
        ofPositions.forEach(pos => {
          const p = G.roster[pos];
          if (p) {
            if (!p.upgrades) p.upgrades = { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0, sta: 0 };
            p.upgrades.def = (p.upgrades.def || 0) - 15;
            affectedNames.push(`[${pos}] ${p.name}`);
          }
        });
        const namesStr = affectedNames.length ? affectedNames.join(', ') : 'Jardineros';
        return { success, resultText: (typeof window.t==='function'?window.t('gamble.defense.result_lose', { names: namesStr }):`Fallo defensivo: ${namesStr} sufren -15 DEF permanente.`) };
      }
    }
  ];

  function pickWeightedUnique(pool, count, weakPositionsMap, rarityBoost = false, rarityWeights = null) {
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

        // Weighted odds: 4.0x for primary position, 2.0x for secondary position
        let w = 1.0;
        if (weakPositionsMap) {
          if (weakPositionsMap[primaryPos] !== undefined) {
            w = Number(weakPositionsMap[primaryPos]) || 4.0;
          } else {
            for (const sp of secPositions) {
              if (weakPositionsMap[sp] !== undefined) {
                w = Math.max(w, 2.0);
              }
            }
          }
        }

        // Stage-based Rarity Multiplier
        if (rarityWeights && rarityWeights[p.rarity] !== undefined) {
          w *= Number(rarityWeights[p.rarity]);
        }

        // scout_eye: increases the odds of Epic/Legendary showing up in draft offers (only if that rarity is active/weight > 0)
        if (rarityBoost && (p.rarity === 'Epic' || p.rarity === 'Legendary') && w > 0) {
          w *= 2.5;
        }
        totalWeight += w;
        return w;
      });

      if (totalWeight <= 0) {
        // If all candidates in poolCopy have 0 weight (e.g. all are 0-weight rarities like Legendary in Map 1),
        // do NOT forcibly pick a 0-weight card. Return whatever has been selected so far.
        break;
      }

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

  function calcPitcherHP(sta) {
    const staVal = (sta !== undefined && sta !== null) ? Number(sta) : 50;
    return Math.max(75, Math.min(200, Math.round(75 + (staVal - 20) * (125 / 105))));
  }

  function sortPitchingStaff(pitchers) {
    if (!pitchers || !Array.isArray(pitchers) || pitchers.length === 0) return pitchers;

    const sps = [];
    const rps = [];

    pitchers.forEach(p => {
      const staVal = p.sta !== undefined ? p.sta : (p.sta_val !== undefined ? p.sta_val : 50);
      const unifiedHp = calcPitcherHP(staVal);
      const normalizedP = {
        ...p,
        sta: staVal,
        hp: unifiedHp,
        maxHp: unifiedHp
      };

      const roleUpper = (p.role || '').toUpperCase();
      const isSP = roleUpper === 'SP' || (!p.role && (staVal >= 50));
      if (isSP) {
        sps.push(normalizedP);
      } else {
        rps.push(normalizedP);
      }
    });

    // Sort SPs by stamina descending
    sps.sort((a, b) => (b.sta || 50) - (a.sta || 50));

    // Sort RPs by stamina descending
    rps.sort((a, b) => (b.sta || 50) - (a.sta || 50));

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

      // ── Traits Passives ───────────────────────────────────────────────
      this.equippedTraits = [];  // Up to 3 traits (one per boss map)
      this.activeTeamTraits = [];

      // ── Items & Active Bonueses ───────────────────────────────────────
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

      // ── Run Stats Tracking ────────────────────────────────────────────
      // { playerName: { ab, h, bb, so, doubles, triples, hr, rbi, runs, e } }
      this.runBatterStats = {};
      this.defensiveErrors = 0;
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
        tr('eagle_patience',    '🦅', 'eagle', '🦅 Paciencia de Águila', 'Zona de Boleto (BB) aumenta +5 puntos. Cada BB inflige +15 HP de daño extra y regenera +10 Stamina al bateador.'),
        tr('slugger_momentum',  '💥', 'slugger', '💥 Impulso de Jonronero', 'Cada HR inflige +30 HP de daño extra al pitcher rival.'),
        tr('surgical_contact',  '🎯', 'surgical', '🎯 Contacto Quirúrgico', 'Zona de Ponche (SO) reducida en -3 puntos para toda la alineación.'),
        tr('speed_demons',      '⚡', 'speed', '⚡ Velocistas Agresivos', 'Jugadores con SPD > 60 roban la base automáticamente en sencillos y boletos. Debuff al pitcher dura 3 impactos.'),
        tr('extra_base_impact', '💣', 'extrabase', '💣 Impacto Acumulado', 'Batazos de extra bases (2B, 3B, HR) infligen +10 HP de daño adicional al pitcher.'),
        tr('iron_shield',       '🛡️', 'shield', '🛡️ Escudo de Hierro', 'Repara automáticamente +25 de Escudo al inicio de cada entrada (hasta el límite de tu equipo).'),
        tr('defensive_wall',    '🧱', 'wall', '🧱 Muro Defensivo', 'Outs normales reducen daño a -13 HP en lugar de -20 HP.'),
        tr('endless_stamina',   '🔋', 'stamina', '🔋 Resistencia Inagotable', 'Los bateadores solo pierden 10 de Stamina por partido (en lugar de 20).'),
        tr('clutch_legends',    '❤️', 'clutch', '❤️ Resiliencia de Leyendas', 'Si Team HP cae por debajo de 35, activa estado Clutch: +15 a CON, PWR, EYE, SPD, DEF para toda la alineación.'),
        tr('golden_glove',      '🧤', 'glove', '🧤 Guantelete Dorado', 'Todos los bateadores reciben +10 DEF, aumentando la capacidad del Escudo de equipo.'),
        tr('secondary_master',  '🔄', 'secondary', '🔄 Posición Secundaria Maestra', 'Elimina la penalización (-15%) al colocar bateadores en su Posición Secundaria.'),
        tr('era_accelerated',   '⏳', 'era_acc', '⏳ Sinergia de Era Acelerada', 'Solo necesitas 2 jugadores de la misma Era para activar la Sinergia de Nivel 2 (normalmente 4).'),
        tr('elite_negotiator',  '💼', 'elite', '💼 Negociador de Élite', 'Obtienes +$10 de presupuesto extra tras cada victoria.'),
        tr('scout_eye',         '🌟', 'scout', '🌟 Ojo de Cazatalentos', 'Las ofertas de draft muestran 4 jugadores en lugar de 3 y aumenta probabilidad de Epic/Legendary.'),
        tr('veteran_rotation',  '🔋', 'veteran', '🔋 Segunda Vida', 'Tu alineación completa recupera un +30% de Stamina al inicio de cada nuevo mapa.'),
        tr('reliever_ambush',   '🔥', 'reliever', '🔥 Emboscada al Relevista', 'El primer batazo contra un nuevo pitcher rival inflige +50% de daño extra.'),
        tr('early_pressure',    '📈', 'pressure', '📈 Presión Temprana', 'El primer bateador de cada entrada gana +20 de CON y EYE para ese turno.'),
        tr('ghost_runners',     '🏃', 'ghost', '🏃 Corredores Fantasma', 'Inicias la 3ª entrada y todos los Extra Innings de cada partido con un corredor en 2ª base automáticamente.'),
        tr('legendary_domination', '👑', 'legendary', '👑 Dominio Legendario', 'Si tienes 2 o más jugadores Legendary en titular, todos reciben +10 a todas sus estadísticas.'),
        tr('back_to_back',      '💥', 'back2back', '💥 Cadena de Poder', 'Después de un HR, el siguiente bateador gana +20 de PWR y CON para ese turno.'),
        tr('midas_touch',       '🎰', 'midas', '🎰 Toque de Midas', 'Aumenta en +25% las probabilidades de éxito en eventos de Suerte (LUCK), Decisiones y Ruletas de Prototipos.'),
        tr('heavy_artillery',   '🔨', 'artillery', '🔨 Poder de Demolición', 'El daño remanente al noquear a un lanzador se transfiere al 100% al relevista (en lugar del 50% base).')
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

      const getOrCreateBatterStat = (name) => {
        if (!this.runBatterStats[name]) {
          this.runBatterStats[name] = { g: 0, ab: 0, h: 0, bb: 0, so: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, sb: 0, e: 0, dmg: 0 };
        }
        const s = this.runBatterStats[name];
        s.g = (typeof s.g === 'number' && !isNaN(s.g)) ? s.g : 0;
        s.ab = (typeof s.ab === 'number' && !isNaN(s.ab)) ? s.ab : 0;
        s.h = (typeof s.h === 'number' && !isNaN(s.h)) ? s.h : 0;
        s.bb = (typeof s.bb === 'number' && !isNaN(s.bb)) ? s.bb : 0;
        s.so = (typeof s.so === 'number' && !isNaN(s.so)) ? s.so : 0;
        s.doubles = (typeof s.doubles === 'number' && !isNaN(s.doubles)) ? s.doubles : 0;
        s.triples = (typeof s.triples === 'number' && !isNaN(s.triples)) ? s.triples : 0;
        s.hr = (typeof s.hr === 'number' && !isNaN(s.hr)) ? s.hr : 0;
        s.rbi = (typeof s.rbi === 'number' && !isNaN(s.rbi)) ? s.rbi : 0;
        s.sb = (typeof s.sb === 'number' && !isNaN(s.sb)) ? s.sb : 0;
        s.e = (typeof s.e === 'number' && !isNaN(s.e)) ? s.e : 0;
        s.dmg = (typeof s.dmg === 'number' && !isNaN(s.dmg)) ? s.dmg : 0;
        return s;
      };

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
        const s = getOrCreateBatterStat(name);
        s.g += 1;
      });

      // Accumulate batter stats from events
      for (const ev of simEvents) {
        if (ev.playType !== 'PLAY' && ev.type !== 'PLAY') continue;
        const rawName = ev.activeBatter || ev.batterName;
        if (!rawName) continue;
        const name = rawName.replace(/\s*\(\d{4}\)$/, '').trim();

        const s = getOrCreateBatterStat(name);
        const eventType = ev.eventType || ev.type;

        let hitDmg = 0;
        if (eventType === 'BB') { hitDmg = 15; s.bb++; }
        else if (eventType === 'SO') { s.ab++; s.so++; }
        else if (eventType === '1B') { hitDmg = 20; s.ab++; s.h++; }
        else if (eventType === '2B') { hitDmg = 35; s.ab++; s.h++; s.doubles++; }
        else if (eventType === '3B') { hitDmg = 50; s.ab++; s.h++; s.triples++; }
        else if (eventType === 'HR') { hitDmg = 75 + ((ev.runsThisTurn || ev.runsScored || 1) * 10); s.ab++; s.h++; s.hr++; }
        else {
          // Any other batting event (OUT, E / Reach on Error, FC, etc.) is an official At-Bat
          s.ab++;
        }

        if (ev.pitcherDmg !== undefined && ev.pitcherDmg !== null && !isNaN(ev.pitcherDmg) && ev.pitcherDmg > 0) {
          s.dmg += ev.pitcherDmg;
        } else if (hitDmg > 0) {
          s.dmg += hitDmg;
        }

        if (ev.didSteal || (ev.playText && ev.playText.includes('ROBO DE BASE'))) {
          s.sb += 1;
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
            this.runPitcherStats[pName] = { outs: 0, k: 0, bb: 0, h: 0, hr: 0, er: 0, dmg: 0 };
          }
          const ps = this.runPitcherStats[pName];
          ps.dmg = (typeof ps.dmg === 'number' && !isNaN(ps.dmg)) ? ps.dmg : 0;
          const eventType = ev.eventType || ev.type;

          let dealtDmg = 0;
          if (ev.teamHpDmg !== undefined && ev.teamHpDmg !== null && !isNaN(ev.teamHpDmg) && ev.teamHpDmg > 0) {
            dealtDmg = ev.teamHpDmg;
          } else if (eventType === 'SO') {
            dealtDmg = 20;
          } else if (eventType === 'OUT') {
            dealtDmg = 10;
          }
          ps.dmg += dealtDmg;

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
      if (r === 1) return { label: 'ÉPICO O SUPERIOR', labelKey: 'draft.round_1_label', rarities: ['Legendary','Epic'], icon: '💎' };
      if (r === 2) return { label: 'ÉPICO GARANTIZADO', labelKey: 'draft.round_2_label', rarities: ['Epic'], icon: '🟣' };
      if (r === 3) return { label: 'RARO GARANTIZADO', labelKey: 'draft.round_rare_label', rarities: ['Rare'], icon: '🔵' };
      if (r === 4) return { label: 'POCO COMÚN GARANTIZADO', labelKey: 'draft.round_uncommon_label', rarities: ['Uncommon'], icon: '🟢' };
      if (r >= 5 && r <= 8) return { label: 'COMÚN OBLIGATORIO', labelKey: 'draft.round_common_label', rarities: ['Common'], icon: '⚪' };
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

      // Assign weights: 4x probability for primary position, 2x for secondary position
      const toWeighted = (p) => {
        const primaryPos = p.pos || p.pos_display || p.primary_pos || '';
        const secPosRaw = p.sec_pos || p.secondary_pos || p.secondary_positions || '';
        const secPositions = Array.isArray(secPosRaw)
          ? secPosRaw
          : String(secPosRaw).split(',').map(s => s.trim()).filter(Boolean);

        let weight = 1;
        if (missingPos.includes(primaryPos)) {
          weight = 4;
        } else if (secPositions.some(sp => missingPos.includes(sp))) {
          weight = 2;
        }
        return { player: p, weight };
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
      return Math.round(Math.max(0, Math.min(100, avgDef)));
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
      return Math.round(Math.max(0, Math.min(100, avgDef)));
    }

    // ── ZONE CONFIG ──────────────────────────────────────────────────────────
    // 4 zones × 6 stages = 24 total stages (indices 0 to 23)
    // zone 0 = "Opening Day"   (stages 0–5,  boss at 5)
    // zone 1 = "All-Star Break" (stages 6–11, boss at 11)
    // zone 2 = "Pennant Chase"  (stages 12–17, boss at 17)
    // zone 3 = "Playoffs"       (stages 18–23, boss at 23)
    // Each zone has 5 branching floors + 1 Boss floor (local index 5).
    // Floor 4 (local index 3) always contains a mid-boss node option.
    // Zone 2, floor 3 (stage 14) contains the Trade Deadline node.
    getZoneForStage(stage) {
      if (stage <= 5)  return 0;  // Opening Day
      if (stage <= 11) return 1;  // All-Star Break
      if (stage <= 17) return 2;  // Pennant Chase
      return 3;                   // Playoffs
    }

    // Start stage index for each zone (used for localIdx calculations)
    getZoneStart(zoneIdx) {
      return [0, 6, 12, 18][zoneIdx] || 0;
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
          stages: [0, 1, 2, 3, 4, 5]
        },
        {
          id: 1,
          name: "All-Star Break",
          subtitleKey: "map.stage_allstar",
          subtitle: "Mitad de temporada - Dificultad: Difícil",
          theme: "zone-major",
          bossLabel: "All-Star Game",
          bossIcon: "⭐",
          stages: [6, 7, 8, 9, 10, 11]
        },
        {
          id: 2,
          name: "Pennant Chase",
          subtitleKey: "map.stage_pennant",
          subtitle: "Final de temporada - Dificultad: Experto",
          theme: "zone-pennant",
          bossLabel: "Campeón de Liga",
          bossIcon: "🏆",
          stages: [12, 13, 14, 15, 16, 17]
        },
        {
          id: 3,
          name: "Playoffs",
          subtitleKey: "map.stage_playoffs",
          subtitle: "Fase Final - Dificultad: Leyenda",
          theme: "zone-hof",
          bossLabel: "Serie Mundial",
          bossIcon: "👑",
          stages: [18, 19, 20, 21, 22, 23]
        }
      ];
      return zones[zoneIdx] || zones[0];
    }

    generateMap() {
      const numStages = 24; // 4 zones × 6 stages
      this.map = [];

      // Boss stages (local index 5 of each zone)
      const BOSS_STAGES   = new Set([5, 11, 17, 23]);
      // First stage of each zone (2 opening nodes)
      const FIRST_IN_ZONE = new Set([0, 6, 12, 18]);
      // Floor 4 of each zone (local index 3) → one slot reserved for mid_boss
      const MID_BOSS_STAGES = new Set([3, 9, 15, 21]);
      // Trade Deadline: Zone 2, floor 3 (stage 14) → one slot reserved for trade
      const TRADE_DEADLINE_STAGE = 14;

      for (let s = 0; s < numStages; s++) {
        const stageNodes = [];
        const isBossStage   = BOSS_STAGES.has(s);
        const isFirstInZone = FIRST_IN_ZONE.has(s);
        const isMidBossFloor = MID_BOSS_STAGES.has(s);
        const isTradeFloor   = (s === TRADE_DEADLINE_STAGE);

        let nodeCount = isBossStage ? 1 : (isFirstInZone ? 2 : 3);
        let isFixedMatch = isBossStage;

        for (let idx = 0; idx < nodeCount; idx++) {
          let type = 'match';
          if (!isFixedMatch) {
            if (s === 0) {
              // Opening stage: always a match
              type = 'match';
            } else if (isMidBossFloor && idx === 1) {
              // Middle node of floor 4 → reserved mid_boss opportunity
              type = 'mid_boss';
            } else if (isTradeFloor && idx === 1) {
              // Middle node of Trade Deadline stage → trade node
              type = 'trade';
            } else {
              // Determine floor type by local index within zone
              const zoneIdx   = this.getZoneForStage(s);
              const zoneStart = this.getZoneStart(zoneIdx);
              const localIdx  = s - zoneStart; // 0–5

              let roll = Math.random();
              if (localIdx === 1) {
                // Floor 2: varied openers — match, draft, luck/chest
                if (roll < 0.40)      type = 'match';
                else if (roll < 0.65) type = 'draft';
                else if (roll < 0.82) type = 'gamble';
                else                  type = 'chest';
              } else if (localIdx === 2) {
                // Floor 3: management & tactics
                if (roll < 0.35)      type = 'match';
                else if (roll < 0.55) type = 'event';
                else if (roll < 0.75) type = 'train';
                else if (roll < 0.88) type = 'draft';
                else                  type = 'chest';
              } else if (localIdx === 3) {
                // Floor 4 (mid-boss floor): outer nodes — match / chest / event
                if (roll < 0.45)      type = 'match';
                else if (roll < 0.70) type = 'event';
                else                  type = 'chest';
              } else if (localIdx === 4) {
                // Floor 5: pre-boss camp — ALWAYS guarantee a Clubhouse (rest) node in the center (idx === 1), with train/event/gamble on outer nodes
                if (idx === 1) {
                  type = 'rest';
                } else {
                  if (roll < 0.40)      type = 'train';
                  else if (roll < 0.75) type = 'event';
                  else                  type = 'gamble';
                }
              } else {
                // Fallback: classic mix
                if (roll < 0.30)      type = 'match';
                else if (roll < 0.45) type = 'draft';
                else if (roll < 0.60) type = 'event';
                else if (roll < 0.75) type = 'train';
                else if (roll < 0.90) type = 'rest';
                else if (roll < 0.95) type = 'chest';
                else                  type = 'gamble';
              }
            }
          }

          let label = type.toUpperCase();
          if (isBossStage) {
            type = 'boss';
            const _bt = k => typeof window.t==='function'?window.t(k):k;
            const bossLabels = { 5: _bt('map.boss_label.5'), 11: _bt('map.boss_label.11'), 17: _bt('map.boss_label.17'), 23: _bt('map.boss_label.23') };
            label = bossLabels[s] || 'WORLD SERIES';
          } else if (type === 'mid_boss') {
            label = 'MID-BOSS';
          } else if (type === 'trade') {
            label = 'TRADE';
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

      // Generate branching paths connections (stop at zone boss stages — no exit)
      const ZONE_BOSS_STAGES = new Set([5, 11, 17, 23]);
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
      const stamina = player.stamina !== undefined ? player.stamina : 100;
      let staminaPenalty = 0;
      if (stamina < 75) staminaPenalty = -10;
      if (stamina < 50) staminaPenalty = -20;
      if (stamina < 25) staminaPenalty = -40;

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
      const weakMap = {
        [posScores[0].pos]: 4.0, // #1 weakest position (4.0x weight)
        [posScores[1].pos]: 4.0, // #2 weakest position (4.0x weight)
        [posScores[2].pos]: 4.0  // #3 weakest position (4.0x weight)
      };
      weakMap.has = function(pos) { return this[pos] !== undefined; };
      weakMap.topPos = posScores[0].pos;
      weakMap.ranked = [posScores[0].pos, posScores[1].pos, posScores[2].pos];
      return weakMap;
    }

    getSignLegendRarityWeights() {
      const zone = (typeof this.getZoneForStage === 'function') 
        ? this.getZoneForStage(this.currentStageIndex || 0) 
        : 0;
      // Option A: Smooth, balanced progression (significantly better than normal matches, but gated by zone)
      const map = {
        0: { Uncommon: 4.5, Rare: 4.5, Epic: 1.0, Legendary: 0.0 }, // Zona 0: Opening Day (45% Unc, 45% Rare, 10% Epic, 0% Leg)
        1: { Uncommon: 1.5, Rare: 5.0, Epic: 3.0, Legendary: 0.5 }, // Zona 1: All-Star Break (15% Unc, 50% Rare, 30% Epic, 5% Leg)
        2: { Uncommon: 0.5, Rare: 2.5, Epic: 4.5, Legendary: 2.5 }, // Zona 2: Pennant Chase (5% Unc, 25% Rare, 45% Epic, 25% Leg)
        3: { Uncommon: 0.0, Rare: 1.0, Epic: 4.0, Legendary: 5.0 }, // Zona 3: Playoffs (0% Unc, 10% Rare, 40% Epic, 50% Leg)
      };
      return map[zone] || map[0];
    }

    getMatchRewardRarityWeights(isBoss = false) {
      const zone = (typeof this.getZoneForStage === 'function') 
        ? this.getZoneForStage(this.currentStageIndex || 0) 
        : 0;

      if (isBoss) {
        // Scaled boss rewards by map:
        // Map 1 (Zone 0): Rare guaranteed (90% Rare, 10% Epic)
        // Map 2 (Zone 1): Epic guaranteed (85% Epic, 15% Legendary)
        // Map 3 (Zone 2): 100% Legendary guaranteed
        // Map 4 (Zone 3): 100% Legendary guaranteed
        const bossMap = {
          0: { Rare: 9.0, Epic: 1.0 },
          1: { Epic: 8.5, Legendary: 1.5 },
          2: { Legendary: 10.0 },
          3: { Legendary: 10.0 }
        };
        return bossMap[zone] || bossMap[0];
      }

      // Regular matches (strictly NO Commons):
      const map = {
        0: { Uncommon: 7.0, Rare: 2.5, Epic: 0.5, Legendary: 0.0 }, // Zona 0: Opening Day (70% Unc, 25% Rare, 5% Epic)
        1: { Uncommon: 4.0, Rare: 4.5, Epic: 1.5, Legendary: 0.0 }, // Zona 1: All-Star Break (40% Unc, 45% Rare, 15% Epic)
        2: { Uncommon: 1.5, Rare: 5.0, Epic: 3.0, Legendary: 0.5 }, // Zona 2: Pennant Chase (15% Unc, 50% Rare, 30% Epic, 5% Leg)
        3: { Uncommon: 0.5, Rare: 3.5, Epic: 4.5, Legendary: 1.5 }, // Zona 3: Playoffs (5% Unc, 35% Rare, 45% Epic, 15% Leg)
      };
      return map[zone] || map[0];
    }

    // ── MID-GAME EVENT: FIRMA LEYENDA — picks Uncommon or higher ──────────
    getDraftPicks() {
      const pool = window.PlayersDB.LAHMAN_POOL || window.PlayersDB.PLAYERS_POOL || [];
      const onRosterNames = new Set(Object.values(this.roster).filter(Boolean).map(x => x.name));

      // Sign Legend event: Uncommon or higher (strictly no Commons, gated by zone)
      const zone = (typeof this.getZoneForStage === 'function') 
        ? this.getZoneForStage(this.currentStageIndex || 0) 
        : 0;
      let allowedRarities = ['Legendary', 'Epic', 'Rare', 'Uncommon'];
      if (zone === 0) {
        allowedRarities = ['Epic', 'Rare', 'Uncommon'];
      } else if (zone === 3) {
        allowedRarities = ['Legendary', 'Epic', 'Rare'];
      }
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

      const zone = (typeof this.getZoneForStage === 'function') 
        ? this.getZoneForStage(this.currentStageIndex || 0) 
        : 0;

      // Filter allowed rarities by match type and stage
      let allowedRarities = ['Legendary', 'Epic', 'Rare', 'Uncommon'];
      if (isBoss) {
        if (zone === 0) allowedRarities = ['Epic', 'Rare'];
        else if (zone === 1) allowedRarities = ['Legendary', 'Epic'];
        else allowedRarities = ['Legendary'];
      } else {
        // Regular matches: Map 1 (zone 0) and Map 2 (zone 1) strictly forbid Legendary
        if (zone === 0 || zone === 1) {
          allowedRarities = ['Epic', 'Rare', 'Uncommon'];
        }
      }

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
      // Helper function to unlock in dex
      const unlockEnemyPitchers = (enemy) => {
        if (enemy && enemy.pitchers && window.BaseballDex) {
          enemy.pitchers.forEach(p => window.BaseballDex.unlockOpponent(p));
        }
        return enemy;
      };

      if (this.currentEnemy) return unlockEnemyPitchers(this.currentEnemy);

      const stage = this.currentStageIndex !== undefined ? this.currentStageIndex : 0;

      // Helper for OVR calculation
      const getOvr = (p) => (p.ovr !== undefined ? p.ovr : (p._ovr !== undefined ? p._ovr : (window.UI && window.UI.getPlayerOvr ? window.UI.getPlayerOvr(p) : 50)));

      const createPitcherObj = (p, roleOverride = null) => {
        const role = roleOverride || p.role || 'SP';
        const staVal = p.sta !== undefined ? p.sta : (p.sta_val !== undefined ? p.sta_val : 50);
        const hp = Math.max(75, Math.min(200, Math.round(75 + (staVal - 20) * (125 / 105))));
        const yearVal = p.year || p.peak_year_display || p.peak_year || this.selectedSeasonYear || 1990;
        const nameVal = yearVal ? `${p.name} (${yearVal})` : p.name;
        return {
          name: nameVal,
          cleanName: p.name,
          role: role,
          pos: role,
          hp: hp,
          maxHp: hp,
          stf: p.k9 !== undefined ? p.k9 : (p.stf !== undefined ? p.stf : 50),
          ctl: p.bb9 !== undefined ? p.bb9 : (p.ctl !== undefined ? p.ctl : 50),
          mov: p.hr9 !== undefined ? p.hr9 : (p.mov !== undefined ? p.mov : 50),
          sta: staVal,
          ovr: getOvr(p),
          rarity: p.rarity || 'Common',
          era: p.era || '',
          team: p.team || '',
          year: yearVal,
          h9:  p.h9  !== undefined ? p.h9  : 50,
          k9:  p.k9  !== undefined ? p.k9  : 50,
          bb9: p.bb9 !== undefined ? p.bb9 : 50,
          hr9: p.hr9 !== undefined ? p.hr9 : 50
        };
      };

      // ── MODE 1: STORY MODE (Dynamic Staff Scaling per Map) ───────────────
      if (this.selectedMode === 'story') {
        const seasonData = this.seasonPoolData || (window.OpponentsDatabase && this.selectedSeasonYear ? window.OpponentsDatabase[this.selectedSeasonYear] : null);

        if (seasonData) {
          const allTeams = seasonData.teams || [];
          const allPitchers = [];
          allTeams.forEach(t => (t.pitchers || []).forEach(p => allPitchers.push({ ...p, teamName: t.name, teamID: t.teamID })));

          if (!this.encounteredTeams) this.encounteredTeams = new Set();
          if (!this.encounteredPitchers) this.encounteredPitchers = new Set();

          const pickPitcherFromList = (candidates, preferredRole = null) => {
            const pitcherKey = (p) => (p.name || '') + '_' + (p.year || this.selectedSeasonYear);
            let unvisited = candidates.filter(p => !this.encounteredPitchers.has(pitcherKey(p)));
            if (unvisited.length === 0) unvisited = candidates;
            if (preferredRole) {
              const roleMatches = unvisited.filter(p => (p.role || '').toUpperCase() === preferredRole.toUpperCase());
              if (roleMatches.length > 0) unvisited = roleMatches;
            }
            if (unvisited.length === 0) unvisited = candidates;
            const chosen = unvisited[Math.floor(Math.random() * unvisited.length)];
            this.encounteredPitchers.add(pitcherKey(chosen));
            return chosen;
          };

          // Finds the best 3-pitcher combination from a team that fits the target average range
          const findTeamTrioByAvg = (teamObj, targetMinAvg, targetMaxAvg) => {
            const staff = teamObj.pitchers || [];
            if (staff.length < 3) return staff.map(p => createPitcherObj(p));

            let bestTrio = null;
            let bestDiff = 999;
            const targetMid = (targetMinAvg + targetMaxAvg) / 2.0;

            // Iterate possible combinations
            for (let i = 0; i < staff.length - 2; i++) {
              for (let j = i + 1; j < staff.length - 1; j++) {
                for (let k = j + 1; k < staff.length; k++) {
                  const p1 = staff[i], p2 = staff[j], p3 = staff[k];
                  const avg = (p1.ovr + p2.ovr + p3.ovr) / 3.0;
                  if (avg >= targetMinAvg && avg <= targetMaxAvg) {
                    const diff = Math.abs(avg - targetMid);
                    if (diff < bestDiff) {
                      bestDiff = diff;
                      bestTrio = [p1, p2, p3];
                    }
                  }
                }
              }
            }

            // If no trio hits the exact range, pick the 3 pitchers closest to the target range
            if (!bestTrio) {
              if (targetMinAvg <= 60) {
                // Bottom 3
                bestTrio = staff.slice(-3);
              } else if (targetMinAvg >= 80) {
                // Top 3
                bestTrio = staff.slice(0, 3);
              } else {
                // Closest to mid
                const sortedByDist = [...staff].sort((a, b) => Math.abs(a.ovr - targetMid) - Math.abs(b.ovr - targetMid));
                bestTrio = sortedByDist.slice(0, 3);
              }
            }

            // Order rotation: Starter (SP) first, middle, Closer (RP) last
            const p1 = createPitcherObj(pickPitcherFromList(bestTrio, 'SP'), 'SP');
            const rem = bestTrio.filter(p => (p.name || p.playerID) !== (p1.cleanName || p1.name));
            const p3 = createPitcherObj(pickPitcherFromList(rem, 'RP'), 'RP');
            const rem2 = rem.filter(p => (p.name || p.playerID) !== (p3.cleanName || p3.name));
            const p2 = createPitcherObj(rem2[0] || rem[0] || staff[0]);

            return [p1, p2, p3];
          };

          // ── CASE A: Super Boss (Stage 23 Part 2 - Top 5 Titans of the Season) ─
          if (stage === 23 && this.isSuperBossActive) {
            const legTop5 = [...allPitchers].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
            const selected = legTop5.map(p => createPitcherObj(p));
            const highest = selected[0] || selected.reduce((max, p) => (p.ovr > max.ovr ? p : max), selected[0]);

            this.currentEnemy = {
              id: `story_super_boss_${this.selectedSeasonYear}_${Date.now()}`,
              name: `⚡ SUPER BOSS: ${highest.cleanName}`,
              tier: 'S',
              isBoss: true,
              isSuperBoss: true,
              year: this.selectedSeasonYear,
              win_pct: 1.0,
              ovr: highest.ovr,
              pitchers: selected,
              rarity: 'Legendary'
            };
            return unlockEnemyPitchers(this.currentEnemy);
          }

          // ── CASE B: Final Boss Serie Mundial (Stage 23 Part 1 - Top 5 of Champ) ──
          if (stage === 23) {
            const mlbTeams = allTeams.filter(t => (t.league && ['AL', 'NL', 'FL'].includes(t.league)) || (t.pitchers && t.pitchers.length >= 5));
            const champTeam = (mlbTeams.length > 0 ? mlbTeams : allTeams).sort((a, b) => (b.win_pct || 0) - (a.win_pct || 0))[0] || allTeams[0];
            const pStaff = champTeam.pitchers || [];
            const top5 = pStaff.slice(0, 5);
            const rotation = top5.map((p, idx) => createPitcherObj(p, idx === 0 ? 'SP' : (idx === 4 ? 'RP' : p.role)));
            const ace = rotation[0];

            this.currentEnemy = {
              id: `story_final_boss_${this.selectedSeasonYear}_${Date.now()}`,
              name: `👑 FINAL BOSS: ${champTeam.name}`,
              tier: 'S',
              isBoss: true,
              year: this.selectedSeasonYear,
              win_pct: champTeam.win_pct,
              w: champTeam.w || 0,
              l: champTeam.l || 0,
              g: champTeam.g || 0,
              division: champTeam.division,
              league: champTeam.league,
              ovr: ace.ovr,
              pitchers: rotation,
              rarity: ace.rarity || 'Legendary'
            };
            return unlockEnemyPitchers(this.currentEnemy);
          }

          // ── CASE C: Zone Bosses (Stages 5, 11, 17 - Solid Team with Legitimate Ace) ─
          if (stage === 5 || stage === 11 || stage === 17) {
            let targetAceMinOvr = 74, targetAceMaxOvr = 82, aceRarity = 'Rare';
            let targetMinAvg = 65, targetMaxAvg = 72;

            if (stage === 5) {
              targetAceMinOvr = 74; targetAceMaxOvr = 82; aceRarity = 'Rare'; targetMinAvg = 64; targetMaxAvg = 71;
            } else if (stage === 11) {
              targetAceMinOvr = 83; targetAceMaxOvr = 89.9; aceRarity = 'Epic'; targetMinAvg = 74; targetMaxAvg = 81;
            } else if (stage === 17) {
              targetAceMinOvr = 90; targetAceMaxOvr = 99.9; aceRarity = 'Legendary'; targetMinAvg = 82; targetMaxAvg = 92;
            }

            // Filter teams that have an Ace in that range and at least 3 pitchers
            let qualifyingTeams = allTeams.filter(t => {
              const staff = t.pitchers || [];
              if (staff.length < 3) return false;
              const topOvr = staff[0].ovr;
              return topOvr >= targetAceMinOvr && topOvr <= targetAceMaxOvr;
            });

            if (qualifyingTeams.length === 0) {
              qualifyingTeams = allTeams.filter(t => {
                const staff = t.pitchers || [];
                return staff.length >= 3 && staff[0].ovr >= targetAceMinOvr;
              });
            }
            if (qualifyingTeams.length === 0) qualifyingTeams = allTeams;

            let candidateTeams = qualifyingTeams.filter(t => !this.encounteredTeams.has(t.id || t.name));
            if (candidateTeams.length === 0) candidateTeams = qualifyingTeams;
            const chosenTeam = candidateTeams[Math.floor(Math.random() * candidateTeams.length)] || allTeams[0];
            this.encounteredTeams.add(chosenTeam.id || chosenTeam.name);

            const staff = chosenTeam.pitchers || [];
            const ace = createPitcherObj(staff[0], 'SP');
            const sup1 = createPitcherObj(staff[1] || staff[0], 'SP');
            const sup2 = createPitcherObj(staff[2] || staff[0], 'RP');
            const rotation = [ace, sup1, sup2];

            this.currentEnemy = {
              id: `story_boss_stage_${stage}_${Date.now()}`,
              name: `👑 BOSS: ${ace.cleanName} (${chosenTeam.name})`,
              tier: 'S',
              isBoss: true,
              year: this.selectedSeasonYear,
              win_pct: chosenTeam.win_pct,
              w: chosenTeam.w || 0,
              l: chosenTeam.l || 0,
              g: chosenTeam.g || 0,
              division: chosenTeam.division,
              league: chosenTeam.league,
              ovr: ace.ovr,
              pitchers: rotation,
              rarity: aceRarity
            };
            return unlockEnemyPitchers(this.currentEnemy);
          }

          // ── CASE D: Mid-Boss (Floor 4 / Stages 3, 9, 15, 21 - Solid Devastating Trio) ──
          const currentNode = this.getCurrentNode ? this.getCurrentNode() : null;
          if (currentNode && currentNode.type === 'mid_boss') {
            let targetRarity = 'Uncommon', minAvg = 62, maxAvg = 68;

            if (stage <= 5) {
              targetRarity = 'Uncommon'; minAvg = 62; maxAvg = 68;
            } else if (stage <= 11) {
              targetRarity = 'Rare'; minAvg = 72; maxAvg = 78;
            } else if (stage <= 17) {
              targetRarity = 'Epic'; minAvg = 80; maxAvg = 88;
            } else {
              targetRarity = 'Legendary'; minAvg = 86; maxAvg = 95;
            }

            // Find teams whose top 3 pitchers hit this average
            let qualifyingTeams = allTeams.filter(t => {
              const p = t.pitchers || [];
              if (p.length < 3) return false;
              const avg = (p[0].ovr + p[1].ovr + p[2].ovr) / 3.0;
              return avg >= (minAvg - 3) && avg <= (maxAvg + 3);
            });

            if (qualifyingTeams.length === 0) qualifyingTeams = allTeams;
            let candidateTeams = qualifyingTeams.filter(t => !this.encounteredTeams.has(t.id || t.name));
            if (candidateTeams.length === 0) candidateTeams = qualifyingTeams;
            const chosenTeam = candidateTeams[Math.floor(Math.random() * candidateTeams.length)] || allTeams[0];
            this.encounteredTeams.add(chosenTeam.id || chosenTeam.name);

            const rotation = findTeamTrioByAvg(chosenTeam, minAvg, maxAvg);
            const highest = rotation.reduce((max, p) => (p.ovr > max.ovr ? p : max), rotation[0]);

            this.currentEnemy = {
              id: `story_midboss_stage_${stage}_${Date.now()}`,
              name: `⚡ MID-BOSS: ${highest.cleanName} (${chosenTeam.name})`,
              tier: 'A+',
              isMidBoss: true,
              year: this.selectedSeasonYear,
              win_pct: chosenTeam.win_pct,
              w: chosenTeam.w || 0,
              l: chosenTeam.l || 0,
              g: chosenTeam.g || 0,
              division: chosenTeam.division,
              league: chosenTeam.league,
              ovr: highest.ovr,
              pitchers: rotation,
              rarity: targetRarity
            };
            return unlockEnemyPitchers(this.currentEnemy);
          }

          // ── CASE E: Regular Stages (Stages 0–5, 6–11, 12–17, 18–22 by Trio Average) ──
          let targetMinAvg = 50.0, targetMaxAvg = 59.99;
          if (stage <= 5) {
            targetMinAvg = 50.0; targetMaxAvg = 59.99;
          } else if (stage <= 11) {
            targetMinAvg = 60.0; targetMaxAvg = 69.99;
          } else if (stage <= 17) {
            targetMinAvg = 70.0; targetMaxAvg = 79.99;
          } else {
            targetMinAvg = 80.0; targetMaxAvg = 89.99;
          }

          let candidateTeams = allTeams.filter(t => !this.encounteredTeams.has(t.id || t.name));
          if (candidateTeams.length === 0) candidateTeams = allTeams;
          const chosenTeam = candidateTeams[Math.floor(Math.random() * candidateTeams.length)] || allTeams[0];
          this.encounteredTeams.add(chosenTeam.id || chosenTeam.name);

          const rotation = findTeamTrioByAvg(chosenTeam, targetMinAvg, targetMaxAvg);
          const p1 = rotation[0];

          this.currentEnemy = {
            id: `story_opp_stage_${stage}_${Date.now()}`,
            name: `${chosenTeam.name}`,
            tier: 'B',
            isBoss: false,
            year: this.selectedSeasonYear,
            win_pct: chosenTeam.win_pct,
            w: chosenTeam.w || 0,
            l: chosenTeam.l || 0,
            g: chosenTeam.g || 0,
            division: chosenTeam.division,
            league: chosenTeam.league,
            ovr: p1.ovr,
            pitchers: rotation,
            rarity: p1.rarity
          };
          return unlockEnemyPitchers(this.currentEnemy);
        }
      }

      // ── MODE 2: QUICK PLAY MODE (Fully Procedural Pitcher Generation) ──

      // Quick Play stage 0 to 23
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



      // Helper to construct a balanced 3-pitcher rotation: SP opens, flexible middle, RP closes
      const assembleThreePitcherRotation = (primaryCandidates, supportCandidates, targetRole = 'SP') => {
        let acePick = pickPitcher(primaryCandidates, targetRole);
        let pAce = createPitcherObj(acePick, targetRole);

        // Pick an opener SP and closer RP
        let pOpen = null, pMid = null, pClose = null;

        if (targetRole === 'RP') {
          // Ace is closer (RP/CL)
          pClose = pAce;
          let spPool = supportCandidates.filter(p => (p.role || '').toUpperCase() === 'SP');
          if (spPool.length === 0) spPool = supportCandidates;
          pOpen = createPitcherObj(pickPitcher(spPool, 'SP'), 'SP');
          pMid = createPitcherObj(pickPitcher(supportCandidates));
        } else {
          // Ace is starter (SP)
          pOpen = pAce;
          pMid = createPitcherObj(pickPitcher(supportCandidates));
          let rpPool = supportCandidates.filter(p => (p.role || '').toUpperCase() === 'RP');
          if (rpPool.length === 0) rpPool = supportCandidates;
          pClose = createPitcherObj(pickPitcher(rpPool, 'RP'), 'RP');
        }

        // Return rotation in order: SP Opener -> Middle -> RP Closer
        const rotation = [pOpen, pMid, pClose];

        // Find the absolute highest OVR pitcher in the rotation to be the Boss representative
        let highestPitcher = rotation[0];
        rotation.forEach(p => {
          if (getOvr(p) > getOvr(highestPitcher)) highestPitcher = p;
        });

        return { rotation, highestPitcher };
      };

      // Check if Super Boss Fight is active (Stage 23 Part 2: 4 Legendary Pitchers 95+ OVR!)
      if (this.isSuperBossActive) {
        let leg95Pool = fullPool.filter(p => p.rarity === 'Legendary' && getOvr(p) >= 95);
        if (leg95Pool.length < 4) leg95Pool = fullPool.filter(p => p.rarity === 'Legendary');
        const p1 = createPitcherObj(pickPitcher(leg95Pool, 'SP'), 'SP');
        const p2 = createPitcherObj(pickPitcher(leg95Pool, 'SP'), 'SP');
        const p3 = createPitcherObj(pickPitcher(leg95Pool, 'RP'), 'RP');
        const p4 = createPitcherObj(pickPitcher(leg95Pool, 'RP'), 'RP');
        const selected = [p1, p2, p3, p4];
        let highest = p1;
        selected.forEach(p => { if (getOvr(p) > getOvr(highest)) highest = p; });

        this.currentEnemy = {
          id: `super_boss_${stage}_${Date.now()}`,
          name: `⚡ SUPER BOSS: ${highest.cleanName}`,
          tier: 'S',
          isBoss: true,
          isSuperBoss: true,
          pitchers: selected,
          _ovr: highest.ovr,
          era: highest.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Map 1 Boss (Stage 5): Ace 75-79 OVR (Rare Alta), 2 Support 60-69 OVR (Uncommon)
      if (stage === 5) {
        let acePool = fullPool.filter(p => p.rarity === 'Rare' && getOvr(p) >= 75 && getOvr(p) <= 79.9);
        if (acePool.length === 0) acePool = fullPool.filter(p => p.rarity === 'Rare');
        let uncommPool = fullPool.filter(p => p.rarity === 'Uncommon' && getOvr(p) >= 60 && getOvr(p) <= 69.9);
        if (uncommPool.length === 0) uncommPool = fullPool.filter(p => p.rarity === 'Uncommon');

        const isRpAce = Math.random() < 0.35 && acePool.some(p => (p.role || '').toUpperCase() === 'RP');
        const { rotation, highestPitcher } = assembleThreePitcherRotation(acePool, uncommPool, isRpAce ? 'RP' : 'SP');
        
        this.currentEnemy = {
          id: `boss_map1_${Date.now()}`,
          name: `👑 BOSS: ${highestPitcher.cleanName}`,
          tier: 'A',
          isBoss: true,
          pitchers: rotation,
          _ovr: highestPitcher.ovr,
          era: highestPitcher.era,
          rarity: 'Rare'
        };
        return this.currentEnemy;
      }

      // Map 2 Boss (Stage 11): Ace 85-89 OVR (Epic Alta), 2 Support 70-79 OVR (Rare)
      if (stage === 11) {
        let acePool = fullPool.filter(p => p.rarity === 'Epic' && getOvr(p) >= 85 && getOvr(p) <= 89.9);
        if (acePool.length === 0) acePool = fullPool.filter(p => p.rarity === 'Epic');
        let rarePool = fullPool.filter(p => p.rarity === 'Rare' && getOvr(p) >= 70 && getOvr(p) <= 79.9);
        if (rarePool.length === 0) rarePool = fullPool.filter(p => p.rarity === 'Rare');

        const isRpAce = Math.random() < 0.35 && acePool.some(p => (p.role || '').toUpperCase() === 'RP');
        const { rotation, highestPitcher } = assembleThreePitcherRotation(acePool, rarePool, isRpAce ? 'RP' : 'SP');

        this.currentEnemy = {
          id: `boss_map2_${Date.now()}`,
          name: `👑 BOSS: ${highestPitcher.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: rotation,
          _ovr: highestPitcher.ovr,
          era: highestPitcher.era,
          rarity: 'Epic'
        };
        return this.currentEnemy;
      }

      // Map 3 Boss (Stage 17): Ace 95-99 OVR (Legendary Alta), 2 Support 80-89 OVR (Epic)
      if (stage === 17) {
        let acePool = fullPool.filter(p => p.rarity === 'Legendary' && getOvr(p) >= 95 && getOvr(p) <= 99.9);
        if (acePool.length === 0) acePool = fullPool.filter(p => p.rarity === 'Legendary');
        let epicPool = fullPool.filter(p => p.rarity === 'Epic' && getOvr(p) >= 80 && getOvr(p) <= 89.9);
        if (epicPool.length === 0) epicPool = fullPool.filter(p => p.rarity === 'Epic');

        const isRpAce = Math.random() < 0.35 && acePool.some(p => (p.role || '').toUpperCase() === 'RP');
        const { rotation, highestPitcher } = assembleThreePitcherRotation(acePool, epicPool, isRpAce ? 'RP' : 'SP');

        this.currentEnemy = {
          id: `boss_map3_${Date.now()}`,
          name: `👑 BOSS: ${highestPitcher.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: rotation,
          _ovr: highestPitcher.ovr,
          era: highestPitcher.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Map 4 Boss Fight #1 (Stage 23): Ace 95+ OVR (Legendary Élite), 2 Support 90-94 OVR (Legendary)
      if (stage === 23) {
        let acePool = fullPool.filter(p => p.rarity === 'Legendary' && getOvr(p) >= 95.0);
        if (acePool.length === 0) acePool = fullPool.filter(p => p.rarity === 'Legendary');
        let supportPool = fullPool.filter(p => p.rarity === 'Legendary' && getOvr(p) >= 90.0 && getOvr(p) < 95.0);
        if (supportPool.length < 2) supportPool = fullPool.filter(p => p.rarity === 'Legendary');

        const { rotation, highestPitcher } = assembleThreePitcherRotation(acePool, supportPool, 'SP');

        this.currentEnemy = {
          id: `boss_map4_part1_${Date.now()}`,
          name: `👑 BOSS FINAL: ${highestPitcher.cleanName}`,
          tier: 'S',
          isBoss: true,
          pitchers: rotation,
          _ovr: highestPitcher.ovr,
          era: highestPitcher.era,
          rarity: 'Legendary'
        };
        return this.currentEnemy;
      }

      // Mid-Boss nodes (floor 4 of each zone): 3-pitcher squad (SP, middle, RP) of target rarity
      const currentNode = this.getCurrentNode ? this.getCurrentNode() : null;
      if (currentNode && currentNode.type === 'mid_boss') {
        let midPool, targetRarity;
        if (stage <= 5)        { targetRarity = 'Uncommon';  midPool = fullPool.filter(p => p.rarity === 'Uncommon'); }
        else if (stage <= 11)  { targetRarity = 'Rare';      midPool = fullPool.filter(p => p.rarity === 'Rare'); }
        else if (stage <= 17)  { targetRarity = 'Epic';      midPool = fullPool.filter(p => p.rarity === 'Epic'); }
        else                   { targetRarity = 'Legendary'; midPool = fullPool.filter(p => p.rarity === 'Legendary'); }
        if (midPool.length === 0) midPool = fullPool;

        const { rotation, highestPitcher } = assembleThreePitcherRotation(midPool, midPool, 'SP');
        this.currentEnemy = {
          id: `mid_boss_stage_${stage}_${Date.now()}`,
          name: `⚡ MID-BOSS: ${highestPitcher.cleanName}`,
          tier: 'A+',
          isMidBoss: true,
          pitchers: rotation,
          _ovr: highestPitcher.ovr,
          era: highestPitcher.era,
          rarity: targetRarity
        };
        return this.currentEnemy;
      }

      // Regular stages: strictly 10-point OVR windows across the 4 zones
      let minOvr = 50.0, maxOvr = 59.99; // Zone 0: Opening Day (stages 0–5) - Common
      if (stage >= 6  && stage <= 11) { minOvr = 60.0; maxOvr = 69.99; } // Zone 1: All-Star Break (stages 6–11) - Uncommon
      else if (stage >= 12 && stage <= 17) { minOvr = 70.0; maxOvr = 79.99; } // Zone 2: Pennant Chase (stages 12–17) - Rare
      else if (stage >= 18) { minOvr = 80.0; maxOvr = 89.99; } // Zone 3: Playoffs (stages 18–23) - Epic

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
        const staVal = p.sta !== undefined ? p.sta : (p.sta_val !== undefined ? p.sta_val : 50);
        const unifiedHp = calcPitcherHP(staVal);
        return {
          ...p,
          sta: staVal,
          hp: unifiedHp,
          maxHp: unifiedHp,
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
      // Speed & Hustle T4: line-up recovers +10 stamina upon victory (loss reduced to 10)
      const expansionCount = Object.values(this.roster).filter(p => p && p.era === 'Expansion (1961-1976)').length;
      const hasSpeedHustleT4 = (simResult && simResult.winner === 'away') && (this.getEraTier && this.getEraTier('Expansion (1961-1976)', expansionCount) >= 4);
      const staminaLoss = (this.hasTrait('endless_stamina') || hasSpeedHustleT4) ? 10 : 20;
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

      const isBossStage = (this.currentStageIndex === 5 || this.currentStageIndex === 11 || this.currentStageIndex === 17 || this.currentStageIndex === 23);

      if (won) {
        // Stage 23 (Map 4 Boss Fight #1) victory → Trigger SUPER BOSS FIGHT Part 2!
        if (this.currentStageIndex === 23 && !this.isSuperBossActive) {
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
        const isTraitBossMap = (this.currentStageIndex === 5 || this.currentStageIndex === 11 || this.currentStageIndex === 17);
        const isMidBossStage = (this.currentNodeIndex !== undefined && this.getCurrentNode && this.getCurrentNode() && this.getCurrentNode().type === 'mid_boss');
        const midBossBonus   = isMidBossStage ? 15 : 0;
        const earnings = isBossStage ? 20 : 5;
        // Trait: Negociador de Élite — +$10 extra per win
        const eliteBonus = this.hasTrait('elite_negotiator') ? 10 : 0;
        this.budget += earnings + eliteBonus + midBossBonus;
        this.currentEnemy = null;

        // Mid-Boss drop: grant a random equipment item into the team's backpack
        let rewardedItem = null;
        if (isMidBossStage && window.ItemsDatabase && window.ItemsDatabase.length > 0) {
          const randEvent = window.ItemsDatabase[Math.floor(Math.random() * window.ItemsDatabase.length)];
          if (randEvent && randEvent.safeOption) {
            rewardedItem = { ...randEvent.safeOption };
            if (!this.itemsInventory) this.itemsInventory = [];
            this.itemsInventory.push(rewardedItem);
          }
        }

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
          isMidBossStage,
          rewardedItem,
          earnings: earnings + eliteBonus + midBossBonus,
          retiredAlerts,
          message: isBossStage
            ? (typeof window.t==='function'?window.t('game.boss_win_msg', { name: currentEnemy.name, earnings: earnings + eliteBonus }):`¡Victoria! Derrotaste al JEFE ${currentEnemy.name}. ¡+$${earnings + eliteBonus}!`)
            : isMidBossStage
              ? (typeof window.t==='function'?window.t('game.mid_boss_win_msg', { name: currentEnemy.name, earnings: earnings + eliteBonus + midBossBonus }):`¡Victoria Élite! Derrotaste al MID-BOSS ${currentEnemy.name}. ¡+$${earnings + eliteBonus + midBossBonus} y Equipamiento!`)
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

    // ── TRADE DEADLINE ────────────────────────────────────────────────────────
    // Generates a blockbuster trade offer: picks a filled roster slot and finds a
    // high-value candidate of compatible position with competitive/higher OVR & rarity.
    getTradeOffer() {
      const pool = (window.PlayersDB && window.PlayersDB.LAHMAN_POOL) 
        ? window.PlayersDB.LAHMAN_POOL 
        : (window.PlayersDB && window.PlayersDB.PLAYERS_POOL ? window.PlayersDB.PLAYERS_POOL : []);
      if (!pool.length) return null;

      const filledSlots = Object.entries(this.roster)
        .filter(([, p]) => p !== null && p !== undefined)
        .map(([slot]) => slot);
      if (!filledSlots.length) return null;

      // Pick a filled roster slot
      const offerSlot = filledSlots[Math.floor(Math.random() * filledSlots.length)];
      const currentPlayer = this.roster[offerSlot];
      if (!currentPlayer) return null;

      const curOvr = (currentPlayer.ovr !== undefined ? currentPlayer.ovr : 75);
      const pos = currentPlayer.pos || offerSlot;
      const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
      const curRarityIdx = rarityOrder.indexOf(currentPlayer.rarity || 'Common');

      // Candidate pool:
      // 1. Same position (primary or secondary)
      // 2. Not the exact same player name
      // 3. Competitive / Blockbuster quality: OVR between (curOvr - 2) and (curOvr + 8), rarity >= curRarity
      let candidates = pool.filter(p => {
        if (p.name === currentPlayer.name) return false;
        const isSamePos = (p.pos === pos || (p.sec_pos && p.sec_pos.split(',').map(s => s.trim()).includes(pos)));
        if (!isSamePos) return false;
        
        const pOvr = p.ovr !== undefined ? p.ovr : 75;
        const pRarityIdx = rarityOrder.indexOf(p.rarity || 'Common');
        
        const isCompetitiveOvr = pOvr >= Math.max(72, curOvr - 2) && pOvr <= Math.min(99.9, curOvr + 8);
        const isGoodRarity = pRarityIdx >= curRarityIdx;
        
        return isCompetitiveOvr && isGoodRarity;
      });

      // Fallback 1: same position with OVR >= curOvr - 3
      if (!candidates.length) {
        candidates = pool.filter(p => {
          if (p.name === currentPlayer.name) return false;
          const isSamePos = (p.pos === pos || (p.sec_pos && p.sec_pos.split(',').map(s => s.trim()).includes(pos)));
          const pOvr = p.ovr !== undefined ? p.ovr : 75;
          return isSamePos && pOvr >= (curOvr - 3);
        });
      }

      // Fallback 2: any same position
      if (!candidates.length) {
        candidates = pool.filter(p => p.name !== currentPlayer.name && (p.pos === pos || (p.sec_pos && p.sec_pos.includes(pos))));
      }
      if (!candidates.length) return null;

      // Sort by OVR descending and pick from top tier
      candidates.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      const topSlice = candidates.slice(0, Math.max(1, Math.ceil(candidates.length * 0.35)));
      const offeredPlayer = topSlice[Math.floor(Math.random() * topSlice.length)];

      return {
        slot: offerSlot,
        currentPlayer,
        offeredPlayer: { ...offeredPlayer }
      };
    }

    acceptTrade(slot, offeredPlayer) {
      if (!slot || !offeredPlayer) return false;
      this.roster[slot] = {
        ...offeredPlayer,
        stamina: 100,
        upgrades: { con: 0, pwr: 0, eye: 0, k_avd: 0, spd: 0, def: 0 }
      };
      if (window.BaseballDex && typeof window.BaseballDex.unlockPlayer === 'function') {
        window.BaseballDex.unlockPlayer(this.roster[slot]);
      }
      return true;
    }
  }

  window.Game = new GameState();
})();
