import pandas as pd
import numpy as np

teams = pd.read_csv('lahman_1871-2025/Teams.csv')
pitching = pd.read_csv('lahman_1871-2025/Pitching.csv')
batting = pd.read_csv('lahman_1871-2025/Batting.csv')

mlb_leagues = {'NL', 'AL', 'AA', 'UA', 'PL', 'NA', 'FL'}
nlb_leagues = {'NNL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN2', 'NAL', 'IND', 'INT', 'NAC', 'EAS', 'WES'}

FRANCHISE_MAP = {
    'NYY': 'NYY', 'NYA': 'NYY',
    'NYM': 'NYM', 'NYN': 'NYM',
    'CHW': 'CHW', 'CHA': 'CHW',
    'CHC': 'CHC', 'CHN': 'CHC',
    'LAD': 'LAD', 'LAN': 'LAD', 'BRO': 'LAD',
    'SFG': 'SFG', 'SFN': 'SFG', 'NY1': 'SFG',
    'STL': 'STL', 'SLN': 'STL', 'SL4': 'STL',
    'BAL': 'BAL', 'SLA': 'BAL', 'ML2': 'BAL',
    'ATL': 'ATL', 'BSN': 'ATL', 'ML1': 'ATL', 'BS1': 'ATL', 'BS2': 'ATL',
    'OAK': 'OAK', 'PHA': 'OAK', 'KCA': 'OAK', 'KC1': 'OAK',
    'MIN': 'MIN', 'WS1': 'MIN',
    'WSH': 'WSH', 'MON': 'WSH', 'WAS': 'WSH',
    'TEX': 'TEX', 'WS2': 'TEX',
    'LAA': 'LAA', 'ANA': 'LAA', 'CAL': 'LAA',
    'MIA': 'MIA', 'FLA': 'MIA', 'FLO': 'MIA',
    'MIL': 'MIL', 'ML4': 'MIL', 'SE1': 'MIL',
    'TB':  'TB',  'TBD': 'TB',  'TBA': 'TB',
    'SDP': 'SDP', 'SDN': 'SDP',
    'CIN': 'CIN', 'CN1': 'CIN', 'CN2': 'CIN',
    'CLE': 'CLE', 'CL4': 'CLE',
    'BOS': 'BOS', 'BOS1': 'BOS',
    'DET': 'DET',
    'PIT': 'PIT', 'PIT1': 'PIT',
    'PHI': 'PHI', 'PH1': 'PHI', 'PH2': 'PHI',
    'HOU': 'HOU', 'HOU1': 'HOU',
    'TOR': 'TOR',
    'KCR': 'KCR',
    'SEA': 'SEA',
    'COL': 'COL',
    'ARI': 'ARI',
}

# Real NLB teamIDs and franchIDs
nlb_teams_only = set(teams[teams['lgID'].isin(nlb_leagues)]['teamID'].unique()) - set(teams[teams['lgID'].isin(mlb_leagues)]['teamID'].unique())
nlb_franch_only = set(teams[teams['lgID'].isin(nlb_leagues)]['franchID'].dropna().unique()) - set(teams[teams['lgID'].isin(mlb_leagues)]['franchID'].dropna().unique())

NLB_LEGENDS = {
    'Turkey Stearnes', 'Wade Johnston', 'Oscar Charleston', 'Satchel Paige', 'Josh Gibson',
    'Cool Papa Bell', 'Buck Leonard', 'Pop Lloyd', 'Bullet Rogan', 'Mule Suttles',
    'Willie Wells', 'Leon Day', 'Ray Brown', 'Smokey Joe Williams', 'Bill Byrd',
    'Nip Winters', 'Hilton Smith', 'Cristóbal Torriente', 'Martin Dihigo', 'Jud Wilson',
    'Biz Mackey', 'Louis Santop', 'Andy Cooper', 'Bill Foster', 'José Méndez',
    'Willie Foster', 'George Scales', 'Dick Lundy', 'Alejandro Oms'
}

def resolve_team(row):
    t = str(row.get("canonical_teamID", row.get("team", "UNK"))).strip()
    franch = str(row.get("franchID", "")).strip()
    p_name = str(row.get("name", row.get("full_name", ""))).strip()

    # 1. First check if it's an active modern MLB franchise lineage
    if franch in FRANCHISE_MAP:
        return FRANCHISE_MAP[franch]
    if t in FRANCHISE_MAP:
        return FRANCHISE_MAP[t]

    # 2. Check if player is an iconic NLB legend
    if any(nlb_n.lower() in p_name.lower() for nlb_n in NLB_LEGENDS):
        return "NLB"

    # 3. Check if team/franch is strictly a Negro Leagues team
    if t in nlb_teams_only or franch in nlb_franch_only:
        return "NLB"

    # 4. Otherwise, it's a historical defunct franchise (AA, NA, UA, PL, FL, 19th c. NL)
    return "HIST"

print("Testing resolve_team on Guy Hecker, Toad Ramsey, Bud Daley, Satchel Paige, Ray Brown:")
test_cases = [
    {"name": "Guy Hecker", "team": "LS2", "franchID": "LOU"},
    {"name": "Toad Ramsey", "team": "LS2", "franchID": "LOU"},
    {"name": "Bud Daley", "team": "KC1", "franchID": "OAK"},
    {"name": "Satchel Paige", "team": "KCM", "franchID": "KCM"},
    {"name": "Ray Brown", "team": "HOM", "franchID": "HOM"},
    {"name": "Dupee Shaw", "team": "WS8", "franchID": "WNL"},
    {"name": "George Bradley", "team": "SL3", "franchID": "SBS"},
]
for tc in test_cases:
    print(f"{tc['name']}: {resolve_team(tc)}")
