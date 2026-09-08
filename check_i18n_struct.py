import re

i18n = open('src/i18n.js', encoding='utf-8').read()

# Check if challenge162 exists as its own section (nested object)
keys_to_check = [
    'rotation_title_5',
    'bullpen_title_6', 
    'cancel',
    'pack_transition_title',
    'packs_draft_stage',
    'roster_count',
]

# Find lines containing these keys
lines = i18n.split('\n')
for k in keys_to_check:
    matches = [(i+1, l.strip()) for i,l in enumerate(lines) if k in l]
    if matches:
        print(f"KEY '{k}' found at lines:")
        for ln, content in matches[:3]:
            print(f"  L{ln}: {content[:120]}")
    else:
        print(f"KEY '{k}' NOT FOUND!")
