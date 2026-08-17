import numpy as np

def get_starter_max_innings(sta):
    base = 3.8 + (max(20, min(120, sta)) - 20) * 0.048
    roll = (np.random.random() - 0.45) * 1.5
    max_inn = max(3, min(9, int(round(base + roll))))
    if sta >= 95 and np.random.random() < 0.25:
        return 9
    if sta >= 105 and np.random.random() < 0.45:
        return 9
    return max_inn

# Simulate 32 starts for different stamina tiers:
tiers = [
    ("Vintage Iron (Walter Johnson / Old Hoss)", 105),
    ("Historic Workhorse (Gibson / Nolan Ryan)", 95),
    ("Modern Ace (Kershaw / Verlander)", 85),
    ("Quality Starter (Average SP)", 70),
    ("5-Inning Starter (Low Stamina)", 50)
]

print("Simulating 162-game season (32-33 starts per SP):")
for label, sta in tiers:
    innings_list = [get_starter_max_innings(sta) for _ in range(33)]
    total_ip = sum(innings_list)
    avg_ip = np.mean(innings_list)
    cg_count = sum(1 for inn in innings_list if inn == 9)
    print(f"{label:42} | STA {sta:3} | Total IP: {total_ip:3} | Avg IP/Start: {avg_ip:.2f} | CGs: {cg_count}")
