"""Insignia WORKHORSE (decision del usuario, 12 nov 2026).
Temporadas completas equivalentes: cada temporada vale como maximo 1, segun lo que jugo contra un
titular de su equipo ese ano (asi el calendario corto de Ligas Negras o del siglo XIX ya cuenta):
  bateador: PA / (3.1 x juegos del equipo)           (vara para calificar al titulo de bateo)
  pitcher:  max(IP / juegos del equipo, G / (0.40 x juegos del equipo))   (vara de ERA; ~65 apariciones)
Con WORKHORSE_MIN (15) o mas temporadas lleva la insignia. Escribe workhorse_ids.csv (playerID, type, FS),
que leen lahman_etl_v5.py y pitchers_etl.py. Correrlo si cambian los datos de Lahman."""
import pandas as pd, numpy as np
from pathlib import Path
L = Path(__file__).resolve().parent / "lahman_1871-2025"
T = pd.read_csv(L / "Teams.csv")[["yearID", "teamID", "G"]].rename(columns={"G": "TG"})

def _tg(s):
    s["TG"] = s.TG.fillna(s.groupby("yearID").TG.transform("median")).fillna(154)
    return s

B = pd.read_csv(L / "Batting.csv", low_memory=False).merge(T, on=["yearID", "teamID"], how="left")
for c in ["AB", "BB", "HBP", "SH", "SF"]:
    B[c] = pd.to_numeric(B[c], errors="coerce").fillna(0)
B["PA"] = B.AB + B.BB + B.HBP + B.SH + B.SF
bs = _tg(B.groupby(["playerID", "yearID"]).agg(PA=("PA", "sum"), TG=("TG", "max")).reset_index())
bs["cr"] = (bs.PA / (3.1 * bs.TG)).clip(upper=1)
bat = bs.groupby("playerID").cr.sum().rename("FS").reset_index(); bat["type"] = "BAT"

P = pd.read_csv(L / "Pitching.csv", low_memory=False).merge(T, on=["yearID", "teamID"], how="left")
P["IP"] = P.IPouts / 3
ps = _tg(P.groupby(["playerID", "yearID"]).agg(IP=("IP", "sum"), G=("G", "sum"), TG=("TG", "max")).reset_index())
ps["cr"] = np.maximum(ps.IP / ps.TG, ps.G / (0.40 * ps.TG)).clip(upper=1)
pit = ps.groupby("playerID").cr.sum().rename("FS").reset_index(); pit["type"] = "PIT"

out = pd.concat([bat, pit])[["playerID", "type", "FS"]]
out["FS"] = out.FS.round(2)
out.to_csv(Path(__file__).resolve().parent / "workhorse_ids.csv", index=False)
print("workhorse_ids.csv:", len(out), "| BAT 15+:", (bat.FS >= 15).sum(), "| PIT 15+:", (pit.FS >= 15).sum())
