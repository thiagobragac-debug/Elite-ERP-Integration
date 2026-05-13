import sys

file_path = r'c:\Saas\src\pages\Admin\SaaSAdminPanel.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Replace view-toggle-elite with elite-tab-group
    if '<div className="view-toggle-elite">' in line and '819' in str(lines.index(line) + 1):
        line = line.replace('view-toggle-elite', 'elite-tab-group')
    
    # Replace toggle-btn with elite-tab-item
    if 'className={`toggle-btn ${billingSubTab ===' in line:
        line = line.replace('toggle-btn', 'elite-tab-item')
    
    # Replace action-cluster with modern-actions
    if '<div className="action-cluster">' in line:
        line = line.replace('action-cluster', 'modern-actions')
    
    # Replace button classes for actions
    if 'className="action-btn-square info"' in line:
        line = line.replace('action-btn-square info', 'action-dot info').replace('Ver no Gateway', 'Logs')
    if 'className="action-btn-square success"' in line:
        line = line.replace('action-btn-square success', 'action-dot edit').replace('Gerar Fatura', 'Editar')
    if 'className="action-btn-square danger"' in line:
        line = line.replace('action-btn-square danger', 'action-dot delete').replace('Suspender Acesso', 'Suspender')
    
    # Replace icons
    if '<ArrowUpRight size={16} />' in line and '884' in str(lines.index(line) + 1):
        line = line.replace('ArrowUpRight', 'History').replace('size={16}', 'size={18}')
    if '<DollarSign size={16} />' in line and '887' in str(lines.index(line) + 1):
        line = line.replace('DollarSign', 'Edit2').replace('size={16}', 'size={18}')
    if '<Shield size={16} />' in line and '890' in str(lines.index(line) + 1):
        line = line.replace('size={16}', 'size={18}')

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
