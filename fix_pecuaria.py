import re

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix trend
    content = re.sub(r"trend: 'up'([,}])", r"trend: 'up' as const\1", content)
    content = re.sub(r"trend: 'down'([,}])", r"trend: 'down' as const\1", content)
    content = re.sub(r"trend: 'neutral'([,}])", r"trend: 'neutral' as const\1", content)

    # Fix withTimeout
    content = re.sub(r'withTimeout\((query[^)]+\.range\([^)]+\))\)', r'withTimeout((\1 as unknown) as Promise<any>) as any', content)
    content = re.sub(r'withTimeout\((applyFilters\([^)]+\))\)', r'withTimeout((\1 as unknown) as Promise<any>) as any', content)
    content = re.sub(r'withTimeout\((fetch[A-Za-z0-9_]+)\)', r'withTimeout((\1 as unknown) as Promise<any>) as any', content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('c:/Saas/src/hooks/report-handlers/pecuaria.ts')
