import sys

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Append aggressive mobile rules to the absolute end of the file
aggressive_rules = """

/* --- AGGRESSIVE MOBILE OVERRIDES --- */
@media (max-width: 800px) {
  /* Match Arena Scale Down */
  .match-arena {
    transform: scale(0.80) !important;
    transform-origin: top center !important;
    margin-bottom: -20vh !important;
  }
  
  /* Draft Cards Compact */
  .draft-cards .player-card, 
  .starter-selection .player-card, 
  .draft-cards .card, 
  .starter-selection .card, 
  .starter-card-wrapper .card {
    max-width: 90vw !important;
    width: 90vw !important;
    min-width: 90vw !important;
    padding: 6px !important;
    font-size: 8px !important;
    box-sizing: border-box !important;
  }

  .draft-cards-row {
    gap: 8px !important;
  }

  /* Hide synergy helpers to save space */
  .draft-synergy-helper {
    display: none !important;
  }

  .btn-sign-draft {
    padding: 8px !important;
    font-size: 10px !important;
    min-height: 32px !important;
  }
  
  /* Make scoreboard smaller */
  .scoreboard {
    font-size: 7px !important;
    padding: 6px !important;
    line-height: 1.2 !important;
  }
  
  #scoreboard-inning-text {
    margin-bottom: 6px !important;
  }
  
  /* Pre-fight layout fix */
  .pre-fight-columns {
    flex-direction: column !important;
    gap: 8px !important;
  }
  
  .roster-slot {
    padding: 4px 6px !important;
    font-size: 9px !important;
    margin-bottom: 3px !important;
  }
  
  .roster-slot .player-name {
    font-size: 10px !important;
  }
  
  .roster-slot-number {
    width: 14px !important;
    height: 14px !important;
    font-size: 9px !important;
    line-height: 14px !important;
  }
}
"""

css += aggressive_rules

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Aggressive CSS appended successfully.")
