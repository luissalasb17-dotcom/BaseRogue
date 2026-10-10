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

# Valor tipico de cada componente del poder (HR por PA, ISO, extrabases por PA)
PWR_SCALE_HR, PWR_SCALE_ISO, PWR_SCALE_XBH = 0.022, 0.135, 0.075
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

POS_DISPLAY_MAP = {
    "C":  "C",  "1B": "1B", "2B": "2B", "3B": "3B", "SS": "SS",
    "LF": "LF", "CF": "CF", "RF": "RF", "OF": "CF", "DH": "DH",
}

LEGEND_POS_OVERRIDES = {}


# Sub-eras de Genesis SOLO para el calculo de ratings (priors y normalizacion). La etiqueta de
# era de la carta, que usa el juego para las sinergias, no cambia. Genesis junta tres epocas
# muy distintas: hasta 1881 hacian falta hasta 9 bolas para una base por bolas y casi no habia
# jonrones (ojo de 2 a 6 y poder de 17 sobre 125 al compararlos contra todo Genesis); en 1893
# el monticulo paso a la distancia actual y la ofensiva se disparo (los bateadores de
# 1895-1899 tenian contacto medio de 62 contra 32 de los de 1880-1884, y concentraban 8 de 14
# Legendary). Los pitchers ya dividian Genesis en 1892/1893 por lo mismo.
GENESIS_CALC_SUB_ERAS = [
    (None, 1881, "The Genesis Era (1871-1881)"),
    (1882, 1892, "The Genesis Era (1882-1892)"),
    (1893, None, "The Genesis Era (1893-1900)"),
]


def usar_sub_eras_de_calculo(df):
    """Guarda la era de la carta en era_label_card y pone en era_label la sub-era de calculo."""
    df = df.copy()
    df["era_label_card"] = df["era_label"]
    genesis = df["era_label"].astype(str).str.contains("Genesis", case=False, na=False)
    year = pd.to_numeric(df["peak_year"], errors="coerce")
    for start, end, label in GENESIS_CALC_SUB_ERAS:
        mask = genesis & year.notna()
        if start is not None:
            mask &= year >= start
        if end is not None:
            mask &= year <= end
        df.loc[mask, "era_label"] = label
    return df


def restaurar_era_de_carta(df):
    df = df.copy()
    df["era_label"] = df["era_label_card"]
    return df.drop(columns=["era_label_card"])


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
    rating = scaled * (high - low) + low
    return rating


# Ligas Negras oficiales (1920-1948) y circuitos independientes / pioneros.
NLB_ALL_LEAGUES = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN1', 'EAL', 'IND', 'EAS', 'WES', 'NAC', 'INT'}


def suavizar_por_anio(tab, radius=2):
    """tab indexada por año con columnas de sumas -> mismas sumas con ventana triangular de +-radius años."""
    years = np.arange(int(tab.index.min()), int(tab.index.max()) + 1)
    g = tab.reindex(years).fillna(0.0)
    acc = g * 0.0
    for k in range(-radius, radius + 1):
        acc = acc + g.shift(k).fillna(0.0) * (1.0 - abs(k) / (radius + 1.0))
    return acc


def ajustar_por_ambiente(raw, ambiente, blend=0.75):
    """
    Ajuste por dificultad (estilo OPS+) contra el ambiente de las temporadas del propio jugador:
      factor = 1 + blend * (ambiente_medio_de_todas_las_cartas / ambiente_del_jugador - 1)
    """
    amb = ambiente.replace(0, np.nan)
    return raw * (1.0 + blend * (amb.mean() / amb - 1.0)).fillna(1.0)


def cuantil_ponderado(v, w, q):
    o = np.argsort(v)
    v, w = v[o], w[o]
    c = np.cumsum(w) - 0.5 * w
    return float(np.interp(q * w.sum(), c, v))


def normalize_globally(df, col_raw, col_out):
    df[col_out] = (
        normalize_series(df[col_raw])
        .clip(RATING_FLOOR, RATING_CEIL)
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
        "appearances":  "Appearances.csv",
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
    # Excluir leyendas Two-Way con carrera masiva en posicion de campo (Guy Hecker: 322 G en 1B, Campeón Bate .341)
    pure_pitchers.discard("heckegu01")
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
def _estimar_atrapados_robando(bat):
    """
    Los atrapados robando no se anotaron hasta 1914, la Liga Nacional no los anoto de 1926 a 1950
    y en Ligas Negras casi no existen. Con CS = 0 la eficiencia de robo salia 100%: un corredor
    de la Nacional de los años 40 figuraba perfecto y uno de la Americana con 65%.
    Donde una liga-año no tiene el dato (CS < 15% de las bases robadas) se estiman los atrapados
    con la eficiencia tipica de las ligas que si lo anotaban en esos años (CS_adj).
    """
    bat = bat.copy()
    lg = bat["lgID"].fillna("?") if "lgID" in bat.columns else pd.Series("?", index=bat.index)
    sb_t = bat.groupby([lg, bat["yearID"]])["SB"].transform("sum")
    cs_t = bat.groupby([lg, bat["yearID"]])["CS"].transform("sum")
    recorded = (sb_t > 0) & (cs_t >= 0.15 * sb_t)
    t = suavizar_por_anio(bat.loc[recorded].groupby("yearID")[["SB", "CS"]].sum())
    att = (t["SB"] + t["CS"])
    eff = (t["SB"] / att.replace(0, np.nan)).where(att >= 500)
    all_years = np.arange(int(bat["yearID"].min()), int(bat["yearID"].max()) + 1)
    eff = eff.reindex(all_years).interpolate(limit_direction="both")
    e = bat["yearID"].map(eff).fillna(0.65).clip(0.40, 0.90)
    bat["CS_adj"] = np.where(recorded, bat["CS"], bat["SB"] * (1.0 - e) / e)
    return bat


def _estimar_war_sin_dato(bat_yearly):
    """
    Ninguna temporada de Ligas Negras anterior a 1920 (ni las de circuitos independientes) tiene
    WAR calculado. Como el pico se elige por WAR, esas temporadas quedaban al final de la fila y
    solo entraban como relleno, las mas antiguas primero y no las mejores: de Pete Hill entraban
    1904 y 1905 (79 turnos) y quedaban fuera 1910 (.511) y 1912 (.399).
    Aqui se les estima un WAR SOLO para ese ranking (war_off_rank_base / war_tot_rank_base) con la
    relacion entre WAR por turno y OPS contra la liga que sale de las temporadas de Ligas Negras
    que si tienen WAR (correlacion 0.96). El WAR real guardado no cambia.
    """
    by = bat_yearly.copy()
    by["war_off_rank_base"] = by["war_off"]
    by["war_tot_rank_base"] = by["war_total"]
    nlb = by["is_nlb_y"].astype(bool)
    if not nlb.any():
        return by
    by["_tb"] = by["H"] + by["B2"] + 2 * by["B3"] + 3 * by["HR"]
    by["_ob"] = by["H"] + by["BB"] + by["HBP"]
    by["_pa"] = by["PA_y"].fillna(0)
    lg = suavizar_por_anio(by.loc[nlb].groupby("yearID")[["AB", "_tb", "_ob", "_pa"]].sum())
    lg_ops = lg["_ob"] / lg["_pa"].replace(0, np.nan) + lg["_tb"] / lg["AB"].replace(0, np.nan)
    diff = (by["OBP_y"] + by["SLG_y"]) - by["yearID"].map(lg_ops)
    pa = by["_pa"]
    need = nlb & by["war_off"].isna() & (pa > 0) & diff.notna()
    for real, base in (("war_off", "war_off_rank_base"), ("war_total", "war_tot_rank_base")):
        fit = nlb & by[real].notna() & (pa >= 30) & diff.notna()
        if fit.sum() < 50 or not need.any():
            continue
        x, w = diff[fit].values, pa[fit].values
        y = (by.loc[fit, real] / pa[fit]).values
        xm, ym = np.average(x, weights=w), np.average(y, weights=w)
        slope = np.average((x - xm) * (y - ym), weights=w) / np.average((x - xm) ** 2, weights=w)
        by.loc[need, base] = ((ym + slope * (diff - xm)) * pa)[need]
    print(f"  WAR estimado (solo para elegir el pico) en {int(need.sum()):,} temporadas de Ligas Negras sin WAR")
    return by.drop(columns=["_tb", "_ob", "_pa"])


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
    bat["_nlb_row"] = bat["lgID"].isin(NLB_ALL_LEAGUES) if "lgID" in bat.columns else False
    bat = _estimar_atrapados_robando(bat)

    bat_yearly = bat.groupby(["playerID","yearID"]).agg(
        AB  =("AB",  "sum"), H   =("H",   "sum"),
        B2  =("2B",  "sum"), B3  =("3B",  "sum"),
        HR  =("HR",  "sum"), BB  =("BB",  "sum"),
        SO  =("SO",  "sum"), SB  =("SB",  "sum"),
        CS  =("CS",  "sum"), HBP =("HBP", "sum"),
        SF  =("SF",  "sum"),
        CS_adj  =("CS_adj",   "sum"),
        is_nlb_y=("_nlb_row", "max"),
    ).reset_index()

    bat_yearly["PA_y"] = (bat_yearly["AB"] + bat_yearly["BB"] + bat_yearly["HBP"] + bat_yearly["SF"]).replace(0, np.nan)
    # Turnos de las temporadas que SI tienen ponches registrados. Una temporada con 0 ponches es una
    # temporada sin el dato (Ligas Negras, y varias ligas de MLB en la decada de 1880), no un
    # bateador que nunca se poncho: contarla diluia la tasa de quien tenia el dato solo en parte.
    bat_yearly["PA_so"] = np.where(bat_yearly["SO"] > 0, bat_yearly["PA_y"].fillna(0), 0.0)
    ab_y = bat_yearly["AB"].replace(0, np.nan)
    pa_y = bat_yearly["PA_y"]
    bat_yearly["OBP_y"] = (bat_yearly["H"] + bat_yearly["BB"] + bat_yearly["HBP"]) / pa_y
    bat_yearly["SLG_y"] = (bat_yearly["H"] + bat_yearly["B2"] + 2*bat_yearly["B3"] + 3*bat_yearly["HR"]) / ab_y
    bat_yearly["OPS_y"] = bat_yearly["OBP_y"].fillna(0) + bat_yearly["SLG_y"].fillna(0)

    war_off_yearly = pd.DataFrame()
    war_tot_yearly = pd.DataFrame()
    if not war_bat.empty and not people.empty:
        war = war_bat.copy()
        war["WAR_off"] = pd.to_numeric(war["WAR_off"].replace("NULL", np.nan), errors="coerce").fillna(0)
        war["WAR"]     = pd.to_numeric(war["WAR"].replace("NULL", np.nan), errors="coerce").fillna(0)
        
        war_off_season = war.groupby(["player_ID","year_ID"])["WAR_off"].sum().reset_index()
        war_off_season.columns = ["bbrefID","yearID","war_off"]
        
        war_tot_season = war.groupby(["player_ID","year_ID"])["WAR"].sum().reset_index()
        war_tot_season.columns = ["bbrefID","yearID","war_total"]

        id_map = people[["playerID","bbrefID"]].dropna(subset=["bbrefID"])
        war_off_yearly = war_off_season.merge(id_map, on="bbrefID", how="left").dropna(subset=["playerID"])[["playerID","yearID","war_off"]]
        war_tot_yearly = war_tot_season.merge(id_map, on="bbrefID", how="left").dropna(subset=["playerID"])[["playerID","yearID","war_total"]]
        print(f"  WAR_off y WAR_total anual para {war_off_yearly['playerID'].nunique():,} jugadores (BBRef)")
    else:
        print("  WAR no disponible - usando OPS fallback")

    if not war_off_yearly.empty:
        bat_yearly = bat_yearly.merge(war_off_yearly, on=["playerID","yearID"], how="left")
        bat_yearly = bat_yearly.merge(war_tot_yearly, on=["playerID","yearID"], how="left")
    else:
        bat_yearly["war_off"] = np.nan
        bat_yearly["war_total"] = np.nan

    bat_yearly = _estimar_war_sin_dato(bat_yearly)

    NLB_WAR_BOOST = 2.0
    nl_leagues = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN1'}

    def seleccionar_pico_off(group):
        g = group.copy()
        if g["war_off_rank_base"].notna().any():
            is_nlb = (g["lgID"].isin(nl_leagues) if "lgID" in g.columns else False) | (g["teamID"].isin(NLB_TEAMS) if "teamID" in g.columns else False)
            g["war_off_rank"] = g["war_off_rank_base"] * np.where(is_nlb, NLB_WAR_BOOST, 1.0)
            g = g.sort_values("war_off_rank", ascending=False, na_position="last")
        else:
            g = g.sort_values("OPS_y", ascending=False, na_position="last")
        return g.head(PEAK_SEASONS)

    def seleccionar_pico_tot(group):
        g = group.copy()
        if g["war_tot_rank_base"].notna().any():
            is_nlb = (g["lgID"].isin(nl_leagues) if "lgID" in g.columns else False) | (g["teamID"].isin(NLB_TEAMS) if "teamID" in g.columns else False)
            g["war_tot_rank"] = g["war_tot_rank_base"] * np.where(is_nlb, NLB_WAR_BOOST, 1.0)
            g = g.sort_values("war_tot_rank", ascending=False, na_position="last")
        else:
            g = g.sort_values("OPS_y", ascending=False, na_position="last")
        return g.head(PEAK_SEASONS)

    pico_off_df = bat_yearly.groupby("playerID", group_keys=True).apply(seleccionar_pico_off).reset_index(level=0)
    pico_tot_df = bat_yearly.groupby("playerID", group_keys=True).apply(seleccionar_pico_tot).reset_index(level=0)

    # El peak_year de era es la mediana de las 7 mejores temporadas por WAR Total
    peak_median = pico_tot_df.groupby("playerID")["yearID"].median().reset_index().rename(columns={"yearID": "peak_year"})
    peak_median["peak_year"] = peak_median["peak_year"].round().astype(int)

    # El peak_year_display es el año de su mejor rendimiento individual por WAR Total (primera fila del ranking bWAR)
    peak_display = (
        pico_tot_df.sort_values(["playerID", "war_tot_rank_base"], ascending=[True, False])
                   .groupby("playerID")
                   .first()
                   .reset_index()[["playerID", "yearID"]]
                   .rename(columns={"yearID": "peak_year_display"})
    )

    # Métricas de bateo agregadas de sus 7 mejores temporadas de OWAR (pico_off_df)
    peak = pico_off_df.groupby("playerID").agg(
        total_seasons_in_peak=("yearID", "count"),
        peak_ab  =("AB",  "sum"), peak_h   =("H",   "sum"),
        peak_2b  =("B2",  "sum"), peak_3b  =("B3",  "sum"),
        peak_hr  =("HR",  "sum"), peak_bb  =("BB",  "sum"),
        peak_so  =("SO",  "sum"), peak_sb  =("SB",  "sum"),
        peak_cs  =("CS",  "sum"), peak_hbp =("HBP", "sum"),
        peak_sf  =("SF",  "sum"),
        peak_cs_adj=("CS_adj", "sum"), peak_pa_so=("PA_so", "sum"),
    ).reset_index()

    peak = peak.merge(peak_median, on="playerID", how="left")
    peak = peak.merge(peak_display, on="playerID", how="left")

    peak_war_tot = pico_tot_df.groupby("playerID")["war_total"].sum().reset_index().rename(columns={"war_total": "peak_war"})
    peak = peak.merge(peak_war_tot, on="playerID", how="left")

    career_war_tot = bat_yearly.groupby("playerID")["war_total"].sum().reset_index().rename(columns={"war_total": "career_war"})
    peak = peak.merge(career_war_tot, on="playerID", how="left")

    peak["peak_pa"] = (peak["peak_ab"] + peak["peak_bb"] + peak["peak_hbp"] + peak["peak_sf"]).replace(0, np.nan)
    ab_p = peak["peak_ab"].replace(0, np.nan)
    pa_p = peak["peak_pa"]

    peak["peak_ba"]       = peak["peak_h"] / ab_p
    peak["peak_obp"]      = (peak["peak_h"] + peak["peak_bb"] + peak["peak_hbp"]) / pa_p
    peak["peak_slg"]      = (peak["peak_h"] + peak["peak_2b"] + 2*peak["peak_3b"] + 3*peak["peak_hr"]) / ab_p
    peak["peak_iso"]      = (peak["peak_2b"] + 2*peak["peak_3b"] + 3*peak["peak_hr"]) / ab_p
    # Tasa de ponches solo sobre las temporadas con el dato; con menos de MIN_PA_SO turnos con
    # dato se deja en 0 y el paso 10 la estima.
    MIN_PA_SO = 150
    pa_so = peak["peak_pa_so"].where(peak["peak_pa_so"] >= MIN_PA_SO)
    peak["peak_k_rate"]   = (peak["peak_so"] / pa_so).fillna(0.0)
    peak["peak_bb_rate"]  = peak["peak_bb"] / pa_p
    peak["peak_xbh_rate"] = (peak["peak_2b"] + peak["peak_3b"] + peak["peak_hr"]) / ab_p
    peak["peak_hr_rate"]  = peak["peak_hr"] / ab_p

    # Eficiencia de robo con el mismo suavizado por muestra chica que las tasas de bateo: ancla de
    # SB_EFF_ANCHOR intentos hacia la eficiencia tipica (antes un 2 de 2 valia 100%).
    SB_EFF_ANCHOR = 40
    sb_att = peak["peak_sb"] + peak["peak_cs_adj"]
    sb_eff_tipica = float(peak["peak_sb"].sum() / max(1.0, sb_att.sum()))
    peak["peak_sb_eff"]       = (peak["peak_sb"] + SB_EFF_ANCHOR * sb_eff_tipica) / (sb_att + SB_EFF_ANCHOR)
    peak["peak_sb_vol_log"]   = np.log1p(peak["peak_sb"])
    peak["peak_extra_base_f"] = (peak["peak_sb"] + peak["peak_3b"]) / ab_p
    print(f"  Pico calculado para {len(peak):,} jugadores")
    return peak, pico_off_df, pico_tot_df


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
# PASO 6 - POSICION PRIMARIA DE BATEADORES EN SUS MEJORES TEMPORADAS (PICO WAR)
# ===========================================================================
def paso_6_posicion_bateadores(fielding, fielding_of, appearances=None, pico_df=None):
    """
    - Posicion primaria (pos): determinada por las temporadas PICO del jugador por WAR.
    - Posiciones secundarias (sec_pos): determinadas a lo largo de toda su CARRERA (G >= 75).
    """
    print("\n  PASO 6: Posicion primaria (Pico WAR) y posiciones secundarias (Carrera G >= 75)...")

    # Guardar copias completas de la carrera para las secundarias
    career_app = appearances.copy() if appearances is not None else None
    career_f = fielding.copy() if not fielding.empty else None

    # Multiplicador 1.6x de calendario para Ligas Negras (alineado con la estandarizacion de WAR de 60G a 96G+)
    NL_LEAGUES = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'IND', 'EAS', 'NN1'}
    if career_app is not None and not career_app.empty:
        is_nlb_app = career_app['lgID'].isin(NL_LEAGUES) if 'lgID' in career_app.columns else career_app['teamID'].isin(NLB_TEAMS)
        mult_app = np.where(is_nlb_app, 1.6, 1.0)
        pos_cols = ['G_c', 'G_1b', 'G_2b', 'G_3b', 'G_ss', 'G_lf', 'G_cf', 'G_rf', 'G_dh']
        for col in pos_cols:
            if col in career_app.columns:
                career_app[col] = pd.to_numeric(career_app[col], errors='coerce').fillna(0) * mult_app

    if career_f is not None and not career_f.empty:
        is_nlb_f = career_f['lgID'].isin(NL_LEAGUES) if 'lgID' in career_f.columns else career_f['teamID'].isin(NLB_TEAMS)
        mult_f = np.where(is_nlb_f, 1.6, 1.0)
        if 'G' in career_f.columns:
            career_f['G'] = pd.to_numeric(career_f['G'], errors='coerce').fillna(0) * mult_f

    # Filtrar a temporadas PICO para determinar la POSICION PRIMARIA
    peak_app = career_app.copy() if career_app is not None else None
    peak_f = career_f.copy() if career_f is not None else None
    if pico_df is not None and not pico_df.empty:
        peak_years = pico_df[['playerID', 'yearID']].drop_duplicates()
        if peak_app is not None and not peak_app.empty:
            peak_app = peak_app.merge(peak_years, on=['playerID', 'yearID'], how='inner')
        if peak_f is not None and not peak_f.empty:
            peak_f = peak_f.merge(peak_years, on=['playerID', 'yearID'], how='inner')

    # 1. Juegos en el Pico (Peak)
    pos_games_peak = pd.DataFrame()
    if peak_app is not None and not peak_app.empty:
        pos_cols = {'G_c': 'C', 'G_1b': '1B', 'G_2b': '2B', 'G_3b': '3B', 'G_ss': 'SS', 'G_lf': 'LF', 'G_cf': 'CF', 'G_rf': 'RF', 'G_dh': 'DH'}
        melted = []
        for col, pos in pos_cols.items():
            if col in peak_app.columns:
                sub = peak_app[['playerID', col]].dropna()
                sub[col] = pd.to_numeric(sub[col], errors="coerce").fillna(0)
                sub = sub[sub[col] > 0].rename(columns={col: 'G'})
                sub['POS'] = pos
                melted.append(sub)
        if melted:
            pos_games_app = pd.concat(melted, ignore_index=True)
            pos_games_peak = pos_games_app.groupby(['playerID', 'POS'])['G'].sum().reset_index()

    if pos_games_peak.empty and peak_f is not None and not peak_f.empty:
        field = peak_f[peak_f["POS"] != "P"].copy()
        for col in ["G","PO","A","E"]:
            if col in field.columns:
                field[col] = pd.to_numeric(field[col], errors="coerce").fillna(0)
        pos_games_peak = field.groupby(["playerID","POS"])["G"].sum().reset_index()

    if pos_games_peak.empty:
        return pd.DataFrame(columns=["playerID","primary_pos","primary_g","fielding_pct","range_factor","sec_pos"])

    # 2. Juegos en Carrera (Career)
    pos_games_career = pd.DataFrame()
    if career_app is not None and not career_app.empty:
        pos_cols = {'G_c': 'C', 'G_1b': '1B', 'G_2b': '2B', 'G_3b': '3B', 'G_ss': 'SS', 'G_lf': 'LF', 'G_cf': 'CF', 'G_rf': 'RF', 'G_dh': 'DH'}
        melted = []
        for col, pos in pos_cols.items():
            if col in career_app.columns:
                sub = career_app[['playerID', col]].dropna()
                sub[col] = pd.to_numeric(sub[col], errors="coerce").fillna(0)
                sub = sub[sub[col] > 0].rename(columns={col: 'G'})
                sub['POS'] = pos
                melted.append(sub)
        if melted:
            pos_games_app = pd.concat(melted, ignore_index=True)
            pos_games_career = pos_games_app.groupby(['playerID', 'POS'])['G'].sum().reset_index()

    if pos_games_career.empty and career_f is not None and not career_f.empty:
        field = career_f[career_f["POS"] != "P"].copy()
        for col in ["G","PO","A","E"]:
            if col in field.columns:
                field[col] = pd.to_numeric(field[col], errors="coerce").fillna(0)
        pos_games_career = field.groupby(["playerID","POS"])["G"].sum().reset_index()

    # Mapeo y agrupamiento por posición normalizada
    pos_games_peak["pos_mapped"] = pos_games_peak["POS"].map(POS_DISPLAY_MAP).fillna(pos_games_peak["POS"])
    pos_games_peak_grouped = pos_games_peak.groupby(["playerID", "pos_mapped"])["G"].sum().reset_index()
    tot_peak = pos_games_peak_grouped.groupby("playerID")["G"].sum().reset_index(name="tot_g_peak")
    pos_games_peak_grouped = pos_games_peak_grouped.merge(tot_peak, on="playerID")
    pos_games_peak_grouped["peak_pct"] = pos_games_peak_grouped["G"] / pos_games_peak_grouped["tot_g_peak"]

    pos_games_career["pos_mapped"] = pos_games_career["POS"].map(POS_DISPLAY_MAP).fillna(pos_games_career["POS"])
    pos_games_career_grouped = pos_games_career.groupby(["playerID", "pos_mapped"])["G"].sum().reset_index()
    tot_car = pos_games_career_grouped.groupby("playerID")["G"].sum().reset_index(name="tot_g_career")
    pos_games_career_grouped = pos_games_career_grouped.merge(tot_car, on="playerID")
    pos_games_career_grouped["career_pct"] = pos_games_career_grouped["G"] / pos_games_career_grouped["tot_g_career"]

    # FÓRMULA HÍBRIDA 80/20 PARA POSICIÓN PRIMARIA (80% Pico WAR + 20% Carrera Completa)
    merged_pos = pos_games_career_grouped.merge(
        pos_games_peak_grouped[["playerID", "pos_mapped", "G", "peak_pct"]].rename(columns={"G": "peak_G"}),
        on=["playerID", "pos_mapped"],
        how="outer"
    )
    merged_pos["G"] = merged_pos["G"].fillna(0)
    merged_pos["peak_G"] = merged_pos["peak_G"].fillna(0)
    merged_pos["career_pct"] = merged_pos["career_pct"].fillna(0.0)
    merged_pos["peak_pct"] = merged_pos["peak_pct"].fillna(0.0)

    merged_pos["hybrid_score"] = 0.80 * merged_pos["peak_pct"] + 0.20 * merged_pos["career_pct"]

    primary = (
        merged_pos.sort_values("hybrid_score", ascending=False)
                  .drop_duplicates(subset="playerID")
                  .rename(columns={"pos_mapped": "primary_pos", "peak_G": "primary_g"})
    )

    # 3. Determinar POSICIONES SECUNDARIAS
    # - Posiciones de campo: >= 10% Dedicacion (Carrera/Pico) O >= 100 Juegos en Carrera
    # - Posicion DH: Umbral selectivo de >= 25% de dedicacion (Carrera/Pico) con al menos 50 juegos
    sec_df = merged_pos.merge(primary[["playerID", "primary_pos"]], on="playerID", how="left")
    sec_df = sec_df[(sec_df["pos_mapped"] != sec_df["primary_pos"]) & (sec_df["pos_mapped"] != "OF")]

    is_dh_row = sec_df["pos_mapped"] == "DH"
    field_mask = (~is_dh_row) & (
        ((sec_df["career_pct"] >= 0.10) & (sec_df["G"] >= 20)) |
        ((sec_df["peak_pct"] >= 0.10) & (sec_df["peak_G"] >= 15)) |
        (sec_df["G"] >= 100.0)
    )
    dh_mask = is_dh_row & (
        ((sec_df["career_pct"] >= 0.25) & (sec_df["G"] >= 50)) |
        ((sec_df["peak_pct"] >= 0.25) & (sec_df["peak_G"] >= 35))
    )

    qual_mask = field_mask | dh_mask
    sec_pos_qual = sec_df[qual_mask]

    sec_pos_str = sec_pos_qual.groupby("playerID")["pos_mapped"].apply(
        lambda x: ",".join(sorted(list(set(x))))
    ).reset_index().rename(columns={"pos_mapped": "sec_pos"})

    career_field = pd.DataFrame(columns=["playerID", "fielding_pct", "range_factor"])
    if fielding is not None and not fielding.empty:
        field_all = fielding[fielding["POS"] != "P"].copy()
        for col in ["G","PO","A","E"]:
            if col in field_all.columns:
                field_all[col] = pd.to_numeric(field_all[col], errors="coerce").fillna(0)
        cf = field_all.groupby("playerID").agg(
            total_po=("PO","sum"), total_a=("A","sum"),
            total_e=("E","sum"),   total_fg=("G","sum"),
        ).reset_index()
        denom_f = (cf["total_po"] + cf["total_a"] + cf["total_e"]).replace(0, np.nan)
        cf["fielding_pct"] = (cf["total_po"] + cf["total_a"]) / denom_f
        cf["range_factor"] = (cf["total_po"] + cf["total_a"]) / cf["total_fg"].replace(0, np.nan)
        career_field = cf[["playerID", "fielding_pct", "range_factor"]]

    result = primary.merge(career_field, on="playerID", how="left")
    result = result.merge(sec_pos_str, on="playerID", how="left")
    result["sec_pos"] = result["sec_pos"].fillna("")
    print(f"  Posicion primaria calculada para {len(result):,} bateadores (secundarias: Campo >= 10% / DH >= 25%)")
    return result


# ===========================================================================
# PASO 7 - ENRIQUECER CON PEOPLE.CSV
# ===========================================================================
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
    "chishja01": "Jazz Chisholm Jr.",
    "roberlu01": "Luis Robert Jr.",
    "gurrilo01": "Lourdes Gurriel Jr.",
    "harrimi03": "Michael Harris II",
    "sanchca01": "Yolmer Sánchez",
}

def clean_initials_spacing(name):
    import re
    # Fix spaced initials like 'B. J. Upton' -> 'B.J. Upton', 'J. D. Martinez' -> 'J.D. Martinez'
    name = re.sub(r'\b([A-Z]\.)\s+([A-Z]\.)', r'\1\2', str(name))
    name = re.sub(r'\b([A-Z]\.[A-Z]\.)\s+([A-Z]\.)', r'\1\2', name)
    return name

def paso_7_enriquecer_people(df, people):
    print("\n  PASO 7: Enriqueciendo con People.csv (nombre, bbrefID, bats)...")
    if people.empty:
        return df
    slim = people[["playerID","nameFirst","nameLast","bbrefID","debut","bats"]].copy()
    # Explicit bbrefID overrides for missing Lahman Negro League IDs
    slim.loc[slim["playerID"] == "pearsle01", "bbrefID"] = "pearsle02"
    slim["full_name"] = (slim["nameFirst"].fillna("") + " " + slim["nameLast"].fillna("")).str.strip()
    slim["full_name"] = slim["full_name"].apply(clean_initials_spacing)
    for pid, explicit_name in SR_JR_MAP.items():
        slim.loc[slim["playerID"] == pid, "full_name"] = explicit_name

    result = df.merge(slim, on="playerID", how="left")
    print(f"  bbrefID para {result['bbrefID'].notna().sum():,} jugadores")
    return result


# ===========================================================================
# PASO 8 - FILTRO DE INGESTA DEL CARD POOL
# ===========================================================================
def paso_8_filtro_ingesta(df, allstar, hof, pure_pitcher_ids, batting):
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

    MIN_PA_MLB     = 1000
    MIN_PA_NLB     = 500
    MIN_PA_ALLSTAR = 100
    MIN_PA_QUALITY = 350

    # List of all Negro League and Independent Pioneer leagues:
    nl_official_leagues = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN1'}
    nl_pioneer_leagues  = {'IND', 'EAS', 'WES', 'NAC', 'INT'}
    nl_all_leagues      = nl_official_leagues | nl_pioneer_leagues

    if not batting.empty and 'lgID' in batting.columns:
        bat_pa = batting.copy()
        for col in ['AB', 'BB', 'HBP', 'SF']:
            if col in bat_pa.columns:
                bat_pa[col] = pd.to_numeric(bat_pa[col], errors='coerce').fillna(0)
            else:
                bat_pa[col] = 0
        bat_pa['PA'] = bat_pa['AB'] + bat_pa['BB'] + bat_pa['HBP'] + bat_pa['SF']

        nl_pa_df = bat_pa[bat_pa['lgID'].isin(nl_all_leagues)].groupby('playerID')['PA'].sum().reset_index().rename(columns={'PA': 'nlb_pa'})
        mlb_pa_df = bat_pa[~bat_pa['lgID'].isin(nl_all_leagues)].groupby('playerID')['PA'].sum().reset_index().rename(columns={'PA': 'mlb_pa'})
        
        no_pitchers = no_pitchers.merge(nl_pa_df, on='playerID', how='left').merge(mlb_pa_df, on='playerID', how='left')
        no_pitchers['nlb_pa'] = no_pitchers['nlb_pa'].fillna(0)
        no_pitchers['mlb_pa'] = no_pitchers['mlb_pa'].fillna(0)
        no_pitchers['league_group'] = np.where(no_pitchers['nlb_pa'] > no_pitchers['mlb_pa'], 'NLB', 'MLB')
    else:
        no_pitchers['league_group'] = 'MLB'
        no_pitchers['nlb_pa'] = 0
        no_pitchers['mlb_pa'] = no_pitchers['career_pa']

    # Criterio Unificado de Ingesta para Bateadores:
    # 1. Volumen de carrera: MLB >= 1,000 PA | NLB (oficial o pionero) >= 500 PA
    # 2. Calidad / Estrellato Joven: (career_war >= 5.0 OR peak_war >= 5.0) AND career_pa >= 350
    # 3. Reconocimiento Histórico: HoF incondicional OR (All-Star AND career_pa >= 100)
    c_war = no_pitchers["career_war"].fillna(0) if "career_war" in no_pitchers.columns else pd.Series(0, index=no_pitchers.index)
    p_war = no_pitchers["peak_war"].fillna(0) if "peak_war" in no_pitchers.columns else pd.Series(0, index=no_pitchers.index)
    
    is_nlb_player = no_pitchers["league_group"] == "NLB"
    vol_mask = np.where(is_nlb_player, no_pitchers["career_pa"] >= MIN_PA_NLB, no_pitchers["career_pa"] >= MIN_PA_MLB)

    mask = (
        vol_mask |
        (
            ((c_war >= 5.0) | (p_war >= 5.0)) &
            (no_pitchers["career_pa"] >= MIN_PA_QUALITY)
        ) |
        (no_pitchers["playerID"].isin(hof_ids)) |
        (no_pitchers["playerID"].isin(allstar_ids) & (no_pitchers["career_pa"] >= MIN_PA_ALLSTAR))
    )
    eligible = no_pitchers[mask].copy()
    eligible["is_allstar"] = eligible["playerID"].isin(allstar_ids)
    eligible["is_hof"]     = eligible["playerID"].isin(hof_ids)
    eligible.drop(columns=["nlb_pa", "mlb_pa"], errors="ignore", inplace=True)

    if not allstar.empty:
        as_count = allstar.groupby("playerID").size().reset_index(name="allstar_selections")
        eligible = eligible.merge(as_count, on="playerID", how="left")
    else:
        eligible["allstar_selections"] = 0

    eligible["allstar_selections"] = eligible["allstar_selections"].fillna(0).astype(int)

    print(f"  Card Pool elegible: {len(eligible):,} jugadores")
    return eligible


# ===========================================================================
# PASO 9 - ASIGNAR ERA TEMATICA (80% WAR Pico + 20% WAR Carrera por Era)
# ===========================================================================
def paso_9_asignar_era(df, war_bat=None, people=None, batting=None):
    """
    Asigna la Era temática usando el mismo sistema 80/20 de WAR que se usa
    para seleccionar el equipo canónico.
    
    era_score(era) = 0.80 * WAR_Peak7_en_esa_era + 0.20 * WAR_Career_en_esa_era
    
    Si no hay datos de WAR (NLB sin bbrefID, pioneros), cae al assign_era(peak_year).
    """
    print("\n  PASO 9: Asignando Era Tematica (80/20 WAR por Era)...")

    # Fallback: era simple por peak_year
    df["era_label"] = df["peak_year"].apply(assign_era)

    if war_bat is None or war_bat.empty or people is None or people.empty:
        for era, cnt in df["era_label"].value_counts().sort_index().items():
            print(f"    {era[:46]:<46}: {cnt:4,}")
        return df

    # Mapeo bbrefID -> playerID
    id_map = people[["playerID", "bbrefID"]].dropna(subset=["bbrefID"])
    war = war_bat.copy()
    war["WAR"] = pd.to_numeric(war["WAR"].replace("NULL", 0), errors="coerce").fillna(0)
    war_merged = war.merge(id_map, left_on="player_ID", right_on="bbrefID", how="inner")

    # Asignar era a cada temporada de WAR
    war_merged["era_label_w"] = war_merged["year_ID"].apply(assign_era)

    # WAR por jugador x era (carrera completa)
    career_era_war = war_merged.groupby(["playerID", "era_label_w"])["WAR"].sum().reset_index(name="career_war_e")

    # WAR por jugador x era (solo temporadas de pico 7)
    if "peak_year" in df.columns:
        # Reconstruir peak_years del df actual
        peak_rows = []
        for _, row in df[["playerID", "peak_year"]].dropna().iterrows():
            peak_rows.append({"playerID": row["playerID"], "year_ID": int(row["peak_year"])})
        # Pico: usamos las temporadas que el ETL ya seleccionó (columna peak_year = año central del pico)
        # Como aproximación conservadora usamos ±3 años del peak_year para capturar las 7 temporadas
        peak_years_set = {}
        for _, row in df[["playerID", "peak_year"]].dropna().iterrows():
            pid = row["playerID"]
            py = int(row["peak_year"])
            peak_years_set.setdefault(pid, set()).update(range(py - 3, py + 4))

        def in_peak(r):
            pid = r["playerID"]
            yr = r["year_ID"]
            return yr in peak_years_set.get(pid, set())

        peak_war_df = war_merged[war_merged.apply(in_peak, axis=1)]
        peak_era_war = peak_war_df.groupby(["playerID", "era_label_w"])["WAR"].sum().reset_index(name="peak_war_e")
    else:
        peak_era_war = career_era_war.rename(columns={"career_war_e": "peak_war_e", "era_label_w": "era_label_w"})

    merged_era = career_era_war.merge(peak_era_war, on=["playerID", "era_label_w"], how="outer").fillna(0.0)
    merged_era["era_score"] = 0.80 * merged_era["peak_war_e"] + 0.20 * merged_era["career_war_e"]

    best_era = (
        merged_era.sort_values("era_score", ascending=False)
                  .drop_duplicates(subset="playerID")
                  .rename(columns={"era_label_w": "era_label_war"})
    )

    df = df.merge(best_era[["playerID", "era_label_war", "era_score"]], on="playerID", how="left")
    # Usar la era WAR cuando está disponible; fallback al simple para NLB / pioneros sin bbrefID
    df["era_label"] = df["era_label_war"].fillna(df["era_label"])

    # ── Proteccion contra la "Trampa de WAR Negativo / Tacita de Cafe" ────────
    # Para jugadores de rol cuyo WAR en su era principal es negativo o muy bajo,
    # una temporada marginal de +0.1 WAR en el ocaso de su carrera no debe
    # expulsarlos de la era donde jugaron el grueso de su carrera y tuvieron su pico.
    if batting is not None and not batting.empty:
        bat_seasons = batting.copy()
        bat_seasons["era_s"] = bat_seasons["yearID"].apply(assign_era)
        p_era_seas = bat_seasons.groupby(["playerID", "era_s"])["yearID"].nunique().to_dict()
        p_tot_seas = bat_seasons.groupby("playerID")["yearID"].nunique().to_dict()

        for idx, r in df.iterrows():
            pid = r["playerID"]
            py_era = assign_era(r.get("peak_year", 2000))
            best_e = r.get("era_label", py_era)
            score = r.get("era_score", 0.0)

            if best_e != py_era:
                py_s   = p_era_seas.get((pid, py_era), 0)
                best_s = p_era_seas.get((pid, best_e), 0)
                tot_s  = p_tot_seas.get(pid, 1)

                # Si el WAR es modesto (score <= 1.5), o si la era calculada tuvo <= 2 temporadas
                # mientras que la era de su pico tuvo >= 3 temporadas, o >= 60% de sus temporadas:
                is_anomaly = (
                    (score <= 1.5) or
                    (best_s <= 2 and py_s >= 3) or
                    (py_s / max(1, tot_s) >= 0.60 and score < 3.0)
                )
                if is_anomaly and py_s > 0:
                    df.at[idx, "era_label"] = py_era

    df.drop(columns=["era_label_war", "era_score"], inplace=True, errors="ignore")

    # Regla Pionera para Negro Leagues pre-1920:
    # Seamheads / Baseball-Reference NO calculo WAR para ligas negras pre-1920 (WAR=0.0).
    # Como los calendarios pre-1920 eran mas cortos (25-45 juegos vs 70-90 en los años 20),
    # se evalua equivalencia de temporadas o turnos ponderados (1.8x):
    # Asigna a Deadball (1901-1919) si debutó entre 1901 y 1919 y:
    #   a) Disputó al menos el 50% de sus temporadas en Deadball (dead_seasons >= post_seasons y dead_seasons >= 5), o
    #   b) Al menos el 45% de sus AB equivalentes ocurrieron en Deadball.
    if batting is not None and not batting.empty:
        nl_all_leagues = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN1', 'IND', 'EAS', 'WES', 'NAC', 'INT'}
        nl_bat = batting[batting['lgID'].isin(nl_all_leagues)].copy()
        if not nl_bat.empty:
            pioneer_pids = set(nl_bat['playerID'].unique())
            deadball_bat = nl_bat[(nl_bat['yearID'] >= 1901) & (nl_bat['yearID'] <= 1919)]
            post_bat     = nl_bat[nl_bat['yearID'] >= 1920]

            dead_ab = deadball_bat.groupby('playerID')['AB'].sum().to_dict()
            post_ab = post_bat.groupby('playerID')['AB'].sum().to_dict()
            dead_seasons = deadball_bat.groupby('playerID')['yearID'].nunique().to_dict()
            post_seasons = post_bat.groupby('playerID')['yearID'].nunique().to_dict()

            for idx, r in df.iterrows():
                pid = r['playerID']
                debut = r.get('debut_year', 1930)
                if pid in pioneer_pids and debut >= 1901 and debut < 1920:
                    d_ab = dead_ab.get(pid, 0)
                    p_ab = post_ab.get(pid, 0)
                    d_s  = dead_seasons.get(pid, 0)
                    p_s  = post_seasons.get(pid, 0)

                    equiv_dead_ab = d_ab * 1.8
                    tot_equiv_ab = equiv_dead_ab + p_ab
                    equiv_pct = (equiv_dead_ab / max(1, tot_equiv_ab))

                    season_parity = (d_s >= p_s) and (d_s >= 5)

                    if season_parity or (equiv_pct >= 0.45):
                        df.at[idx, 'era_label'] = 'Deadball (1901-1919)'

    for era, cnt in df["era_label"].value_counts().sort_index().items():
        print(f"    {era[:46]:<46}: {cnt:4,}")
    return df


# ===========================================================================
# PASO 9b - AMBIENTE DE LAS TEMPORADAS DE CADA BATEADOR
# ===========================================================================
def paso_9b_ambiente_por_temporada(df, pico_off_df):
    """
    En vez de comparar a cada bateador contra la media de su Era (grupos fijos, con saltos al
    cruzar un borde), se lo compara contra el ambiente de las temporadas exactas de su pico.

    Ambiente de un año = tasas agregadas de todas las temporadas de pico del pool en ese año
    (ventana de +-2 años). El ambiente del bateador (b_ba, b_bb, b_pwr, b_k, b_iso) es la media
    de esos años ponderada por sus turnos. Los ponches salen solo de temporadas de MLB con el dato
    (en Ligas Negras casi no se anotaban); los años sin dato suficiente se interpolan.
    """
    print("\n  PASO 9b: Ambiente por temporada (BA, BB, poder y ponches de los años del pico)...")
    df = df.copy()
    s = pico_off_df[pico_off_df["playerID"].isin(set(df["playerID"]))].copy()
    s["PA"] = s["PA_y"].fillna(0.0)
    s["XBH"] = s["B2"] + s["B3"] + s["HR"]
    s["TBX"] = s["B2"] + 2 * s["B3"] + 3 * s["HR"]
    lg = df.drop_duplicates("playerID").set_index("playerID")["league_group"] if "league_group" in df.columns else pd.Series(dtype=object)
    has_so = (s["playerID"].map(lg).fillna("MLB") != "NLB") & (s["SO"] > 0)
    s["SO_k"] = np.where(has_so, s["SO"], 0.0)
    s["PA_k"] = np.where(has_so, s["PA"], 0.0)
    t = suavizar_por_anio(s.groupby("yearID")[["AB", "PA", "H", "BB", "HR", "XBH", "TBX", "SO_k", "PA_k"]].sum())
    ab_t, pa_t = t["AB"].replace(0, np.nan), t["PA"].replace(0, np.nan)
    env = pd.DataFrame({"b_ba": t["H"] / ab_t, "b_bb": t["BB"] / pa_t, "b_iso": t["TBX"] / ab_t})
    env["b_pwr"] = (t["HR"] / pa_t) / PWR_SCALE_HR * 0.45 + env["b_iso"] / PWR_SCALE_ISO * 0.40 + (t["XBH"] / pa_t) / PWR_SCALE_XBH * 0.15      # mismos pesos que power_raw
    env["b_k"] = (t["SO_k"] / t["PA_k"].replace(0, np.nan)).where(t["PA_k"] >= 4000).interpolate(limit_direction="both")
    s = s.join(env, on="yearID")
    cols = list(env.columns)
    w = s["PA"].clip(lower=0.01)
    b = s[cols].mul(w, axis=0).groupby(s["playerID"]).sum().div(w.groupby(s["playerID"]).sum(), axis=0)
    df = df.merge(b, left_on="playerID", right_index=True, how="left")
    for c in cols:
        df[c] = df[c].fillna(df[c].mean())
    return df


# ===========================================================================
# PASO 10 - CALCULAR ATRIBUTOS RAW DE BATEO (CON, PWR, EYE)
# ===========================================================================
# ── Ajuste por muestra chica sin eras fijas (comun a bateadores y pitchers) ─────────────────────
# Decision del usuario: nunca eras fijas. Lo "esperado" para un bateador sale de las cartas con
# pico a +-PRIOR_RADIUS años. El ancla sigue siendo una temporada de titular (600 PA / 540 AB),
# igual para MLB y Ligas Negras. En False vuelve al prior por Era fija.
PRIOR_POR_VENTANA = True
PRIOR_RADIUS = 8


def tiempo_completo_por_ventana(per_season, year, group, radius=None, q=0.90, min_n=15):
    """
    Carga de una temporada de tiempo completo (percentil q) entre las cartas del mismo grupo
    (rol y/o liga) con pico a +-radius años, con peso triangular. Si el grupo tiene menos de
    min_n cartas en esa ventana se usa el valor de todas las cartas de la ventana.
    """
    radius = PRIOR_RADIUS if radius is None else radius
    y = pd.to_numeric(year, errors="coerce").values.astype(float)
    v = per_season.values.astype(float)
    g = group.astype(str).values
    out = np.full(len(v), np.nan)

    def wq(vals, w):
        o = np.argsort(vals); vals, w = vals[o], w[o]
        c = np.cumsum(w) - 0.5 * w
        return float(np.interp(q * w.sum(), c, vals))

    ok = np.isfinite(v) & (v > 0)
    # respaldo cuando el grupo tiene pocas cartas en la ventana: el valor del grupo en toda la historia
    de_siempre = {key: wq(v[ok & (g == key)], np.ones((ok & (g == key)).sum())) for key in np.unique(g) if (ok & (g == key)).sum() >= min_n}
    for uy in np.unique(y[np.isfinite(y)]):
        w = np.clip(1.0 - np.abs(y - uy) / (radius + 1.0), 0, None)
        inwin = ok & (w > 0)
        everybody = wq(v[inwin], w[inwin]) if inwin.sum() else np.nan
        for key in np.unique(g[y == uy]):
            m = inwin & (g == key)
            out[(y == uy) & (g == key)] = wq(v[m], w[m]) if m.sum() >= min_n else de_siempre.get(key, everybody)
    return pd.Series(out, index=per_season.index)


def prior_por_ventana(rate, weight, year, share, fallback, group=None, radius=None, min_n=30):
    """
    Tasa esperada de un jugador dado su tiempo de juego, estimada entre las cartas con pico a
    +-radius años (peso triangular x turnos/entradas): recta ponderada  tasa ~ a + b * share.
    Con `group` (p. ej. el rol) la recta se ajusta dentro de cada grupo; si el grupo tiene menos
    de min_n cartas en la ventana se usa la recta de todas las cartas de la ventana.
    """
    radius = PRIOR_RADIUS if radius is None else radius
    y = pd.to_numeric(year, errors="coerce").values.astype(float)
    r = rate.values.astype(float); w0 = weight.values.astype(float); x = share.values.astype(float)
    g = np.full(len(r), "all") if group is None else group.astype(str).values
    ok = np.isfinite(r) & np.isfinite(x) & (w0 > 0)
    out = np.full(len(r), float(fallback))

    def recta(mask, tw):
        tw = tw[mask]
        if tw.sum() <= 0:
            return None
        rm = np.average(r[mask], weights=tw); xm = np.average(x[mask], weights=tw)
        var_x = np.average((x[mask] - xm) ** 2, weights=tw)
        slope = np.average((x[mask] - xm) * (r[mask] - rm), weights=tw) / var_x if var_x > 0 else 0.0
        return rm, xm, slope

    for uy in np.unique(y[np.isfinite(y)]):
        tri = np.clip(1.0 - np.abs(y - uy) / (radius + 1.0), 0, None)
        tw = tri * np.where(ok, w0, 0.0)
        inwin = ok & (tri > 0)
        base = recta(inwin, tw) if inwin.sum() else None
        for key in np.unique(g[y == uy]):
            m = inwin & (g == key)
            fit = recta(m, tw) if m.sum() >= min_n else base
            if fit is None:
                continue
            rm, xm, slope = fit
            sel = (y == uy) & (g == key)
            out[sel] = rm + slope * (np.where(np.isfinite(x[sel]), x[sel], xm) - xm)
    return pd.Series(out, index=rate.index)


def _prior_por_era_y_tiempo_de_juego(rate, weight, era, share, fallback):
    """
    Prior bayesiano individual: la tasa esperada de un jugador dada su Era y su
    tiempo de juego (share = PA por temporada del pico / PA de un titular de su era).

    Dentro de cada era se ajusta una recta ponderada  tasa ~ a + b * share  (pesos = AB o PA,
    para que las muestras chicas no dominen el ajuste). Un suplente se regresa asi hacia lo
    que batean los suplentes de su era, y un titular hacia lo que batean los titulares,
    en vez de regresar a todos hacia una unica media global.
    """
    prior = pd.Series(fallback, index=rate.index, dtype=float)
    for _, idx in era.groupby(era).groups.items():
        r = rate.loc[idx].astype(float)
        w = weight.loc[idx].astype(float)
        x = share.loc[idx].astype(float)
        ok = r.notna() & x.notna() & (w > 0)
        if ok.sum() == 0:
            continue
        wm = np.average(r[ok], weights=w[ok])
        if ok.sum() < 30:
            prior.loc[idx] = wm          # era con muy pocos jugadores: solo media de la era
            continue
        xm = np.average(x[ok], weights=w[ok])
        var_x = np.average((x[ok] - xm) ** 2, weights=w[ok])
        slope = np.average((x[ok] - xm) * (r[ok] - wm), weights=w[ok]) / var_x if var_x > 0 else 0.0
        prior.loc[idx] = wm + slope * (x.fillna(xm) - xm)
    return prior


def paso_10_atributos_raw_bateo(df):
    """
    Formulas sobre metricas hibridas (k_rate y bb_rate ya corregidos con PA):

    CON = 0.80 * BA_Suavizado + 0.20 * (1 - k_rate_Final)
         Suavizado Bayesiano (m = 540 AB / 1 temporada) hacia un prior individual por Era y
         tiempo de juego.

    PWR = 0.50 * ISO_Final + 0.30 * XBH_rate_Final + 0.20 * HR_rate_Final
         Poder real de bate en extra-bases con suavizado (m = 600 PA, misma ancla de 1 temporada).

    EYE = bb_rate_Final  (100% tasa de boletos - paciencia pura)
    """
    print("\n  PASO 10: Atributos RAW de bateo (CON, PWR, EYE) con ancla de 1 temporada y prior por Era y tiempo de juego...")
    df = df.copy()

    # Bayesian sample-size smoothing (m = 540 AB = 600 PA = 1 full season anchor)
    ab = df["peak_ab"].fillna(df["career_ab"]).fillna(0)
    h  = df["peak_h"].fillna(df["career_h"]).fillna(0)
    pa = df["peak_pa"].fillna(df["career_pa"]).fillna(0)
    hr = df["peak_hr"].fillna(0)
    b2 = df["peak_2b"].fillna(0)
    b3 = df["peak_3b"].fillna(0)
    bb = df["peak_bb"].fillna(df["career_bb"]).fillna(0)
    so = df["peak_so"].fillna(df["career_so"]).fillna(0)

    is_nlb = (df["league_group"] == "NLB") if "league_group" in df.columns else False
    # Ancla unica: 1 temporada de titular (600 PA / 540 AB), igual para todas las tasas y
    # todas las ligas. Lo que cambia por jugador es el prior hacia el que se regresa, no el ancla.
    m_pa = 600
    m_ab = 540

    h_effective = h

    # ── Tiempo de juego relativo (share) ──────────────────────────────────────
    # PA por temporada del pico, relativo a lo que acumula un titular (percentil 90) de la
    # misma Era y grupo de liga. Agrupar por liga evita tratar como "suplente" a una estrella
    # de Ligas Negras o de la era Genesis, cuyos calendarios eran mucho mas cortos.
    n_seasons = df["total_seasons_in_peak"].fillna(0).clip(lower=1) if "total_seasons_in_peak" in df.columns else pd.Series(PEAK_SEASONS, index=df.index)
    pa_per_season = pa / n_seasons
    lg = df["league_group"].fillna("MLB") if "league_group" in df.columns else pd.Series("MLB", index=df.index)
    if PRIOR_POR_VENTANA:
        full_time_pa = tiempo_completo_por_ventana(pa_per_season, df["peak_year"], lg)
    else:
        full_time_pa = pa_per_season.groupby([df["era_label"], lg]).transform(lambda v: v.quantile(0.90))
    share = (pa_per_season / full_time_pa.replace(0, np.nan)).clip(0.0, 1.0).fillna(0.0)
    df["playing_time_share"] = share.round(3)

    ab_nz = ab.replace(0, np.nan)
    pa_nz = pa.replace(0, np.nan)
    era = df["era_label"]
    if PRIOR_POR_VENTANA:
        _prior = lambda rate, weight, era_, share_, fallback: prior_por_ventana(rate, weight, df["peak_year"], share_, fallback)   # la Era ya no se usa
    else:
        _prior = _prior_por_era_y_tiempo_de_juego
    prior_ba  = _prior(h_effective / ab_nz, ab, era, share, 0.265)
    prior_bb  = _prior(bb / pa_nz, pa, era, share, 0.085)
    prior_hr  = _prior(hr / pa_nz, pa, era, share, 0.025)
    prior_xbh = _prior((b2 + b3 + hr) / pa_nz, pa, era, share, 0.075)
    df["prior_ba"] = prior_ba.round(4)

    df["ba_smoothed"] = (h_effective + m_ab * prior_ba) / (ab + m_ab)

    # Contacto ajustado al 75% contra el ambiente de sus temporadas, igual que poder y ojo
    # (decision del usuario; antes iba al 100% contra la media de BA de su era).
    CONTACT_ERA_BLEND = 0.75
    df["contact_raw"] = ajustar_por_ambiente(df["ba_smoothed"], df["b_ba"], CONTACT_ERA_BLEND)

    # Suavizado Bayesiano de Boletos (EYE)
    df["eye_raw"] = (bb + m_pa * prior_bb) / (pa + m_pa)

    # Bayesian sample-size smoothing for power metrics (same 1-season anchor)
    hr_effective = hr
    hr_smoothed = (hr_effective + m_pa * prior_hr) / (pa + m_pa)
    tb_total = h_effective + (b2) + 2*(b3) + 3*hr_effective
    slg = np.where(ab > 0, tb_total / ab, 0)
    iso_raw = np.where(ab > 0, slg - (h_effective / ab), 0)
    prior_iso = _prior(pd.Series(iso_raw, index=df.index).where(ab > 0), pa, era, share, 0.140)
    iso_smoothed = (iso_raw * pa + m_pa * prior_iso) / (pa + m_pa)
    df["iso_smoothed"] = iso_smoothed
    xbh_smoothed = ((b2 + b3 + hr) + m_pa * prior_xbh) / (pa + m_pa)

    # Cada componente va dividido por su valor tipico para que los pesos valgan lo que dicen
    # (decision del usuario). Sumados tal cual, el ISO (.135) tapaba a los jonrones (.022) y el
    # reparto real era ~15 / 70 / 15 en vez de 45 / 40 / 15.
    df["power_raw"] = (
        hr_smoothed  / PWR_SCALE_HR  * 0.45 +
        iso_smoothed / PWR_SCALE_ISO * 0.40 +
        xbh_smoothed / PWR_SCALE_XBH * 0.15
    )

    # Frecuencia de robos + triples (componente de Velocidad) con el mismo suavizado de 1 temporada.
    xbf_num = df["peak_sb"].fillna(0) + b3
    prior_xbf = _prior(xbf_num / ab_nz, ab, era, share, 0.050)
    df["extra_base_freq"] = (xbf_num + m_ab * prior_xbf) / (ab + m_ab)

    # ── Estimacion de ponches (K/AVD) para Ligas Negras y datos faltantes ──
    # En Ligas Negras mas del 95% de los boxscores no registraban ponches. Para no inflar a los
    # bateadores de swing grande (Gibson, Suttles) se estima K% a partir del ambiente de sus
    # temporadas y de cuanto se aparta el bateador en BA e ISO:
    #   K% estimado = K_ambiente - 0.40*(BA - BA_ambiente) + 0.35*(ISO - ISO_ambiente)
    # El ambiente sale de tasas agregadas y las cartas son tasas suavizadas de jugadores
    # seleccionados, asi que se lleva a la escala de las cartas con el cociente medio (esc_*).
    k_obs = df["k_rate"].astype(float)
    nlb_mask = pd.Series(is_nlb, index=df.index) if not isinstance(is_nlb, pd.Series) else is_nlb
    sin_dato = k_obs.isna() | (k_obs < 0.015) | (nlb_mask & (k_obs < 0.020))
    # Suavizado por muestra chica de los ponches (era el unico rating de tasa sin el): misma ancla
    # de 1 temporada y mismo prior por Era y tiempo de juego, sobre los turnos con el dato.
    so_k  = df["peak_so"].fillna(0)
    pa_so = df["peak_pa_so"].fillna(0)
    con_dato = ~sin_dato & (pa_so > 0)
    prior_k = _prior((so_k / pa_so.replace(0, np.nan)).where(con_dato & ~nlb_mask), pa_so, era, share, 0.100)
    k = k_obs.where(~con_dato, (so_k + m_pa * prior_k) / (pa_so + m_pa))
    valid_k = (~nlb_mask) & (k >= 0.025)
    esc_k   = float((k[valid_k] / df.loc[valid_k, "b_k"]).mean())
    esc_ba  = float((df.loc[valid_k, "ba_smoothed"] / df.loc[valid_k, "b_ba"]).mean())
    esc_iso = float((df.loc[valid_k, "iso_smoothed"] / df.loc[valid_k, "b_iso"]).mean())
    k_est = (df["b_k"] * esc_k
             - 0.40 * (df["ba_smoothed"] - df["b_ba"] * esc_ba)
             + 0.35 * (df["iso_smoothed"] - df["b_iso"] * esc_iso)).clip(0.015, 0.250)
    df["k_rate_clean"] = k.where(~sin_dato, k_est)
    df["k_estimated"] = sin_dato

    print("  Prior de BA por Era (suplente, share <= 0.4 / titular, share >= 0.9):")
    for e_, g_ in df.groupby("era_label"):
        lo_ = g_.loc[g_["playing_time_share"] <= 0.4, "prior_ba"].mean()
        hi_ = g_.loc[g_["playing_time_share"] >= 0.9, "prior_ba"].mean()
        print(f"    {e_:30s} {lo_:.3f} / {hi_:.3f}")
    print("  contact_raw, power_raw, eye_raw con K% sabermetrico aplicado")
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
        # Normalizacion de temporadas cortas de Ligas Negras (1.6x en defensa y baserunning)
        NL_LEAGUES = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'IND', 'EAS', 'NN1'}
        is_nlb = war["lg_ID"].isin(NL_LEAGUES) if "lg_ID" in war.columns else war["team_ID"].isin(NLB_TEAMS)
        
        # Clean WAR, runs_defense, WAR_def, runs_br
        for col in ["runs_defense","WAR_def","WAR","runs_br"]:
            if col in war.columns:
                war[col] = pd.to_numeric(war[col].replace("NULL", np.nan), errors="coerce").fillna(0)
            else:
                war[col] = 0.0

        # Multiplicador 1.6x para Ligas Negras (runs_defense, WAR_def, runs_br)
        war.loc[is_nlb, "runs_defense"] = war.loc[is_nlb, "runs_defense"] * 1.6
        war.loc[is_nlb, "WAR_def"]      = war.loc[is_nlb, "WAR_def"] * 1.6
        war.loc[is_nlb, "runs_br"]      = war.loc[is_nlb, "runs_br"] * 1.6

        war["runs_defense"] = war["runs_defense"].clip(-80, 80)
        
        # Defensive peak (7 best seasons by WAR_def with G >= 81 games threshold)
        if "G" in war.columns:
            war["G"] = pd.to_numeric(war["G"], errors="coerce").fillna(0.0).astype(float)
            war.loc[is_nlb, "G"] = war.loc[is_nlb, "G"] * 1.6
            def _filter_def_peak(group):
                qual = group[group["G"] >= 81]
                if len(qual) < PEAK_SEASONS:
                    qual = group.sort_values("G", ascending=False).head(PEAK_SEASONS)
                return qual.sort_values("WAR_def", ascending=False).head(PEAK_SEASONS)
            war_peak_def = war.groupby("player_ID", group_keys=True).apply(_filter_def_peak).reset_index(level=0)
        else:
            war_sorted_def = war.sort_values(["player_ID", "WAR_def"], ascending=[True, False])
            war_peak_def = war_sorted_def.groupby("player_ID").head(PEAK_SEASONS)

        war_career_def = war_peak_def.groupby("player_ID").agg(
            rfield_career=("runs_defense","sum"),
            wardef_career=("WAR_def","sum"),
        ).reset_index().rename(columns={"player_ID":"bbrefID"})

        # Speed peak (7 best seasons by overall WAR)
        war_sorted_spd = war.sort_values(["player_ID", "WAR"], ascending=[True, False])
        war_peak_spd = war_sorted_spd.groupby("player_ID").head(PEAK_SEASONS)
        war_career_spd = war_peak_spd.groupby("player_ID").agg(
            runs_br_peak=("runs_br","sum"),
        ).reset_index().rename(columns={"player_ID":"bbrefID"})

        war_career = war_career_def.merge(war_career_spd, on="bbrefID", how="outer")
        print(f"  Datos BBRef Híbridos (Peak {PEAK_SEASONS}) para {len(war_career):,} jugadores")
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
    raw_hybrid = 0.60 * df["rfield_career"].fillna(0) + 0.40 * (df["wardef_career"].fillna(0) * 10)
    
    # Penalizacion posicional para DH puros (sin entradas defensivas reales)
    is_dh = (df["primary_pos"] == "DH")
    raw_hybrid = np.where(is_dh & (df["rfield_career"].fillna(0) >= -5.0) & (df["rfield_career"].fillna(0) <= 5.0), -35.0, raw_hybrid)

    fp    = df["fielding_pct"].fillna(0.96)
    rf    = (df["range_factor"].fillna(2.0) / 6.0).clip(0, 1)
    proxy = (fp * 0.6 + rf * 0.4 - 0.5) * 50.0

    df["defense_base_raw"] = np.where(has_war, raw_hybrid, proxy)
    # Stretched Defense Scale: min_raw (Grieve = -68.0) maps to 1.0 DEF base floor, p98 maps to 99.0 base
    min_def_raw = df["defense_base_raw"].min()
    p98_def_raw = df["defense_base_raw"].quantile(0.98)
    df["defense_val_base"] = (1.0 + ((df["defense_base_raw"] - min_def_raw) / (p98_def_raw - min_def_raw)) * 98.0).clip(1.0, RATING_CEIL).round(1)
    df["defense_source"]   = np.where(has_war, "bbref_war", "lahman_proxy")

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
    Normaliza bateo con ajuste por dificultad (estilo OPS+) contra el ambiente de las temporadas
    de cada bateador (paso 9b). La Defensa se mantiene limpia (sin ajuste, centrada en 50.0 = 0.0).
    """
    print("\n  PASO 12: Normalizando contra el ambiente de cada temporada (escala 1-99)...")
    df = df.reset_index(drop=True)

    df = normalize_globally(df, "contact_raw", "contact_val")

    df["power_val"] = normalize_series(ajustar_por_ambiente(df["power_raw"], df["b_pwr"], 0.75)).clip(RATING_FLOOR, RATING_CEIL).round(1)

    # Ojo. Hasta 1888 hacian falta de 5 a 9 bolas para una base por bolas (2% de los turnos en
    # 1874 contra 8.5% historico) y dividir contra un ambiente casi en cero exagera todo: un
    # bateador con 4% de boletos quedaba con ojo de 99. Para esas cartas se estima el ojo por su
    # posicion entre sus contemporaneos (desvios estandar entre las cartas con pico a +-4 años),
    # trasladada a la escala de las cartas de 1893 en adelante.
    EYE_EST_LAST_YEAR, EYE_REF_FIRST_YEAR, EYE_EST_RADIUS = 1888, 1893, 4
    eye_adj = ajustar_por_ambiente(df["eye_raw"], df["b_bb"], 0.75)
    yy = pd.to_numeric(df["peak_year"], errors="coerce").values.astype(float)
    raw_eye = df["eye_raw"].values.astype(float)
    ref = yy >= EYE_REF_FIRST_YEAR
    ref_mean, ref_sd = float(eye_adj[ref].mean()), float(eye_adj[ref].std())
    est = eye_adj.values.copy()
    for uy in np.unique(yy[yy <= EYE_EST_LAST_YEAR]):
        w = np.clip(1.0 - np.abs(yy - uy) / (EYE_EST_RADIUS + 1.0), 0, None)
        m = (w * raw_eye).sum() / w.sum()
        sd = np.sqrt((w * (raw_eye - m) ** 2).sum() / w.sum())
        if sd > 0:
            sel = yy == uy
            est[sel] = ref_mean + (raw_eye[sel] - m) / sd * ref_sd
    df["eye_val"] = normalize_series(pd.Series(est, index=df.index)).clip(RATING_FLOOR, RATING_CEIL).round(1)

    # K/AVD (Avoid K) - Evasion de ponches (invertido: menor K% = mayor K/AVD), ajustada al 75%
    # como todos los ratings (decision del usuario: la epoca tambien moldea el estilo; el que se
    # poncha mucho hoy lo hace buscando jonrones). Estuvo al 90% para que las eras quedaran mas
    # parejas en este rating (diferencia entre la era mas alta y la mas baja: 12 puntos al 90%,
    # 24 al 75%).
    KAVD_ERA_BLEND = 0.75
    k_adjusted = ajustar_por_ambiente(df["k_rate_clean"].astype(float), df["b_k"], KAVD_ERA_BLEND)
    df["k_avoid_val"] = normalize_series(-k_adjusted).clip(RATING_FLOOR, RATING_CEIL).round(1)

    print("  contact_val, power_val, eye_val, k_avoid_val normalizados contra el ambiente de cada temporada")
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
    df["defense_val"] = (df["defense_val_base"] + gg_bonus).clip(1, RATING_CEIL).round(1)
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

    # La formula de velocidad no se puede medir año por año (mezcla eficiencia y volumen de robo),
    # asi que el grupo de comparacion es una ventana deslizante: las cartas con pico a
    # +-SPEED_RADIUS años (peso triangular), en vez de la Era fija.
    SPEED_RADIUS = 8
    df = df.reset_index(drop=True)
    y = pd.to_numeric(df["peak_year"], errors="coerce").values.astype(float)
    sb = df["sb_score"].fillna(0).values.astype(float)
    xb = df["extra_base_freq"].fillna(0).values.astype(float)
    br = df["runs_br_norm"].fillna(0).values.astype(float)
    qual = df["career_ab"].fillna(0).values >= 300
    temp = np.zeros(len(df))
    weights = {}
    for uy in np.unique(y):
        w = np.clip(1.0 - np.abs(y - uy) / (SPEED_RADIUS + 1.0), 0, None)
        weights[uy] = w
        sb_max = cuantil_ponderado(sb[qual], w[qual], 0.98)
        xb_max = cuantil_ponderado(xb[qual], w[qual], 0.98)
        m = y == uy
        sb_c = np.clip(sb[m] / sb_max, None, 2.0) if sb_max > 0 else 0.0
        xb_c = np.clip(xb[m] / xb_max, None, 2.0) if xb_max > 0 else 0.0
        # Mayor peso a SB y Triples/SB para reflejar velocidad pura
        temp[m] = sb_c * 0.45 + xb_c * 0.30 + br[m] * 0.25
    df["speed_raw_temp"] = temp

    # Ajuste por dificultad - 75% contra la media de la ventana
    roll = np.zeros(len(df))
    for uy, w in weights.items():
        roll[y == uy] = (w * temp).sum() / w.sum()
    df["speed_raw_adj"] = temp * (1.0 + 0.75 * (temp.mean() / np.where(roll > 0, roll, np.nan) - 1.0))
    df["speed_raw_adj"] = df["speed_raw_adj"].fillna(df["speed_raw_temp"])

    df["speed_val"] = (
        normalize_series(df["speed_raw_adj"], 1, 99)
        .clip(RATING_FLOOR, RATING_CEIL)
        .round(1)
    )
    print("  speed_val calculado con ajuste OPS+")
    return df


# ── Longevidad y extremos: pasos comunes a bateadores y pitchers ─────────────────────────────
LONGEVITY_SEASONS = 12      # segundo pico, mas largo
DEF_OVR_POS_SHARE = 0.70    # peso del WAR defensivo (posicion incluida) en la defensa que usa el OVR
LONGEVITY_WEIGHT  = 0.25    # peso del pico de 12 en el rating final
EXTREME_TOP_ANCHOR, EXTREME_LOW_ANCHOR = 75.0, 25.0
RATING_FLOOR, RATING_CEIL = -100.0, 999.0      # los ratings no se recortan (ni arriba ni abajo) hasta ajustar_extremos


def mezclar_longevidad(v7, v12, share):
    """
    rating = 75% pico de 7 temporadas + 25% pico de 12 temporadas (decision del usuario).
    Por cada temporada que falta para llegar a 12 (share = temporadas con carga real / 12), esa
    parte cuenta como una temporada floja: el percentil 25 del rating. Premia las carreras largas
    y constantes y castiga las cortas sin cambiar de donde salen los ratings.
    """
    floja = float(v7.quantile(0.25))
    v12 = v12.fillna(v7)
    return (1.0 - LONGEVITY_WEIGHT) * v7 + LONGEVITY_WEIGHT * (share * v12 + (1.0 - share) * floja)


def _curva_A(T, span):
    """A tal que A * ln(1 + T / A) = span (biseccion)."""
    lo, hi = 1e-3, 1e6
    for _ in range(200):
        mid = (lo * hi) ** 0.5
        if mid * np.log(1.0 + T / mid) < span:
            lo = mid
        else:
            hi = mid
    return hi


def ajustar_extremos(v):
    """
    Ultimo paso de TODOS los ratings, igual para todos (decision del usuario): el centro de la
    escala (25 a 75) no se toca; el MEJOR de la historia en cada rating vale 125 y el PEOR vale 1.
    Las puntas van con una curva (logaritmica) y no en linea recta: justo al salir del centro un
    punto vale lo mismo que en el centro y se va apretando hacia el extremo. Con la linea recta un
    solo fuera de serie aplastaba a todos los de arriba (poder: Ruth 125 y Bonds 98, solo 7 cartas
    con 99 o mas contra 78 en K-AVD); con la curva la compresion la paga sobre todo el extremo.
    Si el extremo no esta lejos (no llega a 125 o a 1 por si solo) la punta se estira en linea
    recta, como antes. Los ratings llegan aqui SIN recortar (RATING_FLOOR / RATING_CEIL).
    """
    v = v.astype(float).copy()
    hi, lo = float(v.max()), float(v.min())
    if hi > EXTREME_TOP_ANCHOR:
        top = v > EXTREME_TOP_ANCHOR
        T, span = hi - EXTREME_TOP_ANCHOR, 125.0 - EXTREME_TOP_ANCHOR
        if T > span * 1.02:
            A = _curva_A(T, span)
            v[top] = EXTREME_TOP_ANCHOR + A * np.log1p((v[top] - EXTREME_TOP_ANCHOR) / A)
        else:
            v[top] = EXTREME_TOP_ANCHOR + (v[top] - EXTREME_TOP_ANCHOR) * span / T
    if lo < EXTREME_LOW_ANCHOR:
        low = v < EXTREME_LOW_ANCHOR
        T, span = EXTREME_LOW_ANCHOR - lo, EXTREME_LOW_ANCHOR - 1.0
        if T > span * 1.02:
            A = _curva_A(T, span)
            v[low] = EXTREME_LOW_ANCHOR - A * np.log1p((EXTREME_LOW_ANCHOR - v[low]) / A)
        else:
            v[low] = 1.0 + (v[low] - lo) * span / T
    return v.clip(1.0, 125.0).round(1)

BAT_RATINGS = ["contact_val", "power_val", "eye_val", "defense_val", "speed_val", "k_avoid_val"]
MIN_PA_SEASON, MIN_PA_SEASON_NLB = 200, 80     # temporada con carga real (Ligas Negras: calendario corto)


def paso_14c_longevidad(df7, df12, pico12):
    print(f"\n  PASO 14c: Longevidad ({int((1 - LONGEVITY_WEIGHT) * 100)}% pico de 7 + {int(LONGEVITY_WEIGHT * 100)}% pico de {LONGEVITY_SEASONS})...")
    df = df7.copy()
    s = pico12[pico12["playerID"].isin(set(df["playerID"]))]
    ok = s["PA_y"].fillna(0) >= np.where(s["is_nlb_y"].astype(bool), MIN_PA_SEASON_NLB, MIN_PA_SEASON)
    n = ok.groupby(s["playerID"]).sum()
    share = (df["playerID"].map(n).fillna(0) / float(LONGEVITY_SEASONS)).clip(0.0, 1.0)
    df["longevity_seasons"] = (share * LONGEVITY_SEASONS).round(0).astype(int)
    v12 = df12.drop_duplicates("playerID").set_index("playerID")
    for col in BAT_RATINGS:
        df[col] = mezclar_longevidad(df[col].astype(float), df["playerID"].map(v12[col]), share).round(1)
    return df


def paso_14d_extremos(df):
    print("\n  PASO 14d: Extremos (centro 25-75 intacto; el mejor de cada rating = 125, el peor = 1)...")
    df = df.copy()
    for col in BAT_RATINGS:
        df[col] = ajustar_extremos(df[col])
    return df


def media_deslizante(values, year, radius=8):
    """Media de `values` entre las cartas con pico a +-radius años (peso triangular)."""
    y = pd.to_numeric(year, errors="coerce").values.astype(float)
    v = values.values.astype(float)
    out = np.empty(len(v))
    ok = ~np.isnan(v)
    for uy in np.unique(y):
        w = np.clip(1.0 - np.abs(y - uy) / (radius + 1.0), 0, None)
        out[y == uy] = (w[ok] * v[ok]).sum() / max(w[ok].sum(), 1e-9)
    return pd.Series(out, index=values.index)


def paso_14b_pocas_temporadas(df):
    """
    Misma regla que los pitchers: con menos de 7 temporadas en el pico, los ratings se acercan a
    la media de las cartas con pico cercano (+-8 años). Peso propio: 7 temporadas 100%, 5 95%,
    3 86%, 1 57%. La Defensa no entra: es un total acumulado y ya premia el volumen.
    """
    print("\n  PASO 14b: Regresion por pocas temporadas en el pico...")
    df = df.copy()
    n_peak = df["total_seasons_in_peak"].fillna(7).clip(lower=1, upper=7)
    w = np.minimum(1.0, (n_peak / (n_peak + 1.0)) * (8.0 / 7.0))
    for col in ["contact_val", "power_val", "eye_val", "k_avoid_val", "speed_val"]:
        df[col] = (w * df[col] + (1.0 - w) * media_deslizante(df[col], df["peak_year"])).round(1)
    return df


# ===========================================================================
# PASO 15 - EQUIPO CANONICO, DATAFRAME FINAL Y EXPORTACION
# ===========================================================================
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


FRANCHISE_MAP = {
    # New York Yankees
    'NYY': 'NYY', 'NYA': 'NYY',
    # New York Mets
    'NYM': 'NYM', 'NYN': 'NYM',
    # Los Angeles Dodgers (Brooklyn Superbas / Robins / Dodgers)
    'LAD': 'LAD', 'LAN': 'LAD', 'BRO': 'LAD', 'BKN': 'LAD', 'BR3': 'LAD',
    # San Francisco Giants (New York Giants)
    'SFG': 'SFG', 'SFN': 'SFG', 'NYG': 'SFG', 'NY1': 'SFG',
    # Boston Red Sox (Americans / Red Sox)
    'BOS': 'BOS', 'BOS1': 'BOS', 'BOS2': 'BOS',
    # Chicago Cubs (Orphans / Colts / White Stockings)
    'CHC': 'CHC', 'CHN': 'CHC', 'CHI': 'CHC',
    # Chicago White Sox
    'CHW': 'CHW', 'CHA': 'CHW',
    # St. Louis Cardinals (Browns NL / Perfectos)
    'STL': 'STL', 'SLN': 'STL', 'SL4': 'STL',
    # Baltimore Orioles (St. Louis Browns AL / Milwaukee Brewers 1901)
    'BAL': 'BAL', 'SLA': 'BAL', 'SLB': 'BAL', 'MLA': 'BAL', 'ML2': 'BAL',
    # Atlanta Braves (Boston Red Caps / Rustlers / Doves / Bees / Braves / Milwaukee Braves)
    'ATL': 'ATL', 'BSN': 'ATL', 'MLN': 'ATL', 'ML1': 'ATL', 'BRA': 'ATL', 'BS1': 'ATL', 'BS2': 'ATL',
    # Oakland Athletics (Philadelphia Athletics / Kansas City Athletics)
    'OAK': 'OAK', 'PHA': 'OAK', 'KCA': 'OAK', 'KC1': 'OAK', 'ATH': 'OAK',
    # Minnesota Twins (Washington Senators 1901-1960)
    'MIN': 'MIN', 'WS1': 'MIN',
    # Washington Nationals (Montreal Expos)
    'WSH': 'WSH', 'WSN': 'WSH', 'MON': 'WSH', 'WAS': 'WSH',
    # Texas Rangers (Washington Senators 1961-1971)
    'TEX': 'TEX', 'WS2': 'TEX', 'WSA': 'TEX',
    # Los Angeles Angels (California Angels / Anaheim Angels)
    'LAA': 'LAA', 'ANA': 'LAA', 'CAL': 'LAA',
    # Miami Marlins (Florida Marlins)
    'MIA': 'MIA', 'FLA': 'MIA', 'FLO': 'MIA',
    # Milwaukee Brewers (Seattle Pilots 1969)
    'MIL': 'MIL', 'ML4': 'MIL', 'SE1': 'MIL', 'SEP': 'MIL',
    # Tampa Bay Rays (Devil Rays)
    'TB': 'TB', 'TBR': 'TB', 'TBD': 'TB', 'TBA': 'TB',
    # San Diego Padres
    'SDP': 'SDP', 'SDN': 'SDP', 'SD': 'SDP',
    # Cincinnati Reds (Redlegs / Red Stockings)
    'CIN': 'CIN', 'CN1': 'CIN', 'CN2': 'CIN',
    # Cleveland Guardians (Indians / Naps / Bronchos / Blues)
    'CLE': 'CLE', 'CL4': 'CLE',
    # Detroit Tigers
    'DET': 'DET',
    # Pittsburgh Pirates (Alleghenys)
    'PIT': 'PIT', 'PIT1': 'PIT', 'PT1': 'PIT',
    # Philadelphia Phillies (Quakers)
    'PHI': 'PHI', 'PH1': 'PHI', 'PH2': 'PHI',
    # Houston Astros (Colt .45s)
    'HOU': 'HOU', 'HOU1': 'HOU',
    # Toronto Blue Jays
    'TOR': 'TOR',
    # Kansas City Royals
    'KCR': 'KCR', 'KC': 'KCR',
    # Seattle Mariners
    'SEA': 'SEA',
    # Colorado Rockies
    'COL': 'COL',
    # Arizona Diamondbacks
    'ARI': 'ARI'
}

NLB_LEGENDS = {
    'Turkey Stearnes', 'Wade Johnston', 'Oscar Charleston', 'Satchel Paige', 'Josh Gibson',
    'Cool Papa Bell', 'Buck Leonard', 'Pop Lloyd', 'Bullet Rogan', 'Mule Suttles',
    'Willie Wells', 'Leon Day', 'Ray Brown', 'Smokey Joe Williams', 'Bill Byrd',
    'Nip Winters', 'Hilton Smith', 'Cristóbal Torriente', 'Martin Dihigo', 'Jud Wilson',
    'Biz Mackey', 'Louis Santop', 'Andy Cooper', 'Bill Foster', 'José Méndez',
    'Willie Foster', 'George Scales', 'Dick Lundy', 'Alejandro Oms', 'Frank Grant',
    'Pete Hill', 'Ben Taylor', 'Bruce Petway', 'Pelayo Chacón', 'Bartolo Portuondo',
    'Rube Foster', 'Andrew Foster'
}

# Strictly Negro League teams (excluding 19th c. MLB franchises like LOU, SBS, CLS, WNL, etc.)
NLB_TEAMS = {
    'AB', 'AB2', 'AB3', 'ABC', 'AC', 'AC1', 'AC2', 'ACB', 'ACG', 'AG', 'BBB', 'BBS', 'BCA', 'BE', 'BEG',
    'BG1', 'BG2', 'BGS', 'BRG', 'CAG', 'CBB', 'CBE', 'CBG', 'CBN', 'CBR', 'CC', 'CC1',
    'CC2', 'CCB', 'CCC', 'CCG', 'CCG2', 'CCU', 'CEG', 'CEL', 'CGI', 'CHT', 'CIC', 'CIG', 'CL2',
    'CLG', 'CLS', 'COB', 'COG', 'COS', 'COT', 'CRS', 'CS', 'CSE', 'CSG', 'CSG2', 'CSG3', 'CSH',
    'CSW', 'CT', 'CTG', 'CTS', 'CU', 'CUP', 'CXG', 'DM', 'DS', 'DTS', 'DW', 'DYM', 'FLP', 'GOR',
    'HBG', 'HG', 'HIL', 'HOM', 'HSS', 'IA', 'IAB', 'IC', 'ID', 'JRC', 'KCG', 'KCM', 'KRG', 'LEL',
    'LOW', 'LRG', 'LVB', 'MB', 'MEM', 'MGS', 'MOH', 'MRM', 'MRS', 'NBY', 'ND', 'NE', 'NEG', 'NLG',
    'NLS', 'NS', 'NW2', 'NWB', 'NY5', 'NY6', 'NYB', 'NYC', 'OKM', 'PBG', 'PBK', 'PC', 'PFG', 'PG',
    'PK', 'PS', 'PTG', 'QG', 'SC1', 'SEN', 'SL2', 'SLG', 'SLS', 'SNH', 'SNS', 'SOX', 'SPG',
    'TC', 'TC2', 'TIC', 'TT', 'WAP', 'WBS', 'WEG', 'WMP', 'WP', 'NLB'
}

NL_LEAGUES = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL'}

def map_to_canonical_team(row):
    t = str(row.get("canonical_teamID", row.get("team", "UNK"))).strip()
    if t.lower() in ("nan", "none", "null"):
        t = "UNK"
    p_name = str(row.get("full_name", row.get("name", row.get("nameFull", row.get("display_name", ""))))).strip()
    peak_y = int(row.get("peak_year", row.get("year", 2000)) or 2000)

    # Pre-1901 Genesis players who are not explicit Negro League legends cannot be NLB (e.g. Hartford, Brooklyn, St. Louis 19th c. white teams)
    if peak_y < 1901 and not any(nlb_n.lower() in p_name.lower() for nlb_n in NLB_LEGENDS):
        if t == "NLB":
            t = "HIST"

    if t == "NLB":
        return "NLB"

    franch = str(row.get("franchID", "")).strip()

    # 1. Active modern MLB franchise lineage
    res_team = None
    if franch in FRANCHISE_MAP:
        res_team = FRANCHISE_MAP[franch]
    elif t in FRANCHISE_MAP:
        res_team = FRANCHISE_MAP[t]

    if res_team:
        return res_team

    # 2. Iconic Negro League legends
    if any(nlb_n.lower() in p_name.lower() for nlb_n in NLB_LEGENDS):
        return "NLB"

    # 3. Strictly Negro Leagues team / franchise
    if t in NLB_TEAMS or franch in NLB_TEAMS:
        return "NLB"

    # 4. Otherwise, defunct historical major league franchise
    return "HIST"


def paso_15_equipo_y_exportar(df, batting, teams, franchises, pico_df=None, war_bat=None, people=None):
    """
    Asigna equipo canonico usando la Formula Hibrida 80/20 de WAR:
    Franchise_Score = 0.80 * WAR_Peak7 + 0.20 * WAR_Career
    construye el DataFrame final y exporta a game_cards.csv y game_cards_pool.js.
    """
    print("\n  PASO 15: Equipo canonico (Hibrido 80% WAR Pico 7 + 20% WAR Carrera) y exportacion...")

    team_to_franch = {}
    if not teams.empty and "teamID" in teams.columns and "franchID" in teams.columns:
        # Sort so that early MLB franchises take precedence for shared codes (e.g. HAR 1876 Hartford > HAR 1931 Harlem Stars)
        teams_dedup = teams.sort_values("yearID", ascending=True).drop_duplicates(subset="teamID", keep="first")
        team_to_franch = teams_dedup.set_index("teamID")["franchID"].to_dict()

    def get_franch(tid, lg_id=""):
        tid_str = str(tid).strip()
        lg_str = str(lg_id).strip()
        if lg_str in NL_LEAGUES:
            return "NLB"
        if tid_str in NLB_TEAMS:
            return "NLB"
        f = team_to_franch.get(tid_str, tid_str)
        if f in NLB_TEAMS:
            return "NLB"
        return FRANCHISE_MAP.get(f, FRANCHISE_MAP.get(tid_str, f))

    if war_bat is not None and not war_bat.empty and people is not None and not people.empty:
        war = war_bat.copy()
        war["WAR"] = pd.to_numeric(war["WAR"].replace("NULL", 0), errors="coerce").fillna(0)
        id_map = people[["playerID", "bbrefID"]].dropna(subset=["bbrefID"])
        war_merged = war.merge(id_map, left_on="player_ID", right_on="bbrefID", how="inner")
        war_merged["franch_clean"] = war_merged.apply(lambda r: get_franch(r["team_ID"], r.get("lg_ID", "")), axis=1)
        
        # WAR en carrera por franquicia
        career_franch_war = war_merged.groupby(["playerID", "franch_clean"])["WAR"].sum().reset_index(name="career_war_f")
        
        # WAR en pico 7 por franquicia
        if pico_df is not None and not pico_df.empty:
            peak_years = pico_df[["playerID", "yearID"]].drop_duplicates()
            peak_war_df = war_merged.merge(peak_years, left_on=["playerID", "year_ID"], right_on=["playerID", "yearID"], how="inner")
            peak_franch_war = peak_war_df.groupby(["playerID", "franch_clean"])["WAR"].sum().reset_index(name="peak_war_f")
        else:
            peak_franch_war = career_franch_war.rename(columns={"career_war_f": "peak_war_f"})
            
        merged_franch = career_franch_war.merge(peak_franch_war, on=["playerID", "franch_clean"], how="outer").fillna(0.0)
        merged_franch["franch_score"] = 0.80 * merged_franch["peak_war_f"] + 0.20 * merged_franch["career_war_f"]
        
        canonical = (
            merged_franch.sort_values("franch_score", ascending=False)
                         .drop_duplicates(subset="playerID")
                         .rename(columns={"franch_clean": "canonical_teamID"})
        )
        df = df.merge(canonical[["playerID", "canonical_teamID"]], on="playerID", how="left")
    elif pico_df is not None and not pico_df.empty and not batting.empty:
        peak_seasons_teams = pico_df.merge(batting[["playerID", "yearID", "teamID", "lgID"]].drop_duplicates(), on=["playerID", "yearID"], how="left")
        peak_seasons_teams["franch_clean"] = peak_seasons_teams.apply(lambda r: get_franch(r["teamID"], r.get("lgID", "")), axis=1)
        team_seasons = peak_seasons_teams.groupby(["playerID", "franch_clean"])["yearID"].count().reset_index()
        team_seasons.columns = ["playerID", "canonical_teamID", "team_count"]
        canonical = (
            team_seasons.sort_values("team_count", ascending=False)
                        .drop_duplicates(subset="playerID")
        )
        df = df.merge(canonical[["playerID", "canonical_teamID"]], on="playerID", how="left")
    else:
        df["canonical_teamID"] = "UNK"

    # For players not matched by WAR (no bbrefID, e.g. NLB players like Jim West),
    # canonical_teamID is NaN. Fallback: most-played batting teamID.
    null_team_mask = df["canonical_teamID"].isna() | (df["canonical_teamID"].astype(str) == "nan")
    if null_team_mask.any() and not batting.empty:
        missing_pids = df.loc[null_team_mask, "playerID"].tolist()
        bat_sub = batting[batting["playerID"].isin(missing_pids)].copy()
        bat_sub["franch_clean"] = bat_sub.apply(lambda r: get_franch(r["teamID"], r.get("lgID", "")), axis=1)
        bat_counts = (
            bat_sub.groupby(["playerID", "franch_clean"])["AB"]
            .sum()
            .reset_index()
            .sort_values("AB", ascending=False)
            .drop_duplicates(subset="playerID")
        )
        bat_team_map = bat_counts.set_index("playerID")["franch_clean"].to_dict()
        df.loc[null_team_mask, "canonical_teamID"] = df.loc[null_team_mask, "playerID"].map(bat_team_map).fillna("UNK")
        print(f"    Fallback batting-team para {null_team_mask.sum()} jugadores sin bbrefID.")

    df["canonical_teamID"] = df.apply(map_to_canonical_team, axis=1)
    df["franchise_name"]   = df["canonical_teamID"]

    # 5. Promedio de Atributos Globales (OVR): 26% CON, 26% PWR, 12% EYE, 16% DEF, 10% SPD, 10% K/AVD
    # (decision del usuario tras comparar contra el WAR: la Defensa es lo que mas explica el WAR
    # -29%- y pesaba 12%; habia 24 primeras bases Legendary contra 6 campocortos. Con 16% entran
    # Ozzie Smith, Brooks Robinson, Trammell e Ivan Rodriguez.)
    # Defensa PARA EL OVR (decision del usuario; la de la carta no cambia). La nota de defensa de
    # la carta mezcla 60% carreras de fildeo contra su posicion (Rfield) y 40% WAR defensivo, que
    # es el que trae la dificultad de la posicion: un campocorto medio y un primera base medio
    # quedaban a solo 15 puntos. Para el OVR la posicion pesa DEF_OVR_POS_SHARE (70%, el "punto
    # medio" entre lo de hoy y el 100%): suben receptores y campocortos, bajan primeras bases y
    # jardineros de las esquinas. Se exporta como def_ovr para que el juego recalcule igual.
    if {"rfield_career", "wardef_career", "defense_base_raw"}.issubset(df.columns):
        rf_, wd_ = df["rfield_career"], df["wardef_career"] * 10.0
        has_ = rf_.notna() & wd_.notna() & (df["primary_pos"] != "DH")
        base_raw = df["defense_base_raw"].astype(float)
        scale_ = 98.0 / max(1.0, float(base_raw.quantile(0.98) - base_raw.min()))
        cur_ = 0.60 * rf_.fillna(0) + 0.40 * wd_.fillna(0)
        alt_ = (1.0 - DEF_OVR_POS_SHARE) * rf_.fillna(0) + DEF_OVR_POS_SHARE * wd_.fillna(0)
        df["defense_ovr_val"] = np.where(has_, df["defense_val"] + (alt_ - cur_) * scale_, df["defense_val"]).round(1)
        df["defense_ovr_val"] = df["defense_ovr_val"].clip(1.0, 150.0)
        print("  Defensa para el OVR (posicion al %d%%): media por posicion" % int(DEF_OVR_POS_SHARE * 100))
        print(df.groupby("primary_pos")[["defense_val", "defense_ovr_val"]].mean().round(1).to_string())
    else:
        df["defense_ovr_val"] = df["defense_val"]
    df["raw_ovr"] = (
        df["contact_val"] * 0.26 +
        df["power_val"]   * 0.26 +
        df["eye_val"]     * 0.12 +
        df["defense_ovr_val"] * 0.16 +
        df["speed_val"]   * 0.10 +
        df["k_avoid_val"] * 0.10
    )
    # ── Badges: Clutch Player / Captain ─────────────────────────────────────
    OFFICIAL_CAPTAIN_PIDS = {
        'gehrilo01', 'munsoth01', 'jeterde01', 'judgeaa01', 'mattido01', 'nettrgr01',
        'randowi01', 'guidrro01', 'yastrca01', 'varitja01', 'ricji01', 'wrighda05',
        'hernake01', 'cartega01', 'stargwi01', 'clemero01', 'puckeki01', 'mauerjo01',
        'killeha01', 'brettge01', 'kalinal01', 'tramala01', 'cabremi01', 'ripkeca01',
        'robinfo01', 'robinbr01', 'schmimi01', 'rolliji01', 'pujolal01', 'smithoz01',
        'molinya01', 'musiasu01', 'mayswi01', 'poseybu01', 'reesep01', 'koufasa01',
        'bankser01', 'santro01', 'fiskca01', 'thomafr01', 'troutmi01', 'griffke02',
        'suzukic01', 'martied01', 'biggiig01', 'bagweje01', 'altuvjo01', 'delgado01'
    }
    awards_path = DATA_DIR / "AwardsPlayers.csv"
    if awards_path.exists():
        awards_df = pd.read_csv(awards_path, low_memory=False)
        clutch_award_ids = {'Babe Ruth Award', 'ALCS MVP', 'NLCS MVP', 'All-Star Game MVP', 'World Series MVP'}
        captain_award_ids = {'Roberto Clemente Award', 'Lou Gehrig Memorial Award', 'Hutch Award', 'Branch Rickey Award'}
        clutch_pids  = set(awards_df[awards_df['awardID'].isin(clutch_award_ids)]['playerID'].unique())
        captain_pids = set(awards_df[awards_df['awardID'].isin(captain_award_ids)]['playerID'].unique()) | OFFICIAL_CAPTAIN_PIDS
        df['is_clutch']  = df['playerID'].isin(clutch_pids)
        df['is_captain'] = df['playerID'].isin(captain_pids)
        print(f"  Badges: Clutch={df['is_clutch'].sum()} | Captain={df['is_captain'].sum()}")
    else:
        df['is_clutch']  = False
        df['is_captain'] = df['playerID'].isin(OFFICIAL_CAPTAIN_PIDS)
        print(f"  Badges: Clutch={df['is_clutch'].sum()} | Captain={df['is_captain'].sum()}")

    # ── OVR con boost de Badges (+2 por badge) & Rareza ─────────────────────
    # Cortes de rareza por percentil del pool (mismo esquema que pitchers_etl.py):
    # 35% Common, 30% Uncommon, 20% Rare, 12.5% Epic, 2.5% Legendary. Al ser percentiles y no
    # numeros fijos, la distribucion no se desplaza cuando cambia el calculo de atributos.
    # El cupo es estricto e incluye a quien llega por insignia: los cortes se ajustan sobre la
    # nota final (ya con el +2 por badge), no sobre la nota base.
    RARITY_FLOORS = [(60.0, 0.65), (70.0, 0.35), (80.0, 0.15), (90.0, 0.025)]  # (OVR minimo, % del pool en ese nivel o superior)
    raw = df["raw_ovr"].astype(float).fillna(10.0)
    badge_boost = (df["is_clutch"].astype(int) * 2.0) + (df["is_captain"].astype(int) * 2.0)

    def cosmetic_scores(cuts):
        c1, c2, c3, c4 = cuts
        res = np.where(raw <= c1, 50.0 + ((raw - 10.0) / max(0.1, c1 - 10.0)) * 9.9,
              np.where(raw <= c2, 60.0 + ((raw - c1) / max(0.1, c2 - c1)) * 9.9,
              np.where(raw <= c3, 70.0 + ((raw - c2) / max(0.1, c3 - c2)) * 9.9,
              np.where(raw <= c4, 80.0 + ((raw - c3) / max(0.1, c4 - c3)) * 9.9,
                       90.0 + np.minimum(9.9, ((raw - c4) / 25.0) * 9.9)))))
        return (np.round(res, 1) + badge_boost).clip(50.0, 99.9).round(1)

    cuts = [float(raw.quantile(1.0 - share)) for _, share in RARITY_FLOORS]
    print(f"  Cortes raw_ovr por percentil (sin badges): {[round(c, 1) for c in cuts]}"
          f"  (cortes fijos anteriores: 38.0 / 47.0 / 57.2 / 77.4)")
    # Subir un corte reduce cuantos alcanzan ese nivel: biseccion por corte, de arriba hacia abajo,
    # repetida porque cada corte desplaza levemente el tramo inferior.
    for _ in range(3):
        for k in range(3, -1, -1):
            floor, share = RARITY_FLOORS[k]
            target = int(round(share * len(df)))
            lo = cuts[k - 1] + 0.1 if k > 0 else 10.1
            hi = cuts[k + 1] - 0.1 if k < 3 else float(raw.max())
            for _ in range(40):
                mid = (lo + hi) / 2.0
                trial = cuts[:k] + [mid] + cuts[k + 1:]
                if (cosmetic_scores(trial) >= floor).sum() > target:
                    lo = mid
                else:
                    hi = mid
            cuts[k] = hi
    print(f"  Cortes raw_ovr ajustados al cupo con badges: {[round(c, 1) for c in cuts]}")

    df["avg_attr_score"] = cosmetic_scores(cuts)
    df["rarity"]         = df["avg_attr_score"].apply(asignar_rareza)
    df["pos_display"]    = df["primary_pos"].map(POS_DISPLAY_MAP).fillna("RF")

    for col, gcol in [
        ("contact_val","con_grade"),("power_val","pow_grade"),
        ("eye_val","eye_grade"),("k_avoid_val","k_avd_grade"),
        ("speed_val","spd_grade"),("defense_val","def_grade"),
    ]:
        df[gcol] = df[col].apply(to_grade)

    keep_cols = [
        "playerID","bbrefID","full_name","pos_display","sec_pos","era_label",
        "peak_year","peak_year_display","debut_year","last_year","canonical_teamID","franchise_name",
        "career_pa","career_ab","career_h","career_hr","career_sb","career_bb","career_so",
        "seasons","bats",
        "ba","obp","iso","k_rate","bb_rate",
        "contact_val","power_val","eye_val","k_avoid_val","speed_val","defense_val","defense_ovr_val",
        "con_grade","pow_grade","eye_grade","k_avd_grade","spd_grade","def_grade",
        "avg_attr_score","rarity",
        "is_allstar","is_hof","allstar_selections","gold_gloves","gg_bonus",
        "defense_source",
        "is_clutch","is_captain",
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
    stat_cols = ["contact_val","power_val","eye_val","k_avoid_val","speed_val","defense_val"]
    for col in stat_cols + ["avg_attr_score"]:
        if col in final.columns:
            final[col] = final[col].round(1)

    for idx, r in final.iterrows():
        name_val = r["name"]
        if name_val in LEGEND_POS_OVERRIDES:
            p_pos, s_pos = LEGEND_POS_OVERRIDES[name_val]
            final.at[idx, "pos"] = p_pos
            final.at[idx, "sec_pos"] = s_pos

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
        sec_val = r.get("sec_pos", "")
        sec_pos_js = "" if pd.isna(sec_val) or str(sec_val).strip().lower() in ["nan", "none", "null"] else str(sec_val).strip()
        
        if name_js in LEGEND_POS_OVERRIDES:
            pos_js, sec_pos_js = LEGEND_POS_OVERRIDES[name_js]

        team_js = str(r.get(team_col,"UNK")).replace('"',"'")
        pid_js = str(r.get("playerID","")).replace('"',"'")
        js_lines.append(
            f'    {{ '
            f'playerID: "{pid_js}", name: "{name_js}", pos: "{pos_js}", sec_pos: "{sec_pos_js}", era: "{era_js}", '
            f'team: "{team_js}", year: {int(r["peak_year_display"])}, ovr: {float(r["avg_attr_score"])}, '
            f'debut_year: {int(r["debut_year"])}, last_year: {int(r["last_year"])}, '
            f'con: {int(r["contact_val"])}, pwr: {int(r["power_val"])}, '
            f'eye: {int(r["eye_val"])}, k_avd: {int(r["k_avoid_val"])}, spd: {int(r["speed_val"])}, '
            f'def: {int(r["defense_val"])}, def_ovr: {float(r.get("defense_ovr_val", r["defense_val"])):.1f}, '
            f'con_grade: "{r["con_grade"]}", pwr_grade: "{r["pow_grade"]}", '
            f'eye_grade: "{r["eye_grade"]}", k_avd_grade: "{r["k_avd_grade"]}", '
            f'spd_grade: "{r["spd_grade"]}", def_grade: "{r["def_grade"]}", '
            f'rarity: "{r["rarity"]}", '
            f'allstars: {int(r["allstar_selections"])}, '
            f'gold_gloves: {int(r["gold_gloves"])}, '
            f'hof: {"true" if r["is_hof"] else "false"}, '
            f'clutch: {"true" if r.get("is_clutch", False) else "false"}, '
            f'captain: {"true" if r.get("is_captain", False) else "false"}, '
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

    def calcular_ratings(n_peak):
        """Pasos 4 a 14b con un pico de n_peak temporadas."""
        global PEAK_SEASONS
        PEAK_SEASONS = n_peak
        peak, pico_off, pico_tot = paso_4_pico_batting(batting, war_bat, people)
        hybrid = paso_5_hibrido(career, peak)
        pos_data = paso_6_posicion_bateadores(fielding, fielding_of, dfs.get("appearances"), pico_off)
        hybrid = hybrid.merge(pos_data, on="playerID", how="left")
        hybrid = paso_7_enriquecer_people(hybrid, people)
        el = paso_8_filtro_ingesta(hybrid, allstar, hof, pure_pitcher_ids, batting)
        el = paso_9_asignar_era(el, war_bat=war_bat, people=people, batting=batting)
        el = usar_sub_eras_de_calculo(el)
        el = paso_9b_ambiente_por_temporada(el, pico_off)
        el = paso_10_atributos_raw_bateo(el)
        el = paso_11_motor_defensivo(el, war_bat, awards)
        el = paso_12_normalizar_por_era(el)
        el = paso_13_bono_guante_de_oro(el)
        el = paso_14_velocidad(el)
        el = paso_14b_pocas_temporadas(el)
        PEAK_SEASONS = 7
        return el, pico_off, pico_tot

    eligible12, pico_off_12, _ = calcular_ratings(LONGEVITY_SEASONS)
    eligible, pico_off_df, pico_tot_df = calcular_ratings(7)
    eligible         = paso_14c_longevidad(eligible, eligible12, pico_off_12)
    eligible         = paso_14d_extremos(eligible)
    eligible         = restaurar_era_de_carta(eligible)
    final            = paso_15_equipo_y_exportar(eligible, batting, teams, franchises, pico_tot_df, war_bat, people)

    reporte_final(final)
    return final


if __name__ == "__main__":
    result_df = main()
