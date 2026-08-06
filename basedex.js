// basedex.js
(function() {
  const ERA_TABS = [
    { key: 'all', label: 'TODOS' },
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

  // Authentic Career Stats & Awards Database for MLB Legends
  const CAREER_DB = {
    "Harry Stovey": { war: 45.0, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "King Kelly": { war: 45.3, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Dan Brouthers": { war: 78.7, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Cap Anson": { war: 94.3, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Billy Hamilton": { war: 63.2, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Hugh Duffy": { war: 43.2, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Ed Delahanty": { war: 69.6, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Sam Thompson": { war: 44.4, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Jesse Burkett": { war: 59.7, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Fred Dunlap": { war: 35.1, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Jake Beckley": { war: 61.1, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "George Davis": { war: 84.5, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Bid McPhee": { war: 52.5, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Roger Connor": { war: 84.3, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Jim O'Rourke": { war: 52.1, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Shoeless Joe Jackson": { war: 62.2, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Frank Chance": { war: 45.7, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Johnny Evers": { war: 47.7, mvp: 1, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Joe Tinker": { war: 53.2, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Fred Clarke": { war: 67.9, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Bobby Wallace": { war: 62.2, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Chief Meyers": { war: 23.3, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Harry Heilmann": { war: 72.5, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Paul Waner": { war: 72.7, mvp: 1, roy: 0, ss: 0, gg: 0, allstars: 4 },
    "Lloyd Waner": { war: 24.1, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 1 },
    "Pie Traynor": { war: 38.5, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 2 },
    "Kiki Cuyler": { war: 67.1, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 1 },
    "Frank Robinson": { war: 107.2, mvp: 2, roy: 1, ss: 0, gg: 1, allstars: 14 },
    "Barry Bonds": { war: 162.8, mvp: 7, roy: 0, ss: 12, gg: 8, allstars: 14 },
    "Babe Ruth": { war: 182.6, mvp: 1, roy: 0, ss: 0, gg: 0, allstars: 2 },
    "Willie Mays": { war: 156.1, mvp: 2, roy: 1, ss: 0, gg: 12, allstars: 24 },
    "Ted Williams": { war: 122.0, mvp: 2, roy: 0, ss: 0, gg: 0, allstars: 19 },
    "Ty Cobb": { war: 151.5, mvp: 1, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Hank Aaron": { war: 143.8, mvp: 1, roy: 0, ss: 0, gg: 3, allstars: 25 },
    "Lou Gehrig": { war: 114.1, mvp: 2, roy: 0, ss: 0, gg: 0, allstars: 7 },
    "Mickey Mantle": { war: 110.2, mvp: 3, roy: 0, ss: 0, gg: 1, allstars: 20 },
    "Mike Schmidt": { war: 106.9, mvp: 3, roy: 0, ss: 6, gg: 10, allstars: 12 },
    "Rogers Hornsby": { war: 127.1, mvp: 2, roy: 0, ss: 0, gg: 0, allstars: 2 },
    "Stan Musial": { war: 128.6, mvp: 3, roy: 0, ss: 0, gg: 0, allstars: 24 },
    "Rickey Henderson": { war: 111.1, mvp: 1, roy: 0, ss: 3, gg: 1, allstars: 10 },
    "Alex Rodriguez": { war: 117.5, mvp: 3, roy: 0, ss: 10, gg: 2, allstars: 14 },
    "Albert Pujols": { war: 101.5, mvp: 3, roy: 1, ss: 6, gg: 2, allstars: 11 },
    "Ken Griffey Jr.": { war: 83.8, mvp: 1, roy: 0, ss: 7, gg: 10, allstars: 13 },
    "Ken Griffey": { war: 83.8, mvp: 1, roy: 0, ss: 7, gg: 10, allstars: 13 },
    "Mike Trout": { war: 85.2, mvp: 3, roy: 1, ss: 9, gg: 0, allstars: 11 },
    "George Brett": { war: 88.6, mvp: 1, roy: 0, ss: 3, gg: 1, allstars: 13 },
    "Cal Ripken": { war: 95.9, mvp: 2, roy: 1, ss: 8, gg: 2, allstars: 19 },
    "Cal Ripken Jr.": { war: 95.9, mvp: 2, roy: 1, ss: 8, gg: 2, allstars: 19 },
    "Tony Gwynn": { war: 69.2, mvp: 0, roy: 0, ss: 7, gg: 5, allstars: 15 },
    "Wade Boggs": { war: 91.4, mvp: 0, roy: 0, ss: 8, gg: 2, allstars: 12 },
    "Johnny Bench": { war: 75.2, mvp: 2, roy: 1, ss: 0, gg: 10, allstars: 14 },
    "Yogi Berra": { war: 59.6, mvp: 3, roy: 0, ss: 0, gg: 0, allstars: 18 },
    "Roy Campanella": { war: 41.8, mvp: 3, roy: 0, ss: 0, gg: 0, allstars: 11 },
    "Joe DiMaggio": { war: 79.2, mvp: 3, roy: 0, ss: 0, gg: 0, allstars: 16 },
    "Jimmie Foxx": { war: 93.4, mvp: 3, roy: 0, ss: 0, gg: 0, allstars: 9 },
    "Carl Yastrzemski": { war: 96.5, mvp: 1, roy: 0, ss: 0, gg: 7, allstars: 18 },
    "Roberto Clemente": { war: 94.8, mvp: 1, roy: 0, ss: 0, gg: 12, allstars: 15 },
    "Al Kaline": { war: 92.8, mvp: 0, roy: 0, ss: 0, gg: 10, allstars: 18 },
    "Eddie Murray": { war: 68.7, mvp: 0, roy: 1, ss: 3, gg: 3, allstars: 8 },
    "Ernie Banks": { war: 67.7, mvp: 2, roy: 0, ss: 0, gg: 1, allstars: 14 },
    "Jackie Robinson": { war: 63.9, mvp: 1, roy: 1, ss: 0, gg: 0, allstars: 6 },
    "Honus Wagner": { war: 131.0, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Tris Speaker": { war: 134.9, mvp: 1, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Nap Lajoie": { war: 106.9, mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 },
    "Shohei Ohtani": { war: 34.7, mvp: 3, roy: 1, ss: 3, gg: 0, allstars: 4 },
    "Shohei Ohtani (DH)": { war: 34.7, mvp: 3, roy: 1, ss: 3, gg: 0, allstars: 4 },
    "Aaron Judge": { war: 50.1, mvp: 2, roy: 1, ss: 3, gg: 0, allstars: 6 },
    "Mookie Betts": { war: 69.5, mvp: 1, roy: 0, ss: 6, gg: 6, allstars: 8 },
    "Miguel Cabrera": { war: 67.3, mvp: 2, roy: 0, ss: 7, gg: 0, allstars: 12 },
    "Bryce Harper": { war: 50.3, mvp: 2, roy: 1, ss: 3, gg: 0, allstars: 8 },
    "Derek Jeter": { war: 71.3, mvp: 0, roy: 1, ss: 5, gg: 5, allstars: 14 },
    "Ichiro Suzuki": { war: 60.0, mvp: 1, roy: 1, ss: 3, gg: 10, allstars: 10 },
    "Manny Ramirez": { war: 69.3, mvp: 0, roy: 0, ss: 9, gg: 0, allstars: 12 },
    "David Ortiz": { war: 55.3, mvp: 0, roy: 0, ss: 7, gg: 0, allstars: 10 },
    "Chipper Jones": { war: 85.3, mvp: 1, roy: 0, ss: 2, gg: 0, allstars: 8 },
    "Ivan Rodriguez": { war: 68.7, mvp: 1, roy: 0, ss: 7, gg: 13, allstars: 14 },
    "Craig Biggio": { war: 65.5, mvp: 0, roy: 0, ss: 5, gg: 4, allstars: 7 },
    "Jeff Bagwell": { war: 79.9, mvp: 1, roy: 1, ss: 3, gg: 1, allstars: 4 },
    "Ryne Sandberg": { war: 67.9, mvp: 1, roy: 0, ss: 7, gg: 9, allstars: 10 },
    "Paul Molitor": { war: 75.7, mvp: 0, roy: 0, ss: 4, gg: 0, allstars: 7 },
    "Robin Yount": { war: 77.4, mvp: 2, roy: 0, ss: 3, gg: 1, allstars: 3 },
    "Gary Carter": { war: 70.1, mvp: 0, roy: 0, ss: 5, gg: 3, allstars: 11 },
    "Carlton Fisk": { war: 68.4, mvp: 0, roy: 1, ss: 3, gg: 1, allstars: 11 },
    "Andruw Jones": { war: 62.7, mvp: 0, roy: 0, ss: 1, gg: 10, allstars: 5 },
    "Jeff Kent": { war: 55.4, mvp: 1, roy: 0, ss: 4, gg: 0, allstars: 5 },
    "Jim Thome": { war: 73.1, mvp: 0, roy: 0, ss: 1, gg: 0, allstars: 5 },
    "Todd Helton": { war: 61.8, mvp: 0, roy: 0, ss: 4, gg: 3, allstars: 5 },
    "Scott Rolen": { war: 70.1, mvp: 0, roy: 1, ss: 1, gg: 8, allstars: 7 },
    "Adrian Beltre": { war: 93.5, mvp: 0, roy: 0, ss: 4, gg: 5, allstars: 4 },
    "Carlos Beltran": { war: 70.1, mvp: 0, roy: 1, ss: 2, gg: 3, allstars: 9 },
    "Buster Posey": { war: 44.8, mvp: 1, roy: 1, ss: 5, gg: 1, allstars: 7 },
    "Joey Votto": { war: 64.5, mvp: 1, roy: 0, ss: 0, gg: 1, allstars: 6 },
    "Paul Goldschmidt": { war: 61.7, mvp: 1, roy: 0, ss: 5, gg: 4, allstars: 7 },
    "Freddie Freeman": { war: 60.2, mvp: 1, roy: 0, ss: 3, gg: 1, allstars: 8 },
    "Jose Altuve": { war: 53.5, mvp: 1, roy: 0, ss: 6, gg: 1, allstars: 8 },
    "Manny Machado": { war: 54.8, mvp: 0, roy: 0, ss: 1, gg: 2, allstars: 6 },
    "Nolan Arenado": { war: 54.5, mvp: 0, roy: 0, ss: 5, gg: 10, allstars: 8 },
    "Giancarlo Stanton": { war: 44.7, mvp: 1, roy: 0, ss: 2, gg: 0, allstars: 5 },
    "Willie McCovey": { war: 64.5, mvp: 1, roy: 1, ss: 0, gg: 0, allstars: 6 },
    "Willie Stargell": { war: 57.5, mvp: 1, roy: 0, ss: 0, gg: 0, allstars: 7 },
    "Brooks Robinson": { war: 78.4, mvp: 1, roy: 0, ss: 0, gg: 16, allstars: 18 },
    "Dick Allen": { war: 58.7, mvp: 1, roy: 1, ss: 0, gg: 0, allstars: 7 },
    "Fred McGriff": { war: 52.6, mvp: 0, roy: 0, ss: 3, gg: 0, allstars: 5 },
    "Sammy Sosa": { war: 58.6, mvp: 1, roy: 0, ss: 6, gg: 0, allstars: 7 },
    "Mark McGwire": { war: 62.2, mvp: 0, roy: 1, ss: 3, gg: 1, allstars: 12 },
    "Rafael Palmeiro": { war: 71.9, mvp: 0, roy: 0, ss: 2, gg: 3, allstars: 4 },
    "Moises Alou": { war: 39.9, mvp: 0, roy: 0, ss: 2, gg: 0, allstars: 6 },
    "Carlos Delgado": { war: 44.4, mvp: 0, roy: 0, ss: 3, gg: 0, allstars: 2 },
    "Jason Giambi": { war: 50.5, mvp: 1, roy: 0, ss: 2, gg: 0, allstars: 5 }
  };

  function getGrade(val) {
    if (val >= 100) return 'S';
    if (val >= 80) return 'A';
    if (val >= 60) return 'B';
    if (val >= 40) return 'C';
    if (val >= 20) return 'D';
    return 'F';
  }

  function getGradeColor(val) {
    return GRADE_COLORS[getGrade(val)];
  }

  function getPosText(p) {
    if (!p) return '';
    if (p.sec_pos && String(p.sec_pos).trim() !== '') {
      return `${p.pos} / ${p.sec_pos}`;
    }
    return p.pos || '';
  }

  function getPlayerCareerData(p) {
    if (!p) return { war: '-', mvp: 0, roy: 0, ss: 0, gg: 0, allstars: 0 };
    const cleanName = p.name ? p.name.replace(/\s\(.*?\)$/, '').trim() : '';
    const known = CAREER_DB[cleanName] || CAREER_DB[p.name];
    
    if (known) {
      return {
        war: known.war,
        mvp: known.mvp,
        roy: known.roy,
        ss: known.ss,
        gg: known.gg !== undefined ? known.gg : (p.gold_gloves || 0),
        allstars: known.allstars !== undefined ? known.allstars : (p.allstars || 0)
      };
    }

    // Improved estimation for non-mapped players
    const as = p.allstars || 0;
    const gg = p.gold_gloves || 0;
    const ovr = p.ovr || 70;
    const isHof = p.hof || false;
    const isEarlyEra = p.era && (p.era.includes('Genesis') || p.era.includes('Deadball') || p.era.includes('Golden'));

    let estWar = 0;
    if (isEarlyEra) {
      // Early era players didn't have All-Star games or Gold Gloves!
      // Base career WAR on peak OVR & HOF status
      const baseMult = isHof ? 0.75 : 0.50;
      estWar = Number(((ovr - 40) * baseMult).toFixed(1));
    } else {
      // Modern era estimation
      const baseMult = isHof ? 0.8 : 0.35;
      estWar = Number(((ovr - 40) * baseMult + as * 2.2).toFixed(1));
    }

    if (isNaN(estWar) || estWar < 0.5) estWar = Number(((ovr / 10) * 1.5).toFixed(1));

    const mvp = (p.mvp !== undefined) ? p.mvp : ((ovr >= 96 && (as >= 5 || isHof)) ? 1 : 0);
    const roy = (p.roy !== undefined) ? p.roy : 0;
    const ss = (p.ss !== undefined) ? p.ss : ((p.con > 88 || p.pwr > 88) ? Math.floor(as * 0.3) : 0);

    return {
      war: estWar,
      mvp: mvp,
      roy: roy,
      ss: ss,
      gg: gg,
      allstars: as
    };
  }

  window.BaseballDex = {
    STORAGE_KEY: 'baserogue_dex_v1',
    unlocked: new Set(),
    currentFilterEra: 'all',
    currentSearchTerm: '',
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
    },

    save() {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.unlocked)));
      this.updateCounters();
    },

    unlock(player) {
      if (!player) return;
      const key = `${player.name}_${player.year}`;
      if (!this.unlocked.has(key)) {
        this.unlocked.add(key);
        this.save();
      }
    },

    isUnlocked(player) {
      return this.unlocked.has(`${player.name}_${player.year}`);
    },

    getStats() {
      const pool = window.PlayersDB ? window.PlayersDB.LAHMAN_POOL : [];
      return { total: pool.length, unlocked: this.unlocked.size };
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
        elText.innerText = `${stats.unlocked} / ${stats.total} descubiertos (${pct}%)`;
      }
      if (elFill) {
        elFill.style.width = `${pct}%`;
      }
    },

    applyFilters() {
      const pool = window.PlayersDB ? window.PlayersDB.LAHMAN_POOL : [];
      const term = this.currentSearchTerm.toLowerCase().trim();
      
      this.filteredPlayers = pool.filter(p => {
        if (this.currentFilterEra !== 'all' && p.era !== this.currentFilterEra) return false;
        if (term) {
          const nMatch = p.name && p.name.toLowerCase().includes(term);
          const tMatch = p.team && p.team.toLowerCase().includes(term);
          if (!nMatch && !tMatch) return false;
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
          el.className = 'dex-card unlocked';
          el.style.cssText = `background: #0d1f12; border: 2px solid ${rColor}; border-radius: 8px; padding: 10px 6px; text-align: center; cursor: pointer; transition: transform 0.15s; display: flex; flex-direction: column; justify-content: space-between;`;
          el.innerHTML = `
            <div>
              <div style="font-size:7px;color:#00ff66;font-family:'Press Start 2P',monospace;margin-bottom:4px">${getPosText(p)}</div>
              <div style="font-size:7px;color:#e5e7eb;font-family:'Press Start 2P',monospace;line-height:1.3;word-break:break-word">${p.name}</div>
              <div style="font-size:6px;color:#9ca3af;margin-top:3px">${p.team} '${p.year}</div>
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
            <div style="font-size:6px;color:#374151;margin-top:2px">BLOQUEADO</div>
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
        btn.innerText = 'Mostrar más';
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

      // Search bar
      const searchContainer = document.createElement('div');
      searchContainer.style.cssText = 'padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Buscar por nombre o equipo...';
      searchInput.style.cssText = 'width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;';
      searchInput.oninput = (e) => {
        this.currentSearchTerm = e.target.value;
        this.applyFilters();
      };
      searchContainer.appendChild(searchInput);
      panel.appendChild(searchContainer);

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
      if (window.PlayersDB && window.PlayersDB.FranchiseNames) {
        teamFull = window.PlayersDB.FranchiseNames[p.team] || p.team;
      }

      const overlay = document.createElement('div');
      overlay.id = 'dex-detail-overlay';
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.85);z-index:10;display:flex;align-items:center;justify-content:center;padding:20px';
      
      let badgesHtml = '';
      if (p.hof) badgesHtml += '<span style="background:#ffd70022;color:#ffd700;border:1px solid #ffd700;padding:2px 8px;border-radius:4px;font-size:8px">🏆 HOF</span>';
      if (p.clutch || p.is_clutch) badgesHtml += '<span style="background:#ef444422;color:#ef4444;border:1px solid #ef4444;padding:2px 8px;border-radius:4px;font-size:8px">⚡ CLUTCH</span>';
      if (p.captain || p.is_captain) badgesHtml += '<span style="background:#3b82f622;color:#3b82f6;border:1px solid #3b82f6;padding:2px 8px;border-radius:4px;font-size:8px">👑 CAPTAIN</span>';

      const renderStat = (lbl, val) => `
        <div style="background:#111827;border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9px;color:#9ca3af">${lbl}</span>
          <span style="font-size:11px;font-weight:bold;color:${getGradeColor(val)}">${val} <small style="font-size:8px">${getGrade(val)}</small></span>
        </div>
      `;

      const careerStats = getPlayerCareerData(p);

      overlay.innerHTML = `
        <div style="background:#0a0f1a;border:3px solid ${rColor};border-radius:12px;width:100%;max-width:440px;padding:24px;position:relative">
          <button onclick="document.getElementById('dex-detail-overlay').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button>
          
          <div style="margin-bottom:16px">
            <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:${rColor};margin-bottom:4px">${p.rarity || 'Common'} · ${eraShort}</div>
            <h2 style="font-family:'Press Start 2P',monospace;font-size:13px;color:#fff;margin:0 0 4px 0;line-height:1.4">${p.name}</h2>
            <div style="font-size:12px;color:#9ca3af">${teamFull} — ${p.year} · ${getPosText(p)}</div>
          </div>
          
          <div style="text-align:center;margin-bottom:16px">
            <div style="font-family:'Press Start 2P',monospace;font-size:32px;color:${rColor};text-shadow:0 0 20px ${rColor}88">${p.ovr}</div>
            <div style="font-size:10px;color:#6b7280">OVR</div>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
            ${renderStat('CON', p.con || 40)}
            ${renderStat('PWR', p.pwr || 40)}
            ${renderStat('EYE', p.eye || 40)}
            ${renderStat('SPD', p.spd || 40)}
            ${renderStat('DEF', p.def || 40)}
          </div>
          
          ${badgesHtml ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${badgesHtml}</div>` : ''}
          
          <div style="background:#111827;border-radius:8px;padding:12px">
            <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#38bdf8;margin-bottom:10px;text-align:center">ESTADÍSTICAS DE CARRERA (MLB)</div>
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;text-align:center">
              <div><div style="font-size:13px;font-weight:bold;color:#fff">${careerStats.allstars}</div><div style="font-size:7px;color:#6b7280;margin-top:2px">ALL-STARS</div></div>
              <div><div style="font-size:13px;font-weight:bold;color:#ffd700">${careerStats.gg}</div><div style="font-size:7px;color:#6b7280;margin-top:2px">GG</div></div>
              <div><div style="font-size:13px;font-weight:bold;color:#eab308">${careerStats.mvp}</div><div style="font-size:7px;color:#6b7280;margin-top:2px">MVP</div></div>
              <div><div style="font-size:13px;font-weight:bold;color:#38bdf8">${careerStats.ss}</div><div style="font-size:7px;color:#6b7280;margin-top:2px">SS</div></div>
              <div><div style="font-size:13px;font-weight:bold;color:#a7f3d0">${careerStats.roy}</div><div style="font-size:7px;color:#6b7280;margin-top:2px">ROY</div></div>
              <div><div style="font-size:13px;font-weight:bold;color:#00ff66">${careerStats.war}</div><div style="font-size:7px;color:#6b7280;margin-top:2px">WAR CARRERA</div></div>
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
