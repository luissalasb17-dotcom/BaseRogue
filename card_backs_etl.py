"""
card_backs_etl.py - datos del reverso de las cartas (card_backs.js).

Para cada carta:
  - Ficha: estatura, peso, fecha y lugar de nacimiento (People.csv).
  - Bateadores: UNA linea promedio de 162 juegos sacada de sus picos, cada parte de su propio pico,
    igual que los ratings: bateo de las 7 mejores temporadas por WAR ofensivo, robos de las 7
    mejores por Rbaser y fildeo (carreras de defensa) de las 7 mejores por WAR defensivo.
  - Pitchers: la temporada promedio de su pico de 7 (por WAR).

Reutiliza los pasos de seleccion de pico de lahman_etl_v5.py y pitchers_etl.py, asi que los anos
son exactamente los que usa la carta. Volver a correrlo si cambian las cartas o esas reglas.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

import lahman_etl_v5 as L
import pitchers_etl as P

HERE = Path(__file__).parent
OUT = HERE / "card_backs.js"


def bio_table(people):
    p = people.set_index("playerID")
    out = {}
    for pid, r in p.iterrows():
        def num(v):
            try:
                v = float(v)
                return None if np.isnan(v) else int(v)
            except (TypeError, ValueError):
                return None
        place = ", ".join(str(x) for x in [r.get("birthCity"), r.get("birthState") if r.get("birthCountry") == "USA" else r.get("birthCountry")]
                          if isinstance(x, str) and x)
        y, m, d = num(r.get("birthYear")), num(r.get("birthMonth")), num(r.get("birthDay"))
        born = f"{m}/{d}/{y}" if (y and m and d) else (str(y) if y else "")
        out[pid] = [num(r.get("height")), num(r.get("weight")), born, place]
    return out


def batters(dfs):
    batting, war_bat, people = dfs["batting"], dfs["war_bat"], dfs["people"]
    peak, pico_off, _ = L.paso_4_pico_batting(batting, war_bat, people)

    # offence: Batting rows of the offensive-peak seasons
    b = batting.copy()
    cols = ["G", "AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "SO", "HBP", "SF"]
    for c in cols:
        b[c] = pd.to_numeric(b[c], errors="coerce").fillna(0)
    by = b.groupby(["playerID", "yearID"])[cols].sum().reset_index()
    yrs = pico_off[["playerID", "yearID"]].drop_duplicates()
    off = by.merge(yrs, on=["playerID", "yearID"]).groupby("playerID")[cols].sum()
    off["n"] = yrs.groupby("playerID").size()
    off["y0"] = yrs.groupby("playerID")["yearID"].min()
    off["y1"] = yrs.groupby("playerID")["yearID"].max()
    off["war"] = pico_off.groupby("playerID")["war_total"].sum()

    # OPS+: league OBP / SLG of each peak season (Teams.csv, by league; whole year if the league is missing),
    # weighted by the player's PA that season. No park factor.
    t = dfs["teams"].copy()
    tc = ["AB", "H", "2B", "3B", "HR", "BB", "HBP", "SF"]
    for c in tc:
        t[c] = pd.to_numeric(t[c], errors="coerce").fillna(0)
    def lg_line(g):
        pa = g["AB"] + g["BB"] + g["HBP"] + g["SF"]
        return pd.Series({"lobp": (g["H"] + g["BB"] + g["HBP"]) / pa if pa else np.nan,
                          "lslg": (g["H"] + g["2B"] + 2 * g["3B"] + 3 * g["HR"]) / g["AB"] if g["AB"] else np.nan})
    by_lg = t.groupby(["yearID", "lgID"])[tc].sum().reset_index()
    by_lg = by_lg.join(by_lg.apply(lg_line, axis=1))
    by_yr = t.groupby("yearID")[tc].sum().reset_index()
    by_yr = by_yr.join(by_yr.apply(lg_line, axis=1))
    lg_of = b.sort_values("AB", ascending=False).drop_duplicates(["playerID", "yearID"])[["playerID", "yearID", "lgID"]]
    ps = pico_off[["playerID", "yearID", "PA_y"]].merge(lg_of, on=["playerID", "yearID"], how="left")
    ps = ps.merge(by_lg[["yearID", "lgID", "lobp", "lslg"]], on=["yearID", "lgID"], how="left")
    ps = ps.merge(by_yr[["yearID", "lobp", "lslg"]].rename(columns={"lobp": "yobp", "lslg": "yslg"}), on="yearID", how="left")
    ps["lobp"] = ps["lobp"].fillna(ps["yobp"]); ps["lslg"] = ps["lslg"].fillna(ps["yslg"])
    ps["w"] = pd.to_numeric(ps["PA_y"], errors="coerce").fillna(0)
    ps["wo"] = ps["w"] * ps["lobp"]; ps["ws"] = ps["w"] * ps["lslg"]
    lgp = ps.groupby("playerID")[["w", "wo", "ws"]].sum()
    off["lobp"] = lgp["wo"] / lgp["w"].replace(0, np.nan)
    off["lslg"] = lgp["ws"] / lgp["w"].replace(0, np.nan)

    # legs: stolen-base rate per AB from the baserunning peak, applied to the offence line
    legs = peak.set_index("playerID")
    spd_sb = legs["spd_sb"] if "spd_sb" in legs else legs["peak_sb"]
    spd_cs = legs["spd_cs"] if "spd_cs" in legs else legs["peak_cs_adj"]
    spd_ab = (legs["spd_ab"] if "spd_ab" in legs else legs["peak_ab"]).replace(0, np.nan)

    # glove: fielding runs per game in the defensive peak (same selection as paso_11)
    w = war_bat.copy()
    for c in ["runs_defense", "WAR_def", "G"]:
        w[c] = pd.to_numeric(w[c].replace("NULL", np.nan), errors="coerce").fillna(0)
    wy = w.groupby(["player_ID", "year_ID"])[["runs_defense", "WAR_def", "G"]].sum().reset_index()

    def def_peak(g):
        q = g[g["G"] >= 81]
        if len(q) < L.PEAK_SEASONS:
            q = g.sort_values("G", ascending=False).head(L.PEAK_SEASONS)
        return q.sort_values("WAR_def", ascending=False).head(L.PEAK_SEASONS)

    dp = wy.groupby("player_ID", group_keys=True).apply(def_peak).reset_index(level=0)
    glove = dp.groupby("player_ID").agg(rf=("runs_defense", "sum"), g=("G", "sum"))
    id_map = people.set_index("playerID")["bbrefID"]

    cards = pd.read_csv(HERE / "game_cards.csv", usecols=["playerID"])
    res = {}
    for pid in cards["playerID"]:
        if pid not in off.index:
            continue
        o = off.loc[pid]
        if o["G"] <= 0 or o["AB"] <= 0:
            continue
        k = 162.0 / o["G"]
        ab = o["AB"]
        sb_rate = (spd_sb.get(pid, 0) / spd_ab.get(pid)) if pd.notna(spd_ab.get(pid, np.nan)) else 0
        cs_rate = (spd_cs.get(pid, 0) / spd_ab.get(pid)) if pd.notna(spd_ab.get(pid, np.nan)) else 0
        pa = ab + o["BB"] + o["HBP"] + o["SF"]
        avg = o["H"] / ab
        obp = (o["H"] + o["BB"] + o["HBP"]) / pa if pa else 0
        slg = (o["H"] + o["2B"] + 2 * o["3B"] + 3 * o["HR"]) / ab
        fld = None
        bb = id_map.get(pid)
        if isinstance(bb, str) and bb in glove.index and glove.loc[bb, "g"] > 0:
            fld = round(float(glove.loc[bb, "rf"] / glove.loc[bb, "g"] * 162), 0)
        res[pid] = [
            int(o["y0"]), int(o["y1"]), int(o["n"]),
            round(ab * k), round(o["R"] * k), round(o["H"] * k), round(o["2B"] * k), round(o["3B"] * k),
            round(o["HR"] * k), round(o["RBI"] * k), round(sb_rate * ab * k), round(cs_rate * ab * k),
            round(o["BB"] * k), (round(o["SO"] * k) if o["SO"] >= 0.02 * pa else None),   # sin dato de ponches: None
            round(avg, 3), round(obp, 3), round(slg, 3), None if fld is None else int(fld),
            (round(100 * (obp / o["lobp"] + slg / o["lslg"] - 1)) if pd.notna(o["lobp"]) and o["lobp"] > 0 else None),
            (round(float(o["war"]) * k, 1) if pd.notna(o["war"]) else None),
        ]
    return res


def pitchers(dfs):
    _, pico = P.paso_4_pico_pitching(dfs["pitching"], dfs["war_pitch"], dfs["people"])
    cols = ["W", "L", "G", "GS", "SV", "IPouts", "H", "ER", "HR_a", "BB", "SO"]
    agg = pico.groupby("playerID")[cols].sum()
    agg["n"] = pico.groupby("playerID").size()
    agg["y0"] = pico.groupby("playerID")["yearID"].min()
    agg["y1"] = pico.groupby("playerID")["yearID"].max()
    agg["war"] = pico.groupby("playerID")["war_season"].sum()
    # ERA+: league ERA of each season (ERA x ERA+ / 100) weighted by innings; ERA+ = 100 x lgERA / ERA
    q = pico.copy()
    q["lgera"] = pd.to_numeric(q["era_y"], errors="coerce") * pd.to_numeric(q["era_plus_y"], errors="coerce") / 100
    q["ok"] = q["lgera"].notna() & (q["lgera"] > 0)
    q["wl"] = np.where(q["ok"], q["IPouts"] / 3.0 * q["lgera"], 0)
    q["er_ok"] = np.where(q["ok"], q["ER"], 0)
    lg = q.groupby("playerID")[["wl", "er_ok"]].sum()
    cards = pd.read_csv(HERE / "pitchers_pool.csv", usecols=["playerID"])
    res = {}
    for pid in cards["playerID"]:
        if pid not in agg.index:
            continue
        a = agg.loc[pid]
        n = max(1, int(a["n"]))
        ip = a["IPouts"] / 3.0
        if ip <= 0:
            continue
        era = a["ER"] * 9 / ip
        whip = (a["H"] + a["BB"]) / ip
        per = lambda v: round(v / n)
        ip_s = a["IPouts"] / n / 3.0
        res[pid] = [
            int(a["y0"]), int(a["y1"]), n,
            per(a["W"]), per(a["L"]), round(era, 2), per(a["G"]), per(a["GS"]), per(a["SV"]),
            round(ip_s, 1), per(a["H"]), per(a["HR_a"]), per(a["BB"]), per(a["SO"]), round(whip, 2),
            (round(100 * lg.loc[pid, "wl"] / (9 * lg.loc[pid, "er_ok"] / 1.0)) if pid in lg.index and lg.loc[pid, "er_ok"] > 0 and lg.loc[pid, "wl"] > 0 else None),
            (round(float(a["war"]) / n, 1) if pd.notna(a["war"]) else None),
        ]
    return res


def main():
    dfs_b = L.paso_1_cargar_datos()
    dfs_p = P.paso_1_cargar_datos()
    bio = bio_table(dfs_b["people"])
    bat = batters(dfs_b)
    pit = pitchers(dfs_p)
    ids = set(bat) | {p.split("_")[0] for p in pit}
    bio = {k: v for k, v in bio.items() if k in ids}
    js = ("// AUTO-GENERADO por card_backs_etl.py - NO EDITAR\n"
          "// bat: [y0,y1,n, AB,R,H,2B,3B,HR,RBI,SB,CS,BB,SO, AVG,OBP,SLG, FLD, OPS+, WAR por 162]  (promedio de 162 juegos de sus picos)\n"
          "// pit: [y0,y1,n, W,L,ERA,G,GS,SV,IP,H,HR,BB,SO,WHIP, ERA+, WAR por temporada]  (temporada promedio de su pico)\n"
          "// bio: [estatura en pulgadas, peso en libras, nacimiento, lugar]\n"
          "window.CardBacks = " + json.dumps({"bat": bat, "pit": pit, "bio": bio}, separators=(",", ":"), ensure_ascii=False) + ";\n")
    OUT.write_text(js, encoding="utf-8")
    print(f"card_backs.js: {len(bat)} bateadores, {len(pit)} pitchers, {len(bio)} fichas, {OUT.stat().st_size/1e6:.2f} MB")


if __name__ == "__main__":
    main()
