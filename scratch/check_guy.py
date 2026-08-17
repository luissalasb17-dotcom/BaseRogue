import pandas as pd

p_df = pd.read_csv('pitchers_pool.csv')
p = p_df[p_df['playerID'] == 'heckegu01'].iloc[0]
print(f"Name: {p['name']}, Team: {p['team']}, Era: {p['era']}, Year: {p['peak_year_display']}")

# Check all Genesis pitchers
genesis_p = p_df[p_df['era'] == 'The Genesis Era (1871-1900)']
print("\nGenesis Era pitchers team distribution:")
print(genesis_p['team'].value_counts())

# Check how many NLB pitchers remain and who they are
nlb_p = p_df[p_df['team'] == 'NLB']
print(f"\nRemaining NLB pitchers count: {len(nlb_p)}")
print("Sample NLB pitchers:", nlb_p['name'].head(10).tolist())
