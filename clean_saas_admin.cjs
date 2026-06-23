const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project();
project.addSourceFilesAtPaths("C:/Saas/src/pages/Admin/SaaSAdminPanel/**/*.{ts,tsx}");

let modifiedFiles = 0;

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;

  // Find all CallExpressions
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  // We want to unwrap `withTenant(...)`
  // Because the tree might change, we collect them first and process bottom-up or just use a loop.
  const withTenantCalls = [];
  for (const callExpr of callExpressions) {
    if (callExpr.getExpression().getText() === 'withTenant') {
      withTenantCalls.push(callExpr);
    }
  }

  // Process in reverse to avoid breaking offsets
  for (let i = withTenantCalls.length - 1; i >= 0; i--) {
    const callExpr = withTenantCalls[i];
    const args = callExpr.getArguments();
    if (args.length === 1) {
      callExpr.replaceWithText(args[0].getText());
      changed = true;
    }
  }

  // Remove `const { withTenant } = useTenantQuery();` or similar
  const varDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  for (const decl of varDecls) {
    const init = decl.getInitializer();
    if (init && init.getText() === 'useTenantQuery()') {
      const stmt = decl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
      if (stmt) {
        stmt.remove();
        changed = true;
      }
    }
  }

  // Remove import
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue().includes('useTenantQuery')) {
      imp.remove();
      changed = true;
    }
  }

  if (changed) {
    sourceFile.saveSync();
    modifiedFiles++;
    console.log(`Cleaned ${sourceFile.getBaseName()}`);
  }
}

console.log(`Finished. Modified ${modifiedFiles} files.`);
