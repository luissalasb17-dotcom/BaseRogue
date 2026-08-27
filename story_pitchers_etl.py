"""
BaseRogue ETL Pipeline - Story Mode Pitchers (1901-2025, per team-year)
Lahman (Pitching.csv, Teams.csv, People.csv) -> opponents_database.js

Generates the full pitching staff for every MLB team from 1901 to 2025
filtered by IP >= 20.0, using the canonical Quick Play attributes:
H/9, K/9, BB/9, HR/9, STA (no legacy stf/ctl/mov).
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
import time

t0 = time.time()

BASE_DIR = Path(r"C:\Users\Administrador\.gemini\antigravity\scratch\baserogue")
DATA_DIR = BASE_DIR / "lahman_1871-2025"
OUT_JS   = BASE_DIR / "opponents_database.js"
OUT_PREVIEW = BASE_DIR / "opponents_database.preview.js"
OUT_ETL_FILE = BASE_DIR / "story_pitchers_etl.py"

print("=" * 64)
print("  BASE-ROGUE: GENERANDO OPPONENTS_DATABASE.JS (MODO HISTORIA)")
print("=" * 64)

# 1. Cargar tablas
print("\n[1/4] Cargando tablas de Lahman...")
df_pitch = pd.read_csv(DATA_DIR / "Pitching.csv", low_memory=False)
df_teams = pd.read_csv(DATA_DIR / "Teams.csv", low_memory=False)
df_people = pd.read_csv(DATA_DIR / "People.csv", low_memory=False)

# Filtro 1901-2025 y minimo 20 IP (IPouts >= 60)
df_pitch["IPouts"] = pd.to_numeric(df_pitch["IPouts"], errors="coerce").fillna(0)
df_pitch = df_pitch[(df_pitch["yearID"] >= 1901) & (df_pitch["yearID"] <= 2025) & (df_pitch["IPouts"] >= 60)].copy()

# Enriquecer nombres
df_pitch = df_pitch.merge(df_people[["playerID", "nameFirst", "nameLast"]], on="playerID", how="left")
df_pitch["display_name"] = (df_pitch["nameFirst"].fillna("") + " " + df_pitch["nameLast"].fillna("")).str.strip()

df_pitch["IP"] = df_pitch["IPouts"] / 3.0
df_pitch["GS"] = pd.to_numeric(df_pitch["GS"], errors="coerce").fillna(0)
df_pitch["G"]  = pd.to_numeric(df_pitch["G"], errors="coerce").fillna(1)
df_pitch["role"] = np.where(df_pitch["GS"] / df_pitch["G"].replace(0, 1) >= 0.50, "SP", "RP")

for col in ["H", "SO", "BB", "HR", "ER", "W", "L", "SV"]:
    df_pitch[col] = pd.to_numeric(df_pitch[col], errors="coerce").fillna(0)

# Suavizado bayesiano unificado para muestra de una temporada (m = 25 IP)
# Promedios estándar MLB: 8.5 H/9, 5.5 K/9, 3.2 BB/9, 0.9 HR/9
m_ip = 25.0
df_pitch["h9_raw"]  = (df_pitch["H"]  + m_ip * (8.5 / 9.0)) / (df_pitch["IP"] + m_ip) * 9.0
df_pitch["k9_raw"]  = (df_pitch["SO"] + m_ip * (5.5 / 9.0)) / (df_pitch["IP"] + m_ip) * 9.0
df_pitch["bb9_raw"] = (df_pitch["BB"] + m_ip * (3.2 / 9.0)) / (df_pitch["IP"] + m_ip) * 9.0
df_pitch["hr9_raw"] = (df_pitch["HR"] + m_ip * (0.9 / 9.0)) / (df_pitch["IP"] + m_ip) * 9.0
df_pitch["era_val"] = (df_pitch["ER"] * 9.0) / df_pitch["IP"]

def normalize_series(s, low=1.0, high=99.0):
    s = pd.to_numeric(s, errors="coerce")
    valid = s.dropna()
    if valid.empty or valid.nunique() == 1:
        return pd.Series(50.0, index=s.index)
    p02 = valid.quantile(0.02)
    p98 = valid.quantile(0.98)
    if p98 == p02:
        return pd.Series(50.0, index=s.index)
    scaled = (s - p02) / (p98 - p02)
    scaled = scaled.clip(lower=0)
    rating = scaled * (high - low) + low
    return rating.clip(upper=125.0)

def map_ip_to_sta(ip):
    if ip is None or pd.isna(ip): return 45.0
    val = float(ip)
    if val <= 50.0:
        return 15.0 + (val / 50.0) * 10.0
    elif val <= 80.0:
        return 25.0 + ((val - 50.0) / 30.0) * 15.0
    elif val <= 130.0:
        return 40.0 + ((val - 80.0) / 50.0) * 20.0
    elif val <= 175.0:
        return 60.0 + ((val - 130.0) / 45.0) * 18.0
    elif val <= 225.0:
        return 78.0 + ((val - 175.0) / 50.0) * 14.0
    elif val <= 290.0:
        return 92.0 + ((val - 225.0) / 65.0) * 14.0
    else:
        return 106.0 + min(19.0, ((val - 290.0) / 100.0) * 19.0)

def map_to_cosmetic_ovr_p(r):
    if r is None or pd.isna(r):
        return 50.0
    val = float(r)
    if val <= 48.0:
        res = 50.0 + ((val - 15.0) / 33.0) * 9.9
    elif val <= 56.0:
        res = 60.0 + ((val - 48.0) / 8.0) * 9.9
    elif val <= 66.0:
        res = 70.0 + ((val - 56.0) / 10.0) * 9.9
    elif val <= 78.0:
        res = 80.0 + ((val - 66.0) / 12.0) * 9.9
    else:
        res = 90.0 + min(9.9, ((val - 78.0) / 18.0) * 9.9)
    return round(res, 1)

def asignar_rareza(ovr):
    if ovr >= 90.0: return "Legendary"
    if ovr >= 80.0: return "Epic"
    if ovr >= 70.0: return "Rare"
    if ovr >= 60.0: return "Uncommon"
    return "Common"

print("\n[2/4] Normalizando ratings por temporada (H/9, K/9, BB/9, HR/9, STA)...")
records = []
for year, ydf in df_pitch.groupby("yearID"):
    ydf = ydf.copy()
    # Inversión de signo para estadísticas donde menor es mejor (H/9, BB/9, HR/9)
    ydf["h9"]  = normalize_series(-ydf["h9_raw"]).round(1)
    ydf["k9"]  = normalize_series(ydf["k9_raw"]).round(1)
    ydf["bb9"] = normalize_series(-ydf["bb9_raw"]).round(1)
    ydf["hr9"] = normalize_series(-ydf["hr9_raw"]).round(1)
    
    ydf["sta"] = ydf["IP"].apply(map_ip_to_sta).round(1)
    
    # Ponderación 20% canónica idéntica a Quick Play
    ydf["raw_ovr"] = (
        ydf["h9"]  * 0.20 +
        ydf["k9"]  * 0.20 +
        ydf["bb9"] * 0.20 +
        ydf["hr9"] * 0.20 +
        ydf["sta"] * 0.20
    )
    
    ydf["ovr"] = ydf["raw_ovr"].apply(map_to_cosmetic_ovr_p)
    ydf["rarity"] = ydf["ovr"].apply(asignar_rareza)
    records.append(ydf)

df_all = pd.concat(records, ignore_index=True)

# 3. Estructurar base de datos
print("\n[3/4] Agrupando equipos y rotaciones completas por temporada...")
full_db = {}
years = sorted(df_all["yearID"].unique())

DIV_NAMES = {"E": "East", "W": "West", "C": "Central"}

for year in years:
    y_pitchers = df_all[df_all["yearID"] == year]
    y_teams = df_teams[df_teams["yearID"] == year]
    
    teams_list = []
    
    for _, trow in y_teams.iterrows():
        tid = trow["teamID"]
        t_pitch = y_pitchers[y_pitchers["teamID"] == tid].sort_values("ovr", ascending=False)
        if len(t_pitch) == 0:
            continue
            
        win_pct = round(float(trow["W"]) / float(trow["G"]), 3) if trow["G"] > 0 else 0.500
        
        # Formatear división
        div_str = None
        if pd.notna(trow.get("divID")) and pd.notna(trow.get("lgID")):
            div_code = str(trow["divID"])
            div_str = f"{trow['lgID']} {DIV_NAMES.get(div_code, div_code)}"
            
        plist = []
        for _, p in t_pitch.iterrows():
            plist.append({
                "name": p["display_name"],
                "playerID": p["playerID"],
                "role": p["role"],
                "ovr": int(round(p["ovr"])),
                "rarity": p["rarity"],
                "h9": int(round(p["h9"])),
                "k9": int(round(p["k9"])),
                "bb9": int(round(p["bb9"])),
                "hr9": int(round(p["hr9"])),
                "sta": int(round(p["sta"])),
                "ip": round(float(p["IP"]), 1),
                "era": round(float(p["era_val"]), 2),
                "w": int(p["W"]),
                "l": int(p["L"]),
                "sv": int(p["SV"]),
                "so": int(p["SO"]),
                "bb": int(p["BB"]),
                "h": int(p["H"]),
                "hr": int(p["HR"]),
                "team": tid,
                "year": int(year)
            })
            
        team_entry = {
            "id": f"story_{int(year)}_{tid}",
            "name": f"{int(year)} {trow['name']}",
            "teamID": tid,
            "year": int(year),
            "win_pct": win_pct,
            "division": div_str,
            "league": trow["lgID"] if pd.notna(trow.get("lgID")) else None,
            "ovr": int(round(np.mean([p["ovr"] for p in plist[:5]]))), # OVR promedio del top 5
            "total_pitchers": len(plist),
            "pitchers": plist
        }
        teams_list.append(team_entry)
        
    full_db[str(int(year))] = {
        "year": int(year),
        "teams": teams_list
    }

# 4. Escribir a disco
print("\n[4/4] Escribiendo opponents_database.js...")
js_content = f"window.OpponentsDatabase = {json.dumps(full_db, separators=(',', ':'), ensure_ascii=False)};\n"

with open(OUT_JS, "w", encoding="utf-8") as f:
    f.write(js_content)

with open(OUT_PREVIEW, "w", encoding="utf-8") as f:
    f.write(js_content)

# Save the python script to workspace
with open(OUT_ETL_FILE, "w", encoding="utf-8") as f:
    with open(__file__, "r", encoding="utf-8") as current_f:
        f.write(current_f.read())

t1 = time.time()
print(f"\n[OK] opponents_database.js generado exitosamente en {round(t1 - t0, 2)}s.")
print(f"     Total temporadas: {len(full_db)} (1901-2025)")
print(f"     Total lanzadores: {len(df_all):,}")
