// BaseRogue Players Database
// Redefined for RPG Battler mode

(function() {
  const Eras = {
    GENESIS: "The Genesis Era (1871-1900)",
    DEADBALL: "Deadball (1901-1919)",
    GOLDEN: "Golden Era (1920-1941)",
    INTEGRATION: "Integration (1942-1960)",
    EXPANSION: "Expansion (1961-1976)",
    BIGHAIR: "Big Hair Era (1977-1993)",
    STEROID: "Steroid Era (1994-2005)",
    EFFICIENCY: "Efficiency Era (2006-2015)",
    MODERN: "Modern Era (2016-Pres)"
  };

  const EraTraits = {
    "The Genesis Era (1871-1900)": {
      name: "Genesis Chaos",
      desc: "T1 (2+): 20% prob. de error defensivo en hit (+1 base extra). T2 (4+): 35% prob. de error defensivo.",
      applyStatBonus: (stats) => {}
    },
    "Deadball (1901-1919)": {
      name: "Small Ball",
      desc: "T1 (2+): 20% prob. en sencillo 1B de avanzar 2 bases. T2 (4+): 40% prob. de avanzar 2 bases en sencillo.",
      applyStatBonus: (stats) => {}
    },
    "Golden Era (1920-1941)": {
      name: "Liveball Sluggers",
      desc: "T1 (2+): Todos los hits hacen +6 daño extra. T2 (4+): Hits +12 daño; 30% de transformar Dobles en Triples.",
      applyStatBonus: (stats) => {}
    },
    "Integration (1942-1960)": {
      name: "Five-Tool Legends",
      desc: "T1 (2+): Bateador obtiene +4 a todos sus stats en turno. T2 (4+): Bateador +8 stats; outs curan +5 Stamina.",
      applyStatBonus: (stats) => {}
    },
    "Expansion (1961-1976)": {
      name: "Speed & Hustle",
      desc: "T1 (2+): 50% robo en 1B/BB; robo cura +10 Stamina. T2 (4+): 80% robo; cura +20 y hace +10 daño al rival.",
      applyStatBonus: (stats) => {}
    },
    "Big Hair Era (1977-1993)": {
      name: "AstroTurf Speedsters",
      desc: "T1 (2+): Robos hacen +15 daño extra. T2 (4+): Robos +30 daño y debuff de 3 turnos al rival.",
      applyStatBonus: (stats) => {}
    },
    "Steroid Era (1994-2005)": {
      name: "Bash Brothers",
      desc: "T1 (2+): Jonrones (HR) hacen +15 daño adicional. T2 (4+): HR hacen +30 daño; 50% fly sac en 3B.",
      applyStatBonus: (stats) => {}
    },
    "Efficiency Era (2006-2015)": {
      name: "Moneyball Analytics",
      desc: "T1 (2+): Boletos (BB) hacen +10 daño extra. T2 (4+): BB hacen +20 daño; outs hacen +10 daño al rival.",
      applyStatBonus: (stats) => {}
    },
    "Modern Era (2016-Pres)": {
      name: "Three True Outcomes",
      desc: "T1 (2+): BB hacen +12 daño, Ponche -50% daño al equipo. T2 (4+): BB hacen +24 daño, Ponches no cortan racha.",
      applyStatBonus: (stats) => {}
    }
  };

  const FranchiseNames = {
    NYY: "New York Yankees",
    BOS: "Boston Red Sox",
    LAD: "Los Angeles Dodgers",
    SFG: "San Francisco Giants",
    CHC: "Chicago Cubs",
    STL: "St. Louis Cardinals",
    OAK: "Oakland Athletics",
    DET: "Detroit Tigers",
    PIT: "Pittsburgh Pirates",
    CLE: "Cleveland Guardians",
    ATL: "Atlanta Braves",
    TEX: "Texas Rangers"
  };

  // Replacement Level Players - Starting Lineup (Offensive 20-45 stats)
  const REPLACEMENT_LEVEL_LINEUP = {
    C: { name: "Jeff Mathis", pos: "C", era: "None", team: "LAD", year: 2008, con: 25, pwr: 30, eye: 35, spd: 30, def: 95, rarity: "Common", isReplacement: true },
    "1B": { name: "Mario Mendoza", pos: "1B", era: "None", team: "PIT", year: 1979, con: 30, pwr: 20, eye: 35, spd: 40, def: 80, rarity: "Common", isReplacement: true },
    "2B": { name: "Neifi Perez", pos: "2B", era: "None", team: "CHC", year: 2005, con: 40, pwr: 30, eye: 20, spd: 65, def: 80, rarity: "Common", isReplacement: true },
    "3B": { name: "Brandon Wood", pos: "3B", era: "None", team: "LAD", year: 2010, con: 28, pwr: 45, eye: 25, spd: 40, def: 65, rarity: "Common", isReplacement: true },
    SS: { name: "John McDonald", pos: "SS", era: "None", team: "BOS", year: 2013, con: 35, pwr: 25, eye: 35, spd: 50, def: 95, rarity: "Common", isReplacement: true },
    LF: { name: "Ryan Langerhans", pos: "LF", era: "None", team: "ATL", year: 2005, con: 35, pwr: 40, eye: 50, spd: 55, def: 75, rarity: "Common", isReplacement: true },
    CF: { name: "Munenori Kawasaki", pos: "CF", era: "None", team: "BOS", year: 2013, con: 45, pwr: 15, eye: 55, spd: 70, def: 82, rarity: "Common", isReplacement: true },
    RF: { name: "Cody Ransom", pos: "RF", era: "None", team: "NYY", year: 2008, con: 30, pwr: 45, eye: 35, spd: 48, def: 70, rarity: "Common", isReplacement: true },
    DH: { name: "Dan Uggla", pos: "DH", era: "None", team: "ATL", year: 2014, con: 32, pwr: 55, eye: 45, spd: 35, def: 40, rarity: "Common", isReplacement: true }
  };

  // Starter Legend selection (Player picks one to lead their replacement squad)
  const STARTERS = [
    {
      id: "starter_babe",
      name: "Babe Ruth",
      pos: "RF",
      sec_pos: "LF, 1B",
      era: Eras.GOLDEN,
      team: "NYY",
      year: 1927,
      con: 95,
      pwr: 99,
      eye: 98,
      spd: 55,
      def: 68,
      rarity: "Legendary",
      bio: "El Bambino. Desbloquea un poder destructivo y sinergia de la Era Golden."
    },
    {
      id: "starter_ty",
      name: "Ty Cobb",
      pos: "CF",
      era: Eras.DEADBALL,
      team: "DET",
      year: 1911,
      con: 99,
      pwr: 48,
      eye: 92,
      spd: 96,
      def: 82,
      rarity: "Legendary",
      bio: "The Georgia Peach. Contacto perfecto, velocidad de base extrema y sinergia de Deadball."
    },
    {
      id: "starter_jackie",
      name: "Jackie Robinson",
      pos: "2B",
      era: Eras.INTEGRATION,
      team: "LAD",
      year: 1949,
      con: 92,
      pwr: 60,
      eye: 90,
      spd: 93,
      def: 94,
      rarity: "Legendary",
      bio: "Pionero. Excelente defensor de segunda base y dinámico robador con alta estamina."
    },
    {
      id: "starter_williams",
      name: "Ted Williams",
      pos: "LF",
      era: Eras.INTEGRATION,
      team: "BOS",
      year: 1949,
      con: 99,
      pwr: 95,
      eye: 99,
      spd: 48,
      def: 70,
      rarity: "Legendary",
      bio: "The Splendid Splinter. El bateador más disciplinado de la historia con stats de bateo impecables."
    },
    {
      id: "starter_anson",
      name: "Cap Anson",
      pos: "1B",
      era: Eras.GENESIS,
      team: "CHC",
      year: 1881,
      con: 94,
      pwr: 70,
      eye: 91,
      spd: 52,
      def: 62,
      rarity: "Legendary",
      bio: "Capitán del Siglo XIX. Fuerza bruta de la Era Genesis con alto contacto y bajo fildeo."
    }
  ];

  // Legendary Batter Pool for Drafting
  const PLAYERS_POOL = [
    // --- The Genesis Era (1871-1900) ---
    { name: "King Kelly", pos: "RF", era: Eras.GENESIS, team: "BOS", year: 1886, con: 86, pwr: 60, eye: 85, spd: 88, def: 55, rarity: "Legendary" },
    { name: "Dan Brouthers", pos: "1B", era: Eras.GENESIS, team: "NYY", year: 1887, con: 93, pwr: 76, eye: 90, spd: 58, def: 52, rarity: "Epic" },
    { name: "Billy Hamilton", pos: "CF", era: Eras.GENESIS, team: "LAD", year: 1894, con: 91, pwr: 38, eye: 96, spd: 99, def: 65, rarity: "Epic" },
    { name: "Cap Anson", pos: "1B", era: Eras.GENESIS, team: "CHC", year: 1881, con: 94, pwr: 70, eye: 91, spd: 52, def: 62, rarity: "Legendary" },

    // --- Deadball Era (1900-1919) ---
    { name: "Honus Wagner", pos: "SS", era: Eras.DEADBALL, team: "PIT", year: 1908, con: 96, pwr: 52, eye: 88, spd: 89, def: 95, rarity: "Legendary" },
    { name: "Shoeless Joe Jackson", pos: "LF", era: Eras.DEADBALL, team: "CLE", year: 1911, con: 98, pwr: 62, eye: 85, spd: 82, def: 75, rarity: "Epic" },
    { name: "Tris Speaker", pos: "CF", era: Eras.DEADBALL, team: "BOS", year: 1912, con: 94, pwr: 50, eye: 90, spd: 85, def: 96, rarity: "Epic" },
    { name: "Frank Chance", pos: "1B", era: Eras.DEADBALL, team: "CHC", year: 1906, con: 78, pwr: 42, eye: 82, spd: 80, def: 88, rarity: "Rare" },
    { name: "Johnny Evers", pos: "2B", era: Eras.DEADBALL, team: "CHC", year: 1910, con: 76, pwr: 38, eye: 85, spd: 78, def: 90, rarity: "Rare" },
    { name: "Chief Meyers", pos: "C", era: Eras.DEADBALL, team: "SFG", year: 1912, con: 82, pwr: 40, eye: 78, spd: 40, def: 80, rarity: "Common" },

    // --- Golden Era (1920-1945) ---
    { name: "Lou Gehrig", pos: "1B", era: Eras.GOLDEN, team: "NYY", year: 1927, con: 95, pwr: 96, eye: 97, spd: 58, def: 85, rarity: "Legendary" },
    { name: "Rogers Hornsby", pos: "2B", era: Eras.GOLDEN, team: "STL", year: 1922, con: 99, pwr: 85, eye: 88, spd: 70, def: 80, rarity: "Epic" },
    { name: "Jimmie Foxx", pos: "1B", era: Eras.GOLDEN, team: "OAK", year: 1932, con: 88, pwr: 97, eye: 92, spd: 55, def: 78, rarity: "Epic" },
    { name: "Mel Ott", pos: "RF", era: Eras.GOLDEN, team: "SFG", year: 1929, con: 85, pwr: 92, eye: 95, spd: 50, def: 86, rarity: "Rare" },
    { name: "Bill Dickey", pos: "C", era: Eras.GOLDEN, team: "NYY", year: 1936, con: 86, pwr: 68, eye: 82, spd: 45, def: 88, rarity: "Rare" },
    { name: "Arky Vaughan", pos: "SS", era: Eras.GOLDEN, team: "PIT", year: 1935, con: 90, pwr: 55, eye: 94, spd: 76, def: 84, rarity: "Rare" },
    { name: "Josh Gibson", pos: "C", era: Eras.GOLDEN, team: "PIT", year: 1937, con: 94, pwr: 99, eye: 90, spd: 60, def: 85, rarity: "Legendary" },

    // --- Integration Era (1946-1969) ---
    { name: "Willie Mays", pos: "CF", era: Eras.INTEGRATION, team: "SFG", year: 1954, con: 92, pwr: 94, eye: 88, spd: 94, def: 99, rarity: "Legendary" },
    { name: "Mickey Mantle", pos: "CF", era: Eras.INTEGRATION, team: "NYY", year: 1956, con: 90, pwr: 98, eye: 96, spd: 92, def: 85, rarity: "Legendary" },
    { name: "Hank Aaron", pos: "RF", era: Eras.INTEGRATION, team: "ATL", year: 1959, con: 93, pwr: 94, eye: 89, spd: 78, def: 90, rarity: "Epic" },
    { name: "Ernie Banks", pos: "SS", era: Eras.INTEGRATION, team: "CHC", year: 1958, con: 82, pwr: 92, eye: 80, spd: 65, def: 88, rarity: "Rare" },
    { name: "Roy Campanella", pos: "C", era: Eras.INTEGRATION, team: "LAD", year: 1953, con: 84, pwr: 88, eye: 82, spd: 42, def: 92, rarity: "Rare" },

    // --- Big Hair Era (1970-1989) ---
    { name: "Rickey Henderson", pos: "LF", era: Eras.BIGHAIR, team: "OAK", year: 1982, con: 85, pwr: 60, eye: 96, spd: 99, def: 88, rarity: "Legendary" },
    { name: "Mike Schmidt", pos: "3B", era: Eras.BIGHAIR, team: "PIT", year: 1980, con: 80, pwr: 94, eye: 90, spd: 68, def: 96, rarity: "Epic" },
    { name: "Tony Gwynn", pos: "RF", era: Eras.BIGHAIR, team: "SFG", year: 1987, con: 98, pwr: 48, eye: 90, spd: 82, def: 88, rarity: "Epic" },
    { name: "Cal Ripken Jr.", pos: "SS", era: Eras.BIGHAIR, team: "CLE", year: 1983, con: 84, pwr: 76, eye: 85, spd: 55, def: 95, rarity: "Rare" },
    { name: "Ozzie Smith", pos: "SS", era: Eras.BIGHAIR, team: "STL", year: 1987, con: 75, pwr: 30, eye: 82, spd: 90, def: 99, rarity: "Rare" },
    { name: "Reggie Jackson", pos: "RF", era: Eras.BIGHAIR, team: "NYY", year: 1977, con: 78, pwr: 90, eye: 80, spd: 65, def: 72, rarity: "Common" },

    // --- Steroid Era (1990-2004) ---
    { name: "Barry Bonds", pos: "LF", era: Eras.STEROID, team: "SFG", year: 2001, con: 96, pwr: 99, eye: 99, spd: 85, def: 90, rarity: "Legendary" },
    { name: "Ken Griffey Jr.", pos: "CF", era: Eras.STEROID, team: "OAK", year: 1997, con: 88, pwr: 95, eye: 88, spd: 86, def: 98, rarity: "Legendary" },
    { name: "Alex Rodriguez", pos: "SS", era: Eras.STEROID, team: "TEX", year: 2002, con: 90, pwr: 96, eye: 85, spd: 82, def: 92, rarity: "Epic" },
    { name: "Frank Thomas", pos: "1B", era: Eras.STEROID, team: "CHC", year: 1994, con: 92, pwr: 95, eye: 96, spd: 45, def: 65, rarity: "Rare" },
    { name: "Sammy Sosa", pos: "RF", era: Eras.STEROID, team: "CHC", year: 1998, con: 78, pwr: 96, eye: 75, spd: 75, def: 78, rarity: "Common" },
    { name: "Mike Piazza", pos: "C", era: Eras.STEROID, team: "LAD", year: 1997, con: 90, pwr: 90, eye: 84, spd: 40, def: 72, rarity: "Epic" },

    // --- Modern Era (2005-Pres) ---
    { name: "Albert Pujols", pos: "1B", era: Eras.MODERN, team: "STL", year: 2009, con: 94, pwr: 95, eye: 92, spd: 55, def: 88, rarity: "Epic" },
    { name: "Mike Trout", pos: "CF", era: Eras.MODERN, team: "LAD", year: 2018, con: 90, pwr: 96, eye: 96, spd: 90, def: 90, rarity: "Legendary" },
    { name: "Mookie Betts", pos: "RF", era: Eras.MODERN, team: "LAD", year: 2018, con: 92, pwr: 78, eye: 90, spd: 88, def: 96, rarity: "Epic" },
    { name: "Aaron Judge", pos: "RF", era: Eras.MODERN, team: "NYY", year: 2022, con: 85, pwr: 98, eye: 92, spd: 65, def: 85, rarity: "Epic" },
    { name: "Buster Posey", pos: "C", era: Eras.MODERN, team: "SFG", year: 2012, con: 90, pwr: 70, eye: 85, spd: 45, def: 94, rarity: "Rare" },
    { name: "Francisco Lindor", pos: "SS", era: Eras.MODERN, team: "CLE", year: 2018, con: 82, pwr: 74, eye: 80, spd: 80, def: 95, rarity: "Rare" },
    { name: "Shohei Ohtani (DH)", pos: "DH", era: Eras.MODERN, team: "LAD", year: 2023, con: 88, pwr: 98, eye: 90, spd: 92, def: 50, rarity: "Legendary" }
  ];


  window.PlayersDB = {
    Eras,
    FranchiseNames,
    REPLACEMENT_LEVEL_LINEUP,
    STARTERS,
    PLAYERS_POOL,
    EraTraits
  };
})();
