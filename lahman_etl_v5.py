"""
BaseRogue ETL Pipeline  -  VERSION FINAL 5.0 (7-Year Peak + OPS+ Normalization + runs_br Speed)
Lahman + Baseball-Reference war_daily_bat.txt  ->  game_cards.csv
Version : 5.0
Cambios v5.0: Pico 7 temporadas | 100% Pico (Sin carrera) | Normalizacion OPS+ | SPD 40/40/20 runs_br
Uso: pip install pandas numpy && python lahman_etl_v5.py
"""

import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent / "lahman_1871-2025"
OUT_CSV  = Path(__file__).parent / "game_cards.csv"
OUT_JS   = Path(__file__).parent / "game_cards_pool.js"

MIN_AB_CAREER      = 1500
MIN_AB_ALLSTAR_HOF = 100
PEAK_SEASONS       = 7
W_PEAK             = 1.00
W_CAREER           = 0.00
W_RFIELD           = 0.60
W_WARDEF           = 0.40
GG_BONUS_PER_AWARD = 2
GG_BONUS_MAX       = 32

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

GRADE_THRESHOLDS = [
    (100, "S"),
    (80, "A"),
    (60, "B"),
    (40, "C"),
    (20, "D"),
    (0,  "F"),
]

RARITY_THRESHOLDS = [
    (74, "Legendary"),  # ~4.5% elite all-time legends
    (58, "Epic"),       # ~10% excelentes estrellas / HOF
    (48, "Rare"),       # ~17% buenos titulares
    (39, "Uncommon"),   # ~29% jugadores promedio
    (0,  "Common"),     # ~39% base / utility
]

POS_DISPLAY_MAP = {
    "C":  "C",  "1B": "1B", "2B": "2B", "3B": "3B", "SS": "SS",
    "LF": "LF", "CF": "CF", "RF": "RF", "OF": "RF", "DH": "DH",
}


def assign_era(year):
    for start, end, label in ERA_THRESHOLDS:
        if start <= int(year) <= end:
            return label
    return "Modern Era (2016-Pres)"


def to_grade(val):
    if pd.isna(val):
        return "F"
    v = float(val)
    for threshold, grade in GRADE_THRESHOLDS:
        if v >= threshold:
            return grade
    return "F"


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


def normalize_difficulty_adjusted(df, col_raw, col_out):
    global_mean = df[col_raw].mean()
    era_means = df.groupby("era_label")[col_raw].transform("mean")
    diff_factor = global_mean / era_means.replace(0, 1)
    blended_factor = 1.0 + 0.75 * (diff_factor - 1.0)
    adjusted = df[col_raw] * blended_factor
    df[col_out] = (
        normalize_series(adjusted)
        .clip(1, 125)
        .round(1)
    )
    return df


def normalize_globally(df, col_raw, col_out):
    df[col_out] = (
        normalize_series(df[col_raw])
        .clip(1, 125)
        .round(1)
    )
    return df


# ===========================================================================
# PASO 1 - CARGA DE TODOS LOS ARCHIVOS DE ENTRADA
# ===========================================================================
def paso_1_cargar_datos():
    print("=" * 64)
    print("  PASO 1: Cargando archivos de entrada...")
    print("=" * 64)
    dfs = {}
    lahman_files = {
        "people":       "People.csv",
        "batting":      "Batting.csv",
        "fielding":     "Fielding.csv",
        "fielding_of":  "FieldingOFsplit.csv",
        "allstar":      "AllstarFull.csv",
        "hof":          "HallOfFame.csv",
        "teams":        "Teams.csv",
        "franchises":   "TeamsFranchises.csv",
        "awards":       "AwardsPlayers.csv",
    }
    for key, fname in lahman_files.items():
        path = DATA_DIR / fname
        if path.exists():
            dfs[key] = pd.read_csv(path, low_memory=False)
            print(f"  [OK]  {fname:<30}  {len(dfs[key]):>9,} filas")
        else:
            print(f"  [!!]  {fname:<30}  ** NO ENCONTRADO **")
            dfs[key] = pd.DataFrame()
    war_path = DATA_DIR / "war_daily_bat.txt"
    if war_path.exists():
        dfs["war_bat"] = pd.read_csv(war_path, low_memory=False)
        print(f"  [OK]  {'war_daily_bat.txt':<30}  {len(dfs['war_bat']):>9,} filas")
    else:
        print("  [!!]  war_daily_bat.txt  ** NO ENCONTRADO **")
        dfs["war_bat"] = pd.DataFrame()
    return dfs


# ===========================================================================
# PASO 2 - FILTRADO ESTRICTO DE PITCHERS POR POSICION PRIMARIA (CRITICO)
# ===========================================================================
def paso_2_filtrar_pitchers(fielding):
    """
    REGLA ABSOLUTA: Si la posicion con mayor acumulacion de G en Fielding.csv
    es 'P', el jugador es Lanzador Puro y queda EXCLUIDO sin excepcion alguna,
    incluso si figura en AllstarFull o HallOfFame.
    """
    print("\n  PASO 2: Filtrado estricto de pitchers por posicion primaria...")
    if fielding.empty:
        print("  [!!] Fielding.csv vacio")
        return set()
    field = fielding.copy()
    field["G"] = pd.to_numeric(field["G"], errors="coerce").fillna(0)
    pos_games = field.groupby(["playerID", "POS"])["G"].sum().reset_index()
    primary_pos = (
        pos_games.sort_values("G", ascending=False)
                 .drop_duplicates(subset="playerID")
    )
    pure_pitchers = set(primary_pos[primary_pos["POS"] == "P"]["playerID"])
    print(f"  {len(pure_pitchers):,} lanzadores puros identificados y excluidos del pool")
    return pure_pitchers


# ===========================================================================
# PASO 3 - ESTADISTICAS DE CARRERA COMPLETA
# ===========================================================================
def paso_3_carrera_batting(batting):
    """
    Agrega Batting.csv a nivel de carrera completa (todas las temporadas y stints).
    PA = AB + BB + HBP + SF  (denominador correcto para k_rate y bb_rate).
    """
    print("\n  PASO 3: Agregando estadisticas de carrera (todas las temporadas)...")
    bat = batting.copy()
    int_cols = ["AB","H","2B","3B","HR","BB","SO","SB","CS","HBP","SF","IBB","G","RBI","R"]
    for col in int_cols:
        if col in bat.columns:
            bat[col] = pd.to_numeric(bat[col], errors="coerce").fillna(0)

    career = bat.groupby("playerID").agg(
        career_ab    =("AB",     "sum"),
        career_h     =("H",      "sum"),
        career_2b    =("2B",     "sum"),
        career_3b    =("3B",     "sum"),
        career_hr    =("HR",     "sum"),
        career_bb    =("BB",     "sum"),
        career_so    =("SO",     "sum"),
        career_sb    =("SB",     "sum"),
        career_cs    =("CS",     "sum"),
        career_hbp   =("HBP",    "sum"),
        career_sf    =("SF",     "sum"),
        career_g     =("G",      "sum"),
        career_rbi   =("RBI",    "sum"),
        seasons      =("yearID", "count"),
        debut_year   =("yearID", "min"),
        last_year    =("yearID", "max"),
    ).reset_index()

    career["debut_year"] = career["debut_year"].astype(int)
    career["last_year"]  = career["last_year"].astype(int)

    career["career_pa"] = (
        career["career_ab"] + career["career_bb"] +
        career["career_hbp"] + career["career_sf"]
    ).replace(0, np.nan)

    ab_c = career["career_ab"].replace(0, np.nan)
    pa_c = career["career_pa"]

    career["career_ba"]       = career["career_h"] / ab_c
    career["career_obp"]      = (career["career_h"] + career["career_bb"] + career["career_hbp"]) / pa_c
    career["career_slg"]      = (career["career_h"] + career["career_2b"] + 2*career["career_3b"] + 3*career["career_hr"]) / ab_c
    career["career_iso"]      = (career["career_2b"] + 2*career["career_3b"] + 3*career["career_hr"]) / ab_c
    career["career_k_rate"]   = career["career_so"] / pa_c
    career["career_bb_rate"]  = career["career_bb"] / pa_c
    career["career_xbh_rate"] = (career["career_2b"] + career["career_3b"] + career["career_hr"]) / ab_c
    career["career_hr_rate"]  = career["career_hr"] / ab_c

    sb_cs = (career["career_sb"] + career["career_cs"]).replace(0, np.nan)
    career["career_sb_eff"]       = (career["career_sb"] / sb_cs).fillna(0.65)
    career["career_sb_vol_log"]   = np.log1p(career["career_sb"])
    career["career_extra_base_f"] = (career["career_sb"] + career["career_3b"]) / ab_c

    print(f"  {len(career):,} jugadores con estadisticas de carrera")
    return career


# ===========================================================================
# PASO 4 - SELECCION DEL PICO DE 5 MEJORES TEMPORADAS
# ===========================================================================
def paso_4_pico_batting(batting, war_bat, people):
    """
    Ranking de temporadas (prioridad):
      1. WAR anual de war_daily_bat.txt (si disponible)
      2. OPS anual (OBP + SLG) como fallback para eras historicas sin WAR
    Agrega totales de las PEAK_SEASONS mejores temporadas.
    PA = AB + BB + HBP + SF dentro del pico.
    """
    print(f"\n  PASO 4: Seleccionando el pico de {PEAK_SEASONS} mejores temporadas...")
    bat = batting.copy()
    for col in ["AB","H","2B","3B","HR","BB","SO","SB","CS","HBP","SF","G"]:
        if col in bat.columns:
            bat[col] = pd.to_numeric(bat[col], errors="coerce").fillna(0)

    bat_yearly = bat.groupby(["playerID","yearID"]).agg(
        AB  =("AB",  "sum"), H   =("H",   "sum"),
        B2  =("2B",  "sum"), B3  =("3B",  "sum"),
        HR  =("HR",  "sum"), BB  =("BB",  "sum"),
        SO  =("SO",  "sum"), SB  =("SB",  "sum"),
        CS  =("CS",  "sum"), HBP =("HBP", "sum"),
        SF  =("SF",  "sum"),
    ).reset_index()

    bat_yearly["PA_y"] = (bat_yearly["AB"] + bat_yearly["BB"] + bat_yearly["HBP"] + bat_yearly["SF"]).replace(0, np.nan)
    ab_y = bat_yearly["AB"].replace(0, np.nan)
    pa_y = bat_yearly["PA_y"]
    bat_yearly["OBP_y"] = (bat_yearly["H"] + bat_yearly["BB"] + bat_yearly["HBP"]) / pa_y
    bat_yearly["SLG_y"] = (bat_yearly["H"] + bat_yearly["B2"] + 2*bat_yearly["B3"] + 3*bat_yearly["HR"]) / ab_y
    bat_yearly["OPS_y"] = bat_yearly["OBP_y"].fillna(0) + bat_yearly["SLG_y"].fillna(0)

    war_yearly = pd.DataFrame()
    if not war_bat.empty and not people.empty:
        war = war_bat.copy()
        war["WAR"] = pd.to_numeric(
            war["WAR"].replace("NULL", np.nan) if "WAR" in war.columns else np.nan,
            errors="coerce"
        ).fillna(0)
        war_season = war.groupby(["player_ID","year_ID"])["WAR"].sum().reset_index()
        war_season.columns = ["bbrefID","yearID","war_season"]
        id_map = people[["playerID","bbrefID"]].dropna(subset=["bbrefID"])
        war_yearly = (
            war_season.merge(id_map, on="bbrefID", how="left")
                      .dropna(subset=["playerID"])[["playerID","yearID","war_season"]]
        )
        print(f"  WAR anual para {war_yearly['playerID'].nunique():,} jugadores (BBRef)")
    else:
        print("  WAR no disponible - usando OPS fallback")

    if not war_yearly.empty:
        bat_yearly = bat_yearly.merge(war_yearly, on=["playerID","yearID"], how="left")
    else:
        bat_yearly["war_season"] = np.nan

    def seleccionar_pico(group):
        g = group.copy()
        if g["war_season"].notna().any():
            g = g.sort_values("war_season", ascending=False, na_position="last")
        else:
            g = g.sort_values("OPS_y", ascending=False, na_position="last")
        return g.head(PEAK_SEASONS)

    pico_df = bat_yearly.groupby("playerID", group_keys=True).apply(seleccionar_pico)
    pico_df = pico_df.reset_index(level=0)

    # El peak_year de era es la mediana de las 7 mejores temporadas (para determinar su era de forma representativa)
    peak_median = pico_df.groupby("playerID")["yearID"].median().reset_index().rename(columns={"yearID": "peak_year"})
    peak_median["peak_year"] = peak_median["peak_year"].round().astype(int)

    # El peak_year_display es el año de su mejor rendimiento individual (máximo WAR/OPS, primera fila de cada grupo)
    peak_display = pico_df.groupby("playerID").first().reset_index()[["playerID", "yearID"]].rename(columns={"yearID": "peak_year_display"})

    peak = pico_df.groupby("playerID").agg(
        peak_ab  =("AB",  "sum"), peak_h   =("H",   "sum"),
        peak_2b  =("B2",  "sum"), peak_3b  =("B3",  "sum"),
        peak_hr  =("HR",  "sum"), peak_bb  =("BB",  "sum"),
        peak_so  =("SO",  "sum"), peak_sb  =("SB",  "sum"),
        peak_cs  =("CS",  "sum"), peak_hbp =("HBP", "sum"),
        peak_sf  =("SF",  "sum"),
    ).reset_index()

    peak = peak.merge(peak_median, on="playerID", how="left")
    peak = peak.merge(peak_display, on="playerID", how="left")

    peak["peak_pa"] = (peak["peak_ab"] + peak["peak_bb"] + peak["peak_hbp"] + peak["peak_sf"]).replace(0, np.nan)
    ab_p = peak["peak_ab"].replace(0, np.nan)
    pa_p = peak["peak_pa"]

    peak["peak_ba"]       = peak["peak_h"] / ab_p
    peak["peak_obp"]      = (peak["peak_h"] + peak["peak_bb"] + peak["peak_hbp"]) / pa_p
    peak["peak_slg"]      = (peak["peak_h"] + peak["peak_2b"] + 2*peak["peak_3b"] + 3*peak["peak_hr"]) / ab_p
    peak["peak_iso"]      = (peak["peak_2b"] + 2*peak["peak_3b"] + 3*peak["peak_hr"]) / ab_p
    peak["peak_k_rate"]   = peak["peak_so"] / pa_p
    peak["peak_bb_rate"]  = peak["peak_bb"] / pa_p
    peak["peak_xbh_rate"] = (peak["peak_2b"] + peak["peak_3b"] + peak["peak_hr"]) / ab_p
    peak["peak_hr_rate"]  = peak["peak_hr"] / ab_p

    sb_cs_p = (peak["peak_sb"] + peak["peak_cs"]).replace(0, np.nan)
    peak["peak_sb_eff"]       = (peak["peak_sb"] / sb_cs_p).fillna(0.65)
    peak["peak_sb_vol_log"]   = np.log1p(peak["peak_sb"])
    peak["peak_extra_base_f"] = (peak["peak_sb"] + peak["peak_3b"]) / ab_p

    print(f"  Pico calculado para {len(peak):,} jugadores")
    return peak


# ===========================================================================
# PASO 5 - METRICAS DEL PICO DE 7 TEMPORADAS (100% Peak 7 Seasons)
# ===========================================================================
def paso_5_hibrido(career, peak):
    """
    Metrica_Final = 1.00 * Metrica_Pico + 0.00 * Metrica_Carrera
    (100% Pico de las 7 mejores temporadas por WAR)
    """
    print(f"\n  PASO 5: Metricas del Pico de 7 mejores temporadas (100% Peak por WAR)...")
    df = career.merge(peak, on="playerID", how="left")

    def hibrido(pk, cr, default=None):
        p = df[pk].copy() if pk in df.columns else pd.Series(np.nan, index=df.index)
        c = df[cr].copy() if cr in df.columns else pd.Series(np.nan, index=df.index)
        p_f = p.fillna(c if default is None else default)
        c_f = c.fillna(p if default is None else default)
        return W_PEAK * p_f + W_CAREER * c_f

    df["ba"]              = hibrido("peak_ba",          "career_ba",          0.0)
    df["obp"]             = hibrido("peak_obp",         "career_obp",         0.0)
    df["slg"]             = hibrido("peak_slg",         "career_slg",         0.0)
    df["iso"]             = hibrido("peak_iso",         "career_iso",         0.0)
    df["k_rate"]          = hibrido("peak_k_rate",      "career_k_rate",      0.25)
    df["bb_rate"]         = hibrido("peak_bb_rate",     "career_bb_rate",     0.06)
    df["xbh_rate"]        = hibrido("peak_xbh_rate",    "career_xbh_rate",    0.0)
    df["hr_rate"]         = hibrido("peak_hr_rate",     "career_hr_rate",     0.0)
    df["sb_efficiency"]   = hibrido("peak_sb_eff",      "career_sb_eff",      0.65)
    df["sb_volume_log"]   = hibrido("peak_sb_vol_log",  "career_sb_vol_log",  0.0)
    df["extra_base_freq"] = hibrido("peak_extra_base_f","career_extra_base_f",0.0)

    vol_max = df["sb_volume_log"].replace(0, np.nan).max()
    vol_max = vol_max if pd.notna(vol_max) and vol_max > 0 else 1.0
    df["sb_score"] = df["sb_efficiency"] * 0.30 + (df["sb_volume_log"] / vol_max) * 0.70

    print(f"  Metricas hibridas para {len(df):,} jugadores")
    return df


# ===========================================================================
# PASO 6 - POSICION PRIMARIA DE BATEADORES (excluye P)
# ===========================================================================
def paso_6_posicion_bateadores(fielding, fielding_of):
    """
    Posicion con mayor G excluyendo 'P'. Refinamiento LF/CF/RF via FieldingOFsplit.
    fielding_pct y range_factor como proxy defensivo de respaldo.
    """
    print("\n  PASO 6: Posicion primaria de bateadores y metricas proxy...")
    if fielding.empty:
        return pd.DataFrame(columns=["playerID","primary_pos","primary_g","fielding_pct","range_factor"])

    field = fielding[fielding["POS"] != "P"].copy()
    for col in ["G","PO","A","E"]:
        if col in field.columns:
            field[col] = pd.to_numeric(field[col], errors="coerce").fillna(0)

    pos_games = field.groupby(["playerID","POS"])["G"].sum().reset_index()
    primary = (
        pos_games.sort_values("G", ascending=False)
                 .drop_duplicates(subset="playerID")
                 .rename(columns={"POS":"primary_pos","G":"primary_g"})
    )

    if not fielding_of.empty and "POS" in fielding_of.columns:
        fof = fielding_of.copy()
        fof["G"] = pd.to_numeric(fof.get("G", 0), errors="coerce").fillna(0)
        of_pos = (
            fof.groupby(["playerID","POS"])["G"].sum().reset_index()
               .sort_values("G", ascending=False)
               .drop_duplicates(subset="playerID")
               .rename(columns={"POS":"of_pos"})
        )
        primary = primary.merge(of_pos[["playerID","of_pos"]], on="playerID", how="left")
        mask_of = (primary["primary_pos"] == "OF") & primary["of_pos"].notna()
        primary.loc[mask_of, "primary_pos"] = primary.loc[mask_of, "of_pos"]
        primary.drop(columns=["of_pos"], inplace=True)

    career_field = field.groupby("playerID").agg(
        total_po=("PO","sum"), total_a=("A","sum"),
        total_e=("E","sum"),   total_fg=("G","sum"),
    ).reset_index()
    denom_f = (career_field["total_po"] + career_field["total_a"] + career_field["total_e"]).replace(0, np.nan)
    career_field["fielding_pct"] = (career_field["total_po"] + career_field["total_a"]) / denom_f
    career_field["range_factor"] = (career_field["total_po"] + career_field["total_a"]) / career_field["total_fg"].replace(0, np.nan)

    if not fielding_of.empty and "POS" in fielding_of.columns:
        # Get all specific outfield games
        of_games = fof.groupby(["playerID", "POS"])["G"].sum().reset_index()
        # Remove generic 'OF' from pos_games and append specific OF games
        pos_games = pos_games[pos_games["POS"] != "OF"]
        pos_games = pd.concat([pos_games, of_games], ignore_index=True)

    # Secondary positions: any mapped pos != primary_pos and != DH where G >= 75
    sec_df = pos_games.merge(primary[["playerID", "primary_pos"]], on="playerID", how="left")
    sec_df["pos_mapped"] = sec_df["POS"].map(POS_DISPLAY_MAP).fillna(sec_df["POS"])
    
    # If there are any remaining generic 'OF' unmapped, let's just drop them or keep them
    sec_df = sec_df[(sec_df["pos_mapped"] != sec_df["primary_pos"]) & (sec_df["pos_mapped"] != "DH") & (sec_df["pos_mapped"] != "OF")]
    sec_pos_grouped = sec_df.groupby(["playerID", "pos_mapped"])["G"].sum().reset_index()
    sec_pos_grouped = sec_pos_grouped[sec_pos_grouped["G"] >= 75]
    
    sec_pos_str = sec_pos_grouped.groupby("playerID")["pos_mapped"].apply(
        lambda x: ",".join(sorted(list(set(x))))
    ).reset_index().rename(columns={"pos_mapped": "sec_pos"})

    result = primary.merge(career_field, on="playerID", how="left")
    result = result.merge(sec_pos_str, on="playerID", how="left")
    result["sec_pos"] = result["sec_pos"].fillna("")
    print(f"  Posicion primaria para {len(result):,} bateadores (y sus posiciones secundarias)")
    return result


# ===========================================================================
# PASO 7 - ENRIQUECER CON PEOPLE.CSV
# ===========================================================================
def paso_7_enriquecer_people(df, people):
    print("\n  PASO 7: Enriqueciendo con People.csv (nombre, bbrefID, bats)...")
    if people.empty:
        return df
    slim = people[["playerID","nameFirst","nameLast","bbrefID","debut","bats"]].copy()
    slim["full_name"] = (slim["nameFirst"].fillna("") + " " + slim["nameLast"].fillna("")).str.strip()
    result = df.merge(slim, on="playerID", how="left")
    print(f"  bbrefID para {result['bbrefID'].notna().sum():,} jugadores")
    return result


# ===========================================================================
# PASO 8 - FILTRO DE INGESTA DEL CARD POOL
# ===========================================================================
def paso_8_filtro_ingesta(df, allstar, hof, pure_pitcher_ids):
    """
    CONDICION A: posicion primaria != 'P' (salvo excepcion Ohtani 'ohtansh01')
    CONDICION B:
        career_ab >= 1500  OR  ((All-Star OR HoF) AND career_ab >= 100)
    """
    print("\n  PASO 8: Filtro de ingesta del Card Pool...")
    allstar_ids = set(allstar["playerID"].unique()) if not allstar.empty else set()
    hof_ids = set()
    if not hof.empty and "inducted" in hof.columns:
        hof_inducted = hof[(hof["inducted"] == "Y") & (hof.get("category","Player") == "Player")]
        hof_ids = set(hof_inducted["playerID"].unique())
    print(f"  All-Stars: {len(allstar_ids):,}  |  HoF: {len(hof_ids):,}")

    # Excepcion Ohtani
    ohtani_id = 'ohtansh01'
    effective_pure_pitchers = set(p for p in pure_pitcher_ids if p != ohtani_id)

    no_pitchers = df[~df["playerID"].isin(effective_pure_pitchers)].copy()
    print(f"  No-pitchers elegibles: {len(no_pitchers):,}")

    mask = (
        (no_pitchers["career_ab"] >= MIN_AB_CAREER) |
        (
            (no_pitchers["playerID"].isin(allstar_ids) | no_pitchers["playerID"].isin(hof_ids)) &
            (no_pitchers["career_ab"] >= MIN_AB_ALLSTAR_HOF)
        )
    )
    eligible = no_pitchers[mask].copy()
    eligible["is_allstar"] = eligible["playerID"].isin(allstar_ids)
    eligible["is_hof"]     = eligible["playerID"].isin(hof_ids)

    if not allstar.empty:
        as_count = allstar.groupby("playerID").size().reset_index(name="allstar_selections")
        eligible = eligible.merge(as_count, on="playerID", how="left")
    else:
        eligible["allstar_selections"] = 0

    eligible["allstar_selections"] = eligible["allstar_selections"].fillna(0).astype(int)
    print(f"  Card Pool elegible: {len(eligible):,} jugadores")
    return eligible


# ===========================================================================
# PASO 9 - ASIGNAR ERA TEMATICA
# ===========================================================================
def paso_9_asignar_era(df):
    print("\n  PASO 9: Asignando Era Tematica por peak_year...")
    df["era_label"] = df["peak_year"].apply(assign_era)
    for era, cnt in df["era_label"].value_counts().sort_index().items():
        print(f"    {era[:46]:<46}: {cnt:4,}")
    return df


# ===========================================================================
# PASO 10 - CALCULAR ATRIBUTOS RAW DE BATEO (CON, PWR, EYE)
# ===========================================================================
def paso_10_atributos_raw_bateo(df):
    """
    Formulas sobre metricas hibridas (k_rate y bb_rate ya corregidos con PA):

    CON = 0.80 * BA_Final + 0.20 * (1 - k_rate_Final)
         Habilidad de batear de hit y evitar el ponche.

    PWR = 0.50 * ISO_Final + 0.30 * XBH_rate_Final + 0.20 * HR_rate_Final
         Poder real de bate en extra-bases.

    EYE = bb_rate_Final  (100% tasa de boletos - paciencia pura)
    """
    print("\n  PASO 10: Atributos RAW de bateo (CON, PWR, EYE)...")
    df = df.copy()
    df["contact_raw"] = df["ba"].fillna(0) * 0.80 + (1.0 - df["k_rate"].fillna(0)) * 0.20
    df["power_raw"] = (
        df["iso"].fillna(0)      * 0.50 +
        df["xbh_rate"].fillna(0) * 0.30 +
        df["hr_rate"].fillna(0)  * 0.20
    )
    df["eye_raw"] = df["bb_rate"].fillna(0)
    print("  contact_raw, power_raw, eye_raw calculados")
    return df


# ===========================================================================
# PASO 11 - MOTOR DEFENSIVO AVANZADO (Rfield + WAR_def + Proxy Lahman)
# ===========================================================================
def paso_11_motor_defensivo(df, war_bat, awards):
    """
    Si hay datos BBRef:  defense_base = 0.70 * runs_defense + 0.30 * WAR_def
    Sino (proxy Lahman): defense_base = 0.70 * fielding_pct + 0.30 * (range_factor / 6)
    Recopila Gold Gloves de AwardsPlayers.csv para el bono del Paso 13.
    """
    print("\n  PASO 11: Motor defensivo avanzado (Rfield + WAR_def + proxy)...")
    if not war_bat.empty:
        war = war_bat.copy()
        # Clean WAR, runs_defense, WAR_def, runs_br
        for col in ["runs_defense","WAR_def","WAR","runs_br"]:
            if col in war.columns:
                war[col] = pd.to_numeric(war[col].replace("NULL", np.nan), errors="coerce").fillna(0)
            else:
                war[col] = 0.0
        war["runs_defense"] = war["runs_defense"].clip(-80, 80)
        
        # Use top PEAK_SEASONS (7) seasons by WAR to determine peak defensive and running metrics
        war_sorted = war.sort_values(["player_ID", "WAR"], ascending=[True, False])
        war_peak = war_sorted.groupby("player_ID").head(PEAK_SEASONS)
        
        war_career = war_peak.groupby("player_ID").agg(
            rfield_career=("runs_defense","sum"),
            wardef_career=("WAR_def","sum"),
            runs_br_peak=("runs_br","sum"),
        ).reset_index().rename(columns={"player_ID":"bbrefID"})
        print(f"  Datos BBRef (Peak {PEAK_SEASONS}) para {len(war_career):,} jugadores")
    else:
        war_career = pd.DataFrame(columns=["bbrefID","rfield_career","wardef_career","runs_br_peak"])

    df = df.merge(war_career, on="bbrefID", how="left")
    df["runs_br_peak"] = df["runs_br_peak"].fillna(0.0)
    p02_br = df["runs_br_peak"].quantile(0.02)
    p98_br = df["runs_br_peak"].quantile(0.98)
    df["runs_br_norm"] = ((df["runs_br_peak"] - p02_br) / (p98_br - p02_br)).clip(lower=0, upper=2.0)

    n_war   = df["rfield_career"].notna().sum()
    n_proxy = df["rfield_career"].isna().sum()
    print(f"  Motor avanzado: {n_war:,}  |  Proxy Lahman: {n_proxy:,}")

    has_war = df["rfield_career"].notna()
    df["defense_base"] = np.where(
        has_war,
        W_RFIELD * df["rfield_career"].fillna(0) + W_WARDEF * (df["wardef_career"].fillna(0) * 10),
        np.nan
    )
    fp    = df["fielding_pct"].fillna(0.96)
    rf    = (df["range_factor"].fillna(2.0) / 6.0).clip(0, 1)
    proxy = W_RFIELD * fp + W_WARDEF * rf
    df["defense_base"]   = df["defense_base"].fillna(proxy)
    df["defense_source"] = np.where(has_war, "bbref_war", "lahman_proxy")

    if not awards.empty and "awardID" in awards.columns:
        gg       = awards[awards["awardID"] == "Gold Glove"]
        gg_count = gg.groupby("playerID").size().reset_index(name="gold_gloves")
        df       = df.merge(gg_count, on="playerID", how="left")
    else:
        df["gold_gloves"] = 0

    df["gold_gloves"] = df["gold_gloves"].fillna(0).astype(int)
    print(f"  Gold Gloves: {(df['gold_gloves'] > 0).sum():,} jugadores con al menos 1 GG")
    return df


# ===========================================================================
# PASO 12 - NORMALIZACION POR ERA (percentil 2-98, escala 1-99)
# ===========================================================================
def paso_12_normalizar_por_era(df):
    """
    Normaliza todos los atributos RAW usando el ajuste por dificultad de Era (estilo OPS+)
    y luego normaliza globalmente en escala 1-99.
    """
    print("\n  PASO 12: Normalizando por Era (OPS+ Dificultad) (percentil 2-98, escala 1-99)...")
    for raw, out in [
        ("contact_raw",  "contact_val"),
        ("power_raw",    "power_val"),
        ("eye_raw",      "eye_val"),
        ("defense_base",  "defense_val_base"),
    ]:
        df = normalize_difficulty_adjusted(df, raw, out)
    print("  contact_val, power_val, eye_val, defense_val_base normalizados con ajuste OPS+")
    return df


# ===========================================================================
# PASO 13 - BONO DE GUANTE DE ORO (post-normalizacion)
# ===========================================================================
def paso_13_bono_guante_de_oro(df):
    """
    defense_val = clip(defense_val_base + gold_gloves * GG_BONUS_PER_AWARD, 1, 99)
    Bono maximo = GG_BONUS_MAX = 6 puntos sobre escala 1-99.
    """
    print("\n  PASO 13: Bono de Guante de Oro (post-normalizacion)...")
    df = df.copy()
    gg_bonus = (df["gold_gloves"] * GG_BONUS_PER_AWARD).clip(0, GG_BONUS_MAX)
    df["gg_bonus"]    = gg_bonus
    df["defense_val"] = (df["defense_val_base"] + gg_bonus).clip(1, 125).round(1)
    top_gg = df[df["gold_gloves"] > 0].nlargest(5, "gold_gloves")[
        ["full_name","gold_gloves","defense_val_base","gg_bonus","defense_val"]
    ]
    if not top_gg.empty:
        print("  Top 5 receptores de bono GG:")
        print(top_gg.to_string(index=False))
    return df


# ===========================================================================
# PASO 14 - VELOCIDAD HIBRIDA SPD 60% Robos / 40% Baserunning (normalizado por Era)
# ===========================================================================
def paso_14_velocidad(df):
    """
    Combina metricas de carrera (robos, extrabases, carreras producidas en bases)
    para asignar un rating global de Velocidad (SPD) ajustado por la dificultad de la era.
    
    60% SB-score        = 0.50 * sb_efficiency + ... (normalizado al max de era)
    30% extra_base_freq = (Frecuencia de Triples y SB)
    10% runs_br_norm    = Corrido de bases inteligente (ya normalizado globalmente con techo 2.0)
    """
    print("\n  PASO 14: SPD hibrido (normalizado con ajuste OPS+ y techo 2.0)...")
    df = df.copy()

    # Calculamos el raw temporal para cada era
    def _calc_raw_speed(group):
        qual = group[group["career_ab"] >= 300]
        if qual.empty: qual = group
        sb_max = qual["sb_score"].quantile(0.98)
        xb_max = qual["extra_base_freq"].quantile(0.98)
        sb_c  = (group["sb_score"] / sb_max).clip(upper=2.0).fillna(0) if sb_max > 0 else pd.Series(0.0, index=group.index)
        xb_c  = (group["extra_base_freq"].fillna(0) / xb_max).clip(upper=2.0) if xb_max > 0 else pd.Series(0.0, index=group.index)
        
        # Combinacion de SPD: mayor peso a SB y Triples/SB (xb_c) para reflejar velocidad pura
        group["speed_raw_temp"] = sb_c * 0.45 + xb_c * 0.30 + group["runs_br_norm"] * 0.25
        return group

    df["era_temp_col"] = df["era_label"]
    df = df.groupby("era_label", group_keys=False).apply(_calc_raw_speed)
    df["era_label"] = df["era_temp_col"]
    if "era_label" not in df.columns:
        df = df.reset_index()

    # Ajuste por dificultad de era (Metodo A) - 75% Blended
    global_spd_mean = df["speed_raw_temp"].mean()
    era_spd_means = df.groupby("era_label")["speed_raw_temp"].transform("mean")
    
    diff_factor = global_spd_mean / era_spd_means.replace(0, 1)
    blended_factor = 1.0 + 0.75 * (diff_factor - 1.0)
    df["speed_raw_adj"] = df["speed_raw_temp"] * blended_factor
    
    df["speed_val"] = (
        normalize_series(df["speed_raw_adj"], 1, 99)
        .clip(1, 125)
        .round(1)
    )
    print("  speed_val calculado con ajuste OPS+")
    return df


# ===========================================================================
# PASO 15 - EQUIPO CANONICO, DATAFRAME FINAL Y EXPORTACION
# ===========================================================================
def asignar_rareza(row):
    hof_b     = 8 if row["is_hof"] else 0
    ast_b     = min(row["allstar_selections"] * 0.5, 6)
    eff_score = row["avg_attr_score"] + hof_b + ast_b
    for thr, label in RARITY_THRESHOLDS:
        if eff_score >= thr:
            return label
    return "Common"


def paso_15_equipo_y_exportar(df, batting, teams, franchises):
    """
    Asigna equipo canonico (mayor numero de temporadas), construye el
    DataFrame final y exporta game_cards.csv y game_cards_pool.js.
    """
    print("\n  PASO 15: Equipo canonico, DataFrame final y exportacion...")

    if not batting.empty:
        team_seasons = batting.groupby(["playerID","teamID"])["yearID"].count().reset_index()
        team_seasons.columns = ["playerID","teamID","team_count"]
        canonical = (
            team_seasons.sort_values("team_count", ascending=False)
                        .drop_duplicates(subset="playerID")
                        .rename(columns={"teamID":"canonical_teamID"})
        )
        df = df.merge(canonical[["playerID","canonical_teamID"]], on="playerID", how="left")
    else:
        df["canonical_teamID"] = "UNK"

    if not teams.empty and "franchID" in teams.columns:
        team_franch = teams[["teamID","franchID"]].drop_duplicates(subset=["teamID"])
        df = df.merge(team_franch, left_on="canonical_teamID", right_on="teamID", how="left")
        df.drop(columns=["teamID"], errors="ignore", inplace=True)
        if not franchises.empty and "franchName" in franchises.columns:
            df = df.merge(franchises[["franchID","franchName"]].drop_duplicates(subset=["franchID"]), on="franchID", how="left")
            df.rename(columns={"franchName":"franchise_name"}, inplace=True)
        else:
            df["franchise_name"] = df.get("canonical_teamID","UNK")
    else:
        df["franchise_name"] = df.get("canonical_teamID","UNK")

    df = df.drop_duplicates(subset=["playerID"]).copy()

    df["canonical_teamID"] = df["canonical_teamID"].fillna("UNK")
    df["franchise_name"]   = df["franchise_name"].fillna(df["canonical_teamID"])

    stat_cols = ["contact_val","power_val","eye_val","speed_val","defense_val"]
    # 5. Promedio de Atributos Globales (OVR) usando formula 35/35/10/10/10
    df["avg_attr_score"] = (
        df["contact_val"] * 0.35 +
        df["power_val"]   * 0.35 +
        df["speed_val"]   * 0.10 +
        df["defense_val"] * 0.10 +
        df["eye_val"]     * 0.10
    ).round(1)
    df["rarity"]         = df.apply(asignar_rareza, axis=1)
    df["pos_display"]    = df["primary_pos"].map(POS_DISPLAY_MAP).fillna("RF")

    for col, gcol in [
        ("contact_val","con_grade"),("power_val","pow_grade"),
        ("eye_val","eye_grade"),("speed_val","spd_grade"),("defense_val","def_grade"),
    ]:
        df[gcol] = df[col].apply(to_grade)

    keep_cols = [
        "playerID","bbrefID","full_name","pos_display","sec_pos","era_label",
        "peak_year","peak_year_display","debut_year","last_year","canonical_teamID","franchise_name",
        "career_ab","career_h","career_hr","career_sb","career_bb","career_so",
        "seasons","bats",
        "ba","obp","iso","k_rate","bb_rate",
        "contact_val","power_val","eye_val","speed_val","defense_val",
        "con_grade","pow_grade","eye_grade","spd_grade","def_grade",
        "avg_attr_score","rarity",
        "is_allstar","is_hof","allstar_selections","gold_gloves","gg_bonus",
        "defense_source",
    ]
    keep_cols = [c for c in keep_cols if c in df.columns]
    final = df[keep_cols].copy()
    final.rename(columns={
        "full_name":"name","pos_display":"pos",
        "era_label":"era","canonical_teamID":"team",
    }, inplace=True)

    for col in ["ba","obp","iso","k_rate","bb_rate"]:
        if col in final.columns:
            final[col] = final[col].round(3)
    for col in stat_cols + ["avg_attr_score"]:
        if col in final.columns:
            final[col] = final[col].round(1)

    final.sort_values(["era","avg_attr_score"], ascending=[True,False], inplace=True)
    final.reset_index(drop=True, inplace=True)
    print(f"  DataFrame final: {len(final):,} jugadores x {len(final.columns)} columnas")

    final.to_csv(OUT_CSV, index=False, encoding="utf-8")
    print(f"  [OK]  game_cards.csv     ->  {OUT_CSV}")

    js_lines = [
        "// AUTO-GENERADO por lahman_etl.py v4.0 - NO EDITAR MANUALMENTE",
        f"// Total: {len(final):,} cartas  |  100% Peak (7 mejores temporadas por WAR)  |  PA-corrected rates",
        "(function() {",
        "  const LAHMAN_POOL = [",
    ]
    team_col = "team" if "team" in final.columns else "canonical_teamID"
    for _, r in final.iterrows():
        era_js  = str(r.get("era",  "Unknown")).replace('"',"'")
        name_js = str(r.get("name", "")).replace('"',"'")
        pos_js  = str(r.get("pos",  "RF"))
        sec_pos_js = str(r.get("sec_pos", ""))
        team_js = str(r.get(team_col,"UNK")).replace('"',"'")
        js_lines.append(
            f'    {{ '
            f'name: "{name_js}", pos: "{pos_js}", sec_pos: "{sec_pos_js}", era: "{era_js}", '
            f'team: "{team_js}", year: {int(r["peak_year_display"])}, '
            f'con: {int(r["contact_val"])}, pwr: {int(r["power_val"])}, '
            f'eye: {int(r["eye_val"])}, spd: {int(r["speed_val"])}, '
            f'def: {int(r["defense_val"])}, '
            f'con_grade: "{r["con_grade"]}", pwr_grade: "{r["pow_grade"]}", '
            f'eye_grade: "{r["eye_grade"]}", spd_grade: "{r["spd_grade"]}", '
            f'def_grade: "{r["def_grade"]}", '
            f'rarity: "{r["rarity"]}", '
            f'allstars: {int(r["allstar_selections"])}, '
            f'gold_gloves: {int(r["gold_gloves"])}, '
            f'hof: {"true" if r["is_hof"] else "false"}, '
            f'def_source: "{r.get("defense_source","lahman_proxy")}" '
            f'}},'
        )
    js_lines += [
        "  ];",
        "  if (typeof window !== 'undefined') {",
        "    if (window.PlayersDB) {",
        "      window.PlayersDB.LAHMAN_POOL  = LAHMAN_POOL;",
        "      window.PlayersDB.PLAYERS_POOL = LAHMAN_POOL;",
        "    } else {",
        "      window.LAHMAN_POOL = LAHMAN_POOL;",
        "    }",
        "  }",
        "  if (typeof module !== 'undefined') module.exports = LAHMAN_POOL;",
        "})();",
    ]
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("\n".join(js_lines))
    print(f"  [OK]  game_cards_pool.js ->  {OUT_JS}")
    return final


# ===========================================================================
# REPORTE FINAL
# ===========================================================================
def reporte_final(df):
    print("\n" + "=" * 64)
    print("  REPORTE FINAL - BaseRogue Card Pool v4.0")
    print("=" * 64)
    print(f"\n  Total de cartas: {len(df):,}")
    print("\n  Distribucion por Rareza:")
    for r, c in df["rarity"].value_counts().items():
        print(f"    {r:<12}: {c:5,}")
    print("\n  Distribucion por Era:")
    for era, cnt in df["era"].value_counts().sort_index().items():
        print(f"    {era[:46]:<46}: {cnt:4,}")
    print("\n  Atributos promedio (escala 1-99):")
    for col, label in [
        ("contact_val","CON"),("power_val","PWR"),
        ("eye_val","EYE"),("speed_val","SPD"),("defense_val","DEF"),
    ]:
        print(f"    {label}: {df[col].mean():5.1f}  (min:{df[col].min():4.1f} max:{df[col].max():4.1f})")
    print("\n  Fuente defensiva:")
    if "defense_source" in df.columns:
        for src, cnt in df["defense_source"].value_counts().items():
            print(f"    {src:<20}: {cnt:5,}")
    pd.set_option("display.max_columns", 13)
    pd.set_option("display.width", 220)
    pd.set_option("display.float_format", "{:.1f}".format)
    print("\n  TOP 15 cartas (por avg_attr_score):")
    top = df.nlargest(15, "avg_attr_score")[[
        "name","pos","peak_year","rarity","avg_attr_score",
        "contact_val","power_val","eye_val","speed_val","defense_val","gold_gloves"
    ]]
    print(top.to_string(index=False))
    print("\n  Top 3 por posicion:")
    for pos in ["C","1B","2B","3B","SS","LF","CF","RF","DH"]:
        t = df[df["pos"] == pos].nlargest(3, "avg_attr_score")[
            ["name","avg_attr_score","contact_val","power_val","defense_val","gold_gloves","rarity"]
        ]
        if not t.empty:
            print(f"\n    [{pos}]")
            for _, r in t.iterrows():
                print(f"      {r['name']:<28} OVR:{r['avg_attr_score']:5.1f}  GG:{int(r['gold_gloves'])}  [{r['rarity']}]")
    print("\n" + "=" * 64)


# ===========================================================================
# MAIN
# ===========================================================================
def main():
    print("=" * 64)
    print("  BaseRogue ETL Pipeline v4.0  -  VERSION FINAL")
    print("  100% Peak (7 mejores temporadas por WAR)  |  PA-corrected rates")
    print("=" * 64)

    dfs         = paso_1_cargar_datos()
    people      = dfs["people"]
    batting     = dfs["batting"]
    fielding    = dfs["fielding"]
    fielding_of = dfs["fielding_of"]
    allstar     = dfs["allstar"]
    hof         = dfs["hof"]
    teams       = dfs["teams"]
    franchises  = dfs["franchises"]
    awards      = dfs["awards"]
    war_bat     = dfs["war_bat"]

    pure_pitcher_ids = paso_2_filtrar_pitchers(fielding)
    career           = paso_3_carrera_batting(batting)
    peak             = paso_4_pico_batting(batting, war_bat, people)
    hybrid           = paso_5_hibrido(career, peak)
    pos_data         = paso_6_posicion_bateadores(fielding, fielding_of)
    hybrid           = hybrid.merge(pos_data, on="playerID", how="left")
    hybrid           = paso_7_enriquecer_people(hybrid, people)
    eligible         = paso_8_filtro_ingesta(hybrid, allstar, hof, pure_pitcher_ids)
    eligible         = paso_9_asignar_era(eligible)
    eligible         = paso_10_atributos_raw_bateo(eligible)
    eligible         = paso_11_motor_defensivo(eligible, war_bat, awards)
    eligible         = paso_12_normalizar_por_era(eligible)
    eligible         = paso_13_bono_guante_de_oro(eligible)
    eligible         = paso_14_velocidad(eligible)
    final            = paso_15_equipo_y_exportar(eligible, batting, teams, franchises)

    reporte_final(final)
    return final


if __name__ == "__main__":
    result_df = main()
