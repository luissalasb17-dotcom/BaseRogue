"""Genera player_states.js: estado de nacimiento (People.csv, birthState) de cada carta nacida en EE. UU.
La quimica de origen del 162-0 cuenta a los americanos por estado y al resto por pais.
Volver a correrlo si cambian las cartas."""
import json, pandas as pd
D = 'lahman_1871-2025/'
pe = pd.read_csv(D + 'People.csv', low_memory=False)[['playerID', 'birthCountry', 'birthState']]
c = pd.read_csv('game_cards.csv')[['playerID']]
p = pd.read_csv('pitchers_pool.csv')[['playerID']]
p['playerID'] = p.playerID.str.replace(r'_(sp|rp)$', '', regex=True)
a = pd.concat([c, p]).drop_duplicates().merge(pe, on='playerID', how='left')
us = a[(a.birthCountry == 'USA') & a.birthState.notna()]
m = dict(zip(us.playerID, us.birthState.str.upper()))
open('player_states.js', 'w', encoding='utf-8').write('window.PlayerStates=' + json.dumps(m, separators=(',', ':')) + ';\n')
v = us.birthState.value_counts(normalize=True) * 100
print(len(m), 'sin estado:', ((a.birthCountry == 'USA') & a.birthState.isna()).sum())
print(v.round(1).head(25).to_dict())
