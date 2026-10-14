"""
append_2026_season.py
---------------------
Descarga las estadisticas oficiales de conteo de la temporada 2026 desde la
API oficial de MLB (statsapi.mlb.com) y las integra en el formato estandar de Lahman
(Batting.csv, Pitching.csv, Fielding.csv, Appearances.csv, Teams.csv, People.csv),
cruzandolas de forma exacta con los IDs y WAR de war_daily_bat.txt y war_daily_pitch.txt.

Este script es idempotente: elimina cualquier fila previa de 2026 antes de anexar.
"""

import os
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
import numpy as np

BASE_DIR = r"C:\Users\Administrador\.gemini\antigravity\scratch\baserogue\lahman_1871-2025"

MLB_TEAM_MAP = {
    108: {"teamID": "LAA", "lgID": "AL", "bref": "LAA"},
    109: {"teamID": "ARI", "lgID": "NL", "bref": "ARI"},
    110: {"teamID": "BAL", "lgID": "AL", "bref": "BAL"},
    111: {"teamID": "BOS", "lgID": "AL", "bref": "BOS"},
    112: {"teamID": "CHN", "lgID": "NL", "bref": "CHC"},
    113: {"teamID": "CIN", "lgID": "NL", "bref": "CIN"},
    114: {"teamID": "CLE", "lgID": "AL", "bref": "CLE"},
    115: {"teamID": "COL", "lgID": "NL", "bref": "COL"},
    116: {"teamID": "DET", "lgID": "AL", "bref": "DET"},
    117: {"teamID": "HOU", "lgID": "AL", "bref": "HOU"},
    118: {"teamID": "KCA", "lgID": "AL", "bref": "KCR"},
    119: {"teamID": "LAN", "lgID": "NL", "bref": "LAD"},
    120: {"teamID": "WAS", "lgID": "NL", "bref": "WSN"},
    121: {"teamID": "NYN", "lgID": "NL", "bref": "NYM"},
    133: {"teamID": "ATH", "lgID": "AL", "bref": "ATH"},
    134: {"teamID": "PIT", "lgID": "NL", "bref": "PIT"},
    135: {"teamID": "SDN", "lgID": "NL", "bref": "SDP"},
    136: {"teamID": "SEA", "lgID": "AL", "bref": "SEA"},
    137: {"teamID": "SFN", "lgID": "NL", "bref": "SFG"},
    138: {"teamID": "SLN", "lgID": "NL", "bref": "STL"},
    139: {"teamID": "TBA", "lgID": "AL", "bref": "TBR"},
    140: {"teamID": "TEX", "lgID": "AL", "bref": "TEX"},
    141: {"teamID": "TOR", "lgID": "AL", "bref": "TOR"},
    142: {"teamID": "MIN", "lgID": "AL", "bref": "MIN"},
    143: {"teamID": "PHI", "lgID": "NL", "bref": "PHI"},
    144: {"teamID": "ATL", "lgID": "NL", "bref": "ATL"},
    145: {"teamID": "CHA", "lgID": "AL", "bref": "CHW"},
    146: {"teamID": "MIA", "lgID": "NL", "bref": "MIA"},
    147: {"teamID": "NYA", "lgID": "AL", "bref": "NYY"},
    158: {"teamID": "MIL", "lgID": "NL", "bref": "MIL"},
}

BREF_TO_LAHMAN_TEAM = {v["bref"]: v["teamID"] for v in MLB_TEAM_MAP.values()}
BREF_TO_LG = {v["bref"]: v["lgID"] for v in MLB_TEAM_MAP.values()}

def http_get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def fetch_player_splits(mlb_id, group):
    try:
        url = f"https://statsapi.mlb.com/api/v1/people/{mlb_id}/stats?stats=season&group={group}&season=2026"
        data = http_get_json(url)
        splits = data.get("stats", [{}])[0].get("splits", [])
        # Filtrar solo splits con equipo especifico
        team_splits = [s for s in splits if s.get("team") is not None]
        return mlb_id, team_splits
    except Exception as e:
        print(f"Error fetching {group} for {mlb_id}: {e}")
        return mlb_id, []

def step_teams():
    print("1. Verificando Teams.csv...")
    teams_path = os.path.join(BASE_DIR, "Teams.csv")
    df = pd.read_csv(teams_path)
    df = df[df["yearID"] != 2026] # Idempotencia
    df_2025 = df[df["yearID"] == 2025].copy()
    df_2026 = df_2025.copy()
    df_2026["yearID"] = 2026
    # Reset stats
    for c in ["G", "Ghome", "W", "L", "R", "AB", "H", "2B", "3B", "HR", "BB", "SO", "SB", "CS", "HBP", "SF", "RA", "ER", "ERA", "CG", "SHO", "SV", "IPouts", "HA", "HRA", "BBA", "SOA", "E", "DP", "FP"]:
        if c in df_2026.columns:
            df_2026[c] = 0
    df_new = pd.concat([df, df_2026], ignore_index=True)
    df_new.to_csv(teams_path, index=False)
    print(f"   Teams.csv actualizado con {len(df_2026)} equipos para 2026.")

def step_people(wbat26, wpitch26):
    print("2. Verificando y agregando novatos 2026 a People.csv...")
    people_path = os.path.join(BASE_DIR, "People.csv")
    people = pd.read_csv(people_path)
    
    # Todos los IDs 2026 de Baseball-Reference
    all_2026_pids = set(wbat26["player_ID"]).union(set(wpitch26["player_ID"]))
    existing_pids = set(people["playerID"])
    missing_pids = all_2026_pids - existing_pids
    print(f"   Jugadores faltantes en People.csv: {len(missing_pids)}")

    if missing_pids:
        # Mapeo player_ID -> mlb_ID
        bat_map = dict(zip(wbat26["player_ID"], wbat26["mlb_ID"]))
        pitch_map = dict(zip(wpitch26["player_ID"], wpitch26["mlb_ID"]))
        
        # Descargar catalogo 2026 de personas desde MLB API
        url_all_players = "https://statsapi.mlb.com/api/v1/sports/1/players?season=2026"
        players_data = http_get_json(url_all_players).get("people", [])
        mlb_dict = {p["id"]: p for p in players_data}

        new_rows = []
        max_id = people["ID"].max() if "ID" in people.columns and not people["ID"].isna().all() else 0
        
        for pid in missing_pids:
            mid = bat_map.get(pid) or pitch_map.get(pid)
            if pd.isna(mid):
                continue
            mid = int(mid)
            pinfo = mlb_dict.get(mid, {})
            
            # Altura en pulgadas
            height_in = 72
            h_str = pinfo.get("height", "")
            if "'" in h_str:
                parts = h_str.replace('"', '').split("'")
                try:
                    height_in = int(parts[0].strip()) * 12 + int(parts[1].strip())
                except:
                    pass

            bdate = pinfo.get("birthDate", "")
            byear = int(bdate.split("-")[0]) if bdate and len(bdate) >= 4 else np.nan
            bmonth = int(bdate.split("-")[1]) if bdate and len(bdate) >= 7 else np.nan
            bday = int(bdate.split("-")[2]) if bdate and len(bdate) >= 10 else np.nan

            bats = pinfo.get("batSide", {}).get("code", "R")
            throws = pinfo.get("pitchHand", {}).get("code", "R")
            debut = pinfo.get("mlbDebutDate", "2026-04-01")

            max_id += 1
            new_rows.append({
                "ID": max_id,
                "playerID": pid,
                "birthYear": byear,
                "birthMonth": bmonth,
                "birthDay": bday,
                "birthCity": pinfo.get("birthCity", ""),
                "birthCountry": pinfo.get("birthCountry", ""),
                "birthState": pinfo.get("birthStateProvince", ""),
                "deathYear": np.nan,
                "deathMonth": np.nan,
                "deathDay": np.nan,
                "deathCountry": np.nan,
                "deathState": np.nan,
                "deathCity": np.nan,
                "nameFirst": pinfo.get("firstName", ""),
                "nameLast": pinfo.get("lastName", ""),
                "nameGiven": pinfo.get("fullName", ""),
                "weight": pinfo.get("weight", 190),
                "height": height_in,
                "bats": bats,
                "throws": throws,
                "debut": debut,
                "bbrefID": pid,
                "finalGame": np.nan,
                "retroID": np.nan
            })

        if new_rows:
            people_new = pd.concat([people, pd.DataFrame(new_rows)], ignore_index=True)
            people_new.to_csv(people_path, index=False)
            print(f"   People.csv actualizado con {len(new_rows)} nuevos jugadores.")
    else:
        print("   People.csv ya contenia a todos los jugadores.")

def step_batting(wbat26):
    print("3. Descargando y estructurando Batting.csv 2026...")
    bat_path = os.path.join(BASE_DIR, "Batting.csv")
    bat_orig = pd.read_csv(bat_path)
    bat_orig = bat_orig[bat_orig["yearID"] != 2026] # Idempotencia

    # Descargar bulk
    url_bat = "https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&season=2026&playerPool=all&sportId=1&limit=3000"
    bat_data = http_get_json(url_bat)["stats"][0]["splits"]
    
    # Identificar jugadores multi-stint segun war_daily_bat
    stint_counts = wbat26.groupby("player_ID")["stint_ID"].count()
    multi_pids = set(stint_counts[stint_counts > 1].index)
    pid_to_mid = dict(zip(wbat26["player_ID"], wbat26["mlb_ID"].astype(int)))
    multi_mids = [pid_to_mid[p] for p in multi_pids if p in pid_to_mid]
    print(f"   Total bateadores: {len(bat_data)}. Bateadores con multiples stints: {len(multi_mids)}")

    # Descargar splits de stints en paralelo
    multi_splits = {}
    if multi_mids:
        with ThreadPoolExecutor(max_workers=10) as ex:
            results = ex.map(lambda m: fetch_player_splits(m, "hitting"), multi_mids)
            for mid, splits in results:
                multi_splits[mid] = splits

    mlb_to_pid = dict(zip(wbat26["mlb_ID"].astype(int), wbat26["player_ID"]))

    batting_rows = []
    # Para tracking de procesados
    processed_pids = set()

    # Procesar multi-stint primero
    for mid, splits in multi_splits.items():
        pid = mlb_to_pid.get(mid)
        if not pid:
            continue
        processed_pids.add(pid)
        for idx, s in enumerate(splits, start=1):
            stat = s["stat"]
            tid_mlb = s.get("team", {}).get("id")
            team_info = MLB_TEAM_MAP.get(tid_mlb, {"teamID": "UNK", "lgID": "AL"})
            batting_rows.append({
                "playerID": pid,
                "yearID": 2026,
                "stint": idx,
                "teamID": team_info["teamID"],
                "lgID": team_info["lgID"],
                "G": stat.get("gamesPlayed", 0),
                "AB": stat.get("atBats", 0),
                "R": stat.get("runs", 0),
                "H": stat.get("hits", 0),
                "2B": stat.get("doubles", 0),
                "3B": stat.get("triples", 0),
                "HR": stat.get("homeRuns", 0),
                "RBI": stat.get("rbi", 0),
                "SB": stat.get("stolenBases", 0),
                "CS": stat.get("caughtStealing", 0),
                "BB": stat.get("baseOnBalls", 0),
                "SO": stat.get("strikeOuts", 0),
                "IBB": stat.get("intentionalWalks", 0),
                "HBP": stat.get("hitByPitch", 0),
                "SH": stat.get("sacBunts", 0),
                "SF": stat.get("sacFlies", 0),
                "GIDP": stat.get("groundIntoDoublePlay", 0)
            })

    # Procesar resto de jugadores
    for s in bat_data:
        mid = s["player"]["id"]
        pid = mlb_to_pid.get(mid)
        if not pid or pid in processed_pids:
            continue
        processed_pids.add(pid)
        stat = s["stat"]
        tid_mlb = s.get("team", {}).get("id")
        team_info = MLB_TEAM_MAP.get(tid_mlb, {"teamID": "UNK", "lgID": "AL"})
        batting_rows.append({
            "playerID": pid,
            "yearID": 2026,
            "stint": 1,
            "teamID": team_info["teamID"],
            "lgID": team_info["lgID"],
            "G": stat.get("gamesPlayed", 0),
            "AB": stat.get("atBats", 0),
            "R": stat.get("runs", 0),
            "H": stat.get("hits", 0),
            "2B": stat.get("doubles", 0),
            "3B": stat.get("triples", 0),
            "HR": stat.get("homeRuns", 0),
            "RBI": stat.get("rbi", 0),
            "SB": stat.get("stolenBases", 0),
            "CS": stat.get("caughtStealing", 0),
            "BB": stat.get("baseOnBalls", 0),
            "SO": stat.get("strikeOuts", 0),
            "IBB": stat.get("intentionalWalks", 0),
            "HBP": stat.get("hitByPitch", 0),
            "SH": stat.get("sacBunts", 0),
            "SF": stat.get("sacFlies", 0),
            "GIDP": stat.get("groundIntoDoublePlay", 0)
        })

    df_bat_2026 = pd.DataFrame(batting_rows)
    df_bat_total = pd.concat([bat_orig, df_bat_2026], ignore_index=True)
    df_bat_total.to_csv(bat_path, index=False)
    print(f"   Batting.csv actualizado con {len(df_bat_2026)} filas de 2026.")
    return df_bat_2026

def step_pitching(wpitch26):
    print("4. Descargando y estructurando Pitching.csv 2026...")
    pitch_path = os.path.join(BASE_DIR, "Pitching.csv")
    pitch_orig = pd.read_csv(pitch_path)
    pitch_orig = pitch_orig[pitch_orig["yearID"] != 2026] # Idempotencia

    # Descargar bulk
    url_pitch = "https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=2026&playerPool=all&sportId=1&limit=3000"
    pitch_data = http_get_json(url_pitch)["stats"][0]["splits"]

    # Identificar lanzadores multi-stint
    stint_counts = wpitch26.groupby("player_ID")["stint_ID"].count()
    multi_pids = set(stint_counts[stint_counts > 1].index)
    pid_to_mid = dict(zip(wpitch26["player_ID"], wpitch26["mlb_ID"].astype(int)))
    multi_mids = [pid_to_mid[p] for p in multi_pids if p in pid_to_mid]
    print(f"   Total lanzadores: {len(pitch_data)}. Lanzadores con multiples stints: {len(multi_mids)}")

    multi_splits = {}
    if multi_mids:
        with ThreadPoolExecutor(max_workers=10) as ex:
            results = ex.map(lambda m: fetch_player_splits(m, "pitching"), multi_mids)
            for mid, splits in results:
                multi_splits[mid] = splits

    mlb_to_pid = dict(zip(wpitch26["mlb_ID"].astype(int), wpitch26["player_ID"]))

    pitching_rows = []
    processed_pids = set()

    def make_pitch_row(pid, stint, s):
        stat = s["stat"]
        tid_mlb = s.get("team", {}).get("id")
        team_info = MLB_TEAM_MAP.get(tid_mlb, {"teamID": "UNK", "lgID": "AL"})
        
        era_str = stat.get("era", "0.00")
        try:
            era = float(era_str) if era_str != "-.--" else 0.00
        except:
            era = 0.00

        avg_str = stat.get("avg", "0.000")
        try:
            baopp = float(avg_str) if avg_str != ".---" else 0.000
        except:
            baopp = 0.000

        return {
            "playerID": pid,
            "yearID": 2026,
            "stint": stint,
            "teamID": team_info["teamID"],
            "lgID": team_info["lgID"],
            "W": stat.get("wins", 0),
            "L": stat.get("losses", 0),
            "G": stat.get("gamesPlayed", 0),
            "GS": stat.get("gamesStarted", 0),
            "CG": stat.get("completeGames", 0),
            "SHO": stat.get("shutouts", 0),
            "SV": stat.get("saves", 0),
            "IPouts": stat.get("outs", 0),
            "H": stat.get("hits", 0),
            "ER": stat.get("earnedRuns", 0),
            "HR": stat.get("homeRuns", 0),
            "BB": stat.get("baseOnBalls", 0),
            "SO": stat.get("strikeOuts", 0),
            "BAOpp": baopp,
            "ERA": era,
            "IBB": stat.get("intentionalWalks", 0),
            "WP": stat.get("wildPitches", 0),
            "HBP": stat.get("hitBatsmen", 0),
            "BK": stat.get("balks", 0),
            "BFP": stat.get("battersFaced", 0),
            "GF": stat.get("gamesFinished", 0),
            "R": stat.get("runs", 0),
            "SH": stat.get("sacBunts", 0),
            "SF": stat.get("sacFlies", 0),
            "GIDP": stat.get("groundIntoDoublePlay", 0)
        }

    # Procesar multi-stint
    for mid, splits in multi_splits.items():
        pid = mlb_to_pid.get(mid)
        if not pid:
            continue
        processed_pids.add(pid)
        for idx, s in enumerate(splits, start=1):
            pitching_rows.append(make_pitch_row(pid, idx, s))

    # Procesar resto
    for s in pitch_data:
        mid = s["player"]["id"]
        pid = mlb_to_pid.get(mid)
        if not pid or pid in processed_pids:
            continue
        processed_pids.add(pid)
        pitching_rows.append(make_pitch_row(pid, 1, s))

    df_pitch_2026 = pd.DataFrame(pitching_rows)
    df_pitch_total = pd.concat([pitch_orig, df_pitch_2026], ignore_index=True)
    df_pitch_total.to_csv(pitch_path, index=False)
    print(f"   Pitching.csv actualizado con {len(df_pitch_2026)} filas de 2026.")
    return df_pitch_2026

def step_fielding_and_appearances(wbat26, wpitch26, df_bat_2026, df_pitch_2026):
    print("5. Descargando y estructurando Fielding.csv y Appearances.csv 2026...")
    field_path = os.path.join(BASE_DIR, "Fielding.csv")
    field_orig = pd.read_csv(field_path)
    field_orig = field_orig[field_orig["yearID"] != 2026] # Idempotencia

    app_path = os.path.join(BASE_DIR, "Appearances.csv")
    app_orig = pd.read_csv(app_path)
    app_orig = app_orig[app_orig["yearID"] != 2026] # Idempotencia

    url_field = "https://statsapi.mlb.com/api/v1/stats?stats=season&group=fielding&season=2026&playerPool=all&sportId=1&limit=5000"
    field_data = http_get_json(url_field)["stats"][0]["splits"]

    # Mapa mlb_ID a player_ID
    mlb_to_pid = dict(zip(wbat26["mlb_ID"].astype(int), wbat26["player_ID"]))
    mlb_to_pid.update(dict(zip(wpitch26["mlb_ID"].astype(int), wpitch26["player_ID"])))

    field_rows = []
    player_team_apps = {} # (playerID, teamID) -> dict de apariciones

    for s in field_data:
        mid = s["player"]["id"]
        pid = mlb_to_pid.get(mid)
        if not pid:
            continue

        tid_mlb = s.get("team", {}).get("id")
        team_info = MLB_TEAM_MAP.get(tid_mlb, {"teamID": "UNK", "lgID": "AL"})
        team_id = team_info["teamID"]
        lg_id = team_info["lgID"]

        pos = s.get("position", {}).get("abbreviation", "DH")
        stat = s["stat"]

        # Parse innOuts de innings "20.1" -> 20*3 + 1 = 61
        inn_str = str(stat.get("innings", "0.0"))
        try:
            if "." in inn_str:
                p = inn_str.split(".")
                inn_outs = int(p[0]) * 3 + int(p[1])
            else:
                inn_outs = int(inn_str) * 3
        except:
            inn_outs = 0

        g = stat.get("gamesPlayed", stat.get("games", 0))
        gs = stat.get("gamesStarted", 0)
        po = stat.get("putOuts", 0)
        a = stat.get("assists", 0)
        e = stat.get("errors", 0)
        dp = stat.get("doublePlays", 0)

        field_rows.append({
            "playerID": pid,
            "yearID": 2026,
            "stint": 1,
            "teamID": team_id,
            "lgID": lg_id,
            "POS": pos,
            "G": g,
            "GS": gs,
            "InnOuts": inn_outs,
            "PO": po,
            "A": a,
            "E": e,
            "DP": dp,
            "PB": stat.get("passedBall", np.nan),
            "WP": stat.get("wildPitches", np.nan),
            "SB": stat.get("stolenBases", np.nan),
            "CS": stat.get("caughtStealing", np.nan),
            "ZR": np.nan
        })

        # Acumular para Appearances
        key = (pid, team_id, lg_id)
        if key not in player_team_apps:
            player_team_apps[key] = {
                "yearID": 2026, "teamID": team_id, "lgID": lg_id, "playerID": pid,
                "G_all": 0, "GS": 0, "G_batting": 0, "G_defense": 0,
                "G_p": 0, "G_c": 0, "G_1b": 0, "G_2b": 0, "G_3b": 0,
                "G_ss": 0, "G_lf": 0, "G_cf": 0, "G_rf": 0, "G_of": 0,
                "G_dh": 0, "G_ph": 0, "G_pr": 0
            }
        app_rec = player_team_apps[key]
        app_rec["G_defense"] += g
        app_rec["GS"] += gs
        pos_key = f"G_{pos.lower()}"
        if pos_key in app_rec:
            app_rec[pos_key] += g
        if pos in ["LF", "CF", "RF"]:
            app_rec["G_of"] += g

    # Integrar G y GS de bateadores y lanzadores a Appearances
    for _, row in df_bat_2026.iterrows():
        key = (row["playerID"], row["teamID"], row["lgID"])
        if key not in player_team_apps:
            player_team_apps[key] = {
                "yearID": 2026, "teamID": row["teamID"], "lgID": row["lgID"], "playerID": row["playerID"],
                "G_all": 0, "GS": 0, "G_batting": 0, "G_defense": 0,
                "G_p": 0, "G_c": 0, "G_1b": 0, "G_2b": 0, "G_3b": 0,
                "G_ss": 0, "G_lf": 0, "G_cf": 0, "G_rf": 0, "G_of": 0,
                "G_dh": 0, "G_ph": 0, "G_pr": 0
            }
        player_team_apps[key]["G_batting"] = max(player_team_apps[key]["G_batting"], int(row["G"]))
        player_team_apps[key]["G_all"] = max(player_team_apps[key]["G_all"], int(row["G"]))

    for _, row in df_pitch_2026.iterrows():
        key = (row["playerID"], row["teamID"], row["lgID"])
        if key not in player_team_apps:
            player_team_apps[key] = {
                "yearID": 2026, "teamID": row["teamID"], "lgID": row["lgID"], "playerID": row["playerID"],
                "G_all": 0, "GS": 0, "G_batting": 0, "G_defense": 0,
                "G_p": 0, "G_c": 0, "G_1b": 0, "G_2b": 0, "G_3b": 0,
                "G_ss": 0, "G_lf": 0, "G_cf": 0, "G_rf": 0, "G_of": 0,
                "G_dh": 0, "G_ph": 0, "G_pr": 0
            }
        player_team_apps[key]["G_p"] = max(player_team_apps[key]["G_p"], int(row["G"]))
        player_team_apps[key]["GS"] = max(player_team_apps[key]["GS"], int(row["GS"]))
        player_team_apps[key]["G_all"] = max(player_team_apps[key]["G_all"], int(row["G"]))

    # Guardar Fielding.csv
    df_field_2026 = pd.DataFrame(field_rows)
    df_field_total = pd.concat([field_orig, df_field_2026], ignore_index=True)
    df_field_total.to_csv(field_path, index=False)
    print(f"   Fielding.csv actualizado con {len(df_field_2026)} filas de 2026.")

    # Guardar Appearances.csv
    df_app_2026 = pd.DataFrame(list(player_team_apps.values()))
    df_app_total = pd.concat([app_orig, df_app_2026], ignore_index=True)
    df_app_total.to_csv(app_path, index=False)
    print(f"   Appearances.csv actualizado con {len(df_app_2026)} filas de 2026.")

def step_allstar(wbat26, wpitch26):
    print("6. Descargando y estructurando AllstarFull.csv 2026...")
    as_file = os.path.join(BASE_DIR, "AllstarFull.csv")
    as_orig = pd.read_csv(as_file)
    as_orig = as_orig[as_orig["yearID"] != 2026] # Idempotencia

    mlb_to_pid = dict(zip(wbat26["mlb_ID"].astype(int), wbat26["player_ID"]))
    mlb_to_pid.update(dict(zip(wpitch26["mlb_ID"].astype(int), wpitch26["player_ID"])))
    pid_to_team = dict(zip(wbat26["player_ID"], wbat26["team_ID"]))
    pid_to_team.update(dict(zip(wpitch26["player_ID"], wpitch26["team_ID"])))

    url = "https://statsapi.mlb.com/api/v1/game/823443/boxscore"
    data = http_get_json(url)

    as_rows = []
    for side, lg in [("away", "AL"), ("home", "NL")]:
        team_data = data.get("teams", {}).get(side, {})
        for pid_str, p in team_data.get("players", {}).items():
            mid = p.get("person", {}).get("id")
            pid = mlb_to_pid.get(mid)
            if not pid:
                continue
            bref_team = pid_to_team.get(pid, "UNK")
            lahman_team = BREF_TO_LAHMAN_TEAM.get(bref_team, bref_team)
            stats = p.get("stats", {})
            batting_stat = stats.get("batting", {})
            pitching_stat = stats.get("pitching", {})
            gp = 1 if (batting_stat.get("gamesPlayed", 0) > 0 or pitching_stat.get("gamesPitched", 0) > 0) else 0
            batting_order = p.get("battingOrder")
            starter_pos = np.nan
            if batting_order and int(batting_order) % 100 == 0:
                starter_pos = int(batting_order) // 100

            as_rows.append({
                "playerID": pid,
                "yearID": 2026,
                "gameNum": 0,
                "gameID": "ALS202607150",
                "teamID": lahman_team,
                "lgID": lg,
                "GP": gp,
                "startingPos": starter_pos
            })

    df_as_2026 = pd.DataFrame(as_rows)
    df_as_final = pd.concat([as_orig, df_as_2026], ignore_index=True)
    df_as_final.to_csv(as_file, index=False)
    print(f"   AllstarFull.csv actualizado con {len(df_as_2026)} filas de 2026.")

def main():
    print("=== INICIANDO INTEGRACION DE TEMPORADA 2026 ===")
    wbat = pd.read_csv(os.path.join(BASE_DIR, "war_daily_bat.txt"))
    wbat26 = wbat[wbat["year_ID"] == 2026].copy()
    
    wpitch = pd.read_csv(os.path.join(BASE_DIR, "war_daily_pitch.txt"))
    wpitch26 = wpitch[wpitch["year_ID"] == 2026].copy()

    step_teams()
    step_people(wbat26, wpitch26)
    df_bat = step_batting(wbat26)
    df_pitch = step_pitching(wpitch26)
    step_fielding_and_appearances(wbat26, wpitch26, df_bat, df_pitch)
    step_allstar(wbat26, wpitch26)
    
    print("7. Actualizando base de estadisticas de carrera (career_data.js)...")
    import subprocess, sys
    subprocess.run([sys.executable, "export_career_db.py"], check=True)
    
    print("=== INTEGRACION 2026 COMPLETADA CON EXITO ===")

if __name__ == "__main__":
    main()
