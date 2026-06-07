const fs = require('fs');
const path = require('path');

// ─── 1. Fix BROKEN_IMPORT: add react-router-dom import ───────────────────────
const brokenImports = [
  'src/pages/Admin/ApprovalCenter.tsx',
  'src/pages/Admin/CompanyManagement.tsx',
  'src/pages/Finance/AccountsReceivable.tsx',
  'src/pages/Finance/BankAccounts.tsx',
  'src/pages/Fleet/FuelManagement.tsx',
  'src/pages/Fleet/MaintenanceManagement.tsx',
  'src/pages/Inventory/AuditManagement.tsx',
  'src/pages/Inventory/MovementManagement.tsx',
  'src/pages/Inventory/WarehouseManagement.tsx',
  'src/pages/Pecuaria/ConfinementManagement.tsx',
  'src/pages/Pecuaria/HealthManagement.tsx',
  'src/pages/Pecuaria/NutritionManagement.tsx',
  'src/pages/Pecuaria/PastureManagement.tsx',
  'src/pages/Pecuaria/ReproductionManagement.tsx',
  'src/pages/Pecuaria/WeightManagement.tsx',
  'src/pages/Purchasing/PurchaseOrder.tsx',
  'src/pages/Purchasing/SupplierManagement.tsx',
  'src/pages/Sales/Invoices.tsx',
  'src/pages/Sales/SalesOrders.tsx',
];

for (const relPath of brokenImports) {
  let content = fs.readFileSync(relPath, 'utf8');
  
  if (content.includes("from 'react-router-dom'")) {
    // Already has import line - add useSearchParams to it
    content = content.replace(
      /import \{([^}]+)\} from 'react-router-dom'/,
      (match, imports) => {
        if (imports.includes('useSearchParams')) return match;
        return `import {${imports.trimEnd()}, useSearchParams } from 'react-router-dom'`;
      }
    );
  } else {
    // No react-router-dom import at all - add after first React import line
    content = content.replace(
      /(import React[^\n]*\n)/,
      `$1import { useSearchParams } from 'react-router-dom';\n`
    );
  }
  
  fs.writeFileSync(relPath, content, 'utf8');
  console.log(`FIXED import: ${relPath}`);
}

// ─── 2. Fix DUPLICATE: pages that have BOTH useState AND useSearchParams ─────
// These were already migrated (have useSearchParams) but also still have the old
// useState. We need to remove the old useState line.
const duplicates = [
  'src/pages/Admin/UserManagement.tsx',
  'src/pages/Finance/AccountsPayable.tsx',
  'src/pages/Pecuaria/AnimalManagement.tsx',
  'src/pages/Sales/ClientManagement.tsx',
];

for (const relPath of duplicates) {
  let content = fs.readFileSync(relPath, 'utf8');
  
  // Remove the old useState declaration for activeTab if useSearchParams version exists
  const oldDecl = /\n?\s*const \[activeTab, setActiveTab\] = useState<[^>]+>\('[^']+'\);?\n?/g;
  const oldDeclUntyped = /\n?\s*const \[activeTab, setActiveTab\] = useState\('[^']+'\);?\n?/g;
  
  // Only remove if there's ALSO a useSearchParams-based activeTab
  if (content.includes("searchParams.get('tab')")) {
    const before = content;
    content = content.replace(oldDecl, '\n');
    content = content.replace(oldDeclUntyped, '\n');
    if (content !== before) {
      fs.writeFileSync(relPath, content, 'utf8');
      console.log(`FIXED duplicate: ${relPath}`);
    } else {
      console.log(`SKIP (no change needed): ${relPath}`);
    }
  }
}

// ─── 3. Fix TABS_WITHOUT_URL: pages with tabs but no useSearchParams ──────────
// AuditLog, FleetManagement, InventoryManagement, LotManagement
// These need full migration

function migrateFile(relPath) {
  let content = fs.readFileSync(relPath, 'utf8');
  
  if (content.includes('useSearchParams')) {
    console.log(`SKIP already has useSearchParams: ${relPath}`);
    return;
  }
  
  const typedMatch = content.match(/const \[activeTab, setActiveTab\] = useState<([^>]+)>\('([^']+)'\);/);
  const untypedMatch = content.match(/const \[activeTab, setActiveTab\] = useState\('([^']+)'\);/);
  
  if (!typedMatch && !untypedMatch) {
    console.log(`SKIP no activeTab found: ${relPath}`);
    return;
  }

  // Add import
  if (content.includes("from 'react-router-dom'")) {
    content = content.replace(
      /import \{([^}]+)\} from 'react-router-dom'/,
      (match, imports) => {
        if (imports.includes('useSearchParams')) return match;
        return `import {${imports.trimEnd()}, useSearchParams } from 'react-router-dom'`;
      }
    );
  } else {
    content = content.replace(
      /(import React[^\n]*\n)/,
      `$1import { useSearchParams } from 'react-router-dom';\n`
    );
  }

  // Replace declaration
  if (typedMatch) {
    const [full, type, defaultVal] = typedMatch;
    const replacement = `const [searchParams, setSearchParams] = useSearchParams();\n  const activeTab = (searchParams.get('tab') as ${type}) || '${defaultVal}';\n  const setActiveTab = (tab: string) => {\n    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });\n  };`;
    content = content.replace(full, replacement);
  } else if (untypedMatch) {
    const [full, defaultVal] = untypedMatch;
    const replacement = `const [searchParams, setSearchParams] = useSearchParams();\n  const activeTab = searchParams.get('tab') || '${defaultVal}';\n  const setActiveTab = (tab: string) => {\n    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });\n  };`;
    content = content.replace(full, replacement);
  }

  fs.writeFileSync(relPath, content, 'utf8');
  console.log(`MIGRATED: ${relPath}`);
}

const tabsWithoutUrl = [
  'src/pages/Admin/AuditLog.tsx',
  'src/pages/Fleet/FleetManagement.tsx',
  'src/pages/Inventory/InventoryManagement.tsx',
  'src/pages/Pecuaria/LotManagement.tsx',
];

for (const f of tabsWithoutUrl) {
  migrateFile(f);
}

console.log('\n=== All fixes applied. ===');
