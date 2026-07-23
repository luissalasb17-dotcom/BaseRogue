import sys

with open('lahman_etl_v5.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace formula
old_form = 'group["speed_raw_temp"] = sb_c * 0.40 + xb_c * 0.40 + group["runs_br_norm"] * 0.20'
new_form = 'group["speed_raw_temp"] = sb_c * 0.60 + group["runs_br_norm"] * 0.40'
content = content.replace(old_form, new_form)

# Inject print at the end of main
old_main = 'reporte_final(final)\n    return final'
new_main = '''reporte_final(final)
    print("\\n\\n=== RESULTADOS DE PRUEBA (60% robos, 40% rbaser) ===")
    test_ids = ["henderi01", "jeterde01", "ruthba01"]
    
    # final has speed_val, but we need eligible for the raw components
    # We will just merge them for the test print
    test_players = final[final["playerID"].isin(test_ids)][["playerID", "name", "speed_val"]]
    test_raw = eligible[eligible["playerID"].isin(test_ids)][["playerID", "sb_score", "runs_br_norm"]]
    
    import pandas as pd
    res = pd.merge(test_players, test_raw, on="playerID")
    print(res.to_string(index=False))
    print("====================================================\\n")
    return final'''
content = content.replace(old_main, new_main)

with open('test_etl.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('test_etl.py patched successfully.')
