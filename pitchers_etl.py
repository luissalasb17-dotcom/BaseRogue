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

# Temporadas de relevo dominante quedan opacadas por temporadas mediocres de
# abridor solo por volumen de innings (mismo WAR crudo, muchas mas IP). Este
# boost se aplica UNICAMENTE al ranking usado para elegir las PEAK_SEASONS
# mejores temporadas, nunca al war_season real que se guarda/muestra.
RELIEF_WAR_BOOST          = 1.6   # boost 1.6x acordado para WAR de temporadas de relevo
RELIEF_GS_RATIO_THRESHOLD = 0.50  # umbral 50% para definir temporada mayormente de relevo

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


def normalize_series(s, low=5.0, high=105.0):
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
    # Unified Era Normalization for pitchers
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
    # Incluir variantes duales canónicas y leyendas históricas de dos vías (Ruth, Rogan, Ward, Caruthers, Wood)
    for dual_id in ["eckerde01_sp", "eckerde01_rp", "smoltjo01_sp", "smoltjo01_rp", "ruthba01", "roganbu99", "wardjo01", "carutbo01", "woodjo02"]:
        pure_pitchers.add(dual_id)
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

    # Duplicar stints de carrera para dual pitchers (Eckersley y Smoltz)
    dual_rows = []
    for orig_id, (sp_id, rp_id) in [("eckerde01", ("eckerde01_sp", "eckerde01_rp")), ("smoltjo01", ("smoltjo01_sp", "smoltjo01_rp"))]:
        stints = pit[pit["playerID"] == orig_id].copy()
        stints_sp = stints.copy()
        stints_sp["playerID"] = sp_id
        stints_rp = stints.copy()
        stints_rp["playerID"] = rp_id
        dual_rows.extend([stints_sp, stints_rp])
    if dual_rows:
        pit = pd.concat([pit[~pit["playerID"].isin(["eckerde01", "smoltjo01"])]] + dual_rows, ignore_index=True)

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
        for col in ["WAR", "GS", "G", "IPouts", "IPouts_start", "IPouts_relief", "ERA_plus"]:
            if col in war.columns:
                war[col] = pd.to_numeric(
                    war[col].replace("NULL", np.nan) if isinstance(war[col].iloc[0], str) else war[col],
                    errors="coerce"
                ).fillna(0)
            else:
                war[col] = 0.0
        war_season = war.groupby(["player_ID", "year_ID"]).agg(
            war_season    =("WAR",           "sum"),
            era_plus_y    =("ERA_plus",      "mean"),  # media ponderada de stints
            ipouts_start_y=("IPouts_start",  "sum"),
            ipouts_rel_y  =("IPouts_relief", "sum"),
        ).reset_index()
        war_season.columns = ["bbrefID", "yearID", "war_season", "era_plus_y", "ipouts_start_y", "ipouts_rel_y"]

        id_map = people[["playerID", "bbrefID"]].dropna(subset=["bbrefID"])
        war_yearly = (
            war_season.merge(id_map, on="bbrefID", how="left")
                      .dropna(subset=["playerID"])[["playerID", "yearID", "war_season", "era_plus_y", "ipouts_start_y", "ipouts_rel_y"]]
        )
        print(f"  WAR anual para {war_yearly['playerID'].nunique():,} pitchers (BBRef)")
    else:
        print("  WAR no disponible - usando ERA fallback")

    # Duplicar stints de pit_yearly para dual pitchers con filtrado de rol (SP vs RP)
    dual_pit_rows = []
    for orig_id, (sp_id, rp_id) in [("eckerde01", ("eckerde01_sp", "eckerde01_rp")), ("smoltjo01", ("smoltjo01_sp", "smoltjo01_rp"))]:
        stints = pit_yearly[pit_yearly["playerID"] == orig_id].copy()
        stints_sp = stints[stints["GS"] / stints["G"].replace(0, 1) >= 0.50].copy()
        stints_sp["playerID"] = sp_id
        stints_rp = stints[stints["GS"] / stints["G"].replace(0, 1) < 0.50].copy()
        stints_rp["playerID"] = rp_id
        dual_pit_rows.extend([stints_sp, stints_rp])
    if dual_pit_rows:
        pit_yearly = pd.concat([pit_yearly[~pit_yearly["playerID"].isin(["eckerde01", "smoltjo01"])]] + dual_pit_rows, ignore_index=True)

    if not war_yearly.empty:
        # Duplicar registros de war_yearly para dual pitchers
        dual_war_rows = []
        for orig_id, (sp_id, rp_id) in [("eckerde01", ("eckerde01_sp", "eckerde01_rp")), ("smoltjo01", ("smoltjo01_sp", "smoltjo01_rp"))]:
            w_rows = war_yearly[war_yearly["playerID"] == orig_id].copy()
            w_sp = w_rows.copy(); w_sp["playerID"] = sp_id
            w_rp = w_rows.copy(); w_rp["playerID"] = rp_id
            dual_war_rows.extend([w_sp, w_rp])
        if dual_war_rows:
            war_yearly = pd.concat([war_yearly[~war_yearly["playerID"].isin(["eckerde01", "smoltjo01"])]] + dual_war_rows, ignore_index=True)

        pit_yearly = pit_yearly.merge(war_yearly, on=["playerID", "yearID"], how="left")
    else:
        pit_yearly["war_season"] = np.nan
        pit_yearly["era_plus_y"] = np.nan
        pit_yearly["ipouts_start_y"] = np.nan
        pit_yearly["ipouts_rel_y"] = np.nan

    # Fallbacks limpios si no hay desglose de BBRef para outs de apertura vs relevo
    has_start_outs = pit_yearly["ipouts_start_y"].notna()
    # Si no hay BBRef: si es 100% abridor (GS == G), todos los IPouts son de abridor; sino estimar proporcional
    est_sp_outs = np.where(
        pit_yearly["G"] > 0,
        (pit_yearly["GS"] / pit_yearly["G"]) * pit_yearly["IPouts"],
        0.0
    )
    pit_yearly["ipouts_start_clean"] = np.where(has_start_outs, pit_yearly["ipouts_start_y"].fillna(0), est_sp_outs)
    pit_yearly["ipouts_rel_clean"]   = np.where(has_start_outs, pit_yearly["ipouts_rel_y"].fillna(0), pit_yearly["IPouts"] - est_sp_outs)

    NLB_WAR_BOOST = 2.0
    nl_leagues = {'NN1', 'NN2', 'EAL', 'NSL', 'NAL', 'ANL', 'EWL', 'NNL', 'ECL', 'IND'}

    # Seleccionar top PEAK_SEASONS por WAR (o por ERA inverso si no hay WAR).
    # Temporadas mayormente de relevo (GS/G < 0.50) reciben un boost 1.6x SOLO para este ranking.
    # Temporadas de NLB (Ligas Negras) reciben un boost 2.0x SOLO para este ranking por volumen de calendario.
    def seleccionar_pico(group):
        g = group.copy()
        if g["war_season"].notna().any():
            gs_ratio = g["GS"] / g["G"].replace(0, np.nan)
            is_relief_season = gs_ratio.fillna(0) < RELIEF_GS_RATIO_THRESHOLD
            relief_mult = np.where(is_relief_season, RELIEF_WAR_BOOST, 1.0)
            is_nlb_season = (g["lgID"].isin(nl_leagues) if "lgID" in g.columns else False) | (g["teamID"].isin(NLB_TEAMS) if "teamID" in g.columns else False)
            nlb_mult = np.where(is_nlb_season, NLB_WAR_BOOST, 1.0)
            g["war_ranking"] = g["war_season"] * relief_mult * nlb_mult
            g = g.sort_values("war_ranking", ascending=False, na_position="last")
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

    # Identify NLB pitchers based on league ID or team ID in peak seasons
    pico_df["is_nlb_season"] = (
        (pico_df["lgID"].isin(nl_leagues) if "lgID" in pico_df.columns else False) |
        (pico_df["teamID"].isin(NLB_TEAMS) if "teamID" in pico_df.columns else False)
    )
    nlb_counts = pico_df.groupby("playerID")["is_nlb_season"].sum()

    # Índice de Dedicación Anual en el pico (GS / G en cada temporada)
    pico_df["sp_dedication"] = (pico_df["GS"] / pico_df["G"].replace(0, np.nan)).fillna(0.0)
    pico_df["is_sp_season"] = (pico_df["sp_dedication"] >= 0.50)
    sp_season_counts = pico_df.groupby("playerID")["is_sp_season"].sum().reset_index(name="sp_seasons_count")
    mean_dedication = pico_df.groupby("playerID")["sp_dedication"].mean().reset_index(name="mean_sp_dedication")

    peak = pico_df.groupby("playerID").agg(
        peak_ip          =("IP_y",               "sum"),
        peak_gs          =("GS",                 "sum"),
        peak_g           =("G",                  "sum"),
        peak_sv          =("SV",                 "sum"),
        peak_so          =("SO",                 "sum"),
        peak_bb          =("BB",                 "sum"),
        peak_hr_a        =("HR_a",               "sum"),
        peak_er          =("ER",                 "sum"),
        peak_h           =("H",                  "sum"),
        peak_w           =("W",                  "sum"),
        peak_l           =("L",                  "sum"),
        peak_war         =("war_season",         "sum"),
        peak_era_plus    =("era_plus_y",         "mean"),   # promedio de ERA+ en peak
    ).reset_index()

    peak["is_nlb"] = peak["playerID"].map(nlb_counts > 0).fillna(False)

    peak = peak.merge(sp_season_counts, on="playerID", how="left")
    peak["sp_seasons_count"] = peak["sp_seasons_count"].fillna(0).astype(int)

    peak = peak.merge(mean_dedication, on="playerID", how="left")
    peak["mean_sp_dedication"] = peak["mean_sp_dedication"].fillna(0.0)

    total_season_counts = pico_df.groupby("playerID")["yearID"].count().reset_index(name="total_seasons_in_peak")
    peak = peak.merge(total_season_counts, on="playerID", how="left")
    peak["total_seasons_in_peak"] = peak["total_seasons_in_peak"].fillna(1).astype(int)

    career_war_df = pit_yearly.groupby("playerID")["war_season"].sum().reset_index(name="career_war")
    peak = peak.merge(career_war_df, on="playerID", how="left")

    # Rol por % de Dedicación Promedio en el Pico (>= 50% => SP, sino RP)
    is_dual_sp = peak["playerID"].isin(["eckerde01_sp", "smoltjo01_sp"])
    is_dual_rp = peak["playerID"].isin(["eckerde01_rp", "smoltjo01_rp"])
    peak["role"] = np.where(
        is_dual_sp,
        "SP",
        np.where(
            is_dual_rp,
            "RP",
            np.where(peak["mean_sp_dedication"] >= 0.50, "SP", "RP")
        )
    )

    # Stamina calculada según el Rol asignado:
    # SP: IP / GS en sus temporadas de abridor
    # RP: IP / G en sus temporadas de relevista
    pico_df_role = pico_df.merge(peak[["playerID", "role"]], on="playerID")
    def _calc_role_sta(g):
        r = g["role"].iloc[0]
        if r == "SP":
            sp_seasons = g[g["is_sp_season"]]
            if sp_seasons.empty or sp_seasons["GS"].sum() == 0:
                sp_seasons = g
            ip = sp_seasons["IP_y"].sum()
            gs = sp_seasons["GS"].sum()
            return (ip / gs) if gs > 0 else 6.0
        else:
            rp_seasons = g[~g["is_sp_season"]]
            if rp_seasons.empty or rp_seasons["G"].sum() == 0:
                rp_seasons = g
            ip = rp_seasons["IP_y"].sum()
            games = rp_seasons["G"].sum()
            return (ip / games) if games > 0 else 1.2

    sta_series = pico_df_role.groupby("playerID").apply(_calc_role_sta).reset_index(name="peak_sta_rate")
    peak = peak.merge(sta_series, on="playerID", how="left")

    peak = peak.merge(peak_median,  on="playerID", how="left")
    peak = peak.merge(peak_display, on="playerID", how="left")
    peak["ip_per_year"] = peak["peak_ip"] / peak["total_seasons_in_peak"].clip(lower=1)
    ip_p = peak["peak_ip"].replace(0, np.nan)
    peak["peak_h9"]  = peak["peak_h"]    / ip_p * 9.0
    peak["peak_k9"]  = peak["peak_so"]   / ip_p * 9.0
    peak["peak_bb9"] = peak["peak_bb"]   / ip_p * 9.0
    peak["peak_hr9"] = peak["peak_hr_a"] / ip_p * 9.0
    peak["peak_era"] = peak["peak_er"]   / ip_p * 9.0

    print(f"  Pico calculado para {len(peak):,} pitchers")
    return peak, pico_df


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

    # Propagar HoF y All-Star a variantes duales
    for orig_id, (sp_id, rp_id) in [("eckerde01", ("eckerde01_sp", "eckerde01_rp")), ("smoltjo01", ("smoltjo01_sp", "smoltjo01_rp"))]:
        if orig_id in allstar_ids:
            allstar_ids.add(sp_id); allstar_ids.add(rp_id)
        if orig_id in hof_ids:
            hof_ids.add(sp_id); hof_ids.add(rp_id)

    print(f"  All-Stars: {len(allstar_ids):,}  |  HoF: {len(hof_ids):,}")

    # Solo pitchers puros
    df = career[career["playerID"].isin(pure_pitcher_ids)].copy()
    df = df.merge(peak, on="playerID", how="inner")
    print(f"  Pitchers puros con datos de pico: {len(df):,}")

    df["is_allstar"] = df["playerID"].isin(allstar_ids)
    df["is_hof"]     = df["playerID"].isin(hof_ids)

    # Identificar pitchers de Negro Leagues (NLB) basandose en IPouts
    nl_leagues = {'NN1', 'NN2', 'EAL', 'NSL', 'NAL', 'ANL', 'EWL'}
    if not pitching.empty and "lgID" in pitching.columns:
        nlb_ip = pitching[pitching['lgID'].isin(nl_leagues) | pitching['teamID'].isin(NLB_TEAMS)].groupby('playerID')['IPouts'].sum()
        mlb_ip = pitching[~pitching['lgID'].isin(nl_leagues) & ~pitching['teamID'].isin(NLB_TEAMS)].groupby('playerID')['IPouts'].sum()
        df['nlb_ip'] = df['playerID'].map(nlb_ip).fillna(0)
        df['mlb_ip'] = df['playerID'].map(mlb_ip).fillna(0)
        df['is_nlb'] = df['nlb_ip'] > df['mlb_ip']
    else:
        df['is_nlb'] = False

    if not allstar.empty:
        as_copy = allstar.copy()
        # Duplicar selecciones All-Star para dual pitchers
        dual_as = []
        for orig_id, (sp_id, rp_id) in [("eckerde01", ("eckerde01_sp", "eckerde01_rp")), ("smoltjo01", ("smoltjo01_sp", "smoltjo01_rp"))]:
            as_rows = as_copy[as_copy["playerID"] == orig_id].copy()
            as_sp = as_rows.copy(); as_sp["playerID"] = sp_id
            as_rp = as_rows.copy(); as_rp["playerID"] = rp_id
            dual_as.extend([as_sp, as_rp])
        if dual_as:
            as_copy = pd.concat([as_copy] + dual_as, ignore_index=True)
        as_count = as_copy.groupby("playerID").size().reset_index(name="allstar_selections")
        df = df.merge(as_count, on="playerID", how="left")
    else:
        df["allstar_selections"] = 0
    df["allstar_selections"] = df["allstar_selections"].fillna(0).astype(int)

    # Criterio Unificado de Ingesta para Pitchers:
    # 1. Volumen de carrera: SP >= 100 GS | RP >= 200 G
    # 2. Calidad / Estrellato Joven:
    #    - SP: (career_war >= 5.0 OR peak_war >= 5.0) AND career_ip >= 150.0
    #    - RP: (career_war >= 3.5 OR peak_war >= 3.5) AND career_ip >= 100.0
    # 3. Reconocimiento Histórico: HoF incondicional OR (All-Star AND career_ip >= 35.0)
    MIN_IP_ALLSTAR = 35.0

    def is_eligible(r):
        if r["is_hof"]:
            return True
        if r["is_allstar"] and (r.get("career_ip", 0) >= MIN_IP_ALLSTAR):
            return True
        c_war = r.get("career_war", 0) if pd.notna(r.get("career_war")) else 0
        p_war = r.get("peak_war", 0) if pd.notna(r.get("peak_war")) else 0
        cip = r.get("career_ip", 0) if pd.notna(r.get("career_ip")) else 0
        if r["role"] == "SP":
            return (r["career_gs"] >= 100) or (((c_war >= 5.0) or (p_war >= 5.0)) and (cip >= 150.0))
        else:
            return (r["career_g"] >= 200) or (((c_war >= 3.5) or (p_war >= 3.5)) and (cip >= 100.0))

    mask = df.apply(is_eligible, axis=1)
    eligible = df[mask].copy()

    # Comprehensive list of all Negro League lgID codes in Seamheads / Lahman:
    nl_leagues = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'IND', 'EAS', 'NN1'}
    if not pitching.empty and 'lgID' in pitching.columns:
        nl_ip_df = pitching[pitching['lgID'].isin(nl_leagues)].groupby('playerID')['IPouts'].sum().reset_index().rename(columns={'IPouts': 'nlb_ipouts'})
        ml_ip_df = pitching[~pitching['lgID'].isin(nl_leagues)].groupby('playerID')['IPouts'].sum().reset_index().rename(columns={'IPouts': 'mlb_ipouts'})
        
        eligible = eligible.merge(nl_ip_df, on='playerID', how='left').merge(ml_ip_df, on='playerID', how='left')
        eligible['nlb_ipouts'] = eligible['nlb_ipouts'].fillna(0)
        eligible['mlb_ipouts'] = eligible['mlb_ipouts'].fillna(0)
        eligible['league_group'] = np.where(eligible['nlb_ipouts'] > eligible['mlb_ipouts'], 'NLB', 'MLB')
        eligible = eligible.drop(columns=['nlb_ipouts', 'mlb_ipouts'])
    else:
        eligible['league_group'] = 'MLB'

    print(f"  Elegibles: {len(eligible):,}  (SP: {(eligible['role']=='SP').sum():,} | RP: {(eligible['role']=='RP').sum():,})")
    return eligible


# ── PASO 6: Enriquecer con People.csv ────────────────────────────────────────
SR_JR_MAP = {
    "griffke01": "Ken Griffey Sr.",
    "griffke02": "Ken Griffey Jr.",
    "guerrvl01": "Vladimir Guerrero Sr.",
    "guerrvl02": "Vladimir Guerrero Jr.",
    "ripkeca01": "Cal Ripken Jr.",
    "wittbo01":  "Bobby Witt Sr.",
    "wittbo02":  "Bobby Witt Jr.",
    "tatafe01":  "Fernando Tatis Sr.",
    "tatafe02":  "Fernando Tatis Jr.",
    "younger01": "Eric Young Sr.",
    "younger03": "Eric Young Jr.",
    "alomasa01": "Sandy Alomar Sr.",
    "alomasa02": "Sandy Alomar Jr.",
    "gwynnto01": "Tony Gwynn",
    "gwynnto02": "Tony Gwynn Jr.",
    "cruzjo01":  "Jose Cruz Sr.",
    "cruzjo02":  "Jose Cruz Jr.",
    "borbope01": "Pedro Borbon Sr.",
    "borbope02": "Pedro Borbon Jr.",
    "stottme01": "Mel Stottlemyre Sr.",
    "stottme02": "Mel Stottlemyre Jr.",
    "acunaro01": "Ronald Acuña Jr.",
}

def paso_6_enriquecer_people(df, people):
    print("\n  PASO 6: Enriqueciendo con People.csv...")
    if people.empty:
        return df
    slim = people[["playerID", "nameFirst", "nameLast", "bbrefID"]].copy()

    # Agregar registros para dual pitchers
    dual_people = [
        {"playerID": "eckerde01_sp", "nameFirst": "Dennis", "nameLast": "Eckersley", "bbrefID": "eckerde01"},
        {"playerID": "eckerde01_rp", "nameFirst": "Dennis", "nameLast": "Eckersley", "bbrefID": "eckerde01"},
        {"playerID": "smoltjo01_sp", "nameFirst": "John",   "nameLast": "Smoltz",    "bbrefID": "smoltjo01"},
        {"playerID": "smoltjo01_rp", "nameFirst": "John",   "nameLast": "Smoltz",    "bbrefID": "smoltjo01"},
    ]
    slim = pd.concat([slim, pd.DataFrame(dual_people)], ignore_index=True)

    slim["full_name"] = (slim["nameFirst"].fillna("") + " " + slim["nameLast"].fillna("")).str.strip()
    for pid, explicit_name in SR_JR_MAP.items():
        slim.loc[slim["playerID"] == pid, "full_name"] = explicit_name

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


# ── PASO 8: Atributos RAW de pitching (MLB The Show Suite: H/9, K/9, BB/9, HR/9, STA) ──
def paso_8_atributos_raw(df):
    """
    H9_raw:  H/9  → Hits permitidos por 9 IP (menor es mejor → invert=True) con suavizado bayesiano (m=40 IP a 8.5 H/9)
    K9_raw:  K/9  → Ponches por 9 IP (mayor es mejor → invert=False) con suavizado bayesiano (m=40 IP a 5.5 K/9)
    BB9_raw: BB/9 → Paseos por 9 IP (menor es mejor → invert=True) con suavizado bayesiano (m=40 IP a 3.2 BB/9)
    HR9_raw: HR/9 → Jonrones por 9 IP (menor es mejor → invert=True) con suavizado bayesiano (m=40 IP a 0.9 HR/9)
    STA_raw: IP por salida (Innings promedio por aparicion en el pico)
    """
    print("\n  PASO 8: Atributos RAW de pitching (MLB The Show Suite: H/9, K/9, BB/9, HR/9, STA)...")
    df = df.copy()

    ip_k = df["peak_ip"].fillna(df["career_ip"]).fillna(0)
    h_k  = df["peak_h"].fillna(0)
    so_k = df["peak_so"].fillna(0)
    bb_k = df["peak_bb"].fillna(0)
    hr_k = df["peak_hr_a"].fillna(0)

    # Suavizado bayesiano: m = 200 IP unificado para todos (equivalente a 1 temporada de lanzador abridor)
    m_ip = 200.0

    df["h9_raw"]  = (h_k  + m_ip * (8.5 / 9.0)) / (ip_k + m_ip) * 9.0
    df["k9_raw"]  = (so_k + m_ip * (5.5 / 9.0)) / (ip_k + m_ip) * 9.0
    df["bb9_raw"] = (bb_k + m_ip * (3.2 / 9.0)) / (ip_k + m_ip) * 9.0
    df["hr9_raw"] = (hr_k + m_ip * (0.9 / 9.0)) / (ip_k + m_ip) * 9.0

    # Aliases de compatibilidad
    df["str_raw"] = df["k9_raw"]
    df["ctl_raw"] = df["bb9_raw"]
    df["hr_raw"]  = df["hr9_raw"]

    # IP anual promedio en el pico con factor de calendario 2.0x para NLB
    is_nlb = df["is_nlb"].fillna(False) if "is_nlb" in df.columns else False
    nlb_calendar_mult = np.where(is_nlb, 2.0, 1.0)
    df["ip_per_year_raw"] = df["ip_per_year"].fillna(50.0) * nlb_calendar_mult
    df["sta_raw"] = df["ip_per_year_raw"]

    print("  h9_raw, k9_raw, bb9_raw, hr9_raw, sta_raw calculados con suavizado Bayesiano (m=200)")
    return df


# ── PASO 9: Desactivacion de Fielding de Pitchers (DEF eliminada) ──────────────
def paso_9_fielding_pitchers(df, war_pitch, people):
    print("\n  PASO 9: Fielding de pitchers (DEF eliminada del sistema)...")
    df = df.copy()
    df["def_raw"] = 0.0
    df["def_val"] = 50.0
    df["defense_source"] = "none"
    return df


# ── PASO 10: Normalización por Era ───────────────────────────────────────────
def paso_10_normalizar_por_era(df):
    print("\n  PASO 10: Normalizando por Era MLB The Show Suite (H/9, K/9, BB/9, HR/9, STA)...")
    df = normalize_difficulty_adjusted(df, "h9_raw",  "h9_val",  invert=True)    # menos H/9 = mejor
    df = normalize_difficulty_adjusted(df, "k9_raw",  "k9_val",  invert=False)   # mas K/9 = mejor
    df = normalize_difficulty_adjusted(df, "bb9_raw", "bb9_val", invert=True)    # menos BB/9 = mejor
    df = normalize_difficulty_adjusted(df, "hr9_raw", "hr9_val", invert=True)    # menos HR/9 = mejor

    # Stamina calibrada según IP anuales promedio reales (sin penalización invertida por era):
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

    df["sta_val"] = df["ip_per_year_raw"].apply(map_ip_to_sta).round(1)

    # Aliases para compatibilidad con UI y simulador
    df["stf_val"] = df["k9_val"]
    df["str_val"] = df["k9_val"]
    df["ctl_val"] = df["bb9_val"]
    df["mov_val"] = df["hr9_val"]
    df["grt_val"] = df["h9_val"]

    print("  h9_val, k9_val, bb9_val, hr9_val, sta_val normalizados")
    return df


# ── PASO 11: OVR y Rareza (20% H/9, 20% K/9, 20% BB/9, 20% HR/9, 20% STA) ──
def paso_11_ovr_rareza(df):
    print("\n  PASO 11: OVR y Rareza (20% H/9, 20% K/9, 20% BB/9, 20% HR/9, 20% STA)...")
    df = df.copy()

    df["raw_ovr"] = (
        df["h9_val"]  * 0.20 +
        df["k9_val"]  * 0.20 +
        df["bb9_val"] * 0.20 +
        df["hr9_val"] * 0.20 +
        df["sta_val"] * 0.20
    )

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

    df["ovr"]    = df["raw_ovr"].apply(map_to_cosmetic_ovr_p)
    df["rarity"] = df["ovr"].apply(asignar_rareza)

    for col, gcol in [
        ("h9_val", "h9_grade"), ("k9_val", "k9_grade"),
        ("bb9_val", "bb9_grade"), ("hr9_val", "hr9_grade"),
        ("sta_val", "sta_grade"),
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
    'STL': 'STL', 'SLN': 'STL', 'SL4': 'STL',
    'BAL': 'BAL', 'SLA': 'BAL', 'ML2': 'BAL',
    'ATL': 'ATL', 'BSN': 'ATL', 'ML1': 'ATL', 'BS1': 'ATL', 'BS2': 'ATL',
    'OAK': 'OAK', 'PHA': 'OAK', 'KCA': 'OAK', 'KC1': 'OAK',
    'MIN': 'MIN', 'WS1': 'MIN',
    'WSH': 'WSH', 'MON': 'WSH', 'WAS': 'WSH',
    'TEX': 'TEX', 'WS2': 'TEX',
    'LAA': 'LAA', 'ANA': 'LAA', 'CAL': 'LAA',
    'MIA': 'MIA', 'FLA': 'MIA', 'FLO': 'MIA',
    'MIL': 'MIL', 'ML4': 'MIL', 'SE1': 'MIL',
    'TB':  'TB',  'TBD': 'TB',  'TBA': 'TB',
    'SDP': 'SDP', 'SDN': 'SDP',
    'CIN': 'CIN', 'CN1': 'CIN', 'CN2': 'CIN',
    'CLE': 'CLE', 'CL4': 'CLE',
    'BOS': 'BOS', 'BOS1': 'BOS',
    'DET': 'DET',
    'PIT': 'PIT', 'PIT1': 'PIT',
    'PHI': 'PHI', 'PH1': 'PHI', 'PH2': 'PHI',
    'HOU': 'HOU', 'HOU1': 'HOU',
    'TOR': 'TOR',
    'KCR': 'KCR',
    'SEA': 'SEA',
    'COL': 'COL',
    'ARI': 'ARI',
}

NLB_LEGENDS = {
    'Turkey Stearnes', 'Wade Johnston', 'Oscar Charleston', 'Satchel Paige', 'Josh Gibson',
    'Cool Papa Bell', 'Buck Leonard', 'Pop Lloyd', 'Bullet Rogan', 'Mule Suttles',
    'Willie Wells', 'Leon Day', 'Ray Brown', 'Smokey Joe Williams', 'Bill Byrd',
    'Nip Winters', 'Hilton Smith', 'Cristóbal Torriente', 'Martin Dihigo', 'Jud Wilson',
    'Biz Mackey', 'Louis Santop', 'Andy Cooper', 'Bill Foster', 'José Méndez',
    'Willie Foster', 'George Scales', 'Dick Lundy', 'Alejandro Oms'
}

# Strictly Negro League teams (excluding 19th c. MLB franchises like LOU, SBS, CLS, WNL, etc.)
NLB_TEAMS = {
    'BEG', 'KCM', 'MRS', 'HG', 'CBE', 'CAG', 'PC', 'BE', 'IN9', 'BIR',
    'HOM', 'NW2', 'NY5', 'NY6', 'AS2', 'MEM', 'BBB', 'BBS',
    'BCA', 'BG1', 'BG2', 'BGS', 'CBR', 'CC1', 'CC2', 'CCC', 'CCG', 'CCG2',
    'CGI', 'CIG', 'CLG', 'COS', 'CSG', 'CSG2', 'CSG3', 'CSW',
    'CTG', 'CTS', 'CUP', 'CXG', 'FLP', 'GOR', 'HBG', 'HIL',
    'JRC', 'KCG', 'KRG', 'LEL', 'LRG', 'LVB', 'MB', 'MGS', 'MOH',
    'MRM', 'NBY', 'ND', 'NE', 'NLG', 'NLS', 'NS', 'NWB', 'NYC',
    'OKM', 'PBG', 'PBK', 'PG', 'PS', 'PTG', 'QG',
    'SC1', 'SEN', 'SLS', 'SPG', 'WAP', 'WBS',
    'WP'
}

def map_to_canonical_team(row):
    t = str(row.get("canonical_teamID", row.get("team", "UNK"))).strip()
    franch = str(row.get("franchID", "")).strip()
    p_name = str(row.get("name", row.get("full_name", ""))).strip()

    # 1. Active modern MLB franchise lineage
    if franch in FRANCHISE_MAP:
        return FRANCHISE_MAP[franch]
    if t in FRANCHISE_MAP:
        return FRANCHISE_MAP[t]

    # 2. Iconic Negro League legends
    if any(nlb_n.lower() in p_name.lower() for nlb_n in NLB_LEGENDS):
        return "NLB"

    # 3. Strictly Negro Leagues team / franchise
    if t in NLB_TEAMS or franch in NLB_TEAMS:
        return "NLB"

    # 4. Otherwise, defunct historical major league franchise
    return "HIST"


# ── PASO 12: Equipo canónico y exportar ──────────────────────────────────────
def paso_12_exportar(df, pitching, teams, franchises, pico_df=None):
    print("\n  PASO 12: Equipo canonico (Pico 7 WAR) y exportacion...")

    if pico_df is not None and not pico_df.empty and not pitching.empty:
        peak_seasons_teams = pico_df.merge(pitching[["playerID", "yearID", "teamID"]].drop_duplicates(), on=["playerID", "yearID"], how="left")
        team_seasons = peak_seasons_teams.groupby(["playerID", "teamID"])["yearID"].count().reset_index()
        team_seasons.columns = ["playerID", "teamID", "team_count"]
        canonical = (
            team_seasons.sort_values("team_count", ascending=False)
                        .drop_duplicates(subset="playerID")
                        .rename(columns={"teamID": "canonical_teamID"})
        )
        df = df.merge(canonical[["playerID", "canonical_teamID"]], on="playerID", how="left")
    elif not pitching.empty:
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
        "peak_war", "peak_h9", "peak_k9", "peak_bb9", "peak_hr9", "peak_era", "peak_era_plus",
        "peak_ip_per_gs",
        "h9_val", "k9_val", "bb9_val", "hr9_val", "sta_val",
        "stf_val", "str_val", "ctl_val", "mov_val", "grt_val",
        "h9_grade", "k9_grade", "bb9_grade", "hr9_grade", "sta_grade",
        "str_grade", "ctl_grade", "grt_grade",
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

    for col in ["peak_h9", "peak_k9", "peak_bb9", "peak_hr9", "peak_era", "peak_era_plus", "peak_ip_per_gs", "peak_war"]:
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
            f'h9: {int(r["h9_val"])}, k9: {int(r["k9_val"])}, '
            f'bb9: {int(r["bb9_val"])}, hr9: {int(r["hr9_val"])}, '
            f'sta: {int(r["sta_val"])}, '
            f'stf: {int(r["k9_val"])}, ctl: {int(r["bb9_val"])}, '
            f'mov: {int(r["hr9_val"])}, grt: {int(r["h9_val"])}, '
            f'h9_grade: "{r["h9_grade"]}", k9_grade: "{r["k9_grade"]}", '
            f'bb9_grade: "{r["bb9_grade"]}", hr9_grade: "{r["hr9_grade"]}", '
            f'sta_grade: "{r["sta_grade"]}", '
            f'str_grade: "{r["k9_grade"]}", ctl_grade: "{r["bb9_grade"]}", '
            f'grt_grade: "{r["h9_grade"]}", '
            f'ovr: {float(r["ovr"]):.1f}, '
            f'rarity: "{r["rarity"]}", '
            f'allstars: {int(r["allstar_selections"])}, '
            f'hof: {"true" if r["is_hof"] else "false"}, '
            f'h9_stat: {float(r.get("peak_h9", 0.0)):.2f}, '
            f'k9_stat: {float(r.get("peak_k9", 0.0)):.2f}, '
            f'bb9_stat: {float(r.get("peak_bb9", 0.0)):.2f}, '
            f'hr9_stat: {float(r.get("peak_hr9", 0.0)):.2f}, '
            f'era_plus: {0.0 if pd.isna(r.get("peak_era_plus")) else float(r["peak_era_plus"]):.1f}, '
            f'war_peak: {float(r.get("peak_war", 0.0)):.1f}, '
            f'career_gs: {int(r.get("career_gs", 0))}, '
            f'career_sv: {int(r.get("career_sv", 0))} '
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
    peak, pico_df = paso_4_pico_pitching(pitching, war_pitch, people)
    eligible      = paso_5_filtro_ingesta(career, peak, allstar, hof, pure_pitchers, pitching)
    eligible      = paso_6_enriquecer_people(eligible, people)
    eligible      = paso_7_asignar_era(eligible)
    eligible      = paso_8_atributos_raw(eligible)
    eligible      = paso_9_fielding_pitchers(eligible, war_pitch, people)
    eligible      = paso_10_normalizar_por_era(eligible)
    eligible      = paso_11_ovr_rareza(eligible)
    final         = paso_12_exportar(eligible, pitching, teams, franchises, pico_df)

    reporte_final(final)
    return final


if __name__ == "__main__":
    result_df = main()
