import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

with open('challenge162.js', encoding='utf-8') as f:
    content = f.read()
    
lines = content.split('\n')
# Find all lines with _t( calls related to known buggy keys
search_terms = ['.challenge162.', 'rotation_title', 'bullpen_title', 'challenge162.cancel', 'challenge162.roster_count']
for i, line in enumerate(lines):
    for term in search_terms:
        if term in line:
            print(f'L{i+1}: {line.strip()[:120]}')
            break
