import pandas as pd

teams = pd.read_csv('lahman_1871-2025/Teams.csv')
batting = pd.read_csv('lahman_1871-2025/Batting.csv')

mlb_leagues = {'NL', 'AL', 'AA', 'UA', 'PL', 'NA', 'FL'}
nlb_leagues = {'NNL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN2', 'NAL', 'IND', 'INT', 'NAC', 'EAS', 'WES'}

b_df = pd.read_csv('game_cards.csv')
print("\nChecking all batters that were labeled NLB in game_cards.csv:")
for idx, r in b_df[b_df['team'] == 'NLB'].iterrows():
    pid = r['playerID']
    b_rows = batting[batting['playerID'] == pid]
    leagues = set(b_rows['lgID'].dropna().unique())
    is_mlb = bool(leagues.intersection(mlb_leagues))
    is_nlb = bool(leagues.intersection(nlb_leagues))
    if is_mlb and not is_nlb:
        print(f"ERROR: {r['name']} ({r['playerID']}) played in {leagues} (NO NLB) but is labeled NLB!")
