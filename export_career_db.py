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
as_pid = allstar_df.groupby('playerID').size().to_dict()

SR_JR_EXPLICIT = {
    "griffke01": "Ken Griffey Sr.",
    "griffke02": "Ken Griffey Jr.",
    "guerrvl01": "Vladimir Guerrero Sr.",
    "guerrvl02": "Vladimir Guerrero Jr.",
    "ripkeca01": "Cal Ripken Sr.",
    "ripkeca02": "Cal Ripken Jr.",
    "wittbo01":  "Bobby Witt Sr.",
    "wittbo02":  "Bobby Witt Jr.",
    "tatafe01":  "Fernando Tatis Sr.",
    "tatafe02":  "Fernando Tatis Jr.",
    "younger01": "Eric Young Sr.",
    "younger03": "Eric Young Jr.",
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
        'allstars': int(as_pid.get(pid, 0)),
        'hof': bool(pid in hof_pids)
    }

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
