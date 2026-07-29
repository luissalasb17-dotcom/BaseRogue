"""
generate_opponents_pool.py
Convierte pitchers_pool.csv  →  opponents_pool.js (nuevo formato individual)

Cada pitcher del pool se convierte en un "oponente" de 1-3 pitchers.
Los SPs aparecen como oponentes con 1 SP + posible RP de apoyo.
Los RPs elite aparecen agrupados.

Mapeo de atributos:
  str_val → stf   (strikeout stuff)
  ctl_val → ctl   (control)
  grt_val → mov   (quality of contact allowed / movement)
  sta_val → sta   (endurance → determina HP)

HP = 40 + (sta_val / 99) * 80  (rango 40-120)
Para RPs: HP = 25 + (sta_val / 99) * 20  (rango 25-45)

Tier por OVR:
  OVR < 40   → Low
  40-54      → Mid
  55-67      → High
  >= 68      → Final_Boss
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path

IN_CSV  = Path(__file__).parent / "pitchers_pool.csv"
OUT_JS  = Path(__file__).parent / "opponents_pool.js"

# Rangos OVR por tier
TIER_CUTOFFS = [
    (68, "Final_Boss"),
    (55, "High"),
    (40, "Mid"),
    (0,  "Low"),
]

def ovr_to_tier(ovr):
    for cutoff, tier in TIER_CUTOFFS:
        if ovr >= cutoff:
            return tier
    return "Low"

def calc_hp(row):
    """SP: 45-120 | RP: 25-45"""
    sta = float(row["sta_val"])
    if row["role"] == "SP":
        return int(45 + (sta / 99) * 75)
    else:
        return int(25 + (sta / 99) * 20)

def clamp_stat(val, lo=1, hi=125):
    return max(lo, min(hi, int(round(val))))

def pitcher_to_obj(row, is_reliever_only=False):
    """Convierte una fila del CSV al formato del juego."""
    hp = calc_hp(row)
    stf = clamp_stat(row["str_val"], 1, 125)
    ctl = clamp_stat(row["ctl_val"], 1, 125)
    mov = clamp_stat(row["grt_val"], 1, 125)
    sta = clamp_stat(row["sta_val"], 1, 125)
    if is_reliever_only or row["role"] == "RP":
        sta = max(20, min(35, sta))  # relievers tienen stamina corta
    name_safe = str(row["name"]).replace('"', "'")
    return {
        "name":  name_safe,
        "role":  row["role"],
        "hp":    hp,
        "maxHp": hp,
        "stf":   stf,
        "ctl":   ctl,
        "mov":   mov,
        "sta":   sta,
        "_ovr":  float(row["ovr"]),
        "_era":  str(row["era"]),
        "_rarity": str(row["rarity"]),
        "_year": int(row["peak_year_display"]),
        "_allstars": int(row["allstar_selections"]),
        "_hof":  bool(row["is_hof"]),
        "_team": str(row["team"]),
    }

def build_oponent_entry(sp_row, rp_row=None, idx=0, is_boss=False):
    """
    Construye un entry de oponente completo a partir de 1 SP + opcional RP.
    """
    sp_obj = pitcher_to_obj(sp_row)
    pitchers = [sp_obj]
    if rp_row is not None:
        rp_obj = pitcher_to_obj(rp_row)
        pitchers.append(rp_obj)

    ovr = sp_obj["_ovr"]
    tier = ovr_to_tier(ovr)
    rarity_str = sp_obj["_rarity"]
    era_str = sp_obj["_era"]
    team_str = sp_obj["_team"]
    year = sp_obj["_year"]

    name = f'{sp_obj["name"]} ({year})'

    return {
        "id": f"opp_pitcher_{idx:05d}",
        "name": name,
        "tier": tier,
        "isBoss": is_boss,
        "pitchers": pitchers,
        # metadata para seleccion y UI
        "_ovr": ovr,
        "_era": era_str,
        "_rarity": rarity_str,
        "_year": year,
        "_team": team_str,
        "_hof": sp_obj["_hof"],
        "_allstars": sp_obj["_allstars"],
    }

def build_rp_entry(rp_rows, idx=0, is_boss=False):
    """Construye un entry de oponente de solo relievers (2-3 RPs)."""
    pitchers = [pitcher_to_obj(r) for _, r in rp_rows.iterrows()]
    lead = pitchers[0]
    ovr = max(p["_ovr"] for p in pitchers)
    tier = ovr_to_tier(ovr)
    rarity_str = lead["_rarity"]
    year = lead["_year"]
    name = f'Bullpen: {lead["name"]} ({year})'
    return {
        "id": f"opp_bullpen_{idx:05d}",
        "name": name,
        "tier": tier,
        "isBoss": is_boss,
        "pitchers": pitchers,
        "_ovr": ovr,
        "_era": lead["_era"],
        "_rarity": rarity_str,
        "_year": year,
        "_team": lead["_team"],
        "_hof": lead["_hof"],
        "_allstars": lead["_allstars"],
    }

def main():
    print("=" * 60)
    print("  Generating opponents_pool.js from pitchers_pool.csv")
    print("=" * 60)

    df = pd.read_csv(IN_CSV)
    df["sta_val"] = df["sta_val"].clip(1, 99)
    df["str_val"] = df["str_val"].clip(1, 99)
    df["ctl_val"] = df["ctl_val"].clip(1, 99)
    df["grt_val"] = df["grt_val"].clip(1, 99)

    sp_df = df[df["role"] == "SP"].copy().reset_index(drop=True)
    rp_df = df[df["role"] == "RP"].copy().reset_index(drop=True)

    print(f"  SPs: {len(sp_df):,}  |  RPs: {len(rp_df):,}")

    entries = []
    idx = 0

    # --- 1) SP-centric entries: cada SP con un RP de apoyo rotatorio del mismo tier ---
    # Precompute OVR p85 per tier (top 15% = boss)
    sp_df["tier"] = sp_df["ovr"].apply(ovr_to_tier)
    tier_boss_cutoff = sp_df.groupby("tier")["ovr"].quantile(0.85).to_dict()

    rp_by_tier = {}
    rp_cycle_idx = {}
    for _, tier_name in TIER_CUTOFFS:
        tier_rps = rp_df[rp_df["ovr"].apply(ovr_to_tier) == tier_name].copy()
        # Shuffle para variar las asignaciones
        tier_rps = tier_rps.sample(frac=1, random_state=42).reset_index(drop=True)
        rp_by_tier[tier_name] = tier_rps.to_dict("records")
        rp_cycle_idx[tier_name] = 0

    for _, sp_row in sp_df.iterrows():
        tier = ovr_to_tier(sp_row["ovr"])
        cutoff = tier_boss_cutoff.get(tier, 999)
        is_boss = float(sp_row["ovr"]) >= cutoff

        tier_rps = rp_by_tier.get(tier, [])
        rp_row = None
        if tier_rps:
            # Round-robin: cada SP agarra el siguiente RP en la lista circular
            cycle_i = rp_cycle_idx[tier]
            chosen = tier_rps[cycle_i % len(tier_rps)]
            rp_cycle_idx[tier] = (cycle_i + 1) % len(tier_rps)
            rp_row = pd.Series(chosen)
        entry = build_oponent_entry(sp_row, rp_row, idx, is_boss=is_boss)
        entries.append(entry)
        idx += 1


    # --- 2) RP-only entries: agrupar RPs elite en bullpens de 2 ---
    # Para cada RP Legendary o Epic, crea un entry de bullpen
    elite_rps = rp_df[rp_df["rarity"].isin(["Legendary", "Epic"])].copy()
    elite_rps_sorted = elite_rps.sort_values("ovr", ascending=False).reset_index(drop=True)
    rp_df["tier"] = rp_df["ovr"].apply(ovr_to_tier)
    rp_tier_boss_cutoff = rp_df.groupby("tier")["ovr"].quantile(0.85).to_dict()

    i = 0
    while i < len(elite_rps_sorted):
        batch = elite_rps_sorted.iloc[i:i+2]
        lead_ovr = float(batch.iloc[0]["ovr"])
        lead_tier = ovr_to_tier(lead_ovr)
        rp_cutoff = rp_tier_boss_cutoff.get(lead_tier, 999)
        is_boss = lead_ovr >= rp_cutoff
        entry = build_rp_entry(batch, idx, is_boss=is_boss)
        entries.append(entry)
        idx += 1
        i += 2


    print(f"  Total entries generados: {len(entries):,}")

    # Estadisticas por tier
    for tier_name in ["Low", "Mid", "High", "Final_Boss"]:
        count = sum(1 for e in entries if e["tier"] == tier_name)
        boss_count = sum(1 for e in entries if e["tier"] == tier_name and e["isBoss"])
        print(f"    {tier_name:<12}: {count:4,} entries  ({boss_count} boss)")

    # --- Generar JS ---
    js_lines = [
        "// AUTO-GENERADO por generate_opponents_pool.py - NO EDITAR MANUALMENTE",
        f"// Total: {len(entries):,} oponentes | Fuente: pitchers_pool.csv (ETL v1.0)",
        "// Mapeo: str_val→stf | ctl_val→ctl | grt_val→mov | sta_val→sta",
        "window.OpponentsPool = [",
    ]

    prev_tier = None
    for entry in sorted(entries, key=lambda e: (
        ["Low","Mid","High","Final_Boss"].index(e["tier"]),
        -e["_ovr"]
    )):
        tier = entry["tier"]
        if tier != prev_tier:
            label = {
                "Low":        "TIER: LOW — Zona 1 (OVR < 40)",
                "Mid":        "TIER: MID — Zona 2 (OVR 40-54)",
                "High":       "TIER: HIGH — Zona 3 (OVR 55-67)",
                "Final_Boss": "TIER: FINAL BOSS — Zona 4 (OVR 68+)",
            }.get(tier, tier)
            js_lines.append(f"\n  // {'═'*55}")
            js_lines.append(f"  // {label}")
            js_lines.append(f"  // {'═'*55}")
            prev_tier = tier

        is_boss_js = "true" if entry["isBoss"] else "false"
        hof_js     = "true" if entry["_hof"] else "false"
        name_safe  = entry["name"].replace('"', "'")

        js_lines.append(f'  {{')
        js_lines.append(f'    id: "{entry["id"]}", name: "{name_safe}",')
        js_lines.append(f'    tier: "{tier}", isBoss: {is_boss_js},')
        js_lines.append(f'    era: "{entry["_era"]}", ovr: {entry["_ovr"]:.1f},')
        js_lines.append(f'    rarity: "{entry["_rarity"]}", hof: {hof_js}, allstars: {entry["_allstars"]},')
        js_lines.append(f'    pitchers: [')
        for p in entry["pitchers"]:
            p_name = p["name"].replace('"', "'")
            js_lines.append(
                f'      {{ name: "{p_name}", role: "{p["role"]}", '
                f'hp: {p["hp"]}, maxHp: {p["maxHp"]}, '
                f'stf: {p["stf"]}, ctl: {p["ctl"]}, mov: {p["mov"]}, sta: {p["sta"]} }},'
            )
        js_lines.append(f'    ]')
        js_lines.append(f'  }},')

    js_lines.append("];")

    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("\n".join(js_lines))
    print(f"\n  [OK]  opponents_pool.js  ->  {OUT_JS}")
    print(f"         Tamano: {OUT_JS.stat().st_size / 1024:.0f} KB")

if __name__ == "__main__":
    main()
