
// Global helper for screen swapping with proper parent-child container handling
window.showScreen = function(screenId) {
  const screenMode = document.getElementById('screen-mode-select');
  const screenMenu = document.getElementById('screen-menu');
  const gameWorkspace = document.getElementById('game-workspace');
  const hud = document.getElementById('game-hud');
  const leftSidebar = document.getElementById('roster-sidebar-panel');
  const rightSidebar = document.querySelector('.workspace-sidebar.right-sidebar');

  if (screenId === 'screen-mode-select') {
    if (screenMode) screenMode.classList.remove('hidden');
    if (screenMenu) screenMenu.classList.add('hidden');
    if (gameWorkspace) gameWorkspace.classList.add('hidden');
    if (hud) hud.classList.add('hidden');
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
  if (target) target.classList.remove('hidden');
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

    if (currentTick < maxTicks) {
      speed += 10;
      setTimeout(runStep, speed);
    } else {
      // Lock final winning year
      if (yearEl) yearEl.innerText = String(selectedYear);
      if (eraEl) eraEl.innerText = getEraNameForYear(selectedYear);
      if (boxEl) boxEl.classList.add('winning-glow');
      if (msgEl) msgEl.innerHTML = `<span style="color: #ffd700; font-weight: bold; text-shadow: 0 0 10px rgba(255,215,0,0.8);">⚡ ¡TEMPORADA SELECCIONADA: ${selectedYear}! ⚡</span>`;

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
    { id: "t_con", get label() { return t('train_plans.con_label'); }, get desc() { return t('train_plans.con_desc'); }, price: 15, stat: "con", val: 6 },
    { id: "t_pwr", get label() { return t('train_plans.pwr_label'); }, get desc() { return t('train_plans.pwr_desc'); }, price: 15, stat: "pwr", val: 6 },
    { id: "t_spd", get label() { return t('train_plans.spd_label'); }, get desc() { return t('train_plans.spd_desc'); }, price: 12, stat: "spd", val: 6 },
    { id: "t_def", get label() { return t('train_plans.def_label'); }, get desc() { return t('train_plans.def_desc'); }, price: 10, stat: "def", val: 6 },
    { id: "t_sta", get label() { return t('train_plans.sta_label'); }, get desc() { return t('train_plans.sta_desc'); }, price: 10, stat: "sta", val: 35 }
  ];

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
  function renderDraftRound() {
    try {
      const G = window.Game;
      console.log('[Draft] renderDraftRound called. G =', G, 'draftRound =', G && G.draftRound, 'POOL =', window.PlayersDB && window.PlayersDB.LAHMAN_POOL && window.PlayersDB.LAHMAN_POOL.length);
      if (!G) { console.error('[Draft] window.Game is null!'); return; }
      const round = G.draftRound; // 1–9

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
          descEl.innerText = "Elige a tus Jugadores en 9 rondas de draft para armar tu alineación completa de 9 bateadores. Organiza su posición defensiva (Drag & Drop) y su orden al bate en tiempo real. Luego lanza el dado en cada turno para determinar el resultado al bate. Derrota la rotación rival antes de que tus 100 HP lleguen a cero.";
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

      header.innerHTML = `
        <div style="max-width: 780px; margin: 0 auto 12px; padding: 10px 16px; background: rgba(0, 255, 102, 0.05); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 8px; font-size: 11px; color: #a7f3d0; line-height: 1.5; text-align: center;">
          ${t('menu.intro_desc', { rounds: 9, hp: 100 })}
        </div>
        <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:${RARITY_COLORS[info.rarities ? info.rarities[0] : 'Legendary']};margin-bottom:8px;letter-spacing:1px;">
          ${t('draft.round_header', { round: round })}
        </div>
        <div style="display:flex;justify-content:center;gap:6px;align-items:center;margin-bottom:8px;">${roundDots}</div>
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
      layout.style.cssText = 'display:grid;grid-template-columns:210px 1fr 190px;gap:12px;align-items:flex-start;width:100%;max-width:1180px;margin:0 auto;';

      // ───── LEFT: Fielding Roster Panel ─────────────────────────────────
      const rosterPanel = document.createElement('div');
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
          const ovr = player.ovr !== undefined ? Math.round(player.ovr) : Math.round((player.con||player.contact_val||40)*.3+(player.pwr||player.power_val||35)*.3+(player.spd||player.speed_val||45)*.15+(player.def||player.defense_val||40)*.15+(player.eye||player.eye_val||40)*.1);
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
              <div style="font-size:10px;font-weight:bold;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${player.name}</div>
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
      centerPanel.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:16px;';

      const cardsRow = document.createElement('div');
      cardsRow.style.cssText = 'display:flex;gap:10px;justify-content:center;align-items:flex-start;flex-wrap:nowrap;width:100%;';

      picks.forEach(player => {
        const rColor = RARITY_COLORS[player.rarity] || RARITY_COLORS.Common;
        const rBg    = RARITY_BG[player.rarity]    || RARITY_BG.Common;
        const ovr    = player.ovr !== undefined ? Math.round(player.ovr) : Math.round((player.con||player.contact_val||40)*.3+(player.pwr||player.power_val||35)*.3+(player.spd||player.speed_val||45)*.15+(player.def||player.defense_val||40)*.15+(player.eye||player.eye_val||40)*.1);
        const cardHTML = createCardHTML(player);

        const wrapper = document.createElement('div');
        wrapper.style.cssText = [
          'cursor:pointer','border-radius:12px',
          `border:2px solid ${rColor}`,
          `background:${rBg}`,
          'padding:6px','transition:transform .15s,box-shadow .15s',
          'display:flex','flex-direction:column','align-items:center','gap:6px',
          'flex:1','max-width:180px','box-sizing:border-box'
        ].join(';');

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
          G.draftPickPlayer(player);
          if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
        });
        cardsRow.appendChild(wrapper);
      });

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
             const ovrA = Math.round((a.con||40)*.3+(a.pwr||35)*.3+(a.spd||45)*.15+(a.def||40)*.15+(a.eye||40)*.1);
             const ovrB = Math.round((b.con||40)*.3+(b.pwr||35)*.3+(b.spd||45)*.15+(b.def||40)*.15+(b.eye||40)*.1);
             return ovrB - ovrA;
          });
          G.draftPickPlayer(picks[0]);
        }
        renderFinalLineupConfirmation();
      };
      centerPanel.appendChild(autoDraftBtn);


      // ───── RIGHT: Batting Order Panel ──────────────────────────────────
      const orderPanel = document.createElement('div');
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
            ? `<span style="font-size:9px;color:#fff;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${player.name.split(' ').pop()}</span>`
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
      autoSortBtn.title = 'Ordena lógicamente: Velocidad al 1ro, Poder al 4to, Mejores bates al 2do y 3ro.';
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
      layout.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:flex-start;width:100%;max-width:920px;margin:0 auto 16px;';

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
          const ovr = Math.round((player.con||40)*.3+(player.pwr||35)*.3+(player.spd||45)*.15+(player.def||40)*.15+(player.eye||40)*.1);
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
              <div style="font-size:11px;font-weight:bold;color:#fff;">${player.name}</div>
              <div style="font-size:9.5px;color:${rColor};">${player.rarity} • OVR ${ovr} ${posHint}</div>
            </div>
            <button class="btn-inspect-player" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#38bdf8;padding:4px 8px;font-size:9px;border-radius:4px;cursor:pointer;">🔍 CARTA</button>
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
          <span>⚔️ ORDEN AL BATE</span>
          <button class="btn btn-secondary" id="btn-auto-sort" style="padding:4px 8px;font-size:8px;cursor:pointer;">🤖 AUTO-ORDEN</button>
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
            const ovr = Math.round((player.con||40)*.3+(player.pwr||35)*.3+(player.spd||45)*.15+(player.def||40)*.15+(player.eye||40)*.1);
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
              <span style="font-size:9px;color:#374151;flex:1;">${slot} — VACÍO</span>
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
            (window.showScreen || showScreen)('screen-draft');
            if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
          });
        } else {
          if (modalSeason) modalSeason.classList.add('hidden');
          if (window.Game && window.Game.loadSeasonOpponents) {
            window.Game.loadSeasonOpponents(yearVal);
          }
          (window.showScreen || showScreen)('screen-draft');
          if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
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
        window.showScreen('screen-draft');
        if (window.renderDraftRound) window.renderDraftRound(); else if (typeof renderDraftRound === 'function') renderDraftRound();
      };
    }
  }

  function init() {
    initGameModeSelector();
    // NOTE: do NOT call renderDraftRound() here — window.Game doesn't exist yet on page load.
    // It is called by initGameModeSelector handlers after the user selects a mode.
    setupEventListeners();
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
            <div style="font-size: 11px; font-weight:bold;">VACÍO</div>
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

    const year = player.year || player.peak_year_display || player.peak_year || "";
    
    // Dynamically resolve player era if missing or unmapped
    let resolvedEra = player.era;
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
      : (isPitcher
          ? Math.round(stfForOvr*0.30 + ctlForOvr*0.30 + movForOvr*0.30 + staForOvr*0.10)
          : Math.round((player.con || 40)*0.30 + (player.pwr || 35)*0.30 + (player.spd || 45)*0.15 + (player.def || 40)*0.15 + (player.eye || 40)*0.10));

    // Rarity styles
    let derivedRarity = player.rarity;
    if (!derivedRarity) {
      if (ovr >= 90) derivedRarity = "Legendary";
      else if (ovr >= 80) derivedRarity = "Epic";
      else if (ovr >= 65) derivedRarity = "Rare";
      else if (ovr >= 50) derivedRarity = "Uncommon";
      else derivedRarity = "Common";
    }
    const rarityLabel = derivedRarity;


    // Get Rating letter grade
    const ovrGrade = getStatGrade(ovr);

    // Format stats values
    let statLines = "";
    if (isPitcher) {
      const movVal = player.mov !== undefined ? player.mov : (player.grt !== undefined ? player.grt : (player.grt_val !== undefined ? player.grt_val : (player.eye !== undefined ? player.eye : 50)));
      const stfVal = player.stf !== undefined ? player.stf : (player.str !== undefined ? player.str : (player.str_val !== undefined ? player.str_val : (player.con !== undefined ? player.con : 50)));
      const ctlVal = player.ctl !== undefined ? player.ctl : (player.ctl_val !== undefined ? player.ctl_val : (player.pwr !== undefined ? player.pwr : 50));
      const staVal = player.sta !== undefined ? player.sta : (player.sta_val !== undefined ? player.sta_val : (player.spd !== undefined ? player.spd : (player.maxHp ? Math.max(15, Math.min(125, Math.round((player.maxHp - 15) / 0.85))) : 65)));

      const gMov = getStatGrade(movVal);
      const gStf = getStatGrade(stfVal);
      const gCtl = getStatGrade(ctlVal);
      const gSta = getStatGrade(staVal);

      statLines = `
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
          <span class="stat-label">MOV:</span>
          <span class="stat-badge" style="background: ${gMov.color}; color: ${gMov.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gMov.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
          <span class="stat-label">STF:</span>
          <span class="stat-badge" style="background: ${gStf.color}; color: ${gStf.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gStf.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
          <span class="stat-label">CTL:</span>
          <span class="stat-badge" style="background: ${gCtl.color}; color: ${gCtl.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gCtl.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
          <span class="stat-label">STA:</span>
          <span class="stat-badge" style="background: ${gSta.color}; color: ${gSta.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gSta.text}</span>
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
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
          <span class="stat-label">CON:</span>
          <span class="stat-badge" style="background: ${gCon.color}; color: ${gCon.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gCon.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
          <span class="stat-label">POW:</span>
          <span class="stat-badge" style="background: ${gPwr.color}; color: ${gPwr.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gPwr.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
          <span class="stat-label">EYE:</span>
          <span class="stat-badge" style="background: ${gEye.color}; color: ${gEye.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gEye.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
          <span class="stat-label">SPD:</span>
          <span class="stat-badge" style="background: ${gSpd.color}; color: ${gSpd.text === 'F' ? '#fff' : '#000'}; font-family: 'Press Start 2P', monospace; font-size: 6px; padding: 2px 5px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">${gSpd.text}</span>
        </div>
        <div class="stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 7px; margin: 3px 0;">
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

    return `
      <div class="player-card ${eraClass} rarity-${rarityLabel}">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="card-position" style="background: #000; color: #fff; padding: 2px 4px; font-weight: bold; font-size: 6px; border: 1px solid rgba(255,255,255,0.1);">${player.pos}</span>
          <span class="card-ovr" style="font-family: 'Press Start 2P', monospace; font-size: 6px; color: ${ovrGrade.color}; font-weight: bold; background: #000; padding: 2px 4px; border: 1px solid rgba(255,255,255,0.2);">CLASS ${ovrGrade.text}</span>
          <span class="card-year" style="font-size: 6px;">${year}</span>
        </div>
        ${(() => {
          const pName = player.name || '';
          const len = pName.length;
          let fontSizeStyle = '';
          if (len >= 20) fontSizeStyle = 'style="font-size: 5.5px !important;"';
          else if (len >= 16) fontSizeStyle = 'style="font-size: 6.5px !important;"';
          else if (len >= 14) fontSizeStyle = 'style="font-size: 7px !important;"';
          return `<div class="card-name" title="${pName}" ${fontSizeStyle}>${pName}</div>`;
        })()}
        <div class="card-traits-box">
          <span class="card-trait-badge trait-era" title="${player.era}">${getShortEraName(player.era)}</span>
          ${player.team && player.team !== 'ROOK' ? `<span class="card-trait-badge trait-team" title="${window.PlayersDB.FranchiseNames[player.team] || player.team}">${player.team}</span>` : ''}
        </div>
        ${player.sec_pos ? `<div class="card-sec-pos-line" title="Posición Secundaria: ${player.sec_pos}">SEC: ${player.sec_pos}</div>` : ''}
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


    // Toggle roster panel collapse
    if (el.toggleRosterBtn) {
      el.toggleRosterBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          el.rosterManagerPanel.classList.toggle('mobile-drawer-open');
        } else {
          el.rosterManagerPanel.classList.toggle('hidden');
        }
      });
    }

    // Toggle synergies panel on mobile
    const btnSynergiesMobile = document.getElementById('btn-toggle-synergies-mobile');
    const synergiesPanel = document.querySelector('.workspace-sidebar.right-sidebar');
    if (btnSynergiesMobile && synergiesPanel) {
      btnSynergiesMobile.addEventListener('click', () => {
        synergiesPanel.classList.toggle('mobile-drawer-open');
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
        hit_upgrade_title: "⚡ UPGRADE DE BATAZOS:"
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
        hit_upgrade_title: "⚡ HIT UPGRADES:"
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
    }

    // Toggle Language (ES / EN)
    const btnLang = document.getElementById('btn-lang-toggle');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        const cur = window.i18n ? window.i18n.getCurrentLanguage() : (localStorage.getItem('baserogue_lang') || 'es');
        const next = cur === 'es' ? 'en' : 'es';
        if (window.i18n) {
          window.i18n.changeLanguage(next);
        }
      });
    }

    const btnCloseRoster = document.getElementById('btn-close-roster-mobile');
    if (btnCloseRoster) {
      btnCloseRoster.addEventListener('click', () => {
        el.rosterManagerPanel.classList.remove('mobile-drawer-open');
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
      alert("¡Toda tu plantilla recupera +40 de energía!");
      closeNodeCompleted();
    });

    el.btnRestCash.addEventListener('click', () => {
      window.Game.budget += 25;
      renderActiveRoster();
      updateHUD();
      alert("¡Tu club recibe una bonificación de +$25 de patrocinadores!");
      closeNodeCompleted();
    });

    // Training back/confirm
    el.btnTrainBack.addEventListener('click', () => {
      closeNodeCompleted();
    });

    el.btnConfirmTrain.addEventListener('click', () => {
      const selectedPlanEl = el.trainOptionsList.querySelector('.training-card.selected');
      if (!selectedPlanEl) {
        alert("Selecciona un plan de entrenamiento.");
        return;
      }

      const planId = selectedPlanEl.getAttribute('data-plan-id');
      const plan = TrainingPlans.find(t => t.id === planId);

      if (window.Game.budget < plan.price) {
        alert("Presupuesto insuficiente.");
        return;
      }

      // Check which player is selected
      const selectedRadio = el.trainPlayerSelect.querySelector('input[type="radio"]:checked');
      if (!selectedRadio) {
        alert("Selecciona un jugador para entrenar.");
        return;
      }

      const targetId = selectedRadio.value;
      
      // Find player on active roster
      let player = Object.values(window.Game.roster).find(p => p && p.id === targetId);

      if (!player) return;

      // Apply training
      if (plan.stat === 'sta') {
        player.stamina = Math.min(100, player.stamina + plan.val);
        player.upgrades.sta = (player.upgrades.sta || 0) + 5; // boost max stamina
      } else {
        player.upgrades[plan.stat] = (player.upgrades[plan.stat] || 0) + plan.val;
      }

      window.Game.budget -= plan.price;
      alert(`¡Entrenamiento completado! ${player.name} subió +${plan.val} en su stat.`);

      renderActiveRoster();
      renderSynergiesAndItems();
      updateHUD();
      
      closeNodeCompleted();
    });

    // 🎲 LANZAR DADO — Interactive Dice Battler
    // The button is dynamically injected into #screen-match by setupAndStartMatchSimulation.
    // We delegate via event delegation on the screen so it works after DOM injection.
    document.getElementById('screen-match').addEventListener('click', (e) => {
      if (e.target.closest('#btn-roll-dice')) {
        handleRollDice();
      }
    });

    // Skip button: immediately resolve the full battle (fast-forward)
    el.btnMatchSkip && el.btnMatchSkip.addEventListener('click', () => {
      if (!activeBattle || activeBattle.battleOver) return;
      // Roll automatically until battle ends
      let safety = 0;
      while (!activeBattle.battleOver && safety++ < 500) {
        const roll = Math.floor(Math.random() * 100) + 1;
        const ev = activeBattle.rollDice(roll);
        if (ev) appendLogLine(ev);
      }
      const finalState = activeBattle.getState();
      updateMatchHUD(finalState);
      if (activeBattle.battleOver) handleBattleOver();
    });

    // Restart game click - restarts run with same mode and season configuration
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
      triggerGameOver(true, "¡CAMPEÓN DE LA ETERNIDAD! Conquistaste la Serie Mundial y ganaste los Playoffs.");
      return;
    }

    updateHUD();
    renderMap();
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
        nameSpan.innerText = effectivePlayer.name;
        nameSpan.title = `${effectivePlayer.name} (${effectivePlayer.era})`;
        
        // OVR Badge
        const ovr = Math.round((effectivePlayer.con||40)*0.30 + (effectivePlayer.pwr||35)*0.30 + (effectivePlayer.spd||45)*0.15 + (effectivePlayer.def||40)*0.15 + (effectivePlayer.eye||40)*0.10);
        const ovrGrade = getStatGrade(ovr);
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

    const ovr = Math.round((effectivePlayer.con||40)*0.30 + (effectivePlayer.pwr||35)*0.30 + (effectivePlayer.spd||45)*0.15 + (effectivePlayer.def||40)*0.15 + (effectivePlayer.eye||40)*0.10);
    const ovrGrade = getStatGrade(ovr);

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
        ${statBar('CON', 'con', '#00ff66')}
        ${statBar('PWR', 'pwr', '#f97316')}
        ${statBar('SPD', 'spd', '#38bdf8')}
        ${statBar('DEF', 'def', '#a78bfa')}
        ${statBar('EYE', 'eye', '#fbbf24')}
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
    match:  { text: 'VS',   label: 'SERIE',    color: '#00ff66', bg: '#021a0e', border: '#00ff66' },
    boss:   { text: 'BOSS', label: 'JEFE',     color: '#ffd700', bg: '#1a0e00', border: '#ffd700' },
    draft:  { text: 'SIGN', label: 'FIRMA',    color: '#38bdf8', bg: '#021526', border: '#38bdf8' },
    event:  { text: 'EVT',  label: 'EVENTO',   color: '#fb923c', bg: '#1a0e00', border: '#fb923c' },
    train:  { text: 'GYM',  label: 'ENTRENO',  color: '#22d3ee', bg: '#011a1a', border: '#22d3ee' },
    rest:   { text: 'REST', label: 'DESCANSO', color: '#c084fc', bg: '#12001a', border: '#c084fc' },
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

            const isVisitedPath = node.visited && window.Game.map[s + 1]?.[targetIdx]?.visited;
            const isActivePath  = (s + 1 === currentStage) && node.visited;

            // Glow behind active/visited
            if (isVisitedPath || isActivePath) {
              const gp = document.createElementNS(svgNS, 'line');
              gp.setAttribute('x1', p1.x); gp.setAttribute('y1', p1.y);
              gp.setAttribute('x2', p2.x); gp.setAttribute('y2', p2.y);
              gp.setAttribute('stroke', isActivePath ? '#00ff66' : '#10b981');
              gp.setAttribute('stroke-width', '8');
              gp.setAttribute('opacity', '0.45');
              gp.setAttribute('filter', `url(#${isActivePath ? 'glow-active' : 'glow-visited'}-z${zoneIdx})`);
              svg.appendChild(gp);
            }

            // Main dashed line
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'square');

            if (isActivePath) {
              line.setAttribute('stroke', '#00ff66');
              line.setAttribute('stroke-width', '4');
              line.setAttribute('stroke-dasharray', '8,4');
            } else if (isVisitedPath) {
              line.setAttribute('stroke', '#4ade80');
              line.setAttribute('stroke-width', '3');
              line.setAttribute('stroke-dasharray', '8,4');
              line.setAttribute('opacity', '0.7');
            } else {
              line.setAttribute('stroke', 'rgba(255,255,255,0.3)');
              line.setAttribute('stroke-width', '2.5');
              line.setAttribute('stroke-dasharray', '6,6');
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

          const isVisited  = node.visited;
          const isActive   = (s === currentStage) && activeNextNodeIdxs.includes(idx);
          const isPast     = (s < currentStage);
          const isDisabled = !isActive && !isPast && !isVisited;

          // Outer glow ring for active
          if (isActive) {
            const glow = document.createElementNS(svgNS, 'circle');
            glow.setAttribute('cx', pos.x); glow.setAttribute('cy', pos.y);
            glow.setAttribute('r', NODE_R + 10);
            glow.setAttribute('fill', 'none');
            glow.setAttribute('stroke', '#00ff66');
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
          circle.setAttribute('fill', isDisabled ? '#0f172a' : (isPast || isVisited ? '#1e293b' : vis.bg));
          circle.setAttribute('stroke', isDisabled ? '#334155' : vis.color);
          circle.setAttribute('stroke-width', isBossStage ? '3.5' : '2.5');
          if (isDisabled) circle.setAttribute('opacity', '0.5');
          svg.appendChild(circle);

          // Node text label
          const txt = document.createElementNS(svgNS, 'text');
          txt.setAttribute('x', pos.x); txt.setAttribute('y', pos.y + 3);
          txt.setAttribute('text-anchor', 'middle');
          txt.setAttribute('dominant-baseline', 'middle');
          txt.setAttribute('fill', isDisabled ? '#475569' : (isPast || isVisited ? '#64748b' : vis.color));
          txt.setAttribute('font-family', "'Press Start 2P', monospace");
          txt.setAttribute('font-size', isBossStage ? '8' : '7');
          txt.setAttribute('font-weight', 'bold');
          txt.textContent = vis.text;
          svg.appendChild(txt);

          // Node type label below
          const lbl = document.createElementNS(svgNS, 'text');
          lbl.setAttribute('x', pos.x); lbl.setAttribute('y', pos.y + NODE_R + 15);
          lbl.setAttribute('text-anchor', 'middle');
          lbl.setAttribute('fill', isDisabled ? '#475569' : (isActive ? '#00ff66' : 'rgba(255,255,255,0.8)'));
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
            hit.setAttribute('r', NODE_R + 12);
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

    // Auto-scroll to current active stage node
    setTimeout(() => {
      const activeNodeEl = document.querySelector('.map-node-visual.active-path');
      if (activeNodeEl) {
        activeNodeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
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
        get desc1() { return t('eras.genesis_d1'); },
        get desc2() { return t('eras.genesis_d2'); }
      },
      "Deadball (1901-1919)": {
        name: "Small Ball",
        get desc1() { return t('eras.deadball_d1'); },
        get desc2() { return t('eras.deadball_d2'); }
      },
      "Golden Era (1920-1941)": {
        name: "Liveball Sluggers",
        get desc1() { return t('eras.golden_d1'); },
        get desc2() { return t('eras.golden_d2'); }
      },
      "Integration (1942-1960)": {
        name: "Five-Tool Legends",
        get desc1() { return t('eras.integration_d1'); },
        get desc2() { return t('eras.integration_d2'); }
      },
      "Expansion (1961-1976)": {
        name: "Speed & Hustle",
        get desc1() { return t('eras.speed_d1'); },
        get desc2() { return t('eras.speed_d2'); }
      },
      "Big Hair Era (1977-1993)": {
        name: "AstroTurf Speedsters",
        get desc1() { return t('eras.astroturf_d1'); },
        get desc2() { return t('eras.astroturf_d2'); }
      },
      "Steroid Era (1994-2005)": {
        name: "Bash Brothers",
        get desc1() { return t('eras.steroid_d1'); },
        get desc2() { return t('eras.steroid_d2'); }
      },
      "Efficiency (2006-2015)": {
        name: "Moneyball Analytics",
        get desc1() { return t('eras.moneyball_d1'); },
        get desc2() { return t('eras.moneyball_d2'); }
      },
      "Modern Era (2016-Pres)": {
        name: "Three True Outcomes",
        get desc1() { return t('eras.tto_d1'); },
        get desc2() { return t('eras.tto_d2'); }
      }
    };

    const eraCounts = {};
    const teamCounts = {};
    
    // Count active roster players
    Object.values(window.Game.roster).forEach(player => {
      if (player && !player.isReplacement) {
        if (player.era) {
          eraCounts[player.era] = (eraCounts[player.era] || 0) + 1;
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
      
      let itemClass = "synergy-list-item";
      let isActive = false;
      if (count >= 4) {
        itemClass += " active-level-2";
        isActive = true;
      } else if (count >= 2) {
        itemClass += " active";
        isActive = true;
      }

      const item = document.createElement('div');
      item.className = itemClass;

      let dotsHTML = "";
      for (let i = 1; i <= 4; i++) {
        const filled = i <= count ? 'filled' : '';
        dotsHTML += `<span class="synergy-dot ${filled}"></span>`;
      }

      const shortName = eraName.split(' ')[0] || eraName;
      const desc = count >= 4 ? meta.desc2 : meta.desc1;

      item.innerHTML = `
        <div class="synergy-item-header">
          <span class="synergy-item-name">${meta.name}</span>
          <span class="synergy-item-count">${count}/4</span>
        </div>
        <div class="synergy-progress-dots">
          ${dotsHTML}
        </div>
        <div class="synergy-item-desc" style="font-size: 11px;">${desc}</div>
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
    const currentTeamCount = teamCounts[player.team] || 0;

    let predictionText = "";
    
    // Era synergy impact
    const eraShort = getShortEraName(player.era);
    if (currentEraCount === 1) {
      predictionText += `Firma activa Sinergia <strong>${eraShort} (T1)</strong>!<br>`;
    } else if (currentEraCount === 3) {
      predictionText += `Firma activa Sinergia <strong>${eraShort} (T2)</strong>!<br>`;
    } else {
      predictionText += `Era ${eraShort}: ${currentEraCount} ➡️ <strong>${currentEraCount + 1}/2</strong><br>`;
    }

    // Team synergy impact
    if (player.team && player.team !== 'ROOK') {
      const teamShort = player.team;
      if (currentTeamCount === 1) {
        predictionText += `Firma activa Química de <strong>${teamShort}</strong> (+4 stats)`;
      } else if (currentTeamCount === 3) {
        predictionText += `Firma activa Dinastía de <strong>${teamShort}</strong> (+10 stats)`;
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
  function setupDraftPickScreen() {
    let pool = el.draftOptionsRow || el.starterPool || document.getElementById('starter-selection-pool') || document.getElementById('draft-options-row');
    if (pool) {
      pool.innerHTML = "";
      pool.style.cssText = 'display:flex;flex-direction:row;justify-content:center;align-items:flex-start;gap:16px;flex-wrap:nowrap;width:100%;max-width:1100px;margin:0 auto;padding:10px 0;';
    }
    
    const titleEl = el.screenDraft.querySelector('h2');
    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-file-signature"></i> ` + t('draft.title');
    }
    const descEl = el.screenDraft.querySelector('p');
    if (descEl) {
      descEl.innerText = t('draft.midrun_desc');
    }

    const options = window.Game.getDraftPicks();

    options.forEach(player => {
      const cardHTML = createCardHTML(player);
      const predictionText = getDraftSynergyPrediction(player);
      const cardCol = document.createElement('div');
      cardCol.className = "draft-card-option";
      cardCol.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;max-width:210px;box-sizing:border-box;";
      
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

      cardCol.innerHTML = `
        <div>${cardHTML}</div>
        <div style="font-size:10px; color:#f59e0b; font-weight:bold; margin-top:4px; text-align:center; font-family:'Press Start 2P',monospace;">Coste: $${cost}</div>
        <div class="draft-synergy-helper">${predictionText}</div>
      `;
      cardCol.appendChild(btnSign);
      el.draftOptionsRow.appendChild(cardCol);
    });

    // Add a "Rechazar Firma" button option
    const skipCol = document.createElement('div');
    skipCol.className = "draft-card-option";
    skipCol.style.cssText = "display:flex;flex-direction:column;justify-content:center;align-items:center;border:2px dashed rgba(255,255,255,0.15);padding:16px;border-radius:12px;height:350px;flex:1;max-width:210px;box-sizing:border-box;";

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
      pool.style.cssText = 'display:flex;flex-direction:row;justify-content:center;align-items:flex-start;gap:16px;flex-wrap:nowrap;width:100%;max-width:1100px;margin:0 auto;padding:10px 0;';
    }
    
    const titleEl = el.screenDraft.querySelector('h2');
    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-file-signature"></i> ` + t('draft.title');
    }
    const descEl = el.screenDraft.querySelector('p');
    if (descEl) {
      descEl.innerText = t('draft.midrun_desc');
    }

    const options = window.Game.getPostMatchDraftPicks(isBoss);

    options.forEach(player => {
      const cardHTML = createCardHTML(player);
      const predictionText = getDraftSynergyPrediction(player);
      const cardCol = document.createElement('div');
      cardCol.className = "draft-card-option";
      cardCol.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;max-width:210px;box-sizing:border-box;";
      
      const btnSign = document.createElement('button');
      btnSign.className = "btn";
      btnSign.innerHTML = t('draft.sign_btn', { cost: 0 });
      btnSign.addEventListener('click', () => {
        currentDraftSelection = player;
        el.swapNewPlayerName.innerText = player.name;
        populateSwapModalOptions(player);
      });

      cardCol.innerHTML = `
        <div>${cardHTML}</div>
        <div class="draft-synergy-helper">${predictionText}</div>
      `;
      cardCol.appendChild(btnSign);
      el.draftOptionsRow.appendChild(cardCol);
    });

    // Add a "Skip Draft" button to let the player skip post-match draft
    const skipCol = document.createElement('div');
    skipCol.className = "draft-card-option";
    skipCol.style.cssText = "display:flex;flex-direction:column;justify-content:center;align-items:center;border:2px dashed rgba(255,255,255,0.15);padding:16px;border-radius:12px;height:350px;flex:1;max-width:210px;box-sizing:border-box;";

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
    el.eventTitle.innerText = event.title;
    el.eventDesc.innerText = event.desc;
    
    el.eventChoicesContainer.innerHTML = "";
    event.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = "event-choice-btn";
      
      const costLabel = choice.cost > 0 ? ` (Costo: $${choice.cost})` : (choice.cost < 0 ? ` (Recibe: +$${Math.abs(choice.cost)})` : "");
      btn.innerHTML = `${choice.text}${costLabel}`;
      
      // Check budget
      if (choice.cost > 0 && window.Game.budget < choice.cost) {
        btn.disabled = true;
      }
      
      btn.addEventListener('click', () => {
        // Apply costs and execute action
        window.Game.budget -= choice.cost;
        choice.action(window.Game);
        
        // Log in purchased upgrades list
        if (choice.cost !== 0) {
          window.Game.purchasedItems.push(`${event.title}: ${choice.text.split(" (")[0].substring(0, 20)}...`);
        }
        
        alert("¡Decisión tomada!");
        
        renderActiveRoster();
        renderSynergiesAndItems();
        updateHUD();
        closeNodeCompleted();
      });
      
      el.eventChoicesContainer.appendChild(btn);
    });
    
    window.showScreen('screen-event');
  }

  // TRAINING SCREEN SETUP
  function setupTrainingScreen() {
    el.trainOptionsList.innerHTML = "";
    
    // Choose 3 random distinct training plans
    const shuffled = [...TrainingPlans].sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);

    choices.forEach(plan => {
      const item = document.createElement('div');
      item.className = "training-card";
      item.setAttribute('data-plan-id', plan.id);
      
      const disabled = window.Game.budget < plan.price ? "opacity: 0.6; pointer-events: none;" : "";

      item.innerHTML = `
        <div style="width:70%;">
          <div style="font-weight:bold; font-size:15px; color:#fff;">${plan.label}</div>
          <div style="font-size:12px; color:#9ca3af; margin-top:3px;">${plan.desc}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:bold; color:var(--accent-color); font-size:14px; margin-bottom:5px;">$${plan.price}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        // Toggle selection
        Array.from(el.trainOptionsList.children).forEach(c => c.classList.remove('selected'));
        item.classList.add('selected');
      });

      el.trainOptionsList.appendChild(item);
    });

    // Populate radio buttons player list
    el.trainPlayerSelect.innerHTML = "";
    
    // Active players
    Object.keys(window.Game.roster).forEach(slot => {
      const p = window.Game.roster[slot];
      if (p) {
        const row = document.createElement('label');
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.fontSize = "12px";
        row.style.cursor = "pointer";
        row.style.padding = "4px 8px";
        row.style.background = "rgba(255,255,255,0.02)";
        row.style.borderRadius = "4px";
        
        row.innerHTML = `
          <input type="radio" name="train-player-radio" value="${p.id}">
          <span>[${slot}] ${p.name} (${p.pos})</span>
        `;
        el.trainPlayerSelect.appendChild(row);
      }
    });

    window.showScreen('screen-train');
  }

  // PRE-FIGHT SCREEN SETUP
  function setupAndShowPreFightScreen() {
    const enemy = window.Game.getEnemyTeam();
    el.preFightSubtitle.innerHTML = t('pre_fight.subtitle', { team: `<strong style="color: #ef4444;">${enemy.name}</strong>` });

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
  }

  // ── START INTERACTIVE DICE BATTLE ────────────────────────────────────────────
  function setupAndStartMatchSimulation() {
    // Collapse roster panel (keep visible in 3-column layout)
    // el.rosterManagerPanel.classList.add('hidden');

    const enemy = window.Game.getEnemyTeam();
    el.matchHeaderTitle.innerHTML =
      `<i class="fa-solid fa-dice"></i> 🎲 Combate Interactivo vs <span style="color:#ef4444;">${enemy.name}</span>`;
    if (el.scoreEnemyName) el.scoreEnemyName.innerText = 'ROTACIÓN RIVAL';

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
    activeBattle = new window.InteractiveBattle(teamLineups.away, teamLineups.home, avgDef);
    isRolling = false;

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
          <span style="font-size:11px;color:#9ca3af;">🛡️ ESCUDO (DEF avg ${avgDef})</span>
          <span id="team-shield-text" style="font-size:11px;font-weight:bold;color:#3b82f6;">${avgDef}/${avgDef}</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
          <div id="team-shield-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa);transition:width .3s;"></div>
        </div>
        <div style="font-size:11px;color:#f59e0b;text-align:center;" id="so-chain-display">🔥 Racha de Ponches: 0</div>
      </div>
      <!-- Dice result display -->
      <div id="dice-result-display" style="
        font-family:'Press Start 2P',monospace;
        font-size:36px;color:#fff;
        background:rgba(255,255,255,0.06);
        border:2px solid rgba(255,255,255,0.15);
        border-radius:12px;
        width:80px;height:80px;
        display:flex;align-items:center;justify-content:center;
        letter-spacing:2px;
      ">–</div>
      <!-- Lucky zones panel -->
      <div id="zones-panel" style="width:100%;background:rgba(0,0,0,0.3);border-radius:8px;padding:8px;font-size:10px;">
        <div style="color:#64748b;text-align:center;margin-bottom:4px;">🎯 Zonas de la suerte</div>
        <div id="zones-lines" style="display:flex;flex-direction:column;gap:2px;"></div>
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
      ">🎲 LANZAR DADO</button>
    `;

    const diceSlot = el.screenMatch.querySelector('#dice-container-slot');
    if (diceSlot) {
      diceSlot.appendChild(dicePanel);
    } else {
      el.screenMatch.appendChild(dicePanel);
    }

    // Initial render
    const initState = activeBattle.getState();
    updateMatchHUD(initState);
    updateFaceoffPanel(initState);
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

    const cleanDetails = details ? details.replace(/🎲 \[\d+\] \[[^\]]+\] /, '').replace(/−/g, '-') : '';

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
    let ticks = 0;
    const totalTicks = 12;
    const finalRoll = Math.floor(Math.random() * 100) + 1;

    // Animate numbers
    diceAnimInterval = setInterval(() => {
      ticks++;
      if (diceDisplay) {
        diceDisplay.innerText = Math.floor(Math.random() * 100) + 1;
      }
      if (ticks >= totalTicks) {
        clearInterval(diceAnimInterval);
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
      }
    }, 55);
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
        ? `${flames} RACHA PONCHES: ${chain} (${['1.0x','1.5x','2.0x','3.0x'][Math.min(chain - 1, 3)]} dmg DIRECTO)`
        : '🔥 Racha de Ponches: 0';
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
        debuffBadge.innerText = `⚡ +${mult}% DAÑO RECIBIDO (${state.pitcherDebuff.turnsLeft} ${impLbl})`;
        debuffBadge.classList.remove('hidden');
      } else {
        debuffBadge.classList.add('hidden');
      }
    }
  }

  // ── RENDER ZONE LEGEND ────────────────────────────────────────────────────────
  function renderZones() {
    const zonesEl = document.getElementById('zones-lines');
    if (!zonesEl || !activeBattle || activeBattle.battleOver) return;
    const b = activeBattle.currentBoundaries();
    if (!b) return;
    zonesEl.innerHTML = [
      `<div style="display:flex;justify-content:space-between;padding:1px 0;white-space:nowrap;"><span style="color:#3b82f6;">⚾ ${t('match.bb')}</span><span style="color:#3b82f6;font-weight:bold;">  1 – ${b.bbEnd}</span></div>`,
      `<div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="color:#ef4444;">💨 ${t('match.so')}</span><span style="color:#ef4444;font-weight:bold;">${b.bbEnd + 1} – ${b.soEnd}</span></div>`,
      `<div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="color:#9ca3af;">🤚 ${t('match.out')}</span><span style="color:#9ca3af;font-weight:bold;">${b.soEnd + 1} – ${b.outEnd}</span></div>`,
      `<div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="color:#a7f3d0;">✅ ${t('match.single')}</span><span style="color:#a7f3d0;font-weight:bold;">${b.outEnd + 1} – ${b.singleEnd}</span></div>`,
      `<div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="color:#10b981;">✅ ${t('match.double')}</span><span style="color:#10b981;font-weight:bold;">${b.singleEnd + 1} – ${b.doubleEnd}</span></div>`,
      `<div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="color:#06b6d4;">✅ ${t('match.triple')}</span><span style="color:#06b6d4;font-weight:bold;">${b.doubleEnd + 1} – ${b.tripleEnd}</span></div>`,
      `<div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="color:#eab308;font-weight:bold;">🔥 ${t('match.hr')}</span><span style="color:#eab308;font-weight:bold;">${b.tripleEnd + 1} – 100</span></div>`
    ].join('');
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
  function updateFaceoffPanel(stateOrEvent) {
    if (!stateOrEvent) return;
    const pitcher = stateOrEvent.activePitcher;
    const batter  = stateOrEvent.currentBatter || null;
    const bName   = batter ? batter.name : (stateOrEvent.activeBatter || '');

    el.matchBatterName.innerText  = bName || 'Cargando...';
    el.matchPitcherName.innerText = pitcher ? pitcher.name : 'Cargando...';

    // Batter card
    const bRosterObj = Object.values(window.Game.roster).find(p => p && p.name === bName);
    if (bRosterObj) {
      const eff = window.Game.getEffectiveStats(bRosterObj, bRosterObj.pos);
      const statsBox = document.getElementById('match-batter-stats-box');
      if (statsBox) {
        statsBox.innerHTML = `CON: ${eff.con} | PWR: ${eff.pwr}<br>SPD: ${eff.spd} | DEF: ${eff.def}<br>POS NATIVA: ${eff.pos}`;
      }
      el.arenaBatterCardSlot.innerHTML = createCardHTML(eff, bRosterObj.pos);
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
        rarity: pitchRarity
      };
      el.arenaPitcherCardSlot.innerHTML = createCardHTML(tempPitcher, tempPitcher.pos);

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
        awayLineup: activeBattle.awayTeam.lineup,
        enemyPitchers: activeBattle.homeTeam.pitchers
      };
      activeBattle = null;
      const res = window.Game.postMatchDebrief(fakeResult);
      if (res.won) {
        setupPostMatchDraftScreen(res.isBossStage, res.earnings);
      } else {
        triggerGameOver(false, res.message);
      }
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
      outcomeLine.innerHTML = `¡VICTORIA CONTUNDENTE! Has derrotado a la rotación completa de lanzadores.`;
    } else {
      outcomeLine.innerHTML = `DERROTA. Tu alineación ha sido noqueada por los lanzadores rivales.`;
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
      // Restore Roster Manager panel
      // el.rosterManagerPanel.classList.remove('hidden');

      const res = window.Game.postMatchDebrief(activeSimulationResult);
      
      // Clear simulations refs
      activeSimulation = null;
      activeSimulationResult = null;
      simulationEvents = [];

      if (res.won) {
        setupPostMatchDraftScreen(res.isBossStage, res.earnings);
      } else {
        // Game Over!
        triggerGameOver(false, res.message);
      }
    });

    el.screenMatch.appendChild(proceedBtn);
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
        row.innerHTML = `
          <span>Etapa ${h.stage + 1}: vs ${h.enemyName}</span>
          <strong>${h.won ? 'VICTORIA' : 'DERROTA'} (${h.ourScore}-${h.enemyScore})</strong>
        `;
        el.gameoverHistoryLog.appendChild(row);
      });
    }

    window.showScreen('screen-gameover');
  }

  // Self execute
  window.onload = init;
})();