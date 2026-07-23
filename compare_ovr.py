import pandas as pd

df = pd.read_csv('game_cards.csv')

# Calculate current score
df["score_30"] = (
    df["contact_val"] * 0.30 +
    df["power_val"]   * 0.30 +
    df["speed_val"]   * 0.15 +
    df["defense_val"] * 0.15 +
    df["eye_val"]     * 0.10
).round(1)

# Calculate proposed score
df["score_35"] = (
    df["contact_val"] * 0.35 +
    df["power_val"]   * 0.35 +
    df["speed_val"]   * 0.10 +
    df["defense_val"] * 0.10 +
    df["eye_val"]     * 0.10
).round(1)

df["diff"] = (df["score_35"] - df["score_30"]).round(1)

print("=== MAYORES SUBIDAS (Beneficiados por 35/35) ===")
top_up = df.nlargest(10, "diff")[["name", "pos", "score_30", "score_35", "diff", "contact_val", "power_val", "speed_val", "defense_val"]]
print(top_up.to_string(index=False))

print("\n=== MAYORES CAIDAS (Perjudicados por 35/35) ===")
top_down = df.nsmallest(10, "diff")[["name", "pos", "score_30", "score_35", "diff", "contact_val", "power_val", "speed_val", "defense_val"]]
print(top_down.to_string(index=False))

print("\n=== TOP 15 ABSOLUTO (Con 35/35) ===")
top_15 = df.nlargest(15, "score_35")[["name", "pos", "score_30", "score_35", "diff"]]
print(top_15.to_string(index=False))
