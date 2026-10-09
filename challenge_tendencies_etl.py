"""
Tendencias ocultas para el 162-0 Challenge  ->  challenge_tendencies.js

Los ratings de la carta dicen CUANTO poder, velocidad o ponche tiene un jugador frente a su
epoca; no dicen en que lo usaba. Por eso en el 162-0 Ty Cobb pegaba 31 jonrones (reales 6: su
poder eran dobles y triples), Willie Mays robaba mas que en la vida real y Rickey Henderson
menos, y Christy Mathewson ponchaba 8.6 por 9 (reales 5.6).

Este script calcula, por jugador, cuanto se aparta su numero REAL de lo que el motor espera
para su rating, y lo guarda como un multiplicador:

  bateadores  [hr, sb, k]  hr = jonrones reales / los que el motor da a su Poder
                           sb = robos reales    / los que el motor da a su Velocidad
                           k  = ponches reales  / los que el motor da a su K-AVD
  pitchers    k          k  = K/9 real        / el que el motor da a su rating de K/9

Solo lo lee challenge162.js. No cambia ratings, OVR ni rareza, no se muestra en ninguna carta
y no lo usan Quick Play ni el Modo Historia.

Uso:  python challenge_tendencies_etl.py     (volver a correr si cambian las cartas o las
                                              tablas BAT_HR / PIT_K9 de challenge162.js)
"""
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(__file__).parent
DATA = BASE / "lahman_1871-2025"
OUT = BASE / "challenge_tendencies.js"

RT_X = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 115, 125]
# Robos por 600 PA que corresponden a cada nivel de Velocidad (media real de las cartas)
SB_BY_SPEED = [1.1, 3.2, 7.0, 12.0, 15.8, 20.5, 25.5, 28.1, 33.9, 37.0, 48.7, 60.0]
SB_ENGINE_K, SB_ON_FIRST_REF = 0.692, 0.24   # nivel real del motor frente a esa tabla
ANCHOR_PA = 300.0          # muestra chica: se acerca a 1 (sin tendencia)
HR_RANGE, SB_RANGE, K_RANGE = (0.15, 1.60), (0.25, 3.00), (0.45, 1.60)
BAT_K_RANGE = (0.40, 1.80)


def engine_table(name):
    src = (BASE / "challenge162.js").read_text(encoding="utf-8")
    m = re.search(r"const %s = \[([^\]]*)\]" % name, src)
    return [float(x) for x in m.group(1).split(",")]


def at(table, v):
    return np.interp(v, RT_X, table)


def main():
    bat_hr, pit_k9, bat_k = engine_table("BAT_HR"), engine_table("PIT_K9"), engine_table("BAT_K")
    bat_avg, bat_bb, bat_2b, bat_3b = engine_table("BAT_AVG"), engine_table("BAT_BB"), engine_table("BAT_2B"), engine_table("BAT_3B")

    cards = pd.read_csv(BASE / "game_cards.csv", low_memory=False)
    b = pd.read_csv(DATA / "Batting.csv", low_memory=False).fillna(0)
    b["PA"] = b["AB"] + b["BB"] + b["HBP"] + b["SF"] + b["SH"]
    b["TB"] = b["H"] + b["2B"] + 2 * b["3B"] + 3 * b["HR"]
    y = b.groupby(["playerID", "yearID"])[["PA", "HR", "SB", "TB", "BB", "SO"]].sum().reset_index()
    y["score"] = y["TB"] + y["BB"] + 0.3 * y["SB"]
    # Ponches: solo cuentan las temporadas donde se anotaron (hay epocas y ligas sin el dato)
    y["PA_K"] = np.where(y["SO"] > 0, y["PA"], 0.0)
    # Peak = the 7 best seasons by WAR, as on the cards (the offensive score is only the fallback
    # where there is no WAR). With the score alone Lou Brock's steals came out a quarter short.
    war = pd.read_csv(DATA / "war_daily_bat.txt", low_memory=False, na_values=["NULL"])
    war = war.groupby(["player_ID", "year_ID"])["WAR"].sum().reset_index()
    ids = cards[["playerID", "bbrefID"]].drop_duplicates("playerID")
    y = y.merge(ids, on="playerID", how="left").merge(war, left_on=["bbrefID", "yearID"], right_on=["player_ID", "year_ID"], how="left")
    y = y[y["PA"] >= 150]
    y["rank"] = y["WAR"].fillna(-99) * 1000 + y["score"]
    peak = y.sort_values("rank", ascending=False).groupby("playerID").head(7).groupby("playerID")[["PA", "HR", "SB", "SO", "PA_K"]].sum()
    c = cards.merge(peak, left_on="playerID", right_index=True, how="left").fillna({"PA": 0, "HR": 0, "SB": 0, "SO": 0, "PA_K": 0})

    exp_hr = at(bat_hr, c["power_val"])                      # jonrones por PA que da el motor
    # Robos por PA que da el motor: dependen de la Velocidad y de cuantas veces llega a primera
    # (sencillos y boletos). Ajustado contra 144 temporadas de 72 estrellas: sin la parte de
    # embasarse, a Brock y a Wills (velocidad 125, OBP bajo) el motor les daba 37 y 41 robos.
    bb_r = at(bat_bb, c["eye_val"]) * 1.04
    hit_r = (1 - bb_r) * at(bat_avg, c["contact_val"]) * 0.95
    reg_r = hit_r - exp_hr * 1.03
    on_first = bb_r + reg_r * (1 - at(bat_2b, c["power_val"]) - at(bat_3b, c["speed_val"]) * 0.68)
    exp_sb = SB_ENGINE_K * at(SB_BY_SPEED, c["speed_val"]) / 600.0 * (on_first / SB_ON_FIRST_REF)
    hr = ((c["HR"] + ANCHOR_PA * exp_hr) / (c["PA"] + ANCHOR_PA)) / exp_hr
    sb = ((c["SB"] + ANCHOR_PA * exp_sb) / (c["PA"] + ANCHOR_PA)) / exp_sb
    exp_k = at(bat_k, c["k_avoid_val"])                     # ponches por PA que da el motor
    k = ((c["SO"] + ANCHOR_PA * exp_k) / (c["PA_K"] + ANCHOR_PA)) / exp_k
    c["k_t"] = k.clip(*BAT_K_RANGE).round(2)
    c["hr_t"] = hr.clip(*HR_RANGE).round(2)
    c["sb_t"] = sb.clip(*SB_RANGE).round(2)

    p = pd.read_csv(BASE / "pitchers_pool.csv", low_memory=False)
    p["k_t"] = (p["peak_k9"] / at(pit_k9, p["k9_val"])).clip(*K_RANGE).round(2)

    out = {
        "bat": {r.playerID: [r.hr_t, r.sb_t, r.k_t] for r in c.itertuples()},
        "pit": {r.playerID: r.k_t for r in p.itertuples() if r.k_t != 1},
    }
    text = ("// AUTO-GENERADO por challenge_tendencies_etl.py - NO EDITAR MANUALMENTE\n"
            "// Tendencias ocultas del 162-0: [jonrones, robos, ponches] por bateador y ponches por pitcher,\n"
            "// como multiplicador de lo que el motor da a su rating. Solo las lee challenge162.js.\n"
            "window.ChallengeTendencies = " + json.dumps(out, separators=(",", ":")) + ";\n")
    OUT.write_text(text, encoding="utf-8")
    print(f"{len(out['bat'])} bateadores, {len(out['pit'])} pitchers -> {OUT.name} ({len(text) / 1024:.0f} KB)")
    print("medias: hr %.2f  sb %.2f  k bateo %.2f  k pitcheo %.2f" % (c["hr_t"].mean(), c["sb_t"].mean(), c["k_t"].mean(), p["k_t"].mean()))
    show = c.set_index("name")
    for n in ["Ty Cobb", "Honus Wagner", "Babe Ruth", "Barry Bonds", "Rickey Henderson", "Lou Brock", "Maury Wills", "Vince Coleman", "Tim Raines", "Willie Mays", "Mark McGwire", "Aaron Judge"]:
        if n in show.index:
            r = show.loc[n]
            r = r.iloc[0] if isinstance(r, pd.DataFrame) else r
            print("  %-17s poder %3.0f hr x%.2f | velocidad %3.0f sb x%.2f | k-avd %3.0f k x%.2f" % (n, r.power_val, r.hr_t, r.speed_val, r.sb_t, r.k_avoid_val, r.k_t))
    showp = p.set_index("name")
    for n in ["Christy Mathewson", "Amos Rusie", "Walter Johnson", "Kid Nichols", "Mark Buehrle", "Jamie Moyer", "Barry Zito", "Pedro Martinez", "Craig Kimbrel", "Nolan Ryan"]:
        if n in showp.index:
            r = showp.loc[n]
            r = r.iloc[0] if isinstance(r, pd.DataFrame) else r
            print("  %-17s K/9 rating %3.0f real %.1f  x%.2f" % (n, r.k9_val, r.peak_k9, r.k_t))


if __name__ == "__main__":
    main()
