import pandas as pd
import json
import re
import unicodedata

def normalize_name(n):
    if not n:
        return ""
    n = re.sub(r'\s\(.*?\)$', '', n)
    n = re.sub(r'\s+(Jr\.|Sr\.|III|II|IV)$', '', n, flags=re.IGNORECASE)
    # Remove dots and accents
    n = n.replace('.', '')
    n = ''.join(c for c in unicodedata.normalize('NFD', n) if unicodedata.category(c) != 'Mn')
    n = re.sub(r'[^a-zA-Z\s]', '', n)
    return n.lower().strip()

# Load Lahman & BBRef datasets
war_df = pd.read_csv('lahman_1871-2025/war_daily_bat.txt', low_memory=False)
war_df['WAR'] = pd.to_numeric(war_df['WAR'].replace('NULL', 0), errors='coerce').fillna(0)

# Group by name_common
war_sum_raw = war_df.groupby('name_common')['WAR'].sum().to_dict()
war_norm = {}
for name, val in war_sum_raw.items():
    if isinstance(name, str):
        war_norm[normalize_name(name)] = round(float(val), 1)

awards_df = pd.read_csv('lahman_1871-2025/AwardsPlayers.csv')
allstar_df = pd.read_csv('lahman_1871-2025/AllstarFull.csv')
people_df = pd.read_csv('lahman_1871-2025/People.csv')

people_df['name_common'] = people_df['nameFirst'].fillna('').str.strip() + ' ' + people_df['nameLast'].fillna('').str.strip()
id_to_name = people_df.set_index('playerID')['name_common'].to_dict()

def map_by_norm(df_grouped):
    d = {}
    for pid, count in df_grouped.items():
        if pid in id_to_name:
            name = id_to_name[pid]
            d[normalize_name(name)] = int(count)
    return d

mvp_dict = map_by_norm(awards_df[awards_df['awardID'] == 'Most Valuable Player'].groupby('playerID').size())
roy_dict = map_by_norm(awards_df[awards_df['awardID'] == 'Rookie of the Year'].groupby('playerID').size())
ss_dict = map_by_norm(awards_df[awards_df['awardID'] == 'Silver Slugger'].groupby('playerID').size())
gg_dict = map_by_norm(awards_df[awards_df['awardID'] == 'Gold Glove'].groupby('playerID').size())
as_dict = map_by_norm(allstar_df.groupby('playerID').size())

# Read game_cards_pool.js to extract all player objects/names
with open('game_cards_pool.js', 'r', encoding='utf-8') as f:
    content = f.read()

names = set(re.findall(r'name:\s*"([^"]+)"', content))

career_map = {}
matched_count = 0

for name in sorted(names):
    clean_name = re.sub(r'\s\(.*?\)$', '', name).strip()
    norm = normalize_name(clean_name)
    war_val = war_norm.get(norm)
    
    if war_val is not None:
        matched_count += 1
        career_map[clean_name] = {
            'war': war_val,
            'mvp': mvp_dict.get(norm, 0),
            'roy': roy_dict.get(norm, 0),
            'ss': ss_dict.get(norm, 0),
            'gg': gg_dict.get(norm, 0),
            'allstars': as_dict.get(norm, 0)
        }
    else:
        career_map[clean_name] = {
            'war': None,
            'mvp': mvp_dict.get(norm, 0),
            'roy': roy_dict.get(norm, 0),
            'ss': ss_dict.get(norm, 0),
            'gg': gg_dict.get(norm, 0),
            'allstars': as_dict.get(norm, 0)
        }

print(f"Matched {matched_count} / {len(names)} unique player names in game_cards_pool.js")

# Minify output JS to save space
js_output = f"// Auto-generated career stats mapping from BBRef & Lahman data\n(function() {{\n  window.CAREER_STATS_DB = {json.dumps(career_map, separators=(',', ':'))};\n}})();\n"
with open('career_data.js', 'w', encoding='utf-8') as f:
    f.write(js_output)

print("Saved minified career_data.js successfully!")
