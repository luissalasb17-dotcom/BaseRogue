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
        "badge": {
                "clutch_tooltip": "Clutch Player: +4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.",
                "captain_tooltip": "Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo."
        },
        "sidebar": {
                "upgrades": "<i class=\"fa-solid fa-suitcase\"></i> MEJORAS",
                "no_items": "NADA COMPRADO",
                "eras_header": "ERAS DEL ROSTER",
                "franchises_header": "FRANQUICIAS DEL ROSTER",
                "no_teams": "Ningún equipo registrado.",
                "dynasty_desc": "Dinastía (4+): Jugadores de {{team}} obtienen +10 a todos sus stats en combate.",
                "chemistry_desc": "Química (2+): Jugadores de {{team}} obtienen +4 a todos sus stats en combate."
        },
        "eras": {
                "header": "⏳ ERAS DEL ROSTER",
                "franchises_header": "⚾ FRANQUICIAS DEL ROSTER",
                "genesis_d1": "T1 (2+): 20% prob en hit (1B)+1 doble, avanza bases!",
                "genesis_d2": "T2 (4+): 35% prob en hit (1B)+1 doble, avanza bases!",
                "deadball_d1": "T1 (2+): 20% prob en hit sencillo de avanzar 2 bases",
                "deadball_d2": "T2 (4+): 40% prob en hit sencillo de avanzar 2 bases",
                "golden_d1": "T1 (2+): Todos los hits hacen +6 daño adicional",
                "golden_d2": "T2 (4+): Hits +12 daño; 30% de convertir 2B en 3B",
                "integration_d1": "T1 (2+): Jugador obtiene +4 a todos sus stats en base",
                "integration_d2": "T2 (4+): Bateador +8 stats; outs curan +5 Stamina",
                "speed_d1": "T1 (2+): 50% robo en 1B; robo cura +10 Stamina",
                "speed_d2": "T2 (4+): 80% robo; robo cura +20 y hace 10 daño",
                "astroturf_d1": "T1 (2+): Robos exitosos hacen +15 daño al lanzador",
                "astroturf_d2": "T2 (4+): Robos +30 daño y debuff de 3 turnos al rival",
                "steroid_d1": "T1 (2+): Jonrones (HR) hacen +20 daño adicional",
                "steroid_d2": "T2 (4+): HR hacen +40 daño; 50% fly sac anotador",
                "moneyball_d1": "T1 (2+): Bases por bolas (BB) hacen +10 daño extra",
                "moneyball_d2": "T2 (4+): BB hacen +20 daño; outs hacen +10 daño",
                "tto_d1": "T1 (2+): BB hacen 15 daño, Ponche -50% daño al equipo",
                "tto_d2": "T2 (4+): BB hacen 24 daño, Ponche -50% y no corta racha"
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
                "node_boss": "BOSS"
        },
        "ratings_guide": {
                "title": "📊 GUÍA DE RATINGS",
                "con": "<strong style=\"color:#a7f3d0;\">CON — Contacto:</strong> Determina la probabilidad de conectar un batazo. Jugadores con alto CON tienen más chances de sencillos e hits en general.",
                "pwr": "<strong style=\"color:#f59e0b;\">PWR — Poder:</strong> Probabilidad de conectar extra-bases (dobles, triples, jonrones). También aumenta el daño al pitcher rival en hits largos.",
                "eye": "<strong style=\"color:#3b82f6;\">EYE — Ojo/Vista:</strong> Probabilidad de obtener boletos (BB). Reduce la zona de ponches. Clave para no recibir daño directo al HP.",
                "spd": "<strong style=\"color:#38bdf8;\">SPD — Velocidad:</strong> Activa intentos de robo de base en sencillos (debuff +20% daño al pitcher). También mejora la probabilidad de convertir hits en extra-bases.",
                "def": "<strong style=\"color:#a855f7;\">DEF — Defensa:</strong> Contribuye al <strong>Escudo</strong> del equipo. Cuanto mayor DEF promedio, más escudo tienes disponible para absorber OUTs antes de perder HP."
        },
        "mode_select": {
                "app_title": "⚾ BASE-ROGUE",
                "select_mode": "SELECCIONA EL MODO DE JUEGO",
                "story_title": "MODO HISTORIA",
                "story_subtitle": "TEMPORADAS 1901 – 2025",
                "story_desc": "Compite en cualquier año histórico de la MLB. Enfréntate a los equipos reales de esa temporada y a sus 3 mejores lanzadores hasta llegar al Campeón de la Serie Mundial.",
                "story_btn": "⚾ SELECCIONAR TEMPORADA",
                "quick_title": "PARTIDA RÁPIDA",
                "quick_subtitle": "MODO CLÁSICO",
                "quick_desc": "La experiencia clásica BaseRogue, enfrentate a oponentes legendarios de distintas eras",
                "quick_btn": "🚀 JUGAR MODO CLÁSICO"
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
                "drag_to_reorder": "Arrastra para reordenar"
        },
        "pre_fight": {
                "title": "<i class=\"fa-solid fa-shield-halved\"></i> Preparación de la Serie",
                "subtitle": "Te enfrentas a la serie contra {{team}}. Asegúrate de que tus bateadores estén listos.",
                "batters_title": "<i class=\"fa-solid fa-users\"></i> Tus Bateadores (HP)",
                "pitchers_title": "<i class=\"fa-solid fa-skull-crossbones\"></i> Rotación Oponente (HP)",
                "start_btn": "<i class=\"fa-solid fa-fire-flame-curved\"></i> ¡AL COMBATE!",
                "back_map_btn": "<i class=\"fa-solid fa-arrow-left\"></i> Volver al Mapa"
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
                "debuff_badge": "⚡ DEBUFF: +20% DAÑO ({{turns}}t)",
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
                "see_results": "VER RESULTADOS"
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
                "sponsor_btn": "<i class=\"fa-solid fa-circle-dollar-to-slot\"></i> Cobrar Patrocinio"
        },
        "event": {
                "title": "<i class=\"fa-solid fa-clipboard-question\"></i> Oficina del Mánager",
                "desc": "Toma una decisión crítica para el club. Cada elección tiene repercusiones en el presupuesto, salud o estadísticas del equipo."
        },
        "gameover": {
                "title": "¡Fin de la Carrera!",
                "history_title": "<i class=\"fa-solid fa-clock-rotate-left\"></i> Resumen de Temporada",
                "replay_title": "¿Listo para otra temporada?",
                "replay_desc": "Selecciona una nueva leyenda inicial y recluta diferentes plantillas para desbloquear otras sinergias históricas.",
                "restart_btn": "<i class=\"fa-solid fa-rotate-right\"></i> Jugar de Nuevo"
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
                "synergies": "<i class=\"fa-solid fa-bolt\"></i> SINERGIAS"
        }
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
        "badge": {
                "clutch_tooltip": "Clutch Player: +4% hit probability and +4% HR probability with runners in scoring position during the final inning.",
                "captain_tooltip": "Captain: +5 to all ratings for teammates while on the active roster."
        },
        "sidebar": {
                "upgrades": "<i class=\"fa-solid fa-suitcase\"></i> UPGRADES",
                "no_items": "NOTHING PURCHASED",
                "eras_header": "ROSTER ERAS",
                "franchises_header": "ROSTER FRANCHISES",
                "no_teams": "No registered team.",
                "dynasty_desc": "Dynasty (4+): {{team}} players gain +10 to all stats in combat.",
                "chemistry_desc": "Chemistry (2+): {{team}} players gain +4 to all stats in combat."
        },
        "eras": {
                "header": "⏳ ROSTER ERAS",
                "franchises_header": "⚾ ROSTER FRANCHISES",
                "genesis_d1": "T1 (2+): 20% chance on hit (1B)+1 double, advances bases!",
                "genesis_d2": "T2 (4+): 35% chance on hit (1B)+1 double, advances bases!",
                "deadball_d1": "T1 (2+): 20% chance on single to advance 2 bases",
                "deadball_d2": "T2 (4+): 40% chance on single to advance 2 bases",
                "golden_d1": "T1 (2+): All hits deal +6 additional damage",
                "golden_d2": "T2 (4+): Hits +12 damage; 30% to upgrade 2B to 3B",
                "integration_d1": "T1 (2+): Player gains +4 to all stats on base",
                "integration_d2": "T2 (4+): Batter +8 stats; outs restore +5 Stamina",
                "speed_d1": "T1 (2+): 50% steal on 1B; steal heals +10 Stamina",
                "speed_d2": "T2 (4+): 80% steal; steal heals +20 and deals 10 damage",
                "astroturf_d1": "T1 (2+): Successful steals deal +15 damage to pitcher",
                "astroturf_d2": "T2 (4+): Steals +30 damage and 3-turn debuff to rival",
                "steroid_d1": "T1 (2+): Home Runs (HR) deal +20 additional damage",
                "steroid_d2": "T2 (4+): HR deal +40 damage; 50% sac fly scoring",
                "moneyball_d1": "T1 (2+): Walks (BB) deal +10 extra damage",
                "moneyball_d2": "T2 (4+): BB deal +20 damage; outs deal +10 damage",
                "tto_d1": "T1 (2+): BB deal 15 damage, Strikeouts -50% team damage",
                "tto_d2": "T2 (4+): BB deal 24 damage, Strikeouts -50% and don't break streak"
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
                "node_boss": "BOSS"
        },
        "ratings_guide": {
                "title": "📊 RATINGS GUIDE",
                "con": "<strong style=\"color:#a7f3d0;\">CON — Contact:</strong> Determines the probability of making contact. High CON players have higher chances of singles and hits overall.",
                "pwr": "<strong style=\"color:#f59e0b;\">PWR — Power:</strong> Probability of extra-base hits (doubles, triples, home runs). Also increases damage to opponent pitcher on deep hits.",
                "eye": "<strong style=\"color:#3b82f6;\">EYE — Vision/Eye:</strong> Probability of getting walks (BB). Reduces strikeout zone. Crucial to avoid direct HP damage.",
                "spd": "<strong style=\"color:#38bdf8;\">SPD — Speed:</strong> Triggers base stealing attempts on singles (+20% pitcher damage debuff). Also improves chance of converting hits to extra bases.",
                "def": "<strong style=\"color:#a855f7;\">DEF — Defense:</strong> Contributes to team <strong>Shield</strong>. Higher average DEF gives you more shield to absorb OUTs before losing HP."
        },
        "mode_select": {
                "app_title": "⚾ BASE-ROGUE",
                "select_mode": "SELECT GAME MODE",
                "story_title": "STORY MODE",
                "story_subtitle": "SEASONS 1901 – 2025",
                "story_desc": "Compete in any historical MLB season. Face real teams from that era and their top 3 pitchers all the way to the World Series Champion.",
                "story_btn": "⚾ SELECT SEASON",
                "quick_title": "QUICK PLAY",
                "quick_subtitle": "CLASSIC MODE",
                "quick_desc": "The classic BaseRogue experience, face legendary opponents from different eras",
                "quick_btn": "🚀 PLAY CLASSIC MODE"
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
                "drag_to_reorder": "Drag to reorder"
        },
        "pre_fight": {
                "title": "<i class=\"fa-solid fa-shield-halved\"></i> Series Preparation",
                "subtitle": "You face the series against {{team}}. Make sure your batters are ready.",
                "batters_title": "<i class=\"fa-solid fa-users\"></i> Your Batters (HP)",
                "pitchers_title": "<i class=\"fa-solid fa-skull-crossbones\"></i> Opponent Rotation (HP)",
                "start_btn": "<i class=\"fa-solid fa-fire-flame-curved\"></i> TO BATTLE!",
                "back_map_btn": "<i class=\"fa-solid fa-arrow-left\"></i> Back to Map"
        },
        "match": {
                "title": "<i class=\"fa-solid fa-trophy\"></i> Batters to Battle",
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
                "debuff_badge": "⚡ DEBUFF: +20% DAMAGE ({{turns}}t)",
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
                "see_results": "VIEW RESULTS"
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
                "sponsor_btn": "<i class=\"fa-solid fa-circle-dollar-to-slot\"></i> Collect Sponsorship"
        },
        "event": {
                "title": "<i class=\"fa-solid fa-clipboard-question\"></i> Manager's Office",
                "desc": "Make a critical decision for the club. Each choice affects budget, health, or team stats."
        },
        "gameover": {
                "title": "Run Over!",
                "history_title": "<i class=\"fa-solid fa-clock-rotate-left\"></i> Season Summary",
                "replay_title": "Ready for another season?",
                "replay_desc": "Select a new starter legend and recruit different rosters to unlock other historical synergies.",
                "restart_btn": "<i class=\"fa-solid fa-rotate-right\"></i> Play Again"
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
                "match": "<i class=\"fa-solid fa-trophy\"></i> Batters to Battle",
                "event": "<i class=\"fa-solid fa-clipboard-question\"></i> Manager's Office",
                "train": "<i class=\"fa-solid fa-dumbbell\"></i> Batting Cage / Bullpen",
                "rest": "<i class=\"fa-solid fa-couch\"></i> Clubhouse (Rest)",
                "gameover": "Run Over!",
                "synergies": "<i class=\"fa-solid fa-bolt\"></i> SYNERGIES"
        }
}
    }
  };

  let currentLang = localStorage.getItem(STORAGE_KEY) || 'es';

  function init() {
    if (typeof i18next !== 'undefined') {
      i18next.init({
        lng: currentLang,
        fallbackLng: 'es',
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
    const dict = resources[currentLang]?.translation || resources.es.translation;
    const keys = key.split('.');
    let val = dict;
    for (const k of keys) {
      val = val ? val[k] : null;
    }
    if (typeof val === 'string' && options) {
      Object.keys(options).forEach(opt => {
        val = val.replace(new RegExp(`{\\s*${opt}\\s*}`, 'g'), options[opt]);
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

    // Re-render active views if open
    if (typeof window.renderDraftRound === 'function' && window.Game && window.Game.draftRound && window.Game.draftRound <= 9) {
      window.renderDraftRound();
    }
    if (typeof window.renderSynergiesAndItems === 'function') {
      window.renderSynergiesAndItems();
    }
    if (typeof window.renderZones === 'function') {
      window.renderZones();
    }
  }

  // Expose global methods
  window.i18n = {
    init,
    t,
    changeLanguage,
    getCurrentLanguage: () => currentLang,
    updateUI
  };
  window.t = t;

  // Auto-init when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
