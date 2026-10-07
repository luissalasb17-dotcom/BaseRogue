"""
BaseRogue Pitchers ETL  -  v1.0
Lahman Pitching.csv + war_daily_pitch.txt  ->  pitchers_pool.js

Filtro de Ingesta:
  SP: career_ip >= 400.0 (MLB) | >= 200.0 (NLB)
  RP: career_ip >= 250.0 (MLB) | >= 125.0 (NLB)
  All-Star  OR  HoF  OR  Calidad/Estrellato Joven

Pico: 7 mejores temporadas por WAR (no consecutivas)
Ajuste por Era: normalización relativa por Era temática

Suite de Atributos Oficial (MLB The Show Suite):
  H/9  (Hit Suppression)    → Hits permitidos por 9 IP (menor es mejor → invert=True)
  K/9  (Strikeouts)         → Ponches por 9 IP (mayor es mejor)
  BB/9 (Control)            → Boletos por 9 IP (menor es mejor → invert=True)
  HR/9 (Home Run Prevention)→ Jonrones permitidos por 9 IP (menor es mejor → invert=True)
  STA  (Stamina)            → Innings promedio de trabajo por temporada en el pico

OVR formula: 20% H/9 + 20% K/9 + 20% BB/9 + 20% HR/9 + 20% STA

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
    Lleva la tasa de cada pitcher hacia una referencia comun quitando `blend` de la diferencia
    entre el ambiente de SUS temporadas y el ambiente medio de todas las cartas:
      factor = 1 + blend * (ambiente_medio / ambiente_del_pitcher - 1)
    """
    amb = ambiente.replace(0, np.nan)
    return raw * (1.0 + blend * (amb.mean() / amb - 1.0)).fillna(1.0)


def estimar_por_contemporaneos(adjusted, raw, year, last_year=1888, ref_first_year=1893, radius=4):
    """
    Para tasas cuyo ambiente estaba casi en cero (bases por bolas hasta 1888, cuando hacian falta
    de 5 a 9 bolas): dividir contra ese ambiente exagera todo. En esas cartas el valor ajustado
    se estima por la posicion del jugador entre sus contemporaneos (desvios estandar entre las
    cartas con pico a +-radius años), trasladada a la escala de las cartas de ref_first_year en adelante.
    """
    yy = pd.to_numeric(year, errors="coerce").values.astype(float)
    rv = raw.values.astype(float)
    ref = yy >= ref_first_year
    ref_mean, ref_sd = float(adjusted[ref].mean()), float(adjusted[ref].std())
    est = adjusted.values.astype(float).copy()
    for uy in np.unique(yy[yy <= last_year]):
        w = np.clip(1.0 - np.abs(yy - uy) / (radius + 1.0), 0, None)
        m = (w * rv).sum() / w.sum()
        sd = np.sqrt((w * (rv - m) ** 2).sum() / w.sum())
        if sd > 0:
            sel = yy == uy
            est[sel] = ref_mean + (rv[sel] - m) / sd * ref_sd
    return pd.Series(est, index=adjusted.index)


def normalizar_por_ambiente(df, col_raw, col_out, col_amb, invert=False, blend=0.75, estimar_hasta=None):
    adjusted = ajustar_por_ambiente(df[col_raw], df[col_amb], blend)
    if estimar_hasta is not None:
        adjusted = estimar_por_contemporaneos(adjusted, df[col_raw], df["peak_year"], last_year=estimar_hasta)
    if invert:
        adjusted = -adjusted  # invertir para que menor sea mejor
    df[col_out] = normalize_series(adjusted).clip(RATING_FLOOR, RATING_CEIL).round(1)
    return df


# ── Longevidad y extremos: pasos comunes a bateadores y pitchers ─────────────────────────────
LONGEVITY_SEASONS = 12      # segundo pico, mas largo
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


def ajustar_extremos(v):
    """
    Ultimo paso de TODOS los ratings, igual para todos y sin estirados artificiales (decision del
    usuario): el centro de la escala (25 a 75) no se toca; por encima de 75 el MEJOR de la
    historia en ese rating vale 125 y los demas quedan debajo en proporcion a su distancia real;
    por debajo de 25 el PEOR vale 1 y el resto en proporcion. Asi el 99 es el tope real del
    juego (muy pocas cartas lo pasan) y el tramo hasta 125 es el remanente de los fuera de serie.
    Antes se forzaba que el 20o mejor valiera 125: Babe Ruth (poder real 208) valia lo mismo que
    el 20o (126). Los ratings llegan aqui SIN recortar (RATING_FLOOR / RATING_CEIL).
    """
    v = v.astype(float).copy()
    hi, lo = float(v.max()), float(v.min())
    if hi > EXTREME_TOP_ANCHOR:
        top = v > EXTREME_TOP_ANCHOR
        v[top] = EXTREME_TOP_ANCHOR + (v[top] - EXTREME_TOP_ANCHOR) * (125.0 - EXTREME_TOP_ANCHOR) / (hi - EXTREME_TOP_ANCHOR)
    if lo < EXTREME_LOW_ANCHOR:
        low = v < EXTREME_LOW_ANCHOR
        v[low] = 1.0 + (v[low] - lo) * (EXTREME_LOW_ANCHOR - 1.0) / (EXTREME_LOW_ANCHOR - lo)
    return v.clip(1.0, 125.0).round(1)

PIT_RATINGS = ["h9_val", "k9_val", "bb9_val", "hr9_val", "sta_val", "clt_val"]
MIN_IP_SEASON_SP, MIN_IP_SEASON_RP, NLB_SEASON_FACTOR = 60.0, 25.0, 2.2     # temporada con carga real


def paso_10b_longevidad(df7, df12, pico12):
    print(f"\n  PASO 10b: Longevidad ({int((1 - LONGEVITY_WEIGHT) * 100)}% pico de 7 + {int(LONGEVITY_WEIGHT * 100)}% pico de {LONGEVITY_SEASONS})...")
    df = df7.copy()
    s = pico12[pico12["playerID"].isin(set(df["playerID"]))]
    minimo = np.where(s["is_sp_season"].astype(bool), MIN_IP_SEASON_SP, MIN_IP_SEASON_RP) / np.where(s["is_nlb_y"].astype(bool), NLB_SEASON_FACTOR, 1.0)
    ok = (s["IPouts"] / 3.0) >= minimo
    n = ok.groupby(s["playerID"]).sum()
    share = (df["playerID"].map(n).fillna(0) / float(LONGEVITY_SEASONS)).clip(0.0, 1.0)
    df["longevity_seasons"] = (share * LONGEVITY_SEASONS).round(0).astype(int)
    v12 = df12.drop_duplicates("playerID").set_index("playerID")
    for col in PIT_RATINGS:
        df[col] = mezclar_longevidad(df[col].astype(float), df["playerID"].map(v12[col]), share).round(1)
    return df


def paso_10c_extremos(df):
    print("\n  PASO 10c: Extremos (centro 25-75 intacto; el mejor de cada rating = 125, el peor = 1)...")
    df = df.copy()
    for col in PIT_RATINGS:
        df[col] = ajustar_extremos(df[col])
    df["clu_val"] = df["clt_val"]
    return df


def media_deslizante(values, year, radius=8):
    """Media de `values` entre las cartas con pico a +-radius años (peso triangular)."""
    y = year.values.astype(float)
    v = values.values.astype(float)
    out = np.empty(len(v))
    ok = ~np.isnan(v)
    for uy in np.unique(y):
        w = np.clip(1.0 - np.abs(y - uy) / (radius + 1.0), 0, None)
        out[y == uy] = (w[ok] * v[ok]).sum() / max(w[ok].sum(), 1e-9)
    return pd.Series(out, index=values.index)


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
    # Incluir variantes duales canónicas y jugadores de dos vías (Ruth, Rogan, Ward, Caruthers, Wood, Ohtani, Dihigo)
    for dual_id in ["eckerde01_sp", "eckerde01_rp", "smoltjo01_sp", "smoltjo01_rp", "ruthba01", "roganbu99", "wardjo01", "carutbo01", "woodjo02", "ohtansh01", "dihigma99"]:
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
def _rellenar_hr_faltantes(pit_yearly):
    """
    Jonrones permitidos faltantes en Ligas Negras. Muchas temporadas no tienen el dato (vacio) o
    figuran con 0 jonrones en 100+ entradas (de 1925 a 1929 le pasa al 20% de las temporadas de
    Ligas Negras de 100+ IP, contra 0.4% en MLB): contarlas como cero regalaba HR/9 y Clutch.
    Se estiman con la tasa del propio pitcher en sus temporadas con dato, regresada con 150 IP
    hacia la tasa de las Ligas Negras de ese quinquenio.
    """
    py = pit_yearly.copy()
    ip = py["IP_y"]
    nlb = py["is_nlb_y"].astype(bool)
    missing = nlb & (py["hr_missing"].astype(bool) | ((py["HR_a"] == 0) & (ip >= 100) & (py["yearID"] >= 1920)))
    ok = nlb & ~missing & (ip > 0)
    py["hr_estimated"] = missing
    if not missing.any() or not ok.any():
        return py
    lg_rate = py.loc[ok, "HR_a"].sum() / ip[ok].sum()
    blk = py["yearID"] // 5 * 5
    lg_blk = py.loc[ok, "HR_a"].groupby(blk[ok]).sum() / ip[ok].groupby(blk[ok]).sum()
    base = blk.map(lg_blk).fillna(lg_rate)
    own_hr = py["playerID"].map(py.loc[ok].groupby("playerID")["HR_a"].sum()).fillna(0.0)
    own_ip = py["playerID"].map(ip[ok].groupby(py.loc[ok, "playerID"]).sum()).fillna(0.0)
    rate = (own_hr + 150.0 * base) / (own_ip + 150.0)
    py["HR_a"] = py["HR_a"].astype(float)
    py.loc[missing, "HR_a"] = (rate * ip)[missing]
    print(f"  Jonrones permitidos estimados en {int(missing.sum()):,} temporadas de Ligas Negras sin el dato")
    return py


def _estimar_war_sin_dato(pit_yearly):
    """
    Ninguna temporada de Ligas Negras anterior a 1920 (ni las de circuitos independientes) tiene
    WAR calculado. Como el pico se elige por WAR, esas temporadas quedaban al final de la fila y
    solo entraban como relleno, las mas antiguas primero y no las mejores. Aqui se les estima un
    WAR SOLO para ese ranking (war_rank_base), con la relacion entre WAR por entrada y efectividad
    contra la liga que sale de las temporadas de Ligas Negras que si tienen WAR. El WAR real
    guardado (war_season) no cambia.
    """
    py = pit_yearly.copy()
    py["war_rank_base"] = py["war_season"]
    nlb = py["is_nlb_y"].astype(bool)
    ip = py["IP_y"]
    if not nlb.any():
        return py
    lg = suavizar_por_anio(py.loc[nlb].groupby("yearID")[["ER", "IPouts"]].sum())
    lg_era = (lg["ER"] / (lg["IPouts"] / 3.0).replace(0, np.nan) * 9.0)
    diff = py["yearID"].map(lg_era) - py["era_y"]
    fit = nlb & py["war_season"].notna() & (ip >= 20) & diff.notna()
    need = nlb & py["war_season"].isna() & (ip > 0) & diff.notna()
    if fit.sum() < 50 or not need.any():
        return py
    x, w = diff[fit].values, ip[fit].values
    y = (py.loc[fit, "war_season"] / ip[fit]).values
    xm, ym = np.average(x, weights=w), np.average(y, weights=w)
    slope = np.average((x - xm) * (y - ym), weights=w) / np.average((x - xm) ** 2, weights=w)
    est = (ym + slope * (diff - xm)) * ip
    py.loc[need, "war_rank_base"] = est[need]
    print(f"  WAR estimado (solo para elegir el pico) en {int(need.sum()):,} temporadas sin WAR  |  WAR/IP = {ym:.5f} + {slope:.5f} * (ERA liga - ERA)")
    return py


def paso_4_pico_pitching(pitching, war_pitch, people):
    """
    Selecciona las PEAK_SEASONS mejores temporadas por WAR de war_daily_pitch.txt.
    Si no hay WAR disponible, usa ERA (fallback: menor ERA = mejor).
    """
    print(f"\n  PASO 4: Seleccionando pico de {PEAK_SEASONS} mejores temporadas por WAR...")
    pit = pitching.copy()
    # Antes de rellenar con 0: que temporadas no tienen el dato de jonrones permitidos, y cuales son de Ligas Negras.
    pit["_hr_missing"] = pd.to_numeric(pit["HR"], errors="coerce").isna() if "HR" in pit.columns else False
    pit["_nlb_row"] = pit["lgID"].isin(NLB_ALL_LEAGUES) if "lgID" in pit.columns else False
    int_cols = ["G", "GS", "SV", "IPouts", "H", "ER", "R", "HR", "BB", "SO", "HBP", "BFP", "W", "L"]
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
        R     =("R",      "sum"),
        HR_a  =("HR",     "sum"),
        BB    =("BB",     "sum"),
        SO    =("SO",     "sum"),
        HBP   =("HBP",    "sum"),
        BFP   =("BFP",    "sum"),
        W     =("W",      "sum"),
        L     =("L",      "sum"),
        hr_missing=("_hr_missing", "max"),
        is_nlb_y  =("_nlb_row",    "max"),
    ).reset_index()

    pit_yearly["IP_y"]  = pit_yearly["IPouts"] / 3.0
    pit_yearly = _rellenar_hr_faltantes(pit_yearly)
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
        for col in ["WAR", "GS", "G", "IPouts", "IPouts_start", "IPouts_relief", "ERA_plus", "GR_leverage_index_avg"]:
            if col in war.columns:
                war[col] = pd.to_numeric(
                    war[col].replace("NULL", np.nan) if isinstance(war[col].iloc[0], str) else war[col],
                    errors="coerce"
                ).fillna(1.0 if col == "GR_leverage_index_avg" else 0.0)
            else:
                war[col] = 1.0 if col == "GR_leverage_index_avg" else 0.0
        war_season = war.groupby(["player_ID", "year_ID"]).agg(
            war_season    =("WAR",                   "sum"),
            era_plus_y    =("ERA_plus",              "mean"),  # media ponderada de stints
            ipouts_start_y=("IPouts_start",          "sum"),
            ipouts_rel_y  =("IPouts_relief",         "sum"),
            leverage_y    =("GR_leverage_index_avg", "mean"),
        ).reset_index()
        war_season.columns = ["bbrefID", "yearID", "war_season", "era_plus_y", "ipouts_start_y", "ipouts_rel_y", "leverage_y"]

        id_map = people[["playerID", "bbrefID"]].dropna(subset=["bbrefID"])
        war_yearly = (
            war_season.merge(id_map, on="bbrefID", how="left")
                      .dropna(subset=["playerID"])[["playerID", "yearID", "war_season", "era_plus_y", "ipouts_start_y", "ipouts_rel_y", "leverage_y"]]
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

    pit_yearly = _estimar_war_sin_dato(pit_yearly)

    NLB_WAR_BOOST = 2.0
    nl_leagues = {'NN1', 'NN2', 'EAL', 'NSL', 'NAL', 'ANL', 'EWL', 'NNL', 'ECL', 'IND'}

    # Seleccionar top PEAK_SEASONS por WAR (o por ERA inverso si no hay WAR).
    # Temporadas mayormente de relevo (GS/G < 0.50) reciben un boost 1.6x SOLO para este ranking.
    # Temporadas de NLB (Ligas Negras) reciben un boost 2.0x SOLO para este ranking por volumen de calendario.
    def seleccionar_pico(group):
        g = group.copy()
        if g["war_rank_base"].notna().any():
            gs_ratio = g["GS"] / g["G"].replace(0, np.nan)
            is_relief_season = gs_ratio.fillna(0) < RELIEF_GS_RATIO_THRESHOLD
            relief_mult = np.where(is_relief_season, RELIEF_WAR_BOOST, 1.0)
            is_nlb_season = (g["lgID"].isin(nl_leagues) if "lgID" in g.columns else False) | (g["teamID"].isin(NLB_TEAMS) if "teamID" in g.columns else False)
            nlb_mult = np.where(is_nlb_season, NLB_WAR_BOOST, 1.0)
            g["war_ranking"] = g["war_rank_base"] * relief_mult * nlb_mult
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

    # Dedicación en el Pico Ponderada por WAR (o war_ranking que incluye boost de relevo):
    def _calc_weighted_peak_ded(g):
        w = g["war_ranking"].fillna(1.0).clip(lower=0.1) if "war_ranking" in g.columns else pd.Series(1.0, index=g.index)
        return (g["sp_dedication"] * w).sum() / max(0.001, w.sum())

    peak_w_ded = pico_df.groupby("playerID").apply(_calc_weighted_peak_ded).reset_index(name="peak_sp_dedication")

    # Dedicación en Carrera (promedio de toda la trayectoria):
    pit_yearly["sp_ded_yearly"] = (pit_yearly["GS"] / pit_yearly["G"].replace(0, np.nan)).fillna(0.0)
    career_ded = pit_yearly.groupby("playerID")["sp_ded_yearly"].mean().reset_index(name="career_sp_dedication")

    peak = pico_df.groupby("playerID").agg(
        peak_ip          =("IP_y",               "sum"),
        peak_gs          =("GS",                 "sum"),
        peak_g           =("G",                  "sum"),
        peak_sv          =("SV",                 "sum"),
        peak_so          =("SO",                 "sum"),
        peak_bb          =("BB",                 "sum"),
        peak_hr_a        =("HR_a",               "sum"),
        peak_er          =("ER",                 "sum"),
        peak_r           =("R",                  "sum"),
        peak_hbp         =("HBP",                "sum"),
        peak_h           =("H",                  "sum"),
        peak_w           =("W",                  "sum"),
        peak_l           =("L",                  "sum"),
        peak_war         =("war_season",         "sum"),
        peak_era_plus    =("era_plus_y",         "mean"),   # promedio de ERA+ en peak
        peak_li          =("leverage_y",         "mean"),   # promedio de Leverage Index en peak
    ).reset_index()

    peak["is_nlb"] = peak["playerID"].map(nlb_counts > 0).fillna(False)

    peak = peak.merge(sp_season_counts, on="playerID", how="left")
    peak["sp_seasons_count"] = peak["sp_seasons_count"].fillna(0).astype(int)

    peak = peak.merge(peak_w_ded, on="playerID", how="left")
    peak["peak_sp_dedication"] = peak["peak_sp_dedication"].fillna(0.0)

    peak = peak.merge(career_ded, on="playerID", how="left")
    peak["career_sp_dedication"] = peak["career_sp_dedication"].fillna(0.0)

    # Fórmula Híbrida 80/20 de Dedicación (80% Pico Ponderado por WAR + 20% Carrera Completa):
    peak["mean_sp_dedication"] = 0.80 * peak["peak_sp_dedication"] + 0.20 * peak["career_sp_dedication"]

    total_season_counts = pico_df.groupby("playerID")["yearID"].count().reset_index(name="total_seasons_in_peak")
    peak = peak.merge(total_season_counts, on="playerID", how="left")
    peak["total_seasons_in_peak"] = peak["total_seasons_in_peak"].fillna(1).astype(int)

    career_war_df = pit_yearly.groupby("playerID")["war_season"].sum().reset_index(name="career_war")
    peak = peak.merge(career_war_df, on="playerID", how="left")

    # Rol por % de Dedicación Híbrida 80/20 (>= 50% => SP, sino RP)
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

    # Criterio Unificado de Ingesta para Pitchers por Innings Pitched:
    # 1. Volumen de carrera:
    #    - SP: MLB >= 400.0 IP | NLB >= 200.0 IP
    #    - RP: MLB >= 250.0 IP | NLB >= 125.0 IP
    # 2. Calidad / Estrellato Joven:
    #    - SP: (career_war >= 5.0 OR peak_war >= 5.0) AND (MLB >= 150.0 IP | NLB >= 75.0 IP)
    #    - RP: (career_war >= 3.5 OR peak_war >= 3.5) AND (MLB >= 100.0 IP | NLB >= 50.0 IP)
    # 3. Reconocimiento Histórico: HoF incondicional OR (All-Star AND career_ip >= 35.0)
    MIN_IP_ALLSTAR = 35.0

    def is_eligible(r):
        if r["is_hof"]:
            return True
        cip = r.get("career_ip", 0) if pd.notna(r.get("career_ip")) else 0
        if r["is_allstar"] and (cip >= MIN_IP_ALLSTAR):
            return True
        c_war = r.get("career_war", 0) if pd.notna(r.get("career_war")) else 0
        p_war = r.get("peak_war", 0) if pd.notna(r.get("peak_war")) else 0
        is_nl = r.get("is_nlb", False)
        
        if r["role"] == "SP":
            vol_threshold = 200.0 if is_nl else 400.0
            qual_ip_thresh = 75.0 if is_nl else 150.0
            return (cip >= vol_threshold) or (((c_war >= 5.0) or (p_war >= 5.0)) and (cip >= qual_ip_thresh))
        else:
            vol_threshold = 125.0 if is_nl else 250.0
            qual_ip_thresh = 50.0 if is_nl else 100.0
            return (cip >= vol_threshold) or (((c_war >= 3.5) or (p_war >= 3.5)) and (cip >= qual_ip_thresh))

    mask = df.apply(is_eligible, axis=1)
    eligible = df[mask].copy()

    # List of all Negro League and Independent Pioneer leagues:
    nl_official_leagues = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN1'}
    nl_pioneer_leagues  = {'IND', 'EAS', 'WES', 'NAC', 'INT'}
    nl_all_leagues      = nl_official_leagues | nl_pioneer_leagues

    if not pitching.empty and 'lgID' in pitching.columns:
        nl_ip_df = pitching[pitching['lgID'].isin(nl_all_leagues)].groupby('playerID')['IPouts'].sum().reset_index().rename(columns={'IPouts': 'nlb_ipouts'})
        unoff_ip_df = pitching[pitching['lgID'].isin(nl_pioneer_leagues)].groupby('playerID')['IPouts'].sum().reset_index().rename(columns={'IPouts': 'unoff_ipouts'})
        ml_ip_df = pitching[~pitching['lgID'].isin(nl_all_leagues)].groupby('playerID')['IPouts'].sum().reset_index().rename(columns={'IPouts': 'mlb_ipouts'})
        
        eligible = eligible.merge(nl_ip_df, on='playerID', how='left').merge(ml_ip_df, on='playerID', how='left').merge(unoff_ip_df, on='playerID', how='left')
        eligible['nlb_ipouts'] = eligible['nlb_ipouts'].fillna(0)
        eligible['mlb_ipouts'] = eligible['mlb_ipouts'].fillna(0)
        eligible['unoff_ipouts'] = eligible['unoff_ipouts'].fillna(0)
        eligible['league_group'] = np.where(eligible['nlb_ipouts'] > eligible['mlb_ipouts'], 'NLB', 'MLB')
    else:
        eligible['league_group'] = 'MLB'
        eligible['unoff_ipouts'] = 0

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
    "chishja01": "Jazz Chisholm Jr.",
    "roberlu01": "Luis Robert Jr.",
    "gurrilo01": "Lourdes Gurriel Jr.",
    "harrimi03": "Michael Harris II",
    "sanchca01": "Yolmer Sánchez",
}

def clean_initials_spacing(name):
    import re
    # Fix spaced initials like 'B. J. Upton' -> 'B.J. Upton', 'A. J. Burnett' -> 'A.J. Burnett'
    name = re.sub(r'\b([A-Z]\.)\s+([A-Z]\.)', r'\1\2', str(name))
    name = re.sub(r'\b([A-Z]\.[A-Z]\.)\s+([A-Z]\.)', r'\1\2', name)
    return name

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
    slim["full_name"] = slim["full_name"].apply(clean_initials_spacing)
    for pid, explicit_name in SR_JR_MAP.items():
        slim.loc[slim["playerID"] == pid, "full_name"] = explicit_name

    result = df.merge(slim, on="playerID", how="left")
    print(f"  bbrefID para {result['bbrefID'].notna().sum():,} pitchers")
    return result


# ── PASO 7: Asignar Era temática (80% WAR Pico + 20% WAR Carrera por Era) ────
def paso_7_asignar_era(df, war_pit=None, people=None, pitching=None):
    """
    Asigna Era temática usando el mismo sistema 80/20 WAR que batters.
    era_score(era) = 0.80 * WAR_Peak7_en_era + 0.20 * WAR_Career_en_era
    Fallback a assign_era(peak_year) para pitchers NLB sin bbrefID.
    """
    print("\n  PASO 7: Asignando Era Tematica (80/20 WAR por Era)...")
    df["era_label"] = df["peak_year"].apply(assign_era)

    if war_pit is None or war_pit.empty or people is None or people.empty:
        for era, cnt in df["era_label"].value_counts().sort_index().items():
            print(f"    {era[:46]:<46}: {cnt:4,}")
        return df

    id_map = people[["playerID", "bbrefID"]].dropna(subset=["bbrefID"])
    war = war_pit.copy()
    war["WAR"] = pd.to_numeric(war["WAR"].replace("NULL", 0), errors="coerce").fillna(0)
    war_merged = war.merge(id_map, left_on="player_ID", right_on="bbrefID", how="inner")
    war_merged["era_label_w"] = war_merged["year_ID"].apply(assign_era)

    career_era_war = war_merged.groupby(["playerID", "era_label_w"])["WAR"].sum().reset_index(name="career_war_e")

    if "peak_year" in df.columns:
        peak_years_set = {}
        for _, row in df[["playerID", "peak_year"]].dropna().iterrows():
            pid = row["playerID"]
            py = int(row["peak_year"])
            peak_years_set.setdefault(pid, set()).update(range(py - 3, py + 4))

        def in_peak(r):
            return r["year_ID"] in peak_years_set.get(r["playerID"], set())

        peak_war_df = war_merged[war_merged.apply(in_peak, axis=1)]
        peak_era_war = peak_war_df.groupby(["playerID", "era_label_w"])["WAR"].sum().reset_index(name="peak_war_e")
    else:
        peak_era_war = career_era_war.rename(columns={"career_war_e": "peak_war_e"})

    merged_era = career_era_war.merge(peak_era_war, on=["playerID", "era_label_w"], how="outer").fillna(0.0)
    merged_era["era_score"] = 0.80 * merged_era["peak_war_e"] + 0.20 * merged_era["career_war_e"]

    best_era = (
        merged_era.sort_values("era_score", ascending=False)
                  .drop_duplicates(subset="playerID")
                  .rename(columns={"era_label_w": "era_label_war"})
    )

    df = df.merge(best_era[["playerID", "era_label_war", "era_score"]], on="playerID", how="left")
    df["era_label"] = df["era_label_war"].fillna(df["era_label"])

    # ── Proteccion contra la "Trampa de WAR Negativo / Tacita de Cafe" ────────
    if pitching is not None and not pitching.empty:
        pit_seasons = pitching.copy()
        pit_seasons["era_s"] = pit_seasons["yearID"].apply(assign_era)
        p_era_seas = pit_seasons.groupby(["playerID", "era_s"])["yearID"].nunique().to_dict()
        p_tot_seas = pit_seasons.groupby("playerID")["yearID"].nunique().to_dict()

        for idx, r in df.iterrows():
            pid = r["playerID"]
            py_era = assign_era(r.get("peak_year", 2000))
            best_e = r.get("era_label", py_era)
            score = r.get("era_score", 0.0)

            if best_e != py_era:
                py_s   = p_era_seas.get((pid, py_era), 0)
                best_s = p_era_seas.get((pid, best_e), 0)
                tot_s  = p_tot_seas.get(pid, 1)

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
    # Como los calendarios pre-1920 eran mas cortos (10-30 juegos vs 70-80 en los años 20),
    # se evalua equivalencia de temporadas o entradas ponderadas (1.8x):
    # Asigna a Deadball (1901-1919) si debutó entre 1901 y 1919 y:
    #   a) Disputó al menos el 50% de sus temporadas en Deadball (dead_seasons >= post_seasons y dead_seasons >= 5), o
    #   b) Al menos el 45% de sus IP equivalentes ocurrieron en Deadball.
    if pitching is not None and not pitching.empty:
        nl_all_leagues = {'NNL', 'NN2', 'NAL', 'ECL', 'ANL', 'EWL', 'NSL', 'NN1', 'IND', 'EAS', 'WES', 'NAC', 'INT'}
        nl_pit = pitching[pitching['lgID'].isin(nl_all_leagues)].copy()
        if not nl_pit.empty:
            pioneer_pids = set(nl_pit['playerID'].unique())
            deadball_pit = nl_pit[(nl_pit['yearID'] >= 1901) & (nl_pit['yearID'] <= 1919)]
            post_pit     = nl_pit[nl_pit['yearID'] >= 1920]

            dead_ip = deadball_pit.groupby('playerID')['IPouts'].sum().to_dict()
            post_ip = post_pit.groupby('playerID')['IPouts'].sum().to_dict()
            dead_seasons = deadball_pit.groupby('playerID')['yearID'].nunique().to_dict()
            post_seasons = post_pit.groupby('playerID')['yearID'].nunique().to_dict()

            for idx, r in df.iterrows():
                pid = r['playerID']
                debut = r.get('debut_year', 1930)
                if pid in pioneer_pids and debut >= 1901 and debut < 1920:
                    d_ip = dead_ip.get(pid, 0)
                    p_ip = post_ip.get(pid, 0)
                    d_s  = dead_seasons.get(pid, 0)
                    p_s  = post_seasons.get(pid, 0)

                    equiv_dead_ip = d_ip * 1.8
                    tot_equiv_ip = equiv_dead_ip + p_ip
                    equiv_pct = (equiv_dead_ip / max(1, tot_equiv_ip))

                    season_parity = (d_s >= p_s) and (d_s >= 5)

                    if season_parity or (equiv_pct >= 0.45):
                        df.at[idx, 'era_label'] = 'Deadball (1901-1919)'

    for era, cnt in df["era_label"].value_counts().sort_index().items():
        print(f"    {era[:46]:<46}: {cnt:4,}")
    return df


# ── PASO 8: Atributos RAW de pitching (MLB The Show Suite: H/9, K/9, BB/9, HR/9, STA) ──
# ── Ajuste por muestra chica sin eras fijas (comun a bateadores y pitchers) ─────────────────────
# Decisiones del usuario: nunca eras fijas (lo "esperado" sale de las cartas con pico a
# +-PRIOR_RADIUS años); el ancla es una temporada de tiempo completo de SU ROL (un cerrador junta
# unas 75 entradas por año, un abridor mas de 200), sin separar Ligas Negras de MLB; y lo esperado
# no distingue rol, igual que en bateadores. En False cada interruptor vuelve al calculo anterior.
PRIOR_POR_VENTANA = True
ANCLA_TEMPORADA_COMPLETA = True
PRIOR_RADIUS = 8
PRIOR_CON_ROL = False


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


def _prior_por_grupo_y_tiempo_de_juego(rate, weight, group, share, fallback_group):
    """
    Prior bayesiano individual: la tasa esperada de un pitcher dado su grupo (Era + rol) y su
    tiempo de juego (share = IP por temporada del pico / IP de un pitcher de tiempo completo
    de su misma Era, rol y liga).

    Dentro de cada grupo se ajusta una recta ponderada  tasa ~ a + b * share  (pesos = IP,
    para que las muestras chicas no dominen el ajuste). Un relevista de pocas entradas se
    regresa asi hacia lo que rinden pitchers como el, y no hacia una unica media global.
    Grupos con menos de 30 pitchers usan la media ponderada del grupo de respaldo (la Era).
    """
    prior = pd.Series(np.nan, index=rate.index, dtype=float)

    def _wmean(idx):
        r = rate.loc[idx].astype(float)
        w = weight.loc[idx].astype(float)
        ok = r.notna() & (w > 0)
        return np.average(r[ok], weights=w[ok]) if ok.sum() else np.nan

    fallback_means = {k: _wmean(idx) for k, idx in fallback_group.groupby(fallback_group).groups.items()}
    global_mean = _wmean(rate.index)

    for _, idx in group.groupby(group).groups.items():
        r = rate.loc[idx].astype(float)
        w = weight.loc[idx].astype(float)
        x = share.loc[idx].astype(float)
        ok = r.notna() & x.notna() & (w > 0)
        if ok.sum() < 30:
            fb = fallback_group.loc[idx].map(fallback_means)
            prior.loc[idx] = fb.fillna(global_mean)
            continue
        wm = np.average(r[ok], weights=w[ok])
        xm = np.average(x[ok], weights=w[ok])
        var_x = np.average((x[ok] - xm) ** 2, weights=w[ok])
        slope = np.average((x[ok] - xm) * (r[ok] - wm), weights=w[ok]) / var_x if var_x > 0 else 0.0
        prior.loc[idx] = wm + slope * (x.fillna(xm) - xm)
    return prior.fillna(global_mean)


def paso_8_atributos_raw(df):
    """
    H9_raw, K9_raw, BB9_raw, HR9_raw: tasas por 9 IP con suavizado bayesiano de ancla unica
    m = 250 IP (1 temporada de as abridor, fija para todas las tasas y ligas), regresadas hacia
    un prior individual por Era, rol (SP/RP) y tiempo de juego.
    STA_raw: IP por salida
    """
    print("\n  PASO 8: Atributos RAW de pitching con Ancla m=250 IP y prior por Era/rol/tiempo de juego...")
    df = df.copy()

    ip_k = df["peak_ip"].fillna(df["career_ip"]).fillna(0)
    h_k  = df["peak_h"].fillna(0)
    so_k = df["peak_so"].fillna(0)
    bb_k = df["peak_bb"].fillna(0)
    hr_k = df["peak_hr_a"].fillna(0)

    # Suavizado bayesiano calibrado: m = 250.0 IP (equivalente a 1 temporada completa de as abridor)
    m_ip = 250.0

    # ── Prior individual por Era + rol + tiempo de juego ─────────────────────────
    # La Era usa la misma sub-division de Genesis que la normalizacion (distancia del monticulo).
    era_key = df["era_label"].fillna("").copy()
    is_genesis = era_key.str.contains("Genesis", case=False, na=False)
    if "peak_year" in df.columns:
        era_key.loc[is_genesis & (df["peak_year"] <= 1892)] = "Genesis (45-50ft)"
        era_key.loc[is_genesis & (df["peak_year"] >= 1893)] = "Genesis (60ft)"
    role = df["role"].fillna("SP") if "role" in df.columns else pd.Series("SP", index=df.index)
    lg = df["league_group"].fillna("MLB") if "league_group" in df.columns else pd.Series("MLB", index=df.index)
    group_key = era_key + " | " + role

    # share: IP por temporada del pico relativo a un pitcher de tiempo completo (percentil 90)
    # de su misma Era, rol y liga. Agrupar por liga y rol evita tratar como "suplente" a un
    # cerrador o a un as de Ligas Negras, que lanzan menos entradas por diseño o calendario.
    n_seasons = df["total_seasons_in_peak"].fillna(1).clip(lower=1) if "total_seasons_in_peak" in df.columns else pd.Series(PEAK_SEASONS, index=df.index)
    ip_per_season = ip_k / n_seasons
    if PRIOR_POR_VENTANA:
        full_time_ip = tiempo_completo_por_ventana(ip_per_season, df["peak_year"], role + "|" + lg)
    else:
        full_time_ip = ip_per_season.groupby([era_key, role, lg]).transform(lambda v: v.quantile(0.90))
    share = (ip_per_season / full_time_ip.replace(0, np.nan)).clip(0.0, 1.0).fillna(0.0)
    df["playing_time_share"] = share.round(3)

    # Ancla: una temporada de tiempo completo de alguien de su rol (un cerrador junta unas 70-80
    # entradas por año y un abridor 200+), igual para MLB y Ligas Negras. Con el ancla fija de
    # 250 IP un cerrador con siete temporadas completas conservaba solo dos tercios de lo suyo y
    # un abridor el 87%.
    if ANCLA_TEMPORADA_COMPLETA:
        m_ip = tiempo_completo_por_ventana(ip_per_season, df["peak_year"], role).fillna(250.0).clip(lower=30.0)
    ip_nz = ip_k.replace(0, np.nan)
    if PRIOR_POR_VENTANA:
        _grp = role if PRIOR_CON_ROL else None
        _prior = lambda rate, w: prior_por_ventana(rate, w, df["peak_year"], share, float(np.nanmean(rate)), group=_grp)
    else:
        _prior = lambda rate, w: _prior_por_grupo_y_tiempo_de_juego(rate, w, group_key if PRIOR_CON_ROL else era_key, share, era_key)
    prior_h  = _prior(h_k  / ip_nz, ip_k)
    prior_so = _prior(so_k / ip_nz, ip_k)
    prior_bb = _prior(bb_k / ip_nz, ip_k)
    prior_hr = _prior(hr_k / ip_nz, ip_k)
    df["prior_k9"] = (prior_so * 9.0).round(2)

    df["h9_raw"]  = (h_k  + m_ip * prior_h)  / (ip_k + m_ip) * 9.0
    df["k9_raw"]  = (so_k + m_ip * prior_so) / (ip_k + m_ip) * 9.0
    df["bb9_raw"] = (bb_k     + m_ip * prior_bb) / (ip_k + m_ip) * 9.0
    df["hr9_raw"] = (hr_k     + m_ip * prior_hr) / (ip_k + m_ip) * 9.0

    print("  Prior de K/9 por Era y rol (media del grupo):")
    for g_, v_ in df.groupby(group_key)["prior_k9"].mean().items():
        print(f"    {g_:42s} {v_:5.2f}")

    # Entradas por año, con las temporadas de Ligas Negras llevadas a calendario completo (paso 7b).
    df["ip_per_year_raw"] = df["ip_per_year_eq"].fillna(df["ip_per_year"]).fillna(50.0)
    df["sta_raw"] = df["ip_per_year_raw"]

    # Atributo Clutch RAW: LOB% (Strand Rate) con Ancla m=150 corredores
    er_k  = df["peak_er"].fillna(0)
    hbp_k = df["peak_hbp"].fillna(0)

    denom_lob = h_k + bb_k + hbp_k - 1.4 * hr_k
    num_lob   = h_k + bb_k + hbp_k - er_k
    m_lob     = 150.0 * (m_ip / 250.0)     # misma proporcion que el ancla de entradas
    # Mismo esquema que las tasas: prior individual por Era, rol y tiempo de juego en vez de 0.720 global.
    denom_pos = denom_lob.where(denom_lob > 0)
    prior_lob = _prior(num_lob / denom_pos, denom_lob.clip(lower=0))
    df["prior_lob"] = prior_lob.round(4)
    print("  Prior de LOB% por Era y rol (media del grupo):")
    for g_, v_ in df.groupby(group_key)["prior_lob"].mean().items():
        print(f"    {g_:42s} {v_:.3f}")
    lob_smooth = ((num_lob + m_lob * prior_lob) / (denom_lob + m_lob)).clip(0.55, 0.90)
    # Sin bono de Leverage Index (decision del usuario). El dato solo existe para apariciones de
    # relevo: lo recibian los abridores antiguos que a veces relevaban (Whitey Ford 2.74, Clutch
    # 125) y los abridores modernos, que nunca relevan, quedaban en neutro (Cole 61). Dejarlo solo
    # para relevistas subia los relevistas Legendary de 14 a 18.
    df["clt_raw"] = lob_smooth * 100.0
    df["clu_raw"] = df["clt_raw"]

    print("  h9_raw, k9_raw, bb9_raw, hr9_raw, sta_raw, clt_raw calculados con suavizado Bayesiano")
    return df


# ── PASO 7b: Ambiente de las temporadas de cada pitcher ─────────────────────────
def paso_7b_ambiente_por_temporada(df, pico_df):
    """
    En vez de comparar a cada pitcher contra la media de su Era (grupos fijos, con saltos al
    cruzar un borde: el mismo pitcher valia 14 puntos menos por tener el pico un año despues),
    se lo compara contra el ambiente de las temporadas exactas de su pico.

    Ambiente de un año = tasas agregadas de todas las temporadas de pico del pool en ese año
    (ventana de +-2 años), ponderadas por entradas. Es UN solo ambiente para abridores y
    relevistas: al ponderar por entradas los relevistas casi no lo mueven, que era el problema
    de comparar contra la media de cartas de una Era (mas de la mitad de las cartas modernas son
    relevistas). El ambiente del pitcher es la media de esos años ponderada por sus entradas.
    b_ip es la carga de trabajo: entradas medias por temporada de pico de ese año.
    """
    print("\n  PASO 7b: Ambiente por temporada (H, K, BB, HR, LOB e IP de los años del pico)...")
    df = df.copy()
    s = pico_df[pico_df["playerID"].isin(set(df["playerID"]))].copy()
    s["ip"] = s["IPouts"] / 3.0
    for c in ("H", "SO", "BB", "HR_a", "ER", "HBP"):
        s[c] = s[c].fillna(0.0)
    s["lob_num"] = s["H"] + s["BB"] + s["HBP"] - s["ER"]
    s["lob_den"] = s["H"] + s["BB"] + s["HBP"] - 1.4 * s["HR_a"]
    s["n"] = 1.0
    t = suavizar_por_anio(s.groupby("yearID")[["ip", "H", "SO", "BB", "HR_a", "lob_num", "lob_den", "n"]].sum())
    ip_t = t["ip"].replace(0, np.nan)
    env = pd.DataFrame({
        "b_h": t["H"] / ip_t, "b_k": t["SO"] / ip_t, "b_bb": t["BB"] / ip_t, "b_hr": t["HR_a"] / ip_t,
        "b_lob": t["lob_num"] / t["lob_den"].replace(0, np.nan), "b_ip": t["ip"] / t["n"].replace(0, np.nan),
    })
    s = s.join(env, on="yearID")
    rate_cols = ["b_h", "b_k", "b_bb", "b_hr", "b_lob"]
    w = s["ip"].clip(lower=0.01)
    b = s[rate_cols].mul(w, axis=0).groupby(s["playerID"]).sum().div(w.groupby(s["playerID"]).sum(), axis=0)
    b["b_ip"] = s["b_ip"].groupby(s["playerID"]).mean()

    # Ponches de Ligas Negras contra su propia liga. En los mismos años sus pitchers ponchaban un
    # 40% mas que los de MLB (4.2-5.0 K/9 contra 2.9-3.7) pero permitian los mismos hits, boletos
    # y jonrones: el ponche alto era de la liga, no merito de cada pitcher. Contra el ambiente
    # mezclado (dominado por MLB) todos salian como ponchadores de elite (K/9 medio de 58 contra
    # 33 de MLB, y el doble de su cupo de Legendary). Solo cambia el K/9 de las cartas de Ligas
    # Negras; las de MLB siguen contra el ambiente comun.
    MIN_NLB_K_SEASONS = 15
    card_lg = df.drop_duplicates("playerID").set_index("playerID")["league_group"].fillna("MLB") if "league_group" in df.columns else pd.Series(dtype=object)
    s_nlb = s[s["playerID"].map(card_lg) == "NLB"]
    if len(s_nlb):
        tk = suavizar_por_anio(s_nlb.groupby("yearID")[["ip", "SO", "n"]].sum(), 3)
        k_nlb = (tk["SO"] / tk["ip"].replace(0, np.nan)).where(tk["n"] >= MIN_NLB_K_SEASONS).interpolate(limit_direction="both")
        wk = s_nlb["ip"].clip(lower=0.01)
        b_k_nlb = (s_nlb["yearID"].map(k_nlb) * wk).groupby(s_nlb["playerID"]).sum() / wk.groupby(s_nlb["playerID"]).sum()
        b.loc[b_k_nlb.dropna().index, "b_k"] = b_k_nlb.dropna()

    # Calendario de Ligas Negras (para Stamina). Sus temporadas documentadas eran mucho mas cortas
    # que las de MLB. En vez de un multiplicador fijo (x2, o x3.5 para pioneros) se estima año
    # por año: carga media de un abridor de MLB / carga media de un abridor de Ligas Negras en
    # ese año (3.9 en 1905, 2.0 en 1916-1920, 1.7 en 1928, 2.5 en los años 40). Las entradas de
    # cada temporada de Ligas Negras se llevan asi a su equivalente de calendario completo.
    MIN_NLB_SEASONS_PER_YEAR = 8
    nlb_s = s["is_nlb_y"].astype(bool) if "is_nlb_y" in s.columns else pd.Series(False, index=s.index)
    sp = s[s["is_sp_season"].astype(bool) & (s["ip"] >= 30)]
    sp_nlb = nlb_s.reindex(sp.index)
    cal = suavizar_por_anio(pd.DataFrame({
        "ip_m": sp[~sp_nlb].groupby("yearID")["ip"].sum(), "n_m": sp[~sp_nlb].groupby("yearID").size(),
        "ip_n": sp[sp_nlb].groupby("yearID")["ip"].sum(),  "n_n": sp[sp_nlb].groupby("yearID").size(),
    }).fillna(0.0))
    factor = ((cal["ip_m"] / cal["n_m"].replace(0, np.nan)) / (cal["ip_n"] / cal["n_n"].replace(0, np.nan)))
    factor = factor.where(cal["n_n"] >= MIN_NLB_SEASONS_PER_YEAR).interpolate(limit_direction="both")
    s["ip_eq"] = s["ip"] * np.where(nlb_s, s["yearID"].map(factor).fillna(1.0), 1.0)
    b["ip_per_year_eq"] = s["ip_eq"].groupby(s["playerID"]).mean()
    df = df.merge(b, left_on="playerID", right_index=True, how="left")
    for c in rate_cols + ["b_ip"]:
        df[c] = df[c].fillna(df[c].mean())
    df["ip_per_year_eq"] = df["ip_per_year_eq"].fillna(df["ip_per_year"])
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
    print("\n  PASO 10: Normalizando contra el ambiente de cada temporada (H/9, K/9, BB/9, HR/9, STA, CLT)...")
    df = df.copy()

    # Tasas: cada pitcher contra el ambiente de los años de su pico (paso 7b). TODOS los ratings
    # van al 75%, Stamina incluida (decision del usuario: la epoca tambien moldea el estilo del
    # jugador). Antes K/9 y HR/9 iban al 90% y la Stamina al 50%; se dejan las constantes por si
    # se quiere volver a separar.
    HR9_ERA_BLEND = 0.75
    K9_ERA_BLEND = 0.75
    df = normalizar_por_ambiente(df, "h9_raw",  "h9_val",  "b_h",   invert=True)
    df = normalizar_por_ambiente(df, "k9_raw",  "k9_val",  "b_k",   invert=False, blend=K9_ERA_BLEND)
    # BB/9 hasta 1888 (5 a 9 bolas para un boleto) se estima por posicion entre contemporaneos,
    # igual que el Ojo de los bateadores (decision del usuario; baja a los ases de 1880).
    df = normalizar_por_ambiente(df, "bb9_raw", "bb9_val", "b_bb",  invert=True, estimar_hasta=1888)
    df = normalizar_por_ambiente(df, "hr9_raw", "hr9_val", "b_hr",  invert=True, blend=HR9_ERA_BLEND)
    df = normalizar_por_ambiente(df, "clt_raw", "clt_val", "b_lob", invert=False)
    df["clu_val"] = df["clt_val"]

    # Stamina calibrada según IP anuales promedio reales (escala 1.0 a 125.0):
    def map_ip_to_sta(ip):
        if ip is None or pd.isna(ip): return 45.0
        val = float(ip)
        if val <= 50.0:
            return 1.0 + ((val - 23.0) / 27.0) * 24.0
        elif val <= 80.0:
            return 25.0 + ((val - 50.0) / 30.0) * 20.0
        elif val <= 130.0:
            return 45.0 + ((val - 80.0) / 50.0) * 20.0
        elif val <= 175.0:
            return 65.0 + ((val - 130.0) / 45.0) * 15.0
        elif val <= 225.0:
            return 80.0 + ((val - 175.0) / 50.0) * 15.0
        elif val <= 290.0:
            return 95.0 + ((val - 225.0) / 65.0) * 15.0
        else:
            return 110.0 + ((val - 290.0) / 100.0) * 15.0

    # Stamina: entradas por año ajustadas al 75%, como el resto, contra la carga de trabajo de
    # los años de su pico. Es un solo valor: el que muestra la carta y el que usa el juego.
    # Estuvo al 50% para que quien lanzo 400 entradas quedara claramente arriba del que lanzo
    # 220; al 75% la diferencia se acorta (Cy Young 111, Gerrit Cole 108).
    STA_ERA_BLEND = 0.75
    sta_ip = ajustar_por_ambiente(df["ip_per_year_raw"], df["b_ip"], STA_ERA_BLEND)
    df["sta_val"] = sta_ip.apply(map_ip_to_sta).round(1).clip(RATING_FLOOR, RATING_CEIL)

    # Suavizado Bayesiano Suave (m=1) para muestras cortas de temporadas en el pico (n < 7)
    n_peak = df["total_seasons_in_peak"].fillna(7).clip(lower=1, upper=7)
    weight_seasons = np.minimum(1.0, (n_peak / (n_peak + 1.0)) * (8.0 / 7.0))
    # Se regresa hacia la media de las cartas con pico cercano (+-8 años), no hacia la de una Era fija.
    for col in ["h9_val", "k9_val", "bb9_val", "hr9_val", "clt_val", "sta_val"]:
        group_mean = media_deslizante(df[col], df["peak_year"])
        df[col] = (weight_seasons * df[col] + (1.0 - weight_seasons) * group_mean).round(1)

    df["clu_val"] = df["clt_val"]

    print("  h9_val, k9_val, bb9_val, hr9_val, sta_val, clt_val normalizados por Era (MLB The Show Suite)")
    return df


# ── PASO 11: OVR y Rareza (24% H/9, 32% STA, 12% K/9, 12% BB/9, 10% HR/9, 10% CLT) ──
# (Antes 28 / 28. Decision del usuario tras comparar contra el WAR: el H/9 es el rating que
# menos explica el WAR -6%- y la Stamina el que mas -44%-; con 28/28 habia 13 relevistas
# Legendary, 10 de ellos fuera del top 300 por WAR.)
# Dos ratings fuertes y cuatro chicos, como en bateadores (28% CON, 28% PWR). H/9 y Stamina son
# los dos que mas acompañan al rendimiento real, y la Stamina es lo que separa a un as de un
# cerrador. Con los pesos planos de antes (20/20/20/15/15/10) el K/9 valia tanto como el H/9:
# entraban a Legendary pitchers de mucho ponche y poco resultado (Toad Ramsey, ERA+ 123) y
# relevistas de muestra chica (Booker McDaniel, 385 IP), y quedaban fuera Palmer y Spahn.
def paso_11_ovr_rareza(df):
    print("\n  PASO 11: OVR y Rareza (24% H/9, 32% STA, 12% K/9, 12% BB/9, 10% HR/9, 10% CLT)...")
    df = df.copy()

    df["raw_ovr"] = (
        df["h9_val"]  * 0.24 +
        df["sta_val"] * 0.32 +
        df["k9_val"]  * 0.12 +
        df["bb9_val"] * 0.12 +
        df["hr9_val"] * 0.10 +
        df["clt_val"] * 0.10
    )

    p35  = float(df["raw_ovr"].quantile(0.35))
    p65  = float(df["raw_ovr"].quantile(0.65))
    p85  = float(df["raw_ovr"].quantile(0.85))
    p975 = float(df["raw_ovr"].quantile(0.975))

    def map_to_cosmetic_ovr_p(r):
        if r is None or pd.isna(r):
            return 50.0
        val = float(r)
        if val <= p35:
            res = 50.0 + ((val - 15.0) / max(0.1, (p35 - 15.0))) * 9.9
        elif val <= p65:
            res = 60.0 + ((val - p35) / max(0.1, (p65 - p35))) * 9.9
        elif val <= p85:
            res = 70.0 + ((val - p65) / max(0.1, (p85 - p65))) * 9.9
        elif val <= p975:
            res = 80.0 + ((val - p85) / max(0.1, (p975 - p85))) * 9.9
        else:
            res = 90.0 + min(9.9, ((val - p975) / 25.0) * 9.9)
        return round(res, 1)

    df["ovr"]    = df["raw_ovr"].apply(map_to_cosmetic_ovr_p).clip(50.0, 99.9).round(1)
    df["rarity"] = df["ovr"].apply(asignar_rareza)

    for col, gcol in [
        ("h9_val", "h9_grade"), ("k9_val", "k9_grade"),
        ("bb9_val", "bb9_grade"), ("hr9_val", "hr9_grade"),
        ("sta_val", "sta_grade"), ("clt_val", "clt_grade"),
    ]:
        df[gcol] = df[col].apply(to_grade)
    df["clu_grade"] = df["clt_grade"]

    print(f"  OVR calculado. Media: {df['ovr'].mean():.1f}")
    print(f"  Distribucion por rareza:\n{df['rarity'].value_counts().to_string()}")
    return df



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


# ── PASO 12: Equipo canónico y exportar ──────────────────────────────────────
def paso_12_exportar(df, pitching, teams, franchises, pico_df=None, war_pitch=None, people=None):
    """
    Asigna equipo canonico usando la Formula Hibrida 80/20 de WAR:
    Franchise_Score = 0.80 * WAR_Peak7 + 0.20 * WAR_Career
    """
    print("\n  PASO 12: Equipo canonico (Hibrido 80% WAR Pico 7 + 20% WAR Carrera) y exportacion...")

    team_to_franch = {}
    if not teams.empty and "teamID" in teams.columns and "franchID" in teams.columns:
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

    if war_pitch is not None and not war_pitch.empty and people is not None and not people.empty:
        war = war_pitch.copy()
        war["WAR"] = pd.to_numeric(war["WAR"].replace("NULL", 0), errors="coerce").fillna(0)
        id_map = people[["playerID", "bbrefID"]].dropna(subset=["bbrefID"])
        war_merged = war.merge(id_map, left_on="player_ID", right_on="bbrefID", how="inner")
        war_merged["franch_clean"] = war_merged.apply(lambda r: get_franch(r["team_ID"], r.get("lg_ID", "")), axis=1)
        
        # WAR en carrera por franquicia
        career_franch_war = war_merged.groupby(["playerID", "franch_clean"])["WAR"].sum().reset_index(name="career_war_f")
        
        # WAR en pico 7 por franquicia
        if pico_df is not None and not pico_df.empty:
            # Handle dual pitchers
            pico_clean = pico_df.copy()
            pico_clean["orig_playerID"] = pico_clean["playerID"].str.replace("_sp", "").str.replace("_rp", "")
            peak_years = pico_clean[["orig_playerID", "yearID", "playerID"]].drop_duplicates()
            peak_war_df = war_merged.merge(peak_years, left_on=["playerID", "year_ID"], right_on=["orig_playerID", "yearID"], how="inner")
            peak_franch_war = peak_war_df.groupby(["playerID_y", "franch_clean"])["WAR"].sum().reset_index(name="peak_war_f").rename(columns={"playerID_y": "playerID"})
        else:
            peak_franch_war = career_franch_war.rename(columns={"career_war_f": "peak_war_f"})
            
        # Para dual pitchers en career
        dual_careers = []
        for orig_id, (sp_id, rp_id) in [("eckerde01", ("eckerde01_sp", "eckerde01_rp")), ("smoltjo01", ("smoltjo01_sp", "smoltjo01_rp"))]:
            c_orig = career_franch_war[career_franch_war["playerID"] == orig_id].copy()
            if not c_orig.empty:
                c_sp = c_orig.copy(); c_sp["playerID"] = sp_id
                c_rp = c_orig.copy(); c_rp["playerID"] = rp_id
                dual_careers.extend([c_sp, c_rp])
        if dual_careers:
            career_franch_war = pd.concat([career_franch_war] + dual_careers, ignore_index=True)

        merged_franch = career_franch_war.merge(peak_franch_war, on=["playerID", "franch_clean"], how="outer").fillna(0.0)
        merged_franch["franch_score"] = 0.80 * merged_franch["peak_war_f"] + 0.20 * merged_franch["career_war_f"]
        
        canonical = (
            merged_franch.sort_values("franch_score", ascending=False)
                         .drop_duplicates(subset="playerID")
                         .rename(columns={"franch_clean": "canonical_teamID"})
        )
        df = df.merge(canonical[["playerID", "canonical_teamID"]], on="playerID", how="left")
    elif pico_df is not None and not pico_df.empty and not pitching.empty:
        peak_seasons_teams = pico_df.merge(pitching[["playerID", "yearID", "teamID", "lgID"]].drop_duplicates(), on=["playerID", "yearID"], how="left")
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

    # Fallback para jugadores sin registros en war_daily_pitch (p.ej. leyendas de Negro Leagues)
    missing_mask = df["canonical_teamID"].isna() | df["canonical_teamID"].isin(["", "nan", "UNK", "None"])
    if missing_mask.any() and pico_df is not None and not pico_df.empty and not pitching.empty:
        pico_clean = pico_df.copy()
        pico_clean["orig_playerID"] = pico_clean["playerID"].str.replace("_sp", "").str.replace("_rp", "")
        pico_teams = pico_clean.merge(pitching[["playerID", "yearID", "teamID", "lgID"]].drop_duplicates(), left_on=["orig_playerID", "yearID"], right_on=["playerID", "yearID"], how="left")
        pico_teams["franch_clean"] = pico_teams.apply(lambda r: get_franch(r["teamID"], r.get("lgID", "")), axis=1)
        team_counts = pico_teams.groupby(["playerID_x", "franch_clean"])["yearID"].count().reset_index()
        team_counts = team_counts.sort_values("yearID", ascending=False).drop_duplicates(subset="playerID_x")
        fallback_map = team_counts.set_index("playerID_x")["franch_clean"].to_dict()
        df.loc[missing_mask, "canonical_teamID"] = df.loc[missing_mask, "playerID"].map(fallback_map).fillna("UNK")

    df["canonical_teamID"] = df.apply(map_to_canonical_team, axis=1)
    df["franchise_name"]   = df["canonical_teamID"]

    keep_cols = [
        "playerID", "bbrefID", "full_name", "era_label",
        "peak_year", "peak_year_display", "debut_year", "last_year",
        "canonical_teamID", "franchise_name", "role",
        "career_g", "career_gs", "career_sv", "career_ip", "career_w", "career_l",
        "career_so", "career_bb", "career_hr",
        "peak_war", "peak_h9", "peak_k9", "peak_bb9", "peak_hr9", "peak_era", "peak_era_plus",
        "peak_ip_per_gs",
        "h9_val", "k9_val", "bb9_val", "hr9_val", "sta_val", "clt_val", "clu_val",
        "h9_grade", "k9_grade", "bb9_grade", "hr9_grade", "sta_grade", "clt_grade", "clu_grade",
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
        f"// Total: {len(final):,} cartas de pitchers  |  Peak 7 temporadas por WAR  |  MLB The Show Suite",
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
            f'sta: {int(r["sta_val"])}, clt: {int(r["clt_val"])}, clu: {int(r["clt_val"])}, '
            f'h9_grade: "{r["h9_grade"]}", k9_grade: "{r["k9_grade"]}", '
            f'bb9_grade: "{r["bb9_grade"]}", hr9_grade: "{r["hr9_grade"]}", '
            f'sta_grade: "{r["sta_grade"]}", clt_grade: "{r["clt_grade"]}", clu_grade: "{r["clt_grade"]}", '
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
            f'career_sv: {int(r.get("career_sv", 0))}, '
            f'playerID: "{str(r.get("playerID", "")).replace(chr(34), "")}", '
            f'bbrefID: "{str(r.get("bbrefID", "nan") if pd.notna(r.get("bbrefID")) else "").replace(chr(34), "")}" '
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
    print("  REPORTE FINAL - BaseRogue Pitchers Pool v1.0 (MLB The Show Suite)")
    print("=" * 64)
    print(f"\n  Total de cartas: {len(df):,}")
    print(f"\n  Distribucion por Rareza:\n{df['rarity'].value_counts().to_string()}")
    print(f"\n  Distribucion por Era:\n{df['era'].value_counts().sort_index().to_string()}")
    print(f"\n  Distribucion por Rol:\n{df['role'].value_counts().to_string()}")
    print("\n  Atributos promedio MLB The Show Suite (escala 1-125):")
    for col, label in [
        ("h9_val", "H/9"), ("k9_val", "K/9"), ("bb9_val", "BB/9"),
        ("hr9_val", "HR/9"), ("sta_val", "STA"), ("clt_val", "CLT"), ("ovr", "OVR"),
    ]:
        if col in df.columns:
            print(f"    {label:<5}: {df[col].mean():5.1f}  (min:{df[col].min():4.1f} max:{df[col].max():4.1f})")

    print("\n  TOP 20 pitchers (por OVR):")
    top = df.nlargest(20, "ovr")[[
        "name", "role", "era", "peak_year_display", "rarity", "ovr",
        "h9_val", "k9_val", "bb9_val", "hr9_val", "sta_val", "clt_val",
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

    def calcular_ratings(n_peak):
        """Pasos 4 a 10 con un pico de n_peak temporadas."""
        global PEAK_SEASONS
        PEAK_SEASONS = n_peak
        peak, pico = paso_4_pico_pitching(pitching, war_pitch, people)
        el = paso_5_filtro_ingesta(career, peak, allstar, hof, pure_pitchers, pitching)
        el = paso_6_enriquecer_people(el, people)
        el = paso_7_asignar_era(el, war_pit=war_pitch, people=people, pitching=pitching)
        el = paso_7b_ambiente_por_temporada(el, pico)
        el = paso_8_atributos_raw(el)
        el = paso_9_fielding_pitchers(el, war_pitch, people)
        el = paso_10_normalizar_por_era(el)
        PEAK_SEASONS = 7
        return el, pico

    eligible12, pico_12 = calcular_ratings(LONGEVITY_SEASONS)
    eligible, pico_df   = calcular_ratings(7)
    eligible      = paso_10b_longevidad(eligible, eligible12, pico_12)
    eligible      = paso_10c_extremos(eligible)
    eligible      = paso_11_ovr_rareza(eligible)
    final         = paso_12_exportar(eligible, pitching, teams, franchises, pico_df, war_pitch, people)

    reporte_final(final)
    return final


if __name__ == "__main__":
    result_df = main()
