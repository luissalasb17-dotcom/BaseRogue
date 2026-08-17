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

# Roster: 5 SPs + 3 RPs
sps = [
    {"name": "SP1 Walter Johnson", "sta": 105},
    {"name": "SP2 Bob Gibson",     "sta": 95},
    {"name": "SP3 Clayton Kershaw", "sta": 85},
    {"name": "SP4 Mike Mussina",   "sta": 72},
    {"name": "SP5 Opener/Short SP", "sta": 48},
]
rps = [
    {"name": "RP1 Setup A", "outs": 0, "sv": 0},
    {"name": "RP2 Setup B", "outs": 0, "sv": 0},
    {"name": "RP3 Closer",  "outs": 0, "sv": 0},
]

sp_stats = {sp["name"]: {"outs": 0, "cg": 0, "starts": 0} for sp in sps}
rp_stats = {rp["name"]: {"outs": 0, "sv": 0} for rp in rps}

for game_idx in range(162):
    sp = sps[game_idx % 5]
    sp_stats[sp["name"]]["starts"] += 1
    
    rest_idx = game_idx % 3
    relievers = [rps[i] for i in range(3) if i != rest_idx]
    if (game_idx // 3) % 2 == 1:
        relievers = [relievers[1], relievers[0]]
        
    sp_max_inn = get_starter_max_innings(sp["sta"])
    
    for inning in range(1, 10):
        if inning <= sp_max_inn:
            sp_stats[sp["name"]]["outs"] += 3
        else:
            remaining = 9 - sp_max_inn
            if remaining <= 1:
                p = relievers[1]
            elif inning < 9:
                p = relievers[0]
            else:
                p = relievers[1]
            rp_stats[p["name"]]["outs"] += 3
            
    if sp_max_inn >= 9:
        sp_stats[sp["name"]]["cg"] += 1

print("=== 162-GAME SEASON PITCHING TOTALS ===")
print("STARTING ROTATION:")
for sp in sps:
    st = sp_stats[sp["name"]]
    ip = st["outs"] / 3.0
    print(f"{sp['name']:24} (STA {sp['sta']:3}) | Starts: {st['starts']} | IP: {ip:5.1f} | Avg IP/GS: {ip/st['starts']:.2f} | CGs: {st['cg']}")

print("\nBULLPEN:")
for rp in rps:
    st = rp_stats[rp["name"]]
    ip = st["outs"] / 3.0
    print(f"{rp['name']:24} | IP: {ip:5.1f}")
