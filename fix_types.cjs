const fs = require('fs');
const files = [
  'AssignAnimalForm.tsx','AuditForm.tsx','CampaignForm.tsx','ClientForm.tsx','CompanyForm.tsx','ConfinementForm.tsx','ContractForm.tsx','EntryInvoiceForm.tsx','FarmForm.tsx','FuelForm.tsx','HealthForm.tsx','InsumoEntryTable.tsx','MachineForm.tsx','MaintenanceForm.tsx','OutputInvoiceForm.tsx','PastureManejoForm.tsx','PastureRelocateForm.tsx','PlanForm.tsx','ProductForm.tsx','PurchaseOrderForm.tsx','PurchaseRequestForm.tsx','QuotationForm.tsx','ReconciliationForm.tsx','RelocateForm.tsx','ReproductionForm.tsx','SalesOrderForm.tsx','SupplierForm.tsx','TenantForm.tsx','TransactionForm.tsx','UserForm.tsx', 'BankAccountForm.tsx', 'LotForm.tsx', 'PastureForm.tsx', 'AnimalForm.tsx'
];

files.forEach(f => {
  let p = 'src/components/Forms/' + f;
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  let changed = false;
  
  if (c.includes('<SearchableSelect') && !c.includes('import { SearchableSelect }')) {
    // find the last import and insert after
    const lastImportIndex = c.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = c.indexOf('\n', lastImportIndex);
      c = c.substring(0, endOfLine + 1) + "import { SearchableSelect } from './SearchableSelect';\n" + c.substring(endOfLine + 1);
      changed = true;
    } else {
      c = "import { SearchableSelect } from './SearchableSelect';\n" + c;
      changed = true;
    }
  }
  
  if (c.includes('(val) =>')) {
    c = c.replace(/\(val\) =>/g, '(val: any) =>');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(p, c);
    console.log(f);
  }
});
