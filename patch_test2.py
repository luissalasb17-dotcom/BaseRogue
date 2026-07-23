import sys
import re

with open('lahman_etl_v5.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change the formula in paso_14 to 60% sb_score + 40% runs_br
old_form = 'group["speed_raw_temp"] = sb_c * 0.40 + xb_c * 0.40 + group["runs_br_norm"] * 0.20'
new_form = 'group["speed_raw_temp"] = sb_c * 0.60 + group["runs_br_norm"] * 0.40'
content = content.replace(old_form, new_form)

# 2. Increase the ceiling on runs_br_norm from 1.0 to 1.8
content = content.replace('df["runs_br_norm"]  = (df["runs_br"] / rbr_max).clip(upper=1.0)', 'df["runs_br_norm"]  = (df["runs_br"] / rbr_max).clip(upper=1.8)')

# 3. Increase the ceiling on sb_c from 1.0 to 1.8
content = content.replace('sb_c  = (group["sb_score"] / sb_max).clip(upper=1.0).fillna(0)', 'sb_c  = (group["sb_score"] / sb_max).clip(upper=1.8).fillna(0)')

# 4. Remove CSV export
content = re.sub(r'final\.to_csv\(OUT_CSV, .*?\)', 'pass # No CSV export in test', content)

# 5. Remove JS export
content = re.sub(r'with open\(OUT_JS, "w", encoding="utf-8"\) as f:.*?f\.write\(.*?\)', 'pass # No JS export in test', content, flags=re.DOTALL)

# 6. Inject our test print at the very end of main
old_main = 'reporte_final(final)\n    return final'
new_main = '''reporte_final(final)
    print("\\n\\n=== RESULTADOS DE PRUEBA (Techo 1.8 | 60% robos, 40% rbaser) ===")
    test_ids = ["henderi01", "suzukic01", "morgajo02", "jeterde01", "ruthba01"]
    
    # Extract raw data from eligible before paso_15 drops it
    test_players = final[final["playerID"].isin(test_ids)][["playerID", "name", "speed_val"]]
    test_raw = eligible[eligible["playerID"].isin(test_ids)][["playerID", "sb_score", "runs_br_norm"]]
    
    import pandas as pd
    res = pd.merge(test_players, test_raw, on="playerID")
    # Sort by speed_val descending
    res = res.sort_values(by="speed_val", ascending=False)
    print(res.to_string(index=False))
    print("====================================================\\n")
    return final'''
content = content.replace(old_main, new_main)

with open('test_etl2.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('test_etl2.py created successfully.')
