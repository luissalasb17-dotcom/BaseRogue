
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
    if (screenMode) screenMode.classList.remove('hidden');
    if (screenMenu) screenMenu.classList.add('hidden');
    if (gameWorkspace) gameWorkspace.classList.add('hidden');
    if (hud) hud.classList.add('hidden');
    updateMobileNavVisibility();
    return;
  }

  // All in-game screens (draft, map, match, train, rest, event, pre-fight, gameover) live inside #game-workspace wrapper
  if (screenMode) screenMode.classList.add('hidden');
  if (screenMenu) screenMenu.classList.add('hidden');
  if (gameWorkspace) gameWorkspace.classList.remove('hidden');

  // Clean layout during initial 9-round draft (hide sidebars & HUD until draft completes / run starts)
  const isInitialDraft = screenId === 'screen-draft' && window.Game && window.Game.draftRound <= 9;
  
  if (isInitialDraft) {
    if (hud) hud.classList.add('hidden');
    if (leftSidebar) leftSidebar.classList.add('hidden');
    if (rightSidebar) rightSidebar.classList.add('hidden');
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

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.remove('hidden');
    if (screenId === 'screen-map') {
      target.scrollTop = 0;
      const vp = target.querySelector('.map-viewport');
      if (vp) vp.scrollTop = 0;
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
  if (msgEl) msgEl.innerHTML = `<i class="fa-solid fa-dice-d20 fa-spin"></i> Seleccionando ano historico...`;

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
      if (msgEl) msgEl.innerHTML = `<span style="color: #ffd700; font-weight: bold; text-shadow: 0 0 10px rgba(255,215,0,0.8);">⚡ ¡TEMPORADA SELECCIONADA: ${selectedYear}! ⚡</span>`;

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
  function showRetroResultModal({ title, badgeText, badgeColor = '#10b981', icon = '✨', desc = '', stats = [], onClose }) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);z-index:900;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease-out;';

    const statsHTML = (stats || []).map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid ${s.isPositive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};border-radius:8px;margin-bottom:6px;">
        <span style="font-size:12px;color:#cbd5e1;">${s.label}</span>
        <span style="font-family:'Press Start 2P',monospace;font-size:11px;color:${s.isPositive ? '#10b981' : '#ef4444'};">${s.value}</span>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="background:#090d16;border:2px solid ${badgeColor};box-shadow:0 0 35px ${badgeColor}66;border-radius:16px;padding:26px;max-width:440px;width:92%;text-align:center;position:relative;">
        <div style="font-size:48px;margin-bottom:10px;filter:drop-shadow(0 0 12px ${badgeColor});">${icon}</div>
        <div style="display:inline-block;padding:4px 12px;background:${badgeColor}20;border:1px solid ${badgeColor};border-radius:20px;font-family:'Press Start 2P',monospace;font-size:9px;color:${badgeColor};margin-bottom:12px;">${badgeText}</div>
        <h3 style="font-family:'Press Start 2P',monospace;font-size:13px;color:#fff;margin-bottom:10px;line-height:1.4;">${title}</h3>
        <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin-bottom:16px;">${desc}</p>
        ${statsHTML ? `<div style="margin-bottom:20px;">${statsHTML}</div>` : ''}
        <button id="btn-close-retro-result-modal" class="btn" style="background:linear-gradient(135deg, ${badgeColor}, ${badgeColor}dd);color:#000;font-weight:bold;font-size:11px;padding:12px 24px;width:100%;border:none;cursor:pointer;">
          CONTINUAR <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Audio cue
    if (window.AudioManager) {
      if (badgeColor === '#ef4444') {
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
    if (!isClutch && !isCaptain) return '';

    const clutchToolTip = window.t ? window.t('badge.clutch_tooltip', 'Clutch Player: +4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.') : 'Clutch Player: +4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.';
    const captainToolTip = window.t ? window.t('badge.captain_tooltip', 'Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.') : 'Captain: +5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.';

    let icons = '';
    if (isClutch) {
      icons += `<span class="list-badge-icon badge-clutch" title="${clutchToolTip}" style="color:var(--badge-clutch,#ff3300); font-weight:bold; margin-left:3px; cursor:help; font-size:10px; display:inline-block;">⚡</span>`;
    }
    if (isCaptain) {
      icons += `<span class="list-badge-icon badge-captain" title="${captainToolTip}" style="color:var(--badge-captain,#00d4ff); font-weight:bold; margin-left:3px; cursor:help; font-size:10px; display:inline-block;">C★</span>`;
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
          titleEl.innerHTML = `<i class="fa-solid fa-file-signature"></i> FIRMA DE JUGADORES (DRAFT)`;
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
        <div style="max-width: 780px; margin: 0 auto 12px; padding: 10px 16px; background: rgba(0, 255, 102, 0.05); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 8px; font-size: 11px; color: #a7f3d0; line-height: 1.5; text-align: center;">
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

      // Tap-to-open vintage pack — themed per round's rarity floor (rounds 1-3
      // can surface Epic/Legendary -> premium foil; rounds 4-6 are Common-only
      // -> plain wax pack; free rounds 7-9 -> rainbow mystery pack). Tears open
      // on click, then hands off to the existing staggered card deal-in.
      const rarities = info.rarities || [];
      let packTheme = 'random';
      if (rarities.includes('Legendary') || rarities.includes('Epic')) packTheme = 'premium';
      else if (rarities.length && rarities.every(r => r === 'Common')) packTheme = 'common';

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
        wrapper.className = 'draft-card-wrapper w-full max-w-[280px] md:max-w-[170px] cursor-pointer rounded-xl border-2 transition-transform duration-150 flex flex-col items-center gap-1.5 p-2 box-border';
        wrapper.style.borderColor = rColor;
        wrapper.style.background = rBg;

        wrapper.innerHTML = `
          <div style="pointer-events:none;">${cardHTML}</div>
          <div style="text-align:center;width:100%;">
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
      pickHint.style.cssText = 'font-size:11px;color:#6b7280;text-align:center;max-width:400px;';
      if (round <= 3) {
        pickHint.textContent = t('draft.round_elite_hint');
      } else if (round <= 6) {
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

  function init() {
    initGameModeSelector();
    // NOTE: do NOT call renderDraftRound() here — window.Game doesn't exist yet on page load.
    // It is called by initGameModeSelector handlers after the user selects a mode.
    setupEventListeners();

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
    if (p.ovr !== undefined) return Math.round(p.ovr);
    if (p.avg_attr_score !== undefined) return Math.round(p.avg_attr_score);
    if (p._ovr !== undefined) return Math.round(p._ovr);
    const isPitcher = p.pos === 'P' || p.pos === 'SP' || p.pos === 'RP' || p.role === 'P' || p.role === 'SP' || p.role === 'RP';
    if (isPitcher) {
      const stf = p.stf !== undefined ? p.stf : (p.str !== undefined ? p.str : (p.str_val !== undefined ? p.str_val : 50));
      const ctl = p.ctl !== undefined ? p.ctl : (p.ctl_val !== undefined ? p.ctl_val : 50);
      const mov = p.mov !== undefined ? p.mov : (p.grt !== undefined ? p.grt : (p.grt_val !== undefined ? p.grt_val : 50));
      const sta = p.sta !== undefined ? p.sta : (p.sta_val !== undefined ? p.sta_val : 50);
      return Math.round(stf * 0.30 + ctl * 0.30 + mov * 0.30 + sta * 0.10);
    }
    const con = p.con !== undefined ? p.con : (p.contact_val !== undefined ? p.contact_val : 50);
    const pwr = p.pwr !== undefined ? p.pwr : (p.power_val !== undefined ? p.power_val : 50);
    const eye = p.eye !== undefined ? p.eye : (p.eye_val !== undefined ? p.eye_val : 50);
    const spd = p.spd !== undefined ? p.spd : (p.speed_val !== undefined ? p.speed_val : 50);
    const def = p.def !== undefined ? p.def : (p.defense_val !== undefined ? p.defense_val : 50);
    const raw = con * 0.35 + pwr * 0.30 + def * 0.15 + eye * 0.10 + spd * 0.10;
    if (raw <= 30) return Math.round(50 + (raw / 30) * 10);
    if (raw <= 45) return Math.round(60 + ((raw - 30) / 15) * 9);
    if (raw <= 58) return Math.round(70 + ((raw - 45) / 13) * 8);
    if (raw <= 74) return Math.round(79 + ((raw - 58) / 16) * 8);
    if (raw <= 85) return Math.round(88 + ((raw - 74) / 11) * 6);
    return Math.round(95 + Math.min(4, ((raw - 85) / 18) * 4));
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
    const teamFranchise = player.team || "ROOK";
    const isPitcher = player.pos === 'P' || player.pos === 'SP' || player.pos === 'RP' || player.role === 'P' || player.role === 'SP' || player.role === 'RP';

    const stfForOvr = player.stf !== undefined ? player.stf : (player.str !== undefined ? player.str : (player.str_val !== undefined ? player.str_val : (player.con !== undefined ? player.con : 40)));
    const ctlForOvr = player.ctl !== undefined ? player.ctl : (player.ctl_val !== undefined ? player.ctl_val : (player.pwr !== undefined ? player.pwr : 40));
    const movForOvr = player.mov !== undefined ? player.mov : (player.grt !== undefined ? player.grt : (player.grt_val !== undefined ? player.grt_val : (player.eye !== undefined ? player.eye : 40)));
    const staForOvr = player.sta !== undefined ? player.sta : (player.sta_val !== undefined ? player.sta_val : (player.spd !== undefined ? player.spd : 50));

    const ovr = player.ovr !== undefined
      ? Math.round(player.ovr)
      : (player.avg_attr_score !== undefined
          ? Math.round(player.avg_attr_score)
          : (isPitcher
              ? Math.round(stfForOvr*0.30 + ctlForOvr*0.30 + movForOvr*0.30 + staForOvr*0.10)
              : Math.round((player.con || player.contact_val || 40)*0.35 + (player.pwr || player.power_val || 35)*0.30 + (player.spd || player.speed_val || 45)*0.10 + (player.def || player.defense_val || 40)*0.15 + (player.eye || player.eye_val || 40)*0.10)));

    // Rarity styles
    let derivedRarity = player.rarity;
    if (!derivedRarity) {
      if (ovr >= 95) derivedRarity = "Legendary";
      else if (ovr >= 88) derivedRarity = "Epic";
      else if (ovr >= 79) derivedRarity = "Rare";
      else if (ovr >= 70) derivedRarity = "Uncommon";
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
      const spdVal = player.spd !== undefined ? player.spd : (player.speed_val !== undefined ? player.speed_val : 45);
      const defVal = player.def !== undefined ? player.def : (player.defense_val !== undefined ? player.defense_val : 40);

      const gCon = getStatGrade(conVal);
      const gPwr = getStatGrade(pwrVal);
      const gEye = getStatGrade(eyeVal);
      const gSpd = getStatGrade(spdVal);
      const gDef = getStatGrade(defVal);

      statLines = `
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1.5px 0;">
          <span class="stat-label">CON:</span>
          <span class="stat-badge" style="background: ${gCon.color}; color: ${gCon.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gCon.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1.5px 0;">
          <span class="stat-label">POW:</span>
          <span class="stat-badge" style="background: ${gPwr.color}; color: ${gPwr.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gPwr.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1.5px 0;">
          <span class="stat-label">EYE:</span>
          <span class="stat-badge" style="background: ${gEye.color}; color: ${gEye.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gEye.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1.5px 0;">
          <span class="stat-label">SPD:</span>
          <span class="stat-badge" style="background: ${gSpd.color}; color: ${gSpd.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gSpd.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 1.5px 0;">
          <span class="stat-label">DEF:</span>
          <span class="stat-badge" style="background: ${gDef.color}; color: ${gDef.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gDef.text}</span>
        </div>
      `;
    }

    // Check stamina warnings
    const stam = player.stamina || 100;
    let stamClass = "";
    if (stam < 50) stamClass = "low";
    if (stam < 25) stamClass = "critical";

    // Out of position warning
    let positionWarning = "";
    if (slotName && slotName !== 'DH' && slotName !== 'P' && player.pos !== slotName) {
      const secPosArray = player.sec_pos ? player.sec_pos.split(',').map(s => s.trim()) : [];
      if (secPosArray.includes(slotName)) {
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

    return `
      <div class="player-card ${eraClass} rarity-${rarityLabel} ${isClutch ? 'has-clutch' : ''} ${isCaptain ? 'has-captain' : ''}">
        ${ribbonHTML}
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="card-position" style="background: #000; color: #fff; padding: 2px 4px; font-weight: bold; font-size: 6px; border: 1px solid rgba(255,255,255,0.1);">${player.pos}</span>
          <span class="card-ovr" style="font-family: 'Press Start 2P', monospace; font-size: 6px; color: ${ovrGrade.color}; font-weight: bold; background: #000; padding: 2px 4px; border: 1px solid rgba(255,255,255,0.2);">CLASS ${ovrGrade.text}</span>
          <span class="card-year" style="font-size: 6px;">${year}</span>
        </div>
        ${(() => {
          const len = cleanName.length;
          let fontSizeStyle = '';
          if (len >= 20) fontSizeStyle = 'style="font-size: 5.5px !important;"';
          else if (len >= 16) fontSizeStyle = 'style="font-size: 6.5px !important;"';
          else if (len >= 14) fontSizeStyle = 'style="font-size: 7px !important;"';
          return `<div class="card-name" title="${cleanName}" ${fontSizeStyle}>${cleanName}</div>`;
        })()}
        <div class="card-traits-box">
          <span class="card-trait-badge trait-era" title="${player.era}">${getShortEraName(player.era)}</span>
          ${player.team && player.team !== 'ROOK' ? `<span class="card-trait-badge trait-team" title="${window.PlayersDB.FranchiseNames[player.team] || player.team}">${player.team}</span>` : ''}
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
        ratings_eye: '<strong style="color:#3b82f6;">EYE — Ojo/Vista:</strong> Probabilidad de obtener boletos (BB). Reduce la zona de ponches. Clave para no recibir daño directo al HP.',
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
        ratings_eye: '<strong style="color:#3b82f6;">EYE — Eye/Vision:</strong> Chance to draw walks (BB) and reduce strikeout frequency. Crucial to avoid direct HP damage.',
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

      const guideSpd = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.spd"]');
      if (guideSpd && dict.ratings_spd) guideSpd.innerHTML = dict.ratings_spd;

      const guideDef = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.def"]');
      if (guideDef && dict.ratings_def) guideDef.innerHTML = dict.ratings_def;

      const guideClutch = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.clutch"]');
      if (guideClutch && dict.ratings_clutch) guideClutch.innerHTML = dict.ratings_clutch;

      const guideCaptain = document.querySelector('#ratings-info-dropdown [data-i18n-html="ratings_guide.captain"]');
      if (guideCaptain && dict.ratings_captain) guideCaptain.innerHTML = dict.ratings_captain;
    }

    // Toggle Language (ES / EN)
    const btnLang = document.getElementById('btn-lang-toggle');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        const cur = window.i18n ? window.i18n.getCurrentLanguage() : (localStorage.getItem('baserogue_lang') || 'en');
        const next = cur === 'es' ? 'en' : 'es';
        if (window.i18n) {
          window.i18n.changeLanguage(next);
        }
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
      const nodeEl = e.target.closest('.map-node-visual.active-path, .map-node.active-path');
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
      setupAndStartMatchSimulation();
    });

    el.btnPreFightBackMap.addEventListener('click', () => {
      window.showScreen('screen-map');
    });
  }

  // Open Node Screen logic
  function openNode(node) {
    if (node.type === 'match' || node.type === 'boss') {
      setupAndShowPreFightScreen();
    } else if (node.type === 'draft') {
      setupDraftPickScreen();
    } else if (node.type === 'event') {
      setupManagerEventScreen();
    } else if (node.type === 'train') {
      setupTrainingScreen();
    } else if (node.type === 'rest') {
      window.showScreen('screen-rest');
    }
  }

  // Return to Map view once action completes
  function closeNodeCompleted() {
    // Advance current stage
    window.Game.currentStageIndex++;

    // Check if run won (exceeded stage 15)
    if (window.Game.currentStageIndex > 15) {
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
    el.hudStage.innerText = `${t('hud.stage')} ${window.Game.currentStageIndex + 1}/16 — ${zoneNames[zone] || ''}`;
    el.hudBudget.innerText = `$${window.Game.budget}`;
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
        document.querySelectorAll('.roster-vertical-item').forEach(el => el.classList.remove('drag-over'));
      });

      slotContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        slotContainer.classList.add('drag-over');
      });

      slotContainer.addEventListener('dragleave', (e) => {
        slotContainer.classList.remove('drag-over');
      });

      slotContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        slotContainer.classList.remove('drag-over');
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
        nameSpan.innerHTML = `${effectivePlayer.name}${getPlayerBadgeIconsHTML(effectivePlayer)}`;
        nameSpan.title = `${effectivePlayer.name} (${effectivePlayer.era})`;
        
        // OVR Badge
        const ovr = getPlayerOvr(effectivePlayer);
        const ovrGrade = getClassGrade(ovr);
        const ovrBadge = document.createElement('span');
        ovrBadge.className = "ovr-badge";
        ovrBadge.style.cssText = `background: ${ovrGrade.color}; color: #000; margin-left: auto; flex-shrink: 0;`;
        ovrBadge.innerText = ovrGrade.text;

        // Stamina mini bar
        const stamContainer = document.createElement('div');
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
        nameSpan.innerText = "Vacante";
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
      const baseVal = player[statKey] || 0;
      const effVal = effectivePlayer[statKey] || 0;
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

    overlay.querySelector('#popup-card-content').innerHTML = `
      <div class="popup-card-header">
        <div class="popup-rarity-badge" style="color:${rarityColor};border-color:${rarityColor};">${player.rarity || 'Common'}</div>
        <button id="btn-close-popup" class="popup-close-btn">✕</button>
      </div>
      <div class="popup-player-name">${player.name}</div>
      <div class="popup-meta-row">
        <span class="popup-pos-badge">${slot}</span>
        <span class="popup-era-chip">${(player.era||'').replace(/\(.*\)/,'').trim()}</span>
        <span class="popup-team-chip">${player.team !== 'ROOK' ? player.team : '—'}</span>
      </div>
      <div class="popup-ovr-banner" style="background:${ovrGrade.color}20;border-color:${ovrGrade.color};">
        <span class="popup-ovr-label">OVR</span>
        <span class="popup-ovr-val" style="color:${ovrGrade.color};">${ovr}</span>
        <span class="popup-ovr-grade" style="color:${ovrGrade.color};">${ovrGrade.text}</span>
      </div>
      <div class="popup-stats-section">
        ${(player.pos === 'P' || player.pos === 'SP' || player.pos === 'RP' || player.role === 'SP' || player.role === 'RP') ? `
          ${statBar('H/9',  player.h9  !== undefined ? 'h9'  : 'grt', '#00ff66')}
          ${statBar('K/9',  player.k9  !== undefined ? 'k9'  : (player.stf !== undefined ? 'stf' : 'str'), '#38bdf8')}
          ${statBar('BB/9', player.bb9 !== undefined ? 'bb9' : 'ctl', '#fbbf24')}
          ${statBar('HR/9', player.hr9 !== undefined ? 'hr9' : 'mov', '#f97316')}
          ${statBar('STA',  'sta', '#a78bfa')}
        ` : `
          ${statBar('CON', 'con', '#00ff66')}
          ${statBar('PWR', 'pwr', '#f97316')}
          ${statBar('SPD', 'spd', '#38bdf8')}
          ${statBar('DEF', 'def', '#a78bfa')}
          ${statBar('EYE', 'eye', '#fbbf24')}
        `}
      </div>
      <div class="popup-stamina-row">
        <span style="font-size:10px;color:#9ca3af;font-family:'Press Start 2P',monospace;">STAMINA</span>
        <div class="popup-stamina-track">
          <div class="popup-stamina-fill" style="width:${stam}%;background:${stamColor};"></div>
        </div>
        <span style="color:${stamColor};font-size:10px;font-family:'Press Start 2P',monospace;">${stam}%</span>
      </div>
      ${player.upgrades && Object.values(player.upgrades).some(v => v > 0) ? `
        <div class="popup-upgrades-row">
          <span style="font-size:8px;color:var(--primary-color);font-family:'Press Start 2P',monospace;">⬆ UPGRADES:</span>
          ${Object.entries(player.upgrades).filter(([k,v])=>v>0).map(([k,v])=>`<span class="popup-upgrade-badge">+${v} ${k.toUpperCase()}</span>`).join('')}
        </div>` : ''}
      <div class="popup-era-desc">${window.PlayersDB.EraTraits && window.PlayersDB.EraTraits[player.era] ? `<i>${window.PlayersDB.EraTraits[player.era].name}:</i> ${window.PlayersDB.EraTraits[player.era].desc}` : ''}</div>
      ${(player.clutch || player.is_clutch) ? `
        <div class="popup-badge-desc popup-badge-clutch" style="margin-top:6px; padding:6px 8px; background:rgba(255,51,0,0.12); border-left:3px solid var(--badge-clutch,#ff3300); border-radius:4px; font-size:8px; line-height:1.4;">
          <span style="color:var(--badge-clutch,#ff3300); font-weight:bold; font-family:'Press Start 2P',monospace; display:block; margin-bottom:2px;">⚡ CLUTCH PLAYER</span>
          <span style="color:#e2e8f0;">${window.t ? window.t('badge.clutch_tooltip', '+4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.') : '+4% de probabilidad de hit y +4% de HR con corredores en posición de anotar durante la última entrada.'}</span>
        </div>` : ''}
      ${(player.captain || player.is_captain) ? `
        <div class="popup-badge-desc popup-badge-captain" style="margin-top:6px; padding:6px 8px; background:rgba(0,212,255,0.12); border-left:3px solid var(--badge-captain,#00d4ff); border-radius:4px; font-size:8px; line-height:1.4;">
          <span style="color:var(--badge-captain,#00d4ff); font-weight:bold; font-family:'Press Start 2P',monospace; display:block; margin-bottom:2px;">C★ CAPTAIN</span>
          <span style="color:#e2e8f0;">${window.t ? window.t('badge.captain_tooltip', '+5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.') : '+5 a todos los ratings de sus compañeros de equipo mientras esté en el roster activo.'}</span>
        </div>` : ''}
      <div class="popup-year">Peak: ${player.year || player.peak_year || player.peakYear || '—'} &nbsp;|&nbsp; ${player.era || ''}</div>
      ${!isDraft ? `
        <div class="popup-def-swap-container" style="margin-top:12px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.15); display:flex; flex-direction:column; gap:6px;">
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

  function hidePlayerCardPopup() {
    const overlay = document.getElementById('player-card-popup-overlay');
    if (overlay) {
      overlay.classList.remove('popup-visible');
      overlay.classList.add('hidden');
    }
  }

  // ── NODE VISUAL CONFIG ───────────────────────────────────────────────────
  const NODE_VISUALS = {
    match:  { iconClass: 'fa-solid fa-baseball-bat-ball', text: 'VS',   label: 'SERIE',    color: '#00ff66', bg: '#021a0e', border: '#00ff66' },
    boss:   { iconClass: 'fa-solid fa-crown',             text: 'BOSS', label: 'JEFE',     color: '#ffd700', bg: '#1a0e00', border: '#ffd700' },
    draft:  { iconClass: 'fa-solid fa-file-signature',    text: 'SIGN', label: 'FIRMA',    color: '#38bdf8', bg: '#021526', border: '#38bdf8' },
    event:  { iconClass: 'fa-solid fa-clipboard-question',text: 'EVT',  label: 'EVENTO',   color: '#fb923c', bg: '#1a0e00', border: '#fb923c' },
    train:  { iconClass: 'fa-solid fa-dumbbell',          text: 'GYM',  label: 'ENTRENO',  color: '#22d3ee', bg: '#011a1a', border: '#22d3ee' },
    rest:   { iconClass: 'fa-solid fa-couch',             text: 'REST', label: 'DESCANSO', color: '#c084fc', bg: '#12001a', border: '#c084fc' },
  };

  // RENDER VISUAL POKELIKE MAP - Math-based layout (no DOM measurement)
  // RENDER VISUAL POKELIKE MAP - Math-based layout (Ascending bottom-to-top progression)
  function renderMap() {
    el.mapContainer.innerHTML = '';

    const currentStage = window.Game.currentStageIndex;
    const currentZone  = window.Game.getZoneForStage(currentStage);
    
    // Render zones in ascending order from bottom to top (Playoffs at top, Opening Day at bottom)
    const ZONE_STAGE_RANGES = [
      { range: [12, 15], zoneIdx: 3 },
      { range: [8, 11],  zoneIdx: 2 },
      { range: [4, 7],   zoneIdx: 1 },
      { range: [0, 3],   zoneIdx: 0 }
    ];

    // Layout constants (SVG coordinate space)
    const NODE_R    = 26;   // node radius
    const SVG_W     = 500;  // SVG viewport width
    const ROW_H     = 100;  // pixels between stage rows
    const PADDING_Y = 60;   // top/bottom padding inside SVG

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

      const zoneHeader = document.createElement('div');
      zoneHeader.className = 'zone-header';
      zoneHeader.innerHTML = `
        <div class="zone-header-left">
          <span class="zone-icon">${zoneConfig.bossIcon}</span>
          <div>
            <div class="zone-name">${zoneConfig.name}</div>
            <div class="zone-subtitle">${subText}</div>
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
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
      svg.setAttribute('width',  '100%');
      svg.setAttribute('height', SVG_H);
      svg.style.display = 'block';
      svg.style.overflow = 'visible';

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

            // Glow behind active/visited
            if (isVisitedPath || isActivePath) {
              const gp = document.createElementNS(svgNS, 'line');
              gp.setAttribute('x1', p1.x); gp.setAttribute('y1', p1.y);
              gp.setAttribute('x2', p2.x); gp.setAttribute('y2', p2.y);
              gp.setAttribute('stroke', targetVis.color);
              gp.setAttribute('stroke-width', isActivePath ? '8' : '5');
              gp.setAttribute('opacity', isActivePath ? '0.45' : '0.25');
              gp.setAttribute('filter', `url(#${isActivePath ? 'glow-active' : 'glow-visited'}-z${zoneIdx})`);
              svg.appendChild(gp);
            }

            // Main dashed line
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
              line.setAttribute('stroke', targetVis.color);
              line.setAttribute('stroke-width', '3');
              line.setAttribute('stroke-dasharray', '8,4');
              line.setAttribute('opacity', '0.5');
            } else {
              // Future path tinted with destination node's color
              line.setAttribute('stroke', targetVis.color);
              line.setAttribute('stroke-width', '2.5');
              line.setAttribute('stroke-dasharray', '6,6');
              line.setAttribute('opacity', '0.35');
            }
            svg.appendChild(line);
          });
        });
      }

      // ── DRAW NODES (on top of paths) ────────────────────────────────
      for (let s = zStart; s <= zEnd; s++) {
        const stageNodes = window.Game.map[s] || [];
        const isBossStage = (s === 3 || s === 7 || s === 11 || s === 15);

        stageNodes.forEach((node, idx) => {
          const pos = nodePos[s]?.[idx];
          if (!pos) return;
          const vis = NODE_VISUALS[node.type] || NODE_VISUALS.match;

          const isVisited       = node.visited;
          const isPast          = (s < currentStage);
          const isActive        = (s === currentStage) && activeNextNodeIdxs.includes(idx);
          const isFutureVisible = (s > currentStage) && !isVisited;
          const isDisabled      = !isActive && !isPast && !isVisited && !isFutureVisible;

          // Outer glow ring for active nodes ONLY
          if (isActive) {
            const glow = document.createElementNS(svgNS, 'circle');
            glow.setAttribute('cx', pos.x); glow.setAttribute('cy', pos.y);
            glow.setAttribute('r', isBossStage ? NODE_R + 14 : NODE_R + 10);
            glow.setAttribute('fill', 'none');
            glow.setAttribute('stroke', vis.color);
            glow.setAttribute('stroke-width', '3');
            glow.setAttribute('stroke-dasharray', '6,3');
            glow.setAttribute('opacity', '0.9');
            glow.setAttribute('filter', `url(#glow-active-z${zoneIdx})`);
            svg.appendChild(glow);
          }

          // 8-Bit Pixel Outer Border Circle
          const outerCircle = document.createElementNS(svgNS, 'circle');
          outerCircle.setAttribute('cx', pos.x); outerCircle.setAttribute('cy', pos.y);
          outerCircle.setAttribute('r', isBossStage ? NODE_R + 8 : NODE_R + 3);
          outerCircle.setAttribute('fill', '#000000');
          svg.appendChild(outerCircle);

          // Node circle
          const circle = document.createElementNS(svgNS, 'circle');
          circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y);
          circle.setAttribute('r', isBossStage ? NODE_R + 5 : NODE_R);

          if (isActive) {
            circle.setAttribute('fill', vis.bg);
            circle.setAttribute('stroke', vis.color);
            circle.setAttribute('stroke-width', isBossStage ? '4' : '3');
          } else if (isFutureVisible) {
            // Future visible node: attenuated color (borde/fondo con opacidad reducida, sin glow)
            circle.setAttribute('fill', vis.bg);
            circle.setAttribute('stroke', vis.color);
            circle.setAttribute('stroke-width', isBossStage ? '3.5' : '2.5');
            circle.setAttribute('opacity', '0.75');
          } else if (isPast || isVisited) {
            // Visited/past node: desaturated dark slate
            circle.setAttribute('fill', '#1e293b');
            circle.setAttribute('stroke', '#475569');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('opacity', '0.5');
          } else {
            // Disabled/blocked node
            circle.setAttribute('fill', '#0f172a');
            circle.setAttribute('stroke', '#334155');
            circle.setAttribute('stroke-width', '1.5');
            circle.setAttribute('opacity', '0.3');
          }
          svg.appendChild(circle);

          // Node Font Awesome Icon via foreignObject
          const iconSize = isBossStage ? 26 : 14;
          const foSize   = isBossStage ? 48 : 32;
          const iconColor = isActive 
            ? vis.color 
            : (isFutureVisible ? vis.color : (isPast || isVisited ? '#64748b' : '#334155'));
          const iconOpacity = isActive ? '1.0' : (isFutureVisible ? '0.8' : '0.5');

          const fo = document.createElementNS(svgNS, 'foreignObject');
          fo.setAttribute('x', pos.x - foSize / 2);
          fo.setAttribute('y', pos.y - foSize / 2);
          fo.setAttribute('width', foSize);
          fo.setAttribute('height', foSize);
          fo.style.pointerEvents = 'none';

          fo.innerHTML = `
            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${iconColor};opacity:${iconOpacity};font-size:${iconSize}px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.8));">
              <i class="${vis.iconClass}"></i>
            </div>
          `;
          svg.appendChild(fo);

          // Node type label below
          const lbl = document.createElementNS(svgNS, 'text');
          lbl.setAttribute('x', pos.x); 
          lbl.setAttribute('y', pos.y + (isBossStage ? NODE_R + 20 : NODE_R + 15));
          lbl.setAttribute('text-anchor', 'middle');
          lbl.setAttribute('fill', isActive 
            ? vis.color 
            : (isFutureVisible ? 'rgba(255,255,255,0.75)' : (isPast || isVisited ? '#475569' : '#334155')));
          lbl.setAttribute('font-family', "'VT323', monospace");
          lbl.setAttribute('font-size', '14');
          lbl.setAttribute('font-weight', 'bold');
          const rawLabel = node.label || vis.label;
          let translatedLabel = rawLabel;
          if (rawLabel === 'SERIE CLÁSICA') translatedLabel = t('map.node_classic');
          else if (rawLabel === 'FIRMA LEYENDA') translatedLabel = t('draft.midrun_title_short', 'FIRMA LEYENDA');
          else if (rawLabel === 'DECISIÓN') translatedLabel = t('map.node_decision');
          else if (rawLabel === 'JAULA BATEO') translatedLabel = t('map.node_cage');
          else if (rawLabel === 'CASA CLUB') translatedLabel = t('map.node_clubhouse');
          else if (rawLabel === 'JUEGO APERTURA') translatedLabel = t('map.node_opener');
          else if (rawLabel === 'ALL-STAR GAME') translatedLabel = 'ALL-STAR GAME';
          else if (rawLabel === 'CAMPEÓN LIGA') translatedLabel = t('map.node_pennant', 'CAMPEÓN LIGA');
          else if (rawLabel === 'SERIE MUNDIAL') translatedLabel = t('map.node_world_series', 'SERIE MUNDIAL');
          lbl.textContent = translatedLabel;
          svg.appendChild(lbl);

          // Invisible click target for active nodes
          if (isActive) {
            const hit = document.createElementNS(svgNS, 'circle');
            hit.setAttribute('cx', pos.x); hit.setAttribute('cy', pos.y);
            hit.setAttribute('r', isBossStage ? NODE_R + 16 : NODE_R + 12);
            hit.setAttribute('fill', 'transparent');
            hit.style.cursor = 'pointer';
            hit.setAttribute('id', `node_${s}_${idx}`);
            hit.setAttribute('data-stage', s);
            hit.setAttribute('data-index', idx);
            hit.classList.add('map-node-visual', 'active-path');
            svg.appendChild(hit);
          }
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

    // Reset map viewport scroll to top so headers and title are fully visible from start
    setTimeout(() => {
      const mapViewport = document.querySelector('.map-viewport');
      if (mapViewport) mapViewport.scrollTop = 0;
      const screenMap = document.getElementById('screen-map');
      if (screenMap) screenMap.scrollTop = 0;
    }, 10);

    showTutorialTip(
      'map-basics', document.getElementById('map-nodes-container'),
      'tutorial.map_basics_title', 'tutorial.map_basics_text', 'bottom'
    );
  }

  // Legacy stub – no longer needed (paths drawn inline with renderMap)
  function drawZonePaths(currentZone) { /* no-op */ }

  // RENDER SIDEBAR SYNERGIES & ITEMS
  function renderSynergiesAndItems() {
    // 1. Synergies (Right Sidebar)
    el.synergiesList.innerHTML = "";
    
    const EraSynergyMeta = {
      "The Genesis Era (1871-1900)": {
        name: "Genesis Chaos",
        get tiers() { return [t('eras.genesis_d1'), t('eras.genesis_d2'), t('eras.genesis_d3'), t('eras.genesis_d4')]; }
      },
      "Deadball (1901-1919)": {
        name: "Small Ball",
        get tiers() { return [t('eras.deadball_d1'), t('eras.deadball_d2'), t('eras.deadball_d3'), t('eras.deadball_d4')]; }
      },
      "Golden Era (1920-1941)": {
        name: "Liveball Sluggers",
        get tiers() { return [t('eras.golden_d1'), t('eras.golden_d2'), t('eras.golden_d3'), t('eras.golden_d4')]; }
      },
      "Integration (1942-1960)": {
        name: "Five-Tool Legends",
        get tiers() { return [t('eras.integration_d1'), t('eras.integration_d2'), t('eras.integration_d3'), t('eras.integration_d4')]; }
      },
      "Expansion (1961-1976)": {
        name: "Speed & Hustle",
        get tiers() { return [t('eras.speed_d1'), t('eras.speed_d2'), t('eras.speed_d3'), t('eras.speed_d4')]; }
      },
      "Big Hair Era (1977-1993)": {
        name: "AstroTurf Speedsters",
        get tiers() { return [t('eras.astroturf_d1'), t('eras.astroturf_d2'), t('eras.astroturf_d3'), t('eras.astroturf_d4')]; }
      },
      "Steroid Era (1994-2005)": {
        name: "Bash Brothers",
        get tiers() { return [t('eras.steroid_d1'), t('eras.steroid_d2'), t('eras.steroid_d3'), t('eras.steroid_d4')]; }
      },
      "Efficiency Era (2006-2015)": {
        name: "Moneyball Analytics",
        get tiers() { return [t('eras.moneyball_d1'), t('eras.moneyball_d2'), t('eras.moneyball_d3'), t('eras.moneyball_d4')]; }
      },
      "Modern Era (2016-Pres)": {
        name: "Three True Outcomes",
        get tiers() { return [t('eras.tto_d1'), t('eras.tto_d2'), t('eras.tto_d3'), t('eras.tto_d4')]; }
      }
    };

    const eraCounts = {};
    const teamCounts = {};
    
    // Count active roster players
    Object.values(window.Game.roster).forEach(player => {
      if (player && !player.isReplacement) {
        if (player.era) {
          // Keep in sync with simulation.js's _calculateActiveSynergies — Story
          // Mode inter-era wildcards count double toward their own era's synergy.
          eraCounts[player.era] = (eraCounts[player.era] || 0) + (player.isInterEra ? 2 : 1);
        }
        if (player.team && player.team !== 'ROOK') {
          teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
        }
      }
    });

    // A. Render Era Synergies (Render ALL 9 to guide the user)
    const eraListTitle = document.createElement('div');
    eraListTitle.style.cssText = "font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--accent-color); margin-top: 5px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;";
    eraListTitle.innerText = t('eras.header');
    el.synergiesList.appendChild(eraListTitle);

    Object.keys(EraSynergyMeta).forEach(eraName => {
      const meta = EraSynergyMeta[eraName];
      const count = eraCounts[eraName] || 0;
      const tier = window.Game.getEraTier(eraName, count);
      const isBuildEra = window.Game.buildEra === eraName;
      const isLockedNonBuild = !isBuildEra && count >= 2; // has 2+ but capped at T1

      let itemClass = "synergy-list-item";
      if (isBuildEra && tier >= 1) {
        itemClass += " is-build-era";
      } else if (tier >= 1) {
        itemClass += " active";
      }
      if (isLockedNonBuild) itemClass += " locked-era";

      const item = document.createElement('div');
      item.className = itemClass;

      let dotsHTML = "";
      for (let i = 1; i <= 4; i++) {
        const filled = i <= tier ? 'filled' : '';
        dotsHTML += `<span class="synergy-dot ${filled}"></span>`;
      }

      const buildBadgeHTML = isBuildEra
        ? `<span class="build-era-tag-badge"><i class="fa-solid fa-star"></i> ${t('eras.build_badge')}</span>`
        : '';

      // Build Era: show all 4 tiers, current one highlighted, reached ones dimmed-but-legible, future ones muted.
      // Non-build eras: just the single fixed T1 line (shown even at count 0, as a preview/hint), like before.
      let descHTML;
      if (isBuildEra) {
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
        if (isLockedNonBuild) {
          descHTML += `<div class="synergy-locked-note"><i class="fa-solid fa-lock"></i> ${t('eras.locked_note')}</div>`;
        }
      }

      const btnLabel = isBuildEra ? t('eras.remove_build_btn') : t('eras.set_build_btn');
      const btnClass = isBuildEra ? 'synergy-build-btn is-current' : 'synergy-build-btn';

      item.innerHTML = `
        <div class="synergy-item-header">
          <span class="synergy-item-name">${meta.name}${buildBadgeHTML}</span>
          <span class="synergy-item-count">T${tier}/T4</span>
        </div>
        <div class="synergy-progress-dots">
          ${dotsHTML}
        </div>
        ${descHTML}
        <button type="button" class="${btnClass}" data-era="${eraName}">${btnLabel}</button>
      `;
      const btn = item.querySelector('.synergy-build-btn');
      btn.addEventListener('click', () => {
        window.Game.setBuildEra(isBuildEra ? null : eraName);
        renderSynergiesAndItems();
      });
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
        ? t('sidebar.dynasty_desc', { team: team })
        : t('sidebar.chemistry_desc', { team: team });

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

    // 2. Purchased Items (Left Sidebar)
    el.purchasedItemsList.innerHTML = "";
    if (window.Game.purchasedItems.length === 0) {
      el.purchasedItemsList.innerHTML = `
        <div style="color: #64748b; font-size: 8px; text-align:center; padding: 10px 0; width: 100%; font-family: 'Press Start 2P', monospace;">
          NADA COMPRADO
        </div>
      `;
    } else {
      window.Game.purchasedItems.forEach(item => {
        const badge = document.createElement('span');
        badge.style.background = "rgba(16, 185, 129, 0.1)";
        badge.style.border = "1px solid rgba(16, 185, 129, 0.3)";
        badge.style.color = "var(--primary-color)";
        badge.style.padding = "2px 4px";
        badge.style.margin = "2px";
        badge.style.fontSize = "7px";
        badge.style.fontFamily = "'Press Start 2P', monospace";
        badge.style.fontWeight = "bold";
        badge.innerText = item;
        
        el.purchasedItemsList.appendChild(badge);
      });
    }
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

    // Era synergy impact — uses Game.getEraTier so this matches the actual 4-tier /
    // Build Era rules (only the active Build Era scales past T1; any other era with
    // 2+ players stays fixed at T1 no matter how many more you sign).
    const eraShort = getShortEraName(player.era);
    const isBuildEra = player.era && player.era === window.Game.buildEra;
    const currentTier = window.Game.getEraTier(player.era, currentEraCount);
    const newTier = window.Game.getEraTier(player.era, newEraCount);

    if (newTier > currentTier) {
      predictionText += `Firma activa Sinergia <strong>${eraShort} (T${newTier})</strong>!<br>`;
    } else if (newEraCount < 2) {
      predictionText += `Era ${eraShort}: ${currentEraCount} ➡️ <strong>${newEraCount}/2</strong><br>`;
    } else if (!isBuildEra) {
      predictionText += `Era ${eraShort}: ${newEraCount} jugadores (T1 fijo — no es tu Era de Build)<br>`;
    } else {
      predictionText += `Era ${eraShort}: ${newEraCount} jugadores (T${newTier})<br>`;
    }

    // Team synergy impact
    if (player.team && player.team !== 'ROOK') {
      const teamShort = player.team;
      if (currentTeamCount === 1) {
        predictionText += (typeof window.t==='function'?window.t('sign.chemistry_active', { team: teamShort }):`Firma activa Química de <strong>${teamShort}</strong> (+4 stats)`);
      } else if (currentTeamCount === 3) {
        predictionText += (typeof window.t==='function'?window.t('sign.dynasty_active', { team: teamShort }):`Firma activa Dinastía de <strong>${teamShort}</strong> (+10 stats)`);
      } else {
        predictionText += `Franquicia ${teamShort}: ${currentTeamCount} ➡️ <strong>${currentTeamCount + 1}/2</strong>`;
      }
    }

    return predictionText;
  }

  function getPlayerSignCost(player) {
    const r = player ? (player.rarity || 'Common') : 'Common';
    if (r === 'Legendary') return 20;
    if (r === 'Epic') return 15;
    if (r === 'Rare') return 10;
    if (r === 'Uncommon') return 5;
    return 3;
  }

  // DRAFT SCREEN GENERATOR
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
      titleEl.innerHTML = `<i class="fa-solid fa-file-signature"></i> ` + t('draft.title');
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
      cardCol.className = "draft-card-option flex flex-col items-center gap-2 w-full max-w-[280px] md:max-w-[210px] box-border";
      
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
        btnSign.innerHTML = `<i class="fa-solid fa-lock"></i> Sin $ ($${cost})`;
      }

      btnSign.addEventListener('click', () => {
        if (!canAfford) {
          alert(`No tienes suficiente presupuesto para firmar a esta leyenda (Cuesta $${cost}, tienes $${window.Game.budget}).`);
          return;
        }

        player._signCost = cost;
        const res = window.Game.addPlayerToRoster(player);
        if (res.success) {
          window.Game.budget = Math.max(0, (window.Game.budget || 0) - cost);
          delete player._signCost;
          alert(res.message + ` (-$${cost} de Presupuesto)`);
          renderActiveRoster();
          renderSynergiesAndItems();
          updateHUD();
          closeNodeCompleted();
        } else {
          // Roster full: trigger Swap Modal
          currentDraftSelection = player;
          el.swapNewPlayerName.innerText = player.name;
          populateSwapModalOptions(player);
        }
      });

      const rColor = RARITY_COLORS[player.rarity] || RARITY_COLORS.Common;
      const ovr    = getPlayerOvr(player);

      cardCol.innerHTML = `
        <div>${cardHTML}</div>
        <div style="text-align:center;width:100%;margin-top:2px;">
          <div style="font-size:10px;color:${rColor};font-weight:bold;">${player.rarity}</div>
          <div style="font-size:9.5px;color:#9ca3af;text-align:center;margin-top:2px;font-family:'Press Start 2P',monospace;">${player.pos} • OVR ${ovr}</div>
        </div>
        <div style="font-size:10px; color:#f59e0b; font-weight:bold; margin-top:4px; text-align:center; font-family:'Press Start 2P',monospace;">Coste: $${cost}</div>
        <div class="draft-synergy-helper">${predictionText}</div>
      `;
      cardCol.appendChild(btnSign);
      el.draftOptionsRow.appendChild(cardCol);
    });

    // Add a "Rechazar Firma" button option
    const skipCol = document.createElement('div');
    skipCol.className = "draft-card-option flex flex-col justify-center items-center border-2 border-dashed border-white/15 p-4 rounded-xl w-full max-w-[280px] md:max-w-[210px] min-h-[140px] md:min-h-[350px] box-border";

    const btnSkip = document.createElement('button');
    btnSkip.className = "btn btn-secondary";
    btnSkip.style.width = "100%";
    btnSkip.innerHTML = t('draft.decline_btn');
    btnSkip.addEventListener('click', () => {
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
      cardCol.className = "draft-card-option flex flex-col items-center gap-2 w-full max-w-[280px] md:max-w-[210px] box-border";
      
      const btnSign = document.createElement('button');
      btnSign.className = "btn";
      btnSign.innerHTML = t('draft.sign_btn', { cost: 0 });
      btnSign.addEventListener('click', () => {
        currentDraftSelection = player;
        el.swapNewPlayerName.innerText = player.name;
        populateSwapModalOptions(player);
      });

      const rColor = RARITY_COLORS[player.rarity] || RARITY_COLORS.Common;
      const ovr    = getPlayerOvr(player);

      cardCol.innerHTML = `
        <div>${cardHTML}</div>
        <div style="text-align:center;width:100%;margin-top:2px;">
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
    skipCol.className = "draft-card-option flex flex-col justify-center items-center border-2 border-dashed border-white/15 p-4 rounded-xl w-full max-w-[280px] md:max-w-[210px] min-h-[140px] md:min-h-[350px] box-border";

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
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin-bottom:20px;">
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
        const item = document.createElement('div');
        item.className = "swap-bench-item";
        item.innerHTML = `
          <div><strong>[${slot}]</strong> ${player.name} (${player.pos} | ${player.rarity})</div>
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size:11px; background:#ef4444;" data-replace-slot="${slot}">Reemplazar</button>
        `;
        el.modalSwapList.appendChild(item);
      }
    });

    el.modalSwap.classList.remove('hidden');
  }

  // MANAGER DECISION EVENT SCREEN SETUP
  function setupManagerEventScreen() {
    const event = window.Game.getRandomEvent();
    el.eventTitle.innerHTML = `<span style="font-size:28px;margin-right:10px;">${event.icon || '📜'}</span>${event.title}`;
    el.eventDesc.innerText = event.desc;
    
    el.eventChoicesContainer.innerHTML = "";
    event.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = `event-choice-btn event-choice-risk-${choice.risk || 'safe'}`;
      
      const costText = choice.cost > 0 ? `-$${choice.cost}` : (choice.cost < 0 ? `+$${Math.abs(choice.cost)}` : "GRATIS");
      const riskBadge = choice.risk === 'high' ? '🔴 ALTO RIESGO' : (choice.risk === 'moderate' ? '🟡 RIESGO MODERADO' : '🟢 SEGURO');
      const chanceText = choice.successChance && choice.successChance < 1.0 ? ` (${Math.round(choice.successChance * 100)}% ÉXITO)` : '';

      btn.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:26px;">${choice.icon || '👉'}</span>
            <div>
              <div style="font-weight:bold;font-size:14px;color:#fff;">${choice.text}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                <span class="choice-risk-tag choice-risk-${choice.risk || 'safe'}">${riskBadge}</span>${chanceText}
              </div>
            </div>
          </div>
          <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:${choice.cost < 0 ? '#10b981' : '#f59e0b'};">
            ${costText}
          </div>
        </div>
      `;
      
      // Check budget
      if (choice.cost > 0 && window.Game.budget < choice.cost) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
      
      btn.addEventListener('click', () => {
        // Apply budget cost
        window.Game.budget -= choice.cost;
        
        const roll = Math.random();
        const chance = choice.successChance !== undefined ? choice.successChance : 1.0;
        const isSuccess = roll <= chance;

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
      });
      
      el.eventChoicesContainer.appendChild(btn);
    });
    
    window.showScreen('screen-event');
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

    renderActiveRoster();
    renderSynergiesAndItems();
    updateHUD();

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
      if (window.PlayersDB && window.PlayersDB.FranchiseNames) {
        teamFull = window.PlayersDB.FranchiseNames[enemy.teamID] || teamFull;
      }
      teamName = `${teamFull} (${enemy.year})`;

      const wp = enemy.win_pct || 0;
      const recordKey = wp >= 0.560 ? 'record_dominant' : (wp >= 0.480 ? 'record_contender' : 'record_underdog');
      const pctText = (wp * 100).toFixed(1) + '%';
      recordHTML = `<div style="font-size:11px;color:#9ca3af;margin-top:4px;">${t('pre_fight.' + recordKey)} — <strong style="color:#e4e4e7;">${pctText}</strong> ${t('map.win_pct', 'win %')}</div>`;
      ovrDisplay = enemy.ovr !== undefined && enemy.ovr !== null ? Math.round(enemy.ovr) : null;
    } else {
      // Quick Play rosters are 2-3 pitchers assembled independently from the
      // whole pool (see createPitcherObj/pickPitcher in game.js) — they're not
      // a real team. Naming the report after just the 1st pitcher and quoting
      // only their era was misleading when the others came from elsewhere.
      teamName = t('pre_fight.rival_rotation_label');
      const pitcherEras = [...new Set((enemy.pitchers || []).map(p => p.era).filter(Boolean))];
      eraName = pitcherEras.length === 1 ? pitcherEras[0] : (pitcherEras.length > 1 ? t('pre_fight.mixed_eras') : '');
      const ovrs = (enemy.pitchers || []).map(p => p.ovr).filter(v => typeof v === 'number');
      ovrDisplay = ovrs.length ? Math.round(ovrs.reduce((a, b) => a + b, 0) / ovrs.length) : (enemy._ovr || null);
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

    // 2. Render enemy pitchers
    el.preFightEnemyRotation.innerHTML = "";
    enemy.pitchers.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = "pre-fight-row";

      // Label type
      let pType = "SP";
      if (idx === 3) pType = "RP";
      if (idx === 4) pType = "CL";

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 10px; font-weight: bold; color: #ef4444; background: rgba(239,68,68,0.1); padding: 2px 4px; border-radius: 4px;">${pType}</span>
          <span class="name" title="${p.name}">${p.name}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="hp-bar-container">
            <div class="hp-bar-fill" style="width: 100%; background: linear-gradient(90deg, #ef4444, #f87171);"></div>
          </div>
          <span class="hp-text">${p.maxHp}/${p.maxHp} HP</span>
        </div>
      `;
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
    // Collapse roster panel (keep visible in 3-column layout)
    // el.rosterManagerPanel.classList.add('hidden');

    const enemy = window.Game.getEnemyTeam();
    el.matchHeaderTitle.innerHTML =
      `<i class="fa-solid fa-dice"></i> 🎲 Combate Interactivo vs <span style="color:#ef4444;">${enemy.name}</span>`;
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
    el.matchLogLines.innerHTML = '';
    el.arenaBatterCardSlot.innerHTML = '';
    el.arenaPitcherCardSlot.innerHTML = '';
    resetLEDs();

    // Build lineups
    const teamLineups = window.Game.getSimLineups();

    // ── Calculate team shield using position rules (native=100%, OOP=50%, DH=0%) ──
    const avgDef = window.Game.calculateLineupShield();

    // ── Create InteractiveBattle ──────────────────────────────────────────────
    activeBattle = new window.InteractiveBattle(teamLineups.away, teamLineups.home, avgDef, window.Game.buildEra);
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
      <!-- Lucky zones panel -->
      <div id="zones-panel">
        <div id="zones-panel-header">🎯 ${t('match.luck_zones', 'Zonas de la Suerte')}</div>
        <div id="zones-lines"></div>
      </div>
      <!-- ROLL button -->
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


  // ── OUTCOME POPUP BANNER ─────────────────────────────────────────────────────
  function showOutcomePopup(eventType, details, ev) {
    const parent = document.querySelector('.rpg-fight-deck');
    if (!parent) return;

    let title = "";
    let color = "#fff";
    let icon = "fa-star";
    let dmgText = "";
    let borderColor = "#fff";
    let boxShadow = "none";

    switch(eventType) {
      case 'BB':
        title = t('popup.bb_title');
        color = "#3b82f6";
        icon = "fa-walking";
        dmgText = `🚶 ${t('popup.bb_dmg')}`;
        borderColor = "#3b82f6";
        boxShadow = "0 0 30px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)";
        break;
      case 'SO':
        title = t('popup.so_title');
        color = "#ef4444";
        icon = "fa-circle-xmark";
        dmgText = `💀 ${t('popup.so_dmg')}`;
        borderColor = "#ef4444";
        boxShadow = "0 0 30px rgba(239, 68, 68, 0.5), 0 0 15px rgba(239, 68, 68, 0.3)";
        break;
      case 'OUT':
        title = t('popup.out_title');
        color = "#9ca3af";
        icon = "fa-thumbs-down";
        dmgText = `🛡️ ${t('popup.out_dmg')}`;
        borderColor = "#9ca3af";
        boxShadow = "0 0 30px rgba(156, 163, 175, 0.5), 0 0 15px rgba(156, 163, 175, 0.3)";
        break;
      case '1B':
        title = t('popup.single_title');
        color = "#a7f3d0";
        icon = "fa-baseball-bat-ball";
        dmgText = `⚾ ${t('popup.single_dmg')}`;
        borderColor = "#10b981";
        boxShadow = "0 0 30px rgba(16, 185, 129, 0.5), 0 0 15px rgba(16, 185, 129, 0.3)";
        break;
      case '2B':
        title = t('popup.double_title');
        color = "#10b981";
        icon = "fa-bolt-lightning";
        dmgText = `⚡ ${t('popup.double_dmg')}`;
        borderColor = "#10b981";
        boxShadow = "0 0 30px rgba(16, 185, 129, 0.6), 0 0 15px rgba(16, 185, 129, 0.4)";
        break;
      case '3B':
        title = t('popup.triple_title');
        color = "#06b6d4";
        icon = "fa-fire";
        dmgText = `🔥 ${t('popup.triple_dmg')}`;
        borderColor = "#06b6d4";
        boxShadow = "0 0 30px rgba(6, 182, 212, 0.6), 0 0 15px rgba(6, 182, 212, 0.4)";
        break;
      case 'HR':
        title = t('popup.hr_title');
        color = "#eab308";
        icon = "fa-rocket";
        dmgText = `🚀 ${t('popup.hr_dmg')}`;
        borderColor = "#eab308";
        boxShadow = "0 0 45px rgba(234, 179, 8, 0.7), 0 0 20px rgba(234, 179, 8, 0.5)";
        break;
      case 'STEAL':
        title = t('popup.steal_title');
        color = "#38bdf8";
        icon = "fa-person-running";
        dmgText = `⚡ ${t('popup.steal_dmg')}`;
        borderColor = "#38bdf8";
        boxShadow = "0 0 35px rgba(56, 189, 248, 0.7)";
        break;
      case 'KO':
      case 'KO_PITCHER':
        title = t('popup.ko_title');
        color = "#f59e0b";
        icon = "fa-skull-crossbones";
        dmgText = `🥊 ${t('popup.ko_dmg')}`;
        borderColor = "#f59e0b";
        boxShadow = "0 0 35px rgba(245, 158, 11, 0.6)";
        break;
      case 'INNING_END':
        var nextIn = (ev && ev.inning) ? ev.inning : 2;
        if (nextIn > 3 || (activeBattle && activeBattle.battleOver)) return;
        title = `¡ENTRADA ${nextIn}! ⚾`;
        dmgText = `⚾ COMIENZA LA ENTRADA ${nextIn} DE 3`;
        color = "#38bdf8";
        icon = "fa-rotate";
        borderColor = "#38bdf8";
        boxShadow = "0 0 35px rgba(56, 189, 248, 0.6)";
        break;
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
        case 'KO':
        case 'KO_PITCHER': window.AudioManager.play('hit'); break;
        default: break;
      }
    }

    if (!title) return; // Ignore non-play events like NEXT_PITCHER

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
      background: rgba(0, 0, 0, 0.95);
      border: 3px solid ${borderColor};
      border-radius: 16px;
      padding: 20px 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: ${boxShadow};
      pointer-events: none;
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      text-align: center;
      min-width: 240px;
    `;

    let cleanDetails = details ? details.replace(/🎲 \[\d+\] \[[^\]]+\] /, '').replace(/−/g, '-') : '';
    cleanDetails = cleanDetails.replace(/⚡\s*¡?CLUTCH PLAYER!?[^—\n]*[—\.]\s*(\(\+[^)]+\)\.?)?\s*/gi, '').replace(/^⚡\s*¡?CLUTCH PLAYER!?[^\.]*\.\s*/gi, '').trim();

    // Era synergy procs get their own highlighted strip instead of blending into the
    // plain detail text — the era name itself is never translated, so matching on it
    // works regardless of UI language. Text-based, doesn't touch simulation.js.
    const SYNERGY_MARKER_RE = /\p{Extended_Pictographic}?\s*(Genesis Chaos|Small Ball|Liveball Sluggers|Five-Tool Legends|Bash Brothers|Moneyball Analytics|Three True Outcomes)[\s\S]*$/u;
    let synergyHighlightHTML = '';
    const synergyMatch = cleanDetails.match(SYNERGY_MARKER_RE);
    if (synergyMatch && synergyMatch.index > 0) {
      const synergyText = cleanDetails.slice(synergyMatch.index).trim();
      cleanDetails = cleanDetails.slice(0, synergyMatch.index).trim();
      synergyHighlightHTML = `
      <div style="font-size: 11px; color: var(--badge-build-era); background: rgba(255, 46, 196, 0.12); border: 1px solid var(--badge-build-era); padding: 5px 8px; margin-bottom: 10px; max-width: 280px; line-height: 1.35; text-shadow: 0 0 4px var(--badge-build-era-glow);">
        <i class="fa-solid fa-star"></i> ${synergyText}
      </div>`;

      // Layer a short chime on top of the base outcome sound already played above.
      if (window.AudioManager) window.AudioManager.play('draft_pick');

      // Genesis Chaos / Small Ball change base state beyond the normal play — flash
      // whichever bases are occupied right after this play resolved, synced with the popup.
      const eraName = synergyMatch[1];
      if ((eraName === 'Genesis Chaos' || eraName === 'Small Ball') && ev && ev.bases) {
        ['base-1', 'base-2', 'base-3'].forEach((id, idx) => {
          if (ev.bases[idx] !== 'X') return;
          const baseEl = document.getElementById(id);
          if (baseEl) triggerBarShake(baseEl, 'base-synergy-flash');
        });
      }
    }

    popup.innerHTML = `
      <div style="font-size: 36px; color: ${color}; margin-bottom: 12px; filter: drop-shadow(0 0 8px ${color});">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div style="font-family:'Press Start 2P',monospace; font-size: 13px; font-weight: bold; color: ${color}; text-shadow: 0 0 10px ${color}; margin-bottom: 12px;">
        ${title}
      </div>
      <div style="font-size: 12px; color: #e4e4e7; max-width: 280px; line-height: 1.4; margin-bottom: 10px;">
        ${cleanDetails}
      </div>
      ${synergyHighlightHTML}
      <div style="font-family:'Press Start 2P',monospace; font-size: 8px; color: #f59e0b; letter-spacing: 0.5px; border-top: 1px dashed rgba(255,255,255,0.15); width: 100%; padding-top: 10px; margin-top: 5px;">
        ${dmgText}
      </div>
    `;

    parent.style.position = "relative";
    parent.appendChild(popup);

    setTimeout(() => {
      popup.style.transform = "translate(-50%, -50%) scale(1)";
      popup.style.opacity = "1";
    }, 10);

    setTimeout(() => {
      popup.style.transform = "translate(-50%, -50%) scale(0.85)";
      popup.style.opacity = "0";
      setTimeout(() => {
        popup.remove();
      }, 250);
    }, 1000);
  }

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

    // Units die settles first (shorter tumble), tens settles a beat after (longer
    // tumble) — durations must match the CSS keyframe durations exactly.
    const UNITS_TUMBLE_MS = 550;
    const TENS_TUMBLE_MS  = 850;

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

          const hasSteal = rawText.includes('🏃 ¡ROBO DE BASE!');
          const batterText = hasSteal ? rawText.split('🏃 ¡ROBO DE BASE!')[0].trim() : rawText;

          popupQueue.push({ type: ev.eventType, text: batterText, ev, at: cursor });
          cursor += POPUP_DURATION + POPUP_GAP;

          if (hasSteal) {
            const stealText = '🏃 ¡ROBO DE BASE! ' + rawText.split('🏃 ¡ROBO DE BASE!')[1].trim();
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

          // Switch to the next pitcher after all popups have finished
          const switchDelay = cursor; // wait for the full popup queue to finish
          setTimeout(() => {
            if (state.activePitcher && !activeBattle.battleOver) {
              updateMatchHUD(state);
              updateFaceoffPanel(state);
            }
          }, switchDelay);
        } else {
          updateMatchHUD(state);
        }

        renderZones();

        if (activeBattle.battleOver) {
          const delay = Math.max(600, cursor); // wait for all popups to finish first
          setTimeout(() => {
            handleBattleOver();
          }, delay);
        } else {
          // Re-enable button & re-render faceoff cards
          if (btn) btn.disabled = false;
          if (!hasKO) updateFaceoffPanel(state);
        }

        isRolling = false;
    }, TENS_TUMBLE_MS);
  }

  function handleSimulateAll() {
    if (!activeBattle || activeBattle.battleOver) return;

    const btnRoll = document.getElementById('btn-roll-dice');
    const btnSkip = document.getElementById('btn-match-skip-game');
    if (btnRoll) btnRoll.disabled = true;
    if (btnSkip) btnSkip.disabled = true;

    let safety = 0;
    while (!activeBattle.battleOver && safety++ < 500) {
      const roll = Math.floor(Math.random() * 100) + 1;
      const evs = activeBattle.rollDice(roll);
      if (evs && Array.isArray(evs)) {
        evs.forEach(ev => appendLogLine(ev));
      } else if (evs) {
        appendLogLine(evs);
      }
    }

    const finalState = activeBattle.getState();
    updateMatchHUD(finalState);
    updateFaceoffPanel(finalState);
    renderZones();

    if (activeBattle.battleOver) {
      handleBattleOver();
    }
  }

  // ── UPDATE MATCH HUD (HP bars, shield, chain, scoreboard) ───────────────────
  function triggerBarShake(element, cssClass) {
    if (!element) return;
    element.classList.remove(cssClass);
    void element.offsetWidth; // force reflow to restart animation
    element.classList.add(cssClass);
    setTimeout(() => element.classList.remove(cssClass), 500);
  }

  function updateMatchHUD(state, options = {}) {
    if (!state) return;

    // Classic scoreboard
    el.scoreAwayR.innerText  = state.runs;
    el.scoreHomeR.innerText  = state.outs;
    el.scoreAwayH.innerText  = `${state.inning} / 3`;
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

    zonesEl.innerHTML = `
      ${isClutchActive ? `<div class="clutch-active-banner">⚡ ¡CLUTCH PLAYER ACTIVO!</div>` : ''}
      <div class="outcome-probabilities-grid">
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div class="outcome-row">
            <span class="outcome-row-left" style="color:#3b82f6;">⚾ ${t('match.bb', 'Boleto')}</span>
            <span class="outcome-row-right" style="color:#3b82f6;font-weight:bold;">1–${b.bbEnd}</span>
          </div>
          <div class="outcome-row">
            <span class="outcome-row-left" style="color:#ef4444;">💨 ${t('match.so', 'Ponche')}</span>
            <span class="outcome-row-right" style="color:#ef4444;font-weight:bold;">${b.bbEnd + 1}–${b.soEnd}</span>
          </div>
          <div class="outcome-row" style="${isClutchActive ? 'background:rgba(239,68,68,0.12);' : ''}">
            <span class="outcome-row-left" style="color:#9ca3af;">🤚 ${t('match.out', 'Out')}</span>
            <span class="outcome-row-right">
              <span style="color:#9ca3af;font-weight:bold;">${b.soEnd + 1}–${b.outEnd}</span>${penaltyOutTag}
            </span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div class="outcome-row" style="${isClutchActive ? 'background:rgba(0,255,102,0.1);' : ''}">
            <span class="outcome-row-left" style="color:#a7f3d0;">✅ ${t('match.single', 'Sencillo')}</span>
            <span class="outcome-row-right">
              <span style="color:#a7f3d0;font-weight:bold;">${b.outEnd + 1}–${b.singleEnd}</span>${boost1BTag}
            </span>
          </div>
          <div class="outcome-row" style="${isClutchActive ? 'background:rgba(16,185,129,0.1);' : ''}">
            <span class="outcome-row-left" style="color:#10b981;">⚡ ${t('match.double', 'Doble')}</span>
            <span class="outcome-row-right">
              <span style="color:#10b981;font-weight:bold;">${b.singleEnd + 1}–${b.doubleEnd}</span>${boost2BTag}
            </span>
          </div>
          <div class="outcome-row">
            <span class="outcome-row-left" style="color:#06b6d4;">🔥 ${t('match.triple', 'Triple')}</span>
            <span class="outcome-row-right" style="color:#06b6d4;font-weight:bold;">${b.doubleEnd + 1}–${b.tripleEnd}</span>
          </div>
          <div class="outcome-row" style="${isClutchActive ? 'background:rgba(234,179,8,0.15);' : ''}">
            <span class="outcome-row-left" style="color:#eab308;font-weight:bold;">🚀 ${t('match.hr', 'Jonrón')}</span>
            <span class="outcome-row-right">
              <span style="color:#eab308;font-weight:bold;">${b.tripleEnd + 1}–100</span>${boostHRTag}
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
      setTimeout(() => window.AudioManager.play('menu_click'), delay);
    }
  }

  function updateFaceoffPanel(stateOrEvent, opts = {}) {
    if (!stateOrEvent) return;
    const dealAnimation = !!opts.dealAnimation;
    const pitcher = stateOrEvent.activePitcher;
    const batter  = stateOrEvent.currentBatter || null;
    const bName   = batter ? batter.name : (stateOrEvent.activeBatter || '');

    const pNameRaw = pitcher ? pitcher.name : 'Cargando...';
    const pNameClean = pNameRaw.replace(/\s*\(\d{4}\)$/, '').trim();

    el.matchBatterName.innerText  = bName || 'Cargando...';
    el.matchPitcherName.innerText = pNameClean;

    // Batter card
    const bRosterObj = Object.values(window.Game.roster).find(p => p && p.name === bName);
    if (bRosterObj) {
      const eff = window.Game.getEffectiveStats(bRosterObj, bRosterObj.pos);
      const statsBox = document.getElementById('match-batter-stats-box');
      if (statsBox) {
        statsBox.innerHTML = `CON: ${eff.con} | PWR: ${eff.pwr}<br>SPD: ${eff.spd} | DEF: ${eff.def}<br>POS NATIVA: ${eff.pos}`;
      }
      el.arenaBatterCardSlot.innerHTML = createCardHTML(eff, bRosterObj.pos);
      if (dealAnimation) dealCardIn(el.arenaBatterCardSlot, { fromX: -70, delay: 0 });
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

      const enemyTeam = (window.Game && window.Game.getEnemyTeam) ? window.Game.getEnemyTeam() : null;
      const pitchYear   = pitcher.year || pitcher._year || (enemyTeam ? (enemyTeam.year || enemyTeam._year) : 1941);
      const pitchTeam   = pitcher.team || pitcher._team || (enemyTeam ? (enemyTeam.teamID || enemyTeam._team || 'OAK') : 'OAK');
      const pitchEra    = pitcher.era  || pitcher._era  || (enemyTeam ? (enemyTeam.era || enemyTeam._era) : 'Golden Era (1920-1941)');
      const pitchRarity = pitcher.rarity || pitcher._rarity || 'Common';

      const pitchStf = pitcher.stf !== undefined ? pitcher.stf : (pitcher.str !== undefined ? pitcher.str : 40);
      const pitchCtl = pitcher.ctl !== undefined ? pitcher.ctl : (pitcher.ctl_val !== undefined ? pitcher.ctl_val : 40);
      const pitchMov = pitcher.mov !== undefined ? pitcher.mov : (pitcher.grt !== undefined ? pitcher.grt : 50);
      const pitchSta = pitcher.sta !== undefined ? pitcher.sta : (pitcher.maxHp ? Math.max(15, Math.min(125, Math.round((pitcher.maxHp - 15) / 0.85))) : 65);

      const pitchOvr = pitcher.ovr || pitcher._ovr || Math.round(pitchStf*0.30 + pitchCtl*0.30 + pitchMov*0.30 + pitchSta*0.10);

      const tempPitcher = {
        name: pitcher.name, pos: pitcher.role || 'SP', role: pitcher.role || 'SP',
        era: pitchEra,
        team: pitchTeam,
        year: pitchYear,
        mov: pitchMov, stf: pitchStf, ctl: pitchCtl, sta: pitchSta,
        con: pitchStf, pwr: pitchCtl, eye: pitchMov, spd: pitchSta,
        hp: pitcher.hp, maxHp: pitcher.maxHp,
        stamina: Math.round((pitcher.hp / pitcher.maxHp) * 100),
        ovr: pitchOvr,
        rarity: pitchRarity,
        // Without these, createCardHTML's h9 fallback (checks .h9 -> .h9_val ->
        // .grt, none of which this object set) silently defaulted to 50 -> flat
        // "C" on the in-combat card, even after fixing the same bug elsewhere.
        h9:  pitcher.h9  !== undefined ? pitcher.h9  : (pitcher.grt !== undefined ? pitcher.grt : 50),
        k9:  pitcher.k9  !== undefined ? pitcher.k9  : pitchStf,
        bb9: pitcher.bb9 !== undefined ? pitcher.bb9 : pitchCtl,
        hr9: pitcher.hr9 !== undefined ? pitcher.hr9 : pitchMov
      };
      el.arenaPitcherCardSlot.innerHTML = createCardHTML(tempPitcher, tempPitcher.pos);
      if (dealAnimation) dealCardIn(el.arenaPitcherCardSlot, { fromX: 70, delay: 150 });

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
    if (!activeBattle) return;
    const isWin = (activeBattle.winner === 'player');
    const state = activeBattle.getState();

    // Remove existing battle over modals if any
    document.querySelectorAll('.battle-over-modal').forEach(m => m.remove());

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
          ¡Se ha quedado sin Stamina (0 HP) y ha debido retirarse de la carrera!
        </div>
        <div style="font-size:11px;color:#34d399;font-weight:bold;margin-top:6px;">
          🔄 Reemplazado por: <span style="color:#fff;">${a.newPlayerName}</span> (${a.newPlayerRarity} • ${a.newPlayerPos} • OVR ${a.newPlayerOvr})
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="background:#0a0f1d;border:3px solid #ef4444;box-shadow:0 0 40px rgba(239,68,68,0.5);border-radius:16px;padding:24px 30px;max-width:500px;width:95%;text-align:center;">
        <div style="font-size:40px;color:#ef4444;margin-bottom:10px;">⚡</div>
        <h2 style="font-family:'Press Start 2P',monospace;font-size:14px;color:#ef4444;margin-bottom:12px;">¡EXHAUSTIÓN EN EL ROSTER!</h2>
        <p style="font-size:11px;color:#9ca3af;margin-bottom:16px;line-height:1.4;">
          Uno o varios bateadores han agotado completamente su energía (0 Stamina) y no pueden continuar. Han sido sustituidos por agentes libres categoría Common de su misma posición.
        </p>
        <div style="max-height:220px;overflow-y:auto;margin-bottom:20px;">
          ${itemsHTML}
        </div>
        <button id="btn-ack-exhaustion" class="btn" style="width:100%;padding:12px;font-family:'Press Start 2P',monospace;font-size:10px;background:#ef4444;color:#fff;border:none;border-radius:8px;cursor:pointer;">
          ENTENDIDO <i class="fa-solid fa-check"></i>
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
      setupPostMatchDraftScreen(res.isBossStage, res.earnings);
    };

    if (res.retiredAlerts && res.retiredAlerts.length > 0) {
      showStaminaExhaustionModal(res.retiredAlerts, continueRouting);
    } else {
      continueRouting();
    }
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
        <button class="btn btn-trait-pick" data-id="${t.id}" style="margin-top:18px;width:100%;background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;font-weight:bold;font-size:10px;padding:10px;">✨ Elegir</button>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="max-width:850px;width:95%;padding:20px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-family:'Press Start 2P',monospace;font-size:13px;color:#ffd700;text-shadow:0 0 15px rgba(255,215,0,0.7);margin-bottom:8px;">🏆 ¡VICTORIA DE JEFE! +$${earnings}</div>
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
      traitPanel.style.cssText = 'margin-top:10px;padding:10px;border-top:1px dashed rgba(255,215,0,0.3);';
      const sidebar = document.getElementById('synergies-list-container');
      if (sidebar) sidebar.appendChild(traitPanel);
    }
    const traits = window.Game.equippedTraits || [];
    if (!traits.length) { traitPanel.innerHTML = ''; return; }
    traitPanel.innerHTML = `
      <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#ffd700;margin-bottom:8px;">✨ TRAITS ACTIVAS</div>
      ${traits.map(t => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding:8px;background:rgba(255,215,0,0.06);border-radius:8px;border:1px solid rgba(255,215,0,0.2);">
          <span style="font-size:18px;flex-shrink:0;">${t.icon}</span>
          <div><div style="font-size:9px;color:#fef08a;font-weight:bold;margin-bottom:3px;">${t.name}</div><div style="font-size:9px;color:#94a3b8;line-height:1.4;">${t.desc}</div></div>
        </div>
      `).join('')}
    `;
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
          ¡Derrotaste al primer grupo del Playoffs!<br>
          <span style="color:#22d3ee;">${typeof window.t==='function'?window.t('ui.super_boss_desc'):'¡Pero las 4 Máximas Leyendas del Béisbol saltan al campo para la Batalla Final!'}</span>
        </div>
        ${legendRowsHTML ? `<div style="margin-bottom:14px;">${legendRowsHTML}</div>` : ''}
        <div style="background:rgba(255,215,0,0.1);border:1px solid #ffd700;border-radius:8px;padding:10px;font-size:11px;color:#fef08a;margin-bottom:20px;">
          🔥 <strong>Fase Final Especial (4 Pitchers Leyenda)</strong><br>
          ${typeof window.t==='function'?window.t('ui.hp_restored'):'Tu equipo ha recuperado +30 HP y Escudo Máximo.'}
        </div>
        <button id="btn-start-super-boss" class="btn" style="background:linear-gradient(90deg,#ffd700,#f59e0b);color:#000;font-weight:bold;font-size:11px;padding:12px 24px;width:100%;border:none;cursor:pointer;">¡ENFRENTAR AL SUPER BOSS FINAL! ⚾</button>
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
    el.gameoverTitle.innerText = won ? "¡CAMPEONATO CONSEGUIDO!" : "¡Temporada Terminada!";
    el.gameoverTitle.style.color = won ? "var(--primary-color)" : "var(--danger-color)";
    el.gameoverDesc.innerText = message;

    // Render game history logs
    el.gameoverHistoryLog.innerHTML = "";
    if (window.Game.history.length === 0) {
      el.gameoverHistoryLog.innerHTML = `<div style="color:#64748b; font-size:13px;">No hay historial disponible.</div>`;
    } else {
      window.Game.history.forEach(h => {
        const row = document.createElement('div');
        row.className = `history-row ${h.won ? 'won' : 'lost'}`;
        const facedLabel = (h.pitchersFaced !== undefined && h.totalPitchers)
          ? ` <span style="color:#64748b;font-size:11px;">(${h.pitchersFaced}/${h.totalPitchers} pitchers enfrentados)</span>`
          : '';
        row.innerHTML = `
          <span>Etapa ${h.stage + 1}: vs ${h.enemyName}</span>
          <strong>${h.won ? 'VICTORIA' : 'DERROTA'} (${h.ourScore}-${h.enemyScore})</strong>${facedLabel}
        `;
        el.gameoverHistoryLog.appendChild(row);
      });
    }

    window.showScreen('screen-gameover');
  }

  // ── TRUE VICTORY SCREEN ──────────────────────────────────────────────────
  function triggerTrueVictory() {
    window.showScreen('screen-victory');
    startFireworks();
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
    const modal = document.getElementById('modal-run-summary');
    if (!modal) return;
    modal.classList.remove('hidden');

    // Render batter stats
    const tbodyB = document.getElementById('summary-tbody-batters');
    const batterStats = window.Game.runBatterStats || {};
    const rosterHistory = window.Game.runRosterHistory || {};
    const allBatterNames = new Set([...Object.keys(batterStats), ...Object.keys(rosterHistory)]);

    tbodyB.innerHTML = '';
    if (!allBatterNames.size) {
      tbodyB.innerHTML = '<tr><td colspan="15" style="padding:12px;color:#64748b;text-align:center;">Sin datos de bateo registrados.</td></tr>';
    } else {
      [...allBatterNames].forEach(name => {
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

        const b1 = Math.max(0, h - b2 - b3 - hr);
        const pa = ab + bb;
        const totalBases = b1 + (2 * b2) + (3 * b3) + (4 * hr);

        const avgVal = ab > 0 ? (h / ab) : 0;
        const obpVal = pa > 0 ? ((h + bb) / pa) : 0;
        const slgVal = ab > 0 ? (totalBases / ab) : 0;
        const opsVal = obpVal + slgVal;

        const avg = ab > 0 ? avgVal.toFixed(3) : '.000';
        const obp = pa > 0 ? obpVal.toFixed(3) : '.000';
        const slg = ab > 0 ? slgVal.toFixed(3) : '.000';
        const ops = (ab > 0 || pa > 0) ? opsVal.toFixed(3) : '.000';

        const rowColor = (s.hr || 0) >= 2 ? 'rgba(255,215,0,0.05)' : 'transparent';
        const tr = document.createElement('tr');
        tr.style.cssText = `border-bottom:1px solid rgba(255,255,255,0.06);background:${rowColor};`;
        tr.innerHTML = `
          <td style="padding:8px;color:#e2e8f0;font-weight:bold;">${name}</td>
          <td style="padding:8px;color:#94a3b8;">${g}</td>
          <td style="padding:8px;color:#94a3b8;">${ab}</td>
          <td style="padding:8px;color:#22d3ee;">${h}</td>
          <td style="padding:8px;color:#f59e0b;">${b2}</td>
          <td style="padding:8px;color:#f59e0b;">${b3}</td>
          <td style="padding:8px;color:#ef4444;">${hr}</td>
          <td style="padding:8px;color:#10b981;">${rbi}</td>
          <td style="padding:8px;color:#38bdf8;">${sb}</td>
          <td style="padding:8px;color:#a78bfa;">${bb}</td>
          <td style="padding:8px;color:#f87171;">${so}</td>
          <td style="padding:8px;color:${avgVal >= 0.300 ? '#ffd700' : '#94a3b8'};font-weight:bold;">${avg}</td>
          <td style="padding:8px;color:${obpVal >= 0.380 ? '#38bdf8' : '#94a3b8'};font-weight:bold;">${obp}</td>
          <td style="padding:8px;color:${slgVal >= 0.500 ? '#f59e0b' : '#94a3b8'};font-weight:bold;">${slg}</td>
          <td style="padding:8px;color:${opsVal >= 0.850 ? '#00ff66' : (opsVal >= 0.750 ? '#ffd700' : '#94a3b8')};font-weight:bold;">${ops}</td>
        `;
        tbodyB.appendChild(tr);
      });
    }

    // Render pitcher stats
    const tbodyP = document.getElementById('summary-tbody-pitchers');
    const pitcherStats = window.Game.runPitcherStats || {};
    const pitcherNames = Object.keys(pitcherStats);

    tbodyP.innerHTML = '';
    if (!pitcherNames.length) {
      tbodyP.innerHTML = '<tr><td colspan="8" style="padding:12px;color:#64748b;text-align:center;">Sin datos de lanzadores registrados.</td></tr>';
    } else {
      pitcherNames.forEach(name => {
        const ps = pitcherStats[name];
        const outs = ps.outs || 0;
        const ip = `${Math.floor(outs / 3)}.${outs % 3}`;
        const er  = ps.er || 0;
        const era = outs > 0 ? ((er * 27) / outs).toFixed(2) : '--.--';
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.06);';
        tr.innerHTML = `
          <td style="padding:8px;color:#e2e8f0;font-weight:bold;">${name}</td>
          <td style="padding:8px;color:#22d3ee;">${ip}</td>
          <td style="padding:8px;color:#a78bfa;">${ps.k || 0}</td>
          <td style="padding:8px;color:#fbbf24;">${ps.bb || 0}</td>
          <td style="padding:8px;color:#94a3b8;">${ps.h || 0}</td>
          <td style="padding:8px;color:#ef4444;">${ps.hr || 0}</td>
          <td style="padding:8px;color:#f87171;">${er}</td>
          <td style="padding:8px;color:${parseFloat(era) > 4.5 ? '#ef4444' : '#10b981'};font-weight:bold;">${era}</td>
        `;
        tbodyP.appendChild(tr);
      });
    }

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