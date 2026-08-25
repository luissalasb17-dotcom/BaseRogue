
let currentMobileTab = 'action';

function setMobileTab(tab) {
  currentMobileTab = tab;

  // Update navbar buttons state
  const btnAction = document.getElementById('btn-mobile-tab-action');
  const btnRoster = document.getElementById('btn-mobile-tab-roster');
  const btnOrder  = document.getElementById('btn-mobile-tab-order');

  const navItems = [
    { id: 'action', btn: btnAction },
    { id: 'roster', btn: btnRoster },
    { id: 'order',  btn: btnOrder }
  ];

  navItems.forEach(item => {
    if (!item.btn) return;
    if (item.id === tab) {
      item.btn.classList.add('bg-[#00ff66]/15', 'text-[#00ff66]', 'border-[#00ff66]/40');
      item.btn.classList.remove('text-gray-400', 'border-transparent');
    } else {
      item.btn.classList.remove('bg-[#00ff66]/15', 'text-[#00ff66]', 'border-[#00ff66]/40');
      item.btn.classList.add('text-gray-400', 'border-transparent');
    }
  });

  // Apply visibility classes to game workspace sidebars & center panel
  const leftSidebar = document.getElementById('roster-sidebar-panel');
  const centerPanel = document.querySelector('.workspace-center-panel');
  const rightSidebar = document.getElementById('synergies-sidebar-panel');

  if (leftSidebar && centerPanel && rightSidebar) {
    leftSidebar.classList.remove('mobile-active');
    centerPanel.classList.remove('mobile-active');
    rightSidebar.classList.remove('mobile-active');

    if (tab === 'action') {
      centerPanel.classList.add('mobile-active');
    } else if (tab === 'roster') {
      leftSidebar.classList.add('mobile-active');   // lineup/alineación
    } else if (tab === 'order') {
      rightSidebar.classList.add('mobile-active');  // sinergias
    }
  }

  // Apply visibility to draft screen 3 columns if currently rendering draft
  const draftRoster = document.getElementById('draft-col-roster');
  const draftCards = document.getElementById('draft-col-cards');
  const draftOrder = document.getElementById('draft-col-order');
  if (draftRoster && draftCards && draftOrder) {
    draftRoster.classList.remove('mobile-active');
    draftCards.classList.remove('mobile-active');
    draftOrder.classList.remove('mobile-active');

    if (tab === 'action') draftCards.classList.add('mobile-active');
    else if (tab === 'roster') draftRoster.classList.add('mobile-active');
    else if (tab === 'order') draftOrder.classList.add('mobile-active');
  }
}
window.setMobileTab = setMobileTab;

function updateMobileNavVisibility() {
  const navBar = document.getElementById('mobile-nav-bar');
  if (!navBar) return;

  const modeScreen = document.getElementById('screen-mode-select');
  const menuScreen = document.getElementById('screen-menu');
  const matchScreen = document.getElementById('screen-match');
  const isOuterScreen = (modeScreen && !modeScreen.classList.contains('hidden')) ||
                        (menuScreen && !menuScreen.classList.contains('hidden')) ||
                        (matchScreen && !matchScreen.classList.contains('hidden'));

  if (isOuterScreen) {
    navBar.classList.add('hidden');
  } else {
    navBar.classList.remove('hidden');
  }
}
window.updateMobileNavVisibility = updateMobileNavVisibility;

// Global helper for screen swapping with proper parent-child container handling
window.showScreen = function(screenId) {
  const screenMode = document.getElementById('screen-mode-select');
  const screenMenu = document.getElementById('screen-menu');
  const gameWorkspace = document.getElementById('game-workspace');
  const hud = document.getElementById('game-hud');
  const leftSidebar = document.getElementById('roster-sidebar-panel');
  const rightSidebar = document.getElementById('synergies-sidebar-panel') || document.querySelector('.workspace-sidebar.right-sidebar');

  if (screenId === 'screen-mode-select') {
    document.body.classList.add('on-main-menu');
    if (screenMode) screenMode.classList.remove('hidden');
    if (screenMenu) screenMenu.classList.add('hidden');
    if (gameWorkspace) gameWorkspace.classList.add('hidden');
    if (hud) hud.classList.add('hidden');
    if (window.Challenge162 && typeof window.Challenge162.updateModeSelectCard === 'function') {
      window.Challenge162.updateModeSelectCard();
    }
    updateMobileNavVisibility();
    if (window.AudioManager) window.AudioManager.setBGM('menu');
    return;
  }

  // All in-game screens (draft, map, match, train, rest, event, pre-fight, gameover) live inside #game-workspace wrapper
  document.body.classList.remove('on-main-menu');
  if (screenMode) screenMode.classList.add('hidden');
  if (screenMenu) screenMenu.classList.add('hidden');
  if (gameWorkspace) gameWorkspace.classList.remove('hidden');

  // Clean layout during initial 9-round draft or challenge playoff matches
  const isInitialDraft = screenId === 'screen-draft' && window.Game && window.Game.draftRound <= 9;
  const isChallengePlayoffs = window.Game && window.Game.isChallenge162PlayoffMatch;
  
  if (isInitialDraft) {
    if (hud) hud.classList.add('hidden');
    if (leftSidebar) leftSidebar.classList.add('hidden');
    if (rightSidebar) rightSidebar.classList.add('hidden');
  } else if (isChallengePlayoffs) {
    if (hud) hud.classList.add('hidden');
    if (leftSidebar) leftSidebar.classList.remove('hidden');
    if (rightSidebar) rightSidebar.classList.add('hidden');
    if (window.renderRosterSidebar) window.renderRosterSidebar();
  } else {
    if (hud && window.Game && window.Game.runActive) hud.classList.remove('hidden');
    if (leftSidebar) leftSidebar.classList.remove('hidden');
    if (rightSidebar) rightSidebar.classList.remove('hidden');
  }

  const innerScreens = ['screen-map', 'screen-pre-fight', 'screen-match', 'screen-event', 'screen-draft', 'screen-train', 'screen-rest', 'screen-gameover'];
  innerScreens.forEach(id => {
    const s = document.getElementById(id);
    if (s) s.classList.add('hidden');
  });

  const allChallengeScreens = ['screen-challenge-hub', 'screen-challenge-roster', 'screen-challenge-season', 'screen-challenge-playoffs', 'screen-challenge-results'];
  allChallengeScreens.forEach(id => {
    const s = document.getElementById(id);
    if (s && id !== screenId) s.classList.add('hidden');
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.remove('hidden');
    if (screenId === 'screen-map') {
      target.scrollTop = 0;
    }
  }

  // Seamless Ambient BGM switching
  if (window.AudioManager) {
    if (screenId === 'screen-match') {
      window.AudioManager.setBGM('match');
    } else if (screenId === 'screen-gameover') {
      window.AudioManager.setBGM('off');
    } else {
      window.AudioManager.setBGM('menu');
    }
  }

  updateMobileNavVisibility();
  setMobileTab(currentMobileTab);
};


// Helper for Era name lookup during roulette
function getEraNameForYear(year) {
  const y = parseInt(year, 10);
  if (y <= 1900) return "Genesis Chaos (1871-1900)";
  if (y <= 1919) return "Deadball Grit (1901-1919)";
  if (y <= 1941) return "Golden Age (1920-1941)";
  if (y <= 1960) return "Integration Era (1942-1960)";
  if (y <= 1976) return "Expansion & Turf (1961-1976)";
  if (y <= 1993) return "Big Hair & Radar (1977-1993)";
  if (y <= 2005) return "Steroid Sluggers (1994-2005)";
  if (y <= 2015) return "Efficiency & Shift (2006-2015)";
  return "Modern Statcast (2016-2025)";
}

// SEASON ROULETTE ANIMATION INSIDE SEASON SELECTION MODAL
function startSeasonRouletteAnimation(selectedYear, onComplete) {
  const modalControls = document.getElementById('modal-season-controls');
  const rouletteContainer = document.getElementById('modal-roulette-container');
  const yearEl = document.getElementById('roulette-year-number');
  const eraEl = document.getElementById('roulette-era-name');
  const msgEl = document.getElementById('roulette-status-msg');
  const boxEl = document.getElementById('season-roulette-box');

  if (modalControls) modalControls.style.display = 'none';
  if (rouletteContainer) rouletteContainer.classList.remove('hidden');

  if (boxEl) boxEl.classList.remove('winning-glow');
  if (msgEl) msgEl.innerHTML = `<i class="fa-solid fa-dice-d20 fa-spin"></i> ${t('season_select.roulette_status', 'Seleccionando año histórico...')}`;

  const years = [];
  for (let y = 1901; y <= 2025; y++) years.push(y);

  let currentTick = 0;
  const maxTicks = 22;
  let speed = 40;

  function runStep() {
    currentTick++;
    const randomYear = years[Math.floor(Math.random() * years.length)];
    if (yearEl) yearEl.innerText = String(randomYear);
    if (eraEl) eraEl.innerText = getEraNameForYear(randomYear);

    // Play tick sound with pitch slightly rising as it decelerates towards final pick
    if (window.AudioManager) {
      const progress = currentTick / maxTicks;
      window.AudioManager.play('roulette_tick', 1.0 + progress * 0.35);
    }

    if (currentTick < maxTicks) {
      speed += 10;
      setTimeout(runStep, speed);
    } else {
      // Lock final winning year
      if (yearEl) yearEl.innerText = String(selectedYear);
      if (eraEl) eraEl.innerText = getEraNameForYear(selectedYear);
      if (boxEl) boxEl.classList.add('winning-glow');
      const winMsg = typeof window.t==='function'?window.t('ui.season_roulette_selected', { year: selectedYear, defaultValue: `¡TEMPORADA SELECCIONADA: ${selectedYear}!` }):`¡TEMPORADA SELECCIONADA: ${selectedYear}!`;
      if (msgEl) msgEl.innerHTML = `<span style="color: #ffd700; font-weight: bold; text-shadow: 0 0 10px rgba(255,215,0,0.8);">⚡ ${winMsg} ⚡</span>`;

      // Play winning jackpot sound fanfare
      if (window.AudioManager) {
        window.AudioManager.play('roulette_win');
      }

      setTimeout(() => {
        // Reset modal controls for next time
        if (rouletteContainer) rouletteContainer.classList.add('hidden');
        if (modalControls) modalControls.style.display = 'block';
        if (boxEl) boxEl.classList.remove('winning-glow');
        
        if (onComplete) onComplete();
      }, 1300);
    }
  }

  runStep();
}
window.startSeasonRouletteAnimation = startSeasonRouletteAnimation;


// BaseRogue UI Controller
// Handles DOM interactions, rendering, simulation playback, and game loops

(function() {
  // Elements Cache
  const el = {
    get hud() { return document.getElementById('game-hud'); },
    get hudStage() { return document.getElementById('hud-stage-val'); },
    get hudBudget() { return document.getElementById('hud-budget-val'); },
    get toggleRosterBtn() { return document.getElementById('btn-toggle-roster-view'); },
    
    // Screens
    get screenMenu() { return document.getElementById('screen-menu'); },
    get starterPool() { return document.getElementById('starter-selection-pool') || document.getElementById('draft-options-row'); },
    
    get workspace() { return document.getElementById('game-workspace'); },
    get screenMap() { return document.getElementById('screen-map'); },
    get mapContainer() { return document.getElementById('map-nodes-container'); },
    
    screenMatch: document.getElementById('screen-match'),
    get matchArena() { return document.querySelector('.match-arena'); },
    matchHeaderTitle: document.getElementById('match-header-title'),
    scoreInningText: document.getElementById('scoreboard-inning-text'),
    scoreEnemyName: document.getElementById('score-enemy-name'),
    scoreAwayR: document.getElementById('score-away-r'),
    scoreAwayH: document.getElementById('score-away-h'),
    scoreAwayE: document.getElementById('score-away-e'),
    scoreHomeR: document.getElementById('score-home-r'),
    scoreHomeH: document.getElementById('score-home-h'),
    scoreHomeE: document.getElementById('score-home-e'),
    scoreboardAwayRow: document.getElementById('scoreboard-away-row'),
    scoreboardHomeRow: document.getElementById('scoreboard-home-row'),
    
    ledB1: document.getElementById('led-b-1'),
    ledB2: document.getElementById('led-b-2'),
    ledB3: document.getElementById('led-b-3'),
    ledS1: document.getElementById('led-s-1'),
    ledS2: document.getElementById('led-s-2'),
    ledO1: document.getElementById('led-o-1'),
    ledO2: document.getElementById('led-o-2'),
    
    base1: document.getElementById('base-1'),
    base2: document.getElementById('base-2'),
    base3: document.getElementById('base-3'),
    
    matchBatterName: document.getElementById('match-batter-name'),
    matchBatterStats: document.getElementById('match-batter-stats'),
    matchBatterHpFill: document.getElementById('match-batter-hp-fill'),
    matchBatterHpText: document.getElementById('match-batter-hp-text'),
    matchPitcherName: document.getElementById('match-pitcher-name'),
    matchPitcherStats: document.getElementById('match-pitcher-stats'),
    matchPitcherHpFill: document.getElementById('match-pitcher-hp-fill'),
    matchPitcherHpText: document.getElementById('match-pitcher-hp-text'),
    matchPitchersRotationQueue: document.getElementById('match-pitchers-rotation-queue'),
    arenaBatterCardSlot: document.getElementById('arena-batter-card-slot'),
    arenaPitcherCardSlot: document.getElementById('arena-pitcher-card-slot'),
    
    btnMatchStep: document.getElementById('btn-match-play-step'),
    btnMatchAuto: document.getElementById('btn-match-auto-fast'),
    btnMatchSkip: document.getElementById('btn-match-skip-game'),
    matchLogLines: document.getElementById('match-play-log-lines'),
    
    // Pre fight
    screenPreFight: document.getElementById('screen-pre-fight'),
    preFightSubtitle: document.getElementById('pre-fight-subtitle'),
    preFightPlayerLineup: document.getElementById('pre-fight-player-lineup'),
    preFightEnemyRotation: document.getElementById('pre-fight-enemy-rotation'),
    preFightScouting: document.getElementById('pre-fight-scouting'),
    btnPreFightStart: document.getElementById('btn-pre-fight-start'),
    btnPreFightBackMap: document.getElementById('btn-pre-fight-back-map'),
    
    screenEvent: document.getElementById('screen-event'),
    eventTitle: document.getElementById('event-title'),
    eventDesc: document.getElementById('event-desc'),
    eventChoicesContainer: document.getElementById('event-choices-container'),
    
    screenDraft: document.getElementById('screen-draft'),
    get draftOptionsRow() { return document.getElementById('starter-selection-pool'); },
    
    screenTrain: document.getElementById('screen-train'),
    trainOptionsList: document.getElementById('training-options-list'),
    trainPlayerSelect: document.getElementById('training-player-select'),
    btnConfirmTrain: document.getElementById('btn-confirm-training'),
    btnTrainBack: document.getElementById('btn-train-back-map'),
    
    screenRest: document.getElementById('screen-rest'),
    btnRestHeal: document.getElementById('btn-rest-heal-all'),
    btnRestCash: document.getElementById('btn-rest-get-cash'),
    
    screenGameOver: document.getElementById('screen-gameover'),
    screenSeasonRoulette: document.getElementById('screen-season-roulette'),
    gameoverTitle: document.getElementById('gameover-title'),
    gameoverDesc: document.getElementById('gameover-desc'),
    gameoverHistoryLog: document.getElementById('gameover-history-log'),
    btnRestartGame: document.getElementById('btn-restart-game'),
    
    synergiesList: document.getElementById('synergies-list-container'),
    purchasedItemsList: document.getElementById('roster-purchased-items'),
    
    lineupGrid: document.getElementById('lineup-slots-grid'),
    rosterManagerPanel: document.getElementById('roster-sidebar-panel'),
    mapPathsSvg: document.getElementById('map-paths-svg'),
    
    // Modal Swap
    modalSwap: document.getElementById('modal-swap-draft'),
    swapNewPlayerName: document.getElementById('swap-new-player-name'),
    modalSwapList: document.getElementById('modal-swap-list-players'),
    btnCancelSwapDraft: document.getElementById('btn-cancel-swap-draft')
  };

  // ── State local UI ──────────────────────────────────────────────────────────
  let activeBattle       = null;   // InteractiveBattle instance (interactive dice mode)
  let currentDraftSelection = null; // Stored player data if modal swap needed
  let diceAnimInterval   = null;   // Dice roll animation interval handle
  let isRolling          = false;  // Guard: prevents double-clicks during animation

  // HP bar shake tracking
  let _prevTeamHP      = 100;
  let _prevPitcherHP   = null;
  let _prevTeamShield  = null;

  const TrainingPlans = [
    {
      id: "t_con_std",
      stat: "con",
      get label() { return typeof window.t==='function'?window.t('training.con.label'):'🎯 Sesión de Contacto Estándar'; },
      get desc() { return typeof window.t==='function'?window.t('training.con.desc'):'Práctica intensiva de swing. +5 a +7 Contacto garantizado.'; },
      price: 3,
      risk: "safe",
      icon: "🎯",
      critChance: 0.15,
      minVal: 5,
      maxVal: 7,
      critVal: 12
    },
    {
      id: "t_pwr_std",
      stat: "pwr",
      label: "💥 Fuerza en la Jaula",
      get desc() { return typeof window.t==='function'?window.t('training.pwr.desc'):'Repeticiones con bate pesado. +5 a +7 Fuerza garantizada.'; },
      price: 3,
      risk: "safe",
      icon: "💥",
      critChance: 0.15,
      minVal: 5,
      maxVal: 7,
      critVal: 12
    },
    {
      id: "t_spd_std",
      stat: "spd",
      label: "⚡ Sprints de Agilidad",
      get desc() { return typeof window.t==='function'?window.t('training.spd.desc'):'Trabajo de aceleración en bases. +5 a +7 Velocidad.'; },
      price: 3,
      risk: "safe",
      icon: "⚡",
      critChance: 0.15,
      minVal: 5,
      maxVal: 7,
      critVal: 12
    },
    {
      id: "t_def_std",
      stat: "def",
      label: "🧤 Fundamento Defensivo",
      get desc() { return typeof window.t==='function'?window.t('training.def.desc'):'Ejercicios de fildeo y tiro. +5 a +7 Defensa.'; },
      price: 2,
      risk: "safe",
      icon: "🧤",
      critChance: 0.15,
      minVal: 5,
      maxVal: 7,
      critVal: 12
    },
    {
      id: "t_sta_std",
      stat: "sta",
      get label() { return typeof window.t==='function'?window.t('training.sta.label'):'🔋 Recuperación Físico-Biológica'; },
      get desc() { return typeof window.t==='function'?window.t('training.sta.desc'):'Masajes y descanso activo. +35 a +45 Stamina.'; },
      price: 2,
      risk: "safe",
      icon: "🔋",
      critChance: 0.20,
      minVal: 35,
      maxVal: 45,
      critVal: 100
    },
    {
      id: "t_extreme_pwr",
      stat: "pwr",
      label: "🔥 Entrenamiento Extremo de Poder",
      get desc() { return typeof window.t==='function'?window.t('training.risk.desc'):'Levantamiento súper-pesado. +12 a +14 PWR si resulta. 30% riesgo de tirón muscular.'; },
      price: 4,
      risk: "high",
      icon: "🔥",
      riskChance: 0.30,
      minVal: 12,
      maxVal: 14,
      failPenalty: 15
    },
    {
      id: "t_extreme_spd",
      stat: "spd",
      label: "🚀 Entrenamiento Turbo de Velocidad",
      desc: "Sprints con resistencia. +12 a +14 SPD si resulta. 25% riesgo de sobrecarga (-10 Stamina).",
      price: 3,
      risk: "high",
      icon: "🚀",
      riskChance: 0.25,
      minVal: 12,
      maxVal: 14,
      failPenalty: 10
    }
  ];

  // ── UNIVERSAL RETRO RESOLUTION MODAL (No alert()) ───────────────────────
  function showRetroResultModal({ title, badgeText, badgeColor = '#10b981', icon = '✨', desc = '', stats = [], itemData = null, testerPlayer = null, onClose }) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);z-index:900;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease-out;';

    const isFailure = badgeColor === '#ef4444';
    const continueText = (typeof t === 'function' ? t('common.continue', 'CONTINUAR') : 'CONTINUAR').toUpperCase();

    const statsHTML = (stats || []).map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid ${s.isPositive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};border-radius:8px;margin-bottom:6px;">
        <span style="font-size:12px;color:#cbd5e1;">${s.label}</span>
        <span style="font-family:'Press Start 2P',monospace;font-size:11px;color:${s.isPositive ? '#10b981' : '#ef4444'};">${s.value}</span>
      </div>
    `).join('');

    let cardExtraHTML = '';
    if (isFailure && testerPlayer) {
      cardExtraHTML = `
        <div style="margin: 12px 0 16px 0; padding: 10px 14px; background: rgba(239,68,68,0.12); border: 1.5px solid rgba(239,68,68,0.4); border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
          <div style="text-align: left;">
            <div style="font-size: 8px; color: #ef4444; font-family: 'Press Start 2P', monospace;">${typeof t === 'function' ? t('equip.stamina_penalty_badge', '⚡ PENALIZACIÓN DE STAMINA') : '⚡ PENALIZACIÓN DE STAMINA'}</div>
            <div style="font-size: 11px; font-weight: bold; color: #fff; margin-top: 2px;">${testerPlayer.name} (${testerPlayer.pos || 'Bateador'})</div>
          </div>
          <div style="font-family: 'Press Start 2P', monospace; font-size: 13px; color: #ef4444; font-weight: bold;">
            -35 STA
          </div>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="${isFailure ? 'retro-shake-anim' : ''}" style="background:#090d16;border:2px solid ${badgeColor};box-shadow:0 0 45px ${badgeColor}66;border-radius:18px;padding:26px;max-width:440px;width:92%;text-align:center;position:relative;">
        <div style="font-size:52px;margin-bottom:12px;filter:drop-shadow(0 0 16px ${badgeColor});">${icon}</div>
        <div style="display:inline-block;padding:5px 14px;background:${badgeColor}25;border:1.5px solid ${badgeColor};border-radius:20px;font-family:'Press Start 2P',monospace;font-size:9px;color:${badgeColor};margin-bottom:12px;box-shadow:0 0 10px ${badgeColor}33;">${badgeText}</div>
        <h3 style="font-family:'Press Start 2P',monospace;font-size:12.5px;color:#fff;margin-bottom:10px;line-height:1.4;">${title}</h3>
        <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin-bottom:14px;">${desc}</p>
        ${cardExtraHTML}
        ${statsHTML ? `<div style="margin-bottom:16px;">${statsHTML}</div>` : ''}
        <button id="btn-close-retro-result-modal" class="btn" style="background:linear-gradient(135deg, ${badgeColor}, ${badgeColor}cc);color:${isFailure ? '#fff' : '#000'};font-weight:bold;font-size:11px;padding:12px 24px;width:100%;border:none;cursor:pointer;font-family:'Press Start 2P',monospace;">
          ${continueText} <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Audio cue
    if (window.AudioManager) {
      if (isFailure) {
        if (typeof window.AudioManager.playSound === 'function') window.AudioManager.playSound('error');
      } else {
        if (typeof window.AudioManager.playSound === 'function') window.AudioManager.playSound('purchase');
      }
    }

    document.getElementById('btn-close-retro-result-modal').addEventListener('click', () => {
      overlay.remove();
      if (onClose) onClose();
    });
  }

  // ── 9-ROUND DRAFT SYSTEM ──────────────────────────────────────────────────
  // Rarity color palette (5 tiers)
  const RARITY_COLORS = {
    Legendary: '#f59e0b',
    Epic:      '#8b5cf6',
    Rare:      '#3b82f6',
    Uncommon:  '#10b981',
    Common:    '#64748b'
  };

  const RARITY_BG = {
    Legendary: 'rgba(245,158,11,0.12)',
    Epic:      'rgba(139,92,246,0.12)',
    Rare:      'rgba(59,130,246,0.12)',
    Uncommon:  'rgba(16,185,129,0.12)',
    Common:    'rgba(100,116,139,0.08)'
  };

  const SLOTS_ORDER = ['C','1B','2B','3B','SS','LF','CF','RF','DH'];

  /** Master render for the 9-round draft. Called every time a pick is made. */
  function getPlayerBadgeIconsHTML(player) {
    if (!player) return '';
    const isClutch = !!(player.clutch || player.is_clutch);
    const isCaptain = !!(player.captain || player.is_captain);
    const isInterEra = !!player.isInterEra;
    const isChallengeWinner = !!(window.Challenge162 && window.Challenge162.isUnlocked(player));
    if (!isClutch && !isCaptain && !isInterEra && !isChallengeWinner) return '';

    const clutchToolTip = window.t ? window.t('badge.clutch_tooltip', 'Clutch Player: +4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.') : 'Clutch Player: +4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.';
    const captainToolTip = window.t ? window.t('badge.captain_tooltip', 'Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.') : 'Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.';
    const interEraToolTip = window.t ? window.t('badge.interera_tooltip') : 'Fuera de Época: este jugador no estaba activo en la temporada seleccionada — cuenta el doble para su sinergia.';
    const challengeWinnerToolTip = window.t ? window.t('badge.challenge162_tooltip', 'Elegible para el 162-0 Challenge: formó parte de un roster que ganó una run completa (Quick Play o Modo Historia).') : 'Elegible para el 162-0 Challenge: formó parte de un roster que ganó una run completa (Quick Play o Modo Historia).';

    let icons = '';
    if (isClutch) {
      icons += `<span class="list-badge-icon badge-clutch" title="${clutchToolTip}" style="color:var(--badge-clutch,#ff3300); font-weight:bold; margin-left:3px; cursor:help; font-size:10px; display:inline-block;">⚡</span>`;
    }
    if (isCaptain) {
      icons += `<span class="list-badge-icon badge-captain" title="${captainToolTip}" style="color:var(--badge-captain,#00d4ff); font-weight:bold; margin-left:3px; cursor:help; font-size:10px; display:inline-block;">👑</span>`;
    }
    if (isInterEra) {
      icons += `<span class="list-badge-icon badge-interera" title="${interEraToolTip}" style="color:#f59e0b; font-weight:bold; margin-left:3px; cursor:help; font-size:10px; display:inline-block;">⏳</span>`;
    }
    if (isChallengeWinner) {
      icons += `<span class="list-badge-icon badge-challenge-winner" title="${challengeWinnerToolTip}" style="color:var(--badge-challenge-winner,#ffd700); font-weight:bold; margin-left:3px; cursor:help; font-size:10px; display:inline-block;">🏆</span>`;
    }
    return icons;
  }

  function renderDraftRound() {
    try {
      const G = window.Game;
      if (!G) return;
      const round = G.draftRound;

      // If all 9 rounds are done → render final team confirmation screen
      if (round > 9) {
        renderFinalLineupConfirmation();
        return;
      }

      const info   = G.getDraftRoundInfo();
      const picks  = G.getDraftRoundPicks();
      const screenDraft = document.getElementById('screen-draft');
      if (screenDraft) {
        const titleEl = screenDraft.querySelector('h2');
        if (titleEl) {
          titleEl.innerHTML = (typeof t === 'function' ? t('headers.draft') : '<i class="fa-solid fa-file-signature"></i> FIRMA DE JUGADORES (DRAFT)');
        }
        const descEl = screenDraft.querySelector('p');
        if (descEl) {
          descEl.style.display = 'none';
        }
      }

      let pool = el.starterPool || document.getElementById('starter-selection-pool') || document.getElementById('draft-options-row');
      if (!pool) {
        if (screenDraft) {
          pool = document.createElement('div');
          pool.id = 'starter-selection-pool';
          pool.className = 'draft-cards';
          screenDraft.appendChild(pool);
        }
      }
      pool.innerHTML = '';
      pool.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:100%;max-width:1200px;margin:0 auto;';

      // ── Top header: round progress ──────────────────────────────────────
      const header = document.createElement('div');
      header.style.cssText = 'width:100%;text-align:center;padding:12px 0 16px;';
      const roundDots = Array.from({length:9},(_,i) => {
        let bg;
        if (i < round - 1)      bg = '#10b981';        // picked
        else if (i === round-1)  bg = RARITY_COLORS[info.rarities ? info.rarities[0] : 'Common'] || '#f59e0b';
        else                     bg = 'rgba(255,255,255,0.12)'; // upcoming
        const size = i === round-1 ? '14px' : '10px';
        return `<div style="width:${size};height:${size};border-radius:50%;background:${bg};transition:all .3s;"></div>`;
      }).join('');

      let roundBadgeKey = info.labelKey;
      if (!roundBadgeKey) {
        if (round === 1) roundBadgeKey = 'draft.round_1_label';
        else if (round === 2) roundBadgeKey = 'draft.round_2_label';
        else if (round === 3) roundBadgeKey = 'draft.round_3_label';
        else if (round >= 4 && round <= 6) roundBadgeKey = 'draft.round_4_label';
        else roundBadgeKey = 'draft.round_free_label';
      }

      // Mobile-only compact strip so the player can see which positions are
      // already filled without switching off the pick-cards tab (draft-col-roster
      // has the full detail but lives behind a tab on mobile). Lives outside the
      // 3-column tabbed layout, so no tab-system changes needed.
      const posTrackerHTML = SLOTS_ORDER.map(slot => {
        const player = G.draftRoster[slot];
        const color = player ? (RARITY_COLORS[player.rarity] || RARITY_COLORS.Common) : 'rgba(255,255,255,0.15)';
        const bg = player ? 'rgba(255,255,255,0.05)' : 'transparent';
        const textColor = player ? color : '#4b5563';
        return `<div title="${slot}${player ? ': ' + player.name : ''}" style="width:26px;height:26px;border-radius:6px;border:1.5px solid ${color};background:${bg};display:flex;align-items:center;justify-content:center;font-size:8px;font-family:'Press Start 2P',monospace;color:${textColor};">${slot}</div>`;
      }).join('');

      header.innerHTML = `
        <div style="max-width: 680px; margin: 0 auto 10px; padding: 6px 12px; background: rgba(0, 255, 102, 0.05); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 8px; font-size: 9px; color: #a7f3d0; line-height: 1.35; text-align: center;">
          ${t('menu.intro_desc', { rounds: 9, hp: 100 })}
        </div>
        <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:${RARITY_COLORS[info.rarities ? info.rarities[0] : 'Legendary']};margin-bottom:8px;letter-spacing:1px;">
          ${t('draft.round_header', { round: round })}
        </div>
        <div style="display:flex;justify-content:center;gap:6px;align-items:center;margin-bottom:8px;">${roundDots}</div>
        <div class="md:hidden" style="display:flex;justify-content:center;gap:4px;flex-wrap:wrap;margin-bottom:10px;">${posTrackerHTML}</div>
        <div style="display:inline-block;background:${RARITY_BG[info.rarities ? info.rarities[0] : 'Legendary']};
          border:1px solid ${RARITY_COLORS[info.rarities ? info.rarities[0] : 'Legendary']};
          border-radius:20px;padding:4px 14px;font-size:11px;
          color:${RARITY_COLORS[info.rarities ? info.rarities[0] : 'Legendary']};font-weight:bold;">
          ${info.icon} ${t(roundBadgeKey)}
        </div>
      `;
      pool.appendChild(header);

      // ── 3-column layout: Roster | Pick Cards | Batting Order ───────────
      const layout = document.createElement('div');
      layout.id = 'draft-round-layout';
      layout.className = 'workspace-three-columns draft-round-layout grid grid-cols-1 md:grid-cols-12 gap-3 items-start w-full max-w-[1180px] mx-auto';

      // ───── LEFT: Fielding Roster Panel ─────────────────────────────────
      const rosterPanel = document.createElement('div');
      rosterPanel.id = 'draft-col-roster';
      rosterPanel.className = 'draft-col md:col-span-3';
      rosterPanel.style.cssText = 'background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;';
      rosterPanel.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#9ca3af;margin-bottom:10px;text-align:center;letter-spacing:1px;">
          ${t('draft.roster_header')}
        </div>
      `;

      SLOTS_ORDER.forEach(slot => {
        const player = G.draftRoster[slot];
        const rColor = player ? (RARITY_COLORS[player.rarity] || RARITY_COLORS.Common) : 'rgba(255,255,255,0.1)';
        const slotRow = document.createElement('div');
        slotRow.style.cssText = [
          'display:flex','align-items:center','gap:8px',
          `border-left:3px solid ${rColor}`,
          'background:rgba(0,0,0,0.2)','border-radius:6px',
          'padding:6px 8px','margin-bottom:6px','cursor:pointer','transition:all .2s'
        ].join(';');
        slotRow.id = `draft-slot-${slot}`;

        if (player) {
          const ovr = getPlayerOvr(player);
          const isNative = player.pos === slot;
          const secArr = player.sec_pos ? player.sec_pos.split(',').map(s=>s.trim()) : [];
          const isSec   = secArr.includes(slot);
          
          let posHint = '';
          const defBase = player.def || player.defense_val || 40;
          if (isNative) {
            posHint = `<span style="color:#10b981">${t('pos.native')}</span>`;
          } else if (slot === 'DH') {
            posHint = '<span style="color:#9ca3af">DH</span>';
          } else if (isSec) {
            const pen = Math.round(defBase * 0.15);
            posHint = `<span style="color:#f59e0b">${t('pos.secondary', { pen: pen })}</span>`;
          } else {
            const pen = Math.round(defBase * 0.50);
            posHint = `<span style="color:#ef4444">${t('pos.out_of_pos', { pen: pen })}</span>`;
          }

          slotRow.innerHTML = `
            <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:#94a3b8;min-width:24px;">${slot}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:10px;font-weight:bold;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${player.name}${getPlayerBadgeIconsHTML(player)}</div>
              <div style="font-size:9px;color:${rColor};">${player.rarity} • OVR ${ovr} ${posHint}</div>
            </div>
          `;
          slotRow.title = t('draft.drag_to_reorder');
        } else {
          slotRow.innerHTML = `
            <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:#374151;min-width:24px;">${slot}</span>
            <span style="font-size:10px;color:#374151;">${t('pos.empty')}</span>
          `;
        }

        // DRAG AND DROP EVENTS
        slotRow.setAttribute('draggable', 'true');
        slotRow.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', slot);
          slotRow.style.opacity = '0.5';
        });
        slotRow.addEventListener('dragend', () => {
          slotRow.style.opacity = '1';
        });
        slotRow.addEventListener('dragover', (e) => {
          e.preventDefault();
          slotRow.style.background = 'rgba(255,255,255,0.1)';
        });
        slotRow.addEventListener('dragleave', (e) => {
          slotRow.style.background = 'rgba(0,0,0,0.2)';
        });
        slotRow.addEventListener('drop', (e) => {
          e.preventDefault();
          slotRow.style.background = 'rgba(0,0,0,0.2)';
          const sourceSlot = e.dataTransfer.getData('text/plain');
          if (sourceSlot && sourceSlot !== slot) {
            const temp = G.draftRoster[slot];
            G.draftRoster[slot] = G.draftRoster[sourceSlot];
            G.draftRoster[sourceSlot] = temp;
            if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
          }
        });

        rosterPanel.appendChild(slotRow);
      });

      // ───── CENTER: 3 Pick Cards ─────────────────────────────────────────
      const centerPanel = document.createElement('div');
      centerPanel.id = 'draft-col-cards';
      centerPanel.className = 'draft-col md:col-span-6 flex flex-col items-center gap-4';

      const cardsRow = document.createElement('div');
      cardsRow.className = 'cards-row flex flex-col md:flex-row gap-3 justify-center items-center md:items-start w-full';

      // Tap-to-open vintage pack — themed per round's rarity floor:
      // Round 1 -> epic_plus (Gold / Diamond foil - Epic or Better)
      // Round 2 -> epic (Purple foil - Guaranteed Epic)
      // Round 3 -> rare (Sapphire Blue foil - Guaranteed Rare)
      // Round 4 -> uncommon (Emerald Green foil - Guaranteed Uncommon)
      // Rounds 5-8 -> common (Vintage plain wax pack - 4 Common rounds)
      // Round 9 -> random (Rainbow mystery pack - 1 Free round)
      let packTheme = 'random';
      if (round === 1) packTheme = 'epic_plus';
      else if (round === 2) packTheme = 'epic';
      else if (round === 3) packTheme = 'rare';
      else if (round === 4) packTheme = 'uncommon';
      else if (round >= 5 && round <= 8) packTheme = 'common';
      else packTheme = 'random';

      const pack = document.createElement('div');
      pack.className = `draft-pack draft-pack--${packTheme}`;
      pack.innerHTML = `
        <div class="draft-pack-crimp"></div>
        <div class="draft-pack-badge">R${round}/9</div>
        <div class="draft-pack-brand">⚾ BASEROGUE</div>
        <div class="draft-pack-tagline">${t('draft.pack_tagline_' + packTheme)}</div>
        <div class="draft-pack-open-prompt">
          <span class="draft-pack-tap-icon">👆</span>
          <span class="draft-pack-open-text">${t('draft.pack_open_prompt')}</span>
        </div>
      `;
      cardsRow.appendChild(pack);
      if (window.AudioManager) window.AudioManager.play('menu_click');

      pack.addEventListener('click', () => {
        // Tear the pack open with a small particle burst, then hand off to the
        // staggered card deal-in.
        pack.classList.add('pack-tearing');
        if (window.AudioManager) window.AudioManager.play('menu_click');
        for (let i = 0; i < 7; i++) {
          const particle = document.createElement('div');
          particle.className = 'pack-particle';
          const angle = (Math.PI * 2 / 7) * i + (Math.random() - 0.5) * 0.4;
          const dist = 40 + Math.random() * 30;
          particle.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
          particle.style.setProperty('--py', `${Math.sin(angle) * dist - 20}px`);
          particle.style.animationDelay = `${Math.random() * 60}ms`;
          pack.appendChild(particle);
        }
        setTimeout(renderPickCards, 280);
      }, { once: true });

      const renderPickCards = () => {
        pack.remove();
        picks.forEach((player, pickIdx) => {
        const dealDelay = pickIdx * 130;
        const rColor = RARITY_COLORS[player.rarity] || RARITY_COLORS.Common;
        const rBg    = RARITY_BG[player.rarity]    || RARITY_BG.Common;
        const ovr    = getPlayerOvr(player);
        const cardHTML = createCardHTML(player);

        const wrapper = document.createElement('div');
        wrapper.className = 'draft-card-wrapper w-[175px] max-w-[175px] cursor-pointer rounded-xl border-2 transition-transform duration-150 flex flex-col items-center gap-1.5 p-2 box-border';
        wrapper.style.borderColor = rColor;
        wrapper.style.background = rBg;

        wrapper.innerHTML = `
          <div style="pointer-events:none;">${cardHTML}</div>
          <div class="draft-card-caption" style="text-align:center;width:100%;">
            <div style="font-size:10px;color:${rColor};font-weight:bold;">${player.rarity}</div>
            <div style="font-size:9.5px;color:#9ca3af;text-align:center;margin-top:2px;">${player.pos} • OVR ${ovr}</div>
          </div>
          <button class="btn" style="width:100%;padding:8px;font-size:10px;background:${rColor};color:#000;border:none;">${t('draft.select_btn')}</button>
        `;

        wrapper.addEventListener('mouseenter', () => {
          wrapper.style.transform = 'translateY(-4px)';
          wrapper.style.boxShadow = `0 8px 24px ${rColor}44`;
        });
        wrapper.addEventListener('mouseleave', () => {
          wrapper.style.transform = '';
          wrapper.style.boxShadow = '';
        });
        wrapper.addEventListener('click', () => {
          if (window.AudioManager) window.AudioManager.play('draft_pick');
          if (window.BaseballDex) window.BaseballDex.unlock(player);
          G.draftPickPlayer(player);
          if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
        });
        cardsRow.appendChild(wrapper);

        // Deal this card in from the shuffle stack, staggered so the 3 cards read
        // as a sequential deal rather than popping in together — same reusable
        // .card-deal-in class the combat faceoff cards use.
        wrapper.style.setProperty('--deal-from-y', '-90px');
        wrapper.style.animationDelay = `${dealDelay}ms`;
        wrapper.classList.add('card-deal-perspective', 'card-deal-in');
        if (window.AudioManager) setTimeout(() => window.AudioManager.play('menu_click'), dealDelay);
        });
      };

      centerPanel.appendChild(cardsRow);

      // Round descriptor below cards
      const pickHint = document.createElement('div');
      pickHint.style.cssText = 'font-size:11px;color:#6b7280;text-align:center;max-width:400px;line-height:1.4;';
      if (round === 1) {
        pickHint.textContent = t('draft.round_1_hint', t('draft.round_elite_hint'));
      } else if (round === 2) {
        pickHint.textContent = t('draft.round_2_hint', t('draft.round_elite_hint'));
      } else if (round === 3) {
        pickHint.textContent = t('draft.round_3_hint', 'Ronda de Raro garantizado. Asegura un sólido bateador titular.');
      } else if (round === 4) {
        pickHint.textContent = t('draft.round_4_hint', 'Ronda de Poco Común garantizado. Completa el núcleo de tu alineación.');
      } else if (round >= 5 && round <= 8) {
        pickHint.textContent = t('draft.round_common_hint');
      } else {
        pickHint.textContent = t('draft.round_free_hint');
      }
      centerPanel.appendChild(pickHint);
      const autoDraftBtn = document.createElement('button');
      autoDraftBtn.className = 'btn btn-secondary';
      autoDraftBtn.innerHTML = t('draft.auto_complete_btn');
      autoDraftBtn.style.cssText = 'margin-top: 15px; padding: 10px 20px; font-size: 11px;';
      autoDraftBtn.onclick = () => {
        while (G.draftRound <= 9) {
          const picks = G.getDraftRoundPicks();
          // Sort by OVR descending
          picks.sort((a,b) => {
             const ovrA = Math.round((a.con||40)*.35+(a.pwr||35)*.3+(a.spd||45)*.10+(a.def||40)*.15+(a.eye||40)*.1);
             const ovrB = Math.round((b.con||40)*.35+(b.pwr||35)*.3+(b.spd||45)*.10+(b.def||40)*.15+(b.eye||40)*.1);
             return ovrB - ovrA;
          });
          if (window.BaseballDex) window.BaseballDex.unlock(picks[0]);
          G.draftPickPlayer(picks[0]);
        }
        renderFinalLineupConfirmation();
      };
      centerPanel.appendChild(autoDraftBtn);


      // ───── RIGHT: Batting Order Panel ──────────────────────────────────
      const orderPanel = document.createElement('div');
      orderPanel.id = 'draft-col-order';
      orderPanel.className = 'draft-col md:col-span-3';
      orderPanel.style.cssText = 'background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;';
      orderPanel.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#9ca3af;margin-bottom:10px;text-align:center;letter-spacing:1px;">
          ${t('draft.batting_order_header')}
        </div>
      `;

      function renderBattingOrderRows() {
        const existing = orderPanel.querySelectorAll('.bo-row');
        existing.forEach(e => e.remove());

        G.draftBattingOrder.forEach((slot, idx) => {
          const player = G.draftRoster[slot];
          const rColor = player ? (RARITY_COLORS[player.rarity] || RARITY_COLORS.Common) : 'rgba(255,255,255,0.1)';
          const row = document.createElement('div');
          row.className = 'bo-row';
          row.style.cssText = [
            'display:flex','align-items:center','gap:6px',
            'background:rgba(0,0,0,0.2)','border-radius:6px',
            'padding:5px 7px','margin-bottom:5px',
            `border-left:3px solid ${rColor}`
          ].join(';');

          const nameStr = player
            ? `<span style="font-size:9px;color:#fff;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${player.name.split(' ').pop()}${getPlayerBadgeIconsHTML(player)}</span>`
            : `<span style="font-size:9px;color:#374151;flex:1;">${slot} —</span>`;

          row.innerHTML = `
            <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:#6b7280;min-width:12px;">${idx+1}</span>
            <span style="font-size:8px;color:#94a3b8;min-width:20px;">${slot}</span>
            ${nameStr}
          `;
          orderPanel.appendChild(row);
        });

        // Wire up buttons
        
        // Drag and drop for batting order
        const rows = orderPanel.querySelectorAll('.bo-row');
        rows.forEach((row, rIdx) => {
          row.setAttribute('draggable', 'true');
          row.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', rIdx.toString());
            row.style.opacity = '0.5';
          });
          row.addEventListener('dragend', () => {
            row.style.opacity = '1';
          });
          row.addEventListener('dragover', (e) => {
            e.preventDefault();
            row.style.background = 'rgba(255,255,255,0.1)';
          });
          row.addEventListener('dragleave', (e) => {
            row.style.background = 'rgba(0,0,0,0.25)';
          });
          row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.style.background = 'rgba(0,0,0,0.25)';
            const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'));
            if (!isNaN(sourceIdx) && sourceIdx !== rIdx) {
              const temp = G.draftBattingOrder[rIdx];
              G.draftBattingOrder[rIdx] = G.draftBattingOrder[sourceIdx];
              G.draftBattingOrder[sourceIdx] = temp;
              renderBattingOrderRows();
            }
          });
        });
      }
      renderBattingOrderRows();

      // Botón Auto-Ordenar
      const autoSortBtn = document.createElement('button');
      autoSortBtn.className = 'btn btn-secondary';
      autoSortBtn.style.cssText = 'width:100%;font-size:7px;padding:6px;margin-top:10px;background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);';
      autoSortBtn.innerHTML = '⚙️ AUTO ORDEN';
      autoSortBtn.title = (typeof window.t==='function'?window.t('ui.autosort_tooltip'):'Ordena lógicamente: Velocidad al 1ro, Poder al 4to, Mejores bates al 2do y 3ro.');
      autoSortBtn.onclick = () => {
        G.draftBattingOrder = G.autoSortBattingOrder(G.draftRoster, G.draftBattingOrder);
        renderBattingOrderRows();
      };
      orderPanel.appendChild(autoSortBtn);

      // Assemble 3-column layout
      layout.appendChild(rosterPanel);
      layout.appendChild(centerPanel);
      layout.appendChild(orderPanel);
      pool.appendChild(layout);

      setMobileTab(currentMobileTab || 'action');

      if (round === 1) {
        showTutorialTip(
          'draft-roster', document.getElementById('draft-col-roster'),
          'tutorial.draft_roster_title', 'tutorial.draft_roster_text', 'bottom',
          () => showTutorialTip(
            'draft-synergies', document.getElementById('synergies-sidebar-panel'),
            'tutorial.draft_synergies_title', 'tutorial.draft_synergies_text', 'bottom'
          )
        );
      }

    } catch(e) {
      console.error(e);
      const banner = document.getElementById('debug-error-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.innerText += 'renderDraftRound Error: ' + e.message + '\n' + e.stack + '\n\n';
      }
    }
  }

  // Expose renderDraftRound to window immediately after declaration
  window.renderDraftRound = renderDraftRound;
  window.renderSynergiesAndItems = renderSynergiesAndItems;
  window.showOutcomePopup = showOutcomePopup;
  window.getDraftSynergyPrediction = getDraftSynergyPrediction;
  window.setupAndStartMatchSimulation = setupAndStartMatchSimulation;
  window.handleRollDice = handleRollDice;
  window.setupAndShowPreFightScreen = setupAndShowPreFightScreen;
  window.showSuperBossIntroModal = showSuperBossIntroModal;
  window.showZoneBossIntroModal = showZoneBossIntroModal;
  window.showStorySeasonIntroModal = showStorySeasonIntroModal;
  window.openRunSummaryModal = openRunSummaryModal;
  window.renderActiveRoster = renderActiveRoster;
  window.closeNodeCompleted = closeNodeCompleted;

  // renderLineupAssignment is no longer needed (handled inline in draft rounds)
  // Keeping stub so any legacy references don't throw
  function renderLineupAssignment() { renderDraftRound(); }

  /** Final confirmation screen after completing all 9 draft rounds */
  function renderFinalLineupConfirmation() {
    try {
      const G = window.Game;
      const pool = el.starterPool;
      pool.innerHTML = '';
      pool.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:100%;max-width:1000px;margin:0 auto;';

      const shield = G.calculateDraftShield();

      // Compact Top banner with Shield centered below title
      const header = document.createElement('div');
      header.style.cssText = 'width:100%;text-align:center;padding:2px 0 12px;';
      header.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:#10b981;margin-bottom:6px;letter-spacing:1px;">
          ${t('draft.confirm_lineup_title')}
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(59,130,246,0.12);border:1px solid #3b82f6;border-radius:20px;padding:4px 16px;font-size:11px;color:#3b82f6;font-weight:bold;">
          ${t('draft.initial_shield', { shield: shield })}
        </div>
      `;
      pool.appendChild(header);

      // Centered 2-column layout: Fielding Roster | Batting Order
      const layout = document.createElement('div');
      layout.id = 'final-lineup-layout';
      layout.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 items-start w-full max-w-[920px] mx-auto mb-4';

      // ───── LEFT: Fielding Roster Panel ─────────────────────────────────
      const rosterPanel = document.createElement('div');
      rosterPanel.style.cssText = 'background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;';
      rosterPanel.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#3b82f6;margin-bottom:6px;text-align:center;letter-spacing:1px;">
          ${t('draft.confirm_defensive_header')}
        </div>
      `;

      SLOTS_ORDER.forEach(slot => {
        const player = G.draftRoster[slot];
        const rColor = player ? (RARITY_COLORS[player.rarity] || RARITY_COLORS.Common) : 'rgba(255,255,255,0.1)';
        const slotRow = document.createElement('div');
        slotRow.style.cssText = [
          'display:flex','align-items:center','gap:10px',
          `border-left:4px solid ${rColor}`,
          'background:rgba(0,0,0,0.25)','border-radius:8px',
          'padding:4px 8px','margin-bottom:3px','cursor:pointer','transition:all .2s'
        ].join(';');

        if (player) {
          const ovr = getPlayerOvr(player);
          const isNative = player.pos === slot;
          const secArr = player.sec_pos ? player.sec_pos.split(',').map(s=>s.trim()) : [];
          const isSec   = secArr.includes(slot);

          let posHint = '';
          const defBase = player.def || 40;
          if (isNative) {
            posHint = `<span style="color:#10b981">${t('pos.native')}</span>`;
          } else if (slot === 'DH') {
            posHint = '<span style="color:#9ca3af">DH</span>';
          } else if (isSec) {
            const pen = Math.round(defBase * 0.15);
            posHint = `<span style="color:#f59e0b">${t('pos.secondary', { pen: pen })}</span>`;
          } else {
            const pen = Math.round(defBase * 0.50);
            posHint = `<span style="color:#ef4444">${t('pos.out_of_pos', { pen: pen })}</span>`;
          }

          slotRow.innerHTML = `
            <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#94a3b8;min-width:28px;">${slot}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;font-weight:bold;color:#fff;">${player.name}${getPlayerBadgeIconsHTML(player)}</div>
              <div style="font-size:9.5px;color:${rColor};">${player.rarity} • OVR ${ovr} ${posHint}</div>
            </div>
            <button class="btn-inspect-player" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#38bdf8;padding:4px 8px;font-size:9px;border-radius:4px;cursor:pointer;">🔍 ${t('draft.inspect_card', 'CARTA')}</button>
          `;

          const inspectBtn = slotRow.querySelector('.btn-inspect-player');
          inspectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPlayerCardPopup(player, slot);
          });
          slotRow.addEventListener('click', () => {
            showPlayerCardPopup(player, slot);
          });

          // Drag and drop setup
          slotRow.setAttribute('draggable', 'true');
          slotRow.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', slot);
            slotRow.style.opacity = '0.5';
          });
          slotRow.addEventListener('dragend', () => {
            slotRow.style.opacity = '1';
          });
        } else {
          slotRow.innerHTML = `
            <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#374151;min-width:28px;">${slot}</span>
            <span style="font-size:11px;color:#374151;">${t('pos.empty')}</span>
          `;
        }

        slotRow.addEventListener('dragover', (e) => {
          e.preventDefault();
          slotRow.style.background = 'rgba(255,255,255,0.1)';
        });
        slotRow.addEventListener('dragleave', (e) => {
          slotRow.style.background = 'rgba(0,0,0,0.25)';
        });
        slotRow.addEventListener('drop', (e) => {
          e.preventDefault();
          slotRow.style.background = 'rgba(0,0,0,0.25)';
          const sourceSlot = e.dataTransfer.getData('text/plain');
          if (sourceSlot && sourceSlot !== slot) {
            const temp = G.draftRoster[slot];
            G.draftRoster[slot] = G.draftRoster[sourceSlot];
            G.draftRoster[sourceSlot] = temp;
            renderFinalLineupConfirmation();
          }
        });

        rosterPanel.appendChild(slotRow);
      });

      // ───── RIGHT: Batting Order Panel ──────────────────────────────────
      const orderPanel = document.createElement('div');
      orderPanel.style.cssText = 'background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;';
      
      orderPanel.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#f59e0b;margin-bottom:6px;text-align:center;letter-spacing:1px;display:flex;justify-content:space-between;align-items:center;">
          <span>⚔️ ${t('draft.batting_order_header', 'ORDEN AL BATE')}</span>
          <button class="btn btn-secondary" id="btn-auto-sort" style="padding:4px 8px;font-size:8px;cursor:pointer;">🤖 ${t('draft.auto_sort', 'AUTO-ORDEN')}</button>
        </div>
      `;


      
      setTimeout(() => {
        const btnAuto = document.getElementById('btn-auto-sort');
        if(btnAuto) {
           btnAuto.onclick = () => {
             G.draftBattingOrder = G.autoSortBattingOrder(G.draftRoster, G.draftBattingOrder);
             renderConfirmationBattingRows();
           };
        }
      }, 0);
function renderConfirmationBattingRows() {
        const existing = orderPanel.querySelectorAll('.bo-row');
        existing.forEach(e => e.remove());

        G.draftBattingOrder.forEach((slot, idx) => {
          const player = G.draftRoster[slot];
          const rColor = player ? (RARITY_COLORS[player.rarity] || RARITY_COLORS.Common) : 'rgba(255,255,255,0.1)';
          const row = document.createElement('div');
          row.className = 'bo-row';
          row.style.cssText = [
            'display:flex','align-items:center','gap:8px',
            'background:rgba(0,0,0,0.25)','border-radius:8px',
            'padding:4px 8px','margin-bottom:3px',
            `border-left:4px solid ${rColor}`,
            'cursor:pointer'
          ].join(';');

          // Drag and drop setup for Batting Order rows
          row.setAttribute('draggable', 'true');
          row.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', String(idx));
            row.style.opacity = '0.5';
          });
          row.addEventListener('dragend', () => {
            row.style.opacity = '1';
          });
          row.addEventListener('dragover', (e) => {
            e.preventDefault();
            row.style.background = 'rgba(255,255,255,0.15)';
          });
          row.addEventListener('dragleave', () => {
            row.style.background = 'rgba(0,0,0,0.25)';
          });
          row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.style.background = 'rgba(0,0,0,0.25)';
            const fromIndexStr = e.dataTransfer.getData('text/plain');
            if (fromIndexStr !== '' && fromIndexStr !== null) {
              const fromIdx = parseInt(fromIndexStr, 10);
              const toIdx = idx;
              if (!isNaN(fromIdx) && fromIdx !== toIdx) {
                const temp = G.draftBattingOrder[fromIdx];
                G.draftBattingOrder[fromIdx] = G.draftBattingOrder[toIdx];
                G.draftBattingOrder[toIdx] = temp;
                renderConfirmationBattingRows();
              }
            }
          });

          if (player) {
            const ovr = getPlayerOvr(player);
            row.innerHTML = `
              <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#f59e0b;min-width:16px;">${idx+1}</span>
              <span style="font-size:9px;color:#94a3b8;min-width:24px;">${slot}</span>
              <div style="flex:1;min-width:0;">
                <div style="font-size:10.5px;font-weight:bold;color:#fff;">${player.name}</div>
                <div style="font-size:9px;color:${rColor};">OVR ${ovr} • ${player.rarity}</div>
              </div>
              <button class="btn-inspect-bo" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#38bdf8;padding:3px 6px;font-size:8.5px;border-radius:3px;margin-right:4px;">🔍</button>
              
            `;

            row.querySelector('.btn-inspect-bo').addEventListener('click', (e) => {
              e.stopPropagation();
              showPlayerCardPopup(player, slot);
            });
            row.addEventListener('click', () => {
              showPlayerCardPopup(player, slot);
            });
          } else {
            row.innerHTML = `
              <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#6b7280;min-width:16px;">${idx+1}</span>
              <span style="font-size:9px;color:#374151;flex:1;">${slot} — ${(typeof window.t==="function"?window.t("ui.empty"):"VACÍO")}</span>
            `;
          }

          orderPanel.appendChild(row);
        });

        orderPanel.querySelectorAll('.bo-up').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const i = parseInt(btn.dataset.idx);
            if (i > 0) {
              [G.draftBattingOrder[i-1], G.draftBattingOrder[i]] = [G.draftBattingOrder[i], G.draftBattingOrder[i-1]];
              renderConfirmationBattingRows();
            }
          });
        });
        orderPanel.querySelectorAll('.bo-dn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const i = parseInt(btn.dataset.idx);
            if (i < G.draftBattingOrder.length - 1) {
              [G.draftBattingOrder[i], G.draftBattingOrder[i+1]] = [G.draftBattingOrder[i+1], G.draftBattingOrder[i]];
              renderConfirmationBattingRows();
            }
          });
        });
      }

      renderConfirmationBattingRows();

      layout.appendChild(rosterPanel);
      layout.appendChild(orderPanel);
      pool.appendChild(layout);

      // Bottom Confirm & Launch Campaign Button
      const bottomBar = document.createElement('div');
      bottomBar.style.cssText = 'width:100%;text-align:center;padding:8px 0 16px;margin-top:4px;';
      bottomBar.innerHTML = `
        <button id="btn-confirm-final-lineup" class="btn" style="
          padding:12px 36px;font-size:11px;
          background:linear-gradient(135deg,#10b981,#059669);
          border:2px solid #34d399;box-shadow:0 0 20px rgba(16,185,129,0.4);
          cursor:pointer;font-family:'Press Start 2P',monospace;letter-spacing:1px;
        ">
          ${t('draft.start_campaign_btn')}
        </button>
      `;

      bottomBar.querySelector('#btn-confirm-final-lineup').addEventListener('click', () => {
        const ok = G.finalizeDraftAndStart();
        if (ok) {
          el.hud.classList.remove('hidden');
          el.workspace.classList.remove('hidden');
          updateHUD();
          renderActiveRoster();
          renderMap();
          renderSynergiesAndItems();
          window.showScreen('screen-map');

          if (G.selectedMode === 'story') {
            showStorySeasonIntroModal();
          }
        }
      });

      pool.appendChild(bottomBar);

    } catch (e) {
      console.error(e);
    }
  }

  // Initialize App
  
  



// Short "hype" intro shown before every new run's draft (not just the first time
// ever — that's the combat-info dropdown's job). Skippable via a "don't show
// again" checkbox persisted in localStorage.
function showRunIntroThenStartDraft(startDraftFn) {
  const modal = document.getElementById('modal-run-intro');
  const skip = localStorage.getItem('baserogue_skip_run_intro') === 'true';
  if (!modal || skip) {
    startDraftFn();
    return;
  }
  modal.classList.remove('hidden');
  const btn = document.getElementById('btn-run-intro-start');
  const chk = document.getElementById('chk-run-intro-skip');
  if (chk) chk.checked = false;
  if (btn) {
    btn.onclick = () => {
      if (chk && chk.checked) {
        localStorage.setItem('baserogue_skip_run_intro', 'true');
      }
      modal.classList.add('hidden');
      if (window.AudioManager) window.AudioManager.play('play_ball');
      startDraftFn();
    };
  }
}

// ── FIRST-RUN TUTORIAL: 5 anchored callouts across the core loop ──────────────
// One localStorage key holding a JSON array of seen step ids (same flat-flag
// spirit as baserogue_skip_run_intro, just one key instead of five).
const TUTORIAL_SEEN_KEY = 'baserogue_tutorial_seen';
const TUTORIAL_STEP_IDS = ['draft-roster', 'draft-synergies', 'map-basics', 'prefight-basics', 'combat-dice-zones'];

function getTutorialSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(TUTORIAL_SEEN_KEY) || '[]')); }
  catch (e) { return new Set(); }
}
function markTutorialSeen(id) {
  const seen = getTutorialSeen();
  seen.add(id);
  localStorage.setItem(TUTORIAL_SEEN_KEY, JSON.stringify([...seen]));
}
function markAllTutorialSeen() {
  localStorage.setItem(TUTORIAL_SEEN_KEY, JSON.stringify(TUTORIAL_STEP_IDS));
}

// Anchored callout bubble near `anchorEl`, auto-skipped once its id has been
// seen. `onDismiss` (optional) fires after a normal "Got it" dismiss — used to
// chain the two draft-screen tips one after another instead of stacking them.
function showTutorialTip(id, anchorEl, titleKey, textKey, placement = 'bottom', onDismiss = null) {
  if (!anchorEl || getTutorialSeen().has(id)) return;
  document.querySelectorAll('.tutorial-callout').forEach(el => el.remove());

  const callout = document.createElement('div');
  callout.className = `tutorial-callout tutorial-callout--${placement}`;
  callout.innerHTML = `
    <div class="tutorial-callout-title">${t(titleKey)}</div>
    <div class="tutorial-callout-text">${t(textKey)}</div>
    <div class="tutorial-callout-actions">
      <button class="tutorial-callout-skip">${t('tutorial.skip_all')}</button>
      <button class="tutorial-callout-ok">${t('tutorial.got_it')}</button>
    </div>
  `;
  document.body.appendChild(callout);

  const rect = anchorEl.getBoundingClientRect();
  // offsetWidth/offsetHeight (layout box), not getBoundingClientRect, since the
  // entrance animation's initial scale(0.96) transform would otherwise shrink
  // the measured rect and let the clamp undershoot the real rendered size.
  const calloutW = callout.offsetWidth;
  const calloutH = callout.offsetHeight;
  const top = placement === 'top'
    ? rect.top - calloutH - 10
    : rect.bottom + 10;
  const left = Math.max(8, Math.min(window.innerWidth - calloutW - 8, rect.left));
  const clampedTop = Math.max(8, Math.min(top, window.innerHeight - calloutH - 8));
  callout.style.top = `${clampedTop}px`;
  callout.style.left = `${left}px`;

  callout.querySelector('.tutorial-callout-ok').addEventListener('click', () => {
    markTutorialSeen(id);
    callout.remove();
    if (onDismiss) onDismiss();
  });
  callout.querySelector('.tutorial-callout-skip').addEventListener('click', () => {
    markAllTutorialSeen();
    callout.remove();
  });
}

function initGameModeSelector() {
    const screenMode = document.getElementById('screen-mode-select');
    const screenMenu = document.getElementById('screen-menu');
    const modalSeason = document.getElementById('modal-season-select');
    const selectYear = document.getElementById('select-season-year');
    const btnStory = document.getElementById('btn-select-story-mode');
    const btnQuick = document.getElementById('btn-select-quick-mode');
    const btnCloseModal = document.getElementById('btn-close-season-modal');
    const btnConfirmSeason = document.getElementById('btn-confirm-start-season');

    if (!screenMode || !screenMenu) return;

    // Show mode selector first on startup
    screenMode.classList.remove('hidden');
    screenMenu.classList.add('hidden');
    if (window.Challenge162 && typeof window.Challenge162.updateModeSelectCard === 'function') {
      window.Challenge162.updateModeSelectCard();
    }

    // Populate Season dropdown (1901-2025)
    if (selectYear && selectYear.options.length <= 1) {
      selectYear.innerHTML = '<option value="random">🎲 Random Season</option>';
      for (let y = 1901; y <= 2025; y++) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        selectYear.appendChild(opt);
      }
    }

    // Story mode card click
    if (btnStory) {
      btnStory.onclick = () => {
        if (modalSeason) modalSeason.classList.remove('hidden');
      };
    }

    // Close season modal
    if (btnCloseModal) {
      btnCloseModal.onclick = () => {
        if (modalSeason) modalSeason.classList.add('hidden');
      };
    }

    // Confirm Start Season button
    if (btnConfirmSeason) {
      btnConfirmSeason.onclick = () => {
        const yearVal = selectYear ? selectYear.value : 'random';
        if (window.Game) {
          window.Game.selectedMode = 'story';
          window.Game.selectedSeasonYear = yearVal === 'random' ? null : parseInt(yearVal, 10);
        }
        if (window.Game && window.Game.resetRun) {
          window.Game.resetRun();
        }

        if (yearVal === 'random') {
          const availableYears = Object.keys(window.OpponentsDatabase || {});
          let targetYear = '1998';
          if (availableYears.length > 0) {
            targetYear = availableYears[Math.floor(Math.random() * availableYears.length)];
          } else {
            targetYear = String(Math.floor(Math.random() * 125) + 1901);
          }

          startSeasonRouletteAnimation(targetYear, () => {
            if (modalSeason) modalSeason.classList.add('hidden');
            if (window.Game && window.Game.loadSeasonOpponents) {
              window.Game.loadSeasonOpponents(targetYear);
            }
            showRunIntroThenStartDraft(() => {
              (window.showScreen || showScreen)('screen-draft');
              if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
            });
          });
        } else {
          if (modalSeason) modalSeason.classList.add('hidden');
          if (window.Game && window.Game.loadSeasonOpponents) {
            window.Game.loadSeasonOpponents(yearVal);
          }
          showRunIntroThenStartDraft(() => {
            (window.showScreen || showScreen)('screen-draft');
            if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
          });
        }
      };
    }

    // Quick Play card click
    if (btnQuick) {
      btnQuick.onclick = () => {
        if (window.Game) {
          window.Game.selectedMode = 'quick';
          window.Game.selectedSeasonYear = null;
          window.Game.customSeasonPool = null;
        }
        if (window.Game && window.Game.resetRun) {
          window.Game.resetRun();
        }
        showRunIntroThenStartDraft(() => {
          window.showScreen('screen-draft');
          if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
        });
      };
    }
  }

  // ── CAREER MODE (Player) — MVP scaffold: difficulty -> rookie pack pick ->
  // random debut year (reuses the Story Mode roulette modal) -> random team
  // -> career hub. Season simulation itself is future work. ─────────────────
  function hideAllTopLevelScreens() {
    ['screen-mode-select', 'screen-menu', 'screen-career-pack', 'screen-career-draft-reveal', 'screen-career-hub', 'screen-career-season', 'screen-career-season-end', 'screen-career-offseason', 'screen-career-profile', 'screen-career-standings'].forEach(id => {
      const s = document.getElementById(id);
      if (s) s.classList.add('hidden');
    });
    const gameWorkspace = document.getElementById('game-workspace');
    if (gameWorkspace) gameWorkspace.classList.add('hidden');
    const hud = document.getElementById('game-hud');
    if (hud) hud.classList.add('hidden');
  }

  function showCareerScreen(id) {
    hideAllTopLevelScreens();
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
    if (window.updateMobileNavVisibility) window.updateMobileNavVisibility();
  }

  function renderCareerRookiePack(difficulty) {
    const container = document.getElementById('career-pack-container');
    if (!container || !window.Career) return;
    container.innerHTML = '';

    const picks = window.Career.getRookiePicks(difficulty);
    if (!picks.length) {
      container.innerHTML = `<div style="color:#ef4444;font-size:12px;">${t('career.no_picks', 'No hay jugadores disponibles para esta dificultad.')}</div>`;
      return;
    }

    // Same tap-to-open pack as the 9-round draft: themed by the difficulty's
    // rarity floor, tears open with a particle burst, then hands off to the
    // staggered card deal-in below.
    const rarities = picks.map(p => p.rarity || 'Common');
    let packTheme = 'random';
    if (rarities.includes('Legendary') || rarities.includes('Epic')) packTheme = 'epic';
    else if (rarities.includes('Rare')) packTheme = 'rare';
    else if (rarities.includes('Uncommon')) packTheme = 'uncommon';
    else if (rarities.every(r => r === 'Common')) packTheme = 'common';
    else packTheme = 'random';

    const pack = document.createElement('div');
    pack.className = `draft-pack draft-pack--${packTheme}`;
    pack.innerHTML = `
      <div class="draft-pack-crimp"></div>
      <div class="draft-pack-badge">🏆</div>
      <div class="draft-pack-brand">⚾ BASEROGUE</div>
      <div class="draft-pack-tagline">${t('draft.pack_tagline_' + packTheme)}</div>
      <div class="draft-pack-open-prompt">
        <span class="draft-pack-tap-icon">👆</span>
        <span class="draft-pack-open-text">${t('draft.pack_open_prompt')}</span>
      </div>
    `;
    container.appendChild(pack);
    if (window.AudioManager) window.AudioManager.play('menu_click');

    pack.addEventListener('click', () => {
      pack.classList.add('pack-tearing');
      if (window.AudioManager) window.AudioManager.play('menu_click');
      for (let i = 0; i < 7; i++) {
        const particle = document.createElement('div');
        particle.className = 'pack-particle';
        const angle = (Math.PI * 2 / 7) * i + (Math.random() - 0.5) * 0.4;
        const dist = 40 + Math.random() * 30;
        particle.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
        particle.style.setProperty('--py', `${Math.sin(angle) * dist - 20}px`);
        particle.style.animationDelay = `${Math.random() * 60}ms`;
        pack.appendChild(particle);
      }
      setTimeout(() => {
        pack.remove();
        renderCareerRookieCards(container, picks, difficulty);
      }, 280);
    }, { once: true });
  }

  function renderCareerRookieCards(container, picks, difficulty) {
    picks.forEach((player, idx) => {
      const rColor = RARITY_COLORS[player.rarity] || RARITY_COLORS.Common;
      const rBg = RARITY_BG[player.rarity] || RARITY_BG.Common;
      const ovr = getPlayerOvr(player);
      const cardHTML = createCardHTML(player);

      const wrapper = document.createElement('div');
      wrapper.className = 'draft-card-wrapper w-[175px] max-w-[175px] cursor-pointer rounded-xl border-2 transition-transform duration-150 flex flex-col items-center gap-1.5 p-2 box-border';
      wrapper.style.borderColor = rColor;
      wrapper.style.background = rBg;
      wrapper.innerHTML = `
        <div style="pointer-events:none;">${cardHTML}</div>
        <div class="draft-card-caption" style="text-align:center;width:100%;">
          <div style="font-size:10px;color:${rColor};font-weight:bold;">${player.rarity}</div>
          <div style="font-size:9.5px;color:#9ca3af;text-align:center;margin-top:2px;">${player.pos || player.role} • OVR ${ovr} (potencial)</div>
        </div>
        <button class="btn" style="width:100%;padding:8px;font-size:10px;background:${rColor};color:#000;border:none;">${t('career.pick_btn', 'ELEGIR')}</button>
      `;
      wrapper.style.setProperty('--deal-from-y', '-90px');
      wrapper.style.animationDelay = `${idx * 130}ms`;
      wrapper.classList.add('card-deal-perspective', 'card-deal-in');

      wrapper.addEventListener('mouseenter', () => {
        wrapper.style.transform = 'translateY(-4px)';
        wrapper.style.boxShadow = `0 8px 24px ${rColor}44`;
      });
      wrapper.addEventListener('mouseleave', () => {
        wrapper.style.transform = '';
        wrapper.style.boxShadow = '';
      });
      wrapper.addEventListener('click', () => {
        if (window.AudioManager) window.AudioManager.play('draft_pick');
        window.Career.startCareer(difficulty, player);
        startCareerPathwayRoulette();
      });
      container.appendChild(wrapper);
    });
  }

  /** Debut-pathway wheel (see 12.3) — spins BEFORE the year/team reveal,
   * deciding high-school-direct vs. junior-college vs. 3/4-year-college:
   * a real trade-off between starting attribute floor and years of career
   * runway (careerAge), not flavor. Reuses the same key-moment modal/wheel
   * every other Career roulette uses instead of a new surface. */
  function startCareerPathwayRoulette() {
    const C = window.Career;
    const modal = document.getElementById('modal-career-key-moment');
    if (!modal) { startCareerDebutRoulette(); return; }
    const titleEl = document.getElementById('key-moment-title');
    const wheelContainer = document.getElementById('career-wheel-container');
    const vitalsEl = document.getElementById('key-moment-vitals');
    const btnContinue = document.getElementById('btn-key-moment-continue');

    titleEl.textContent = `🎓 ${t('career.pathway_title', 'CAMINO AL DEBUT')}`;
    vitalsEl.innerHTML = `<div style="font-size:10px; color:#9ca3af; margin-bottom:8px;">${t('career.pathway_prompt', '¿Cómo llegaste a las Mayores?')}</div>`;
    btnContinue.classList.add('hidden');
    modal.classList.remove('hidden');

    const options = C.getDebutPathwayOptions();
    const items = options.map(o => ({ key: o.key, weight: 1, color: o.color, label: `${o.label} (${o.age})` }));

    renderCareerWheelWidget(wheelContainer, items, (chosenKey) => {
      const chosen = C.applyDebutPathway(chosenKey);
      vitalsEl.innerHTML = `
        <div style="color:${chosen.color}; font-weight:bold; margin-bottom:6px;">${chosen.label} — ${t('career.hub_age', 'Edad')} ${chosen.age}</div>
        <div>${chosen.desc}</div>
      `;
      btnContinue.classList.remove('hidden');
    }, 'notable');

    btnContinue.onclick = () => {
      modal.classList.add('hidden');
      startCareerDebutRoulette();
    };
  }

  function startCareerDebutRoulette() {
    const modalSeason = document.getElementById('modal-season-select');
    if (!modalSeason || !window.startSeasonRouletteAnimation) {
      finishCareerDebut();
      return;
    }
    modalSeason.classList.remove('hidden');
    const allYears = Object.keys(window.OpponentsDatabase || {});
    // Constrain the debut-year roulette to a plausible window around the
    // REAL player's real debut (e.g. a modern-era card like Joe Mauer,
    // debut 2004, should never be able to land in 1949) — the pool cards
    // already carry debut_year/last_year (same fields buildSeasonLeague
    // uses), just never applied here before. Falls back to the full range
    // if the card has no debut_year or nothing in-window has data.
    const potential = window.Career && window.Career.potential;
    let candidateYears = allYears;
    if (potential && typeof potential.debut_year === 'number') {
      const windowed = allYears.filter(y => {
        const n = parseInt(y, 10);
        return n >= potential.debut_year && n <= potential.debut_year + 3;
      });
      if (windowed.length) candidateYears = windowed;
    }
    let targetYear = candidateYears.length
      ? candidateYears[Math.floor(Math.random() * candidateYears.length)]
      : String(Math.floor(Math.random() * 125) + 1901);

    window.startSeasonRouletteAnimation(targetYear, () => {
      modalSeason.classList.add('hidden');
      finishCareerDebut(parseInt(targetYear, 10));
    });
  }

  function finishCareerDebut(year) {
    const resolvedYear = year || (1901 + Math.floor(Math.random() * 125));
    window.Career.setDebutYear(resolvedYear);

    // Candidate pool: every real team from that year (all tiers combined),
    // excluding Negro League teams (see Career.isCareerEligibleTeam) — this
    // mode is built on the Lahman/MLB pool, a player should never be
    // drafted onto a segregation-era Negro League club.
    const yearData = (window.OpponentsDatabase || {})[resolvedYear] || (window.OpponentsDatabase || {})[String(resolvedYear)];
    let allTeams = [];
    if (yearData) {
      ['low', 'mid', 'high'].forEach(t => { if (Array.isArray(yearData[t])) allTeams.push(...yearData[t]); });
    }
    if (window.CAREER_IS_ELIGIBLE_TEAM) allTeams = allTeams.filter(window.CAREER_IS_ELIGIBLE_TEAM);
    const team = allTeams.length ? allTeams[Math.floor(Math.random() * allTeams.length)] : null;
    window.Career.setTeam(team);

    showCareerScreen('screen-career-draft-reveal');
    runCareerDraftRoulette(allTeams, team);
  }

  function runCareerDraftRoulette(allTeams, finalTeam) {
    const nameEl = document.getElementById('career-draft-team-name');
    const boxEl = document.getElementById('career-draft-roulette-box');
    const msgEl = document.getElementById('career-draft-status-msg');
    const btnContinue = document.getElementById('btn-career-draft-continue');
    if (!nameEl) { renderCareerHub(); showCareerScreen('screen-career-hub'); return; }

    boxEl.classList.remove('winning-glow');
    btnContinue.classList.add('hidden');
    msgEl.textContent = t('career.draft_status', 'Sorteando equipo...');
    const names = allTeams.length ? allTeams.map(tm => tm.name) : [finalTeam ? finalTeam.name : '???'];

    let tick = 0;
    const maxTicks = 20;
    let speed = 40;
    const step = () => {
      tick++;
      nameEl.textContent = names[Math.floor(Math.random() * names.length)];
      if (window.AudioManager) window.AudioManager.play('roulette_tick', 1.0 + (tick / maxTicks) * 0.35);
      if (tick < maxTicks) {
        speed += 10;
        setTimeout(step, speed);
      } else {
        nameEl.textContent = finalTeam ? finalTeam.name : '???';
        boxEl.classList.add('winning-glow');
        const role = window.Career ? window.Career.getProjectedRole(finalTeam) : 'rotation';
        msgEl.innerHTML = `<span style="color:#ffd700;font-weight:bold;">⚡ ${t('career.draft_status_done', '¡Te draftea!')} ⚡</span><br><span style="font-size:9px;">${careerRoleBadgeHTML(role)}</span>`;
        if (window.AudioManager) window.AudioManager.play('roulette_win');
        btnContinue.classList.remove('hidden');
      }
    };
    step();

    btnContinue.onclick = () => {
      renderCareerHub();
      showCareerScreen('screen-career-hub');
    };
  }

  function renderCareerHub() {
    const container = document.getElementById('career-hub-container');
    if (!container || !window.Career || !window.Career.player) return;
    const C = window.Career;
    const player = C.player;
    const rColor = RARITY_COLORS[player.rarity] || RARITY_COLORS.Common;
    const cardHTML = createCardHTML(player);
    const teamName = C.team ? (C.team.name || C.team.teamID || '—') : '—';

    const age = player.careerAge || 21;
    const seasonsPlayed = C.seasonHistory.length;
    const hofLine = seasonsPlayed
      ? `<div>${t('career.hub_hof_score', 'Puntaje HOF')}: <strong style="color:#f59e0b;">${C.hofScore}</strong></div>`
      : '';

    container.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center; align-items:flex-start;">
        <div>${cardHTML}</div>
        <div style="text-align:left; min-width:220px; font-size:12px; color:#e4e4e7; line-height:1.8;">
          <div><strong style="color:${rColor};">${player.name}</strong></div>
          <div>${t('career.hub_debut', 'Debut')}: <strong>${C.debutYear}</strong></div>
          <div>${t('career.hub_current_year', 'Temporada')}: <strong>${C.currentYear}</strong> (${t('career.hub_age', 'Edad')} ${age})</div>
          <div>${t('career.hub_team', 'Equipo')}: <strong>${teamName}</strong></div>
          <div>${t('career.hub_potential', 'Potencial (OVR)')}: <strong>${getPlayerOvr(C.potential)}</strong></div>
          <div>${t('career.hub_current', 'OVR actual')}: <strong>${getPlayerOvr(player)}</strong></div>
          <div>${t('career.hub_difficulty', 'Dificultad')}: <strong>${C.difficulty}</strong></div>
          ${hofLine}
        </div>
      </div>
      <button id="btn-career-play-season" class="btn" style="margin-top:22px; padding:12px 22px; font-size:12px; font-family:'Press Start 2P',monospace; background:linear-gradient(135deg,#ec4899,#db2777); border:2px solid #f472b6; cursor:pointer; color:#fff;">
        ${C.offseasonPending
          ? `📋 ${t('career.go_offseason', 'IR AL OFFSEASON')}`
          : `▶ ${t('career.hub_play_season', 'JUGAR TEMPORADA')} ${C.currentYear}`}
      </button>
    `;

    const btnPlaySeason = document.getElementById('btn-career-play-season');
    if (btnPlaySeason) {
      btnPlaySeason.onclick = () => {
        if (C.offseasonPending) {
          showCareerScreen('screen-career-offseason');
          renderCareerOffseason();
          return;
        }
        if (!C.seasonEvents || !C.seasonEvents.length) C.startSeason();
        showCareerScreen('screen-career-season');
        renderCareerSeason();
      };
    }

    renderCareerRatingsInto('career-ratings-panel-hub');
    renderCareerHistoryInto('career-history-sidebar-hub');
  }

  // ── Reusable spinning wheel (real circular wheel, not a text tick) —
  // used for every probabilistic reveal in Career mode: season moment,
  // playoff rounds, and (eventually) risk-card outcomes. Takes weighted
  // segments, decides the winner by weight FIRST, then just animates the
  // spin to land there — same "decide then animate" pattern the old tick
  // roulette used, different visual.
  function buildCareerWheelSegments(items) {
    const total = items.reduce((sum, it) => sum + it.weight, 0) || 1;
    let acc = 0;
    return items.map(it => {
      const start = (acc / total) * 100;
      acc += it.weight;
      const end = (acc / total) * 100;
      return { ...it, start, end, centerDeg: ((start + end) / 2) / 100 * 360 };
    });
  }

  function pickCareerWeighted(items) {
    const total = items.reduce((sum, it) => sum + it.weight, 0);
    let r = Math.random() * total;
    for (const it of items) {
      if (r < it.weight) return it;
      r -= it.weight;
    }
    return items[items.length - 1];
  }

  /** Spins `wheelEl` (a round div) to land on `chosenKey` among `segments`
   * (from buildCareerWheelSegments), calling onComplete when the CSS
   * transition finishes. Pointer is assumed fixed at the top (0deg). */
  function spinCareerWheel(wheelEl, segments, chosenKey, onComplete) {
    const gradient = segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ');
    wheelEl.style.background = `conic-gradient(${gradient})`;
    wheelEl.style.transition = 'none';
    wheelEl.style.transform = 'rotate(0deg)';
    void wheelEl.offsetWidth;

    const chosen = segments.find(s => s.key === chosenKey) || segments[0];
    const arcWidthDeg = ((chosen.end - chosen.start) / 100) * 360;
    const jitter = (Math.random() - 0.5) * Math.max(0, arcWidthDeg - 6);
    const spins = 5 * 360;
    const finalDeg = spins + (360 - chosen.centerDeg) + jitter;

    if (window.AudioManager) window.AudioManager.play('roulette_tick');
    // setTimeout instead of requestAnimationFrame: in some preview/testing
    // environments (non-visible tab, no frame compositing) rAF never fires,
    // silently leaving the wheel un-rotated even though the outcome logic
    // still resolves correctly — setTimeout is more portable and still
    // looks right in a real browser.
    setTimeout(() => {
      wheelEl.style.transition = 'transform 3.1s cubic-bezier(0.12,0.72,0.22,1)';
      wheelEl.style.transform = `rotate(${finalDeg}deg)`;
    }, 20);
    setTimeout(() => {
      if (window.AudioManager) window.AudioManager.play('roulette_win');
      if (onComplete) onComplete();
    }, 3200);
  }

  /** Maps a CAREER_STAKES value (see career.js) to the wheel's size/glow
   * class — a routine situational spin should visibly read as calmer than
   * the season-moment or World Series spin, not just differ by outcome. */
  function careerWheelSizeClass(stakes) {
    if (stakes === 'critical') return 'career-wheel--critical';
    if (stakes === 'major') return 'career-wheel--major';
    return 'career-wheel--routine';
  }

  /** Bursts a handful of particles (reusing the pack-opening's
   * pack-particle-burst keyframe/--px/--py trick, see style.css) from the
   * wheel's center in the winning segment's color when it lands. */
  function spawnCareerWheelBurst(wrapEl, color) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'career-wheel-particle';
      const angle = (Math.PI * 2 * i) / count;
      const dist = 55 + Math.random() * 30;
      p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
      p.style.background = color;
      p.style.boxShadow = `0 0 6px 1px ${color}`;
      wrapEl.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  /** Renders the wheel markup (wheel + fixed pointer + legend) into
   * `container`, wired to spin on click and call onComplete(chosenKey).
   * `stakes` ('routine'/'notable'/'major'/'critical', see CAREER_STAKES in
   * career.js) drives the wheel's size/glow so bigger moments visibly look
   * bigger, not just differ by the text of the outcome. */
  function renderCareerWheelWidget(container, items, onComplete, stakes) {
    const segments = buildCareerWheelSegments(items);
    const sizeClass = careerWheelSizeClass(stakes);
    const legendHTML = items.map(it => `<span class="career-wheel-legend__item" data-key="${it.key}" style="color:${it.color};"><span style="width:9px; height:9px; border-radius:2px; background:${it.color}; display:inline-block; margin-right:4px;"></span>${it.label}</span>`).join('');
    container.innerHTML = `
      <div style="position:relative; width:fit-content; margin:0 auto 10px auto;">
        <div class="career-wheel-pointer"></div>
        <div id="career-wheel-disc" class="career-wheel ${sizeClass}"></div>
      </div>
      <div class="career-wheel-legend">${legendHTML}</div>
      <button id="btn-career-wheel-spin" class="btn" style="width:100%; padding:12px; font-size:12px; font-family:'Press Start 2P',monospace; background:linear-gradient(135deg,var(--career-accent),var(--career-accent-dim)); border:2px solid var(--career-accent); cursor:pointer; color:#fff;">🎡 ${t('career.spin_wheel', 'GIRAR')}</button>
    `;
    const disc = container.querySelector('#career-wheel-disc');
    const wrap = disc.parentElement;
    const btn = container.querySelector('#btn-career-wheel-spin');
    disc.style.background = `conic-gradient(${segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`;
    btn.onclick = () => {
      btn.disabled = true;
      const chosen = pickCareerWeighted(items);
      spinCareerWheel(disc, segments, chosen.key, () => {
        spawnCareerWheelBurst(wrap, chosen.color);
        const activeChip = container.querySelector(`.career-wheel-legend__item[data-key="${CSS && CSS.escape ? CSS.escape(chosen.key) : chosen.key}"]`);
        if (activeChip) activeChip.classList.add('career-wheel-legend__item--active');
        onComplete(chosen.key);
      });
    };
  }

  // ── Always-visible ratings panel: current CON/PWR/EYE/SPD/DEF/OVR plus
  // this season's live delta from key-moment growth (see applyEventGrowth).
  const CAREER_RATING_LABELS = { con: 'CON', pwr: 'PWR', eye: 'EYE', spd: 'SPD', def: 'DEF' };
  /** Persistent player panel — the Copero-style card that stays visible on
   * every Career screen (hub, season, offseason, not just Profile): a big
   * OVR number, team/age/trophy row, then the 5 attribute rows with their
   * live season delta. This is the single "how am I doing" surface the
   * whole mode is built around, not a side detail. */
  function renderCareerRatingsInto(elId) {
    const el = document.getElementById(elId);
    const C = window.Career;
    if (!el || !C || !C.player) return;
    const delta = C.seasonRatingDelta || { con: 0, pwr: 0, eye: 0, spd: 0, def: 0 };
    const rows = Object.keys(CAREER_RATING_LABELS).map(k => {
      const val = C.player[k] || 0;
      const d = delta[k] || 0;
      const state = d > 0 ? 'is-up' : d < 0 ? 'is-down' : '';
      const dHTML = d > 0 ? `<span class="delta">▲${d}</span>` : d < 0 ? `<span class="delta">▼${Math.abs(d)}</span>` : `<span class="delta">–</span>`;
      return `<div class="career-panel__rating-row ${state}"><span>${CAREER_RATING_LABELS[k]}</span><span><strong>${val}</strong> ${dHTML}</span></div>`;
    }).join('');
    const ovr = getPlayerOvr(C.player);
    const potentialOvr = getPlayerOvr(C.potential);
    const age = C.player.careerAge || 21;
    const teamName = C.team ? (C.team.name || C.team.teamID) : '—';
    const totals = C.getCareerTotals();
    const isBreakout = ovr >= potentialOvr;
    const reputation = typeof C.reputation === 'number' ? C.reputation : null;
    const repColor = reputation === null ? '#6b7280' : reputation >= 65 ? '#10b981' : reputation <= 35 ? '#ef4444' : '#f59e0b';
    const reputationHTML = reputation === null ? '' : `
        <div class="career-panel__reputation-row">
          <div style="display:flex; justify-content:space-between; font-size:8px; color:#9ca3af; margin-bottom:2px;">
            <span>${t('career.reputation_label', 'Reputación')}</span>
            <span style="color:${repColor};">${reputation}</span>
          </div>
          <div class="career-panel__reputation-track"><div class="career-panel__reputation-fill" style="width:${reputation}%; background:${repColor};"></div></div>
        </div>`;
    const wear = typeof C.wear === 'number' ? C.wear : null;
    const wearColor = wear === null ? '#6b7280' : wear >= 70 ? '#ef4444' : wear >= 40 ? '#f59e0b' : '#10b981';
    const wearHTML = wear === null ? '' : `
        <div class="career-panel__reputation-row">
          <div style="display:flex; justify-content:space-between; font-size:8px; color:#9ca3af; margin-bottom:2px;">
            <span>${t('career.wear_label', 'Desgaste')}</span>
            <span style="color:${wearColor};">${wear}</span>
          </div>
          <div class="career-panel__reputation-track"><div class="career-panel__reputation-fill" style="width:${wear}%; background:${wearColor};"></div></div>
        </div>`;
    const cashHTML = typeof C.cash === 'number' ? `<span>💵 <strong>$${C.cash}K</strong></span>` : '';
    const nemesisHTML = C.nemesis ? `
        <div style="font-size:8.5px; color:#9ca3af; text-align:center; margin-bottom:8px;">
          ⚔️ ${t('career.nemesis_label', 'Rival de siempre')}: <strong style="color:#e4e4e7;">${C.nemesis.name}</strong>
          (<span style="color:${C.nemesis.wins >= C.nemesis.losses ? '#10b981' : '#ef4444'};">${C.nemesis.wins}-${C.nemesis.losses}</span>)
        </div>` : '';

    el.innerHTML = `
      <div class="career-panel">
        <div class="career-panel__ovr ${isBreakout ? 'is-breakout' : ''}">
          <span class="career-panel__ovr-value">${ovr}</span>
          <span style="font-size:10px; color:#6b7280;">/ ${potentialOvr} ${t('career.potential_short', 'POT')}</span>
        </div>
        <div class="career-panel__name">${C.player.name}</div>
        <div class="career-panel__meta-row">
          <span>${t('career.hub_age', 'Edad')} <strong>${age}</strong></span>
          <span>${teamName}</span>
          <span>🏆 <strong>${totals.awards}</strong></span>
        </div>
        <div class="career-panel__contract-row">
          ${t('career.contract_label', 'Contrato')}: <strong style="color:#e4e4e7;">${C.contractYearsLeft || 0} ${t('career.years_short', 'años')}</strong> · $${C.contractValue || 0}K ${cashHTML}
        </div>
        ${reputationHTML}
        ${wearHTML}
        ${nemesisHTML}
        <div class="career-panel__totals-grid">
          <div><div class="label">${t('career.totals_pj', 'PJ')}</div><div class="value">${totals.games}</div></div>
          <div><div class="label">${t('career.totals_avg', 'AVG')}</div><div class="value">${totals.AVG.toFixed(3).replace(/^0/, '')}</div></div>
          <div><div class="label">${t('career.totals_hr', 'HR')}</div><div class="value">${totals.HR}</div></div>
          <div><div class="label">${t('career.totals_rbi', 'RBI')}</div><div class="value">${totals.RBI}</div></div>
          <div><div class="label">${t('career.totals_seasons', 'AÑOS')}</div><div class="value">${totals.seasons}</div></div>
        </div>
        ${rows}
      </div>
    `;
  }

  /** Compact always-visible season-by-season history (year, AVG/HR/RBI,
   * league rank) — same data as the Profile screen, but surfaced without
   * having to leave the current career screen. */
  function renderCareerHistoryInto(elId) {
    const el = document.getElementById(elId);
    const C = window.Career;
    if (!el || !C) return;
    if (!C.seasonHistory.length) { el.innerHTML = ''; return; }
    const rows = C.seasonHistory.slice(-6).reverse().map(s => {
      const jump = (typeof s.ovrEnd === 'number' && typeof s.ovrStart === 'number') ? s.ovrEnd - s.ovrStart : null;
      const jumpHTML = jump === null ? '' : (jump > 0 ? `<span style="color:#10b981;">▲${jump}</span>` : jump < 0 ? `<span style="color:#ef4444;">▼${Math.abs(jump)}</span>` : `<span style="color:#6b7280;">–</span>`);
      return `
      <div style="display:flex; justify-content:space-between; gap:6px; font-size:9.5px; color:#e4e4e7; padding:2px 0;">
        <span style="color:#ec4899;">${s.year}</span>
        <span>OVR ${s.ovrEnd || '—'} ${jumpHTML}</span>
        <span>${s.stats.AVG.toFixed(3)} · ${s.stats.HR}HR</span>
        <span style="color:#9ca3af;">#${s.leagueRank}/${s.leagueSize}</span>
      </div>`;
    }).join('');
    el.innerHTML = `
      <div style="max-width:260px; margin:0 auto; background:rgba(0,0,0,0.35); border:1px solid rgba(236,72,153,0.25); border-radius:10px; padding:10px 14px;">
        <div style="font-size:9px; color:#ec4899; font-weight:bold; margin-bottom:6px; text-align:center;">${t('career.progress_title', 'PROGRESIÓN')}</div>
        ${rows}
      </div>
    `;
  }

  // ── CAREER SEASON: choice events + season-moment roulette ────────────────
  // Copy for the 2 narrative choice events — kept in ui.js (display strings)
  // separate from career.js (the rating deltas each choice applies).
  // Flavor copy for the 10-template event pool (career.js EVENT_TEMPLATE_POOL
  // owns the rating deltas; this only owns display text). Two are drawn at
  // random each season so the same pair doesn't show up every year.
  const CAREER_STAKES_COPY = {
    routine: { label: 'RUTINA', color: '#64748b' },
    notable: { label: 'RELEVANTE', color: '#3b82f6' },
    major: { label: 'GRAN MOMENTO', color: '#f59e0b' },
    critical: { label: 'DECISIVO', color: '#ef4444' }
  };
  /** ace_matchup's prompt names the real opposing team/pitcher when the
   * event carries a rivalContext (see Career.getRivalTeamAndAce) instead of
   * the generic "best pitcher in the league" fallback text. */
  function careerSituationalPrompt(event, template) {
    if (!template) return '';
    if (event && event.id === 'ace_matchup' && event.rivalContext) {
      const rc = event.rivalContext;
      const pitcherName = rc.pitcher ? rc.pitcher.name : null;
      return pitcherName
        ? t('career.ace_matchup_named', 'Te toca enfrentar a {pitcher} de los {team}, con todos los ojos encima.').replace('{pitcher}', pitcherName).replace('{team}', rc.teamName)
        : t('career.ace_matchup_team', 'Te toca enfrentar a los {team} y a su mejor brazo, con todos los ojos encima.').replace('{team}', rc.teamName);
    }
    return template.prompt;
  }

  /** Small badge naming how big a deal an event is (see CAREER_STAKES in
   * career.js) — makes the "this matters more" signal legible in text, not
   * just in the wheel's size. */
  function careerStakesBadgeHTML(stakes) {
    const copy = CAREER_STAKES_COPY[stakes] || CAREER_STAKES_COPY.routine;
    return `<span class="career-stakes-badge" style="color:${copy.color};">${t('career.stakes_' + (stakes || 'routine'), copy.label)}</span>`;
  }

  const CAREER_EVENT_COPY = {
    preseason_training: {
      icon: '🏋️', title: 'PRETEMPORADA', prompt: 'Antes de arrancar la temporada, ¿cómo te preparas?',
      choices: {
        hard: 'Entrenar a fondo', technical: 'Trabajo técnico con el bate', careful: 'Cuidar el cuerpo'
      }
    },
    batting_cage: {
      icon: '⚾', title: 'JAULA DE BATEO', prompt: 'Tienes tiempo extra en la jaula. ¿En qué te enfocas?',
      choices: { power_focus: 'Buscar más potencia', contact_focus: 'Afinar el contacto', balanced: 'Trabajo parejo' }
    },
    sprint_drills: {
      icon: '🏃', title: 'TRABAJO DE VELOCIDAD', prompt: 'El preparador físico te ofrece un plan extra.',
      choices: { speed_work: 'Sprints puros', agility: 'Agilidad y reflejos' }
    },
    film_study: {
      icon: '🎥', title: 'ESTUDIO DE VIDEO', prompt: '¿Qué repasás en las sesiones de video?',
      choices: { study_pitchers: 'Lanzadores rivales', study_defense: 'Posicionamiento defensivo' }
    },
    midseason_slump: {
      icon: '📉', title: 'MITAD DE TEMPORADA', prompt: 'Llevas unas semanas irregulares. ¿Cómo lo manejas?',
      choices: { push: 'Forzar el poder', patient: 'Jugar con paciencia', rest: 'Bajar el ritmo' }
    },
    clubhouse_leader: {
      icon: '🗣️', title: 'VESTUARIO', prompt: 'El equipo necesita un líder. ¿Cuál es tu rol?',
      choices: { vocal: 'Ser la voz del equipo', quiet: 'Liderar con el ejemplo' }
    },
    contract_pressure: {
      icon: '💰', title: 'PRESIÓN DE CONTRATO', prompt: 'Se habla de tu futuro contrato en los medios.',
      choices: { play_angry: 'Jugar con intensidad', stay_cool: 'Mantener la cabeza fría' }
    },
    nagging_injury: {
      icon: '🩹', title: 'MOLESTIA FÍSICA', prompt: 'Arrastras una molestia menor.',
      choices: { play_through: 'Jugar así', sit_out: 'Cuidarte unos días' }
    },
    hitting_coach: {
      icon: '🧢', title: 'COACH DE BATEO', prompt: 'El coach te propone un ajuste.',
      choices: { new_stance: 'Probar una postura nueva', tweak_swing: 'Afinar el swing actual' }
    },
    road_trip: {
      icon: '🚌', title: 'GIRA DE VISITANTE', prompt: 'Una gira larga por el camino.',
      choices: { focus_travel: 'Rutina y descanso', party_hard: 'Salir con los compañeros' }
    }
  };


  function renderCareerSeason() {
    const C = window.Career;
    if (!C) return;
    const titleEl = document.getElementById('career-season-title');
    if (titleEl) titleEl.textContent = `🏆 ${t('career.season_title', 'TEMPORADA')} ${C.currentYear} (${C.seasonGameCount || 162} ${t('career.games', 'partidos')}) — ${C.player.name}`;

    const statlineEl = document.getElementById('career-season-statline');
    if (statlineEl) statlineEl.innerHTML = '';
    renderCareerRatingsInto('career-ratings-panel-season');
    renderCareerHistoryInto('career-history-sidebar-season');

    const calEl = document.getElementById('career-season-calendar');
    const btnNext = document.getElementById('btn-career-play-next');
    if (!calEl || !btnNext) return;

    const event = C.getNextPendingEvent();
    if (!event) {
      calEl.innerHTML = `<div style="font-size:12px; color:#10b981; text-align:center;">${t('career.events_done', '¡Los eventos de la temporada están listos!')}</div>`;
      btnNext.textContent = `🏁 ${t('career.finish_season', 'VER RESUMEN DE TEMPORADA')}`;
      btnNext.onclick = () => finishCareerSeason();
      btnNext.classList.remove('hidden');
      return;
    }

    const doneCount = C.seasonEvents.filter(e => e.resolved).length;
    const progressLabel = `${t('career.event_progress', 'Evento')} ${doneCount + 1}/${C.seasonEvents.length}`;
    const stakesBadgeHTML = careerStakesBadgeHTML(event.stakes);

    if (event.type === 'choice') {
      const copy = CAREER_EVENT_COPY[event.id] || { icon: '🎲', title: event.id, prompt: '' };
      // Each option rolled a tier when the season was generated (Normal ~65%
      // / Silver ~25% / Gold ~10% — same TRAINING_TIER_CONFIG pattern as
      // Quick Play's Train screen), so the 3 cards aren't always the same
      // flat reward: a Gold card scales the OVR target up notably. Tier
      // colors are read straight from TRAINING_TIER_CONFIG so this reads as
      // the exact same visual language as Train's cards, not a lookalike.
      const tieredOptions = C.getTieredChoiceOptions(event.id);
      const cardsHTML = Object.keys(tieredOptions).map((key, idx) => {
        const opt = tieredOptions[key];
        const tierData = TRAINING_TIER_CONFIG.tiers[opt.tier] || TRAINING_TIER_CONFIG.tiers.Normal;
        // Shown value is role-adjusted (see getRoleAdjustedOvrTarget) so the
        // card's promise matches what resolving it will actually deliver —
        // the raw tiered target gets scaled by the current role's growth
        // multiplier before it lands on the player.
        const shownOvr = C.getRoleAdjustedOvrTarget(opt.ovrTarget);
        const label = (copy.choices && copy.choices[key]) || key;
        const isRisky = window.CAREER_IS_RISKY_CHOICE && window.CAREER_IS_RISKY_CHOICE(event.id, key);
        const riskTag = isRisky
          ? `<span class="choice-risk-tag choice-risk-high">🔴 ${t('career.risk_tag', 'RIESGO REPUTACIONAL')}</span>`
          : `<span class="choice-risk-tag choice-risk-safe">🟢 ${t('career.safe_tag', 'SEGURO')}</span>`;
        const animDelay = idx * 0.12;
        const glow = opt.tier === 'Gold' ? `0 0 25px ${tierData.color}50, 0 4px 20px rgba(0,0,0,0.5)` : (opt.tier === 'Silver' ? `0 0 15px ${tierData.color}35, 0 4px 20px rgba(0,0,0,0.4)` : `0 4px 20px rgba(0,0,0,0.4)`);
        return `
          <div class="career-choice-card" data-choice="${key}" style="border:2px solid ${tierData.borderColor}; box-shadow:${glow}; animation-delay:${animDelay}s;">
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <span style="font-family:'Press Start 2P',monospace; font-size:8px; color:${tierData.color}; background:${tierData.badgeBg}; border:1px solid ${tierData.color}66; padding:3px 8px; border-radius:12px;">${tierData.label}</span>
              </div>
              <div style="text-align:center; padding:8px 0;">
                <div style="font-size:34px; margin-bottom:6px; filter:drop-shadow(0 0 10px ${tierData.color});">${copy.icon}</div>
                <div style="font-weight:bold; font-size:13px; color:#e2e8f0; margin-bottom:6px;">${label}</div>
                <div style="font-weight:bold; font-size:12px; color:${tierData.color}; margin-bottom:8px;">▲ +${shownOvr} OVR</div>
                <div>${riskTag}</div>
              </div>
            </div>
            <div style="margin-top:14px; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
              <button class="btn career-choice-pick-btn" style="width:100%; padding:10px; font-size:10px; font-weight:bold; background:linear-gradient(135deg, ${tierData.color}, ${tierData.color}dd); color:#000; border:none; border-radius:8px; cursor:pointer; box-shadow:0 0 15px ${tierData.color}44;">${t('career.choose_card', 'ELEGIR')}</button>
            </div>
          </div>`;
      }).join('');
      calEl.innerHTML = `
        <div style="max-width:640px; margin:0 auto; text-align:center;">
          <div style="font-size:10px; color:#9ca3af; margin-bottom:6px;">${progressLabel} · ${stakesBadgeHTML}</div>
          <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:var(--career-accent); margin-bottom:10px;">${copy.icon} ${copy.title}</div>
          <div style="font-size:12px; color:#e4e4e7; margin-bottom:16px;">${copy.prompt}</div>
          <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">${cardsHTML}</div>
        </div>
      `;
      calEl.querySelectorAll('.career-choice-card').forEach(card => {
        const pick = () => {
          const result = C.resolveChoiceEvent(event.id, card.getAttribute('data-choice'));
          renderCareerSeason();
          if (result) flashCareerGrowth(result.applied, result.ovrDelta);
        };
        card.querySelector('.career-choice-pick-btn').onclick = pick;
      });
      btnNext.classList.add('hidden');
    } else if (event.type === 'crossroads') {
      // Career Crossroads (13.2) — a Copero-style decision: occasional,
      // full-screen, no tier/rarity badge (it's a life decision, not a
      // purchase), and each option can move OVR/reputation/wear/cash at
      // once instead of just OVR like the training cards above.
      const template = window.CAREER_CROSSROADS_TEMPLATES ? window.CAREER_CROSSROADS_TEMPLATES[event.id] : null;
      const options = C.getCrossroadsOptions(event.id);
      const deltaChipHTML = (label, val, positiveIsGood = true) => {
        if (!val) return '';
        const good = positiveIsGood ? val > 0 : val < 0;
        const color = good ? '#10b981' : '#ef4444';
        const sign = val > 0 ? '+' : '';
        return `<span style="color:${color}; margin-right:8px;">${label} ${sign}${val}</span>`;
      };
      const optionsHTML = Object.keys(options).map(key => {
        const opt = options[key];
        return `
          <div class="career-choice-card" data-crossroads="${key}" style="max-width:340px; border:2px solid var(--career-accent);">
            <div>
              <div style="font-weight:bold; font-size:14px; color:#e2e8f0; margin-bottom:10px; text-align:center;">${opt.label}</div>
              <div style="font-size:10.5px; color:#9ca3af; line-height:1.4; margin-bottom:12px; text-align:center;">${opt.desc}</div>
              <div style="text-align:center; font-size:10px;">
                ${deltaChipHTML('OVR', opt.ovr)}
                ${deltaChipHTML(t('career.reputation_label', 'Reputación'), opt.reputation)}
                ${deltaChipHTML(t('career.wear_label', 'Desgaste'), opt.wear, false)}
                ${deltaChipHTML('$', opt.cash)}
              </div>
            </div>
            <div style="margin-top:14px; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
              <button class="btn career-crossroads-pick-btn" style="width:100%; padding:10px; font-size:10px; font-weight:bold; background:linear-gradient(135deg, var(--career-accent), var(--career-accent-dim)); color:#000; border:none; border-radius:8px; cursor:pointer;">${t('career.choose_card', 'ELEGIR')}</button>
            </div>
          </div>`;
      }).join('');
      calEl.innerHTML = `
        <div style="max-width:720px; margin:0 auto; text-align:center;">
          <div style="font-size:10px; color:#9ca3af; margin-bottom:6px;">${progressLabel} · ${stakesBadgeHTML}</div>
          <div style="font-family:'Press Start 2P',monospace; font-size:13px; color:var(--career-accent); margin-bottom:12px;">${template ? template.icon : '🔀'} ${template ? template.title : event.id}</div>
          <div style="font-size:13px; color:#e4e4e7; margin-bottom:18px;">${template ? template.prompt : ''}</div>
          <div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:center;">${optionsHTML}</div>
        </div>
      `;
      calEl.querySelectorAll('[data-crossroads]').forEach(card => {
        card.querySelector('.career-crossroads-pick-btn').onclick = () => {
          const result = C.resolveCrossroadsEvent(event.id, card.getAttribute('data-crossroads'));
          renderCareerSeason();
          if (result) flashCareerGrowth({}, result.ovrDelta);
        };
      });
      btnNext.classList.add('hidden');
    } else if (event.type === 'situational') {
      const template = window.CAREER_SITUATIONAL_TEMPLATES ? window.CAREER_SITUATIONAL_TEMPLATES[event.id] : null;
      calEl.innerHTML = `
        <div style="max-width:420px; margin:0 auto; text-align:center;">
          <div style="font-size:10px; color:#9ca3af; margin-bottom:6px;">${progressLabel} · ${stakesBadgeHTML}</div>
          <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:var(--career-accent); margin-bottom:10px;">🎡 ${template ? template.label : event.id}</div>
          <div style="font-size:12px; color:#e4e4e7; margin-bottom:16px;">${careerSituationalPrompt(event, template)}</div>
        </div>
      `;
      btnNext.textContent = `🎡 ${t('career.play_situational', 'GIRAR LA RULETA')}`;
      btnNext.onclick = () => openCareerSituationalRoulette(event, template);
      btnNext.classList.remove('hidden');
    } else {
      // Season-moment roulette
      calEl.innerHTML = `
        <div style="max-width:420px; margin:0 auto; text-align:center;">
          <div style="font-size:10px; color:#9ca3af; margin-bottom:6px;">${progressLabel} · ${stakesBadgeHTML}</div>
          <div style="font-family:'Press Start 2P',monospace; font-size:11px; color:var(--career-accent); margin-bottom:10px;">🎡 ${t('career.signature_title', 'MOMENTO DE LA TEMPORADA')}</div>
          <div style="font-size:12px; color:#e4e4e7; margin-bottom:16px;">${t('career.signature_desc', 'Girá la ruleta para ver cómo te fue en el tramo decisivo de la temporada.')}</div>
        </div>
      `;
      btnNext.textContent = `🎡 ${t('career.play_signature', 'GIRAR LA RULETA')}`;
      btnNext.onclick = () => openCareerSeasonMomentRoulette(event);
      btnNext.classList.remove('hidden');
    }
  }

  /** Situational events (Career.SITUATIONAL_EVENT_POOL) reuse the same
   * wheel widget as the season moment, but their outcome weights come from
   * the player's CURRENT attributes (career.js getSituationalOutcomes),
   * not a fixed table. */
  function openCareerSituationalRoulette(event, template) {
    const C = window.Career;
    const modal = document.getElementById('modal-career-key-moment');
    const titleEl = document.getElementById('key-moment-title');
    const wheelContainer = document.getElementById('career-wheel-container');
    const vitalsEl = document.getElementById('key-moment-vitals');
    const btnContinue = document.getElementById('btn-key-moment-continue');
    if (!modal) return;

    titleEl.textContent = `🎡 ${template ? template.label : event.id}`;
    vitalsEl.innerHTML = `<div style="font-size:10px; color:#9ca3af; margin-bottom:8px;">${careerSituationalPrompt(event, template)}</div>`;
    btnContinue.classList.add('hidden');
    modal.classList.remove('hidden');

    const outcomes = C.getSituationalOutcomes(event.id);
    const items = outcomes.map(o => ({ key: o.key, weight: o.weight, color: o.color, label: o.label }));

    renderCareerWheelWidget(wheelContainer, items, (chosenKey) => {
      const result = C.resolveSituationalEvent(event.id, chosenKey);
      if (!result) return;
      const ovrText = result.ovrDelta > 0 ? `+${result.ovrDelta}` : `${result.ovrDelta}`;
      const ovrColor = result.ovrDelta > 0 ? '#10b981' : (result.ovrDelta < 0 ? '#ef4444' : '#9ca3af');
      vitalsEl.innerHTML = `
        <div style="color:${result.outcome.color}; font-weight:bold; margin-bottom:6px;">${result.outcome.label}</div>
        <div style="color:${ovrColor};">${ovrText} OVR</div>
      `;
      btnContinue.classList.remove('hidden');
    }, event.stakes || 'notable');

    btnContinue.onclick = () => {
      modal.classList.add('hidden');
      renderCareerSeason();
    };
  }

  const CAREER_MOMENT_TIER_COPY = {
    nightmare: { label: 'PESADILLA', color: '#ef4444', flavor: 'Una racha para el olvido — nada te salió bien.' },
    poor: { label: 'FLOJA', color: '#f97316', flavor: 'Un tramo irregular, más sombras que luces.' },
    modest: { label: 'DISCRETA', color: '#9ca3af', flavor: 'Nada memorable, pero sin sobresaltos.' },
    solid: { label: 'SÓLIDA', color: '#10b981', flavor: 'Un tramo consistente que suma de a poco.' },
    great: { label: 'GRANDE', color: '#3b82f6', flavor: '¡Un tramo grande! La afición lo notó.' },
    historic: { label: 'HISTÓRICA', color: '#eab308', flavor: '¡Histórico! De esos que quedan en la memoria.' }
  };

  /** Spins the real wheel (renderCareerWheelWidget) for the season moment
   * and reveals the result — no dice, no probability math on screen. */
  function openCareerSeasonMomentRoulette(event) {
    const C = window.Career;
    const modal = document.getElementById('modal-career-key-moment');
    const titleEl = document.getElementById('key-moment-title');
    const wheelContainer = document.getElementById('career-wheel-container');
    const vitalsEl = document.getElementById('key-moment-vitals');
    const btnContinue = document.getElementById('btn-key-moment-continue');
    if (!modal) return;

    titleEl.textContent = `🎡 ${t('career.signature_title', 'MOMENTO DE LA TEMPORADA')}`;
    vitalsEl.innerHTML = '';
    btnContinue.classList.add('hidden');
    modal.classList.remove('hidden');

    const weights = C.getSeasonMomentWeights();
    const items = weights.map(w => ({ key: w.key, weight: w.weight, color: CAREER_MOMENT_TIER_COPY[w.key].color, label: CAREER_MOMENT_TIER_COPY[w.key].label }));

    renderCareerWheelWidget(wheelContainer, items, (chosenKey) => {
      const result = C.resolveSeasonMoment(chosenKey);
      if (!result) return;
      const copy = CAREER_MOMENT_TIER_COPY[result.tier.key];
      const line = result.line;
      const avg = line.AB > 0 ? (line.H / line.AB).toFixed(3) : '.000';
      const ovrText = result.ovrDelta > 0 ? `+${result.ovrDelta}` : `${result.ovrDelta}`;
      const ovrColor = result.ovrDelta > 0 ? '#10b981' : (result.ovrDelta < 0 ? '#ef4444' : '#9ca3af');
      vitalsEl.innerHTML = `
        <div style="margin-bottom:6px; color:${copy.color}; font-weight:bold;">${copy.label}</div>
        <div style="margin-bottom:6px;">${copy.flavor}</div>
        <div>AVG ${avg} · H ${line.H} · HR ${line.HR} · BB ${line.BB} · K ${line.K}</div>
        <div style="margin-top:6px; color:${ovrColor}; font-weight:bold;">${ovrText} OVR</div>
      `;
      btnContinue.classList.remove('hidden');
    }, 'major');

    btnContinue.onclick = () => {
      modal.classList.add('hidden');
      renderCareerSeason();
    };
  }


  /** Brief toast summarizing the rating deltas a just-resolved key moment
   * produced, so "doing well in the event" visibly pays off right away.
   * Leads with the REAL resulting OVR change (ovrDelta) when given, since
   * that's the number the player actually cares about. */
  function flashCareerGrowth(growth, ovrDelta) {
    const parts = Object.keys(growth || {}).filter(k => growth[k] !== 0)
      .map(k => `${CAREER_RATING_LABELS[k] || k.toUpperCase()} ${growth[k] > 0 ? '+' : ''}${growth[k]}`);
    if (typeof ovrDelta === 'number' && ovrDelta !== 0) {
      parts.unshift(`OVR ${ovrDelta > 0 ? '+' : ''}${ovrDelta}`);
    }
    if (!parts.length) return;
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; top:70px; left:50%; transform:translateX(-50%); z-index:10000; background:rgba(0,0,0,0.85); border:2px solid #ec4899; border-radius:8px; padding:10px 16px; font-family:"Press Start 2P",monospace; font-size:10px; color:#10b981;';
    toast.textContent = `📈 ${parts.join(' · ')}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  function finishCareerSeason() {
    const C = window.Career;
    const summary = C.finalizeSeason();
    if (summary.playoffQualified && !summary.retired) {
      openCareerPlayoffRound(summary);
    } else {
      renderCareerSeasonEnd(summary);
      showCareerScreen('screen-career-season-end');
    }
  }

  const CAREER_PLAYOFF_OUTCOME_COPY = {
    win: { color: '#10b981', flavor: '¡Ganan la serie! Siguen con vida en la postemporada.' },
    lose: { color: '#ef4444', flavor: 'Pierden la serie — se acaba la postemporada acá.' }
  };

  /** Loops through the playoff bracket (Career.getNextPlayoffRound), one
   * wheel spin per round, until eliminated or crowned champion — then shows
   * the season-end screen. */
  function openCareerPlayoffRound(summary) {
    const C = window.Career;
    const round = C.getNextPlayoffRound();
    if (!round) {
      renderCareerSeasonEnd(summary);
      showCareerScreen('screen-career-season-end');
      return;
    }

    const modal = document.getElementById('modal-career-key-moment');
    const titleEl = document.getElementById('key-moment-title');
    const wheelContainer = document.getElementById('career-wheel-container');
    const vitalsEl = document.getElementById('key-moment-vitals');
    const btnContinue = document.getElementById('btn-key-moment-continue');
    if (!modal) return;

    titleEl.textContent = `🏆 ${round.label}`;
    vitalsEl.innerHTML = round.opponent ? `<div style="font-size:10px; color:#9ca3af; margin-bottom:8px;">${t('career.playoff_vs', 'vs.')} ${round.opponent.teamName}</div>` : '';
    btnContinue.classList.add('hidden');
    modal.classList.remove('hidden');

    const items = C.getPlayoffRoundWeights();
    renderCareerWheelWidget(wheelContainer, items, (chosenKey) => {
      const result = C.resolvePlayoffRound(chosenKey);
      if (!result) return;
      const copy = CAREER_PLAYOFF_OUTCOME_COPY[chosenKey];
      const championHTML = result.champion ? `<div style="margin-top:8px; color:#f59e0b; font-weight:bold;">🏆 ¡CAMPEONES DE LA SERIE MUNDIAL!</div>` : '';
      const ovrText = result.ovrDelta > 0 ? `+${result.ovrDelta}` : `${result.ovrDelta}`;
      const ovrColor = result.ovrDelta > 0 ? '#10b981' : (result.ovrDelta < 0 ? '#ef4444' : '#9ca3af');
      vitalsEl.innerHTML = `<div style="color:${copy.color}; font-weight:bold;">${copy.flavor}</div>${championHTML}<div style="margin-top:6px; color:${ovrColor};">${ovrText} OVR</div>`;
      btnContinue.classList.remove('hidden');

      btnContinue.onclick = () => {
        modal.classList.add('hidden');
        if (result.eliminated || result.champion) {
          renderCareerSeasonEnd(summary);
          showCareerScreen('screen-career-season-end');
        } else {
          openCareerPlayoffRound(summary);
        }
      };
    }, round.stakes || 'major');
  }

  function renderCareerSeasonEnd(summary) {
    const C = window.Career;
    const container = document.getElementById('career-season-end-container');
    const titleEl = document.getElementById('career-season-end-title');
    if (titleEl) titleEl.textContent = `🏆 ${summary.year} — ${t('career.season_end_title', 'FIN DE TEMPORADA')}`;
    if (!container) return;

    const awardsHTML = summary.awards.length
      ? summary.awards.map(a => `<span style="display:inline-block; margin:3px; padding:4px 10px; border-radius:6px; background:rgba(245,158,11,0.15); border:1px solid #f59e0b; color:#f59e0b; font-size:11px;">🏅 ${a}</span>`).join('')
      : `<span style="color:#9ca3af; font-size:11px;">${t('career.no_awards', 'Sin premios esta temporada')}</span>`;

    const retiredHTML = summary.retired
      ? `<div style="margin-top:16px; padding:12px; border-radius:8px; background:rgba(245,158,11,0.1); border:1px solid #f59e0b; font-size:12px; color:#f59e0b;">
          🎽 ${t('career.retired_msg', 'Tu jugador se retira.')}
        </div>`
      : '';

    const mvpLabel = summary.mvpWinner === 'player'
      ? `<strong style="color:#f59e0b;">🏆 ${C.player.name} (${t('career.you', 'TÚ')})</strong>`
      : `<strong style="color:#9ca3af;">${t('career.other_league_player', 'Otro jugador de la liga')}</strong>`;

    // Real leaderboard: the player ranked against ~16 real batter cards
    // active that year (Career.buildSeasonLeague), all resolved with the
    // same sampling formula — no synthetic baseline, no probability roll.
    const table = summary.leagueTable || [];
    const tableRowsHTML = table.map((row, idx) => {
      const rank = idx + 1;
      const bg = row.isPlayer ? 'rgba(236,72,153,0.18)' : 'transparent';
      const nameColor = row.isPlayer ? '#ec4899' : '#e4e4e7';
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      return `
        <div style="display:flex; justify-content:space-between; gap:8px; font-size:10.5px; padding:4px 8px; border-radius:5px; background:${bg}; color:${nameColor};">
          <span>${medal} ${row.isPlayer ? `<strong>${row.name}</strong>` : row.name}</span>
          <span>${row.avg.toFixed(3)} · ${Math.round(row.hr)}HR · ${Math.round(row.rbi)}RBI</span>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div style="font-size:12px; color:#e4e4e7; line-height:1.8; text-align:left; max-width:420px; margin:0 auto;">
        <div>AVG: <strong>${summary.stats.AVG.toFixed(3)}</strong> · OBP: <strong>${summary.stats.OBP.toFixed(3)}</strong> · SLG: <strong>${summary.stats.SLG.toFixed(3)}</strong></div>
        <div>H: <strong>${summary.stats.H}</strong> · HR: <strong>${summary.stats.HR}</strong> · RBI: <strong>${summary.stats.RBI}</strong> · BB: <strong>${summary.stats.BB}</strong> · SB: <strong>${summary.stats.SB}</strong></div>
        <div>${t('career.record', 'Récord')}: <strong>${summary.record.w}-${summary.record.l}</strong> (${summary.games || 162} ${t('career.games', 'partidos')})</div>
        <div style="margin-top:10px;">${t('career.season_quality', 'Puntaje de temporada')}: <strong style="color:#ec4899;">${summary.quality}/100</strong></div>
      </div>
      <div style="margin-top:18px; max-width:420px; margin-left:auto; margin-right:auto; text-align:left;">
        <div style="font-size:10px; color:#ec4899; font-weight:bold; margin-bottom:8px; text-align:center;">${t('career.leaderboard_title', 'TABLA DE LA LIGA')} (${summary.leagueRank}/${summary.leagueSize})</div>
        <div style="max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:2px;">${tableRowsHTML}</div>
        <div style="margin-top:10px; text-align:center; font-size:11px; color:#e4e4e7;">${t('career.mvp_winner_label', 'MVP de la temporada')}: ${mvpLabel}</div>
      </div>
      <div style="margin-top:16px;">${awardsHTML}</div>
      ${retiredHTML}
    `;

    renderCareerRatingsInto('career-ratings-panel-end');

    const btnNext = document.getElementById('btn-career-next-season');
    if (btnNext) {
      if (summary.retired) {
        btnNext.textContent = `🏛️ ${t('career.see_hof_verdict', 'VER VEREDICTO DEL SALÓN DE LA FAMA')}`;
        btnNext.onclick = () => {
          openCareerHofVoteModal(() => {
            btnNext.textContent = `🏆 ${t('career.new_career', 'EMPEZAR NUEVA CARRERA')}`;
            btnNext.onclick = () => {
              C.clear();
              showCareerScreen('screen-mode-select');
            };
          });
        };
      } else {
        btnNext.textContent = `➡ ${t('career.go_offseason', 'IR AL OFFSEASON')} (${C.currentYear})`;
        btnNext.onclick = () => {
          showCareerScreen('screen-career-offseason');
          renderCareerOffseason();
        };
      }
    }
  }

  /** Dramatic HOF announcement reveal — resolves the vote once (see
   * Career.resolveHofVote, idempotent) and ticks the percentage counter up
   * from 0 to the final tally with setTimeout steps (not
   * requestAnimationFrame — see CLAUDE.md, rAF never fires in this
   * project's preview/testing tab), then reveals INDUCTED/NO INDUCTED. */
  function openCareerHofVoteModal(onDone) {
    const C = window.Career;
    const modal = document.getElementById('modal-career-hof-vote');
    if (!modal) { if (onDone) onDone(); return; }
    const nameEl = document.getElementById('hof-vote-player-name');
    const pctEl = document.getElementById('hof-vote-percent');
    const countEl = document.getElementById('hof-vote-count');
    const barEl = document.getElementById('hof-vote-bar');
    const verdictEl = document.getElementById('hof-vote-verdict');
    const btnContinue = document.getElementById('btn-hof-vote-continue');

    const result = C.resolveHofVote();
    nameEl.textContent = C.player ? C.player.name : '';
    pctEl.textContent = '0%';
    pctEl.style.color = '#e4e4e7';
    countEl.textContent = '';
    barEl.style.width = '0%';
    barEl.style.background = 'linear-gradient(90deg, var(--career-accent-dim), var(--career-accent))';
    verdictEl.textContent = '';
    btnContinue.classList.add('hidden');
    modal.classList.remove('hidden');

    const steps = 40;
    const stepMs = 40;
    let i = 0;
    const tick = () => {
      i++;
      const pct = Math.round((result.votePct * i) / steps);
      pctEl.textContent = `${pct}%`;
      barEl.style.width = `${pct}%`;
      countEl.textContent = `${Math.round((result.votesFor * i) / steps)}/${result.votesTotal} ${t('career.hof_votes_label', 'votos')}`;
      if (i < steps) {
        setTimeout(tick, stepMs);
      } else {
        const inducted = result.inducted;
        pctEl.style.color = inducted ? '#ffd700' : '#ef4444';
        barEl.style.background = inducted ? 'linear-gradient(90deg, #f59e0b, #ffd700)' : 'linear-gradient(90deg, #7f1d1d, #ef4444)';
        verdictEl.textContent = inducted ? `🏛️ ${t('career.hof_inducted', 'INGRESA AL SALÓN DE LA FAMA')}` : `${t('career.hof_not_inducted', 'NO INGRESA — 75% REQUERIDO')}`;
        verdictEl.style.color = inducted ? '#ffd700' : '#ef4444';
        if (window.AudioManager) window.AudioManager.play(inducted ? 'roulette_win' : 'roulette_tick');
        btnContinue.classList.remove('hidden');
      }
    };
    setTimeout(tick, 300);

    btnContinue.onclick = () => {
      modal.classList.add('hidden');
      if (onDone) onDone();
    };
  }

  // ── OFFSEASON: contract decision (stay vs. 2 free-agent offers) then an
  // optional winter league risk/reward — a real weighted choice each year,
  // not a rubber-stamp continue button. ────────────────────────────────────
  function teamProspectLabel(team) {
    const pct = team && typeof team.win_pct === 'number' ? team.win_pct : 0.5;
    if (pct >= 0.560) return { label: t('career.team_tier_champion', 'Candidato al título'), color: '#f59e0b' };
    if (pct >= 0.500) return { label: t('career.team_tier_competitive', 'Competitivo'), color: '#10b981' };
    return { label: t('career.team_tier_rebuild', 'En reconstrucción'), color: '#9ca3af' };
  }

  const CAREER_ROLE_COPY = {
    starter: { icon: '⭐', label: t('career.role_starter', 'Titular'), color: '#10b981', desc: t('career.role_starter_desc', 'Más turnos, más presión — crecés más rápido') },
    rotation: { icon: '🔁', label: t('career.role_rotation', 'Rotación'), color: '#3b82f6', desc: t('career.role_rotation_desc', 'Juego parejo, desarrollo estándar') },
    bench: { icon: '🪑', label: t('career.role_bench', 'Banca'), color: '#9ca3af', desc: t('career.role_bench_desc', 'Pocas chances, crecimiento lento pero seguro') }
  };
  function careerRoleBadgeHTML(roleKey) {
    const r = CAREER_ROLE_COPY[roleKey] || CAREER_ROLE_COPY.rotation;
    return `<span style="color:${r.color};">${r.icon} ${r.label}</span> — <span style="color:#9ca3af;">${r.desc}</span>`;
  }

  function renderCareerOffseason() {
    const C = window.Career;
    const container = document.getElementById('career-offseason-container');
    if (!container || !C) return;
    renderCareerRatingsInto('career-ratings-panel-offseason');
    renderCareerHistoryInto('career-history-sidebar-offseason');

    if (!C.contractResolved) {
      const offers = C.getContractOffers();
      window._careerContractOffers = offers; // stashed for the click handlers below
      const teamCard = (team, key, isCurrent) => {
        if (!team) return '';
        const tier = teamProspectLabel(team);
        const pct = Math.round((team.win_pct || 0.5) * 1000) / 10;
        const role = C.getProjectedRole(team);
        const years = team._offeredYears || 1;
        return `
          <button class="btn career-contract-btn" data-choice="${key}" style="display:block; width:100%; margin-bottom:10px; padding:14px; font-size:11px; text-align:left; background:rgba(236,72,153,0.12); border:2px solid #ec4899; color:#fff; cursor:pointer; border-radius:8px;">
            <div style="font-weight:bold; margin-bottom:4px;">${isCurrent ? '🏠 ' : '✍️ '}${team.name}</div>
            <div style="font-size:10px; color:${tier.color}; margin-bottom:3px;">${tier.label} · ${pct}% ${t('career.win_pct_label', 'de victorias')}</div>
            <div style="font-size:9px; color:#9ca3af; margin-bottom:3px;">${t('career.contract_offer_years', 'Contrato de')} ${years} ${years === 1 ? t('career.year_singular', 'año') : t('career.years_short', 'años')}</div>
            <div style="font-size:9.5px;">${careerRoleBadgeHTML(role)}</div>
          </button>`;
      };
      container.innerHTML = `
        <div style="font-size:12px; color:#e4e4e7; margin-bottom:16px;">${t('career.contract_prompt', '¿Te quedas en tu equipo o firmas en otro lado?')}</div>
        ${teamCard(offers.current, 'current', true)}
        ${teamCard(offers.offerA, 'offerA', false)}
        ${teamCard(offers.offerB, 'offerB', false)}
      `;
      container.querySelectorAll('.career-contract-btn').forEach(btn => {
        btn.onclick = () => {
          C.resolveContract(btn.getAttribute('data-choice'), window._careerContractOffers);
          renderCareerOffseason();
        };
      });
      return;
    }

    if (!C.offseasonEventResolved) {
      const outcomes = C.getOffseasonEventOutcomes();
      C._pendingOffseasonOutcomes = outcomes; // so resolveOffseasonEvent uses the SAME rolled outcomes the wheel showed
      const items = outcomes.map(o => ({ key: o.key, weight: o.weight, color: o.color, label: o.label }));
      const renewedNote = C.contractYearsLeft > 0
        ? `<div style="font-size:10px; color:#9ca3af; margin-bottom:10px;">${t('career.contract_auto_renew', 'Sigues bajo contrato')} — ${C.team ? C.team.name : ''} (${C.contractYearsLeft} ${C.contractYearsLeft === 1 ? t('career.year_singular', 'año') : t('career.years_short', 'años')} ${t('career.years_remaining', 'restantes')}).</div>`
        : '';
      container.innerHTML = `${renewedNote}<div style="font-size:12px; color:#e4e4e7; margin-bottom:12px;">${t('career.offseason_event_prompt', 'Algo pasa en el receso antes de la próxima temporada.')}</div><div id="career-offseason-wheel"></div>`;
      renderCareerWheelWidget(document.getElementById('career-offseason-wheel'), items, (chosenKey) => {
        const result = C.resolveOffseasonEvent(chosenKey);
        renderCareerOffseason();
        flashCareerOffseasonResult(result);
      }, 'routine');
      return;
    }

    container.innerHTML = `
      <div style="font-size:12px; color:#10b981; margin-bottom:18px;">${t('career.offseason_done', '¡Offseason resuelto! Listo para la próxima temporada.')}</div>
      <button class="btn" id="btn-offseason-continue" style="width:100%; padding:14px; font-size:12px; font-family:'Press Start 2P',monospace; background:linear-gradient(135deg,#10b981,#059669); border:2px solid #34d399; color:#000; cursor:pointer;">➡ ${t('career.continue', 'CONTINUAR')}</button>
    `;
    document.getElementById('btn-offseason-continue').onclick = () => {
      C.offseasonPending = false;
      C.save();
      renderCareerHub();
      showCareerScreen('screen-career-hub');
    };
  }

  function flashCareerOffseasonResult(result) {
    if (!result || !result.outcome) return;
    const outcome = result.outcome;
    const toast = document.createElement('div');
    let color = '#9ca3af', text = outcome.label;
    if (outcome.injuryAttr) {
      color = '#ef4444';
      text = `🤕 ${outcome.label}: ${CAREER_RATING_LABELS[outcome.injuryAttr]} -${outcome.injuryAmount} (${t('career.winter_injured_note', 'la próxima temporada')})`;
    } else if (result.ovrDelta > 0) {
      color = '#10b981';
      text = `💪 ${outcome.label} (+${result.ovrDelta} OVR)`;
    } else if (result.ovrDelta < 0) {
      color = '#ef4444';
      text = `⚠️ ${outcome.label} (${result.ovrDelta} OVR)`;
    } else if (outcome.hof) {
      color = '#f59e0b';
      text = `🏆 ${outcome.label} (+${outcome.hof} HOF)`;
    }
    toast.style.cssText = `position:fixed; top:70px; left:50%; transform:translateX(-50%); z-index:10000; background:rgba(0,0,0,0.85); border:2px solid ${color}; border-radius:8px; padding:10px 16px; font-family:"Press Start 2P",monospace; font-size:9px; color:${color};`;
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  // ── PROFILE / TROPHY CASE — season-by-season history, awards, HOF progress ──
  function renderCareerProfile() {
    const C = window.Career;
    const container = document.getElementById('career-profile-container');
    if (!container || !C || !C.player) return;

    const historyRows = C.seasonHistory.map(s => {
      const roleBadge = CAREER_ROLE_COPY[s.role] || CAREER_ROLE_COPY.rotation;
      const awardsStr = s.awards && s.awards.length ? s.awards.map(a => `🏅${a}`).join(' ') : '—';
      const jump = (typeof s.ovrEnd === 'number' && typeof s.ovrStart === 'number') ? s.ovrEnd - s.ovrStart : null;
      const jumpHTML = jump === null ? '' : (jump > 0 ? `<span style="color:#10b981;">▲${jump}</span>` : jump < 0 ? `<span style="color:#ef4444;">▼${Math.abs(jump)}</span>` : `<span style="color:#6b7280;">–</span>`);
      return `
        <div style="display:grid; grid-template-columns: 50px 1fr 60px 90px 60px 1fr; gap:8px; font-size:10px; padding:5px 6px; border-bottom:1px solid rgba(255,255,255,0.06); align-items:center;">
          <span style="color:#ec4899; font-weight:bold;">${s.year}</span>
          <span style="color:#e4e4e7;">${s.team || '—'}</span>
          <span>${s.ovrEnd || '—'} ${jumpHTML}</span>
          <span style="color:${roleBadge.color};">${roleBadge.icon} ${roleBadge.label}</span>
          <span style="color:#9ca3af;">#${s.leagueRank}/${s.leagueSize}</span>
          <span style="color:#f59e0b;">${awardsStr}</span>
        </div>`;
    }).join('') || `<div style="font-size:11px; color:#9ca3af; text-align:center; padding:12px;">${t('career.profile_no_seasons', 'Todavía no jugaste ninguna temporada.')}</div>`;

    const allAwards = C.seasonHistory.flatMap(s => (s.awards || []).map(a => ({ year: s.year, award: a })));
    const trophyHTML = allAwards.length
      ? allAwards.map(a => `<span style="display:inline-block; margin:3px; padding:6px 12px; border-radius:8px; background:rgba(245,158,11,0.12); border:1px solid #f59e0b; color:#f59e0b; font-size:10.5px;">🏆 ${a.award} '${String(a.year).slice(2)}</span>`).join('')
      : `<span style="font-size:11px; color:#9ca3af;">${t('career.profile_no_trophies', 'Vitrina vacía — todavía.')}</span>`;

    // HOF progress bar — no hard cap in the model, just a visual milestone
    // reference (300 reads as "serious HOF conversation" at current pacing).
    const hofPct = Math.max(2, Math.min(100, Math.round((C.hofScore / 300) * 100)));

    container.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center; margin-bottom:22px;">
        <div>${createCardHTML(C.player)}</div>
        <div style="text-align:left; min-width:220px; font-size:12px; color:#e4e4e7; line-height:1.8;">
          <div><strong style="color:#ec4899;">${C.player.name}</strong></div>
          <div>${t('career.hub_debut', 'Debut')}: <strong>${C.debutYear}</strong></div>
          <div>${t('career.hub_current_year', 'Temporada')}: <strong>${C.currentYear}</strong></div>
          <div>${t('career.hub_potential', 'Potencial (OVR)')}: <strong>${getPlayerOvr(C.potential)}</strong></div>
          <div>${t('career.hub_current', 'OVR actual')}: <strong>${getPlayerOvr(C.player)}</strong></div>
        </div>
      </div>

      <div style="max-width:520px; margin:0 auto 22px auto;">
        <div style="display:flex; justify-content:space-between; font-size:10px; color:#e4e4e7; margin-bottom:4px;">
          <span>${t('career.hof_progress', 'Progreso al Salón de la Fama')}</span>
          <span style="color:#f59e0b;">${C.hofScore}</span>
        </div>
        <div style="height:10px; background:rgba(255,255,255,0.08); border-radius:5px; overflow:hidden;">
          <div style="height:100%; width:${hofPct}%; background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div>
        </div>
      </div>

      <div style="max-width:520px; margin:0 auto 22px auto;">
        <div style="font-size:10px; color:#ec4899; font-weight:bold; margin-bottom:8px; text-align:center;">${t('career.profile_trophy_case', 'VITRINA DE PREMIOS')}</div>
        <div style="text-align:center;">${trophyHTML}</div>
      </div>

      <div style="max-width:640px; margin:0 auto;">
        <div style="font-size:10px; color:#ec4899; font-weight:bold; margin-bottom:8px; text-align:center;">${t('career.profile_history_title', 'HISTORIAL DE TEMPORADAS')}</div>
        <div style="max-height:260px; overflow-y:auto;">${historyRows}</div>
      </div>

      <div id="career-ratings-panel-profile" style="margin-top:20px;"></div>
    `;
    renderCareerRatingsInto('career-ratings-panel-profile');
  }

  /** Real standings for the current career year (Career.getYearStandings)
   * — the "liga viva" surface: every real team from OpponentsDatabase that
   * season, grouped by league/division when the data has them, ranked by
   * win_pct, with the player's own team highlighted. */
  function renderCareerStandings() {
    const C = window.Career;
    const container = document.getElementById('career-standings-container');
    const titleEl = document.getElementById('career-standings-title');
    if (!container || !C) return;
    if (titleEl) titleEl.textContent = `📊 ${t('career.standings_title', 'POSICIONES')} — ${C.currentYear}`;

    const teams = C.getYearStandings(C.currentYear);
    if (!teams.length) {
      container.innerHTML = `<div style="font-size:11px; color:#9ca3af; text-align:center; padding:20px;">${t('career.standings_none', 'No hay datos de liga para este año.')}</div>`;
      return;
    }

    const groups = {};
    let hasGroups = false;
    teams.forEach(team => {
      const key = team.league ? `${team.league}${team.division ? ' - ' + team.division : ''}` : t('career.standings_league', 'Liga');
      if (team.league || team.division) hasGroups = true;
      if (!groups[key]) groups[key] = [];
      groups[key].push(team);
    });
    const groupKeys = hasGroups ? Object.keys(groups).sort() : [t('career.standings_league', 'Liga')];
    if (!hasGroups) groups[groupKeys[0]] = teams;

    const rowHTML = (team, rank) => {
      const isPlayerTeam = C.team && team.teamID === C.team.teamID;
      const pct = Math.round((team.win_pct || 0) * 1000) / 10;
      return `
        <div style="display:grid; grid-template-columns:28px 1fr 60px; gap:8px; font-size:10.5px; padding:5px 8px; border-radius:5px; background:${isPlayerTeam ? 'rgba(236,72,153,0.18)' : 'transparent'}; color:${isPlayerTeam ? 'var(--career-accent)' : '#e4e4e7'};">
          <span>${rank}.</span>
          <span>${isPlayerTeam ? `<strong>${team.name}</strong> ⚾` : team.name}</span>
          <span style="text-align:right;">${pct}%</span>
        </div>`;
    };

    container.innerHTML = groupKeys.map(key => {
      const rows = groups[key].map((team, idx) => rowHTML(team, idx + 1)).join('');
      return `
        <div style="max-width:480px; margin:0 auto 18px auto; text-align:left;">
          <div style="font-size:10px; color:var(--career-accent); font-weight:bold; margin-bottom:6px; text-align:center;">${key}</div>
          ${rows}
        </div>`;
    }).join('');
  }

  /** Shop of real (non-cosmetic) perks bought with Career.cash — same
   * tiered-card visual language as the choice cards (A3) and Train, since
   * these are the same kind of decision: pick a card, pay a cost, get a
   * mechanical effect. */
  function renderCareerShop() {
    const C = window.Career;
    const container = document.getElementById('career-shop-container');
    const cashEl = document.getElementById('career-shop-cash');
    if (!container || !C) return;
    cashEl.textContent = `💵 ${t('career.shop_balance', 'Saldo')}: $${C.cash || 0}K`;

    const items = C.getShopCatalog();
    container.innerHTML = items.map((item, idx) => {
      const tierData = TRAINING_TIER_CONFIG.tiers[item.tier] || TRAINING_TIER_CONFIG.tiers.Normal;
      const canAfford = (C.cash || 0) >= item.cost;
      const activeSeasons = item.effectKey && C.shopEffects ? (C.shopEffects[item.effectKey] || 0) : 0;
      const statusHTML = activeSeasons > 0
        ? `<div style="font-size:9px; color:#10b981; margin-top:6px;">✅ ${t('career.shop_active_for', 'Activo')} ${activeSeasons} ${activeSeasons === 1 ? t('career.year_singular', 'año') : t('career.years_short', 'años')}</div>`
        : '';
      const animDelay = idx * 0.1;
      return `
        <div class="career-choice-card" data-item="${item.key}" style="border:2px solid ${tierData.borderColor}; opacity:${canAfford ? '1' : '0.55'}; cursor:${canAfford ? 'pointer' : 'not-allowed'}; animation-delay:${animDelay}s;">
          <div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
              <span style="font-family:'Press Start 2P',monospace; font-size:8px; color:${tierData.color}; background:${tierData.badgeBg}; border:1px solid ${tierData.color}66; padding:3px 8px; border-radius:12px;">${tierData.label}</span>
            </div>
            <div style="text-align:center; padding:8px 0;">
              <div style="font-weight:bold; font-size:13px; color:#e2e8f0; margin-bottom:6px;">${item.label}</div>
              <div style="font-size:10.5px; color:#9ca3af; line-height:1.4;">${item.desc}</div>
              ${statusHTML}
            </div>
          </div>
          <div style="margin-top:14px; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:10px; color:#64748b;">${t('career.shop_cost', 'Costo')}</span>
              <span style="font-family:'Press Start 2P',monospace; font-size:10px; color:${tierData.color};">$${item.cost}K</span>
            </div>
            <button class="btn career-shop-buy-btn" ${canAfford ? '' : 'disabled'} style="width:100%; padding:9px; font-size:9.5px; font-weight:bold; background:${canAfford ? `linear-gradient(135deg, ${tierData.color}, ${tierData.color}dd)` : '#334155'}; color:${canAfford ? '#000' : '#94a3b8'}; border:none; border-radius:8px; cursor:${canAfford ? 'pointer' : 'not-allowed'};">${canAfford ? t('career.shop_buy', 'COMPRAR') : t('career.shop_cant_afford', 'FONDOS INSUFICIENTES')}</button>
          </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.career-shop-buy-btn').forEach((btn, idx) => {
      if (btn.disabled) return;
      btn.onclick = () => {
        C.purchaseShopItem(items[idx].key);
        renderCareerShop();
        renderCareerRatingsInto('career-ratings-panel-hub');
      };
    });
  }

  function initCareerMode() {
    const btnCareer = document.getElementById('btn-select-career-mode');
    const modalDifficulty = document.getElementById('modal-career-difficulty');
    const btnCloseDifficulty = document.getElementById('btn-close-career-difficulty-modal');

    if (btnCareer && modalDifficulty) {
      btnCareer.onclick = () => modalDifficulty.classList.remove('hidden');
    }
    if (btnCloseDifficulty && modalDifficulty) {
      btnCloseDifficulty.onclick = () => modalDifficulty.classList.add('hidden');
    }
    document.querySelectorAll('#career-difficulty-options .difficulty-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const difficulty = opt.getAttribute('data-difficulty');
        if (modalDifficulty) modalDifficulty.classList.add('hidden');
        showCareerScreen('screen-career-pack');
        renderCareerRookiePack(difficulty);
      });
    });

    // Resume an existing career straight to the hub if one is saved.
    if (window.Career && window.Career.hasSave() && window.Career.load() && window.Career.active) {
      // Don't auto-navigate on load; the hub is reachable once the user re-enters Career mode.
    }

    const btnCareerProfileOpen = document.getElementById('btn-career-open-profile');
    const btnCareerProfileBack = document.getElementById('btn-career-profile-back');
    if (btnCareerProfileOpen) {
      btnCareerProfileOpen.onclick = () => {
        renderCareerProfile();
        showCareerScreen('screen-career-profile');
      };
    }
    if (btnCareerProfileBack) {
      btnCareerProfileBack.onclick = () => {
        renderCareerHub();
        showCareerScreen('screen-career-hub');
      };
    }

    const btnCareerStandingsOpen = document.getElementById('btn-career-open-standings');
    const btnCareerStandingsBack = document.getElementById('btn-career-standings-back');
    if (btnCareerStandingsOpen) {
      btnCareerStandingsOpen.onclick = () => {
        renderCareerStandings();
        showCareerScreen('screen-career-standings');
      };
    }
    if (btnCareerStandingsBack) {
      btnCareerStandingsBack.onclick = () => {
        renderCareerHub();
        showCareerScreen('screen-career-hub');
      };
    }

    const btnCareerShopOpen = document.getElementById('btn-career-open-shop');
    const btnCareerShopClose = document.getElementById('btn-career-shop-close');
    const modalCareerShop = document.getElementById('modal-career-shop');
    if (btnCareerShopOpen && modalCareerShop) {
      btnCareerShopOpen.onclick = () => {
        renderCareerShop();
        modalCareerShop.classList.remove('hidden');
      };
    }
    if (btnCareerShopClose && modalCareerShop) {
      btnCareerShopClose.onclick = () => modalCareerShop.classList.add('hidden');
    }
  }
  window.renderCareerRookiePack = renderCareerRookiePack;
  window.renderCareerHub = renderCareerHub;
  window.renderCareerSeason = renderCareerSeason;
  window.finishCareerSeason = finishCareerSeason;
  window.renderCareerOffseason = renderCareerOffseason;
  window.renderCareerProfile = renderCareerProfile;

  function init() {
    initGameModeSelector();
    initCareerMode();
    // NOTE: do NOT call renderDraftRound() here — window.Game doesn't exist yet on page load.
    // It is called by initGameModeSelector handlers after the user selects a mode.
    setupEventListeners();

    // ── Logo: click to reload back to the main menu (desktop only — on
    // mobile the logo sits right above the HUD/back-and-forth tab bar where
    // an accidental tap mid-run would be too easy and too costly). ──────────
    const logoEl = document.querySelector('.logo');
    if (logoEl) {
      logoEl.style.cursor = 'pointer';
      logoEl.addEventListener('click', () => {
        if (window.innerWidth > 768) {
          window.location.reload();
        }
      });
    }

    // ── BaseballDex: initialize and wire button ──────────────────────────────
    if (window.BaseballDex) {
      window.BaseballDex.init();
      const btnDex = document.getElementById('btn-basedex-open');
      if (btnDex) {
        btnDex.addEventListener('click', (e) => {
          e.stopPropagation();
          window.BaseballDex.open();
        });
      }
      const btnDexMenu = document.getElementById('btn-basedex-menu');
      if (btnDexMenu) {
        btnDexMenu.addEventListener('click', (e) => {
          e.stopPropagation();
          window.BaseballDex.open();
        });
      }
    }

    // ── Audio: unlock context on first user interaction + mute toggle button ──
    if (window.AudioManager) {
      window.AudioManager.updateMuteButton();

      // Mute toggle button
      const btnAudio = document.getElementById('btn-audio-toggle');
      if (btnAudio) {
        btnAudio.addEventListener('click', (e) => {
          e.stopPropagation(); // don't trigger the global menu click below
          window.AudioManager.toggleMute();
        });
      }

      // Global menu-click sound: any .btn click that isn't a combat/draft-specific button
      // We use a delegated listener on document so we don't need to touch each button.
      const COMBAT_BTN_IDS = new Set(['btn-roll-dice', 'btn-match-skip-game', 'btn-audio-toggle']);
      document.addEventListener('click', (e) => {
        window.AudioManager.unlock(); // ensure context is resumed
        const btn = e.target.closest('.btn');
        if (!btn) return;
        if (COMBAT_BTN_IDS.has(btn.id)) return;
        // Draft card clicks have class 'draft-card-wrapper' — those use draft_pick
        if (btn.closest('.draft-card-wrapper')) return;
        window.AudioManager.play('menu_click');
      }, { capture: false });
    }
  }

  function getPlayerOvr(p) {
    if (!p) return 60;
    if (p.ovr !== undefined) return Math.floor(p.ovr);
    if (p.avg_attr_score !== undefined) return Math.floor(p.avg_attr_score);
    if (p._ovr !== undefined) return Math.floor(p._ovr);
    const isPitcher = p.pos === 'P' || p.pos === 'SP' || p.role === 'P' || p.role === 'SP' || p.pos === 'RP' || p.role === 'RP';
    if (isPitcher) {
      const h9  = p.h9  !== undefined ? p.h9  : (p.h9_val  !== undefined ? p.h9_val  : (p.grt !== undefined ? p.grt : 50));
      const k9  = p.k9  !== undefined ? p.k9  : (p.k9_val  !== undefined ? p.k9_val  : (p.stf !== undefined ? p.stf : (p.str !== undefined ? p.str : 50)));
      const bb9 = p.bb9 !== undefined ? p.bb9 : (p.bb9_val !== undefined ? p.bb9_val : (p.ctl !== undefined ? p.ctl : 50));
      const hr9 = p.hr9 !== undefined ? p.hr9 : (p.hr9_val !== undefined ? p.hr9_val : (p.mov !== undefined ? p.mov : 50));
      const sta = p.sta !== undefined ? p.sta : (p.sta_val !== undefined ? p.sta_val : 65);
      const raw = h9 * 0.20 + k9 * 0.20 + bb9 * 0.20 + hr9 * 0.20 + sta * 0.20;
      if (raw <= 48.0) return Math.floor(50.0 + ((raw - 15.0) / 33.0) * 9.9);
      if (raw <= 56.0) return Math.floor(60.0 + ((raw - 48.0) / 8.0) * 9.9);
      if (raw <= 66.0) return Math.floor(70.0 + ((raw - 56.0) / 10.0) * 9.9);
      if (raw <= 78.0) return Math.floor(80.0 + ((raw - 66.0) / 12.0) * 9.9);
      return Math.floor(90.0 + Math.min(9.9, ((raw - 78.0) / 18.0) * 9.9));
    }
    const con = p.con !== undefined ? p.con : (p.contact_val !== undefined ? p.contact_val : 50);
    const pwr = p.pwr !== undefined ? p.pwr : (p.power_val !== undefined ? p.power_val : 50);
    const eye = p.eye !== undefined ? p.eye : (p.eye_val !== undefined ? p.eye_val : 50);
    const kavd = p.k_avd !== undefined ? p.k_avd : (p.k_avoid !== undefined ? p.k_avoid : (p.k_avoid_val !== undefined ? p.k_avoid_val : 50));
    const spd = p.spd !== undefined ? p.spd : (p.speed_val !== undefined ? p.speed_val : 50);
    const def = p.def !== undefined ? p.def : (p.defense_val !== undefined ? p.defense_val : 50);
    const raw = con * 0.28 + pwr * 0.28 + eye * 0.12 + def * 0.12 + spd * 0.10 + kavd * 0.10;
    if (raw <= 37.0) return Math.floor(50.0 + ((raw - 10.0) / 27.0) * 9.9);
    if (raw <= 48.0) return Math.floor(60.0 + ((raw - 37.0) / 11.0) * 9.9);
    if (raw <= 62.0) return Math.floor(70.0 + ((raw - 48.0) / 14.0) * 9.9);
    if (raw <= 76.0) return Math.floor(80.0 + ((raw - 62.0) / 14.0) * 9.9);
    return Math.floor(90.0 + Math.min(9.9, ((raw - 76.0) / 18.0) * 9.9));
  }

  function getStatGrade(val) {
    let letter = "F";
    let color = "#ef4444";
    let modifier = "";

    if (val >= 100) {
      letter = "S"; color = "#ffd700";
      modifier = "";
    } else if (val >= 80) {
      letter = "A"; color = "#22d3ee";
      if (val >= 95) modifier = "+";
      else if (val < 85) modifier = "-";
    } else if (val >= 60) {
      letter = "B"; color = "#4ade80";
      if (val >= 75) modifier = "+";
      else if (val < 65) modifier = "-";
    } else if (val >= 40) {
      letter = "C"; color = "#94a3b8";
      if (val >= 55) modifier = "+";
      else if (val < 45) modifier = "-";
    } else if (val >= 20) {
      letter = "D"; color = "#f97316";
      if (val >= 35) modifier = "+";
      else if (val < 25) modifier = "-";
    } else {
      letter = "F"; color = "#ef4444";
      modifier = "";
    }

    return { text: letter + modifier, color: color };
  }

  function getClassGrade(val) {
    let letter = "F";
    let color = "#ef4444";
    let modifier = "";

    if (val >= 95) {
      letter = "S"; color = "#ffd700";
      modifier = "";
    } else if (val >= 88) {
      letter = "A"; color = "#22d3ee";
      modifier = "+";
    } else if (val >= 80) {
      letter = "A"; color = "#22d3ee";
      modifier = "";
    } else if (val >= 75) {
      letter = "B"; color = "#4ade80";
      modifier = "+";
    } else if (val >= 70) {
      letter = "B"; color = "#4ade80";
      modifier = "";
    } else if (val >= 65) {
      letter = "C"; color = "#94a3b8";
      modifier = "+";
    } else if (val >= 60) {
      letter = "C"; color = "#94a3b8";
      modifier = "";
    } else if (val >= 50) {
      letter = "D"; color = "#f97316";
      modifier = "";
    } else {
      letter = "F"; color = "#ef4444";
      modifier = "";
    }

    return { text: letter + modifier, color: color };
  }

  function getGrade(val) {
    return getStatGrade(val).text;
  }

  function getShortEraName(era) {
    if (!era) return "";
    if (era.includes("Genesis")) return "GENESIS (1871-1900)";
    if (era.includes("Deadball")) return "DEADBALL (1901-1919)";
    if (era.includes("Golden")) return "GOLDEN (1920-1941)";
    if (era.includes("Integration")) return "INTEGRATION (1942-1960)";
    if (era.includes("Expansion")) return "EXPANSION (1961-1976)";
    if (era.includes("Big Hair")) return "BIG HAIR (1977-1993)";
    if (era.includes("Steroid")) return "STEROID (1994-2005)";
    if (era.includes("Efficiency")) return "EFFICIENCY (2006-2015)";
    if (era.includes("Modern")) return "MODERN (2016-PRES)";
    return era.toUpperCase();
  }

  // Create HTML structure for player cards based on Era
  function createCardHTML(player, slotName = null) {
    if (!player) {
      return `
        <div class="player-card" style="border: 2px dashed rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;">
          <div style="text-align: center; color: #4b5563;">
            <i class="fa-solid fa-user-plus" style="font-size: 24px; margin-bottom: 8px;"></i>
            <div style="font-size: 11px; font-weight:bold;">${(typeof window.t==="function"?window.t("ui.empty"):"VACÍO")}</div>
          </div>
        </div>
      `;
    }

    const eraClassMap = {
      "The Genesis Era (1871-1900)": "era-genesis",
      "Deadball (1901-1919)": "era-deadball",
      "Golden Era (1920-1941)": "era-golden",
      "Integration (1942-1960)": "era-integration",
      "Expansion (1961-1976)": "era-expansion",
      "Big Hair Era (1977-1993)": "era-bighair",
      "Steroid Era (1994-2005)": "era-steroid",
      "Efficiency Era (2006-2015)": "era-efficiency",
      "Modern Era (2016-Pres)": "era-modern"
    };

    let year = player.year || player._year || player.peak_year_display || player.peak_year || "";
    let cleanName = player.name || "";
    const yearInNameMatch = cleanName.match(/\s*\((\d{4})\)$/);
    if (yearInNameMatch) {
      if (!year) year = yearInNameMatch[1];
      cleanName = cleanName.replace(/\s*\(\d{4}\)$/, '').trim();
    }
    
    // Dynamically resolve player era if missing or unmapped
    let resolvedEra = player.era || player._era;
    if (!resolvedEra || !eraClassMap[resolvedEra]) {
      const y = parseInt(year || 2020, 10);
      if (y <= 1900) resolvedEra = "The Genesis Era (1871-1900)";
      else if (y <= 1919) resolvedEra = "Deadball (1901-1919)";
      else if (y <= 1941) resolvedEra = "Golden Era (1920-1941)";
      else if (y <= 1960) resolvedEra = "Integration (1942-1960)";
      else if (y <= 1976) resolvedEra = "Expansion (1961-1976)";
      else if (y <= 1993) resolvedEra = "Big Hair Era (1977-1993)";
      else if (y <= 2005) resolvedEra = "Steroid Era (1994-2005)";
      else if (y <= 2015) resolvedEra = "Efficiency Era (2006-2015)";
      else resolvedEra = "Modern Era (2016-Pres)";
      player.era = resolvedEra;
    }

    const eraClass = eraClassMap[resolvedEra] || "era-modern";
    let teamFranchise = player.team || "ROOK";
    if (typeof teamFranchise === 'string' && (teamFranchise.startsWith('story_') || teamFranchise.startsWith('opp_') || teamFranchise.includes('_BOSS') || teamFranchise.includes('_boss') || teamFranchise.includes('_stage_'))) {
      teamFranchise = "STARS";
    }
    const isPitcher = player.pos === 'P' || player.pos === 'SP' || player.pos === 'RP' || player.role === 'P' || player.role === 'SP' || player.role === 'RP';

    const ovr = getPlayerOvr(player);

    // Rarity styles
    let derivedRarity = player.rarity;
    if (!derivedRarity) {
      if (ovr >= 90) derivedRarity = "Legendary";
      else if (ovr >= 80) derivedRarity = "Epic";
      else if (ovr >= 70) derivedRarity = "Rare";
      else if (ovr >= 60) derivedRarity = "Uncommon";
      else derivedRarity = "Common";
    }
    const rarityLabel = derivedRarity;


    // Get Rating letter grade for card class header
    const ovrGrade = getClassGrade(ovr);

    // Format stats values
    let statLines = "";
    if (isPitcher) {
      const h9Val  = player.h9  !== undefined ? player.h9  : (player.h9_val  !== undefined ? player.h9_val  : (player.grt !== undefined ? player.grt : 50));
      const k9Val  = player.k9  !== undefined ? player.k9  : (player.k9_val  !== undefined ? player.k9_val  : (player.stf !== undefined ? player.stf : (player.str !== undefined ? player.str : 50)));
      const bb9Val = player.bb9 !== undefined ? player.bb9 : (player.bb9_val !== undefined ? player.bb9_val : (player.ctl !== undefined ? player.ctl : 50));
      const hr9Val = player.hr9 !== undefined ? player.hr9 : (player.hr9_val !== undefined ? player.hr9_val : (player.mov !== undefined ? player.mov : 50));
      const staVal = player.sta !== undefined ? player.sta : (player.sta_val !== undefined ? player.sta_val : 65);

      const gH9  = getStatGrade(h9Val);
      const gK9  = getStatGrade(k9Val);
      const gBB9 = getStatGrade(bb9Val);
      const gHR9 = getStatGrade(hr9Val);
      const gSta = getStatGrade(staVal);

      statLines = `
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">H/9:</span>
          <span class="stat-badge" style="background: ${gH9.color}; color: ${gH9.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gH9.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">K/9:</span>
          <span class="stat-badge" style="background: ${gK9.color}; color: ${gK9.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gK9.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">BB/9:</span>
          <span class="stat-badge" style="background: ${gBB9.color}; color: ${gBB9.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gBB9.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">HR/9:</span>
          <span class="stat-badge" style="background: ${gHR9.color}; color: ${gHR9.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gHR9.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">STA:</span>
          <span class="stat-badge" style="background: ${gSta.color}; color: ${gSta.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gSta.text}</span>
        </div>
      `;
    } else {
      const conVal = player.con !== undefined ? player.con : (player.contact_val !== undefined ? player.contact_val : 40);
      const pwrVal = player.pwr !== undefined ? player.pwr : (player.power_val !== undefined ? player.power_val : 35);
      const eyeVal = player.eye !== undefined ? player.eye : (player.eye_val !== undefined ? player.eye_val : 40);
      const kavdVal = player.k_avd !== undefined ? player.k_avd : (player.k_avoid !== undefined ? player.k_avoid : (player.k_avoid_val !== undefined ? player.k_avoid_val : 40));
      const spdVal = player.spd !== undefined ? player.spd : (player.speed_val !== undefined ? player.speed_val : 45);
      const defVal = player.def !== undefined ? player.def : (player.defense_val !== undefined ? player.defense_val : 40);

      const gCon = getStatGrade(conVal);
      const gPwr = getStatGrade(pwrVal);
      const gEye = getStatGrade(eyeVal);
      const gKAvd = getStatGrade(kavdVal);
      const gSpd = getStatGrade(spdVal);
      const gDef = getStatGrade(defVal);

      statLines = `
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">CON:</span>
          <span class="stat-badge" style="background: ${gCon.color}; color: ${gCon.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gCon.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">POW:</span>
          <span class="stat-badge" style="background: ${gPwr.color}; color: ${gPwr.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gPwr.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">EYE:</span>
          <span class="stat-badge" style="background: ${gEye.color}; color: ${gEye.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gEye.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">K/AVD:</span>
          <span class="stat-badge" style="background: ${gKAvd.color}; color: ${gKAvd.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gKAvd.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">SPD:</span>
          <span class="stat-badge" style="background: ${gSpd.color}; color: ${gSpd.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gSpd.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1px 0;">
          <span class="stat-label">DEF:</span>
          <span class="stat-badge" style="background: ${gDef.color}; color: ${gDef.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 1px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gDef.text}</span>
        </div>
      `;
    }

    // Check stamina warnings
    const stam = player.stamina || 100;
    let stamClass = "";
    if (stam < 50) stamClass = "low";
    if (stam < 25) stamClass = "critical";

    // Out of position warning (applies only to fielders in fielding slots, never pitchers in pitching slots or DH)
    let positionWarning = "";
    const sName = slotName != null ? String(slotName).trim() : '';
    const isPitcherSlot = !sName || sName === 'P' || sName.startsWith('SP') || sName.startsWith('RP') || sName === 'CL' || sName === 'SETUP';
    if (!isPitcher && sName && sName !== 'DH' && !isPitcherSlot && player.pos !== sName) {
      const secPosArray = player.sec_pos ? player.sec_pos.split(',').map(s => s.trim()) : [];
      if (secPosArray.includes(sName)) {
        positionWarning = `<div style="position: absolute; bottom: 35px; left: 0; right: 0; background: #06b6d4; color: #fff; font-size: 7.5px; text-align: center; font-weight: bold; padding: 2px 0; font-family: 'Press Start 2P', monospace; letter-spacing: 0.5px;">SEC POS (DEF -15%)</div>`;
      } else {
        positionWarning = `<div style="position: absolute; bottom: 35px; left: 0; right: 0; background: #ef4444; color: #fff; font-size: 7.5px; text-align: center; font-weight: bold; padding: 2px 0; font-family: 'Press Start 2P', monospace; letter-spacing: 0.5px;">OOF POS (DEF -50%)</div>`;
      }
    }

    const isClutch = !!(player.clutch || player.is_clutch);
    const isCaptain = !!(player.captain || player.is_captain);
    const isDoubleBadge = isClutch && isCaptain;

    const clutchToolTip = window.t ? window.t('badge.clutch_tooltip', 'Clutch Player: +4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.') : 'Clutch Player: +4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.';
    const captainToolTip = window.t ? window.t('badge.captain_tooltip', 'Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.') : 'Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.';

    let ribbonHTML = '';
    if (isDoubleBadge) {
      ribbonHTML = `
        <div class="card-ribbon ribbon-bottom-left ribbon-stagger-1 ribbon-clutch" title="${clutchToolTip}">CLUTCH</div>
        <div class="card-ribbon ribbon-bottom-left ribbon-stagger-2 ribbon-captain" title="${captainToolTip}">CAPTAIN</div>
      `;
    } else if (isClutch) {
      ribbonHTML = `
        <div class="card-ribbon ribbon-bottom-left ribbon-clutch" title="${clutchToolTip}">CLUTCH</div>
      `;
    } else if (isCaptain) {
      ribbonHTML = `
        <div class="card-ribbon ribbon-bottom-left ribbon-captain" title="${captainToolTip}">CAPTAIN</div>
      `;
    }

    // Full-width top banner (not another diagonal corner ribbon) — those read
    // fine for a short word like "CLUTCH" but a longer phrase like "OUT OF
    // ERA" was illegible at ribbon size, so this gets its own clear strip.
    let interEraBannerHTML = '';
    if (player.isInterEra) {
      const interEraTooltip = window.t ? window.t('badge.interera_tooltip') : 'Fuera de Época: este jugador no estaba activo en la temporada seleccionada — cuenta el doble para su sinergia.';
      const interEraLabel = window.t ? window.t('badge.interera_label') : 'FUERA DE ÉPOCA';
      interEraBannerHTML = `
        <div class="card-interera-banner" title="${interEraTooltip}">⏳ ${interEraLabel}</div>
      `;
    }

    const displayPos = player.pos || player.role || (isPitcher ? (player.sta >= 65 ? 'SP' : 'RP') : 'DH');

    return `
      <div class="player-card ${eraClass} rarity-${rarityLabel} ${isClutch ? 'has-clutch' : ''} ${isCaptain ? 'has-captain' : ''}">
        ${ribbonHTML}
        ${interEraBannerHTML}
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="card-position" style="background: #000; color: #fff; padding: 2px 4px; font-weight: bold; font-size: 6px; border: 1px solid rgba(255,255,255,0.1);">${displayPos}</span>
          <span class="card-ovr" style="font-family: 'Press Start 2P', monospace; font-size: 6px; color: ${ovrGrade.color}; font-weight: bold; background: #000; padding: 2px 4px; border: 1px solid rgba(255,255,255,0.2);">OVR ${Math.floor(ovr)}</span>
          <span class="card-year" style="font-size: 6px;">${year}</span>
        </div>
        ${(() => {
          const len = cleanName.length;
          let nameSizeClass = 'name-lg';
          if (len >= 19) nameSizeClass = 'name-xxs';
          else if (len >= 16) nameSizeClass = 'name-xs';
          else if (len >= 14) nameSizeClass = 'name-sm';
          return `<div class="card-name ${nameSizeClass}" title="${cleanName}">${cleanName}</div>`;
        })()}
        <div class="card-traits-box">
          <span class="card-trait-badge trait-era" title="${player.era}">${getShortEraName(player.era)}</span>
          ${teamFranchise && teamFranchise !== 'ROOK' ? `<span class="card-trait-badge trait-team" title="${(window.PlayersDB && window.PlayersDB.FranchiseNames && window.PlayersDB.FranchiseNames[teamFranchise]) || teamFranchise}">${teamFranchise}</span>` : ''}
        </div>
        ${player.sec_pos ? `<div class="card-sec-pos-line" title="${(typeof window.t==="function"?window.t("ui.sec_pos_tooltip")+": "+player.sec_pos:"Posición Secundaria: "+player.sec_pos)}">SEC: ${player.sec_pos}</div>` : ''}
        <div class="card-stats">
          ${statLines}
        </div>
        ${positionWarning}
        <div class="card-footer">
          <span>${teamFranchise}</span>
          <span class="card-stamina-badge ${stamClass}"><i class="fa-solid fa-bolt-lightning"></i> ${stam}</span>
        </div>
      </div>
    `;
  }
  window.createCardHTML = createCardHTML;

  // Main UI Screen Swapping
    function showScreen(screenId) {
    window.showScreen(screenId);
  }

  // Handle auto-redraw on window resize so Bezier coordinates scale perfectly
  window.addEventListener('resize', () => {
    const mapScreen = document.getElementById('screen-map');
    if (mapScreen && !mapScreen.classList.contains('hidden')) {
      const currentZone = window.Game.getZoneForStage(window.Game.currentStageIndex);
      drawZonePaths(currentZone);
    }
  });

  // Setup Event Handlers
  function setupEventListeners() {
    // NOTE: Starter clicks are now handled inline in renderDraftRound().
    // The old starter-pick listener is removed (draft rounds handle player selection directly).


    // Mobile Bottom Tab Bar Event Listeners
    const btnAction = document.getElementById('btn-mobile-tab-action');
    const btnRoster = document.getElementById('btn-mobile-tab-roster');
    const btnOrder  = document.getElementById('btn-mobile-tab-order');

    if (btnAction) btnAction.addEventListener('click', () => setMobileTab('action'));
    if (btnRoster) btnRoster.addEventListener('click', () => setMobileTab('roster'));
    if (btnOrder)  btnOrder.addEventListener('click',  () => setMobileTab('order'));

    // Toggle roster panel (HUD button)
    if (el.toggleRosterBtn) {
      el.toggleRosterBtn.addEventListener('click', () => {
        setMobileTab(currentMobileTab === 'order' ? 'action' : 'order');
      });
    }

    // Toggle synergies panel (HUD button)
    const btnSynergiesMobile = document.getElementById('btn-toggle-synergies-mobile');
    if (btnSynergiesMobile) {
      btnSynergiesMobile.addEventListener('click', () => {
        setMobileTab(currentMobileTab === 'roster' ? 'action' : 'roster');
      });
    }

    // ── I18N TRANSLATIONS DICTIONARY ──────────────────────────────────────────
    const I18N = {
      es: {
        btn_lineup: "Alineación",
        btn_synergies: "Sinergias",
        btn_roll_dice: "🎲 LANZAR DADO",
        btn_simulate_all: "⚡ SIMULAR TODO",
        match_title: "Bateadores al Combate",
        pre_fight_title: "Preparación de la Serie",
        map_title: "Mapa del Campeonato",
        outs_label: "OUTS:",
        runs_label: "CARRERAS:",
        inning_label: "INNING:",
        ko_label: "K.O. RIVALES:",
        arena_label: "ARENA COMBATE",
        history_label: "HISTORIAL DEL PARTIDO",
        upgrades_label: "MEJORAS",
        drag_reorder: "Arrastra para reordenar",
        start_campaign: "⚾ Comenzar Campaña",
        guides_ratings: "📊 GUÍA DE RATINGS",
        damage_data: "⚙️ DATOS DE DAÑO & VALORES",
        shield_header: "🛡️ CÓMO FUNCIONA EL ESCUDO (Tope 50 pts)",
        out_title: "🤚 OUT (Groundout/Flyout):",
        so_title: "💨 PONCHE (SO):",
        pitcher_dmg_title: "⚾ DAÑO AL LANZADOR RIVAL (BASE):",
        rbi_bonus_title: "🏆 Bonus por Carreras Impulsadas (RBI):",
        steal_title: "🏃 ROBO DE BASES (SPD ≥ 40 — Grado C+):",
        hit_upgrade_title: "⚡ UPGRADE DE BATAZOS:",
        ratings_con: '<strong style="color:#a7f3d0;">CON — Contacto:</strong> Determina la probabilidad de conectar un batazo. Jugadores con alto CON tienen más chances de sencillos e hits en general.',
        ratings_pwr: '<strong style="color:#f59e0b;">PWR — Poder:</strong> Probabilidad de conectar extra-bases (dobles, triples, jonrones). También aumenta el daño al pitcher rival en hits largos.',
        ratings_eye: '<strong style="color:#3b82f6;">EYE — Ojo/Vista:</strong> Probabilidad de obtener boletos (BB). Clave para avanzar corredores y desgastar al lanzador rival.',
        ratings_kavd: '<strong style="color:#ec4899;">K/AVD — Evasión de Ponches:</strong> Reduce la zona de ponches (SO) en la tirada del dado. Clave para evitar el daño directo a la salud del equipo que provocan los ponches.',
        ratings_spd: '<strong style="color:#38bdf8;">SPD — Velocidad:</strong> Activa intentos de robo de base en sencillos (debuff +20% daño al pitcher). También mejora la probabilidad de convertir hits en extra-bases.',
        ratings_def: '<strong style="color:#a855f7;">DEF — Defensa:</strong> Contribuye al <strong>Escudo</strong> del equipo. Cuanto mayor DEF promedio, más escudo tienes disponible para absorber OUTs antes de perder HP.',
        ratings_clutch: '<strong style="color:#ef4444;">⚡ CLUTCH PLAYER:</strong> +2% de probabilidad de sencillo y doble, +4% de HR con corredores en posición de anotar o durante la última entrada.',
        ratings_captain: '<strong style="color:#eab308;">👑 CAPTAIN:</strong> +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.'
      },
      en: {
        btn_lineup: "Lineup",
        btn_synergies: "Synergies",
        btn_roll_dice: "🎲 ROLL DICE",
        btn_simulate_all: "⚡ SIMULATE ALL",
        match_title: "Batters to Combat",
        pre_fight_title: "Series Preparation",
        map_title: "Championship Map",
        outs_label: "OUTS:",
        runs_label: "RUNS:",
        inning_label: "INNING:",
        ko_label: "K.O. RIVALS:",
        arena_label: "COMBAT ARENA",
        history_label: "MATCH HISTORY",
        upgrades_label: "UPGRADES",
        drag_reorder: "Drag to reorder",
        start_campaign: "⚾ Start Campaign",
        guides_ratings: "📊 RATINGS GUIDE",
        damage_data: "⚙️ DAMAGE DATA & VALUES",
        shield_header: "🛡️ HOW SHIELD WORKS (50 pts Cap)",
        out_title: "🤚 OUT (Groundout/Flyout):",
        so_title: "💨 STRIKEOUT (SO):",
        pitcher_dmg_title: "⚾ RIVAL PITCHER BASE DAMAGE:",
        rbi_bonus_title: "🏆 RBI Bonus Damage:",
        steal_title: "🏃 BASE STEALING (SPD ≥ 40 — Grade C+):",
        hit_upgrade_title: "⚡ HIT UPGRADES:",
        ratings_con: '<strong style="color:#a7f3d0;">CON — Contact:</strong> Determines hitting probability. High CON batters have higher chances of singles and base hits.',
        ratings_pwr: '<strong style="color:#f59e0b;">PWR — Power:</strong> Chance to hit extra-base hits (doubles, triples, home runs) and deal heavy pitcher damage.',
        ratings_eye: '<strong style="color:#3b82f6;">EYE — Eye/Vision:</strong> Probability of drawing walks (BB). Key for advancing runners and wearing down the rival pitcher.',
        ratings_kavd: '<strong style="color:#ec4899;">K/AVD — Strikeout Avoidance:</strong> Shrinks the strikeout (SO) zone on the dice roll. Essential for preventing direct HP damage caused by strikeouts.',
        ratings_spd: '<strong style="color:#38bdf8;">SPD — Speed:</strong> Enables base stealing attempts on singles (+20% pitcher damage debuff) and extra-base upgrades.',
        ratings_def: '<strong style="color:#a855f7;">DEF — Defense:</strong> Contributes to Team Shield. Higher average DEF grants more shield to absorb OUTs before losing HP.',
        ratings_clutch: '<strong style="color:#ef4444;">⚡ CLUTCH PLAYER:</strong> +2% single and double chance, +4% HR chance with runners in scoring position or during the last inning.',
        ratings_captain: '<strong style="color:#eab308;">👑 CAPTAIN:</strong> +5 to all ratings for all teammates while on the active roster.'
      }
    };

    function applyLanguage(lang) {
      const dict = I18N[lang] || I18N.es;
      
      const btnRoster = document.getElementById('btn-toggle-roster-view');
      if (btnRoster) btnRoster.innerHTML = `<i class="fa-solid fa-users-gear"></i> ${dict.btn_lineup}`;
      
      const btnSyn = document.getElementById('btn-toggle-synergies-mobile');
      if (btnSyn) btnSyn.innerHTML = `<i class="fa-solid fa-bolt"></i> ${dict.btn_synergies}`;
      
      const btnRoll = document.getElementById('btn-roll-dice');
      if (btnRoll) btnRoll.innerText = dict.btn_roll_dice;
      
      const btnSim = document.getElementById('btn-simulate-all');
      if (btnSim) btnSim.innerText = dict.btn_simulate_all;

      const titleMatch = document.getElementById('match-header-title');
      if (titleMatch) titleMatch.innerHTML = `<i class="fa-solid fa-trophy"></i> ${dict.match_title}`;

      const arenaText = document.getElementById('scoreboard-inning-text');
      if (arenaText) arenaText.innerText = dict.arena_label;

      const leftHeader = document.querySelector('#roster-sidebar-panel .sidebar-header');
      if (leftHeader) leftHeader.innerHTML = `<i class="fa-solid fa-users"></i> ${dict.btn_lineup.toUpperCase()}`;

      const rightHeader = document.querySelector('.right-sidebar .sidebar-header');
      if (rightHeader) rightHeader.innerHTML = `<i class="fa-solid fa-bolt"></i> ${dict.btn_synergies.toUpperCase()}`;

      const guideCon = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.con"]');
      if (guideCon && dict.ratings_con) guideCon.innerHTML = dict.ratings_con;

      const guidePwr = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.pwr"]');
      if (guidePwr && dict.ratings_pwr) guidePwr.innerHTML = dict.ratings_pwr;

      const guideEye = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.eye"]');
      if (guideEye && dict.ratings_eye) guideEye.innerHTML = dict.ratings_eye;

      const guideKAvd = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.k_avd"]');
      if (guideKAvd && dict.ratings_kavd) guideKAvd.innerHTML = dict.ratings_kavd;

      const guideSpd = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.spd"]');
      if (guideSpd && dict.ratings_spd) guideSpd.innerHTML = dict.ratings_spd;

      const guideDef = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.def"]');
      if (guideDef && dict.ratings_def) guideDef.innerHTML = dict.ratings_def;

      const guideClutch = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.clutch"]');
      if (guideClutch && dict.ratings_clutch) guideClutch.innerHTML = dict.ratings_clutch;

      const guideCaptain = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.captain"]');
      if (guideCaptain && dict.ratings_captain) guideCaptain.innerHTML = dict.ratings_captain;
    }

    if (!window.UI) window.UI = {};
    window.UI.applyLanguage = applyLanguage;
    window.UI.updateStaticTranslations = function() {
      const cur = (window.i18n && window.i18n.getLanguage) ? window.i18n.getLanguage() : (localStorage.getItem('baserogue_lang') || 'es');
      applyLanguage(cur);
    };

    // Toggle Language (ES / EN)
    const btnLang = document.getElementById('btn-lang-toggle');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        const cur = (window.i18n && window.i18n.getLanguage) ? window.i18n.getLanguage() : (localStorage.getItem('baserogue_lang') || 'es');
        const next = cur === 'es' ? 'en' : 'es';
        if (window.i18n && typeof window.i18n.setLanguage === 'function') {
          window.i18n.setLanguage(next);
        } else if (window.I18n && typeof window.I18n.setLanguage === 'function') {
          window.I18n.setLanguage(next);
        }
        applyLanguage(next);
      });
    }

    const btnCloseRoster = document.getElementById('btn-close-roster-mobile');
    if (btnCloseRoster) {
      btnCloseRoster.addEventListener('click', () => {
        setMobileTab('action');
      });
    }

    const btnAutoSortGlobal = document.getElementById('btn-auto-sort-global');
    if (btnAutoSortGlobal) {
      btnAutoSortGlobal.addEventListener('click', () => {
        if (!window.Game || !window.Game.roster || !window.Game.battingOrder) return;
        window.Game.battingOrder = window.Game.autoSortBattingOrder(window.Game.roster, window.Game.battingOrder);
        renderActiveRoster();
        // Also update match HUD if currently in match
        if (!el.screenMatch.classList.contains('hidden') && typeof updateMatchHUD === 'function') {
           const state = window.Game.activeBattle ? window.Game.activeBattle.getState() : null;
           if (state) updateMatchHUD(state);
        }
      });
    }

    // Combat Info Dropdown Toggle
    const btnInfo = document.getElementById('btn-combat-info');
    const dropdownInfo = document.getElementById('combat-info-dropdown');
    const btnCloseInfo = document.getElementById('btn-close-combat-info');

    if (btnInfo && dropdownInfo) {
      btnInfo.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownInfo.classList.toggle('hidden');
      });
    }
    if (btnCloseInfo && dropdownInfo) {
      btnCloseInfo.addEventListener('click', () => {
        dropdownInfo.classList.add('hidden');
      });
    }
    document.addEventListener('click', (e) => {
      if (dropdownInfo && !dropdownInfo.classList.contains('hidden')) {
        if (!dropdownInfo.contains(e.target) && e.target !== btnInfo) {
          dropdownInfo.classList.add('hidden');
        }
      }
    });

    // Ratings Info Dropdown Toggle (Starter Screen)
    const btnRatings = document.getElementById('ratings-info-btn');
    const dropdownRatings = document.getElementById('ratings-info-dropdown');
    const btnCloseRatings = document.getElementById('btn-close-ratings-info');

    if (btnRatings && dropdownRatings) {
      btnRatings.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownRatings.classList.toggle('hidden');
      });
    }
    if (btnCloseRatings && dropdownRatings) {
      btnCloseRatings.addEventListener('click', () => {
        dropdownRatings.classList.add('hidden');
      });
    }
    document.addEventListener('click', (e) => {
      if (dropdownRatings && !dropdownRatings.classList.contains('hidden')) {
        if (!dropdownRatings.contains(e.target) && e.target !== btnRatings) {
          dropdownRatings.classList.add('hidden');
        }
      }
    });

    // Map node clicks
    el.mapContainer.addEventListener('click', (e) => {
      const nodeEl = e.target.closest('.map-node-visual.active-path, .map-node.active-path, .map-node-group.node-is-active');
      if (!nodeEl) return;

      const stage = parseInt(nodeEl.getAttribute('data-stage'));
      const index = parseInt(nodeEl.getAttribute('data-index'));

      // Move game state current location
      window.Game.currentStageIndex = stage;
      window.Game.currentNodeIndex = index;

      // Make visited
      const nodeObj = window.Game.map[stage][index];
      nodeObj.visited = true;

      openNode(nodeObj);
    });

    // Modal Swap Cancel
    el.btnCancelSwapDraft.addEventListener('click', () => {
      el.modalSwap.classList.add('hidden');
      currentDraftSelection = null;
      closeNodeCompleted();
    });

    // Modal Swap Player Choice clicks
    el.modalSwapList.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-replace-slot]');
      if (!btn) return;

      const slot = btn.getAttribute('data-replace-slot');
      
      // Deduct sign cost if executing a paid mid-run draft
      if (currentDraftSelection && currentDraftSelection._signCost) {
        window.Game.budget = Math.max(0, (window.Game.budget || 0) - currentDraftSelection._signCost);
        delete currentDraftSelection._signCost;
      }

      // Execute replace swap directly on active roster slot
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('player_release');
        window.AudioManager.play('money');
      }
      window.Game.replaceRosterPlayer(slot, currentDraftSelection);

      el.modalSwap.classList.add('hidden');
      currentDraftSelection = null;
      
      renderActiveRoster();
      renderSynergiesAndItems();
      updateHUD();
      
      closeNodeCompleted();
    });

    // Rest choices
    el.btnRestHeal.addEventListener('click', () => {
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('item_use');
      }
      if (window.Game && typeof window.Game.logRunNode === 'function') {
        window.Game.logRunNode({
          type: 'rest',
          icon: '🛋️',
          title: `Descanso en Casa Club`,
          titleEN: `Clubhouse Rest`,
          desc: `Toda la alineación recuperó +40 de Stamina`,
          descEN: `Entire lineup recovered +40 Stamina`,
          status: 'success'
        });
      }
      // Heal stamina of all roster players
      Object.keys(window.Game.roster).forEach(pos => {
        if (window.Game.roster[pos]) {
          window.Game.roster[pos].stamina = Math.min(100, window.Game.roster[pos].stamina + 40);
        }
      });
      renderActiveRoster();
      renderSynergiesAndItems();
      showRetroResultModal({
        title: 'Descanso en la Casa Club',
        get badgeText() { return typeof window.t==='function'?window.t('rest.badge_restore'):'¡RESTAURACIÓN!'; },
        badgeColor: '#10b981',
        icon: '🛋️',
        get desc() { return typeof window.t==='function'?window.t('rest.stamina.desc'):'Toda tu plantilla activa recupera +40 de Stamina para los próximos encuentros.'; },
        stats: [{ label: 'Stamina del Equipo', value: '+40', isPositive: true }],
        onClose: () => closeNodeCompleted()
      });
    });

    el.btnRestCash.addEventListener('click', () => {
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('money');
      }
      if (window.Game && typeof window.Game.logRunNode === 'function') {
        window.Game.logRunNode({
          type: 'rest',
          icon: '💰',
          title: `Patrocinio Deportivo`,
          titleEN: `Team Sponsor`,
          desc: `El club recibió +$25 de presupuesto`,
          descEN: `Club received +$25 budget`,
          status: 'success'
        });
      }
      window.Game.budget += 25;
      renderActiveRoster();
      updateHUD();
      showRetroResultModal({
        title: 'Patrocinador Deportivo',
        get badgeText() { return typeof window.t==='function'?window.t('rest.badge_bonus'):'¡BONIFICACIÓN!'; },
        badgeColor: '#f59e0b',
        icon: '💰',
        get desc() { return typeof window.t==='function'?window.t('rest.money.desc'):'Tu club recibe una inyección económica de los patrocinadores locales.'; },
        stats: [{ label: 'Presupuesto del Club', value: '+$25', isPositive: true }],
        onClose: () => closeNodeCompleted()
      });
    });

    // Training back button
    if (el.btnTrainBack) {
      el.btnTrainBack.addEventListener('click', () => {
        closeNodeCompleted();
      });
    }

    // 🎲 LANZAR DADO — Interactive Dice Battler
    // The button is dynamically injected into #screen-match by setupAndStartMatchSimulation.
    // We delegate via event delegation on the screen so it works after DOM injection.
    document.getElementById('screen-match').addEventListener('click', (e) => {
      if (e.target.closest('#btn-roll-dice')) {
        handleRollDice();
      }
      if (e.target.closest('#btn-match-skip-game')) {
        handleSimulateAll();
      }
    });

    // Restart game click - restarts run with same mode and season configuration
    if (el.btnRestartGame) {
      el.btnRestartGame.addEventListener('click', () => {
        const mode = window.Game.selectedMode;
        const seasonYear = window.Game.selectedSeasonYear;

        window.Game.resetRun();

        if (mode === 'story' && seasonYear) {
          window.Game.loadSeasonOpponents(seasonYear);
        }

        el.hud.classList.add('hidden');
        window.showScreen('screen-draft');
        if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
      });
    }

    // Pre-Fight Screen triggers
    el.btnPreFightStart.addEventListener('click', () => {
      const isStory = window.Game.selectedMode === 'story';
      const stage = window.Game.currentStageIndex;
      const isZoneBoss = isStory && (stage === 5 || stage === 11 || stage === 17);
      const enemy = window.Game.getEnemyTeam();

      if (isZoneBoss && enemy && enemy.isBoss) {
        showZoneBossIntroModal(enemy, () => setupAndStartMatchSimulation());
      } else {
        setupAndStartMatchSimulation();
      }
    });

    el.btnPreFightBackMap.addEventListener('click', () => {
      window.showScreen('screen-map');
    });
  }

  // Open Node Screen logic
  function openNode(node) {
    if (window.AudioManager && typeof window.AudioManager.play === 'function' && node.type !== 'gamble' && node.type !== 'match' && node.type !== 'boss' && node.type !== 'mid_boss' && node.type !== 'trade') {
      window.AudioManager.play('map_node_select');
    }

    if (node.type === 'match' || node.type === 'boss' || node.type === 'mid_boss') {
      setupAndShowPreFightScreen();
    } else if (node.type === 'draft') {
      setupDraftPickScreen();
    } else if (node.type === 'event') {
      setupManagerEventScreen();
    } else if (node.type === 'train') {
      setupTrainingScreen();
    } else if (node.type === 'rest') {
      window.showScreen('screen-rest');
    } else if (node.type === 'chest') {
      openChestNode();
    } else if (node.type === 'gamble') {
      openGambleNode();
    } else if (node.type === 'trade') {
      openTradeNode();
    }
  }

  // Return to Map view once action completes
  function closeNodeCompleted() {
    // Tick down any position locks from a failed "Intercambio a Ciegas" gamble
    if (window.Game.positionLocks) {
      Object.keys(window.Game.positionLocks).forEach(pos => {
        if (window.Game.positionLocks[pos] > 0) window.Game.positionLocks[pos]--;
        if (window.Game.positionLocks[pos] <= 0) delete window.Game.positionLocks[pos];
      });
    }

    // veteran_rotation: +30% Stamina to the whole roster when entering a new zone/map
    if (window.Game.hasTrait('veteran_rotation')) {
      const prevZone = window.Game.getZoneForStage(window.Game.currentStageIndex);
      const nextZone = window.Game.getZoneForStage(window.Game.currentStageIndex + 1);
      if (nextZone !== prevZone) {
        Object.values(window.Game.roster).forEach(p => {
          if (p) p.stamina = Math.min(100, (p.stamina || 100) + 30);
        });
      }
    }

    // Advance current stage
    window.Game.currentStageIndex++;

    // Check if run won (exceeded stage 23)
    if (window.Game.currentStageIndex > 23) {
      triggerGameOver(true, (typeof window.t==='function'?window.t('game.champion_eternal'):'¡CAMPEÓN DE LA ETERNIDAD! Conquistaste la Serie Mundial y ganaste los Playoffs.'));
      return;
    }

    updateHUD();
    renderMap();
    renderActiveRoster();
    window.showScreen('screen-map');
  }

  // UPDATE HEAD-UP DISPLAY
  function updateHUD() {
    const zone = window.Game.getZoneForStage(window.Game.currentStageIndex);
    const zoneNames = ['Opening Day', 'All-Star Break', 'Pennant Chase', 'Playoffs'];
    el.hudStage.innerText = `${t('hud.stage')} ${window.Game.currentStageIndex + 1}/24 — ${zoneNames[zone] || ''}`;
    if (el.hudBudget) el.hudBudget.innerText = `$${window.Game.budget}`;
    const sideBud = document.getElementById('sidebar-budget-val');
    if (sideBud) sideBud.innerText = `$${window.Game.budget}`;
  }

  // RENDER TEAM ROSTER
  function renderActiveRoster() {
    el.lineupGrid.innerHTML = "";
    
    // Add class for layout block scroll
    document.body.classList.add('workspace-active');

    window.Game.battingOrder.forEach((slot, index) => {
      const player = window.Game.roster[slot];
      const effectivePlayer = window.Game.getEffectiveStats(player, slot);

      const slotContainer = document.createElement('div');
      slotContainer.className = "roster-vertical-item";
      slotContainer.setAttribute('data-slot', slot);
      slotContainer.setAttribute('data-index', index);
      slotContainer.draggable = true;
      
      // Drag & Drop event handlers
      slotContainer.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
        slotContainer.classList.add('dragging');
      });

      slotContainer.addEventListener('dragend', (e) => {
        slotContainer.classList.remove('dragging');
        document.querySelectorAll('.roster-vertical-item').forEach(el => {
          el.classList.remove('drag-over');
          el.style.borderColor = '';
          el.style.boxShadow = '';
        });
      });

      slotContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        slotContainer.classList.add('drag-over');
        slotContainer.style.borderColor = '#00ff66';
        slotContainer.style.boxShadow = '0 0 10px rgba(0,255,102,0.4)';
      });

      slotContainer.addEventListener('dragleave', (e) => {
        slotContainer.classList.remove('drag-over');
        slotContainer.style.borderColor = '';
        slotContainer.style.boxShadow = '';
      });

      slotContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        slotContainer.classList.remove('drag-over');
        slotContainer.style.borderColor = '';
        slotContainer.style.boxShadow = '';

        // 1. Check if an item from backpack was dropped on this player
        const itemIdxStr = e.dataTransfer.getData('baserogue-item-index');
        if (itemIdxStr !== '' && itemIdxStr !== null && itemIdxStr !== undefined) {
          const itemIdx = parseInt(itemIdxStr, 10);
          if (!isNaN(itemIdx) && window.Game.itemsInventory && window.Game.itemsInventory[itemIdx]) {
            const item = window.Game.itemsInventory[itemIdx];
            if (item.isConsumable) {
              if (window.AudioManager && typeof window.AudioManager.play === 'function') {
                window.AudioManager.play('item_use');
              }
              window.Game.useConsumableItem(item, slot);
              window.Game.itemsInventory.splice(itemIdx, 1);
            } else {
              if (window.AudioManager && typeof window.AudioManager.play === 'function') {
                window.AudioManager.play('item_equip');
              }
              window.Game.equipItem(itemIdx, slot);
            }
            renderActiveRoster();
            renderSynergiesAndItems();
            updateHUD();
            return;
          }
        }

        // 2. Otherwise handle batting order swap
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const toIndex = index;
        if (fromIndex !== toIndex && !isNaN(fromIndex)) {
          window.Game.swapBattingOrder(fromIndex, toIndex);
          renderActiveRoster();
          renderSynergiesAndItems();
        }
      });

      slotContainer.addEventListener('click', (e) => {
        if (player) {
          showPlayerCardPopup(player, slot);
        }
      });

      // Construct mini slot elements
      const orderSpan = document.createElement('span');
      orderSpan.className = "order-number";
      orderSpan.innerText = `#${index + 1}`;

      const posBadge = document.createElement('span');
      posBadge.className = "pos-badge";
      posBadge.innerText = slot;

      const nameSpan = document.createElement('span');
      nameSpan.className = "player-name";
      
      if (effectivePlayer) {
        const badgeIconsHTML = getPlayerBadgeIconsHTML(effectivePlayer);
        const itemIconHTML = player && player.equipped_item ? `<span title="${player.equipped_item.name} (${player.equipped_item.statDesc || ''})" style="margin-left:4px; font-size:11px; filter:drop-shadow(0 0 3px #00ff66);">${player.equipped_item.icon || '🎒'}</span>` : '';
        if (effectivePlayer.captain && !badgeIconsHTML.includes('badge-captain')) {
          console.warn('[BaseRogue] captain badge missing for a captain=true player', { player: effectivePlayer.name, effectivePlayer });
        }
        nameSpan.innerHTML = `${effectivePlayer.name}${badgeIconsHTML}${itemIconHTML}`;
        nameSpan.title = `${effectivePlayer.name} (${effectivePlayer.era})`;

        // OVR Badge
        // Instrumented per a bug report we couldn't reproduce (some players
        // occasionally show "-" here instead of a grade letter, PC only,
        // seen with Cal Ripken Jr., Brooks Robinson, Josh Hamilton — all
        // isolated re-tests with their exact data rendered correctly). If
        // this fires again, the console.warn below has the real inputs.
        let ovrGrade;
        try {
          const ovr = getPlayerOvr(effectivePlayer);
          ovrGrade = getClassGrade(ovr);
          if (!ovrGrade || typeof ovrGrade.text !== 'string' || !ovrGrade.text) {
            console.warn('[BaseRogue] OVR badge: getClassGrade returned something unexpected', { player: effectivePlayer.name, ovr, ovrGrade });
            ovrGrade = { text: '?', color: '#94a3b8' };
          }
        } catch (err) {
          console.warn('[BaseRogue] OVR badge computation threw', { player: effectivePlayer && effectivePlayer.name, error: err, effectivePlayer });
          ovrGrade = { text: '?', color: '#94a3b8' };
        }
        const ovrBadge = document.createElement('span');
        ovrBadge.className = "ovr-badge";
        ovrBadge.style.cssText = `background: ${ovrGrade.color}; color: #000; margin-left: auto; flex-shrink: 0;`;
        ovrBadge.innerText = ovrGrade.text;

        // Stamina mini bar
        const stamContainer = document.createElement('div');
        stamContainer.className = 'roster-item-stats';
        stamContainer.style.cssText = "display: flex; flex-direction: column; align-items: flex-end; gap: 2px;";
        
        const stamMini = document.createElement('div');
        stamMini.className = "stamina-bar-mini";
        const stam = effectivePlayer.stamina || 100;
        let fillCol = "var(--primary-color)";
        if (stam < 50) fillCol = "#f59e0b";
        if (stam < 25) fillCol = "#ef4444";
        
        stamMini.innerHTML = `<div class="stamina-fill-mini" style="width: ${stam}%; background: ${fillCol};"></div>`;
        
        stamContainer.appendChild(ovrBadge);
        stamContainer.appendChild(stamMini);

        slotContainer.appendChild(orderSpan);
        slotContainer.appendChild(posBadge);
        slotContainer.appendChild(nameSpan);
        slotContainer.appendChild(stamContainer);
      } else {
        nameSpan.innerText = t('pos.empty', '— VACÍO —');
        nameSpan.style.color = "#64748b";
        nameSpan.style.fontStyle = "italic";
        slotContainer.appendChild(orderSpan);
        slotContainer.appendChild(posBadge);
        slotContainer.appendChild(nameSpan);
      }

      el.lineupGrid.appendChild(slotContainer);
    });
  }

  // ── PLAYER CARD POPUP ────────────────────────────────────────────────────
  function showPlayerCardPopup(player, slot) {
    const overlay = document.getElementById('player-card-popup-overlay');
    if (!overlay) return;

    const isDraft = (slot === 'draft');
    const effectivePlayer = window.Game.getEffectiveStats(player, isDraft ? null : slot);

    const ovr = getPlayerOvr(effectivePlayer);
    const ovrGrade = getClassGrade(ovr);

    const statBar = (label, statKey, color) => {
      let baseVal = player[statKey];
      if (baseVal === undefined) {
        if (statKey === 'k_avd') baseVal = player.k_avoid !== undefined ? player.k_avoid : (player.k_avoid_val !== undefined ? player.k_avoid_val : (player.con || 0));
        else if (statKey === 'con') baseVal = player.contact_val || 0;
        else if (statKey === 'pwr') baseVal = player.power_val || 0;
        else if (statKey === 'eye') baseVal = player.eye_val || 0;
        else if (statKey === 'spd') baseVal = player.speed_val || 0;
        else if (statKey === 'def') baseVal = player.defense_val || 0;
        else baseVal = 0;
      }
      const effVal = (effectivePlayer && effectivePlayer[statKey] !== undefined) ? effectivePlayer[statKey] : baseVal;
      const g = getGrade(effVal);
      const gradeColors = { 'S': '#ffd700', 'A': '#22d3ee', 'B': '#4ade80', 'C': '#94a3b8', 'D': '#f97316', 'F': '#ef4444' };
      const gc = gradeColors[g] || '#fff';
      const isSuper = effVal >= 100;
      const displayWidth = Math.min(100, effVal);
      const extraClass = isSuper ? 'super-stat-bar' : '';

      const diff = effVal - baseVal;
      let diffSpan = '';
      if (diff > 0) {
        diffSpan = ` <span class="stat-diff-bonus" style="color:#00ff66;font-size:7px;font-family:'Press Start 2P',monospace;font-weight:bold;">+${diff}</span>`;
      } else if (diff < 0) {
        diffSpan = ` <span class="stat-diff-penalty" style="color:#ef4444;font-size:7px;font-family:'Press Start 2P',monospace;font-weight:bold;">${diff}</span>`;
      }

      return `
        <div class="popup-stat-row">
          <span class="popup-stat-label">${label}</span>
          <div class="popup-stat-bar-track">
            <div class="popup-stat-bar-fill ${extraClass}" style="width:${displayWidth}%;background:${color};"></div>
          </div>
          <span class="popup-stat-val" style="color:${gc};">${baseVal}${diffSpan} <span class="popup-grade" style="color:${gc};">${g}</span></span>
        </div>`;
    };

    const eraClass = (player.era || '').toLowerCase().replace(/[^a-z]/g,'').substring(0,8);
    const stam = player.stamina || 100;
    const stamColor = stam < 25 ? '#ef4444' : stam < 50 ? '#f59e0b' : '#00ff66';
    const rarityColors = { Common: '#94a3b8', Uncommon: '#10b981', Rare: '#38bdf8', Epic: '#c084fc', Legendary: '#ffd700' };
    const rarityColor = rarityColors[player.rarity] || '#94a3b8';

    const isPitcher = (player.pos === 'P' || player.pos === 'SP' || player.pos === 'RP' || player.pos === 'CL' || player.role === 'SP' || player.role === 'RP' || player.role === 'CL');

    if (isPitcher) {
      // ── BASEBALL-DEX STYLE PITCHER MODAL ──────────────────────────────────────
      const h9  = player.h9  !== undefined ? player.h9  : (player.grt !== undefined ? player.grt : 50);
      const k9  = player.k9  !== undefined ? player.k9  : (player.stf !== undefined ? player.stf : (player.str !== undefined ? player.str : 50));
      const bb9 = player.bb9 !== undefined ? player.bb9 : (player.ctl !== undefined ? player.ctl : 50);
      const hr9 = player.hr9 !== undefined ? player.hr9 : (player.mov !== undefined ? player.mov : 50);
      const sta = player.sta !== undefined ? player.sta : (player.sta_val !== undefined ? player.sta_val : 65);
      const roleStr = player.role || player.pos || 'SP';

      const renderDexStat = (lbl, val) => {
        const grade = getClassGrade(val);
        return `
          <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:9px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${lbl}</span>
            <span style="font-size:11px;font-weight:bold;color:${grade.color};font-family:'Press Start 2P',monospace;">${val} <small style="font-size:8px;">${grade.text}</small></span>
          </div>
        `;
      };

      let teamFull = player.team !== 'ROOK' ? player.team : '—';
      if (window.PlayersDB && window.PlayersDB.FranchiseNames && window.PlayersDB.FranchiseNames[player.team]) {
        teamFull = window.PlayersDB.FranchiseNames[player.team];
      }

      overlay.querySelector('#popup-card-content').innerHTML = `
        <div class="popup-card-header" style="border-bottom:none;padding-bottom:0;">
          <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:${rarityColor};">${player.rarity || 'Common'} · ${(player.era||'').replace(/\(.*\)/,'').trim()}</div>
          <button id="btn-close-popup" class="popup-close-btn">✕</button>
        </div>
        <div class="popup-player-name" style="font-size:13px;margin-top:4px;margin-bottom:2px;">${player.cleanName || player.name}</div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:14px;">${teamFull} — ${player.year || player.peak_year || '—'} · ${roleStr}</div>

        <div style="text-align:center;margin-bottom:16px;background:rgba(0,0,0,0.3);padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
          <div style="font-family:'Press Start 2P',monospace;font-size:32px;color:${ovrGrade.color};text-shadow:0 0 15px ${ovrGrade.color}88;">${ovr}</div>
          <div style="font-size:10px;color:#9ca3af;font-family:'Press Start 2P',monospace;margin-top:2px;">OVR</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
          ${renderDexStat(t('card_popup.h9_label', 'H/9'), h9)}
          ${renderDexStat(t('card_popup.k9_label', 'K/9'), k9)}
          ${renderDexStat(t('card_popup.bb9_label', 'BB/9'), bb9)}
          ${renderDexStat(t('card_popup.hr9_label', 'HR/9'), hr9)}
          ${renderDexStat(t('card_popup.sta_label', 'STA'), sta)}
          <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:9px;color:#9ca3af;font-family:'Press Start 2P',monospace;">${t('card_popup.role_label', 'ROL')}</span>
            <span style="font-size:11px;font-weight:bold;color:#38bdf8;font-family:'Press Start 2P',monospace;">${roleStr}</span>
          </div>
        </div>

        <div class="popup-year" style="margin-top:12px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:8px;">Peak: ${player.year || player.peak_year || '—'} &nbsp;|&nbsp; ${player.era || ''}</div>
      `;

      overlay.classList.remove('hidden');
      const closeBtn = overlay.querySelector('#btn-close-popup');
      if (closeBtn) closeBtn.onclick = () => overlay.classList.add('hidden');
      overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.add('hidden'); };
      return;
    }

    // ── STANDARD BATTER MODAL ────────────────────────────────────────────────
    overlay.querySelector('#popup-card-content').innerHTML = `
      <div class="popup-card-header">
        <div class="popup-rarity-badge" style="color:${rarityColor};border-color:${rarityColor};">${player.rarity || 'Common'}</div>
        <button id="btn-close-popup" class="popup-close-btn">✕</button>
      </div>
      <div class="popup-player-name">${player.name}</div>
      <div class="popup-meta-row">
        <span class="popup-pos-badge" title="Posición Natural / Natural Position">${player.sec_pos && String(player.sec_pos).trim() ? `${player.pos || slot} / ${player.sec_pos}` : (player.pos || slot)}</span>
        <span class="popup-era-chip">${(player.era||'').replace(/\(.*\)/,'').trim()}</span>
        <span class="popup-team-chip">${player.team !== 'ROOK' ? player.team : '—'}</span>
      </div>
      <div class="popup-ovr-banner" style="background:${ovrGrade.color}20;border-color:${ovrGrade.color};">
        <span class="popup-ovr-label">OVR</span>
        <span class="popup-ovr-val" style="color:${ovrGrade.color};">${ovr}</span>
        <span class="popup-ovr-grade" style="color:${ovrGrade.color};">${ovrGrade.text}</span>
      </div>
      <div class="popup-stats-section">
        ${statBar('CON', 'con', '#00ff66')}
        ${statBar('PWR', 'pwr', '#f97316')}
        ${statBar('EYE', 'eye', '#fbbf24')}
        ${statBar('K/AVD', 'k_avd', '#ec4899')}
        ${statBar('SPD', 'spd', '#38bdf8')}
        ${statBar('DEF', 'def', '#a78bfa')}
      </div>
      <div class="popup-stamina-row">
        <span style="font-size:10px;color:#9ca3af;font-family:'Press Start 2P',monospace;">STAMINA</span>
        <div class="popup-stamina-track">
          <div class="popup-stamina-fill" style="width:${stam}%;background:${stamColor};"></div>
        </div>
        <span style="color:${stamColor};font-size:10px;font-family:'Press Start 2P',monospace;">${stam}%</span>
      </div>
      ${(() => {
        if (isDraft) return '';
        const s = (window.Game.runBatterStats || {})[player.name];
        if (!s || !((s.ab || 0) > 0 || (s.bb || 0) > 0)) return '';
        const ab = s.ab || 0, h = s.h || 0, bb = s.bb || 0, so = s.so || 0, hr = s.hr || 0, rbi = s.rbi || 0, sb = s.sb || 0, e = s.e || 0;
        const b2 = s.doubles || 0, b3 = s.triples || 0;
        const pa = ab + bb;
        const totalBases = Math.max(0, h - b2 - b3 - hr) + (2 * b2) + (3 * b3) + (4 * hr);
        const avg = ab > 0 ? (h / ab).toFixed(3).replace(/^0/, '') : '.000';
        const obp = pa > 0 ? ((h + bb) / pa).toFixed(3).replace(/^0/, '') : '.000';
        const slg = ab > 0 ? (totalBases / ab).toFixed(3).replace(/^0/, '') : '.000';
        return `
      <div class="popup-run-stats-row" style="margin-top:10px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.15);">
        <div style="font-size:8px; color:var(--primary-color); font-family:'Press Start 2P',monospace; margin-bottom:6px;">📊 STATS DE ESTA RUN</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; font-size:9px;">
          <span class="popup-upgrade-badge">AB ${ab}</span>
          <span class="popup-upgrade-badge">H ${h}</span>
          <span class="popup-upgrade-badge">2B ${b2}</span>
          <span class="popup-upgrade-badge">3B ${b3}</span>
          <span class="popup-upgrade-badge">HR ${hr}</span>
          <span class="popup-upgrade-badge">RBI ${rbi}</span>
          <span class="popup-upgrade-badge">SB ${sb}</span>
          <span class="popup-upgrade-badge">BB ${bb}</span>
          <span class="popup-upgrade-badge">SO ${so}</span>
          <span class="popup-upgrade-badge" style="background:${e > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'};color:${e > 0 ? '#f87171' : '#94a3b8'};">E ${e}</span>
          <span class="popup-upgrade-badge">AVG ${avg}</span>
          <span class="popup-upgrade-badge">OBP ${obp}</span>
          <span class="popup-upgrade-badge">SLG ${slg}</span>
        </div>
      </div>`;
      })()}
      ${player.upgrades && Object.values(player.upgrades).some(v => v > 0) ? `
        <div class="popup-upgrades-row">
          <span style="font-size:8px;color:var(--primary-color);font-family:'Press Start 2P',monospace;">⬆ UPGRADES:</span>
          ${Object.entries(player.upgrades).filter(([k,v])=>v>0).map(([k,v])=>`<span class="popup-upgrade-badge">+${v} ${k.toUpperCase()}</span>`).join('')}
        </div>` : ''}
      ${(() => {
        if (!player.era && (!player.team || player.team === 'ROOK')) return '';
        
        // Calculate era synergy state
        let eraCount = 0;
        if (window.Game && window.Game.roster) {
          Object.values(window.Game.roster).forEach(p => {
            if (p && !p.isReplacement && p.era === player.era && !p.synergyBanned) {
              const weight = p.synergyWeight || (p.isInterEra ? 2 : 1);
              eraCount += weight;
            }
          });
        }
        const eraTier = (window.Game && typeof window.Game.getEraTier === 'function') ? window.Game.getEraTier(player.era, eraCount) : 0;
        const eraName = window.PlayersDB.EraTraits && window.PlayersDB.EraTraits[player.era] ? window.PlayersDB.EraTraits[player.era].name : player.era;

        // Calculate team franchise synergy state
        let teamCount = 0;
        if (player.team && player.team !== 'ROOK' && window.Game && window.Game.roster) {
          Object.values(window.Game.roster).forEach(p => {
            if (p && !p.isReplacement && p.team === player.team) {
              teamCount += 1;
            }
          });
        }
        const teamFullName = (window.PlayersDB && window.PlayersDB.FranchiseNames && window.PlayersDB.FranchiseNames[player.team]) || player.team;
        const teamTier = teamCount >= 4 ? 3 : (teamCount === 3 ? 2 : (teamCount === 2 ? 1 : 0));
        const teamTierName = teamTier === 3 
          ? t('card_popup.dynasty_tier', 'Dinastía (+8)') 
          : (teamTier === 2 ? t('card_popup.brotherhood_tier', 'Hermandad (+6)') 
          : (teamTier === 1 ? t('card_popup.chemistry_tier', 'Química (+4)') 
          : t('card_popup.inactive_tier', 'Inactiva')));

        const eraActiveTag = t('card_popup.tier_active_tag', { tier: eraTier, count: eraCount });
        const eraContribTag = t('card_popup.contributes_tag', { count: eraCount, target: 2 });
        const teamContribTag = t('card_popup.contributes_tag', { count: teamCount, target: 2 });

        return `
        <div class="popup-synergies-summary" style="margin-top:10px; padding:10px 12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.12); border-radius:8px; text-align:left;">
          <div style="font-size:8px; color:#ffd700; font-family:'Press Start 2P',monospace; margin-bottom:8px; letter-spacing:0.5px;">
            ${t('card_popup.synergies_contributed', '⚡ SINERGIAS APORTADAS')}
          </div>
          
          ${player.era ? `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:11px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span>⏳</span>
                <strong style="color:#fef08a;">${eraName}</strong>
              </div>
              <span style="font-size:9px; font-family:'Press Start 2P',monospace; padding:3px 6px; border-radius:4px; ${eraTier > 0 ? 'background:rgba(34,197,94,0.2); color:#4ade80; border:1px solid #22c55e;' : 'background:rgba(255,255,255,0.06); color:#94a3b8; border:1px solid rgba(255,255,255,0.1);'}">
                ${eraTier > 0 ? eraActiveTag : eraContribTag}
              </span>
            </div>
          ` : ''}

          ${player.team && player.team !== 'ROOK' ? `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span>⚾</span>
                <strong style="color:#93c5fd;">${teamFullName} (${player.team})</strong>
              </div>
              <span style="font-size:9px; font-family:'Press Start 2P',monospace; padding:3px 6px; border-radius:4px; ${teamTier > 0 ? 'background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid #3b82f6;' : 'background:rgba(255,255,255,0.06); color:#94a3b8; border:1px solid rgba(255,255,255,0.1);'}">
                ${teamTier > 0 ? teamTierName : teamContribTag}
              </span>
            </div>
          ` : ''}
        </div>
        `;
      })()}
      <div class="popup-year">Peak: ${player.year || player.peak_year || player.peakYear || '—'} &nbsp;|&nbsp; ${player.era || ''}</div>
      ${!isDraft ? `
        <div class="popup-item-slot-container" style="margin-top:10px; padding:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.15); border-radius:8px;">
          <div style="font-size:8px; color:var(--accent-color); font-family:'Press Start 2P',monospace; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            🎒 ${t('equip.slot_title', 'EQUIPAMIENTO / ÍTEM')}
          </div>
          ${player.equipped_item ? `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,255,102,0.08); border:1px solid #00ff66; border-radius:6px; padding:8px 10px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:20px; font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;">${player.equipped_item.icon || '🎒'}</span>
                <div>
                  <div style="font-size:9.5px; font-weight:bold; color:#00ff66;">${player.equipped_item.name}</div>
                  <div style="font-size:8.5px; color:#cbd5e1; margin-top:2px;">${player.equipped_item.statDesc || ''}</div>
                </div>
              </div>
              <button id="btn-popup-unequip-item" style="background:#ef4444; color:#fff; border:none; border-radius:4px; padding:5px 8px; font-size:7.5px; font-family:'Press Start 2P',monospace; cursor:pointer; transition:all 0.15s ease;">
                ${t('equip.btn_unequip', 'Desequipar')}
              </button>
            </div>
          ` : `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.2); border-radius:6px; padding:8px 10px;">
              <div style="font-size:8.5px; color:#9ca3af;">${t('equip.slot_empty', 'Ranura Vacía (Sin Ítem)')}</div>
              <button id="btn-popup-equip-item" style="background:#3b82f6; color:#fff; border:none; border-radius:4px; padding:5px 8px; font-size:7.5px; font-family:'Press Start 2P',monospace; cursor:pointer; transition:all 0.15s ease;">
                ${t('equip.btn_equip', '+ Equipar')}
              </button>
            </div>
          `}
        </div>

        <div class="popup-def-swap-container" style="margin-top:10px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.15); display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:8px; color:var(--accent-color); font-family:'Press Start 2P',monospace; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-arrows-rotate"></i> ${t('card_popup.swap_pos_title')}
          </div>
          <div style="font-size:8px; color:#9ca3af; line-height:1.3;">
            ${t('card_popup.swap_pos_desc', { name: player.name })}
          </div>
          <select id="popup-def-swap-select" style="background:#090d16; color:#00ff66; border:1px solid #00ff66; border-radius:6px; padding:6px 8px; font-size:9px; font-family:'Press Start 2P',monospace; cursor:pointer; width:100%; margin-top:2px;">
            ${['C','1B','2B','3B','SS','LF','CF','RF','DH'].map(targetSlot => {
              const occupant = window.Game.roster[targetSlot];
              const occName = occupant ? occupant.name : (t('pos.empty'));
              const isCurrent = (targetSlot === slot);
              const isNat = (player.pos === targetSlot);
              const secArr = player.sec_pos ? player.sec_pos.split(',').map(s=>s.trim()) : [];
              const isSec = secArr.includes(targetSlot);
              
              let tag = "";
              if (isCurrent) tag = t('card_popup.tag_current');
              else if (isNat) tag = t('card_popup.tag_native');
              else if (isSec) tag = t('card_popup.tag_secondary');
              else if (targetSlot !== 'DH') tag = t('card_popup.tag_out_pos');
              
              return `<option value="${targetSlot}" ${isCurrent ? 'selected disabled' : ''}>${targetSlot} — ${occName}${tag}</option>`;
            }).join('')}
          </select>
        </div>` : ''}
    `;

    overlay.classList.remove('hidden');
    overlay.classList.add('popup-visible');

    // Equip / Unequip handlers
    const btnUnequip = overlay.querySelector('#btn-popup-unequip-item');
    if (btnUnequip) {
      btnUnequip.addEventListener('click', () => {
        window.Game.unequipItem(slot);
        renderActiveRoster();
        renderSynergiesAndItems();
        updateHUD();
        showPlayerCardPopup(player, slot);
      });
    }

    const btnEquip = overlay.querySelector('#btn-popup-equip-item');
    if (btnEquip) {
      btnEquip.addEventListener('click', () => {
        showBackpackEquipModal(slot);
      });
    }

    const swapSelect = overlay.querySelector('#popup-def-swap-select');
    if (swapSelect) {
      swapSelect.addEventListener('change', (e) => {
        const targetSlot = e.target.value;
        if (targetSlot && targetSlot !== slot) {
          window.Game.swapDefensivePositions(slot, targetSlot);
          hidePlayerCardPopup();
          renderActiveRoster();
          renderSynergiesAndItems();
          updateHUD();
        }
      });
    }

    // Close button
    document.getElementById('btn-close-popup').addEventListener('click', hidePlayerCardPopup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hidePlayerCardPopup();
    }, { once: true });
  }

  // ── BACKPACK EQUIP MODAL: choose an item from backpack to equip on player ──
  function showBackpackEquipModal(targetSlot) {
    const player = window.Game.roster[targetSlot];
    if (!player) return;

    const overlay = document.createElement('div');
    overlay.className = 'backpack-modal-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
      z-index: 10000; display: flex; align-items: center; justify-content: center;
      padding: 16px; animation: fadeIn 0.2s ease-out;
    `;

    const items = window.Game.itemsInventory || [];

    overlay.innerHTML = `
      <div style="background:#090d16; border:2px solid #38bdf8; border-radius:14px; padding:20px; max-width:440px; width:100%; box-shadow:0 0 30px rgba(0,0,0,0.9), 0 0 15px rgba(56,189,248,0.3); font-family:'Press Start 2P',monospace;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed rgba(255,255,255,0.2); padding-bottom:10px; margin-bottom:12px;">
          <span style="font-size:10px; color:#38bdf8;">🎒 ${t('equip.backpack_title', 'MOCHILA DEL CLUB')}</span>
          <button id="btn-close-backpack-modal" style="background:none; border:none; color:#9ca3af; font-size:16px; cursor:pointer;">&times;</button>
        </div>
        <div style="font-size:8px; color:#cbd5e1; line-height:1.5; margin-bottom:14px; font-family:sans-serif;">
          ${t('equip.select_item_to_equip', { player: player.name })}
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:260px; overflow-y:auto; padding-right:4px;">
          ${items.length === 0 ? `
            <div style="font-size:8.5px; color:#64748b; text-align:center; padding:20px 0; font-family:'Press Start 2P',monospace;">
              ${t('equip.no_items_in_backpack', 'No tienes ítems disponibles en la mochila.')}
            </div>
          ` : items.map((item, idx) => `
            <button class="backpack-item-pick-btn" data-index="${idx}" style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.04); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:10px 12px; cursor:pointer; text-align:left; transition:all 0.15s ease; width:100%;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:22px; font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;">${item.icon || '🎒'}</span>
                <div>
                  <div style="font-size:11px; font-weight:bold; color:#38bdf8; font-family:sans-serif;">${item.name}</div>
                  <div style="font-size:8.5px; color:#94a3b8; margin-top:2px;">${item.statDesc || ''}</div>
                </div>
              </div>
              <span style="font-size:8px; color:#00ff66; font-family:'Press Start 2P',monospace;">EQUIPAR</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-close-backpack-modal').onclick = () => overlay.remove();

    overlay.querySelectorAll('.backpack-item-pick-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        window.Game.equipItem(idx, targetSlot);
        overlay.remove();
        renderActiveRoster();
        renderSynergiesAndItems();
        updateHUD();
        showPlayerCardPopup(player, targetSlot);
      };
    });
  }

  // ── BATTER SELECTOR MODAL: select a batter for test cage or consumable ──
  function showBatterSelectorModal({ title, subtitle, onSelect, onCancel }) {
    const overlay = document.createElement('div');
    overlay.className = 'player-selector-modal-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.88); backdrop-filter: blur(8px);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
      padding: 16px; animation: fadeIn 0.2s ease-out;
    `;

    const slots = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    const playersList = slots.map(slot => ({ slot, player: window.Game.roster[slot] })).filter(item => item.player);

    overlay.innerHTML = `
      <div style="background:#090d16; border:2px solid #f59e0b; border-radius:14px; padding:20px; max-width:440px; width:100%; box-shadow:0 0 30px rgba(0,0,0,0.9), 0 0 15px rgba(245,158,11,0.3); font-family:'Press Start 2P',monospace;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed rgba(255,255,255,0.2); padding-bottom:10px; margin-bottom:12px;">
          <span style="font-size:10px; color:#f59e0b;">${title || t('equip.test_cage_title', '⚾ JAULA DE PRUEBAS')}</span>
          <button id="btn-close-selector-modal" style="background:none; border:none; color:#9ca3af; font-size:16px; cursor:pointer;">&times;</button>
        </div>
        <div style="font-size:9.5px; color:#cbd5e1; line-height:1.5; margin-bottom:14px; font-family:sans-serif;">
          ${subtitle || t('equip.test_cage_desc', 'Selecciona qué bateador entrará a probar este prototipo:')}
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:280px; overflow-y:auto; padding-right:4px;" id="batter-selector-list">
          ${playersList.map(({ slot, player }) => {
            const stam = player.stamina || 100;
            const stamColor = stam < 25 ? '#ef4444' : stam < 50 ? '#f59e0b' : '#00ff66';
            const equippedBadge = player.equipped_item ? `<span style="font-size:7.5px; color:#00ff66; background:rgba(0,255,102,0.1); padding:2px 4px; border-radius:3px; margin-left:4px;">${player.equipped_item.icon || '🎒'} ${player.equipped_item.name}</span>` : '';
            return `
              <button class="selector-player-btn" data-slot="${slot}" style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:10px 12px; cursor:pointer; text-align:left; transition:all 0.15s ease; width:100%;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:8.5px; color:var(--primary-color); font-family:'Press Start 2P',monospace; min-width:24px;">${slot}</span>
                  <div>
                    <div style="font-size:11px; font-weight:bold; color:#fff; font-family:sans-serif;">${player.name}</div>
                    <div style="font-size:8px; color:#94a3b8; margin-top:2px;">${equippedBadge}</div>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:8px; color:${stamColor}; font-family:'Press Start 2P',monospace;">⚡ ${stam}%</div>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-close-selector-modal').onclick = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };

    overlay.querySelectorAll('.selector-player-btn').forEach(btn => {
      btn.onclick = () => {
        const slot = btn.getAttribute('data-slot');
        const player = window.Game.roster[slot];
        overlay.remove();
        if (onSelect) onSelect(player, slot);
      };
    });
  }

  function hidePlayerCardPopup() {
    const overlay = document.getElementById('player-card-popup-overlay');
    if (overlay) {
      overlay.classList.remove('popup-visible');
      overlay.classList.add('hidden');
    }
  }

  // ── NODE VISUAL CONFIG ───────────────────────────────────────────────────
  const NODE_VISUALS = {
    match:    { iconClass: 'fa-solid fa-baseball-bat-ball', text: 'VS',    label: 'SERIE',    color: '#00ff66', bg: '#021a0e', border: '#00ff66' },
    mid_boss: { iconClass: 'fa-solid fa-bolt',              text: 'ELITE', label: 'MID-BOSS', color: '#f97316', bg: '#250f02', border: '#f97316' },
    boss:     { iconClass: 'fa-solid fa-crown',             text: 'BOSS',  label: 'JEFE',     color: '#ffd700', bg: '#1a0e00', border: '#ffd700' },
    draft:    { iconClass: 'fa-solid fa-file-signature',    text: 'SIGN',  label: 'FIRMA',    color: '#38bdf8', bg: '#021526', border: '#38bdf8' },
    trade:    { iconClass: 'fa-solid fa-right-left',        text: 'TRADE', label: 'TRADE',    color: '#a855f7', bg: '#1c052e', border: '#a855f7' },
    event:    { iconClass: 'fa-solid fa-clipboard-question',text: 'EVT',   label: 'EVENTO',   color: '#fb923c', bg: '#1a0e00', border: '#fb923c' },
    train:    { iconClass: 'fa-solid fa-dumbbell',          text: 'GYM',   label: 'ENTRENO',  color: '#22d3ee', bg: '#011a1a', border: '#22d3ee' },
    rest:     { iconClass: 'fa-solid fa-couch',             text: 'REST',  label: 'DESCANSO', color: '#c084fc', bg: '#12001a', border: '#c084fc' },
    chest:    { iconClass: 'fa-solid fa-gem',               text: 'LOOT',  label: 'COFRE',    color: '#facc15', bg: '#1a1400', border: '#facc15' },
    gamble:   { iconClass: 'fa-solid fa-clover',            text: 'LUCK',  label: 'LUCK',     color: '#10b981', bg: '#022c22', border: '#10b981' },
  };

  // RENDER VISUAL POKELIKE MAP - Math-based layout (no DOM measurement)
  // RENDER VISUAL POKELIKE MAP - Math-based layout (Ascending bottom-to-top progression)
  function renderMap() {
    el.mapContainer.innerHTML = '';

    const currentStage = window.Game.currentStageIndex;
    const currentZone  = window.Game.getZoneForStage(currentStage);
    
    // Render zones in ascending order from bottom to top (Playoffs at top, Opening Day at bottom)
    const ZONE_STAGE_RANGES = [
      { range: [18, 23], zoneIdx: 3 },
      { range: [12, 17], zoneIdx: 2 },
      { range: [6, 11],  zoneIdx: 1 },
      { range: [0, 5],   zoneIdx: 0 }
    ];

    // Layout constants (SVG coordinate space). The SVG scales via viewBox to
    // whatever the container's real CSS width is (width="100%"), so node/icon/
    // label sizes — all fixed SVG-unit values below — end up rendering at
    // containerWidth/SVG_W times their nominal size. SVG_W=500 assumes a wide
    // desktop panel; on a ~350-400px phone that ratio is under 1, so every
    // node, icon and label shrinks well below its intended size. Narrowing
    // SVG_W on mobile brings that ratio back above 1 (nodes render bigger, not
    // smaller) while leaving inter-node spacing untouched, since rendered
    // pixel spacing is containerWidth/(count+1) regardless of SVG_W.
    // ROW_H/PADDING_Y are also trimmed on mobile: those don't affect node size
    // (only SVG_W vs container width does), but the old 60/100 values left a
    // lot of dead black space above/below/between rows relative to how little
    // screen width a phone has to show it in — tightening them makes the same
    // nodes fill noticeably more of the visible box instead of floating in a
    // mostly-empty column.
    const isMobileMap = window.innerWidth <= 768;
    const NODE_R    = 26;   // node radius
    // 260 is close to the safe floor for this — any narrower and 3-per-row
    // stages start touching (their outer border circles overlapped by 2px
    // at 225, measured directly). Any further size increase has to come from
    // row/label spacing instead, not from squeezing this further.
    const SVG_W     = isMobileMap ? 260 : 500;  // SVG viewport width
    const ROW_H     = isMobileMap ? 82 : 100;   // pixels between stage rows
    const PADDING_Y = isMobileMap ? 38 : 60;    // top/bottom padding inside SVG

    ZONE_STAGE_RANGES.forEach(({ range: [zStart, zEnd], zoneIdx }) => {
      const zoneConfig     = window.Game.getZoneConfig(zoneIdx);
      const isCurrentZone  = (zoneIdx === currentZone);
      const isZoneCompleted = (currentStage > zEnd);
      const isZoneLocked    = (zoneIdx > currentZone);

      // ── Zone Wrapper ────────────────────────────────────────────────
      const zoneWrapper = document.createElement('div');
      zoneWrapper.className = `zone-wrapper ${zoneConfig.theme}${isCurrentZone ? ' zone-active' : ''}${isZoneCompleted ? ' zone-done' : ''}${isZoneLocked ? ' zone-locked' : ''}`;

      // ── Zone Header ─────────────────────────────────────────────────
      const zoneStatusBadge = isZoneCompleted
        ? `<span class="zone-badge zone-badge-done">✓ ${t('map.completed', 'COMPLETADA')}</span>`
        : isZoneLocked
          ? `<span class="zone-badge zone-badge-locked">🔒 ${t('map.locked')}</span>`
          : `<span class="zone-badge zone-badge-active">▶ ${t('map.active')}</span>`;

      const subText = zoneConfig.subtitleKey ? t(zoneConfig.subtitleKey) : zoneConfig.subtitle;
      const zoneDivision = window.Game.selectedDivisions && window.Game.selectedDivisions[zoneIdx];
      let divIcon = '⚾';
      if (zoneDivision) {
        const lbl = zoneDivision.label.toLowerCase();
        if (lbl.includes('negro') || lbl.includes('champions') || lbl.includes('classic') || lbl.includes('pennant')) {
          divIcon = '👑';
        } else if (lbl.includes('federal')) {
          divIcon = '⚡';
        }
      }
      const divisionBannerHTML = zoneDivision
        ? `<div class="zone-division-banner">${divIcon} ${zoneDivision.label.toUpperCase()} — ${window.Game.selectedSeasonYear}</div>`
        : '';

      const zoneHeader = document.createElement('div');
      zoneHeader.className = 'zone-header';
      zoneHeader.innerHTML = `
        <div class="zone-header-left">
          <span class="zone-icon">${zoneConfig.bossIcon}</span>
          <div>
            <div class="zone-name">${zoneConfig.name}</div>
            <div class="zone-subtitle">${subText}</div>
            ${divisionBannerHTML}
          </div>
        </div>
        ${zoneStatusBadge}
      `;
      zoneWrapper.appendChild(zoneHeader);

      if (isZoneLocked) {
        el.mapContainer.appendChild(zoneWrapper);
        return;
      }

      // ── Calculate node positions (SVG coords) ───────────────────────
      // We render stages from bottom (zStart) to top (zEnd): stage zStart = bottom row
      const stagesInZone = zEnd - zStart + 1; // always 4
      const SVG_H = PADDING_Y * 2 + (stagesInZone - 1) * ROW_H;

      // nodePos[s][idx] = {x, y} in SVG coords
      const nodePos = {};
      for (let s = zStart; s <= zEnd; s++) {
        const nodes = window.Game.map[s] || [];
        const count = nodes.length;
        // row index from bottom: s=zStart → rowFromBottom=0 (bottom), s=zEnd → rowFromBottom=stagesInZone-1 (top)
        const rowFromBottom = s - zStart;
        const y = SVG_H - PADDING_Y - rowFromBottom * ROW_H;
        nodePos[s] = nodes.map((_, idx) => ({
          x: count === 1
            ? SVG_W / 2
            : SVG_W * (idx + 1) / (count + 1),
          y
        }));
      }

      // ── Determine active node indices for current stage ─────────────
      let activeNextNodeIdxs = [];
      if (currentStage >= zStart && currentStage <= zEnd) {
        if (currentStage === zStart) {
          activeNextNodeIdxs = (window.Game.map[currentStage] || []).map((_, i) => i);
        } else {
          const prev = window.Game.map[currentStage - 1] || [];
          prev.forEach(pn => {
            if (pn.visited) (pn.connections || []).forEach(ci => activeNextNodeIdxs.push(ci));
          });
        }
      }

      // ── Build SVG ───────────────────────────────────────────────────
      // width="100%" combined with a fixed pixel `height` attribute is a
      // mismatched pair: the two together force preserveAspectRatio's default
      // "meet" behavior to scale by whichever dimension is MORE constrained —
      // and since height is always set to exactly SVG_H (the viewBox height),
      // that scale factor is always 1. The map never actually scaled up to
      // fill a wide container; it just rendered at native size, centered,
      // with the leftover width as dead margin on both sides (this is a
      // pre-existing bug, not new — it was just easy to miss on narrower
      // desktop windows and got much more obvious on a wide one). Letting
      // height come from the CSS aspect-ratio instead — no fixed height
      // attribute at all — makes both dimensions scale together correctly.
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
      svg.setAttribute('width',  '100%');
      svg.style.display = 'block';
      svg.style.overflow = 'visible';
      svg.style.height = 'auto';
      svg.style.aspectRatio = `${SVG_W} / ${SVG_H}`;

      // defs: glow filters
      const defs = document.createElementNS(svgNS, 'defs');
      [['glow-active', '#00ff66', 5], ['glow-visited', '#10b981', 3]].forEach(([id, clr, dev]) => {
        const flt = document.createElementNS(svgNS, 'filter');
        flt.setAttribute('id', `${id}-z${zoneIdx}`);
        flt.setAttribute('x', '-50%'); flt.setAttribute('y', '-50%');
        flt.setAttribute('width', '200%'); flt.setAttribute('height', '200%');
        const blur = document.createElementNS(svgNS, 'feGaussianBlur');
        blur.setAttribute('in', 'SourceGraphic'); blur.setAttribute('stdDeviation', dev);
        flt.appendChild(blur);
        defs.appendChild(flt);
      });
      svg.appendChild(defs);

      // ── DRAW PATHS (behind nodes) ────────────────────────────────────
      for (let s = zStart; s < zEnd; s++) {
        const stageNodes = window.Game.map[s] || [];
        stageNodes.forEach(node => {
          (node.connections || []).forEach(targetIdx => {
            const p1 = nodePos[s]?.[node.index];
            const p2 = nodePos[s + 1]?.[targetIdx];
            if (!p1 || !p2) return;

            const targetNode = window.Game.map[s + 1]?.[targetIdx];
            const targetVis  = NODE_VISUALS[targetNode?.type] || NODE_VISUALS.match;

            const isVisitedPath = node.visited && targetNode?.visited;
            const isActivePath  = (s + 1 === currentStage) && node.visited;

            // Glow behind active paths
            if (isActivePath) {
              const gp = document.createElementNS(svgNS, 'line');
              gp.setAttribute('x1', p1.x); gp.setAttribute('y1', p1.y);
              gp.setAttribute('x2', p2.x); gp.setAttribute('y2', p2.y);
              gp.setAttribute('stroke', targetVis.color);
              gp.setAttribute('stroke-width', '8');
              gp.setAttribute('opacity', '0.5');
              gp.setAttribute('filter', `url(#glow-active-z${zoneIdx})`);
              svg.appendChild(gp);
            } else if (isVisitedPath) {
              const gp = document.createElementNS(svgNS, 'line');
              gp.setAttribute('x1', p1.x); gp.setAttribute('y1', p1.y);
              gp.setAttribute('x2', p2.x); gp.setAttribute('y2', p2.y);
              gp.setAttribute('stroke', '#10b981');
              gp.setAttribute('stroke-width', '4');
              gp.setAttribute('opacity', '0.25');
              svg.appendChild(gp);
            }

            // Main line
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round');

            if (isActivePath) {
              line.setAttribute('stroke', targetVis.color);
              line.setAttribute('stroke-width', '4');
              line.setAttribute('stroke-dasharray', '8,4');
              line.classList.add('path-active-anim');
            } else if (isVisitedPath) {
              line.setAttribute('stroke', '#10b981');
              line.setAttribute('stroke-width', '2.5');
              line.setAttribute('stroke-dasharray', '6,4');
              line.setAttribute('opacity', '0.6');
            } else {
              // Future / inactive path: subtle, unobtrusive dark line
              line.setAttribute('stroke', 'rgba(255, 255, 255, 0.12)');
              line.setAttribute('stroke-width', '1.5');
              line.setAttribute('stroke-dasharray', '4,4');
            }
            svg.appendChild(line);
          });
        });
      }

      // ── DRAW NODES (on top of paths) ────────────────────────────────
      for (let s = zStart; s <= zEnd; s++) {
        const stageNodes = window.Game.map[s] || [];
        const isBossStage = (s === 5 || s === 11 || s === 17 || s === 23);

        stageNodes.forEach((node, idx) => {
          const pos = nodePos[s]?.[idx];
          if (!pos) return;
          const vis = NODE_VISUALS[node.type] || NODE_VISUALS.match;

          const isVisited       = node.visited;
          const isPast          = (s < currentStage);
          const isActive        = (s === currentStage) && activeNextNodeIdxs.includes(idx);
          const isFutureVisible = (s > currentStage) && !isVisited;

          const group = document.createElementNS(svgNS, 'g');
          group.setAttribute('class', `map-node-group ${isActive ? 'node-is-active' : (isVisited ? 'node-is-visited' : (isFutureVisible ? 'node-is-future' : 'node-is-past'))}`);
          if (isActive) {
            group.setAttribute('data-stage', s);
            group.setAttribute('data-index', idx);
            group.setAttribute('id', `node_${s}_${idx}`);
            group.style.cursor = 'pointer';
          }

          // Outer radar & glow pulse for ACTIVE nodes
          if (isActive) {
            const radar = document.createElementNS(svgNS, 'circle');
            radar.setAttribute('cx', pos.x); radar.setAttribute('cy', pos.y);
            radar.setAttribute('r', isBossStage ? NODE_R + 10 : NODE_R + 6);
            radar.setAttribute('fill', 'none');
            radar.setAttribute('stroke', vis.color);
            radar.setAttribute('stroke-width', '2');
            radar.classList.add('map-radar-pulse');
            group.appendChild(radar);

            const glow = document.createElementNS(svgNS, 'circle');
            glow.setAttribute('cx', pos.x); glow.setAttribute('cy', pos.y);
            glow.setAttribute('r', isBossStage ? NODE_R + 14 : NODE_R + 9);
            glow.setAttribute('fill', 'none');
            glow.setAttribute('stroke', vis.color);
            glow.setAttribute('stroke-width', '3');
            glow.setAttribute('stroke-dasharray', '5,3');
            glow.setAttribute('opacity', '0.9');
            glow.setAttribute('filter', `url(#glow-active-z${zoneIdx})`);
            group.appendChild(glow);
          }

          // Ground shadow
          const nodeRadiusForShadow = isBossStage ? NODE_R + 8 : NODE_R + 3;
          const shadow = document.createElementNS(svgNS, 'ellipse');
          shadow.setAttribute('cx', pos.x);
          shadow.setAttribute('cy', pos.y + nodeRadiusForShadow * 0.72);
          shadow.setAttribute('rx', nodeRadiusForShadow * 0.85);
          shadow.setAttribute('ry', nodeRadiusForShadow * 0.26);
          shadow.setAttribute('fill', 'rgba(0,0,0,0.5)');
          shadow.style.pointerEvents = 'none';
          group.appendChild(shadow);

          // Outer Border Circle (Black retro ring)
          const outerCircle = document.createElementNS(svgNS, 'circle');
          outerCircle.setAttribute('cx', pos.x); outerCircle.setAttribute('cy', pos.y);
          outerCircle.setAttribute('r', isBossStage ? NODE_R + 8 : NODE_R + 3);
          outerCircle.setAttribute('fill', '#000000');
          outerCircle.setAttribute('stroke', isActive ? vis.color : (isFutureVisible ? 'rgba(255,255,255,0.08)' : (isVisited ? '#10b981' : '#1e293b')));
          outerCircle.setAttribute('stroke-width', isActive ? '2' : '1');
          group.appendChild(outerCircle);

          // Node Main Circle
          const circle = document.createElementNS(svgNS, 'circle');
          circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y);
          circle.setAttribute('r', isBossStage ? NODE_R + 5 : NODE_R);
          circle.setAttribute('class', 'node-circle-main');

          if (isActive) {
            circle.setAttribute('fill', vis.bg);
            circle.setAttribute('stroke', vis.color);
            circle.setAttribute('stroke-width', isBossStage ? '4' : '3');
          } else if (isFutureVisible) {
            // Future inactive node: Dark slate background + dimmed muted border
            circle.setAttribute('fill', isBossStage ? '#181206' : '#0a101d');
            circle.setAttribute('stroke', isBossStage ? '#854d0e' : (vis.color || '#38bdf8'));
            circle.setAttribute('stroke-opacity', isBossStage ? '0.6' : '0.35');
            circle.setAttribute('stroke-width', isBossStage ? '2.5' : '1.5');
            circle.setAttribute('stroke-dasharray', '4,3');
          } else if (isVisited) {
            // Visited node: Dark green tint + emerald border
            circle.setAttribute('fill', '#051b11');
            circle.setAttribute('stroke', '#10b981');
            circle.setAttribute('stroke-width', '2');
          } else {
            // Past skipped node: Dark disabled
            circle.setAttribute('fill', '#070a10');
            circle.setAttribute('stroke', '#1e293b');
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('opacity', '0.4');
          }
          group.appendChild(circle);

          // Glossy highlight sheen
          const sheenR = isBossStage ? NODE_R + 5 : NODE_R;
          const sheen = document.createElementNS(svgNS, 'ellipse');
          sheen.setAttribute('cx', pos.x - sheenR * 0.32);
          sheen.setAttribute('cy', pos.y - sheenR * 0.38);
          sheen.setAttribute('rx', sheenR * 0.55);
          sheen.setAttribute('ry', sheenR * 0.32);
          sheen.setAttribute('fill', 'rgba(255,255,255,0.25)');
          sheen.setAttribute('opacity', isActive ? '1' : (isFutureVisible ? '0.12' : (isVisited ? '0.2' : '0.05')));
          sheen.style.pointerEvents = 'none';
          group.appendChild(sheen);

          // Node Font Awesome Icon
          const iconSize = isBossStage ? 26 : 14;
          const foSize   = isBossStage ? 48 : 32;
          
          let iconColor, iconOpacity;
          if (isActive) {
            iconColor = vis.color;
            iconOpacity = '1.0';
          } else if (isVisited) {
            iconColor = '#10b981';
            iconOpacity = '0.85';
          } else if (isFutureVisible) {
            // Inactive future: muted icon
            iconColor = isBossStage ? '#a16207' : (vis.color || '#64748b');
            iconOpacity = '0.45';
          } else {
            iconColor = '#334155';
            iconOpacity = '0.25';
          }

          const fo = document.createElementNS(svgNS, 'foreignObject');
          fo.setAttribute('x', pos.x - foSize / 2);
          fo.setAttribute('y', pos.y - foSize / 2);
          fo.setAttribute('width', foSize);
          fo.setAttribute('height', foSize);
          fo.style.pointerEvents = 'none';

          const iconHtml = isVisited
            ? `<i class="fa-solid fa-check" style="color:#10b981;font-size:${iconSize}px;"></i>`
            : `<i class="${vis.iconClass}"></i>`;

          fo.innerHTML = `
            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${iconColor};opacity:${iconOpacity};font-size:${iconSize}px;filter:${isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' : 'none'};">
              ${iconHtml}
            </div>
          `;
          group.appendChild(fo);

          // Node type label below
          const lbl = document.createElementNS(svgNS, 'text');
          lbl.setAttribute('x', pos.x); 
          lbl.setAttribute('y', pos.y + (isBossStage ? NODE_R + 20 : NODE_R + 15));
          lbl.setAttribute('text-anchor', 'middle');
          lbl.setAttribute('font-family', "'VT323', monospace");
          lbl.setAttribute('font-size', isMobileMap ? '8' : '14');

          if (isActive) {
            lbl.setAttribute('fill', vis.color);
            lbl.setAttribute('font-weight', 'bold');
            lbl.style.filter = `drop-shadow(0 0 6px ${vis.color}88)`;
          } else if (isVisited) {
            lbl.setAttribute('fill', '#10b981');
            lbl.setAttribute('font-weight', 'bold');
            lbl.setAttribute('opacity', '0.65');
          } else if (isFutureVisible) {
            // Future label: clean muted slate
            lbl.setAttribute('fill', isBossStage ? '#ca8a04' : '#64748b');
            lbl.setAttribute('font-weight', 'normal');
            lbl.setAttribute('opacity', '0.75');
          } else {
            lbl.setAttribute('fill', '#334155');
            lbl.setAttribute('opacity', '0.25');
          }

          const rawLabel = node.label || vis.label;
          let translatedLabel = rawLabel;
          if (rawLabel === 'SERIE CLÁSICA' || node.type === 'match') translatedLabel = t('map.node_classic', 'CLASSIC SERIES');
          else if (rawLabel === 'MID-BOSS' || node.type === 'mid_boss') translatedLabel = t('map.node_mid_boss', 'MID-BOSS');
          else if (rawLabel === 'TRADE' || node.type === 'trade') translatedLabel = t('map.node_trade', 'TRADE DEADLINE');
          else if (rawLabel === 'FIRMA LEYENDA' || node.type === 'draft') translatedLabel = t('draft.midrun_title_short', 'LEGEND SIGN');
          else if (rawLabel === 'DECISIÓN' || node.type === 'event') translatedLabel = t('map.node_decision', 'DECISION');
          else if (rawLabel === 'JAULA BATEO' || node.type === 'train') translatedLabel = t('map.node_cage', 'BATTING CAGE');
          else if (rawLabel === 'CASA CLUB' || node.type === 'rest') translatedLabel = t('map.node_clubhouse', 'CLUBHOUSE');
          else if (rawLabel === 'COFRE' || node.type === 'chest') translatedLabel = t('map.node_chest', 'CHEST');
          else if (rawLabel === 'LUCK' || node.type === 'gamble') translatedLabel = t('map.node_gamble', 'LUCK');
          else if (rawLabel === 'JUEGO APERTURA') translatedLabel = t('map.node_opener', 'OPENER');
          else if (rawLabel === 'ALL-STAR GAME') translatedLabel = 'ALL-STAR GAME';
          else if (rawLabel === 'CAMPEÓN LIGA') translatedLabel = t('map.node_pennant', 'LEAGUE CHAMPION');
          else if (rawLabel === 'SERIE MUNDIAL') translatedLabel = t('map.node_world_series', 'WORLD SERIES');
          lbl.textContent = translatedLabel;
          group.appendChild(lbl);

          // Click target for active nodes
          if (isActive) {
            const hit = document.createElementNS(svgNS, 'circle');
            hit.setAttribute('cx', pos.x); hit.setAttribute('cy', pos.y);
            hit.setAttribute('r', isBossStage ? NODE_R + 16 : NODE_R + 12);
            hit.setAttribute('fill', 'transparent');
            hit.style.cursor = 'pointer';
            hit.classList.add('map-node-visual', 'active-path');
            hit.setAttribute('data-stage', s);
            hit.setAttribute('data-index', idx);
            group.appendChild(hit);
          }

          svg.appendChild(group);
        });
      }

      // ── Wrap SVG in canvas div ───────────────────────────────────────
      const zoneCanvas = document.createElement('div');
      zoneCanvas.className = 'zone-canvas';
      zoneCanvas.id = `zone-canvas-${zoneIdx}`;
      zoneCanvas.appendChild(svg);

      zoneWrapper.appendChild(zoneCanvas);
      el.mapContainer.appendChild(zoneWrapper);
    });

    // Auto-scroll map viewport to active zone & active node so the player stays exactly on their route
    setTimeout(() => {
      const mapViewport = document.querySelector('.map-viewport');
      const activeZone = document.querySelector('.zone-wrapper.zone-active');
      if (mapViewport && activeZone) {
        const activeNode = activeZone.querySelector('.map-node-group.node-is-active');
        if (activeNode && typeof activeNode.getBoundingClientRect === 'function') {
          const nodeRect = activeNode.getBoundingClientRect();
          const vpRect = mapViewport.getBoundingClientRect();
          const targetScroll = mapViewport.scrollTop + (nodeRect.top - vpRect.top) - (vpRect.height / 2);
          mapViewport.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        } else {
          activeZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 40);

    showTutorialTip(
      'map-basics', document.getElementById('map-nodes-container'),
      'tutorial.map_basics_title', 'tutorial.map_basics_text', 'bottom'
    );
  }

  // Legacy stub – no longer needed (paths drawn inline with renderMap)
  function drawZonePaths(currentZone) { /* no-op */ }

  // RENDER SIDEBAR SYNERGIES & ITEMS
  function renderSynergiesAndItems() {
    renderActiveItemBonuses();

    // 1. Synergies (Right Sidebar)
    el.synergiesList.innerHTML = "";
    
    const EraSynergyMeta = {
      "The Genesis Era (1871-1900)": {
        name: t('eras.syn_name_genesis', 'Genesis Chaos (1871-1900)'),
        get tiers() { return [t('eras.genesis_d1'), t('eras.genesis_d2'), t('eras.genesis_d3'), t('eras.genesis_d4')]; }
      },
      "Deadball (1901-1919)": {
        name: t('eras.syn_name_deadball', 'Small Ball (1901-1919)'),
        get tiers() { return [t('eras.deadball_d1'), t('eras.deadball_d2'), t('eras.deadball_d3'), t('eras.deadball_d4')]; }
      },
      "Golden Era (1920-1941)": {
        name: t('eras.syn_name_golden', 'Liveball Sluggers (1920-1941)'),
        get tiers() { return [t('eras.golden_d1'), t('eras.golden_d2'), t('eras.golden_d3'), t('eras.golden_d4')]; }
      },
      "Integration (1942-1960)": {
        name: t('eras.syn_name_integration', 'Five-Tool Legends (1942-1960)'),
        get tiers() { return [t('eras.integration_d1'), t('eras.integration_d2'), t('eras.integration_d3'), t('eras.integration_d4')]; }
      },
      "Expansion (1961-1976)": {
        name: t('eras.syn_name_speed', 'Speed & Hustle (1961-1976)'),
        get tiers() { return [t('eras.speed_d1'), t('eras.speed_d2'), t('eras.speed_d3'), t('eras.speed_d4')]; }
      },
      "Big Hair Era (1977-1993)": {
        name: t('eras.syn_name_astroturf', 'AstroTurf Speedsters (1977-1993)'),
        get tiers() { return [t('eras.astroturf_d1'), t('eras.astroturf_d2'), t('eras.astroturf_d3'), t('eras.astroturf_d4')]; }
      },
      "Steroid Era (1994-2005)": {
        name: t('eras.syn_name_steroid', 'Bash Brothers (1994-2005)'),
        get tiers() { return [t('eras.steroid_d1'), t('eras.steroid_d2'), t('eras.steroid_d3'), t('eras.steroid_d4')]; }
      },
      "Efficiency Era (2006-2015)": {
        name: t('eras.syn_name_moneyball', 'Moneyball Analytics (2006-2015)'),
        get tiers() { return [t('eras.moneyball_d1'), t('eras.moneyball_d2'), t('eras.moneyball_d3'), t('eras.moneyball_d4')]; }
      },
      "Modern Era (2016-Pres)": {
        name: t('eras.syn_name_tto', 'Three True Outcomes (2016-Pres)'),
        get tiers() { return [t('eras.tto_d1'), t('eras.tto_d2'), t('eras.tto_d3'), t('eras.tto_d4')]; }
      }
    };

    const eraCounts = {};
    const teamCounts = {};
    
    // Count active roster players
    Object.values(window.Game.roster).forEach(player => {
      if (player && !player.isReplacement) {
        if (player.era && !player.synergyBanned) {
          // Keep in sync with simulation.js's _calculateActiveSynergies — Story
          // Mode inter-era wildcards count double toward their own era's synergy,
          // and synergyWeight overrides that (e.g. a successful "Sinergia Prohibida" gamble sets it to 4).
          const weight = player.synergyWeight || (player.isInterEra ? 2 : 1);
          eraCounts[player.era] = (eraCounts[player.era] || 0) + weight;
        }
        if (player.team && player.team !== 'ROOK') {
          teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
        }
      }
    });

    // Check if new synergy tier unlocked to play uplifting chime
    let currentTotalTiers = 0;
    Object.keys(eraCounts).forEach(era => {
      const count = eraCounts[era] || 0;
      if (count >= 7) currentTotalTiers += 4;
      else if (count >= 5) currentTotalTiers += 3;
      else if (count >= 3) currentTotalTiers += 2;
      else if (count >= 2) currentTotalTiers += 1;
    });
    Object.keys(teamCounts).forEach(tm => {
      if (teamCounts[tm] >= 4) currentTotalTiers += 3;
      else if (teamCounts[tm] === 3) currentTotalTiers += 2;
      else if (teamCounts[tm] === 2) currentTotalTiers += 1;
    });

    if (window.Game && window.Game._lastSynergyTiersCount !== undefined && currentTotalTiers > window.Game._lastSynergyTiersCount) {
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('synergy_tier_up');
      }
    }
    if (window.Game) window.Game._lastSynergyTiersCount = currentTotalTiers;

    // Default: until the player has ever manually set/removed a Build era,
    // auto-preview whichever era currently has the most players in roster.
    if (!window.Game.buildEraTouched) {
      let leadingEra = null, leadingCount = 0;
      Object.keys(eraCounts).forEach(era => {
        if (eraCounts[era] > leadingCount) { leadingCount = eraCounts[era]; leadingEra = era; }
      });
      window.Game.autoAssignBuildEra(leadingEra);
    }

    // A. Render Era Synergies (Render ALL 9 to guide the user)
    const eraListTitle = document.createElement('div');
    eraListTitle.style.cssText = "font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--accent-color); margin-top: 5px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;";
    eraListTitle.innerText = t('eras.header');
    el.synergiesList.appendChild(eraListTitle);

    Object.keys(EraSynergyMeta).forEach(eraName => {
      const meta = EraSynergyMeta[eraName];
      const count = eraCounts[eraName] || 0;
      const tier = window.Game.getEraTier(eraName, count);

      let itemClass = "synergy-list-item";
      if (tier >= 1) {
        itemClass += ` active tier-${tier}`;
      }

      const item = document.createElement('div');
      item.className = itemClass;

      let dotsHTML = "";
      for (let i = 1; i <= 4; i++) {
        const filled = i <= tier ? 'filled' : '';
        dotsHTML += `<span class="synergy-dot ${filled}"></span>`;
      }

      let descHTML;
      if (tier >= 1) {
        const rows = meta.tiers.map((text, idx) => {
          const rowTier = idx + 1;
          let rowClass = 'synergy-tier-row';
          if (rowTier === tier) rowClass += ' tier-current';
          else if (rowTier < tier) rowClass += ' tier-reached';
          return `<div class="${rowClass}"><span class="tier-label">T${rowTier}</span>${text}</div>`;
        }).join('');
        descHTML = `<div class="synergy-tier-breakdown">${rows}</div>`;
      } else {
        descHTML = `<div class="synergy-item-desc" style="font-size: 11px;">${meta.tiers[0]}</div>`;
      }

      const countTag = t('eras.player_count_short', { count });
      item.innerHTML = `
        <div class="synergy-item-header">
          <span class="synergy-item-name">${meta.name}</span>
          <span class="synergy-item-count">T${tier}/T4 (${countTag})</span>
        </div>
        <div class="synergy-progress-dots">
          ${dotsHTML}
        </div>
        ${descHTML}
      `;
      el.synergiesList.appendChild(item);
    });

    // B. Render Franchise Synergies (Only teams with count >= 1)
    const teamListTitle = document.createElement('div');
    teamListTitle.style.cssText = "font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--accent-color); margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;";
    teamListTitle.innerText = t('eras.franchises_header');
    el.synergiesList.appendChild(teamListTitle);

    let hasTeams = false;
    Object.keys(teamCounts).forEach(team => {
      hasTeams = true;
      const count = teamCounts[team];
      const teamName = window.PlayersDB.FranchiseNames[team] || team;
      
      let itemClass = "synergy-list-item";
      if (count >= 4) {
        itemClass += " active-level-2";
      } else if (count >= 3) {
        itemClass += " active tier-2";
      } else if (count >= 2) {
        itemClass += " active";
      }

      const item = document.createElement('div');
      item.className = itemClass;

      let dotsHTML = "";
      for (let i = 1; i <= 4; i++) {
        const filled = i <= count ? 'filled' : '';
        dotsHTML += `<span class="synergy-dot ${filled}"></span>`;
      }

      const desc = count >= 4 
        ? t('sidebar.dynasty_desc', { team: team, defaultValue: `Dinastía (4+): Jugadores de ${team} obtienen +8 a todos sus stats en combate.` })
        : count === 3
        ? t('sidebar.brotherhood_desc', { team: team, defaultValue: `Hermandad (3): Jugadores de ${team} obtienen +6 a todos sus stats en combate.` })
        : count === 2
        ? t('sidebar.chemistry_desc', { team: team, defaultValue: `Química (2): Jugadores de ${team} obtienen +4 a todos sus stats en combate.` })
        : t('sidebar.franchise_base_desc', { team: team, defaultValue: `Recluta 2 o más jugadores de ${team} para activar bonos de franquicia (+4 / +6 / +8 stats).` });

      item.innerHTML = `
        <div class="synergy-item-header">
          <span class="synergy-item-name">${teamName} (${team})</span>
          <span class="synergy-item-count">${count}/4</span>
        </div>
        <div class="synergy-progress-dots">
          ${dotsHTML}
        </div>
        <div class="synergy-item-desc" style="font-size: 11px;">${desc}</div>
      `;
      el.synergiesList.appendChild(item);
    });

    if (!hasTeams) {
      const noneEl = document.createElement('div');
      noneEl.style.cssText = "color: #64748b; font-size: 10px; text-align: center; padding: 5px;";
      noneEl.innerText = t('sidebar.no_teams', 'Ningún equipo registrado.');
      el.synergiesList.appendChild(noneEl);
    }

    // 2. PokeLike Items Grid & Backpack (Left Sidebar - 4 Slots)
    el.purchasedItemsList.innerHTML = "";
    const backpackItems = window.Game.itemsInventory || [];
    const totalSlots = 4;

    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = "display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; width:100%; margin-top:2px;";

    for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
      const it = backpackItems[slotIdx];
      const slotTile = document.createElement('div');
      slotTile.style.cssText = `
        aspect-ratio: 1; min-height: 42px; border-radius: 6px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        position: relative; transition: all 0.15s ease; user-select: none;
      `;

      if (it) {
        const isConsumable = it.isConsumable === true;
        const borderCol = isConsumable ? '#c084fc' : '#38bdf8';
        const bgCol = isConsumable ? 'rgba(192, 132, 252, 0.15)' : 'rgba(56, 189, 248, 0.12)';
        const tagText = isConsumable ? '🧪' : '🎒';
        const typeName = isConsumable ? t('equip.consumable_tag', '🧪 CONSUMIBLE (1 SOLO USO)') : t('equip.equipable_tag', '🎒 EQUIPAMIENTO');

        slotTile.style.background = bgCol;
        slotTile.style.border = `1.5px solid ${borderCol}`;
        slotTile.style.boxShadow = `0 0 8px ${isConsumable ? 'rgba(192,132,252,0.25)' : 'rgba(56,189,248,0.25)'}`;
        slotTile.style.cursor = 'grab';
        slotTile.draggable = true;
        slotTile.title = `${it.name}\n${typeName}\n${it.statDesc || ''}\n(Arrastra a un jugador o haz clic para usar)`;

        slotTile.innerHTML = `
          <span style="font-size: 20px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8)); font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;">${it.icon || '🎒'}</span>
          <span style="position: absolute; top: 2px; right: 2px; font-size: 8px; line-height: 1;">${tagText}</span>
        `;

        // Drag & Drop
        slotTile.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('baserogue-item-index', slotIdx);
          e.dataTransfer.effectAllowed = 'copyMove';
          slotTile.style.opacity = '0.5';
        });

        slotTile.addEventListener('dragend', () => {
          slotTile.style.opacity = '1';
        });

        // Click alternative (modal for mobile / tap)
        slotTile.addEventListener('click', () => {
          showBatterSelectorModal({
            title: `${tagText} ${it.name}`,
            subtitle: isConsumable
              ? t('equip.select_item_to_equip', { player: it.name }) + ` (${typeName})`
              : t('equip.select_item_to_equip', { player: it.name }),
            onSelect: (player, targetSlotKey) => {
              if (isConsumable) {
                window.Game.useConsumableItem(it, targetSlotKey);
                window.Game.itemsInventory.splice(slotIdx, 1);
              } else {
                window.Game.equipItem(slotIdx, targetSlotKey);
              }
              renderActiveRoster();
              renderSynergiesAndItems();
              updateHUD();
            }
          });
        });

        // Hover animations
        slotTile.addEventListener('mouseenter', () => {
          slotTile.style.transform = 'scale(1.08)';
          slotTile.style.borderColor = '#00ff66';
        });
        slotTile.addEventListener('mouseleave', () => {
          slotTile.style.transform = 'scale(1)';
          slotTile.style.borderColor = borderCol;
        });

      } else {
        // Empty slot
        slotTile.style.background = 'rgba(255, 255, 255, 0.02)';
        slotTile.style.border = '1px dashed rgba(255, 255, 255, 0.12)';
        slotTile.innerHTML = `<span style="font-size: 10px; color: rgba(255,255,255,0.15);">•</span>`;
      }

      gridContainer.appendChild(slotTile);
    }

    el.purchasedItemsList.appendChild(gridContainer);

    // Clean Run Log Button below 4-slot grid
    const btnRunLog = document.createElement('button');
    btnRunLog.style.cssText = "width:100%; margin-top:8px; padding:6px; font-family:'Press Start 2P',monospace; font-size:7px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); border-radius:4px; color:#94a3b8; cursor:pointer; transition:all 0.15s ease; display:flex; align-items:center; justify-content:center; gap:6px;";
    btnRunLog.innerHTML = `<span>📜</span> <span>${typeof t === 'function' ? t('gamble.btn_view_log', '📜 REGISTRO DE RUN') : '📜 REGISTRO DE RUN'}</span>`;
    btnRunLog.addEventListener('mouseenter', () => {
      btnRunLog.style.background = 'rgba(255,255,255,0.08)';
      btnRunLog.style.color = '#fff';
      btnRunLog.style.borderColor = 'rgba(255,255,255,0.25)';
    });
    btnRunLog.addEventListener('mouseleave', () => {
      btnRunLog.style.background = 'rgba(255,255,255,0.04)';
      btnRunLog.style.color = '#94a3b8';
      btnRunLog.style.borderColor = 'rgba(255,255,255,0.12)';
    });
    btnRunLog.addEventListener('click', () => {
      showRunLogModal();
    });

    el.purchasedItemsList.appendChild(btnRunLog);
  }

  // ── RUN LOG MODAL ────────────────────────────────────────────────────────
  function showRunLogModal() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:920;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease-out;';

    const history = (window.Game && window.Game.runNodeHistory && window.Game.runNodeHistory.length > 0)
      ? window.Game.runNodeHistory
      : (window.Game && window.Game.purchasedItems && window.Game.purchasedItems.length > 0 ? window.Game.purchasedItems.map(p => ({ title: p, icon: '📜', status: 'info' })) : []);

    const isEN = (typeof i18next !== 'undefined' && i18next.language === 'en');
    const logTitle = typeof t === 'function' ? t('gamble.log_modal_title', '📜 HISTORIAL DE LA RUN') : '📜 HISTORIAL DE LA RUN';
    const emptyText = typeof t === 'function' ? t('gamble.log_empty', 'Aún no hay eventos registrados en esta run.') : 'Aún no hay eventos registrados en esta run.';

    let listHTML = '';
    if (history.length === 0) {
      listHTML = `<div style="text-align:center;color:#64748b;font-size:11px;padding:24px 0;font-family:'VT323',monospace;font-size:18px;">${emptyText}</div>`;
    } else {
      listHTML = history.slice().reverse().map((entry, idx) => {
        const itemNum = history.length - idx;
        const stageText = entry.stage ? (isEN ? `Stage ${entry.stage}` : `Etapa ${entry.stage}`) : '';
        const nodeText = (entry.nodeIndex !== undefined) ? (isEN ? `Node #${entry.nodeIndex + 1}` : `Nodo #${entry.nodeIndex + 1}`) : '';
        const headerBadge = [stageText, nodeText].filter(Boolean).join(' · ');

        let statusBorder = 'rgba(255,255,255,0.1)';
        let statusBg = 'rgba(255,255,255,0.03)';
        if (entry.status === 'success') {
          statusBorder = 'rgba(16,185,129,0.4)';
          statusBg = 'rgba(16,185,129,0.06)';
        } else if (entry.status === 'danger') {
          statusBorder = 'rgba(239,68,68,0.4)';
          statusBg = 'rgba(239,68,68,0.06)';
        } else if (entry.status === 'info') {
          statusBorder = 'rgba(56,189,248,0.4)';
          statusBg = 'rgba(56,189,248,0.06)';
        }

        const title = isEN ? (entry.titleEN || entry.title) : entry.title;
        const desc = isEN ? (entry.descEN || entry.desc) : entry.desc;

        return `
          <div style="display:flex;gap:12px;padding:10px 12px;background:${statusBg};border:1px solid ${statusBorder};border-radius:8px;margin-bottom:8px;align-items:flex-start;">
            <div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${entry.icon || '⚾'}</div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:6px;">
                <span style="font-family:'Press Start 2P',monospace;font-size:7.5px;color:#f59e0b;">#${itemNum} ${headerBadge ? `(${headerBadge})` : ''}</span>
              </div>
              <div style="font-weight:bold;font-size:12px;color:#fff;font-family:'Outfit',sans-serif;line-height:1.3;margin-bottom:${desc ? '3px' : '0'};">
                ${title}
              </div>
              ${desc ? `<div style="font-size:10.5px;color:#94a3b8;font-family:'Outfit',sans-serif;line-height:1.4;">${desc}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    overlay.innerHTML = `
      <div style="background:#0b0f19;border:2px solid rgba(250,204,21,0.4);box-shadow:0 0 35px rgba(0,0,0,0.8);border-radius:14px;padding:22px;max-width:500px;width:92%;max-height:82vh;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;">
          <h3 style="font-family:'Press Start 2P',monospace;font-size:11px;color:#facc15;margin:0;">${logTitle}</h3>
          <button id="btn-close-run-log-modal" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;"><i class="fa-solid fa-times"></i></button>
        </div>
        <div style="overflow-y:auto;flex:1;padding-right:4px;max-height:400px;">
          ${listHTML}
        </div>
        <button id="btn-ok-run-log-modal" class="btn" style="margin-top:14px;width:100%;font-family:'Press Start 2P',monospace;font-size:9.5px;padding:10px;">
          OK
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeLog = () => overlay.remove();
    overlay.querySelector('#btn-close-run-log-modal').addEventListener('click', closeLog);
    overlay.querySelector('#btn-ok-run-log-modal').addEventListener('click', closeLog);
  }

  function getDraftSynergyPrediction(player) {
    const eraCounts = {};
    const teamCounts = {};
    Object.values(window.Game.roster).forEach(p => {
      if (p && !p.isReplacement) {
        if (p.era) eraCounts[p.era] = (eraCounts[p.era] || 0) + 1;
        if (p.team && p.team !== 'ROOK') teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
      }
    });

    const currentEraCount = eraCounts[player.era] || 0;
    const newEraCount = currentEraCount + 1;
    const currentTeamCount = teamCounts[player.team] || 0;

    let predictionText = "";

    // Era synergy impact
    const eraShort = getShortEraName(player.era);
    const currentTier = window.Game.getEraTier(player.era, currentEraCount);
    const newTier = window.Game.getEraTier(player.era, newEraCount);

    if (newTier > currentTier) {
      predictionText += (typeof t === 'function' ? t('sign.synergy_active', { era: eraShort, tier: newTier, defaultValue: `Signing activates <strong>${eraShort} (T${newTier})</strong> Synergy!` }) : `Signing activates <strong>${eraShort} (T${newTier})</strong> Synergy!`) + '<br>';
    } else {
      const nextTarget = newTier === 0 ? 2 : newTier === 1 ? (window.Game.hasTrait('era_accelerated') ? 2 : 4) : newTier === 2 ? 6 : 8;
      if (newTier < 4) {
        predictionText += (typeof t === 'function' ? t('sign.era_progress', { era: eraShort, count: newEraCount, target: nextTarget, tier: newTier, defaultValue: `Era ${eraShort}: <strong>${newEraCount}/${nextTarget}</strong> (T${newTier})` }) : `Era ${eraShort}: <strong>${newEraCount}/${nextTarget}</strong> (T${newTier})`) + '<br>';
      } else {
        predictionText += (typeof t === 'function' ? t('sign.era_max', { era: eraShort, count: newEraCount, defaultValue: `Era ${eraShort}: ${newEraCount} players (T4 MAX)` }) : `Era ${eraShort}: ${newEraCount} players (T4 MAX)`) + '<br>';
      }
    }

    // Team synergy impact
    if (player.team && player.team !== 'ROOK') {
      const teamShort = player.team;
      if (currentTeamCount === 1) {
        predictionText += (typeof t === 'function' ? t('sign.chemistry_active', { team: teamShort, defaultValue: `Signing activates <strong>${teamShort}</strong> Chemistry (+4 stats)` }) : `Signing activates <strong>${teamShort}</strong> Chemistry (+4 stats)`);
      } else if (currentTeamCount === 2) {
        predictionText += (typeof t === 'function' ? t('sign.brotherhood_active', { team: teamShort, defaultValue: `Signing activates <strong>${teamShort}</strong> Brotherhood (+6 stats)` }) : `Signing activates <strong>${teamShort}</strong> Brotherhood (+6 stats)`);
      } else if (currentTeamCount === 3) {
        predictionText += (typeof t === 'function' ? t('sign.dynasty_active', { team: teamShort, defaultValue: `Signing activates <strong>${teamShort}</strong> Dynasty (+8 stats)` }) : `Signing activates <strong>${teamShort}</strong> Dynasty (+8 stats)`);
      } else {
        const next = Math.min(4, currentTeamCount + 1);
        predictionText += (typeof t === 'function' ? t('sign.franchise_progress', { team: teamShort, count: currentTeamCount, next: next, defaultValue: `Franchise ${teamShort}: ${currentTeamCount} ➡️ <strong>${next}/4</strong>` }) : `Franchise ${teamShort}: ${currentTeamCount} ➡️ <strong>${next}/4</strong>`);
      }
    }

    return predictionText;
  }

  function getPlayerSignCost(player) {
    const r = player ? (player.rarity || 'Common') : 'Common';
    if (r === 'Legendary') return 50;
    if (r === 'Epic') return 35;
    if (r === 'Rare') return 20;
    if (r === 'Uncommon') return 10;
    return 5;
  }

  // DRAFT SCREEN GENERATOR
  function setupDraftPickScreen() {
    let pool = el.draftOptionsRow || el.starterPool || document.getElementById('starter-selection-pool') || document.getElementById('draft-options-row');
    if (pool) {
      pool.innerHTML = "";
      pool.className = 'midrun-draft-options flex flex-col md:flex-row justify-center items-center md:items-start gap-4 w-full max-w-[1100px] mx-auto py-3';
      pool.style.cssText = '';
    }
    
    const titleEl = el.screenDraft.querySelector('h2');
    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-file-signature"></i> ` + (typeof t === 'function' ? t('draft.title', 'Player Signings') : 'Player Signings');
    }
    const descEl = el.screenDraft.querySelector('p');
    if (descEl) {
      descEl.style.display = 'block';
      descEl.innerText = t('draft.midrun_desc');
    }

    const options = window.Game.getDraftPicks();

    options.forEach(player => {
      const cardHTML = createCardHTML(player);
      const predictionText = getDraftSynergyPrediction(player);
      const cardCol = document.createElement('div');
      cardCol.className = "draft-card-option flex flex-col items-center gap-2 w-[175px] max-w-[175px] box-border";
      
      const cost = getPlayerSignCost(player);
      const canAfford = (window.Game.budget || 0) >= cost;

      const btnSign = document.createElement('button');
      if (canAfford) {
        btnSign.className = "btn";
        btnSign.innerHTML = t('draft.sign_btn', { cost: cost });
      } else {
        btnSign.className = "btn btn-secondary";
        btnSign.style.opacity = "0.5";
        btnSign.style.cursor = "not-allowed";
        btnSign.innerHTML = t('draft.insufficient_funds', { cost: cost });
      }

      btnSign.addEventListener('click', () => {
        if (!canAfford) {
          alert(t('draft.legend_no_budget', { cost: cost, budget: window.Game.budget }));
          return;
        }

        player._signCost = cost;
        const res = window.Game.addPlayerToRoster(player);
        if (res.success) {
          if (window.AudioManager && typeof window.AudioManager.play === 'function') {
            window.AudioManager.play('money');
            window.AudioManager.play('draft_pick');
          }
          window.Game.budget = Math.max(0, (window.Game.budget || 0) - cost);
          delete player._signCost;
          if (window.Game && typeof window.Game.logRunNode === 'function') {
            window.Game.logRunNode({
              type: 'draft',
              icon: '✍️',
              title: `Firma: ${player.name} (${player.pos} · ${player.rarity})`,
              titleEN: `Signed: ${player.name} (${player.pos} · ${player.rarity})`,
              desc: `Costo: $${cost}`,
              descEN: `Cost: $${cost}`,
              status: 'info'
            });
          }
          alert(res.message + t('draft.signed_cost_suffix', { cost: cost }));
          renderActiveRoster();
          renderSynergiesAndItems();
          updateHUD();
          closeNodeCompleted();
        } else {
          // Roster full: trigger Swap Modal
          currentDraftSelection = player;
          el.swapNewPlayerName.innerHTML = t('draft.swap_new_player', { name: `<span style="color:var(--primary-color);">${player.name}</span>` });
          populateSwapModalOptions(player);
        }
      });

      const rColor = RARITY_COLORS[player.rarity] || RARITY_COLORS.Common;
      const ovr    = getPlayerOvr(player);

      cardCol.innerHTML = `
        <div>${cardHTML}</div>
        <div class="draft-card-caption" style="text-align:center;width:100%;margin-top:2px;">
          <div style="font-size:10px;color:${rColor};font-weight:bold;">${player.rarity}</div>
          <div style="font-size:9.5px;color:#9ca3af;text-align:center;margin-top:2px;font-family:'Press Start 2P',monospace;">${player.pos} • OVR ${ovr}</div>
        </div>
        <div style="font-size:10px; color:#f59e0b; font-weight:bold; margin-top:4px; text-align:center; font-family:'Press Start 2P',monospace;">${typeof t === 'function' ? t('draft.cost_label', { cost: cost, defaultValue: `Cost: $${cost}` }) : `Cost: $${cost}`}</div>
        <div class="draft-synergy-helper">${predictionText}</div>
      `;
      cardCol.appendChild(btnSign);
      el.draftOptionsRow.appendChild(cardCol);
    });

    // Add a "Rechazar Firma" button option
    const skipCol = document.createElement('div');
    skipCol.className = "draft-card-option flex flex-col justify-center items-center border-2 border-dashed border-white/15 p-4 rounded-xl w-[175px] max-w-[175px] min-h-[310px] box-border";

    const btnSkip = document.createElement('button');
    btnSkip.className = "btn btn-secondary";
    btnSkip.style.width = "100%";
    btnSkip.innerHTML = t('draft.decline_btn');
    btnSkip.addEventListener('click', () => {
      if (window.Game && typeof window.Game.logRunNode === 'function') {
        window.Game.logRunNode({
          type: 'draft_skip',
          icon: '🚪',
          title: `Firma Declinada`,
          titleEN: `Signing Declined`,
          desc: `Decidiste no contratar a ningún jugador`,
          descEN: `Chose not to sign any player`,
          status: 'neutral'
        });
      }
      closeNodeCompleted();
    });

    skipCol.innerHTML = `
      <div style="font-size:44px;color:rgba(255,255,255,0.2);margin-bottom:16px;">
        <i class="fa-solid fa-hand"></i>
      </div>
      <p style="font-size:11px;color:#9ca3af;text-align:center;margin-bottom:16px;line-height:1.4;">
        ${t('draft.decline_desc')}
      </p>
    `;
    skipCol.appendChild(btnSkip);
    el.draftOptionsRow.appendChild(skipCol);

    (window.showScreen || showScreen)('screen-draft');
  }

  // POST-MATCH DRAFT SCREEN GENERATOR
  function setupPostMatchDraftScreen(isBoss = false, earnings = 0) {
    let pool = el.draftOptionsRow || el.starterPool || document.getElementById('starter-selection-pool') || document.getElementById('draft-options-row');
    if (pool) {
      pool.innerHTML = "";
      pool.className = 'midrun-draft-options flex flex-col md:flex-row justify-center items-center md:items-start gap-4 w-full max-w-[1100px] mx-auto py-3';
      pool.style.cssText = '';
    }
    
    const titleEl = el.screenDraft.querySelector('h2');
    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-file-signature"></i> ` + t('draft.title');
    }
    const descEl = el.screenDraft.querySelector('p');
    if (descEl) {
      descEl.style.display = 'block';
      descEl.innerText = t('draft.midrun_desc');
    }

    const options = window.Game.getPostMatchDraftPicks(isBoss);

    options.forEach(player => {
      const cardHTML = createCardHTML(player);
      const predictionText = getDraftSynergyPrediction(player);
      const cardCol = document.createElement('div');
      cardCol.className = "draft-card-option flex flex-col items-center gap-2 w-[175px] max-w-[175px] box-border";
      
      const btnSign = document.createElement('button');
      btnSign.className = "btn";
      btnSign.innerHTML = t('draft.sign_btn', { cost: 0 });
      btnSign.addEventListener('click', () => {
        currentDraftSelection = player;
        el.swapNewPlayerName.innerHTML = t('draft.swap_new_player', { name: `<span style="color:var(--primary-color);">${player.name}</span>` });
        populateSwapModalOptions(player);
      });

      const rColor = RARITY_COLORS[player.rarity] || RARITY_COLORS.Common;
      const ovr    = getPlayerOvr(player);

      cardCol.innerHTML = `
        <div>${cardHTML}</div>
        <div class="draft-card-caption" style="text-align:center;width:100%;margin-top:2px;">
          <div style="font-size:10px;color:${rColor};font-weight:bold;">${player.rarity}</div>
          <div style="font-size:9.5px;color:#9ca3af;text-align:center;margin-top:2px;font-family:'Press Start 2P',monospace;">${player.pos} • OVR ${ovr}</div>
        </div>
        <div class="draft-synergy-helper">${predictionText}</div>
      `;
      cardCol.appendChild(btnSign);
      el.draftOptionsRow.appendChild(cardCol);
    });

    // Add a "Skip Draft" button to let the player skip post-match draft
    const skipCol = document.createElement('div');
    skipCol.className = "draft-card-option flex flex-col justify-center items-center border-2 border-dashed border-white/15 p-4 rounded-xl w-[175px] max-w-[175px] min-h-[310px] box-border";

    const btnSkip = document.createElement('button');
    btnSkip.className = "btn btn-secondary";
    btnSkip.style.width = "100%";
    btnSkip.innerHTML = t('draft.decline_btn');
    btnSkip.addEventListener('click', () => {
      closeNodeCompleted();
    });

    skipCol.innerHTML = `
      <div style="font-size:48px;color:rgba(255,255,255,0.15);margin-bottom:20px;">
        <i class="fa-solid fa-forward"></i>
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin-bottom:20px;">
        ${t('draft.decline_desc')}
      </p>
    `;
    skipCol.appendChild(btnSkip);
    el.draftOptionsRow.appendChild(skipCol);

    (window.showScreen || showScreen)('screen-draft');
  }

  // Populates full roster Swap Modal (Direct active roster replacement since no bench exists)
  function populateSwapModalOptions(newPlayer) {
    el.modalSwapList.innerHTML = "";
    
    // Add active roster positions
    const activeSlots = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    activeSlots.forEach(slot => {
      const player = window.Game.roster[slot];
      if (player) {
        const nodesLeft = window.Game.positionLocks ? (window.Game.positionLocks[slot] || 0) : 0;
        const locked = nodesLeft > 0;
        const item = document.createElement('div');
        item.className = "swap-bench-item";
        const lockText = typeof t === 'function' ? t('draft.locked_slot', { count: nodesLeft, defaultValue: `🔒 locked (${nodesLeft} nodes)` }) : `🔒 locked (${nodesLeft} nodes)`;
        const lockTitle = typeof t === 'function' ? t('draft.locked_title', 'Position locked by a failed gamble') : 'Position locked by a failed gamble';
        const replaceText = typeof t === 'function' ? t('draft.replace_btn', 'RELEASE') : 'RELEASE';

        item.innerHTML = `
          <div><strong>[${slot}]</strong> ${player.name} (${player.pos} | ${player.rarity})${locked ? ` <span style="color:#ef4444;font-size:10px;">${lockText}</span>` : ''}</div>
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size:11px; background:${locked ? '#334155' : '#ef4444'};" data-replace-slot="${slot}" ${locked ? `disabled title="${lockTitle}"` : ''}>${replaceText}</button>
        `;
        el.modalSwapList.appendChild(item);
      }
    });

    el.modalSwap.classList.remove('hidden');
  }

  // MANAGER DECISION EVENT / EQUIPMENT WORKSHOP SCREEN SETUP (STORE OVERHAUL)
  function setupManagerEventScreen() {
    const event = window.Game.getRandomEvent();
    el.eventTitle.innerHTML = `<span style="font-size:28px;margin-right:10px;filter:drop-shadow(0 0 10px rgba(250,204,21,0.5));">${event.icon || '🛠️'}</span>${event.title}`;
    el.eventDesc.innerText = event.desc;
    el.eventChoicesContainer.innerHTML = "";
    el.eventChoicesContainer.className = "event-store-grid";

    // If it's a 20-Item system event
    if (event.safeOption && event.riskyOption) {
      const isConsumable = event.safeOption.isConsumable === true;
      const typeTag = isConsumable 
        ? (typeof t === 'function' ? t('equip.consumable_tag', '🧪 CONSUMIBLE (1 SOLO USO)') : '🧪 CONSUMIBLE (1 SOLO USO)')
        : (typeof t === 'function' ? t('equip.equipable_tag', '🎒 EQUIPAMIENTO PERMANENTE') : '🎒 EQUIPAMIENTO PERMANENTE');

      // ── CARD 1: SAFE OPTION ─────────────────────────────────────────────
      const safeCard = document.createElement('div');
      safeCard.className = 'event-store-card event-store-card-safe';
      const safeAffordable = (window.Game.budget || 0) >= event.safeOption.cost;

      safeCard.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-family:'Press Start 2P',monospace; font-size:8px; color:#10b981; background:rgba(16,185,129,0.15); border:1px solid #10b981; padding:3px 8px; border-radius:12px;">
              ${typeof t === 'function' ? t('equip.store_safe_card_title', '🟢 COMPRA SEGURA (100%)') : '🟢 COMPRA SEGURA (100%)'}
            </span>
            <span style="font-family:'Press Start 2P',monospace; font-size:12px; color:#f59e0b; font-weight:bold;">
              $${event.safeOption.cost}
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div style="font-size:36px; line-height:1; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6));">${event.safeOption.icon || '🎒'}</div>
            <div>
              <div style="font-weight:bold; font-size:14px; color:#fff; font-family:'Outfit', sans-serif;">${event.safeOption.name}</div>
              <div style="font-size:10px; color:#38bdf8; font-weight:bold; margin-top:2px;">${typeTag}</div>
            </div>
          </div>

          <div style="padding:10px; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:8px; margin-bottom:14px;">
            <div style="font-size:13px; font-weight:bold; color:#00ff66; font-family:'Press Start 2P',monospace;">
              ${event.safeOption.statDesc}
            </div>
            <div style="font-size:10.5px; color:#94a3b8; margin-top:4px; line-height:1.4;">
              ${typeof t === 'function' ? t('equip.store_safe_card_desc', 'Compra inmediata sin riesgos. Se guarda en tu mochila de ITEMS.') : 'Compra inmediata sin riesgos. Se guarda en tu mochila de ITEMS.'}
            </div>
          </div>
        </div>

        <button class="btn" id="btn-buy-safe-item" style="background:#10b981; color:#000; font-weight:bold; font-family:'Press Start 2P',monospace; font-size:9.5px; padding:12px; width:100%; border:none;" ${!safeAffordable ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          ${!safeAffordable ? (typeof t === 'function' ? t('draft.insufficient_funds', { cost: event.safeOption.cost }) : 'SIN FONDOS') : (typeof t === 'function' ? t('equip.store_btn_buy_safe', { cost: event.safeOption.cost }) : `COMPRAR POR $${event.safeOption.cost}`)}
        </button>
      `;

      safeCard.querySelector('#btn-buy-safe-item').addEventListener('click', () => {
        if (!safeAffordable) return;
        if (window.AudioManager && typeof window.AudioManager.play === 'function') {
          window.AudioManager.play('money');
        }
        window.Game.budget = Math.max(0, window.Game.budget - event.safeOption.cost);

        if (!window.Game.itemsInventory) window.Game.itemsInventory = [];
        window.Game.itemsInventory.push(event.safeOption);
        window.Game.purchasedItems.push(`${event.safeOption.name} (${event.safeOption.statDesc})`);

        if (window.Game && typeof window.Game.logRunNode === 'function') {
          window.Game.logRunNode({
            type: 'store',
            icon: event.safeOption.icon || '🎒',
            title: `Comprado: ${event.safeOption.name}`,
            titleEN: `Purchased: ${event.safeOption.name}`,
            desc: `${event.safeOption.statDesc} (-$${event.safeOption.cost})`,
            descEN: `${event.safeOption.statDesc} (-$${event.safeOption.cost})`,
            status: 'info'
          });
        }

        renderActiveRoster();
        renderSynergiesAndItems();
        updateHUD();

        const resultDesc = isConsumable
          ? `¡${event.safeOption.name} guardado en tu panel de ITEMS! Es de 1 SOLO USO: arrástralo sobre cualquier jugador para consumirlo.`
          : `¡${event.safeOption.name} guardado en tu panel de ITEMS! Arrástralo a cualquier jugador de tu alineación para equiparlo.`;

        showRetroResultModal({
          title: event.safeOption.name,
          badgeText: typeof t === 'function' ? t('equip.result_safe_buy_title', '🎉 ¡EQUIPAMIENTO ADQUIRIDO!') : '🎉 ¡EQUIPAMIENTO ADQUIRIDO!',
          badgeColor: '#10b981',
          icon: event.safeOption.icon || '🎒',
          desc: resultDesc,
          onClose: () => closeNodeCompleted()
        });
      });

      el.eventChoicesContainer.appendChild(safeCard);

      // ── CARD 2: RISKY OPTION (BATTING CAGE TEST) ───────────────────────
      const riskyCard = document.createElement('div');
      riskyCard.className = 'event-store-card event-store-card-risky';
      const riskyAffordable = (window.Game.budget || 0) >= event.riskyOption.cost;

      riskyCard.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-family:'Press Start 2P',monospace; font-size:8px; color:#ef4444; background:rgba(239,68,68,0.15); border:1px solid #ef4444; padding:3px 8px; border-radius:12px;">
              ${typeof t === 'function' ? t('equip.store_risky_card_title', '🔴 JAULA DE PRUEBAS (60% RIESGO)') : '🔴 JAULA DE PRUEBAS (60% RIESGO)'}
            </span>
            <span style="font-family:'Press Start 2P',monospace; font-size:12px; color:#f59e0b; font-weight:bold;">
              $${event.riskyOption.cost}
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div style="font-size:36px; line-height:1; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6));">${event.riskyOption.icon || '🔥'}</div>
            <div>
              <div style="font-weight:bold; font-size:14px; color:#fff; font-family:'Outfit', sans-serif;">${event.riskyOption.name}</div>
              <div style="font-size:10px; color:#f59e0b; font-weight:bold; margin-top:2px;">✨ VERSIÓN LEGENDARIA</div>
            </div>
          </div>

          <div style="padding:10px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; margin-bottom:14px;">
            <div style="font-size:12px; font-weight:bold; color:#f59e0b; font-family:'Press Start 2P',monospace;">
              🏆 ${event.riskyOption.statDesc}
            </div>
            <div style="font-size:10px; color:#ef4444; margin-top:6px; font-weight:bold; line-height:1.4;">
              ❌ 40% FALLO: El bateador probado sufre -${event.riskyOption.failStaminaCost || 35} Stamina.
            </div>
          </div>
        </div>

        <button class="btn" id="btn-test-risky-item" style="background:#ef4444; color:#fff; font-weight:bold; font-family:'Press Start 2P',monospace; font-size:9.5px; padding:12px; width:100%; border:none; box-shadow:0 0 15px rgba(239,68,68,0.4);" ${!riskyAffordable ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          ${!riskyAffordable ? (typeof t === 'function' ? t('draft.insufficient_funds', { cost: event.riskyOption.cost }) : 'SIN FONDOS') : (typeof t === 'function' ? t('equip.store_btn_test_risky', { cost: event.riskyOption.cost }) : `PROBAR PROTOTIPO ($${event.riskyOption.cost})`)}
        </button>
      `;

      riskyCard.querySelector('#btn-test-risky-item').addEventListener('click', () => {
        if (!riskyAffordable) return;
        showBatterSelectorModal({
          title: `⚾ ${event.riskyOption.name}`,
          subtitle: typeof t === 'function' ? t('equip.test_cage_desc', 'Selecciona qué bateador entrará a la jaula de pruebas para este prototipo:') : 'Selecciona qué bateador entrará a la jaula de pruebas para este prototipo:',
          onSelect: (player, slotKey) => {
            if (window.AudioManager && typeof window.AudioManager.play === 'function') {
              window.AudioManager.play('money');
            }
            window.Game.budget = Math.max(0, window.Game.budget - event.riskyOption.cost);
            const chance = event.riskyOption.successChance || 0.60;
            const isSuccess = Math.random() <= chance;

            const resolveRiskyChoice = () => {
              let title, badgeText, badgeColor, icon, desc;

              if (isSuccess) {
                if (event.riskyOption.isConsumable) {
                  window.Game.useConsumableItem(event.riskyOption, slotKey);
                } else {
                  if (player.equipped_item) {
                    if (!window.Game.itemsInventory) window.Game.itemsInventory = [];
                    window.Game.itemsInventory.push(player.equipped_item);
                  }
                  player.equipped_item = event.riskyOption;
                }

                window.Game.purchasedItems.push(`${event.riskyOption.name} (${event.riskyOption.statDesc})`);

                title = event.riskyOption.name;
                badgeText = typeof t === 'function' ? t('equip.result_cage_success_title', '🏆 ¡PROTOTIPO LEGENDARIO DESBLOQUEADO!') : '🏆 ¡PROTOTIPO LEGENDARIO DESBLOQUEADO!';
                badgeColor = '#10b981';
                icon = event.riskyOption.icon || '🏆';
                desc = event.riskyOption.successMsg || `¡Prueba magistral! ${player.name} domina el prototipo legendario (${event.riskyOption.statDesc}).`;
                if (window.Game && typeof window.Game.logRunNode === 'function') {
                  window.Game.logRunNode({
                    type: 'store_test',
                    icon: '🏆',
                    title: `Jaula de Pruebas: ÉXITO (${player.name})`,
                    titleEN: `Batting Cage: SUCCESS (${player.name})`,
                    desc: `${event.riskyOption.name} - ${event.riskyOption.statDesc}`,
                    descEN: `${event.riskyOption.name} - ${event.riskyOption.statDesc}`,
                    status: 'success'
                  });
                }
              } else {
                const failCost = event.riskyOption.failStaminaCost || 35;
                player.stamina = Math.max(0, (player.stamina !== undefined ? player.stamina : 100) - failCost);

                title = event.riskyOption.name;
                badgeText = typeof t === 'function' ? t('equip.result_cage_fail_title', '💥 ¡FALLO EN LA JAULA DE PRUEBAS!') : '💥 ¡FALLO EN LA JAULA DE PRUEBAS!';
                badgeColor = '#ef4444';
                icon = '💥';
                desc = event.riskyOption.failMsg || `¡El prototipo falló en la prueba! ${player.name} pierde -${failCost} Stamina.`;
                if (window.Game && typeof window.Game.logRunNode === 'function') {
                  window.Game.logRunNode({
                    type: 'store_test',
                    icon: '💥',
                    title: `Jaula de Pruebas: FALLO (${player.name})`,
                    titleEN: `Batting Cage: FAILED (${player.name})`,
                    desc: `${player.name} sufrió -${failCost} Stamina`,
                    descEN: `${player.name} suffered -${failCost} Stamina`,
                    status: 'danger'
                  });
                }
              }

              renderActiveRoster();
              renderSynergiesAndItems();
              updateHUD();

              showRetroResultModal({
                title,
                badgeText,
                badgeColor,
                icon,
                desc,
                testerPlayer: !isSuccess ? player : null,
                onClose: () => closeNodeCompleted()
              });
            };

            showRiskRouletteModal({ chance, isSuccess, onDone: resolveRiskyChoice });
          }
        });
      });

      el.eventChoicesContainer.appendChild(riskyCard);

      // ── CARD 3: REJECT / PASS OPTION ────────────────────────────────────
      const rejectCard = document.createElement('div');
      rejectCard.className = 'event-store-card event-store-card-reject';

      rejectCard.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-family:'Press Start 2P',monospace; font-size:8px; color:#94a3b8; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); padding:3px 8px; border-radius:12px;">
              ${typeof t === 'function' ? t('equip.store_reject_card_title', '⚪ RECHAZAR OFERTA') : '⚪ RECHAZAR OFERTA'}
            </span>
            <span style="font-family:'Press Start 2P',monospace; font-size:11px; color:#10b981;">
              $0
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div style="font-size:36px; line-height:1; color:#94a3b8;">⚪</div>
            <div>
              <div style="font-weight:bold; font-size:14px; color:#cbd5e1; font-family:'Outfit', sans-serif;">
                ${typeof t === 'function' ? t('equip.event_reject_btn', 'Rechazar Oferta') : 'Rechazar Oferta'}
              </div>
              <div style="font-size:10px; color:#64748b; margin-top:2px;">
                ${typeof t === 'function' ? t('equip.store_reject_card_desc', 'Continuar tu camino sin gastar presupuesto.') : 'Continuar tu camino sin gastar presupuesto.'}
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-secondary" id="btn-reject-event-offer" style="font-family:'Press Start 2P',monospace; font-size:9.5px; padding:12px; width:100%; border:1px solid rgba(255,255,255,0.2);">
          ${typeof t === 'function' ? t('equip.store_btn_reject', 'PASAR OFERTA') : 'PASAR OFERTA'}
        </button>
      `;

      rejectCard.querySelector('#btn-reject-event-offer').addEventListener('click', () => {
        if (window.Game && typeof window.Game.logRunNode === 'function') {
          window.Game.logRunNode({
            type: 'store_skip',
            icon: '🚪',
            title: `Salida de la Tienda`,
            titleEN: `Left the Store`,
            desc: `Continuaste la ruta sin compras adicionales`,
            descEN: `Continued route without extra purchases`,
            status: 'neutral'
          });
        }
        closeNodeCompleted();
      });

      el.eventChoicesContainer.appendChild(rejectCard);

      window.showScreen('screen-event');
      return;
    }

    // Fallback for legacy events
    if (event.choices) {
      event.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = `event-choice-btn event-choice-risk-${choice.risk || 'safe'}`;

        const costText = choice.cost > 0 ? `-$${choice.cost}` : (choice.cost < 0 ? `+$${Math.abs(choice.cost)}` : "GRATIS");
        const riskBadge = choice.risk === 'high' ? '🔴 ALTO RIESGO' : (choice.risk === 'moderate' ? '🟡 RIESGO MODERADO' : '🟢 SEGURO');
        const isRisky = choice.successChance !== undefined && choice.successChance < 1.0;
        const chanceText = isRisky ? ` (${Math.round(choice.successChance * 100)}% ÉXITO)` : '';
        const failPreviewHTML = (isRisky && choice.failPreview)
          ? `<div style="font-size:10px;color:#ef4444;margin-top:3px;">❌ ${Math.round((1 - choice.successChance) * 100)}% FALLO → ${choice.failPreview}</div>`
          : '';

        btn.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:26px;">${choice.icon || '👉'}</span>
              <div>
                <div style="font-weight:bold;font-size:14px;color:#fff;">${choice.text}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                  <span class="choice-risk-tag choice-risk-${choice.risk || 'safe'}">${riskBadge}</span>${chanceText}
                </div>
                ${failPreviewHTML}
              </div>
            </div>
            <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:${choice.cost < 0 ? '#10b981' : '#f59e0b'};">
              ${costText}
            </div>
          </div>
        `;

        if (choice.cost > 0 && window.Game.budget < choice.cost) {
          btn.disabled = true;
          btn.style.opacity = '0.5';
        }

        btn.addEventListener('click', () => {
          window.Game.budget -= choice.cost;
          const chance = choice.successChance !== undefined ? choice.successChance : 1.0;
          const isSuccess = Math.random() <= chance;

          const resolveChoice = () => {
            let title, badgeText, badgeColor, icon, desc;
            if (isSuccess) {
              choice.action(window.Game);
              title = choice.text;
              badgeText = choice.risk === 'high' ? (typeof window.t==='function'?window.t('ev.badge_risk_success'):'¡ÉXITO EN EL RIESGO!') : (typeof window.t==='function'?window.t('ev.badge_taken'):'¡DECISIÓN TOMADA!');
              badgeColor = '#10b981';
              icon = choice.icon || '✨';
              desc = choice.successMsg || (typeof window.t==='function'?window.t('ev.generic_success'):'La decisión se ejecutó con éxito en tu plantilla.');
            } else {
              if (choice.failAction) choice.failAction(window.Game);
              title = choice.text;
              badgeText = '¡RIESGO FALLIDO!';
              badgeColor = '#ef4444';
              icon = '❌';
              desc = choice.failMsg || (typeof window.t==='function'?window.t('ev.generic_fail'):'La opción arriesgada no salió como esperabas y provocó consecuencias negativas.');
            }

            if (choice.cost !== 0) {
              window.Game.purchasedItems.push(`${event.title}: ${choice.text.substring(0, 20)}...`);
            }

            renderActiveRoster();
            renderSynergiesAndItems();
            updateHUD();

            showRetroResultModal({
              title,
              badgeText,
              badgeColor,
              icon,
              desc,
              onClose: () => closeNodeCompleted()
            });
          };

          if (chance < 1.0) {
            showRiskRouletteModal({ chance, isSuccess, onDone: resolveChoice });
          } else {
            resolveChoice();
          }
        });

        el.eventChoicesContainer.appendChild(btn);
      });

      window.showScreen('screen-event');
    }
  }

  // ── RISK ROULETTE (ARCADE RETRO UPGRADE): spins to the pre-rolled outcome ────
  function showRiskRouletteModal({ chance, isSuccess, onDone }) {
    const overlay = document.createElement('div');
    overlay.className = 'roulette-overlay';

    const titleText = typeof t === 'function' ? t('equip.roulette_title', '🎡 JAULA DE PRUEBAS: RULETA DE PROTOTIPO') : '🎡 JAULA DE PRUEBAS: RULETA DE PROTOTIPO';
    const spinningText = typeof t === 'function' ? t('equip.roulette_spinning', '⏳ Probando en la jaula...') : '⏳ Probando en la jaula...';
    const successText = typeof t === 'function' ? t('equip.roulette_success', '✅ ¡ÉXITO! ¡PROTOTIPO APROBADO!') : '✅ ¡ÉXITO! ¡PROTOTIPO APROBADO!';
    const failText = typeof t === 'function' ? t('equip.roulette_fail', '❌ ¡FALLO! EL PROTOTIPO SE ROMPIÓ') : '❌ ¡FALLO! EL PROTOTIPO SE ROMPIÓ';
    const centerSubText = typeof t === 'function' ? t('equip.roulette_center_success', 'ÉXITO') : 'ÉXITO';

    const greenDeg = Math.max(6, Math.min(354, chance * 360));
    const pad = 4;
    let target;
    if (isSuccess) {
      const lo = pad, hi = Math.max(lo + 1, greenDeg - pad);
      target = lo + Math.random() * (hi - lo);
    } else {
      const lo = greenDeg + pad, hi = Math.max(lo + 1, 360 - pad);
      target = lo + Math.random() * (hi - lo);
    }
    const totalRotation = 6 * 360 + (360 - target);

    overlay.innerHTML = `
      <div class="roulette-modal">
        <div class="roulette-title">${titleText}</div>
        <div class="roulette-wrap">
          <div class="roulette-pointer">▼</div>
          <div class="roulette-wheel-border"></div>
          <div class="roulette-wheel" id="roulette-wheel" style="background: conic-gradient(#00ff66 0deg ${greenDeg}deg, #ff3366 ${greenDeg}deg 360deg);">
            <div class="roulette-center">
              <span style="font-size:14px; font-weight:bold; color:#facc15;">${Math.round(chance * 100)}%</span>
              <span style="font-size:7px; color:#cbd5e1; margin-top:2px;">${centerSubText}</span>
            </div>
          </div>
        </div>
        <div class="roulette-status" id="roulette-status">${spinningText}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    const wheel = overlay.querySelector('#roulette-wheel');
    const modal = overlay.querySelector('.roulette-modal');
    const pointer = overlay.querySelector('.roulette-pointer');
    const status = overlay.querySelector('#roulette-status');

    wheel.style.transition = 'transform 3.2s cubic-bezier(0.12, 0.72, 0.15, 1)';
    void wheel.offsetWidth;
    wheel.style.transform = `rotate(${totalRotation}deg)`;

    // Audio cue for rapid roulette ticks during spin with decelerating tempo
    let tickCount = 0;
    const maxTicks = 16;
    const playTick = () => {
      tickCount++;
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        const pitchMult = 0.85 + (tickCount / maxTicks) * 0.4;
        window.AudioManager.play('roulette_tick', pitchMult);
      }
      if (tickCount < maxTicks) {
        const nextDelay = 70 + (tickCount * 14); // gradually decelerate
        setTimeout(playTick, nextDelay);
      }
    };
    playTick();

    setTimeout(() => {
      status.textContent = isSuccess ? successText : failText;
      status.style.color = isSuccess ? '#00ff66' : '#ef4444';
      status.style.textShadow = isSuccess ? '0 0 10px rgba(0,255,102,0.6)' : '0 0 10px rgba(239,68,68,0.6)';

      if (isSuccess) {
        pointer.style.color = '#00ff66';
        wheel.style.borderColor = '#00ff66';
        wheel.style.boxShadow = '0 0 45px rgba(0,255,102,0.6)';
        if (window.AudioManager && typeof window.AudioManager.play === 'function') {
          window.AudioManager.play('roulette_win');
        }
      } else {
        pointer.style.color = '#ef4444';
        wheel.style.borderColor = '#ef4444';
        wheel.style.boxShadow = '0 0 45px rgba(239,68,68,0.6)';
        modal.classList.add('retro-shake-anim');
        if (window.AudioManager && typeof window.AudioManager.play === 'function') {
          window.AudioManager.play('defense_error');
        }
      }

      setTimeout(() => {
        overlay.remove();
        onDone();
      }, 1000);
    }, 3200);
  }

  // ── CENTRALIZED TRAINING TIER CONFIGURATION ─────────────────────────────
  const TRAINING_TIER_CONFIG = {
    // Weighted probabilities for tier rolling per card (sums to 1.0)
    probabilities: {
      Normal: 0.65, // 65% chance
      Silver: 0.25, // 25% chance
      Gold:   0.10  // 10% chance (rare "prize")
    },

    // Multipliers for stat gain and card price per tier
    tiers: {
      Normal: {
        label: 'NORMAL',
        color: '#64748b',       // Common palette
        bgGlow: 'rgba(100,116,139,0.15)',
        borderColor: 'rgba(255,255,255,0.12)',
        statMult: 1.0,
        priceMult: 1.0,
        badgeBg: 'rgba(100,116,139,0.2)',
        soundCue: 'purchase'
      },
      Silver: {
        label: 'SILVER',
        color: '#3b82f6',       // Rare palette (blue)
        bgGlow: 'rgba(59,130,246,0.25)',
        borderColor: '#3b82f6',
        statMult: 1.5,          // 1.5x stat boost
        priceMult: 1.6,         // 1.6x price
        badgeBg: 'rgba(59,130,246,0.2)',
        soundCue: 'purchase'
      },
      Gold: {
        label: '✨ GOLD ✨',
        color: '#f59e0b',       // Legendary palette (gold)
        bgGlow: 'rgba(245,158,11,0.35)',
        borderColor: '#f59e0b',
        statMult: 2.3,          // 2.3x stat boost!
        priceMult: 2.4,         // 2.4x price
        badgeBg: 'rgba(245,158,11,0.25)',
        soundCue: 'upgrade'     // High tier audio cue
      }
    }
  };

  function rollTrainingTier() {
    const r = Math.random();
    if (r < TRAINING_TIER_CONFIG.probabilities.Gold) return 'Gold';
    if (r < TRAINING_TIER_CONFIG.probabilities.Gold + TRAINING_TIER_CONFIG.probabilities.Silver) return 'Silver';
    return 'Normal';
  }

  // ── MULTI-PURCHASE TRAINING CARDS SYSTEM ──────────────────────────────────
  const MULTI_TRAIN_COST_MULTIPLIER = 1.0; // Adjustable price multiplier for consecutive purchases in same visit (e.g. 1.0 = static)

  let currentTrainingOffers = [];
  let purchasesInCurrentVisit = 0;

  function generateTrainingOffers() {
    const slots = ['C','1B','2B','3B','SS','LF','CF','RF','DH'];
    const activePlayers = slots.map(s => ({ slot: s, player: window.Game.roster[s] })).filter(x => x.player !== null);
    if (!activePlayers.length) return [];

    const statTemplates = [
      { stat: 'con', label: 'Contacto Estándar', desc: 'Práctica intensiva de swing', basePrice: 3, icon: '🎯', risk: 'safe', minVal: 5, maxVal: 7, critChance: 0.15, critVal: 12 },
      { stat: 'pwr', label: 'Fuerza de Bateo', desc: 'Repeticiones con bate pesado', basePrice: 3, icon: '💥', risk: 'safe', minVal: 5, maxVal: 7, critChance: 0.15, critVal: 12 },
      { stat: 'eye', label: 'Disciplina de Boletos', desc: 'Paciencia en el plato y lectura de pitcheos', basePrice: 3, icon: '👓', risk: 'safe', minVal: 5, maxVal: 7, critChance: 0.15, critVal: 12 },
      { stat: 'k_avd', label: 'Evasión de Ponches', desc: 'Afinar la zona de strike y reducir ponches', basePrice: 3, icon: '👁️', risk: 'safe', minVal: 5, maxVal: 7, critChance: 0.15, critVal: 12 },
      { stat: 'spd', label: 'Velocidad en Bases', desc: 'Trabajo de aceleración en bases', basePrice: 3, icon: '⚡', risk: 'safe', minVal: 5, maxVal: 7, critChance: 0.15, critVal: 12 },
      { stat: 'def', label: 'Técnica Defensiva', desc: 'Ejercicios de fildeo y tiro', basePrice: 2, icon: '🧤', risk: 'safe', minVal: 5, maxVal: 7, critChance: 0.15, critVal: 12 },
      { stat: 'sta', label: 'Masaje de Recuperación', desc: 'Masajes y descanso activo', basePrice: 2, icon: '🔋', risk: 'safe', minVal: 35, maxVal: 45, critChance: 0.20, critVal: 100 },
      { stat: 'pwr', label: 'Fuerza Extrema', desc: 'Levantamiento súper-pesado (30% riesgo tirón)', basePrice: 4, icon: '🔥', risk: 'high', minVal: 12, maxVal: 14, riskChance: 0.30, failPenalty: 15 },
      { stat: 'spd', label: 'Turbo Velocidad', desc: 'Sprints con resistencia (25% riesgo sobrecarga)', basePrice: 3, icon: '🚀', risk: 'high', minVal: 12, maxVal: 14, riskChance: 0.25, failPenalty: 10 }
    ];

    const offers = [];
    for (let i = 0; i < 3; i++) {
      const target = activePlayers[Math.floor(Math.random() * activePlayers.length)];
      const tpl = statTemplates[Math.floor(Math.random() * statTemplates.length)];
      const tierKey = rollTrainingTier();
      const tierData = TRAINING_TIER_CONFIG.tiers[tierKey];

      // Calculate scaled values per tier
      const minVal = Math.round(tpl.minVal * tierData.statMult);
      const maxVal = Math.round(tpl.maxVal * tierData.statMult);
      const critVal = tpl.critVal ? Math.round(tpl.critVal * tierData.statMult) : undefined;

      // Pricing by Tier: Normal ($2-$4), Silver ($5-$7), Gold ($8-$10)
      let basePrice = tpl.basePrice || 3;
      if (tierKey === 'Silver') {
        basePrice += 3;
      } else if (tierKey === 'Gold') {
        basePrice += 6;
      }

      offers.push({
        id: `offer_${i}_${Date.now()}`,
        player: target.player,
        slot: target.slot,
        tier: tierKey,
        tierData: tierData,
        template: {
          ...tpl,
          minVal,
          maxVal,
          critVal,
          basePrice
        },
        bought: false,
        _soundPlayed: false
      });
    }
    return offers;
  }

  function renderTrainingCardsContainer() {
    const container = document.getElementById('training-cards-container');
    if (!container) return;
    container.innerHTML = '';

    let playGoldSound = false;

    currentTrainingOffers.forEach((offer, idx) => {
      const p = offer.player;
      const tpl = offer.template;
      const tier = offer.tierData;

      if (offer.tier === 'Gold' && !offer._soundPlayed) {
        playGoldSound = true;
        offer._soundPlayed = true;
      }

      const currentPrice = Math.round(tpl.basePrice * Math.pow(MULTI_TRAIN_COST_MULTIPLIER, purchasesInCurrentVisit));
      const canAfford = window.Game.budget >= currentPrice;

      const card = document.createElement('div');
      card.className = `training-card-offer training-card-tier-${offer.tier.toLowerCase()}`;

      const animDelay = idx * 0.12;
      const goldGlow = offer.tier === 'Gold' ? `box-shadow: 0 0 25px ${tier.color}50, 0 4px 20px rgba(0,0,0,0.5);` : (offer.tier === 'Silver' ? `box-shadow: 0 0 15px ${tier.color}35, 0 4px 20px rgba(0,0,0,0.4);` : 'box-shadow: 0 4px 20px rgba(0,0,0,0.4);');

      card.style.cssText = `
        background: #090d16;
        border: 2px solid ${offer.bought ? '#10b981' : tier.borderColor};
        border-radius: 14px;
        padding: 18px;
        width: 100%;
        max-width: 290px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        ${offer.bought ? 'box-shadow: 0 0 20px rgba(16,185,129,0.15);' : goldGlow}
        opacity: ${offer.bought ? '0.75' : (canAfford ? '1' : '0.5')};
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        animation: cardPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${animDelay}s backwards;
      `;

      const riskTag = tpl.risk === 'high'
        ? '<span class="choice-risk-tag choice-risk-high" style="font-size:7px;">🔴 ALTO RIESGO</span>'
        : '<span class="choice-risk-tag choice-risk-safe" style="font-size:7px;">🟢 SEGURO</span>';

      const tierBadge = `
        <span style="
          font-family:'Press Start 2P',monospace;
          font-size:8px;
          color:${tier.color};
          background:${tier.badgeBg};
          border:1px solid ${tier.color}66;
          padding:3px 8px;
          border-radius:12px;
          display:inline-block;
        ">${tier.label}</span>
      `;

      const statDescText = tpl.stat === 'sta' 
        ? `+${tpl.minVal} a +${tpl.maxVal} Stamina` 
        : `+${tpl.minVal} a +${tpl.maxVal} ${tpl.stat.toUpperCase()}`;

      card.innerHTML = `
        <div>
          <!-- Top Row: Tier badge & Slot Tag -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            ${tierBadge}
            <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--primary-color);background:rgba(16,185,129,0.1);padding:3px 6px;border-radius:4px;">[${offer.slot}]</span>
          </div>

          <!-- Player name -->
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px dashed rgba(255,255,255,0.1);padding-bottom:10px;margin-bottom:12px;">
            <span style="font-weight:bold;font-size:14px;color:#fff;">${p.name}</span>
            <span style="font-size:9px;color:#94a3b8;">${p.pos}</span>
          </div>

          <!-- Body: Stat Upgrade Plan -->
          <div style="text-align:center;padding:8px 0;">
            <div style="font-size:36px;margin-bottom:6px;filter:drop-shadow(0 0 10px ${tier.color});">${tpl.icon}</div>
            <div style="font-weight:bold;font-size:13px;color:#e2e8f0;margin-bottom:4px;">${tpl.label}</div>
            <div style="font-weight:bold;font-size:12px;color:${tier.color};margin-bottom:6px;">${statDescText}</div>
            <div style="font-size:10px;color:#94a3b8;line-height:1.4;margin-bottom:10px;">${tpl.desc}</div>
            <div>${riskTag}</div>
          </div>
        </div>

        <!-- Footer: Price & Purchase Button -->
        <div style="margin-top:16px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:11px;color:#64748b;">Costo del Plan:</span>
            <span style="font-family:'Press Start 2P',monospace;font-size:11px;color:${offer.tier === 'Gold' ? '#ffd700' : 'var(--accent-color)'};">$${currentPrice}</span>
          </div>
          <button class="btn btn-buy-training-card" ${offer.bought || !canAfford ? 'disabled' : ''} style="
            width:100%;
            padding:10px;
            font-size:10px;
            font-weight:bold;
            background:${offer.bought ? '#10b981' : (canAfford ? `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)` : '#334155')};
            color:${offer.bought ? '#fff' : (canAfford ? '#000' : '#94a3b8')};
            border:none;
            border-radius:8px;
            cursor:${offer.bought || !canAfford ? 'not-allowed' : 'pointer'};
            box-shadow:${!offer.bought && canAfford ? `0 0 15px ${tier.color}44` : 'none'};
          ">
            ${offer.bought ? '<i class="fa-solid fa-check"></i> ADQUIRIDO' : (canAfford ? '<i class="fa-solid fa-cart-shopping"></i> COMPRAR OFERTA' : 'FONDOS INSUFICIENTES')}
          </button>
        </div>
      `;

      if (!offer.bought && canAfford) {
        card.querySelector('.btn-buy-training-card').addEventListener('click', () => {
          executeTrainingCardPurchase(offer, currentPrice);
        });
      }

      container.appendChild(card);
    });

    if (playGoldSound && window.AudioManager && typeof window.AudioManager.playSound === 'function') {
      window.AudioManager.playSound('upgrade');
    }
  }

  function executeTrainingCardPurchase(offer, price) {
    if (window.Game.budget < price || offer.bought) return;

    if (window.AudioManager && typeof window.AudioManager.play === 'function') {
      window.AudioManager.play('money');
    }
    window.Game.budget -= price;
    offer.bought = true;
    purchasesInCurrentVisit++;

    const player = offer.player;
    const tpl = offer.template;
    const tier = offer.tierData;

    let isCrit = false;
    let isFail = false;
    let gainVal = 0;
    let stats = [];

    if (tpl.risk === 'high') {
      const roll = Math.random();
      if (roll < tpl.riskChance) {
        isFail = true;
        player.stamina = Math.max(10, player.stamina - (tpl.failPenalty || 15));
        stats.push({ label: 'Stamina del Jugador', value: `-${tpl.failPenalty || 15}`, isPositive: false });
      } else {
        gainVal = Math.floor(Math.random() * (tpl.maxVal - tpl.minVal + 1)) + tpl.minVal;
        player.upgrades[tpl.stat] = (player.upgrades[tpl.stat] || 0) + gainVal;
        stats.push({ label: tpl.stat.toUpperCase() + ' Aumentado', value: `+${gainVal}`, isPositive: true });
      }
    } else {
      const roll = Math.random();
      if (roll < (tpl.critChance || 0.15)) {
        isCrit = true;
        gainVal = tpl.critVal || Math.round(12 * tier.statMult);
      } else {
        gainVal = Math.floor(Math.random() * (tpl.maxVal - tpl.minVal + 1)) + tpl.minVal;
      }

      if (tpl.stat === 'sta') {
        player.stamina = Math.min(100, player.stamina + gainVal);
        player.upgrades.sta = (player.upgrades.sta || 0) + 5;
        stats.push({ label: 'Stamina Recuperada', value: `+${gainVal}`, isPositive: true });
      } else {
        player.upgrades[tpl.stat] = (player.upgrades[tpl.stat] || 0) + gainVal;
        stats.push({ label: tpl.stat.toUpperCase() + ' Aumentado', value: `+${gainVal}`, isPositive: true });
      }
    }

    if (window.AudioManager && typeof window.AudioManager.play === 'function') {
      if (isFail) window.AudioManager.play('defense_error');
      else if (isCrit) window.AudioManager.play('roulette_win');
      else window.AudioManager.play('upgrade');
    }

    renderActiveRoster();
    renderSynergiesAndItems();
    updateHUD();

    if (window.Game && typeof window.Game.logRunNode === 'function') {
      window.Game.logRunNode({
        type: 'training',
        icon: isFail ? '💥' : (isCrit ? '🎉' : '🏋️'),
        title: isFail ? `Entrenamiento Fallido: ${player.name}` : (isCrit ? `Entrenamiento CRÍTICO: ${player.name}` : `Entrenamiento: ${player.name}`),
        titleEN: isFail ? `Training Failed: ${player.name}` : (isCrit ? `CRITICAL Training: ${player.name}` : `Training: ${player.name}`),
        desc: stats.map(s => `${s.label}: ${s.value}`).join(' · '),
        descEN: stats.map(s => `${s.label}: ${s.value}`).join(' · '),
        status: isFail ? 'danger' : 'success'
      });
    }

    let title = `${player.name} [${offer.slot}]`;
    let badgeText = isFail ? (typeof window.t==='function'?window.t('training.badge_fail'):'¡SOBRECARGA MUSCULAR!') : (isCrit ? (typeof window.t==='function'?window.t('training.badge_crit', { label: tier.label }):`¡CRÍTICO ${tier.label}! 🎉`) : (typeof window.t==='function'?window.t('training.badge_ok', { label: tier.label }):`¡ENTRENAMIENTO ${tier.label}!`));
    let badgeColor = isFail ? '#ef4444' : (isCrit ? '#f59e0b' : tier.color);
    let icon = isFail ? '💥' : (isCrit ? '🎉' : tpl.icon);
    let desc = isFail
      ? (typeof window.t==='function'?window.t('training.result_fail', { name: player.name }):`El entrenamiento fue demasiado intenso y provocó fatiga en ${player.name}`)
      : (isCrit
          ? (typeof window.t==='function'?window.t('training.result_crit', { name: player.name, label: tier.label, val: gainVal }):`¡Extraordinario desempeño! ${player.name} tuvo una sesión de nivel ${tier.label} e incrementó +${gainVal} en su estadística.`)
          : (typeof window.t==='function'?window.t('training.result_ok', { name: player.name, label: tier.label }):`${player.name} completó la rutina ${tier.label} con éxito.`));

    showRetroResultModal({
      title,
      badgeText,
      badgeColor,
      icon,
      desc,
      stats,
      onClose: () => renderTrainingCardsContainer()
    });
  }

  // TRAINING SCREEN SETUP
  function setupTrainingScreen() {
    purchasesInCurrentVisit = 0;
    currentTrainingOffers = generateTrainingOffers();
    renderTrainingCardsContainer();
    window.showScreen('screen-train');
  }

  // SCOUTING REPORT — communicates rising threat level before each match.
  // Story Mode gets thematic content (franchise name, season era, win_pct-based
  // flavor); Quick Play falls back to the pitcher pool's own era/rarity data.
  function renderScoutingReport(enemy) {
    if (!el.preFightScouting) return;

    const rarity = enemy.rarity || 'Common';
    const rColor = RARITY_COLORS[rarity] || RARITY_COLORS.Common;
    const rBg = RARITY_BG[rarity] || RARITY_BG.Common;
    const threatKeyMap = { Common: 'threat_common', Uncommon: 'threat_uncommon', Rare: 'threat_rare', Epic: 'threat_epic', Legendary: 'threat_legendary' };
    const threatLabel = t('pre_fight.' + (threatKeyMap[rarity] || 'threat_common'));

    const isStory = window.Game.selectedMode === 'story' && !!enemy.year;
    let eraName = enemy.era || '';
    let teamName = enemy.name;
    let recordHTML = '';
    let ovrDisplay = null;

    if (isStory) {
      eraName = getEraNameForYear(enemy.year);
      let teamFull = enemy.teamID || enemy.name;
      if (window.PlayersDB && window.PlayersDB.FranchiseNames && window.PlayersDB.FranchiseNames[enemy.teamID]) {
        teamFull = window.PlayersDB.FranchiseNames[enemy.teamID];
      }
      teamName = enemy.isBoss ? enemy.name : `${teamFull} (${enemy.year})`;

      const currentZoneIdx = (typeof window.Game.getZoneForStage === 'function') ? window.Game.getZoneForStage(window.Game.currentStageIndex) : 0;
      const zoneDivision = window.Game.selectedDivisions && window.Game.selectedDivisions[currentZoneIdx];
      const divLabel = zoneDivision ? zoneDivision.label : (enemy.division || enemy.league || '');

      let divIcon = '⚾';
      if (divLabel.toLowerCase().includes('negro') || divLabel.toLowerCase().includes('all-stars') || divLabel.toLowerCase().includes('pennant') || divLabel.toLowerCase().includes('classic') || divLabel.toLowerCase().includes('champion')) {
        divIcon = '👑';
      } else if (divLabel.toLowerCase().includes('federal')) {
        divIcon = '⚡';
      }

      const divBadgeHTML = divLabel ? `
        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,215,0,0.12);border:1px solid rgba(255,215,0,0.4);border-radius:4px;padding:3px 8px;margin-top:6px;margin-bottom:4px;font-size:10px;font-weight:bold;color:#fef08a;letter-spacing:0.5px;">
          <span>${divIcon}</span>
          <span>${divLabel.toUpperCase()} — ${enemy.year}</span>
        </div>
      ` : '';

      if (enemy.isBoss) {
        recordHTML = `
          ${divBadgeHTML}
          <div style="font-size:11px;color:#fde047;font-weight:bold;margin-top:4px;">
            👑 ${typeof window.t === 'function' ? window.t('pre_fight.boss_all_star_desc', 'Rotación All-Star: Los mejores brazos del circuito') : 'Rotación All-Star: Los mejores brazos del circuito'}
          </div>
        `;
      } else {
        const wp = enemy.win_pct || 0;
        const recordKey = wp >= 0.560 ? 'record_dominant' : (wp >= 0.480 ? 'record_contender' : 'record_underdog');
        const pctText = (wp * 100).toFixed(1) + '%';
        recordHTML = `
          ${divBadgeHTML}
          <div style="font-size:11px;color:#9ca3af;margin-top:4px;">
            ${t('pre_fight.' + recordKey)} — <strong style="color:#e4e4e7;">${pctText}</strong> ${t('pre_fight.win_pct_label', 'Prob. Victoria')}
          </div>
        `;
      }
      ovrDisplay = enemy.ovr !== undefined && enemy.ovr !== null ? Math.floor(enemy.ovr) : null;
    } else {
      // Quick Play rosters are 2-3 pitchers assembled independently from the
      // whole pool (see createPitcherObj/pickPitcher in game.js) — they're not
      // a real team. Naming the report after just the 1st pitcher and quoting
      // only their era was misleading when the others came from elsewhere.
      teamName = t('pre_fight.rival_rotation_label');
      const pitcherEras = [...new Set((enemy.pitchers || []).map(p => p.era).filter(Boolean))];
      eraName = pitcherEras.length === 1 ? pitcherEras[0] : (pitcherEras.length > 1 ? t('pre_fight.mixed_eras') : '');
      const ovrs = (enemy.pitchers || []).map(p => p.ovr).filter(v => typeof v === 'number');
      ovrDisplay = ovrs.length ? Math.floor(ovrs.reduce((a, b) => a + b, 0) / ovrs.length) : (enemy._ovr || null);
    }

    const ovrHTML = ovrDisplay !== null
      ? `<div style="font-size:9px;color:#e4e4e7;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.15);">${t('pre_fight.ovr_label')}: <strong>${ovrDisplay}</strong></div>`
      : '';

    el.preFightScouting.innerHTML = `
      <div style="background:rgba(0,0,0,0.35);border:1px solid ${rColor};border-radius:10px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:${rColor};letter-spacing:0.5px;margin-bottom:6px;">${t('pre_fight.scouting_title')}</div>
          <div style="font-size:13px;font-weight:bold;color:#e4e4e7;">${teamName}</div>
          ${eraName ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px;">${t('pre_fight.era_label')}: ${eraName}</div>` : ''}
          ${recordHTML}
        </div>
        <div style="background:${rBg};border:1px solid ${rColor};border-radius:8px;padding:8px 14px;text-align:center;">
          <div style="font-size:9px;color:${rColor};font-weight:bold;letter-spacing:0.5px;">${rarity.toUpperCase()}</div>
          <div style="font-size:11px;color:#e4e4e7;margin-top:2px;">${threatLabel}</div>
          ${ovrHTML}
        </div>
      </div>
    `;
  }

  // PRE-FIGHT SCREEN SETUP
  function setupAndShowPreFightScreen() {
    const enemy = window.Game.getEnemyTeam();
    el.preFightSubtitle.innerHTML = t('pre_fight.subtitle', { team: `<strong style="color: #ef4444;">${enemy.name}</strong>` });
    renderScoutingReport(enemy);

    // 1. Render player's batters
    el.preFightPlayerLineup.innerHTML = "";
    const activeSlots = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    activeSlots.forEach(slot => {
      const p = window.Game.roster[slot];
      if (!p) return;
      const eff = window.Game.getEffectiveStats(p, slot);
      const startingHp = Math.max(45, p.stamina || 100);

      const row = document.createElement('div');
      row.className = "pre-fight-row";
      if (startingHp <= 0) row.classList.add('ko');

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 10px; font-weight: bold; color: var(--primary-color); background: rgba(16,185,129,0.1); padding: 2px 4px; border-radius: 4px;">${slot}</span>
          <span class="name" title="${eff.name}">${eff.name}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="hp-bar-container">
            <div class="hp-bar-fill" style="width: ${startingHp}%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
          </div>
          <span class="hp-text">${startingHp}/100 HP</span>
        </div>
      `;
      el.preFightPlayerLineup.appendChild(row);
    });

    // 2. Render enemy pitchers with OVR badges & interactive card inspect popup
    el.preFightEnemyRotation.innerHTML = "";
    enemy.pitchers.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = "pre-fight-row";
      row.style.cursor = "pointer";
      row.style.transition = "transform 0.15s ease, background 0.15s ease";
      row.title = typeof window.t === 'function' ? window.t('pre_fight.pitcher_card_tooltip', 'Haz clic para ver la carta de este lanzador') : 'Haz clic para ver la carta de este lanzador';

      // Label type
      let pType = p.role || "SP";
      if (!p.role) {
        if (idx === 3) pType = "RP";
        if (idx === 4) pType = "CL";
      }

      const pOvr = getPlayerOvr(p);
      const pGrade = getClassGrade(pOvr);

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 10px; font-weight: bold; color: #ef4444; background: rgba(239,68,68,0.1); padding: 2px 4px; border-radius: 4px;">${pType}</span>
          <span class="name" title="${p.name}" style="color:#fff; text-decoration: underline dotted rgba(255,255,255,0.4);">${p.cleanName || p.name}</span>
          <span style="font-size: 9px; font-weight: bold; color: ${pGrade.color}; background: rgba(0,0,0,0.4); border: 1px solid ${pGrade.color}; padding: 1px 5px; border-radius: 4px; font-family:'Press Start 2P',monospace;">${pOvr} ${pGrade.text}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="hp-bar-container">
            <div class="hp-bar-fill" style="width: 100%; background: linear-gradient(90deg, #ef4444, #f87171);"></div>
          </div>
          <span class="hp-text">${p.maxHp || p.hp || 100}/${p.maxHp || p.hp || 100} HP</span>
          <span style="font-size:11px; color:#9ca3af;">🔍</span>
        </div>
      `;

      row.addEventListener('mouseenter', () => {
        row.style.background = "rgba(239,68,68,0.12)";
        row.style.transform = "translateX(4px)";
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = "";
        row.style.transform = "none";
      });

      row.addEventListener('click', () => {
        const pitcherCardObj = {
          ...p,
          pos: p.pos || 'P',
          role: p.role || pType,
          rarity: p.rarity || (pOvr >= 90 ? 'Legendary' : (pOvr >= 80 ? 'Epic' : (pOvr >= 70 ? 'Rare' : 'Uncommon')))
        };
        showPlayerCardPopup(pitcherCardObj, 'pitcher_preview');
      });

      el.preFightEnemyRotation.appendChild(row);
    });

    window.showScreen('screen-pre-fight');

    showTutorialTip(
      'prefight-basics', el.preFightEnemyRotation,
      'tutorial.prefight_basics_title', 'tutorial.prefight_basics_text', 'top'
    );
  }

  // ── START INTERACTIVE DICE BATTLE ────────────────────────────────────────────
  function setupAndStartMatchSimulation() {
    if (typeof renderActiveRoster === 'function') renderActiveRoster();
    // Collapse roster panel (keep visible in 3-column layout)
    // el.rosterManagerPanel.classList.add('hidden');

    const enemy = window.Game.getEnemyTeam();
    const interactivePrefix = typeof window.t === 'function' ? window.t('match.interactive_header_prefix', 'Combate Interactivo vs') : 'Combate Interactivo vs';
    if (enemy && enemy.isBoss) {
      el.matchHeaderTitle.innerHTML =
        `<i class="fa-solid fa-crown" style="color:#ffd700;"></i> 👑 <span style="color:#ffd700;font-weight:bold;">${enemy.name}</span> <span style="font-size:10px;background:rgba(255,215,0,0.2);color:#ffd700;border:1px solid #ffd700;padding:2px 6px;border-radius:4px;margin-left:6px;font-family:'Press Start 2P',monospace;">BOSS BATTLE</span>`;
    } else {
      el.matchHeaderTitle.innerHTML =
        `<i class="fa-solid fa-dice"></i> 🎲 ${interactivePrefix} <span style="color:#ef4444;">${enemy.name}</span>`;
    }
    if (el.scoreEnemyName) el.scoreEnemyName.innerText = (typeof window.t==='function'?window.t('match.rival_rotation'):'ROTACIÓN RIVAL');

    // Reset HUD
    el.scoreAwayR.innerText = '0';
    el.scoreHomeR.innerText = '0';
    el.scoreAwayH.innerText = '1 / 3';
    el.scoreHomeH.innerText = '0';
    // Reset SVG bases
    ['base-1', 'base-2', 'base-3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.fill = 'rgba(255, 255, 255, 0.1)';
        el.style.stroke = 'rgba(255, 255, 255, 0.25)';
        el.style.filter = 'none';
      }
    });
    // Reset tension escalation state for the new match
    if (el.matchArena) el.matchArena.classList.remove('danger-1', 'danger-2', 'danger-3');
    el.matchLogLines.innerHTML = '';
    el.arenaBatterCardSlot.innerHTML = '';
    el.arenaPitcherCardSlot.innerHTML = '';
    resetLEDs();

    // Build lineups
    const teamLineups = window.Game.getSimLineups();

    // ── Calculate team shield using position rules (native=100%, OOP=50%, DH=0%) ──
    const avgDef = window.Game.calculateLineupShield();

    // ── Create InteractiveBattle ──────────────────────────────────────────────
    stopAutoSimulate();
    activeBattle = new window.InteractiveBattle(teamLineups.away, teamLineups.home, avgDef, window.Game.buildEra, window.Game.equippedTraits.map(t => t.id));
    isRolling = false;

    // ── Audio: Play Ball! ─────────────────────────────────────────────────────
    if (window.AudioManager) window.AudioManager.play('play_ball');

    // Remove old dice panel / proceed buttons
    const oldDicePanel = el.screenMatch.querySelector('#dice-battle-panel');
    if (oldDicePanel) oldDicePanel.parentNode.removeChild(oldDicePanel);

    ['btn-finish-match-debrief'].forEach(id => {
      const old = el.screenMatch.querySelector('#' + id);
      if (old) old.parentNode.removeChild(old);
    });

    // Hide old step/auto buttons (replaced by dice button)
    el.btnMatchStep && el.btnMatchStep.classList.add('hidden');
    el.btnMatchAuto && el.btnMatchAuto.classList.add('hidden');
    el.btnMatchSkip && el.btnMatchSkip.classList.remove('hidden');

    // ── Inject dice UI panel ─────────────────────────────────────────────────
    const dicePanel = document.createElement('div');
    dicePanel.id = 'dice-battle-panel';
    dicePanel.style.cssText = [
      'display:flex', 'flex-direction:column', 'align-items:center',
      'gap:12px', 'padding:16px', 'margin-top:10px',
      'background:rgba(0,0,0,0.45)', 'border:1px solid rgba(255,255,255,0.08)',
      'border-radius:12px'
    ].join(';');

    dicePanel.innerHTML = `
      <!-- Team vitals -->
      <div id="team-vitals" style="width:100%;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:#9ca3af;">❤️ TEAM HP</span>
          <span id="team-hp-text" style="font-size:11px;font-weight:bold;color:#10b981;">100/100</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
          <div id="team-hp-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#10b981,#34d399);transition:width .3s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:#9ca3af;">🛡️ ${t('match.shield_label', { avg: avgDef })}</span>
          <span id="team-shield-text" style="font-size:11px;font-weight:bold;color:#3b82f6;">${avgDef}/${avgDef}</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
          <div id="team-shield-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa);transition:width .3s;"></div>
        </div>
        <div style="font-size:11px;color:#f59e0b;text-align:center;" id="so-chain-display">${t('match.so_streak_zero', '🔥 Racha de Ponches: 0')}</div>
      </div>
      <!-- d100 dice: two d10 cubes (tens + units) + a combined-total readout to resolve the 00/00=100 edge case unambiguously -->
      <div id="dice-d100-panel" style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div id="dice-d100-container" style="display:flex;gap:10px;">
          ${['tens','units'].map(kind => `
            <div class="d100-die" id="die-${kind}">
              <div class="d100-die-cube" id="die-${kind}-cube">
                <div class="d100-die-face face-front" id="die-${kind}-face-front">0</div>
                <div class="d100-die-face face-back">0</div>
                <div class="d100-die-face face-right">0</div>
                <div class="d100-die-face face-left">0</div>
                <div class="d100-die-face face-top">0</div>
                <div class="d100-die-face face-bottom">0</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div id="dice-result-display" style="
          font-family:'Press Start 2P',monospace;
          font-size:14px;color:#fff;
          letter-spacing:1px;
        ">–</div>
      </div>
      <!-- Lucky zones panel. Clutch banner lives outside the <details> so it's
           always visible even while the probability breakdown is collapsed
           (collapsed by default on mobile only — see mobile CSS/JS). -->
      <div id="zones-panel-wrap" style="width:100%;">
        <div id="clutch-banner-slot"></div>
        <details id="zones-panel" open>
          <summary id="zones-panel-header">🎯 ${t('match.luck_zones', 'Zonas de la Suerte')}</summary>
          <div id="zones-lines"></div>
        </details>
      </div>
      <!-- Action bar: ROLL + SIMULATE ALL, wrapped together so it can stick to the
           bottom of the mobile scroll viewport as one unit (see mobile CSS) -->
      <div id="dice-action-bar">
        <button id="btn-roll-dice" style="
          font-family:'Press Start 2P',monospace;
          font-size:13px;padding:14px 32px;
          background:linear-gradient(135deg,#7c3aed,#4f46e5);
          color:#fff;border:none;border-radius:10px;
          cursor:pointer;letter-spacing:1px;
          box-shadow:0 0 20px rgba(124,58,237,0.5);
          transition:transform .1s,box-shadow .1s;
          width:100%;
        ">${t('match.roll_dice', 'LANZAR DADO')}</button>
        <!-- SIMULATE ALL button (placed directly below LANZAR DADO on both PC and mobile) -->
        <button id="btn-match-skip-game" class="btn" style="
          font-family:'Press Start 2P',monospace;
          font-size:10.5px;
          padding:12px 20px;
          background:linear-gradient(135deg,#dc2626,#ef4444);
          color:#fff;
          border:none;
          border-radius:10px;
          cursor:pointer;
          width:100%;
          margin-top:10px;
          letter-spacing:0.5px;
          box-shadow:0 0 14px rgba(220,38,38,0.4);
          transition:transform .1s,box-shadow .1s;
        " data-i18n="match.simulate_all"><i class="fa-solid fa-forward-step"></i> ${t('match.simulate_all', '⚡ SIMULAR TODO')}</button>
      </div>
    `;

    el.btnMatchSkip = document.getElementById('btn-match-skip-game');
    if (el.btnMatchSkip) {
      el.btnMatchSkip.innerHTML = '<i class="fa-solid fa-forward-step"></i> ' + t('match.simulate_all', '⚡ SIMULAR TODO');
    }

    const diceSlot = el.screenMatch.querySelector('#dice-container-slot');
    if (diceSlot) {
      diceSlot.appendChild(dicePanel);
    } else {
      el.screenMatch.appendChild(dicePanel);
    }

    // Luck Zones starts collapsed on phones only — it's the most "optional"
    // section on the battle screen (the roll button and vitals matter more
    // moment to moment), so starting it closed keeps the initial view calmer.
    // Desktop keeps it open since there's room and players tend to reference
    // it constantly there.
    if (window.innerWidth <= 768) {
      const zonesDetails = document.getElementById('zones-panel');
      if (zonesDetails) zonesDetails.removeAttribute('open');
    }

    showTutorialTip(
      'combat-dice-zones', document.getElementById('zones-panel'),
      'tutorial.combat_dice_title', 'tutorial.combat_dice_text', 'top'
    );

    // Initial render — the faceoff cards get dealt in from a "deck" on each side
    // (batter from the left/your side, pitcher from the right/rival side) instead
    // of appearing statically. Only this first render does it; mid-match faceoff
    // changes (next batter, pitcher swap) stay instant.
    const initState = activeBattle.getState();
    updateMatchHUD(initState);
    updateFaceoffPanel(initState, { dealAnimation: true });
    renderZones();

    // Auto-open info legend for first time users
    const dropdownInfo = document.getElementById('combat-info-dropdown');
    if (dropdownInfo && !localStorage.getItem('baserogue_seen_combat_info')) {
      dropdownInfo.classList.remove('hidden');
      localStorage.setItem('baserogue_seen_combat_info', 'true');
    }

    window.showScreen('screen-match');
  }


  // ── ARCADE GAME JUICE: PITCHER KO & INNING CHANGE ───────────────────────────
  function triggerPitcherKOJuice(defeatedPitcherName, nextPitcher) {
    const arena = document.getElementById('screen-match') || document.querySelector('.match-arena') || document.querySelector('.rpg-fight-deck');
    const deck = document.querySelector('.rpg-fight-deck') || arena;
    if (!arena) return;

    if (defeatedPitcherName && typeof defeatedPitcherName === 'object') {
      defeatedPitcherName = defeatedPitcherName.name || '';
    }
    defeatedPitcherName = (defeatedPitcherName || '').toString().trim();
    if (defeatedPitcherName === '[object Object]') defeatedPitcherName = '';

    // Remove any leftover popups or banners
    document.querySelectorAll('.arcade-transition-banner, .outcome-popup-overlay, .match-screen-flash').forEach(el => el.remove());

    // 1. Screen flash & heavy screen shake applied to the arena
    const flash = document.createElement('div');
    flash.className = 'match-screen-flash';
    arena.appendChild(flash);
    setTimeout(() => flash.remove(), 450);

    arena.classList.remove('screen-shake-heavy');
    void arena.offsetWidth;
    arena.classList.add('screen-shake-heavy');
    setTimeout(() => arena.classList.remove('screen-shake-heavy'), 600);

    // 2. Play synthesized heavy KO sound (explosion + sub-bass + victory gong)
    if (window.AudioManager) window.AudioManager.play('pitcher_ko');

    // 3. Stamp "K.O.!" badge directly on pitcher's card with defeat fall animation
    if (el.arenaPitcherCardSlot) {
      el.arenaPitcherCardSlot.querySelectorAll('.ko-stamp-badge').forEach(s => s.remove());

      const stamp = document.createElement('div');
      stamp.className = 'ko-stamp-badge';
      stamp.innerHTML = `<i class="fa-solid fa-skull-crossbones"></i> K.O.!`;
      el.arenaPitcherCardSlot.style.position = 'relative';
      el.arenaPitcherCardSlot.appendChild(stamp);

      const card = el.arenaPitcherCardSlot.querySelector('.player-card');
      if (card) {
        card.classList.remove('pitcher-card-defeated');
        void card.offsetWidth;
        card.classList.add('pitcher-card-defeated');
      }
    }

    // 4. Arcade Cinematic Banner: PITCHER K.O.!
    const koBanner = document.createElement('div');
    koBanner.className = 'arcade-transition-banner banner-ko';
    koBanner.innerHTML = `
      <div class="arcade-banner-main">${t('match.banner_ko', '¡K.O. AL PITCHER! 🥊💥')}</div>
      <div class="arcade-banner-sub">${defeatedPitcherName ? `${defeatedPitcherName} — ` : ''}${t('match.banner_ko_sub', '¡LANZADOR DERROTADO!')}</div>
    `;
    deck.appendChild(koBanner);
    setTimeout(() => koBanner.remove(), 1550);

    // 5. If a relief pitcher is entering, showcase the KO stamp for 1.5s then trigger bullpen transition
    if (nextPitcher) {
      setTimeout(() => {
        // Animate defeated card and stamp exiting
        if (el.arenaPitcherCardSlot) {
          const card = el.arenaPitcherCardSlot.querySelector('.player-card');
          if (card) {
            card.classList.remove('pitcher-card-defeated');
            card.classList.add('pitcher-card-exit');
          }
          const stamp = el.arenaPitcherCardSlot.querySelector('.ko-stamp-badge');
          if (stamp) stamp.classList.add('pitcher-card-exit');
        }

        // Bullpen sound & banner
        if (window.AudioManager) window.AudioManager.play('bullpen_enter');

        document.querySelectorAll('.arcade-transition-banner').forEach(el => el.remove());

        const nextName = nextPitcher.name || t('match.rival_rotation', 'Lanzador de Relevo');
        const nextOvr = nextPitcher.ovr || (window.getPlayerOvr ? window.getPlayerOvr(nextPitcher) : 70);

        const bullpenBanner = document.createElement('div');
        bullpenBanner.className = 'arcade-transition-banner banner-bullpen';
        bullpenBanner.innerHTML = `
          <div class="arcade-banner-main">${t('match.banner_bullpen', '🚨 ¡ALERTA DE BULLPEN! 🚨')}</div>
          <div class="arcade-banner-sub">${t('match.banner_bullpen_sub', { name: nextName, ovr: nextOvr })}</div>
        `;
        deck.appendChild(bullpenBanner);
        setTimeout(() => bullpenBanner.remove(), 1450);

        // Slide in the NEW relief pitcher card smoothly
        setTimeout(() => {
          if (activeBattle && !activeBattle.battleOver) {
            updateFaceoffPanel(activeBattle.getState(), { reliefEntrance: true });
          }
        }, 350);
      }, 1500);
    }
  }

  function triggerInningChangeJuice(nextInning) {
    const arena = document.getElementById('screen-match') || document.querySelector('.match-arena') || document.querySelector('.rpg-fight-deck');
    const deck = document.querySelector('.rpg-fight-deck') || arena;
    if (!arena) return;

    // Remove any leftover popups or banners
    document.querySelectorAll('.arcade-transition-banner, .outcome-popup-overlay, .match-screen-flash').forEach(el => el.remove());

    // 1. Play synthesized umpire whistle & stadium chime
    if (window.AudioManager) window.AudioManager.play('inning_change');

    // 2. Screen flash
    const flash = document.createElement('div');
    flash.className = 'match-screen-flash';
    arena.appendChild(flash);
    setTimeout(() => flash.remove(), 450);

    // 3. Clear bases with visual glow sweep
    ['base-1', 'base-2', 'base-3'].forEach(id => {
      const b = document.getElementById(id);
      if (b) {
        b.classList.remove('active');
        b.classList.add('bases-cleared-glow');
        setTimeout(() => b.classList.remove('bases-cleared-glow'), 700);
      }
    });

    // 4. Inning Transition Arcade Banner with remaining outs
    const isLastInning = (nextInning >= 3);
    const outsRemaining = Math.max(3, (4 - nextInning) * 3);

    const mainText = isLastInning
      ? t('match.banner_inning_last', '🔥 ¡ÚLTIMA ENTRADA! (3/3) 🔥')
      : t('match.banner_inning', { inning: nextInning });

    const subText = isLastInning
      ? t('match.banner_inning_last_sub', '¡Última oportunidad: te quedan 3 outs!')
      : t('match.banner_inning_sub', { outs: outsRemaining });

    const inningBanner = document.createElement('div');
    inningBanner.className = 'arcade-transition-banner banner-inning' + (isLastInning ? ' banner-last-inning' : '');
    inningBanner.innerHTML = `
      <div class="arcade-banner-main">${mainText}</div>
      <div class="arcade-banner-sub">${subText}</div>
    `;
    deck.appendChild(inningBanner);
    setTimeout(() => inningBanner.remove(), 1650);
  }


  // ── OUTCOME POPUP BANNER ─────────────────────────────────────────────────────
  function showOutcomePopup(eventType, details, ev) {
    const parent = document.querySelector('.rpg-fight-deck');
    if (!parent) return;

    // Delegate KO and INNING_END to arcade juice handlers
    if (eventType === 'KO' || eventType === 'KO_PITCHER') {
      let defName = '';
      if (ev) {
        if (typeof ev.activeBatter === 'string' && ev.activeBatter && ev.eventType === 'KO') {
          defName = ev.activeBatter;
        } else if (ev.activePitcher) {
          defName = typeof ev.activePitcher === 'object' ? (ev.activePitcher.name || '') : ev.activePitcher;
        } else if (ev.detail) {
          defName = typeof ev.detail === 'object' ? (ev.detail.name || '') : ev.detail;
        }
      }
      const nextP = (activeBattle && activeBattle.activePitcher) ? activeBattle.activePitcher : null;
      triggerPitcherKOJuice(defName, nextP);
      return;
    }

    if (eventType === 'INNING_END') {
      const nextIn = (ev && typeof ev.inning === 'number') ? (ev.inning + 1) : 2;
      if (nextIn > 3 || (activeBattle && activeBattle.battleOver)) return;
      triggerInningChangeJuice(nextIn);
      return;
    }

    let title = "";
    let color = "#fff";
    let icon = "fa-star";
    let dmgText = "";
    let borderColor = "#fff";
    let boxShadow = "none";

    switch(eventType) {
      case 'BB':
        title = typeof t === 'function' ? t('popup.bb_title', { defaultValue: 'BASE POR BOLAS' }) : 'BASE POR BOLAS';
        color = "#3b82f6";
        icon = "fa-walking";
        dmgText = `🚶 ${typeof t === 'function' ? t('popup.bb_dmg', { defaultValue: '¡PITCHER RECIBE DAÑO!' }) : '¡PITCHER RECIBE DAÑO!'}`;
        borderColor = "#3b82f6";
        boxShadow = "0 0 30px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)";
        break;
      case 'SO':
        title = typeof t === 'function' ? t('popup.so_title', { defaultValue: '¡PONCHE!' }) : '¡PONCHE!';
        color = "#ef4444";
        icon = "fa-circle-xmark";
        dmgText = `💀 ${typeof t === 'function' ? t('popup.so_dmg', { defaultValue: 'DAÑO DIRECTO (IGNORA ESCUDO)' }) : 'DAÑO DIRECTO (IGNORA ESCUDO)'}`;
        borderColor = "#ef4444";
        boxShadow = "0 0 30px rgba(239, 68, 68, 0.5), 0 0 15px rgba(239, 68, 68, 0.3)";
        break;
      case 'OUT':
        title = typeof t === 'function' ? t('popup.out_title', { defaultValue: 'OUT' }) : 'OUT';
        color = "#9ca3af";
        icon = "fa-thumbs-down";
        dmgText = `🛡️ ${typeof t === 'function' ? t('popup.out_dmg', { defaultValue: 'DAÑO AL ESCUDO' }) : 'DAÑO AL ESCUDO'}`;
        borderColor = "#9ca3af";
        boxShadow = "0 0 30px rgba(156, 163, 175, 0.5), 0 0 15px rgba(156, 163, 175, 0.3)";
        break;
      case '1B':
        title = typeof t === 'function' ? t('popup.single_title', { defaultValue: 'SENCILLO (1B)' }) : 'SENCILLO (1B)';
        color = "#a7f3d0";
        icon = "fa-baseball-bat-ball";
        dmgText = `⚾ ${typeof t === 'function' ? t('popup.single_dmg', { defaultValue: 'DAÑO AL PITCHER' }) : 'DAÑO AL PITCHER'}`;
        borderColor = "#10b981";
        boxShadow = "0 0 30px rgba(16, 185, 129, 0.5), 0 0 15px rgba(16, 185, 129, 0.3)";
        break;
      case '2B':
        title = typeof t === 'function' ? t('popup.double_title', { defaultValue: 'DOBLE (2B) ⚡' }) : 'DOBLE (2B) ⚡';
        color = "#10b981";
        icon = "fa-bolt-lightning";
        dmgText = `⚡ ${typeof t === 'function' ? t('popup.double_dmg', { defaultValue: 'DAÑO DUPLICADO' }) : 'DAÑO DUPLICADO'}`;
        borderColor = "#10b981";
        boxShadow = "0 0 30px rgba(16, 185, 129, 0.6), 0 0 15px rgba(16, 185, 129, 0.4)";
        break;
      case '3B':
        title = typeof t === 'function' ? t('popup.triple_title', { defaultValue: 'TRIPLE (3B) 🔥' }) : 'TRIPLE (3B) 🔥';
        color = "#06b6d4";
        icon = "fa-fire";
        dmgText = `🔥 ${typeof t === 'function' ? t('popup.triple_dmg', { defaultValue: 'DAÑO TRIPLICADO' }) : 'DAÑO TRIPLICADO'}`;
        borderColor = "#06b6d4";
        boxShadow = "0 0 30px rgba(6, 182, 212, 0.6), 0 0 15px rgba(6, 182, 212, 0.4)";
        break;
      case 'HR':
        title = typeof t === 'function' ? t('popup.hr_title', { defaultValue: '¡JONRÓN! 🚀💥' }) : '¡JONRÓN! 🚀💥';
        color = "#eab308";
        icon = "fa-rocket";
        dmgText = `🚀 ${typeof t === 'function' ? t('popup.hr_dmg', { defaultValue: '¡DAÑO CRÍTICO MASIVO!' }) : '¡DAÑO CRÍTICO MASIVO!'}`;
        borderColor = "#eab308";
        boxShadow = "0 0 45px rgba(234, 179, 8, 0.7), 0 0 20px rgba(234, 179, 8, 0.5)";
        break;
      case 'STEAL':
        title = typeof t === 'function' ? t('popup.steal_title', { defaultValue: '¡ROBO DE BASE! 🏃⚡' }) : '¡ROBO DE BASE! 🏃⚡';
        color = "#38bdf8";
        icon = "fa-person-running";
        dmgText = `⚡ ${typeof t === 'function' ? t('popup.steal_dmg', { defaultValue: 'PITCHER DEBUFF: +20% DAÑO RECIBIDO' }) : 'PITCHER DEBUFF: +20% DAÑO RECIBIDO'}`;
        borderColor = "#38bdf8";
        boxShadow = "0 0 35px rgba(56, 189, 248, 0.7)";
        break;
      case 'E':
        title = typeof t === 'function' ? t('popup.error_title', { defaultValue: '¡ERROR RIVAL (E)!' }) : '¡ERROR RIVAL (E)!';
        color = "#fbbf24";
        icon = "fa-triangle-exclamation";
        dmgText = `💥 ${typeof t === 'function' ? t('popup.error_dmg', { defaultValue: 'EMBASADO EN 1B • FATIGA AL LANZADOR (+20% DAÑO)' }) : 'EMBASADO EN 1B • FATIGA AL LANZADOR (+20% DAÑO)'}`;
        borderColor = "#f59e0b";
        boxShadow = "0 0 40px rgba(245, 158, 11, 0.8), 0 0 20px rgba(245, 158, 11, 0.5)";
        break;
    }

    if (ev && ev.spdUpgraded) {
      const isEs = (typeof window.t === 'function' && window.t('hud.stage') !== 'Stage:');
      title = isEs
        ? `⚡ ¡${ev.spdUpgraded.from} ➔ ${ev.spdUpgraded.to}! 🏃`
        : `⚡ ${ev.spdUpgraded.from} ➔ ${ev.spdUpgraded.to}! 🏃`;
      color = "#38bdf8";
      icon = "fa-person-running";
      borderColor = "#38bdf8";
      boxShadow = "0 0 45px rgba(56, 189, 248, 0.8), 0 0 20px rgba(56, 189, 248, 0.5)";
      dmgText = isEs ? `⚡ ¡EXTRABASE POR VELOCIDAD! (+30 HP)` : `⚡ EXTRA-BASE HIT BY SPEED! (+30 HP)`;
    }

    // ── Audio: play sound for this outcome ───────────────────────────────────
    if (window.AudioManager) {
      switch (eventType) {
        case 'HR':    window.AudioManager.play('hr');  break;
        case '1B':
        case '2B':
        case '3B':    window.AudioManager.play('hit'); break;
        case 'SO':    window.AudioManager.play('so');  break;
        case 'OUT':   window.AudioManager.play('out'); break;
        case 'BB':    window.AudioManager.play('bb');  break;
        case 'E':     window.AudioManager.play('draft_pick'); break;
        case 'STEAL': window.AudioManager.play('draft_pick'); break;
        default: break;
      }
    }

    if (!title) return; // Ignore non-play events like NEXT_PITCHER

    // Visual diamond feedback on stolen base
    if (eventType === 'STEAL') {
      const base2El = document.getElementById('base-2');
      if (base2El) triggerBarShake(base2El, 'base-synergy-flash');
    }

    // Remove existing outcome popups to avoid stacking
    document.querySelectorAll('.outcome-popup-overlay').forEach(el => el.remove());

    const popup = document.createElement('div');
    popup.className = "outcome-popup-overlay";
    popup.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      z-index: 100;
      background: rgba(8, 12, 20, 0.96);
      border: 3px solid ${borderColor};
      border-radius: 16px;
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: ${boxShadow};
      pointer-events: none;
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      text-align: center;
      min-width: 260px;
      max-width: 320px;
    `;

    let cleanDetails = details ? details.replace(/🎲 \[\d+\] \[[^\]]+\] /, '').replace(/−/g, '-') : '';
    cleanDetails = cleanDetails.replace(/⚡\s*¡?CLUTCH PLAYER!?[^—\n]*[—\.]\s*(\(\+[^)]+\)\.?)?\s*/gi, '').replace(/^⚡\s*¡?CLUTCH PLAYER!?[^\.]*\.\s*/gi, '').trim();
    cleanDetails = cleanDetails.replace(/Anotan 0 carreras\.\s*/gi, '').replace(/0 runs scored\.\s*/gi, '').trim();
    // Shorten long error description text so the popup remains compact and punchy
    cleanDetails = cleanDetails.replace(/conecta rodado y el fildeador comete pifia/gi, 'se embasa por error').replace(/hits a grounder and the fielder commits an error/gi, 'reaches on fielding error');
    cleanDetails = cleanDetails.replace(/⚠️\s*(?:¡Pifia defensiva rival \(E\)!|Opponent fielding error \(E\)!)[^\.\n]*\./gi, '').trim();

    // SPD Hit Upgrade Highlight (1B -> 2B or 2B -> 3B)
    let spdUpgradeHTML = '';
    const spdUp = (ev && ev.spdUpgraded) ? ev.spdUpgraded : null;
    const spdMatch = cleanDetails.match(/⚡\s*SPD Proc\s*\(Grado\s*([^\)]+)\):\s*¡?([^!]+)!?/i);
    if (spdUp || spdMatch) {
      const fromType = spdUp ? spdUp.from : (spdMatch ? spdMatch[2].split('convertido en')[0].trim() : '1B');
      const toType = spdUp ? spdUp.to : (eventType || '2B');
      const grade = spdUp ? spdUp.grade : (spdMatch ? spdMatch[1].trim() : 'A');
      const batterName = (ev && ev.activeBatter) ? ev.activeBatter : '';
      
      cleanDetails = cleanDetails.replace(/⚡\s*SPD Proc[^\|\n]*(\||\.)?/gi, '').trim();

      const isEs = (typeof window.t === 'function' ? window.t('hud.stage') : 'Stage:') !== 'Stage:';
      const badgeTitle = isEs ? '⚡ ¡BASE EXTRA POR VELOCIDAD!' : '⚡ EXTRA BASE BY SPEED!';
      const badgeDesc = isEs
        ? `${batterName ? `¡<strong>${batterName}</strong> ` : ''}estiró el batazo (Grado ${grade}) (<strong>${fromType} ➔ ${toType}</strong>)`
        : `${batterName ? `<strong>${batterName}</strong> ` : ''}stretched the hit (Grade ${grade}) (<strong>${fromType} ➔ ${toType}</strong>)`;

      spdUpgradeHTML = `
      <div style="font-family:'Press Start 2P',monospace; font-size: 8px; color: #38bdf8; background: rgba(56, 189, 248, 0.16); border: 1.5px solid #38bdf8; padding: 6px 10px; border-radius: 8px; margin-bottom: 8px; width: 100%; line-height: 1.35; box-shadow: 0 0 12px rgba(56, 189, 248, 0.4); text-shadow: 0 0 6px #38bdf8;">
        ${badgeTitle}
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; font-weight: normal; color: #e0f2fe; margin-top: 3px; line-height: 1.3;">
          ${badgeDesc}
        </div>
      </div>`;

      const targetBaseId = toType === '3B' ? 'base-3' : 'base-2';
      const baseEl = document.getElementById(targetBaseId);
      if (baseEl) triggerBarShake(baseEl, 'base-synergy-flash');
      if (window.AudioManager) window.AudioManager.play('draft_pick');
    }

    // ── Universal Synergy & Trait Extraction (Clean & Condensed) ──
    const SYNERGY_PATTERNS = [
      { key: 'GENESIS CHAOS', regex: /(?:💥|⚠️)?\s*(?:Genesis Chaos|The Genesis Era)[:\s]*([^\|\n]+)/i, color: '#ff2ec4', icon: 'fa-skull-crossbones' },
      { key: 'SMALL BALL', regex: /(?:⏳)?\s*(?:Small Ball|Deadball)[:\s]*([^\|\n]+)/i, color: '#22d3ee', icon: 'fa-baseball' },
      { key: 'LIVEBALL SLUGGERS', regex: /(?:🔥)?\s*(?:Liveball Sluggers|Liveball|Golden Era)[:\s]*([^\|\n]+)/i, color: '#f59e0b', icon: 'fa-fire' },
      { key: 'FIVE-TOOL LEGENDS', regex: /(?:⭐)?\s*(?:Five-Tool Legends|Five-Tool|Integration)[:\s]*([^\|\n]+)/i, color: '#a855f7', icon: 'fa-star' },
      { key: 'SPEED & HUSTLE', regex: /(?:🏃)?\s*(?:Speed & Hustle|Expansion|Sinergia Speed & Hustle)[:\s]*([^\|\n]+)/i, color: '#38bdf8', icon: 'fa-bolt' },
      { key: 'ASTROTURF SPEEDSTERS', regex: /(?:🛼)?\s*(?:AstroTurf Speedsters|AstroTurf|Big Hair|Sinergia Big Hair)[:\s]*([^\|\n]+)/i, color: '#10b981', icon: 'fa-gauge-high' },
      { key: 'BASH BROTHERS', regex: /(?:💪)?\s*(?:Bash Brothers|Steroid Era)[:\s]*([^\|\n]+)/i, color: '#ef4444', icon: 'fa-dumbbell' },
      { key: 'MONEYBALL ANALYTICS', regex: /(?:📊)?\s*(?:Moneyball Analytics|Moneyball|Efficiency Era)[:\s]*([^\|\n]+)/i, color: '#14b8a6', icon: 'fa-chart-pie' },
      { key: 'THREE TRUE OUTCOMES', regex: /(?:🚀)?\s*(?:Three True Outcomes|Modern Era)[:\s]*([^\|\n]+)/i, color: '#ec4899', icon: 'fa-rocket' },
      { key: 'RESILIENCIA', regex: /(?:🛡️)?\s*(?:Resiliencia de Leyendas)[:\s]*([^\|\n]+)/i, color: '#3b82f6', icon: 'fa-shield-halved' },
      { key: 'PRESIÓN TEMPRANA', regex: /(?:⚡)?\s*(?:Presión Temprana)[:\s]*([^\|\n]+)/i, color: '#eab308', icon: 'fa-stopwatch' },
      { key: 'CADENA DE PODER', regex: /(?:🔥)?\s*(?:Cadena de Poder)[:\s]*([^\|\n]+)/i, color: '#f97316', icon: 'fa-link' },
      { key: 'EMBOSCADA', regex: /(?:💥)?\s*(?:Emboscada al Relevista)[:\s]*([^\|\n]+)/i, color: '#ef4444', icon: 'fa-crosshairs' },
      { key: 'GUANTE DE ORO', regex: /(?:🥊)?\s*(?:Guante de Oro)[:\s]*([^\|\n]+)/i, color: '#ffd700', icon: 'fa-mitten' },
      { key: 'VELOCISTAS', regex: /(?:⚡)?\s*(?:Velocistas Agresivos)[:\s]*([^\|\n]+)/i, color: '#06b6d4', icon: 'fa-person-running' }
    ];

    let extractedBadges = [];
    for (const syn of SYNERGY_PATTERNS) {
      const match = cleanDetails.match(syn.regex);
      if (match) {
        let desc = match[1].replace(/^[!¡\s]+|[!¡\s]+$/g, '').trim();
        // Remove the matched chunk from cleanDetails so text doesn't duplicate
        cleanDetails = cleanDetails.replace(match[0], '').replace(/\|/g, '').trim();
        extractedBadges.push({ title: syn.key, desc: desc, color: syn.color, icon: syn.icon });
      }
    }

    // Clean remaining pipes or stray punctuation
    cleanDetails = cleanDetails.replace(/\s*\|\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();

    let synergyHighlightHTML = '';
    if (extractedBadges.length > 0) {
      synergyHighlightHTML = extractedBadges.map(b => `
        <div style="font-family:'Press Start 2P',monospace; font-size: 7.5px; color: ${b.color}; background: rgba(0,0,0,0.4); border: 1.5px solid ${b.color}; padding: 5px 8px; border-radius: 6px; margin-bottom: 6px; width: 100%; box-shadow: 0 0 10px ${b.color}40; text-shadow: 0 0 6px ${b.color};">
          <i class="fa-solid ${b.icon}"></i> ${b.title}
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 500; color: #f8fafc; margin-top: 2px; line-height: 1.25; text-shadow:none;">
            ${b.desc}
          </div>
        </div>
      `).join('');

      if (window.AudioManager) window.AudioManager.play('draft_pick');
    }

    popup.innerHTML = `
      <div style="font-size: 32px; color: ${color}; margin-bottom: 8px; filter: drop-shadow(0 0 8px ${color});">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div style="font-family:'Press Start 2P',monospace; font-size: 12px; font-weight: bold; color: ${color}; text-shadow: 0 0 10px ${color}; margin-bottom: 8px;">
        ${title}
      </div>
      ${spdUpgradeHTML}
      ${cleanDetails ? `<div style="font-size: 11.5px; color: #e2e8f0; line-height: 1.35; margin-bottom: 8px;">${cleanDetails}</div>` : ''}
      ${synergyHighlightHTML}
      <div style="font-family:'Press Start 2P',monospace; font-size: 7.5px; color: #f59e0b; letter-spacing: 0.5px; border-top: 1px dashed rgba(255,255,255,0.15); width: 100%; padding-top: 8px; margin-top: 4px;">
        ${dmgText}
      </div>
    `;

    parent.style.position = "relative";
    parent.appendChild(popup);

    setTimeout(() => {
      popup.style.transform = "translate(-50%, -50%) scale(1)";
      popup.style.opacity = "1";
    }, 10);

    const displayTime = (ev && ev.spdUpgraded) ? 1400 : 1000;
    setTimeout(() => {
      popup.style.transform = "translate(-50%, -50%) scale(0.85)";
      popup.style.opacity = "0";
      setTimeout(() => {
        popup.remove();
      }, 250);
    }, displayTime);
  }

    const UNITS_TUMBLE_MS = 550;
  const TENS_TUMBLE_MS  = 850;

  // ── HANDLE ROLL DICE CLICK ───────────────────────────────────────────────────
  function handleRollDice() {
    if (!activeBattle || activeBattle.battleOver || isRolling) return;
    isRolling = true;

    const btn = document.getElementById('btn-roll-dice');
    if (btn) btn.disabled = true;

    const diceDisplay = document.getElementById('dice-result-display');
    const finalRoll = Math.floor(Math.random() * 100) + 1;

    // d100 as two d10s: tens digit + units digit (00/00 reads as 100, never as 0,
    // since finalRoll is always 1-100 — the combined readout below removes any doubt).
    const tensDigit  = Math.floor(finalRoll / 10) % 10;
    const unitsDigit = finalRoll % 10;

    const cubeUnits = document.getElementById('die-units-cube');
    const cubeTens  = document.getElementById('die-tens-cube');
    const faceUnits = document.getElementById('die-units-face-front');
    const faceTens  = document.getElementById('die-tens-face-front');

    // Decorative digits on the non-front faces (only glimpsed mid-spin) + the real
    // final digit on the front face — the tumble always ends on a multiple of 360°
    // on both axes, so the front face is guaranteed to be what's showing at rest.
    ['tens', 'units'].forEach(kind => {
      const die = document.getElementById(`die-${kind}`);
      if (!die) return;
      die.querySelectorAll('.d100-die-face:not(.face-front)').forEach(f => {
        f.innerText = Math.floor(Math.random() * 10);
      });
    });
    if (faceTens)  faceTens.innerText  = tensDigit;
    if (faceUnits) faceUnits.innerText = unitsDigit;

    if (cubeUnits) { cubeUnits.classList.remove('tumbling-units', 'die-settled'); void cubeUnits.offsetWidth; cubeUnits.classList.add('tumbling-units'); }
    if (cubeTens)  { cubeTens.classList.remove('tumbling-tens', 'die-settled');   void cubeTens.offsetWidth;  cubeTens.classList.add('tumbling-tens'); }
    if (window.AudioManager) window.AudioManager.play('menu_click');
    if (diceDisplay) { diceDisplay.innerText = '–'; diceDisplay.style.color = '#9ca3af'; }

    setTimeout(() => {
      if (cubeUnits) cubeUnits.classList.add('die-settled');
      if (window.AudioManager) window.AudioManager.play('menu_click');
    }, UNITS_TUMBLE_MS);

    diceAnimInterval = setTimeout(() => {
        if (cubeTens) cubeTens.classList.add('die-settled');
        if (window.AudioManager) window.AudioManager.play('menu_click');
        if (diceDisplay) {
          diceDisplay.innerText = finalRoll;
          const b = activeBattle.currentBoundaries();
          let rollColor = '#ef4444';
          if (b) {
            if (finalRoll <= b.bbEnd) rollColor = '#3b82f6';
            else if (finalRoll <= b.soEnd) rollColor = '#ef4444';
            else if (finalRoll <= b.outEnd) rollColor = '#9ca3af';
            else if (finalRoll <= b.singleEnd) rollColor = '#a7f3d0';
            else if (finalRoll <= b.doubleEnd) rollColor = '#10b981';
            else if (finalRoll <= b.tripleEnd) rollColor = '#06b6d4';
            else rollColor = '#eab308';
          }
          diceDisplay.style.color = rollColor;
        }
        // ── Build an ordered popup queue ───────────────────────────────────────
        // Popups fire in strict sequence: play outcome → steal → (next play) → KO last.
        // 'cursor' tracks the ms offset at which the NEXT popup should start.
        const events = activeBattle.rollDice(finalRoll) || [];
        const hasKO = events.some(ev => ev.playType === 'KO_PITCHER' || ev.eventType === 'KO');
        const POPUP_DURATION = 700; // ms a popup is visible
        const POPUP_GAP      = 100; // ms gap between consecutive popups
        let cursor = 0;

        // Phase 1: build popup schedule in correct visual order.
        // KO is always pushed last regardless of its position in events[].
        const popupQueue = []; // { type, text, ev, at }
        let koEntry = null;
        let koEvent = null;

        events.forEach(ev => {
          appendLogLine(ev); // Log immediately (no delay)
          const rawText = ev.playText || '';
          const isKO = ev.playType === 'KO_PITCHER' || ev.eventType === 'KO';

          if (isKO) {
            koEntry = { type: 'KO', text: rawText, ev };
            koEvent = ev;
            return; // defer to end
          }

          const hasSteal = Boolean(ev.didSteal || (rawText && (rawText.includes('🏃') || /ROBO DE BASE|STOLEN BASE/i.test(rawText))));
          let batterText = rawText;
          let stealText = '';

          if (hasSteal) {
            const stealIdx = rawText.search(/🏃\s*(?:¡?ROBO DE BASE!?|STOLEN BASE!?)/i);
            if (stealIdx !== -1) {
              batterText = rawText.slice(0, stealIdx).trim();
              stealText = rawText.slice(stealIdx).trim();
            } else if (rawText.includes('🏃')) {
              const parts = rawText.split('🏃');
              batterText = parts[0].trim();
              stealText = '🏃 ' + parts[1].trim();
            } else {
              stealText = `🏃 ${typeof window.t === 'function' ? window.t('sim.steal_label', '¡ROBO DE BASE!') : '¡ROBO DE BASE!'} ${ev.activeBatter || ''} ${typeof window.t === 'function' ? window.t('sim.steal_desc', 'se roba la segunda base') : 'se roba la segunda base'}.`;
            }
          }

          const thisPopupDuration = ev.spdUpgraded ? 1400 : POPUP_DURATION;
          popupQueue.push({ type: ev.eventType, text: batterText, ev, at: cursor });
          cursor += thisPopupDuration + POPUP_GAP;

          if (hasSteal) {
            popupQueue.push({ type: 'STEAL', text: stealText, ev, at: cursor });
            cursor += POPUP_DURATION + POPUP_GAP;
          }
        });

        // KO popup goes last — cursor is now past all play/steal popups
        if (koEntry) {
          popupQueue.push({ ...koEntry, at: cursor });
          // HP bar update fires just before the KO popup appears
          const koBarDelay = Math.max(cursor - POPUP_GAP, 0);
          setTimeout(() => {
            if (el.matchPitcherHpFill) {
              el.matchPitcherHpFill.style.width = '0%';
              if (el.matchPitcherHpText) el.matchPitcherHpText.innerText = '0 HP (K.O.)';
              el.matchPitcherHpFill.style.background = 'linear-gradient(90deg,#ff3333,#ff6666)';
              const pitcherHpWrap = el.matchPitcherHpFill.parentElement;
              if (pitcherHpWrap) triggerBarShake(pitcherHpWrap, 'hp-bar-hit');
            }
          }, koBarDelay);
          cursor += POPUP_DURATION + POPUP_GAP;
        }

        // Phase 2: fire all popups in computed order
        popupQueue.forEach(({ type, text, ev, at }) => {
          setTimeout(() => showOutcomePopup(type, text, ev), at);
        });


        const state = activeBattle.getState();

        if (hasKO) {
          // Immediately show 0 HP for KO'd pitcher on HUD
          if (el.matchPitcherHpFill) {
            el.matchPitcherHpFill.style.width = '0%';
            if (el.matchPitcherHpText) {
              const maxHp = state.activePitcher ? state.activePitcher.maxHp : 100;
              el.matchPitcherHpText.innerText = `0 HP (K.O.)`;
            }
            el.matchPitcherHpFill.style.background = 'linear-gradient(90deg,#ff3333,#ff6666)';
            const pitcherHpWrap = el.matchPitcherHpFill.parentElement;
            if (pitcherHpWrap) triggerBarShake(pitcherHpWrap, 'hp-bar-hit');
          }
          // Update rest of HUD except pitcher HP
          updateMatchHUD(state, { skipPitcherHP: true });

          // Re-enable roll button and sync HUD after KO sequence and bullpen entrance finish
          const switchDelay = cursor + 2500;
          setTimeout(() => {
            if (activeBattle && state.activePitcher && !activeBattle.battleOver) {
              updateMatchHUD(state);
            }
            if (btn && activeBattle && !activeBattle.battleOver) btn.disabled = false;
          }, switchDelay);
        } else {
          updateMatchHUD(state);
        }

        renderZones();

        if (activeBattle && activeBattle.battleOver) {
          const delay = Math.max(900, cursor + (hasKO ? 1800 : 0)); // wait for all popups/KO juice to finish first
          setTimeout(() => {
            if (activeBattle && activeBattle.battleOver) {
              handleBattleOver();
            }
          }, delay);
        } else if (activeBattle && activeBattle.pendingDefenseEvent) {
          const defEvent = activeBattle.pendingDefenseEvent;
          const delay = Math.max(100, cursor + (hasKO ? 1200 : 0));
          setTimeout(() => {
            if (!activeBattle) return;
            showMidInningDefenseModal(defEvent, () => {
              if (!activeBattle) return;
              const freshState = activeBattle.getState();
              updateMatchHUD(freshState);
              updateFaceoffPanel(freshState);
              renderZones();
              if (activeBattle && activeBattle.battleOver) {
                handleBattleOver();
              } else {
                if (freshState.inning >= 4 && !activeBattle._seenExtraInningsIntro) {
                  activeBattle._seenExtraInningsIntro = true;
                  showExtraInningsIntroModal(() => {
                    if (btn && activeBattle && !activeBattle.battleOver) btn.disabled = false;
                  });
                } else {
                  if (btn && activeBattle && !activeBattle.battleOver) btn.disabled = false;
                }
              }
            });
          }, delay);
        } else {
          // Re-enable button & re-render faceoff cards when popups finish
          if (!hasKO) {
            setTimeout(() => {
              if (btn && activeBattle && !activeBattle.battleOver) btn.disabled = false;
              if (activeBattle) updateFaceoffPanel(state);
            }, Math.max(50, cursor));
          }
        }

        setTimeout(() => {
          isRolling = false;
        }, Math.max(50, cursor + 300));
    }, TENS_TUMBLE_MS);
  }

  function showExtraInningsIntroModal(onClose) {
    const modal = document.getElementById('modal-extra-innings-intro');
    if (!modal) {
      if (onClose) onClose();
      return;
    }
    if (window.I18n && typeof window.I18n.updateDOM === 'function') {
      window.I18n.updateDOM();
    }
    modal.classList.remove('hidden');
    if (window.AudioManager && typeof window.AudioManager.play === 'function') {
      window.AudioManager.play('danger_stinger');
    }
    const btn = document.getElementById('btn-close-extra-innings-intro');
    if (btn) {
      const handleClose = () => {
        modal.classList.add('hidden');
        btn.removeEventListener('click', handleClose);
        if (onClose) onClose();
      };
      btn.addEventListener('click', handleClose);
    }
  }

  function showMidInningDefenseModal(defEvent, onComplete) {
    const modal = document.getElementById('modal-mid-inning-defense');
    if (!modal || !defEvent) {
      if (onComplete) onComplete();
      return;
    }

    const _t = (key, params, fallback) => {
      if (typeof window.t === 'function') {
        const val = window.t(key, { ...(params || {}), defaultValue: fallback });
        if (val && val !== key) return val;
      }
      return fallback || key;
    };

    const badgeEl = document.getElementById('def-modal-inning-badge');
    const titleEl = document.getElementById('def-modal-title');
    const descEl = document.getElementById('def-modal-scenario');
    const walkOffWarningEl = document.getElementById('def-modal-walkoff-warning');
    const fielderCardEl = document.getElementById('def-modal-fielder-card');
    const actionZone = document.getElementById('def-modal-action-zone');
    const resultZone = document.getElementById('def-modal-result-zone');
    const btnRoll = document.getElementById('btn-def-modal-roll');
    const defCubeUnits = document.getElementById('def-die-units-cube');
    const defCubeTens  = document.getElementById('def-die-tens-cube');
    const defFaceUnits = document.getElementById('def-die-units-face-front');
    const defFaceTens  = document.getElementById('def-die-tens-face-front');
    const defDiceDisplay = document.getElementById('def-dice-result-display');
    const catchBar = document.getElementById('def-gauge-catch-bar');
    const needleEl = document.getElementById('def-gauge-needle');
    const threshVal = document.getElementById('def-gauge-thresh-val');
    const errorStartVal = document.getElementById('def-gauge-error-start');
    const catchLabelEl = document.getElementById('def-gauge-catch-label');
    const errorLabelEl = document.getElementById('def-gauge-error-label');
    const tacticSafe = document.getElementById('def-tactic-safe');
    const tacticClutch = document.getElementById('def-tactic-clutch');
    const speedTag = document.getElementById('def-field-speed-val');
    const posTag = document.getElementById('def-field-pos-val');
    const svgTrajectory = document.getElementById('def-svg-trajectory');
    const svgBall = document.getElementById('def-svg-ball');
    const svgPositionsGroup = document.getElementById('def-svg-positions-group');

    // Play tension intro audio
    if (window.AudioManager) window.AudioManager.play('defense_tension_intro');

    const targetPos = defEvent.pos || 'SS';

    if (badgeEl) {
      if (defEvent.inning >= 3) {
        const walkOffBadge = _t('sim.def_walkoff_badge', { inning: defEvent.inning }, `💀 BAJA DE LA ENTRADA ${defEvent.inning} • ¡PELIGRO DE WALK-OFF! 💀`);
        badgeEl.innerHTML = `<span style="color:#ef4444;text-shadow:0 0 10px #ef4444;font-weight:bold;animation:pulse-fast 1s infinite;">${walkOffBadge}</span>`;
        badgeEl.style.borderColor = '#ef4444';
        badgeEl.style.background = 'rgba(239, 68, 68, 0.2)';
      } else {
        badgeEl.innerHTML = _t('sim.def_badge', { inning: defEvent.inning }, `🛡️ BAJA DEL INNING ${defEvent.inning} • PRUEBA DEFENSIVA`);
        badgeEl.style.borderColor = '';
        badgeEl.style.background = '';
      }
    }

    if (walkOffWarningEl) {
      if (defEvent.inning >= 3) {
        walkOffWarningEl.classList.remove('hidden');
      } else {
        walkOffWarningEl.classList.add('hidden');
      }
    }
    if (titleEl) {
      titleEl.innerText = _t(`sim.def_title_${targetPos.toLowerCase()}`, {}, defEvent.scenarioTitle || '¡BATAZO DE PELIGRO RIVAL!');
    }
    if (descEl) {
      descEl.innerText = _t(`sim.def_desc_${targetPos.toLowerCase()}`, {}, defEvent.scenarioDesc || 'El rival conecta una línea quemante hacia la posición defensiva.');
    }

    // ── Field Coordinates & Interactive SVG Diamond ─────────────────────────
    const POS_COORDS = {
      'C':  { x: 150, y: 156, label: 'C' },
      '1B': { x: 212, y: 114, label: '1B' },
      '2B': { x: 175, y: 78,  label: '2B' },
      '3B': { x: 88,  y: 114, label: '3B' },
      'SS': { x: 125, y: 78,  label: 'SS' },
      'LF': { x: 75,  y: 42,  label: 'LF' },
      'CF': { x: 150, y: 25,  label: 'CF' },
      'RF': { x: 225, y: 42,  label: 'RF' }
    };

    const targetCoord = POS_COORDS[targetPos] || POS_COORDS['SS'];

    const speedLabel = _t('sim.def_speed_label', {}, 'VELOCIDAD');
    const zoneLabel = _t('sim.def_zone_label', {}, 'ZONA');

    if (speedTag && speedTag.parentElement) {
      speedTag.parentElement.innerHTML = `<span style="color:#ef4444;">⚡ ${speedLabel}:</span> <span id="def-field-speed-val">${defEvent.exitVelocity || 104} MPH</span>`;
    }
    if (posTag && posTag.parentElement) {
      posTag.parentElement.innerHTML = `🎯 <span>${zoneLabel}:</span> <span id="def-field-pos-val">${targetPos}</span>`;
    }

    if (svgTrajectory) {
      svgTrajectory.setAttribute('x1', '150');
      svgTrajectory.setAttribute('y1', '155');
      svgTrajectory.setAttribute('x2', String(targetCoord.x));
      svgTrajectory.setAttribute('y2', String(targetCoord.y));
    }

    if (svgBall) {
      svgBall.setAttribute('cx', '150');
      svgBall.setAttribute('cy', '155');
      svgBall.setAttribute('fill', '#ffffff');
      svgBall.setAttribute('stroke', '#ef4444');
    }

    if (svgPositionsGroup) {
      let groupHtml = '';
      Object.keys(POS_COORDS).forEach(k => {
        const c = POS_COORDS[k];
        const isTarget = (k === targetPos);
        if (isTarget) {
          groupHtml += `
            <g class="def-pos-target-node" transform="translate(${c.x}, ${c.y})">
              <circle r="14" fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.8">
                <animate attributeName="r" values="8;20" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0" dur="1.4s" repeatCount="indefinite" />
              </circle>
              <circle r="10" fill="#0f172a" stroke="#fbbf24" stroke-width="2" />
              <text y="1" font-size="7" font-weight="bold" fill="#fef08a">${c.label}</text>
            </g>
          `;
        } else {
          groupHtml += `
            <g class="def-pos-node" transform="translate(${c.x}, ${c.y})">
              <circle r="7" fill="rgba(15,23,42,0.8)" stroke="#64748b" stroke-width="1" />
              <text y="1" font-size="6" fill="#94a3b8">${c.label}</text>
            </g>
          `;
        }
      });
      svgPositionsGroup.innerHTML = groupHtml;
    }

    // ── Current Team HP & Shield Indicator ──────────────────────────────────
    const hpStatusEl = document.getElementById('def-modal-hp-status');
    const currentHp = (defEvent.currentHP !== undefined) ? defEvent.currentHP : ((window.Game && window.Game.teamHP) || 100);
    const currentShield = (defEvent.currentShield !== undefined) ? defEvent.currentShield : 0;
    const maxShield = (defEvent.maxShield !== undefined) ? defEvent.maxShield : 0;

    let hpColor = '#10b981';
    if (currentHp <= 25) hpColor = '#ef4444';
    else if (currentHp <= 50) hpColor = '#f59e0b';

    const hpLabel = _t('sim.def_current_hp_label', {}, '❤️ HP DEL EQUIPO');
    const shieldLabel = _t('sim.def_current_shield_label', {}, '🛡️ ESCUDO');

    if (hpStatusEl) {
      hpStatusEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="color:#94a3b8;font-size:7px;">${hpLabel}:</span>
          <strong style="color:${hpColor};font-size:10px;text-shadow:0 0 8px ${hpColor}66;">${currentHp}/100</strong>
        </div>
        ${maxShield > 0 ? `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#38bdf8;font-size:7px;">${shieldLabel}:</span>
            <strong style="color:#7dd3fc;font-size:9px;">${currentShield}/${maxShield}</strong>
          </div>
        ` : ''}
      `;
    }

    // ── Tactical Strategy Choice & Gauge Setup ─────────────────────────────
    let isClutch = false;
    const baseThresh = Math.max(20, Math.min(99, defEvent.successThreshold || 75));

    function updateTacticsUI() {
      const currentThresh = isClutch ? Math.max(10, baseThresh - 12) : baseThresh;
      if (catchBar) catchBar.style.width = `${currentThresh}%`;
      
      const catchZoneText = _t('sim.def_catch_zone', {}, 'ZONA DE ATRAPADA');
      const errorZoneText = _t('sim.def_error_zone', {}, 'ERROR');

      if (catchLabelEl) {
        catchLabelEl.innerHTML = `🟢 ${catchZoneText} (1–<span id="def-gauge-thresh-val">${currentThresh}</span>)`;
      }
      if (errorLabelEl) {
        const errorZoneLabel = defEvent.isExtraInning
          ? `💀 ${_t('sim.def_walkoff_title', {}, '¡WALK-OFF RIVAL / DERROTA!')}`
          : `🔴 ${errorZoneText}`;
        errorLabelEl.innerHTML = `${errorZoneLabel} (<span id="def-gauge-error-start">${Math.min(100, currentThresh + 1)}</span>–100)`;
      }

      if (needleEl) {
        needleEl.style.display = 'none';
        needleEl.style.left = '0%';
      }

      if (tacticSafe) {
        tacticSafe.classList.toggle('active', !isClutch);
        const safeTitle = tacticSafe.querySelector('.def-tactic-title');
        const safeDesc = tacticSafe.querySelector('.def-tactic-desc');
        if (safeTitle) safeTitle.innerText = _t('sim.def_safe_tactic_title', {}, '🛡️ JUGADA REGULAR');
        if (safeDesc) safeDesc.innerText = _t('sim.def_safe_tactic_desc', {}, 'Asegurar el guante (Meta estándar • +40 Escudo)');
      }
      if (tacticClutch) {
        tacticClutch.classList.toggle('active', isClutch);
        const clutchTitle = tacticClutch.querySelector('.def-tactic-title');
        const clutchDesc = tacticClutch.querySelector('.def-tactic-desc');
        if (clutchTitle) clutchTitle.innerText = _t('sim.def_clutch_tactic_title', {}, '⚡ JUGADA DE LUJO');
        if (clutchDesc) clutchDesc.innerText = _t('sim.def_clutch_tactic_desc', {}, 'Tirarse de cabeza (-12% Meta • +80 Escudo)');
      }

      if (btnRoll) {
        btnRoll.innerHTML = isClutch
          ? _t('sim.def_clutch_btn_label', { thresh: currentThresh }, `⚡ ¡TIRARSE DE CABEZA! (Dado 1 al ${currentThresh})`)
          : _t('sim.def_safe_btn_label', { thresh: currentThresh }, `🧤 ¡ASEGURAR EL GUANTE! (Dado 1 al ${currentThresh})`);
      }
    }

    if (tacticSafe) {
      tacticSafe.onclick = () => {
        if (btnRoll && btnRoll.disabled) return;
        isClutch = false;
        updateTacticsUI();
        if (window.AudioManager) window.AudioManager.play('menu_click');
      };
    }

    if (tacticClutch) {
      tacticClutch.onclick = () => {
        if (btnRoll && btnRoll.disabled) return;
        isClutch = true;
        updateTacticsUI();
        if (window.AudioManager) window.AudioManager.play('menu_click');
      };
    }

    updateTacticsUI();

    // Reset 3D dice cubes
    if (defFaceTens) defFaceTens.innerText = '0';
    if (defFaceUnits) defFaceUnits.innerText = '0';
    if (defDiceDisplay) {
      defDiceDisplay.innerText = '–';
      defDiceDisplay.style.color = '#fff';
    }
    if (defCubeTens) defCubeTens.classList.remove('tumbling-tens', 'die-settled');
    if (defCubeUnits) defCubeUnits.classList.remove('tumbling-units', 'die-settled');

    const p = defEvent.player || {};
    const gradeObj = getStatGrade(defEvent.effDef || 50);
    const isGoldGlove = (defEvent.effDef >= 90);
    const oopBadge = defEvent.isOOP
      ? `<span style="font-size:8px;color:#f87171;font-weight:bold;margin-left:4px;">${_t('sim.def_oop_badge', {}, '⚠️ (Fuera de Posición -35% DEF)')}</span>`
      : (isGoldGlove ? `<span style="font-size:8px;color:#fef08a;font-weight:bold;margin-left:4px;">${_t('sim.def_gold_glove_badge', {}, '🥇 GUANTE DE ORO')}</span>` : '');

    const statTotalLabel = _t('sim.def_stat_total', {}, 'Defensa Total:');
    const gradeLabel = _t('sim.def_grade_label', {}, 'Grado');
    const hitTypeLabel = _t('sim.def_hit_type', {}, 'Batazo:');
    const localizedBallType = _t(`sim.def_ball_${targetPos.toLowerCase()}`, {}, defEvent.ballType || 'Línea de peligro');

    if (fielderCardEl) {
      fielderCardEl.innerHTML = `
        <div class="def-fielder-avatar">
          ${defEvent.scenarioIcon || '🧤'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:bold;color:#fff;font-size:12.5px;display:flex;align-items:center;gap:6px;">
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:0.5px;">${p.name || 'Defensor'}</span>
            <span style="font-family:'Press Start 2P',monospace;font-size:8.5px;color:#38bdf8;flex-shrink:0;">[${defEvent.pos}]</span>
          </div>
          <div style="font-size:10.5px;color:#cbd5e1;margin-top:2px;">
            ${statTotalLabel} <strong style="color:${gradeObj.color};font-size:11.5px;">${defEvent.effDef} (${gradeLabel} ${gradeObj.text})</strong> ${oopBadge}
          </div>
          <div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">
            ${hitTypeLabel} <strong style="color:#fecdd3;">${localizedBallType}</strong> (${defEvent.exitVelocity || 104} MPH)
          </div>
        </div>
      `;
    }

    actionZone.classList.remove('hidden');
    resultZone.classList.add('hidden');
    resultZone.innerHTML = '';
    btnRoll.disabled = false;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.scrollTop = 0;
    const defBoxEl = modal.querySelector('.def-modal-box');
    if (defBoxEl) defBoxEl.scrollTop = 0;

    btnRoll.onclick = () => {
      btnRoll.disabled = true;
      btnRoll.innerHTML = _t('sim.def_rolling', {}, '⚾ ¡FILDEANDO EN EL CAMPO...!');

      // Animate Ball Flight from Home to Target Position
      if (svgBall) {
        const startTime = Date.now();
        const duration = UNITS_TUMBLE_MS;
        const startX = 150, startY = 155;
        const endX = targetCoord.x, endY = targetCoord.y;

        const animateBall = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / duration);
          const currentX = startX + (endX - startX) * progress;
          const currentY = startY + (endY - startY) * progress;
          svgBall.setAttribute('cx', String(currentX));
          svgBall.setAttribute('cy', String(currentY));
          if (progress < 1) {
            requestAnimationFrame(animateBall);
          }
        };
        requestAnimationFrame(animateBall);
      }

      const finalRoll = Math.floor(Math.random() * 100) + 1;

      let tensDigit, unitsDigit;
      if (finalRoll === 100) {
        tensDigit = 0;
        unitsDigit = 0;
      } else {
        tensDigit  = Math.floor(finalRoll / 10);
        unitsDigit = finalRoll % 10;
      }

      ['tens', 'units'].forEach(kind => {
        const die = document.getElementById(`def-die-${kind}`);
        if (!die) return;
        die.querySelectorAll('.d100-die-face:not(.face-front)').forEach(f => {
          f.innerText = Math.floor(Math.random() * 10);
        });
      });
      if (defFaceTens)  defFaceTens.innerText  = tensDigit;
      if (defFaceUnits) defFaceUnits.innerText = unitsDigit;

      if (defCubeUnits) { defCubeUnits.classList.remove('tumbling-units', 'die-settled'); void defCubeUnits.offsetWidth; defCubeUnits.classList.add('tumbling-units'); }
      if (defCubeTens)  { defCubeTens.classList.remove('tumbling-tens', 'die-settled');   void defCubeTens.offsetWidth;  defCubeTens.classList.add('tumbling-tens'); }
      
      // Play high-tension escalating roll audio
      if (window.AudioManager) window.AudioManager.play('defense_dice_roll');
      if (defDiceDisplay) { defDiceDisplay.innerText = '–'; defDiceDisplay.style.color = '#9ca3af'; }

      setTimeout(() => {
        if (defCubeUnits) defCubeUnits.classList.add('die-settled');
        if (window.AudioManager) window.AudioManager.play('menu_click');
      }, UNITS_TUMBLE_MS);

      setTimeout(() => {
        if (defCubeTens) defCubeTens.classList.add('die-settled');
        
        const result = activeBattle.resolveMidInningDefense(finalRoll, defEvent, isClutch);
        const isSuccess = result.isSuccess;
        const totalLostDmg = (result.shieldDmg || 0) + (result.teamHpDmg || 0);
        
        // Show gauge needle position
        if (needleEl) {
          needleEl.style.display = 'block';
          needleEl.style.left = `${Math.min(100, Math.max(0, finalRoll))}%`;
          needleEl.style.background = isSuccess ? '#4ade80' : '#f43f5e';
          needleEl.style.boxShadow = isSuccess ? '0 0 10px #4ade80, 0 0 16px #34d399' : '0 0 10px #f43f5e, 0 0 16px #e11d48';
        }

        if (defDiceDisplay) {
          defDiceDisplay.innerText = finalRoll;
          defDiceDisplay.style.color = isSuccess ? '#4ade80' : '#f43f5e';
          defDiceDisplay.style.textShadow = isSuccess ? '0 0 15px rgba(74, 222, 128, 0.8)' : '0 0 15px rgba(244, 63, 94, 0.8)';
        }

        if (isSuccess) {
          if (svgBall) {
            svgBall.setAttribute('fill', '#fef08a');
            svgBall.setAttribute('stroke', '#ca8a04');
          }
          if (window.AudioManager) window.AudioManager.play('defense_gold_glove');
          showOutcomePopup('DEF_WIN', `🛡️ ${_t('sim.def_success_banner_title', {}, '¡JUGADA DE GUANTE DE ORO!')}\n+${result.hpHealed} HP | +${result.shieldHealed} ${_t('common.shield', {}, 'ESCUDO')}`);
        } else {
          if (svgBall) {
            svgBall.setAttribute('fill', '#ef4444');
            svgBall.setAttribute('cx', String(targetCoord.x + (targetCoord.x > 150 ? 25 : -25)));
            svgBall.setAttribute('cy', String(targetCoord.y - 15));
          }
          if (window.Game) {
            window.Game.defensiveErrors = (window.Game.defensiveErrors || 0) + 1;
            if (window.Game.runStats) {
              window.Game.runStats.errors = (window.Game.runStats.errors || 0) + 1;
            }
            const fielder = (window.Game.roster && targetPos) ? window.Game.roster[targetPos] : null;
            if (fielder && fielder.name) {
              window.Game.runBatterStats = window.Game.runBatterStats || {};
              const fName = fielder.name.replace(/\s*\(\d{4}\)$/, '').trim();
              if (!window.Game.runBatterStats[fName]) {
                window.Game.runBatterStats[fName] = { g: 0, ab: 0, h: 0, bb: 0, so: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, sb: 0, e: 0 };
              }
              const s = window.Game.runBatterStats[fName];
              s.e = (s.e || 0) + 1;
            }
          }
          if (window.AudioManager) window.AudioManager.play('defense_error');
          showOutcomePopup('DEF_LOSE', `⚠️ ${_t('sim.def_fail_banner_title', {}, '¡ERROR DEFENSIVO!')}\n-${totalLostDmg} ${_t('common.damage', {}, 'DAÑO')}`);
          const modalBox = modal.querySelector('.def-modal-box');
          if (modalBox) {
            modalBox.style.animation = 'none';
            void modalBox.offsetWidth;
            modalBox.style.animation = 'shake 0.5s ease';
          }
        }

        actionZone.classList.add('hidden');
        resultZone.classList.remove('hidden');

        const nextInningNum = (defEvent.inning || 1) + 1;
        const isWalkOffFail = (!isSuccess && (result.isWalkOff || defEvent.inning >= 3));
        const continueBtnText = isWalkOffFail
          ? _t('sim.def_walkoff_view_results', {}, '💀 VER RESULTADOS DEL PARTIDO')
          : _t('sim.def_continue', { nextInning: nextInningNum }, `⚾ CONTINUAR AL INNING ${nextInningNum}`);
        const tacticName = isClutch ? _t('sim.def_clutch_name', {}, '⚡ Jugada de Lujo') : _t('sim.def_safe_name', {}, '🛡️ Jugada Regular');
        const stratLabel = _t('sim.def_strategy_label', {}, 'Estrategia:');
        const rollLabel = _t('sim.def_roll_label', {}, 'Dado:');
        const targetLabel = _t('sim.def_target_label', {}, 'Meta:');

        const gainBanner = _t('sim.def_gain_success', { shield: result.shieldHealed }, `🟢 ¡REPARASTE +${result.shieldHealed} DE ESCUDO!`);
        const walkOffBanner = _t('sim.def_walkoff_result_desc', { inning: defEvent.inning }, `💀 Error en la baja de la entrada ${defEvent.inning}. ¡El rival anota la carrera de oro!`);
        const lossBanner = isWalkOffFail ? walkOffBanner : _t('sim.def_loss_fail', { dmg: totalLostDmg, shieldDmg: result.shieldDmg, hpDmg: result.teamHpDmg }, `🔴 ¡PERDISTE -${totalLostDmg} DE DAÑO! (Escudo: -${result.shieldDmg} • HP: -${result.teamHpDmg})`);
        const maxShield = activeBattle ? activeBattle.teamShieldMax : 50;
        const teamStatus = isWalkOffFail
          ? `<span style="color:#ef4444;font-weight:bold;">¡DERROTA POR WALK-OFF!</span>`
          : _t('sim.def_team_status', { hp: result.teamHP, shield: result.teamShield, shieldMax: maxShield }, `Equipo: HP ${result.teamHP}/100 • Escudo ${result.teamShield}/${maxShield}`);

        const resultCardTitle = isSuccess
          ? _t('sim.def_success_banner_title', {}, '🥇 ¡JUGADA DE GUANTE DE ORO!')
          : (isWalkOffFail ? _t('sim.def_walkoff_result_title', {}, '💀 ¡WALK-OFF RIVAL! DERROTA INMEDIATA') : _t('sim.def_fail_banner_title', {}, '⚠️ ¡BATAZO DE HIT / ERROR DEFENSIVO!'));

        resultZone.innerHTML = `
          <div class="${isSuccess ? 'def-result-card-success' : 'def-result-card-error'}">
            <div style="font-family:'Press Start 2P',monospace;font-size:10.5px;margin-bottom:6px;letter-spacing:0.5px;color:${isSuccess ? '#fef08a' : '#fda4af'};">
              ${resultCardTitle}
            </div>
            <div style="font-size:11px;margin-bottom:8px;color:${isSuccess ? '#ecfdf5' : '#fff1f2'};">
              ${stratLabel} <strong>${tacticName}</strong> • ${rollLabel} <strong style="font-size:14px;color:${isSuccess ? '#4ade80' : '#f87171'};">${finalRoll}</strong> (${targetLabel} 1–${result.targetThreshold})
            </div>
            <div style="background:rgba(0,0,0,0.35);border:1px solid ${isSuccess ? '#34d399' : '#f43f5e'};border-radius:8px;padding:8px 10px;margin-bottom:10px;">
              <div style="font-size:12.5px;font-weight:bold;color:${isSuccess ? '#4ade80' : '#f87171'};letter-spacing:0.5px;">
                ${isSuccess ? gainBanner : lossBanner}
              </div>
              <div style="font-size:10px;color:#cbd5e1;margin-top:4px;">
                ${teamStatus}
              </div>
            </div>
            <button class="def-roll-btn" id="btn-def-modal-continue" style="background:${isSuccess ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#e11d48,#be123c)'}!important;border-color:${isSuccess ? '#34d399' : '#f43f5e'}!important;box-shadow:0 0 15px ${isSuccess ? 'rgba(52,211,153,0.4)' : 'rgba(244,63,94,0.4)'}!important;">
              ${continueBtnText} ➔
            </button>
          </div>
        `;

        if (activeBattle) {
          const curState = activeBattle.getState();
          updateMatchHUD(curState);
        }
        if (!result.isSuccess) {
          if (el.matchTeamHpFill && el.matchTeamHpFill.parentElement) {
            triggerBarShake(el.matchTeamHpFill.parentElement, 'hp-bar-hit');
          }
        }

        const btnContinue = document.getElementById('btn-def-modal-continue');
        if (btnContinue) {
          btnContinue.onclick = () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            if (onComplete) onComplete();
          };
        }
      }, TENS_TUMBLE_MS);
    };
  }

  let autoSimTimer = null;
  let isAutoSimulating = false;

  function stopAutoSimulate() {
    if (autoSimTimer) {
      clearTimeout(autoSimTimer);
      autoSimTimer = null;
    }
    isAutoSimulating = false;
    isRolling = false;

    const btnRoll = document.getElementById('btn-roll-dice');
    const btnSkip = document.getElementById('btn-match-skip-game');
    if (btnRoll && activeBattle && !activeBattle.battleOver) btnRoll.disabled = false;
    if (btnSkip) {
      const isEs = (typeof t === 'function' && t('hud.stage') !== 'Stage:');
      btnSkip.innerHTML = `<i class="fa-solid fa-forward-fast"></i> ${isEs ? '⏩ AUTO-PLAY RÁPIDO' : '⏩ FAST AUTO-PLAY'}`;
      btnSkip.style.background = 'linear-gradient(135deg,#dc2626,#ef4444)';
      btnSkip.style.boxShadow = '0 0 14px rgba(220,38,38,0.4)';
    }
  }

  function handleSimulateAll() {
    if (!activeBattle || activeBattle.battleOver) return;

    if (isAutoSimulating) {
      stopAutoSimulate();
      return;
    }

    isAutoSimulating = true;
    isRolling = true;

    const btnRoll = document.getElementById('btn-roll-dice');
    const btnSkip = document.getElementById('btn-match-skip-game');
    if (btnRoll) btnRoll.disabled = true;
    if (btnSkip) {
      const isEs = (typeof t === 'function' && t('hud.stage') !== 'Stage:');
      btnSkip.innerHTML = `<i class="fa-solid fa-pause"></i> ${isEs ? '⏸️ PAUSAR AUTO' : '⏸️ PAUSE AUTO'}`;
      btnSkip.style.background = 'linear-gradient(135deg,#059669,#10b981)';
      btnSkip.style.boxShadow = '0 0 16px rgba(16,185,129,0.6)';
    }

    const runTurboStep = () => {
      if (!activeBattle || activeBattle.battleOver || !isAutoSimulating) {
        stopAutoSimulate();
        if (activeBattle && activeBattle.battleOver) {
          handleBattleOver();
        }
        return;
      }

      const finalRoll = Math.floor(Math.random() * 100) + 1;
      const tensDigit  = Math.floor(finalRoll / 10) % 10;
      const unitsDigit = finalRoll % 10;

      const diceDisplay = document.getElementById('dice-result-display');
      const faceUnits = document.getElementById('die-units-face-front');
      const faceTens  = document.getElementById('die-tens-face-front');
      const cubeUnits = document.getElementById('die-units-cube');
      const cubeTens  = document.getElementById('die-tens-cube');

      if (faceTens)  faceTens.innerText  = tensDigit;
      if (faceUnits) faceUnits.innerText = unitsDigit;
      if (diceDisplay) {
        diceDisplay.innerText = finalRoll;
        const b = (activeBattle && typeof activeBattle.currentBoundaries === 'function') ? activeBattle.currentBoundaries() : null;
        if (b) {
          let rollColor = '#fff';
          if (finalRoll <= b.bbEnd) rollColor = '#3b82f6';
          else if (finalRoll <= b.soEnd) rollColor = '#ef4444';
          else if (finalRoll <= b.outEnd) rollColor = '#9ca3af';
          else if (finalRoll <= b.singleEnd) rollColor = '#a7f3d0';
          else if (finalRoll <= b.doubleEnd) rollColor = '#10b981';
          else if (finalRoll <= b.tripleEnd) rollColor = '#06b6d4';
          else rollColor = '#eab308';
          diceDisplay.style.color = rollColor;
        }
      }

      if (cubeUnits) { cubeUnits.classList.remove('tumbling-units', 'die-settled'); void cubeUnits.offsetWidth; cubeUnits.classList.add('die-settled'); }
      if (cubeTens)  { cubeTens.classList.remove('tumbling-tens', 'die-settled'); void cubeTens.offsetWidth; cubeTens.classList.add('die-settled'); }

      if (window.AudioManager) window.AudioManager.play('menu_click');

      const events = activeBattle.rollDice(finalRoll) || [];
      if (events && Array.isArray(events)) {
        events.forEach(ev => {
          appendLogLine(ev);
          if (ev.playType === 'KO_PITCHER' || ev.eventType === 'KO') {
            if (window.AudioManager) window.AudioManager.play('pitcher_ko');
          }
        });
      }

      if (activeBattle.pendingDefenseEvent && !activeBattle.battleOver) {
        const defEvent = activeBattle.pendingDefenseEvent;
        const defRoll = Math.floor(Math.random() * 100) + 1;
        const defRes = activeBattle.resolveMidInningDefense(defRoll, defEvent);

        if (defRes && !defRes.isSuccess && window.Game) {
          window.Game.defensiveErrors = (window.Game.defensiveErrors || 0) + 1;
          if (window.Game.runStats) {
            window.Game.runStats.errors = (window.Game.runStats.errors || 0) + 1;
          }
          const fielder = (defEvent && defEvent.player) ? defEvent.player : (defEvent && defEvent.pos && window.Game.roster ? window.Game.roster[defEvent.pos] : null);
          if (fielder && fielder.name) {
            window.Game.runBatterStats = window.Game.runBatterStats || {};
            const fName = fielder.name.replace(/\s*\(\d{4}\)$/, '').trim();
            if (!window.Game.runBatterStats[fName]) {
              window.Game.runBatterStats[fName] = { g: 0, ab: 0, h: 0, bb: 0, so: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, sb: 0, e: 0 };
            }
            window.Game.runBatterStats[fName].e = (window.Game.runBatterStats[fName].e || 0) + 1;
          }
        }

        const lastEv = activeBattle.events && activeBattle.events.length ? activeBattle.events[activeBattle.events.length - 1] : null;
        if (lastEv && lastEv.playType === 'DEFENSE_PLAY') {
          appendLogLine(lastEv);
        }

        if (activeBattle) {
          const fresh = activeBattle.getState();
          updateMatchHUD(fresh);
        }
      }

      const curState = activeBattle.getState();
      updateMatchHUD(curState);
      updateFaceoffPanel(curState);
      renderZones();

      if (activeBattle.battleOver) {
        stopAutoSimulate();
        setTimeout(() => {
          handleBattleOver();
        }, 500);
      } else {
        autoSimTimer = setTimeout(runTurboStep, 220);
      }
    };

    runTurboStep();
  }

  // ── UPDATE MATCH HUD (HP bars, shield, chain, scoreboard) ───────────────────
  function triggerBarShake(element, cssClass) {
    if (!element) return;
    element.classList.remove(cssClass);
    void element.offsetWidth; // force reflow to restart animation
    element.classList.add(cssClass);
    setTimeout(() => element.classList.remove(cssClass), 500);
  }

  // Combines inning progression + team HP into a discrete danger tier (0-3),
  // Combines inning progression + team HP into a discrete danger tier (0-3),
  // used to drive the .match-arena ambient tension effect as the game nears its end.
  function computeDangerLevel(state) {
    if (!state) return 0;
    const inning = state.inning || 1;
    const hp = state.teamHP;
    let tier = inning >= 4 ? 3 : inning >= 3 ? 2 : inning >= 2 ? 1 : 0;
    if (hp <= 25 || inning >= 4) tier = 3;
    else if (hp <= 50) tier = Math.max(tier, 2);
    return tier;
  }

  function updateMatchHUD(state, options = {}) {
    if (!state) return;

    if (window.AudioManager && typeof window.AudioManager.updateBattleIntensity === 'function') {
      window.AudioManager.updateBattleIntensity(state);
    }

    // Classic scoreboard
    el.scoreAwayR.innerText  = state.runs;
    el.scoreHomeR.innerText  = state.outs;

    const extraBanner = document.getElementById('extra-innings-hud-banner');
    if (state.inning >= 4) {
      el.scoreAwayH.innerHTML = `<span style="color:#ef4444;text-shadow:0 0 8px #ef4444;animation:pulse-fast 1s infinite;font-weight:bold;">🔥 EX ${state.inning}</span>`;
      const suddenDeathTitle = typeof window.t === 'function' ? window.t('match.sudden_death_title', { defaultValue: '⚡ ¡MUERTE SÚBITA! ⚡' }) : '⚡ ¡MUERTE SÚBITA! ⚡';
      if (el.scoreInningText) {
        el.scoreInningText.innerHTML = `<span style="color:#f59e0b;text-shadow:0 0 10px #f59e0b;font-weight:bold;animation:pulse-fast 1s infinite;">${suddenDeathTitle}</span>`;
      }
      if (extraBanner) {
        extraBanner.classList.remove('hidden');
        const extraTitleEl = document.getElementById('extra-innings-hud-title');
        const extraDescEl = document.getElementById('extra-innings-hud-desc');
        if (extraTitleEl && typeof window.t === 'function') extraTitleEl.innerText = window.t('match.extra_innings_hud_title');
        if (extraDescEl && typeof window.t === 'function') extraDescEl.innerText = window.t('match.extra_innings_hud_desc');
      }
    } else {
      el.scoreAwayH.innerText  = `${state.inning} / 3`;
      if (el.scoreInningText) {
        el.scoreInningText.innerText = typeof window.t === 'function' ? window.t('match.arena', { defaultValue: 'ARENA COMBATE' }) : 'ARENA COMBATE';
      }
      if (extraBanner) extraBanner.classList.add('hidden');
    }

    el.scoreHomeH.innerText  = state.activePitcher
      ? `${state.activePitcher.index} / ${state.activePitcher.total}`
      : '–';

    // Update SVG bases
    if (state.bases) {
      const activeColor = '#00ff66'; // primary theme color
      const activeStroke = '#00ff66';
      const activeFilter = 'drop-shadow(0 0 4px #00ff66)';
      
      const inactiveColor = 'rgba(255, 255, 255, 0.1)';
      const inactiveStroke = 'rgba(255, 255, 255, 0.25)';
      const inactiveFilter = 'none';
      
      ['base-1', 'base-2', 'base-3'].forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
          const occupied = state.bases[idx] && state.bases[idx] !== ' ';
          const fill = occupied ? activeColor : inactiveColor;
          const stroke = occupied ? activeStroke : inactiveStroke;
          const filter = occupied ? activeFilter : inactiveFilter;
          el.setAttribute('fill', fill);
          el.setAttribute('stroke', stroke);
          el.style.fill = fill;
          el.style.stroke = stroke;
          el.style.filter = filter;
        }
      });
    }

    // Team HP bar — shake on damage
    const hpBar     = document.getElementById('team-hp-bar');
    const hpBarWrap = document.getElementById('team-hp-wrap') || hpBar?.parentElement;
    const hpText    = document.getElementById('team-hp-text');
    if (state.teamHP < _prevTeamHP && hpBarWrap) {
      triggerBarShake(hpBarWrap, 'hp-bar-hit');
    }
    _prevTeamHP = state.teamHP;

    if (hpBar)  hpBar.style.width = `${Math.max(0, state.teamHP)}%`;
    if (hpText) hpText.innerText  = `${state.teamHP}/100`;
    if (hpBar) {
      hpBar.style.background = state.teamHP <= 25
        ? 'linear-gradient(90deg,#ef4444,#f87171)'
        : state.teamHP <= 50
        ? 'linear-gradient(90deg,#f59e0b,#fcd34d)'
        : 'linear-gradient(90deg,#10b981,#34d399)';
    }

    // Tension escalation: danger tier from inning + HP, drives .match-arena vignette/pulse
    const dangerLevel = computeDangerLevel(state);
    if (el.matchArena) {
      el.matchArena.classList.remove('danger-1', 'danger-2', 'danger-3');
      if (dangerLevel > 0) el.matchArena.classList.add(`danger-${dangerLevel}`);
    }

    // Shield bar — shake on damage
    const shBar     = document.getElementById('team-shield-bar');
    const shBarWrap = document.getElementById('team-shield-wrap') || shBar?.parentElement;
    const shText    = document.getElementById('team-shield-text');
    if (_prevTeamShield !== null && state.teamShield < _prevTeamShield && shBarWrap) {
      triggerBarShake(shBarWrap, 'shield-bar-hit');
    }
    _prevTeamShield = state.teamShield;

    if (shBar && state.teamShieldMax > 0) {
      shBar.style.width = `${Math.round((state.teamShield / state.teamShieldMax) * 100)}%`;
    }
    if (shText) shText.innerText = `${state.teamShield}/${state.teamShieldMax}`;

    // SO chain
    const chainEl = document.getElementById('so-chain-display');
    if (chainEl) {
      const chain = state.strikeoutChain || 0;
      const flames = '🔥'.repeat(Math.min(chain, 4));
      chainEl.innerText = chain > 0
        ? t('match.so_streak', { count: chain, mult: ['1.0x','1.5x','2.0x','3.0x'][Math.min(chain - 1, 3)] })
        : t('match.so_streak_zero', '🔥 Racha de Ponches: 0');
      chainEl.style.color = chain >= 3 ? '#ef4444' : chain >= 2 ? '#f59e0b' : '#64748b';
    }

    // LEDs for outs
    resetLEDs();
    if (el.ledO1 && state.outs >= 1) el.ledO1.className = 'led-dot active-out';
    if (el.ledO2 && state.outs >= 2) el.ledO2.className = 'led-dot active-out';

    // Pitcher HP bar — shake on damage
    if (!options.skipPitcherHP) {
      if (state.activePitcher && el.matchPitcherHpFill) {
        const pct = Math.max(0, Math.min(100, (state.activePitcher.hp / state.activePitcher.maxHp) * 100));

        if (_prevPitcherHP !== null && state.activePitcher.hp < _prevPitcherHP) {
          const pitcherHpWrap = el.matchPitcherHpFill.parentElement;
          if (pitcherHpWrap) triggerBarShake(pitcherHpWrap, 'hp-bar-hit');
        }
        _prevPitcherHP = state.activePitcher.hp;

        el.matchPitcherHpFill.style.width = `${pct}%`;
        el.matchPitcherHpText.innerText   = `${state.activePitcher.hp}/${state.activePitcher.maxHp} HP`;
        el.matchPitcherHpFill.style.background = pct <= 25
          ? 'linear-gradient(90deg,#ff3333,#ff6666)'
          : pct <= 50
          ? 'linear-gradient(90deg,#ffcc00,#ffeb60)'
          : 'linear-gradient(90deg,#00ff66,#66ffa6)';
      } else if (!state.activePitcher && el.matchPitcherHpFill) {
        // All pitchers KO'd (Match Won)
        el.matchPitcherHpFill.style.width = '0%';
        if (el.matchPitcherHpText) el.matchPitcherHpText.innerText = '0 HP (K.O.)';
        el.matchPitcherHpFill.style.background = 'linear-gradient(90deg,#ff3333,#ff6666)';
      }
    }

    // Pitcher Debuff Badge
    const debuffBadge = document.getElementById('match-pitcher-debuff-badge');
    if (debuffBadge) {
      if (state.pitcherDebuff && state.pitcherDebuff.turnsLeft > 0) {
        const mult = Math.round((state.pitcherDebuff.multiplier - 1) * 100);
        const impLbl = state.pitcherDebuff.turnsLeft === 1 ? 'impacto' : 'impactos';
        debuffBadge.innerText = `⚡ +${mult}% ${typeof window.t==='function'?window.t('match.debuff_badge'):'DAÑO RECIBIDO'} (${state.pitcherDebuff.turnsLeft} ${impLbl})`;
        debuffBadge.classList.remove('hidden');
      } else {
        debuffBadge.classList.add('hidden');
      }
    }
  }

  // ── RENDER ZONE LEGEND ────────────────────────────────────────────────────────
  function renderZones() {
    const zonesEl = document.getElementById('zones-lines');
    if (!zonesEl) return;
    let b = (activeBattle && typeof activeBattle.currentBoundaries === 'function') ? activeBattle.currentBoundaries() : null;
    if (!b) {
      b = { bbEnd: 11, soEnd: 22, outEnd: 38, singleEnd: 61, doubleEnd: 74, tripleEnd: 81 };
    }

    const isClutchActive = b.isClutchActive || (activeBattle && (function(){
      const batter = activeBattle.awayTeam ? activeBattle.awayTeam.lineup[activeBattle.awayLineupIndex] : null;
      if (!batter || !(batter.clutch || batter.is_clutch)) return false;
      const isLastInning = activeBattle.inning >= 3;
      const runnersInScoring = !!(activeBattle.bases && (activeBattle.bases[1] || activeBattle.bases[2]));
      return isLastInning || runnersInScoring;
    })());

    const boost1BTag = isClutchActive ? `<span class="clutch-tag-badge boost">+2%</span>` : '';
    const boost2BTag = isClutchActive ? `<span class="clutch-tag-badge boost">+2%</span>` : '';
    const boostHRTag = isClutchActive ? `<span class="clutch-tag-badge hr-boost">+4%</span>` : '';
    const penaltyOutTag = isClutchActive ? `<span class="clutch-tag-badge penalty">-8%</span>` : '';

    const clutchSlot = document.getElementById('clutch-banner-slot');
    if (clutchSlot) {
      clutchSlot.innerHTML = isClutchActive ? `<div class="clutch-active-banner">⚡ ¡CLUTCH PLAYER ACTIVO!</div>` : '';
    }

    zonesEl.innerHTML = `
      <div class="outcome-probabilities-grid">
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div class="outcome-row">
            <span class="outcome-row-left" style="color:#3b82f6;">⚾ ${t('match.bb', 'Boleto')}</span>
            <span class="outcome-row-right" style="color:#3b82f6;font-weight:bold;white-space:nowrap;">1–${b.bbEnd}</span>
          </div>
          <div class="outcome-row">
            <span class="outcome-row-left" style="color:#ef4444;">💨 ${t('match.so', 'Ponche')}</span>
            <span class="outcome-row-right" style="color:#ef4444;font-weight:bold;white-space:nowrap;">${b.bbEnd + 1}–${b.soEnd}</span>
          </div>
          <div class="outcome-row" style="${isClutchActive ? 'background:rgba(239,68,68,0.12);' : ''}">
            <span class="outcome-row-left" style="color:#9ca3af;">🤚 ${t('match.out', 'Out')}</span>
            <span class="outcome-row-right">
              <span style="color:#9ca3af;font-weight:bold;white-space:nowrap;">${b.soEnd + 1}–${b.outEnd}</span>${penaltyOutTag}
            </span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div class="outcome-row" style="${isClutchActive ? 'background:rgba(0,255,102,0.1);' : ''}">
            <span class="outcome-row-left" style="color:#a7f3d0;">✅ ${t('match.single', 'Sencillo')}</span>
            <span class="outcome-row-right">
              <span style="color:#a7f3d0;font-weight:bold;white-space:nowrap;">${b.outEnd + 1}–${b.singleEnd}</span>${boost1BTag}
            </span>
          </div>
          <div class="outcome-row" style="${isClutchActive ? 'background:rgba(16,185,129,0.1);' : ''}">
            <span class="outcome-row-left" style="color:#10b981;">⚡ ${t('match.double', 'Doble')}</span>
            <span class="outcome-row-right">
              <span style="color:#10b981;font-weight:bold;white-space:nowrap;">${b.singleEnd + 1}–${b.doubleEnd}</span>${boost2BTag}
            </span>
          </div>
          <div class="outcome-row">
            <span class="outcome-row-left" style="color:#06b6d4;">🔥 ${t('match.triple', 'Triple')}</span>
            <span class="outcome-row-right" style="color:#06b6d4;font-weight:bold;white-space:nowrap;">${b.doubleEnd + 1}–${b.tripleEnd}</span>
          </div>
          <div class="outcome-row" style="${isClutchActive ? 'background:rgba(234,179,8,0.15);' : ''}">
            <span class="outcome-row-left" style="color:#eab308;font-weight:bold;">🚀 ${t('match.hr', 'Jonrón')}</span>
            <span class="outcome-row-right">
              <span style="color:#eab308;font-weight:bold;white-space:nowrap;">${b.tripleEnd + 1}–100</span>${boostHRTag}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // ── APPEND LOG LINE (replaces the old event-based playNextMatchEvent) ────────
  function appendLogLine(ev) {
    if (!ev || !ev.playText || !el.matchLogLines) return;
    const logLine = document.createElement('div');
    logLine.className = 'log-line';
    if (['START','END','KO_PITCHER','INNING_END','NEXT_PITCHER'].includes(ev.playType))
      logLine.classList.add('header-line');
    if (['HR','3B','2B','1B','STEAL'].includes(ev.eventType))
      logLine.classList.add('run-scored');
    if (['HR','3B','2B','1B','STEAL'].includes(ev.eventType))
      logLine.classList.add('bold');
    if (ev.eventType === 'SO')
      logLine.style.color = '#ef4444';
    if (ev.spdUpgraded || (ev.playText && /1B ➔ 2B|2B ➔ 3B|SPD Proc/i.test(ev.playText))) {
      logLine.style.color = '#38bdf8';
      logLine.style.textShadow = '0 0 6px rgba(56, 189, 248, 0.4)';
    }
    logLine.innerText = ev.playText;
    el.matchLogLines.appendChild(logLine);
    el.matchLogLines.scrollTop = el.matchLogLines.scrollHeight;
  }

  // ── UPDATE FACEOFF PANEL (uses battle state) ─────────────────────────────────
  // Reusable "dealt from a deck" reveal for a freshly-inserted .player-card (or any
  // single-root card markup) — slides in from (fromX, fromY) with a 3D flip via the
  // .card-deal-in class/keyframe defined in style.css. Used for the combat faceoff
  // cards now; the same helper backs the draft deal and other card reveals.
  function dealCardIn(container, { fromX = 0, fromY = 0, delay = 0 } = {}) {
    if (!container) return;
    const card = container.firstElementChild;
    if (!card) return;
    container.classList.add('card-deal-perspective');
    card.style.setProperty('--deal-from-x', `${fromX}px`);
    card.style.setProperty('--deal-from-y', `${fromY}px`);
    card.classList.remove('card-deal-in');
    void card.offsetWidth; // restart the animation even if the class was already applied
    card.style.animationDelay = `${delay}ms`;
    card.classList.add('card-deal-in');
    if (window.AudioManager) {
      setTimeout(() => window.AudioManager.play('card_deal'), delay);
    }
  }

  function updateFaceoffPanel(stateOrEvent, opts = {}) {
    if (!stateOrEvent) return;
    const dealAnimation = !!opts.dealAnimation;
    const pitcher = stateOrEvent.activePitcher;
    const batter  = stateOrEvent.currentBatter || null;
    const bName   = batter ? batter.name : (stateOrEvent.activeBatter || '');

    const pNameRaw = pitcher ? pitcher.name : t('common.loading', 'Cargando...');
    const pNameClean = pNameRaw.replace(/\s*\(\d{4}\)$/, '').trim();

    el.matchBatterName.innerText  = bName || t('common.loading', 'Cargando...');
    el.matchPitcherName.innerText = pNameClean;

    // Batter card — only flip/re-render when batter actually changes or on initial deal
    const bRosterObj = Object.values(window.Game.roster).find(p => p && p.name === bName);
    if (bRosterObj) {
      const eff = window.Game.getEffectiveStats(bRosterObj, bRosterObj.pos);
      const statsBox = document.getElementById('match-batter-stats-box');
      if (statsBox) {
        const kavd = eff.k_avd !== undefined ? eff.k_avd : (eff.k_avoid !== undefined ? eff.k_avoid : (eff.k_avoid_val !== undefined ? eff.k_avoid_val : eff.con));
        statsBox.innerHTML = `CON: ${eff.con} | PWR: ${eff.pwr} | EYE: ${eff.eye}<br>K/AVD: ${kavd} | SPD: ${eff.spd} | DEF: ${eff.def}<br>POS NATIVA: ${eff.pos}`;
      }

      const batterChanged = (el.arenaBatterCardSlot.dataset.renderedBatter !== bName);
      if (batterChanged || dealAnimation) {
        el.arenaBatterCardSlot.innerHTML = createCardHTML(eff, bRosterObj.pos);
        el.arenaBatterCardSlot.dataset.renderedBatter = bName;
        dealCardIn(el.arenaBatterCardSlot, { fromX: -70, delay: 0 });
      }
    }

    // Pitcher card + HP bar
    if (pitcher) {
      const pct = Math.max(0, Math.min(100, (pitcher.hp / pitcher.maxHp) * 100));
      el.matchPitcherHpFill.style.width  = `${pct}%`;
      el.matchPitcherHpText.innerText    = `${pitcher.hp}/${pitcher.maxHp} HP`;
      el.matchPitcherHpFill.style.background = pct <= 25
        ? 'linear-gradient(90deg,#ff3333,#ff6666)'
        : pct <= 50
        ? 'linear-gradient(90deg,#ffcc00,#ffeb60)'
        : 'linear-gradient(90deg,#00ff66,#66ffa6)';

      const pitcherChanged = (el.arenaPitcherCardSlot.dataset.renderedPitcher !== pitcher.name);
      if (pitcherChanged || opts.reliefEntrance || dealAnimation) {
        const enemyTeam = (window.Game && window.Game.getEnemyTeam) ? window.Game.getEnemyTeam() : null;
        const pitchYear   = pitcher.year || pitcher._year || (enemyTeam ? (enemyTeam.year || enemyTeam._year) : 1941);
        let pitchTeam   = pitcher.team || pitcher._team;
        if (!pitchTeam || String(pitchTeam).startsWith('story_') || String(pitchTeam).startsWith('opp_') || String(pitchTeam).includes('_BOSS') || String(pitchTeam).includes('_boss') || String(pitchTeam).includes('_stage_')) {
          if (enemyTeam && enemyTeam.teamID && !String(enemyTeam.teamID).startsWith('story_') && !String(enemyTeam.teamID).startsWith('opp_') && !String(enemyTeam.teamID).includes('_BOSS')) {
            pitchTeam = enemyTeam.teamID;
          } else {
            pitchTeam = 'STARS';
          }
        }
        const pitchEra    = pitcher.era  || pitcher._era  || (enemyTeam ? (enemyTeam.era || enemyTeam._era) : 'Golden Era (1920-1941)');
        const pitchRarity = pitcher.rarity || pitcher._rarity || 'Common';

        const pitchH9  = pitcher.h9  !== undefined ? pitcher.h9  : (pitcher.grt !== undefined ? pitcher.grt : (pitcher.h9_val !== undefined ? pitcher.h9_val : 50));
        const pitchK9  = pitcher.k9  !== undefined ? pitcher.k9  : (pitcher.stf !== undefined ? pitcher.stf : (pitcher.str !== undefined ? pitcher.str : (pitcher.k9_val !== undefined ? pitcher.k9_val : 50)));
        const pitchBB9 = pitcher.bb9 !== undefined ? pitcher.bb9 : (pitcher.ctl !== undefined ? pitcher.ctl : (pitcher.bb9_val !== undefined ? pitcher.bb9_val : 50));
        const pitchHR9 = pitcher.hr9 !== undefined ? pitcher.hr9 : (pitcher.mov !== undefined ? pitcher.mov : (pitcher.hr9_val !== undefined ? pitcher.hr9_val : 50));
        const pitchSta = pitcher.sta !== undefined ? pitcher.sta : (pitcher.sta_val !== undefined ? pitcher.sta_val : (pitcher.maxHp ? Math.max(15, Math.min(125, Math.round((pitcher.maxHp - 15) / 0.85))) : 65));

        const tempPitcher = {
          name: pitcher.name, pos: pitcher.role || 'SP', role: pitcher.role || 'SP',
          era: pitchEra,
          team: pitchTeam,
          year: pitchYear,
          mov: pitchHR9, stf: pitchK9, ctl: pitchBB9, sta: pitchSta, grt: pitchH9,
          hp: pitcher.hp, maxHp: pitcher.maxHp,
          stamina: Math.round((pitcher.hp / pitcher.maxHp) * 100),
          rarity: pitchRarity,
          h9:  pitchH9,
          k9:  pitchK9,
          bb9: pitchBB9,
          hr9: pitchHR9
        };
        tempPitcher.ovr = pitcher.ovr !== undefined ? pitcher.ovr : (pitcher._ovr !== undefined ? pitcher._ovr : getPlayerOvr(tempPitcher));
        
        el.arenaPitcherCardSlot.innerHTML = createCardHTML(tempPitcher, tempPitcher.pos);
        el.arenaPitcherCardSlot.dataset.renderedPitcher = pitcher.name;
        el.arenaPitcherCardSlot.querySelectorAll('.ko-stamp-badge').forEach(s => s.remove());

        if (opts.reliefEntrance) {
          el.arenaPitcherCardSlot.classList.remove('pitcher-card-entrance');
          void el.arenaPitcherCardSlot.offsetWidth;
          el.arenaPitcherCardSlot.classList.add('pitcher-card-entrance');
          setTimeout(() => el.arenaPitcherCardSlot.classList.remove('pitcher-card-entrance'), 550);
        } else if (dealAnimation) {
          dealCardIn(el.arenaPitcherCardSlot, { fromX: 70, delay: 150 });
        }
      }

      // Rotation badges
      const total = pitcher.total || 1;
      el.matchPitchersRotationQueue.innerHTML = '';
      for (let idx = 0; idx < total; idx++) {
        let label = `SP${idx + 1}`;
        if (idx === total - 2 && total > 2) label = 'RP';
        if (idx === total - 1) label = 'CL';
        const badge = document.createElement('span');
        badge.className = 'rotation-badge';
        badge.innerText = label;
        if (idx < pitcher.index)       badge.classList.add('ko');
        else if (idx === pitcher.index) badge.classList.add('active');
        el.matchPitchersRotationQueue.appendChild(badge);
      }
    }
  }

  function launchConfetti() {
    const existing = document.getElementById('victory-confetti-canvas');
    if (existing) existing.remove();

    const canvas = document.createElement('canvas');
    canvas.id = 'victory-confetti-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:300;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#eab308', '#ec4899', '#8b5cf6', '#38bdf8'];
    const particles = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.4 - canvas.height * 0.1,
        w: Math.random() * 8 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 3,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10
      });
    }

    let startTime = Date.now();
    function render() {
      const elapsed = Date.now() - startTime;
      if (elapsed > 3500 || !document.getElementById('victory-confetti-canvas')) {
        canvas.remove();
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  // ── HANDLE BATTLE OVER (Victory / Defeat debrief modal) ────────────────────
  function handleBattleOver() {
    stopAutoSimulate();
    if (!activeBattle) return;
    const isWin = (activeBattle.winner === 'player');
    const state = activeBattle.getState();

    // Remove existing battle over modals, banners, stamps, and popups
    document.querySelectorAll('.battle-over-modal, .arcade-transition-banner, .outcome-popup-overlay, .ko-stamp-badge, .match-screen-flash').forEach(m => m.remove());

    if (isWin) {
      launchConfetti();
      if (window.AudioManager) window.AudioManager.play('win');
    } else {
      if (window.AudioManager) window.AudioManager.play('lose');
    }

    const modal = document.createElement('div');
    modal.className = "battle-over-modal";
    modal.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.90);
      backdrop-filter: blur(8px);
      z-index: 200;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    `;

    const bannerColor = isWin ? '#00ff66' : '#ef4444';
    const bannerGlow = isWin ? 'rgba(0, 255, 102, 0.6)' : 'rgba(239, 68, 68, 0.6)';
    const titleText = isWin ? t('match.win_title') : t('match.loss_title');
    const subText = isWin
      ? t('match.win_desc', { team: activeBattle.homeTeam.name })
      : t('match.loss_desc', { team: activeBattle.homeTeam.name });

    modal.innerHTML = `
      <div style="
        background: #090d16;
        border: 3px solid ${bannerColor};
        box-shadow: 0 0 40px ${bannerGlow};
        border-radius: 16px;
        padding: 30px 40px;
        max-width: 480px;
        width: 90%;
      ">
        <div style="font-size: 48px; color: ${bannerColor}; filter: drop-shadow(0 0 12px ${bannerColor}); margin-bottom: 15px;">
          <i class="fa-solid ${isWin ? 'fa-trophy' : 'fa-skull'}"></i>
        </div>
        <h2 style="font-family:'Press Start 2P',monospace; font-size: 16px; color: ${bannerColor}; text-shadow: 0 0 10px ${bannerColor}; margin-bottom: 15px; line-height: 1.4;">
          ${titleText}
        </h2>
        <p style="font-size: 14px; color: #e4e4e7; line-height: 1.5; margin-bottom: 25px;">
          ${subText}
        </p>
        <button id="btn-modal-debrief-proceed" class="btn" style="
          font-family:'Press Start 2P',monospace;
          font-size: 12px;
          padding: 14px 28px;
          background: linear-gradient(135deg, ${isWin ? '#10b981,#059669' : '#ef4444,#dc2626'});
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          box-shadow: 0 0 15px ${bannerGlow};
        ">
          ${isWin ? t('match.claim_rewards') + ' <i class="fa-solid fa-arrow-right"></i>' : t('match.see_results') + ' <i class="fa-solid fa-arrow-right"></i>'}
        </button>
      </div>
    `;

    const fightDeck = document.querySelector('.rpg-fight-deck') || el.screenMatch;
    fightDeck.style.position = 'relative';
    fightDeck.appendChild(modal);

    document.getElementById('btn-modal-debrief-proceed').addEventListener('click', () => {
      modal.remove();
      const confetti = document.getElementById('victory-confetti-canvas');
      if (confetti) confetti.remove();
      const fakeResult = {
        winner: activeBattle.winner === 'player' ? 'away' : 'home',
        runsScored: state.runs,
        pitchersDefeated: state.activePitcher ? state.activePitcher.index : activeBattle.homeTeam.pitchers.length,
        // Pitchers actually faced (thrown at least one dice roll against), not just
        // KO'd — defeated + the current one if the series ended on a timeout/loss
        // with them still standing. See CLAUDE session notes on the "2 of 3" bug.
        pitchersFaced: state.activePitcher
          ? Math.min(state.activePitcher.index + 1, activeBattle.homeTeam.pitchers.length)
          : activeBattle.homeTeam.pitchers.length,
        awayLineup: activeBattle.awayTeam.lineup,
        enemyPitchers: activeBattle.homeTeam.pitchers,
        matchEvents: activeBattle.events || [],
        staminaImmuneIds: activeBattle.staminaImmuneBatterIds || new Set()
      };
      activeBattle = null;
      const res = window.Game.postMatchDebrief(fakeResult);
      handlePostMatchResult(res);
    });
  }


  function resetLEDs() {
    if (!el.ledB1) return;
    el.ledB1.className = "led-dot";
    el.ledB2.className = "led-dot";
    el.ledB3.className = "led-dot";
    el.ledS1.className = "led-dot";
    el.ledS2.className = "led-dot";
    el.ledO1.className = "led-dot";
    el.ledO2.className = "led-dot";
  }

  function resetDiamond() {
    // Obsolete but kept for safeguards
  }

  // Handle final debrief triggers after match finish
  function handleMatchPlaybackFinished() {
    el.btnMatchStep.classList.add('hidden');
    el.btnMatchAuto.classList.add('hidden');
    el.btnMatchSkip.classList.add('hidden');

    const isWinnerAway = activeSimulationResult.winner === 'away';

    // Create final debrief log line
    const outcomeLine = document.createElement('div');
    outcomeLine.className = `log-line bold ${isWinnerAway ? 'run-scored' : ''}`;
    outcomeLine.style.fontSize = "15px";
    outcomeLine.style.marginTop = "15px";
    outcomeLine.style.borderTop = "2px solid rgba(255,255,255,0.1)";
    outcomeLine.style.paddingTop = "10px";
    
    if (isWinnerAway) {
      outcomeLine.innerHTML = (typeof window.t==='function'?window.t('match.outcome_victory'):'¡VICTORIA CONTUNDENTE! Has derrotado a la rotación completa de lanzadores.');
    } else {
      outcomeLine.innerHTML = (typeof window.t==='function'?window.t('match.outcome_defeat'):'DERROTA. Tu alineación ha sido noqueada por los lanzadores rivales.');
    }
    el.matchLogLines.appendChild(outcomeLine);
    el.matchLogLines.scrollTop = el.matchLogLines.scrollHeight;

    // Create proceed/debrief button
    const proceedBtn = document.createElement('button');
    proceedBtn.className = "btn";
    proceedBtn.id = "btn-finish-match-debrief";
    proceedBtn.style.marginTop = "20px";
    proceedBtn.style.width = "100%";
    proceedBtn.innerHTML = `Proceder al Resumen del Partido <i class="fa-solid fa-arrow-right"></i>`;
    
    proceedBtn.addEventListener('click', () => {
      if (activeSimulationResult) activeSimulationResult.matchEvents = (activeSimulation && activeSimulation.events) ? activeSimulation.events : [];
      const res = window.Game.postMatchDebrief(activeSimulationResult);

      // Clear simulations refs
      activeSimulation = null;
      activeSimulationResult = null;
      simulationEvents = [];

      handlePostMatchResult(res);
    });

    el.screenMatch.appendChild(proceedBtn);
  }

  // ── EXHAUSTION / RETIREMENT MODAL ─────────────────────────────────────
  function showStaminaExhaustionModal(retiredAlerts, onContinue) {
    if (!retiredAlerts || !retiredAlerts.length) {
      if (onContinue) onContinue();
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-md z-[900] flex items-center justify-center p-4';
    
    const itemsHTML = retiredAlerts.map(a => `
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.4);border-radius:10px;padding:12px 16px;margin-bottom:10px;text-align:left;">
        <div style="font-size:13px;color:#f87171;font-weight:bold;margin-bottom:4px;">
          💀 ${a.oldPlayerName} <span style="font-size:11px;color:#9ca3af;">[${a.oldPlayerPos}]</span>
        </div>
        <div style="font-size:11px;color:#e4e4e7;line-height:1.4;">
          ${typeof window.t==='function'?window.t('ui.exhaustion_item_desc', { defaultValue: '¡Se ha quedado sin Stamina (0 HP) y ha debido retirarse de la carrera!' }):'¡Se ha quedado sin Stamina (0 HP) y ha debido retirarse de la carrera!'}
        </div>
        <div style="font-size:11px;color:#34d399;font-weight:bold;margin-top:6px;">
          ${typeof window.t==='function'?window.t('ui.exhaustion_replaced_by', { defaultValue: '🔄 Reemplazado por:' }):'🔄 Reemplazado por:'} <span style="color:#fff;">${a.newPlayerName}</span> (${a.newPlayerRarity} • ${a.newPlayerPos} • OVR ${a.newPlayerOvr})
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="background:#0a0f1d;border:3px solid #ef4444;box-shadow:0 0 40px rgba(239,68,68,0.5);border-radius:16px;padding:24px 30px;max-width:500px;width:95%;text-align:center;">
        <div style="font-size:40px;color:#ef4444;margin-bottom:10px;">⚡</div>
        <h2 style="font-family:'Press Start 2P',monospace;font-size:14px;color:#ef4444;margin-bottom:12px;">${typeof window.t==='function'?window.t('ui.exhaustion_title', { defaultValue: '¡EXHAUSTIÓN EN EL ROSTER!' }):'¡EXHAUSTIÓN EN EL ROSTER!'}</h2>
        <p style="font-size:11px;color:#9ca3af;margin-bottom:16px;line-height:1.4;">
          ${typeof window.t==='function'?window.t('ui.exhaustion_desc', { defaultValue: 'Uno o varios bateadores han agotado completamente su energía (0 Stamina) y no pueden continuar. Han sido sustituidos por agentes libres categoría Common de su misma posición.' }):'Uno o varios bateadores han agotado completamente su energía (0 Stamina) y no pueden continuar. Han sido sustituidos por agentes libres categoría Common de su misma posición.'}
        </p>
        <div style="max-height:220px;overflow-y:auto;margin-bottom:20px;">
          ${itemsHTML}
        </div>
        <button id="btn-ack-exhaustion" class="btn" style="width:100%;padding:12px;font-family:'Press Start 2P',monospace;font-size:10px;background:#ef4444;color:#fff;border:none;border-radius:8px;cursor:pointer;">
          ${typeof window.t==='function'?window.t('ui.exhaustion_btn', { defaultValue: 'ENTENDIDO' }):'ENTENDIDO'} <i class="fa-solid fa-check"></i>
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btn-ack-exhaustion').addEventListener('click', () => {
      modal.remove();
      renderActiveRoster();
      renderSynergiesAndItems();
      updateHUD();
      if (onContinue) onContinue();
    });
  }

  // ── CENTRAL POST-MATCH ROUTER ─────────────────────────────────────────
  function handlePostMatchResult(res) {
    if (window.Game && window.Game.isChallenge162PlayoffMatch) {
      if (window.Challenge162) window.Challenge162.onPlayoffMatchResolved(res);
      return;
    }

    if (window.Game && typeof window.Game.logRunNode === 'function') {
      const enemyName = (window.Game.currentEnemy && window.Game.currentEnemy.name) || 'Rival';
      const isBoss = !!res.isBossStage;
      if (res.won) {
        window.Game.logRunNode({
          type: isBoss ? 'boss' : 'match',
          icon: isBoss ? '👑' : '⚾',
          title: isBoss ? `Victoria Boss vs ${enemyName}` : `Victoria vs ${enemyName}`,
          titleEN: isBoss ? `Boss Victory vs ${enemyName}` : `Victory vs ${enemyName}`,
          desc: `Ganaste +$${res.earnings || 0} de presupuesto`,
          descEN: `Earned +$${res.earnings || 0} budget`,
          status: 'success'
        });
      } else {
        window.Game.logRunNode({
          type: 'defeat',
          icon: '💀',
          title: `Derrota vs ${enemyName}`,
          titleEN: `Defeat vs ${enemyName}`,
          desc: res.message || '',
          descEN: res.message || '',
          status: 'danger'
        });
      }
    }
    const continueRouting = () => {
      if (!res.won) {
        triggerGameOver(false, res.message);
        return;
      }
      if (res.isTrueVictory) {
        triggerTrueVictory();
        return;
      }
      if (res.isSuperBossTrigger) {
        showSuperBossIntroModal(() => setupAndStartMatchSimulation());
        return;
      }
      if (res.isTraitReward && res.traitChoices) {
        showTraitSelectionModal(res.traitChoices, res.earnings, () => {
          setupPostMatchDraftScreen(true, 0);
        });
        return;
      }
      if (res.rewardedItem) {
        showMidBossItemRewardModal(res.rewardedItem, res.earnings, () => {
          setupPostMatchDraftScreen(false, 0);
        });
        return;
      }
      setupPostMatchDraftScreen(res.isBossStage, res.earnings);
    };

    if (res.retiredAlerts && res.retiredAlerts.length > 0) {
      showStaminaExhaustionModal(res.retiredAlerts, continueRouting);
    } else {
      continueRouting();
    }
  }

  // ── MID-BOSS ITEM REWARD MODAL ──────────────────────────────────────────
  function showMidBossItemRewardModal(item, earnings, onDone) {
    if (window.AudioManager && typeof window.AudioManager.play === 'function') {
      window.AudioManager.play('synergy_tier_up');
    }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle at center, rgba(35,15,2,0.96) 0%, rgba(10,4,0,0.99) 70%, #000 100%);backdrop-filter:blur(12px);z-index:800;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease-out;';

    const titleText = typeof window.t === 'function' ? window.t('mid_boss.win_title', '⚡ ¡MID-BOSS DERROTADO! ⚡') : '⚡ ¡MID-BOSS DERROTADO! ⚡';
    const descText = typeof window.t === 'function' ? window.t('mid_boss.win_desc', { budget: earnings, defaultValue: `¡Victoria de Élite! Obtienes +$${earnings} de presupuesto y un nuevo equipamiento en tu Mochila:` }) : `¡Victoria de Élite! Obtienes +$${earnings} de presupuesto y un nuevo equipamiento en tu Mochila:`;
    const btnText = typeof window.t === 'function' ? window.t('mid_boss.continue_btn', 'CONTINUAR AL DRAFT ➡') : 'CONTINUAR AL DRAFT ➡';

    overlay.innerHTML = `
      <div style="max-width:440px;width:92%;background:#0f0701;border:2px solid #f97316;border-radius:18px;padding:24px;box-shadow:0 0 40px rgba(249,115,22,0.4);text-align:center;">
        <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:#fb923c;letter-spacing:1px;margin-bottom:8px;text-shadow:0 0 12px rgba(251,146,60,0.6);">
          ${titleText}
        </div>
        <div style="font-size:11.5px;color:#cbd5e1;margin-bottom:18px;line-height:1.4;">
          ${descText}
        </div>

        <div style="background:rgba(249,115,22,0.08);border:1.5px solid #f97316;border-radius:14px;padding:16px 14px;margin-bottom:20px;text-align:center;box-shadow:0 0 20px rgba(249,115,22,0.15);">
          <div style="font-size:42px;margin-bottom:8px;">${item.icon || '🎒'}</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:9.5px;color:#fed7aa;margin-bottom:6px;line-height:1.4;">${item.name || 'Equipamiento'}</div>
          <div style="font-size:11px;font-weight:bold;color:#4ade80;background:rgba(0,0,0,0.4);padding:4px 8px;border-radius:6px;display:inline-block;">
            ${item.statDesc || item.text || 'Bonus de Stats'}
          </div>
        </div>

        <button id="btn-midboss-reward-continue" class="btn" style="width:100%;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;font-weight:bold;font-size:11px;padding:12px;border:1px solid #fdba74;box-shadow:0 0 16px rgba(234,88,12,0.4);cursor:pointer;">
          ${btnText}
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-midboss-reward-continue').addEventListener('click', () => {
      overlay.remove();
      if (typeof renderSynergiesAndItems === 'function') renderSynergiesAndItems();
      if (typeof renderActiveItemBonuses === 'function') renderActiveItemBonuses();
      updateHUD();
      if (onDone) onDone();
    });
  }

  // ── TRAIT SELECTION MODAL (after Boss Maps 1-3) ───────────────────────
  function showTraitSelectionModal(traitChoices, earnings, onDone) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);z-index:800;display:flex;align-items:center;justify-content:center;';

    const cardsHTML = traitChoices.map(t => `
      <div class="trait-choice-card" data-id="${t.id}" style="
        background:rgba(10,15,24,0.95);border:2px solid rgba(255,215,0,0.4);
        border-radius:14px;padding:22px 18px;max-width:240px;flex:1;cursor:pointer;
        text-align:center;transition:all 0.2s;position:relative;overflow:hidden;
        box-shadow:0 4px 20px rgba(0,0,0,0.6);
      ">
        <div style="font-size:36px;margin-bottom:10px;">${t.icon}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#ffd700;margin-bottom:10px;line-height:1.5;">${t.name}</div>
        <div style="font-size:11px;color:#cbd5e1;line-height:1.5;">${t.desc}</div>
        <button class="btn btn-trait-pick" data-id="${t.id}" style="margin-top:18px;width:100%;background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;font-weight:bold;font-size:10px;padding:10px;">${typeof window.t==='function'?window.t('ui.trait_pick_btn'):'✨ Elegir'}</button>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="max-width:850px;width:95%;padding:20px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-family:'Press Start 2P',monospace;font-size:13px;color:#ffd700;text-shadow:0 0 15px rgba(255,215,0,0.7);margin-bottom:8px;">🏆 ${typeof window.t==='function'?window.t('ui.boss_victory_header', { earnings: earnings, defaultValue: `¡VICTORIA DE JEFE! +$${earnings}` }):`¡VICTORIA DE JEFE! +$${earnings}`}</div>
          <div style="font-size:12px;color:#e2e8f0;">${typeof window.t==='function'?window.t('ui.trait_choose_desc'):'Elige una Trait Pasiva que acompañará a tu equipo hasta el final de la run:'}</div>
        </div>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
          ${cardsHTML}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Hover effects
    overlay.querySelectorAll('.trait-choice-card').forEach(card => {
      card.addEventListener('mouseenter', () => { card.style.borderColor = '#ffd700'; card.style.transform = 'translateY(-4px)'; card.style.boxShadow = '0 8px 30px rgba(255,215,0,0.3)'; });
      card.addEventListener('mouseleave', () => { card.style.borderColor = 'rgba(255,215,0,0.4)'; card.style.transform = ''; card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6)'; });
    });

    overlay.querySelectorAll('.btn-trait-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        const traitId = btn.dataset.id;
        window.Game.equipTrait(traitId);
        overlay.remove();
        renderEquippedTraits();
        if (onDone) onDone();
      });
    });
  }

  function renderEquippedTraits() {
    // Inject trait badges into synergies sidebar or create a dedicated section
    let traitPanel = document.getElementById('equipped-traits-panel');
    if (!traitPanel) {
      traitPanel = document.createElement('div');
      traitPanel.id = 'equipped-traits-panel';
      traitPanel.style.cssText = 'margin-top:10px;padding:10px 4px;border-top:1px dashed rgba(255,215,0,0.3);';
      const sidebar = document.getElementById('left-active-effects-panel');
      if (sidebar) sidebar.appendChild(traitPanel);
    }
    const traits = window.Game.equippedTraits || [];
    if (!traits.length) { traitPanel.innerHTML = ''; return; }
    traitPanel.innerHTML = `
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#ffd700;margin-bottom:6px;">${t('ui.active_traits_header', '✨ TRAITS ACTIVAS')}</div>
      <div style="max-height:110px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">
        ${traits.map(t => `
          <div title="${t.desc.replace(/"/g, '&quot;')}" style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:rgba(255,215,0,0.06);border-radius:6px;border:1px solid rgba(255,215,0,0.2);cursor:help;">
            <span style="font-size:13px;flex-shrink:0;line-height:1;">${t.icon}</span>
            <span style="font-size:8px;color:#fef08a;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── ACTIVE ITEM/MANAGER-DECISION BONUSES: makes stat changes from events visible ──
  // (activeItemBonuses feeds getEffectiveStats() for every player, but was never
  // surfaced anywhere in the UI — buffs/debuffs from Manager Events were real but invisible.)
  function renderActiveItemBonuses() {
    let panel = document.getElementById('active-item-bonuses-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'active-item-bonuses-panel';
      panel.style.cssText = 'margin-top:10px;padding:10px 4px;border-top:1px dashed rgba(56,189,248,0.3);';
      const sidebar = document.getElementById('left-active-effects-panel');
      if (sidebar) sidebar.appendChild(panel);
    }
    const bonuses = window.Game.activeItemBonuses || {};
    const labels = { teamCon: 'CON', teamPwr: 'PWR', teamEye: 'EYE', teamSpd: 'SPD', teamDef: 'DEF' };
    const entries = Object.keys(labels)
      .map(key => ({ label: labels[key], val: bonuses[key] || 0 }))
      .filter(e => e.val !== 0);

    if (!entries.length) { panel.innerHTML = ''; return; }
    panel.innerHTML = `
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#38bdf8;margin-bottom:6px;">📋 DECISIONES ACTIVAS</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${entries.map(e => `
          <span style="font-size:9px;font-weight:bold;padding:3px 6px;border-radius:6px;background:${e.val > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};color:${e.val > 0 ? '#10b981' : '#ef4444'};border:1px solid ${e.val > 0 ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'};">
            ${e.val > 0 ? '+' : ''}${e.val} ${e.label}
          </span>
        `).join('')}
      </div>
    `;
  }

  // ── CHEST NODE: free trait, no fight required ─────────────────────────
  function openChestNode() {
    if (window.AudioManager && typeof window.AudioManager.play === 'function') {
      window.AudioManager.play('card_deal');
    }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);z-index:800;display:flex;align-items:center;justify-content:center;';

    const choices = window.Game.getRandomTraitChoices(1);
    const trait = choices[0];

    if (!trait) {
      overlay.innerHTML = `
        <div style="max-width:420px;width:90%;text-align:center;padding:24px;">
          <div style="font-size:48px;margin-bottom:12px;">📦</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:#facc15;margin-bottom:14px;">${t('chest.empty_title', 'COFRE VACÍO')}</div>
          <div style="font-size:12px;color:#cbd5e1;margin-bottom:20px;">${t('chest.empty_desc', 'Ya tienes todos los traits disponibles. El cofre te deja +$15 de consuelo.')}</div>
          <button class="btn" id="btn-chest-claim" style="background:linear-gradient(135deg,#facc15,#f59e0b);color:#000;font-weight:bold;">${t('chest.claim_btn', 'Reclamar')}</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#btn-chest-claim').addEventListener('click', () => {
        if (window.AudioManager && typeof window.AudioManager.play === 'function') {
          window.AudioManager.play('money');
        }
        window.Game.budget = (window.Game.budget || 0) + 15;
        if (window.Game && typeof window.Game.logRunNode === 'function') {
          window.Game.logRunNode({
            type: 'chest',
            icon: '📦',
            title: `Cofre de Consuelo`,
            titleEN: `Consolation Chest`,
            desc: `Recibiste +$15 de presupuesto`,
            descEN: `Received +$15 budget`,
            status: 'neutral'
          });
        }
        overlay.remove();
        updateHUD();
        closeNodeCompleted();
      });
      return;
    }

    overlay.innerHTML = `
      <div style="max-width:340px;width:90%;text-align:center;padding:20px;">
        <div class="chest-loot-icon" style="font-size:52px;margin-bottom:10px;">📦</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:#facc15;text-shadow:0 0 15px rgba(250,204,21,0.6);margin-bottom:16px;">${t('chest.found_title', '¡COFRE ENCONTRADO!')}</div>
        <div class="trait-choice-card" style="
          background:rgba(10,15,24,0.95);border:2px solid rgba(250,204,21,0.5);
          border-radius:14px;padding:22px 18px;box-shadow:0 4px 24px rgba(250,204,21,0.15);
        ">
          <div style="font-size:36px;margin-bottom:10px;">${trait.icon}</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#facc15;margin-bottom:10px;line-height:1.5;">${trait.name}</div>
          <div style="font-size:11px;color:#cbd5e1;line-height:1.5;">${trait.desc}</div>
        </div>
        <button class="btn" id="btn-chest-claim" style="margin-top:18px;width:100%;background:linear-gradient(135deg,#facc15,#f59e0b);color:#000;font-weight:bold;">${t('chest.claim_trait_btn', '✨ Reclamar Trait')}</button>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#btn-chest-claim').addEventListener('click', () => {
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('synergy_tier_up');
      }
      window.Game.equipTrait(trait.id);
      if (window.Game && typeof window.Game.logRunNode === 'function') {
        window.Game.logRunNode({
          type: 'chest',
          icon: '📦',
          title: `Cofre de Habilidades`,
          titleEN: `Trait Chest`,
          desc: `Obtuviste "${trait.name}"`,
          descEN: `Acquired "${trait.name}"`,
          status: 'success'
        });
      }
      overlay.remove();
      renderEquippedTraits();
      closeNodeCompleted();
    });
  }

  // ── TRADE DEADLINE NODE: Swap a player for another compatibly-positioned player ──
  function openTradeNode() {
    if (window.AudioManager && typeof window.AudioManager.play === 'function') {
      window.AudioManager.play('card_deal');
    }
    const tradeData = (window.Game && typeof window.Game.getTradeOffer === 'function') ? window.Game.getTradeOffer() : null;
    const overlay = document.createElement('div');
    overlay.className = 'trade-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle at center, rgba(30,10,45,0.96) 0%, rgba(8,2,14,0.99) 70%, #000 100%);backdrop-filter:blur(16px);z-index:850;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease-out;';

    if (!tradeData || !tradeData.offeredPlayer || !tradeData.currentPlayer) {
      overlay.innerHTML = `
        <div style="max-width:400px;width:90%;text-align:center;padding:24px;background:#0d0614;border:2px solid #a855f7;border-radius:16px;">
          <div style="font-size:44px;margin-bottom:12px;">🔄</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:#c084fc;margin-bottom:12px;">${t('trade.no_offer_title', 'TRADE DEADLINE')}</div>
          <div style="font-size:12px;color:#cbd5e1;margin-bottom:20px;">${t('trade.no_offer_desc', 'No hay ofertas viables en este momento. Los scouts no pudieron concretar un traspaso.')}</div>
          <button class="btn" id="btn-trade-pass" style="background:#334155;color:#fff;font-weight:bold;width:100%;">${t('trade.continue_btn', 'Continuar')}</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#btn-trade-pass').addEventListener('click', () => {
        overlay.remove();
        closeNodeCompleted();
      });
      return;
    }

    const { slot, currentPlayer: cur, offeredPlayer: off } = tradeData;
    const curOvr = getPlayerOvr(cur);
    const offOvr = getPlayerOvr(off);
    const curRarityColor = RARITY_COLORS[cur.rarity] || '#cbd5e1';
    const offRarityColor = RARITY_COLORS[off.rarity] || '#cbd5e1';

    const curEraTrait = (window.PlayersDB && window.PlayersDB.EraTraits && cur.era) ? window.PlayersDB.EraTraits[cur.era] : null;
    const offEraTrait = (window.PlayersDB && window.PlayersDB.EraTraits && off.era) ? window.PlayersDB.EraTraits[off.era] : null;

    overlay.innerHTML = `
      <div style="max-width:520px;width:94%;background:#0d0614;border:2px solid #a855f7;border-radius:18px;padding:22px;box-shadow:0 0 40px rgba(168,85,247,0.35);text-align:center;">
        <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:#c084fc;letter-spacing:1px;margin-bottom:6px;text-shadow:0 0 12px rgba(192,132,252,0.6);">
          📰 ${t('trade.header', 'TRADE DEADLINE — 31 DE JULIO')} 📰
        </div>
        <div style="font-size:11.5px;color:#94a3b8;margin-bottom:18px;">
          ${t('trade.desc', 'Un equipo rival te ofrece un intercambio directo por tu posición')} <strong style="color:#facc15;">[${slot}]</strong>:
        </div>

        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin-bottom:18px;">
          <!-- CURRENT PLAYER (GIVE) -->
          <div style="background:rgba(255,255,255,0.03);border:1.5px solid ${curRarityColor};border-radius:12px;padding:12px 8px;text-align:center;">
            <div style="font-size:8.5px;font-weight:bold;color:#ef4444;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${t('trade.give_label', 'ENTREGAS')}</div>
            <div style="font-size:12px;font-weight:bold;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${cur.name}">${cur.name}</div>
            <div style="font-size:9px;color:${curRarityColor};font-weight:bold;margin:3px 0;">${cur.rarity || 'Common'} • OVR ${curOvr}</div>
            <div style="font-size:8.5px;color:#94a3b8;margin-bottom:6px;">${cur.era || ''}</div>
            <div style="font-size:8px;color:#cbd5e1;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:rgba(0,0,0,0.3);padding:4px;border-radius:6px;">
              <div>CON: ${cur.con || 50}</div><div>PWR: ${cur.pwr || 50}</div>
              <div>EYE: ${cur.eye || 50}</div><div>DEF: ${cur.def || 50}</div>
            </div>
            ${curEraTrait ? `<div style="font-size:7.5px;color:#a78bfa;margin-top:4px;">${curEraTrait.name || ''}</div>` : ''}
          </div>

          <div style="font-size:22px;color:#a855f7;font-weight:bold;">➔</div>

          <!-- OFFERED PLAYER (GET) -->
          <div style="background:rgba(168,85,247,0.08);border:1.5px solid ${offRarityColor};border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 0 16px rgba(168,85,247,0.2);">
            <div style="font-size:8.5px;font-weight:bold;color:#22c55e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${t('trade.get_label', 'RECIBES')}</div>
            <div style="font-size:12px;font-weight:bold;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${off.name}">${off.name}</div>
            <div style="font-size:9px;color:${offRarityColor};font-weight:bold;margin:3px 0;">${off.rarity || 'Common'} • OVR ${offOvr}</div>
            <div style="font-size:8.5px;color:#94a3b8;margin-bottom:6px;">${off.era || ''}</div>
            <div style="font-size:8px;color:#cbd5e1;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:rgba(0,0,0,0.3);padding:4px;border-radius:6px;">
              <div>CON: ${off.con || 50}</div><div>PWR: ${off.pwr || 50}</div>
              <div>EYE: ${off.eye || 50}</div><div>DEF: ${off.def || 50}</div>
            </div>
            ${offEraTrait ? `<div style="font-size:7.5px;color:#a78bfa;margin-top:4px;">${offEraTrait.name || ''}</div>` : ''}
          </div>
        </div>

        <div style="display:flex;gap:10px;">
          <button id="btn-trade-accept" class="btn" style="flex:1.3;background:linear-gradient(135deg,#9333ea,#7e22ce);color:#fff;font-weight:bold;font-size:10.5px;padding:11px 8px;border:1px solid #c084fc;box-shadow:0 0 14px rgba(147,51,234,0.4);">
            ✨ ${t('trade.accept_btn', 'ACEPTAR TRASPASO')}
          </button>
          <button id="btn-trade-decline" class="btn" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid #475569;color:#94a3b8;font-size:10.5px;padding:11px 8px;">
            ${t('trade.decline_btn', 'RECHAZAR')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-trade-accept').addEventListener('click', () => {
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('synergy_tier_up');
      }
      window.Game.acceptTrade(slot, off);
      if (window.Game && typeof window.Game.logRunNode === 'function') {
        window.Game.logRunNode({
          type: 'trade',
          icon: '🔄',
          title: `Trade Deadline: [${slot}] ${off.name}`,
          titleEN: `Trade Deadline: [${slot}] ${off.name}`,
          desc: `Entregaste a ${cur.name} (${cur.rarity}) a cambio de ${off.name} (${off.rarity})`,
          descEN: `Traded ${cur.name} (${cur.rarity}) for ${off.name} (${off.rarity})`,
          status: 'success'
        });
      }
      overlay.remove();
      renderActiveRoster();
      closeNodeCompleted();
    });

    overlay.querySelector('#btn-trade-decline').addEventListener('click', () => {
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('button_click');
      }
      if (window.Game && typeof window.Game.logRunNode === 'function') {
        window.Game.logRunNode({
          type: 'trade',
          icon: '🔄',
          title: `Trade Deadline Rechazado`,
          titleEN: `Trade Deadline Declined`,
          desc: `Mantuviste a ${cur.name} en el roster`,
          descEN: `Kept ${cur.name} on the roster`,
          status: 'neutral'
        });
      }
      overlay.remove();
      closeNodeCompleted();
    });
  }

  // ── GAMBLE NODE: single all-or-nothing bet, dice-in-the-middle layout ─
  function openGambleNode() {
    const gamble = window.Game.getRandomGamble();
    const overlay = document.createElement('div');
    overlay.className = 'gamble-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle at center, rgba(35,6,10,0.96) 0%, rgba(10,2,4,0.99) 70%, #000 100%);backdrop-filter:blur(16px);z-index:850;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease-out;';

    // Play special event dramatic tension intro sound (same as defense event)
    if (window.AudioManager && typeof window.AudioManager.play === 'function') {
      window.AudioManager.play('defense_tension_intro');
    }

    const currentBudget = window.Game.budget || 0;

    const rosterOptions = gamble.requiresTargetPlayer
      ? Object.keys(window.Game.roster)
          .filter(pos => window.Game.roster[pos] && window.Game.roster[pos].era)
          .map(pos => `<option value="${pos}">[${pos}] ${window.Game.roster[pos].name} (${window.Game.roster[pos].era})</option>`)
          .join('')
      : '';

    // Calculation / Consequence highlight card for ALL 4 High-Stakes Gambles
    let calcCardHTML = '';
    if (gamble.id === 'gamble_all_in_budget') {
      const tripleAmount = currentBudget * 3;
      calcCardHTML = `
        <div style="background:rgba(250,204,21,0.08);border:1.5px solid rgba(250,204,21,0.35);border-radius:10px;padding:12px;margin-bottom:16px;text-align:left;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid rgba(250,204,21,0.2);padding-bottom:6px;">
            <span style="font-size:10px;color:#94a3b8;font-family:'Press Start 2P',monospace;">${typeof t === 'function' ? t('gamble.budget.stakes_label', 'BUDGET AT STAKE:') : 'BUDGET AT STAKE:'}</span>
            <span style="font-size:14px;color:#facc15;font-weight:bold;font-family:'Press Start 2P',monospace;">$${currentBudget}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:10.5px;">
            <div style="background:rgba(16,185,129,0.12);border:1px solid #10b981;border-radius:6px;padding:8px;">
              <div style="color:#10b981;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px;">${typeof t === 'function' ? t('gamble.budget.win_label', '🟢 50% IF YOU WIN:') : '🟢 50% IF YOU WIN:'}</div>
              <div style="color:#00ff66;font-weight:bold;font-size:13px;font-family:'Press Start 2P',monospace;">$${tripleAmount}</div>
              <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">${typeof t === 'function' ? t('gamble.budget.win_detail', '(You receive 3x!)') : '(You receive 3x!)'}</div>
            </div>
            <div style="background:rgba(239,68,68,0.12);border:1px solid #ef4444;border-radius:6px;padding:8px;">
              <div style="color:#ef4444;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px;">${typeof t === 'function' ? t('gamble.budget.lose_label', '🔴 50% IF YOU LOSE:') : '🔴 50% IF YOU LOSE:'}</div>
              <div style="color:#ef4444;font-weight:bold;font-size:13px;font-family:'Press Start 2P',monospace;">$0</div>
              <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">${typeof t === 'function' ? t('gamble.budget.lose_detail', '(Lose everything)') : '(Lose everything)'}</div>
            </div>
          </div>
        </div>
      `;
    } else if (gamble.id === 'gamble_blind_trade') {
      let worstPos = 'DH', worstName = 'Starter', worstRarity = 'Common';
      let worstOvr = Infinity;
      Object.keys(window.Game.roster).forEach(pos => {
        const p = window.Game.roster[pos];
        if (p) {
          const ovr = getPlayerOvr(p);
          if (ovr < worstOvr) { worstOvr = ovr; worstPos = pos; worstName = p.name; worstRarity = p.rarity; }
        }
      });

      calcCardHTML = `
        <div style="background:rgba(56,189,248,0.08);border:1.5px solid rgba(56,189,248,0.35);border-radius:10px;padding:12px;margin-bottom:16px;text-align:left;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid rgba(56,189,248,0.2);padding-bottom:6px;">
            <span style="font-size:9.5px;color:#94a3b8;font-family:'Press Start 2P',monospace;">${typeof t === 'function' ? t('gamble.trade.stakes_label', 'WEAKEST STARTER AT STAKE:') : 'WEAKEST STARTER AT STAKE:'}</span>
            <span style="font-size:10px;color:#38bdf8;font-weight:bold;font-family:'Press Start 2P',monospace;">[${worstPos}] ${worstName} (${worstRarity})</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:10.5px;">
            <div style="background:rgba(16,185,129,0.12);border:1px solid #10b981;border-radius:6px;padding:8px;">
              <div style="color:#10b981;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px;">${typeof t === 'function' ? t('gamble.trade.win_label', '🟢 50% IF YOU WIN:') : '🟢 50% IF YOU WIN:'}</div>
              <div style="color:#00ff66;font-weight:bold;font-size:11px;line-height:1.3;">${typeof t === 'function' ? t('gamble.trade.win_title', 'Guaranteed Higher Rarity') : 'Guaranteed Higher Rarity'}</div>
              <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">${typeof t === 'function' ? t('gamble.trade.win_detail', '(Epic or Legendary)') : '(Epic or Legendary)'}</div>
            </div>
            <div style="background:rgba(239,68,68,0.12);border:1px solid #ef4444;border-radius:6px;padding:8px;">
              <div style="color:#ef4444;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px;">${typeof t === 'function' ? t('gamble.trade.lose_label', '🔴 50% IF YOU LOSE:') : '🔴 50% IF YOU LOSE:'}</div>
              <div style="color:#ef4444;font-weight:bold;font-size:11px;line-height:1.3;">${typeof t === 'function' ? t('gamble.trade.lose_title', 'Common + 🔒 2-Node Lock') : 'Common + 🔒 2-Node Lock'}</div>
              <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">${typeof t === 'function' ? t('gamble.trade.lose_detail', '(No draft for 2 nodes)') : '(No draft for 2 nodes)'}</div>
            </div>
          </div>
        </div>
      `;
    } else if (gamble.id === 'gamble_forbidden_synergy') {
      calcCardHTML = `
        <div style="background:rgba(192,132,252,0.08);border:1.5px solid rgba(192,132,252,0.35);border-radius:10px;padding:12px;margin-bottom:16px;text-align:left;">
          <div style="margin-bottom:8px;border-bottom:1px solid rgba(192,132,252,0.2);padding-bottom:6px;">
            <span style="font-size:9.5px;color:#c084fc;font-family:'Press Start 2P',monospace;">${typeof t === 'function' ? t('gamble.synergy.stakes_label', 'SELECTED ERA PLAYER:') : 'SELECTED ERA PLAYER:'}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:10.5px;">
            <div style="background:rgba(16,185,129,0.12);border:1px solid #10b981;border-radius:6px;padding:8px;">
              <div style="color:#10b981;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px;">${typeof t === 'function' ? t('gamble.synergy.win_label', '🟢 50% IF YOU WIN:') : '🟢 50% IF YOU WIN:'}</div>
              <div style="color:#00ff66;font-weight:bold;font-size:11px;line-height:1.3;">${typeof t === 'function' ? t('gamble.synergy.win_title', '4x Power for Era Synergy!') : '4x Power for Era Synergy!'}</div>
              <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">${typeof t === 'function' ? t('gamble.synergy.win_detail', '(Counts as 4 players)') : '(Counts as 4 players)'}</div>
            </div>
            <div style="background:rgba(239,68,68,0.12);border:1px solid #ef4444;border-radius:6px;padding:8px;">
              <div style="color:#ef4444;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px;">${typeof t === 'function' ? t('gamble.synergy.lose_label', '🔴 50% IF YOU LOSE:') : '🔴 50% IF YOU LOSE:'}</div>
              <div style="color:#ef4444;font-weight:bold;font-size:11px;line-height:1.3;">${typeof t === 'function' ? t('gamble.synergy.lose_title', '2 Teammates Lose Era Synergy') : '2 Teammates Lose Era Synergy'}</div>
              <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">${typeof t === 'function' ? t('gamble.synergy.lose_detail', '(Permanent penalty)') : '(Permanent penalty)'}</div>
            </div>
          </div>
        </div>
      `;
    } else if (gamble.id === 'gamble_scout') {
      calcCardHTML = `
        <div style="background:rgba(245,158,11,0.08);border:1.5px solid rgba(245,158,11,0.35);border-radius:10px;padding:12px;margin-bottom:16px;text-align:left;">
          <div style="margin-bottom:8px;border-bottom:1px solid rgba(245,158,11,0.2);padding-bottom:6px;">
            <span style="font-size:9.5px;color:#f59e0b;font-family:'Press Start 2P',monospace;">${typeof t === 'function' ? t('gamble.scout.stakes_label', 'ELITE RECRUITMENT OFFER:') : 'ELITE RECRUITMENT OFFER:'}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:10.5px;">
            <div style="background:rgba(16,185,129,0.12);border:1px solid #10b981;border-radius:6px;padding:8px;">
              <div style="color:#10b981;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px;">${typeof t === 'function' ? t('gamble.scout.win_label', '🟢 50% IF YOU WIN:') : '🟢 50% IF YOU WIN:'}</div>
              <div style="color:#00ff66;font-weight:bold;font-size:11px;line-height:1.3;">${typeof t === 'function' ? t('gamble.scout.win_title', 'Free LEGENDARY Player!') : 'Free LEGENDARY Player!'}</div>
              <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">${typeof t === 'function' ? t('gamble.scout.win_detail', '(Weakest position upgrade)') : '(Weakest position upgrade)'}</div>
            </div>
            <div style="background:rgba(239,68,68,0.12);border:1px solid #ef4444;border-radius:6px;padding:8px;">
              <div style="color:#ef4444;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px;">${typeof t === 'function' ? t('gamble.scout.lose_label', '🔴 50% IF YOU LOSE:') : '🔴 50% IF YOU LOSE:'}</div>
              <div style="color:#ef4444;font-weight:bold;font-size:11px;line-height:1.3;">${typeof t === 'function' ? t('gamble.scout.lose_title', 'Best Player Injured (-20 Stats)') : 'Best Player Injured (-20 Stats)'}</div>
              <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">${typeof t === 'function' ? t('gamble.scout.lose_detail', '(Affects highest OVR player)') : '(Affects highest OVR player)'}</div>
            </div>
          </div>
        </div>
      `;
    }

    const gambleTitle = gamble.title;
    const gambleDesc = gamble.desc;

    overlay.innerHTML = `
      <div class="gamble-tension-box" style="max-width:580px;width:92%;text-align:center;padding:24px;background:#090d16;border:2.5px solid #10b981;box-shadow:0 0 50px rgba(16,185,129,0.35), inset 0 0 25px rgba(0,0,0,0.9);border-radius:18px;">
        <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:rgba(16,185,129,0.18);border:1.5px solid #10b981;border-radius:20px;font-family:'Press Start 2P',monospace;font-size:9.5px;color:#34d399;text-shadow:0 0 12px rgba(16,185,129,0.8);letter-spacing:1px;margin-bottom:12px;">
          <i class="fa-solid fa-clover"></i> ${typeof t === 'function' ? t('gamble.header', '🍀 EVENTO DE SUERTE (LUCK)') : '🍀 EVENTO DE SUERTE (LUCK)'}
        </div>
        <div style="font-size:24px;margin:4px 0 10px;font-family:'Outfit',sans-serif;font-weight:bold;color:#fff;">
          <span style="margin-right:8px;filter:drop-shadow(0 0 10px rgba(250,204,21,0.6));">${gamble.icon}</span>${gambleTitle}
        </div>
        <div style="font-size:12.5px;color:#cbd5e1;margin-bottom:16px;line-height:1.5;padding:0 10px;">${gambleDesc}</div>

        ${calcCardHTML}

        <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin:16px 0;">
          <div class="gamble-outcome-card gamble-outcome-win" style="flex:1;max-width:140px;background:rgba(16,185,129,0.12);border:1.5px solid #10b981;border-radius:10px;padding:10px 8px;box-shadow:0 0 15px rgba(16,185,129,0.2);">
            <div style="font-size:26px;">🍀</div>
            <div style="font-size:8px;color:#10b981;font-weight:bold;font-family:'Press Start 2P',monospace;margin-top:6px;">
              ${typeof t === 'function' ? t('gamble.success_chance', 'ÉXITO (50%)') : 'ÉXITO (50%)'}
            </div>
          </div>
          <div class="gamble-coin-wrap" style="width:84px;height:84px;">
            <div class="gamble-coin" id="gamble-coin" style="font-size:38px;box-shadow:0 0 30px rgba(16,185,129,0.6);border:3px solid #34d399;">🍀</div>
          </div>
          <div class="gamble-outcome-card gamble-outcome-lose" style="flex:1;max-width:140px;background:rgba(239,68,68,0.12);border:1.5px solid #ef4444;border-radius:10px;padding:10px 8px;box-shadow:0 0 15px rgba(239,68,68,0.2);">
            <div style="font-size:26px;">💀</div>
            <div style="font-size:8px;color:#ef4444;font-weight:bold;font-family:'Press Start 2P',monospace;margin-top:6px;">
              ${typeof t === 'function' ? t('gamble.fail_chance', 'FALLO (50%)') : 'FALLO (50%)'}
            </div>
          </div>
        </div>

        ${gamble.requiresTargetPlayer ? `
          <div style="margin-bottom:16px;text-align:left;">
            <label style="font-size:10px;color:#94a3b8;display:block;margin-bottom:6px;font-family:'Press Start 2P',monospace;">${typeof t === 'function' ? t('gamble.choose_target', 'Elige el jugador objetivo:') : 'Elige el jugador objetivo:'}</label>
            <select id="gamble-target-select" style="width:100%;padding:10px;background:#0a0f18;color:#fff;border:1px solid rgba(16,185,129,0.4);border-radius:8px;font-size:11px;">
              ${rosterOptions || `<option disabled>${typeof t === 'function' ? t('gamble.no_valid_era_players', 'Sin jugadores con Era válida') : 'Sin jugadores con Era válida'}</option>`}
            </select>
          </div>
        ` : ''}

        <div id="gamble-result" style="min-height:28px;font-size:12.5px;font-weight:bold;margin:12px 0;line-height:1.4;"></div>

        <div style="display:flex;gap:12px;justify-content:center;margin-top:8px;">
          <button class="btn" id="btn-gamble-bet" style="background:linear-gradient(135deg,#10b981,#059669);color:#000;font-weight:bold;font-family:'Press Start 2P',monospace;font-size:9.5px;padding:12px 20px;border:none;box-shadow:0 4px 15px rgba(16,185,129,0.4);">
            ${typeof t === 'function' ? t('gamble.bet_btn', '🍀 PROBAR SUERTE') : '🍀 PROBAR SUERTE'}
          </button>
          <button class="btn btn-secondary" id="btn-gamble-decline" style="font-family:'Press Start 2P',monospace;font-size:9px;padding:12px 18px;border:1px solid rgba(255,255,255,0.2);">
            ${typeof t === 'function' ? t('gamble.reject_btn', '🚪 PASAR') : '🚪 PASAR'}
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    let betResolved = false;
    const betBtn = overlay.querySelector('#btn-gamble-bet');
    const declineBtn = overlay.querySelector('#btn-gamble-decline');

    declineBtn.addEventListener('click', () => {
      overlay.remove();
      if (!betResolved && window.Game && typeof window.Game.logRunNode === 'function') {
        window.Game.logRunNode({
          type: 'gamble_skip',
          icon: '🚪',
          title: `Suerte Declinada`,
          titleEN: `Luck Passed`,
          desc: `Decidiste no arriesgarte en el nodo de la suerte`,
          descEN: `Decided not to risk anything at the luck event`,
          status: 'neutral'
        });
      }
      if (betResolved) {
        renderActiveRoster();
        renderSynergiesAndItems();
        updateHUD();
      }
      closeNodeCompleted();
    });

    betBtn.addEventListener('click', () => {
      const select = overlay.querySelector('#gamble-target-select');
      if (gamble.requiresTargetPlayer && (!select || !select.value)) return;

      betBtn.disabled = true;
      declineBtn.disabled = true;

      const result = window.Game.resolveGamble(gamble.id, select ? select.value : null);
      betResolved = true;

      const coin = overlay.querySelector('#gamble-coin');
      coin.classList.add('gamble-coin-flipping');

      // Ticking audio and escalating dice roll sound while spinning
      if (window.AudioManager && typeof window.AudioManager.play === 'function') {
        window.AudioManager.play('defense_dice_roll');
      }

      const spinDurationMs = 1800;
      const swapEveryMs = 100;
      const totalSwaps = Math.floor(spinDurationMs / swapEveryMs);
      let swapCount = 0;
      const swapInterval = setInterval(() => {
        swapCount++;
        const showingFail = swapCount % 2 === 0;
        coin.textContent = showingFail ? '💀' : '🍀';
        coin.classList.toggle('gamble-coin-fail', showingFail);
        if (window.AudioManager && typeof window.AudioManager.play === 'function') {
          window.AudioManager.play('roulette_tick');
        }
        if (swapCount >= totalSwaps) {
          clearInterval(swapInterval);
          coin.classList.remove('gamble-coin-flipping');
          coin.textContent = result.success ? '🍀' : '💀';
          coin.classList.toggle('gamble-coin-fail', !result.success);
        }
      }, swapEveryMs);

      setTimeout(() => {
        const resultEl = overlay.querySelector('#gamble-result');
        resultEl.style.color = result.success ? '#10b981' : '#ef4444';
        resultEl.style.fontFamily = "'Outfit', sans-serif";
        resultEl.textContent = result.resultText;

        if (window.Game && typeof window.Game.logRunNode === 'function') {
          window.Game.logRunNode({
            type: 'gamble',
            icon: result.success ? '🍀' : '💀',
            title: result.success ? `Suerte Exitosa: ${gamble.title}` : `Mala Suerte: ${gamble.title}`,
            titleEN: result.success ? `Luck Success: ${gamble.title}` : `Unlucky: ${gamble.title}`,
            desc: result.resultText || '',
            descEN: result.resultText || '',
            status: result.success ? 'success' : 'danger'
          });
        }

        if (window.AudioManager && typeof window.AudioManager.play === 'function') {
          window.AudioManager.play(result.success ? 'roulette_win' : 'defense_error');
        }

        if (result.success) {
          coin.style.boxShadow = "0 0 35px #10b981";
        } else {
          coin.style.boxShadow = "0 0 35px #ef4444";
          overlay.querySelector('div').classList.add('retro-shake-anim');
        }

        betBtn.style.display = 'none';
        declineBtn.textContent = typeof t === 'function' ? t('career.continue', 'Continuar') : 'Continuar';
        declineBtn.className = 'btn';
        declineBtn.style.background = '#10b981';
        declineBtn.style.color = '#000';
        declineBtn.style.fontWeight = 'bold';
        declineBtn.disabled = false;
      }, spinDurationMs + 150);
    });
  }

  // ── STORY SEASON INTRO MODAL (Kickoff of Story Mode Campaign) ────────
  function showStorySeasonIntroModal(onProceed) {
    if (!window.Game || window.Game.selectedMode !== 'story') {
      if (onProceed) onProceed();
      return;
    }
    const year = window.Game.selectedSeasonYear;
    const zones = window.Game.selectedDivisions || [];
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(10px);z-index:500;display:flex;align-items:center;justify-content:center;';

    const zonesListHTML = zones.map((z, i) => {
      let icon = '⚾';
      const lbl = (z.label || '').toLowerCase();
      if (lbl.includes('negro') || lbl.includes('all-stars') || lbl.includes('classic') || lbl.includes('pennant') || lbl.includes('champion')) icon = '👑';
      else if (lbl.includes('federal')) icon = '⚡';

      const bossName = z.boss ? (z.boss.name || 'All-Stars').replace('👑 ', '').replace('⚡ ', '') : 'All-Stars';
      const teamCount = z.teams ? z.teams.length : 0;
      const zoneLabelText = (typeof window.t === 'function') ? window.t('ui.story_zone_label', { num: i + 1, label: (z.label || '').toUpperCase(), defaultValue: `ZONA ${i + 1}: ${(z.label || '').toUpperCase()}` }) : `ZONA ${i + 1}: ${(z.label || '').toUpperCase()}`;
      const zoneSubText = (typeof window.t === 'function') ? window.t('ui.story_zone_sub', { count: teamCount, boss: bossName, defaultValue: `${teamCount} equipos • Boss: ${bossName}` }) : `${teamCount} equipos • Boss: ${bossName}`;

      return `
        <div class="story-zone-card" style="opacity:0;transform:translateY(8px);transition:opacity 0.4s ease-out,transform 0.4s ease-out;transition-delay:${0.15 + i * 0.2}s;display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:8px;margin-bottom:6px;">
          <span style="font-size:16px;">${icon}</span>
          <div style="text-align:left;flex:1;">
            <div style="font-size:11px;font-weight:bold;color:#fef08a;">${zoneLabelText}</div>
            <div style="font-size:9.5px;color:#94a3b8;">${zoneSubText}</div>
          </div>
        </div>
      `;
    }).join('');

    const headerText = (typeof window.t === 'function') ? window.t('ui.story_mode_header', { year: year, defaultValue: `MODO HISTORIA: ${year}` }) : `MODO HISTORIA: ${year}`;
    const introTitle = (typeof window.t === 'function') ? window.t('ui.story_intro_title', { defaultValue: '¡Comienza la Campaña Histórica!' }) : '¡Comienza la Campaña Histórica!';
    const introDesc = (typeof window.t === 'function') ? window.t('ui.story_intro_desc', { defaultValue: 'Deberás conquistar las 4 zonas del mapa derrotando a los equipos y a los <strong>Jefes All-Stars</strong> de cada circuito:' }) : 'Deberás conquistar las 4 zonas del mapa derrotando a los equipos y a los <strong>Jefes All-Stars</strong> de cada circuito:';
    const enterMapBtn = (typeof window.t === 'function') ? window.t('ui.story_enter_map_btn', { defaultValue: '¡ENTRAR AL MAPA! 🗺️' }) : '¡ENTRAR AL MAPA! 🗺️';

    overlay.innerHTML = `
      <div style="background:#090d16;border:2px solid #3b82f6;border-radius:16px;padding:24px;max-width:480px;width:92%;text-align:center;box-shadow:0 0 40px rgba(59,130,246,0.4);">
        <div style="font-family:'Press Start 2P',monospace;font-size:12px;color:#60a5fa;margin-bottom:8px;letter-spacing:1px;">
          ⚾ ${headerText} ⚾
        </div>
        <div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:8px;">
          ${introTitle}
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:16px;line-height:1.4;">
          ${introDesc}
        </div>
        ${zonesListHTML ? `<div style="margin-bottom:18px;">${zonesListHTML}</div>` : ''}
        <button id="btn-start-story-campaign" class="btn" style="background:linear-gradient(90deg,#3b82f6,#1d4ed8);color:#fff;font-weight:bold;font-size:11px;padding:12px 24px;width:100%;border:none;cursor:pointer;border-radius:8px;letter-spacing:0.5px;box-shadow:0 0 15px rgba(59,130,246,0.4);">
          ${enterMapBtn}
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    void overlay.offsetHeight;

    setTimeout(() => {
      overlay.querySelectorAll('.story-zone-card').forEach(row => {
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
      });
    }, 20);

    document.getElementById('btn-start-story-campaign').addEventListener('click', () => {
      overlay.remove();
      if (onProceed) onProceed();
    });
  }

  // ── ZONE BOSS INTRO MODAL (Stages 3, 7, 11) ─────────────────────────
  function showZoneBossIntroModal(bossEnemy, onProceed) {
    if (!bossEnemy) {
      if (onProceed) onProceed();
      return;
    }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(10px);z-index:500;display:flex;align-items:center;justify-content:center;';

    const currentZoneIdx = (typeof window.Game.getZoneForStage === 'function') ? window.Game.getZoneForStage(window.Game.currentStageIndex) : 0;
    const zoneDivision = window.Game.selectedDivisions && window.Game.selectedDivisions[currentZoneIdx];
    const divName = zoneDivision ? zoneDivision.label : (bossEnemy.division || bossEnemy.league || 'All-Stars');

    let divIcon = '👑';
    if (divName.toLowerCase().includes('federal')) divIcon = '⚡';

    const pitchers = bossEnemy.pitchers || [];
    const pitcherRowsHTML = pitchers.map((p, i) => {
      const rarityColor = RARITY_COLORS[p.rarity] || '#ffd700';
      const rarityBg = RARITY_BG[p.rarity] || 'rgba(255,215,0,0.1)';
      const pH9  = p.h9  !== undefined ? p.h9  : (p.h9_val  !== undefined ? p.h9_val  : (p.grt !== undefined ? p.grt : 50));
      const pK9  = p.k9  !== undefined ? p.k9  : (p.k9_val  !== undefined ? p.k9_val  : (p.stf !== undefined ? p.stf : 50));
      const pBB9 = p.bb9 !== undefined ? p.bb9 : (p.bb9_val !== undefined ? p.bb9_val : (p.ctl !== undefined ? p.ctl : 50));
      const pHR9 = p.hr9 !== undefined ? p.hr9 : (p.hr9_val !== undefined ? p.hr9_val : (p.mov !== undefined ? p.mov : 50));
      return `
        <div class="zone-boss-pitcher-row" style="opacity:0;transform:translateY(8px);transition:opacity 0.4s ease-out,transform 0.4s ease-out;transition-delay:${0.25 + i * 0.3}s;display:flex;align-items:center;gap:10px;padding:8px 12px;background:${rarityBg};border:1px solid ${rarityColor};border-radius:8px;margin-bottom:8px;">
          <span style="font-size:16px;">${divIcon}</span>
          <div style="text-align:left;">
            <div style="font-size:11.5px;color:#fff;font-weight:bold;">${p.cleanName || p.name}</div>
            <div style="font-size:9px;color:#94a3b8;margin-top:2px;">${p.role || 'SP'} • H/9 ${pH9} • K/9 ${pK9} • BB/9 ${pBB9} • HR/9 ${pHR9}</div>
          </div>
          <div style="margin-left:auto;text-align:right;">
            <span style="font-size:9px;font-weight:bold;color:${rarityColor};text-transform:uppercase;background:rgba(0,0,0,0.4);padding:2px 6px;border-radius:4px;">${p.rarity || 'Epic'}</span>
            <div style="font-size:10px;font-weight:bold;color:#fef08a;margin-top:2px;">OVR ${p.ovr || 50}</div>
          </div>
        </div>
      `;
    }).join('');

    const bossTitle = typeof window.t === 'function' ? window.t('ui.zone_boss_title', { defaultValue: '¡DESAFÍO DIVISIONAL!' }) : '¡DESAFÍO DIVISIONAL!';
    const bossSubtitle = typeof window.t === 'function' ? window.t('ui.zone_boss_subtitle', { defaultValue: 'Los 3 mejores lanzadores de esta liga defienden su circuito:' }) : 'Los 3 mejores lanzadores de esta liga defienden su circuito:';
    const bossBtn = typeof window.t === 'function' ? window.t('ui.zone_boss_btn', { defaultValue: '¡A BATEAR CONTRA EL JEFE! ⚾' }) : '¡A BATEAR CONTRA EL JEFE! ⚾';

    overlay.innerHTML = `
      <div style="background:#090d16;border:2px solid #ffd700;border-radius:16px;padding:24px;max-width:460px;width:90%;text-align:center;box-shadow:0 0 35px rgba(255,215,0,0.4);">
        <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:#ffd700;margin-bottom:10px;text-shadow:0 0 8px #ffd700;">
          ${divIcon} ${bossTitle} ${divIcon}
        </div>
        <div style="font-size:14px;color:#fff;font-weight:bold;margin-bottom:6px;">
          ${bossEnemy.name}
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:16px;">
          ${bossSubtitle}
        </div>
        ${pitcherRowsHTML ? `<div style="margin-bottom:16px;">${pitcherRowsHTML}</div>` : ''}
        <button id="btn-start-zone-boss" class="btn" style="background:linear-gradient(90deg,#ffd700,#f59e0b);color:#000;font-weight:bold;font-size:11px;padding:12px 24px;width:100%;border:none;cursor:pointer;border-radius:8px;letter-spacing:0.5px;">
          ${bossBtn}
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    void overlay.offsetHeight;

    setTimeout(() => {
      overlay.querySelectorAll('.zone-boss-pitcher-row').forEach(row => {
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
      });
    }, 20);

    document.getElementById('btn-start-zone-boss').addEventListener('click', () => {
      overlay.remove();
      if (onProceed) onProceed();
    });
  }

  // ── SUPER BOSS INTRO MODAL ────────────────────────────────────────────
  function showSuperBossIntroModal(onProceed) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(10px);z-index:500;display:flex;align-items:center;justify-content:center;';

    // Reveal the 4-legend roster one name at a time for a cinematic beat
    // rather than dumping the whole roster on screen at once.
    const legends = (window.Game.currentEnemy && window.Game.currentEnemy.pitchers) || [];
    const legendRowsHTML = legends.map((p, i) => `
      <div class="super-boss-legend-row" style="opacity:0;transform:translateY(8px);transition:opacity 0.4s ease-out,transform 0.4s ease-out;transition-delay:${0.3 + i * 0.35}s;display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,215,0,0.08);border-radius:6px;margin-bottom:6px;">
        <span style="font-size:14px;">⚾</span>
        <span style="font-size:10.5px;color:#fef08a;font-weight:bold;">${p.cleanName || p.name}</span>
        <span style="font-size:9px;color:#94a3b8;margin-left:auto;">${p.role || ''}</span>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="background:#090d16;border:3px solid #ffd700;border-radius:16px;padding:24px;max-width:440px;width:90%;text-align:center;box-shadow:0 0 40px rgba(255,215,0,0.5);">
        <div style="font-family:'Press Start 2P',monospace;font-size:14px;color:#ffd700;margin-bottom:12px;text-shadow:0 0 10px #ffd700;">⚡ SUPER BOSS FIGHT ⚡</div>
        <div style="font-size:12.5px;color:#fff;font-weight:bold;margin-bottom:16px;line-height:1.5;">
          ${typeof window.t==='function'?window.t('ui.super_boss_defeated_first_group'):'¡Derrotaste al primer grupo del Playoffs!'}<br>
          <span style="color:#22d3ee;">${typeof window.t==='function'?window.t('ui.super_boss_desc'):'¡Pero las 4 Máximas Leyendas del Béisbol saltan al campo para la Batalla Final!'}</span>
        </div>
        ${legendRowsHTML ? `<div style="margin-bottom:14px;">${legendRowsHTML}</div>` : ''}
        <div style="background:rgba(255,215,0,0.1);border:1px solid #ffd700;border-radius:8px;padding:10px;font-size:11px;color:#fef08a;margin-bottom:20px;">
          ${typeof window.t==='function'?window.t('ui.super_boss_final_phase_html'):'🔥 <strong>Fase Final Especial (4 Pitchers Leyenda)</strong>'}<br>
          ${typeof window.t==='function'?window.t('ui.hp_restored'):'Tu equipo ha recuperado +30 HP y Escudo Máximo.'}
        </div>
        <button id="btn-start-super-boss" class="btn" style="background:linear-gradient(90deg,#ffd700,#f59e0b);color:#000;font-weight:bold;font-size:11px;padding:12px 24px;width:100%;border:none;cursor:pointer;">${typeof window.t==='function'?window.t('ui.super_boss_fight_btn'):'¡ENFRENTAR AL SUPER BOSS FINAL! ⚾'}</button>
      </div>
    `;
    document.body.appendChild(overlay);
    void overlay.offsetHeight; // force layout so the 0% state paints before we transition

    // Trigger the staggered reveal transition on the next tick (setTimeout, not rAF —
    // more reliably fires across environments/tabs than a raf callback here).
    setTimeout(() => {
      overlay.querySelectorAll('.super-boss-legend-row').forEach(row => {
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
      });
    }, 20);

    document.getElementById('btn-start-super-boss').addEventListener('click', () => { overlay.remove(); if (onProceed) onProceed(); });
  }

  // GAME OVER VIEW
  function triggerGameOver(won, message) {
    if (window.BaseballDex && window.Game && window.Game.roster) {
      window.BaseballDex.unlockRoster(window.Game.roster);
    }
    el.gameoverTitle.innerText = won ? (typeof window.t==='function'?window.t('gameover.title_won', { defaultValue: "¡CAMPEONATO CONSEGUIDO!" }):"¡CAMPEONATO CONSEGUIDO!") : (typeof window.t==='function'?window.t('gameover.title_lost', { defaultValue: "¡Temporada Terminada!" }):"¡Temporada Terminada!");
    el.gameoverTitle.style.color = won ? "var(--primary-color)" : "var(--danger-color)";
    el.gameoverDesc.innerText = message;

    // Render game history logs
    el.gameoverHistoryLog.innerHTML = "";
    if (window.Game.history.length === 0) {
      el.gameoverHistoryLog.innerHTML = `<div style="color:#64748b; font-size:13px;">${typeof window.t==='function'?window.t('gameover.no_history', { defaultValue: 'No hay historial disponible.' }):'No hay historial disponible.'}</div>`;
    } else {
      window.Game.history.forEach(h => {
        const row = document.createElement('div');
        row.className = `history-row ${h.won ? 'won' : 'lost'}`;
        const facedLabel = (h.pitchersFaced !== undefined && h.totalPitchers)
          ? ` <span style="color:#64748b;font-size:11px;">(${h.pitchersFaced}/${h.totalPitchers} ${typeof window.t==='function'?window.t('gameover.pitchers_faced', { defaultValue: 'pitchers enfrentados' }):'pitchers enfrentados'})</span>`
          : '';
        const stageTxt = typeof window.t==='function'?window.t('gameover.stage_label', { num: h.stage + 1, defaultValue: `Etapa ${h.stage + 1}` }):`Etapa ${h.stage + 1}`;
        const resultTxt = h.won ? (typeof window.t==='function'?window.t('gameover.won_label', { defaultValue: 'VICTORIA' }):'VICTORIA') : (typeof window.t==='function'?window.t('gameover.lost_label', { defaultValue: 'DERROTA' }):'DERROTA');
        row.innerHTML = `
          <span>${stageTxt}: vs ${h.enemyName}</span>
          <strong>${resultTxt} (${h.ourScore}-${h.enemyScore})</strong>${facedLabel}
        `;
        el.gameoverHistoryLog.appendChild(row);
      });
    }

    window.showScreen('screen-gameover');
  }

  // ── TRUE VICTORY SCREEN ──────────────────────────────────────────────────
  function triggerTrueVictory() {
    if (window.BaseballDex && window.Game && window.Game.roster) {
      window.BaseballDex.unlockRoster(window.Game.roster);
    }
    const isQuickMode = window.Game && window.Game.selectedMode === 'quick';
    const wasChallengeLocked = window.Challenge162 && !window.Challenge162.isModeUnlocked();

    if (isQuickMode && window.Challenge162 && typeof window.Challenge162.unlockMode === 'function') {
      window.Challenge162.unlockMode();
    } else if (isQuickMode) {
      try { localStorage.setItem('baserogue_challenge162_unlocked', '1'); } catch (e) {}
    }

    if (window.Challenge162 && window.Game) {
      window.Challenge162.unlockFromRun(window.Game);
    }
    window.showScreen('screen-victory');
    startFireworks();

    if (isQuickMode && wasChallengeLocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('🏆 ¡MODO 162-0 CHALLENGE DESBLOQUEADO!');
      }
    }

    const goto162Btn = document.getElementById('btn-victory-goto-challenge162');
    if (goto162Btn) {
      goto162Btn.onclick = () => {
        if (!window.Challenge162) return;
        if (window.Challenge162.hasSave() && window.Challenge162.load() && window.Challenge162.state) {
          window.Challenge162.showScreen('screen-challenge-season');
          window.Challenge162.render();
        } else {
          window.Challenge162.startRosterBuilder();
        }
      };
    }
  }

  function startFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const colors = ['#ffd700', '#ff4500', '#00ff66', '#22d3ee', '#a855f7', '#ff69b4', '#fff'];

    function createBurst(x, y) {
      const count = 50 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.3;
        const speed = 2.5 + Math.random() * 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: 0.012 + Math.random() * 0.015,
          radius: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          tail: []
        });
      }
    }

    // Auto-launch fireworks
    const launchInterval = setInterval(() => {
      const x = canvas.width * (0.15 + Math.random() * 0.70);
      const y = canvas.height * (0.05 + Math.random() * 0.55);
      createBurst(x, y);
    }, 600);

    // Initial burst for immediate wow
    setTimeout(() => createBurst(canvas.width * 0.5, canvas.height * 0.3), 100);
    setTimeout(() => createBurst(canvas.width * 0.25, canvas.height * 0.4), 350);
    setTimeout(() => createBurst(canvas.width * 0.75, canvas.height * 0.35), 600);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = p.life * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    draw();

    // Stop launching after 20s but keep existing particles
    setTimeout(() => clearInterval(launchInterval), 20000);
    canvas._stopFireworks = () => clearInterval(launchInterval);
  }

  // ── RUN SUMMARY MODAL ─────────────────────────────────────────────────────
  function openRunSummaryModal() {
    if (window.BaseballDex && window.Game && window.Game.roster) {
      window.BaseballDex.unlockRoster(window.Game.roster);
      if (window.Game.runRosterHistory) {
        Object.values(window.Game.runRosterHistory).forEach(p => window.BaseballDex.unlock(p));
      }
    }
    const modal = document.getElementById('modal-run-summary');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.scrollTop = 0;
    const boxEl = modal.querySelector('.modal-run-summary-box');
    if (boxEl) boxEl.scrollTop = 0;

    // Render batter stats
    const tbodyB = document.getElementById('summary-tbody-batters');
    const batterStats = window.Game.runBatterStats || {};
    const rosterHistory = window.Game.runRosterHistory || {};
    const allBatterNames = new Set([...Object.keys(batterStats), ...Object.keys(rosterHistory)]);

    // Render Team totals & Defensive errors header
    const headerTotalsEl = document.getElementById('summary-team-totals-header');
    if (headerTotalsEl) {
      let totAB = 0, totH = 0, tot2B = 0, tot3B = 0, totHR = 0, totRBI = 0, totSB = 0, totBB = 0, totSO = 0, totE = 0;
      Object.values(batterStats).forEach(s => {
        totAB += (s.ab || 0);
        totH += (s.h || 0);
        tot2B += (s.doubles || 0);
        tot3B += (s.triples || 0);
        totHR += (s.hr || 0);
        totRBI += (s.rbi || 0);
        totSB += (s.sb || 0);
        totBB += (s.bb || 0);
        totSO += (s.so || 0);
        totE += (s.e || 0);
      });
      const defErrors = totE;
      const tPA = totAB + totBB;
      const tAvg = totAB > 0 ? (totH / totAB).toFixed(3).replace(/^0/, '') : '.000';
      const tOBP = tPA > 0 ? ((totH + totBB) / tPA).toFixed(3).replace(/^0/, '') : '.000';
      const tSLG = totAB > 0 ? ((Math.max(0, totH - tot2B - tot3B - totHR) + 2*tot2B + 3*tot3B + 4*totHR) / totAB).toFixed(3).replace(/^0/, '') : '.000';
      const tOPS = (totAB > 0 || tPA > 0) ? (parseFloat(tOBP) + parseFloat(tSLG)).toFixed(3) : '.000';

      headerTotalsEl.innerHTML = `
        <div style="background:linear-gradient(135deg,rgba(16,185,129,0.08) 0%,rgba(14,165,233,0.08) 100%);border:1px solid rgba(56,189,248,0.3);border-radius:12px;padding:12px 16px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;">
          <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:var(--accent-color);">
            ${typeof t === 'function' ? t('summary.team_defense_badge', '🛡️ DEFENSE & RUN TOTALS') : '🛡️ DEFENSE & RUN TOTALS'}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:9.5px;font-family:'Press Start 2P',monospace;align-items:center;">
            <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#22d3ee;">H: ${totH}</span>
            <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#ef4444;">HR: ${totHR}</span>
            <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#10b981;">RBI: ${totRBI}</span>
            <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#ffd700;">AVG: ${tAvg}</span>
            <span style="background:rgba(255,255,255,0.06);padding:5px 8px;border-radius:6px;color:#00ff66;">OPS: ${tOPS}</span>
            <span style="background:rgba(239,68,68,0.18);border:1.5px solid #ef4444;padding:5px 10px;border-radius:6px;color:#f87171;box-shadow:0 0 10px rgba(239,68,68,0.3);">
              ⚠️ ${typeof t === 'function' ? t('summary.errors_label', 'Errors (E)') : 'Errors (E)'}: <strong style="color:#fff;font-size:11px;">${defErrors}</strong>
            </span>
          </div>
        </div>
      `;
    }

    // ── Batter data preparation & sorting ──────────────────────────────
    const processedBatters = [...allBatterNames].map(name => {
      const s = batterStats[name] || {};
      const g   = s.g  || 0;
      const ab  = s.ab || 0;
      const h   = s.h  || 0;
      const b2  = s.doubles || 0;
      const b3  = s.triples || 0;
      const hr  = s.hr || 0;
      const rbi = s.rbi || 0;
      const sb  = s.sb || 0;
      const bb  = s.bb || 0;
      const so  = s.so || 0;
      const e   = s.e  || 0;

      const b1 = Math.max(0, h - b2 - b3 - hr);
      const pa = ab + bb;
      const totalBases = b1 + (2 * b2) + (3 * b3) + (4 * hr);

      const avgVal = ab > 0 ? (h / ab) : 0;
      const obpVal = pa > 0 ? ((h + bb) / pa) : 0;
      const slgVal = ab > 0 ? (totalBases / ab) : 0;
      const opsVal = obpVal + slgVal;

      return { name, g, ab, h, b2, b3, hr, rbi, sb, bb, so, e, avgVal, obpVal, slgVal, opsVal };
    });

    let currentBatterSortCol = 'opsVal';
    let currentBatterSortAsc = false;

    function renderBattersTable() {
      if (!processedBatters.length) {
        tbodyB.innerHTML = '<tr><td colspan="16" style="padding:12px;color:#64748b;text-align:center;">Sin datos de bateo registrados.</td></tr>';
        return;
      }

      processedBatters.sort((a, b) => {
        let valA = a[currentBatterSortCol];
        let valB = b[currentBatterSortCol];
        if (typeof valA === 'string') {
          return currentBatterSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return currentBatterSortAsc ? (valA - valB) : (valB - valA);
      });

      // Update headers indicators
      const ths = document.querySelectorAll('#summary-thead-batters-row th');
      ths.forEach(th => {
        const col = th.dataset.sort;
        const rawText = th.getAttribute('data-original-label') || th.innerText.replace(/[ ▲▼]/g, '');
        if (!th.getAttribute('data-original-label')) th.setAttribute('data-original-label', rawText);
        if (col === currentBatterSortCol) {
          th.innerHTML = `${rawText} <span style="font-size:9px;color:#facc15;">${currentBatterSortAsc ? '▲' : '▼'}</span>`;
          th.style.color = '#facc15';
        } else {
          th.innerHTML = rawText;
          th.style.color = (col === 'e' ? '#f87171' : 'var(--accent-color)');
        }
      });

      tbodyB.innerHTML = '';
      processedBatters.forEach(s => {
        const avg = s.ab > 0 ? s.avgVal.toFixed(3) : '.000';
        const obp = (s.ab + s.bb) > 0 ? s.obpVal.toFixed(3) : '.000';
        const slg = s.ab > 0 ? s.slgVal.toFixed(3) : '.000';
        const ops = (s.ab > 0 || (s.ab + s.bb) > 0) ? s.opsVal.toFixed(3) : '.000';

        const rowColor = (s.hr >= 2) ? 'rgba(255,215,0,0.05)' : 'transparent';
        const tr = document.createElement('tr');
        tr.style.cssText = `border-bottom:1px solid rgba(255,255,255,0.06);background:${rowColor};`;
        tr.innerHTML = `
          <td style="padding:8px;color:#e2e8f0;font-weight:bold;">${s.name}</td>
          <td style="padding:8px;color:#94a3b8;">${s.g}</td>
          <td style="padding:8px;color:#94a3b8;">${s.ab}</td>
          <td style="padding:8px;color:#22d3ee;">${s.h}</td>
          <td style="padding:8px;color:#f59e0b;">${s.b2}</td>
          <td style="padding:8px;color:#f59e0b;">${s.b3}</td>
          <td style="padding:8px;color:#ef4444;">${s.hr}</td>
          <td style="padding:8px;color:#10b981;">${s.rbi}</td>
          <td style="padding:8px;color:#38bdf8;">${s.sb}</td>
          <td style="padding:8px;color:#a78bfa;">${s.bb}</td>
          <td style="padding:8px;color:#f87171;">${s.so}</td>
          <td style="padding:8px;color:${s.e > 0 ? '#f87171' : '#64748b'};font-weight:${s.e > 0 ? 'bold' : 'normal'};">${s.e}</td>
          <td style="padding:8px;color:${s.avgVal >= 0.300 ? '#ffd700' : '#94a3b8'};font-weight:bold;">${avg}</td>
          <td style="padding:8px;color:${s.obpVal >= 0.380 ? '#38bdf8' : '#94a3b8'};font-weight:bold;">${obp}</td>
          <td style="padding:8px;color:${s.slgVal >= 0.500 ? '#f59e0b' : '#94a3b8'};font-weight:bold;">${slg}</td>
          <td style="padding:8px;color:${s.opsVal >= 0.850 ? '#00ff66' : (s.opsVal >= 0.750 ? '#ffd700' : '#94a3b8')};font-weight:bold;">${ops}</td>
        `;
        tbodyB.appendChild(tr);
      });
    }

    // Attach click listeners to Batter headers
    const batterThs = document.querySelectorAll('#summary-thead-batters-row th');
    batterThs.forEach(th => {
      th.onclick = () => {
        const col = th.dataset.sort;
        if (!col) return;
        if (currentBatterSortCol === col) {
          currentBatterSortAsc = !currentBatterSortAsc;
        } else {
          currentBatterSortCol = col;
          currentBatterSortAsc = (col === 'name');
        }
        renderBattersTable();
      };
    });
    renderBattersTable();

    // ── Pitcher data preparation & sorting ──────────────────────────────
    const tbodyP = document.getElementById('summary-tbody-pitchers');
    const pitcherStats = (window.Game && window.Game.runPitcherStats) || {};
    const pitcherNames = Object.keys(pitcherStats);

    const processedPitchers = pitcherNames.map(name => {
      const ps = pitcherStats[name] || {};
      const outs = ps.outs || 0;
      const er  = ps.er || 0;
      const bb  = ps.bb || 0;
      const h   = ps.h || 0;
      const k   = ps.k || 0;
      const hr  = ps.hr || 0;
      const eraVal = outs > 0 ? ((er * 27) / outs) : 99.0;
      const whipVal = outs > 0 ? ((bb + h) / (outs / 3)) : 99.0;

      return { name, outs, er, bb, h, k, hr, eraVal, whipVal };
    });

    let currentPitcherSortCol = 'outs';
    let currentPitcherSortAsc = false;

    function renderPitchersTable() {
      if (!processedPitchers.length) {
        tbodyP.innerHTML = '<tr><td colspan="9" style="padding:12px;color:#64748b;text-align:center;">Sin datos de lanzadores registrados.</td></tr>';
        return;
      }

      processedPitchers.sort((a, b) => {
        let valA = a[currentPitcherSortCol];
        let valB = b[currentPitcherSortCol];
        if (typeof valA === 'string') {
          return currentPitcherSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return currentPitcherSortAsc ? (valA - valB) : (valB - valA);
      });

      // Update headers indicators
      const ths = document.querySelectorAll('#summary-thead-pitchers-row th');
      ths.forEach(th => {
        const col = th.dataset.sort;
        const rawText = th.getAttribute('data-original-label') || th.innerText.replace(/[ ▲▼]/g, '');
        if (!th.getAttribute('data-original-label')) th.setAttribute('data-original-label', rawText);
        if (col === currentPitcherSortCol) {
          th.innerHTML = `${rawText} <span style="font-size:9px;color:#facc15;">${currentPitcherSortAsc ? '▲' : '▼'}</span>`;
          th.style.color = '#facc15';
        } else {
          th.innerHTML = rawText;
          th.style.color = '#38bdf8';
        }
      });

      tbodyP.innerHTML = '';
      processedPitchers.forEach(ps => {
        const ip = `${Math.floor(ps.outs / 3)}.${ps.outs % 3}`;
        const era = ps.outs > 0 ? ps.eraVal.toFixed(2) : '--.--';
        const whip = ps.outs > 0 ? ps.whipVal.toFixed(2) : '--.--';
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.06);';
        tr.innerHTML = `
          <td style="padding:8px;color:#e2e8f0;font-weight:bold;">${ps.name}</td>
          <td style="padding:8px;color:#22d3ee;">${ip}</td>
          <td style="padding:8px;color:#a78bfa;">${ps.k}</td>
          <td style="padding:8px;color:#fbbf24;">${ps.bb}</td>
          <td style="padding:8px;color:#94a3b8;">${ps.h}</td>
          <td style="padding:8px;color:#ef4444;">${ps.hr}</td>
          <td style="padding:8px;color:#f87171;">${ps.er}</td>
          <td style="padding:8px;color:${parseFloat(era) > 4.5 ? '#ef4444' : '#10b981'};font-weight:bold;">${era}</td>
          <td style="padding:8px;color:${parseFloat(whip) > 1.3 ? '#ef4444' : '#10b981'};font-weight:bold;">${whip}</td>
        `;
        tbodyP.appendChild(tr);
      });
    }

    // Attach click listeners to Pitcher headers
    const pitcherThs = document.querySelectorAll('#summary-thead-pitchers-row th');
    pitcherThs.forEach(th => {
      th.onclick = () => {
        const col = th.dataset.sort;
        if (!col) return;
        if (currentPitcherSortCol === col) {
          currentPitcherSortAsc = !currentPitcherSortAsc;
        } else {
          currentPitcherSortCol = col;
          currentPitcherSortAsc = (col === 'name' || col === 'eraVal' || col === 'whipVal');
        }
        renderPitchersTable();
      };
    });
    renderPitchersTable();

    // Tab switching
    const tabB  = document.getElementById('tab-summary-batters');
    const tabP  = document.getElementById('tab-summary-pitchers');
    const contB = document.getElementById('summary-content-batters');
    const contP = document.getElementById('summary-content-pitchers');

    if (tabB) tabB.onclick = () => {
      contB.classList.remove('hidden'); contP.classList.add('hidden');
      tabB.style.background = 'var(--primary-color)'; tabB.style.color = '#000';
      tabP.style.background = 'rgba(255,255,255,0.1)'; tabP.style.color = '#fff';
    };
    if (tabP) tabP.onclick = () => {
      contP.classList.remove('hidden'); contB.classList.add('hidden');
      tabP.style.background = '#38bdf8'; tabP.style.color = '#000';
      tabB.style.background = 'rgba(255,255,255,0.1)'; tabB.style.color = '#fff';
    };

    const closeBtn = document.getElementById('btn-close-run-summary');
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  }

  // Wire up victory and gameover screen buttons (called after DOM ready)
  function initVictoryScreenButtons() {
    const btnSummary = document.getElementById('btn-show-run-summary');
    if (btnSummary) btnSummary.addEventListener('click', openRunSummaryModal);

    const btnGameOverSummary = document.getElementById('btn-gameover-run-summary');
    if (btnGameOverSummary) btnGameOverSummary.addEventListener('click', openRunSummaryModal);

    const btnPlayAgain = document.getElementById('btn-victory-play-again');
    if (btnPlayAgain) btnPlayAgain.addEventListener('click', () => {
      const canvas = document.getElementById('fireworks-canvas');
      if (canvas && canvas._stopFireworks) canvas._stopFireworks();
      window.Game.resetRun();
      window.showScreen('screen-starter');
    });
  }

  // Self execute
  // ── CARD "PHYSICALITY" (Part 4): reusable tilt/shine/flip for every .player-card,
  // wired once via event delegation + a MutationObserver instead of per-screen code.
  function initCardPhysicality() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Cursor-follow tilt: skip entirely on touch/coarse-pointer devices per the brief
    // (no real hover there anyway); CSS .card-flip-reveal/.card-deal-in still apply.
    const supportsHoverTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (supportsHoverTilt) {
      document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.player-card');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const tiltX = (0.5 - py) * 14; // look-toward-cursor tilt, kept subtle
        const tiltY = (px - 0.5) * 14;
        card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
        card.classList.add('card-tilt-active');
      }, { passive: true });

      document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.player-card');
        if (!card || card.contains(e.relatedTarget)) return;
        card.classList.remove('card-tilt-active');
      }, { passive: true });
    }

    // Flip-in for any .player-card newly added anywhere in the page — covers
    // rewards, training cards, popups, etc. without touching each render site.
    // Cards that already got an explicit deal animation (draft/combat, which
    // include their own flip) are left alone so the two don't stack.
    const flipObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          const cards = node.classList && node.classList.contains('player-card')
            ? [node]
            : (node.querySelectorAll ? [...node.querySelectorAll('.player-card')] : []);
          cards.forEach(card => {
            // Skip if this card (or a wrapper around it, e.g. the draft/combat
            // deal-in wrapper) is already animating its own reveal.
            if (card.closest('.card-deal-in, .card-flip-reveal')) return;
            card.classList.add('card-flip-reveal');
          });
        });
      });
    });
    flipObserver.observe(document.body, { childList: true, subtree: true });
  }

  window.onload = function() {
    init();
    initVictoryScreenButtons();
    initCardPhysicality();
  };
})();