import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';

const project = new Project({
  tsConfigFilePath: 'tsconfig.node.json',
  skipAddingFilesFromTsConfig: true
});

const sourceFiles = project.addSourceFilesAtPaths('src/pages/**/*.tsx');

const totalModernTables = 0;
let filesWithModernTable = 0;

const analysis: any = {
  usesReportData: [],
  usesServerPagination: [],
  usesCustomRange: [],
  noServerPagination: []
};

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  const text = sourceFile.getText();
  
  if (!text.includes('ModernTable')) {continue;}
  filesWithModernTable++;

  const usesReportData = text.includes('useReportData');
  const usesServerPagination = text.includes('useServerPagination');
  const usesCustomRange = text.includes('.range(');

  if (usesReportData) {
    analysis.usesReportData.push(filePath);
  } else if (usesServerPagination) {
    analysis.usesServerPagination.push(filePath);
  } else if (usesCustomRange) {
    analysis.usesCustomRange.push(filePath);
  } else {
    analysis.noServerPagination.push(filePath);
  }
}

console.log(`\n=== RELATÓRIO DE PAGINAÇÃO SERVER-SIDE ===`);
console.log(`Total de arquivos com ModernTable: ${filesWithModernTable}`);
console.log(`\n✅ COM PAGINAÇÃO SERVER-SIDE NATIVA (useReportData): ${analysis.usesReportData.length}`);
console.log(`✅ COM PAGINAÇÃO SERVER-SIDE INJETADA (useServerPagination): ${analysis.usesServerPagination.length}`);
console.log(`✅ COM PAGINAÇÃO CUSTOMIZADA COM .range(): ${analysis.usesCustomRange.length}`);
console.log(`\n❌ SEM PAGINAÇÃO SERVER-SIDE (Carregam tudo na memória): ${analysis.noServerPagination.length}`);

analysis.noServerPagination.forEach((f: string) => {
  console.log(` - ${f.split('src/pages/')[1]}`);
});
