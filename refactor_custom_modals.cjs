const fs = require('fs');
const path = require('path');

const customModals = [
  'src/components/Forms/CampaignForm.tsx',
  'src/components/Forms/PlanForm.tsx',
  'src/components/Forms/TenantForm.tsx',
  'src/components/Modals/BatchWeightModal.tsx',
  'src/components/Modals/FinancialCalendarModal.tsx',
  'src/components/Modals/SupplierNetworkMapModal.tsx',
  'src/pages/Inventory/components/WarehouseStockModal.tsx'
];

for (const relPath of customModals) {
  const file = path.join(__dirname, relPath);
  if (!fs.existsSync(file)) continue;

  let content = fs.readFileSync(file, 'utf8');
  
  // Transform overlay to flex-end (right aligned)
  content = content.replace(/justifyContent:\s*['"]center['"]/g, "justifyContent: 'flex-end'");
  content = content.replace(/padding:\s*['"]20px['"]/g, "padding: '0'"); // remove outer padding so it touches the right edge
  
  // Transform container
  // Find animate-scale-up and replace with animate-slide-left
  content = content.replace(/animate-scale-up/g, 'animate-slide-left');
  
  // Update border radius to only round the left corners
  content = content.replace(/borderRadius:\s*['"]24px['"]/g, "borderRadius: '24px 0 0 24px'");
  
  // Update maxHeight and height
  content = content.replace(/maxHeight:\s*['"]90vh['"]/g, "maxHeight: '100vh', height: '100vh'");
  content = content.replace(/maxHeight:\s*['"]80vh['"]/g, "maxHeight: '100vh', height: '100vh'");
  content = content.replace(/maxHeight:\s*['"]85vh['"]/g, "maxHeight: '100vh', height: '100vh'");

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Converted custom modal: ${relPath}`);
}
