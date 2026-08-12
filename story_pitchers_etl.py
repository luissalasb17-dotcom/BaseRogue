"""
BaseRogue ETL Pipeline - Story Mode Pitchers (single-season, per team-year)
Lahman + Baseball-Reference war_daily_pitch.txt  ->  opponents_database.js

Companion to pitchers_etl.py (the 7-year-peak Quick Play pool). This script was
written because opponents_database.js had no source script in the repo — only
the generated output existed, going back through ~15 commits of undocumented
hand-tuned formula changes. It intentionally REUSES pitchers_etl.py's formulas
(Bayesian-smoothed H9/K9/BB9/HR9, era-adjusted normalization, the cosmetic OVR
curve, and the rarity thresholds) applied to a SINGLE SEASON's stats per pitcher
instead of their best-7-years aggregate, per the user's direction that Story
Mode should feel like the "same formula, one-year sample" version of Quick Play.

Usage: pip install pandas numpy && python story_pitchers_etl.py
"""

import numpy as np
import pandas as pd
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "lahman_1871-2025"
OUT_JS   = Path(__file__).parent / "opponents_database.js"
OUT_JS_PREVIEW = Path(__file__).parent / "opponents_database.preview.js"

# ── Parametros — deben quedar en sync con pitchers_etl.py salvo donde se indique ──
MIN_IP_SEASON_ELIGIBLE = 10.0   # piso minimo de IP en la temporada para entrar a un roster de equipo (evita ruido de 1-2 apariciones)
GS_RATIO_SP_THRESHOLD  = 0.40   # mismo umbral que el split SP/RP de pitchers_etl.py

LOW_WINPCT_MAX  = 0.480   # < esto = tier "low"
HIGH_WINPCT_MIN = 0.560   # >= esto = tier "high"  (entre medio = "mid")

YEAR_MIN = 1901   # Story Mode solo ofrece 1901-2025 (season_select.year_label en la UI)
YEAR_MAX = 2025

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
    for start, end, label in ERA_THRESHOLDS:
        if start <= int(year) <= end:
            return label
    return "Modern Era (2016-Pres)"


def asignar_rareza(ovr):
    # Identico a pitchers_etl.py::asignar_rareza
    try:
        v = float(ovr)
    except (ValueError, TypeError):
        v = 50.0
    if v >= 88.0:
        return "Legendary"
    elif v >= 80.0:
        return "Epic"
    elif v >= 72.0:
        return "Rare"
    elif v >= 64.0:
        return "Uncommon"
    else:
        return "Common"


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


def normalize_difficulty_adjusted(df, col_raw, col_out, invert=False):
    # Identico al ajuste OPS+ de pitchers_etl.py, aplicado sobre filas de UNA
    # temporada — la poblacion de comparacion por era son todas las temporadas
    # individuales de esa era (no carreras-pico). Se probo tambien comparar
    # contra la poblacion de picos de Quick Play (mismo yardstick que carreras
    # completas), pero el usuario prefirio esta version: juzga cada temporada
    # contra sus pares de ESE mismo año/era, asi un Cy Young como el Cole 2023
    # puntua como lo mejor de su año en vez de compararse contra carreras
    # completas de leyendas — a costa de una tasa de Legendary mas alta
    # (~20% en vez de ~4.5%), que el usuario acepto conscientemente.
    s = df[col_raw].copy()
    if invert:
        s = -s
    global_mean = s.mean()
    era_means = df.groupby("era_label")[col_raw].transform("mean")
    if invert:
        era_means = -era_means
    diff_factor = global_mean / era_means.replace(0, 1)
    blended_factor = 1.0 + 0.75 * (diff_factor - 1.0)
    adjusted = s * blended_factor
    df[col_out] = normalize_series(adjusted, 1, 99).clip(1, 125).round(1)
    return df


def map_to_cosmetic_ovr_p(r):
    # Identico a pitchers_etl.py::paso_11_ovr_rareza::map_to_cosmetic_ovr_p
    if r is None or pd.isna(r):
        return 60.0
    val = float(r)
    if val <= 30.0:
        res = 50.0 + (val / 30.0) * 10.0
    elif val <= 45.0:
        res = 60.0 + ((val - 30.0) / 15.0) * 9.0
    elif val <= 58.0:
        res = 70.0 + ((val - 45.0) / 13.0) * 8.0
    elif val <= 74.0:
        res = 79.0 + ((val - 58.0) / 16.0) * 8.0
    elif val <= 85.0:
        res = 88.0 + ((val - 74.0) / 11.0) * 6.0
    else:
        res = 95.0 + min(4.0, ((val - 85.0) / 18.0) * 4.0)
    return round(res, 1)


def main():
    print("=" * 64)
    print("  STORY MODE PITCHERS ETL — single-season, Quick-Play-equivalent formulas")
    print("=" * 64)

    people   = pd.read_csv(DATA_DIR / "People.csv", low_memory=False)
    pitching = pd.read_csv(DATA_DIR / "Pitching.csv", low_memory=False)
    teams    = pd.read_csv(DATA_DIR / "Teams.csv", low_memory=False)
    fielding = pd.read_csv(DATA_DIR / "Fielding.csv", low_memory=False)
    war_pitch = pd.read_csv(DATA_DIR / "war_daily_pitch.txt", low_memory=False)

    # ── Pitchers puros (misma logica de carrera que pitchers_etl.py) ──────────
    field = fielding.copy()
    field["G"] = pd.to_numeric(field["G"], errors="coerce").fillna(0)
    pos_games = field.groupby(["playerID", "POS"])["G"].sum().reset_index()
    primary_pos = pos_games.sort_values("G", ascending=False).drop_duplicates(subset="playerID")
    pure_pitchers = set(primary_pos[primary_pos["POS"] == "P"]["playerID"])
    print(f"  {len(pure_pitchers):,} pitchers puros (career primary POS = P)")

    # ── Agregar Pitching.csv por jugador-temporada, sumando stints/equipos ────
    int_cols = ["G","GS","SV","IPouts","H","ER","HR","BB","SO","BFP","W","L"]
    for col in int_cols:
        pitching[col] = pd.to_numeric(pitching[col], errors="coerce").fillna(0)

    py = pitching.groupby(["playerID","yearID"]).agg(
        G=("G","sum"), GS=("GS","sum"), SV=("SV","sum"), IPouts=("IPouts","sum"),
        H=("H","sum"), ER=("ER","sum"), HR_a=("HR","sum"), BB=("BB","sum"), SO=("SO","sum"),
    ).reset_index()
    py["IP_y"] = py["IPouts"] / 3.0
    py = py[py["playerID"].isin(pure_pitchers)]
    py = py[py["IP_y"] >= MIN_IP_SEASON_ELIGIBLE]
    py = py[(py["yearID"] >= YEAR_MIN) & (py["yearID"] <= YEAR_MAX)]

    # Primary team ese anio: el stint/team donde jugo mas IP (para asignar roster)
    stint_ip = pitching.copy()
    stint_ip["IP_stint"] = pd.to_numeric(stint_ip["IPouts"], errors="coerce").fillna(0) / 3.0
    primary_team = (
        stint_ip.sort_values("IP_stint", ascending=False)
                .drop_duplicates(subset=["playerID","yearID"])
                [["playerID","yearID","teamID"]]
                .rename(columns={"teamID":"primary_team"})
    )
    py = py.merge(primary_team, on=["playerID","yearID"], how="left")

    # ── WAR anual (BBRef), misma logica que pitchers_etl.py ───────────────────
    war = war_pitch.copy()
    for col in ["WAR","GS","G","IPouts","ERA_plus"]:
        if col in war.columns:
            war[col] = pd.to_numeric(
                war[col].replace("NULL", np.nan) if isinstance(war[col].iloc[0], str) else war[col],
                errors="coerce"
            ).fillna(0)
    war_season = war.groupby(["player_ID","year_ID"]).agg(war_season=("WAR","sum")).reset_index()
    war_season.columns = ["bbrefID","yearID","war_season"]
    id_map = people[["playerID","bbrefID"]].dropna(subset=["bbrefID"])
    war_yearly = war_season.merge(id_map, on="bbrefID", how="left").dropna(subset=["playerID"])[["playerID","yearID","war_season"]]
    py = py.merge(war_yearly, on=["playerID","yearID"], how="left")

    # ── Rol por temporada (SP/RP) — mismo umbral que la nueva ponderacion de relevo ──
    gs_ratio = py["GS"] / py["G"].replace(0, np.nan)
    py["role"] = np.where(gs_ratio.fillna(0) >= GS_RATIO_SP_THRESHOLD, "SP", "RP")

    # ── Atributos RAW: identico a pitchers_etl.py paso_8, sobre UNA temporada ─
    ip_k = py["IP_y"]
    m_ip = 40.0
    py["h9_raw"]  = (py["H"]    + m_ip * (8.5/9.0)) / (ip_k + m_ip) * 9.0
    py["k9_raw"]  = (py["SO"]   + m_ip * (5.5/9.0)) / (ip_k + m_ip) * 9.0
    py["bb9_raw"] = (py["BB"]   + m_ip * (3.2/9.0)) / (ip_k + m_ip) * 9.0
    py["hr9_raw"] = (py["HR_a"] + m_ip * (0.9/9.0)) / (ip_k + m_ip) * 9.0

    is_sp = py["role"] == "SP"
    py["sta_raw"] = np.where(is_sp, py["IP_y"] / py["GS"].replace(0, np.nan), py["IP_y"] / py["G"].replace(0, np.nan))
    py["sta_raw"] = py["sta_raw"].fillna(0)

    py["era_label"] = py["yearID"].apply(assign_era)

    # ── Normalizacion era-relativa (poblacion = todas las temporadas de esa era) ──
    py = normalize_difficulty_adjusted(py, "h9_raw",  "h9_val",  invert=True)
    py = normalize_difficulty_adjusted(py, "k9_raw",  "k9_val",  invert=False)
    py = normalize_difficulty_adjusted(py, "bb9_raw", "bb9_val", invert=True)
    py = normalize_difficulty_adjusted(py, "hr9_raw", "hr9_val", invert=True)

    is_sp = py["role"] == "SP"
    sp_sta = (30.0 + (py["sta_raw"] / 7.0) * 55.0).clip(35.0, 110.0)
    rp_sta = (15.0 + py["sta_raw"] * 10.0).clip(15.0, 35.0)
    py["sta_val"] = np.where(is_sp, sp_sta, rp_sta).round(1)

    py["stf"] = py["k9_val"].round(0).astype(int)
    py["ctl"] = py["bb9_val"].round(0).astype(int)
    py["mov"] = py["hr9_val"].round(0).astype(int)
    py["sta"] = py["sta_val"].round(0).astype(int)
    py["h9"]  = py["h9_val"].round(0).astype(int)

    # ── OVR: identico 20/20/20/20/20 (H9/K9/BB9/HR9/STA) + curva cosmetica ────
    raw_ovr = (py["h9_val"]*0.20 + py["k9_val"]*0.20 + py["bb9_val"]*0.20 + py["hr9_val"]*0.20 + py["sta_val"]*0.20)
    py["ovr"] = raw_ovr.apply(map_to_cosmetic_ovr_p).round(0).astype(int)
    py["rarity"] = py["ovr"].apply(asignar_rareza)
    # HP viene de la stamina, no del OVR — identico a game.js::createPitcherObj
    # (SP: 45 + sta/99*75 | RP: 25 + sta/99*20), para que Quick Play y Story Mode
    # calculen el HP de la misma forma.
    sp_hp = 45.0 + (py["sta_val"] / 99.0) * 75.0
    rp_hp = 25.0 + (py["sta_val"] / 99.0) * 20.0
    py["hp"] = np.where(is_sp, sp_hp, rp_hp).round(0).astype(int)
    py["maxHp"] = py["hp"]

    # ── Nombres para mostrar ────────────────────────────────────────────────
    people_names = people[["playerID","nameFirst","nameLast"]].copy()
    py = py.merge(people_names, on="playerID", how="left")
    py["display_name"] = (py["nameFirst"].fillna("") + " " + py["nameLast"].fillna("")).str.strip()

    print(f"  {len(py):,} temporadas individuales elegibles (IP >= {MIN_IP_SEASON_ELIGIBLE})")

    # ── Construir rosters por equipo-anio ──────────────────────────────────
    teams_slim = teams[["yearID","teamID","name","W","L"]].copy()
    teams_slim["W"] = pd.to_numeric(teams_slim["W"], errors="coerce").fillna(0)
    teams_slim["L"] = pd.to_numeric(teams_slim["L"], errors="coerce").fillna(0)
    teams_slim["win_pct"] = (teams_slim["W"] / (teams_slim["W"] + teams_slim["L"]).replace(0, np.nan)).fillna(0).round(3)

    def pitcher_json(row):
        return {
            "name": row["display_name"],
            "role": row["role"],
            "war": round(float(row["war_season"]), 1) if pd.notna(row["war_season"]) else 0.0,
            "hp": int(row["hp"]), "maxHp": int(row["maxHp"]),
            "stf": int(row["stf"]), "ctl": int(row["ctl"]), "mov": int(row["mov"]), "sta": int(row["sta"]),
            "h9": int(row["h9"]),
            "ovr": int(row["ovr"]), "rarity": row["rarity"],
        }

    result = {}
    years = sorted(py["yearID"].unique())
    for year in years:
        year_pitchers = py[py["yearID"] == year].copy()
        year_teams = teams_slim[teams_slim["yearID"] == year]
        low, mid, high = [], [], []

        for _, trow in year_teams.iterrows():
            roster = year_pitchers[year_pitchers["primary_team"] == trow["teamID"]].copy()
            roster["war_sort"] = roster["war_season"].fillna(roster["IP_y"] / 50.0)
            roster = roster.sort_values("war_sort", ascending=False).head(3)
            if roster.empty:
                continue
            team_ovr = int(round(roster["ovr"].mean()))
            entry = {
                "id": f"story_{int(year)}_{trow['teamID']}",
                "name": f"{int(year)} {trow['name']}",
                "year": int(year),
                "teamID": trow["teamID"],
                "win_pct": float(trow["win_pct"]),
                "ovr": team_ovr,
                "pitchers": [pitcher_json(r) for _, r in roster.iterrows()],
            }
            wp = trow["win_pct"]
            if wp < LOW_WINPCT_MAX:
                low.append(entry)
            elif wp >= HIGH_WINPCT_MIN:
                high.append(entry)
            else:
                mid.append(entry)

        # Boss: mejores 3 pitchers del anio (cualquier equipo) por WAR
        boss_pool = year_pitchers.copy()
        boss_pool["war_sort"] = boss_pool["war_season"].fillna(boss_pool["IP_y"] / 50.0)
        boss_roster = boss_pool.sort_values("war_sort", ascending=False).head(3)
        boss = None
        if not boss_roster.empty:
            boss = {
                "id": f"story_{int(year)}_STARS_BOSS",
                "name": f"\U0001F451 {int(year)} STARS",
                "year": int(year),
                "teamID": "STARS",
                "win_pct": 1.0,
                "isBoss": True,
                "ovr": int(round(boss_roster["ovr"].mean())),
                "pitchers": [pitcher_json(r) for _, r in boss_roster.iterrows()],
            }

        result[str(int(year))] = {"year": int(year), "low": low, "mid": mid, "high": high, "boss": boss}

    print(f"  {len(result):,} anios procesados")

    js_content = "window.OpponentsDatabase = " + json.dumps(result, ensure_ascii=False, indent=2) + ";\n"
    with open(OUT_JS_PREVIEW, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"  [OK] Preview escrito en {OUT_JS_PREVIEW} (NO se sobreescribio opponents_database.js)")


if __name__ == "__main__":
    main()
