"""dh_home.js: for cards whose main position is DH, the field position (among their secondaries)
they played most. There their glove carries no secondary-position penalty: the card's defense
already comes from those games. A DH with no secondary (Ohtani) has none. Rerun if cards change."""
import csv, json
cols = {'C': 'G_c', '1B': 'G_1b', '2B': 'G_2b', '3B': 'G_3b', 'SS': 'G_ss', 'LF': 'G_lf', 'CF': 'G_cf', 'RF': 'G_rf'}
dh = {r['playerID']: [s.strip() for s in r['sec_pos'].split(',') if s.strip() in cols]
      for r in csv.DictReader(open('game_cards.csv', encoding='utf-8')) if r['pos'] == 'DH'}
games = {}
for r in csv.DictReader(open('lahman_1871-2025/Appearances.csv', encoding='utf-8')):
    if r['playerID'] in dh:
        g = games.setdefault(r['playerID'], {})
        for p, c in cols.items():
            g[p] = g.get(p, 0) + int(float(r[c] or 0))
out = {pid: max(sec, key=lambda p: games.get(pid, {}).get(p, 0)) for pid, sec in dh.items() if sec}
open('dh_home.js', 'w', encoding='utf-8').write('window.DHHomePos=' + json.dumps(out, separators=(',', ':')) + ';\n')
print(len(dh), len(out), {k: out.get(k) for k in ('ortizda01', 'martied01', 'alvaryo01', 'cruzne02', 'molitpa01')})
