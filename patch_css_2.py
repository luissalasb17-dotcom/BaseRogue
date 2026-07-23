import sys

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add global rule for .draft-cards
global_rule = "\n.draft-cards {\n  display: flex;\n  gap: 20px;\n  flex-wrap: wrap;\n  justify-content: center;\n}\n"
idx = css.find('@media')
css = css[:idx] + global_rule + css[idx:]

# Update mobile rules for draft scaling and combat arena
mobile_rules = """
  /* Further scale down match arena on mobile to fit the screen */
  .match-arena {
    transform: scale(0.85);
    transform-origin: top center;
    margin-bottom: -15vh; /* Adjust space at bottom due to scale */
  }

  /* Compact the draft cards on mobile */
  .draft-cards .player-card, .starter-selection .player-card, .draft-cards .card, .starter-selection .card, .starter-card-wrapper .card {
    max-width: 85vw !important;
    padding: 6px !important;
    font-size: 8px !important;
  }
  
  .popup-player-name {
    font-size: 9px !important;
    margin-bottom: 6px !important;
  }

  /* Hide synergy helpers in mobile draft to save space */
  .draft-synergy-helper {
    display: none !important;
  }
  
  /* Make draft button smaller */
  .btn-sign-draft {
    padding: 8px !important;
    font-size: 10px !important;
    min-height: 32px !important;
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
