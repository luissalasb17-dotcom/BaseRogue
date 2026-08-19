// basedex.js
(function() {
  const ERA_TABS = [
    { key: 'all', get label() { return (typeof window.t === 'function' ? window.t('dex.era_all') : 'TODOS'); } },
    { key: 'The Genesis Era (1871-1900)', label: 'GENESIS' },
    { key: 'Deadball (1901-1919)', label: 'DEADBALL' },
    { key: 'Golden Era (1920-1941)', label: 'GOLDEN' },
    { key: 'Integration (1942-1960)', label: 'INTEGRATION' },
    { key: 'Expansion (1961-1976)', label: 'EXPANSION' },
    { key: 'Big Hair Era (1977-1993)', label: 'BIG HAIR' },
    { key: 'Steroid Era (1994-2005)', label: 'STEROID' },
    { key: 'Efficiency Era (2006-2015)', label: 'EFFICIENCY' },
    { key: 'Modern Era (2016-Pres)', label: 'MODERN' },
  ];

  const BATTER_POS_TABS = [
    { key: 'all', label: 'TODOS' },
    { key: 'C', label: 'C' },
    { key: '1B', label: '1B' },
    { key: '2B', label: '2B' },
    { key: '3B', label: '3B' },
    { key: 'SS', label: 'SS' },
    { key: 'LF', label: 'LF' },
    { key: 'CF', label: 'CF' },
    { key: 'RF', label: 'RF' },
    { key: 'DH', label: 'DH' }
  ];

  const PITCHER_POS_TABS = [
    { key: 'all', label: 'TODOS' },
    { key: 'SP', label: 'SP' },
    { key: 'RP', label: 'RP' }
  ];

  const POS_SYNONYMS = {
    'c': 'C', 'catcher': 'C', 'receptor': 'C', 'cat': 'C',
    '1b': '1B', 'first base': '1B', 'primera base': '1B', 'primera': '1B',
    '2b': '2B', 'second base': '2B', 'segunda base': '2B', 'segunda': '2B',
    '3b': '3B', 'third base': '3B', 'tercera base': '3B', 'tercera': '3B',
    'ss': 'SS', 'shortstop': 'SS', 'campo corto': 'SS', 'campocorto': 'SS',
    'lf': 'LF', 'left field': 'LF', 'left fielder': 'LF', 'jardinero izquierdo': 'LF', 'izquierdo': 'LF',
    'cf': 'CF', 'center field': 'CF', 'center fielder': 'CF', 'jardinero central': 'CF', 'central': 'CF',
    'rf': 'RF', 'right field': 'RF', 'right fielder': 'RF', 'jardinero derecho': 'RF', 'derecho': 'RF',
    'dh': 'DH', 'designated hitter': 'DH', 'bateador designado': 'DH', 'designado': 'DH',
    'sp': 'SP', 'starter': 'SP', 'starting pitcher': 'SP', 'abridor': 'SP', 'pitcher abridor': 'SP',
    'rp': 'RP', 'reliever': 'RP', 'relief pitcher': 'RP', 'relevista': 'RP', 'closer': 'RP', 'cerrador': 'RP'
  };

  const RARITY_COLORS = {
    Legendary: '#ffd700',
    Epic: '#a855f7',
    Rare: '#3b82f6',
    Uncommon: '#10b981',
    Common: '#6b7280'
  };

  const GRADE_COLORS = {
    'S': '#ffd700',
    'A': '#22d3ee',
    'B': '#4ade80',
    'C': '#94a3b8',
    'D': '#f97316',
    'F': '#ef4444'
  };

  // Matches ui.js's getStatGrade() +/- bands so BaseballDex doesn't flatten
  // every mid-range value into one bare letter (was showing "C" for a wide
  // 40-59 span with no C+/C- distinction, unlike the rest of the game's cards).
  function getGrade(val) {
    let letter = 'F', modifier = '';
    if (val >= 100) {
      letter = 'S';
    } else if (val >= 80) {
      letter = 'A';
      if (val >= 95) modifier = '+'; else if (val < 85) modifier = '-';
    } else if (val >= 60) {
      letter = 'B';
      if (val >= 75) modifier = '+'; else if (val < 65) modifier = '-';
    } else if (val >= 40) {
      letter = 'C';
      if (val >= 55) modifier = '+'; else if (val < 45) modifier = '-';
    } else if (val >= 20) {
      letter = 'D';
      if (val >= 35) modifier = '+'; else if (val < 25) modifier = '-';
    }
    return letter + modifier;
  }

  function getGradeColor(val) {
    const letter = getGrade(val).charAt(0);
    return GRADE_COLORS[letter] || GRADE_COLORS.F;
  }

  function getPosText(p) {
    if (!p) return '';
    if (p.sec_pos && String(p.sec_pos).trim() !== '') {
      return `${p.pos} / ${p.sec_pos}`;
    }
    return p.pos || '';
  }

  function getPlayerCareerData(p) {
    if (!p) return { war: '-', mvp: 0, roy: 0, ss: 0, gg: 0, cy: 0, rel: 0, allstars: 0, hof: false };
    const cleanName = p.name ? p.name.replace(/\s\(.*?\)$/, '').trim() : '';
    const keyWithYear = `${cleanName}_${p.year}`;
    const db = window.CAREER_STATS_DB || {};
    const entry = (p.playerID && db[p.playerID]) || db[keyWithYear] || db[cleanName] || db[p.name];

    if (entry) {
      return {
        war: (entry.war !== null && entry.war !== undefined) ? entry.war : (p.ovr ? (p.ovr / 10).toFixed(1) : '-'),
        mvp: entry.mvp !== undefined ? entry.mvp : (p.mvp || 0),
        roy: entry.roy !== undefined ? entry.roy : (p.roy || 0),
        ss: entry.ss !== undefined ? entry.ss : (p.silver_sluggers || p.ss || 0),
        gg: entry.gg !== undefined ? entry.gg : (p.gold_gloves || p.gg || 0),
        cy: entry.cy !== undefined ? entry.cy : (p.cy_youngs || p.cy || 0),
        rel: entry.rel !== undefined ? entry.rel : (p.reliever_awards || p.rel || 0),
        allstars: entry.allstars !== undefined ? entry.allstars : (p.allstars || 0),
        hof: entry.hof !== undefined ? entry.hof : (p.hof || false)
      };
    }

    return {
      war: p.ovr ? (p.ovr / 10).toFixed(1) : '-',
      mvp: p.mvp || 0,
      roy: p.roy || 0,
      ss: p.silver_sluggers || p.ss || 0,
      gg: p.gold_gloves || p.gg || 0,
      cy: p.cy_youngs || p.cy || 0,
      rel: p.reliever_awards || p.rel || 0,
      allstars: p.allstars || 0,
      hof: p.hof || false
    };
  }

  window.BaseballDex = {
    STORAGE_KEY: 'baserogue_dex_v1',
    OPPONENTS_STORAGE_KEY: 'baserogue_dex_opponents_v1',
    unlocked: new Set(),
    unlockedOpponents: new Set(),
    activeCategory: 'legends', // 'legends' or 'opponents'
    currentFilterEra: 'all',
    currentFilterPos: 'all',
    currentSearchTerm: '',
    challenge162Only: false,
    filteredPlayers: [],
    renderLimit: 200,
    currentRendered: 0,
    container: null,

    init() {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          this.unlocked = new Set(arr);
        } catch (e) {
          this.unlocked = new Set();
        }
      }
      const storedOpp = localStorage.getItem(this.OPPONENTS_STORAGE_KEY);
      if (storedOpp) {
        try {
          const arrOpp = JSON.parse(storedOpp);
          this.unlockedOpponents = new Set(arrOpp);
        } catch (e) {
          this.unlockedOpponents = new Set();
        }
      }
    },

    save() {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.unlocked)));
      localStorage.setItem(this.OPPONENTS_STORAGE_KEY, JSON.stringify(Array.from(this.unlockedOpponents)));
      this.updateCounters();
    },

    _getPlayerKeys(player) {
      if (!player) return [];
      const keys = [];
      const rawName = (player.cleanName || player.name || '').replace(/\s*\(\d{4}\)/g, '').replace(/\s*\(.*?\)/g, '').trim();
      const year = player.year || player.peak_year || '';
      if (rawName && year) {
        keys.push(`${rawName}_${year}`);
      }
      if (player.name && player.year) {
        keys.push(`${player.name}_${player.year}`);
      }
      if (player.playerID) {
        keys.push(`id_${player.playerID}`);
      }
      return keys;
    },

    _getOpponentKeys(pitcher) {
      if (!pitcher) return [];
      const keys = [];
      const clean = (pitcher.cleanName || pitcher.name || '').replace(/\s*\(\d{4}\)/g, '').replace(/\s*\(.*?\)/g, '').trim();
      const name = (pitcher.name || '').trim();
      const year = pitcher.year || pitcher.peak_year_display || pitcher.peak_year || '';
      const role = (pitcher.role || pitcher.pos || 'SP').toUpperCase();

      if (clean && year && role) keys.push(`${clean}_${year}_${role}`);
      if (clean && year) keys.push(`${clean}_${year}`);
      if (name && year && role) keys.push(`${name}_${year}_${role}`);
      if (name && year) keys.push(`${name}_${year}`);
      if (pitcher.playerID) keys.push(`id_${pitcher.playerID}`);
      return keys;
    },

    unlock(player) {
      if (!player || player.isReplacement) return;
      const keys = this._getPlayerKeys(player);
      let changed = false;
      keys.forEach(k => {
        if (!this.unlocked.has(k)) {
          this.unlocked.add(k);
          changed = true;
        }
      });
      if (changed) this.save();
    },

    unlockRoster(roster) {
      if (!roster) return;
      const players = Array.isArray(roster) ? roster : Object.values(roster);
      let changed = false;
      players.forEach(p => {
        if (p && !p.isReplacement) {
          const keys = this._getPlayerKeys(p);
          keys.forEach(k => {
            if (!this.unlocked.has(k)) {
              this.unlocked.add(k);
              changed = true;
            }
          });
        }
      });
      if (changed) this.save();
    },

    unlockOpponent(pitcher) {
      if (!pitcher) return;
      const keys = this._getOpponentKeys(pitcher);
      let changed = false;
      keys.forEach(k => {
        if (!this.unlockedOpponents.has(k)) {
          this.unlockedOpponents.add(k);
          changed = true;
        }
      });
      if (changed) {
        this.save();
        console.log('⚾ BaseballDex: Oponente desbloqueado ->', keys[0]);
      }
    },

    unlockAll() {
      const pool = window.PlayersDB ? window.PlayersDB.LAHMAN_POOL : [];
      this.unlocked = new Set();
      pool.forEach(p => {
        const keys = this._getPlayerKeys(p);
        keys.forEach(k => this.unlocked.add(k));
      });
      
      const pPool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : (window.PITCHERS_POOL || []);
      this.unlockedOpponents = new Set();
      pPool.forEach(p => {
        const keys = this._getOpponentKeys(p);
        keys.forEach(k => this.unlockedOpponents.add(k));
      });

      this.save();
      if (this.container) this.renderPanel();
      console.log(`⚾ BaseballDex: ¡Todas las cartas han sido desbloqueadas!`);
      return `¡Desbloqueadas todas las cartas!`;
    },

    lockAll() {
      this.unlocked.clear();
      this.unlockedOpponents.clear();
      this.save();
      if (this.container) this.renderPanel();
      console.log('⚾ BaseballDex: Todas las cartas han sido bloqueadas.');
      return 'Todas las cartas bloqueadas.';
    },

    isUnlocked(player) {
      if (!player) return false;
      if (this.activeCategory === 'opponents') {
        const keys = this._getOpponentKeys(player);
        return keys.some(k => this.unlockedOpponents.has(k));
      }
      const keys = this._getPlayerKeys(player);
      return keys.some(k => this.unlocked.has(k));
    },

    getStats() {
      let pool = [];
      if (this.activeCategory === 'opponents') {
        pool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : [];
        let validCount = 0;
        for (let i = 0; i < pool.length; i++) {
          if (this.isUnlocked(pool[i])) validCount++;
        }
        return { total: pool.length, unlocked: validCount };
      }
      pool = window.PlayersDB ? window.PlayersDB.LAHMAN_POOL : [];
      let validCount = 0;
      for (let i = 0; i < pool.length; i++) {
        if (this.isUnlocked(pool[i])) validCount++;
      }
      return { total: pool.length, unlocked: validCount };
    },

    open() {
      this.renderPanel();
    },

    close() {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
    },

    updateCounters() {
      const elText = document.getElementById('dex-counter');
      const elFill = document.getElementById('dex-progress-fill');
      const stats = this.getStats();
      const pct = stats.total > 0 ? ((stats.unlocked / stats.total) * 100).toFixed(1) : 0;
      
      if (elText) {
        const catLabel = this.activeCategory === 'opponents' ? 'Oponentes Enfrentados' : 'Cartas Descubiertas';
        elText.innerText = `${stats.unlocked} / ${stats.total} (${catLabel})`;
      }
      if (elFill) {
        elFill.style.width = `${pct}%`;
      }
    },

    applyFilters() {
      let pool = [];
      if (this.activeCategory === 'opponents') {
        pool = (window.PitchersDB && window.PitchersDB.PITCHERS_POOL) ? window.PitchersDB.PITCHERS_POOL : [];
      } else {
        pool = window.PlayersDB ? window.PlayersDB.LAHMAN_POOL : [];
      }

      const rawTerm = this.currentSearchTerm.toLowerCase().trim();
      let term = rawTerm;
      let explicitPos = null;

      // Check for explicit "pos:C" or "pos:1B"
      const posMatch = term.match(/^pos:([a-z0-9]+)\s*(.*)$/i);
      if (posMatch) {
        explicitPos = posMatch[1].toUpperCase();
        term = posMatch[2].trim();
      }

      const activePosFilter = explicitPos || (this.currentFilterPos !== 'all' ? this.currentFilterPos : null);

      this.filteredPlayers = pool.filter(p => {
        if (this.currentFilterEra !== 'all' && p.era !== this.currentFilterEra) return false;
        if (this.challenge162Only && !(window.Challenge162 && window.Challenge162.isUnlocked(p))) return false;

        const pPos = (p.pos || p.role || '').toUpperCase();
        const secPosArr = (p.sec_pos || '').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);

        // Position pill / explicit position filter
        if (activePosFilter) {
          const target = activePosFilter.toUpperCase();
          const matchPos = pPos === target || secPosArr.includes(target);
          if (!matchPos) return false;
        }

        if (term) {
          const synPos = POS_SYNONYMS[term];
          const nameLower = (p.name || '').toLowerCase();
          const teamLower = (p.team || '').toLowerCase();
          const pPosLower = (p.pos || p.role || '').toLowerCase();
          const secPosLower = (p.sec_pos || '').toLowerCase();

          // 1. If user typed a recognized position alias (e.g. "c", "catcher", "1b", "ss", "sp", "rp")
          if (synPos) {
            const isPosMatch = pPos === synPos || secPosArr.includes(synPos);
            // Also allow matching names starting with this term (e.g. "Cain" when typing "c")
            const nameWords = nameLower.split(/\s+/);
            const isNamePrefix = nameWords.some(w => w.startsWith(term));
            const isTeamMatch = teamLower === term;
            if (!isPosMatch && !isNamePrefix && !isTeamMatch) return false;
            return true;
          }

          // 2. Short search term (1-2 characters): match exact pos, exact team, or start of words in name
          if (term.length <= 2) {
            const isExactPos = pPosLower === term || secPosLower.split(',').map(s => s.trim()).includes(term);
            const nameWords = nameLower.split(/\s+/);
            const isNamePrefix = nameWords.some(w => w.startsWith(term));
            const isTeamMatch = teamLower === term || teamLower.startsWith(term);
            if (!isExactPos && !isNamePrefix && !isTeamMatch) return false;
            return true;
          }

          // 3. Multi-character search term (3+ chars): substring match on name, team, position
          const nMatch = nameLower.includes(term);
          const tMatch = teamLower.includes(term);
          const pMatch = pPosLower.includes(term) || secPosLower.includes(term);
          if (!nMatch && !tMatch && !pMatch) return false;
        }
        return true;
      });

      // Sort: unlocked first, then by OVR desc
      this.filteredPlayers.sort((a, b) => {
        const uA = this.isUnlocked(a) ? 1 : 0;
        const uB = this.isUnlocked(b) ? 1 : 0;
        if (uA !== uB) return uB - uA;
        return (b.ovr || 0) - (a.ovr || 0);
      });

      this.currentRendered = 0;
      const grid = document.getElementById('dex-grid');
      if (grid) {
        grid.innerHTML = '';
        this.renderMore();
      }
    },

    renderMore() {
      const grid = document.getElementById('dex-grid');
      if (!grid) return;

      const toRender = this.filteredPlayers.slice(this.currentRendered, this.currentRendered + this.renderLimit);
      
      toRender.forEach(p => {
        const isUnl = this.isUnlocked(p);
        const el = document.createElement('div');
        if (isUnl) {
          const rColor = RARITY_COLORS[p.rarity] || RARITY_COLORS.Common;
          const isChallengeEligible = !!(window.Challenge162 && window.Challenge162.isUnlocked(p));
          el.className = 'dex-card unlocked';
          el.style.cssText = `position: relative; background: #0d1f12; border: 2px solid ${rColor}; border-radius: 8px; padding: 10px 6px; text-align: center; cursor: pointer; transition: transform 0.15s; display: flex; flex-direction: column; justify-content: space-between;`;

          const posLabel = p.role || p.pos || 'P';
          const subLabel = p.team || '';

          const challenge162Tooltip = (typeof window.t === 'function' ? window.t('dex.challenge162_badge_tooltip') : 'Elegible para el 162-0 Challenge');
          el.innerHTML = `
            ${isChallengeEligible ? `<span title="${challenge162Tooltip}" style="position:absolute;top:4px;right:4px;font-size:11px;filter:drop-shadow(0 0 3px rgba(255,215,0,0.8));">🏆</span>` : ''}
            <div>
              <div style="font-size:7px;color:#00ff66;font-family:'Press Start 2P',monospace;margin-bottom:4px">${posLabel}</div>
              <div style="font-size:7px;color:#e5e7eb;font-family:'Press Start 2P',monospace;line-height:1.3;word-break:break-word">${p.name}</div>
              <div style="font-size:6px;color:#9ca3af;margin-top:3px">${subLabel} '${p.year}</div>
            </div>
            <div>
              <div style="font-size:8px;font-weight:bold;color:${rColor};margin-top:4px">OVR ${p.ovr}</div>
              <div style="font-size:5px;background:${rColor}22;color:${rColor};padding:1px 4px;border-radius:3px;margin-top:3px;display:inline-block">${p.rarity || 'Common'}</div>
            </div>
          `;
          el.onclick = () => this.showDetail(p);
          el.onmouseenter = () => el.style.transform = 'scale(1.05)';
          el.onmouseleave = () => el.style.transform = 'scale(1)';
        } else {
          el.className = 'dex-card locked';
          el.style.cssText = 'background: #111827; border: 2px solid #1f2937; border-radius: 8px; padding: 10px 6px; text-align: center; cursor: default';
          el.innerHTML = `
            <div style="width:50px;height:50px;background:#1f2937;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center">
              <i class="fa-solid fa-user" style="color:#374151;font-size:20px"></i>
            </div>
            <div style="font-size:7px;color:#4b5563;font-family:'Press Start 2P',monospace">???</div>
            <div style="font-size:6px;color:#374151;margin-top:2px">${(typeof window.t === 'function' ? window.t('dex.locked') : 'BLOQUEADO')}</div>
          `;
        }
        grid.appendChild(el);
      });

      this.currentRendered += toRender.length;

      const oldBtn = document.getElementById('dex-load-more');
      if (oldBtn) oldBtn.remove();

      if (this.currentRendered < this.filteredPlayers.length) {
        const btn = document.createElement('button');
        btn.id = 'dex-load-more';
        btn.innerText = (typeof window.t === 'function' ? window.t('dex.load_more') : 'Mostrar más');
        btn.style.cssText = 'grid-column: 1 / -1; padding: 10px; background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px; font-family:"Press Start 2P", monospace; font-size: 8px;';
        btn.onclick = () => this.renderMore();
        grid.appendChild(btn);
      }
    },

    renderPanel() {
      if (this.container) this.close();

      this.container = document.createElement('div');
      this.container.style.cssText = 'position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; padding: 20px;';
      
      const panel = document.createElement('div');
      panel.style.cssText = 'width: 100%; max-width: 900px; max-height: 90vh; height: 100%; background: #0a0f1a; border: 3px solid #00ff66; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; position: relative;';

      // Header
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3)';
      
      const title = document.createElement('h2');
      title.style.cssText = 'font-family: "Press Start 2P", monospace; font-size: 14px; color: #00ff66; margin: 0;';
      title.innerText = '⚾ BASEBALL-DEX';
      
      const counter = document.createElement('div');
      counter.id = 'dex-counter';
      counter.style.cssText = 'font-family: "Press Start 2P", monospace; font-size: 8px; color: #9ca3af;';
      
      // Progress Bar
      const progressOuter = document.createElement('div');
      progressOuter.style.cssText = 'width: 100%; max-width: 280px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; border: 1px solid rgba(0,255,102,0.3); overflow: hidden; margin-top: 4px;';
      
      const progressFill = document.createElement('div');
      progressFill.id = 'dex-progress-fill';
      progressFill.style.cssText = 'height: 100%; background: linear-gradient(90deg, #10b981, #00ff66); width: 0%; transition: width 0.4s ease;';
      progressOuter.appendChild(progressFill);

      const closeBtn = document.createElement('button');
      closeBtn.innerText = '✕';
      closeBtn.style.cssText = 'background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer; padding: 0 8px;';
      closeBtn.onclick = () => this.close();

      const headerLeft = document.createElement('div');
      headerLeft.style.display = 'flex';
      headerLeft.style.flexDirection = 'column';
      headerLeft.style.gap = '4px';
      headerLeft.appendChild(title);
      headerLeft.appendChild(counter);
      headerLeft.appendChild(progressOuter);

      header.appendChild(headerLeft);
      header.appendChild(closeBtn);
      panel.appendChild(header);

      // Top Category Bar: [ LEYENDAS / JUGADORES ] vs [ OPONENTES (PARTIDA RÁPIDA) ]
      const categoryBar = document.createElement('div');
      categoryBar.style.cssText = 'display: flex; gap: 8px; justify-content: center; padding: 10px 16px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1);';
      
      const btnLeg = document.createElement('button');
      btnLeg.innerText = typeof window.t === 'function' ? window.t('dex.tab_legends') : '⚾ LEYENDAS / BATEADORES';
      const isLegActive = this.activeCategory === 'legends';
      btnLeg.style.cssText = `padding: 6px 14px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 9px; font-weight: bold; cursor: pointer; transition: all 0.2s; border: 1px solid #10b981; ${isLegActive ? 'background: #10b981; color: #000;' : 'background: rgba(16,185,129,0.1); color: #10b981;'}`;

      const btnOpp = document.createElement('button');
      btnOpp.innerText = typeof window.t === 'function' ? window.t('dex.tab_opponents') : '🥊 OPONENTES (PARTIDA RÁPIDA)';
      const isOppActive = this.activeCategory === 'opponents';
      btnOpp.style.cssText = `padding: 6px 14px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 9px; font-weight: bold; cursor: pointer; transition: all 0.2s; border: 1px solid #38bdf8; ${isOppActive ? 'background: #38bdf8; color: #000;' : 'background: rgba(56,189,248,0.1); color: #38bdf8;'}`;

      btnLeg.onclick = () => {
        this.activeCategory = 'legends';
        this.currentFilterPos = 'all';
        this.renderPanel();
      };
      btnOpp.onclick = () => {
        this.activeCategory = 'opponents';
        this.currentFilterPos = 'all';
        this.renderPanel();
      };

      categoryBar.appendChild(btnLeg);
      categoryBar.appendChild(btnOpp);
      panel.appendChild(categoryBar);

      // Search bar
      const searchContainer = document.createElement('div');
      searchContainer.style.cssText = 'padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.value = this.currentSearchTerm;
      searchInput.placeholder = this.activeCategory === 'opponents' ? (typeof window.t === 'function' ? window.t('dex.search_placeholder_pitchers') : 'Buscar lanzador por nombre, equipo, era o rol (SP/RP)...') : (typeof window.t === 'function' ? window.t('dex.search_placeholder') : 'Buscar por nombre, equipo o posición (C, 1B, SS...)...');
      searchInput.style.cssText = 'width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;';
      searchInput.oninput = (e) => {
        this.currentSearchTerm = e.target.value;
        this.applyFilters();
      };
      searchContainer.appendChild(searchInput);

      const challenge162Toggle = document.createElement('label');
      challenge162Toggle.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:8px;font-size:10px;color:#ffd700;cursor:pointer;';
      const challenge162FilterLabel = (typeof window.t === 'function' ? window.t('dex.challenge162_filter') : '🏆 Solo elegibles para el 162-0 Challenge');
      challenge162Toggle.innerHTML = `<input type="checkbox" ${this.challenge162Only ? 'checked' : ''} style="accent-color:#ffd700;cursor:pointer;"> ${challenge162FilterLabel}`;
      challenge162Toggle.querySelector('input').onchange = (e) => {
        this.challenge162Only = e.target.checked;
        this.applyFilters();
      };
      searchContainer.appendChild(challenge162Toggle);
      panel.appendChild(searchContainer);

      // Position / Role Filter Tabs (Dedicated Row)
      const posTabsContainer = document.createElement('div');
      posTabsContainer.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; align-items: center; padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.25);';

      const posLabel = document.createElement('span');
      posLabel.innerText = this.activeCategory === 'opponents' ? (typeof window.t === 'function' ? window.t('dex.role_label') : 'ROL:') : (typeof window.t === 'function' ? window.t('dex.pos_label') : 'POS:');
      posLabel.style.cssText = 'font-family:"Press Start 2P", monospace; font-size: 8px; color: #9ca3af; margin-right: 4px;';
      posTabsContainer.appendChild(posLabel);

      const posTabs = this.activeCategory === 'opponents' ? PITCHER_POS_TABS : BATTER_POS_TABS;
      const accentColor = this.activeCategory === 'opponents' ? '#38bdf8' : '#10b981';

      posTabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.innerText = (tab.key === 'all' && typeof window.t === 'function') ? window.t('dex.pos_all') : tab.label;
        const isActive = this.currentFilterPos === tab.key;
        btn.style.cssText = `
          padding: 3px 8px; border-radius: 6px; font-family:"Press Start 2P", monospace; font-size: 8px; font-weight: bold; white-space: nowrap; border: 1px solid ${accentColor}44; cursor: pointer; transition: all 0.15s;
          ${isActive ? `background: ${accentColor}; color: #000; font-weight: bold;` : `background: rgba(255,255,255,0.05); color: #e4e4e7;`}
        `;
        btn.onclick = () => {
          this.currentFilterPos = tab.key;
          Array.from(posTabsContainer.querySelectorAll('button')).forEach(c => {
            c.style.background = 'rgba(255,255,255,0.05)';
            c.style.color = '#e4e4e7';
          });
          btn.style.background = accentColor;
          btn.style.color = '#000';
          this.applyFilters();
        };
        posTabsContainer.appendChild(btn);
      });
      panel.appendChild(posTabsContainer);

      // Era Tabs (Compact & Responsive Wrap)
      const tabsContainer = document.createElement('div');
      tabsContainer.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.15);';
      
      ERA_TABS.forEach(tab => {
        const btn = document.createElement('button');
        btn.innerText = tab.label;
        const isActive = this.currentFilterEra === tab.key;
        btn.style.cssText = `
          padding: 4px 8px; border-radius: 12px; font-size: 8.5px; font-weight: bold; white-space: nowrap; border: none; cursor: pointer; transition: all 0.2s;
          ${isActive ? 'background: #00ff66; color: #000;' : 'background: rgba(255,255,255,0.1); color: #fff;'}
        `;
        btn.onclick = () => {
          this.currentFilterEra = tab.key;
          Array.from(tabsContainer.children).forEach(c => {
            c.style.background = 'rgba(255,255,255,0.1)';
            c.style.color = '#fff';
          });
          btn.style.background = '#00ff66';
          btn.style.color = '#000';
          this.applyFilters();
        };
        tabsContainer.appendChild(btn);
      });
      panel.appendChild(tabsContainer);

      // Grid
      const grid = document.createElement('div');
      grid.id = 'dex-grid';
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; overflow-y: auto; padding: 16px; flex: 1; align-content: start;';
      panel.appendChild(grid);

      this.container.appendChild(panel);
      document.body.appendChild(this.container);
      
      this.updateCounters();
      this.applyFilters();
    },

    showDetail(p) {
      const existing = document.getElementById('dex-detail-overlay');
      if (existing) existing.remove();

      const rColor = RARITY_COLORS[p.rarity] || RARITY_COLORS.Common;
      const eraTab = ERA_TABS.find(t => t.key === p.era);
      const eraShort = eraTab ? eraTab.label : p.era;
      
      let teamFull = p.team;
      if (p.team === 'HIST') {
        teamFull = typeof window.t === 'function' ? window.t('dex.franchise_hist') : 'Franquicia Histórica';
      } else if (p.team === 'NLB') {
        teamFull = typeof window.t === 'function' ? window.t('dex.franchise_nlb') : 'Ligas Negras';
      } else if (window.PlayersDB && window.PlayersDB.FranchiseNames) {
        teamFull = window.PlayersDB.FranchiseNames[p.team] || p.team;
      }

      const overlay = document.createElement('div');
      overlay.id = 'dex-detail-overlay';
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.85);z-index:10;display:flex;align-items:center;justify-content:center;padding:20px';

      const renderStat = (lbl, val) => {
        if (typeof val !== 'number') {
          return `
            <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:9px;color:#9ca3af">${lbl}</span>
              <span style="font-size:11px;font-weight:bold;color:#38bdf8">${val}</span>
            </div>
          `;
        }
        return `
          <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:9px;color:#9ca3af">${lbl}</span>
            <span style="font-size:11px;font-weight:bold;color:${getGradeColor(val)}">${val} <small style="font-size:8px">${getGrade(val)}</small></span>
          </div>
        `;
      };

      const isPitcher = (this.activeCategory === 'opponents') || p.h9 !== undefined || p.stf !== undefined || p.grt !== undefined || p.pos === 'P' || p.pos === 'SP' || p.pos === 'RP';

      let statsHTML = '';
      if (isPitcher) {
        const h9  = p.h9 !== undefined ? p.h9 : (p.grt !== undefined ? p.grt : 50);
        const k9  = p.k9 !== undefined ? p.k9 : (p.stf !== undefined ? p.stf : (p.str !== undefined ? p.str : 50));
        const bb9 = p.bb9 !== undefined ? p.bb9 : (p.ctl !== undefined ? p.ctl : 50);
        const hr9 = p.hr9 !== undefined ? p.hr9 : (p.mov !== undefined ? p.mov : 50);
        const sta = p.sta !== undefined ? p.sta : 65;

        statsHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
            ${renderStat('H/9 (Granito)', h9)}
            ${renderStat('K/9 (Stuff)', k9)}
            ${renderStat('BB/9 (Control)', bb9)}
            ${renderStat('HR/9 (Movement)', hr9)}
            ${renderStat('STA (Stamina)', sta)}
            ${renderStat('ROL', p.role || p.pos || 'P')}
          </div>
        `;
      } else {
        const kavd = p.k_avd !== undefined ? p.k_avd : (p.k_avoid !== undefined ? p.k_avoid : (p.k_avoid_val !== undefined ? p.k_avoid_val : (p.con || 40)));
        statsHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
            ${renderStat('CON', p.con || 40)}
            ${renderStat('PWR', p.pwr || 40)}
            ${renderStat('EYE', p.eye || 40)}
            ${renderStat('K/AVD', kavd)}
            ${renderStat('SPD', p.spd || 40)}
            ${renderStat('DEF', p.def || 40)}
          </div>
        `;
      }

      const careerStats = getPlayerCareerData(p);
      const isHof = Boolean(p.hof || p.is_hof || (careerStats && careerStats.hof));
      
      let badgesHtml = '';
      if (isHof) badgesHtml += '<span style="background:#ffd70022;color:#ffd700;border:1px solid #ffd700;padding:2px 8px;border-radius:4px;font-size:8px">🏆 HOF</span>';
      if (p.clutch || p.is_clutch) badgesHtml += '<span style="background:#ef444422;color:#ef4444;border:1px solid #ef4444;padding:2px 8px;border-radius:4px;font-size:8px">⚡ CLUTCH</span>';
      if (p.captain || p.is_captain) badgesHtml += '<span style="background:#3b82f622;color:#3b82f6;border:1px solid #3b82f6;padding:2px 8px;border-radius:4px;font-size:8px">👑 CAPTAIN</span>';
      if (window.Challenge162 && window.Challenge162.isUnlocked(p)) {
        const challenge162BadgeLabel = (typeof window.t === 'function' ? window.t('dex.challenge162_badge_label') : '🏆 162-0 CHALLENGE');
        badgesHtml += `<span style="background:#ffd70022;color:#ffd700;border:1px solid #ffd700;padding:2px 8px;border-radius:4px;font-size:8px">${challenge162BadgeLabel}</span>`;
      }

      overlay.innerHTML = `
        <div style="background:#0a0f1a;border:3px solid ${rColor};border-radius:12px;width:100%;max-width:440px;padding:24px;position:relative">
          <button onclick="document.getElementById('dex-detail-overlay').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button>
          
          <div style="margin-bottom:16px">
            <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:${rColor};margin-bottom:4px">${p.rarity || 'Common'} · ${eraShort}</div>
            <h2 style="font-family:'Press Start 2P',monospace;font-size:13px;color:#fff;margin:0 0 4px 0;line-height:1.4">${p.name}</h2>
            <div style="font-size:12px;color:#9ca3af">${teamFull} — ${p.year} · ${p.role || getPosText(p)}</div>
          </div>
          
          <div style="text-align:center;margin-bottom:16px">
            <div style="font-family:'Press Start 2P',monospace;font-size:32px;color:${rColor};text-shadow:0 0 20px ${rColor}88">${p.ovr}</div>
            <div style="font-size:10px;color:#6b7280">OVR</div>
          </div>
          
          ${statsHTML}
          
          ${badgesHtml ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${badgesHtml}</div>` : ''}
          
          <div style="background:#111827;border-radius:8px;padding:12px">
            <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#38bdf8;margin-bottom:10px;text-align:center">${(typeof window.t === 'function' ? window.t('dex.career_header') : 'CARRERA / CAREER (MLB)')}</div>
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;text-align:center">
              ${isPitcher ? `
                <div><div style="font-size:13px;font-weight:bold;color:#fff">${careerStats.allstars}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="All-Star">${(typeof window.t === 'function' ? window.t('dex.allstars_label') : 'ALL-STARS')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${careerStats.cy}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Cy Young Award">${(typeof window.t === 'function' ? window.t('dex.cy_label') : 'CY YOUNG')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#eab308">${careerStats.mvp}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Most Valuable Player">${(typeof window.t === 'function' ? window.t('dex.mvp_label') : 'MVP')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#f59e0b">${careerStats.rel}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Reliever of the Year / Fireman of the Year">${(typeof window.t === 'function' ? window.t('dex.rel_label') : 'RELEVISTA')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#ffd700">${careerStats.gg}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Gold Glove">${(typeof window.t === 'function' ? window.t('dex.gg_label') : 'GG')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#00ff66">${careerStats.war}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Wins Above Replacement">${(typeof window.t === 'function' ? window.t('dex.war_label') : 'WAR')}</div></div>
              ` : `
                <div><div style="font-size:13px;font-weight:bold;color:#fff">${careerStats.allstars}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="All-Star">${(typeof window.t === 'function' ? window.t('dex.allstars_label') : 'ALL-STARS')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#ffd700">${careerStats.gg}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Gold Glove">${(typeof window.t === 'function' ? window.t('dex.gg_label') : 'GG')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#eab308">${careerStats.mvp}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Most Valuable Player">${(typeof window.t === 'function' ? window.t('dex.mvp_label') : 'MVP')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${careerStats.ss}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Silver Slugger">${(typeof window.t === 'function' ? window.t('dex.ss_label') : 'SS')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#a7f3d0">${careerStats.roy}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Rookie of the Year">${(typeof window.t === 'function' ? window.t('dex.roy_label') : 'ROY')}</div></div>
                <div><div style="font-size:13px;font-weight:bold;color:#00ff66">${careerStats.war}</div><div style="font-size:7px;color:#6b7280;margin-top:2px" title="Wins Above Replacement">${(typeof window.t === 'function' ? window.t('dex.war_label') : 'WAR')}</div></div>
              `}
            </div>
          </div>
        </div>
      `;

      if (this.container) {
        this.container.querySelector('div').appendChild(overlay);
      }
    }
  };
})();
