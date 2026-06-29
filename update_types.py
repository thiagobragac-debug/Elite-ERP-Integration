import re

content = open('src/types/database.types.ts').read()
tables = ['lotes', 'pastos', 'pesagens', 'nutricao_animais', 'sanidade_animais', 'eventos_reprodutivos', 'confinamento', 'romaneios']
for t in tables:
    content = re.sub(r'(\s*' + t + r':\s*\{\s*Row:\s*\{[^}]*?)(\n\s*\})', r'\1\n          especie_id: string | null\n          aptidao_id: string | null\2', content)
    content = re.sub(r'(\s*' + t + r':\s*\{.*?Insert:\s*\{[^}]*?)(\n\s*\})', r'\1\n          especie_id?: string | null\n          aptidao_id?: string | null\2', content, flags=re.DOTALL)
    content = re.sub(r'(\s*' + t + r':\s*\{.*?Update:\s*\{[^}]*?)(\n\s*\})', r'\1\n          especie_id?: string | null\n          aptidao_id?: string | null\2', content, flags=re.DOTALL)

open('src/types/database.types.ts', 'w').write(content)
