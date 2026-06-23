import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';

const project = new Project({
  tsConfigFilePath: 'tsconfig.node.json',
  skipAddingFilesFromTsConfig: true
});

const sourceFiles = project.addSourceFilesAtPaths('src/pages/**/*.tsx');
let updatedFiles = 0;

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  
  const modernTables = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .filter(node => node.getTagNameNode().getText() === 'ModernTable');

  const modernTablesOpening = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    .filter(node => node.getTagNameNode().getText() === 'ModernTable');

  const allTables = [...modernTables, ...modernTablesOpening];
  if (allTables.length === 0) {continue;}

  let modified = false;
  const usesReportData = sourceFile.getText().includes('useReportData');
  
  for (const table of allTables) {
    const hasCurrentPage = table.getAttribute('currentPage');
    const hasTotalCount = table.getAttribute('totalCount');
    
    if (usesReportData && (!hasCurrentPage || !hasTotalCount)) {
      const text = sourceFile.getText();
      const hasPageVar = text.includes('setPage') || text.includes('page:');
      const hasTotalCountVar = text.includes('totalCount');
      
      console.log(`[${filePath}] hasPageVar: ${hasPageVar}, hasTotalCountVar: ${hasTotalCountVar}`);
      
      if (hasPageVar && hasTotalCountVar) {
        if (!hasCurrentPage) {
          table.addAttribute({ name: 'currentPage', initializer: '{page}' });
          table.addAttribute({ name: 'onPageChange', initializer: '{setPage}' });
          table.addAttribute({ name: 'itemsPerPage', initializer: '{pageSize}' });
          modified = true;
        }
        if (!hasTotalCount) {
          table.addAttribute({ name: 'totalCount', initializer: '{totalCount}' });
          modified = true;
        }
      }
    } else if (!usesReportData) {
      console.log(`[${filePath}] DOES NOT USE useReportData, needs manual injection`);
    }
  }

  if (modified) {
    sourceFile.saveSync();
    console.log(`Updated ${filePath}`);
    updatedFiles++;
  }
}

console.log(`\nDone! Updated ${updatedFiles} files.`);
