"""
generate_opponents_pool.py
Genera opponents_pool.js a partir de pitchers_pool.csv.
Cada equipo oponente contiene exactamente 3 PITCHERS (rotación de 3 lanzadores).
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path

BASE_DIR = Path("C:/Users/Administrador/.gemini/antigravity/scratch/baserogue")
IN_CSV   = BASE_DIR / "pitchers_pool.csv"
OUT_JS   = BASE_DIR / "opponents_pool.js"

TIERS = ["F", "D", "C", "B", "A", "S"]

def ovr_to_tier(ovr):
    if ovr >= 92: return "S"
    if ovr >= 85: return "A"
    if ovr >= 78: return "B"
    if ovr >= 70: return "C"
    if ovr >= 60: return "D"
    return "F"

def calc_hp(row):
    sta = float(row["sta_val"])
    if row["role"] == "SP":
        return int(45 + (sta / 99) * 75)
    else:
        return int(25 + (sta / 99) * 20)

def clamp_stat(val, lo=1, hi=125):
    return max(lo, min(hi, int(round(val))))

def pitcher_to_obj(row):
    hp = calc_hp(row)
    stf = clamp_stat(row["str_val"], 1, 125)
    ctl = clamp_stat(row["ctl_val"], 1, 125)
    mov = clamp_stat(row["grt_val"], 1, 125)
    sta = clamp_stat(row["sta_val"], 1, 125)
    name_safe = str(row["name"]).replace('"', "'")
    return {
        "name":     name_safe,
        "role":     row["role"],
        "pos":      row["role"],
        "hp":       hp,
        "maxHp":    hp,
        "stf":      stf,
        "ctl":      ctl,
        "mov":      mov,
        "sta":      sta,
        "ovr":      float(row["ovr"]),
        "era":      str(row["era"]),
        "rarity":   str(row["rarity"]),
        "year":     int(row["peak_year_display"]),
        "allstars": int(row["allstar_selections"]),
        "hof":      bool(row["is_hof"]),
        "team":     str(row["team"]),
        "_ovr":     float(row["ovr"]),
        "_era":     str(row["era"]),
        "_rarity":  str(row["rarity"]),
        "_year":    int(row["peak_year_display"]),
        "_allstars": int(row["allstar_selections"]),
        "_hof":     bool(row["is_hof"]),
        "_team":    str(row["team"]),
    }

def build_3pitcher_team(p1_row, p2_row, p3_row, idx=0, is_boss=False):
    p1 = pitcher_to_obj(p1_row)
    p2 = pitcher_to_obj(p2_row)
    p3 = pitcher_to_obj(p3_row)
    raw_pitchers = [p1, p2, p3]
    # SPs first (sorted by stamina desc), RPs last (sorted by stamina desc)
    sps = sorted([p for p in raw_pitchers if p.get("role") == "SP"], key=lambda p: p.get("sta", 50), reverse=True)
    rps = sorted([p for p in raw_pitchers if p.get("role") != "SP"], key=lambda p: p.get("sta", 50), reverse=True)
    pitchers = sps + rps

    avg_ovr = round((p1["_ovr"] + p2["_ovr"] + p3["_ovr"]) / 3.0, 1)
    tier = ovr_to_tier(avg_ovr)
    lead = p1
    name = f'BOSS: {lead["name"]} ({lead["_year"]})' if is_boss else f'{lead["name"]} ({lead["_year"]})'

    return {
        "id": f"opp_team_{idx:05d}",
        "name": name,
        "tier": tier,
        "isBoss": is_boss,
        "pitchers": pitchers,
        "_ovr": avg_ovr,
        "_era": lead["_era"],
        "_rarity": lead["_rarity"],
        "_year": lead["_year"],
        "_team": lead["_team"],
        "_hof": lead["_hof"],
        "_allstars": lead["_allstars"],
    }

def main():
    print("=" * 60)
    print("  Generating 3-Pitcher Teams in opponents_pool.js")
    print("=" * 60)

    df = pd.read_csv(IN_CSV)
    df["sta_val"] = df["sta_val"].clip(1, 125)
    df["str_val"] = df["str_val"].clip(1, 125)
    df["ctl_val"] = df["ctl_val"].clip(1, 125)
    df["grt_val"] = df["grt_val"].clip(1, 125)

    df["tier"] = df["ovr"].apply(ovr_to_tier)

    entries = []
    idx = 0

    # Build teams per tier (F, D, C, B, A, S)
    for t_name in ["F", "D", "C", "B", "A", "S"]:
        t_df = df[df["tier"] == t_name].copy().reset_index(drop=True)
        if len(t_df) < 3:
            # Fallback for small tiers (e.g. S) by taking top pitchers
            t_df = df[df["ovr"] >= 80].copy().reset_index(drop=True)

        # Separate SPs and RPs
        sps = t_df[t_df["role"] == "SP"].reset_index(drop=True)
        rps = t_df[t_df["role"] == "RP"].reset_index(drop=True)

        if len(sps) < 2:
            sps = t_df.reset_index(drop=True)

        n_teams = max(10, len(sps) // 2)
        for i in range(n_teams):
            p1_row = sps.iloc[i * 2 % len(sps)]
            p2_row = sps.iloc[(i * 2 + 1) % len(sps)]
            p3_row = rps.iloc[i % len(rps)] if len(rps) > 0 else sps.iloc[(i * 2 + 2) % len(sps)]

            # Top 15% in tier are bosses
            is_boss = (i % 5 == 0) or (i < 3 and t_name in ["C", "B", "A", "S"])

            entry = build_3pitcher_team(p1_row, p2_row, p3_row, idx=idx, is_boss=is_boss)
            entries.append(entry)
            idx += 1

    print(f"  Total entries generados: {len(entries):,}")

    for t_name in ["F", "D", "C", "B", "A", "S"]:
        c = sum(1 for e in entries if e["tier"] == t_name)
        b_c = sum(1 for e in entries if e["tier"] == t_name and e["isBoss"])
        print(f"    Tier {t_name:<2}: {c:4,} entries  ({b_c} boss)")

    js_lines = [
        "// AUTO-GENERADO por generate_opponents_pool.py - NO EDITAR MANUALMENTE",
        f"// Total: {len(entries):,} oponentes | Fuente: pitchers_pool.csv",
        "window.OpponentsPool = [",
    ]

    for entry in entries:
        is_boss_js = "true" if entry["isBoss"] else "false"
        hof_js     = "true" if entry["_hof"] else "false"
        name_safe  = entry["name"].replace('"', "'")

        js_lines.append(f'  {{')
        js_lines.append(f'    id: "{entry["id"]}", name: "{name_safe}",')
        js_lines.append(f'    tier: "{entry["tier"]}", isBoss: {is_boss_js},')
        js_lines.append(f'    era: "{entry["_era"]}", ovr: {entry["_ovr"]:.1f},')
        js_lines.append(f'    rarity: "{entry["_rarity"]}", hof: {hof_js}, allstars: {entry["_allstars"]},')
        js_lines.append(f'    pitchers: [')
        for p in entry["pitchers"]:
            p_name = p["name"].replace('"', "'")
            p_year = p.get("year", p.get("_year", 1990))
            p_era  = p.get("era", p.get("_era", ""))
            p_rarity = p.get("rarity", p.get("_rarity", "Common"))
            p_team = p.get("team", p.get("_team", "OAK"))
            p_ovr  = p.get("ovr", p.get("_ovr", 50.0))
            js_lines.append(
                f'      {{ name: "{p_name}", role: "{p["role"]}", pos: "{p["role"]}", '
                f'year: {p_year}, era: "{p_era}", rarity: "{p_rarity}", team: "{p_team}", ovr: {p_ovr:.1f}, '
                f'hp: {p["hp"]}, maxHp: {p["maxHp"]}, '
                f'stf: {p["stf"]}, ctl: {p["ctl"]}, mov: {p["mov"]}, sta: {p["sta"]} }},'
            )
        js_lines.append(f'    ]')
        js_lines.append(f'  }},')

    js_lines.append("];")

    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("\n".join(js_lines))
    print(f"\n  [OK]  opponents_pool.js  ->  {OUT_JS}")

if __name__ == "__main__":
    main()
