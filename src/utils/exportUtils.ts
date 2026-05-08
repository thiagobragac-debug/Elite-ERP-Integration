/**
 * Utilitário de Exportação Elite ERP v5.0
 * Gera arquivos CSV/XLSX compatíveis com o Excel brasileiro
 */

export const exportToExcel = (data: any[], columns: any[], title: string) => {
  if (!data || data.length === 0) {
    console.error("Nenhum dado para exportar");
    return;
  }

  // BOM para garantir que o Excel reconheça UTF-8 (acentos brasileiros)
  const BOM = "\uFEFF";
  
  // Cabeçalho das colunas separado por ponto e vírgula (padrão Excel Brasil)
  const csvHeader = columns.map(col => col.header).join(';') + '\n';
  
  // Linhas de dados
  const csvRows = data.map(item => {
    return columns.map(col => {
      const val = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
      // Trata aspas e remove quebras de linha para não quebrar o CSV
      const cleanVal = String(val || '').replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${cleanVal}"`;
    }).join(';');
  }).join('\n');

  const csvContent = BOM + csvHeader + csvRows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
