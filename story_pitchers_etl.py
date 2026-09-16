"""
BaseRogue Story Mode Pitchers ETL - v2.0 (Clutch & 6-Stat MLB The Show Suite)
Lahman Pitching.csv + war_daily_pitch.txt -> opponents_database.js

Attributes per Pitcher:
  h9, k9, bb9, hr9, sta, clt (and clu alias)
OVR formula:
  20% H/9 + 20% K/9 + 20% BB/9 + 20% HR/9 + 10% STA + 10% CLT
Scale:
  All attributes strictly 1 to 125.
"""

import os
import json
from pathlib import Path
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "lahman_1871-2025"
DB_JS = BASE_DIR / "opponents_database.js"
PREVIEW_JS = BASE_DIR / "opponents_database.preview.js"
OUT_CSV = BASE_DIR / "story_mode_pitchers.csv"
OUT_SUMMARY = BASE_DIR / "story_pitchers_database_summary.json"

ERA_THRESHOLDS = [
    (1871, 1900, "The Genesis Era (1871-1900)"),
    (1901, 1919, "Deadball (1901-1919)"),
    (1920, 1941, "Golden Era (1920-1941)"),
    (1942, 1960, "Integration (1942-1960)"),
    (1961, 1976, "Expansion (1961-1976)"),
    (1977, 1993, "Big Hair Era (1977-1993)"),
    (1994, 2005, "Steroid Era (1994-2005)"),
    (2006, 2015, "Efficiency Era (2006-2015)"),
    (2016, 9999, "Modern Era (2016-Pres)"),
]

def assign_era(year):
    y = int(year)
    for start, end, label in ERA_THRESHOLDS:
        if start <= y <= end:
            return label
    return "Modern Era (2016-Pres)"

def normalize_series(s, low=1.0, high=105.0):
    valid = s.dropna()
    p02 = valid.quantile(0.02)
    p98 = valid.quantile(0.98)
    if p98 == p02:
        return pd.Series(50.0, index=s.index)
    scaled = (s - p02) / (p98 - p02)
    scaled = scaled.clip(lower=0)
    rating = scaled * (high - low) + low
    return rating.clip(upper=125.0)

def normalize_diff_adj(df_in, col_raw, col_out, era_col="era_label"):
    s = df_in[col_raw].copy()
    global_mean = s.mean()
    era_means = df_in.groupby(era_col)[col_raw].transform("mean")
    diff_factor = global_mean / era_means.replace(0, 1)
    blended_factor = 1.0 + 0.75 * (diff_factor - 1.0)
    adjusted = s * blended_factor
    df_in[col_out] = normalize_series(adjusted).clip(1.0, 125.0).round(0)
    return df_in

def asignar_rareza(ovr):
    try:
        v = float(ovr)
    except (ValueError, TypeError):
        v = 50.0
    if v >= 90.0:
        return "Legendary"
    elif v >= 80.0:
        return "Epic"
    elif v >= 70.0:
        return "Rare"
    elif v >= 60.0:
        return "Uncommon"
    else:
        return "Common"

def to_grade(val):
    v = float(val)
    if v >= 100: return "S"
    if v >= 95:  return "A+"
    if v >= 85:  return "A"
    if v >= 80:  return "A-"
    if v >= 75:  return "B+"
    if v >= 65:  return "B"
    if v >= 60:  return "B-"
    if v >= 55:  return "C+"
    if v >= 45:  return "C"
    if v >= 40:  return "C-"
    if v >= 35:  return "D+"
    if v >= 25:  return "D"
    if v >= 20:  return "D-"
    return "F"

def run_story_pitchers_etl():
    print("=" * 64)
    print("  BaseRogue Story Mode Pitchers ETL - Clutch & 6-Stat Suite")
    print("=" * 64)

    # 1. Cargar Pitching.csv
    print("\n[1/5] Cargando Pitching.csv y war_daily_pitch.txt...")
    pitching = pd.read_csv(DATA_DIR / "Pitching.csv", low_memory=False)
    for col in ["HBP", "H", "BB", "HR", "ER", "IPouts", "SO"]:
        pitching[col] = pd.to_numeric(pitching[col], errors="coerce").fillna(0)
    pitching["year"] = pitching["yearID"]

    p_agg = pitching.groupby(["playerID", "year", "teamID"]).agg({
        "H": "sum", "BB": "sum", "HBP": "sum", "HR": "sum", "ER": "sum", "IPouts": "sum", "SO": "sum"
    }).reset_index()

    # 2. Cargar war_daily_pitch.txt para Leverage Index
    war_path = DATA_DIR / "war_daily_pitch.txt"
    if war_path.exists():
        war = pd.read_csv(war_path, low_memory=False)
        war_agg = war.groupby(["player_ID", "year_ID"]).agg({
            "GR_leverage_index_avg": "mean"
        }).reset_index().rename(columns={"player_ID": "playerID", "year_ID": "year", "GR_leverage_index_avg": "li"})
    else:
        war_agg = pd.DataFrame(columns=["playerID", "year", "li"])

    # 3. Cargar opponents_database.js
    print("\n[2/5] Cargando opponents_database.js...")
    with open(DB_JS, "r", encoding="utf-8") as f:
        text = f.read().strip()
    prefix = "window.OpponentsDatabase = "
    if text.startswith(prefix):
        json_str = text[len(prefix):].rstrip(";")
    else:
        json_str = text
    data = json.loads(json_str)

    pitchers_flat = []
    for yr_str, yr_data in data.items():
        year = int(yr_str)
        for team in yr_data.get("teams", []):
            team_id = team["teamID"]
            for idx, p in enumerate(team.get("pitchers", [])):
                pitchers_flat.append({
                    "year_key": yr_str,
                    "year": year,
                    "team_id": team_id,
                    "p_idx": idx,
                    "playerID": p["playerID"],
                    "name": p["name"],
                    "role": p.get("role", "SP"),
                    "h9": p["h9"],
                    "k9": p["k9"],
                    "bb9": p["bb9"],
                    "hr9": p["hr9"],
                    "sta": p["sta"],
                    "ip": p.get("ip", 0),
                    "era": p.get("era", 0),
                })

    df = pd.DataFrame(pitchers_flat)
    print(f"  Total pitchers extraídos: {len(df):,}")

    # Merge con Pitching y WAR
    df = pd.merge(df, p_agg, on=["playerID", "year"], how="left", suffixes=("", "_agg"))
    df = pd.merge(df, war_agg, on=["playerID", "year"], how="left")
    df["li"] = df["li"].fillna(1.0)
    df["era_label"] = df["year"].apply(assign_era)

    # 4. Calcular Clutch (LOB% + Modulador LI)
    print("\n[3/5] Calculando Clutch (LOB% suavizado + Leverage Index)...")
    h = df["H"].fillna(0)
    bb = df["BB"].fillna(0)
    hbp = df["HBP"].fillna(0)
    hr = df["HR"].fillna(0)
    er = df["ER"].fillna(0)

    denom_lob = (h + bb + hbp - 1.4 * hr).clip(lower=1.0)
    num_lob = (h + bb + hbp - er).clip(lower=0.0)
    m_lob = 25.0
    lob_smooth = ((num_lob + m_lob * 0.720) / (denom_lob + m_lob)).clip(0.50, 0.95)
    li_mod = (df["li"] - 1.0).clip(-0.5, 1.5) * 5.0
    df["clt_raw"] = lob_smooth * 100.0 + li_mod

    # Normalización difficulty adjusted per era
    df = normalize_diff_adj(df, "clt_raw", "clt_val")
    df["clt_int"] = df["clt_val"].astype(int)

    # 5. Calcular OVR con ponderación 20/20/20/20/10/10
    print("\n[4/5] Calculando OVR oficial 20/20/20/20/10/10...")
    df["raw_ovr"] = (
        df["h9"] * 0.20 +
        df["k9"] * 0.20 +
        df["bb9"] * 0.20 +
        df["hr9"] * 0.20 +
        df["sta"] * 0.10 +
        df["clt_val"] * 0.10
    )

    p35 = float(df["raw_ovr"].quantile(0.35))
    p65 = float(df["raw_ovr"].quantile(0.65))
    p85 = float(df["raw_ovr"].quantile(0.85))
    p975 = float(df["raw_ovr"].quantile(0.975))

    def map_ovr(r):
        if r <= p35:
            res = 50.0 + ((r - 15.0) / max(0.1, (p35 - 15.0))) * 9.9
        elif r <= p65:
            res = 60.0 + ((r - p35) / max(0.1, (p65 - p35))) * 9.9
        elif r <= p85:
            res = 70.0 + ((r - p65) / max(0.1, (p85 - p65))) * 9.9
        elif r <= p975:
            res = 80.0 + ((r - p85) / max(0.1, (p975 - p85))) * 9.9
        else:
            res = 90.0 + min(9.9, ((r - p975) / 25.0) * 9.9)
        return int(round(res))

    df["ovr_final"] = df["raw_ovr"].apply(map_ovr).clip(50, 99)
    df["rarity_final"] = df["ovr_final"].apply(asignar_rareza)

    # 6. Actualizar diccionario en memoria
    print("\n[5/5] Actualizando base de datos JSON y exportando...")
    lookup = {}
    for _, row in df.iterrows():
        key = (row["year_key"], row["team_id"], int(row["p_idx"]))
        lookup[key] = {
            "clt": int(row["clt_int"]),
            "clu": int(row["clt_int"]),
            "ovr": int(row["ovr_final"]),
            "rarity": str(row["rarity_final"])
        }

    for yr_str, yr_data in data.items():
        for team in yr_data.get("teams", []):
            team_id = team["teamID"]
            for idx, p in enumerate(team.get("pitchers", [])):
                key = (yr_str, team_id, idx)
                if key in lookup:
                    vals = lookup[key]
                    p["clt"] = vals["clt"]
                    p["clu"] = vals["clu"]
                    p["ovr"] = vals["ovr"]
                    p["rarity"] = vals["rarity"]

    # Escribir JS
    js_content = f"window.OpponentsDatabase = {json.dumps(data, separators=(',', ':'))};"
    with open(DB_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"  [OK] opponents_database.js escrito ({len(js_content):,} bytes)")

    with open(PREVIEW_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"  [OK] opponents_database.preview.js sincronizado")

    print("\n============================================================")
    print("  ETL STORY PITCHERS COMPLETADO EXITOSAMENTE")
    print("============================================================\n")

if __name__ == "__main__":
    run_story_pitchers_etl()
