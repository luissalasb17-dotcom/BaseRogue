"""
=============================================================================
BaseRogue Career ETL Pipeline  -  VERSION 1.0
Lahman + Baseball-Reference war_daily_bat.txt  ->  game_cards_career.*
=============================================================================
Autor   : Senior Data Engineer
Version : 1.0  (100% Career Stats  |  Unicorn/Ohtani Exception  |  No Hybrid)

Diferencias clave respecto a lahman_etl.py v4.0:
  - 100% estadisticas de carrera completa (sin picos ni hibridos)
  - EXCEPCION OHTANI/RUTH: Si un pitcher primario tiene >= 2000 AB en su
    carrera, se conserva como bateador elegible en el pool.
  - Archivos de salida independientes: game_cards_career.csv / game_cards_career_pool.js
  - Array JS exportado: gameCardsCareerPool

Archivos de entrada  (en DATA_DIR = <project>/lahman_1871-2025/):
    Lahman:   People.csv, Batting.csv, Fielding.csv, FieldingOFsplit.csv,
              AllstarFull.csv, HallOfFame.csv, Teams.csv, TeamsFranchises.csv,
              AwardsPlayers.csv
    BBRef:    war_daily_bat.txt

Archivos de salida:
    game_cards_career.csv          ->  Tabla maestra de carrera completa
    game_cards_career_pool.js      ->  Array JS para el frontend (gameCardsCareerPool)

Uso:
    pip install pandas numpy
    python lahman_career_etl.py
=============================================================================
"""

import numpy as np
import pandas as pd
from pathlib import Path

# =============================================================================
# CONFIGURACION GLOBAL
# =============================================================================
DATA_DIR = Path(__file__).parent / "lahman_1871-2025"
OUT_CSV  = Path(__file__).parent / "game_cards_career.csv"
OUT_JS   = Path(__file__).parent / "game_cards_career_pool.js"
JS_ARRAY_NAME = "gameCardsCareerPool"

MIN_AB_CAREER      = 2000   # AB minimos para elegibilidad general
MIN_AB_UNICORN     = 2000   # AB minimos para la excepcion Ohtani (pitcher con muchos AB)
W_RFIELD           = 0.70   # Peso Rfield en motor defensivo
W_WARDEF           = 0.30   # Peso WAR_def en motor defensivo
GG_BONUS_PER_AWARD = 2      # Puntos de defense_val por Guante de Oro
GG_BONUS_MAX       = 6      # Bono maximo de Guante de Oro

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
    (95, "S"),
    (90, "A+"), (85, "A"), (80, "A-"),
    (75, "B+"), (70, "B"), (65, "B-"),
    (60, "C+"), (55, "C"), (50, "C-"),
    (40, "D+"), (30, "D"), (20, "D-"),
    (0,  "F"),
]

RARITY_THRESHOLDS = [
    (88, "Legendary"),
    (78, "Epic"),
    (65, "Rare"),
    (0,  "Common"),
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
    for threshold, grade in GRADE_THRESHOLDS:
        if float(val) >= threshold:
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
    return ((s - p02) / (p98 - p02)).clip(0, 1) * (high - low) + low


def normalize_within_era(df, col_raw, col_out):
    df[col_out] = (
        df.groupby("era_label")[col_raw]
          .transform(lambda x: normalize_series(x))
          .clip(1, 99)
          .round(1)
    )
    return df


# =============================================================================
# PASO 1 - CARGA DE TODOS LOS ARCHIVOS DE ENTRADA
# =============================================================================
def paso_1_cargar_datos():
    print("=" * 66)
    print("  PASO 1: Cargando archivos de entrada...")
    print("=" * 66)
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
        print("  [!!]  war_daily_bat.txt           ** NO ENCONTRADO **")
        dfs["war_bat"] = pd.DataFrame()
    return dfs


# =============================================================================
# PASO 2 - ESTADISTICAS DE CARRERA COMPLETA (100%)
# =============================================================================
def paso_2_carrera_batting(batting):
    """
    Agrega Batting.csv a nivel de carrera completa (todas las temporadas y stints).
    Calcula PA = AB + BB + HBP + SF para k_rate y bb_rate correctos.
    NO hay filtrado por pico ni hibrido: 100% carrera.
    """
    print("\n  PASO 2: Agregando estadisticas de CARRERA COMPLETA (100%)...")
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
        peak_year    =("yearID", "median"),
        debut_year   =("yearID", "min"),
        last_year    =("yearID", "max"),
    ).reset_index()

    career["peak_year"]  = career["peak_year"].round().astype(int)
    career["debut_year"] = career["debut_year"].astype(int)
    career["last_year"]  = career["last_year"].astype(int)

    # PA = AB + BB + HBP + SF  (denominador correcto para tasas de ponche/boleto)
    career["career_pa"] = (
        career["career_ab"] + career["career_bb"] +
        career["career_hbp"] + career["career_sf"]
    ).replace(0, np.nan)

    ab_c = career["career_ab"].replace(0, np.nan)
    pa_c = career["career_pa"]

    career["ba"]       = career["career_h"] / ab_c
    career["obp"]      = (career["career_h"] + career["career_bb"] + career["career_hbp"]) / pa_c
    career["slg"]      = (career["career_h"] + career["career_2b"] + 2*career["career_3b"] + 3*career["career_hr"]) / ab_c
    career["iso"]      = (career["career_2b"] + 2*career["career_3b"] + 3*career["career_hr"]) / ab_c
    career["k_rate"]   = career["career_so"] / pa_c   # SO/PA correcto
    career["bb_rate"]  = career["career_bb"] / pa_c   # BB/PA correcto
    career["xbh_rate"] = (career["career_2b"] + career["career_3b"] + career["career_hr"]) / ab_c
    career["hr_rate"]  = career["career_hr"] / ab_c

    # Componentes de velocidad
    sb_cs = (career["career_sb"] + career["career_cs"]).replace(0, np.nan)
    career["sb_efficiency"]   = (career["career_sb"] / sb_cs).fillna(0.65)
    career["sb_volume_log"]   = np.log1p(career["career_sb"])
    career["extra_base_freq"] = (career["career_sb"] + career["career_3b"]) / ab_c

    vol_max = career["sb_volume_log"].replace(0, np.nan).max()
    vol_max = vol_max if pd.notna(vol_max) and vol_max > 0 else 1.0
    career["sb_score"] = career["sb_efficiency"] * 0.65 + (career["sb_volume_log"] / vol_max) * 0.35

    print(f"  {len(career):,} jugadores con estadisticas de carrera calculadas")
    return career


# =============================================================================
# PASO 3 - FILTRADO DE PITCHERS CON EXCEPCION OHTANI/RUTH (UNICORNIO)
# =============================================================================
def paso_3_filtrar_pitchers_con_excepcion(fielding, career):
    """
    Determina la posicion primaria de cada jugador via Fielding.csv.

    LOGICA DE EXCLUSION:
      - Si posicion primaria != 'P': bateador de posicion -> INCLUIR.
      - Si posicion primaria == 'P' Y career_ab < MIN_AB_UNICORN: lanzador puro -> EXCLUIR.
      - Si posicion primaria == 'P' Y career_ab >= MIN_AB_UNICORN: EXCEPCION UNICORNIO
        (Ohtani/Ruth) -> INCLUIR como bateador elegible.

    La excepcion reconoce a jugadores dos-via que batearon suficiente para
    tener una carrera ofensiva significativa independientemente del pitcheo.
    """
    print(f"\n  PASO 3: Filtrado de pitchers (Excepcion Unicornio: >= {MIN_AB_UNICORN:,} AB)...")

    if fielding.empty:
        print("  [!!] Fielding.csv vacio — no se puede filtrar pitchers")
        return set(), set()

    field = fielding.copy()
    field["G"] = pd.to_numeric(field["G"], errors="coerce").fillna(0)

    # Posicion primaria = la que acumulo mas G en toda la carrera
    pos_games = field.groupby(["playerID", "POS"])["G"].sum().reset_index()
    primary = (
        pos_games.sort_values("G", ascending=False)
                 .drop_duplicates(subset="playerID")
                 .rename(columns={"POS": "primary_pos_fielding"})
    )

    # Unir con career para tener career_ab disponible en el filtro
    primary = primary.merge(career[["playerID", "career_ab"]], on="playerID", how="left")
    primary["career_ab"] = primary["career_ab"].fillna(0)

    is_pitcher_primary = primary["primary_pos_fielding"] == "P"
    is_unicorn         = is_pitcher_primary & (primary["career_ab"] >= MIN_AB_UNICORN)
    is_pure_pitcher    = is_pitcher_primary & (primary["career_ab"] < MIN_AB_UNICORN)

    pure_pitcher_ids = set(primary[is_pure_pitcher]["playerID"])
    unicorn_ids      = set(primary[is_unicorn]["playerID"])

    print(f"  Lanzadores puros excluidos    : {len(pure_pitcher_ids):,}")
    print(f"  Unicornios (excepcion Ohtani) : {len(unicorn_ids):,}  (pitcher principal, >= {MIN_AB_UNICORN:,} AB)")
    if unicorn_ids:
        unicorn_names = primary[primary["playerID"].isin(unicorn_ids)][["playerID","career_ab"]].head(10)
        print(f"  Unicornios identificados (muestra):")
        print(unicorn_names.to_string(index=False))

    return pure_pitcher_ids, unicorn_ids


# =============================================================================
# PASO 4 - POSICION PRIMARIA DE BATEADORES (excluye 'P')
# =============================================================================
def paso_4_posicion_bateadores(fielding, fielding_of):
    """
    Posicion con mayor G excluyendo 'P'. Refinamiento LF/CF/RF via FieldingOFsplit.
    fielding_pct y range_factor como proxy defensivo de respaldo.
    """
    print("\n  PASO 4: Posicion primaria de bateadores y metricas proxy de campo...")
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

    # Refinamiento para jardineros: LF/CF/RF exacto via FieldingOFsplit
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

    # Metricas proxy de campo para toda la carrera
    career_field = field.groupby("playerID").agg(
        total_po=("PO","sum"), total_a=("A","sum"),
        total_e=("E","sum"),   total_fg=("G","sum"),
    ).reset_index()
    denom_f = (career_field["total_po"] + career_field["total_a"] + career_field["total_e"]).replace(0, np.nan)
    career_field["fielding_pct"] = (career_field["total_po"] + career_field["total_a"]) / denom_f
    career_field["range_factor"] = (career_field["total_po"] + career_field["total_a"]) / career_field["total_fg"].replace(0, np.nan)

    # Secondary positions: any mapped pos != primary_pos and != DH where G >= 75
    sec_df = pos_games.merge(primary[["playerID", "primary_pos"]], on="playerID", how="left")
    sec_df["pos_mapped"] = sec_df["POS"].map(POS_DISPLAY_MAP).fillna("RF")
    sec_df = sec_df[(sec_df["pos_mapped"] != sec_df["primary_pos"]) & (sec_df["pos_mapped"] != "DH")]
    sec_pos_grouped = sec_df.groupby(["playerID", "pos_mapped"])["G"].sum().reset_index()
    sec_pos_grouped = sec_pos_grouped[sec_pos_grouped["G"] >= 75]
    
    sec_pos_str = sec_pos_grouped.groupby("playerID")["pos_mapped"].apply(
        lambda x: ",".join(sorted(list(set(x))))
    ).reset_index().rename(columns={"pos_mapped": "sec_pos"})

    result = primary.merge(career_field, on="playerID", how="left")
    result = result.merge(sec_pos_str, on="playerID", how="left")
    result["sec_pos"] = result["sec_pos"].fillna("")
    print(f"  Posicion primaria para {len(result):,} bateadores de posicion (y sus posiciones secundarias)")
    return result


# =============================================================================
# PASO 5 - ENRIQUECER CON PEOPLE.CSV
# =============================================================================
def paso_5_enriquecer_people(df, people):
    print("\n  PASO 5: Enriqueciendo con People.csv (nombre, bbrefID, bats)...")
    if people.empty:
        return df
    slim = people[["playerID","nameFirst","nameLast","bbrefID","debut","bats"]].copy()
    slim["full_name"] = (slim["nameFirst"].fillna("") + " " + slim["nameLast"].fillna("")).str.strip()
    result = df.merge(slim, on="playerID", how="left")
    print(f"  bbrefID disponible para {result['bbrefID'].notna().sum():,} jugadores")
    return result


# =============================================================================
# PASO 6 - FILTRO DE INGESTA DEL CARD POOL
# =============================================================================
def paso_6_filtro_ingesta(df, allstar, hof, pure_pitcher_ids):
    """
    CONDICION A (excluyente):
        El jugador no esta en pure_pitcher_ids (lanzadores sin excepcion Ohtani).
        Los unicornios YA fueron removidos de pure_pitcher_ids y quedan en el pool.

    CONDICION B (al menos una de):
        career_ab >= MIN_AB_CAREER (2000)  OR  All-Star  OR  HoF Player
    """
    print("\n  PASO 6: Filtro de ingesta del Card Pool...")
    allstar_ids = set(allstar["playerID"].unique()) if not allstar.empty else set()
    hof_ids = set()
    if not hof.empty and "inducted" in hof.columns:
        hof_inducted = hof[(hof["inducted"] == "Y") & (hof.get("category","Player") == "Player")]
        hof_ids = set(hof_inducted["playerID"].unique())
    print(f"  All-Stars historicos : {len(allstar_ids):,}")
    print(f"  Hall of Famers       : {len(hof_ids):,}")

    # Excluir pitchers puros (unicornios ya estan fuera de pure_pitcher_ids)
    no_pitchers = df[~df["playerID"].isin(pure_pitcher_ids)].copy()
    print(f"  Jugadores no-pitchers (incluyendo unicornios): {len(no_pitchers):,}")

    mask = (
        (no_pitchers["career_ab"] >= MIN_AB_CAREER) |
        no_pitchers["playerID"].isin(allstar_ids) |
        no_pitchers["playerID"].isin(hof_ids)
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
    print(f"  Card Pool elegible   : {len(eligible):,} jugadores")
    return eligible


# =============================================================================
# PASO 7 - ASIGNAR ERA TEMATICA
# =============================================================================
def paso_7_asignar_era(df):
    print("\n  PASO 7: Asignando Era Tematica por peak_year (mediana de carrera)...")
    df["era_label"] = df["peak_year"].apply(assign_era)
    for era, cnt in df["era_label"].value_counts().sort_index().items():
        print(f"    {era[:46]:<46}: {cnt:4,}")
    return df


# =============================================================================
# PASO 8 - ATRIBUTOS RAW DE BATEO (100% ESTADISTICAS DE CARRERA)
# =============================================================================
def paso_8_atributos_raw_bateo(df):
    """
    Calcula los atributos RAW directamente de las estadisticas de carrera completa.
    No hay ponderacion hibrida: 100% de carrera.

    CON = 0.80 * BA_Carrera + 0.20 * (1 - k_rate_Carrera)
         Habilidad de batear de hit y evitar el ponche.

    PWR = 0.50 * ISO_Carrera + 0.30 * XBH_rate_Carrera + 0.20 * HR_rate_Carrera
         Poder real de bate en extra-bases.

    EYE = bb_rate_Carrera  (100% tasa de boletos - paciencia pura)
          k_rate y bb_rate ya usan PA como denominador.
    """
    print("\n  PASO 8: Atributos RAW de bateo (100% carrera — CON, PWR, EYE)...")
    df = df.copy()

    df["contact_raw"] = (
        df["ba"].fillna(0)               * 0.80 +
        (1 - df["k_rate"].fillna(0.25)) * 0.20
    )
    df["power_raw"] = (
        df["iso"].fillna(0)      * 0.50 +
        df["xbh_rate"].fillna(0) * 0.30 +
        df["hr_rate"].fillna(0)  * 0.20
    )
    df["eye_raw"] = df["bb_rate"].fillna(0)

    print("  contact_raw, power_raw, eye_raw calculados (100% carrera)")
    return df


# =============================================================================
# PASO 9 - MOTOR DEFENSIVO AVANZADO (Rfield + WAR_def + Proxy Lahman)
# =============================================================================
def paso_9_motor_defensivo(df, war_bat, awards):
    """
    Si hay datos BBRef:  defense_base = 0.70 * runs_defense + 0.30 * WAR_def
    Sino (proxy Lahman): defense_base = 0.70 * fielding_pct + 0.30 * (range_factor / 6)
    Conteo de Gold Gloves de AwardsPlayers.csv para el bono del Paso 11.
    """
    print("\n  PASO 9: Motor defensivo avanzado (Rfield + WAR_def + proxy Lahman)...")
    if not war_bat.empty:
        war = war_bat.copy()
        for col in ["runs_defense","WAR_def"]:
            if col in war.columns:
                war[col] = pd.to_numeric(war[col].replace("NULL", np.nan), errors="coerce").fillna(0)
            else:
                war[col] = 0.0
        war["runs_defense"] = war["runs_defense"].clip(-80, 80)
        war_career = war.groupby("player_ID").agg(
            rfield_career=("runs_defense","sum"),
            wardef_career=("WAR_def","sum"),
        ).reset_index().rename(columns={"player_ID":"bbrefID"})
        print(f"  Datos BBRef disponibles para {len(war_career):,} jugadores")
    else:
        war_career = pd.DataFrame(columns=["bbrefID","rfield_career","wardef_career"])

    df = df.merge(war_career, on="bbrefID", how="left")
    n_war   = df["rfield_career"].notna().sum()
    n_proxy = df["rfield_career"].isna().sum()
    print(f"  Motor avanzado (BBRef): {n_war:,}  |  Proxy Lahman: {n_proxy:,}")

    has_war = df["rfield_career"].notna()
    df["defense_base"] = np.where(
        has_war,
        W_RFIELD * df["rfield_career"].fillna(0) + W_WARDEF * df["wardef_career"].fillna(0),
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


# =============================================================================
# PASO 10 - NORMALIZACION POR ERA (percentil 2-98, escala 1-99)
# =============================================================================
def paso_10_normalizar_por_era(df):
    """
    Normaliza los atributos RAW dentro de cada Era Tematica para eliminar
    sesgos historicos. Escala de salida: 1-99.
    """
    print("\n  PASO 10: Normalizando por Era (percentil 2-98, escala 1-99)...")
    for raw, out in [
        ("contact_raw",  "contact_val"),
        ("power_raw",    "power_val"),
        ("eye_raw",      "eye_val"),
        ("defense_base", "defense_val_base"),
    ]:
        df = normalize_within_era(df, raw, out)
    print("  contact_val, power_val, eye_val, defense_val_base normalizados")
    return df


# =============================================================================
# PASO 11 - BONO DE GUANTE DE ORO (post-normalizacion)
# =============================================================================
def paso_11_bono_guante_de_oro(df):
    """
    defense_val = clip(defense_val_base + gold_gloves * GG_BONUS_PER_AWARD, 1, 99)
    Bono maximo = GG_BONUS_MAX = 6 puntos sobre escala 1-99.
    """
    print("\n  PASO 11: Bono de Guante de Oro (post-normalizacion)...")
    df = df.copy()
    gg_bonus = (df["gold_gloves"] * GG_BONUS_PER_AWARD).clip(0, GG_BONUS_MAX)
    df["gg_bonus"]    = gg_bonus
    df["defense_val"] = (df["defense_val_base"] + gg_bonus).clip(1, 99).round(1)
    top_gg = df[df["gold_gloves"] > 0].nlargest(5, "gold_gloves")[
        ["full_name","gold_gloves","defense_val_base","gg_bonus","defense_val"]
    ]
    if not top_gg.empty:
        print("  Top 5 receptores de bono GG:")
        print(top_gg.to_string(index=False))
    return df


# =============================================================================
# PASO 12 - VELOCIDAD SPD 50/40/10 (normalizado por Era)
# =============================================================================
def paso_12_velocidad(df):
    """
    speed_val (normalizado por Era):
        50% SB-score       = 0.65 * sb_efficiency + 0.35 * sb_volume_log_norm
        40% extra_base_freq = (SB + 3B) / AB  (agresividad en bases)
        10% defense_val / 100  (rango posicional)
    """
    print("\n  PASO 12: SPD 50/40/10 (normalizado por Era)...")

    def _speed_within_era(group):
        sb_max = group["sb_score"].max()
        xb_max = group["extra_base_freq"].max()
        sb_c  = (group["sb_score"] / sb_max).fillna(0)        if sb_max > 0 else pd.Series(0.0, index=group.index)
        xb_c  = (group["extra_base_freq"].fillna(0) / xb_max) if xb_max > 0 else pd.Series(0.0, index=group.index)
        def_c = group["defense_val"].fillna(50) / 100.0
        raw   = sb_c * 0.50 + xb_c * 0.40 + def_c * 0.10
        return normalize_series(raw, 1, 99)

    df["speed_val"] = (
        df.groupby("era_label", group_keys=False)
          .apply(_speed_within_era)
          .clip(1, 99)
          .round(1)
    )
    print("  speed_val calculado")
    return df


# =============================================================================
# PASO 13 - EQUIPO CANONICO, DATAFRAME FINAL Y EXPORTACION
# =============================================================================
def asignar_rareza(row):
    hof_b     = 8 if row["is_hof"] else 0
    ast_b     = min(row["allstar_selections"] * 0.5, 6)
    eff_score = row["avg_attr_score"] + hof_b + ast_b
    for thr, label in RARITY_THRESHOLDS:
        if eff_score >= thr:
            return label
    return "Common"


def paso_13_equipo_y_exportar(df, batting, teams, franchises):
    """
    Asigna equipo canonico (mas temporadas jugadas), construye el DataFrame final
    y exporta game_cards_career.csv y game_cards_career_pool.js.
    El array JS se llama exactamente: gameCardsCareerPool
    """
    print("\n  PASO 13: Equipo canonico, DataFrame final y exportacion...")

    # Equipo canonico: el equipo con mas temporadas jugadas en Batting.csv
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
        team_franch = teams[["teamID","franchID"]].drop_duplicates()
        df = df.merge(team_franch, left_on="canonical_teamID", right_on="teamID", how="left")
        df.drop(columns=["teamID"], errors="ignore", inplace=True)
        if not franchises.empty and "franchName" in franchises.columns:
            df = df.merge(franchises[["franchID","franchName"]].drop_duplicates(), on="franchID", how="left")
            df.rename(columns={"franchName":"franchise_name"}, inplace=True)
        else:
            df["franchise_name"] = df.get("canonical_teamID","UNK")
    else:
        df["franchise_name"] = df.get("canonical_teamID","UNK")

    df["canonical_teamID"] = df["canonical_teamID"].fillna("UNK")
    df["franchise_name"]   = df["franchise_name"].fillna(df["canonical_teamID"])

    stat_cols = ["contact_val","power_val","eye_val","speed_val","defense_val"]
    df["avg_attr_score"] = df[stat_cols].mean(axis=1).round(1)
    df["rarity"]         = df.apply(asignar_rareza, axis=1)
    df["pos_display"]    = df["primary_pos"].map(POS_DISPLAY_MAP).fillna("RF")

    for col, gcol in [
        ("contact_val","con_grade"),("power_val","pow_grade"),
        ("eye_val","eye_grade"),("speed_val","spd_grade"),("defense_val","def_grade"),
    ]:
        df[gcol] = df[col].apply(to_grade)

    keep_cols = [
        "playerID","bbrefID","full_name","pos_display","sec_pos","era_label",
        "peak_year","debut_year","last_year","canonical_teamID","franchise_name",
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

    # Exportar CSV
    final.to_csv(OUT_CSV, index=False, encoding="utf-8")
    print(f"  [OK]  {OUT_CSV.name:<30} ->  {OUT_CSV}")

    # Exportar JS - array: gameCardsCareerPool
    js_lines = [
        f"// AUTO-GENERADO por lahman_career_etl.py v1.0 - NO EDITAR MANUALMENTE",
        f"// Total: {len(final):,} cartas  |  100% Career Stats  |  Unicorn/Ohtani Exception",
        f"// Array: {JS_ARRAY_NAME}",
        "(function() {",
        f"  const {JS_ARRAY_NAME} = [",
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
            f'team: "{team_js}", year: {int(r["peak_year"])}, '
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
        f"    window.{JS_ARRAY_NAME} = {JS_ARRAY_NAME};",
        "    if (window.PlayersDB) {",
        f"      window.PlayersDB.CAREER_POOL = {JS_ARRAY_NAME};",
        "    }",
        "  }",
        f"  if (typeof module !== 'undefined') module.exports = {JS_ARRAY_NAME};",
        "})();",
    ]
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("\n".join(js_lines))
    print(f"  [OK]  {OUT_JS.name:<30} ->  {OUT_JS}")
    return final


# =============================================================================
# REPORTE FINAL
# =============================================================================
def reporte_final(df):
    print("\n" + "=" * 66)
    print("  REPORTE FINAL - BaseRogue Career Pool v1.0  (100% Carrera)")
    print("=" * 66)
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
        print(f"    {label}: {df[col].mean():5.1f}  (min:{df[col].min():4.1f}  max:{df[col].max():4.1f})")
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
            for _, row in t.iterrows():
                print(f"      {row['name']:<28} OVR:{row['avg_attr_score']:5.1f}  GG:{int(row['gold_gloves'])}  [{row['rarity']}]")
    print("\n" + "=" * 66)


# =============================================================================
# MAIN - ORQUESTADOR DEL PIPELINE DE CARRERA COMPLETA
# =============================================================================
def main():
    print("=" * 66)
    print("  BaseRogue Career ETL Pipeline v1.0")
    print("  100% Career Stats  |  Unicorn/Ohtani Exception  |  No Hybrid")
    print("=" * 66)

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

    # PASO 2: Estadisticas de carrera completa (100%, sin picos)
    career = paso_2_carrera_batting(batting)

    # PASO 3: Filtrado de pitchers con excepcion Ohtani/Ruth
    pure_pitcher_ids, unicorn_ids = paso_3_filtrar_pitchers_con_excepcion(fielding, career)

    # PASO 4: Posicion primaria para bateadores
    pos_data = paso_4_posicion_bateadores(fielding, fielding_of)
    career   = career.merge(pos_data, on="playerID", how="left")

    # Para unicornios (pitch. primario con >= 2000 AB), asignar posicion DH si no tienen
    # otra posicion de bateador en Fielding (por ej. Ohtani tiene OF tambien)
    if unicorn_ids:
        unicorn_mask = career["playerID"].isin(unicorn_ids) & career["primary_pos"].isna()
        career.loc[unicorn_mask, "primary_pos"] = "DH"
        print(f"\n  Unicornios con posicion DH asignada por defecto: {unicorn_mask.sum()}")

    # PASO 5: Enriquecer con People.csv
    career = paso_5_enriquecer_people(career, people)

    # PASO 6: Filtro de ingesta del Card Pool
    eligible = paso_6_filtro_ingesta(career, allstar, hof, pure_pitcher_ids)

    # PASO 7: Asignar Era Tematica
    eligible = paso_7_asignar_era(eligible)

    # PASO 8: Atributos RAW de bateo (100% carrera)
    eligible = paso_8_atributos_raw_bateo(eligible)

    # PASO 9: Motor defensivo avanzado
    eligible = paso_9_motor_defensivo(eligible, war_bat, awards)

    # PASO 10: Normalizacion por Era
    eligible = paso_10_normalizar_por_era(eligible)

    # PASO 11: Bono de Guante de Oro
    eligible = paso_11_bono_guante_de_oro(eligible)

    # PASO 12: Velocidad SPD 50/40/10
    eligible = paso_12_velocidad(eligible)

    # PASO 13: Equipo canonico + DataFrame final + exportacion
    final = paso_13_equipo_y_exportar(eligible, batting, teams, franchises)

    reporte_final(final)
    return final


if __name__ == "__main__":
    result_df = main()
