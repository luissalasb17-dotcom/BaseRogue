import pandas as pd
import numpy as np

# Load game_cards.csv and inspect Monte Irvin defense
df = pd.read_csv('game_cards.csv')
irvin = df[df['name'].str.contains('Irvin', case=False, na=False)].iloc[0]

print(f"Monte Irvin: {irvin['name']} | DEF: {irvin['defense_val']} | Pos: {irvin['pos']}")

# Let's inspect defensive raw values across all players
# In paso_11_motor_defensivo:
# defense_base = rfield_sum or war_def_sum or proxy
# Let's check distribution of defense_base in lahman_etl_v5.py
war_bat = pd.read_csv('lahman_1871-2025/war_daily_bat.txt')
irvin_def = war_bat[war_bat['player_ID'] == 'irvinmo01']
print("\nMonte Irvin yearly runs_field:")
print(irvin_def[['year_ID', 'runs_field', 'runs_defense', 'WAR_def']])

print(f"Monte Irvin total runs_field: {irvin_def['runs_field'].sum()}")
print(f"Monte Irvin total WAR_def: {irvin_def['WAR_def'].sum()}")
