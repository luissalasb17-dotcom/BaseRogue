import sys
import re

with open('lahman_etl_v5.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('.clip(0, 1)', '.clip(lower=0, upper=2.0)')
content = content.replace('sb_c  = (group["sb_score"] / sb_max).clip(upper=1.0).fillna(0)', 'sb_c  = (group["sb_score"] / sb_max).clip(upper=2.0).fillna(0)')
old_form = 'group["speed_raw_temp"] = sb_c * 0.40 + xb_c * 0.40 + group["runs_br_norm"] * 0.20'
new_form = 'group["speed_raw_temp"] = sb_c * 0.60 + group["runs_br_norm"] * 0.40'
content = content.replace(old_form, new_form)
content = re.sub(r'final\.to_csv\(OUT_CSV, .*?\)', 'pass # No CSV export in test', content)
content = re.sub(r'with open\(OUT_JS, "w", encoding="utf-8"\) as f:.*?f\.write\(.*?\)', 'pass # No JS export in test', content, flags=re.DOTALL)

old_main = 'reporte_final(final)\n    return final'
new_main = '''reporte_final(final)
    print("\\n\\n=== DEBUG DE COMPONENTES ===")
    test_ids = ["jeterde01", "abreubo01"]
    
    test_players = final[final["playerID"].isin(test_ids)][["playerID", "name", "speed_val", "era"]]
    test_raw = eligible[eligible["playerID"].isin(test_ids)][["playerID", "sb_score", "runs_br_norm", "speed_raw_temp", "speed_raw_adj"]]
    
    import pandas as pd
    res = pd.merge(test_players, test_raw, on="playerID")
    
    # Let's also find what sb_max is for their era
    # Jeter era: Steroid Era (1994-2005)
    # Abreu era: Steroid Era (1994-2005)
    # Let's recalculate sb_c for them manually to show it
    qual = eligible[eligible["career_ab"] >= 300]
    sb_max_era = qual[qual["era_label"] == "Steroid Era (1994-2005)"]["sb_score"].quantile(0.98)
    res["sb_max_era"] = sb_max_era
    res["sb_c"] = res["sb_score"] / sb_max_era
    
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 200)
    print(res.to_string(index=False))
    print("====================================================\\n")
    return final'''
content = content.replace(old_main, new_main)

with open('test_debug.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('test_debug.py created successfully.')
