import pandas as pd

cards = pd.read_csv('game_cards.csv')
print("game_cards.csv columns:", cards.columns.tolist())
genesis_cards = cards[cards['peak_year_display'] <= 1900]
print("\nGenesis batters team distribution in game_cards.csv:")
print(genesis_cards['team'].value_counts())

print("\nSample Genesis batters with their team and franchise_name:")
print(genesis_cards[['name', 'peak_year_display', 'team', 'canonical_teamID']].head(25).to_string())
