import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

/**
 * Utility to export data to CSV format
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    toast.error('Não há dados para exportar.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) {
        return '""';
      }
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Utility to export data to Excel format (.xlsx)
 */
export const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    toast.error('Não há dados para exportar.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

  // Download file
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Utility to export data to a professional PDF format
 */
export const exportToPDF = (data: any[], filename: string, title: string) => {
  if (!data || data.length === 0) {
    toast.error('Não há dados para exportar.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Design
  doc.setFillColor(15, 23, 42); // Navy blue
  doc.rect(0, 0, 297, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('TAUZE ERP v5.0', 14, 18);

  doc.setFontSize(10);
  doc.text(`RELATÓRIO: ${title.toUpperCase()}`, 14, 28);
  doc.text(`GERADO EM: ${new Date().toLocaleString('pt-BR')}`, 14, 34);

  // Table
  const headers = Object.keys(data[0]);
  const rows = data.map((obj) => headers.map((header) => obj[header]));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 45,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Special CSV export configured for Brazilian Excel compatibility
 * Uses BOM and ';' column separators
 */
export const exportToBrazilianCSV = (data: any[], columns: any[], title: string) => {
  if (!data || data.length === 0) {
    toast.error('Nenhum dado para exportar');
    return;
  }

  // BOM para garantir que o Excel reconheça UTF-8 (acentos brasileiros)
  const BOM = '\uFEFF';

  // Cabeçalho das colunas separado por ponto e vírgula (padrão Excel Brasil)
  const csvHeader = `${columns.map((col) => col.header).join(';')}\n`;

  // Linhas de dados
  const csvRows = data
    .map((item) => {
      return columns
        .map((col) => {
          const val = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
          // Trata aspas e remove quebras de linha para não quebrar o CSV
          const cleanVal = String(val || '')
            .replace(/"/g, '""')
            .replace(/\n/g, ' ');
          return `"${cleanVal}"`;
        })
        .join(';');
    })
    .join('\n');

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

