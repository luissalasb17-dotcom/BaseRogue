import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

with open('src/i18n.js', encoding='utf-8') as f:
    lines = f.readlines()

# Check if rotation_title (without _5) and bullpen_title (without _6) exist
for i, line in enumerate(lines):
    if '"rotation_title"' in line or '"bullpen_title"' in line:
        print(f'L{i+1}: {line.strip()[:120]}')
