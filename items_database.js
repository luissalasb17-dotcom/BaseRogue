/**
 * BaseRogue Items & Equipment Database
 * ────────────────────────────────────
 * 20 official items across 5 categories:
 * - 4 Bats (CON, PWR, K-AVD/EYE, CON/PWR)
 * - 4 Footwear (SPD, SPD/CON, SPD/DEF, Energy Resistance)
 * - 4 Gloves (DEF, DEF/PWR, DEF/CON, Energy Resistance)
 * - 4 Accessories (EYE, EYE/CON, K-AVD, All-Stats)
 * - 4 Energy & Recovery Consumables (Instant & Permanent Boosts)
 */

(function () {
  'use strict';

  function _t(key, fallback) {
    if (typeof window.t === 'function') {
      const res = window.t(key);
      if (res && res !== key) return res;
    }
    return fallback;
  }

  const ItemsDatabase = [
    // ═════════════════════════════════════════════════════════════════════════
    // CATEGORÍA 1: MADEROS Y BATES (Ofensiva Pura)
    // ═════════════════════════════════════════════════════════════════════════
    {
      id: "item_bat_samurai",
      icon: "⛩️",
      category: "bat",
      get title() { return _t('items.bat_samurai.title', 'Madero Samurái de Precisión'); },
      get desc() { return _t('items.bat_samurai.desc', 'Un maestro artesano japonés ofrece un madero de arce pulido al milímetro para máximo contacto.'); },
      safeOption: {
        id: "bat_samurai_std",
        icon: "🏏",
        get name() { return _t('items.bat_samurai.safe_name', 'Madero de Arce Tradicional'); },
        get text() { return _t('items.bat_samurai.safe_text', 'Comprar Madero Estándar (+20 CON)'); },
        cost: 16,
        stats: { con: 20 },
        get statDesc() { return "+20 CON"; }
      },
      riskyOption: {
        id: "bat_samurai_legend",
        icon: "⚔️",
        get name() { return _t('items.bat_samurai.risky_name', 'Madero Samurái Maestro'); },
        get text() { return _t('items.bat_samurai.risky_text', 'Probar Madero Prototipo (+35 CON)'); },
        cost: 6,
        successChance: 0.60,
        stats: { con: 35 },
        get statDesc() { return "+35 CON"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.bat_samurai.suc_msg', '¡Prueba magistral! El bateador domina el Madero Samurái Maestro (+35 CON).'); },
        get failMsg() { return _t('items.bat_samurai.fail_msg', '¡El madero se astilla en la prueba! El bateador sufre fatiga (-35 Stamina).'); }
      }
    },
    {
      id: "item_bat_power",
      icon: "💥",
      category: "bat",
      get title() { return _t('items.bat_power.title', 'El Garrote de Poder Puro'); },
      get desc() { return _t('items.bat_power.desc', 'Un bate pesado de abedul de la vieja escuela diseñado para elevar la pelota a distancias monumentales.'); },
      safeOption: {
        id: "bat_power_std",
        icon: "🏏",
        get name() { return _t('items.bat_power.safe_name', 'Bate de Poder Pesado'); },
        get text() { return _t('items.bat_power.safe_text', 'Comprar Garrote Estándar (+20 PWR)'); },
        cost: 16,
        stats: { pwr: 20 },
        get statDesc() { return "+20 PWR"; }
      },
      riskyOption: {
        id: "bat_power_legend",
        icon: "💥",
        get name() { return _t('items.bat_power.risky_name', 'Garrote Titánico de Leyenda'); },
        get text() { return _t('items.bat_power.risky_text', 'Probar Garrote Masivo (+35 PWR)'); },
        cost: 6,
        successChance: 0.60,
        stats: { pwr: 35 },
        get statDesc() { return "+35 PWR"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.bat_power.suc_msg', '¡Poder descomunal! El bateador conquista el Garrote Titánico (+35 PWR).'); },
        get failMsg() { return _t('items.bat_power.fail_msg', '¡El peso excesivo provoca un tirón muscular! El bateador pierde -35 Stamina.'); }
      }
    },
    {
      id: "item_bat_discipline",
      icon: "👓",
      category: "bat",
      get title() { return _t('items.bat_discipline.title', 'Bate de Disciplina y Ojo'); },
      get desc() { return _t('items.bat_discipline.desc', 'Madero con marcas de zona y agarre antideslizante para evitar ponches y seleccionar lanzamientos.'); },
      safeOption: {
        id: "bat_discipline_std",
        icon: "🎯",
        get name() { return _t('items.bat_discipline.safe_name', 'Bate de Control de Zona'); },
        get text() { return _t('items.bat_discipline.safe_text', 'Comprar Bate de Control (+15 K-AVD, +15 EYE)'); },
        cost: 16,
        stats: { k_avd: 15, eye: 15 },
        get statDesc() { return "+15 K-AVD, +15 EYE"; }
      },
      riskyOption: {
        id: "bat_discipline_legend",
        icon: "🔬",
        get name() { return _t('items.bat_discipline.risky_name', 'Bate Biométrico de Zona Perfecta'); },
        get text() { return _t('items.bat_discipline.risky_text', 'Probar Bate de Alta Precisión (+25 K-AVD, +25 EYE)'); },
        cost: 6,
        successChance: 0.60,
        stats: { k_avd: 25, eye: 25 },
        get statDesc() { return "+25 K-AVD, +25 EYE"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.bat_discipline.suc_msg', '¡Lectura de zona impecable! Bate Biométrico calibrado (+25 K-AVD, +25 EYE).'); },
        get failMsg() { return _t('items.bat_discipline.fail_msg', '¡La prueba se descalibra y agota la vista del bateador! (-35 Stamina).'); }
      }
    },
    {
      id: "item_bat_hybrid",
      icon: "🔬",
      category: "bat",
      get title() { return _t('items.bat_hybrid.title', 'Bate Compuesto Balanceado'); },
      get desc() { return _t('items.bat_hybrid.desc', 'Aleación de grafeno y madera híbrida que potencia equilibradamente tanto el contacto como la fuerza.'); },
      safeOption: {
        id: "bat_hybrid_std",
        icon: "⚡",
        get name() { return _t('items.bat_hybrid.safe_name', 'Bate de Compuesto Homologado'); },
        get text() { return _t('items.bat_hybrid.safe_text', 'Comprar Bate Híbrido (+10 CON, +10 PWR)'); },
        cost: 18,
        stats: { con: 10, pwr: 10 },
        get statDesc() { return "+10 CON, +10 PWR"; }
      },
      riskyOption: {
        id: "bat_hybrid_legend",
        icon: "💎",
        get name() { return _t('items.bat_hybrid.risky_name', 'Bate de Hyper-Carbono Equilibrado'); },
        get text() { return _t('items.bat_hybrid.risky_text', 'Probar Prototipo Hyper-Carbono (+18 CON, +18 PWR)'); },
        cost: 7,
        successChance: 0.60,
        stats: { con: 18, pwr: 18 },
        get statDesc() { return "+18 CON, +18 PWR"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.bat_hybrid.suc_msg', '¡Equilibrio demoledor! Bate de Hyper-Carbono adquirido (+18 CON, +18 PWR).'); },
        get failMsg() { return _t('items.bat_hybrid.fail_msg', '¡Fallo de resonancia en el impacto! El bateador sufre agotamiento (-35 Stamina).'); }
      }
    },

    // ═════════════════════════════════════════════════════════════════════════
    // CATEGORÍA 2: CALZADO Y SPIKES (Velocidad & Desplazamiento)
    // ═════════════════════════════════════════════════════════════════════════
    {
      id: "item_spikes_speed",
      icon: "⚡",
      category: "shoes",
      get title() { return _t('items.spikes_speed.title', 'Spikes Ultraligeros de Velocista'); },
      get desc() { return _t('items.spikes_speed.desc', 'Calzado de suela de carbono para máxima aceleración en las almohadillas y robos de base.'); },
      safeOption: {
        id: "spikes_speed_std",
        icon: "👟",
        get name() { return _t('items.spikes_speed.safe_name', 'Spikes de Tracción Ligera'); },
        get text() { return _t('items.spikes_speed.safe_text', 'Comprar Spikes Ligeros (+25 SPD)'); },
        cost: 16,
        stats: { spd: 25 },
        get statDesc() { return "+25 SPD"; }
      },
      riskyOption: {
        id: "spikes_speed_legend",
        icon: "🏃",
        get name() { return _t('items.spikes_speed.risky_name', 'Spikes de Oro de Lou Brock'); },
        get text() { return _t('items.spikes_speed.risky_text', 'Probar Calzado de Oro (+45 SPD)'); },
        cost: 6,
        successChance: 0.60,
        stats: { spd: 45 },
        get statDesc() { return "+45 SPD"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.spikes_speed.suc_msg', '¡Velocidad supersónica! Spikes de Oro equipados (+45 SPD).'); },
        get failMsg() { return _t('items.spikes_speed.fail_msg', '¡El sprint extremo agota las piernas del corredor! (-35 Stamina).'); }
      }
    },
    {
      id: "item_shoes_contact",
      icon: "🏃",
      category: "shoes",
      get title() { return _t('items.shoes_contact.title', 'Zapatillas de Tracción & Contacto'); },
      get desc() { return _t('items.shoes_contact.desc', 'Calzado con soporte de balance en la caja de bateo para impulsar al leadoff hitter.'); },
      safeOption: {
        id: "shoes_contact_std",
        icon: "👟",
        get name() { return _t('items.shoes_contact.safe_name', 'Calzas de Balance y Pista'); },
        get text() { return _t('items.shoes_contact.safe_text', 'Comprar Zapatillas (+15 SPD, +10 CON)'); },
        cost: 16,
        stats: { spd: 15, con: 10 },
        get statDesc() { return "+15 SPD, +10 CON"; }
      },
      riskyOption: {
        id: "shoes_contact_legend",
        icon: "🔥",
        get name() { return _t('items.shoes_contact.risky_name', 'Zapatillas Turbo de Atletismo'); },
        get text() { return _t('items.shoes_contact.risky_text', 'Probar Zapatillas Turbo (+25 SPD, +20 CON)'); },
        cost: 6,
        successChance: 0.60,
        stats: { spd: 25, con: 20 },
        get statDesc() { return "+25 SPD, +20 CON"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.shoes_contact.suc_msg', '¡Arranque perfecto! Zapatillas Turbo equipadas (+25 SPD, +20 CON).'); },
        get failMsg() { return _t('items.shoes_contact.fail_msg', '¡El calzado rígido causa calambres en la prueba! (-35 Stamina).'); }
      }
    },
    {
      id: "item_shoes_defense",
      icon: "🛡️",
      category: "shoes",
      get title() { return _t('items.shoes_defense.title', 'Calzas de Cuadro & Reacción'); },
      get desc() { return _t('items.shoes_defense.desc', 'Diseñadas para defensores del cuadro y jardineros que necesitan cubrir amplio terreno.'); },
      safeOption: {
        id: "shoes_defense_std",
        icon: "👟",
        get name() { return _t('items.shoes_defense.safe_name', 'Spikes de Terreno Mixto'); },
        get text() { return _t('items.shoes_defense.safe_text', 'Comprar Calzas (+15 SPD, +15 DEF)'); },
        cost: 16,
        stats: { spd: 15, def: 15 },
        get statDesc() { return "+15 SPD, +15 DEF"; }
      },
      riskyOption: {
        id: "shoes_defense_legend",
        icon: "⚡",
        get name() { return _t('items.shoes_defense.risky_name', 'Spikes Blindados de Reacción Rápida'); },
        get text() { return _t('items.shoes_defense.risky_text', 'Probar Spikes Blindados (+25 SPD, +25 DEF)'); },
        cost: 6,
        successChance: 0.60,
        stats: { spd: 25, def: 25 },
        get statDesc() { return "+25 SPD, +25 DEF"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.shoes_defense.suc_msg', '¡Reflejos felinos! Spikes Blindados equipados (+25 SPD, +25 DEF).'); },
        get failMsg() { return _t('items.shoes_defense.fail_msg', '¡La sesión intensa de fildeo agota al jugador! (-35 Stamina).'); }
      }
    },
    {
      id: "item_shoes_endurance",
      icon: "💊",
      category: "shoes",
      get title() { return _t('items.shoes_endurance.title', 'Calzado de Resistencia Muscular'); },
      get desc() { return _t('items.shoes_endurance.desc', 'Plantillas de absorción de impacto y suelas ergonómicas que reducen la fatiga por partido.'); },
      safeOption: {
        id: "shoes_endurance_std",
        icon: "👟",
        get name() { return _t('items.shoes_endurance.safe_name', 'Plantillas Ortopédicas Pro'); },
        get text() { return _t('items.shoes_endurance.safe_text', 'Comprar Plantillas (+15 SPD, -50% Gasto Energía)'); },
        cost: 16,
        stats: { spd: 15 },
        energy_half_loss: true,
        get statDesc() { return "+15 SPD • -50% Gasto Energía"; }
      },
      riskyOption: {
        id: "shoes_endurance_legend",
        icon: "🌟",
        get name() { return _t('items.shoes_endurance.risky_name', 'Vendaje Biomecánico Infinito'); },
        get text() { return _t('items.shoes_endurance.risky_text', 'Probar Vendaje Biomecánico (+30 SPD, Inmune a Fatiga)'); },
        cost: 6,
        successChance: 0.60,
        stats: { spd: 30 },
        energy_immune: true,
        get statDesc() { return "+30 SPD • Inmune a Fatiga"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.shoes_endurance.suc_msg', '¡Resistencia infinita! El jugador nunca perderá energía (+30 SPD).'); },
        get failMsg() { return _t('items.shoes_endurance.fail_msg', '¡El vendaje mal colocado provoca un tirón muscular! (-35 Stamina).'); }
      }
    },

    // ═════════════════════════════════════════════════════════════════════════
    // CATEGORÍA 3: GUANTES Y PROTECTORES (Defensa & Resistencia)
    // ═════════════════════════════════════════════════════════════════════════
    {
      id: "item_glove_gold",
      icon: "🥇",
      category: "glove",
      get title() { return _t('items.glove_gold.title', 'Guante de Oro de Cuero Artesanal'); },
      get desc() { return _t('items.glove_gold.desc', 'Cuero curtido a mano con canasta profunda para atrapar cualquier batazo difícil.'); },
      safeOption: {
        id: "glove_gold_std",
        icon: "🧤",
        get name() { return _t('items.glove_gold.safe_name', 'Guantelete de Cuero de Calidad'); },
        get text() { return _t('items.glove_gold.safe_text', 'Comprar Guante Artesanal (+25 DEF)'); },
        cost: 16,
        stats: { def: 25 },
        get statDesc() { return "+25 DEF"; }
      },
      riskyOption: {
        id: "glove_gold_legend",
        icon: "🏆",
        get name() { return _t('items.glove_gold.risky_name', 'Guante de Oro Legendario de Rawlings'); },
        get text() { return _t('items.glove_gold.risky_text', 'Probar Guante de Oro Legendario (+45 DEF)'); },
        cost: 6,
        successChance: 0.60,
        stats: { def: 45 },
        get statDesc() { return "+45 DEF"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.glove_gold.suc_msg', '¡Muralla defensiva! Guante de Oro Legendario equipado (+45 DEF).'); },
        get failMsg() { return _t('items.glove_gold.fail_msg', '¡El cuero se rompe en la prueba! El fildeador pierde -35 Stamina.'); }
      }
    },
    {
      id: "item_glove_power",
      icon: "🥊",
      category: "glove",
      get title() { return _t('items.glove_power.title', 'Muñequeras de Cuero & Fuerza'); },
      get desc() { return _t('items.glove_power.desc', 'Protección reforzada en las muñecas para fildeadores de poder en las esquinas.'); },
      safeOption: {
        id: "glove_power_std",
        icon: "🧤",
        get name() { return _t('items.glove_power.safe_name', 'Muñequeras Clásicas de Algodón'); },
        get text() { return _t('items.glove_power.safe_text', 'Comprar Muñequeras (+15 DEF, +10 PWR)'); },
        cost: 16,
        stats: { def: 15, pwr: 10 },
        get statDesc() { return "+15 DEF, +10 PWR"; }
      },
      riskyOption: {
        id: "glove_power_legend",
        icon: "💪",
        get name() { return _t('items.glove_power.risky_name', 'Muñequeras Blindadas de Kevlar'); },
        get text() { return _t('items.glove_power.risky_text', 'Probar Muñequeras Blindadas (+25 DEF, +20 PWR)'); },
        cost: 6,
        successChance: 0.60,
        stats: { def: 25, pwr: 20 },
        get statDesc() { return "+25 DEF, +20 PWR"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.glove_power.suc_msg', '¡Fuerza y seguridad! Muñequeras de Kevlar equipadas (+25 DEF, +20 PWR).'); },
        get failMsg() { return _t('items.glove_power.fail_msg', '¡El vendaje apretado entumece las manos del jugador! (-35 Stamina).'); }
      }
    },
    {
      id: "item_glove_contact",
      icon: "🕸️",
      category: "glove",
      get title() { return _t('items.glove_contact.title', 'Manopla de Contacto & Fildeo'); },
      get desc() { return _t('items.glove_contact.desc', 'Manopla flexible de malla de trapecio para infielders que combinan bateo de hit y manos suaves.'); },
      safeOption: {
        id: "glove_contact_std",
        icon: "🧤",
        get name() { return _t('items.glove_contact.safe_name', 'Manopla de Fildeo Ligera'); },
        get text() { return _t('items.glove_contact.safe_text', 'Comprar Manopla (+15 DEF, +10 CON)'); },
        cost: 16,
        stats: { def: 15, con: 10 },
        get statDesc() { return "+15 DEF, +10 CON"; }
      },
      riskyOption: {
        id: "glove_contact_legend",
        icon: "💎",
        get name() { return _t('items.glove_contact.risky_name', 'Manopla Trapezoide Japonesa'); },
        get text() { return _t('items.glove_contact.risky_text', 'Probar Manopla Trapezoide (+25 DEF, +20 CON)'); },
        cost: 6,
        successChance: 0.60,
        stats: { def: 25, con: 20 },
        get statDesc() { return "+25 DEF, +20 CON"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.glove_contact.suc_msg', '¡Manos de seda! Manopla Trapezoide equipada (+25 DEF, +20 CON).'); },
        get failMsg() { return _t('items.glove_contact.fail_msg', '¡El jugador se sobreexige en los ejercicios de reflejos! (-35 Stamina).'); }
      }
    },
    {
      id: "item_glove_energy",
      icon: "🛡️",
      category: "glove",
      get title() { return _t('items.glove_energy.title', 'Peto / Protector de Energía'); },
      get desc() { return _t('items.glove_energy.desc', 'Protección ergonómica de pecho que absorbe el impacto de choques y conserva la energía del jugador.'); },
      safeOption: {
        id: "glove_energy_std",
        icon: "🛡️",
        get name() { return _t('items.glove_energy.safe_name', 'Peto de Espuma Acolchada'); },
        get text() { return _t('items.glove_energy.safe_text', 'Comprar Peto (+15 DEF, -50% Gasto Energía)'); },
        cost: 16,
        stats: { def: 15 },
        energy_half_loss: true,
        get statDesc() { return "+15 DEF • -50% Gasto Energía"; }
      },
      riskyOption: {
        id: "glove_energy_legend",
        icon: "🌟",
        get name() { return _t('items.glove_energy.risky_name', 'Armadura de Titanio de Receptor'); },
        get text() { return _t('items.glove_energy.risky_text', 'Probar Armadura de Titanio (+25 DEF, Inmune a Fatiga)'); },
        cost: 6,
        successChance: 0.60,
        stats: { def: 25 },
        energy_immune: true,
        get statDesc() { return "+25 DEF • Inmune a Fatiga"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.glove_energy.suc_msg', '¡Blindaje total! El jugador nunca perderá energía (+25 DEF).'); },
        get failMsg() { return _t('items.glove_energy.fail_msg', '¡Los impactos directos en la prueba agotan al jugador! (-35 Stamina).'); }
      }
    },

    // ═════════════════════════════════════════════════════════════════════════
    // CATEGORÍA 4: ACCESORIOS & RELIQUIAS (Visión & Versatilidad)
    // ═════════════════════════════════════════════════════════════════════════
    {
      id: "item_acc_glasses",
      icon: "🕶️",
      category: "accessory",
      get title() { return _t('items.acc_glasses.title', 'Lentes Polarizados de Alta Definición'); },
      get desc() { return _t('items.acc_glasses.desc', 'Gafas de precisión antirreflejo para una visión nítida de los lanzamientos y la zona de strike.'); },
      safeOption: {
        id: "acc_glasses_std",
        icon: "👓",
        get name() { return _t('items.acc_glasses.safe_name', 'Gafas Antirreflejo Pro'); },
        get text() { return _t('items.acc_glasses.safe_text', 'Comprar Gafas (+25 EYE)'); },
        cost: 16,
        stats: { eye: 25 },
        get statDesc() { return "+25 EYE"; }
      },
      riskyOption: {
        id: "acc_glasses_legend",
        icon: "🔬",
        get name() { return _t('items.acc_glasses.risky_name', 'Lentes Holográficos de Visión Térmica'); },
        get text() { return _t('items.acc_glasses.risky_text', 'Probar Lentes Holográficos (+45 EYE)'); },
        cost: 6,
        successChance: 0.60,
        stats: { eye: 45 },
        get statDesc() { return "+45 EYE"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.acc_glasses.suc_msg', '¡Visión cibernética! Lentes Holográficos equipados (+45 EYE).'); },
        get failMsg() { return _t('items.acc_glasses.fail_msg', '¡La graduación incorrecta cansa la vista del bateador! (-35 Stamina).'); }
      }
    },
    {
      id: "item_acc_wristband",
      icon: "🧠",
      category: "accessory",
      get title() { return _t('items.acc_wristband.title', 'Muñequera Táctica de Scouteo'); },
      get desc() { return _t('items.acc_wristband.desc', 'Tarjeta de tendencias de pitcheo en la muñeca para anticipar la secuencia del rival.'); },
      safeOption: {
        id: "acc_wristband_std",
        icon: "📋",
        get name() { return _t('items.acc_wristband.safe_name', 'Tarjeta de Scouteo Tradicional'); },
        get text() { return _t('items.acc_wristband.safe_text', 'Comprar Muñequera (+15 EYE, +10 CON)'); },
        cost: 16,
        stats: { eye: 15, con: 10 },
        get statDesc() { return "+15 EYE, +10 CON"; }
      },
      riskyOption: {
        id: "acc_wristband_legend",
        icon: "📱",
        get name() { return _t('items.acc_wristband.risky_name', 'Pulsera Digital de Scouteo Avanzado'); },
        get text() { return _t('items.acc_wristband.risky_text', 'Probar Pulsera Digital (+25 EYE, +20 CON)'); },
        cost: 6,
        successChance: 0.60,
        stats: { eye: 25, con: 20 },
        get statDesc() { return "+25 EYE, +20 CON"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.acc_wristband.suc_msg', '¡Scouteo perfecto! Pulsera Digital equipada (+25 EYE, +20 CON).'); },
        get failMsg() { return _t('items.acc_wristband.fail_msg', '¡La sobrecarga de información confunde al bateador! (-35 Stamina).'); }
      }
    },
    {
      id: "item_acc_helmet",
      icon: "🎯",
      category: "accessory",
      get title() { return _t('items.acc_helmet.title', 'Casco Blindado con Extensión Facial'); },
      get desc() { return _t('items.acc_helmet.desc', 'Casco aerodinámico con protector de mandíbula para pararse en el plato con total confianza.'); },
      safeOption: {
        id: "acc_helmet_std",
        icon: "⛑️",
        get name() { return _t('items.acc_helmet.safe_name', 'Casco Reforzado Pro'); },
        get text() { return _t('items.acc_helmet.safe_text', 'Comprar Casco Reforzado (+25 K-AVD)'); },
        cost: 16,
        stats: { k_avd: 25 },
        get statDesc() { return "+25 K-AVD"; }
      },
      riskyOption: {
        id: "acc_helmet_legend",
        icon: "🛡️",
        get name() { return _t('items.acc_helmet.risky_name', 'Casco Blindado de Titanio'); },
        get text() { return _t('items.acc_helmet.risky_text', 'Probar Casco de Titanio (+45 K-AVD)'); },
        cost: 6,
        successChance: 0.60,
        stats: { k_avd: 45 },
        get statDesc() { return "+45 K-AVD"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.acc_helmet.suc_msg', '¡Confianza absoluta en el plato! Casco de Titanio (+45 K-AVD).'); },
        get failMsg() { return _t('items.acc_helmet.fail_msg', '¡El peso del casco fatiga el cuello del bateador! (-35 Stamina).'); }
      }
    },
    {
      id: "item_acc_gum",
      icon: "🍬",
      category: "accessory",
      get title() { return _t('items.acc_gum.title', 'Chicle de la Suerte de Serie Mundial'); },
      get desc() { return _t('items.acc_gum.desc', 'Goma de mascar bendecida de los años 80 que eleva la moral y todos los atributos.'); },
      safeOption: {
        id: "acc_gum_std",
        icon: "🍬",
        get name() { return _t('items.acc_gum.safe_name', 'Chicle Energético Clásico'); },
        get text() { return _t('items.acc_gum.safe_text', 'Comprar Chicle (+10 a Todos los Stats)'); },
        cost: 16,
        stats: { con: 10, pwr: 10, eye: 10, k_avd: 10, spd: 10, def: 10 },
        get statDesc() { return "+10 a Todos los Stats"; }
      },
      riskyOption: {
        id: "acc_gum_legend",
        icon: "👑",
        get name() { return _t('items.acc_gum.risky_name', 'Chicle Dorado de Grand Slam'); },
        get text() { return _t('items.acc_gum.risky_text', 'Probar Chicle Dorado (+18 a Todos los Stats)'); },
        cost: 7,
        successChance: 0.60,
        stats: { con: 18, pwr: 18, eye: 18, k_avd: 18, spd: 18, def: 18 },
        get statDesc() { return "+18 a Todos los Stats"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.acc_gum.suc_msg', '¡Aura de campeón! Chicle Dorado consumido (+18 a Todos los Stats).'); },
        get failMsg() { return _t('items.acc_gum.fail_msg', '¡Indigestión estomacal! El jugador pierde -35 Stamina.'); }
      }
    },

    // ═════════════════════════════════════════════════════════════════════════
    // CATEGORÍA 5: CONSUMIBLES & RECUPERACIÓN DE ENERGÍA (Stamina Boosts)
    // ═════════════════════════════════════════════════════════════════════════
    {
      id: "item_energy_drink",
      icon: "🥤",
      category: "consumable",
      get title() { return _t('items.energy_drink.title', 'Bebida Isotónica de Electrolitos'); },
      get desc() { return _t('items.energy_drink.desc', 'Fórmula rehidratante de absorción celular ultra-rápida para revitalizar músculos.'); },
      safeOption: {
        id: "energy_drink_std",
        icon: "🧪",
        isConsumable: true,
        get name() { return _t('items.energy_drink.safe_name', 'Bebida Isotónica Rehidratante'); },
        get text() { return _t('items.energy_drink.safe_text', 'Comprar Bebida (+50 Energía)'); },
        cost: 10,
        staminaHeal: 50,
        get statDesc() { return "+50 Energía"; }
      },
      riskyOption: {
        id: "energy_drink_legend",
        icon: "⚡",
        isConsumable: true,
        get name() { return _t('items.energy_drink.risky_name', 'Fórmula Energética Concentrada'); },
        get text() { return _t('items.energy_drink.risky_text', 'Probar Fórmula (+100% Energía, +5 CON, +5 SPD, +5 DEF Perm.)'); },
        cost: 4,
        successChance: 0.60,
        staminaHealPercent: 1.0,
        permStats: { con: 5, spd: 5, def: 5 },
        get statDesc() { return "+100% Energía • +5 CON/SPD/DEF Perm."; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.energy_drink.suc_msg', '¡Revitalización total! +100% Energía y +5 CON, +5 SPD, +5 DEF permanentes.'); },
        get failMsg() { return _t('items.energy_drink.fail_msg', '¡Reacción alérgica a los electrolitos! El jugador pierde -35 Stamina.'); }
      }
    },
    {
      id: "item_energy_icebath",
      icon: "❄️",
      category: "consumable",
      get title() { return _t('items.energy_icebath.title', 'Baño de Hielo & Crioterapia'); },
      get desc() { return _t('items.energy_icebath.desc', 'Terapia de frío extremo para desinflamar tendones y recuperar la frescura de todo el equipo.'); },
      safeOption: {
        id: "energy_icebath_std",
        icon: "❄️",
        isConsumable: true,
        get name() { return _t('items.energy_icebath.safe_name', 'Terapia de Hielo Convencional'); },
        get text() { return _t('items.energy_icebath.safe_text', 'Comprar Baño (+40 Jugador, +20 Equipo)'); },
        cost: 14,
        staminaHeal: 40,
        teamStaminaHeal: 20,
        get statDesc() { return "+40 Energía Jugador • +20 Equipo"; }
      },
      riskyOption: {
        id: "energy_icebath_legend",
        icon: "🏔️",
        isConsumable: true,
        get name() { return _t('items.energy_icebath.risky_name', 'Cámara Criogénica Avanzada'); },
        get text() { return _t('items.energy_icebath.risky_text', 'Probar Cámara Criogénica (+70 Energía a Todo el Equipo)'); },
        cost: 5,
        successChance: 0.60,
        teamStaminaHeal: 70,
        get statDesc() { return "+70 Energía a Todo el Equipo"; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.energy_icebath.suc_msg', '¡Recuperación masiva! +70 de Energía restaurada a todo el equipo.'); },
        get failMsg() { return _t('items.energy_icebath.fail_msg', '¡Choque térmico en la cámara! El jugador de prueba pierde -35 Stamina.'); }
      }
    },
    {
      id: "item_energy_massage",
      icon: "💆",
      category: "consumable",
      get title() { return _t('items.energy_massage.title', 'Sesión de Masaje & Fisioterapia'); },
      get desc() { return _t('items.energy_massage.desc', 'Técnicas de liberación miofascial y quiropráctica para relajar tensiones y afinar los sentidos.'); },
      safeOption: {
        id: "energy_massage_std",
        icon: "✨",
        isConsumable: true,
        get name() { return _t('items.energy_massage.safe_name', 'Masaje Deportivo Relajante'); },
        get text() { return _t('items.energy_massage.safe_text', 'Comprar Masaje (+70 Energía)'); },
        cost: 12,
        staminaHeal: 70,
        get statDesc() { return "+70 Energía"; }
      },
      riskyOption: {
        id: "energy_massage_legend",
        icon: "🧘",
        isConsumable: true,
        get name() { return _t('items.energy_massage.risky_name', 'Tratamiento Quiropráctico Maestro'); },
        get text() { return _t('items.energy_massage.risky_text', 'Probar Sesión Maestra (+100% Energía, +10 EYE, +10 K-AVD Perm.)'); },
        cost: 5,
        successChance: 0.60,
        staminaHealPercent: 1.0,
        permStats: { eye: 10, k_avd: 10 },
        get statDesc() { return "+100% Energía • +10 EYE/K-AVD Perm."; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.energy_massage.suc_msg', '¡Claridad y relajación total! +100% Energía y +10 EYE, +10 K-AVD permanentes.'); },
        get failMsg() { return _t('items.energy_massage.fail_msg', '¡Tirón muscular en la camilla! El jugador pierde -35 Stamina.'); }
      }
    },
    {
      id: "item_energy_shake",
      icon: "☕",
      category: "consumable",
      get title() { return _t('items.energy_shake.title', 'Batido de Proteína Concentrado'); },
      get desc() { return _t('items.energy_shake.desc', 'Suplemento nutricional de alta densidad calórica y aminoácidos para aumentar masa y fuerza.'); },
      safeOption: {
        id: "energy_shake_std",
        icon: "🥤",
        isConsumable: true,
        get name() { return _t('items.energy_shake.safe_name', 'Batido Proteico de Vestuario'); },
        get text() { return _t('items.energy_shake.safe_text', 'Comprar Batido (+40 Energía, +5 PWR Perm.)'); },
        cost: 12,
        staminaHeal: 40,
        permStats: { pwr: 5 },
        get statDesc() { return "+40 Energía • +5 PWR Perm."; }
      },
      riskyOption: {
        id: "energy_shake_legend",
        icon: "💪",
        isConsumable: true,
        get name() { return _t('items.energy_shake.risky_name', 'Batido de Alta Potencia'); },
        get text() { return _t('items.energy_shake.risky_text', 'Probar Batido Concentrado (+80 Energía, +10 PWR Perm.)'); },
        cost: 5,
        successChance: 0.60,
        staminaHeal: 80,
        permStats: { pwr: 10 },
        get statDesc() { return "+80 Energía • +10 PWR Perm."; },
        failStaminaCost: 35,
        get successMsg() { return _t('items.energy_shake.suc_msg', '¡Fuerza explosiva! +80 de Energía y +10 PWR permanente para siempre.'); },
        get failMsg() { return _t('items.energy_shake.fail_msg', '¡Sobredosis de cafeína y fatiga! El jugador pierde -35 Stamina.'); }
      }
    }
  ];

  window.ItemsDatabase = ItemsDatabase;

})();
