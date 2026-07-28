"""
BaseRogue Pitchers ETL  -  v1.0
Lahman Pitching.csv + war_daily_pitch.txt  ->  pitchers_pool.js

Filtro de Ingesta:
  GS_career >= 100  OR  G_career >= 150  OR  All-Star  OR  HoF

Pico: 7 mejores temporadas por WAR (no consecutivas)
Ajuste por Era: mismo metodo OPS+ que bateadores (blend 75%)
Rating principal: ERA+ ajustado, K/9, BB/9, HR/9 → atributos del juego

Ratings para el juego:
  STR  (Strikeout power)  → K/9 ajustado por era
  CTL  (Control)          → BB/9 inverso ajustado por era
  STA  (Stamina)          → IP/GS (duracion por apertura)
  GRT  (Groundball/Tough) → ERA+ (calidad de efectividad)
  DEF  (Fielding pitcher)  → rfield / proxy Lahman

OVR formula: STR*30 + CTL*25 + STA*20 + GRT*20 + DEF*5

Uso:
  pip install pandas numpy
  python pitchers_etl.py
"""

import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR  = Path(__file__).parent / "lahman_1871-2025"
OUT_CSV   = Path(__file__).parent / "pitchers_pool.csv"
OUT_JS    = Path(__file__).parent / "pitchers_pool.js"

# ── Parametros generales ────────────────────────────────────────────────────
PEAK_SEASONS      = 7
MIN_GS_CAREER     = 100   # minimo aperturas de carrera
MIN_G_CAREER      = 150   # minimo juegos como pitcher (relievers)
MIN_GS_ALLSTAR    = 1     # al menos 1 GS para All-Stars / HoF como filtro secundario

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
    (95,  "A+"),
    (85,  "A"),
    (80,  "A-"),
    (75,  "B+"),
    (65,  "B"),
    (60,  "B-"),
    (55,  "C+"),
    (45,  "C"),
    (40,  "C-"),
    (35,  "D+"),
    (25,  "D"),
    (20,  "D-"),
    (0,   "F"),
]

RARITY_THRESHOLDS = [
    (74, "Legendary"),
    (58, "Epic"),
    (48, "Rare"),
    (39, "Uncommon"),
    (0,  "Common"),
]


# ── Helpers ─────────────────────────────────────────────────────────────────
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


def normalize_difficulty_adjusted(df, col_raw, col_out, invert=False):
    """
    Mismo ajuste OPS+ que bateadores:
      blended_factor = 1 + 0.75 * (global_mean / era_mean - 1)
      adjusted = raw * blended_factor
      out = normalize_series(adjusted, 1, 99)
    Si invert=True el mejor es el MENOR valor (e.g. BB/9, HR/9).
    """
    s = df[col_raw].copy()
    if invert:
        s = -s  # invertir para que menor sea mejor
    global_mean = s.mean()
    era_means = df.groupby("era_label")[col_raw].transform("mean")
    if invert:
        era_means = -era_means
    diff_factor   = global_mean / era_means.replace(0, 1)
    blended_factor = 1.0 + 0.75 * (diff_factor - 1.0)
    adjusted = s * blended_factor
    df[col_out] = (
        normalize_series(adjusted)
        .clip(1, 125)
        .round(1)
    )
    return df


def asignar_rareza(row):
    hof_b     = 8 if row["is_hof"] else 0
    ast_b     = min(row["allstar_selections"] * 0.5, 6)
    eff_score = row["ovr"] + hof_b + ast_b
    for thr, label in RARITY_THRESHOLDS:
        if eff_score >= thr:
            return label
    return "Common"


# ── PASO 1: Cargar archivos ─────────────────────────────────────────────────
def paso_1_cargar_datos():
    print("=" * 64)
    print("  PASO 1: Cargando archivos...")
    print("=" * 64)
    dfs = {}
    files = {
        "people":    "People.csv",
        "pitching":  "Pitching.csv",
        "allstar":   "AllstarFull.csv",
        "hof":       "HallOfFame.csv",
        "awards":    "AwardsPlayers.csv",
        "teams":     "Teams.csv",
        "franchises":"TeamsFranchises.csv",
        "fielding":  "Fielding.csv",
    }
    for key, fname in files.items():
        path = DATA_DIR / fname
        if path.exists():
            dfs[key] = pd.read_csv(path, low_memory=False)
            print(f"  [OK]  {fname:<30}  {len(dfs[key]):>9,} filas")
        else:
            print(f"  [!!]  {fname:<30}  ** NO ENCONTRADO **")
            dfs[key] = pd.DataFrame()

    war_path = DATA_DIR / "war_daily_pitch.txt"
    if war_path.exists():
        dfs["war_pitch"] = pd.read_csv(war_path, low_memory=False)
        print(f"  [OK]  {'war_daily_pitch.txt':<30}  {len(dfs['war_pitch']):>9,} filas")
    else:
        print("  [!!]  war_daily_pitch.txt  ** NO ENCONTRADO **")
        dfs["war_pitch"] = pd.DataFrame()

    return dfs


# ── PASO 2: Identificar pitchers puros ──────────────────────────────────────
def paso_2_identificar_pitchers_puros(fielding):
    """
    Un pitcher puro es aquel cuya posicion con mayor G en Fielding.csv es 'P'.
    Son EXACTAMENTE quienes queremos para este pool.
    """
    print("\n  PASO 2: Identificando pitchers puros...")
    if fielding.empty:
        return set()
    field = fielding.copy()
    field["G"] = pd.to_numeric(field["G"], errors="coerce").fillna(0)
    pos_games = field.groupby(["playerID", "POS"])["G"].sum().reset_index()
    primary_pos = (
        pos_games.sort_values("G", ascending=False)
                 .drop_duplicates(subset="playerID")
    )
    pure_pitchers = set(primary_pos[primary_pos["POS"] == "P"]["playerID"])
    print(f"  {len(pure_pitchers):,} pitchers puros identificados")
    return pure_pitchers


# ── PASO 3: Estadísticas de carrera de Pitching.csv ─────────────────────────
def paso_3_carrera_pitching(pitching):
    """
    Agrega Pitching.csv por playerID (toda la carrera, todos los stints).
    IP = IPouts / 3
    """
    print("\n  PASO 3: Estadisticas de carrera de pitching...")
    pit = pitching.copy()
    int_cols = ["W", "L", "G", "GS", "SV", "IPouts", "H", "ER", "HR", "BB", "SO", "BFP", "HBP", "WP"]
    for col in int_cols:
        if col in pit.columns:
            pit[col] = pd.to_numeric(pit[col], errors="coerce").fillna(0)

    career = pit.groupby("playerID").agg(
        career_g     =("G",      "sum"),
        career_gs    =("GS",     "sum"),
        career_sv    =("SV",     "sum"),
        career_ipouts=("IPouts", "sum"),
        career_h     =("H",      "sum"),
        career_er    =("ER",     "sum"),
        career_hr    =("HR",     "sum"),
        career_bb    =("BB",     "sum"),
        career_so    =("SO",     "sum"),
        career_bfp   =("BFP",    "sum"),
        career_w     =("W",      "sum"),
        career_l     =("L",      "sum"),
        debut_year   =("yearID", "min"),
        last_year    =("yearID", "max"),
        seasons      =("yearID", "count"),
    ).reset_index()

    career["debut_year"] = career["debut_year"].astype(int)
    career["last_year"]  = career["last_year"].astype(int)
    career["career_ip"]  = career["career_ipouts"] / 3.0

    print(f"  {len(career):,} jugadores con estadisticas de pitching")
    return career


# ── PASO 4: Pico de 7 mejores temporadas por WAR ────────────────────────────
def paso_4_pico_pitching(pitching, war_pitch, people):
    """
    Selecciona las PEAK_SEASONS mejores temporadas por WAR de war_daily_pitch.txt.
    Si no hay WAR disponible, usa ERA (fallback: menor ERA = mejor).
    """
    print(f"\n  PASO 4: Seleccionando pico de {PEAK_SEASONS} mejores temporadas por WAR...")
    pit = pitching.copy()
    int_cols = ["G", "GS", "SV", "IPouts", "H", "ER", "HR", "BB", "SO", "BFP", "W", "L"]
    for col in int_cols:
        if col in pit.columns:
            pit[col] = pd.to_numeric(pit[col], errors="coerce").fillna(0)
    if "ERA" in pit.columns:
        pit["ERA"] = pd.to_numeric(pit["ERA"], errors="coerce")

    # Agregar por jugador-temporada (suma de stints)
    pit_yearly = pit.groupby(["playerID", "yearID"]).agg(
        G     =("G",      "sum"),
        GS    =("GS",     "sum"),
        SV    =("SV",     "sum"),
        IPouts=("IPouts", "sum"),
        H     =("H",      "sum"),
        ER    =("ER",     "sum"),
        HR_a  =("HR",     "sum"),
        BB    =("BB",     "sum"),
        SO    =("SO",     "sum"),
        BFP   =("BFP",    "sum"),
        W     =("W",      "sum"),
        L     =("L",      "sum"),
    ).reset_index()

    pit_yearly["IP_y"]  = pit_yearly["IPouts"] / 3.0
    ip_y = pit_yearly["IP_y"].replace(0, np.nan)

    # Tasas por 9 innings
    pit_yearly["k9_y"]  = pit_yearly["SO"]  / ip_y * 9.0
    pit_yearly["bb9_y"] = pit_yearly["BB"]  / ip_y * 9.0
    pit_yearly["hr9_y"] = pit_yearly["HR_a"]/ ip_y * 9.0
    pit_yearly["era_y"] = pit_yearly["ER"]  / ip_y * 9.0

    # Stamina: IP/GS (solo para starters; reliever GS=0 → NaN → 0)
    gs_y = pit_yearly["GS"].replace(0, np.nan)
    pit_yearly["ip_per_gs_y"] = pit_yearly["IP_y"] / gs_y

    # Vincular WAR de pitching (BBRef)
    war_yearly = pd.DataFrame()
    if not war_pitch.empty and not people.empty:
        war = war_pitch.copy()
        for col in ["WAR", "GS", "G", "IPouts", "ERA_plus"]:
            if col in war.columns:
                war[col] = pd.to_numeric(
                    war[col].replace("NULL", np.nan) if isinstance(war[col].iloc[0], str) else war[col],
                    errors="coerce"
                ).fillna(0)
        war_season = war.groupby(["player_ID", "year_ID"]).agg(
            war_season =("WAR",      "sum"),
            era_plus_y =("ERA_plus", "mean"),  # media ponderada de stints
        ).reset_index()
        war_season.columns = ["bbrefID", "yearID", "war_season", "era_plus_y"]

        id_map = people[["playerID", "bbrefID"]].dropna(subset=["bbrefID"])
        war_yearly = (
            war_season.merge(id_map, on="bbrefID", how="left")
                      .dropna(subset=["playerID"])[["playerID", "yearID", "war_season", "era_plus_y"]]
        )
        print(f"  WAR anual para {war_yearly['playerID'].nunique():,} pitchers (BBRef)")
    else:
        print("  WAR no disponible - usando ERA fallback")

    if not war_yearly.empty:
        pit_yearly = pit_yearly.merge(war_yearly, on=["playerID", "yearID"], how="left")
    else:
        pit_yearly["war_season"] = np.nan
        pit_yearly["era_plus_y"] = np.nan

    # Seleccionar top PEAK_SEASONS por WAR (o por ERA inverso si no hay WAR)
    def seleccionar_pico(group):
        g = group.copy()
        if g["war_season"].notna().any():
            g = g.sort_values("war_season", ascending=False, na_position="last")
        else:
            g = g.sort_values("era_y", ascending=True, na_position="last")  # menor ERA = mejor
        return g.head(PEAK_SEASONS)

    pico_df = pit_yearly.groupby("playerID", group_keys=True).apply(seleccionar_pico)
    pico_df = pico_df.reset_index(level=0)

    # peak_year: mediana de las 7 mejores temporadas (para asignar era)
    peak_median = (
        pico_df.groupby("playerID")["yearID"].median()
               .reset_index().rename(columns={"yearID": "peak_year"})
    )
    peak_median["peak_year"] = peak_median["peak_year"].round().astype(int)

    # peak_year_display: año de su mejor rendimiento individual
    peak_display = (
        pico_df.groupby("playerID").first()
               .reset_index()[["playerID", "yearID"]]
               .rename(columns={"yearID": "peak_year_display"})
    )

    peak = pico_df.groupby("playerID").agg(
        peak_ip      =("IP_y",       "sum"),
        peak_gs      =("GS",         "sum"),
        peak_g       =("G",          "sum"),
        peak_sv      =("SV",         "sum"),
        peak_so      =("SO",         "sum"),
        peak_bb      =("BB",         "sum"),
        peak_hr_a    =("HR_a",       "sum"),
        peak_er      =("ER",         "sum"),
        peak_h       =("H",          "sum"),
        peak_w       =("W",          "sum"),
        peak_l       =("L",          "sum"),
        peak_war     =("war_season", "sum"),
        peak_era_plus=("era_plus_y", "mean"),   # promedio de ERA+ en peak
        peak_ip_per_gs=("ip_per_gs_y","mean"),  # stamina promedio
    ).reset_index()

    peak = peak.merge(peak_median,  on="playerID", how="left")
    peak = peak.merge(peak_display, on="playerID", how="left")

    ip_p = peak["peak_ip"].replace(0, np.nan)
    peak["peak_k9"]  = peak["peak_so"]   / ip_p * 9.0
    peak["peak_bb9"] = peak["peak_bb"]   / ip_p * 9.0
    peak["peak_hr9"] = peak["peak_hr_a"] / ip_p * 9.0
    peak["peak_era"] = peak["peak_er"]   / ip_p * 9.0

    # IP/GS del pico (stamina para starters)
    gs_p = peak["peak_gs"].replace(0, np.nan)
    peak["peak_ip_per_gs"] = peak["peak_ip_per_gs"].fillna(peak["peak_ip"] / gs_p)

    print(f"  Pico calculado para {len(peak):,} pitchers")
    return peak


# ── PASO 5: Filtro de ingesta ────────────────────────────────────────────────
def paso_5_filtro_ingesta(career, peak, allstar, hof, pure_pitcher_ids, pitching):
    """
    Solo pitchers puros (posicion primaria P).
    Criterio: GS_career >= 100 OR G_career >= 150 OR All-Star OR HoF
    """
    print("\n  PASO 5: Filtro de ingesta de pitchers...")
    allstar_ids = set(allstar["playerID"].unique()) if not allstar.empty else set()
    hof_ids = set()
    if not hof.empty and "inducted" in hof.columns:
        hof_inducted = hof[
            (hof["inducted"] == "Y") &
            (hof.get("category", pd.Series("Player", index=hof.index)) == "Player")
        ]
        hof_ids = set(hof_inducted["playerID"].unique())
    print(f"  All-Stars: {len(allstar_ids):,}  |  HoF: {len(hof_ids):,}")

    # Solo pitchers puros
    df = career[career["playerID"].isin(pure_pitcher_ids)].copy()
    df = df.merge(peak, on="playerID", how="inner")
    print(f"  Pitchers puros con datos de pico: {len(df):,}")

    # Filtro de ingesta
    mask = (
        (df["career_gs"] >= MIN_GS_CAREER) |
        (df["career_g"]  >= MIN_G_CAREER)  |
        df["playerID"].isin(allstar_ids)   |
        df["playerID"].isin(hof_ids)
    )
    eligible = df[mask].copy()

    eligible["is_allstar"] = eligible["playerID"].isin(allstar_ids)
    eligible["is_hof"]     = eligible["playerID"].isin(hof_ids)

    if not allstar.empty:
        as_count = allstar.groupby("playerID").size().reset_index(name="allstar_selections")
        eligible = eligible.merge(as_count, on="playerID", how="left")
    else:
        eligible["allstar_selections"] = 0
    eligible["allstar_selections"] = eligible["allstar_selections"].fillna(0).astype(int)

    # Filtro adicional estricto para Ligas Negras: HoF, 2+ Allstars, 35+ GS (SP), o 60+ G (RP)
    nl_leagues = {'NN1', 'NN2', 'ECL', 'NSL', 'NAL', 'AA', 'ANL'}
    if not pitching.empty and 'lgID' in pitching.columns:
        nl_pids = set(pitching[pitching['lgID'].isin(nl_leagues)]['playerID'].unique())
        nl_mask = eligible['playerID'].isin(nl_pids)
        nl_keep = (eligible['is_hof']) | (eligible['allstar_selections'] >= 2) | (eligible['career_gs'] >= 35) | (eligible['career_g'] >= 60)
        eligible = eligible[~nl_mask | nl_keep].copy()

    # Marcar tipo de pitcher (SP = starter, RP = reliever)
    eligible["role"] = np.where(
        eligible["career_gs"] / eligible["career_g"].replace(0, 1) >= 0.40,
        "SP", "RP"
    )
    print(f"  Elegibles: {len(eligible):,}  (SP: {(eligible['role']=='SP').sum():,} | RP: {(eligible['role']=='RP').sum():,})")
    return eligible


# ── PASO 6: Enriquecer con People.csv ────────────────────────────────────────
def paso_6_enriquecer_people(df, people):
    print("\n  PASO 6: Enriqueciendo con People.csv...")
    if people.empty:
        return df
    slim = people[["playerID", "nameFirst", "nameLast", "bbrefID"]].copy()
    slim["full_name"] = (slim["nameFirst"].fillna("") + " " + slim["nameLast"].fillna("")).str.strip()
    result = df.merge(slim, on="playerID", how="left")
    print(f"  bbrefID para {result['bbrefID'].notna().sum():,} pitchers")
    return result


# ── PASO 7: Asignar Era temática ──────────────────────────────────────────────
def paso_7_asignar_era(df):
    print("\n  PASO 7: Asignando Era Tematica por peak_year...")
    df["era_label"] = df["peak_year"].apply(assign_era)
    for era, cnt in df["era_label"].value_counts().sort_index().items():
        print(f"    {era[:46]:<46}: {cnt:4,}")
    return df


# ── PASO 8: Atributos RAW de pitching ────────────────────────────────────────
def paso_8_atributos_raw(df):
    """
    STR_raw:  K/9  → ponches por 9 (strikeout power)
    CTL_raw: -BB/9 → control (menor es mejor, por eso invertimos al normalizar)
    STA_raw:  IP/GS promedio en pico (duracion por apertura; 0 para relievers)
    GRT_raw:  ERA+ del pico (promedio; >100 = mejor que liga)
    DEF_raw:  RS_def_total de BBRef WAR (fielding pitcher, runs saved)
    """
    print("\n  PASO 8: Atributos RAW de pitching...")
    df = df.copy()

    df["str_raw"] = df["peak_k9"].fillna(0)
    df["ctl_raw"] = df["peak_bb9"].fillna(9.0)   # invertido al normalizar
    df["hr_raw"]  = df["peak_hr9"].fillna(2.0)   # invertido al normalizar (menos HR = mejor)

    # Stamina: IP/GS para starters, IP/G para relievers
    is_sp = df["role"] == "SP"
    df["sta_raw"] = np.where(
        is_sp,
        df["peak_ip_per_gs"].fillna(df["career_ip"] / df["career_gs"].replace(0, np.nan)).fillna(0),
        df["peak_ip"] / df["peak_g"].replace(0, np.nan)  # IP/G para relievers
    )
    df["sta_raw"] = df["sta_raw"].fillna(0)

    # Efectividad (GRT): ERA+ del pico (100 = liga media, >100 = mejor)
    # Si no hay ERA+, usamos ERA invertido como proxy
    df["grt_raw"] = df["peak_era_plus"].fillna(
        100 / df["peak_era"].replace(0, np.nan) * 9  # proxy crudo
    ).fillna(100)

    print("  str_raw, ctl_raw, hr_raw, sta_raw, grt_raw calculados")
    return df


# ── PASO 9: Fielding de pitchers ──────────────────────────────────────────────
def paso_9_fielding_pitchers(df, war_pitch, people):
    """
    Usa RS_def_total de war_daily_pitch.txt para los pitchers con datos BBRef.
    Proxy Lahman si no hay datos.
    """
    print("\n  PASO 9: Fielding de pitchers (RS_def de BBRef)...")
    if not war_pitch.empty and not people.empty and "RS_def_total" in war_pitch.columns:
        war = war_pitch.copy()
        war["RS_def_total"] = pd.to_numeric(
            war["RS_def_total"].replace("NULL", np.nan),
            errors="coerce"
        ).fillna(0)
        # Top 7 seasons por WAR para calcular DEF pico
        war["WAR_num"] = pd.to_numeric(war["WAR"].replace("NULL", np.nan), errors="coerce").fillna(0)
        war_sorted = war.sort_values(["player_ID", "WAR_num"], ascending=[True, False])
        war_peak = war_sorted.groupby("player_ID").head(PEAK_SEASONS)
        def_df = war_peak.groupby("player_ID").agg(
            def_runs=("RS_def_total", "sum")
        ).reset_index().rename(columns={"player_ID": "bbrefID"})
        id_map = people[["playerID", "bbrefID"]].dropna(subset=["bbrefID"])
        def_df = def_df.merge(id_map, on="bbrefID", how="left").dropna(subset=["playerID"])
        df = df.merge(def_df[["playerID", "def_runs"]], on="playerID", how="left")
        df["def_raw"] = df["def_runs"].fillna(0)
        df["defense_source"] = np.where(df["def_runs"].notna(), "bbref_war", "proxy_zero")
        print(f"  DEF (BBRef RS_def) para {df['def_runs'].notna().sum():,} pitchers")
    else:
        df["def_raw"] = 0.0
        df["defense_source"] = "proxy_zero"

    return df


# ── PASO 10: Normalización por Era ───────────────────────────────────────────
def paso_10_normalizar_por_era(df):
    """
    Mismo metodo OPS+ que bateadores: blended_factor = 1 + 0.75*(global/era - 1)
    Valores menores son mejores para CTL (BB/9) y HR (HR/9) → invert=True
    """
    print("\n  PASO 10: Normalizando por Era (ajuste OPS+ 75%)...")
    df = normalize_difficulty_adjusted(df, "str_raw", "str_val", invert=False)   # mas K/9 = mejor
    df = normalize_difficulty_adjusted(df, "ctl_raw", "ctl_val", invert=True)    # menos BB/9 = mejor
    df = normalize_difficulty_adjusted(df, "hr_raw",  "hr_val",  invert=True)    # menos HR/9 = mejor
    df = normalize_difficulty_adjusted(df, "sta_raw", "sta_val", invert=False)   # mas IP/GS = mejor
    df = normalize_difficulty_adjusted(df, "grt_raw", "grt_val", invert=False)   # mas ERA+ = mejor
    df = normalize_difficulty_adjusted(df, "def_raw", "def_val", invert=False)   # mas RS_def = mejor

    print("  str_val, ctl_val, hr_val, sta_val, grt_val, def_val normalizados")
    return df


# ── PASO 11: OVR y Rareza ─────────────────────────────────────────────────────
def paso_11_ovr_rareza(df):
    """
    OVR = STR*0.25 + CTL*0.25 + GRT*0.25 + STA*0.15 + DEF*0.05 + HR_val*0.05
    Rareza con bono HoF +8 y bono AllStar 0.5/seleccion (max 6)
    """
    print("\n  PASO 11: OVR y Rareza...")
    df = df.copy()
    df["ovr"] = (
        df["str_val"] * 0.25 +
        df["ctl_val"] * 0.25 +
        df["grt_val"] * 0.25 +
        df["sta_val"] * 0.15 +
        df["hr_val"]  * 0.05 +
        df["def_val"] * 0.05
    ).round(1)

    df["rarity"] = df.apply(asignar_rareza, axis=1)

    for col, gcol in [
        ("str_val", "str_grade"), ("ctl_val", "ctl_grade"),
        ("grt_val", "grt_grade"), ("sta_val", "sta_grade"),
        ("def_val", "def_grade"),
    ]:
        df[gcol] = df[col].apply(to_grade)

    print(f"  OVR calculado. Media: {df['ovr'].mean():.1f}")
    print(f"  Distribucion por rareza:\n{df['rarity'].value_counts().to_string()}")
    return df



FRANCHISE_MAP = {
    'NYY': 'NYY', 'NYA': 'NYY',
    'NYM': 'NYM', 'NYN': 'NYM',
    'CHW': 'CHW', 'CHA': 'CHW',
    'CHC': 'CHC', 'CHN': 'CHC',
    'LAD': 'LAD', 'LAN': 'LAD', 'BRO': 'LAD',
    'SFG': 'SFG', 'SFN': 'SFG', 'NY1': 'SFG',
    'STL': 'STL', 'SLN': 'STL',
    'BAL': 'BAL', 'SLA': 'BAL',
    'ATL': 'ATL', 'BSN': 'ATL', 'ML1': 'ATL',
    'OAK': 'OAK', 'PHA': 'OAK', 'KCA': 'OAK',
    'MIN': 'MIN', 'WS1': 'MIN',
    'WSH': 'WSH', 'MON': 'WSH', 'WAS': 'WSH',
    'TEX': 'TEX', 'WS2': 'TEX',
    'LAA': 'LAA', 'ANA': 'LAA', 'CAL': 'LAA',
    'MIA': 'MIA', 'FLA': 'MIA', 'FLO': 'MIA',
    'MIL': 'MIL', 'ML4': 'MIL', 'SE1': 'MIL',
    'TB':  'TB',  'TBD': 'TB',  'TBA': 'TB',
    'SDP': 'SDP', 'SDN': 'SDP',
    'CIN': 'CIN', 'CLE': 'CLE', 'BOS': 'BOS', 'DET': 'DET', 'PIT': 'PIT',
    'PHI': 'PHI', 'HOU': 'HOU', 'TOR': 'TOR', 'KCR': 'KCR', 'SEA': 'SEA',
    'COL': 'COL', 'ARI': 'ARI',
}

NLB_TEAMS = {
    'BEG', 'KCM', 'MRS', 'HG', 'CBE', 'CAG', 'PC', 'BE', 'IN9', 'BIR',
    'KC1', 'HOM', 'DTW', 'NW2', 'NY5', 'NY6', 'AS2', 'MEM', 'BBB', 'BBS',
    'BCA', 'BG1', 'BG2', 'BGS', 'CBR', 'CC1', 'CC2', 'CCC', 'CCG', 'CCG2',
    'CGI', 'CIG', 'CLG', 'CLP', 'CLS', 'COS', 'CSG', 'CSG2', 'CSG3', 'CSW',
    'CTG', 'CTS', 'CUP', 'CXG', 'DYM', 'ECK', 'FLP', 'GOR', 'HBG', 'HIL',
    'JRC', 'KCG', 'KRG', 'LEL', 'LOU', 'LRG', 'LVB', 'MB', 'MGS', 'MOH',
    'MRM', 'NBY', 'ND', 'NE', 'NEW', 'NLG', 'NLS', 'NS', 'NWB', 'NYC',
    'NYI', 'OKM', 'PBG', 'PBK', 'PG', 'PHK', 'PS', 'PTG', 'QG', 'RIC',
    'SBS', 'SC1', 'SEN', 'SL2', 'SLS', 'SPG', 'STP', 'SYS', 'WAP', 'WBS',
    'WNA', 'WNL', 'WP', 'WST', 'ML2'
}

def map_to_canonical_team(row):
    t = str(row.get("canonical_teamID", row.get("team", "UNK"))).strip()
    franch = str(row.get("franchID", "")).strip()
    if t in NLB_TEAMS or franch in NLB_TEAMS:
        return "NLB"
    if franch in FRANCHISE_MAP:
        return FRANCHISE_MAP[franch]
    if t in FRANCHISE_MAP:
        return FRANCHISE_MAP[t]
    return "HIST"


# ── PASO 12: Equipo canónico y exportar ──────────────────────────────────────
def paso_12_exportar(df, pitching, teams, franchises):
    print("\n  PASO 12: Equipo canonico y exportacion...")

    if not pitching.empty:
        team_seasons = pitching.groupby(["playerID", "teamID"])["yearID"].count().reset_index()
        team_seasons.columns = ["playerID", "teamID", "team_count"]
        canonical = (
            team_seasons.sort_values("team_count", ascending=False)
                        .drop_duplicates(subset="playerID")
                        .rename(columns={"teamID": "canonical_teamID"})
        )
        df = df.merge(canonical[["playerID", "canonical_teamID"]], on="playerID", how="left")
    else:
        df["canonical_teamID"] = "UNK"

    if not teams.empty and "franchID" in teams.columns:
        team_franch = teams[["teamID", "franchID"]].drop_duplicates(subset=["teamID"])
        df = df.merge(team_franch, left_on="canonical_teamID", right_on="teamID", how="left")
        df.drop(columns=["teamID"], errors="ignore", inplace=True)
    
    df = df.drop_duplicates(subset=["playerID"]).copy()
    df["canonical_teamID"] = df.apply(map_to_canonical_team, axis=1)
    df["franchise_name"] = df["canonical_teamID"]

    keep_cols = [
        "playerID", "bbrefID", "full_name", "era_label",
        "peak_year", "peak_year_display", "debut_year", "last_year",
        "canonical_teamID", "franchise_name", "role",
        "career_g", "career_gs", "career_sv", "career_ip", "career_w", "career_l",
        "career_so", "career_bb", "career_hr",
        "peak_war", "peak_k9", "peak_bb9", "peak_hr9", "peak_era", "peak_era_plus",
        "peak_ip_per_gs",
        "str_val", "ctl_val", "grt_val", "sta_val", "hr_val", "def_val",
        "str_grade", "ctl_grade", "grt_grade", "sta_grade", "def_grade",
        "ovr", "rarity",
        "is_allstar", "is_hof", "allstar_selections",
        "defense_source",
    ]
    keep_cols = [c for c in keep_cols if c in df.columns]
    final = df[keep_cols].copy()
    final.rename(columns={
        "full_name":        "name",
        "era_label":        "era",
        "canonical_teamID": "team",
    }, inplace=True)

    for col in ["peak_k9", "peak_bb9", "peak_hr9", "peak_era", "peak_era_plus", "peak_ip_per_gs", "peak_war"]:
        if col in final.columns:
            final[col] = final[col].round(2)

    final.sort_values(["era", "ovr"], ascending=[True, False], inplace=True)
    final.reset_index(drop=True, inplace=True)
    print(f"  DataFrame final: {len(final):,} pitchers x {len(final.columns)} columnas")

    # ── CSV ──────────────────────────────────────────────────────────────────
    final.to_csv(OUT_CSV, index=False, encoding="utf-8")
    print(f"  [OK]  pitchers_pool.csv  ->  {OUT_CSV}")

    # ── JS ───────────────────────────────────────────────────────────────────
    js_lines = [
        "// AUTO-GENERADO por pitchers_etl.py v1.0 - NO EDITAR MANUALMENTE",
        f"// Total: {len(final):,} cartas de pitchers  |  Peak 7 temporadas por WAR  |  Ajuste por Era OPS+",
        "(function() {",
        "  const PITCHERS_POOL = [",
    ]
    for _, r in final.iterrows():
        name_js  = str(r.get("name",  "")).replace('"', "'")
        era_js   = str(r.get("era",   "Unknown")).replace('"', "'")
        team_js  = str(r.get("team",  "UNK")).replace('"', "'")
        role_js  = str(r.get("role",  "SP"))

        js_lines.append(
            f'    {{ '
            f'name: "{name_js}", role: "{role_js}", era: "{era_js}", '
            f'team: "{team_js}", year: {int(r["peak_year_display"])}, '
            f'str: {int(r["str_val"])}, ctl: {int(r["ctl_val"])}, '
            f'grt: {int(r["grt_val"])}, sta: {int(r["sta_val"])}, '
            f'def: {int(r["def_val"])}, '
            f'str_grade: "{r["str_grade"]}", ctl_grade: "{r["ctl_grade"]}", '
            f'grt_grade: "{r["grt_grade"]}", sta_grade: "{r["sta_grade"]}", '
            f'def_grade: "{r["def_grade"]}", '
            f'ovr: {float(r["ovr"]):.1f}, '
            f'rarity: "{r["rarity"]}", '
            f'allstars: {int(r["allstar_selections"])}, '
            f'hof: {"true" if r["is_hof"] else "false"}, '
            f'k9: {float(r["peak_k9"]):.2f}, '
            f'bb9: {float(r["peak_bb9"]):.2f}, '
            f'hr9: {float(r["peak_hr9"]):.2f}, '
            f'era_plus: {float(r["peak_era_plus"]):.1f}, '
            f'war_peak: {float(r["peak_war"]):.1f}, '
            f'career_gs: {int(r["career_gs"])}, '
            f'career_sv: {int(r["career_sv"])}, '
            f'def_source: "{r.get("defense_source","proxy_zero")}" '
            f'}},'
        )
    js_lines += [
        "  ];",
        "  if (typeof window !== 'undefined') {",
        "    window.PitchersDB = window.PitchersDB || {};",
        "    window.PitchersDB.PITCHERS_POOL = PITCHERS_POOL;",
        "    window.PITCHERS_POOL = PITCHERS_POOL;",
        "  }",
        "  if (typeof module !== 'undefined') module.exports = PITCHERS_POOL;",
        "})();",
    ]
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("\n".join(js_lines))
    print(f"  [OK]  pitchers_pool.js  ->  {OUT_JS}")
    return final


# ── REPORTE FINAL ────────────────────────────────────────────────────────────
def reporte_final(df):
    print("\n" + "=" * 64)
    print("  REPORTE FINAL - BaseRogue Pitchers Pool v1.0")
    print("=" * 64)
    print(f"\n  Total de cartas: {len(df):,}")
    print(f"\n  Distribucion por Rareza:\n{df['rarity'].value_counts().to_string()}")
    print(f"\n  Distribucion por Era:\n{df['era'].value_counts().sort_index().to_string()}")
    print(f"\n  Distribucion por Rol:\n{df['role'].value_counts().to_string()}")
    print("\n  Atributos promedio (escala 1-99):")
    for col, label in [
        ("str_val","STR"), ("ctl_val","CTL"), ("grt_val","GRT"),
        ("sta_val","STA"), ("def_val","DEF"), ("ovr","OVR"),
    ]:
        if col in df.columns:
            print(f"    {label}: {df[col].mean():5.1f}  (min:{df[col].min():4.1f} max:{df[col].max():4.1f})")

    print("\n  TOP 20 pitchers (por OVR):")
    top = df.nlargest(20, "ovr")[[
        "name", "role", "era", "peak_year_display", "rarity", "ovr",
        "str_val", "ctl_val", "grt_val", "sta_val",
        "peak_k9", "peak_bb9", "peak_era_plus", "peak_war", "allstar_selections", "is_hof"
    ]]
    pd.set_option("display.max_columns", 20)
    pd.set_option("display.width", 240)
    pd.set_option("display.float_format", "{:.1f}".format)
    print(top.to_string(index=False))
    print("\n" + "=" * 64)


# ── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 64)
    print("  BaseRogue Pitchers ETL v1.0")
    print(f"  Peak {PEAK_SEASONS} temporadas | Ajuste OPS+ Era | Filtro 100GS/150G/AS/HoF")
    print("=" * 64)

    dfs        = paso_1_cargar_datos()
    people     = dfs["people"]
    pitching   = dfs["pitching"]
    allstar    = dfs["allstar"]
    hof        = dfs["hof"]
    teams      = dfs["teams"]
    franchises = dfs["franchises"]
    awards     = dfs["awards"]
    fielding   = dfs["fielding"]
    war_pitch  = dfs["war_pitch"]

    pure_pitchers = paso_2_identificar_pitchers_puros(fielding)
    career        = paso_3_carrera_pitching(pitching)
    peak          = paso_4_pico_pitching(pitching, war_pitch, people)
    eligible      = paso_5_filtro_ingesta(career, peak, allstar, hof, pure_pitchers, pitching)
    eligible      = paso_6_enriquecer_people(eligible, people)
    eligible      = paso_7_asignar_era(eligible)
    eligible      = paso_8_atributos_raw(eligible)
    eligible      = paso_9_fielding_pitchers(eligible, war_pitch, people)
    eligible      = paso_10_normalizar_por_era(eligible)
    eligible      = paso_11_ovr_rareza(eligible)
    final         = paso_12_exportar(eligible, pitching, teams, franchises)

    reporte_final(final)
    return final


if __name__ == "__main__":
    result_df = main()
