
const fs = require('fs');

// Mock window and document
global.window = {
  t: (k, def) => def || k,
  AudioManager: { play: () => {} }
};
global.document = {
  getElementById: () => null,
  createElement: () => ({ style: {}, querySelector: () => null, setAttribute: () => {} }),
  body: { appendChild: () => {} }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Evaluate challenge162
const code = fs.readFileSync('challenge162.js', 'utf8');
eval(code);

const C = window.Challenge162;

// Create sample test roster
const lineup = {
  '2B': { name: 'Roberto Alomar', pos: '2B', con: 88, eye: 82, pwr: 60, spd: 90, def: 88, ovr: 88 },
  '1B': { name: 'Todd Helton', pos: '1B', con: 92, eye: 94, pwr: 88, spd: 40, def: 80, ovr: 90 },
  'RF': { name: 'Larry Walker', pos: 'RF', con: 92, eye: 85, pwr: 88, spd: 75, def: 85, ovr: 90 },
  'LF': { name: 'Barry Bonds', pos: 'LF', con: 96, eye: 99, pwr: 98, spd: 75, def: 82, ovr: 96 },
  '3B': { name: 'Alex Rodriguez', pos: '3B', con: 88, eye: 80, pwr: 94, spd: 75, def: 84, ovr: 92 },
  'DH': { name: 'Jeff Bagwell', pos: 'DH', con: 88, eye: 92, pwr: 92, spd: 72, def: 75, ovr: 90 },
  'CF': { name: 'Ken Griffey Jr.', pos: 'CF', con: 88, eye: 82, pwr: 94, spd: 75, def: 88, ovr: 92 },
  'C':  { name: 'Mike Piazza', pos: 'C', con: 92, eye: 78, pwr: 86, spd: 35, def: 70, ovr: 88 },
  'SS': { name: 'Nomar Garciaparra', pos: 'SS', con: 94, eye: 65, pwr: 75, spd: 65, def: 78, ovr: 88 }
};

const pitchers = {
  SP: [
    { name: 'Pedro Martinez', role: 'SP', cleanName: 'Pedro Martinez', ovr: 96, h9: 98, k9: 98, bb9: 90, hr9: 90, sta: 85 },
    { name: 'Randy Johnson', role: 'SP', cleanName: 'Randy Johnson', ovr: 95, h9: 92, k9: 99, bb9: 75, hr9: 88, sta: 90 },
    { name: 'Greg Maddux', role: 'SP', cleanName: 'Greg Maddux', ovr: 94, h9: 90, k9: 78, bb9: 98, hr9: 92, sta: 88 },
    { name: 'Curt Schilling', role: 'SP', cleanName: 'Curt Schilling', ovr: 92, h9: 88, k9: 94, bb9: 92, hr9: 85, sta: 88 },
    { name: 'Kevin Brown', role: 'SP', cleanName: 'Kevin Brown', ovr: 90, h9: 88, k9: 85, bb9: 85, hr9: 88, sta: 85 }
  ],
  RP: [
    { name: 'Billy Wagner', role: 'CL', cleanName: 'Billy Wagner', ovr: 92, h9: 94, k9: 98, bb9: 82, hr9: 90 },
    { name: 'Mariano Rivera', role: 'SETUP', cleanName: 'Mariano Rivera', ovr: 95, h9: 96, k9: 90, bb9: 95, hr9: 95 },
    { name: 'Trevor Hoffman', role: 'RP', cleanName: 'Trevor Hoffman', ovr: 90, h9: 90, k9: 92, bb9: 88, hr9: 90 }
  ]
};

// Run 50 simulated seasons
const seasonsStats = [];

for (let s = 0; s < 50; s++) {
  C.startNewChallenge(lineup, pitchers);
  for (let g = 0; g < 162; g++) {
    C.simulateGame();
  }
  seasonsStats.push({
    wins: C.state.wins,
    losses: C.state.losses,
    batterStats: JSON.parse(JSON.stringify(C.state.batterStats)),
    pitcherStats: JSON.parse(JSON.stringify(C.state.pitcherStats))
  });
}

console.log('=== STATS PROMEDIO EN 50 TEMPORADAS SIMULADAS DE 162 JUEGOS ===');
const avgWins = seasonsStats.reduce((acc, s) => acc + s.wins, 0) / 50;
const avgLosses = seasonsStats.reduce((acc, s) => acc + s.losses, 0) / 50;
console.log(Record Promedio:  - );

console.log('\n--- BATEADORES ---');
const bKeys = Object.keys(seasonsStats[0].batterStats);
bKeys.forEach(k => {
  let ab = 0, h = 0, hr = 0, rbi = 0, r = 0, bb = 0, so = 0, sb = 0;
  seasonsStats.forEach(s => {
    const b = s.batterStats[k];
    ab += b.ab; h += b.h; hr += b.hr; rbi += b.rbi; r += b.r; bb += b.bb; so += b.so; sb += b.sb;
  });
  ab /= 50; h /= 50; hr /= 50; rbi /= 50; r /= 50; bb /= 50; so /= 50; sb /= 50;
  const avg = ab > 0 ? (h / ab).toFixed(3) : '.000';
  const obp = (ab + bb) > 0 ? ((h + bb) / (ab + bb)).toFixed(3) : '.000';
  const name = seasonsStats[0].batterStats[k].name;
  console.log(${name.padEnd(20)} | AB:  | AVG:  | OBP:  | HR:  | RBI:  | R:  | SB:  | BB:  | SO: );
});

console.log('\n--- LANZADORES ---');
const pKeys = Object.keys(seasonsStats[0].pitcherStats);
pKeys.forEach(k => {
  let outs = 0, h = 0, er = 0, bb = 0, so = 0, w = 0, l = 0, sv = 0;
  seasonsStats.forEach(s => {
    const p = s.pitcherStats[k];
    outs += p.outs; h += p.h; er += p.er; bb += p.bb; so += p.so; w += p.w; l += p.l; sv += p.sv;
  });
  outs /= 50; h /= 50; er /= 50; bb /= 50; so /= 50; w /= 50; l /= 50; sv /= 50;
  const ip = (outs / 3).toFixed(1);
  const era = outs > 0 ? ((er * 27) / outs).toFixed(2) : '0.00';
  const whip = outs > 0 ? (((bb + h) * 3) / outs).toFixed(2) : '0.00';
  const name = seasonsStats[0].pitcherStats[k].name;
  const role = seasonsStats[0].pitcherStats[k].role;
  console.log(${name.padEnd(18)} () | IP:  | ERA:  | WHIP:  | SO:  | BB:  | W-L: - | SV: );
});
