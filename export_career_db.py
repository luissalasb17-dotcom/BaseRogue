import pandas as pd
import json
import re
import unicodedata

def norm(s):
    if not s:
        return ""
    s = re.sub(r'\s\(.*?\)$', '', s)
    s = s.replace('.', '')
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-zA-Z0-9\s]', '', s)
    return s.lower().strip()

NICKNAMES = {
    'dan': 'daniel', 'danny': 'daniel', 'mike': 'michael', 'dave': 'david',
    'bob': 'robert', 'bobby': 'robert', 'rob': 'robert', 'jim': 'james',
    'jimmy': 'james', 'bill': 'william', 'billy': 'william', 'joe': 'joseph',
    'joey': 'joseph', 'tom': 'thomas', 'tommy': 'thomas', 'dick': 'richard',
    'rick': 'richard', 'ricky': 'richard', 'richey': 'richard', 'al': 'albert',
    'fred': 'frederic', 'freddie': 'frederic', 'freddy': 'frederic',
    'ed': 'edward', 'eddie': 'edward', 'ken': 'kenneth', 'kenny': 'kenneth',
    'sam': 'samuel', 'sammy': 'samuel', 'pete': 'peter', 'chris': 'christopher',
    'alex': 'alexander', 'tony': 'anthony', 'matt': 'matthew', 'charley': 'charles',
    'charlie': 'charles', 'chuck': 'charles', 'frank': 'francis', 'frankie': 'francis',
    'cap': 'adrian', 'ty': 'tyrus', 'cy': 'denton', 'honus': 'johannes', 'tris': 'tristram',
    'shoeless': 'joseph', 'babe': 'george', 'lou': 'henry', 'ted': 'theodore',
    'jimmie': 'james', 'jimmy': 'james', 'cal': 'calvin', 'chipper': 'larry',
    'buster': 'gerald', 'mookie': 'markus', 'shohei': 'shohei', 'aaron': 'aaron',
    'buck': 'william'
}

# Explicit overrides matching current Baseball-Reference website summary headers
MANUAL_OVERRIDE = {
    'Buck Ewing': {'war': 48.0, 'mvp': 0, 'roy': 0, 'ss': 0, 'gg': 0, 'allstars': 0, 'hof': True},
    'Joe Morgan': {'war': 100.6, 'mvp': 2, 'roy': 0, 'ss': 1, 'gg': 5, 'allstars': 10, 'hof': True},
    'Joe Kelley': {'war': 50.6, 'mvp': 0, 'roy': 0, 'ss': 0, 'gg': 0, 'allstars': 0, 'hof': True},
    'Harry Stovey': {'war': 45.0, 'mvp': 0, 'roy': 0, 'ss': 0, 'gg': 0, 'allstars': 0, 'hof': False},
    'Frank Grant': {'war': 45.0, 'mvp': 0, 'roy': 0, 'ss': 0, 'gg': 0, 'allstars': 0, 'hof': True},
    'Robert Abernathy': {'war': 12.5, 'mvp': 0, 'roy': 0, 'ss': 0, 'gg': 0, 'allstars': 0, 'hof': False},
    'Lennie Pearson': {'war': 12.0, 'mvp': 0, 'roy': 0, 'ss': 0, 'gg': 0, 'allstars': 6, 'hof': False}
}

def norm_fuzzy(s):
    n = norm(s)
    parts = n.split()
    if len(parts) >= 2:
        first = parts[0]
        if first in NICKNAMES:
            return NICKNAMES[first] + ' ' + ' '.join(parts[1:])
    return n

# Load Lahman & BBRef datasets (both Batting and Pitching WAR)
war_bat_df = pd.read_csv('lahman_1871-2025/war_daily_bat.txt', low_memory=False)
war_bat_df['WAR'] = pd.to_numeric(war_bat_df['WAR'].replace('NULL', 0), errors='coerce').fillna(0)

war_pitch_df = pd.read_csv('lahman_1871-2025/war_daily_pitch.txt', low_memory=False)
war_pitch_df['WAR'] = pd.to_numeric(war_pitch_df['WAR'].replace('NULL', 0), errors='coerce').fillna(0)

war_combined = pd.concat([
    war_bat_df[['player_ID', 'name_common', 'WAR']],
    war_pitch_df[['player_ID', 'name_common', 'WAR']]
], ignore_index=True)

# 1) WAR by player_ID in combined daily war
war_pid = war_combined.groupby('player_ID')['WAR'].sum().to_dict()

# 2) WAR by name_common in combined daily war
war_name_sum = war_combined.groupby('name_common')['WAR'].sum().to_dict()
war_name_map = {}
for k, v in war_name_sum.items():
    if isinstance(k, str):
        val = round(float(v), 1)
        war_name_map[norm(k)] = val
        war_name_map[norm_fuzzy(k)] = val

people_df = pd.read_csv('lahman_1871-2025/People.csv')

# Link People.csv to war_pid via bbrefID and playerID
people_df['career_war'] = people_df['bbrefID'].map(war_pid).fillna(people_df['playerID'].map(war_pid))

awards_df = pd.read_csv('lahman_1871-2025/AwardsPlayers.csv')
allstar_df = pd.read_csv('lahman_1871-2025/AllstarFull.csv')
hof_df = pd.read_csv('lahman_1871-2025/HallOfFame.csv')

hof_pids = set(hof_df[hof_df['inducted'] == 'Y']['playerID'].unique())

mvp_pid = awards_df[awards_df['awardID'] == 'Most Valuable Player'].groupby('playerID').size().to_dict()
roy_pid = awards_df[awards_df['awardID'] == 'Rookie of the Year'].groupby('playerID').size().to_dict()
ss_pid = awards_df[awards_df['awardID'] == 'Silver Slugger'].groupby('playerID').size().to_dict()
gg_pid = awards_df[awards_df['awardID'] == 'Gold Glove'].groupby('playerID').size().to_dict()
cy_pid = awards_df[awards_df['awardID'] == 'Cy Young Award'].groupby('playerID').size().to_dict()

# Reliever of the Year (Reliever of the Year, TSN Reliever of the Year, TSN Fireman of the Year, Rolaids Relief Man)
reliever_ids = [
    'Reliever of the Year Award',
    'Reliever of the Year',
    'TSN Reliever of the Year',
    'TSN Fireman of the Year',
    'This Year in Baseball Closer of the Year'
]
rel_df = awards_df[awards_df['awardID'].isin(reliever_ids)]
rel_pid = rel_df.groupby(['playerID', 'yearID']).size().reset_index().groupby('playerID').size().to_dict()

as_pid = allstar_df.groupby('playerID').size().to_dict()

SR_JR_EXPLICIT = {
    "griffke01": "Ken Griffey Sr.",
    "griffke02": "Ken Griffey Jr.",
    "guerrvl01": "Vladimir Guerrero Sr.",
    "guerrvl02": "Vladimir Guerrero Jr.",
    "ripkeca01": "Cal Ripken Jr.",
    "wittbo01":  "Bobby Witt Sr.",
    "wittbo02":  "Bobby Witt Jr.",
    "tatafe01":  "Fernando Tatis Sr.",
    "tatafe02":  "Fernando Tatis Jr.",
    "younger01": "Eric Young Sr.",
    "younger03": "Eric Young Jr.",
    "alomasa01": "Sandy Alomar Sr.",
    "alomasa02": "Sandy Alomar Jr.",
    "gwynnto01": "Tony Gwynn",
    "gwynnto02": "Tony Gwynn Jr.",
    "cruzjo01":  "Jose Cruz Sr.",
    "cruzjo02":  "Jose Cruz Jr.",
    "borbope01": "Pedro Borbon Sr.",
    "borbope02": "Pedro Borbon Jr.",
    "stottme01": "Mel Stottlemyre Sr.",
    "stottme02": "Mel Stottlemyre Jr.",
    "acunaro01": "Ronald Acuña Jr.",
}

# 3) Traditional Batting Stats by playerID
bat_df = pd.read_csv('lahman_1871-2025/Batting.csv')
for col in ['G', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'SB', 'CS', 'BB', 'SO', 'IBB', 'HBP', 'SH', 'SF']:
    if col in bat_df:
        bat_df[col] = pd.to_numeric(bat_df[col], errors='coerce').fillna(0)

bat_agg = bat_df.groupby('playerID').agg({
    'G': 'sum', 'AB': 'sum', 'R': 'sum', 'H': 'sum',
    '2B': 'sum', '3B': 'sum', 'HR': 'sum', 'RBI': 'sum',
    'SB': 'sum', 'BB': 'sum', 'SO': 'sum', 'HBP': 'sum', 'SF': 'sum'
}).reset_index()

bat_stats = {}
for _, r in bat_agg.iterrows():
    pid = str(r['playerID']).strip()
    ab = int(r['AB'])
    h = int(r['H'])
    hr = int(r['HR'])
    rbi = int(r['RBI'])
    g = int(r['G'])
    sb = int(r['SB'])
    bb = int(r['BB'])
    hbp = int(r['HBP'])
    sf = int(r['SF'])
    d2 = int(r['2B'])
    d3 = int(r['3B'])
    
    avg_str = f"{(h / ab):.3f}".lstrip('0') if ab > 0 else ".000"
    if avg_str == '1.000': avg_str = "1.000"
    elif not avg_str: avg_str = ".000"
    
    obp = (h + bb + hbp) / (ab + bb + hbp + sf) if (ab + bb + hbp + sf) > 0 else 0
    tb = (h - d2 - d3 - hr) + 2*d2 + 3*d3 + 4*hr
    slg = (tb / ab) if ab > 0 else 0
    ops = obp + slg
    ops_str = f"{ops:.3f}"
    
    bat_stats[pid] = {
        'h': h, 'hr': hr, 'rbi': rbi, 'g': g, 'ab': ab, 'sb': sb,
        'avg': avg_str, 'ops': ops_str
    }

# 4) Traditional Pitching Stats by playerID
pitch_df = pd.read_csv('lahman_1871-2025/Pitching.csv')
for col in ['W', 'L', 'G', 'GS', 'CG', 'SHO', 'SV', 'IPouts', 'H', 'ER', 'HR', 'BB', 'SO']:
    if col in pitch_df:
        pitch_df[col] = pd.to_numeric(pitch_df[col], errors='coerce').fillna(0)

pitch_agg = pitch_df.groupby('playerID').agg({
    'W': 'sum', 'L': 'sum', 'G': 'sum', 'GS': 'sum', 'SV': 'sum',
    'IPouts': 'sum', 'H': 'sum', 'ER': 'sum', 'BB': 'sum', 'SO': 'sum'
}).reset_index()

pitch_stats = {}
for _, r in pitch_agg.iterrows():
    pid = str(r['playerID']).strip()
    w = int(r['W'])
    l = int(r['L'])
    sv = int(r['SV'])
    so = int(r['SO'])
    ipouts = int(r['IPouts'])
    ip_float = ipouts / 3.0
    er = int(r['ER'])
    bb = int(r['BB'])
    h = int(r['H'])
    
    era_val = f"{(er * 9.0 / ip_float):.2f}" if ip_float > 0 else "0.00"
    whip_val = f"{((bb + h) / ip_float):.2f}" if ip_float > 0 else "0.00"
    ip_val = f"{ip_float:.1f}"
    
    pitch_stats[pid] = {
        'w': w, 'l': l, 'sv': sv, 'so': so, 'ip': ip_val,
        'era': era_val, 'whip': whip_val
    }

# Build comprehensive lookup dict indexed by playerID, name_year, and homonym-aware fallback names
career_map = {}
pid_stats_db = {}

for _, row in people_df.iterrows():
    pid = str(row['playerID']).strip()
    f = str(row['nameFirst']).strip() if pd.notna(row['nameFirst']) else ''
    l = str(row['nameLast']).strip() if pd.notna(row['nameLast']) else ''
    
    war_val = row['career_war']
    if pd.isna(war_val):
        war_val = 0.0
    else:
        war_val = round(float(war_val), 1)

    stat_obj = {
        'war': war_val,
        'mvp': int(mvp_pid.get(pid, 0)),
        'roy': int(roy_pid.get(pid, 0)),
        'ss': int(ss_pid.get(pid, 0)),
        'gg': int(gg_pid.get(pid, 0)),
        'cy': int(cy_pid.get(pid, 0)),
        'rel': int(rel_pid.get(pid, 0)),
        'allstars': int(as_pid.get(pid, 0)),
        'hof': bool(pid in hof_pids)
    }

    # Attach traditional batting stats if present
    if pid in bat_stats:
        stat_obj.update(bat_stats[pid])

    # Attach traditional pitching stats if present
    if pid in pitch_stats:
        stat_obj.update(pitch_stats[pid])

    pid_stats_db[pid] = stat_obj
    career_map[pid] = stat_obj

    if pid in SR_JR_EXPLICIT:
        explicit_name = SR_JR_EXPLICIT[pid]
        career_map[explicit_name] = stat_obj
        career_map[norm(explicit_name)] = stat_obj
    else:
        full1 = f'{f} {l}'.strip()
        if full1:
            # Handle homonyms: keep entry with higher WAR or HOF status
            if full1 not in career_map:
                career_map[full1] = stat_obj
                career_map[norm(full1)] = stat_obj
            else:
                existing_war = career_map[full1].get('war') or -999.0
                new_war = stat_obj.get('war') or -999.0
                if stat_obj.get('hof') or new_war > existing_war:
                    career_map[full1] = stat_obj
                    career_map[norm(full1)] = stat_obj

# Explicitly map all 3,452 game cards by playerID and name_year
try:
    gc_df = pd.read_csv('game_cards.csv')
    for _, card in gc_df.iterrows():
        c_pid = str(card['playerID']).strip()
        c_name = str(card['name']).strip()
        c_year = str(int(card['peak_year'])) if pd.notna(card['peak_year']) else ''
        if c_pid in pid_stats_db:
            c_obj = pid_stats_db[c_pid]
            career_map[c_pid] = c_obj
            if c_year:
                career_map[f"{c_name}_{c_year}"] = c_obj
                career_map[norm(f"{c_name}_{c_year}")] = c_obj
except Exception as e:
    print("Warning loading game_cards.csv for exact mapping:", e)

for k, v in MANUAL_OVERRIDE.items():
    career_map[k] = v

print(f"Total entries in career_map: {len(career_map):,}")
print("Willie Davis (daviswi02):", career_map.get("daviswi02"))
print("Willie Davis_1964:", career_map.get("Willie Davis_1964"))

# Write to career_data.js
js_output = f"// Auto-generated career stats mapping from BBRef & Lahman data\n(function() {{\n  window.CAREER_STATS_DB = {json.dumps(career_map, separators=(',', ':'))};\n}})();\n"
with open('career_data.js', 'w', encoding='utf-8') as f:
    f.write(js_output)

print("Saved career_data.js successfully!")
