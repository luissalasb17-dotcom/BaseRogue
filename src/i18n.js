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
                "node_world_series": "SERIE MUNDIAL"
        },
        "ratings_guide": {
                "title": "📊 GUÍA DE RATINGS",
                "con": "<strong style=\"color:#a7f3d0;\">CON — Contacto:</strong> Determina la probabilidad de conectar un batazo. Jugadores con alto CON tienen más chances de sencillos e hits en general.",
                "pwr": "<strong style=\"color:#f59e0b;\">PWR — Poder:</strong> Probabilidad de conectar extra-bases (dobles, triples, jonrones). También aumenta el daño al pitcher rival en hits largos.",
                "eye": "<strong style=\"color:#3b82f6;\">EYE — Ojo/Vista:</strong> Probabilidad de obtener boletos (BB). Reduce la zona de ponches. Clave para no recibir daño directo al HP.",
                "spd": "<strong style=\"color:#38bdf8;\">SPD — Velocidad:</strong> Activa intentos de robo de base en sencillos (debuff +20% daño al pitcher). También mejora la probabilidad de convertir hits en extra-bases.",
                "def": "<strong style=\"color:#a855f7;\">DEF — Defensa:</strong> Contribuye al <strong>Escudo</strong> del equipo. Cuanto mayor DEF promedio, más escudo tienes disponible para absorber OUTs antes de perder HP.",
                "captain": "<strong style=\"color:#eab308;\">👑 CAPTAIN:</strong> +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.",
                "clutch": "<strong style=\"color:#ef4444;\">⚡ CLUTCH PLAYER:</strong> +2% de probabilidad de sencillo y doble, +4% de HR con corredores en posición de anotar o durante la última entrada."
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
                "outcome_defeat": "DERROTA. Tu alineación ha sido noqueada por los lanzadores rivales."
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
                "desc": "Toma una decisión crítica para el club. Cada elección tiene repercusiones en el presupuesto, salud o estadísticas del equipo."
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
                "tab_pitchers": "Lanzadores Enfrentados"
        },
        "victory": {
                "title": "¡CAMPEÓN ABSOLUTO DE BASEROGUE!",
                "desc": "¡Conquistaste la fase final y derrotaste a la Rotación Suprema de 4 Leyendas! Tu alineación pasa a la historia del béisbol roguelike.",
                "summary_btn": "<i class=\"fa-solid fa-chart-column\"></i> Ver Resumen de la Run",
                "replay_btn": "<i class=\"fa-solid fa-rotate-right\"></i> Jugar Nuevamente"
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
                "inning_end": "--- FIN DE LA ENTRADA {{inning}} ({{runs}} carreras anotadas) ---",
                "match_timeout": "⏱ FIN DE PARTIDO (3 innings). Te faltaron {{remaining}} lanzadores por derrotar.",
                "syn_moneyball_bb": "📊 Moneyball: ¡Boleto paciente inflige +{{extra}} daño!",
                "syn_tto_bb": "🚀 Three True Outcomes: ¡Boleto optimizado inflige +{{extra}} daño!",
                "syn_tto_so": "🚀 Three True Outcomes: Ponche causa -50% daño HP",
                "syn_fivetool_out": "🔋 Five-Tool: ¡OUT recupera +5 de Stamina a todos!",
                "syn_moneyball_out": "📊 Moneyball Out Wear: +10 daño al lanzador.",
                "syn_bash_sacfly": "💪 Bash Brothers Sac Fly: ¡Corredor en 3B anota carrera!",
                "syn_bash_hr": "💪 Bash Brothers: ¡Jonrón inflige +{{extra}} daño!",
                "syn_liveball_upgrade": "🔥 Liveball Sluggers: ¡Doble convertido en Triple!",
                "syn_liveball_dmg": "🔥 Liveball Sluggers: +{{extra}} daño.",
                "syn_genesis_error": "💥 Genesis Chaos: ¡Error rival! +{{dmg}} daño e incremento extra de bases.",
                "syn_smallball": "⏳ Small Ball: ¡Avanzan 2 bases en sencillo!",
                "syn_expansion": "Sinergia Expansion",
                "syn_bighair": "Sinergia Big Hair"
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
                        "lv1": "Moneyball: Bases por bolas (BB) hacen +10 daño extra.",
                        "lv2": "Moneyball: BB hacen +20 daño; outs hacen +10 daño."
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
                "lineup_full": "Alineación ocupada. Elige a quién reemplazar."
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
                        "title": "Bates de Contrabando",
                        "desc": "Un misterioso carpintero ofrece bates modificados con corcho. Aumentan el impacto pero alteran el balance del swing.",
                        "choice1": "Modificación Estándar (+10 PWR, -2 CON)",
                        "suc": "¡Bates modificados con éxito! Tu alineación obtiene +25 PWR y -5 CON.",
                        "fail": "¡EL UMPIRE DESCUBRIÓ LOS BATES! La liga confisca los bates y te impone una multa de -$10."
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
                        "title": "Hipnosis de Bateo Focalizado",
                        "desc": "Un psicólogo deportivo ofrece reprogramar la concentración mental de tus bateadores en el plato.",
                        "choice1": "Sesión de Trance Profundo (+14 EYE, +10 CON)",
                        "suc": "¡Mente lúcida! Tu equipo obtiene +14 EYE y +10 CON.",
                        "fail": "¡Desorientación hipnótica! Los bateadores dudan en el conteo (-8 EYE)."
                },
                "graphene": {
                        "title": "Bates de Aleación Experimental",
                        "desc": "Un laboratorio tecnológico propone probar bates con fibra de carbono y titanio.",
                        "choice3": "Pasar de la tecnología",
                        "fail": "¡El bate se astilló en pedazos! Pierdes la inversión y restas -5 PWR."
                },
                "tabloid": {
                        "title": "Prensa Sensacionalista",
                        "desc": "Un importante periódico deportivo quiere la primicia del vestuario y ofrece dinero a cambio de una entrevista exclusiva.",
                        "suc": "¡Entrevista vendida con éxito! Recibes +$35 de presupuesto.",
                        "fail": "¡El artículo desató polémica! La presión mediática causa estrés (-15 Stamina a todos).",
                        "choice3": "Cerrar las Puertas (No hablar)"
                },
                "cryo": {
                        "title": "Cápsula de Hidroterapia",
                        "desc": "Instalas una cámara de criogenización en el vestuario para rejuvenecer a tus bateadores.",
                        "choice1": "Criogenización Completa (100% Stamina a todos)",
                        "choice2": "Bañera de Hielo Rápida (+40 Stamina a todos)",
                        "choice3": "Prescindir de la cámara"
                },
                "pinetar": {
                        "title": "Brea de Pino Japonesa",
                        "desc": "Un distribuidor importador ofrece resina de brea de pino especial que maximiza la firmeza del swing.",
                        "choice2": "Fórmula Casera Ultra-Pegajosa (+18 CON)",
                        "fail": "¡El umpire nota el residuo ilícito! Te sanciona restando -10 Defensa."
                },
                "spikes": {
                        "title": "Clavos Ligeros Experimentales",
                        "desc": "Un fabricante local te ofrece calzado de clavos de aluminio ultraligeros para mejorar la velocidad en bases.",
                        "fail": "¡Mala tracción! Los clavos resbalan y causan torceduras (-10 Stamina a todos)."
                },
                "gloves": {
                        "title": "Guantes de Piel Curtida",
                        "desc": "Un coleccionista de recuerdos ofrece guantes clásicos pesados que aportan máxima protección defensiva al cuadro."
                },
                "choice_reject": "Rechazar Oferta (No hacer nada)",
                "choice_clean": "Jugar Limpio (Rechazar)",
                "choice_skip": "Continuar sin entrenar",
                "choice_reject_therapy": "Rechazar Psicoterapia",
                "badge_risk_success": "¡ÉXITO EN EL RIESGO!",
                "badge_taken": "¡DECISIÓN TOMADA!",
                "generic_success": "La decisión se ejecutó con éxito en tu plantilla.",
                "generic_fail": "La opción arriesgada no salió como esperabas y provocó consecuencias negativas."
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
                "hp_restored": "Tu equipo ha recuperado +30 HP y Escudo Máximo."
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
                "search_placeholder": "Buscar por nombre, equipo o posición...",
                "load_more": "Mostrar más",
                "counter": "{{unlocked}} / {{total}} descubiertos ({{pct}}%)",
                "career_header": "CARRERA / CAREER (MLB)",
                "war_label": "WAR"
        },
        "badge": {
                "captain_tooltip": "Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.",
                "clutch_tooltip": "Clutch Player: +2% de probabilidad de sencillo y doble, +4% de HR con corredores en posición de anotar o durante la última entrada."
        },
        "combat_info": {
                "title": "⚙️ DATOS DE DAÑO & VALORES",
                "out": "<strong style=\"color: #9ca3af;\">🤚 OUT (Groundout/Flyout):</strong> Resta <span style=\"color:#ef4444;font-weight:bold;\">-12 HP</span> al Escudo (al romperlo, resta al HP del equipo).",
                "so": "<strong style=\"color: #ef4444;\">💨 PONCHE (SO):</strong> Resta <span style=\"color:#ef4444;font-weight:bold;\">-18 HP</span> directos al HP (ignora escudo).<div style=\"font-size: 8.5px; color: #a855f7; margin-top: 2px;\">🔥 Racha: 1º (-18) • 2º (-24) • 3º+ (-30 HP)</div>",
                "pitcher_title": "<strong style=\"color: #10b981;\">⚾ DAÑO AL LANZADOR RIVAL:</strong>",
                "bb": "<span>🚶 BB: <b style=\"color:#3b82f6;\">10 HP</b></span>",
                "single": "<span>✅ 1B: <b style=\"color:#a7f3d0;\">15 HP</b></span>",
                "double": "<span>⚡ 2B: <b style=\"color:#10b981;\">30 HP</b></span>",
                "triple": "<span>🔥 3B: <b style=\"color:#06b6d4;\">45 HP</b></span>",
                "hr": "🚀 <strong>HR (Jonrón):</strong> <b style=\"color:#eab308;\">75 HP base</b>",
                "rbi_bonus": "🏆 <strong>Bonus RBI:</strong> Cada carrera impulsada añade <strong style=\"color:#00ff66;\">+10 HP extra</strong> de daño al pitcher.",
                "steal": "<strong style=\"color: #38bdf8;\">🏃 ROBO DE BASES (SPD ≥ 40):</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">En 1B o BB con 2B libre, intenta robar (10% a 85% chance). Da <strong style=\"color:#38bdf8;\">+20% daño</strong> al pitcher en sus próximos 2 impactos (se resetea al cambiar de entrada o agotar impactos).</div>",
                "upgrade": "<strong style=\"color: #a855f7;\">⚡ UPGRADE DE BATAZOS:</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">• <strong>Grado A (SPD 80-99):</strong> 25% chance de subir hit (1B→2B, 2B→3B).<br>• <strong>Grado S (SPD 100-125):</strong> 50% chance.</div>",
                "shield_max": "🛡️ Escudo máximo: 50 (50% de la DEF promedio de tus 8 alineados)."
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
                "node_world_series": "WORLD SERIES"
        },
        "ratings_guide": {
                "title": "📊 RATINGS GUIDE",
                "con": "<strong style=\"color:#a7f3d0;\">CON — Contact:</strong> Determines the probability of making contact. High CON players have higher chances of singles and hits overall.",
                "pwr": "<strong style=\"color:#f59e0b;\">PWR — Power:</strong> Probability of extra-base hits (doubles, triples, home runs). Also increases damage to opponent pitcher on deep hits.",
                "eye": "<strong style=\"color:#3b82f6;\">EYE — Vision/Eye:</strong> Probability of getting walks (BB). Reduces strikeout zone. Crucial to avoid direct HP damage.",
                "spd": "<strong style=\"color:#38bdf8;\">SPD — Speed:</strong> Triggers base stealing attempts on singles (+20% pitcher damage debuff). Also improves chance of converting hits to extra bases.",
                "def": "<strong style=\"color:#a855f7;\">DEF — Defense:</strong> Contributes to team <strong>Shield</strong>. Higher average DEF gives you more shield to absorb OUTs before losing HP.",
                "captain": "<strong style=\"color:#eab308;\">👑 CAPTAIN:</strong> +5 to all ratings for all teammates while on the active roster.",
                "clutch": "<strong style=\"color:#ef4444;\">⚡ CLUTCH PLAYER:</strong> +2% single and double chance, +4% HR chance with runners in scoring position or during the last inning."
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
                "start_btn": "<i class=\"fa-solid fa-fire-flame-curved\"></i> BATTLE!",
                "back_map_btn": "<i class=\"fa-solid fa-arrow-left\"></i> Back to Map"
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
                "outcome_defeat": "DEFEAT. Your lineup was knocked out by the rival pitchers."
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
                "desc": "Make a critical decision for the club. Each choice affects budget, health, or team stats."
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
                "tab_pitchers": "Opponent Pitchers"
        },
        "victory": {
                "title": "ABSOLUTE BASEROGUE CHAMPION!",
                "desc": "You conquered the final phase and defeated the Supreme Rotation of 4 Legends! Your lineup goes down in baseball roguelike history.",
                "summary_btn": "<i class=\"fa-solid fa-chart-column\"></i> View Run Summary",
                "replay_btn": "<i class=\"fa-solid fa-rotate-right\"></i> Play Again"
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
                "inning_end": "--- END OF INNING {{inning}} ({{runs}} runs scored) ---",
                "match_timeout": "⏱ MATCH OVER (3 innings). {{remaining}} pitchers remaining.",
                "syn_moneyball_bb": "📊 Moneyball: Walk deals +{{extra}} damage!",
                "syn_tto_bb": "🚀 Three True Outcomes: Walk deals +{{extra}} optimized damage!",
                "syn_tto_so": "🚀 Three True Outcomes: Strikeout -50% HP damage",
                "syn_fivetool_out": "🔋 Five-Tool: OUT restores +5 Stamina to all!",
                "syn_moneyball_out": "📊 Moneyball Out Wear: +10 damage to pitcher.",
                "syn_bash_sacfly": "💪 Bash Brothers Sac Fly: Runner on 3B scores!",
                "syn_bash_hr": "💪 Bash Brothers: Home Run deals +{{extra}} damage!",
                "syn_liveball_upgrade": "🔥 Liveball Sluggers: Double upgraded to Triple!",
                "syn_liveball_dmg": "🔥 Liveball Sluggers: +{{extra}} damage.",
                "syn_genesis_error": "💥 Genesis Chaos: Rival error! +{{dmg}} damage and extra base advance.",
                "syn_smallball": "⏳ Small Ball: Runners advance 2 bases on single!",
                "syn_expansion": "Expansion Synergy",
                "syn_bighair": "Big Hair Synergy"
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
                        "lv1": "Moneyball: Walks (BB) deal +10 extra damage.",
                        "lv2": "Moneyball: BB deal +20 damage; outs deal +10 damage."
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
                "lineup_full": "Lineup occupied. Choose who to replace."
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
                        "title": "Contraband Bats",
                        "desc": "A mysterious carpenter offers corked bats. Boosts impact but alters swing balance.",
                        "choice1": "Standard Modification (+10 PWR, -2 CON)",
                        "suc": "Bats modified successfully! Your lineup gets +25 PWR and -5 CON.",
                        "fail": "THE UMPIRE FOUND THE BATS! The league confiscates them and fines you -$10."
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
                        "title": "Focused Batting Hypnosis",
                        "desc": "A sports psychologist offers to reprogram the mental focus of your batters at the plate.",
                        "choice1": "Deep Trance Session (+14 EYE, +10 CON)",
                        "suc": "Lucid mind! Your team gets +14 EYE and +10 CON.",
                        "fail": "Hypnotic disorientation! Batters hesitate at the count (-8 EYE)."
                },
                "graphene": {
                        "title": "Experimental Alloy Bats",
                        "desc": "A tech lab proposes testing carbon fiber and titanium bats for the next map stretch.",
                        "choice3": "Pass on the technology",
                        "fail": "The bat splintered to pieces! You lose the investment and -5 PWR."
                },
                "tabloid": {
                        "title": "Sensationalist Press",
                        "desc": "A major sports newspaper wants a locker room exclusive and offers money for an interview.",
                        "suc": "Interview sold successfully! You receive +$35 budget.",
                        "fail": "The article caused controversy! Media pressure causes stress (-15 Stamina to all).",
                        "choice3": "Close the Doors (No talking)"
                },
                "cryo": {
                        "title": "Hydrotherapy Chamber",
                        "desc": "You install an advanced cryogenic recovery chamber in the locker room.",
                        "choice1": "Full Cryotherapy (100% Stamina to all)",
                        "choice2": "Quick Ice Bath (+40 Stamina to all)",
                        "choice3": "Forego the chamber"
                },
                "pinetar": {
                        "title": "Japanese Pine Tar",
                        "desc": "An importer offers special pine tar resin that maximizes swing firmness.",
                        "choice2": "Ultra-Sticky Home Formula (+18 CON)",
                        "fail": "The umpire noticed the illicit residue! He penalizes -10 Defense."
                },
                "spikes": {
                        "title": "Experimental Light Cleats",
                        "desc": "A local manufacturer offers ultra-light aluminum cleats to improve base running speed.",
                        "fail": "Bad traction! The cleats slip and cause sprains (-10 Stamina to all)."
                },
                "gloves": {
                        "title": "Tanned Leather Gloves",
                        "desc": "A memorabilia collector offers classic heavy gloves that provide maximum defensive protection."
                },
                "choice_reject": "Reject Offer (Do nothing)",
                "choice_clean": "Play Clean (Decline)",
                "choice_skip": "Continue without training",
                "choice_reject_therapy": "Decline Psychotherapy",
                "badge_risk_success": "RISK SUCCESSFUL!",
                "badge_taken": "DECISION MADE!",
                "generic_success": "The decision was executed successfully for your roster.",
                "generic_fail": "The risky option didn't go as expected and caused negative consequences."
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
                "hp_restored": "Your team has recovered +30 HP and Max Shield."
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
                "search_placeholder": "Search by name, team, or position...",
                "load_more": "Load more",
                "counter": "{{unlocked}} / {{total}} discovered ({{pct}}%)",
                "career_header": "CAREER / CAREER (MLB)",
                "war_label": "WAR"
        },
        "badge": {
                "captain_tooltip": "Captain: +5 to all ratings for teammates while on active roster.",
                "clutch_tooltip": "Clutch Player: +2% single and double chance, +4% HR chance with runners in scoring position during final inning."
        },
        "combat_info": {
                "title": "⚙️ DAMAGE DATA & VALUES",
                "out": "<strong style=\"color: #9ca3af;\">🤚 OUT (Groundout/Flyout):</strong> Subtracts <span style=\"color:#ef4444;font-weight:bold;\">-12 HP</span> from Shield (upon breaking, subtracts from team HP).",
                "so": "<strong style=\"color: #ef4444;\">💨 STRIKEOUT (SO):</strong> Subtracts <span style=\"color:#ef4444;font-weight:bold;\">-18 HP</span> directly from HP (ignores shield).<div style=\"font-size: 8.5px; color: #a855f7; margin-top: 2px;\">🔥 Streak: 1st (-18) • 2nd (-24) • 3rd+ (-30 HP)</div>",
                "pitcher_title": "<strong style=\"color: #10b981;\">⚾ RIVAL PITCHER DAMAGE:</strong>",
                "bb": "<span>🚶 BB: <b style=\"color:#3b82f6;\">10 HP</b></span>",
                "single": "<span>✅ 1B: <b style=\"color:#a7f3d0;\">15 HP</b></span>",
                "double": "<span>⚡ 2B: <b style=\"color:#10b981;\">30 HP</b></span>",
                "triple": "<span>🔥 3B: <b style=\"color:#06b6d4;\">45 HP</b></span>",
                "hr": "🚀 <strong>HR (Home Run):</strong> <b style=\"color:#eab308;\">75 HP base</b>",
                "rbi_bonus": "🏆 <strong>RBI Bonus:</strong> Each RBI adds <strong style=\"color:#00ff66;\">+10 extra HP</strong> damage to pitcher.",
                "steal": "<strong style=\"color: #38bdf8;\">🏃 BASE STEALING (SPD ≥ 40):</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">On 1B or BB with 2B open, attempts to steal (10% to 85% chance). Grants <strong style=\"color:#38bdf8;\">+20% damage</strong> to pitcher on next 2 impacts.</div>",
                "upgrade": "<strong style=\"color: #a855f7;\">⚡ HIT UPGRADES:</strong><div style=\"font-size: 8.5px; color: #cbd5e1; margin-top: 2px;\">• <strong>Grade A (SPD 80-99):</strong> 25% chance to upgrade hit (1B→2B, 2B→3B).<br>• <strong>Grade S (SPD 100-125):</strong> 50% chance.</div>",
                "shield_max": "🛡️ Max shield: 50 (50% of average DEF of your 8 starters)."
        }
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

    // Re-render components that depend on current language if active
    if (window.Game && window.UI) {
      if (typeof window.UI.renderActiveRoster === 'function') window.UI.renderActiveRoster();
      if (typeof window.UI.renderSynergiesAndItems === 'function') window.UI.renderSynergiesAndItems();
      if (typeof window.UI.updateHUD === 'function') window.UI.updateHUD();
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

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
