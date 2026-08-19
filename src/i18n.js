/**
 * BaseRogue Internationalization (i18n) Module
 * Professional i18n infrastructure using i18next
 */

(function () {
  const STORAGE_KEY = 'baserogue_lang';

  // Translation resources embedded as primary/fallback dictionary to ensure 100% offline & local file:// compatibility
  const resources = {
    es: {
      translation: {
      "hud": {
            "stage": "Etapa:",
            "budget": "Presupuesto:",
            "roster": "Alineación",
            "synergies": "Sinergias"
      },
      "sidebar": {
            "upgrades": "<i class=\"fa-solid fa-suitcase\"></i> MEJORAS",
            "no_items": "NADA COMPRADO",
            "eras_header": "ERAS DEL ROSTER",
            "franchises_header": "FRANQUICIAS DEL ROSTER",
            "no_teams": "Ningún equipo registrado.",
            "dynasty_desc": "Dinastía (4+): Jugadores de {{team}} obtienen +5 a todos sus stats en combate.",
            "chemistry_desc": "Química (2+): Jugadores de {{team}} obtienen +2 a todos sus stats en combate."
      },
      "eras": {
            "header": "⏳ ERAS DEL ROSTER",
            "franchises_header": "⚾ FRANQUICIAS DEL ROSTER",
            "genesis_d1": "T1 (2+): 30% prob de avanzar base adicional y +8 daño",
            "genesis_d2": "T2 (4+): 45% prob de avanzar base adicional y +12 daño",
            "genesis_d3": "T3 (6+): 60% prob de avanzar base adicional y +18 daño",
            "genesis_d4": "T4 (8+): 80% prob de avanzar base adicional y +25 daño",
            "deadball_d1": "T1 (2+): +3 CON/K-AVD al equipo; sencillos (1B) hacen +8 daño extra",
            "deadball_d2": "T2 (4+): +6 CON/K-AVD; sencillos hacen +14 daño extra",
            "deadball_d3": "T3 (6+): +9 CON/K-AVD; sencillos +20 daño; carreras anotadas hacen +12 daño extra",
            "deadball_d4": "T4 (8+): +12 CON/K-AVD; sencillos +28 daño; carreras anotadas hacen +20 daño extra",
            "golden_d1": "Golden Era: Todos los hits hacen +6 daño adicional.",
            "golden_d2": "Golden Era: Hits +12 daño; 30% de convertir 2B en 3B.",
            "golden_d3": "Golden Era: Hits +18 daño; 50% convertir 2B en 3B; +10% chance de HR.",
            "integration_d1": "T1 (2+): Equipo obtiene +3 a todos sus stats en combate",
            "integration_d2": "T2 (4+): Equipo +6 stats; hits infligen +10 daño; outs curan +8 Stamina a todos",
            "integration_d3": "T3 (6+): Equipo +9 stats; hits infligen +18 daño; outs curan +12 Stamina a todos",
            "integration_d4": "T4 (8+): +12 stats; hits infligen +26 daño; outs curan +16; inmune a fatiga",
            "speed_d1": "T1 (2+): +3 SPD al equipo; +20% prob. de robo; robo cura +10 Stamina y +8 daño",
            "speed_d2": "T2 (4+): +6 SPD y +3 EYE; +35% prob. de robo; robo cura +15 y hace +15 daño",
            "speed_d3": "T3 (6+): +9 SPD y +6 EYE; +50% prob. de robo; robo cura +20 y hace +22 daño",
            "speed_d4": "T4 (8+): +13 SPD y +9 EYE; robo 100% garantizado; cura +25 y hace +30 daño",
            "astroturf_d1": "T1 (2+): +3 DEF y +3 SPD al equipo (+10 Escudo); robos hacen +10 daño",
            "astroturf_d2": "T2 (4+): +6 DEF/SPD (+20 Escudo); robos hacen +18 daño y debuff 3 impactos",
            "astroturf_d3": "T3 (6+): +10 DEF/SPD (+30 Escudo); robos hacen +26 daño y debuff 4 impactos",
            "astroturf_d4": "T4 (8+): +14 DEF/SPD (+40 Escudo); robos +35 daño, debuff 5 impactos y outs hacen -50% daño",
            "steroid_d1": "T1 (2+): +4 PWR al equipo; Jonrones (HR) hacen +15 daño adicional",
            "steroid_d2": "T2 (4+): +7 PWR; HR hacen +25 daño adicional y curan +10 Stamina a todos",
            "steroid_d3": "T3 (6+): +11 PWR; HR hacen +38 daño adicional y curan +15 Stamina a todos",
            "steroid_d4": "T4 (8+): +15 PWR; HR hacen +50 daño adicional y curan +20 Stamina a todos",
            "moneyball_d1": "T1 (2+): Bases por bolas (BB) hacen +10 daño extra",
            "moneyball_d2": "T2 (4+): BB +16 daño; al embasarte fatigas al rival 1 impacto (+20% daño)",
            "moneyball_d3": "T3 (6+): BB +24 daño; fatiga 2 impactos; ponches van al escudo (no a vida)",
            "moneyball_d4": "T4 (8+): BB +32 daño; fatiga 2 impactos; ponches van al escudo y con -50% daño",
            "tto_d1": "T1 (2+): +3 EYE y +3 PWR; BB hacen +12 daño; Ponche hace -50% daño al equipo",
            "tto_d2": "T2 (4+): +6 EYE/PWR; BB +18 daño; Ponche no incrementa racha enemiga",
            "tto_d3": "T3 (6+): +9 EYE/PWR; BB +25 daño; HR aplica debuff de 3 impactos (+30% daño)",
            "tto_d4": "T4 (8+): +12 EYE/PWR; BB +35 daño; Ponche hace 0 daño al equipo (anulado)",
            "golden_d4": "Golden Era: ¡Hits +25 daño! 75% convertir 2B en 3B; +20% chance de HR y +20 Escudo inicial."
      },
      "map": {
            "title": "<i class=\"fa-solid fa-map\"></i> Mapa del Campeonato",
            "desc": "Elige tu camino. Gana partidos para conseguir dinero, recluta jugadores y entrena tu plantilla.",
            "stage_playoffs": "Playoffs — Fase Final - Dificultad: Leyenda",
            "stage_pennant": "Pennant Chase — Final de temporada - Dificultad: Experto",
            "stage_allstar": "All-Star Break — Mitad de temporada - Dificultad: Difícil",
            "stage_opening": "Opening Day — Inicio de temporada - Dificultad: Normal",
            "locked": "BLOQUEADA",
            "active": "ACTIVA",
            "completed": "COMPLETADA",
            "node_opener": "JUEGO APERTURA",
            "node_classic": "SERIE CLÁSICA",
            "node_sign": "FIRMA LEYENDA",
            "node_cage": "JAULA BATEO",
            "node_clubhouse": "CASA CLUB",
            "node_decision": "DECISIÓN",
            "node_boss": "BOSS",
            "boss_label": {
                  "3": "JUEGO APERTURA",
                  "7": "ALL-STAR GAME",
                  "11": "CAMPEÓN LIGA",
                  "15": "SERIE MUNDIAL"
            },
            "label_classic": "SERIE CLÁSICA",
            "label_decision": "DECISIÓN",
            "node_pennant": "CAMPEÓN LIGA",
            "node_world_series": "SERIE MUNDIAL",
            "win_pct": "Prob. Victoria: {{pct}}%"
      },
      "ratings_guide": {
            "title": "📊 GUÍA DE RATINGS",
            "con": "<strong style=\"color:#a7f3d0;\">CON — Contacto:</strong> Determina la probabilidad de conectar un batazo. Jugadores con alto CON tienen más chances de sencillos e hits en general.",
            "pwr": "<strong style=\"color:#f59e0b;\">PWR — Poder:</strong> Probabilidad de conectar extra-bases (dobles, triples, jonrones). También aumenta el daño al pitcher rival en hits largos.",
            "eye": "<strong style=\"color:#3b82f6;\">EYE — Ojo/Vista:</strong> Probabilidad de obtener boletos (BB). Clave para avanzar corredores y desgastar al lanzador rival.",
            "k_avd": "<strong style=\"color:#ec4899;\">K/AVD — Evasión de Ponches:</strong> Reduce la zona de ponches (SO) en la tirada del dado. Clave para evitar el daño directo a la salud del equipo que provocan los ponches.",
            "spd": "<strong style=\"color:#38bdf8;\">SPD — Velocidad:</strong> Activa intentos de robo de base en sencillos (debuff +20% daño al pitcher). También mejora la probabilidad de convertir hits en extra-bases.",
            "def": "<strong style=\"color:#a855f7;\">DEF — Defensa:</strong> Contribuye al <strong>Escudo</strong> del equipo. Cuanto mayor DEF promedio, más escudo tienes disponible para absorber OUTs antes de perder HP.",
            "captain": "<strong style=\"color:#eab308;\">👑 CAPTAIN:</strong> +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.",
            "clutch": "<strong style=\"color:#ef4444;\">⚡ CLUTCH PLAYER:</strong> +2% de probabilidad de sencillo y doble, +4% de HR con corredores en posición de anotar o durante la última entrada.",
            "tooltip": "Guía de Atributos y Estadísticas"
      },
      "mode_select": {
            "app_title": "⚾ BASE-ROGUE",
            "select_mode": "SELECCIONA EL MODO DE JUEGO",
            "story_title": "MODO HISTORIA",
            "story_subtitle": "TEMPORADAS 1901 – 2025",
            "story_desc": "Revive temporadas históricas de la MLB y derrota a los mejores equipos en tu camino a la Serie Mundial.",
            "story_btn": "⚾ SELECCIONAR TEMPORADA",
            "quick_title": "PARTIDA RÁPIDA",
            "quick_subtitle": "MODO CLÁSICO",
            "quick_desc": "La experiencia clásica BaseRogue, enfréntate a oponentes legendarios de distintas eras.",
            "challenge162_title": "162-0 CHALLENGE",
            "challenge162_subtitle": "TEMPORADA PERFECTA",
            "challenge162_desc": "Arma tu equipo con cartas desbloqueadas y simula una temporada de 162 juegos en busca de un récord perfecto.",
            "challenge162_btn": "🏆 ARMAR EQUIPO",
            "challenge162_locked_desc": "🔒 Modo Bloqueado. Gana tu primera run en Partida Rápida para desbloquear el desafío 162-0.",
            "challenge162_locked_btn": "🔒 BLOQUEADO (GANA PARTIDA RÁPIDA)",
            "challenge162_continue_btn": "⚾ CONTINUAR TEMPORADA",
            "tagline": "BASEBALL ROGUELIKE",
            "quick_btn": "⚡ PARTIDA RÁPIDA",
            "career_title": "MODO CARRERA",
            "career_subtitle": "DE ROOKIE AL SALÓN DE LA FAMA",
            "career_desc": "Crea y guía a tu jugador desde el Draft hasta el estrellato. Toma decisiones tácticas, supera desafíos y forja tu legado.",
            "career_btn": "⭐ INICIAR CARRERA"
      },
      "common": {
            "back_menu": "← MENÚ",
            "damage": "DAÑO",
            "shield": "ESCUDO",
            "loading": "Cargando..."
      },
      "season_select": {
            "title": "📜 SELECCIONA LA TEMPORADA",
            "desc": "Elige el año para competir contra todos los equipos reales de esa época con sus 3 mejores pitchers por WAR.",
            "year_label": "AÑO DE LA TEMPORADA:",
            "random": "🎲 Season Aleatoria",
            "start_btn": "⚾ EMPEZAR TEMPORADA HISTÓRICA",
            "roulette_title": "🎲 SORTEANDO TEMPORADA 🎲",
            "roulette_status": "Buscando año histórico..."
      },
      "menu": {
            "intro_title": "BaseRogue",
            "intro_desc": "Elije a tus Jugadores en <strong style=\"color:#00ff66;\">{{rounds}} rondas de draft</strong> para armar tu alineación completa de 9 bateadores. Organiza su posición defensiva (Drag & Drop) y su orden al bate en tiempo real. Luego <strong style=\"color:#00ff66;\">lanza el dado</strong> en cada turno para determinar el resultado al bate. Derrota la rotación rival antes de que tus <strong style=\"color:#ef4444;\">{{hp}} HP</strong> lleguen a cero."
      },
      "draft": {
            "title": "<i class=\"fa-solid fa-file-signature\"></i> Firma de Jugadores (Draft)",
            "desc": "Selecciona una leyenda para unir a tu roster. Elige sabiamente para optimizar las posiciones y activar sinergias de Era o de Franquicia.",
            "midrun_desc": "Selecciona una leyenda para contratar con tu presupuesto, o rechaza la firma para continuar la carrera.",
            "midrun_title_short": "FIRMA LEYENDA",
            "round_header": "⚾ DRAFT INICIAL — RONDA {{round}} DE 9",
            "roster_header": "🧤 ALINEACIÓN",
            "batting_order_header": "⚔️ ORDEN AL BATE",
            "auto_sort": "⚙️ AUTO ORDEN",
            "auto_sort_title": "Ordena lógicamente: Velocidad al 1ro, Poder al 4to, Mejores bates al 2do y 3ro.",
            "select_btn": "✔ SELECCIONAR",
            "inspect_card": "CARTA",
            "sign_btn": "✍️ Firmar (${{cost}})",
            "auto_complete_btn": "🎲 ¡Sorpréndeme! (Auto-Completar)",
            "decline_btn": "🚫 Rechazar Firma / Continuar",
            "decline_desc": "¿No deseas contratar a ninguna leyenda o prefieres guardar tu dinero? Puedes rechazar la firma y avanzar en el mapa.",
            "confirm_lineup_title": "⚾ ALINEACIÓN PARA INICIAR LA TEMPORADA",
            "confirm_defensive_header": "🧤 ALINEACIÓN DEFENSIVA (DRAG & DROP)",
            "confirm_batting_header": "⚔️ ORDEN AL BATE",
            "start_campaign_btn": "⚾ CONFIRMAR EQUIPO E INICIAR CAMPAÑA",
            "swap_modal_title": "<i class=\"fa-solid fa-triangle-exclamation\"></i> Roster Lleno",
            "swap_modal_desc": "Tu banquillo y alineación están al completo. Selecciona a un jugador actual para sustituirlo permanentemente por la nueva firma:",
            "swap_new_player": "Firma Nueva: {{name}}",
            "swap_reject_btn": "Rechazar Firma",
            "round_elite_hint": "Esta es una ronda garantizada de élite. Aprovecha para asegurar un titular de calidad.",
            "round_common_hint": "Ronda de Common. Estos jugadores llenarán los slots que te faltan y formarán tu banco.",
            "round_free_hint": "Ronda libre: puede aparecer cualquier rareza del pool. ¡Buena suerte!",
            "round_1_label": "EPIC O SUPERIOR",
            "round_2_label": "RARE O SUPERIOR",
            "round_3_label": "UNCOMMON O SUPERIOR",
            "round_4_label": "COMMON OBLIGATORIO",
            "round_free_label": "RONDA LIBRE — CUALQUIER RAREZA",
            "initial_shield": "🛡️ Escudo Inicial: <span style=\"color:#10b981;font-size:13px;\">{{shield}} PTS</span>",
            "drag_to_reorder": "Arrastra para reordenar",
            "pack_open_prompt": "¡Toca para abrir el sobre!",
            "pack_tagline_standard": "Sobre Estándar",
            "pack_tagline_premium": "Sobre Élite o Mejor",
            "pack_tagline_legendary": "Sobre Legendario",
            "pack_tagline_vintage": "Sobre Clásico Vintage",
            "pack_tagline_speed": "Sobre de Velocistas",
            "pack_tagline_power": "Sobre de Poder Slugger",
            "pack_tagline_contact": "Sobre de Contacto",
            "pack_tagline_pitcher": "Sobre de Pitchers",
            "insufficient_funds": "Fondos insuficientes",
            "legend_no_budget": "Sin presupuesto para fichar leyendas",
            "signed_cost_suffix": "fichado por"
      },
      "pre_fight": {
            "title": "<i class=\"fa-solid fa-shield-halved\"></i> Preparación de la Serie",
            "subtitle": "Te enfrentas a la serie contra {{team}}. Asegúrate de que tus bateadores estén listos.",
            "batters_title": "<i class=\"fa-solid fa-users\"></i> Tus Bateadores (HP)",
            "pitchers_title": "<i class=\"fa-solid fa-skull-crossbones\"></i> Rotación Oponente (HP)",
            "start_btn": "<i class=\"fa-solid fa-fire-flame-curved\"></i> ¡AL COMBATE!",
            "back_map_btn": "<i class=\"fa-solid fa-arrow-left\"></i> Volver al Mapa",
            "scouting_title": "REPORTE DE SCOUTING RIVAL",
            "rival_rotation_label": "ROTACIÓN RIVAL:",
            "ovr_label": "MEDIA (OVR):",
            "era_label": "ERA PREDOMINANTE:",
            "mixed_eras": "Era Mixta"
      },
      "match": {
            "title": "<i class=\"fa-solid fa-trophy\"></i> Bateadores al Combate",
            "interactive_header": "<i class=\"fa-solid fa-baseball\"></i> COMBATE INTERACTIVO VS {{team}}",
            "arena": "ARENA COMBATE",
            "runs": "CARRERAS:",
            "outs": "OUTS:",
            "inning": "INNING:",
            "rival_ko": "K.O. RIVALES:",
            "active_turn": "TURNO ACTIVO",
            "native_pos": "POS NATIVA:",
            "team_hp": "TEAM HP",
            "shield_label": "ESCUDO (DEF avg {{avg}})",
            "so_streak": "🔥 RACHA PONCHES: {{count}} ({{mult}}x dmg DIRECTO)",
            "so_streak_zero": "🔥 Racha de Ponches: 0",
            "debuff_badge": "DAÑO RECIBIDO",
            "luck_zones": "Zonas de la suerte",
            "bb": "Boleto (BB)",
            "so": "Ponche (SO)",
            "out": "Out (Fly/GD)",
            "single": "Sencillo (1B)",
            "double": "Doble (2B)",
            "triple": "Triple (3B)",
            "hr": "Jonrón (HR)",
            "roll_dice": "🎲 LANZAR DADO",
            "simulate_all": "⚡ SIMULAR TODO",
            "history": "HISTORIAL DEL PARTIDO",
            "log_hr": "🎲 [{{roll}}] [JONRÓN] ¡{{batter}} CUADRANGULAR de {{runs}} carreras! Anotan {{runs}} carreras. {{pitcher}} sufre {{dmg}} HP de daño.",
            "log_3b": "🎲 [{{roll}}] [TRIPLE] ¡{{batter}} triple al rincón! Anotan {{runs}} carreras. {{pitcher}} sufre {{dmg}} HP de daño.",
            "log_2b": "🎲 [{{roll}}] [DOBLE] ¡{{batter}} línea violenta por la raya! Anotan {{runs}} carreras. {{pitcher}} sufre {{dmg}} HP de daño.",
            "log_1b": "🎲 [{{roll}}] [SENCILLO] ¡{{batter}} imparable raso! Anotan {{runs}} carreras. {{pitcher}} sufre {{dmg}} HP de daño.",
            "log_out": "🎲 [{{roll}}] [OUT] {{batter}} {{outStr}}. Escudo -{{shieldDmg}} HP | Team HP -{{teamHpDmg}} HP. (Escudo: {{shield}}/{{maxShield}} | HP: {{hp}}/100)",
            "log_so": "🎲 [{{roll}}] [PONCHE] ¡{{pitcher}} poncha a {{batter}}!{{chain}} Daño directo: -{{dmg}} HP del equipo (¡ignora el escudo!). HP restante: {{hp}}/100",
            "log_bb": "🎲 [{{roll}}] [BOLETO] ¡{{batter}} saca boleto (BB)! {{pitcher}} sufre {{dmg}} HP de daño por paciencia al bate.",
            "out_ground": "saca un rodado por el cuadro para out",
            "out_fly": "conecta un elevado al jardín para out de rutina",
            "out_line": "línea quemante atrapada en el aire",
            "log_ko": "[K.O.] ¡{{name}} ha sido derrotado!",
            "log_relief": "Entra al relevo: {{name}} ({{hp}}/{{maxHp}} HP).",
            "log_residual": "⚡ ¡Daño residual! Entra al relevo {{name}} absorbiendo -{{dmg}} HP de impacto ({{hp}}/{{maxHp}} HP).",
            "log_steal": "🏃 ¡ROBO EXITOSO! {{batter}} roba la 2ª base!",
            "log_runs_damage": "Anotan {{runs}} carreras. {{pitcher}} sufre {{dmg}} HP de daño.",
            "log_defeat": "💀 DERROTA. Tu equipo llegó a 0 HP. Los ponches acabaron con tu alineación.",
            "log_victory": "🏆 ¡VICTORIA! Derrotaste a la rotación rival.",
            "win_title": "🏆 ¡VICTORIA DE LA SERIE! 🏆",
            "loss_title": "💀 DERROTA EN LA SERIE 💀",
            "win_desc": "¡Extraordinario! Lograste noquear a la rotación completa de {{team}}.",
            "loss_desc": "Los lanzadores de {{team}} dominaron la serie. Tu HP llegó a 0.",
            "claim_rewards": "RECLAMAR RECOMPENSAS",
            "see_results": "VER RESULTADOS",
            "rival_rotation": "ROTACIÓN RIVAL",
            "outcome_victory": "¡VICTORIA CONTUNDENTE! Has derrotado a la rotación completa de lanzadores.",
            "outcome_defeat": "DERROTA. Tu alineación ha sido noqueada por los lanzadores rivales.",
            "banner_inning": "INNING {{inning}}",
            "banner_inning_sub": "¡ALTA DEL INNING! BATEADORES AL COMBATE",
            "banner_inning_last": "ÚLTIMA ENTRADA",
            "banner_inning_last_sub": "¡MOMENTO CLUTCH! TODO O NADA",
            "banner_ko": "¡PITCHER NOQUEADO!",
            "banner_ko_sub": "LA ROTACIÓN RIVAL RECIBE DAÑO CRÍTICO",
            "banner_bullpen": "ENTRA EL BULLPEN RIVAL",
            "banner_bullpen_sub": "UN NUEVO LANZADOR SUBE A LA LOMA"
      },
      "popup": {
            "bb_title": "BASE POR BOLAS",
            "bb_dmg": "¡PITCHER RECIBE DAÑO!",
            "so_title": "¡PONCHE!",
            "so_dmg": "DAÑO DIRECTO (IGNORA ESCUDO)",
            "out_title": "OUT",
            "out_dmg": "DAÑO AL ESCUDO",
            "single_title": "SENCILLO (1B)",
            "single_dmg": "DAÑO AL PITCHER",
            "double_title": "DOBLE (2B) ⚡",
            "double_dmg": "DAÑO DUPLICADO",
            "triple_title": "TRIPLE (3B) 🔥",
            "triple_dmg": "DAÑO TRIPLICADO",
            "hr_title": "¡JONRÓN! 🚀💥",
            "hr_dmg": "¡DAÑO CRÍTICO MASIVO!",
            "steal_title": "¡ROBO DE BASE! 🏃⚡",
            "steal_dmg": "PITCHER DEBUFF: +20% DAÑO RECIBIDO",
            "ko_title": "¡K.O. AL LANZADOR! 💥",
            "ko_dmg": "¡PITCHER RIVAL DERROTADO!"
      },
      "card_popup": {
            "swap_pos_title": "CAMBIAR POSICIÓN EN EL CAMPO:",
            "swap_pos_desc": "Intercambia la posición defensiva de <b>{{name}}</b> con otro titular. <span style=\"color:#00ff66;\">(NO altera tu orden al bate)</span>.",
            "tag_current": " (Actual)",
            "tag_native": " (Nativa ⭐ 100% Def)",
            "tag_secondary": " (Secundaria 🛡️ 85% Def)",
            "tag_out_pos": " (Fuera Pos ⚠️ 50% Def)"
      },
      "train_plans": {
            "con_label": "Práctica de Contacto",
            "con_desc": "Aumenta permanentemente el Contacto por +6.",
            "pwr_label": "Entrenamiento de Fuerza",
            "pwr_desc": "Aumenta la Fuerza del jugador por +6.",
            "spd_label": "Carreras de Velocidad",
            "spd_desc": "Aumenta la Velocidad del jugador por +6.",
            "def_label": "Ejercicios de Guante",
            "def_desc": "Sube la Defensa del jugador por +6.",
            "sta_label": "Acondicionamiento Físico",
            "sta_desc": "Recupera +35 de Stamina y suma +5 de Stamina máxima."
      },
      "events": {
            "ev_cork_title": "Bates de Contrabando",
            "ev_cork_desc": "Un misterioso comerciante te ofrece bates modificados con corcho. Aumentará la potencia de tu equipo, pero afectará el contacto de la bola.",
            "ev_cork_choice1": "Modificar bates (+15 Fuerza, -4 Contacto a todo el equipo)",
            "ev_cork_choice2": "Rechazar oferta (No hacer nada)",
            "ev_fitness_title": "Preparador Físico Retro",
            "ev_fitness_desc": "Un entrenador físico del campeonato de 1982 se ofrece a coordinar una rutina de acondicionamiento intensa para tu alineación.",
            "ev_fitness_choice1": "Rutina cardiovascular (+40 Stamina a toda la alineación)",
            "ev_fitness_choice2": "Continuar sin entrenar",
            "ev_cryo_title": "Cápsula de Hidroterapia",
            "ev_cryo_desc": "Instalas una cámara de recuperación avanzada en el vestuario. Cura a todo el equipo al instante, pero es costosa.",
            "ev_cryo_choice1": "Criogenización (Recupera 100% de Stamina a todos)",
            "ev_cryo_choice2": "Prescindir de la cámara",
            "ev_pinetar_title": "Brea de Pino Japonesa",
            "ev_pinetar_desc": "Consigues un tarro de brea especial que mejora el agarre del bate, afinando el contacto.",
            "ev_pinetar_choice1": "Comprar brea (+8 Contacto global a todo el equipo)",
            "ev_pinetar_choice2": "Seguir igual",
            "ev_bribe_title": "Cazatalento en Apuros",
            "ev_bribe_desc": "Un caza-talentos te ofrece dinero del presupuesto del equipo rival a cambio de canjear un poco de enfoque deportivo.",
            "ev_bribe_choice1": "Aceptar dinero (Ganas +$45 presupuesto, pero pierdes -5 Disciplina/Eye global)",
            "ev_bribe_choice2": "Denunciarlo al comisionado (Ganas +8 Disciplina/Eye global en tu equipo)"
      },
      "train": {
            "title": "<i class=\"fa-solid fa-dumbbell\"></i> Jaula de Bateo / Bullpen",
            "desc": "Entrena las facultades de un jugador específico para subir sus stats base de forma permanente.",
            "select_player": "Selecciona un Jugador:",
            "confirm_btn": "<i class=\"fa-solid fa-medal\"></i> Iniciar Entrenamiento",
            "back_btn": "<i class=\"fa-solid fa-arrow-left\"></i> Volver al Mapa"
      },
      "rest": {
            "title": "<i class=\"fa-solid fa-couch\"></i> Casa Club (Descanso)",
            "desc": "Un merecido descanso en la temporada. La fatiga acumulada en los partidos reduce el rendimiento de los jugadores.",
            "heal_title": "Descanso Completo",
            "heal_desc": "Recupera +40 de energía/estamina para todos los jugadores activos y del banquillo.",
            "heal_btn": "<i class=\"fa-solid fa-heart-pulse\"></i> Dormir y Recuperar",
            "sponsor_title": "Firma de Patrocinador",
            "sponsor_desc": "Recibe una bonificación económica directa de +$25 para gastar en las tiendas.",
            "sponsor_btn": "<i class=\"fa-solid fa-circle-dollar-to-slot\"></i> Cobrar Patrocinio",
            "badge_restore": "¡RESTAURACIÓN!",
            "stamina": {
                  "desc": "Toda tu plantilla activa recupera +40 de Stamina para los próximos encuentros."
            },
            "badge_bonus": "¡BONIFICACIÓN!",
            "money": {
                  "desc": "Tu club recibe una inyección económica de los patrocinadores locales."
            }
      },
      "event": {
            "title": "<i class=\"fa-solid fa-clipboard-question\"></i> Oficina del Mánager",
            "desc": "Toma una decisión crítica para el club. Cada elección tiene repercusiones en el presupuesto, salud o estadísticas del equipo.",
            "placeholder_title": "EVENTO ESPECIAL DE CLUBHOUSE",
            "placeholder_desc": "Oportunidad táctica en el vestuario."
      },
      "gameover": {
            "title": "¡Fin de la Carrera!",
            "history_title": "<i class=\"fa-solid fa-clock-rotate-left\"></i> Resumen de Temporada",
            "replay_title": "¿Listo para otra temporada?",
            "replay_desc": "Selecciona una nueva leyenda inicial y recluta diferentes plantillas para desbloquear otras sinergias históricas.",
            "restart_btn": "<i class=\"fa-solid fa-rotate-right\"></i> Jugar de Nuevo",
            "summary_btn": "<i class=\"fa-solid fa-chart-column\"></i> Ver Resumen Completo"
      },
      "pos": {
            "native": "✅ Nativo",
            "secondary": "⚡ Secundario (-{{pen}} DEF)",
            "out_of_pos": "⚠️ Fuera pos (-{{pen}} DEF)",
            "empty": "— VACÍO —",
            "empty_slot": "{{slot}} — VACÍO"
      },
      "headers": {
            "map": "<i class=\"fa-solid fa-map\"></i> Mapa del Campeonato",
            "pre_fight": "<i class=\"fa-solid fa-shield-halved\"></i> Preparación de la Serie",
            "match": "<i class=\"fa-solid fa-trophy\"></i> Bateadores al Combate",
            "event": "<i class=\"fa-solid fa-clipboard-question\"></i> Oficina del Mánager",
            "train": "<i class=\"fa-solid fa-dumbbell\"></i> Jaula de Bateo / Bullpen",
            "rest": "<i class=\"fa-solid fa-couch\"></i> Casa Club (Descanso)",
            "gameover": "¡Fin de la Carrera!",
            "synergies": "<i class=\"fa-solid fa-bolt\"></i> SINERGIAS",
            "draft": "<i class=\"fa-solid fa-file-signature\"></i> FIRMA DE JUGADORES"
      },
      "summary": {
            "title": "<i class=\"fa-solid fa-baseball\"></i> ESTADÍSTICAS COMPLETAS DE LA RUN",
            "tab_batters": "Mi Alineación (Bateo)",
            "tab_pitchers": "Lanzadores Enfrentados",
            "player_col": "Bateador",
            "pitcher_col": "Lanzador"
      },
      "victory": {
            "title": "¡CAMPEÓN ABSOLUTO DE BASEROGUE!",
            "desc": "¡Conquistaste la fase final y derrotaste a la Rotación Suprema de 4 Leyendas! Tu alineación pasa a la historia del béisbol roguelike.",
            "summary_btn": "<i class=\"fa-solid fa-chart-column\"></i> Ver Resumen de la Run",
            "replay_btn": "<i class=\"fa-solid fa-rotate-right\"></i> Jugar Nuevamente",
            "challenge162_hint_title": "🏆 ¿Le alcanza a este roster para el 162-0?",
            "challenge162_hint_desc": "Los jugadores y pitchers de esta run ya están desbloqueados para el 162-0 Challenge. Arma el equipo y prueba si aguanta una temporada completa.",
            "challenge162_hint_btn": "<i class=\"fa-solid fa-trophy\"></i> Probar en el 162-0 Challenge"
      },
      "sim": {
            "label_bb": "BASE POR BOLAS",
            "label_so": "PONCHE",
            "label_out": "OUT",
            "label_1b": "SENCILLO",
            "label_2b": "DOBLE",
            "label_3b": "TRIPLE",
            "label_hr": "JONRÓN",
            "bb_desc": "trabaja el conteo y saca pasaporte",
            "bb_run": "¡Carrera de caballito!",
            "bb_advance": "Avanza a primera.",
            "pitcher_dmg_txt": "sufre {{dmg}} HP de daño",
            "steal_label": "¡ROBO DE BASE!",
            "steal_desc": "se roba la segunda base",
            "debuff_turn_s": "impacto restante",
            "debuff_turns_p": "impactos restantes",
            "debuff_note": "Debuff de +20% daño",
            "extra_dmg_pitcher": "daño extra al lanzador",
            "clutch_desc": "batea en momento decisivo",
            "clutch_reason_both": "última entrada con corredores en posición de anotar",
            "clutch_reason_inning": "última entrada",
            "clutch_reason_runners": "corredores en posición de anotar",
            "so_pitcher_verb": "poncha a {{batter}}",
            "so_direct_dmg": "Daño directo: -{{dmg}} HP del equipo (¡ignora el escudo!)",
            "hp_remaining": "HP restante: {{hp}}/100",
            "streak_label": "RACHA ×{{count}} (-{{dmg}} HP!)",
            "out_ground": "saca un rodado por el cuadro para out",
            "out_fly": "conecta un elevado al jardín para out de rutina",
            "out_line": "línea quemante atrapada en el aire",
            "out_dmg_label": "Escudo -{{shield}} HP | Team HP -{{hp}} HP",
            "shield_status": "Escudo: {{shield}}/{{max}} | HP: {{hp}}/100",
            "runs_scored": "Anotan {{runs}} carreras. {{pitcher}} sufre {{dmg}} HP de daño",
            "hr_desc": "CUADRANGULAR de {{runs}} carreras",
            "3b_desc": "triple al rincón",
            "2b_desc": "línea violenta por la raya",
            "1b_desc": "imparable raso",
            "spd_upgrade": "⚡ SPD Proc (Grado {{grade}}): ¡{{from}} convertido en {{to}}!",
            "spd_stretch_2b": "conecta batazo y estira a SEGUNDA BASE con velocidad (Grado {{grade}})",
            "spd_stretch_3b": "conecta batazo y estira a TERCERA BASE con velocidad (Grado {{grade}})",
            "inning_end": "--- FIN DE LA ENTRADA {{inning}} ({{runs}} carreras anotadas) ---",
            "match_timeout": "⏱ FIN DE PARTIDO (3 innings). Te faltaron {{remaining}} lanzadores por derrotar.",
            "syn_moneyball_bb": "📊 Moneyball: ¡Boleto paciente inflige +{{extra}} daño!",
            "syn_moneyball_fatigue": "📊 Moneyball: ¡Fatiga al lanzador! Debuff de +20% daño ({{turns}} impactos restantes).",
            "syn_moneyball_so_t3": "📊 Moneyball: ¡Ponche absorbido por el Escudo (ignora daño directo a vida)!",
            "syn_moneyball_so_t4": "📊 Moneyball: ¡Ponche mitigado (-50%) y absorbido por el Escudo!",
            "syn_tto_bb": "🚀 Three True Outcomes: ¡Boleto optimizado inflige +{{extra}} daño!",
            "syn_tto_hr_debuff": "🚀 Three True Outcomes: ¡Jonrón debilita al lanzador por {{turns}} impactos (+30% daño)!",
            "syn_tto_so": "🚀 Three True Outcomes: Ponche causa -50% daño HP",
            "syn_tto_so_zero": "🚀 Three True Outcomes: ¡Ponche anulado (0 daño al equipo)!",
            "syn_fivetool_hit": "🌟 Five-Tool: ¡Batazo integral inflige +{{extra}} daño!",
            "syn_fivetool_out": "🔋 Five-Tool: ¡OUT recupera +{{amt}} de Stamina a todos!",
            "syn_fivetool_immune": "🔋 Five-Tool: ¡{{name}} es inmune al desgaste de Stamina de este partido!",
            "syn_bash_sacfly": "💪 Bash Brothers Sac Fly: ¡Corredor en 3B anota carrera!",
            "syn_bash_hr": "💪 Bash Brothers: ¡Jonrón nuclear inflige +{{extra}} daño!",
            "syn_bash_hr_heal": "💪 Bash Brothers: ¡Jonrón recupera +{{amt}} Stamina a todos!",
            "syn_liveball_upgrade": "🔥 Liveball Sluggers: ¡Doble convertido en Triple!",
            "syn_liveball_upgrade_hr": "🔥 Liveball Sluggers: ¡Triple convertido en Jonrón!",
            "syn_liveball_dmg": "🔥 Liveball Sluggers: +{{extra}} daño.",
            "syn_genesis_advance": "💥 Genesis Chaos: ¡Batazo agresivo! +{{dmg}} daño y avance de base adicional.",
            "syn_deadball_1b": "⏳ Small Ball: ¡Sencillo colocado inflige +{{extra}} daño!",
            "syn_deadball_run": "⏳ Small Ball: ¡Manufactura de {{runs}} carrera(s) inflige +{{bonus}} daño de impacto!",
            "syn_smallball": "⏳ Small Ball: ¡Avanzan 2 bases en sencillo!",
            "syn_bighair": "Sinergia Big Hair",
            "syn_bighair_glove": "🛼 AstroTurf: ¡Guante de Oro reduce daño de out en -50%!",
            "def_success_title": "¡JUGADA DE GUANTE DE ORO!",
            "def_success_desc": "completa una atrapada sensacional (Dado: {{roll}}/{{thresh}})",
            "def_success_reward": "¡Recuperas +30 HP y +15 de Escudo!",
            "def_fail_title": "¡BATAZO RIVAL / ERROR!",
            "def_fail_desc": "no logra fildear el batazo rival (Dado: {{roll}}/{{thresh}})",
            "def_fail_penalty": "¡Sufres -{{dmg}} de daño!",
            "def_title_c": "¡INTENTO DE ROBO EN SEGUNDA BASE!",
            "def_desc_c": "El corredor rival despega a toda velocidad hacia 2B. Tu receptor se para y dispara un misil a la almohadilla.",
            "def_title_1b": "¡LÍNEA RASANTE POR LA RAYA DE PRIMERA!",
            "def_desc_1b": "Batazo violento que busca internarse en el rincón derecho. Tu inicialista se tiende de cabeza para cortar.",
            "def_title_2b": "¡ROLETASO CON OJOS POR EL MEDIO DEL CAMPO!",
            "def_desc_2b": "Batazo colocado detrás de la segunda almohadilla. Tu camarero corre, fildea en giro y dispara a primera.",
            "def_title_3b": "¡LÍNEA CANDENTE EN LA ESQUINA CALIENTE!",
            "def_desc_3b": "Misil quemante pegado a la raya de cal de tercera. Reflejos puros para evitar el extrabase.",
            "def_title_ss": "¡ROBANDO EL HIT EN EL HUECO DEL SS!",
            "def_desc_ss": "Fuerte roletazo entre tercera y el campocorto. Tu torpedero se desliza en el pasto y mete el guante.",
            "def_title_lf": "¡ELEVADO CORTO POR LA ZONA DE FAUL!",
            "def_desc_lf": "Batazo peligroso contra la baranda del jardín izquierdo. Tu jardinero corre arriesgando el físico.",
            "def_title_cf": "¡BATAZO PROFUNDO AL PIE DE LA PARED!",
            "def_desc_cf": "Conexión enorme que amenaza con bañarlo. Tu jardinero central mide la pared y salta en lo más alto.",
            "def_title_rf": "¡LÍNEA CORTADA CONTRA EL MURO DERECHO!",
            "def_desc_rf": "Fuerte conexión que dobla hacia el poste. Tu guardabosque derecho corta la trayectoria de aire.",
            "def_ball_c": "Lanzamiento descontrolado / Intento de robo",
            "def_ball_1b": "Línea quemante por la raya de 1B",
            "def_ball_2b": "Roletazo colocado detrás de 2B",
            "def_ball_3b": "Misil a la esquina caliente",
            "def_ball_ss": "Roletazo duro en el hueco de SS",
            "def_ball_lf": "Línea tendida al jardín izquierdo",
            "def_ball_cf": "Batazo profundo al callejón",
            "def_ball_rf": "Línea con efecto al rincón derecho",
            "def_badge": "🛡️ BAJA DEL INNING {{inning}} • PRUEBA DEFENSIVA",
            "def_radar_field_title": "RADAR DE CAMPO • SECTOR DEFENSIVO",
            "def_speed_label": "VELOCIDAD",
            "def_zone_label": "ZONA",
            "def_catch_zone": "ZONA DE ATRAPADA",
            "def_error_zone": "ERROR",
            "def_safe_tactic_title": "🛡️ JUGADA REGULAR",
            "def_safe_tactic_desc": "Asegurar el guante (Meta estándar • +30 HP)",
            "def_clutch_tactic_title": "⚡ JUGADA DE LUJO",
            "def_clutch_tactic_desc": "Tirarse de cabeza (-12% Meta • +40 HP & +25 Escudo)",
            "def_safe_name": "🛡️ Jugada Regular",
            "def_clutch_name": "⚡ Jugada de Lujo",
            "def_roll_btn": "🧤 ¡EJECUTAR JUGADA DEFENSIVA!",
            "def_rolling": "⚾ ¡FILDEANDO EN EL CAMPO...!",
            "def_stat_total": "Defensa Total:",
            "def_grade_label": "Grado",
            "def_hit_type": "Batazo:",
            "def_target_meta": "Meta de Atrapada:",
            "def_d100_range": "Dado 1 al {{thresh}}",
            "def_gold_glove_badge": "🥇 GUANTE DE ORO",
            "def_oop_badge": "⚠️ (Fuera de Posición -35% DEF)",
            "def_strategy_label": "Estrategia:",
            "def_roll_label": "Dado:",
            "def_target_label": "Meta:",
            "def_gain_success": "🟢 ¡GANASTE +{{hp}} HP Y +{{shield}} ESCUDO!",
            "def_loss_fail": "🔴 ¡PERDISTE -{{dmg}} DE DAÑO! (Escudo: -{{shieldDmg}} • HP: -{{hpDmg}})",
            "def_team_status": "Equipo: HP {{hp}}/100 • Escudo {{shield}}/{{shieldMax}}",
            "def_success_banner_title": "🥇 ¡JUGADA DE GUANTE DE ORO!",
            "def_fail_banner_title": "⚠️ ¡BATAZO DE HIT / ERROR DEFENSIVO!",
            "def_success_banner_desc": "¡Atrapada limpia en el diamante! Recuperas vida y escudo para el equipo.",
            "def_fail_banner_desc": "¡El batazo superó al defensor! El equipo recibe daño de impacto.",
            "def_continue": "⚾ CONTINUAR AL INNING {{nextInning}}",
            "def_safe_btn_label": "🧤 ¡ASEGURAR EL GUANTE! (Dado 1 al {{thresh}})",
            "def_clutch_btn_label": "⚡ ¡TIRARSE DE CABEZA! (Dado 1 al {{thresh}})",
            "syn_expansion": "Sinergia Expansión"
      },
      "syn": {
            "deadball": {
                  "lv1": "Deadball: 20% prob en hit sencillo de avanzar 2 bases.",
                  "lv2": "Deadball: 40% prob en hit sencillo de avanzar 2 bases."
            },
            "golden": {
                  "lv1": "Golden Era: Todos los hits hacen +6 daño adicional.",
                  "lv2": "Golden Era: Hits +12 daño; 30% de convertir 2B en 3B."
            },
            "integration": {
                  "lv1": "Integración: Jugador obtiene +4 a todos sus stats en turno.",
                  "lv2": "Integración: Bateador +8 stats; outs curan +5 Stamina."
            },
            "expansion": {
                  "lv1": "Expansion: 50% robo en 1B; robo cura +10 Stamina.",
                  "lv2": "Expansion: 80% robo; robo cura +20 y hace 10 daño."
            },
            "bighair": {
                  "lv1": "Big Hair: Robos exitosos hacen +15 daño al lanzador.",
                  "lv2": "Big Hair: Robos +30 daño y debuff de 3 turnos al rival."
            },
            "steroid": {
                  "lv1": "Bash Brothers: Jonrones (HR) hacen +20 daño adicional.",
                  "lv2": "Bash Brothers: HR hacen +40 daño; 50% fly sac anotador."
            },
            "efficiency": {
                  "lv1": "Moneyball: Bases por bolas (BB) hacen +15 daño extra.",
                  "lv2": "Moneyball: BB hacen +25 daño; al embasarte fatigas al rival 1 impacto (+20% daño)."
            },
            "modern": {
                  "lv1": "Three True Outcomes: BB hacen 15 daño, Ponche -50% daño al equipo.",
                  "lv2": "Three True Outcomes: BB hacen 24 daño, Ponche -50% y no corta racha."
            }
      },
      "game": {
            "super_boss_trigger": "⚡ ¡SUPER BOSS FIGHT! ⚡ ¡Derrotaste al primer grupo de leyendas! AHORA ENFRENTA A LA ROTACIÓN SUPREMA DE 4 LEYENDAS.",
            "true_victory": "🏆 ¡CAMPEÓN ABSOLUTO! ¡Derrotaste a la Rotación Suprema de 4 Leyendas! BaseRogue conquistado.",
            "boss_victory_trait": "¡Victoria de Jefe! +${{earnings}}. Elige una Trait Pasiva de Leyenda.",
            "boss_win_msg": "¡Victoria! Derrotaste al JEFE {{name}}. ¡+${{earnings}} y recompensa de élite!",
            "win_msg": "¡Victoria! Derrotaste a la rotación de {{name}} en 3 innings. ¡+${{earnings}}!",
            "defeat_msg": "Derrota. Finalizaron los 3 innings (9 outs) antes de derrotar a toda la rotación de {{name}}.",
            "champion_eternal": "🏆 ¡CAMPEÓN DE LA ETERNIDAD! Conquistaste la Serie Mundial y ganaste los Playoffs.",
            "lineup_full": "Alineación ocupada. Elige a quién reemplazar.",
            "division_defeated": "¡DIVISIÓN SUPERADA!",
            "player_placed_dh": "{{name}} asignado como Bateador Designado (DH)",
            "player_placed_native": "{{name}} asignado en su posición natural ({{pos}})"
      },
      "training": {
            "con": {
                  "label": "🎯 Sesión de Contacto Estándar",
                  "desc": "Práctica intensiva de swing. +5 a +7 Contacto garantizado (15% prob. de ¡Crítico +12!)."
            },
            "pwr": {
                  "label": "💪 Entrenamiento de Poder",
                  "desc": "Repeticiones con bate pesado. +5 a +7 Fuerza garantizada (15% prob. de ¡Crítico +12!)."
            },
            "spd": {
                  "label": "⚡ Aceleración en Bases",
                  "desc": "Trabajo de aceleración en bases. +5 a +7 Velocidad (15% prob. de ¡Crítico +12!)."
            },
            "def": {
                  "label": "🛡️ Técnica Defensiva",
                  "desc": "Ejercicios de fildeo y tiro. +5 a +7 Defensa (15% prob. de ¡Crítico +12!)."
            },
            "sta": {
                  "label": "🔋 Recuperación Físico-Biológica",
                  "desc": "Masajes y descanso activo. +35 a +45 Stamina (20% prob. de ¡Recuperación 100%!)."
            },
            "risk": {
                  "label": "🔥 Entrenamiento Extremo de Poder",
                  "desc": "Levantamiento súper-pesado. +12 a +14 PWR si resulta. 30% riesgo de tirón muscular (-15 Stamina)."
            },
            "badge_fail": "¡SOBRECARGA MUSCULAR!",
            "badge_crit": "¡CRÍTICO {{label}}! 💥",
            "badge_ok": "¡ENTRENAMIENTO {{label}}!",
            "result_fail": "El entrenamiento fue demasiado intenso y provocó fatiga en {{name}}.",
            "result_crit": "¡Extraordinario desempeño! {{name}} tuvo una sesión de nivel {{label}} e incrementó +{{val}} en su estadística.",
            "result_ok": "{{name}} completó la rutina {{label}} con éxito."
      },
      "ev": {
            "cork": {
                  "title": "Bate con Corcho",
                  "desc": "Te ofrecen bates alterados con centro de corcho para aumentar la velocidad del swing.",
                  "choice1": "Usar bate legal",
                  "suc": "¡Conexiones supersónicas! Extra potencia en cada turno.",
                  "fail": "¡El bate se partió en dos! Multa y suspensión.",
                  "choice2": "Bate con Corcho Oculto (ALTO RIESGO)",
                  "choice3": "Rechazar oferta"
            },
            "signs": {
                  "title": "El Espía de Señas",
                  "desc": "Un ex-receptor retirado afirma conocer la secuencia secreta de lanzamientos de los pitchers rivales.",
                  "choice1": "Comprar Informe VIP (+15 EYE, +8 CON)",
                  "choice2": "Robo de Señas Callejero (+20 EYE)",
                  "suc": "¡Señas interceptadas! Tu equipo obtiene +20 EYE (Disciplina).",
                  "fail": "¡Descubiertos en cámara! El comisionado sanciona al equipo con -$15 Presupuesto."
            },
            "fitness": {
                  "title": "Preparador Físico Retro",
                  "desc": "Un legendario preparador físico del campeonato de 1982 se ofrece a coordinar una rutina de acondicionamiento.",
                  "choice1": "Rutina Aeróbica Estándar (+40 Stamina a todos)",
                  "choice2": "Acondicionamiento Extremo (100% Stamina)",
                  "suc": "¡Sesión milagrosa! Toda la plantilla recupera el 100% de Stamina.",
                  "fail": "¡Sobrecarga muscular masiva! El equipo se agota y pierde -15 Stamina."
            },
            "hyp": {
                  "title": "Sesión de Hipnosis Deportiva",
                  "desc": "Un especialista en psicología ofrece terapia de concentración mental.",
                  "choice1": "Charla Motivacional",
                  "suc": "¡Enfoque absoluto! Visión láser en la zona de strike.",
                  "fail": "¡Confusión mental! Los bateadores pierden sincronización.",
                  "choice2": "Trance de Hipnosis Profunda (RIESGO)",
                  "choice3": "No participar"
            },
            "graphene": {
                  "title": "Bates de Aleación Experimental",
                  "desc": "Un laboratorio tecnológico propone probar bates de fibra de carbono y titanio para el próximo tramo del mapa.",
                  "choice3": "Pasar de la tecnología",
                  "fail": "¡El bate se astilló! Sanción del comisionado y penalidad de estadísticas.",
                  "choice1": "Comprar Modelo Homologado (-$20)",
                  "choice2": "Prototipo Hyper-Carbon (ALTO RIESGO)",
                  "suc": "¡Poder devastador! Tus bateadores conectan con fuerza descomunal."
            },
            "tabloid": {
                  "title": "Prensa Sensacionalista",
                  "desc": "Un importante periódico deportivo busca una entrevista exclusiva con la estrella de tu equipo.",
                  "suc": "¡Entrevista vendida con éxito! Gran inyección de presupuesto.",
                  "fail": "¡El artículo desató polémica en el vestuario! Caída de moral.",
                  "choice3": "Cerrar las Puertas a la Prensa",
                  "choice1": "Vender Exclusiva (+$$ • RIESGO)",
                  "choice2": "Conferencia de Prensa Oficial"
            },
            "cryo": {
                  "title": "Cápsula de Hidroterapia y Criogenia",
                  "desc": "Instalas una cámara de crioterapia de última generación en el clubhouse.",
                  "choice1": "Criogenización Experimental (ALTO RIESGO)",
                  "choice2": "Bañera de Hielo Rápida",
                  "choice3": "Prescindir de la cámara",
                  "suc": "¡Sesión perfecta! Todo el equipo recupera energía al máximo.",
                  "fail": "¡Choque térmico! La congelación muscular provoca fatiga en el plantel."
            },
            "pinetar": {
                  "title": "Brea de Pino Japonesa Especial",
                  "desc": "Un distribuidor ofrece resina de agarre mejorado para los bates.",
                  "choice2": "Fórmula Casera Ultra-Pegajosa (RIESGO)",
                  "fail": "¡El umpire nota el exceso de brea! Amonestación y penalidad.",
                  "choice1": "Brea de Grado Profesional (-$15)",
                  "choice3": "Seguir igual",
                  "suc": "¡Agarre extraordinario! Aumento inmediato en el control de swing."
            },
            "spikes": {
                  "title": "Clavos Ligeros Experimentales",
                  "desc": "Un fabricante local te ofrece calzado ultraligero para correr las bases.",
                  "fail": "¡Mala tracción! Los spikes se rompieron provocando tropiezos.",
                  "choice1": "Equipar Calzado Profesional (-$15)",
                  "choice2": "Prototipo de Clavos de Titanio (RIESGO)",
                  "choice3": "Mantener calzado actual",
                  "suc": "¡Velocidad explosiva! El equipo vuela en las almohadillas."
            },
            "gloves": {
                  "title": "Guantes de Piel Curtida Especial",
                  "desc": "Un coleccionista ofrece guantes de cuero de primera calidad para tu cuadro.",
                  "choice1": "Comprar Guantes Legendarios (-$25)",
                  "choice2": "Guante de Prototipo Rápido (RIESGO)",
                  "choice3": "Conservar guantes actuales",
                  "suc": "¡Ajuste perfecto! La defensa del equipo se vuelve impenetrable.",
                  "fail": "¡El cuero se raja en pleno juego! Errores defensivos costosos."
            },
            "choice_reject": "Rechazar Oferta (No hacer nada)",
            "choice_clean": "Jugar Limpio (Rechazar)",
            "choice_skip": "Continuar sin entrenar",
            "choice_reject_therapy": "Rechazar Psicoterapia",
            "badge_risk_success": "¡ÉXITO EN LA JUGADA!",
            "badge_taken": "¡DECISIÓN TOMADA!",
            "generic_success": "¡La decisión rindió grandes frutos para el equipo!",
            "generic_fail": "La opción arriesgada no salió como esperabas.",
            "bribe": {
                  "title": "Cazatalentos en Apuros",
                  "desc": "Un cazatalentos te ofrece informes confidenciales sobre la rotación rival a cambio de un pago.",
                  "choice1": "Denunciarlo al Comisionado",
                  "choice2": "Trato Bajo la Mesa (+$ • RIESGO)",
                  "choice3": "Ignorar la llamada",
                  "suc": "¡Trato cerrado sin sospechas! Obtienes ventajas clave.",
                  "fail": "¡Te descubrieron! La liga impone una fuerte multa económica."
            }
      },
      "sign": {
            "chemistry_active": "Firma activa Química de <strong>{{team}}</strong> (+4 stats)",
            "dynasty_active": "Firma activa Dinastía de <strong>{{team}}</strong> (+10 stats)"
      },
      "ui": {
            "empty": "VACÍO",
            "autosort_tooltip": "Ordena lógicamente: Velocidad al 1ro, Poder al 4to, Mejores bates al 2do y 3ro.",
            "sec_pos_tooltip": "Posición Secundaria",
            "trait_choose_desc": "Elige una Trait Pasiva que acompañará a tu equipo hasta el final de la run:",
            "super_boss_desc": "¡Pero las 4 Máximas Leyendas del Béisbol saltan al campo para la Batalla Final!",
            "hp_restored": "Tu equipo ha recuperado +30 HP y Escudo Máximo.",
            "active_traits_header": "RASGOS ACTIVOS DEL EQUIPO",
            "trait_pick_btn": "EQUIPAR RASGO",
            "super_boss_fight_btn": "⚔️ ¡ENFRENTAR AL SUPER BOSS!",
            "super_boss_defeated_first_group": "¡FASE 1 COMPLETADA! El Super Boss invoca a sus relevistas legendarios.",
            "super_boss_final_phase_html": "⚡ <strong>¡FASE FINAL!</strong> Derrota al cerrador estelar para ganar la run."
      },
      "trait": {
            "eagle": {
                  "name": "🦅 Paciencia de Águila",
                  "desc": "Zona de Boleto (BB) aumenta +3 puntos. Cada BB regenera +5 Stamina al bateador."
            },
            "slugger": {
                  "name": "💥 Impulso de Jonronero",
                  "desc": "Cada HR inflige +30 HP de daño extra al pitcher rival."
            },
            "surgical": {
                  "name": "🎯 Contacto Quirúrgico",
                  "desc": "Zona de Ponche (SO) reducida en -3 puntos para toda la alineación."
            },
            "speed": {
                  "name": "⚡ Velocistas Agresivos",
                  "desc": "Jugadores con SPD > 60 roban la base automáticamente en sencillos y boletos. Debuff al pitcher dura 3 impactos."
            },
            "extrabase": {
                  "name": "💣 Impacto Acumulado",
                  "desc": "Batazos de extra bases (2B, 3B, HR) infligen +10 HP de daño adicional al pitcher."
            },
            "shield": {
                  "name": "🛡️ Escudo de Hierro",
                  "desc": "El Escudo absorbe 75% del DEF promedio del roster (en lugar de 50%). Regenera +5 al inicio de cada entrada."
            },
            "wall": {
                  "name": "🧱 Muro Defensivo",
                  "desc": "Outs normales reducen HP del equipo en 8 en lugar de 12."
            },
            "stamina": {
                  "name": "🔋 Resistencia Inagotable",
                  "desc": "Los bateadores solo pierden 6 de Stamina por partido (en lugar de 12)."
            },
            "clutch": {
                  "name": "❤️ Resiliencia de Leyendas",
                  "desc": "Si Team HP cae por debajo de 35, activa estado Clutch: +15 a CON, PWR, EYE, SPD, DEF para toda la alineación."
            },
            "glove": {
                  "name": "🧤 Guantelete Dorado",
                  "desc": "Todos los bateadores reciben +10 DEF, aumentando la capacidad del Escudo de equipo."
            },
            "secondary": {
                  "name": "🔄 Posición Secundaria Maestra",
                  "desc": "Elimina la penalización (-15%) al colocar bateadores en su Posición Secundaria."
            },
            "era_acc": {
                  "name": "⏳ Sinergia de Era Acelerada",
                  "desc": "Solo necesitas 2 jugadores de la misma Era para activar la Sinergia de Nivel 2 (normalmente 4)."
            },
            "elite": {
                  "name": "💼 Negociador de Élite",
                  "desc": "Obtienes +$10 de presupuesto extra tras cada victoria."
            },
            "scout": {
                  "name": "🌟 Ojo de Cazatalentos",
                  "desc": "Las ofertas de draft muestran 4 jugadores en lugar de 3 y aumenta probabilidad de Epic/Legendary."
            },
            "veteran": {
                  "name": "🔋 Segunda Vida",
                  "desc": "Tu alineación completa recupera un +30% de Stamina al inicio de cada nuevo mapa."
            },
            "reliever": {
                  "name": "🔥 Emboscada al Relevista",
                  "desc": "El primer batazo contra un nuevo pitcher rival inflige +50% de daño extra."
            },
            "pressure": {
                  "name": "📈 Presión Temprana",
                  "desc": "El primer bateador de cada entrada gana +20 de CON y EYE para ese turno."
            },
            "ghost": {
                  "name": "🏃 Corredores Fantasma",
                  "desc": "Inicias la 3ª entrada de cada partido con un corredor en 2ª base automáticamente."
            },
            "legendary": {
                  "name": "👑 Dominio Legendario",
                  "desc": "Si tienes 2 o más jugadores Legendary en titular, todos reciben +10 a todas sus estadísticas."
            },
            "back2back": {
                  "name": "💥 Cadena de Poder",
                  "desc": "Después de un HR, el siguiente bateador gana +20 de PWR y CON para ese turno."
            }
      },
      "dex": {
            "era_all": "TODOS",
            "locked": "BLOQUEADO",
            "search_placeholder": "Buscar por nombre, equipo o posición (C, 1B, SS...)...",
            "search_placeholder_pitchers": "Buscar lanzador por nombre, equipo, era o rol (SP/RP)...",
            "tab_legends": "⚾ LEYENDAS / BATEADORES",
            "tab_opponents": "🥊 OPONENTES (PARTIDA RÁPIDA)",
            "pos_label": "POS:",
            "role_label": "ROL:",
            "pos_all": "TODOS",
            "counter_legends": "Cartas Descubiertas",
            "counter_opponents": "Oponentes Enfrentados",
            "franchise_hist": "Franquicia Histórica",
            "franchise_nlb": "Ligas Negras",
            "load_more": "Mostrar más",
            "counter": "{{unlocked}} / {{total}} descubiertos ({{pct}}%)",
            "career_header": "CARRERA / CAREER (MLB)",
            "war_label": "WAR",
            "challenge162_filter": "🏆 Solo elegibles para el 162-0 Challenge",
            "challenge162_badge_tooltip": "Elegible para el 162-0 Challenge",
            "challenge162_badge_label": "🏆 162-0 CHALLENGE",
            "allstars_label": "All-Star",
            "cy_label": "Cy Young",
            "gg_label": "Guante de Oro",
            "mvp_label": "MVP",
            "rel_label": "Relevista del Año",
            "roy_label": "Novato del Año",
            "ss_label": "Bate de Plata"
      },
      "challenge162": {
            "title": "🏆 162-0 CHALLENGE",
            "subtitle": "¿Podrás lograr la temporada perfecta de 162-0 con tu colección de cartas?",
            "rule_1": "1. Arma tu rotación (5 SP + 3 RP) y tu alineación titular (9 bateadores con DH).",
            "rule_2": "2. Simula los 162 partidos de la temporada regular contra franquicias históricas.",
            "rule_3": "3. ¡Termina con 10 derrotas o menos (o ve 162-0 perfecto) para clasificar a los Playoffs y ganar la Serie Mundial!",
            "btn_start_draft": "🚀 ARMAR ROSTER",
            "btn_continue": "▶ CONTINUAR TEMPORADA",
            "btn_reset": "🔄 REINICIAR RETO",
            "builder_title": "CONSTRUYE TU EQUIPO",
            "builder_batters": "BATEADORES TITULARES (9)",
            "builder_sp": "ROTACIÓN DE ABRIDORES (5 SP)",
            "builder_rp": "BULLPEN DE RELEVISTAS (3 RP)",
            "builder_pool": "COLECCIÓN DESBLOQUEADA",
            "builder_search": "Buscar en tu colección...",
            "builder_autofill": "⚡ Auto-completar equipo",
            "builder_start_season": "⚾ EMPEZAR TEMPORADA 162-0",
            "builder_empty_slot": "(Vacío)",
            "season_next_game": "Próximo partido",
            "season_vs": "vs",
            "season_rival_sp": "ABRIDOR RIVAL",
            "season_sim_1": "▶ SIMULAR 1 PARTIDO",
            "season_sim_10": "⏩ SIMULAR 10",
            "season_sim_until": "⏭ HASTA LA PRÓXIMA DERROTA",
            "season_perfect_title": "🏆 ¡TEMPORADA PERFECTA (162-0)! Playoffs desbloqueados.",
            "season_qualified_title": "🎉 ¡Playoffs desbloqueados! ({{wins}}-{{losses}})",
            "season_goto_playoffs": "▶ IR A PLAYOFFS",
            "season_lost_title": "Temporada terminada con {{losses}} derrota(s) — sin playoffs.",
            "season_missed_title": "Temporada terminada {{wins}}-{{losses}} — no alcanzó el corte de playoffs (máximo {{maxLosses}} derrotas).",
            "season_near_miss": "¡Tan cerca! Ajustá el roster e intentalo de nuevo.",
            "season_try_again": "Reforzá el roster e intentalo de nuevo.",
            "season_view_results": "VER RESULTADO FINAL",
            "season_streak": "RACHA DE {{streak}}",
            "season_batters_title": "BATEADORES",
            "season_pitchers_title": "LANZADORES",
            "season_recent_games": "ÚLTIMOS PARTIDOS",
            "season_no_games": "Todavía no has jugado ningún partido.",
            "season_title": "162-0 CHALLENGE",
            "season_regular": "TEMPORADA REGULAR",
            "season_games_count": "Juego {{current}} / {{total}}",
            "table_player": "JUGADOR",
            "game_counter": "Partido {{current}} / {{total}}",
            "hub_title": "162-0 CHALLENGE HUB",
            "hub_subtitle": "Elige tu formato de temporada regular y postemporada",
            "best_streak": "MEJOR RACHA",
            "world_series": "SERIES MUNDIALES",
            "seasons_played": "TEMPORADAS",
            "total_collection": "COLECCION TOTAL",
            "wins_count": "{{count}} VICTORIAS",
            "titles_count": "{{count}} TITULOS",
            "seasons_count": "{{count}} JUGADAS",
            "cards_count": "{{count}} CARTAS",
            "active_run": "TEMPORADA EN PROGRESO: {{mode}}",
            "current_record": "Record actual: {{wins}} - {{losses}} ({{current}}/{{total}} juegos)",
            "resume": "CONTINUAR",
            "abandon": "ABANDONAR",
            "abandon_confirm": "Seguro que deseas abandonar la temporada en progreso? Se perdera el avance actual.",
            "free_draft_badge": "COLECCION LIBRE",
            "all_star_title": "ALL-STAR DREAM TEAM",
            "all_star_desc": "Construye tu alineacion y cuerpo de pitcheo sin restricciones utilizando cualquier carta desbloqueada en tu coleccion.",
            "play_all_star": "JUGAR ALL-STAR",
            "mono_team_badge": "FRANQUICIA UNICA",
            "mono_team_title": "DESAFIO MONO-TEAM",
            "mono_team_desc": "Compite exclusivamente con peloteros que vistieron la camiseta del club seleccionado.",
            "play_with_team": "JUGAR CON {{code}}",
            "mono_era_badge": "EPOCA HISTORICA",
            "mono_era_title": "DESAFIO MONO-ERA",
            "mono_era_desc": "Viaja en el tiempo y compite unicamente con las estrellas de una de las 9 eras del beisbol.",
            "play_with_era": "JUGAR {{era}}",
            "autofill": "AUTO-COMPLETAR",
            "clear_roster": "VACIAR",
            "hub_btn": "HUB",
            "team_ovr": "OVR EQUIPO",
            "roster_count": "ROSTER",
            "choose_card_for": "ELEGIR CARTA PARA [{{slot}}]",
            "cards_available": "{{count}} cartas disponibles para esta posicion",
            "search_placeholder": "Buscar jugador por nombre o equipo...",
            "no_cards_found": "No se encontraron cartas desbloqueadas para la posicion [{{slot}}] en este modo.",
            "close": "CERRAR",
            "infield": "CUADRO / INFIELD",
            "outfield_dh": "JARDINES Y DESIGNADO / OUTFIELD & DH",
            "lineup_title": "ALINEACION TITULAR (LINEUP - 9 CARTAS)",
            "rotation_title": "ROTACION DE ABRIDORES (ROTATION - 5 CARTAS)",
            "bullpen_title": "CUERPO DE RELEVISTAS (BULLPEN - 3 CARTAS)",
            "start_season": "EMPEZAR TEMPORADA 162-0",
            "auto_sim_run": "PAUSAR AUTO SIM",
            "auto_sim_start": "AUTO SIM (1 A 1)",
            "main_menu": "MENU PRINCIPAL",
            "playoffs_title": "POSTEMPORADA DE BASEROGUE",
            "playoffs_subtitle": "3 Rondas a Partido Unico (Muerte Subita) · {{desc}}",
            "bracket_round": "RONDA {{round}}",
            "step_locked": "🔒 BLOQUEADA",
            "step_done": "✔ SUPERADA",
            "step_active": "⚔ EN DISPUTA",
            "your_team": "TU EQUIPO ({{wins}}-{{losses}})",
            "ace_pitcher": "As Abridor",
            "season_era": "ERA Temporada",
            "offensive_leader": "Lider Ofensivo",
            "roster_record": "Profundidad de Roster",
            "drafted_cards": "17 Cartas Drafteadas",
            "boss_difficulty": "Dificultad Boss",
            "stat_boost": "+{{boost}} a todas las stats",
            "rival_sp_hp": "Vida SP Rival",
            "extra_hp": "{{pct}}% extra",
            "offensive_danger": "Peligro Ofensivo",
            "play_playoff_btn": "🎲 DISPUTAR {{label}}! (PARTIDO A MUERTE)",
            "view_stats_table": "📊 VER TABLA DE STATS",
            "perfect_champion_title": "👑 TEMPORADA PERFECTA 162-0 & CAMPEON MUNDIAL!",
            "perfect_champion_desc": "🏆 162-0 REGULAR + 3-0 PLAYOFFS (165-0 INVICTO) · INMORTALIDAD LOGRADA!",
            "ws_champion_title": "🏆 CAMPEON DE LA SERIE MUNDIAL!",
            "ws_champion_desc": "👑 Alzaste el Trofeo ({{wins}}-{{losses}} Regular + 3-0 Playoffs)",
            "playoff_end_title": "FIN DE LA POSTEMPORADA",
            "playoff_end_desc": "Gran campana finalizada en: {{round}}",
            "regular_end_title": "TEMPORADA REGULAR FINALIZADA",
            "regular_end_desc": "Record: {{wins}}-{{losses}} (Minimo 100 victorias para clasificar)",
            "postseason_label": "POSTEMPORADA",
            "dynasty_status": "ESTATUS DINASTIA",
            "status_undefeated": "👑 INVICTO SUPREMO",
            "status_champion": "👑 CAMPEON MUNDIAL",
            "status_finalist": "🥈 FINALISTA",
            "status_contender": "⚾ CONTENDIENTE",
            "mvp_award": "🏆 MVP DE LA DINASTIA",
            "cy_young_award": "🧢 PREMIO CY YOUNG",
            "hr_king_award": "💣 REY DEL CUADRANGULAR",
            "reliever_award": "🔥 RELEVISTA DEL ANO",
            "ring_of_champions": "💍 PLANTILLA DE 17 CAMPEONES (ROSTER COMPLETO)",
            "new_challenge_btn": "🔄 EMPEZAR NUEVO CHALLENGE",
            "table_pitcher": "LANZADOR",
            "table_role": "ROL"
      },
      "badge": {
            "captain_tooltip": "Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.",
            "clutch_tooltip": "Clutch Player: +2% de probabilidad de sencillo y doble, +4% de HR con corredores en posición de anotar o durante la última entrada.",
            "challenge162_tooltip": "Elegible para el 162-0 Challenge: formó parte de un roster que ganó una run completa (Quick Play o Modo Historia).",
            "interera_label": "VIAJERO EN EL TIEMPO",
            "interera_tooltip": "Viajero en el tiempo: este jugador no estuvo activo durante la temporada seleccionada — cuenta doble para desbloquear la sinergia de su propia era."
      },
      "combat_info": {
            "title": "⚙️ DATOS DE DAÑO & VALORES",
            "out": "<strong style=\"color: #9ca3af;\">🤚 OUT (Flyout/Groundout):</strong> Resta <span style=\"color:#ef4444;font-weight:bold;\">-16 HP</span> al Escudo (al romperlo, resta a la vida).",
            "so": "<strong style=\"color: #ef4444;\">💨 PONCHE (SO):</strong> Resta <span style=\"color:#ef4444;font-weight:bold;\">-16 HP</span> directos a la vida (ignora escudo).<div style=\"font-size: 8.5px; color: #a855f7; margin-top: 2px;\">🔥 Racha: 1º (-16) • 2º (-22) • 3º+ (-28 HP)</div>",
            "pitcher_title": "<strong style=\"color: #10b981;\">⚾ DAÑO AL LANZADOR RIVAL:</strong>",
            "bb": "<span>🚶 BB: <b style=\"color:#3b82f6;\">10 HP</b></span>",
            "single": "<span>✅ 1B: <b style=\"color:#a7f3d0;\">15 HP</b></span>",
            "double": "<span>⚡ 2B: <b style=\"color:#10b981;\">30 HP</b></span>",
            "triple": "<span>🔥 3B: <b style=\"color:#06b6d4;\">45 HP</b></span>",
            "hr": "🚀 <strong>HR (Jonrón):</strong> <b style=\"color:#eab308;\">70 HP base</b>",
            "rbi_bonus": "🏆 <strong>Bonus RBI:</strong> Cada carrera impulsada añade <strong style=\"color:#00ff66;\">+10 HP extra</strong> de daño al pitcher.",
            "defense": "<strong style=\"color: #38bdf8;\">🛡️ DUELO DEFENSIVO (Baja de Entrada):</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">Éxito (20% + 0.70×DEF): <strong style=\"color:#4ade80;\">+30 HP & +15 Escudo</strong> • Fallo: <strong style=\"color:#f87171;\">-15 Daño</strong>.</div>",
            "steal": "<strong style=\"color: #38bdf8;\">🏃 ROBO DE BASES (SPD ≥ 40):</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">En 1B o BB con 2B libre: intenta robar (15% + 0.70×SPD). Otorga <strong style=\"color:#38bdf8;\">+20% daño</strong> al pitcher en 2 impactos.</div>",
            "upgrade": "<strong style=\"color: #a855f7;\">⚡ UPGRADE DE BATAZOS:</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">Con <strong>SPD ≥ 70</strong> (Grados B+ a S), tienes de <strong>15% a 50% chance</strong> de estirar hits a bases extra (1B→2B→3B).</div>",
            "shield_max": "🛡️ Escudo máximo: 50 (50% de la DEF promedio de tus 8 alineados).",
            "tooltip": "Sistema de Daño y Reglas de Combate"
      },
      "run_intro": {
            "title": "BIENVENIDO A BASEROGUE",
            "desc": "Arma tu alineación de 9 bateadores a través de rondas de draft, organízalos tácticamente en el campo y avanza derrotando las rotaciones rivales. ¡Lanza los dados en cada turno al bate para conquistar el campeonato!",
            "dont_show_again": "No volver a mostrar",
            "start_btn": "⚾ ¡COMENZAR PARTIDA!"
      },
      "traits": {
            "eagle_patience": "Paciencia de Águila",
            "veteran_rotation": "Rotación Veterana",
            "clutch_legends": "Leyendas del Clutch",
            "speed_demons": "Demonios de la Velocidad",
            "slugger_momentum": "Inercia de Sluggers",
            "defensive_wall": "Muro Defensivo",
            "surgical_contact": "Contacto Quirúrgico",
            "early_pressure": "Presión Temprana",
            "reliever_ambush": "Emboscada de Relevo",
            "iron_shield": "Escudo de Hierro",
            "ghost_runners": "Corredores Fantasma",
            "extra_base_impact": "Impacto de Extra-Bases",
            "era_accelerated": "Era Acelerada",
            "golden_glove": "Guante de Oro",
            "legendary_domination": "Dominación Legendaria",
            "secondary_master": "Maestro de Posición Secundaria",
            "scout_eye": "Ojo de Cazatalentos",
            "elite_negotiator": "Negociador de Élite",
            "endless_stamina": "Resistencia Inagotable"
      },
      "chest": {
            "claim_btn": "RECLAMAR RECOMPENSA",
            "claim_trait_btn": "EQUIPAR RASGO",
            "empty_desc": "El cofre estaba vacío en este sector del estadio.",
            "empty_title": "COFRE VACÍO",
            "found_title": "¡HAS ENCONTRADO UN COFRE DE TESORO!"
      },
      "gamble": {
            "header": "SALA DE APUESTAS & NEGOCIOS",
            "choose_target": "Selecciona el jugador objetivo:",
            "bet_btn": "🎲 APOSTAR",
            "reject_btn": "PASAR DE LARGO",
            "success_pct": "Probabilidad de Éxito",
            "fail_pct": "Probabilidad de Fallo",
            "no_player_found": "No hay jugadores elegibles",
            "no_valid_era_players": "Sin jugadores de esta era",
            "budget": {
                  "title": "Apuesta Financiera de Clubhouse",
                  "desc": "Invierte presupuesto en el mercado de patrocinios deportivos.",
                  "result_win": "¡Gran retorno de inversión! +$ presupuesto.",
                  "result_lose": "Mala inversión. Se perdió el dinero apostado."
            },
            "scout": {
                  "title": "Sesión de Entrenamiento Especial",
                  "desc": "Entrenamiento intensivo para mejorar las estadísticas de un jugador.",
                  "no_injury_target": "Sin jugadores lesionados",
                  "no_target": "Sin objetivo válido",
                  "result_win": "¡Entrenamiento exitoso! Estadísticas aumentadas.",
                  "result_lose": "Sobrecarga física. El jugador sufre fatiga."
            },
            "synergy": {
                  "title": "Pacto de Alquimia de Eras",
                  "desc": "Intenta forzar la afinidad de un jugador con la sinergia de tu era principal.",
                  "no_valid_target": "Sin jugadores elegibles",
                  "result_win": "¡Afinidad lograda con éxito!",
                  "result_lose": "No hubo conexión de sinergia.",
                  "result_lose_none": "Sin cambios en la sinergia."
            },
            "trade": {
                  "title": "Intercambio Sorpresa de Jugador",
                  "desc": "Negocia un traspaso a ciegas con la oficina central de la liga.",
                  "no_target": "Sin cartas para traspaso",
                  "result_win": "¡Fichaje estrella recibido a cambio!",
                  "result_lose": "El canje resultó en un jugador de rol menor."
            }
      },
      "tutorial": {
            "got_it": "¡ENTENDIDO!",
            "skip_all": "SALTAR TUTORIAL"
      },
      "career": {
            "ace_matchup_named": "Te toca enfrentar a {{pitcher}} de los {{team}}, con todos los ojos encima.",
            "ace_matchup_team": "Te toca enfrentar a los {{team}} y a su mejor brazo, con todos los ojos encima.",
            "choose_card": "ELEGIR",
            "continue": "Continuar",
            "contract_auto_renew": "Sigues bajo contrato",
            "contract_label": "Contrato",
            "contract_offer_years": "Contrato de {{years}} años",
            "contract_prompt": "¿Te quedas en tu equipo o firmas en otro lado?",
            "diff_easy": "Fácil",
            "diff_medium": "Medio",
            "diff_hard": "Difícil",
            "diff_impossible": "Imposible",
            "diff_random": "Aleatorio",
            "difficulty_desc": "Elige el nivel de exigencia de tu carrera profesional:",
            "difficulty_title": "DIFICULTAD DE CARRERA",
            "draft_continue": "CONTINUAR DRAFT",
            "draft_reveal_title": "¡EQUIPO ASIGNADO!",
            "draft_status": "Sorteando equipo...",
            "draft_status_done": "¡Te draftea!",
            "event_progress": "Evento {{current}} de {{total}}",
            "events_done": "¡Los eventos de la temporada están listos!",
            "finish_season": "VER RESUMEN DE TEMPORADA",
            "games": "partidos",
            "go_offseason": "IR AL OFFSEASON",
            "hof_inducted": "INGRESA AL SALÓN DE LA FAMA",
            "hof_not_inducted": "NO INGRESA • 75% REQUERIDO",
            "hof_progress": "Progreso al Salón de la Fama",
            "hof_votes_label": "votos",
            "hub_age": "Edad",
            "hub_current": "OVR actual",
            "hub_current_year": "Temporada",
            "hub_debut": "Debut",
            "hub_difficulty": "Dificultad",
            "hub_hof_score": "Puntaje HOF",
            "hub_play_season": "JUGAR TEMPORADA",
            "hub_potential": "Potencial (OVR)",
            "hub_team": "Equipo",
            "hub_title": "CENTRO DE CARRERA",
            "leaderboard_title": "TABLA DE LA LIGA",
            "mvp_winner_label": "MVP de la temporada",
            "nemesis_label": "Rival de siempre",
            "new_career": "EMPEZAR NUEVA CARRERA",
            "no_awards": "Sin premios esta temporada",
            "no_picks": "No hay jugadores disponibles para esta dificultad.",
            "offseason_done": "¡Offseason resuelto! Listo para la próxima temporada.",
            "offseason_event_prompt": "Algo pasa en el receso antes de la próxima temporada.",
            "other_league_player": "Otro jugador de la liga",
            "pack_title": "ELIGE TU JUGADOR PROSPECTO",
            "pathway_prompt": "¿Cómo llegaste a las Mayores?",
            "pathway_title": "CAMINO AL DEBUT",
            "pick_btn": "ELEGIR",
            "play_signature": "GIRAR LA RULETA",
            "play_situational": "GIRAR LA RULETA",
            "playoff_vs": "vs.",
            "potential_short": "POT",
            "profile_history_title": "HISTORIAL DE TEMPORADAS",
            "profile_no_seasons": "Todavía no jugaste ninguna temporada.",
            "profile_no_trophies": "Vitrina vacía — todavía.",
            "profile_trophy_case": "VITRINA DE PREMIOS",
            "progress_title": "PROGRESIÓN",
            "record": "Récord",
            "reputation_label": "Reputación",
            "retired_msg": "Tu jugador se retira.",
            "risk_tag": "RIESGO REPUTACIONAL",
            "role_bench": "Banca",
            "role_bench_desc": "Pocas chances, crecimiento lento pero seguro",
            "role_rotation": "Rotación",
            "role_rotation_desc": "Juego parejo, desarrollo estándar",
            "role_starter": "Titular",
            "role_starter_desc": "Más turnos, más presión — creces más rápido",
            "safe_tag": "SEGURO",
            "season_end_title": "FIN DE TEMPORADA",
            "season_quality": "Puntaje de temporada",
            "season_title": "TEMPORADA",
            "see_hof_verdict": "VER VEREDICTO DEL SALÓN DE LA FAMA",
            "shop_active_for": "Activo",
            "shop_balance": "Saldo",
            "shop_buy": "COMPRAR",
            "shop_cant_afford": "FONDOS INSUFICIENTES",
            "shop_cost": "Costo",
            "signature_desc": "Gira la ruleta para ver cómo te fue en el tramo decisivo de la temporada.",
            "signature_title": "MOMENTO DE LA TEMPORADA",
            "spin_wheel": "GIRAR",
            "stakes_routine": "RUTINA",
            "stakes_notable": "NOTABLE",
            "stakes_decisive": "DECISIVO",
            "standings_league": "Liga",
            "standings_none": "No hay datos de liga para este año.",
            "standings_title": "POSICIONES",
            "team_tier_champion": "Candidato al título",
            "team_tier_competitive": "Competitivo",
            "team_tier_rebuild": "En reconstrucción",
            "totals_avg": "AVG",
            "totals_hr": "HR",
            "totals_pj": "PJ",
            "totals_rbi": "RBI",
            "totals_seasons": "AÑOS",
            "wear_label": "Desgaste",
            "win_pct_label": "de victorias",
            "winter_injured_note": "la próxima temporada",
            "year_singular": "año",
            "years_remaining": "restantes",
            "years_short": "años",
            "you": "Tú"
      },
      "eagle_patience": "Paciencia de Águila",
      "veteran_rotation": "Rotación Veterana",
      "clutch_legends": "Leyendas del Clutch",
      "speed_demons": "Demonios de la Velocidad",
      "slugger_momentum": "Inercia de Sluggers",
      "defensive_wall": "Muro Defensivo",
      "surgical_contact": "Contacto Quirúrgico",
      "early_pressure": "Presión Temprana",
      "reliever_ambush": "Emboscada de Relevo",
      "iron_shield": "Escudo de Hierro",
      "ghost_runners": "Corredores Fantasma",
      "extra_base_impact": "Impacto de Extra-Bases",
      "era_accelerated": "Era Acelerada",
      "golden_glove": "Guante de Oro",
      "legendary_domination": "Dominación Legendaria",
      "secondary_master": "Maestro de Posición Secundaria",
      "scout_eye": "Ojo de Cazatalentos",
      "elite_negotiator": "Negociador de Élite",
      "endless_stamina": "Resistencia Inagotable",
      "back_to_back": "Batazos Consecutivos"
}
    },
    en: {
      translation: {
      "hud": {
            "stage": "Stage:",
            "budget": "Budget:",
            "roster": "Roster",
            "synergies": "Synergies"
      },
      "sidebar": {
            "upgrades": "<i class=\"fa-solid fa-suitcase\"></i> UPGRADES",
            "no_items": "NOTHING PURCHASED",
            "eras_header": "ROSTER ERAS",
            "franchises_header": "ROSTER FRANCHISES",
            "no_teams": "No registered team.",
            "dynasty_desc": "Dynasty (4+): {{team}} players gain +5 to all stats in combat.",
            "chemistry_desc": "Chemistry (2+): {{team}} players gain +2 to all stats in combat."
      },
      "eras": {
            "header": "⏳ ROSTER ERAS",
            "franchises_header": "⚾ ROSTER FRANCHISES",
            "genesis_d1": "T1 (2+): 30% chance to advance extra base and +8 dmg",
            "genesis_d2": "T2 (4+): 45% chance to advance extra base and +12 dmg",
            "genesis_d3": "T3 (6+): 60% chance to advance extra base and +18 dmg",
            "genesis_d4": "T4 (8+): 80% chance to advance extra base and +25 dmg",
            "deadball_d1": "T1 (2+): +3 CON/K-AVD to team; singles (1B) deal +8 extra dmg",
            "deadball_d2": "T2 (4+): +6 CON/K-AVD; singles deal +14 extra dmg",
            "deadball_d3": "T3 (6+): +9 CON/K-AVD; singles +20 dmg; runs scored deal +12 extra impact dmg",
            "deadball_d4": "T4 (8+): +12 CON/K-AVD; singles +28 dmg; runs scored deal +20 extra impact dmg",
            "golden_d1": "Golden Era: All hits deal +6 extra damage.",
            "golden_d2": "Golden Era: Hits +12 damage; 30% chance to convert 2B into 3B.",
            "golden_d3": "Golden Era: Hits +18 damage; 50% convert 2B into 3B; +10% HR chance.",
            "integration_d1": "T1 (2+): Team gains +3 to all stats in combat",
            "integration_d2": "T2 (4+): Team +6 stats; hits deal +10 dmg; outs restore +8 Stamina to all",
            "integration_d3": "T3 (6+): Team +9 stats; hits deal +18 dmg; outs restore +12 Stamina to all",
            "integration_d4": "T4 (8+): +12 stats; hits deal +26 dmg; outs restore +16; immune to fatigue",
            "speed_d1": "T1 (2+): +3 SPD to team; +20% steal chance; steal heals +10 Stamina and +8 dmg",
            "speed_d2": "T2 (4+): +6 SPD & +3 EYE; +35% steal chance; steal heals +15 and deals +15 dmg",
            "speed_d3": "T3 (6+): +9 SPD & +6 EYE; +50% steal chance; steal heals +20 and deals +22 dmg",
            "speed_d4": "T4 (8+): +13 SPD & +9 EYE; 100% guaranteed steal; heals +25 and deals +30 dmg",
            "astroturf_d1": "T1 (2+): +3 DEF and +3 SPD to team (+10 Shield); steals deal +10 dmg",
            "astroturf_d2": "T2 (4+): +6 DEF/SPD (+20 Shield); steals deal +18 dmg & 3-impact debuff",
            "astroturf_d3": "T3 (6+): +10 DEF/SPD (+30 Shield); steals deal +26 dmg & 4-impact debuff",
            "astroturf_d4": "T4 (8+): +14 DEF/SPD (+40 Shield); steals +35 dmg, 5-impact debuff & outs deal -50% dmg",
            "steroid_d1": "T1 (2+): +4 PWR to team; Home Runs (HR) deal +15 additional dmg",
            "steroid_d2": "T2 (4+): +7 PWR; HR deal +25 additional dmg and heal +10 Stamina to all",
            "steroid_d3": "T3 (6+): +11 PWR; HR deal +38 additional dmg and heal +15 Stamina to all",
            "steroid_d4": "T4 (8+): +15 PWR; HR deal +50 additional dmg and heal +20 Stamina to all",
            "moneyball_d1": "T1 (2+): Walks (BB) deal +10 extra damage",
            "moneyball_d2": "T2 (4+): BB +16 damage; getting on base inflicts 1-impact fatigue (+20% damage)",
            "moneyball_d3": "T3 (6+): BB +24 damage; 2-impact fatigue; strikeouts hit Shield instead of HP",
            "moneyball_d4": "T4 (8+): BB +32 damage; 2-impact fatigue; strikeouts hit Shield with -50% damage",
            "tto_d1": "T1 (2+): +3 EYE and +3 PWR; BB deal +12 dmg; Strikeout deals -50% team dmg",
            "tto_d2": "T2 (4+): +6 EYE/PWR; BB +18 dmg; Strikeouts don't grow enemy streak",
            "tto_d3": "T3 (6+): +9 EYE/PWR; BB +25 dmg; HR inflicts 3-impact debuff (+30% dmg)",
            "tto_d4": "T4 (8+): +12 EYE/PWR; BB +35 dmg; Strikeouts deal 0 damage to team (nullified)",
            "golden_d4": "Golden Era: Hits +25 damage! 75% convert 2B into 3B; +20% HR chance & +20 starting Shield."
      },
      "map": {
            "title": "<i class=\"fa-solid fa-map\"></i> Championship Map",
            "desc": "Choose your path. Win matches to earn money, recruit players, and train your squad.",
            "stage_playoffs": "Playoffs — Final Stage - Difficulty: Legend",
            "stage_pennant": "Pennant Chase — Late Season - Difficulty: Expert",
            "stage_allstar": "All-Star Break — Mid Season - Difficulty: Hard",
            "stage_opening": "Opening Day — Season Opener - Difficulty: Normal",
            "locked": "LOCKED",
            "active": "ACTIVE",
            "completed": "COMPLETED",
            "node_opener": "OPENER",
            "node_classic": "CLASSIC SERIES",
            "node_sign": "LEGEND SIGN",
            "node_cage": "BATTING CAGE",
            "node_clubhouse": "CLUBHOUSE",
            "node_decision": "DECISION",
            "node_boss": "BOSS",
            "boss_label": {
                  "3": "OPENING DAY",
                  "7": "ALL-STAR GAME",
                  "11": "LEAGUE CHAMPION",
                  "15": "WORLD SERIES"
            },
            "label_classic": "CLASSIC SERIES",
            "label_decision": "DECISION",
            "node_pennant": "LEAGUE CHAMPION",
            "node_world_series": "WORLD SERIES",
            "win_pct": "Win Chance: {{pct}}%"
      },
      "ratings_guide": {
            "title": "📊 RATINGS GUIDE",
            "con": "<strong style=\"color:#a7f3d0;\">CON — Contact:</strong> Determines the probability of making contact. High CON players have higher chances of singles and hits overall.",
            "pwr": "<strong style=\"color:#f59e0b;\">PWR — Power:</strong> Probability of extra-base hits (doubles, triples, home runs). Also increases damage to opponent pitcher on deep hits.",
            "eye": "<strong style=\"color:#3b82f6;\">EYE — Vision/Eye:</strong> Probability of getting walks (BB). Key for advancing runners and wearing down the rival pitcher.",
            "k_avd": "<strong style=\"color:#ec4899;\">K/AVD — Strikeout Avoidance:</strong> Shrinks the strikeout (SO) zone on the dice roll. Essential for preventing direct HP damage caused by strikeouts.",
            "spd": "<strong style=\"color:#38bdf8;\">SPD — Speed:</strong> Triggers base stealing attempts on singles (+20% pitcher damage debuff). Also improves chance of converting hits to extra bases.",
            "def": "<strong style=\"color:#a855f7;\">DEF — Defense:</strong> Contributes to team <strong>Shield</strong>. Higher average DEF gives you more shield to absorb OUTs before losing HP.",
            "captain": "<strong style=\"color:#eab308;\">👑 CAPTAIN:</strong> +5 to all ratings for all teammates while on the active roster.",
            "clutch": "<strong style=\"color:#ef4444;\">⚡ CLUTCH PLAYER:</strong> +2% single and double chance, +4% HR chance with runners in scoring position or during the last inning.",
            "tooltip": "Player Ratings & Attribute Guide"
      },
      "mode_select": {
            "app_title": "⚾ BASE-ROGUE",
            "select_mode": "SELECT GAME MODE",
            "story_title": "STORY MODE",
            "story_subtitle": "SEASONS 1901 – 2025",
            "story_desc": "Relive historic MLB seasons and defeat real teams on your journey to the World Series.",
            "story_btn": "⚾ SELECT SEASON",
            "quick_title": "QUICK PLAY",
            "quick_subtitle": "CLASSIC MODE",
            "quick_desc": "The classic BaseRogue experience, face legendary opponents from different eras.",
            "challenge162_title": "162-0 CHALLENGE",
            "challenge162_subtitle": "PERFECT SEASON",
            "challenge162_desc": "Build your roster with unlocked cards and simulate a 162-game season chasing a perfect record.",
            "challenge162_btn": "🏆 BUILD TEAM",
            "challenge162_locked_desc": "🔒 Mode Locked. Win your first Quick Play run to unlock the 162-0 Challenge.",
            "challenge162_locked_btn": "🔒 LOCKED (WIN QUICK PLAY)",
            "challenge162_continue_btn": "⚾ CONTINUE SEASON",
            "tagline": "BASEBALL ROGUELIKE",
            "quick_btn": "⚡ QUICK PLAY",
            "career_title": "CAREER MODE",
            "career_subtitle": "FROM ROOKIE TO HALL OF FAME",
            "career_desc": "Create and guide your custom ballplayer from the Draft to superstardom. Make crucial choices, overcome challenges, and cement your legacy.",
            "career_btn": "⭐ START CAREER"
      },
      "common": {
            "back_menu": "← MENU",
            "damage": "DAMAGE",
            "shield": "SHIELD",
            "loading": "Loading..."
      },
      "season_select": {
            "title": "📜 SELECT THE SEASON",
            "desc": "Choose the year to compete against real teams from that era with their top 3 pitchers by WAR.",
            "year_label": "SEASON YEAR:",
            "random": "🎲 Random Season",
            "start_btn": "⚾ START HISTORICAL SEASON",
            "roulette_title": "🎲 RAFFLING SEASON 🎲",
            "roulette_status": "Searching historical year..."
      },
      "menu": {
            "intro_title": "BaseRogue",
            "intro_desc": "Pick your players in <strong style=\"color:#00ff66;\">{{rounds}} draft rounds</strong> to build your full 9-batter roster. Organize their defensive position (Drag & Drop) and batting order in real time. Then <strong style=\"color:#00ff66;\">roll the dice</strong> each turn to determine the at-bat outcome. Defeat the rival rotation before your <strong style=\"color:#ef4444;\">{{hp}} HP</strong> reaches zero."
      },
      "draft": {
            "title": "<i class=\"fa-solid fa-file-signature\"></i> Player Signings (Draft)",
            "desc": "Select a legend to join your roster. Choose wisely to optimize positions and activate Era or Franchise synergies.",
            "midrun_desc": "Select a legend to sign with your budget, or decline the sign to continue the run.",
            "midrun_title_short": "LEGEND SIGN",
            "round_header": "⚾ INITIAL DRAFT — ROUND {{round}} OF 9",
            "roster_header": "🧤 ROSTER",
            "batting_order_header": "⚔️ BATTING ORDER",
            "auto_sort": "⚙️ AUTO ORDER",
            "auto_sort_title": "Sort logically: Speed 1st, Power 4th, Best batters 2nd & 3rd.",
            "select_btn": "✔ SELECT",
            "inspect_card": "CARD",
            "sign_btn": "✍️ Sign (${{cost}})",
            "auto_complete_btn": "🎲 Surprise me! (Auto-Complete)",
            "decline_btn": "🚫 Decline Sign / Continue",
            "decline_desc": "Don't want to sign any legend or prefer saving your money? You can decline the sign and advance on the map.",
            "confirm_lineup_title": "⚾ ROSTER TO START THE SEASON",
            "confirm_defensive_header": "🧤 DEFENSIVE LINEUP (DRAG & DROP)",
            "confirm_batting_header": "⚔️ BATTING ORDER",
            "start_campaign_btn": "⚾ CONFIRM TEAM & START CAMPAIGN",
            "swap_modal_title": "<i class=\"fa-solid fa-triangle-exclamation\"></i> Roster Full",
            "swap_modal_desc": "Your bench and lineup are full. Select a current player to permanently replace them with the new sign:",
            "swap_new_player": "New Sign: {{name}}",
            "swap_reject_btn": "Decline Sign",
            "round_elite_hint": "This is a guaranteed elite round. Take advantage of it to secure a quality starter.",
            "round_common_hint": "Common round. These players will fill your remaining slots and form your bench.",
            "round_free_hint": "Free round: any rarity from the pool may appear. Good luck!",
            "round_1_label": "EPIC OR BETTER",
            "round_2_label": "RARE OR BETTER",
            "round_3_label": "UNCOMMON OR BETTER",
            "round_4_label": "MANDATORY COMMON",
            "round_free_label": "FREE ROUND — ANY RARITY",
            "initial_shield": "🛡️ Initial Shield: <span style=\"color:#10b981;font-size:13px;\">{{shield}} PTS</span>",
            "drag_to_reorder": "Drag to reorder",
            "pack_open_prompt": "Click to open the pack!",
            "pack_tagline_standard": "Standard Pack",
            "pack_tagline_premium": "Elite or Better Pack",
            "pack_tagline_legendary": "Legendary Pack",
            "pack_tagline_vintage": "Vintage Classics Pack",
            "pack_tagline_speed": "Speedsters Pack",
            "pack_tagline_power": "Sluggers Pack",
            "pack_tagline_contact": "Contact Hitters Pack",
            "pack_tagline_pitcher": "Pitchers Pack",
            "insufficient_funds": "Insufficient budget",
            "legend_no_budget": "Not enough budget to sign legends",
            "signed_cost_suffix": "signed for"
      },
      "pre_fight": {
            "title": "<i class=\"fa-solid fa-shield-halved\"></i> Series Preparation",
            "subtitle": "You face the series against {{team}}. Make sure your batters are ready.",
            "batters_title": "<i class=\"fa-solid fa-users\"></i> Your Batters (HP)",
            "pitchers_title": "<i class=\"fa-solid fa-skull-crossbones\"></i> Opponent Rotation (HP)",
            "start_btn": "<i class=\"fa-solid fa-fire-flame-curved\"></i> BATTLE!",
            "back_map_btn": "<i class=\"fa-solid fa-arrow-left\"></i> Back to Map",
            "scouting_title": "RIVAL SCOUTING REPORT",
            "rival_rotation_label": "RIVAL ROTATION:",
            "ovr_label": "AVERAGE (OVR):",
            "era_label": "DOMINANT ERA:",
            "mixed_eras": "Mixed Era"
      },
      "match": {
            "title": "<i class=\"fa-solid fa-trophy\"></i> BATTLE",
            "interactive_header": "<i class=\"fa-solid fa-baseball\"></i> INTERACTIVE COMBAT VS {{team}}",
            "arena": "COMBAT ARENA",
            "runs": "RUNS:",
            "outs": "OUTS:",
            "inning": "INNING:",
            "rival_ko": "OPPONENT K.O.:",
            "active_turn": "ACTIVE AT-BAT",
            "native_pos": "NATIVE POS:",
            "team_hp": "TEAM HP",
            "shield_label": "SHIELD (DEF avg {{avg}})",
            "so_streak": "🔥 STRIKEOUT STREAK: {{count}} ({{mult}}x DIRECT dmg)",
            "so_streak_zero": "🔥 Strikeout Streak: 0",
            "debuff_badge": "DAMAGE RECEIVED",
            "luck_zones": "Luck Zones",
            "bb": "Walk (BB)",
            "so": "Strikeout (SO)",
            "out": "Out (Fly/GD)",
            "single": "Single (1B)",
            "double": "Double (2B)",
            "triple": "Triple (3B)",
            "hr": "Home Run (HR)",
            "roll_dice": "🎲 ROLL DICE",
            "simulate_all": "⚡ SIMULATE ALL",
            "history": "MATCH HISTORY",
            "log_hr": "🎲 [{{roll}}] [HOME RUN] {{batter}} {{runs}}-run HOME RUN! Scored {{runs}} runs. {{pitcher}} takes {{dmg}} HP damage.",
            "log_3b": "🎲 [{{roll}}] [TRIPLE] {{batter}} triple to the corner! Scored {{runs}} runs. {{pitcher}} takes {{dmg}} HP damage.",
            "log_2b": "🎲 [{{roll}}] [DOUBLE] {{batter}} sharp line drive down the line! Scored {{runs}} runs. {{pitcher}} takes {{dmg}} HP damage.",
            "log_1b": "🎲 [{{roll}}] [SINGLE] {{batter}} ground ball single! Scored {{runs}} runs. {{pitcher}} takes {{dmg}} HP damage.",
            "log_out": "🎲 [{{roll}}] [OUT] {{batter}} {{outStr}}. Shield -{{shieldDmg}} HP | Team HP -{{teamHpDmg}} HP. (Shield: {{shield}}/{{maxShield}} | HP: {{hp}}/100)",
            "log_so": "🎲 [{{roll}}] [STRIKEOUT] {{pitcher}} strikes out {{batter}}!{{chain}} Direct damage: -{{dmg}} HP to team (ignores shield!). Remaining HP: {{hp}}/100",
            "log_bb": "🎲 [{{roll}}] [WALK] {{batter}} draws a walk (BB)! {{pitcher}} takes {{dmg}} HP damage from patient at-bat.",
            "out_ground": "grounds out to the infield",
            "out_fly": "flies out to the outfield",
            "out_line": "line drive caught in the air",
            "log_ko": "[K.O.] {{name}} defeated!",
            "log_relief": "Relief pitcher coming in: {{name}} ({{hp}}/{{maxHp}} HP).",
            "log_residual": "⚡ Residual damage! {{name}} comes in relieving -{{dmg}} HP impact ({{hp}}/{{maxHp}} HP).",
            "log_steal": "🏃 STOLEN BASE! {{batter}} steals 2nd base!",
            "log_runs_damage": "{{runs}} runs scored. {{pitcher}} takes {{dmg}} HP damage.",
            "log_defeat": "💀 DEFEAT. Your team reached 0 HP. Strikeouts wiped out your lineup.",
            "log_victory": "🏆 VICTORY! You defeated the rival rotation.",
            "win_title": "🏆 SERIES VICTORY! 🏆",
            "loss_title": "💀 SERIES DEFEAT 💀",
            "win_desc": "Extraordinary! You knocked out the full rotation of {{team}}.",
            "loss_desc": "The pitchers of {{team}} dominated the series. Your HP reached 0.",
            "claim_rewards": "CLAIM REWARDS",
            "see_results": "VIEW RESULTS",
            "rival_rotation": "RIVAL ROTATION",
            "outcome_victory": "DECISIVE VICTORY! You have defeated the complete pitcher rotation.",
            "outcome_defeat": "DEFEAT. Your lineup was knocked out by the rival pitchers.",
            "banner_inning": "INNING {{inning}}",
            "banner_inning_sub": "TOP OF THE INNING! BATTERS AT COMBAT",
            "banner_inning_last": "FINAL INNING",
            "banner_inning_last_sub": "CLUTCH MOMENT! ALL OR NOTHING",
            "banner_ko": "PITCHER KNOCKED OUT!",
            "banner_ko_sub": "RIVAL ROTATION TAKES CRITICAL DAMAGE",
            "banner_bullpen": "RIVAL BULLPEN ENTERS",
            "banner_bullpen_sub": "A NEW RELIEVER STEPS ONTO THE MOUND"
      },
      "popup": {
            "bb_title": "WALK (BB)",
            "bb_dmg": "PITCHER TAKES DAMAGE!",
            "so_title": "STRIKEOUT!",
            "so_dmg": "DIRECT DAMAGE (IGNORES SHIELD)",
            "out_title": "OUT",
            "out_dmg": "SHIELD DAMAGE",
            "single_title": "SINGLE (1B)",
            "single_dmg": "PITCHER DAMAGE",
            "double_title": "DOUBLE (2B) ⚡",
            "double_dmg": "DOUBLE DAMAGE",
            "triple_title": "TRIPLE (3B) 🔥",
            "triple_dmg": "TRIPLE DAMAGE",
            "hr_title": "HOME RUN! 🚀💥",
            "hr_dmg": "MASSIVE CRITICAL DAMAGE!",
            "steal_title": "STOLEN BASE! 🏃⚡",
            "steal_dmg": "PITCHER DEBUFF: +20% DAMAGE TAKEN",
            "ko_title": "PITCHER K.O.! 💥",
            "ko_dmg": "RIVAL PITCHER DEFEATED!"
      },
      "card_popup": {
            "swap_pos_title": "CHANGE DEFENSIVE POSITION:",
            "swap_pos_desc": "Swap defensive position of <b>{{name}}</b> with another starter. <span style=\"color:#00ff66;\">(Does NOT alter your batting order)</span>.",
            "tag_current": " (Current)",
            "tag_native": " (Native ⭐ 100% Def)",
            "tag_secondary": " (Secondary 🛡️ 85% Def)",
            "tag_out_pos": " (Out of Pos ⚠️ 50% Def)"
      },
      "train_plans": {
            "con_label": "Contact Practice",
            "con_desc": "Permanently increases Contact by +6.",
            "pwr_label": "Power Training",
            "pwr_desc": "Increases player Power by +6.",
            "spd_label": "Speed Drills",
            "spd_desc": "Increases player Speed by +6.",
            "def_label": "Glove Drills",
            "def_desc": "Increases player Defense by +6.",
            "sta_label": "Physical Conditioning",
            "sta_desc": "Recovers +35 Stamina and adds +5 max Stamina."
      },
      "events": {
            "ev_cork_title": "Contraband Bats",
            "ev_cork_desc": "A mysterious merchant offers corked bats. It will boost team Power, but lower Contact.",
            "ev_cork_choice1": "Modify bats (+15 Power, -4 Contact for the whole team)",
            "ev_cork_choice2": "Decline offer (Do nothing)",
            "ev_fitness_title": "Retro Physical Trainer",
            "ev_fitness_desc": "A trainer from the 1982 championship offers to coordinate an intense conditioning routine.",
            "ev_fitness_choice1": "Cardio routine (+40 Stamina for the whole roster)",
            "ev_fitness_choice2": "Continue without training",
            "ev_cryo_title": "Hydrotherapy Chamber",
            "ev_cryo_desc": "You install an advanced recovery chamber in the locker room. Instantly heals the team, but costs money.",
            "ev_cryo_choice1": "Cryotherapy (Recovers 100% Stamina for all)",
            "ev_cryo_choice2": "Forego the chamber",
            "ev_pinetar_title": "Japanese Pine Tar",
            "ev_pinetar_desc": "You acquire a tub of special pine tar that improves bat grip, sharpening contact.",
            "ev_pinetar_choice1": "Buy pine tar (+8 global Contact for the whole team)",
            "ev_pinetar_choice2": "Stay as is",
            "ev_bribe_title": "Scout in Distress",
            "ev_bribe_desc": "A scout offers budget money from the opposing team in exchange for sacrificing some focus.",
            "ev_bribe_choice1": "Accept money (Gain +$45 budget, but lose -5 global Vision/Eye)",
            "ev_bribe_choice2": "Report to commissioner (Gain +8 global Vision/Eye for your team)"
      },
      "train": {
            "title": "<i class=\"fa-solid fa-dumbbell\"></i> Batting Cage / Bullpen",
            "desc": "Train a specific player's skills to permanently boost their base stats.",
            "select_player": "Select a Player:",
            "confirm_btn": "<i class=\"fa-solid fa-medal\"></i> Start Training",
            "back_btn": "<i class=\"fa-solid fa-arrow-left\"></i> Back to Map"
      },
      "rest": {
            "title": "<i class=\"fa-solid fa-couch\"></i> Clubhouse (Rest)",
            "desc": "A well-deserved rest in the season. Accumulated fatigue reduces player performance in matches.",
            "heal_title": "Full Rest",
            "heal_desc": "Recover +40 energy/stamina for all active and bench players.",
            "heal_btn": "<i class=\"fa-solid fa-heart-pulse\"></i> Sleep and Recover",
            "sponsor_title": "Sponsor Deal",
            "sponsor_desc": "Receive a direct +$25 cash bonus to spend in shops.",
            "sponsor_btn": "<i class=\"fa-solid fa-circle-dollar-to-slot\"></i> Collect Sponsorship",
            "badge_restore": "RESTORATION!",
            "stamina": {
                  "desc": "Your entire active roster recovers +40 Stamina for upcoming matches."
            },
            "badge_bonus": "BONUS!",
            "money": {
                  "desc": "Your club receives an economic injection from local sponsors."
            }
      },
      "event": {
            "title": "<i class=\"fa-solid fa-clipboard-question\"></i> Manager's Office",
            "desc": "Make a critical decision for the club. Each choice affects budget, health, or team stats.",
            "placeholder_title": "SPECIAL CLUBHOUSE EVENT",
            "placeholder_desc": "Tactical opportunity in the clubhouse."
      },
      "gameover": {
            "title": "Run Over!",
            "history_title": "<i class=\"fa-solid fa-clock-rotate-left\"></i> Season Summary",
            "replay_title": "Ready for another season?",
            "replay_desc": "Select a new starter legend and recruit different rosters to unlock other historical synergies.",
            "restart_btn": "<i class=\"fa-solid fa-rotate-right\"></i> Play Again",
            "summary_btn": "<i class=\"fa-solid fa-chart-column\"></i> View Full Summary"
      },
      "pos": {
            "native": "✅ Native",
            "secondary": "⚡ Secondary (-{{pen}} DEF)",
            "out_of_pos": "⚠️ Out of pos (-{{pen}} DEF)",
            "empty": "— EMPTY —",
            "empty_slot": "{{slot}} — EMPTY"
      },
      "headers": {
            "map": "<i class=\"fa-solid fa-map\"></i> Championship Map",
            "pre_fight": "<i class=\"fa-solid fa-shield-halved\"></i> Series Preparation",
            "match": "<i class=\"fa-solid fa-trophy\"></i> BATTLE",
            "event": "<i class=\"fa-solid fa-clipboard-question\"></i> Manager's Office",
            "train": "<i class=\"fa-solid fa-dumbbell\"></i> Batting Cage / Bullpen",
            "rest": "<i class=\"fa-solid fa-couch\"></i> Clubhouse (Rest)",
            "gameover": "Run Over!",
            "synergies": "<i class=\"fa-solid fa-bolt\"></i> SYNERGIES",
            "draft": "<i class=\"fa-solid fa-file-signature\"></i> PLAYER SIGNINGS"
      },
      "summary": {
            "title": "<i class=\"fa-solid fa-baseball\"></i> COMPLETE RUN STATS",
            "tab_batters": "My Lineup (Batting)",
            "tab_pitchers": "Opponent Pitchers",
            "player_col": "Batter",
            "pitcher_col": "Pitcher"
      },
      "victory": {
            "title": "ABSOLUTE BASEROGUE CHAMPION!",
            "desc": "You conquered the final phase and defeated the Supreme Rotation of 4 Legends! Your lineup goes down in baseball roguelike history.",
            "summary_btn": "<i class=\"fa-solid fa-chart-column\"></i> View Run Summary",
            "replay_btn": "<i class=\"fa-solid fa-rotate-right\"></i> Play Again",
            "challenge162_hint_title": "🏆 Does this roster have what it takes for 162-0?",
            "challenge162_hint_desc": "The players and pitchers from this run are now unlocked for the 162-0 Challenge. Build the team and see if it can survive a full season.",
            "challenge162_hint_btn": "<i class=\"fa-solid fa-trophy\"></i> Try the 162-0 Challenge"
      },
      "sim": {
            "label_bb": "WALK",
            "label_so": "STRIKEOUT",
            "label_out": "OUT",
            "label_1b": "SINGLE",
            "label_2b": "DOUBLE",
            "label_3b": "TRIPLE",
            "label_hr": "HOME RUN",
            "bb_desc": "works the count and draws a walk",
            "bb_run": "Runner scores!",
            "bb_advance": "Advances to first.",
            "pitcher_dmg_txt": "takes {{dmg}} HP damage",
            "steal_label": "STOLEN BASE!",
            "steal_desc": "steals second base",
            "debuff_turn_s": "impact remaining",
            "debuff_turns_p": "impacts remaining",
            "debuff_note": "Debuff of +20% damage",
            "extra_dmg_pitcher": "extra damage to pitcher",
            "clutch_desc": "bats in a decisive moment",
            "clutch_reason_both": "last inning with runners in scoring position",
            "clutch_reason_inning": "last inning",
            "clutch_reason_runners": "runners in scoring position",
            "so_pitcher_verb": "strikes out {{batter}}",
            "so_direct_dmg": "Direct damage: -{{dmg}} HP to team (ignores shield!)",
            "hp_remaining": "Remaining HP: {{hp}}/100",
            "streak_label": "STREAK ×{{count}} (-{{dmg}} HP!)",
            "out_ground": "grounds out to the infield",
            "out_fly": "flies out to the outfield",
            "out_line": "line drive caught in the air",
            "out_dmg_label": "Shield -{{shield}} HP | Team HP -{{hp}} HP",
            "shield_status": "Shield: {{shield}}/{{max}} | HP: {{hp}}/100",
            "runs_scored": "{{runs}} runs scored. {{pitcher}} takes {{dmg}} HP damage",
            "hr_desc": "{{runs}}-run HOME RUN",
            "3b_desc": "triple to the corner",
            "2b_desc": "sharp line drive down the line",
            "1b_desc": "ground ball single",
            "spd_upgrade": "⚡ SPD Proc (Grade {{grade}}): {{from}} upgraded to {{to}}!",
            "spd_stretch_2b": "connects and stretches hit to SECOND BASE with speed (Grade {{grade}})",
            "spd_stretch_3b": "connects and stretches hit to THIRD BASE with speed (Grade {{grade}})",
            "inning_end": "--- END OF INNING {{inning}} ({{runs}} runs scored) ---",
            "match_timeout": "⏱ MATCH OVER (3 innings). {{remaining}} pitchers remaining.",
            "syn_moneyball_bb": "📊 Moneyball: Walk deals +{{extra}} damage!",
            "syn_moneyball_fatigue": "📊 Moneyball: Pitcher fatigued! +20% damage debuff ({{turns}} impacts remaining).",
            "syn_moneyball_so_t3": "📊 Moneyball: Strikeout absorbed by Shield (bypasses direct HP damage)!",
            "syn_moneyball_so_t4": "📊 Moneyball: Strikeout mitigated (-50%) and absorbed by Shield!",
            "syn_tto_bb": "🚀 Three True Outcomes: Walk deals +{{extra}} optimized damage!",
            "syn_tto_hr_debuff": "🚀 Three True Outcomes: Home Run weakens the pitcher for {{turns}} hits (+30% dmg)!",
            "syn_tto_so": "🚀 Three True Outcomes: Strikeout -50% HP damage",
            "syn_tto_so_zero": "🚀 Three True Outcomes: Strikeout nullified (0 team damage)!",
            "syn_fivetool_hit": "🌟 Five-Tool: Complete hit deals +{{extra}} damage!",
            "syn_fivetool_out": "🔋 Five-Tool: OUT restores +{{amt}} Stamina to all!",
            "syn_fivetool_immune": "🔋 Five-Tool: {{name}} is immune to this match's Stamina wear!",
            "syn_bash_sacfly": "💪 Bash Brothers Sac Fly: Runner on 3B scores!",
            "syn_bash_hr": "💪 Bash Brothers: Nuclear Home Run deals +{{extra}} damage!",
            "syn_bash_hr_heal": "💪 Bash Brothers: Home Run restores +{{amt}} Stamina to all!",
            "syn_liveball_upgrade": "🔥 Liveball Sluggers: Double upgraded to Triple!",
            "syn_liveball_upgrade_hr": "🔥 Liveball Sluggers: Triple upgraded to Home Run!",
            "syn_liveball_dmg": "🔥 Liveball Sluggers: +{{extra}} damage.",
            "syn_genesis_advance": "💥 Genesis Chaos: Aggressive hit! +{{dmg}} damage and extra base advance.",
            "syn_deadball_1b": "⏳ Small Ball: Placed single deals +{{extra}} damage!",
            "syn_deadball_run": "⏳ Small Ball: Manufactured {{runs}} run(s) deal +{{bonus}} impact damage!",
            "syn_smallball": "⏳ Small Ball: Runners advance 2 bases on single!",
            "syn_bighair": "Big Hair Synergy",
            "syn_bighair_glove": "🛼 AstroTurf: Gold Glove cuts out damage by -50%!",
            "def_success_title": "GOLD GLOVE PLAY!",
            "def_success_desc": "makes a sensational defensive play (Roll: {{roll}}/{{thresh}})",
            "def_success_reward": "Recovered +30 HP and +15 Shield!",
            "def_fail_title": "OPPONENT HIT / ERROR!",
            "def_fail_desc": "fails to field the opponent hit cleanly (Roll: {{roll}}/{{thresh}})",
            "def_fail_penalty": "Suffered -{{dmg}} damage!",
            "def_title_c": "STEAL ATTEMPT AT SECOND BASE!",
            "def_desc_c": "Opponent runner sprints toward 2B. Your catcher pops up and fires a strike to the bag.",
            "def_title_1b": "SHARP GROUND BALL DOWN THE LINE!",
            "def_desc_1b": "Sizzling hit aimed down the right-field corner. Your first baseman dives to snare it.",
            "def_title_2b": "SEEING-EYE GROUND BALL UP THE MIDDLE!",
            "def_desc_2b": "Bouncer heading past second base. Your second baseman ranges, fields on a spin and fires.",
            "def_title_3b": "HOT LINER AT THE HOT CORNER!",
            "def_desc_3b": "Blistering missile hugging the third-base chalk. Pure quick reflexes to rob extra bases.",
            "def_title_ss": "ROBBING THE HIT IN THE SS 6-HOLE!",
            "def_desc_ss": "Sharp grounder between third and short. Your shortstop slides across the grass and flashes leather.",
            "def_title_lf": "FOUL POPUP DRIFTING NEAR THE WALL!",
            "def_desc_lf": "Tricky blooper toward the left-field railing. Your left fielder hustles and sacrifices the body.",
            "def_title_cf": "DEEP DRIVE TO THE WARNING TRACK!",
            "def_desc_cf": "Huge smash threatening to sail overhead. Your center fielder measures the wall and leaps high.",
            "def_title_rf": "SLICING LINER TOWARD THE RIGHT-FIELD POLE!",
            "def_desc_rf": "Sinking liner tailing toward the corner. Your right fielder cuts off the ball in mid-air.",
            "def_ball_c": "Wild pitch / Stolen base attempt",
            "def_ball_1b": "Screaming liner down the 1B line",
            "def_ball_2b": "Chopper placed behind 2B",
            "def_ball_3b": "Rocket down the third-base line",
            "def_ball_ss": "Hard grounder in the 6-hole",
            "def_ball_lf": "Sinking liner to left field",
            "def_ball_cf": "Deep blast into the gap",
            "def_ball_rf": "Slicing liner toward the right corner",
            "def_badge": "🛡️ BOTTOM OF INNING {{inning}} • DEFENSIVE TRIAL",
            "def_radar_field_title": "FIELD RADAR • DEFENSIVE SECTOR",
            "def_speed_label": "EXIT VELO",
            "def_zone_label": "ZONE",
            "def_catch_zone": "CATCH ZONE",
            "def_error_zone": "ERROR",
            "def_safe_tactic_title": "🛡️ REGULAR PLAY",
            "def_safe_tactic_desc": "Secure the catch (Standard Target • +30 HP)",
            "def_clutch_tactic_title": "⚡ HIGHLIGHT DIVE",
            "def_clutch_tactic_desc": "Diving play (-12% Target • +40 HP & +25 Shield)",
            "def_safe_name": "🛡️ Regular Play",
            "def_clutch_name": "⚡ Highlight Dive",
            "def_roll_btn": "🧤 MAKE DEFENSIVE PLAY!",
            "def_rolling": "⚾ FIELDING THE BALL...!",
            "def_stat_total": "Total Defense:",
            "def_grade_label": "Grade",
            "def_hit_type": "Hit Type:",
            "def_target_meta": "Catch Target:",
            "def_d100_range": "Roll 1 to {{thresh}}",
            "def_gold_glove_badge": "🥇 GOLD GLOVE",
            "def_oop_badge": "⚠️ (Out of Position -35% DEF)",
            "def_strategy_label": "Strategy:",
            "def_roll_label": "Roll:",
            "def_target_label": "Target:",
            "def_gain_success": "🟢 GAINED +{{hp}} HP AND +{{shield}} SHIELD!",
            "def_loss_fail": "🔴 LOST -{{dmg}} DAMAGE! (Shield: -{{shieldDmg}} • HP: -{{hpDmg}})",
            "def_team_status": "Team: HP {{hp}}/100 • Shield {{shield}}/{{shieldMax}}",
            "def_success_banner_title": "🥇 GOLD GLOVE HIGHLIGHT!",
            "def_fail_banner_title": "⚠️ OPPONENT HIT / DEFENSIVE ERROR!",
            "def_success_banner_desc": "Sensational catch on the diamond! Team HP and Shield restored.",
            "def_fail_banner_desc": "The ball gets past the fielder! Team takes impact damage.",
            "def_continue": "⚾ ADVANCE TO INNING {{nextInning}}",
            "def_safe_btn_label": "🧤 SECURE GLOVE! (Roll 1 to {{thresh}})",
            "def_clutch_btn_label": "⚡ HIGHLIGHT DIVE! (Roll 1 to {{thresh}})",
            "syn_expansion": "Expansion Era Synergy"
      },
      "syn": {
            "deadball": {
                  "lv1": "Deadball: 20% chance on single to advance 2 bases.",
                  "lv2": "Deadball: 40% chance on single to advance 2 bases."
            },
            "golden": {
                  "lv1": "Golden Era: All hits deal +6 extra damage.",
                  "lv2": "Golden Era: Hits +12 damage; 30% convert 2B to 3B."
            },
            "integration": {
                  "lv1": "Integration: Player gets +4 to all stats this turn.",
                  "lv2": "Integration: Batter +8 stats; outs heal +5 Stamina."
            },
            "expansion": {
                  "lv1": "Expansion: 50% steal on 1B; steal heals +10 Stamina.",
                  "lv2": "Expansion: 80% steal; steal heals +20 and deals 10 damage."
            },
            "bighair": {
                  "lv1": "Big Hair: Successful steals deal +15 damage to pitcher.",
                  "lv2": "Big Hair: Steals +30 damage and 3-turn debuff."
            },
            "steroid": {
                  "lv1": "Bash Brothers: Home Runs deal +20 extra damage.",
                  "lv2": "Bash Brothers: HR deal +40 damage; 50% sac fly scores."
            },
            "efficiency": {
                  "lv1": "Moneyball: Walks (BB) deal +15 extra damage.",
                  "lv2": "Moneyball: BB deal +25 damage; getting on base inflicts 1-impact fatigue (+20% damage)."
            },
            "modern": {
                  "lv1": "Three True Outcomes: BB deal 15 damage, Strikeouts -50% team damage.",
                  "lv2": "Three True Outcomes: BB deal 24 damage, Strikeouts -50% and don't break streak."
            }
      },
      "game": {
            "super_boss_trigger": "⚡ SUPER BOSS FIGHT! ⚡ You defeated the first group of legends! NOW FACE THE SUPREME ROTATION OF 4 LEGENDS.",
            "true_victory": "🏆 ABSOLUTE CHAMPION! You defeated the Supreme Rotation of 4 Legends! BaseRogue conquered.",
            "boss_victory_trait": "Boss Victory! +${{earnings}}. Choose a Legendary Passive Trait.",
            "boss_win_msg": "Victory! You defeated BOSS {{name}}. +${{earnings}} and elite reward!",
            "win_msg": "Victory! You defeated the rotation of {{name}} in 3 innings. +${{earnings}}!",
            "defeat_msg": "Defeat. 3 innings ended before defeating the full rotation of {{name}}.",
            "champion_eternal": "🏆 CHAMPION OF ETERNITY! You conquered the World Series and won the Playoffs.",
            "lineup_full": "Lineup occupied. Choose who to replace.",
            "division_defeated": "DIVISION DEFEATED!",
            "player_placed_dh": "{{name}} assigned as Designated Hitter (DH)",
            "player_placed_native": "{{name}} assigned to primary position ({{pos}})"
      },
      "training": {
            "con": {
                  "label": "🎯 Standard Contact Session",
                  "desc": "Intensive swing practice. +5 to +7 Contact guaranteed (15% chance of Critical +12!)."
            },
            "pwr": {
                  "label": "💪 Power Training",
                  "desc": "Heavy bat reps. +5 to +7 Power guaranteed (15% chance of Critical +12!)."
            },
            "spd": {
                  "label": "⚡ Speed Drills",
                  "desc": "Base acceleration work. +5 to +7 Speed (15% chance of Critical +12!)."
            },
            "def": {
                  "label": "🛡️ Defensive Technique",
                  "desc": "Fielding and throwing drills. +5 to +7 Defense (15% chance of Critical +12!)."
            },
            "sta": {
                  "label": "🔋 Physical-Biological Recovery",
                  "desc": "Massages and active rest. +35 to +45 Stamina (20% chance of Full Recovery!)."
            },
            "risk": {
                  "label": "🔥 Extreme Power Training",
                  "desc": "Super-heavy lifting. +12 to +14 PWR if successful. 30% risk of muscle strain (-15 Stamina)."
            },
            "badge_fail": "MUSCLE OVERLOAD!",
            "badge_crit": "CRITICAL {{label}}! 💥",
            "badge_ok": "TRAINING {{label}}!",
            "result_fail": "The training was too intense and caused fatigue in {{name}}.",
            "result_crit": "Extraordinary performance! {{name}} had a {{label}}-level session and increased +{{val}} in their stat.",
            "result_ok": "{{name}} completed the {{label}} routine successfully."
      },
      "ev": {
            "cork": {
                  "title": "Corked Bat Offer",
                  "desc": "You are offered altered bats with a corked center to increase swing speed.",
                  "choice1": "Use legal regulation bat",
                  "suc": "Supersonic exit velocity! Extra pop in every at-bat.",
                  "fail": "The bat snapped in two! Fine and suspension issued.",
                  "choice2": "Hidden Corked Bat (HIGH RISK)",
                  "choice3": "Decline the offer"
            },
            "signs": {
                  "title": "The Sign Spy",
                  "desc": "A retired catcher claims to know the secret pitching sequences of the rival pitchers.",
                  "choice1": "Buy VIP Report (+15 EYE, +8 CON)",
                  "choice2": "Street Sign Stealing (+20 EYE)",
                  "suc": "Signs intercepted! Your team gets +20 EYE (Discipline).",
                  "fail": "Caught on camera! The commissioner fines the team -$15 Budget."
            },
            "fitness": {
                  "title": "Retro Physical Trainer",
                  "desc": "A legendary trainer from the 1982 championship offers to coordinate a conditioning routine.",
                  "choice1": "Standard Aerobic Routine (+40 Stamina to all)",
                  "choice2": "Extreme Conditioning (100% Stamina)",
                  "suc": "Miraculous session! The whole roster recovers 100% Stamina.",
                  "fail": "Massive muscle overload! The team exhausts and loses -15 Stamina."
            },
            "hyp": {
                  "title": "Sports Hypnosis Session",
                  "desc": "A sports psychologist offers deep focus mental training.",
                  "choice1": "Motivational Talk",
                  "suc": "Laser focus! Strike zone vision and discipline sharpened.",
                  "fail": "Mental confusion! Batters lose swing timing.",
                  "choice2": "Deep Trance Hypnosis (RISK)",
                  "choice3": "Skip participation"
            },
            "graphene": {
                  "title": "Experimental Alloy Bats",
                  "desc": "A tech lab proposes testing carbon fiber and titanium bats for the next stretch of games.",
                  "choice3": "Pass on the technology",
                  "fail": "The bat shattered! Commissioner sanctions and stat penalties applied.",
                  "choice1": "Buy Regulation Certified Model (-$20)",
                  "choice2": "Hyper-Carbon Prototype (HIGH RISK)",
                  "suc": "Devastating power! Your hitters crush balls with unbelievable exit velocity."
            },
            "tabloid": {
                  "title": "Sensational Tabloid Press",
                  "desc": "A major sports newspaper requests an exclusive interview with your franchise star.",
                  "suc": "Interview sold successfully! Substantial budget boost added.",
                  "fail": "The article sparked drama in the clubhouse! Morale and stamina dropped.",
                  "choice3": "Close Doors to Media",
                  "choice1": "Sell Exclusive Story (+$$ • RISK)",
                  "choice2": "Official Press Conference"
            },
            "cryo": {
                  "title": "Cryotherapy & Hydrotherapy Pod",
                  "desc": "You install a state-of-the-art cryotherapy chamber in the clubhouse.",
                  "choice1": "Experimental Deep Freeze (HIGH RISK)",
                  "choice2": "Quick Ice Bath Session",
                  "choice3": "Skip the recovery chamber",
                  "suc": "Flawless session! Entire team stamina restored to peak condition.",
                  "fail": "Thermal shock! Muscle stiffness leads to roster fatigue."
            },
            "pinetar": {
                  "title": "Special Japanese Pine Tar",
                  "desc": "A specialty supplier offers high-grade grip resin for your batters' bats.",
                  "choice2": "Ultra-Sticky Homemade Blend (RISK)",
                  "fail": "Umpire notices excessive pine tar! Warning and stat penalty.",
                  "choice1": "Pro Grade Pine Tar (-$15)",
                  "choice3": "Stick with standard gear",
                  "suc": "Incredible grip! Immediate boost to barrel control."
            },
            "spikes": {
                  "title": "Experimental Lightweight Cleats",
                  "desc": "A local manufacturer offers ultralight carbon spikes for faster base running.",
                  "fail": "Poor traction! Cleats broke causing base running blunders.",
                  "choice1": "Equip Pro Cleats (-$15)",
                  "choice2": "Titanium Spike Prototype (RISK)",
                  "choice3": "Keep standard footwear",
                  "suc": "Explosive speed! The lineup flies around the base paths."
            },
            "gloves": {
                  "title": "Custom Tanned Leather Gloves",
                  "desc": "A craftsman offers premium cured leather gloves for your infielders.",
                  "choice1": "Buy Legendary Gloves (-$25)",
                  "choice2": "Quick Prototype Glove (RISK)",
                  "choice3": "Keep current fielding gloves",
                  "suc": "Perfect fit! Your defense turns into an iron wall.",
                  "fail": "Leather tore mid-game! Costly defensive fielding errors."
            },
            "choice_reject": "Reject Offer (Do nothing)",
            "choice_clean": "Play Clean (Decline)",
            "choice_skip": "Continue without training",
            "choice_reject_therapy": "Decline Psychotherapy",
            "badge_risk_success": "RISK SUCCEEDED!",
            "badge_taken": "DECISION MADE!",
            "generic_success": "The decision paid off greatly for the ballclub!",
            "generic_fail": "The risky gamble did not turn out as planned.",
            "bribe": {
                  "title": "Desperate Scout Proposition",
                  "desc": "A rogue scout offers confidential scouting reports on the rival rotation for cash.",
                  "choice1": "Report to the Commissioner",
                  "choice2": "Under-the-Table Deal (+$ • RISK)",
                  "choice3": "Ignore the call",
                  "suc": "Deal closed cleanly! Key scouting advantages unlocked.",
                  "fail": "Caught red-handed! League issues a hefty financial fine."
            }
      },
      "sign": {
            "chemistry_active": "Active Chemistry for <strong>{{team}}</strong> (+4 stats)",
            "dynasty_active": "Active Dynasty for <strong>{{team}}</strong> (+10 stats)"
      },
      "ui": {
            "empty": "EMPTY",
            "autosort_tooltip": "Logically sorted: Speed 1st, Power 4th, Best batters 2nd & 3rd.",
            "sec_pos_tooltip": "Secondary Position",
            "trait_choose_desc": "Choose a Passive Trait that will accompany your team until the end of the run:",
            "super_boss_desc": "But the 4 Greatest Baseball Legends jump onto the field for the Final Battle!",
            "hp_restored": "Your team has recovered +30 HP and Max Shield.",
            "active_traits_header": "ACTIVE TEAM TRAITS",
            "trait_pick_btn": "EQUIP TRAIT",
            "super_boss_fight_btn": "⚔️ FACE THE SUPER BOSS!",
            "super_boss_defeated_first_group": "PHASE 1 COMPLETE! Super Boss summons legendary bullpen arms.",
            "super_boss_final_phase_html": "⚡ <strong>FINAL PHASE!</strong> Defeat the shutdown closer to win the run."
      },
      "trait": {
            "eagle": {
                  "name": "🦅 Eagle Patience",
                  "desc": "Walk (BB) zone increases +3 points. Each BB regenerates +5 Stamina to the batter."
            },
            "slugger": {
                  "name": "💥 Slugger Momentum",
                  "desc": "Each HR deals +30 extra HP damage to the rival pitcher."
            },
            "surgical": {
                  "name": "🎯 Surgical Contact",
                  "desc": "Strikeout (SO) zone reduced by -3 points for the whole lineup."
            },
            "speed": {
                  "name": "⚡ Aggressive Speedsters",
                  "desc": "Players with SPD > 60 automatically steal the base on singles and walks. Pitcher debuff lasts 3 impacts."
            },
            "extrabase": {
                  "name": "💣 Accumulated Impact",
                  "desc": "Extra-base hits (2B, 3B, HR) deal +10 extra HP damage to the pitcher."
            },
            "shield": {
                  "name": "🛡️ Iron Shield",
                  "desc": "Shield absorbs 75% of roster average DEF (instead of 50%). Regenerates +5 at the start of each inning."
            },
            "wall": {
                  "name": "🧱 Defensive Wall",
                  "desc": "Normal outs reduce team HP by 8 instead of 12."
            },
            "stamina": {
                  "name": "🔋 Endless Stamina",
                  "desc": "Batters only lose 6 Stamina per match (instead of 12)."
            },
            "clutch": {
                  "name": "❤️ Legends Resilience",
                  "desc": "If Team HP falls below 35, activates Clutch mode: +15 to all stats for the entire lineup."
            },
            "glove": {
                  "name": "🧤 Golden Gauntlet",
                  "desc": "All batters receive +10 DEF, increasing team Shield capacity."
            },
            "secondary": {
                  "name": "🔄 Secondary Position Master",
                  "desc": "Eliminates the -15% penalty when placing batters in their Secondary Position."
            },
            "era_acc": {
                  "name": "⏳ Accelerated Era Synergy",
                  "desc": "You only need 2 players from the same Era to activate Level 2 Synergy (normally 4)."
            },
            "elite": {
                  "name": "💼 Elite Negotiator",
                  "desc": "You get +$10 extra budget after each victory."
            },
            "scout": {
                  "name": "🌟 Scout Eye",
                  "desc": "Draft offers show 4 players instead of 3 and increases Epic/Legendary probability."
            },
            "veteran": {
                  "name": "🔋 Second Life",
                  "desc": "Your full lineup recovers +30% Stamina at the start of each new map."
            },
            "reliever": {
                  "name": "🔥 Reliever Ambush",
                  "desc": "The first hit against a new rival pitcher deals +50% extra damage."
            },
            "pressure": {
                  "name": "📈 Early Pressure",
                  "desc": "The first batter of each inning gains +20 CON and EYE for that turn."
            },
            "ghost": {
                  "name": "🏃 Ghost Runners",
                  "desc": "You start the 3rd inning of each match with a runner on 2nd base automatically."
            },
            "legendary": {
                  "name": "👑 Legendary Domination",
                  "desc": "If you have 2+ Legendary starters, all players receive +10 to all stats."
            },
            "back2back": {
                  "name": "💥 Power Chain",
                  "desc": "After a HR, the next batter gains +20 PWR and CON for that turn."
            }
      },
      "dex": {
            "era_all": "ALL",
            "locked": "LOCKED",
            "search_placeholder": "Search by name, team or position (C, 1B, SS...)...",
            "search_placeholder_pitchers": "Search pitcher by name, team, era or role (SP/RP)...",
            "tab_legends": "⚾ LEGENDS / BATTERS",
            "tab_opponents": "🥊 OPPONENTS (QUICK MATCH)",
            "pos_label": "POS:",
            "role_label": "ROLE:",
            "pos_all": "ALL",
            "counter_legends": "Cards Discovered",
            "counter_opponents": "Opponents Faced",
            "franchise_hist": "Historical Franchise",
            "franchise_nlb": "Negro Leagues",
            "load_more": "Load more",
            "counter": "{{unlocked}} / {{total}} discovered ({{pct}}%)",
            "career_header": "CAREER / CAREER (MLB)",
            "war_label": "WAR",
            "challenge162_filter": "🏆 Only 162-0 Challenge eligible",
            "challenge162_badge_tooltip": "Eligible for the 162-0 Challenge",
            "challenge162_badge_label": "🏆 162-0 CHALLENGE",
            "allstars_label": "All-Star",
            "cy_label": "Cy Young",
            "gg_label": "Gold Glove",
            "mvp_label": "MVP",
            "rel_label": "Reliever of the Year",
            "roy_label": "Rookie of the Year",
            "ss_label": "Silver Slugger"
      },
      "challenge162": {
            "title": "🏆 162-0 CHALLENGE",
            "subtitle": "Can you achieve the perfect 162-0 season with your card collection?",
            "rule_1": "1. Assemble your rotation (5 SP + 3 RP) and starting lineup (9 hitters with DH).",
            "rule_2": "2. Simulate 162 regular season games against historic franchises.",
            "rule_3": "3. Finish with 10 losses or fewer (or go a perfect 162-0) to reach the Playoffs and win the World Series!",
            "btn_start_draft": "🚀 BUILD ROSTER",
            "btn_continue": "▶ CONTINUE SEASON",
            "btn_reset": "🔄 RESET CHALLENGE",
            "builder_title": "BUILD YOUR TEAM",
            "builder_batters": "STARTING HITTERS (9)",
            "builder_sp": "STARTING ROTATION (5 SP)",
            "builder_rp": "RELIEF BULLPEN (3 RP)",
            "builder_pool": "UNLOCKED COLLECTION",
            "builder_search": "Search your collection...",
            "builder_autofill": "⚡ Auto-fill team",
            "builder_start_season": "⚾ START 162-0 SEASON",
            "builder_empty_slot": "(Empty)",
            "season_next_game": "Next Game",
            "season_vs": "vs",
            "season_rival_sp": "RIVAL STARTER",
            "season_sim_1": "▶ SIMULATE 1 GAME",
            "season_sim_10": "⏩ SIMULATE 10",
            "season_sim_until": "⏭ UNTIL NEXT LOSS",
            "season_perfect_title": "🏆 PERFECT SEASON (162-0)! Playoffs unlocked.",
            "season_qualified_title": "🎉 Playoffs unlocked! ({{wins}}-{{losses}})",
            "season_goto_playoffs": "▶ GO TO PLAYOFFS",
            "season_lost_title": "Season finished with {{losses}} loss(es) — no playoffs.",
            "season_missed_title": "Season finished {{wins}}-{{losses}} — missed the playoff cutoff (max {{maxLosses}} losses).",
            "season_near_miss": "So close! Tweak the roster and try again.",
            "season_try_again": "Strengthen the roster and try again.",
            "season_view_results": "VIEW FINAL RESULTS",
            "season_streak": "STREAK OF {{streak}}",
            "season_batters_title": "BATTERS",
            "season_pitchers_title": "PITCHERS",
            "season_recent_games": "RECENT GAMES",
            "season_no_games": "No games played yet.",
            "season_title": "162-0 CHALLENGE",
            "season_regular": "REGULAR SEASON",
            "season_games_count": "Game {{current}} / {{total}}",
            "table_player": "BATTER",
            "game_counter": "Game {{current}} / {{total}}",
            "hub_title": "162-0 CHALLENGE HUB",
            "hub_subtitle": "Choose your regular season and postseason format",
            "best_streak": "BEST STREAK",
            "world_series": "WORLD SERIES",
            "seasons_played": "SEASONS",
            "total_collection": "TOTAL COLLECTION",
            "wins_count": "{{count}} WINS",
            "titles_count": "{{count}} TITLES",
            "seasons_count": "{{count}} PLAYED",
            "cards_count": "{{count}} CARDS",
            "active_run": "SEASON IN PROGRESS: {{mode}}",
            "current_record": "Current record: {{wins}} - {{losses}} ({{current}}/{{total}} games)",
            "resume": "CONTINUE",
            "abandon": "ABANDON",
            "abandon_confirm": "Are you sure you want to abandon the current season? All progress will be lost.",
            "free_draft_badge": "FREE DRAFT",
            "all_star_title": "ALL-STAR DREAM TEAM",
            "all_star_desc": "Build your ultimate dream lineup and pitching staff without restrictions using any card in your collection.",
            "play_all_star": "PLAY ALL-STAR",
            "mono_team_badge": "MONO-TEAM",
            "mono_team_title": "MONO-TEAM CHALLENGE",
            "mono_team_desc": "Compete exclusively with players who wore the jersey of your selected franchise.",
            "play_with_team": "PLAY WITH {{code}}",
            "mono_era_badge": "HISTORIC ERA",
            "mono_era_title": "MONO-ERA CHALLENGE",
            "mono_era_desc": "Travel back in time and compete exclusively with stars from one of baseball's 9 golden eras.",
            "play_with_era": "PLAY {{era}}",
            "autofill": "AUTO-FILL",
            "clear_roster": "CLEAR",
            "hub_btn": "HUB",
            "team_ovr": "TEAM OVR",
            "roster_count": "ROSTER",
            "choose_card_for": "CHOOSE CARD FOR [{{slot}}]",
            "cards_available": "{{count}} cards available for this position",
            "search_placeholder": "Search player by name or team...",
            "no_cards_found": "No unlocked cards found for [{{slot}}] in this mode.",
            "close": "CLOSE",
            "infield": "INFIELD",
            "outfield_dh": "OUTFIELD & DH",
            "lineup_title": "STARTING LINEUP (9 CARDS)",
            "rotation_title": "STARTING ROTATION (5 CARDS)",
            "bullpen_title": "BULLPEN RELIEVERS (3 CARDS)",
            "start_season": "START 162-0 SEASON",
            "auto_sim_run": "PAUSE AUTO SIM",
            "auto_sim_start": "AUTO SIM (1 BY 1)",
            "main_menu": "MAIN MENU",
            "playoffs_title": "BASEROGUE POSTSEASON",
            "playoffs_subtitle": "3 Single-Elimination Rounds (Sudden Death) · {{desc}}",
            "bracket_round": "ROUND {{round}}",
            "step_locked": "🔒 LOCKED",
            "step_done": "✔ CLEARED",
            "step_active": "⚔ ACTIVE",
            "your_team": "YOUR TEAM ({{wins}}-{{losses}})",
            "ace_pitcher": "Ace Pitcher",
            "season_era": "Season ERA",
            "offensive_leader": "Offensive Leader",
            "roster_record": "Roster Depth",
            "drafted_cards": "17 Drafted Cards",
            "boss_difficulty": "Boss Difficulty",
            "stat_boost": "+{{boost}} to all ratings",
            "rival_sp_hp": "Rival SP HP",
            "extra_hp": "{{pct}}% extra",
            "offensive_danger": "Offensive Threat",
            "play_playoff_btn": "🎲 PLAY {{label}}! (DO OR DIE MATCH)",
            "view_stats_table": "📊 VIEW STATS TABLE",
            "perfect_champion_title": "👑 PERFECT 162-0 SEASON & WORLD CHAMPION!",
            "perfect_champion_desc": "🏆 162-0 REGULAR + 3-0 PLAYOFFS (165-0 UNDEFEATED) · IMMORTALITY ACHIEVED!",
            "ws_champion_title": "🏆 WORLD SERIES CHAMPION!",
            "ws_champion_desc": "👑 You lifted the trophy ({{wins}}-{{losses}} Regular + 3-0 Playoffs)",
            "playoff_end_title": "END OF POSTSEASON",
            "playoff_end_desc": "Great campaign ended in: {{round}}",
            "regular_end_title": "REGULAR SEASON FINISHED",
            "regular_end_desc": "Record: {{wins}}-{{losses}} (Minimum 100 wins required to qualify)",
            "postseason_label": "POSTSEASON",
            "dynasty_status": "DYNASTY STATUS",
            "status_undefeated": "👑 SUPREME UNDEFEATED",
            "status_champion": "👑 WORLD CHAMPION",
            "status_finalist": "🥈 FINALIST",
            "status_contender": "⚾ CONTENDER",
            "mvp_award": "🏆 DYNASTY MVP",
            "cy_young_award": "🧢 CY YOUNG AWARD",
            "hr_king_award": "💣 HOME RUN KING",
            "reliever_award": "🔥 RELIEVER OF THE YEAR",
            "ring_of_champions": "💍 RING OF 17 CHAMPIONS (FULL ROSTER)",
            "new_challenge_btn": "🔄 START NEW CHALLENGE",
            "table_pitcher": "PITCHER",
            "table_role": "ROLE"
      },
      "badge": {
            "captain_tooltip": "Captain: +5 to all ratings for teammates while on active roster.",
            "clutch_tooltip": "Clutch Player: +2% single and double chance, +4% HR chance with runners in scoring position during final inning.",
            "challenge162_tooltip": "Eligible for the 162-0 Challenge: was part of a roster that won a full run (Quick Play or Story Mode).",
            "interera_label": "TIME TRAVELER",
            "interera_tooltip": "Time Traveler: this player was not active during the selected season — counts double toward unlocking their own era's synergy."
      },
      "combat_info": {
            "title": "⚙️ DAMAGE DATA & VALUES",
            "out": "<strong style=\"color: #9ca3af;\">🤚 OUT (Flyout/Groundout):</strong> Subtracts <span style=\"color:#ef4444;font-weight:bold;\">-16 HP</span> from Shield (upon breaking, subtracts from team HP).",
            "so": "<strong style=\"color: #ef4444;\">💨 STRIKEOUT (SO):</strong> Subtracts <span style=\"color:#ef4444;font-weight:bold;\">-16 HP</span> directly from HP (ignores shield).<div style=\"font-size: 8.5px; color: #a855f7; margin-top: 2px;\">🔥 Streak: 1st (-16) • 2nd (-22) • 3rd+ (-28 HP)</div>",
            "pitcher_title": "<strong style=\"color: #10b981;\">⚾ RIVAL PITCHER DAMAGE:</strong>",
            "bb": "<span>🚶 BB: <b style=\"color:#3b82f6;\">10 HP</b></span>",
            "single": "<span>✅ 1B: <b style=\"color:#a7f3d0;\">15 HP</b></span>",
            "double": "<span>⚡ 2B: <b style=\"color:#10b981;\">30 HP</b></span>",
            "triple": "<span>🔥 3B: <b style=\"color:#06b6d4;\">45 HP</b></span>",
            "hr": "🚀 <strong>HR (Home Run):</strong> <b style=\"color:#eab308;\">70 HP base</b>",
            "rbi_bonus": "🏆 <strong>RBI Bonus:</strong> Each RBI adds <strong style=\"color:#00ff66;\">+10 extra HP</strong> damage to pitcher.",
            "defense": "<strong style=\"color: #38bdf8;\">🛡️ DEFENSIVE DUEL (Bottom of Inning):</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">Success (20% + 0.70×DEF): <strong style=\"color:#4ade80;\">+30 HP & +15 Shield</strong> • Error: <strong style=\"color:#f87171;\">-15 Damage</strong>.</div>",
            "steal": "<strong style=\"color: #38bdf8;\">🏃 BASE STEALING (SPD ≥ 40):</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">On 1B or BB with 2B open: attempts to steal (15% + 0.70×SPD). Grants <strong style=\"color:#38bdf8;\">+20% damage</strong> to pitcher for 2 impacts.</div>",
            "upgrade": "<strong style=\"color: #a855f7;\">⚡ HIT UPGRADES:</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">With <strong>SPD ≥ 70</strong> (Grades B+ to S), runners have <strong>15% to 50% chance</strong> to stretch hits into extra bases (1B→2B→3B).</div>",
            "shield_max": "🛡️ Max shield: 50 (50% of average DEF of your 8 starters).",
            "tooltip": "Damage System & Combat Rules"
      },
      "run_intro": {
            "title": "WELCOME TO BASEROGUE",
            "desc": "Build your 9-batter lineup through draft rounds, arrange them tactically on the field, and advance by defeating rival pitching rotations. Roll the dice each turn to claim the championship!",
            "dont_show_again": "Don't show again",
            "start_btn": "⚾ START RUN!"
      },
      "traits": {
            "eagle_patience": "Eagle Patience",
            "veteran_rotation": "Veteran Rotation",
            "clutch_legends": "Clutch Legends",
            "speed_demons": "Speed Demons",
            "slugger_momentum": "Slugger Momentum",
            "defensive_wall": "Defensive Wall",
            "surgical_contact": "Surgical Contact",
            "early_pressure": "Early Pressure",
            "reliever_ambush": "Reliever Ambush",
            "iron_shield": "Iron Shield",
            "ghost_runners": "Ghost Runners",
            "extra_base_impact": "Extra Base Impact",
            "era_accelerated": "Era Accelerated",
            "golden_glove": "Gold Glove",
            "legendary_domination": "Legendary Domination",
            "secondary_master": "Secondary Position Master",
            "scout_eye": "Scout's Eye",
            "elite_negotiator": "Elite Negotiator",
            "endless_stamina": "Endless Stamina"
      },
      "chest": {
            "claim_btn": "CLAIM REWARD",
            "claim_trait_btn": "EQUIP TRAIT",
            "empty_desc": "The treasure chest was empty in this stadium sector.",
            "empty_title": "EMPTY CHEST",
            "found_title": "YOU FOUND A TREASURE CHEST!"
      },
      "gamble": {
            "header": "CLUBHOUSE BETTING & DEALS",
            "choose_target": "Select target player:",
            "bet_btn": "🎲 GAMBLE",
            "reject_btn": "PASS BY",
            "success_pct": "Success Chance",
            "fail_pct": "Failure Chance",
            "no_player_found": "No eligible players found",
            "no_valid_era_players": "No players from this era",
            "budget": {
                  "title": "Clubhouse Financial Gamble",
                  "desc": "Invest funds in sponsorship markets for potential cash gains.",
                  "result_win": "Great return! Added +$ budget.",
                  "result_lose": "Bad investment. Lost the wagered funds."
            },
            "scout": {
                  "title": "Special Training Drill",
                  "desc": "Intensive drill session to boost a chosen player's ratings.",
                  "no_injury_target": "No injured players",
                  "no_target": "No valid target",
                  "result_win": "Training succeeded! Ratings increased.",
                  "result_lose": "Overexertion! Player suffered fatigue."
            },
            "synergy": {
                  "title": "Era Alchemy Pact",
                  "desc": "Attempt to forge player affinity with your primary era synergy.",
                  "no_valid_target": "No eligible players",
                  "result_win": "Affinity successfully established!",
                  "result_lose": "No synergy connection formed.",
                  "result_lose_none": "No synergy changes."
            },
            "trade": {
                  "title": "Surprise Mystery Trade",
                  "desc": "Negotiate a blind player swap with the league office.",
                  "no_target": "No cards available to trade",
                  "result_win": "Star player acquired in the deal!",
                  "result_lose": "Trade resulted in a minor role player."
            }
      },
      "tutorial": {
            "got_it": "GOT IT!",
            "skip_all": "SKIP TUTORIAL"
      },
      "career": {
            "ace_matchup_named": "Facing {{pitcher}} of the {{team}}, all eyes on you.",
            "ace_matchup_team": "Facing the {{team}} and their top ace, all eyes on you.",
            "choose_card": "SELECT",
            "continue": "Continue",
            "contract_auto_renew": "Still under contract",
            "contract_label": "Contract",
            "contract_offer_years": "{{years}}-Year Contract",
            "contract_prompt": "Stay with your current team or sign elsewhere?",
            "diff_easy": "Easy",
            "diff_medium": "Medium",
            "diff_hard": "Hard",
            "diff_impossible": "Impossible",
            "diff_random": "Random",
            "difficulty_desc": "Choose your career difficulty level:",
            "difficulty_title": "CAREER DIFFICULTY",
            "draft_continue": "CONTINUE DRAFT",
            "draft_reveal_title": "TEAM ASSIGNED!",
            "draft_status": "Lottery in progress...",
            "draft_status_done": "Drafted!",
            "event_progress": "Event {{current}} of {{total}}",
            "events_done": "Season events complete!",
            "finish_season": "VIEW SEASON SUMMARY",
            "games": "games",
            "go_offseason": "PROCEED TO OFFSEASON",
            "hof_inducted": "ELECTED TO THE HALL OF FAME",
            "hof_not_inducted": "NOT ELECTED • 75% REQUIRED",
            "hof_progress": "Hall of Fame Progress",
            "hof_votes_label": "votes",
            "hub_age": "Age",
            "hub_current": "Current OVR",
            "hub_current_year": "Season",
            "hub_debut": "Debut",
            "hub_difficulty": "Difficulty",
            "hub_hof_score": "HOF Score",
            "hub_play_season": "PLAY SEASON",
            "hub_potential": "Potential (OVR)",
            "hub_team": "Team",
            "hub_title": "CAREER HUB",
            "leaderboard_title": "LEAGUE STANDINGS",
            "mvp_winner_label": "Season MVP",
            "nemesis_label": "Career Nemesis",
            "new_career": "START NEW CAREER",
            "no_awards": "No awards this season",
            "no_picks": "No prospects available for this difficulty.",
            "offseason_done": "Offseason complete! Ready for the next season.",
            "offseason_event_prompt": "Offseason development opportunity unfolds.",
            "other_league_player": "Other league player",
            "pack_title": "SELECT YOUR PROSPECT",
            "pathway_prompt": "How did you reach the Major Leagues?",
            "pathway_title": "PATHWAY TO DEBUT",
            "pick_btn": "SELECT",
            "play_signature": "SPIN ROULETTE",
            "play_situational": "SPIN ROULETTE",
            "playoff_vs": "vs.",
            "potential_short": "POT",
            "profile_history_title": "SEASON HISTORY",
            "profile_no_seasons": "No seasons played yet.",
            "profile_no_trophies": "Empty trophy case — for now.",
            "profile_trophy_case": "TROPHY CASE",
            "progress_title": "PROGRESSION",
            "record": "Record",
            "reputation_label": "Reputation",
            "retired_msg": "Your player has retired.",
            "risk_tag": "REPUTATION RISK",
            "role_bench": "Bench",
            "role_bench_desc": "Fewer opportunities, slow and steady growth",
            "role_rotation": "Rotation",
            "role_rotation_desc": "Balanced playing time, standard development",
            "role_starter": "Starter",
            "role_starter_desc": "More at-bats, high pressure — faster development",
            "safe_tag": "SAFE",
            "season_end_title": "SEASON FINALE",
            "season_quality": "Season Score",
            "season_title": "SEASON",
            "see_hof_verdict": "VIEW HALL OF FAME VERDICT",
            "shop_active_for": "Active for",
            "shop_balance": "Balance",
            "shop_buy": "PURCHASE",
            "shop_cant_afford": "INSUFFICIENT FUNDS",
            "shop_cost": "Cost",
            "signature_desc": "Spin the roulette wheel to determine your performance in the decisive stretch.",
            "signature_title": "MOMENT OF THE SEASON",
            "spin_wheel": "SPIN",
            "stakes_routine": "ROUTINE",
            "stakes_notable": "NOTABLE",
            "stakes_decisive": "DECISIVE",
            "standings_league": "League",
            "standings_none": "No league data available for this year.",
            "standings_title": "STANDINGS",
            "team_tier_champion": "Title Contender",
            "team_tier_competitive": "Competitive",
            "team_tier_rebuild": "Rebuilding",
            "totals_avg": "AVG",
            "totals_hr": "HR",
            "totals_pj": "G",
            "totals_rbi": "RBI",
            "totals_seasons": "YRS",
            "wear_label": "Wear & Tear",
            "win_pct_label": "win rate",
            "winter_injured_note": "next season",
            "year_singular": "year",
            "years_remaining": "remaining",
            "years_short": "years",
            "you": "You"
      },
      "eagle_patience": "Eagle Patience",
      "veteran_rotation": "Veteran Rotation",
      "clutch_legends": "Clutch Legends",
      "speed_demons": "Speed Demons",
      "slugger_momentum": "Slugger Momentum",
      "defensive_wall": "Defensive Wall",
      "surgical_contact": "Surgical Contact",
      "early_pressure": "Early Pressure",
      "reliever_ambush": "Reliever Ambush",
      "iron_shield": "Iron Shield",
      "ghost_runners": "Ghost Runners",
      "extra_base_impact": "Extra Base Impact",
      "era_accelerated": "Era Accelerated",
      "golden_glove": "Gold Glove",
      "legendary_domination": "Legendary Domination",
      "secondary_master": "Secondary Position Master",
      "scout_eye": "Scout's Eye",
      "elite_negotiator": "Elite Negotiator",
      "endless_stamina": "Endless Stamina",
      "back_to_back": "Back-to-Back Blast"
}
    }
  };

  let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';

  function init() {
    if (typeof i18next !== 'undefined') {
      i18next.init({
        lng: currentLang,
        fallbackLng: 'en',
        resources: resources,
        interpolation: {
          escapeValue: false // React / standard HTML escape
        }
      }, function (err, t) {
        if (err) console.error('i18next init error:', err);
        updateUI();
      });
    } else {
      console.warn('i18next is not loaded yet');
    }
  }

  function t(key, options) {
    if (typeof i18next !== 'undefined' && i18next.isInitialized) {
      return i18next.t(key, options);
    }
    // Simple fallback if i18next is missing
    const dict = resources[currentLang]?.translation || resources.en.translation;
    const keys = key.split('.');
    let val = dict;
    for (const k of keys) {
      val = val ? val[k] : null;
    }
    if (typeof val === 'string' && options) {
      Object.keys(options).forEach(opt => {
        val = val.replace(new RegExp(`{{\\s*${opt}\\s*}}`, 'g'), options[opt]);
      });
    }
    return val || key;
  }

  function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    if (typeof i18next !== 'undefined' && i18next.isInitialized) {
      i18next.changeLanguage(lang, () => {
        updateUI();
      });
    } else {
      updateUI();
    }
  }

  function updateUI() {
    document.documentElement.lang = currentLang;

    // Update Language Toggle Button in Header
    const btnLang = document.getElementById('btn-lang-toggle');
    if (btnLang) {
      btnLang.innerText = currentLang === 'es' ? '🌐 ES' : '🌐 EN';
    }

    // Update all static HTML elements with data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const paramsAttr = el.getAttribute('data-i18n-params');
      let params = {};
      if (paramsAttr) {
        try {
          params = JSON.parse(paramsAttr);
        } catch (e) {}
      }
      el.innerText = t(key, params);
    });

    // Update all static HTML elements with data-i18n-html
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const paramsAttr = el.getAttribute('data-i18n-params');
      let params = {};
      if (paramsAttr) {
        try {
          params = JSON.parse(paramsAttr);
        } catch (e) {}
      }
      el.innerHTML = t(key, params);
    });

    // Update all static HTML elements with data-i18n-title (tooltip/title attribute)
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const paramsAttr = el.getAttribute('data-i18n-params');
      let params = {};
      if (paramsAttr) {
        try {
          params = JSON.parse(paramsAttr);
        } catch (e) {}
      }
      el.title = t(key, params);
    });

    // Re-render components that depend on current language if active
    if (window.Game && window.UI) {
      if (typeof window.UI.renderActiveRoster === 'function') window.UI.renderActiveRoster();
      if (typeof window.UI.renderSynergiesAndItems === 'function') window.UI.renderSynergiesAndItems();
      if (typeof window.UI.updateHUD === 'function') window.UI.updateHUD();
    }
    if (window.AudioManager && typeof window.AudioManager.updateMuteButton === 'function') {
      window.AudioManager.updateMuteButton();
    }
    if (window.Challenge162 && typeof window.Challenge162.updateModeSelectCard === 'function') {
      window.Challenge162.updateModeSelectCard();
    }
  }

  // Expose global i18n object
  window.i18n = {
    init,
    t,
    changeLanguage,
    getCurrentLanguage: () => currentLang,
    updateUI
  };

  window.t = t;

  // Initialize immediately: this script tag sits after the game's data-i18n
  // markup in the DOM, so those elements already exist by the time this
  // executes — no need to wait for DOMContentLoaded, which would otherwise
  // get gated behind several megabytes of unrelated data scripts loaded
  // later in the page (career_data.js, opponents_database.js, etc.) and
  // leave the Spanish fallback text visible on screen until those finish.
  init();
})();
