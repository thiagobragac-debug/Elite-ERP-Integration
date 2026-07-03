const fs = require('fs');
const filePath = 'c:/Saas/src/pages/Admin/SaaSAdminPanel/components/LandingPageSettings.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const insertIndex = lines.findIndex(line => line.includes("case 'features':"));

if (insertIndex > -1) {
  const ui = 
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Tema Padrão</span>
                  <select
                    className="tauze-input"
                    style={{ width: 120, padding: '4px 8px' }}
                    value={defaultTheme}
                    onChange={e => setDefaultTheme(e.target.value as 'light' | 'dark')}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>;
  // We want to insert it inside the case 'hero': block, before it ends. 
  // It usually ends with           </div>\n        );\n      case 'features':.
  // So we can insert it just before             </div>\n          </div>\n        );
  
  // Let's find the </div> that closes the inner grid or section. 
  // Easier: just find Exibir Mockup do Sistema and insert after its container.
  
  let mockupIndex = lines.findIndex(line => line.includes("Exibir Mockup do Sistema"));
  
  if (mockupIndex > -1) {
    // The mockup container is 4 lines usually:
    // <div style={{ display: 'flex', ...}}>
    //   <span>Exibir Mockup...</span>
    //   <ToggleSwitch />
    // </div>
    // So we insert at mockupIndex + 3
    lines.splice(mockupIndex + 3, 0, ui);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("Successfully injected UI.");
  } else {
    console.log("Mockup line not found.");
  }
} else {
  console.log("Features line not found.");
}
