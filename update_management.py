import re

def update_file(filepath, pattern, replacement):
    content = open(filepath, 'r', encoding='utf-8').read()
    if 'especie_id' not in content:
        content = re.sub(pattern, replacement, content, count=1)
        open(filepath, 'w', encoding='utf-8').write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Already updated {filepath}")

# LotManagement.tsx
update_file(
    'src/pages/Bovinocultura/LotManagement.tsx',
    r'(const payload = \{[\s\S]*?)(};)',
    r"\1  especie_id: 'bovino',\n      aptidao_id: 'corte',\n    \2"
)

# PastureManagement.tsx
update_file(
    'src/pages/Bovinocultura/PastureManagement.tsx',
    r'(const payload = \{[\s\S]*?)(};)',
    r"\1  especie_id: 'bovino',\n      aptidao_id: 'corte',\n    \2"
)

# ConfinementManagement.tsx
update_file(
    'src/pages/Bovinocultura/ConfinementManagement.tsx',
    r'(const payload = \{[\s\S]*?)(};)',
    r"\1  especie_id: 'bovino',\n      aptidao_id: 'corte',\n    \2"
)

