"""
Contexto de cada temporada para el selector del Modo Historia  ->  season_context.js

Por cada año 1901-2025 (ligas AL y NL): campeón de la Serie Mundial (o los dos campeones de
liga si no hubo Serie), mejor récord, cantidad de equipos y los líderes de jonrones, promedio,
victorias, ponches y efectividad. Sale de los CSV de Lahman; no toca cartas ni rivales.

Uso:  python season_context_etl.py
"""
import json
from pathlib import Path

import pandas as pd

BASE = Path(__file__).parent
DATA = BASE / "lahman_1871-2025"
OUT = BASE / "season_context.js"


def main():
    teams = pd.read_csv(DATA / "Teams.csv", low_memory=False)
    bat = pd.read_csv(DATA / "Batting.csv", low_memory=False).fillna(0)
    pit = pd.read_csv(DATA / "Pitching.csv", low_memory=False).fillna(0)
    people = pd.read_csv(DATA / "People.csv", low_memory=False)
    name = (people["nameFirst"].fillna("") + " " + people["nameLast"].fillna("")).str.strip()
    name_of = dict(zip(people["playerID"], name))

    teams = teams[teams["lgID"].isin(["AL", "NL"]) & teams["yearID"].between(1901, 2025)]
    bat = bat[bat["lgID"].isin(["AL", "NL"])]
    pit = pit[pit["lgID"].isin(["AL", "NL"])]
    bat["PA"] = bat["AB"] + bat["BB"] + bat["HBP"] + bat["SF"] + bat["SH"]

    out = {}
    for year, t in teams.groupby("yearID"):
        t = t.copy()
        rec = lambda r: {"name": str(r["name"]), "w": int(r["W"]), "l": int(r["L"])}
        entry = {"teams": int(len(t)), "games": int(t["G"].max())}
        ws = t[t["WSWin"] == "Y"]
        if len(ws):
            entry["champion"] = rec(ws.iloc[0])
            loser = t[(t["LgWin"] == "Y") & (t["WSWin"] != "Y")]
            if len(loser):
                entry["runnerUp"] = rec(loser.iloc[0])
        else:
            entry["pennants"] = [rec(r) for _, r in t[t["LgWin"] == "Y"].iterrows()]
        best = t.sort_values(["W", "L"], ascending=[False, True]).iloc[0]
        entry["best"] = rec(best)

        g = int(t["G"].max())
        b = bat[bat["yearID"] == year].groupby("playerID")[["AB", "H", "HR", "PA", "SB"]].sum()
        p = pit[pit["yearID"] == year].groupby("playerID")[["W", "SO", "ER", "IPouts", "SV"]].sum()
        who = lambda pid: name_of.get(pid, pid)
        if len(b):
            hr = b["HR"].idxmax(); entry["hr"] = {"name": who(hr), "n": int(b.loc[hr, "HR"])}
            q = b[b["PA"] >= 3.1 * g]
            if len(q):
                avg = (q["H"] / q["AB"]).idxmax()
                entry["avg"] = {"name": who(avg), "v": round(float(q.loc[avg, "H"] / q.loc[avg, "AB"]), 3)}
            sb = b["SB"].idxmax(); entry["sb"] = {"name": who(sb), "n": int(b.loc[sb, "SB"])}
        if len(p):
            w = p["W"].idxmax(); entry["wins"] = {"name": who(w), "n": int(p.loc[w, "W"])}
            so = p["SO"].idxmax(); entry["so"] = {"name": who(so), "n": int(p.loc[so, "SO"])}
            q = p[p["IPouts"] >= 3 * g]
            if len(q):
                era = (q["ER"] * 27 / q["IPouts"]).idxmin()
                entry["era"] = {"name": who(era), "v": round(float(q.loc[era, "ER"] * 27 / q.loc[era, "IPouts"]), 2)}
        out[int(year)] = entry

    text = ("// AUTO-GENERADO por season_context_etl.py - NO EDITAR MANUALMENTE\n"
            "// Contexto de cada temporada (campeon, mejor record, lideres) para el selector del Modo Historia\n"
            "window.SeasonContext = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    OUT.write_text(text, encoding="utf-8")
    print(f"{len(out)} temporadas -> {OUT.name} ({len(text) / 1024:.0f} KB)")
    for y in (1927, 1994, 1998, 2025):
        print(y, json.dumps(out.get(y), ensure_ascii=False)[:330])


if __name__ == "__main__":
    main()
