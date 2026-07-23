import sys

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add global rule for pre-fight-columns
global_rule = "\n.pre-fight-columns {\n  display: flex;\n  gap: 20px;\n  margin-bottom: 24px;\n}\n"
idx = css.find('@media')
css = css[:idx] + global_rule + css[idx:]

# Add mobile specific rules
mobile_rules = """
  .pre-fight-columns {
    flex-direction: column !important;
    gap: 12px !important;
  }
  .roster-slot {
    padding: 6px 8px !important;
    font-size: 10px !important;
    margin-bottom: 4px !important;
  }
  .roster-slot .player-name {
    font-size: 11px !important;
  }
  .roster-slot-number {
    width: 18px !important;
    height: 18px !important;
    font-size: 10px !important;
    line-height: 18px !important;
  }
  #pre-fight-player-lineup, #pre-fight-enemy-rotation {
    gap: 4px !important;
  }
  #pre-fight-player-lineup .roster-slot, #pre-fight-enemy-rotation .roster-slot {
    padding: 4px 6px !important;
  }
  /* Hide the BaseRogue text in draft on mobile */
  #screen-menu > p {
    display: none !important;
  }
"""

idx_768 = css.find('@media (max-width: 768px) {')
if idx_768 != -1:
    insert_pos = css.find('{', idx_768) + 1
    css = css[:insert_pos] + mobile_rules + css[insert_pos:]
else:
    print("Could not find @media (max-width: 768px)")
    sys.exit(1)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("CSS updated successfully.")
