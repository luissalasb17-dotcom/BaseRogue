import pandas as pd
import numpy as np

import lahman_etl_v5 as etl

dfs         = etl.paso_1_cargar_datos()
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

pure_pitcher_ids = etl.paso_2_filtrar_pitchers(fielding)
career           = etl.paso_3_carrera_batting(batting)
peak             = etl.paso_4_pico_batting(batting, war_bat, people)
hybrid           = etl.paso_5_hibrido(career, peak)
pos_data         = etl.paso_6_posicion_bateadores(fielding, fielding_of)
hybrid           = hybrid.merge(pos_data, on="playerID", how="left")
hybrid           = etl.paso_7_enriquecer_people(hybrid, people)
eligible         = etl.paso_8_filtro_ingesta(hybrid, allstar, hof, pure_pitcher_ids)
eligible         = etl.paso_9_asignar_era(eligible)
eligible         = etl.paso_10_atributos_raw_bateo(eligible)
df               = etl.paso_11_motor_defensivo(eligible, war_bat, awards)

df["extra_base_freq"] = df["peak_extra_base_f"] * 0.60 + df["career_extra_base_f"] * 0.40
vol_max = df["sb_volume_log"].quantile(0.98)
df["sb_score"] = df["sb_efficiency"] * 0.65 + (df["sb_volume_log"] / vol_max).clip(upper=1.0) * 0.35

# METHOD 1: ERA-RELATIVE (Current method with AB >= 200 filtering for era max)
df1 = df.copy()
spd_temps = []
for era, group in df1.groupby("era_label"):
    qual = group[group["career_ab"] >= 200]
    if qual.empty: qual = group
    sb_max = qual["sb_score"].quantile(0.98)
    xb_max = qual["extra_base_freq"].quantile(0.98)
    sb_c = (group["sb_score"] / sb_max).clip(upper=1.0).fillna(0) if sb_max > 0 else pd.Series(0.0, index=group.index)
    xb_c = (group["extra_base_freq"].fillna(0) / xb_max).clip(upper=1.0) if xb_max > 0 else pd.Series(0.0, index=group.index)
    temp = sb_c * 0.40 + xb_c * 0.40 + group["runs_br_norm"] * 0.20
    for idx, val in temp.items():
        spd_temps.append((idx, val))

spd_temp_df = pd.DataFrame(spd_temps, columns=["idx", "spd_raw_temp"]).set_index("idx")
df1["spd_raw_temp"] = spd_temp_df["spd_raw_temp"]

g_mean1 = df1["spd_raw_temp"].mean()
era_means1 = df1.groupby("era_label")["spd_raw_temp"].transform("mean")
diff1 = g_mean1 / era_means1.replace(0, 1)
blended1 = 1.0 + 0.75 * (diff1 - 1.0)
df1["spd_raw_adj"] = df1["spd_raw_temp"] * blended1
df1["m1_speed"] = etl.normalize_series(df1["spd_raw_adj"], 1, 99).clip(1, 125).round(1)

# METHOD 2: PURE GLOBAL (OPS+ style on raw global metrics)
df2 = df.copy()
qual_global = df2[df2["career_ab"] >= 200]
sb_gmax = qual_global["sb_score"].quantile(0.98)
xb_gmax = qual_global["extra_base_freq"].quantile(0.98)
sb_gc = (df2["sb_score"] / sb_gmax).clip(upper=1.0).fillna(0)
xb_gc = (df2["extra_base_freq"].fillna(0) / xb_gmax).clip(upper=1.0)
df2["spd_raw_global"] = sb_gc * 0.40 + xb_gc * 0.40 + df2["runs_br_norm"] * 0.20

g_mean2 = df2["spd_raw_global"].mean()
era_means2 = df2.groupby("era_label")["spd_raw_global"].transform("mean")
diff2 = g_mean2 / era_means2.replace(0, 1)
blended2 = 1.0 + 0.75 * (diff2 - 1.0)
df2["spd_raw_adj"] = df2["spd_raw_global"] * blended2
df2["m2_speed"] = etl.normalize_series(df2["spd_raw_adj"], 1, 99).clip(1, 125).round(1)

# Merge results for comparison
res = df1[["playerID", "full_name", "era_label", "career_ab", "career_sb", "m1_speed"]].copy()
res["m2_speed"] = df2["m2_speed"]

benchmarks = ["Cool Papa Bell", "Rickey Henderson", "Ty Cobb", "Vince Coleman", "Lou Brock", "Ichiro Suzuki", "Tim Raines", "Maury Wills", "Jose Altuve", "Trea Turner", "Ronald Acuna Jr.", "Bobby Witt Jr.", "Shohei Ohtani", "Mike Trout", "Elly De La Cruz", "Corbin Carroll", "Carl Crawford", "Jarrod Dyson", "Jackie Robinson", "Willie Mays"]

sample = res[res["full_name"].isin(benchmarks)].sort_values("m1_speed", ascending=False)
print("\n==================================================================")
print("=== COMPARATIVA DE METODOS DE VELOCIDAD PARA JUGADORES CLAVE ===")
print("==================================================================")
print(sample[["full_name", "era_label", "career_sb", "m1_speed", "m2_speed"]].to_string(index=False))

print("\n--- PROMEDIO DE VELOCIDAD POR ERA SEGUN CADA METODO ---")
era_cmp = res.groupby("era_label")[["m1_speed", "m2_speed"]].mean().round(1)
print(era_cmp.to_string())
