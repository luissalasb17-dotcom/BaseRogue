import pandas as pd

teams = pd.read_csv('lahman_1871-2025/Teams.csv')
pitching = pd.read_csv('lahman_1871-2025/Pitching.csv')
batting = pd.read_csv('lahman_1871-2025/Batting.csv')

mlb_leagues = {'NL', 'AL', 'AA', 'UA', 'PL', 'NA', 'FL'}
nlb_leagues = {'NNL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN2', 'NAL', 'IND', 'INT', 'NAC', 'EAS', 'WES'}

# Teams that are strictly in Negro Leagues (never in MLB leagues)
nlb_teams_only = set(teams[teams['lgID'].isin(nlb_leagues)]['teamID'].unique()) - set(teams[teams['lgID'].isin(mlb_leagues)]['teamID'].unique())
nlb_franch_only = set(teams[teams['lgID'].isin(nlb_leagues)]['franchID'].dropna().unique()) - set(teams[teams['lgID'].isin(mlb_leagues)]['franchID'].dropna().unique())

print("Strictly NLB teamIDs count:", len(nlb_teams_only))
print("Strictly NLB franchIDs count:", len(nlb_franch_only))

# Check pitchers
p_df = pd.read_csv('pitchers_pool.csv')
print("\nChecking all pitchers that were labeled NLB:")
for idx, r in p_df[p_df['team'] == 'NLB'].iterrows():
    pid = r['playerID']
    p_rows = pitching[pitching['playerID'] == pid]
    leagues = set(p_rows['lgID'].dropna().unique())
    is_mlb = bool(leagues.intersection(mlb_leagues))
    is_nlb = bool(leagues.intersection(nlb_leagues))
    if is_mlb and not is_nlb:
        print(f"ERROR: {r['name']} ({r['playerID']}) played in {leagues} (NO NLB) but is labeled NLB!")
