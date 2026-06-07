const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/Admin/ApprovalCenter.tsx',
  'src/pages/Admin/CompanyManagement.tsx',
  'src/pages/Admin/SaaSAdminPanel.tsx',
  'src/pages/Admin/TenantBilling.tsx',
  'src/pages/Finance/AccountsPayable.tsx',
  'src/pages/Finance/AccountsReceivable.tsx',
  'src/pages/Finance/BankAccounts.tsx',
  'src/pages/Finance/CashFlow.tsx',
  'src/pages/Finance/LCDPR/LCDPRPage.tsx',
  'src/pages/Fleet/FuelManagement.tsx',
  'src/pages/Fleet/MaintenanceManagement.tsx',
  'src/pages/Inventory/AuditManagement.tsx',
  'src/pages/Inventory/MovementManagement.tsx',
  'src/pages/Inventory/WarehouseDetails.tsx',
  'src/pages/Inventory/WarehouseManagement.tsx',
  'src/pages/Pecuaria/ConfinementManagement.tsx',
  'src/pages/Pecuaria/HealthManagement.tsx',
  'src/pages/Pecuaria/NutritionManagement.tsx',
  'src/pages/Pecuaria/PastureManagement.tsx',
  'src/pages/Pecuaria/ReproductionManagement.tsx',
  'src/pages/Pecuaria/WeightManagement.tsx',
  'src/pages/Purchasing/EntryInvoice.tsx',
  'src/pages/Purchasing/PurchaseOrder.tsx',
  'src/pages/Purchasing/PurchaseRequest.tsx',
  'src/pages/Purchasing/QuotationMap.tsx',
  'src/pages/Purchasing/SupplierManagement.tsx',
  'src/pages/Sales/Contracts.tsx',
  'src/pages/Sales/Invoices.tsx',
  'src/pages/Sales/SalesOrders.tsx',
];

let migrated = 0;
let skipped = 0;
let errors = 0;

for (const relPath of files) {
  const filePath = path.resolve(relPath);
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already migrated
    if (content.includes('useSearchParams')) {
      console.log(`SKIP (already has useSearchParams): ${relPath}`);
      skipped++;
      continue;
    }

    // Find typed useState: const [activeTab, setActiveTab] = useState<'A'|'B'>('A');
    const typedMatch = content.match(/const \[activeTab, setActiveTab\] = useState<([^>]+)>\('([^']+)'\);/);
    // Find untyped useState: const [activeTab, setActiveTab] = useState('A');
    const untypedMatch = content.match(/const \[activeTab, setActiveTab\] = useState\('([^']+)'\);/);

    if (!typedMatch && !untypedMatch) {
      console.log(`SKIP (no activeTab useState): ${relPath}`);
      skipped++;
      continue;
    }

    // 1. Add useSearchParams import
    if (content.includes("from 'react-router-dom'")) {
      // Add to existing react-router-dom import
      content = content.replace(
        /import \{([^}]+)\} from 'react-router-dom'/,
        (match, imports) => {
          if (imports.includes('useSearchParams')) return match;
          return `import {${imports}, useSearchParams } from 'react-router-dom'`;
        }
      );
    } else {
      // Add new import line after the first import from 'react'
      content = content.replace(
        /(import React[^\n]*;\n)/,
        `$1import { useSearchParams } from 'react-router-dom';\n`
      );
    }

    // 2. Replace the useState declaration
    if (typedMatch) {
      const [full, type, defaultVal] = typedMatch;
      const replacement = `const [searchParams, setSearchParams] = useSearchParams();\n  const activeTab = (searchParams.get('tab') as ${type}) || '${defaultVal}';\n  const setActiveTab = (tab: string) => {\n    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });\n  };`;
      content = content.replace(full, replacement);
    } else if (untypedMatch) {
      const [full, defaultVal] = untypedMatch;
      const replacement = `const [searchParams, setSearchParams] = useSearchParams();\n  const activeTab = searchParams.get('tab') || '${defaultVal}';\n  const setActiveTab = (tab: string) => {\n    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });\n  };`;
      content = content.replace(full, replacement);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`DONE: ${relPath}`);
    migrated++;
  } catch (err) {
    console.error(`ERROR: ${relPath}: ${err.message}`);
    errors++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Migrated: ${migrated}`);
console.log(`Skipped:  ${skipped}`);
console.log(`Errors:   ${errors}`);
